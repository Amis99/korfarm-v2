CREATE TABLE IF NOT EXISTS parent_student_links (
  id VARCHAR(64) PRIMARY KEY,
  parent_user_id VARCHAR(64) NOT NULL,
  student_user_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_parent_user (parent_user_id),
  KEY idx_student_user (student_user_id),
  CONSTRAINT fk_parent_user FOREIGN KEY (parent_user_id) REFERENCES users (id),
  CONSTRAINT fk_student_user FOREIGN KEY (student_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
