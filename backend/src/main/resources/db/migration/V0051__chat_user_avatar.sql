-- 채팅 메시지에 발화 시점 사용자 프로필 이미지 URL 스냅샷 컬럼 추가
ALTER TABLE chat_messages
    ADD COLUMN user_avatar_url VARCHAR(1024) NULL COMMENT '발화 시점 프로필 이미지 URL 스냅샷';
