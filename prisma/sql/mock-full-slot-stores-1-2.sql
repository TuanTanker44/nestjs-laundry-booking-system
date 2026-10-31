-- PostgreSQL / DB demo: kín ca 10:00-10:30 NGÀY MAI cho store 1 và 2.
-- Chạy toàn bộ file. Không tự thực thi lên DB.
-- API hiện tính số chỗ theo max_bookings_per_slot, KHÔNG đặt trước máy.
-- Script đặt capacity = số máy washer/washer_dryer có thể vận hành (idle/running).
-- Có cập nhật lịch THỨ tương ứng của cả hai store: mở 08-20h, slot 30 phút.
-- Lịch thứ đó các tuần khác cũng chịu cấu hình mới. Không sửa/xóa đơn hiện có.
-- Chạy lại chỉ bổ sung số đơn còn thiếu để đủ capacity.
-- Giờ HẸN lưu nguyên giờ địa phương, đúng schedule-time.util.ts (không trừ 7h).
-- created_at/updated_at là thời điểm UTC như Prisma.

BEGIN;
SELECT pg_advisory_xact_lock(10312026, 12);

DO $seed$
DECLARE
  v_date date := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + 1;
  v_time time := time '10:00'; -- chọn mốc 00 hoặc 30 phút, trong khoảng 08:00-19:30
  v_store integer;
  v_capacity integer;
  v_booked integer;
  v_index integer;
  v_customer integer;
  v_service integer;
  v_unit_price numeric;
  v_start timestamp;
  v_code text;
  v_now timestamp := CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
BEGIN
  IF (SELECT COUNT(*) FROM laundry_stores WHERE id IN (1, 2) AND status = 'active') <> 2 THEN
    RAISE EXCEPTION 'Cần có cửa hàng 1 và 2 đang active.';
  END IF;
  IF v_time < time '08:00' OR v_time > time '19:30'
     OR extract(minute FROM v_time)::integer % 30 <> 0
     OR extract(second FROM v_time) <> 0 THEN
    RAISE EXCEPTION 'Giờ bắt đầu phải khớp ca 30 phút trong khoảng 08:00-19:30.';
  END IF;
  v_start := v_date + v_time;

  INSERT INTO users (full_name, email, password_hash, role, status)
  VALUES ('Khách demo kín ca', 'fullslot@example.invalid', '!disabled-demo-account', 'customer', 'active')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO v_customer FROM users WHERE email = 'fullslot@example.invalid';

  FOREACH v_store IN ARRAY ARRAY[1, 2] LOOP
    SELECT COUNT(*) INTO v_capacity FROM machines
    WHERE store_id = v_store AND type IN ('washer', 'washer_dryer')
      AND status IN ('idle', 'running');
    IF v_capacity = 0 THEN
      RAISE EXCEPTION 'Store % chưa có máy giặt khả dụng. Chạy mock-dashboard-stores-1-2.sql trước.', v_store;
    END IF;

    -- Không ghi đè ngày nghỉ/giờ ngoại lệ; báo lỗi và rollback toàn bộ.
    IF EXISTS (
      SELECT 1 FROM store_schedule_exceptions
      WHERE store_id = v_store AND exception_date = v_date
        AND (is_closed OR COALESCE(open_time, time '08:00') > v_time
          OR COALESCE(close_time, time '20:00') < v_time + interval '30 minutes'
          OR extract(epoch FROM (v_time - COALESCE(open_time, time '08:00')))::integer % 1800 <> 0)
    ) THEN
      RAISE EXCEPTION 'Store % có lịch ngoại lệ không phù hợp ngày %. Hãy chọn ngày khác.', v_store, v_date;
    END IF;

    INSERT INTO store_schedules (
      store_id, day_of_week, open_time, close_time, slot_duration_minutes, max_bookings_per_slot
    ) VALUES (v_store, extract(dow FROM v_date)::integer, '08:00', '20:00', 30, v_capacity)
    ON CONFLICT (store_id, day_of_week) DO UPDATE SET
      open_time = EXCLUDED.open_time, close_time = EXCLUDED.close_time,
      slot_duration_minutes = 30, max_bookings_per_slot = EXCLUDED.max_bookings_per_slot;

    SELECT id, unit_price INTO v_service, v_unit_price FROM services
    WHERE store_id = v_store AND name = 'DEMO - Giặt sấy tiêu chuẩn' AND status = 'active'
    ORDER BY id LIMIT 1;
    IF v_service IS NULL THEN
      INSERT INTO services (store_id, name, pricing_unit, unit_price, status)
      VALUES (v_store, 'DEMO - Giặt sấy tiêu chuẩn', 'per_kg', 25000, 'active')
      RETURNING id, unit_price INTO v_service, v_unit_price;
    END IF;

    -- Khớp slotBlockingWhere(): kể cả đơn thật đang chiếm ca, bỏ cancelled/no_show
    -- và pending_payment đã hết thời gian giữ chỗ 15 phút.
    SELECT COUNT(*) INTO v_booked FROM bookings
    WHERE store_id = v_store AND scheduled_pickup_start = v_start
      AND status NOT IN ('cancelled', 'no_show')
      AND NOT (status = 'pending_payment' AND created_at < v_now - interval '15 minutes');

    v_index := 0;
    WHILE v_booked < v_capacity LOOP
      v_index := v_index + 1;
      -- <=20 ký tự với store 1/2 và số thứ tự tới 9999.
      v_code := format('FS%s%s%s%s', to_char(v_date, 'YYMMDD'),
        to_char(v_start, 'HH24MI'), v_store, lpad(v_index::text, 4, '0'));
      IF v_index > 9999 THEN
        RAISE EXCEPTION 'Vượt giới hạn mã demo.';
      END IF;
      IF EXISTS (SELECT 1 FROM bookings WHERE booking_code = v_code) THEN
        CONTINUE;
      END IF;

      INSERT INTO bookings (
        booking_code, customer_id, store_id, service_id, in_store,
        scheduled_pickup_start, scheduled_pickup_end, estimated_delivery_at,
        status, estimated_weight_kg, estimated_price, pricing_unit,
        service_name, unit_price, delivery_price, special_instructions, created_at, updated_at
      ) VALUES (
        v_code, v_customer, v_store, v_service, true,
        v_start, v_start + interval '30 minutes', v_start + interval '1 day',
        'confirmed', 3, 3 * v_unit_price, 'per_kg',
        'DEMO - Giặt sấy tiêu chuẩn', v_unit_price, 0, 'DEMO: ca 30 phút kín chỗ.', v_now, v_now
      );
      v_booked := v_booked + 1;
    END LOOP;

    RAISE NOTICE 'Store %, ca % - %: booked=%, capacity=%, available=0',
      v_store, v_start, v_start + interval '30 minutes', v_booked, v_capacity;
  END LOOP;
END;
$seed$;
COMMIT;

SELECT store_id, scheduled_pickup_start, scheduled_pickup_end, COUNT(*) AS demo_bookings
FROM bookings WHERE booking_code LIKE 'FS%' AND store_id IN (1, 2)
GROUP BY store_id, scheduled_pickup_start, scheduled_pickup_end
ORDER BY scheduled_pickup_start, store_id;
