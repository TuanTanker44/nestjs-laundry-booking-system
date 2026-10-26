import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../modules/auth/guards/jwt.guard.js';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto.js';
import { MapsService } from './maps.service.js';

@Controller('maps')
@UseGuards(JwtAuthGuard)
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  // GET /maps/reverse-geocode?lat=&lng= — đổi tọa độ thành địa chỉ
  @Get('reverse-geocode')
  async reverseGeocode(@Query() query: ReverseGeocodeDto) {
    const address = await this.mapsService.reverseGeocode({
      lat: query.lat,
      lng: query.lng,
    });

    return { address };
  }
}
