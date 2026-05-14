-- 진단 세션의 AI 총평 캐시 컬럼. 첫 호출 시 생성·저장 → 이후 페이지 진입은 DB 캐시 사용.
-- 무과금 + 매번 호출 방지 + 빠른 응답 (Claude API 2초 절감).
ALTER TABLE diag_sessions
    ADD COLUMN ai_summary MEDIUMTEXT NULL COMMENT 'AI 총평 (Claude Sonnet) 캐시';
