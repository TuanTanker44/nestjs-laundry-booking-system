import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  machines_type_enum,
  Prisma,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StoreService } from '../store/store.service.js';
import {
  STORE_UTC_OFFSET_MINUTES,
  parseDateOnly,
  storeNow,
} from '../store-schedule/schedule-time.util.js';
import type { AssignMachineDto } from './dto/assign-machine.dto.js';
import type { CreateMachineDto } from './dto/create-machine.dto.js';
import type { QueryMachineDto } from './dto/query-machine.dto.js';
import type { QueryUsageLogDto } from './dto/query-usage-log.dto.js';
import type { UpdateMachineDto } from './dto/update-machine.dto.js';

interface Actor {
  id: number;
  role: string;
}

/** Đơn đang được đưa vào máy. `weightKg` null: không biết cân nặng (đơn tính theo món) nên bỏ qua kiểm tra sức chứa. */
interface BookingLoad {
  id: number;
  storeId: number;
  weightKg: number | null;
}

// Máy dùng cho bước giặt khi hệ thống tự chọn; máy sấy chỉ được gán thủ công.
const AUTO_ASSIGN_TYPES: machines_type_enum[] = ['washer', 'washer_dryer'];
const DAY_MS = 24 * 60 * 60 * 1000;

const machineSelect = {
  id: true,
  store_id: true,
  name: true,
  type: true,
  capacity_kg: true,
  status: true,
  created_at: true,
  updated_at: true,
  // Phiên đang chạy (nếu có): tối đa một nhờ partial unique index.
  machine_usage_logs: {
    where: { ended_at: null },
    orderBy: { started_at: 'desc' },
    take: 1,
    select: {
      id: true,
      booking_id: true,
      started_at: true,
      bookings: { select: { booking_code: true } },
    },
  },
} satisfies Prisma.machinesSelect;

type MachineRecord = Prisma.machinesGetPayload<{ select: typeof machineSelect }>;

@Injectable()
export class MachineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeService: StoreService,
  ) {}

  private serialize({ machine_usage_logs, capacity_kg, ...machine }: MachineRecord) {
    const [usage] = machine_usage_logs;

    return {
      ...machine,
      capacity_kg: capacity_kg.toNumber(),
      current_usage: usage
        ? {
            log_id: usage.id,
            booking_id: usage.booking_id,
            booking_code: usage.bookings.booking_code,
            started_at: usage.started_at,
          }
        : null,
    };
  }

  /** Máy của cửa hàng khác coi như không tồn tại. */
  private async getInStoreOrThrow(storeId: number, machineId: number) {
    const machine = await this.prisma.machines.findFirst({
      where: { id: machineId, store_id: storeId },
      select: machineSelect,
    });

    if (!machine) {
      throw new NotFoundException('Machine not found');
    }

    return machine;
  }

  private async assertNameFree(
    storeId: number,
    name: string,
    exceptId?: number,
  ) {
    const duplicate = await this.prisma.machines.findFirst({
      where: {
        store_id: storeId,
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId !== undefined && { id: { not: exceptId } }),
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(
        'A machine with this name already exists in this store',
      );
    }
  }

  // --------------------------------------------------------------- Quản lý máy

  async findAll(actor: Actor, storeId: number, query: QueryMachineDto) {
    await this.storeService.assertCanManageStore(actor, storeId);

    const slotBooking = query.booking_id === undefined ? null : await this.prisma.bookings.findFirst({
      where: { id: query.booking_id, store_id: storeId },
      select: { id: true, scheduled_pickup_start: true, scheduled_pickup_end: true },
    });
    if (query.booking_id !== undefined && !slotBooking) {
      throw new NotFoundException('Booking not found');
    }
    const slot = slotBooking ? this.requireSlot(slotBooking) : null;

    const { page, limit, type, status } = query;
    const slotReservations: Prisma.machine_assignmentsWhereInput | undefined = slot
      ? { bookings: this.overlappingBookings(slot.start, slot.end) }
      : undefined;
    const where: Prisma.machinesWhereInput = {
      store_id: storeId,
      ...(type && { type }),
      ...(status && slot && (status === 'idle' || status === 'running')
        ? {
            status: { in: ['idle', 'running'] },
            machine_assignments: status === 'idle'
              ? { none: slotReservations }
              : { some: slotReservations },
          }
        : status ? { status } : {}),
    };

    const [total, machines] = await this.prisma.$transaction([
      this.prisma.machines.count({ where }),
      this.prisma.machines.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        select: machineSelect,
      }),
    ]);

    const reservations = slot ? await this.prisma.machine_assignments.findMany({
      where: {
        machines: { store_id: storeId },
        bookings: this.overlappingBookings(slot.start, slot.end),
      },
      select: { machine_id: true, booking_id: true },
    }) : [];

    return {
      data: machines.map((machine) => ({
        ...this.serialize(machine),
        ...(slot && {
          current_status: machine.status,
          status: machine.status === 'maintenance' || machine.status === 'offline'
            ? machine.status
            : reservations.some((r) => r.machine_id === machine.id) ? 'running' : 'idle',
          available_for_booking: !['maintenance', 'offline'].includes(machine.status)
            && !reservations.some((r) => r.machine_id === machine.id && r.booking_id !== slotBooking!.id),
          assigned_to_booking: reservations.some((r) => r.machine_id === machine.id && r.booking_id === slotBooking!.id),
        }),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(actor: Actor, storeId: number, machineId: number) {
    await this.storeService.assertCanManageStore(actor, storeId);

    return this.serialize(await this.getInStoreOrThrow(storeId, machineId));
  }

  async create(actor: Actor, storeId: number, dto: CreateMachineDto) {
    await this.storeService.assertCanManageStore(actor, storeId);

    const name = dto.name.trim();

    await this.assertNameFree(storeId, name);

    const created = await this.prisma.machines.create({
      data: {
        store_id: storeId,
        name,
        type: dto.type,
        ...(dto.capacity_kg !== undefined && { capacity_kg: dto.capacity_kg }),
      },
      select: machineSelect,
    });

    return this.serialize(created);
  }

  async update(
    actor: Actor,
    storeId: number,
    machineId: number,
    dto: UpdateMachineDto,
  ) {
    await this.storeService.assertCanManageStore(actor, storeId);

    const machine = await this.getInStoreOrThrow(storeId, machineId);
    const name = dto.name?.trim();
    const locksRunning =
      dto.type !== undefined ||
      dto.capacity_kg !== undefined ||
      dto.status !== undefined;

    if (machine.status === 'running' && locksRunning) {
      throw new ConflictException(
        'A running machine must be released before changing its type, capacity or status',
      );
    }

    if (name !== undefined && name.toLowerCase() !== machine.name.toLowerCase()) {
      await this.assertNameFree(storeId, name, machineId);
    }

    const { count } = await this.prisma.machines.updateMany({
      // Máy vừa được gán cho đơn trong lúc đó thì không đổi được các trường trên.
      where: {
        id: machineId,
        ...(locksRunning && { status: { not: 'running' } }),
      },
      data: {
        ...(name !== undefined && { name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.capacity_kg !== undefined && { capacity_kg: dto.capacity_kg }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    if (count === 0) {
      throw new ConflictException(
        'Machine status has changed, please reload and try again',
      );
    }

    return this.serialize(await this.getInStoreOrThrow(storeId, machineId));
  }

  /** Xóa cứng chỉ khi máy chưa có lịch sử (xóa máy sẽ kéo theo xóa log); đã dùng rồi thì đặt `offline`. */
  async remove(actor: Actor, storeId: number, machineId: number) {
    await this.storeService.assertCanManageStore(actor, storeId);
    await this.getInStoreOrThrow(storeId, machineId);

    const { count } = await this.prisma.machines.deleteMany({
      where: { id: machineId, machine_usage_logs: { none: {} }, machine_assignments: { none: {} } },
    });

    if (count === 0) {
      throw new ConflictException(
        'This machine has assignments or usage history and cannot be deleted, set its status to "offline" instead',
      );
    }

    return { message: 'Machine deleted successfully' };
  }

  async findUsageLogs(
    actor: Actor,
    storeId: number,
    machineId: number,
    query: QueryUsageLogDto,
  ) {
    await this.storeService.assertCanManageStore(actor, storeId);
    await this.getInStoreOrThrow(storeId, machineId);

    const { page, limit } = query;
    // from / to là ngày theo giờ cửa hàng; started_at lưu thời điểm thực (UTC).
    const toInstant = (value: string, name: string, addDays: number) => {
      const date = parseDateOnly(value);

      if (!date) {
        throw new BadRequestException(`${name} is not a valid date`);
      }

      return new Date(
        date.getTime() + addDays * DAY_MS - STORE_UTC_OFFSET_MINUTES * 60_000,
      );
    };
    const from = query.from ? toInstant(query.from, 'from', 0) : undefined;
    const until = query.to ? toInstant(query.to, 'to', 1) : undefined;

    if (from && until && from >= until) {
      throw new BadRequestException('from must not be after to');
    }

    const where: Prisma.machine_usage_logsWhereInput = {
      machine_id: machineId,
      ...((from || until) && {
        started_at: { ...(from && { gte: from }), ...(until && { lt: until }) },
      }),
    };

    const [total, logs] = await this.prisma.$transaction([
      this.prisma.machine_usage_logs.count({ where }),
      this.prisma.machine_usage_logs.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          booking_id: true,
          started_at: true,
          ended_at: true,
          bookings: { select: { booking_code: true } },
        },
      }),
    ]);

    return {
      data: logs.map(({ bookings, ...log }) => ({
        ...log,
        booking_code: bookings.booking_code,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ------------------------------------------------------ Gán / nhả máy cho đơn

  private requireSlot(booking: {
    scheduled_pickup_start: Date | null;
    scheduled_pickup_end: Date | null;
  }) {
    const start = booking.scheduled_pickup_start;
    const end = booking.scheduled_pickup_end;
    if (!start || !end || start >= end) {
      throw new BadRequestException('Booking must have a valid scheduled_pickup_start/end');
    }
    return { start, end };
  }

  private overlappingBookings(start: Date, end: Date): Prisma.bookingsWhereInput {
    return {
      status: { notIn: ['cancelled', 'no_show'] },
      scheduled_pickup_start: { lt: end },
      scheduled_pickup_end: { gt: start },
    };
  }

  /** Khóa booking trước rồi máy, cùng thứ tự với luồng bắt đầu chạy máy. */
  private async lockAssignment(tx: Prisma.TransactionClient, storeId: number, machineId: number, bookingId: number) {
    const bookings = await tx.$queryRaw<{ id: number }[]>`
      SELECT id FROM bookings WHERE id = ${bookingId} AND store_id = ${storeId} FOR UPDATE
    `;
    if (bookings.length === 0) throw new NotFoundException('Booking not found');
    const machines = await tx.$queryRaw<{ id: number }[]>`
      SELECT id FROM machines WHERE id = ${machineId} AND store_id = ${storeId} FOR UPDATE
    `;
    if (machines.length === 0) throw new NotFoundException('Machine not found');
  }

  /** Giữ máy theo lịch booking; không đổi trạng thái vận hành hiện tại của máy. */
  async assign(
    actor: Actor,
    storeId: number,
    machineId: number,
    dto: AssignMachineDto,
  ) {
    await this.storeService.assertCanManageStore(actor, storeId);
    const assignment = await this.prisma.$transaction(async (tx) => {
      await this.lockAssignment(tx, storeId, machineId, dto.booking_id);
      const booking = await tx.bookings.findUniqueOrThrow({ where: { id: dto.booking_id } });
      if (!['confirmed', 'picked_up', 'processing'].includes(booking.status)) {
        throw new BadRequestException('Machines can only be assigned to confirmed, picked_up or processing bookings');
      }
      const { start, end } = this.requireSlot(booking);
      if (end <= storeNow()) {
        throw new BadRequestException('Cannot assign a machine to a booking whose time slot has ended');
      }
      const machine = await tx.machines.findUniqueOrThrow({ where: { id: machineId } });
      if (machine.status === 'maintenance' || machine.status === 'offline') {
        throw new ConflictException('Machine is unavailable for assignment');
      }
      const weight = booking.actual_weight_kg ?? booking.estimated_weight_kg;
      if (weight && weight.toNumber() > machine.capacity_kg.toNumber()) {
        throw new BadRequestException('Booking weight exceeds machine capacity');
      }
      const conflict = await tx.machine_assignments.findFirst({
        where: {
          machine_id: machineId,
          booking_id: { not: booking.id },
          bookings: this.overlappingBookings(start, end),
        },
        select: { id: true },
      });
      if (conflict) {
        throw new ConflictException('Machine is already assigned to another booking in this time slot');
      }
      return tx.machine_assignments.upsert({
        where: { machine_id_booking_id: { machine_id: machineId, booking_id: booking.id } },
        create: { machine_id: machineId, booking_id: booking.id },
        update: {},
      });
    });
    return {
      ...this.serialize(await this.getInStoreOrThrow(storeId, machineId)),
      assignment,
    };
  }

  async unassign(actor: Actor, storeId: number, machineId: number, bookingId: number) {
    await this.storeService.assertCanManageStore(actor, storeId);
    return this.prisma.$transaction(async (tx) => {
      await this.lockAssignment(tx, storeId, machineId, bookingId);
      const usage = await tx.machine_usage_logs.findFirst({
        where: { machine_id: machineId, booking_id: bookingId, ended_at: null },
        select: { id: true },
      });
      if (usage) throw new ConflictException('Release the running machine before removing its assignment');
      await tx.machine_assignments.deleteMany({ where: { machine_id: machineId, booking_id: bookingId } });
      return { message: 'Machine assignment removed successfully' };
    });
  }

  /** Bắt đầu sử dụng thực tế: máy phải rảnh và booking đang processing trong ca đã gán. */
  async startAssigned(
    actor: Actor,
    storeId: number,
    machineId: number,
    dto: AssignMachineDto,
  ) {
    await this.storeService.assertCanManageStore(actor, storeId);
    await this.getInStoreOrThrow(storeId, machineId);

    const booking = await this.prisma.bookings.findFirst({
      where: { id: dto.booking_id, store_id: storeId },
      select: { id: true, status: true, actual_weight_kg: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'processing') {
      throw new BadRequestException(
        `A machine can only be assigned to a booking in "processing" status, not "${booking.status}"`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Chạm vào đơn để khóa dòng và kiểm lại trạng thái: đơn rời `processing` đúng lúc này
      // (đã quét nhả máy) thì không được mở thêm log mà không ai đóng.
      const { count } = await tx.bookings.updateMany({
        where: { id: booking.id, status: 'processing' },
        data: { updated_at: new Date() },
      });

      if (count === 0) {
        throw new ConflictException(
          'Booking status has changed, please reload and try again',
        );
      }

      await this.claimById(tx, machineId, {
        id: booking.id,
        storeId,
        weightKg: booking.actual_weight_kg?.toNumber() ?? null,
      });
    });

    return this.serialize(await this.getInStoreOrThrow(storeId, machineId));
  }

  /** Nhả máy: đóng phiên đang chạy và đưa máy về `idle`. */
  async release(actor: Actor, storeId: number, machineId: number) {
    await this.storeService.assertCanManageStore(actor, storeId);
    await this.getInStoreOrThrow(storeId, machineId);

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.machines.updateMany({
        where: { id: machineId, status: 'running' },
        data: { status: 'idle' },
      });

      if (count === 0) {
        throw new ConflictException('This machine is not in use');
      }

      await tx.machine_usage_logs.updateMany({
        where: { machine_id: machineId, ended_at: null },
        data: { ended_at: new Date() },
      });
    });

    return this.serialize(await this.getInStoreOrThrow(storeId, machineId));
  }

  /**
   * Gọi trong transaction đổi đơn sang `processing`. Có `machineId` thì gán đúng máy đó
   * (sai thì throw và cả transaction rollback); không có thì tự chọn máy giặt rảnh nhỏ nhất
   * còn vừa đồ TRONG CÁC MÁY ĐÃ GIỮ CA cho booking. Hết máy thì trả null.
   */
  async assignForProcessing(
    tx: Prisma.TransactionClient,
    load: BookingLoad,
    machineId?: number,
  ) {
    if (machineId !== undefined) {
      return this.claimById(tx, machineId, load);
    }

    const candidates = await tx.machines.findMany({
      where: {
        store_id: load.storeId,
        status: 'idle',
        type: { in: AUTO_ASSIGN_TYPES },
        machine_assignments: { some: { booking_id: load.id } },
        ...(load.weightKg !== null && { capacity_kg: { gte: load.weightKg } }),
      },
      orderBy: [{ capacity_kg: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true },
    });

    for (const candidate of candidates) {
      if (await this.start(tx, candidate.id, load.id)) {
        return candidate;
      }
    }

    return null;
  }

  /** Gọi trong transaction khi đơn rời `processing`: nhả mọi máy đơn đang giữ. */
  async releaseAllForBooking(tx: Prisma.TransactionClient, bookingId: number) {
    const open = await tx.machine_usage_logs.findMany({
      where: { booking_id: bookingId, ended_at: null },
      select: { id: true, machine_id: true },
    });

    if (open.length === 0) {
      return;
    }

    await tx.machine_usage_logs.updateMany({
      where: { id: { in: open.map((log) => log.id) } },
      data: { ended_at: new Date() },
    });

    await tx.machines.updateMany({
      where: { id: { in: open.map((log) => log.machine_id) }, status: 'running' },
      data: { status: 'idle' },
    });
  }

  private async claimById(
    tx: Prisma.TransactionClient,
    machineId: number,
    load: BookingLoad,
  ) {
    const machine = await tx.machines.findFirst({
      where: { id: machineId, store_id: load.storeId },
      select: { id: true, name: true, capacity_kg: true },
    });

    if (!machine) {
      throw new NotFoundException('Machine not found');
    }

    if (load.weightKg !== null && load.weightKg > machine.capacity_kg.toNumber()) {
      throw new BadRequestException(
        `The booking weighs ${load.weightKg} kg, more than the machine capacity of ${machine.capacity_kg.toString()} kg`,
      );
    }

    if (!(await this.start(tx, machine.id, load.id))) {
      throw new ConflictException('Machine must be idle and assigned to this processing booking in its current time slot');
    }

    return { id: machine.id, name: machine.name };
  }

  /** `idle` -> `running` và mở log. Trả false nếu máy không còn rảnh (đã bị người khác lấy / bảo trì). */
  private async start(
    tx: Prisma.TransactionClient,
    machineId: number,
    bookingId: number,
  ) {
    const now = storeNow();
    const assignment = await tx.machine_assignments.findFirst({
      where: {
        machine_id: machineId,
        booking_id: bookingId,
        bookings: {
          status: 'processing',
          scheduled_pickup_start: { lte: now },
          scheduled_pickup_end: { gt: now },
        },
      },
      select: { id: true },
    });
    if (!assignment) return false;

    const { count } = await tx.machines.updateMany({
      where: { id: machineId, status: 'idle' },
      data: { status: 'running' },
    });

    if (count === 0) {
      return false;
    }

    await tx.machine_usage_logs.create({
      data: {
        machine_id: machineId,
        booking_id: bookingId,
        started_at: new Date(),
      },
    });

    return true;
  }
}
