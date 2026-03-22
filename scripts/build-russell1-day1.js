// 러셀1 Day 1 비문학 - "뉴스와 시민 참여" (사회_공공 저널리즘 기출 참조, 중1~중2 수준 재작성)

const p1 = "우리가 매일 접하는 뉴스는 사회에서 벌어지는 여러 가지 일을 알려 주는 중요한 역할을 한다. 과거에는 신문이나 텔레비전 뉴스가 주로 정치인이나 큰 기업에 관한 이야기를 다루었다. 그런데 이런 뉴스는 일반 시민의 일상생활과 거리가 멀어서, 많은 사람이 뉴스에 관심을 잃기 시작했다. 뉴스를 보아도 자기 삶과는 상관없는 먼 세계의 이야기처럼 느껴졌기 때문이다. 이런 문제의식에서 등장한 것이 바로 '공공 저널리즘'이라는 새로운 보도 방식이다. 공공 저널리즘이란 시민이 일상에서 실제로 겪는 문제를 뉴스의 중심 주제로 삼는 것을 말한다. 예를 들어 동네의 교통 안전 문제나 학교 급식의 질처럼 사람들의 생활에 직접 영향을 미치는 주제를 깊이 있게 다루는 것이다.";

const p2 = "공공 저널리즘에서 기자는 단순히 사건을 전달하는 사람에 그치지 않는다. 기자는 시민의 목소리를 직접 모으는 역할도 함께 수행한다. 구체적으로 기자는 설문 조사나 주민 회의 같은 방법을 활용하여 시민이 어떤 문제를 가장 심각하게 느끼는지 파악한다. 그런 다음 전문가와 주민이 한자리에 모여 해결 방안을 논의하는 토론회를 마련하기도 한다. 이렇게 모인 다양한 의견과 논의 결과를 기사로 정리하여 보도하면, 더 많은 시민이 그 문제에 관심을 갖게 된다. 결국 공공 저널리즘은 뉴스를 통해 시민이 사회 문제에 직접 참여하도록 이끄는 데 큰 의의가 있다.";

const p3 = "물론 공공 저널리즘에 대한 비판의 목소리도 존재한다. 기자가 시민과 너무 가까이 지내다 보면 중립적인 시각을 잃을 수 있다는 점이 대표적인 우려이다. 예를 들어 기자가 특정 주민의 의견에 지나치게 공감한 나머지 다른 쪽의 사정을 제대로 전하지 못할 수도 있다. 이러한 문제를 줄이기 위해 공공 저널리즘은 과학적인 조사 방법을 적극 활용한다. 체계적인 설문 조사를 실시하고 여러 집단의 의견을 고루 수집하는 과정을 거쳐 보도의 객관성을 유지하려 노력한다. 이처럼 공공 저널리즘은 시민의 참여를 이끌어 내면서도 보도의 객관성을 지키려는 균형 잡힌 보도 방식이다. 이 새로운 뉴스 문화는 시민이 단순한 뉴스 소비자가 아니라 사회 문제 해결에 함께하는 참여자가 될 수 있음을 보여 준다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
];

const totalLen = p1.length + p2.length + p3.length;
console.log("=== 길이 확인 ===");
console.log(`p1: ${p1.length}자, p2: ${p2.length}자, p3: ${p3.length}자, 총: ${totalLen}자`);

function findSentenceBoundaries(text) {
  const boundaries = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.') {
      const end = i + 1;
      boundaries.push([start, end]);
      start = end;
      while (start < text.length && text[start] === ' ') start++;
    }
  }
  return boundaries;
}

const p1Sents = findSentenceBoundaries(p1);
const p2Sents = findSentenceBoundaries(p2);
const p3Sents = findSentenceBoundaries(p3);

console.log("\n=== p1 문장 경계 ===");
p1Sents.forEach((s, i) => {
  console.log(`  s${i+1}: [${s[0]}, ${s[1]}] "${p1.substring(s[0], s[1])}"`);
});

console.log("\n=== p2 문장 경계 ===");
p2Sents.forEach((s, i) => {
  console.log(`  s${i+1}: [${s[0]}, ${s[1]}] "${p2.substring(s[0], s[1])}"`);
});

console.log("\n=== p3 문장 경계 ===");
p3Sents.forEach((s, i) => {
  console.log(`  s${i+1}: [${s[0]}, ${s[1]}] "${p3.substring(s[0], s[1])}"`);
});

// confirm answerText 위치 계산
console.log("\n=== confirm answerRanges ===");
const confirmItems = [
  { q: "q1", pid: "p1", text: p1, answer: "공공 저널리즘", desc: "시민 일상 문제를 중심 주제로 삼는 보도 방식의 이름" },
  { q: "q2", pid: "p2", text: p2, answer: "설문 조사", desc: "시민 의견을 파악하기 위해 기자가 활용하는 방법 중 하나" },
  { q: "q3", pid: "p3", text: p3, answer: "중립적인 시각", desc: "기자가 시민과 너무 가까이 지내면 잃을 수 있는 것" },
  { q: "q4", pid: "p2", text: p2, answer: "토론회", desc: "전문가와 주민이 해결 방안을 논의하기 위해 마련하는 자리" },
  { q: "q5", pid: "p3", text: p3, answer: "객관성", desc: "공공 저널리즘이 과학적 조사를 통해 유지하려는 것" },
  { q: "q6", pid: "p1", text: p1, answer: "교통 안전", desc: "공공 저널리즘이 다루는 동네 문제의 한 가지 예" },
  { q: "q7", pid: "p2", text: p2, answer: "전문가", desc: "주민과 함께 해결 방안을 논의하는 사람" },
];

confirmItems.forEach((item) => {
  let searchIdx = 0;
  const positions = [];
  while (true) {
    const pos = item.text.indexOf(item.answer, searchIdx);
    if (pos === -1) break;
    positions.push({ paragraphId: item.pid, start: pos, end: pos + item.answer.length });
    searchIdx = pos + 1;
  }
  console.log(`  ${item.q}: "${item.answer}" → ${JSON.stringify(positions)}`);
});
