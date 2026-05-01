-- 포도 AI 일일 사용량 카운터
-- "사용자가 포도야 호출한 횟수" = generate() 진입 횟수. ai_gen_logs 의 callClaude row
-- 단위와 다름. 한 번의 호출에 1만 +1 → 정확한 일일 카운트.

CREATE TABLE podo_daily_usage (
  user_id     VARCHAR(64) NOT NULL,
  usage_date  DATE        NOT NULL,
  call_count  INT         NOT NULL DEFAULT 0,
  updated_at  DATETIME    NOT NULL,
  PRIMARY KEY (user_id, usage_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
