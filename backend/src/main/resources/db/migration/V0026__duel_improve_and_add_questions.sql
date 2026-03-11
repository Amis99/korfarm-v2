-- ============================================================
-- V0026: 대결 문제 개선 및 추가 (서버당 10문제씩 총 40문제 신규)
-- ============================================================
-- 변경 사항:
--   1) 기존 문제 5건 수정 (오답지 개선, 카테고리 변경)
--   2) 서버별 10문제씩 총 40문제 추가 (상위 난이도)
--      - saussure: 초3 수준 추가
--      - frege: 초5~6 수준 추가
--      - russell: 중3 수준 추가
--      - wittgenstein: 수능 고난도 추가
-- ============================================================

-- ============================================================
-- [A] 기존 문제 수정 (5건)
-- ============================================================

-- (1) saussure_vocab_005: "빨간 과일" → "나무에 열리는 둥근 과일" (청사과도 있으므로)
UPDATE duel_question_pool
SET question_json = '{"id":"dq_saussure_vocab_005","serverId":"saussure","questionType":"QUIZ","category":"VOCAB","stem":"사과는 어떤 뜻일까요?","passage":null,"choices":[{"id":"A","text":"나무에 열리는 둥근 과일"},{"id":"B","text":"파란 꽃"},{"id":"C","text":"노란 채소"},{"id":"D","text":"초록 나무"}],"answerId":"A","timeLimitSec":30}',
    updated_at = NOW()
WHERE id = 'dq_saussure_vocab_005';

-- (2) saussure_vocab_003: 맞춤법 문제 → 카테고리 VOCAB → CONCEPT으로 변경
UPDATE duel_question_pool
SET category = 'CONCEPT',
    question_json = '{"id":"dq_saussure_vocab_003","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"맞춤법이 바른 것은?","passage":null,"choices":[{"id":"A","text":"안녕히"},{"id":"B","text":"안녕이"},{"id":"C","text":"안영히"},{"id":"D","text":"안영이"}],"answerId":"A","timeLimitSec":30}',
    updated_at = NOW()
WHERE id = 'dq_saussure_vocab_003';

-- (3) saussure_vocab_007: 맞춤법 문제 → 카테고리 VOCAB → CONCEPT으로 변경
UPDATE duel_question_pool
SET category = 'CONCEPT',
    question_json = '{"id":"dq_saussure_vocab_007","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"맞춤법이 바른 것은?","passage":null,"choices":[{"id":"A","text":"곰곰히"},{"id":"B","text":"곰곰이"},{"id":"C","text":"곰고미"},{"id":"D","text":"곰꼼이"}],"answerId":"B","timeLimitSec":30}',
    updated_at = NOW()
WHERE id = 'dq_saussure_vocab_007';

-- (4) saussure_sentence_001: 오답지 개선 — 봄 지문에 혼동 가능한 오답으로 교체
UPDATE duel_question_pool
SET question_json = '{"id":"dq_saussure_sentence_001","serverId":"saussure","questionType":"READING","category":"SENTENCE","stem":"이 글의 주제로 알맞은 것은?","passage":"봄이 되면 꽃이 피고 새가 노래합니다. 따뜻한 바람이 불면 사람들은 공원에 나와 산책을 합니다.","choices":[{"id":"A","text":"봄의 모습"},{"id":"B","text":"꽃을 심는 방법"},{"id":"C","text":"새가 노래하는 이유"},{"id":"D","text":"공원의 위치"}],"answerId":"A","timeLimitSec":45}',
    updated_at = NOW()
WHERE id = 'dq_saussure_sentence_001';

-- (5) saussure_sentence_007: 오답지 개선 — 동물 하루 패턴 대신 혼동 가능한 오답
UPDATE duel_question_pool
SET question_json = '{"id":"dq_saussure_sentence_007","serverId":"saussure","questionType":"READING","category":"SENTENCE","stem":"이 글의 주제는?","passage":"고양이는 낮에 잠을 많이 잡니다. 밤이 되면 눈이 반짝이며 돌아다닙니다.","choices":[{"id":"A","text":"고양이의 하루"},{"id":"B","text":"고양이가 좋아하는 음식"},{"id":"C","text":"고양이를 키우는 방법"},{"id":"D","text":"고양이의 종류"}],"answerId":"A","timeLimitSec":45}',
    updated_at = NOW()
WHERE id = 'dq_saussure_sentence_007';


-- ============================================================
-- [B] 소쉬르 신규 10문제 (초3 수준)
-- ============================================================

-- VOCAB 2문제: 초3 추상어
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_vocab_011', 'saussure', 'QUIZ', 'VOCAB', '{"id":"dq_saussure_vocab_011","serverId":"saussure","questionType":"QUIZ","category":"VOCAB","stem":"정성이라는 말의 뜻으로 알맞은 것은?","passage":null,"choices":[{"id":"A","text":"마음을 다하여 힘씀"},{"id":"B","text":"빠르게 달리기"},{"id":"C","text":"크게 소리 지르기"},{"id":"D","text":"혼자서 놀기"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_vocab_012', 'saussure', 'QUIZ', 'VOCAB', '{"id":"dq_saussure_vocab_012","serverId":"saussure","questionType":"QUIZ","category":"VOCAB","stem":"양보라는 말의 뜻으로 알맞은 것은?","passage":null,"choices":[{"id":"A","text":"남에게 먼저 차례를 넘겨주는 것"},{"id":"B","text":"혼자서 먼저 하는 것"},{"id":"C","text":"물건을 빌리는 것"},{"id":"D","text":"친구와 싸우는 것"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- BACKGROUND 2문제: 사고력을 요하는 속담
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_background_011', 'saussure', 'QUIZ', 'BACKGROUND', '{"id":"dq_saussure_background_011","serverId":"saussure","questionType":"QUIZ","category":"BACKGROUND","stem":"소 잃고 외양간 고친다는 무슨 뜻일까요?","passage":null,"choices":[{"id":"A","text":"일이 잘못된 뒤에 뒤늦게 손을 쓴다"},{"id":"B","text":"소를 잘 키워야 한다"},{"id":"C","text":"외양간을 자주 고쳐야 한다"},{"id":"D","text":"소가 외양간을 좋아한다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_background_012', 'saussure', 'QUIZ', 'BACKGROUND', '{"id":"dq_saussure_background_012","serverId":"saussure","questionType":"QUIZ","category":"BACKGROUND","stem":"등잔 밑이 어둡다는 무슨 뜻일까요?","passage":null,"choices":[{"id":"A","text":"가까이 있는 것을 오히려 모른다"},{"id":"B","text":"등잔 아래는 항상 깨끗하다"},{"id":"C","text":"불을 켜면 밝아진다"},{"id":"D","text":"어두운 곳에 등잔을 놓아야 한다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- CONCEPT 3문제: 초3 문법 (주어/서술어, 문장 종류)
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_concept_011', 'saussure', 'QUIZ', 'CONCEPT', '{"id":"dq_saussure_concept_011","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"꽃이 활짝 피었다에서 주어는 무엇인가요?","passage":null,"choices":[{"id":"A","text":"꽃이"},{"id":"B","text":"활짝"},{"id":"C","text":"피었다"},{"id":"D","text":"꽃이 활짝"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_concept_012', 'saussure', 'QUIZ', 'CONCEPT', '{"id":"dq_saussure_concept_012","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"밥 먹어라!는 어떤 종류의 문장인가요?","passage":null,"choices":[{"id":"A","text":"명령문"},{"id":"B","text":"평서문"},{"id":"C","text":"의문문"},{"id":"D","text":"감탄문"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_concept_013', 'saussure', 'QUIZ', 'CONCEPT', '{"id":"dq_saussure_concept_013","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"아, 정말 아름답구나!는 어떤 종류의 문장인가요?","passage":null,"choices":[{"id":"A","text":"감탄문"},{"id":"B","text":"평서문"},{"id":"C","text":"명령문"},{"id":"D","text":"의문문"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- SENTENCE 2문제: 추론형 독해
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_sentence_011', 'saussure', 'READING', 'SENTENCE', '{"id":"dq_saussure_sentence_011","serverId":"saussure","questionType":"READING","category":"SENTENCE","stem":"이 글을 읽고 알 수 있는 것은?","passage":"민지는 우산을 들고 학교에 갔습니다. 하지만 집에 올 때는 우산을 접어서 가방에 넣었습니다.","choices":[{"id":"A","text":"집에 올 때는 비가 그쳤다"},{"id":"B","text":"민지는 우산을 잃어버렸다"},{"id":"C","text":"하루 종일 비가 왔다"},{"id":"D","text":"민지는 우산이 없었다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_sentence_012', 'saussure', 'READING', 'SENTENCE', '{"id":"dq_saussure_sentence_012","serverId":"saussure","questionType":"READING","category":"SENTENCE","stem":"이 글 다음에 이어질 내용으로 알맞은 것은?","passage":"준수는 빈 화분에 씨앗을 심었습니다. 매일 물을 주고 햇빛이 잘 드는 곳에 놓았습니다.","choices":[{"id":"A","text":"씨앗에서 싹이 나기 시작했다"},{"id":"B","text":"준수는 화분을 버렸다"},{"id":"C","text":"비가 많이 와서 홍수가 났다"},{"id":"D","text":"준수는 물을 주지 않았다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

-- DETAIL 1문제: 오답지가 헷갈리는 세부사항
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_detail_011', 'saussure', 'READING', 'DETAIL', '{"id":"dq_saussure_detail_011","serverId":"saussure","questionType":"READING","category":"DETAIL","stem":"글의 내용과 다른 것은?","passage":"현우네 반은 체험학습으로 동물원에 갔습니다. 사자, 기린, 코끼리를 보았습니다. 점심으로 김밥을 먹었습니다.","choices":[{"id":"A","text":"체험학습으로 동물원에 갔다"},{"id":"B","text":"호랑이를 보았다"},{"id":"C","text":"코끼리를 보았다"},{"id":"D","text":"김밥을 먹었다"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());


-- ============================================================
-- [C] 프레게 신규 10문제 (초5~6 수준)
-- ============================================================

-- VOCAB 2문제: 한자어/관용어
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_vocab_011', 'frege', 'QUIZ', 'VOCAB', '{"id":"dq_frege_vocab_011","serverId":"frege","questionType":"QUIZ","category":"VOCAB","stem":"조예(造詣)가 깊다의 뜻으로 알맞은 것은?","passage":null,"choices":[{"id":"A","text":"어떤 분야에 대한 지식이나 기술이 뛰어나다"},{"id":"B","text":"물건을 만드는 솜씨가 좋다"},{"id":"C","text":"인사를 잘한다"},{"id":"D","text":"깊은 곳까지 들어간다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_vocab_012', 'frege', 'QUIZ', 'VOCAB', '{"id":"dq_frege_vocab_012","serverId":"frege","questionType":"QUIZ","category":"VOCAB","stem":"심혈(心血)을 기울이다의 뜻으로 알맞은 것은?","passage":null,"choices":[{"id":"A","text":"마음과 정성을 다하여 노력하다"},{"id":"B","text":"피가 많이 나다"},{"id":"C","text":"심장이 빨리 뛰다"},{"id":"D","text":"기울어진 것을 바로잡다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- BACKGROUND 2문제: 고전 문학 심화
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_background_011', 'frege', 'QUIZ', 'BACKGROUND', '{"id":"dq_frege_background_011","serverId":"frege","questionType":"QUIZ","category":"BACKGROUND","stem":"춘향전에서 이몽룡이 암행어사가 되어 처벌한 인물은?","passage":null,"choices":[{"id":"A","text":"변학도"},{"id":"B","text":"심봉사"},{"id":"C","text":"흥부"},{"id":"D","text":"홍길동"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_background_012', 'frege', 'QUIZ', 'BACKGROUND', '{"id":"dq_frege_background_012","serverId":"frege","questionType":"QUIZ","category":"BACKGROUND","stem":"심청전에서 심청이 빠진 곳은 어디인가요?","passage":null,"choices":[{"id":"A","text":"인당수"},{"id":"B","text":"한강"},{"id":"C","text":"동해"},{"id":"D","text":"낙동강"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- CONCEPT 3문제: 피동/사동, 복합문, 표준어 규정
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_concept_011', 'frege', 'QUIZ', 'CONCEPT', '{"id":"dq_frege_concept_011","serverId":"frege","questionType":"QUIZ","category":"CONCEPT","stem":"다음 중 피동 표현이 바르게 쓰인 문장은?","passage":null,"choices":[{"id":"A","text":"문이 열렸다"},{"id":"B","text":"문이 열려졌다"},{"id":"C","text":"문을 열려졌다"},{"id":"D","text":"문이 열어졌다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_concept_012', 'frege', 'QUIZ', 'CONCEPT', '{"id":"dq_frege_concept_012","serverId":"frege","questionType":"QUIZ","category":"CONCEPT","stem":"비가 오고 바람이 분다는 어떤 문장인가요?","passage":null,"choices":[{"id":"A","text":"겹문장(이어진문장)"},{"id":"B","text":"홑문장"},{"id":"C","text":"인용문"},{"id":"D","text":"감탄문"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_concept_013', 'frege', 'QUIZ', 'CONCEPT', '{"id":"dq_frege_concept_013","serverId":"frege","questionType":"QUIZ","category":"CONCEPT","stem":"다음 중 표준어가 아닌 것은?","passage":null,"choices":[{"id":"A","text":"오랫만에"},{"id":"B","text":"오랜만에"},{"id":"C","text":"A와 B 모두 표준어"},{"id":"D","text":"A와 B 모두 표준어가 아님"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- SENTENCE 2문제: 글의 목적/의도 파악
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_sentence_011', 'frege', 'READING', 'SENTENCE', '{"id":"dq_frege_sentence_011","serverId":"frege","questionType":"READING","category":"SENTENCE","stem":"이 글을 쓴 목적으로 가장 알맞은 것은?","passage":"우리 학교 도서관에 새 책이 들어왔습니다. 점심시간에 도서관을 방문하여 좋은 책을 빌려 읽어 보세요. 독서는 여러분의 생각을 넓혀 줍니다.","choices":[{"id":"A","text":"도서관 이용을 권유하려고"},{"id":"B","text":"새 책의 가격을 알리려고"},{"id":"C","text":"도서관 규칙을 설명하려고"},{"id":"D","text":"점심 메뉴를 안내하려고"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_sentence_012', 'frege', 'READING', 'SENTENCE', '{"id":"dq_frege_sentence_012","serverId":"frege","questionType":"READING","category":"SENTENCE","stem":"글쓴이의 의견으로 알맞은 것은?","passage":"요즘 학생들은 스마트폰을 너무 많이 사용합니다. 눈 건강도 나빠지고 공부에 집중하기도 어렵습니다. 하루에 사용 시간을 정해 두고 쓰는 것이 좋겠습니다.","choices":[{"id":"A","text":"스마트폰 사용 시간을 정해야 한다"},{"id":"B","text":"스마트폰을 절대 쓰면 안 된다"},{"id":"C","text":"스마트폰은 눈에 좋다"},{"id":"D","text":"공부할 때 스마트폰이 도움이 된다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

-- DETAIL 1문제: 도표/그래프 독해
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_detail_011', 'frege', 'READING', 'DETAIL', '{"id":"dq_frege_detail_011","serverId":"frege","questionType":"READING","category":"DETAIL","stem":"다음 설명과 다른 것은?","passage":"[우리 반 좋아하는 계절 조사] 봄: 8명, 여름: 12명, 가을: 6명, 겨울: 4명. 총 30명을 대상으로 조사하였다.","choices":[{"id":"A","text":"가장 인기 있는 계절은 여름이다"},{"id":"B","text":"봄을 좋아하는 학생은 8명이다"},{"id":"C","text":"겨울을 좋아하는 학생이 가장 적다"},{"id":"D","text":"가을을 좋아하는 학생이 10명이다"}],"answerId":"D","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());


-- ============================================================
-- [D] 러셀 신규 10문제 (중3 수준)
-- ============================================================

-- VOCAB 2문제: 수능 빈출 한자어
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_vocab_011', 'russell', 'QUIZ', 'VOCAB', '{"id":"dq_russell_vocab_011","serverId":"russell","questionType":"QUIZ","category":"VOCAB","stem":"역설적(逆說的)이라는 말의 뜻으로 알맞은 것은?","passage":null,"choices":[{"id":"A","text":"겉으로는 모순되어 보이나 그 속에 진리가 담겨 있는"},{"id":"B","text":"역사적으로 중요한"},{"id":"C","text":"말을 거꾸로 하는"},{"id":"D","text":"설명이 자세한"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_vocab_012', 'russell', 'QUIZ', 'VOCAB', '{"id":"dq_russell_vocab_012","serverId":"russell","questionType":"QUIZ","category":"VOCAB","stem":"함의(含意)라는 말의 뜻으로 알맞은 것은?","passage":null,"choices":[{"id":"A","text":"말이나 글 속에 담겨 있는 뜻"},{"id":"B","text":"함께 의논하는 것"},{"id":"C","text":"소리를 참는 것"},{"id":"D","text":"의미가 없는 것"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- BACKGROUND 2문제: 근현대 문학사
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_background_011', 'russell', 'QUIZ', 'BACKGROUND', '{"id":"dq_russell_background_011","serverId":"russell","questionType":"QUIZ","category":"BACKGROUND","stem":"광야의 작가로, 일제강점기 저항시인으로 알려진 시인은?","passage":null,"choices":[{"id":"A","text":"이육사"},{"id":"B","text":"김소월"},{"id":"C","text":"윤동주"},{"id":"D","text":"한용운"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_background_012', 'russell', 'QUIZ', 'BACKGROUND', '{"id":"dq_russell_background_012","serverId":"russell","questionType":"QUIZ","category":"BACKGROUND","stem":"나와 나타샤와 흰 당나귀, 여우난골족 등의 작품으로 알려진 시인은?","passage":null,"choices":[{"id":"A","text":"백석"},{"id":"B","text":"정지용"},{"id":"C","text":"서정주"},{"id":"D","text":"이상"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- CONCEPT 3문제: 음운변동 심화, 문장 성분, 담화 구조
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_concept_011', 'russell', 'QUIZ', 'CONCEPT', '{"id":"dq_russell_concept_011","serverId":"russell","questionType":"QUIZ","category":"CONCEPT","stem":"놓다 [노타]에서 일어나는 음운 변동은?","passage":null,"choices":[{"id":"A","text":"거센소리되기(축약)"},{"id":"B","text":"된소리되기(경음화)"},{"id":"C","text":"비음화"},{"id":"D","text":"구개음화"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_concept_012', 'russell', 'QUIZ', 'CONCEPT', '{"id":"dq_russell_concept_012","serverId":"russell","questionType":"QUIZ","category":"CONCEPT","stem":"꽃이 아주 예쁘다에서 아주의 문장 성분은?","passage":null,"choices":[{"id":"A","text":"부사어"},{"id":"B","text":"관형어"},{"id":"C","text":"목적어"},{"id":"D","text":"보어"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_concept_013', 'russell', 'QUIZ', 'CONCEPT', '{"id":"dq_russell_concept_013","serverId":"russell","questionType":"QUIZ","category":"CONCEPT","stem":"다음 중 모음 탈락에 해당하는 예는?","passage":null,"choices":[{"id":"A","text":"쓰 + 어 → 써"},{"id":"B","text":"놓 + 다 → [노타]"},{"id":"C","text":"꽃 + 밭 → [꼳빧]"},{"id":"D","text":"국 + 물 → [궁물]"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- SENTENCE 1문제: 논증 구조 파악
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_sentence_011', 'russell', 'READING', 'SENTENCE', '{"id":"dq_russell_sentence_011","serverId":"russell","questionType":"READING","category":"SENTENCE","stem":"이 글의 논증 방식으로 가장 알맞은 것은?","passage":"모든 포유류는 허파로 숨을 쉰다. 고래는 포유류이다. 그러므로 고래는 허파로 숨을 쉰다.","choices":[{"id":"A","text":"연역 논증"},{"id":"B","text":"귀납 논증"},{"id":"C","text":"유추"},{"id":"D","text":"통계적 추론"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

-- DETAIL 2문제: 혼동하기 쉬운 오답 포함
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_detail_011', 'russell', 'READING', 'DETAIL', '{"id":"dq_russell_detail_011","serverId":"russell","questionType":"READING","category":"DETAIL","stem":"이 글의 내용과 일치하지 않는 것은?","passage":"한글은 1443년에 창제되어 1446년에 반포되었다. 세종대왕이 집현전 학자들과 함께 만들었으며, 처음 이름은 훈민정음이었다. 자음 17자, 모음 11자로 총 28자였다.","choices":[{"id":"A","text":"한글은 1443년에 반포되었다"},{"id":"B","text":"세종대왕이 만들었다"},{"id":"C","text":"처음 이름은 훈민정음이었다"},{"id":"D","text":"처음에 총 28자였다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_detail_012', 'russell', 'READING', 'DETAIL', '{"id":"dq_russell_detail_012","serverId":"russell","questionType":"READING","category":"DETAIL","stem":"이 글의 내용과 일치하는 것은?","passage":"판소리는 소리꾼이 북잡이의 장단에 맞추어 이야기를 노래로 풀어내는 공연 예술이다. 현재 전해지는 판소리는 춘향가, 심청가, 흥보가, 적벽가, 수궁가의 다섯 마당이다.","choices":[{"id":"A","text":"현재 전해지는 판소리는 다섯 마당이다"},{"id":"B","text":"판소리는 두 사람이 함께 노래한다"},{"id":"C","text":"장단은 소리꾼이 직접 맞춘다"},{"id":"D","text":"현재 전해지는 판소리는 여섯 마당이다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());


-- ============================================================
-- [E] 비트겐슈타인 신규 10문제 (수능 고난도)
-- ============================================================

-- VOCAB 2문제: 고급 학술 용어
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_vocab_011', 'wittgenstein', 'QUIZ', 'VOCAB', '{"id":"dq_wittgenstein_vocab_011","serverId":"wittgenstein","questionType":"QUIZ","category":"VOCAB","stem":"공리(公理)의 뜻으로 알맞은 것은?","passage":null,"choices":[{"id":"A","text":"증명 없이 참으로 받아들이는 기본 명제"},{"id":"B","text":"공적인 이익"},{"id":"C","text":"여러 사람이 인정하는 도리"},{"id":"D","text":"공공의 법률"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_vocab_012', 'wittgenstein', 'QUIZ', 'VOCAB', '{"id":"dq_wittgenstein_vocab_012","serverId":"wittgenstein","questionType":"QUIZ","category":"VOCAB","stem":"패러다임(paradigm)의 뜻으로 알맞은 것은?","passage":null,"choices":[{"id":"A","text":"한 시대의 사람들의 견해나 사고를 지배하는 인식의 체계"},{"id":"B","text":"새로운 발명품"},{"id":"C","text":"과거의 유물"},{"id":"D","text":"실험 도구의 일종"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- BACKGROUND 2문제: 비평 이론/철학적 배경
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_background_011', 'wittgenstein', 'QUIZ', 'BACKGROUND', '{"id":"dq_wittgenstein_background_011","serverId":"wittgenstein","questionType":"QUIZ","category":"BACKGROUND","stem":"독자의 능동적 역할을 강조하며, 텍스트의 의미는 독자의 읽기 과정에서 생성된다고 보는 문학 이론은?","passage":null,"choices":[{"id":"A","text":"수용미학"},{"id":"B","text":"구조주의"},{"id":"C","text":"형식주의"},{"id":"D","text":"자연주의"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_background_012', 'wittgenstein', 'QUIZ', 'BACKGROUND', '{"id":"dq_wittgenstein_background_012","serverId":"wittgenstein","questionType":"QUIZ","category":"BACKGROUND","stem":"데리다가 주창한 것으로, 텍스트에 고정된 의미란 없으며 의미는 끊임없이 지연된다고 보는 사상은?","passage":null,"choices":[{"id":"A","text":"해체주의"},{"id":"B","text":"실존주의"},{"id":"C","text":"낭만주의"},{"id":"D","text":"사실주의"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- CONCEPT 3문제: 중세 국어, 통사론, 화용론
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_concept_011', 'wittgenstein', 'QUIZ', 'CONCEPT', '{"id":"dq_wittgenstein_concept_011","serverId":"wittgenstein","questionType":"QUIZ","category":"CONCEPT","stem":"중세 국어에서 방점(傍點)의 기능은?","passage":null,"choices":[{"id":"A","text":"성조(소리의 높낮이)를 표시"},{"id":"B","text":"띄어쓰기를 표시"},{"id":"C","text":"문장의 끝을 표시"},{"id":"D","text":"존칭을 표시"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_concept_012', 'wittgenstein', 'QUIZ', 'CONCEPT', '{"id":"dq_wittgenstein_concept_012","serverId":"wittgenstein","questionType":"QUIZ","category":"CONCEPT","stem":"나는 [그가 범인이라고] 생각한다에서 대괄호 부분은 어떤 문장 성분인가요?","passage":null,"choices":[{"id":"A","text":"명사절(내포문)"},{"id":"B","text":"관형절"},{"id":"C","text":"부사절"},{"id":"D","text":"인용절"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_concept_013', 'wittgenstein', 'QUIZ', 'CONCEPT', '{"id":"dq_wittgenstein_concept_013","serverId":"wittgenstein","questionType":"QUIZ","category":"CONCEPT","stem":"여기 좀 춥지 않니?라는 발화가 창문을 닫아 달라는 의미로 해석될 때, 이 현상을 설명하는 화용론 개념은?","passage":null,"choices":[{"id":"A","text":"간접 화행"},{"id":"B","text":"직접 화행"},{"id":"C","text":"전제"},{"id":"D","text":"함축의 취소"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- SENTENCE 2문제: 복합 논증, 비판적 사고
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_sentence_011', 'wittgenstein', 'READING', 'SENTENCE', '{"id":"dq_wittgenstein_sentence_011","serverId":"wittgenstein","questionType":"READING","category":"SENTENCE","stem":"이 글의 논지를 약화하는 것은?","passage":"인공지능은 방대한 데이터를 빠르게 분석할 수 있으므로, 미래 의료 분야에서 의사보다 정확한 진단을 내릴 것이다.","choices":[{"id":"A","text":"의료 진단에는 환자와의 공감과 맥락 판단이 필수적이다"},{"id":"B","text":"인공지능의 데이터 처리 속도는 매우 빠르다"},{"id":"C","text":"이미 일부 영상 판독에서 AI가 활용되고 있다"},{"id":"D","text":"데이터 분석 기술은 계속 발전하고 있다"}],"answerId":"A","timeLimitSec":60}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_sentence_012', 'wittgenstein', 'READING', 'SENTENCE', '{"id":"dq_wittgenstein_sentence_012","serverId":"wittgenstein","questionType":"READING","category":"SENTENCE","stem":"글쓴이가 사용한 논증 전략으로 가장 적절한 것은?","passage":"자유 무역은 비교 우위론에 따라 모든 참여국의 후생을 증가시킨다고 주장된다. 그러나 역사적으로 자유 무역 이후 개발도상국의 제조업 기반이 약화된 사례가 다수 존재한다.","choices":[{"id":"A","text":"반례를 들어 기존 주장의 한계를 지적하고 있다"},{"id":"B","text":"전문가의 권위에 호소하고 있다"},{"id":"C","text":"비유를 통해 독자의 이해를 돕고 있다"},{"id":"D","text":"두 이론을 절충하여 새로운 대안을 제시하고 있다"}],"answerId":"A","timeLimitSec":60}', 'ACTIVE', NOW(), NOW());

-- DETAIL 1문제: 긴 지문 + 세밀한 추론
INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_detail_011', 'wittgenstein', 'READING', 'DETAIL', '{"id":"dq_wittgenstein_detail_011","serverId":"wittgenstein","questionType":"READING","category":"DETAIL","stem":"이 글을 바탕으로 추론한 내용으로 적절하지 않은 것은?","passage":"소쉬르는 언어 기호가 기표(signifiant)와 기의(signifié)로 이루어져 있으며, 이 둘의 관계는 자의적(arbitrary)이라고 보았다. 즉 나무라는 소리와 실제 나무 사이에는 필연적 연결이 없다. 이후 퍼스는 기호를 도상(icon), 지표(index), 상징(symbol)의 세 유형으로 나누어, 기호와 대상의 관계가 항상 자의적인 것은 아님을 보였다.","choices":[{"id":"A","text":"소쉬르에 따르면 모든 언어 기호의 기표와 기의 관계는 필연적이다"},{"id":"B","text":"퍼스는 기호와 대상의 관계에 다양한 유형이 있다고 보았다"},{"id":"C","text":"소쉬르의 이론에서 나무라는 소리는 기표에 해당한다"},{"id":"D","text":"퍼스의 도상 기호는 대상과의 유사성에 기반한다"}],"answerId":"A","timeLimitSec":60}', 'ACTIVE', NOW(), NOW());
