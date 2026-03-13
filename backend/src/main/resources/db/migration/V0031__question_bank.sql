-- 문제은행 핵심 테이블 6개

-- 코드표 그룹
CREATE TABLE qb_code_groups (
  id VARCHAR(64) PRIMARY KEY,
  group_key VARCHAR(64) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- 코드표 값
CREATE TABLE qb_code_values (
  id VARCHAR(64) PRIMARY KEY,
  group_id VARCHAR(64) NOT NULL,
  value VARCHAR(120) NOT NULL,
  label VARCHAR(200) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_group_value (group_id, value),
  KEY idx_group (group_id)
);

-- 레코드 (작품/지문 묶음 단위)
CREATE TABLE qb_records (
  id VARCHAR(64) PRIMARY KEY,
  record_code VARCHAR(64) NOT NULL UNIQUE,
  source_type VARCHAR(32),
  exam_org VARCHAR(64),
  exam_year INT,
  exam_month INT,
  area VARCHAR(64),
  sub_area VARCHAR(64),
  title VARCHAR(255),
  target_grades JSON,
  difficulty INT,
  tags JSON,
  author VARCHAR(120),
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  meta_json JSON,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_area (area, sub_area, status),
  KEY idx_source (source_type, exam_org, exam_year)
);

-- 지문
CREATE TABLE qb_passages (
  id VARCHAR(64) PRIMARY KEY,
  record_id VARCHAR(64) NOT NULL,
  passage_code VARCHAR(64) NOT NULL,
  ref_type VARCHAR(32),
  title VARCHAR(255),
  body_text LONGTEXT NOT NULL,
  sub_passages JSON,
  box_items JSON,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_record (record_id)
);

-- 문제
CREATE TABLE qb_questions (
  id VARCHAR(64) PRIMARY KEY,
  record_id VARCHAR(64) NOT NULL,
  question_number INT NOT NULL,
  passage_refs JSON,
  question_format VARCHAR(32),
  answer_type VARCHAR(32),
  question_type VARCHAR(64),
  stem TEXT NOT NULL,
  box_items JSON,
  choices JSON,
  correct_answer VARCHAR(255),
  difficulty INT,
  explanation LONGTEXT,
  applied_concepts JSON,
  choice_pattern VARCHAR(64),
  scoring_criteria JSON,
  points INT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_record (record_id),
  KEY idx_type (question_type)
);

-- 레코드 원본 JSON 버저닝
CREATE TABLE qb_record_versions (
  id VARCHAR(64) PRIMARY KEY,
  record_id VARCHAR(64) NOT NULL,
  schema_version VARCHAR(32) NOT NULL DEFAULT '1.0',
  full_json LONGTEXT NOT NULL,
  uploaded_by VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL,
  KEY idx_record (record_id)
);
