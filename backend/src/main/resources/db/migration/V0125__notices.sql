-- 공지사항 시스템
-- HQ_ADMIN: scope='GLOBAL' 전체 회원 공지
-- ORG_ADMIN: scope='ORG' + org_id, 그 기관 학생만 공지

CREATE TABLE notices (
  id VARCHAR(64) PRIMARY KEY,
  scope VARCHAR(16) NOT NULL COMMENT 'GLOBAL | ORG',
  org_id VARCHAR(64) NULL COMMENT 'scope=ORG 일 때만 NOT NULL',
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(32) NOT NULL DEFAULT 'general' COMMENT 'general/event/maintenance/billing',
  pinned TINYINT(1) NOT NULL DEFAULT 0,
  starts_at DATETIME NULL COMMENT 'NULL = 즉시',
  ends_at DATETIME NULL COMMENT 'NULL = 무기한',
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_scope_org (scope, org_id),
  INDEX idx_active (deleted_at, ends_at, starts_at)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE notice_reads (
  notice_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notice_id, user_id),
  INDEX idx_user (user_id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
