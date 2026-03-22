// 러셀3 Day 5 - 비문학 (사회/경제: 행동경제학과 넛지)
// 중2~중3 수준, 1300자 ±50

const fs = require('fs');

// ────────────── 지문 (4문단) ──────────────
const p1 = "전통 경제학은 인간을 합리적 존재로 가정한다. 사람들은 주어진 정보를 냉철하게 분석하여 자신에게 가장 유리한 선택을 한다는 것이다. 그러나 현실에서 사람들은 종종 비합리적인 결정을 내린다. 건강에 해롭다는 것을 알면서도 야식을 먹거나, 저축이 중요하다고 인정하면서도 충동적으로 소비하는 경우가 그 예이다. 행동경제학은 이러한 현실의 인간 행동에 주목하여, 심리적 편향과 인지적 한계가 의사 결정에 미치는 영향을 체계적으로 연구하는 분야이다. 행동경제학의 관점에서 인간은 완벽하게 합리적이지 않으며, 감정이나 직관, 사회적 맥락 등 다양한 요인에 의해 판단이 좌우된다.";

const p2 = "행동경제학에서 밝혀낸 대표적인 심리적 편향으로 현상 유지 편향, 손실 회피, 프레이밍 효과가 있다. 현상 유지 편향이란 특별한 이유가 없는 한 현재 상태를 유지하려는 경향을 말한다. 예를 들어 휴대전화의 기본 설정을 바꾸지 않는 사람이 많은 것은 이 편향 때문이다. 손실 회피는 같은 크기의 이익보다 손실에 더 민감하게 반응하는 경향이다. 만 원을 얻는 기쁨보다 만 원을 잃는 고통이 약 두 배 더 크게 느껴진다는 것이 실험으로 확인되었다. 프레이밍 효과는 동일한 내용이라도 표현 방식에 따라 선택이 달라지는 현상이다. 이를테면 수술 성공률이 구십 퍼센트라고 말할 때와 실패율이 십 퍼센트라고 말할 때, 같은 정보임에도 전자를 들은 환자가 수술에 동의할 확률이 높다.";

const p3 = "이러한 심리적 편향에 대한 이해를 바탕으로 등장한 개념이 바로 '넛지'이다. 넛지는 영어로 '팔꿈치로 슬쩍 찌르다'라는 뜻으로, 강제나 명령 없이 사람들의 선택을 특정 방향으로 유도하는 부드러운 개입을 가리킨다. 넛지의 핵심은 선택의 자유를 제한하지 않으면서도 더 나은 결과를 이끌어 낸다는 점에 있다. 대표적인 사례로 회사의 퇴직연금 자동 가입 제도가 있다. 직원이 별도로 신청하지 않아도 자동으로 가입되고, 탈퇴하려면 직접 서류를 제출해야 하는 방식이다. 현상 유지 편향을 활용하여 대부분의 직원이 가입 상태를 유지하게 만드는 것이다. 학교 급식실에서 과일과 샐러드를 눈높이에 배치하고 과자를 높은 선반에 두는 것도 넛지의 일종이다.";

const p4 = "넛지는 공공 정책에서도 널리 활용된다. 영국 정부는 세금 체납자에게 보내는 안내문에 '당신의 이웃 대부분은 이미 세금을 납부했습니다'라는 문구를 추가하여 납부율을 크게 높였다. 이것은 사람들이 다수의 행동을 따르려는 사회적 동조 심리를 활용한 것이다. 그러나 넛지에 대한 비판도 존재한다. 누가 어떤 방향으로 선택을 유도할 것인지에 대한 윤리적 문제가 제기되며, 넛지가 지나치면 개인의 자율적 판단 능력을 약화시킬 수 있다는 우려도 있다. 따라서 넛지를 설계할 때에는 투명성을 확보하고, 유도의 방향이 공익에 부합하는지 면밀히 검토해야 한다.";

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

// ────────────── 문장 경계 ──────────────
function findRange(text, substring) {
  const idx = text.indexOf(substring);
  if (idx === -1) throw new Error(`못 찾음: "${substring.substring(0, 40)}..."`);
  return { start: idx, end: idx + substring.length };
}

const p1_sents = [
  findRange(p1, "전통 경제학은 인간을 합리적 존재로 가정한다."),
  findRange(p1, "사람들은 주어진 정보를 냉철하게 분석하여 자신에게 가장 유리한 선택을 한다는 것이다."),
  findRange(p1, "그러나 현실에서 사람들은 종종 비합리적인 결정을 내린다."),
  findRange(p1, "건강에 해롭다는 것을 알면서도 야식을 먹거나, 저축이 중요하다고 인정하면서도 충동적으로 소비하는 경우가 그 예이다."),
  findRange(p1, "행동경제학은 이러한 현실의 인간 행동에 주목하여, 심리적 편향과 인지적 한계가 의사 결정에 미치는 영향을 체계적으로 연구하는 분야이다."),
  findRange(p1, "행동경제학의 관점에서 인간은 완벽하게 합리적이지 않으며, 감정이나 직관, 사회적 맥락 등 다양한 요인에 의해 판단이 좌우된다.")
];

const p2_sents = [
  findRange(p2, "행동경제학에서 밝혀낸 대표적인 심리적 편향으로 현상 유지 편향, 손실 회피, 프레이밍 효과가 있다."),
  findRange(p2, "현상 유지 편향이란 특별한 이유가 없는 한 현재 상태를 유지하려는 경향을 말한다."),
  findRange(p2, "예를 들어 휴대전화의 기본 설정을 바꾸지 않는 사람이 많은 것은 이 편향 때문이다."),
  findRange(p2, "손실 회피는 같은 크기의 이익보다 손실에 더 민감하게 반응하는 경향이다."),
  findRange(p2, "만 원을 얻는 기쁨보다 만 원을 잃는 고통이 약 두 배 더 크게 느껴진다는 것이 실험으로 확인되었다."),
  findRange(p2, "프레이밍 효과는 동일한 내용이라도 표현 방식에 따라 선택이 달라지는 현상이다."),
  findRange(p2, "이를테면 수술 성공률이 구십 퍼센트라고 말할 때와 실패율이 십 퍼센트라고 말할 때, 같은 정보임에도 전자를 들은 환자가 수술에 동의할 확률이 높다.")
];

const p3_sents = [
  findRange(p3, "이러한 심리적 편향에 대한 이해를 바탕으로 등장한 개념이 바로 '넛지'이다."),
  findRange(p3, "넛지는 영어로 '팔꿈치로 슬쩍 찌르다'라는 뜻으로, 강제나 명령 없이 사람들의 선택을 특정 방향으로 유도하는 부드러운 개입을 가리킨다."),
  findRange(p3, "넛지의 핵심은 선택의 자유를 제한하지 않으면서도 더 나은 결과를 이끌어 낸다는 점에 있다."),
  findRange(p3, "대표적인 사례로 회사의 퇴직연금 자동 가입 제도가 있다."),
  findRange(p3, "직원이 별도로 신청하지 않아도 자동으로 가입되고, 탈퇴하려면 직접 서류를 제출해야 하는 방식이다."),
  findRange(p3, "현상 유지 편향을 활용하여 대부분의 직원이 가입 상태를 유지하게 만드는 것이다."),
  findRange(p3, "학교 급식실에서 과일과 샐러드를 눈높이에 배치하고 과자를 높은 선반에 두는 것도 넛지의 일종이다.")
];

const p4_sents = [
  findRange(p4, "넛지는 공공 정책에서도 널리 활용된다."),
  findRange(p4, "영국 정부는 세금 체납자에게 보내는 안내문에 '당신의 이웃 대부분은 이미 세금을 납부했습니다'라는 문구를 추가하여 납부율을 크게 높였다."),
  findRange(p4, "이것은 사람들이 다수의 행동을 따르려는 사회적 동조 심리를 활용한 것이다."),
  findRange(p4, "그러나 넛지에 대한 비판도 존재한다."),
  findRange(p4, "누가 어떤 방향으로 선택을 유도할 것인지에 대한 윤리적 문제가 제기되며, 넛지가 지나치면 개인의 자율적 판단 능력을 약화시킬 수 있다는 우려도 있다."),
  findRange(p4, "따라서 넛지를 설계할 때에는 투명성을 확보하고, 유도의 방향이 공익에 부합하는지 면밀히 검토해야 한다.")
];

// 검증 출력
for (const [pid, sents, text] of [["p1", p1_sents, p1], ["p2", p2_sents, p2], ["p3", p3_sents, p3], ["p4", p4_sents, p4]]) {
  console.log(`\n${pid} (${text.length}자, ${sents.length}문장):`);
  for (let i = 0; i < sents.length; i++) {
    const s = sents[i];
    console.log(`  [${s.start}, ${s.end}] "${text.substring(s.start, Math.min(s.end, s.start+50))}..."`);
  }
}

// ────────────── timeline ──────────────
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
function makeSummaryStep(paragraphId, textLen, prompt, choices) {
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
  // p1
  makeStep("p1", p1_sents[0],
    "첫 문장에서 전통 경제학이 가정하는 인간상은?",
    ["인간을 합리적 존재로 본다.", "인간을 감정적 존재로 본다.", "인간을 이타적 존재로 본다.", "인간을 비합리적 존재로 본다."]),
  makeStep("p1", p1_sents[1],
    "둘째 문장이 설명하는 합리적 인간의 행동은?",
    ["정보를 분석하여 가장 유리한 선택을 한다.", "직관에 따라 빠르게 결정을 내린다.", "타인의 의견을 무조건 따른다.", "감정에 따라 즉흥적으로 결정한다."]),
  makeStep("p1", p1_sents[2],
    "셋째 문장이 지적하는 현실의 문제는?",
    ["사람들이 종종 비합리적인 결정을 내린다.", "사람들이 항상 올바른 선택을 한다.", "경제학 이론이 완벽하게 맞는다.", "현실에서 합리적 판단만 이루어진다."]),
  makeStep("p1", p1_sents[3],
    "넷째 문장이 드는 비합리적 행동의 예시는?",
    ["해롭다고 알면서 야식을 먹거나 충동 소비를 한다.", "건강을 위해 운동을 꾸준히 한다.", "미래를 위해 저축을 철저히 한다.", "필요한 물건만 계획적으로 구매한다."]),
  makeStep("p1", p1_sents[4],
    "다섯째 문장이 설명하는 행동경제학의 연구 대상은?",
    ["심리적 편향과 인지적 한계가 의사 결정에 미치는 영향이다.", "기업의 이윤 극대화 전략이다.", "국가 간 무역 정책의 효과이다.", "주식 시장의 장기적 추세 변화이다."]),
  makeStep("p1", p1_sents[5],
    "여섯째 문장에서 인간의 판단을 좌우하는 요인은?",
    ["감정, 직관, 사회적 맥락 등 다양한 요인이다.", "오로지 이성적 사고만이다.", "법률과 규제만이다.", "경제적 보상의 크기만이다."]),
  makeSummaryStep("p1", p1.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["전통 경제학의 한계를 보완하는 행동경제학의 등장 배경이다.", "전통 경제학이 현실을 완벽하게 설명한다는 주장이다.", "비합리적 소비를 막기 위한 정부 정책이다.", "경제학의 역사적 발전 과정에 대한 개괄이다."]),

  // p2
  makeStep("p2", p2_sents[0],
    "첫 문장이 나열하는 세 가지 심리적 편향은?",
    ["현상 유지 편향, 손실 회피, 프레이밍 효과이다.", "확증 편향, 후광 효과, 기저율 무시이다.", "자기 과신, 집단 사고, 동조 효과이다.", "매몰 비용 오류, 가용성 편향, 앵커링이다."]),
  makeStep("p2", p2_sents[1],
    "둘째 문장이 정의하는 현상 유지 편향이란?",
    ["특별한 이유 없이 현재 상태를 유지하려는 경향이다.", "새로운 것을 적극적으로 받아들이려는 경향이다.", "과거의 결정을 후회하는 경향이다.", "남들과 다른 선택을 하려는 경향이다."]),
  makeStep("p2", p2_sents[2],
    "셋째 문장이 드는 현상 유지 편향의 예시는?",
    ["휴대전화의 기본 설정을 바꾸지 않는 것이다.", "매번 새로운 앱을 설치하는 것이다.", "휴대전화를 자주 교체하는 것이다.", "설정을 매일 변경하는 것이다."]),
  makeStep("p2", p2_sents[3],
    "넷째 문장이 설명하는 손실 회피란?",
    ["같은 크기의 이익보다 손실에 더 민감하게 반응하는 것이다.", "손실을 전혀 두려워하지 않는 것이다.", "이익과 손실에 동일하게 반응하는 것이다.", "큰 이익을 위해 작은 손실을 감수하는 것이다."]),
  makeStep("p2", p2_sents[4],
    "다섯째 문장이 제시하는 실험 결과는?",
    ["만 원을 잃는 고통이 얻는 기쁨의 약 두 배이다.", "이익과 손실의 심리적 크기가 동일하다.", "만 원을 얻는 기쁨이 잃는 고통보다 크다.", "금액이 커질수록 손실 회피가 줄어든다."]),
  makeStep("p2", p2_sents[5],
    "여섯째 문장이 설명하는 프레이밍 효과란?",
    ["동일한 내용이라도 표현 방식에 따라 선택이 달라지는 것이다.", "내용이 다르면 선택이 달라지는 당연한 현상이다.", "어떤 표현을 써도 선택이 바뀌지 않는 것이다.", "부정적 표현이 항상 더 설득력 있는 것이다."]),
  makeStep("p2", p2_sents[6],
    "일곱째 문장이 드는 프레이밍 효과의 예시는?",
    ["성공률로 표현하면 수술 동의율이 높아지는 것이다.", "의사가 수술을 강제하는 것이다.", "환자가 모든 수술을 거부하는 것이다.", "성공률과 실패율을 동시에 말하는 것이다."]),
  makeSummaryStep("p2", p2.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["행동경제학이 밝힌 세 가지 심리적 편향의 개념과 예시이다.", "전통 경제학의 핵심 이론에 대한 설명이다.", "심리적 편향을 극복하는 구체적 방법이다.", "실험 경제학의 연구 방법론에 대한 소개이다."]),

  // p3
  makeStep("p3", p3_sents[0],
    "첫 문장에서 넛지가 등장한 배경은?",
    ["심리적 편향에 대한 이해를 바탕으로 등장했다.", "전통 경제학의 완성으로 등장했다.", "정부의 강제적 규제 필요성 때문이다.", "소비자 운동의 확산 때문이다."]),
  makeStep("p3", p3_sents[1],
    "둘째 문장이 설명하는 넛지의 정의는?",
    ["강제 없이 선택을 특정 방향으로 유도하는 부드러운 개입이다.", "법률로 특정 행동을 의무화하는 것이다.", "경제적 보상으로 행동을 유인하는 것이다.", "처벌을 통해 잘못된 행동을 억제하는 것이다."]),
  makeStep("p3", p3_sents[2],
    "셋째 문장에서 넛지의 핵심은?",
    ["선택의 자유를 제한하지 않으면서 더 나은 결과를 이끈다.", "선택의 자유를 제한하여 올바른 결과를 강제한다.", "경제적 인센티브로 행동 변화를 유도한다.", "개인의 판단보다 전문가의 결정을 우선한다."]),
  makeStep("p3", p3_sents[3],
    "넷째 문장이 드는 넛지의 대표 사례는?",
    ["회사의 퇴직연금 자동 가입 제도이다.", "정부의 강제적 세금 징수 제도이다.", "학교의 의무 교육 제도이다.", "기업의 성과급 지급 제도이다."]),
  makeStep("p3", p3_sents[4],
    "다섯째 문장이 설명하는 자동 가입 제도의 방식은?",
    ["자동으로 가입되고, 탈퇴하려면 직접 서류를 제출해야 한다.", "직원이 직접 신청해야만 가입할 수 있다.", "가입과 탈퇴 모두 자동으로 이루어진다.", "가입 후 일정 기간이 지나면 자동 탈퇴된다."]),
  makeStep("p3", p3_sents[5],
    "여섯째 문장에서 이 제도가 활용하는 편향은?",
    ["현상 유지 편향이다.", "손실 회피이다.", "프레이밍 효과이다.", "확증 편향이다."]),
  makeStep("p3", p3_sents[6],
    "일곱째 문장이 드는 또 다른 넛지 사례는?",
    ["급식실에서 건강 식품을 눈높이에 배치하는 것이다.", "급식실에서 과자를 무료로 제공하는 것이다.", "학생들에게 간식을 금지하는 것이다.", "급식 메뉴를 학생이 직접 정하는 것이다."]),
  makeSummaryStep("p3", p3.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["넛지의 개념과 대표적인 활용 사례이다.", "퇴직연금 제도의 역사적 발전 과정이다.", "학교 급식 정책의 문제점과 개선 방안이다.", "심리적 편향을 완전히 제거하는 방법이다."]),

  // p4
  makeStep("p4", p4_sents[0],
    "첫 문장에서 넛지가 활용되는 분야는?",
    ["공공 정책에서 널리 활용된다.", "개인의 사적 영역에서만 활용된다.", "군사 작전에서 주로 활용된다.", "학술 연구에서만 논의된다."]),
  makeStep("p4", p4_sents[1],
    "둘째 문장이 소개하는 영국 정부의 넛지 사례는?",
    ["체납 안내문에 이웃 납부 사실을 추가하여 납부율을 높였다.", "세금을 올려 체납을 방지했다.", "체납자에게 벌금을 부과하여 징수율을 높였다.", "세금 신고 절차를 복잡하게 만들었다."]),
  makeStep("p4", p4_sents[2],
    "셋째 문장에서 이 사례가 활용한 심리는?",
    ["다수의 행동을 따르려는 사회적 동조 심리이다.", "손실을 회피하려는 심리이다.", "현재 상태를 유지하려는 심리이다.", "새로운 것을 추구하려는 심리이다."]),
  makeStep("p4", p4_sents[3],
    "넷째 문장이 말하는 내용은?",
    ["넛지에 대한 비판도 존재한다는 것이다.", "넛지가 완벽한 해결책이라는 것이다.", "넛지는 비판받을 여지가 없다는 것이다.", "모든 학자가 넛지를 지지한다는 것이다."]),
  makeStep("p4", p4_sents[4],
    "다섯째 문장이 지적하는 넛지의 우려는?",
    ["윤리적 문제와 자율적 판단 능력 약화의 가능성이다.", "경제적 비용이 지나치게 크다는 것이다.", "효과가 전혀 없다는 것이다.", "법적으로 불법에 해당한다는 것이다."]),
  makeStep("p4", p4_sents[5],
    "마지막 문장이 주장하는 넛지 설계의 원칙은?",
    ["투명성을 확보하고 공익 부합 여부를 검토해야 한다.", "효과만 있으면 수단은 중요하지 않다.", "정부가 전적으로 결정해야 한다.", "개인의 자유를 최대한 제한해야 한다."]),
  makeSummaryStep("p4", p4.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["넛지의 공공 정책 활용 사례와 윤리적 한계이다.", "영국 정부의 세금 정책에 대한 상세한 분석이다.", "넛지가 모든 문제를 해결한다는 낙관적 전망이다.", "행동경제학의 이론적 체계에 대한 요약이다."])
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

// ────────────── 확인 문항 (8문항) ──────────────
function findConfirmRange(paragraphId, text, substring) {
  const idx = text.indexOf(substring);
  if (idx === -1) throw new Error(`확인 문항 못 찾음: "${substring}"`);
  return { paragraphId, start: idx, end: idx + substring.length };
}

const confirmQuestions = [
  { id: "q1", prompt: "지문에서 '합리적 존재'를 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p1", p1, "합리적 존재")] },
  { id: "q2", prompt: "지문에서 '심리적 편향'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p1", p1, "심리적 편향")] },
  { id: "q3", prompt: "지문에서 '현상 유지 편향'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p2", p2, "현상 유지 편향")] },
  { id: "q4", prompt: "지문에서 '손실 회피'를 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p2", p2, "손실 회피")] },
  { id: "q5", prompt: "지문에서 '프레이밍 효과'를 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p2", p2, "프레이밍 효과")] },
  { id: "q6", prompt: "지문에서 '부드러운 개입'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p3", p3, "부드러운 개입")] },
  { id: "q7", prompt: "지문에서 '투명성'을 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p4", p4, "투명성")] },
  { id: "q8", prompt: "지문에서 '사회적 동조 심리'를 찾아 클릭하세요.",
    answerRanges: [findConfirmRange("p4", p4, "사회적 동조 심리")] }
];

// ────────────── JSON 조립 ──────────────
const staticContent = {
  contentId: "dr-r3-005",
  contentType: "DAILY_READING",
  version: 1, status: "PUBLISHED",
  title: "일일 독해(러셀 3) Day 5 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_3",
  schoolGradeRange: { min: 8, max: 9 },
  area: "READING", subArea: "NONFICTION",
  competencies: ["READING"], tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300, assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 },
    confirm: {
      questions: confirmQuestions.map(q => ({
        id: q.id, prompt: q.prompt, answerRanges: q.answerRanges,
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: "ANY"
      }))
    }
  }
};

const batchItem = {
  content_type: "DAILY_READING", level_id: "RUSSELL_3",
  area: "READING", sub_area: "NONFICTION",
  day_index: 5, module_key: "reading_training", schema_version: "1.0",
  content: staticContent
};

const staticPath = "frontend/public/daily-reading/russell3/005.json";
fs.writeFileSync(staticPath, JSON.stringify(staticContent, null, 2), "utf-8");
console.log("\n✅ static 저장:", staticPath);

const batchPath = "generated/daily-batch-reading-russell3.json";
const batch = JSON.parse(fs.readFileSync(batchPath, "utf-8"));
batch.items[4] = batchItem;
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), "utf-8");
console.log("✅ 배치 업데이트:", batchPath, "items[4]");

console.log("\n=== Day 5 완료 ===");
console.log("타임라인:", timeline.length, "복기:", cards.length, "확인:", confirmQuestions.length);
