-- 학부모 → 자녀 결제 대행 지원
-- payments.user_id = 결제 카드를 긁는 사람 (학부모)
-- payments.target_user_id = 결제 대상자 (자녀). NULL = 본인 결제

ALTER TABLE payments
  ADD COLUMN target_user_id VARCHAR(64) NULL
  COMMENT '결제 대상자 user_id. NULL = user_id 본인 결제, NOT NULL = 결제 대행 (예: 학부모가 자녀 구독 결제)';

CREATE INDEX idx_payments_target_user ON payments (target_user_id);
