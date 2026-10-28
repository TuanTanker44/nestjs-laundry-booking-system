-- Lưu link thanh toán để khách mở lại đơn vẫn thấy được QR (GET /payments?booking_id=).
-- Cột nullable nên các giao dịch cũ không bị ảnh hưởng.
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_url TEXT,
  ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP(6);
