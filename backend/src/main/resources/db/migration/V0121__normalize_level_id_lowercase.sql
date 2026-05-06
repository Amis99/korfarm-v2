-- level_id 형식 통일 — 모든 테이블이 소문자 형식(saussure1, frege1, russell1, wittgenstein1)을 사용.
-- users.level_id 가 표준. 일부 테이블에 대문자_숫자 형식(SAUSSURE_1 등)이 섞여 있어 추천 검색 누락 발생.
-- 변환 룰: SAUSSURE_1 → saussure1 (대문자→소문자, 언더바 제거)

-- contents 테이블 (9981 row)
UPDATE contents
SET level_id = LOWER(REPLACE(level_id, '_', ''))
WHERE level_id REGEXP '^[A-Z]+_[0-9]+$';

-- content_recommendation_index 테이블 (9981 row)
UPDATE content_recommendation_index
SET level_id = LOWER(REPLACE(level_id, '_', ''))
WHERE level_id REGEXP '^[A-Z]+_[0-9]+$';

-- test_papers 테이블 (79 row)
UPDATE test_papers
SET level_id = LOWER(REPLACE(level_id, '_', ''))
WHERE level_id REGEXP '^[A-Z]+_[0-9]+$';

-- 비표준 4 row (test_papers — 숫자 없는 'frege','russell','sohssure','wittgenstein')는 그대로 보존.
-- 이후 운영자가 직접 정리.
