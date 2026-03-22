#!/usr/bin/env node
// 비트겐슈타인1 Day 41~45 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION (비문학), 짝수 Day = LITERATURE (문학)
// 목표 글자수: 1400자 ±50 (1350~1450)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-wittgenstein1.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/wittgenstein1');

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

// ─── Day 41: 비문학 (NONFICTION) — 상대성 이론의 시간 지연 효과 (물리학) ───
function buildDay41() {
  const paragraphs = [
    {
      id: "p1",
      text: "아인슈타인의 특수 상대성 이론에 따르면, 시간은 모든 관찰자에게 동일하게 흐르는 절대적 양이 아니라 관찰자의 운동 상태에 따라 달라지는 상대적 양이다. 이를 시간 지연 효과라 하며, 빠르게 움직이는 물체에서는 정지해 있는 관찰자의 기준에서 볼 때 시간이 더 느리게 흐르는 현상이 나타난다. 이 효과는 뉴턴 역학에서 시간을 우주 어디에서나 동일하게 흐르는 절대적 배경으로 간주했던 것과 근본적으로 다른 관점이다. 시간 지연은 일상적 속도에서는 감지할 수 없을 만큼 미미하지만, 물체의 속도가 빛의 속도에 가까워질수록 그 효과가 극적으로 커진다. 예컨대 빛의 속도의 약 87퍼센트로 이동하는 물체에서는 시간이 정지 상태의 절반 속도로 흐르게 된다."
    },
    {
      id: "p2",
      text: "시간 지연 효과는 순수한 이론적 예측에 그치지 않고, 실험적으로 여러 차례 검증되었다. 대표적인 사례로 뮤온 실험이 있다. 뮤온은 우주선이 지구 대기권 상층부와 충돌할 때 생성되는 아원자 입자로, 정지 상태에서의 평균 수명은 약 2.2마이크로초에 불과하다. 이 짧은 수명을 고려하면 뮤온은 대기권 상층부에서 생성된 후 지표면에 도달하기 전에 대부분 붕괴되어야 한다. 그러나 실제로는 예상보다 훨씬 많은 수의 뮤온이 지표면에서 관측된다. 이는 뮤온이 빛에 가까운 속도로 이동하기 때문에, 지구의 관찰자 기준에서 뮤온의 시간이 느리게 흘러 수명이 연장되는 것처럼 관측되기 때문이다."
    },
    {
      id: "p3",
      text: "일반 상대성 이론에서는 중력 또한 시간의 흐름에 영향을 미친다. 강한 중력장에 가까이 있을수록 시간이 더 느리게 흐르는데, 이를 중력에 의한 시간 지연이라 한다. 이 현상은 아인슈타인이 중력을 시공간의 곡률로 재해석한 결과로부터 도출된 것이다. 질량이 큰 천체 근처에서는 시공간이 더 크게 휘어지며, 이 휘어진 시공간 속에서 시간은 평평한 시공간에서보다 느리게 경과한다. 이러한 중력에 의한 시간 지연은 GPS 위성 시스템에서 실제로 보정이 필요한 요소이다. GPS 위성은 지표면보다 약한 중력 환경에 있으므로 위성의 시계가 지상의 시계보다 하루에 약 45마이크로초씩 빠르게 진행하며, 이를 보정하지 않으면 위치 오차가 하루에 약 10킬로미터씩 누적되게 된다."
    },
    {
      id: "p4",
      text: "시간 지연 효과는 물리학의 근본적 개념에 대한 우리의 직관을 근본적으로 뒤흔들었다. 시간이 절대적이라는 뉴턴적 직관은 일상 경험에서 매우 잘 작동하지만, 극한적 조건에서는 더 이상 유효하지 않다는 것이 밝혀진 것이다. 이러한 발견은 과학적 이론이란 특정 조건에서 유효한 근사적 모형일 뿐이며, 새로운 조건에서는 기존 이론을 수정하거나 대체해야 할 수 있다는 과학 철학적 교훈을 제공한다. 또한 시간 지연은 우주 탐사와 관련하여 실질적 함의를 갖는다. 빛에 가까운 속도로 항성 간 여행을 하는 우주선의 탑승자는 지구에 남은 사람들보다 느리게 나이를 먹게 되어, 이론적으로는 먼 미래의 지구에 도착하는 것이 가능해진다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "특수 상대성 이론에서 시간이 뉴턴 역학과 근본적으로 다르게 취급되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "시간은 모든 관찰자에게 동일하게 흐르는 절대적 양이 아니라 관찰자의 운동 상태에 따라 달라지는 상대적 양이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "뮤온 실험에서 예상보다 많은 뮤온이 지표면에 도달하는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "뮤온이 빛에 가까운 속도로 이동하기 때문에, 지구의 관찰자 기준에서 뮤온의 시간이 느리게 흘러 수명이 연장되는 것처럼 관측되기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "일반 상대성 이론에서 중력이 시간에 영향을 미치는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "질량이 큰 천체 근처에서는 시공간이 더 크게 휘어지며, 이 휘어진 시공간 속에서 시간은 평평한 시공간에서보다 느리게 경과한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "GPS 위성에서 시간 지연 보정이 필요한 구체적 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "이를 보정하지 않으면 위치 오차가 하루에 약 10킬로미터씩 누적되게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "시간 지연 효과가 과학 철학적으로 제공하는 교훈은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "과학적 이론이란 특정 조건에서 유효한 근사적 모형일 뿐이며, 새로운 조건에서는 기존 이론을 수정하거나 대체해야 할 수 있다는 과학 철학적 교훈을 제공한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "시간 지연이 우주 탐사와 관련하여 갖는 실질적 함의는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "빛에 가까운 속도로 항성 간 여행을 하는 우주선의 탑승자는 지구에 남은 사람들보다 느리게 나이를 먹게 되어, 이론적으로는 먼 미래의 지구에 도착하는 것이 가능해진다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(41, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 42: 문학 (LITERATURE) — 박완서의 전쟁 서사 (문학평론) ───
function buildDay42() {
  const paragraphs = [
    {
      id: "p1",
      text: "박완서는 한국 현대 소설에서 한국전쟁의 경험을 가장 지속적이고 깊이 있게 형상화한 작가로 평가된다. 그녀의 전쟁 서사는 전쟁터의 웅장한 전투 장면이나 영웅적 행위가 아니라, 전쟁이 일상의 공간에 침투하여 평범한 가족의 삶을 어떻게 파괴하는지를 세밀하게 추적한다. 대표작 「그 많던 싱아는 누가 다 먹었을까」에서 작가는 전쟁 이전의 풍요로운 자연과 가족 공동체의 기억을 섬세하게 복원하면서, 전쟁이 그 모든 것을 앗아간 상실감을 강렬하게 전달하고 있다. 박완서의 전쟁 서사에서 주된 서사 주체는 여성이다. 이는 기존 전쟁 문학이 남성 전투원의 시각에서 전쟁을 재현해 온 전통에 대한 근본적인 전환을 의미하며, 전쟁의 피해가 전선뿐 아니라 후방의 가정에서도 심대하게 발생한다는 사실을 부각시킨다."
    },
    {
      id: "p2",
      text: "박완서 전쟁 서사의 핵심적 특징은 오빠의 죽음이라는 개인적 외상을 문학적 원천으로 삼고 있다는 점이다. 전쟁 중 오빠를 잃은 경험은 그녀의 소설 세계 전반에 걸쳐 반복적으로 변주되며, 이 반복은 외상적 기억의 문학적 치유 과정으로 해석된다. 박완서는 한 인터뷰에서 글을 쓰는 행위가 오빠의 죽음에 대한 부채 의식에서 비롯되었다고 고백한 바 있는데, 이는 그녀의 문학이 개인적 애도와 사회적 증언이라는 이중적 기능을 수행하고 있음을 보여 준다. 특히 그녀의 소설에서 죽은 오빠에 대한 기억은 단순한 그리움에 머물지 않고, 전쟁이 개인의 정체성과 가족 관계를 어떻게 영구적으로 변형시키는지를 탐구하는 서사적 장치로 기능한다."
    },
    {
      id: "p3",
      text: "박완서의 전쟁 서사는 이념적 대립에 대한 독특한 시각을 제시한다. 그녀의 소설에서 이념은 거시적 담론이 아니라 구체적인 인간관계를 파괴하는 폭력적 힘으로 작용한다. 같은 마을에서 함께 살던 이웃이 이념의 차이로 적이 되고, 가족 내부에서도 사상적 갈등이 발생하여 가정이 해체되는 과정이 세밀하게 묘사된다. 이러한 서사는 전쟁을 선과 악의 이분법으로 단순화하는 것을 거부하며, 전쟁의 비극이 어느 한쪽의 책임이 아니라 이념이라는 추상적 관념이 인간의 구체적 삶을 압도할 때 발생하는 것임을 보여 준다. 박완서는 이를 통해 냉전적 이분법을 넘어서는 전쟁 인식의 가능성을 문학적으로 모색하였다."
    },
    {
      id: "p4",
      text: "박완서의 전쟁 서사가 한국 문학사에서 갖는 의의는 전쟁 문학의 외연과 깊이를 동시에 확장하였다는 데 있다. 전쟁 체험 세대의 직접적 증언이라는 점에서 역사적 기록으로서의 가치를 지니는 동시에, 외상 기억의 서사화라는 방법론을 통해 전쟁 문학의 미학적 수준을 끌어올렸다. 또한 여성의 시각에서 전쟁을 재현함으로써 기존 전쟁 문학이 포착하지 못했던 전쟁의 다른 측면을 드러내었다. 그녀의 문학은 전쟁이 끝난 후에도 전쟁의 기억이 생존자의 내면에서 어떻게 지속되는지를 보여 줌으로써, 전쟁 문학의 시간적 범위를 전투 기간 너머로 확장하였다. 이러한 성취는 이후 한국 전쟁 문학에서 여성 서사와 일상성의 문학이라는 새로운 흐름을 형성하는 데 중요한 토대가 되었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "박완서의 전쟁 서사에서 서사 주체가 여성인 것이 갖는 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "기존 전쟁 문학이 남성 전투원의 시각에서 전쟁을 재현해 온 전통에 대한 근본적인 전환을 의미하며, 전쟁의 피해가 전선뿐 아니라 후방의 가정에서도 심대하게 발생한다는 사실을 부각시킨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "오빠의 죽음이 박완서 소설에서 반복적으로 변주되는 것은 어떻게 해석되는가?",
      answerRanges: [findRange(paragraphs, "p2", "외상적 기억의 문학적 치유 과정으로 해석된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "박완서의 문학이 수행하는 이중적 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "개인적 애도와 사회적 증언이라는 이중적 기능을 수행하고 있음을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "박완서 소설에서 전쟁의 비극이 발생하는 근본 원인으로 제시되는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "이념이라는 추상적 관념이 인간의 구체적 삶을 압도할 때 발생하는 것임을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "박완서가 전쟁 문학의 시간적 범위를 확장한 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "전쟁이 끝난 후에도 전쟁의 기억이 생존자의 내면에서 어떻게 지속되는지를 보여 줌으로써, 전쟁 문학의 시간적 범위를 전투 기간 너머로 확장하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "박완서의 전쟁 서사가 이후 한국 문학에 형성한 새로운 흐름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "여성 서사와 일상성의 문학이라는 새로운 흐름을 형성하는 데 중요한 토대가 되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(42, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 43: 비문학 (NONFICTION) — 시장 실패와 정부 개입의 논리 (경제학) ───
function buildDay43() {
  const paragraphs = [
    {
      id: "p1",
      text: "시장 경제에서 자원 배분의 효율성은 수요와 공급의 자유로운 상호 작용을 통해 달성된다고 설명된다. 그러나 현실의 시장은 항상 효율적인 결과를 가져오지 못하는 경우가 있으며, 이를 시장 실패라 한다. 시장 실패란 시장의 가격 기구가 자원을 사회적으로 바람직한 수준으로 배분하지 못하는 상황을 지칭하는 개념이다. 시장 실패가 발생하는 주요 원인으로는 공공재의 존재, 외부 효과, 정보의 비대칭성, 그리고 독점 등이 있다. 이러한 시장 실패 상황에서는 시장에만 자원 배분을 맡겨 둘 경우 사회 전체의 후생이 감소할 수 있으므로, 정부 개입의 필요성이 제기된다."
    },
    {
      id: "p2",
      text: "시장 실패의 대표적 사례인 외부 효과는 경제 주체의 행위가 시장 거래를 거치지 않고 다른 경제 주체에게 의도하지 않은 이익이나 손해를 끼치는 현상을 말한다. 공장의 오염 물질 배출은 부정적 외부 효과의 전형적 사례로, 공장은 생산 비용만을 고려하여 생산량을 결정하지만 오염으로 인한 사회적 비용은 반영하지 않는다. 그 결과 사회적으로 바람직한 수준보다 과다한 생산이 이루어지게 된다. 이에 대해 정부는 오염 배출에 대한 과세, 배출권 거래제 도입, 환경 규제 등의 방식으로 개입하여 사적 비용과 사회적 비용의 괴리를 줄이고자 한다. 반대로 긍정적 외부 효과가 존재하는 교육이나 연구 개발의 경우에는 사회적으로 바람직한 수준보다 과소 공급되므로, 정부가 보조금을 지급하여 공급을 촉진하는 정책이 정당화된다."
    },
    {
      id: "p3",
      text: "공공재는 비배제성과 비경합성이라는 두 가지 특성을 지닌 재화로, 시장에서 적절히 공급되기 어렵다. 비배제성이란 대가를 지불하지 않는 사람도 그 재화의 소비에서 배제할 수 없다는 것이고, 비경합성이란 한 사람의 소비가 다른 사람의 소비를 감소시키지 않는다는 것이다. 국방이나 가로등이 대표적인 공공재에 해당한다. 이러한 특성으로 인해 사람들은 대가를 지불하지 않고도 혜택을 누릴 수 있으므로, 무임승차 문제가 발생한다. 무임승차 문제란 개인이 비용을 부담하지 않으면서 공공재의 혜택만 누리려는 유인이 존재하는 상황을 의미한다. 이로 인해 민간 시장에서는 공공재가 사회적으로 필요한 양만큼 생산되지 않으며, 정부가 조세를 통해 재원을 마련하여 직접 공급하는 것이 일반적이다."
    },
    {
      id: "p4",
      text: "시장 실패에 대한 정부 개입의 필요성이 인정되더라도, 정부 개입 자체가 항상 바람직한 결과를 가져오는 것은 아니다. 정부 역시 불완전한 정보를 가지고 있으며, 정책 결정 과정에서 특정 이익 집단의 영향을 받을 수 있기 때문이다. 이처럼 정부 개입이 오히려 자원 배분의 효율성을 악화시키는 현상을 정부 실패라 한다. 정부 실패의 사례로는 과도한 규제로 인한 기업 활동의 위축, 보조금의 비효율적 배분, 관료 조직의 비대화 등이 있다. 따라서 시장 실패를 교정하기 위한 정부 정책은 개입의 비용과 편익을 면밀히 비교하여 설계되어야 하며, 시장의 자율적 조정 기능을 최대한 활용하면서 그 한계를 보완하는 방향으로 이루어져야 한다는 것이 경제학의 일반적 견해이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "시장 실패가 발생하는 주요 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "공공재의 존재, 외부 효과, 정보의 비대칭성, 그리고 독점 등이 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "부정적 외부 효과에서 과다 생산이 발생하는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "공장은 생산 비용만을 고려하여 생산량을 결정하지만 오염으로 인한 사회적 비용은 반영하지 않는다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "공공재에서 무임승차 문제가 발생하는 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "개인이 비용을 부담하지 않으면서 공공재의 혜택만 누리려는 유인이 존재하는 상황을 의미한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "공공재가 민간 시장에서 적절히 공급되지 못하는 근본적인 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "대가를 지불하지 않는 사람도 그 재화의 소비에서 배제할 수 없다는 것이고, 비경합성이란 한 사람의 소비가 다른 사람의 소비를 감소시키지 않는다는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "정부 실패가 발생하는 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "정부 역시 불완전한 정보를 가지고 있으며, 정책 결정 과정에서 특정 이익 집단의 영향을 받을 수 있기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "시장 실패를 교정하기 위한 정부 정책의 바람직한 방향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "시장의 자율적 조정 기능을 최대한 활용하면서 그 한계를 보완하는 방향으로 이루어져야 한다는 것이 경제학의 일반적 견해이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(43, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 44: 문학 (LITERATURE) — 채만식의 「레디메이드 인생」에 나타난 풍자 (문학평론) ───
function buildDay44() {
  const paragraphs = [
    {
      id: "p1",
      text: "채만식의 단편소설 「레디메이드 인생」은 1934년에 발표된 작품으로, 일제 강점기 한국 사회의 구조적 모순을 풍자적 기법을 통해 날카롭게 비판한 작품이다. 작품의 제목인 레디메이드, 즉 기성품이라는 표현은 주인공 P가 대학까지 나왔지만 어디에서도 쓸모를 찾지 못하는 지식인의 처지를 비유한 것이다. 식민지 사회에서 고등 교육을 받은 지식인이 오히려 취직에 실패하고 사회의 잉여 존재로 전락하는 역설적 상황을 레디메이드라는 외래어에 담아냄으로써, 채만식은 식민지 교육 제도의 허위성을 통렬하게 드러내었다. 이 작품은 당대의 사회 현실을 사실적으로 재현하면서도, 풍자라는 문학적 장치를 통해 비판의 칼날을 더욱 날카롭게 벼린 점에서 한국 근대 소설사의 중요한 성취로 평가된다."
    },
    {
      id: "p2",
      text: "「레디메이드 인생」에서 풍자가 작동하는 핵심 기제는 주인공 P의 자기 인식과 현실 사이의 괴리이다. P는 대학 교육을 받은 지식인으로서의 자존심을 유지하려 하지만, 현실에서 그의 학력은 아무런 경제적 가치를 갖지 못한다. 직업 소개소를 전전하며 일자리를 구하지만 번번이 실패하고, 급기야 아이들을 돌봐 달라는 부탁에조차 자존심이 상하여 갈등하는 모습이 그려진다. 채만식은 이 과정에서 P의 내면 독백을 통해 지식인의 허위적 자존심을 희화화하면서, 동시에 그러한 자존심마저 유지할 수 없게 만드는 사회 구조의 폭력성을 드러낸다. 풍자의 칼날은 P 개인뿐 아니라 그를 그러한 처지에 몰아넣은 식민지 사회 전체를 향하고 있는 것이다."
    },
    {
      id: "p3",
      text: "채만식 풍자의 독특한 점은 작가가 비판 대상에 대해 일정한 연민을 동시에 보여 준다는 데 있다. P는 조롱의 대상이면서도 공감의 대상이기도 하다. 그의 어리석음은 개인적 결함에서 비롯된 것이 아니라 식민지라는 구조적 조건이 만들어 낸 결과이기 때문이다. 채만식은 P를 단순한 희극적 인물로 전락시키지 않고, 그의 고통과 좌절에 대한 인간적 이해를 바탕에 깔아 둠으로써 풍자의 깊이를 확보하였다. 이러한 방식은 단순히 웃기기 위한 해학과 구별되는 것으로, 웃음의 이면에 사회적 비극에 대한 인식이 자리 잡고 있다는 점에서 비판적 리얼리즘의 한 형태로 이해될 수 있다."
    },
    {
      id: "p4",
      text: "「레디메이드 인생」의 풍자는 한국 근대 문학에서 풍자 소설이라는 장르의 가능성을 본격적으로 열어 놓았다는 점에서 문학사적 의의를 갖는다. 채만식은 이후 「태평천하」, 「치숙」 등의 작품에서도 풍자적 기법을 더욱 정교하게 발전시켜, 식민지 사회의 다양한 계층과 문제를 비판적으로 조명하였다. 특히 그의 풍자는 지식인 계층에 대한 자기반성적 성찰을 포함하고 있다는 점에서 단순한 외부 비판과 차별화된다. 채만식 자신이 지식인으로서 겪은 좌절의 경험이 P라는 인물에 투영되어 있으며, 이는 풍자가 타자에 대한 공격이 아니라 자기 자신을 포함한 사회 전체에 대한 비판적 성찰의 도구로 기능하고 있음을 보여 준다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "「레디메이드 인생」이라는 제목이 비유하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "주인공 P가 대학까지 나왔지만 어디에서도 쓸모를 찾지 못하는 지식인의 처지를 비유한 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "풍자가 작동하는 핵심 기제인 괴리란 구체적으로 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "P는 대학 교육을 받은 지식인으로서의 자존심을 유지하려 하지만, 현실에서 그의 학력은 아무런 경제적 가치를 갖지 못한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "채만식의 풍자가 P 개인을 넘어 향하는 궁극적 대상은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "풍자의 칼날은 P 개인뿐 아니라 그를 그러한 처지에 몰아넣은 식민지 사회 전체를 향하고 있는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "채만식 풍자가 단순한 해학과 구별되는 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "웃음의 이면에 사회적 비극에 대한 인식이 자리 잡고 있다는 점에서 비판적 리얼리즘의 한 형태로 이해될 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "채만식의 풍자가 단순한 외부 비판과 차별화되는 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "지식인 계층에 대한 자기반성적 성찰을 포함하고 있다는 점에서 단순한 외부 비판과 차별화된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "채만식의 풍자가 궁극적으로 기능하는 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "자기 자신을 포함한 사회 전체에 대한 비판적 성찰의 도구로 기능하고 있음을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(44, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 45: 비문학 (NONFICTION) — 인지 부조화 이론과 자기 합리화 (심리학) ───
function buildDay45() {
  const paragraphs = [
    {
      id: "p1",
      text: "인지 부조화 이론은 1957년 레온 페스팅거가 제안한 사회심리학 이론으로, 개인이 서로 모순되는 두 가지 이상의 인지 요소를 동시에 가지고 있을 때 경험하는 심리적 불편감과 그 해소 과정을 설명한다. 인지 요소란 자신의 행동, 태도, 신념, 가치관 등에 대한 인식을 의미하며, 이들 사이에 일관성이 결여될 때 인지 부조화가 발생한다. 예컨대 건강에 해롭다는 것을 알면서도 흡연을 지속하는 사람은 흡연은 해롭다는 인지와 나는 흡연을 한다는 인지 사이에서 부조화를 경험하게 된다. 페스팅거에 따르면 이 부조화 상태는 심리적으로 불안정하기 때문에, 개인은 부조화를 감소시키기 위한 다양한 전략을 자발적으로 동원하게 된다."
    },
    {
      id: "p2",
      text: "인지 부조화를 감소시키기 위한 전략은 크게 세 가지로 구분된다. 첫째, 부조화를 일으키는 행동을 변경하는 것이다. 흡연자가 담배를 끊는 것이 이에 해당한다. 둘째, 부조화를 일으키는 인지 요소를 변경하는 것이다. 흡연의 위험성에 대한 과학적 근거가 과장되었다고 스스로 믿는 것이 이 전략에 해당한다. 셋째, 새로운 인지 요소를 추가하여 부조화를 정당화하는 것이다. 흡연이 스트레스 해소에 도움이 되며, 스트레스가 더 해로울 수 있다는 인지를 추가하는 것이 그 예이다. 페스팅거의 연구에 따르면, 행동을 변경하는 것이 가장 직접적인 해결 방법이지만, 실제로 사람들은 행동보다는 인지를 변경하거나 새로운 인지를 추가하는 방식을 더 자주 선택하는 경향이 있다."
    },
    {
      id: "p3",
      text: "인지 부조화 이론의 중요한 실험적 근거 중 하나는 페스팅거와 칼스미스의 1959년 실험이다. 이 실험에서 참가자들은 매우 지루한 과제를 수행한 후, 다음 참가자에게 과제가 재미있었다고 거짓말을 해 달라는 요청을 받았다. 한 집단에는 이 거짓말의 대가로 1달러를, 다른 집단에는 20달러를 지급하였다. 실험 결과 1달러를 받은 집단이 20달러를 받은 집단보다 과제가 실제로 재미있었다고 보고하는 경향이 강하게 나타났다. 이는 20달러를 받은 집단은 충분한 외적 보상이 거짓말에 대한 정당화를 제공하여 부조화가 적었지만, 1달러를 받은 집단은 보상이 불충분하여 자신의 거짓말을 내적으로 정당화해야 하는 더 큰 부조화를 경험하였기 때문으로 해석된다."
    },
    {
      id: "p4",
      text: "인지 부조화 이론은 일상생활에서 관찰되는 자기 합리화 현상을 체계적으로 설명하는 틀을 제공한다. 사람들이 잘못된 결정을 내린 후에도 그 결정을 옹호하거나, 이미 많은 비용을 투입한 사업에서 손실이 분명해졌음에도 추가 투자를 지속하는 매몰 비용의 오류 역시 인지 부조화의 관점에서 이해될 수 있다. 그러나 이 이론에 대한 비판도 존재한다. 자기 지각 이론을 제안한 대릴 벰은 사람들이 부조화라는 불쾌한 감정을 경험하는 것이 아니라, 단순히 자신의 행동을 관찰하여 태도를 추론하는 것일 뿐이라고 주장하였다. 이러한 대안적 설명에도 불구하고 인지 부조화 이론은 설득, 의사 결정, 태도 변화 등 다양한 사회심리학 영역에서 여전히 핵심적인 이론적 틀로 활용되고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "인지 부조화가 발생하는 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "개인이 서로 모순되는 두 가지 이상의 인지 요소를 동시에 가지고 있을 때 경험하는 심리적 불편감")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "인지 부조화 감소 전략 중 사람들이 가장 자주 선택하는 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "행동보다는 인지를 변경하거나 새로운 인지를 추가하는 방식을 더 자주 선택하는 경향이 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "페스팅거-칼스미스 실험에서 1달러 집단이 과제를 더 재미있다고 보고한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "1달러를 받은 집단은 보상이 불충분하여 자신의 거짓말을 내적으로 정당화해야 하는 더 큰 부조화를 경험하였기 때문으로 해석된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "매몰 비용의 오류를 인지 부조화의 관점에서 설명할 수 있는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "이미 많은 비용을 투입한 사업에서 손실이 분명해졌음에도 추가 투자를 지속하는 매몰 비용의 오류 역시 인지 부조화의 관점에서 이해될 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "대릴 벰의 자기 지각 이론이 인지 부조화 이론에 제기하는 대안적 설명은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "사람들이 부조화라는 불쾌한 감정을 경험하는 것이 아니라, 단순히 자신의 행동을 관찰하여 태도를 추론하는 것일 뿐이라고 주장하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "인지 부조화 이론이 현재 활용되고 있는 영역은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "설득, 의사 결정, 태도 변화 등 다양한 사회심리학 영역에서 여전히 핵심적인 이론적 틀로 활용되고 있다")],
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
  const contentId = `dr-w1-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(비트겐슈타인 1) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "WITTGENSTEIN_1",
    schoolGradeRange: { min: 9, max: 10 },
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
    level_id: "WITTGENSTEIN_1",
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
  console.log("=== 비트겐슈타인1 Day 41~45 빌드 시작 ===\n");

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
    if (len < 1350 || len > 1450) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1350~1450)`);
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

  // 배치 파일 갱신 (items[40]~items[44])
  console.log("\n배치 파일 갱신 중...");
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`현재 배치 items 수: ${batchData.items.length}`);

  const dayIndices = [41, 42, 43, 44, 45];
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
