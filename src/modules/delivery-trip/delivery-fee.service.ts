import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { haversineKm } from '../../utils/maps/distance.util.js';
import type { Coordinates } from '../../utils/maps/interfaces/coordinates.interface.js';
import { MapsService } from '../../utils/maps/maps.service.js';
import {
  DELIVERY_FALLBACK_FACTOR,
  DELIVERY_MAX_KM,
  computeLegFee,
} from '../../utils/delivery-trip/delivery-fee.util.js';

export interface DeliveryLeg {
  address_id: number;
  distance_km: number;
  fee: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

@Injectable()
export class DeliveryFeeService {
  private readonly logger = new Logger(DeliveryFeeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapsService: MapsService,
  ) {}

  /**
   * Phí giao của một đơn: lượt lấy đồ + lượt giao trả, mỗi lượt tính theo
   * khoảng cách đường bộ cửa hàng <-> địa chỉ. Chỉ nhận địa chỉ của chính khách.
   * Gọi API đường đi bên ngoài nên KHÔNG gọi bên trong transaction.
   */
  async quote(
    customerId: number,
    storeId: number,
    pickupAddressId: number,
    deliveryAddressId: number,
  ) {
    const storePoint = await this.getStorePoint(storeId);

    const legs = new Map<number, DeliveryLeg>();

    for (const addressId of new Set([pickupAddressId, deliveryAddressId])) {
      legs.set(addressId, await this.quoteLeg(customerId, storePoint, addressId));
    }

    const pickup = legs.get(pickupAddressId)!;
    const delivery = legs.get(deliveryAddressId)!;

    return { pickup, delivery, total_fee: pickup.fee + delivery.fee };
  }

  private async getStorePoint(storeId: number): Promise<Coordinates> {
    const store = await this.prisma.laundry_stores.findUnique({
      where: { id: storeId },
      select: { status: true, latitude: true, longitude: true },
    });

    if (!store || store.status !== 'active') {
      throw new NotFoundException('Store not found');
    }

    if (store.latitude === null || store.longitude === null) {
      throw new BadRequestException('Store has no coordinates yet');
    }

    return { lat: store.latitude.toNumber(), lng: store.longitude.toNumber() };
  }

  private async quoteLeg(
    customerId: number,
    storePoint: Coordinates,
    addressId: number,
  ): Promise<DeliveryLeg> {
    const address = await this.prisma.addresses.findFirst({
      where: { id: addressId, user_id: customerId },
      select: { latitude: true, longitude: true },
    });

    if (!address) {
      throw new BadRequestException('Address not found');
    }

    if (address.latitude === null || address.longitude === null) {
      throw new BadRequestException(
        'Address has no coordinates, please update the address',
      );
    }

    const distanceKm = await this.distanceKm(storePoint, {
      lat: address.latitude.toNumber(),
      lng: address.longitude.toNumber(),
    });

    if (distanceKm > DELIVERY_MAX_KM) {
      throw new BadRequestException(
        `Address is too far for delivery (max ${DELIVERY_MAX_KM} km)`,
      );
    }

    return {
      address_id: addressId,
      distance_km: round2(distanceKm),
      fee: computeLegFee(distanceKm),
    };
  }

  /** Khoảng cách đường bộ (km); dịch vụ đường đi lỗi thì ước lượng từ đường chim bay. */
  private async distanceKm(from: Coordinates, to: Coordinates) {
    try {
      const { distanceMeters } = await this.mapsService.computeRoute(from, to);

      return distanceMeters / 1000;
    } catch (error) {
      // 400 = không có đường đi / tọa độ sai: lỗi của dữ liệu, không ước lượng.
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.warn(
        `Routing failed, using straight-line estimate: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return haversineKm(from, to) * DELIVERY_FALLBACK_FACTOR;
    }
  }
}
