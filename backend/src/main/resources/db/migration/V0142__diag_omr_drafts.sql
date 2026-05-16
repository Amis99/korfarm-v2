-- 진단 OMR 인쇄 응시 시 서버 측 타이머·답안 자동 저장용 draft 테이블.
-- 슬립 모드·새로고침에도 deadline 이 서버 시각 기준으로 유지되며,
-- 60분 경과 시 DiagnosticOmrScheduler 가 자동 제출 (입력된 답안까지로 채점).
-- 사용자 명시 (2026-05-16): 모바일·태블릿 슬립 모드로 인한 타이머 정지 사고 방지.

CREATE TABLE diag_omr_drafts (
  user_id              VARCHAR(64)  NOT NULL,
  tier                 VARCHAR(32)  NOT NULL,
  started_at           DATETIME     NOT NULL,
  deadline             DATETIME     NOT NULL,
  answers_json         JSON         NOT NULL,
  status               VARCHAR(16)  NOT NULL DEFAULT 'pending',
  submitted_session_id VARCHAR(64)  NULL,
  created_at           DATETIME     NOT NULL,
  updated_at           DATETIME     NOT NULL,
  PRIMARY KEY (user_id, tier),
  KEY idx_status_deadline (status, deadline),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
