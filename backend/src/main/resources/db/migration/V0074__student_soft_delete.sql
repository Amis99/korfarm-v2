-- 학생 soft delete + 30일 유예 + 백업 기록
-- 본사 관리자(HQ_ADMIN) 가 학생을 삭제하면 즉시 status='deleted' + deleted_at NOW().
-- 학생 화면·통계·로그인은 즉시 차단. 30일 후 scheduler 가 hard delete (모든 user_id row 영구 삭제).
-- 삭제 시점에 모든 관련 row 를 ZIP(JSON) 으로 즉시 다운로드.

ALTER TABLE users
  ADD COLUMN deleted_at DATETIME NULL,
  ADD COLUMN deleted_by VARCHAR(64) NULL,
  ADD COLUMN delete_reason TEXT NULL,
  ADD INDEX idx_users_deleted_at (deleted_at);

CREATE TABLE student_deletion_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  deleted_user_email VARCHAR(255) NOT NULL,
  deleted_user_name VARCHAR(120),
  deleted_by VARCHAR(64) NOT NULL,
  deleted_by_email VARCHAR(255),
  reason TEXT,
  immediate BOOLEAN NOT NULL DEFAULT FALSE,
  backup_size_bytes BIGINT,
  hard_deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
