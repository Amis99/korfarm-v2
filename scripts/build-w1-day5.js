// 비트겐슈타인1 Day 5 비문학 - 인공지능과 저작권 (고1~고2 수준, 1400자 ±50)
const fs = require('fs');
const path = require('path');

const p1 = "인공지능 기술이 빠르게 발전하면서 인공지능이 만들어 낸 창작물에 대한 저작권 문제가 새로운 쟁점으로 떠올랐다. 저작권이란 인간이 사상이나 감정을 창작적으로 표현한 결과물에 부여되는 배타적 권리를 말한다. 이 권리가 인정되려면 작품에 창작자의 독자적인 사고와 판단이 반영되어야 하며, 단순한 사실의 나열이나 기계적 복제만으로는 인정받기 어렵다. 그런데 인공지능은 대량의 데이터를 학습하여 새로운 텍스트, 이미지, 음악 등을 자동으로 생성할 수 있게 되었다. 이때 인공지능이 만든 결과물이 기존 인간 창작물과 유사한 형태와 수준을 갖추더라도, 그것이 진정한 의미의 창작에 해당하는지는 여전히 논란이 되고 있다.";
const p2 = "현행 저작권법은 창작의 주체를 자연인, 즉 사람으로 한정하고 있다. 따라서 인공지능이 독자적으로 생성한 결과물에는 저작권이 부여되지 않는다. 이는 인공지능이 스스로 의도나 감정을 지니지 않으므로 창작 행위의 핵심 요건인 인간의 정신적 활동이 결여되어 있다고 보기 때문이다. 그러나 인공지능을 도구로 활용하여 사람이 창작 과정에 실질적으로 관여한 경우에는 그 사람에게 저작권이 인정될 수 있다. 예를 들어, 인공지능에게 구체적인 지시를 내리고 생성된 결과물을 선별하거나 수정하는 등 창작적 기여가 인정되면, 해당 결과물은 도구 사용자의 저작물로서 법적 보호를 받을 수 있다.";
const p3 = "인공지능 창작물을 둘러싼 논의에서 주요한 쟁점 중 하나는 학습 데이터의 저작권 침해 여부이다. 인공지능이 기존 저작물을 대량으로 학습하는 과정에서 원저작자의 허락 없이 작품이 활용되는 경우가 많다. 이에 대해 일부에서는 학습 과정이 인간이 책을 읽고 영감을 얻는 것과 유사하므로 공정 이용에 해당한다고 주장한다. 반면, 원저작자의 경제적 이익을 침해할 수 있으므로 별도의 허락이나 적절한 보상이 필요하다는 입장도 있다. 특히 인공지능이 학습한 내용을 바탕으로 원작과 경쟁하는 결과물을 생성할 경우 원저작자의 시장 이익이 직접적으로 감소할 수 있다는 우려도 제기된다. 각국의 법원과 입법 기관은 이 문제에 대해 서로 다른 기준을 적용하고 있어, 국제적으로 통일된 규범은 아직 마련되지 않은 상태이다.";
const p4 = "인공지능 창작물의 저작권 문제를 해결하기 위해 다양한 대안이 모색되고 있다. 첫째, 인공지능의 기여도에 따라 저작권의 범위를 달리 설정하는 방안이 있다. 인간의 관여가 클수록 기존 저작권법의 보호를 받고, 인공지능의 자율성이 높을수록 보호 범위를 제한하는 것이다. 둘째, 인공지능 결과물에 대해 기존 저작권과는 별도의 새로운 권리 체계를 마련하자는 제안도 있다. 이 경우 보호 기간이나 권리의 내용을 기존 저작권과 다르게 설정하여, 인공지능 시대에 맞는 유연한 보호가 가능해진다. 결국 기술의 발전 속도에 맞추어 창작자의 권리와 기술 혁신 사이의 균형을 찾는 것이 이 문제의 핵심 과제라 할 수 있다.";

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

// 문장 분석
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

// 정독 타임라인 생성
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

// === 문단 1 정독 ===
// s1: 문장1
addStep("p1", p1Sents[0].start, p1Sents[0].end,
  "첫 문장이 제시하는 핵심 쟁점으로 알맞은 것은 무엇인가요?",
  [
    "AI가 만든 창작물의 저작권 문제가 새로운 논쟁거리로 부각되었다.",
    "인공지능 기술의 발전으로 모든 창작 활동이 중단되었다.",
    "저작권 문제는 인공지능 등장 이전에 이미 완전히 해결되었다.",
    "인공지능은 창작물을 만들 수 없어 저작권 문제가 존재하지 않는다."
  ], "A");

// s2: 문장2
addStep("p1", p1Sents[1].start, p1Sents[1].end,
  "둘째 문장에서 설명하는 '저작권'의 정의로 알맞은 것은 무엇인가요?",
  [
    "사람이 사상이나 감정을 독창적으로 표현한 결과물에 주어지는 권리이다.",
    "기계가 자동으로 생성한 모든 결과물에 부여되는 권리이다.",
    "데이터를 수집하고 저장하는 행위에 대해 주어지는 권리이다.",
    "타인의 작품을 자유롭게 복제할 수 있도록 허용하는 권리이다."
  ], "A");

// s3: 문장3
addStep("p1", p1Sents[2].start, p1Sents[2].end,
  "셋째 문장에서 저작권이 인정되기 위한 조건으로 알맞은 것은 무엇인가요?",
  [
    "창작자의 독자적인 사고와 판단이 작품에 담겨야 한다.",
    "작품이 대중에게 널리 알려져야 한다.",
    "정부 기관의 승인을 받아야 한다.",
    "일정 금액 이상의 경제적 가치를 지녀야 한다."
  ], "A");

// s4: 문장4
addStep("p1", p1Sents[3].start, p1Sents[3].end,
  "넷째 문장이 설명하는 인공지능의 능력으로 알맞은 것은 무엇인가요?",
  [
    "많은 양의 데이터를 학습하여 텍스트, 이미지, 음악 등을 자동으로 만들어 낸다.",
    "사람의 감정을 직접 경험하여 작품에 반영한다.",
    "기존 저작물을 그대로 복제하는 것만 가능하다.",
    "데이터를 학습하지 않고도 독창적인 작품을 만든다."
  ], "A");

// s5: 문장5
addStep("p1", p1Sents[4].start, p1Sents[4].end,
  "마지막 문장이 제기하는 논란의 핵심으로 알맞은 것은 무엇인가요?",
  [
    "AI 결과물이 사람 작품과 비슷해도 진정한 창작인지 의문이 제기된다.",
    "인공지능 결과물은 인간 창작물보다 항상 우수하다.",
    "AI 결과물과 인간 창작물은 완전히 동일한 것으로 인정된다.",
    "인공지능이 만든 결과물은 어떤 경우에도 창작으로 인정받는다."
  ], "A");

// s6: 문단1 전체 중심내용
addStep("p1", 0, p1.length,
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "AI 기술 발전으로 인공지능 창작물의 저작권 인정 여부가 새로운 쟁점이 되었다.",
    "저작권은 오직 인공지능에게만 부여될 수 있는 특수한 권리이다.",
    "인공지능은 데이터를 학습할 수 없어 창작이 원천적으로 불가능하다.",
    "모든 인공지능 결과물은 이미 저작권법의 보호를 받고 있다."
  ], "A");

// === 문단 2 정독 ===
// s7: 문장1
addStep("p2", p2Sents[0].start, p2Sents[0].end,
  "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  [
    "현행 저작권법은 창작의 주체를 사람으로 제한하고 있다.",
    "현행 저작권법은 인공지능도 창작 주체로 인정하고 있다.",
    "저작권법에는 창작 주체에 대한 규정이 전혀 없다.",
    "창작의 주체는 법인만 될 수 있다고 규정하고 있다."
  ], "A");

// s8: 문장2
addStep("p2", p2Sents[1].start, p2Sents[1].end,
  "둘째 문장이 설명하는 내용으로 알맞은 것은 무엇인가요?",
  [
    "인공지능이 혼자 만든 결과물에는 저작권이 주어지지 않는다.",
    "인공지능 결과물에는 자동으로 저작권이 부여된다.",
    "사람이 만든 작품에는 저작권이 인정되지 않는다.",
    "인공지능 결과물은 공공 재산으로 자동 등록된다."
  ], "A");

// s9: 문장3
addStep("p2", p2Sents[2].start, p2Sents[2].end,
  "셋째 문장이 말하는 저작권 미부여의 이유로 알맞은 것은 무엇인가요?",
  [
    "인공지능이 자체적인 의도나 감정을 갖지 않아 인간의 정신적 활동이 빠져 있기 때문이다.",
    "인공지능의 결과물이 품질 면에서 인간 창작물보다 뒤떨어지기 때문이다.",
    "인공지능은 데이터를 학습하지 않고 무작위로 결과물을 생성하기 때문이다.",
    "저작권법이 아직 만들어지지 않았기 때문이다."
  ], "A");

// s10: 문장4
addStep("p2", p2Sents[3].start, p2Sents[3].end,
  "넷째 문장이 설명하는 예외 상황으로 알맞은 것은 무엇인가요?",
  [
    "사람이 인공지능을 도구로 활용하며 창작에 실질적으로 참여하면 저작권이 인정될 수 있다.",
    "인공지능이 스스로 판단하여 만든 결과물도 저작권이 인정된다.",
    "인공지능을 사용한 결과물은 어떤 경우에도 저작권을 받을 수 없다.",
    "도구 사용 여부와 관계없이 모든 결과물에 저작권이 부여된다."
  ], "A");

// s11: 문장5
addStep("p2", p2Sents[4].start, p2Sents[4].end,
  "마지막 문장이 제시하는 구체적 사례로 알맞은 것은 무엇인가요?",
  [
    "AI에게 구체적 지시를 내리고 결과를 선별하거나 수정하면 도구 사용자의 저작물로 보호된다.",
    "인공지능에게 아무 지시 없이 맡기면 자동으로 저작권이 발생한다.",
    "결과물을 수정하지 않아도 지시만 내리면 저작권이 인정된다.",
    "인공지능 결과물은 선별이나 수정을 해도 저작권이 부여되지 않는다."
  ], "A");

// s12: 문단2 전체 중심내용
addStep("p2", 0, p2.length,
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "현행법상 AI 자체에는 저작권이 없지만, 사람이 실질적으로 관여하면 보호받을 수 있다.",
    "인공지능이 만든 모든 결과물에 저작권이 자동으로 부여된다.",
    "저작권법은 인공지능의 창작을 전면적으로 금지하고 있다.",
    "사람이 관여해도 인공지능을 사용하면 저작권이 인정되지 않는다."
  ], "A");

// === 문단 3 정독 ===
// s13: 문장1
addStep("p3", p3Sents[0].start, p3Sents[0].end,
  "첫 문장이 소개하는 주요 쟁점으로 알맞은 것은 무엇인가요?",
  [
    "인공지능의 학습 과정에서 기존 저작물의 저작권이 침해되는지의 문제이다.",
    "인공지능 학습에 사용되는 전력 비용이 과도하다는 문제이다.",
    "인공지능이 학습 데이터를 스스로 생산한다는 문제이다.",
    "학습 데이터가 부족하여 인공지능의 성능이 떨어진다는 문제이다."
  ], "A");

// s14: 문장2
addStep("p3", p3Sents[1].start, p3Sents[1].end,
  "둘째 문장이 지적하는 상황으로 알맞은 것은 무엇인가요?",
  [
    "원저작자의 동의 없이 저작물이 AI 학습에 활용되는 경우가 빈번하다.",
    "인공지능은 기존 저작물을 전혀 참조하지 않고 학습한다.",
    "모든 학습 데이터는 원저작자의 허락을 받아 사용되고 있다.",
    "인공지능 학습에는 저작물이 아닌 자연 현상만 사용된다."
  ], "A");

// s15: 문장3
addStep("p3", p3Sents[2].start, p3Sents[2].end,
  "셋째 문장이 소개하는 주장으로 알맞은 것은 무엇인가요?",
  [
    "AI 학습은 사람이 책을 읽고 영감을 얻는 것과 비슷하여 공정 이용에 해당한다는 견해이다.",
    "인공지능 학습은 완전한 저작권 침해이므로 전면 금지해야 한다는 견해이다.",
    "학습 과정은 저작권과 전혀 관련이 없다는 견해이다.",
    "인공지능은 학습 없이도 창작할 수 있다는 견해이다."
  ], "A");

// s16: 문장4
addStep("p3", p3Sents[3].start, p3Sents[3].end,
  "넷째 문장이 소개하는 반대 입장으로 알맞은 것은 무엇인가요?",
  [
    "원저작자의 경제적 이익이 손상될 수 있으므로 허락이나 보상이 필요하다는 입장이다.",
    "원저작자는 학습에 사용되면 오히려 홍보 효과를 얻으므로 보상이 불필요하다는 입장이다.",
    "원저작자의 경제적 이익은 학습과 전혀 관계가 없다는 입장이다.",
    "인공지능 학습을 전면 허용해야 산업이 발전한다는 입장이다."
  ], "A");

// s17: 문장5 (새로 추가된 문장)
addStep("p3", p3Sents[4].start, p3Sents[4].end,
  "다섯째 문장이 제기하는 우려로 알맞은 것은 무엇인가요?",
  [
    "AI가 원작과 경쟁하는 결과물을 만들어 원저작자의 시장 이익이 줄어들 수 있다는 것이다.",
    "인공지능 결과물은 원작과 전혀 경쟁하지 않으므로 우려할 필요가 없다.",
    "원저작자는 인공지능 덕분에 더 큰 수익을 얻게 된다.",
    "인공지능이 학습한 내용은 결과물에 반영되지 않는다."
  ], "A");

// s18: 문장6
addStep("p3", p3Sents[5].start, p3Sents[5].end,
  "마지막 문장이 전달하는 현재 상황으로 알맞은 것은 무엇인가요?",
  [
    "각국이 서로 다른 기준을 적용하고 있어 국제적 통일 규범이 아직 마련되지 않았다.",
    "모든 국가가 동일한 기준으로 인공지능 학습을 규제하고 있다.",
    "국제적 규범이 이미 완성되어 모든 분쟁이 해결되었다.",
    "각국은 인공지능 학습에 대한 법적 규제 자체를 포기하였다."
  ], "A");

// s20: 문단3 전체 중심내용
addStep("p3", 0, p3.length,
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "AI가 기존 저작물을 학습할 때 저작권 침해 여부를 두고 대립하는 견해가 있으며, 국제적 기준은 아직 통일되지 않았다.",
    "모든 국가가 인공지능의 저작물 학습을 공정 이용으로 인정하고 있다.",
    "인공지능 학습에 사용된 저작물의 원저작자는 경제적 피해를 입지 않는다.",
    "학습 데이터의 저작권 문제는 이미 완전히 해결되었다."
  ], "A");

// === 문단 4 정독 ===
// s21: 문장1
addStep("p4", p4Sents[0].start, p4Sents[0].end,
  "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  [
    "인공지능 창작물의 저작권 문제를 풀기 위해 여러 가지 대안이 검토되고 있다.",
    "인공지능 창작물의 저작권 문제는 더 이상 해결할 필요가 없다.",
    "저작권 문제는 기술 발전과 무관하게 자연스럽게 사라질 것이다.",
    "대안 마련 없이 현행법만으로 모든 문제를 해결할 수 있다."
  ], "A");

// s20: 문장2
addStep("p4", p4Sents[1].start, p4Sents[1].end,
  "둘째 문장이 제시하는 첫 번째 방안으로 알맞은 것은 무엇인가요?",
  [
    "인공지능의 기여 정도에 따라 저작권의 보호 범위를 다르게 정하는 방안이다.",
    "인공지능의 기여와 상관없이 모든 결과물에 동일한 저작권을 부여하는 방안이다.",
    "인공지능 결과물에 대한 저작권을 전면 폐지하는 방안이다.",
    "인공지능 사용을 금지하여 저작권 문제를 원천 차단하는 방안이다."
  ], "A");

// s21: 문장3
addStep("p4", p4Sents[2].start, p4Sents[2].end,
  "셋째 문장이 구체적으로 설명하는 내용으로 알맞은 것은 무엇인가요?",
  [
    "사람의 참여가 많을수록 기존 저작권법의 보호를 받고, AI 자율성이 높으면 보호가 제한된다.",
    "인공지능의 자율성이 높을수록 더 강한 저작권 보호를 받는다.",
    "사람의 관여 정도와 관계없이 동일한 보호가 적용된다.",
    "인공지능이 관여하면 어떤 경우에도 보호를 받을 수 없다."
  ], "A");

// s22: 문장4
addStep("p4", p4Sents[3].start, p4Sents[3].end,
  "넷째 문장이 제시하는 두 번째 대안으로 알맞은 것은 무엇인가요?",
  [
    "기존 저작권과 별도로 인공지능 결과물을 위한 새로운 권리 체계를 만들자는 제안이다.",
    "인공지능 결과물을 기존 저작권법에 완전히 포함시키자는 제안이다.",
    "인공지능 결과물에 대한 모든 권리를 폐지하자는 제안이다.",
    "기존 저작권법을 그대로 유지하며 아무런 변경을 하지 말자는 제안이다."
  ], "A");

// s23: 문장5
addStep("p4", p4Sents[4].start, p4Sents[4].end,
  "다섯째 문장이 설명하는 새로운 권리 체계의 장점으로 알맞은 것은 무엇인가요?",
  [
    "보호 기간이나 권리 내용을 기존과 다르게 설정하여 AI 시대에 맞는 유연한 보호가 가능하다.",
    "기존 저작권과 완전히 동일한 조건으로 보호하는 것이 가능하다.",
    "모든 인공지능 결과물이 영구적으로 보호받을 수 있다.",
    "새로운 권리 체계는 인공지능 결과물의 보호를 전면 금지한다."
  ], "A");

// s24: 문장6 (마지막)
addStep("p4", p4Sents[5].start, p4Sents[5].end,
  "마지막 문장이 강조하는 핵심으로 알맞은 것은 무엇인가요?",
  [
    "기술 발전에 발맞추어 창작자의 권리와 기술 혁신의 균형을 이루는 것이 중요하다.",
    "창작자의 권리를 무시하고 기술 혁신만 추구해야 한다.",
    "기술 혁신을 중단하고 기존 창작자의 권리만 지켜야 한다.",
    "저작권 문제는 기술과 무관하므로 논의할 필요가 없다."
  ], "A");

// s25: 문단4 전체 중심내용
addStep("p4", 0, p4.length,
  "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    "AI 창작물의 저작권 문제를 해결하기 위해 기여도 기반 보호와 새로운 권리 체계 등 다양한 대안이 제시되고 있다.",
    "인공지능 창작물에 대해서는 어떠한 보호도 필요하지 않다.",
    "기존 저작권법만으로 인공지능 시대의 모든 문제를 완벽하게 해결할 수 있다.",
    "인공지능 결과물의 저작권 문제는 논의할 가치가 없는 사소한 문제이다."
  ], "A");

// === 복기 카드 (정확히 8장) ===
const recall = {
  cards: [
    { id: "c1", text: "인공지능 기술이 발전하면서 AI가 만든 창작물의 저작권 문제가 새로운 쟁점으로 떠올랐다." },
    { id: "c2", text: "저작권은 인간이 사상이나 감정을 창작적으로 표현한 결과물에 부여되며, 독자적 사고와 판단이 반영되어야 한다." },
    { id: "c3", text: "현행법상 창작 주체는 사람으로 한정되어 AI가 독자적으로 만든 결과물에는 저작권이 없다." },
    { id: "c4", text: "다만 사람이 AI를 도구로 활용하며 실질적으로 관여한 경우에는 저작권이 인정될 수 있다." },
    { id: "c5", text: "AI가 기존 저작물을 학습할 때 원저작자의 허락 없이 작품이 사용되는 경우가 많아 저작권 침해 논란이 있다." },
    { id: "c6", text: "학습이 공정 이용인지, 별도 허락과 보상이 필요한지를 두고 입장이 대립하며 국제 규범은 미정립 상태이다." },
    { id: "c7", text: "대안으로 AI 기여도에 따라 보호 범위를 달리하거나, 기존 저작권과 별도의 새 권리 체계를 마련하는 방안이 논의된다." },
    { id: "c8", text: "결국 기술 발전 속도에 맞추어 창작자의 권리와 기술 혁신 사이의 균형을 찾는 것이 핵심이다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// === 확인 문항 (질문형, 8문항) ===
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "인간이 사상이나 감정을 창작적으로 표현한 결과물에 부여되는 권리를 무엇이라 하나요?",
      answerText: "저작권",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "저작권이란")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "저작권이 인정되려면 작품에 무엇이 반영되어야 하나요?",
      answerText: "창작자의 독자적인 사고와 판단",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "창작자의 독자적인 사고와 판단")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "현행 저작권법은 창작의 주체를 누구로 한정하고 있나요?",
      answerText: "자연인, 즉 사람",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "자연인, 즉 사람")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "인공지능이 스스로 지니지 않아 창작 행위의 핵심 요건이 결여된 것은 무엇인가요?",
      answerText: "의도나 감정",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "의도나 감정")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "일부에서는 AI 학습 과정이 무엇에 해당한다고 주장하나요?",
      answerText: "공정 이용",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "공정 이용")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "학습 데이터의 저작권 침해에 대해 국제적으로 통일된 규범이 마련되었나요?",
      answerText: "아직 마련되지 않은 상태",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "아직 마련되지 않은 상태")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "두 번째 대안에서 기존 저작권과 별도로 마련하자고 제안되는 것은 무엇인가요?",
      answerText: "새로운 권리 체계",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "새로운 권리 체계")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q8",
      prompt: "이 글에서 인공지능 저작권 문제의 핵심은 무엇과 무엇 사이의 균형을 찾는 것이라 하나요?",
      answerText: "창작자의 권리와 기술 혁신",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "창작자의 권리와 기술 혁신 사이의 균형")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

// JSON 조립
const content = {
  contentId: "dr-w1-005",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 5 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "WITTGENSTEIN_1",
  schoolGradeRange: { min: 9, max: 10 },
  area: "READING",
  subArea: "NONFICTION",
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

// answerRanges 검증
console.log("\n=== answerRanges 검증 ===");
for (const q of confirm.questions) {
  for (const r of q.answerRanges) {
    const para = paragraphs.find(p => p.id === r.paragraphId);
    const extracted = para.text.substring(r.start, r.end);
    console.log(`${q.id}: [${r.start},${r.end}] "${extracted}"`);
  }
}

// static 파일 저장
const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1', '005.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\nstatic 파일 저장: ${staticPath}`);

// 배치 아이템 출력
const batchItem = {
  content_type: "DAILY_READING",
  level_id: "WITTGENSTEIN_1",
  area: "READING",
  sub_area: "NONFICTION",
  day_index: 5,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};

const batchItemPath = path.join(__dirname, 'day5-w1-batch-item.json');
fs.writeFileSync(batchItemPath, JSON.stringify(batchItem, null, 2), 'utf8');
console.log(`배치 아이템 저장: ${batchItemPath}`);

// 배치 파일 업데이트
const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-wittgenstein1.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[4] = batchItem; // day_index 5 → index 4
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log(`배치 파일 업데이트 완료 (items[4])`);
