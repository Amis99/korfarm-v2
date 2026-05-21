-- ============================================================
-- V0151: 이메일 토큰 기반 비밀번호 재설정 (N-34, 2026-05-22)
-- ============================================================
-- 사용자가 비번 잊었을 때 /reset 에서 아이디(이메일) 입력 → 토큰 생성·이메일 발송 →
-- 사용자가 이메일 링크 클릭 → /reset/{token} 페이지에서 새 비번 입력 → 검증·갱신.
--
-- 토큰 1회 사용, 30분 만료. 기존 미사용 토큰은 새 요청 시 모두 만료.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(40) NOT NULL PRIMARY KEY,
    user_id VARCHAR(40) NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    request_ip VARCHAR(64) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_password_reset_tokens_token_hash (token_hash),
    KEY ix_password_reset_tokens_user_id (user_id),
    KEY ix_password_reset_tokens_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
