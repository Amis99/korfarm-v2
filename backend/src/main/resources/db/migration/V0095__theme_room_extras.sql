-- 테마 대결 — 기관별 서브 서버 메타.
-- 한 기관(예: A) 안에 별도 문제은행을 가진 서브 서버(A1~A10) 를 최대 10개 운영.
-- 각 서브 서버는 운영 시한이 있으며 만료되면 비활성(통계는 보존).
-- 서브 서버 ID 는 duel_question_pool / duel_rooms / duel_matches / duel_stats 의 server_id 와 동일.

CREATE TABLE theme_sub_servers (
    id           VARCHAR(64) NOT NULL PRIMARY KEY      COMMENT '서브 서버 ID = duel_*.server_id (예: theme_<orgId>_a1)',
    org_id       VARCHAR(64) NOT NULL                  COMMENT '소속 기관 ID',
    sub_name     VARCHAR(120) NOT NULL                 COMMENT '서브 서버 이름 (예: A1 어휘 챌린지)',
    expire_at    DATETIME NULL                         COMMENT '운영 시한 (NULL=무기한). 지나면 비활성',
    status       VARCHAR(16) NOT NULL DEFAULT 'active' COMMENT 'active / expired / closed',
    created_by   VARCHAR(64) NOT NULL                  COMMENT '생성한 어드민 user_id',
    created_at   DATETIME NOT NULL,
    updated_at   DATETIME NOT NULL,
    INDEX idx_theme_sub_org (org_id, status),
    INDEX idx_theme_sub_expire (expire_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
