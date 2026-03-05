-- 대결 문제 선택지에서 불필요한 ' 등' 접미사 제거
-- 예: {"id":"A","text":"어떤 내용 등"} → {"id":"A","text":"어떤 내용"}
UPDATE duel_question_pool
SET question_json = REPLACE(question_json, ' 등"}', '"}'),
    updated_at = NOW()
WHERE question_json LIKE '% 등"}%';
