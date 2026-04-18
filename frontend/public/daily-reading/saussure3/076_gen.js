const fs = require('fs');
const path = require('path');

const passage = [
  "인어공주는 마녀가 준 물약을 마시고 날카로운 고통을 느끼며 쓰러졌어요. 눈을 떴을 때 그녀는 바닷가에 있었고 왕자가 그녀를 바라보고 있었어요. 인어 꼬리 대신 아름다운 다리가 생겼지만, 걸을 때마다 유리 조각 위를 걷는 것처럼 아팠어요.",
  "그녀는 마녀에게 목소리를 주었기 때문에 아무 말도 할 수 없었어요. 왕자는 친절하게 그녀를 궁전으로 데려가 예쁜 옷을 주었어요. 그녀는 아픔을 참고 왕자를 위해 아름답게 춤을 추었지만, 왕자는 오직 자신을 구해준 소녀만 생각했어요.",
  "이웃 나라 공주와 결혼하라는 부모님의 말씀에 왕자는 이웃 나라로 갔어요. 왕자는 그 공주를 만나고 자신이 찾던 생명의 은인이라고 단단히 착각했어요. 왕자가 다른 사람과 결혼하면 물거품이 되어버린다는 사실에 인어공주는 가슴이 무너졌어요."
];

function findRange(pIndex, substr) {
  const text = passage[pIndex];
  const start = text.indexOf(substr);
  if (start === -1) throw new Error(`Substring not found: ${substr}`);
  return {
    paragraphId: `p${pIndex + 1}`,
    start: start,
    end: start + substr.length - 1
  };
}

const data = {
  contentId: "dr-saussure3-076",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "[문학] 인어공주 3부",
  description: "인어공주 동화의 세 번째 이야기입니다.",
  targetLevel: "SAUSSURE_3",
  schoolGradeRange: { min: 3, max: 4 },
  area: "LITERATURE",
  subArea: "FAIRY_TALE",
  competencies: ["READING_COMPREHENSION", "INFERENTIAL_THINKING"],
  tags: ["인어공주", "동화", "사랑", "희생", "문학"],
  access: { mode: "FREE" },
  seedReward: { seedType: "STAR_SEED", count: 15, multiplier: 1.0 },
  timeLimitSec: 300,
  assets: {},
  payload: {
    passage: {
      format: "TEXT",
      paragraphs: [
        { id: "p1", text: passage[0] },
        { id: "p2", text: passage[1] },
        { id: "p3", text: passage[2] }
      ]
    },
    intensive: {
      timeline: []
    },
    recall: {
      cards: [
        { id: "c1", text: "마녀의 물약을 마심" },
        { id: "c2", text: "다리가 생겼지만 아픔" },
        { id: "c3", text: "왕자를 만나 궁전에 감" },
        { id: "c4", text: "아픔을 참고 춤을 춤" },
        { id: "c5", text: "왕자가 이웃 공주와 만남" },
        { id: "c6", text: "물거품이 될 위기에 처함" }
      ],
      correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6"],
      seedPenalty: -2
    },
    confirm: {
      questions: []
    }
  }
};

const intensiveSteps = [
  {
    stepId: "step1",
    pIndex: 0,
    sub: "인어공주는 마녀가 준 물약을 마시고 날카로운 고통을 느끼며 쓰러졌어요.",
    q: "인어공주가 쓰러진 이유는 무엇인가요?",
    c: ["물약을 마시고 고통스러워서", "왕자가 갑자기 나타나서", "물거품이 되기 시작해서", "목소리를 잃어버려서"],
    a: "A"
  },
  {
    stepId: "step2",
    pIndex: 0,
    sub: "눈을 떴을 때 그녀는 바닷가에 있었고 왕자가 그녀를 바라보고 있었어요.",
    q: "눈을 뜬 인어공주는 누구를 보았나요?",
    c: ["자신을 바라보는 왕자", "마법을 건 바다 마녀", "걱정하는 인어 언니들", "이웃 나라의 아름다운 공주"],
    a: "A"
  },
  {
    stepId: "step3",
    pIndex: 0,
    sub: "인어 꼬리 대신 아름다운 다리가 생겼지만, 걸을 때마다 유리 조각 위를 걷는 것처럼 아팠어요.",
    q: "다리가 생긴 인어공주는 어땠나요?",
    c: ["걸을 때마다 몹시 아팠다", "아름다운 목소리로 노래했다", "가볍고 빠르게 뛰어다녔다", "바닷속을 전처럼 헤엄쳤다"],
    a: "A"
  },
  {
    stepId: "step4",
    pIndex: 0,
    sub: passage[0],
    q: "첫 번째 문단의 중심 내용은 무엇인가요?",
    c: ["고통을 참으며 다리를 얻은 인어공주", "마녀의 물약을 훔쳐 도망친 인어공주", "바닷가에서 왕자를 구해준 인어공주", "인어 꼬리로 돌아가고 싶은 인어공주"],
    a: "A"
  },
  {
    stepId: "step5",
    pIndex: 1,
    sub: "그녀는 마녀에게 목소리를 주었기 때문에 아무 말도 할 수 없었어요.",
    q: "인어공주가 말을 할 수 없는 이유는?",
    c: ["마녀에게 목소리를 주어서", "물약을 마신 부작용 때문에", "낯선 궁전이 너무 무서워서", "왕자가 말을 걸지 않아서"],
    a: "A"
  },
  {
    stepId: "step6",
    pIndex: 1,
    sub: "왕자는 친절하게 그녀를 궁전으로 데려가 예쁜 옷을 주었어요.",
    q: "왕자는 인어공주에게 어떻게 했나요?",
    c: ["궁전으로 데려가 옷을 줌", "정체를 의심하며 쫓아냈다", "인어라는 사실을 알아차렸다", "바다로 다시 돌려보내 주었다"],
    a: "A"
  },
  {
    stepId: "step7",
    pIndex: 1,
    sub: "그녀는 아픔을 참고 왕자를 위해 아름답게 춤을 추었지만, 왕자는 오직 자신을 구해준 소녀만 생각했어요.",
    q: "춤을 볼 때 왕자의 생각은?",
    c: ["자신을 구해준 다른 소녀", "춤을 추는 인어공주의 정체", "아름다운 이웃 나라의 공주", "바다에서 잃어버린 소중한 물건"],
    a: "A"
  },
  {
    stepId: "step8",
    pIndex: 1,
    sub: passage[1],
    q: "두 번째 문단의 중심 내용은 무엇인가요?",
    c: ["곁에 있어도 왕자의 마음을 얻지 못함", "아름다운 춤으로 왕자와 사랑에 빠짐", "목소리를 되찾고 왕자에게 고백함", "궁전 생활에 적응하지 못하고 떠남"],
    a: "A"
  },
  {
    stepId: "step9",
    pIndex: 2,
    sub: "이웃 나라 공주와 결혼하라는 부모님의 말씀에 왕자는 이웃 나라로 갔어요.",
    q: "왕자가 이웃 나라로 간 이유는?",
    c: ["부모님이 공주와 결혼하라 해서", "자신을 구해준 소녀를 찾기 위해", "인어공주의 고향을 구경하려고", "새로운 궁전을 짓기 위해서"],
    a: "A"
  },
  {
    stepId: "step10",
    pIndex: 2,
    sub: "왕자는 그 공주를 만나고 자신이 찾던 생명의 은인이라고 단단히 착각했어요.",
    q: "공주를 본 왕자의 착각은?",
    c: ["생명의 은인이라고 믿었다", "마녀가 변장한 모습이라 여겼다", "예전에 만난 적이 있다고 생각함", "인어공주의 친언니라고 믿었다"],
    a: "A"
  },
  {
    stepId: "step11",
    pIndex: 2,
    sub: "왕자가 다른 사람과 결혼하면 물거품이 되어버린다는 사실에 인어공주는 가슴이 무너졌어요.",
    q: "인어공주가 슬퍼한 이유는?",
    c: ["왕자가 다른 사람과 결혼해서", "바다로 다시 돌아갈 수 없어서", "마녀와의 약속을 어기게 되어서", "목소리를 영원히 잃게 되어서"],
    a: "A"
  },
  {
    stepId: "step12",
    pIndex: 2,
    sub: passage[2],
    q: "세 번째 문단의 중심 내용은 무엇인가요?",
    c: ["오해로 인해 위기에 빠진 인어공주", "이웃 나라 공주의 정체를 밝혀냄", "바다로 무사히 돌아간 인어공주", "왕자의 진심을 알고 기뻐하는 모습"],
    a: "A"
  }
];

const cIdMap = ["A", "B", "C", "D"];
intensiveSteps.forEach((s) => {
  const choices = s.c.map((text, idx) => ({ id: cIdMap[idx], text }));
  data.payload.intensive.timeline.push({
    stepId: s.stepId,
    highlight: {
      ranges: [findRange(s.pIndex, s.sub)]
    },
    question: {
      prompt: s.q,
      choices: choices,
      answerId: s.a,
      scoring: { correctDeltaSec: 5, wrongDeltaSec: -5, eliminateWrongChoice: true }
    }
  });
});

const confirmSteps = [
  {
    id: "cq1",
    pIndex: 0,
    ansSub: "유리 조각",
    q: "인어 꼬리 대신 아름다운 다리가 생겼지만, 인어공주는 걸을 때마다 무엇 위를 걷는 것처럼 아팠나요?",
    aTxt: "유리 조각",
    mode: "EXACT"
  },
  {
    id: "cq2",
    pIndex: 1,
    ansSub: "목소리",
    q: "인어공주는 마녀에게 무엇을 주었기 때문에 말을 할 수 없었나요?",
    aTxt: "목소리",
    mode: "INCLUDES"
  },
  {
    id: "cq3",
    pIndex: 2,
    ansSub: "공주",
    q: "왕자는 이웃 나라의 누구를 자신의 생명의 은인이라고 착각했나요?",
    aTxt: "공주",
    mode: "INCLUDES"
  }
];

confirmSteps.forEach(c => {
  data.payload.confirm.questions.push({
    id: c.id,
    prompt: c.q,
    answerText: c.aTxt,
    answerMatchMode: c.mode,
    answerRanges: [findRange(c.pIndex, c.ansSub)],
    scoring: { correctDeltaSec: 10, wrongDeltaSec: -5, eliminateWrongChoice: false },
    revealOnWrong: true
  });
});

const outputPath = 'C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지-daily-reading\\frontend\\public\\daily-reading\\saussure3\\076.json';
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('Successfully wrote to ' + outputPath);
