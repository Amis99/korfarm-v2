-- ============================================================
-- V0082: 학습 계획표 ↔ 글농장 연동 + assignments 도메인 제거
-- ============================================================
-- 1) wisdom_posts: 학습 계획표 셀과 연결할 plan_cell_id 컬럼 추가
-- 2) study_plans: 기관 default 템플릿 표시용 is_template 추가
-- 3) 사용하지 않는 assignments / writing 도메인 테이블 DROP
-- 4) study_plan_assets.asset_type 'writing' 허용은 코드 레이어에서 검증

-- 1. wisdom_posts.plan_cell_id 추가
ALTER TABLE wisdom_posts
    ADD COLUMN plan_cell_id VARCHAR(64) NULL,
    ADD INDEX idx_wisdom_plan_cell (plan_cell_id);

-- 2. study_plans.is_template + template_origin_id 추가
--    is_template: 기관 default 템플릿 여부
--    template_origin_id: 학생용 복제본이 어느 템플릿에서 만들어졌는지 추적
ALTER TABLE study_plans
    ADD COLUMN is_template BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN template_origin_id VARCHAR(255) NULL,
    ADD INDEX idx_sp_template_origin (template_origin_id);

-- 3. assignments / writing 도메인 테이블 제거
DROP TABLE IF EXISTS assignment_feedback;
DROP TABLE IF EXISTS assignment_submissions;
DROP TABLE IF EXISTS assignment_targets;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS writing_feedback;
DROP TABLE IF EXISTS writing_submissions;
