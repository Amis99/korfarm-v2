// Day 8 - LITERATURE (문학) - 러셀3
// 소설 지문: 첫 무대 - 용기와 자아 발견에 대한 이야기

const paragraphs = [
  {
    id: "p1",
    text: "중학교 이 학년이 된 지호는 평소 말수가 적고 사람들 앞에 나서는 것을 극도로 꺼리는 내성적인 아이였다. 수업 시간에 발표를 하라는 선생님의 말씀에 얼굴이 빨갛게 달아오르곤 했고, 쉬는 시간에도 친구들 앞에서 농담을 던지는 일이 거의 없었다. 그런 지호에게 어느 날 담임 선생님이 다가오시더니, 다음 달에 열리는 학교 축제에서 연극 무대에 서 보지 않겠느냐고 제안하셨다. 지호는 순간 심장이 멈추는 것 같았지만, 선생님의 진지하고 따뜻한 눈빛 앞에서 차마 거절의 말을 꺼내지 못하고 어물어물 고개를 끄덕이고 말았다."
  },
  {
    id: "p2",
    text: "연습이 시작되자 지호의 고민은 더욱 깊어졌다. 대사를 외우는 것 자체는 어렵지 않았지만, 다른 아이들 앞에서 큰 소리로 감정을 실어 말하는 것은 전혀 다른 차원의 문제였다. 처음 몇 번의 연습에서 지호의 목소리는 모기 소리만큼 작았고, 손은 대본을 잡은 채로 부들부들 떨렸다. 함께 연극을 준비하는 친구 수민이가 지호의 곁에 다가와 차분하게 말했다. 수민이는 처음부터 잘하는 사람은 없으며, 틀려도 괜찮으니 일단 한번 크게 소리를 질러 보라고 격려해 주었다. 지호는 수민이의 말에 용기를 얻어 깊은 숨을 들이쉬고는 처음으로 온 힘을 다해 대사를 외쳤다."
  },
  {
    id: "p3",
    text: "그날 이후로 매일 방과 후 연습에 참여하면서 지호에게는 조금씩 변화가 일어나기 시작했다. 연습을 거듭할수록 목소리는 점점 단단해졌고, 딱딱하기만 했던 대사에 자연스러운 감정을 담을 수 있게 되었다. 무대 위에서의 동선과 표정 연기도 처음보다 훨씬 자연스럽고 여유로워졌다. 무엇보다 크게 달라진 것은 지호의 마음가짐이었는데, 처음에는 실수할까 두려워하기만 했던 지호가 이제는 어떻게 하면 관객을 더 잘 몰입시킬 수 있을지를 진지하게 고민하게 되었다. 연습 때마다 자신의 연기를 되돌아보며 부족한 점을 하나씩 보완해 나가는 과정에서 지호는 꾸준한 노력의 보람을 비로소 실감할 수 있었다."
  },
  {
    id: "p4",
    text: "마침내 모두가 기다리던 축제 당일이 밝았다. 무대 뒤에서 대기하던 지호의 손바닥에는 축축한 땀이 배어 있었지만, 예전처럼 도망치고 싶다는 생각은 들지 않았다. 조명이 환하게 켜지고 지호가 무대 한가운데 올라서는 순간, 객석에 빼곡히 앉아 있는 사람들의 시선이 한꺼번에 쏟아졌다. 지호는 잠시 숨을 고르고 첫 대사를 힘차게 내뱉었다. 공연이 끝난 뒤 객석에서 쏟아지는 뜨거운 박수 소리를 들으며, 지호는 떨리는 다리로 무대 위에 서서 생각했다. 가장 두려운 일에 맞서 본 경험이야말로 자신을 가장 크게 성장시켜 주었다는 것을, 이 무대가 자신에게 가르쳐 준 가장 값진 교훈이라는 것을 말이다."
  }
];

const totalLength = paragraphs.reduce((sum, p) => sum + p.text.length, 0);
console.log(`총 글자수: ${totalLength}`);
if (totalLength < 1250 || totalLength > 1350) {
  console.warn(`경고: 목표 범위(1250~1350)를 벗어남!`);
}

function findRange(paragraphId, searchText) {
  const para = paragraphs.find(p => p.id === paragraphId);
  if (!para) throw new Error(`문단 ${paragraphId}을 찾을 수 없음`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}"을(를) ${paragraphId}에서 찾을 수 없음`);
  return { paragraphId, start, end: start + searchText.length };
}

function splitSentences(text) {
  const sentences = [];
  const regex = /[.?!](?:\s|$)/g;
  let start = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const end = match.index + 1;
    const sent = text.substring(start, end).trim();
    if (sent) {
      const actualStart = text.indexOf(sent, start);
      sentences.push({ start: actualStart, end: actualStart + sent.length, text: sent });
    }
    start = match.index + match[0].length;
  }
  if (start < text.length) {
    const remaining = text.substring(start).trim();
    if (remaining) {
      const actualStart = text.indexOf(remaining, start);
      sentences.push({ start: actualStart, end: actualStart + remaining.length, text: remaining });
    }
  }
  return sentences;
}

const paragraphSentences = {};
for (const para of paragraphs) {
  const sentences = splitSentences(para.text);
  paragraphSentences[para.id] = sentences;
  console.log(`${para.id}: ${sentences.length}문장, 길이: ${para.text.length}자`);
}

const timeline = [];
let stepCount = 0;

const questionData = {
  p1: [
    {
      prompt: "첫 문장에서 지호의 성격으로 알맞은 것은?",
      choices: [
        { id: "A", text: "말수가 적고 사람들 앞에 나서기를 극도로 꺼리는 성격이다." },
        { id: "B", text: "활발하고 사교적이어서 친구가 아주 많은 편이다." },
        { id: "C", text: "공부를 잘하지만 운동은 전혀 하지 않는 성격이다." },
        { id: "D", text: "장난을 좋아하며 수업 시간에 자주 떠드는 편이다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장에서 지호가 발표할 때의 반응으로 알맞은 것은?",
      choices: [
        { id: "A", text: "얼굴이 빨갛게 달아올랐고 친구들 앞에서 농담도 하지 못했다." },
        { id: "B", text: "자신감 있게 발표하여 선생님의 칭찬을 받았다." },
        { id: "C", text: "발표 대신 보고서를 제출하겠다고 제안했다." },
        { id: "D", text: "친구들을 웃기며 분위기를 주도했다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장에서 선생님이 지호에게 한 제안으로 알맞은 것은?",
      choices: [
        { id: "A", text: "학교 축제에서 연극 무대에 서 보지 않겠느냐고 제안하셨다." },
        { id: "B", text: "학교 합창단에 들어가라고 권유하셨다." },
        { id: "C", text: "학교 신문 기자로 활동해 보라고 하셨다." },
        { id: "D", text: "학교 체육대회에 선수로 나가라고 하셨다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장에서 지호의 반응으로 알맞은 것은?",
      choices: [
        { id: "A", text: "거절하지 못하고 어물어물 고개를 끄덕이고 말았다." },
        { id: "B", text: "기쁜 마음으로 즉시 수락했다." },
        { id: "C", text: "단호하게 거절하고 교실을 나갔다." },
        { id: "D", text: "내일까지 생각해 보겠다고 답했다." }
      ],
      answerId: "A"
    },
    // 중심내용
    {
      prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "소심한 지호가 선생님의 제안으로 연극 무대에 서게 되었다." },
        { id: "B", text: "지호가 친구들과 함께 축제 준비를 즐겁게 시작했다." },
        { id: "C", text: "지호가 스스로 연극부에 지원하여 합격했다." },
        { id: "D", text: "선생님이 반 전체에게 연극 참여를 강제했다." }
      ],
      answerId: "A"
    }
  ],
  p2: [
    {
      prompt: "첫 문장에서 연습이 시작된 뒤 지호의 상태로 알맞은 것은?",
      choices: [
        { id: "A", text: "고민이 더욱 깊어졌다." },
        { id: "B", text: "자신감이 넘쳐 즐거웠다." },
        { id: "C", text: "연극을 포기하기로 결심했다." },
        { id: "D", text: "다른 역할로 바꿔 달라고 요청했다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장에서 지호가 어려움을 느낀 부분으로 알맞은 것은?",
      choices: [
        { id: "A", text: "다른 아이들 앞에서 큰 소리로 감정을 실어 말하는 것이다." },
        { id: "B", text: "대사를 외우는 것이 지나치게 어려웠다." },
        { id: "C", text: "연극 의상이 불편하여 움직이기 힘들었다." },
        { id: "D", text: "무대 장치를 설치하는 작업이 힘들었다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장에서 초기 연습 때 지호의 모습으로 알맞은 것은?",
      choices: [
        { id: "A", text: "목소리가 모기만큼 작고 손이 부들부들 떨렸다." },
        { id: "B", text: "큰 소리로 대사를 완벽하게 소화했다." },
        { id: "C", text: "대사를 잊어버려 대본을 계속 읽었다." },
        { id: "D", text: "다른 친구의 대사까지 외워서 도와주었다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장에서 수민이가 지호에게 한 행동으로 알맞은 것은?",
      choices: [
        { id: "A", text: "지호의 곁에 다가와 차분하게 말해 주었다." },
        { id: "B", text: "지호에게 연극을 그만두라고 충고했다." },
        { id: "C", text: "선생님께 지호를 교체해 달라고 부탁했다." },
        { id: "D", text: "지호 대신 무대에 서겠다고 자원했다." }
      ],
      answerId: "A"
    },
    {
      prompt: "다섯째 문장에서 수민이가 지호에게 한 격려로 알맞은 것은?",
      choices: [
        { id: "A", text: "처음부터 잘하는 사람은 없으니 크게 소리를 질러 보라고 했다." },
        { id: "B", text: "연기를 잘 못하면 다른 역할을 맡으라고 했다." },
        { id: "C", text: "관객 없이 혼자서만 연습하라고 권했다." },
        { id: "D", text: "대사를 줄여 달라고 선생님께 건의하자고 했다." }
      ],
      answerId: "A"
    },
    {
      prompt: "여섯째 문장에서 지호의 행동으로 알맞은 것은?",
      choices: [
        { id: "A", text: "용기를 얻어 깊은 숨을 쉬고 온 힘을 다해 대사를 외쳤다." },
        { id: "B", text: "수민이의 말에도 불구하고 여전히 작은 소리로 읽었다." },
        { id: "C", text: "연습을 그만두고 집으로 돌아갔다." },
        { id: "D", text: "선생님에게 역할을 바꿔 달라고 부탁했다." }
      ],
      answerId: "A"
    },
    // 중심내용
    {
      prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "연습 초기에 어려움을 겪던 지호가 수민이의 격려로 용기를 냈다." },
        { id: "B", text: "지호가 연습 첫날부터 뛰어난 연기력을 보여 주었다." },
        { id: "C", text: "수민이가 지호 대신 주연을 맡게 되었다." },
        { id: "D", text: "선생님이 지호를 연극에서 제외시켰다." }
      ],
      answerId: "A"
    }
  ],
  p3: [
    {
      prompt: "첫 문장에서 지호에게 일어난 변화로 알맞은 것은?",
      choices: [
        { id: "A", text: "그날 이후로 조금씩 변화가 일어나기 시작했다." },
        { id: "B", text: "지호가 연극을 포기하고 다른 활동을 시작했다." },
        { id: "C", text: "지호에게 아무런 변화가 나타나지 않았다." },
        { id: "D", text: "지호가 갑자기 완벽한 배우로 변신했다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장에서 연습을 거듭한 결과로 알맞은 것은?",
      choices: [
        { id: "A", text: "목소리가 단단해지고 대사에 자연스러운 감정을 담게 되었다." },
        { id: "B", text: "목소리는 여전히 작았지만 동작만 나아졌다." },
        { id: "C", text: "감정 표현은 좋아졌으나 대사를 자주 잊었다." },
        { id: "D", text: "연습을 많이 해도 달라진 점이 없었다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장에서 추가로 나아진 부분으로 알맞은 것은?",
      choices: [
        { id: "A", text: "무대 위 동선과 표정 연기가 훨씬 자연스러워졌다." },
        { id: "B", text: "무대 위에서 춤을 추는 기술이 늘었다." },
        { id: "C", text: "무대 장치를 직접 설계하게 되었다." },
        { id: "D", text: "다른 친구들의 대사까지 모두 외우게 되었다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장에서 가장 크게 달라진 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "실수 두려움 대신 관객 몰입을 고민하는 마음가짐으로 바뀌었다." },
        { id: "B", text: "지호가 다른 배우들의 연기를 비평하게 되었다." },
        { id: "C", text: "연극보다 음악에 더 관심을 갖게 되었다." },
        { id: "D", text: "무대보다 무대 뒤 스태프 역할을 원하게 되었다." }
      ],
      answerId: "A"
    },
    {
      prompt: "다섯째 문장에서 지호가 실감한 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "자신의 연기를 되돌아보며 보완하는 과정에서 노력의 보람을 느꼈다." },
        { id: "B", text: "연극보다 공부가 더 중요하다는 것을 깨달았다." },
        { id: "C", text: "연기가 자신의 재능이 아니라는 사실을 인정했다." },
        { id: "D", text: "다른 친구들의 도움 없이는 아무것도 못 한다고 느꼈다." }
      ],
      answerId: "A"
    },
    // 중심내용
    {
      prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "지호가 연습을 거듭하며 연기력과 마음가짐 모두에서 성장했다." },
        { id: "B", text: "지호가 연극 연습에 지쳐 포기할 뻔했다." },
        { id: "C", text: "선생님이 지호의 역할을 더 작은 것으로 바꿔 주셨다." },
        { id: "D", text: "수민이가 지호보다 더 뛰어난 연기를 선보였다." }
      ],
      answerId: "A"
    }
  ],
  p4: [
    {
      prompt: "첫 문장에서 축제 당일 지호의 상태로 알맞은 것은?",
      choices: [
        { id: "A", text: "손바닥에 땀이 배었지만 도망치고 싶지는 않았다." },
        { id: "B", text: "긴장이 전혀 없이 여유로운 상태였다." },
        { id: "C", text: "너무 긴장하여 무대에 올라가지 못했다." },
        { id: "D", text: "아파서 병원에 가야 할 정도였다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장에서 조명이 켜진 뒤 상황으로 알맞은 것은?",
      choices: [
        { id: "A", text: "객석 사람들의 시선이 한꺼번에 지호에게 쏟아졌다." },
        { id: "B", text: "객석이 텅 비어 있어 지호가 실망했다." },
        { id: "C", text: "조명이 고장 나서 공연이 중단되었다." },
        { id: "D", text: "관객들이 모두 다른 곳을 보고 있었다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장에서 지호의 행동으로 알맞은 것은?",
      choices: [
        { id: "A", text: "숨을 고르고 첫 대사를 힘차게 내뱉었다." },
        { id: "B", text: "대사를 잊어버려 무대 뒤로 도망갔다." },
        { id: "C", text: "너무 긴장하여 아무 말도 하지 못했다." },
        { id: "D", text: "수민이가 대신 첫 대사를 말해 주었다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장에서 공연 후 상황으로 알맞은 것은?",
      choices: [
        { id: "A", text: "쏟아지는 박수 소리를 들으며 떨리는 다리로 무대에 서 있었다." },
        { id: "B", text: "관객들이 조용히 자리를 떠났다." },
        { id: "C", text: "선생님이 공연이 실패했다고 말씀하셨다." },
        { id: "D", text: "지호가 무대에서 넘어져 다쳤다." }
      ],
      answerId: "A"
    },
    {
      prompt: "다섯째 문장에서 지호가 깨달은 교훈으로 알맞은 것은?",
      choices: [
        { id: "A", text: "가장 두려운 일에 맞서 본 경험이 자신을 가장 크게 성장시켰다." },
        { id: "B", text: "연극은 재능이 있는 사람만 해야 한다는 것이다." },
        { id: "C", text: "앞으로는 사람들 앞에 나서지 않겠다는 다짐이다." },
        { id: "D", text: "혼자서는 아무것도 해낼 수 없다는 교훈이다." }
      ],
      answerId: "A"
    },
    // 중심내용
    {
      prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "축제 무대에서 성공적으로 공연하며 두려움에 맞선 성장의 가치를 깨달았다." },
        { id: "B", text: "지호가 무대에서 실수하여 큰 좌절감을 느꼈다." },
        { id: "C", text: "축제가 취소되어 공연을 하지 못했다." },
        { id: "D", text: "지호가 연극 배우가 되기로 직업을 결정했다." }
      ],
      answerId: "A"
    }
  ]
};

for (const para of paragraphs) {
  const sentences = paragraphSentences[para.id];
  const questions = questionData[para.id];

  for (let i = 0; i < sentences.length; i++) {
    stepCount++;
    timeline.push({
      stepId: `s${stepCount}`,
      highlight: {
        ranges: [{ paragraphId: para.id, start: sentences[i].start, end: sentences[i].end }]
      },
      question: {
        ...questions[i],
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }

  stepCount++;
  const paraEnd = sentences[sentences.length - 1].end;
  timeline.push({
    stepId: `s${stepCount}`,
    highlight: {
      ranges: [{ paragraphId: para.id, start: 0, end: paraEnd }]
    },
    question: {
      ...questions[questions.length - 1],
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

const recallCards = [
  { id: "c1", text: "소심한 지호는 선생님의 제안으로 학교 축제 연극 무대에 서게 되었다." },
  { id: "c2", text: "연습 초기에 지호는 목소리가 작고 손이 떨려 대사를 제대로 하지 못했다." },
  { id: "c3", text: "친구 수민이가 틀려도 괜찮으니 크게 소리를 질러 보라고 격려해 주었다." },
  { id: "c4", text: "수민이의 격려에 힘입어 지호는 처음으로 온 힘을 다해 대사를 외쳤다." },
  { id: "c5", text: "연습을 거듭하며 목소리가 단단해지고 감정 표현도 자연스러워졌다." },
  { id: "c6", text: "실수 두려움 대신 관객 몰입을 고민하는 마음가짐으로 변화했다." },
  { id: "c7", text: "축제 당일 무대에서 첫 대사를 힘차게 내뱉었고 박수갈채를 받았다." },
  { id: "c8", text: "가장 두려운 일에 맞선 경험이 자신을 가장 크게 성장시켰음을 깨달았다." }
];

const confirmQuestions = [
  {
    id: "q1",
    prompt: "담임 선생님이 지호에게 한 제안은 무엇이었는가?",
    answerText: "학교 축제에서 연극 무대에 서 보지 않겠느냐",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p1", "학교 축제에서 연극 무대에 서 보지 않겠느냐고 제안하셨다")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q2",
    prompt: "연습 초기에 지호의 목소리는 어떤 상태였는가?",
    answerText: "모기 소리만큼 작았다",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p2", "목소리는 모기 소리만큼 작았고")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q3",
    prompt: "지호에게 용기를 준 친구의 이름은 무엇인가?",
    answerText: "수민",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p2", "수민이가 지호의 곁에 다가와 차분하게 말했다")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q4",
    prompt: "연습을 거듭하며 달라진 지호의 마음가짐은 어떤 것인가?",
    answerText: "관객을 더 잘 몰입시킬 수 있을지를 고민하게 되었다",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p3", "어떻게 하면 관객을 더 잘 몰입시킬 수 있을지를 진지하게 고민하게 되었다")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q5",
    prompt: "축제 당일 무대 뒤에서 지호의 손바닥에 배어 있던 것은 무엇인가?",
    answerText: "축축한 땀",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p4", "축축한 땀이 배어 있었지만")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q6",
    prompt: "공연이 끝난 뒤 지호에게 쏟아진 것은 무엇인가?",
    answerText: "박수 소리",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p4", "쏟아지는 뜨거운 박수 소리를 들으며")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q7",
    prompt: "지호가 이 무대를 통해 깨달은 교훈은 무엇인가?",
    answerText: "가장 두려운 일에 맞서 본 경험이 자신을 가장 크게 성장시켜 주었다",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p4", "가장 두려운 일에 맞서 본 경험이야말로 자신을 가장 크게 성장시켜 주었다는 것")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  }
];

const content = {
  contentId: "dr-r3-008",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 3) Day 8 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_3",
  schoolGradeRange: { min: 9, max: 10 },
  area: "READING",
  subArea: "LITERATURE",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300,
  assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: {
      cards: recallCards,
      correctOrder: recallCards.map(c => c.id),
      seedPenalty: 1
    },
    confirm: { questions: confirmQuestions }
  }
};

// 검증
console.log(`\n=== 검증 ===`);
console.log(`intensive steps: ${timeline.length}`);
console.log(`recall cards: ${recallCards.length}`);
console.log(`confirm questions: ${confirmQuestions.length}`);

let errors = 0;
for (const step of timeline) {
  for (const range of step.highlight.ranges) {
    const para = paragraphs.find(p => p.id === range.paragraphId);
    if (range.start < 0 || range.end > para.text.length || range.start >= range.end) {
      console.error(`오류: ${step.stepId} - 범위 초과 (${range.start}-${range.end}, 문단 길이: ${para.text.length})`);
      errors++;
    }
  }
}

for (const q of confirmQuestions) {
  for (const range of q.answerRanges) {
    const para = paragraphs.find(p => p.id === range.paragraphId);
    if (range.start < 0 || range.end > para.text.length) {
      console.error(`오류: ${q.id} - answerRange 범위 초과`);
      errors++;
    }
    console.log(`  ${q.id}: "${para.text.substring(range.start, range.end)}"`);
  }
}

if (errors === 0) console.log(`\n모든 검증 통과!`);
else { console.error(`\n${errors}개 오류 발견!`); process.exit(1); }

const fs = require('fs');
const outputPath = process.argv[2] || 'day8-output.json';
fs.writeFileSync(outputPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\n파일 저장: ${outputPath}`);
