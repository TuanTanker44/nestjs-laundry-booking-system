import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { RoleGuard } from '../auth/guards/role.guard.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserService } from './user.service.js';
import { ChangePasswordDto, UpdateProfileDto } from './dto/update-user.dto.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RoleGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  // GET /users/me
  @Get('me')
  getMe(@CurrentUser('id') userId: number) {
    return this.userService.getProfile(userId);
  }

  // PATCH /users/me — user self-update
  @Patch('me')
  updateMe(
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.update(userId, dto);
  }

  // PATCH /users/change-password — user tự đổi mật khẩu (cần mật khẩu hiện tại)
  @Patch('change-password')
  changePasswordByUser(
    @CurrentUser('id') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePasswordByUser(
      userId,
      dto.current_password,
      dto.new_password,
    );
  }

  // GET /users — admin
  @Get()
  @Roles('admin')
  findAll() {
    return this.userService.findAll();
  }

  // GET /users/:id — admin
  @Get(':id')
  @Roles('admin')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getProfile(id);
  }
}
