import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { CreateAddressDto } from './create-address.dto.js';
import { UpdateAddressDto } from './update-address.dto.js';

describe.each([CreateAddressDto, UpdateAddressDto])('%s coordinates', (metatype) => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
  const validate = (coordinates: Record<string, unknown>) => pipe.transform({
    recipient_name: 'Nguyễn Văn A',
    phone: '0901234567',
    address_line: '123 ABC',
    ...coordinates,
  }, { type: 'body', metatype });

  it.each([
    {},
    { latitude: 10.762622, longitude: 106.660172 },
    { latitude: 0, longitude: 0 },
    { latitude: -90, longitude: -180 },
    { latitude: 90, longitude: 180 },
    { lat: 10.762622, long: 106.660172 },
    { lat: 0, long: 0 },
    { lat: -90, long: -180 },
    { lat: 90, long: 180 },
  ])('accepts optional valid coordinate pairs: %j', async (coordinates) => {
    await expect(validate(coordinates)).resolves.toMatchObject(coordinates);
  });

  it.each([
    { latitude: 10 },
    { longitude: 106 },
    { latitude: 91, longitude: 106 },
    { latitude: -91, longitude: 106 },
    { latitude: 10, longitude: 181 },
    { latitude: 10, longitude: -181 },
    { latitude: '10', longitude: '106' },
    { latitude: null, longitude: null },
    { latitude: NaN, longitude: 106 },
    { latitude: 10, longitude: Infinity },
    { lat: 10 },
    { long: 106 },
    { lat: 91, long: 106 },
    { lat: -91, long: 106 },
    { lat: 10, long: 181 },
    { lat: 10, long: -181 },
    { lat: '10', long: '106' },
    { lat: null, long: null },
    { lat: NaN, long: 106 },
    { lat: 10, long: Infinity },
    { unexpected: true },
  ])('rejects incomplete or invalid coordinate pairs: %j', async (coordinates) => {
    await expect(validate(coordinates)).rejects.toMatchObject({ status: 400 });
  });
});
