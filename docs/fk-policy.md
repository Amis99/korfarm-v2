### FK Policy

Default rules used in `docs/migrations/0003_constraints.sql`:

- ON UPDATE CASCADE for all foreign keys.
- ON DELETE CASCADE for dependent rows (memberships, attachments, items).
- ON DELETE RESTRICT for master data (users, orgs) and audit data (ledger, payments).
- ON DELETE SET NULL for optional reviewer references (approved_by, reviewed_by).

Adjust only if a deletion workflow is explicitly required.
