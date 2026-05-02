-- 국어농장 셀 복수 배정용 1:N 테이블.
-- korfarm 자산 셀 한 개에 콘텐츠 여러 개 배정 + 각 배정마다 독립 status.
-- 진행률 계산은 assignment row 단위 (각 콘텐츠 = 1 카운트).

CREATE TABLE study_plan_cell_assignments (
  id VARCHAR(64) PRIMARY KEY,
  cell_id VARCHAR(64) NOT NULL,
  ref_id VARCHAR(64) NOT NULL,
  assigned_label VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  score INT NULL,
  due_at DATETIME NULL,
  completed_at DATETIME NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_spca_cell (cell_id),
  INDEX idx_spca_ref (ref_id),
  CONSTRAINT fk_spca_cell FOREIGN KEY (cell_id) REFERENCES study_plan_cells(id) ON DELETE CASCADE
);

-- 기존 cellRefId 가 있는 korfarm 셀의 데이터를 assignment row 로 복제 (단일 → 첫 row).
-- 다른 자산 종류 (test, writing, activity) 는 cell.cellRefId 그대로 사용.
INSERT INTO study_plan_cell_assignments
  (id, cell_id, ref_id, assigned_label, status, due_at, completed_at, sort_order, created_at)
SELECT
  CONCAT('spca_', SUBSTRING(MD5(CONCAT(c.id, COALESCE(c.cell_ref_id, ''))), 1, 24)),
  c.id,
  c.cell_ref_id,
  c.assigned_label,
  c.status,
  c.due_at,
  CASE WHEN c.status IN ('completed','passed','reviewed') THEN c.created_at ELSE NULL END,
  0,
  c.created_at
FROM study_plan_cells c
JOIN study_plan_assets a ON a.id = c.asset_id
WHERE a.asset_type = 'korfarm' AND c.cell_ref_id IS NOT NULL AND c.cell_ref_id != '';
