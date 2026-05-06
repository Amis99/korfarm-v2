-- 학생 AI 튜터 — 일일 무료 quota
-- 매일 5턴 무료 채팅 + 1회 자동 학습 분석 무료
-- (코덱스용 V0108~V0119 범위 회피 — V0120 부터 사용)

CREATE TABLE IF NOT EXISTS tutor_daily_quota (
  user_id VARCHAR(64) NOT NULL,
  quota_date DATE NOT NULL,
  used_turns INT NOT NULL DEFAULT 0,
  auto_analysis_used TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (user_id, quota_date),
  KEY idx_date (quota_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
