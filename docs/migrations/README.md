# Migration Order

Apply migrations in order:

1) `0001_init.sql` - base schema
2) `0002_seed.sql` - default seed data and system settings
3) `0003_constraints.sql` - foreign keys (after seed)
4) (optional) `0004_v1_to_v2.sql` - v1 data migration (not used when onboarding fresh users)
5) `0005_seed_shop_products.sql` - shop seed products
6) `0006_parent_student_links.sql` - parent-student links table
7) `0007_parent_student_link_requests.sql` - link request fields

Notes:
- Run `0003_constraints.sql` after data load to avoid FK conflicts during import.
- For large imports, batch inserts and keep transactions small.

## v1 discovery (optional)
- Only required if you migrate legacy data.
