// 비트겐슈타인1 Day 9 비문학(NONFICTION) - 수면과 기억 (고1~고2, 1400±50자)
const fs = require('fs');
const path = require('path');

const p1 = "사람은 하루의 약 삼분의 일을 잠을 자며 보낸다. 이는 80년을 사는 사람이라면 약 27년을 수면 상태로 보내는 셈이다. 수면은 단순히 피로를 해소하는 휴식의 시간으로만 여겨지기 쉽지만, 실제로는 뇌가 매우 활발하게 활동하는 시간이다. 특히 수면은 기억의 형성과 강화에 핵심적인 역할을 수행한다. 우리가 낮 동안 경험하고 학습한 정보는 처음에는 뇌의 해마라는 부위에 단기 기억으로 임시 저장된다. 이 단기 기억이 오래 지속되는 장기 기억으로 전환되려면 수면 중에 이루어지는 기억 공고화라는 과정을 반드시 거쳐야 한다. 기억 공고화란 해마에 저장된 정보가 대뇌 피질로 옮겨져 안정적으로 보관되는 과정을 말한다.";
const p2 = "수면은 크게 비렘수면과 렘수면으로 나뉘며, 하룻밤 동안 이 두 단계가 약 90분 주기로 번갈아 반복되는 구조로 이루어져 있다. 비렘수면은 수면의 초기에 주로 나타나며 뇌파가 현저히 느려지는 깊은 잠의 단계이다. 이 단계에서는 해마에 임시 저장된 사실적 지식이나 학습 내용이 대뇌 피질로 전달되어 장기 기억으로 공고화된다. 렘수면은 빠른 눈 운동이 나타나는 단계로, 이때는 주로 꿈을 꾸게 된다. 렘수면에서는 정서적 기억이나 절차적 기억, 즉 감정과 관련된 경험이나 자전거 타기처럼 몸으로 익힌 기술의 기억이 강화된다. 따라서 비렘수면과 렘수면이 균형 있게 이루어져야 다양한 유형의 기억이 고르게 강화될 수 있다.";
const p3 = "수면이 부족하면 기억력에 매우 심각한 영향이 나타난다. 수면 시간이 줄어들면 기억 공고화가 충분히 이루어지지 않아 학습한 내용이 장기 기억으로 저장되지 못하고 쉽게 잊혀진다. 또한 수면 부족은 해마의 기능을 저하시켜 새로운 정보를 받아들이는 능력 자체를 떨어뜨린다. 이는 잠을 적게 자고 밤새 공부하는 것이 오히려 학습 효율을 크게 낮추는 역효과를 가져올 수 있음을 의미한다. 실제로 여러 실험에서 충분히 잠을 잔 집단이 수면이 부족한 집단보다 기억 테스트에서 현저히 높은 성적을 기록한 것으로 나타났다. 이러한 연구 결과는 효과적인 학습을 위해서는 충분한 수면이 반드시 확보되어야 한다는 점을 분명히 뒷받침한다.";
const p4 = "수면의 질을 높이기 위한 올바른 생활 습관도 주목할 필요가 있다. 먼저, 매일 같은 시간에 잠자리에 들고 일어나는 규칙적인 수면 패턴을 유지하는 것이 매우 중요하다. 불규칙한 수면 일정은 체내 생체 시계를 교란하여 깊은 수면에 도달하기 어렵게 만든다. 또한 잠들기 전에 스마트폰이나 컴퓨터 화면에서 나오는 청색광에 노출되면 수면 호르몬인 멜라토닌의 분비가 억제되어 잠들기 어려워진다. 카페인이 든 음료를 오후 늦게 마시는 것도 각성 효과가 오래 지속되어 수면의 질을 떨어뜨리는 주요 요인이다. 이처럼 수면의 질을 높이는 습관을 꾸준히 갖추는 것은 기억력 향상뿐 아니라 전반적인 건강 유지에도 크게 기여한다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
  { id: "p4", text: p4 }
];

const totalLen = p1.length + p2.length + p3.length + p4.length;
console.log("=== 지문 길이 검증 ===");
console.log(`p1: ${p1.length}자, p2: ${p2.length}자, p3: ${p3.length}자, p4: ${p4.length}자`);
console.log(`합계: ${totalLen}자`);
if (totalLen < 1350 || totalLen > 1450) console.error(`경고: 목표 범위(1400±50) 벗어남!`);

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
  if (start < text.length) sentences.push({ start, end: text.length, text: text.substring(start) });
  return sentences;
}

function findRange(pid, searchText) {
  const para = paragraphs.find(p => p.id === pid);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}" not found in ${pid}`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

const p1S = findSentences(p1), p2S = findSentences(p2), p3S = findSentences(p3), p4S = findSentences(p4);
for (const p of paragraphs) {
  const s = findSentences(p.text);
  console.log(`\n${p.id}: ${s.length}문장`);
  s.forEach((x,i) => console.log(`  [${i}] ${x.start}-${x.end}: "${x.text.substring(0,40)}..."`));
}

const timeline = [];
let sn = 1;
function addStep(pId, start, end, prompt, choices, answerId) {
  timeline.push({
    stepId: `s${sn++}`,
    highlight: { ranges: [{ paragraphId: pId, start, end }] },
    question: {
      prompt, choices: choices.map((t,i) => ({ id: ["A","B","C","D"][i], text: t })),
      answerId, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

// === p1 정독 (7문장) ===
addStep("p1", p1S[0].start, p1S[0].end,
  "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  ["사람은 하루의 약 3분의 1을 수면으로 보낸다.", "사람은 하루 중 대부분을 깨어 있는 상태로 보낸다.", "수면 시간은 하루의 4분의 1에 불과하다.", "수면은 사람의 일상에서 차지하는 비중이 매우 작다."], "A");

addStep("p1", p1S[1].start, p1S[1].end,
  "둘째 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  ["80년을 살면 약 27년을 수면 상태로 보내게 된다.", "사람의 수면 시간은 나이가 들면 점점 줄어든다.", "80년 동안 잠을 자는 시간은 약 10년이다.", "수면 시간은 전체 인생에서 무시할 수 있는 수준이다."], "A");

addStep("p1", p1S[2].start, p1S[2].end,
  "셋째 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  ["수면은 단순 휴식이 아니라 뇌가 매우 활발하게 활동하는 시간이다.", "수면 중에는 뇌의 활동이 완전히 멈춘다.", "수면은 피로 해소만을 위한 시간이다.", "잠을 자는 동안 뇌에는 아무런 변화가 일어나지 않는다."], "A");

addStep("p1", p1S[3].start, p1S[3].end,
  "넷째 문장이 강조하는 수면의 역할로 알맞은 것은 무엇인가요?",
  ["기억의 형성과 강화에 핵심적인 기능을 수행한다.", "근육을 발달시키는 데 핵심적 역할을 한다.", "소화 기능을 촉진하는 역할을 한다.", "체온을 조절하는 데에만 관여한다."], "A");

addStep("p1", p1S[4].start, p1S[4].end,
  "다섯째 문장에서 낮 동안 학습한 정보가 처음 저장되는 곳으로 알맞은 것은 무엇인가요?",
  ["뇌의 해마라는 부위에 단기 기억으로 임시 저장된다.", "대뇌 피질에 곧바로 장기 기억으로 저장된다.", "소뇌에 운동 기억으로 저장된다.", "뇌간에 무의식적으로 저장된다."], "A");

addStep("p1", p1S[5].start, p1S[5].end,
  "여섯째 문장이 설명하는 '기억 공고화'로 알맞은 것은 무엇인가요?",
  ["단기 기억이 장기 기억으로 바뀌기 위해 수면 중에 거치는 과정이다.", "단기 기억이 수면 중에 모두 삭제되는 과정이다.", "장기 기억이 단기 기억으로 되돌아가는 과정이다.", "기억과 수면은 서로 무관한 별개의 과정이다."], "A");

addStep("p1", p1S[6].start, p1S[6].end,
  "마지막 문장에서 기억 공고화의 구체적 과정으로 알맞은 것은 무엇인가요?",
  ["해마에 저장된 정보가 대뇌 피질로 옮겨져 안정적으로 보관되는 것이다.", "대뇌 피질의 정보가 해마로 이동하는 것이다.", "기억이 뇌 밖으로 빠져나가는 것이다.", "해마의 기능이 완전히 정지하는 것이다."], "A");

addStep("p1", 0, p1.length,
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["수면은 뇌가 활발히 활동하며 기억 공고화를 통해 단기 기억을 장기 기억으로 전환하는 중요한 시간이다.", "수면은 단순히 몸의 피로를 푸는 시간일 뿐 뇌와는 무관하다.", "기억은 수면과 관계없이 낮 동안에만 형성된다.", "해마는 수면 중에 기능을 멈추고 쉬는 부위이다."], "A");

// === p2 정독 (6문장) ===
addStep("p2", p2S[0].start, p2S[0].end,
  "첫 문장이 전달하는 수면의 구조로 알맞은 것은 무엇인가요?",
  ["비렘수면과 렘수면이 번갈아 반복되는 구조이다.", "수면은 한 가지 단계만으로 이루어져 있다.", "렘수면만 반복되는 구조이다.", "비렘수면 후 바로 깨어나는 구조이다."], "A");

addStep("p2", p2S[1].start, p2S[1].end,
  "둘째 문장이 설명하는 비렘수면의 특징으로 알맞은 것은 무엇인가요?",
  ["수면 초기에 나타나며 뇌파가 느려지는 깊은 잠의 단계이다.", "수면 후반에 나타나며 뇌파가 빨라지는 얕은 잠의 단계이다.", "꿈을 주로 꾸는 단계이다.", "빠른 눈 운동이 나타나는 단계이다."], "A");

addStep("p2", p2S[2].start, p2S[2].end,
  "셋째 문장에서 비렘수면 중에 강화되는 기억의 유형으로 알맞은 것은 무엇인가요?",
  ["사실적 지식이나 학습 내용이 장기 기억으로 공고화된다.", "감정과 관련된 경험만 강화된다.", "자전거 타기처럼 몸으로 익힌 기술만 강화된다.", "어떤 기억도 강화되지 않는다."], "A");

addStep("p2", p2S[3].start, p2S[3].end,
  "넷째 문장이 설명하는 렘수면의 특징으로 알맞은 것은 무엇인가요?",
  ["빠른 눈 운동이 나타나며 주로 꿈을 꾸는 단계이다.", "뇌파가 매우 느려지고 꿈을 꾸지 않는 단계이다.", "수면의 가장 초기 단계이다.", "해마의 기능이 완전히 정지하는 단계이다."], "A");

addStep("p2", p2S[4].start, p2S[4].end,
  "다섯째 문장에서 렘수면 중에 강화되는 기억의 유형으로 알맞은 것은 무엇인가요?",
  ["감정과 관련된 경험이나 몸으로 익힌 기술의 기억이 강화된다.", "사실적 지식만 강화된다.", "단기 기억이 모두 삭제된다.", "어떤 기억도 영향을 받지 않는다."], "A");

addStep("p2", p2S[5].start, p2S[5].end,
  "마지막 문장이 강조하는 내용으로 알맞은 것은 무엇인가요?",
  ["비렘수면과 렘수면이 균형 있게 이루어져야 다양한 기억이 고르게 강화된다.", "비렘수면만 충분하면 모든 기억이 강화된다.", "렘수면만 있으면 학습 효과가 극대화된다.", "수면의 단계 구분은 기억과 무관하다."], "A");

addStep("p2", 0, p2.length,
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["수면은 비렘수면과 렘수면으로 나뉘며, 각 단계에서 서로 다른 유형의 기억이 강화된다.", "수면의 모든 단계에서 동일한 기억만 강화된다.", "비렘수면은 존재하지 않는 가설적 개념이다.", "렘수면에서는 기억이 오히려 약화된다."], "A");

// === p3 정독 (6문장) ===
addStep("p3", p3S[0].start, p3S[0].end,
  "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  ["수면이 부족하면 기억력에 심각한 영향이 나타난다.", "수면 부족은 기억력에 아무 영향을 주지 않는다.", "수면이 부족해야 기억력이 오히려 향상된다.", "수면 시간과 기억력은 반비례 관계이다."], "A");

addStep("p3", p3S[1].start, p3S[1].end,
  "둘째 문장이 설명하는 수면 부족의 영향으로 알맞은 것은 무엇인가요?",
  ["기억 공고화가 충분히 이루어지지 않아 학습 내용이 쉽게 잊혀진다.", "기억 공고화가 더 빨라져 학습 효과가 높아진다.", "수면 시간이 줄면 장기 기억이 강해진다.", "기억 공고화와 수면은 아무 관련이 없다."], "A");

addStep("p3", p3S[2].start, p3S[2].end,
  "셋째 문장에서 수면 부족이 해마에 미치는 영향으로 알맞은 것은 무엇인가요?",
  ["해마의 기능이 저하되어 새로운 정보를 받아들이는 능력이 떨어진다.", "해마의 기능이 향상되어 정보 수용 능력이 높아진다.", "해마와 수면은 관련이 없다.", "해마는 수면 부족에 영향을 받지 않는 부위이다."], "A");

addStep("p3", p3S[3].start, p3S[3].end,
  "넷째 문장이 의미하는 바로 알맞은 것은 무엇인가요?",
  ["잠을 줄이고 공부하면 오히려 학습 효율이 떨어질 수 있다.", "잠을 줄이면 공부 시간이 늘어 학습 효율이 올라간다.", "수면 시간과 학습 효율은 아무 관계가 없다.", "밤새 공부하는 것이 가장 효과적인 학습 방법이다."], "A");

addStep("p3", p3S[4].start, p3S[4].end,
  "다섯째 문장이 소개하는 실험 결과로 알맞은 것은 무엇인가요?",
  ["충분히 잠을 잔 집단이 수면 부족 집단보다 기억 테스트 성적이 훨씬 높았다.", "수면 부족 집단이 더 높은 성적을 보였다.", "두 집단의 성적 차이가 없었다.", "실험이 진행되지 않았다."], "A");

addStep("p3", p3S[5].start, p3S[5].end,
  "마지막 문장이 강조하는 핵심으로 알맞은 것은 무엇인가요?",
  ["효과적인 학습을 위해 수면이 반드시 확보되어야 한다.", "학습과 수면은 별개의 문제이므로 따로 관리해야 한다.", "수면을 줄이는 것이 학습의 핵심 전략이다.", "기억력은 수면이 아닌 식습관에 의해서만 결정된다."], "A");

addStep("p3", 0, p3.length,
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["수면 부족은 기억 공고화와 정보 수용 능력을 떨어뜨려 학습 효율을 낮추므로 충분한 수면이 필요하다.", "수면을 줄이면 공부 시간이 늘어 성적이 향상된다.", "수면 부족은 건강에만 문제가 있을 뿐 기억과는 무관하다.", "실험 결과 수면 시간은 기억에 영향을 주지 않았다."], "A");

// === p4 정독 (6문장) ===
addStep("p4", p4S[0].start, p4S[0].end,
  "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  ["수면의 질을 높이기 위한 생활 습관에 관심을 가질 필요가 있다.", "수면의 질은 생활 습관과 관계가 없다.", "수면의 질을 높이는 방법은 존재하지 않는다.", "생활 습관은 수면에 아무 영향을 주지 않는다."], "A");

addStep("p4", p4S[1].start, p4S[2].end,
  "둘째, 셋째 문장이 소개하는 첫 번째 방법으로 알맞은 것은 무엇인가요?",
  ["매일 같은 시간에 자고 일어나는 규칙적인 수면 패턴을 유지하는 것이다.", "매일 다른 시간에 자고 일어나는 것이 좋다.", "잠자는 시간은 수면의 질과 관계가 없다.", "불규칙한 수면이 오히려 깊은 잠에 도움이 된다."], "A");

addStep("p4", p4S[3].start, p4S[3].end,
  "넷째 문장이 지적하는 수면 방해 요인으로 알맞은 것은 무엇인가요?",
  ["자기 전 스마트폰 등의 청색광이 수면 호르몬 멜라토닌 분비를 억제한다.", "청색광은 수면에 도움을 준다.", "스마트폰 사용은 수면의 질을 높인다.", "멜라토닌은 청색광에 의해 증가한다."], "A");

addStep("p4", p4S[4].start, p4S[4].end,
  "다섯째 문장이 지적하는 또 다른 수면 방해 요인으로 알맞은 것은 무엇인가요?",
  ["오후 늦게 카페인이 든 음료를 마시는 것이 수면의 질을 떨어뜨린다.", "카페인은 수면의 질에 영향을 주지 않는다.", "카페인을 많이 마실수록 잠이 잘 온다.", "오후 늦은 카페인 섭취가 수면을 도와준다."], "A");

addStep("p4", p4S[5].start, p4S[5].end,
  "마지막 문장이 강조하는 핵심으로 알맞은 것은 무엇인가요?",
  ["수면의 질을 높이는 습관은 기억력뿐 아니라 전반적 건강 유지에도 크게 기여한다.", "수면 습관은 기억력에만 영향을 줄 뿐 건강과는 무관하다.", "수면의 질을 높이는 것은 불가능하다.", "건강 유지와 수면은 별개의 문제이다."], "A");

addStep("p4", 0, p4.length,
  "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["규칙적 수면, 청색광 회피, 카페인 절제 등 수면의 질을 높이는 생활 습관이 기억력과 건강에 도움이 된다.", "수면의 질은 생활 습관으로 바꿀 수 없다.", "카페인과 청색광은 수면에 유익하다.", "수면의 질을 높이는 것은 기억과 무관하다."], "A");

// === 복기 카드 (8장) ===
const recall = {
  cards: [
    { id: "c1", text: "수면 중 뇌는 활발히 활동하며, 특히 기억의 형성과 강화에 핵심적인 역할을 수행한다." },
    { id: "c2", text: "낮에 학습한 정보는 해마에 단기 저장된 뒤 수면 중 기억 공고화를 통해 대뇌 피질의 장기 기억으로 전환된다." },
    { id: "c3", text: "비렘수면에서는 사실적 지식이, 렘수면에서는 감정적 경험이나 몸으로 익힌 기술의 기억이 강화된다." },
    { id: "c4", text: "두 수면 단계가 균형 있게 이루어져야 다양한 유형의 기억이 고르게 강화될 수 있다." },
    { id: "c5", text: "수면 부족은 기억 공고화를 방해하고 해마의 기능을 떨어뜨려 학습 효율을 낮춘다." },
    { id: "c6", text: "실험에서 충분히 잠을 잔 집단이 수면 부족 집단보다 기억 테스트 성적이 높았다." },
    { id: "c7", text: "규칙적 수면 패턴 유지, 잠들기 전 청색광 회피, 오후 카페인 절제가 수면의 질을 높인다." },
    { id: "c8", text: "수면의 질을 높이는 습관은 기억력 향상뿐 아니라 전반적인 건강 유지에도 크게 기여한다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// === 확인 문항 (8문항) ===
const confirm = {
  questions: [
    {
      id: "q1", prompt: "낮에 경험하고 학습한 정보가 처음 단기 기억으로 저장되는 뇌의 부위는 어디인가요?",
      answerText: "해마", answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "해마라는 부위")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q2", prompt: "단기 기억이 장기 기억으로 전환되기 위해 수면 중 거쳐야 하는 과정을 무엇이라 하나요?",
      answerText: "기억 공고화", answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "기억 공고화라는 과정")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q3", prompt: "비렘수면에서 주로 공고화되는 기억의 유형은 무엇인가요?",
      answerText: "사실적 지식이나 학습 내용", answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "사실적 지식이나 학습 내용")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q4", prompt: "렘수면에서 빠르게 움직이는 신체 부위는 어디인가요?",
      answerText: "눈", answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "빠른 눈 운동")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q5", prompt: "수면 부족이 해마에 미치는 영향은 무엇인가요?",
      answerText: "기능을 저하시켜 새로운 정보를 받아들이는 능력이 떨어진다",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "해마의 기능을 저하시켜")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q6", prompt: "실험에서 기억 테스트 성적이 더 높았던 집단은 어떤 집단인가요?",
      answerText: "충분히 잠을 잔 집단", answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "충분히 잠을 잔 집단")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q7", prompt: "잠들기 전 스마트폰 등에서 나오는 빛이 분비를 억제하는 수면 호르몬은 무엇인가요?",
      answerText: "멜라토닌", answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "멜라토닌")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q8", prompt: "불규칙한 수면 일정이 교란하는 것은 무엇인가요?",
      answerText: "체내 생체 시계", answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "체내 생체 시계")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    }
  ]
};

const content = {
  contentId: "dr-w1-009", contentType: "DAILY_READING",
  version: 1, status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 9 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "WITTGENSTEIN_1", schoolGradeRange: { min: 9, max: 10 },
  area: "READING", subArea: "NONFICTION",
  competencies: ["READING"], tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300, assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs: paragraphs.map(p => ({ id: p.id, text: p.text })) },
    intensive: { timeline }, recall, confirm
  }
};

console.log("\n=== 최종 검증 ===");
console.log(`정독: ${timeline.length}, 복기: ${recall.cards.length}, 확인: ${confirm.questions.length}`);
console.log("\n=== answerRanges 검증 ===");
for (const q of confirm.questions) {
  for (const r of q.answerRanges) {
    const para = paragraphs.find(p => p.id === r.paragraphId);
    console.log(`${q.id}: [${r.start},${r.end}] "${para.text.substring(r.start, r.end)}"`);
  }
}

const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1', '009.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\nstatic: ${staticPath}`);

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-wittgenstein1.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[8] = {
  content_type: "DAILY_READING", level_id: "WITTGENSTEIN_1",
  area: "READING", sub_area: "NONFICTION", day_index: 9,
  module_key: "reading_training", schema_version: "1.0", content
};
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log(`배치 업데이트 완료 (items[8])`);
