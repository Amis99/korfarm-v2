ALTER TABLE parent_student_links
  ADD COLUMN request_code VARCHAR(16),
  ADD COLUMN requested_at DATETIME,
  ADD COLUMN approved_at DATETIME,
  ADD COLUMN approved_by VARCHAR(64);
