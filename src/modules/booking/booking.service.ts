import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
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

type BookingRecord = Prisma.bookingsGetPayload<object>;
type ItemRecord = Prisma.booking_itemsGetPayload<object>;

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
  ) {}

  /** Decimal trả về JSON dạng chuỗi, đổi sang number cho client. */
  private serialize(booking: BookingRecord, items?: ItemRecord[]) {
    const toNumber = (value: Prisma.Decimal | null) => value?.toNumber() ?? null;

    return {
      ...booking,
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
   * Kiểm tra toàn bộ điều kiện đặt lịch và tính giá. Dùng chung cho báo giá
   * (đọc thuần) và tạo đơn (chạy trong transaction, `lockSlot = true`).
   */
  private async prepare(
    db: Prisma.TransactionClient,
    customerId: number,
    dto: CreateBookingDto,
    lockSlot: boolean,
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
      // TODO(delivery): chưa có quy tắc tính phí giao nên delivery_price để null;
      // khi có, cộng vào estimated_price ở đây.
      estimatedPrice: computeTotal(subtotal, discount),
      estimatedDeliveryAt: service.estimated_turnaround_hours
        ? new Date(end.getTime() + service.estimated_turnaround_hours * HOUR_MS)
        : null,
    };
  }

  /** Khách xem trước giá và chỗ trống, không tạo đơn, không trừ lượt mã. */
  async quote(actor: Actor, dto: CreateBookingDto) {
    const prepared = await this.prepare(this.prisma, actor.id, dto, false);

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
      delivery_price: null,
      estimated_price: prepared.estimatedPrice,
      estimated_delivery_at: prepared.estimatedDeliveryAt,
    };
  }

  async create(actor: Actor, dto: CreateBookingDto) {
    // Giải phóng các đơn quá hạn của chính khách (và lượt dùng mã) trước khi kiểm tra giới hạn.
    await this.expireStalePending({ customer_id: actor.id });

    for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
      try {
        return await this.createOnce(actor.id, dto);
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

  private createOnce(customerId: number, dto: CreateBookingDto) {
    return this.prisma.$transaction(async (tx) => {
      const prepared = await this.prepare(tx, customerId, dto, true);
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
        laundry_stores: { select: { id: true, name: true, address: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    await this.assertCanAccess(actor, booking);

    const { laundry_stores: store, ...rest } = booking;

    return { ...this.serialize(rest, rest.booking_items), store };
  }

  // -------------------------------------------------------------- Hủy / đổi trạng thái

  /**
   * Hủy đơn (chỉ khi pending_payment / confirmed). Khách hủy muộn hơn
   * FREE_CANCEL_HOURS trước giờ lấy vẫn được nhưng hoàn 0%.
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

    // TODO(payment): hiện chỉ tính phần trăm hoàn tiền; khi có module thanh toán
    // thì tạo giao dịch hoàn tiền (payments.status = refunded) theo tỉ lệ này.
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

      return tx.bookings.findUniqueOrThrow({
        where: { id },
        include: { booking_items: true },
      });
    });

    return {
      booking: this.serialize(updated, updated.booking_items),
      refund_percent: refund,
    };
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

    if (to === 'no_show' && storeNow() < booking.scheduled_pickup_start) {
      throw new BadRequestException(
        'A booking cannot be marked as no_show before its pickup time',
      );
    }

    if (to !== 'processing' && dto.actual_weight_kg !== undefined) {
      throw new BadRequestException(
        'actual_weight_kg is only accepted when moving to "processing"',
      );
    }

    // TODO(payment): pending_payment -> confirmed hiện do admin / staff bấm tay;
    // sau này chuyển sang tự động khi cổng thanh toán báo thành công.
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
}
