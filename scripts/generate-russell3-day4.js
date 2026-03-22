// 러셀3 Day 4 - 문학 (소설: 창작 단편 - 할머니의 텃밭)
// 중2~중3 수준, 1300자 ±50

const fs = require('fs');

// ────────────── 지문 (4문단) ──────────────
const p1 = "여름방학이 시작되던 날, 나는 시골 할머니 댁에 도착했다. 할머니는 마당 한쪽에 가꾸던 텃밭으로 나를 데려가셨다. 빽빽하게 들어선 상추와 고추, 가지 사이로 할머니의 구부러진 등이 보였다. 할머니는 무릎을 꿇고 잡초를 뽑으며 말씀하셨다. \"풀이란 게 하루만 안 뽑아도 금방 치고 올라온단다.\" 나는 스마트폰 화면에서 눈을 떼지 못한 채 건성으로 대답했다. 할머니의 손끝에 묻은 흙이 유난히 까맣게 보였지만, 그때의 나는 그것이 무엇을 의미하는지 알지 못했다. 도시에서 자란 나에게 텃밭은 그저 지루한 풍경에 불과했고, 할머니의 부지런함은 이해할 수 없는 고집으로 느껴졌다.";

const p2 = "다음 날 새벽, 할머니는 나를 깨워 물 주는 일을 함께하자고 하셨다. 잠이 덜 깬 채로 호스를 잡았지만, 물줄기는 엉뚱한 곳으로 향했고, 고추 몇 그루가 꺾여 버렸다. 할머니는 아무 말 없이 꺾인 줄기를 들어 올려 흙으로 다시 북돋아 주셨다. \"식물이란 게 그래. 한 번 꺾여도 다시 살아나려고 애쓰거든.\" 할머니의 목소리에는 꾸짖음 대신 담담한 위로가 담겨 있었다. 나는 괜히 미안해져서 고개를 숙였고, 그때 처음으로 텃밭의 흙 냄새를 제대로 맡았다. 비가 온 뒤의 숲속 같은, 축축하고 살아 있는 냄새였다. 그 순간 텃밭이 더 이상 지루한 풍경이 아니라, 무언가 살아 숨 쉬는 공간으로 느껴지기 시작했다.";

const p3 = "그날 이후 나는 매일 아침 할머니와 함께 텃밭에 나갔다. 잡초를 뽑고, 거름을 주고, 벌레를 잡았다. 손톱 사이로 흙이 끼고, 등에는 땀이 흘렀지만, 며칠 전만 해도 싫었던 그 감각들이 점차 익숙해졌다. 무엇보다 변화를 느낀 것은, 내가 물을 준 고추가 빨갛게 익어 가는 모습을 볼 때였다. 내 손이 닿은 것들이 자라고 있다는 사실이 묘한 뿌듯함을 주었다. 할머니는 그런 나를 보며 조용히 웃으셨다. \"너도 이제 텃밭 사람 다 됐구나.\" 그 말에 나는 괜스레 얼굴이 붉어졌지만, 마음 한구석이 따뜻하게 채워지는 것을 느꼈다.";

const p4 = "방학 마지막 날, 나는 텃밭 앞에 서서 한참을 바라보았다. 도시로 돌아가면 다시 스마트폰과 학원과 시험의 일상이 기다리고 있을 것이다. 하지만 이 여름 동안 내가 배운 것은 교과서 어디에도 쓰여 있지 않은 것이었다. 무언가를 돌보고, 기다리고, 그 결과를 두 눈으로 확인하는 경험. 할머니의 구부러진 등이 고집이 아니라 헌신이었음을 나는 그제야 이해했다. 택시를 타고 떠나는 길에 할머니는 붉게 익은 고추 한 봉지를 건네셨다. \"네가 키운 거란다.\" 그 고추를 안고 차창 밖을 바라보는데, 내 손끝에 남아 있던 흙의 감촉이 오래도록 사라지지 않았다.";

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

// ────────────── 문장 경계 계산 ──────────────
function splitSentences(text) {
  const parts = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' || text[i] === '다' || text[i] === '"') {
      // 마침표+공백 또는 마침표+끝 → 문장 경계
      if (text[i] === '.') {
        if (i + 1 < text.length && text[i+1] === ' ') {
          parts.push({ start, end: i + 1 });
          start = i + 2;
        } else if (i + 1 === text.length) {
          parts.push({ start, end: i + 1 });
          start = i + 1;
        }
      }
      // 큰따옴표 뒤 공백 → 대사 끝
      if (text[i] === '"') {
        if (i + 1 < text.length && text[i+1] === ' ') {
          parts.push({ start, end: i + 1 });
          start = i + 2;
        } else if (i + 1 === text.length) {
          parts.push({ start, end: i + 1 });
          start = i + 1;
        }
      }
    }
  }
  if (start < text.length) {
    parts.push({ start, end: text.length });
  }
  return parts;
}

// 더 정확한 문장 분리: 마침표+공백 또는 큰따옴표+공백
function splitSentencesV2(text) {
  const results = [];
  let start = 0;
  const regex = /[.]\s|[.]$|"\s|"$/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const endIdx = match.index + 1; // 마침표/따옴표 다음 위치
    results.push({ start, end: endIdx });
    start = match[0].length > 1 ? match.index + match[0].length : endIdx;
  }
  if (start < text.length) {
    results.push({ start, end: text.length });
  }
  return results;
}

// 문장을 직접 지정하는 방식으로 변경
function findRange(text, substring) {
  const idx = text.indexOf(substring);
  if (idx === -1) throw new Error(`문자열 못 찾음: "${substring.substring(0, 30)}..."`);
  return { start: idx, end: idx + substring.length };
}

// p1 문장들
const p1_sents = [
  findRange(p1, "여름방학이 시작되던 날, 나는 시골 할머니 댁에 도착했다."),
  findRange(p1, "할머니는 마당 한쪽에 가꾸던 텃밭으로 나를 데려가셨다."),
  findRange(p1, "빽빽하게 들어선 상추와 고추, 가지 사이로 할머니의 구부러진 등이 보였다."),
  findRange(p1, "할머니는 무릎을 꿇고 잡초를 뽑으며 말씀하셨다."),
  findRange(p1, "\"풀이란 게 하루만 안 뽑아도 금방 치고 올라온단다.\""),
  findRange(p1, "나는 스마트폰 화면에서 눈을 떼지 못한 채 건성으로 대답했다."),
  findRange(p1, "할머니의 손끝에 묻은 흙이 유난히 까맣게 보였지만, 그때의 나는 그것이 무엇을 의미하는지 알지 못했다."),
  findRange(p1, "도시에서 자란 나에게 텃밭은 그저 지루한 풍경에 불과했고, 할머니의 부지런함은 이해할 수 없는 고집으로 느껴졌다.")
];

const p2_sents = [
  findRange(p2, "다음 날 새벽, 할머니는 나를 깨워 물 주는 일을 함께하자고 하셨다."),
  findRange(p2, "잠이 덜 깬 채로 호스를 잡았지만, 물줄기는 엉뚱한 곳으로 향했고, 고추 몇 그루가 꺾여 버렸다."),
  findRange(p2, "할머니는 아무 말 없이 꺾인 줄기를 들어 올려 흙으로 다시 북돋아 주셨다."),
  findRange(p2, "\"식물이란 게 그래. 한 번 꺾여도 다시 살아나려고 애쓰거든.\""),
  findRange(p2, "할머니의 목소리에는 꾸짖음 대신 담담한 위로가 담겨 있었다."),
  findRange(p2, "나는 괜히 미안해져서 고개를 숙였고, 그때 처음으로 텃밭의 흙 냄새를 제대로 맡았다."),
  findRange(p2, "비가 온 뒤의 숲속 같은, 축축하고 살아 있는 냄새였다."),
  findRange(p2, "그 순간 텃밭이 더 이상 지루한 풍경이 아니라, 무언가 살아 숨 쉬는 공간으로 느껴지기 시작했다.")
];

const p3_sents = [
  findRange(p3, "그날 이후 나는 매일 아침 할머니와 함께 텃밭에 나갔다."),
  findRange(p3, "잡초를 뽑고, 거름을 주고, 벌레를 잡았다."),
  findRange(p3, "손톱 사이로 흙이 끼고, 등에는 땀이 흘렀지만, 며칠 전만 해도 싫었던 그 감각들이 점차 익숙해졌다."),
  findRange(p3, "무엇보다 변화를 느낀 것은, 내가 물을 준 고추가 빨갛게 익어 가는 모습을 볼 때였다."),
  findRange(p3, "내 손이 닿은 것들이 자라고 있다는 사실이 묘한 뿌듯함을 주었다."),
  findRange(p3, "할머니는 그런 나를 보며 조용히 웃으셨다."),
  findRange(p3, "\"너도 이제 텃밭 사람 다 됐구나.\""),
  findRange(p3, "그 말에 나는 괜스레 얼굴이 붉어졌지만, 마음 한구석이 따뜻하게 채워지는 것을 느꼈다.")
];

const p4_sents = [
  findRange(p4, "방학 마지막 날, 나는 텃밭 앞에 서서 한참을 바라보았다."),
  findRange(p4, "도시로 돌아가면 다시 스마트폰과 학원과 시험의 일상이 기다리고 있을 것이다."),
  findRange(p4, "하지만 이 여름 동안 내가 배운 것은 교과서 어디에도 쓰여 있지 않은 것이었다."),
  findRange(p4, "무언가를 돌보고, 기다리고, 그 결과를 두 눈으로 확인하는 경험."),
  findRange(p4, "할머니의 구부러진 등이 고집이 아니라 헌신이었음을 나는 그제야 이해했다."),
  findRange(p4, "택시를 타고 떠나는 길에 할머니는 붉게 익은 고추 한 봉지를 건네셨다."),
  findRange(p4, "\"네가 키운 거란다.\""),
  findRange(p4, "그 고추를 안고 차창 밖을 바라보는데, 내 손끝에 남아 있던 흙의 감촉이 오래도록 사라지지 않았다.")
];

// 검증
console.log("\n=== 문장 경계 검증 ===");
for (const [pid, sents, text] of [["p1", p1_sents, p1], ["p2", p2_sents, p2], ["p3", p3_sents, p3], ["p4", p4_sents, p4]]) {
  console.log(`\n${pid} (${text.length}자, ${sents.length}문장):`);
  for (let i = 0; i < sents.length; i++) {
    const s = sents[i];
    const fragment = text.substring(s.start, s.end);
    console.log(`  s${i+1}: [${s.start}, ${s.end}] "${fragment.substring(0, 50)}..."`);
  }
}

// ────────────── timeline 생성 ──────────────
let stepCounter = 0;
function makeStep(paragraphId, range, prompt, choices) {
  stepCounter++;
  return {
    stepId: `s${stepCounter}`,
    highlight: { ranges: [{ paragraphId, start: range.start, end: range.end }] },
    question: {
      prompt,
      choices: choices.map((c, i) => ({ id: ["A","B","C","D"][i], text: c })),
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  };
}

function makeParagraphSummaryStep(paragraphId, textLen, prompt, choices) {
  stepCounter++;
  return {
    stepId: `s${stepCounter}`,
    highlight: { ranges: [{ paragraphId, start: 0, end: textLen }] },
    question: {
      prompt,
      choices: choices.map((c, i) => ({ id: ["A","B","C","D"][i], text: c })),
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  };
}

const timeline = [
  // ── p1 문장들 ──
  makeStep("p1", p1_sents[0],
    "첫 문장에서 '나'가 도착한 곳으로 알맞은 것은?",
    ["여름방학에 시골 할머니 댁에 왔다.", "겨울방학에 외가에 방문했다.", "여름 캠프에 참가하러 산에 갔다.", "방학 중 도시의 친척 집에 갔다."]),
  makeStep("p1", p1_sents[1],
    "둘째 문장에서 할머니가 '나'를 데려간 곳은?",
    ["마당 한쪽에 있는 텃밭이다.", "뒷산에 있는 과수원이다.", "마을 앞 논두렁이다.", "집 뒤편의 연못가이다."]),
  makeStep("p1", p1_sents[2],
    "셋째 문장이 묘사하는 텃밭의 모습으로 알맞은 것은?",
    ["상추, 고추, 가지 사이로 할머니의 구부러진 등이 보인다.", "넓은 밭에 벼가 가득하고 할머니가 서 계신다.", "꽃밭 사이로 할머니가 허리를 펴고 계신다.", "과일나무 아래에서 할머니가 쉬고 계신다."]),
  makeStep("p1", p1_sents[3],
    "넷째 문장에서 할머니가 하고 있는 행동은?",
    ["무릎을 꿇고 잡초를 뽑고 계신다.", "서서 고추를 따고 계신다.", "앉아서 상추를 수확하고 계신다.", "물을 뿌리며 노래를 부르고 계신다."]),
  makeStep("p1", p1_sents[4],
    "할머니의 대사가 전하는 뜻으로 알맞은 것은?",
    ["잡초는 하루만 방치해도 금세 자란다.", "풀은 매주 한 번만 뽑으면 충분하다.", "잡초를 뽑는 것은 쓸모없는 일이다.", "풀은 한번 뽑으면 다시 나지 않는다."]),
  makeStep("p1", p1_sents[5],
    "여섯째 문장에서 '나'의 태도로 알맞은 것은?",
    ["스마트폰에 빠져 건성으로 대답했다.", "할머니의 말씀에 집중하여 경청했다.", "텃밭 일에 적극적으로 참여했다.", "불만을 표현하며 집으로 돌아갔다."]),
  makeStep("p1", p1_sents[6],
    "일곱째 문장에서 '나'가 알지 못했던 것은?",
    ["할머니 손끝의 까만 흙이 의미하는 바이다.", "텃밭에 어떤 채소가 심겨 있는지이다.", "할머니가 왜 시골에 사는지이다.", "흙의 색깔이 왜 까만지이다."]),
  makeStep("p1", p1_sents[7],
    "마지막 문장에서 드러나는 '나'의 인식은?",
    ["텃밭은 지루하고 할머니의 부지런함은 이해 못 할 고집이었다.", "텃밭은 아름답고 할머니의 모습이 존경스러웠다.", "도시 생활이 그리워 빨리 돌아가고 싶었다.", "텃밭 일을 배워 도시에서도 하고 싶었다."]),
  // p1 문단 중심내용
  makeParagraphSummaryStep("p1", p1.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["도시에서 자란 '나'가 할머니의 텃밭에 무관심한 모습이다.", "할머니가 텃밭에서 다양한 채소를 수확하는 과정이다.", "'나'가 시골 생활에 적응하여 즐거워하는 모습이다.", "할머니가 '나'에게 농사 기술을 가르치는 장면이다."]),

  // ── p2 문장들 ──
  makeStep("p2", p2_sents[0],
    "첫 문장에서 할머니가 '나'에게 제안한 일은?",
    ["새벽에 함께 물을 주자는 것이다.", "아침에 함께 시장에 가자는 것이다.", "저녁에 함께 산책을 하자는 것이다.", "오후에 함께 잡초를 뽑자는 것이다."]),
  makeStep("p2", p2_sents[1],
    "둘째 문장에서 벌어진 사건은?",
    ["물줄기가 엉뚱한 곳으로 가서 고추가 꺾였다.", "호스가 터져서 밭 전체가 물에 잠겼다.", "물이 나오지 않아 채소가 말라 버렸다.", "바람이 불어 상추가 모두 뽑혀 버렸다."]),
  makeStep("p2", p2_sents[2],
    "셋째 문장에서 할머니의 반응으로 알맞은 것은?",
    ["아무 말 없이 꺾인 줄기를 다시 북돋아 주셨다.", "화를 내며 나를 꾸짖으셨다.", "한숨을 쉬며 실망한 표정을 지으셨다.", "웃으며 괜찮다고 말씀하셨다."]),
  makeStep("p2", p2_sents[3],
    "할머니의 대사가 뜻하는 바로 알맞은 것은?",
    ["식물은 꺾여도 다시 살아나려 애쓴다는 것이다.", "식물은 한번 꺾이면 회복이 불가능하다는 것이다.", "식물을 키우려면 전문 지식이 필요하다는 것이다.", "식물은 사람의 손길 없이도 잘 자란다는 것이다."]),
  makeStep("p2", p2_sents[4],
    "다섯째 문장에서 할머니의 목소리에 담긴 것은?",
    ["꾸짖음 대신 담담한 위로이다.", "분노를 참으려는 노력이다.", "슬픔과 안타까움이다.", "기대와 설렘이다."]),
  makeStep("p2", p2_sents[5],
    "여섯째 문장에서 '나'가 처음으로 경험한 것은?",
    ["미안한 마음에 고개를 숙이고 흙 냄새를 맡았다.", "기뻐서 할머니를 안아 드렸다.", "무서워서 텃밭에서 도망쳤다.", "졸려서 그 자리에서 잠이 들었다."]),
  makeStep("p2", p2_sents[6],
    "일곱째 문장이 묘사하는 냄새는?",
    ["비 온 뒤 숲속 같은 축축하고 살아 있는 냄새이다.", "꽃향기처럼 달콤하고 상쾌한 냄새이다.", "흙먼지가 날리는 건조하고 텁텁한 냄새이다.", "비료 냄새처럼 코를 찌르는 악취이다."]),
  makeStep("p2", p2_sents[7],
    "마지막 문장에서 '나'의 변화로 알맞은 것은?",
    ["텃밭이 살아 숨 쉬는 공간으로 느껴지기 시작했다.", "텃밭이 여전히 지루한 곳으로 느껴졌다.", "할머니와 다투고 집으로 돌아가고 싶었다.", "도시의 공원이 그리워지기 시작했다."]),
  // p2 문단 중심내용
  makeParagraphSummaryStep("p2", p2.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["실수를 계기로 '나'가 텃밭을 새롭게 인식하기 시작한다.", "할머니가 '나'를 엄하게 꾸짖어 반성하게 한다.", "'나'가 능숙하게 물을 주어 할머니를 기쁘게 한다.", "텃밭의 채소가 모두 죽어 할머니가 슬퍼하신다."]),

  // ── p3 문장들 ──
  makeStep("p3", p3_sents[0],
    "첫 문장에서 '나'의 행동 변화로 알맞은 것은?",
    ["매일 아침 할머니와 함께 텃밭에 나가게 되었다.", "텃밭 대신 마을 산책을 나가게 되었다.", "할머니 몰래 도시로 돌아가려 했다.", "텃밭 일을 거부하고 집에만 있었다."]),
  makeStep("p3", p3_sents[1],
    "둘째 문장에서 '나'가 한 일로 알맞은 것은?",
    ["잡초를 뽑고, 거름을 주고, 벌레를 잡았다.", "상추를 수확하여 시장에 내다 팔았다.", "새로운 씨앗을 심고 이름표를 붙였다.", "텃밭을 넓히기 위해 땅을 개간했다."]),
  makeStep("p3", p3_sents[2],
    "셋째 문장에서 '나'에게 일어난 변화는?",
    ["싫었던 감각들이 점차 익숙해졌다.", "흙이 끼는 것이 더욱 싫어졌다.", "땀이 나서 텃밭 일을 그만두었다.", "장갑을 사서 흙을 만지지 않게 되었다."]),
  makeStep("p3", p3_sents[3],
    "넷째 문장에서 '나'가 가장 큰 변화를 느낀 순간은?",
    ["자신이 물을 준 고추가 빨갛게 익어 가는 것을 볼 때이다.", "할머니가 칭찬해 주셨을 때이다.", "친구에게 사진을 보여 주었을 때이다.", "상추를 처음으로 수확했을 때이다."]),
  makeStep("p3", p3_sents[4],
    "다섯째 문장에서 '나'가 느낀 감정은?",
    ["내 손이 닿은 것들이 자란다는 묘한 뿌듯함이다.", "자신의 노력이 허사가 된 데 대한 허무함이다.", "채소를 키우는 일에 대한 부담감이다.", "할머니에 대한 미안함과 죄책감이다."]),
  makeStep("p3", p3_sents[5],
    "여섯째 문장에서 할머니의 반응은?",
    ["'나'를 보며 조용히 웃으셨다.", "'나'를 칭찬하며 큰 소리로 웃으셨다.", "고개를 끄덕이며 안도하셨다.", "눈물을 글썽이며 감동하셨다."]),
  makeStep("p3", p3_sents[6],
    "할머니 대사의 뜻으로 알맞은 것은?",
    ["'나'가 텃밭 일에 익숙해졌다는 인정이다.", "'나'가 시골에서 영원히 살아야 한다는 뜻이다.", "'나'의 텃밭 실력이 아직 부족하다는 뜻이다.", "텃밭 사람이 되면 도시에 갈 수 없다는 뜻이다."]),
  makeStep("p3", p3_sents[7],
    "마지막 문장에서 '나'의 심리 상태는?",
    ["쑥스럽지만 마음이 따뜻하게 채워진다.", "부끄러워서 할머니를 피하고 싶다.", "슬퍼서 눈물이 나려고 한다.", "화가 나서 얼굴이 붉어졌다."]),
  // p3 문단 중심내용
  makeParagraphSummaryStep("p3", p3.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["텃밭 일에 익숙해진 '나'가 성장의 뿌듯함을 느낀다.", "'나'가 텃밭 일이 힘들어 포기하려 한다.", "할머니가 '나'에게 농사 기술을 전수한다.", "'나'가 고추를 수확하여 시장에 내다 판다."]),

  // ── p4 문장들 ──
  makeStep("p4", p4_sents[0],
    "첫 문장에서 '나'의 상황은?",
    ["방학 마지막 날 텃밭 앞에서 바라보고 있다.", "방학 첫날 텃밭에서 일을 시작하고 있다.", "개학 후 학교에서 텃밭을 그리워하고 있다.", "할머니 댁에 다시 방문하여 기뻐하고 있다."]),
  makeStep("p4", p4_sents[1],
    "둘째 문장에서 '나'가 예상하는 것은?",
    ["도시로 돌아가면 스마트폰, 학원, 시험의 일상이 기다린다.", "시골에 남아 할머니와 계속 텃밭을 가꾸게 된다.", "친구들이 시골에 놀러 올 것이다.", "할머니가 도시로 함께 가실 것이다."]),
  makeStep("p4", p4_sents[2],
    "셋째 문장에서 '나'가 배운 것의 특징은?",
    ["교과서 어디에도 쓰여 있지 않은 것이다.", "학교 수업에서 이미 배운 내용이다.", "인터넷에서 쉽게 찾을 수 있는 것이다.", "시험에 자주 출제되는 지식이다."]),
  makeStep("p4", p4_sents[3],
    "넷째 문장이 말하는 경험의 내용은?",
    ["무언가를 돌보고 기다려 결과를 확인하는 것이다.", "빠르게 성과를 내어 인정받는 것이다.", "혼자서 모든 것을 해내는 것이다.", "새로운 기술을 배워 실력을 쌓는 것이다."]),
  makeStep("p4", p4_sents[4],
    "다섯째 문장에서 '나'가 이해한 것은?",
    ["할머니의 구부러진 등이 고집이 아니라 헌신이었다.", "할머니가 텃밭을 가꾸는 것은 취미일 뿐이었다.", "할머니의 등이 구부러진 것은 병 때문이었다.", "할머니가 고집을 부린 것은 잘못이었다."]),
  makeStep("p4", p4_sents[5],
    "여섯째 문장에서 할머니가 건네준 것은?",
    ["붉게 익은 고추 한 봉지이다.", "텃밭에서 딴 상추 한 바구니이다.", "직접 담근 고추장 한 병이다.", "새로 심을 씨앗 한 봉지이다."]),
  makeStep("p4", p4_sents[6],
    "할머니의 대사 '네가 키운 거란다'가 뜻하는 바는?",
    ["고추가 '나'의 노력으로 자란 것임을 알려 준다.", "고추를 사 온 것이라고 알려 준다.", "다른 사람이 키운 것이라고 설명한다.", "내년에 다시 키워야 한다고 당부한다."]),
  makeStep("p4", p4_sents[7],
    "마지막 문장에서 '나'에게 남은 감각은?",
    ["손끝에 남은 흙의 감촉이 오래도록 사라지지 않는다.", "고추의 매운 냄새가 차 안에 퍼진다.", "할머니의 목소리가 귓가에 맴돈다.", "텃밭의 풍경이 눈앞에 아른거린다."]),
  // p4 문단 중심내용
  makeParagraphSummaryStep("p4", p4.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["돌봄의 가치를 깨달은 '나'가 할머니의 헌신을 이해하며 떠난다.", "'나'가 도시 생활을 그리워하며 서둘러 떠난다.", "할머니가 '나'를 붙잡으며 떠나지 말라고 한다.", "'나'가 시골에 남기로 결심한다."])
];

// ────────────── 복기 카드 (8카드) ──────────────
const fullText = p1 + " " + p2 + " " + p3 + " " + p4;
const cardCount = 8;
const cardLen = Math.ceil(fullText.length / cardCount);
const cards = [];
for (let i = 0; i < cardCount; i++) {
  const start = i * cardLen;
  const end = Math.min(start + cardLen, fullText.length);
  cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
}

// ────────────── 확인 문항 (8문항, 질문형) ──────────────
function findConfirmRange(paragraphId, text, substring) {
  const idx = text.indexOf(substring);
  if (idx === -1) throw new Error(`확인 문항 문자열 못 찾음: "${substring}"`);
  return { paragraphId, start: idx, end: idx + substring.length };
}

const confirmQuestions = [
  {
    id: "q1", prompt: "지문에서 '건성으로'를 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p1", p1, "건성으로")]
  },
  {
    id: "q2", prompt: "지문에서 '구부러진 등'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p1", p1, "구부러진 등")]
  },
  {
    id: "q3", prompt: "지문에서 '북돋아'를 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p2", p2, "북돋아")]
  },
  {
    id: "q4", prompt: "지문에서 '담담한 위로'를 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p2", p2, "담담한 위로")]
  },
  {
    id: "q5", prompt: "지문에서 '뿌듯함'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p3", p3, "뿌듯함")]
  },
  {
    id: "q6", prompt: "지문에서 '따뜻하게 채워지는'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p3", p3, "따뜻하게 채워지는")]
  },
  {
    id: "q7", prompt: "지문에서 '헌신'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p4", p4, "헌신")]
  },
  {
    id: "q8", prompt: "지문에서 '흙의 감촉'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p4", p4, "흙의 감촉")]
  }
];

// ────────────── JSON 조립 ──────────────
const staticContent = {
  contentId: "dr-r3-004",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 3) Day 4 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_3",
  schoolGradeRange: { min: 8, max: 9 },
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
      cards,
      correctOrder: cards.map(c => c.id),
      seedPenalty: 1
    },
    confirm: {
      questions: confirmQuestions.map(q => ({
        id: q.id,
        prompt: q.prompt,
        answerRanges: q.answerRanges,
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: "ANY"
      }))
    }
  }
};

const batchItem = {
  content_type: "DAILY_READING",
  level_id: "RUSSELL_3",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 4,
  module_key: "reading_training",
  schema_version: "1.0",
  content: staticContent
};

// static 파일 저장
const staticPath = "frontend/public/daily-reading/russell3/004.json";
fs.writeFileSync(staticPath, JSON.stringify(staticContent, null, 2), "utf-8");
console.log("\n✅ static 파일 저장:", staticPath);

// 배치 파일 업데이트
const batchPath = "generated/daily-batch-reading-russell3.json";
const batch = JSON.parse(fs.readFileSync(batchPath, "utf-8"));
batch.items[3] = batchItem; // 0-indexed → Day 4는 index 3
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), "utf-8");
console.log("✅ 배치 파일 업데이트:", batchPath, "items[3]");

console.log("\n=== Day 4 생성 완료 ===");
console.log("총 타임라인 스텝:", timeline.length);
console.log("복기 카드:", cards.length);
console.log("확인 문항:", confirmQuestions.length);
