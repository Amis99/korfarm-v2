-- 내용 숙지 문제 보강:
--   1) 객관식·서술형의 <보기> / <조건> 본문 (테스트 비주얼 에디터와 동일 패턴)
--   2) 단답형 오답 음절 풀 (어드민 입력 또는 AI 생성, 중복 금지)
--   3) 서술형 빈칸 다수화 — fillBlanks 스키마는 그대로 두되 각 항목에 choices 배열 추가 (애플리케이션 처리)

ALTER TABLE study_questions
  ADD COLUMN box_content MEDIUMTEXT NULL AFTER stem,
  ADD COLUMN condition_content TEXT NULL AFTER box_content,
  ADD COLUMN distractor_syllables JSON NULL AFTER fill_blanks;
