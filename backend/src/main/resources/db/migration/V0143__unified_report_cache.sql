-- 통합 분석표 결과 캐시 (V0143, 2026-05-17)
-- 사용자 요구: 진입 시 매번 무거운 DB 집계·AI 호출 발생 → 캐시. 새로고침 아이콘 일 1회 제한.
--
-- 캐시 키: (user_id, period_key)
--   period_key = "{startDate}_{endDate}" (예: "2026-04-17_2026-05-17")
--   다른 기간 조회 시 별도 캐시 row.
--
-- ai_enabled: true 면 Claude Sonnet 으로 코멘트·추천 사유 생성한 결과 (새로고침 시 갱신).
--             false 면 룰 기반 (기본). 처음 진입 시 false 로 캐시.
-- refreshed_at: 마지막 AI 새로고침 시각. 같은 날(KST) 두 번 누르면 거부.

CREATE TABLE IF NOT EXISTS unified_report_cache (
    user_id        VARCHAR(64)  NOT NULL,
    period_key     VARCHAR(32)  NOT NULL,
    payload_json   LONGTEXT     NOT NULL,
    ai_enabled     BOOLEAN      NOT NULL DEFAULT FALSE,
    generated_at   DATETIME     NOT NULL,
    refreshed_at   DATETIME     NULL,
    PRIMARY KEY (user_id, period_key),
    KEY idx_unified_report_refreshed (user_id, refreshed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
