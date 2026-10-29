import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude } from 'class-validator';

export class RouteDto {
  @Type(() => Number)
  @IsLatitude()
  originLat: number;

  @Type(() => Number)
  @IsLongitude()
  originLng: number;

  @Type(() => Number)
  @IsLatitude()
  destLat: number;

  @Type(() => Number)
  @IsLongitude()
  destLng: number;
}
