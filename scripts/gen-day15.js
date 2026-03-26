// Day 15 - NONFICTION (비문학) 생성 스크립트
const fs = require('fs');

const paragraphs = [
  {
    id: "p1",
    text: "지구의 표면은 여러 개의 거대한 판으로 나뉘어 있다.이 판들을 지각판이라고 부르며, 두꺼운 바위로 이루어져 있지만 그 아래 맨틀이라는 뜨거운 층 위에 떠 있어서 아주 느린 속도로 움직인다.판이 움직이는 빠르기는 1년에 몇 센티미터에 불과하여 사람이 직접 느끼기는 어렵다.그러나 수백만 년이 쌓이면 대륙의 위치가 크게 바뀌게 된다.실제로 과학자들은 지금으로부터 약 2억 년 전에 모든 대륙이 하나로 붙어 있었다는 사실을 밝혀냈고, 이 거대한 대륙을 판게아라고 불렀다.판게아가 점차 갈라져 오늘날의 여러 대륙이 된 것이다.남아메리카 동쪽 해안선과 아프리카 서쪽 해안선의 모양이 퍼즐처럼 들어맞는 것도 이 때문이다."
  },
  {
    id: "p2",
    text: "지각판이 서로 부딪치거나 벌어지는 곳에서는 큰 힘이 작용한다.두 판이 정면으로 부딪치면 한쪽이 다른 쪽 아래로 밀려 들어가면서 깊은 해구가 만들어지기도 하고, 밀려 올라간 쪽에는 높은 산맥이 솟아오른다.히말라야 산맥은 인도판과 유라시아판이 충돌하여 생긴 대표적인 사례이다.반대로 판이 양쪽으로 벌어지는 곳에서는 맨틀의 뜨거운 물질이 올라와 새로운 바닥을 만드는데, 대서양 한가운데의 해저 산맥이 바로 그 예이다.이처럼 산맥과 해구는 판이 만나거나 갈라지는 경계에서 생기며, 이 경계 지역은 화산과 지진이 자주 일어나는 곳이기도 하다."
  },
  {
    id: "p3",
    text: "지진과 화산은 지각판의 움직임과 밀접한 관련이 있다.판이 서로 밀거나 부딪칠 때 바위 속에 큰 힘이 쌓이고, 그 힘이 한꺼번에 풀리면 땅이 흔들리는데 이것이 지진이다.화산은 판의 경계나 약한 부분을 통해 맨틀의 녹은 바위인 마그마가 지표로 올라와 분출하는 현상이다.환태평양 지진대라 불리는 태평양 둘레에 지진과 화산이 집중되어 있는 까닭은 여러 판의 경계가 이곳에 모여 있기 때문이다.우리나라는 판의 경계에서 떨어져 있어 큰 지진은 드물지만 완전히 안전하지는 않다.과학자들은 지각판의 움직임을 정밀하게 관측하여 지진이나 화산 분출을 미리 대비하려고 노력하고 있다."
  }
];

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log("총 지문 길이:", totalLen);

function findRange(pid, text) {
  const para = paragraphs.find(p => p.id === pid);
  const start = para.text.indexOf(text);
  if (start === -1) throw new Error(`"${text}" not found in ${pid}`);
  return { paragraphId: pid, start, end: start + text.length };
}

function fullRange(pid) {
  const para = paragraphs.find(p => p.id === pid);
  return { paragraphId: pid, start: 0, end: para.text.length };
}

const p1s = [
  "지구의 표면은 여러 개의 거대한 판으로 나뉘어 있다.",
  "이 판들을 지각판이라고 부르며, 두꺼운 바위로 이루어져 있지만 그 아래 맨틀이라는 뜨거운 층 위에 떠 있어서 아주 느린 속도로 움직인다.",
  "판이 움직이는 빠르기는 1년에 몇 센티미터에 불과하여 사람이 직접 느끼기는 어렵다.",
  "그러나 수백만 년이 쌓이면 대륙의 위치가 크게 바뀌게 된다.",
  "실제로 과학자들은 지금으로부터 약 2억 년 전에 모든 대륙이 하나로 붙어 있었다는 사실을 밝혀냈고, 이 거대한 대륙을 판게아라고 불렀다.",
  "판게아가 점차 갈라져 오늘날의 여러 대륙이 된 것이다.",
  "남아메리카 동쪽 해안선과 아프리카 서쪽 해안선의 모양이 퍼즐처럼 들어맞는 것도 이 때문이다."
];

const p2s = [
  "지각판이 서로 부딪치거나 벌어지는 곳에서는 큰 힘이 작용한다.",
  "두 판이 정면으로 부딪치면 한쪽이 다른 쪽 아래로 밀려 들어가면서 깊은 해구가 만들어지기도 하고, 밀려 올라간 쪽에는 높은 산맥이 솟아오른다.",
  "히말라야 산맥은 인도판과 유라시아판이 충돌하여 생긴 대표적인 사례이다.",
  "반대로 판이 양쪽으로 벌어지는 곳에서는 맨틀의 뜨거운 물질이 올라와 새로운 바닥을 만드는데, 대서양 한가운데의 해저 산맥이 바로 그 예이다.",
  "이처럼 산맥과 해구는 판이 만나거나 갈라지는 경계에서 생기며, 이 경계 지역은 화산과 지진이 자주 일어나는 곳이기도 하다."
];

const p3s = [
  "지진과 화산은 지각판의 움직임과 밀접한 관련이 있다.",
  "판이 서로 밀거나 부딪칠 때 바위 속에 큰 힘이 쌓이고, 그 힘이 한꺼번에 풀리면 땅이 흔들리는데 이것이 지진이다.",
  "화산은 판의 경계나 약한 부분을 통해 맨틀의 녹은 바위인 마그마가 지표로 올라와 분출하는 현상이다.",
  "환태평양 지진대라 불리는 태평양 둘레에 지진과 화산이 집중되어 있는 까닭은 여러 판의 경계가 이곳에 모여 있기 때문이다.",
  "우리나라는 판의 경계에서 떨어져 있어 큰 지진은 드물지만 완전히 안전하지는 않다.",
  "과학자들은 지각판의 움직임을 정밀하게 관측하여 지진이나 화산 분출을 미리 대비하려고 노력하고 있다."
];

function verify(pid, sentences) {
  const para = paragraphs.find(p => p.id === pid);
  let pos = 0;
  for (const s of sentences) {
    const idx = para.text.indexOf(s, pos);
    if (idx !== pos) throw new Error(`${pid}: "${s.substring(0,20)}..." expected@${pos} found@${idx}`);
    pos += s.length;
  }
  if (pos !== para.text.length) throw new Error(`${pid}: end=${pos} len=${para.text.length}`);
  console.log(`${pid} 검증 통과 (${sentences.length}문장, ${para.text.length}자)`);
}

verify("p1", p1s);
verify("p2", p2s);
verify("p3", p3s);

const timeline = [];
let sn = 1;

function step(pid, sent, prompt, ch, ans) {
  timeline.push({
    stepId: `s${sn++}`,
    highlight: { ranges: [findRange(pid, sent)] },
    question: {
      prompt, choices: ch.map((t,i)=>({id:["A","B","C","D"][i],text:t})),
      answerId: ans, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

function summary(pid, prompt, ch, ans) {
  timeline.push({
    stepId: `s${sn++}`,
    highlight: { ranges: [fullRange(pid)] },
    question: {
      prompt, choices: ch.map((t,i)=>({id:["A","B","C","D"][i],text:t})),
      answerId: ans, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

// p1
step("p1", p1s[0],
  "첫 문장에서 지구 표면은 어떻게 이루어져 있다고 하나요?",
  ["여러 개의 거대한 판으로 나뉘어 있다","하나의 단단한 바위로 이어져 있다","끊임없이 녹아내리는 액체로 덮여 있다","수천 개의 작은 섬으로 흩어져 있다"], "A");

step("p1", p1s[1],
  "둘째 문장에서 지각판이 움직일 수 있는 까닭은 무엇인가요?",
  ["그 아래 맨틀이라는 뜨거운 층 위에 떠 있기 때문이다","바위가 가볍기 때문에 바람에 밀리기 때문이다","바닷물이 판을 양쪽으로 밀어내기 때문이다","지각판 사이에 빈틈이 많아 흔들리기 때문이다"], "A");

step("p1", p1s[2],
  "셋째 문장에서 판이 움직이는 빠르기는 어느 정도인가요?",
  ["1년에 몇 센티미터에 불과하다","하루에 몇 미터씩 움직인다","한 달에 수백 미터를 이동한다","1년에 몇 킬로미터를 움직인다"], "A");

step("p1", p1s[3] + p1s[4],
  "넷째·다섯째 문장에서 과학자들이 밝혀낸 사실은 무엇인가요?",
  ["약 2억 년 전에 모든 대륙이 하나로 붙어 있었다는 사실이다","지구는 처음부터 대륙이 따로따로 있었다는 사실이다","판게아는 바다 한가운데에만 있던 섬이라는 사실이다","대륙의 위치는 수백만 년이 지나도 바뀌지 않는다는 사실이다"], "A");

step("p1", p1s[5] + p1s[6],
  "여섯째·일곱째 문장에서 해안선 모양이 들어맞는 예시는 무엇인가요?",
  ["남아메리카 동쪽과 아프리카 서쪽 해안선이 퍼즐처럼 맞는다","유럽과 아시아 해안선이 완전히 일치한다","호주와 남극 해안선이 서로 같은 곡선이다","북아메리카와 유럽이 원래 한 덩어리였다"], "A");

summary("p1",
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["지구 표면은 느리게 움직이는 지각판으로 이루어져 대륙이 갈라졌다",
   "지구의 바위는 아주 단단해서 절대로 움직이지 않는다",
   "판게아는 앞으로 다시 하나로 합쳐질 예정이다",
   "맨틀은 차갑고 단단한 물질이어서 판이 움직일 수 없다"], "A");

// p2
step("p2", p2s[0],
  "둘째 문단 첫 문장에서 지각판이 부딪치거나 벌어지는 곳에서는 무엇이 생기나요?",
  ["큰 힘이 작용한다","아무런 변화가 없다","물이 솟아오른다","바람이 강해진다"], "A");

step("p2", p2s[1],
  "둘째 문장에서 두 판이 부딪치면 어떤 지형이 만들어지나요?",
  ["깊은 해구와 높은 산맥이 만들어진다","넓은 평야와 호수가 만들어진다","사막과 초원이 만들어진다","강과 폭포가 만들어진다"], "A");

step("p2", p2s[2],
  "셋째 문장에서 히말라야 산맥이 생긴 까닭은 무엇인가요?",
  ["인도판과 유라시아판이 충돌하여 생겼다","태평양판이 갈라져서 생겼다","바닷물이 줄어들면서 솟아올랐다","화산이 폭발하여 한꺼번에 만들어졌다"], "A");

step("p2", p2s[3],
  "넷째 문장에서 판이 벌어지는 곳에서는 무슨 일이 일어나나요?",
  ["맨틀의 뜨거운 물질이 올라와 새로운 바닥을 만든다","판이 녹아서 바다가 더 깊어진다","산맥이 허물어져 평야가 된다","차가운 물이 올라와 얼음이 만들어진다"], "A");

step("p2", p2s[4],
  "다섯째 문장에서 판의 경계 지역의 특징은 무엇인가요?",
  ["화산과 지진이 자주 일어나는 곳이다","비가 많이 내리는 곳이다","사람이 살기에 가장 좋은 곳이다","바람이 거의 불지 않는 곳이다"], "A");

summary("p2",
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["지각판이 부딪치거나 벌어지는 경계에서 산맥·해구가 생기고 지진과 화산이 잦다",
   "지각판은 항상 같은 방향으로만 움직이며 경계가 없다",
   "히말라야 산맥은 화산 폭발로 만들어졌다",
   "해저 산맥은 파도가 바위를 쌓아 만든 것이다"], "A");

// p3
step("p3", p3s[0] + p3s[1],
  "셋째 문단 첫째·둘째 문장에서 지진이 일어나는 과정은 어떠한가요?",
  ["판이 밀고 부딪칠 때 쌓인 힘이 한꺼번에 풀리면 땅이 흔들린다","바닷물이 갑자기 빠지면서 땅이 흔들린다","바위가 뜨거워져 녹으면서 땅이 흔들린다","바람이 세게 불어 건물이 흔들리는 것이다"], "A");

step("p3", p3s[2],
  "셋째 문장에서 화산 분출의 원인은 무엇인가요?",
  ["맨틀의 녹은 바위인 마그마가 지표로 올라와 분출한다","바닷물이 끓어올라 증기가 터져 나온다","지표의 모래가 뜨거워져 녹아 흘러내린다","지하수가 한꺼번에 솟아올라 분출한다"], "A");

step("p3", p3s[3],
  "넷째 문장에서 태평양 둘레에 지진과 화산이 집중된 까닭은 무엇인가요?",
  ["여러 판의 경계가 이곳에 모여 있기 때문이다","태평양 물이 유난히 뜨겁기 때문이다","태평양에 섬이 많아 무게가 무겁기 때문이다","태평양 바닥이 다른 바다보다 얇기 때문이다"], "A");

step("p3", p3s[4],
  "다섯째 문장에서 우리나라의 지진 상황은 어떠하다고 하나요?",
  ["판의 경계에서 떨어져 있어 큰 지진은 드물지만 완전히 안전하지는 않다","판의 경계 바로 위에 있어서 매년 큰 지진이 일어난다","지진이 전혀 일어나지 않아 완전히 안전하다","화산만 자주 일어나고 지진은 없다"], "A");

step("p3", p3s[5],
  "마지막 문장에서 과학자들은 무엇을 하고 있다고 하나요?",
  ["지각판의 움직임을 관측하여 재해에 미리 대비하려 한다","지각판을 멈추는 기술을 개발하고 있다","판을 인위적으로 움직여 지진을 만들고 있다","맨틀의 온도를 낮추는 실험을 하고 있다"], "A");

summary("p3",
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["지진과 화산은 지각판의 경계에서 일어나며 과학자들이 관측으로 대비한다",
   "지진과 화산은 날씨에 따라 일어나므로 기상 예보로 예측한다",
   "우리나라는 판의 경계 위에 있어서 가장 위험한 나라이다",
   "화산은 마그마가 식어서 생기며 지진과는 관계가 없다"], "A");

console.log("intensive steps:", timeline.length);

const recall = {
  cards: [
    { id: "c1", text: "지구 표면은 여러 지각판으로 나뉘어 있고, 맨틀 위에 떠서 느리게 움직인다." },
    { id: "c2", text: "약 2억 년 전 모든 대륙은 판게아라는 하나의 대륙이었다가 갈라졌다." },
    { id: "c3", text: "판이 부딪치면 해구와 산맥이 생기고, 벌어지면 새로운 바닥이 만들어진다." },
    { id: "c4", text: "히말라야 산맥은 인도판과 유라시아판 충돌로 생긴 대표적인 사례이다." },
    { id: "c5", text: "지진은 판이 밀고 부딪칠 때 쌓인 힘이 한꺼번에 풀려 땅이 흔들리는 현상이다." },
    { id: "c6", text: "화산은 맨틀의 마그마가 판의 경계를 통해 지표로 올라와 분출하는 현상이다." },
    { id: "c7", text: "환태평양 지진대에 지진과 화산이 집중된 것은 여러 판의 경계가 모여 있기 때문이다." },
    { id: "c8", text: "과학자들은 지각판의 움직임을 관측하여 지진과 화산에 미리 대비하려 한다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

const confirm = {
  questions: [
    {
      id: "q1", prompt: "지구 표면을 이루는 거대한 판을 무엇이라 부르나요?",
      answerText: "지각판", answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "지각판이라고 부르며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q2", prompt: "약 2억 년 전 하나로 붙어 있던 거대한 대륙의 이름은 무엇인가요?",
      answerText: "판게아", answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "판게아라고 불렀다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q3", prompt: "히말라야 산맥은 어떤 판들의 충돌로 생겼나요?",
      answerText: "인도판과 유라시아판", answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "인도판과 유라시아판이 충돌하여 생긴")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q4", prompt: "바위 속에 쌓인 힘이 한꺼번에 풀려 땅이 흔들리는 현상을 무엇이라 하나요?",
      answerText: "지진", answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "땅이 흔들리는데 이것이 지진이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q5", prompt: "맨틀의 녹은 바위가 지표로 올라와 분출하는 현상에서 녹은 바위를 무엇이라 하나요?",
      answerText: "마그마", answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "마그마가 지표로 올라와 분출하는 현상이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q6", prompt: "태평양 둘레에 지진과 화산이 집중된 지역을 무엇이라 부르나요?",
      answerText: "환태평양 지진대", answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "환태평양 지진대라 불리는 태평양 둘레")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q7", prompt: "과학자들이 지진과 화산에 대비하기 위해 하는 일은 무엇인가요?",
      answerText: "지각판의 움직임을 정밀하게 관측", answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "지각판의 움직임을 정밀하게 관측하여 지진이나 화산 분출을 미리 대비하려고 노력하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    }
  ]
};

const content = {
  contentId: "dr-f3-015",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(프레게 3) Day 15 비문학",
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

fs.writeFileSync('frontend/public/daily-reading/frege3/015.json', JSON.stringify(content, null, 2), 'utf-8');
console.log("015.json 저장 완료");

const batchFile = 'generated/daily-batch-reading-frege3.json';
const batch = JSON.parse(fs.readFileSync(batchFile, 'utf-8'));
batch.items[14] = {
  content_type: "DAILY_READING",
  level_id: "FREGE_3",
  area: "READING",
  sub_area: "NONFICTION",
  day_index: 15,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
fs.writeFileSync(batchFile, JSON.stringify(batch, null, 2), 'utf-8');
console.log("배치 파일 Day 15 업데이트 완료");
console.log("\n=== Day 15 생성 완료 ===");
