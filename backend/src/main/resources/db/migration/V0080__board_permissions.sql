-- 게시판 권한 매트릭스 — 행위(view/write/comment+like) × 등급 최소 기준
--
-- 등급 서열 (낮음 → 높음):
--   FREE        : 무료 회원 (인증된 학생/학부모 포함, 구독 X)
--   PAID        : 유료 구독 (학생 본인 또는 자녀 구독을 통해 PARENT 도 PAID)
--   ORG_ADMIN   : 기관 관리자
--   HQ_ADMIN    : 본사 관리자
--
-- "최소 등급" 의미 — 컬럼 값 이상의 등급을 가진 사용자만 그 행위 허용.
-- 본사 관리자(HQ_ADMIN) 는 어떤 값이든 항상 통과.

ALTER TABLE boards
    ADD COLUMN view_min_role VARCHAR(16) NOT NULL DEFAULT 'FREE'
        COMMENT '열람 최소 등급 (FREE/PAID/ORG_ADMIN/HQ_ADMIN)' AFTER status,
    ADD COLUMN write_min_role VARCHAR(16) NOT NULL DEFAULT 'FREE'
        COMMENT '글쓰기 최소 등급' AFTER view_min_role,
    ADD COLUMN comment_min_role VARCHAR(16) NOT NULL DEFAULT 'FREE'
        COMMENT '댓글+좋아요 최소 등급' AFTER write_min_role;

-- 기존 hardcoded 정책을 컬럼으로 마이그레이션
-- materials: 관리자만 작성 (기존 BoardService 분기와 동일하게)
UPDATE boards SET write_min_role = 'HQ_ADMIN'
    WHERE board_type = 'materials';

-- inquiry/learning_request: 본인 글만 보는 비즈니스 로직은 코드에 유지.
-- 권한 컬럼은 기본값(FREE) 유지.

-- org_scope 는 더 이상 사용하지 않음.
-- 안전을 위해 즉시 DROP 하지 않고 컬럼만 NULL 허용으로 완화.
-- (향후 마이그레이션에서 완전 제거)
ALTER TABLE boards MODIFY COLUMN org_scope VARCHAR(16) NULL;
