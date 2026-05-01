-- ============================================================
-- V0083: 학습 계획표 모델 리셋
-- ============================================================
-- 학습 계획표를 학생 단위 모델로 재설계함에 따라
-- 기존 plan / target / scope / asset / cell / cell_file / schedule / event 데이터 전부 초기화.
-- 기존 학생 제출물·진행 상태는 손실되며, 어드민이 새 모델에서 학생별로 재배정한다.
--
-- TRUNCATE 는 외래키(FK) 참조 때문에 사용 못 함 — DELETE 사용.
-- 자식 테이블 → 부모 테이블 순서로 삭제한다.
-- ============================================================

-- 셀 첨부파일 (가장 자식)
DELETE FROM study_plan_cell_files;

-- 셀
DELETE FROM study_plan_cells;

-- 캘린더 일정
DELETE FROM study_plan_schedules;

-- 학습 계획표 이벤트 로그 (V0034 에서 추가된 study_plan_events 테이블이 있을 경우)
DELETE FROM study_plan_events;

-- 매트릭스 가로축 (에셋 열)
DELETE FROM study_plan_assets;

-- 매트릭스 세로축 (범위 행)
DELETE FROM study_plan_scopes;

-- 배정 대상
DELETE FROM study_plan_targets;

-- 계획표 본체 (가장 부모)
DELETE FROM study_plans;
