const fs = require('fs');
const path = require('path');

// === 유틸리티 함수 ===
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

function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

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
    const s = i * chunkSize;
    const e = Math.min(s + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(s, e) });
  }
  return cards;
}

function makeConfirmQ(id, prompt, ranges) {
  return {
    id, prompt,
    answerRanges: ranges,
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true,
    answerMatchMode: "ANY"
  };
}

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs);
  const cards = buildRecallCards(paragraphs);
  const nn = String(dayIndex).padStart(3, '0');
  return {
    contentId: `dr-f2-${nn}`,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(프레게 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_2",
    schoolGradeRange: { min: 6, max: 6 },
    area: "READING",
    subArea,
    competencies: ["READING"],
    tags: ["daily"],
    access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480,
    assets: {},
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 },
      confirm: { questions: confirmQuestions }
    }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return {
    content_type: "DAILY_READING",
    level_id: "FREGE_2",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content
  };
}

// === Day 259 (홀수 → 비문학) - 화폐의 역사와 변천 ===
function buildDay259() {
  const paragraphs = [
    { id: "p1", text: "인류 문명의 초기에 사람들은 자신에게 필요한 물건을 얻기 위해 물물 교환이라는 방식을 사용하였다. 예를 들어 쌀을 가진 농부가 옷이 필요하면 직접 옷을 가진 사람을 찾아가 쌀과 교환해야 했다. 그러나 이러한 물물 교환 방식은 서로가 원하는 물건이 정확히 일치해야 한다는 근본적인 한계가 있었기 때문에 교환이 이루어지기까지 상당한 시간과 노력이 소요되었다. 이 불편함을 해소하기 위해 사람들은 조개껍데기, 소금, 곡물 등 누구나 가치를 인정하는 물품을 교환의 매개체로 활용하기 시작했으며, 이것이 바로 최초의 화폐라 할 수 있는 물품 화폐의 등장이다." },
    { id: "p2", text: "물품 화폐는 부피가 크고 보관이 어려우며 시간이 지나면 가치가 변한다는 단점이 있었다. 이를 극복하기 위해 금, 은과 같은 귀금속이 화폐로 사용되기 시작했는데, 금속 화폐는 내구성이 뛰어나고 무게에 따라 가치를 정밀하게 측정할 수 있어 교역 활동을 비약적으로 활성화시켰다. 이후 국가가 금속에 일정한 모양과 무게를 부여하고 공식적인 도장을 찍어 발행하는 주화가 등장하면서 화폐에 대한 사회적 신뢰가 더욱 공고해졌다. 주화의 등장은 상업 거래의 효율성을 획기적으로 높였을 뿐 아니라 세금 징수와 국가 재정 운영의 기반이 되었다." },
    { id: "p3", text: "근대에 들어서면서 종이로 만든 지폐가 널리 유통되기 시작했고, 오늘날에는 신용카드와 전자 화폐, 암호 화폐까지 등장하여 화폐의 형태가 눈에 보이지 않는 디지털 영역으로까지 확장되고 있다. 스마트폰 하나로 물건을 구매하고 해외로 송금하는 일이 일상이 된 시대에 화폐의 본질은 더 이상 물리적인 실체가 아니라 사회 구성원 간의 약속과 신뢰에 있다고 할 수 있다. 화폐의 역사를 통해 우리는 인류가 어떻게 교환의 불편함을 창의적으로 해결해 왔는지를 확인할 수 있으며, 미래의 화폐가 어떤 모습으로 진화할지에 대한 관심 역시 점차 높아지고 있다." }
  ];
  const len = charLen(paragraphs);
  console.log(`  Day 259 지문 길이: ${len}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '서로가 원하는 물건이 정확히 일치해야 한다는 근본적인 한계'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "서로가 원하는 물건이 정확히 일치해야 한다는 근본적인 한계")]),
    makeConfirmQ("q2", "지문에서 '누구나 가치를 인정하는 물품을 교환의 매개체로 활용하기 시작했으며'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "누구나 가치를 인정하는 물품을 교환의 매개체로 활용하기 시작했으며")]),
    makeConfirmQ("q3", "지문에서 '내구성이 뛰어나고 무게에 따라 가치를 정밀하게 측정할 수 있어'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "내구성이 뛰어나고 무게에 따라 가치를 정밀하게 측정할 수 있어")]),
    makeConfirmQ("q4", "지문에서 '화폐에 대한 사회적 신뢰가 더욱 공고해졌다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "화폐에 대한 사회적 신뢰가 더욱 공고해졌다")]),
    makeConfirmQ("q5", "지문에서 '세금 징수와 국가 재정 운영의 기반이 되었다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "세금 징수와 국가 재정 운영의 기반이 되었다")]),
    makeConfirmQ("q6", "지문에서 '화폐의 본질은 더 이상 물리적인 실체가 아니라 사회 구성원 간의 약속과 신뢰에 있다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "화폐의 본질은 더 이상 물리적인 실체가 아니라 사회 구성원 간의 약속과 신뢰에 있다")]),
    makeConfirmQ("q7", "지문에서 '인류가 어떻게 교환의 불편함을 창의적으로 해결해 왔는지'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "인류가 어떻게 교환의 불편함을 창의적으로 해결해 왔는지")])
  ];

  const content = assembleFull(259, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === Day 260 (짝수 → 문학) - 겨울 장터의 호떡 ===
function buildDay260() {
  const paragraphs = [
    { id: "p1", text: "겨울 방학이 시작된 첫날, 은지는 할머니 손을 잡고 오일장이 열리는 시골 장터에 나갔다. 아침부터 매서운 바람이 불어 코끝이 얼얼했지만 장터에는 벌써 수많은 사람이 북적이고 있었다. 좌판 위에는 무, 배추, 시래기 같은 겨울 채소가 가지런히 놓여 있었고, 장갑을 끼지 않은 할머니의 손은 벌겋게 얼어 있었다. 은지는 할머니 손을 꼭 잡으며 장갑을 빌려 드리려 했지만 할머니는 괜찮다며 손사래를 치셨다." },
    { id: "p2", text: "장터 한쪽 구석에서 고소한 냄새가 바람을 타고 흘러왔다. 커다란 철판 위에서 반죽이 지글지글 익어 가고 있었는데, 그것은 설탕과 잘게 부순 땅콩이 가득 든 호떡이었다. 할머니는 지갑에서 천 원짜리 두 장을 꺼내 호떡 두 개를 사 주셨다. 은지는 종이봉투 속 뜨거운 호떡을 호호 불며 한 입 베어 물었다. 달콤한 설탕 시럽이 입안 가득 퍼지면서 추위에 얼었던 몸이 녹아내리듯 따뜻해졌다." },
    { id: "p3", text: "할머니는 호떡을 드시지 않고 은지가 먹는 모습을 흐뭇하게 바라보기만 하셨다. 은지가 할머니도 드시라고 호떡을 내밀자 할머니는 한 입만 작게 베어 무시고는 나머지를 도로 은지에게 건네주셨다. 은지는 할머니의 거칠고 갈라진 손을 보며 갑자기 코끝이 찡해졌다. 일 년에 몇 번 보지 못하는 할머니가 장터에서 손녀와 호떡 하나를 나눠 먹는 이 순간이 얼마나 소중한 시간인지 문득 깨달았기 때문이다." },
    { id: "p4", text: "장을 다 보고 돌아오는 길에 할머니는 은지의 손을 꼭 잡으며 다음에 또 함께 오자고 다정하게 말씀하셨다. 은지는 씩씩하게 고개를 끄덕이며 꼭 올게요 하고 힘차게 대답했다. 집에 돌아온 은지는 방에 들어가 서랍 속 용돈 봉투를 열어 보았다. 다음에 장터에 가면 할머니께 따뜻한 겨울 장갑을 꼭 사 드리겠다고 조용히 다짐하며 봉투를 소중하게 서랍 안에 다시 넣었다." }
  ];
  const len = charLen(paragraphs);
  console.log(`  Day 260 지문 길이: ${len}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '장갑을 끼지 않은 할머니의 손은 벌겋게 얼어 있었다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "장갑을 끼지 않은 할머니의 손은 벌겋게 얼어 있었다")]),
    makeConfirmQ("q2", "지문에서 '설탕과 잘게 부순 땅콩이 가득 든 호떡이었다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "설탕과 잘게 부순 땅콩이 가득 든 호떡이었다")]),
    makeConfirmQ("q3", "지문에서 '추위에 얼었던 몸이 녹아내리듯 따뜻해졌다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "추위에 얼었던 몸이 녹아내리듯 따뜻해졌다")]),
    makeConfirmQ("q4", "지문에서 '할머니의 거칠고 갈라진 손을 보며 갑자기 코끝이 찡해졌다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "할머니의 거칠고 갈라진 손을 보며 갑자기 코끝이 찡해졌다")]),
    makeConfirmQ("q5", "지문에서 '호떡 하나를 나눠 먹는 이 순간이 얼마나 소중한 시간인지'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "호떡 하나를 나눠 먹는 이 순간이 얼마나 소중한 시간인지")]),
    makeConfirmQ("q6", "지문에서 '할머니께 따뜻한 겨울 장갑을 꼭 사 드리겠다고 조용히 다짐하며'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p4", "할머니께 따뜻한 겨울 장갑을 꼭 사 드리겠다고 조용히 다짐하며")])
  ];

  const content = assembleFull(260, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === Day 261 (홀수 → 비문학) - 토양의 구성과 중요성 ===
function buildDay261() {
  const paragraphs = [
    { id: "p1", text: "토양은 지구 표면을 덮고 있는 얇은 층으로, 암석이 오랜 세월에 걸쳐 물리적 풍화와 화학적 풍화를 반복적으로 겪으면서 잘게 부서져 형성된 것이다. 토양의 구성을 살펴보면 광물질이 약 45퍼센트, 유기물이 약 5퍼센트를 차지하고, 나머지 50퍼센트는 공기와 수분이 채우고 있다. 광물질은 모래, 미사, 점토로 나뉘는데, 이 세 가지 입자의 비율에 따라 토양의 질감과 특성이 결정된다. 모래가 많은 토양은 배수가 잘 되지만 수분 보유력이 낮고, 점토가 많은 토양은 수분을 오래 머금지만 통기성이 떨어져 뿌리가 숨 쉬기 어렵다." },
    { id: "p2", text: "토양은 식물이 뿌리를 내리고 생장하는 데 필수적인 터전이며, 미생물과 곤충 등 수많은 생명체가 살아가는 거대한 생태계이기도 하다. 한 줌의 건강한 토양 속에는 수십억 마리의 미생물이 활동하고 있으며, 이들은 낙엽과 동물의 사체를 분해하여 토양에 영양분을 되돌려 주는 핵심적인 역할을 담당한다. 또한 토양은 빗물을 흡수하고 여과하여 지하수를 형성하는 자연 정수 시스템의 기능을 수행하며, 탄소를 대량으로 저장하여 대기 중 이산화탄소 농도를 조절하는 중요한 탄소 저장고 역할도 한다." },
    { id: "p3", text: "그러나 오늘날 전 세계적으로 토양 황폐화가 매우 심각한 환경 문제로 대두되고 있다. 무분별한 경작과 과도한 화학 비료의 남용은 토양의 유기물 함량을 크게 감소시키고, 대규모 산림 벌채는 표토가 빗물에 씻겨 나가는 토양 침식을 가속화한다. 건강한 토양이 1센티미터 형성되는 데에는 수백 년이 걸리지만, 인간의 부주의한 활동으로 파괴되는 것은 순식간이다. 토양을 보전하기 위해서는 돌려짓기 농법의 실천, 유기농 퇴비의 적극적 활용, 경사지에서의 계단식 농업 도입 등 지속 가능한 농업 방식으로의 전환이 시급히 이루어져야 한다." }
  ];
  const len = charLen(paragraphs);
  console.log(`  Day 261 지문 길이: ${len}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '물리적 풍화와 화학적 풍화를 반복적으로 겪으면서 잘게 부서져'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "물리적 풍화와 화학적 풍화를 반복적으로 겪으면서 잘게 부서져")]),
    makeConfirmQ("q2", "지문에서 '점토가 많은 토양은 수분을 오래 머금지만 통기성이 떨어져'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "점토가 많은 토양은 수분을 오래 머금지만 통기성이 떨어져")]),
    makeConfirmQ("q3", "지문에서 '낙엽과 동물의 사체를 분해하여 토양에 영양분을 되돌려 주는'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "낙엽과 동물의 사체를 분해하여 토양에 영양분을 되돌려 주는")]),
    makeConfirmQ("q4", "지문에서 '탄소를 대량으로 저장하여 대기 중 이산화탄소 농도를 조절하는'을 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "탄소를 대량으로 저장하여 대기 중 이산화탄소 농도를 조절하는")]),
    makeConfirmQ("q5", "지문에서 '과도한 화학 비료의 남용은 토양의 유기물 함량을 크게 감소시키고'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "과도한 화학 비료의 남용은 토양의 유기물 함량을 크게 감소시키고")]),
    makeConfirmQ("q6", "지문에서 '건강한 토양이 1센티미터 형성되는 데에는 수백 년이 걸리지만'을 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "건강한 토양이 1센티미터 형성되는 데에는 수백 년이 걸리지만")]),
    makeConfirmQ("q7", "지문에서 '지속 가능한 농업 방식으로의 전환이 시급히 이루어져야 한다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "지속 가능한 농업 방식으로의 전환이 시급히 이루어져야 한다")])
  ];

  const content = assembleFull(261, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === Day 262 (짝수 → 문학) - 빈 화분의 비밀 ===
function buildDay262() {
  const paragraphs = [
    { id: "p1", text: "옛날 어느 나라에 현명한 왕이 있었다. 왕은 나이가 많아 후계자를 정해야 했는데, 왕자가 없었기에 나라 안의 모든 아이들에게 기회를 주기로 결심했다. 왕은 신하들을 통해 온 나라의 아이들에게 특별한 씨앗을 한 알씩 나누어 주게 하고, 정확히 일 년 뒤에 자신이 기른 화분을 가지고 궁궐로 오라는 명을 내렸다. 아이들은 저마다 정성을 다해 흙을 고르고 물을 주며 싹이 트기를 간절히 기다렸다." },
    { id: "p2", text: "일 년이 지나고 궁궐 앞 넓은 마당에는 저마다 아름다운 꽃을 피운 화분을 든 아이들이 길게 줄을 서 있었다. 붉은 장미, 노란 해바라기, 하얀 백합 등 온갖 화려한 꽃들이 마당을 가득 메웠다. 그런데 맨 뒤에 서 있던 준이라는 소년만은 텅 빈 화분을 가슴에 안고 고개를 숙이고 있었다. 준은 매일 물을 주고 햇볕을 쬐어 주었지만 싹이 단 한 번도 올라오지 않았기에 빈 화분을 들고 온 것이 부끄럽고 창피하기 그지없었다." },
    { id: "p3", text: "왕은 아이들의 화분을 하나하나 살펴보며 천천히 걸어오다가 빈 화분을 안고 있는 준 앞에서 걸음을 멈추었다. 왕은 빙그레 웃으며 이 아이가 바로 내가 찾던 후계자라고 크게 선포하였다. 모든 사람이 놀라 웅성거리자 왕이 그 까닭을 차분하게 설명했다. 내가 나누어 준 씨앗은 모두 삶아서 절대로 싹이 틀 수 없는 것이었다. 다른 아이들은 싹이 나지 않자 몰래 다른 씨앗을 심었지만, 이 아이만이 정직하게 빈 화분을 그대로 가져왔다." },
    { id: "p4", text: "왕은 준의 어깨에 손을 올리며 말했다. 나라를 다스리는 데 가장 중요한 덕목은 재주가 아니라 바로 정직이란다. 준은 눈물이 글썽이는 눈으로 왕을 올려다보았다. 그날 이후 준은 왕의 곁에서 배움을 이어 갔고 훗날 백성들의 깊은 신뢰를 받는 훌륭한 왕이 되었다. 사람들은 오래도록 빈 화분의 이야기를 자녀들에게 들려주며 정직한 사람이 결국 가장 큰 보상을 받는다는 교훈을 전해 주었다." }
  ];
  const len = charLen(paragraphs);
  console.log(`  Day 262 지문 길이: ${len}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '왕자가 없었기에 나라 안의 모든 아이들에게 기회를 주기로 결심했다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "왕자가 없었기에 나라 안의 모든 아이들에게 기회를 주기로 결심했다")]),
    makeConfirmQ("q2", "지문에서 '싹이 단 한 번도 올라오지 않았기에'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "싹이 단 한 번도 올라오지 않았기에")]),
    makeConfirmQ("q3", "지문에서 '이 아이가 바로 내가 찾던 후계자라고 크게 선포하였다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "이 아이가 바로 내가 찾던 후계자라고 크게 선포하였다")]),
    makeConfirmQ("q4", "지문에서 '삶아서 절대로 싹이 틀 수 없는 것이었다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "삶아서 절대로 싹이 틀 수 없는 것이었다")]),
    makeConfirmQ("q5", "지문에서 '이 아이만이 정직하게 빈 화분을 그대로 가져왔다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "이 아이만이 정직하게 빈 화분을 그대로 가져왔다")]),
    makeConfirmQ("q6", "지문에서 '나라를 다스리는 데 가장 중요한 덕목은 재주가 아니라 바로 정직이란다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p4", "나라를 다스리는 데 가장 중요한 덕목은 재주가 아니라 바로 정직이란다")]),
    makeConfirmQ("q7", "지문에서 '정직한 사람이 결국 가장 큰 보상을 받는다는 교훈을 전해 주었다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p4", "정직한 사람이 결국 가장 큰 보상을 받는다는 교훈을 전해 주었다")])
  ];

  const content = assembleFull(262, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === Day 263 (홀수 → 비문학) - 빛의 성질과 색의 원리 ===
function buildDay263() {
  const paragraphs = [
    { id: "p1", text: "우리가 일상에서 보는 햇빛은 하얗게 보이지만 사실 여러 가지 색의 빛이 합쳐진 것이다. 17세기 영국의 과학자 아이작 뉴턴은 프리즘이라는 삼각형 유리를 이용하여 햇빛을 통과시키면 빨강, 주황, 노랑, 초록, 파랑, 남색, 보라의 일곱 가지 색으로 나뉜다는 사실을 최초로 증명하였다. 이 일곱 색의 연속적인 띠를 스펙트럼이라고 부른다. 빛은 파동의 성질을 가지고 있으며 각 색깔의 빛은 저마다 다른 파장을 가지고 있어 프리즘을 통과할 때 굴절되는 각도가 서로 달라 색이 분리되는 것이다." },
    { id: "p2", text: "우리가 물체의 색을 인식하는 원리는 빛의 반사와 흡수에 의해 결정된다. 예를 들어 사과가 빨갛게 보이는 까닭은 사과 표면이 빨간색 파장의 빛만 반사하고 나머지 색의 빛은 모두 흡수하기 때문이다. 반대로 하얀 종이는 모든 색의 빛을 고루 반사하므로 하얗게 보이며, 검은 옷은 거의 모든 빛을 흡수하기 때문에 어둡게 보인다. 이처럼 물체가 어떤 파장의 빛을 반사하느냐에 따라 우리 눈에 인식되는 색이 달라지며, 물체 자체가 고유한 색을 내뿜는 것이 아니라 빛과 물체 표면의 상호 작용의 결과인 것이다." },
    { id: "p3", text: "빛의 성질을 이해하면 우리 주변의 자연 현상도 쉽게 설명할 수 있다. 비가 온 뒤에 하늘에 뜨는 무지개는 공기 중의 수많은 작은 물방울이 프리즘과 같은 역할을 하여 햇빛을 분산시키면서 만들어지는 것이다. 하늘이 파랗게 보이는 것은 태양빛이 대기 중의 기체 분자와 부딪힐 때 파장이 짧은 파란빛이 사방으로 더 많이 퍼져 나가는 레일리 산란이라는 현상 때문이다. 노을이 붉은 까닭은 해가 질 때 빛이 대기를 비스듬히 통과하면서 파장이 긴 빨간빛만 관찰자에게 도달하기 때문이며, 빛의 과학은 이처럼 우리 일상의 아름다운 장면들을 명쾌하게 설명해 준다." }
  ];
  const len = charLen(paragraphs);
  console.log(`  Day 263 지문 길이: ${len}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '여러 가지 색의 빛이 합쳐진 것이다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "여러 가지 색의 빛이 합쳐진 것이다")]),
    makeConfirmQ("q2", "지문에서 '프리즘을 통과할 때 굴절되는 각도가 서로 달라 색이 분리되는 것이다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "프리즘을 통과할 때 굴절되는 각도가 서로 달라 색이 분리되는 것이다")]),
    makeConfirmQ("q3", "지문에서 '빨간색 파장의 빛만 반사하고 나머지 색의 빛은 모두 흡수하기 때문이다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "빨간색 파장의 빛만 반사하고 나머지 색의 빛은 모두 흡수하기 때문이다")]),
    makeConfirmQ("q4", "지문에서 '빛과 물체 표면의 상호 작용의 결과인 것이다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "빛과 물체 표면의 상호 작용의 결과인 것이다")]),
    makeConfirmQ("q5", "지문에서 '수많은 작은 물방울이 프리즘과 같은 역할을 하여'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "수많은 작은 물방울이 프리즘과 같은 역할을 하여")]),
    makeConfirmQ("q6", "지문에서 '파장이 짧은 파란빛이 사방으로 더 많이 퍼져 나가는 레일리 산란'을 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "파장이 짧은 파란빛이 사방으로 더 많이 퍼져 나가는 레일리 산란")]),
    makeConfirmQ("q7", "지문에서 '파장이 긴 빨간빛만 관찰자에게 도달하기 때문이며'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "파장이 긴 빨간빛만 관찰자에게 도달하기 때문이며")])
  ];

  const content = assembleFull(263, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === 실행부 ===
const results = [
  { dayIndex: 259, ...buildDay259() },
  { dayIndex: 260, ...buildDay260() },
  { dayIndex: 261, ...buildDay261() },
  { dayIndex: 262, ...buildDay262() },
  { dayIndex: 263, ...buildDay263() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

fs.writeFileSync(
  path.join(__dirname, '..', 'generated', 'new', 'batch-f2-259-263.json'),
  JSON.stringify(batchItems, null, 2), 'utf8'
);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
