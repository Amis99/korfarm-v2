-- 자몽(AI 결제용 가상 화폐) 시스템 — Phase A
-- 1자몽 = 200원(기관) / 250원(개인). 본사가 grapefruit_pricing 으로 단가 관리.

-- 단가표 — 본사가 운영 중에 수정 가능
CREATE TABLE grapefruit_pricing (
  kind VARCHAR(64) PRIMARY KEY,
  label VARCHAR(200) NOT NULL,
  model VARCHAR(32) NOT NULL,
  price_grapefruits INT NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at DATETIME(6) NOT NULL,
  updated_by VARCHAR(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 기관 자몽 지갑 (org_id 1:1)
CREATE TABLE org_grapefruit_wallet (
  org_id VARCHAR(64) PRIMARY KEY,
  balance INT NOT NULL DEFAULT 0,
  updated_at DATETIME(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 개인 자몽 지갑 (user_id 1:1) — Phase C 에서 사용. 미리 정의.
CREATE TABLE user_grapefruit_wallet (
  user_id VARCHAR(64) PRIMARY KEY,
  balance INT NOT NULL DEFAULT 0,
  updated_at DATETIME(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 자몽 거래 이력 — 충전/차감 모두
CREATE TABLE grapefruit_transactions (
  id VARCHAR(64) PRIMARY KEY,
  wallet_type VARCHAR(8) NOT NULL,         -- 'org' or 'user'
  wallet_owner_id VARCHAR(64) NOT NULL,    -- org_id 또는 user_id
  direction VARCHAR(8) NOT NULL,           -- 'charge' or 'spend'
  amount INT NOT NULL,                     -- 항상 양수 (방향은 direction 참조)
  kind VARCHAR(64) DEFAULT NULL,           -- 차감일 때 grapefruit_pricing.kind
  ai_log_id VARCHAR(64) DEFAULT NULL,      -- 차감일 때 ai_gen_logs FK
  payment_id VARCHAR(64) DEFAULT NULL,     -- 충전일 때 payments FK (mock)
  amount_won INT DEFAULT NULL,             -- 충전 시 원화 결제액
  balance_after INT NOT NULL,              -- 거래 후 잔액 (감사용)
  memo VARCHAR(500) DEFAULT NULL,
  created_at DATETIME(6) NOT NULL,
  KEY idx_wallet (wallet_type, wallet_owner_id, created_at),
  KEY idx_kind (kind),
  KEY idx_ai_log (ai_log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 초기 단가 시드 (사용자 결정 단가)
INSERT INTO grapefruit_pricing (kind, label, model, price_grapefruits, description, active, updated_at) VALUES
  ('wisdom-feedback',         'AI 글쓰기 첨삭 (1편)',                'sonnet', 1, '학생이 쓴 글 1편 첨삭', 1, NOW(6)),
  ('wisdom-ocr',              'AI 필기 OCR (사진 1장)',              'sonnet', 1, '학생 손글씨 사진 1장 OCR', 1, NOW(6)),
  ('file-to-markdown-1to5',   'AI PDF/이미지 마크다운 변환 (1~5장)',  'sonnet', 1, 'PDF 또는 이미지 1~5페이지 변환', 1, NOW(6)),
  ('file-to-markdown-6to10',  'AI PDF/이미지 마크다운 변환 (6~10장)', 'sonnet', 2, 'PDF 또는 이미지 6~10페이지 변환', 1, NOW(6)),
  ('passage-generation',      'AI 지문 생성 (1편)',                  'sonnet', 1, '학습/시험 지문 1편 생성', 1, NOW(6)),
  ('checkpoint-extract',      'AI 체크포인트 추출 — 일반',           'sonnet', 1, '지문에서 체크포인트 추출 (일반 Sonnet)', 1, NOW(6)),
  ('checkpoint-extract-opus', 'AI 체크포인트 추출 — 고급',           'opus',   4, '지문에서 체크포인트 추출 (고급 Opus)', 1, NOW(6)),
  ('study-questions-sonnet',  'AI 학습 문항 생성 — 일반 (5문항/회)',  'sonnet', 2, '학습 문항 5개 생성 (일반 Sonnet)', 1, NOW(6)),
  ('study-questions-opus',    'AI 학습 문항 생성 — 고급 (5문항/회)',  'opus',   8, '학습 문항 5개 생성 (고급 Opus)', 1, NOW(6)),
  ('question-single-opus',    'AI 단건 문제 출제',                    'opus',   3, '문제 1개 단건 출제 (Opus)', 1, NOW(6)),
  ('study-package-sonnet',    'AI 학습 통합 생성',                    'sonnet', 4, '지문+체크포인트+5문항 일괄 생성 (일반)', 1, NOW(6));
