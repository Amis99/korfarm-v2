-- 대결 모드 피처 플래그 활성화
UPDATE feature_flags SET enabled = 1, rollout_percent = 100 WHERE flag_key = 'feature.duel.mode';
