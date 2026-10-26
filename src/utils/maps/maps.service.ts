import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import type { Coordinates } from './interfaces/coordinates.interface.js';
import type { RouteResult } from './interfaces/route-result.interface.js';

interface NominatimResult {
  lat: string;
  lon: string;
}

interface NominatimReverseResult {
  display_name?: string;
  error?: string;
}

interface PhotonResponse {
  features?: Array<{
    properties?: {
      name?: string;
      housenumber?: string;
      street?: string;
      locality?: string;
      district?: string;
      city?: string;
      state?: string;
      country?: string;
      osm_key?: string;
    };
  }>;
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

  private readonly nominatimReverseUrl =
    'https://nominatim.openstreetmap.org/reverse';

  private readonly photonReverseUrl =
    'https://photon.komoot.io/reverse';

  private readonly logger = new Logger(MapsService.name);

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

  // Reverse geocoding: tọa độ -> địa chỉ.
  // Thử lần lượt từng nhà cung cấp, dùng kết quả đầu tiên thành công
  // (một số mạng chặn nominatim.openstreetmap.org).
  async reverseGeocode(point: Coordinates): Promise<string> {
    this.validateCoordinates(point);

    const providers: Array<[string, () => Promise<string>]> = [
      ['Nominatim', () => this.reverseWithNominatim(point)],
      ['Photon', () => this.reverseWithPhoton(point)],
    ];

    let lastError: unknown;

    for (const [name, provider] of providers) {
      try {
        return await provider();
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Reverse geocoding via ${name} failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    throw lastError;
  }

  private async reverseWithNominatim(point: Coordinates): Promise<string> {
    const url = new URL(this.nominatimReverseUrl);

    url.searchParams.set('lat', String(point.lat));
    url.searchParams.set('lon', String(point.lng));
    url.searchParams.set('format', 'jsonv2');
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
        'Reverse geocoding service is unavailable',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'Reverse geocoding service request failed',
      );
    }

    const data = (await response.json()) as NominatimReverseResult;

    if (!data.display_name) {
      throw new BadRequestException(
        'Could not find an address for these coordinates',
      );
    }

    return data.display_name;
  }

  private async reverseWithPhoton(point: Coordinates): Promise<string> {
    const url = new URL(this.photonReverseUrl);

    url.searchParams.set('lat', String(point.lat));
    url.searchParams.set('lon', String(point.lng));

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
        'Reverse geocoding service is unavailable',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'Reverse geocoding service request failed',
      );
    }

    const data = (await response.json()) as PhotonResponse;
    const properties = data.features?.[0]?.properties;

    if (!properties) {
      throw new BadRequestException(
        'Could not find an address for these coordinates',
      );
    }

    // Tên đường: từ "street", hoặc chính "name" nếu điểm đó là đường.
    const streetName =
      properties.street ??
      (properties.osm_key === 'highway' ? properties.name : undefined);

    const firstLine = streetName
      ? [properties.housenumber, streetName].filter(Boolean).join(' ')
      : properties.name;

    const parts = [
      firstLine,
      properties.locality,
      properties.district,
      properties.city,
      properties.state,
      properties.country,
    ].filter((part): part is string => Boolean(part));

    // Bỏ các thành phần lặp liền nhau (vd. city trùng state).
    const address = parts
      .filter((part, index) => part !== parts[index - 1])
      .join(', ');

    if (!address) {
      throw new BadRequestException(
        'Could not find an address for these coordinates',
      );
    }

    return address;
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
