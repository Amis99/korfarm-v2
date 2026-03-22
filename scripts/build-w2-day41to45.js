#!/usr/bin/env node
// 비트겐슈타인2 Day 41~45 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION, 짝수 Day = LITERATURE
// 목표 글자수: 1500자 ±50 (1450~1550)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-wittgenstein2.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/wittgenstein2');

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

// ─── Day 41: 비문학 (NONFICTION) — 복잡계 과학과 창발적 질서 ───
function buildDay41() {
  const paragraphs = [
    {
      id: "p1",
      text: "복잡계 과학은 수많은 구성 요소가 상호작용하면서 전체 차원에서 예측할 수 없는 새로운 성질이 나타나는 현상을 연구하는 분야이다. 전통적인 환원주의 과학이 복잡한 현상을 단순한 요소로 분해하여 이해하고자 하였다면, 복잡계 과학은 구성 요소들의 상호작용에서 비롯되는 집합적 행동에 주목한다. 개미 한 마리의 행동을 아무리 정밀하게 분석하더라도 군집 전체가 보여 주는 정교한 분업이나 경로 최적화를 설명할 수 없듯이, 복잡계에서는 부분의 합이 전체를 설명하지 못한다. 이를 창발이라 하며, 이는 복잡계 과학의 핵심 개념이다. 창발적 질서는 외부의 설계자나 중앙 통제 없이 개별 구성 요소들의 국소적 상호작용만으로 자발적으로 형성되며, 이 점에서 인위적 설계와 근본적으로 구별된다."
    },
    {
      id: "p2",
      text: "창발적 질서의 대표적 사례는 자기 조직화 현상에서 발견된다. 베나르 대류 현상은 자기 조직화의 전형적 예로, 아래에서 균일하게 가열된 유체가 일정한 온도 차이에 도달하면 무질서한 열 확산 대신 규칙적인 육각형 대류 세포가 자발적으로 형성된다. 이 질서는 외부에서 부과된 것이 아니라 유체 분자들의 집단적 운동에서 자연스럽게 출현한 것이다. 생물학에서도 점균류의 집합 현상은 유사한 원리를 보여 준다. 영양분이 부족해지면 독립적으로 생활하던 단세포 아메바들이 화학 신호를 매개로 모여 다세포 구조를 형성하고, 이 구조는 포자를 퍼뜨리기 위한 자실체로 분화한다. 이처럼 단순한 규칙을 따르는 개체들이 집합적으로 복잡한 구조를 만들어 내는 것은 생명 현상의 근본적 특징이다."
    },
    {
      id: "p3",
      text: "복잡계 과학은 비선형 동역학과 밀접한 관련을 맺고 있다. 선형 체계에서는 원인과 결과가 비례하지만, 비선형 체계에서는 작은 변화가 되먹임을 통해 증폭되어 거대한 결과를 초래할 수 있다. 에드워드 로렌츠가 발견한 나비 효과는 이러한 비선형성의 극적 사례로서, 대기라는 복잡계에서 초기 조건의 미세한 차이가 전혀 다른 기상 패턴을 만들어 낼 수 있음을 보여 주었다. 이 발견은 장기 기상 예측의 원리적 한계를 드러내는 동시에, 결정론적 체계에서도 예측 불가능성이 발생할 수 있음을 입증하였다. 복잡계가 보여 주는 초기 조건에 대한 민감한 의존성은 환원주의적 예측 모형의 근본적 한계를 시사한다."
    },
    {
      id: "p4",
      text: "복잡계 과학의 통찰은 사회과학과 경제학에도 확장 적용되고 있다. 주식 시장의 급격한 가격 변동이나 도시의 자생적 발전은 중앙의 계획이 아닌 수많은 행위자의 분산된 의사 결정이 상호작용하면서 만들어 낸 창발적 현상으로 이해될 수 있다. 경제학자 프리드리히 하이에크는 시장 가격 체계를 자생적 질서의 대표적 사례로 제시하면서, 어떤 중앙 계획자도 시장 참여자 전체가 보유한 분산된 지식을 종합할 수 없다고 주장하였다. 그러나 복잡계적 관점은 자생적 질서가 반드시 최적의 결과를 보장하지는 않음도 보여 준다. 금융 위기나 환경 파괴처럼 개별적으로 합리적인 행동이 집합적으로 파괴적인 결과를 낳는 현상 역시 복잡계의 창발적 속성이며, 이러한 부정적 창발을 이해하고 관리하는 것이 복잡계 과학의 중요한 과제이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "복잡계 과학이 전통적 환원주의와 구별되는 핵심적 관점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "구성 요소들의 상호작용에서 비롯되는 집합적 행동에 주목한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "창발적 질서가 인위적 설계와 근본적으로 구별되는 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "외부의 설계자나 중앙 통제 없이 개별 구성 요소들의 국소적 상호작용만으로 자발적으로 형성되며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "베나르 대류 현상에서 육각형 대류 세포가 형성되는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "유체 분자들의 집단적 운동에서 자연스럽게 출현한 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "비선형 체계에서 나비 효과가 갖는 과학적 의의는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "결정론적 체계에서도 예측 불가능성이 발생할 수 있음을 입증하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "하이에크가 시장 가격 체계를 자생적 질서로 본 근거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "어떤 중앙 계획자도 시장 참여자 전체가 보유한 분산된 지식을 종합할 수 없다고 주장하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "복잡계 과학에서 부정적 창발의 사례로 제시된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "금융 위기나 환경 파괴처럼 개별적으로 합리적인 행동이 집합적으로 파괴적인 결과를 낳는 현상")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(41, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 42: 문학 (LITERATURE) — 염상섭의 「삼대」에 나타난 세대 갈등 ───
function buildDay42() {
  const paragraphs = [
    {
      id: "p1",
      text: "염상섭의 장편소설 「삼대」는 1931년 조선일보에 연재된 작품으로, 조덕기 가문의 삼대에 걸친 갈등을 통해 식민지 조선 사회를 총체적으로 형상화한 리얼리즘 소설의 대표작이다. 조의관으로 대표되는 구세대는 유교적 가부장 질서를 고수하면서 가문의 재산과 위신을 지키는 데 집착하는 인물로 그려진다. 그의 세계관에서 가문의 유지는 곧 사회적 존재의 근거이며, 이를 위해 봉건적 권위를 행사하는 것을 당연시한다. 그러나 이러한 전통적 질서는 식민지 근대화라는 역사적 변동 앞에서 그 정당성을 상실해 가고 있으며, 조의관의 권위는 실질적 힘이 아닌 관성에 의해 유지되는 것에 불과하다. 염상섭은 구세대의 모습을 희화화하지 않으면서도 한계를 객관적으로 드러냄으로써, 전통적 가치의 붕괴를 사실주의적으로 형상화하고 있다."
    },
    {
      id: "p2",
      text: "「삼대」에서 조상훈으로 대표되는 중간 세대는 구세대와 신세대 사이에서 분열된 존재로 그려진다. 조상훈은 기독교에 귀의하고 근대적 교육을 받았으나 그의 근대성은 피상적 수준에 머문다. 그는 아버지의 재산을 탐하면서도 전통적 가부장 질서에 기생하며, 근대적 가치를 주장하면서도 이를 실천할 의지를 갖추지 못한 인물이다. 조상훈의 위선적 행태는 식민지 조선에서 근대적 가치가 내면화되지 못한 채 외피적으로만 수용된 현실을 반영하는 것으로 해석된다. 그는 전통과 근대 어느 쪽에도 뿌리내리지 못한 채 표류하며, 이러한 분열상은 식민지 근대가 가져온 문화적 혼란을 상징적으로 보여 준다. 염상섭은 조상훈을 통해 근대적 전환이 단순한 제도의 변화가 아니라 내면적 각성을 수반해야 한다는 인식을 암시하고 있다."
    },
    {
      id: "p3",
      text: "조덕기는 「삼대」에서 신세대를 대표하는 인물로, 유학 경험을 가진 근대적 지식인이다. 그는 조부와 부친 사이의 갈등을 중재하며 가문의 문제를 해결해 나간다. 조덕기의 태도는 급진적 변혁보다 점진적 개량을 추구하는 온건한 합리주의로 특징지어지며, 이는 사회주의에 경도된 김병화의 급진성과 대비된다. 그러나 조덕기의 온건성은 식민지 현실의 구조적 모순에 대한 근본적 인식의 부재에서 비롯된 것이라는 비판적 독해도 가능하다. 그는 개인의 합리성과 교양으로 사회적 문제를 해결할 수 있다고 믿지만, 식민 지배라는 거시적 구조 앞에서 그의 개량주의가 어떤 실효성을 가질 수 있는지는 작품 내에서 답해지지 않는다."
    },
    {
      id: "p4",
      text: "「삼대」의 문학사적 의의는 개인과 사회의 관계를 총체적으로 형상화한 데 있다. 염상섭은 세 세대의 갈등을 단순한 가족 간 불화가 아니라, 전통과 근대, 보수와 진보라는 복합적 대립 구도 속에서 조명함으로써 식민지 조선의 구조적 모순을 다층적으로 드러내었다. 특히 재산 상속을 둘러싼 세대 간 쟁투는 물질적 이해관계와 이념적 갈등이 교차하는 지점을 보여 주며, 이를 통해 사회적 변동이 개인의 삶에 미치는 영향을 구체적으로 형상화하였다. 이러한 총체적 현실 인식과 객관적 서술 태도는 「삼대」를 한국 사실주의 소설의 정점으로 평가받게 하는 근거이며, 이후 채만식의 「태평천하」 같은 세태 소설에도 중요한 영향을 미쳤다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "조의관의 권위가 한계를 맞는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "식민지 근대화라는 역사적 변동 앞에서 그 정당성을 상실해 가고 있으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "조상훈의 위선적 행태가 반영하는 식민지 조선의 현실은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "근대적 가치가 내면화되지 못한 채 외피적으로만 수용된 현실을 반영하는 것으로 해석된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "염상섭이 조상훈을 통해 암시하는 인식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "근대적 전환이 단순한 제도의 변화가 아니라 내면적 각성을 수반해야 한다는 인식을 암시하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "조덕기의 온건한 합리주의에 대한 비판적 독해의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "식민지 현실의 구조적 모순에 대한 근본적 인식의 부재에서 비롯된 것이라는 비판적 독해도 가능하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "「삼대」에서 재산 상속을 둘러싼 갈등이 보여 주는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "물질적 이해관계와 이념적 갈등이 교차하는 지점을 보여 주며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "「삼대」가 한국 사실주의 소설의 정점으로 평가받는 근거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "총체적 현실 인식과 객관적 서술 태도는 「삼대」를 한국 사실주의 소설의 정점으로 평가받게 하는 근거이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(42, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 43: 비문학 (NONFICTION) — 화폐의 시간 가치와 할인율 ───
function buildDay43() {
  const paragraphs = [
    {
      id: "p1",
      text: "경제학에서 화폐의 시간 가치란 동일한 금액이라 하더라도 현재의 화폐가 미래의 화폐보다 더 큰 가치를 갖는다는 원리이다. 오늘의 100만 원이 1년 후의 100만 원보다 가치가 큰 것은 오늘의 100만 원을 투자하면 이자나 수익을 얻을 수 있기 때문이다. 이러한 시간 가치는 이자율을 통해 수량적으로 표현된다. 연 이자율 5퍼센트일 때 현재의 100만 원은 1년 후 105만 원이 되므로, 양자는 경제적으로 동일한 가치를 갖는다. 이 원리는 은행 예금에만 적용되는 것이 아니라, 모든 경제적 의사 결정에서 미래 현금 흐름을 현재 가치로 환산할 때 핵심적 역할을 수행한다. 기업의 투자 결정, 채권 가격 산정, 연금 설계 등에서 화폐의 시간 가치는 합리적 의사 결정의 기초가 된다."
    },
    {
      id: "p2",
      text: "미래의 현금 흐름을 현재 가치로 전환하는 과정을 할인이라 하며, 이때 적용되는 비율을 할인율이라 한다. 할인은 복리 계산의 역과정으로 이해할 수 있다. 복리 계산이 현재 금액에 이자율을 적용하여 미래 가치를 구하는 것이라면, 할인은 미래 금액을 할인율로 나누어 현재 가치를 구한다. 할인율이 연 10퍼센트일 때 2년 후의 121만 원은 현재 가치로 100만 원이 된다. 할인율이 높을수록 미래 현금의 현재 가치는 작아지고 할인율이 낮을수록 현재 가치는 커진다. 이는 높은 할인율이 미래 소비보다 현재 소비를 더 강하게 선호하는 태도를 반영하기 때문이다. 따라서 할인율의 결정은 투자 프로젝트의 채택 여부를 좌우하는 핵심 변수가 된다."
    },
    {
      id: "p3",
      text: "할인율의 결정에는 여러 요인이 복합적으로 작용한다. 우선 무위험 이자율이 기초를 형성하는데, 이는 국채처럼 채무 불이행 위험이 거의 없는 자산의 수익률이다. 여기에 투자 대상의 위험도에 따른 위험 프리미엄이 추가된다. 위험이 높은 투자일수록 요구 수익률이 높아지므로 할인율도 높아진다. 또한 인플레이션 기대도 반영되는데, 물가 상승이 예상되면 미래 화폐의 구매력이 떨어지므로 추가적 할인이 필요하다. 기업 재무에서는 자기 자본 비용과 타인 자본 비용을 가중 평균한 가중평균자본비용을 할인율로 사용하는 것이 일반적이다. 이러한 결정 과정에는 객관적 시장 데이터뿐 아니라 미래에 대한 주관적 판단도 개입하므로, 할인율의 선택은 분석 결과에 상당한 영향을 미친다."
    },
    {
      id: "p4",
      text: "화폐의 시간 가치와 할인율은 공공 정책에서도 중요한 쟁점을 제기한다. 기후 변화 대응이나 사회 기반 시설 투자처럼 장기적 효과를 갖는 정책의 비용 편익 분석에서 어떤 할인율을 적용할 것인가는 정책 결정의 방향을 좌우한다. 높은 할인율을 적용하면 먼 미래의 편익이 크게 축소되어 투자가 정당화되기 어렵고, 낮은 할인율을 적용하면 미래 세대의 이익이 충분히 반영되어 적극적 투자가 정당화된다. 이 문제는 단순한 경제적 계산을 넘어 세대 간 형평성이라는 윤리적 차원과 연결된다. 현재 세대의 시간 선호율을 미래 세대에게도 적용하는 것이 정당한지, 미래 세대의 복지를 위해 현재 세대가 어느 정도 비용을 부담해야 하는지는 경제학의 기술적 문제를 넘어 사회적 합의를 요구하는 규범적 쟁점이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "화폐의 시간 가치가 성립하는 근본적 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "오늘의 100만 원을 투자하면 이자나 수익을 얻을 수 있기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "할인율이 높을수록 미래 현금의 현재 가치가 작아지는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "높은 할인율이 미래 소비보다 현재 소비를 더 강하게 선호하는 태도를 반영하기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "할인율 결정에 주관적 판단이 개입하게 되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "객관적 시장 데이터뿐 아니라 미래에 대한 주관적 판단도 개입하므로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "기업 재무에서 할인율로 일반적으로 사용되는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "자기 자본 비용과 타인 자본 비용을 가중 평균한 가중평균자본비용을 할인율로 사용하는 것이 일반적이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "공공 정책에서 낮은 할인율을 적용하면 어떤 결과가 나타나는가?",
      answerRanges: [findRange(paragraphs, "p4", "미래 세대의 이익이 충분히 반영되어 적극적 투자가 정당화된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "할인율 문제가 경제학의 기술적 문제를 넘어서는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "경제학의 기술적 문제를 넘어 사회적 합의를 요구하는 규범적 쟁점이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(43, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 44: 문학 (LITERATURE) — 이광수의 「무정」과 근대적 개인의 탄생 ───
function buildDay44() {
  const paragraphs = [
    {
      id: "p1",
      text: "이광수의 「무정」은 1917년 매일신보에 연재된 한국 최초의 근대 장편소설로 평가받는 작품이다. 이 소설은 영어 교사 이형식을 중심으로, 전통적 공동체에서 벗어나 독립적 개인으로 성장하는 근대적 주체의 형성 과정을 그려 내고 있다. 전근대 사회에서 개인은 가문과 신분이라는 귀속적 정체성에 의해 규정되었으나, 이형식은 전통적 질서에서 이탈하여 자신의 능력과 의지로 정체성을 구축하고자 한다. 그는 근대 교육을 통해 지적 역량을 갖추고, 자유로운 연애를 통해 감정의 주체로 서고자 한다. 이러한 이형식의 모습은 봉건적 질서가 해체되면서 등장한 근대적 개인의 이상을 형상화한 것으로, 계몽주의적 세계관에 기반을 두고 있다."
    },
    {
      id: "p2",
      text: "「무정」에서 근대적 개인의 형성은 연애라는 주제를 통해 가장 선명하게 드러난다. 이형식과 박영채, 김선형의 삼각관계는 단순한 사랑 이야기가 아니라 전통과 근대의 가치 충돌을 구체화하는 서사적 장치이다. 박영채는 전통적 의리와 정절을 체현하는 인물로, 그녀의 헌신은 유교적 윤리에 기반한다. 반면 김선형은 근대 교육을 받고 자율적 판단력을 갖춘 신여성으로, 이형식과 대등한 관계를 형성한다. 이형식이 박영채에 대한 전통적 의무와 김선형에 대한 근대적 감정 사이에서 갈등하는 양상은, 개인이 전통적 규범에서 벗어나 자유로운 감정을 추구하는 과정에서 겪는 내면적 분열을 보여 준다. 이러한 연애 서사는 근대적 개인이 탄생하는 과정에서 동반되는 가치 전환의 고통을 형상화한 것이다."
    },
    {
      id: "p3",
      text: "「무정」의 서사에서 주목할 점은 개인의 각성이 사회적 계몽으로 확장되는 양상이다. 결말부에서 이형식, 박영채, 김선형은 기차 안에서 만나 갈등을 봉합하고 수해를 당한 민중을 돕겠다는 결의를 다진다. 이 장면은 개인의 내면적 성장이 사회적 실천으로 전화되는 과정을 보여 주며, 이광수의 계몽주의적 기획이 직접적으로 드러나는 부분이다. 그러나 이러한 결말에 대해서는 갈등이 지나치게 낙관적으로 봉합되어 있다는 비판이 제기된다. 세 인물 사이의 근본적 가치 충돌이 충분히 탐구되지 않은 채 계몽이라는 상위 목표에 의해 해소되는 것은 서사적 설득력을 약화시킨다는 것이다. 이는 이광수의 계몽주의가 개인의 내면적 모순을 깊이 다루기보다 사회적 사명의 실현에 더 큰 무게를 두었음을 시사한다."
    },
    {
      id: "p4",
      text: "「무정」의 문학사적 의의는 한국 소설에서 근대적 개인의 내면을 최초로 본격 형상화하였다는 데 있다. 이전의 고전 소설이 유형화된 인물과 권선징악의 서사에 의존하였다면, 「무정」은 개인의 심리적 갈등과 내면적 변화를 서사의 중심에 놓음으로써 근대 소설의 형식적 전환을 이루었다. 이형식의 사유와 감정이 상세하게 서술되는 방식은 근대 소설의 핵심인 내면적 서술의 출발점으로 평가된다. 그러나 「무정」은 한계도 지닌다. 이광수의 계몽주의적 시각은 인물의 내면을 독자적으로 탐구하기보다 교훈적 메시지의 전달을 위해 동원하는 경향이 있으며, 이는 소설의 예술적 자율성을 제한하는 요인으로 작용한다. 그럼에도 「무정」이 한국 근대 문학의 출발점에 위치한다는 사실은 부정하기 어려우며, 이후 한국 소설의 다양한 흐름은 이 작품이 제기한 문제의식의 심화와 극복으로 이해할 수 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "이형식이라는 인물이 형상화하고 있는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "봉건적 질서가 해체되면서 등장한 근대적 개인의 이상을 형상화한 것으로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "이형식의 연애 갈등이 보여 주는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "개인이 전통적 규범에서 벗어나 자유로운 감정을 추구하는 과정에서 겪는 내면적 분열을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「무정」의 결말에 대해 제기되는 비판의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "세 인물 사이의 근본적 가치 충돌이 충분히 탐구되지 않은 채 계몽이라는 상위 목표에 의해 해소되는 것은 서사적 설득력을 약화시킨다는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "이광수의 계몽주의가 개인의 내면보다 우선시한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "개인의 내면적 모순을 깊이 다루기보다 사회적 사명의 실현에 더 큰 무게를 두었음을 시사한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "「무정」이 이전 고전 소설과 구별되는 형식적 전환은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "개인의 심리적 갈등과 내면적 변화를 서사의 중심에 놓음으로써 근대 소설의 형식적 전환을 이루었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "「무정」의 예술적 자율성을 제한하는 요인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "인물의 내면을 독자적으로 탐구하기보다 교훈적 메시지의 전달을 위해 동원하는 경향이 있으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(44, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 45: 비문학 (NONFICTION) — 촘스키의 보편 문법 이론 ───
function buildDay45() {
  const paragraphs = [
    {
      id: "p1",
      text: "노엄 촘스키가 1950년대 후반에 제안한 보편 문법 이론은 인간의 언어 능력에 관한 근본적 물음을 제기하였다. 촘스키에 따르면 세계의 모든 언어는 표면적으로 다양하지만 심층에는 인류 공통의 문법 원리가 존재한다. 이러한 보편 문법은 인간의 유전자에 각인된 선천적 능력으로, 특정 언어를 학습하기 이전에 이미 두뇌에 내장되어 있다. 이 이론의 출발점은 자극의 빈곤이라는 논증이다. 아이가 접하는 언어 자극은 불완전하고 제한적임에도 불과 몇 년 안에 들어 본 적 없는 무한한 문장을 생성하고 이해할 수 있게 된다. 이러한 습득의 신속성과 창의성은 단순한 모방이나 경험적 학습만으로는 설명할 수 없으며, 선천적 언어 능력이 내재해 있다는 가설을 통해서만 설명된다고 촘스키는 주장하였다."
    },
    {
      id: "p2",
      text: "보편 문법 이론은 당시 언어학계를 지배하던 행동주의적 언어관에 대한 비판에서 출발하였다. 행동주의 심리학자 스키너는 언어를 자극과 반응의 연쇄로 설명하며, 언어 습득은 강화를 통해 이루어진다고 보았다. 그러나 촘스키는 이러한 설명이 언어의 창의적 측면을 전혀 설명하지 못한다고 비판하였다. 인간은 들어 본 적 없는 문장을 끊임없이 생성하고 이해하는데, 이는 자극과 반응의 기계적 연쇄로는 해명될 수 없다. 촘스키는 언어학을 행동 관찰 기반의 경험 과학에서 인간 정신의 내적 구조를 탐구하는 인지 과학으로 전환하였으며, 이는 인지 혁명이라 불리는 학문적 전환의 핵심 계기가 되었다. 언어가 인간 정신의 선천적 구조를 반영한다는 주장은 데카르트의 본유관념론과 맥을 같이하는 합리주의적 인식론에 근거하고 있다."
    },
    {
      id: "p3",
      text: "보편 문법의 작동 방식을 설명하기 위해 촘스키는 원리와 매개변인 모형을 제안하였다. 이 모형에서 보편 문법은 모든 언어에 공통 적용되는 불변의 원리와 개별 언어에 따라 설정값이 달라지는 매개변인으로 구성된다. 원리의 예로는 모든 문장에 주어가 존재해야 한다는 확대 투사 원리가 있고, 매개변인의 예로는 주어가 표면에 실현되어야 하는지를 결정하는 주어 탈락 매개변인이 있다. 영어에서는 이 매개변인이 부정값으로 설정되어 주어를 반드시 표현해야 하지만, 한국어에서는 긍정값이어서 주어 생략이 자연스럽다. 이 모형에 따르면 아이의 언어 습득은 백지에서 문법을 구축하는 것이 아니라, 선천적으로 주어진 원리를 바탕으로 주변 언어 환경에 맞게 매개변인의 설정값을 조정하는 과정이다."
    },
    {
      id: "p4",
      text: "보편 문법 이론에 대해서는 다양한 비판이 제기되어 왔다. 인지언어학자들은 언어 능력이 독립적 선천 모듈이 아니라 일반적 인지 능력에서 파생된 것이라 주장하며, 범주화와 유추 능력, 사회적 상호작용 등을 통해 언어가 습득될 수 있다고 본다. 에번스는 세계의 언어들이 촘스키가 가정한 만큼 깊은 수준에서 공통성을 공유하지 않는다는 증거를 제시하며 보편 문법의 존재에 의문을 제기하였다. 토마셀로는 아이의 언어 발달이 촘스키가 주장하는 것처럼 급격하게 이루어지는 것이 아니라 점진적이고 항목별로 진행된다는 발달 연구 결과를 제시하면서, 자극의 빈곤 논증이 과장되었다고 비판하였다. 이러한 논쟁은 현재까지 계속되고 있으며, 인간의 언어 능력이 어디에서 비롯되는가라는 질문은 언어학과 인지 과학의 핵심 과제로 남아 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "촘스키가 보편 문법 이론의 출발점으로 삼은 논증은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "자극의 빈곤이라는 논증이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "촘스키가 행동주의적 언어관을 비판한 핵심 근거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "언어의 창의적 측면을 전혀 설명하지 못한다고 비판하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "촘스키의 주장이 근거하고 있는 인식론적 전통은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "데카르트의 본유관념론과 맥을 같이하는 합리주의적 인식론에 근거하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "원리와 매개변인 모형에서 아이의 언어 습득은 어떤 과정으로 설명되는가?",
      answerRanges: [findRange(paragraphs, "p3", "선천적으로 주어진 원리를 바탕으로 주변 언어 환경에 맞게 매개변인의 설정값을 조정하는 과정이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "인지언어학자들이 제기하는 대안적 설명은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "범주화와 유추 능력, 사회적 상호작용 등을 통해 언어가 습득될 수 있다고 본다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "토마셀로가 자극의 빈곤 논증을 비판한 근거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "아이의 언어 발달이 촘스키가 주장하는 것처럼 급격하게 이루어지는 것이 아니라 점진적이고 항목별로 진행된다는 발달 연구 결과를 제시하면서")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(45, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───
function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs);
  const recall = buildRecallCards(paragraphs, 8);

  const dayStr = String(dayIndex).padStart(3, '0');
  const contentId = `dr-w2-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(비트겐슈타인 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "WITTGENSTEIN_2",
    schoolGradeRange: { min: 10, max: 11 },
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

  const paraSentMap = {};
  for (const p of paragraphs) {
    paraSentMap[p.id] = findSentences(p.text);
  }

  for (const para of paragraphs) {
    const sentences = paraSentMap[para.id];

    for (let si = 0; si < sentences.length; si++) {
      const sent = sentences[si];
      const correctText = truncate(sent.text, 80);

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
  const pos = hashIdx(seed) % 4;
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
    level_id: "WITTGENSTEIN_2",
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
  console.log("=== 비트겐슈타인2 Day 41~45 빌드 시작 ===\n");

  const contents = [
    buildDay41(),
    buildDay42(),
    buildDay43(),
    buildDay44(),
    buildDay45()
  ];

  // 검증
  let allValid = true;
  for (const c of contents) {
    const len = c.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
    const dayNum = parseInt(c.contentId.split('-')[2]);
    if (len < 1450 || len > 1550) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1450~1550)`);
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

  // 배치 파일 갱신
  console.log("\n배치 파일 갱신 중...");
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`현재 배치 items 수: ${batchData.items.length}`);

  const dayIndices = [41, 42, 43, 44, 45];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1; // items[40]~items[44]
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
