#!/usr/bin/env node
// 비트겐슈타인2 Day 46~50 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE, 홀수 Day = NONFICTION
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

// ─── Day 46: 문학 (LITERATURE) ───
// 김동인의 「감자」에 나타난 자연주의 문학의 특성 (문학평론)
function buildDay46() {
  const paragraphs = [
    {
      id: "p1",
      text: "김동인의 단편소설 「감자」는 1925년에 발표된 작품으로, 한국 근대 문학사에서 자연주의 소설의 대표작으로 평가받는다. 자연주의 문학은 인간의 행동이 유전과 환경에 의해 결정된다는 결정론적 세계관을 기반으로 하며, 작가는 과학자가 실험을 관찰하듯 인물의 타락 과정을 객관적으로 기술하는 태도를 취한다. 김동인은 본래 평범한 농촌 여성이었던 복녀가 환경의 압력에 의해 도덕적으로 전락해 가는 과정을 담담하게 그려 낸다. 복녀의 타락은 개인의 도덕적 결함이 아니라 빈곤이라는 사회 구조적 조건이 인간의 윤리적 판단력을 잠식해 가는 필연적 귀결로 제시된다. 이러한 서사 구조는 인물의 운명을 의지와 선택이 아닌 환경의 산물로 파악하는 자연주의 문학의 핵심 명제를 구현한 것이다."
    },
    {
      id: "p2",
      text: "「감자」의 서사에서 주목할 점은 복녀의 타락이 단계적으로 진행된다는 사실이다. 복녀는 처음에는 가난 속에서도 도덕적 기준을 유지하려 하지만, 남편의 무능과 극심한 빈곤이 지속되면서 그 기준이 무너지기 시작한다. 그녀가 감자를 훔치는 행위는 생존을 위한 불가피한 선택으로 그려지며, 이후 왕서방과의 관계는 경제적 궁핍이 인간의 윤리까지 침식하는 과정을 보여 준다. 김동인은 이 과정에서 복녀에 대한 어떠한 도덕적 판단도 유보한 채, 오직 사건의 인과적 연쇄만을 기술하는 태도를 견지한다. 이러한 서술 태도는 에밀 졸라로 대표되는 프랑스 자연주의의 실험 소설론과 맥을 같이하는 것으로, 작가가 인물에 대한 감정적 개입을 배제하고 현실을 과학적으로 분석하려는 방법론의 실천이다."
    },
    {
      id: "p3",
      text: "「감자」의 결말에서 복녀의 죽음은 자연주의적 결정론의 극단을 보여 주는 장면이다. 복녀는 왕서방이 새 여자를 들이자 격분하여 항의하지만, 결국 살해당한다. 이 결말은 환경에 의해 타락한 인물이 그 환경 속에서 파멸에 이르는 비극적 순환을 완결하는 것이다. 김동인은 복녀의 죽음을 비극적 감정의 고양 없이 건조하게 처리한다. 복녀가 감자 밭에서 죽은 채 발견되는 장면은 어떠한 서정적 수사도 배제된 채 사실만이 보고되듯 기술되며, 이는 자연주의 문학이 추구하는 몰인격적 서술의 전형이다. 이러한 결말은 독자에게 인물의 죽음에 대한 정서적 반응보다 그 죽음을 초래한 사회적 조건에 대한 인식적 각성을 요구한다."
    },
    {
      id: "p4",
      text: "김동인의 「감자」가 한국 문학사에서 차지하는 위상은 자연주의 문학론의 수용이라는 측면에서 평가된다. 김동인은 이 작품을 통해 한국 소설이 계몽적 교훈이나 낭만적 이상의 서사에서 벗어나 인간 현실의 냉정한 관찰과 분석으로 나아갈 수 있는 가능성을 제시하였다. 그러나 「감자」에 대해서는 환경 결정론이 지나치게 도식적이라는 비판도 존재한다. 복녀의 타락 과정이 빈곤이라는 단일 변수에 의해 기계적으로 진행되면서, 인물의 내면적 갈등이나 저항의 가능성이 충분히 탐구되지 못하였다는 것이다. 이러한 한계에도 불구하고 「감자」는 한국 근대 소설이 사실주의적 방법론을 본격적으로 실험한 초기의 중요한 성과로 평가되며, 이후 염상섭과 현진건의 사실주의 소설로 이어지는 한국 리얼리즘 문학의 형성에 기여한 선구적 작품이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "자연주의 문학에서 인간 행동을 결정하는 요인으로 제시되는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "인간의 행동이 유전과 환경에 의해 결정된다는 결정론적 세계관을 기반으로 하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "복녀의 타락이 개인적 결함이 아닌 것으로 제시되는 근거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "빈곤이라는 사회 구조적 조건이 인간의 윤리적 판단력을 잠식해 가는 필연적 귀결로 제시된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "김동인이 복녀의 타락 과정에서 취하는 서술 태도의 특징은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "어떠한 도덕적 판단도 유보한 채, 오직 사건의 인과적 연쇄만을 기술하는 태도를 견지한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "복녀의 죽음 장면에서 자연주의 문학의 서술 특성이 드러나는 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "어떠한 서정적 수사도 배제된 채 사실만이 보고되듯 기술되며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "「감자」에 대해 제기되는 비판의 핵심 내용은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "복녀의 타락 과정이 빈곤이라는 단일 변수에 의해 기계적으로 진행되면서, 인물의 내면적 갈등이나 저항의 가능성이 충분히 탐구되지 못하였다는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "「감자」 이후 한국 리얼리즘 문학의 형성에 기여한 작가로 언급되는 인물은 누구인가?",
      answerRanges: [findRange(paragraphs, "p4", "염상섭과 현진건의 사실주의 소설로 이어지는 한국 리얼리즘 문학의 형성에 기여한 선구적 작품이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(46, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 47: 비문학 (NONFICTION) ───
// 베이즈 정리와 조건부 확률의 응용 (수학/통계학)
function buildDay47() {
  const paragraphs = [
    {
      id: "p1",
      text: "베이즈 정리는 18세기 영국의 수학자 토머스 베이즈가 제안한 확률론의 핵심 정리로, 사전 확률과 새로운 증거를 결합하여 사후 확률을 계산하는 수학적 틀을 제공한다. 조건부 확률이란 특정 사건이 이미 발생했다는 조건 아래에서 다른 사건이 발생할 확률을 의미하며, 베이즈 정리는 이러한 조건부 확률의 방향을 역전시키는 핵심적인 도구이다. 예를 들어 질병 검사 결과가 양성일 때 실제로 그 질병에 걸렸을 확률을 구하려면, 질병의 유병률과 검사의 정확도라는 두 가지 정보를 결합해야 한다. 이 정리의 핵심 구조는 사후 확률이 사전 확률에 우도를 곱한 값에 비례한다는 것으로 요약되며, 이는 기존 믿음이 새로운 데이터에 의해 갱신되는 과정을 정량적으로 기술하는 원리이다."
    },
    {
      id: "p2",
      text: "베이즈 정리의 응용에서 직관적으로 이해하기 어려운 현상이 기저율 무시이다. 이는 사람들이 확률적 판단을 내릴 때 사전 확률, 즉 기저율을 충분히 고려하지 않고 새로운 증거의 정보에만 과도하게 의존하는 인지적 편향을 말한다. 유병률이 만 명 중 한 명인 질병에 대해 정확도 99퍼센트인 검사에서 양성이 나왔더라도, 실제 질병에 걸렸을 확률은 약 1퍼센트에 불과하다. 이는 양성 결과 중 대다수가 건강한 사람에게서 발생한 위양성이기 때문이다. 이 사례는 검사 정확도만으로 결과를 해석하면 심각한 오판에 이를 수 있음을 보여 주며, 사전 확률이 최종 판단에 결정적 영향을 미친다는 베이즈 정리의 핵심 교훈을 드러낸다."
    },
    {
      id: "p3",
      text: "베이즈 정리는 의학적 진단을 넘어 다양한 분야에서 의사 결정의 합리성을 높이는 도구로 활용된다. 스팸 메일 필터링에서는 특정 단어가 포함된 이메일이 스팸일 확률을 베이즈 정리를 통해 계산하며, 새로운 이메일이 도착할 때마다 기존의 확률 추정치가 갱신되는 구조로 작동한다. 법정에서는 각 증거가 유죄 가설의 확률을 어떻게 변화시키는지를 정량적으로 분석하는 시도가 이루어지고 있다. 인공지능 분야에서도 베이즈 네트워크는 불확실한 상황에서 여러 변수 간의 확률적 관계를 모형화하는 핵심 도구로 기능한다. 이처럼 베이즈 정리는 불확실성 아래에서의 추론을 체계화하는 보편적 원리로서 데이터에 기반한 판단의 과학적 근거를 제공한다."
    },
    {
      id: "p4",
      text: "그러나 베이즈 정리의 적용에는 근본적 한계와 철학적 논쟁이 수반된다. 핵심 쟁점은 사전 확률의 설정 문제이다. 베이즈 정리가 작동하려면 분석자가 사전 확률을 먼저 설정해야 하는데, 이 사전 확률은 객관적 데이터에 기반할 수도 있지만 주관적 믿음에 의존하는 경우가 적지 않다. 빈도주의 통계학자들은 이러한 주관성이 과학적 분석의 객관성을 훼손한다고 비판하며, 확률은 반복 가능한 실험에서의 상대 빈도로만 정의되어야 한다고 주장한다. 반면 베이즈주의자들은 확률을 불확실성에 대한 합리적 믿음의 정도로 해석하며, 충분한 데이터가 축적되면 서로 다른 사전 확률에서 출발한 분석자들도 동일한 사후 확률에 수렴하게 된다고 반론한다. 이러한 논쟁에도 불구하고, 베이즈적 사고는 불확실한 세계에서 합리적 판단을 위한 강력한 인식론적 도구로 자리 잡고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "베이즈 정리의 핵심 구조를 요약하면 어떻게 되는가?",
      answerRanges: [findRange(paragraphs, "p1", "사후 확률이 사전 확률에 우도를 곱한 값에 비례한다는 것으로 요약되며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "기저율 무시란 어떤 인지적 편향을 말하는가?",
      answerRanges: [findRange(paragraphs, "p2", "사전 확률, 즉 기저율을 충분히 고려하지 않고 새로운 증거의 정보에만 과도하게 의존하는 인지적 편향을 말한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "희귀 질병 검사에서 양성 결과의 실제 확률이 낮은 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "양성 결과 중 대다수가 건강한 사람에게서 발생한 위양성이기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "스팸 메일 필터링에서 베이즈 정리가 작동하는 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "특정 단어가 포함된 이메일이 스팸일 확률을 베이즈 정리를 통해 계산하며, 새로운 이메일이 도착할 때마다 기존의 확률 추정치가 갱신되는 구조로 작동한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "빈도주의 통계학자들이 베이즈 정리를 비판하는 핵심 논거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "주관성이 과학적 분석의 객관성을 훼손한다고 비판하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "베이즈주의자들이 사전 확률의 주관성 비판에 대해 제시하는 반론은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "충분한 데이터가 축적되면 서로 다른 사전 확률에서 출발한 분석자들도 동일한 사후 확률에 수렴하게 된다고 반론한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(47, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 48: 문학 (LITERATURE) ───
// 황석영의 「삼포 가는 길」에 나타난 산업화 시대의 유민 (문학평론)
function buildDay48() {
  const paragraphs = [
    {
      id: "p1",
      text: "황석영의 단편소설 「삼포 가는 길」은 1973년에 발표된 작품으로, 1970년대 산업화 과정에서 발생한 유민의 삶을 형상화한 리얼리즘 소설이다. 주인공 영달은 전국 각지의 건설 현장을 떠도는 노동자로, 고향 삼포로 돌아가고자 하는 여정이 서사의 중심축을 이룬다. 영달과 함께 길을 걷는 정씨와 백화 역시 각기 다른 사연으로 떠돌아다니는 존재들이다. 황석영은 세 인물의 동행을 통해 산업화가 삶의 터전을 근본적으로 해체하는 과정을 보여 주며, 근대화의 이면에 놓인 소외와 상실을 구체적 인물의 경험으로 형상화한다. 이들의 떠돎은 자발적 선택이 아니라 급격한 사회 변동에 의해 강제된 이동이라는 점에서, 개인의 의지로는 통제할 수 없는 거시적 구조 변동의 결과로 제시된다."
    },
    {
      id: "p2",
      text: "이 소설에서 삼포는 단순한 지리적 공간이 아니라 인물들이 상실한 원초적 공동체와 안정된 삶의 상징이다. 영달이 떠나온 삼포는 바닷가의 작은 마을로, 그의 기억 속에서 인간적 유대와 자연의 조화가 살아 있는 이상적 공간으로 남아 있다. 그러나 결말에서 삼포 역시 관광 단지로 개발되어 이전의 모습을 잃었다는 사실이 밝혀지며, 영달이 돌아가고자 했던 고향은 이미 존재하지 않는 곳이 된다. 이 결말은 산업화가 단순히 물리적 환경만을 변화시키는 것이 아니라, 인간이 귀속감을 느끼는 정신적 고향까지도 파괴한다는 것을 의미한다. 황석영은 삼포의 변모를 통해 근대화 과정에서 돌이킬 수 없이 상실되는 공동체적 가치에 대한 애도를 표현하며, 귀환 불가능성이라는 주제를 서사의 핵심에 배치한다."
    },
    {
      id: "p3",
      text: "「삼포 가는 길」의 서사 구조에서 특징적인 것은 로드 무비적 형식의 활용이다. 인물들이 길 위에서 만나고 함께 걸으면서 서로의 사연을 나누는 구조는 정착된 공간이 아닌 이동 중의 공간에서 서사가 전개됨을 의미한다. 이러한 이동의 서사는 인물들의 삶 자체가 어디에도 뿌리내리지 못하는 부유하는 존재임을 형식적으로 구현하는 것이다. 또한 황석영은 세 인물의 대화와 행동을 통해 각각이 겪은 소외의 양상을 다층적으로 제시한다. 영달의 소외는 고향 상실의 측면에서, 정씨의 소외는 가족과의 단절에서, 백화의 소외는 여성 노동자로서의 사회적 주변화에서 비롯된 것으로, 이 세 가지 소외의 양상은 산업화가 초래한 인간 소외의 다양한 층위를 입체적으로 보여 준다."
    },
    {
      id: "p4",
      text: "「삼포 가는 길」이 한국 문학사에서 중요한 위치를 차지하는 이유는 1970년대 산업화의 사회적 비용을 문학적으로 증언한 데 있다. 이 시기 한국 사회는 급속한 경제 성장을 이룩하였으나, 그 이면에는 농촌의 해체와 도시 빈민층의 확대, 노동자의 권리 침해 등 심각한 사회 문제가 존재하였다. 황석영은 거대 서사나 이념적 구호 대신 평범한 인물들의 구체적 경험을 통해 이러한 사회적 현실을 형상화함으로써, 민중 문학의 새로운 가능성을 열었다. 이 작품은 노동 현장의 실제 경험에 기반한 사실적 묘사와 인물에 대한 따뜻한 시선을 결합하여, 사회적 문제의식과 문학적 완성도를 동시에 성취한 작품으로 평가된다. 이후 조세희의 「난장이가 쏘아 올린 작은 공」 등 노동 문학과 민중 문학의 흐름에 선구적 영향을 미쳤다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "영달의 떠돎이 자발적 선택이 아닌 것으로 제시되는 근거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "급격한 사회 변동에 의해 강제된 이동이라는 점에서, 개인의 의지로는 통제할 수 없는 거시적 구조 변동의 결과로 제시된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "소설 결말에서 삼포의 변모가 의미하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "산업화가 단순히 물리적 환경만을 변화시키는 것이 아니라, 인간이 귀속감을 느끼는 정신적 고향까지도 파괴한다는 것을 의미한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "이 소설의 로드 무비적 형식이 형식적으로 구현하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "인물들의 삶 자체가 어디에도 뿌리내리지 못하는 부유하는 존재임을 형식적으로 구현하는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "세 인물의 소외가 입체적으로 제시되는 각각의 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "영달의 소외는 고향 상실의 측면에서, 정씨의 소외는 가족과의 단절에서, 백화의 소외는 여성 노동자로서의 사회적 주변화에서 비롯된 것으로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "황석영이 사회적 현실을 형상화하는 방법적 특징은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "거대 서사나 이념적 구호 대신 평범한 인물들의 구체적 경험을 통해 이러한 사회적 현실을 형상화함으로써")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이 작품이 이후 한국 문학에 미친 선구적 영향으로 언급되는 흐름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "노동 문학과 민중 문학의 흐름에 선구적 영향을 미쳤다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(48, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 49: 비문학 (NONFICTION) ───
// 신경전달물질과 감정의 생화학 (신경과학)
function buildDay49() {
  const paragraphs = [
    {
      id: "p1",
      text: "인간의 감정은 주관적 경험으로 느껴지지만, 그 이면에는 신경전달물질이라는 화학 물질의 작용이 존재한다. 신경전달물질은 뉴런과 뉴런 사이의 시냅스 간극에서 신호를 전달하는 화학적 매개체로, 수용체와 결합하여 다음 뉴런의 활동을 촉진하거나 억제한다. 감정의 생화학적 기반을 이해하는 데 핵심적인 신경전달물질로는 세로토닌, 도파민, 노르에피네프린이 대표적이다. 세로토닌은 기분 조절과 정서적 안정에 관여하며, 그 수준이 낮아지면 우울감과 불안이 증가하는 것으로 알려져 있다. 도파민은 보상과 쾌락의 경험에 관련되어 목표 달성이나 긍정적 자극에 반응하여 분비되며, 노르에피네프린은 각성과 집중을 조절하여 위험이나 스트레스 상황에서의 경계 반응을 매개한다."
    },
    {
      id: "p2",
      text: "신경전달물질이 감정에 미치는 영향은 단순한 일대일 대응 관계가 아니라 복잡한 상호 작용의 결과이다. 하나의 감정 상태는 여러 신경전달물질의 동시적 작용에 의해 형성되며, 동일한 신경전달물질이라도 작용하는 뇌 영역에 따라 전혀 다른 감정적 결과를 초래할 수 있다. 예를 들어 도파민은 중뇌변연계 경로에서는 쾌락과 보상 감각을 매개하지만, 전전두엽 피질에서는 의사 결정과 인지적 유연성에 관여한다. 또한 신경전달물질 간의 균형이 감정 조절에 중요한 역할을 하는데, 세로토닌과 도파민의 불균형은 충동 조절의 어려움과 관련되며, 노르에피네프린의 과잉 분비는 불안 장애의 생화학적 기반으로 지목된다. 이러한 복잡성은 감정이 단일 화학 물질의 증감으로 환원될 수 없는 다차원적 현상임을 시사한다."
    },
    {
      id: "p3",
      text: "현대 정신의학에서 항우울제의 작용 기전은 신경전달물질과 감정의 관계를 보여 주는 대표적 사례이다. 선택적 세로토닌 재흡수 억제제는 시냅스 간극에서 세로토닌이 재흡수되는 과정을 차단하여 세로토닌의 가용량을 증가시키는 원리로 작동한다. 이 약물이 우울증 환자의 증상을 완화하는 데 효과를 보인다는 사실은 세로토닌 결핍이 우울증의 중요한 생화학적 요인임을 뒷받침하는 근거로 활용되어 왔다. 그러나 항우울제가 세로토닌 수준을 투약 직후부터 변화시키는 반면, 임상적 효과는 수 주가 지나야 나타난다는 시간 지연 현상은 우울증의 기전이 단순한 세로토닌 결핍만으로는 설명되지 않음을 시사한다. 최근 연구에서는 항우울제의 효과가 신경 가소성의 촉진, 즉 뉴런 간 새로운 연결의 형성과 관련될 수 있다는 가설이 주목받고 있다."
    },
    {
      id: "p4",
      text: "신경전달물질에 기반한 감정 이해는 정신 건강의 과학적 접근을 가능하게 하였으나, 이를 둘러싼 비판적 논의도 존재한다. 감정을 화학 물질의 불균형으로 환원하는 관점은 정신 질환의 탈낙인화에 기여한 측면이 있지만, 동시에 감정 경험의 심리적, 사회적, 실존적 차원을 경시하는 결과를 초래할 수 있다. 우울증이 단순히 세로토닌의 부족 때문이라는 화학적 불균형 모델은 대중적으로 널리 수용되었으나, 이 모델은 우울증의 발생에 관여하는 심리적 외상, 사회적 고립, 경제적 스트레스 등 환경적 요인의 역할을 충분히 설명하지 못한다. 따라서 현대 신경과학은 생물학적 요인과 심리사회적 요인을 통합적으로 고려하는 생물심리사회 모델을 지향하며, 신경전달물질은 감정의 필요조건이지만 충분조건은 아니라는 균형 잡힌 관점이 요구된다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "신경전달물질이 신호를 전달하는 구체적 위치는 어디인가?",
      answerRanges: [findRange(paragraphs, "p1", "뉴런과 뉴런 사이의 시냅스 간극에서 신호를 전달하는 화학적 매개체로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "동일한 도파민이 뇌 영역에 따라 다른 기능을 하는 사례는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "중뇌변연계 경로에서는 쾌락과 보상 감각을 매개하지만, 전전두엽 피질에서는 의사 결정과 인지적 유연성에 관여한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "선택적 세로토닌 재흡수 억제제가 작동하는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "시냅스 간극에서 세로토닌이 재흡수되는 과정을 차단하여 세로토닌의 가용량을 증가시키는 원리로 작동한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "항우울제의 시간 지연 현상이 시사하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "우울증의 기전이 단순한 세로토닌 결핍만으로는 설명되지 않음을 시사한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "화학적 불균형 모델이 충분히 설명하지 못하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "심리적 외상, 사회적 고립, 경제적 스트레스 등 환경적 요인의 역할을 충분히 설명하지 못한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "현대 신경과학이 지향하는 통합적 모델의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "생물학적 요인과 심리사회적 요인을 통합적으로 고려하는 생물심리사회 모델을 지향하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(49, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 50: 문학 (LITERATURE) ───
// 박목월과 조지훈의 자연 서정시 비교 (문학평론)
function buildDay50() {
  const paragraphs = [
    {
      id: "p1",
      text: "박목월과 조지훈은 1946년 을유문화사에서 발간된 공동 시집 「청록집」의 동인으로, 한국 현대 시사에서 자연 서정시의 전통을 확립한 시인들이다. 이들은 해방 이후 이념적 대립이 격화되던 시기에 자연을 시적 대상으로 삼아 한국적 서정의 미학을 탐구하였다. 그러나 두 시인이 자연을 바라보는 시각에는 분명한 차이가 존재한다. 박목월의 자연은 목가적이고 동화적인 세계로, 인간과 자연이 조화롭게 공존하는 이상적 공간으로 그려진다. 반면 조지훈의 자연은 전통적 미의식과 선비 정신이 투영된 공간으로, 고전적 아취와 절제된 서정이 특징적이다. 이러한 차이에도 불구하고 두 시인은 자연을 통해 현실의 혼란으로부터 벗어나 정신적 순수성을 회복하고자 하였다는 점에서 공통된 지향을 보여 준다."
    },
    {
      id: "p2",
      text: "박목월의 초기 시 세계는 경상도 산간 지역의 자연을 배경으로 한 목가적 서정으로 대표된다. 대표작 「나그네」에서 시적 화자는 강나루 건너서 밀밭 길을 걷는 나그네로 등장하며, 구름에 달 가듯이라는 표현은 한국적 자연의 정취를 음악적 율격으로 형상화한 것이다. 박목월의 시에서 자연은 갈등이 부재한 평화로운 공간이며, 시적 화자는 이 공간 속에서 존재론적 안식을 경험한다. 이러한 목가적 세계관은 도속성의 세계를 벗어난 원초적 자연으로의 회귀를 지향하는 것으로, 산업화 이전 한국 농촌의 서정적 원형을 시적 언어로 보존하려는 시도로 읽힌다. 그러나 박목월의 초기 시에 대해서는 현실적 갈등을 회피하고 이상화된 자연에 안주한다는 비판도 제기되어 왔다."
    },
    {
      id: "p3",
      text: "조지훈의 시 세계는 한국 전통 문화의 미적 정수를 현대시의 형식으로 계승한 것으로 평가된다. 그의 대표작 「승무」는 달빛 아래 승복을 입은 여인의 춤사위를 형상화한 작품으로, 한국적 아름다움의 정수를 시각적 이미지로 구현하였다. 이 시에서 조지훈은 하얀 고깔과 긴 사 나래의 시각적 이미지를 청각적 표현과 결합하여 공감각적 미감을 창출하며, 움직임과 정지가 교차하는 춤의 역동성을 절제된 언어로 포착한다. 조지훈의 자연은 박목월의 목가적 자연과 달리 고전적 격조와 정신적 깊이가 부여된 공간이다. 그의 시에서 자연의 풍경은 선비의 청빈한 삶과 지조의 정신을 반영하는 매개체로 기능하며, 자연의 관조를 통해 내면적 수양에 이르는 동양적 자연관이 시적으로 형상화되어 있다."
    },
    {
      id: "p4",
      text: "박목월과 조지훈의 자연 서정시를 비교하면, 한국 현대시에서 자연이 수행하는 다양한 미학적 기능을 파악할 수 있다. 박목월에게 자연은 인간이 돌아가야 할 원초적 고향이자 정서적 안식처이며, 그의 시적 언어는 구어적 친근함과 민요적 율격을 통해 이 세계에 접근한다. 반면 조지훈에게 자연은 정신적 수양의 공간이자 전통적 미의식의 구현체이며, 그의 시적 언어는 한자어의 고전적 품격과 시각적 이미지의 정교한 배치를 특징으로 한다. 두 시인의 차이는 한국적 자연 서정의 스펙트럼이 단일하지 않으며, 자연이라는 동일한 대상이 시인의 세계관에 따라 전혀 다른 미학적 의미를 획득할 수 있음을 보여 준다. 청록파의 자연 서정시는 이후 한국 현대시의 서정적 전통을 형성하는 중요한 기반이 되었으며, 자연과 인간의 관계를 사유하는 한국시의 미학적 자산으로 남아 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "박목월과 조지훈이 자연을 통해 공통적으로 추구한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "현실의 혼란으로부터 벗어나 정신적 순수성을 회복하고자 하였다는 점에서 공통된 지향을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "박목월 초기 시의 목가적 세계관이 지향하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "도속성의 세계를 벗어난 원초적 자연으로의 회귀를 지향하는 것으로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "조지훈의 「승무」에서 공감각적 미감을 창출하는 방법은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "시각적 이미지를 청각적 표현과 결합하여 공감각적 미감을 창출하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "조지훈의 시에서 자연이 수행하는 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "선비의 청빈한 삶과 지조의 정신을 반영하는 매개체로 기능하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "두 시인의 시적 언어의 차이를 어떻게 요약할 수 있는가?",
      answerRanges: [findRange(paragraphs, "p4", "박목월에게 자연은 인간이 돌아가야 할 원초적 고향이자 정서적 안식처이며, 그의 시적 언어는 구어적 친근함과 민요적 율격을 통해 이 세계에 접근한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "청록파의 자연 서정시가 한국 현대시에 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "한국 현대시의 서정적 전통을 형성하는 중요한 기반이 되었으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(50, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  // 정독 타임라인 자동 생성
  const timeline = buildTimeline(paragraphs);
  // 복기 카드 8장
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
  console.log("=== 비트겐슈타인2 Day 46~50 빌드 시작 ===\n");

  const contents = [
    buildDay46(),
    buildDay47(),
    buildDay48(),
    buildDay49(),
    buildDay50()
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

  // 배치 파일 갱신 (items[45]~items[49] 갱신)
  console.log("\n배치 파일 갱신 중...");
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`현재 배치 items 수: ${batchData.items.length}`);

  const dayIndices = [46, 47, 48, 49, 50];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1; // 0-based: items[45]~items[49]
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
