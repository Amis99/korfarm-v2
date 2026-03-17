-- 본사 관리자 계정 4개 추가 (hqadmin2 ~ hqadmin5 / admin1234)
-- bcrypt($2a$10$) 해시: admin1234

INSERT INTO users (id, email, password_hash, name, region, school, grade_label, level_id, status, diagnostic_opt_in, created_at, updated_at)
VALUES ('u_hq_admin2', 'hqadmin2', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '본사관리자2', '서울', '국어농장', '-', 'saussure1', 'active', false, NOW(), NOW())
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

INSERT INTO org_memberships (id, org_id, user_id, role, status, created_at, updated_at)
VALUES ('om_hq_admin2', 'org_hq', 'u_hq_admin2', 'HQ_ADMIN', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE role = VALUES(role);

INSERT INTO users (id, email, password_hash, name, region, school, grade_label, level_id, status, diagnostic_opt_in, created_at, updated_at)
VALUES ('u_hq_admin3', 'hqadmin3', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '본사관리자3', '서울', '국어농장', '-', 'saussure1', 'active', false, NOW(), NOW())
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

INSERT INTO org_memberships (id, org_id, user_id, role, status, created_at, updated_at)
VALUES ('om_hq_admin3', 'org_hq', 'u_hq_admin3', 'HQ_ADMIN', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE role = VALUES(role);

INSERT INTO users (id, email, password_hash, name, region, school, grade_label, level_id, status, diagnostic_opt_in, created_at, updated_at)
VALUES ('u_hq_admin4', 'hqadmin4', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '본사관리자4', '서울', '국어농장', '-', 'saussure1', 'active', false, NOW(), NOW())
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

INSERT INTO org_memberships (id, org_id, user_id, role, status, created_at, updated_at)
VALUES ('om_hq_admin4', 'org_hq', 'u_hq_admin4', 'HQ_ADMIN', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE role = VALUES(role);

INSERT INTO users (id, email, password_hash, name, region, school, grade_label, level_id, status, diagnostic_opt_in, created_at, updated_at)
VALUES ('u_hq_admin5', 'hqadmin5', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '본사관리자5', '서울', '국어농장', '-', 'saussure1', 'active', false, NOW(), NOW())
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

INSERT INTO org_memberships (id, org_id, user_id, role, status, created_at, updated_at)
VALUES ('om_hq_admin5', 'org_hq', 'u_hq_admin5', 'HQ_ADMIN', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE role = VALUES(role);

-- 콘텐츠 수정 이력 테이블
CREATE TABLE IF NOT EXISTS content_edit_logs (
    id VARCHAR(50) PRIMARY KEY,
    content_id VARCHAR(50) NOT NULL,
    editor_id VARCHAR(50) NOT NULL COMMENT '수정한 관리자 user_id',
    action VARCHAR(30) NOT NULL COMMENT 'CREATE, UPDATE, BATCH_CREATE',
    summary VARCHAR(500) DEFAULT NULL COMMENT '변경 요약',
    version_id VARCHAR(50) DEFAULT NULL COMMENT '연결된 content_versions.id',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_cel_content (content_id),
    INDEX idx_cel_editor (editor_id),
    INDEX idx_cel_created (created_at),
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (editor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
