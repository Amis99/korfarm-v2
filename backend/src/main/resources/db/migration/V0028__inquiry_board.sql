-- 문의/상담 게시판 추가
INSERT IGNORE INTO boards (id, board_type, org_scope, status, created_at, updated_at)
VALUES ('board_inquiry', 'inquiry', 'public', 'active', NOW(), NOW());

INSERT IGNORE INTO feature_flags (flag_key, enabled, rollout_percent, description, updated_at)
VALUES ('feature.community.inquiry', 1, 100, '문의/상담 게시판', NOW());
