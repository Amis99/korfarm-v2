-- 대결 모드: 플레이어가 선택한 베팅 씨앗 종류 저장
ALTER TABLE duel_room_players
  ADD COLUMN stake_seed_type VARCHAR(64) DEFAULT NULL;
