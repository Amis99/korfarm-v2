-- 기타 테스트(series 가 chapter/diagnostic 가 아닌 경우)의 level_id 를 12레벨 → 4그룹으로 변환.
-- 정책 (2026-05-13): 기타 테스트의 대상 레벨은 saussure/frege/russell/wittgenstein 4단계.
--                   학생 응시 시 학생 levelId 의 그룹과 시험 levelId 매칭.
-- 진단(series='diagnostic') 은 이미 4tier 라 영향 없음. 챕터(series='chapter') 는 12레벨 그대로.
UPDATE test_papers
SET level_id = CASE
    WHEN level_id LIKE 'saussure%' THEN 'saussure'
    WHEN level_id LIKE 'frege%' THEN 'frege'
    WHEN level_id LIKE 'russell%' THEN 'russell'
    WHEN level_id LIKE 'wittgenstein%' THEN 'wittgenstein'
    ELSE level_id
END
WHERE (series IS NULL OR (series <> 'chapter' AND series <> 'diagnostic'))
  AND level_id IS NOT NULL;
