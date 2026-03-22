// Day 19 - 비문학 (NONFICTION)
// 중2~3 수준, 1100자 ±50 목표

const fs = require('fs');
const path = require('path');

// ── 지문 (확장) ──
const p1 = `우리가 생활 속에서 흔히 사용하는 플라스틱은 가볍고 튼튼하며 값이 싸다는 장점 덕분에 20세기 이후 폭발적으로 생산량이 늘어났다. 음료수 병, 포장 용기, 장난감, 가전제품의 외장재까지 플라스틱이 쓰이지 않는 곳을 찾기 어려울 정도이다. 이처럼 우리 일상 깊숙이 자리 잡은 플라스틱이 자연환경에 심각한 피해를 주고 있다는 사실이 점점 분명해지고 있다. 플라스틱은 자연 상태에서 완전히 분해되기까지 수백 년이 걸리며, 그 긴 시간 동안 땅속에 스며들거나 강과 바다를 오염시킨다. 특히 바다로 흘러든 플라스틱 쓰레기는 해류를 따라 지구 곳곳으로 퍼져 나가며, 바다거북이나 고래 같은 해양 동물이 먹이로 착각하여 삼키는 등 해양 생태계를 심각하게 위협하고 있다.`;

const p2 = `최근 과학자들이 특히 주목하는 문제는 미세 플라스틱이다. 미세 플라스틱이란 크기가 5밀리미터 이하인 아주 작은 플라스틱 조각을 말한다. 커다란 플라스틱 쓰레기가 자외선과 파도의 작용으로 오랜 시간에 걸쳐 잘게 부서지면서 만들어지기도 하고, 세안제나 치약에 포함된 미세한 알갱이가 하수를 통해 바다로 유입되기도 한다. 이렇게 작아진 플라스틱은 바다 속 작은 생물인 플랑크톤이 먹이로 착각하여 삼키게 되고, 이를 먹은 작은 물고기는 다시 큰 물고기의 먹이가 된다. 이러한 먹이 사슬을 따라 미세 플라스틱은 점점 상위 포식자에게 축적되며, 궁극적으로 해산물을 즐겨 먹는 인간의 식탁에까지 올라올 수 있다는 점에서 큰 우려를 낳고 있다.`;

const p3 = `이 문제를 해결하기 위해 세계 각국은 다양한 노력을 기울이고 있다. 일회용 플라스틱 사용을 줄이기 위한 법률을 제정하는 나라가 늘어나고 있으며, 기업들도 재활용이 쉬운 소재나 생분해성 플라스틱을 개발하는 데 힘을 쏟고 있다. 생분해성 플라스틱은 옥수수 전분이나 사탕수수 같은 식물 원료로 만들어져 자연에서 비교적 빠르게 분해될 수 있다. 다만 생분해성 플라스틱이 모든 환경에서 완벽하게 분해되는 것은 아니며, 일정한 온도와 습도 조건이 갖추어져야 한다는 한계도 존재한다. 결국 플라스틱 문제를 근본적으로 줄이려면 기술 개발과 함께 소비자 개개인이 일회용 제품 사용을 의식적으로 줄이려는 노력이 반드시 뒷받침되어야 한다.`;

const totalLen = p1.length + p2.length + p3.length;
console.log(`지문 총 길이: ${totalLen}자 (p1=${p1.length}, p2=${p2.length}, p3=${p3.length})`);

// ── ranges 계산 헬퍼 ──
function r(text, sub) {
  const start = text.indexOf(sub);
  if (start === -1) throw new Error(`"${sub}" not found in text`);
  return { start, end: start + sub.length };
}

// ── 정독(intensive) 타임라인 ──
const p1Segs = [
  { sub: `우리가 생활 속에서 흔히 사용하는 플라스틱은 가볍고 튼튼하며 값이 싸다는 장점 덕분에 20세기 이후 폭발적으로 생산량이 늘어났다.`, q: `플라스틱의 생산량이 크게 늘어난 이유로 알맞은 것은 무엇인가요?`, choices: [
    { id: "A", text: "가볍고 튼튼하며 값이 싸다는 장점 때문이다." },
    { id: "B", text: "자연환경에 전혀 해를 끼치지 않기 때문이다." },
    { id: "C", text: "다른 소재보다 분해 속도가 빠르기 때문이다." },
    { id: "D", text: "정부에서 플라스틱만 사용하도록 법으로 정했기 때문이다." },
  ], ans: "A" },
  { sub: `음료수 병, 포장 용기, 장난감, 가전제품의 외장재까지 플라스틱이 쓰이지 않는 곳을 찾기 어려울 정도이다.`, q: `플라스틱의 사용 범위에 대한 설명으로 알맞은 것은 무엇인가요?`, choices: [
    { id: "A", text: "음료수 병부터 가전제품 외장재까지 쓰이지 않는 곳이 거의 없다." },
    { id: "B", text: "음료수 병에만 제한적으로 사용된다." },
    { id: "C", text: "가전제품에는 전혀 사용되지 않는다." },
    { id: "D", text: "최근에는 사용 범위가 크게 줄어들었다." },
  ], ans: "A" },
  { sub: `플라스틱은 자연 상태에서 완전히 분해되기까지 수백 년이 걸리며, 그 긴 시간 동안 땅속에 스며들거나 강과 바다를 오염시킨다.`, q: `플라스틱이 환경에 미치는 피해로 알맞은 것은 무엇인가요?`, choices: [
    { id: "A", text: "분해에 수백 년이 걸리며 땅과 바다를 오염시킨다." },
    { id: "B", text: "분해 과정에서 좋은 영양분을 땅에 공급한다." },
    { id: "C", text: "몇 주 안에 자연 분해되어 문제가 없다." },
    { id: "D", text: "바다에서는 빠르게 녹아 사라진다." },
  ], ans: "A" },
  { sub: `특히 바다로 흘러든 플라스틱 쓰레기는 해류를 따라 지구 곳곳으로 퍼져 나가며, 바다거북이나 고래 같은 해양 동물이 먹이로 착각하여 삼키는 등 해양 생태계를 심각하게 위협하고 있다.`, q: `바다의 플라스틱 쓰레기가 일으키는 구체적 피해로 알맞은 것은 무엇인가요?`, choices: [
    { id: "A", text: "바다거북이나 고래 같은 해양 동물이 먹이로 착각하여 삼킨다." },
    { id: "B", text: "해류가 멈추어 바다가 고여 버린다." },
    { id: "C", text: "바닷물의 온도가 급격히 올라간다." },
    { id: "D", text: "해양 동물의 먹이가 늘어나 개체 수가 증가한다." },
  ], ans: "A" },
];

const p1Summary = { q: `첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?`, choices: [
  { id: "A", text: "플라스틱은 편리하지만 분해가 매우 느려 자연환경과 해양 생태계에 심각한 오염을 일으킨다." },
  { id: "B", text: "플라스틱은 값이 비싸서 점점 사용량이 줄어들고 있다." },
  { id: "C", text: "플라스틱은 자연에서 빠르게 분해되므로 환경 문제가 없다." },
  { id: "D", text: "플라스틱의 단점보다 장점이 훨씬 크기 때문에 계속 사용해야 한다." },
], ans: "A" };

const p2Segs = [
  { sub: `미세 플라스틱이란 크기가 5밀리미터 이하인 아주 작은 플라스틱 조각을 말한다.`, q: `미세 플라스틱의 정의로 알맞은 것은 무엇인가요?`, choices: [
    { id: "A", text: "크기가 5밀리미터 이하인 아주 작은 플라스틱 조각이다." },
    { id: "B", text: "눈에 보이지 않을 만큼 작은 금속 조각이다." },
    { id: "C", text: "크기가 5센티미터 이상인 플라스틱 덩어리이다." },
    { id: "D", text: "물에 완전히 녹는 특수 화학 물질이다." },
  ], ans: "A" },
  { sub: `커다란 플라스틱 쓰레기가 자외선과 파도의 작용으로 오랜 시간에 걸쳐 잘게 부서지면서 만들어지기도 하고, 세안제나 치약에 포함된 미세한 알갱이가 하수를 통해 바다로 유입되기도 한다.`, q: `미세 플라스틱이 만들어지는 경로로 알맞은 것은 무엇인가요?`, choices: [
    { id: "A", text: "큰 플라스틱이 자외선·파도로 부서지거나 세안제·치약의 알갱이가 하수로 유입된다." },
    { id: "B", text: "공장에서 의도적으로 작게 만들어 바다에 버린다." },
    { id: "C", text: "바닷물이 플라스틱을 녹여 작게 만든다." },
    { id: "D", text: "물고기가 플라스틱을 잘게 씹어서 만들어진다." },
  ], ans: "A" },
  { sub: `이렇게 작아진 플라스틱은 바다 속 작은 생물인 플랑크톤이 먹이로 착각하여 삼키게 되고, 이를 먹은 작은 물고기는 다시 큰 물고기의 먹이가 된다.`, q: `미세 플라스틱이 해양 생물에 전달되는 과정으로 알맞은 것은 무엇인가요?`, choices: [
    { id: "A", text: "플랑크톤이 삼키고, 이를 먹은 작은 물고기를 큰 물고기가 먹는다." },
    { id: "B", text: "큰 물고기가 직접 바다 위의 플라스틱을 먹는다." },
    { id: "C", text: "해조류가 플라스틱을 흡수하여 물고기에게 전달한다." },
    { id: "D", text: "미세 플라스틱은 해양 생물과 접촉하지 않는다." },
  ], ans: "A" },
  { sub: `이러한 먹이 사슬을 따라 미세 플라스틱은 점점 상위 포식자에게 축적되며, 궁극적으로 해산물을 즐겨 먹는 인간의 식탁에까지 올라올 수 있다는 점에서 큰 우려를 낳고 있다.`, q: `미세 플라스틱에 대한 가장 큰 우려로 알맞은 것은 무엇인가요?`, choices: [
    { id: "A", text: "먹이 사슬을 거쳐 궁극적으로 인간의 식탁에 올라올 수 있다는 점이다." },
    { id: "B", text: "바다의 색깔을 변하게 하여 경관을 해친다는 점이다." },
    { id: "C", text: "해양 식물의 광합성을 돕는다는 점이다." },
    { id: "D", text: "물고기의 크기를 더 크게 만든다는 점이다." },
  ], ans: "A" },
];

const p2Summary = { q: `둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?`, choices: [
  { id: "A", text: "미세 플라스틱은 먹이 사슬을 따라 축적되어 인간에게까지 영향을 줄 수 있다." },
  { id: "B", text: "미세 플라스틱은 바다에서 자연적으로 사라지므로 문제가 되지 않는다." },
  { id: "C", text: "미세 플라스틱은 오직 세안제에서만 발생한다." },
  { id: "D", text: "플랑크톤은 미세 플라스틱을 먹지 않는다." },
], ans: "A" };

const p3Segs = [
  { sub: `일회용 플라스틱 사용을 줄이기 위한 법률을 제정하는 나라가 늘어나고 있으며, 기업들도 재활용이 쉬운 소재나 생분해성 플라스틱을 개발하는 데 힘을 쏟고 있다.`, q: `플라스틱 문제 해결을 위한 노력으로 알맞은 것은 무엇인가요?`, choices: [
    { id: "A", text: "법률 제정과 재활용 소재·생분해성 플라스틱 개발에 힘쓰고 있다." },
    { id: "B", text: "플라스틱 생산을 더 늘려 가격을 낮추고 있다." },
    { id: "C", text: "바다에 플라스틱을 더 많이 버려 생태계를 풍요롭게 하고 있다." },
    { id: "D", text: "모든 나라에서 플라스틱 사용을 완전히 금지했다." },
  ], ans: "A" },
  { sub: `생분해성 플라스틱은 옥수수 전분이나 사탕수수 같은 식물 원료로 만들어져 자연에서 비교적 빠르게 분해될 수 있다.`, q: `생분해성 플라스틱의 원료와 특징으로 알맞은 것은 무엇인가요?`, choices: [
    { id: "A", text: "옥수수 전분이나 사탕수수 등 식물 원료로 만들어 비교적 빠르게 분해된다." },
    { id: "B", text: "석유를 원료로 만들어 기존 플라스틱보다 더 느리게 분해된다." },
    { id: "C", text: "금속을 원료로 하여 바다에서 녹아 없어진다." },
    { id: "D", text: "동물의 뼈를 원료로 사용하여 매우 단단하다." },
  ], ans: "A" },
  { sub: `다만 생분해성 플라스틱이 모든 환경에서 완벽하게 분해되는 것은 아니며, 일정한 온도와 습도 조건이 갖추어져야 한다는 한계도 존재한다.`, q: `생분해성 플라스틱의 한계로 알맞은 것은 무엇인가요?`, choices: [
    { id: "A", text: "모든 환경에서 완벽히 분해되지 않으며 일정한 온도·습도가 필요하다." },
    { id: "B", text: "어떤 환경에서든 즉시 완벽하게 분해된다." },
    { id: "C", text: "기존 플라스틱보다 값이 싸서 과잉 생산된다." },
    { id: "D", text: "식물 원료를 쓰기 때문에 독성이 강하다." },
  ], ans: "A" },
  { sub: `결국 플라스틱 문제를 근본적으로 줄이려면 기술 개발과 함께 소비자 개개인이 일회용 제품 사용을 의식적으로 줄이려는 노력이 반드시 뒷받침되어야 한다.`, q: `글쓴이가 강조하는 플라스틱 문제의 근본적 해결 방법은 무엇인가요?`, choices: [
    { id: "A", text: "기술 개발과 함께 소비자 개개인의 일회용 제품 사용 줄이기가 필요하다." },
    { id: "B", text: "기술 개발만으로 충분히 해결할 수 있다." },
    { id: "C", text: "소비자는 신경 쓸 필요 없이 기업만 노력하면 된다." },
    { id: "D", text: "플라스틱을 아예 사용하지 않는 것만이 유일한 방법이다." },
  ], ans: "A" },
];

const p3Summary = { q: `셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?`, choices: [
  { id: "A", text: "플라스틱 문제 해결을 위해 법률·기술 개발과 소비자의 실천이 함께 필요하다." },
  { id: "B", text: "생분해성 플라스틱이 모든 문제를 완벽하게 해결해 준다." },
  { id: "C", text: "소비자의 노력은 무의미하며 정부만 책임져야 한다." },
  { id: "D", text: "플라스틱 사용량을 줄일 수 있는 방법은 현재 없다." },
], ans: "A" };

// 타임라인 빌더
let stepIdx = 1;
function buildTimeline(pId, pText, segs, summary) {
  const steps = [];
  for (const seg of segs) {
    const range = r(pText, seg.sub);
    steps.push({
      stepId: `s${stepIdx}`,
      highlight: { ranges: [{ paragraphId: pId, start: range.start, end: range.end }] },
      question: {
        prompt: seg.q,
        choices: seg.choices,
        answerId: seg.ans,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
    stepIdx++;
  }
  steps.push({
    stepId: `s${stepIdx}`,
    highlight: { ranges: [{ paragraphId: pId, start: 0, end: pText.length }] },
    question: {
      prompt: summary.q,
      choices: summary.choices,
      answerId: summary.ans,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepIdx++;
  return steps;
}

const timeline = [
  ...buildTimeline("p1", p1, p1Segs, p1Summary),
  ...buildTimeline("p2", p2, p2Segs, p2Summary),
  ...buildTimeline("p3", p3, p3Segs, p3Summary),
];

// ── 복기(recall) 카드 8개 ──
const recall = {
  cards: [
    { id: "c1", text: "플라스틱은 가볍고 튼튼하며 값싸서 20세기 이후 생산량이 폭발적으로 늘었다." },
    { id: "c2", text: "플라스틱은 자연 분해에 수백 년이 걸려 땅과 바다를 오염시킨다." },
    { id: "c3", text: "미세 플라스틱은 5밀리미터 이하의 작은 플라스틱 조각이다." },
    { id: "c4", text: "플랑크톤이 미세 플라스틱을 먹이로 착각하여 삼킨다." },
    { id: "c5", text: "먹이 사슬을 통해 미세 플라스틱이 인간의 식탁에까지 올라올 수 있다." },
    { id: "c6", text: "각국은 일회용 플라스틱 규제 법률을 제정하고 있다." },
    { id: "c7", text: "생분해성 플라스틱은 식물 원료로 만들어져 비교적 빠르게 분해된다." },
    { id: "c8", text: "기술 개발과 함께 소비자 개개인의 일회용 제품 줄이기가 필요하다." },
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// ── 확인(confirm) ──
function cr(pId, pText, sub) {
  const s = pText.indexOf(sub);
  if (s === -1) throw new Error(`confirm: "${sub}" not found`);
  return [{ paragraphId: pId, start: s, end: s + sub.length }];
}

const confirm = {
  questions: [
    { id: "q1", prompt: "플라스틱이 자연에서 완전히 분해되기까지 걸리는 시간은 얼마인가요?", answerText: "수백 년", answerMatchMode: "ANY", answerRanges: cr("p1", p1, "수백 년"), scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q2", prompt: "미세 플라스틱의 크기 기준은 얼마 이하인가요?", answerText: "5밀리미터", answerMatchMode: "ANY", answerRanges: cr("p2", p2, "5밀리미터"), scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q3", prompt: "미세 플라스틱을 먹이로 착각하여 삼키는 바다 속 작은 생물은 무엇인가요?", answerText: "플랑크톤", answerMatchMode: "ANY", answerRanges: cr("p2", p2, "플랑크톤"), scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q4", prompt: "생분해성 플라스틱을 만드는 데 쓰이는 식물 원료의 예를 하나 들어 보세요.", answerText: "옥수수 전분", answerMatchMode: "ANY", answerRanges: cr("p3", p3, "옥수수 전분"), scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q5", prompt: "생분해성 플라스틱이 분해되려면 갖추어져야 하는 두 가지 조건은 무엇인가요?", answerText: "온도와 습도", answerMatchMode: "ANY", answerRanges: cr("p3", p3, "온도와 습도"), scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q6", prompt: "세안제나 치약의 미세 알갱이가 바다로 유입되는 경로는 무엇인가요?", answerText: "하수", answerMatchMode: "ANY", answerRanges: cr("p2", p2, "하수를 통해"), scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q7", prompt: "바다로 흘러든 플라스틱 쓰레기가 지구 곳곳으로 퍼지는 원인은 무엇인가요?", answerText: "해류", answerMatchMode: "ANY", answerRanges: cr("p1", p1, "해류"), scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
  ]
};

// ── 최종 JSON (static) ──
const staticJson = {
  contentId: "dr-r1-019",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 1) Day 19 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_1",
  schoolGradeRange: { min: 7, max: 8 },
  area: "READING",
  subArea: "NONFICTION",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 480,
  assets: {},
  payload: {
    passage: {
      format: "TEXT",
      paragraphs: [
        { id: "p1", text: p1 },
        { id: "p2", text: p2 },
        { id: "p3", text: p3 },
      ]
    },
    intensive: { timeline },
    recall,
    confirm
  }
};

// ── 배치 JSON ──
const batchItem = {
  content_type: "DAILY_READING",
  level_id: "RUSSELL_1",
  area: "READING",
  sub_area: "NONFICTION",
  day_index: 19,
  module_key: "reading_training",
  schema_version: "1.0",
  content: staticJson
};

// ── 파일 쓰기 ──
const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell1', '019.json');
fs.writeFileSync(staticPath, JSON.stringify(staticJson, null, 2), 'utf8');
console.log(`Static 파일 저장: ${staticPath}`);

const batchPath = path.join(__dirname, '..', 'generated', 'new', 'day19-batch.json');
fs.mkdirSync(path.dirname(batchPath), { recursive: true });
fs.writeFileSync(batchPath, JSON.stringify(batchItem, null, 2), 'utf8');
console.log(`배치 아이템 저장: ${batchPath}`);

console.log('Day 19 완료!');
