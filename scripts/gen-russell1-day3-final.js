// 러셀1 Day 3 비문학 - "사람의 다섯 가지 기본 욕구" (인문_현실요법과 욕구 기출 참조, 중1~중2 수준)
const fs = require('fs');
const path = require('path');

const p1 = "사람은 누구나 마음속에 여러 가지 욕구를 가지고 살아간다. 심리학에서는 이러한 인간의 기본 욕구를 크게 다섯 가지로 나누어 설명한다. 첫째는 안전의 욕구이다. 이것은 건강하게 오래 살고 싶고 위험하거나 불안한 상황에서 벗어나고 싶어 하는 마음을 가리킨다. 둘째는 사랑의 욕구이다. 다른 사람과 친하게 지내고 함께 나누며 서로 도움을 주고받고 싶어 하는 마음이 여기에 해당한다. 셋째는 성취의 욕구로, 공부나 운동 등을 잘해내서 주변 사람들에게 인정받고 싶어 하는 마음이다. 넷째는 자유의 욕구인데, 누구에게도 얽매이지 않고 자기가 원하는 대로 자유롭게 행동하고 싶어 하는 마음이다. 다섯째는 즐거움의 욕구이다. 새로운 것을 배우거나 다양한 놀이를 통해 재미를 느끼고 싶어 하는 것이 바로 이 욕구이다.";

const p2 = "이 다섯 가지 욕구는 사람마다 그 강도가 서로 다르게 나타난다. 예를 들어 안전의 욕구가 강한 사람은 건강 관리와 저축을 무엇보다 중요하게 여기는 편이다. 사랑의 욕구가 강한 사람은 주변 친구를 잘 돕지만, 상대방에게서도 똑같이 사랑을 받고 싶어 하기 때문에 인간관계에서 힘들어하기도 한다. 성취의 욕구가 강한 사람은 자기주장이 뚜렷하고 경쟁에서 이기려는 의지가 강하다. 자유의 욕구가 강한 사람은 혼자 하는 일을 좋아하며 다른 사람과 적당한 거리를 유지하는 것을 편하게 느낀다. 즐거움의 욕구가 강한 사람은 호기심이 많고 다양한 취미 생활을 즐기며 언제나 긍정적인 태도를 보인다.";

const p3 = "그런데 욕구의 강도 차이 때문에 사람들은 마음속 갈등을 겪기도 한다. 예를 들어 사랑의 욕구가 강한 사람은 다른 사람의 부탁을 쉽게 거절하지 못해 괴로워할 수 있다. 이런 경우에는 성취의 욕구를 조금 키워서 자기 의견을 분명하게 표현하는 연습을 하면 도움이 된다. 반대로 성취의 욕구와 자유의 욕구가 둘 다 강한 사람은 자기 뜻만 내세우다가 주변 사람들과 자주 부딪히기 쉽다. 이때는 성취의 욕구를 적절히 조절하여 다른 사람의 입장도 헤아려 보는 태도가 필요하다. 이처럼 자신의 욕구를 잘 살펴보고 지나치게 강한 욕구는 조절하며 약한 욕구는 조금씩 키워 나가는 것이 마음의 균형을 유지하는 비결이다.";

const scoring = { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true };

const charCount = p1.length + p2.length + p3.length;
console.log("=== 길이 확인 ===");
console.log("p1:", p1.length, "p2:", p2.length, "p3:", p3.length, "총:", charCount);

// 문장 경계
function getSentences(text, endMarkers) {
  const sents = [];
  let start = 0;
  for (const marker of endMarkers) {
    const idx = text.indexOf(marker, start);
    if (idx === -1) { console.log("MARKER NOT FOUND:", marker, "from", start); continue; }
    const end = idx + marker.length;
    sents.push([start, end]);
    start = end;
    while (start < text.length && text[start] === ' ') start++;
  }
  return sents;
}

const p1Sents = getSentences(p1, [
  "살아간다.",
  "설명한다.",
  "욕구이다.",   // 안전의 욕구이다.
  "가리킨다.",
  "욕구이다.",   // 사랑의 욕구이다.
  "해당한다.",
  "마음이다.",   // 인정받고 싶어 하는 마음이다.
  "마음이다.",   // 행동하고 싶어 하는 마음이다.
  "욕구이다.",   // 즐거움의 욕구이다.
  "욕구이다.",   // 이 욕구이다.
]);

console.log("\n=== p1 문장 경계 ===");
p1Sents.forEach((s, i) => {
  console.log("  " + (i+1) + ": [" + s[0] + ", " + s[1] + '] "' + p1.substring(s[0], s[1]) + '"');
});

const p2Sents = getSentences(p2, [
  "나타난다.",
  "편이다.",
  "한다.",     // 힘들어하기도 한다.
  "강하다.",
  "느낀다.",
  "보인다.",
]);

console.log("\n=== p2 문장 경계 ===");
p2Sents.forEach((s, i) => {
  console.log("  " + (i+1) + ": [" + s[0] + ", " + s[1] + '] "' + p2.substring(s[0], s[1]) + '"');
});

const p3Sents = getSentences(p3, [
  "한다.",     // 겪기도 한다.
  "있다.",     // 괴로워할 수 있다.
  "된다.",     // 도움이 된다.
  "쉽다.",     // 부딪히기 쉽다.
  "필요하다.",
  "비결이다.",
]);

console.log("\n=== p3 문장 경계 ===");
p3Sents.forEach((s, i) => {
  console.log("  " + (i+1) + ": [" + s[0] + ", " + s[1] + '] "' + p3.substring(s[0], s[1]) + '"');
});

// confirm 답 위치
const confirmItems = [
  { pid: "p1", text: p1, answer: "안전의 욕구" },
  { pid: "p1", text: p1, answer: "사랑의 욕구" },
  { pid: "p2", text: p2, answer: "저축" },
  { pid: "p2", text: p2, answer: "호기심" },
  { pid: "p3", text: p3, answer: "갈등" },
  { pid: "p1", text: p1, answer: "자유의 욕구" },
  { pid: "p3", text: p3, answer: "균형" },
];

console.log("\n=== confirm answerRanges ===");
confirmItems.forEach((item, i) => {
  const idx = item.text.indexOf(item.answer);
  console.log("  q" + (i+1) + ': "' + item.answer + '" → ' + item.pid + " [" + idx + ", " + (idx + item.answer.length) + "]");
  // 여러 위치
  let si = 0;
  const positions = [];
  while(true) {
    const pos = item.text.indexOf(item.answer, si);
    if (pos === -1) break;
    positions.push([pos, pos + item.answer.length]);
    si = pos + 1;
  }
  if (positions.length > 1) console.log("    (여러 위치: " + JSON.stringify(positions) + ")");
});
