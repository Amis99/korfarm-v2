-- 시험지 디자인 기능 전체 폐기 (워드프로세서·Typst·시각 레이아웃 모두 사용 X)
-- V0088, V0089, V0090 에서 추가됐던 컬럼들 제거. 코드도 함께 제거됨.

ALTER TABLE test_papers
  DROP COLUMN layout_json,
  DROP COLUMN answer_layout_json,
  DROP COLUMN typst_source,
  DROP COLUMN answer_typst_source,
  DROP COLUMN html_content,
  DROP COLUMN answer_html_content,
  DROP COLUMN html_pdf_file_id,
  DROP COLUMN answer_html_pdf_file_id;
