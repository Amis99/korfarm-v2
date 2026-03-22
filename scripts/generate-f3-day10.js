const fs = require('fs');

// ===== Day 10: LITERATURE (문학) =====
// 주제: "도서관의 유령" - 오래된 도서관에서 일어나는 신비한 이야기 (단편소설 형식)

const p1 = "우리 동네 오래된 도서관에는 이상한 소문이 있었다.매일 밤 열두 시가 되면 서가 사이에서 책장 넘기는 소리가 들린다는 것이다.도서관 경비 아저씨는 아무리 돌아봐도 사람이 없었다며 고개를 저었고, 동네 아이들은 그것을 유령의 짓이라고 수군거렸다.호기심이 많았던 나는 어느 금요일 저녁, 도서관이 닫기 직전에 몰래 서가 뒤에 숨었다.불이 꺼지자 도서관은 칠흑처럼 어두워졌고, 먼지 냄새와 함께 낡은 나무 바닥이 삐걱대는 소리만 울렸다.시계가 열두 번을 치자마자 정말로 어디선가 사각사각 책장 넘기는 소리가 들려왔다.심장이 두근거렸지만 나는 떨리는 손으로 손전등을 꺼내 들고 소리가 나는 쪽으로 조심스럽게 다가갔다.";
const p2 = "서가 맨 끝 구석에는 작은 창문이 있었고, 달빛이 비스듬히 들어와 바닥에 한 줄기 은빛 길을 만들고 있었다.그 빛 아래에 낡은 그림책 한 권이 펼쳐져 있었다.바람도 불지 않는데 책장이 천천히 넘어가고 있었고, 넘어간 자리마다 연필로 쓴 작은 글씨가 빼곡했다.손전등을 가까이 비춰 보니 그것은 누군가가 오래전에 써 놓은 일기였다.일기에는 아무도 자신을 읽어 주지 않는다며 한 번만이라도 누군가의 손에 안기고 싶다는 간절한 바람이 적혀 있었다.나는 숨이 멎을 것 같았다.그것은 유령이 아니라, 오랫동안 아무도 빌려 가지 않아 잊혀진 책이 내는 외로운 목소리 같았다.";
const p3 = "다음 날 아침, 나는 도서관 문이 열리자마자 달려가 그 그림책을 빌렸다.사서 선생님은 바코드를 찍으며 놀란 표정으로 이 책은 이십 년 넘게 아무도 빌려 간 적이 없다고 말했다.나는 빙긋 웃으며 책을 가슴에 꼭 안았다.집에 와서 읽어 보니 그것은 별이 길을 잃은 아이에게 길을 알려 주는 따뜻한 이야기였다.그날 밤, 열두 시가 넘어도 도서관에서는 더 이상 책장 넘기는 소리가 들리지 않았다고 경비 아저씨가 말해 주었다.나는 그때 깨달았다.책은 읽히기 위해 태어난 것이고, 읽어 주는 사람이 있을 때 비로소 살아 있게 된다는 것을.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 }
];

const totalLen = p1.length + p2.length + p3.length;
console.log(`p1: ${p1.length}자, p2: ${p2.length}자, p3: ${p3.length}자, 총: ${totalLen}자`);

function sentenceRanges(text) {
  const ranges = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] !== '.')) {
      ranges.push([start, i + 1]);
      start = i + 1;
    }
  }
  if (start < text.length) ranges.push([start, text.length]);
  return ranges;
}

const p1Sentences = sentenceRanges(p1);
const p2Sentences = sentenceRanges(p2);
const p3Sentences = sentenceRanges(p3);

console.log("p1 문장수:", p1Sentences.length, p1Sentences.map(r => `[${r[0]},${r[1]}] "${p1.substring(r[0], Math.min(r[0]+15, r[1]))}"...`));
console.log("p2 문장수:", p2Sentences.length, p2Sentences.map(r => `[${r[0]},${r[1]}] "${p2.substring(r[0], Math.min(r[0]+15, r[1]))}"...`));
console.log("p3 문장수:", p3Sentences.length, p3Sentences.map(r => `[${r[0]},${r[1]}] "${p3.substring(r[0], Math.min(r[0]+15, r[1]))}"...`));

let stepCount = 0;
const timeline = [];

function addStep(pId, range, prompt, choices, answerId) {
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

function addSummary(pId, start, end, prompt, choices, answerId) {
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
addStep("p1", p1Sentences[0],
  "오래된 도서관에 어떤 이야기가 전해지고 있었나요?",
  [
    "이상한 소문이 있었다",
    "공사를 앞두고 곧 문을 닫을 예정이었다",
    "새로운 사서가 부임해 왔다는 소식이 있었다",
    "도서관 옆에 놀이터가 생긴다는 이야기가 있었다"
  ], "A");

addStep("p1", p1Sentences[1],
  "매일 밤 열두 시에 무슨 소리가 들린다고 했나요?",
  [
    "서가 사이에서 책장 넘기는 소리가 들린다고 했다",
    "천장에서 물방울 떨어지는 소리가 들린다고 했다",
    "복도에서 발걸음 소리가 들린다고 했다",
    "창문이 열리고 닫히는 소리가 들린다고 했다"
  ], "A");

addStep("p1", p1Sentences[2],
  "경비 아저씨와 동네 아이들의 반응은 각각 어떠했나요?",
  [
    "아저씨는 사람이 없다며 고개를 저었고 아이들은 유령이라고 수군거렸다",
    "아저씨와 아이들 모두 소문을 무시하고 관심을 두지 않았다",
    "아저씨는 무서워서 그만두었고 아이들은 경찰에 신고했다",
    "아저씨도 아이들도 직접 들어 본 적이 없다고 말했다"
  ], "A");

addStep("p1", p1Sentences[3],
  "글쓴이가 금요일 저녁에 한 일은 무엇인가요?",
  [
    "도서관이 닫기 직전에 몰래 서가 뒤에 숨었다",
    "도서관 앞에서 친구들과 담력 훈련을 했다",
    "집에서 유령에 관한 책을 읽으며 계획을 세웠다",
    "경비 아저씨에게 부탁하여 함께 순찰을 돌았다"
  ], "A");

addStep("p1", p1Sentences[4],
  "불이 꺼진 뒤 도서관의 분위기는 어떠했나요?",
  [
    "칠흑처럼 어두워졌고 낡은 바닥이 삐걱대는 소리만 울렸다",
    "밝은 달빛이 들어와 환하게 빛나고 있었다",
    "비상등이 켜져서 복도가 붉은빛으로 물들었다",
    "창문을 통해 가로등 빛이 들어와 책이 잘 보였다"
  ], "A");

addStep("p1", p1Sentences[5],
  "시계가 열두 번 치자 어떤 일이 벌어졌나요?",
  [
    "어디선가 사각사각 책장 넘기는 소리가 들려왔다",
    "서가 위에서 책 한 권이 바닥에 떨어졌다",
    "갑자기 모든 불이 환하게 켜졌다",
    "문이 스스로 열리면서 찬바람이 들어왔다"
  ], "A");

addStep("p1", p1Sentences[6],
  "글쓴이는 두근거리는 심장에도 불구하고 어떻게 했나요?",
  [
    "소리가 나는 쪽으로 조심스럽게 다가갔다",
    "겁이 나서 서가 뒤에 계속 숨어 있었다",
    "경비 아저씨를 부르려고 출구로 뛰어갔다",
    "귀를 막고 아침이 올 때까지 기다렸다"
  ], "A");

// p1 중심내용
addSummary("p1", 0, p1.length,
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "도서관의 이상한 소리에 호기심을 느낀 글쓴이가 밤에 몰래 숨어 들었다",
    "도서관 경비 아저씨가 유령을 직접 보고 놀라 도망쳤다",
    "동네 아이들이 함께 도서관에 들어가 유령을 잡으려 했다",
    "도서관이 오래되어 무너질 위험이 있다는 소식이 퍼졌다"
  ], "A");

// === p2 문장별 ===
addStep("p2", p2Sentences[0],
  "서가 끝 구석의 창문에서는 어떤 빛이 들어왔나요?",
  [
    "달빛이 비스듬히 들어와 한 줄기 길을 만들고 있었다",
    "가로등 빛이 곧게 들어와 바닥을 비추고 있었다",
    "번개가 쳐서 잠깐씩 밝아졌다",
    "형광등이 깜빡이며 희미하게 빛나고 있었다"
  ], "A");

addStep("p2", p2Sentences[1],
  "달빛 아래에 무엇이 있었나요?",
  [
    "낡은 그림책 한 권이 펼쳐져 있었다",
    "오래된 지도 한 장이 접혀 있었다",
    "빛나는 구슬 하나가 놓여 있었다",
    "먼지 쌓인 액자가 벽에 기대어 있었다"
  ], "A");

addStep("p2", p2Sentences[2],
  "바람이 불지 않는데 책에서 어떤 일이 일어나고 있었나요?",
  [
    "책장이 천천히 넘어가고 있었고 연필 글씨가 빼곡했다",
    "책이 저절로 닫히면서 빛이 사라지고 있었다",
    "그림이 움직이면서 소리를 내고 있었다",
    "책에서 꽃향기가 나며 꽃잎이 떨어지고 있었다"
  ], "A");

addStep("p2", p2Sentences[3],
  "손전등을 비춰서 확인한 글씨의 정체는 무엇이었나요?",
  [
    "누군가가 오래전에 써 놓은 일기였다",
    "도서관 설계자가 남긴 건축 기록이었다",
    "아이들이 장난으로 쓴 낙서였다",
    "사서가 적어 둔 도서 목록이었다"
  ], "A");

addStep("p2", p2Sentences[4],
  "일기에 적힌 간절한 바람은 무엇이었나요?",
  [
    "한 번만이라도 누군가의 손에 안기고 싶다는 것이었다",
    "새 표지를 입혀 달라는 것이었다",
    "서가에서 더 높은 자리로 옮겨 달라는 것이었다",
    "다른 도서관으로 보내 달라는 것이었다"
  ], "A");

addStep("p2", p2Sentences[5],
  "글쓴이는 일기를 읽고 어떤 반응을 보였나요?",
  [
    "숨이 멎을 것 같았다",
    "크게 웃음을 터뜨렸다",
    "무서워서 책을 던지고 도망쳤다",
    "졸음이 쏟아져 그 자리에서 잠이 들었다"
  ], "A");

addStep("p2", p2Sentences[6],
  "글쓴이는 소리의 정체를 무엇이라고 느꼈나요?",
  [
    "잊혀진 책이 내는 외로운 목소리 같았다고 느꼈다",
    "바람이 만들어 낸 자연 현상이라고 느꼈다",
    "경비 아저씨가 꾸며낸 장난이라고 느꼈다",
    "쥐가 책장 사이를 뛰어다니는 소리라고 느꼈다"
  ], "A");

// p2 중심내용
addSummary("p2", 0, p2.length,
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "달빛 아래 펼쳐진 책에서 읽히고 싶은 간절한 마음을 발견했다",
    "유령이 실제로 나타나 글쓴이에게 책을 건네주었다",
    "글쓴이가 무서워서 도서관에서 뛰쳐나왔다",
    "책에 쓰인 글씨는 사서가 몰래 남긴 장난이었다"
  ], "A");

// === p3 문장별 ===
addStep("p3", p3Sentences[0],
  "다음 날 글쓴이가 가장 먼저 한 일은 무엇인가요?",
  [
    "도서관 문이 열리자마자 달려가 그림책을 빌렸다",
    "친구들에게 밤에 있었던 일을 자세히 알려 주었다",
    "경비 아저씨를 찾아가 유령 이야기를 확인했다",
    "부모님께 말씀드리고 함께 도서관에 갔다"
  ], "A");

addStep("p3", p3Sentences[1],
  "사서 선생님이 놀란 까닭은 무엇인가요?",
  [
    "이 책은 이십 년 넘게 아무도 빌려 간 적이 없었기 때문이다",
    "이 책은 최근에 새로 들어온 신간이기 때문이다",
    "이 책은 인기가 많아 대출 순서를 기다려야 했기 때문이다",
    "이 책은 훼손되어 대출할 수 없었기 때문이다"
  ], "A");

addStep("p3", p3Sentences[2],
  "글쓴이가 사서의 말을 듣고 보인 반응은 어떠했나요?",
  [
    "빙긋 웃으며 책을 가슴에 꼭 안았다",
    "깜짝 놀라 책을 도로 내려놓았다",
    "의심스러워 다른 책으로 바꾸었다",
    "무서워져서 빌리지 않기로 했다"
  ], "A");

addStep("p3", p3Sentences[3],
  "그림책의 내용은 어떤 이야기였나요?",
  [
    "별이 길을 잃은 아이에게 길을 알려 주는 따뜻한 이야기였다",
    "유령이 도서관을 지키며 사는 무서운 이야기였다",
    "바다를 건너는 배의 모험을 다룬 이야기였다",
    "숲속 동물들이 학교에 가는 재미있는 이야기였다"
  ], "A");

addStep("p3", p3Sentences[4],
  "그날 밤 도서관에서 달라진 점은 무엇인가요?",
  [
    "열두 시가 넘어도 더 이상 책장 넘기는 소리가 들리지 않았다",
    "소리가 더 크고 자주 들리게 되었다",
    "유령이 직접 모습을 드러내었다",
    "경비 아저씨가 무서워서 퇴근해 버렸다"
  ], "A");

addStep("p3", p3Sentences[5],
  "글쓴이가 깨달은 것은 무엇인가요?",
  [
    "책은 읽히기 위해 태어난 것이라는 사실을 깨달았다",
    "유령은 실제로 존재한다는 사실을 깨달았다",
    "도서관은 밤에 가면 안 된다는 교훈을 얻었다",
    "오래된 책은 모두 버려야 한다는 점을 알았다"
  ], "A");

addStep("p3", p3Sentences[6],
  "마지막 문장에서 책이 살아 있게 되는 조건은 무엇인가요?",
  [
    "읽어 주는 사람이 있을 때 비로소 살아 있게 된다",
    "새 표지를 씌워 주면 살아 있게 된다",
    "서가에서 높은 자리에 놓이면 살아 있게 된다",
    "도서관이 밤에도 불을 켜 두면 살아 있게 된다"
  ], "A");

// p3 중심내용
addSummary("p3", 0, p3.length,
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "글쓴이가 책을 빌린 뒤 소리가 사라지면서 책은 읽힐 때 살아 있다는 것을 깨달았다",
    "도서관의 유령이 글쓴이에게 감사 인사를 전했다",
    "사서 선생님이 도서관의 비밀을 모두 설명해 주었다",
    "글쓴이가 책을 빌렸지만 재미없어서 바로 돌려주었다"
  ], "A");

// 복기 8카드
const recall = {
  cards: [
    { id: "c1", text: "동네 도서관에는 밤마다 책장 넘기는 소리가 들린다는 소문이 있었다." },
    { id: "c2", text: "호기심 많은 글쓴이가 금요일 밤에 몰래 서가 뒤에 숨어 소리의 정체를 확인하려 했다." },
    { id: "c3", text: "서가 끝 구석에서 달빛 아래 펼쳐진 낡은 그림책을 발견했다." },
    { id: "c4", text: "책에는 '누군가의 손에 안기고 싶다'는 간절한 일기가 적혀 있었다." },
    { id: "c5", text: "그것은 유령이 아니라 오랫동안 잊혀진 책의 목소리 같았다." },
    { id: "c6", text: "다음 날 글쓴이가 이십 년 만에 그 그림책을 빌려 갔다." },
    { id: "c7", text: "그날 밤부터 도서관에서 더 이상 책장 넘기는 소리가 들리지 않았다." },
    { id: "c8", text: "책은 읽히기 위해 태어난 것이고, 읽어 주는 사람이 있을 때 비로소 살아 있게 된다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// 확인학습 7문항
const confirmQuestions = [
  {
    id: "q1",
    prompt: "도서관에서 밤마다 들렸던 소리는 어떤 소리였나요?",
    answerText: "책장 넘기는 소리",
    answerMatchMode: "ANY"
  },
  {
    id: "q2",
    prompt: "글쓴이가 밤에 숨어 있다가 발견한 것은 무엇인가요?",
    answerText: "낡은 그림책",
    answerMatchMode: "ANY"
  },
  {
    id: "q3",
    prompt: "일기에서 책이 간절히 바란 것은 무엇인가요?",
    answerText: "누군가의 손에 안기고 싶다는 간절한 바람",
    answerMatchMode: "ANY"
  },
  {
    id: "q4",
    prompt: "사서 선생님에 따르면 그 책은 얼마나 오랫동안 빌려 간 적이 없었나요?",
    answerText: "이십 년",
    answerMatchMode: "ANY"
  },
  {
    id: "q5",
    prompt: "그림책에 담긴 이야기의 내용은 무엇이었나요?",
    answerText: "별이 길을 잃은 아이에게 길을 알려 주는 따뜻한 이야기",
    answerMatchMode: "ANY"
  },
  {
    id: "q6",
    prompt: "글쓴이가 책을 빌려 간 뒤 도서관에서 달라진 점은 무엇인가요?",
    answerText: "더 이상 책장 넘기는 소리가 들리지 않았다",
    answerMatchMode: "ANY"
  },
  {
    id: "q7",
    prompt: "글쓴이가 이 경험을 통해 깨달은 것은 무엇인가요?",
    answerText: "읽어 주는 사람이 있을 때 비로소 살아 있게 된다",
    answerMatchMode: "ANY"
  }
];

// answerRanges 계산
for (const q of confirmQuestions) {
  for (const p of paragraphs) {
    const idx = p.text.indexOf(q.answerText);
    if (idx !== -1) {
      q.answerRanges = [{ paragraphId: p.id, start: idx, end: idx + q.answerText.length }];
      break;
    }
  }
  if (!q.answerRanges) {
    console.error(`답 "${q.answerText}"을(를) 지문에서 찾을 수 없습니다!`);
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
  contentId: "dr-f3-010",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(프레게 3) Day 10 문학",
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

fs.writeFileSync('frontend/public/daily-reading/frege3/010.json', json, 'utf8');
console.log("\n010.json 저장 완료");

const batchPath = 'generated/daily-batch-reading-frege3.json';
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[9] = {
  content_type: "DAILY_READING",
  level_id: "FREGE_3",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 10,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log("배치 파일 items[9] 업데이트 완료");
