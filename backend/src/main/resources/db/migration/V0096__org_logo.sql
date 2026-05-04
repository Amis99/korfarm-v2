-- 기관 로고 파일 ID — files 테이블의 file_id 참조
-- 인쇄물 헤더에 ORG_ADMIN 본인 기관 로고 표시 용도
ALTER TABLE orgs ADD COLUMN logo_file_id VARCHAR(64) DEFAULT NULL;
