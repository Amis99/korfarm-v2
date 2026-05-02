-- 시험지 워드프로세서 HTML 본문 + 자동 생성된 PDF 파일 ID
-- 어드민이 비주얼 편집 → HTML 저장 → Chrome headless 가 PDF 컴파일

ALTER TABLE test_papers
  ADD COLUMN html_content LONGTEXT NULL AFTER answer_typst_source,
  ADD COLUMN answer_html_content LONGTEXT NULL AFTER html_content,
  ADD COLUMN html_pdf_file_id VARCHAR(64) NULL AFTER answer_html_content,
  ADD COLUMN answer_html_pdf_file_id VARCHAR(64) NULL AFTER html_pdf_file_id;
