-- content_page_progress 테이블 생성 (엔티티는 이미 존재하지만 DDL 누락)
CREATE TABLE IF NOT EXISTS content_page_progress (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  content_id VARCHAR(255) NOT NULL,
  log_id VARCHAR(64) NOT NULL,
  page_no INT NOT NULL,
  score INT DEFAULT 0,
  accuracy INT DEFAULT 0,
  earned_seed INT DEFAULT 0,
  earned_seed_type VARCHAR(32),
  completed_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  KEY idx_cpp_user_content (user_id, content_id),
  KEY idx_cpp_log (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
