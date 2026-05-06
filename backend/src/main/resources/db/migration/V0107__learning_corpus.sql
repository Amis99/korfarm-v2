-- 학습 자료 마스터 DB — 작품·지문·문법자료·어휘자료를 row 단위로 저장
-- AI 출제 하네스·LaTeX 교재 빌드가 단일 SQL 로 활용

-- 1) learning_corpus — 작품·지문 마스터
CREATE TABLE IF NOT EXISTS learning_corpus (
  id VARCHAR(64) PRIMARY KEY,
  area VARCHAR(32) NOT NULL,            -- reading / literature / grammar / vocab / speaking / writing / media
  sub_area VARCHAR(64) DEFAULT NULL,

  title VARCHAR(200) NOT NULL,
  source VARCHAR(200) DEFAULT NULL,     -- 출처 (교과서·문집·기사출처 등)

  -- 문학 메타 (NULL 허용)
  author VARCHAR(100) DEFAULT NULL,
  era VARCHAR(64) DEFAULT NULL,
  genre VARCHAR(64) DEFAULT NULL,

  -- 비문학 메타
  topic VARCHAR(200) DEFAULT NULL,
  field VARCHAR(64) DEFAULT NULL,       -- 과학/사회/인문/예술/기술/철학/...

  -- 본문
  body_md MEDIUMTEXT DEFAULT NULL,      -- 원문 (markdown)

  -- 자유 메타 — 영역별 다른 필드 + 향후 추가용 (등장인물/줄거리/예시/관련개념 등)
  meta_json JSON DEFAULT NULL,

  -- 분류·레벨
  classification_codes JSON DEFAULT NULL,  -- ["theme_*", "area_*"] 통합 분류 마스터 코드
  level_min INT DEFAULT NULL,
  level_max INT DEFAULT NULL,

  status VARCHAR(16) NOT NULL DEFAULT 'active',   -- active / draft / archived
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  created_by VARCHAR(64) DEFAULT NULL,

  KEY idx_area_sub (area, sub_area),
  KEY idx_genre (genre),
  KEY idx_era (era),
  KEY idx_field (field),
  KEY idx_topic (topic),
  KEY idx_level (level_min, level_max),
  KEY idx_status (status),
  FULLTEXT idx_body (title, body_md)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) learning_corpus_items — 작품·지문에 누적되는 체크리스트·출제포인트·구절해석 등
CREATE TABLE IF NOT EXISTS learning_corpus_items (
  id VARCHAR(64) PRIMARY KEY,
  corpus_id VARCHAR(64) NOT NULL,

  item_type VARCHAR(32) NOT NULL,       -- checkpoint / exam_point / passage_note / background / character / vocabulary / other

  text_md TEXT NOT NULL,                -- 항목 본문
  passage_range_start INT DEFAULT NULL, -- 원문 char offset (구절해석용)
  passage_range_end INT DEFAULT NULL,

  meta_json JSON DEFAULT NULL,          -- 자유 추가 정보

  source_type VARCHAR(32) DEFAULT NULL, -- manual / ai-classified / study-content
  source_content_id VARCHAR(64) DEFAULT NULL,

  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  created_by VARCHAR(64) DEFAULT NULL,

  KEY idx_corpus_type (corpus_id, item_type),
  KEY idx_source (source_content_id),
  KEY idx_source_type (source_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) pending_checkpoints — AI 분류 대기 임시 폴더
CREATE TABLE IF NOT EXISTS pending_checkpoints (
  id VARCHAR(64) PRIMARY KEY,

  source_content_id VARCHAR(64) NOT NULL,
  source_user_id VARCHAR(64) DEFAULT NULL,
  source_org_id VARCHAR(64) DEFAULT NULL,

  text_md TEXT NOT NULL,                -- 체크리스트 내용
  context_md TEXT DEFAULT NULL,         -- 주변 본문 (AI 분류 시 참고)

  -- AI 분류 결과
  suggested_corpus_id VARCHAR(64) DEFAULT NULL,
  suggested_item_type VARCHAR(32) DEFAULT NULL,
  ai_confidence DOUBLE DEFAULT NULL,
  ai_reason TEXT DEFAULT NULL,

  -- 처리 상태
  status VARCHAR(16) NOT NULL DEFAULT 'pending',  -- pending / classified / approved / rejected
  approved_at DATETIME(6) DEFAULT NULL,
  approved_by VARCHAR(64) DEFAULT NULL,
  approved_corpus_id VARCHAR(64) DEFAULT NULL,
  approved_item_id VARCHAR(64) DEFAULT NULL,

  created_at DATETIME(6) NOT NULL,

  KEY idx_status (status, created_at),
  KEY idx_source_content (source_content_id),
  KEY idx_suggested_corpus (suggested_corpus_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
