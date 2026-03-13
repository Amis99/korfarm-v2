-- 셀별 콘텐츠 참조 ID 추가
ALTER TABLE study_plan_cells ADD COLUMN cell_ref_id VARCHAR(255) DEFAULT NULL;
CREATE INDEX idx_spc_cell_ref ON study_plan_cells (cell_ref_id);

-- 기존 데이터 마이그레이션: 이전 상태 → 새 상태
UPDATE study_plan_cells SET status = 'completed' WHERE status = 'approved';
UPDATE study_plan_cells SET status = 'pending' WHERE status = 'rejected';
UPDATE study_plan_cells SET status = 'submitted' WHERE status = 'grading';
UPDATE study_plan_cells SET status = 'pending' WHERE status = 'failed';

-- 국어농장/학습활동 에셋의 pending → unassigned (아직 콘텐츠 배정이 안 된 것)
UPDATE study_plan_cells c
  JOIN study_plan_assets a ON c.asset_id = a.id
  SET c.status = 'unassigned'
  WHERE c.status = 'pending' AND a.asset_type IN ('korfarm', 'activity');
