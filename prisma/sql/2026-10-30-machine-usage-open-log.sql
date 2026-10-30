-- Mỗi máy chỉ có tối đa một phiên sử dụng đang mở (ended_at IS NULL) tại một thời điểm.
-- Dọn dữ liệu cũ trước: giữ lại phiên mở mới nhất của mỗi máy, các phiên còn lại được đóng lại.
UPDATE machine_usage_logs
SET ended_at = started_at
WHERE ended_at IS NULL
  AND id NOT IN (
    SELECT MAX(id) FROM machine_usage_logs WHERE ended_at IS NULL GROUP BY machine_id
  );

-- Prisma schema không khai báo được partial index, nên index này chỉ tồn tại trong DB.
CREATE UNIQUE INDEX IF NOT EXISTS uq_machine_usage_one_open_per_machine
  ON machine_usage_logs (machine_id)
  WHERE ended_at IS NULL;
