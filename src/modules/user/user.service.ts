import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RefreshTokenService } from "../auth/refresh_token/refresh_token.service.js";
import type { CreateUserDto } from "./dto/create-user.dto.js";
import { AdminUpdateUserDto, UpdateProfileDto } from "./dto/update-user.dto.js";
import type { Prisma } from '../../generated/prisma/client.js';
import type { QueryShipperDto } from './dto/query-shipper.dto.js';

const SAFE_USER_SELECT = {
  id: true,
  full_name: true,
  date_of_birth: true,
  email: true,
  phone: true,
  role: true,
  avatar_url: true,
  status: true,
  email_verified_at: true,
  created_at: true,
  updated_at: true,
} as const;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
  ) { }

  hashPassword(password: string) {
    const saltRounds = parseInt(
      this.config.get<string>("SALT_ROUNDS") ?? "10",
      10,
    );

    return bcrypt.hash(password, saltRounds);
  }

  async findAll() {
    return this.prisma.users.findMany({
      select: SAFE_USER_SELECT,
      orderBy: { id: "asc" },
    });
  }

  async findShippers(query: QueryShipperDto) {
    const { page, limit, status } = query;
    const search = query.search?.trim();
    const where: Prisma.usersWhereInput = {
      role: 'shipper',
      status,
      ...(search && {
        OR: [
          { full_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [total, shippers] = await this.prisma.$transaction([
      this.prisma.users.count({ where }),
      this.prisma.users.findMany({
        where,
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          avatar_url: true,
          status: true,
        },
        orderBy: [{ full_name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: shippers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Trả về user đầy đủ (kèm password_hash) — CHỈ dùng nội bộ (AuthService),
   * không được trả thẳng ra API. Dùng getProfile() cho response.
   */
  async findById(id: number) {
    return this.prisma.users.findUnique({
      where: {
        id,
      },
    });
  }

  async getProfile(id: number) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  /** Như findById: chỉ dùng nội bộ vì có password_hash. */
  async findByEmail(email: string) {
    return this.prisma.users.findUnique({
      where: {
        email,
      },
    });
  }

  async create(dto: CreateUserDto) {
    const { name, password_hash, email, date_of_birth } = dto;

    return this.prisma.users.create({
      data: {
        email,
        full_name: name,
        password_hash: password_hash,
        date_of_birth,
      },
    });
  }

  async update(id: number, dto: AdminUpdateUserDto | UpdateProfileDto) {
    return this.prisma.users.update({
      where: {
        id,
      },
      data: dto,
      select: SAFE_USER_SELECT,
    });
  }

  async delete(id: number) {
    return this.prisma.users.update({
      where: {
        id,
      },
      data: {
        status: "inactive",
      },
    });
  }

  async deletePermanently(id: number) {
    return this.prisma.users.delete({
      where: {
        id,
      },
    });
  }

  async changePasswordByUser(
    id: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const currentValid = await bcrypt.compare(
      currentPassword,
      user.password_hash,
    );

    if (!currentValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    const sameAsCurrent = await bcrypt.compare(newPassword, user.password_hash);

    if (sameAsCurrent) {
      throw new BadRequestException(
        "New password must be different from the current password",
      );
    }

    await this.changePassword(id, newPassword);
    await this.refreshTokenService.revokeAllByUserId(id);

    return { message: "Password changed successfully" };
  }

  /** Chỉ đặt mật khẩu mới, không xác thực gì — dùng nội bộ (reset password qua email token). */
  async changePassword(id: number, newPassword: string) {
    const hashedPassword = await this.hashPassword(newPassword);

    return this.prisma.users.update({
      where: {
        id,
      },
      data: {
        password_hash: hashedPassword,
      },
      select: { id: true },
    });
  }

  async getCustomerByStaff(staffId: number, customerId: number) {
    // Kiểm tra STAFF tồn tại và đúng vai trò.
    const staff = await this.prisma.users.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!staff || staff.role !== "laundry_staff") {
      throw new NotFoundException("Staff not found");
    }

    // Lấy danh sách cửa hàng STAFF được phân công.
    const assignments = await this.prisma.staff_assignments.findMany({
      where: {
        staff_id: staffId,
      },
      select: {
        store_id: true,
      },
    });

    if (assignments.length === 0) {
      throw new NotFoundException("Staff has no assigned store");
    }

    const storeIds = assignments.map((assignment) => assignment.store_id);

    // Chỉ tìm khách hàng có đơn tại cửa hàng STAFF phụ trách.
    const customer = await this.prisma.users.findFirst({
      where: {
        id: customerId,
        role: "customer",
      },
      select: {
        id: true,
        full_name: true,
        date_of_birth: true,
        phone: true,
        email: true,
        status: true,

        bookings_bookings_customer_idTousers: {
          where: {
            store_id: {
              in: storeIds,
            },
          },
          select: {
            id: true,
            booking_code: true,
            status: true,

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
          },
          orderBy: {
            id: "desc",
          },
          take: 20,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException("Customer not found");
    }

    return customer;
  }

  /**
   * Lấy cửa hàng STAFF đang làm việc.
   * Mỗi STAFF có thể được phân công trên nhiều cửa hàng.
   */
  async getWorkingStore(staffId: number) {
    const staff = await this.prisma.users.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!staff || staff.role !== "laundry_staff") {
      throw new NotFoundException("Staff not found");
    }

    const assignments = await this.prisma.staff_assignments.findMany({
      where: {
        staff_id: staffId,
        laundry_stores: {
          status: "active",
        },
      },
      select: {
        id: true,
        assigned_at: true,
        laundry_stores: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            description: true,
            image_url: true,
            status: true,
          },
        },
      },
      orderBy: {
        assigned_at: "desc",
      },
    });

    if (assignments.length === 0) {
      throw new NotFoundException(
        "Staff has no active assigned store",
      );
    }

    return assignments.map((assignment) => assignment.laundry_stores);
  }
}
