const fs = require('fs');

// ===== Day 11: NONFICTION (비문학) =====
// 주제: "색이 보이는 원리" - 빛과 색의 관계, 물체의 색이 보이는 과학적 원리

const p1 = "우리 눈에 보이는 세상은 온갖 색으로 가득하지만, 사실 색이란 물체 자체에 붙어 있는 성질이 아니다.색은 빛이 물체에 닿은 뒤 반사되어 눈에 들어올 때 비로소 느껴지는 감각이다.태양이나 전등에서 나오는 하얀 빛은 사실 여러 색의 빛이 섞여 있는데, 프리즘이라는 유리 삼각기둥에 통과시키면 빨강에서 보라까지 무지개 순서로 나뉜다.이렇게 나뉜 각각의 빛을 단색광이라 하며, 눈에 보이는 빛 전체를 가시광선이라고 부른다.가시광선 바깥에도 자외선이나 적외선 같은 빛이 있지만, 사람의 눈으로는 감지할 수 없다.결국 우리가 색을 느끼는 것은 빛 가운데 눈이 받아들일 수 있는 좁은 범위의 파장 덕분인 셈이다.";

const p2 = "물체가 특정한 색으로 보이는 까닭은 빛의 흡수와 반사에 있다.예를 들어 사과가 빨갛게 보이는 이유는, 하얀 빛 속의 여러 색 가운데 빨강 빛만 반사하고 나머지 색 빛은 흡수하기 때문이다.초록 잎사귀는 초록 빛만 반사하고 다른 빛은 흡수하므로 우리 눈에 초록으로 보인다.검은 물체는 모든 색의 빛을 흡수하여 반사되는 빛이 거의 없기 때문에 어둡게 보이고, 반대로 하얀 물체는 모든 색의 빛을 고루 반사하므로 밝게 보인다.이처럼 물체의 표면이 어떤 빛을 반사하느냐에 따라 우리가 느끼는 색이 달라지는 것이다.어두운 방에서 물체에 색이 보이지 않는 까닭도 빛이 없으면 반사할 빛 자체가 사라지기 때문이다.";

const p3 = "색을 느끼는 마지막 단계는 눈과 뇌의 협력이다.눈의 망막에는 빛을 감지하는 세포가 있는데, 그중 원추세포는 빨강, 초록, 파랑 세 종류의 빛에 각각 반응한다.이 세 가지 신호가 뇌에 전달되면 뇌가 이를 합쳐서 수천 가지 색을 만들어 낸다.예를 들어 빨강 원추세포와 초록 원추세포가 함께 반응하면 뇌는 노란색으로 인식한다.색맹은 원추세포 가운데 일부가 제대로 작동하지 않아 특정 색을 구별하기 어려운 상태를 말한다.이처럼 색은 빛, 물체, 그리고 눈과 뇌가 함께 만들어 내는 복합적인 현상이며, 그 어느 하나라도 빠지면 우리가 아는 색의 세계는 완성되지 않는다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 }
];

const totalLen = p1.length + p2.length + p3.length;
console.log(`p1: ${p1.length}자, p2: ${p2.length}자, p3: ${p3.length}자, 총: ${totalLen}자`);

function sentenceRanges(text) {
  const ranges = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] !== '.')) {
      ranges.push([start, i + 1]);
      start = i + 1;
    }
  }
  if (start < text.length) ranges.push([start, text.length]);
  return ranges;
}

const p1Sentences = sentenceRanges(p1);
const p2Sentences = sentenceRanges(p2);
const p3Sentences = sentenceRanges(p3);

console.log("p1 문장수:", p1Sentences.length, p1Sentences.map(r => `[${r[0]},${r[1]}]`));
console.log("p2 문장수:", p2Sentences.length, p2Sentences.map(r => `[${r[0]},${r[1]}]`));
console.log("p3 문장수:", p3Sentences.length, p3Sentences.map(r => `[${r[0]},${r[1]}]`));

let stepCount = 0;
const timeline = [];

function addStep(pId, range, prompt, choices, answerId) {
  stepCount++;
  timeline.push({
    stepId: `s${stepCount}`,
    highlight: { ranges: [{ paragraphId: pId, start: range[0], end: range[1] }] },
    question: {
      prompt,
      choices: choices.map((t, i) => ({ id: ["A","B","C","D"][i], text: t })),
      answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

function addSummary(pId, start, end, prompt, choices, answerId) {
  stepCount++;
  timeline.push({
    stepId: `s${stepCount}`,
    highlight: { ranges: [{ paragraphId: pId, start, end }] },
    question: {
      prompt,
      choices: choices.map((t, i) => ({ id: ["A","B","C","D"][i], text: t })),
      answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

// === p1 문장별 ===
addStep("p1", p1Sentences[0],
  "첫 문장은 색에 대해 어떤 사실을 알려 주나요?",
  [
    "색은 물체 자체에 붙어 있는 성질이 아니라고 한다",
    "색은 물체가 스스로 만들어 내는 성질이라고 한다",
    "세상에는 색이 있는 물체와 없는 물체만 있다고 한다",
    "색은 물체의 크기에 따라 달라진다고 한다"
  ], "A");

addStep("p1", p1Sentences[1],
  "색은 언제 비로소 느껴진다고 하나요?",
  [
    "빛이 물체에서 반사되어 눈에 들어올 때 느껴진다",
    "물체를 손으로 만질 때 비로소 느껴진다",
    "물체의 표면이 뜨거워질 때 느껴진다",
    "공기가 물체를 감싸고 있을 때 느껴진다"
  ], "A");

addStep("p1", p1Sentences[2],
  "하얀 빛을 프리즘에 통과시키면 어떤 일이 일어나나요?",
  [
    "빨강에서 보라까지 무지개 순서로 나뉜다",
    "빛이 모두 사라져 어두워진다",
    "하나의 색으로 더 밝아진다",
    "소리로 변하여 귀에 들린다"
  ], "A");

addStep("p1", p1Sentences[3],
  "단색광과 가시광선은 각각 무엇인가요?",
  [
    "나뉜 빛 하나하나가 단색광이고, 보이는 빛 전체가 가시광선이다",
    "단색광은 눈에 보이지 않는 빛이고, 가시광선은 어두운 빛이다",
    "단색광은 소리이고, 가시광선은 열이다",
    "단색광은 색이 없는 빛이고, 가시광선은 불꽃이다"
  ], "A");

addStep("p1", p1Sentences[4],
  "가시광선 바깥에는 어떤 빛이 있나요?",
  [
    "자외선이나 적외선 같은 빛이 있지만 눈으로 감지할 수 없다",
    "무지개색보다 더 선명한 빛이 있어 쉽게 볼 수 있다",
    "소리를 내는 빛이 있어 귀로 들을 수 있다",
    "냄새를 풍기는 빛이 있어 코로 맡을 수 있다"
  ], "A");

addStep("p1", p1Sentences[5],
  "우리가 색을 느끼는 것은 무엇 덕분인가요?",
  [
    "눈이 받아들일 수 있는 좁은 범위의 파장 덕분이다",
    "물체가 스스로 색을 만들어 내는 능력 덕분이다",
    "공기가 빛을 모두 흡수하는 성질 덕분이다",
    "눈이 모든 종류의 빛을 볼 수 있는 능력 덕분이다"
  ], "A");

// p1 중심내용
addSummary("p1", 0, p1.length,
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "색은 물체의 성질이 아니라 빛이 반사되어 눈에 들어올 때 느끼는 감각이다",
    "색은 프리즘 없이는 절대로 볼 수 없다",
    "하얀 빛은 색이 전혀 섞여 있지 않은 순수한 빛이다",
    "가시광선 바깥의 빛이 색을 만들어 낸다"
  ], "A");

// === p2 문장별 ===
addStep("p2", p2Sentences[0],
  "물체가 특정한 색으로 보이는 까닭은 무엇에 있나요?",
  [
    "빛의 흡수와 반사에 있다",
    "물체의 크기와 무게에 있다",
    "물체의 온도와 단단함에 있다",
    "물체가 내는 소리에 있다"
  ], "A");

addStep("p2", p2Sentences[1],
  "사과가 빨갛게 보이는 이유는 무엇인가요?",
  [
    "빨강 빛만 반사하고 나머지 색 빛은 흡수하기 때문이다",
    "사과 자체가 빨간 물질로 이루어져 있기 때문이다",
    "사과가 빨간 빛을 스스로 만들어 내기 때문이다",
    "모든 빛을 흡수하여 빨갛게 뜨거워지기 때문이다"
  ], "A");

addStep("p2", p2Sentences[2],
  "초록 잎사귀가 초록으로 보이는 원리는 무엇인가요?",
  [
    "초록 빛만 반사하고 다른 빛은 흡수하기 때문이다",
    "잎사귀가 초록 물감을 품고 있기 때문이다",
    "잎사귀가 모든 빛을 골고루 반사하기 때문이다",
    "햇빛이 잎사귀를 통과하면서 초록으로 바뀌기 때문이다"
  ], "A");

addStep("p2", p2Sentences[3],
  "검은 물체와 하얀 물체가 다르게 보이는 까닭은 무엇인가요?",
  [
    "검은 물체는 모든 빛을 흡수하고, 하얀 물체는 모든 빛을 반사하기 때문이다",
    "검은 물체는 빛을 내뿜고, 하얀 물체는 빛을 숨기기 때문이다",
    "검은 물체만 빛을 반사하고, 하얀 물체는 흡수하기 때문이다",
    "둘 다 같은 양의 빛을 반사하지만 눈이 다르게 느끼기 때문이다"
  ], "A");

addStep("p2", p2Sentences[4],
  "물체의 색이 달라지는 핵심 요인은 무엇인가요?",
  [
    "표면이 어떤 빛을 반사하느냐에 따라 색이 달라진다",
    "물체의 무게에 따라 색이 달라진다",
    "물체가 놓인 장소에 따라 색이 달라진다",
    "물체를 누가 보느냐에 따라 항상 색이 달라진다"
  ], "A");

addStep("p2", p2Sentences[5],
  "어두운 방에서 물체의 색이 보이지 않는 까닭은 무엇인가요?",
  [
    "빛이 없으면 반사할 빛 자체가 사라지기 때문이다",
    "어두운 방에서는 물체가 투명해지기 때문이다",
    "눈이 어둠 속에서는 완전히 닫히기 때문이다",
    "물체가 어둠을 흡수하여 색을 잃기 때문이다"
  ], "A");

// p2 중심내용
addSummary("p2", 0, p2.length,
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "물체가 어떤 빛을 반사하고 흡수하느냐에 따라 보이는 색이 결정된다",
    "모든 물체는 같은 양의 빛을 반사하므로 색이 같다",
    "검은 물체만이 빛을 반사할 수 있다",
    "어두운 곳에서도 물체의 색은 변하지 않는다"
  ], "A");

// === p3 문장별 ===
addStep("p3", p3Sentences[0],
  "색을 느끼는 마지막 단계에 관여하는 것은 무엇인가요?",
  [
    "눈과 뇌의 협력이다",
    "손과 피부의 감각이다",
    "코와 혀의 감지이다",
    "귀와 목의 진동이다"
  ], "A");

addStep("p3", p3Sentences[1],
  "원추세포는 어떤 세 종류의 빛에 각각 반응하나요?",
  [
    "빨강, 초록, 파랑 세 종류의 빛에 반응한다",
    "노랑, 보라, 하양 세 종류의 빛에 반응한다",
    "검정, 회색, 흰색 세 종류의 빛에 반응한다",
    "주황, 남색, 갈색 세 종류의 빛에 반응한다"
  ], "A");

addStep("p3", p3Sentences[2],
  "뇌는 세 가지 신호를 받아 무엇을 해 내나요?",
  [
    "이를 합쳐서 수천 가지 색을 만들어 낸다",
    "하나의 색만 골라서 기억에 저장한다",
    "빛의 밝기만 판단하고 색은 무시한다",
    "소리로 변환하여 귀에 전달한다"
  ], "A");

addStep("p3", p3Sentences[3],
  "빨강과 초록 원추세포가 함께 반응하면 뇌는 무슨 색으로 인식하나요?",
  [
    "노란색으로 인식한다",
    "하얀색으로 인식한다",
    "검은색으로 인식한다",
    "파란색으로 인식한다"
  ], "A");

addStep("p3", p3Sentences[4],
  "색맹이란 어떤 상태를 말하나요?",
  [
    "원추세포 일부가 제대로 작동하지 않아 특정 색을 구별하기 어려운 상태이다",
    "눈의 모든 세포가 빛을 감지하지 못하는 상태이다",
    "뇌가 색 신호를 소리로 바꾸는 상태이다",
    "눈이 너무 밝은 빛에 손상된 상태이다"
  ], "A");

addStep("p3", p3Sentences[5],
  "마지막 문장에서 색이 완성되려면 무엇이 모두 필요하다고 하나요?",
  [
    "빛, 물체, 그리고 눈과 뇌가 함께 필요하다",
    "프리즘과 거울만 있으면 충분하다",
    "눈만 건강하면 다른 것은 필요 없다",
    "밝은 빛 하나만 있으면 색이 완성된다"
  ], "A");

// p3 중심내용
addSummary("p3", 0, p3.length,
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "눈의 원추세포와 뇌의 협력으로 다양한 색을 인식하며, 어느 하나라도 빠지면 색을 느낄 수 없다",
    "원추세포는 오직 한 가지 색만 감지할 수 있다",
    "뇌는 색을 인식하는 데 전혀 관여하지 않는다",
    "색맹인 사람은 모든 빛을 볼 수 없다"
  ], "A");

// 복기 8카드
const recall = {
  cards: [
    { id: "c1", text: "색은 물체의 성질이 아니라 빛이 반사되어 눈에 들어올 때 느끼는 감각이다." },
    { id: "c2", text: "하얀 빛을 프리즘에 통과시키면 무지개 순서의 단색광으로 나뉘며, 보이는 빛을 가시광선이라 한다." },
    { id: "c3", text: "물체는 특정 색의 빛만 반사하고 나머지를 흡수하므로, 반사된 빛의 색이 우리 눈에 보인다." },
    { id: "c4", text: "검은 물체는 모든 빛을 흡수하고, 하얀 물체는 모든 빛을 반사한다." },
    { id: "c5", text: "어두운 곳에서 색이 보이지 않는 까닭은 반사할 빛 자체가 없기 때문이다." },
    { id: "c6", text: "눈의 원추세포는 빨강, 초록, 파랑 세 종류의 빛에 각각 반응한다." },
    { id: "c7", text: "세 종류의 신호를 뇌가 합쳐 수천 가지 색을 만들어 낸다." },
    { id: "c8", text: "색은 빛, 물체, 눈과 뇌가 모두 협력해야 완성되는 복합적인 현상이다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// 확인학습 7문항
const confirmQuestions = [
  {
    id: "q1",
    prompt: "하얀 빛을 무지개색으로 나누는 도구를 무엇이라 하나요?",
    answerText: "프리즘",
    answerMatchMode: "ANY"
  },
  {
    id: "q2",
    prompt: "눈에 보이는 빛 전체를 가리키는 말은 무엇인가요?",
    answerText: "가시광선",
    answerMatchMode: "ANY"
  },
  {
    id: "q3",
    prompt: "사과가 빨갛게 보이는 까닭은 어떤 빛만 반사하기 때문인가요?",
    answerText: "빨강 빛",
    answerMatchMode: "ANY"
  },
  {
    id: "q4",
    prompt: "모든 빛을 흡수하여 어둡게 보이는 물체는 무슨 색인가요?",
    answerText: "검은 물체",
    answerMatchMode: "ANY"
  },
  {
    id: "q5",
    prompt: "빛을 감지하는 눈의 세포 가운데 색에 반응하는 것은 무엇인가요?",
    answerText: "원추세포",
    answerMatchMode: "ANY"
  },
  {
    id: "q6",
    prompt: "빨강과 초록 원추세포가 함께 반응하면 뇌가 인식하는 색은 무엇인가요?",
    answerText: "노란색",
    answerMatchMode: "ANY"
  },
  {
    id: "q7",
    prompt: "원추세포 일부가 제대로 작동하지 않아 특정 색을 구별하기 어려운 상태를 무엇이라 하나요?",
    answerText: "색맹",
    answerMatchMode: "ANY"
  }
];

// answerRanges 계산
for (const q of confirmQuestions) {
  for (const p of paragraphs) {
    const idx = p.text.indexOf(q.answerText);
    if (idx !== -1) {
      q.answerRanges = [{ paragraphId: p.id, start: idx, end: idx + q.answerText.length }];
      break;
    }
  }
  if (!q.answerRanges) {
    console.error(`답 "${q.answerText}"을(를) 지문에서 찾을 수 없습니다!`);
  }
}

const confirm = {
  questions: confirmQuestions.map(q => ({
    id: q.id,
    prompt: q.prompt,
    answerText: q.answerText,
    answerMatchMode: q.answerMatchMode,
    answerRanges: q.answerRanges,
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  }))
};

const content = {
  contentId: "dr-f3-011",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(프레게 3) Day 11 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "FREGE_3",
  schoolGradeRange: { min: 6, max: 7 },
  area: "READING",
  subArea: "NONFICTION",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300,
  assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall,
    confirm
  }
};

// 검증
const json = JSON.stringify(content, null, 2);
const parsed = JSON.parse(json);
console.log("\n=== 검증 결과 ===");
console.log("JSON 파싱: OK");
console.log(`지문 총 길이: ${totalLen}자 (950~1050 범위: ${totalLen >= 950 && totalLen <= 1050 ? 'OK' : 'FAIL'})`);
console.log(`복기 카드 수: ${parsed.payload.recall.cards.length} (8: ${parsed.payload.recall.cards.length === 8 ? 'OK' : 'FAIL'})`);
console.log(`확인 문항 수: ${parsed.payload.confirm.questions.length} (5~10: ${parsed.payload.confirm.questions.length >= 5 && parsed.payload.confirm.questions.length <= 10 ? 'OK' : 'FAIL'})`);
console.log(`정독 step 수: ${parsed.payload.intensive.timeline.length}`);

let rangeValid = true;
for (const step of parsed.payload.intensive.timeline) {
  for (const r of step.highlight.ranges) {
    const p = paragraphs.find(pp => pp.id === r.paragraphId);
    if (!p) { console.error(`문단 ${r.paragraphId} 없음`); rangeValid = false; continue; }
    if (r.start < 0 || r.end > p.text.length || r.start >= r.end) {
      console.error(`범위 오류: ${r.paragraphId} [${r.start}, ${r.end}] (문단 길이: ${p.text.length})`);
      rangeValid = false;
    }
  }
}
console.log(`ranges 유효성: ${rangeValid ? 'OK' : 'FAIL'}`);

let answerRangeValid = true;
for (const q of parsed.payload.confirm.questions) {
  if (!q.answerRanges || q.answerRanges.length === 0) {
    console.error(`확인 ${q.id}: answerRanges 없음`);
    answerRangeValid = false;
    continue;
  }
  for (const r of q.answerRanges) {
    const p = paragraphs.find(pp => pp.id === r.paragraphId);
    if (!p) { console.error(`확인 ${q.id}: 문단 ${r.paragraphId} 없음`); answerRangeValid = false; continue; }
    const extracted = p.text.substring(r.start, r.end);
    if (extracted !== q.answerText) {
      console.error(`확인 ${q.id}: 추출 "${extracted}" !== 답 "${q.answerText}"`);
      answerRangeValid = false;
    }
  }
}
console.log(`answerRanges 일치: ${answerRangeValid ? 'OK' : 'FAIL'}`);

fs.writeFileSync('frontend/public/daily-reading/frege3/011.json', json, 'utf8');
console.log("\n011.json 저장 완료");

const batchPath = 'generated/daily-batch-reading-frege3.json';
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[10] = {
  content_type: "DAILY_READING",
  level_id: "FREGE_3",
  area: "READING",
  sub_area: "NONFICTION",
  day_index: 11,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log("배치 파일 items[10] 업데이트 완료");
