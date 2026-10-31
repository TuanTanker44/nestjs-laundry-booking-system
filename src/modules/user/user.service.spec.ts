import { vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service.js';
import { QueryShipperDto } from './dto/query-shipper.dto.js';

function setup() {
  const prisma = { users: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() }, $transaction: vi.fn() };
  prisma.$transaction.mockImplementation((queries: Promise<unknown>[]) => Promise.all(queries));
  const config = { get: vi.fn().mockReturnValue('4') };
  const refreshTokenService = { revokeAllByUserId: vi.fn() };
  return { service: new UserService(prisma as never, config as never, refreshTokenService as never), prisma, config, refreshTokenService };
}

describe('UserService', () => {
  it('lists only active shippers by default with pagination and a limited projection', async () => {
    const { service, prisma } = setup();
    const shippers = [{ id: 10, full_name: 'Nguyễn Nam', email: 'nam@test.com', phone: '0901234567', avatar_url: null, status: 'active' }];
    prisma.users.count.mockResolvedValue(1);
    prisma.users.findMany.mockResolvedValue(shippers);

    await expect(service.findShippers(new QueryShipperDto())).resolves.toEqual({
      data: shippers, meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    expect(prisma.users.count).toHaveBeenCalledWith({ where: { role: 'shipper', status: 'active' } });
    expect(prisma.users.findMany).toHaveBeenCalledWith({
      where: { role: 'shipper', status: 'active' },
      select: { id: true, full_name: true, email: true, phone: true, avatar_url: true, status: true },
      orderBy: [{ full_name: 'asc' }, { id: 'asc' }], skip: 0, take: 10,
    });
  });

  it('applies shipper search and status to both count and data queries', async () => {
    const { service, prisma } = setup();
    prisma.users.count.mockResolvedValue(21);
    prisma.users.findMany.mockResolvedValue([]);
    const query = Object.assign(new QueryShipperDto(), { page: 3, limit: 10, search: ' Nam ', status: 'inactive' });
    const result = await service.findShippers(query);
    const where = {
      role: 'shipper', status: 'inactive',
      OR: [
        { full_name: { contains: 'Nam', mode: 'insensitive' } },
        { email: { contains: 'Nam', mode: 'insensitive' } },
        { phone: { contains: 'Nam' } },
      ],
    };
    expect(prisma.users.count).toHaveBeenCalledWith({ where });
    expect(prisma.users.findMany).toHaveBeenCalledWith(expect.objectContaining({ where, skip: 20, take: 10 }));
    expect(result.meta).toEqual({ total: 21, page: 3, limit: 10, totalPages: 3 });
  });

  it('ignores whitespace-only shipper search and returns an empty page', async () => {
    const { service, prisma } = setup();
    prisma.users.count.mockResolvedValue(0);
    prisma.users.findMany.mockResolvedValue([]);
    await expect(service.findShippers(Object.assign(new QueryShipperDto(), { search: '   ' }))).resolves.toEqual({
      data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
    expect(prisma.users.count).toHaveBeenCalledWith({ where: { role: 'shipper', status: 'active' } });
  });

  it('hashes passwords with configured salt rounds', async () => {
    const { service, config } = setup();
    const hash = await service.hashPassword('secret');
    expect(config.get).toHaveBeenCalledWith('SALT_ROUNDS');
    expect(hash).not.toBe('secret');
  });

  it('finds all users using safe projection', async () => {
    const { service, prisma } = setup();
    prisma.users.findMany.mockResolvedValue([]);
    await service.findAll();
    expect(prisma.users.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { id: 'asc' }, select: expect.objectContaining({ id: true, email: true, status: true }) }));
  });

  it('throws when profile user does not exist', async () => {
    const { service, prisma } = setup();
    prisma.users.findUnique.mockResolvedValue(null);
    await expect(service.getProfile(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a user with the supplied fields', async () => {
    const { service, prisma } = setup();
    prisma.users.create.mockResolvedValue({ id: 1 });
    await service.create({ name: 'A', email: 'a@test.com', password_hash: 'hash' } as any);
    expect(prisma.users.create).toHaveBeenCalledWith({ data: { email: 'a@test.com', full_name: 'A', password_hash: 'hash', date_of_birth: undefined } });
  });

  it('soft deletes a user by setting inactive status', async () => {
    const { service, prisma } = setup();
    prisma.users.update.mockResolvedValue({ id: 1, status: 'inactive' });
    await service.delete(1);
    expect(prisma.users.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { status: 'inactive' } });
  });

  it('changes password only after current password is verified', async () => {
    const { service, prisma, refreshTokenService } = setup();
    const bcrypt = await import('bcrypt');
    const currentHash = await bcrypt.default.hash('old', 4);
    prisma.users.findUnique.mockResolvedValue({ id: 1, password_hash: currentHash });
    prisma.users.update.mockResolvedValue({ id: 1 });
    await expect(service.changePasswordByUser(1, 'old', 'new')).resolves.toEqual({ message: 'Password changed successfully' });
    expect(prisma.users.update).toHaveBeenCalled();
    expect(refreshTokenService.revokeAllByUserId).toHaveBeenCalledWith(1);
  });

  it('rejects incorrect current password', async () => {
    const { service, prisma } = setup();
    const bcrypt = await import('bcrypt');
    prisma.users.findUnique.mockResolvedValue({ id: 1, password_hash: await bcrypt.default.hash('old', 4) });
    await expect(service.changePasswordByUser(1, 'wrong', 'new')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects reusing the current password', async () => {
    const { service, prisma } = setup();
    const bcrypt = await import('bcrypt');
    prisma.users.findUnique.mockResolvedValue({ id: 1, password_hash: await bcrypt.default.hash('old', 4) });
    await expect(service.changePasswordByUser(1, 'old', 'old')).rejects.toThrow('different from the current password');
  });

  it('rejects password change when user does not exist', async () => {
    const { service, prisma } = setup();
    prisma.users.findUnique.mockResolvedValue(null);
    await expect(service.changePasswordByUser(1, 'old', 'new')).rejects.toBeInstanceOf(NotFoundException);
  });
});
