-- 문제은행 점검자/점검상태 컬럼 추가
ALTER TABLE qb_records
  ADD COLUMN reviewer VARCHAR(120) DEFAULT NULL AFTER author,
  ADD COLUMN review_status VARCHAR(32) NOT NULL DEFAULT 'none' AFTER reviewer,
  ADD COLUMN reviewed_at DATETIME DEFAULT NULL AFTER review_status;

-- review_status: 'none' (점검 전), 'in_progress' (점검 중), 'done' (점검 완료)
