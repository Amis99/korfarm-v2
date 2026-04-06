-- 진단 시험지 총점 100점으로 정정
--   기존: 48문항 × 10점 = 480점
--   변경: 4문항 × 3점 + 44문항 × 2점 = 100점
--   배점 분배: 각 tier의 마지막 4문항(number 12, 24, 36, 48)에 3점, 나머지 2점

UPDATE test_papers
SET total_points = 100,
    updated_at = NOW()
WHERE series = 'diagnostic';

-- 모든 진단 문항 기본 2점
UPDATE test_questions
SET points = 2
WHERE test_id LIKE 'diag_paper_%';

-- 각 시험지의 12번째마다 위치하는 문항(12, 24, 36, 48)에 3점 보너스
UPDATE test_questions
SET points = 3
WHERE test_id LIKE 'diag_paper_%'
  AND number IN (12, 24, 36, 48);
