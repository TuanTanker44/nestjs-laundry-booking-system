import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../modules/auth/guards/jwt.guard.js';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto.js';
import { RouteDto } from './dto/route.dto.js';
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

  // GET /maps/route?originLat=&originLng=&destLat=&destLng= — khoảng cách và thời gian đường bộ.
  // Chỉ để FE hiển thị; phí giao do server tự tính lại khi báo giá / đặt đơn.
  @Get('route')
  async route(@Query() query: RouteDto) {
    const { distanceMeters, durationSeconds } =
      await this.mapsService.computeRoute(
        { lat: query.originLat, lng: query.originLng },
        { lat: query.destLat, lng: query.destLng },
      );

    return {
      distance_meters: distanceMeters,
      distance_km: Math.round(distanceMeters / 10) / 100,
      duration_seconds: durationSeconds,
    };
  }
}
