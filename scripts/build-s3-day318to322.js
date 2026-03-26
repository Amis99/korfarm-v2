const fs = require('fs');
const path = require('path');

// === 유틸리티 함수 ===
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
  return { contentId: `dr-s3-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(소쉬르 3) Day ${dayIndex} ${subAreaKo}`, description: "일일 독해 - 정독·복기·확인",
    targetLevel: "SAUSSURE_3", schoolGradeRange: { min: 5, max: 5 }, area: "READING", subArea,
    competencies: ["READING"], tags: ["daily"], access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 }, timeLimitSec: 480, assets: {},
    payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 }, confirm: { questions: confirmQuestions } }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return { content_type: "DAILY_READING", level_id: "SAUSSURE_3", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// === Day 318 (짝수 → 문학) ===
function buildDay318() {
  const paragraphs = [
    { id: "p1", text: "민준이는 학교 뒤편 텃밭에서 토마토 한 그루를 키우기로 했다. 봄이 되자 선생님이 반 아이들에게 하나씩 모종을 나눠 주셨는데 민준이는 빨간 열매가 열리는 토마토를 골랐다. 매일 아침 등교하면 가장 먼저 텃밭으로 달려가 물을 주었다. 작은 싹이 땅 위로 고개를 내밀자 민준이의 입가에 저절로 미소가 번졌다. 다른 아이들은 꽃이 피는 식물을 골라서 벌써 예쁜 꽃을 보고 있었지만 민준이의 토마토는 아직 파란 줄기만 자라고 있어서 조금 속상하기도 했다." },
    { id: "p2", text: "여름이 다가오자 토마토에 노란 꽃이 피기 시작했다. 민준이는 꽃을 보고 너무 기뻐서 친구들에게 자랑했다. 얼마 지나지 않아 꽃이 진 자리에 작고 초록색인 열매가 맺혔다. 민준이는 열매가 빨갛게 익으려면 얼마나 걸리는지 궁금해서 매일 크기를 재어 보았다. 일주일이 지나자 열매는 점점 커졌고 표면에 연한 주황빛이 돌기 시작했다. 민준이는 기다리는 동안 토마토가 빨리 빨갛게 변하기를 바라며 매일 응원의 말을 건넸다." },
    { id: "p3", text: "드디어 토마토가 빨갛게 익은 날 민준이는 조심스럽게 열매를 따서 교실로 가져왔다. 선생님은 민준이의 토마토를 보며 직접 키운 열매는 특별한 맛이 난다고 칭찬해 주셨다. 민준이는 토마토를 반으로 잘라 짝꿍에게 나눠 주었다. 짝꿍은 한 입 베어 물고 정말 달다며 감탄했다. 민준이는 작은 씨앗 하나가 열매가 되기까지 오래 기다린 보람을 느꼈고 다음에는 오이도 키워 보겠다고 마음먹었다." }
  ];
  const cq = [
    makeConfirmQ("q1", "민준이가 텃밭에서 키우기로 한 식물은?", [findRange(paragraphs, "p1", "토마토 한 그루를 키우기로 했다.")]),
    makeConfirmQ("q2", "민준이가 매일 아침 한 일은?", [findRange(paragraphs, "p1", "매일 아침 등교하면 가장 먼저 텃밭으로 달려가 물을 주었다.")]),
    makeConfirmQ("q3", "민준이가 조금 속상했던 이유는?", [findRange(paragraphs, "p1", "다른 아이들은 꽃이 피는 식물을 골라서 벌써 예쁜 꽃을 보고 있었지만 민준이의 토마토는 아직 파란 줄기만 자라고 있어서 조금 속상하기도 했다.")]),
    makeConfirmQ("q4", "토마토 꽃이 진 뒤 어떤 변화가 있었나?", [findRange(paragraphs, "p2", "꽃이 진 자리에 작고 초록색인 열매가 맺혔다.")]),
    makeConfirmQ("q5", "열매의 색깔 변화는?", [findRange(paragraphs, "p2", "표면에 연한 주황빛이 돌기 시작했다.")]),
    makeConfirmQ("q6", "선생님이 민준이에게 한 말은?", [findRange(paragraphs, "p3", "직접 키운 열매는 특별한 맛이 난다고 칭찬해 주셨다.")]),
    makeConfirmQ("q7", "민준이가 다음에 키우고 싶은 식물은?", [findRange(paragraphs, "p3", "다음에는 오이도 키워 보겠다고 마음먹었다.")])
  ];
  const content = assembleFull(318, "LITERATURE", "문학", paragraphs, cq);
  return { content, subArea: "LITERATURE" };
}

// === Day 319 (홀수 → 비문학) ===
function buildDay319() {
  const paragraphs = [
    { id: "p1", text: "우리 몸에는 뼈가 약 이백여 개 있으며 이 뼈들이 모여 뼈대를 이룬다. 뼈대는 몸을 지탱하고 내부 장기를 보호하는 중요한 역할을 한다. 예를 들어 갈비뼈는 심장과 폐를 감싸서 외부 충격으로부터 지켜 주고 두개골은 뇌를 보호한다. 뼈는 딱딱하게 느껴지지만 사실 살아 있는 조직이라서 계속 새롭게 만들어지고 오래된 부분은 사라진다. 어린이의 뼈는 어른보다 유연하고 잘 부러지지 않는데 이는 뼈 속에 물기가 많고 탄력 있는 성분이 풍부하기 때문이다." },
    { id: "p2", text: "뼈를 튼튼하게 유지하려면 칼슘이 풍부한 음식을 먹어야 한다. 우유와 치즈 그리고 멸치와 같은 식품에 칼슘이 많이 들어 있다. 칼슘은 뼈를 단단하게 만드는 핵심 영양소이며 성장기에 특히 많이 필요하다. 또한 비타민 디도 뼈 건강에 중요하다. 비타민 디는 햇빛을 받으면 우리 몸에서 자연스럽게 만들어지는데 이 성분이 없으면 칼슘이 뼈에 제대로 흡수되지 않는다." },
    { id: "p3", text: "운동도 뼈를 튼튼하게 하는 데 큰 도움이 된다. 달리기와 줄넘기처럼 뼈에 자극을 주는 운동을 하면 뼈가 더 단단해진다. 반면 오랜 시간 앉아만 있으면 뼈가 약해질 수 있다. 우주 비행사들이 무중력 상태에서 오래 지내면 뼈가 약해지는 것도 같은 이유이다. 뼈 건강을 위해 바른 자세를 유지하고 규칙적으로 운동하며 영양소가 풍부한 음식을 골고루 먹는 습관을 기르는 것이 중요하다." }
  ];
  const cq = [
    makeConfirmQ("q1", "우리 몸에 있는 뼈의 대략적인 수는?", [findRange(paragraphs, "p1", "우리 몸에는 뼈가 약 이백여 개 있으며 이 뼈들이 모여 뼈대를 이룬다.")]),
    makeConfirmQ("q2", "갈비뼈의 역할은?", [findRange(paragraphs, "p1", "갈비뼈는 심장과 폐를 감싸서 외부 충격으로부터 지켜 주고")]),
    makeConfirmQ("q3", "어린이의 뼈가 잘 부러지지 않는 이유는?", [findRange(paragraphs, "p1", "뼈 속에 물기가 많고 탄력 있는 성분이 풍부하기 때문이다.")]),
    makeConfirmQ("q4", "칼슘이 많이 들어 있는 음식은?", [findRange(paragraphs, "p2", "우유와 치즈 그리고 멸치와 같은 식품에 칼슘이 많이 들어 있다.")]),
    makeConfirmQ("q5", "비타민 디가 중요한 이유는?", [findRange(paragraphs, "p2", "이 성분이 없으면 칼슘이 뼈에 제대로 흡수되지 않는다.")]),
    makeConfirmQ("q6", "뼈를 튼튼하게 하는 운동의 예시는?", [findRange(paragraphs, "p3", "달리기와 줄넘기처럼 뼈에 자극을 주는 운동을 하면 뼈가 더 단단해진다.")]),
    makeConfirmQ("q7", "우주 비행사의 뼈가 약해지는 이유는?", [findRange(paragraphs, "p3", "무중력 상태에서 오래 지내면 뼈가 약해지는 것도 같은 이유이다.")])
  ];
  const content = assembleFull(319, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// === Day 320 (짝수 → 문학) ===
function buildDay320() {
  const paragraphs = [
    { id: "p1", text: "은서는 할머니가 보내 주신 낡은 상자를 열어 보았다. 상자 안에는 오래된 일기장 한 권이 들어 있었다. 표지에는 할머니의 이름이 예쁜 글씨로 적혀 있었고 모서리는 누렇게 바래 있었다. 은서는 조심스럽게 첫 장을 펼쳤다. 거기에는 할머니가 은서와 비슷한 나이였던 열두 살 때의 이야기가 적혀 있었다. 할머니는 학교에서 달리기를 잘해서 마을 대회에 나갔다는 내용이었다. 일기장의 글씨는 또박또박 정성스러웠고 군데군데 연필로 작은 그림도 그려져 있었다." },
    { id: "p2", text: "일기를 읽어 나가자 할머니의 어린 시절이 눈앞에 그려졌다. 할머니는 비 오는 날에도 맨발로 논두렁을 뛰어다니며 친구들과 놀았다고 했다. 간식이라곤 삶은 고구마와 옥수수가 전부였지만 그래도 매일이 즐거웠다고 적혀 있었다. 어느 날에는 냇가에서 물고기를 맨손으로 잡았다가 미끄러져 온몸이 젖었다는 이야기도 있었다. 은서는 할머니의 어린 시절이 자신과 너무 달라서 신기하면서도 부럽다는 생각이 들었다." },
    { id: "p3", text: "마지막 장에는 할머니가 은서에게 쓴 짧은 편지가 끼워져 있었다. 편지에는 이 일기장을 읽으면 할머니의 어린 시절 친구가 되어 줄 수 있을 거라는 말이 적혀 있었다. 은서는 편지를 읽고 눈시울이 뜨거워졌다. 할머니에게 전화를 걸어 일기장 잘 받았다고 말하자 할머니는 웃으시며 너도 일기를 써 보라고 하셨다. 은서는 그날 밤 새 노트를 꺼내 자신만의 일기를 쓰기 시작했다. 오늘 있었던 일과 할머니의 일기장을 읽으며 느꼈던 감동을 한 글자 한 글자 정성껏 적어 나갔다." }
  ];
  const cq = [
    makeConfirmQ("q1", "할머니가 보내 준 상자 안에 무엇이 있었나?", [findRange(paragraphs, "p1", "상자 안에는 오래된 일기장 한 권이 들어 있었다.")]),
    makeConfirmQ("q2", "일기장에 적힌 할머니의 나이는?", [findRange(paragraphs, "p1", "할머니가 은서와 비슷한 나이였던 열두 살 때의 이야기가 적혀 있었다.")]),
    makeConfirmQ("q3", "할머니가 학교에서 잘한 것은?", [findRange(paragraphs, "p1", "학교에서 달리기를 잘해서 마을 대회에 나갔다는 내용이었다.")]),
    makeConfirmQ("q4", "할머니의 어린 시절 간식은?", [findRange(paragraphs, "p2", "간식이라곤 삶은 고구마와 옥수수가 전부였지만 그래도 매일이 즐거웠다고 적혀 있었다.")]),
    makeConfirmQ("q5", "냇가에서 할머니에게 일어난 일은?", [findRange(paragraphs, "p2", "냇가에서 물고기를 맨손으로 잡았다가 미끄러져 온몸이 젖었다는 이야기도 있었다.")]),
    makeConfirmQ("q6", "마지막 장의 편지에 적힌 내용은?", [findRange(paragraphs, "p3", "이 일기장을 읽으면 할머니의 어린 시절 친구가 되어 줄 수 있을 거라는 말이 적혀 있었다.")]),
    makeConfirmQ("q7", "할머니의 조언을 듣고 은서가 한 일은?", [findRange(paragraphs, "p3", "그날 밤 새 노트를 꺼내 자신만의 일기를 쓰기 시작했다.")])
  ];
  const content = assembleFull(320, "LITERATURE", "문학", paragraphs, cq);
  return { content, subArea: "LITERATURE" };
}

// === Day 321 (홀수 → 비문학) ===
function buildDay321() {
  const paragraphs = [
    { id: "p1", text: "지진은 땅속 깊은 곳에서 바위가 갑자기 깨지거나 어긋나면서 발생하는 자연 현상이다. 지구의 표면은 여러 개의 거대한 판으로 나뉘어 있으며 이 판들은 매우 천천히 움직이고 있다. 판과 판이 서로 부딪치거나 어긋나는 곳에서 큰 힘이 쌓이다가 한꺼번에 풀리면 땅이 흔들리는 지진이 일어난다. 지진이 자주 발생하는 지역을 환태평양 지진대라고 부르는데 일본과 인도네시아 그리고 칠레 같은 나라가 여기에 속한다. 우리나라도 이 지진대에서 완전히 벗어나 있지 않기 때문에 지진에 대한 관심이 필요하다." },
    { id: "p2", text: "지진의 세기는 규모라는 단위로 나타낸다. 규모 삼 정도의 약한 지진은 사람이 거의 느끼지 못하지만 규모 육 이상이 되면 건물이 무너지고 큰 피해가 발생할 수 있다. 지진이 바다 밑에서 일어나면 거대한 파도인 쓰나미가 생기기도 한다. 쓰나미는 해안가 마을을 순식간에 덮쳐 큰 피해를 주므로 해안 지역에서는 지진 경보에 항상 주의를 기울여야 한다." },
    { id: "p3", text: "지진에 대비하기 위해 평소에 안전 수칙을 알아 두는 것이 중요하다. 지진이 발생하면 먼저 튼튼한 책상 아래로 들어가 머리를 보호해야 한다. 흔들림이 멈추면 가스와 전기를 차단하고 계단을 이용하여 건물 밖으로 대피해야 한다. 절대로 엘리베이터를 타서는 안 되며 넓은 공터로 이동하는 것이 안전하다. 학교에서는 정기적으로 지진 대피 훈련을 하여 실제 상황에서도 침착하게 행동할 수 있도록 연습하는 것이 필요하다." }
  ];
  const cq = [
    makeConfirmQ("q1", "지진이 발생하는 원리는?", [findRange(paragraphs, "p1", "판과 판이 서로 부딪치거나 어긋나는 곳에서 큰 힘이 쌓이다가 한꺼번에 풀리면 땅이 흔들리는 지진이 일어난다.")]),
    makeConfirmQ("q2", "지진이 자주 발생하는 지역의 이름은?", [findRange(paragraphs, "p1", "지진이 자주 발생하는 지역을 환태평양 지진대라고 부르는데")]),
    makeConfirmQ("q3", "지진의 세기를 나타내는 단위는?", [findRange(paragraphs, "p2", "지진의 세기는 규모라는 단위로 나타낸다.")]),
    makeConfirmQ("q4", "쓰나미가 발생하는 조건은?", [findRange(paragraphs, "p2", "지진이 바다 밑에서 일어나면 거대한 파도인 쓰나미가 생기기도 한다.")]),
    makeConfirmQ("q5", "지진 발생 시 가장 먼저 해야 할 행동은?", [findRange(paragraphs, "p3", "튼튼한 책상 아래로 들어가 머리를 보호해야 한다.")]),
    makeConfirmQ("q6", "지진 시 하지 말아야 할 행동은?", [findRange(paragraphs, "p3", "절대로 엘리베이터를 타서는 안 되며 넓은 공터로 이동하는 것이 안전하다.")]),
    makeConfirmQ("q7", "학교에서 지진에 대비하는 방법은?", [findRange(paragraphs, "p3", "정기적으로 지진 대피 훈련을 하여 실제 상황에서도 침착하게 행동할 수 있도록 연습하는 것이 필요하다.")])
  ];
  const content = assembleFull(321, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// === Day 322 (짝수 → 문학) ===
function buildDay322() {
  const paragraphs = [
    { id: "p1", text: "서연이네 반에서는 학예회 준비가 한창이었다. 아이들은 숲속 모험이라는 제목의 연극을 하기로 했고 서연이는 나무 역할을 맡게 되었다. 서연이는 처음에 나무 역할이 마음에 들지 않았다. 주인공이나 요정처럼 대사도 많고 무대 위에서 돋보이는 역할을 하고 싶었기 때문이다. 서연이는 집에 돌아와 어머니에게 나무 역할은 그냥 서 있기만 하면 되는 거라서 재미없다고 투덜거렸다." },
    { id: "p2", text: "어머니는 서연이에게 숲에 나무가 없으면 어떻게 되겠느냐고 물으셨다. 서연이는 잠시 생각하다가 동물도 살 수 없고 사람도 숨 쉬기 어려워진다고 대답했다. 어머니는 빙그레 웃으시며 연극에서도 마찬가지라고 말씀하셨다. 나무가 무대 위에 있어야 숲 장면이 완성되고 주인공도 그 안에서 이야기를 펼칠 수 있는 거라고 설명하셨다. 서연이는 어머니의 말을 듣고 마음이 조금 달라졌다. 그날 밤 서연이는 나무 역할을 어떻게 하면 더 실감 나게 할 수 있을지 고민하며 노트에 아이디어를 적었다." },
    { id: "p3", text: "학예회 당일 서연이는 직접 색칠한 나뭇잎 모자를 쓰고 초록색 옷을 입고서 무대에 올랐다. 서연이는 바람이 불 때마다 나뭇가지처럼 팔을 살랑살랑 흔들었고 새 소리가 나면 가지를 벌려 새가 앉은 것처럼 연기했다. 관객석에서 웃음과 박수가 터져 나왔다. 공연이 끝난 뒤 친구들이 나무 역할이 제일 재미있었다며 칭찬해 주었다. 서연이는 작은 역할도 정성을 다하면 빛날 수 있다는 것을 깨달았다." }
  ];
  const cq = [
    makeConfirmQ("q1", "서연이가 맡은 역할은?", [findRange(paragraphs, "p1", "서연이는 나무 역할을 맡게 되었다.")]),
    makeConfirmQ("q2", "서연이가 하고 싶었던 역할은?", [findRange(paragraphs, "p1", "주인공이나 요정처럼 대사도 많고 무대 위에서 돋보이는 역할을 하고 싶었기 때문이다.")]),
    makeConfirmQ("q3", "어머니가 서연이에게 물은 질문은?", [findRange(paragraphs, "p2", "숲에 나무가 없으면 어떻게 되겠느냐고 물으셨다.")]),
    makeConfirmQ("q4", "어머니가 나무 역할이 중요한 이유를 설명한 내용은?", [findRange(paragraphs, "p2", "나무가 무대 위에 있어야 숲 장면이 완성되고 주인공도 그 안에서 이야기를 펼칠 수 있는 거라고 설명하셨다.")]),
    makeConfirmQ("q5", "서연이가 무대에서 한 연기는?", [findRange(paragraphs, "p3", "바람이 불 때마다 나뭇가지처럼 팔을 살랑살랑 흔들었고 새 소리가 나면 가지를 벌려 새가 앉은 것처럼 연기했다.")]),
    makeConfirmQ("q6", "관객의 반응은?", [findRange(paragraphs, "p3", "관객석에서 웃음과 박수가 터져 나왔다.")]),
    makeConfirmQ("q7", "서연이가 깨달은 것은?", [findRange(paragraphs, "p3", "작은 역할도 정성을 다하면 빛날 수 있다는 것을 깨달았다.")])
  ];
  const content = assembleFull(322, "LITERATURE", "문학", paragraphs, cq);
  return { content, subArea: "LITERATURE" };
}

// === 실행부 ===
const results = [
  { dayIndex: 318, ...buildDay318() }, { dayIndex: 319, ...buildDay319() },
  { dayIndex: 320, ...buildDay320() }, { dayIndex: 321, ...buildDay321() },
  { dayIndex: 322, ...buildDay322() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];

results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  \u2705 ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

const newDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
fs.writeFileSync(path.join(newDir, 'batch-s3-318-322.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log('  \u2705 generated/new/batch-s3-318-322.json');

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}\uC790 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
