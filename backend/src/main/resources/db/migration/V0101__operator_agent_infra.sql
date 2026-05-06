-- 운영자 AI 에이전트 인프라
-- 채팅 세션·메시지 / 사용 한도 카운터 / 알림

-- 1) AI 채팅 세션
CREATE TABLE IF NOT EXISTS agent_chat_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  user_role VARCHAR(16) NOT NULL,            -- HQ_ADMIN / ORG_ADMIN
  org_id VARCHAR(64) DEFAULT NULL,           -- ORG_ADMIN 의 자기 기관
  title VARCHAR(200) DEFAULT NULL,           -- 자동 생성 또는 사용자 수정
  status VARCHAR(16) NOT NULL DEFAULT 'active',  -- active / archived
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  KEY idx_user (user_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) AI 채팅 메시지
CREATE TABLE IF NOT EXISTS agent_chat_messages (
  id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  role VARCHAR(16) NOT NULL,                 -- user / assistant / tool
  content LONGTEXT,                          -- 자연어 텍스트 (tool_use 면 JSON)
  tool_use_json JSON DEFAULT NULL,           -- tool_use 또는 tool_result 페이로드
  function_name VARCHAR(64) DEFAULT NULL,    -- tool 호출 시 함수명
  status VARCHAR(16) DEFAULT NULL,           -- success / error / pending_confirm
  created_at DATETIME(6) NOT NULL,
  KEY idx_session_created (session_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) 사용 한도 카운터 (turn 단위 — 1 user message + 1 assistant final = 1 turn)
CREATE TABLE IF NOT EXISTS agent_usage_log (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  user_role VARCHAR(16) NOT NULL,
  session_id VARCHAR(64) DEFAULT NULL,
  is_extra TINYINT(1) NOT NULL DEFAULT 0,    -- 한도 초과로 자몽 차감 여부
  grapefruit_spent INT NOT NULL DEFAULT 0,
  total_input_tokens INT NOT NULL DEFAULT 0,
  total_output_tokens INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL,
  KEY idx_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) 알림 (사이트 내 — 헤더 종)
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  category VARCHAR(32) NOT NULL,             -- schedule / billing / agent / system / wisdom
  title VARCHAR(200) NOT NULL,
  body TEXT,
  link_path VARCHAR(512) DEFAULT NULL,       -- 클릭 시 이동 경로
  read_at DATETIME(6) DEFAULT NULL,
  created_at DATETIME(6) NOT NULL,
  KEY idx_user_unread (user_id, read_at, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) 자몽 단가 — 한도 초과 추가 호출 (1자몽 = 10회 추가)
INSERT IGNORE INTO grapefruit_pricing (kind, label, model, price_grapefruits, description, active, updated_at)
VALUES (
  'agent-call-extra',
  'AI 비서 한도 초과 호출 (자몽 1개 = 10회)',
  'sonnet',
  1,
  '월 무료 한도 초과 시 자몽 1개로 추가 10회 사용. 1회당 0.1자몽 = 20원',
  1,
  NOW(6)
);
