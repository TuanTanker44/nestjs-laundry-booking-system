# Laundry Booking System

API backend cho hệ thống đặt lịch giặt là: khách hàng đặt đơn giặt (lấy tại cửa hàng hoặc giao nhận tận nơi), thanh toán online, cửa hàng và nhân viên quản lý lịch, dịch vụ, khuyến mãi và trạng thái đơn.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Framework | [NestJS](https://nestjs.com) 12, TypeScript, ESM |
| Cơ sở dữ liệu | PostgreSQL qua [Prisma](https://www.prisma.io) 7 (`@prisma/adapter-pg`) |
| Cache / rate limit | Redis (`ioredis`) |
| Xác thực | JWT access token + refresh token (cookie), Passport |
| Thanh toán | VNPay, MoMo |
| Gửi email | Nodemailer |
| Tác vụ nền | `@nestjs/schedule` |
| Test | Vitest, Supertest, Postman |
| Lint / format | oxlint, Prettier |
| Package manager | pnpm |

## Chức năng chính

- **Auth**: đăng ký, đăng nhập, đăng xuất, refresh token, xác thực email, quên / đặt lại mật khẩu, giới hạn tần suất request bằng Redis.
- **User & Address**: hồ sơ cá nhân, đổi mật khẩu, sổ địa chỉ (có địa chỉ mặc định).
- **Store & Store schedule**: cửa hàng, gán nhân viên, lịch mở cửa theo tuần, ngày ngoại lệ, tính slot còn trống.
- **Laundry service**: dịch vụ theo từng cửa hàng và dịch vụ dùng chung.
- **Promotion**: mã khuyến mãi theo phần trăm hoặc giá trị cố định.
- **Booking**: báo giá, tạo đơn, truy vấn, chuyển trạng thái, hủy đơn.
- **Payment**: tạo giao dịch VNPay / MoMo, nhận IPN và return, đồng bộ trạng thái và hoàn tiền tự động.
- **Maps**: reverse geocode, tính khoảng cách.

### Vai trò (`users_role_enum`)

`customer`, `laundry_staff`, `shipper`, `admin`. Đăng ký chỉ tạo `customer`; các role còn lại được nâng quyền trực tiếp trong DB.

### Quy tắc nghiệp vụ đặt lịch

- Chỉ đặt trước tối đa 7 ngày.
- Mỗi khách có tối đa 5 đơn chưa thanh toán.
- Đơn `pending_payment` giữ chỗ 15 phút, quá hạn sẽ tự hủy.
- Khách thanh toán đủ giá ước tính trước khi đơn được xác nhận; nhân viên có thể xác nhận thủ công cho trường hợp tiền mặt.
- Hủy đơn muộn (dưới 2 giờ trước giờ lấy) vẫn được phép nhưng hoàn 0%; hủy đủ điều kiện hoàn 100% sẽ tự động hoàn tiền.
- Mỗi đơn chỉ có một phiên thanh toán đang chờ tại một thời điểm.

## Kiến trúc dự án

```text
src/
├── main.ts                  # bootstrap: prefix /api, ValidationPipe, cookie-parser, CORS
├── app.module.ts            # module gốc
├── app.controller.ts        # GET /api (hello), GET /api/db-health
├── config/
│   └── env.validation.ts    # kiểm tra biến môi trường bắt buộc khi khởi động
├── common/decorators/       # decorator dùng chung (vd chuẩn hóa email)
├── prisma/                  # PrismaModule / PrismaService (kết nối PostgreSQL)
├── redis/                   # RedisModule / RedisService
├── generated/prisma/        # Prisma Client sinh tự động (không sửa tay)
├── modules/                 # mỗi nghiệp vụ một module: controller + service + dto
│   ├── auth/                # auth, guards (JWT, role, rate-limit), strategies,
│   │                        # refresh_token, password_reset_token, email_verification_token
│   ├── user/
│   ├── address/
│   ├── store/
│   ├── store-schedule/
│   ├── laundry-service/
│   ├── promotion/
│   ├── booking/
│   └── payment/             # gateways (vnpay, momo), scheduler đồng bộ / hoàn tiền
├── utils/                   # hàm thuần và tích hợp ngoài
│   ├── address/  maps/  email/
│   └── booking-rules.util.ts, promotion.util.ts, slot-capacity.util.ts
└── types/                   # khai báo kiểu bổ sung (express.d.ts)

prisma/
├── schema.prisma            # schema DB
└── sql/                     # file SQL thay đổi schema, áp dụng thủ công

test/                        # e2e test (Vitest + Supertest)
postman/                     # bộ test black-box API (533 case)
docs/                        # báo cáo hệ thống
```

Quy ước: mỗi module có `*.module.ts`, `*.controller.ts`, `*.service.ts`, thư mục `dto/` (validate bằng `class-validator`) và file `*.spec.ts` đặt cạnh mã nguồn. Toàn bộ route có tiền tố `/api`.

## Cài đặt và chạy

### Yêu cầu

- Node.js và [pnpm](https://pnpm.io)
- PostgreSQL
- Redis

### 1. Cài dependencies

```bash
$ pnpm install
```

Bước `postinstall` tự chạy `prisma generate` để sinh Prisma Client vào `src/generated/prisma`.

### 2. Cấu hình môi trường

```bash
# Linux / macOS / Git Bash
$ cp .env.example .env

# Windows PowerShell
> Copy-Item .env.example .env
```

Các biến **bắt buộc** (thiếu thì app không khởi động, xem [env.validation.ts](src/config/env.validation.ts)):

`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PASSWORD_RESET_TOKEN_SECRET`, `EMAIL_VERIFICATION_TOKEN_SECRET`, `REDIS_KEY_SECRET`.

Các nhóm biến khác trong `.env.example`:

- `REDIS_*`: kết nối Redis.
- `MAIL_*`: gửi email xác thực và đặt lại mật khẩu.
- `VNPAY_*`, `MOMO_*`, `PAYMENT_RESULT_URL`: cổng thanh toán. Không bắt buộc khi dev, thiếu key thì cổng tương ứng trả 503. Cổng thanh toán được viết theo tài liệu, chưa kiểm chứng với sandbox thật.
- `RATE_LIMIT_ENABLED`: đặt `false` để tắt giới hạn tần suất khi dev (production luôn bật).

### 3. Chuẩn bị database

Dự án không dùng `prisma migrate`. Thay đổi schema được viết thành file SQL trong [prisma/sql/](prisma/sql/) (đặt tên theo ngày) và áp dụng thủ công vào database theo thứ tự. Sau khi sửa [prisma/schema.prisma](prisma/schema.prisma), chạy lại:

```bash
$ pnpm run prisma:generate
```

### 4. Chạy ứng dụng

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode (cần build trước)
$ pnpm run build
$ pnpm run start:prod
```

Mặc định server chạy ở `http://localhost:3000` (đổi bằng `PORT`). Kiểm tra nhanh:

- `GET /api`: trả `Hello World!`
- `GET /api/db-health`: trạng thái kết nối database

## Các lệnh thường dùng

| Lệnh | Mô tả |
| --- | --- |
| `pnpm run start:dev` | Chạy dev, tự reload |
| `pnpm run build` | Sinh Prisma Client và build ra `dist/` |
| `pnpm run lint` | Lint bằng oxlint |
| `pnpm run format` | Format bằng Prettier |
| `pnpm run test` | Unit test (white-box) |
| `pnpm run test:cov` | Unit test kèm coverage |
| `pnpm run test:e2e` | E2E test |

## Kiểm thử

Dự án có 3 lớp test:

| Lớp | Công cụ | Vị trí | Cần DB / Redis |
| --- | --- | --- | --- |
| Unit (white-box) | Vitest | `src/**/*.spec.ts` | Không (mock hết phụ thuộc) |
| E2E | Vitest + Supertest | `test/*.e2e-spec.ts` | Có, khởi tạo toàn bộ `AppModule` |
| Black-box API | Postman / Newman | `postman/` | Có, cần server đang chạy |

### Unit test (white-box)

Các service được test độc lập, mọi phụ thuộc (Prisma, Redis, mailer, ...) đều được mock nên **không cần chạy database hay Redis**.

**Cấu hình môi trường test.** Vitest chỉ nạp `.env.test` (và `.env.test.local` nếu có, file sau ghi đè file trước), không đọc `.env` của môi trường dev để tránh dùng nhầm DB / secret thật.

```bash
# Linux / macOS / Git Bash
$ cp .env.test.example .env.test

# Windows PowerShell
> Copy-Item .env.test.example .env.test
```

Giá trị mặc định trong `.env.test.example` (secret giả, `RATE_LIMIT_ENABLED=false`, ...) đã đủ để chạy unit test. `.env.test` nằm trong `.gitignore`.

**Chạy test.**

```bash
# chạy toàn bộ test một lần
$ pnpm run test

# chế độ watch
$ pnpm run test:watch

# chạy một file cụ thể
$ pnpm run test src/modules/booking/booking.service.spec.ts

# chạy các test có tên khớp một chuỗi
$ pnpm run test -t "tên test case"

# debug (dừng tại breakpoint, chạy tuần tự)
$ pnpm run test:debug
```

**Coverage.**

```bash
$ pnpm run test:cov
```

Kết quả in ra terminal và ghi vào thư mục `coverage/` (đã nằm trong `.gitignore`).

**Các nhóm test hiện có.**

| Nhóm | Vị trí |
| --- | --- |
| Auth (service, guard, strategy, token) | `src/modules/auth/**/*.spec.ts` |
| Booking (service, quy tắc đặt lịch) | `src/modules/booking/*.spec.ts` |
| Payment, Promotion, Address, User | `src/modules/{payment,promotion,address,user}/*.spec.ts` |
| Store, Store schedule, Laundry service | `src/modules/{store,store-schedule,laundry-service}/*.spec.ts` |
| Hàm tiện ích (khoảng cách, slot, khuyến mãi, địa chỉ) | `src/utils/**/*.spec.ts` |

Lưu ý: nếu test báo thiếu biến môi trường, kiểm tra `.env.test` đã có ở thư mục gốc và chạy lệnh từ thư mục gốc dự án.

### E2E test

[test/app.e2e-spec.ts](test/app.e2e-spec.ts) khởi tạo toàn bộ `AppModule` và áp dụng cùng cấu hình như `main.ts` (tiền tố `/api`, `ValidationPipe`), rồi kiểm tra các luồng bị chặn trước khi chạm dữ liệu: route gốc, guard trả 401 khi thiếu token, validation trả 400 khi thiếu hoặc thừa field.

Cần điền thêm vào `.env.test`:

- `DATABASE_URL` trỏ tới một database test riêng (bắt buộc, xem `env.validation.ts`). Không dùng DB dev.
- Redis chạy ở `REDIS_HOST` / `REDIS_PORT` (mặc định `localhost:6379`, `REDIS_DB=1`).

```bash
$ pnpm run test:e2e
```

Lưu ý: khi `NODE_ENV=test` (Vitest tự đặt), `ConfigModule` trong `AppModule` đọc `.env.test.local` và `.env.test` thay cho `.env`, nên e2e không dùng nhầm cấu hình dev. Biến nào không khai báo trong `.env.test` (ví dụ `MAIL_*`) sẽ không có giá trị.

### Black-box API (Postman)

Bộ 533 test case nằm trong [postman/](postman/). Xem [postman/README.md](postman/README.md) để biết cách chuẩn bị 3 tài khoản test, tắt rate limit và chạy bằng Postman hoặc Newman.

## Quy tắc đặt Redis key

Quy ước:
<app>:<env>:<module>:<purpose>:<identifier>:<window>

Ví dụ:
Mục đích Redis key mẫu
Giới hạn login theo IP laundry:dev:auth:rate:login:ip:<hash>:60s
Giới hạn login theo email laundry:dev:auth:rate:login:account:<hash>:60s
Giới hạn gửi email xác minh laundry:dev:auth:rate:verify-email:ip:<hash>:900s
Giới hạn quên mật khẩu laundry:dev:auth:rate:forgot-password:account:<hash>:900s
Các nguyên tắc chính:

- laundry: tên ứng dụng.
- dev, staging, prod: môi trường, tránh xung đột key giữa các môi trường nếu dùng chung Redis.
- auth:rate: nhóm nghiệp vụ và mục đích sử dụng.
- login, forgot-password: endpoint hoặc hành động.
- ip, account: loại định danh.
- <hash>: giá trị định danh đã băm, không phải dữ liệu gốc.
- 60s, 900s: cửa sổ giới hạn, giúp key dễ quan sát.
Không nhất thiết phải nhúng thời lượng cửa sổ vào key nếu bạn dùng fixed window với TTL; đây là lựa chọn để key dễ đọc và dễ debug. Quan trọng nhất là thống nhất quy tắc trên toàn hệ thống.
