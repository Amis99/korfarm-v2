const fs = require('fs');
const path = require('path');

// ─── 1. 지문 정의 (문학 - 소설/동화) ───
const paragraphs = [
  {
    id: "p1",
    text: "열두 살 준이는 할머니 댁 뒤뜰에서 낡은 나침반 하나를 주웠다.유리 덮개에는 잔금이 가 있었고, 바늘은 북쪽을 가리킨 채 미세하게 떨리고 있었다.준이가 나침반을 손바닥에 올려놓자, 바늘이 갑자기 동쪽으로 확 꺾이더니 멈추었다.신기한 마음에 나침반이 가리키는 방향으로 걸어가자, 풀숲 사이에 이끼 낀 돌계단이 나타났다.계단 아래에는 작은 연못이 있었는데, 수면 위에 초록빛 이파리들이 빙글빙글 돌고 있었다.준이는 숨을 죽이고 연못 가장자리에 쪼그리고 앉아 물속을 들여다보았다.투명한 물 아래 조약돌 사이에서 은빛 물고기 한 마리가 꼬리를 흔들며 준이를 올려다보고 있었다."
  },
  {
    id: "p2",
    text: "준이가 손을 물 위로 뻗자, 물고기는 수면 가까이 떠올라 코를 내밀었다.그 순간 나침반의 바늘이 다시 돌아가기 시작하더니 남쪽을 가리키며 멈추었다.준이는 물고기에게 '너도 길을 알려 주는 거니?' 하고 속삭였다.물고기는 마치 대답이라도 하듯 꼬리를 세 번 탁탁 쳐서 물방울을 튀겼다.준이는 웃음을 터뜨리며 다시 나침반을 따라 남쪽으로 걸었다.덤불을 지나 커다란 떡갈나무 아래에 이르자, 나무 밑동에 오래된 편지 한 장이 돌로 눌려 있었다.누렇게 바랜 편지 봉투에는 할머니의 이름이 단정한 글씨로 적혀 있었다."
  },
  {
    id: "p3",
    text: "준이는 조심스럽게 편지를 꺼내 읽었다.편지에는 할머니가 어릴 때 이 연못에서 은빛 물고기와 놀던 이야기가 적혀 있었다.할머니도 똑같은 나침반으로 연못을 찾았고, 물고기에게 소원을 빌면 꼭 이루어진다고 믿었다는 내용이었다.준이는 가슴이 뛰었다.다시 연못으로 돌아가 물가에 무릎을 꿇고, 눈을 감은 채 작은 목소리로 소원을 빌었다.연못 위로 바람이 살랑 불어 이파리들이 하늘로 흩날렸고, 은빛 물고기는 한 바퀴 크게 원을 그리며 헤엄쳤다.준이는 나침반을 가슴에 품고 할머니 댁으로 돌아가며, 다음에 또 오겠다고 마음속으로 약속했다."
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
    prompt: "첫 문장에서 준이가 발견한 물건은 무엇인가요?",
    choices: [
      { id: "A", text: "할머니 댁 뒤뜰에서 낡은 나침반을 주웠다" },
      { id: "B", text: "할머니 댁 지붕에서 오래된 시계를 발견했다" },
      { id: "C", text: "학교 운동장에서 깨진 거울을 주웠다" },
      { id: "D", text: "숲속 동굴에서 보석 상자를 발견했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장은 나침반의 상태를 어떻게 묘사하나요?",
    choices: [
      { id: "A", text: "유리에 잔금이 있고 바늘이 북쪽을 가리키며 떨리고 있었다" },
      { id: "B", text: "유리가 깨끗하고 바늘이 멈춰 있었다" },
      { id: "C", text: "뚜껑이 없고 바늘도 빠져 있었다" },
      { id: "D", text: "새것처럼 반짝이고 바늘이 남쪽을 가리켰다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 나침반 바늘에 일어난 이상한 일은 무엇인가요?",
    choices: [
      { id: "A", text: "바늘이 갑자기 동쪽으로 확 꺾이더니 멈추었다" },
      { id: "B", text: "바늘이 빙빙 돌다가 떨어졌다" },
      { id: "C", text: "바늘이 사라져 버렸다" },
      { id: "D", text: "바늘이 서쪽으로 천천히 움직였다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 나침반을 따라가자 무엇이 나타났나요?",
    choices: [
      { id: "A", text: "풀숲 사이에 이끼 낀 돌계단이 나타났다" },
      { id: "B", text: "넓은 도로가 나타났다" },
      { id: "C", text: "높은 담장이 나타났다" },
      { id: "D", text: "깊은 동굴 입구가 나타났다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 계단 아래 연못의 모습은 어떠했나요?",
    choices: [
      { id: "A", text: "수면 위에 초록빛 이파리들이 빙글빙글 돌고 있었다" },
      { id: "B", text: "연못이 말라서 바닥이 드러나 있었다" },
      { id: "C", text: "물이 시커멓고 아무것도 보이지 않았다" },
      { id: "D", text: "연못 가득 물고기가 뛰어오르고 있었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 준이의 행동은 무엇인가요?",
    choices: [
      { id: "A", text: "숨을 죽이고 연못 가장자리에 앉아 물속을 들여다보았다" },
      { id: "B", text: "연못에 뛰어들어 헤엄을 쳤다" },
      { id: "C", text: "무서워서 뒤로 물러섰다" },
      { id: "D", text: "큰 소리로 할머니를 불렀다" }
    ],
    answerId: "A"
  },
  {
    prompt: "일곱째 문장에서 물속에 무엇이 있었나요?",
    choices: [
      { id: "A", text: "조약돌 사이에서 은빛 물고기가 준이를 올려다보고 있었다" },
      { id: "B", text: "커다란 자라가 헤엄치고 있었다" },
      { id: "C", text: "금빛 열쇠가 바닥에 놓여 있었다" },
      { id: "D", text: "아무것도 없이 깨끗한 모래만 있었다" }
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
      { id: "A", text: "준이가 낡은 나침반을 따라가 숨겨진 연못과 은빛 물고기를 발견한다" },
      { id: "B", text: "준이가 할머니와 함께 연못에서 낚시를 한다" },
      { id: "C", text: "준이가 나침반을 고쳐서 친구에게 선물한다" },
      { id: "D", text: "준이가 뒤뜰을 청소하다가 보물 상자를 발견한다" }
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
    prompt: "첫 문장에서 준이가 손을 뻗자 물고기가 어떻게 반응했나요?",
    choices: [
      { id: "A", text: "수면 가까이 떠올라 코를 내밀었다" },
      { id: "B", text: "깊은 곳으로 숨어 버렸다" },
      { id: "C", text: "준이의 손을 물었다" },
      { id: "D", text: "물 밖으로 뛰어올랐다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 나침반 바늘이 어느 방향을 가리켰나요?",
    choices: [
      { id: "A", text: "남쪽을 가리키며 멈추었다" },
      { id: "B", text: "동쪽을 가리키며 멈추었다" },
      { id: "C", text: "서쪽으로 빙빙 돌았다" },
      { id: "D", text: "북쪽으로 되돌아갔다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 준이가 물고기에게 한 말은 무엇인가요?",
    choices: [
      { id: "A", text: "'너도 길을 알려 주는 거니?' 하고 속삭였다" },
      { id: "B", text: "'너는 어디서 왔니?' 하고 물었다" },
      { id: "C", text: "'나를 따라와' 하고 소리쳤다" },
      { id: "D", text: "'무섭다' 하고 뒤로 물러났다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 물고기가 한 행동은 무엇인가요?",
    choices: [
      { id: "A", text: "꼬리를 세 번 탁탁 쳐서 물방울을 튀겼다" },
      { id: "B", text: "물속 깊이 가라앉았다" },
      { id: "C", text: "준이 손 위로 뛰어올랐다" },
      { id: "D", text: "다른 물고기를 데려왔다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 준이의 반응은 어떠했나요?",
    choices: [
      { id: "A", text: "웃음을 터뜨리며 남쪽으로 걸었다" },
      { id: "B", text: "무서워서 집으로 뛰어갔다" },
      { id: "C", text: "물고기에게 먹이를 주었다" },
      { id: "D", text: "나침반을 연못에 던졌다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 떡갈나무 아래에 무엇이 있었나요?",
    choices: [
      { id: "A", text: "오래된 편지 한 장이 돌로 눌려 있었다" },
      { id: "B", text: "보물이 담긴 상자가 묻혀 있었다" },
      { id: "C", text: "또 다른 나침반이 놓여 있었다" },
      { id: "D", text: "작은 동물이 잠을 자고 있었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "일곱째 문장에서 편지 봉투에 적힌 이름은 누구의 것인가요?",
    choices: [
      { id: "A", text: "할머니의 이름이 단정한 글씨로 적혀 있었다" },
      { id: "B", text: "준이의 이름이 크게 적혀 있었다" },
      { id: "C", text: "아무 이름도 적혀 있지 않았다" },
      { id: "D", text: "선생님의 이름이 적혀 있었다" }
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
      { id: "A", text: "물고기와 교감한 준이가 나침반을 따라 할머니 이름이 적힌 편지를 발견한다" },
      { id: "B", text: "준이가 물고기를 잡아 집으로 가져간다" },
      { id: "C", text: "나침반이 고장 나서 준이가 길을 잃는다" },
      { id: "D", text: "할머니가 직접 나타나 편지를 건네준다" }
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
    prompt: "첫 문장에서 준이가 한 일은 무엇인가요?",
    choices: [
      { id: "A", text: "조심스럽게 편지를 꺼내 읽었다" },
      { id: "B", text: "편지를 읽지 않고 주머니에 넣었다" },
      { id: "C", text: "편지를 할머니에게 바로 가져다 드렸다" },
      { id: "D", text: "편지를 연못에 띄워 보냈다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 편지의 내용은 무엇이었나요?",
    choices: [
      { id: "A", text: "할머니가 어릴 때 연못에서 은빛 물고기와 놀던 이야기였다" },
      { id: "B", text: "할머니가 도시에서 생활한 이야기였다" },
      { id: "C", text: "할아버지가 나침반을 만든 이야기였다" },
      { id: "D", text: "마을의 오래된 전설이 적혀 있었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 할머니가 믿었던 것은 무엇인가요?",
    choices: [
      { id: "A", text: "물고기에게 소원을 빌면 꼭 이루어진다고 믿었다" },
      { id: "B", text: "나침반을 물에 넣으면 보물이 나온다고 믿었다" },
      { id: "C", text: "연못 물을 마시면 병이 낫는다고 믿었다" },
      { id: "D", text: "물고기가 말을 할 수 있다고 믿었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 준이의 감정은 어떠했나요?",
    choices: [
      { id: "A", text: "가슴이 뛰었다" },
      { id: "B", text: "실망스러웠다" },
      { id: "C", text: "화가 났다" },
      { id: "D", text: "졸음이 왔다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 준이가 연못에서 한 일은 무엇인가요?",
    choices: [
      { id: "A", text: "물가에 무릎을 꿇고 눈을 감은 채 소원을 빌었다" },
      { id: "B", text: "연못 물을 떠서 마셨다" },
      { id: "C", text: "물고기를 손으로 잡으려 했다" },
      { id: "D", text: "나침반을 연못에 빠뜨렸다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 소원을 빈 뒤 연못에 어떤 변화가 있었나요?",
    choices: [
      { id: "A", text: "바람에 이파리가 흩날리고 물고기가 원을 그리며 헤엄쳤다" },
      { id: "B", text: "연못물이 갑자기 끓어올랐다" },
      { id: "C", text: "물고기가 사라지고 연못이 말랐다" },
      { id: "D", text: "하늘에서 비가 쏟아지기 시작했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "마지막 문장에서 준이가 마음속으로 한 약속은 무엇인가요?",
    choices: [
      { id: "A", text: "다음에 또 오겠다고 약속했다" },
      { id: "B", text: "다시는 오지 않겠다고 약속했다" },
      { id: "C", text: "할머니에게 비밀로 하겠다고 약속했다" },
      { id: "D", text: "나침반을 버리겠다고 약속했다" }
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
      { id: "A", text: "편지를 통해 할머니와의 연결을 느낀 준이가 연못에서 소원을 빈다" },
      { id: "B", text: "준이가 편지를 찢어 버리고 집으로 돌아간다" },
      { id: "C", text: "할머니가 연못에 와서 함께 소원을 빈다" },
      { id: "D", text: "물고기가 사람으로 변해 준이에게 말을 건넨다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});

// ─── 4. recall (8카드) ───
const recall = {
  cards: [
    { id: "c1", text: "준이는 할머니 댁 뒤뜰에서 낡은 나침반을 주웠고, 바늘이 동쪽으로 꺾였다." },
    { id: "c2", text: "나침반을 따라가자 이끼 낀 돌계단과 초록빛 이파리가 도는 연못이 나타났다." },
    { id: "c3", text: "연못 속 은빛 물고기가 준이를 올려다보고, 손을 뻗자 수면 가까이 떠올랐다." },
    { id: "c4", text: "나침반이 남쪽을 가리키자 준이는 덤불을 지나 떡갈나무에서 편지를 발견했다." },
    { id: "c5", text: "편지에는 할머니가 어릴 때 같은 나침반으로 연못을 찾았다는 이야기가 있었다." },
    { id: "c6", text: "할머니는 물고기에게 소원을 빌면 꼭 이루어진다고 믿었다." },
    { id: "c7", text: "준이는 연못으로 돌아가 물가에 무릎을 꿇고 소원을 빌었다." },
    { id: "c8", text: "나침반을 가슴에 품고 돌아가며 다음에 또 오겠다고 마음속으로 약속했다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// ─── 5. confirm (7개) ───
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "준이가 할머니 댁 뒤뜰에서 주운 물건은 무엇인가요?",
      answerText: "나침반",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "낡은 나침반 하나를 주웠다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "나침반을 손에 올렸을 때 바늘이 처음 꺾인 방향은 어디인가요?",
      answerText: "동쪽",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "동쪽으로 확 꺾이더니")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "연못 물속에서 준이를 올려다본 것은 무엇인가요?",
      answerText: "은빛 물고기",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "은빛 물고기 한 마리가")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "물고기가 대답하듯 한 행동은 무엇인가요?",
      answerText: "꼬리를 세 번 탁탁 쳤다",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "꼬리를 세 번 탁탁 쳐서 물방울을 튀겼다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "떡갈나무 아래 편지 봉투에 적힌 이름은 누구의 것인가요?",
      answerText: "할머니",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "할머니의 이름이 단정한 글씨로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "할머니가 물고기에게 빌면 이루어진다고 믿은 것은 무엇인가요?",
      answerText: "소원",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "소원을 빌면 꼭 이루어진다고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "준이가 돌아가며 마음속으로 한 약속은 무엇인가요?",
      answerText: "다음에 또 오겠다",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "다음에 또 오겠다고 마음속으로 약속했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

// ─── 6. 콘텐츠 조립 ───
const content = {
  contentId: "dr-f3-014",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(프레게 3) Day 14 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "FREGE_3",
  schoolGradeRange: { min: 6, max: 7 },
  area: "READING",
  subArea: "LITERATURE",
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
batch.items[13] = {
  content_type: "DAILY_READING",
  level_id: "FREGE_3",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 14,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');

// ─── 8. static 파일 ───
const staticPath = path.join('C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지\\frontend\\public\\daily-reading\\frege3', '014.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log('Day 14 완료! 지문 길이:', totalLen, '자');
console.log('intensive steps:', timeline.length);
console.log('recall cards:', recall.cards.length);
console.log('confirm questions:', confirm.questions.length);
