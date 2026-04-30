-- 내용 숙지 콘텐츠 v2 — 영역/세부영역 + 원본 파일 보관 + 4유형 + 10대 역량 벡터
--
-- 권한·visibility(PUBLIC/ORG)는 V0046에서 이미 구현. 여기서는 데이터 모델만 확장.

-- ─────────────────────────────────────────────
-- 1. study_contents — 영역·세부영역·원본 파일 메타
-- ─────────────────────────────────────────────
-- area 의미 재정의: 'CONTENT'(옛) → 학습 영역 코드 (LIT/READ/GRAM/SPEAK/WRITE/MEDIA)
-- 기존 row 의 'CONTENT' 는 NULL 처리 (영역 미설정으로 표시)
ALTER TABLE study_contents
  MODIFY COLUMN area VARCHAR(32) NULL,
  ADD COLUMN sub_area VARCHAR(64) NULL AFTER area,
  ADD COLUMN source_type VARCHAR(16) NOT NULL DEFAULT 'manual' AFTER sub_area,
  ADD COLUMN source_file_url VARCHAR(512) NULL AFTER source_type,
  ADD COLUMN source_file_name VARCHAR(255) NULL AFTER source_file_url,
  ADD COLUMN source_file_hash VARCHAR(64) NULL AFTER source_file_name,
  ADD COLUMN source_file_size_bytes BIGINT NULL AFTER source_file_hash,
  ADD INDEX idx_sc_source_hash (source_file_hash),
  ADD INDEX idx_sc_area_sub (area, sub_area);

UPDATE study_contents SET area = NULL WHERE area = 'CONTENT';

-- ─────────────────────────────────────────────
-- 2. study_questions — 4유형(MULTI_CHOICE/OX/SHORT_ANSWER/ESSAY) + 10대 역량 벡터
-- ─────────────────────────────────────────────
-- competency_vector: 정답 시 누적될 가중치 {"역량명": 가중치}
-- wrong_vector:
--   MULTI_CHOICE/OX → 사용 안 함 (choices JSON 안에 각 선택지별 wrongVector 저장)
--   SHORT_ANSWER/ESSAY → 오답 시 마이너스로 누적될 가중치 {"역량명": 가중치}
ALTER TABLE study_questions
  ADD COLUMN competency_vector JSON NULL AFTER difficulty,
  ADD COLUMN wrong_vector JSON NULL AFTER competency_vector;
