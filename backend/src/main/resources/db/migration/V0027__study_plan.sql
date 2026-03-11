-- ============================================================
-- V0027: 학습 계획표 (Study Plan) 기능
-- ============================================================

-- 계획표 본체
CREATE TABLE study_plans (
    id VARCHAR(255) PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    exam_scope TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_by VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_sp_org_status (org_id, status)
);

-- 배정 대상 (수강반 or 학생)
CREATE TABLE study_plan_targets (
    id VARCHAR(255) PRIMARY KEY,
    plan_id VARCHAR(255) NOT NULL,
    target_type VARCHAR(16) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    INDEX idx_spt_plan (plan_id)
);

-- 매트릭스 세로축 (범위 행)
CREATE TABLE study_plan_scopes (
    id VARCHAR(255) PRIMARY KEY,
    plan_id VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_sps_plan_order (plan_id, sort_order)
);

-- 매트릭스 가로축 (에셋 열)
CREATE TABLE study_plan_assets (
    id VARCHAR(255) PRIMARY KEY,
    plan_id VARCHAR(255) NOT NULL,
    asset_type VARCHAR(32) NOT NULL,
    label VARCHAR(255) NOT NULL,
    asset_kind VARCHAR(16) NOT NULL DEFAULT 'study',
    ref_id VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    config_json JSON,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_spa_plan_order (plan_id, sort_order)
);

-- 매트릭스 셀 (학생별 할일 상태)
CREATE TABLE study_plan_cells (
    id VARCHAR(255) PRIMARY KEY,
    plan_id VARCHAR(255) NOT NULL,
    scope_id VARCHAR(255) NOT NULL,
    asset_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    score INT,
    submission_count INT NOT NULL DEFAULT 0,
    admin_note TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY uk_spc_scope_asset_user (scope_id, asset_id, user_id),
    INDEX idx_spc_plan_user (plan_id, user_id),
    INDEX idx_spc_user_status (user_id, status)
);

-- 셀 첨부파일 (학생 제출물)
CREATE TABLE study_plan_cell_files (
    id VARCHAR(255) PRIMARY KEY,
    cell_id VARCHAR(255) NOT NULL,
    file_id VARCHAR(255) NOT NULL,
    uploaded_by VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    INDEX idx_spcf_cell (cell_id)
);

-- 캘린더 일정
CREATE TABLE study_plan_schedules (
    id VARCHAR(255) PRIMARY KEY,
    plan_id VARCHAR(255) NOT NULL,
    scope_id VARCHAR(255),
    asset_id VARCHAR(255),
    scheduled_date DATE NOT NULL,
    label VARCHAR(255),
    memo TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_spsc_plan_date (plan_id, scheduled_date)
);
