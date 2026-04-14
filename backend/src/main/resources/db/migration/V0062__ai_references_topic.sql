-- topic 컬럼 추가 (RAG 검색 보조)
ALTER TABLE ai_chat_references ADD COLUMN topic VARCHAR(100) NULL AFTER source;
ALTER TABLE ai_chat_references ADD INDEX idx_source_topic (source, topic);
