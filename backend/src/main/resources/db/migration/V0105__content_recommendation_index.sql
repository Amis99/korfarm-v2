-- 추천용 콘텐츠 인덱스 — 매 추천마다 콘텐츠 payload 파싱하지 않고 SQL 한 번으로 끝나게
-- AI 비서·튜터 양쪽이 사용. 콘텐츠 저장·수정 시 자동 갱신.

CREATE TABLE IF NOT EXISTS content_recommendation_index (
  content_id VARCHAR(64) PRIMARY KEY,
  level_id VARCHAR(32),
  level_num INT,                  -- 1~12 (saussure1=1, witt3=12, 매핑 불가 시 NULL)
  content_kind VARCHAR(32),       -- 'farm' / 'pro' / 'daily_quiz' / 'study' / 'logic' / 'other'
  area VARCHAR(64),
  sub_area VARCHAR(64),

  -- 사전계산: 모든 questions 의 competencyVector 합산 (10대 역량)
  comp_lexical DOUBLE NOT NULL DEFAULT 0,         -- 어휘력
  comp_sentence DOUBLE NOT NULL DEFAULT 0,        -- 문장 독해력
  comp_structure DOUBLE NOT NULL DEFAULT 0,       -- 구조 독해력
  comp_logic DOUBLE NOT NULL DEFAULT 0,           -- 논리 사고력
  comp_grammar DOUBLE NOT NULL DEFAULT 0,         -- 어법·문법 능력
  comp_concept DOUBLE NOT NULL DEFAULT 0,         -- 국어 개념 적용 능력
  comp_korbg DOUBLE NOT NULL DEFAULT 0,           -- 국어 관련 배경지식
  comp_nonfic DOUBLE NOT NULL DEFAULT 0,          -- 비문학 배경지식
  comp_qanalysis DOUBLE NOT NULL DEFAULT 0,       -- 문제 분석 및 전략 수립 능력
  comp_canalysis DOUBLE NOT NULL DEFAULT 0,       -- 선택지 분석 및 전략 수립 능력

  classification_codes JSON,                      -- ["theme_xxx", "area_xxx", ...] 매핑된 코드 목록
  question_count INT NOT NULL DEFAULT 0,
  popularity DOUBLE NOT NULL DEFAULT 0,           -- 정답률·인기도 (선택)
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,

  KEY idx_kind_level (content_kind, level_num),
  KEY idx_area_level (area, sub_area, level_num),
  KEY idx_comp_lexical (comp_lexical),
  KEY idx_comp_sentence (comp_sentence),
  KEY idx_comp_structure (comp_structure),
  KEY idx_comp_logic (comp_logic),
  KEY idx_comp_grammar (comp_grammar),
  KEY idx_comp_concept (comp_concept),
  KEY idx_comp_korbg (comp_korbg),
  KEY idx_comp_nonfic (comp_nonfic),
  KEY idx_comp_qanalysis (comp_qanalysis),
  KEY idx_comp_canalysis (comp_canalysis)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
