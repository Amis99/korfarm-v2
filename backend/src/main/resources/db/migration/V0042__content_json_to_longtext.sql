-- content_json 컬럼을 JSON → LONGTEXT로 변경
-- MySQL JSON 타입은 키를 알파벳순 정렬하여 원본 키 순서가 파괴됨
-- LONGTEXT는 원본 JSON 문자열을 그대로 보존
ALTER TABLE content_versions MODIFY content_json LONGTEXT NOT NULL;
