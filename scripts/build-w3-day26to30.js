#!/usr/bin/env node
// 비트겐슈타인3 Day 26~30 일일독해 콘텐츠 재작성 빌더
// 짝수 Day = LITERATURE, 홀수 Day = NONFICTION
// 목표 글자수: 1600자 ±50 (1550~1650)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-wittgenstein3.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/wittgenstein3');

// ─── 유틸리티 함수 ───
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

function findRange(paragraphs, pid, searchText) {
  const para = paragraphs.find(p => p.id === pid);
  if (!para) throw new Error(`문단 ${pid}를 찾을 수 없습니다.`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}" not found in ${pid}`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

function hashIdx(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// ─── Day 26: 문학 (LITERATURE) ───
function buildDay26() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대 희곡사에서 유치진은 사실주의 극작의 선구적 역할을 수행한 작가로 평가된다. 그는 1930년대 극예술연구회의 핵심 멤버로 활동하면서, 당시 한국 연극계를 지배하던 신파극의 과장된 감정 표현과 비현실적 서사를 극복하고자 하였다. 유치진이 추구한 사실주의 극작은 일상적 언어와 평범한 인물을 통해 당대 현실을 무대 위에 충실히 재현하는 것이었으며, 이는 입센과 체호프의 근대극 전통을 한국적 맥락에 수용한 결과였다. 그의 대표작 「토막」은 일제 강점기 농촌의 궁핍한 현실을 무대 위에 옮겨 놓은 작품으로, 극중 인물들의 대사는 실제 농민의 언어를 그대로 반영하여 사실성을 극대화하였다. 이 작품에서 유치진은 개인의 불행이 단순한 운명의 소산이 아니라 구조적 모순에서 비롯된 것임을 드러내면서, 사실주의 극이 지닌 사회적 비판의 가능성을 구체적으로 제시하였다."
    },
    {
      id: "p2",
      text: "유치진의 사실주의 극작이 지닌 또 다른 특징은 무대 지시문의 정밀한 활용에 있다. 그는 배우의 동선, 무대 장치, 조명, 소품에 이르기까지 세밀한 무대 지시를 통해 작품의 시공간적 배경을 구체적으로 구현하고자 하였다. 이러한 정밀한 무대 지시는 관객에게 극중 세계의 물질적 현실감을 전달하는 장치로 기능하였으며, 이는 당시 한국 연극이 문학적 텍스트 중심에서 공연 예술로 전환되는 과정을 반영하는 것이기도 하였다. 「토막」에서 흙벽에 바람이 들이치는 오두막의 묘사나, 「마의 태자」에서 궁궐 내부의 정교한 무대 구성은 관객이 극중 상황에 깊이 몰입할 수 있도록 하는 중요한 장치였다. 또한 유치진은 인물의 침묵과 행동을 통해 내면의 갈등을 암시하는 기법을 활용하였는데, 이는 대사 중심의 극작법에서 벗어나 행위를 통한 서사 전달이라는 근대 연극 미학을 실현하려는 시도였다."
    },
    {
      id: "p3",
      text: "유치진의 작품 세계에서 주목할 또 다른 측면은 역사극에 대한 탐구이다. 그는 사실주의적 방법론을 역사적 소재에 적용하여, 과거의 사건을 현재적 관점에서 재해석하는 역사극을 창작하였다. 「마의 태자」는 신라 멸망기를 배경으로 한 작품으로, 국가의 쇠망 앞에서 개인이 겪는 내면적 갈등과 선택의 문제를 다루고 있다. 이 작품에서 마의 태자의 고뇌는 단순한 역사적 사실의 재현이 아니라, 식민지 지식인의 시대적 고민을 우회적으로 투영한 것으로 해석되기도 한다. 유치진은 역사극을 통해 과거와 현재의 대화를 시도함으로써, 역사가 현재를 비추는 거울이 될 수 있음을 보여 주었다. 이러한 역사극의 방법론은 이후 한국 연극사에서 차범석, 이근삼 등 후대 극작가들에게 계승되어 한국 현대 희곡의 중요한 흐름을 형성하였다."
    },
    {
      id: "p4",
      text: "유치진의 극작 활동이 한국 연극사에 미친 영향은 다층적이다. 우선 그는 희곡이 단순한 문학 텍스트가 아니라 공연을 전제로 한 종합 예술의 대본임을 실천적으로 입증하였다. 이를 위해 그는 극작가이면서 동시에 연출가로 활동하였으며, 창작과 공연의 유기적 통합을 추구하였다. 또한 그는 극예술연구회와 국립극장 초대 극장장으로서 한국 연극의 제도적 기반을 구축하는 데도 기여하였다. 그러나 유치진의 사실주의는 한계점도 지닌다. 현실을 충실하게 모사하는 데 치중하면서 현실 너머의 상징적 차원이나 실험적 형식에 대한 탐구가 상대적으로 부족하였다는 평가가 있다. 이후 이강백과 같은 극작가들이 알레고리와 부조리극의 기법을 도입하면서, 한국 희곡은 사실주의의 울타리를 넘어 새로운 미학적 지평으로 확장되어 갔다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "유치진이 사실주의 극작을 통해 극복하고자 한 기존 연극의 문제점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "신파극의 과장된 감정 표현과 비현실적 서사를 극복하고자 하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "유치진의 정밀한 무대 지시가 한국 연극사에서 반영하는 변화는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "한국 연극이 문학적 텍스트 중심에서 공연 예술로 전환되는 과정을 반영하는 것이기도 하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「마의 태자」에서 마의 태자의 고뇌가 현재적으로 해석되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "식민지 지식인의 시대적 고민을 우회적으로 투영한 것으로 해석되기도 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "유치진이 역사극을 통해 보여 주고자 한 역사의 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "역사가 현재를 비추는 거울이 될 수 있음을 보여 주었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "유치진의 사실주의에 대해 제기되는 한계점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "현실 너머의 상징적 차원이나 실험적 형식에 대한 탐구가 상대적으로 부족하였다는 평가가 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "유치진 이후 한국 희곡이 사실주의를 넘어 확장되는 계기가 된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "알레고리와 부조리극의 기법을 도입하면서")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(26, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 27: 비문학 (NONFICTION) ───
function buildDay27() {
  const paragraphs = [
    {
      id: "p1",
      text: "법경제학은 법적 규칙과 제도를 경제학적 분석 도구로 평가하는 학문 분야이다. 전통적인 법학이 정의와 형평의 관점에서 법규범을 해석하고 적용하는 데 초점을 맞추었다면, 법경제학은 법적 규칙이 개인과 사회의 행동에 미치는 유인 효과와 자원 배분의 효율성을 분석하는 데 주된 관심을 둔다. 이 분야의 이론적 토대를 마련한 로널드 코스는 1960년 발표한 논문에서 거래 비용이 존재하지 않는 경우 법적 권리의 초기 배분과 무관하게 당사자 간 자발적 협상을 통해 효율적인 자원 배분이 달성된다고 주장하였다. 이를 코스 정리라 하며, 이는 법적 규칙의 효율성을 평가하는 기본적인 분석 틀로 기능한다. 그러나 현실에서는 거래 비용이 항상 존재하므로, 법적 규칙은 거래 비용을 최소화하는 방향으로 설계되어야 한다는 것이 코스 정리의 실천적 함의이다."
    },
    {
      id: "p2",
      text: "법경제학의 핵심 개념 중 하나인 효율적 위반 이론은 계약법 분야에서 중요한 논쟁을 불러일으켰다. 이 이론에 따르면, 계약 위반으로 인한 이익이 계약 이행으로 인한 이익보다 클 때에는 위반이 오히려 사회 전체의 효율성을 증가시킬 수 있다. 예컨대 물건을 제조하여 납품하기로 한 계약에서, 제3자가 더 높은 가격을 제시할 경우 원래 매수인에게 손해를 배상하고 제3자에게 납품하는 것이 사회적으로 더 효율적일 수 있다는 것이다. 이 경우 손해 배상액이 적절히 설정되면 원래 계약 당사자도 불이익을 받지 않으면서 사회 전체의 부는 증가하게 된다. 그러나 이 이론에 대해서는 계약의 도덕적 구속력을 약화시킨다는 비판이 제기된다. 계약 준수를 단순한 비용 편익 분석의 대상으로 환원하면, 약속의 이행이라는 규범적 가치가 훼손될 수 있다는 것이다."
    },
    {
      id: "p3",
      text: "불법 행위법 영역에서 법경제학은 최적 억제 이론을 통해 손해 배상의 사회적 기능을 분석한다. 러닛 핸드 판사가 제안한 핸드 공식에 따르면, 사고 방지 비용이 사고 발생 확률과 손해 규모의 곱보다 작을 때에만 주의 의무가 성립한다. 이 공식은 과실의 판단 기준을 경제적 효율성의 관점에서 정식화한 것으로, 무한한 주의 의무의 부과가 사회적으로 비효율적임을 논증하는 도구로 활용된다. 예컨대 공장이 오염 물질을 완전히 제거하기 위해 천문학적 비용을 투입하는 것보다, 일정 수준의 오염을 허용하면서 피해자에게 적절한 보상을 제공하는 것이 사회 전체적으로 더 효율적일 수 있다. 그러나 이러한 분석은 인간의 건강이나 환경적 가치를 화폐 단위로 환산할 수 있다는 전제에 기반하며, 이에 대한 윤리적 비판이 꾸준히 제기되고 있다."
    },
    {
      id: "p4",
      text: "법경제학적 분석은 형사법 분야에도 적용되어 형벌의 최적 수준에 관한 논의를 이끌었다. 게리 베커는 범죄를 합리적 선택의 결과로 분석하여, 범죄의 기대 이익이 기대 비용을 초과할 때 개인이 범죄를 선택한다고 보았다. 이 모델에 따르면 형벌의 강도와 적발 확률의 곱이 범죄의 기대 비용을 결정하며, 사회는 이 두 변수를 조절하여 범죄를 억제할 수 있다. 그러나 법경제학의 이러한 접근은 법의 본질을 효율성으로 환원한다는 근본적인 비판에 직면한다. 법은 사회 구성원 간의 정의로운 관계를 형성하고 인간의 존엄성을 보호하는 규범 체계이며, 효율성만으로는 이러한 법의 본질적 가치를 온전히 포착할 수 없다. 따라서 법경제학은 법적 분석의 유용한 도구이되, 법의 규범적 차원을 보완하는 역할로 자리매김해야 한다는 것이 균형 잡힌 시각이라 할 수 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "코스 정리가 현실에서 법적 규칙 설계에 주는 실천적 함의는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "법적 규칙은 거래 비용을 최소화하는 방향으로 설계되어야 한다는 것이 코스 정리의 실천적 함의이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "효율적 위반 이론에서 계약 위반이 정당화되는 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "계약 위반으로 인한 이익이 계약 이행으로 인한 이익보다 클 때에는 위반이 오히려 사회 전체의 효율성을 증가시킬 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "효율적 위반 이론에 대한 도덕적 비판의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "약속의 이행이라는 규범적 가치가 훼손될 수 있다는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "핸드 공식에서 주의 의무가 성립하는 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "사고 방지 비용이 사고 발생 확률과 손해 규모의 곱보다 작을 때에만 주의 의무가 성립한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "게리 베커의 모델에서 범죄의 기대 비용을 결정하는 요인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "형벌의 강도와 적발 확률의 곱이 범죄의 기대 비용을 결정하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "법경제학에 대한 근본적 비판의 핵심 논거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "효율성만으로는 이러한 법의 본질적 가치를 온전히 포착할 수 없다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(27, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 28: 문학 (LITERATURE) ───
function buildDay28() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대 소설에서 전후 문학은 한국전쟁이라는 역사적 참사가 남긴 정신적 외상을 문학적으로 형상화한 흐름이다. 전쟁의 경험은 기존의 리얼리즘적 재현 방식으로는 온전히 포착할 수 없는 성격의 것이었으며, 이에 따라 전후 세대 작가들은 새로운 서사 기법과 인물 형상화 방식을 모색하게 되었다. 손창섭은 이러한 전후 문학의 대표적 작가로, 그의 소설에 등장하는 인물들은 전쟁으로 인해 육체적·정신적으로 훼손된 존재들이다. 이들은 사회 복귀에 실패하고 무기력과 자기 파괴적 행동 속에 침잠하는데, 이는 전쟁이 개인의 삶을 근본적으로 해체하는 과정을 형상화한 것이다. 손창섭의 소설에서 인물의 육체적 결함은 단순한 사실적 묘사를 넘어 전후 사회의 도덕적 파탄을 상징하는 알레고리로 기능하며, 이를 통해 작가는 전쟁의 폭력이 개인의 존재를 어떻게 황폐화시키는지를 총체적으로 형상화한다."
    },
    {
      id: "p2",
      text: "장용학은 손창섭과 달리 실존주의적 관념의 서사화를 통해 전후 현실에 대응한 작가이다. 그의 대표작 「요한 시집」은 전통적인 리얼리즘 서사 구조를 의도적으로 해체하면서, 존재론적 질문을 소설의 전면에 배치하였다. 장용학의 소설에서 인물들은 구체적인 사회적 관계 속에서 행동하기보다는 추상적인 관념의 세계에서 사유하는 존재로 나타난다. 이러한 서사적 특징은 전쟁 이후 기존의 가치 체계가 붕괴된 상황에서, 인간 존재의 의미를 근원적으로 다시 묻고자 하는 시도로 해석된다. 특히 장용학은 인간의 자유와 선택의 문제를 반복적으로 다루면서, 사르트르적 실존주의를 한국적 맥락에서 소설적으로 변용하였다. 그의 문체는 관념적이고 비유적인 특성이 강하여, 당대의 독자들에게는 난해하다는 평가를 받기도 하였으나, 한국 소설의 지적 탐구 영역을 확장하였다는 점에서 문학사적 의의가 크다."
    },
    {
      id: "p3",
      text: "오상원의 「유예」는 전후 문학의 또 다른 성취를 보여 주는 작품이다. 이 소설은 전쟁 중 적군 포로를 사살해야 하는 상황에 놓인 병사의 내면적 갈등을 다루고 있으며, 극한 상황에서의 윤리적 선택이라는 주제를 실존주의적 시각에서 탐구한다. 주인공은 상관의 명령과 자신의 양심 사이에서 끊임없이 갈등하며, 이 유예의 시간 속에서 인간 존재의 근본적 조건에 대해 성찰한다. 오상원은 사건의 전개를 최소화하고 인물의 의식 내부에서 일어나는 심리적 과정을 밀도 있게 추적함으로써, 행동이 아닌 의식의 차원에서 서사를 구축하는 독특한 기법을 실현하였다. 이 작품에서 시간은 물리적으로 정지된 듯 느껴지며, 독자는 주인공과 함께 존재론적 불안과 윤리적 무게를 경험하게 된다. 이러한 서술 방식은 전쟁이라는 거시적 사건을 개인의 내밀한 의식 속으로 끌어들여, 전쟁의 본질을 새로운 각도에서 조명한 것으로 평가된다."
    },
    {
      id: "p4",
      text: "전후 문학은 한국 현대 소설사에서 리얼리즘과 모더니즘의 접점을 형성한 중요한 시기의 산물이다. 전쟁이라는 현실의 극단적 경험은 작가들에게 기존의 서사 형식으로는 불가능한 새로운 표현 방식을 요구하였으며, 이 과정에서 의식의 흐름 기법, 알레고리적 서사, 관념적 문체 등 다양한 모더니즘적 기법이 한국 소설에 도입되었다. 이러한 실험은 단순한 서구 문학의 모방이 아니라, 한국 사회의 고유한 역사적 경험에서 비롯된 필연적 대응이었다. 전후 작가들이 이룩한 서사적 성취는 이후 1960년대 4·19 세대 작가들에게 계승되어, 한국 소설의 미학적 다양성을 심화하는 토대가 되었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "손창섭 소설에서 인물의 육체적 결함이 수행하는 문학적 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "전후 사회의 도덕적 파탄을 상징하는 알레고리로 기능하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "장용학의 소설이 관념적 서사를 통해 탐구하고자 한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "인간 존재의 의미를 근원적으로 다시 묻고자 하는 시도로 해석된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "장용학의 문체에 대한 당대의 평가와 문학사적 의의는 각각 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "난해하다는 평가를 받기도 하였으나, 한국 소설의 지적 탐구 영역을 확장하였다는 점에서 문학사적 의의가 크다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "오상원의 「유예」에서 서사를 구축하는 독특한 방법은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "행동이 아닌 의식의 차원에서 서사를 구축하는 독특한 기법을 실현하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "전후 문학에서 모더니즘적 기법이 도입된 계기는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "전쟁이라는 현실의 극단적 경험은 작가들에게 기존의 서사 형식으로는 불가능한 새로운 표현 방식을 요구하였으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "전후 작가들의 서사적 성취가 이후 한국 소설에 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "한국 소설의 미학적 다양성을 심화하는 토대가 되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(28, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 29: 비문학 (NONFICTION) ───
function buildDay29() {
  const paragraphs = [
    {
      id: "p1",
      text: "후성유전학은 DNA 염기 서열의 변화 없이 유전자의 발현이 조절되는 현상을 연구하는 학문 분야이다. 전통적인 유전학이 유전 정보의 전달을 DNA 염기 서열의 차원에서 설명하였다면, 후성유전학은 동일한 유전체를 가진 세포가 서로 다른 기능을 수행하게 되는 메커니즘에 주목한다. 인간의 모든 세포는 동일한 DNA를 가지고 있지만, 피부 세포와 신경 세포가 전혀 다른 형태와 기능을 보이는 것은 후성유전적 조절 기제가 특정 유전자를 선택적으로 활성화하거나 억제하기 때문이다. 대표적인 후성유전적 조절 기제로는 DNA 메틸화와 히스톤 변형이 있다. DNA 메틸화는 유전자의 프로모터 영역에 메틸기가 부착되어 해당 유전자의 전사를 억제하는 현상이며, 히스톤 변형은 DNA가 감기는 단백질인 히스톤의 화학적 변형을 통해 염색질 구조를 변화시킴으로써 유전자 접근성을 조절하는 기제이다."
    },
    {
      id: "p2",
      text: "후성유전적 변화가 세대 간에 전달될 수 있다는 발견은 유전학의 패러다임에 중대한 전환을 가져왔다. 전통적인 진화생물학에서는 획득 형질의 유전을 부정하고, 오직 DNA 염기 서열의 변이만이 자연 선택의 대상이 된다고 보았다. 그러나 후성유전학적 연구는 부모 세대의 환경적 경험이 후성유전적 표지를 통해 자녀 세대에 전달될 수 있음을 시사한다. 네덜란드의 기근 연구는 이를 뒷받침하는 대표적 사례로, 1944년 겨울 기근을 경험한 임산부의 자녀가 성인이 된 후 비만과 심혈관 질환의 위험이 증가하였을 뿐만 아니라, 그 손자녀 세대에서도 유사한 건강 문제가 관찰되었다. 이는 영양 결핍이라는 환경 요인이 DNA 메틸화 패턴을 변화시켜 세대를 넘어 영향을 미칠 수 있음을 보여 주는 것이다."
    },
    {
      id: "p3",
      text: "후성유전학은 질병의 발생 기제를 이해하는 데에도 새로운 관점을 제공한다. 암의 발생에서 후성유전적 이상이 중요한 역할을 한다는 사실이 밝혀지면서, 종양 억제 유전자의 비정상적 메틸화가 암 발생의 핵심 기제 중 하나로 주목받고 있다. 정상 세포에서 활성화되어 있어야 할 종양 억제 유전자가 비정상적인 DNA 메틸화에 의해 침묵하게 되면, 세포의 무분별한 증식을 통제할 수 없게 되어 암이 발생하는 것이다. 이러한 발견은 후성유전적 변화가 DNA 돌연변이와는 달리 가역적이라는 점에서 치료적 가능성을 열어 준다. 후성유전적 치료제는 비정상적인 메틸화 패턴을 역전시켜 침묵된 종양 억제 유전자를 재활성화하는 원리로 작동하며, 현재 일부 혈액암 치료에서 실제로 사용되고 있다."
    },
    {
      id: "p4",
      text: "후성유전학의 발전은 자연과 양육이라는 전통적 이분법을 넘어선 새로운 패러다임을 제시한다. 유전자가 운명을 결정한다는 유전자 결정론은 후성유전학의 등장으로 크게 수정되었는데, 환경과 생활 습관이 유전자 발현을 변화시킬 수 있다는 사실은 개인의 건강이 유전적 소인에 의해 일방적으로 결정되는 것이 아님을 보여 주기 때문이다. 식습관, 운동, 스트레스, 환경 오염 물질 등 다양한 외부 요인이 후성유전적 변화를 유도할 수 있으며, 이러한 변화는 질병 발생 위험을 높이거나 낮출 수 있다. 이는 개인과 사회 수준에서의 건강 관리에 대한 새로운 접근법을 제시하며, 예방 의학의 과학적 근거를 강화한다. 그러나 후성유전학적 지식이 개인의 생활 습관에 대한 과도한 책임 부과로 이어지거나 사회 구조적 요인을 간과하는 방향으로 활용될 위험성에 대해서도 경계가 필요하다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "동일한 DNA를 가진 세포가 서로 다른 기능을 수행하게 되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "후성유전적 조절 기제가 특정 유전자를 선택적으로 활성화하거나 억제하기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "DNA 메틸화가 유전자 발현을 억제하는 구체적 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "유전자의 프로모터 영역에 메틸기가 부착되어 해당 유전자의 전사를 억제하는 현상이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "네덜란드 기근 연구가 후성유전학적으로 중요한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "영양 결핍이라는 환경 요인이 DNA 메틸화 패턴을 변화시켜 세대를 넘어 영향을 미칠 수 있음을 보여 주는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "종양 억제 유전자의 비정상적 메틸화가 암으로 이어지는 과정은 어떠한가?",
      answerRanges: [findRange(paragraphs, "p3", "세포의 무분별한 증식을 통제할 수 없게 되어 암이 발생하는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "후성유전적 치료제가 작동하는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "비정상적인 메틸화 패턴을 역전시켜 침묵된 종양 억제 유전자를 재활성화하는 원리로 작동하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "후성유전학적 지식의 활용과 관련하여 경계해야 할 위험성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "개인의 생활 습관에 대한 과도한 책임 부과로 이어지거나 사회 구조적 요인을 간과하는 방향으로 활용될 위험성에 대해서도 경계가 필요하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(29, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 30: 문학 (LITERATURE) ───
function buildDay30() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대시에서 김수영은 자유와 저항의 시학을 실천한 대표적 시인으로 평가된다. 그의 시 세계는 해방 이후 한국 사회의 격동적 변화를 온몸으로 체험한 지식인의 고뇌와 성찰을 담고 있다. 김수영이 추구한 자유는 단순한 정치적 자유에 머물지 않고, 문학적 형식의 자유와 일상적 삶의 자유를 아우르는 총체적 개념이었다. 그는 기존의 시적 관습과 고정된 형식을 거부하면서, 산문적 어조와 일상적 언어를 시의 영역으로 적극적으로 끌어들였다. 이러한 시적 실험은 당시 한국 시단의 주류였던 순수시와 전통 서정시의 규범에 대한 과감한 도전이었으며, 시가 현실과 유리된 미적 대상이 아니라 삶의 현장에서 발화되는 언어적 행위임을 역설하는 것이었다. 김수영에게 시를 쓴다는 것은 곧 삶을 사는 것이며, 시적 자유의 추구는 존재론적 자유의 추구와 분리될 수 없는 것이었다."
    },
    {
      id: "p2",
      text: "김수영의 시적 전환점이 된 작품은 4·19 혁명을 전후로 쓰인 일련의 시편들이다. 혁명의 경험은 김수영에게 자유라는 가치의 구체적 실현 가능성을 목도하게 하였고, 동시에 그 좌절의 경험은 보다 근원적인 자유에 대한 사유로 그를 이끌었다. 「푸른 하늘을」에서 김수영은 혁명의 열기 속에서 체감한 자유의 감격을 노래하면서도, 그 자유가 일상의 영역으로 침투하지 못하는 현실에 대한 날카로운 인식을 동시에 드러내고 있다. 이러한 이중적 태도는 김수영 시의 핵심적 특징으로, 혁명과 일상 사이의 긴장 관계를 끊임없이 사유함으로써 한국 참여시의 깊이를 한 차원 끌어올렸다. 그는 거대한 담론으로서의 혁명이 아니라, 일상의 미시적 영역에서부터 변혁이 시작되어야 한다는 인식에 도달하였으며, 이는 그의 후기 시 세계를 관통하는 핵심적 주제 의식이 되었다."
    },
    {
      id: "p3",
      text: "「풀」은 김수영의 이러한 시적 사유가 가장 응축적으로 형상화된 작품이다. 이 시에서 풀은 바람에 눕지만 바람보다 먼저 일어나는 존재로 묘사되며, 이는 억압적 현실에 굴하지 않는 민중적 저항의 힘을 상징한다. 그러나 이 시의 의미는 단순한 저항의 알레고리에 머물지 않는다. 풀이 눕는 행위와 일어나는 행위가 반복되는 구조는, 좌절과 재기의 순환적 리듬을 구현하면서 삶의 회복력에 대한 근본적인 믿음을 표현하고 있다. 또한 바람이 먼 데서 눕고 풀이 눕고 날이 흐리고 풀이 눕는다는 구절에서 보이는 반복과 변주의 기법은, 단순한 의미 전달을 넘어 시적 리듬 자체가 의미를 생성하는 음악적 효과를 창출한다. 이처럼 「풀」은 내용과 형식이 유기적으로 결합된 작품으로, 한국 현대시의 대표적 성취로 평가받는다."
    },
    {
      id: "p4",
      text: "김수영이 한국 시사에 남긴 유산은 다면적이다. 우선 그는 시의 정치성과 미학성이 대립하는 것이 아니라 상호 보완적일 수 있음을 실천적으로 입증하였다. 당시 한국 시단은 참여와 순수라는 이분법적 구도로 양분되어 있었으나, 김수영은 이러한 구도 자체를 거부하면서 미학적 실험과 현실 참여가 동시에 추구될 수 있음을 자신의 시를 통해 보여 주었다. 또한 그의 시론에서 반복적으로 강조되는 온몸의 시학은, 시가 지적 유희나 언어적 기교의 산물이 아니라 시인의 전 존재를 건 실존적 행위여야 한다는 윤리적 요구를 담고 있다. 이러한 김수영의 시적 유산은 이후 신동엽, 김지하, 고은 등 한국 참여시의 전통을 형성하는 핵심적 자양분이 되었으며, 오늘날에도 시와 현실의 관계를 사유하는 데 있어 빠질 수 없는 참조점으로 기능하고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "김수영이 기존 시적 관습을 거부하며 도입한 시적 요소는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "산문적 어조와 일상적 언어를 시의 영역으로 적극적으로 끌어들였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "4·19 혁명 이후 김수영이 도달한 변혁에 대한 인식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "일상의 미시적 영역에서부터 변혁이 시작되어야 한다는 인식에 도달하였으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「풀」에서 풀이 눕고 일어나는 반복 구조가 표현하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "좌절과 재기의 순환적 리듬을 구현하면서 삶의 회복력에 대한 근본적인 믿음을 표현하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "「풀」에서 반복과 변주의 기법이 창출하는 효과는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "시적 리듬 자체가 의미를 생성하는 음악적 효과를 창출한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "김수영의 온몸의 시학이 담고 있는 요구는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "시인의 전 존재를 건 실존적 행위여야 한다는 윤리적 요구를 담고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "김수영의 시적 유산이 한국 참여시 전통에 미친 구체적 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "신동엽, 김지하, 고은 등 한국 참여시의 전통을 형성하는 핵심적 자양분이 되었으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(30, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  // 정독 타임라인 자동 생성
  const timeline = buildTimeline(paragraphs);
  // 복기 카드 8장
  const recall = buildRecallCards(paragraphs, 8);

  const dayStr = String(dayIndex).padStart(3, '0');
  const contentId = `dr-w3-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(비트겐슈타인 3) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "WITTGENSTEIN_3",
    schoolGradeRange: { min: 11, max: 12 },
    area: "READING",
    subArea,
    competencies: ["READING"],
    tags: ["daily"],
    access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480,
    assets: {},
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline },
      recall,
      confirm: { questions: confirmQuestions }
    }
  };
}

function buildTimeline(paragraphs) {
  const timeline = [];
  let stepNum = 1;

  // 각 문단에서 문장 추출
  const paraSentMap = {};
  for (const p of paragraphs) {
    paraSentMap[p.id] = findSentences(p.text);
  }

  for (const para of paragraphs) {
    const sentences = paraSentMap[para.id];

    // 문장별 하이라이트 + 4지선다
    for (let si = 0; si < sentences.length; si++) {
      const sent = sentences[si];
      const correctText = truncate(sent.text, 80);

      // 오답: 다른 문단에서 문장 선택
      const wrongTexts = [];
      const otherParas = paragraphs.filter(p => p.id !== para.id);
      for (let oi = 0; oi < otherParas.length && wrongTexts.length < 3; oi++) {
        const opSents = paraSentMap[otherParas[oi].id];
        const idx = (si + oi) % opSents.length;
        wrongTexts.push(truncate(opSents[idx].text, 80));
      }

      const choices = shuffleChoices(correctText, wrongTexts, `s${stepNum}`);

      timeline.push({
        stepId: `s${stepNum++}`,
        highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] },
        question: {
          prompt: "하이라이트된 문장의 내용으로 알맞은 것은?",
          choices: choices.list,
          answerId: choices.answerId,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }

    // 문단 중심내용 문제
    const firstSent = sentences[0];
    const centralCorrect = truncate(firstSent.text, 80);
    const centralWrongs = [];
    const otherParas = paragraphs.filter(p => p.id !== para.id);
    for (const op of otherParas) {
      const opSents = paraSentMap[op.id];
      centralWrongs.push(truncate(opSents[0].text, 80));
    }
    const centralChoices = shuffleChoices(centralCorrect, centralWrongs, para.id + "_central");

    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        choices: centralChoices.list,
        answerId: centralChoices.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }

  return timeline;
}

function truncate(text, maxLen) {
  return text.length > maxLen ? text.substring(0, maxLen) : text;
}

function shuffleChoices(correct, wrongs, seed) {
  const items = [correct, ...wrongs.slice(0, 3)];
  // 정답 위치 결정
  const pos = hashIdx(seed) % 4;
  // 정답을 pos 위치로 이동
  if (pos !== 0) {
    const temp = items[0];
    items[0] = items[pos];
    items[pos] = temp;
  }
  const ids = ["A", "B", "C", "D"];
  const list = items.map((text, i) => ({ id: ids[i], text }));
  const answerId = ids[items.indexOf(correct)];
  return { list, answerId };
}

// 복기 카드 빌더 (8장)
function buildRecallCards(paragraphs, cardCount) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / cardCount);

  const cards = [];
  const correctOrder = [];

  for (let i = 0; i < cardCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    const cardText = fullText.substring(start, end);
    const cardId = `c${i + 1}`;
    cards.push({ id: cardId, text: cardText });
    correctOrder.push(cardId);
  }

  return { cards, correctOrder, seedPenalty: 1 };
}

// ─── 배치 아이템 래퍼 ───
function wrapBatchItem(content, dayIndex, subArea) {
  return {
    content_type: "DAILY_READING",
    level_id: "WITTGENSTEIN_3",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content
  };
}

// ─── 메인 실행 ───
function main() {
  console.log("=== 비트겐슈타인3 Day 26~30 빌드 시작 ===\n");

  const contents = [
    buildDay26(),
    buildDay27(),
    buildDay28(),
    buildDay29(),
    buildDay30()
  ];

  // 검증
  let allValid = true;
  for (const c of contents) {
    const len = c.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
    const dayNum = parseInt(c.contentId.split('-')[2]);
    if (len < 1550 || len > 1650) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1550~1650)`);
      allValid = false;
    } else {
      console.log(`Day ${dayNum}: ${len}자 (적합)`);
    }

    if (c.payload.recall.cards.length !== 8) {
      console.warn(`경고: Day ${dayNum} 복기 카드 ${c.payload.recall.cards.length}장 (8장 필요)`);
      allValid = false;
    }

    const qCount = c.payload.confirm.questions.length;
    if (qCount < 5 || qCount > 8) {
      console.warn(`경고: Day ${dayNum} 확인 문항 ${qCount}개 (5~8개 필요)`);
      allValid = false;
    }
  }

  // static 파일 생성
  for (const c of contents) {
    const dayNum = parseInt(c.contentId.split('-')[2]);
    const dayStr = String(dayNum).padStart(3, '0');
    const filePath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(filePath, JSON.stringify(c, null, 2), 'utf8');
    console.log(`생성: ${dayStr}.json`);
  }

  // 배치 파일 갱신 (최신 상태 다시 읽기)
  console.log("\n배치 파일 갱신 중...");
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`현재 배치 items 수: ${batchData.items.length}`);

  const dayIndices = [26, 27, 28, 29, 30];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1;
    const subArea = contents[i].subArea;
    const batchItem = wrapBatchItem(contents[i], dayIdx, subArea);

    if (batchData.items[batchIdx]) {
      console.log(`교체: items[${batchIdx}] (${batchData.items[batchIdx].content.contentId} → ${contents[i].contentId})`);
    }
    batchData.items[batchIdx] = batchItem;
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료`);

  console.log("\n=== 빌드 완료 ===");
}

main();
