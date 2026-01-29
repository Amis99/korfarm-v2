-- v1 database discovery helpers
-- Run against the v1 database to capture tables and columns.

-- Tables
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
ORDER BY table_name;

-- Columns
SELECT table_name, column_name, data_type, is_nullable, column_key, column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
ORDER BY table_name, ordinal_position;
