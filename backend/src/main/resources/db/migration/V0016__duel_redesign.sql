-- 대결 모드 재설계: 서버 체계 + 씨앗 베팅 + 방장 시작 시스템

-- 1. duel_rooms: mode_id 삭제, level_id→server_id, room_name 추가
ALTER TABLE duel_rooms DROP COLUMN mode_id;
ALTER TABLE duel_rooms CHANGE COLUMN level_id server_id VARCHAR(32) NOT NULL;
ALTER TABLE duel_rooms ADD COLUMN room_name VARCHAR(100) NOT NULL DEFAULT '' AFTER server_id;
ALTER TABLE duel_rooms MODIFY COLUMN room_size INT NOT NULL DEFAULT 10;
DROP INDEX idx_level ON duel_rooms;
DROP INDEX idx_level_status ON duel_rooms;
CREATE INDEX idx_server ON duel_rooms (server_id);
CREATE INDEX idx_server_status ON duel_rooms (server_id, status);

-- 2. duel_room_players: stake_crop_type 삭제, is_ready 추가
ALTER TABLE duel_room_players DROP COLUMN stake_crop_type;
ALTER TABLE duel_room_players ADD COLUMN is_ready TINYINT(1) NOT NULL DEFAULT 0 AFTER status;

-- 3. duel_matches: level_id→server_id, room_id/time_limit_sec 추가
ALTER TABLE duel_matches CHANGE COLUMN level_id server_id VARCHAR(32) NOT NULL;
ALTER TABLE duel_matches ADD COLUMN room_id VARCHAR(64) AFTER season_id;
ALTER TABLE duel_matches ADD COLUMN time_limit_sec INT NOT NULL DEFAULT 300 AFTER status;

-- 4. duel_match_players: stake_crop_type 삭제, correct_count/total_time_ms/reward_amount 추가
ALTER TABLE duel_match_players DROP COLUMN stake_crop_type;
ALTER TABLE duel_match_players ADD COLUMN correct_count INT NOT NULL DEFAULT 0 AFTER stake_amount;
ALTER TABLE duel_match_players ADD COLUMN total_time_ms BIGINT NOT NULL DEFAULT 0 AFTER correct_count;
ALTER TABLE duel_match_players ADD COLUMN reward_amount INT NOT NULL DEFAULT 0 AFTER total_time_ms;

-- 5. duel_answers: time_ms 추가
ALTER TABLE duel_answers ADD COLUMN time_ms BIGINT NOT NULL DEFAULT 0 AFTER is_correct;

-- 6. duel_escrow: crop_type→seed_type
ALTER TABLE duel_escrow CHANGE COLUMN crop_type seed_type VARCHAR(32) NOT NULL;

-- 7. duel_stats: level_id→server_id
ALTER TABLE duel_stats CHANGE COLUMN level_id server_id VARCHAR(32) NOT NULL;

-- 8. duel_question_pool 테이블 생성
CREATE TABLE duel_question_pool (
  id VARCHAR(64) PRIMARY KEY,
  server_id VARCHAR(32) NOT NULL,
  question_type VARCHAR(32) NOT NULL,
  category VARCHAR(32) NOT NULL,
  question_json JSON NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_server_type (server_id, question_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
