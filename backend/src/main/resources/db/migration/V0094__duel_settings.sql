-- 대결 모드의 AI 플레이어 / 매치 규칙 / 큐 / 보상 정책을 DB 에 저장.
-- 기본은 단일 행(id='default') 만 사용하며 코드의 default 값과 merge 되어 응답된다.

CREATE TABLE duel_settings (
    id              VARCHAR(64) NOT NULL PRIMARY KEY COMMENT '설정 ID (보통 default 한 행만 존재)',
    settings_json   LONGTEXT NOT NULL                COMMENT '설정 JSON 본문 — 매치규칙·AI플레이어·큐·보상',
    updated_at      DATETIME NOT NULL                COMMENT '마지막 수정 시각',
    updated_by      VARCHAR(64)                      COMMENT '마지막 수정자 user_id'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
