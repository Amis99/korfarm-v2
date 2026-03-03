-- 콘텐츠 카탈로그 컬럼 추가: 농장/프로 모드 구분 및 카탈로그 검색 지원
ALTER TABLE contents
  ADD COLUMN area VARCHAR(64) DEFAULT NULL,
  ADD COLUMN sub_area VARCHAR(64) DEFAULT NULL,
  ADD COLUMN day_index INT DEFAULT NULL,
  ADD COLUMN module_key VARCHAR(64) DEFAULT NULL;

CREATE INDEX idx_contents_catalog ON contents(content_type, area, level_id, status);
CREATE INDEX idx_contents_daily ON contents(content_type, level_id, day_index);
