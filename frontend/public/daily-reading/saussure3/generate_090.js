const fs = require('fs');
const path = require('path');

const title = "[소쉬르3] 지문 문학작품 - 기행문 쓰기";

const p1_sentences = [
  "기행문은 여행을 다녀와서 보고 듣고 느낀 점을 적는 글이에요.",
  "여행의 출발부터 도착까지 어떤 일이 있었는지 시간 순서대로 쓰는 것이 좋아요.",
  "특별히 기억에 남는 장소나 사건을 자세하게 표현하면 더욱 생생한 기행문이 완성된답니다."
];

const p2_sentences = [
  "기행문을 쓸 때는 여정, 견문, 감상이라는 세 가지 요소가 꼭 들어가야 해요.",
  "여정은 여행한 장소와 시간을 말하고, 견문은 그곳에서 새롭게 보고 들은 것을 뜻해요.",
  "감상은 여행하면서 내 마음속에 떠오른 생각이나 느낌을 적는 부분이에요."
];

const p3_sentences = [
  "여행을 하면서 작은 수첩에 메모를 해두면 기행문을 쓸 때 큰 도움이 돼요.",
  "사진을 찍거나 입장권을 모아두는 것도 좋은 방법이랍니다.",
  "이렇게 남겨둔 기록을 바탕으로 솔직하게 글을 쓰면 나만의 멋진 기행문이 만들어져요."
];

const paragraphs = [
  { id: "p1", text: p1_sentences.join(" "), sentences: p1_sentences },
  { id: "p2", text: p2_sentences.join(" "), sentences: p2_sentences },
  { id: "p3", text: p3_sentences.join(" "), sentences: p3_sentences }
];

function findRange(pId, sentenceText) {
  const p = paragraphs.find(x => x.id === pId);
  const start = p.text.indexOf(sentenceText);
  if (start === -1) throw new Error("Sentence not found: " + sentenceText);
  return {
    paragraphId: pId,
    start: start,
    end: start + sentenceText.length - 1
  };
}

function findSubRange(pId, subText) {
  const p = paragraphs.find(x => x.id === pId);
  const start = p.text.indexOf(subText);
  if (start === -1) throw new Error("SubText not found: " + subText);
  return {
    paragraphId: pId,
    start: start,
    end: start + subText.length - 1
  };
}

const intensiveTimeline = [];
let stepIdx = 1;

// P1
intensiveTimeline.push({
  stepId: `step${stepIdx++}`,
  highlight: { ranges: [findRange("p1", p1_sentences[0])] },
  question: {
    prompt: "기행문은 어떤 글인가요?",
    choices: [
      { id: "A", text: "여행 경험을 적는 글" },
      { id: "B", text: "물건을 설명하는 글" },
      { id: "C", text: "친구를 칭찬하는 글" },
      { id: "D", text: "요리법을 알려주는 글" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 4, wrongDeltaSec: -2, eliminateWrongChoice: true }
  }
});

intensiveTimeline.push({
  stepId: `step${stepIdx++}`,
  highlight: { ranges: [findRange("p1", p1_sentences[1])] },
  question: {
    prompt: "어떤 순서로 쓰는 게 좋나요?",
    choices: [
      { id: "A", text: "시간 순서대로" },
      { id: "B", text: "장소의 크기대로" },
      { id: "C", text: "이름의 순서대로" },
      { id: "D", text: "좋아하는 순서대로" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 4, wrongDeltaSec: -2, eliminateWrongChoice: true }
  }
});

intensiveTimeline.push({
  stepId: `step${stepIdx++}`,
  highlight: { ranges: [findRange("p1", p1_sentences[2])] },
  question: {
    prompt: "생생한 기행문을 만들려면?",
    choices: [
      { id: "A", text: "기억에 남는 것을 자세히" },
      { id: "B", text: "모든 것을 짧게 쓰기" },
      { id: "C", text: "다른 사람 글을 베끼기" },
      { id: "D", text: "어려운 단어를 많이 쓰기" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 4, wrongDeltaSec: -2, eliminateWrongChoice: true }
  }
});

intensiveTimeline.push({
  stepId: `step${stepIdx++}`,
  highlight: { ranges: [{ paragraphId: "p1", start: 0, end: paragraphs[0].text.length - 1 }] },
  question: {
    prompt: "1문단의 중심 내용은 무엇일까요?",
    choices: [
      { id: "A", text: "기행문의 뜻과 쓰는 방법" },
      { id: "B", text: "여행을 떠나는 여러 방법" },
      { id: "C", text: "여행지에서 지켜야 할 예절" },
      { id: "D", text: "재미있는 여행지 추천하기" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 5, wrongDeltaSec: -3, eliminateWrongChoice: true }
  }
});

// P2
intensiveTimeline.push({
  stepId: `step${stepIdx++}`,
  highlight: { ranges: [findRange("p2", p2_sentences[0])] },
  question: {
    prompt: "기행문의 세 가지 요소는?",
    choices: [
      { id: "A", text: "여정, 견문, 감상" },
      { id: "B", text: "제목, 날짜, 날씨" },
      { id: "C", text: "서론, 본론, 결론" },
      { id: "D", text: "원인, 결과, 해결" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 4, wrongDeltaSec: -2, eliminateWrongChoice: true }
  }
});

intensiveTimeline.push({
  stepId: `step${stepIdx++}`,
  highlight: { ranges: [findRange("p2", p2_sentences[1])] },
  question: {
    prompt: "견문은 무엇을 뜻하나요?",
    choices: [
      { id: "A", text: "새롭게 보고 들은 것" },
      { id: "B", text: "여행한 장소와 시간" },
      { id: "C", text: "마음속의 생각과 느낌" },
      { id: "D", text: "여행을 가고 싶은 이유" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 4, wrongDeltaSec: -2, eliminateWrongChoice: true }
  }
});

intensiveTimeline.push({
  stepId: `step${stepIdx++}`,
  highlight: { ranges: [findRange("p2", p2_sentences[2])] },
  question: {
    prompt: "감상은 무엇을 적는 것일까요?",
    choices: [
      { id: "A", text: "생각이나 느낌" },
      { id: "B", text: "여행지의 날씨" },
      { id: "C", text: "교통수단의 종류" },
      { id: "D", text: "함께 간 사람들의 이름" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 4, wrongDeltaSec: -2, eliminateWrongChoice: true }
  }
});

intensiveTimeline.push({
  stepId: `step${stepIdx++}`,
  highlight: { ranges: [{ paragraphId: "p2", start: 0, end: paragraphs[1].text.length - 1 }] },
  question: {
    prompt: "2문단의 중심 내용은 무엇일까요?",
    choices: [
      { id: "A", text: "기행문에 꼭 들어갈 요소" },
      { id: "B", text: "여정을 정하는 구체적 방법" },
      { id: "C", text: "감상을 잘 표현하는 방법" },
      { id: "D", text: "견문을 넓히는 다양한 독서" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 5, wrongDeltaSec: -3, eliminateWrongChoice: true }
  }
});

// P3
intensiveTimeline.push({
  stepId: `step${stepIdx++}`,
  highlight: { ranges: [findRange("p3", p3_sentences[0])] },
  question: {
    prompt: "기행문을 쓸 때 도움 되는 것은?",
    choices: [
      { id: "A", text: "수첩에 메모하기" },
      { id: "B", text: "맛있는 음식 먹기" },
      { id: "C", text: "일찍 잠자리에 들기" },
      { id: "D", text: "편안한 옷차림 하기" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 4, wrongDeltaSec: -2, eliminateWrongChoice: true }
  }
});

intensiveTimeline.push({
  stepId: `step${stepIdx++}`,
  highlight: { ranges: [findRange("p3", p3_sentences[1])] },
  question: {
    prompt: "또 다른 좋은 방법은 무엇일까요?",
    choices: [
      { id: "A", text: "사진과 입장권 모으기" },
      { id: "B", text: "비싼 기념품 사기" },
      { id: "C", text: "친구들과 게임하기" },
      { id: "D", text: "음악을 크게 듣기" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 4, wrongDeltaSec: -2, eliminateWrongChoice: true }
  }
});

intensiveTimeline.push({
  stepId: `step${stepIdx++}`,
  highlight: { ranges: [findRange("p3", p3_sentences[2])] },
  question: {
    prompt: "기행문을 멋지게 완성하려면?",
    choices: [
      { id: "A", text: "솔직하게 글 쓰기" },
      { id: "B", text: "과장해서 재미있게 쓰기" },
      { id: "C", text: "다른 사람에게 부탁하기" },
      { id: "D", text: "그림만 많이 그려 넣기" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 4, wrongDeltaSec: -2, eliminateWrongChoice: true }
  }
});

intensiveTimeline.push({
  stepId: `step${stepIdx++}`,
  highlight: { ranges: [{ paragraphId: "p3", start: 0, end: paragraphs[2].text.length - 1 }] },
  question: {
    prompt: "3문단의 중심 내용은 무엇일까요?",
    choices: [
      { id: "A", text: "기행문 쓰기에 도움이 되는 것" },
      { id: "B", text: "메모를 잘하는 여러 가지 비법" },
      { id: "C", text: "사진을 예쁘게 찍는 방법" },
      { id: "D", text: "여행 기념품을 보관하는 방법" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 5, wrongDeltaSec: -3, eliminateWrongChoice: true }
  }
});

const json = {
  contentId: "dr-saussure3-090",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: title,
  description: "기행문 쓰기에 대한 일일 독해 콘텐츠",
  targetLevel: "SAUSSURE_3",
  schoolGradeRange: { min: 3, max: 4 },
  area: "문학",
  subArea: "지문 문학작품",
  competencies: ["어휘력", "독해력", "추론능력"],
  tags: ["기행문", "글쓰기", "여행"],
  access: { mode: "FREE" },
  seedReward: { seedType: "GOLDEN_SEED", count: 15, multiplier: 1.0 },
  timeLimitSec: 300,
  assets: {},
  payload: {
    passage: {
      format: "TEXT",
      paragraphs: paragraphs.map(p => ({ id: p.id, text: p.text }))
    },
    intensive: {
      timeline: intensiveTimeline
    },
    recall: {
      cards: [
        { id: "c1", text: "기행문은 여행 경험을 적는 글" },
        { id: "c2", text: "시간 순서대로 쓰는 것이 좋음" },
        { id: "c3", text: "기행문의 요소는 여정 견문 감상" },
        { id: "c4", text: "새롭게 보고 들은 것은 견문" },
        { id: "c5", text: "수첩에 메모하면 쓰기에 도움" },
        { id: "c6", text: "솔직하게 쓰면 나만의 기행문 완성" }
      ],
      correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6"],
      seedPenalty: -1
    },
    confirm: {
      questions: [
        {
          id: "q1",
          prompt: "여정은 여행한 장소와 무엇을 말할까요?",
          answerText: "시간",
          answerMatchMode: "CONTAINS",
          answerRanges: [findSubRange("p2", "시간")],
          scoring: { correctDeltaSec: 10, wrongDeltaSec: -5 },
          revealOnWrong: true
        },
        {
          id: "q2",
          prompt: "여행하면서 내 마음속에 떠오른 생각이나 느낌을 적는 부분은 무엇인가요?",
          answerText: "감상",
          answerMatchMode: "CONTAINS",
          answerRanges: [findSubRange("p2", "감상")],
          scoring: { correctDeltaSec: 10, wrongDeltaSec: -5 },
          revealOnWrong: true
        },
        {
          id: "q3",
          prompt: "기행문을 쓸 때 무엇에 메모를 해두면 큰 도움이 될까요?",
          answerText: "수첩",
          answerMatchMode: "CONTAINS",
          answerRanges: [findSubRange("p3", "수첩")],
          scoring: { correctDeltaSec: 10, wrongDeltaSec: -5 },
          revealOnWrong: true
        }
      ]
    }
  }
};

const fsPath = "C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지-daily-reading\\frontend\\public\\daily-reading\\saussure3\\090.json";
fs.writeFileSync(fsPath, JSON.stringify(json, null, 2), "utf8");
console.log("Written successfully to: " + fsPath);
