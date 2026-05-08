-- user_crops (랭킹 누적) 의 잔액을 user_crop_wallet (AI 결제용) 으로 동기화
-- adjustCrop 적립 시 wallet 도 함께 +되도록 코드를 수정한 시점부터 신규는 동기.
-- 이 마이그레이션은 그 이전에 user_crops 만 적립되어 wallet 이 0 인 사용자를 보정.

INSERT INTO user_crop_wallet (user_id, crop_type, balance, updated_at)
SELECT uc.user_id, uc.crop_type, uc.count, NOW()
FROM user_crops uc
WHERE uc.count > 0
ON DUPLICATE KEY UPDATE
  balance = GREATEST(user_crop_wallet.balance, VALUES(balance)),
  updated_at = NOW();
