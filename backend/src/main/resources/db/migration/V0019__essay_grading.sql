-- 서술형 채점 테이블
CREATE TABLE IF NOT EXISTS essay_gradings (
  id              VARCHAR(64) PRIMARY KEY,
  submission_id   VARCHAR(64) NOT NULL,
  test_id         VARCHAR(64) NOT NULL,
  question_number INT NOT NULL,
  user_id         VARCHAR(64) NOT NULL,
  student_answer  TEXT,
  keyword_score   INT DEFAULT NULL,
  keyword_detail  JSON DEFAULT NULL,
  ai_score        INT DEFAULT NULL,
  ai_feedback     TEXT DEFAULT NULL,
  ai_graded_at    DATETIME DEFAULT NULL,
  ai_model        VARCHAR(64) DEFAULT NULL,
  final_score     INT DEFAULT NULL,
  graded_by       VARCHAR(64) DEFAULT NULL,
  graded_at       DATETIME DEFAULT NULL,
  status          VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at      DATETIME NOT NULL,
  updated_at      DATETIME NOT NULL,
  UNIQUE KEY uk_sub_q (submission_id, question_number)
);

-- test_questions 서술형 채점 관련 컬럼 추가
ALTER TABLE test_questions
  ADD COLUMN essay_keywords_json TEXT DEFAULT NULL,
  ADD COLUMN essay_rubric_json TEXT DEFAULT NULL,
  ADD COLUMN model_answer TEXT DEFAULT NULL;
