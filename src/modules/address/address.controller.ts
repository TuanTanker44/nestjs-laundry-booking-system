import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AddressService } from './address.service.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(
    private readonly addressService: AddressService,
  ) {}

  // POST /addresses
  @Post()
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateAddressDto,
  ) {
    const address = await this.addressService.create(
      req.user?.id as number,
      dto,
    );

    return res.status(HttpStatus.CREATED).json({
      message: 'Address created successfully',
      data: address,
    });
  }

  // GET /addresses
  @Get()
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const addresses = await this.addressService.findAllByUser(
      req.user?.id as number,
    );

    return res.status(HttpStatus.OK).json({
      data: addresses,
    });
  }

  // GET /addresses/:id
  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const address = await this.addressService.findOneByUser(
      req.user?.id as number,
      id,
    );

    return res.status(HttpStatus.OK).json({
      data: address,
    });
  }

  // PATCH /addresses/:id
  @Patch(':id')
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto,
  ) {
    const address = await this.addressService.update(
      req.user?.id as number,
      id,
      dto,
    );

    return res.status(HttpStatus.OK).json({
      message: 'Address updated successfully',
      data: address,
    });
  }

  // PATCH /addresses/:id/default
  @Patch(':id/default')
  async setDefault(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const address = await this.addressService.setDefault(
      req.user?.id as number,
      id,
    );

    return res.status(HttpStatus.OK).json({
      message: 'Default address updated successfully',
      data: address,
    });
  }

  // DELETE /addresses/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.addressService.remove(
      req.user?.id as number,
      id,
    );

    return res.status(HttpStatus.OK).json(result);
  }
}
