import { afterAll, beforeAll, describe, it } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

// Chỉ kiểm tra các luồng bị chặn trước khi chạm DB (route gốc, guard, validation),
// nên không cần dữ liệu trong DB. Vẫn cần DATABASE_URL hợp lệ (xem env.validation.ts)
// và Redis để AppModule khởi tạo được. Các luồng nghiệp vụ nằm ở bộ Postman (postman/).
describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Giữ cấu hình giống src/main.ts, nếu không route sẽ không có tiền tố /api
    // và DTO không bị validate.
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api -> 200 "Hello World!"', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  it('GET / (không có tiền tố api) -> 404', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  it('GET /api/addresses không có token -> 401', () => {
    return request(app.getHttpServer()).get('/api/addresses').expect(401);
  });

  it('GET /api/stores/1/machines?page=1&limit=100 không có token -> 401', () => {
    return request(app.getHttpServer())
      .get('/api/stores/1/machines?page=1&limit=100')
      .expect(401);
  });

  it('GET /api/users/me không có token -> 401', () => {
    return request(app.getHttpServer()).get('/api/users/me').expect(401);
  });

  it('POST /api/auth/register thiếu dữ liệu -> 400', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({})
      .expect(400);
  });

  it('POST /api/auth/register gửi field lạ (role) -> 400', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'e2e@example.com',
        password: 'Passw0rd!',
        role: 'admin',
      })
      .expect(400);
  });
});
