CREATE TABLE ocr_usage_log (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  channel VARCHAR(16) NOT NULL,
  org_id VARCHAR(64) DEFAULT NULL,
  image_count INT NOT NULL DEFAULT 1,
  occurred_at DATETIME(6) NOT NULL,
  KEY idx_user_time (user_id, occurred_at),
  KEY idx_org_time (org_id, occurred_at),
  KEY idx_channel_user_day (channel, user_id, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
