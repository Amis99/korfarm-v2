-- Foreign key constraints (add after initial schema)
-- Policy:
-- - ON UPDATE CASCADE for all FKs.
-- - ON DELETE CASCADE for dependent rows (membership, attachments, items).
-- - ON DELETE RESTRICT for master data (users, orgs) and audit data.
-- - ON DELETE SET NULL for optional reviewer references.

ALTER TABLE org_memberships
  ADD CONSTRAINT fk_org_memberships_org
    FOREIGN KEY (org_id) REFERENCES orgs (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_org_memberships_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE classes
  ADD CONSTRAINT fk_classes_org
    FOREIGN KEY (org_id) REFERENCES orgs (id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE class_memberships
  ADD CONSTRAINT fk_class_memberships_class
    FOREIGN KEY (class_id) REFERENCES classes (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_class_memberships_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE refresh_tokens
  ADD CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE content_versions
  ADD CONSTRAINT fk_content_versions_content
    FOREIGN KEY (content_id) REFERENCES contents (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_content_versions_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_content_versions_approved_by
    FOREIGN KEY (approved_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE learning_attempts
  ADD CONSTRAINT fk_learning_attempts_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_learning_attempts_content
    FOREIGN KEY (content_id) REFERENCES contents (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE learning_answers
  ADD CONSTRAINT fk_learning_answers_attempt
    FOREIGN KEY (attempt_id) REFERENCES learning_attempts (id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE writing_submissions
  ADD CONSTRAINT fk_writing_submissions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE writing_feedback
  ADD CONSTRAINT fk_writing_feedback_submission
    FOREIGN KEY (submission_id) REFERENCES writing_submissions (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_writing_feedback_reviewer
    FOREIGN KEY (reviewer_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE test_papers
  ADD CONSTRAINT fk_test_papers_org
    FOREIGN KEY (org_id) REFERENCES orgs (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE test_answer_keys
  ADD CONSTRAINT fk_test_answer_keys_test
    FOREIGN KEY (test_id) REFERENCES test_papers (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_test_answer_keys_creator
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE test_results
  ADD CONSTRAINT fk_test_results_test
    FOREIGN KEY (test_id) REFERENCES test_papers (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_test_results_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE user_seeds
  ADD CONSTRAINT fk_user_seeds_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_user_seeds_seed
    FOREIGN KEY (seed_type) REFERENCES seed_catalog (seed_type)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE user_crops
  ADD CONSTRAINT fk_user_crops_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE user_fertilizer
  ADD CONSTRAINT fk_user_fertilizer_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE economy_ledger
  ADD CONSTRAINT fk_economy_ledger_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE duel_rooms
  ADD CONSTRAINT fk_duel_rooms_creator
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE duel_room_players
  ADD CONSTRAINT fk_duel_room_players_room
    FOREIGN KEY (room_id) REFERENCES duel_rooms (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_duel_room_players_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE duel_matches
  ADD CONSTRAINT fk_duel_matches_season
    FOREIGN KEY (season_id) REFERENCES seasons (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE duel_match_players
  ADD CONSTRAINT fk_duel_match_players_match
    FOREIGN KEY (match_id) REFERENCES duel_matches (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_duel_match_players_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE duel_questions
  ADD CONSTRAINT fk_duel_questions_match
    FOREIGN KEY (match_id) REFERENCES duel_matches (id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE duel_answers
  ADD CONSTRAINT fk_duel_answers_match
    FOREIGN KEY (match_id) REFERENCES duel_matches (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_duel_answers_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE duel_stats
  ADD CONSTRAINT fk_duel_stats_season
    FOREIGN KEY (season_id) REFERENCES seasons (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_duel_stats_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE duel_escrow
  ADD CONSTRAINT fk_duel_escrow_match
    FOREIGN KEY (match_id) REFERENCES duel_matches (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_duel_escrow_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE assignments
  ADD CONSTRAINT fk_assignments_org
    FOREIGN KEY (org_id) REFERENCES orgs (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_assignments_creator
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE assignment_targets
  ADD CONSTRAINT fk_assignment_targets_assignment
    FOREIGN KEY (assignment_id) REFERENCES assignments (id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE assignment_submissions
  ADD CONSTRAINT fk_assignment_submissions_assignment
    FOREIGN KEY (assignment_id) REFERENCES assignments (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_assignment_submissions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE assignment_feedback
  ADD CONSTRAINT fk_assignment_feedback_submission
    FOREIGN KEY (submission_id) REFERENCES assignment_submissions (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_assignment_feedback_reviewer
    FOREIGN KEY (reviewer_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE posts
  ADD CONSTRAINT fk_posts_board
    FOREIGN KEY (board_id) REFERENCES boards (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_posts_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE post_attachments
  ADD CONSTRAINT fk_post_attachments_post
    FOREIGN KEY (post_id) REFERENCES posts (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_post_attachments_file
    FOREIGN KEY (file_id) REFERENCES files (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE post_reviews
  ADD CONSTRAINT fk_post_reviews_post
    FOREIGN KEY (post_id) REFERENCES posts (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_post_reviews_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE comments
  ADD CONSTRAINT fk_comments_post
    FOREIGN KEY (post_id) REFERENCES posts (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE orders
  ADD CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE shipments
  ADD CONSTRAINT fk_shipments_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE payments
  ADD CONSTRAINT fk_payments_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE subscriptions
  ADD CONSTRAINT fk_subscriptions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE files
  ADD CONSTRAINT fk_files_owner
    FOREIGN KEY (owner_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;
