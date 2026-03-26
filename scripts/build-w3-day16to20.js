#!/usr/bin/env node
// 비트겐슈타인3 Day 16~20 일일독해 콘텐츠 재작성 빌더
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

// 간단한 해시 기반 셔플 인덱스
function hashIdx(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// ─── Day 16: 문학 (LITERATURE) ───
function buildDay16() {
  const paragraphs = [
    {
      id: "p1",
      text: "근대 소설이 탄생하기 이전, 서사 문학의 중심에는 판소리계 소설이 자리하고 있었다. 판소리계 소설은 구비 전승되던 판소리가 문자로 정착된 것으로, 구어적 표현과 문어적 표현이 혼재하며, 서술자의 개입이 빈번하게 나타난다는 특징을 지닌다. 이러한 서술적 특성은 판소리의 공연적 성격에서 비롯된 것이다. 판소리 광대는 청중 앞에서 이야기를 전달하면서 자신의 견해를 덧붙이거나, 상황에 대한 논평을 곁들이기도 하였다. 이러한 전통이 소설로 옮겨지면서, 서술자가 작중 인물이나 사건에 대해 직접 평가하는 서술 방식이 자연스럽게 형성되었다. 특히 서술자가 고사나 한시를 인용하여 상황의 의미를 부각하는 방식은 판소리계 소설의 고유한 수사적 장치로 기능하였으며, 이를 통해 작품의 교훈적 차원이 한층 강화되었다. 아울러 서술자는 등장인물의 외모나 행동을 과장되게 묘사하여 골계미를 형성하기도 하였는데, 이는 청중의 흥미를 유발하는 판소리 특유의 연행 전략이 소설적 서술로 전환된 결과이다."
    },
    {
      id: "p2",
      text: "판소리계 소설의 또 다른 주요 특징은 다성적 구조에 있다. 하나의 작품 안에 양반의 언어와 민중의 언어가 공존하고, 한문투의 격식 있는 문체와 비속어가 뒤섞여 나타난다. 이러한 언어적 혼종성은 작품의 주제 의식과 밀접하게 연결된다. 가령 양반 인물이 격식 있는 한문투로 발화하는 장면과 민중 인물이 일상적인 구어체로 대응하는 장면이 대비되면서, 양반 중심의 사회 질서에 대한 비판적 시각이 자연스럽게 드러나게 된다. 이는 바흐친이 말한 소설의 다성성 개념과도 통하는 것으로, 하나의 텍스트 안에서 여러 목소리가 경합하면서 단일한 세계관이 아닌 복수의 세계관이 충돌하는 양상을 보여 준다. 이러한 다성적 구조는 조선 후기 사회 변동 속에서 기존의 위계적 질서에 대한 도전의 목소리가 문학적으로 표출된 것이라 할 수 있다."
    },
    {
      id: "p3",
      text: "특히 「춘향전」은 판소리계 소설의 이러한 특성을 가장 잘 보여 주는 작품이다. 춘향이라는 인물은 기생의 딸이라는 신분적 한계에도 불구하고 절개를 지키며 부당한 권력에 맞서는데, 이 과정에서 작품은 유교적 충절의 논리와 민중적 저항의 논리를 동시에 구현한다. 변학도의 수청 요구에 대한 춘향의 거부는 열녀적 행위로도, 부당한 권력에 대한 민중적 저항으로도 해석될 수 있다. 이러한 의미의 다층성은 판소리계 소설이 단순한 오락물이 아니라 당대 사회의 모순을 형상화한 서사 문학임을 입증하는 것이다. 나아가 「춘향전」에서 신분 질서를 뛰어넘는 사랑의 성취는 당대 민중이 꿈꾸던 이상 사회의 모습을 반영한다고 볼 수 있으며, 조선 후기 신분제의 동요라는 사회적 맥락 속에서 그 의의가 더욱 부각된다."
    },
    {
      id: "p4",
      text: "판소리계 소설은 근대 문학으로의 이행 과정에서 중요한 교량 역할을 하였다. 구비 문학의 생동감과 기록 문학의 정교함을 동시에 갖춘 이 장르는, 이후 신소설과 근대 소설의 서사적 기법에 적지 않은 영향을 미쳤다. 서술자의 논평적 개입은 근대 소설에서 전지적 서술 시점으로 발전하였고, 다양한 인물의 목소리를 통한 갈등 구조는 근대 소설의 인물 형상화 기법에 기여하였다. 또한 판소리계 소설의 풍자와 해학의 전통은 채만식, 김유정 등 근대 소설가들의 작품에서 다시 변용되어 나타났다. 이처럼 판소리계 소설은 한국 서사 문학의 연속성 속에서 전통과 근대를 잇는 핵심적인 고리로 평가받고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "판소리계 소설에서 서술자의 개입이 빈번하게 나타나는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "판소리의 공연적 성격에서 비롯된 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "판소리계 소설의 언어적 혼종성이 작품의 주제 의식과 어떻게 연결되는가?",
      answerRanges: [findRange(paragraphs, "p2", "양반 중심의 사회 질서에 대한 비판적 시각이 자연스럽게 드러나게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "바흐친의 다성성 개념과 판소리계 소설은 어떤 점에서 공통적인가?",
      answerRanges: [findRange(paragraphs, "p2", "하나의 텍스트 안에서 여러 목소리가 경합하면서 단일한 세계관이 아닌 복수의 세계관이 충돌하는 양상을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "변학도의 수청 요구에 대한 춘향의 거부가 지닌 해석의 이중성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "열녀적 행위로도, 부당한 권력에 대한 민중적 저항으로도 해석될 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "판소리계 소설의 서술자 논평적 개입은 근대 소설에서 어떤 기법으로 발전하였는가?",
      answerRanges: [findRange(paragraphs, "p4", "전지적 서술 시점으로 발전하였고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "판소리계 소설의 풍자와 해학의 전통은 어떤 근대 소설가에게 이어졌는가?",
      answerRanges: [findRange(paragraphs, "p4", "채만식, 김유정")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(16, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 17: 비문학 (NONFICTION) ───
function buildDay17() {
  const paragraphs = [
    {
      id: "p1",
      text: "인지 편향이란 인간이 정보를 처리하고 판단을 내릴 때 체계적으로 발생하는 사고의 오류를 말한다. 인간의 인지 체계는 제한된 시간과 자원 속에서 효율적으로 의사 결정을 내리기 위해 다양한 간편 추론 방식, 즉 휴리스틱을 활용한다. 그러나 이 휴리스틱은 빠르고 효율적인 판단을 가능하게 하는 반면, 특정 상황에서는 체계적인 오류를 유발하기도 한다. 대니얼 카너먼과 아모스 트버스키는 이러한 인지 편향의 메커니즘을 체계적으로 분석하여, 인간의 판단과 의사 결정이 전통적인 합리성 모델에서 벗어나는 구체적인 양상을 밝혀냈다. 이들의 연구는 전통 경제학의 합리적 인간 모델에 근본적인 의문을 제기하면서, 행동경제학이라는 새로운 학문 분야의 토대를 마련하였다."
    },
    {
      id: "p2",
      text: "대표적인 인지 편향 중 하나인 확증 편향은 자신의 기존 신념이나 가설을 확인해 주는 정보는 적극적으로 수용하면서, 이를 반박하는 정보는 무시하거나 과소평가하는 경향을 뜻한다. 예컨대 특정 정치적 입장을 가진 사람이 자신의 견해를 지지하는 뉴스만 선별적으로 소비하고, 반대되는 정보에 대해서는 신뢰성을 의심하는 현상이 이에 해당한다. 확증 편향은 개인의 의사 결정 수준에서만 작동하는 것이 아니라, 집단 차원에서도 강력하게 나타난다. 동일한 신념을 공유하는 집단 내에서는 확증 편향이 상호 강화되면서 집단 극화 현상이 발생할 수 있다. 집단 극화란 집단 내 구성원들의 의견이 토론을 거치면서 오히려 더 극단적인 방향으로 이동하는 현상을 의미하며, 이는 사회적 갈등의 심화와 합의 형성의 어려움으로 이어질 수 있다."
    },
    {
      id: "p3",
      text: "가용성 편향은 특정 사건의 발생 빈도나 확률을 판단할 때, 관련 사례가 머릿속에 얼마나 쉽게 떠오르는지에 따라 판단이 왜곡되는 현상이다. 언론에서 비행기 사고를 반복적으로 보도하면 사람들은 비행기 사고의 실제 확률보다 그 위험을 과대평가하게 되는데, 이는 비행기 사고와 관련된 생생한 이미지가 기억에서 쉽게 인출되기 때문이다. 반면 자동차 사고처럼 일상적이어서 뉴스 가치가 낮은 위험은 실제 빈도에 비해 과소평가되는 경향이 있다. 가용성 편향은 위험 인식뿐만 아니라 정책 결정에도 영향을 미친다. 최근에 발생한 사건이나 언론의 집중 보도를 받은 사건이 정책적 우선순위에 과도하게 반영될 수 있으며, 이는 제한된 자원의 비효율적 배분으로 이어질 수 있다."
    },
    {
      id: "p4",
      text: "기준점 편향은 처음에 제시된 특정 수치나 정보가 이후의 판단에 과도한 영향을 미치는 현상이다. 부동산 거래에서 매도자가 제시한 초기 호가가 이후 협상 과정 전체에 영향을 미치는 것이 대표적인 사례이다. 초기에 높은 가격이 제시되면 매수자는 그 수치를 기준으로 삼아 실제 시장 가치와 무관하게 높은 가격을 수용하게 되는 것이다. 기준점 편향은 전문가의 판단에서도 예외 없이 나타나며, 의료 진단이나 법적 양형 판단 과정에서도 초기 정보가 최종 판단을 왜곡하는 사례가 보고되고 있다. 이러한 인지 편향의 존재는 인간의 합리성에 대한 근본적인 재검토를 요구한다. 인간은 완전히 합리적인 존재가 아니라 제한된 합리성을 지닌 존재이며, 이를 인식하고 교정하기 위한 체계적인 노력이 필요하다. 이러한 관점에서 행동경제학은 인지 편향을 고려한 제도 설계, 이른바 넛지 전략을 통해 개인과 사회의 의사 결정을 개선하고자 시도하고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "인지 편향이 발생하는 근본적인 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "제한된 시간과 자원 속에서 효율적으로 의사 결정을 내리기 위해 다양한 간편 추론 방식, 즉 휴리스틱을 활용한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "확증 편향이 집단 차원에서 나타날 때 발생하는 현상은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "집단 극화 현상이 발생할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "비행기 사고의 위험을 과대평가하게 되는 인지적 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "비행기 사고와 관련된 생생한 이미지가 기억에서 쉽게 인출되기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "가용성 편향이 정책 결정에 미치는 부정적 결과는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "제한된 자원의 비효율적 배분으로 이어질 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "기준점 편향이 전문 영역에서도 관찰되는 사례는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "의료 진단이나 법적 양형 판단 과정에서도 초기 정보가 최종 판단을 왜곡하는 사례가 보고되고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "행동경제학에서 인지 편향에 대응하여 제안하는 전략은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "넛지 전략을 통해 개인과 사회의 의사 결정을 개선하고자 시도하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(17, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 18: 문학 (LITERATURE) ───
function buildDay18() {
  const paragraphs = [
    {
      id: "p1",
      text: "현대시에서 이미지즘은 20세기 초 영미 시단을 중심으로 전개된 시 운동으로, 시적 표현의 정확성과 구체성을 강조하였다. 에즈라 파운드를 비롯한 이미지스트 시인들은 추상적인 감정의 직접적 진술을 배격하고, 구체적인 사물의 이미지를 통해 시적 의미를 전달하고자 하였다. 이들은 불필요한 수식어를 제거하고 일상적인 언어를 사용하면서도, 선명하고 압축적인 이미지를 통해 독자에게 즉각적인 인상을 전달하는 시를 지향하였다. 파운드가 제안한 이미지즘의 세 가지 원칙은 주관적이든 객관적이든 사물을 직접 다룰 것, 표현에 기여하지 않는 단어는 일체 사용하지 말 것, 그리고 메트로놈의 박자가 아닌 음악적 어구의 리듬에 따라 작곡하듯 쓸 것이었다. 이러한 원칙은 당시 빅토리아 시대의 장황한 수사적 전통에 대한 반발로서, 시의 본질을 감각적 직관에서 찾으려는 시도였다. 파운드의 대표작 「지하철 정거장에서」는 단 두 행으로 도시적 풍경을 순간적 이미지로 포착함으로써 이미지즘의 미학을 응축적으로 구현한 작품으로 평가된다."
    },
    {
      id: "p2",
      text: "한국 현대시에서 이미지즘의 영향은 1930년대 모더니즘 시 운동을 통해 본격적으로 수용되었다. 정지용은 감각적 이미지의 정밀한 구현을 통해 한국 현대시의 새로운 지평을 열었다. 그의 대표작 「유리창」에서 '유리에 차고 슬픈 것이 어른거린다'라는 구절은 슬픔이라는 추상적 감정을 유리창에 맺히는 입김이라는 구체적 이미지로 변환함으로써, 독자로 하여금 감정을 직접 감각하게 하는 효과를 거두고 있다. 이러한 감각적 이미지의 활용은 이전 시기의 감상적이고 추상적인 시적 관습으로부터의 탈피를 의미하며, 한국 현대시가 근대적 미의식을 확립하는 데 결정적인 기여를 하였다."
    },
    {
      id: "p3",
      text: "이미지즘의 전통은 이후 김수영, 김춘수 등의 시인에게로 계승되면서 새로운 변용을 겪었다. 김춘수의 「꽃」에서 이미지는 대상의 외적 형상을 재현하는 수단이 아니라 존재의 본질을 탐구하는 도구로 기능한다. 내가 그의 이름을 불러 주었을 때 그는 나에게로 와서 꽃이 되었다는 구절에서 꽃의 이미지는 물리적 대상으로서의 꽃이 아니라, 타자와의 관계를 통해 비로소 의미를 획득하는 존재론적 상황을 형상화한 것이다. 이는 이미지즘이 단순한 감각적 재현을 넘어 존재론적 탐구의 방법론으로 확장될 수 있음을 보여 주는 사례이다. 한편 김수영은 이미지를 현실 비판의 도구로 전환하여, 시적 이미지가 사회적 발언의 매개가 될 수 있음을 실증하였다. 그의 시에서 이미지는 순수한 미적 대상이 아니라 부조리한 현실에 대한 저항의 언어로 기능하면서, 이미지즘의 외연을 참여 문학의 방향으로 넓히는 계기가 되었다."
    },
    {
      id: "p4",
      text: "오늘날 한국 현대시에서 이미지의 위상은 더욱 복합적인 양상을 보인다. 디지털 매체의 확산과 시각 문화의 발달로 인해, 시적 이미지는 문자 언어의 범주를 넘어 다양한 매체와의 상호 작용 속에서 새롭게 정의되고 있다. 일부 시인들은 이미지의 과잉 속에서 오히려 이미지를 거부하거나 해체하는 방식으로 새로운 시적 가능성을 모색하기도 한다. 그러나 구체적인 이미지를 통해 추상적인 의미를 전달한다는 이미지즘의 근본 원리는 여전히 유효하다. 시적 이미지는 독자의 감각을 환기시키고, 일상적 언어로는 포착하기 어려운 미묘한 인식의 변화를 전달하는 고유한 기능을 수행하고 있기 때문이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "에즈라 파운드가 이미지즘에서 배격한 시적 태도는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "추상적인 감정의 직접적 진술을 배격하고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "한국 현대시에 이미지즘이 본격적으로 수용된 시기와 경로는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "1930년대 모더니즘 시 운동을 통해 본격적으로 수용되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "정지용의 감각적 이미지 활용이 한국 시사에서 갖는 의의는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "한국 현대시가 근대적 미의식을 확립하는 데 결정적인 기여를 하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "김춘수의 「꽃」에서 이미지가 수행하는 구체적인 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "존재의 본질을 탐구하는 도구로 기능한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "일부 현대 시인들이 이미지 과잉 속에서 모색하는 방법은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "이미지를 거부하거나 해체하는 방식으로 새로운 시적 가능성을 모색하기도 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이미지즘의 근본 원리가 여전히 유효한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "독자의 감각을 환기시키고, 일상적 언어로는 포착하기 어려운 미묘한 인식의 변화를 전달하는 고유한 기능을 수행하고 있기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(18, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 19: 비문학 (NONFICTION) ───
function buildDay19() {
  const paragraphs = [
    {
      id: "p1",
      text: "생태계 서비스란 인간이 생태계로부터 얻는 다양한 혜택을 체계적으로 분류하고 평가하기 위한 개념이다. 밀레니엄 생태계 평가에서는 생태계 서비스를 공급 서비스, 조절 서비스, 문화 서비스, 지지 서비스의 네 범주로 구분하였다. 공급 서비스는 식량, 담수, 목재, 섬유 등 생태계가 직접 제공하는 물질적 산출물을 의미한다. 조절 서비스는 기후 조절, 홍수 방지, 수질 정화, 질병 통제 등 생태계가 환경 조건을 조절하는 기능을 말한다. 문화 서비스는 휴양, 심미적 가치, 정신적 풍요, 교육적 기회 등 비물질적 혜택을 포함하며, 지지 서비스는 토양 형성, 영양소 순환, 광합성 등 다른 서비스의 기반이 되는 근본적인 생태적 과정을 지칭한다."
    },
    {
      id: "p2",
      text: "생태계 서비스의 경제적 가치를 평가하려는 시도는 환경 보전의 정당성을 경제적 논리로 뒷받침하기 위한 것이다. 로버트 코스탄자를 비롯한 연구진은 전 지구적 생태계 서비스의 가치를 연간 약 33조 달러로 추정하였는데, 이는 당시 전 세계 국내총생산 합계에 필적하는 규모였다. 이러한 경제적 평가는 생태계 보전이 단순한 윤리적 당위가 아니라 경제적으로도 합리적인 선택임을 보여 주기 위한 것이다. 특히 이 연구는 정책 입안자들에게 환경 파괴의 경제적 비용을 구체적인 수치로 인식시키는 데 기여하였다. 그러나 생태계 서비스의 화폐적 가치 평가에 대해서는 비판적 시각도 존재한다. 생태계의 복잡한 기능을 화폐 단위로 환산하는 과정에서 불가피하게 단순화가 일어나며, 시장에서 거래되기 어려운 서비스의 가치가 과소평가될 수 있다는 것이다."
    },
    {
      id: "p3",
      text: "최근에는 생태계 서비스 개념을 실제 정책에 반영하려는 움직임이 활발해지고 있다. 대표적인 사례가 생태계 서비스 지불제이다. 이는 생태계 서비스의 수혜자가 그 서비스를 제공하는 토지 소유자나 관리자에게 대가를 지불하는 제도로, 코스타리카의 산림 보전 프로그램이 대표적인 성공 사례로 꼽힌다. 코스타리카는 1990년대 후반부터 산림 소유자에게 탄소 저장, 수자원 보호, 생물 다양성 보전, 경관 보전 등의 서비스에 대한 보상금을 지급함으로써 산림 파괴를 효과적으로 억제하였다. 이 제도는 환경 보전과 경제적 유인을 결합한 혁신적 접근으로 평가받으며, 이후 다른 개발도상국에도 유사한 제도가 도입되는 계기가 되었다."
    },
    {
      id: "p4",
      text: "그러나 생태계 서비스 개념의 적용에는 여전히 해결해야 할 과제가 남아 있다. 생태계 서비스 간의 상충 관계를 어떻게 관리할 것인지가 중요한 문제이다. 예컨대 식량 생산을 위한 농경지 확대는 공급 서비스를 증가시키지만, 조절 서비스와 문화 서비스를 감소시킬 수 있다. 이러한 상충 관계 속에서 어떤 서비스를 우선시할 것인지는 사회적 합의를 필요로 하는 가치 판단의 문제이다. 또한 생태계 서비스의 수혜 범위가 지역적 차원에서 전 지구적 차원까지 다양하기 때문에, 서비스의 비용과 편익을 공정하게 배분하는 문제도 복잡한 과제이다. 나아가 생태계 서비스의 가치 평가에서 미래 세대의 이익을 어떻게 반영할 것인지도 논의가 필요한 영역이다. 이러한 과제에도 불구하고 생태계 서비스 개념은 환경 보전과 경제 발전의 조화를 모색하는 데 있어 핵심적인 분석 틀을 제공하고 있으며, 지속 가능한 발전을 위한 정책 수립의 기반이 되고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "밀레니엄 생태계 평가에서 생태계 서비스를 어떤 범주로 구분하였는가?",
      answerRanges: [findRange(paragraphs, "p1", "공급 서비스, 조절 서비스, 문화 서비스, 지지 서비스의 네 범주로 구분하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "지지 서비스에 해당하는 생태적 과정의 사례는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "토양 형성, 영양소 순환, 광합성")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "생태계 서비스의 화폐적 가치 평가에 대한 비판의 핵심 논거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "시장에서 거래되기 어려운 서비스의 가치가 과소평가될 수 있다는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "코스타리카의 산림 보전 프로그램에서 보상 대상이 된 서비스는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "탄소 저장, 수자원 보호, 생물 다양성 보전, 경관 보전")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "생태계 서비스 간 상충 관계의 사례로 제시된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "식량 생산을 위한 농경지 확대는 공급 서비스를 증가시키지만, 조절 서비스와 문화 서비스를 감소시킬 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "서비스 비용과 편익의 공정한 배분이 어려운 근본적 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "생태계 서비스의 수혜 범위가 지역적 차원에서 전 지구적 차원까지 다양하기 때문에")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(19, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 20: 문학 (LITERATURE) ───
function buildDay20() {
  const paragraphs = [
    {
      id: "p1",
      text: "소설에서 서술 시점이란 이야기를 전달하는 서술자가 어떤 위치에서 어떤 방식으로 사건과 인물을 관찰하고 서술하는가에 관한 문제이다. 서술 시점은 단순히 기술적인 장치에 그치는 것이 아니라, 작품의 의미 구성 방식과 독자의 해석 경험을 근본적으로 규정하는 핵심적인 서사 원리이다. 동일한 사건이라 하더라도 누구의 눈을 통해 서술되느냐에 따라 사건의 의미와 독자의 감정적 반응은 판이하게 달라질 수 있다. 전통적으로 소설의 서술 시점은 1인칭 시점과 3인칭 시점으로 대별되며, 3인칭 시점은 다시 전지적 시점과 제한적 시점으로 세분된다. 이러한 분류는 서술자가 작중 세계에 참여하는 정도와 인물의 내면에 접근할 수 있는 범위에 따라 구별되는 것이다."
    },
    {
      id: "p2",
      text: "1인칭 서술 시점에서 서술자는 작중 인물로서 자신의 경험과 인식을 직접 전달한다. 이 시점의 가장 큰 장점은 서술의 진정성과 친밀감에 있다. 독자는 서술자의 내면에 깊이 몰입하면서 그의 감정과 사고를 생생하게 경험할 수 있다. 그러나 1인칭 서술자는 자신이 직접 목격하거나 경험한 사건만을 서술할 수 있다는 근본적인 한계를 지닌다. 이러한 제약은 역설적으로 서사적 긴장을 창출하는 요소로 활용되기도 한다. 가령 서술자가 알지 못하는 정보가 독자에게는 암시적으로 제시될 때, 서술자의 인식과 실제 상황 사이의 간극이 아이러니를 형성하면서 작품의 의미가 풍부해지는 것이다. 이를 비신뢰적 서술이라 하며, 카즈오 이시구로의 「남아 있는 나날」이 대표적인 사례로 거론된다."
    },
    {
      id: "p3",
      text: "3인칭 전지적 서술 시점에서 서술자는 작중 세계의 외부에 위치하면서 모든 인물의 내면과 사건의 전모를 파악하고 있다. 이 시점은 서사의 폭과 깊이를 동시에 확보할 수 있다는 이점이 있으나, 서술자의 전지성이 과도해지면 독자의 능동적 해석 여지가 줄어들 수 있다는 단점도 있다. 따라서 작가는 서술자의 전지성을 전략적으로 조절하여, 필요한 정보를 선택적으로 제공하거나 보류함으로써 서사적 긴장감을 유지하는 기법을 활용하기도 한다. 이에 반해 3인칭 제한적 서술 시점은 특정 인물의 관점에서만 사건을 서술하는 방식으로, 전지적 시점의 객관성과 1인칭 시점의 내면성을 절충한 형태이다. 헨리 제임스는 이 시점을 체계적으로 발전시킨 소설가로, 그는 특정 인물을 의식의 중심으로 설정하고 그 인물의 인식을 통해 사건을 여과하여 전달하는 기법을 정립하였다."
    },
    {
      id: "p4",
      text: "현대 소설에서는 이러한 전통적인 시점 분류의 경계가 점차 해체되는 양상을 보인다. 다중 시점 서술은 여러 인물의 관점을 교차하면서 하나의 사건을 다각도로 조명하는 기법으로, 객관적 진실이라는 단일한 실재를 의심하는 현대적 인식론을 반영한다. 윌리엄 포크너의 「소리와 분노」는 네 명의 서술자를 통해 동일한 가족사를 서로 다른 관점에서 서술함으로써, 진실의 복수성과 인식의 상대성을 형상화한 대표적인 작품이다. 각 서술자의 인식적 한계와 편향이 드러나면서, 독자는 능동적으로 의미를 재구성해야 하는 참여적 독서를 경험하게 된다. 또한 의식의 흐름 기법은 인물의 내면 의식을 논리적 정리 없이 그대로 재현함으로써, 전통적 서술의 질서 정연한 시간 구조를 해체한다. 이처럼 다양한 시점 실험은 소설이라는 형식이 현실을 재현하고 인식하는 방식에 대한 끊임없는 성찰의 산물이며, 서사 예술의 표현 영역을 지속적으로 확장해 가고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "서술 시점이 작품에서 수행하는 근본적인 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "작품의 의미 구성 방식과 독자의 해석 경험을 근본적으로 규정하는 핵심적인 서사 원리이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "1인칭 서술 시점에서 서술자의 한계가 아이러니를 형성하는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "서술자의 인식과 실제 상황 사이의 간극이 아이러니를 형성하면서 작품의 의미가 풍부해지는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "3인칭 전지적 서술 시점의 단점으로 언급된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "독자의 능동적 해석 여지가 줄어들 수 있다는 단점도 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "헨리 제임스가 발전시킨 서술 기법의 핵심 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "특정 인물을 의식의 중심으로 설정하고 그 인물의 인식을 통해 사건을 여과하여 전달하는 기법을 정립하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "다중 시점 서술이 반영하는 현대적 인식론의 내용은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "객관적 진실이라는 단일한 실재를 의심하는 현대적 인식론을 반영한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "의식의 흐름 기법이 전통적 서술에서 해체하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "전통적 서술의 질서 정연한 시간 구조를 해체한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(20, "LITERATURE", "문학", paragraphs, confirmQuestions);
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

  // 각 문단에서 문장 추출 → 분석용 맵
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

      // 오답: 다른 문단에서 문장 선택 (문장 인덱스를 달리하여 다양성 확보)
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
  console.log("=== 비트겐슈타인3 Day 16~20 빌드 시작 ===\n");

  const contents = [
    buildDay16(),
    buildDay17(),
    buildDay18(),
    buildDay19(),
    buildDay20()
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

  const dayIndices = [16, 17, 18, 19, 20];
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
