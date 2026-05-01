-- 학습 계획표 셀 배정 시스템 Phase 1
-- - due_at: 셀별 마감 기한 (배정 시 필수, default = 그날 +7일)
-- - assigned_label: 자유 텍스트 (활동·자유주제·테스트 표시명 등 자산 ref 가 없을 때 라벨)

ALTER TABLE study_plan_cells
  ADD COLUMN due_at DATETIME NULL AFTER cell_ref_id,
  ADD COLUMN assigned_label VARCHAR(255) NULL AFTER due_at;

CREATE INDEX idx_study_plan_cells_due_at ON study_plan_cells (due_at);
