-- 2026-05-18 — AI 추천 학습 캐시
-- 사용자 정책 (2026-05-18):
--   진단 리포트: 최초 1회 AI 추천 후 영구 유지 (diag_sessions 컬럼에 캐시)
--   통합 분석표: 최초 1회 + "추천학습 생성" 버튼 — 하루 1회 갱신 (user_ai_recommendations 테이블)

-- (1) 진단 세션별 AI 추천 캐시 — 최초 1회 후 영구
ALTER TABLE diag_sessions
  ADD COLUMN ai_recommended_contents_json LONGTEXT NULL
  COMMENT '진단 리포트 추천 학습 — 세션 최초 조회 시 AI 가 6개 선정해 저장 후 영구 유지';

-- (2) 통합 분석표용 사용자별 AI 추천 묶음 캐시 + 하루 1회 갱신
CREATE TABLE user_ai_recommendations (
  user_id VARCHAR(64) NOT NULL,
  bundle_json LONGTEXT NOT NULL,
  generated_at DATETIME NOT NULL,
  PRIMARY KEY (user_id),
  INDEX idx_uar_generated (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='통합 분석표 AI 추천 캐시 — POST /v1/learning/recommendations/regenerate 로 갱신 (하루 1회)';
