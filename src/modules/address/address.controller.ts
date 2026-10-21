import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AddressService } from './address.service.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(
    private readonly addressService: AddressService,
  ) {}

  // POST /addresses
  @Post()
  async create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateAddressDto,
  ) {
    const address = await this.addressService.create(userId, dto);

    return {
      message: 'Address created successfully',
      data: address,
    };
  }

  // GET /addresses
  @Get()
  async findAll(@CurrentUser('id') userId: number) {
    const addresses = await this.addressService.findAllByUser(userId);

    return { data: addresses };
  }

  // GET /addresses/:id
  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const address = await this.addressService.findOneByUser(userId, id);

    return { data: address };
  }

  // PATCH /addresses/:id
  @Patch(':id')
  async update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto,
  ) {
    const address = await this.addressService.update(userId, id, dto);

    return {
      message: 'Address updated successfully',
      data: address,
    };
  }

  // PATCH /addresses/:id/default
  @Patch(':id/default')
  async setDefault(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const address = await this.addressService.setDefault(userId, id);

    return {
      message: 'Default address updated successfully',
      data: address,
    };
  }

  // DELETE /addresses/:id
  @Delete(':id')
  async remove(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.addressService.remove(userId, id);
  }
}
