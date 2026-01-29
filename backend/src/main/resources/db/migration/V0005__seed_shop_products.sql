-- Seed shop products

INSERT INTO products (id, name, price, stock, status, created_at, updated_at) VALUES
  ('prod_textbook_01', 'Korfarm Textbook Vol.1', 32000, 100, 'active', NOW(), NOW()),
  ('prod_workbook_01', 'Korfarm Workbook Vol.1', 18000, 150, 'active', NOW(), NOW()),
  ('prod_toolkit_01', 'Korfarm Learning Toolkit', 12000, 200, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price = VALUES(price),
  stock = VALUES(stock),
  status = VALUES(status),
  updated_at = NOW();

