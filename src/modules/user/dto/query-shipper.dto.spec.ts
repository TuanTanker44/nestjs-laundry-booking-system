import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryShipperDto } from './query-shipper.dto.js';

describe('QueryShipperDto', () => {
  it('uses defaults and transforms numeric query strings', async () => {
    expect(plainToInstance(QueryShipperDto, {})).toMatchObject({ page: 1, limit: 10, status: 'active' });
    const dto = plainToInstance(QueryShipperDto, { page: '2', limit: '100', status: 'inactive', search: 'Nam' });
    expect(await validate(dto)).toEqual([]);
    expect(dto).toMatchObject({ page: 2, limit: 100 });
  });

  it.each([
    { page: '0' }, { page: '1.5' }, { page: 'abc' },
    { limit: '0' }, { limit: '101' }, { status: 'unknown' },
    { search: ['Nam', 'Huy'] }, { search: 'a'.repeat(101) },
  ])('rejects invalid query %j', async (query) => {
    expect((await validate(plainToInstance(QueryShipperDto, query))).length).toBeGreaterThan(0);
  });
});
