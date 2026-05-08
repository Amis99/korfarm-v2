-- 프론트 SHOP_PRODUCTS (shopCatalog.js) 와 백엔드 products 테이블 동기화
-- 기존 V0005 의 prod_* 시드는 그대로 두고, 프론트 카탈로그의 6개 상품을 upsert.

INSERT INTO products (id, name, price, stock, status, created_at, updated_at) VALUES
  ('book_saussure_bundle',  '소쉬르 어휘 훈련 교재 세트', 29000, 200, 'active', NOW(), NOW()),
  ('book_frege_grammar',    '프레게 문법 집중 교재',      24000, 200, 'active', NOW(), NOW()),
  ('book_russell_reading',  '러셀 독해 전략 워크북',      27000, 200, 'active', NOW(), NOW()),
  ('book_wittgenstein_mock','비트겐슈타인 실전 모의고사', 32000, 200, 'active', NOW(), NOW()),
  ('tool_reading_board',    '독해 전략 보드 게임',         18000, 200, 'active', NOW(), NOW()),
  ('tool_omr_kit',          'OMR 답안 입력 키트',          15000, 200, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price = VALUES(price),
  stock = GREATEST(stock, VALUES(stock)),
  status = VALUES(status),
  updated_at = NOW();
