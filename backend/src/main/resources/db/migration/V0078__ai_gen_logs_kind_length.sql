-- ai_gen_logs.kind 컬럼 길이 확장
-- 기존 VARCHAR(16) 은 "study-checkpoints"(17자) 등 새 kind 값을 담지 못해 Data truncation 에러
-- file-to-markdown / study-checkpoints / study-questions 등 모두 수용

ALTER TABLE ai_gen_logs
  MODIFY COLUMN kind VARCHAR(64) NOT NULL;
