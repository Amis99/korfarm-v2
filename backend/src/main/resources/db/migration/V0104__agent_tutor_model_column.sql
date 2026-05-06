-- AI 비서·학생 튜터 사용 로그에 model 컬럼 추가 (정확한 모델 ID 기록)
ALTER TABLE agent_usage_log ADD COLUMN model VARCHAR(64) DEFAULT 'claude-sonnet-4-6';
ALTER TABLE tutor_usage_log ADD COLUMN model VARCHAR(64) DEFAULT 'claude-sonnet-4-6';
