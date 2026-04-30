-- 학습 개념 시드 (영역별 강조 가능 개념). 어드민이 추후 추가·수정 가능.
-- 객관식 지침서 §8 (영역별 출제 주의사항) 및 일반 국어 교육과정 핵심 개념 기반.

-- 문학 (LIT)
INSERT IGNORE INTO learning_concepts (id, area, sub_area, name, description, display_order) VALUES
  ('lc_lit_metaphor',    'LIT', NULL,                  '비유',                '직유·은유 등 비유 표현', 10),
  ('lc_lit_personify',   'LIT', NULL,                  '의인화',              '사물/추상 개념을 인격화', 20),
  ('lc_lit_inversion',   'LIT', NULL,                  '도치',                '문장 성분 순서 바꾸기', 30),
  ('lc_lit_parallel',    'LIT', NULL,                  '대구',                '구조·의미가 비슷한 구절 짝짓기', 40),
  ('lc_lit_repetition',  'LIT', NULL,                  '반복',                '시어·구절·후렴의 반복', 50),
  ('lc_lit_imagery',     'LIT', NULL,                  '시각·청각 심상',      '감각적 이미지 형상화', 60),
  ('lc_lit_emotion',     'LIT', 'LIT_MODERN_POETRY',   '정서·정조',           '시적 화자의 정서 변화', 70),
  ('lc_lit_objcorr',     'LIT', 'LIT_MODERN_POETRY',   '객관적 상관물',       '화자의 정서를 매개하는 자연물', 80),
  ('lc_lit_empathy',     'LIT', 'LIT_MODERN_POETRY',   '감정이입',            '대상에 화자 감정 투영', 90),
  ('lc_lit_conflict',    'LIT', 'LIT_MODERN_NOVEL',    '갈등 구조',           '인물 간·내면·외부 갈등', 100),
  ('lc_lit_pov',         'LIT', 'LIT_MODERN_NOVEL',    '서술자·시점',         '1인칭/3인칭 등 시점', 110),
  ('lc_lit_character',   'LIT', 'LIT_MODERN_NOVEL',    '인물 형상화',         '인물의 성격·심리 묘사', 120),
  ('lc_lit_climax',      'LIT', 'LIT_MODERN_NOVEL',    '점층·반전',           '점진 강조 / 의외 전환', 130),
  ('lc_lit_classical_form', 'LIT', 'LIT_CLASSIC_POETRY', '고전 갈래·형식', '시조·가사·향가 등 갈래', 140),
  ('lc_lit_classical_theme', 'LIT', 'LIT_CLASSIC_PROSE', '연군·자연 친화', '고전 산문 핵심 주제', 150);

-- 독서 (READ)
INSERT IGNORE INTO learning_concepts (id, area, sub_area, name, description, display_order) VALUES
  ('lc_read_thesis',     'READ', NULL,                  '주제·중심 내용',     '글 전체의 주장/요지', 10),
  ('lc_read_structure',  'READ', NULL,                  '글의 구조·전개',     '서론-본론-결론, 비교/대조 등', 20),
  ('lc_read_inference',  'READ', NULL,                  '추론',                '본문 단서로 결론 도출', 30),
  ('lc_read_causation',  'READ', NULL,                  '인과 관계',          '원인-결과 연결', 40),
  ('lc_read_correlation', 'READ', NULL,                 '상관관계',           '변수 간 비례·반비례', 50),
  ('lc_read_compare',    'READ', NULL,                  '비교·대조',          '두 대상의 공통/차이', 60),
  ('lc_read_argument',   'READ', 'READ_HUMANITIES',     '관점·입장',          '학자/이론별 입장 비교', 70),
  ('lc_read_society',    'READ', 'READ_SOCIETY',        '주체·객체',          '매수인/매도인, 채권자/채무자 등', 80),
  ('lc_read_scitech',    'READ', 'READ_SCI_TECH',       '수치·방향',          '증가/감소·비례 관계 함정', 90),
  ('lc_read_application', 'READ', NULL,                 '구체 사례 적용',     '<보기> 활용 사례 적용', 100);

-- 문법 (GRAM)
INSERT IGNORE INTO learning_concepts (id, area, sub_area, name, description, display_order) VALUES
  ('lc_gram_phon_rule',  'GRAM', 'GRAM_PHONOLOGY',      '음운 변동',          '교체·축약·탈락·첨가', 10),
  ('lc_gram_phon_endsound', 'GRAM', 'GRAM_PHONOLOGY',   '음절 끝소리 규칙',  '7대표음 처리', 20),
  ('lc_gram_phon_assim', 'GRAM', 'GRAM_PHONOLOGY',      '자음 동화',          '비음화·유음화', 30),
  ('lc_gram_word_form',  'GRAM', 'GRAM_WORD',           '단어 형성',          '합성어/파생어', 40),
  ('lc_gram_word_pos',   'GRAM', 'GRAM_WORD',           '품사·기능',          '체언·용언·수식언 등', 50),
  ('lc_gram_word_morph', 'GRAM', 'GRAM_WORD',           '형태소 분석',        '실질/형식, 자립/의존', 60),
  ('lc_gram_sent_compo', 'GRAM', 'GRAM_SENTENCE',       '문장 성분',          '주성분·부속·독립', 70),
  ('lc_gram_sent_modal', 'GRAM', 'GRAM_SENTENCE',       '문법 요소',          '시제·높임·피동·사동', 80),
  ('lc_gram_meaning',    'GRAM', 'GRAM_DISCOURSE',      '의미 관계',          '동의·반의·상하 관계', 90),
  ('lc_gram_history',    'GRAM', 'GRAM_HISTORY',        '국어사',             '음운·표기 변천사', 100);

-- 화법 (SPEAK)
INSERT IGNORE INTO learning_concepts (id, area, sub_area, name, description, display_order) VALUES
  ('lc_speak_intent',    'SPEAK', 'SPEAK_GENERAL',      '발화 의도',          '정보 전달·설득·친교 등', 10),
  ('lc_speak_principle', 'SPEAK', 'SPEAK_GENERAL',      '협력 원리',          '양·질·관련성·태도 격률', 20),
  ('lc_speak_listen',    'SPEAK', 'SPEAK_GENERAL',      '공감적 듣기',        '감정 반영·재진술', 30),
  ('lc_speak_strategy',  'SPEAK', 'SPEAK_GENERAL',      '말하기 전략',        '청자 분석·목적 달성 전략', 40);

-- 작문 (WRITE)
INSERT IGNORE INTO learning_concepts (id, area, sub_area, name, description, display_order) VALUES
  ('lc_write_plan',      'WRITE', 'WRITE_GENERAL',      '글쓰기 계획',        '주제·독자·목적 설정', 10),
  ('lc_write_organize',  'WRITE', 'WRITE_GENERAL',      '내용 조직',          '서론·본론·결론 구성', 20),
  ('lc_write_express',   'WRITE', 'WRITE_GENERAL',      '표현 전략',          '문장·어휘 선택', 30),
  ('lc_write_sources',   'WRITE', 'WRITE_GENERAL',      '자료 활용',          '적합성·신뢰성·구체성', 40),
  ('lc_write_revise',    'WRITE', 'WRITE_GENERAL',      '고쳐쓰기',           '문장 수정·재구성', 50),
  ('lc_write_condition', 'WRITE', 'WRITE_GENERAL',      '조건 충족',          '자수·키워드·표현법 명시', 60);

-- 매체 (MEDIA)
INSERT IGNORE INTO learning_concepts (id, area, sub_area, name, description, display_order) VALUES
  ('lc_media_symbol',    'MEDIA', 'MEDIA_LANGUAGE',     '시나리오 약호',      'S#·F.I·F.O·DIS·O.L 등', 10),
  ('lc_media_distance',  'MEDIA', 'MEDIA_LANGUAGE',     '카메라 거리감',      'C.U·B.S·F.S·E.L.S 등', 20),
  ('lc_media_transform', 'MEDIA', 'MEDIA_LANGUAGE',     '매체 변환',          '소설→시나리오·뉴스→SNS', 30),
  ('lc_media_response',  'MEDIA', 'MEDIA_LANGUAGE',     '시청자 반응',        '매체 수용자 분석', 40);
