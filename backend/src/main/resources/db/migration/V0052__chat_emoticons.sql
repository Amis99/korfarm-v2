-- 채팅 이모티콘 라이브러리
--   관리자가 등록한 이모티콘 이미지들. 사용자가 채팅에서 선택해 메시지로 전송.
--   chat_messages.message_type='emoticon', content=emoticon_id 형태로 저장.

CREATE TABLE chat_emoticons (
    id          VARCHAR(64)  NOT NULL PRIMARY KEY,
    name        VARCHAR(120) NOT NULL COMMENT '관리자가 지정한 이름 (피커 툴팁용)',
    file_id     VARCHAR(64)  NOT NULL COMMENT '업로드된 이미지의 file_id (files.id 참조)',
    sort_order  INT          NOT NULL DEFAULT 0,
    status      VARCHAR(16)  NOT NULL DEFAULT 'active' COMMENT 'active|deleted',
    created_by  VARCHAR(64)  NOT NULL COMMENT '등록한 관리자 user_id',
    created_at  DATETIME     NOT NULL DEFAULT NOW(),
    KEY idx_status_order (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
