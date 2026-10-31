import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DeliveryFeeService } from '../delivery-trip/delivery-fee.service.js';
import { PaymentService } from '../payment/payment.service.js';
import { PromotionService } from '../promotion/promotion.service.js';
import { StoreService } from '../store/store.service.js';
import { StoreScheduleService } from '../store-schedule/store-schedule.service.js';
import {
  formatDateOnly,
  parseDateOnly,
  storeNow,
} from '../store-schedule/schedule-time.util.js';
import {
  pendingHoldCutoff,
  slotBlockingWhere,
} from '../../utils/slot-capacity.util.js';
import {
  CANCELLABLE_STATUSES,
  MAX_ADVANCE_DAYS,
  MAX_PENDING_BOOKINGS,
  computeSubtotal,
  computeTotal,
  generateBookingCode,
  nextStatuses,
  refundPercent,
} from '../../utils/booking-rules.util.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { QueryBookingDto } from './dto/query-booking.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { CancelBookingDto } from './dto/cancel-booking.dto.js';
import type { AssignShipperDto } from './dto/assign-shipper.dto.js';

type BookingRecord = Prisma.bookingsGetPayload<object>;
type ItemRecord = Prisma.booking_itemsGetPayload<object>;

const deliveryTripSelect = {
  id: true,
  booking_id: true,
  trip_type: true,
  shipper_id: true,
  address_id: true,
  scheduled_time: true,
  started_at: true,
  completed_at: true,
  status: true,
  users: {
    select: {
      id: true,
      full_name: true,
      phone: true,
      email: true,
      avatar_url: true,
    },
  },
} satisfies Prisma.delivery_tripsSelect;

type DeliveryTripRecord = Prisma.delivery_tripsGetPayload<{ select: typeof deliveryTripSelect }>;

const machineAssignmentSelect = {
  id: true,
  machine_id: true,
  booking_id: true,
  created_at: true,
  machines: { select: { id: true, store_id: true, name: true, type: true } },
} satisfies Prisma.machine_assignmentsSelect;
type MachineAssignmentRecord = Prisma.machine_assignmentsGetPayload<{ select: typeof machineAssignmentSelect }>;

interface Actor {
  id: number;
  role: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
// Số lần thử lại khi mã đơn / qr_token ngẫu nhiên bị trùng (rất hiếm).
const MAX_CREATE_ATTEMPTS = 3;
// Mỗi lần quét tối đa bấy nhiêu đơn quá hạn thanh toán.
const SWEEP_BATCH_SIZE = 100;

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeService: StoreService,
    private readonly scheduleService: StoreScheduleService,
    private readonly promotionService: PromotionService,
    private readonly paymentService: PaymentService,
    private readonly deliveryFeeService: DeliveryFeeService,
  ) {}

  /** Decimal trả về JSON dạng chuỗi, đổi sang number cho client. */
  private serialize(
    booking: BookingRecord & {
      delivery_trips?: DeliveryTripRecord[];
      machine_assignments?: MachineAssignmentRecord[];
    },
    items?: ItemRecord[],
  ) {
    const toNumber = (value: Prisma.Decimal | null) => value?.toNumber() ?? null;

    return {
      ...booking,
      ...(booking.delivery_trips && {
        delivery_trips: this.serializeDeliveryTrips(booking.delivery_trips),
      }),
      ...(booking.machine_assignments && {
        machine_assignments: this.serializeMachineAssignments(booking.machine_assignments),
      }),
      unit_price: booking.unit_price.toNumber(),
      estimated_weight_kg: toNumber(booking.estimated_weight_kg),
      actual_weight_kg: toNumber(booking.actual_weight_kg),
      estimated_price: booking.estimated_price.toNumber(),
      final_price: toNumber(booking.final_price),
      discount_amount: booking.discount_amount.toNumber(),
      delivery_price: toNumber(booking.delivery_price),
      ...(items && {
        booking_items: items.map((item) => ({
          ...item,
          unit_price: toNumber(item.unit_price),
        })),
      }),
    };
  }

  private serializeDeliveryTrips(trips: DeliveryTripRecord[]) {
    return trips.map(({ users: shipper, ...trip }) => ({ ...trip, shipper }));
  }

  private serializeMachineAssignments(assignments: MachineAssignmentRecord[]) {
    return assignments.map(({ machines: machine, ...assignment }) => ({ ...assignment, machine }));
  }

  private isUniqueViolation(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private buildMeta(total: number, page: number, limit: number) {
    return { total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Khách chỉ xem / hủy đơn của chính mình (đơn của người khác coi như không
   * tồn tại); staff phải được gán vào cửa hàng của đơn; admin xem tất cả.
   */
  private async assertCanAccess(
    actor: Actor,
    booking: { customer_id: number; store_id: number },
  ) {
    if (actor.role === 'admin') {
      return;
    }

    if (actor.role === 'laundry_staff') {
      await this.storeService.assertCanManageStore(actor, booking.store_id);

      return;
    }

    if (booking.customer_id !== actor.id) {
      throw new NotFoundException('Booking not found');
    }
  }

  private async getOrThrow(id: number) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id },
      include: { booking_items: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  /**
   * Đơn pending_payment quá thời gian giữ chỗ -> chuyển cancelled và hoàn lại
   * lượt dùng mã khuyến mãi. Chạy "lười" trước các thao tác đọc / ghi liên quan
   * để không cần job nền. (Slot đã được giải phóng từ trước nhờ slotBlockingWhere.)
   */
  private async expireStalePending(scope: Prisma.bookingsWhereInput = {}) {
    const stale = await this.prisma.bookings.findMany({
      where: {
        ...scope,
        status: 'pending_payment',
        created_at: { lt: pendingHoldCutoff() },
      },
      select: { id: true, promotion_id: true },
      take: SWEEP_BATCH_SIZE,
    });

    for (const booking of stale) {
      await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.bookings.updateMany({
          where: { id: booking.id, status: 'pending_payment' },
          data: { status: 'cancelled', cancellation_reason: 'Payment timeout' },
        });

        if (count > 0 && booking.promotion_id) {
          await this.promotionService.release(tx, booking.promotion_id);
        }
      });
    }
  }

  // ------------------------------------------------------------ Tạo / báo giá

  /** Đơn tại cửa hàng không có địa chỉ; đơn giao nhận bắt buộc có địa chỉ lấy đồ. */
  private resolveAddresses(dto: CreateBookingDto) {
    if (dto.in_store) {
      if (
        dto.pickup_address_id !== undefined ||
        dto.delivery_address_id !== undefined
      ) {
        throw new BadRequestException(
          'Addresses must not be provided when in_store is true',
        );
      }

      return { pickup: null, delivery: null };
    }

    if (dto.pickup_address_id === undefined) {
      throw new BadRequestException(
        'pickup_address_id is required when in_store is false',
      );
    }

    return {
      pickup: dto.pickup_address_id,
      // Không gửi địa chỉ giao thì giao về chỗ lấy đồ.
      delivery: dto.delivery_address_id ?? dto.pickup_address_id,
    };
  }

  /**
   * Phí giao của đơn (null với đơn tại cửa hàng). Gọi API đường đi bên ngoài nên
   * tính TRƯỚC khi mở transaction; số tiền luôn do server tính, không nhận từ client.
   */
  private async computeDeliveryPrice(
    customerId: number,
    dto: CreateBookingDto,
  ): Promise<number | null> {
    const addresses = this.resolveAddresses(dto);

    if (addresses.pickup === null || addresses.delivery === null) {
      return null;
    }

    const { total_fee } = await this.deliveryFeeService.quote(
      customerId,
      dto.store_id,
      addresses.pickup,
      addresses.delivery,
    );

    return total_fee;
  }

  /**
   * Kiểm tra toàn bộ điều kiện đặt lịch và tính giá. Dùng chung cho báo giá
   * (đọc thuần) và tạo đơn (chạy trong transaction, `lockSlot = true`).
   */
  private async prepare(
    db: Prisma.TransactionClient,
    customerId: number,
    dto: CreateBookingDto,
    lockSlot: boolean,
    deliveryPrice: number | null,
  ) {
    const addresses = this.resolveAddresses(dto);

    if (!parseDateOnly(dto.pickup_date)) {
      throw new BadRequestException('pickup_date is not a valid date');
    }

    // Giờ lấy đồ theo giờ cửa hàng, lưu "nguyên văn" như quy ước của lịch cửa hàng.
    const now = storeNow();
    const start = new Date(`${dto.pickup_date}T${dto.slot_start}:00.000Z`);

    if (start <= now) {
      throw new BadRequestException('Pickup time must be in the future');
    }

    const lastDay = formatDateOnly(new Date(now.getTime() + MAX_ADVANCE_DAYS * DAY_MS));

    if (dto.pickup_date > lastDay) {
      throw new BadRequestException(
        `Bookings can only be made up to ${MAX_ADVANCE_DAYS} days in advance`,
      );
    }

    await this.storeService.assertActive(dto.store_id);

    const service = await db.services.findFirst({
      where: {
        id: dto.service_id,
        status: 'active',
        OR: [{ store_id: dto.store_id }, { store_id: null }],
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.pricing_unit === 'per_kg' && dto.estimated_weight_kg === undefined) {
      throw new BadRequestException(
        'estimated_weight_kg is required for per-kg services',
      );
    }

    if (service.pricing_unit === 'per_item' && !dto.items?.length) {
      throw new BadRequestException('items are required for per-item services');
    }

    const slot = await this.scheduleService.findSlot(
      dto.store_id,
      dto.pickup_date,
      dto.slot_start,
    );

    if (!slot) {
      throw new BadRequestException(
        'Selected time is not an available slot of this store',
      );
    }

    if (lockSlot) {
      // Khóa theo (cửa hàng, slot) đến hết transaction: hai khách đặt cùng slot
      // sẽ xếp hàng, nhờ vậy bước đếm chỗ bên dưới không bị vượt sức chứa.
      const slotKey = Math.floor(start.getTime() / 60_000);

      await db.$executeRaw`SELECT pg_advisory_xact_lock(${dto.store_id}::int, ${slotKey}::int)`;
    }

    const booked = await db.bookings.count({
      where: {
        store_id: dto.store_id,
        scheduled_pickup_start: start,
        ...slotBlockingWhere(),
      },
    });

    if (booked >= slot.capacity) {
      throw new ConflictException('This time slot is full');
    }

    const pending = await db.bookings.count({
      where: {
        customer_id: customerId,
        status: 'pending_payment',
        created_at: { gte: pendingHoldCutoff() },
      },
    });

    if (pending >= MAX_PENDING_BOOKINGS) {
      throw new ConflictException(
        `You already have ${MAX_PENDING_BOOKINGS} unpaid bookings, please pay or cancel them first`,
      );
    }

    if (addresses.pickup !== null && addresses.delivery !== null) {
      const ids = [...new Set([addresses.pickup, addresses.delivery])];
      const owned = await db.addresses.count({
        where: { id: { in: ids }, user_id: customerId },
      });

      if (owned !== ids.length) {
        throw new BadRequestException('Address not found');
      }
    }

    const unitPrice = service.unit_price.toNumber();
    const subtotal = computeSubtotal(service.pricing_unit, unitPrice, {
      weightKg: dto.estimated_weight_kg,
      itemQuantities: dto.items?.map((item) => item.quantity),
    });

    let discount = 0;
    let promotionId: number | null = null;

    if (dto.promotion_code) {
      const result = await this.promotionService.evaluate(
        db,
        dto.promotion_code,
        subtotal,
      );

      discount = result.discount;
      promotionId = result.id;
    }

    const end = new Date(`${dto.pickup_date}T${slot.end}:00.000Z`);

    return {
      service,
      addresses,
      start,
      end,
      slotsLeft: slot.capacity - booked,
      subtotal,
      discount,
      promotionId,
      deliveryPrice,
      estimatedPrice: computeTotal(subtotal, discount, deliveryPrice),
      estimatedDeliveryAt: service.estimated_turnaround_hours
        ? new Date(end.getTime() + service.estimated_turnaround_hours * HOUR_MS)
        : null,
    };
  }

  // Kiểm tra phạm vi cửa hàng staff có thể truy cập
  private async getStaffStoreIds(staffId: number): Promise<number[]> {
    const assignments = await this.prisma.staff_assignments.findMany({
      where: {
        staff_id: staffId,
      },
      select: {
        store_id: true,
      },
    });

    return assignments.map((assignment) => assignment.store_id);
  }

  /** Khách xem trước giá và chỗ trống, không tạo đơn, không trừ lượt mã. */
  async quote(actor: Actor, dto: CreateBookingDto) {
    const deliveryPrice = await this.computeDeliveryPrice(actor.id, dto);
    const prepared = await this.prepare(
      this.prisma,
      actor.id,
      dto,
      false,
      deliveryPrice,
    );

    return {
      store_id: dto.store_id,
      service: {
        id: prepared.service.id,
        name: prepared.service.name,
        pricing_unit: prepared.service.pricing_unit,
        unit_price: prepared.service.unit_price.toNumber(),
      },
      pickup_date: dto.pickup_date,
      slot_start: dto.slot_start,
      slots_left: prepared.slotsLeft,
      subtotal: prepared.subtotal,
      discount_amount: prepared.discount,
      delivery_price: prepared.deliveryPrice,
      estimated_price: prepared.estimatedPrice,
      estimated_delivery_at: prepared.estimatedDeliveryAt,
    };
  }

  async create(actor: Actor, dto: CreateBookingDto) {
    // Giải phóng các đơn quá hạn của chính khách (và lượt dùng mã) trước khi kiểm tra giới hạn.
    await this.expireStalePending({ customer_id: actor.id });

    const deliveryPrice = await this.computeDeliveryPrice(actor.id, dto);

    for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
      try {
        return await this.createOnce(actor.id, dto, deliveryPrice);
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }
      }
    }

    throw new ConflictException(
      'Could not generate a unique booking code, please try again',
    );
  }

  private createOnce(
    customerId: number,
    dto: CreateBookingDto,
    deliveryPrice: number | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const prepared = await this.prepare(tx, customerId, dto, true, deliveryPrice);
      const { service } = prepared;

      if (prepared.promotionId !== null) {
        await this.promotionService.consume(tx, prepared.promotionId);
      }

      const booking = await tx.bookings.create({
        data: {
          booking_code: generateBookingCode(storeNow()),
          qr_token: randomBytes(24).toString('base64url'),
          customer_id: customerId,
          store_id: dto.store_id,
          service_id: service.id,
          // Chụp lại thông tin giá: đổi giá dịch vụ sau này không ảnh hưởng đơn đã tạo.
          service_name: service.name,
          pricing_unit: service.pricing_unit,
          unit_price: service.unit_price,
          in_store: dto.in_store,
          pickup_address_id: prepared.addresses.pickup,
          delivery_address_id: prepared.addresses.delivery,
          scheduled_pickup_start: prepared.start,
          scheduled_pickup_end: prepared.end,
          estimated_delivery_at: prepared.estimatedDeliveryAt,
          estimated_weight_kg: dto.estimated_weight_kg,
          estimated_price: prepared.estimatedPrice,
          delivery_price: prepared.deliveryPrice,
          discount_amount: prepared.discount,
          promotion_id: prepared.promotionId,
          special_instructions: dto.special_instructions,
          ...(dto.items?.length && {
            booking_items: {
              create: dto.items.map((item) => ({
                item_name: item.item_name,
                category: item.category,
                quantity: item.quantity,
                note: item.note,
                unit_price:
                  service.pricing_unit === 'per_item' ? service.unit_price : null,
              })),
            },
          }),
        },
        include: { booking_items: true },
      });

      return this.serialize(booking, booking.booking_items);
    });
  }

  // ------------------------------------------------------------------ Truy vấn

  private async paginate(
    where: Prisma.bookingsWhereInput,
    query: QueryBookingDto,
  ) {
    const { page, limit } = query;

    const [total, bookings] = await this.prisma.$transaction([
      this.prisma.bookings.count({ where }),
      this.prisma.bookings.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          delivery_trips: { select: deliveryTripSelect, orderBy: { id: 'asc' } },
          machine_assignments: { select: machineAssignmentSelect, orderBy: { id: 'asc' } },
        },
      }),
    ]);

    return {
      data: bookings.map((booking) => this.serialize(booking)),
      meta: this.buildMeta(total, page, limit),
    };
  }

  /** Khách: danh sách đơn của chính mình. */
  async findMine(actor: Actor, query: QueryBookingDto) {
    await this.expireStalePending({ customer_id: actor.id });

    return this.paginate(
      {
        customer_id: actor.id,
        ...(query.status && { status: query.status }),
      },
      query,
    );
  }

  /** Admin: mọi đơn; staff: đơn của các cửa hàng được gán. Lọc theo cửa hàng / ngày / trạng thái. */
  async findManageable(actor: Actor, query: QueryBookingDto) {
    const scope: Prisma.bookingsWhereInput = {
      ...(actor.role === 'laundry_staff' && {
        laundry_stores: { staff_assignments: { some: { staff_id: actor.id } } },
      }),
      ...(query.store_id !== undefined && { store_id: query.store_id }),
    };

    await this.expireStalePending(scope);

    let pickupDay: Prisma.bookingsWhereInput = {};

    if (query.date) {
      const day = parseDateOnly(query.date);

      if (!day) {
        throw new BadRequestException('date is not a valid date');
      }

      pickupDay = {
        scheduled_pickup_start: {
          gte: day,
          lt: new Date(day.getTime() + DAY_MS),
        },
      };
    }

    return this.paginate(
      {
        ...scope,
        ...pickupDay,
        ...(query.status && { status: query.status }),
      },
      query,
    );
  }

  async findOne(actor: Actor, id: number) {
    await this.expireStalePending({ id });

    const booking = await this.prisma.bookings.findUnique({
      where: { id },
      include: {
        booking_items: true,
        delivery_trips: { select: deliveryTripSelect, orderBy: { id: 'asc' } },
        machine_assignments: { select: machineAssignmentSelect, orderBy: { id: 'asc' } },
        laundry_stores: { select: { id: true, name: true, address: true } },
        // Tóm tắt thanh toán để UI biết đơn đã trả hay chưa (không lấy raw_response).
        payments: {
          select: {
            id: true,
            payment_type: true,
            amount: true,
            method: true,
            status: true,
            paid_at: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    await this.assertCanAccess(actor, booking);

    const { laundry_stores: store, payments, ...rest } = booking;

    return {
      ...this.serialize(rest, rest.booking_items),
      store,
      payments: payments.map((payment) => ({
        ...payment,
        amount: payment.amount.toNumber(),
      })),
    };
  }

  // -------------------------------------------------------------- Hủy / đổi trạng thái

  /**
   * Hủy đơn (chỉ khi pending_payment / confirmed). Khách hủy muộn hơn
   * FREE_CANCEL_HOURS trước giờ lấy vẫn được nhưng hoàn 0%.
   * Hoàn tiền là hệ quả tự động của việc hủy (hoàn về đúng khoản đã thu), dù ai bấm hủy.
   */
  async cancel(actor: Actor, id: number, dto: CancelBookingDto) {
    await this.expireStalePending({ id });

    const booking = await this.getOrThrow(id);

    await this.assertCanAccess(actor, booking);

    if (!CANCELLABLE_STATUSES.includes(booking.status)) {
      throw new BadRequestException(
        `A booking in status "${booking.status}" cannot be cancelled`,
      );
    }

    // refundPercent chỉ trả 0 hoặc 100 nên hoàn toàn phần; hoàn một phần chưa hỗ trợ.
    const refund = refundPercent({
      status: booking.status,
      pickupStart: booking.scheduled_pickup_start,
      now: storeNow(),
      cancelledByCustomer: actor.role === 'customer',
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.bookings.updateMany({
        // Chỉ hủy nếu trạng thái chưa bị ai đổi trong lúc đó.
        where: { id, status: booking.status },
        data: {
          status: 'cancelled',
          cancelled_by: actor.id,
          cancellation_reason: dto.reason,
        },
      });

      if (count === 0) {
        throw new ConflictException(
          'Booking status has changed, please reload and try again',
        );
      }

      if (booking.promotion_id) {
        await this.promotionService.release(tx, booking.promotion_id);
      }

      // Đóng phiên thanh toán đang chờ và đánh dấu khoản đã thu cần hoàn, cùng transaction với việc hủy.
      await this.paymentService.onBookingCancelled(tx, id, refund === 100);

      return tx.bookings.findUniqueOrThrow({
        where: { id },
        include: { booking_items: true },
      });
    });

    // Gọi cổng sau khi đã commit. Hoàn lỗi thì đơn vẫn hủy và cron thử lại ('pending').
    const refundStatus = await this.paymentService.refundBooking(id);

    return {
      booking: this.serialize(updated, updated.booking_items),
      refund_percent: refund,
      refund_status: refundStatus,
    };
  }

  /** Gán chuyến giao trả; booking chỉ chuyển delivering khi thực sự bắt đầu giao. */
  async assignShipper(actor: Actor, id: number, dto: AssignShipperDto) {
    const booking = await this.getOrThrow(id);
    await this.storeService.assertCanManageStore(actor, booking.store_id);

    if (booking.status !== 'ready_for_delivery') {
      throw new BadRequestException(
        'A shipper can only be assigned to a booking in "ready_for_delivery" status',
      );
    }
    if (booking.in_store || !booking.delivery_address_id) {
      throw new BadRequestException('Booking must have a delivery address and in_store must be false');
    }

    return this.prisma.$transaction(async (tx) => {
      const shipper = await tx.users.findFirst({
        where: { id: dto.shipper_id, role: 'shipper', status: 'active' },
        select: { id: true },
      });
      if (!shipper) {
        throw new NotFoundException('Active shipper not found');
      }

      // Khóa dòng booking và kiểm lại trạng thái trước khi sửa chuyến giao.
      // Hai lần gán đồng thời được tuần tự hóa; changeStatus cũng cập nhật dòng này.
      const { count } = await tx.bookings.updateMany({
        where: {
          id,
          status: 'ready_for_delivery',
          store_id: booking.store_id,
          in_store: false,
          delivery_address_id: booking.delivery_address_id,
        },
        data: { updated_at: new Date() },
      });
      if (count === 0) {
        throw new ConflictException('Booking has changed, please reload and try again');
      }

      const where = { booking_id_trip_type: { booking_id: id, trip_type: 'delivery' as const } };
      const trip = await tx.delivery_trips.findUnique({ where });
      if (trip && trip.status !== 'unassigned' && trip.status !== 'assigned') {
        throw new ConflictException('Cannot assign a shipper to a delivery trip that has already started or ended');
      }

      return tx.delivery_trips.upsert({
        where,
        create: {
          booking_id: id,
          trip_type: 'delivery',
          shipper_id: shipper.id,
          address_id: booking.delivery_address_id!,
          scheduled_time: booking.estimated_delivery_at ?? storeNow(),
          status: 'assigned',
        },
        update: { shipper_id: shipper.id, status: 'assigned' },
      });
    });
  }

  /** Admin / staff của cửa hàng: đẩy đơn sang trạng thái kế tiếp (hủy đơn dùng `cancel`). */
  async changeStatus(actor: Actor, id: number, dto: UpdateBookingStatusDto) {
    if (dto.status === 'cancelled') {
      throw new BadRequestException(
        'Use POST /bookings/:id/cancel to cancel a booking',
      );
    }

    await this.expireStalePending({ id });

    const booking = await this.getOrThrow(id);

    await this.storeService.assertCanManageStore(actor, booking.store_id);

    const from = booking.status;
    const to = dto.status;

    if (!nextStatuses(from, booking.in_store).includes(to)) {
      throw new BadRequestException(
        `Cannot change booking status from "${from}" to "${to}"`,
      );
    }

    if (to === 'no_show') {
      if (!booking.scheduled_pickup_start) {
        throw new BadRequestException(
          'A booking without a scheduled pickup time cannot be marked as no_show',
        );
      }

      if (storeNow() < booking.scheduled_pickup_start) {
        throw new BadRequestException(
          'A booking cannot be marked as no_show before its pickup time',
        );
      }
    }

    if (to !== 'processing' && dto.actual_weight_kg !== undefined) {
      throw new BadRequestException(
        'actual_weight_kg is only accepted when moving to "processing"',
      );
    }

    // Thanh toán online (VNPay / MoMo) tự chuyển pending_payment -> confirmed qua
    // PaymentService.handleIpn; staff bấm tay ở đây là đường dự phòng cho tiền mặt.
    // TODO(machine): processing -> gán máy `idle` và ghi machine_usage_logs;
    // completed -> đóng log và trả máy về `idle`.
    const data: Prisma.bookingsUncheckedUpdateManyInput = { status: to };

    if (to === 'processing') {
      const unitPrice = booking.unit_price.toNumber();
      let subtotal: number;

      if (booking.pricing_unit === 'per_kg') {
        if (dto.actual_weight_kg === undefined) {
          throw new BadRequestException(
            'actual_weight_kg is required to start processing a per-kg booking',
          );
        }

        data.actual_weight_kg = dto.actual_weight_kg;
        subtotal = computeSubtotal('per_kg', unitPrice, {
          weightKg: dto.actual_weight_kg,
        });
      } else {
        subtotal = computeSubtotal('per_item', unitPrice, {
          itemQuantities: booking.booking_items.map((item) => item.quantity),
        });
      }

      data.final_price = computeTotal(
        subtotal,
        booking.discount_amount.toNumber(),
        booking.delivery_price?.toNumber() ?? null,
      );
    }

    const { count } = await this.prisma.bookings.updateMany({
      // Chỉ cập nhật nếu trạng thái chưa bị ai đổi trong lúc đó.
      where: { id, status: from },
      data,
    });

    if (count === 0) {
      throw new ConflictException(
        'Booking status has changed, please reload and try again',
      );
    }

    const updated = await this.getOrThrow(id);

    return this.serialize(updated, updated.booking_items);
  }

  async getStaffBookings(
    staffId: number,
    page = 1,
    limit = 20,
  ) {
    const storeIds = await this.getStaffStoreIds(staffId);

    if (storeIds.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const where = {
      store_id: {
        in: storeIds,
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.bookings.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: {
          created_at: "desc",
        },
        select: {
          id: true,
          booking_code: true,
          status: true,
          scheduled_pickup_start: true,
          scheduled_pickup_end: true,
          estimated_delivery_at: true,
          estimated_price: true,
          created_at: true,

          service_name: true,
          pricing_unit: true,
          estimated_weight_kg: true,

          delivery_trips: { select: deliveryTripSelect, orderBy: { id: 'asc' } },
          machine_assignments: { select: machineAssignmentSelect, orderBy: { id: 'asc' } },

          users_bookings_customer_idTousers: {
            select: {
              id: true,
              full_name: true,
              phone: true,
            },
          },
        },
      }),

      this.prisma.bookings.count({ where }),
    ]);

    return {
      data: data.map((booking) => ({
        ...booking,
        delivery_trips: this.serializeDeliveryTrips(booking.delivery_trips),
        machine_assignments: this.serializeMachineAssignments(booking.machine_assignments),
      })),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getStaffBookingDetail(
    staffId: number,
    bookingId: number,
  ) {
    const storeIds = await this.getStaffStoreIds(staffId);

    if (storeIds.length === 0) {
      throw new NotFoundException("Booking not found");
    }

    const booking = await this.prisma.bookings.findFirst({
      where: {
        id: bookingId,
        store_id: {
          in: storeIds,
        },
      },
      select: {
        id: true,
        booking_code: true,
        status: true,

        in_store: true,

        scheduled_pickup_start: true,
        scheduled_pickup_end: true,
        estimated_delivery_at: true,

        estimated_weight_kg: true,
        actual_weight_kg: true,

        estimated_price: true,
        final_price: true,
        discount_amount: true,

        special_instructions: true,
        cancellation_reason: true,
        created_at: true,
        updated_at: true,

        service_name: true,
        pricing_unit: true,
        unit_price: true,
        delivery_price: true,

        delivery_trips: { select: deliveryTripSelect, orderBy: { id: 'asc' } },
        machine_assignments: { select: machineAssignmentSelect, orderBy: { id: 'asc' } },

        users_bookings_customer_idTousers: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            email: true,
          },
        },

        addresses_bookings_pickup_address_idToaddresses: {
          select: {
            recipient_name: true,
            phone: true,
            address_line: true,
            ward: true,
            district: true,
            city: true,
          },
        },

        addresses_bookings_delivery_address_idToaddresses: {
          select: {
            recipient_name: true,
            phone: true,
            address_line: true,
            ward: true,
            district: true,
            city: true,
          },
        },

        booking_items: {
          select: {
            id: true,
            item_name: true,
            category: true,
            quantity: true,
            unit_price: true,
            note: true,
          },
          orderBy: {
            id: "asc",
          },
        },

        services: {
          select: {
            id: true,
            name: true,
            description: true,
            pricing_unit: true,
            unit_price: true,
          },
        },

        laundry_stores: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    return {
      ...booking,
      delivery_trips: this.serializeDeliveryTrips(booking.delivery_trips),
      machine_assignments: this.serializeMachineAssignments(booking.machine_assignments),
    };
  }
}
