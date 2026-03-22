const fs = require('fs');
const path = require('path');

// ─── 지문: 사회 - 인플레이션과 물가 안정 (비문학, 고1~2 수준, ~1400자) ───
const paragraphs = [
  {
    id: "p1",
    text: "물가란 시장에서 거래되는 여러 상품과 서비스의 전반적인 가격 수준을 뜻하며, 경제 전체의 건강 상태를 보여 주는 중요한 지표이다. 물가가 지속적으로 오르는 현상을 인플레이션이라 하고, 반대로 물가가 지속적으로 내리는 현상을 디플레이션이라 한다. 인플레이션이 발생하면 같은 금액의 화폐로 구입할 수 있는 상품의 양이 줄어들게 되므로 화폐의 구매력이 하락한다. 이는 소비자의 실질적인 생활 수준을 떨어뜨리고, 특히 연금이나 고정 월급처럼 일정한 소득으로 생활하는 사람들에게 더 큰 부담을 준다. 따라서 물가의 안정은 국민 경제의 건전한 운영을 위한 경제 정책의 핵심 목표 가운데 하나로 여겨진다."
  },
  {
    id: "p2",
    text: "인플레이션의 원인은 크게 수요 견인 인플레이션과 비용 인상 인플레이션으로 나눌 수 있다. 수요 견인 인플레이션은 경제 전체의 총수요가 총공급을 초과할 때 발생하는데, 소비자와 기업의 지출이 늘어나거나 정부 지출이 확대되면 상품에 대한 수요가 급격히 증가하여 가격이 상승하게 된다. 비용 인상 인플레이션은 원자재 가격의 상승이나 근로자 임금의 인상 등으로 인해 생산 비용이 증가할 때 발생한다. 생산 비용이 높아지면 기업은 이윤을 유지하기 위해 상승된 비용을 상품 가격에 반영하게 되고, 이에 따라 전반적인 물가가 오르는 결과를 초래한다. 이 두 가지 원인은 서로 독립적으로 작용하기도 하지만, 동시에 복합적으로 나타나 인플레이션을 더욱 심화시키는 경우도 있다."
  },
  {
    id: "p3",
    text: "물가 안정을 위해 중앙은행은 통화 정책이라는 수단을 활용한다. 통화 정책의 대표적인 수단이 기준 금리의 조정이다. 중앙은행이 기준 금리를 인상하면 시중 은행의 예금 및 대출 금리도 함께 오르게 되어 기업과 가계의 차입이 줄어들고, 그 결과 소비와 투자가 감소하여 경제 전체의 총수요가 억제된다. 총수요가 줄면 물가 상승 압력이 완화되어 인플레이션을 진정시킬 수 있다. 반대로 경기가 침체되어 물가가 지나치게 낮아질 위험이 있을 때에는 기준 금리를 인하하여 대출을 늘리고 소비와 투자를 촉진한다. 이처럼 중앙은행은 경제 상황을 면밀히 분석하여 금리를 조절함으로써 물가와 경기의 균형을 유지하고자 한다."
  },
  {
    id: "p4",
    text: "그러나 통화 정책만으로 물가를 완벽하게 안정시키기는 어렵다. 기준 금리의 변화가 실물 경제에 파급되어 효과를 나타내기까지는 수개월에서 일 년 이상의 상당한 시간이 걸리기 때문이다. 또한 금리를 지나치게 올리면 기업의 투자가 위축되고 실업이 증가하는 심각한 부작용이 나타날 수 있다. 이러한 한계를 보완하기 위해 정부는 재정 정책도 함께 운용한다. 정부 지출을 줄이거나 세금을 인상하면 경제 전체의 수요가 감소하여 물가 상승을 억제하는 효과를 거둘 수 있다. 결국 물가 안정은 중앙은행의 통화 정책과 정부의 재정 정책이 서로 조화롭게 운용될 때 비로소 효과적으로 달성될 수 있다."
  }
];

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log("총 글자 수:", totalLen);
if (totalLen < 1350 || totalLen > 1450) console.warn("경고: 1400±50 범위 밖!");

function findRange(pid, search) {
  const p = paragraphs.find(x => x.id === pid);
  if (!p) throw new Error("문단 " + pid + " 없음");
  const s = p.text.indexOf(search);
  if (s === -1) throw new Error(`"${search}" not found in ${pid}`);
  return { paragraphId: pid, start: s, end: s + search.length };
}

const timeline = [];
let stepNum = 1;

function addStep(pid, sentence, question) {
  const r = findRange(pid, sentence);
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [r] },
    question: { ...question, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true } }
  });
  stepNum++;
}

function addParagraphSummary(pid, question) {
  const p = paragraphs.find(x => x.id === pid);
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [{ paragraphId: pid, start: 0, end: p.text.length }] },
    question: { ...question, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true } }
  });
  stepNum++;
}

// ── p1 ──
addStep("p1", "물가란 시장에서 거래되는 여러 상품과 서비스의 전반적인 가격 수준을 뜻하며, 경제 전체의 건강 상태를 보여 주는 중요한 지표이다.", {
  prompt: "첫 문장이 정의하는 '물가'의 의미로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "여러 상품과 서비스의 전반적인 가격 수준으로, 경제의 건강 상태를 보여 주는 지표이다." },
    { id: "B", text: "특정 상품 하나의 개별 가격이다." },
    { id: "C", text: "화폐의 발행량을 나타내는 수치이다." },
    { id: "D", text: "경제 성장률을 측정하는 지표이다." }
  ],
  answerId: "A"
});
addStep("p1", "물가가 지속적으로 오르는 현상을 인플레이션이라 하고, 반대로 물가가 지속적으로 내리는 현상을 디플레이션이라 한다.", {
  prompt: "둘째 문장에서 인플레이션과 디플레이션의 정의로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "물가가 지속적으로 오르면 인플레이션, 지속적으로 내리면 디플레이션이다." },
    { id: "B", text: "물가가 한 번 오르면 인플레이션, 한 번 내리면 디플레이션이다." },
    { id: "C", text: "인플레이션은 경기 침체, 디플레이션은 경기 과열을 뜻한다." },
    { id: "D", text: "인플레이션과 디플레이션은 같은 현상의 다른 이름이다." }
  ],
  answerId: "A"
});
addStep("p1", "인플레이션이 발생하면 같은 금액의 화폐로 구입할 수 있는 상품의 양이 줄어들게 되므로 화폐의 구매력이 하락한다.", {
  prompt: "셋째 문장이 말하는 인플레이션의 직접적 영향으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "같은 금액으로 구입할 수 있는 상품의 양이 줄어 화폐의 구매력이 하락한다." },
    { id: "B", text: "같은 금액으로 살 수 있는 상품의 양이 늘어 화폐의 가치가 상승한다." },
    { id: "C", text: "화폐의 발행량이 줄어들어 물가가 안정된다." },
    { id: "D", text: "상품의 공급량이 증가하여 가격이 하락한다." }
  ],
  answerId: "A"
});
addStep("p1", "이는 소비자의 실질적인 생활 수준을 떨어뜨리고, 특히 연금이나 고정 월급처럼 일정한 소득으로 생활하는 사람들에게 더 큰 부담을 준다.", {
  prompt: "넷째 문장이 말하는 인플레이션의 사회적 영향으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "소비자의 생활 수준이 떨어지고, 일정 소득자에게 더 큰 부담이 된다." },
    { id: "B", text: "모든 소비자의 소득이 균등하게 증가한다." },
    { id: "C", text: "소비자의 저축이 늘어나 생활이 안정된다." },
    { id: "D", text: "고소득자에게만 부담이 되고 저소득자에게는 영향이 없다." }
  ],
  answerId: "A"
});
addStep("p1", "따라서 물가의 안정은 국민 경제의 건전한 운영을 위한 경제 정책의 핵심 목표 가운데 하나로 여겨진다.", {
  prompt: "다섯째 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "물가 안정이 경제 정책의 핵심 목표 중 하나라는 것이다." },
    { id: "B", text: "물가는 경제 정책과 무관한 자연 현상이라는 것이다." },
    { id: "C", text: "경제 정책의 목표는 오직 경제 성장뿐이라는 것이다." },
    { id: "D", text: "물가 변동은 경제에 아무런 영향을 미치지 않는다는 것이다." }
  ],
  answerId: "A"
});
addParagraphSummary("p1", {
  prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "인플레이션은 화폐의 구매력을 떨어뜨려 생활 수준을 하락시키므로 물가 안정이 중요하다." },
    { id: "B", text: "디플레이션이 인플레이션보다 경제에 더 큰 해를 끼친다." },
    { id: "C", text: "물가는 항상 안정되어 있으므로 경제 정책이 불필요하다." },
    { id: "D", text: "인플레이션은 모든 소비자에게 동일한 영향을 미친다." }
  ],
  answerId: "A"
});

// ── p2 ──
addStep("p2", "인플레이션의 원인은 크게 수요 견인 인플레이션과 비용 인상 인플레이션으로 나눌 수 있다.", {
  prompt: "첫 문장에서 인플레이션 원인의 구분으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "수요 견인 인플레이션과 비용 인상 인플레이션으로 나뉜다." },
    { id: "B", text: "국내 인플레이션과 해외 인플레이션으로 나뉜다." },
    { id: "C", text: "단기 인플레이션과 장기 인플레이션으로 나뉜다." },
    { id: "D", text: "자연 인플레이션과 인위 인플레이션으로 나뉜다." }
  ],
  answerId: "A"
});
addStep("p2", "수요 견인 인플레이션은 경제 전체의 총수요가 총공급을 초과할 때 발생하는데, 소비자와 기업의 지출이 늘어나거나 정부 지출이 확대되면 상품에 대한 수요가 급격히 증가하여 가격이 상승하게 된다.", {
  prompt: "둘째 문장에서 수요 견인 인플레이션의 발생 원인으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "총수요가 총공급을 초과하고, 소비자·기업·정부의 지출 증가로 수요가 급증한다." },
    { id: "B", text: "원자재 가격이 급등하여 생산 비용이 증가한다." },
    { id: "C", text: "총공급이 총수요를 크게 초과한다." },
    { id: "D", text: "중앙은행이 금리를 인상하여 소비가 늘어난다." }
  ],
  answerId: "A"
});
addStep("p2", "비용 인상 인플레이션은 원자재 가격의 상승이나 근로자 임금의 인상 등으로 인해 생산 비용이 증가할 때 발생한다.", {
  prompt: "셋째 문장에서 비용 인상 인플레이션의 원인으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "원자재 가격 상승이나 임금 인상으로 생산 비용이 증가할 때 발생한다." },
    { id: "B", text: "소비자의 수요가 급격히 증가할 때 발생한다." },
    { id: "C", text: "정부가 세금을 감면하여 소비를 촉진할 때 발생한다." },
    { id: "D", text: "중앙은행이 통화량을 줄일 때 발생한다." }
  ],
  answerId: "A"
});
addStep("p2", "생산 비용이 높아지면 기업은 이윤을 유지하기 위해 상승된 비용을 상품 가격에 반영하게 되고, 이에 따라 전반적인 물가가 오르는 결과를 초래한다.", {
  prompt: "넷째 문장이 말하는 물가 상승의 메커니즘으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "기업이 이윤 유지를 위해 생산 비용 상승분을 가격에 반영하여 물가가 오른다." },
    { id: "B", text: "소비자가 높은 가격을 요구하여 물가가 오른다." },
    { id: "C", text: "정부가 가격을 직접 인상하여 물가가 오른다." },
    { id: "D", text: "수요가 감소하여 상품이 남아돌아 물가가 오른다." }
  ],
  answerId: "A"
});
addStep("p2", "이 두 가지 원인은 서로 독립적으로 작용하기도 하지만, 동시에 복합적으로 나타나 인플레이션을 더욱 심화시키는 경우도 있다.", {
  prompt: "마지막 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "두 원인이 독립적 또는 복합적으로 작용하여 인플레이션을 심화시킬 수 있다." },
    { id: "B", text: "두 원인은 항상 동시에 발생하며 독립적으로 작용하지 않는다." },
    { id: "C", text: "두 원인 중 하나만 존재할 수 있고 동시에 나타나지 않는다." },
    { id: "D", text: "두 원인이 복합적으로 나타나면 인플레이션이 자동으로 해소된다." }
  ],
  answerId: "A"
});
addParagraphSummary("p2", {
  prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "인플레이션은 수요 증가나 생산 비용 상승에 의해 발생하며, 두 원인이 복합적으로 작용할 수 있다." },
    { id: "B", text: "인플레이션은 오직 수요 증가에 의해서만 발생한다." },
    { id: "C", text: "비용 인상 인플레이션은 소비자의 지출 증가가 원인이다." },
    { id: "D", text: "인플레이션의 원인은 아직 밝혀지지 않았다." }
  ],
  answerId: "A"
});

// ── p3 ──
addStep("p3", "물가 안정을 위해 중앙은행은 통화 정책이라는 수단을 활용한다.", {
  prompt: "첫 문장이 소개하는 물가 안정 수단으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "중앙은행이 통화 정책이라는 수단을 활용한다." },
    { id: "B", text: "정부가 직접 상품 가격을 통제한다." },
    { id: "C", text: "소비자가 자발적으로 소비를 줄인다." },
    { id: "D", text: "기업이 생산량을 늘려 공급을 확대한다." }
  ],
  answerId: "A"
});
addStep("p3", "통화 정책의 대표적인 수단이 기준 금리의 조정이다.", {
  prompt: "둘째 문장에서 통화 정책의 대표적 수단으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "기준 금리의 조정이다." },
    { id: "B", text: "세금의 인상이다." },
    { id: "C", text: "정부 지출의 확대이다." },
    { id: "D", text: "무역 제한의 실시이다." }
  ],
  answerId: "A"
});
addStep("p3", "중앙은행이 기준 금리를 인상하면 시중 은행의 예금 및 대출 금리도 함께 오르게 되어 기업과 가계의 차입이 줄어들고, 그 결과 소비와 투자가 감소하여 경제 전체의 총수요가 억제된다.", {
  prompt: "셋째 문장에서 금리 인상의 효과로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "차입이 줄고 소비와 투자가 감소하여 총수요가 억제된다." },
    { id: "B", text: "대출이 늘어나고 소비와 투자가 증가한다." },
    { id: "C", text: "물가가 더욱 상승하여 인플레이션이 심화된다." },
    { id: "D", text: "기업의 생산 비용이 직접 감소한다." }
  ],
  answerId: "A"
});
addStep("p3", "총수요가 줄면 물가 상승 압력이 완화되어 인플레이션을 진정시킬 수 있다.", {
  prompt: "넷째 문장이 말하는 총수요 감소의 결과로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "물가 상승 압력이 완화되어 인플레이션이 진정된다." },
    { id: "B", text: "물가가 더 빠르게 상승한다." },
    { id: "C", text: "경기가 과열되어 불안정해진다." },
    { id: "D", text: "디플레이션이 즉시 발생한다." }
  ],
  answerId: "A"
});
addStep("p3", "반대로 경기가 침체되어 물가가 지나치게 낮아질 위험이 있을 때에는 기준 금리를 인하하여 대출을 늘리고 소비와 투자를 촉진한다.", {
  prompt: "다섯째 문장에서 금리 인하가 사용되는 상황으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "경기 침체로 물가가 지나치게 낮아질 위험이 있을 때이다." },
    { id: "B", text: "물가가 지나치게 높이 올라갈 때이다." },
    { id: "C", text: "경기가 과열되어 투자가 넘칠 때이다." },
    { id: "D", text: "중앙은행의 자금이 부족할 때이다." }
  ],
  answerId: "A"
});
addStep("p3", "이처럼 중앙은행은 경제 상황을 면밀히 분석하여 금리를 조절함으로써 물가와 경기의 균형을 유지하고자 한다.", {
  prompt: "마지막 문장이 전달하는 중앙은행의 목표로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "경제 상황 분석을 통해 금리를 조절하여 물가와 경기의 균형을 유지하는 것이다." },
    { id: "B", text: "금리를 항상 높게 유지하여 물가를 낮추는 것이다." },
    { id: "C", text: "금리를 항상 낮게 유지하여 소비를 극대화하는 것이다." },
    { id: "D", text: "금리와 무관하게 통화량만 조절하는 것이다." }
  ],
  answerId: "A"
});
addParagraphSummary("p3", {
  prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "중앙은행은 기준 금리 조정을 통해 총수요를 조절하여 물가와 경기의 균형을 유지한다." },
    { id: "B", text: "중앙은행은 물가에 관여하지 않고 경기 성장만을 목표로 한다." },
    { id: "C", text: "기준 금리를 인상하면 항상 경기가 호전된다." },
    { id: "D", text: "통화 정책은 물가 안정에 전혀 효과가 없다." }
  ],
  answerId: "A"
});

// ── p4 ──
addStep("p4", "그러나 통화 정책만으로 물가를 완벽하게 안정시키기는 어렵다.", {
  prompt: "첫 문장이 제기하는 통화 정책의 한계로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "통화 정책만으로는 물가를 완벽하게 안정시키기 어렵다는 것이다." },
    { id: "B", text: "통화 정책은 물가 안정에 매우 효과적이라는 것이다." },
    { id: "C", text: "통화 정책은 경기에만 영향을 미친다는 것이다." },
    { id: "D", text: "통화 정책은 재정 정책보다 항상 우월하다는 것이다." }
  ],
  answerId: "A"
});
addStep("p4", "기준 금리의 변화가 실물 경제에 파급되어 효과를 나타내기까지는 수개월에서 일 년 이상의 상당한 시간이 걸리기 때문이다.", {
  prompt: "둘째 문장이 말하는 통화 정책의 구체적 한계로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "금리 변화가 실물 경제에 효과를 나타내기까지 상당한 시간이 걸린다." },
    { id: "B", text: "금리 변화는 즉시 경제에 반영되지만 효과가 미미하다." },
    { id: "C", text: "금리를 변화시킬 권한이 중앙은행에 없다." },
    { id: "D", text: "금리가 물가와 아무런 관련이 없다." }
  ],
  answerId: "A"
});
addStep("p4", "또한 금리를 지나치게 올리면 기업의 투자가 위축되고 실업이 증가하는 심각한 부작용이 나타날 수 있다.", {
  prompt: "셋째 문장이 경고하는 금리 인상의 부작용으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "기업 투자 위축과 실업 증가이다." },
    { id: "B", text: "물가의 급격한 상승이다." },
    { id: "C", text: "소비의 급격한 증가이다." },
    { id: "D", text: "정부 지출의 자동 확대이다." }
  ],
  answerId: "A"
});
addStep("p4", "이러한 한계를 보완하기 위해 정부는 재정 정책도 함께 운용한다.", {
  prompt: "넷째 문장이 소개하는 보완 수단으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "통화 정책의 한계를 보완하기 위해 정부가 재정 정책을 함께 운용한다." },
    { id: "B", text: "통화 정책을 폐지하고 재정 정책으로 완전히 대체한다." },
    { id: "C", text: "기업이 자체적으로 물가를 조절하는 정책을 시행한다." },
    { id: "D", text: "소비자가 직접 물가를 결정하는 제도를 도입한다." }
  ],
  answerId: "A"
});
addStep("p4", "정부 지출을 줄이거나 세금을 인상하면 경제 전체의 수요가 감소하여 물가 상승을 억제하는 효과를 거둘 수 있다.", {
  prompt: "다섯째 문장이 설명하는 재정 정책의 구체적 방법으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "정부 지출 축소나 세금 인상으로 수요를 줄여 물가 상승을 억제한다." },
    { id: "B", text: "정부 지출을 늘리고 세금을 감면하여 물가를 낮춘다." },
    { id: "C", text: "기업에 보조금을 지급하여 생산 비용을 높인다." },
    { id: "D", text: "중앙은행에 금리를 낮추도록 명령한다." }
  ],
  answerId: "A"
});
addStep("p4", "결국 물가 안정은 중앙은행의 통화 정책과 정부의 재정 정책이 서로 조화롭게 운용될 때 비로소 효과적으로 달성될 수 있다.", {
  prompt: "마지막 문장이 전달하는 핵심 주장으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "통화 정책과 재정 정책이 조화롭게 운용될 때 물가 안정이 효과적으로 달성된다." },
    { id: "B", text: "통화 정책만으로 물가를 완벽하게 안정시킬 수 있다." },
    { id: "C", text: "재정 정책만으로 물가를 완벽하게 안정시킬 수 있다." },
    { id: "D", text: "물가 안정은 어떤 정책으로도 달성할 수 없다." }
  ],
  answerId: "A"
});
addParagraphSummary("p4", {
  prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "통화 정책에는 시간 지연과 부작용이라는 한계가 있어 재정 정책과 조화롭게 운용해야 물가가 안정된다." },
    { id: "B", text: "통화 정책은 부작용이 없으므로 재정 정책은 불필요하다." },
    { id: "C", text: "재정 정책은 통화 정책보다 항상 효과적이다." },
    { id: "D", text: "물가 안정은 정책 없이도 자연적으로 달성된다." }
  ],
  answerId: "A"
});

// ─── 복기 (recall): 8카드 ───
const recall = {
  cards: [
    { id: "c1", text: "물가가 지속적으로 오르는 인플레이션은 화폐의 구매력을 떨어뜨려 소비자의 생활 수준을 하락시킨다." },
    { id: "c2", text: "인플레이션의 원인은 총수요가 총공급을 초과하는 수요 견인과, 생산 비용이 증가하는 비용 인상으로 나뉜다." },
    { id: "c3", text: "수요 견인은 소비자·기업·정부의 지출 증가, 비용 인상은 원자재·임금 상승이 원인이며 복합적으로 작용할 수 있다." },
    { id: "c4", text: "중앙은행은 기준 금리 조정이라는 통화 정책으로 물가를 안정시킨다." },
    { id: "c5", text: "금리를 인상하면 차입과 소비가 줄어 총수요가 억제되고, 인하하면 소비와 투자가 촉진된다." },
    { id: "c6", text: "통화 정책은 효과가 나타나기까지 시간이 걸리고, 과도한 금리 인상은 투자 위축과 실업 증가를 초래할 수 있다." },
    { id: "c7", text: "정부는 재정 정책(지출 축소, 세금 인상)으로 통화 정책의 한계를 보완한다." },
    { id: "c8", text: "물가 안정은 통화 정책과 재정 정책이 조화롭게 운용될 때 효과적으로 달성된다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// ─── 확인 (confirm): 8문항 ───
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "물가가 지속적으로 오르는 현상을 무엇이라 하나요?",
      answerText: "인플레이션",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "인플레이션")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "인플레이션이 발생하면 화폐의 무엇이 하락하나요?",
      answerText: "구매력",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "구매력")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "총수요가 총공급을 초과할 때 발생하는 인플레이션을 무엇이라 하나요?",
      answerText: "수요 견인 인플레이션",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "수요 견인 인플레이션")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "생산 비용의 증가로 발생하는 인플레이션을 무엇이라 하나요?",
      answerText: "비용 인상 인플레이션",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "비용 인상 인플레이션")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "중앙은행이 물가 안정을 위해 조정하는 통화 정책의 대표적 수단은 무엇인가요?",
      answerText: "기준 금리",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "기준 금리")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "금리를 지나치게 올리면 나타날 수 있는 부작용 두 가지는 무엇인가요?",
      answerText: "기업의 투자가 위축되고 실업이 증가",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "기업의 투자가 위축되고 실업이 증가")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "통화 정책의 한계를 보완하기 위해 정부가 함께 운용하는 정책은 무엇인가요?",
      answerText: "재정 정책",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "재정 정책")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q8",
      prompt: "물가 안정을 위한 재정 정책의 구체적 방법은 무엇인가요?",
      answerText: "정부 지출을 줄이거나 세금을 인상",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "정부 지출을 줄이거나 세금을 인상")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

// ─── 콘텐츠 조립 ───
const content = {
  contentId: "dr-w1-006",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 6 비문학",
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
    recall,
    confirm
  }
};

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1');
fs.mkdirSync(staticDir, { recursive: true });
fs.writeFileSync(path.join(staticDir, '006.json'), JSON.stringify(content, null, 2), 'utf8');
console.log("006.json 저장 완료");

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-wittgenstein1.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const idx = batch.items.findIndex(i => i.day_index === 6 && i.level_id === "WITTGENSTEIN_1");
const batchItem = { content_type: "DAILY_READING", level_id: "WITTGENSTEIN_1", area: "READING", sub_area: "NONFICTION", day_index: 6, module_key: "reading_training", schema_version: "1.0", content };
if (idx >= 0) batch.items[idx] = batchItem; else batch.items.push(batchItem);
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log("배치 파일 Day 6 업데이트 완료");
console.log("intensive steps:", timeline.length, "| recall:", recall.cards.length, "| confirm:", confirm.questions.length);
