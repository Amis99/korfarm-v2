-- 프로 모드 정답·해설 PDF 단순화
-- 기존: type='answer' item 의 contentId → contents 테이블의 PRO_ANSWER 콘텐츠(JSON 비주얼)
-- 변경: ProChapterItemEntity 에 직접 pdf_file_id 보유 (JSON 비주얼 에디터 폐기)
--
-- 호환성:
--  - pdfFileId 가 있으면 신규 PDF 표시
--  - 없으면 기존 contentId → contents.contentJson fallback (옛 데이터 보존)

ALTER TABLE pro_chapter_items
  ADD COLUMN pdf_file_id VARCHAR(64) NULL AFTER content_id;
