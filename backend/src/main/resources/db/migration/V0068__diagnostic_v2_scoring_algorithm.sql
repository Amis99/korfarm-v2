-- V0068: 진단 채점 알고리즘 v2 — 정답률 가중 평균
--   diag_sessions 에 max_scores_json 컬럼 추가
--   v2 알고리즘: scores / maxScores × 100 으로 역량별 점수 산출
--   기존 v1 데이터 (scoresJson 누적값, BASE_SCORE 50 시작) 와 호환되지 않음
--   → 기존 완료된 세션은 옛 점수가 그대로 표시되며, 신규 응시부터 v2 적용
ALTER TABLE diag_sessions
    ADD COLUMN max_scores_json JSON DEFAULT NULL COMMENT 'v2: 측정 가능한 최대 가중치 (역량별)';
