-- 씨앗 보상 시스템 재설계
-- seed_oat 삭제, seed_corn/seed_apple 추가

-- 1. seed_oat 보유 사용자의 씨앗을 seed_wheat로 통합
UPDATE user_seeds us1
SET us1.count = us1.count + COALESCE(
    (SELECT us2.count FROM (SELECT * FROM user_seeds) us2
     WHERE us2.user_id = us1.user_id AND us2.seed_type = 'seed_oat'), 0
)
WHERE us1.seed_type = 'seed_wheat'
AND EXISTS (
    SELECT 1 FROM (SELECT * FROM user_seeds) us3
    WHERE us3.user_id = us1.user_id AND us3.seed_type = 'seed_oat'
);

-- 2. seed_wheat가 없는 사용자의 seed_oat를 seed_wheat로 변환
UPDATE user_seeds
SET seed_type = 'seed_wheat'
WHERE seed_type = 'seed_oat'
AND user_id NOT IN (
    SELECT user_id FROM (
        SELECT user_id FROM user_seeds WHERE seed_type = 'seed_wheat'
    ) AS wheat_users
);

-- 3. 이미 통합된 seed_oat 레코드 삭제
DELETE FROM user_seeds WHERE seed_type = 'seed_oat';

-- 4. 원장(ledger)에서 seed_oat 참조를 seed_wheat로 변환
UPDATE economy_ledger
SET item_type = 'seed_wheat'
WHERE item_type = 'seed_oat';

-- 5. area_seed_mapping에서 seed_oat 참조를 seed_wheat로 변환
UPDATE area_seed_mapping
SET seed_type = 'seed_wheat'
WHERE seed_type = 'seed_oat';

-- 6. seed_catalog에서 seed_oat 삭제
DELETE FROM seed_catalog WHERE seed_type = 'seed_oat';

-- 7. 새로운 씨앗 타입 추가 (seed_corn, seed_apple)
INSERT INTO seed_catalog (seed_type, name, crop_type, rarity, season_point) VALUES
  ('seed_corn', 'corn seed', 'crop_corn', 'common', 1),
  ('seed_apple', 'apple seed', 'crop_apple', 'rare', 2)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  crop_type = VALUES(crop_type),
  rarity = VALUES(rarity),
  season_point = VALUES(season_point);
