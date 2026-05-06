-- agent_chat_messages.role 컬럼 폭 확장 — assistant_tool_use(18자) 수용 위해 VARCHAR(16) → VARCHAR(32)
ALTER TABLE agent_chat_messages MODIFY COLUMN role VARCHAR(32) NOT NULL;
