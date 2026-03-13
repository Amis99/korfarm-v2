-- 학습 계획표 이벤트 (캘린더 자동 표시용)
CREATE TABLE study_plan_events (
    id VARCHAR(255) PRIMARY KEY,
    plan_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    event_date DATE NOT NULL,
    cell_id VARCHAR(255),
    ref_label VARCHAR(255),
    memo TEXT,
    created_at DATETIME NOT NULL,
    INDEX idx_spe_plan_user_date (plan_id, user_id, event_date),
    INDEX idx_spe_user_date (user_id, event_date)
);
