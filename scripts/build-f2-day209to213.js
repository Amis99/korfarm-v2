#!/usr/bin/env node
// 프레게2 Day 209~213 일일독해 콘텐츠 빌더
const fs = require('fs');
const path = require('path');

function findSentences(text) {
  const sentences = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1;
      while (next < text.length && (text[next] === ' ' || text[next] === '\n')) next++;
      start = next;
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
  let stepNum = 0;
  const timeline = [];
  paragraphs.forEach((para) => {
    const sents = findSentences(para.text);
    sents.forEach((sent) => {
      stepNum++;
      timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] } });
    });
    stepNum++;
    timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] } });
  });
  return timeline;
}

function buildRecallCards(paragraphs) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
  }
  return cards;
}

function makeConfirmQ(id, prompt, ranges) {
  return { id, prompt, answerRanges: ranges, scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: "ANY" };
}

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs);
  const cards = buildRecallCards(paragraphs);
  const nn = String(dayIndex).padStart(3, '0');
  return {
    contentId: `dr-f2-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(프레게 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_2", schoolGradeRange: { min: 6, max: 6 },
    area: "READING", subArea, competencies: ["READING"], tags: ["daily"],
    access: { mode: "FREE" }, seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480, assets: {},
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 },
      confirm: { questions: confirmQuestions }
    }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return { content_type: "DAILY_READING", level_id: "FREGE_2", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// ═══ Day 209 비문학 (NONFICTION) ═══
function buildDay209() {
  const p1 = "우리가 매일 마시는 물은 지구에서 끊임없이 순환하고 있다. 바다나 호수의 물이 태양 에너지를 받아 증발하면 수증기가 되어 하늘로 올라간다. 이 수증기는 높은 곳에서 차가운 공기를 만나 작은 물방울이나 얼음 알갱이로 변하여 구름을 이룬다. 구름 속의 물방울들이 점점 커지면 무거워져서 비나 눈의 형태로 지표면에 떨어진다. 이렇게 내린 비와 눈은 땅속으로 스며들거나 강과 하천을 통해 다시 바다로 흘러들어 가게 된다.";
  const p2 = "물의 순환은 지구의 기후를 조절하는 데 중요한 역할을 한다. 바닷물이 증발할 때 주변의 열을 흡수하므로 열대 지방의 기온이 지나치게 높아지는 것을 막아 준다. 반대로 수증기가 구름이 되어 비를 내릴 때는 열을 방출하기 때문에 추운 지역에 따뜻한 공기를 전달하는 효과가 있다. 이처럼 물의 순환은 지구 전체의 열에너지를 고르게 분배하는 자연의 균형 장치라고 할 수 있다.";
  const p3 = "물의 순환은 생태계에도 큰 영향을 미친다. 비가 내려 땅에 수분을 공급하면 식물이 자랄 수 있고, 식물을 먹이로 삼는 동물도 살아갈 수 있다. 또한 지하로 스며든 물은 지하수가 되어 사람들이 생활에 필요한 식수를 얻는 데 쓰인다. 강과 하천에 흐르는 물은 농업용수와 공업용수로 활용되며, 수력 발전을 통해 전기 에너지를 만들기도 한다. 만약 물의 순환이 멈춘다면 식물은 말라 죽고, 동물과 사람도 생존할 수 없게 될 것이다.";
  const p4 = "최근 지구 온난화로 인해 물의 순환에 변화가 나타나고 있다. 기온이 높아지면서 증발량이 늘어나 일부 지역에서는 가뭄이 심해지고, 다른 지역에서는 폭우와 홍수가 빈번하게 발생하고 있다. 과학자들은 이러한 현상이 계속되면 깨끗한 물을 구하기가 더욱 어려워질 것이라고 경고한다. 따라서 우리는 물을 아껴 쓰고, 수질 오염을 줄이며, 탄소 배출을 낮추는 노력을 통해 물의 순환이 건강하게 유지되도록 해야 한다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "바다나 호수의 물이 증발하는 데 필요한 에너지의 원천은 무엇인가?",
      [findRange(paragraphs, "p1", "태양 에너지를 받아 증발하면")]),
    makeConfirmQ("q2", "물의 순환이 열대 지방에서 하는 역할은 무엇인가?",
      [findRange(paragraphs, "p2", "열대 지방의 기온이 지나치게 높아지는 것을 막아 준다")]),
    makeConfirmQ("q3", "물의 순환이 지구 전체에서 하는 기능은 무엇인가?",
      [findRange(paragraphs, "p2", "지구 전체의 열에너지를 고르게 분배하는 자연의 균형 장치")]),
    makeConfirmQ("q4", "지하로 스며든 물은 어떤 용도로 사용되는가?",
      [findRange(paragraphs, "p3", "지하수가 되어 사람들이 생활에 필요한 식수를 얻는 데 쓰인다")]),
    makeConfirmQ("q5", "지구 온난화로 인해 물의 순환에 나타나는 변화는 무엇인가?",
      [findRange(paragraphs, "p4", "일부 지역에서는 가뭄이 심해지고, 다른 지역에서는 폭우와 홍수가 빈번하게 발생하고 있다")]),
    makeConfirmQ("q6", "물의 순환을 건강하게 유지하기 위해 우리가 해야 할 노력은 무엇인가?",
      [findRange(paragraphs, "p4", "물을 아껴 쓰고, 수질 오염을 줄이며, 탄소 배출을 낮추는 노력")])
  ];

  const content = assembleFull(209, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ═══ Day 210 문학 (LITERATURE) ═══
function buildDay210() {
  const p1 = "할아버지의 서재에는 낡은 나무 책상 하나가 있었다. 책상의 모서리는 오랜 세월에 닳아 둥글어졌고, 군데군데 흠집이 나 있었지만 할아버지는 그 책상을 무엇보다 아꼈다. 할아버지는 매일 아침 그 책상 앞에 앉아 신문을 읽고, 오후에는 연필로 무언가를 꼼꼼히 적곤 하였다. 나는 어릴 때 그 서재에 들어가는 것이 두렵기도 하고 신기하기도 했다. 오래된 책들의 종이 냄새와 연필 나무 향이 뒤섞여 서재만의 독특한 공기를 만들어 내고 있었다.";
  const p2 = "어느 여름 방학, 할아버지가 처음으로 나를 책상 앞에 불러 앉혔다. 할아버지는 서랍에서 가죽 표지의 공책 한 권을 꺼내 내 손에 쥐어 주었다. 공책의 첫 장에는 할아버지의 단정한 글씨로 이런 문장이 적혀 있었다. 좋은 글은 좋은 생각에서 시작된다. 할아버지는 매일 한 쪽씩 써 보라고 말하며 빙그레 웃으셨다. 나는 그날부터 할아버지와 나란히 앉아 하루 동안 보고 느낀 것을 적기 시작했다.";
  const p3 = "처음에는 무엇을 써야 할지 막막했다. 연필을 잡은 채 한참을 멍하니 앉아 있기만 한 날도 있었다. 하지만 할아버지는 다그치거나 재촉하는 법이 없었다. 오늘 아침에 본 하늘은 어떤 색이었니, 마당의 나팔꽃은 몇 송이 피었니, 하고 조용히 물어봐 주셨을 뿐이었다. 그 질문들에 답을 하다 보면 쓸 이야기가 하나둘 떠올랐다. 나는 차츰 글 쓰는 일이 두렵지 않게 되었고, 여름 방학이 끝날 무렵에는 공책 한 권을 거의 다 채울 수 있었다.";
  const p4 = "그 여름이 지나고 가을이 왔을 때 할아버지는 편찮으셔서 병원에 입원하셨다. 나는 할아버지가 쓰시던 책상 앞에 혼자 앉아 공책을 펼쳤다. 할아버지의 글씨가 적힌 첫 장을 넘기니 서툴고 삐뚤빼뚤한 나의 글들이 이어져 있었다. 그 글들을 읽으며 나는 할아버지가 내게 글을 가르치신 것이 아니라 세상을 바라보는 눈을 열어 주신 것임을 깨달았다. 책상 위에 놓인 연필이 할아버지의 온기를 간직하고 있는 것만 같아 나는 눈시울이 뜨거워졌다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "할아버지의 서재에 있던 책상의 특징은 무엇인가?",
      [findRange(paragraphs, "p1", "책상의 모서리는 오랜 세월에 닳아 둥글어졌고, 군데군데 흠집이 나 있었지만")]),
    makeConfirmQ("q2", "할아버지가 손자에게 건네준 물건은 무엇인가?",
      [findRange(paragraphs, "p2", "가죽 표지의 공책 한 권을 꺼내 내 손에 쥐어 주었다")]),
    makeConfirmQ("q3", "공책 첫 장에 적혀 있던 문장은 무엇인가?",
      [findRange(paragraphs, "p2", "좋은 글은 좋은 생각에서 시작된다")]),
    makeConfirmQ("q4", "할아버지가 글감을 떠올리게 도와준 방법은 무엇인가?",
      [findRange(paragraphs, "p3", "오늘 아침에 본 하늘은 어떤 색이었니, 마당의 나팔꽃은 몇 송이 피었니, 하고 조용히 물어봐 주셨을 뿐이었다")]),
    makeConfirmQ("q5", "여름 방학이 끝날 무렵 손자의 변화는 무엇인가?",
      [findRange(paragraphs, "p3", "공책 한 권을 거의 다 채울 수 있었다")]),
    makeConfirmQ("q6", "할아버지가 진정으로 가르쳐 준 것은 무엇이었는가?",
      [findRange(paragraphs, "p4", "세상을 바라보는 눈을 열어 주신 것")])
  ];

  const content = assembleFull(210, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ═══ Day 211 비문학 (NONFICTION) ═══
function buildDay211() {
  const p1 = "우리가 흔히 접하는 플라스틱은 20세기 초에 본격적으로 개발되기 시작하였다. 플라스틱은 가볍고 단단하며 다양한 모양으로 쉽게 성형할 수 있다는 장점 덕분에 일상생활 곳곳에 사용되고 있다. 식품 포장재, 전자 기기의 부품, 건축 자재, 의료 기구 등에 이르기까지 플라스틱이 쓰이지 않는 분야를 찾기 어려울 정도이다. 현재 전 세계에서 한 해에 생산되는 플라스틱의 양은 약 4억 톤에 달하며, 이 숫자는 해마다 증가하는 추세이다.";
  const p2 = "그러나 플라스틱의 가장 큰 문제는 자연에서 쉽게 분해되지 않는다는 점이다. 일반적인 플라스틱은 땅에 묻혀도 수백 년 동안 원래의 형태를 유지할 수 있으며, 시간이 지나면 미세 플라스틱이라는 아주 작은 조각으로 쪼개질 뿐 완전히 사라지지 않는다. 이 미세 플라스틱은 토양과 물을 오염시키고, 바다에 떠다니며 해양 생물의 몸속에 축적된다. 작은 물고기가 미세 플라스틱을 먹이로 착각하여 삼키면, 그 물고기를 잡아먹는 큰 물고기와 새, 그리고 결국 사람에게까지 전달될 수 있다.";
  const p3 = "미세 플라스틱의 위험성이 알려지면서 세계 각국에서는 플라스틱 사용을 줄이기 위한 다양한 정책을 시행하고 있다. 일회용 비닐봉지와 빨대의 사용을 금지하거나 제한하는 나라가 늘어나고 있으며, 플라스틱 용기 대신 종이나 유리, 스테인리스 소재의 용기를 사용하도록 권장하는 캠페인이 활발하게 진행되고 있다. 또한 과학자들은 옥수수 전분이나 해조류 등 천연 재료로 만드는 생분해성 플라스틱을 개발하여 기존 플라스틱을 대체하려는 연구를 계속하고 있다.";
  const p4 = "플라스틱 문제를 해결하기 위해서는 개인의 실천도 중요하다. 장을 볼 때 장바구니를 가져가고, 일회용 컵 대신 개인 텀블러를 사용하며, 분리배출을 정확하게 하는 것만으로도 큰 변화를 만들어 낼 수 있다. 작은 습관 하나가 모여 지구 환경을 지키는 큰 힘이 된다는 사실을 기억해야 한다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "플라스틱이 널리 사용되는 이유는 무엇인가?",
      [findRange(paragraphs, "p1", "가볍고 단단하며 다양한 모양으로 쉽게 성형할 수 있다는 장점")]),
    makeConfirmQ("q2", "전 세계에서 한 해에 생산되는 플라스틱의 양은 얼마인가?",
      [findRange(paragraphs, "p1", "약 4억 톤에 달하며")]),
    makeConfirmQ("q3", "플라스틱의 가장 큰 문제점은 무엇인가?",
      [findRange(paragraphs, "p2", "자연에서 쉽게 분해되지 않는다는 점이다")]),
    makeConfirmQ("q4", "미세 플라스틱이 사람에게 전달되는 경로를 설명하는 부분은 어디인가?",
      [findRange(paragraphs, "p2", "작은 물고기가 미세 플라스틱을 먹이로 착각하여 삼키면, 그 물고기를 잡아먹는 큰 물고기와 새, 그리고 결국 사람에게까지 전달될 수 있다")]),
    makeConfirmQ("q5", "과학자들이 기존 플라스틱을 대체하기 위해 연구하는 것은 무엇인가?",
      [findRange(paragraphs, "p3", "옥수수 전분이나 해조류 등 천연 재료로 만드는 생분해성 플라스틱")]),
    makeConfirmQ("q6", "개인이 플라스틱 사용을 줄이기 위해 실천할 수 있는 방법은 무엇인가?",
      [findRange(paragraphs, "p4", "장을 볼 때 장바구니를 가져가고, 일회용 컵 대신 개인 텀블러를 사용하며, 분리배출을 정확하게 하는 것")]),
    makeConfirmQ("q7", "작은 습관의 의미에 대해 이 글이 전하는 메시지는 무엇인가?",
      [findRange(paragraphs, "p4", "작은 습관 하나가 모여 지구 환경을 지키는 큰 힘이 된다")])
  ];

  const content = assembleFull(211, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ═══ Day 212 문학 (LITERATURE) ═══
function buildDay212() {
  const p1 = "비가 오는 날이면 나는 창가에 앉아 유리창을 타고 흘러내리는 빗줄기를 바라보곤 했다. 빗방울은 유리 위에 부딪혀 잠깐 머물다가 작은 길을 만들며 아래로 미끄러져 내려갔다. 어떤 빗방울은 혼자서 가느다란 줄기를 이루었고, 어떤 빗방울은 다른 방울과 합쳐져 굵은 물줄기가 되어 빠르게 흘러갔다. 나는 그 모습이 마치 사람들의 인생 같다는 생각을 하곤 했다. 혼자 걷는 길이 있는가 하면 누군가와 함께 걸어가는 길도 있으니 말이다.";
  const p2 = "비 오는 날의 풍경 가운데 내가 가장 좋아하는 것은 처마 끝에서 떨어지는 빗물 소리였다. 규칙적으로 떨어지는 빗방울 소리는 마치 누군가가 작은 북을 조용히 두드리는 것처럼 들렸다. 그 소리를 듣고 있으면 온 세상이 고요해지고 마음이 차분하게 가라앉았다. 우산 없이 학교에서 돌아오던 날에도 비에 젖는 것이 싫기보다는 빗소리를 느끼는 것이 즐겁게 여겨졌다.";
  const p3 = "어머니는 비 오는 날이면 으레 부침개를 부쳐 주셨다. 밀가루 반죽에 파와 고추를 넣고 기름을 두른 팬 위에 동그랗게 펴면 지글지글 소리가 온 집 안에 퍼졌다. 비 내리는 소리와 부침개 부치는 소리가 어우러지면 세상에서 가장 아늑한 음악이 되었다. 나와 동생은 갓 구워 낸 뜨거운 부침개를 후후 불어 가며 한 입씩 베어 물었다. 고소한 맛과 바삭한 식감은 비 오는 날의 칙칙한 기분을 단번에 환하게 바꾸어 놓았다.";
  const p4 = "지금은 아파트 높은 층에서 살고 있어 처마 밑 빗소리를 듣기 어렵다. 하지만 비 오는 날이면 여전히 창가에 서서 먼 하늘을 바라본다. 회색빛 구름 사이로 빗줄기가 쏟아질 때 어릴 적 그 낡은 처마와 부침개 냄새가 떠오르곤 한다. 비는 단순한 자연 현상이 아니라 내 유년 시절의 따뜻한 기억을 불러오는 열쇠 같은 것이다. 비가 그치고 나면 하늘은 언제 그랬냐는 듯이 맑아지지만, 빗소리가 남긴 추억만큼은 마음속에 오래오래 젖어 있다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "빗방울이 흘러내리는 모습을 무엇에 비유하였는가?",
      [findRange(paragraphs, "p1", "사람들의 인생 같다는 생각을 하곤 했다")]),
    makeConfirmQ("q2", "처마 끝에서 떨어지는 빗물 소리를 무엇에 비유하였는가?",
      [findRange(paragraphs, "p2", "마치 누군가가 작은 북을 조용히 두드리는 것처럼 들렸다")]),
    makeConfirmQ("q3", "비 오는 날 어머니가 해 주신 것은 무엇인가?",
      [findRange(paragraphs, "p3", "으레 부침개를 부쳐 주셨다")]),
    makeConfirmQ("q4", "비 소리와 부침개 소리가 어우러진 것을 무엇으로 표현하였는가?",
      [findRange(paragraphs, "p3", "세상에서 가장 아늑한 음악이 되었다")]),
    makeConfirmQ("q5", "글쓴이에게 비는 어떤 의미인가?",
      [findRange(paragraphs, "p4", "내 유년 시절의 따뜻한 기억을 불러오는 열쇠 같은 것이다")]),
    makeConfirmQ("q6", "비가 그친 뒤에도 마음속에 남아 있는 것은 무엇인가?",
      [findRange(paragraphs, "p4", "빗소리가 남긴 추억만큼은 마음속에 오래오래 젖어 있다")])
  ];

  const content = assembleFull(212, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ═══ Day 213 비문학 (NONFICTION) ═══
function buildDay213() {
  const p1 = "우리가 밤하늘에서 보는 별빛은 실제로 아주 오래전에 별에서 출발한 빛이다. 빛은 초속 약 30만 킬로미터라는 매우 빠른 속도로 움직이지만, 별까지의 거리가 워낙 멀기 때문에 빛이 지구에 도달하려면 짧게는 수 년에서 길게는 수백만 년이 걸린다. 예를 들어, 우리 눈에 가장 밝게 보이는 시리우스라는 별의 빛은 약 8.6년 전에 그 별을 떠난 것이다. 즉, 지금 우리가 보는 시리우스의 모습은 8.6년 전의 시리우스인 셈이다.";
  const p2 = "천문학에서는 빛이 1년 동안 이동하는 거리를 광년이라는 단위로 표현한다. 1광년은 약 9조 4600억 킬로미터에 해당하는 어마어마한 거리이다. 태양에서 가장 가까운 별인 프록시마 센타우리까지의 거리가 약 4.2광년이니, 빛의 속도로 달려도 4년이 넘게 걸리는 먼 거리이다. 이처럼 우주의 크기는 인간의 일상적인 감각으로는 도저히 가늠하기 어려울 만큼 광대하다.";
  const p3 = "밤하늘의 별들은 사실 각기 다른 거리에 떨어져 있기 때문에 우리가 보는 별빛은 서로 다른 시간대의 빛이 섞여 있는 것이다. 가까운 별의 빛은 몇 년 전의 것이고, 먼 은하에서 온 빛은 수억 년 전의 것일 수도 있다. 밤하늘을 올려다보는 행위는 곧 우주의 과거를 보는 것과 같다고 할 수 있다. 이러한 이유로 천문학자들은 먼 우주를 관측함으로써 우주가 처음 탄생했을 때의 모습을 연구할 수 있다.";
  const p4 = "현대의 망원경 기술은 수십억 광년 떨어진 은하의 빛까지 포착할 수 있을 만큼 발전하였다. 허블 우주 망원경은 지구 대기의 방해 없이 우주 공간에서 깨끗한 영상을 촬영하여 먼 은하의 모습을 선명하게 보여 주었다. 최근에는 제임스 웹 우주 망원경이 발사되어 우주 탄생 초기의 빛까지 관측하고 있다. 이러한 관측을 통해 과학자들은 우주의 나이가 약 138억 년이라는 사실을 밝혀내었으며, 우주가 어떻게 시작되고 변화해 왔는지를 점점 더 자세히 알아 가고 있다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "시리우스의 빛이 지구에 도달하는 데 걸리는 시간은 얼마인가?",
      [findRange(paragraphs, "p1", "약 8.6년 전에 그 별을 떠난 것이다")]),
    makeConfirmQ("q2", "1광년은 어떤 거리를 나타내는 단위인가?",
      [findRange(paragraphs, "p2", "빛이 1년 동안 이동하는 거리를 광년이라는 단위로 표현한다")]),
    makeConfirmQ("q3", "태양에서 가장 가까운 별까지의 거리는 얼마인가?",
      [findRange(paragraphs, "p2", "프록시마 센타우리까지의 거리가 약 4.2광년")]),
    makeConfirmQ("q4", "밤하늘을 보는 것이 우주의 과거를 보는 것과 같은 이유는 무엇인가?",
      [findRange(paragraphs, "p3", "우리가 보는 별빛은 서로 다른 시간대의 빛이 섞여 있는 것이다")]),
    makeConfirmQ("q5", "허블 우주 망원경이 깨끗한 영상을 촬영할 수 있는 이유는 무엇인가?",
      [findRange(paragraphs, "p4", "지구 대기의 방해 없이 우주 공간에서 깨끗한 영상을 촬영하여")]),
    makeConfirmQ("q6", "과학자들이 관측을 통해 밝혀낸 우주의 나이는 얼마인가?",
      [findRange(paragraphs, "p4", "우주의 나이가 약 138억 년이라는 사실을 밝혀내었으며")])
  ];

  const content = assembleFull(213, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ═══ 실행부 ═══
const results = [
  { dayIndex: 209, ...buildDay209() },
  { dayIndex: 210, ...buildDay210() },
  { dayIndex: 211, ...buildDay211() },
  { dayIndex: 212, ...buildDay212() },
  { dayIndex: 213, ...buildDay213() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});
const tempBatchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-f2-209-213.json');
fs.writeFileSync(tempBatchPath, JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ 임시 배치: ${tempBatchPath}`);
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
