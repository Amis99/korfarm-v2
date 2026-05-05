-- 개인 AI 사용용 작물 지갑 — Phase C
-- user_crops 는 랭킹 점수 계산용 (변환 누적, 차감 X)
-- user_crop_wallet 은 AI 사용용 — 작물 변환 시 +1, AI 사용 시 -1
-- 작물 환산: 모두 1:1 (작물 1개 = 자몽 1개)
CREATE TABLE user_crop_wallet (
  user_id VARCHAR(64) NOT NULL,
  crop_type VARCHAR(64) NOT NULL,
  balance INT NOT NULL DEFAULT 0,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (user_id, crop_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
