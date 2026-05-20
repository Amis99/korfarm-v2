-- ============================================================
-- V0148: 학습 계획표 셀의 배정 시점 (assigned_at) 컬럼
-- ============================================================
--
-- 사고 배경 (보고서 8.13 N-3):
--  - 기존 캘린더는 cell.updated_at 을 배정일로 사용
--  - 셀에 상태 변경(메모/점수/완료 등)이 한 번이라도 일어나면 updated_at 갱신 → 캘린더 시작 막대가 "오늘" 로 점프
--  - 의도는 "배정일 ~ 마감일" 전 구간 표시인데 실제로는 마감 직전만 표시되는 회귀
--
-- 신설 정책:
--  - assigned_at = 첫 배정 시점 (cell.status 가 unassigned 에서 다른 값으로 처음 전환되거나 cellRefId 가 채워질 때)
--  - 이후 상태 변경에서는 갱신 안 함
--  - NULL 이면 frontend 는 updated_at fallback (기존 동작 유지)

ALTER TABLE study_plan_cells
  ADD COLUMN assigned_at DATETIME NULL AFTER assigned_label;

CREATE INDEX idx_study_plan_cells_assigned_at ON study_plan_cells (assigned_at);
