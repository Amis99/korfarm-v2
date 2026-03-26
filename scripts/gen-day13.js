// Day 13 - NONFICTION (비문학) 생성 스크립트
const fs = require('fs');

// === 지문 작성 (목표 1000자 ±50) ===
const paragraphs = [
  {
    id: "p1",
    text: "소리는 물체가 떨릴 때 생긴다.기타 줄을 튕기면 줄이 빠르게 흔들리면서 주변 공기를 밀어내고, 이 밀림이 파동의 형태로 퍼져 나간다.소리는 매질이라 불리는 물질을 통해 전달되는데, 공기뿐 아니라 물이나 금속 같은 고체를 통해서도 이동한다.그래서 귀를 책상에 대고 반대쪽을 두드리면 공기 중보다 소리가 더 크고 빨리 들린다.소리의 빠르기는 매질의 종류에 따라 달라지는데, 대체로 고체에서 가장 빠르고 기체에서 가장 느리다.예를 들어 공기 속에서 소리는 초속 약 340미터이지만, 철에서는 초속 약 5,100미터로 열다섯 배가량 빠르다.이런 까닭에 옛날 사람들은 먼 곳의 기차 소리를 듣기 위해 철로에 귀를 대기도 했다."
  },
  {
    id: "p2",
    text: "소리에는 높낮이와 크기, 그리고 음색이라는 세 가지 성질이 있다.높낮이는 물체가 1초 동안 떨리는 횟수인 진동수에 의해 결정되며, 진동수가 클수록 높은 소리가 난다.사람이 들을 수 있는 범위는 대략 20헤르츠에서 20,000헤르츠 사이이다.소리의 크기는 진폭, 즉 떨림의 폭에 따라 달라져서 진폭이 클수록 큰 소리가 난다.음색은 같은 높이의 소리라도 악기마다 느낌이 다른 까닭을 설명하는 성질이다.피아노와 바이올린이 같은 높이의 도 음을 연주해도 다르게 들리는 것은 음색이 다르기 때문이다.이처럼 세 가지 성질을 알면 일상에서 듣는 다양한 소리를 더 잘 구별할 수 있다."
  },
  {
    id: "p3",
    text: "소리는 장애물을 만나면 되돌아오는데 이를 메아리라고 한다.메아리가 생기려면 소리를 반사할 벽이나 산이 충분히 멀리 있어야 하며, 원래 소리와 구별하려면 약 0.1초 이상의 시간 차이가 필요하다.이 원리를 이용한 대표적인 기술이 초음파 검사이다.의사는 인체에 초음파를 보내고 되돌아오는 시간을 측정하여 몸속 장기의 모양을 화면에 나타낸다.배 속 태아의 모습을 확인할 수 있는 것도 이 기술 덕분이다.또한 어선에서 물속에 초음파를 쏘아 물고기 떼의 위치를 알아내는 것도 같은 원리이다.이처럼 소리는 단순히 듣는 것에 그치지 않고 보이지 않는 세계를 탐색하는 도구로도 쓰인다."
  }
];

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log("총 지문 길이:", totalLen);

// === 유틸 ===
function findRange(paragraphId, searchText) {
  const para = paragraphs.find(p => p.id === paragraphId);
  if (!para) throw new Error(`Paragraph ${paragraphId} not found`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}" not found in ${paragraphId}`);
  return { paragraphId, start, end: start + searchText.length };
}

function fullParagraphRange(paragraphId) {
  const para = paragraphs.find(p => p.id === paragraphId);
  return { paragraphId, start: 0, end: para.text.length };
}

// === 문장 분리 ===
const p1_sentences = [
  "소리는 물체가 떨릴 때 생긴다.",
  "기타 줄을 튕기면 줄이 빠르게 흔들리면서 주변 공기를 밀어내고, 이 밀림이 파동의 형태로 퍼져 나간다.",
  "소리는 매질이라 불리는 물질을 통해 전달되는데, 공기뿐 아니라 물이나 금속 같은 고체를 통해서도 이동한다.",
  "그래서 귀를 책상에 대고 반대쪽을 두드리면 공기 중보다 소리가 더 크고 빨리 들린다.",
  "소리의 빠르기는 매질의 종류에 따라 달라지는데, 대체로 고체에서 가장 빠르고 기체에서 가장 느리다.",
  "예를 들어 공기 속에서 소리는 초속 약 340미터이지만, 철에서는 초속 약 5,100미터로 열다섯 배가량 빠르다.",
  "이런 까닭에 옛날 사람들은 먼 곳의 기차 소리를 듣기 위해 철로에 귀를 대기도 했다."
];

const p2_sentences = [
  "소리에는 높낮이와 크기, 그리고 음색이라는 세 가지 성질이 있다.",
  "높낮이는 물체가 1초 동안 떨리는 횟수인 진동수에 의해 결정되며, 진동수가 클수록 높은 소리가 난다.",
  "사람이 들을 수 있는 범위는 대략 20헤르츠에서 20,000헤르츠 사이이다.",
  "소리의 크기는 진폭, 즉 떨림의 폭에 따라 달라져서 진폭이 클수록 큰 소리가 난다.",
  "음색은 같은 높이의 소리라도 악기마다 느낌이 다른 까닭을 설명하는 성질이다.",
  "피아노와 바이올린이 같은 높이의 도 음을 연주해도 다르게 들리는 것은 음색이 다르기 때문이다.",
  "이처럼 세 가지 성질을 알면 일상에서 듣는 다양한 소리를 더 잘 구별할 수 있다."
];

const p3_sentences = [
  "소리는 장애물을 만나면 되돌아오는데 이를 메아리라고 한다.",
  "메아리가 생기려면 소리를 반사할 벽이나 산이 충분히 멀리 있어야 하며, 원래 소리와 구별하려면 약 0.1초 이상의 시간 차이가 필요하다.",
  "이 원리를 이용한 대표적인 기술이 초음파 검사이다.",
  "의사는 인체에 초음파를 보내고 되돌아오는 시간을 측정하여 몸속 장기의 모양을 화면에 나타낸다.",
  "배 속 태아의 모습을 확인할 수 있는 것도 이 기술 덕분이다.",
  "또한 어선에서 물속에 초음파를 쏘아 물고기 떼의 위치를 알아내는 것도 같은 원리이다.",
  "이처럼 소리는 단순히 듣는 것에 그치지 않고 보이지 않는 세계를 탐색하는 도구로도 쓰인다."
];

function verifySentences(paraId, sentences) {
  const para = paragraphs.find(p => p.id === paraId);
  let pos = 0;
  for (const s of sentences) {
    const idx = para.text.indexOf(s, pos);
    if (idx === -1) throw new Error(`"${s}" not found in ${paraId} from pos ${pos}`);
    if (idx !== pos) throw new Error(`"${s}" expected at ${pos} but found at ${idx} in ${paraId}`);
    pos = idx + s.length;
  }
  if (pos !== para.text.length) throw new Error(`${paraId}: end=${pos} len=${para.text.length}`);
  console.log(`${paraId} 검증 통과 (${sentences.length}문장, ${para.text.length}자)`);
}

verifySentences("p1", p1_sentences);
verifySentences("p2", p2_sentences);
verifySentences("p3", p3_sentences);

// === intensive timeline ===
const timeline = [];
let stepNum = 1;

function addStep(paraId, sentence, prompt, choices, answerId) {
  const range = findRange(paraId, sentence);
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [range] },
    question: {
      prompt, choices: choices.map((t,i) => ({id:["A","B","C","D"][i], text:t})),
      answerId, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

function addSummary(paraId, prompt, choices, answerId) {
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [fullParagraphRange(paraId)] },
    question: {
      prompt, choices: choices.map((t,i) => ({id:["A","B","C","D"][i], text:t})),
      answerId, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

// p1
addStep("p1", p1_sentences[0],
  "첫 문장에서 소리는 언제 생긴다고 하나요?",
  ["물체가 떨릴 때 생긴다","빛이 반사될 때 생긴다","바람이 불 때만 생긴다","물이 흐를 때만 생긴다"], "A");

addStep("p1", p1_sentences[1],
  "둘째 문장에서 기타 줄을 튕기면 어떤 과정이 일어나나요?",
  ["줄이 흔들려 공기를 밀어내고 파동이 퍼져 나간다","줄이 끊어지면서 소리가 한 번만 난다","줄이 빛을 내면서 소리가 보인다","줄이 뜨거워져서 열이 퍼져 나간다"], "A");

addStep("p1", p1_sentences[2],
  "셋째 문장에서 소리를 전달하는 물질을 무엇이라 부르나요?",
  ["매질이라 불리는 물질을 통해 전달된다","진공이라 불리는 빈 공간을 통해 전달된다","전류라 불리는 전기 흐름으로 전달된다","자기장이라 불리는 힘을 통해 전달된다"], "A");

addStep("p1", p1_sentences[3],
  "넷째 문장에서 귀를 책상에 대면 소리가 어떻게 달라지나요?",
  ["공기 중보다 소리가 더 크고 빨리 들린다","공기 중보다 소리가 더 작고 느리게 들린다","소리가 완전히 사라져 들리지 않는다","소리의 높낮이만 바뀌고 크기는 같다"], "A");

addStep("p1", p1_sentences[4],
  "다섯째 문장에서 소리가 가장 빠르게 이동하는 매질은 무엇인가요?",
  ["대체로 고체에서 가장 빠르다","대체로 기체에서 가장 빠르다","대체로 액체에서 가장 빠르다","매질과 상관없이 빠르기가 같다"], "A");

addStep("p1", p1_sentences[5],
  "여섯째 문장에서 공기와 철 속의 소리 빠르기 차이는 어느 정도인가요?",
  ["철에서는 공기보다 열다섯 배가량 빠르다","철에서는 공기보다 두 배가량 빠르다","철에서는 공기보다 백 배가량 빠르다","공기와 철의 빠르기는 거의 같다"], "A");

addStep("p1", p1_sentences[6],
  "일곱째 문장에서 옛날 사람들이 철로에 귀를 댄 까닭은 무엇인가요?",
  ["먼 곳의 기차 소리를 빨리 듣기 위해서이다","철로의 온도를 확인하기 위해서이다","기차가 지나간 뒤의 떨림을 재기 위해서이다","철로 위에 올라갈 안전한 시간을 재기 위해서이다"], "A");

addSummary("p1",
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["소리는 물체의 떨림으로 생기며 매질에 따라 전달 속도가 다르다",
   "소리는 빛과 같은 속도로 이동하며 매질이 없어도 전달된다",
   "소리는 고체에서만 이동하며 기체에서는 전달되지 않는다",
   "소리의 빠르기는 매질과 관계없이 항상 같은 값을 가진다"], "A");

// p2
addStep("p2", p2_sentences[0],
  "둘째 문단 첫 문장에서 소리의 세 가지 성질은 무엇인가요?",
  ["높낮이, 크기, 음색이다","높낮이, 빠르기, 밝기이다","크기, 무게, 색깔이다","길이, 넓이, 높이이다"], "A");

addStep("p2", p2_sentences[1],
  "둘째 문장에서 소리의 높낮이를 결정하는 것은 무엇인가요?",
  ["물체가 1초 동안 떨리는 횟수인 진동수이다","소리가 퍼져 나가는 속도이다","물체의 크기와 무게이다","소리가 반사되는 횟수이다"], "A");

addStep("p2", p2_sentences[2],
  "셋째 문장에서 사람이 들을 수 있는 소리의 범위는 어디까지인가요?",
  ["대략 20헤르츠에서 20,000헤르츠 사이이다","1헤르츠에서 100헤르츠 사이이다","100헤르츠에서 1,000헤르츠 사이이다","50,000헤르츠 이상의 범위이다"], "A");

addStep("p2", p2_sentences[3],
  "넷째 문장에서 소리의 크기를 결정하는 것은 무엇인가요?",
  ["진폭, 즉 떨림의 폭에 따라 달라진다","진동수, 즉 떨리는 횟수에 따라 달라진다","매질의 종류에 따라 달라진다","소리가 나는 방향에 따라 달라진다"], "A");

addStep("p2", p2_sentences[4] + p2_sentences[5],
  "다섯째·여섯째 문장에서 피아노와 바이올린이 같은 음을 연주해도 다르게 들리는 까닭은 무엇인가요?",
  ["음색이 서로 다르기 때문이다","진동수가 서로 다르기 때문이다","진폭이 서로 다르기 때문이다","연주 속도가 서로 다르기 때문이다"], "A");

addStep("p2", p2_sentences[6],
  "일곱째 문장에서 세 성질을 알면 무엇을 할 수 있다고 하나요?",
  ["일상에서 듣는 다양한 소리를 더 잘 구별할 수 있다","소리를 눈으로 직접 볼 수 있게 된다","모든 소리를 똑같이 들을 수 있게 된다","새로운 악기를 만들 수 있게 된다"], "A");

addSummary("p2",
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["소리에는 높낮이·크기·음색의 세 성질이 있으며 각각 결정 요인이 다르다",
   "소리의 성질은 오직 진동수 하나에 의해서만 결정된다",
   "모든 악기는 같은 음색을 가지고 있어서 구별이 불가능하다",
   "사람은 모든 범위의 소리를 들을 수 있으므로 제한이 없다"], "A");

// p3
addStep("p3", p3_sentences[0],
  "셋째 문단 첫 문장에서 소리가 장애물을 만나 되돌아오는 것을 무엇이라 하나요?",
  ["메아리라고 한다","반향이라고만 한다","진동이라고 한다","울림통이라고 한다"], "A");

addStep("p3", p3_sentences[1],
  "둘째 문장에서 메아리를 구별하려면 시간 차이가 얼마나 필요한가요?",
  ["약 0.1초 이상의 시간 차이가 필요하다","약 1초 이상의 시간 차이가 필요하다","약 10초 이상의 시간 차이가 필요하다","시간 차이와 관계없이 항상 구별된다"], "A");

addStep("p3", p3_sentences[2] + p3_sentences[3],
  "셋째·넷째 문장에서 초음파 검사의 원리는 무엇인가요?",
  ["초음파를 보내고 되돌아오는 시간을 측정해 장기 모양을 나타낸다","초음파를 보내 몸속 온도를 재서 질병을 판단한다","초음파로 몸 안의 소리를 녹음하여 분석한다","초음파로 세포를 직접 관찰하여 크기를 잰다"], "A");

addStep("p3", p3_sentences[4] + p3_sentences[5],
  "다섯째·여섯째 문장에서 초음파 원리를 활용하는 예로 든 것은 무엇인가요?",
  ["태아의 모습 확인과 물고기 떼의 위치 파악이다","태아에게 음악을 들려주고 물고기를 유인하는 것이다","체온 측정과 물속 온도를 재는 것이다","뼈 길이 측정과 바닷물 성분 분석이다"], "A");

addStep("p3", p3_sentences[6],
  "마지막 문장에서 소리가 단순히 듣는 것 외에 어떤 역할을 한다고 하나요?",
  ["보이지 않는 세계를 탐색하는 도구로도 쓰인다","음악을 연주하는 용도로만 쓰인다","사람의 기분을 좋게 만드는 데에만 쓰인다","동물과 대화하는 수단으로만 쓰인다"], "A");

addSummary("p3",
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["소리의 반사 원리를 이용해 보이지 않는 것을 탐색하는 기술이 있다",
   "메아리는 항상 같은 크기로 되돌아오므로 측정에 쓸 수 없다",
   "초음파는 사람이 들을 수 있어서 일상 대화에도 쓰인다",
   "어선에서 초음파를 쓰면 물고기가 배로 모여든다"], "A");

console.log("intensive steps:", timeline.length);

// === recall (8카드) ===
const recall = {
  cards: [
    { id: "c1", text: "소리는 물체가 떨릴 때 생기며, 매질을 통해 파동 형태로 퍼져 나간다." },
    { id: "c2", text: "소리는 고체에서 가장 빠르고 기체에서 가장 느리며, 매질에 따라 속도가 다르다." },
    { id: "c3", text: "소리의 세 가지 성질은 높낮이, 크기, 음색이다." },
    { id: "c4", text: "높낮이는 진동수, 크기는 진폭, 음색은 악기마다 다른 소리 느낌을 결정한다." },
    { id: "c5", text: "사람이 들을 수 있는 소리의 범위는 20헤르츠에서 20,000헤르츠이다." },
    { id: "c6", text: "소리가 장애물에 부딪혀 되돌아오는 현상을 메아리라고 한다." },
    { id: "c7", text: "초음파 검사는 소리의 반사 원리로 몸속 장기나 태아의 모습을 화면에 나타낸다." },
    { id: "c8", text: "소리는 단순히 듣는 것에 그치지 않고 보이지 않는 세계를 탐색하는 도구로도 쓰인다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// === confirm (7개) ===
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "소리를 전달하는 물질을 무엇이라 부르나요?",
      answerText: "매질",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "매질이라 불리는 물질을 통해 전달되는데")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "공기 속에서 소리의 속도는 초속 얼마인가요?",
      answerText: "초속 약 340미터",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "초속 약 340미터")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "소리의 높낮이를 결정하는 것은 무엇인가요?",
      answerText: "진동수",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "진동수에 의해 결정되며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "사람이 들을 수 있는 소리의 범위는 몇 헤르츠에서 몇 헤르츠까지인가요?",
      answerText: "20헤르츠에서 20,000헤르츠",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "20헤르츠에서 20,000헤르츠 사이이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "같은 높이의 소리라도 악기마다 다르게 들리는 까닭을 설명하는 성질은 무엇인가요?",
      answerText: "음색",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "음색이 다르기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "소리가 장애물에 부딪혀 되돌아오는 현상을 무엇이라고 하나요?",
      answerText: "메아리",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "메아리라고 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "초음파 검사에서 몸속 장기의 모양을 알아내는 원리는 무엇인가요?",
      answerText: "초음파를 보내고 되돌아오는 시간을 측정",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "초음파를 보내고 되돌아오는 시간을 측정하여 몸속 장기의 모양을 화면에 나타낸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

// === 최종 JSON ===
const content = {
  contentId: "dr-f3-013",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(프레게 3) Day 13 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "FREGE_3",
  schoolGradeRange: { min: 6, max: 7 },
  area: "READING",
  subArea: "NONFICTION",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 5, multiplier: 1 },
  timeLimitSec: 480,
  assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall,
    confirm
  }
};

console.log("recall:", content.payload.recall.cards.length);
console.log("confirm:", content.payload.confirm.questions.length);

// static
fs.writeFileSync('frontend/public/daily-reading/frege3/013.json', JSON.stringify(content, null, 2), 'utf-8');
console.log("013.json 저장 완료");

// batch
const batchFile = 'generated/daily-batch-reading-frege3.json';
const batch = JSON.parse(fs.readFileSync(batchFile, 'utf-8'));
batch.items[12] = {
  content_type: "DAILY_READING",
  level_id: "FREGE_3",
  area: "READING",
  sub_area: "NONFICTION",
  day_index: 13,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
fs.writeFileSync(batchFile, JSON.stringify(batch, null, 2), 'utf-8');
console.log("배치 파일 Day 13 업데이트 완료");
console.log("\n=== Day 13 생성 완료 ===");
