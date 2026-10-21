import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StoreService } from '../store/store.service.js';
import { CreateLaundryServiceDto } from './dto/create-laundry-service.dto.js';
import { UpdateLaundryServiceDto } from './dto/update-laundry-service.dto.js';
import { QueryLaundryServiceDto } from './dto/query-laundry-service.dto.js';

type ServiceRecord = Prisma.servicesGetPayload<object>;

interface Actor {
  id: number;
  role: string;
}

@Injectable()
export class LaundryServiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeService: StoreService,
  ) {}

  /**
   * Decimal trả về JSON dạng chuỗi, đổi sang number cho client.
   * `scope` cho biết dịch vụ riêng của cửa hàng hay dùng chung toàn hệ thống.
   */
  private serialize(service: ServiceRecord) {
    return {
      ...service,
      unit_price: service.unit_price.toNumber(),
      scope: service.store_id === null ? 'global' : 'store',
    };
  }

  private buildFilters(query: QueryLaundryServiceDto) {
    const search = query.search?.trim();

    return {
      ...(query.pricing_unit && { pricing_unit: query.pricing_unit }),
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    };
  }

  /**
   * Tên dịch vụ không được trùng trong cùng phạm vi (không phân biệt hoa thường):
   * trong một cửa hàng, hoặc trong nhóm dịch vụ dùng chung (storeId = null).
   */
  private async assertNameAvailable(
    storeId: number | null,
    name: string,
    excludeId?: number,
  ) {
    const duplicate = await this.prisma.services.findFirst({
      where: {
        store_id: storeId,
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(
        storeId === null
          ? 'A global service with this name already exists'
          : 'A service with this name already exists in this store',
      );
    }
  }

  /** Dịch vụ phải thuộc đúng cửa hàng (dịch vụ dùng chung không sửa qua API này). */
  private async getOwnedServiceOrThrow(storeId: number, serviceId: number) {
    const service = await this.prisma.services.findFirst({
      where: { id: serviceId, store_id: storeId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  /**
   * Public: dịch vụ đang hoạt động mà khách có thể đặt ở cửa hàng này,
   * gồm dịch vụ riêng của cửa hàng và dịch vụ dùng chung (store_id = null).
   */
  async findAllActive(storeId: number, query: QueryLaundryServiceDto) {
    await this.storeService.assertActive(storeId);

    const services = await this.prisma.services.findMany({
      where: {
        status: 'active',
        OR: [{ store_id: storeId }, { store_id: null }],
        ...this.buildFilters(query),
      },
      orderBy: [{ name: 'asc' }],
    });

    return services.map((service) => this.serialize(service));
  }

  /** Public: chi tiết một dịch vụ đang hoạt động của cửa hàng (hoặc dùng chung). */
  async findActiveById(storeId: number, serviceId: number) {
    await this.storeService.assertActive(storeId);

    const service = await this.prisma.services.findFirst({
      where: {
        id: serviceId,
        status: 'active',
        OR: [{ store_id: storeId }, { store_id: null }],
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return this.serialize(service);
  }

  /** Admin / staff được gán: xem cả dịch vụ ngừng hoạt động của cửa hàng. */
  async findAllManageable(
    actor: Actor,
    storeId: number,
    query: QueryLaundryServiceDto,
  ) {
    await this.storeService.assertCanManageStore(actor, storeId);

    const services = await this.prisma.services.findMany({
      where: {
        store_id: storeId,
        ...(query.status && { status: query.status }),
        ...this.buildFilters(query),
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });

    return services.map((service) => this.serialize(service));
  }

  async create(actor: Actor, storeId: number, dto: CreateLaundryServiceDto) {
    await this.storeService.assertCanManageStore(actor, storeId);
    await this.assertNameAvailable(storeId, dto.name);

    const service = await this.prisma.services.create({
      data: {
        store_id: storeId,
        name: dto.name.trim(),
        description: dto.description,
        pricing_unit: dto.pricing_unit,
        unit_price: dto.unit_price,
        estimated_turnaround_hours: dto.estimated_turnaround_hours,
        status: dto.status,
      },
    });

    return this.serialize(service);
  }

  async update(
    actor: Actor,
    storeId: number,
    serviceId: number,
    dto: UpdateLaundryServiceDto,
  ) {
    await this.storeService.assertCanManageStore(actor, storeId);
    await this.getOwnedServiceOrThrow(storeId, serviceId);

    if (dto.name !== undefined) {
      await this.assertNameAvailable(storeId, dto.name, serviceId);
    }

    const service = await this.prisma.services.update({
      where: { id: serviceId },
      data: {
        ...dto,
        ...(dto.name !== undefined && { name: dto.name.trim() }),
      },
    });

    return this.serialize(service);
  }

  // --------------------Dịch vụ dùng chung (chỉ admin)-------------------

  /** Admin: danh sách dịch vụ dùng chung, gồm cả inactive (lọc được theo status). */
  async findAllGlobal(query: QueryLaundryServiceDto) {
    const services = await this.prisma.services.findMany({
      where: {
        store_id: null,
        ...(query.status && { status: query.status }),
        ...this.buildFilters(query),
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });

    return services.map((service) => this.serialize(service));
  }

  /**
   * Admin: sửa dịch vụ dùng chung. Thay đổi áp dụng cho mọi cửa hàng
   * (chỉ ảnh hưởng booking tạo sau đó, booking cũ đã lưu giá riêng).
   */
  async updateGlobal(serviceId: number, dto: UpdateLaundryServiceDto) {
    const existing = await this.prisma.services.findFirst({
      where: { id: serviceId, store_id: null },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Global service not found');
    }

    if (dto.name !== undefined) {
      await this.assertNameAvailable(null, dto.name, serviceId);
    }

    const service = await this.prisma.services.update({
      where: { id: serviceId },
      data: {
        ...dto,
        ...(dto.name !== undefined && { name: dto.name.trim() }),
      },
    });

    return this.serialize(service);
  }

  /**
   * Xóa mềm: chuyển sang inactive vì các booking cũ vẫn tham chiếu tới dịch vụ.
   */
  async deactivate(actor: Actor, storeId: number, serviceId: number) {
    await this.storeService.assertCanManageStore(actor, storeId);
    await this.getOwnedServiceOrThrow(storeId, serviceId);

    await this.prisma.services.update({
      where: { id: serviceId },
      data: { status: 'inactive' },
    });

    return { message: 'Service deactivated successfully' };
  }
}
