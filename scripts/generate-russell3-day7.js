// 러셀3 Day 7 - 비문학 (과학기술: 인공지능의 학습 원리)
// 중2~중3 수준, 1300자 ±50

const fs = require('fs');

const p1 = "인공지능이란 인간의 지능적 행동을 컴퓨터가 모방할 수 있도록 만든 기술을 말한다. 오늘날 인공지능은 음성 인식, 이미지 분류, 번역, 자율 주행 등 다양한 분야에서 활용되고 있다. 이러한 인공지능의 핵심에는 기계 학습이 있다. 기계 학습이란 컴퓨터가 명시적인 프로그래밍 없이 데이터로부터 스스로 규칙이나 패턴을 찾아내는 방법이다. 예를 들어 수천 장의 고양이 사진을 컴퓨터에 입력하면, 컴퓨터는 스스로 고양이의 특징을 파악하여 새로운 사진에서도 고양이를 구별할 수 있게 된다. 이 과정에서 사람이 일일이 규칙을 만들어 줄 필요가 없다는 점이 기계 학습의 가장 큰 장점이다.";

const p2 = "기계 학습의 대표적인 방식으로는 지도 학습, 비지도 학습, 강화 학습의 세 가지가 있다. 지도 학습은 정답이 포함된 데이터를 이용하여 학습하는 방식이다. 예를 들어 이메일이 스팸인지 아닌지를 표시한 대량의 데이터를 주면, 컴퓨터는 스팸의 특징을 학습하여 새로운 이메일의 스팸 여부를 판단하게 된다. 비지도 학습은 정답이 없는 데이터에서 숨겨진 구조나 패턴을 찾아내는 방식이다. 고객의 구매 이력을 분석하여 비슷한 성향의 고객을 묶어 주는 것이 대표적 사례이다. 강화 학습은 시행착오를 통해 최적의 행동을 찾아가는 방식으로, 바둑 인공지능 알파고가 이 방식으로 학습하여 세계 최고 수준의 실력을 갖추었다.";

const p3 = "기계 학습에서 중요한 것은 데이터의 양과 질이다. 충분한 양의 데이터가 있어야 컴퓨터가 정확한 패턴을 파악할 수 있으며, 데이터에 오류나 편향이 있으면 학습 결과도 왜곡된다. 예를 들어 특정 인종의 얼굴 사진만으로 학습한 인공지능은 다른 인종을 정확히 인식하지 못하는 문제가 발생할 수 있다. 이를 데이터 편향이라 하며, 인공지능의 공정성과 직결되는 중요한 이슈이다. 또한 학습 과정에서 과적합이라는 문제가 발생하기도 한다. 과적합이란 컴퓨터가 학습 데이터에만 지나치게 맞추어져 새로운 데이터에 대해서는 정확도가 떨어지는 현상을 말한다. 이를 방지하기 위해 학습 데이터와 별도의 검증 데이터를 나누어 사용하는 방법이 활용된다.";

const p4 = "인공지능과 기계 학습의 발전은 우리 사회에 큰 변화를 가져오고 있다. 의료 분야에서는 인공지능이 엑스선 사진을 분석하여 질병을 조기에 발견하는 데 활용되며, 교육 분야에서는 학생 개개인의 학습 수준에 맞춘 맞춤형 교육이 가능해지고 있다. 그러나 인공지능이 발전할수록 일자리 대체, 개인 정보 침해, 알고리즘의 불투명성 등의 문제도 함께 대두된다. 인공지능이 내린 결정의 근거를 사람이 이해하기 어려운 경우가 많아, 이를 설명 가능한 인공지능으로 만들려는 연구도 활발히 진행되고 있다. 인공지능 기술의 혜택을 누리면서도 그 위험을 최소화하려면, 기술적 발전과 함께 윤리적 기준을 마련하는 노력이 반드시 필요하다.";

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

function findRange(text, substring) {
  const idx = text.indexOf(substring);
  if (idx === -1) throw new Error(`못 찾음: "${substring.substring(0, 40)}..."`);
  return { start: idx, end: idx + substring.length };
}

const p1_sents = [
  findRange(p1, "인공지능이란 인간의 지능적 행동을 컴퓨터가 모방할 수 있도록 만든 기술을 말한다."),
  findRange(p1, "오늘날 인공지능은 음성 인식, 이미지 분류, 번역, 자율 주행 등 다양한 분야에서 활용되고 있다."),
  findRange(p1, "이러한 인공지능의 핵심에는 기계 학습이 있다."),
  findRange(p1, "기계 학습이란 컴퓨터가 명시적인 프로그래밍 없이 데이터로부터 스스로 규칙이나 패턴을 찾아내는 방법이다."),
  findRange(p1, "예를 들어 수천 장의 고양이 사진을 컴퓨터에 입력하면, 컴퓨터는 스스로 고양이의 특징을 파악하여 새로운 사진에서도 고양이를 구별할 수 있게 된다."),
  findRange(p1, "이 과정에서 사람이 일일이 규칙을 만들어 줄 필요가 없다는 점이 기계 학습의 가장 큰 장점이다.")
];

const p2_sents = [
  findRange(p2, "기계 학습의 대표적인 방식으로는 지도 학습, 비지도 학습, 강화 학습의 세 가지가 있다."),
  findRange(p2, "지도 학습은 정답이 포함된 데이터를 이용하여 학습하는 방식이다."),
  findRange(p2, "예를 들어 이메일이 스팸인지 아닌지를 표시한 대량의 데이터를 주면, 컴퓨터는 스팸의 특징을 학습하여 새로운 이메일의 스팸 여부를 판단하게 된다."),
  findRange(p2, "비지도 학습은 정답이 없는 데이터에서 숨겨진 구조나 패턴을 찾아내는 방식이다."),
  findRange(p2, "고객의 구매 이력을 분석하여 비슷한 성향의 고객을 묶어 주는 것이 대표적 사례이다."),
  findRange(p2, "강화 학습은 시행착오를 통해 최적의 행동을 찾아가는 방식으로, 바둑 인공지능 알파고가 이 방식으로 학습하여 세계 최고 수준의 실력을 갖추었다.")
];

const p3_sents = [
  findRange(p3, "기계 학습에서 중요한 것은 데이터의 양과 질이다."),
  findRange(p3, "충분한 양의 데이터가 있어야 컴퓨터가 정확한 패턴을 파악할 수 있으며, 데이터에 오류나 편향이 있으면 학습 결과도 왜곡된다."),
  findRange(p3, "예를 들어 특정 인종의 얼굴 사진만으로 학습한 인공지능은 다른 인종을 정확히 인식하지 못하는 문제가 발생할 수 있다."),
  findRange(p3, "이를 데이터 편향이라 하며, 인공지능의 공정성과 직결되는 중요한 이슈이다."),
  findRange(p3, "또한 학습 과정에서 과적합이라는 문제가 발생하기도 한다."),
  findRange(p3, "과적합이란 컴퓨터가 학습 데이터에만 지나치게 맞추어져 새로운 데이터에 대해서는 정확도가 떨어지는 현상을 말한다."),
  findRange(p3, "이를 방지하기 위해 학습 데이터와 별도의 검증 데이터를 나누어 사용하는 방법이 활용된다.")
];

const p4_sents = [
  findRange(p4, "인공지능과 기계 학습의 발전은 우리 사회에 큰 변화를 가져오고 있다."),
  findRange(p4, "의료 분야에서는 인공지능이 엑스선 사진을 분석하여 질병을 조기에 발견하는 데 활용되며, 교육 분야에서는 학생 개개인의 학습 수준에 맞춘 맞춤형 교육이 가능해지고 있다."),
  findRange(p4, "그러나 인공지능이 발전할수록 일자리 대체, 개인 정보 침해, 알고리즘의 불투명성 등의 문제도 함께 대두된다."),
  findRange(p4, "인공지능이 내린 결정의 근거를 사람이 이해하기 어려운 경우가 많아, 이를 설명 가능한 인공지능으로 만들려는 연구도 활발히 진행되고 있다."),
  findRange(p4, "인공지능 기술의 혜택을 누리면서도 그 위험을 최소화하려면, 기술적 발전과 함께 윤리적 기준을 마련하는 노력이 반드시 필요하다.")
];

// 검증
for (const [pid, sents, text] of [["p1", p1_sents, p1], ["p2", p2_sents, p2], ["p3", p3_sents, p3], ["p4", p4_sents, p4]]) {
  console.log(`\n${pid} (${text.length}자, ${sents.length}문장):`);
  for (let i = 0; i < sents.length; i++) {
    const s = sents[i];
    console.log(`  [${s.start}, ${s.end}] "${text.substring(s.start, Math.min(s.end, s.start+50))}..."`);
  }
}

let stepCounter = 0;
function makeStep(pid, range, prompt, choices) {
  stepCounter++;
  return {
    stepId: `s${stepCounter}`,
    highlight: { ranges: [{ paragraphId: pid, start: range.start, end: range.end }] },
    question: {
      prompt, choices: choices.map((c, i) => ({ id: ["A","B","C","D"][i], text: c })),
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  };
}
function makeSummary(pid, len, prompt, choices) {
  stepCounter++;
  return {
    stepId: `s${stepCounter}`,
    highlight: { ranges: [{ paragraphId: pid, start: 0, end: len }] },
    question: {
      prompt, choices: choices.map((c, i) => ({ id: ["A","B","C","D"][i], text: c })),
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  };
}

const timeline = [
  // p1
  makeStep("p1", p1_sents[0],
    "첫 문장이 정의하는 인공지능이란?",
    ["인간의 지능적 행동을 컴퓨터가 모방하도록 만든 기술이다.", "인간의 감정을 컴퓨터에 이식하는 기술이다.", "컴퓨터의 처리 속도를 높이는 하드웨어 기술이다.", "인간이 컴퓨터의 명령을 따르게 하는 기술이다."]),
  makeStep("p1", p1_sents[1],
    "둘째 문장이 나열하는 인공지능의 활용 분야는?",
    ["음성 인식, 이미지 분류, 번역, 자율 주행 등이다.", "음악 작곡, 요리, 청소, 건축 등이다.", "농업, 어업, 임업, 광업 등이다.", "수학, 물리, 화학, 생물 등이다."]),
  makeStep("p1", p1_sents[2],
    "셋째 문장에서 인공지능의 핵심으로 언급된 것은?",
    ["기계 학습이다.", "반도체 기술이다.", "인터넷 통신이다.", "데이터베이스이다."]),
  makeStep("p1", p1_sents[3],
    "넷째 문장이 설명하는 기계 학습의 정의는?",
    ["데이터로부터 스스로 규칙이나 패턴을 찾아내는 방법이다.", "사람이 직접 규칙을 프로그래밍하는 방법이다.", "컴퓨터의 연산 속도를 높이는 방법이다.", "데이터를 삭제하여 저장 공간을 확보하는 방법이다."]),
  makeStep("p1", p1_sents[4],
    "다섯째 문장이 드는 기계 학습의 예시는?",
    ["고양이 사진을 입력하면 스스로 특징을 파악하여 구별한다.", "사람이 고양이의 특징을 일일이 입력해 준다.", "고양이 사진 한 장으로 모든 동물을 구별한다.", "컴퓨터가 고양이를 직접 관찰하여 학습한다."]),
  makeStep("p1", p1_sents[5],
    "마지막 문장에서 기계 학습의 가장 큰 장점은?",
    ["사람이 일일이 규칙을 만들어 줄 필요가 없다.", "컴퓨터의 전력 소비가 줄어든다.", "모든 데이터를 완벽하게 처리한다.", "오류가 전혀 발생하지 않는다."]),
  makeSummary("p1", p1.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["인공지능의 핵심인 기계 학습의 개념과 장점이다.", "인공지능의 역사적 발전 과정에 대한 설명이다.", "인공지능이 인간을 완전히 대체한다는 주장이다.", "기계 학습의 구체적인 프로그래밍 방법이다."]),

  // p2
  makeStep("p2", p2_sents[0],
    "첫 문장이 나열하는 기계 학습의 세 가지 방식은?",
    ["지도 학습, 비지도 학습, 강화 학습이다.", "분류, 회귀, 군집화이다.", "입력, 처리, 출력이다.", "수집, 분석, 예측이다."]),
  makeStep("p2", p2_sents[1],
    "둘째 문장이 설명하는 지도 학습의 특징은?",
    ["정답이 포함된 데이터를 이용하여 학습한다.", "정답 없이 스스로 패턴을 발견한다.", "시행착오를 반복하며 학습한다.", "사람의 지시를 그대로 따른다."]),
  makeStep("p2", p2_sents[2],
    "셋째 문장이 드는 지도 학습의 예시는?",
    ["스팸 표시된 이메일 데이터로 스팸 여부를 판단한다.", "이메일을 무작위로 삭제한다.", "사용자가 직접 스팸을 분류한다.", "모든 이메일을 스팸으로 처리한다."]),
  makeStep("p2", p2_sents[3],
    "넷째 문장이 설명하는 비지도 학습의 특징은?",
    ["정답 없는 데이터에서 숨겨진 구조나 패턴을 찾는다.", "정답이 포함된 데이터로 학습한다.", "보상과 벌을 통해 행동을 학습한다.", "사람이 직접 패턴을 알려 준다."]),
  makeStep("p2", p2_sents[4],
    "다섯째 문장이 드는 비지도 학습의 사례는?",
    ["고객의 구매 이력을 분석하여 유사 고객을 묶는 것이다.", "고객에게 직접 설문을 하는 것이다.", "가격을 자동으로 조정하는 것이다.", "제품을 무작위로 추천하는 것이다."]),
  makeStep("p2", p2_sents[5],
    "여섯째 문장에서 강화 학습의 사례로 든 것은?",
    ["바둑 인공지능 알파고이다.", "스팸 필터 프로그램이다.", "고객 분류 시스템이다.", "자동 번역 서비스이다."]),
  makeSummary("p2", p2.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["기계 학습의 세 가지 방식과 각각의 특징 및 사례이다.", "지도 학습만이 유일한 기계 학습 방법이라는 주장이다.", "강화 학습이 다른 방식보다 우월하다는 설명이다.", "기계 학습 방식 간의 우열을 비교한 평가이다."]),

  // p3
  makeStep("p3", p3_sents[0],
    "첫 문장에서 기계 학습에 중요한 것은?",
    ["데이터의 양과 질이다.", "컴퓨터의 크기와 가격이다.", "프로그래머의 수와 경험이다.", "인터넷 속도와 안정성이다."]),
  makeStep("p3", p3_sents[1],
    "둘째 문장이 말하는 데이터 오류의 결과는?",
    ["학습 결과도 왜곡된다.", "컴퓨터가 자동으로 오류를 수정한다.", "학습 속도만 느려진다.", "데이터가 자동으로 삭제된다."]),
  makeStep("p3", p3_sents[2],
    "셋째 문장이 드는 데이터 편향의 예시는?",
    ["특정 인종 사진으로만 학습하면 다른 인종을 인식 못 한다.", "모든 인종의 사진을 동일하게 학습한다.", "인공지능이 인종을 구별하지 않는다.", "사진의 해상도가 낮아 인식이 안 된다."]),
  makeStep("p3", p3_sents[3],
    "넷째 문장에서 데이터 편향이 직결되는 문제는?",
    ["인공지능의 공정성이다.", "인공지능의 처리 속도이다.", "인공지능의 저장 용량이다.", "인공지능의 전력 소비이다."]),
  makeStep("p3", p3_sents[4],
    "다섯째 문장이 언급하는 또 다른 문제는?",
    ["과적합이라는 문제이다.", "데이터 부족 문제이다.", "하드웨어 고장 문제이다.", "네트워크 단절 문제이다."]),
  makeStep("p3", p3_sents[5],
    "여섯째 문장이 정의하는 과적합이란?",
    ["학습 데이터에만 맞추어져 새 데이터에 정확도가 떨어지는 것이다.", "모든 데이터에 완벽하게 맞는 모델을 만드는 것이다.", "학습 데이터가 부족하여 패턴을 못 찾는 것이다.", "컴퓨터가 학습을 거부하는 것이다."]),
  makeStep("p3", p3_sents[6],
    "마지막 문장에서 과적합 방지 방법은?",
    ["학습 데이터와 별도의 검증 데이터를 나누어 사용한다.", "학습 데이터의 양을 줄인다.", "검증 과정 없이 바로 실전에 투입한다.", "모든 데이터를 하나로 합쳐 사용한다."]),
  makeSummary("p3", p3.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["데이터 편향과 과적합 등 기계 학습의 주요 문제와 해결 방안이다.", "기계 학습이 항상 완벽한 결과를 낸다는 주장이다.", "데이터 수집 방법에 대한 상세한 기술적 설명이다.", "과적합이 기계 학습에 도움이 된다는 설명이다."]),

  // p4
  makeStep("p4", p4_sents[0],
    "첫 문장이 말하는 인공지능의 영향은?",
    ["우리 사회에 큰 변화를 가져오고 있다.", "사회에 별다른 영향을 미치지 않는다.", "오직 경제 분야에만 영향을 준다.", "과거에만 영향을 미쳤고 현재는 아니다."]),
  makeStep("p4", p4_sents[1],
    "둘째 문장이 드는 인공지능의 활용 분야 예시는?",
    ["의료 분야의 질병 조기 발견과 교육 분야의 맞춤형 학습이다.", "농업의 자동 수확과 건설의 자동 시공이다.", "군사 분야의 무기 개발과 우주 탐사이다.", "음식 배달과 택시 호출 서비스이다."]),
  makeStep("p4", p4_sents[2],
    "셋째 문장이 지적하는 인공지능 발전의 문제는?",
    ["일자리 대체, 개인 정보 침해, 알고리즘 불투명성이다.", "전력 소비 증가와 환경 오염이다.", "컴퓨터 가격 상승과 보급률 하락이다.", "인터넷 속도 저하와 통신 장애이다."]),
  makeStep("p4", p4_sents[3],
    "넷째 문장에서 설명 가능한 인공지능 연구의 이유는?",
    ["인공지능 결정의 근거를 사람이 이해하기 어려워서이다.", "인공지능의 연산 속도가 느려서이다.", "인공지능의 전력 소비가 커서이다.", "인공지능의 가격이 비싸서이다."]),
  makeStep("p4", p4_sents[4],
    "마지막 문장이 주장하는 바는?",
    ["기술 발전과 함께 윤리적 기준 마련이 반드시 필요하다.", "기술 발전만으로 모든 문제가 해결된다.", "윤리적 기준은 기술 발전을 방해한다.", "인공지능 개발을 전면 중단해야 한다."]),
  makeSummary("p4", p4.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["인공지능의 사회적 영향과 윤리적 과제이다.", "인공지능이 모든 직업을 대체한다는 전망이다.", "인공지능 기술의 구체적인 개발 방법이다.", "인공지능이 교육 분야에서만 활용된다는 주장이다."])
];

// 복기 카드 (8)
const fullText = p1 + " " + p2 + " " + p3 + " " + p4;
const cardCount = 8;
const cardLen = Math.ceil(fullText.length / cardCount);
const cards = [];
for (let i = 0; i < cardCount; i++) {
  const start = i * cardLen;
  const end = Math.min(start + cardLen, fullText.length);
  cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
}

// 확인 문항 (8)
function findConfirm(pid, text, sub) {
  const idx = text.indexOf(sub);
  if (idx === -1) throw new Error(`확인: "${sub}"`);
  return { paragraphId: pid, start: idx, end: idx + sub.length };
}

const confirmQuestions = [
  { id: "q1", prompt: "지문에서 '기계 학습'을 찾아 클릭하세요.",
    answerRanges: [findConfirm("p1", p1, "기계 학습")] },
  { id: "q2", prompt: "지문에서 '명시적인 프로그래밍'을 찾아 클릭하세요.",
    answerRanges: [findConfirm("p1", p1, "명시적인 프로그래밍")] },
  { id: "q3", prompt: "지문에서 '지도 학습'을 찾아 클릭하세요.",
    answerRanges: [findConfirm("p2", p2, "지도 학습")] },
  { id: "q4", prompt: "지문에서 '강화 학습'을 찾아 클릭하세요.",
    answerRanges: [findConfirm("p2", p2, "강화 학습")] },
  { id: "q5", prompt: "지문에서 '데이터 편향'을 찾아 클릭하세요.",
    answerRanges: [findConfirm("p3", p3, "데이터 편향")] },
  { id: "q6", prompt: "지문에서 '과적합'을 찾아 클릭하세요.",
    answerRanges: [findConfirm("p3", p3, "과적합")] },
  { id: "q7", prompt: "지문에서 '불투명성'을 찾아 클릭하세요.",
    answerRanges: [findConfirm("p4", p4, "불투명성")] },
  { id: "q8", prompt: "지문에서 '윤리적 기준'을 찾아 클릭하세요.",
    answerRanges: [findConfirm("p4", p4, "윤리적 기준")] }
];

// JSON
const staticContent = {
  contentId: "dr-r3-007", contentType: "DAILY_READING",
  version: 1, status: "PUBLISHED",
  title: "일일 독해(러셀 3) Day 7 비문학",
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
  day_index: 7, module_key: "reading_training", schema_version: "1.0",
  content: staticContent
};

fs.writeFileSync("frontend/public/daily-reading/russell3/007.json", JSON.stringify(staticContent, null, 2), "utf-8");
console.log("\n✅ static 저장: 007.json");

const batch = JSON.parse(fs.readFileSync("generated/daily-batch-reading-russell3.json", "utf-8"));
batch.items[6] = batchItem;
fs.writeFileSync("generated/daily-batch-reading-russell3.json", JSON.stringify(batch, null, 2), "utf-8");
console.log("✅ 배치 업데이트: items[6]");

console.log("\n=== Day 7 완료 ===");
console.log("타임라인:", timeline.length, "복기:", cards.length, "확인:", confirmQuestions.length);
