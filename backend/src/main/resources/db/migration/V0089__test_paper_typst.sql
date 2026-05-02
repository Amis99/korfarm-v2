-- 시험지 Typst 소스 (LaTeX 대안 — 빠른 컴파일·한글 폰트 손쉬움)
-- typst_source: 시험지 / answer_typst_source: 정답·해설
-- 어드민이 [디자인]에서 자동 채우기 + 코드 편집 → typst CLI 가 PDF 컴파일

ALTER TABLE test_papers
  ADD COLUMN typst_source LONGTEXT NULL AFTER answer_layout_json,
  ADD COLUMN answer_typst_source LONGTEXT NULL AFTER typst_source;
