CREATE TABLE farm_learning_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  content_id VARCHAR(255) NOT NULL,
  content_type VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'STARTED',
  score INT,
  earned_seed INT DEFAULT 0,
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_fl_user (user_id),
  KEY idx_fl_content (content_id),
  KEY idx_fl_user_content (user_id, content_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
