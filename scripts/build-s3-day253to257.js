const fs = require('fs');
const path = require('path');

// === 공통 유틸리티 ===
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
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] }
      });
    });
    stepNum++;
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] }
    });
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
    id, prompt, answerRanges: ranges,
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true, answerMatchMode: "ANY"
  };
}

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs);
  const cards = buildRecallCards(paragraphs);
  const nn = String(dayIndex).padStart(3, '0');
  return {
    contentId: `dr-s3-${nn}`,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(소쉬르 3) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "SAUSSURE_3",
    schoolGradeRange: { min: 5, max: 5 },
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
    level_id: "SAUSSURE_3",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content
  };
}

// === Day 253 (홀수 → 비문학: 꿀벌의 의사소통) ===
function buildDay253() {
  const paragraphs = [
    {
      id: "p1",
      text: "꿀벌은 꽃이 있는 장소를 동료에게 알려 주기 위해 독특한 춤을 춘다. 이 춤을 벌의 춤 언어라고 부른다. 꿀벌이 추는 춤은 크게 원형 춤과 8자 춤 두 가지로 나뉜다. 원형 춤은 먹이가 벌집에서 가까운 곳에 있을 때 사용된다. 벌이 동그랗게 원을 그리며 돌면 다른 벌들은 주변에서 꽃을 찾기 시작한다. 반면 8자 춤은 먹이가 먼 곳에 있을 때 사용된다. 벌이 직선으로 이동하며 배를 흔드는 동작과 반원을 번갈아 그리면서 숫자 8 모양을 만든다."
    },
    {
      id: "p2",
      text: "8자 춤에서 직선 구간의 방향은 먹이가 있는 곳의 방향을 가리킨다. 벌은 태양의 위치를 기준으로 각도를 계산하여 동료에게 정확한 방향을 전달한다. 또한 직선 구간에서 배를 흔드는 시간이 길수록 먹이까지의 거리가 멀다는 뜻이다. 이러한 정보 전달 방식은 오스트리아의 동물학자 카를 폰 프리슈가 오랜 관찰 끝에 밝혀냈다. 그는 이 연구로 1973년에 노벨 생리의학상을 받았다."
    },
    {
      id: "p3",
      text: "꿀벌의 춤 언어는 동물의 의사소통 가운데 가장 정교한 사례로 꼽힌다. 작은 곤충이 방향과 거리라는 추상적인 정보를 몸짓으로 전달한다는 사실은 과학자들에게 큰 놀라움을 주었다. 최근 연구에서는 벌이 춤을 추는 동안 날개 진동으로 특정한 소리를 내어 정보 전달의 정확도를 높인다는 점도 밝혀졌다. 이처럼 꿀벌의 춤 언어는 자연 속에 숨겨진 놀라운 지혜를 보여 주는 대표적인 예이다."
    }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "꿀벌이 먹이 위치를 알려 주는 방법은?", [findRange(paragraphs, "p1", "독특한 춤을 춘다")]),
    makeConfirmQ("q2", "원형 춤은 어떤 경우에 사용되는가?", [findRange(paragraphs, "p1", "먹이가 벌집에서 가까운 곳에 있을 때 사용된다")]),
    makeConfirmQ("q3", "8자 춤에서 직선 구간의 방향이 알려 주는 것은?", [findRange(paragraphs, "p2", "먹이가 있는 곳의 방향을 가리킨다")]),
    makeConfirmQ("q4", "배를 흔드는 시간이 긴 것은 무엇을 뜻하는가?", [findRange(paragraphs, "p2", "먹이까지의 거리가 멀다는 뜻이다")]),
    makeConfirmQ("q5", "벌의 춤 언어를 밝혀낸 과학자는?", [findRange(paragraphs, "p2", "카를 폰 프리슈")]),
    makeConfirmQ("q6", "꿀벌의 춤 언어가 정교한 이유는?", [findRange(paragraphs, "p3", "방향과 거리라는 추상적인 정보를 몸짓으로 전달한다")]),
    makeConfirmQ("q7", "최근 연구에서 추가로 밝혀진 사실은?", [findRange(paragraphs, "p3", "날개 진동으로 특정한 소리를 내어 정보 전달의 정확도를 높인다")])
  ];
  const content = assembleFull(253, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === Day 254 (짝수 → 문학: 할머니의 텃밭) ===
function buildDay254() {
  const paragraphs = [
    {
      id: "p1",
      text: "하은이는 여름 방학마다 시골 할머니 댁에 간다. 올해도 방학이 시작되자마자 할머니 댁으로 향했다. 할머니 집 뒤편에는 작은 텃밭이 있었다. 토마토와 고추와 상추가 가지런히 줄을 맞추어 자라고 있었다. 할머니는 하은이를 보자 환하게 웃으시며 텃밭 구경을 시켜 주셨다. 하은이는 빨갛게 익은 토마토가 가장 먼저 눈에 들어왔다. 할머니가 잘 익은 토마토 하나를 따서 건네주시자 하은이는 한 입 베어 물었다."
    },
    {
      id: "p2",
      text: "마트에서 사 먹던 토마토와는 비교할 수 없을 만큼 달고 상큼했다. 하은이가 감탄하자 할머니는 매일 아침 물을 주고 정성껏 돌본 덕분이라며 뿌듯해하셨다. 다음 날 아침 하은이는 할머니와 함께 텃밭에 나갔다. 할머니는 물뿌리개로 채소에 물을 주는 방법과 잡초를 뽑는 요령을 알려 주셨다. 처음에는 잡초와 채소를 구별하기 어려웠지만 할머니의 설명을 듣고 나니 차이가 보이기 시작했다. 하은이는 열심히 잡초를 뽑으며 땀을 흘렸다."
    },
    {
      id: "p3",
      text: "일주일 동안 매일 텃밭을 돌보니 하은이는 채소에 애정이 생겼다. 자신이 물을 준 상추가 쑥쑥 자라는 모습이 뿌듯했다. 방학이 끝나기 전날 할머니는 하은이에게 작은 화분 하나를 선물하셨다. 화분에는 방울토마토 모종이 심어져 있었다. 할머니는 집에 돌아가서도 직접 키워 보라고 하셨다. 하은이는 화분을 품에 안으며 꼭 잘 키우겠다고 약속했다. 시골에서의 여름은 하은이에게 생명을 돌보는 즐거움을 알려 준 소중한 시간이었다."
    }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "하은이가 여름 방학마다 가는 곳은?", [findRange(paragraphs, "p1", "시골 할머니 댁에 간다")]),
    makeConfirmQ("q2", "텃밭에서 자라는 채소는 무엇인가?", [findRange(paragraphs, "p1", "토마토와 고추와 상추가 가지런히 줄을 맞추어 자라고 있었다")]),
    makeConfirmQ("q3", "텃밭 토마토의 맛은 어땠는가?", [findRange(paragraphs, "p2", "비교할 수 없을 만큼 달고 상큼했다")]),
    makeConfirmQ("q4", "할머니가 알려 준 텃밭 관리 방법은?", [findRange(paragraphs, "p2", "물뿌리개로 채소에 물을 주는 방법과 잡초를 뽑는 요령을 알려 주셨다")]),
    makeConfirmQ("q5", "하은이가 처음에 어려웠던 것은?", [findRange(paragraphs, "p2", "잡초와 채소를 구별하기 어려웠지만")]),
    makeConfirmQ("q6", "할머니가 하은이에게 준 선물은?", [findRange(paragraphs, "p3", "작은 화분 하나를 선물하셨다")]),
    makeConfirmQ("q7", "하은이가 시골에서 배운 것은?", [findRange(paragraphs, "p3", "생명을 돌보는 즐거움을 알려 준 소중한 시간이었다")])
  ];
  const content = assembleFull(254, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === Day 255 (홀수 → 비문학: 한옥의 과학적 원리) ===
function buildDay255() {
  const paragraphs = [
    {
      id: "p1",
      text: "한옥은 우리나라의 전통 가옥으로 자연환경에 맞추어 과학적으로 설계되었다. 한옥의 가장 큰 특징은 온돌과 마루가 함께 있다는 점이다. 온돌은 바닥 아래에 불을 지펴 돌을 데우는 난방 방식이다. 뜨거운 연기가 바닥 아래 고래라는 통로를 지나면서 돌을 고르게 데운다. 한번 데워진 돌은 열을 오래 머금고 있어 밤새 따뜻한 방을 유지할 수 있다. 이 때문에 추운 겨울에도 바닥에 앉아 생활하는 것이 가능했다."
    },
    {
      id: "p2",
      text: "반면 마루는 나무로 만든 높은 바닥으로 여름에 시원하게 지내기 위한 공간이다. 마루 아래는 비어 있어 바람이 자유롭게 지나간다. 이 바람이 나무 바닥을 식혀 주기 때문에 무더운 여름에도 마루에 앉으면 시원함을 느낄 수 있다. 또한 한옥의 처마는 여름에는 높이 뜬 태양빛을 가려 주고 겨울에는 낮게 비치는 햇빛을 방 안으로 들여보내는 역할을 한다. 이처럼 한옥은 계절에 따라 자연스럽게 온도를 조절하는 지혜가 담겨 있다."
    },
    {
      id: "p3",
      text: "한옥의 벽은 주로 흙과 짚을 섞어 만든다. 흙벽은 습한 날에는 수분을 빨아들이고 건조한 날에는 수분을 내보내어 실내 습도를 자동으로 조절한다. 또한 한옥의 창문에는 한지를 붙이는데 한지는 공기를 통과시키면서도 바람을 막아 주는 성질이 있다. 이 덕분에 환기가 잘 되면서도 외풍을 줄일 수 있다. 이렇게 한옥은 자연 재료를 활용하여 사람이 편안하게 살 수 있도록 만들어진 친환경 건축의 훌륭한 본보기이다."
    }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "한옥의 가장 큰 특징은 무엇인가?", [findRange(paragraphs, "p1", "온돌과 마루가 함께 있다는 점이다")]),
    makeConfirmQ("q2", "온돌의 난방 원리는 무엇인가?", [findRange(paragraphs, "p1", "바닥 아래에 불을 지펴 돌을 데우는 난방 방식이다")]),
    makeConfirmQ("q3", "마루가 여름에 시원한 이유는?", [findRange(paragraphs, "p2", "마루 아래는 비어 있어 바람이 자유롭게 지나간다")]),
    makeConfirmQ("q4", "한옥의 처마가 하는 역할은?", [findRange(paragraphs, "p2", "여름에는 높이 뜬 태양빛을 가려 주고 겨울에는 낮게 비치는 햇빛을 방 안으로 들여보내는 역할을 한다")]),
    makeConfirmQ("q5", "흙벽이 습도를 조절하는 방법은?", [findRange(paragraphs, "p3", "습한 날에는 수분을 빨아들이고 건조한 날에는 수분을 내보내어 실내 습도를 자동으로 조절한다")]),
    makeConfirmQ("q6", "한지의 특성은 무엇인가?", [findRange(paragraphs, "p3", "공기를 통과시키면서도 바람을 막아 주는 성질이 있다")])
  ];
  const content = assembleFull(255, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === Day 256 (짝수 → 문학: 잃어버린 구슬) ===
function buildDay256() {
  const paragraphs = [
    {
      id: "p1",
      text: "준서는 아끼던 유리 구슬을 잃어버렸다. 그 구슬은 할아버지가 어린 시절 가지고 놀던 것으로 졸업 선물로 받은 소중한 물건이었다. 점심시간에 운동장에서 구슬치기를 하다가 가방에 넣어 두었는데 수업이 끝나고 확인하니 구슬이 사라져 있었다. 준서는 교실 구석구석을 살펴보았지만 구슬은 보이지 않았다. 복도와 운동장까지 돌아다니며 찾았지만 소용이 없었다. 점점 마음이 무거워지면서 눈물이 날 것 같았다."
    },
    {
      id: "p2",
      text: "다음 날 아침 같은 반 친구 소연이가 준서에게 다가왔다. 소연이는 어제 청소 시간에 사물함 뒤에서 유리 구슬을 발견했다며 조심스럽게 건네주었다. 준서는 구슬을 확인하고 너무 기뻐서 몇 번이나 고맙다고 인사했다. 소연이는 준서가 어제 열심히 무언가를 찾는 모습을 보고 혹시 이것이 아닐까 생각했다고 말했다. 준서는 소연이의 세심한 관찰에 감동받았다."
    },
    {
      id: "p3",
      text: "준서는 그날 일기장에 오늘 있었던 일을 적었다. 소중한 것을 잃어버리면 그제서야 그것이 얼마나 중요했는지 깨닫게 된다고 썼다. 그리고 소연이처럼 주변을 살피고 다른 사람을 도와주는 따뜻한 마음을 가진 친구가 있어서 감사하다고 적었다. 준서는 앞으로 소중한 물건을 더 잘 간수하겠다고 다짐했다. 또한 자기도 누군가 어려울 때 먼저 도움을 줄 수 있는 사람이 되겠다고 마음먹었다. 구슬을 찾은 것보다 좋은 친구를 알게 된 것이 더 큰 수확이라는 생각이 들었다."
    }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "준서가 잃어버린 구슬은 누구에게 받은 것인가?", [findRange(paragraphs, "p1", "할아버지가 어린 시절 가지고 놀던 것으로 졸업 선물로 받은 소중한 물건이었다")]),
    makeConfirmQ("q2", "구슬을 어디에서 잃어버렸는가?", [findRange(paragraphs, "p1", "점심시간에 운동장에서 구슬치기를 하다가 가방에 넣어 두었는데")]),
    makeConfirmQ("q3", "구슬을 발견한 사람은 누구인가?", [findRange(paragraphs, "p2", "같은 반 친구 소연이가 준서에게 다가왔다")]),
    makeConfirmQ("q4", "소연이가 구슬을 발견한 장소는?", [findRange(paragraphs, "p2", "사물함 뒤에서 유리 구슬을 발견했다")]),
    makeConfirmQ("q5", "소연이가 구슬의 주인을 짐작한 이유는?", [findRange(paragraphs, "p2", "준서가 어제 열심히 무언가를 찾는 모습을 보고 혹시 이것이 아닐까 생각했다")]),
    makeConfirmQ("q6", "준서가 일기장에 적은 깨달음은?", [findRange(paragraphs, "p3", "소중한 것을 잃어버리면 그제서야 그것이 얼마나 중요했는지 깨닫게 된다")]),
    makeConfirmQ("q7", "준서가 더 큰 수확이라고 생각한 것은?", [findRange(paragraphs, "p3", "좋은 친구를 알게 된 것이 더 큰 수확이라는 생각이 들었다")])
  ];
  const content = assembleFull(256, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === Day 257 (홀수 → 비문학: 태풍의 생성과 소멸) ===
function buildDay257() {
  const paragraphs = [
    {
      id: "p1",
      text: "태풍은 열대 바다에서 발생하는 강력한 폭풍이다. 수온이 27도 이상인 바다에서 수증기가 대량으로 증발하면 거대한 구름 덩어리가 만들어진다. 이 구름이 회전하기 시작하면서 점점 세력이 커지면 태풍으로 발달한다. 태풍의 중심에는 바람이 거의 불지 않는 고요한 영역이 있는데 이것을 태풍의 눈이라고 부른다. 태풍의 눈 주변에는 가장 강한 바람과 폭우가 몰아친다. 태풍은 시속 200킬로미터가 넘는 바람을 동반하기도 한다."
    },
    {
      id: "p2",
      text: "태풍은 지구의 열 균형을 유지하는 데 중요한 역할을 한다. 적도 근처의 뜨거운 열기를 위도가 높은 지역으로 운반하여 지구 전체의 온도를 조절한다. 또한 태풍이 지나간 바다에서는 깊은 곳의 차가운 물이 위로 올라오면서 바닷속 영양분이 섞이게 된다. 이것은 해양 생물의 성장에 도움을 준다. 그러나 태풍이 육지에 상륙하면 강한 바람과 폭우로 인해 건물이 무너지고 농작물이 피해를 입는 등 큰 재해를 일으키기도 한다."
    },
    {
      id: "p3",
      text: "태풍은 따뜻한 바다에서 에너지를 공급받기 때문에 육지에 상륙하거나 차가운 바다로 이동하면 서서히 세력이 약해진다. 수증기 공급이 끊기면 구름이 흩어지고 바람도 잦아들면서 태풍은 소멸한다. 우리나라에는 주로 여름과 가을에 태풍이 영향을 미치며 기상청에서는 태풍의 이동 경로를 미리 예측하여 국민에게 알린다. 태풍에 대비하기 위해 창문을 보강하고 비상 물품을 준비하는 것이 중요하다. 태풍은 파괴적이지만 동시에 자연의 균형을 유지하는 데 필수적인 기상 현상이다."
    }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "태풍이 발생하는 조건은 무엇인가?", [findRange(paragraphs, "p1", "수온이 27도 이상인 바다에서 수증기가 대량으로 증발하면")]),
    makeConfirmQ("q2", "태풍의 눈이란 무엇인가?", [findRange(paragraphs, "p1", "바람이 거의 불지 않는 고요한 영역")]),
    makeConfirmQ("q3", "태풍이 지구에서 하는 역할은?", [findRange(paragraphs, "p2", "적도 근처의 뜨거운 열기를 위도가 높은 지역으로 운반하여 지구 전체의 온도를 조절한다")]),
    makeConfirmQ("q4", "태풍이 바다에 주는 긍정적 영향은?", [findRange(paragraphs, "p2", "깊은 곳의 차가운 물이 위로 올라오면서 바닷속 영양분이 섞이게 된다")]),
    makeConfirmQ("q5", "태풍이 약해지는 원인은?", [findRange(paragraphs, "p3", "육지에 상륙하거나 차가운 바다로 이동하면 서서히 세력이 약해진다")]),
    makeConfirmQ("q6", "우리나라에 태풍이 영향을 미치는 시기는?", [findRange(paragraphs, "p3", "주로 여름과 가을에 태풍이 영향을 미치며")]),
    makeConfirmQ("q7", "태풍에 대비하는 방법은?", [findRange(paragraphs, "p3", "창문을 보강하고 비상 물품을 준비하는 것이 중요하다")])
  ];
  const content = assembleFull(257, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === 실행부 ===
const results = [
  { dayIndex: 253, ...buildDay253() },
  { dayIndex: 254, ...buildDay254() },
  { dayIndex: 255, ...buildDay255() },
  { dayIndex: 256, ...buildDay256() },
  { dayIndex: 257, ...buildDay257() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];

results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

const newDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
fs.writeFileSync(path.join(newDir, 'batch-s3-253-257.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ generated/new/batch-s3-253-257.json`);

console.log('\n=== 검증 결과 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
