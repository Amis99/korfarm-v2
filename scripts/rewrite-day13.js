const fs = require('fs');
const path = require('path');

// ─── 1. 지문 정의 (비문학 - 과학/생물) ───
const paragraphs = [
  {
    id: "p1",
    text: "식물은 뿌리로 물과 무기 양분을 빨아들이고, 잎에서 햇빛을 이용해 스스로 양분을 만든다.이처럼 빛에너지를 화학 에너지로 바꾸는 과정을 광합성이라 부른다.광합성은 잎 속의 엽록체라는 작은 구조에서 일어나며, 엽록체 안에 들어 있는 엽록소가 빛을 흡수하는 역할을 맡는다.엽록소는 초록빛을 반사하기 때문에 잎이 초록색으로 보이는 것이다.광합성에 필요한 재료는 물과 이산화 탄소이며, 이 둘을 합쳐 포도당과 산소를 만들어 낸다.포도당은 식물이 자라거나 열매를 맺는 데 쓰이는 에너지원이 되고, 산소는 기공을 통해 공기 중으로 빠져나간다.결국 식물의 광합성 덕분에 지구의 산소가 유지되고, 사람을 비롯한 동물이 숨을 쉴 수 있는 것이다."
  },
  {
    id: "p2",
    text: "광합성이 잘 이루어지려면 빛의 세기, 이산화 탄소의 농도, 온도라는 세 가지 조건이 갖추어져야 한다.빛이 강해질수록 광합성 속도는 빨라지지만, 일정 세기를 넘으면 더 이상 빨라지지 않는 한계점이 있다.이것을 광포화점이라 하는데, 이 점을 넘으면 아무리 빛을 더 비춰도 광합성 속도는 그대로 머문다.이산화 탄소도 마찬가지여서 농도가 높을수록 속도가 빨라지다가 어느 수준에서 멈춘다.온도 역시 적당할 때 가장 빠르며, 너무 높거나 낮으면 광합성이 느려지거나 아예 멈추기도 한다.이 세 조건은 따로 작용하는 것이 아니라 서로 영향을 주고받으므로, 실제 자연에서는 여러 요인이 동시에 광합성 속도를 조절한다."
  },
  {
    id: "p3",
    text: "광합성은 농업과 환경 문제 모두에 깊이 관련된다.온실에서 이산화 탄소 농도를 살짝 높이면 작물의 성장 속도가 빨라지므로, 농부들은 이 원리를 이용해 수확량을 늘리기도 한다.반대로 삼림이 줄어들면 광합성으로 흡수되는 이산화 탄소가 줄어 지구 온난화가 심해질 수 있다.도시에서 나무를 심는 활동이 단순한 꾸미기가 아니라 탄소를 줄이는 실질적인 방법이 되는 까닭도 여기에 있다.또한 과학자들은 인공 광합성 기술을 연구하여, 태양 에너지를 직접 연료로 바꾸려는 시도를 하고 있다.만약 이 기술이 실용화된다면 화석 연료에 대한 의존을 크게 줄일 수 있어, 광합성의 원리는 미래 에너지 문제의 열쇠가 될 수도 있다."
  }
];

// ─── 2. 유틸리티 ───
function findRange(pid, search) {
  const p = paragraphs.find(x => x.id === pid);
  if (!p) throw new Error(`Paragraph ${pid} not found`);
  const s = p.text.indexOf(search);
  if (s === -1) throw new Error(`"${search}" not found in ${pid}`);
  return { paragraphId: pid, start: s, end: s + search.length };
}

function sentenceRanges(pid) {
  const p = paragraphs.find(x => x.id === pid);
  const text = p.text;
  const ranges = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && i + 1 <= text.length) {
      ranges.push({ paragraphId: pid, start, end: i + 1 });
      start = i + 1;
    }
  }
  if (start < text.length) {
    ranges.push({ paragraphId: pid, start, end: text.length });
  }
  return ranges;
}

// ─── 3. intensive timeline ───
const timeline = [];
let stepNum = 1;

// p1
const p1Sentences = sentenceRanges("p1");
const p1Questions = [
  {
    prompt: "첫 문장은 식물이 양분을 어떻게 만든다고 하나요?",
    choices: [
      { id: "A", text: "뿌리로 물을 빨아들이고 잎에서 햇빛으로 양분을 만든다" },
      { id: "B", text: "줄기에서 공기를 흡수하고 뿌리에서 양분을 만든다" },
      { id: "C", text: "꽃에서 햇빛을 모으고 열매에서 양분을 만든다" },
      { id: "D", text: "흙 속 동물이 가져다 주는 양분만 이용한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장은 빛에너지를 화학 에너지로 바꾸는 과정을 무엇이라 부르나요?",
    choices: [
      { id: "A", text: "광합성이라 부른다" },
      { id: "B", text: "호흡이라 부른다" },
      { id: "C", text: "증산이라 부른다" },
      { id: "D", text: "발효라 부른다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 광합성이 일어나는 장소와 빛을 흡수하는 물질은 무엇인가요?",
    choices: [
      { id: "A", text: "엽록체에서 일어나고 엽록소가 빛을 흡수한다" },
      { id: "B", text: "세포핵에서 일어나고 DNA가 빛을 흡수한다" },
      { id: "C", text: "뿌리에서 일어나고 물이 빛을 흡수한다" },
      { id: "D", text: "줄기에서 일어나고 섬유소가 빛을 흡수한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장은 잎이 초록색으로 보이는 까닭을 어떻게 설명하나요?",
    choices: [
      { id: "A", text: "엽록소가 초록빛을 반사하기 때문이라고 설명한다" },
      { id: "B", text: "잎에 초록색 물감이 들어 있기 때문이라고 설명한다" },
      { id: "C", text: "초록빛을 흡수하기 때문이라고 설명한다" },
      { id: "D", text: "물이 초록색이기 때문이라고 설명한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 광합성의 재료와 결과물은 무엇인가요?",
    choices: [
      { id: "A", text: "물과 이산화 탄소를 합쳐 포도당과 산소를 만든다" },
      { id: "B", text: "산소와 포도당을 합쳐 물과 이산화 탄소를 만든다" },
      { id: "C", text: "질소와 수소를 합쳐 단백질을 만든다" },
      { id: "D", text: "물과 산소를 합쳐 이산화 탄소를 만든다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장은 포도당과 산소의 쓰임을 어떻게 설명하나요?",
    choices: [
      { id: "A", text: "포도당은 에너지원, 산소는 기공을 통해 공기 중으로 나간다" },
      { id: "B", text: "포도당은 뿌리에 저장하고 산소는 흙 속으로 내보낸다" },
      { id: "C", text: "포도당과 산소 모두 식물 안에만 머문다" },
      { id: "D", text: "포도당은 바로 분해되고 산소는 물속으로 들어간다" }
    ],
    answerId: "A"
  },
  {
    prompt: "일곱째 문장은 광합성이 지구에 어떤 의미가 있다고 정리하나요?",
    choices: [
      { id: "A", text: "산소가 유지되어 동물이 숨을 쉴 수 있게 해 준다" },
      { id: "B", text: "이산화 탄소만 늘려 기온을 높인다" },
      { id: "C", text: "물을 모두 소비해 강이 마르게 한다" },
      { id: "D", text: "동물에게는 아무런 영향이 없다" }
    ],
    answerId: "A"
  }
];

p1Sentences.forEach((range, i) => {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [range] },
    question: {
      prompt: p1Questions[i].prompt,
      choices: p1Questions[i].choices,
      answerId: p1Questions[i].answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
});

// p1 중심내용
timeline.push({
  stepId: `s${stepNum}`,
  highlight: { ranges: [{ paragraphId: "p1", start: 0, end: paragraphs[0].text.length }] },
  question: {
    prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "광합성의 장소, 재료, 결과물을 설명하고 지구 산소 유지와 연결짓는다" },
      { id: "B", text: "식물의 뿌리 구조와 물의 이동 경로를 자세히 설명한다" },
      { id: "C", text: "동물의 호흡 과정이 광합성보다 중요하다고 말한다" },
      { id: "D", text: "엽록소의 색을 바꾸는 방법을 소개한다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});
stepNum++;

// p2
const p2Sentences = sentenceRanges("p2");
const p2Questions = [
  {
    prompt: "첫 문장은 광합성에 필요한 세 가지 조건을 무엇이라고 하나요?",
    choices: [
      { id: "A", text: "빛의 세기, 이산화 탄소의 농도, 온도이다" },
      { id: "B", text: "물의 양, 바람의 세기, 습도이다" },
      { id: "C", text: "흙의 종류, 뿌리의 길이, 꽃의 수이다" },
      { id: "D", text: "산소의 양, 질소의 농도, 기압이다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장은 빛과 광합성 속도의 관계를 어떻게 설명하나요?",
    choices: [
      { id: "A", text: "빛이 강해질수록 빨라지지만 일정 세기를 넘으면 한계가 있다" },
      { id: "B", text: "빛이 강할수록 광합성이 느려진다" },
      { id: "C", text: "빛의 세기와 광합성은 전혀 관계가 없다" },
      { id: "D", text: "빛이 약할 때만 광합성이 일어난다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 이 한계점을 무엇이라 부르나요?",
    choices: [
      { id: "A", text: "광포화점이라 부른다" },
      { id: "B", text: "광분해점이라 부른다" },
      { id: "C", text: "광굴절점이라 부른다" },
      { id: "D", text: "광반사점이라 부른다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장은 이산화 탄소 농도와 광합성의 관계를 어떻게 말하나요?",
    choices: [
      { id: "A", text: "농도가 높을수록 빨라지다가 어느 수준에서 멈춘다" },
      { id: "B", text: "농도가 높으면 광합성이 완전히 멈춘다" },
      { id: "C", text: "농도와 광합성은 반비례 관계이다" },
      { id: "D", text: "농도가 낮을수록 광합성이 더 빨라진다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장은 온도가 광합성에 미치는 영향을 어떻게 설명하나요?",
    choices: [
      { id: "A", text: "적당할 때 가장 빠르고 너무 높거나 낮으면 느려지거나 멈춘다" },
      { id: "B", text: "온도가 높을수록 항상 광합성이 빨라진다" },
      { id: "C", text: "온도는 광합성에 영향을 주지 않는다" },
      { id: "D", text: "영하의 온도에서만 광합성이 가능하다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장은 세 조건이 어떻게 작용한다고 정리하나요?",
    choices: [
      { id: "A", text: "따로가 아니라 서로 영향을 주고받으며 동시에 조절한다" },
      { id: "B", text: "각각 완전히 독립적으로 작용한다" },
      { id: "C", text: "한 가지 조건만 맞으면 나머지는 중요하지 않다" },
      { id: "D", text: "세 조건 중 하나만 충족되면 광합성이 최대로 일어난다" }
    ],
    answerId: "A"
  }
];

p2Sentences.forEach((range, i) => {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [range] },
    question: {
      prompt: p2Questions[i].prompt,
      choices: p2Questions[i].choices,
      answerId: p2Questions[i].answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
});

// p2 중심내용
timeline.push({
  stepId: `s${stepNum}`,
  highlight: { ranges: [{ paragraphId: "p2", start: 0, end: paragraphs[1].text.length }] },
  question: {
    prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "빛, 이산화 탄소, 온도 세 조건이 광합성 속도를 함께 조절한다" },
      { id: "B", text: "광합성은 온도에만 영향을 받고 빛과는 무관하다" },
      { id: "C", text: "광포화점을 넘으면 식물이 죽는다" },
      { id: "D", text: "이산화 탄소가 많을수록 식물이 시든다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});
stepNum++;

// p3
const p3Sentences = sentenceRanges("p3");
const p3Questions = [
  {
    prompt: "첫 문장은 광합성이 어떤 분야와 관련된다고 하나요?",
    choices: [
      { id: "A", text: "농업과 환경 문제 모두에 깊이 관련된다" },
      { id: "B", text: "음악과 미술 분야에만 관련된다" },
      { id: "C", text: "건축과 교통에만 관련된다" },
      { id: "D", text: "농업에는 관련되지만 환경과는 무관하다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 온실 농부가 이용하는 원리는 무엇인가요?",
    choices: [
      { id: "A", text: "이산화 탄소 농도를 높여 작물 성장 속도를 빠르게 한다" },
      { id: "B", text: "산소를 줄여 작물 성장을 빠르게 한다" },
      { id: "C", text: "온도를 극도로 낮춰 작물을 빨리 키운다" },
      { id: "D", text: "물을 주지 않아 작물이 강해지게 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장은 삼림이 줄어들면 어떤 문제가 생긴다고 하나요?",
    choices: [
      { id: "A", text: "이산화 탄소 흡수가 줄어 지구 온난화가 심해질 수 있다" },
      { id: "B", text: "산소가 너무 많아져 기온이 내려간다" },
      { id: "C", text: "비가 더 자주 내리게 된다" },
      { id: "D", text: "동물이 산소를 더 많이 만들어 낸다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장은 도시에서 나무를 심는 활동이 어떤 의미가 있다고 하나요?",
    choices: [
      { id: "A", text: "탄소를 줄이는 실질적인 방법이 된다" },
      { id: "B", text: "단순히 도시를 예쁘게 꾸미는 데만 쓰인다" },
      { id: "C", text: "산소를 줄이는 효과가 있다" },
      { id: "D", text: "소음을 없애는 유일한 방법이다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 과학자들이 연구하는 기술은 무엇인가요?",
    choices: [
      { id: "A", text: "태양 에너지를 직접 연료로 바꾸는 인공 광합성 기술이다" },
      { id: "B", text: "식물 없이 산소를 만드는 화학 실험이다" },
      { id: "C", text: "화석 연료를 더 많이 태우는 기술이다" },
      { id: "D", text: "나무를 빨리 자라게 하는 유전자 조작 기술이다" }
    ],
    answerId: "A"
  },
  {
    prompt: "마지막 문장은 광합성의 원리가 미래에 어떤 역할을 할 수 있다고 하나요?",
    choices: [
      { id: "A", text: "화석 연료 의존을 줄이는 미래 에너지 문제의 열쇠가 될 수 있다" },
      { id: "B", text: "화석 연료 사용을 더 늘리게 될 것이다" },
      { id: "C", text: "에너지 문제와는 전혀 관련이 없다" },
      { id: "D", text: "모든 에너지 문제가 이미 해결되었다" }
    ],
    answerId: "A"
  }
];

p3Sentences.forEach((range, i) => {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [range] },
    question: {
      prompt: p3Questions[i].prompt,
      choices: p3Questions[i].choices,
      answerId: p3Questions[i].answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
});

// p3 중심내용
timeline.push({
  stepId: `s${stepNum}`,
  highlight: { ranges: [{ paragraphId: "p3", start: 0, end: paragraphs[2].text.length }] },
  question: {
    prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "광합성은 농업 수확량과 환경 보전, 미래 에너지 기술에 모두 관련된다" },
      { id: "B", text: "광합성은 오직 온실 농업에만 쓸모가 있다" },
      { id: "C", text: "인공 광합성은 이미 실용화되어 널리 쓰이고 있다" },
      { id: "D", text: "나무를 심는 것은 환경에 아무 도움이 되지 않는다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});

// ─── 4. recall (8카드) ───
const recall = {
  cards: [
    { id: "c1", text: "식물은 잎의 엽록체에서 빛에너지를 화학 에너지로 바꾸는 광합성을 한다." },
    { id: "c2", text: "엽록소가 초록빛을 반사하기 때문에 잎이 초록색으로 보인다." },
    { id: "c3", text: "광합성은 물과 이산화 탄소를 재료로 포도당과 산소를 만들어 낸다." },
    { id: "c4", text: "빛의 세기, 이산화 탄소 농도, 온도 세 조건이 광합성 속도를 조절한다." },
    { id: "c5", text: "빛이 일정 세기를 넘으면 광합성 속도가 더 빨라지지 않는 광포화점이 있다." },
    { id: "c6", text: "온실에서 이산화 탄소 농도를 높이면 작물의 성장 속도가 빨라진다." },
    { id: "c7", text: "삼림이 줄면 이산화 탄소 흡수가 줄어 지구 온난화가 심해질 수 있다." },
    { id: "c8", text: "인공 광합성 기술이 실용화되면 화석 연료 의존을 크게 줄일 수 있다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// ─── 5. confirm (7개) ───
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "빛에너지를 화학 에너지로 바꾸는 과정을 무엇이라 부르나요?",
      answerText: "광합성",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "광합성이라 부른다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "잎이 초록색으로 보이는 까닭은 엽록소가 어떤 빛을 반사하기 때문인가요?",
      answerText: "초록빛",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "초록빛을 반사하기 때문에")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "광합성의 재료 두 가지는 무엇인가요?",
      answerText: "물과 이산화 탄소",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "물과 이산화 탄소이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "빛이 일정 세기를 넘으면 광합성 속도가 더 이상 빨라지지 않는 점을 무엇이라 하나요?",
      answerText: "광포화점",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "광포화점")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "온실에서 농부들이 작물 성장을 빠르게 하려고 높이는 것은 무엇인가요?",
      answerText: "이산화 탄소 농도",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "이산화 탄소 농도를 살짝 높이면")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "삼림이 줄어들면 심해질 수 있는 환경 문제는 무엇인가요?",
      answerText: "지구 온난화",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "지구 온난화가 심해질 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "과학자들이 태양 에너지를 연료로 바꾸려고 연구하는 기술은 무엇인가요?",
      answerText: "인공 광합성",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "인공 광합성 기술")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

// ─── 6. 콘텐츠 조립 ───
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

// ─── 7. 배치 파일 업데이트 ───
const batchPath = path.join('C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지\\generated\\daily-batch-reading-frege3.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
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
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');

// ─── 8. static 파일 ───
const staticPath = path.join('C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지\\frontend\\public\\daily-reading\\frege3', '013.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log('Day 13 완료! 지문 길이:', totalLen, '자');
console.log('intensive steps:', timeline.length);
console.log('recall cards:', recall.cards.length);
console.log('confirm questions:', confirm.questions.length);
