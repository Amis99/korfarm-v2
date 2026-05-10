-- 대결 매치 참가자별 선택 베팅 씨앗 종류 보존
ALTER TABLE duel_match_players
  ADD COLUMN stake_seed_type VARCHAR(64) DEFAULT NULL AFTER stake_amount;
