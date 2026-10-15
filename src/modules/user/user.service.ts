import { Injectable } from "@nestjs/common";
import bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { AdminUpdateUserDto, UpdateProfileDto } from "./dto/update-user.dto.js";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) { }
    
  async findAll() {
    return this.prisma.users.findMany();
  }

  async findById(id: number) {
    return this.prisma.users.findUnique({
      where: {
        id,
      },
    });
  }

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
      select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      role: true,
      avatar_url: true,
      status: true,
      email_verified_at: true,
      updated_at: true,
    },
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
    const SALT_ROUNDS = process.env.SALT_ROUNDS;
    if (!SALT_ROUNDS) {
      throw new Error("SALT_ROUNDS is not configured");
    }

    const hashedPassword = await bcrypt.hash(newPassword, parseInt(SALT_ROUNDS));

    return this.prisma.users.update({
      where: {
        id,
      },
      data: {
        password_hash: hashedPassword,
      },
    });
  }
}