-- 2026-05-10 사용자 정정:
-- 1) AI 비서·튜터 채팅은 자몽 차감 없음 — 단가 비활성화 (active=0)
-- 2) 체크포인트 단일 단가 — 일반/고급 분기 폐기 (advanced 행 비활성화)
--
-- 행을 삭제하지 않고 active=0 으로 두는 이유: 과거 거래 이력의 kind FK 무결성 보존.

UPDATE grapefruit_pricing
SET active = 0, updated_at = NOW(6)
WHERE kind IN (
  'agent-call-extra',          -- AI 비서 한도 초과 차감 (V0101 seed)
  'tutor-call-extra',          -- AI 튜터 한도 초과 차감 (있다면)
  'checkpoint-extract-opus'    -- 체크포인트 고급 (단일 단가로 통합 — basic 만 사용)
);
