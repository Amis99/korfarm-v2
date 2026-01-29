-- Add signup profile fields for students/parents.

ALTER TABLE users
  ADD COLUMN region VARCHAR(120),
  ADD COLUMN school VARCHAR(200),
  ADD COLUMN grade_label VARCHAR(32),
  ADD COLUMN level_id VARCHAR(64),
  ADD COLUMN student_phone VARCHAR(32),
  ADD COLUMN parent_phone VARCHAR(32),
  ADD COLUMN diagnostic_opt_in TINYINT(1) NOT NULL DEFAULT 0;
