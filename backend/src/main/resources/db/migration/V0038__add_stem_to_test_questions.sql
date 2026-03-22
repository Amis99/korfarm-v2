-- test_questions 테이블에 stem (문제 본문) 컬럼 추가
ALTER TABLE test_questions ADD COLUMN stem TEXT AFTER passage;
