-- 다중 reading 아이템 지원: 한 챕터에 동일 type 아이템 여러 개 허용
-- 기존 uk_chapter_type(chapter_id, type) → uk_chapter_type_order(chapter_id, type, item_order)

-- 기존 유니크 제약 삭제
ALTER TABLE pro_chapter_items DROP INDEX uk_chapter_type;

-- 새 유니크 제약 추가 (chapter_id + type + item_order 조합)
ALTER TABLE pro_chapter_items ADD CONSTRAINT uk_chapter_type_order UNIQUE (chapter_id, type, item_order);

-- pro_chapter_items에 label 컬럼 추가 (예: "독해 1 — 문법 지문")
ALTER TABLE pro_chapter_items ADD COLUMN label VARCHAR(200) NULL AFTER item_order;

-- pro_test_sessions에 mode 컬럼 추가 (print / online)
ALTER TABLE pro_test_sessions ADD COLUMN mode VARCHAR(20) NOT NULL DEFAULT 'print' AFTER chapter_test_id;
