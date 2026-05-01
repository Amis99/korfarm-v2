-- AI 첨삭 비동기 작업 테이블
-- 동기 호출이 CloudFront 30s 타임아웃 + Claude 응답 30~120s 충돌로 504 발생 → 비동기 job 패턴 도입

CREATE TABLE ai_feedback_jobs (
  id               VARCHAR(64)   NOT NULL PRIMARY KEY,
  post_id          VARCHAR(64)   NOT NULL,
  requested_by     VARCHAR(64)   NOT NULL,
  status           VARCHAR(16)   NOT NULL,        -- PENDING / RUNNING / COMPLETED / FAILED
  result_comment   TEXT          NULL,
  result_correction TEXT         NULL,
  error_message    TEXT          NULL,
  created_at       DATETIME      NOT NULL,
  updated_at       DATETIME      NOT NULL,
  completed_at     DATETIME      NULL,
  INDEX idx_ai_feedback_jobs_post (post_id),
  INDEX idx_ai_feedback_jobs_status (status),
  INDEX idx_ai_feedback_jobs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
