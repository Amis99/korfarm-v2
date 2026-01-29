-- MySQL 8.x schema draft for KOR Farm v2
-- IDs are string-based. Adjust sizes and indexes after load testing.

CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120),
  status VARCHAR(32) NOT NULL,
  last_login_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE orgs (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(32) NOT NULL,
  plan VARCHAR(32),
  seat_limit INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE org_memberships (
  id VARCHAR(64) PRIMARY KEY,
  org_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  role VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_org_user (org_id, user_id),
  KEY idx_org (org_id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE classes (
  id VARCHAR(64) PRIMARY KEY,
  org_id VARCHAR(64) NOT NULL,
  name VARCHAR(200) NOT NULL,
  level_id VARCHAR(64),
  grade VARCHAR(32),
  status VARCHAR(32) NOT NULL,
  start_at DATE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_org (org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE class_memberships (
  id VARCHAR(64) PRIMARY KEY,
  class_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_class_user (class_id, user_id),
  KEY idx_class (class_id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE refresh_tokens (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE parent_student_links (
  id VARCHAR(64) PRIMARY KEY,
  parent_user_id VARCHAR(64) NOT NULL,
  student_user_id VARCHAR(64) NOT NULL,
  request_code VARCHAR(16),
  requested_at DATETIME,
  approved_at DATETIME,
  approved_by VARCHAR(64),
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_parent_user (parent_user_id),
  KEY idx_student_user (student_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE contents (
  id VARCHAR(64) PRIMARY KEY,
  content_type VARCHAR(32) NOT NULL,
  level_id VARCHAR(64),
  chapter_id VARCHAR(64),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_content_lookup (content_type, level_id, chapter_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE content_versions (
  id VARCHAR(64) PRIMARY KEY,
  content_id VARCHAR(64) NOT NULL,
  schema_version VARCHAR(32) NOT NULL,
  content_json JSON NOT NULL,
  uploaded_by VARCHAR(64) NOT NULL,
  approved_by VARCHAR(64),
  approved_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_content_schema (content_id, schema_version),
  KEY idx_content (content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE learning_attempts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  content_id VARCHAR(64) NOT NULL,
  activity_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  score INT,
  started_at DATETIME,
  submitted_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_user (user_id),
  KEY idx_content (content_id),
  KEY idx_user_activity (user_id, activity_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE learning_answers (
  id VARCHAR(64) PRIMARY KEY,
  attempt_id VARCHAR(64) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  answer_json JSON,
  is_correct TINYINT(1),
  answered_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_attempt (attempt_id),
  KEY idx_attempt_question (attempt_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE writing_submissions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  prompt_id VARCHAR(64) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  submitted_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE writing_feedback (
  id VARCHAR(64) PRIMARY KEY,
  submission_id VARCHAR(64) NOT NULL,
  reviewer_id VARCHAR(64) NOT NULL,
  rubric_json JSON,
  comment TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_submission (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE test_papers (
  id VARCHAR(64) PRIMARY KEY,
  org_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  pdf_file_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_org (org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE test_answer_keys (
  id VARCHAR(64) PRIMARY KEY,
  test_id VARCHAR(64) NOT NULL,
  answers_json JSON NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_test (test_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE test_results (
  id VARCHAR(64) PRIMARY KEY,
  test_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  score INT NOT NULL,
  stats_json JSON,
  graded_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_test (test_id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE seed_catalog (
  seed_type VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  crop_type VARCHAR(64) NOT NULL,
  rarity VARCHAR(32) NOT NULL,
  season_point INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE area_seed_mapping (
  id VARCHAR(64) PRIMARY KEY,
  activity_type VARCHAR(32) NOT NULL,
  genre VARCHAR(64),
  subarea VARCHAR(64),
  seed_type VARCHAR(64) NOT NULL,
  UNIQUE KEY uk_area_seed (activity_type, genre, subarea),
  KEY idx_seed (seed_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE harvest_recipes (
  id VARCHAR(64) PRIMARY KEY,
  seed_required INT NOT NULL,
  fertilizer_spent INT NOT NULL,
  multiplier INT NOT NULL,
  max_crafts_per_day INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_seeds (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  seed_type VARCHAR(64) NOT NULL,
  count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_user_seed (user_id, seed_type),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_crops (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  crop_type VARCHAR(64) NOT NULL,
  count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_user_crop (user_id, crop_type),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_fertilizer (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE economy_ledger (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  currency_type VARCHAR(32) NOT NULL,
  item_type VARCHAR(64),
  delta INT NOT NULL,
  reason VARCHAR(128) NOT NULL,
  ref_type VARCHAR(64),
  ref_id VARCHAR(64),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_user (user_id),
  KEY idx_user_created (user_id, created_at),
  KEY idx_ref (ref_type, ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE seasons (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  level_id VARCHAR(64) NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_level (level_id),
  KEY idx_level_status (level_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE season_harvest_rankings (
  id VARCHAR(64) PRIMARY KEY,
  season_id VARCHAR(64) NOT NULL,
  level_id VARCHAR(64) NOT NULL,
  ranking_json JSON NOT NULL,
  generated_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_season (season_id),
  KEY idx_season_level (season_id, level_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE season_duel_rankings (
  id VARCHAR(64) PRIMARY KEY,
  season_id VARCHAR(64) NOT NULL,
  level_id VARCHAR(64) NOT NULL,
  ranking_json JSON NOT NULL,
  generated_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_season (season_id),
  KEY idx_season_level (season_id, level_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE season_award_snapshots (
  id VARCHAR(64) PRIMARY KEY,
  season_id VARCHAR(64) NOT NULL,
  snapshot_json JSON NOT NULL,
  captured_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_season (season_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE duel_rooms (
  id VARCHAR(64) PRIMARY KEY,
  mode_id VARCHAR(64) NOT NULL,
  level_id VARCHAR(64) NOT NULL,
  room_size INT NOT NULL,
  stake_amount INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_level (level_id),
  KEY idx_level_status (level_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE duel_room_players (
  id VARCHAR(64) PRIMARY KEY,
  room_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  stake_crop_type VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  joined_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_room_user (room_id, user_id),
  KEY idx_room (room_id),
  KEY idx_user (user_id),
  KEY idx_room_status (room_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE duel_matches (
  id VARCHAR(64) PRIMARY KEY,
  season_id VARCHAR(64) NOT NULL,
  level_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  started_at DATETIME,
  ended_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_season (season_id),
  KEY idx_season_level_status (season_id, level_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE duel_match_players (
  id VARCHAR(64) PRIMARY KEY,
  match_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  result VARCHAR(16) NOT NULL,
  rank INT,
  stake_crop_type VARCHAR(64) NOT NULL,
  stake_amount INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_match_user (match_id, user_id),
  KEY idx_match (match_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE duel_questions (
  id VARCHAR(64) PRIMARY KEY,
  match_id VARCHAR(64) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  order_index INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_match_order (match_id, order_index),
  KEY idx_match (match_id),
  KEY idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE duel_answers (
  id VARCHAR(64) PRIMARY KEY,
  match_id VARCHAR(64) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  answer_json JSON,
  is_correct TINYINT(1),
  submitted_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_match (match_id),
  KEY idx_user (user_id),
  KEY idx_match_question (match_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE duel_stats (
  id VARCHAR(64) PRIMARY KEY,
  season_id VARCHAR(64) NOT NULL,
  level_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  forfeit_losses INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_season_level_user (season_id, level_id, user_id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE duel_escrow (
  id VARCHAR(64) PRIMARY KEY,
  match_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  crop_type VARCHAR(64) NOT NULL,
  amount INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_match (match_id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE assignments (
  id VARCHAR(64) PRIMARY KEY,
  org_id VARCHAR(64) NOT NULL,
  assignment_type VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  payload_json JSON NOT NULL,
  due_at DATETIME,
  status VARCHAR(32) NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_org (org_id),
  KEY idx_org_status (org_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE assignment_targets (
  id VARCHAR(64) PRIMARY KEY,
  assignment_id VARCHAR(64) NOT NULL,
  target_type VARCHAR(16) NOT NULL,
  target_id VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_assignment (assignment_id),
  KEY idx_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE assignment_submissions (
  id VARCHAR(64) PRIMARY KEY,
  assignment_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  submitted_at DATETIME,
  content_json JSON,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_assignment_user (assignment_id, user_id),
  KEY idx_assignment (assignment_id),
  KEY idx_user (user_id),
  KEY idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE assignment_feedback (
  id VARCHAR(64) PRIMARY KEY,
  submission_id VARCHAR(64) NOT NULL,
  reviewer_id VARCHAR(64) NOT NULL,
  score INT,
  comment TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_submission (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE boards (
  id VARCHAR(64) PRIMARY KEY,
  board_type VARCHAR(32) NOT NULL,
  org_scope VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_board_scope (board_type, org_scope),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE posts (
  id VARCHAR(64) PRIMARY KEY,
  board_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_board (board_id),
  KEY idx_user (user_id),
  KEY idx_board_created (board_id, created_at),
  KEY idx_board_status (board_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE post_attachments (
  id VARCHAR(64) PRIMARY KEY,
  post_id VARCHAR(64) NOT NULL,
  file_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  mime VARCHAR(120) NOT NULL,
  size INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE post_reviews (
  id VARCHAR(64) PRIMARY KEY,
  post_id VARCHAR(64) NOT NULL,
  approved TINYINT(1) NOT NULL,
  reviewed_by VARCHAR(64),
  reviewed_at DATETIME,
  comment TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_post (post_id),
  KEY idx_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE comments (
  id VARCHAR(64) PRIMARY KEY,
  post_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_post (post_id),
  KEY idx_user (user_id),
  KEY idx_post_created (post_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reports (
  id VARCHAR(64) PRIMARY KEY,
  target_type VARCHAR(16) NOT NULL,
  target_id VARCHAR(64) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  processed_by VARCHAR(64),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price INT NOT NULL,
  stock INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE orders (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  total_amount INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_user (user_id),
  KEY idx_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  quantity INT NOT NULL,
  unit_price INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE shipments (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  address_json JSON NOT NULL,
  tracking_number VARCHAR(64),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payments (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  payment_type VARCHAR(32) NOT NULL,
  amount INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  provider VARCHAR(64) NOT NULL,
  provider_ref VARCHAR(128),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_user (user_id),
  KEY idx_status_created (status, created_at),
  KEY idx_type_status (payment_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  next_billing_at DATETIME,
  canceled_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_user (user_id),
  KEY idx_status_end (status, end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE files (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL,
  purpose VARCHAR(32) NOT NULL,
  url VARCHAR(1024) NOT NULL,
  mime VARCHAR(120) NOT NULL,
  size INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_owner (owner_id),
  KEY idx_purpose (purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE feature_flags (
  flag_key VARCHAR(128) PRIMARY KEY,
  enabled TINYINT(1) NOT NULL,
  rollout_percent INT NOT NULL DEFAULT 100,
  description VARCHAR(255),
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE system_settings (
  setting_key VARCHAR(128) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
