-- PostgreSQL / DB demo: tất cả máy CÓ THỂ VẬN HÀNH của store 1/2 đều bận NGAY BÂY GIỜ.
-- Độc lập với mock-full-slot-stores-1-2.sql. Cần có store và máy trước.
-- Giữ nguyên máy đã running, maintenance, offline; chỉ lấy máy idle chưa có log mở.
-- Mỗi máy mới chiếm được có 1 booking processing và 1 log ended_at=NULL.
-- Khoảng hẹn của các đơn mới dài 30 phút, bắt đầu tại mốc :00/:30 hiện tại.
-- QUAN TRỌNG: máy KHÔNG tự nhả sau 30 phút. Nhả bằng API release khi test xong.
-- Không cập nhật cấu hình slot; không đảm bảo API lịch báo available=0.
-- Không thể dùng log này để đặt trước máy trong một ca tương lai.

BEGIN;
SELECT pg_advisory_xact_lock(10312026, 12);
DO $seed$
DECLARE
  v_machine record;
  v_customer integer;
  v_service integer;
  v_booking integer;
  v_price numeric;
  v_weight numeric;
  v_code text;
  v_now timestamp := CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
  v_local timestamp := CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_slot timestamp;
BEGIN
  IF (SELECT COUNT(DISTINCT store_id) FROM machines WHERE store_id IN (1, 2)) <> 2 THEN
    RAISE EXCEPTION 'Cần có máy ở cả store 1 và 2. Chạy mock-dashboard-stores-1-2.sql trước.';
  END IF;
  v_slot := date_trunc('hour', v_local)
    + CASE WHEN extract(minute FROM v_local) >= 30 THEN interval '30 minutes' ELSE interval '0 minutes' END;

  INSERT INTO users (full_name, email, password_hash, role, status)
  VALUES ('Khách demo kín máy', 'fullmachines@example.invalid', '!disabled-demo-account', 'customer', 'active')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO v_customer FROM users WHERE email = 'fullmachines@example.invalid';

  FOR v_machine IN
    SELECT m.* FROM machines m
    WHERE m.store_id IN (1, 2) AND m.status = 'idle'
      AND NOT EXISTS (SELECT 1 FROM machine_usage_logs l WHERE l.machine_id = m.id AND l.ended_at IS NULL)
    ORDER BY m.id FOR UPDATE OF m
  LOOP
    SELECT id, unit_price INTO v_service, v_price FROM services
    WHERE store_id = v_machine.store_id AND name = 'DEMO - Giặt sấy tiêu chuẩn' AND status = 'active'
    ORDER BY id LIMIT 1;
    IF v_service IS NULL THEN
      INSERT INTO services (store_id, name, pricing_unit, unit_price, status)
      VALUES (v_machine.store_id, 'DEMO - Giặt sấy tiêu chuẩn', 'per_kg', 25000, 'active')
      RETURNING id, unit_price INTO v_service, v_price;
    END IF;
    -- Không vượt sức chứa máy; booking id sequence làm mã duy nhất, tối đa 20 ký tự.
    v_weight := LEAST(3, v_machine.capacity_kg);
    v_booking := nextval(pg_get_serial_sequence('bookings', 'id'));
    v_code := 'MB-' || v_booking::text;
    INSERT INTO bookings (
      id, booking_code, customer_id, store_id, service_id, in_store,
      scheduled_pickup_start, scheduled_pickup_end, estimated_delivery_at,
      status, estimated_weight_kg, actual_weight_kg, estimated_price, final_price,
      pricing_unit, service_name, unit_price, delivery_price, special_instructions,
      created_at, updated_at
    ) VALUES (
      v_booking, v_code, v_customer, v_machine.store_id, v_service, true,
      v_slot, v_slot + interval '30 minutes', v_slot + interval '30 minutes',
      'processing', v_weight, v_weight, v_weight * v_price, v_weight * v_price,
      'per_kg', 'DEMO - Giặt sấy tiêu chuẩn', v_price, 0,
      'DEMO: chiếm máy để test hết máy rảnh; cần nhả máy khi test xong.', v_now, v_now
    );
    INSERT INTO machine_usage_logs (machine_id, booking_id, started_at, created_at)
    VALUES (v_machine.id, v_booking, v_now, v_now);
    UPDATE machines SET status = 'running', updated_at = v_now WHERE id = v_machine.id;
  END LOOP;
END;
$seed$;
COMMIT;

SELECT m.store_id, m.id AS machine_id, m.name, m.status, b.booking_code,
  b.scheduled_pickup_start, b.scheduled_pickup_end
FROM machines m
LEFT JOIN machine_usage_logs l ON l.machine_id = m.id AND l.ended_at IS NULL
LEFT JOIN bookings b ON b.id = l.booking_id
WHERE m.store_id IN (1, 2)
ORDER BY m.store_id, m.id;

-- Nhả từng máy demo qua API (admin/staff được gán cửa hàng):
-- POST /api/stores/:storeId/machines/:machineId/release
