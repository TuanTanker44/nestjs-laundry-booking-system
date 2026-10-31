import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AssignShipperDto } from './assign-shipper.dto.js';

describe('AssignShipperDto', () => {
  it('accepts a positive integer shipper_id', async () => {
    expect(await validate(plainToInstance(AssignShipperDto, { shipper_id: 12 }))).toEqual([]);
  });

  it.each([undefined, null, 0, -1, 1.5, '12', 'abc'])('rejects invalid shipper_id %j', async (shipper_id) => {
    expect((await validate(plainToInstance(AssignShipperDto, { shipper_id }))).length).toBeGreaterThan(0);
  });
});
