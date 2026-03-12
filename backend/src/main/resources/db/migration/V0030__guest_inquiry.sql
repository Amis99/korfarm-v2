-- 비회원 문의 지원: posts 테이블에 게스트 필드 추가
ALTER TABLE posts
  ADD COLUMN guest_name VARCHAR(50) NULL AFTER user_id,
  ADD COLUMN guest_contact VARCHAR(50) NULL AFTER guest_name,
  ADD COLUMN is_guest TINYINT(1) NOT NULL DEFAULT 0 AFTER guest_contact;

CREATE INDEX idx_posts_guest ON posts (is_guest, guest_name, guest_contact);
