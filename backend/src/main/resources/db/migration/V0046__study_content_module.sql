-- 내용 숙지 모드 전면 재설계
-- 1) 신규 4개 테이블: study_contents, study_questions, study_attempts, study_progress
-- 2) 기존 content_pdf 잔여 정리: content_page_progress drop, CONTENT_PDF_QUIZ 데이터 삭제

-- ─────────────────────────────────────────────
-- 1. study_contents — 정적 콘텐츠 메타·본문·체크리스트
-- ─────────────────────────────────────────────
CREATE TABLE study_contents (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  level_id VARCHAR(64),
  area VARCHAR(64) NOT NULL DEFAULT 'CONTENT',
  visibility VARCHAR(16) NOT NULL,
  owner_org_id VARCHAR(64),
  creator_id VARCHAR(64) NOT NULL,
  markdown LONGTEXT NOT NULL,
  eval_points JSON NOT NULL,
  error_patterns JSON NOT NULL,
  question_count INT NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_sc_owner_org (owner_org_id),
  KEY idx_sc_visibility (visibility),
  KEY idx_sc_level (level_id),
  KEY idx_sc_creator (creator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- 2. study_questions — 문제 (1:N from study_contents)
-- ─────────────────────────────────────────────
CREATE TABLE study_questions (
  id VARCHAR(64) PRIMARY KEY,
  content_id VARCHAR(64) NOT NULL,
  question_no INT NOT NULL,
  question_type VARCHAR(16) NOT NULL,
  stem TEXT NOT NULL,
  choices JSON,
  model_answer TEXT,
  fill_blanks JSON,
  eval_point_idx JSON NOT NULL,
  difficulty INT NOT NULL DEFAULT 3,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_sq_content (content_id),
  CONSTRAINT fk_sq_content FOREIGN KEY (content_id) REFERENCES study_contents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- 3. study_attempts — 학생 답안 단위 상세
-- ─────────────────────────────────────────────
CREATE TABLE study_attempts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  content_id VARCHAR(64) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  is_correct TINYINT(1) NOT NULL,
  selected_choice_idx INT,
  user_answer TEXT,
  triggered_error_pattern_idx JSON,
  attempted_at DATETIME NOT NULL,
  KEY idx_sa_user_content (user_id, content_id),
  KEY idx_sa_session (session_id),
  KEY idx_sa_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- 4. study_progress — 사용자×콘텐츠 누적 stats (캐시)
-- ─────────────────────────────────────────────
CREATE TABLE study_progress (
  user_id VARCHAR(64) NOT NULL,
  content_id VARCHAR(64) NOT NULL,
  seen_question_ids JSON NOT NULL,
  eval_point_correct JSON NOT NULL,
  eval_point_attempted JSON NOT NULL,
  error_pattern_count JSON NOT NULL,
  total_sessions INT NOT NULL DEFAULT 0,
  total_correct INT NOT NULL DEFAULT 0,
  total_attempted INT NOT NULL DEFAULT 0,
  last_session_at DATETIME,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (user_id, content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- 5. 기존 content_pdf 잔여 정리
-- ─────────────────────────────────────────────
DROP TABLE IF EXISTS content_page_progress;

DELETE FROM farm_learning_logs WHERE content_type = 'CONTENT_PDF_QUIZ';

DELETE FROM content_versions
WHERE content_id IN (SELECT id FROM contents WHERE content_type = 'CONTENT_PDF_QUIZ');

DELETE FROM contents WHERE content_type = 'CONTENT_PDF_QUIZ';
