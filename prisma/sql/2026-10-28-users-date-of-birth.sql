-- Thêm ngày sinh cho user (tuỳ chọn). Cột nullable nên user cũ không bị ảnh hưởng.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP(6);
