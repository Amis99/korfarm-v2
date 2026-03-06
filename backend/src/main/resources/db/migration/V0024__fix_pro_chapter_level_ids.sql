-- pro_chapters.level_id를 users.level_id 형식(소문자, 언더스코어 없음)으로 통일
UPDATE pro_chapters SET level_id = 'saussure1' WHERE level_id = 'SAUSSURE_1';
UPDATE pro_chapters SET level_id = 'saussure2' WHERE level_id = 'SAUSSURE_2';
UPDATE pro_chapters SET level_id = 'saussure3' WHERE level_id = 'SAUSSURE_3';
UPDATE pro_chapters SET level_id = 'frege1' WHERE level_id = 'FREGE_1';
UPDATE pro_chapters SET level_id = 'frege2' WHERE level_id = 'FREGE_2';
UPDATE pro_chapters SET level_id = 'frege3' WHERE level_id = 'FREGE_3';
UPDATE pro_chapters SET level_id = 'russell1' WHERE level_id = 'RUSSELL_1';
UPDATE pro_chapters SET level_id = 'russell2' WHERE level_id = 'RUSSELL_2';
UPDATE pro_chapters SET level_id = 'russell3' WHERE level_id = 'RUSSELL_3';
