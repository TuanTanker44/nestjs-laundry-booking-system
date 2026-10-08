import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { RoleGuard } from '../auth/guards/role.guard.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create_user.dto.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userService.findById(id);
  }

  @Get('email/:email')
  async findByEmail(
    @Param('email') email: string,
  ) {
    return this.userService.findByEmail(email);
  }

  @Post()
  async create(
    @Body() dto: CreateUserDto,
  ) {
    return this.userService.create(dto);
  }
}
