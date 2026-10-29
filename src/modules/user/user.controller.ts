import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
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

  /**
   * GET /api/users/me/working-store
   * Lấy cửa hàng STAFF được phân công làm việc.
   */
  @Get("me/working-store")
  @Roles("laundry_staff")
  async getWorkingStore(@CurrentUser('id') userId: number) {
    return this.userService.getWorkingStore(userId);
  }

  /**
   * GET /api/users/customers/:customerId
   * Lấy thông tin khách hàng và địa chỉ thuộc các đơn
   * tại cửa hàng STAFF được phân công.
   */
  @Get("customers/:customerId")
  @Roles("laundry_staff")
  async getCustomerByStaff(
    @CurrentUser("id") userId: number,
    @Param("customerId", ParseIntPipe) customerId: number,
  ) {
    return this.userService.getCustomerByStaff(userId, customerId);
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
