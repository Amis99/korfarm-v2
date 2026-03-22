// 비트겐슈타인1 Day 7 비문학(NONFICTION) - 도시 열섬 현상 (고1~고2 수준, 1400자 ±50)
const fs = require('fs');
const path = require('path');

const p1 = "도시의 여름은 같은 시기의 농촌이나 산림 지역보다 체감 온도가 훨씬 높게 느껴진다. 이는 도시 열섬 현상 때문인데, 도시 열섬이란 도시의 기온이 주변 교외 지역보다 섭씨 2도에서 최대 10도 이상 높아지는 현상을 말한다. 열화상 카메라로 촬영하면 도심부가 붉게 달아오른 섬처럼 나타나기 때문에 열섬이라는 이름이 붙었다. 이 현상은 도시화가 진행되면서 자연 지표면이 아스팔트와 콘크리트로 뒤덮이고, 건물과 차량에서 발생하는 인공 열이 축적되면서 나타난다. 또한 도시에서는 녹지와 수면이 줄어들어 증발에 의한 냉각 효과가 감소하기 때문에 열이 더 쉽게 쌓인다. 결국 도시 열섬은 인간의 활동이 만들어 낸 인위적 환경 변화가 기후에 직접적으로 영향을 미친 결과라 할 수 있다.";
const p2 = "도시 열섬 현상의 주요 원인은 크게 세 가지로 나눌 수 있다. 첫째, 건축 자재의 열 흡수 특성이다. 아스팔트와 콘크리트는 태양열을 빠르게 흡수하고 밤에도 쉽게 방출하지 않아 도심의 야간 기온을 높이는 주요 요인으로 작용한다. 둘째, 인공 열의 배출이다. 자동차의 배기가스, 에어컨의 실외기, 공장의 가동 등에서 나오는 열이 대기 중에 쌓이면서 주변 온도를 끌어올린다. 특히 도심의 교통량이 많은 도로에서는 차량 밀집으로 인해 열 배출이 집중적으로 이루어진다. 셋째, 도시의 기하학적 구조이다. 고층 건물이 밀집한 도심에서는 건물 사이로 바람이 잘 통하지 않아 열이 빠져나가기 어렵고, 건물 표면에서 반사된 열이 다시 다른 건물에 흡수되는 복사열 가둠 현상이 발생한다.";
const p3 = "도시 열섬 현상은 도시 거주민의 건강과 생활에 다양한 부정적 영향을 끼친다. 가장 직접적인 피해는 폭염으로 인한 온열 질환의 증가이다. 열사병이나 열탈진 같은 질환은 노약자와 야외 노동자에게 특히 위험하며, 최악의 경우 생명을 앗아가기도 한다. 또한 열대야가 길어지면서 수면의 질이 떨어지고 만성 피로가 누적되어 일상생활에 지장을 주기도 한다. 에너지 소비 측면에서도 심각한 문제가 발생한다. 냉방 수요의 급증은 전력 소비를 크게 증가시키고, 이는 다시 발전 과정에서 온실가스 배출을 늘려 지구 온난화를 가속화하는 악순환을 만들어 낸다.";
const p4 = "도시 열섬 현상을 완화하기 위한 대책도 활발히 연구되고 있다. 가장 효과적인 방법 중 하나는 도시 녹지의 확충이다. 공원이나 가로수 등 녹지 면적을 넓히면 식물의 증산 작용으로 주변 기온이 자연스럽게 낮아지는 효과를 얻을 수 있다. 또한 건물의 옥상이나 벽면에 식물을 심는 옥상 녹화와 벽면 녹화도 건물 표면 온도를 효과적으로 낮추는 데 기여한다. 한편 아스팔트 대신 빗물이 스며드는 투수성 포장재를 사용하거나 태양열을 반사하는 쿨 루프 기술을 적용하는 등 건축 소재 측면의 개선도 추진되고 있다. 이러한 다각적인 노력이 유기적으로 결합되어야 도시의 열 환경을 근본적으로 개선할 수 있을 것이다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
  { id: "p4", text: p4 }
];

const totalLen = p1.length + p2.length + p3.length + p4.length;
console.log("=== 지문 길이 검증 ===");
console.log(`p1: ${p1.length}자, p2: ${p2.length}자, p3: ${p3.length}자, p4: ${p4.length}자`);
console.log(`합계: ${totalLen}자`);
if (totalLen < 1350 || totalLen > 1450) console.error(`경고: 목표 범위(1400±50) 벗어남!`);

function findSentences(text) {
  const sentences = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1;
      while (next < text.length && text[next] === ' ') next++;
      start = next;
    }
  }
  if (start < text.length) sentences.push({ start, end: text.length, text: text.substring(start) });
  return sentences;
}

function findRange(paragraphId, searchText) {
  const para = paragraphs.find(p => p.id === paragraphId);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}" not found in ${paragraphId}`);
  return { paragraphId, start, end: start + searchText.length };
}

const p1S = findSentences(p1), p2S = findSentences(p2), p3S = findSentences(p3), p4S = findSentences(p4);
for (const p of paragraphs) {
  const s = findSentences(p.text);
  console.log(`\n${p.id}: ${s.length}문장`);
  s.forEach((x,i) => console.log(`  [${i}] ${x.start}-${x.end}: "${x.text.substring(0,40)}..."`));
}

const timeline = [];
let sn = 1;
function addStep(pId, start, end, prompt, choices, answerId) {
  timeline.push({
    stepId: `s${sn++}`,
    highlight: { ranges: [{ paragraphId: pId, start, end }] },
    question: {
      prompt, choices: choices.map((t,i) => ({ id: ["A","B","C","D"][i], text: t })),
      answerId, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

// === p1 정독 (6문장) ===
addStep("p1", p1S[0].start, p1S[0].end,
  "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  ["도시의 여름 체감 온도가 농촌이나 산림보다 훨씬 높게 느껴진다.", "도시의 여름은 농촌보다 시원하고 쾌적하다.", "농촌 지역의 여름이 도시보다 더 덥게 느껴진다.", "도시와 농촌의 여름 체감 온도는 동일하다."], "A");

addStep("p1", p1S[1].start, p1S[1].end,
  "둘째 문장에서 도시 열섬의 정의로 알맞은 것은 무엇인가요?",
  ["도시의 기온이 교외보다 2도에서 최대 10도 이상 높아지는 현상이다.", "도시의 기온이 교외보다 낮아지는 현상이다.", "도시에 실제 섬이 생기는 지리적 현상이다.", "교외 지역의 기온만 올라가는 현상이다."], "A");

addStep("p1", p1S[2].start, p1S[2].end,
  "셋째 문장이 설명하는 '열섬'이라는 이름의 유래로 알맞은 것은 무엇인가요?",
  ["열화상 카메라로 보면 도심이 붉게 달아오른 섬처럼 보이기 때문이다.", "도시 한가운데 실제로 뜨거운 섬이 생기기 때문이다.", "도시가 바다에 둘러싸여 섬의 형태를 갖추기 때문이다.", "도심부의 기온이 교외보다 낮아 차가운 섬처럼 보이기 때문이다."], "A");

addStep("p1", p1S[3].start, p1S[3].end,
  "넷째 문장이 설명하는 열섬 현상의 발생 원인으로 알맞은 것은 무엇인가요?",
  ["자연 지표면이 아스팔트와 콘크리트로 바뀌고 인공 열이 축적되기 때문이다.", "도시에 나무가 너무 많이 심어져 열이 차단되기 때문이다.", "도시의 지하수가 지표면의 온도를 높이기 때문이다.", "도시에 자연 지표면이 늘어나 열이 빠져나가기 때문이다."], "A");

addStep("p1", p1S[4].start, p1S[4].end,
  "다섯째 문장이 설명하는 추가 원인으로 알맞은 것은 무엇인가요?",
  ["녹지와 수면이 줄어 증발에 의한 냉각 효과가 감소하기 때문이다.", "도시에 물이 넘쳐 기온이 오히려 내려가기 때문이다.", "녹지가 늘어나 증산 작용이 과도해지기 때문이다.", "수면이 증가하여 습도만 높아지기 때문이다."], "A");

addStep("p1", p1S[5].start, p1S[5].end,
  "마지막 문장이 종합하는 내용으로 알맞은 것은 무엇인가요?",
  ["도시 열섬은 인간이 만든 환경 변화가 기후에 직접 영향을 미친 결과이다.", "도시 열섬은 자연 현상이므로 인간의 활동과 무관하다.", "도시 열섬은 기후 변화 없이 저절로 사라질 현상이다.", "인간의 활동은 도시 기온을 낮추는 데 기여한다."], "A");

addStep("p1", 0, p1.length,
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["도시 열섬은 도시화로 인해 기온이 교외보다 높아지는 인위적 현상이다.", "도시 열섬은 자연재해의 일종으로 인간이 통제할 수 없다.", "도시의 기온은 교외와 항상 같은 수준을 유지한다.", "녹지가 늘면 도시 열섬이 더욱 심해진다."], "A");

// === p2 정독 (8문장, 소주제별 묶기) ===
addStep("p2", p2S[0].start, p2S[0].end,
  "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  ["도시 열섬의 주요 원인이 크게 세 가지로 나뉜다.", "도시 열섬의 원인은 한 가지뿐이다.", "도시 열섬의 원인은 아직 밝혀지지 않았다.", "도시 열섬은 원인 없이 자연발생적으로 나타난다."], "A");

addStep("p2", p2S[1].start, p2S[2].end,
  "둘째, 셋째 문장이 설명하는 첫 번째 원인으로 알맞은 것은 무엇인가요?",
  ["아스팔트와 콘크리트가 태양열을 흡수하고 밤에도 쉽게 방출하지 않아 야간 기온을 높인다.", "건축 자재가 태양열을 반사하여 도심 온도를 낮춘다.", "건축 자재의 종류와 도시 기온은 관련이 없다.", "아스팔트가 빗물을 흡수하여 냉각 효과를 낸다."], "A");

addStep("p2", p2S[3].start, p2S[5].end,
  "넷째~여섯째 문장이 설명하는 두 번째 원인으로 알맞은 것은 무엇인가요?",
  ["자동차, 에어컨, 공장 등에서 나오는 인공 열이 쌓이며, 교통량 많은 도로에서 열 배출이 집중된다.", "인공 열의 배출은 도시 기온에 영향을 주지 않는다.", "에어컨은 도시 전체의 온도를 낮추는 역할을 한다.", "자동차와 공장은 열이 아닌 냉기를 배출한다."], "A");

addStep("p2", p2S[6].start, p2S[7].end,
  "일곱째, 여덟째 문장이 설명하는 세 번째 원인으로 알맞은 것은 무엇인가요?",
  ["고층 건물이 밀집하여 바람이 잘 통하지 않고 복사열 가둠 현상이 발생한다.", "도시의 낮은 건물들이 바람을 잘 통하게 하여 열을 분산시킨다.", "건물이 적을수록 열이 더 많이 가둬진다.", "도시의 기하학적 구조는 열 환경에 영향을 주지 않는다."], "A");

addStep("p2", 0, p2.length,
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["도시 열섬의 세 가지 주요 원인은 건축 자재의 열 흡수, 인공 열 배출, 도시의 기하학적 구조이다.", "도시 열섬의 원인은 오직 건축 자재의 열 흡수뿐이다.", "도시 열섬은 원인을 알 수 없는 미스터리 현상이다.", "도시의 기하학적 구조만이 유일한 열섬 원인이다."], "A");

// === p3 정독 (6문장) ===
addStep("p3", p3S[0].start, p3S[0].end,
  "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  ["도시 열섬이 거주민의 건강과 생활에 여러 부정적 영향을 끼친다.", "도시 열섬은 거주민의 건강에 긍정적 영향만 끼친다.", "도시 열섬은 도시 거주민에게 아무런 영향을 미치지 않는다.", "도시 열섬으로 거주민의 생활이 더 편리해진다."], "A");

addStep("p3", p3S[1].start, p3S[1].end,
  "둘째 문장이 제시하는 가장 직접적인 피해로 알맞은 것은 무엇인가요?",
  ["폭염으로 인한 온열 질환의 증가이다.", "도시 소음으로 인한 청력 저하이다.", "교통 혼잡으로 인한 스트레스 증가이다.", "대기 오염으로 인한 피부 질환 증가이다."], "A");

addStep("p3", p3S[2].start, p3S[2].end,
  "셋째 문장이 설명하는 온열 질환의 위험 대상으로 알맞은 것은 무엇인가요?",
  ["노약자와 야외 노동자에게 특히 위험하다.", "젊고 건강한 사람들에게만 위험하다.", "실내에서 일하는 사무직에게만 위험하다.", "도시에 거주하지 않는 사람들에게만 위험하다."], "A");

addStep("p3", p3S[3].start, p3S[3].end,
  "넷째 문장이 지적하는 추가 문제로 알맞은 것은 무엇인가요?",
  ["열대야가 길어져 수면의 질이 떨어지고 만성 피로가 쌓인다.", "열대야가 줄어들어 수면 환경이 개선된다.", "낮 시간이 짧아져 활동 시간이 줄어든다.", "도시의 밤 기온이 낮아져 쾌적해진다."], "A");

addStep("p3", p3S[4].start, p3S[5].end,
  "다섯째, 여섯째 문장이 설명하는 에너지 관련 문제로 알맞은 것은 무엇인가요?",
  ["냉방 수요 급증이 전력 소비를 늘리고 온실가스 배출을 증가시켜 온난화를 가속화한다.", "냉방 수요가 줄어들어 에너지 비용이 절약된다.", "전력 소비 증가는 온실가스와 무관하다.", "도시 열섬이 에너지 소비에 영향을 주지 않는다."], "A");

addStep("p3", 0, p3.length,
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["도시 열섬은 온열 질환, 수면 장애, 냉방 에너지 급증 등 건강과 환경에 악영향을 미친다.", "도시 열섬은 건강에만 영향을 줄 뿐 에너지 소비와는 무관하다.", "도시 열섬으로 인한 피해는 미미하여 대책이 필요하지 않다.", "열대야는 도시 열섬과 관련이 없는 자연 현상이다."], "A");

// === p4 정독 (6문장) ===
addStep("p4", p4S[0].start, p4S[0].end,
  "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  ["도시 열섬을 줄이기 위한 대책이 활발히 연구되고 있다.", "도시 열섬에 대한 대책은 전혀 연구되지 않고 있다.", "도시 열섬은 대책 없이 자연스럽게 해결될 것이다.", "도시 열섬 완화 연구는 이미 완료되었다."], "A");

addStep("p4", p4S[1].start, p4S[2].end,
  "둘째, 셋째 문장이 소개하는 대책으로 알맞은 것은 무엇인가요?",
  ["녹지 면적을 넓혀 식물의 증산 작용으로 기온을 낮추는 것이다.", "녹지를 줄이고 콘크리트 면적을 넓히는 것이다.", "공원을 폐쇄하여 건물을 더 많이 짓는 것이다.", "가로수를 제거하여 도로를 넓히는 것이다."], "A");

addStep("p4", p4S[3].start, p4S[3].end,
  "넷째 문장이 소개하는 녹화 방법으로 알맞은 것은 무엇인가요?",
  ["옥상이나 벽면에 식물을 심어 건물 표면 온도를 낮추는 방법이다.", "건물을 철거하고 공원으로 만드는 방법이다.", "건물 내부에만 화분을 두는 방법이다.", "옥상에 태양열 패널을 설치하는 방법이다."], "A");

addStep("p4", p4S[4].start, p4S[4].end,
  "다섯째 문장이 소개하는 건축 소재 개선 방법으로 알맞은 것은 무엇인가요?",
  ["투수성 포장재 사용이나 태양열을 반사하는 쿨 루프 기술 적용이다.", "아스팔트를 더 두껍게 깔아 열 흡수를 강화하는 것이다.", "건물에 검은색 페인트를 칠하여 열을 흡수하는 것이다.", "포장재를 모두 제거하여 흙길로 바꾸는 것이다."], "A");

addStep("p4", p4S[5].start, p4S[5].end,
  "마지막 문장이 강조하는 핵심으로 알맞은 것은 무엇인가요?",
  ["여러 방면의 노력이 결합되어야 도시의 열 환경을 근본적으로 개선할 수 있다.", "한 가지 대책만으로 도시 열섬을 완전히 해결할 수 있다.", "도시 열섬 완화는 불가능하므로 포기해야 한다.", "건축 소재 개선만으로 충분하다."], "A");

addStep("p4", 0, p4.length,
  "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["도시 열섬 완화를 위해 녹지 확충, 옥상 녹화, 건축 소재 개선 등 다양한 대책이 추진되고 있다.", "도시 열섬에 대한 대책은 녹지 확충 한 가지뿐이다.", "도시 열섬은 대책을 세우지 않아도 자연히 해결된다.", "건축 소재 개선만이 유일한 해결책이다."], "A");

// === 복기 카드 (8장) ===
const recall = {
  cards: [
    { id: "c1", text: "도시 열섬이란 도시의 기온이 교외보다 2도에서 최대 10도 이상 높아지는 인위적 현상이다." },
    { id: "c2", text: "자연 지표면이 아스팔트와 콘크리트로 바뀌고 녹지가 줄어 냉각 효과가 감소하면서 열이 쌓인다." },
    { id: "c3", text: "주요 원인은 건축 자재의 열 흡수, 인공 열 배출, 고층 건물 밀집에 따른 복사열 가둠 현상이다." },
    { id: "c4", text: "도시 열섬은 온열 질환 증가, 열대야로 인한 수면 장애, 만성 피로 누적 등 건강 피해를 초래한다." },
    { id: "c5", text: "냉방 수요 급증은 전력 소비를 늘리고 온실가스 배출을 증가시켜 지구 온난화를 가속화하는 악순환을 만든다." },
    { id: "c6", text: "완화 대책으로 공원과 가로수 등 녹지를 확충하여 식물의 증산 작용으로 기온을 낮추는 방법이 있다." },
    { id: "c7", text: "옥상 녹화, 벽면 녹화, 투수성 포장재, 쿨 루프 기술 등 건축 소재 개선도 추진되고 있다." },
    { id: "c8", text: "다양한 대책이 결합되어야 도시의 열 환경을 근본적으로 개선할 수 있다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// === 확인 문항 (8문항) ===
const confirm = {
  questions: [
    {
      id: "q1", prompt: "도시의 기온이 교외보다 높아지는 현상을 무엇이라 하나요?",
      answerText: "도시 열섬", answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "도시 열섬이란")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q2", prompt: "아스팔트와 콘크리트가 태양열을 흡수한 뒤 밤에도 쉽게 하지 않는 것은 무엇인가요?",
      answerText: "방출", answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "쉽게 방출하지 않아")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q3", prompt: "고층 건물이 밀집한 도심에서 건물 표면의 열이 다시 다른 건물에 흡수되는 현상을 무엇이라 하나요?",
      answerText: "복사열 가둠 현상", answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "복사열 가둠 현상")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q4", prompt: "폭염으로 인해 증가하는 질환의 종류를 통칭하여 무엇이라 하나요?",
      answerText: "온열 질환", answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "온열 질환")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q5", prompt: "열대야가 길어지면서 질이 떨어지는 것은 무엇인가요?",
      answerText: "수면", answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "수면의 질이 떨어지고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q6", prompt: "녹지를 넓히면 식물의 어떤 작용으로 기온이 낮아지나요?",
      answerText: "증산 작용", answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "증산 작용")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q7", prompt: "아스팔트 대신 빗물이 스며드는 포장재를 무엇이라 하나요?",
      answerText: "투수성 포장재", answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "투수성 포장재")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q8", prompt: "태양열을 반사하여 건물 온도를 낮추는 기술을 무엇이라 하나요?",
      answerText: "쿨 루프", answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "쿨 루프 기술")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    }
  ]
};

const content = {
  contentId: "dr-w1-007",
  contentType: "DAILY_READING",
  version: 1, status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 7 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "WITTGENSTEIN_1",
  schoolGradeRange: { min: 9, max: 10 },
  area: "READING", subArea: "NONFICTION",
  competencies: ["READING"], tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300, assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs: paragraphs.map(p => ({ id: p.id, text: p.text })) },
    intensive: { timeline }, recall, confirm
  }
};

console.log("\n=== 최종 검증 ===");
console.log(`정독: ${timeline.length}, 복기: ${recall.cards.length}, 확인: ${confirm.questions.length}`);
console.log("\n=== answerRanges 검증 ===");
for (const q of confirm.questions) {
  for (const r of q.answerRanges) {
    const para = paragraphs.find(p => p.id === r.paragraphId);
    console.log(`${q.id}: [${r.start},${r.end}] "${para.text.substring(r.start, r.end)}"`);
  }
}

const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1', '007.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\nstatic: ${staticPath}`);

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-wittgenstein1.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[6] = {
  content_type: "DAILY_READING", level_id: "WITTGENSTEIN_1",
  area: "READING", sub_area: "NONFICTION", day_index: 7,
  module_key: "reading_training", schema_version: "1.0", content
};
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log(`배치 업데이트 완료 (items[6])`);
