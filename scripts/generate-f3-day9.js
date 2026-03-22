const fs = require('fs');

// ===== Day 9: NONFICTION (비문학) =====
// 주제: "소리의 속도" - 소리가 전달되는 원리와 매질에 따른 속도 차이

const p1 = "소리는 물체가 떨릴 때 생기는 진동이 주위로 퍼져 나가는 현상이다.북을 치면 북가죽이 빠르게 떨리면서 주변 공기를 밀어내고, 밀려난 공기가 다시 옆 공기를 밀어내는 과정이 끝없이 이어진다.이처럼 공기 알갱이가 앞뒤로 밀고 당기는 움직임이 파도처럼 퍼지는 것을 음파라고 부른다.음파는 눈에 보이지 않지만, 귀의 고막을 진동시켜 우리가 소리로 느끼게 해 준다.중요한 점은 소리가 퍼지려면 반드시 물질이 있어야 한다는 것이다.우주 공간처럼 공기가 거의 없는 진공 상태에서는 아무리 큰 폭발이 일어나도 소리가 전달되지 않는다.이는 음파가 물질의 진동으로만 전달되기 때문이며, 이 물질을 매질이라고 부른다.";

const p2 = "소리가 퍼지는 빠르기는 매질의 종류에 따라 크게 달라진다.섭씨 15도의 공기 속에서 소리는 1초에 약 340미터를 나아가는데, 이것은 1초 만에 학교 운동장 세 바퀴 이상을 달리는 셈이다.같은 온도의 물속에서는 소리가 약 1500미터로 공기보다 네 배 넘게 빠르다.이유는 물 분자가 공기 분자보다 훨씬 촘촘하게 붙어 있어서 진동을 옆으로 넘기는 데 시간이 덜 걸리기 때문이다.쇠나 유리 같은 고체에서는 분자가 더 단단히 연결되어 있어 소리가 5000미터 이상까지 빨라진다.그래서 기찻길에 귀를 대면 공기 속 기적 소리보다 레일을 타고 오는 진동이 먼저 들리는 것이다.";

const p3 = "소리의 속도는 온도에도 영향을 받는다.공기의 온도가 올라가면 공기 분자가 더 활발하게 움직여 진동을 빨리 전달하므로 소리도 빨라진다.반대로 추운 겨울에는 공기 분자의 움직임이 느려져 소리 전달 속도가 줄어든다.이 때문에 같은 거리에서 친구를 부를 때 여름보다 겨울에 소리가 살짝 늦게 도착하지만, 차이가 매우 작아 일상에서 느끼기는 어렵다.번개가 칠 때 빛은 거의 즉시 보이지만 천둥소리는 나중에 들리는데, 이것은 빛의 속도가 소리보다 약 백만 배 빠르기 때문이다.이렇게 소리의 속도를 이해하면 번개가 떨어진 거리를 어림할 수 있으니, 소리 속도는 과학 지식을 넘어 생활 속 안전 정보이기도 하다.";

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
  "첫 문장은 소리가 어떻게 생긴다고 설명하나요?",
  [
    "물체의 진동이 주위로 퍼져 나가는 현상이라고 한다",
    "빛이 반사되어 귀에 닿는 현상이라고 한다",
    "전기가 공기 중을 흐르는 현상이라고 한다",
    "바람이 물체를 밀어내는 현상이라고 한다"
  ], "A");

addStep("p1", p1Sentences[1],
  "북을 쳤을 때 일어나는 과정은 무엇인가요?",
  [
    "북가죽이 떨리면서 공기를 밀어내고 그 과정이 이어진다",
    "북가죽이 빛을 내면서 눈에 보이게 된다",
    "북 안의 물이 튀어 올라 파도를 일으킨다",
    "북가죽이 갈라지면서 바람이 생겨난다"
  ], "A");

addStep("p1", p1Sentences[2],
  "공기 알갱이가 파도처럼 퍼지는 현상을 무엇이라고 부르나요?",
  [
    "음파라고 부른다",
    "광파라고 부른다",
    "열파라고 부른다",
    "전파라고 부른다"
  ], "A");

addStep("p1", p1Sentences[3],
  "음파가 보이지 않는데도 소리를 느낄 수 있는 까닭은 무엇인가요?",
  [
    "귀의 고막을 진동시켜 소리로 느끼게 해 주기 때문이다",
    "눈의 망막을 자극하여 색으로 바꾸어 주기 때문이다",
    "피부를 통해 몸 전체로 전기가 흐르기 때문이다",
    "코를 통해 냄새 신호로 변환되기 때문이다"
  ], "A");

addStep("p1", p1Sentences[4],
  "소리가 퍼지려면 반드시 있어야 하는 것은 무엇인가요?",
  [
    "물질이 있어야 한다",
    "빛이 있어야 한다",
    "전기가 있어야 한다",
    "열이 있어야 한다"
  ], "A");

addStep("p1", p1Sentences[5],
  "우주 공간에서 큰 폭발이 일어나도 소리가 전달되지 않는 까닭은 무엇인가요?",
  [
    "공기가 거의 없는 진공 상태이기 때문이다",
    "우주의 온도가 너무 높기 때문이다",
    "폭발의 크기가 너무 작기 때문이다",
    "우주에는 귀가 있는 생물이 없기 때문이다"
  ], "A");

addStep("p1", p1Sentences[6],
  "소리를 전달해 주는 물질을 무엇이라고 부르나요?",
  [
    "매질이라고 부른다",
    "진공이라고 부른다",
    "음파라고 부른다",
    "고막이라고 부른다"
  ], "A");

// p1 중심내용
addSummary("p1", 0, p1.length,
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "소리는 물질의 진동으로 전달되며, 매질 없이는 퍼질 수 없다",
    "소리는 빛과 함께 전달되므로 어둠 속에서는 들을 수 없다",
    "소리는 물체의 색깔에 따라 높낮이가 달라진다",
    "소리는 진공에서 가장 잘 전달되며 공기는 방해가 된다"
  ], "A");

// === p2 문장별 ===
addStep("p2", p2Sentences[0],
  "소리의 빠르기는 무엇에 따라 크게 달라지나요?",
  [
    "매질의 종류에 따라 달라진다",
    "소리의 높낮이에 따라 달라진다",
    "듣는 사람의 나이에 따라 달라진다",
    "시간대에 따라 달라진다"
  ], "A");

addStep("p2", p2Sentences[1],
  "공기 속에서 소리는 1초에 약 몇 미터를 나아가나요?",
  [
    "약 340미터를 나아간다",
    "약 1500미터를 나아간다",
    "약 5000미터를 나아간다",
    "약 100미터를 나아간다"
  ], "A");

addStep("p2", p2Sentences[2],
  "물속에서 소리가 공기보다 빠른 정도는 어떠한가요?",
  [
    "약 1500미터로 공기보다 네 배 넘게 빠르다",
    "약 340미터로 공기와 거의 같다",
    "공기보다 느려서 거의 들리지 않는다",
    "약 100미터로 공기보다 세 배 느리다"
  ], "A");

addStep("p2", p2Sentences[3],
  "물속에서 소리가 더 빠른 까닭은 무엇인가요?",
  [
    "물 분자가 촘촘하게 붙어 있어 진동을 빨리 넘기기 때문이다",
    "물이 공기보다 가벼워서 진동이 쉽게 퍼지기 때문이다",
    "물에는 소리를 증폭시키는 특별한 성분이 있기 때문이다",
    "물의 온도가 항상 공기보다 높기 때문이다"
  ], "A");

addStep("p2", p2Sentences[4],
  "고체에서 소리의 속도는 어느 정도인가요?",
  [
    "5000미터 이상까지 빨라진다",
    "340미터 정도로 공기와 같다",
    "100미터 이하로 매우 느려진다",
    "물속과 같은 1500미터이다"
  ], "A");

addStep("p2", p2Sentences[5],
  "기찻길에 귀를 대면 왜 진동이 먼저 들리나요?",
  [
    "레일이 고체라서 공기보다 소리가 빠르게 전달되기 때문이다",
    "기찻길이 소리를 크게 증폭시키기 때문이다",
    "귀를 대면 고막이 더 예민해지기 때문이다",
    "기찻길에서 전기 신호가 나오기 때문이다"
  ], "A");

// p2 중심내용
addSummary("p2", 0, p2.length,
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "매질이 촘촘할수록 소리는 더 빨리 전달된다",
    "소리는 모든 매질에서 똑같은 속도로 전달된다",
    "고체보다 기체에서 소리가 더 빨리 전달된다",
    "물속에서는 소리가 전달되지 않는다"
  ], "A");

// === p3 문장별 ===
addStep("p3", p3Sentences[0],
  "소리의 속도에 영향을 주는 또 다른 요인은 무엇인가요?",
  [
    "온도에도 영향을 받는다",
    "색깔에도 영향을 받는다",
    "무게에도 영향을 받는다",
    "모양에도 영향을 받는다"
  ], "A");

addStep("p3", p3Sentences[1],
  "온도가 올라가면 소리가 빨라지는 까닭은 무엇인가요?",
  [
    "공기 분자가 더 활발하게 움직여 진동을 빨리 전달하기 때문이다",
    "뜨거운 공기가 위로 올라가 소리가 직선으로 가기 때문이다",
    "높은 온도에서 소리가 빛으로 바뀌기 때문이다",
    "온도가 높으면 귀가 더 예민해지기 때문이다"
  ], "A");

addStep("p3", p3Sentences[2],
  "추운 겨울에는 소리 전달이 어떻게 변하나요?",
  [
    "공기 분자의 움직임이 느려져 소리 전달 속도가 줄어든다",
    "공기가 얼어붙어 소리가 완전히 사라진다",
    "추위 때문에 소리가 오히려 더 빨라진다",
    "겨울에는 소리가 전혀 나지 않게 된다"
  ], "A");

addStep("p3", p3Sentences[3],
  "여름과 겨울의 소리 속도 차이를 왜 느끼기 어려운가요?",
  [
    "차이가 매우 작아 일상에서 느끼기 어렵기 때문이다",
    "사람의 귀가 계절에 따라 닫히기 때문이다",
    "겨울에는 밖에 나가지 않기 때문이다",
    "소리 속도가 계절과 전혀 관계없기 때문이다"
  ], "A");

addStep("p3", p3Sentences[4],
  "번개가 칠 때 천둥소리가 나중에 들리는 까닭은 무엇인가요?",
  [
    "빛의 속도가 소리보다 약 백만 배 빠르기 때문이다",
    "천둥이 번개보다 나중에 만들어지기 때문이다",
    "소리가 빛보다 높은 곳에서 출발하기 때문이다",
    "번개가 소리를 잠시 멈추게 하기 때문이다"
  ], "A");

addStep("p3", p3Sentences[5],
  "소리 속도 이해가 생활에 어떤 도움을 주나요?",
  [
    "번개가 떨어진 거리를 어림하여 안전 정보로 쓸 수 있다",
    "비가 올 시간을 정확하게 예측할 수 있다",
    "바람의 방향을 눈으로 확인할 수 있다",
    "날씨의 온도를 귀로 측정할 수 있다"
  ], "A");

// p3 중심내용
addSummary("p3", 0, p3.length,
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "소리 속도는 온도에 따라 변하며, 이를 알면 생활 속에서도 활용할 수 있다",
    "소리 속도는 온도와 관계없이 항상 일정하다",
    "번개와 천둥은 항상 동시에 발생한다",
    "겨울에 소리가 더 빨라지므로 통화 품질이 좋아진다"
  ], "A");

// 복기 8카드
const recall = {
  cards: [
    { id: "c1", text: "소리는 물체의 진동이 주위 공기를 밀어내며 퍼져 나가는 현상이다." },
    { id: "c2", text: "공기 알갱이가 파도처럼 퍼지는 것을 음파라 하며, 이것이 고막을 진동시켜 소리로 느끼게 한다." },
    { id: "c3", text: "소리가 전달되려면 매질이 필요하며, 진공 상태에서는 소리가 퍼지지 않는다." },
    { id: "c4", text: "공기 속에서 소리는 1초에 약 340미터를 나아가고, 물속에서는 약 1500미터로 더 빠르다." },
    { id: "c5", text: "분자가 촘촘할수록 진동을 빨리 넘기므로, 고체에서 소리가 가장 빠르다." },
    { id: "c6", text: "온도가 올라가면 공기 분자가 활발해져 소리도 빨라지고, 추우면 느려진다." },
    { id: "c7", text: "빛의 속도가 소리보다 약 백만 배 빠르므로, 번개가 보인 뒤 천둥이 들린다." },
    { id: "c8", text: "소리 속도를 알면 번개까지의 거리를 어림할 수 있어 생활 속 안전 정보가 된다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// 확인학습 7문항
const confirmQuestions = [
  {
    id: "q1",
    prompt: "물체가 떨릴 때 공기 알갱이가 파도처럼 퍼지는 것을 무엇이라 부르나요?",
    answerText: "음파",
    answerMatchMode: "ANY"
  },
  {
    id: "q2",
    prompt: "소리를 전달해 주는 물질을 무엇이라 부르나요?",
    answerText: "매질",
    answerMatchMode: "ANY"
  },
  {
    id: "q3",
    prompt: "섭씨 15도의 공기 속에서 소리가 1초에 나아가는 거리는 약 몇 미터인가요?",
    answerText: "340미터",
    answerMatchMode: "ANY"
  },
  {
    id: "q4",
    prompt: "물속에서 소리가 공기보다 빠른 까닭은 무엇인가요?",
    answerText: "물 분자가 공기 분자보다 훨씬 촘촘하게 붙어 있어서",
    answerMatchMode: "ANY"
  },
  {
    id: "q5",
    prompt: "온도가 올라가면 소리가 빨라지는 까닭은 무엇인가요?",
    answerText: "공기 분자가 더 활발하게 움직여",
    answerMatchMode: "ANY"
  },
  {
    id: "q6",
    prompt: "빛의 속도가 소리보다 몇 배 정도 빠르다고 했나요?",
    answerText: "약 백만 배",
    answerMatchMode: "ANY"
  },
  {
    id: "q7",
    prompt: "소리 속도 지식이 생활에서 어떤 정보로 쓸 수 있다고 했나요?",
    answerText: "안전 정보",
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
  contentId: "dr-f3-009",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(프레게 3) Day 9 비문학",
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

fs.writeFileSync('frontend/public/daily-reading/frege3/009.json', json, 'utf8');
console.log("\n009.json 저장 완료");

const batchPath = 'generated/daily-batch-reading-frege3.json';
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[8] = {
  content_type: "DAILY_READING",
  level_id: "FREGE_3",
  area: "READING",
  sub_area: "NONFICTION",
  day_index: 9,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log("배치 파일 items[8] 업데이트 완료");
