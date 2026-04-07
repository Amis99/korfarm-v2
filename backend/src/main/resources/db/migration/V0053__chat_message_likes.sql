-- 채팅 메시지 좋아요
--   사용자가 메시지를 길게 터치/우클릭하면 좋아요 토글.
--   같은 사용자가 같은 메시지에 한 번만 좋아요 가능 (UNIQUE).

CREATE TABLE chat_message_likes (
    id          VARCHAR(64)  NOT NULL PRIMARY KEY,
    message_id  VARCHAR(64)  NOT NULL,
    user_id     VARCHAR(64)  NOT NULL,
    user_name   VARCHAR(120) NOT NULL COMMENT '발화 시점 닉네임 스냅샷',
    created_at  DATETIME     NOT NULL DEFAULT NOW(),
    UNIQUE KEY uk_msg_user (message_id, user_id),
    KEY idx_message (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
