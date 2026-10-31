
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { MapsService } from '../../utils/maps/maps.service.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapsService: MapsService,
  ) {}

  /**
   * Ghép các thành phần địa chỉ để geocoding.
   */
  private buildFullAddress(data: {
    address_line: string;
    ward?: string | null;
    district?: string | null;
    city?: string | null;
  }): string {
    return [
      data.address_line,
      data.ward,
      data.district,
      data.city,
      'Vietnam',
    ]
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Geocoding theo cơ chế best-effort.
   * Nếu dịch vụ bản đồ lỗi, vẫn cho phép lưu địa chỉ,
   * nhưng tọa độ sẽ là null.
   */
  private async tryGeocode(data: {
    address_line: string;
    ward?: string | null;
    district?: string | null;
    city?: string | null;
  }) {
    try {
      const coordinates = await this.mapsService.geocodeAddress(
        this.buildFullAddress(data),
      );

      return {
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      };
    } catch (error) {
      this.logger.warn(
        `Geocoding failed for "${this.buildFullAddress(data)}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return {
        latitude: null,
        longitude: null,
      };
    }
  }

  /**
   * Tạo địa chỉ cho user hiện tại.
   * Địa chỉ đầu tiên luôn là địa chỉ mặc định.
   */
  async create(userId: number, dto: CreateAddressDto) {
    const duplicate = await this.prisma.addresses.findFirst({
      where: {
        address_line: dto.address_line,
        ward: dto.ward ?? null,
        district: dto.district ?? null,
        city: dto.city ?? null,
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException('Address already exists');
    }

    const coordinates = await this.tryGeocode(dto);

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.addresses.count({
        where: { user_id: userId },
      });

      const isDefault = count === 0 || dto.is_default === true;

      if (isDefault) {
        await tx.addresses.updateMany({
          where: { user_id: userId },
          data: { is_default: false },
        });
      }

      return tx.addresses.create({
        data: {
          user_id: userId,
          label: dto.label,
          recipient_name: dto.recipient_name,
          phone: dto.phone,
          address_line: dto.address_line,
          ward: dto.ward,
          district: dto.district,
          city: dto.city,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          is_default: isDefault,
        },
      });
    });
  }

  /**
   * Lấy toàn bộ địa chỉ của user.
   */
  async findAllByUser(userId: number) {
    return this.prisma.addresses.findMany({
      where: { user_id: userId },
      orderBy: [
        { is_default: 'desc' },
        { created_at: 'desc' },
      ],
    });
  }

  /**
   * Lấy một địa chỉ và xác minh quyền sở hữu.
   */
  async findOneByUser(userId: number, addressId: number) {
    const address = await this.prisma.addresses.findFirst({
      where: {
        id: addressId,
        user_id: userId,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  /**
   * Cập nhật thông tin địa chỉ.
   * Nếu thành phần địa chỉ thay đổi thì geocoding lại.
   */
  async update(
    userId: number,
    addressId: number,
    dto: UpdateAddressDto,
  ) {
    const current = await this.findOneByUser(userId, addressId);

    const nextAddress = {
      address_line: dto.address_line ?? current.address_line,
      ward: dto.ward === undefined ? current.ward : dto.ward,
      district:
        dto.district === undefined ? current.district : dto.district,
      city: dto.city === undefined ? current.city : dto.city,
    };

    const locationChanged =
      nextAddress.address_line !== current.address_line ||
      nextAddress.ward !== current.ward ||
      nextAddress.district !== current.district ||
      nextAddress.city !== current.city;

    // Chỉ gọi Maps API nếu thông tin vị trí thực sự thay đổi.
    const coordinates = locationChanged
      ? await this.tryGeocode(nextAddress)
      : null;

    // Luôn phải còn đúng một địa chỉ mặc định: muốn đổi thì đặt địa chỉ khác làm mặc định.
    if (dto.is_default === false && current.is_default) {
      throw new BadRequestException(
        'Cannot unset the default address, set another address as default instead',
      );
    }

    const becomesDefault = dto.is_default === true && !current.is_default;

    return this.prisma.$transaction(async (tx) => {
      // Bỏ mặc định của địa chỉ cũ trước, rồi mới đặt địa chỉ này làm mặc định.
      if (becomesDefault) {
        await tx.addresses.updateMany({
          where: { user_id: userId, is_default: true, id: { not: addressId } },
          data: { is_default: false },
        });
      }

      return tx.addresses.update({
        where: { id: addressId },
        data: {
          ...(dto.label !== undefined && { label: dto.label }),
          ...(dto.recipient_name !== undefined && {
            recipient_name: dto.recipient_name,
          }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.address_line !== undefined && {
            address_line: dto.address_line,
          }),
          ...(dto.ward !== undefined && { ward: dto.ward }),
          ...(dto.district !== undefined && {
            district: dto.district,
          }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(becomesDefault && { is_default: true }),

          // Không giữ tọa độ cũ khi địa chỉ đã thay đổi.
          ...(locationChanged && {
            latitude: coordinates?.latitude ?? null,
            longitude: coordinates?.longitude ?? null,
          }),
        },
      });
    });
  }

  /**
   * Đặt địa chỉ mặc định.
   * Cập nhật tất cả trong cùng transaction.
   */
  async setDefault(userId: number, addressId: number) {
    await this.findOneByUser(userId, addressId);

    return this.prisma.$transaction(async (tx) => {
      await tx.addresses.updateMany({
        where: { user_id: userId },
        data: { is_default: false },
      });

      return tx.addresses.update({
        where: { id: addressId },
        data: { is_default: true },
      });
    });
  }

  /**
   * Xóa địa chỉ.
   * Nếu xóa địa chỉ mặc định, chọn địa chỉ khác thay thế.
   */
  async remove(userId: number, addressId: number) {
    const address = await this.findOneByUser(userId, addressId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.addresses.delete({
          where: { id: addressId },
        });

        if (address.is_default) {
          const nextAddress = await tx.addresses.findFirst({
            where: { user_id: userId },
            orderBy: { created_at: 'asc' },
          });

          if (nextAddress) {
            await tx.addresses.update({
              where: { id: nextAddress.id },
              data: { is_default: true },
            });
          }
        }

        return { message: 'Address deleted successfully' };
      });
    } catch (error) {
      // PostgreSQL foreign-key constraint violation.
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Cannot delete this address because it is being used by another record',
        );
      }

      throw error;
    }
  }
}
