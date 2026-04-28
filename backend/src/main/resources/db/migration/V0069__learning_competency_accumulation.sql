-- 학습/테스트 통합 10대 역량 누적 시스템
-- 진단 테스트 결과(diag_sessions)는 별도. 여기는 일일퀴즈/챕터테스트/기타테스트/학습 모두 종합 누적.
-- 슬라이딩 윈도우 N=100 학습 (in_window=false 로 밀어냄).

-- ─── 학습 단위 시계열 로그 (모두 보존) ───
CREATE TABLE IF NOT EXISTS learning_competency_log (
  id              VARCHAR(64)  NOT NULL PRIMARY KEY,
  user_id         VARCHAR(64)  NOT NULL,
  content_id      VARCHAR(64)  NOT NULL,
  source          VARCHAR(32)  NOT NULL  COMMENT 'chapter_test / test_paper / daily_quiz / farm_learning / pro_learning',
  weight          DOUBLE       NOT NULL  COMMENT '가중치: 테스트=10, 일일퀴즈=3, 학습=1',
  vector_json     TEXT         NOT NULL  COMMENT '이 학습의 역량별 정답률 (0~1) JSON',
  measured_json   TEXT         NOT NULL  COMMENT '이 학습이 측정한 역량 (1=측정함, 0=측정 안 함) JSON',
  in_window       BOOLEAN      NOT NULL  DEFAULT TRUE COMMENT '슬라이딩 윈도우 내 여부',
  completed_at    DATETIME     NOT NULL,
  KEY idx_user_window (user_id, in_window, completed_at),
  KEY idx_user_content (user_id, content_id),
  KEY idx_user_completed (user_id, completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학습/테스트 단위 누적 시계열 — 슬라이딩 윈도우 N=100';

-- ─── 사용자별 역량 요약 (캐시) ───
CREATE TABLE IF NOT EXISTS user_competency_summary (
  user_id         VARCHAR(64)  NOT NULL,
  competency      VARCHAR(64)  NOT NULL,
  earned_total    DOUBLE       NOT NULL  DEFAULT 0  COMMENT '윈도우 내 Σ(weight × measured × ratio)',
  max_total       DOUBLE       NOT NULL  DEFAULT 0  COMMENT '윈도우 내 Σ(weight × measured)',
  ratio_score     DOUBLE       NOT NULL  DEFAULT 0  COMMENT 'earned_total / max_total × 100 (max=0 이면 0)',
  sample_count    INT          NOT NULL  DEFAULT 0  COMMENT '윈도우 내 측정 entry 수',
  updated_at      DATETIME     NOT NULL,
  PRIMARY KEY (user_id, competency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학습 종합 누적 역량 점수 — 통합 성적표 표시용';
