-- PostgreSQL: dữ liệu demo cho dashboard của CHỈ store_id = 1 và 2.
-- Mỗi store: 6 máy, 1 dịch vụ, 14 đơn (8 hôm nay + 6 ngày trước).
-- Ngày được tính theo Asia/Ho_Chi_Minh; timestamp trong DB lưu UTC như API.
-- Giữ nguyên staff_assignments; dùng tài khoản đã được gán store 1/2 để xem.

BEGIN;

-- Tránh hai lần chạy file này đồng thời tạo trùng máy/dịch vụ.
SELECT pg_advisory_xact_lock(10312026, 12);

INSERT INTO laundry_stores (id, name, address, phone, status)
VALUES
  (1, 'Hoa Sen - Nam Từ Liêm', 'Nam Từ Liêm, Hà Nội', '0240000001', 'active'),
  (2, 'Hoa Sen - Cầu Giấy', 'Cầu Giấy, Hà Nội', '0240000002', 'active')
ON CONFLICT (id) DO NOTHING;

-- Đồng bộ sequence vì store 1/2 có thể vừa được tạo bằng ID tường minh.
-- Không giảm sequence nếu đã có giá trị lớn hơn MAX(id).
SELECT setval(
  pg_get_serial_sequence('laundry_stores', 'id'),
  GREATEST(
    (SELECT MAX(id) FROM laundry_stores),
    COALESCE(pg_sequence_last_value(pg_get_serial_sequence('laundry_stores', 'id')::regclass), 1)
  ),
  true
);

DO $seed$
DECLARE
  v_store_id integer;
  v_customer_id integer;
  v_service_id integer;
  v_machine_id integer;
  v_booking_id integer;
  v_index integer;
  v_code text;
  v_email text;
  v_status bookings_status_enum;
  v_weight numeric;
  v_price numeric;
  v_created timestamp;
  v_updated timestamp;
  v_now timestamp := CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
  v_today timestamp := date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh');
BEGIN
  FOREACH v_store_id IN ARRAY ARRAY[1, 2] LOOP
    -- Tên có tiền tố DEMO để nhận diện và không lẫn máy thật.
    INSERT INTO machines (store_id, name, type, capacity_kg, status)
    SELECT v_store_id, d.name, d.type::machines_type_enum, d.capacity, d.status::machines_status_enum
    FROM (VALUES
      ('DEMO - Máy giặt 01', 'washer',       10, 'idle'),
      ('DEMO - Máy giặt 02', 'washer',       12, 'idle'),
      ('DEMO - Máy sấy 01',  'dryer',        10, 'idle'),
      ('DEMO - Giặt sấy 01', 'washer_dryer', 15, 'idle'),
      ('DEMO - Máy giặt 03', 'washer',        8, 'maintenance'),
      ('DEMO - Máy sấy 02',  'dryer',         8, 'offline')
    ) AS d(name, type, capacity, status)
    WHERE NOT EXISTS (
      SELECT 1 FROM machines m
      WHERE m.store_id = v_store_id AND lower(m.name) = lower(d.name)
    );

    SELECT id INTO v_service_id FROM services
    WHERE store_id = v_store_id AND name = 'DEMO - Giặt sấy tiêu chuẩn'
    ORDER BY id LIMIT 1;

    IF v_service_id IS NULL THEN
      INSERT INTO services (
        store_id, name, description, pricing_unit, unit_price,
        estimated_turnaround_hours, status
      ) VALUES (
        v_store_id, 'DEMO - Giặt sấy tiêu chuẩn', 'Dịch vụ mẫu cho dashboard',
        'per_kg', 25000, 24, 'active'
      ) RETURNING id INTO v_service_id;
    END IF;

    FOR v_index IN 1..14 LOOP
      v_code := format('DEMO-S%s-%s', v_store_id, lpad(v_index::text, 2, '0'));
      IF EXISTS (SELECT 1 FROM bookings WHERE booking_code = v_code) THEN
        CONTINUE;
      END IF;

      -- 4 khách demo/store, không dùng ID user cố định hoặc sửa tài khoản thật.
      v_email := format('dashboard.s%s.customer%s@example.invalid', v_store_id, ((v_index - 1) % 4) + 1);
      INSERT INTO users (full_name, email, password_hash, phone, role, status)
      VALUES (
        (ARRAY['Nguyễn Minh Anh', 'Trần Hoàng Nam', 'Lê Thu Hà', 'Phạm Đức Long'])[((v_index - 1) % 4) + 1],
        v_email, '!disabled-demo-account',
        format('090%s00000%s', v_store_id, ((v_index - 1) % 4) + 1),
        'customer', 'active'
      ) ON CONFLICT (email) DO NOTHING;

      SELECT id INTO v_customer_id FROM users WHERE email = v_email;

      -- Hôm nay: 2 confirmed, 1 picked_up, 2 processing, 1 ready, 2 completed.
      -- 6 đơn còn lại completed, trải đều 6 ngày trước để có lịch sử thống kê.
      v_status := CASE v_index
        WHEN 1 THEN 'confirmed'::bookings_status_enum
        WHEN 2 THEN 'confirmed'::bookings_status_enum
        WHEN 3 THEN 'picked_up'::bookings_status_enum
        WHEN 4 THEN 'processing'::bookings_status_enum
        WHEN 5 THEN 'processing'::bookings_status_enum
        WHEN 6 THEN 'ready_for_delivery'::bookings_status_enum
        ELSE 'completed'::bookings_status_enum
      END;
      v_weight := 3 + (v_index % 6) * 0.5;
      v_price := v_weight * 25000;

      IF v_index <= 8 THEN
        -- Đã quy đổi từ ngày VN về UTC, không phụ thuộc timezone của SQL client.
        v_created := GREATEST(
          v_today - interval '7 hours',
          LEAST(v_now - interval '2 hours', v_today - interval '7 hours' + interval '8 hours')
        );
        v_updated := LEAST(v_now, v_created + v_index * interval '10 minutes');
      ELSE
        v_created := v_today - interval '7 hours' - (v_index - 8) * interval '1 day' + interval '8 hours';
        v_updated := v_created + interval '4 hours';
      END IF;

      INSERT INTO bookings (
        booking_code, customer_id, store_id, service_id, in_store,
        scheduled_pickup_start, scheduled_pickup_end, estimated_delivery_at,
        status, estimated_weight_kg, actual_weight_kg,
        estimated_price, final_price, discount_amount,
        pricing_unit, service_name, unit_price, delivery_price,
        special_instructions, created_at, updated_at
      ) VALUES (
        v_code, v_customer_id, v_store_id, v_service_id, true,
        v_created, v_created + interval '1 hour', v_created + interval '24 hours',
        v_status, v_weight,
        CASE WHEN v_status = 'confirmed' THEN NULL ELSE v_weight END,
        v_price, CASE WHEN v_status = 'confirmed' THEN NULL ELSE v_price END, 0,
        'per_kg', 'DEMO - Giặt sấy tiêu chuẩn', 25000, 0,
        'Dữ liệu mẫu dashboard; khách mang và nhận đồ tại cửa hàng.',
        v_created, v_updated
      ) RETURNING id INTO v_booking_id;

      INSERT INTO booking_items (booking_id, item_name, category, quantity, note, created_at)
      VALUES (v_booking_id, 'Quần áo thường ngày', 'clothes', 5 + v_index % 4,
        'Đơn tính theo kg; quantity là số món kiểm đếm.', v_created);

      -- Thanh toán demo nội bộ, không gọi cổng thanh toán.
      INSERT INTO payments (
        booking_id, payment_type, amount, method, status, paid_at, created_at, updated_at
      ) VALUES (
        v_booking_id, 'full', v_price, 'cash', 'success', v_created, v_created, v_created
      );

      IF v_status = 'processing' THEN
        SELECT id INTO v_machine_id FROM machines
        WHERE store_id = v_store_id
          AND name = CASE v_index WHEN 4 THEN 'DEMO - Máy giặt 01' ELSE 'DEMO - Máy giặt 02' END
          AND status = 'idle'
          AND NOT EXISTS (
            SELECT 1 FROM machine_usage_logs l
            WHERE l.machine_id = machines.id AND l.ended_at IS NULL
          )
        ORDER BY id LIMIT 1;

        IF v_machine_id IS NOT NULL THEN
          INSERT INTO machine_usage_logs (machine_id, booking_id, started_at, created_at)
          VALUES (v_machine_id, v_booking_id, v_updated, v_updated);
          UPDATE machines SET status = 'running', updated_at = v_updated
          WHERE id = v_machine_id;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$seed$;

COMMIT;

-- Kết quả: lần chạy đầu có 14 đơn demo và 6 máy demo trên mỗi cửa hàng.
SELECT store_id, status, COUNT(*) AS demo_bookings
FROM bookings
WHERE store_id IN (1, 2) AND booking_code LIKE 'DEMO-S%'
GROUP BY store_id, status ORDER BY store_id, status;

SELECT store_id, name, type, capacity_kg, status
FROM machines
WHERE store_id IN (1, 2) AND name LIKE 'DEMO - %'
ORDER BY store_id, id;
