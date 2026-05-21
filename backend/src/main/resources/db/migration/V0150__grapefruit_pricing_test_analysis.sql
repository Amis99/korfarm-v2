-- ============================================================
-- V0150: grapefruit_pricing 에 시험 정보 AI 분석 단가 등록
-- ============================================================
--
-- 사용자 결정 (2026-05-21):
--   - OCR (wisdom-ocr): 페이지당 1자몽 (기존)
--   - 시험 정보 AI 분석 (test-analysis-full): 시험당 고정 2자몽 (신규)
--
-- AdminTestController.aiAnalysisCharge 가 spendForCaller("test-analysis-full")
-- 호출 시 이 row 의 price_grapefruits 사용. HQ_ADMIN 은 spendForCaller 가
-- 자동 무료 처리, ORG_ADMIN 만 차감.

INSERT INTO grapefruit_pricing
  (kind, label, model, price_grapefruits, description, active, updated_at)
VALUES
  (
    'test-analysis-full',
    '시험 정보 AI 분석',
    'sonnet',
    2,
    '시험 1개 분석 (지문별·문항별 영역·세부영역·주제·역량 벡터·약점·선택지 패턴·선택지별 조언) — 시험당 고정 2자몽',
    1,
    NOW()
  )
ON DUPLICATE KEY UPDATE
  price_grapefruits = VALUES(price_grapefruits),
  description = VALUES(description),
  active = VALUES(active),
  updated_at = VALUES(updated_at);
