#!/usr/bin/env node
// 프레게2 Day 349~353 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION(비문학), 짝수 Day = LITERATURE(문학)
// 목표 글자수: 900±50 (850~950자)

const fs = require('fs');
const path = require('path');

// ─── 유틸리티 함수 ───
function findSentences(text) {
  const sentences = []; let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1; while (next < text.length && (text[next] === ' ' || text[next] === '\n')) next++; start = next;
    }
  }
  if (start < text.length) sentences.push({ start, end: text.length, text: text.substring(start) });
  return sentences;
}

function findRange(paragraphs, pid, searchText) {
  const para = paragraphs.find(p => p.id === pid);
  if (!para) throw new Error(`문단 ${pid} 없음`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText.substring(0, 30)}..." ${pid}에서 찾을 수 없음`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charLen(paragraphs) { return paragraphs.reduce((sum, p) => sum + p.text.length, 0); }

function buildTimeline(paragraphs) {
  let stepNum = 0; const timeline = [];
  paragraphs.forEach((para) => {
    const sents = findSentences(para.text);
    sents.forEach((sent) => { stepNum++; timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] } }); });
    stepNum++; timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] } });
  });
  return timeline;
}

function buildRecallCards(paragraphs) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length; const chunkSize = Math.ceil(totalLen / 8); const cards = [];
  for (let i = 0; i < 8; i++) { const s = i * chunkSize; const e = Math.min(s + chunkSize, totalLen); cards.push({ id: `c${i+1}`, text: fullText.substring(s, e) }); }
  return cards;
}

function makeConfirmQ(id, prompt, ranges) {
  return { id, prompt, answerRanges: ranges, scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: "ANY" };
}

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs); const cards = buildRecallCards(paragraphs);
  const nn = String(dayIndex).padStart(3, '0');
  return { contentId: `dr-f2-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(프레게 2) Day ${dayIndex} ${subAreaKo}`, description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_2", schoolGradeRange: { min: 6, max: 6 }, area: "READING", subArea,
    competencies: ["READING"], tags: ["daily"], access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 }, timeLimitSec: 480, assets: {},
    payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 }, confirm: { questions: confirmQuestions } }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return { content_type: "DAILY_READING", level_id: "FREGE_2", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// ═══════════════════════════════════════════════════════════
// Day 349 — 비문학 (NONFICTION): 인공지능과 언어 이해
// ═══════════════════════════════════════════════════════════
function buildDay349() {
  const paragraphs = [
    { id: "p1", text: "인공지능이 인간의 언어를 이해한다는 것은 단순히 단어의 뜻을 사전적으로 파악하는 것 이상의 의미를 지닌다. 언어는 맥락과 상황에 따라 의미가 달라지며, 화자의 의도와 감정까지 담고 있기 때문이다. 예를 들어 '날씨가 참 좋네요'라는 말은 실제로 날씨를 칭찬하는 것일 수도 있지만, 비가 쏟아지는 상황에서 말한다면 반어적 표현이 된다. 또한 같은 단어라도 문화적 배경에 따라 전혀 다른 뉘앙스를 전달할 수 있다. 이러한 언어의 다층적 특성을 기계가 정확히 파악하기란 결코 쉽지 않은 과제이다." },
    { id: "p2", text: "현대의 대규모 언어 모델은 방대한 텍스트 데이터를 학습하여 문장의 패턴과 확률 분포를 파악한다. 이 과정에서 모델은 단어 간의 관계, 문장 구조의 규칙성, 담화의 흐름 등을 통계적으로 학습한다. 수천만 개의 문서를 반복 학습한 결과, 유창한 문장을 생성하고, 질문에 적절한 답변을 제시하며, 번역과 요약 같은 복잡한 과제를 높은 정확도로 수행할 수 있게 되었다. 또한 시를 짓거나 소설의 일부를 쓰는 등 창작 활동에도 활용되고 있다. 그러나 이것이 진정한 의미의 '이해'인지에 대해서는 학계에서 여전히 치열한 논쟁이 존재한다." },
    { id: "p3", text: "철학자 존 설은 '중국어 방' 사고실험을 통해 기계의 언어 처리가 진정한 이해가 아님을 주장하였다. 방 안에 있는 사람이 중국어 규칙서를 따라 답변을 작성하더라도, 그 사람이 중국어를 이해한다고 볼 수 없다는 것이다. 마찬가지로 인공지능이 규칙에 따라 문장을 생성하는 것과 의미를 진정으로 이해하는 것은 다른 차원의 문제라고 그는 역설하였다. 반대편에서는 충분히 복잡한 시스템이라면 이해의 속성이 창발할 수 있다는 반론도 제기된다. 이 논쟁은 인공지능 연구의 근본적 한계와 가능성을 동시에 조명하며, 인간 고유의 이해 능력이 무엇인지 되묻게 만든다." }
  ];
  console.log(`  Day 349 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "인공지능의 언어 이해가 사전적 의미 파악 이상이라고 한 이유를 찾아보세요.",
      [findRange(paragraphs, "p1", "언어는 맥락과 상황에 따라 의미가 달라지며, 화자의 의도와 감정까지 담고 있기 때문이다.")]),
    makeConfirmQ("q2", "'날씨가 참 좋네요'가 반어적 표현이 되는 조건을 찾아보세요.",
      [findRange(paragraphs, "p1", "비가 쏟아지는 상황에서 말한다면 반어적 표현이 된다.")]),
    makeConfirmQ("q3", "같은 단어가 다른 뉘앙스를 전달할 수 있는 요인을 찾아보세요.",
      [findRange(paragraphs, "p1", "같은 단어라도 문화적 배경에 따라 전혀 다른 뉘앙스를 전달할 수 있다.")]),
    makeConfirmQ("q4", "대규모 언어 모델이 학습하는 요소들을 찾아보세요.",
      [findRange(paragraphs, "p2", "단어 간의 관계, 문장 구조의 규칙성, 담화의 흐름 등을 통계적으로 학습한다.")]),
    makeConfirmQ("q5", "언어 모델의 창작 활동 활용 사례를 찾아보세요.",
      [findRange(paragraphs, "p2", "시를 짓거나 소설의 일부를 쓰는 등 창작 활동에도 활용되고 있다.")]),
    makeConfirmQ("q6", "'중국어 방' 사고실험의 핵심 주장을 찾아보세요.",
      [findRange(paragraphs, "p3", "기계의 언어 처리가 진정한 이해가 아님을 주장하였다.")])
  ];

  const content = assembleFull(349, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ═══════════════════════════════════════════════════════════
// Day 350 — 문학 (LITERATURE): 고향의 봄
// ═══════════════════════════════════════════════════════════
function buildDay350() {
  const paragraphs = [
    { id: "p1", text: "기차가 고향 역에 도착했을 때, 나는 창밖으로 펼쳐지는 들판의 초록빛에 한동안 말을 잃었다. 서울에서 보낸 십여 년의 세월이 순식간에 녹아내리는 듯했다. 역 앞에는 늙은 느티나무가 여전히 서 있었고, 그 아래에서 동네 어르신 한 분이 짚방석에 앉아 졸고 계셨다. 봄바람이 느티나무 가지를 흔들 때마다 연둣빛 잎사귀들이 햇살에 반짝였다. 플랫폼에서 내리는 사람은 나뿐이었다. 나는 낯선 여행자처럼 조심스럽게 역 계단을 내려서며 깊은 숨을 들이쉬었다." },
    { id: "p2", text: "마을로 향하는 논길을 걸으며 나는 어린 시절의 기억을 하나씩 더듬었다. 개구리가 울던 논배미, 친구들과 뛰어놀던 징검다리, 할머니가 빨래를 널던 개울가가 차례로 떠올랐다. 바람에 실려 오는 흙냄새는 예전 그대로였으며, 논둑 위로 피어난 냉이꽃과 제비꽃이 발걸음을 멈추게 하였다. 그러나 풍경 속에서 달라진 것들도 적지 않게 눈에 들어왔다. 논 한쪽에 들어선 비닐하우스, 시멘트로 포장된 마을 입구의 도로, 사라진 옛 구멍가게들이 세월의 흔적을 말없이 전해 주고 있었다. 한때 아이들의 웃음소리로 떠들썩하던 마을 놀이터에는 녹슨 그네만이 바람에 흔들리고 있었다." },
    { id: "p3", text: "집 앞에 다다르자 어머니가 마당에서 나를 기다리고 계셨다. 주름이 깊어진 얼굴에 환한 미소가 번졌고, 거친 손으로 내 팔을 꼭 잡으셨다. 부엌에서는 된장찌개 냄새가 구수하게 풍겨 나왔고, 마루에는 내가 어릴 적 앉던 꽃무늬 방석이 그대로 놓여 있었다. 마당 한쪽의 감나무에는 새순이 돋아나고 있었고, 장독대 위로 햇살이 따스하게 내리쬐고 있었다. 고향이란 변해 버린 풍경 속에서도 변하지 않는 무언가를 간직한 곳이라는 생각이 가슴 깊은 곳에서 올라왔다. 나는 마루에 앉아 마당 너머 산등성이에 걸린 저녁노을을 바라보며 오래도록 그 자리를 떠나지 못했다." }
  ];
  console.log(`  Day 350 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "화자가 고향 역에 도착했을 때 느낀 감정을 찾아보세요.",
      [findRange(paragraphs, "p1", "창밖으로 펼쳐지는 들판의 초록빛에 한동안 말을 잃었다.")]),
    makeConfirmQ("q2", "역 앞의 변하지 않은 풍경을 묘사한 부분을 찾아보세요.",
      [findRange(paragraphs, "p1", "역 앞에는 늙은 느티나무가 여전히 서 있었고, 그 아래에서 동네 어르신 한 분이 짚방석에 앉아 졸고 계셨다.")]),
    makeConfirmQ("q3", "화자가 논길을 걸으며 떠올린 어린 시절 기억을 찾아보세요.",
      [findRange(paragraphs, "p2", "개구리가 울던 논배미, 친구들과 뛰어놀던 징검다리, 할머니가 빨래를 널던 개울가가 차례로 떠올랐다.")]),
    makeConfirmQ("q4", "마을에서 달라진 것들을 묘사한 부분을 찾아보세요.",
      [findRange(paragraphs, "p2", "논 한쪽에 들어선 비닐하우스, 시멘트로 포장된 마을 입구의 도로, 사라진 옛 구멍가게들이 세월의 흔적을 말없이 전해 주고 있었다.")]),
    makeConfirmQ("q5", "어머니의 모습을 묘사한 부분을 찾아보세요.",
      [findRange(paragraphs, "p3", "주름이 깊어진 얼굴에 환한 미소가 번졌고, 거친 손으로 내 팔을 꼭 잡으셨다.")]),
    makeConfirmQ("q6", "화자가 깨달은 고향의 의미를 찾아보세요.",
      [findRange(paragraphs, "p3", "고향이란 변해 버린 풍경 속에서도 변하지 않는 무언가를 간직한 곳이라는 생각이 가슴 깊은 곳에서 올라왔다.")])
  ];

  const content = assembleFull(350, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ═══════════════════════════════════════════════════════════
// Day 351 — 비문학 (NONFICTION): 미생물과 토양 생태계
// ═══════════════════════════════════════════════════════════
function buildDay351() {
  const paragraphs = [
    { id: "p1", text: "한 줌의 흙 속에는 수십억 마리의 미생물이 살고 있다. 세균, 곰팡이, 원생동물, 선충 등 다양한 생물이 복잡한 먹이 사슬을 이루며 토양의 건강을 유지한다. 이들은 낙엽과 동물의 사체 같은 유기물을 분해하여 식물이 흡수할 수 있는 질소, 인, 칼륨 등의 영양소로 전환시키는 역할을 담당한다. 토양 1그램에는 세균만 해도 수천 종이 존재하며, 이들 각각이 서로 다른 기능을 수행하고 있다. 미생물이 없다면 지구상의 물질 순환은 멈추고, 식물은 필요한 양분을 얻지 못하며, 결국 모든 생태계가 붕괴하고 말 것이다." },
    { id: "p2", text: "토양 미생물 중에서 특히 균근균은 식물과 공생 관계를 맺는 것으로 잘 알려져 있다. 균근균의 균사는 식물 뿌리보다 훨씬 가늘고 길어서 토양 속 넓은 범위에서 인과 질소 같은 영양분을 흡수하여 식물에게 전달한다. 그 대가로 식물은 광합성으로 만든 탄수화물을 균근균에게 제공한다. 이 상호 이익의 관계는 지구상 대부분의 육상 식물에서 관찰되며, 숲 생태계의 유지에 핵심적인 역할을 수행한다. 최근 연구에서는 균근균의 균사 네트워크가 나무들 사이에서 영양분과 화학 신호를 전달하는 일종의 지하 통신망 역할을 한다는 사실도 밝혀졌다." },
    { id: "p3", text: "그러나 토양 미생물의 다양성은 현대 농업으로 인해 심각하게 위협받고 있다. 화학 비료와 농약의 과도한 사용은 토양 미생물의 서식 환경을 파괴하여 장기적으로 토양의 비옥도를 크게 낮추는 결과를 초래한다. 단일 작물만을 반복 재배하는 관행 역시 미생물 종 다양성을 급격히 감소시키는 주요 원인이다. 이에 따라 유기농법이나 미생물 접종 기술, 돌려짓기와 같은 방법을 통해 토양 생태계를 보전하면서 농업 생산성을 유지하려는 노력이 전 세계적으로 확산되고 있다. 건강한 토양은 식량 안보의 기초이자 기후 변화 대응의 중요한 열쇠이다." }
  ];
  console.log(`  Day 351 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "한 줌의 흙 속에 사는 미생물의 종류를 찾아보세요.",
      [findRange(paragraphs, "p1", "세균, 곰팡이, 원생동물, 선충 등 다양한 생물이 복잡한 먹이 사슬을 이루며 토양의 건강을 유지한다.")]),
    makeConfirmQ("q2", "미생물이 유기물을 분해하여 만드는 영양소를 찾아보세요.",
      [findRange(paragraphs, "p1", "식물이 흡수할 수 있는 질소, 인, 칼륨 등의 영양소로 전환시키는 역할을 담당한다.")]),
    makeConfirmQ("q3", "미생물이 없을 때 일어날 결과를 찾아보세요.",
      [findRange(paragraphs, "p1", "미생물이 없다면 지구상의 물질 순환은 멈추고, 식물은 필요한 양분을 얻지 못하며, 결국 모든 생태계가 붕괴하고 말 것이다.")]),
    makeConfirmQ("q4", "균근균이 식물에게 영양분을 전달하는 방식을 찾아보세요.",
      [findRange(paragraphs, "p2", "균근균의 균사는 식물 뿌리보다 훨씬 가늘고 길어서 토양 속 넓은 범위에서 인과 질소 같은 영양분을 흡수하여 식물에게 전달한다.")]),
    makeConfirmQ("q5", "균사 네트워크의 새로운 역할에 대한 연구 결과를 찾아보세요.",
      [findRange(paragraphs, "p2", "균근균의 균사 네트워크가 나무들 사이에서 영양분과 화학 신호를 전달하는 일종의 지하 통신망 역할을 한다는 사실도 밝혀졌다.")]),
    makeConfirmQ("q6", "화학 비료와 농약의 과도한 사용이 초래하는 결과를 찾아보세요.",
      [findRange(paragraphs, "p3", "화학 비료와 농약의 과도한 사용은 토양 미생물의 서식 환경을 파괴하여 장기적으로 토양의 비옥도를 크게 낮추는 결과를 초래한다.")]),
    makeConfirmQ("q7", "건강한 토양의 중요성에 대한 결론을 찾아보세요.",
      [findRange(paragraphs, "p3", "건강한 토양은 식량 안보의 기초이자 기후 변화 대응의 중요한 열쇠이다.")])
  ];

  const content = assembleFull(351, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ═══════════════════════════════════════════════════════════
// Day 352 — 문학 (LITERATURE): 할아버지의 시계
// ═══════════════════════════════════════════════════════════
function buildDay352() {
  const paragraphs = [
    { id: "p1", text: "할아버지의 방 한쪽 벽에는 오래된 괘종시계가 걸려 있었다. 나무 틀에 금빛 장식이 군데군데 벗겨진 그 시계는, 할아버지가 젊은 시절 일본 오사카에서 직접 사 오신 것이라 했다. 매 정각마다 울리는 종소리는 맑고 깊어서 집 안 어디에서든 또렷하게 들을 수 있었다. 어린 나에게 그 종소리는 하루의 리듬을 알려 주는 신호이자, 할아버지가 저 방에 계시다는 것을 확인해 주는 따뜻한 소리였다." },
    { id: "p2", text: "할아버지는 매일 아침 정확히 일곱 시에 시계 태엽을 감으셨다. 나직하게 딸깍거리는 태엽 소리를 들으며 나는 이불 속에서 하루를 시작할 준비를 했다. 할아버지는 시계를 감으시며 종종 옛날이야기를 들려주셨다. 전쟁 중에 이 시계만은 꼭 안고 피난길에 올랐다는 이야기, 어머니가 갓난아기 시절 이 시계 종소리를 자장가 삼아 잠들었다는 이야기가 특히 기억에 남는다. 시계는 단순한 물건이 아니라 세 세대에 걸친 가족의 역사 그 자체였다." },
    { id: "p3", text: "할아버지가 돌아가신 뒤 시계는 멈추었다. 아무도 태엽을 감지 않았기 때문이다. 장례를 치르고 한 달쯤 지나 나는 조심스럽게 시계 앞에 섰다. 할아버지가 하시던 대로 천천히 태엽을 감자 시계는 다시 째깍거리기 시작했고, 곧이어 정각을 알리는 종소리가 텅 빈 집 안 구석구석에 울려 퍼졌다. 그 소리를 듣는 순간 나도 모르게 눈물이 흘렀다. 시계는 다시 움직이고 있었지만, 매일 아침 태엽을 감던 할아버지의 자리는 영원히 비어 있었다." },
    { id: "p4", text: "지금도 나는 그 시계를 거실 벽에 걸어 두고 매일 아침 태엽을 감는다. 째깍거리는 소리에 귀를 기울이면 할아버지의 굵은 목소리가 어렴풋이 들리는 것 같다. 언젠가 내 아이에게도 이 시계의 이야기를 들려주고 싶다. 시간은 흐르고 사람은 떠나지만, 사랑을 담은 물건은 기억을 간직한 채 남아 있다는 것을 그 시계가 가르쳐 주었다." }
  ];
  console.log(`  Day 352 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "괘종시계의 외형과 유래를 묘사한 부분을 찾아보세요.",
      [findRange(paragraphs, "p1", "나무 틀에 금빛 장식이 군데군데 벗겨진 그 시계는, 할아버지가 젊은 시절 일본 오사카에서 직접 사 오신 것이라 했다.")]),
    makeConfirmQ("q2", "어린 화자에게 종소리가 가진 의미를 찾아보세요.",
      [findRange(paragraphs, "p1", "어린 나에게 그 종소리는 하루의 리듬을 알려 주는 신호이자, 할아버지가 저 방에 계시다는 것을 확인해 주는 따뜻한 소리였다.")]),
    makeConfirmQ("q3", "할아버지가 매일 아침 하시던 행동을 찾아보세요.",
      [findRange(paragraphs, "p2", "할아버지는 매일 아침 정확히 일곱 시에 시계 태엽을 감으셨다.")]),
    makeConfirmQ("q4", "시계에 얽힌 가족 이야기를 찾아보세요.",
      [findRange(paragraphs, "p2", "전쟁 중에 이 시계만은 꼭 안고 피난길에 올랐다는 이야기, 어머니가 갓난아기 시절 이 시계 종소리를 자장가 삼아 잠들었다는 이야기가 특히 기억에 남는다.")]),
    makeConfirmQ("q5", "시계가 단순한 물건 이상이라는 인식을 찾아보세요.",
      [findRange(paragraphs, "p2", "시계는 단순한 물건이 아니라 세 세대에 걸친 가족의 역사 그 자체였다.")]),
    makeConfirmQ("q6", "할아버지가 돌아가신 뒤 시계가 멈춘 이유를 찾아보세요.",
      [findRange(paragraphs, "p3", "아무도 태엽을 감지 않았기 때문이다.")]),
    makeConfirmQ("q7", "시계가 화자에게 가르쳐 준 교훈을 찾아보세요.",
      [findRange(paragraphs, "p4", "시간은 흐르고 사람은 떠나지만, 사랑을 담은 물건은 기억을 간직한 채 남아 있다는 것을 그 시계가 가르쳐 주었다.")])
  ];

  const content = assembleFull(352, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ═══════════════════════════════════════════════════════════
// Day 353 — 비문학 (NONFICTION): 빛의 이중성
// ═══════════════════════════════════════════════════════════
function buildDay353() {
  const paragraphs = [
    { id: "p1", text: "빛은 오랫동안 과학자들에게 수수께끼 같은 존재였다. 17세기에 뉴턴은 빛이 매우 작은 입자들의 흐름이라고 주장하였고, 같은 시대의 네덜란드 과학자 하위헌스는 빛이 파동이라고 반박하였다. 뉴턴의 입자설은 빛이 직진하는 현상과 거울에서 반사되는 현상을 잘 설명하였다. 반면 하위헌스의 파동설은 빛이 굴절되거나 장애물 뒤로 돌아 들어가는 회절 현상을 더 자연스럽게 설명하였다. 두 이론은 각각 빛의 특정 현상을 잘 설명하였지만, 동시에 설명하지 못하는 현상도 존재하였기에 논쟁은 수백 년간 이어졌다." },
    { id: "p2", text: "19세기에 영국의 물리학자 토머스 영은 이중 슬릿 실험을 통해 빛의 파동성을 결정적으로 입증하였다. 좁은 두 틈새를 통과한 빛이 스크린에 밝고 어두운 줄무늬를 만들어 낸 것이다. 이 간섭 무늬는 파동만이 만들 수 있는 현상이었기에, 빛은 파동이라는 결론이 과학계에서 널리 받아들여졌다. 이후 맥스웰은 빛이 전기장과 자기장의 진동으로 이루어진 전자기파임을 수학적으로 증명하여 파동설의 지위를 더욱 공고히 하였다. 맥스웰의 전자기 이론은 빛의 속도가 매질에 관계없이 일정하다는 예측까지 포함하고 있었으며, 이 예측은 훗날 실험적으로도 확인되었다." },
    { id: "p3", text: "그러나 20세기 초 아인슈타인은 광전 효과를 설명하면서 빛이 광자라는 에너지 알갱이로 이루어져 있다고 제안하였다. 금속에 빛을 비추면 전자가 튀어나오는 광전 효과는 파동 이론만으로는 도저히 설명할 수 없는 현상이었다. 빛의 세기가 아닌 진동수에 따라 전자가 방출되는 양상이 달라졌기 때문이다. 결국 현대 물리학은 빛이 파동과 입자의 성질을 동시에 가진다는 '파동-입자 이중성'을 받아들이게 되었다. 이 혁명적인 개념은 양자역학의 탄생에 핵심적인 토대가 되었으며, 자연 현상에 대한 인간의 직관을 근본적으로 바꾸어 놓았다." }
  ];
  console.log(`  Day 353 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "뉴턴과 하위헌스의 상반된 주장을 찾아보세요.",
      [findRange(paragraphs, "p1", "뉴턴은 빛이 매우 작은 입자들의 흐름이라고 주장하였고, 같은 시대의 네덜란드 과학자 하위헌스는 빛이 파동이라고 반박하였다.")]),
    makeConfirmQ("q2", "뉴턴의 입자설이 잘 설명한 현상을 찾아보세요.",
      [findRange(paragraphs, "p1", "뉴턴의 입자설은 빛이 직진하는 현상과 거울에서 반사되는 현상을 잘 설명하였다.")]),
    makeConfirmQ("q3", "하위헌스의 파동설이 잘 설명한 현상을 찾아보세요.",
      [findRange(paragraphs, "p1", "하위헌스의 파동설은 빛이 굴절되거나 장애물 뒤로 돌아 들어가는 회절 현상을 더 자연스럽게 설명하였다.")]),
    makeConfirmQ("q4", "영의 이중 슬릿 실험 결과를 찾아보세요.",
      [findRange(paragraphs, "p2", "좁은 두 틈새를 통과한 빛이 스크린에 밝고 어두운 줄무늬를 만들어 낸 것이다.")]),
    makeConfirmQ("q5", "맥스웰이 빛에 대해 증명한 내용을 찾아보세요.",
      [findRange(paragraphs, "p2", "맥스웰은 빛이 전기장과 자기장의 진동으로 이루어진 전자기파임을 수학적으로 증명하여 파동설의 지위를 더욱 공고히 하였다.")]),
    makeConfirmQ("q6", "아인슈타인이 제안한 빛의 성질을 찾아보세요.",
      [findRange(paragraphs, "p3", "아인슈타인은 광전 효과를 설명하면서 빛이 광자라는 에너지 알갱이로 이루어져 있다고 제안하였다.")]),
    makeConfirmQ("q7", "파동-입자 이중성이 가진 과학사적 의의를 찾아보세요.",
      [findRange(paragraphs, "p3", "이 혁명적인 개념은 양자역학의 탄생에 핵심적인 토대가 되었으며, 자연 현상에 대한 인간의 직관을 근본적으로 바꾸어 놓았다.")])
  ];

  const content = assembleFull(353, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ═══════════════════════════════════════════════════════════
// 실행부
// ═══════════════════════════════════════════════════════════
const results = [
  { dayIndex: 349, ...buildDay349() }, { dayIndex: 350, ...buildDay350() },
  { dayIndex: 351, ...buildDay351() }, { dayIndex: 352, ...buildDay352() },
  { dayIndex: 353, ...buildDay353() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
if (!fs.existsSync(staticDir)) fs.mkdirSync(staticDir, { recursive: true });

const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

const newDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
fs.writeFileSync(path.join(newDir, 'batch-f2-349-353.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ generated/new/batch-f2-349-353.json`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
