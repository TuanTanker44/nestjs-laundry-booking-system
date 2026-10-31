# Gán máy theo ca booking

Trước khi chạy bản code này, chạy toàn bộ `prisma/sql/2026-10-31-machine-assignments.sql`
trên DB và chạy `npm run prisma:generate`. SQL tạo bảng mới và giữ phân công từ
machine_usage_logs cũ; không đổi giờ hoặc đóng log hiện có. Kết quả truy vấn cuối
file liệt kê các phân công cũ bị trùng lịch nếu có, để quản trị viên xử lý.

Giờ lịch dùng trực tiếp `bookings.scheduled_pickup_start/end`, theo quy ước giờ
cửa hàng của API booking. Không đổi sang UTC thêm lần nữa. Log chạy máy thực tế
vẫn dùng thời điểm UTC thực.

## Lấy máy theo ca

```http
GET /api/stores/1/machines?booking_id=123&page=1&limit=100
```

Khi có `booking_id`:

- `status` và bộ lọc `status=idle|running` phản ánh lịch của ca booking.
  `running` ở đây nghĩa là đã có booking giữ ca, kể cả ca tương lai.
- `current_status` phản ánh vận hành ngay hiện tại.
- `available_for_booking` cho biết không có booking KHÁC giữ ca và máy không
  maintenance/offline; vẫn cần kiểm tra trạng thái đơn, cân nặng lúc gán.
- `assigned_to_booking` cho biết máy đã được gán cho chính booking đang xem.
- `current_usage` vẫn là phiên chạy thực tế hiện tại.

Không truyền `booking_id`: API giữ cách trả trạng thái vận hành hiện tại.
Máy maintenance/offline hiện bị chặn cho mọi ca; chưa có lịch bảo trì theo giờ.

## Gán và bỏ gán

```http
POST /api/stores/1/machines/5/assign
Content-Type: application/json

{ "booking_id": 123 }
```

Booking phải cùng cửa hàng, có ca hợp lệ chưa kết thúc và đang confirmed,
picked_up hoặc processing. Kiểm tra sức chứa bằng actual_weight_kg nếu có,
nếu không dùng estimated_weight_kg. Một booking có thể gán nhiều máy.

Trùng lịch khi `existing.start < requested.end AND existing.end > requested.start`.
Ca 10:00-10:30 và 10:30-11:00 không trùng. Booking cancelled/no_show không giữ máy.
Gán lại cùng booking/máy không tạo thêm bản ghi. Trùng booking khác trả 409.
Khóa dòng booking rồi dòng máy trong transaction để tránh hai request chiếm cùng ca.

Gán lịch không đổi máy thành running và không mở log sử dụng thực tế.
Response có thông tin máy và `assignment` gồm id, machine_id, booking_id, created_at.
Các API danh sách/chi tiết booking trả `machine_assignments[]`, có `machine`
gồm id, store_id, name, type. Giờ ca nằm ở scheduled_pickup_start/end của booking.

```http
DELETE /api/stores/1/machines/5/assignments/123
```

Không bỏ lịch gán khi máy còn phiên chạy mở cho booking đó; cần release trước.

## Bắt đầu chạy và nhả máy

```http
POST /api/stores/1/machines/5/start
Content-Type: application/json

{ "booking_id": 123 }
```

Đây là bước vận hành sau khi gán lịch: booking phải processing, đang trong ca đã
gán và máy thực tế idle, đủ sức chứa. Thành công đổi máy thành running và mở log.
Máy thực tế chạy quá ca trước vẫn chặn bắt đầu ca mới cho đến khi được nhả.

```http
POST /api/stores/1/machines/5/release
```

Nhả máy đóng log thực tế và trả máy về idle, không xóa lịch gán. Không tự nhả
chỉ vì hết 30 phút. Muốn bỏ lịch gán dùng DELETE ở trên.
Các route đều yêu cầu Bearer token của admin hoặc staff được gán vào cửa hàng.
