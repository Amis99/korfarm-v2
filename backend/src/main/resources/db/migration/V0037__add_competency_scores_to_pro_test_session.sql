-- 프로 모드 테스트 세션에 역량별 점수 JSON 컬럼 추가
ALTER TABLE pro_test_sessions
    ADD COLUMN competency_scores JSON NULL COMMENT '10대 역량별 점수 (domain → {correct, total, accuracy})';
