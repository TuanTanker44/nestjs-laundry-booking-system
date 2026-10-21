import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { CreateUserDto } from "./dto/create-user.dto.js";
import { AdminUpdateUserDto, UpdateProfileDto } from "./dto/update-user.dto.js";

const SAFE_USER_SELECT = {
  id: true,
  full_name: true,
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
    const { name, password_hash, email } = dto;

    return this.prisma.users.create({
      data: {
        email,
        full_name: name,
        password_hash: password_hash,
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
}
