-- 시즌 시작 안내 모달을 사용자별로 1회만 표시하기 위한 플래그 테이블
-- 매월 1일 새 시즌 시작 시 모든 사용자에게 모달 노출, 닫기 시 row insert

CREATE TABLE season_modal_seen (
  season_id   VARCHAR(64)  NOT NULL,
  user_id     VARCHAR(64)  NOT NULL,
  seen_at     DATETIME     NOT NULL,
  PRIMARY KEY (season_id, user_id),
  KEY idx_user_id (user_id),
  KEY idx_season_id (season_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
