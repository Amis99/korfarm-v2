-- 문의/상담 게시판 시드 + feature flag 활성화
-- V0002에서 누락된 inquiry 게시판을 추가

INSERT INTO boards (id, board_type, org_scope, status, created_at, updated_at) VALUES
  ('board_inquiry', 'inquiry', 'public', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  board_type = VALUES(board_type),
  status = VALUES(status),
  updated_at = NOW();

INSERT INTO feature_flags (flag_key, enabled, rollout_percent, description, updated_at) VALUES
  ('feature.community.inquiry', 1, 100, 'inquiry board', NOW())
ON DUPLICATE KEY UPDATE
  enabled = VALUES(enabled),
  rollout_percent = VALUES(rollout_percent),
  updated_at = NOW();

-- 학습자료 게시판 파일 업로드를 위해 feature.uploads 활성화
UPDATE feature_flags SET enabled=1, rollout_percent=100, updated_at=NOW()
WHERE flag_key='feature.uploads';
