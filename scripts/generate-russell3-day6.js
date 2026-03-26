// 러셀3 Day 6 - 문학 (수필: 창작 - 비 오는 날의 도서관)
// 중2~중3 수준, 1300자 ±50

const fs = require('fs');

const p1 = "비가 내리기 시작하면 나는 습관처럼 학교 도서관으로 향한다. 우산을 접어 입구에 세워 두고 안으로 들어서면, 밖의 빗소리가 한 겹 얇은 유리창 너머로 멀어진다. 도서관 안은 언제나 조용하지만, 비 오는 날에는 그 고요함의 질감이 평소와 사뭇 다르다. 빗소리가 배경음악처럼 깔리면서, 평소에는 눈에 띄지 않던 책장 사이의 정적이 한결 부드럽게 느껴지는 것이다. 나는 비가 올 때마다 늘 같은 자리에 앉는다. 창가 구석, 밖이 내다보이는 그 자리에서 책을 펼치면, 빗줄기에 흐려진 교정의 풍경이 수채화처럼 번져 보인다. 어쩌면 나는 책을 읽으러 오는 것이 아니라, 비와 고요함이 만들어 내는 이 특별한 분위기를 느끼러 오는 것인지도 모른다.";

const p2 = "도서관에서 내가 가장 좋아하는 순간은 책장을 넘기다가 문득 고개를 들었을 때이다. 창밖으로 빗방울이 유리를 타고 흘러내리는 모습을 바라보면, 시간이 느리게 흐르는 듯한 착각에 빠진다. 교실에서는 쉴 새 없이 돌아가는 시계 초침이 여기서는 마치 멈춘 것 같다. 나는 그 멈춤의 시간 속에서 비로소 나 자신을 만난다. 평소에는 수업과 시험과 친구 관계 속에 파묻혀 미처 돌아보지 못했던 내 마음의 결을 조용히 살피게 되는 것이다. 누군가는 도서관이 오직 공부만 하는 곳이라고 말하겠지만, 나에게 이곳은 나 자신과 대화하는 소중한 공간이다.";

const p3 = "어느 비 오는 오후, 우연히 펼친 산문집에서 이런 문장을 만났다. '고독은 외로움이 아니라, 자신과 온전히 함께하는 시간이다.' 그 짧은 문장을 읽는 순간, 가슴 한구석에서 무언가가 가볍게 울리는 것을 느꼈다. 그동안 나는 혼자만 있는 시간을 막연히 두려워했다. 친구들과 함께하지 않으면 왠지 불안했고, 조용한 시간이 오면 무의식적으로 스마트폰을 꺼내 들곤 했다. 하지만 그 문장은 혼자 있는 시간이 빈 시간이 아니라, 오히려 가장 충만한 시간일 수 있다고 말하고 있었다. 비가 유리창을 두드리는 소리를 들으며, 나는 처음으로 고독이 편안하게 느껴졌다.";

const p4 = "도서관을 나설 때 비는 이미 그쳐 있었다. 젖은 땅에서 올라오는 흙냄새가 코끝을 스치고, 구름 사이로 햇살 한 줄기가 비스듬히 내려앉았다. 우산을 접어 든 채 천천히 교정을 걸으면서 나는 생각했다. 이 시간이, 책 속의 지식이 아니라 내 안에 차곡차곡 쌓이는 고요한 경험이 되어 줄 것이라고. 빗물에 씻긴 나뭇잎들이 유난히 선명하게 빛나고 있었다. 마치 비가 세상의 먼지를 씻어 낸 것처럼, 도서관에서 보낸 시간이 내 마음의 먼지를 씻어 낸 것 같았다. 다음에 비가 오면, 나는 또 그 자리에 앉아 있을 것이다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
  { id: "p4", text: p4 }
];

const totalLen = paragraphs.reduce((sum, p) => sum + p.text.length, 0);
console.log("총 글자수:", totalLen);
if (totalLen < 1250 || totalLen > 1350) {
  console.error("!!! 글자수 범위 이탈:", totalLen);
}

function findRange(text, substring) {
  const idx = text.indexOf(substring);
  if (idx === -1) throw new Error(`못 찾음: "${substring.substring(0, 40)}..."`);
  return { start: idx, end: idx + substring.length };
}

const p1_sents = [
  findRange(p1, "비가 내리기 시작하면 나는 습관처럼 학교 도서관으로 향한다."),
  findRange(p1, "우산을 접어 입구에 세워 두고 안으로 들어서면, 밖의 빗소리가 한 겹 얇은 유리창 너머로 멀어진다."),
  findRange(p1, "도서관 안은 언제나 조용하지만, 비 오는 날에는 그 고요함의 질감이 평소와 사뭇 다르다."),
  findRange(p1, "빗소리가 배경음악처럼 깔리면서, 평소에는 눈에 띄지 않던 책장 사이의 정적이 한결 부드럽게 느껴지는 것이다."),
  findRange(p1, "나는 비가 올 때마다 늘 같은 자리에 앉는다."),
  findRange(p1, "창가 구석, 밖이 내다보이는 그 자리에서 책을 펼치면, 빗줄기에 흐려진 교정의 풍경이 수채화처럼 번져 보인다."),
  findRange(p1, "어쩌면 나는 책을 읽으러 오는 것이 아니라, 비와 고요함이 만들어 내는 이 특별한 분위기를 느끼러 오는 것인지도 모른다.")
];

const p2_sents = [
  findRange(p2, "도서관에서 내가 가장 좋아하는 순간은 책장을 넘기다가 문득 고개를 들었을 때이다."),
  findRange(p2, "창밖으로 빗방울이 유리를 타고 흘러내리는 모습을 바라보면, 시간이 느리게 흐르는 듯한 착각에 빠진다."),
  findRange(p2, "교실에서는 쉴 새 없이 돌아가는 시계 초침이 여기서는 마치 멈춘 것 같다."),
  findRange(p2, "나는 그 멈춤의 시간 속에서 비로소 나 자신을 만난다."),
  findRange(p2, "평소에는 수업과 시험과 친구 관계 속에 파묻혀 미처 돌아보지 못했던 내 마음의 결을 조용히 살피게 되는 것이다."),
  findRange(p2, "누군가는 도서관이 오직 공부만 하는 곳이라고 말하겠지만, 나에게 이곳은 나 자신과 대화하는 소중한 공간이다.")
];

const p3_sents = [
  findRange(p3, "어느 비 오는 오후, 우연히 펼친 산문집에서 이런 문장을 만났다."),
  findRange(p3, "'고독은 외로움이 아니라, 자신과 온전히 함께하는 시간이다.'"),
  findRange(p3, "그 짧은 문장을 읽는 순간, 가슴 한구석에서 무언가가 가볍게 울리는 것을 느꼈다."),
  findRange(p3, "그동안 나는 혼자만 있는 시간을 막연히 두려워했다."),
  findRange(p3, "친구들과 함께하지 않으면 왠지 불안했고, 조용한 시간이 오면 무의식적으로 스마트폰을 꺼내 들곤 했다."),
  findRange(p3, "하지만 그 문장은 혼자 있는 시간이 빈 시간이 아니라, 오히려 가장 충만한 시간일 수 있다고 말하고 있었다."),
  findRange(p3, "비가 유리창을 두드리는 소리를 들으며, 나는 처음으로 고독이 편안하게 느껴졌다.")
];

const p4_sents = [
  findRange(p4, "도서관을 나설 때 비는 이미 그쳐 있었다."),
  findRange(p4, "젖은 땅에서 올라오는 흙냄새가 코끝을 스치고, 구름 사이로 햇살 한 줄기가 비스듬히 내려앉았다."),
  findRange(p4, "우산을 접어 든 채 천천히 교정을 걸으면서 나는 생각했다."),
  findRange(p4, "이 시간이, 책 속의 지식이 아니라 내 안에 차곡차곡 쌓이는 고요한 경험이 되어 줄 것이라고."),
  findRange(p4, "빗물에 씻긴 나뭇잎들이 유난히 선명하게 빛나고 있었다."),
  findRange(p4, "마치 비가 세상의 먼지를 씻어 낸 것처럼, 도서관에서 보낸 시간이 내 마음의 먼지를 씻어 낸 것 같았다."),
  findRange(p4, "다음에 비가 오면, 나는 또 그 자리에 앉아 있을 것이다.")
];

// 검증
for (const [pid, sents, text] of [["p1", p1_sents, p1], ["p2", p2_sents, p2], ["p3", p3_sents, p3], ["p4", p4_sents, p4]]) {
  console.log(`\n${pid} (${text.length}자, ${sents.length}문장):`);
  for (let i = 0; i < sents.length; i++) {
    const s = sents[i];
    console.log(`  [${s.start}, ${s.end}] "${text.substring(s.start, Math.min(s.end, s.start+50))}..."`);
  }
}

let stepCounter = 0;
function makeStep(paragraphId, range, prompt, choices) {
  stepCounter++;
  return {
    stepId: `s${stepCounter}`,
    highlight: { ranges: [{ paragraphId, start: range.start, end: range.end }] },
    question: {
      prompt, choices: choices.map((c, i) => ({ id: ["A","B","C","D"][i], text: c })),
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  };
}
function makeSummaryStep(paragraphId, textLen, prompt, choices) {
  stepCounter++;
  return {
    stepId: `s${stepCounter}`,
    highlight: { ranges: [{ paragraphId, start: 0, end: textLen }] },
    question: {
      prompt, choices: choices.map((c, i) => ({ id: ["A","B","C","D"][i], text: c })),
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  };
}

const timeline = [
  // p1
  makeStep("p1", p1_sents[0],
    "첫 문장에서 '나'가 비가 오면 향하는 곳은?",
    ["습관처럼 학교 도서관으로 간다.", "집으로 빨리 돌아간다.", "카페에서 커피를 마신다.", "체육관에서 운동을 한다."]),
  makeStep("p1", p1_sents[1],
    "둘째 문장에서 도서관에 들어서면 일어나는 일은?",
    ["밖의 빗소리가 유리창 너머로 멀어진다.", "빗소리가 더 크게 울린다.", "우산을 펴서 책상에 놓는다.", "친구들과 함께 자리를 잡는다."]),
  makeStep("p1", p1_sents[2],
    "셋째 문장이 말하는 비 오는 날 도서관의 특징은?",
    ["고요함의 질감이 평소와 사뭇 다르다.", "평소보다 시끄럽다.", "사람이 많아 붐빈다.", "에어컨이 작동하여 춥다."]),
  makeStep("p1", p1_sents[3],
    "넷째 문장에서 빗소리가 만드는 효과는?",
    ["책장 사이의 정적이 부드럽게 느껴진다.", "집중력이 흐트러져 공부가 안 된다.", "졸음이 쏟아져 잠이 든다.", "불안감이 커져 밖으로 나가고 싶어진다."]),
  makeStep("p1", p1_sents[4],
    "다섯째 문장에서 '나'의 습관은?",
    ["비가 올 때마다 늘 같은 자리에 앉는다.", "매번 다른 자리를 찾는다.", "가장 넓은 자리를 고른다.", "친구 옆 자리에 앉는다."]),
  makeStep("p1", p1_sents[5],
    "여섯째 문장에서 창밖 풍경의 묘사는?",
    ["빗줄기에 흐려진 교정이 수채화처럼 번져 보인다.", "햇살에 반짝이는 교정이 사진처럼 선명하다.", "눈이 쌓인 교정이 동화처럼 보인다.", "바람에 흔들리는 나무가 춤추는 것 같다."]),
  makeStep("p1", p1_sents[6],
    "마지막 문장에서 '나'가 도서관에 오는 진짜 이유는?",
    ["비와 고요함이 만드는 특별한 분위기를 느끼러 온다.", "시험 공부를 하러 온다.", "친구를 만나러 온다.", "과제를 제출하러 온다."]),
  makeSummaryStep("p1", p1.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["비 오는 날 도서관이 주는 특별한 분위기와 그곳을 찾는 이유이다.", "'나'가 도서관에서 열심히 공부하는 모습이다.", "비 오는 날 도서관이 붐비는 이유를 설명한다.", "도서관의 시설과 구조에 대한 묘사이다."]),

  // p2
  makeStep("p2", p2_sents[0],
    "첫 문장에서 '나'가 가장 좋아하는 순간은?",
    ["책장을 넘기다 문득 고개를 들었을 때이다.", "새로운 책을 발견했을 때이다.", "도서관 문을 열고 들어갈 때이다.", "빌린 책을 반납할 때이다."]),
  makeStep("p2", p2_sents[1],
    "둘째 문장에서 '나'가 빠지는 착각은?",
    ["시간이 느리게 흐르는 듯한 착각이다.", "빗방울이 음악처럼 들리는 착각이다.", "도서관이 움직이는 듯한 착각이다.", "자신이 책 속에 들어간 듯한 착각이다."]),
  makeStep("p2", p2_sents[2],
    "셋째 문장에서 도서관과 교실의 차이는?",
    ["교실의 시계 초침이 여기서는 마치 멈춘 것 같다.", "도서관이 교실보다 더 시끄럽다.", "교실보다 도서관이 더 좁다.", "교실에서는 시간이 느리게 간다."]),
  makeStep("p2", p2_sents[3],
    "넷째 문장에서 '나'가 멈춤의 시간에 하는 것은?",
    ["비로소 나 자신을 만난다.", "잠깐 낮잠을 잔다.", "다음 수업을 준비한다.", "친구에게 메시지를 보낸다."]),
  makeStep("p2", p2_sents[4],
    "다섯째 문장에서 '나'가 평소 돌아보지 못한 것은?",
    ["수업과 시험 속에 파묻혀 살피지 못한 내 마음의 결이다.", "도서관에 꽂혀 있는 다양한 책들이다.", "학교 교정의 계절 변화이다.", "친구들의 고민과 걱정이다."]),
  makeStep("p2", p2_sents[5],
    "마지막 문장에서 '나'에게 도서관의 의미는?",
    ["나 자신과 대화하는 소중한 공간이다.", "성적을 올리기 위한 공부방이다.", "친구들과 이야기하는 장소이다.", "휴식을 취하며 잠을 자는 곳이다."]),
  makeSummaryStep("p2", p2.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["도서관에서 시간이 멈춘 듯한 고요함 속에 자신을 돌아본다.", "'나'가 도서관에서 열심히 시험 공부를 한다.", "교실과 도서관의 시설 차이를 비교한다.", "'나'가 친구와 함께 독서 토론을 한다."]),

  // p3
  makeStep("p3", p3_sents[0],
    "첫 문장에서 '나'가 만난 것은?",
    ["비 오는 오후 우연히 펼친 산문집의 문장이다.", "오래된 친구의 편지이다.", "선생님이 추천한 소설이다.", "인터넷에서 본 명언이다."]),
  makeStep("p3", p3_sents[1],
    "둘째 문장의 인용문이 말하는 고독의 의미는?",
    ["외로움이 아니라 자신과 온전히 함께하는 시간이다.", "아무도 없는 외로운 상태이다.", "사회에서 고립된 부정적 경험이다.", "타인과 소통하지 못하는 고통이다."]),
  makeStep("p3", p3_sents[2],
    "셋째 문장에서 '나'가 느낀 것은?",
    ["가슴 한구석에서 무언가가 가볍게 울리는 느낌이다.", "눈물이 왈칵 쏟아지는 슬픔이다.", "분노가 치밀어 오르는 감정이다.", "웃음이 터져 나오는 기쁨이다."]),
  makeStep("p3", p3_sents[3],
    "넷째 문장에서 '나'가 그동안 두려워한 것은?",
    ["혼자만 있는 시간을 막연히 두려워했다.", "비 오는 날씨이다.", "도서관의 고요함이다.", "새로운 책을 읽는 것이다."]),
  makeStep("p3", p3_sents[4],
    "다섯째 문장에서 '나'가 조용한 시간에 하던 행동은?",
    ["불안하여 무의식적으로 스마트폰을 꺼내 들곤 했다.", "책을 펼쳐 독서에 몰두했다.", "산책을 나가 기분을 전환했다.", "일기를 쓰며 마음을 정리했다."]),
  makeStep("p3", p3_sents[5],
    "여섯째 문장에서 산문집의 문장이 전하는 메시지는?",
    ["혼자 있는 시간이 가장 충만한 시간일 수 있다.", "혼자 있는 시간은 반드시 피해야 한다.", "친구와 함께하는 시간이 가장 소중하다.", "바쁜 일상이 가장 의미 있는 삶이다."]),
  makeStep("p3", p3_sents[6],
    "마지막 문장에서 '나'에게 일어난 변화는?",
    ["처음으로 고독이 편안하게 느껴졌다.", "고독이 더욱 두렵게 느껴졌다.", "빗소리가 시끄럽게 느껴졌다.", "도서관을 떠나고 싶어졌다."]),
  makeSummaryStep("p3", p3.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["산문집의 문장을 통해 고독의 의미를 새롭게 깨닫는다.", "'나'가 산문집을 처음부터 끝까지 읽는 과정이다.", "친구와 함께 독서를 하며 감상을 나누는 장면이다.", "비 오는 날의 날씨 변화를 묘사한다."]),

  // p4
  makeStep("p4", p4_sents[0],
    "첫 문장에서 도서관을 나설 때의 날씨는?",
    ["비는 이미 그쳐 있었다.", "비가 더 세차게 내리고 있었다.", "눈이 내리기 시작했다.", "바람이 거세게 불고 있었다."]),
  makeStep("p4", p4_sents[1],
    "둘째 문장이 묘사하는 감각은?",
    ["젖은 땅의 흙냄새와 구름 사이로 비치는 햇살이다.", "차가운 바람과 어두운 하늘이다.", "꽃향기와 새소리이다.", "낙엽의 바스락거리는 소리이다."]),
  makeStep("p4", p4_sents[2],
    "셋째 문장에서 '나'가 하고 있는 행동은?",
    ["우산을 접어 든 채 천천히 교정을 걸으며 생각한다.", "도서관으로 다시 돌아간다.", "친구에게 전화를 건다.", "교실로 뛰어간다."]),
  makeStep("p4", p4_sents[3],
    "넷째 문장에서 '나'가 이 시간에 기대하는 것은?",
    ["내 안에 차곡차곡 쌓이는 고요한 경험이 될 것이다.", "시험 성적이 올라갈 것이다.", "새로운 친구를 사귀게 될 것이다.", "유명한 작가가 될 것이다."]),
  makeStep("p4", p4_sents[4],
    "다섯째 문장이 묘사하는 풍경은?",
    ["빗물에 씻긴 나뭇잎이 유난히 선명하게 빛난다.", "낙엽이 바닥에 쌓여 갈색으로 물들었다.", "꽃이 활짝 피어 향기를 풍긴다.", "나무가 바람에 크게 흔들린다."]),
  makeStep("p4", p4_sents[5],
    "여섯째 문장에서 '나'가 느낀 비유의 의미는?",
    ["비가 세상 먼지를 씻듯 도서관에서 보낸 시간이 마음을 씻었다.", "비가 와서 기분이 우울해졌다.", "도서관에서 먼지가 많아 불쾌했다.", "비 때문에 옷이 젖어 불편했다."]),
  makeStep("p4", p4_sents[6],
    "마지막 문장에서 '나'의 다짐은?",
    ["다음에 비가 오면 또 그 자리에 앉아 있을 것이다.", "더 이상 도서관에 오지 않을 것이다.", "비 오는 날에는 집에 있을 것이다.", "다른 도서관을 찾아볼 것이다."]),
  makeSummaryStep("p4", p4.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["비 갠 후 도서관의 시간이 마음을 씻어 준 경험을 되새긴다.", "'나'가 비를 맞으며 집으로 돌아가는 장면이다.", "도서관의 청소 상태에 대한 불만이다.", "비 오는 날 교정의 위험성을 경고한다."])
];

// 복기 카드 (8)
const fullText = p1 + " " + p2 + " " + p3 + " " + p4;
const cardCount = 8;
const cardLen = Math.ceil(fullText.length / cardCount);
const cards = [];
for (let i = 0; i < cardCount; i++) {
  const start = i * cardLen;
  const end = Math.min(start + cardLen, fullText.length);
  cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
}

// 확인 문항 (8)
function findConfirmRange(pid, text, sub) {
  const idx = text.indexOf(sub);
  if (idx === -1) throw new Error(`확인: "${sub}"`);
  return { paragraphId: pid, start: idx, end: idx + sub.length };
}

const confirmQuestions = [
  { id: "q1", prompt: "지문에서 '수채화처럼'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p1", p1, "수채화처럼")] },
  { id: "q2", prompt: "지문에서 '고요함의 질감'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p1", p1, "고요함의 질감")] },
  { id: "q3", prompt: "지문에서 '멈춤의 시간'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p2", p2, "멈춤의 시간")] },
  { id: "q4", prompt: "지문에서 '마음의 결'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p2", p2, "마음의 결")] },
  { id: "q5", prompt: "지문에서 '산문집'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p3", p3, "산문집")] },
  { id: "q6", prompt: "지문에서 '충만한 시간'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p3", p3, "충만한 시간")] },
  { id: "q7", prompt: "지문에서 '흙냄새'를 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p4", p4, "흙냄새")] },
  { id: "q8", prompt: "지문에서 '마음의 먼지'를 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p4", p4, "마음의 먼지")] }
];

// JSON
const staticContent = {
  contentId: "dr-r3-006", contentType: "DAILY_READING",
  version: 1, status: "PUBLISHED",
  title: "일일 독해(러셀 3) Day 6 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_3",
  schoolGradeRange: { min: 8, max: 9 },
  area: "READING", subArea: "LITERATURE",
  competencies: ["READING"], tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300, assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 },
    confirm: {
      questions: confirmQuestions.map(q => ({
        id: q.id, prompt: q.prompt, answerRanges: q.answerRanges,
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: "ANY"
      }))
    }
  }
};

const batchItem = {
  content_type: "DAILY_READING", level_id: "RUSSELL_3",
  area: "READING", sub_area: "LITERATURE",
  day_index: 6, module_key: "reading_training", schema_version: "1.0",
  content: staticContent
};

const staticPath = "frontend/public/daily-reading/russell3/006.json";
fs.writeFileSync(staticPath, JSON.stringify(staticContent, null, 2), "utf-8");
console.log("\n✅ static 저장:", staticPath);

const batchPath = "generated/daily-batch-reading-russell3.json";
const batch = JSON.parse(fs.readFileSync(batchPath, "utf-8"));
batch.items[5] = batchItem;
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), "utf-8");
console.log("✅ 배치 업데이트:", batchPath, "items[5]");

console.log("\n=== Day 6 완료 ===");
console.log("타임라인:", timeline.length, "복기:", cards.length, "확인:", confirmQuestions.length);
