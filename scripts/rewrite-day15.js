const fs = require('fs');
const path = require('path');

// ─── 1. 지문 정의 (비문학 - 사회/역사) ───
const paragraphs = [
  {
    id: "p1",
    text: "한글은 조선 시대 세종대왕이 1443년에 만들어 1446년에 반포한 문자이다.당시 백성 대부분은 한자를 읽지 못해 자기 생각을 글로 적을 수 없었는데, 세종은 이 문제를 해결하려고 새로운 글자를 연구하기 시작했다.한글의 자음은 혀, 입술, 목구멍 등 발음 기관의 생김새를 본떠 만들었고, 모음은 하늘, 땅, 사람을 상징하는 세 가지 기본 획을 조합하여 만들었다.이처럼 한글은 과학적인 원리 위에 설계된 문자이기 때문에, 소리를 정확하고 다양하게 적을 수 있다는 장점이 있다.하지만 한글이 처음부터 환영받은 것은 아니었다.당시 일부 학자는 한자만이 올바른 글이라 여겼고, 한글을 배울 필요가 없다고 반대하기도 했다.그럼에도 세종은 뜻을 굽히지 않고 한글을 보급하여 누구나 글을 읽고 쓸 수 있는 길을 열었다."
  },
  {
    id: "p2",
    text: "한글이 만들어진 뒤 조선 사회에는 여러 변화가 나타났다.한자를 모르던 백성도 편지를 쓰고 관청의 공고문을 읽을 수 있게 되었다.농사 방법이나 의료 지식을 한글로 적은 책이 나오면서, 실생활에 필요한 정보가 더 많은 사람에게 퍼졌다.여성이나 하층민처럼 한자 교육을 받기 어려웠던 사람들도 한글 덕분에 글을 익힐 수 있었다.이는 조선 시대 문화의 폭을 넓히는 데 크게 이바지했는데, 한글로 쓰인 소설과 시가 등장하여 일반 백성이 문학을 즐길 수 있게 된 것이 대표적인 예이다.또한 한글은 사람들 사이의 소통을 빠르게 만들어, 마을 단위의 협력이나 장사에서도 큰 도움이 되었다."
  },
  {
    id: "p3",
    text: "오늘날 한글은 한국의 공식 문자로서 세계적으로도 그 가치를 인정받고 있다.유네스코는 문맹 퇴치에 이바지한 사람이나 단체에 세종대왕 문해상을 수여하는데, 이는 한글 창제의 정신이 국제 사회에서도 높이 평가받고 있음을 보여 준다.한글의 과학적 구조는 언어학자들 사이에서도 연구 대상이 되어, 세계의 여러 대학에서 한국어와 한글을 가르치는 강좌가 늘고 있다.또한 디지털 시대에 한글은 자음과 모음의 조합 방식 덕분에 컴퓨터와 스마트폰 입력에도 효율적이어서, 빠르고 정확한 타자가 가능하다.이처럼 한글은 과거에 소통의 장벽을 허물었을 뿐 아니라, 현재와 미래에도 그 쓸모가 더욱 커지고 있는 자랑스러운 문화유산이다."
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
    prompt: "첫 문장은 한글이 언제, 누구에 의해 만들어졌다고 하나요?",
    choices: [
      { id: "A", text: "세종대왕이 1443년에 만들어 1446년에 반포했다" },
      { id: "B", text: "고려 시대 왕이 1200년에 만들었다" },
      { id: "C", text: "조선 말기 학자들이 1800년에 만들었다" },
      { id: "D", text: "중국에서 전해져 조선에서 고쳐 쓴 문자이다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장은 새 글자를 만든 이유를 무엇이라 하나요?",
    choices: [
      { id: "A", text: "백성이 한자를 읽지 못해 생각을 글로 적을 수 없었기 때문이다" },
      { id: "B", text: "한자가 너무 쉬워 더 어려운 글자가 필요했기 때문이다" },
      { id: "C", text: "외국과의 무역을 위해 새 문자가 필요했기 때문이다" },
      { id: "D", text: "왕실의 비밀 문서를 쓰기 위해서였다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장은 자음과 모음의 설계 원리를 어떻게 설명하나요?",
    choices: [
      { id: "A", text: "자음은 발음 기관을 본떠, 모음은 하늘·땅·사람 획을 조합하여 만들었다" },
      { id: "B", text: "자음과 모음 모두 한자의 획을 줄여서 만들었다" },
      { id: "C", text: "발음 기관과 관계없이 무작위로 만들었다" },
      { id: "D", text: "외국 문자를 그대로 베껴서 만들었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장은 한글이 과학적 원리 위에 설계되어 어떤 장점이 있다고 하나요?",
    choices: [
      { id: "A", text: "소리를 정확하고 다양하게 적을 수 있다" },
      { id: "B", text: "글자 수가 적어 빨리 쓸 수 있다" },
      { id: "C", text: "그림처럼 생겨 뜻을 바로 알 수 있다" },
      { id: "D", text: "외국어를 적기 위해 만들어졌다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장은 한글이 처음부터 어떤 반응을 받았다고 하나요?",
    choices: [
      { id: "A", text: "처음부터 환영받은 것은 아니었다" },
      { id: "B", text: "모든 사람이 즉시 환영했다" },
      { id: "C", text: "왕실에서만 사용이 허가되었다" },
      { id: "D", text: "한 달 만에 전국에 퍼졌다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 일부 학자가 반대한 이유는 무엇인가요?",
    choices: [
      { id: "A", text: "한자만이 올바른 글이라 여겼기 때문이다" },
      { id: "B", text: "한글이 한자보다 어렵다고 생각했기 때문이다" },
      { id: "C", text: "한글이 외국에서 온 글자라고 생각했기 때문이다" },
      { id: "D", text: "새 글자를 배우면 돈이 많이 든다고 생각했기 때문이다" }
    ],
    answerId: "A"
  },
  {
    prompt: "일곱째 문장은 세종이 어떤 결심을 하고 무엇을 이루었다고 하나요?",
    choices: [
      { id: "A", text: "뜻을 굽히지 않고 한글을 보급하여 글을 읽고 쓸 수 있는 길을 열었다" },
      { id: "B", text: "학자들의 반대에 따라 한글 보급을 중단했다" },
      { id: "C", text: "한자와 한글을 합쳐 새 문자를 만들었다" },
      { id: "D", text: "한글 대신 다른 문자를 새로 연구하기 시작했다" }
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
      { id: "A", text: "한글은 백성을 위해 과학적으로 설계된 문자로 반대를 넘어 보급되었다" },
      { id: "B", text: "한글은 한자를 줄여 만든 문자로 학자들이 모두 찬성했다" },
      { id: "C", text: "한글은 외국 문자를 본떠 만들어 소리를 적을 수 없다" },
      { id: "D", text: "한글은 왕실 전용 문자여서 백성은 사용할 수 없었다" }
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
    prompt: "첫 문장은 한글이 만들어진 뒤 어떤 일이 있었다고 하나요?",
    choices: [
      { id: "A", text: "조선 사회에 여러 변화가 나타났다" },
      { id: "B", text: "조선 사회에 아무 변화도 없었다" },
      { id: "C", text: "한자 사용이 더 늘었다" },
      { id: "D", text: "백성이 글을 배우기를 거부했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 백성이 새로 할 수 있게 된 것은 무엇인가요?",
    choices: [
      { id: "A", text: "편지를 쓰고 관청의 공고문을 읽을 수 있게 되었다" },
      { id: "B", text: "한자로 시험을 볼 수 있게 되었다" },
      { id: "C", text: "외국어를 자유롭게 구사할 수 있게 되었다" },
      { id: "D", text: "관직에 바로 오를 수 있게 되었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 한글로 적힌 책이 퍼뜨린 것은 무엇인가요?",
    choices: [
      { id: "A", text: "농사 방법이나 의료 지식 등 실생활 정보가 더 많은 사람에게 퍼졌다" },
      { id: "B", text: "왕실의 비밀이 백성에게 퍼졌다" },
      { id: "C", text: "한자 학습 교재가 널리 퍼졌다" },
      { id: "D", text: "외국의 소설이 번역되어 퍼졌다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 한글 덕분에 글을 익힐 수 있게 된 사람들은 누구인가요?",
    choices: [
      { id: "A", text: "여성이나 하층민처럼 한자 교육을 받기 어려웠던 사람들이다" },
      { id: "B", text: "이미 한자를 잘 아는 학자들이다" },
      { id: "C", text: "외국에서 온 상인들이다" },
      { id: "D", text: "왕실의 가족들만 해당되었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 문화의 폭을 넓힌 대표적인 예는 무엇인가요?",
    choices: [
      { id: "A", text: "한글로 쓰인 소설과 시가 등장하여 백성이 문학을 즐기게 되었다" },
      { id: "B", text: "한자로 된 역사책이 대량으로 인쇄되었다" },
      { id: "C", text: "외국 문학이 한글로 번역되기 시작했다" },
      { id: "D", text: "그림을 그려 의사소통하는 방법이 생겼다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 한글이 도움을 준 분야는 무엇인가요?",
    choices: [
      { id: "A", text: "마을 단위의 협력이나 장사에서 소통을 빠르게 했다" },
      { id: "B", text: "전쟁에서 비밀 암호로만 사용되었다" },
      { id: "C", text: "궁궐 건축에만 도움이 되었다" },
      { id: "D", text: "음악 악보를 적는 데만 쓰였다" }
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
      { id: "A", text: "한글은 백성의 소통과 문화를 넓혀 조선 사회에 큰 변화를 가져왔다" },
      { id: "B", text: "한글은 만들어졌지만 아무도 사용하지 않았다" },
      { id: "C", text: "한글 때문에 한자가 완전히 사라졌다" },
      { id: "D", text: "한글은 여성만 사용하는 문자였다" }
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
    prompt: "첫 문장은 오늘날 한글의 위상을 어떻게 말하나요?",
    choices: [
      { id: "A", text: "한국의 공식 문자로 세계적으로 가치를 인정받고 있다" },
      { id: "B", text: "한국에서만 사용되고 외국에서는 알려지지 않았다" },
      { id: "C", text: "이제는 사용하지 않는 옛 문자가 되었다" },
      { id: "D", text: "영어에 밀려 점점 사라지고 있다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 유네스코가 수여하는 상의 이름은 무엇인가요?",
    choices: [
      { id: "A", text: "세종대왕 문해상이다" },
      { id: "B", text: "한글 창제상이다" },
      { id: "C", text: "노벨 문학상이다" },
      { id: "D", text: "유네스코 평화상이다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 한글의 과학적 구조가 어디에서 연구되고 있나요?",
    choices: [
      { id: "A", text: "세계의 여러 대학에서 한국어와 한글 강좌가 늘고 있다" },
      { id: "B", text: "한국의 초등학교에서만 연구되고 있다" },
      { id: "C", text: "언어학자들이 연구를 중단했다" },
      { id: "D", text: "외국에서는 전혀 가르치지 않는다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장은 디지털 시대에 한글이 가진 장점을 무엇이라 하나요?",
    choices: [
      { id: "A", text: "자음과 모음 조합 방식 덕분에 빠르고 정확한 타자가 가능하다" },
      { id: "B", text: "컴퓨터에서 한글을 입력하기 매우 어렵다" },
      { id: "C", text: "스마트폰에서는 한글을 사용할 수 없다" },
      { id: "D", text: "디지털 기기와 한글은 전혀 맞지 않는다" }
    ],
    answerId: "A"
  },
  {
    prompt: "마지막 문장은 한글을 어떤 유산이라고 정리하나요?",
    choices: [
      { id: "A", text: "과거에 장벽을 허물고 현재와 미래에도 쓸모가 커지는 문화유산이다" },
      { id: "B", text: "과거에만 쓸모가 있었고 현재는 쓰이지 않는 유산이다" },
      { id: "C", text: "미래에는 다른 문자로 대체될 유산이다" },
      { id: "D", text: "소통과 관련이 없는 예술 유산이다" }
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
      { id: "A", text: "한글은 세계적으로 가치를 인정받으며 디지털 시대에도 효율적인 문자이다" },
      { id: "B", text: "한글은 유네스코에 의해 사용이 금지되었다" },
      { id: "C", text: "한글은 디지털 시대에 쓸모가 없어졌다" },
      { id: "D", text: "한글은 한국에서만 가치가 있는 문자이다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});

// ─── 4. recall (8카드) ───
const recall = {
  cards: [
    { id: "c1", text: "세종대왕은 한자를 모르는 백성을 위해 1443년에 한글을 만들어 1446년에 반포했다." },
    { id: "c2", text: "자음은 발음 기관을, 모음은 하늘·땅·사람을 본떠 과학적으로 설계되었다." },
    { id: "c3", text: "일부 학자의 반대에도 세종은 한글을 보급하여 누구나 글을 읽고 쓸 수 있게 했다." },
    { id: "c4", text: "한글 덕분에 농사·의료 지식이 퍼지고 여성과 하층민도 글을 익히게 되었다." },
    { id: "c5", text: "한글로 쓰인 소설과 시가 등장하여 조선 문화의 폭이 넓어졌다." },
    { id: "c6", text: "유네스코는 세종대왕 문해상을 수여하여 한글 창제 정신을 높이 평가하고 있다." },
    { id: "c7", text: "한글의 과학적 구조는 세계 대학에서 연구되고 디지털 입력에도 효율적이다." },
    { id: "c8", text: "한글은 과거의 소통 장벽을 허물고 현재와 미래에도 쓸모가 커지는 문화유산이다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// ─── 5. confirm (7개) ───
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "한글을 만든 사람은 누구인가요?",
      answerText: "세종대왕",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "세종대왕이 1443년에 만들어")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "한글의 자음은 무엇의 생김새를 본떠 만들었나요?",
      answerText: "발음 기관",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "발음 기관의 생김새를 본떠")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "한글을 반대한 일부 학자들이 올바른 글이라 여긴 것은 무엇인가요?",
      answerText: "한자",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "한자만이 올바른 글이라 여겼고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "한자 교육을 받기 어려웠지만 한글 덕분에 글을 익힌 사람들의 예는 누구인가요?",
      answerText: "여성이나 하층민",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "여성이나 하층민처럼")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "유네스코가 문맹 퇴치에 이바지한 사람에게 수여하는 상의 이름은 무엇인가요?",
      answerText: "세종대왕 문해상",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "세종대왕 문해상")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "디지털 시대에 한글이 효율적인 이유는 어떤 방식 덕분인가요?",
      answerText: "자음과 모음의 조합 방식",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "자음과 모음의 조합 방식 덕분에")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "글의 마지막에서 한글을 무엇이라 부르고 있나요?",
      answerText: "문화유산",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "자랑스러운 문화유산이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

// ─── 6. 콘텐츠 조립 ───
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

// ─── 7. 배치 파일 업데이트 ───
const batchPath = path.join('C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지\\generated\\daily-batch-reading-frege3.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
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
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');

// ─── 8. static 파일 ───
const staticPath = path.join('C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지\\frontend\\public\\daily-reading\\frege3', '015.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log('Day 15 완료! 지문 길이:', totalLen, '자');
console.log('intensive steps:', timeline.length);
console.log('recall cards:', recall.cards.length);
console.log('confirm questions:', confirm.questions.length);
