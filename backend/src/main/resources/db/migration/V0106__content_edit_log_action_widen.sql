-- content_edit_logs.action 컬럼 폭 확장 — 긴 action 이름 수용
ALTER TABLE content_edit_logs MODIFY COLUMN action VARCHAR(64) NOT NULL;
