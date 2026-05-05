-- 기관 월 결제 시스템 — Phase B
-- 매월 1일 청구 발행, 말일까지 결제, 다음 달 1일 미결제 시 정지

-- 기관 월 청구
CREATE TABLE org_billing (
  id VARCHAR(64) PRIMARY KEY,
  org_id VARCHAR(64) NOT NULL,
  year_month VARCHAR(7) NOT NULL,           -- '2026-05'
  base_fee INT NOT NULL,                    -- 기본료 (기본 200000, 본사 감면 가능)
  excess_student_count INT NOT NULL DEFAULT 0,  -- 21명 초과 학생 수
  excess_days INT NOT NULL DEFAULT 0,       -- 초과 학생들의 등록일수 합계
  excess_fee INT NOT NULL DEFAULT 0,        -- 초과 학생 등록일수 × 500원
  total_fee INT NOT NULL,                   -- base_fee + excess_fee
  active_student_count INT NOT NULL DEFAULT 0,  -- 청구 시점 활성 학생 수 (감사용)
  due_at DATETIME(6) NOT NULL,              -- 결제 마감 (그 달 말일 23:59:59)
  paid_at DATETIME(6) DEFAULT NULL,
  payment_id VARCHAR(64) DEFAULT NULL,      -- mock or 추후 토스 결제 ID
  status VARCHAR(16) NOT NULL DEFAULT 'pending',  -- pending / paid / overdue / canceled
  notes TEXT,                               -- 산정 내역 메모
  created_at DATETIME(6) NOT NULL,
  UNIQUE KEY uk_org_yearmonth (org_id, year_month),
  KEY idx_status_due (status, due_at),
  KEY idx_org_status (org_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 본사가 기관별 기본료 감면·수정 가능
ALTER TABLE orgs ADD COLUMN monthly_base_fee_override INT DEFAULT NULL;

-- 미결제로 정지된 기관 표시 (별도 컬럼 — 빠른 가드 체크용)
ALTER TABLE orgs ADD COLUMN billing_suspended TINYINT(1) NOT NULL DEFAULT 0;
