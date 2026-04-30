-- 내용 숙지 페이지 단위 학습 — 자료를 페이지별로 분리.
-- 학습 진행: 페이지1 본문 → 페이지1 문제(최대 30) → 페이지2 본문 → 페이지2 문제(최대 30) → ...
-- 시험지 비주얼 에디터의 지문 컨테이너와 같은 개념.

CREATE TABLE study_pages (
  id VARCHAR(64) PRIMARY KEY,
  content_id VARCHAR(64) NOT NULL,
  page_no INT NOT NULL,
  title VARCHAR(255),
  markdown LONGTEXT NOT NULL,
  -- 페이지별 출제 포인트 리스트 (AI 추출 결과 또는 수동 입력)
  -- JSON: [{id, text, kind, evidence?}]
  checkpoints JSON,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_sp_content (content_id, page_no),
  CONSTRAINT fk_sp_content FOREIGN KEY (content_id) REFERENCES study_contents(id) ON DELETE CASCADE,
  UNIQUE KEY uk_sp_content_page (content_id, page_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- study_questions 에 page_id 추가 (페이지별 최대 30문제)
ALTER TABLE study_questions
  ADD COLUMN page_id VARCHAR(64) NULL AFTER content_id,
  ADD INDEX idx_sq_page (page_id);

-- 기존 study_contents.markdown → study_pages 1번 페이지로 마이그레이션
INSERT INTO study_pages (id, content_id, page_no, markdown, created_at, updated_at)
SELECT
  CONCAT('sp_', SUBSTRING(MD5(id), 1, 16)) AS id,
  id AS content_id,
  1 AS page_no,
  markdown,
  created_at,
  updated_at
FROM study_contents
WHERE markdown IS NOT NULL AND markdown <> '';

-- 기존 study_questions 들을 페이지 1에 연결
UPDATE study_questions sq
JOIN study_pages sp ON sp.content_id = sq.content_id AND sp.page_no = 1
SET sq.page_id = sp.id
WHERE sq.page_id IS NULL;
