-- Lưu mã giao dịch đã gửi cho cổng (P{id}T{unix}) để hỏi lại trạng thái / hoàn tiền sau này.
-- Cột nullable nên các giao dịch cũ không bị ảnh hưởng.
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS txn_ref VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_txn_ref
  ON payments (txn_ref);

-- Mỗi booking chỉ có tối đa một phiên thanh toán đang chờ (pending) tại một thời điểm.
-- Dọn dữ liệu cũ trước: giữ lại giao dịch pending mới nhất của mỗi booking, các cái còn lại -> failed.
UPDATE payments
SET status = 'failed'
WHERE status = 'pending'
  AND id NOT IN (
    SELECT MAX(id) FROM payments WHERE status = 'pending' GROUP BY booking_id
  );

-- Prisma schema không khai báo được partial index, nên index này chỉ tồn tại trong DB.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_one_pending_per_booking
  ON payments (booking_id)
  WHERE status = 'pending';
