-- 이모티콘 시리즈 분류 (중 시리즈 / 고양이 포도 시리즈 / 닥터 뵹 시리즈 등)
-- NULL 허용 (옛 데이터 호환). 어드민이 시리즈 입력하지 않아도 등록 가능.

ALTER TABLE chat_emoticons
  ADD COLUMN series VARCHAR(64) NULL AFTER name,
  ADD INDEX idx_emo_series (series, sort_order);
