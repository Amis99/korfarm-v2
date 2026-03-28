-- 기존 콘텐츠 area 일괄 매핑: 프로 모드/기존 콘텐츠의 area가 NULL인 경우 농장 ID로 설정
UPDATE contents SET area = 'vocab' WHERE content_type IN ('PRO_VOCAB','VOCAB_BASIC','VOCAB_DICTIONARY') AND (area IS NULL OR area = '');
UPDATE contents SET area = 'reading' WHERE content_type IN ('PRO_READING','DAILY_READING','READING_NONFICTION') AND (area IS NULL OR area = '');
UPDATE contents SET area = 'background' WHERE content_type IN ('PRO_BACKGROUND','BACKGROUND_KNOWLEDGE','BACKGROUND_KNOWLEDGE_QUIZ') AND (area IS NULL OR area = '');
UPDATE contents SET area = 'logic' WHERE content_type IN ('PRO_LOGIC','LOGIC_REASONING','LOGIC_REASONING_QUIZ') AND (area IS NULL OR area = '');
UPDATE contents SET area = 'grammar' WHERE content_type LIKE 'GRAMMAR_%' AND (area IS NULL OR area = '');
UPDATE contents SET area = 'concept' WHERE content_type LIKE 'LANGUAGE_CONCEPT%' AND (area IS NULL OR area = '');
UPDATE contents SET area = 'content' WHERE content_type IN ('CONTENT_PDF','CONTENT_PDF_QUIZ') AND (area IS NULL OR area = '');
UPDATE contents SET area = 'writing' WHERE content_type = 'WRITING_DESCRIPTIVE' AND (area IS NULL OR area = '');
UPDATE contents SET area = 'choice' WHERE content_type = 'CHOICE_JUDGEMENT' AND (area IS NULL OR area = '');
-- READING_LITERATURE는 기본 reading, 관리자가 업로드 시 story/classic으로 구분
UPDATE contents SET area = 'reading' WHERE content_type = 'READING_LITERATURE' AND (area IS NULL OR area = '');
