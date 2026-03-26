const fs = require('fs');

// ===== Day 8: LITERATURE (수필) =====
// 주제: "할머니의 장독대" - 할머니 집 장독대에서 느끼는 계절과 기억에 대한 수필

const p1 = "시골 할머니 집 마당 한쪽에는 크고 작은 항아리가 나란히 줄을 서 있었다.항아리마다 뚜껑에 올린 돌멩이가 달랐는데, 할머니는 그 돌만 보고도 안에 무엇이 담겨 있는지 금방 알아맞혔다.둥글고 납작한 돌 아래에는 된장이, 길쭉한 돌 아래에는 간장이, 하얀 조약돌 아래에는 고추장이 익어 가고 있었다.봄이면 할머니는 이른 아침부터 뚜껑을 열어 햇볕을 쐬어 주었고, 마당에는 구수한 냄새가 바람을 타고 퍼졌다.나는 그 냄새를 맡으며 아직 잠이 덜 깬 눈을 비비곤 했다.여름 장마가 시작되면 할머니는 부지런히 뚜껑을 닫고 비닐을 덮었는데, 빗물이 들어가면 맛이 변한다며 눈살을 찌푸리기도 했다.장독대는 할머니에게 단순한 그릇이 아니라 일 년 내내 돌보아야 하는 살아 있는 존재 같았다.";
const p2 = "가을이 오면 장독대 옆 감나무에 주황빛 감이 주렁주렁 매달렸다.할머니는 잘 익은 감을 따서 항아리 뚜껑 위에 하나씩 올려놓곤 했다.까마귀가 날아와 감을 쪼아 먹으면 할머니는 손을 휘저으며 소리를 질렀지만, 돌아서면 '그것도 먹고살려고 오는 거지' 하며 웃었다.그때는 몰랐지만, 할머니의 그 말에는 생명을 너그럽게 바라보는 마음이 담겨 있었다.겨울이 되면 장독대 위에 눈이 쌓여 항아리가 하얀 모자를 쓴 것처럼 보였다.할머니는 눈을 쓸어 내리면서도 '눈이 덮여야 장맛이 깊어진다'고 말했다.";
const p3 = "할머니가 돌아가신 뒤, 빈 항아리만 남은 장독대를 보았을 때 나는 한참 동안 그 자리에 서 있었다.뚜껑 위의 돌멩이는 그대로였지만, 더 이상 안에 무엇이 담겨 있는지 알려 주는 사람이 없었다.바람이 불자 뚜껑이 달그락거렸고, 그 소리가 할머니의 목소리처럼 들려 나는 눈물을 참을 수 없었다.장독대는 여전히 계절마다 햇볕을 받고 비를 맞고 눈에 덮이지만, 이제는 아무도 뚜껑을 열어 주지 않는다.그래도 나는 된장찌개를 끓일 때마다 할머니의 구수한 마당 냄새를 떠올린다.언젠가 나도 작은 항아리 하나쯤은 마당에 두고 싶다는 생각을 한다.그것은 장을 담그려는 것이 아니라, 할머니와 함께했던 시간을 다시 곁에 두고 싶은 마음일 것이다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 }
];

// 글자 수 확인
const totalLen = p1.length + p2.length + p3.length;
console.log(`p1: ${p1.length}자, p2: ${p2.length}자, p3: ${p3.length}자, 총: ${totalLen}자`);

// 문장 경계 수동 지정
function sentenceRanges(text) {
  const ranges = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] !== '.')) {
      ranges.push([start, i + 1]);
      start = i + 1;
    }
  }
  if (start < text.length) {
    ranges.push([start, text.length]);
  }
  return ranges;
}

const p1Sentences = sentenceRanges(p1);
const p2Sentences = sentenceRanges(p2);
const p3Sentences = sentenceRanges(p3);

console.log("p1 문장수:", p1Sentences.length, p1Sentences.map(r => `[${r[0]},${r[1]}] "${p1.substring(r[0], Math.min(r[0]+15, r[1]))}"...`));
console.log("p2 문장수:", p2Sentences.length, p2Sentences.map(r => `[${r[0]},${r[1]}] "${p2.substring(r[0], Math.min(r[0]+15, r[1]))}"...`));
console.log("p3 문장수:", p3Sentences.length, p3Sentences.map(r => `[${r[0]},${r[1]}] "${p3.substring(r[0], Math.min(r[0]+15, r[1]))}"...`));

// intensive timeline 생성
let stepCount = 0;
const timeline = [];

function addSentenceStep(pId, range, prompt, choices, answerId) {
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

function addParagraphSummaryStep(pId, start, end, prompt, choices, answerId) {
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
addSentenceStep("p1", p1Sentences[0],
  "첫 문장에서 할머니 집 마당에 무엇이 있었나요?",
  [
    "크고 작은 항아리가 나란히 줄을 서 있었다",
    "꽃밭과 채소밭이 번갈아 놓여 있었다",
    "나무 울타리와 돌담이 높이 쌓여 있었다",
    "빨래줄과 장작더미가 널려 있었다"
  ], "A");

addSentenceStep("p1", p1Sentences[1],
  "할머니는 뚜껑의 돌만 보고 무엇을 할 수 있었나요?",
  [
    "항아리 안에 무엇이 담겨 있는지 알아맞힐 수 있었다",
    "그날의 날씨를 미리 알아맞힐 수 있었다",
    "항아리의 나이를 정확히 맞힐 수 있었다",
    "돌멩이의 무게를 눈대중으로 잴 수 있었다"
  ], "A");

addSentenceStep("p1", p1Sentences[2],
  "돌 모양에 따라 어떤 장이 각각 익고 있었나요?",
  [
    "둥글고 납작한 돌은 된장, 길쭉한 돌은 간장, 하얀 조약돌은 고추장이다",
    "둥근 돌은 고추장, 납작한 돌은 된장, 뾰족한 돌은 간장이다",
    "모든 항아리에 같은 종류의 장만 담겨 있었다",
    "돌 모양과 장의 종류는 아무런 관계가 없었다"
  ], "A");

addSentenceStep("p1", p1Sentences[3],
  "봄이면 할머니가 아침에 한 일은 무엇인가요?",
  [
    "뚜껑을 열어 항아리에 햇볕을 쐬어 주었다",
    "항아리를 꺼내 마당 한가운데로 옮겼다",
    "새로운 장을 담가 항아리를 채웠다",
    "항아리 겉에 글씨를 써서 표시해 두었다"
  ], "A");

addSentenceStep("p1", p1Sentences[4],
  "글쓴이는 구수한 냄새를 맡으며 어떤 모습이었나요?",
  [
    "아직 잠이 덜 깬 눈을 비비곤 했다",
    "마당을 뛰어다니며 놀곤 했다",
    "할머니를 도와 뚜껑을 닦곤 했다",
    "냄새가 싫어 코를 막곤 했다"
  ], "A");

addSentenceStep("p1", p1Sentences[5],
  "여름 장마 때 할머니가 걱정한 까닭은 무엇인가요?",
  [
    "빗물이 들어가면 장맛이 변하기 때문이다",
    "항아리가 깨질 수 있기 때문이다",
    "장독대가 미끄러워 위험하기 때문이다",
    "벌레가 항아리 안으로 들어가기 때문이다"
  ], "A");

addSentenceStep("p1", p1Sentences[6],
  "마지막 문장에서 장독대는 할머니에게 어떤 존재였나요?",
  [
    "일 년 내내 돌보아야 하는 살아 있는 존재 같았다",
    "필요할 때만 꺼내 쓰는 편리한 도구였다",
    "마당을 예쁘게 꾸미는 장식품이었다",
    "한 번 만들면 손댈 필요가 없는 물건이었다"
  ], "A");

// p1 중심내용
addParagraphSummaryStep("p1", 0, p1.length,
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "할머니의 장독대는 계절마다 정성껏 돌보는 살아 있는 존재였다",
    "장독대에는 된장만 담겨 있어서 다른 장은 필요 없었다",
    "할머니는 장독대 대신 냉장고를 더 좋아했다",
    "장독대는 봄에만 잠깐 쓰고 나머지 계절에는 쓰지 않았다"
  ], "A");

// === p2 문장별 ===
addSentenceStep("p2", p2Sentences[0],
  "가을에 장독대 옆에서 어떤 풍경이 펼쳐졌나요?",
  [
    "감나무에 주황빛 감이 주렁주렁 매달렸다",
    "은행나무에서 노란 잎이 떨어졌다",
    "국화꽃이 장독대를 둘러싸고 피었다",
    "밤나무에서 밤송이가 우수수 떨어졌다"
  ], "A");

addSentenceStep("p2", p2Sentences[1],
  "할머니는 잘 익은 감을 어디에 올려놓았나요?",
  [
    "항아리 뚜껑 위에 하나씩 올려놓았다",
    "마루 끝에 줄지어 올려놓았다",
    "부엌 선반 위에 가지런히 올려놓았다",
    "대문 앞 돌 위에 쌓아 올려놓았다"
  ], "A");

addSentenceStep("p2", p2Sentences[2],
  "할머니는 까마귀를 쫓으면서도 돌아서서 어떻게 했나요?",
  [
    "'그것도 먹고살려고 오는 거지' 하며 웃었다",
    "다시는 오지 말라고 단단히 혼을 냈다",
    "감을 모두 따서 집 안에 숨겨 두었다",
    "허수아비를 만들어 감나무에 매달았다"
  ], "A");

addSentenceStep("p2", p2Sentences[3],
  "글쓴이가 나중에야 깨달은 것은 무엇인가요?",
  [
    "할머니의 말에 생명을 너그럽게 바라보는 마음이 담겨 있었다는 것",
    "까마귀가 사실은 좋은 새라는 것",
    "감이 장맛을 좋게 만든다는 것",
    "할머니가 까마귀를 기르고 있었다는 것"
  ], "A");

addSentenceStep("p2", p2Sentences[4],
  "겨울 장독대의 모습은 어떻게 묘사되었나요?",
  [
    "눈이 쌓여 항아리가 하얀 모자를 쓴 것처럼 보였다",
    "고드름이 매달려 항아리가 유리처럼 빛났다",
    "서리가 내려 항아리가 은색으로 변했다",
    "얼음이 얼어 뚜껑이 열리지 않았다"
  ], "A");

addSentenceStep("p2", p2Sentences[5],
  "할머니는 눈에 대해 어떤 말을 했나요?",
  [
    "'눈이 덮여야 장맛이 깊어진다'고 했다",
    "'눈이 오면 장이 모두 얼어 버린다'고 했다",
    "'눈을 빨리 치워야 항아리가 안전하다'고 했다",
    "'눈보다 비가 장맛에 더 좋다'고 했다"
  ], "A");

// p2 중심내용
addParagraphSummaryStep("p2", 0, p2.length,
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "할머니는 자연과 생명을 너그럽게 대하며 장독대와 계절을 함께했다",
    "가을에는 까마귀 때문에 감을 하나도 먹지 못했다",
    "겨울에 눈이 오면 장이 모두 상해서 버려야 했다",
    "할머니는 감나무를 장독대보다 더 소중하게 여겼다"
  ], "A");

// === p3 문장별 ===
addSentenceStep("p3", p3Sentences[0],
  "할머니가 돌아가신 뒤 글쓴이는 무엇을 보았나요?",
  [
    "빈 항아리만 남은 장독대를 보았다",
    "새로 칠한 장독대를 보았다",
    "이웃이 가져간 빈 마당을 보았다",
    "허물어진 담장과 풀밭을 보았다"
  ], "A");

addSentenceStep("p3", p3Sentences[1],
  "돌멩이는 그대로였지만 달라진 것은 무엇인가요?",
  [
    "안에 무엇이 담겨 있는지 알려 주는 사람이 없어졌다",
    "돌멩이가 모두 깨져서 쓸 수 없게 되었다",
    "항아리가 너무 낡아서 열 수 없게 되었다",
    "뚜껑이 모두 사라져 돌멩이만 남았다"
  ], "A");

addSentenceStep("p3", p3Sentences[2],
  "뚜껑이 달그락거리는 소리는 글쓴이에게 어떻게 느껴졌나요?",
  [
    "할머니의 목소리처럼 들려 눈물을 참을 수 없었다",
    "무서운 소리처럼 들려 도망치고 싶었다",
    "음악 소리처럼 들려 기분이 좋았다",
    "바람 소리와 섞여 아무것도 들리지 않았다"
  ], "A");

addSentenceStep("p3", p3Sentences[3],
  "장독대가 여전히 겪는 일과 달라진 점은 무엇인가요?",
  [
    "계절은 변함없이 지나가지만 뚜껑을 열어 주는 사람이 없다",
    "계절이 바뀌지 않아 항아리도 변하지 않는다",
    "누군가 매일 찾아와서 장독대를 돌본다",
    "장독대가 마당에서 사라져 더 이상 볼 수 없다"
  ], "A");

addSentenceStep("p3", p3Sentences[4],
  "글쓴이는 된장찌개를 끓일 때마다 무엇을 떠올리나요?",
  [
    "할머니의 구수한 마당 냄새를 떠올린다",
    "시골의 넓은 들판과 강물을 떠올린다",
    "어린 시절 학교에서 먹던 급식을 떠올린다",
    "장터에서 사 온 된장의 가격을 떠올린다"
  ], "A");

addSentenceStep("p3", p3Sentences[5],
  "글쓴이가 작은 항아리를 마당에 두고 싶은 까닭은 무엇인가요?",
  [
    "할머니와 함께했던 시간을 다시 곁에 두고 싶어서이다",
    "직접 된장을 만들어 팔고 싶어서이다",
    "이웃에게 장독대 만드는 법을 가르치려고이다",
    "마당을 예쁘게 꾸미는 장식이 필요해서이다"
  ], "A");

addSentenceStep("p3", p3Sentences[6],
  "마지막 문장에서 항아리를 두려는 진짜 이유는 무엇인가요?",
  [
    "장을 담그려는 것이 아니라 할머니와의 시간을 곁에 두고 싶은 마음이다",
    "장을 담가 팔아 돈을 벌고 싶은 마음이다",
    "할머니의 항아리를 박물관에 기증하고 싶은 마음이다",
    "오래된 항아리의 골동품 가치를 알리고 싶은 마음이다"
  ], "A");

// p3 중심내용
addParagraphSummaryStep("p3", 0, p3.length,
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "할머니가 떠난 뒤에도 장독대는 할머니와의 소중한 기억을 간직하게 해 준다",
    "할머니가 돌아가신 뒤 장독대는 완전히 쓸모가 없어졌다",
    "글쓴이는 할머니의 장독대를 다른 사람에게 팔기로 했다",
    "빈 항아리는 깨뜨려서 버리는 것이 가장 좋다고 생각했다"
  ], "A");

// 복기 카드 8장
const recall = {
  cards: [
    { id: "c1", text: "할머니 집 마당에는 크고 작은 항아리가 줄지어 있었고, 뚜껑의 돌 모양으로 장의 종류를 구분했다." },
    { id: "c2", text: "봄이면 뚜껑을 열어 햇볕을 쐬고, 여름 장마에는 빗물이 들어가지 않도록 부지런히 뚜껑을 닫았다." },
    { id: "c3", text: "장독대는 할머니에게 단순한 그릇이 아니라 일 년 내내 돌보아야 하는 살아 있는 존재 같았다." },
    { id: "c4", text: "가을에 까마귀가 감을 쪼아 먹어도 할머니는 '먹고살려고 오는 거지' 하며 너그럽게 웃었다." },
    { id: "c5", text: "겨울에 눈이 쌓이면 할머니는 '눈이 덮여야 장맛이 깊어진다'고 말했다." },
    { id: "c6", text: "할머니가 돌아가신 뒤 빈 항아리와 돌멩이만 남았고, 뚜껑을 열어 주는 사람이 사라졌다." },
    { id: "c7", text: "바람에 뚜껑이 달그락거리는 소리가 할머니 목소리처럼 들려 눈물을 참을 수 없었다." },
    { id: "c8", text: "글쓴이가 항아리를 두고 싶은 것은 장을 담그려는 게 아니라 할머니와의 시간을 곁에 두고 싶은 마음이다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// 확인학습 7문항
function findAnswer(text, answer) {
  const idx = text.indexOf(answer);
  if (idx === -1) {
    // 각 문단에서 찾기
    for (const p of paragraphs) {
      const pi = p.text.indexOf(answer);
      if (pi !== -1) return { paragraphId: p.id, start: pi, end: pi + answer.length };
    }
    console.error("답을 찾을 수 없음:", answer);
    return null;
  }
  return idx;
}

const confirmQuestions = [
  {
    id: "q1",
    prompt: "할머니가 뚜껑의 돌만 보고 알아맞힌 것은 무엇인가요?",
    answerText: "안에 무엇이 담겨 있는지",
    answerMatchMode: "ANY"
  },
  {
    id: "q2",
    prompt: "봄에 할머니가 이른 아침부터 뚜껑을 열어서 한 일은 무엇인가요?",
    answerText: "햇볕을 쐬어",
    answerMatchMode: "ANY"
  },
  {
    id: "q3",
    prompt: "여름 장마 때 빗물이 들어가면 어떤 일이 생긴다고 했나요?",
    answerText: "맛이 변한다",
    answerMatchMode: "ANY"
  },
  {
    id: "q4",
    prompt: "할머니가 까마귀를 쫓고 돌아서며 한 말은 무엇인가요?",
    answerText: "먹고살려고 오는 거지",
    answerMatchMode: "ANY"
  },
  {
    id: "q5",
    prompt: "할머니에 따르면 눈이 장독대를 덮으면 어떻게 된다고 했나요?",
    answerText: "장맛이 깊어진다",
    answerMatchMode: "ANY"
  },
  {
    id: "q6",
    prompt: "뚜껑이 달그락거리는 소리를 글쓴이는 무엇처럼 느꼈나요?",
    answerText: "할머니의 목소리",
    answerMatchMode: "ANY"
  },
  {
    id: "q7",
    prompt: "글쓴이가 항아리를 마당에 두고 싶은 진짜 마음은 무엇인가요?",
    answerText: "할머니와 함께했던 시간을 다시 곁에 두고 싶은 마음",
    answerMatchMode: "ANY"
  }
];

// answerRanges 계산
for (const q of confirmQuestions) {
  const answer = q.answerText;
  for (const p of paragraphs) {
    const idx = p.text.indexOf(answer);
    if (idx !== -1) {
      q.answerRanges = [{ paragraphId: p.id, start: idx, end: idx + answer.length }];
      break;
    }
  }
  if (!q.answerRanges) {
    console.error(`답 "${answer}"을(를) 지문에서 찾을 수 없습니다!`);
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
  contentId: "dr-f3-008",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(프레게 3) Day 8 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "FREGE_3",
  schoolGradeRange: { min: 6, max: 7 },
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

// ranges 유효성 검증
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

// answerRanges 유효성 검증
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

// 파일 저장
fs.writeFileSync('frontend/public/daily-reading/frege3/008.json', json, 'utf8');
console.log("\n008.json 저장 완료");

// 배치 파일 업데이트
const batchPath = 'generated/daily-batch-reading-frege3.json';
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[7] = {
  content_type: "DAILY_READING",
  level_id: "FREGE_3",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 8,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log("배치 파일 items[7] 업데이트 완료");
