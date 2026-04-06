-- 커뮤니티 채팅 시스템
--   1) chat_messages: 메시지 본문 (텍스트/이미지/파일/음성/공지)
--   2) chat_user_mutes: 사용자 차단/뮤트
--   3) chat_attachment_archives: 주간 첨부 ZIP 보관함 (관리자 다운로드용)

CREATE TABLE chat_messages (
    id                VARCHAR(64)   NOT NULL PRIMARY KEY,
    room_id           VARCHAR(64)   NOT NULL COMMENT '추후 다중 채팅방 확장 대비, 현재는 ''community'' 고정',
    user_id           VARCHAR(64)   NOT NULL,
    user_name         VARCHAR(120)  NOT NULL COMMENT '발화 시점 닉네임 스냅샷 (탈퇴/개명 후에도 표시 보존)',
    message_type      VARCHAR(16)   NOT NULL COMMENT 'text|image|file|voice|notice',
    content           TEXT          NULL     COMMENT '텍스트 메시지 본문',
    file_id           VARCHAR(64)   NULL     COMMENT 'image/file/voice 첨부 file_id (live 상태에서만 유효)',
    thumbnail_path    VARCHAR(512)  NULL     COMMENT '영구 보관용 작은 썸네일 디스크 경로',
    attachment_state  VARCHAR(16)   NOT NULL DEFAULT 'live' COMMENT 'live|archived|purged',
    archived_at       DATETIME      NULL     COMMENT 'D+7일 보관함 이관 시각',
    is_admin          BOOLEAN       NOT NULL DEFAULT FALSE COMMENT '발신자가 관리자였는지(공지/강조용)',
    status            VARCHAR(16)   NOT NULL DEFAULT 'active' COMMENT 'active|deleted',
    deleted_by        VARCHAR(64)   NULL     COMMENT '삭제한 사용자/관리자 ID',
    created_at        DATETIME      NOT NULL DEFAULT NOW(),
    KEY idx_room_created (room_id, created_at),
    KEY idx_user (user_id),
    KEY idx_attach_state (attachment_state, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chat_user_mutes (
    id            VARCHAR(64)  NOT NULL PRIMARY KEY,
    room_id       VARCHAR(64)  NOT NULL,
    user_id       VARCHAR(64)  NOT NULL COMMENT '차단된 사용자',
    muted_until   DATETIME     NULL     COMMENT 'NULL = 영구 차단',
    reason        VARCHAR(255) NULL,
    muted_by      VARCHAR(64)  NOT NULL COMMENT '처리한 관리자',
    created_at    DATETIME     NOT NULL DEFAULT NOW(),
    UNIQUE KEY uk_room_user (room_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chat_attachment_archives (
    id            VARCHAR(64)  NOT NULL PRIMARY KEY,
    room_id       VARCHAR(64)  NOT NULL,
    period_start  DATE         NOT NULL COMMENT '보관 주차 시작일 (월요일)',
    period_end    DATE         NOT NULL COMMENT '보관 주차 종료일 (일요일)',
    zip_path      VARCHAR(512) NOT NULL COMMENT '서버 디스크상 ZIP 파일 경로',
    zip_size      BIGINT       NOT NULL,
    file_count    INT          NOT NULL,
    created_at    DATETIME     NOT NULL DEFAULT NOW(),
    expires_at    DATETIME     NOT NULL COMMENT '생성일 + 30일 (한 달 후 자동 삭제)',
    status        VARCHAR(16)  NOT NULL DEFAULT 'available' COMMENT 'available|purged',
    UNIQUE KEY uk_room_period (room_id, period_start),
    KEY idx_expires (expires_at, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- boards 테이블의 'board_community' row는 그대로 둠 (기존 게시글 보존).
-- 새 UI는 chat_messages 테이블을 사용하며 frontend의 chatMode 플래그로 분기.
