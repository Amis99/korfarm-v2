-- 어드민 오프라인 OMR 일괄 입력으로 중복 응시 가능하도록.
-- UNIQUE(test_id, user_id) 제거 + attempt_no 컬럼 + 인덱스 신설.
-- 기존 row 는 attempt_no=1 로 백필.

-- 1) attempt_no 컬럼 추가 (기본 1, NOT NULL)
ALTER TABLE test_submissions
  ADD COLUMN attempt_no INT NOT NULL DEFAULT 1;

-- 2) attempted_at 컬럼 추가 (응시 일자 — 어드민이 지정. NULL 이면 created_at 사용)
ALTER TABLE test_submissions
  ADD COLUMN attempted_at DATETIME NULL;

-- 3) 기존 UNIQUE(test_id, user_id) 제약 제거
-- MySQL 기준: UNIQUE 키 이름은 보통 "UK<해시>" 또는 column 명 기반. 동적 조회 후 DROP.
SET @uk_name := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'test_submissions'
    AND CONSTRAINT_TYPE = 'UNIQUE'
  LIMIT 1
);
SET @sql := IF(@uk_name IS NOT NULL,
  CONCAT('ALTER TABLE test_submissions DROP INDEX `', @uk_name, '`'),
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) 다중 응시 인덱스 — 최신 응시 조회·이력 조회 가속
CREATE INDEX idx_test_submissions_test_user_attempt
  ON test_submissions (test_id, user_id, attempt_no DESC);

CREATE INDEX idx_test_submissions_test_user_submitted
  ON test_submissions (test_id, user_id, created_at DESC);
