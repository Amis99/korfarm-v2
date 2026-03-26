const fs = require('fs');
const path = require('path');

// ─── 지문: 철학/윤리 - 공리주의와 의무론 (비문학, 고1~2 수준, ~1400자) ───
const paragraphs = [
  {
    id: "p1",
    text: "윤리학에서는 어떤 행위가 도덕적으로 옳은지를 판단하는 기준에 대해 고대부터 현대에 이르기까지 오랫동안 논의해 왔다. 이러한 논의에서 대표적인 두 가지 입장이 공리주의와 의무론이다. 공리주의는 행위의 결과가 가져오는 행복이나 이익의 총량을 기준으로 도덕적 판단을 내리는 윤리 이론이다. 즉, 어떤 행위가 관련된 모든 사람의 행복을 최대화하고 고통을 최소화한다면 그 행위는 도덕적으로 옳다고 본다. 공리주의를 체계적으로 정립한 대표적인 철학자로는 제러미 벤담과 존 스튜어트 밀이 있으며, 이들은 '최대 다수의 최대 행복'이라는 원칙을 윤리적 판단의 핵심으로 제시하였다."
  },
  {
    id: "p2",
    text: "공리주의의 강점은 도덕적 판단에 구체적이고 계량적인 기준을 제공한다는 점에 있다. 정책을 결정할 때 가장 많은 사람에게 가장 큰 이익을 주는 방안을 선택하는 것이 합리적이라는 주장은 현실 사회에서 폭넓은 설득력을 지닌다. 그러나 공리주의에는 심각한 비판도 따른다. 만약 다수의 행복을 위해 소수의 권리를 침해하는 것이 허용된다면, 이는 정의의 관점에서 심각한 문제를 야기할 수 있다. 예를 들어 열 명의 환자를 살리기 위해 건강한 한 사람의 장기를 강제로 적출하는 것이 더 큰 행복을 가져온다 하더라도, 이를 도덕적으로 정당화하기는 어렵다. 이처럼 공리주의는 결과만을 중시한 나머지 개인의 기본적 권리와 존엄성을 간과할 위험이 있다는 한계를 지닌다."
  },
  {
    id: "p3",
    text: "이에 반해 의무론은 행위의 결과가 아니라 행위 그 자체의 도덕적 성격을 판단의 근본적 기준으로 삼는 윤리 이론이다. 의무론의 대표적인 철학자인 임마누엘 칸트는 도덕 법칙에 따라 행동하는 것 자체가 옳다고 주장하였다. 칸트는 '네가 행동하는 원칙이 보편적 법칙이 될 수 있도록 행동하라'라는 정언 명령을 제시하였는데, 이는 모든 사람이 따를 수 있는 보편적 원칙에 따라 행동해야 한다는 뜻이다. 의무론의 관점에서 거짓말은 아무리 좋은 결과를 가져오더라도 그 자체로 도덕적으로 그릇된 행위이다. 이 입장은 인간의 존엄성과 기본권을 행복의 총량보다 우선시한다는 점에서 공리주의의 한계를 보완하는 의미를 지닌다."
  },
  {
    id: "p4",
    text: "그러나 의무론에도 비판이 제기된다. 도덕 법칙을 지나치게 엄격하고 경직되게 적용하면 현실의 복잡한 상황에 유연하게 대처하기 어렵다는 것이다. 예를 들어 무고한 사람을 숨겨 주고 있는 상황에서 추적자에게 거짓말을 해야 할 때, 의무론에 따르면 거짓말은 어떤 경우에도 허용되지 않으므로 진실을 말해야 하는 딜레마에 빠지게 된다. 또한 서로 충돌하는 의무들 사이에서 어떤 의무를 우선해야 하는지에 대한 명확한 기준이 부족하다는 점도 지적된다. 이처럼 공리주의와 의무론은 각각 고유한 장점과 한계를 가지고 있으므로, 도덕적 판단에서는 양 이론의 통찰을 상호 보완적으로 활용하여 균형 잡힌 윤리적 사고를 추구하는 것이 바람직하다."
  }
];

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log("총 글자 수:", totalLen);
if (totalLen < 1350 || totalLen > 1450) console.warn("경고: 1400±50 범위 밖!");

function findRange(pid, search) {
  const p = paragraphs.find(x => x.id === pid);
  const s = p.text.indexOf(search);
  if (s === -1) throw new Error(`"${search}" not found in ${pid}`);
  return { paragraphId: pid, start: s, end: s + search.length };
}

const timeline = [];
let stepNum = 1;
function addStep(pid, sentence, q) { const r = findRange(pid, sentence); timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [r] }, question: { ...q, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true } } }); stepNum++; }
function addPS(pid, q) { const p = paragraphs.find(x => x.id === pid); timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: pid, start: 0, end: p.text.length }] }, question: { ...q, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true } } }); stepNum++; }

// p1
addStep("p1", "윤리학에서는 어떤 행위가 도덕적으로 옳은지를 판단하는 기준에 대해 고대부터 현대에 이르기까지 오랫동안 논의해 왔다.", { prompt: "첫 문장이 소개하는 윤리학의 핵심 주제로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "어떤 행위가 도덕적으로 옳은지를 판단하는 기준에 대한 논의이다." }, { id: "B", text: "자연과학의 법칙을 발견하는 것이다." }, { id: "C", text: "경제적 효율성을 높이는 방법을 연구하는 것이다." }, { id: "D", text: "역사적 사건의 원인을 분석하는 것이다." }], answerId: "A" });
addStep("p1", "이러한 논의에서 대표적인 두 가지 입장이 공리주의와 의무론이다.", { prompt: "둘째 문장에서 제시하는 두 가지 대표적 입장으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "공리주의와 의무론이다." }, { id: "B", text: "합리주의와 경험주의이다." }, { id: "C", text: "이기주의와 이타주의이다." }, { id: "D", text: "관념론과 유물론이다." }], answerId: "A" });
addStep("p1", "공리주의는 행위의 결과가 가져오는 행복이나 이익의 총량을 기준으로 도덕적 판단을 내리는 윤리 이론이다.", { prompt: "셋째 문장이 정의하는 공리주의의 핵심으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "행위의 결과가 가져오는 행복과 이익의 총량을 기준으로 판단한다." }, { id: "B", text: "행위 자체의 도덕적 성격을 기준으로 판단한다." }, { id: "C", text: "전통과 관습을 기준으로 판단한다." }, { id: "D", text: "개인의 감정에 따라 판단한다." }], answerId: "A" });
addStep("p1", "즉, 어떤 행위가 관련된 모든 사람의 행복을 최대화하고 고통을 최소화한다면 그 행위는 도덕적으로 옳다고 본다.", { prompt: "넷째 문장이 말하는 공리주의의 판단 원칙으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "모든 사람의 행복을 최대화하고 고통을 최소화하면 도덕적으로 옳다." }, { id: "B", text: "소수의 행복만 고려하면 도덕적으로 옳다." }, { id: "C", text: "행복과 무관하게 의무를 지키면 도덕적으로 옳다." }, { id: "D", text: "개인의 이익만 최대화하면 도덕적으로 옳다." }], answerId: "A" });
addStep("p1", "공리주의를 체계적으로 정립한 대표적인 철학자로는 제러미 벤담과 존 스튜어트 밀이 있으며, 이들은 '최대 다수의 최대 행복'이라는 원칙을 윤리적 판단의 핵심으로 제시하였다.", { prompt: "다섯째 문장에서 공리주의의 대표 철학자와 핵심 원칙으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "벤담과 밀이며, '최대 다수의 최대 행복' 원칙을 제시했다." }, { id: "B", text: "칸트와 헤겔이며, '정언 명령' 원칙을 제시했다." }, { id: "C", text: "소크라테스와 플라톤이며, '이데아' 원칙을 제시했다." }, { id: "D", text: "아리스토텔레스이며, '중용' 원칙을 제시했다." }], answerId: "A" });
addPS("p1", { prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "공리주의는 행위 결과의 행복 총량을 기준으로 도덕적 판단을 내리는 윤리 이론이다." }, { id: "B", text: "의무론은 행위 자체의 도덕적 성격을 중시하는 이론이다." }, { id: "C", text: "윤리학에서는 도덕적 판단 기준이 존재하지 않는다." }, { id: "D", text: "공리주의와 의무론은 동일한 원칙을 공유한다." }], answerId: "A" });

// p2
addStep("p2", "공리주의의 강점은 도덕적 판단에 구체적이고 계량적인 기준을 제공한다는 점에 있다.", { prompt: "첫 문장이 말하는 공리주의의 강점으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "도덕적 판단에 구체적이고 계량적인 기준을 제공한다." }, { id: "B", text: "개인의 권리를 최우선으로 보장한다." }, { id: "C", text: "행위의 동기를 정확히 평가한다." }, { id: "D", text: "보편적 도덕 법칙을 제시한다." }], answerId: "A" });
addStep("p2", "정책을 결정할 때 가장 많은 사람에게 가장 큰 이익을 주는 방안을 선택하는 것이 합리적이라는 주장은 현실 사회에서 폭넓은 설득력을 지닌다.", { prompt: "둘째 문장이 설명하는 공리주의의 현실적 유용성으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "가장 많은 사람에게 가장 큰 이익을 주는 정책 선택이 합리적이라는 점이다." }, { id: "B", text: "소수의 이익만 고려하는 것이 효율적이라는 점이다." }, { id: "C", text: "정책과 도덕은 무관하다는 점이다." }, { id: "D", text: "이익 계산 없이 직관적으로 결정하는 것이 낫다는 점이다." }], answerId: "A" });
addStep("p2", "그러나 공리주의에는 심각한 비판도 따른다.", { prompt: "셋째 문장이 제기하는 내용으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "공리주의에 심각한 비판이 존재한다는 것이다." }, { id: "B", text: "공리주의에는 비판이 전혀 없다는 것이다." }, { id: "C", text: "공리주의가 완벽한 이론이라는 것이다." }, { id: "D", text: "비판은 있으나 무시해도 된다는 것이다." }], answerId: "A" });
addStep("p2", "만약 다수의 행복을 위해 소수의 권리를 침해하는 것이 허용된다면, 이는 정의의 관점에서 심각한 문제를 야기할 수 있다.", { prompt: "넷째 문장이 지적하는 공리주의의 문제점으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "다수의 행복을 위해 소수의 권리가 침해될 수 있어 정의에 반한다." }, { id: "B", text: "소수의 행복이 다수보다 우선시된다." }, { id: "C", text: "모든 사람의 권리가 동등하게 보장된다." }, { id: "D", text: "정의와 행복은 항상 일치한다." }], answerId: "A" });
addStep("p2", "예를 들어 열 명의 환자를 살리기 위해 건강한 한 사람의 장기를 강제로 적출하는 것이 더 큰 행복을 가져온다 하더라도, 이를 도덕적으로 정당화하기는 어렵다.", { prompt: "다섯째 문장이 제시하는 구체적 사례의 핵심으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "다수를 위해 개인의 장기를 강제 적출하는 것은 정당화하기 어렵다." }, { id: "B", text: "장기 적출은 언제나 도덕적으로 정당하다." }, { id: "C", text: "열 명의 환자를 살리는 것이 무조건 옳다." }, { id: "D", text: "공리주의는 이 사례를 문제없이 설명한다." }], answerId: "A" });
addStep("p2", "이처럼 공리주의는 결과만을 중시한 나머지 개인의 기본적 권리와 존엄성을 간과할 위험이 있다는 한계를 지닌다.", { prompt: "마지막 문장이 요약하는 공리주의의 한계로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "결과만 중시하여 개인의 기본적 권리와 존엄성을 간과할 위험이 있다." }, { id: "B", text: "개인의 권리를 지나치게 강조한다." }, { id: "C", text: "결과를 전혀 고려하지 않는다." }, { id: "D", text: "한계가 없는 완벽한 이론이다." }], answerId: "A" });
addPS("p2", { prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "공리주의는 계량적 기준을 제공하지만, 다수를 위해 소수의 권리를 침해할 수 있다는 한계가 있다." }, { id: "B", text: "공리주의에는 장점만 있고 비판은 없다." }, { id: "C", text: "공리주의는 개인의 권리를 가장 잘 보장하는 이론이다." }, { id: "D", text: "공리주의의 비판은 사소하여 무시해도 된다." }], answerId: "A" });

// p3
addStep("p3", "이에 반해 의무론은 행위의 결과가 아니라 행위 그 자체의 도덕적 성격을 판단의 근본적 기준으로 삼는 윤리 이론이다.", { prompt: "첫 문장이 정의하는 의무론의 핵심으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "행위의 결과가 아니라 행위 자체의 도덕적 성격을 판단의 근본적 기준으로 삼는다." }, { id: "B", text: "행위의 결과만을 기준으로 판단한다." }, { id: "C", text: "행복의 총량을 계산하여 판단한다." }, { id: "D", text: "전통과 관습에 따라 판단한다." }], answerId: "A" });
addStep("p3", "의무론의 대표적인 철학자인 임마누엘 칸트는 도덕 법칙에 따라 행동하는 것 자체가 옳다고 주장하였다.", { prompt: "둘째 문장에서 칸트의 주장으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "도덕 법칙에 따라 행동하는 것 자체가 옳다." }, { id: "B", text: "결과가 좋으면 어떤 행동이든 옳다." }, { id: "C", text: "감정에 따라 행동하는 것이 옳다." }, { id: "D", text: "다수의 이익을 위한 행동만 옳다." }], answerId: "A" });
addStep("p3", "칸트는 '네가 행동하는 원칙이 보편적 법칙이 될 수 있도록 행동하라'라는 정언 명령을 제시하였는데, 이는 모든 사람이 따를 수 있는 보편적 원칙에 따라 행동해야 한다는 뜻이다.", { prompt: "셋째 문장에서 정언 명령의 의미로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "모든 사람이 따를 수 있는 보편적 원칙에 따라 행동해야 한다는 것이다." }, { id: "B", text: "상황에 따라 유연하게 원칙을 바꿔야 한다는 것이다." }, { id: "C", text: "결과에 따라 원칙을 정해야 한다는 것이다." }, { id: "D", text: "개인의 이익을 최우선으로 행동해야 한다는 것이다." }], answerId: "A" });
addStep("p3", "의무론의 관점에서 거짓말은 아무리 좋은 결과를 가져오더라도 그 자체로 도덕적으로 그릇된 행위이다.", { prompt: "넷째 문장이 말하는 의무론의 거짓말에 대한 입장으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "좋은 결과를 가져오더라도 거짓말은 그 자체로 도덕적으로 그릇된다." }, { id: "B", text: "좋은 결과를 위한 거짓말은 도덕적으로 허용된다." }, { id: "C", text: "거짓말의 도덕성은 결과에 따라 결정된다." }, { id: "D", text: "의무론은 거짓말에 대해 아무런 입장이 없다." }], answerId: "A" });
addStep("p3", "이 입장은 인간의 존엄성과 기본권을 행복의 총량보다 우선시한다는 점에서 공리주의의 한계를 보완하는 의미를 지닌다.", { prompt: "다섯째 문장이 강조하는 의무론의 의의로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "인간의 존엄성과 기본권을 행복 총량보다 우선시하여 공리주의의 한계를 보완한다." }, { id: "B", text: "행복의 총량을 존엄성보다 우선시한다." }, { id: "C", text: "공리주의와 동일한 한계를 지닌다." }, { id: "D", text: "의무론은 공리주의를 완전히 대체한다." }], answerId: "A" });
addPS("p3", { prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "의무론은 행위 자체의 도덕적 성격과 보편적 원칙을 중시하며, 인간의 존엄성을 우선한다." }, { id: "B", text: "의무론은 결과를 중시하는 이론이다." }, { id: "C", text: "의무론은 공리주의와 동일한 이론이다." }, { id: "D", text: "칸트는 행복의 총량을 도덕의 기준으로 삼았다." }], answerId: "A" });

// p4
addStep("p4", "그러나 의무론에도 비판이 제기된다.", { prompt: "첫 문장이 제기하는 내용으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "의무론에도 비판이 존재한다는 것이다." }, { id: "B", text: "의무론은 완벽한 이론이라는 것이다." }, { id: "C", text: "의무론에 대한 비판은 없다는 것이다." }, { id: "D", text: "공리주의만 비판받는다는 것이다." }], answerId: "A" });
addStep("p4", "도덕 법칙을 지나치게 엄격하고 경직되게 적용하면 현실의 복잡한 상황에 유연하게 대처하기 어렵다는 것이다.", { prompt: "둘째 문장이 지적하는 의무론의 한계로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "도덕 법칙의 엄격하고 경직된 적용이 현실의 복잡한 상황에 유연하게 대처하기 어렵게 한다." }, { id: "B", text: "도덕 법칙이 너무 유연하여 기준이 모호하다." }, { id: "C", text: "현실 상황은 항상 단순하여 문제가 없다." }, { id: "D", text: "의무론은 현실에 적용할 수 없는 이론이다." }], answerId: "A" });
addStep("p4", "예를 들어 무고한 사람을 숨겨 주고 있는 상황에서 추적자에게 거짓말을 해야 할 때, 의무론에 따르면 거짓말은 어떤 경우에도 허용되지 않으므로 진실을 말해야 하는 딜레마에 빠지게 된다.", { prompt: "셋째 문장이 제시하는 의무론의 딜레마 사례로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "무고한 사람을 보호하기 위해 거짓말이 필요하지만 의무론은 이를 허용하지 않는다." }, { id: "B", text: "의무론은 어떤 상황에서든 거짓말을 허용한다." }, { id: "C", text: "추적자에게 진실을 말하는 것이 항상 최선이다." }, { id: "D", text: "의무론에서는 이 상황이 딜레마가 되지 않는다." }], answerId: "A" });
addStep("p4", "또한 서로 충돌하는 의무들 사이에서 어떤 의무를 우선해야 하는지에 대한 명확한 기준이 부족하다는 점도 지적된다.", { prompt: "넷째 문장이 추가로 지적하는 의무론의 한계로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "충돌하는 의무들 사이의 우선순위 기준이 부족하다." }, { id: "B", text: "의무들 사이에 충돌이 일어나지 않는다." }, { id: "C", text: "의무의 우선순위가 항상 명확하다." }, { id: "D", text: "의무론에서는 의무가 하나뿐이다." }], answerId: "A" });
addStep("p4", "이처럼 공리주의와 의무론은 각각 고유한 장점과 한계를 가지고 있으므로, 도덕적 판단에서는 양 이론의 통찰을 상호 보완적으로 활용하여 균형 잡힌 윤리적 사고를 추구하는 것이 바람직하다.", { prompt: "마지막 문장이 주장하는 내용으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "두 이론의 통찰을 상호 보완적으로 활용하여 균형 잡힌 윤리적 사고를 추구해야 한다." }, { id: "B", text: "공리주의만 따르면 된다." }, { id: "C", text: "의무론만 따르면 된다." }, { id: "D", text: "두 이론 모두 폐기해야 한다." }], answerId: "A" });
addPS("p4", { prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "의무론에도 엄격성과 우선순위 기준 부족이라는 한계가 있어 두 이론의 상호 보완이 필요하다." }, { id: "B", text: "의무론은 한계가 없는 완벽한 이론이다." }, { id: "C", text: "공리주의와 의무론은 상호 보완이 불가능하다." }, { id: "D", text: "의무론의 비판은 근거가 없다." }], answerId: "A" });

const recall = {
  cards: [
    { id: "c1", text: "공리주의는 행위 결과의 행복 총량을 기준으로 도덕적 판단을 내리며, 벤담과 밀이 대표적이다." },
    { id: "c2", text: "공리주의는 계량적 기준을 제공하지만, 다수를 위해 소수의 권리가 침해될 수 있다는 한계가 있다." },
    { id: "c3", text: "의무론은 행위 자체의 도덕적 성격을 기준으로 삼으며, 칸트가 대표적 철학자이다." },
    { id: "c4", text: "칸트는 '정언 명령'으로 모든 사람이 따를 수 있는 보편적 원칙에 따라 행동할 것을 요구했다." },
    { id: "c5", text: "의무론은 인간의 존엄성과 기본권을 행복 총량보다 우선시하여 공리주의의 한계를 보완한다." },
    { id: "c6", text: "의무론은 엄격한 도덕 법칙 적용이 현실 대처를 어렵게 하고, 의무 충돌 시 우선순위 기준이 부족하다." },
    { id: "c7", text: "무고한 사람 보호를 위한 거짓말처럼, 의무론의 원칙이 현실에서 딜레마를 야기할 수 있다." },
    { id: "c8", text: "공리주의와 의무론은 각각 장단점이 있으므로 상호 보완적으로 활용하는 균형 잡힌 사고가 필요하다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

const confirm = {
  questions: [
    { id: "q1", prompt: "행위 결과의 행복 총량을 기준으로 도덕적 판단을 내리는 윤리 이론은 무엇인가요?", answerText: "공리주의", answerMatchMode: "ANY", answerRanges: [findRange("p1", "공리주의")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q2", prompt: "공리주의를 정립한 대표적 철학자 두 사람은 누구인가요?", answerText: "제러미 벤담과 존 스튜어트 밀", answerMatchMode: "ANY", answerRanges: [findRange("p1", "제러미 벤담과 존 스튜어트 밀")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q3", prompt: "공리주의의 핵심 원칙을 표현하는 유명한 문구는 무엇인가요?", answerText: "최대 다수의 최대 행복", answerMatchMode: "ANY", answerRanges: [findRange("p1", "최대 다수의 최대 행복")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q4", prompt: "공리주의가 결과만 중시하여 간과할 위험이 있는 것은 무엇인가요?", answerText: "개인의 기본적 권리와 존엄성", answerMatchMode: "ANY", answerRanges: [findRange("p2", "개인의 기본적 권리와 존엄성")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q5", prompt: "행위 자체의 도덕적 성격을 판단 기준으로 삼는 윤리 이론은 무엇인가요?", answerText: "의무론", answerMatchMode: "ANY", answerRanges: [findRange("p3", "의무론")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q6", prompt: "칸트가 제시한, 보편적 법칙이 될 수 있도록 행동하라는 원칙을 무엇이라 하나요?", answerText: "정언 명령", answerMatchMode: "ANY", answerRanges: [findRange("p3", "정언 명령")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q7", prompt: "의무론의 한계 중, 충돌하는 의무들 사이에서 부족한 것은 무엇인가요?", answerText: "명확한 기준", answerMatchMode: "ANY", answerRanges: [findRange("p4", "명확한 기준")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q8", prompt: "두 이론의 통찰을 활용하여 추구해야 할 사고는 무엇인가요?", answerText: "균형 잡힌 윤리적 사고", answerMatchMode: "ANY", answerRanges: [findRange("p4", "균형 잡힌 윤리적 사고")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true }
  ]
};

const content = {
  contentId: "dr-w1-009", contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 9 비문학", description: "일일 독해 - 정독·복기·확인",
  targetLevel: "WITTGENSTEIN_1", schoolGradeRange: { min: 9, max: 10 },
  area: "READING", subArea: "NONFICTION", competencies: ["READING"], tags: ["daily"],
  access: { mode: "FREE" }, seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300, assets: {},
  payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline }, recall, confirm }
};

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1');
fs.mkdirSync(staticDir, { recursive: true });
fs.writeFileSync(path.join(staticDir, '009.json'), JSON.stringify(content, null, 2), 'utf8');
console.log("009.json 저장 완료");

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-wittgenstein1.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const idx = batch.items.findIndex(i => i.day_index === 9 && i.level_id === "WITTGENSTEIN_1");
const batchItem = { content_type: "DAILY_READING", level_id: "WITTGENSTEIN_1", area: "READING", sub_area: "NONFICTION", day_index: 9, module_key: "reading_training", schema_version: "1.0", content };
if (idx >= 0) batch.items[idx] = batchItem; else batch.items.push(batchItem);
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log("배치 파일 Day 9 업데이트 완료");
console.log("intensive steps:", timeline.length, "| recall:", recall.cards.length, "| confirm:", confirm.questions.length);
