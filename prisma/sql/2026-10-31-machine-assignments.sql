-- Chạy trước khi deploy code gán máy theo khung giờ booking.
-- Giờ lịch lấy trực tiếp từ bookings.scheduled_pickup_start/end (giờ cửa hàng).
-- Không dùng started_at/ended_at của log thực tế làm lịch hẹn.
BEGIN;
CREATE TABLE IF NOT EXISTS machine_assignments (
  id SERIAL PRIMARY KEY,
  machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_machine_assignment_booking UNIQUE (machine_id, booking_id)
);
CREATE INDEX IF NOT EXISTS idx_machine_assignment_booking ON machine_assignments(booking_id);

-- Giữ phân công từ các phiên đã có, kể cả log đóng để giữ lịch sử.
INSERT INTO machine_assignments (machine_id, booking_id, created_at)
SELECT l.machine_id, l.booking_id, MIN(l.created_at)
FROM machine_usage_logs l
JOIN bookings b ON b.id = l.booking_id
JOIN machines m ON m.id = l.machine_id AND m.store_id = b.store_id
WHERE b.scheduled_pickup_start IS NOT NULL
  AND b.scheduled_pickup_end > b.scheduled_pickup_start
GROUP BY l.machine_id, l.booking_id
ON CONFLICT (machine_id, booking_id) DO NOTHING;
COMMIT;

-- Các lịch cũ bị trùng (nếu có) được báo để xử lý, không tự xóa dữ liệu.
SELECT a.machine_id, a.booking_id, other.booking_id AS conflicting_booking_id
FROM machine_assignments a
JOIN bookings b ON b.id = a.booking_id
JOIN machine_assignments other ON other.machine_id = a.machine_id AND other.id > a.id
JOIN bookings ob ON ob.id = other.booking_id
WHERE b.status NOT IN ('cancelled', 'no_show') AND ob.status NOT IN ('cancelled', 'no_show')
  AND b.scheduled_pickup_start < ob.scheduled_pickup_end
  AND b.scheduled_pickup_end > ob.scheduled_pickup_start;
