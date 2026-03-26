#!/usr/bin/env node
// 비트겐슈타인3 Day 41~45 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION, 짝수 Day = LITERATURE
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

// ─── Day 41: 비문학 (NONFICTION) — 쿤의 과학 혁명의 구조와 패러다임 전환 ───
function buildDay41() {
  const paragraphs = [
    {
      id: "p1",
      text: "토머스 쿤은 1962년 출간한 『과학 혁명의 구조』에서 과학의 발전이 지식의 점진적 축적을 통해 이루어진다는 전통적 관점을 근본적으로 비판하였다. 그는 과학의 역사가 연속적 진보가 아니라 패러다임의 전환이라는 불연속적 변혁을 통해 진행된다고 주장하였다. 쿤이 제시한 패러다임 개념은 특정 시기의 과학자 공동체가 공유하는 이론적 틀, 연구 방법, 문제 설정 방식, 성공적 연구의 모범 사례 등을 포괄하는 것으로, 이는 단순한 이론 이상의 포괄적인 세계관에 해당한다. 패러다임은 과학자들에게 어떤 문제가 탐구할 가치가 있는지, 어떤 방법이 적합한지, 어떤 결과가 수용 가능한지를 규정함으로써 과학적 탐구의 전체적 방향을 결정한다. 이러한 관점에서 과학적 활동은 객관적 자연의 발견이라기보다는 패러다임이라는 인식론적 틀 안에서의 구성적 활동으로 이해된다."
    },
    {
      id: "p2",
      text: "쿤은 패러다임에 기반한 과학적 활동을 정상 과학이라 명명하였다. 정상 과학의 시기에 과학자들은 패러다임이 제시하는 틀 안에서 퍼즐 풀기에 해당하는 연구를 수행한다. 이 시기의 연구는 기존 패러다임의 정교화와 확장에 초점을 맞추며, 패러다임 자체에 대한 근본적 의문은 제기되지 않는다. 그러나 정상 과학의 진행 과정에서 기존 패러다임으로는 설명할 수 없는 이상 현상이 축적되기 시작하면, 과학자 공동체는 위기의 시기로 진입하게 된다. 위기의 시기에는 기존 패러다임에 대한 신뢰가 흔들리고, 다양한 대안적 이론이 경쟁하게 되며, 과학자 공동체 내부에서 심각한 논쟁이 발생한다. 이러한 위기가 충분히 심화되면, 이상 현상을 설명할 수 있는 새로운 패러다임이 등장하여 기존 패러다임을 대체하는 과학 혁명이 일어나게 된다."
    },
    {
      id: "p3",
      text: "쿤의 이론에서 가장 논쟁적인 개념은 공약 불가능성이다. 그에 따르면 서로 다른 패러다임은 상이한 개념 체계와 관찰 언어를 사용하기 때문에, 패러다임 간의 직접적 비교가 원리적으로 불가능하다. 예컨대 뉴턴 역학에서의 질량 개념과 아인슈타인 상대성 이론에서의 질량 개념은 동일한 용어를 사용하지만 전혀 다른 의미를 지니며, 따라서 두 이론은 동일한 기준으로 비교될 수 없다는 것이다. 이 주장은 과학적 지식의 객관성과 합리적 진보에 대한 심각한 도전으로 받아들여졌다. 비판자들은 공약 불가능성 테제가 과학을 합리적 기획이 아닌 사회적 합의의 산물로 전락시킨다고 우려하였으며, 과학이 실재에 점진적으로 접근해 가는 과정이라는 과학적 실재론의 입장과 양립하기 어렵다는 점을 지적하였다."
    },
    {
      id: "p4",
      text: "쿤의 패러다임 이론은 과학철학의 지형을 근본적으로 변화시켰다. 우선 그의 이론은 과학적 지식의 역사성과 사회성을 부각시킴으로써, 과학을 순수한 논리적 탐구로 보는 논리 실증주의의 관점에 결정적 타격을 가하였다. 또한 쿤의 작업은 과학 사회학과 과학 지식 사회학의 발전에 중요한 이론적 자원을 제공하였으며, 과학 기술학이라는 새로운 학제간 분야의 형성에 기여하였다. 그러나 쿤 자신은 과학이 비합리적이라고 주장한 것은 아니었다. 그는 후기 저작에서 패러다임 전환 과정에서도 경험적 적합성, 문제 해결 능력, 이론의 단순성 등이 중요한 기준으로 작용한다고 강조하며, 과학의 합리성을 재규정하고자 하였다. 이러한 입장 수정에도 불구하고, 쿤의 이론은 과학적 지식의 절대성에 대한 근본적 물음을 제기한 학문적 성취로 평가되고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "쿤이 제시한 패러다임 개념이 단순한 이론 이상인 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "특정 시기의 과학자 공동체가 공유하는 이론적 틀, 연구 방법, 문제 설정 방식, 성공적 연구의 모범 사례 등을 포괄하는 것으로, 이는 단순한 이론 이상의 포괄적인 세계관에 해당한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "정상 과학의 시기에 과학자들이 수행하는 연구의 특징은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "기존 패러다임의 정교화와 확장에 초점을 맞추며, 패러다임 자체에 대한 근본적 의문은 제기되지 않는다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "과학 혁명이 발생하는 계기는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "이상 현상을 설명할 수 있는 새로운 패러다임이 등장하여 기존 패러다임을 대체하는 과학 혁명이 일어나게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "공약 불가능성 테제에 대한 비판자들의 주된 우려는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "과학을 합리적 기획이 아닌 사회적 합의의 산물로 전락시킨다고 우려하였으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "쿤의 이론이 논리 실증주의에 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "과학적 지식의 역사성과 사회성을 부각시킴으로써, 과학을 순수한 논리적 탐구로 보는 논리 실증주의의 관점에 결정적 타격을 가하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "쿤이 후기 저작에서 과학의 합리성을 재규정하기 위해 제시한 기준들은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "경험적 적합성, 문제 해결 능력, 이론의 단순성 등이 중요한 기준으로 작용한다고 강조하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(41, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 42: 문학 (LITERATURE) — 김승옥의 「무진기행」에 나타난 내면 풍경 ───
function buildDay42() {
  const paragraphs = [
    {
      id: "p1",
      text: "김승옥의 「무진기행」은 1964년 발표된 한국 현대 소설의 대표작으로, 산업화 시대 한국 사회에서 개인의 내면적 갈등을 섬세하게 형상화한 작품이다. 주인공 윤희중은 서울에서 제약 회사에 다니는 회사원으로, 아내의 가문이 소유한 회사에서 입지를 굳히기 위해 전략적 결혼을 한 인물이다. 그는 사회적 성공을 위해 본래적 자아를 억압하고 세속적 질서에 순응해 온 존재이며, 고향 무진으로의 귀향은 억압된 자아와의 대면을 의미한다. 무진은 단순한 지리적 공간이 아니라 윤희중의 과거와 꿈, 실패한 문학적 야망이 잠재해 있는 심리적 공간으로 기능한다. 김승옥은 이 작품에서 외적 사건의 전개보다 인물의 내면에서 일어나는 심리적 변화를 포착하는 데 주력하였으며, 이를 통해 한국 소설에서 감수성의 혁명이라 불리는 새로운 서사적 가능성을 열었다."
    },
    {
      id: "p2",
      text: "「무진기행」에서 무진이라는 공간은 안개라는 핵심적 모티프를 통해 형상화된다. 무진의 안개는 현실의 윤곽을 흐리게 만들어 일상적 질서를 유보시키는 장치로 작동하며, 주인공이 서울에서의 사회적 정체성을 일시적으로 벗어놓고 억압된 감정과 욕망에 접근할 수 있게 하는 조건을 형성한다. 안개에 둘러싸인 무진에서 윤희중은 서울에서는 결코 드러내지 못했던 감정적 솔직함을 보이며, 이는 안개가 사회적 가면을 걷어 내는 심리적 기능을 수행하고 있음을 보여 준다. 그러나 안개는 동시에 현실 인식을 흐리게 만드는 자기 기만의 매체이기도 하다. 윤희중이 무진에서 경험하는 감정적 해방감은 안개처럼 실체가 불분명한 것이며, 안개가 걷히면 다시 서울의 현실로 돌아가야 한다는 사실은 이 해방감의 허구성을 암시한다."
    },
    {
      id: "p3",
      text: "윤희중과 하인숙의 관계는 이 작품의 내면적 갈등을 가장 첨예하게 드러내는 서사적 장치이다. 음악 교사인 하인숙은 무진이라는 폐쇄적 공간에서 자살 미수의 경험을 가진 인물로, 윤희중에게 자신의 억압된 감정적 진실성의 투영 대상으로 기능한다. 윤희중은 하인숙에게서 자신이 서울에서 포기한 순수한 감정과 예술적 열망의 반영을 발견하며, 이러한 감정적 교류는 그에게 일시적인 자아 회복의 경험을 제공한다. 그러나 이 관계는 근본적으로 불균등한 것이다. 윤희중에게 하인숙과의 만남이 일탈적 감상 여행의 일부에 불과한 반면, 하인숙에게 그것은 실존적 절박함을 담은 관계이다. 윤희중이 무진을 떠나며 하인숙에게 남기는 편지는 이러한 불균등성을 보여 주며, 그것은 진정한 소통이 아니라 자기 합리화의 수사에 가깝다."
    },
    {
      id: "p4",
      text: "「무진기행」의 문학사적 의의는 한국 소설에서 감각적 문체와 내면 심리의 서사화를 새로운 수준으로 끌어올린 데 있다. 김승옥은 이 작품에서 시각, 촉각, 후각 등의 감각적 이미지를 정밀하게 배치하여 인물의 심리 상태를 외적 풍경에 투사하는 기법을 구사하였다. 무진의 습기 찬 공기, 갯벌의 냄새, 안개에 젖은 길 등의 감각적 묘사는 단순한 배경 서술이 아니라 주인공의 내면 상태를 반영하는 객관적 상관물로 기능한다. 이러한 감각적 문체는 이전 세대의 관념적이고 선언적인 문체와 뚜렷한 대조를 이루며, 한국 소설의 미학적 가능성을 크게 확장하였다. 또한 이 작품은 산업화와 근대화가 개인의 내면에 미치는 영향을 탐구함으로써, 경제 성장이라는 거시적 서사 이면에 존재하는 개인의 소외와 자기 분열의 문제를 예리하게 포착하였다. 「무진기행」은 이후 한국 소설에서 내면 탐구의 전통을 형성하는 출발점으로 평가받고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "무진이라는 공간이 주인공에게 지니는 심리적 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "윤희중의 과거와 꿈, 실패한 문학적 야망이 잠재해 있는 심리적 공간으로 기능한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "안개가 윤희중에게 수행하는 심리적 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "안개가 사회적 가면을 걷어 내는 심리적 기능을 수행하고 있음을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "윤희중이 무진에서 경험하는 해방감의 한계는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "안개가 걷히면 다시 서울의 현실로 돌아가야 한다는 사실은 이 해방감의 허구성을 암시한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "윤희중과 하인숙의 관계가 근본적으로 불균등한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "윤희중에게 하인숙과의 만남이 일탈적 감상 여행의 일부에 불과한 반면, 하인숙에게 그것은 실존적 절박함을 담은 관계이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "김승옥이 무진의 감각적 묘사를 통해 구현한 문학적 기법은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "주인공의 내면 상태를 반영하는 객관적 상관물로 기능한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "「무진기행」이 산업화 시대의 개인에 대해 포착한 문제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "경제 성장이라는 거시적 서사 이면에 존재하는 개인의 소외와 자기 분열의 문제를 예리하게 포착하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(42, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 43: 비문학 (NONFICTION) — 인공 신경망의 구조와 학습 원리 ───
function buildDay43() {
  const paragraphs = [
    {
      id: "p1",
      text: "인공 신경망은 생물학적 신경계의 구조와 기능에서 영감을 받아 설계된 계산 모델이다. 인간의 뇌는 약 860억 개의 뉴런이 시냅스라는 연결부를 통해 상호 연결된 거대한 네트워크로 구성되어 있으며, 인공 신경망은 이러한 뉴런과 시냅스의 관계를 수학적으로 모방한다. 인공 신경망의 기본 단위인 퍼셉트론은 다수의 입력값을 받아 가중치를 곱한 후 합산하고, 그 결과에 활성화 함수를 적용하여 출력값을 생성한다. 여기서 가중치는 생물학적 시냅스의 강도에 해당하는 매개변수로, 학습 과정에서 조정되면서 신경망이 특정 패턴을 인식할 수 있게 된다. 초기 퍼셉트론은 선형적으로 분리 가능한 문제만 해결할 수 있다는 한계가 있었으나, 다층 구조의 도입과 비선형 활성화 함수의 적용을 통해 이러한 한계가 극복되었다."
    },
    {
      id: "p2",
      text: "현대 인공 신경망의 핵심 구조인 다층 퍼셉트론은 입력층, 은닉층, 출력층으로 구성된다. 입력층은 외부 데이터를 받아들이는 역할을 하며, 출력층은 최종 결과를 생성한다. 이 두 층 사이에 위치한 은닉층은 입력 데이터의 복잡한 특징을 추출하고 변환하는 핵심적 역할을 수행한다. 은닉층의 수가 증가할수록 신경망은 더 높은 수준의 추상적 특징을 학습할 수 있게 되며, 이처럼 많은 은닉층을 가진 신경망을 심층 신경망이라 한다. 심층 신경망의 학습이 가능해진 것은 역전파 알고리즘의 발전 덕분이다. 역전파는 출력층에서 계산된 오차를 은닉층 방향으로 역방향으로 전달하면서 각 가중치의 기여도를 계산하고, 이를 기반으로 가중치를 조정하는 방법이다. 이 과정에서 경사 하강법이 활용되는데, 이는 오차 함수의 기울기를 따라 가중치를 점진적으로 최적화하는 기법이다."
    },
    {
      id: "p3",
      text: "인공 신경망의 학습 과정에서 가장 중요한 과제 중 하나는 과적합의 방지이다. 과적합이란 신경망이 훈련 데이터의 특수한 패턴과 잡음까지 학습하여 새로운 데이터에 대한 일반화 능력이 저하되는 현상을 말한다. 이는 신경망의 매개변수가 훈련 데이터에 비해 지나치게 많을 때 주로 발생하며, 시험에서 문제를 이해하는 것이 아니라 답을 외우는 것에 비유할 수 있다. 과적합을 방지하기 위한 대표적 기법으로는 드롭아웃, 조기 종료, 정규화 등이 있다. 드롭아웃은 학습 과정에서 무작위로 일부 뉴런을 비활성화하여 특정 뉴런에 대한 과도한 의존을 방지하는 기법이며, 조기 종료는 검증 데이터에 대한 성능이 더 이상 개선되지 않는 시점에서 학습을 중단하는 방법이다. 정규화는 가중치의 크기에 제약을 가하여 모델의 복잡도를 제한하는 기법이다."
    },
    {
      id: "p4",
      text: "인공 신경망은 다양한 변형 구조를 통해 특수한 과제에 특화된 성능을 발휘한다. 합성곱 신경망은 이미지의 공간적 특징을 효과적으로 추출하기 위해 설계된 구조로, 합성곱 연산을 통해 이미지의 국소적 패턴을 감지하고 이를 계층적으로 조합하여 복잡한 시각적 특징을 인식한다. 순환 신경망은 시계열 데이터와 자연어 처리에 적합한 구조로, 이전 시점의 출력을 다음 시점의 입력으로 되먹임하여 순서 정보를 유지한다. 그러나 순환 신경망은 장기 의존성 문제를 가지고 있어, 이를 개선한 장단기 기억 네트워크가 개발되었다. 최근에는 트랜스포머 구조가 자연어 처리 분야에서 혁신적 성과를 거두고 있는데, 이 구조는 자기 주의 메커니즘을 통해 입력 시퀀스 내의 모든 요소 간 관계를 동시에 계산함으로써 병렬 처리가 가능하고 장거리 의존성도 효과적으로 포착할 수 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "인공 신경망에서 가중치가 수행하는 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "가중치는 생물학적 시냅스의 강도에 해당하는 매개변수로, 학습 과정에서 조정되면서 신경망이 특정 패턴을 인식할 수 있게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "역전파 알고리즘의 작동 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "출력층에서 계산된 오차를 은닉층 방향으로 역방향으로 전달하면서 각 가중치의 기여도를 계산하고, 이를 기반으로 가중치를 조정하는 방법이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "과적합 현상이 발생하는 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "신경망의 매개변수가 훈련 데이터에 비해 지나치게 많을 때 주로 발생하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "드롭아웃 기법이 과적합을 방지하는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "학습 과정에서 무작위로 일부 뉴런을 비활성화하여 특정 뉴런에 대한 과도한 의존을 방지하는 기법이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "합성곱 신경망이 이미지를 인식하는 방식은 어떠한가?",
      answerRanges: [findRange(paragraphs, "p4", "합성곱 연산을 통해 이미지의 국소적 패턴을 감지하고 이를 계층적으로 조합하여 복잡한 시각적 특징을 인식한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "트랜스포머 구조가 기존 순환 신경망 대비 가진 장점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "자기 주의 메커니즘을 통해 입력 시퀀스 내의 모든 요소 간 관계를 동시에 계산함으로써 병렬 처리가 가능하고 장거리 의존성도 효과적으로 포착할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(43, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 44: 문학 (LITERATURE) — 이상의 「오감도」에 나타난 근대적 공포의 형상화 ───
function buildDay44() {
  const paragraphs = [
    {
      id: "p1",
      text: "이상의 「오감도」는 1934년 조선중앙일보에 연재된 연작시로, 한국 현대시사에서 가장 전위적인 작품으로 평가된다. 이 작품은 발표 당시 독자들의 항의로 연재가 중단되었을 만큼 파격적이었으며, 이상이 추구한 시적 실험이 당대의 미학적 감수성을 급진적으로 넘어서고 있었음을 반증한다. 「오감도」라는 제목은 조감도의 변형으로 해석되어 왔는데, 세계를 위에서 조망하는 것이 아니라 감각적 혼란과 불안의 시선으로 바라보는 것을 의미한다. 이상은 이 작품에서 근대 도시 공간에서 경험하는 실존적 공포와 불안을 기존의 서정적 언어가 아닌 해체적이고 수리적인 언어로 형상화하였다. 이를 통해 이상은 언어가 세계를 투명하게 재현할 수 있다는 낭만적 전제를 부정하고, 언어 자체의 물질성과 불투명성을 시의 전면에 드러내었다."
    },
    {
      id: "p2",
      text: "「오감도」 시제1호에 등장하는 '13인의 아해'는 이 연작시의 핵심적 이미지이다. 13인의 아해가 도로로 질주하는 이 장면은 근대적 공간에서 인간이 경험하는 공포의 집단적 양상을 압축적으로 보여 준다. 아해들은 막다른 골목을 향해 질주하지만 돌아올 줄을 모르며, 이는 근대성이 약속하는 진보의 방향이 실제로는 폐쇄와 좌절로 귀결될 수 있음을 암시한다. 또한 '무서운 아해'와 '무서워하는 아해'의 구분은 공포의 주체와 객체가 고정되지 않고 상호 전환될 수 있음을 보여 주며, 이는 근대적 감시 체계 속에서 누구나 공포의 대상이자 주체가 될 수 있다는 인식을 반영한다. 이 시에서 반복되는 숫자와 대칭 구조는 수학적 정밀성을 시적 언어에 도입한 것으로, 감정의 직접적 표현을 거부하고 구조적 긴장을 통해 공포를 형상화하는 독특한 방법론을 구현하고 있다."
    },
    {
      id: "p3",
      text: "「오감도」에서 이상이 형상화하는 공포는 외부의 구체적 위협에서 비롯되는 것이 아니라 존재 자체의 불안정성에서 발생하는 근원적 공포이다. 이상은 거울, 해부, 질주, 미로 등의 반복적 이미지를 통해 주체의 분열과 해체를 시각화한다. 특히 거울의 모티프는 이상의 작품 세계 전반에 걸쳐 핵심적 역할을 수행하는데, 거울 속의 자아는 실재하는 자아의 반영이면서 동시에 자아를 타자화하는 장치이다. 거울 앞에 선 주체는 자기 자신을 대상으로 응시하게 되고, 이 과정에서 자아의 통일성에 대한 확신이 흔들리게 된다. 이는 근대적 주체가 자기 동일성을 유지하기 어려운 상황에 처해 있음을 형상화한 것이며, 프로이트가 분석한 언캐니의 감정, 즉 친숙한 것이 낯설게 느껴지는 불안의 경험과 맥락을 같이한다."
    },
    {
      id: "p4",
      text: "「오감도」의 문학사적 의의는 한국 모더니즘 시의 가능성을 극한까지 실험한 데 있다. 이상은 전통적 시의 구성 요소인 운율, 비유, 서정적 화자의 고백 등을 의도적으로 해체함으로써, 시가 아름다운 감정의 표현이어야 한다는 관습적 기대를 전복하였다. 대신 그는 시를 사유의 실험실로 전환하여, 언어와 존재의 관계에 대한 근본적 물음을 시적 형식 자체로 구현하였다. 이러한 실험은 당대에는 이해되지 못하였으나, 1960년대 이후 한국 문학 연구에서 재발견되면서 이상은 한국 모더니즘의 선구자로 자리매김하게 되었다. 이상의 시적 유산은 이후 조향, 김춘수 등의 실험적 시인들에게 계승되었으며, 한국 현대시가 서정적 전통을 넘어 지적이고 형식적인 탐구의 영역으로 확장되는 데 결정적 역할을 하였다. 오늘날 「오감도」는 근대적 주체의 위기를 가장 급진적으로 형상화한 한국 문학의 기념비적 작품으로 평가받고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "이상이 「오감도」에서 기존 언어관에 대해 부정한 전제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "언어가 세계를 투명하게 재현할 수 있다는 낭만적 전제를 부정하고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "13인의 아해가 막다른 골목을 향해 질주하는 이미지가 암시하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "근대성이 약속하는 진보의 방향이 실제로는 폐쇄와 좌절로 귀결될 수 있음을 암시한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「오감도」에서 반복되는 숫자와 대칭 구조가 구현하는 시적 방법론은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "감정의 직접적 표현을 거부하고 구조적 긴장을 통해 공포를 형상화하는 독특한 방법론을 구현하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "거울의 모티프가 근대적 주체에 대해 형상화하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "근대적 주체가 자기 동일성을 유지하기 어려운 상황에 처해 있음을 형상화한 것이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이상이 시를 전환한 방향과 그 목적은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "시를 사유의 실험실로 전환하여, 언어와 존재의 관계에 대한 근본적 물음을 시적 형식 자체로 구현하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이상의 시적 유산이 한국 현대시에 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "한국 현대시가 서정적 전통을 넘어 지적이고 형식적인 탐구의 영역으로 확장되는 데 결정적 역할을 하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(44, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 45: 비문학 (NONFICTION) — 푸코의 권력-지식 이론 ───
function buildDay45() {
  const paragraphs = [
    {
      id: "p1",
      text: "미셸 푸코는 권력과 지식의 관계에 대한 전통적 이해를 근본적으로 전환한 사상가이다. 전통적으로 권력은 특정 주체가 소유하는 억압적 힘으로, 지식은 권력으로부터 독립적인 객관적 인식의 산물로 여겨졌다. 그러나 푸코는 권력과 지식이 분리될 수 없는 상호 구성적 관계에 있다고 주장하며, 이를 권력-지식이라는 개념으로 정식화하였다. 그에 따르면 권력은 특정한 유형의 지식을 생산하고, 그렇게 생산된 지식은 다시 권력의 행사를 가능하게 하는 도구로 작동한다. 예컨대 범죄학은 범죄자를 분류하고 유형화하는 지식을 생산하지만, 이 지식은 동시에 감시와 처벌이라는 권력의 행사를 정당화하는 기능을 수행한다. 이처럼 푸코에게 지식은 중립적 발견이 아니라 권력 관계 속에서 구성되는 담론적 실천이다."
    },
    {
      id: "p2",
      text: "푸코의 권력 이론에서 가장 혁신적인 측면은 권력을 억압적 기제가 아닌 생산적 기제로 파악한 점이다. 전통적 권력 이론이 권력을 금지와 배제의 메커니즘으로 이해한 반면, 푸코는 권력이 주체를 형성하고 담론을 생산하며 새로운 지식 영역을 창출하는 생산적 힘으로 작동한다고 보았다. 그는 이를 근대적 권력의 핵심으로 규정하면서 규율 권력이라는 개념을 제시하였다. 규율 권력은 개인의 신체를 관찰, 훈련, 교정하여 순종적이고 유용한 주체를 만들어 내는 메커니즘이다. 학교, 병원, 군대, 공장 등의 근대적 제도는 이러한 규율 권력의 작동 공간으로, 시간표의 편성, 공간의 분할, 감시의 위계적 조직을 통해 개인의 행동을 미시적 수준에서 조절한다. 규율 권력은 물리적 폭력에 의존하지 않고 개인이 스스로 규범을 내면화하도록 유도한다는 점에서 전근대적 권력과 구별된다."
    },
    {
      id: "p3",
      text: "푸코는 벤담이 고안한 원형 감옥인 파놉티콘을 규율 권력의 원리를 가장 잘 보여 주는 모델로 분석하였다. 파놉티콘에서 수감자들은 중앙 감시탑에서 언제든 관찰될 수 있지만 감시자를 볼 수 없으며, 실제 감시 여부와 무관하게 항상 감시받고 있다는 의식을 내면화하게 된다. 이 구조는 최소 비용으로 최대 규율 효과를 달성하는 권력의 경제학을 구현하며, 외부의 강제 없이도 개인이 자발적으로 규범에 순응하도록 만드는 자기 규율의 메커니즘을 작동시킨다. 푸코는 파놉티콘의 원리가 감옥에 한정되지 않고 근대 사회 전반에 확산되어 있다고 주장하였다. 학교의 시험 제도, 병원의 진료 기록, 기업의 성과 평가 등은 모두 파놉티콘적 감시 원리의 변형으로, 개인에 대한 지식을 체계적으로 생산하면서 동시에 그 지식을 통해 개인을 관리하고 통제하는 이중적 기능을 수행한다."
    },
    {
      id: "p4",
      text: "푸코의 권력-지식 이론은 사회과학 전반에 깊은 영향을 미쳤다. 교육학에서는 학교가 지식 전달 기관이면서 규율 권력의 공간이라는 인식이 확산되었고, 의학에서는 질병의 분류와 진단이 권력 관계를 반영하는 담론적 실천이라는 비판적 시각이 등장하였다. 법학에서는 법적 범주가 역사적 권력 관계의 산물이라는 분석이 발전하였다. 그러나 푸코의 이론에 대한 비판도 적지 않다. 권력이 어디에나 편재한다면 그에 대한 저항이 어떻게 가능한지가 불분명해지며, 규범적 기준 없이 권력을 비판할 수 있는 근거가 약화된다는 것이다. 이에 대해 푸코는 권력이 있는 곳에는 반드시 저항이 있으며, 저항은 권력 관계의 내부에서 발생한다고 응답하였다. 이러한 관점에서 비판적 실천은 거대한 해방의 기획이 아니라 구체적인 권력 관계를 분석하고 변형시키는 미시적 실천의 형태를 취하게 된다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "푸코가 권력-지식 개념을 통해 드러낸 권력과 지식의 관계는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "권력은 특정한 유형의 지식을 생산하고, 그렇게 생산된 지식은 다시 권력의 행사를 가능하게 하는 도구로 작동한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "규율 권력이 전근대적 권력과 구별되는 특징은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "물리적 폭력에 의존하지 않고 개인이 스스로 규범을 내면화하도록 유도한다는 점에서 전근대적 권력과 구별된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "파놉티콘이 작동시키는 핵심 메커니즘은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "외부의 강제 없이도 개인이 자발적으로 규범에 순응하도록 만드는 자기 규율의 메커니즘을 작동시킨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "학교의 시험 제도, 병원의 진료 기록 등이 수행하는 이중적 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "개인에 대한 지식을 체계적으로 생산하면서 동시에 그 지식을 통해 개인을 관리하고 통제하는 이중적 기능을 수행한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "푸코 이론에 대한 핵심적 비판은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "권력이 어디에나 편재한다면 그에 대한 저항이 어떻게 가능한지가 불분명해지며, 규범적 기준 없이 권력을 비판할 수 있는 근거가 약화된다는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "푸코가 제시한 비판적 실천의 형태는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "구체적인 권력 관계를 분석하고 변형시키는 미시적 실천의 형태를 취하게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(45, "NONFICTION", "비문학", paragraphs, confirmQuestions);
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
  console.log("=== 비트겐슈타인3 Day 41~45 빌드 시작 ===\n");

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
