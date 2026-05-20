-- ============================================================
-- V0147: 학습 계획표 셀 비활성화 (status='disabled' + audit 컬럼)
-- ============================================================
--
-- 정책 (2026-05-20):
--  - 행/열 구조상 불필요한 셀을 어드민이 비활성화 가능.
--  - 비활성 셀은 진행률 계산에서 제외, 학생/학부모 화면에서 회색 처리.
--  - status 값에 'disabled' 추가. study_plan_cells.status VARCHAR(32) 그대로.
--  - 누가·언제 비활성화했는지 audit 컬럼 추가.

ALTER TABLE study_plan_cells
  ADD COLUMN disabled_by VARCHAR(255) NULL AFTER reviewed_by,
  ADD COLUMN disabled_at DATETIME    NULL AFTER reviewed_at;

CREATE INDEX idx_study_plan_cells_disabled_at ON study_plan_cells (disabled_at);
