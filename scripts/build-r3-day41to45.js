#!/usr/bin/env node
// 러셀3 Day 41~45 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION (비문학), 짝수 Day = LITERATURE (문학)
// 목표 글자수: 1300자 ±50 (1250~1350)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-russell3.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/russell3');

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

// ─── Day 41: 비문학 (NONFICTION) — 게임 이론과 내시 균형 ───
function buildDay41() {
  const paragraphs = [
    {
      id: "p1",
      text: "게임 이론은 둘 이상의 의사 결정 주체가 서로의 행동을 고려하면서 최선의 전략을 선택하는 상황을 수학적으로 분석하는 학문이다. 여기서 '게임'이란 오락이 아니라, 각 참여자의 선택이 상대방의 결과에 영향을 미치는 전략적 상호작용을 가리킨다. 게임 이론의 기초를 놓은 존 폰 노이만은 1944년 경제학자 오스카 모르겐슈테른과 함께 발표한 저서에서 제로섬 게임의 수학적 해법을 제시하였으며, 이를 통해 경쟁적 상황에서의 최적 전략을 분석하는 틀을 마련하였다. 제로섬 게임이란 한 참여자의 이익이 곧 다른 참여자의 손실이 되는 상황을 말한다. 이후 존 내시는 비협력 게임에서 어떤 참여자도 자신의 전략을 일방적으로 바꿀 유인이 없는 상태를 수학적으로 정의하였다. 이 상태를 내시 균형이라 하며, 모든 참여자가 상대방의 전략을 주어진 것으로 받아들일 때 자신의 전략이 최선인 상황을 뜻한다."
    },
    {
      id: "p2",
      text: "내시 균형의 대표적 사례로 '죄수의 딜레마'가 자주 인용된다. 두 용의자가 각각 자백과 묵비 중 하나를 선택해야 하는데, 둘 다 묵비하면 가벼운 형을 받지만 한쪽만 자백하면 자백한 쪽은 석방되고 묵비한 쪽은 중형을 받는다. 둘 다 자백하면 양쪽 모두 중간 정도의 형을 받게 된다. 이 상황에서 각 용의자는 상대가 어떤 선택을 하든 자백이 자신에게 유리하므로 둘 다 자백을 선택하게 되며, 이것이 내시 균형이다. 그런데 이 균형은 둘 다 묵비하는 결과보다 양쪽 모두에게 불리한 결과를 낳는다. 이처럼 개인의 합리적 선택이 집단 전체에는 비효율적인 결과를 가져올 수 있다는 점이 죄수의 딜레마가 보여 주는 핵심적 통찰이다. 이 문제는 환경 오염, 군비 경쟁, 공유 자원의 남용 등 현실의 다양한 사회적 딜레마 상황에서 반복적으로 나타나고 있다."
    },
    {
      id: "p3",
      text: "내시 균형 개념은 경제학을 넘어 국제 관계, 생물학, 사회 정책 등 다양한 영역에 적용된다. 국제 관계에서 핵 억지력은 상대국이 핵무기를 보유하고 있는 한 선제 공격이 자멸적 결과를 초래하므로, 양측 모두 공격하지 않는 것이 내시 균형이 되는 구조이다. 생물학에서는 진화적으로 안정한 전략이라는 개념이 내시 균형의 생물학적 변형으로 제시되었는데, 개체군 내에서 어떤 전략을 채택한 개체가 다른 전략으로 전환해도 적합도가 높아지지 않는 상태를 가리킨다. 사회 정책에서는 교통 혼잡, 공공재 공급, 경매 설계 등의 문제에 내시 균형 분석이 적용되어 제도적 개선 방안을 모색하는 데 기여하고 있다. 이처럼 내시 균형은 경쟁적 상호작용이 존재하는 모든 상황에서 안정적 결과를 예측하는 보편적 분석 도구로 활용되고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "게임 이론에서 '게임'이 의미하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "각 참여자의 선택이 상대방의 결과에 영향을 미치는 전략적 상호작용을 가리킨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "내시 균형이란 어떤 상태를 뜻하는가?",
      answerRanges: [findRange(paragraphs, "p1", "모든 참여자가 상대방의 전략을 주어진 것으로 받아들일 때 자신의 전략이 최선인 상황을 뜻한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "죄수의 딜레마에서 내시 균형이 되는 결과는 무엇이며, 왜 문제가 되는가?",
      answerRanges: [findRange(paragraphs, "p2", "개인의 합리적 선택이 집단 전체에는 비효율적인 결과를 가져올 수 있다는 점이 죄수의 딜레마가 보여 주는 핵심적 통찰이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "국제 관계에서 핵 억지력이 내시 균형이 되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "상대국이 핵무기를 보유하고 있는 한 선제 공격이 자멸적 결과를 초래하므로, 양측 모두 공격하지 않는 것이 내시 균형이 되는 구조이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "진화적으로 안정한 전략이 내시 균형과 관련되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "개체군 내에서 어떤 전략을 채택한 개체가 다른 전략으로 전환해도 적합도가 높아지지 않는 상태를 가리킨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "내시 균형이 보편적 분석 도구로 활용되는 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "경쟁적 상호작용이 존재하는 모든 상황에서 안정적 결과를 예측하는 보편적 분석 도구로 활용되고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(41, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 42: 문학 (LITERATURE) — 백석의 토속적 서정 ───
function buildDay42() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대시에서 백석은 토속적 언어와 풍속을 시의 핵심 자원으로 삼아 독자적인 서정 세계를 구축한 시인이다. 그는 1930년대 모더니즘이 주류를 이루던 시단에서, 서구적 감수성이 아닌 한국적 삶의 원형에서 시적 언어를 길어 올렸다. 백석 시의 가장 두드러진 특징은 평안도 방언과 토속어의 적극적 활용에 있다. '가재미', '산꿩', '콩나물시루' 같은 일상적 사물의 이름과 '안즈막하니', '닙새' 같은 방언은 시적 언어의 범위를 확장하면서 특정 지역 공동체의 삶과 정서를 생생하게 전달한다. 이러한 토속어는 표준어로 대체할 경우 원래의 감각적 질감과 정서적 뉘앙스가 상실되기에, 백석은 의도적으로 표준어 번역을 거부하였다. 이러한 토속어의 사용은 단순한 향토색의 재현이 아니라, 근대화 과정에서 소멸해 가는 공동체적 삶의 기억을 언어를 통해 보존하려는 시적 전략이었다."
    },
    {
      id: "p2",
      text: "백석의 시에서 음식은 단순한 소재가 아니라 공동체적 유대와 기억을 환기하는 핵심 매개물이다. 「여우난곬족」에서 나열되는 떡, 두부, 콩나물 같은 음식은 명절이라는 시간 속에서 가족과 이웃이 함께 나누는 행위를 통해 의미를 획득한다. 백석은 음식의 이름을 하나하나 열거하는 나열 기법을 통해, 명절 풍경의 풍성함과 따뜻함을 감각적으로 재현한다. 이때 음식은 미각의 대상에 머물지 않고 공동체의 정서적 유대를 상징하는 기호로 전환되며, 독자는 음식의 이름만으로도 특정 계절과 장소, 그리고 그곳에서의 인간관계를 떠올리게 된다. 이러한 시적 방법은 개인의 내면을 직접 서술하지 않으면서도, 사물과 풍속의 묘사를 통해 깊은 서정성을 환기하는 객관적 서정의 한 방식이다. 백석은 이를 통해 서정시가 반드시 감정의 직접적 토로에 의존하지 않아도 된다는 가능성을 보여 주었다."
    },
    {
      id: "p3",
      text: "백석 시의 또 다른 중요한 축은 유년 시절의 기억과 상실감의 형상화이다. 「나와 나타샤와 흰 당나귀」에서 드러나듯, 백석의 시적 화자는 현재의 고독 속에서 과거의 따뜻한 기억을 소환한다. 고향의 풍경, 어린 시절 함께했던 사람들, 계절마다 반복되던 일상의 의례는 시 속에서 이상화된 세계로 재구성된다. 그러나 이러한 회상은 단순한 과거 회귀가 아니라, 현재의 결핍을 통해 과거의 가치를 재발견하는 이중적 시선을 내포하고 있다. 백석은 분단과 월남으로 인해 다시는 돌아갈 수 없는 고향을 시 속에 언어적으로 재건함으로써, 상실된 세계에 대한 애도와 그리움을 보편적 서정으로 승화시켰다. 이러한 점에서 백석의 시는 개인사를 넘어 근대 한국인이 경험한 공동체의 해체와 디아스포라의 정서를 담아내는 문학적 기록이기도 하다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "백석 시에서 토속어 사용이 지닌 시적 전략은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "근대화 과정에서 소멸해 가는 공동체적 삶의 기억을 언어를 통해 보존하려는 시적 전략이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "백석의 시에서 음식이 단순한 소재를 넘어 수행하는 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "공동체적 유대와 기억을 환기하는 핵심 매개물이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "백석이 음식을 통해 구현하는 시적 방법은 무엇이라 할 수 있는가?",
      answerRanges: [findRange(paragraphs, "p2", "사물과 풍속의 묘사를 통해 깊은 서정성을 환기하는 객관적 서정의 한 방식이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "백석 시에서 유년 시절의 회상이 단순한 과거 회귀가 아닌 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "현재의 결핍을 통해 과거의 가치를 재발견하는 이중적 시선을 내포하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "백석이 고향을 시 속에서 언어적으로 재건한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "상실된 세계에 대한 애도와 그리움을 보편적 서정으로 승화시켰다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "백석의 시가 개인사를 넘어 담아내는 보편적 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "근대 한국인이 경험한 공동체의 해체와 디아스포라의 정서를 담아내는 문학적 기록이기도 하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(42, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 43: 비문학 (NONFICTION) — 반도체의 작동 원리 ───
function buildDay43() {
  const paragraphs = [
    {
      id: "p1",
      text: "반도체는 도체와 부도체의 중간적 성질을 가진 물질로, 특정 조건에서 전기 전도성을 조절할 수 있다는 점에서 현대 전자 기기의 핵심 소재이다. 순수한 반도체인 실리콘은 주기율표 14족에 속하는 원소로, 결정 구조 내에서 각 원자가 네 개의 공유 결합을 형성하여 자유 전자가 거의 없으므로 전류가 잘 흐르지 않는다. 그러나 외부에서 열이나 빛의 형태로 에너지를 가하면 일부 전자가 공유 결합에서 벗어나 자유 전자가 되며, 전자가 빠져나간 자리에는 양전하처럼 행동하는 '정공'이 생긴다. 이처럼 자유 전자와 정공의 쌍이 만들어지는 현상을 통해 순수 반도체에서도 미약하나마 전류가 흐를 수 있게 된다. 온도가 높아질수록 자유 전자와 정공의 수가 증가하므로, 반도체의 전기 전도성은 온도에 비례하여 높아지는 특성을 보인다. 이러한 성질을 의도적으로 제어하기 위해 반도체에 불순물을 첨가하는 공정을 도핑이라 한다."
    },
    {
      id: "p2",
      text: "도핑에는 두 가지 유형이 있다. 실리콘에 인이나 비소처럼 전자가 다섯 개인 원소를 첨가하면 여분의 전자가 하나 생겨 자유 전자의 수가 증가하며, 이를 n형 반도체라 한다. 반대로 붕소나 갈륨처럼 전자가 세 개인 원소를 첨가하면 전자가 하나 부족하여 정공이 증가하게 되며, 이를 p형 반도체라 한다. n형과 p형 반도체를 접합하면 p-n 접합이 형성되는데, 이 접합 부위에서는 자유 전자와 정공이 만나 결합하면서 전하 운반체가 사라진 공핍층이 생긴다. 공핍층은 전류의 흐름을 차단하는 장벽 역할을 하지만, 외부에서 적절한 방향으로 전압을 가하면 공핍층이 줄어들어 전류가 흐르게 된다. 이 원리가 다이오드의 정류 작용, 즉 한쪽 방향으로만 전류를 통과시키는 기능의 기초이다."
    },
    {
      id: "p3",
      text: "트랜지스터는 p-n 접합을 두 개 결합하여 만든 소자로, 현대 반도체 기술의 핵심 구성 요소이다. 1947년 벨 연구소에서 최초로 발명된 트랜지스터는 기존의 진공관을 대체하면서 전자 기기의 소형화와 저전력화를 가능하게 하였다. 트랜지스터는 작은 전기 신호로 큰 전류를 제어할 수 있어 증폭기와 스위치의 역할을 동시에 수행한다. 컴퓨터의 논리 회로에서 트랜지스터는 전류가 흐르는 상태를 '1', 흐르지 않는 상태를 '0'으로 나타내어 디지털 정보를 처리한다. 반도체 집적 회로는 하나의 실리콘 칩 위에 수십억 개의 트랜지스터를 배치한 것으로, 칩의 면적은 줄이면서 트랜지스터 수를 늘리는 미세 공정 기술의 발전이 컴퓨터 성능 향상의 원동력이 되어 왔다. 오늘날 반도체 기술은 인공지능, 자율 주행, 사물 인터넷 등 첨단 산업의 기반이 되고 있으며, 반도체의 성능과 효율을 높이기 위한 소재 및 설계 혁신이 지속적으로 이루어지고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "순수 반도체에서 전류가 흐를 수 있게 되는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "자유 전자와 정공의 쌍이 만들어지는 현상을 통해 순수 반도체에서도 미약하나마 전류가 흐를 수 있게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "도핑이란 무엇이며 그 목적은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "반도체에 불순물을 첨가하는 공정을 도핑이라 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "p-n 접합에서 공핍층이 형성되는 과정은 어떠한가?",
      answerRanges: [findRange(paragraphs, "p2", "자유 전자와 정공이 만나 결합하면서 전하 운반체가 사라진 공핍층이 생긴다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "다이오드의 정류 작용이란 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "한쪽 방향으로만 전류를 통과시키는 기능의 기초이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "트랜지스터가 컴퓨터 논리 회로에서 디지털 정보를 처리하는 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "전류가 흐르는 상태를 '1', 흐르지 않는 상태를 '0'으로 나타내어 디지털 정보를 처리한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "컴퓨터 성능 향상의 원동력이 된 반도체 기술 발전은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "칩의 면적은 줄이면서 트랜지스터 수를 늘리는 미세 공정 기술의 발전이 컴퓨터 성능 향상의 원동력이 되어 왔다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(43, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 44: 문학 (LITERATURE) — 이청준 「병신과 머저리」의 언어 문제 ───
function buildDay44() {
  const paragraphs = [
    {
      id: "p1",
      text: "이청준의 「병신과 머저리」는 언어와 현실의 관계를 근본적으로 탐구한 작품으로, 한국 현대 소설에서 언어에 대한 자의식이 가장 첨예하게 드러난 소설 중 하나이다. 1966년에 발표된 이 작품에서 형은 한국전쟁에서 한쪽 팔을 잃은 상이군인으로, 그림을 통해 자신의 고통을 표현하려 한다. 동생은 소설가로서 형의 삶을 소설로 쓰려 하지만, 글이라는 매체가 형의 고통을 온전히 담아낼 수 있는지에 대해 끊임없이 회의한다. 형의 그림과 동생의 글은 모두 현실의 고통을 재현하려는 시도이지만, 예술적 재현이 원래의 경험에 결코 도달할 수 없다는 인식이 작품 전체를 관통하고 있다. 형이 그리는 그림은 점점 추상적이고 격렬해지면서 언어적 해석을 거부하는 방향으로 나아가며, 이는 고통의 본질이 기존의 표현 체계를 초과하는 것임을 암시한다. 이청준은 이러한 재현 불가능성의 문제를 통해, 언어가 현실을 투명하게 반영한다는 소박한 믿음에 균열을 가한다."
    },
    {
      id: "p2",
      text: "이 작품에서 형과 동생의 갈등은 단순한 형제 간의 불화가 아니라, 서로 다른 표현 매체 사이의 존재론적 긴장을 상징한다. 형은 그림이라는 시각적 매체를 통해 전쟁의 참상을 직접적으로 드러내고자 하며, 언어로 포착할 수 없는 고통의 즉물적 차원에 접근하려 한다. 반면 동생은 언어를 통해 형의 경험을 서사적으로 재구성하려 하지만, 언어는 필연적으로 경험을 추상화하고 범주화하는 매체이므로 고통의 생생한 질감을 상실하게 된다. 동생은 형의 고통을 글로 옮기는 행위가 타인의 아픔을 자신의 문학적 자산으로 전유하는 것은 아닌지 스스로 되묻게 된다. 이러한 매체 간의 근본적 차이에 대한 인식은 동생으로 하여금 자신의 글쓰기에 대한 깊은 자기 회의에 빠지게 만든다. 이청준은 이 갈등 구조를 통해 문학이 현실의 고통 앞에서 겪는 윤리적 딜레마를 정교하게 형상화하고 있다."
    },
    {
      id: "p3",
      text: "「병신과 머저리」의 제목 자체가 이 작품의 핵심 주제를 압축적으로 담고 있다. '병신'은 전쟁으로 육체가 훼손된 형을, '머저리'는 타인의 고통을 글로 옮기면서도 그 행위의 정당성을 확신하지 못하는 동생을 가리킨다. 두 인물 모두 불완전한 존재이며, 이러한 불완전성은 예술 행위 자체의 본질적 한계를 은유한다. 작품의 결말에서 형과 동생은 서로를 '병신'과 '머저리'로 부르며 화해하는데, 이는 표현의 한계를 인정한 위에서 그럼에도 불구하고 표현을 지속하겠다는 의지의 표명으로 읽힌다. 이청준의 이러한 언어에 대한 성찰은 이후 그의 작품 세계를 관통하는 핵심 주제가 되었으며, 「소문의 벽」, 「당신들의 천국」 등에서 언어와 권력, 언어와 진실의 관계에 대한 탐구로 심화되었다. 이는 한국 소설이 현실의 단순한 반영에서 벗어나, 문학 자체의 존재 조건을 반성적으로 사유하는 메타적 차원으로 나아가는 계기가 되었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "이 작품에서 동생이 글쓰기에 대해 회의하는 근본적 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "예술적 재현이 원래의 경험에 결코 도달할 수 없다는 인식이 작품 전체를 관통하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "이청준이 재현 불가능성의 문제를 통해 비판하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "언어가 현실을 투명하게 반영한다는 소박한 믿음에 균열을 가한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "언어가 고통의 생생한 질감을 상실하게 되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "언어는 필연적으로 경험을 추상화하고 범주화하는 매체이므로 고통의 생생한 질감을 상실하게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "형과 동생의 갈등이 상징하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "서로 다른 표현 매체 사이의 존재론적 긴장을 상징한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "제목의 '병신'과 '머저리'가 은유하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "불완전성은 예술 행위 자체의 본질적 한계를 은유한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이청준의 언어 성찰이 한국 소설사에 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "한국 소설이 현실의 단순한 반영에서 벗어나, 문학 자체의 존재 조건을 반성적으로 사유하는 메타적 차원으로 나아가는 계기가 되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(44, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 45: 비문학 (NONFICTION) — 진화론적 이타주의와 호혜성 ───
function buildDay45() {
  const paragraphs = [
    {
      id: "p1",
      text: "진화론에서 이타적 행동은 오랫동안 설명하기 어려운 현상이었다. 다윈 이래 자연 선택은 자신의 생존과 번식에 유리한 형질을 가진 개체를 선호하는 과정으로 이해되어 왔는데, 자기 자신에게 불리하면서 타인에게 이로운 행동이 어떻게 진화할 수 있는지가 문제였기 때문이다. 이에 대해 1964년 윌리엄 해밀턴은 혈연 선택 이론을 제시하였다. 이 이론에 따르면 개체는 자신과 유전자를 공유하는 혈연에게 이타적으로 행동함으로써 자신의 유전자를 간접적으로 전파할 수 있다. 해밀턴의 법칙은 이타적 행동의 비용이 혈연도와 수혜자의 이익의 곱보다 작을 때 그 행동이 진화적으로 유리하다고 정식화한다. 여기서 혈연도란 두 개체가 공통 조상으로부터 동일한 유전자를 물려받았을 확률을 나타내는 값이다. 일개미가 번식을 포기하고 여왕개미의 번식을 돕는 행동은 혈연 선택으로 설명되는 대표적 사례이다."
    },
    {
      id: "p2",
      text: "그러나 혈연 선택만으로는 혈연관계가 없는 개체 간의 이타적 행동을 설명할 수 없다. 1971년 로버트 트리버스는 호혜적 이타주의 이론을 통해 이 문제에 대한 해답을 제시하였다. 호혜적 이타주의란 현재 타인에게 도움을 제공하되, 미래에 그 도움을 돌려받을 것을 기대하는 행동 전략이다. 이 전략이 진화적으로 안정되려면 개체들 사이에 반복적인 상호작용이 있어야 하며, 도움을 받고도 보답하지 않는 배신자를 식별하고 배제할 수 있는 능력이 필요하다. 흡혈박쥐는 사냥에 성공한 개체가 실패한 동료에게 피를 나눠 주고, 나중에 자신이 실패했을 때 도움을 받는 행동을 보이는데, 이전에 도움을 주지 않았던 개체에게는 피를 나눠 주지 않는 선별적 행동이 관찰되었다. 이는 호혜적 이타주의의 대표적 사례로 알려져 있다."
    },
    {
      id: "p3",
      text: "진화론적 이타주의 연구는 인간 사회의 도덕과 협력 행동을 이해하는 데에도 중요한 시사점을 제공한다. 인간은 혈연이 아닌 타인, 심지어 낯선 사람에게도 이타적으로 행동하는 경우가 많은데, 이는 단순한 호혜적 이타주의를 넘어 간접적 호혜성과 평판 효과로 설명된다. 간접적 호혜성이란 직접 도움을 준 상대가 아닌 제3자로부터 보답을 받는 구조이며, 이때 개인의 평판이 협력 행동의 핵심 동기로 작용한다. 사회적으로 이타적이라는 평판을 가진 개인은 더 많은 협력 기회를 얻게 되므로, 이타적 행동은 장기적으로 행위자 자신에게도 유리하게 작용할 수 있다. 그러나 진화론적 설명이 인간의 도덕적 행위를 모두 포괄할 수 있는 것은 아니다. 자기희생적 이타 행위나 익명의 기부처럼 직접적인 진화적 이익이 없는 행동은 문화적 규범과 윤리적 자율성의 영역에 속하며, 이는 생물학적 설명만으로는 온전히 해명할 수 없는 인간 고유의 도덕적 차원이 존재함을 시사한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "진화론에서 이타적 행동이 설명하기 어려웠던 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "자기 자신에게 불리하면서 타인에게 이로운 행동이 어떻게 진화할 수 있는지가 문제였기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "해밀턴의 법칙에 따라 이타적 행동이 진화적으로 유리한 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "이타적 행동의 비용이 혈연도와 수혜자의 이익의 곱보다 작을 때 그 행동이 진화적으로 유리하다고 정식화한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "호혜적 이타주의가 진화적으로 안정되기 위한 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "개체들 사이에 반복적인 상호작용이 있어야 하며, 도움을 받고도 보답하지 않는 배신자를 식별하고 배제할 수 있는 능력이 필요하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "간접적 호혜성에서 협력 행동의 핵심 동기는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "개인의 평판이 협력 행동의 핵심 동기로 작용한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "진화론적 설명이 포괄할 수 없는 인간의 행동은 어떤 것인가?",
      answerRanges: [findRange(paragraphs, "p3", "자기희생적 이타 행위나 익명의 기부처럼 직접적인 진화적 이익이 없는 행동은 문화적 규범과 윤리적 자율성의 영역에 속하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이 글이 궁극적으로 시사하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "생물학적 설명만으로는 온전히 해명할 수 없는 인간 고유의 도덕적 차원이 존재함을 시사한다")],
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
  const contentId = `dr-r3-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(러셀 3) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "RUSSELL_3",
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
    level_id: "RUSSELL_3",
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
  console.log("=== 러셀3 Day 41~45 빌드 시작 ===\n");

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
    if (len < 1250 || len > 1350) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1250~1350)`);
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
