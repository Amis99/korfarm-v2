-- contents 테이블에 categories(JSON array string) 컬럼 추가
-- 한 콘텐츠가 여러 카테고리(일일 학습/농장별 학습/프로 모드/이야기·고전 농장 등)에
-- 동시 노출되도록 하기 위함. content_type 컬럼은 학생 API 호환을 위해
-- array의 primary 카테고리(첫 항목)를 그대로 유지.

ALTER TABLE contents
  ADD COLUMN categories LONGTEXT NULL AFTER content_type;

-- 기존 데이터의 content_type 단일 값을 새 카테고리 array로 매핑
-- (이전 명칭 정리 + 다중 분류 자동 부여)

-- 일일 학습
UPDATE contents SET categories = '["DAILY_QUIZ"]'
  WHERE content_type = 'DAILY_QUIZ' AND categories IS NULL;

-- 일일 독해 → 농장 독해에도 자동 노출
UPDATE contents SET categories = '["DAILY_READING","READING"]'
  WHERE content_type = 'DAILY_READING' AND categories IS NULL;

-- 농장별 학습 — 어휘
UPDATE contents SET categories = '["VOCAB"]'
  WHERE content_type = 'VOCAB_BASIC' AND categories IS NULL;

-- 농장별 학습 — 독해 (비문학)
UPDATE contents SET categories = '["READING"]'
  WHERE content_type = 'READING_NONFICTION' AND categories IS NULL;

-- 농장별 학습 — 독해 (문학) → 일단 READING만. STORY/CLASSIC은 사용자가 추후 명시적으로 추가
UPDATE contents SET categories = '["READING"]'
  WHERE content_type = 'READING_LITERATURE' AND categories IS NULL;

-- 농장별 학습 — 문법
UPDATE contents SET categories = '["GRAMMAR_WORD_FORMATION"]'
  WHERE content_type = 'GRAMMAR_WORD_FORMATION' AND categories IS NULL;
UPDATE contents SET categories = '["GRAMMAR_SENTENCE_STRUCTURE"]'
  WHERE content_type = 'GRAMMAR_SENTENCE_STRUCTURE' AND categories IS NULL;
UPDATE contents SET categories = '["GRAMMAR_PHONEME_CHANGE"]'
  WHERE content_type = 'GRAMMAR_PHONEME_CHANGE' AND categories IS NULL;
UPDATE contents SET categories = '["GRAMMAR_POS"]'
  WHERE content_type IN ('GRAMMAR_POS', 'MORPHEME_ANALYSIS') AND categories IS NULL;

-- 농장별 학습 — 배경지식 (잔재 _QUIZ 통합)
UPDATE contents SET categories = '["BACKGROUND"]'
  WHERE content_type IN ('BACKGROUND_KNOWLEDGE', 'BACKGROUND_KNOWLEDGE_QUIZ') AND categories IS NULL;

-- 농장별 학습 — 국어 개념 (잔재 _QUIZ 통합)
UPDATE contents SET categories = '["CONCEPT"]'
  WHERE content_type IN ('LANGUAGE_CONCEPT', 'LANGUAGE_CONCEPT_QUIZ') AND categories IS NULL;

-- 농장별 학습 — 논리사고력 (잔재 _QUIZ 통합)
UPDATE contents SET categories = '["LOGIC"]'
  WHERE content_type IN ('LOGIC_REASONING', 'LOGIC_REASONING_QUIZ') AND categories IS NULL;

-- 농장별 학습 — 선택지 분석 (옛 명 통합)
UPDATE contents SET categories = '["CHOICE_ANALYSIS"]'
  WHERE content_type IN ('CHOICE_ANALYSIS', 'CHOICE_JUDGEMENT') AND categories IS NULL;

-- 프로 모드 — 농장별 학습 동일 카테고리에도 자동 노출
UPDATE contents SET categories = '["PRO_READING","READING"]'
  WHERE content_type = 'PRO_READING' AND categories IS NULL;
UPDATE contents SET categories = '["PRO_VOCAB","VOCAB"]'
  WHERE content_type = 'PRO_VOCAB' AND categories IS NULL;
UPDATE contents SET categories = '["PRO_BACKGROUND","BACKGROUND"]'
  WHERE content_type = 'PRO_BACKGROUND' AND categories IS NULL;
UPDATE contents SET categories = '["PRO_LOGIC","LOGIC"]'
  WHERE content_type = 'PRO_LOGIC' AND categories IS NULL;

-- 콘텐츠 관리에서 안 보이지만 데이터는 유지 (다른 메뉴에서 관리)
UPDATE contents SET categories = '["STUDY_CONTENT"]'
  WHERE content_type IN ('STUDY_CONTENT', 'CONTENT_PDF', 'CONTENT_PDF_QUIZ') AND categories IS NULL;
UPDATE contents SET categories = '["WRITING"]'
  WHERE content_type = 'WRITING_DESCRIPTIVE' AND categories IS NULL;
UPDATE contents SET categories = '["PRO_TEST"]'
  WHERE content_type = 'PRO_TEST' AND categories IS NULL;
UPDATE contents SET categories = '["PRO_ANSWER"]'
  WHERE content_type IN ('PRO_ANSWER', 'PRO_MANUSCRIPT') AND categories IS NULL;

-- 매핑 누락분 fallback: content_type을 그대로 array에 단일 wrapping
UPDATE contents SET categories = CONCAT('["', content_type, '"]')
  WHERE categories IS NULL;
