-- 시험지 비주얼 에디터 + 응시 통계 캐시
-- 1) test_papers 에 payload_json LONGTEXT 추가 (지문·문항·선지·해설·역량벡터 통합 JSON)
-- 2) test_paper_statistics 신규 테이블 (응시 즉시 계산되는 통계 캐시)

ALTER TABLE test_papers
  ADD COLUMN payload_json LONGTEXT NULL COMMENT '시험지 전체 JSON (지문/문항/선지/해설/역량벡터)';

CREATE TABLE IF NOT EXISTS test_paper_statistics (
  paper_id          VARCHAR(64)  NOT NULL PRIMARY KEY,
  submission_count  INT          NOT NULL DEFAULT 0 COMMENT '응시자 수',
  avg_score         DOUBLE       NULL COMMENT '평균 점수',
  max_score         INT          NULL COMMENT '최고 점수',
  min_score         INT          NULL COMMENT '최저 점수',
  std_dev           DOUBLE       NULL COMMENT '표준편차',
  grade_stats_json  LONGTEXT     NULL COMMENT '학년별 통계 JSON {grade:{count,avg,max,min,stddev}}',
  question_stats_json LONGTEXT   NULL COMMENT '문항별 통계 JSON [{number,wrongRate,choiceDistribution,wrongStudentNames,competencyVector}]',
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_test_paper_statistics_paper FOREIGN KEY (paper_id) REFERENCES test_papers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_test_paper_statistics_updated ON test_paper_statistics(updated_at);
