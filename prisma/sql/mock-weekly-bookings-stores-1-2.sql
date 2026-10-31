-- PostgreSQL: thêm 28 booking/store cho cửa hàng 1 và 2 (56 booking/tuần).
-- Tuần tính từ thứ Hai đến Chủ nhật theo giờ Việt Nam tại lúc chạy.
-- Ví dụ chạy ngày 31/10/2026 => tuần 26/10/2026 - 01/11/2026.
-- Có thể chạy độc lập với mock-dashboard-stores-1-2.sql, nhưng store 1/2 phải tồn tại.
-- Không đổi phân công nhân viên, không gán thêm máy cho đơn processing.

BEGIN;
SELECT pg_advisory_xact_lock(10312026, 12);

DO $seed$
DECLARE
  -- Đổi thành DATE '2026-10-31' nếu muốn cố định tuần trong ảnh dashboard.
  v_reference_date date := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_monday date;
  v_day date;
  v_store integer;
  v_day_index integer;
  v_slot integer;
  v_customer integer;
  v_service integer;
  v_booking integer;
  v_code text;
  v_email text;
  v_service_name text;
  v_status bookings_status_enum;
  v_start timestamp;
  v_end timestamp;
  v_created timestamp;
  v_updated timestamp;
  v_now timestamp := CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
  v_weight numeric;
  v_unit_price numeric;
  v_total numeric;
BEGIN
  IF (SELECT COUNT(*) FROM laundry_stores WHERE id IN (1, 2)) <> 2 THEN
    RAISE EXCEPTION 'Cần có đủ cửa hàng ID 1 và 2 trước khi chạy file này.';
  END IF;

  v_monday := v_reference_date - (extract(isodow FROM v_reference_date)::integer - 1);

  FOREACH v_store IN ARRAY ARRAY[1, 2] LOOP
    FOR v_day_index IN 0..6 LOOP
      v_day := v_monday + v_day_index;

      FOR v_slot IN 1..4 LOOP
        -- 18 ký tự, nằm trong giới hạn booking_code VARCHAR(20).
        v_code := format('WK%s-S%s-%s', to_char(v_day, 'YYYYMMDD'), v_store, v_slot);
        IF EXISTS (SELECT 1 FROM bookings WHERE booking_code = v_code) THEN
          CONTINUE;
        END IF;

        v_email := format('weekly.s%s.customer%s@example.invalid', v_store, v_slot);
        INSERT INTO users (full_name, email, password_hash, phone, role, status)
        VALUES (
          (ARRAY['Đỗ Ngọc Mai', 'Bùi Quang Huy', 'Vũ Thanh Tâm', 'Hoàng Hải Yến'])[v_slot],
          v_email, '!disabled-demo-account', format('091%s00000%s', v_store, v_slot),
          'customer', 'active'
        ) ON CONFLICT (email) DO NOTHING;
        SELECT id INTO v_customer FROM users WHERE email = v_email;

        v_service_name := CASE WHEN v_slot % 2 = 0
          THEN 'DEMO - Giặt sấy cao cấp' ELSE 'DEMO - Giặt sấy tiêu chuẩn' END;
        v_unit_price := CASE WHEN v_slot % 2 = 0 THEN 35000 ELSE 25000 END;

        SELECT id INTO v_service FROM services
        WHERE store_id = v_store AND name = v_service_name
        ORDER BY id LIMIT 1;
        IF v_service IS NULL THEN
          INSERT INTO services (
            store_id, name, description, pricing_unit, unit_price,
            estimated_turnaround_hours, status
          ) VALUES (
            v_store, v_service_name, 'Dịch vụ mẫu cho lịch hoạt động',
            'per_kg', v_unit_price, 24, 'active'
          ) RETURNING id INTO v_service;
        END IF;
        -- Dùng đúng giá hiện lưu nếu dịch vụ demo đã tồn tại.
        SELECT unit_price INTO v_unit_price FROM services WHERE id = v_service;

        -- Bốn ca: 08:00, 10:00, 14:00, 16:30 giờ VN.
        -- Store 2 lệch 30 phút, thời lượng ca 30/60/90/60 phút.
        v_start := v_day::timestamp
          + (ARRAY[interval '8 hours', interval '10 hours', interval '14 hours', interval '16 hours 30 minutes'])[v_slot]
          + (v_store - 1) * interval '30 minutes'
          - interval '7 hours';
        v_end := v_start + (ARRAY[30, 60, 90, 60])[v_slot] * interval '1 minute';
        v_created := LEAST(v_start - interval '1 day', v_now);

        IF v_day < v_reference_date THEN
          v_status := CASE
            WHEN v_day_index = 1 AND v_slot = 4 THEN 'cancelled'::bookings_status_enum
            WHEN v_day_index = 2 AND v_slot = 3 THEN 'no_show'::bookings_status_enum
            ELSE 'completed'::bookings_status_enum
          END;
          v_updated := LEAST(v_end + interval '4 hours', v_now);
        ELSIF v_day > v_reference_date OR v_start > v_now THEN
          -- Ca tương lai giữ confirmed, không tạo đơn quá hạn pending_payment.
          v_status := 'confirmed';
          v_updated := v_created;
        ELSE
          v_status := (ARRAY[
            'picked_up'::bookings_status_enum, 'processing'::bookings_status_enum,
            'ready_for_delivery'::bookings_status_enum, 'confirmed'::bookings_status_enum
          ])[v_slot];
          v_updated := LEAST(v_start + interval '30 minutes', v_now);
        END IF;

        v_weight := 2.5 + ((v_day_index + v_slot + v_store) % 8) * 0.5;
        v_total := v_weight * v_unit_price;

        INSERT INTO bookings (
          booking_code, customer_id, store_id, service_id, in_store,
          scheduled_pickup_start, scheduled_pickup_end, estimated_delivery_at,
          status, estimated_weight_kg, actual_weight_kg, estimated_price, final_price,
          pricing_unit, service_name, unit_price, delivery_price,
          special_instructions, cancelled_by, cancellation_reason, created_at, updated_at
        ) VALUES (
          v_code, v_customer, v_store, v_service, true, v_start, v_end, v_end + interval '4 hours',
          v_status, v_weight,
          CASE WHEN v_status IN ('picked_up', 'processing', 'ready_for_delivery', 'completed') THEN v_weight END,
          v_total,
          CASE WHEN v_status IN ('picked_up', 'processing', 'ready_for_delivery', 'completed') THEN v_total END,
          'per_kg', v_service_name, v_unit_price, 0,
          (ARRAY['Giặt riêng đồ sáng màu.', 'Không dùng nước xả vải.', 'Gấp gọn sau khi sấy.', 'Khách tự mang và nhận tại cửa hàng.'])[v_slot],
          CASE WHEN v_status = 'cancelled' THEN v_customer END,
          CASE WHEN v_status = 'cancelled' THEN 'DEMO: Khách đổi lịch.' END,
          v_created, v_updated
        ) RETURNING id INTO v_booking;

        INSERT INTO booking_items (booking_id, item_name, category, quantity, note, created_at)
        VALUES (
          v_booking,
          (ARRAY['Áo sơ mi và quần tây', 'Quần áo gia đình', 'Chăn ga mỏng', 'Đồ thể thao'])[v_slot],
          'laundry', 3 + v_day_index + v_slot, 'Tính tiền theo kg; số lượng dùng kiểm đếm.', v_created
        );

        -- Chỉ ghi thanh toán tiền mặt cho các đơn đã hoàn thành.
        IF v_status = 'completed' THEN
          INSERT INTO payments (
            booking_id, payment_type, amount, method, status, paid_at, created_at, updated_at
          ) VALUES (
            v_booking, 'full', v_total, 'cash', 'success', v_updated, v_updated, v_updated
          );
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Đã thêm đơn demo cho tuần % đến %, store 1 và 2.', v_monday, v_monday + 6;
END;
$seed$;

COMMIT;

-- Xem ca theo giờ Việt Nam (DB lưu timestamp UTC).
SELECT booking_code, store_id, service_name, status,
  scheduled_pickup_start + interval '7 hours' AS start_vn,
  scheduled_pickup_end + interval '7 hours' AS end_vn,
  estimated_price
FROM bookings
WHERE store_id IN (1, 2) AND booking_code LIKE 'WK%'
ORDER BY scheduled_pickup_start, store_id;
