-- 학생 AI 튜터 인프라
-- 운영자 AI 비서와 분리된 별도 테이블 — 권한·과금이 다름

-- 1) AI 튜터 채팅 세션 (학생 1명 = 여러 세션)
CREATE TABLE IF NOT EXISTS tutor_chat_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(200) DEFAULT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  KEY idx_user (user_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) AI 튜터 메시지
CREATE TABLE IF NOT EXISTS tutor_chat_messages (
  id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  role VARCHAR(32) NOT NULL,                 -- user / assistant / assistant_tool_use / tool
  content LONGTEXT,
  tool_use_json JSON DEFAULT NULL,
  function_name VARCHAR(64) DEFAULT NULL,
  status VARCHAR(16) DEFAULT NULL,
  created_at DATETIME(6) NOT NULL,
  KEY idx_session_created (session_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) AI 튜터 사용량 (turn 단위)
CREATE TABLE IF NOT EXISTS tutor_usage_log (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  session_id VARCHAR(64) DEFAULT NULL,
  currency VARCHAR(32) NOT NULL,             -- 'grapefruit' or 'crop_<type>' or 'free'
  amount_spent INT NOT NULL DEFAULT 0,
  total_input_tokens INT NOT NULL DEFAULT 0,
  total_output_tokens INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL,
  KEY idx_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) AI 튜터 단가 — 1턴당 자몽 1개 (또는 작물 1개)
INSERT IGNORE INTO grapefruit_pricing (kind, label, model, price_grapefruits, description, active, updated_at)
VALUES (
  'tutor-call',
  'AI 튜터 1회 대화',
  'sonnet',
  1,
  '학생 AI 튜터 1턴(질문→답변). 자몽 또는 작물 1개로 결제 가능.',
  1,
  NOW(6)
);
