-- Align file size columns with BIGINT to match JPA Long mappings.

ALTER TABLE files
  MODIFY COLUMN size BIGINT NOT NULL;

ALTER TABLE post_attachments
  MODIFY COLUMN size BIGINT NOT NULL;
