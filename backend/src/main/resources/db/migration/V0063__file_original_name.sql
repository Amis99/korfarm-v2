-- 파일 원본 이름 저장 컬럼 추가
ALTER TABLE files ADD COLUMN original_name VARCHAR(500) NULL AFTER url;
