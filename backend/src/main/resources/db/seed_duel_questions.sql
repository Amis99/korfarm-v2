-- ============================================================
-- 대결 문제 초기 데이터 (duel_question_pool)
-- ============================================================
-- 서버별 각 50문제, 총 200문제
--
-- 서버 구성:
--   saussure     : 초등 저학년 (1~2학년) 수준
--   frege        : 초등 고학년 (3~6학년) 수준
--   russell      : 중학교 수준
--   wittgenstein : 고등학교 수준
--
-- 카테고리별 구성 (서버당):
--   QUIZ / VOCAB       : 10문제 (어휘)
--   QUIZ / BACKGROUND  : 10문제 (배경지식)
--   QUIZ / CONCEPT     : 10문제 (국어 개념)
--   READING / SENTENCE : 10문제 (문장 독해)
--   READING / DETAIL   : 10문제 (세부사항 파악)
-- ============================================================

-- ============================================================
-- [1] saussure 서버 (초등 저학년 1~2학년 수준)
-- ============================================================

-- ----------------------------------------------------------
-- saussure / QUIZ / VOCAB (어휘 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_vocab_001', 'saussure', 'QUIZ', 'VOCAB', '{"id":"dq_saussure_vocab_001","serverId":"saussure","questionType":"QUIZ","category":"VOCAB","stem":"다음 중 기쁘다와 비슷한 뜻은?","passage":null,"choices":[{"id":"A","text":"즐겁다"},{"id":"B","text":"슬프다"},{"id":"C","text":"무겁다"},{"id":"D","text":"빠르다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_vocab_002', 'saussure', 'QUIZ', 'VOCAB', '{"id":"dq_saussure_vocab_002","serverId":"saussure","questionType":"QUIZ","category":"VOCAB","stem":"다음 중 크다의 반대말은?","passage":null,"choices":[{"id":"A","text":"높다"},{"id":"B","text":"작다"},{"id":"C","text":"넓다"},{"id":"D","text":"길다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_vocab_003', 'saussure', 'QUIZ', 'VOCAB', '{"id":"dq_saussure_vocab_003","serverId":"saussure","questionType":"QUIZ","category":"VOCAB","stem":"맞춤법이 바른 것은?","passage":null,"choices":[{"id":"A","text":"안녕히"},{"id":"B","text":"안녕이"},{"id":"C","text":"안영히"},{"id":"D","text":"안영이"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_vocab_004', 'saussure', 'QUIZ', 'VOCAB', '{"id":"dq_saussure_vocab_004","serverId":"saussure","questionType":"QUIZ","category":"VOCAB","stem":"다음 중 춥다와 반대되는 말은?","passage":null,"choices":[{"id":"A","text":"덥다"},{"id":"B","text":"높다"},{"id":"C","text":"멀다"},{"id":"D","text":"깊다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_vocab_005', 'saussure', 'QUIZ', 'VOCAB', '{"id":"dq_saussure_vocab_005","serverId":"saussure","questionType":"QUIZ","category":"VOCAB","stem":"사과는 어떤 뜻일까요?","passage":null,"choices":[{"id":"A","text":"빨간 과일"},{"id":"B","text":"파란 꽃"},{"id":"C","text":"노란 채소"},{"id":"D","text":"초록 나무"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_vocab_006', 'saussure', 'QUIZ', 'VOCAB', '{"id":"dq_saussure_vocab_006","serverId":"saussure","questionType":"QUIZ","category":"VOCAB","stem":"다음 중 빠르다와 비슷한 뜻은?","passage":null,"choices":[{"id":"A","text":"느리다"},{"id":"B","text":"무겁다"},{"id":"C","text":"재빠르다"},{"id":"D","text":"조용하다"}],"answerId":"C","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_vocab_007', 'saussure', 'QUIZ', 'VOCAB', '{"id":"dq_saussure_vocab_007","serverId":"saussure","questionType":"QUIZ","category":"VOCAB","stem":"맞춤법이 바른 것은?","passage":null,"choices":[{"id":"A","text":"곰곰히"},{"id":"B","text":"곰곰이"},{"id":"C","text":"곰고미"},{"id":"D","text":"곰꼼이"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_vocab_008', 'saussure', 'QUIZ', 'VOCAB', '{"id":"dq_saussure_vocab_008","serverId":"saussure","questionType":"QUIZ","category":"VOCAB","stem":"다음 중 밝다의 반대말은?","passage":null,"choices":[{"id":"A","text":"어둡다"},{"id":"B","text":"넓다"},{"id":"C","text":"높다"},{"id":"D","text":"깊다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_vocab_009', 'saussure', 'QUIZ', 'VOCAB', '{"id":"dq_saussure_vocab_009","serverId":"saussure","questionType":"QUIZ","category":"VOCAB","stem":"나비는 무엇인가요?","passage":null,"choices":[{"id":"A","text":"물고기"},{"id":"B","text":"새"},{"id":"C","text":"곤충"},{"id":"D","text":"꽃"}],"answerId":"C","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_vocab_010', 'saussure', 'QUIZ', 'VOCAB', '{"id":"dq_saussure_vocab_010","serverId":"saussure","questionType":"QUIZ","category":"VOCAB","stem":"다음 중 예쁘다와 비슷한 뜻은?","passage":null,"choices":[{"id":"A","text":"무섭다"},{"id":"B","text":"아름답다"},{"id":"C","text":"시끄럽다"},{"id":"D","text":"무겁다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- saussure / QUIZ / BACKGROUND (배경지식 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_background_001', 'saussure', 'QUIZ', 'BACKGROUND', '{"id":"dq_saussure_background_001","serverId":"saussure","questionType":"QUIZ","category":"BACKGROUND","stem":"세 살 버릇 여든까지 간다는 무슨 뜻일까요?","passage":null,"choices":[{"id":"A","text":"어릴 때 습관이 오래간다"},{"id":"B","text":"세 살이 되면 잘 걷는다"},{"id":"C","text":"여든 살까지 살 수 있다"},{"id":"D","text":"버릇이 없으면 좋다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_background_002', 'saussure', 'QUIZ', 'BACKGROUND', '{"id":"dq_saussure_background_002","serverId":"saussure","questionType":"QUIZ","category":"BACKGROUND","stem":"콩 심은 데 콩 나고 팥 심은 데 팥 난다는 무슨 뜻일까요?","passage":null,"choices":[{"id":"A","text":"콩과 팥은 맛있다"},{"id":"B","text":"한 일의 결과는 원인에 따른다"},{"id":"C","text":"밭에서 농사를 짓는다"},{"id":"D","text":"콩과 팥을 함께 심는다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_background_003', 'saussure', 'QUIZ', 'BACKGROUND', '{"id":"dq_saussure_background_003","serverId":"saussure","questionType":"QUIZ","category":"BACKGROUND","stem":"가는 말이 고와야 오는 말이 곱다는 무슨 뜻일까요?","passage":null,"choices":[{"id":"A","text":"말을 빨리 해야 한다"},{"id":"B","text":"내가 남에게 잘해야 남도 나에게 잘한다"},{"id":"C","text":"말을 타고 가면 좋다"},{"id":"D","text":"예쁜 말만 해야 한다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_background_004', 'saussure', 'QUIZ', 'BACKGROUND', '{"id":"dq_saussure_background_004","serverId":"saussure","questionType":"QUIZ","category":"BACKGROUND","stem":"눈이 높다는 무슨 뜻일까요?","passage":null,"choices":[{"id":"A","text":"눈이 위에 있다"},{"id":"B","text":"기준이 까다롭다"},{"id":"C","text":"눈이 크다"},{"id":"D","text":"높은 곳을 본다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_background_005', 'saussure', 'QUIZ', 'BACKGROUND', '{"id":"dq_saussure_background_005","serverId":"saussure","questionType":"QUIZ","category":"BACKGROUND","stem":"발이 넓다는 무슨 뜻일까요?","passage":null,"choices":[{"id":"A","text":"발이 크다"},{"id":"B","text":"아는 사람이 많다"},{"id":"C","text":"신발이 크다"},{"id":"D","text":"많이 걷는다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_background_006', 'saussure', 'QUIZ', 'BACKGROUND', '{"id":"dq_saussure_background_006","serverId":"saussure","questionType":"QUIZ","category":"BACKGROUND","stem":"원숭이도 나무에서 떨어진다는 무슨 뜻일까요?","passage":null,"choices":[{"id":"A","text":"원숭이는 나무를 좋아한다"},{"id":"B","text":"아무리 잘하는 사람도 실수할 수 있다"},{"id":"C","text":"나무에서 떨어지면 아프다"},{"id":"D","text":"원숭이는 힘이 세다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_background_007', 'saussure', 'QUIZ', 'BACKGROUND', '{"id":"dq_saussure_background_007","serverId":"saussure","questionType":"QUIZ","category":"BACKGROUND","stem":"입이 짧다는 무슨 뜻일까요?","passage":null,"choices":[{"id":"A","text":"입이 작다"},{"id":"B","text":"말을 적게 한다"},{"id":"C","text":"음식을 가려 먹는다"},{"id":"D","text":"입술이 짧다"}],"answerId":"C","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_background_008', 'saussure', 'QUIZ', 'BACKGROUND', '{"id":"dq_saussure_background_008","serverId":"saussure","questionType":"QUIZ","category":"BACKGROUND","stem":"호랑이도 제 말 하면 온다는 무슨 뜻일까요?","passage":null,"choices":[{"id":"A","text":"호랑이는 무섭다"},{"id":"B","text":"남의 이야기를 하면 그 사람이 나타난다"},{"id":"C","text":"호랑이가 말을 한다"},{"id":"D","text":"말을 잘하면 좋다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_background_009', 'saussure', 'QUIZ', 'BACKGROUND', '{"id":"dq_saussure_background_009","serverId":"saussure","questionType":"QUIZ","category":"BACKGROUND","stem":"꿩 대신 닭은 무슨 뜻일까요?","passage":null,"choices":[{"id":"A","text":"꿩과 닭은 친구다"},{"id":"B","text":"꿩보다 닭이 맛있다"},{"id":"C","text":"원하는 것이 없으면 비슷한 것으로 대신한다"},{"id":"D","text":"닭이 꿩보다 크다"}],"answerId":"C","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_background_010', 'saussure', 'QUIZ', 'BACKGROUND', '{"id":"dq_saussure_background_010","serverId":"saussure","questionType":"QUIZ","category":"BACKGROUND","stem":"귀가 얇다는 무슨 뜻일까요?","passage":null,"choices":[{"id":"A","text":"귀가 작다"},{"id":"B","text":"남의 말을 잘 믿는다"},{"id":"C","text":"귀가 예쁘다"},{"id":"D","text":"잘 안 들린다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- saussure / QUIZ / CONCEPT (국어 개념 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_concept_001', 'saussure', 'QUIZ', 'CONCEPT', '{"id":"dq_saussure_concept_001","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"사람, 동물, 물건의 이름을 나타내는 말을 무엇이라고 할까요?","passage":null,"choices":[{"id":"A","text":"이름씨(명사)"},{"id":"B","text":"움직씨(동사)"},{"id":"C","text":"그림씨(형용사)"},{"id":"D","text":"어찌씨(부사)"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_concept_002', 'saussure', 'QUIZ', 'CONCEPT', '{"id":"dq_saussure_concept_002","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"달리다, 먹다, 자다처럼 움직임을 나타내는 말은?","passage":null,"choices":[{"id":"A","text":"이름씨(명사)"},{"id":"B","text":"움직씨(동사)"},{"id":"C","text":"그림씨(형용사)"},{"id":"D","text":"토씨(조사)"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_concept_003', 'saussure', 'QUIZ', 'CONCEPT', '{"id":"dq_saussure_concept_003","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"글의 첫 문장에서 칸을 띄어 쓰는 것을 무엇이라고 할까요?","passage":null,"choices":[{"id":"A","text":"들여쓰기"},{"id":"B","text":"줄바꿈"},{"id":"C","text":"띄어쓰기"},{"id":"D","text":"맞춤법"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_concept_004', 'saussure', 'QUIZ', 'CONCEPT', '{"id":"dq_saussure_concept_004","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"문장 끝에 찍는 점(.)을 무엇이라고 할까요?","passage":null,"choices":[{"id":"A","text":"쉼표"},{"id":"B","text":"마침표"},{"id":"C","text":"물음표"},{"id":"D","text":"느낌표"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_concept_005', 'saussure', 'QUIZ', 'CONCEPT', '{"id":"dq_saussure_concept_005","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"궁금한 것을 물어볼 때 문장 끝에 쓰는 것은?","passage":null,"choices":[{"id":"A","text":"마침표(.)"},{"id":"B","text":"느낌표(!)"},{"id":"C","text":"물음표(?)"},{"id":"D","text":"쉼표(,)"}],"answerId":"C","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_concept_006', 'saussure', 'QUIZ', 'CONCEPT', '{"id":"dq_saussure_concept_006","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"예쁘다, 크다, 작다처럼 모양이나 상태를 나타내는 말은?","passage":null,"choices":[{"id":"A","text":"움직씨(동사)"},{"id":"B","text":"그림씨(형용사)"},{"id":"C","text":"이름씨(명사)"},{"id":"D","text":"어찌씨(부사)"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_concept_007', 'saussure', 'QUIZ', 'CONCEPT', '{"id":"dq_saussure_concept_007","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"나는 학교에 간다에서 나는 무엇을 나타내나요?","passage":null,"choices":[{"id":"A","text":"장소"},{"id":"B","text":"행동하는 사람"},{"id":"C","text":"시간"},{"id":"D","text":"물건"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_concept_008', 'saussure', 'QUIZ', 'CONCEPT', '{"id":"dq_saussure_concept_008","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"받침이 있는 글자는 어느 것일까요?","passage":null,"choices":[{"id":"A","text":"나"},{"id":"B","text":"무"},{"id":"C","text":"강"},{"id":"D","text":"아"}],"answerId":"C","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_concept_009', 'saussure', 'QUIZ', 'CONCEPT', '{"id":"dq_saussure_concept_009","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"ㄱ, ㄴ, ㄷ, ㄹ은 무엇일까요?","passage":null,"choices":[{"id":"A","text":"모음"},{"id":"B","text":"자음"},{"id":"C","text":"받침"},{"id":"D","text":"문장"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_concept_010', 'saussure', 'QUIZ', 'CONCEPT', '{"id":"dq_saussure_concept_010","serverId":"saussure","questionType":"QUIZ","category":"CONCEPT","stem":"ㅏ, ㅓ, ㅗ, ㅜ는 무엇일까요?","passage":null,"choices":[{"id":"A","text":"자음"},{"id":"B","text":"모음"},{"id":"C","text":"단어"},{"id":"D","text":"문장"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- saussure / READING / SENTENCE (문장 독해 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_sentence_001', 'saussure', 'READING', 'SENTENCE', '{"id":"dq_saussure_sentence_001","serverId":"saussure","questionType":"READING","category":"SENTENCE","stem":"이 글의 주제로 알맞은 것은?","passage":"봄이 되면 꽃이 피고 새가 노래합니다. 따뜻한 바람이 불면 사람들은 공원에 나와 산책을 합니다.","choices":[{"id":"A","text":"봄의 모습"},{"id":"B","text":"여름 휴가"},{"id":"C","text":"겨울 추위"},{"id":"D","text":"가을 단풍"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_sentence_002', 'saussure', 'READING', 'SENTENCE', '{"id":"dq_saussure_sentence_002","serverId":"saussure","questionType":"READING","category":"SENTENCE","stem":"이 글에서 말하고 싶은 것은?","passage":"우리 강아지는 산책을 아주 좋아합니다. 밖에 나가자고 하면 꼬리를 흔들며 뛰어옵니다.","choices":[{"id":"A","text":"강아지가 산책을 좋아한다"},{"id":"B","text":"강아지가 밥을 좋아한다"},{"id":"C","text":"강아지가 잠을 좋아한다"},{"id":"D","text":"강아지가 공부를 좋아한다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_sentence_003', 'saussure', 'READING', 'SENTENCE', '{"id":"dq_saussure_sentence_003","serverId":"saussure","questionType":"READING","category":"SENTENCE","stem":"이 글의 내용으로 알맞은 것은?","passage":"비가 오면 우산을 씁니다. 우산이 없으면 비를 맞아 옷이 젖습니다.","choices":[{"id":"A","text":"비가 오면 우산이 필요하다"},{"id":"B","text":"비가 오면 놀러 간다"},{"id":"C","text":"우산은 필요 없다"},{"id":"D","text":"옷이 젖으면 좋다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_sentence_004', 'saussure', 'READING', 'SENTENCE', '{"id":"dq_saussure_sentence_004","serverId":"saussure","questionType":"READING","category":"SENTENCE","stem":"이 글에서 알 수 있는 것은?","passage":"겨울이 되면 눈이 옵니다. 아이들은 눈사람을 만들고 눈싸움을 하며 즐겁게 놉니다.","choices":[{"id":"A","text":"겨울에 아이들이 눈놀이를 한다"},{"id":"B","text":"여름에 눈이 온다"},{"id":"C","text":"아이들이 공부를 한다"},{"id":"D","text":"겨울에 꽃이 핀다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_sentence_005', 'saussure', 'READING', 'SENTENCE', '{"id":"dq_saussure_sentence_005","serverId":"saussure","questionType":"READING","category":"SENTENCE","stem":"이 글의 중심 내용은?","passage":"나는 매일 아침 일찍 일어납니다. 세수를 하고 밥을 먹고 학교에 갑니다.","choices":[{"id":"A","text":"나의 아침 생활"},{"id":"B","text":"나의 저녁 생활"},{"id":"C","text":"학교 수업"},{"id":"D","text":"주말 계획"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_sentence_006', 'saussure', 'READING', 'SENTENCE', '{"id":"dq_saussure_sentence_006","serverId":"saussure","questionType":"READING","category":"SENTENCE","stem":"이 글에서 말하고 싶은 것은?","passage":"손을 자주 씻으면 감기에 잘 걸리지 않습니다. 밖에서 놀고 온 뒤에는 꼭 손을 씻어야 합니다.","choices":[{"id":"A","text":"손 씻기가 중요하다"},{"id":"B","text":"밖에서 놀면 안 된다"},{"id":"C","text":"감기에 걸리면 좋다"},{"id":"D","text":"손은 씻지 않아도 된다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_sentence_007', 'saussure', 'READING', 'SENTENCE', '{"id":"dq_saussure_sentence_007","serverId":"saussure","questionType":"READING","category":"SENTENCE","stem":"이 글의 주제는?","passage":"고양이는 낮에 잠을 많이 잡니다. 밤이 되면 눈이 반짝이며 돌아다닙니다.","choices":[{"id":"A","text":"고양이의 하루"},{"id":"B","text":"강아지의 하루"},{"id":"C","text":"새의 하루"},{"id":"D","text":"물고기의 하루"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_sentence_008', 'saussure', 'READING', 'SENTENCE', '{"id":"dq_saussure_sentence_008","serverId":"saussure","questionType":"READING","category":"SENTENCE","stem":"이 글의 중심 내용은?","passage":"도서관에서는 조용히 해야 합니다. 다른 사람이 책을 읽고 있기 때문입니다.","choices":[{"id":"A","text":"도서관 예절"},{"id":"B","text":"운동장 규칙"},{"id":"C","text":"교실 청소"},{"id":"D","text":"급식 시간"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_sentence_009', 'saussure', 'READING', 'SENTENCE', '{"id":"dq_saussure_sentence_009","serverId":"saussure","questionType":"READING","category":"SENTENCE","stem":"이 글에서 알 수 있는 것은?","passage":"해바라기는 해를 따라 고개를 돌립니다. 해가 뜨는 쪽을 바라보다가 해가 지면 고개를 숙입니다.","choices":[{"id":"A","text":"해바라기는 해를 따라 움직인다"},{"id":"B","text":"해바라기는 밤에 핀다"},{"id":"C","text":"해바라기는 물속에 산다"},{"id":"D","text":"해바라기는 겨울에 핀다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_sentence_010', 'saussure', 'READING', 'SENTENCE', '{"id":"dq_saussure_sentence_010","serverId":"saussure","questionType":"READING","category":"SENTENCE","stem":"이 글에서 말하는 것은?","passage":"우리 할머니는 이야기를 잘해 주십니다. 옛날이야기를 들으면 재미있고 잠이 잘 옵니다.","choices":[{"id":"A","text":"할머니의 이야기"},{"id":"B","text":"할아버지의 요리"},{"id":"C","text":"엄마의 노래"},{"id":"D","text":"아빠의 운동"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- saussure / READING / DETAIL (세부사항 파악 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_detail_001', 'saussure', 'READING', 'DETAIL', '{"id":"dq_saussure_detail_001","serverId":"saussure","questionType":"READING","category":"DETAIL","stem":"민수가 좋아하는 과일은 무엇인가요?","passage":"민수는 사과를 좋아합니다. 빨간 사과를 보면 기분이 좋아집니다. 매일 하나씩 먹습니다.","choices":[{"id":"A","text":"바나나"},{"id":"B","text":"사과"},{"id":"C","text":"포도"},{"id":"D","text":"수박"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_detail_002', 'saussure', 'READING', 'DETAIL', '{"id":"dq_saussure_detail_002","serverId":"saussure","questionType":"READING","category":"DETAIL","stem":"지은이는 어디에 갔나요?","passage":"오늘 나는 엄마와 함께 시장에 갔습니다. 시장에서 맛있는 떡볶이를 먹었습니다.","choices":[{"id":"A","text":"학교"},{"id":"B","text":"공원"},{"id":"C","text":"시장"},{"id":"D","text":"병원"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_detail_003', 'saussure', 'READING', 'DETAIL', '{"id":"dq_saussure_detail_003","serverId":"saussure","questionType":"READING","category":"DETAIL","stem":"토끼의 귀는 어떤가요?","passage":"토끼는 귀가 길고 꼬리가 짧습니다. 깡충깡충 뛰어다니며 당근을 좋아합니다.","choices":[{"id":"A","text":"짧다"},{"id":"B","text":"길다"},{"id":"C","text":"둥글다"},{"id":"D","text":"뾰족하다"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_detail_004', 'saussure', 'READING', 'DETAIL', '{"id":"dq_saussure_detail_004","serverId":"saussure","questionType":"READING","category":"DETAIL","stem":"글의 내용과 다른 것은?","passage":"수진이는 그림 그리기를 좋아합니다. 색연필로 꽃과 나비를 그렸습니다.","choices":[{"id":"A","text":"수진이는 그림을 좋아한다"},{"id":"B","text":"색연필로 그렸다"},{"id":"C","text":"꽃과 나비를 그렸다"},{"id":"D","text":"크레파스로 그렸다"}],"answerId":"D","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_detail_005', 'saussure', 'READING', 'DETAIL', '{"id":"dq_saussure_detail_005","serverId":"saussure","questionType":"READING","category":"DETAIL","stem":"준호는 몇 시에 일어났나요?","passage":"준호는 아침 7시에 일어났습니다. 세수를 하고 빵과 우유를 먹었습니다.","choices":[{"id":"A","text":"6시"},{"id":"B","text":"7시"},{"id":"C","text":"8시"},{"id":"D","text":"9시"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_detail_006', 'saussure', 'READING', 'DETAIL', '{"id":"dq_saussure_detail_006","serverId":"saussure","questionType":"READING","category":"DETAIL","stem":"글의 내용과 같은 것은?","passage":"하늘에 구름이 많습니다. 곧 비가 올 것 같습니다. 우산을 가져가야겠습니다.","choices":[{"id":"A","text":"하늘이 맑다"},{"id":"B","text":"눈이 온다"},{"id":"C","text":"구름이 많다"},{"id":"D","text":"바람이 분다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_detail_007', 'saussure', 'READING', 'DETAIL', '{"id":"dq_saussure_detail_007","serverId":"saussure","questionType":"READING","category":"DETAIL","stem":"영희가 키우는 동물은?","passage":"영희는 집에서 금붕어를 키웁니다. 매일 먹이를 주고 물도 갈아 줍니다.","choices":[{"id":"A","text":"강아지"},{"id":"B","text":"고양이"},{"id":"C","text":"금붕어"},{"id":"D","text":"햄스터"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_detail_008', 'saussure', 'READING', 'DETAIL', '{"id":"dq_saussure_detail_008","serverId":"saussure","questionType":"READING","category":"DETAIL","stem":"글의 내용과 다른 것은?","passage":"운동회에서 달리기를 했습니다. 나는 2등을 했습니다. 1등은 우리 반 철수였습니다.","choices":[{"id":"A","text":"운동회에서 달리기를 했다"},{"id":"B","text":"나는 2등을 했다"},{"id":"C","text":"철수가 1등을 했다"},{"id":"D","text":"나는 3등을 했다"}],"answerId":"D","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_detail_009', 'saussure', 'READING', 'DETAIL', '{"id":"dq_saussure_detail_009","serverId":"saussure","questionType":"READING","category":"DETAIL","stem":"소풍에서 무엇을 먹었나요?","passage":"오늘 소풍을 갔습니다. 김밥과 주스를 먹었습니다. 친구들과 재미있게 놀았습니다.","choices":[{"id":"A","text":"떡볶이와 콜라"},{"id":"B","text":"김밥과 주스"},{"id":"C","text":"빵과 우유"},{"id":"D","text":"과일과 물"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_saussure_detail_010', 'saussure', 'READING', 'DETAIL', '{"id":"dq_saussure_detail_010","serverId":"saussure","questionType":"READING","category":"DETAIL","stem":"글의 내용과 같은 것은?","passage":"겨울방학에 할머니 댁에 갔습니다. 할머니께서 따뜻한 호떡을 만들어 주셨습니다.","choices":[{"id":"A","text":"여름방학에 갔다"},{"id":"B","text":"할아버지 댁에 갔다"},{"id":"C","text":"할머니가 호떡을 만들어 주셨다"},{"id":"D","text":"차가운 아이스크림을 먹었다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());


-- ============================================================
-- [2] frege 서버 (초등 고학년 3~6학년 수준)
-- ============================================================

-- ----------------------------------------------------------
-- frege / QUIZ / VOCAB (어휘 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_vocab_001', 'frege', 'QUIZ', 'VOCAB', '{"id":"dq_frege_vocab_001","serverId":"frege","questionType":"QUIZ","category":"VOCAB","stem":"다음 중 근면하다의 뜻으로 알맞은 것은?","passage":null,"choices":[{"id":"A","text":"부지런하다"},{"id":"B","text":"게으르다"},{"id":"C","text":"조용하다"},{"id":"D","text":"시끄럽다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_vocab_002', 'frege', 'QUIZ', 'VOCAB', '{"id":"dq_frege_vocab_002","serverId":"frege","questionType":"QUIZ","category":"VOCAB","stem":"겸손하다의 반대말은?","passage":null,"choices":[{"id":"A","text":"교만하다"},{"id":"B","text":"조용하다"},{"id":"C","text":"친절하다"},{"id":"D","text":"성실하다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_vocab_003', 'frege', 'QUIZ', 'VOCAB', '{"id":"dq_frege_vocab_003","serverId":"frege","questionType":"QUIZ","category":"VOCAB","stem":"맞춤법이 바른 것은?","passage":null,"choices":[{"id":"A","text":"되서"},{"id":"B","text":"돼서"},{"id":"C","text":"되어서"},{"id":"D","text":"B와 C 모두 맞다"}],"answerId":"D","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_vocab_004', 'frege', 'QUIZ', 'VOCAB', '{"id":"dq_frege_vocab_004","serverId":"frege","questionType":"QUIZ","category":"VOCAB","stem":"소홀하다와 비슷한 뜻은?","passage":null,"choices":[{"id":"A","text":"꼼꼼하다"},{"id":"B","text":"대충하다"},{"id":"C","text":"정확하다"},{"id":"D","text":"열심히 하다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_vocab_005', 'frege', 'QUIZ', 'VOCAB', '{"id":"dq_frege_vocab_005","serverId":"frege","questionType":"QUIZ","category":"VOCAB","stem":"다음 중 띄어쓰기가 바른 것은?","passage":null,"choices":[{"id":"A","text":"할수있다"},{"id":"B","text":"할 수 있다"},{"id":"C","text":"할수 있다"},{"id":"D","text":"할 수있다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_vocab_006', 'frege', 'QUIZ', 'VOCAB', '{"id":"dq_frege_vocab_006","serverId":"frege","questionType":"QUIZ","category":"VOCAB","stem":"용감하다와 반대되는 말은?","passage":null,"choices":[{"id":"A","text":"비겁하다"},{"id":"B","text":"씩씩하다"},{"id":"C","text":"당당하다"},{"id":"D","text":"정직하다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_vocab_007', 'frege', 'QUIZ', 'VOCAB', '{"id":"dq_frege_vocab_007","serverId":"frege","questionType":"QUIZ","category":"VOCAB","stem":"맞춤법이 바른 것은?","passage":null,"choices":[{"id":"A","text":"어이없다"},{"id":"B","text":"어의없다"},{"id":"C","text":"어히없다"},{"id":"D","text":"얼이없다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_vocab_008', 'frege', 'QUIZ', 'VOCAB', '{"id":"dq_frege_vocab_008","serverId":"frege","questionType":"QUIZ","category":"VOCAB","stem":"절약하다와 비슷한 뜻은?","passage":null,"choices":[{"id":"A","text":"낭비하다"},{"id":"B","text":"아끼다"},{"id":"C","text":"버리다"},{"id":"D","text":"쓰다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_vocab_009', 'frege', 'QUIZ', 'VOCAB', '{"id":"dq_frege_vocab_009","serverId":"frege","questionType":"QUIZ","category":"VOCAB","stem":"다음 중 풍부하다의 뜻은?","passage":null,"choices":[{"id":"A","text":"넉넉하고 많다"},{"id":"B","text":"적고 부족하다"},{"id":"C","text":"가볍고 작다"},{"id":"D","text":"무겁고 크다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_vocab_010', 'frege', 'QUIZ', 'VOCAB', '{"id":"dq_frege_vocab_010","serverId":"frege","questionType":"QUIZ","category":"VOCAB","stem":"맞춤법이 바른 것은?","passage":null,"choices":[{"id":"A","text":"왠지"},{"id":"B","text":"웬지"},{"id":"C","text":"왠찌"},{"id":"D","text":"웬찌"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- frege / QUIZ / BACKGROUND (배경지식 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_background_001', 'frege', 'QUIZ', 'BACKGROUND', '{"id":"dq_frege_background_001","serverId":"frege","questionType":"QUIZ","category":"BACKGROUND","stem":"소 잃고 외양간 고친다는 무슨 뜻인가요?","passage":null,"choices":[{"id":"A","text":"소를 잘 키워야 한다"},{"id":"B","text":"일이 이미 잘못된 뒤에 대비해도 소용없다"},{"id":"C","text":"외양간을 자주 고쳐야 한다"},{"id":"D","text":"소가 도망가면 잡아야 한다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_background_002', 'frege', 'QUIZ', 'BACKGROUND', '{"id":"dq_frege_background_002","serverId":"frege","questionType":"QUIZ","category":"BACKGROUND","stem":"우물 안 개구리는 어떤 사람을 뜻하나요?","passage":null,"choices":[{"id":"A","text":"세상을 많이 아는 사람"},{"id":"B","text":"좁은 세계만 알고 넓은 세상을 모르는 사람"},{"id":"C","text":"수영을 잘하는 사람"},{"id":"D","text":"동물을 좋아하는 사람"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_background_003', 'frege', 'QUIZ', 'BACKGROUND', '{"id":"dq_frege_background_003","serverId":"frege","questionType":"QUIZ","category":"BACKGROUND","stem":"등잔 밑이 어둡다는 무슨 뜻인가요?","passage":null,"choices":[{"id":"A","text":"등잔이 어두우면 바꿔야 한다"},{"id":"B","text":"가까이 있는 것을 오히려 모른다"},{"id":"C","text":"어두운 곳에서 공부하면 안 된다"},{"id":"D","text":"밤에는 불을 켜야 한다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_background_004', 'frege', 'QUIZ', 'BACKGROUND', '{"id":"dq_frege_background_004","serverId":"frege","questionType":"QUIZ","category":"BACKGROUND","stem":"흥부와 놀부에서 착한 사람은 누구인가요?","passage":null,"choices":[{"id":"A","text":"놀부"},{"id":"B","text":"흥부"},{"id":"C","text":"제비"},{"id":"D","text":"임금"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_background_005', 'frege', 'QUIZ', 'BACKGROUND', '{"id":"dq_frege_background_005","serverId":"frege","questionType":"QUIZ","category":"BACKGROUND","stem":"낫 놓고 기역 자도 모른다는 무슨 뜻인가요?","passage":null,"choices":[{"id":"A","text":"낫을 조심해야 한다"},{"id":"B","text":"기역을 잘 써야 한다"},{"id":"C","text":"아주 무식하다"},{"id":"D","text":"농사를 잘 짓는다"}],"answerId":"C","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_background_006', 'frege', 'QUIZ', 'BACKGROUND', '{"id":"dq_frege_background_006","serverId":"frege","questionType":"QUIZ","category":"BACKGROUND","stem":"미역국을 먹다는 어떤 상황에서 쓰이나요?","passage":null,"choices":[{"id":"A","text":"시험에 합격했을 때"},{"id":"B","text":"시험에 떨어졌을 때"},{"id":"C","text":"밥을 맛있게 먹었을 때"},{"id":"D","text":"생일날"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_background_007', 'frege', 'QUIZ', 'BACKGROUND', '{"id":"dq_frege_background_007","serverId":"frege","questionType":"QUIZ","category":"BACKGROUND","stem":"빛 좋은 개살구는 무슨 뜻인가요?","passage":null,"choices":[{"id":"A","text":"겉은 좋아 보이지만 속은 좋지 않다"},{"id":"B","text":"과일이 맛있다"},{"id":"C","text":"빛이 예쁘다"},{"id":"D","text":"개살구는 몸에 좋다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_background_008', 'frege', 'QUIZ', 'BACKGROUND', '{"id":"dq_frege_background_008","serverId":"frege","questionType":"QUIZ","category":"BACKGROUND","stem":"한글을 만든 사람은 누구인가요?","passage":null,"choices":[{"id":"A","text":"이순신"},{"id":"B","text":"세종대왕"},{"id":"C","text":"정약용"},{"id":"D","text":"신사임당"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_background_009', 'frege', 'QUIZ', 'BACKGROUND', '{"id":"dq_frege_background_009","serverId":"frege","questionType":"QUIZ","category":"BACKGROUND","stem":"배보다 배꼽이 크다는 무슨 뜻인가요?","passage":null,"choices":[{"id":"A","text":"배를 많이 먹었다"},{"id":"B","text":"부수적인 것이 주된 것보다 크다"},{"id":"C","text":"배꼽이 예쁘다"},{"id":"D","text":"배가 작다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_background_010', 'frege', 'QUIZ', 'BACKGROUND', '{"id":"dq_frege_background_010","serverId":"frege","questionType":"QUIZ","category":"BACKGROUND","stem":"토끼전에서 토끼가 가져오라고 한 것은?","passage":null,"choices":[{"id":"A","text":"토끼의 간"},{"id":"B","text":"토끼의 꼬리"},{"id":"C","text":"토끼의 귀"},{"id":"D","text":"토끼의 발"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- frege / QUIZ / CONCEPT (국어 개념 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_concept_001', 'frege', 'QUIZ', 'CONCEPT', '{"id":"dq_frege_concept_001","serverId":"frege","questionType":"QUIZ","category":"CONCEPT","stem":"은/는, 이/가, 을/를처럼 단어 뒤에 붙어 쓰이는 것은?","passage":null,"choices":[{"id":"A","text":"명사"},{"id":"B","text":"동사"},{"id":"C","text":"조사"},{"id":"D","text":"부사"}],"answerId":"C","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_concept_002', 'frege', 'QUIZ', 'CONCEPT', '{"id":"dq_frege_concept_002","serverId":"frege","questionType":"QUIZ","category":"CONCEPT","stem":"매우, 아주, 너무처럼 다른 말을 꾸며 주는 품사는?","passage":null,"choices":[{"id":"A","text":"명사"},{"id":"B","text":"형용사"},{"id":"C","text":"동사"},{"id":"D","text":"부사"}],"answerId":"D","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_concept_003', 'frege', 'QUIZ', 'CONCEPT', '{"id":"dq_frege_concept_003","serverId":"frege","questionType":"QUIZ","category":"CONCEPT","stem":"글에서 한 줄을 띄어 내용을 구분하는 단위를 무엇이라 하나요?","passage":null,"choices":[{"id":"A","text":"문장"},{"id":"B","text":"문단"},{"id":"C","text":"단어"},{"id":"D","text":"글자"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_concept_004', 'frege', 'QUIZ', 'CONCEPT', '{"id":"dq_frege_concept_004","serverId":"frege","questionType":"QUIZ","category":"CONCEPT","stem":"나는 학생이다에서 주어는?","passage":null,"choices":[{"id":"A","text":"나는"},{"id":"B","text":"학생이다"},{"id":"C","text":"학생"},{"id":"D","text":"이다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_concept_005', 'frege', 'QUIZ', 'CONCEPT', '{"id":"dq_frege_concept_005","serverId":"frege","questionType":"QUIZ","category":"CONCEPT","stem":"일기, 편지, 독서 감상문 중 자기 생각과 느낌을 쓰는 글은?","passage":null,"choices":[{"id":"A","text":"설명문"},{"id":"B","text":"감상문"},{"id":"C","text":"논설문"},{"id":"D","text":"기사문"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_concept_006', 'frege', 'QUIZ', 'CONCEPT', '{"id":"dq_frege_concept_006","serverId":"frege","questionType":"QUIZ","category":"CONCEPT","stem":"철수가 밥을 먹는다에서 서술어는?","passage":null,"choices":[{"id":"A","text":"철수가"},{"id":"B","text":"밥을"},{"id":"C","text":"먹는다"},{"id":"D","text":"밥을 먹는다"}],"answerId":"C","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_concept_007', 'frege', 'QUIZ', 'CONCEPT', '{"id":"dq_frege_concept_007","serverId":"frege","questionType":"QUIZ","category":"CONCEPT","stem":"다른 사람의 말을 그대로 옮겨 쓸 때 사용하는 부호는?","passage":null,"choices":[{"id":"A","text":"마침표"},{"id":"B","text":"큰따옴표"},{"id":"C","text":"물음표"},{"id":"D","text":"느낌표"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_concept_008', 'frege', 'QUIZ', 'CONCEPT', '{"id":"dq_frege_concept_008","serverId":"frege","questionType":"QUIZ","category":"CONCEPT","stem":"이것, 그것, 저것처럼 사물을 가리키는 말은?","passage":null,"choices":[{"id":"A","text":"명사"},{"id":"B","text":"대명사"},{"id":"C","text":"동사"},{"id":"D","text":"형용사"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_concept_009', 'frege', 'QUIZ', 'CONCEPT', '{"id":"dq_frege_concept_009","serverId":"frege","questionType":"QUIZ","category":"CONCEPT","stem":"시에서 같은 소리가 반복되는 것을 무엇이라 하나요?","passage":null,"choices":[{"id":"A","text":"운율"},{"id":"B","text":"비유"},{"id":"C","text":"상징"},{"id":"D","text":"묘사"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_concept_010', 'frege', 'QUIZ', 'CONCEPT', '{"id":"dq_frege_concept_010","serverId":"frege","questionType":"QUIZ","category":"CONCEPT","stem":"꽃이 웃는다처럼 사물을 사람처럼 표현하는 것은?","passage":null,"choices":[{"id":"A","text":"직유법"},{"id":"B","text":"은유법"},{"id":"C","text":"의인법"},{"id":"D","text":"과장법"}],"answerId":"C","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- frege / READING / SENTENCE (문장 독해 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_sentence_001', 'frege', 'READING', 'SENTENCE', '{"id":"dq_frege_sentence_001","serverId":"frege","questionType":"READING","category":"SENTENCE","stem":"이 글의 중심 생각은?","passage":"지구에서 물은 매우 중요합니다. 사람뿐 아니라 동식물도 물이 없으면 살 수 없습니다. 그래서 우리는 물을 아껴 써야 합니다.","choices":[{"id":"A","text":"물을 아껴 써야 한다"},{"id":"B","text":"물은 맛있다"},{"id":"C","text":"동물은 물에서 산다"},{"id":"D","text":"식물은 물이 필요 없다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_sentence_002', 'frege', 'READING', 'SENTENCE', '{"id":"dq_frege_sentence_002","serverId":"frege","questionType":"READING","category":"SENTENCE","stem":"이 글의 글쓴이가 말하고자 하는 것은?","passage":"독서는 우리의 생각을 넓혀 줍니다. 책을 읽으면 모르는 것을 알게 되고, 다른 사람의 마음도 이해할 수 있습니다.","choices":[{"id":"A","text":"독서의 중요성"},{"id":"B","text":"운동의 중요성"},{"id":"C","text":"음악의 즐거움"},{"id":"D","text":"여행의 즐거움"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_sentence_003', 'frege', 'READING', 'SENTENCE', '{"id":"dq_frege_sentence_003","serverId":"frege","questionType":"READING","category":"SENTENCE","stem":"이 글의 주제로 가장 알맞은 것은?","passage":"꿀벌은 꽃에서 꿀을 모으면서 꽃가루를 옮깁니다. 이 덕분에 열매가 맺히고 우리가 과일을 먹을 수 있습니다. 꿀벌은 자연에 꼭 필요한 곤충입니다.","choices":[{"id":"A","text":"꿀벌의 역할"},{"id":"B","text":"과일 재배법"},{"id":"C","text":"꽃의 종류"},{"id":"D","text":"곤충 채집법"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_sentence_004', 'frege', 'READING', 'SENTENCE', '{"id":"dq_frege_sentence_004","serverId":"frege","questionType":"READING","category":"SENTENCE","stem":"이 글에서 알 수 있는 중심 내용은?","passage":"재활용은 쓰레기를 줄이는 좋은 방법입니다. 종이, 유리, 플라스틱을 분리해서 버리면 다시 쓸 수 있는 물건으로 만들 수 있습니다.","choices":[{"id":"A","text":"재활용의 필요성"},{"id":"B","text":"쓰레기를 많이 버리자"},{"id":"C","text":"플라스틱은 좋다"},{"id":"D","text":"종이는 필요 없다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_sentence_005', 'frege', 'READING', 'SENTENCE', '{"id":"dq_frege_sentence_005","serverId":"frege","questionType":"READING","category":"SENTENCE","stem":"이 글이 설명하는 것은?","passage":"우리나라는 사계절이 뚜렷합니다. 봄에는 따뜻하고, 여름에는 덥고, 가을에는 선선하고, 겨울에는 춥습니다.","choices":[{"id":"A","text":"우리나라의 사계절"},{"id":"B","text":"외국의 날씨"},{"id":"C","text":"지구 온난화"},{"id":"D","text":"날씨 예보"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_sentence_006', 'frege', 'READING', 'SENTENCE', '{"id":"dq_frege_sentence_006","serverId":"frege","questionType":"READING","category":"SENTENCE","stem":"글쓴이의 주장은?","passage":"학교에서 급식을 남기면 음식물 쓰레기가 많아집니다. 먹을 만큼만 받아서 깨끗이 먹으면 환경도 지키고 건강에도 좋습니다.","choices":[{"id":"A","text":"급식을 남기지 말자"},{"id":"B","text":"급식을 많이 받자"},{"id":"C","text":"급식은 맛이 없다"},{"id":"D","text":"집에서 밥을 먹자"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_sentence_007', 'frege', 'READING', 'SENTENCE', '{"id":"dq_frege_sentence_007","serverId":"frege","questionType":"READING","category":"SENTENCE","stem":"이 글의 핵심 내용은?","passage":"옛날 사람들은 해시계로 시간을 알았습니다. 해의 그림자가 움직이는 것을 보고 시간을 짐작했습니다.","choices":[{"id":"A","text":"옛날의 시간 측정 방법"},{"id":"B","text":"현대의 시계"},{"id":"C","text":"해가 뜨는 시간"},{"id":"D","text":"그림자 놀이"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_sentence_008', 'frege', 'READING', 'SENTENCE', '{"id":"dq_frege_sentence_008","serverId":"frege","questionType":"READING","category":"SENTENCE","stem":"이 글의 중심 생각은?","passage":"식물도 살아 있는 생물입니다. 물을 주지 않으면 시들고, 햇빛을 받으면 잘 자랍니다. 우리는 식물도 소중히 여겨야 합니다.","choices":[{"id":"A","text":"식물도 소중한 생물이다"},{"id":"B","text":"식물은 움직인다"},{"id":"C","text":"물을 많이 주면 좋다"},{"id":"D","text":"햇빛은 필요 없다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_sentence_009', 'frege', 'READING', 'SENTENCE', '{"id":"dq_frege_sentence_009","serverId":"frege","questionType":"READING","category":"SENTENCE","stem":"이 글이 알려 주는 것은?","passage":"김치는 한국의 대표 음식입니다. 배추에 양념을 넣어 만들며, 발효 과정을 거쳐 맛이 깊어집니다.","choices":[{"id":"A","text":"김치에 대한 설명"},{"id":"B","text":"불고기 만드는 법"},{"id":"C","text":"외국 음식 소개"},{"id":"D","text":"요리 대회 안내"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_sentence_010', 'frege', 'READING', 'SENTENCE', '{"id":"dq_frege_sentence_010","serverId":"frege","questionType":"READING","category":"SENTENCE","stem":"이 글의 주제는?","passage":"친구와 사이좋게 지내려면 서로의 말을 잘 들어 주어야 합니다. 내 생각만 말하지 말고, 친구의 이야기에 귀 기울여 보세요.","choices":[{"id":"A","text":"친구와의 소통"},{"id":"B","text":"혼자 공부하기"},{"id":"C","text":"운동하는 방법"},{"id":"D","text":"책 읽는 습관"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- frege / READING / DETAIL (세부사항 파악 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_detail_001', 'frege', 'READING', 'DETAIL', '{"id":"dq_frege_detail_001","serverId":"frege","questionType":"READING","category":"DETAIL","stem":"글의 내용과 일치하는 것은?","passage":"세종대왕은 1443년에 훈민정음을 만들었습니다. 백성들이 글자를 몰라 불편한 것을 안타깝게 여겨 쉬운 글자를 만든 것입니다.","choices":[{"id":"A","text":"훈민정음은 1500년에 만들어졌다"},{"id":"B","text":"세종대왕이 훈민정음을 만들었다"},{"id":"C","text":"양반만 쓸 수 있었다"},{"id":"D","text":"중국에서 가져왔다"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_detail_002', 'frege', 'READING', 'DETAIL', '{"id":"dq_frege_detail_002","serverId":"frege","questionType":"READING","category":"DETAIL","stem":"펭귄이 사는 곳은?","passage":"펭귄은 남극에 사는 새입니다. 날지 못하지만 수영을 아주 잘합니다. 물고기를 잡아먹고 삽니다.","choices":[{"id":"A","text":"북극"},{"id":"B","text":"남극"},{"id":"C","text":"사막"},{"id":"D","text":"숲"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_detail_003', 'frege', 'READING', 'DETAIL', '{"id":"dq_frege_detail_003","serverId":"frege","questionType":"READING","category":"DETAIL","stem":"글의 내용과 다른 것은?","passage":"우리 학교 도서관은 3층에 있습니다. 월요일부터 금요일까지 문을 엽니다. 한 번에 세 권까지 빌릴 수 있습니다.","choices":[{"id":"A","text":"도서관은 3층에 있다"},{"id":"B","text":"주말에도 문을 연다"},{"id":"C","text":"세 권까지 빌릴 수 있다"},{"id":"D","text":"월요일부터 금요일까지 운영한다"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_detail_004', 'frege', 'READING', 'DETAIL', '{"id":"dq_frege_detail_004","serverId":"frege","questionType":"READING","category":"DETAIL","stem":"민지가 기른 식물은?","passage":"민지는 과학 시간에 강낭콩을 심었습니다. 매일 물을 주고 관찰 일기를 썼습니다. 2주 뒤에 싹이 나왔습니다.","choices":[{"id":"A","text":"해바라기"},{"id":"B","text":"강낭콩"},{"id":"C","text":"토마토"},{"id":"D","text":"옥수수"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_detail_005', 'frege', 'READING', 'DETAIL', '{"id":"dq_frege_detail_005","serverId":"frege","questionType":"READING","category":"DETAIL","stem":"글의 내용과 일치하는 것은?","passage":"제주도는 우리나라에서 가장 큰 섬입니다. 한라산이 있고, 감귤이 많이 나는 곳으로 유명합니다.","choices":[{"id":"A","text":"제주도는 가장 작은 섬이다"},{"id":"B","text":"설악산이 있다"},{"id":"C","text":"감귤이 많이 난다"},{"id":"D","text":"육지와 연결되어 있다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_detail_006', 'frege', 'READING', 'DETAIL', '{"id":"dq_frege_detail_006","serverId":"frege","questionType":"READING","category":"DETAIL","stem":"현장 학습에서 무엇을 보았나요?","passage":"우리 반은 박물관으로 현장 학습을 갔습니다. 공룡 화석과 옛날 도자기를 관람했습니다. 가장 인기 있는 것은 공룡 화석이었습니다.","choices":[{"id":"A","text":"동물원의 동물"},{"id":"B","text":"공룡 화석과 도자기"},{"id":"C","text":"미술관의 그림"},{"id":"D","text":"과학관의 로봇"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_detail_007', 'frege', 'READING', 'DETAIL', '{"id":"dq_frege_detail_007","serverId":"frege","questionType":"READING","category":"DETAIL","stem":"글의 내용과 다른 것은?","passage":"낙타는 사막에서 삽니다. 등에 있는 혹에 지방을 저장하여 오랫동안 물 없이도 버틸 수 있습니다.","choices":[{"id":"A","text":"낙타는 사막에서 산다"},{"id":"B","text":"혹에 물을 저장한다"},{"id":"C","text":"오랫동안 물 없이 버틴다"},{"id":"D","text":"등에 혹이 있다"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_detail_008', 'frege', 'READING', 'DETAIL', '{"id":"dq_frege_detail_008","serverId":"frege","questionType":"READING","category":"DETAIL","stem":"태권도 대회에서 준서의 성적은?","passage":"준서는 태권도를 3년째 배우고 있습니다. 지난 주 대회에서 은메달을 땄습니다. 다음에는 금메달을 따겠다고 다짐했습니다.","choices":[{"id":"A","text":"금메달"},{"id":"B","text":"은메달"},{"id":"C","text":"동메달"},{"id":"D","text":"참가상"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_detail_009', 'frege', 'READING', 'DETAIL', '{"id":"dq_frege_detail_009","serverId":"frege","questionType":"READING","category":"DETAIL","stem":"글의 내용과 일치하는 것은?","passage":"한지는 닥나무 껍질로 만든 한국 전통 종이입니다. 질기고 오래 보관할 수 있어 옛날부터 많이 사용되었습니다.","choices":[{"id":"A","text":"한지는 대나무로 만든다"},{"id":"B","text":"한지는 쉽게 찢어진다"},{"id":"C","text":"한지는 닥나무로 만든다"},{"id":"D","text":"한지는 외국에서 들어왔다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_frege_detail_010', 'frege', 'READING', 'DETAIL', '{"id":"dq_frege_detail_010","serverId":"frege","questionType":"READING","category":"DETAIL","stem":"소라가 참가한 것은?","passage":"소라는 학교 백일장에 참가했습니다. 주어진 주제로 시를 지어 냈습니다. 결과는 다음 주에 발표됩니다.","choices":[{"id":"A","text":"달리기 대회"},{"id":"B","text":"그림 대회"},{"id":"C","text":"백일장"},{"id":"D","text":"과학 대회"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());


-- ============================================================
-- [3] russell 서버 (중학교 수준)
-- ============================================================

-- ----------------------------------------------------------
-- russell / QUIZ / VOCAB (어휘 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_vocab_001', 'russell', 'QUIZ', 'VOCAB', '{"id":"dq_russell_vocab_001","serverId":"russell","questionType":"QUIZ","category":"VOCAB","stem":"고충의 뜻으로 알맞은 것은?","passage":null,"choices":[{"id":"A","text":"높은 곳"},{"id":"B","text":"괴로운 사정"},{"id":"C","text":"오래된 집"},{"id":"D","text":"깊은 우물"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_vocab_002', 'russell', 'QUIZ', 'VOCAB', '{"id":"dq_russell_vocab_002","serverId":"russell","questionType":"QUIZ","category":"VOCAB","stem":"역설적의 뜻은?","passage":null,"choices":[{"id":"A","text":"이치에 맞지 않는 듯하면서 참된"},{"id":"B","text":"매우 슬픈"},{"id":"C","text":"역사와 관련된"},{"id":"D","text":"거꾸로 설명하는"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_vocab_003', 'russell', 'QUIZ', 'VOCAB', '{"id":"dq_russell_vocab_003","serverId":"russell","questionType":"QUIZ","category":"VOCAB","stem":"관조하다의 뜻은?","passage":null,"choices":[{"id":"A","text":"자세히 살펴보다"},{"id":"B","text":"고요히 바라보다"},{"id":"C","text":"빨리 달리다"},{"id":"D","text":"크게 소리치다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_vocab_004', 'russell', 'QUIZ', 'VOCAB', '{"id":"dq_russell_vocab_004","serverId":"russell","questionType":"QUIZ","category":"VOCAB","stem":"명징하다와 비슷한 뜻은?","passage":null,"choices":[{"id":"A","text":"흐릿하다"},{"id":"B","text":"또렷하다"},{"id":"C","text":"어둡다"},{"id":"D","text":"복잡하다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_vocab_005', 'russell', 'QUIZ', 'VOCAB', '{"id":"dq_russell_vocab_005","serverId":"russell","questionType":"QUIZ","category":"VOCAB","stem":"맞춤법이 바른 것은?","passage":null,"choices":[{"id":"A","text":"금새"},{"id":"B","text":"금세"},{"id":"C","text":"금쌔"},{"id":"D","text":"금쎄"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_vocab_006', 'russell', 'QUIZ', 'VOCAB', '{"id":"dq_russell_vocab_006","serverId":"russell","questionType":"QUIZ","category":"VOCAB","stem":"함축적의 뜻은?","passage":null,"choices":[{"id":"A","text":"길게 늘어놓는"},{"id":"B","text":"많은 뜻을 압축하여 담고 있는"},{"id":"C","text":"소리가 큰"},{"id":"D","text":"모양이 예쁜"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_vocab_007', 'russell', 'QUIZ', 'VOCAB', '{"id":"dq_russell_vocab_007","serverId":"russell","questionType":"QUIZ","category":"VOCAB","stem":"도모하다의 뜻은?","passage":null,"choices":[{"id":"A","text":"어떤 일을 이루려고 꾀하다"},{"id":"B","text":"무언가를 던지다"},{"id":"C","text":"크게 울다"},{"id":"D","text":"조용히 쉬다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_vocab_008', 'russell', 'QUIZ', 'VOCAB', '{"id":"dq_russell_vocab_008","serverId":"russell","questionType":"QUIZ","category":"VOCAB","stem":"번민의 뜻은?","passage":null,"choices":[{"id":"A","text":"기쁜 마음"},{"id":"B","text":"이리저리 괴로워하고 걱정함"},{"id":"C","text":"빠르게 달림"},{"id":"D","text":"밝은 빛"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_vocab_009', 'russell', 'QUIZ', 'VOCAB', '{"id":"dq_russell_vocab_009","serverId":"russell","questionType":"QUIZ","category":"VOCAB","stem":"~로서와 ~로써의 쓰임이 바른 것은?","passage":null,"choices":[{"id":"A","text":"학생으로써 할 일"},{"id":"B","text":"학생으로서 할 일"},{"id":"C","text":"칼로서 깎다"},{"id":"D","text":"A와 C 모두 맞다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_vocab_010', 'russell', 'QUIZ', 'VOCAB', '{"id":"dq_russell_vocab_010","serverId":"russell","questionType":"QUIZ","category":"VOCAB","stem":"풍자의 뜻은?","passage":null,"choices":[{"id":"A","text":"바람이 부는 모양"},{"id":"B","text":"남의 결점을 빗대어 비웃으며 폭로함"},{"id":"C","text":"경치가 아름다움"},{"id":"D","text":"풍년이 드는 것"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- russell / QUIZ / BACKGROUND (배경지식 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_background_001', 'russell', 'QUIZ', 'BACKGROUND', '{"id":"dq_russell_background_001","serverId":"russell","questionType":"QUIZ","category":"BACKGROUND","stem":"사면초가의 뜻은?","passage":null,"choices":[{"id":"A","text":"사방이 산으로 둘러싸임"},{"id":"B","text":"사방에서 적에게 둘러싸여 고립됨"},{"id":"C","text":"네 번 초대받음"},{"id":"D","text":"사계절이 아름다움"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_background_002', 'russell', 'QUIZ', 'BACKGROUND', '{"id":"dq_russell_background_002","serverId":"russell","questionType":"QUIZ","category":"BACKGROUND","stem":"고전 소설 춘향전에서 춘향의 신분은?","passage":null,"choices":[{"id":"A","text":"양반 집 딸"},{"id":"B","text":"기생의 딸"},{"id":"C","text":"왕의 딸"},{"id":"D","text":"관리의 딸"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_background_003', 'russell', 'QUIZ', 'BACKGROUND', '{"id":"dq_russell_background_003","serverId":"russell","questionType":"QUIZ","category":"BACKGROUND","stem":"오십보백보의 뜻은?","passage":null,"choices":[{"id":"A","text":"조금 낫고 못한 차이는 있으나 본질적으로 같다"},{"id":"B","text":"오십 걸음과 백 걸음은 크게 다르다"},{"id":"C","text":"걸음이 빠르다"},{"id":"D","text":"숫자가 중요하다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_background_004', 'russell', 'QUIZ', 'BACKGROUND', '{"id":"dq_russell_background_004","serverId":"russell","questionType":"QUIZ","category":"BACKGROUND","stem":"각주구검의 뜻은?","passage":null,"choices":[{"id":"A","text":"검을 잘 다루다"},{"id":"B","text":"어리석고 융통성 없이 옛것만 고집하다"},{"id":"C","text":"글자를 새기다"},{"id":"D","text":"배를 잘 만들다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_background_005', 'russell', 'QUIZ', 'BACKGROUND', '{"id":"dq_russell_background_005","serverId":"russell","questionType":"QUIZ","category":"BACKGROUND","stem":"김소월의 시 진달래꽃에서 화자의 태도는?","passage":null,"choices":[{"id":"A","text":"떠나는 임을 원망함"},{"id":"B","text":"떠나는 임을 기꺼이 보내겠다는 체념적 사랑"},{"id":"C","text":"임과 함께 떠남"},{"id":"D","text":"임을 붙잡음"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_background_006', 'russell', 'QUIZ', 'BACKGROUND', '{"id":"dq_russell_background_006","serverId":"russell","questionType":"QUIZ","category":"BACKGROUND","stem":"새옹지마의 뜻은?","passage":null,"choices":[{"id":"A","text":"새장에 갇힌 새"},{"id":"B","text":"인생의 길흉화복은 예측할 수 없다"},{"id":"C","text":"늙은이가 말을 잃음"},{"id":"D","text":"말이 빠르다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_background_007', 'russell', 'QUIZ', 'BACKGROUND', '{"id":"dq_russell_background_007","serverId":"russell","questionType":"QUIZ","category":"BACKGROUND","stem":"홍길동전의 작가는?","passage":null,"choices":[{"id":"A","text":"허균"},{"id":"B","text":"김시습"},{"id":"C","text":"박지원"},{"id":"D","text":"정약용"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_background_008', 'russell', 'QUIZ', 'BACKGROUND', '{"id":"dq_russell_background_008","serverId":"russell","questionType":"QUIZ","category":"BACKGROUND","stem":"우이독경의 뜻은?","passage":null,"choices":[{"id":"A","text":"소의 귀에 경을 읽어도 알아듣지 못함"},{"id":"B","text":"소가 경전을 잘 읽음"},{"id":"C","text":"독서를 열심히 함"},{"id":"D","text":"경전이 어렵다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_background_009', 'russell', 'QUIZ', 'BACKGROUND', '{"id":"dq_russell_background_009","serverId":"russell","questionType":"QUIZ","category":"BACKGROUND","stem":"시조는 어떤 형식의 문학인가요?","passage":null,"choices":[{"id":"A","text":"3장 6구 45자 내외의 정형시"},{"id":"B","text":"자유로운 형식의 수필"},{"id":"C","text":"긴 이야기의 소설"},{"id":"D","text":"무대 위의 연극"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_background_010', 'russell', 'QUIZ', 'BACKGROUND', '{"id":"dq_russell_background_010","serverId":"russell","questionType":"QUIZ","category":"BACKGROUND","stem":"결초보은의 뜻은?","passage":null,"choices":[{"id":"A","text":"풀을 엮어서 은혜를 갚다"},{"id":"B","text":"풀을 뽑아 버리다"},{"id":"C","text":"보답할 필요 없다"},{"id":"D","text":"풀이 잘 자란다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- russell / QUIZ / CONCEPT (국어 개념 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_concept_001', 'russell', 'QUIZ', 'CONCEPT', '{"id":"dq_russell_concept_001","serverId":"russell","questionType":"QUIZ","category":"CONCEPT","stem":"내 마음은 호수요에 쓰인 표현 기법은?","passage":null,"choices":[{"id":"A","text":"직유법"},{"id":"B","text":"은유법"},{"id":"C","text":"의인법"},{"id":"D","text":"과장법"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_concept_002', 'russell', 'QUIZ', 'CONCEPT', '{"id":"dq_russell_concept_002","serverId":"russell","questionType":"QUIZ","category":"CONCEPT","stem":"바람처럼 달린다에 쓰인 표현 기법은?","passage":null,"choices":[{"id":"A","text":"직유법"},{"id":"B","text":"은유법"},{"id":"C","text":"의인법"},{"id":"D","text":"반어법"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_concept_003', 'russell', 'QUIZ', 'CONCEPT', '{"id":"dq_russell_concept_003","serverId":"russell","questionType":"QUIZ","category":"CONCEPT","stem":"먹다의 높임말은?","passage":null,"choices":[{"id":"A","text":"먹으시다"},{"id":"B","text":"잡수시다"},{"id":"C","text":"드시다"},{"id":"D","text":"B와 C 모두 맞다"}],"answerId":"D","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_concept_004', 'russell', 'QUIZ', 'CONCEPT', '{"id":"dq_russell_concept_004","serverId":"russell","questionType":"QUIZ","category":"CONCEPT","stem":"한글 맞춤법의 기본 원리로 맞는 것은?","passage":null,"choices":[{"id":"A","text":"소리 나는 대로 적는다"},{"id":"B","text":"소리대로 적되 어법에 맞게 적는다"},{"id":"C","text":"뜻대로만 적는다"},{"id":"D","text":"외국어처럼 적는다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_concept_005', 'russell', 'QUIZ', 'CONCEPT', '{"id":"dq_russell_concept_005","serverId":"russell","questionType":"QUIZ","category":"CONCEPT","stem":"문장에서 주체의 행동을 높여 표현하는 것을 무엇이라 하나요?","passage":null,"choices":[{"id":"A","text":"주체 높임법"},{"id":"B","text":"객체 높임법"},{"id":"C","text":"상대 높임법"},{"id":"D","text":"사동 표현"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_concept_006', 'russell', 'QUIZ', 'CONCEPT', '{"id":"dq_russell_concept_006","serverId":"russell","questionType":"QUIZ","category":"CONCEPT","stem":"서술자가 작품 밖에서 이야기를 전달하는 시점은?","passage":null,"choices":[{"id":"A","text":"1인칭 주인공 시점"},{"id":"B","text":"1인칭 관찰자 시점"},{"id":"C","text":"3인칭 전지적 작가 시점"},{"id":"D","text":"2인칭 시점"}],"answerId":"C","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_concept_007', 'russell', 'QUIZ', 'CONCEPT', '{"id":"dq_russell_concept_007","serverId":"russell","questionType":"QUIZ","category":"CONCEPT","stem":"능동의 반대 개념은?","passage":null,"choices":[{"id":"A","text":"사동"},{"id":"B","text":"피동"},{"id":"C","text":"사역"},{"id":"D","text":"보조"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_concept_008', 'russell', 'QUIZ', 'CONCEPT', '{"id":"dq_russell_concept_008","serverId":"russell","questionType":"QUIZ","category":"CONCEPT","stem":"논설문의 3요소가 아닌 것은?","passage":null,"choices":[{"id":"A","text":"서론"},{"id":"B","text":"본론"},{"id":"C","text":"결론"},{"id":"D","text":"감상"}],"answerId":"D","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_concept_009', 'russell', 'QUIZ', 'CONCEPT', '{"id":"dq_russell_concept_009","serverId":"russell","questionType":"QUIZ","category":"CONCEPT","stem":"음운 변동 중 국물이 [궁물]로 발음되는 현상은?","passage":null,"choices":[{"id":"A","text":"구개음화"},{"id":"B","text":"비음화"},{"id":"C","text":"된소리되기"},{"id":"D","text":"모음 조화"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_concept_010', 'russell', 'QUIZ', 'CONCEPT', '{"id":"dq_russell_concept_010","serverId":"russell","questionType":"QUIZ","category":"CONCEPT","stem":"소설의 3요소에 해당하지 않는 것은?","passage":null,"choices":[{"id":"A","text":"주제"},{"id":"B","text":"구성"},{"id":"C","text":"운율"},{"id":"D","text":"문체"}],"answerId":"C","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- russell / READING / SENTENCE (문장 독해 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_sentence_001', 'russell', 'READING', 'SENTENCE', '{"id":"dq_russell_sentence_001","serverId":"russell","questionType":"READING","category":"SENTENCE","stem":"이 글의 주제로 가장 적절한 것은?","passage":"인공 지능은 편리함을 주지만 일자리를 줄일 수 있다는 우려도 있습니다. 기술 발전에 따른 사회 변화에 대비하여 새로운 교육과 제도가 필요합니다.","choices":[{"id":"A","text":"인공 지능 발전에 따른 사회적 대비"},{"id":"B","text":"인공 지능의 역사"},{"id":"C","text":"교육 제도의 문제점"},{"id":"D","text":"일자리의 종류"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_sentence_002', 'russell', 'READING', 'SENTENCE', '{"id":"dq_russell_sentence_002","serverId":"russell","questionType":"READING","category":"SENTENCE","stem":"글쓴이의 주장은?","passage":"SNS는 정보를 빠르게 전달하지만, 가짜 뉴스가 확산될 위험이 있습니다. 정보를 받아들일 때 출처를 확인하고 비판적으로 사고하는 태도가 필요합니다.","choices":[{"id":"A","text":"SNS를 사용하지 말자"},{"id":"B","text":"정보를 비판적으로 받아들이자"},{"id":"C","text":"가짜 뉴스를 만들자"},{"id":"D","text":"SNS를 많이 사용하자"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_sentence_003', 'russell', 'READING', 'SENTENCE', '{"id":"dq_russell_sentence_003","serverId":"russell","questionType":"READING","category":"SENTENCE","stem":"이 글의 핵심 내용은?","passage":"환경 오염으로 북극의 빙하가 녹고 있습니다. 해수면이 상승하면 저지대 국가들이 물에 잠길 수 있습니다. 탄소 배출을 줄이기 위한 국제적 노력이 시급합니다.","choices":[{"id":"A","text":"기후 변화 대응의 시급성"},{"id":"B","text":"북극 여행 안내"},{"id":"C","text":"바다 생물의 종류"},{"id":"D","text":"빙하의 아름다움"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_sentence_004', 'russell', 'READING', 'SENTENCE', '{"id":"dq_russell_sentence_004","serverId":"russell","questionType":"READING","category":"SENTENCE","stem":"이 글에서 글쓴이가 강조하는 것은?","passage":"다양성을 존중하는 것은 민주 사회의 기본입니다. 나와 다른 의견을 가진 사람의 말도 경청하고, 대화를 통해 합의점을 찾는 노력이 필요합니다.","choices":[{"id":"A","text":"다양성 존중과 대화"},{"id":"B","text":"나의 의견만 주장하기"},{"id":"C","text":"다수결의 원칙"},{"id":"D","text":"침묵하기"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_sentence_005', 'russell', 'READING', 'SENTENCE', '{"id":"dq_russell_sentence_005","serverId":"russell","questionType":"READING","category":"SENTENCE","stem":"이 글의 중심 생각은?","passage":"청소년기는 자아 정체성을 형성하는 중요한 시기입니다. 다양한 경험을 통해 자신의 적성과 흥미를 발견하고, 미래를 설계할 수 있습니다.","choices":[{"id":"A","text":"청소년기 경험의 중요성"},{"id":"B","text":"어른이 되면 좋은 점"},{"id":"C","text":"공부만 해야 하는 이유"},{"id":"D","text":"취미 활동의 종류"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_sentence_006', 'russell', 'READING', 'SENTENCE', '{"id":"dq_russell_sentence_006","serverId":"russell","questionType":"READING","category":"SENTENCE","stem":"이 글의 주제는?","passage":"언어는 시대에 따라 변합니다. 옛날에 쓰던 말이 사라지기도 하고, 새로운 말이 생기기도 합니다. 이처럼 언어는 살아 있는 유기체와 같습니다.","choices":[{"id":"A","text":"언어의 변화"},{"id":"B","text":"외국어 학습"},{"id":"C","text":"옛날 생활"},{"id":"D","text":"새로운 기술"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_sentence_007', 'russell', 'READING', 'SENTENCE', '{"id":"dq_russell_sentence_007","serverId":"russell","questionType":"READING","category":"SENTENCE","stem":"글쓴이의 관점은?","passage":"고전 문학을 읽으면 옛 사람들의 지혜와 삶의 방식을 이해할 수 있습니다. 현대 사회에서도 고전이 주는 교훈은 여전히 유효합니다.","choices":[{"id":"A","text":"고전 문학의 현대적 가치"},{"id":"B","text":"고전은 어렵다"},{"id":"C","text":"현대 문학만 읽어야 한다"},{"id":"D","text":"옛날로 돌아가야 한다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_sentence_008', 'russell', 'READING', 'SENTENCE', '{"id":"dq_russell_sentence_008","serverId":"russell","questionType":"READING","category":"SENTENCE","stem":"이 글에서 강조하는 것은?","passage":"자원봉사는 남을 돕는 동시에 자신도 성장하게 합니다. 봉사 활동을 통해 공감 능력을 기르고, 사회의 일원으로서 책임감을 느끼게 됩니다.","choices":[{"id":"A","text":"자원봉사의 의의"},{"id":"B","text":"봉사의 어려움"},{"id":"C","text":"공부의 중요성"},{"id":"D","text":"경쟁의 필요성"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_sentence_009', 'russell', 'READING', 'SENTENCE', '{"id":"dq_russell_sentence_009","serverId":"russell","questionType":"READING","category":"SENTENCE","stem":"이 글의 핵심은?","passage":"편견은 올바른 판단을 방해합니다. 겉모습이나 첫인상만으로 사람을 평가하지 말고, 상대방을 충분히 알아가려는 노력이 필요합니다.","choices":[{"id":"A","text":"편견을 버리고 열린 마음을 갖자"},{"id":"B","text":"첫인상이 가장 중요하다"},{"id":"C","text":"외모가 중요하다"},{"id":"D","text":"판단을 빨리 하자"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_sentence_010', 'russell', 'READING', 'SENTENCE', '{"id":"dq_russell_sentence_010","serverId":"russell","questionType":"READING","category":"SENTENCE","stem":"이 글의 주제는?","passage":"독서 토론은 단순히 책을 읽는 것을 넘어, 다양한 관점에서 생각하는 힘을 길러 줍니다. 서로의 해석을 나누면 혼자 읽을 때 놓친 부분을 발견하게 됩니다.","choices":[{"id":"A","text":"독서 토론의 효과"},{"id":"B","text":"혼자 읽기의 장점"},{"id":"C","text":"토론의 규칙"},{"id":"D","text":"책 고르는 방법"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- russell / READING / DETAIL (세부사항 파악 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_detail_001', 'russell', 'READING', 'DETAIL', '{"id":"dq_russell_detail_001","serverId":"russell","questionType":"READING","category":"DETAIL","stem":"글의 내용과 일치하는 것은?","passage":"윤동주는 일제 강점기에 활동한 시인으로, 서시와 별 헤는 밤 등의 작품을 남겼습니다. 그는 독립운동 혐의로 일본 후쿠오카 형무소에서 옥사했습니다.","choices":[{"id":"A","text":"윤동주는 소설가이다"},{"id":"B","text":"윤동주는 일제 강점기에 활동했다"},{"id":"C","text":"윤동주는 서울에서 사망했다"},{"id":"D","text":"윤동주는 조선 시대 시인이다"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_detail_002', 'russell', 'READING', 'DETAIL', '{"id":"dq_russell_detail_002","serverId":"russell","questionType":"READING","category":"DETAIL","stem":"글의 내용과 다른 것은?","passage":"한글은 자음 14자와 모음 10자, 총 24자로 이루어져 있습니다. 자음은 발음 기관의 모양을 본떠 만들었고, 모음은 하늘, 땅, 사람의 모양을 본떠 만들었습니다.","choices":[{"id":"A","text":"한글은 24자이다"},{"id":"B","text":"자음은 14자이다"},{"id":"C","text":"모음은 12자이다"},{"id":"D","text":"모음은 하늘, 땅, 사람을 본떴다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_detail_003', 'russell', 'READING', 'DETAIL', '{"id":"dq_russell_detail_003","serverId":"russell","questionType":"READING","category":"DETAIL","stem":"이 글에서 설명하는 현상의 원인은?","passage":"열대 우림이 파괴되면 이산화탄소 흡수량이 줄어들어 지구 온난화가 가속됩니다. 열대 우림은 지구 산소의 약 20%를 생산하기 때문에 지구의 허파라고 불립니다.","choices":[{"id":"A","text":"열대 우림의 확장"},{"id":"B","text":"열대 우림의 파괴"},{"id":"C","text":"산소의 증가"},{"id":"D","text":"이산화탄소의 감소"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_detail_004', 'russell', 'READING', 'DETAIL', '{"id":"dq_russell_detail_004","serverId":"russell","questionType":"READING","category":"DETAIL","stem":"글의 내용과 일치하는 것은?","passage":"판소리는 한 명의 소리꾼이 고수의 북 장단에 맞추어 노래, 말, 몸짓을 섞어 이야기를 풀어 가는 한국 전통 공연 예술입니다. 현재 다섯 마당이 전해집니다.","choices":[{"id":"A","text":"판소리는 여러 명이 함께 부른다"},{"id":"B","text":"현재 열 마당이 전해진다"},{"id":"C","text":"고수가 북 장단을 맞춘다"},{"id":"D","text":"판소리는 일본 전통 예술이다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_detail_005', 'russell', 'READING', 'DETAIL', '{"id":"dq_russell_detail_005","serverId":"russell","questionType":"READING","category":"DETAIL","stem":"글에서 알 수 있는 사실은?","passage":"세계 인권 선언은 1948년 유엔 총회에서 채택되었습니다. 모든 인간은 태어날 때부터 자유롭고 존엄하며 평등하다고 선언하고 있습니다.","choices":[{"id":"A","text":"1948년에 채택되었다"},{"id":"B","text":"1950년에 채택되었다"},{"id":"C","text":"한국에서 만들어졌다"},{"id":"D","text":"일부 사람만 해당된다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_detail_006', 'russell', 'READING', 'DETAIL', '{"id":"dq_russell_detail_006","serverId":"russell","questionType":"READING","category":"DETAIL","stem":"글의 내용과 다른 것은?","passage":"이순신 장군은 임진왜란 때 거북선을 이끌고 해전에서 큰 승리를 거두었습니다. 한산도 대첩과 명량 해전은 대표적인 승전입니다.","choices":[{"id":"A","text":"거북선으로 싸웠다"},{"id":"B","text":"임진왜란 때 활동했다"},{"id":"C","text":"한산도 대첩은 육지 전투이다"},{"id":"D","text":"명량 해전에서 승리했다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_detail_007', 'russell', 'READING', 'DETAIL', '{"id":"dq_russell_detail_007","serverId":"russell","questionType":"READING","category":"DETAIL","stem":"이 글에서 알 수 있는 것은?","passage":"한옥은 자연 재료인 나무, 흙, 돌로 지어집니다. 온돌은 바닥을 따뜻하게 하는 난방 방식으로, 한국 고유의 건축 기술입니다.","choices":[{"id":"A","text":"한옥은 철근으로 지어진다"},{"id":"B","text":"온돌은 벽을 따뜻하게 한다"},{"id":"C","text":"온돌은 한국 고유의 기술이다"},{"id":"D","text":"한옥은 외국에서 유래했다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_detail_008', 'russell', 'READING', 'DETAIL', '{"id":"dq_russell_detail_008","serverId":"russell","questionType":"READING","category":"DETAIL","stem":"글의 내용과 일치하는 것은?","passage":"발효 식품은 미생물의 작용으로 만들어집니다. 김치, 된장, 간장 등 한국의 전통 발효 식품은 영양이 풍부하고 장 건강에 도움이 됩니다.","choices":[{"id":"A","text":"발효 식품은 화학 약품으로 만든다"},{"id":"B","text":"김치는 발효 식품이 아니다"},{"id":"C","text":"발효 식품은 장 건강에 도움이 된다"},{"id":"D","text":"된장은 외국 음식이다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_detail_009', 'russell', 'READING', 'DETAIL', '{"id":"dq_russell_detail_009","serverId":"russell","questionType":"READING","category":"DETAIL","stem":"글에서 알 수 있는 사실은?","passage":"훈민정음 해례본은 한글의 제작 원리를 담은 책으로, 1997년 유네스코 세계기록유산에 등재되었습니다. 현재 간송미술관에 보관되어 있습니다.","choices":[{"id":"A","text":"2000년에 등재되었다"},{"id":"B","text":"국립중앙박물관에 보관되어 있다"},{"id":"C","text":"1997년 유네스코 세계기록유산에 등재되었다"},{"id":"D","text":"한글의 역사를 담은 소설이다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_russell_detail_010', 'russell', 'READING', 'DETAIL', '{"id":"dq_russell_detail_010","serverId":"russell","questionType":"READING","category":"DETAIL","stem":"글의 내용과 다른 것은?","passage":"정약용은 조선 후기의 실학자로, 목민심서를 저술했습니다. 백성을 위한 정치를 강조했으며, 수원 화성 설계에도 참여했습니다.","choices":[{"id":"A","text":"정약용은 실학자이다"},{"id":"B","text":"목민심서를 저술했다"},{"id":"C","text":"수원 화성 설계에 참여했다"},{"id":"D","text":"조선 초기에 활동했다"}],"answerId":"D","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());


-- ============================================================
-- [4] wittgenstein 서버 (고등학교 수준)
-- ============================================================

-- ----------------------------------------------------------
-- wittgenstein / QUIZ / VOCAB (어휘 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_vocab_001', 'wittgenstein', 'QUIZ', 'VOCAB', '{"id":"dq_wittgenstein_vocab_001","serverId":"wittgenstein","questionType":"QUIZ","category":"VOCAB","stem":"경세제민의 뜻은?","passage":null,"choices":[{"id":"A","text":"세상을 다스리고 백성을 구한다"},{"id":"B","text":"경치가 아름답다"},{"id":"C","text":"세금을 줄인다"},{"id":"D","text":"민중이 봉기한다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_vocab_002', 'wittgenstein', 'QUIZ', 'VOCAB', '{"id":"dq_wittgenstein_vocab_002","serverId":"wittgenstein","questionType":"QUIZ","category":"VOCAB","stem":"형이상학적의 뜻으로 가장 적절한 것은?","passage":null,"choices":[{"id":"A","text":"물질적이고 구체적인"},{"id":"B","text":"경험을 초월한 근본적 원리에 관한"},{"id":"C","text":"형체가 있는"},{"id":"D","text":"수학적인"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_vocab_003', 'wittgenstein', 'QUIZ', 'VOCAB', '{"id":"dq_wittgenstein_vocab_003","serverId":"wittgenstein","questionType":"QUIZ","category":"VOCAB","stem":"자의적의 뜻은?","passage":null,"choices":[{"id":"A","text":"글자의 뜻에 따른"},{"id":"B","text":"자기 마음대로 하는"},{"id":"C","text":"자연스러운"},{"id":"D","text":"의미가 없는"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_vocab_004', 'wittgenstein', 'QUIZ', 'VOCAB', '{"id":"dq_wittgenstein_vocab_004","serverId":"wittgenstein","questionType":"QUIZ","category":"VOCAB","stem":"현학적의 뜻은?","passage":null,"choices":[{"id":"A","text":"학문을 실용적으로 활용하는"},{"id":"B","text":"학식이 있는 체하며 거드름을 피우는"},{"id":"C","text":"현재의 학문"},{"id":"D","text":"학문이 뛰어난"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_vocab_005', 'wittgenstein', 'QUIZ', 'VOCAB', '{"id":"dq_wittgenstein_vocab_005","serverId":"wittgenstein","questionType":"QUIZ","category":"VOCAB","stem":"시사하다와 가장 가까운 뜻은?","passage":null,"choices":[{"id":"A","text":"직접 말하다"},{"id":"B","text":"넌지시 알리거나 암시하다"},{"id":"C","text":"큰 소리로 외치다"},{"id":"D","text":"자세히 설명하다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_vocab_006', 'wittgenstein', 'QUIZ', 'VOCAB', '{"id":"dq_wittgenstein_vocab_006","serverId":"wittgenstein","questionType":"QUIZ","category":"VOCAB","stem":"전복적의 뜻은?","passage":null,"choices":[{"id":"A","text":"기존 질서를 뒤집으려는"},{"id":"B","text":"전복 요리와 관련된"},{"id":"C","text":"복을 비는"},{"id":"D","text":"천천히 변화하는"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_vocab_007', 'wittgenstein', 'QUIZ', 'VOCAB', '{"id":"dq_wittgenstein_vocab_007","serverId":"wittgenstein","questionType":"QUIZ","category":"VOCAB","stem":"범주의 뜻은?","passage":null,"choices":[{"id":"A","text":"범이 사는 곳"},{"id":"B","text":"같은 성질의 부류나 영역"},{"id":"C","text":"넓은 바다"},{"id":"D","text":"범죄의 종류"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_vocab_008', 'wittgenstein', 'QUIZ', 'VOCAB', '{"id":"dq_wittgenstein_vocab_008","serverId":"wittgenstein","questionType":"QUIZ","category":"VOCAB","stem":"환기하다의 뜻으로 적절한 것은?","passage":null,"choices":[{"id":"A","text":"공기를 바꾸다"},{"id":"B","text":"주의나 생각을 불러일으키다"},{"id":"C","text":"환호하다"},{"id":"D","text":"A와 B 모두 맞다"}],"answerId":"D","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_vocab_009', 'wittgenstein', 'QUIZ', 'VOCAB', '{"id":"dq_wittgenstein_vocab_009","serverId":"wittgenstein","questionType":"QUIZ","category":"VOCAB","stem":"다음 중 맞춤법이 바른 것은?","passage":null,"choices":[{"id":"A","text":"희안하다"},{"id":"B","text":"희한하다"},{"id":"C","text":"히한하다"},{"id":"D","text":"히안하다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_vocab_010', 'wittgenstein', 'QUIZ', 'VOCAB', '{"id":"dq_wittgenstein_vocab_010","serverId":"wittgenstein","questionType":"QUIZ","category":"VOCAB","stem":"천착하다의 뜻은?","passage":null,"choices":[{"id":"A","text":"잘 속다"},{"id":"B","text":"깊이 파고들어 연구하다"},{"id":"C","text":"착하게 행동하다"},{"id":"D","text":"하늘을 바라보다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- wittgenstein / QUIZ / BACKGROUND (배경지식 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_background_001', 'wittgenstein', 'QUIZ', 'BACKGROUND', '{"id":"dq_wittgenstein_background_001","serverId":"wittgenstein","questionType":"QUIZ","category":"BACKGROUND","stem":"이광수의 무정이 한국 문학사에서 갖는 의의는?","passage":null,"choices":[{"id":"A","text":"최초의 현대 장편 소설"},{"id":"B","text":"최초의 시집"},{"id":"C","text":"최초의 희곡"},{"id":"D","text":"최초의 수필집"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_background_002', 'wittgenstein', 'QUIZ', 'BACKGROUND', '{"id":"dq_wittgenstein_background_002","serverId":"wittgenstein","questionType":"QUIZ","category":"BACKGROUND","stem":"카프(KAPF)는 어떤 문학 단체인가요?","passage":null,"choices":[{"id":"A","text":"순수 문학을 추구하는 단체"},{"id":"B","text":"계급주의 문학을 지향하는 프로문학 단체"},{"id":"C","text":"전통 시조를 연구하는 단체"},{"id":"D","text":"외국 문학을 번역하는 단체"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_background_003', 'wittgenstein', 'QUIZ', 'BACKGROUND', '{"id":"dq_wittgenstein_background_003","serverId":"wittgenstein","questionType":"QUIZ","category":"BACKGROUND","stem":"춘향전의 문학적 갈등 구조는?","passage":null,"choices":[{"id":"A","text":"인간 대 자연"},{"id":"B","text":"신분 차별에 대한 저항과 사랑의 갈등"},{"id":"C","text":"과학 대 종교"},{"id":"D","text":"동양 대 서양"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_background_004', 'wittgenstein', 'QUIZ', 'BACKGROUND', '{"id":"dq_wittgenstein_background_004","serverId":"wittgenstein","questionType":"QUIZ","category":"BACKGROUND","stem":"김수영 시인이 추구한 문학적 가치는?","passage":null,"choices":[{"id":"A","text":"전통적 서정"},{"id":"B","text":"자유와 민주주의, 참여 문학"},{"id":"C","text":"순수 자연 묘사"},{"id":"D","text":"종교적 구원"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_background_005', 'wittgenstein', 'QUIZ', 'BACKGROUND', '{"id":"dq_wittgenstein_background_005","serverId":"wittgenstein","questionType":"QUIZ","category":"BACKGROUND","stem":"소쉬르의 언어학에서 랑그와 파롤의 차이는?","passage":null,"choices":[{"id":"A","text":"랑그는 개인의 발화, 파롤은 사회적 언어 체계"},{"id":"B","text":"랑그는 사회적 언어 체계, 파롤은 개인의 발화"},{"id":"C","text":"둘 다 같은 뜻이다"},{"id":"D","text":"랑그는 문법, 파롤은 어휘이다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_background_006', 'wittgenstein', 'QUIZ', 'BACKGROUND', '{"id":"dq_wittgenstein_background_006","serverId":"wittgenstein","questionType":"QUIZ","category":"BACKGROUND","stem":"박경리의 토지는 어떤 시대를 배경으로 하나요?","passage":null,"choices":[{"id":"A","text":"고려 시대"},{"id":"B","text":"구한말에서 해방 직후까지"},{"id":"C","text":"조선 초기"},{"id":"D","text":"1980년대"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_background_007', 'wittgenstein', 'QUIZ', 'BACKGROUND', '{"id":"dq_wittgenstein_background_007","serverId":"wittgenstein","questionType":"QUIZ","category":"BACKGROUND","stem":"객관적 상관물의 개념을 주장한 문학 이론가는?","passage":null,"choices":[{"id":"A","text":"T.S. 엘리엇"},{"id":"B","text":"아리스토텔레스"},{"id":"C","text":"칸트"},{"id":"D","text":"사르트르"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_background_008', 'wittgenstein', 'QUIZ', 'BACKGROUND', '{"id":"dq_wittgenstein_background_008","serverId":"wittgenstein","questionType":"QUIZ","category":"BACKGROUND","stem":"1920년대 한국 시단에서 님의 침묵을 쓴 시인은?","passage":null,"choices":[{"id":"A","text":"김소월"},{"id":"B","text":"한용운"},{"id":"C","text":"이상"},{"id":"D","text":"정지용"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_background_009', 'wittgenstein', 'QUIZ', 'BACKGROUND', '{"id":"dq_wittgenstein_background_009","serverId":"wittgenstein","questionType":"QUIZ","category":"BACKGROUND","stem":"탈식민주의 비평의 핵심 관심사는?","passage":null,"choices":[{"id":"A","text":"문학의 미적 가치만 분석"},{"id":"B","text":"제국주의와 식민 지배의 영향을 비판적으로 분석"},{"id":"C","text":"작가의 전기적 사실만 연구"},{"id":"D","text":"문법 오류를 지적"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_background_010', 'wittgenstein', 'QUIZ', 'BACKGROUND', '{"id":"dq_wittgenstein_background_010","serverId":"wittgenstein","questionType":"QUIZ","category":"BACKGROUND","stem":"채만식의 태평천하에서 주로 사용된 서술 기법은?","passage":null,"choices":[{"id":"A","text":"서정적 묘사"},{"id":"B","text":"풍자와 아이러니"},{"id":"C","text":"내면 독백"},{"id":"D","text":"환상적 기법"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- wittgenstein / QUIZ / CONCEPT (국어 개념 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_concept_001', 'wittgenstein', 'QUIZ', 'CONCEPT', '{"id":"dq_wittgenstein_concept_001","serverId":"wittgenstein","questionType":"QUIZ","category":"CONCEPT","stem":"중세 국어에서 아래아(ㆍ)의 기능은?","passage":null,"choices":[{"id":"A","text":"자음으로 사용"},{"id":"B","text":"모음으로 사용"},{"id":"C","text":"받침으로만 사용"},{"id":"D","text":"부호로 사용"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_concept_002', 'wittgenstein', 'QUIZ', 'CONCEPT', '{"id":"dq_wittgenstein_concept_002","serverId":"wittgenstein","questionType":"QUIZ","category":"CONCEPT","stem":"담화에서 전제와 함축의 차이는?","passage":null,"choices":[{"id":"A","text":"전제는 발화의 배경 지식, 함축은 직접 말하지 않고 전달하는 의미"},{"id":"B","text":"둘 다 같은 뜻이다"},{"id":"C","text":"전제는 결론, 함축은 서론이다"},{"id":"D","text":"전제는 미래, 함축은 과거에 관한 것이다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_concept_003', 'wittgenstein', 'QUIZ', 'CONCEPT', '{"id":"dq_wittgenstein_concept_003","serverId":"wittgenstein","questionType":"QUIZ","category":"CONCEPT","stem":"곶이 → 고지 → 곶과 같은 변화를 무엇이라 하나요?","passage":null,"choices":[{"id":"A","text":"음운 축약"},{"id":"B","text":"음운 탈락"},{"id":"C","text":"구개음화"},{"id":"D","text":"모음 조화"}],"answerId":"C","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_concept_004', 'wittgenstein', 'QUIZ', 'CONCEPT', '{"id":"dq_wittgenstein_concept_004","serverId":"wittgenstein","questionType":"QUIZ","category":"CONCEPT","stem":"아이러니의 유형 중, 독자는 알지만 작품 속 인물은 모르는 것을 무엇이라 하나요?","passage":null,"choices":[{"id":"A","text":"언어적 아이러니"},{"id":"B","text":"극적 아이러니"},{"id":"C","text":"상황적 아이러니"},{"id":"D","text":"낭만적 아이러니"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_concept_005', 'wittgenstein', 'QUIZ', 'CONCEPT', '{"id":"dq_wittgenstein_concept_005","serverId":"wittgenstein","questionType":"QUIZ","category":"CONCEPT","stem":"논증에서 연역과 귀납의 차이로 올바른 것은?","passage":null,"choices":[{"id":"A","text":"연역은 일반에서 특수로, 귀납은 특수에서 일반으로"},{"id":"B","text":"연역은 특수에서 일반으로, 귀납은 일반에서 특수로"},{"id":"C","text":"둘 다 같은 방향이다"},{"id":"D","text":"연역은 실험, 귀납은 이론이다"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_concept_006', 'wittgenstein', 'QUIZ', 'CONCEPT', '{"id":"dq_wittgenstein_concept_006","serverId":"wittgenstein","questionType":"QUIZ","category":"CONCEPT","stem":"훈민정음의 제자 원리 중 자음의 기본 글자 ㄱ, ㄴ, ㅁ, ㅅ, ㅇ은 무엇을 본떠 만들었나요?","passage":null,"choices":[{"id":"A","text":"자연의 모양"},{"id":"B","text":"발음 기관의 모양"},{"id":"C","text":"동물의 모양"},{"id":"D","text":"사물의 모양"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_concept_007', 'wittgenstein', 'QUIZ', 'CONCEPT', '{"id":"dq_wittgenstein_concept_007","serverId":"wittgenstein","questionType":"QUIZ","category":"CONCEPT","stem":"소설에서 서술자의 개입이 많은 서술 방식은?","passage":null,"choices":[{"id":"A","text":"보여주기(showing)"},{"id":"B","text":"말하기(telling)"},{"id":"C","text":"의식의 흐름"},{"id":"D","text":"대화체"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_concept_008', 'wittgenstein', 'QUIZ', 'CONCEPT', '{"id":"dq_wittgenstein_concept_008","serverId":"wittgenstein","questionType":"QUIZ","category":"CONCEPT","stem":"매체 언어에서 프레이밍 효과란?","passage":null,"choices":[{"id":"A","text":"사진의 구도"},{"id":"B","text":"동일한 정보를 어떤 틀로 제시하느냐에 따라 해석이 달라지는 현상"},{"id":"C","text":"영화의 촬영 기법"},{"id":"D","text":"그림의 액자 효과"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_concept_009', 'wittgenstein', 'QUIZ', 'CONCEPT', '{"id":"dq_wittgenstein_concept_009","serverId":"wittgenstein","questionType":"QUIZ","category":"CONCEPT","stem":"형태소의 정의로 올바른 것은?","passage":null,"choices":[{"id":"A","text":"의미를 가진 가장 작은 말의 단위"},{"id":"B","text":"발음할 수 있는 가장 작은 단위"},{"id":"C","text":"문장의 기본 단위"},{"id":"D","text":"단어의 집합"}],"answerId":"A","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_concept_010', 'wittgenstein', 'QUIZ', 'CONCEPT', '{"id":"dq_wittgenstein_concept_010","serverId":"wittgenstein","questionType":"QUIZ","category":"CONCEPT","stem":"내포와 외연의 관계로 올바른 것은?","passage":null,"choices":[{"id":"A","text":"내포가 커지면 외연도 커진다"},{"id":"B","text":"내포가 커지면 외연은 작아진다"},{"id":"C","text":"둘은 관계가 없다"},{"id":"D","text":"항상 같다"}],"answerId":"B","timeLimitSec":30}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- wittgenstein / READING / SENTENCE (문장 독해 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_sentence_001', 'wittgenstein', 'READING', 'SENTENCE', '{"id":"dq_wittgenstein_sentence_001","serverId":"wittgenstein","questionType":"READING","category":"SENTENCE","stem":"이 글의 논지로 가장 적절한 것은?","passage":"기술의 발전이 반드시 인간의 행복을 보장하지는 않는다. 오히려 기술에 대한 의존이 깊어질수록 인간 고유의 사유 능력과 공감 능력이 퇴화할 수 있다는 우려가 커지고 있다.","choices":[{"id":"A","text":"기술 발전의 부작용에 대한 성찰 필요"},{"id":"B","text":"기술을 빨리 발전시켜야 한다"},{"id":"C","text":"행복은 기술로만 달성된다"},{"id":"D","text":"인간의 능력은 변하지 않는다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_sentence_002', 'wittgenstein', 'READING', 'SENTENCE', '{"id":"dq_wittgenstein_sentence_002","serverId":"wittgenstein","questionType":"READING","category":"SENTENCE","stem":"이 글에서 글쓴이가 비판하는 것은?","passage":"대중문화가 상업 논리에 종속되면 문화의 다양성이 훼손됩니다. 시청률과 수익만을 좇는 콘텐츠 생산은 획일적인 문화 소비를 고착시키고, 창의적 실험을 위축시킵니다.","choices":[{"id":"A","text":"상업 논리에 종속된 대중문화"},{"id":"B","text":"문화의 다양성"},{"id":"C","text":"창의적 실험"},{"id":"D","text":"대중의 문화 소비"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_sentence_003', 'wittgenstein', 'READING', 'SENTENCE', '{"id":"dq_wittgenstein_sentence_003","serverId":"wittgenstein","questionType":"READING","category":"SENTENCE","stem":"이 글의 핵심 주장은?","passage":"언어는 단순한 의사소통 도구가 아니라 세계를 인식하는 틀이다. 우리가 사용하는 언어가 우리의 사고를 규정하고, 나아가 세계관을 형성한다는 점에서 언어에 대한 성찰이 곧 자기 인식의 출발점이 된다.","choices":[{"id":"A","text":"언어는 사고와 세계관을 형성한다"},{"id":"B","text":"언어는 의사소통 도구에 불과하다"},{"id":"C","text":"외국어를 배워야 한다"},{"id":"D","text":"언어는 변하지 않는다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_sentence_004', 'wittgenstein', 'READING', 'SENTENCE', '{"id":"dq_wittgenstein_sentence_004","serverId":"wittgenstein","questionType":"READING","category":"SENTENCE","stem":"이 글에서 추론할 수 있는 것은?","passage":"근대 이전 사회에서 텍스트의 해석 권한은 소수의 지식인에게 집중되어 있었다. 인쇄술의 발명과 대중 교육의 확산은 이러한 독점 구조를 무너뜨렸으며, 디지털 시대에는 누구나 텍스트를 생산하고 해석하는 주체가 되었다.","choices":[{"id":"A","text":"해석의 민주화가 이루어졌다"},{"id":"B","text":"지식인만 텍스트를 해석해야 한다"},{"id":"C","text":"인쇄술은 부정적이다"},{"id":"D","text":"디지털 시대는 위험하다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_sentence_005', 'wittgenstein', 'READING', 'SENTENCE', '{"id":"dq_wittgenstein_sentence_005","serverId":"wittgenstein","questionType":"READING","category":"SENTENCE","stem":"이 글의 논리 전개 방식은?","passage":"전통 예술은 보존해야 할 유산이지만, 동시에 현대적으로 재해석될 때 더 큰 생명력을 얻는다. 판소리의 현대적 변용이나 한복의 일상복화는 전통을 박제하지 않고 살아 숨 쉬게 만드는 시도이다.","choices":[{"id":"A","text":"전통의 보존만 강조"},{"id":"B","text":"전통의 현대적 재해석을 통한 계승 주장"},{"id":"C","text":"현대 예술만 가치 있다고 주장"},{"id":"D","text":"전통 예술을 폐기해야 한다고 주장"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_sentence_006', 'wittgenstein', 'READING', 'SENTENCE', '{"id":"dq_wittgenstein_sentence_006","serverId":"wittgenstein","questionType":"READING","category":"SENTENCE","stem":"이 글의 중심 논지는?","passage":"문학 작품을 해석할 때 작가의 의도만을 절대적 기준으로 삼는 것은 한계가 있다. 텍스트는 작가의 손을 떠나는 순간 독자와의 상호 작용 속에서 새로운 의미를 생산하기 때문이다.","choices":[{"id":"A","text":"독자의 능동적 해석의 중요성"},{"id":"B","text":"작가의 의도만이 중요하다"},{"id":"C","text":"문학 해석은 불가능하다"},{"id":"D","text":"텍스트는 고정된 의미를 갖는다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_sentence_007', 'wittgenstein', 'READING', 'SENTENCE', '{"id":"dq_wittgenstein_sentence_007","serverId":"wittgenstein","questionType":"READING","category":"SENTENCE","stem":"이 글에서 글쓴이의 관점은?","passage":"효율성만을 추구하는 사회에서 인문학은 종종 무용한 것으로 치부된다. 그러나 인문학은 인간의 존재 의미를 탐구하고 비판적 사고를 길러 주는 토대로서, 그 가치가 실용적 척도로 환원될 수 없다.","choices":[{"id":"A","text":"인문학의 본질적 가치 옹호"},{"id":"B","text":"효율성이 가장 중요하다"},{"id":"C","text":"인문학은 폐지해야 한다"},{"id":"D","text":"실용 학문만 배워야 한다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_sentence_008', 'wittgenstein', 'READING', 'SENTENCE', '{"id":"dq_wittgenstein_sentence_008","serverId":"wittgenstein","questionType":"READING","category":"SENTENCE","stem":"이 글의 핵심 내용은?","passage":"비판적 읽기란 텍스트의 표면적 의미를 넘어, 숨겨진 전제와 논리적 오류를 포착하며, 글쓴이의 관점이 어떤 맥락에서 형성되었는지를 파악하는 능동적 독서 행위이다.","choices":[{"id":"A","text":"비판적 읽기의 정의와 의의"},{"id":"B","text":"빠르게 읽는 방법"},{"id":"C","text":"글쓴이를 비난하는 방법"},{"id":"D","text":"책을 많이 읽는 방법"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_sentence_009', 'wittgenstein', 'READING', 'SENTENCE', '{"id":"dq_wittgenstein_sentence_009","serverId":"wittgenstein","questionType":"READING","category":"SENTENCE","stem":"이 글의 주제는?","passage":"현대 사회에서 개인의 정체성은 고정된 것이 아니라 끊임없이 구성되는 것이다. 사회적 관계, 문화적 맥락, 매체 환경 속에서 자아는 다층적으로 형성되며, 이러한 유동성 자체가 현대적 주체의 특징이다.","choices":[{"id":"A","text":"현대적 정체성의 유동성"},{"id":"B","text":"전통적 가치의 중요성"},{"id":"C","text":"고정된 자아의 필요성"},{"id":"D","text":"사회와 단절된 개인"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_sentence_010', 'wittgenstein', 'READING', 'SENTENCE', '{"id":"dq_wittgenstein_sentence_010","serverId":"wittgenstein","questionType":"READING","category":"SENTENCE","stem":"이 글에서 강조하는 것은?","passage":"수능 국어 영역에서 비문학 독해력은 단순한 정보 파악을 넘어, 글의 구조를 파악하고 논리적 관계를 추론하며, 다양한 분야의 글을 종합적으로 이해하는 능력을 요구한다.","choices":[{"id":"A","text":"비문학 독해의 종합적 성격"},{"id":"B","text":"문학만 공부하면 된다"},{"id":"C","text":"단순 암기의 중요성"},{"id":"D","text":"시험은 중요하지 않다"}],"answerId":"A","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

-- ----------------------------------------------------------
-- wittgenstein / READING / DETAIL (세부사항 파악 10문제)
-- ----------------------------------------------------------

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_detail_001', 'wittgenstein', 'READING', 'DETAIL', '{"id":"dq_wittgenstein_detail_001","serverId":"wittgenstein","questionType":"READING","category":"DETAIL","stem":"글의 내용과 일치하는 것은?","passage":"이상의 소설 날개는 1936년에 발표되었으며, 의식의 흐름 기법을 사용하여 근대 도시인의 소외와 자아 분열을 그린 작품이다. 박제가 되어 버린 천재라는 유명한 구절로 시작한다.","choices":[{"id":"A","text":"날개는 1950년에 발표되었다"},{"id":"B","text":"사실주의 기법으로 쓰였다"},{"id":"C","text":"의식의 흐름 기법이 사용되었다"},{"id":"D","text":"농촌 생활을 그렸다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_detail_002', 'wittgenstein', 'READING', 'DETAIL', '{"id":"dq_wittgenstein_detail_002","serverId":"wittgenstein","questionType":"READING","category":"DETAIL","stem":"글의 내용과 다른 것은?","passage":"훈민정음은 1443년 창제되어 1446년에 반포되었다. 자음은 발음 기관을 상형하고, 모음은 천지인 삼재를 본떠 만들었다. 초성, 중성, 종성의 3분법 체계를 갖추고 있다.","choices":[{"id":"A","text":"1443년에 창제되었다"},{"id":"B","text":"자음은 발음 기관을 본떴다"},{"id":"C","text":"모음은 동물의 모양을 본떴다"},{"id":"D","text":"3분법 체계를 갖추고 있다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_detail_003', 'wittgenstein', 'READING', 'DETAIL', '{"id":"dq_wittgenstein_detail_003","serverId":"wittgenstein","questionType":"READING","category":"DETAIL","stem":"이 글에서 추론할 수 있는 것은?","passage":"러시아 형식주의자들은 문학의 문학성을 탐구했다. 그들은 일상 언어와 문학 언어의 차이에 주목하며, 낯설게 하기(ostranenie)를 문학의 핵심 장치로 보았다. 익숙한 대상을 낯설게 표현함으로써 독자의 지각을 새롭게 한다는 것이다.","choices":[{"id":"A","text":"문학은 일상 언어와 동일하다"},{"id":"B","text":"낯설게 하기는 독자의 인식을 갱신하는 기능을 한다"},{"id":"C","text":"러시아 형식주의는 작가의 전기를 중시한다"},{"id":"D","text":"문학은 사회 반영에만 가치가 있다"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_detail_004', 'wittgenstein', 'READING', 'DETAIL', '{"id":"dq_wittgenstein_detail_004","serverId":"wittgenstein","questionType":"READING","category":"DETAIL","stem":"글의 내용과 일치하는 것은?","passage":"국어의 높임법은 주체 높임, 객체 높임, 상대 높임의 세 가지로 나뉜다. 주체 높임은 선어말 어미 -(으)시-로 실현되고, 객체 높임은 드리다, 여쭈다 등의 특수 어휘로 실현되며, 상대 높임은 종결 어미의 등급으로 나타난다.","choices":[{"id":"A","text":"높임법은 두 가지이다"},{"id":"B","text":"주체 높임은 종결 어미로 실현된다"},{"id":"C","text":"객체 높임은 특수 어휘로 실현된다"},{"id":"D","text":"상대 높임은 선어말 어미로 실현된다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_detail_005', 'wittgenstein', 'READING', 'DETAIL', '{"id":"dq_wittgenstein_detail_005","serverId":"wittgenstein","questionType":"READING","category":"DETAIL","stem":"글의 내용과 다른 것은?","passage":"판소리는 소리(창), 아니리(말), 발림(몸짓)의 세 요소로 구성된다. 동편제는 웅장하고 남성적인 창법, 서편제는 부드럽고 애절한 창법으로 특징지어진다. 현재 전해지는 다섯 마당은 춘향가, 심청가, 흥보가, 수궁가, 적벽가이다.","choices":[{"id":"A","text":"판소리는 세 요소로 구성된다"},{"id":"B","text":"동편제는 부드러운 창법이다"},{"id":"C","text":"현재 다섯 마당이 전해진다"},{"id":"D","text":"서편제는 애절한 창법이다"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_detail_006', 'wittgenstein', 'READING', 'DETAIL', '{"id":"dq_wittgenstein_detail_006","serverId":"wittgenstein","questionType":"READING","category":"DETAIL","stem":"이 글에서 알 수 있는 것은?","passage":"로만 야콥슨은 언어의 기능을 여섯 가지로 분류했다. 그중 시적 기능은 메시지 자체의 형식에 초점을 맞추는 기능으로, 문학 특히 시에서 두드러진다. 시적 기능이 지배적인 텍스트에서는 언어의 소리, 리듬, 구조 자체가 의미 생산에 기여한다.","choices":[{"id":"A","text":"야콥슨은 언어 기능을 세 가지로 분류했다"},{"id":"B","text":"시적 기능은 메시지 형식에 초점을 맞춘다"},{"id":"C","text":"시적 기능은 소설에서만 나타난다"},{"id":"D","text":"언어의 소리와 리듬은 의미와 무관하다"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_detail_007', 'wittgenstein', 'READING', 'DETAIL', '{"id":"dq_wittgenstein_detail_007","serverId":"wittgenstein","questionType":"READING","category":"DETAIL","stem":"글의 내용과 일치하는 것은?","passage":"국어의 음운 변동에는 교체, 탈락, 첨가, 축약의 네 유형이 있다. 꽃밭이 [꼰빧]으로 발음되는 것은 비음화(교체)와 된소리되기(교체)가 함께 일어난 결과이다. 이처럼 하나의 단어에서 여러 음운 변동이 동시에 적용될 수 있다.","choices":[{"id":"A","text":"음운 변동은 세 유형이다"},{"id":"B","text":"꽃밭에서 비음화와 된소리되기가 일어난다"},{"id":"C","text":"하나의 단어에는 하나의 음운 변동만 적용된다"},{"id":"D","text":"교체와 탈락은 같은 현상이다"}],"answerId":"B","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_detail_008', 'wittgenstein', 'READING', 'DETAIL', '{"id":"dq_wittgenstein_detail_008","serverId":"wittgenstein","questionType":"READING","category":"DETAIL","stem":"글의 내용과 다른 것은?","passage":"김소월의 시 세계는 전통적 한(恨)의 정서를 바탕으로 한다. 민요적 율격인 7·5조 또는 3음보를 주로 사용했으며, 이별과 그리움의 정서를 여성 화자의 목소리로 노래했다. 대표작으로 진달래꽃, 산유화, 엄마야 누나야 등이 있다.","choices":[{"id":"A","text":"민요적 율격을 사용했다"},{"id":"B","text":"이별과 그리움의 정서를 다루었다"},{"id":"C","text":"남성 화자의 목소리를 주로 사용했다"},{"id":"D","text":"진달래꽃은 대표작이다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_detail_009', 'wittgenstein', 'READING', 'DETAIL', '{"id":"dq_wittgenstein_detail_009","serverId":"wittgenstein","questionType":"READING","category":"DETAIL","stem":"이 글에서 알 수 있는 사실은?","passage":"중세 국어는 현대 국어와 여러 면에서 다르다. 성조(방점)가 존재했고, 모음 조화가 비교적 엄격하게 지켜졌으며, 주격 조사로 이만 사용되었다. 또한 ㅸ(순경음 비읍)과 같은 현재는 사라진 자음도 존재했다.","choices":[{"id":"A","text":"중세 국어에는 성조가 없었다"},{"id":"B","text":"모음 조화가 엄격하지 않았다"},{"id":"C","text":"주격 조사로 이만 사용되었다"},{"id":"D","text":"현대 국어와 완전히 동일하다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());

INSERT INTO duel_question_pool (id, server_id, question_type, category, question_json, status, created_at, updated_at)
VALUES ('dq_wittgenstein_detail_010', 'wittgenstein', 'READING', 'DETAIL', '{"id":"dq_wittgenstein_detail_010","serverId":"wittgenstein","questionType":"READING","category":"DETAIL","stem":"글의 내용과 일치하는 것은?","passage":"수능 국어 영역의 화법과 작문 영역에서는 담화 상황에 맞는 의사소통 능력을 평가한다. 화법에서는 토론, 발표, 협상 등의 담화 유형을 다루며, 작문에서는 글의 목적, 독자, 매체에 따른 전략적 글쓰기 능력을 평가한다. 이는 단순한 지식 암기가 아닌 실제 언어 사용 능력을 측정하기 위함이다.","choices":[{"id":"A","text":"화법 영역에서는 문법만 평가한다"},{"id":"B","text":"작문에서는 글씨를 평가한다"},{"id":"C","text":"실제 언어 사용 능력을 측정하려는 목적이 있다"},{"id":"D","text":"암기력만 평가한다"}],"answerId":"C","timeLimitSec":45}', 'ACTIVE', NOW(), NOW());
