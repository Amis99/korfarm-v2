-- 토스페이먼츠 연동을 위한 payments 테이블 컬럼 추가
ALTER TABLE payments
  ADD COLUMN order_name VARCHAR(256) DEFAULT NULL,
  ADD COLUMN payment_key VARCHAR(256) DEFAULT NULL,
  ADD COLUMN payment_method VARCHAR(64) DEFAULT NULL,
  ADD COLUMN toss_order_id VARCHAR(128) DEFAULT NULL,
  ADD COLUMN receipt_url VARCHAR(512) DEFAULT NULL,
  ADD COLUMN cancel_reason VARCHAR(512) DEFAULT NULL,
  ADD COLUMN canceled_at DATETIME DEFAULT NULL,
  ADD COLUMN metadata JSON DEFAULT NULL,
  ADD COLUMN subscription_months INT DEFAULT NULL,
  ADD COLUMN shop_order_id VARCHAR(64) DEFAULT NULL,
  ADD UNIQUE INDEX idx_toss_order_id (toss_order_id),
  ADD INDEX idx_payment_key (payment_key);
