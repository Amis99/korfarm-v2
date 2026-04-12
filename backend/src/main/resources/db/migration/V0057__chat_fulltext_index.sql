-- chat_messages에 FULLTEXT 인덱스 추가 (포도 AI 관련 대화 검색용)
ALTER TABLE chat_messages ADD FULLTEXT INDEX ft_chat_content (content) WITH PARSER ngram;
