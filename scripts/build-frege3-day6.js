// Day 6: 현대 단편 — 우정과 성장 (LITERATURE)
// 초6~중1 수준, 1000자 ±50

const fs = require('fs');

// ── 지문 작성 (3문단) ──
const p1Sentences = [
  "은서는 전학 온 첫날부터 교실 한구석에 혼자 앉아 있었다.",
  "낯선 교실의 공기가 무겁게 느껴졌고, 아이들의 웃음소리가 오히려 자신만 빠져 있다는 사실을 더 또렷하게 만들었다.",
  "쉬는 시간에도 은서는 책상 위에 팔을 괴고 창밖만 바라보았다.",
  "창밖에는 봄볕이 내리쬐고 벚꽃이 흩날리고 있었지만, 은서의 마음은 겨울처럼 차갑게 느껴졌다.",
  "그때 복도 쪽에서 또박또박 걸어오는 발소리가 들렸다.",
  "\"너 혹시 그림 좋아해?\"",
  "고개를 돌리니 짧은 머리에 물감이 묻은 앞치마를 두른 아이가 환하게 웃으며 서 있었다.",
  "그 아이의 이름은 지호였고, 미술부에서 부원을 찾고 있다며 은서의 손을 이끌었다."
];

const p2Sentences = [
  "미술실에 들어서자 커다란 캔버스 여러 개가 벽에 기대어 있었고, 물감 냄새가 은은하게 풍겼다.",
  "창가 쪽 선반에는 색색의 물감 통이 나란히 놓여 있었고, 햇살이 비스듬히 들어와 방 안을 따뜻하게 감싸고 있었다.",
  "지호는 팔레트 위에 빨강과 파랑을 짜 놓고 은서에게 붓을 건넸다.",
  "은서는 머뭇거리다가 조심스럽게 붓을 적셔 캔버스 위에 한 줄을 그었다.",
  "선은 삐뚤었지만 지호는 \"첫 선이 제일 중요한 거야.\"라고 말하며 활짝 웃었다.",
  "그 한마디가 은서의 긴장을 풀어 주었고, 어느새 두 사람은 나란히 앉아 서로의 그림에 대해 이야기하고 있었다.",
  "은서는 파란 하늘 아래 나무 한 그루를 그렸고, 지호는 그 옆에 작은 새 한 마리를 더해 주었다."
];

const p3Sentences = [
  "그날 이후 은서와 지호는 매일 점심시간마다 미술실에서 만났다.",
  "처음에는 그림만 그렸지만, 차츰 좋아하는 음악이나 주말 계획 같은 이야기도 나누게 되었다.",
  "은서는 지호 덕분에 새 학교가 더 이상 낯설지 않다는 것을 느꼈고, 아침에 눈을 뜨면 학교에 가는 일이 기다려지기까지 했다.",
  "한 달이 지나자 은서의 그림은 학교 복도 게시판에 걸렸고, 아이들이 다가와 \"잘 그린다.\"라고 말해 주었다.",
  "은서는 그제야 깨달았다.",
  "용기를 내어 내민 손 하나가 외로움을 우정으로 바꿀 수 있다는 것, 그리고 그 우정이 자신을 성장하게 만든다는 것을 말이다."
];

const p1Text = p1Sentences.join("");
const p2Text = p2Sentences.join("");
const p3Text = p3Sentences.join("");

console.log("=== 지문 길이 ===");
console.log("p1:", p1Text.length, "p2:", p2Text.length, "p3:", p3Text.length);
console.log("전체:", p1Text.length + p2Text.length + p3Text.length);

function computeBounds(sentences) {
  const b = []; let pos = 0;
  for (const s of sentences) { b.push({ start: pos, end: pos + s.length }); pos += s.length; }
  return b;
}

const p1B = computeBounds(p1Sentences);
const p2B = computeBounds(p2Sentences);
const p3B = computeBounds(p3Sentences);

console.log("\n=== p1 경계 ===");
p1B.forEach((b,i) => console.log(`[${b.start},${b.end}] "${p1Text.substring(b.start,b.end)}"`));
console.log("\n=== p2 경계 ===");
p2B.forEach((b,i) => console.log(`[${b.start},${b.end}] "${p2Text.substring(b.start,b.end)}"`));
console.log("\n=== p3 경계 ===");
p3B.forEach((b,i) => console.log(`[${b.start},${b.end}] "${p3Text.substring(b.start,b.end)}"`));

// ── 정독 ──
const timeline = [];
let sn = 1;

const p1Q = [
  {
    prompt: "첫 문장에서 은서는 전학 온 첫날 어디에 앉아 있었나요?",
    choices: [
      { id: "A", text: "교실 한구석에 혼자 앉아 있었다고 한다" },
      { id: "B", text: "운동장 한가운데에 서 있었다고 말한다" },
      { id: "C", text: "도서관 책상 앞에 앉아 있었다고 한다" },
      { id: "D", text: "복도 의자에 친구와 나란히 앉아 있었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 아이들의 웃음소리가 은서에게 어떤 느낌을 주었나요?",
    choices: [
      { id: "A", text: "자신만 빠져 있다는 사실을 더 또렷하게 만들었다" },
      { id: "B", text: "함께 웃게 되어 금세 마음이 편해졌다고 한다" },
      { id: "C", text: "너무 시끄러워서 귀를 막고 싶어졌다고 한다" },
      { id: "D", text: "재미있는 이야기가 궁금해 가까이 다가갔다 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 쉬는 시간에 은서가 한 행동은 무엇인가요?",
    choices: [
      { id: "A", text: "책상 위에 팔을 괴고 창밖만 바라보았다고 한다" },
      { id: "B", text: "복도에 나가 다른 반 아이들과 놀았다고 한다" },
      { id: "C", text: "급식실에 가서 간식을 먹고 있었다고 한다" },
      { id: "D", text: "교실 앞에서 자기소개를 하고 있었다고 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 창밖 풍경과 은서의 마음은 어떻게 대비되나요?",
    choices: [
      { id: "A", text: "밖은 봄볕과 벚꽃이 흩날리지만 마음은 겨울처럼 차갑다" },
      { id: "B", text: "밖은 비가 내리지만 마음은 따뜻하고 행복했다고 한다" },
      { id: "C", text: "밖은 눈이 내리고 마음도 마찬가지로 차갑게 느꼈다 한다" },
      { id: "D", text: "밖은 어두웠지만 마음은 밝고 기대에 찼다고 말한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 복도 쪽에서 들린 것은 무엇인가요?",
    choices: [
      { id: "A", text: "또박또박 걸어오는 발소리가 들렸다고 한다" },
      { id: "B", text: "선생님이 부르는 큰 목소리가 들렸다 한다" },
      { id: "C", text: "음악 시간의 피아노 소리가 들렸다고 한다" },
      { id: "D", text: "체육 시간의 호루라기 소리가 들렸다 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 은서에게 물어본 질문은 무엇인가요?",
    choices: [
      { id: "A", text: "그림을 좋아하는지 물어보았다" },
      { id: "B", text: "운동을 좋아하는지 물어보았다" },
      { id: "C", text: "노래를 좋아하는지 물어보았다" },
      { id: "D", text: "요리를 좋아하는지 물어보았다" }
    ],
    answerId: "A"
  },
  {
    prompt: "일곱째 문장에서 은서 앞에 서 있던 아이의 모습은 어떠했나요?",
    choices: [
      { id: "A", text: "짧은 머리에 물감이 묻은 앞치마를 두르고 있었다" },
      { id: "B", text: "긴 머리에 운동복을 입고 공을 들고 있었다" },
      { id: "C", text: "안경을 쓰고 두꺼운 책을 들고 있었다고 한다" },
      { id: "D", text: "교복을 깔끔하게 입고 가방을 메고 있었다 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여덟째 문장에서 지호는 은서에게 무엇을 하자고 했나요?",
    choices: [
      { id: "A", text: "미술부에서 부원을 찾고 있다며 은서의 손을 이끌었다" },
      { id: "B", text: "도서관에서 함께 책을 읽자며 은서를 불렀다 한다" },
      { id: "C", text: "급식실에서 같이 밥을 먹자며 자리를 안내했다 한다" },
      { id: "D", text: "운동장에서 함께 달리기를 하자며 뛰어갔다 한다" }
    ],
    answerId: "A"
  }
];

p1B.forEach((b,i) => {
  timeline.push({
    stepId: `s${sn}`,
    highlight: { ranges: [{ paragraphId: "p1", start: b.start, end: b.end }] },
    question: { ...p1Q[i], scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true } }
  });
  sn++;
});

timeline.push({
  stepId: `s${sn}`,
  highlight: { ranges: [{ paragraphId: "p1", start: 0, end: p1Text.length }] },
  question: {
    prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "전학 온 은서가 외로이 지내다가 지호를 만나 미술부로 이끌린다" },
      { id: "B", text: "은서가 전학 온 학교에서 반장 선거에 나가기로 결심한다 한다" },
      { id: "C", text: "은서가 전학 온 학교의 급식이 맛있어 금세 적응했다 한다" },
      { id: "D", text: "은서가 전학을 가기 싫어 부모님과 크게 다투었다 한다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});
sn++;

const p2Q = [
  {
    prompt: "첫 문장에서 미술실에 들어서자 어떤 모습이 보였나요?",
    choices: [
      { id: "A", text: "커다란 캔버스가 벽에 기대어 있고 물감 냄새가 풍겼다" },
      { id: "B", text: "운동 기구가 놓여 있고 땀 냄새가 가득했다고 한다" },
      { id: "C", text: "악기들이 줄지어 있고 음악 소리가 들렸다고 한다" },
      { id: "D", text: "책상만 있고 아무것도 없어 쓸쓸했다고 말하고 있다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 미술실 창가 쪽 선반의 모습은 어떠했나요?",
    choices: [
      { id: "A", text: "색색의 물감 통이 나란히 놓여 있고 햇살이 들어왔다" },
      { id: "B", text: "먼지가 쌓인 책들이 가득 꽂혀 있었다고 한다" },
      { id: "C", text: "운동 기구가 정리되어 있었다고 말하고 있다" },
      { id: "D", text: "아무것도 없이 텅 비어 있었다고 말하고 있다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 지호가 은서에게 건넨 것은 무엇인가요?",
    choices: [
      { id: "A", text: "팔레트에 물감을 짜 놓고 붓을 건넸다고 한다" },
      { id: "B", text: "공책과 연필을 꺼내 건넸다고 말하고 있다" },
      { id: "C", text: "과자와 음료수를 꺼내 건넸다고 말하고 있다" },
      { id: "D", text: "운동화와 줄넘기를 꺼내 건넸다고 말하고 있다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 은서가 캔버스에 처음 한 일은 무엇인가요?",
    choices: [
      { id: "A", text: "머뭇거리다가 조심스럽게 붓을 적셔 한 줄을 그었다" },
      { id: "B", text: "바로 자신 있게 멋진 풍경화를 완성했다고 한다" },
      { id: "C", text: "붓 대신 손으로 물감을 찍어 그림을 그렸다 한다" },
      { id: "D", text: "캔버스를 뒤집어 뒷면에 이름을 먼저 적었다 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 지호가 은서에게 한 말은 무엇인가요?",
    choices: [
      { id: "A", text: "첫 선이 제일 중요한 거라고 말하며 활짝 웃었다" },
      { id: "B", text: "선이 너무 삐뚤어서 다시 그려야 한다고 말했다" },
      { id: "C", text: "다음부터는 연필로 먼저 밑그림을 그리라 했다" },
      { id: "D", text: "그림보다 글씨 연습을 먼저 하라고 충고했다 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 지호의 말이 은서에게 준 영향은 무엇인가요?",
    choices: [
      { id: "A", text: "긴장을 풀어 주어 서로의 그림에 대해 이야기하게 되었다" },
      { id: "B", text: "긴장이 더 심해져 은서가 미술실을 나가 버렸다 한다" },
      { id: "C", text: "은서가 그림을 포기하고 다른 동아리를 찾게 되었다" },
      { id: "D", text: "은서가 화가 나서 붓을 내려놓고 말을 하지 않았다" }
    ],
    answerId: "A"
  },
  {
    prompt: "일곱째 문장에서 은서가 그린 것과 지호가 더해 준 것은 무엇인가요?",
    choices: [
      { id: "A", text: "은서는 나무를 그렸고 지호는 그 옆에 작은 새를 더했다" },
      { id: "B", text: "은서는 바다를 그렸고 지호는 큰 배를 더해 주었다" },
      { id: "C", text: "은서는 집을 그렸고 지호는 굴뚝 연기를 더해 주었다" },
      { id: "D", text: "은서는 꽃을 그렸고 지호는 나비 떼를 더해 주었다" }
    ],
    answerId: "A"
  }
];

p2B.forEach((b,i) => {
  timeline.push({
    stepId: `s${sn}`,
    highlight: { ranges: [{ paragraphId: "p2", start: b.start, end: b.end }] },
    question: { ...p2Q[i], scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true } }
  });
  sn++;
});

timeline.push({
  stepId: `s${sn}`,
  highlight: { ranges: [{ paragraphId: "p2", start: 0, end: p2Text.length }] },
  question: {
    prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "미술실에서 그림을 그리며 은서와 지호가 가까워지기 시작한다" },
      { id: "B", text: "은서가 미술 대회에서 상을 받아 학교에서 유명해졌다 한다" },
      { id: "C", text: "지호가 은서의 그림을 비판해서 둘이 크게 다투었다 한다" },
      { id: "D", text: "미술실이 닫혀서 두 사람이 운동장에서 놀기로 했다 한다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});
sn++;

const p3Q = [
  {
    prompt: "첫 문장에서 은서와 지호가 매일 만나는 시간과 장소는 무엇인가요?",
    choices: [
      { id: "A", text: "매일 점심시간마다 미술실에서 만났다고 한다" },
      { id: "B", text: "매일 아침 등교 시간에 교문 앞에서 만났다 한다" },
      { id: "C", text: "매주 토요일 오후에 도서관에서 만났다고 한다" },
      { id: "D", text: "매일 방과 후에 운동장에서 만났다고 말하고 있다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 시간이 지나며 두 사람이 나누게 된 것은 무엇인가요?",
    choices: [
      { id: "A", text: "좋아하는 음악이나 주말 계획 같은 이야기를 나누게 되었다" },
      { id: "B", text: "시험 답안지를 서로 보여 주며 점수를 비교하게 되었다" },
      { id: "C", text: "과제를 대신 해 주며 성적만 올리는 데 집중하게 되었다" },
      { id: "D", text: "급식 메뉴 불만만 이야기하며 불평을 나누게 되었다 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 은서가 느낀 것은 무엇인가요?",
    choices: [
      { id: "A", text: "지호 덕분에 학교가 낯설지 않고 등교가 기다려지게 되었다" },
      { id: "B", text: "지호 때문에 학교가 더 불편해졌다고 느꼈다고 한다" },
      { id: "C", text: "새 학교 수업이 너무 어렵다고 느꼈다고 말하고 있다" },
      { id: "D", text: "예전 학교가 더 그리워졌다고 느꼈다고 말하고 있다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 한 달 뒤 은서의 그림에 일어난 일은 무엇인가요?",
    choices: [
      { id: "A", text: "학교 복도 게시판에 걸려 아이들이 잘 그린다고 말했다" },
      { id: "B", text: "선생님이 그림을 회수하여 보관함에 넣어 두었다 한다" },
      { id: "C", text: "그림이 물에 젖어 새로 그려야 했다고 말하고 있다" },
      { id: "D", text: "미술 대회에 출품되어 전국 상을 받았다고 말하고 있다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 은서가 한 것은 무엇인가요?",
    choices: [
      { id: "A", text: "그제야 무언가를 깨달았다고 밝히고 있다" },
      { id: "B", text: "그림을 더 이상 그리지 않기로 결심했다고 한다" },
      { id: "C", text: "미술부를 그만두고 다른 동아리에 가입했다 한다" },
      { id: "D", text: "지호에게 감사 편지를 보냈다고 말하고 있다" }
    ],
    answerId: "A"
  },
  {
    prompt: "마지막 문장에서 은서가 깨달은 내용은 무엇인가요?",
    choices: [
      { id: "A", text: "용기를 내어 내민 손이 외로움을 우정으로 바꾸고 성장하게 한다" },
      { id: "B", text: "혼자 있는 것이 가장 편하고 친구는 필요 없다는 것이다" },
      { id: "C", text: "전학을 가면 누구든 반드시 외로워진다는 것이라 한다" },
      { id: "D", text: "그림을 잘 그려야만 친구를 사귈 수 있다는 것이라 한다" }
    ],
    answerId: "A"
  }
];

p3B.forEach((b,i) => {
  timeline.push({
    stepId: `s${sn}`,
    highlight: { ranges: [{ paragraphId: "p3", start: b.start, end: b.end }] },
    question: { ...p3Q[i], scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true } }
  });
  sn++;
});

timeline.push({
  stepId: `s${sn}`,
  highlight: { ranges: [{ paragraphId: "p3", start: 0, end: p3Text.length }] },
  question: {
    prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "우정이 깊어지며 은서가 학교에 적응하고 성장함을 깨달았다" },
      { id: "B", text: "은서가 미술을 포기하고 다른 취미를 찾기로 했다고 한다" },
      { id: "C", text: "지호가 다른 학교로 전학을 가서 은서가 슬퍼졌다 한다" },
      { id: "D", text: "은서가 성적이 올라 반에서 일등을 하게 되었다 한다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});

// ── 복기 8카드 ──
const recall = {
  cards: [
    { id: "c1", text: "전학 온 은서는 교실 한구석에 혼자 앉아 외로움을 느꼈다." },
    { id: "c2", text: "쉬는 시간에 지호가 다가와 그림을 좋아하는지 물으며 미술부로 이끌었다." },
    { id: "c3", text: "미술실에서 은서는 머뭇거리다 캔버스에 첫 선을 그었다." },
    { id: "c4", text: "지호는 첫 선이 제일 중요하다고 말하며 은서의 긴장을 풀어 주었다." },
    { id: "c5", text: "은서는 나무를 그렸고 지호가 작은 새를 더해 함께 그림을 완성했다." },
    { id: "c6", text: "매일 점심마다 미술실에서 만나며 그림뿐 아니라 일상 이야기도 나누었다." },
    { id: "c7", text: "한 달 뒤 은서의 그림이 복도 게시판에 걸려 아이들의 칭찬을 받았다." },
    { id: "c8", text: "은서는 용기를 내민 손이 외로움을 우정으로 바꾸고 성장하게 한다고 깨달았다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// ── 확인학습 ──
function findRange(text, pid, answer) {
  const idx = text.indexOf(answer);
  if (idx === -1) { console.error(`ERROR: "${answer}" not found in ${pid}!`); return null; }
  return { paragraphId: pid, start: idx, end: idx + answer.length };
}

const cQs = [
  { id: "q1", prompt: "전학 온 첫날 은서가 혼자 앉아 있던 곳은 어디인가요?", answerText: "교실 한구석", pid: "p1", t: p1Text },
  { id: "q2", prompt: "은서에게 그림을 좋아하는지 물어본 아이의 이름은 무엇인가요?", answerText: "지호", pid: "p1", t: p1Text },
  { id: "q3", prompt: "지호의 앞치마에 묻어 있던 것은 무엇인가요?", answerText: "물감", pid: "p1", t: p1Text },
  { id: "q4", prompt: "지호가 팔레트 위에 짜 놓은 두 가지 색은 무엇인가요?", answerText: "빨강과 파랑", pid: "p2", t: p2Text },
  { id: "q5", prompt: "은서가 파란 하늘 아래 캔버스에 그린 것은 무엇인가요?", answerText: "나무", pid: "p2", t: p2Text },
  { id: "q6", prompt: "은서의 그림이 한 달 뒤 걸린 곳은 어디인가요?", answerText: "게시판", pid: "p3", t: p3Text },
  { id: "q7", prompt: "은서가 깨달은 것에서, 외로움을 바꿀 수 있는 것은 무엇인가요?", answerText: "우정", pid: "p3", t: p3Text }
];

const confirm = {
  questions: cQs.map(q => {
    const range = findRange(q.t, q.pid, q.answerText);
    return {
      id: q.id, prompt: q.prompt, answerText: q.answerText, answerMatchMode: "ANY",
      answerRanges: range ? [range] : [],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    };
  })
};

// ── JSON 조립 ──
const content = {
  contentId: "dr-f3-006",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(프레게 3) Day 6 문학",
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
    passage: {
      format: "TEXT",
      paragraphs: [
        { id: "p1", text: p1Text },
        { id: "p2", text: p2Text },
        { id: "p3", text: p3Text }
      ]
    },
    intensive: { timeline },
    recall,
    confirm
  }
};

// ── 검증 ──
console.log("\n=== 검증 ===");
const total = p1Text.length + p2Text.length + p3Text.length;
console.log(`지문 길이: ${total} (950~1050: ${total >= 950 && total <= 1050 ? 'OK' : 'FAIL'})`);
console.log(`recall: ${recall.cards.length} (${recall.cards.length===8?'OK':'FAIL'})`);
console.log(`confirm: ${confirm.questions.length} (${confirm.questions.length>=5&&confirm.questions.length<=10?'OK':'FAIL'})`);
console.log(`steps: ${timeline.length}`);

let hlOk = true;
for (const s of timeline) {
  for (const r of s.highlight.ranges) {
    const t = r.paragraphId==="p1"?p1Text:r.paragraphId==="p2"?p2Text:p3Text;
    if (r.start<0||r.end>t.length||r.start>=r.end) { console.error(`HL FAIL: ${s.stepId}`); hlOk=false; }
  }
}
console.log(`highlight: ${hlOk?'OK':'FAIL'}`);

let arOk = true;
for (const q of confirm.questions) {
  for (const r of q.answerRanges) {
    const t = r.paragraphId==="p1"?p1Text:r.paragraphId==="p2"?p2Text:p3Text;
    if (t.substring(r.start,r.end) !== q.answerText) { console.error(`AR FAIL: ${q.id}`); arOk=false; }
  }
}
console.log(`answerRanges: ${arOk?'OK':'FAIL'}`);

// ── 파일 저장 ──
const sp = 'C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/frontend/public/daily-reading/frege3/006.json';
fs.writeFileSync(sp, JSON.stringify(content, null, 2), 'utf8');
console.log(`\n파일 저장: ${sp}`);

const bp = 'C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/generated/daily-batch-reading-frege3.json';
const bd = JSON.parse(fs.readFileSync(bp, 'utf8'));
bd.items[5] = {
  content_type: "DAILY_READING", level_id: "FREGE_3", area: "READING", sub_area: "LITERATURE",
  day_index: 6, module_key: "reading_training", schema_version: "1.0", content: content
};
fs.writeFileSync(bp, JSON.stringify(bd, null, 2), 'utf8');
console.log(`배치 업데이트: ${bp}`);
console.log("\n=== Day 6 완료 ===");
