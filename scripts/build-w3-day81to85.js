#!/usr/bin/env node
// 비트겐슈타인3 Day 81~85 일일독해 콘텐츠 빌더
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

// ─── Day 81: 비문학 (NONFICTION) ───
function buildDay81() {
  const paragraphs = [
    {
      id: "p1",
      text: "행동경제학은 전통 경제학이 전제하는 합리적 인간 모형의 한계를 실증적으로 규명하는 학문 분야이다. 전통 경제학에서 경제 주체는 주어진 정보를 완벽하게 처리하고 효용을 극대화하는 의사 결정을 수행하는 존재로 가정된다. 그러나 대니얼 카너먼과 아모스 트버스키는 인간의 실제 의사 결정이 체계적 편향과 인지적 한계에 의해 지배된다는 사실을 실험적으로 입증하였다. 이들이 제안한 전망 이론은 인간이 이익과 손실을 비대칭적으로 평가한다는 핵심 통찰을 담고 있다. 동일한 크기의 이익과 손실이 주어질 때 손실에서 느끼는 심리적 고통이 이익에서 느끼는 만족보다 약 두 배 크다는 손실 회피 현상은, 합리적 선택 이론으로는 설명할 수 없는 다양한 경제적 행동을 해명하는 열쇠가 된다."
    },
    {
      id: "p2",
      text: "행동경제학의 또 다른 핵심 개념인 현재 편향은 인간이 미래의 보상보다 즉각적인 보상을 과도하게 선호하는 경향을 가리킨다. 전통 경제학의 할인 모형에 따르면 개인은 일관된 시간 선호율을 적용하여 미래의 가치를 현재로 환산하지만, 실제 인간의 행동은 이러한 가정과 크게 괴리된다. 예컨대 오늘 만 원을 받는 것과 내일 만 천 원을 받는 것 사이에서는 대부분이 오늘을 선택하지만, 일 년 후 만 원과 일 년 하루 후 만 천 원 사이에서는 후자를 선택하는 비일관적 행동이 관찰된다. 이러한 현재 편향은 개인의 저축 부족, 건강 관리 소홀, 과도한 부채 축적 등 다양한 비합리적 경제 행동의 원인으로 지목된다. 리처드 탈러는 이러한 통찰을 바탕으로 넛지 개념을 제안하여, 선택의 자유를 침해하지 않으면서도 바람직한 행동을 유도할 수 있는 정책 설계의 가능성을 열었다."
    },
    {
      id: "p3",
      text: "프레이밍 효과는 동일한 정보라도 제시 방식에 따라 선택이 달라지는 현상으로, 행동경제학의 핵심적 발견 중 하나이다. 카너먼과 트버스키의 고전적 실험에서 질병 대응 프로그램을 평가할 때 생존 프레임으로 제시하면 안전한 대안을 선호하고 사망 프레임으로 제시하면 모험적 대안을 선호하는 결과가 나타났다. 이 실험은 인간의 선호가 고정된 것이 아니라 맥락에 의해 구성된다는 점을 보여 주며, 이는 합리적 선택 이론의 근본 전제인 선호의 일관성을 정면으로 반박하는 것이다. 프레이밍 효과는 의료 현장에서 환자의 치료 결정, 금융 상품의 설명 방식, 공공 정책의 홍보 전략 등 실생활의 다양한 영역에서 관찰되며, 정보의 객관적 내용뿐만 아니라 제시 형태 자체가 의사 결정에 본질적 영향을 미친다는 사실을 시사한다."
    },
    {
      id: "p4",
      text: "행동경제학의 성과는 공공 정책 설계에 실질적 변화를 가져왔다. 탈러와 선스타인이 제안한 넛지 정책은 인간의 인지적 편향을 역이용하여 사회적으로 바람직한 결과를 유도하는 접근법이다. 예컨대 퇴직연금의 자동 가입 제도는 현재 편향으로 인해 가입을 미루는 경향을 극복하게 하여 노후 대비를 강화하는 대표적 넛지이다. 장기 기증 동의율도 옵트아웃 방식을 채택한 국가에서 현저히 높게 나타나는데, 이는 현상 유지 편향을 활용한 설계의 효과를 보여 준다. 그러나 넛지 정책에 대해서는 자유주의적 개입주의라는 명칭 자체가 모순적이며, 시민의 자율적 판단 능력을 과소평가한다는 비판이 제기된다. 또한 넛지가 구조적 문제의 해결을 대체하는 알리바이로 기능하여 근본적인 제도 개혁을 회피하게 만들 수 있다는 우려도 존재한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "전망 이론에서 손실 회피 현상이 의미하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "손실에서 느끼는 심리적 고통이 이익에서 느끼는 만족보다 약 두 배 크다는 손실 회피 현상은, 합리적 선택 이론으로는 설명할 수 없는 다양한 경제적 행동을 해명하는 열쇠가 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "현재 편향의 비일관성을 보여 주는 구체적 사례는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "오늘 만 원을 받는 것과 내일 만 천 원을 받는 것 사이에서는 대부분이 오늘을 선택하지만, 일 년 후 만 원과 일 년 하루 후 만 천 원 사이에서는 후자를 선택하는 비일관적 행동이 관찰된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "리처드 탈러가 넛지 개념을 통해 열고자 한 가능성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "선택의 자유를 침해하지 않으면서도 바람직한 행동을 유도할 수 있는 정책 설계의 가능성을 열었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "프레이밍 효과가 합리적 선택 이론에 대해 반박하는 핵심 전제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "합리적 선택 이론의 근본 전제인 선호의 일관성을 정면으로 반박하는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "퇴직연금 자동 가입 제도가 넛지의 대표적 사례인 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "현재 편향으로 인해 가입을 미루는 경향을 극복하게 하여 노후 대비를 강화하는 대표적 넛지이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "넛지 정책에 대해 제기되는 근본적 우려는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "넛지가 구조적 문제의 해결을 대체하는 알리바이로 기능하여 근본적인 제도 개혁을 회피하게 만들 수 있다는 우려도 존재한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(81, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 82: 문학 (LITERATURE) ───
function buildDay82() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대 소설에서 이청준은 서사의 구조 자체를 성찰의 대상으로 삼은 작가로 평가된다. 그의 작품 세계는 이야기하기의 행위가 지닌 본질적 의미를 끊임없이 탐구하면서, 소설이 단순히 현실을 반영하는 거울이 아니라 현실을 구성하는 언어적 행위임을 보여 주었다. 이청준의 서사적 특징은 액자 구조의 다층적 활용에서 두드러지게 나타난다. 하나의 이야기 안에 또 다른 이야기가 중첩되고, 이야기를 듣는 행위와 전하는 행위가 서사의 핵심적 구조를 형성하는 방식은 독자로 하여금 서사 행위 자체의 의미를 성찰하게 만든다. 이러한 구조는 서사가 세계를 있는 그대로 전달하는 것이 아니라 특정한 관점에서 재구성하는 행위임을 드러내는 장치로 기능한다. 이러한 메타소설적 경향은 단순한 기법적 실험에 머무르지 않고, 인간이 세계를 이해하고 경험을 조직하는 근본적 방식으로서의 서사에 대한 철학적 탐구로 이어진다."
    },
    {
      id: "p2",
      text: "이청준의 대표작 「소문의 벽」은 이러한 서사적 탐구가 사회적 차원으로 확장된 작품이다. 이 소설에서 주인공은 자신에 대해 유포된 소문의 진상을 추적하지만, 진실에 다가갈수록 소문은 더욱 증폭되고 변형되어 원래의 사실과는 무관한 독자적 생명력을 획득하게 된다. 이청준은 이 작품을 통해 언어가 현실을 투명하게 전달하는 도구가 아니라 현실을 왜곡하고 재구성하는 불투명한 매체임을 드러내었다. 소문이라는 서사 형식은 발화자의 의도와 무관하게 수용자에 의해 끊임없이 변형되며, 이 과정에서 원래의 사실은 언어의 미궁 속에 매몰되어 버린다. 이러한 주제 의식은 권위주의적 사회에서 정보가 통제되고 왜곡되는 현실에 대한 우회적 비판으로 읽히기도 하며, 동시에 언어와 진실의 관계에 대한 본질적 물음을 제기하는 것이기도 하다."
    },
    {
      id: "p3",
      text: "「당신들의 천국」은 이청준의 서사적 탐구가 역사적 차원과 결합된 장편 소설이다. 소록도 한센병 환자 수용소를 배경으로 한 이 작품은 이상적 공동체를 건설하려는 원장의 선의가 피지배자의 자발적 동의 없이는 또 다른 억압으로 전화될 수 있음을 형상화한다. 원장의 개혁적 의지는 진정성을 지니고 있지만, 그것이 수용자들의 주체적 판단을 배제한 채 일방적으로 추진될 때 선의의 폭력으로 변질되는 역설이 이 소설의 핵심적 긴장을 형성한다. 이청준은 이 작품에서 지배와 피지배의 관계, 선의와 억압의 경계, 개인의 자유와 공동체적 이상 사이의 갈등이라는 복합적 주제를 탐구하면서, 이상적 공동체의 실현이 구성원의 동의와 참여를 전제로 해야 한다는 인식을 제시하였다."
    },
    {
      id: "p4",
      text: "이청준의 문학적 유산은 한국 소설의 서사적 자의식을 한 차원 높인 데 있다. 그는 소설이 무엇을 이야기하느냐 못지않게 어떻게 이야기하느냐가 중요하다는 인식을 작품 속에서 구현하였으며, 이를 통해 한국 소설이 근대적 리얼리즘의 한계를 넘어 서사의 형식 자체를 탐구하는 새로운 단계로 진입하는 데 기여하였다. 또한 그의 소설에서 반복적으로 탐구되는 언어와 진실의 관계라는 주제는, 포스트모더니즘의 언어 철학적 문제의식과 공명하면서도 한국 사회의 구체적 현실에 뿌리를 둔 독자적 성격을 지닌다. 이청준이 개척한 메타소설적 서사 전략은 이후 최수철, 이인성 등 후대 작가들에게 계승되어 한국 소설의 실험적 전통을 형성하는 핵심적 자산이 되었으며, 오늘날에도 서사와 현실의 관계를 사유하는 중요한 참조점으로 기능하고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "이청준의 메타소설적 경향이 단순한 기법을 넘어서는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "인간이 세계를 이해하고 경험을 조직하는 근본적 방식으로서의 서사에 대한 철학적 탐구로 이어진다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「소문의 벽」에서 이청준이 드러내고자 한 언어의 본질적 특성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "언어가 현실을 투명하게 전달하는 도구가 아니라 현실을 왜곡하고 재구성하는 불투명한 매체임을 드러내었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「당신들의 천국」에서 원장의 선의가 폭력으로 변질되는 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "수용자들의 주체적 판단을 배제한 채 일방적으로 추진될 때 선의의 폭력으로 변질되는 역설이 이 소설의 핵심적 긴장을 형성한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "이청준이 「당신들의 천국」을 통해 제시한 이상적 공동체의 전제 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "이상적 공동체의 실현이 구성원의 동의와 참여를 전제로 해야 한다는 인식을 제시하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이청준의 언어와 진실 탐구가 지닌 독자적 성격은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "포스트모더니즘의 언어 철학적 문제의식과 공명하면서도 한국 사회의 구체적 현실에 뿌리를 둔 독자적 성격을 지닌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이청준이 개척한 서사 전략이 이후 한국 소설에 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "이후 최수철, 이인성 등 후대 작가들에게 계승되어 한국 소설의 실험적 전통을 형성하는 핵심적 자산이 되었으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(82, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 83: 비문학 (NONFICTION) ───
function buildDay83() {
  const paragraphs = [
    {
      id: "p1",
      text: "양자 컴퓨팅은 양자 역학의 원리를 활용하여 정보를 처리하는 새로운 계산 패러다임이다. 고전 컴퓨터가 비트를 기본 단위로 사용하여 0 또는 1 중 하나의 상태만을 표현하는 반면, 양자 컴퓨터는 큐비트라는 양자 비트를 사용하여 0과 1의 상태를 동시에 가질 수 있는 중첩 상태를 구현한다. 이러한 양자 중첩의 원리는 하나의 큐비트가 두 가지 상태를 동시에 나타낼 수 있게 하며, n개의 큐비트는 이론적으로 2의 n제곱 가지 상태를 동시에 표현할 수 있다. 이는 고전 컴퓨터에서는 불가능한 병렬적 정보 처리를 가능하게 하며, 특정 유형의 문제에서 기하급수적인 계산 속도 향상을 달성할 수 있는 이론적 근거가 된다. 리처드 파인먼은 1982년에 자연의 양자 역학적 현상을 시뮬레이션하려면 양자 역학적 컴퓨터가 필요하다고 제안하면서 양자 컴퓨팅의 개념적 토대를 놓았다."
    },
    {
      id: "p2",
      text: "양자 컴퓨팅의 또 다른 핵심 원리는 양자 얽힘이다. 두 개 이상의 큐비트가 얽힘 상태에 놓이면 하나의 큐비트 측정 결과가 다른 큐비트의 상태를 즉각적으로 결정하며, 이 상관관계는 큐비트 간의 물리적 거리와 무관하게 유지된다. 아인슈타인은 이 현상을 원거리에서의 으스스한 작용이라고 표현하며 양자 역학의 불완전성을 주장하였으나, 이후 벨 부등식 실험을 통해 양자 얽힘의 실재성이 실증적으로 확인되었다. 양자 컴퓨팅에서 얽힘은 큐비트 간의 강력한 상관관계를 생성하여 복잡한 연산을 효율적으로 수행하는 핵심 자원으로 활용된다. 특히 양자 오류 정정 코드에서 얽힘은 큐비트의 상태를 보호하고 계산의 신뢰성을 확보하는 데 필수적인 역할을 담당한다."
    },
    {
      id: "p3",
      text: "양자 컴퓨팅이 고전 컴퓨팅을 초월하는 능력을 보여 줄 수 있는 대표적 분야로 암호 해독과 분자 시뮬레이션이 거론된다. 피터 쇼어가 개발한 쇼어 알고리즘은 양자 컴퓨터를 이용하여 거대한 정수의 소인수 분해를 다항 시간 내에 수행할 수 있음을 보여 주었으며, 이는 현재 널리 사용되는 RSA 암호 체계의 안전성을 근본적으로 위협한다. 이에 대응하여 양자 내성 암호라는 새로운 암호 체계의 개발이 활발히 진행되고 있다. 또한 양자 컴퓨터는 분자와 화학 반응의 시뮬레이션에서 고전 컴퓨터의 한계를 극복할 수 있을 것으로 기대된다. 분자의 양자 역학적 행동을 정확하게 시뮬레이션하려면 변수의 수가 기하급수적으로 증가하여 고전 컴퓨터로는 사실상 계산이 불가능하지만, 양자 컴퓨터는 양자 시스템을 양자 시스템으로 직접 모사함으로써 이 문제를 자연스럽게 해결할 수 있다."
    },
    {
      id: "p4",
      text: "그러나 양자 컴퓨팅의 실용화에는 여전히 중대한 기술적 장벽이 존재한다. 가장 핵심적인 문제는 결어긋남으로, 이는 큐비트가 외부 환경과의 상호 작용으로 인해 양자 상태를 잃어버리는 현상이다. 결어긋남은 양자 중첩과 얽힘 상태를 파괴하여 계산 오류를 유발하며, 현재의 양자 컴퓨터는 이 문제를 극복하기 위해 극저온 환경에서 운영되거나 오류 정정 기술을 적용하고 있다. 양자 우위를 실증적으로 입증하려는 시도도 계속되고 있는데, 구글은 시커모어 프로세서를 이용하여 고전 컴퓨터로 만 년 이상 걸리는 계산을 이백 초 만에 수행하였다고 발표하였다. 다만 이에 대해 IBM은 고전 컴퓨터의 최적화를 통해 이틀이면 동일한 계산이 가능하다고 반박하면서, 양자 우위의 정의와 범위에 대한 논쟁이 계속되고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "양자 중첩이 양자 컴퓨팅에서 갖는 의의는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "고전 컴퓨터에서는 불가능한 병렬적 정보 처리를 가능하게 하며, 특정 유형의 문제에서 기하급수적인 계산 속도 향상을 달성할 수 있는 이론적 근거가 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "양자 얽힘이 양자 오류 정정에서 수행하는 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "큐비트의 상태를 보호하고 계산의 신뢰성을 확보하는 데 필수적인 역할을 담당한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "쇼어 알고리즘이 현행 암호 체계에 미치는 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "현재 널리 사용되는 RSA 암호 체계의 안전성을 근본적으로 위협한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "양자 컴퓨터가 분자 시뮬레이션 문제를 해결할 수 있는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "양자 시스템을 양자 시스템으로 직접 모사함으로써 이 문제를 자연스럽게 해결할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "결어긋남이 양자 컴퓨팅에 미치는 부정적 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "양자 중첩과 얽힘 상태를 파괴하여 계산 오류를 유발하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "구글의 양자 우위 주장에 대한 IBM의 반박 요지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "고전 컴퓨터의 최적화를 통해 이틀이면 동일한 계산이 가능하다고 반박하면서, 양자 우위의 정의와 범위에 대한 논쟁이 계속되고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(83, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 84: 문학 (LITERATURE) ───
function buildDay84() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대시에서 서정주는 생명의 원초적 에너지와 전통적 미의식을 결합한 독자적 시 세계를 구축한 시인으로 평가된다. 그의 초기 시는 원시적 생명력과 관능적 이미지가 강렬하게 분출되는 특성을 보이며, 이는 당시 한국 시단의 지배적 경향이었던 모더니즘적 지성이나 카프 문학의 이념적 지향과는 명확히 구분되는 것이었다. 대표 시집 「화사집」에 수록된 작품들은 뱀, 꽃, 피 등 원초적 생명의 상징을 통해 인간 존재의 근원적 충동과 욕망을 형상화하였다. 특히 「자화상」에서 스물세 해 동안의 삶을 응축하여 자기 존재의 근원을 성찰하는 화자의 목소리는, 서정주 초기 시의 자기 탐구적 성격을 집약적으로 보여 준다. 서정주의 이러한 초기 시적 경향은 보들레르적 악의 미학과 동양적 생명주의가 혼합된 독특한 미학적 지평을 형성하였으며, 한국 현대시의 감각적 표현 영역을 획기적으로 확장하는 계기가 되었다."
    },
    {
      id: "p2",
      text: "서정주의 시적 전환은 「귀촉도」를 비롯한 중기 작품에서 본격적으로 나타난다. 이 시기의 작품들은 초기의 원시적 생명력이 전통적 정서와 미의식으로 승화되는 과정을 보여 주며, 한국 고전 문학의 정서적 자산을 현대시의 형식 안에서 재창조하려는 의식적 시도가 두드러진다. 서정주는 불교적 윤회 사상과 무속적 세계관을 시적 상상력의 원천으로 활용하면서, 삶과 죽음의 경계를 초월하는 영원한 생명의 순환이라는 주제를 반복적으로 탐구하였다. 「귀촉도」에서 죽음 이후의 영혼이 새가 되어 돌아온다는 설화적 상상력은, 죽음을 종결이 아닌 또 다른 삶의 시작으로 인식하는 순환적 세계관을 형상화한 것이다. 이러한 시적 변모는 서정주가 서구적 근대의 직선적 시간관을 넘어 동양적 순환론에 기반한 독자적 시간 의식을 구축하였음을 보여 준다."
    },
    {
      id: "p3",
      text: "서정주의 후기 시 세계를 대표하는 「질마재 신화」 연작은 한국 전통 공동체의 삶을 신화적 상상력으로 재구성한 작품이다. 질마재라는 가상의 마을을 배경으로 한 이 연작은 농경 사회의 풍속, 토속 신앙, 민간 설화 등을 시적 소재로 활용하면서, 근대화의 물결 속에서 소멸해 가는 전통적 삶의 양식을 문학적으로 복원하고자 하였다. 서정주는 이 연작에서 일상적 삶의 장면들을 신화적 차원으로 격상시킴으로써, 범속한 삶 속에 내재된 성스러운 의미를 발견하는 시적 시선을 보여 준다. 이러한 일상의 신화화는 엘리아데가 제시한 영원 회귀의 신화와 구조적으로 유사하면서도, 한국적 토속 문화의 구체적 질감을 통해 구현된다는 점에서 독자적 의의를 지닌다."
    },
    {
      id: "p4",
      text: "서정주의 문학사적 위상에 대한 평가는 양면적이다. 미학적 차원에서 그는 한국어의 음악적 가능성을 극한까지 탐구하면서 한국 현대시의 언어적 성취를 새로운 수준으로 끌어올린 시인으로 평가된다. 그의 시에서 모음 조화와 율격의 정교한 배치는 의미와 소리가 유기적으로 결합하는 독특한 시적 효과를 창출하였으며, 이는 한국어 시의 음악성에 대한 새로운 가능성을 제시한 것이었다. 그러나 그의 친일 행적과 독재 정권에 대한 찬양 행위는 문학과 윤리의 관계에 대한 근본적인 물음을 제기한다. 예술적 탁월성이 도덕적 결함을 면책할 수 있는가, 작품의 미학적 가치와 작가의 윤리적 책임은 분리하여 평가할 수 있는가 하는 문제는, 서정주 문학을 둘러싼 논쟁의 핵심이자 한국 문학사가 지속적으로 대면해야 할 과제이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "서정주 초기 시의 미학적 특성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "보들레르적 악의 미학과 동양적 생명주의가 혼합된 독특한 미학적 지평을 형성하였으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "서정주 중기 시에서 활용된 시적 상상력의 원천은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "불교적 윤회 사상과 무속적 세계관을 시적 상상력의 원천으로 활용하면서")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「귀촉도」에서 형상화된 세계관의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "죽음을 종결이 아닌 또 다른 삶의 시작으로 인식하는 순환적 세계관을 형상화한 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "「질마재 신화」 연작에서 서정주가 보여 준 시적 시선은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "범속한 삶 속에 내재된 성스러운 의미를 발견하는 시적 시선을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "서정주 시의 언어적 성취에서 핵심적 요소는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "모음 조화와 율격의 정교한 배치는 의미와 소리가 유기적으로 결합하는 독특한 시적 효과를 창출하였으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "서정주 문학을 둘러싼 논쟁의 핵심적 문제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "예술적 탁월성이 도덕적 결함을 면책할 수 있는가, 작품의 미학적 가치와 작가의 윤리적 책임은 분리하여 평가할 수 있는가 하는 문제는, 서정주 문학을 둘러싼 논쟁의 핵심이자 한국 문학사가 지속적으로 대면해야 할 과제이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(84, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 85: 비문학 (NONFICTION) ───
function buildDay85() {
  const paragraphs = [
    {
      id: "p1",
      text: "사회 계약론은 정치적 권위와 국가의 정당성을 개인 간의 합의에서 도출하는 정치 철학적 전통이다. 토머스 홉스는 자연 상태를 만인의 만인에 대한 투쟁으로 규정하고, 이러한 전쟁 상태에서 벗어나기 위해 개인들이 자신의 자연권을 절대적 주권자에게 양도하는 계약을 체결한다고 주장하였다. 홉스에게 자연 상태는 법과 도덕이 부재하는 극단적 불안정의 상태이며, 인간의 근본적 욕구인 자기 보존은 오직 강력한 주권 권력의 수립을 통해서만 충족될 수 있다. 홉스의 사회 계약에서 주권자에게 양도된 권력은 무제한적이며, 주권자의 결정에 대한 저항은 계약 자체의 파기를 의미한다. 이러한 홉스의 이론은 절대 왕정에 대한 철학적 정당화로 비판받기도 하지만, 정치적 권위의 근거를 신적 권위가 아닌 인간적 합의에서 찾았다는 점에서 근대 정치 사상의 출발점으로 평가된다."
    },
    {
      id: "p2",
      text: "존 로크는 홉스와 달리 자연 상태를 자유와 평등이 보장되는 비교적 평화로운 상태로 규정하면서, 사회 계약의 목적을 자연권의 보호에 두었다. 로크에 따르면 인간은 자연 상태에서 이미 생명, 자유, 재산에 대한 자연권을 보유하고 있으나, 이 권리를 침해하는 행위에 대한 공정한 심판자가 부재하다는 불편함을 해소하기 위해 사회 계약을 체결한다. 따라서 로크의 사회 계약에서 정부의 권한은 제한적이며, 정부가 시민의 자연권을 침해할 경우 시민은 저항권을 행사할 수 있다. 이러한 로크의 이론은 미국 독립 선언서와 프랑스 인권 선언에 직접적인 영향을 미쳤으며, 자유주의적 입헌 민주주의의 철학적 토대를 제공하였다. 특히 재산권을 자연권의 핵심 요소로 설정한 로크의 논증은 이후 자본주의 경제 체제의 정당성을 뒷받침하는 이론적 근거로 활용되었다."
    },
    {
      id: "p3",
      text: "장 자크 루소는 홉스와 로크의 사회 계약론을 비판적으로 계승하면서 독자적인 정치 철학을 구축하였다. 루소는 자연 상태의 인간을 자유롭고 선한 존재로 상정하면서, 문명의 발전과 사유 재산의 출현이 불평등과 부자유를 초래하였다고 진단하였다. 그에게 사회 계약은 타락한 현실에서 자유를 회복하기 위한 방안으로서, 개인의 의지가 공동체의 일반 의지로 통합되는 과정이다. 루소의 일반 의지 개념은 구성원 전체의 공동선을 지향하는 집합적 의지를 의미하며, 이는 개별 구성원의 사적 이해관계의 단순한 합산인 전체 의지와는 구별된다. 그러나 일반 의지가 구체적으로 어떻게 확인되고 실현될 수 있는가 하는 문제에 대해 루소는 충분한 설명을 제시하지 못하였으며, 이 때문에 일반 의지의 이름으로 개인의 자유가 억압될 수 있다는 비판이 끊이지 않고 있다."
    },
    {
      id: "p4",
      text: "존 롤스는 20세기에 사회 계약론의 전통을 현대적으로 재구성한 철학자이다. 그는 원초적 입장이라는 사고 실험을 제안하여, 합리적 개인이 자신의 사회적 위치를 모르는 무지의 베일 뒤에서 정의의 원칙을 선택하는 상황을 설정하였다. 롤스에 따르면 이러한 조건에서 합리적 개인은 최소 수혜자에게 최대의 이익을 보장하는 차등 원칙을 선택하게 되며, 이는 사회적 불평등이 정당화되려면 가장 불리한 위치에 있는 구성원에게 이익이 되어야 한다는 것을 의미한다. 롤스의 이론은 자유주의와 평등주의를 결합하여 복지 국가의 철학적 정당성을 제공하였다는 평가를 받는다. 그러나 노직은 롤스의 재분배적 정의관이 개인의 소유권을 침해한다고 비판하였으며, 공동체주의자들은 무지의 베일이 공동체적 유대와 정체성을 도외시한 추상적 가정이라고 반박하였다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "홉스의 사회 계약론이 근대 정치 사상의 출발점으로 평가되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "정치적 권위의 근거를 신적 권위가 아닌 인간적 합의에서 찾았다는 점에서 근대 정치 사상의 출발점으로 평가된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "로크의 사회 계약에서 시민이 저항권을 행사할 수 있는 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "정부가 시민의 자연권을 침해할 경우 시민은 저항권을 행사할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "루소의 일반 의지가 전체 의지와 구별되는 핵심 기준은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "구성원 전체의 공동선을 지향하는 집합적 의지를 의미하며, 이는 개별 구성원의 사적 이해관계의 단순한 합산인 전체 의지와는 구별된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "루소의 일반 의지 개념에 대해 제기되는 비판의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "일반 의지의 이름으로 개인의 자유가 억압될 수 있다는 비판이 끊이지 않고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "롤스의 차등 원칙이 의미하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "사회적 불평등이 정당화되려면 가장 불리한 위치에 있는 구성원에게 이익이 되어야 한다는 것을 의미한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "공동체주의자들이 롤스의 무지의 베일에 대해 제기한 비판은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "공동체적 유대와 정체성을 도외시한 추상적 가정이라고 반박하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(85, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───
function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs);
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
  console.log("=== 비트겐슈타인3 Day 81~85 빌드 시작 ===\n");

  const contents = [
    buildDay81(),
    buildDay82(),
    buildDay83(),
    buildDay84(),
    buildDay85()
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

  const dayIndices = [81, 82, 83, 84, 85];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1;
    const subArea = contents[i].subArea;
    const batchItem = wrapBatchItem(contents[i], dayIdx, subArea);

    // 배치 배열이 충분히 크지 않으면 확장
    while (batchData.items.length <= batchIdx) {
      batchData.items.push(null);
    }

    if (batchData.items[batchIdx]) {
      console.log(`교체: items[${batchIdx}] (${batchData.items[batchIdx].content.contentId} → ${contents[i].contentId})`);
    } else {
      console.log(`추가: items[${batchIdx}] (${contents[i].contentId})`);
    }
    batchData.items[batchIdx] = batchItem;
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료`);

  console.log("\n=== 빌드 완료 ===");
}

main();
