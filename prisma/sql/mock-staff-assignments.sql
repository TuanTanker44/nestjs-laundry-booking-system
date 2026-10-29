-- Mock dữ liệu staff_assignments (phân công nhân viên giặt ủi vào cửa hàng).
-- Không hardcode id: lấy user role laundry_staff (active) và cửa hàng active hiện có.
--   * Mỗi staff được gán vào 1 cửa hàng chính (xoay vòng theo thứ tự id).
--   * Staff có thứ tự lẻ được gán thêm cửa hàng kế tiếp -> có case 1 staff làm nhiều cửa hàng.
-- Idempotent: chạy lại nhiều lần không lỗi nhờ unique (staff_id, store_id) = uq_staff_store.
WITH staff AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM users
  WHERE role = 'laundry_staff' AND status = 'active'
),
stores AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn, COUNT(*) OVER () AS total
  FROM laundry_stores
  WHERE status = 'active'
),
pairs AS (
  -- Cửa hàng chính
  SELECT s.id AS staff_id, st.id AS store_id
  FROM staff s
  JOIN stores st ON st.rn = ((s.rn - 1) % st.total) + 1
  UNION
  -- Cửa hàng phụ cho staff lẻ (bỏ qua nếu chỉ có 1 cửa hàng)
  SELECT s.id, st.id
  FROM staff s
  JOIN stores st ON st.rn = (s.rn % st.total) + 1
  WHERE s.rn % 2 = 1
)
INSERT INTO staff_assignments (staff_id, store_id, assigned_at)
SELECT staff_id, store_id, NOW() - INTERVAL '7 days'
FROM pairs
ON CONFLICT (staff_id, store_id) DO NOTHING;

-- Kiểm tra kết quả
SELECT sa.id, u.id AS staff_id, u.full_name, s.id AS store_id, s.name AS store_name, sa.assigned_at
FROM staff_assignments sa
JOIN users u ON u.id = sa.staff_id
JOIN laundry_stores s ON s.id = sa.store_id
ORDER BY sa.store_id, sa.staff_id;
