-- 진단·기타 테스트 정답·해설 PDF 별도 저장용 컬럼.
-- 학생용(시험지) 은 기존 pdf_file_id, 정답·해설용은 answer_pdf_file_id 로 분리.
ALTER TABLE test_papers
  ADD COLUMN answer_pdf_file_id VARCHAR(64) NULL AFTER pdf_file_id;
