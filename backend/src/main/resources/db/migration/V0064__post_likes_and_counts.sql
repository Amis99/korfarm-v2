-- 게시글 좋아요 테이블
CREATE TABLE IF NOT EXISTS post_likes (
    id        VARCHAR(36) NOT NULL PRIMARY KEY,
    post_id   VARCHAR(64) NOT NULL,
    user_id   VARCHAR(64) NOT NULL,
    created_at DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_post_user (post_id, user_id),
    INDEX idx_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- reports에 user_id 추가 (신고자 추적)
ALTER TABLE reports ADD COLUMN user_id VARCHAR(64) NULL AFTER target_id;
ALTER TABLE reports ADD INDEX idx_target (target_type, target_id);
