-- user_competency_summary.user_id·competency 가 utf8mb4_unicode_ci 인데
-- 다른 모든 테이블(content_recommendation_index, users, contents 등)은 utf8mb4_0900_ai_ci.
-- RecommendationService 의 추천 SQL 이 JOIN 시 collation 충돌로 "Illegal mix of collations" 발생.
-- 다른 테이블과 동일한 collation 으로 통일.

ALTER TABLE user_competency_summary
  MODIFY user_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  MODIFY competency VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL;
