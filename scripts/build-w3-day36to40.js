#!/usr/bin/env node
// 비트겐슈타인3 Day 36~40 일일독해 콘텐츠 빌더
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

// ─── Day 36: 문학 (LITERATURE) ───
// 주제: 한국 전후 소설에서 손창섭의 인물 형상화 (문학평론)
function buildDay36() {
  const paragraphs = [
    {
      id: "p1",
      text: "손창섭은 한국 전후 소설을 대표하는 작가로, 전쟁이 남긴 정신적 폐허 위에서 인간 존재의 비참함을 가감 없이 형상화한 작가이다. 그의 소설에 등장하는 인물들은 대부분 육체적 결함이나 정신적 불구를 지닌 존재로 그려지는데, 이는 전쟁이라는 거대한 폭력이 개인의 삶을 어떻게 파괴하는지를 구체적으로 보여 주는 문학적 장치이다. 손창섭의 인물들이 지닌 신체적 장애는 단순한 사실적 묘사가 아니라, 전후 한국 사회의 도덕적·정신적 훼손을 은유적으로 형상화한 것이다. 이러한 인물 형상화 방식은 리얼리즘의 외피를 쓰면서도 알레고리적 의미를 내장하고 있다는 점에서, 전후 한국 소설이 단순한 현실 반영을 넘어 상징적 차원의 서사를 구축하고 있음을 보여 준다."
    },
    {
      id: "p2",
      text: "손창섭의 대표작 「비 오는 날」은 전후 사회의 무기력과 도덕적 해이를 인물의 행동 양식을 통해 드러낸 작품이다. 이 소설의 주인공 동옥은 누이의 매춘으로 생계를 유지하면서도 이에 대해 어떠한 도덕적 저항도 보이지 않는 무기력한 인물로 그려진다. 동옥의 무기력함은 개인적 성격의 결함이라기보다는 전쟁이 초래한 사회적 가치 체계의 붕괴가 개인의 내면에 내재화된 결과이다. 손창섭은 동옥이라는 인물을 통해 전후 한국 사회에 만연한 무력감과 자기 포기의 심리를 형상화하였으며, 이를 통해 전쟁의 폭력이 물리적 파괴에 그치지 않고 인간의 의지와 존엄까지 잠식하는 과정을 보여 주었다. 비가 끊임없이 내리는 배경 설정은 이러한 무기력의 정서를 공간적으로 확장하여, 인물의 내면 상태와 외부 환경이 상호 침투하는 분위기를 조성한다."
    },
    {
      id: "p3",
      text: "「잉여 인간」에서 손창섭은 전후 사회에서 자신의 존재 이유를 찾지 못하는 인물군을 통해 실존적 위기의 양상을 더욱 심화시켜 형상화하였다. 이 작품의 인물들은 사회적 역할을 상실한 채 하루하루를 연명하는 존재로서, 스스로를 잉여적 존재로 인식하고 있다. 이러한 자기 인식은 사르트르가 말한 실존적 구토의 한국적 변형으로 읽힐 수 있으며, 전후 한국 사회의 지식인들이 겪었던 실존적 공허를 문학적으로 구현한 것이다. 손창섭의 인물들이 보여 주는 자기 비하와 자기 파괴의 행동 양상은 전쟁 트라우마가 개인의 자아 정체성을 어떻게 해체하는지를 날카롭게 포착한 것이다. 이들은 적극적으로 세계에 저항하거나 대안을 모색하지 않으며, 오히려 자기 파멸을 향해 수동적으로 침잠해 가는데, 이러한 서사적 특징은 전후 문학 특유의 허무주의적 세계관을 반영한다."
    },
    {
      id: "p4",
      text: "손창섭의 인물 형상화가 한국 소설사에서 지니는 문학사적 의의는 크게 두 가지 측면에서 논의될 수 있다. 첫째, 그는 전쟁의 경험을 영웅적 서사나 민족주의적 담론으로 포장하지 않고, 전쟁이 평범한 개인의 삶에 남긴 상흔을 적나라하게 드러냄으로써 한국 전후 소설의 리얼리즘적 깊이를 확보하였다. 이러한 접근은 전쟁 문학이 지닌 이데올로기적 편향을 극복하고, 인간의 보편적 고통에 주목하는 문학적 시선을 확립하였다. 둘째, 손창섭의 인물들이 보여 주는 무기력과 자기 파괴의 양상은 이후 한국 소설에서 반영웅적 인물 형상화의 전통을 형성하는 데 기여하였다. 이청준과 최인훈의 소설에 등장하는 관념적이고 무기력한 지식인 인물의 원형이 손창섭의 전후 소설에서 이미 그 단초를 보이고 있기 때문이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "손창섭 소설에서 인물의 신체적 장애가 수행하는 문학적 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "전후 한국 사회의 도덕적·정신적 훼손을 은유적으로 형상화한 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「비 오는 날」에서 동옥의 무기력함이 의미하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "전쟁이 초래한 사회적 가치 체계의 붕괴가 개인의 내면에 내재화된 결과이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「비 오는 날」에서 비가 끊임없이 내리는 배경이 수행하는 서사적 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "인물의 내면 상태와 외부 환경이 상호 침투하는 분위기를 조성한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "「잉여 인간」의 인물들이 보여 주는 자기 인식의 특징은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "스스로를 잉여적 존재로 인식하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "손창섭이 한국 전후 소설의 리얼리즘적 깊이를 확보한 방법은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "전쟁이 평범한 개인의 삶에 남긴 상흔을 적나라하게 드러냄으로써 한국 전후 소설의 리얼리즘적 깊이를 확보하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "손창섭의 인물 형상화가 이후 한국 소설에 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "반영웅적 인물 형상화의 전통을 형성하는 데 기여하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(36, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 37: 비문학 (NONFICTION) ───
// 주제: 튜링 기계와 계산 가능성 이론 (컴퓨터과학/수학)
function buildDay37() {
  const paragraphs = [
    {
      id: "p1",
      text: "앨런 튜링이 1936년에 제안한 튜링 기계는 계산이라는 개념을 수학적으로 엄밀하게 정의하기 위한 이론적 장치이다. 튜링 기계는 무한한 길이의 테이프, 테이프 위의 기호를 읽고 쓰는 헤드, 그리고 유한한 상태들의 집합으로 구성된다. 헤드는 현재 위치의 기호와 기계의 현재 상태에 따라 기호를 변경하거나 좌우로 이동하며, 다음 상태로 전이한다. 이 단순한 구조에도 불구하고 튜링 기계는 인간이 수행할 수 있는 모든 기계적 계산을 시뮬레이션할 수 있다는 것이 처치-튜링 논제의 핵심 주장이다. 이 논제는 증명된 정리가 아니라 경험적으로 지지되는 가설이지만, 현재까지 이를 반박하는 사례는 발견되지 않았으며 컴퓨터 과학의 근본적 전제로 수용되고 있다."
    },
    {
      id: "p2",
      text: "튜링이 자신의 기계 모델을 통해 해결하고자 한 핵심 문제는 다비트 힐베르트가 제기한 결정 문제였다. 결정 문제란 임의의 수학적 명제가 참인지 거짓인지를 기계적 절차를 통해 판별할 수 있는 일반적인 알고리즘이 존재하는가 하는 물음이다. 튜링은 정지 문제를 통해 이 물음에 부정적 답변을 제시하였다. 정지 문제란 임의의 튜링 기계와 입력이 주어졌을 때, 해당 기계가 유한한 단계 내에 정지할 것인지 아니면 영원히 작동을 계속할 것인지를 판별하는 문제이다. 튜링은 귀류법을 사용하여, 정지 문제를 해결하는 튜링 기계가 존재한다고 가정하면 논리적 모순이 발생함을 보였다. 이 증명은 계산 가능한 문제와 계산 불가능한 문제 사이에 근본적인 경계가 존재함을 수학적으로 확립한 것이며, 괴델의 불완전성 정리와 함께 형식 체계의 본질적 한계를 드러낸 20세기 수학의 가장 중요한 성과 중 하나로 평가된다."
    },
    {
      id: "p3",
      text: "튜링의 또 다른 핵심적 기여는 보편 튜링 기계의 개념을 제시한 것이다. 보편 튜링 기계란 다른 모든 튜링 기계의 동작을 시뮬레이션할 수 있는 단일한 기계를 말한다. 특정 과제만을 수행하도록 설계된 개별 튜링 기계와 달리, 보편 튜링 기계는 시뮬레이션하고자 하는 기계의 설명을 입력으로 받아 그 기계와 동일한 결과를 산출한다. 이 개념은 오늘날 범용 컴퓨터의 이론적 원형이 된다. 현대의 컴퓨터가 다양한 프로그램을 실행하여 서로 다른 과제를 수행할 수 있는 것은, 본질적으로 보편 튜링 기계의 원리에 기반하는 것이다. 폰 노이만이 설계한 저장 프로그램 방식의 컴퓨터 구조 역시 보편 튜링 기계의 개념을 공학적으로 실현한 것으로, 프로그램과 데이터를 동일한 메모리에 저장하여 범용적 계산을 가능하게 하는 구조이다."
    },
    {
      id: "p4",
      text: "계산 가능성 이론은 이후 계산 복잡도 이론으로 발전하여, 단순히 문제가 풀 수 있는지의 여부를 넘어 얼마나 효율적으로 풀 수 있는지를 분석하는 단계로 나아갔다. 계산 복잡도 이론에서 가장 핵심적인 미해결 문제는 P 대 NP 문제이다. P 클래스는 다항 시간 내에 풀 수 있는 문제들의 집합이고, NP 클래스는 해답의 정당성을 다항 시간 내에 검증할 수 있는 문제들의 집합이다. 직관적으로 검증이 쉬운 문제가 반드시 풀기도 쉬운 것은 아닐 수 있으며, P와 NP가 같은 집합인지 아닌지는 아직 증명되지 않았다. 이 문제의 해결은 암호학, 최적화, 인공지능 등 광범위한 분야에 혁명적 영향을 미칠 것으로 예상되며, 클레이 수학 연구소가 선정한 밀레니엄 문제 중 하나로서 백만 달러의 상금이 걸려 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "처치-튜링 논제의 핵심 주장은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "튜링 기계는 인간이 수행할 수 있는 모든 기계적 계산을 시뮬레이션할 수 있다는 것이 처치-튜링 논제의 핵심 주장이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "튜링이 정지 문제의 증명을 통해 확립한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "계산 가능한 문제와 계산 불가능한 문제 사이에 근본적인 경계가 존재함을 수학적으로 확립한 것이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "보편 튜링 기계가 일반 튜링 기계와 다른 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "시뮬레이션하고자 하는 기계의 설명을 입력으로 받아 그 기계와 동일한 결과를 산출한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "폰 노이만의 저장 프로그램 방식이 보편 튜링 기계와 연결되는 지점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "프로그램과 데이터를 동일한 메모리에 저장하여 범용적 계산을 가능하게 하는 구조이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "P 클래스와 NP 클래스의 정의상 차이는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "P 클래스는 다항 시간 내에 풀 수 있는 문제들의 집합이고, NP 클래스는 해답의 정당성을 다항 시간 내에 검증할 수 있는 문제들의 집합이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "P 대 NP 문제의 해결이 중요한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "암호학, 최적화, 인공지능 등 광범위한 분야에 혁명적 영향을 미칠 것으로 예상되며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(37, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 38: 문학 (LITERATURE) ───
// 주제: 하이데거의 존재론과 시적 언어 (문학/철학)
function buildDay38() {
  const paragraphs = [
    {
      id: "p1",
      text: "마르틴 하이데거는 20세기 철학에서 존재의 의미를 가장 근본적으로 탐구한 사상가이다. 그의 주저 『존재와 시간』에서 하이데거는 서양 형이상학의 전통이 존재자에 대한 탐구에 몰두하면서 존재 자체에 대한 물음을 망각해 왔다고 진단하였다. 존재자란 구체적으로 존재하는 개별적 사물이나 대상을 의미하며, 존재란 이러한 존재자들이 존재할 수 있게 하는 근원적 조건을 가리킨다. 하이데거에 따르면 전통 형이상학은 존재를 하나의 최고 존재자로 환원하거나 존재자의 속성으로 파악함으로써, 존재 자체의 고유한 의미를 은폐해 왔다. 이러한 존재 망각의 역사를 극복하기 위해 하이데거는 존재의 의미를 새롭게 묻는 기초 존재론을 수립하였으며, 이 물음의 출발점으로 인간 존재, 즉 현존재의 분석을 택하였다."
    },
    {
      id: "p2",
      text: "하이데거의 후기 사유에서 언어는 존재의 의미를 드러내는 핵심적 매체로 부상한다. 그는 언어를 단순한 의사소통의 도구나 사물을 지칭하는 기호 체계로 보는 전통적 견해를 비판하면서, 언어는 존재의 집이라는 유명한 명제를 제시하였다. 이 명제에 따르면 인간은 언어 속에 거주하면서 존재의 의미를 경험하며, 언어를 통해 세계와의 관계를 형성한다. 그러나 일상적 언어는 존재의 의미를 드러내기보다는 오히려 은폐하는 경향이 있다. 일상적 언어 사용에서 인간은 사물을 도구적으로 파악하고 효율적으로 소통하는 데 치중하면서, 존재자가 존재하는 사태 자체에 대한 경이를 상실하게 된다. 하이데거가 보기에 이러한 언어의 도구화는 근대 기술 문명의 본질과 깊이 연관되어 있으며, 존재 망각의 가장 두드러진 현상적 표현이다."
    },
    {
      id: "p3",
      text: "하이데거는 이러한 일상적 언어의 한계를 넘어 존재의 의미를 진정으로 드러낼 수 있는 언어의 양식으로 시적 언어에 주목하였다. 그에게 시는 존재의 진리가 언어적으로 생기하는 사건이다. 시인은 존재가 스스로 드러나도록 언어를 열어 놓는 존재로서, 존재의 목소리에 귀 기울이고 이를 언어로 옮기는 역할을 수행한다. 하이데거가 특히 주목한 시인은 횔덜린으로, 그는 횔덜린의 시를 통해 시적 언어가 어떻게 존재의 근원적 의미를 열어 보이는지를 탐구하였다. 횔덜린의 시에서 신들의 부재와 신성한 것의 기다림이라는 주제는 하이데거에게 존재 망각의 시대에 존재의 의미를 새롭게 묻는 시적 사유의 전범으로 해석되었다. 시적 언어는 사물을 도구적으로 대상화하지 않고, 존재자가 자신의 고유한 존재를 드러내도록 언어적 공간을 열어 주는 것이다."
    },
    {
      id: "p4",
      text: "하이데거의 시적 언어론은 문학 이론과 미학에 지대한 영향을 미쳤다. 그의 사유는 작품을 주체의 표현이나 현실의 모방으로 보는 전통적 문학관을 근본적으로 전환시켰다. 하이데거에 따르면 예술 작품은 진리가 스스로 정립되는 장소이며, 시는 세계와 대지의 투쟁이 일어나는 사건이다. 이러한 관점은 가다머의 철학적 해석학과 리쾨르의 텍스트 해석 이론에 직접적 영향을 미쳤으며, 해체주의의 데리다 역시 하이데거의 존재론적 언어관을 비판적으로 계승하면서 자신의 차연 개념을 전개하였다. 그러나 하이데거의 시적 언어론에 대해서는 비판도 제기된다. 시적 언어에 존재론적 특권을 부여하는 그의 입장은 다른 형태의 언어적 실천이 지닌 의미를 과소평가할 위험이 있으며, 존재의 진리라는 개념 자체가 신비주의적이고 검증 불가능하다는 분석철학적 비판이 존재한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "하이데거가 진단한 서양 형이상학의 근본 문제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "존재자에 대한 탐구에 몰두하면서 존재 자체에 대한 물음을 망각해 왔다고 진단하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "하이데거가 '언어는 존재의 집이다'라는 명제를 통해 전달하고자 한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "인간은 언어 속에 거주하면서 존재의 의미를 경험하며, 언어를 통해 세계와의 관계를 형성한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "일상적 언어가 존재의 의미를 은폐하는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "사물을 도구적으로 파악하고 효율적으로 소통하는 데 치중하면서, 존재자가 존재하는 사태 자체에 대한 경이를 상실하게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "하이데거가 시인의 역할을 어떻게 규정하고 있는가?",
      answerRanges: [findRange(paragraphs, "p3", "존재의 목소리에 귀 기울이고 이를 언어로 옮기는 역할을 수행한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "하이데거의 사유가 전통적 문학관을 전환시킨 지점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "예술 작품은 진리가 스스로 정립되는 장소이며, 시는 세계와 대지의 투쟁이 일어나는 사건이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "하이데거의 시적 언어론에 대한 분석철학적 비판의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "존재의 진리라는 개념 자체가 신비주의적이고 검증 불가능하다는 분석철학적 비판이 존재한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(38, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 39: 비문학 (NONFICTION) ───
// 주제: 비트겐슈타인의 언어 게임 이론 (분석철학)
function buildDay39() {
  const paragraphs = [
    {
      id: "p1",
      text: "루트비히 비트겐슈타인의 후기 철학은 전기 저작 『논리-철학 논고』의 언어관을 근본적으로 수정한 것이다. 전기 비트겐슈타인은 언어가 세계의 논리적 구조를 반영하는 그림이라 보았으며, 명제의 의미는 그것이 묘사하는 사태와의 대응 관계에 의해 결정된다고 주장하였다. 그러나 후기 저작 『철학적 탐구』에서 비트겐슈타인은 그림 이론을 포기하고, 언어의 의미가 사용의 맥락에 의해 결정된다는 새로운 관점을 제시하였다. 그에 따르면 언어의 의미를 이해한다는 것은 추상적 대상을 파악하는 것이 아니라, 특정한 삶의 형식 속에서 언어가 어떻게 사용되는지를 아는 것이다. 이러한 전환은 의미의 소재를 언어 외부의 실재에서 언어적 실천의 내부로 이동시킨 것으로, 20세기 언어 철학의 실용적 전환을 대표한다."
    },
    {
      id: "p2",
      text: "비트겐슈타인이 후기 철학에서 도입한 핵심 개념이 바로 언어 게임이다. 언어 게임이란 언어와 그것이 엮여 있는 활동들의 총체를 가리키는 개념으로, 명령하기, 질문하기, 이야기하기 등 다양한 언어적 활동이 각각 고유한 규칙과 목적을 지닌 독립적인 게임으로 간주된다. 비트겐슈타인이 게임이라는 비유를 사용한 것은 의도적 선택이다. 체스, 축구, 카드놀이 등 다양한 게임들은 모두 게임이라 불리지만 이들을 관통하는 본질적 공통 속성은 존재하지 않으며, 다만 가족 유사성에 의해 느슨하게 연결되어 있을 뿐이다. 마찬가지로 다양한 언어적 활동들 사이에도 하나의 공통된 본질은 없으며, 이들은 중첩되고 교차하는 유사성들의 그물망을 통해 연결되어 있다. 이 가족 유사성 개념은 본질주의적 정의 방식에 대한 강력한 대안으로 평가된다."
    },
    {
      id: "p3",
      text: "언어 게임 이론에서 특히 중요한 논의는 규칙 따르기의 역설이다. 비트겐슈타인은 어떤 규칙도 그 자체만으로는 적용 방법을 유일하게 결정할 수 없다는 점을 지적하였다. 예컨대 2씩 더하라는 규칙을 따를 때, 누군가가 1000 이후에 1004, 1008로 나아가면서 자신은 규칙을 올바르게 따른다고 주장한다면, 규칙의 문자적 형식만으로는 이를 반박할 수 없다. 규칙의 올바른 적용은 규칙 자체에 내재된 것이 아니라, 언어 공동체의 공유된 실천과 훈련을 통해 확립되는 것이다. 이러한 논의는 사적 언어의 불가능성 논증으로 이어진다. 비트겐슈타인에 따르면 오직 자신만이 접근할 수 있는 내적 감각에 의해 의미가 결정되는 사적 언어는 성립할 수 없으며, 언어의 의미는 본질적으로 공적이고 사회적인 것이다."
    },
    {
      id: "p4",
      text: "비트겐슈타인의 언어 게임 이론은 현대 철학의 여러 분야에 광범위한 영향을 미쳤다. 과학 철학에서 토머스 쿤의 패러다임 이론은 과학적 활동을 언어 게임으로 이해하는 관점과 깊은 친화성을 보인다. 사회학에서 피터 윈치는 사회적 행위의 이해가 해당 사회의 언어 게임에 참여함으로써만 가능하다고 주장하였다. 법철학에서는 법적 개념의 의미가 사법적 실천의 맥락에서 결정된다는 논의에 비트겐슈타인의 사상이 원용된다. 그러나 이 이론에 대해서는 상대주의적 함축에 대한 우려가 제기된다. 각 언어 게임이 자체적인 규칙과 정당성의 기준을 지닌다면, 서로 다른 언어 게임 사이의 비판적 대화나 합리적 평가가 불가능해지는 것은 아닌지 하는 물음이 그것이다. 이에 대해 비트겐슈타인의 옹호자들은 언어 게임들이 완전히 고립된 것이 아니라 삶의 형식이라는 보다 넓은 맥락 속에서 상호 연결되어 있다고 반박한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "후기 비트겐슈타인이 전기의 그림 이론을 대체하여 제시한 언어관은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "언어의 의미가 사용의 맥락에 의해 결정된다는 새로운 관점을 제시하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "비트겐슈타인이 '게임' 비유를 통해 보여 주고자 한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "다양한 언어적 활동들 사이에도 하나의 공통된 본질은 없으며, 이들은 중첩되고 교차하는 유사성들의 그물망을 통해 연결되어 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "규칙 따르기의 역설에서 규칙의 올바른 적용이 확립되는 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "언어 공동체의 공유된 실천과 훈련을 통해 확립되는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "비트겐슈타인이 사적 언어의 성립을 부정하는 근거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "언어의 의미는 본질적으로 공적이고 사회적인 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "비트겐슈타인의 언어 게임 이론에 대해 제기되는 우려는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "서로 다른 언어 게임 사이의 비판적 대화나 합리적 평가가 불가능해지는 것은 아닌지 하는 물음이 그것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "상대주의 비판에 대한 비트겐슈타인 옹호자들의 반박은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "언어 게임들이 완전히 고립된 것이 아니라 삶의 형식이라는 보다 넓은 맥락 속에서 상호 연결되어 있다고 반박한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(39, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 40: 문학 (LITERATURE) ───
// 주제: 보르헤스의 「바벨의 도서관」에 나타난 무한의 문학적 형상화 (문학평론)
function buildDay40() {
  const paragraphs = [
    {
      id: "p1",
      text: "호르헤 루이스 보르헤스의 「바벨의 도서관」은 무한이라는 수학적·철학적 개념을 문학적 서사로 전환시킨 대표적 작품이다. 이 단편에서 보르헤스는 우주를 거대한 도서관으로 상정하는데, 이 도서관은 동일한 구조의 육각형 방들이 무한히 연결되어 구성되며 각 방에는 일정한 규격의 서가와 책들이 비치되어 있다. 모든 책은 동일한 분량과 동일한 수의 행과 글자로 이루어져 있으며, 가능한 모든 문자 조합이 도서관 어딘가에 반드시 하나의 책으로 존재한다. 이는 의미 있는 텍스트뿐 아니라 무의미한 문자열의 무한한 변형까지 포함되어 있음을 의미한다. 보르헤스는 이러한 전제를 통해 완전성과 무한성이 지닌 역설적 속성을 탐구하며, 모든 것을 포함하는 체계가 오히려 의미의 소멸로 귀결되는 아이러니를 형상화한다."
    },
    {
      id: "p2",
      text: "「바벨의 도서관」에서 도서관 주민들이 보이는 반응은 인류가 지식의 총체성을 마주할 때 경험하는 심리적 궤적을 상징적으로 보여 준다. 도서관에 모든 책이 존재한다는 사실이 밝혀졌을 때, 주민들은 환희에 빠졌다. 모든 지식과 진리가 이미 기록되어 있다는 확신이 무한한 희망을 불러일으킨 것이다. 그러나 이 환희는 곧 절망으로 전화하였는데, 수십억 권의 무의미한 책들 사이에서 의미 있는 한 권을 찾아내는 것이 사실상 불가능하다는 인식이 확산되었기 때문이다. 이러한 서사적 전개는 정보의 절대적 풍요가 오히려 의미의 빈곤으로 전화하는 역설을 구현한다. 보르헤스는 이를 통해 의미란 정보의 총량이 아니라 선택과 해석의 행위를 통해서만 발생하는 것임을 암시하며, 이는 오늘날 정보 과잉 시대의 상황을 예언적으로 포착한 것으로도 읽힌다."
    },
    {
      id: "p3",
      text: "보르헤스의 도서관이 수학적으로 구현하는 것은 조합론적 완전성의 개념이다. 유한한 수의 문자로 구성되는 고정된 길이의 텍스트에서 가능한 모든 조합을 실현한다는 설정은, 그 수가 천문학적으로 거대하더라도 엄밀히 말해 유한한 총량을 가진다. 그러나 이 유한한 수는 관측 가능한 우주의 원자 수보다도 압도적으로 크기 때문에, 사실상 무한과 구별할 수 없는 규모에 이른다. 보르헤스는 이러한 유한과 무한의 경계에 대한 수학적 직관을 문학적 서사의 추동력으로 전환시킨다. 도서관 속의 주민들은 이 사실상의 무한 앞에서 질서와 의미를 발견하려는 시도를 반복하지만, 그러한 시도 자체가 도서관의 임의성과 무관심한 완전성 앞에서 좌절될 수밖에 없다. 이 작품에서 보르헤스는 칸토어의 집합론과 무한 개념을 문학적 상상력으로 변형하여, 수학과 문학의 접점을 독창적으로 탐색한다."
    },
    {
      id: "p4",
      text: "「바벨의 도서관」의 문학사적 의의는 여러 층위에서 논의된다. 첫째, 이 작품은 메타픽션의 선구적 사례로서 문학이 자기 자신을 반성하는 서사의 가능성을 보여 주었다. 도서관 자체가 모든 가능한 텍스트를 포함하고 있으므로, 이 작품에 대한 모든 해석과 비평 역시 도서관 어딘가에 이미 존재한다는 자기 참조적 역설이 발생한다. 둘째, 보르헤스는 서사의 소재를 구체적 현실이 아닌 추상적 관념에서 찾음으로써 관념 소설이라는 독자적 장르를 확립하였다. 셋째, 이 작품은 포스트모더니즘 문학에서 핵심적으로 다루어지는 의미의 불확정성, 해석의 무한 순환, 텍스트의 자율성 등의 주제를 선취하고 있다. 보르헤스의 문학적 유산은 칼비노, 에코, 핀천 등 후대 작가들에게 지대한 영향을 미쳤으며, 문학이 철학과 수학의 영역에서 고유한 방식으로 사유할 수 있음을 입증하였다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "보르헤스가 도서관의 완전성을 통해 형상화한 역설은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "모든 것을 포함하는 체계가 오히려 의미의 소멸로 귀결되는 아이러니를 형상화한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "도서관 주민들의 환희가 절망으로 전환된 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "수십억 권의 무의미한 책들 사이에서 의미 있는 한 권을 찾아내는 것이 사실상 불가능하다는 인식이 확산되었기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "보르헤스가 정보의 풍요와 의미의 관계에 대해 암시하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "의미란 정보의 총량이 아니라 선택과 해석의 행위를 통해서만 발생하는 것임을 암시하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "도서관의 총량이 유한함에도 사실상 무한으로 간주되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "관측 가능한 우주의 원자 수보다도 압도적으로 크기 때문에, 사실상 무한과 구별할 수 없는 규모에 이른다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "「바벨의 도서관」이 메타픽션의 선구적 사례로 평가되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "이 작품에 대한 모든 해석과 비평 역시 도서관 어딘가에 이미 존재한다는 자기 참조적 역설이 발생한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "보르헤스가 관념 소설이라는 장르를 확립한 방법은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "서사의 소재를 구체적 현실이 아닌 추상적 관념에서 찾음으로써 관념 소설이라는 독자적 장르를 확립하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(40, "LITERATURE", "문학", paragraphs, confirmQuestions);
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
  console.log("=== 비트겐슈타인3 Day 36~40 빌드 시작 ===\n");

  const contents = [
    buildDay36(),
    buildDay37(),
    buildDay38(),
    buildDay39(),
    buildDay40()
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

  // 배치 파일 갱신
  console.log("\n배치 파일 갱신 중...");
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`현재 배치 items 수: ${batchData.items.length}`);

  const dayIndices = [36, 37, 38, 39, 40];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1;
    const subArea = contents[i].subArea;
    const batchItem = wrapBatchItem(contents[i], dayIdx, subArea);

    if (batchIdx < batchData.items.length) {
      console.log(`교체: items[${batchIdx}] (${batchData.items[batchIdx].content.contentId} → ${contents[i].contentId})`);
      batchData.items[batchIdx] = batchItem;
    } else {
      console.log(`추가: items[${batchIdx}] (${contents[i].contentId})`);
      // 필요한 경우 빈 슬롯 채우기
      while (batchData.items.length < batchIdx) {
        batchData.items.push(null);
      }
      batchData.items.push(batchItem);
    }
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료`);

  console.log("\n=== 빌드 완료 ===");
}

main();
