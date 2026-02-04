-- 본사(HQ) 기관 + HQ_ADMIN 계정
-- 로그인: hqadmin / admin1234
INSERT INTO orgs (id, name, status, plan, seat_limit, created_at, updated_at)
VALUES ('org_hq', '국어농장 본사', 'active', 'Enterprise', 9999, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO users (id, email, password_hash, name, region, school, grade_label, level_id, status, created_at, updated_at)
VALUES ('u_hq_admin', 'hqadmin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '본사관리자', '서울', '국어농장', '-', 'saussure1', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO org_memberships (id, org_id, user_id, role, status, created_at, updated_at)
VALUES ('om_hq_admin', 'org_hq', 'u_hq_admin', 'HQ_ADMIN', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE role = VALUES(role);

-- 제휴 기관 + ORG_ADMIN 계정
-- 로그인: orgadmin / admin1234
INSERT INTO orgs (id, name, status, plan, seat_limit, created_at, updated_at)
VALUES ('org_test_academy', '테스트학원', 'active', 'Pro', 100, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO users (id, email, password_hash, name, region, school, grade_label, level_id, status, created_at, updated_at)
VALUES ('u_org_admin', 'orgadmin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '기관관리자', '서울', '테스트학원', '-', 'saussure1', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO org_memberships (id, org_id, user_id, role, status, created_at, updated_at)
VALUES ('om_org_admin', 'org_test_academy', 'u_org_admin', 'ORG_ADMIN', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE role = VALUES(role);
