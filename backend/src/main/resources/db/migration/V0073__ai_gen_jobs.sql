-- AI 출제 비동기 잡 테이블 (CloudFront 60초 timeout 회피)
CREATE TABLE IF NOT EXISTS ai_gen_jobs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  test_id VARCHAR(64),
  kind VARCHAR(16) NOT NULL,                 -- passage / question
  status VARCHAR(16) NOT NULL DEFAULT 'queued', -- queued / running / completed / failed
  request_json LONGTEXT NOT NULL,
  result_json LONGTEXT,
  error_message TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  INDEX idx_aijob_user_created (user_id, created_at),
  INDEX idx_aijob_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
