// 비트겐슈타인1 Day 6 문학(LITERATURE) - 고1~고2 수준, 1400자 ±50
// 현대소설 지문: '장마' 주제 - 전쟁과 가족 갈등
const fs = require('fs');
const path = require('path');

const p1 = "할머니는 마루 끝에 걸터앉아 빗소리를 듣고 계셨다. 장마가 시작된 지 벌써 열흘이 넘었고, 마당에는 물이 발등까지 차올라 신발이 둥둥 떠다닐 지경이었다. 지붕 끝에서 떨어지는 빗물이 처마 밑 항아리에 부딪히며 둔탁한 소리를 내고 있었으나, 할머니의 귀에는 아무것도 들리지 않는 것 같았다. 할머니는 아들이 전쟁터에서 돌아오지 않는다는 소식을 들은 뒤로 말수가 부쩍 줄었다. 밥을 차려 드려도 숟가락만 들었다 놓으셨고, 가끔 마당 쪽을 멍하니 바라보다가 깊은 한숨을 내쉬곤 하셨다. 나는 할머니의 등이 예전보다 한층 더 굽어진 것을 보며, 전쟁이라는 것이 총알이 닿지 않는 곳에 있는 사람들의 마음까지도 무너뜨린다는 사실을 어렴풋이 느끼고 있었다.";
const p2 = "외할머니가 우리 집에 오신 것은 장마가 한창이던 어느 저녁이었다. 외할머니는 대문 앞에 서서 비에 젖은 보자기를 풀어 마른 옷가지 몇 벌을 꺼내셨다. 머리카락에서 빗물이 뚝뚝 떨어지고 있었지만, 외할머니는 개의치 않는 듯 묵묵히 서 계셨다. 할머니는 외할머니를 보자마자 표정이 돌처럼 굳어졌다. 두 분은 전쟁 전에는 서로의 집을 오가며 정을 나누던 다정한 사이였지만, 전쟁이 터진 뒤로는 이념이라는 보이지 않는 벽이 두 분 사이에 세워졌다. 할머니의 아들은 국군으로 나갔고, 외할머니의 아들은 반대편에 섰기 때문이었다. 외할머니는 할머니에게 고개를 깊이 숙였지만, 할머니는 고개를 돌린 채 아무 말 없이 방으로 들어가 버리셨다.";
const p3 = "나는 두 할머니 사이에 끼어 매일 어쩔 줄을 몰랐다. 밥상을 따로 두 번 차려야 했고, 한쪽 방에서 말을 건네면 다른 쪽 방에서는 무거운 침묵이 돌아왔다. 어느 날 밤, 빗줄기가 유난히 거세게 쏟아지더니 바람까지 몰아치기 시작했다. 마당에서 이상한 소리가 들려 문을 열고 나가 보니, 담장 밑에 커다란 구렁이 한 마리가 빗물에 떠밀려 와 서려 있었다. 나는 놀라서 소리를 질렀고, 그 소리에 두 할머니가 거의 동시에 각자의 방문을 열고 마루로 나오셨다. 할머니는 구렁이를 보더니 아들의 혼이 돌아온 것이라며 눈물을 흘리셨다. 외할머니도 같은 생각이었는지 구렁이 앞에 무릎을 꿇고 두 손을 모아 빌기 시작하셨다.";
const p4 = "두 할머니는 나란히 마루 끝에 앉아 빗속의 구렁이를 말없이 바라보셨다. 그 순간만큼은 이념도, 원망도, 서로를 향한 차가운 시선도 모두 사라진 듯했다. 오직 전쟁터에서 돌아오지 못한 아들들을 그리워하는 마음만이 두 분을 하나로 이어 주고 있었다. 이윽고 빗줄기가 서서히 잦아들자 구렁이는 천천히 담장 너머로 사라졌다. 한참의 정적이 흐른 뒤에 할머니가 먼저 입을 여셨다. 그 목소리에는 오랫동안 닫아 두었던 마음의 문이 조금씩 열리는 듯한 떨림이 담겨 있었다. 외할머니는 아무 말 없이 할머니의 주름진 손을 꼭 잡으셨고, 두 분의 맞잡은 손등 위로 빗물인지 눈물인지 모를 물방울이 소리 없이 흘러내렸다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
  { id: "p4", text: p4 }
];

const totalLen = p1.length + p2.length + p3.length + p4.length;
console.log("=== 지문 길이 검증 ===");
console.log(`p1: ${p1.length}자`);
console.log(`p2: ${p2.length}자`);
console.log(`p3: ${p3.length}자`);
console.log(`p4: ${p4.length}자`);
console.log(`합계: ${totalLen}자`);
if (totalLen < 1350 || totalLen > 1450) {
  console.error(`경고: 목표 범위(1400±50) 벗어남!`);
}

// 문장 경계 탐지
function findSentences(text) {
  const sentences = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1;
      while (next < text.length && text[next] === ' ') next++;
      start = next;
    }
  }
  if (start < text.length) {
    sentences.push({ start, end: text.length, text: text.substring(start) });
  }
  return sentences;
}

function findRange(paragraphId, searchText) {
  const para = paragraphs.find(p => p.id === paragraphId);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}" not found in ${paragraphId}`);
  return { paragraphId, start, end: start + searchText.length };
}

const p1Sents = findSentences(p1);
const p2Sents = findSentences(p2);
const p3Sents = findSentences(p3);
const p4Sents = findSentences(p4);

for (const p of paragraphs) {
  const sents = findSentences(p.text);
  console.log(`\n=== ${p.id} 문장 분석 (${sents.length}개) ===`);
  sents.forEach((s, i) => {
    console.log(`  [${i}] start=${s.start}, end=${s.end}: "${s.text.substring(0, 40)}..."`);
  });
}

// 정독 타임라인
const timeline = [];
let stepNum = 1;

function addStep(pId, start, end, prompt, choices, answerId) {
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: pId, start, end }] },
    question: {
      prompt,
      choices: choices.map((text, i) => ({ id: ["A","B","C","D"][i], text })),
      answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

// === 문단 1 정독 (6문장) ===
addStep("p1", p1Sents[0].start, p1Sents[0].end,
  "첫 문장이 보여 주는 할머니의 모습으로 알맞은 것은 무엇인가요?",
  [
    "할머니가 마루 끝에 걸터앉아 빗소리를 듣고 있는 고요한 모습이다.",
    "할머니가 마당에서 비를 맞으며 춤을 추는 모습이다.",
    "할머니가 이웃집을 방문하여 이야기를 나누는 모습이다.",
    "할머니가 부엌에서 밥을 짓고 있는 모습이다."
  ], "A");

addStep("p1", p1Sents[1].start, p1Sents[1].end,
  "둘째 문장이 전달하는 배경 상황으로 알맞은 것은 무엇인가요?",
  [
    "장마가 열흘 넘게 계속되어 마당에 물이 발등까지 차올라 있다.",
    "가뭄이 계속되어 마당이 갈라지고 있다.",
    "태풍이 지나간 뒤 집이 크게 부서졌다.",
    "눈이 많이 와서 지붕이 무너질 위기이다."
  ], "A");

addStep("p1", p1Sents[2].start, p1Sents[2].end,
  "셋째 문장이 묘사하는 분위기로 알맞은 것은 무엇인가요?",
  [
    "빗물이 항아리에 부딪히는 소리가 나지만 할머니의 귀에는 들리지 않는 듯하다.",
    "할머니가 빗소리를 즐기며 콧노래를 부르고 있다.",
    "빗소리가 너무 커서 할머니가 귀를 막고 계신다.",
    "빗물이 그쳐서 마당이 조용해졌다."
  ], "A");

addStep("p1", p1Sents[3].start, p1Sents[3].end,
  "넷째 문장에서 할머니의 말수가 줄어든 이유로 알맞은 것은 무엇인가요?",
  [
    "아들이 전쟁터에서 돌아오지 못한다는 소식을 들었기 때문이다.",
    "장마가 길어져 농사를 걱정하기 때문이다.",
    "이웃과 다투어 마음이 상했기 때문이다.",
    "병원에서 건강이 좋지 않다는 진단을 받았기 때문이다."
  ], "A");

addStep("p1", p1Sents[4].start, p1Sents[4].end,
  "다섯째 문장이 묘사하는 할머니의 행동으로 알맞은 것은 무엇인가요?",
  [
    "밥을 차려 드려도 숟가락만 들었다 놓고 마당을 멍하니 바라보셨다.",
    "밥을 맛있게 드시고 마당에서 산책을 하셨다.",
    "밥상을 스스로 차리고 이웃에게도 나눠 주셨다.",
    "음식을 거부하고 방 안에만 계셨다."
  ], "A");

addStep("p1", p1Sents[5].start, p1Sents[5].end,
  "마지막 문장에서 '나'가 깨달은 것으로 알맞은 것은 무엇인가요?",
  [
    "전쟁은 직접 전투에 참여하지 않은 사람들의 마음까지도 무너뜨린다는 것이다.",
    "할머니의 건강이 나빠진 것은 장마 때문이라는 것이다.",
    "전쟁은 군인들에게만 영향을 준다는 것이다.",
    "할머니의 등이 굽어진 것은 나이 때문이라는 것이다."
  ], "A");

// 문단1 중심내용
addStep("p1", 0, p1.length,
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "장마 속에서 아들의 부재로 깊은 슬픔에 잠긴 할머니의 모습과 전쟁의 간접적 상처를 보여 준다.",
    "할머니가 장마를 즐기며 평온한 일상을 보내는 모습을 그린다.",
    "전쟁이 끝나고 아들이 돌아와 가족이 기뻐하는 장면을 보여 준다.",
    "장마로 인한 홍수 피해와 복구 과정을 묘사한다."
  ], "A");

// === 문단 2 정독 (7문장) ===
addStep("p2", p2Sents[0].start, p2Sents[0].end,
  "첫 문장이 전달하는 사건으로 알맞은 것은 무엇인가요?",
  [
    "장마가 한창이던 어느 저녁에 외할머니가 우리 집에 오셨다.",
    "할머니가 외할머니 집을 방문하셨다.",
    "장마가 끝난 뒤 외할머니가 편지를 보내셨다.",
    "외할머니가 오시기로 한 약속을 취소하셨다."
  ], "A");

addStep("p2", p2Sents[1].start, p2Sents[2].end,
  "둘째, 셋째 문장이 묘사하는 외할머니의 모습으로 알맞은 것은 무엇인가요?",
  [
    "비에 젖은 보자기를 풀어 옷가지를 꺼내고, 머리에서 빗물이 떨어지지만 묵묵히 서 계셨다.",
    "화려한 옷을 입고 선물 상자를 들고 오신 모습이다.",
    "빈손으로 오셔서 할머니에게 도움을 청하는 모습이다.",
    "우산을 쓰고 마차를 타고 도착하는 모습이다."
  ], "A");

addStep("p2", p2Sents[3].start, p2Sents[3].end,
  "넷째 문장에서 할머니의 반응으로 알맞은 것은 무엇인가요?",
  [
    "외할머니를 보자마자 표정이 돌처럼 굳어졌다.",
    "반가워하며 외할머니를 따뜻하게 맞이하셨다.",
    "놀라서 소리를 지르며 뛰어나가셨다.",
    "기뻐하며 음식을 차려 대접하셨다."
  ], "A");

addStep("p2", p2Sents[4].start, p2Sents[5].end,
  "다섯째, 여섯째 문장이 설명하는 두 할머니 사이의 갈등 원인으로 알맞은 것은 무엇인가요?",
  [
    "전쟁 후 이념의 차이로 인해 두 분 사이에 보이지 않는 벽이 생겼다.",
    "재산 문제로 두 분이 다투게 되었다.",
    "이웃의 험담 때문에 사이가 멀어졌다.",
    "자녀들의 결혼 문제로 갈등이 생겼다."
  ], "A");

addStep("p2", p2Sents[6].start, p2Sents[6].end,
  "마지막 문장이 보여 주는 할머니의 태도로 알맞은 것은 무엇인가요?",
  [
    "외할머니가 고개를 숙였지만 할머니는 고개를 돌리고 방으로 들어가 버리셨다.",
    "할머니가 외할머니에게 다가가 사과하셨다.",
    "두 분이 함께 울면서 화해하셨다.",
    "할머니가 외할머니를 집 밖으로 내보내셨다."
  ], "A");

// 문단2 중심내용
addStep("p2", 0, p2.length,
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "전쟁으로 이념이 갈린 두 할머니가 재회하지만 할머니가 외할머니를 거부하는 모습을 보여 준다.",
    "두 할머니가 오랜만에 만나 기쁨의 눈물을 흘리는 장면이다.",
    "외할머니가 먼 길을 걸어와 건강이 나빠진 모습을 그린다.",
    "할머니가 외할머니를 위해 성대한 저녁 식사를 준비하는 장면이다."
  ], "A");

// === 문단 3 정독 (7문장) ===
addStep("p3", p3Sents[0].start, p3Sents[0].end,
  "첫 문장에서 '나'의 심정으로 알맞은 것은 무엇인가요?",
  [
    "두 할머니 사이에서 어찌할 바를 모르는 난처한 마음이다.",
    "두 할머니가 사이좋게 지내셔서 안심하는 마음이다.",
    "할머니와 외할머니 중 한 편을 확실히 든 마음이다.",
    "할머니들의 갈등에 무관심한 마음이다."
  ], "A");

addStep("p3", p3Sents[1].start, p3Sents[1].end,
  "둘째 문장이 보여 주는 상황으로 알맞은 것은 무엇인가요?",
  [
    "밥상을 두 번 차리고, 한쪽이 말하면 다른 쪽이 침묵으로 대응하는 상황이다.",
    "두 할머니가 함께 밥을 드시며 대화를 나누는 상황이다.",
    "나 혼자 밥을 먹고 할머니들은 외출한 상황이다.",
    "두 할머니가 번갈아 요리를 하시는 상황이다."
  ], "A");

addStep("p3", p3Sents[2].start, p3Sents[3].end,
  "셋째, 넷째 문장이 묘사하는 사건으로 알맞은 것은 무엇인가요?",
  [
    "비바람이 거세던 밤에 담장 밑으로 커다란 구렁이가 떠밀려 와 서려 있었다.",
    "장마가 그치고 마당에 꽃이 피어났다.",
    "밤에 도둑이 들어 두 할머니가 놀라셨다.",
    "비바람에 지붕이 날아가 대피해야 했다."
  ], "A");

addStep("p3", p3Sents[4].start, p3Sents[4].end,
  "다섯째 문장에서 소리를 듣고 일어난 일로 알맞은 것은 무엇인가요?",
  [
    "'나'가 놀라서 소리를 지르자 두 할머니가 동시에 방문을 열고 나오셨다.",
    "할머니만 나오시고 외할머니는 방에 계셨다.",
    "두 할머니가 겁을 먹고 문을 잠갔다.",
    "'나'가 조용히 구렁이를 관찰하고 있었다."
  ], "A");

addStep("p3", p3Sents[5].start, p3Sents[6].end,
  "여섯째, 일곱째 문장에서 두 할머니의 공통된 반응으로 알맞은 것은 무엇인가요?",
  [
    "구렁이를 아들의 혼으로 여기며 눈물을 흘리거나 두 손을 모아 빌었다.",
    "구렁이를 무서워하여 집 밖으로 도망치셨다.",
    "구렁이를 잡아서 요리하자고 제안하셨다.",
    "구렁이에 무관심하게 다시 방으로 돌아가셨다."
  ], "A");

// 문단3 중심내용
addStep("p3", 0, p3.length,
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "갈등 속에 놓인 '나'의 고충과, 구렁이의 등장으로 두 할머니가 같은 슬픔을 공유하는 순간을 그린다.",
    "구렁이가 등장하여 두 할머니가 큰 싸움을 벌이는 장면을 그린다.",
    "장마가 그치고 평화로운 일상이 돌아온 모습을 묘사한다.",
    "'나'가 구렁이를 퇴치하여 영웅이 되는 이야기이다."
  ], "A");

// === 문단 4 정독 (7문장) ===
addStep("p4", p4Sents[0].start, p4Sents[0].end,
  "첫 문장이 묘사하는 장면으로 알맞은 것은 무엇인가요?",
  [
    "두 할머니가 나란히 마루 끝에 앉아 빗속의 구렁이를 함께 바라보고 있다.",
    "두 할머니가 각각 다른 방에서 잠을 자고 계신다.",
    "두 할머니가 마당에 나가 비를 맞으며 춤을 추신다.",
    "할머니 한 분만 마루에 앉아 있고 다른 분은 떠나셨다."
  ], "A");

addStep("p4", p4Sents[1].start, p4Sents[1].end,
  "둘째 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  [
    "그 순간만큼은 이념, 원망, 차가운 시선 같은 갈등이 모두 사라진 듯했다.",
    "두 분 사이의 갈등이 더 심해졌다.",
    "이념의 차이로 인해 서로를 더 미워하게 되었다.",
    "원망이 커져 서로 말을 나누지 않았다."
  ], "A");

addStep("p4", p4Sents[2].start, p4Sents[2].end,
  "셋째 문장에서 두 할머니를 하나로 이어 준 것으로 알맞은 것은 무엇인가요?",
  [
    "전쟁에서 돌아오지 못한 아들들을 그리워하는 마음이다.",
    "장마가 빨리 끝나기를 바라는 소원이다.",
    "구렁이를 함께 쫓아내려는 의지이다.",
    "맛있는 음식을 함께 먹고 싶은 바람이다."
  ], "A");

addStep("p4", p4Sents[3].start, p4Sents[3].end,
  "넷째 문장에서 구렁이가 사라진 시점으로 알맞은 것은 무엇인가요?",
  [
    "빗줄기가 잦아들자 담장 너머로 천천히 사라졌다.",
    "두 할머니가 소리를 질러 쫓아냈다.",
    "'나'가 막대기로 구렁이를 내보냈다.",
    "비가 더 세차게 내려 물에 떠내려갔다."
  ], "A");

addStep("p4", p4Sents[4].start, p4Sents[5].end,
  "다섯째, 여섯째 문장에서 할머니의 목소리에 담긴 것으로 알맞은 것은 무엇인가요?",
  [
    "오랫동안 닫아 두었던 마음의 문이 조금씩 열리는 듯한 떨림이 느껴졌다.",
    "외할머니에 대한 분노가 폭발하는 듯한 날카로움이 느껴졌다.",
    "아무런 감정 없이 무덤덤한 어조가 느껴졌다.",
    "장마가 끝나 기뻐하는 밝은 목소리가 느껴졌다."
  ], "A");

addStep("p4", p4Sents[6].start, p4Sents[6].end,
  "마지막 문장이 그려내는 장면의 의미로 알맞은 것은 무엇인가요?",
  [
    "외할머니가 할머니의 손을 잡고 빗물인지 눈물인지 모를 물방울이 흘러 화해의 기미를 보인다.",
    "두 할머니가 서로 등을 돌린 채 비를 맞고 있다.",
    "외할머니만 눈물을 흘리고 할머니는 무표정하다.",
    "두 할머니가 다시 다투기 시작한다."
  ], "A");

// 문단4 중심내용
addStep("p4", 0, p4.length,
  "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "갈등을 넘어 아들을 잃은 슬픔을 공유하며 두 할머니가 조금씩 화해의 길로 나아가는 모습을 보여 준다.",
    "구렁이가 사라진 뒤 두 할머니의 갈등이 더 심해지는 모습을 보여 준다.",
    "장마가 끝나고 두 할머니가 각자의 집으로 돌아가는 모습을 그린다.",
    "나가 두 할머니에게 화해를 강요하여 억지로 손을 잡게 하는 장면이다."
  ], "A");

// === 복기 카드 (8장) ===
const recall = {
  cards: [
    { id: "c1", text: "장마가 열흘째 계속되는 가운데, 할머니는 아들이 전쟁터에서 돌아오지 않는다는 소식 후 깊은 슬픔에 잠겨 계셨다." },
    { id: "c2", text: "'나'는 할머니의 굽은 등을 보며, 전쟁이 직접 싸우지 않는 사람들의 마음까지 무너뜨린다는 것을 느꼈다." },
    { id: "c3", text: "외할머니가 장마 중 우리 집에 오셨지만, 이념의 차이로 할머니는 외할머니를 거부하고 방으로 들어가셨다." },
    { id: "c4", text: "할머니의 아들은 국군으로, 외할머니의 아들은 반대편에 섰기 때문에 두 분 사이에 벽이 생겼다." },
    { id: "c5", text: "비가 심한 밤에 담장 밑으로 구렁이가 나타나자, 두 할머니 모두 아들의 혼으로 여기며 슬퍼하셨다." },
    { id: "c6", text: "두 할머니는 나란히 앉아 빗속의 구렁이를 바라보며, 그 순간 이념과 원망이 사라진 듯했다." },
    { id: "c7", text: "돌아오지 못한 아들을 그리워하는 마음이 두 분을 하나로 이어 주었다." },
    { id: "c8", text: "할머니가 떨리는 목소리로 입을 여시고, 외할머니가 손을 잡으시며 화해의 기미가 나타났다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// === 확인 문항 (8문항) ===
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "할머니가 말수가 줄어든 이유는 무엇인가요?",
      answerText: "아들이 전쟁터에서 돌아오지 않는다는 소식",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "아들이 전쟁터에서 돌아오지 않는다는 소식을 들은 뒤로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "'나'는 전쟁이 총알이 닿지 않는 곳에 있는 사람들에게 무엇을 한다고 느꼈나요?",
      answerText: "마음까지도 무너뜨린다",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "마음까지도 무너뜨린다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "전쟁 후 두 할머니 사이에 세워진 것을 비유적으로 무엇이라 표현했나요?",
      answerText: "보이지 않는 벽",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "보이지 않는 벽")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "할머니의 아들은 어디에 소속되었나요?",
      answerText: "국군",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "국군")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "비가 심하게 내리던 밤에 담장 밑에 나타난 동물은 무엇인가요?",
      answerText: "구렁이",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "구렁이 한 마리")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "할머니는 구렁이를 보고 무엇이 돌아온 것이라 여겼나요?",
      answerText: "아들의 혼",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "아들의 혼")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "두 할머니를 하나로 이어 준 것은 무엇인가요?",
      answerText: "아들들을 그리워하는 마음",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "아들들을 그리워하는 마음")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q8",
      prompt: "마지막 장면에서 두 분의 손등 위로 흘러내린 것을 어떻게 표현했나요?",
      answerText: "빗물인지 눈물인지 모를 물방울",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "빗물인지 눈물인지 모를 물방울")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

// JSON 조립
const content = {
  contentId: "dr-w1-006",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 6 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "WITTGENSTEIN_1",
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
    passage: {
      format: "TEXT",
      paragraphs: paragraphs.map(p => ({ id: p.id, text: p.text }))
    },
    intensive: { timeline },
    recall,
    confirm
  }
};

// 검증
console.log("\n=== 최종 검증 ===");
console.log(`정독 step 수: ${timeline.length}`);
console.log(`복기 카드 수: ${recall.cards.length}`);
console.log(`확인 문항 수: ${confirm.questions.length}`);

console.log("\n=== answerRanges 검증 ===");
for (const q of confirm.questions) {
  for (const r of q.answerRanges) {
    const para = paragraphs.find(p => p.id === r.paragraphId);
    const extracted = para.text.substring(r.start, r.end);
    console.log(`${q.id}: [${r.start},${r.end}] "${extracted}"`);
  }
}

// static 파일 저장
const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1', '006.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\nstatic 파일 저장: ${staticPath}`);

// 배치 파일 업데이트
const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-wittgenstein1.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[5] = {
  content_type: "DAILY_READING",
  level_id: "WITTGENSTEIN_1",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 6,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log(`배치 파일 업데이트 완료 (items[5])`);
