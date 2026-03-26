// 러셀1 Day 2 문학 - "할머니의 텃밭" (현대 수필 느낌, 중1~중2 수준)
const fs = require('fs');
const path = require('path');

const p1 = "여름 방학이 시작되던 날, 나는 커다란 배낭 하나를 메고 시골 할머니 댁에 도착했다. 할머니는 언제나처럼 대문 앞에서 환한 미소로 나를 반갑게 맞아 주셨다. 집 뒤편에는 할머니가 오랫동안 정성껏 가꾸어 온 넓은 텃밭이 펼쳐져 있었다. 텃밭에는 고추, 상추, 토마토, 오이 같은 여러 가지 채소가 가지런히 줄을 맞추어 자라고 있었다. 나는 도시에서 화분에 꽃 한 송이 키워 본 것이 전부였기에, 이렇게 넓은 밭을 보니 신기하면서도 한편으로는 막막한 기분이 들었다. 할머니는 걱정스러운 내 표정을 살피시더니 조용히 말씀하셨다. \"천천히 하면 돼. 식물도 사람처럼 서두르면 잘 자라지 못한단다.\"";

const p2 = "다음 날 이른 아침, 할머니는 나를 텃밭으로 데려가셨다. 가장 먼저 해야 할 일은 긴 호스를 들고 채소에 물을 주는 것이었다. 할머니는 물줄기를 세게 틀지 말고 약하게 뿌려야 한다고 알려 주셨다. 물을 세게 뿌리면 연약한 어린 싹이 꺾이거나 흙이 파여서 뿌리가 드러날 수 있기 때문이었다. 물을 다 준 뒤에는 잡초를 뽑는 일이 이어졌다. 잡초는 채소가 흡수해야 할 영양분과 수분을 빼앗아 가기 때문에 부지런히 뽑아 주어야 한다고 하셨다. 처음에는 어떤 것이 잡초이고 어떤 것이 채소인지 구분하기가 쉽지 않아 헤맸지만, 할머니의 친절한 설명을 들으며 하나하나 눈을 키워 나갔다.";

const p3 = "일주일쯤 지나자 내가 매일 물을 준 토마토에 작고 노란 꽃이 피기 시작했다. 그 꽃을 처음 보았을 때 나는 말로 표현하기 어려운 뿌듯함을 느꼈다. 매일 아침 일찍 일어나 물을 주고 잡초를 뽑던 수고가 눈에 보이는 결과로 나타난 것이다. 할머니는 꽃이 진 자리에 곧 열매가 맺힐 거라고 말씀하셨다. 그 말을 듣고 나는 토마토가 빨갛게 익어 갈 날이 기다려져서 매일 텃밭을 찾았다. 방학이 끝나고 도시로 돌아올 때, 할머니는 내가 직접 기른 토마토 몇 개를 작은 봉지에 담아 주셨다. 집으로 돌아와 그 토마토를 한 입 베어 물었을 때, 마트에서 산 것과는 비교할 수 없이 달콤한 맛이 입안 가득 퍼졌다. 그때 나는 깨달았다. 정성을 들여 무언가를 돌보는 일은 그 결과뿐 아니라 과정 자체가 소중한 경험이 된다는 것을.";

console.log("=== 길이 확인 ===");
console.log(`p1: ${p1.length}자, p2: ${p2.length}자, p3: ${p3.length}자, 총: ${p1.length+p2.length+p3.length}자`);

// 수동 문장 경계 함수
function getSentences(text, markers) {
  const sents = [];
  let start = 0;
  for (const marker of markers) {
    const idx = text.indexOf(marker, start);
    if (idx === -1) { console.log(`MARKER NOT FOUND: "${marker}"`); continue; }
    const end = idx + marker.length;
    sents.push([start, end]);
    start = end;
    while (start < text.length && text[start] === ' ') start++;
  }
  return sents;
}

// p1 문장 끝 마커
const p1Sents = getSentences(p1, [
  "도착했다.",
  "주셨다.",
  "있었다.",  // 텃밭이 펼쳐져 있었다.
  "있었다.",  // 자라고 있었다.
  "들었다.",
  "말씀하셨다.",
  "못한단다.\""
]);

console.log("\n=== p1 문장 경계 ===");
p1Sents.forEach((s, i) => {
  console.log(`  ${i+1}: [${s[0]}, ${s[1]}] "${p1.substring(s[0], s[1])}"`);
});

// p2 문장 끝 마커
const p2Sents = getSentences(p2, [
  "데려가셨다.",
  "것이었다.",
  "주셨다.",
  "때문이었다.",
  "이어졌다.",
  "하셨다.",
  "나갔다."
]);

console.log("\n=== p2 문장 경계 ===");
p2Sents.forEach((s, i) => {
  console.log(`  ${i+1}: [${s[0]}, ${s[1]}] "${p2.substring(s[0], s[1])}"`);
});

// p3 문장 끝 마커
const p3Sents = getSentences(p3, [
  "시작했다.",
  "느꼈다.",
  "것이다.",
  "말씀하셨다.",
  "찾았다.",
  "주셨다.",
  "퍼졌다.",
  "깨달았다.",
  "것을."
]);

console.log("\n=== p3 문장 경계 ===");
p3Sents.forEach((s, i) => {
  console.log(`  ${i+1}: [${s[0]}, ${s[1]}] "${p3.substring(s[0], s[1])}"`);
});

// confirm 답 위치
console.log("\n=== confirm answerRanges ===");
const confirmItems = [
  { pid: "p3", text: p3, answer: "뿌듯함" },
  { pid: "p2", text: p2, answer: "잡초" },
  { pid: "p1", text: p1, answer: "텃밭" },
  { pid: "p3", text: p3, answer: "열매" },
  { pid: "p2", text: p2, answer: "영양분" },
  { pid: "p1", text: p1, answer: "화분" },
  { pid: "p3", text: p3, answer: "정성" },
];

confirmItems.forEach((item, i) => {
  const idx = item.text.indexOf(item.answer);
  console.log(`  q${i+1}: "${item.answer}" → ${item.pid} [${idx}, ${idx + item.answer.length}]`);
  // 모든 위치
  let si = 0;
  const positions = [];
  while (true) {
    const pos = item.text.indexOf(item.answer, si);
    if (pos === -1) break;
    positions.push([pos, pos + item.answer.length]);
    si = pos + 1;
  }
  if (positions.length > 1) console.log(`    (여러 위치: ${JSON.stringify(positions)})`);
});
