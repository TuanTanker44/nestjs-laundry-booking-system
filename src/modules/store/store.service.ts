import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MapsService } from '../../utils/maps/maps.service.js';
import { haversineKm } from '../../utils/maps/distance.util.js';
import { CreateStoreDto } from './dto/create-store.dto.js';
import { UpdateStoreDto } from './dto/update-store.dto.js';
import { QueryStoreDto } from './dto/query-store.dto.js';

type StoreRecord = Prisma.laundry_storesGetPayload<object>;

interface Actor {
  id: number;
  role: string;
}

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapsService: MapsService,
  ) {}

  /**
   * Prisma trả Decimal cho latitude/longitude (JSON thành chuỗi),
   * đổi sang number để client dễ dùng.
   */
  private serialize(store: StoreRecord) {
    return {
      ...store,
      latitude: store.latitude?.toNumber() ?? null,
      longitude: store.longitude?.toNumber() ?? null,
    };
  }

  /**
   * Geocoding best-effort: nếu dịch vụ bản đồ lỗi vẫn cho lưu cửa hàng
   * nhưng tọa độ là null (admin có thể gửi tọa độ thủ công sau).
   */
  private async tryGeocode(address: string) {
    try {
      const { lat, lng } = await this.mapsService.geocodeAddress(
        `${address}, Vietnam`,
      );

      return { latitude: lat, longitude: lng };
    } catch (error) {
      this.logger.warn(
        `Geocoding failed for "${address}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return { latitude: null, longitude: null };
    }
  }

  private assertCoordinatePair(
    latitude: number | undefined,
    longitude: number | undefined,
  ) {
    if ((latitude === undefined) !== (longitude === undefined)) {
      throw new BadRequestException(
        'latitude and longitude must be provided together',
      );
    }
  }

  private async getStoreOrThrow(id: number) {
    const store = await this.prisma.laundry_stores.findUnique({
      where: { id },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  /**
   * Admin quản lý mọi cửa hàng; laundry_staff chỉ quản lý cửa hàng được gán.
   */
  private async assertCanManage(actor: Actor, storeId: number) {
    if (actor.role === 'admin') {
      return;
    }

    const assignment = await this.prisma.staff_assignments.findUnique({
      where: {
        staff_id_store_id: { staff_id: actor.id, store_id: storeId },
      },
      select: { id: true },
    });

    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this store');
    }
  }

  /**
   * Dành cho module khác (vd. store-schedule): cửa hàng phải tồn tại
   * và người dùng phải có quyền quản lý (admin hoặc staff được gán).
   */
  async assertCanManageStore(actor: Actor, storeId: number) {
    await this.getStoreOrThrow(storeId);
    await this.assertCanManage(actor, storeId);
  }

  /** Dành cho API public của module khác: cửa hàng inactive coi như không tồn tại. */
  async assertActive(storeId: number) {
    const store = await this.getStoreOrThrow(storeId);

    if (store.status !== 'active') {
      throw new NotFoundException('Store not found');
    }
  }

  private buildWhere(
    query: QueryStoreDto,
    base: Prisma.laundry_storesWhereInput,
  ): Prisma.laundry_storesWhereInput {
    const search = query.search?.trim();

    return {
      ...base,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
    };
  }

  /**
   * Danh sách có phân trang. Nếu có (lat, lng) thì sắp xếp theo khoảng cách
   * và trả thêm distance_km; ngược lại sắp xếp theo tên.
   */
  private async paginate(
    query: QueryStoreDto,
    where: Prisma.laundry_storesWhereInput,
  ) {
    this.assertCoordinatePair(query.lat, query.lng);

    const { page, limit } = query;

    if (query.lat !== undefined && query.lng !== undefined) {
      const origin = { lat: query.lat, lng: query.lng };

      // Số cửa hàng ít nên tính khoảng cách trong code là đủ.
      // Nếu dữ liệu lớn, chuyển sang truy vấn SQL (PostGIS hoặc Haversine).
      const stores = await this.prisma.laundry_stores.findMany({ where });

      const sorted = stores
        .map((store) => {
          const data = this.serialize(store);
          const distance_km =
            data.latitude !== null && data.longitude !== null
              ? Math.round(
                  haversineKm(origin, {
                    lat: data.latitude,
                    lng: data.longitude,
                  }) * 10,
                ) / 10
              : null;

          return { ...data, distance_km };
        })
        .sort(
          (a, b) =>
            (a.distance_km ?? Number.POSITIVE_INFINITY) -
            (b.distance_km ?? Number.POSITIVE_INFINITY),
        );

      return {
        data: sorted.slice((page - 1) * limit, page * limit),
        meta: this.buildMeta(sorted.length, page, limit),
      };
    }

    const [total, stores] = await this.prisma.$transaction([
      this.prisma.laundry_stores.count({ where }),
      this.prisma.laundry_stores.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: stores.map((store) => this.serialize(store)),
      meta: this.buildMeta(total, page, limit),
    };
  }

  private buildMeta(total: number, page: number, limit: number) {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Public: chỉ các cửa hàng đang hoạt động. */
  findAllActive(query: QueryStoreDto) {
    return this.paginate(query, this.buildWhere(query, { status: 'active' }));
  }

  /**
   * Cho admin / staff: admin thấy tất cả, staff chỉ thấy cửa hàng được gán.
   * Có thể lọc theo status (kể cả inactive).
   */
  findAllManageable(actor: Actor, query: QueryStoreDto) {
    const base: Prisma.laundry_storesWhereInput = {
      ...(query.status && { status: query.status }),
      ...(actor.role !== 'admin' && {
        staff_assignments: { some: { staff_id: actor.id } },
      }),
    };

    return this.paginate(query, this.buildWhere(query, base));
  }

  /** Public: cửa hàng inactive coi như không tồn tại. */
  async findActiveById(id: number) {
    const store = await this.getStoreOrThrow(id);

    if (store.status !== 'active') {
      throw new NotFoundException('Store not found');
    }

    return this.serialize(store);
  }

  async create(actor: Actor, dto: CreateStoreDto) {
    this.assertCoordinatePair(dto.latitude, dto.longitude);

    const coordinates =
      dto.latitude !== undefined && dto.longitude !== undefined
        ? { latitude: dto.latitude, longitude: dto.longitude }
        : await this.tryGeocode(dto.address);

    const store = await this.prisma.laundry_stores.create({
      data: {
        name: dto.name,
        address: dto.address,
        description: dto.description,
        phone: dto.phone,
        image_url: dto.image_url,
        cancellation_hours_before: dto.cancellation_hours_before,
        cancellation_refund_percent: dto.cancellation_refund_percent,
        status: dto.status,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        created_by: actor.id,
      },
    });

    return this.serialize(store);
  }

  async update(actor: Actor, id: number, dto: UpdateStoreDto) {
    this.assertCoordinatePair(dto.latitude, dto.longitude);

    const current = await this.getStoreOrThrow(id);
    await this.assertCanManage(actor, id);

    if (actor.role !== 'admin' && dto.status !== undefined) {
      throw new ForbiddenException('Only admin can change store status');
    }

    const hasManualCoordinates =
      dto.latitude !== undefined && dto.longitude !== undefined;
    const addressChanged =
      dto.address !== undefined && dto.address !== current.address;

    let coordinates: { latitude: number | null; longitude: number | null } | null =
      null;

    if (hasManualCoordinates) {
      coordinates = { latitude: dto.latitude!, longitude: dto.longitude! };
    } else if (addressChanged) {
      // Địa chỉ đổi thì không giữ tọa độ cũ.
      coordinates = await this.tryGeocode(dto.address!);
    }

    // latitude/longitude trong dto chỉ là input; giá trị lưu DB lấy từ `coordinates`.
    const { latitude: _lat, longitude: _lng, ...fields } = dto;

    const store = await this.prisma.laundry_stores.update({
      where: { id },
      data: { ...fields, ...coordinates },
    });

    return this.serialize(store);
  }

  /**
   * Xóa mềm: chuyển sang inactive vì bookings, services... tham chiếu tới store.
   */
  async deactivate(id: number) {
    await this.getStoreOrThrow(id);

    await this.prisma.laundry_stores.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return { message: 'Store deactivated successfully' };
  }

  async assignStaff(storeId: number, staffId: number) {
    await this.getStoreOrThrow(storeId);

    const staff = await this.prisma.users.findUnique({
      where: { id: staffId },
      select: { id: true, role: true, status: true },
    });

    if (!staff) {
      throw new NotFoundException('Staff user not found');
    }

    if (staff.role !== 'laundry_staff') {
      throw new BadRequestException('User is not a laundry staff');
    }

    if (staff.status !== 'active') {
      throw new BadRequestException('Staff account is not active');
    }

    try {
      await this.prisma.staff_assignments.create({
        data: { staff_id: staffId, store_id: storeId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Staff is already assigned to this store');
      }

      throw error;
    }

    return { message: 'Staff assigned successfully' };
  }

  async unassignStaff(storeId: number, staffId: number) {
    const { count } = await this.prisma.staff_assignments.deleteMany({
      where: { store_id: storeId, staff_id: staffId },
    });

    if (count === 0) {
      throw new NotFoundException('Assignment not found');
    }

    return { message: 'Staff unassigned successfully' };
  }
}
