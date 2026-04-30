-- AI 출제 하네스 — 문법 RAG 코퍼스, 학습 개념, 호출 로그
-- 2026-04-30 작성

-- 문법 RAG 코퍼스 (어드민이 등록·관리. AI 문법 출제 시 토픽으로 검색)
CREATE TABLE IF NOT EXISTS grammar_corpus (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  topic VARCHAR(64) NOT NULL,                       -- 음운/단어/문장/의미/담화/국어사
  source VARCHAR(255),                              -- 자료 출처
  title VARCHAR(255) NOT NULL,
  content_md MEDIUMTEXT NOT NULL,
  tags VARCHAR(512),                                -- 키워드 콤마 구분
  level_min VARCHAR(32),
  level_max VARCHAR(32),
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_grammar_topic (topic),
  INDEX idx_grammar_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학습 개념 (영역별 강조 가능 학습 개념 — AI 지문 생성 모달 체크박스 옵션)
CREATE TABLE IF NOT EXISTS learning_concepts (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  area VARCHAR(32) NOT NULL,                        -- LIT/READ/GRAM/SPEAK/WRITE/MEDIA/INTEGRATED
  sub_area VARCHAR(64),
  name VARCHAR(128) NOT NULL,
  description TEXT,
  level_min VARCHAR(32),
  level_max VARCHAR(32),
  display_order INT NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_concept_area (area, sub_area),
  INDEX idx_concept_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI 출제 호출 로그 (정식 크레딧 시스템 전 단순 기록)
CREATE TABLE IF NOT EXISTS ai_gen_logs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  test_id VARCHAR(64),
  kind VARCHAR(16) NOT NULL,                        -- passage/question/review
  model VARCHAR(64) NOT NULL,
  input_tokens INT,
  output_tokens INT,
  duration_ms INT,
  passed BOOLEAN,
  retry_count INT NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL,                      -- success/error
  error_message TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_aigen_user_created (user_id, created_at),
  INDEX idx_aigen_test (test_id),
  INDEX idx_aigen_kind (kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
