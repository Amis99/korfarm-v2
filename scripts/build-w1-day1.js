// 비트겐슈타인1 Day 1 비문학 - 데이터 이동권 주제 (기출 참조 재작성, 중3~고1 수준)
// 지문 작성 후 ranges 계산 및 JSON 생성

const p1 = "우리가 인터넷 쇼핑몰에서 물건을 사거나 교통 카드를 이용할 때마다 다양한 기록이 남는다. 이처럼 개인의 활동에서 발생하는 기록을 데이터라 하며, 그 데이터의 주인인 개인을 정보 주체라고 부른다. 데이터는 눈에 보이는 형체가 없고 복제와 재사용이 쉽다는 특성을 지닌다. 이러한 데이터가 대량으로 모이고 처리되면 빅 데이터가 되는데, 이를 수집하고 관리하는 기업 등을 빅 데이터 보유자라 한다. 빅 데이터는 고객의 소비 패턴 분석이나 맞춤형 서비스 개발 등 특정 목적에 활용될 수 있다는 점에서 경제적 가치를 지니므로, 데이터를 누가 소유해야 하는지에 대한 논의가 활발하게 이루어져 왔다.";
const p2 = "데이터 소유권의 주체를 둘러싼 논의에는 크게 두 가지 입장이 있다. 첫째, 빅 데이터 보유자에게 소유권을 부여해야 한다는 입장이다. 이 입장은 기업에 소유권을 주면 데이터의 생산과 유통이 활발해져 관련 산업이 성장할 수 있다고 주장한다. 둘째, 정보 주체인 개인에게 소유권을 인정해야 한다는 입장이다. 이 입장은 데이터를 만들어 낸 주체가 개인인 만큼, 기업에만 이익이 집중되는 것은 공정하지 않으며 개인에게도 합당한 보상이 돌아가야 한다고 본다. 예를 들어, 소비자의 구매 기록으로 기업이 큰 수익을 올렸다면 그 소비자에게도 일정한 대가를 지급해야 한다는 것이다. 이처럼 양쪽 입장 모두 나름의 근거를 갖추고 있어, 어느 한쪽의 주장만으로 문제를 해결하기는 어렵다.";
const p3 = "최근에는 소유권 논쟁을 넘어 데이터 이동권이라는 새로운 개념이 주목받고 있다. 데이터 이동권이란 정보 주체가 자신의 데이터를 보유한 기업에게 해당 데이터를 본인이나 지정한 제삼자에게 무상으로 전송하도록 요청할 수 있는 권리이다. 우리나라도 이 권리를 법으로 명문화하여 개인 정보에 대한 자기 결정권을 강화하였다. 다만, 기업이 원래 데이터를 분석하고 가공하여 새롭게 만들어 낸 정보까지 이동 대상에 포함되는 것은 아니다. 데이터 이동권의 도입으로 개인은 쇼핑 이력이나 금융 거래 내역 등 자신의 행동과 관련된 데이터를 스스로 관리하고 통제할 수 있는 범위가 넓어졌다.";
const p4 = "데이터 이동권은 기업에도 긍정적인 효과를 가져온다. 기업이 직접 데이터를 수집하는 대신 전송받은 데이터를 활용하면 데이터를 만드는 데 드는 비용을 줄일 수 있다. 또한 법적으로 보장된 절차에 따라 데이터가 이동하므로 기업 간 분쟁이 줄어들어 거래 비용도 절감된다. 이러한 비용 절감은 궁극적으로 소비자에게 더 나은 서비스로 돌아올 수 있다. 그러나 우려되는 점도 있다. 보안 수준이 높고 혜택이 많은 대형 기업으로 데이터가 쏠리면, 신규 기업은 충분한 데이터를 확보하기 어려워진다. 이 경우 시장의 경쟁이 약화되고 특정 기업의 독점이 강화될 수 있다. 따라서 데이터 이동권이 본래 취지대로 작동하려면 개인의 권리 보장과 기업 간 공정한 경쟁이 함께 이루어지도록 제도를 설계하는 것이 중요하다.";

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

// 문장 경계 자동 탐지
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

// 각 문단 문장 분석
for (const p of paragraphs) {
  const sents = findSentences(p.text);
  console.log(`\n=== ${p.id} 문장 분석 (${sents.length}개) ===`);
  sents.forEach((s, i) => {
    console.log(`  [${i}] start=${s.start}, end=${s.end}: "${s.text.substring(0, 50)}..."`);
  });
}

const p1Sents = findSentences(p1);
const p2Sents = findSentences(p2);
const p3Sents = findSentences(p3);
const p4Sents = findSentences(p4);

// 정독 타임라인 생성
const timeline = [];
let stepNum = 1;

function addStep(pId, start, end, prompt, choices, answerId) {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [{ paragraphId: pId, start, end }] },
    question: {
      prompt,
      choices,
      answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
}

// ===== p1 문장별 =====
addStep("p1", p1Sents[0].start, p1Sents[0].end,
  "첫 문장이 설명하는 내용으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "인터넷 쇼핑이나 교통 카드 이용 시 다양한 기록이 남는다는 것을 설명한다." },
    { id: "B", text: "인터넷 쇼핑을 하면 교통 카드가 자동으로 발급된다는 것을 설명한다." },
    { id: "C", text: "물건을 사면 데이터가 삭제되어 기록이 남지 않는다고 설명한다." },
    { id: "D", text: "교통 카드 기록은 남지만 쇼핑 기록은 남지 않는다고 설명한다." }
  ], "A");

addStep("p1", p1Sents[1].start, p1Sents[1].end,
  "둘째 문장에서 '정보 주체'의 의미로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "데이터를 수집하고 관리하는 기업을 가리킨다." },
    { id: "B", text: "개인의 활동에서 발생하는 기록의 주인인 개인을 가리킨다." },
    { id: "C", text: "빅 데이터를 분석하는 연구원을 가리킨다." },
    { id: "D", text: "데이터를 삭제할 수 있는 정부 기관을 가리킨다." }
  ], "B");

addStep("p1", p1Sents[2].start, p1Sents[2].end,
  "셋째 문장이 설명하는 데이터의 특성으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "눈에 보이는 형체가 없고 복제와 재사용이 쉽다는 특성을 지닌다." },
    { id: "B", text: "눈에 보이는 형태가 있어 복제가 불가능하다는 특성을 지닌다." },
    { id: "C", text: "한 번 생성되면 다시 사용할 수 없다는 특성을 지닌다." },
    { id: "D", text: "물리적 형태가 있어 운반이 어렵다는 특성을 지닌다." }
  ], "A");

addStep("p1", p1Sents[3].start, p1Sents[3].end,
  "넷째 문장이 말하는 '빅 데이터 보유자'로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "대량의 데이터를 수집하고 관리하는 기업 등을 말한다." },
    { id: "B", text: "개인 정보를 삭제하는 역할을 하는 기관을 말한다." },
    { id: "C", text: "데이터를 만들어 낸 개인을 말한다." },
    { id: "D", text: "인터넷을 사용하지 않는 사람들을 말한다." }
  ], "A");

addStep("p1", p1Sents[4].start, p1Sents[4].end,
  "마지막 문장이 말하는 논의의 핵심으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "빅 데이터의 경제적 가치 때문에 데이터 소유 주체에 대한 논의가 활발해졌다." },
    { id: "B", text: "빅 데이터는 경제적 가치가 없어 소유 논의가 필요하지 않다." },
    { id: "C", text: "데이터는 누구도 소유할 수 없으므로 논의 자체가 무의미하다." },
    { id: "D", text: "데이터의 경제적 가치는 줄어들고 있어 논의가 축소되고 있다." }
  ], "A");

// p1 문단 중심내용
addStep("p1", 0, p1.length,
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "개인 활동에서 발생하는 데이터는 경제적 가치를 지니며, 그 소유 주체에 대한 논의가 활발하다." },
    { id: "B", text: "데이터는 형체가 없으므로 누구의 소유도 아니라는 결론이 내려졌다." },
    { id: "C", text: "빅 데이터 보유자가 모든 데이터를 소유하는 것이 당연하다." },
    { id: "D", text: "교통 카드 이용 기록만이 경제적 가치를 지니는 데이터에 해당한다." }
  ], "A");

// ===== p2 문장별 =====
addStep("p2", p2Sents[0].start, p2Sents[0].end,
  "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "데이터 소유권의 주체를 둘러싸고 크게 두 가지 입장이 존재한다." },
    { id: "B", text: "데이터 소유권은 이미 한 가지 입장으로 합의가 이루어졌다." },
    { id: "C", text: "데이터 소유권에 대한 논의는 세 가지 이상의 입장으로 나뉜다." },
    { id: "D", text: "데이터 소유권 논의는 최근에 시작된 것이 아니라 오래전에 끝났다." }
  ], "A");

addStep("p2", p2Sents[1].start, p2Sents[1].end,
  "둘째 문장에서 첫 번째 입장이 주장하는 바로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "빅 데이터 보유자인 기업에게 소유권을 부여해야 한다는 것이다." },
    { id: "B", text: "정보 주체인 개인에게 소유권을 부여해야 한다는 것이다." },
    { id: "C", text: "정부가 모든 데이터의 소유권을 가져야 한다는 것이다." },
    { id: "D", text: "데이터의 소유권은 인정하지 말아야 한다는 것이다." }
  ], "A");

addStep("p2", p2Sents[2].start, p2Sents[2].end,
  "셋째 문장에서 기업에 소유권을 주면 기대되는 효과로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "데이터의 생산과 유통이 활발해져 관련 산업이 성장할 수 있다." },
    { id: "B", text: "개인의 데이터 보호가 강화되어 프라이버시가 지켜진다." },
    { id: "C", text: "기업 간 경쟁이 줄어들어 시장이 안정된다." },
    { id: "D", text: "데이터의 복제가 불가능해져 보안이 강화된다." }
  ], "A");

addStep("p2", p2Sents[3].start, p2Sents[3].end,
  "넷째 문장이 소개하는 두 번째 입장의 핵심으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "개인에게 데이터 소유권을 인정해야 한다는 것이다." },
    { id: "B", text: "기업이 데이터를 독점하는 것이 바람직하다는 것이다." },
    { id: "C", text: "데이터는 소유할 수 없는 공공재라는 것이다." },
    { id: "D", text: "개인은 데이터에 관심을 가질 필요가 없다는 것이다." }
  ], "A");

addStep("p2", p2Sents[4].start, p2Sents[4].end,
  "다섯째 문장이 말하는 두 번째 입장의 근거로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "데이터를 만들어 낸 주체가 개인이므로 기업에만 이익이 집중되는 것은 공정하지 않다." },
    { id: "B", text: "기업이 데이터를 만들었으므로 개인에게 보상할 의무가 없다." },
    { id: "C", text: "개인은 데이터를 만들지 않으므로 보상을 받을 자격이 없다." },
    { id: "D", text: "기업과 개인 모두 데이터에 대한 권리가 없다고 본다." }
  ], "A");

addStep("p2", p2Sents[5].start, p2Sents[5].end,
  "여섯째 문장이 제시하는 구체적 사례로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "소비자의 구매 기록으로 기업이 수익을 올리면 소비자에게도 대가를 지급해야 한다는 것이다." },
    { id: "B", text: "기업이 수익을 올리면 정부에만 세금을 내면 된다는 것이다." },
    { id: "C", text: "소비자의 구매 기록은 기업의 소유이므로 대가 지급이 불필요하다는 것이다." },
    { id: "D", text: "기업이 수익을 올리지 못하면 소비자가 보상해야 한다는 것이다." }
  ], "A");

addStep("p2", p2Sents[6].start, p2Sents[6].end,
  "마지막 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "양쪽 입장 모두 근거를 갖추고 있어 한쪽만으로는 문제를 해결하기 어렵다." },
    { id: "B", text: "첫 번째 입장의 근거가 더 강력하여 결론이 이미 도출되었다." },
    { id: "C", text: "두 번째 입장이 완전히 옳으므로 논의가 종결되었다." },
    { id: "D", text: "양쪽 모두 근거가 없어 논의 자체가 무의미하다." }
  ], "A");

// p2 문단 중심내용
addStep("p2", 0, p2.length,
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "데이터 소유권을 기업에 줄지 개인에게 줄지에 대해 서로 다른 두 입장이 대립하고 있다." },
    { id: "B", text: "데이터 소유권은 반드시 기업에 주어야 산업이 발전한다." },
    { id: "C", text: "데이터 소유권은 개인에게만 있어야 공정한 사회가 된다." },
    { id: "D", text: "데이터 소유권 논의는 이미 완전히 해결되어 더 이상 문제가 아니다." }
  ], "A");

// ===== p3 문장별 =====
addStep("p3", p3Sents[0].start, p3Sents[0].end,
  "첫 문장이 소개하는 새로운 개념으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "소유권 논쟁을 넘어 데이터 이동권이라는 개념이 주목받고 있다." },
    { id: "B", text: "소유권 논쟁이 완전히 해결되어 새로운 논의가 필요 없다." },
    { id: "C", text: "데이터 삭제권이라는 개념이 새로 등장하였다." },
    { id: "D", text: "데이터의 소유권을 포기해야 한다는 주장이 나왔다." }
  ], "A");

addStep("p3", p3Sents[1].start, p3Sents[1].end,
  "둘째 문장에서 데이터 이동권의 정의로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "정보 주체가 자신의 데이터를 본인이나 제삼자에게 무상으로 전송하도록 요청할 수 있는 권리이다." },
    { id: "B", text: "기업이 다른 기업의 데이터를 유상으로 구매할 수 있는 권리이다." },
    { id: "C", text: "정부가 모든 데이터를 무조건 공개해야 하는 의무이다." },
    { id: "D", text: "개인이 자신의 데이터를 영구히 삭제할 수 있는 권리이다." }
  ], "A");

addStep("p3", p3Sents[2].start, p3Sents[2].end,
  "셋째 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "우리나라도 데이터 이동권을 법으로 명문화하여 자기 결정권을 강화하였다." },
    { id: "B", text: "우리나라는 데이터 이동권을 법으로 금지하였다." },
    { id: "C", text: "데이터 이동권은 아직 어떤 나라에서도 법제화되지 않았다." },
    { id: "D", text: "우리나라는 소유권만 인정하고 이동권은 인정하지 않는다." }
  ], "A");

addStep("p3", p3Sents[3].start, p3Sents[3].end,
  "넷째 문장이 말하는 이동 대상의 제한으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "기업이 분석하고 가공하여 새롭게 만들어 낸 정보는 이동 대상에 포함되지 않는다." },
    { id: "B", text: "개인의 모든 데이터가 예외 없이 이동 대상에 해당한다." },
    { id: "C", text: "기업이 만든 정보도 모두 무상으로 이동해야 한다." },
    { id: "D", text: "개인 데이터 중 쇼핑 이력만 이동 대상에서 제외된다." }
  ], "A");

addStep("p3", p3Sents[4].start, p3Sents[4].end,
  "마지막 문장이 말하는 데이터 이동권 도입의 효과로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "개인이 자신의 행동 관련 데이터를 직접 관리하고 통제할 수 있는 범위가 넓어졌다." },
    { id: "B", text: "개인의 데이터 통제 범위가 오히려 좁아졌다." },
    { id: "C", text: "기업만 데이터를 관리할 수 있게 되었다." },
    { id: "D", text: "쇼핑 이력과 금융 거래 내역은 여전히 관리할 수 없다." }
  ], "A");

// p3 문단 중심내용
addStep("p3", 0, p3.length,
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "데이터 이동권은 정보 주체가 자신의 데이터 이동을 요청할 수 있는 권리로, 개인의 자기 결정권을 강화한다." },
    { id: "B", text: "데이터 이동권은 기업의 이익을 위해 만들어진 제도이다." },
    { id: "C", text: "데이터 이동권은 모든 종류의 데이터를 무제한으로 이동할 수 있게 한다." },
    { id: "D", text: "데이터 이동권은 아직 법제화되지 않은 이론적 개념에 불과하다." }
  ], "A");

// ===== p4 문장별 =====
addStep("p4", p4Sents[0].start, p4Sents[0].end,
  "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "데이터 이동권은 기업에도 긍정적인 효과를 가져온다." },
    { id: "B", text: "데이터 이동권은 기업에게 부정적인 영향만 미친다." },
    { id: "C", text: "데이터 이동권은 개인에게만 영향을 미친다." },
    { id: "D", text: "데이터 이동권은 기업과 개인 모두에게 불리하다." }
  ], "A");

addStep("p4", p4Sents[1].start, p4Sents[1].end,
  "둘째 문장이 말하는 비용 절감의 방법으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "직접 수집하는 대신 전송받은 데이터를 활용하면 데이터 생성 비용을 줄일 수 있다." },
    { id: "B", text: "기업이 더 많은 인력을 투입하면 비용이 절감된다." },
    { id: "C", text: "데이터를 수집하지 않으면 비용이 줄어든다." },
    { id: "D", text: "기업이 개인에게 비용을 전가하면 절감된다." }
  ], "A");

addStep("p4", p4Sents[2].start, p4Sents[2].end,
  "셋째 문장이 말하는 거래 비용 절감의 이유로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "법적으로 보장된 절차에 따라 데이터가 이동하므로 기업 간 분쟁이 줄어든다." },
    { id: "B", text: "기업 간 분쟁이 늘어나지만 법원이 빠르게 처리한다." },
    { id: "C", text: "데이터 이동이 금지되어 거래 자체가 없어진다." },
    { id: "D", text: "기업이 데이터를 공유하지 않아 분쟁 소지가 사라진다." }
  ], "A");

addStep("p4", p4Sents[3].start, p4Sents[3].end,
  "넷째 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "비용 절감이 궁극적으로 소비자에게 더 나은 서비스로 돌아올 수 있다." },
    { id: "B", text: "비용 절감은 기업의 이익으로만 사용된다." },
    { id: "C", text: "소비자에게는 아무런 혜택이 돌아가지 않는다." },
    { id: "D", text: "비용 절감은 데이터 이동권과 관련이 없다." }
  ], "A");

addStep("p4", p4Sents[4].start, p4Sents[4].end,
  "다섯째 문장이 제기하는 우려로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "데이터 이동권에 우려되는 점도 존재한다는 것이다." },
    { id: "B", text: "데이터 이동권에는 어떤 문제점도 없다는 것이다." },
    { id: "C", text: "모든 기업이 동일한 양의 데이터를 보유하게 된다는 것이다." },
    { id: "D", text: "개인이 데이터를 이동하는 것이 불가능해진다는 것이다." }
  ], "A");

addStep("p4", p4Sents[5].start, p4Sents[5].end,
  "여섯째 문장이 설명하는 우려의 구체적 내용으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "대형 기업으로 데이터가 쏠려 신규 기업이 데이터를 확보하기 어려워진다." },
    { id: "B", text: "소규모 기업으로 데이터가 쏠려 대형 기업이 불리해진다." },
    { id: "C", text: "모든 기업이 균등하게 데이터를 나눠 가지게 된다." },
    { id: "D", text: "데이터가 분산되어 어떤 기업도 데이터를 확보하지 못한다." }
  ], "A");

addStep("p4", p4Sents[6].start, p4Sents[6].end,
  "일곱째 문장이 말하는 우려의 결과로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "시장의 경쟁이 약화되고 특정 기업의 독점이 강화될 수 있다." },
    { id: "B", text: "시장의 경쟁이 더 치열해지고 독점이 사라진다." },
    { id: "C", text: "신규 기업이 오히려 더 쉽게 시장에 진입할 수 있다." },
    { id: "D", text: "모든 기업의 수익이 균등해진다." }
  ], "A");

addStep("p4", p4Sents[7].start, p4Sents[7].end,
  "마지막 문장이 말하는 핵심 주장으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "개인의 권리 보장과 기업 간 공정한 경쟁이 함께 이루어지도록 제도를 설계해야 한다." },
    { id: "B", text: "개인의 권리만 보장하면 기업 간 경쟁은 신경 쓰지 않아도 된다." },
    { id: "C", text: "기업 간 공정한 경쟁만 보장하면 개인의 권리는 저절로 지켜진다." },
    { id: "D", text: "데이터 이동권은 폐지하는 것이 최선이다." }
  ], "A");

// p4 문단 중심내용
addStep("p4", 0, p4.length,
  "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "데이터 이동권은 기업의 비용을 줄이지만, 데이터 쏠림에 따른 독점 우려가 있어 균형 잡힌 제도 설계가 필요하다." },
    { id: "B", text: "데이터 이동권은 기업에 비용 부담만 주므로 폐지해야 한다." },
    { id: "C", text: "데이터 이동권은 모든 기업에 동일한 이익을 가져다준다." },
    { id: "D", text: "데이터 이동권으로 인해 시장 경쟁이 완전히 사라졌다." }
  ], "A");

console.log(`\n정독 스텝 수: ${timeline.length}`);

// 복기 카드 8장
const recallCards = [
  { id: "c1", text: "인터넷 쇼핑이나 교통 카드 이용 시 개인의 활동 기록인 데이터가 남으며, 그 주인을 정보 주체라 한다." },
  { id: "c2", text: "데이터는 형체가 없고 복제가 쉬우며, 대량으로 모이면 경제적 가치를 지닌 빅 데이터가 된다." },
  { id: "c3", text: "빅 데이터 보유자에게 소유권을 주면 산업이 성장하고, 개인에게 주면 공정한 보상이 가능하다는 두 입장이 대립한다." },
  { id: "c4", text: "최근에는 소유권 논쟁을 넘어 데이터 이동권이라는 새로운 개념이 주목받고 있다." },
  { id: "c5", text: "데이터 이동권은 정보 주체가 자신의 데이터를 본인이나 제삼자에게 무상으로 전송하도록 요청할 수 있는 권리이다." },
  { id: "c6", text: "우리나라도 이 권리를 법으로 명문화하였으나, 기업이 가공하여 새로 만든 정보는 이동 대상이 아니다." },
  { id: "c7", text: "데이터 이동권으로 기업은 생성 비용과 거래 비용을 줄일 수 있으나, 대형 기업으로의 데이터 쏠림이 우려된다." },
  { id: "c8", text: "데이터 이동권이 본래 취지대로 작동하려면 개인의 권리 보장과 기업 간 공정 경쟁이 함께 이루어져야 한다." }
];

// 확인학습 문항 (answerRanges 계산)
function findInParagraph(pId, pText, answerText) {
  const idx = pText.indexOf(answerText);
  if (idx === -1) {
    console.error(`*** "${answerText}" not found in ${pId}!`);
    return { paragraphId: pId, start: 0, end: 0 };
  }
  return { paragraphId: pId, start: idx, end: idx + answerText.length };
}

const confirmQuestions = [
  { id: "q1", prompt: "개인의 활동에서 발생하는 기록의 주인인 개인을 무엇이라 부르나요?", answerText: "정보 주체", pId: "p1", pText: p1, answerMatchMode: "ANY" },
  { id: "q2", prompt: "데이터가 대량으로 모이고 처리되면 무엇이 되나요?", answerText: "빅 데이터", pId: "p1", pText: p1, answerMatchMode: "ANY" },
  { id: "q3", prompt: "기업에 소유권을 주면 데이터의 생산과 유통이 활발해져 어떤 효과가 기대되나요?", answerText: "관련 산업이 성장", pId: "p2", pText: p2, answerMatchMode: "ANY" },
  { id: "q4", prompt: "정보 주체가 자신의 데이터를 본인이나 제삼자에게 무상으로 전송하도록 요청할 수 있는 권리를 무엇이라 하나요?", answerText: "데이터 이동권", pId: "p3", pText: p3, answerMatchMode: "ANY" },
  { id: "q5", prompt: "우리나라가 데이터 이동권을 법으로 명문화하여 강화한 것은 무엇인가요?", answerText: "자기 결정권", pId: "p3", pText: p3, answerMatchMode: "ANY" },
  { id: "q6", prompt: "기업이 분석하고 가공하여 새롭게 만들어 낸 정보는 데이터 이동의 대상에 포함되나요?", answerText: "포함되는 것은 아니다", pId: "p3", pText: p3, answerMatchMode: "ANY" },
  { id: "q7", prompt: "보안 수준이 높은 대형 기업으로 데이터가 쏠리면 신규 기업에 어떤 문제가 생기나요?", answerText: "충분한 데이터를 확보하기 어려워진다", pId: "p4", pText: p4, answerMatchMode: "ANY" },
  { id: "q8", prompt: "데이터 이동권이 본래 취지대로 작동하려면 개인의 권리 보장과 함께 무엇이 이루어져야 하나요?", answerText: "기업 간 공정한 경쟁", pId: "p4", pText: p4, answerMatchMode: "ANY" }
];

const confirmQuestionsWithRanges = confirmQuestions.map(q => {
  const range = findInParagraph(q.pId, q.pText, q.answerText);
  console.log(`확인 ${q.id}: "${q.answerText}" → ${q.pId}[${range.start}:${range.end}] = "${q.pText.substring(range.start, range.end)}"`);
  return {
    id: q.id,
    prompt: q.prompt,
    answerText: q.answerText,
    answerMatchMode: q.answerMatchMode,
    answerRanges: [range],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  };
});

// 최종 JSON 조립
const content = {
  contentId: "dr-w1-001",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 1 비문학",
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
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: {
      cards: recallCards,
      correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
      seedPenalty: 1
    },
    confirm: { questions: confirmQuestionsWithRanges }
  }
};

// 파일 출력
const fs = require('fs');
const path = require('path');

const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1', '001.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\n정적 파일 저장: ${staticPath}`);

// 배치 항목
const batchItem = {
  content_type: "DAILY_READING",
  level_id: "WITTGENSTEIN_1",
  area: "READING",
  sub_area: "NONFICTION",
  day_index: 1,
  module_key: "reading_training",
  schema_version: "1.0",
  content: content
};

// 배치 파일 업데이트
const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-wittgenstein1.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[0] = batchItem;
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log(`배치 파일 업데이트: ${batchPath}`);

// 최종 검증
console.log("\n=== 최종 검증 ===");
console.log(`지문 길이: ${totalLen}자 (목표: 1350~1450)`);
console.log(`정독 스텝: ${timeline.length}개`);
console.log(`복기 카드: ${recallCards.length}개 (목표: 8)`);
console.log(`확인 문항: ${confirmQuestionsWithRanges.length}개 (목표: 5~10)`);
console.log(`길이 적합: ${totalLen >= 1350 && totalLen <= 1450 ? 'OK' : 'FAIL'}`);
console.log(`복기 적합: ${recallCards.length === 8 ? 'OK' : 'FAIL'}`);
console.log(`확인 적합: ${confirmQuestionsWithRanges.length >= 5 && confirmQuestionsWithRanges.length <= 10 ? 'OK' : 'FAIL'}`);
