import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StoreService } from '../store/store.service.js';
import { SetWeeklyScheduleDto } from './dto/set-weekly-schedule.dto.js';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto.js';
import { QueryScheduleExceptionsDto } from './dto/query-schedule.dto.js';
import {
  dateToTime,
  formatDateOnly,
  generateSlots,
  parseDateOnly,
  storeNow,
  timeToDate,
  toMinutes,
} from './schedule-time.util.js';
import { slotBlockingWhere } from '../../utils/slot-capacity.util.js';

interface Actor {
  id: number;
  role: string;
}

// Giá trị mặc định khi ngày đó chưa có lịch tuần (khớp default trong DB).
const DEFAULT_SLOT_MINUTES = 60;
const DEFAULT_MAX_BOOKINGS = 5;

@Injectable()
export class StoreScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeService: StoreService,
  ) {}

  private requireDate(value: string, field: string): Date {
    const date = parseDateOnly(value);

    if (!date) {
      throw new BadRequestException(`${field} is not a valid date`);
    }

    return date;
  }

  private assertOpenBeforeClose(open: string, close: string, label: string) {
    if (toMinutes(open) >= toMinutes(close)) {
      throw new BadRequestException(
        `${label}: open_time must be earlier than close_time`,
      );
    }
  }

  private serializeSchedule(row: {
    id: number;
    day_of_week: number;
    open_time: Date;
    close_time: Date;
    slot_duration_minutes: number;
    max_bookings_per_slot: number;
  }) {
    return {
      id: row.id,
      day_of_week: row.day_of_week,
      open_time: dateToTime(row.open_time),
      close_time: dateToTime(row.close_time),
      slot_duration_minutes: row.slot_duration_minutes,
      max_bookings_per_slot: row.max_bookings_per_slot,
    };
  }

  private serializeException(row: {
    id: number;
    exception_date: Date;
    is_closed: boolean;
    open_time: Date | null;
    close_time: Date | null;
    reason: string | null;
  }) {
    return {
      id: row.id,
      exception_date: formatDateOnly(row.exception_date),
      is_closed: row.is_closed,
      open_time: row.open_time ? dateToTime(row.open_time) : null,
      close_time: row.close_time ? dateToTime(row.close_time) : null,
      reason: row.reason,
    };
  }

  // ---------------------------------------------------------------- Lịch tuần

  /** Public: lịch mở cửa theo tuần của cửa hàng đang hoạt động. */
  async getWeeklySchedule(storeId: number) {
    await this.storeService.assertActive(storeId);

    const rows = await this.prisma.store_schedules.findMany({
      where: { store_id: storeId },
      orderBy: { day_of_week: 'asc' },
    });

    return rows.map((row) => this.serializeSchedule(row));
  }

  /**
   * Thay toàn bộ lịch tuần trong một transaction:
   * upsert các ngày gửi lên, xóa các ngày còn lại (nghỉ cả ngày).
   */
  async setWeeklySchedule(
    actor: Actor,
    storeId: number,
    dto: SetWeeklyScheduleDto,
  ) {
    await this.storeService.assertCanManageStore(actor, storeId);

    const days = dto.schedules.map((item) => item.day_of_week);

    if (new Set(days).size !== days.length) {
      throw new BadRequestException('day_of_week must not be duplicated');
    }

    for (const item of dto.schedules) {
      const label = `day_of_week ${item.day_of_week}`;

      this.assertOpenBeforeClose(item.open_time, item.close_time, label);

      const openMinutes =
        toMinutes(item.close_time) - toMinutes(item.open_time);

      if (item.slot_duration_minutes > openMinutes) {
        throw new BadRequestException(
          `${label}: slot_duration_minutes is longer than the opening hours`,
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.store_schedules.deleteMany({
        where: { store_id: storeId, day_of_week: { notIn: days } },
      }),
      ...dto.schedules.map((item) => {
        const data = {
          open_time: timeToDate(item.open_time),
          close_time: timeToDate(item.close_time),
          slot_duration_minutes: item.slot_duration_minutes,
          max_bookings_per_slot: item.max_bookings_per_slot,
        };

        return this.prisma.store_schedules.upsert({
          where: {
            store_id_day_of_week: {
              store_id: storeId,
              day_of_week: item.day_of_week,
            },
          },
          create: { store_id: storeId, day_of_week: item.day_of_week, ...data },
          update: data,
        });
      }),
    ]);

    const rows = await this.prisma.store_schedules.findMany({
      where: { store_id: storeId },
      orderBy: { day_of_week: 'asc' },
    });

    return rows.map((row) => this.serializeSchedule(row));
  }

  // ------------------------------------------------------------ Ngày ngoại lệ

  /** Public: các ngày nghỉ / đổi giờ (mặc định từ hôm nay trở đi). */
  async listExceptions(storeId: number, query: QueryScheduleExceptionsDto) {
    await this.storeService.assertActive(storeId);

    const from = query.from
      ? this.requireDate(query.from, 'from')
      : this.requireDate(formatDateOnly(storeNow()), 'from');
    const to = query.to ? this.requireDate(query.to, 'to') : undefined;

    const rows = await this.prisma.store_schedule_exceptions.findMany({
      where: {
        store_id: storeId,
        exception_date: { gte: from, ...(to && { lte: to }) },
      },
      orderBy: { exception_date: 'asc' },
    });

    return rows.map((row) => this.serializeException(row));
  }

  async createException(
    actor: Actor,
    storeId: number,
    dto: CreateScheduleExceptionDto,
  ) {
    await this.storeService.assertCanManageStore(actor, storeId);

    const date = this.requireDate(dto.exception_date, 'exception_date');

    let openTime: Date | null = null;
    let closeTime: Date | null = null;

    if (!dto.is_closed) {
      if (!dto.open_time || !dto.close_time) {
        throw new BadRequestException(
          'open_time and close_time are required when is_closed is false',
        );
      }

      this.assertOpenBeforeClose(dto.open_time, dto.close_time, 'exception');

      openTime = timeToDate(dto.open_time);
      closeTime = timeToDate(dto.close_time);
    }

    try {
      const row = await this.prisma.store_schedule_exceptions.create({
        data: {
          store_id: storeId,
          exception_date: date,
          is_closed: dto.is_closed,
          open_time: openTime,
          close_time: closeTime,
          reason: dto.reason,
        },
      });

      return this.serializeException(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An exception already exists for this date',
        );
      }

      throw error;
    }
  }

  async deleteException(actor: Actor, storeId: number, exceptionId: number) {
    await this.storeService.assertCanManageStore(actor, storeId);

    const { count } = await this.prisma.store_schedule_exceptions.deleteMany({
      where: { id: exceptionId, store_id: storeId },
    });

    if (count === 0) {
      throw new NotFoundException('Schedule exception not found');
    }

    return { message: 'Schedule exception deleted successfully' };
  }

  // -------------------------------------------------------------- Slot còn trống

  /**
   * Public: các slot trong một ngày kèm số chỗ còn lại.
   * Ngày ngoại lệ ghi đè lịch tuần. Booking đã hủy / no_show không chiếm chỗ.
   */
  async getAvailableSlots(storeId: number, dateText: string) {
    await this.storeService.assertActive(storeId);

    const day = this.requireDate(dateText, 'date');
    const now = storeNow();
    const today = formatDateOnly(now);

    if (dateText < today) {
      throw new BadRequestException('date must not be in the past');
    }

    const hours = await this.resolveDayHours(storeId, day);
    const { open, close, reason, slotMinutes, capacity } = hours;

    if (!open || !close) {
      return {
        date: dateText,
        is_open: false,
        reason,
        open_time: null,
        close_time: null,
        slots: [],
      };
    }

    // Đếm số booking theo giờ bắt đầu trong ngày.
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const bookings = await this.prisma.bookings.findMany({
      where: {
        store_id: storeId,
        ...slotBlockingWhere(),
        scheduled_pickup_start: { gte: day, lt: nextDay },
      },
      select: { scheduled_pickup_start: true },
    });

    const bookedByStart = new Map<string, number>();

    for (const booking of bookings) {
      if (!booking.scheduled_pickup_start) {
        continue;
      }

      const key = dateToTime(booking.scheduled_pickup_start);

      bookedByStart.set(key, (bookedByStart.get(key) ?? 0) + 1);
    }

    // Nếu là hôm nay thì bỏ các slot đã bắt đầu.
    const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const isToday = dateText === today;

    const slots = generateSlots(open, close, slotMinutes)
      .filter((slot) => !isToday || toMinutes(slot.start) > nowMinutes)
      .map((slot) => {
        const booked = bookedByStart.get(slot.start) ?? 0;
        const available = Math.max(capacity - booked, 0);

        return {
          ...slot,
          capacity,
          booked,
          available,
          is_available: available > 0,
        };
      });

    return {
      date: dateText,
      is_open: true,
      reason,
      open_time: open,
      close_time: close,
      slot_duration_minutes: slotMinutes,
      slots,
    };
  }

  /**
   * Dành cho BookingModule: tìm slot bắt đầu đúng `startTime` trong ngày.
   * Trả null nếu hôm đó cửa hàng nghỉ hoặc giờ không khớp slot nào.
   * Không kiểm tra chỗ trống (BookingModule tự đếm trong transaction).
   */
  async findSlot(storeId: number, dateText: string, startTime: string) {
    const day = this.requireDate(dateText, 'pickup_date');
    const { open, close, slotMinutes, capacity } = await this.resolveDayHours(
      storeId,
      day,
    );

    if (!open || !close) {
      return null;
    }

    const slot = generateSlots(open, close, slotMinutes).find(
      (item) => item.start === startTime,
    );

    return slot ? { ...slot, capacity, slot_duration_minutes: slotMinutes } : null;
  }

  /**
   * Giờ mở/đóng, độ dài slot và sức chứa của một ngày.
   * Ngày ngoại lệ ghi đè lịch tuần; open/close = null nghĩa là nghỉ cả ngày.
   */
  private async resolveDayHours(storeId: number, day: Date) {
    const [schedule, exception] = await Promise.all([
      this.prisma.store_schedules.findUnique({
        where: {
          store_id_day_of_week: {
            store_id: storeId,
            day_of_week: day.getUTCDay(),
          },
        },
      }),
      this.prisma.store_schedule_exceptions.findUnique({
        where: {
          store_id_exception_date: { store_id: storeId, exception_date: day },
        },
      }),
    ]);

    // Xác định giờ mở/đóng: ngoại lệ ghi đè lịch tuần.
    let open: string | null = schedule ? dateToTime(schedule.open_time) : null;
    let close: string | null = schedule ? dateToTime(schedule.close_time) : null;
    let reason: string | null = null;

    if (exception) {
      reason = exception.reason;

      if (exception.is_closed) {
        open = null;
        close = null;
      } else {
        open = exception.open_time ? dateToTime(exception.open_time) : open;
        close = exception.close_time ? dateToTime(exception.close_time) : close;
      }
    }

    return {
      open,
      close,
      reason,
      slotMinutes: schedule?.slot_duration_minutes ?? DEFAULT_SLOT_MINUTES,
      capacity: schedule?.max_bookings_per_slot ?? DEFAULT_MAX_BOOKINGS,
    };
  }
}
