-- Seed data for defaults

INSERT INTO seed_catalog (seed_type, name, crop_type, rarity, season_point) VALUES
  ('seed_wheat', 'wheat seed', 'crop_wheat', 'common', 1),
  ('seed_oat', 'oat seed', 'crop_oat', 'common', 1),
  ('seed_rice', 'rice seed', 'crop_rice', 'common', 1),
  ('seed_grape', 'grape seed', 'crop_grape', 'rare', 2)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  crop_type = VALUES(crop_type),
  rarity = VALUES(rarity),
  season_point = VALUES(season_point);

INSERT INTO area_seed_mapping (id, activity_type, genre, subarea, seed_type) VALUES
  ('asm_001', 'daily_reading', 'nonfiction', 'philosophy', 'seed_wheat'),
  ('asm_002', 'daily_reading', 'nonfiction', 'economics', 'seed_oat'),
  ('asm_003', 'daily_reading', 'literature', 'modern_poetry', 'seed_rice'),
  ('asm_004', 'daily_quiz', 'background_knowledge', 'information_technology', 'seed_grape')
ON DUPLICATE KEY UPDATE
  activity_type = VALUES(activity_type),
  genre = VALUES(genre),
  subarea = VALUES(subarea),
  seed_type = VALUES(seed_type);

INSERT INTO harvest_recipes (id, seed_required, fertilizer_spent, multiplier, max_crafts_per_day) VALUES
  ('hr_seed10', 10, 1, 3, 30)
ON DUPLICATE KEY UPDATE
  seed_required = VALUES(seed_required),
  fertilizer_spent = VALUES(fertilizer_spent),
  multiplier = VALUES(multiplier),
  max_crafts_per_day = VALUES(max_crafts_per_day);

INSERT INTO boards (id, board_type, org_scope, status, created_at, updated_at) VALUES
  ('board_learning_request', 'learning_request', 'public', 'active', NOW(), NOW()),
  ('board_community', 'community', 'public', 'active', NOW(), NOW()),
  ('board_qna', 'qna', 'public', 'active', NOW(), NOW()),
  ('board_materials', 'materials', 'public', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  board_type = VALUES(board_type),
  org_scope = VALUES(org_scope),
  status = VALUES(status),
  updated_at = NOW();

INSERT INTO feature_flags (flag_key, enabled, rollout_percent, description, updated_at) VALUES
  ('feature.free.daily_quiz', 1, 100, 'daily quiz', NOW()),
  ('feature.free.daily_reading', 1, 100, 'daily reading', NOW()),
  ('feature.economy.harvest', 1, 100, 'harvest craft', NOW()),
  ('feature.season.ranking', 1, 100, 'season rankings', NOW()),
  ('feature.season.awards', 1, 100, 'season awards', NOW()),
  ('feature.community.learning_request', 1, 100, 'learning request board', NOW()),
  ('feature.community.community_board', 1, 100, 'community board', NOW()),
  ('feature.community.qna', 1, 100, 'qna board', NOW()),
  ('feature.community.materials', 1, 100, 'learning materials board', NOW()),
  ('feature.admin.console', 1, 100, 'admin console', NOW()),
  ('feature.duel.mode', 0, 0, 'duel mode', NOW()),
  ('feature.duel.ratings', 0, 0, 'rating matchmaking', NOW()),
  ('feature.duel.cheat_detection', 0, 0, 'cheat detection', NOW()),
  ('feature.paid.pro_mode', 0, 0, 'pro mode', NOW()),
  ('feature.paid.farm_mode', 0, 0, 'farm modes', NOW()),
  ('feature.paid.writing', 0, 0, 'writing', NOW()),
  ('feature.paid.test_bank', 0, 0, 'test bank', NOW()),
  ('feature.paid.harvest_ledger', 1, 100, 'harvest ledger', NOW()),
  ('feature.paid.assignment_basket', 0, 0, 'assignment basket', NOW()),
  ('feature.shop.mall', 0, 0, 'shop mall', NOW()),
  ('feature.payments.subscription', 0, 0, 'subscription payment', NOW()),
  ('feature.payments.shop', 0, 0, 'shop payment', NOW()),
  ('feature.uploads', 0, 0, 'file uploads', NOW()),
  ('ops.kill_switch.duel', 0, 0, 'kill duel', NOW()),
  ('ops.kill_switch.payments', 0, 0, 'kill payments', NOW()),
  ('ops.kill_switch.uploads', 0, 0, 'kill uploads', NOW())
ON DUPLICATE KEY UPDATE
  enabled = VALUES(enabled),
  rollout_percent = VALUES(rollout_percent),
  description = VALUES(description),
  updated_at = NOW();

INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES
  ('timezone', 'Asia/Seoul', NOW()),
  ('season.default_length_months', '1', NOW()),
  ('duel.rating.enabled', 'true', NOW()),
  ('duel.queue.timeout_seconds', '60', NOW()),
  ('duel.question_time_limit_seconds', '12', NOW()),
  ('duel.disconnect_grace_seconds', '20', NOW()),
  ('duel.stake.min_amount', '1', NOW()),
  ('duel.stake.max_amount', '20', NOW()),
  ('duel.fee_rate', '0.0', NOW()),
  ('duel.leaderboard.min_matches_for_win_rate', '20', NOW()),
  ('harvest.recipe.seed_required', '10', NOW()),
  ('harvest.recipe.fertilizer_spent', '1', NOW()),
  ('harvest.recipe.multiplier', '3', NOW()),
  ('harvest.max_crafts_per_day', '30', NOW()),
  ('seed.reward.daily.count', '2', NOW()),
  ('seed.reward.daily.grant_once', 'true', NOW()),
  ('payment.subscription.period', 'month', NOW())
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  updated_at = NOW();

INSERT INTO seasons (id, name, level_id, start_at, end_at, status, created_at, updated_at) VALUES
  ('season_default', 'Default Season', 'frege1', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  level_id = VALUES(level_id),
  start_at = VALUES(start_at),
  end_at = VALUES(end_at),
  status = VALUES(status),
  updated_at = NOW();
