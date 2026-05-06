-- 콘텐츠 분류 마스터 + 매핑 테이블 — v3 카탈로그
-- docs/콘텐츠_분류_카탈로그_v3.md 와 1:1 매칭

CREATE TABLE classification_master (
  code VARCHAR(64) PRIMARY KEY,
  type VARCHAR(16) NOT NULL,            -- 'area' / 'sub_area' / 'theme'
  parent_code VARCHAR(64) DEFAULT NULL,
  label_ko VARCHAR(128) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  KEY idx_type_parent (type, parent_code, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 콘텐츠 ↔ 분류 다대다 (복수 지정)
CREATE TABLE content_classifications (
  content_id VARCHAR(64) NOT NULL,
  classification_code VARCHAR(64) NOT NULL,
  classification_type VARCHAR(16) NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (content_id, classification_code),
  KEY idx_code (classification_code, classification_type),
  KEY idx_content_type (content_id, classification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 시험 문항 ↔ 분류 다대다 (test_questions 가 콘텐츠와 별도라 별도 매핑)
CREATE TABLE test_question_classifications (
  question_id VARCHAR(255) NOT NULL,
  classification_code VARCHAR(64) NOT NULL,
  classification_type VARCHAR(16) NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (question_id, classification_code),
  KEY idx_code (classification_code, classification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── SEED: 영역 6개 ──────────────────────────────────────
INSERT INTO classification_master (code, type, parent_code, label_ko, sort_order, active, created_at, updated_at) VALUES
('READ', 'area', NULL, '독서 (비문학)', 10, 1, NOW(6), NOW(6)),
('LIT', 'area', NULL, '문학', 20, 1, NOW(6), NOW(6)),
('GRAM', 'area', NULL, '문법', 30, 1, NOW(6), NOW(6)),
('SPEAK', 'area', NULL, '화법', 40, 1, NOW(6), NOW(6)),
('WRITE', 'area', NULL, '작문', 50, 1, NOW(6), NOW(6)),
('MEDIA', 'area', NULL, '매체', 60, 1, NOW(6), NOW(6));

-- ─── SEED: 세부영역 37개 ─────────────────────────────────
INSERT INTO classification_master (code, type, parent_code, label_ko, sort_order, active, created_at, updated_at) VALUES
-- READ 6
('READ_HUMANITIES','sub_area','READ','인문',10,1,NOW(6),NOW(6)),
('READ_SOCIETY','sub_area','READ','사회',20,1,NOW(6),NOW(6)),
('READ_SCIENCE','sub_area','READ','과학',30,1,NOW(6),NOW(6)),
('READ_TECH','sub_area','READ','기술',40,1,NOW(6),NOW(6)),
('READ_ART','sub_area','READ','예술',50,1,NOW(6),NOW(6)),
('READ_ETC','sub_area','READ','기타',90,1,NOW(6),NOW(6)),
-- LIT 6
('LIT_MODERN_POETRY','sub_area','LIT','현대시',10,1,NOW(6),NOW(6)),
('LIT_CLASSIC_POETRY','sub_area','LIT','고전시가',20,1,NOW(6),NOW(6)),
('LIT_MODERN_NOVEL','sub_area','LIT','현대소설',30,1,NOW(6),NOW(6)),
('LIT_CLASSIC_PROSE','sub_area','LIT','고전산문',40,1,NOW(6),NOW(6)),
('LIT_ESSAY','sub_area','LIT','수필',50,1,NOW(6),NOW(6)),
('LIT_DRAMA','sub_area','LIT','극',60,1,NOW(6),NOW(6)),
-- GRAM 5
('GRAM_PHONOLOGY','sub_area','GRAM','음운',10,1,NOW(6),NOW(6)),
('GRAM_WORD','sub_area','GRAM','단어',20,1,NOW(6),NOW(6)),
('GRAM_SENTENCE','sub_area','GRAM','문장',30,1,NOW(6),NOW(6)),
('GRAM_DISCOURSE','sub_area','GRAM','담화',40,1,NOW(6),NOW(6)),
('GRAM_HISTORY','sub_area','GRAM','국어사',50,1,NOW(6),NOW(6)),
-- SPEAK 6
('SPEAK_PRESENT','sub_area','SPEAK','발표/강연',10,1,NOW(6),NOW(6)),
('SPEAK_DEBATE','sub_area','SPEAK','토론',20,1,NOW(6),NOW(6)),
('SPEAK_DISCUSS','sub_area','SPEAK','토의',30,1,NOW(6),NOW(6)),
('SPEAK_NEGOTIATE','sub_area','SPEAK','협상',40,1,NOW(6),NOW(6)),
('SPEAK_INTERVIEW','sub_area','SPEAK','대담',50,1,NOW(6),NOW(6)),
('SPEAK_ETC','sub_area','SPEAK','기타',90,1,NOW(6),NOW(6)),
-- WRITE 7
('WRITE_PROPOSAL','sub_area','WRITE','건의문',10,1,NOW(6),NOW(6)),
('WRITE_ARGUMENT','sub_area','WRITE','논설문',20,1,NOW(6),NOW(6)),
('WRITE_REPORT','sub_area','WRITE','보고서',30,1,NOW(6),NOW(6)),
('WRITE_LIFE','sub_area','WRITE','생활문',40,1,NOW(6),NOW(6)),
('WRITE_EXPLAIN','sub_area','WRITE','설명문',50,1,NOW(6),NOW(6)),
('WRITE_REVIEW','sub_area','WRITE','비평/감상문',60,1,NOW(6),NOW(6)),
('WRITE_ETC','sub_area','WRITE','기타',90,1,NOW(6),NOW(6)),
-- MEDIA 7
('MEDIA_PRINT','sub_area','MEDIA','인쇄 매체 (신문/잡지)',10,1,NOW(6),NOW(6)),
('MEDIA_BROADCAST','sub_area','MEDIA','방송/영상 매체',20,1,NOW(6),NOW(6)),
('MEDIA_INTERNET','sub_area','MEDIA','인터넷/소셜 매체',30,1,NOW(6),NOW(6)),
('MEDIA_AD','sub_area','MEDIA','광고',40,1,NOW(6),NOW(6)),
('MEDIA_DIGITAL','sub_area','MEDIA','디지털/뉴미디어',50,1,NOW(6),NOW(6)),
('MEDIA_CONVERGENCE','sub_area','MEDIA','융합 매체',60,1,NOW(6),NOW(6)),
('MEDIA_ETC','sub_area','MEDIA','기타',90,1,NOW(6),NOW(6));

-- ─── SEED: 주제 (theme) ─────────────────────────────────
-- 인문 32
INSERT INTO classification_master (code, type, parent_code, label_ko, sort_order, active, created_at, updated_at) VALUES
-- 동양사상 5
('READ_HUM_E_HUNDRED','theme','READ_HUMANITIES','제자백가',10,1,NOW(6),NOW(6)),
('READ_HUM_E_CONFUCIAN','theme','READ_HUMANITIES','유학 (공·맹·순)',11,1,NOW(6),NOW(6)),
('READ_HUM_E_NEOCONFUCIAN','theme','READ_HUMANITIES','성리학 (주자학·이기론)',12,1,NOW(6),NOW(6)),
('READ_HUM_E_YANGMING','theme','READ_HUMANITIES','양명학',13,1,NOW(6),NOW(6)),
('READ_HUM_E_OTHER','theme','READ_HUMANITIES','기타 동양사상',14,1,NOW(6),NOW(6)),
-- 한국사상 4
('READ_HUM_K_SILHAK','theme','READ_HUMANITIES','조선 실학',20,1,NOW(6),NOW(6)),
('READ_HUM_K_DONGHAK','theme','READ_HUMANITIES','동학·근대 한국사상',21,1,NOW(6),NOW(6)),
('READ_HUM_K_MODERN','theme','READ_HUMANITIES','한국 근현대 사상',22,1,NOW(6),NOW(6)),
('READ_HUM_K_OTHER','theme','READ_HUMANITIES','기타 한국사상',23,1,NOW(6),NOW(6)),
-- 서양철학 8
('READ_HUM_W_EPISTEM','theme','READ_HUMANITIES','인식론',30,1,NOW(6),NOW(6)),
('READ_HUM_W_ONTOL','theme','READ_HUMANITIES','존재론·형이상학',31,1,NOW(6),NOW(6)),
('READ_HUM_W_ETHICS','theme','READ_HUMANITIES','윤리학·가치론',32,1,NOW(6),NOW(6)),
('READ_HUM_W_POLITICS','theme','READ_HUMANITIES','정치·사회철학',33,1,NOW(6),NOW(6)),
('READ_HUM_W_AESTHETIC','theme','READ_HUMANITIES','미학·예술철학',34,1,NOW(6),NOW(6)),
('READ_HUM_W_LOGIC','theme','READ_HUMANITIES','논리학·과학철학',35,1,NOW(6),NOW(6)),
('READ_HUM_W_LANG','theme','READ_HUMANITIES','언어·종교철학',36,1,NOW(6),NOW(6)),
('READ_HUM_W_OTHER','theme','READ_HUMANITIES','기타 서양철학',37,1,NOW(6),NOW(6)),
-- 한국사 5
('READ_HUM_KH_POLITICS','theme','READ_HUMANITIES','한국 정치사',40,1,NOW(6),NOW(6)),
('READ_HUM_KH_ECONOMY','theme','READ_HUMANITIES','한국 경제사',41,1,NOW(6),NOW(6)),
('READ_HUM_KH_THOUGHT','theme','READ_HUMANITIES','한국 사상사',42,1,NOW(6),NOW(6)),
('READ_HUM_KH_CULTURE','theme','READ_HUMANITIES','한국 문화·예술사',43,1,NOW(6),NOW(6)),
('READ_HUM_KH_LIFE','theme','READ_HUMANITIES','한국 생활·풍속사',44,1,NOW(6),NOW(6)),
-- 세계사 5
('READ_HUM_WH_POLITICS','theme','READ_HUMANITIES','세계 정치·외교사',50,1,NOW(6),NOW(6)),
('READ_HUM_WH_ECONOMY','theme','READ_HUMANITIES','세계 경제·산업사',51,1,NOW(6),NOW(6)),
('READ_HUM_WH_THOUGHT','theme','READ_HUMANITIES','세계 사상·종교사',52,1,NOW(6),NOW(6)),
('READ_HUM_WH_CULTURE','theme','READ_HUMANITIES','세계 문화·예술사',53,1,NOW(6),NOW(6)),
('READ_HUM_WH_LIFE','theme','READ_HUMANITIES','세계 생활·과학기술사',54,1,NOW(6),NOW(6)),
-- 미학 5
('READ_HUM_AES_PHIL','theme','READ_HUMANITIES','예술철학',60,1,NOW(6),NOW(6)),
('READ_HUM_AES_EXP','theme','READ_HUMANITIES','미적 경험',61,1,NOW(6),NOW(6)),
('READ_HUM_AES_NATURE','theme','READ_HUMANITIES','미의 본질',62,1,NOW(6),NOW(6)),
('READ_HUM_AES_THEORY','theme','READ_HUMANITIES','미학 이론',63,1,NOW(6),NOW(6)),
('READ_HUM_AES_OTHER','theme','READ_HUMANITIES','기타 미학',64,1,NOW(6),NOW(6));

-- 사회 31
INSERT INTO classification_master (code, type, parent_code, label_ko, sort_order, active, created_at, updated_at) VALUES
-- 경제 8
('READ_SOC_ECON_MICRO','theme','READ_SOCIETY','미시경제',10,1,NOW(6),NOW(6)),
('READ_SOC_ECON_MACRO','theme','READ_SOCIETY','거시경제',11,1,NOW(6),NOW(6)),
('READ_SOC_ECON_MONEY','theme','READ_SOCIETY','화폐·금융·자본시장',12,1,NOW(6),NOW(6)),
('READ_SOC_ECON_INTL','theme','READ_SOCIETY','국제경제·무역',13,1,NOW(6),NOW(6)),
('READ_SOC_ECON_THEORY','theme','READ_SOCIETY','경제이론·사상',14,1,NOW(6),NOW(6)),
('READ_SOC_ECON_LABOR','theme','READ_SOCIETY','노동·복지·분배',15,1,NOW(6),NOW(6)),
('READ_SOC_ECON_HISTORY','theme','READ_SOCIETY','경제사·산업사',16,1,NOW(6),NOW(6)),
('READ_SOC_ECON_OTHER','theme','READ_SOCIETY','기타 경제',17,1,NOW(6),NOW(6)),
-- 법 10
('READ_SOC_LAW_PHIL','theme','READ_SOCIETY','법철학·법사상',20,1,NOW(6),NOW(6)),
('READ_SOC_LAW_LOGIC','theme','READ_SOCIETY','법논리·법해석',21,1,NOW(6),NOW(6)),
('READ_SOC_LAW_CONST','theme','READ_SOCIETY','헌법',22,1,NOW(6),NOW(6)),
('READ_SOC_LAW_CIVIL','theme','READ_SOCIETY','민법',23,1,NOW(6),NOW(6)),
('READ_SOC_LAW_CRIMINAL','theme','READ_SOCIETY','형법',24,1,NOW(6),NOW(6)),
('READ_SOC_LAW_ADMIN','theme','READ_SOCIETY','행정법',25,1,NOW(6),NOW(6)),
('READ_SOC_LAW_SOCIAL','theme','READ_SOCIETY','사회법',26,1,NOW(6),NOW(6)),
('READ_SOC_LAW_INTL','theme','READ_SOCIETY','국제법',27,1,NOW(6),NOW(6)),
('READ_SOC_LAW_PROCEDURE','theme','READ_SOCIETY','사법제도·재판절차',28,1,NOW(6),NOW(6)),
('READ_SOC_LAW_HISTORY','theme','READ_SOCIETY','법사·법제도사',29,1,NOW(6),NOW(6)),
-- 일반사회 5
('READ_SOC_GEN_SOCIOL','theme','READ_SOCIETY','사회학',30,1,NOW(6),NOW(6)),
('READ_SOC_GEN_CULTURE','theme','READ_SOCIETY','문화',31,1,NOW(6),NOW(6)),
('READ_SOC_GEN_FAMILY','theme','READ_SOCIETY','가족·인구',32,1,NOW(6),NOW(6)),
('READ_SOC_GEN_CHANGE','theme','READ_SOCIETY','사회 변동',33,1,NOW(6),NOW(6)),
('READ_SOC_GEN_OTHER','theme','READ_SOCIETY','기타 사회',34,1,NOW(6),NOW(6)),
-- 지리 4
('READ_SOC_GEO_NATURE','theme','READ_SOCIETY','자연지리',40,1,NOW(6),NOW(6)),
('READ_SOC_GEO_HUMAN','theme','READ_SOCIETY','인문지리',41,1,NOW(6),NOW(6)),
('READ_SOC_GEO_URBAN','theme','READ_SOCIETY','도시·촌락',42,1,NOW(6),NOW(6)),
('READ_SOC_GEO_ENV','theme','READ_SOCIETY','환경·기후',43,1,NOW(6),NOW(6)),
-- 정치 4
('READ_SOC_POL_THOUGHT','theme','READ_SOCIETY','정치사상',50,1,NOW(6),NOW(6)),
('READ_SOC_POL_INTL','theme','READ_SOCIETY','국제정치',51,1,NOW(6),NOW(6)),
('READ_SOC_POL_ELECTION','theme','READ_SOCIETY','선거·정당',52,1,NOW(6),NOW(6)),
('READ_SOC_POL_POWER','theme','READ_SOCIETY','권력구조',53,1,NOW(6),NOW(6));

-- 과학 22
INSERT INTO classification_master (code, type, parent_code, label_ko, sort_order, active, created_at, updated_at) VALUES
('READ_SCI_PHY_MECH','theme','READ_SCIENCE','역학',10,1,NOW(6),NOW(6)),
('READ_SCI_PHY_EM','theme','READ_SCIENCE','전자기·광학',11,1,NOW(6),NOW(6)),
('READ_SCI_PHY_QUANTUM','theme','READ_SCIENCE','양자·상대성',12,1,NOW(6),NOW(6)),
('READ_SCI_PHY_THERMO','theme','READ_SCIENCE','열역학',13,1,NOW(6),NOW(6)),
('READ_SCI_PHY_OTHER','theme','READ_SCIENCE','기타 물리',14,1,NOW(6),NOW(6)),
('READ_SCI_CHEM_ATOMIC','theme','READ_SCIENCE','원자·분자',20,1,NOW(6),NOW(6)),
('READ_SCI_CHEM_REACTION','theme','READ_SCIENCE','화학 반응',21,1,NOW(6),NOW(6)),
('READ_SCI_CHEM_ORGANIC','theme','READ_SCIENCE','유기화학',22,1,NOW(6),NOW(6)),
('READ_SCI_CHEM_OTHER','theme','READ_SCIENCE','기타 화학',23,1,NOW(6),NOW(6)),
('READ_SCI_BIO_CELL','theme','READ_SCIENCE','세포·유전',30,1,NOW(6),NOW(6)),
('READ_SCI_BIO_EVOLUTION','theme','READ_SCIENCE','진화',31,1,NOW(6),NOW(6)),
('READ_SCI_BIO_PHYSIOL','theme','READ_SCIENCE','생리',32,1,NOW(6),NOW(6)),
('READ_SCI_BIO_ECOLOGY','theme','READ_SCIENCE','생태계',33,1,NOW(6),NOW(6)),
('READ_SCI_BIO_OTHER','theme','READ_SCIENCE','기타 생명과학',34,1,NOW(6),NOW(6)),
('READ_SCI_AST_SOLAR','theme','READ_SCIENCE','태양계',40,1,NOW(6),NOW(6)),
('READ_SCI_AST_GALAXY','theme','READ_SCIENCE','별·은하',41,1,NOW(6),NOW(6)),
('READ_SCI_AST_COSMO','theme','READ_SCIENCE','우주론',42,1,NOW(6),NOW(6)),
('READ_SCI_EAR_GEOLOGY','theme','READ_SCIENCE','지질',50,1,NOW(6),NOW(6)),
('READ_SCI_EAR_ATMOS','theme','READ_SCIENCE','대기',51,1,NOW(6),NOW(6)),
('READ_SCI_EAR_OCEAN','theme','READ_SCIENCE','해양',52,1,NOW(6),NOW(6)),
('READ_SCI_EAR_WEATHER','theme','READ_SCIENCE','기상',53,1,NOW(6),NOW(6)),
('READ_SCI_EAR_OTHER','theme','READ_SCIENCE','기타 지구과학',54,1,NOW(6),NOW(6));

-- 기술 22
INSERT INTO classification_master (code, type, parent_code, label_ko, sort_order, active, created_at, updated_at) VALUES
('READ_TECH_ICT_AI','theme','READ_TECH','AI·머신러닝',10,1,NOW(6),NOW(6)),
('READ_TECH_ICT_NET','theme','READ_TECH','네트워크',11,1,NOW(6),NOW(6)),
('READ_TECH_ICT_SEC','theme','READ_TECH','정보보안',12,1,NOW(6),NOW(6)),
('READ_TECH_ICT_DATA','theme','READ_TECH','데이터·DB',13,1,NOW(6),NOW(6)),
('READ_TECH_ICT_SW','theme','READ_TECH','소프트웨어',14,1,NOW(6),NOW(6)),
('READ_TECH_EL_SEMI','theme','READ_TECH','반도체',20,1,NOW(6),NOW(6)),
('READ_TECH_EL_CIRCUIT','theme','READ_TECH','회로',21,1,NOW(6),NOW(6)),
('READ_TECH_EL_COMM','theme','READ_TECH','통신·신호',22,1,NOW(6),NOW(6)),
('READ_TECH_EL_POWER','theme','READ_TECH','전력·발전',23,1,NOW(6),NOW(6)),
('READ_TECH_MECH_AUTO','theme','READ_TECH','자동차',30,1,NOW(6),NOW(6)),
('READ_TECH_MECH_AERO','theme','READ_TECH','항공·우주',31,1,NOW(6),NOW(6)),
('READ_TECH_MECH_ROBOT','theme','READ_TECH','로봇',32,1,NOW(6),NOW(6)),
('READ_TECH_MECH_MFG','theme','READ_TECH','제조·소재',33,1,NOW(6),NOW(6)),
('READ_TECH_MED_DRUG','theme','READ_TECH','약물·치료법',40,1,NOW(6),NOW(6)),
('READ_TECH_MED_DIAG','theme','READ_TECH','진단·검사',41,1,NOW(6),NOW(6)),
('READ_TECH_MED_DEVICE','theme','READ_TECH','의료기기',42,1,NOW(6),NOW(6)),
('READ_TECH_MED_PUBLIC','theme','READ_TECH','공중보건·역학',43,1,NOW(6),NOW(6)),
('READ_TECH_MED_OTHER','theme','READ_TECH','기타 의약학',44,1,NOW(6),NOW(6)),
('READ_TECH_ARCH_STRUCT','theme','READ_TECH','구조',50,1,NOW(6),NOW(6)),
('READ_TECH_ARCH_MATERIAL','theme','READ_TECH','재료',51,1,NOW(6),NOW(6)),
('READ_TECH_ARCH_URBAN','theme','READ_TECH','도시계획',52,1,NOW(6),NOW(6)),
('READ_TECH_ARCH_GREEN','theme','READ_TECH','친환경 건축',53,1,NOW(6),NOW(6));

-- 예술 16
INSERT INTO classification_master (code, type, parent_code, label_ko, sort_order, active, created_at, updated_at) VALUES
('READ_ART_MUS_CLASSIC','theme','READ_ART','클래식',10,1,NOW(6),NOW(6)),
('READ_ART_MUS_POP','theme','READ_ART','대중음악',11,1,NOW(6),NOW(6)),
('READ_ART_MUS_KOREAN','theme','READ_ART','국악',12,1,NOW(6),NOW(6)),
('READ_ART_MUS_THEORY','theme','READ_ART','음악사·이론',13,1,NOW(6),NOW(6)),
('READ_ART_FA_PAINT','theme','READ_ART','회화',20,1,NOW(6),NOW(6)),
('READ_ART_FA_SCULPT','theme','READ_ART','조각',21,1,NOW(6),NOW(6)),
('READ_ART_FA_HISTORY','theme','READ_ART','미술사',22,1,NOW(6),NOW(6)),
('READ_ART_FA_OTHER','theme','READ_ART','기타 미술',23,1,NOW(6),NOW(6)),
('READ_ART_DANCE_BALLET','theme','READ_ART','발레',30,1,NOW(6),NOW(6)),
('READ_ART_DANCE_MODERN','theme','READ_ART','현대무용',31,1,NOW(6),NOW(6)),
('READ_ART_DANCE_KOREAN','theme','READ_ART','한국무용',32,1,NOW(6),NOW(6)),
('READ_ART_DANCE_HISTORY','theme','READ_ART','무용사',33,1,NOW(6),NOW(6)),
('READ_ART_FORM_DESIGN','theme','READ_ART','디자인',40,1,NOW(6),NOW(6)),
('READ_ART_FORM_CRAFT','theme','READ_ART','공예',41,1,NOW(6),NOW(6)),
('READ_ART_FORM_PHOTO','theme','READ_ART','사진·영상',42,1,NOW(6),NOW(6)),
('READ_ART_FORM_OTHER','theme','READ_ART','기타 조형',43,1,NOW(6),NOW(6));

-- 문학 50
INSERT INTO classification_master (code, type, parent_code, label_ko, sort_order, active, created_at, updated_at) VALUES
-- 현대시 10
('LIT_MP_NATURE','theme','LIT_MODERN_POETRY','자연/생명',10,1,NOW(6),NOW(6)),
('LIT_MP_LOVE','theme','LIT_MODERN_POETRY','사랑/이별',11,1,NOW(6),NOW(6)),
('LIT_MP_LONGING','theme','LIT_MODERN_POETRY','그리움/향수',12,1,NOW(6),NOW(6)),
('LIT_MP_LIFE','theme','LIT_MODERN_POETRY','일상/삶의 성찰',13,1,NOW(6),NOW(6)),
('LIT_MP_RESISTANCE','theme','LIT_MODERN_POETRY','사회 비판/저항',14,1,NOW(6),NOW(6)),
('LIT_MP_REALITY','theme','LIT_MODERN_POETRY','현실 인식',15,1,NOW(6),NOW(6)),
('LIT_MP_DEATH','theme','LIT_MODERN_POETRY','죽음/존재',16,1,NOW(6),NOW(6)),
('LIT_MP_RELIGION','theme','LIT_MODERN_POETRY','종교/구원',17,1,NOW(6),NOW(6)),
('LIT_MP_FAMILY','theme','LIT_MODERN_POETRY','모성/혈연',18,1,NOW(6),NOW(6)),
('LIT_MP_URBAN','theme','LIT_MODERN_POETRY','도시/문명',19,1,NOW(6),NOW(6)),
-- 고전시가 8
('LIT_CP_NATURE_FRIEND','theme','LIT_CLASSIC_POETRY','자연 친화/풍류',10,1,NOW(6),NOW(6)),
('LIT_CP_LOVE_LONGING','theme','LIT_CLASSIC_POETRY','임에 대한 사랑/그리움',11,1,NOW(6),NOW(6)),
('LIT_CP_LOYALTY','theme','LIT_CLASSIC_POETRY','충/효',12,1,NOW(6),NOW(6)),
('LIT_CP_REMINISCENCE','theme','LIT_CLASSIC_POETRY','회고/우국',13,1,NOW(6),NOW(6)),
('LIT_CP_SATIRE','theme','LIT_CLASSIC_POETRY','풍자/현실 비판',14,1,NOW(6),NOW(6)),
('LIT_CP_LESSON','theme','LIT_CLASSIC_POETRY','권농/교훈',15,1,NOW(6),NOW(6)),
('LIT_CP_PARTING','theme','LIT_CLASSIC_POETRY','이별/이산',16,1,NOW(6),NOW(6)),
('LIT_CP_SEONBI','theme','LIT_CLASSIC_POETRY','선비 정신/도학',17,1,NOW(6),NOW(6)),
-- 현대소설 10
('LIT_MN_COLONIAL','theme','LIT_MODERN_NOVEL','일제 강점/식민지 현실',10,1,NOW(6),NOW(6)),
('LIT_MN_DIVISION','theme','LIT_MODERN_NOVEL','분단/이산가족',11,1,NOW(6),NOW(6)),
('LIT_MN_MODERNIZATION','theme','LIT_MODERN_NOVEL','근대화/도시화',12,1,NOW(6),NOW(6)),
('LIT_MN_FAMILY','theme','LIT_MODERN_NOVEL','가족/세대 갈등',13,1,NOW(6),NOW(6)),
('LIT_MN_LABOR','theme','LIT_MODERN_NOVEL','노동/가난',14,1,NOW(6),NOW(6)),
('LIT_MN_MINORITY','theme','LIT_MODERN_NOVEL','여성/소수자',15,1,NOW(6),NOW(6)),
('LIT_MN_WAR','theme','LIT_MODERN_NOVEL','전쟁의 상흔',16,1,NOW(6),NOW(6)),
('LIT_MN_GROWTH','theme','LIT_MODERN_NOVEL','성장/입사',17,1,NOW(6),NOW(6)),
('LIT_MN_CHARACTER','theme','LIT_MODERN_NOVEL','인물 탐구',18,1,NOW(6),NOW(6)),
('LIT_MN_FANTASY','theme','LIT_MODERN_NOVEL','환상/실험',19,1,NOW(6),NOW(6)),
-- 고전산문 8
('LIT_CL_HERO','theme','LIT_CLASSIC_PROSE','영웅 서사',10,1,NOW(6),NOW(6)),
('LIT_CL_SATIRE','theme','LIT_CLASSIC_PROSE','풍자/세태 비판',11,1,NOW(6),NOW(6)),
('LIT_CL_BIOGRAPHY','theme','LIT_CLASSIC_PROSE','가전/전',12,1,NOW(6),NOW(6)),
('LIT_CL_TALE','theme','LIT_CLASSIC_PROSE','전기/설화',13,1,NOW(6),NOW(6)),
('LIT_CL_FAMILY','theme','LIT_CLASSIC_PROSE','가정 갈등',14,1,NOW(6),NOW(6)),
('LIT_CL_WAR','theme','LIT_CLASSIC_PROSE','군담/전쟁',15,1,NOW(6),NOW(6)),
('LIT_CL_CLASS','theme','LIT_CLASSIC_PROSE','신분 제약/신분 상승',16,1,NOW(6),NOW(6)),
('LIT_CL_YADAM','theme','LIT_CLASSIC_PROSE','야담',17,1,NOW(6),NOW(6)),
-- 수필 8
('LIT_ES_NATURE','theme','LIT_ESSAY','자연/계절',10,1,NOW(6),NOW(6)),
('LIT_ES_INSIGHT','theme','LIT_ESSAY','일상의 깨달음',11,1,NOW(6),NOW(6)),
('LIT_ES_LIFE','theme','LIT_ESSAY','인생/노년',12,1,NOW(6),NOW(6)),
('LIT_ES_FAMILY','theme','LIT_ESSAY','가족/추억',13,1,NOW(6),NOW(6)),
('LIT_ES_SOCIETY','theme','LIT_ESSAY','사회 관찰',14,1,NOW(6),NOW(6)),
('LIT_ES_ART','theme','LIT_ESSAY','예술/문화 단상',15,1,NOW(6),NOW(6)),
('LIT_ES_PHIL','theme','LIT_ESSAY','철학적 사색',16,1,NOW(6),NOW(6)),
('LIT_ES_TRAVEL','theme','LIT_ESSAY','여행/공간',17,1,NOW(6),NOW(6)),
-- 극 6
('LIT_DR_FAMILY','theme','LIT_DRAMA','가족/세대',10,1,NOW(6),NOW(6)),
('LIT_DR_SOCIETY','theme','LIT_DRAMA','사회 부조리',11,1,NOW(6),NOW(6)),
('LIT_DR_HISTORY','theme','LIT_DRAMA','역사/시대',12,1,NOW(6),NOW(6)),
('LIT_DR_RELATION','theme','LIT_DRAMA','인간 관계/소통',13,1,NOW(6),NOW(6)),
('LIT_DR_TRAGICOMIC','theme','LIT_DRAMA','비극/희극',14,1,NOW(6),NOW(6)),
('LIT_DR_FORM','theme','LIT_DRAMA','시나리오/희곡 형식',15,1,NOW(6),NOW(6));

-- 문법 26
INSERT INTO classification_master (code, type, parent_code, label_ko, sort_order, active, created_at, updated_at) VALUES
-- 음운 4
('GRAM_PH_CHANGE','theme','GRAM_PHONOLOGY','음운의 변동',10,1,NOW(6),NOW(6)),
('GRAM_PH_SYSTEM','theme','GRAM_PHONOLOGY','음운의 체계',11,1,NOW(6),NOW(6)),
('GRAM_PH_PRONUNCIATION','theme','GRAM_PHONOLOGY','발음/표준 발음법',12,1,NOW(6),NOW(6)),
('GRAM_PH_HISTORY','theme','GRAM_PHONOLOGY','음운사',13,1,NOW(6),NOW(6)),
-- 단어 5
('GRAM_WD_MORPHEME','theme','GRAM_WORD','형태소·단어',20,1,NOW(6),NOW(6)),
('GRAM_WD_POS','theme','GRAM_WORD','품사',21,1,NOW(6),NOW(6)),
('GRAM_WD_FORMATION','theme','GRAM_WORD','단어 형성',22,1,NOW(6),NOW(6)),
('GRAM_WD_SEMANTIC','theme','GRAM_WORD','어휘 의미 관계',23,1,NOW(6),NOW(6)),
('GRAM_WD_LEXICOLOGY','theme','GRAM_WORD','어휘론',24,1,NOW(6),NOW(6)),
-- 문장 7
('GRAM_SE_COMPONENT','theme','GRAM_SENTENCE','문장 성분',30,1,NOW(6),NOW(6)),
('GRAM_SE_STRUCTURE','theme','GRAM_SENTENCE','문장 구조',31,1,NOW(6),NOW(6)),
('GRAM_SE_TENSE','theme','GRAM_SENTENCE','시제·상·서법',32,1,NOW(6),NOW(6)),
('GRAM_SE_VOICE','theme','GRAM_SENTENCE','능동·피동',33,1,NOW(6),NOW(6)),
('GRAM_SE_CAUSATIVE','theme','GRAM_SENTENCE','사동·주동',34,1,NOW(6),NOW(6)),
('GRAM_SE_NEGATION','theme','GRAM_SENTENCE','부정 표현',35,1,NOW(6),NOW(6)),
('GRAM_SE_QUOTATION','theme','GRAM_SENTENCE','인용',36,1,NOW(6),NOW(6)),
-- 담화 4
('GRAM_DS_STRUCTURE','theme','GRAM_DISCOURSE','담화 구조',40,1,NOW(6),NOW(6)),
('GRAM_DS_REFERENCE','theme','GRAM_DISCOURSE','지시·대용·접속',41,1,NOW(6),NOW(6)),
('GRAM_DS_CONTEXT','theme','GRAM_DISCOURSE','발화·맥락',42,1,NOW(6),NOW(6)),
('GRAM_DS_COHESION','theme','GRAM_DISCOURSE','응집성과 통일성',43,1,NOW(6),NOW(6)),
-- 국어사 6
('GRAM_HS_HUNMIN','theme','GRAM_HISTORY','훈민정음',50,1,NOW(6),NOW(6)),
('GRAM_HS_MEDIEVAL','theme','GRAM_HISTORY','중세 국어',51,1,NOW(6),NOW(6)),
('GRAM_HS_MODERN_PRE','theme','GRAM_HISTORY','근대 국어',52,1,NOW(6),NOW(6)),
('GRAM_HS_PHONOLOGY','theme','GRAM_HISTORY','음운 변천',53,1,NOW(6),NOW(6)),
('GRAM_HS_GRAMMAR','theme','GRAM_HISTORY','문법 변천',54,1,NOW(6),NOW(6)),
('GRAM_HS_LEXICAL','theme','GRAM_HISTORY','어휘 변천',55,1,NOW(6),NOW(6));

-- 화법·작문 공통 내용 주제 (각 영역별 prefix 적용) — 화법 18 + 작문 18 + 매체 21
INSERT INTO classification_master (code, type, parent_code, label_ko, sort_order, active, created_at, updated_at) VALUES
-- 화법 — 6개 sub_area 모두에 동일 주제 적용? → 화법 영역 자체에 묶기 (parent=area=SPEAK 가 아니라 sub_area 각각에 묶으면 row 가 너무 많음)
-- 정책: 주제는 영역 단위로 정의 (parent_code = area). 화법·작문·매체 모두 영역에 직접 매달림.
-- 화법 18
('SPEAK_T_ENV','theme','SPEAK','환경·기후',10,1,NOW(6),NOW(6)),
('SPEAK_T_EDU','theme','SPEAK','교육·학습',11,1,NOW(6),NOW(6)),
('SPEAK_T_TECH','theme','SPEAK','기술·AI·과학',12,1,NOW(6),NOW(6)),
('SPEAK_T_SOCIAL','theme','SPEAK','사회 이슈·시사',13,1,NOW(6),NOW(6)),
('SPEAK_T_CULTURE','theme','SPEAK','문화·예술',14,1,NOW(6),NOW(6)),
('SPEAK_T_ETHICS','theme','SPEAK','윤리·가치관',15,1,NOW(6),NOW(6)),
('SPEAK_T_RELATION','theme','SPEAK','인간관계·소통',16,1,NOW(6),NOW(6)),
('SPEAK_T_FAMILY','theme','SPEAK','가족',17,1,NOW(6),NOW(6)),
('SPEAK_T_SCHOOL','theme','SPEAK','학교생활',18,1,NOW(6),NOW(6)),
('SPEAK_T_TEEN','theme','SPEAK','청소년 문제',19,1,NOW(6),NOW(6)),
('SPEAK_T_CAREER','theme','SPEAK','진로·직업',20,1,NOW(6),NOW(6)),
('SPEAK_T_HEALTH','theme','SPEAK','건강·의료',21,1,NOW(6),NOW(6)),
('SPEAK_T_ECON','theme','SPEAK','경제·소비',22,1,NOW(6),NOW(6)),
('SPEAK_T_GLOBAL','theme','SPEAK','국제·세계화',23,1,NOW(6),NOW(6)),
('SPEAK_T_HISTORY','theme','SPEAK','역사·전통',24,1,NOW(6),NOW(6)),
('SPEAK_T_LIFE','theme','SPEAK','일상·생활',25,1,NOW(6),NOW(6)),
('SPEAK_T_NATURE','theme','SPEAK','자연·생명',26,1,NOW(6),NOW(6)),
('SPEAK_T_ETC','theme','SPEAK','기타',90,1,NOW(6),NOW(6)),
-- 작문 18
('WRITE_T_ENV','theme','WRITE','환경·기후',10,1,NOW(6),NOW(6)),
('WRITE_T_EDU','theme','WRITE','교육·학습',11,1,NOW(6),NOW(6)),
('WRITE_T_TECH','theme','WRITE','기술·AI·과학',12,1,NOW(6),NOW(6)),
('WRITE_T_SOCIAL','theme','WRITE','사회 이슈·시사',13,1,NOW(6),NOW(6)),
('WRITE_T_CULTURE','theme','WRITE','문화·예술',14,1,NOW(6),NOW(6)),
('WRITE_T_ETHICS','theme','WRITE','윤리·가치관',15,1,NOW(6),NOW(6)),
('WRITE_T_RELATION','theme','WRITE','인간관계·소통',16,1,NOW(6),NOW(6)),
('WRITE_T_FAMILY','theme','WRITE','가족',17,1,NOW(6),NOW(6)),
('WRITE_T_SCHOOL','theme','WRITE','학교생활',18,1,NOW(6),NOW(6)),
('WRITE_T_TEEN','theme','WRITE','청소년 문제',19,1,NOW(6),NOW(6)),
('WRITE_T_CAREER','theme','WRITE','진로·직업',20,1,NOW(6),NOW(6)),
('WRITE_T_HEALTH','theme','WRITE','건강·의료',21,1,NOW(6),NOW(6)),
('WRITE_T_ECON','theme','WRITE','경제·소비',22,1,NOW(6),NOW(6)),
('WRITE_T_GLOBAL','theme','WRITE','국제·세계화',23,1,NOW(6),NOW(6)),
('WRITE_T_HISTORY','theme','WRITE','역사·전통',24,1,NOW(6),NOW(6)),
('WRITE_T_LIFE','theme','WRITE','일상·생활',25,1,NOW(6),NOW(6)),
('WRITE_T_NATURE','theme','WRITE','자연·생명',26,1,NOW(6),NOW(6)),
('WRITE_T_ETC','theme','WRITE','기타',90,1,NOW(6),NOW(6)),
-- 매체 21 (공통 18 + 매체 전용 3)
('MEDIA_T_ENV','theme','MEDIA','환경·기후',10,1,NOW(6),NOW(6)),
('MEDIA_T_EDU','theme','MEDIA','교육·학습',11,1,NOW(6),NOW(6)),
('MEDIA_T_TECH','theme','MEDIA','기술·AI·과학',12,1,NOW(6),NOW(6)),
('MEDIA_T_SOCIAL','theme','MEDIA','사회 이슈·시사',13,1,NOW(6),NOW(6)),
('MEDIA_T_CULTURE','theme','MEDIA','문화·예술',14,1,NOW(6),NOW(6)),
('MEDIA_T_ETHICS','theme','MEDIA','윤리·가치관',15,1,NOW(6),NOW(6)),
('MEDIA_T_RELATION','theme','MEDIA','인간관계·소통',16,1,NOW(6),NOW(6)),
('MEDIA_T_FAMILY','theme','MEDIA','가족',17,1,NOW(6),NOW(6)),
('MEDIA_T_SCHOOL','theme','MEDIA','학교생활',18,1,NOW(6),NOW(6)),
('MEDIA_T_TEEN','theme','MEDIA','청소년 문제',19,1,NOW(6),NOW(6)),
('MEDIA_T_CAREER','theme','MEDIA','진로·직업',20,1,NOW(6),NOW(6)),
('MEDIA_T_HEALTH','theme','MEDIA','건강·의료',21,1,NOW(6),NOW(6)),
('MEDIA_T_ECON','theme','MEDIA','경제·소비',22,1,NOW(6),NOW(6)),
('MEDIA_T_GLOBAL','theme','MEDIA','국제·세계화',23,1,NOW(6),NOW(6)),
('MEDIA_T_HISTORY','theme','MEDIA','역사·전통',24,1,NOW(6),NOW(6)),
('MEDIA_T_LIFE','theme','MEDIA','일상·생활',25,1,NOW(6),NOW(6)),
('MEDIA_T_NATURE','theme','MEDIA','자연·생명',26,1,NOW(6),NOW(6)),
('MEDIA_T_LITERACY','theme','MEDIA','미디어 리터러시',30,1,NOW(6),NOW(6)),
('MEDIA_T_AD_CONSUMER','theme','MEDIA','광고·소비',31,1,NOW(6),NOW(6)),
('MEDIA_T_FAKE_NEWS','theme','MEDIA','가짜뉴스',32,1,NOW(6),NOW(6)),
('MEDIA_T_ETC','theme','MEDIA','기타',90,1,NOW(6),NOW(6));
