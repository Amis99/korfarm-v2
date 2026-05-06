-- learning_competency_log 의 string 컬럼들이 utf8mb4_unicode_ci 인데
-- RecommendationService 의 SQL: NOT IN (SELECT content_id FROM learning_competency_log) 비교 시
-- contents.id (utf8mb4_0900_ai_ci) 와 충돌.
-- 테이블 전체를 0900_ai_ci 로 통일.

ALTER TABLE learning_competency_log CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
