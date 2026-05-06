# 콘텐츠 분류 작업 — 코덱스 인수인계 문서

**작성일**: 2026-05-06
**위임자**: 사용자 → Codex (GPT-5)
**대체자**: 본 프로젝트 Claude 가 진행하던 작업을 토큰 절감 위해 Codex 에 위임

---

## 1. 작업 목적

국어농장 v2 의 모든 학습 콘텐츠와 시험 문항에 **영역(area) / 세부영역(sub_area) / 주제(theme) 분류** 부여.

### 왜 중요한가
이 분류는 **AI 추천 학습 / 학습 로드맵 / 학생 강약점 분석의 사전 작업**. 분류가 정확해야 AI 에이전트(관리자/학생 튜터)가 토큰 절약하면서 정확한 추천을 할 수 있음. 사용자는 이 작업을 "정말 정확해야 한다" 고 강조함.

### 절대 원칙
- ❌ **키워드 매칭·문자열 빈도·자동 매핑 스크립트 금지** (사용자 직접 경험: 자동 스크립트는 필연적 오분석 발생)
- ✅ **본문을 직접 읽고 의미를 LLM 추론으로 판단** 후 분류 부여
- ✅ AI 가 후보 제시 + 사람 승인도 OK
- 통계 추출(SELECT count, NULL 비율) 등은 스크립트 OK
- 마이그레이션·컬럼 추가는 스크립트 OK. 컬럼 값 채우기는 수동/LLM 추론

---

## 2. 작업 범위

### 우선순위 1: PRO_READING (597건) — 진행 중
- **이미 분류 완료**: **60건** (Claude 10건 + Subagent 50건, 모두 사용자 검수/검증 통과)
- **남은 작업**: **537건**
- 본사 정성 콘텐츠, 긴 지문, 학생 영향 큼

> Codex 시작 시 미분류만 자동 추출 (OFFSET 불필요):
> ```sql
> WHERE c.content_type='PRO_READING'
> AND c.id NOT IN (SELECT DISTINCT content_id FROM content_classifications)
> ORDER BY c.id LIMIT 50
> ```

### 우선순위 2: 그 외 지문 기반 콘텐츠
| content_type | 건수 | 비고 |
|--------------|------|------|
| BACKGROUND_KNOWLEDGE | 381 | 배경지식 학습 풀 |
| PRO_BACKGROUND | 180 | 프로 배경지식 |
| PRO_LOGIC | 180 | 프로 논리 |
| PRO_MANUSCRIPT | 180 | 프로 원고 |
| PRO_ANSWER | 180 | 프로 답안 |
| LOGIC_REASONING_QUIZ | 240 | 논리추론 |
| **소계** | **1,341** | |
| DAILY_READING | 4,380 | 일일 독해 (짧은 지문) |
| DAILY_QUIZ | 4,380 | 일일 퀴즈 |

### 자명 분류 — 이미 완료
| content_type | 건수 | 처리 |
|--------------|------|------|
| 문법 5종 | 361 | ✅ GRAM + GRAM_WORD/PHONOLOGY/SENTENCE 일괄 INSERT 완료 |
| VOCAB / VOCAB_BASIC / PRO_VOCAB | 420 | ✅ 정책상 분류 면제 (10대 역량으로만 측정) |

### 우선순위 3: 시험 문항 (test_questions)
3,831건. 별도 매핑 테이블 `test_question_classifications`. 시험 문항도 지문 기반이므로 영역+세부영역+주제 모두 부여.

### 총 작업량
지문 기반 약 **10,728건** + 시험 문항 **3,831건** = **약 14,559건**

---

## 3. DB 접속 정보

### SSH 터널
```bash
ssh -i ~/.ssh/korfarm-ec2.pem -o StrictHostKeyChecking=no ec2-user@43.200.104.102
```

### MySQL (RDS — EC2 안에서만 접속)
```bash
mysql \
  -h korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com \
  -u admin \
  -pxXoM4Ld7VAIYl9W874md5kic \
  korfarm
```

### 한 줄 명령 패턴 (바로 사용 가능)
```bash
ssh -i ~/.ssh/korfarm-ec2.pem -o StrictHostKeyChecking=no ec2-user@43.200.104.102 \
  "mysql -h korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com -u admin -pxXoM4Ld7VAIYl9W874md5kic korfarm -e 'SELECT ...'"
```

`-B -N` 옵션 추가하면 헤더 없는 TSV 출력.

---

## 4. 분류 카탈로그 v3 (확정)

### 4-1. 영역 (6개)

| 코드 | 한글 |
|------|------|
| READ | 독서 (비문학) |
| LIT | 문학 |
| GRAM | 문법 |
| SPEAK | 화법 |
| WRITE | 작문 |
| MEDIA | 매체 |

### 4-2. 세부영역 (37개)

**READ — 6개**: READ_HUMANITIES(인문) / READ_SOCIETY(사회) / READ_SCIENCE(과학) / READ_TECH(기술) / READ_ART(예술) / READ_ETC(기타)

**LIT — 6개**: LIT_MODERN_POETRY(현대시) / LIT_CLASSIC_POETRY(고전시가) / LIT_MODERN_NOVEL(현대소설) / LIT_CLASSIC_PROSE(고전산문) / LIT_ESSAY(수필) / LIT_DRAMA(극)

**GRAM — 5개**: GRAM_PHONOLOGY(음운) / GRAM_WORD(단어) / GRAM_SENTENCE(문장) / GRAM_DISCOURSE(담화) / GRAM_HISTORY(국어사)

**SPEAK — 6개**: SPEAK_PRESENT(발표/강연) / SPEAK_DEBATE(토론) / SPEAK_DISCUSS(토의) / SPEAK_NEGOTIATE(협상) / SPEAK_INTERVIEW(대담) / SPEAK_ETC(기타)

**WRITE — 7개**: WRITE_PROPOSAL(건의문) / WRITE_ARGUMENT(논설문) / WRITE_REPORT(보고서) / WRITE_LIFE(생활문) / WRITE_EXPLAIN(설명문) / WRITE_REVIEW(비평/감상문) / WRITE_ETC(기타)

**MEDIA — 7개**: MEDIA_PRINT(인쇄) / MEDIA_BROADCAST(방송/영상) / MEDIA_INTERNET(인터넷/소셜) / MEDIA_AD(광고) / MEDIA_DIGITAL(디지털/뉴미디어) / MEDIA_CONVERGENCE(융합) / MEDIA_ETC(기타)

### 4-3. 주제 (256개) — 전체는 첨부 TSV 참고

전체 분류 코드 + 한글 라벨 + parent_code TSV: `docs/분류_마스터_전체코드.tsv` (299 row).

**한 번에 가져오는 명령**:
```bash
ssh -i ~/.ssh/korfarm-ec2.pem -o StrictHostKeyChecking=no ec2-user@43.200.104.102 \
  "mysql -h korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com -u admin -pxXoM4Ld7VAIYl9W874md5kic korfarm -B -N -e \
  'SELECT code, type, parent_code, label_ko FROM classification_master ORDER BY type DESC, sort_order, code'" > /tmp/master.tsv
```

#### 주제 코드 패턴 요약 (작업 시 빠르게 참조)

**인문(32)**:
- 동양사상(5): READ_HUM_E_HUNDRED(제자백가) / E_CONFUCIAN(유학) / E_NEOCONFUCIAN(성리학) / E_YANGMING(양명학) / E_OTHER
- 한국사상(4): READ_HUM_K_SILHAK(실학) / K_DONGHAK / K_MODERN / K_OTHER
- 서양철학(8): READ_HUM_W_EPISTEM(인식론) / W_ONTOL(존재론) / W_ETHICS(윤리) / W_POLITICS(정치철학) / W_AESTHETIC(미학) / W_LOGIC(논리/과학철학) / W_LANG(언어/종교) / W_OTHER
- 한국사 분야사(5): READ_HUM_KH_POLITICS / KH_ECONOMY / KH_THOUGHT / KH_CULTURE / KH_LIFE
- 세계사 분야사(5): READ_HUM_WH_POLITICS / WH_ECONOMY / WH_THOUGHT / WH_CULTURE / WH_LIFE
- 미학(5): READ_HUM_AES_PHIL / AES_EXP / AES_NATURE / AES_THEORY / AES_OTHER

**사회(31)**:
- 경제(8): READ_SOC_ECON_MICRO / MACRO / MONEY / INTL / THEORY / LABOR / HISTORY / OTHER
- 법(10): READ_SOC_LAW_PHIL(법철학) / LAW_LOGIC(법논리·삼단논법) / LAW_CONST(헌법) / LAW_CIVIL(민법) / LAW_CRIMINAL(형법) / LAW_ADMIN(행정) / LAW_SOCIAL(사회법·노동) / LAW_INTL / LAW_PROCEDURE(사법제도) / LAW_HISTORY
- 일반사회(5): READ_SOC_GEN_SOCIOL / GEN_CULTURE / GEN_FAMILY / GEN_CHANGE / GEN_OTHER
- 지리(4): READ_SOC_GEO_NATURE / GEO_HUMAN / GEO_URBAN / GEO_ENV
- 정치(4): READ_SOC_POL_THOUGHT / POL_INTL / POL_ELECTION / POL_POWER

**과학(22)**:
- 물리(5): READ_SCI_PHY_MECH(역학) / PHY_EM(전자기) / PHY_QUANTUM(양자/상대성) / PHY_THERMO(열역학) / PHY_OTHER
- 화학(4): READ_SCI_CHEM_ATOMIC / REACTION / ORGANIC / OTHER
- 생명과학(5): READ_SCI_BIO_CELL / EVOLUTION / PHYSIOL / ECOLOGY / OTHER
- 천문학(3): READ_SCI_AST_SOLAR / GALAXY / COSMO
- 지구과학(5): READ_SCI_EAR_GEOLOGY / ATMOS / OCEAN / WEATHER / OTHER

**기술(22)**:
- ICT(5): READ_TECH_ICT_AI / ICT_NET / ICT_SEC / ICT_DATA / ICT_SW
- 전자/전기(4): READ_TECH_EL_SEMI / EL_CIRCUIT / EL_COMM / EL_POWER
- 기계(4): READ_TECH_MECH_AUTO / MECH_AERO / MECH_ROBOT / MECH_MFG
- 의약학(5): READ_TECH_MED_DRUG / MED_DIAG / MED_DEVICE / MED_PUBLIC / MED_OTHER
- 건축(4): READ_TECH_ARCH_STRUCT / ARCH_MATERIAL / ARCH_URBAN / ARCH_GREEN

**예술(16)**:
- 음악(4): READ_ART_MUS_CLASSIC / MUS_POP / MUS_KOREAN / MUS_THEORY
- 미술(4): READ_ART_FA_PAINT / FA_SCULPT / FA_HISTORY / FA_OTHER
- 무용(4): READ_ART_DANCE_BALLET / DANCE_MODERN / DANCE_KOREAN / DANCE_HISTORY
- 조형(4): READ_ART_FORM_DESIGN / FORM_CRAFT / FORM_PHOTO / FORM_OTHER

**문학(50)**:
- 현대시(10): LIT_MP_NATURE / MP_LOVE / MP_LONGING / MP_LIFE / MP_RESISTANCE / MP_REALITY / MP_DEATH / MP_RELIGION / MP_FAMILY / MP_URBAN
- 고전시가(8): LIT_CP_NATURE_FRIEND / CP_LOVE_LONGING / CP_LOYALTY / CP_REMINISCENCE / CP_SATIRE / CP_LESSON / CP_PARTING / CP_SEONBI
- 현대소설(10): LIT_MN_COLONIAL / MN_DIVISION / MN_MODERNIZATION / MN_FAMILY / MN_LABOR / MN_MINORITY / MN_WAR / MN_GROWTH / MN_CHARACTER / MN_FANTASY
- 고전산문(8): LIT_CL_HERO / CL_SATIRE / CL_BIOGRAPHY / CL_TALE / CL_FAMILY / CL_WAR / CL_CLASS / CL_YADAM
- 수필(8): LIT_ES_NATURE / ES_INSIGHT / ES_LIFE / ES_FAMILY / ES_SOCIETY / ES_ART / ES_PHIL / ES_TRAVEL
- 극(6): LIT_DR_FAMILY / DR_SOCIETY / DR_HISTORY / DR_RELATION / DR_TRAGICOMIC / DR_FORM

**문법(26)**:
- 음운(4): GRAM_PH_CHANGE(음운변동) / PH_SYSTEM(체계) / PH_PRONUNCIATION(발음) / PH_HISTORY
- 단어(5): GRAM_WD_MORPHEME(형태소) / WD_POS(품사) / WD_FORMATION(단어형성) / WD_SEMANTIC(의미관계) / WD_LEXICOLOGY(어휘론)
- 문장(7): GRAM_SE_COMPONENT(성분) / SE_STRUCTURE(구조) / SE_TENSE(시제) / SE_VOICE(능동·피동) / SE_CAUSATIVE(사동·주동) / SE_NEGATION(부정) / SE_QUOTATION(인용)
- 담화(4): GRAM_DS_STRUCTURE / DS_REFERENCE / DS_CONTEXT / DS_COHESION
- 국어사(6): GRAM_HS_HUNMIN(훈민정음) / HS_MEDIEVAL(중세) / HS_MODERN_PRE(근대) / HS_PHONOLOGY(음운변천) / HS_GRAMMAR(문법변천) / HS_LEXICAL(어휘변천)

**화법·작문·매체 주제(약 60)**:
- 공통 18개: SPEAK_T_/WRITE_T_/MEDIA_T_ + ENV(환경)/EDU(교육)/TECH(기술/AI/과학)/SOCIAL(사회이슈)/CULTURE(문화/예술)/ETHICS(윤리)/RELATION(인간관계)/FAMILY(가족)/SCHOOL(학교)/TEEN(청소년)/CAREER(진로)/HEALTH(건강)/ECON(경제)/GLOBAL(국제)/HISTORY(역사)/LIFE(일상)/NATURE(자연)/ETC
- 매체 전용 추가 3개: MEDIA_T_LITERACY(미디어 리터러시) / MEDIA_T_AD_CONSUMER(광고소비) / MEDIA_T_FAKE_NEWS(가짜뉴스)

---

## 5. 분류 결정 원칙

사용자가 검수한 첫 10건 사례 기반.

### 5-1. 본문 직접 읽기
- **제목만으로 결정 X** — 단, 명백한 경우(예: "정약용의 실학 사상")는 제목+첫 문단으로 충분
- 첫 문단(800~1500자) 으로 영역·세부영역·주제 결정 가능
- 모호하면 paragraphs[1], [2] 까지 추가 확인

### 5-2. 복수 지정 (핵심)
- 한 지문이 여러 영역·주제 걸치면 **모두 부여**
- 예시:
  - 신약 개발 지문 → READ_SCIENCE + READ_TECH (둘 다 sub_area)
  - 환경 보호 토론 → SPEAK_DEBATE + SPEAK_T_ENV + SPEAK_T_SOCIAL
  - 석빙고 → READ_HUMANITIES + READ_TECH + READ_HUM_KH_LIFE + READ_TECH_ARCH_STRUCT

### 5-3. 대표(primary) 1개
- 가장 핵심에 가까운 분류 1개에 `is_primary=1`
- 나머지는 `is_primary=0`
- 보통 sub_area 또는 theme 이 primary (area 보다 정밀)

### 5-4. 면제 케이스
| 케이스 | 영역 | 세부영역 | 주제 |
|--------|------|---------|------|
| 어휘 학습 (VOCAB*) | ❌ | ❌ | ❌ — 분류 면제 (10대 역량만) |
| 형식 학습 (예: "주장과 근거") | ✅ | ✅ | ❌ |
| 문법 단순 기능 학습 | ✅ (GRAM) | ✅ | 케이스별 |

### 5-5. 기존 컬럼 무시
- `contents.area` (기존 값: GRAMMAR/CONCEPT/NONFICTION 등) — **무시**
- `contents.sub_area` — **무시**
- 본문 의미로 새로 판단

### 5-6. 사용자 검수 통과 사례 10건

| # | 제목 | level | 영역 | 세부영역 | 주제 (★=대표) |
|---|------|------|------|---------|--------------|
| 1 | 표준 발음법 | russell2 | GRAM | GRAM_PHONOLOGY | ★ GRAM_PH_PRONUNCIATION |
| 2 | 시간 표현 (시제) | frege3 | GRAM | GRAM_SENTENCE | ★ GRAM_SE_TENSE |
| 3 | 주장과 근거 | saussure1 | WRITE | ★ WRITE_ARGUMENT | (주제 면제) |
| 4 | 날씨가 생활에 미치는 영향 | saussure1 | READ | SOCIETY+SCIENCE | ★ READ_SOC_GEN_OTHER + READ_SCI_EAR_WEATHER |
| 5 | 장소를 떠난 조각 | russell1 | READ | READ_ART | ★ READ_ART_FA_SCULPT + READ_ART_FA_HISTORY |
| 6 | 천연 냉장고 석빙고 | frege3 | READ | HUMANITIES+TECH | ★ READ_HUM_KH_LIFE + READ_TECH_ARCH_STRUCT |
| 7 | 남극 빙하의 비밀 | russell1 | READ | READ_SCIENCE | ★ READ_SCI_EAR_GEOLOGY + READ_SOC_GEO_ENV |
| 8 | 문장 성분과 서술어 자릿수 | russell3 | GRAM | GRAM_SENTENCE | ★ GRAM_SE_COMPONENT |
| 9 | 가나다라 한글 노래 | saussure1 | GRAM | GRAM_PHONOLOGY | ★ GRAM_PH_SYSTEM |
| 10 | 방사성 동위원소 암석 연대 | russell3 | READ | READ_SCIENCE | ★ READ_SCI_EAR_GEOLOGY + READ_SCI_CHEM_ATOMIC |

---

## 6. 작업 흐름 (배치 단위)

### Step 1: 본문 추출 (50건씩 batch)
```bash
ssh -i ~/.ssh/korfarm-ec2.pem -o StrictHostKeyChecking=no ec2-user@43.200.104.102 \
  "mysql -h korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com -u admin -pxXoM4Ld7VAIYl9W874md5kic korfarm -B -N -e \
  \"SELECT CONCAT(c.id, '||', c.title, '||', c.level_id, '||', \
  SUBSTRING(JSON_UNQUOTE(JSON_EXTRACT(cv.content_json, '\\\$.payload.passage.paragraphs[0].text')), 1, 1500)) \
  FROM contents c \
  JOIN content_versions cv ON cv.id = (SELECT MAX(id) FROM content_versions WHERE content_id = c.id) \
  WHERE c.content_type='PRO_READING' \
  AND c.id NOT IN (SELECT DISTINCT content_id FROM content_classifications) \
  ORDER BY c.id LIMIT 50\""
```

`AND c.id NOT IN (SELECT DISTINCT content_id FROM content_classifications)` 로 **이미 분류된 건 자동 제외** → 매번 OFFSET 계산 불필요.

### Step 2: 본문 한 건씩 읽고 분류 결정
- title + 본문 첫 1500자 → 영역·세부영역·주제 코드 결정
- 모호하면 paragraphs[1], [2] 추가 추출 (필요시 단건 SELECT)

### Step 3: INSERT SQL 작성·실행

```sql
-- 한 콘텐츠당 N개 row INSERT IGNORE (콘텐츠당 평균 3~5개)
INSERT IGNORE INTO content_classifications
  (content_id, classification_code, classification_type, is_primary, created_at)
VALUES
  ('content_xxx', 'READ', 'area', 0, NOW(6)),
  ('content_xxx', 'READ_SCIENCE', 'sub_area', 0, NOW(6)),
  ('content_xxx', 'READ_SCI_BIO_CELL', 'theme', 1, NOW(6)),
  ...;
```

heredoc 으로 SSH mysql 한 번에 실행:
```bash
ssh -i ~/.ssh/korfarm-ec2.pem -o StrictHostKeyChecking=no ec2-user@43.200.104.102 \
  "mysql -h korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com -u admin -pxXoM4Ld7VAIYl9W874md5kic korfarm <<'SQL'
INSERT IGNORE INTO content_classifications VALUES (...);
INSERT IGNORE INTO content_classifications VALUES (...);
SELECT COUNT(DISTINCT content_id) FROM content_classifications WHERE content_id IN ('id1','id2'...);
SQL"
```

### Step 4: 검증
```sql
-- 이번 batch 의 50건 모두 분류됐는지
SELECT
  (SELECT COUNT(*) FROM contents WHERE content_type='PRO_READING') AS total,
  (SELECT COUNT(DISTINCT content_id) FROM content_classifications cc
   JOIN contents c ON c.id=cc.content_id WHERE c.content_type='PRO_READING') AS classified;
```

### Step 5: 진행도 추적

매 batch 후 다음 SELECT 로 전체 진행도 확인:
```sql
SELECT c.content_type,
       COUNT(*) AS total,
       (SELECT COUNT(DISTINCT cc.content_id) FROM content_classifications cc
        JOIN contents c2 ON c2.id=cc.content_id
        WHERE c2.content_type=c.content_type) AS classified
FROM contents c GROUP BY c.content_type ORDER BY classified DESC;
```

---

## 7. 시험 문항 (test_questions) 처리

별도 매핑 테이블 사용:

```sql
INSERT IGNORE INTO test_question_classifications
  (question_id, classification_code, classification_type, is_primary, created_at)
VALUES (...);
```

문항 본문 추출:
```sql
SELECT id, stem, passage, domain, sub_domain
FROM test_questions
WHERE id NOT IN (SELECT DISTINCT question_id FROM test_question_classifications)
LIMIT 50;
```

대용량 (3,831건). 같은 시험지의 문항은 비슷한 분류일 가능성 — 시험지 단위로 묶어 일괄 결정 가능 (단 본문 직접 읽기 원칙 유지).

---

## 8. 보고 형식

매 batch 완료 시 사용자에게 다음 표 보고:

```markdown
## PRO_READING batch N (50건) 완료 — 누적 X건 / 597건

| # | 제목 (앞 30자) | level | 영역 | 세부영역 | 주제 (★=대표) |
| 1 | ... | ... | ... | ... | ★... |
...

### 통계
- INSERT row: X 건 (콘텐츠당 평균 N개)
- 영역 분포: READ X / GRAM X / WRITE X / ...
- 복수 지정 비율: X% (여러 영역 걸친 콘텐츠)
- 분류 면제: X건 (어휘·형식 학습)
```

---

## 9. 진행 현황 (인수인계 시점)

### 완료 (2026-05-06 시점)
- ✅ 분류 마스터 테이블 + 시드 INSERT (V0100, 299 row)
- ✅ 매핑 테이블 (content_classifications, test_question_classifications)
- ✅ 백엔드 ClassificationController + Service
- ✅ 프론트 ClassificationPicker 컴포넌트 + 3개 비주얼 에디터 통합
- ✅ 문법 5종 자명 분류 INSERT (361건 / 722 row)
- ✅ PRO_READING 첫 10건 직접 분류 (사용자 검수 통과)

### 남은 작업 (코덱스 인수)
| content_type | 남은 건수 |
|--------------|----------|
| **PRO_READING** | **587** (시작) |
| BACKGROUND_KNOWLEDGE | 381 |
| PRO_BACKGROUND | 180 |
| PRO_LOGIC | 180 |
| PRO_MANUSCRIPT | 180 |
| PRO_ANSWER | 180 |
| LOGIC_REASONING_QUIZ | 240 |
| DAILY_READING | 4,380 |
| DAILY_QUIZ | 4,380 |
| test_questions | 3,831 |
| **합계** | **약 14,539** |

### 권장 진행 순서
1. PRO_READING 587 (영향 큼)
2. BACKGROUND_KNOWLEDGE 381 + PRO_BACKGROUND 180
3. PRO_LOGIC + PRO_MANUSCRIPT + PRO_ANSWER 540
4. LOGIC_REASONING_QUIZ 240
5. DAILY_READING 4,380 (짧은 지문, 빠르게)
6. DAILY_QUIZ 4,380 (단답 위주, 케이스별 분류 면제 가능)
7. test_questions 3,831

### 사용자 검수 시점
- batch 50~100건 단위로 결과 표 보고
- 사용자가 검수 후 OK 면 같은 패턴으로 계속
- 의견·수정 있으면 패턴 반영 후 다음 batch

---

## 10. 주의사항

### DO
- ✅ 본문 직접 읽고 의미 판단
- ✅ 모호하면 paragraphs[1], [2] 까지 확인
- ✅ 복수 지정 적극 활용 (검색·추천에서 더 많이 노출되도록)
- ✅ INSERT IGNORE 로 중복 방지
- ✅ heredoc 으로 한 번에 여러 INSERT
- ✅ 매 batch 후 검증 SELECT
- ✅ 사용자 검수 받은 패턴 일관 유지

### DON'T
- ❌ 키워드 매칭으로 분류 (예: "경제" 단어 있으면 READ_SOCIETY 자동 부여) — 절대 금지
- ❌ contents.area / contents.sub_area 의 기존 값 무시 (옛날 분류라 부정확)
- ❌ 모든 콘텐츠에 영역 강제 — 어휘·형식 학습은 면제 가능
- ❌ INSERT 후 검증 없이 다음 batch 진행
- ❌ 한국어 입력 인코딩 깨지면 BOM 또는 LATIN1 으로 처리하지 말고 UTF-8 보장 (mysql -default-character-set=utf8mb4)

---

## 11. 빠른 참조 — 자주 쓰는 명령

### 진행도 확인
```bash
ssh -i ~/.ssh/korfarm-ec2.pem ec2-user@43.200.104.102 \
  "mysql -h korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com -u admin -pxXoM4Ld7VAIYl9W874md5kic korfarm -e \
  'SELECT c.content_type, COUNT(*) total, (SELECT COUNT(DISTINCT cc.content_id) FROM content_classifications cc JOIN contents c2 ON c2.id=cc.content_id WHERE c2.content_type=c.content_type) classified FROM contents c GROUP BY c.content_type ORDER BY classified DESC;'"
```

### 50건 본문 추출 (다음 미분류)
```bash
ssh -i ~/.ssh/korfarm-ec2.pem ec2-user@43.200.104.102 \
  "mysql -h korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com -u admin -pxXoM4Ld7VAIYl9W874md5kic korfarm -B -N -e \
  \"SELECT CONCAT(c.id, '||', c.title, '||', c.level_id, '||', SUBSTRING(JSON_UNQUOTE(JSON_EXTRACT(cv.content_json, '\\\$.payload.passage.paragraphs[0].text')), 1, 1500)) FROM contents c JOIN content_versions cv ON cv.id = (SELECT MAX(id) FROM content_versions WHERE content_id = c.id) WHERE c.content_type='PRO_READING' AND c.id NOT IN (SELECT DISTINCT content_id FROM content_classifications) ORDER BY c.id LIMIT 50\""
```

### 단건 본문 (모호한 경우 — 전체 paragraphs)
```bash
ssh -i ~/.ssh/korfarm-ec2.pem ec2-user@43.200.104.102 \
  "mysql -h korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com -u admin -pxXoM4Ld7VAIYl9W874md5kic korfarm -B -N -e \
  \"SELECT JSON_UNQUOTE(JSON_EXTRACT(cv.content_json, '\\\$.payload.passage.paragraphs')) FROM contents c JOIN content_versions cv ON cv.id = (SELECT MAX(id) FROM content_versions WHERE content_id = c.id) WHERE c.id='content_xxx'\""
```

### 한 콘텐츠 분류 결과 확인
```bash
ssh -i ~/.ssh/korfarm-ec2.pem ec2-user@43.200.104.102 \
  "mysql -h korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com -u admin -pxXoM4Ld7VAIYl9W874md5kic korfarm -e \
  'SELECT cc.classification_code, cm.label_ko, cc.classification_type, cc.is_primary FROM content_classifications cc JOIN classification_master cm ON cm.code=cc.classification_code WHERE cc.content_id=\"content_xxx\" ORDER BY cc.classification_type, cc.is_primary DESC;'"
```

---

## 12. 첨부 파일

- `docs/콘텐츠_분류_카탈로그_v3.md` — 분류 정의 + 변경 이력
- `docs/분류_마스터_전체코드.tsv` — 299개 코드 전체 (영역/세부영역/주제 + 한글 라벨 + parent_code)
- `backend/src/main/resources/db/migration/V0100__classification_master.sql` — 마스터 + 시드 SQL

---

## 13. 종료 조건

다음을 모두 만족하면 작업 종료:
- 모든 PRO_READING / DAILY_READING / DAILY_QUIZ / BACKGROUND_KNOWLEDGE / PRO_* / LOGIC_REASONING_QUIZ 콘텐츠가 `content_classifications` 에 적어도 1 row 이상
- 모든 test_questions 가 `test_question_classifications` 에 적어도 1 row 이상
- 분류 면제 정책 적용된 콘텐츠 (어휘·일부 형식 학습) 는 분류 0 row OK — 별도 메모로 기록

---

## 14. 문의

분류 모호한 케이스, 카탈로그 누락 코드 발견, 정책 충돌 시 사용자(itsme0215@hanmail.net)에게 마크다운 보고서로 의견 요청. 자체 판단 X.

---

**인수인계 끝.**
