// Day 4: 현대 수필 — 계절의 변화와 일상의 관찰 (LITERATURE)
// 초6~중1 수준, 1000자 ±50

const fs = require('fs');

// ── 지문 작성 (3문단) ──
const p1Sentences = [
  "가을이 오면 나는 집 앞 느티나무를 가장 먼저 올려다본다.",
  "여름 내내 짙은 초록이던 잎사귀가 어느 날 문득 노랗게 물들기 시작하면, 그제야 계절이 바뀌고 있음을 실감하게 된다.",
  "아침마다 현관문을 열면 선선한 바람이 코끝을 스치고, 발밑에는 밤새 떨어진 낙엽 서너 장이 조용히 놓여 있다.",
  "나는 그 낙엽을 밟지 않으려고 살짝 돌아서 걷곤 하는데, 그 작은 몸짓이 가을과 인사하는 나만의 방식이다.",
  "하늘도 달라진다.",
  "구름이 높아지고 파란빛이 한층 깊어져서, 올려다보기만 해도 마음이 넓어지는 듯한 느낌을 받는다.",
  "해가 짧아지는 만큼 저녁노을은 더 붉고 선명해져서, 귀갓길에 하늘을 바라보는 시간이 자연스레 길어진다.",
  "그래서인지 나는 사계절 가운데 가을을 가장 좋아하는데, 조용히 다가오면서도 세상을 가장 화려하게 바꾸어 놓는 계절이기 때문이다."
];

const p2Sentences = [
  "이처럼 계절의 변화는 거창한 사건이 아니라 일상 곳곳에 숨어 있는 작은 신호들이다.",
  "슈퍼에 귤이 쌓이기 시작하면 겨울이 가까워졌다는 뜻이고, 길가에 진달래가 피면 봄이 왔다는 뜻이다.",
  "이러한 변화를 알아차리려면 주변을 천천히 관찰하는 습관이 필요하다.",
  "바쁘게 지나치면 어제와 오늘이 같아 보이지만, 잠깐 멈추어 살펴보면 공기의 온도도, 풀잎의 색깔도, 새소리의 높낮이도 달라져 있다.",
  "나는 이런 변화를 발견할 때마다 작은 수첩에 날짜와 함께 적어 둔다.",
  "지난해의 기록을 꺼내 읽으면 같은 계절이라도 해마다 조금씩 다르다는 것을 알 수 있어서 흥미롭다."
];

const p3Sentences = [
  "어머니는 내 수첩을 보시더니 웃으며 말씀하셨다.",
  "\"나도 어릴 때 할머니와 함께 텃밭에서 계절을 배웠단다.\"",
  "할머니는 무 싹이 올라오는 시기를 보고 첫서리가 올 날을 짐작하셨고, 감나무에 까치가 모이는 것을 보고 곧 추워질 것을 아셨다고 한다.",
  "어머니의 이야기를 들으며 나는 깨달았다.",
  "계절을 관찰하는 일은 자연과 대화하는 일이며, 동시에 세대를 이어 전해지는 삶의 지혜이기도 하다.",
  "오늘도 나는 학교에서 돌아오는 길에 느티나무 아래 잠시 멈추어 서서, 어제보다 조금 더 붉어진 잎사귀를 가만히 올려다보았다."
];

const p1Text = p1Sentences.join("");
const p2Text = p2Sentences.join("");
const p3Text = p3Sentences.join("");
const fullText = p1Text + p2Text + p3Text;

console.log("=== 지문 길이 확인 ===");
console.log("p1 길이:", p1Text.length);
console.log("p2 길이:", p2Text.length);
console.log("p3 길이:", p3Text.length);
console.log("전체 길이:", fullText.length);

// ── 문장 경계 계산 ──
function computeSentenceBoundaries(sentences) {
  const boundaries = [];
  let pos = 0;
  for (const s of sentences) {
    boundaries.push({ start: pos, end: pos + s.length });
    pos += s.length;
  }
  return boundaries;
}

const p1Bounds = computeSentenceBoundaries(p1Sentences);
const p2Bounds = computeSentenceBoundaries(p2Sentences);
const p3Bounds = computeSentenceBoundaries(p3Sentences);

console.log("\n=== p1 문장 경계 ===");
p1Bounds.forEach((b, i) => {
  console.log(`[${b.start}, ${b.end}] "${p1Text.substring(b.start, b.end)}"`);
});
console.log("\n=== p2 문장 경계 ===");
p2Bounds.forEach((b, i) => {
  console.log(`[${b.start}, ${b.end}] "${p2Text.substring(b.start, b.end)}"`);
});
console.log("\n=== p3 문장 경계 ===");
p3Bounds.forEach((b, i) => {
  console.log(`[${b.start}, ${b.end}] "${p3Text.substring(b.start, b.end)}"`);
});

// ── 정독 timeline 생성 ──
const timeline = [];
let stepNum = 1;

// p1 문장별 step
const p1Questions = [
  {
    prompt: "글쓴이는 가을이 오면 무엇을 가장 먼저 한다고 하나요?",
    choices: [
      { id: "A", text: "집 앞 느티나무를 올려다보는 일을 가장 먼저 한다" },
      { id: "B", text: "집 앞 화단에 새 꽃씨를 심는 일을 가장 먼저 한다" },
      { id: "C", text: "동네 산에 올라 낙엽을 모으는 일을 가장 먼저 한다" },
      { id: "D", text: "현관 앞 빗자루를 꺼내 마당을 쓰는 일을 가장 먼저 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 글쓴이가 계절 변화를 실감하는 순간은 언제인가요?",
    choices: [
      { id: "A", text: "짙은 초록이던 잎이 노랗게 물들기 시작할 때 실감한다" },
      { id: "B", text: "느티나무가 새 잎을 틔울 때 실감하게 된다고 말한다" },
      { id: "C", text: "비가 내려 잎사귀가 바닥에 누울 때 실감한다고 한다" },
      { id: "D", text: "바람이 불어 가지가 부러질 때 실감하게 된다고 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 아침 현관문을 열었을 때 발밑에 놓인 것은 무엇인가요?",
    choices: [
      { id: "A", text: "밤새 떨어진 낙엽 서너 장이 조용히 놓여 있다고 한다" },
      { id: "B", text: "밤새 내린 빗물 웅덩이가 반짝이고 있다고 말한다" },
      { id: "C", text: "밤새 모인 흙먼지가 두껍게 쌓여 있다고 말한다" },
      { id: "D", text: "밤새 자란 풀잎이 현관 틈으로 올라왔다고 말한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 글쓴이가 낙엽을 밟지 않고 돌아서 걷는 행위는 무엇이라고 했나요?",
    choices: [
      { id: "A", text: "가을과 인사하는 나만의 방식이라고 표현했다" },
      { id: "B", text: "겨울을 준비하는 집안 청소의 시작이라고 했다" },
      { id: "C", text: "아침 운동의 일부로 하는 스트레칭이라고 했다" },
      { id: "D", text: "현관을 깨끗이 유지하려는 생활 습관이라고 했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장이 전하는 변화의 대상은 무엇인가요?",
    choices: [
      { id: "A", text: "하늘이 달라진다고 말하고 있다" },
      { id: "B", text: "바다가 달라진다고 말하고 있다" },
      { id: "C", text: "도로가 달라진다고 말하고 있다" },
      { id: "D", text: "교실이 달라진다고 말하고 있다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 가을 하늘을 올려다보면 어떤 느낌을 받는다고 하나요?",
    choices: [
      { id: "A", text: "구름이 높아지고 파란빛이 깊어져 마음이 넓어지는 느낌이다" },
      { id: "B", text: "구름이 낮아지고 회색빛이 짙어져 마음이 무거운 느낌이다" },
      { id: "C", text: "구름이 사라지고 햇빛이 강해져 눈이 부신 느낌만 든다" },
      { id: "D", text: "구름이 빠르게 움직여 어지러운 느낌이 강하게 든다" }
    ],
    answerId: "A"
  },
  {
    prompt: "일곱째 문장에서 해가 짧아지면서 달라지는 것은 무엇인가요?",
    choices: [
      { id: "A", text: "저녁노을이 더 붉고 선명해져 하늘 보는 시간이 길어진다" },
      { id: "B", text: "아침 해가 더 밝아져 일찍 일어나는 시간이 짧아진다" },
      { id: "C", text: "구름이 더 두꺼워져 밤하늘 별을 보는 시간이 줄어든다" },
      { id: "D", text: "낮 기온이 올라가 바깥에서 머무는 시간이 크게 늘어난다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여덟째 문장에서 글쓴이가 가을을 가장 좋아하는 까닭은 무엇인가요?",
    choices: [
      { id: "A", text: "조용히 다가오면서도 세상을 가장 화려하게 바꾸어 놓기 때문이다" },
      { id: "B", text: "다른 계절보다 날씨가 덥고 바깥 놀이를 많이 할 수 있기 때문이다" },
      { id: "C", text: "갑자기 찾아와서 사람들을 놀라게 만드는 계절이기 때문이다" },
      { id: "D", text: "나뭇잎이 모두 떨어져 거리가 깨끗해지는 계절이기 때문이다" }
    ],
    answerId: "A"
  }
];

p1Bounds.forEach((b, i) => {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [{ paragraphId: "p1", start: b.start, end: b.end }] },
    question: {
      ...p1Questions[i],
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
});

// p1 문단 중심내용
timeline.push({
  stepId: `s${stepNum}`,
  highlight: { ranges: [{ paragraphId: "p1", start: 0, end: p1Text.length }] },
  question: {
    prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "가을이 오면 나무와 하늘의 변화를 통해 계절 전환을 감각적으로 느낀다" },
      { id: "B", text: "가을이 오면 나무를 베어 겨울 땔감을 미리 준비해야 한다고 말한다" },
      { id: "C", text: "가을이 오면 집 앞을 청소해야 낙엽 피해를 줄일 수 있다고 말한다" },
      { id: "D", text: "가을이 오면 하늘이 흐려져 야외 활동을 줄여야 한다고 말한다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});
stepNum++;

// p2 문장별 step
const p2Questions = [
  {
    prompt: "첫 문장은 계절의 변화를 어떤 것이라고 표현하나요?",
    choices: [
      { id: "A", text: "일상 곳곳에 숨어 있는 작은 신호들이라고 표현한다" },
      { id: "B", text: "한 해에 한 번만 찾아오는 거창한 사건이라고 표현한다" },
      { id: "C", text: "과학자들만 알아차릴 수 있는 특별한 현상이라 표현한다" },
      { id: "D", text: "텔레비전 뉴스를 통해서만 알 수 있는 정보라고 표현한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 귤이 쌓이기 시작하면 어떤 뜻이라고 하나요?",
    choices: [
      { id: "A", text: "겨울이 가까워졌다는 뜻이라고 한다" },
      { id: "B", text: "여름이 시작되었다는 뜻이라고 한다" },
      { id: "C", text: "봄비가 그쳤다는 뜻이라고 말한다" },
      { id: "D", text: "가을 축제가 끝났다는 뜻이라고 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장이 말하는 변화를 알아차리는 데 필요한 것은 무엇인가요?",
    choices: [
      { id: "A", text: "주변을 천천히 관찰하는 습관이 필요하다고 말한다" },
      { id: "B", text: "비싼 관측 장비를 사서 측정하는 일이 필요하다고 한다" },
      { id: "C", text: "매일 인터넷 검색으로 날씨를 확인하는 일이 필요하다 한다" },
      { id: "D", text: "친구들과 함께 등산을 자주 가는 체력이 필요하다고 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 잠깐 멈추어 살펴보면 달라져 있는 것은 무엇인가요?",
    choices: [
      { id: "A", text: "공기의 온도, 풀잎의 색깔, 새소리의 높낮이가 달라져 있다" },
      { id: "B", text: "건물의 높이, 자동차의 수, 도로의 폭이 달라져 있다고 한다" },
      { id: "C", text: "교실의 크기, 책상의 색, 칠판의 글씨가 달라져 있다고 한다" },
      { id: "D", text: "신발의 크기, 옷의 색상, 가방의 무게가 달라져 있다고 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 글쓴이가 변화를 발견할 때마다 하는 일은 무엇인가요?",
    choices: [
      { id: "A", text: "작은 수첩에 날짜와 함께 적어 둔다고 한다" },
      { id: "B", text: "사진을 찍어 벽에 크게 붙여 둔다고 한다" },
      { id: "C", text: "동영상을 찍어 친구들에게 보내 준다고 한다" },
      { id: "D", text: "큰 소리로 읽어 이웃에게 알려 준다고 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 지난해 기록을 꺼내 읽으면 알 수 있는 것은 무엇인가요?",
    choices: [
      { id: "A", text: "같은 계절이라도 해마다 조금씩 다르다는 것을 알 수 있다" },
      { id: "B", text: "모든 계절은 해마다 정확히 같은 날에 시작한다는 것을 안다" },
      { id: "C", text: "기록을 읽어도 날씨 변화는 전혀 파악할 수 없다는 것을 안다" },
      { id: "D", text: "수첩보다 인터넷 기록이 항상 더 정확하다는 것을 알게 된다" }
    ],
    answerId: "A"
  }
];

p2Bounds.forEach((b, i) => {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [{ paragraphId: "p2", start: b.start, end: b.end }] },
    question: {
      ...p2Questions[i],
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
});

// p2 문단 중심내용
timeline.push({
  stepId: `s${stepNum}`,
  highlight: { ranges: [{ paragraphId: "p2", start: 0, end: p2Text.length }] },
  question: {
    prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "계절 변화는 작은 신호로 나타나며 관찰하고 기록하면 차이를 알 수 있다" },
      { id: "B", text: "계절 변화는 과학자만 연구하는 것이라 일반인은 모른다고 말한다" },
      { id: "C", text: "계절 변화는 매년 똑같으므로 관찰할 필요가 없다고 말한다" },
      { id: "D", text: "계절 변화는 책에서만 배울 수 있고 직접 볼 필요가 없다고 한다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});
stepNum++;

// p3 문장별 step
const p3Questions = [
  {
    prompt: "셋째 문단 첫 문장에서 어머니는 수첩을 보고 어떻게 했나요?",
    choices: [
      { id: "A", text: "수첩을 보시더니 웃으며 말씀하셨다고 한다" },
      { id: "B", text: "수첩을 보시더니 화를 내며 그만두라고 하셨다" },
      { id: "C", text: "수첩을 보시더니 새 수첩을 사 오라고 하셨다" },
      { id: "D", text: "수첩을 보시더니 관심 없이 돌아서 가셨다고 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "어머니가 어릴 때 계절을 배운 곳은 어디라고 하나요?",
    choices: [
      { id: "A", text: "할머니와 함께 텃밭에서 계절을 배웠다고 한다" },
      { id: "B", text: "학교 교실에서 선생님께 계절을 배웠다고 한다" },
      { id: "C", text: "도서관에서 책을 읽으며 계절을 배웠다고 한다" },
      { id: "D", text: "할아버지와 바닷가에서 계절을 배웠다고 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "할머니가 첫서리 올 날을 짐작한 방법은 무엇인가요?",
    choices: [
      { id: "A", text: "무 싹이 올라오는 시기를 보고 첫서리를 짐작하셨다" },
      { id: "B", text: "달력의 날짜를 세어 첫서리 날을 정확히 계산하셨다" },
      { id: "C", text: "라디오 일기예보를 듣고 첫서리 날을 알아내셨다" },
      { id: "D", text: "바람의 방향을 재서 첫서리가 올 날을 계산하셨다" }
    ],
    answerId: "A"
  },
  {
    prompt: "어머니의 이야기를 듣고 글쓴이가 깨달은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "이야기를 들으며 무언가를 깨달았다는 사실을 밝히고 있다" },
      { id: "B", text: "이야기를 들으며 수첩 기록을 그만두기로 결심했다고 한다" },
      { id: "C", text: "이야기를 들으며 할머니의 방법이 틀렸다고 생각했다" },
      { id: "D", text: "이야기를 들으며 계절 관찰에 흥미를 잃었다고 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 계절을 관찰하는 일은 무엇이라고 했나요?",
    choices: [
      { id: "A", text: "자연과 대화하며 세대를 이어 전해지는 삶의 지혜라고 했다" },
      { id: "B", text: "시간 낭비이며 공부에 방해되는 취미라고 했다고 말한다" },
      { id: "C", text: "과학자만 해야 하는 전문적인 연구 활동이라고 했다" },
      { id: "D", text: "어린이만 하는 놀이이며 어른은 할 필요가 없다고 했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "마지막 문장에서 글쓴이가 느티나무 아래에서 한 일은 무엇인가요?",
    choices: [
      { id: "A", text: "어제보다 조금 더 붉어진 잎사귀를 가만히 올려다보았다" },
      { id: "B", text: "떨어진 낙엽을 모두 주워 쓰레기통에 버렸다고 말한다" },
      { id: "C", text: "나무 그늘 아래 앉아 숙제를 하기 시작했다고 말한다" },
      { id: "D", text: "친구를 불러 나무 위로 함께 올라갔다고 말하고 있다" }
    ],
    answerId: "A"
  }
];

p3Bounds.forEach((b, i) => {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [{ paragraphId: "p3", start: b.start, end: b.end }] },
    question: {
      ...p3Questions[i],
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
});

// p3 문단 중심내용
timeline.push({
  stepId: `s${stepNum}`,
  highlight: { ranges: [{ paragraphId: "p3", start: 0, end: p3Text.length }] },
  question: {
    prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "계절 관찰은 세대를 이어 전해지는 삶의 지혜이자 자연과의 대화이다" },
      { id: "B", text: "할머니의 농사법은 과학적이지 않아 더 이상 쓸모가 없다고 한다" },
      { id: "C", text: "어머니가 수첩을 빼앗아 글쓴이의 기록을 중단시켰다고 말한다" },
      { id: "D", text: "느티나무는 곧 베어질 것이라 더 이상 관찰할 수 없다고 한다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});
stepNum++;

// ── 복기 8카드 ──
const recall = {
  cards: [
    { id: "c1", text: "가을이 오면 글쓴이는 집 앞 느티나무의 잎 색 변화를 가장 먼저 살핀다." },
    { id: "c2", text: "아침 현관문을 열면 선선한 바람과 낙엽이 있고, 낙엽을 밟지 않는 것이 가을 인사이다." },
    { id: "c3", text: "가을 하늘은 구름이 높아지고 파란빛이 깊어지며, 저녁노을은 더 붉고 선명해진다." },
    { id: "c4", text: "계절 변화는 귤이나 진달래처럼 일상 곳곳에 숨어 있는 작은 신호로 나타난다." },
    { id: "c5", text: "관찰하면 공기의 온도와 풀잎의 색깔, 새소리의 높낮이가 달라져 있음을 안다." },
    { id: "c6", text: "글쓴이는 변화를 수첩에 적고, 지난해 기록과 비교하며 차이를 발견한다." },
    { id: "c7", text: "어머니도 어릴 때 할머니와 텃밭에서 무 싹과 까치를 보며 계절을 배웠다." },
    { id: "c8", text: "계절 관찰은 자연과의 대화이자 세대를 이어 전해지는 삶의 지혜이다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// ── 확인학습 ──
function findRange(text, paragraphId, answer) {
  const idx = text.indexOf(answer);
  if (idx === -1) {
    console.error(`ERROR: "${answer}" not found in ${paragraphId}!`);
    return null;
  }
  return { paragraphId, start: idx, end: idx + answer.length };
}

const confirmQuestions = [
  { id: "q1", prompt: "글쓴이가 가을에 가장 먼저 올려다보는 나무는 무엇인가요?", answerText: "느티나무", paragraphId: "p1", searchText: p1Text },
  { id: "q2", prompt: "밤새 떨어져 현관 발밑에 놓여 있던 것은 무엇인가요?", answerText: "낙엽", paragraphId: "p1", searchText: p1Text },
  { id: "q3", prompt: "해가 짧아지면서 더 붉고 선명해지는 것은 무엇인가요?", answerText: "저녁노을", paragraphId: "p1", searchText: p1Text },
  { id: "q4", prompt: "슈퍼에 쌓이기 시작하면 겨울이 가까워졌다는 뜻인 과일은 무엇인가요?", answerText: "귤", paragraphId: "p2", searchText: p2Text },
  { id: "q5", prompt: "길가에 피면 봄이 왔다는 뜻인 꽃은 무엇인가요?", answerText: "진달래", paragraphId: "p2", searchText: p2Text },
  { id: "q6", prompt: "글쓴이가 변화를 발견할 때마다 날짜와 함께 적어 두는 곳은 어디인가요?", answerText: "수첩", paragraphId: "p2", searchText: p2Text },
  { id: "q7", prompt: "어머니가 어릴 때 할머니와 함께 계절을 배운 장소는 어디인가요?", answerText: "텃밭", paragraphId: "p3", searchText: p3Text },
  { id: "q8", prompt: "할머니가 곧 추워질 것을 아신 단서가 된 새는 무엇인가요?", answerText: "까치", paragraphId: "p3", searchText: p3Text }
];

const confirm = {
  questions: confirmQuestions.map(q => {
    const range = findRange(q.searchText, q.paragraphId, q.answerText);
    return {
      id: q.id,
      prompt: q.prompt,
      answerText: q.answerText,
      answerMatchMode: "ANY",
      answerRanges: range ? [range] : [],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    };
  })
};

// ── JSON 조립 ──
const content = {
  contentId: "dr-f3-004",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(프레게 3) Day 4 문학",
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
const totalLen = p1Text.length + p2Text.length + p3Text.length;
console.log(`지문 길이: ${totalLen} (950~1050 범위: ${totalLen >= 950 && totalLen <= 1050 ? 'OK' : 'FAIL'})`);
console.log(`recall cards: ${recall.cards.length} (8 필요: ${recall.cards.length === 8 ? 'OK' : 'FAIL'})`);
console.log(`confirm questions: ${confirm.questions.length} (5~10 필요: ${confirm.questions.length >= 5 && confirm.questions.length <= 10 ? 'OK' : 'FAIL'})`);
console.log(`intensive steps: ${timeline.length}`);

let highlightOk = true;
for (const step of timeline) {
  for (const r of step.highlight.ranges) {
    const pText = r.paragraphId === "p1" ? p1Text : r.paragraphId === "p2" ? p2Text : p3Text;
    if (r.start < 0 || r.end > pText.length || r.start >= r.end) {
      console.error(`FAIL: step ${step.stepId} range [${r.start},${r.end}] out of bounds (len=${pText.length})`);
      highlightOk = false;
    }
  }
}
console.log(`highlight ranges: ${highlightOk ? 'OK' : 'FAIL'}`);

let answerOk = true;
for (const q of confirm.questions) {
  for (const r of q.answerRanges) {
    const pText = r.paragraphId === "p1" ? p1Text : r.paragraphId === "p2" ? p2Text : p3Text;
    const extracted = pText.substring(r.start, r.end);
    if (extracted !== q.answerText) {
      console.error(`FAIL: q ${q.id} expected "${q.answerText}" but got "${extracted}"`);
      answerOk = false;
    }
  }
}
console.log(`answerRanges: ${answerOk ? 'OK' : 'FAIL'}`);

// ── 파일 저장 ──
const staticPath = 'C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/frontend/public/daily-reading/frege3/004.json';
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\n파일 저장 완료: ${staticPath}`);

// 배치 파일 업데이트
const batchPath = 'C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/generated/daily-batch-reading-frege3.json';
const batchData = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batchData.items[3] = {
  content_type: "DAILY_READING",
  level_id: "FREGE_3",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 4,
  module_key: "reading_training",
  schema_version: "1.0",
  content: content
};
fs.writeFileSync(batchPath, JSON.stringify(batchData, null, 2), 'utf8');
console.log(`배치 파일 업데이트 완료: ${batchPath}`);

console.log("\n=== Day 4 완료 ===");
