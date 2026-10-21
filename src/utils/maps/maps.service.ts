import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import type { Coordinates } from './interfaces/coordinates.interface.js';
import type { RouteResult } from './interfaces/route-result.interface.js';

interface NominatimResult {
  lat: string;
  lon: string;
}

interface OsrmResponse {
  code: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
  }>;
}

@Injectable()
export class MapsService {
  private readonly nominatimUrl =
    'https://nominatim.openstreetmap.org/search';

  private readonly osrmUrl =
    'https://router.project-osrm.org/route/v1/driving';

  // Thay bằng tên ứng dụng thực tế của bạn.
  private readonly userAgent =
    'LaundryBookingSystem/1.0';

  async geocodeAddress(
    address: string,
  ): Promise<Coordinates> {
    const normalizedAddress = address.trim();

    if (!normalizedAddress) {
      throw new BadRequestException(
        'Address must not be empty',
      );
    }

    const url = new URL(this.nominatimUrl);

    url.searchParams.set('q', normalizedAddress);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'vn');
    url.searchParams.set('accept-language', 'vi');

    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Geocoding service is unavailable',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'Geocoding service request failed',
      );
    }

    const data =
      (await response.json()) as NominatimResult[];

    if (!data.length) {
      throw new BadRequestException(
        'Could not find this address',
      );
    }

    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);

    this.validateCoordinates({ lat, lng });

    return { lat, lng };
  }

  async computeRoute(
    origin: Coordinates,
    destination: Coordinates,
  ): Promise<RouteResult> {
    this.validateCoordinates(origin);
    this.validateCoordinates(destination);

    // OSRM yêu cầu thứ tự longitude,latitude.
    const coordinates = [
      `${origin.lng},${origin.lat}`,
      `${destination.lng},${destination.lat}`,
    ].join(';');

    const url = new URL(
      `${this.osrmUrl}/${coordinates}`,
    );

    url.searchParams.set('overview', 'false');
    url.searchParams.set('steps', 'false');

    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Routing service is unavailable',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'Routing service request failed',
      );
    }

    const data = (await response.json()) as OsrmResponse;

    if (data.code !== 'Ok') {
      throw new BadRequestException(
        data.message ?? 'No route found',
      );
    }

    const route = data.routes?.[0];

    if (!route) {
      throw new BadRequestException(
        'No route found between these locations',
      );
    }

    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };
  }

  private validateCoordinates(
    point: Coordinates,
  ): void {
    if (
      !Number.isFinite(point.lat) ||
      !Number.isFinite(point.lng) ||
      point.lat < -90 ||
      point.lat > 90 ||
      point.lng < -180 ||
      point.lng > 180
    ) {
      throw new BadRequestException(
        'Invalid coordinates',
      );
    }
  }
}
