-- 영상 URL 컬럼 추가 (유튜브 일부공개 영상 링크)
ALTER TABLE contents ADD COLUMN video_url VARCHAR(512) NULL;
ALTER TABLE pro_chapters ADD COLUMN video_url VARCHAR(512) NULL;
