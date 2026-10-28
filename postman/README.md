# Bộ test black-box cho Laundry Booking API

- `laundry-booking.postman_collection.json`: 533 request (mỗi request là một test case, tên có mã `TC-<module>-<số>`).
- `laundry-booking.postman_environment.json`: biến môi trường (base URL và 3 tài khoản test).

Test được viết từ controller, DTO và service, chưa được chạy với server thật. Lần chạy đầu có thể có vài case lệch kỳ vọng. Hãy xem từng case fail để quyết định là lỗi API hay lỗi test.

## 1. Chuẩn bị

**Server**: đặt `RATE_LIMIT_ENABLED=false` trong `.env` rồi khởi động lại. Nếu không, các case đăng ký và đăng nhập sẽ bị 429 sau vài request.

**3 tài khoản test** (repo không có seed, đăng ký chỉ tạo customer). Đăng ký 3 tài khoản qua `POST /api/auth/register` với mật khẩu `Passw0rd!`, rồi chạy SQL:

```sql
UPDATE users SET email_verified_at = now() WHERE email IN ('customer@example.com','staff@example.com','admin@example.com');
UPDATE users SET role = 'laundry_staff' WHERE email = 'staff@example.com';
UPDATE users SET role = 'admin'         WHERE email = 'admin@example.com';
```

Nếu dùng email hoặc mật khẩu khác, sửa trong environment (`customer_email`, `staff_password`, ...).

## 2. Chạy

- **Postman app**: Import cả 2 file, chọn environment `Laundry Booking - Local`, bấm **Run collection**.
- **Newman**: `npx newman run postman/laundry-booking.postman_collection.json -e postman/laundry-booking.postman_environment.json`

## 3. Lưu ý quan trọng

- **Phải chạy cả collection theo thứ tự** (không chạy lẻ từng request). Các folder dùng chung dữ liệu: folder 04 tạo store và gán staff, các folder sau dùng store đó. Token và id được lưu vào collection variables.
- **Chạy liền một mạch trong vài phút**: đơn `pending_payment` chỉ giữ chỗ 15 phút, quá hạn sẽ tự hủy và làm các case sau fail.
- **Mỗi lần chạy để lại dữ liệu** trong DB: một user `qa_<timestamp>@example.com`, store (bị xóa mềm ở cuối), dịch vụ, mã khuyến mãi, đơn đã hủy hoặc hoàn tất. Nên chạy trên DB dev, không chạy trên production.
- Nếu run bị dừng giữa chừng ở folder 02 (đổi mật khẩu), mật khẩu của user `qa_...` có thể đã đổi. Việc này không ảnh hưởng 3 tài khoản chính, vì phần đổi mật khẩu dùng user vừa đăng ký.
- Case VNPay/MoMo chấp nhận cả `201` (đã cấu hình cổng) và `503` (chưa có key). Case reverse-geocode cần mạng để gọi dịch vụ bản đồ bên ngoài.
- Folder `14 - Rate limit` mặc định bị bỏ qua. Muốn chạy: bật `RATE_LIMIT_ENABLED=true` trên server, đặt `rate_limit_enabled=true` trong environment, và chạy riêng folder đó.

## 4. Nội dung từng folder

| Folder | Nội dung chính |
| --- | --- |
| 00 Setup | health check, đăng nhập 3 role |
| 01 Auth | register (validation, trùng email, mass assignment), login, refresh/logout bằng cookie, verify/resend/forgot/reset với token sai |
| 02 Users | profile, đổi mật khẩu (đổi rồi khôi phục), phân quyền admin |
| 03 Addresses | CRUD, địa chỉ mặc định, IDOR giữa 2 khách |
| 04 Stores | public list/filter/phân trang, tạo/sửa/xóa mềm, phân quyền, gán/gỡ staff |
| 05 Store schedules | lịch tuần, ngày ngoại lệ, available-slots |
| 06 Services | dịch vụ theo store và dịch vụ dùng chung, trùng tên, biên giá, xóa mềm |
| 07 Promotions | tạo mã (chuẩn hóa chữ hoa, trùng, biên percent/value, ngày), danh sách |
| 08 Bookings: quote | báo giá và toàn bộ validation đặt lịch (ngày, slot, địa chỉ, cân nặng, items, mã giảm) |
| 09 Bookings: tạo & truy vấn | tạo đơn, slot đầy, mã hết lượt, danh sách, chi tiết, IDOR, manage |
| 10 Payments | tạo giao dịch, lịch sử, IDOR, IPN/return với chữ ký sai (không gọi cổng thật) |
| 11 Bookings: trạng thái & hủy | luồng đầy đủ tại cửa hàng và giao nhận, chuyển trạng thái sai luồng, hủy theo từng role, slot được giải phóng |
| 12 Maps | reverse-geocode |
| 13 Dọn dẹp | gỡ staff, xóa ngoại lệ, xóa mềm store |

## 5. Chưa được bao phủ (black-box không làm được hoặc cần dữ liệu đặc biệt)

- Xác thực email và đặt lại mật khẩu thành công (token chỉ gửi qua email).
- Thanh toán thành công thật, hoàn tiền, cron đồng bộ (cần sandbox VNPay/MoMo).
- Giới hạn tối đa 5 đơn chưa thanh toán, hủy muộn (< 2 giờ trước giờ lấy, hoàn 0%), hết hạn giữ chỗ 15 phút (cần chờ hoặc chỉnh đồng hồ).
- Access token hết hạn, refresh token hết hạn hoặc bị thu hồi.
- Cập nhật user bởi admin (không có endpoint trong controller).
