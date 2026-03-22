#!/usr/bin/env node
// 비트겐슈타인3 Day 66~70 일일독해 콘텐츠 빌더
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

// ─── Day 66: 문학 (LITERATURE) ───
function buildDay66() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대 소설에서 이청준은 언어와 현실의 관계를 끊임없이 탐구한 작가로 평가된다. 그의 소설 세계는 이야기 행위 자체를 성찰의 대상으로 삼는 메타적 서사 구조를 핵심 특징으로 하며, 이를 통해 언어가 현실을 온전히 재현할 수 있는가라는 근본적 물음을 제기한다. 이청준의 대표작 「소문의 벽」은 진실과 소문, 사실과 해석 사이의 간극을 다루면서 언어적 재현의 불가능성을 날카롭게 드러낸 작품이다. 이 소설에서 화자는 사건의 진상을 파악하기 위해 여러 증언을 수집하지만, 증언들은 서로 모순되고 사건의 실체는 언어의 그물망 사이로 빠져나간다. 이러한 서사 구조는 언어가 현실을 투명하게 반영하는 도구라는 소박한 믿음을 해체하면서, 인간이 세계를 인식하고 전달하는 과정에 내재하는 본질적 한계를 형상화한 것이다."
    },
    {
      id: "p2",
      text: "이청준의 서사적 실험은 액자 구조의 정교한 활용에서 두드러진다. 그는 이야기 속에 또 다른 이야기를 삽입하는 중첩적 액자 구조를 통해 서사 행위의 조건과 의미를 탐색하였다. 「이어도」에서는 섬의 존재를 둘러싼 여러 층위의 서사가 겹쳐지면서, 이야기가 만들어내는 현실과 객관적 현실 사이의 경계가 흐려진다. 이러한 기법은 현실이 언어 이전에 독립적으로 존재하는 것이 아니라 이야기를 통해 구성되고 재구성된다는 인식론적 관점을 구현한 것이다. 또한 이청준은 화자의 신뢰성 문제를 의도적으로 부각함으로써 독자가 서사를 수동적으로 수용하는 것이 아니라 능동적으로 해석에 참여하도록 유도하였다. 이는 작가와 독자 사이의 소통 구조를 재편하는 시도로서, 한국 소설의 서사적 복잡성을 한 단계 끌어올린 성취로 평가된다."
    },
    {
      id: "p3",
      text: "이청준 소설의 또 다른 중요한 축은 예술과 삶의 관계에 대한 탐구이다. 「서편제」는 판소리 예술의 전승 과정을 통해 예술적 완성과 인간적 희생 사이의 비극적 긴장을 형상화한 작품이다. 소리꾼 유봉이 양녀 송화의 눈을 멀게 하여 소리의 극치를 이루게 하는 서사는, 예술적 성취가 인간적 윤리를 넘어설 수 있는가라는 물음을 던진다. 이 작품에서 판소리는 단순한 예술 양식이 아니라 한의 정서를 승화시키는 존재론적 행위로 제시되며, 예술을 통한 고통의 초월이라는 주제가 한국 전통 미학의 맥락에서 깊이 있게 다루어진다. 이청준은 예술의 본질이 기교의 완성이 아니라 삶의 고통을 관통하는 정신적 경지에 있음을 이 작품을 통해 역설하였으며, 이는 한국 문학에서 예술론적 소설의 중요한 전범을 형성하였다."
    },
    {
      id: "p4",
      text: "이청준이 한국 현대 소설사에 남긴 유산은 서사적 자기반영성의 확립이라는 측면에서 특히 중요하다. 그는 소설이 무엇을 이야기하는가뿐만 아니라 소설이 어떻게 이야기하는가를 동시에 문제 삼음으로써, 한국 소설의 형식적 자의식을 본격적으로 열어 놓았다. 이러한 메타소설적 경향은 이후 최수철, 이인성 등 실험적 소설가들에게 계승되어 한국 모더니즘 소설의 중요한 흐름을 형성하였다. 그러나 이청준의 서사는 형식적 실험에 머물지 않고 항상 인간의 근원적 고독과 소통의 문제로 귀결된다는 점에서 독특한 위상을 차지한다. 그의 소설에서 이야기를 나누는 행위는 단절된 존재들이 서로에게 다가가려는 절박한 시도이며, 서사의 불완전성은 인간 소통의 불완전성을 반영하는 거울로 기능한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "이청준의 「소문의 벽」이 드러내고자 한 언어의 본질적 문제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "언어가 현실을 투명하게 반영하는 도구라는 소박한 믿음을 해체하면서, 인간이 세계를 인식하고 전달하는 과정에 내재하는 본질적 한계를 형상화한 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "이청준의 액자 구조가 구현하는 인식론적 관점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "현실이 언어 이전에 독립적으로 존재하는 것이 아니라 이야기를 통해 구성되고 재구성된다는 인식론적 관점을 구현한 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "이청준이 화자의 신뢰성 문제를 부각한 목적은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "독자가 서사를 수동적으로 수용하는 것이 아니라 능동적으로 해석에 참여하도록 유도하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "「서편제」에서 이청준이 역설한 예술의 본질은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "예술의 본질이 기교의 완성이 아니라 삶의 고통을 관통하는 정신적 경지에 있음을 이 작품을 통해 역설하였으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이청준의 메타소설적 경향이 이후 한국 소설에 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "최수철, 이인성 등 실험적 소설가들에게 계승되어 한국 모더니즘 소설의 중요한 흐름을 형성하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이청준 소설에서 이야기를 나누는 행위가 지니는 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "단절된 존재들이 서로에게 다가가려는 절박한 시도이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(66, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 67: 비문학 (NONFICTION) ───
function buildDay67() {
  const paragraphs = [
    {
      id: "p1",
      text: "인지 편향은 인간의 판단과 의사 결정 과정에서 체계적으로 나타나는 비합리적 경향을 가리킨다. 인지 심리학의 연구에 따르면 인간의 사고는 완전히 합리적이지 않으며, 정보 처리 과정에서 다양한 편향이 개입하여 판단을 왜곡시킨다. 대니얼 카너먼과 아모스 트버스키는 이러한 인지 편향의 체계적 연구를 통해 인간의 의사 결정이 두 가지 사고 체계에 의해 이루어진다는 이중 과정 이론을 제시하였다. 시스템 1은 빠르고 직관적이며 자동적으로 작동하는 사고 방식으로, 일상적 상황에서 효율적인 판단을 가능하게 하지만 체계적 오류에 취약하다. 반면 시스템 2는 느리고 숙고적이며 의식적 노력을 요하는 사고 방식으로, 복잡한 문제를 분석적으로 처리하지만 인지적 자원의 소모가 크다는 특징이 있다."
    },
    {
      id: "p2",
      text: "확증 편향은 인지 편향 중 가장 광범위한 영향력을 지닌 것으로, 기존의 믿음이나 가설을 확인하는 정보만을 선택적으로 수집하고 해석하는 경향을 말한다. 사람들은 자신의 기존 신념에 부합하는 증거에는 높은 가치를 부여하면서, 이에 반하는 증거는 무시하거나 과소평가하는 경향을 보인다. 이러한 편향은 과학적 탐구에서도 나타나는데, 연구자가 자신의 가설을 지지하는 실험 결과에만 주목하고 반증 사례를 간과할 위험이 있다. 칼 포퍼가 제안한 반증 가능성의 원리는 이러한 확증 편향에 대한 방법론적 대응으로 이해될 수 있으며, 과학적 가설은 검증이 아니라 반증의 시도를 통해 그 견고성이 시험되어야 한다는 것이다. 그러나 확증 편향은 개인적 차원을 넘어 집단적 차원에서도 작동하는데, 동질적 집단 내에서 유사한 견해가 강화되고 반대 의견이 배제되는 집단 극화 현상이 그 대표적 사례이다."
    },
    {
      id: "p3",
      text: "가용성 편향은 쉽게 떠오르는 사례나 정보에 과도한 가중치를 부여하여 확률이나 빈도를 잘못 추정하는 인지적 경향이다. 예컨대 항공기 사고에 대한 언론 보도가 집중되면 사람들은 항공 여행의 위험을 실제보다 훨씬 높게 평가하게 되는데, 이는 극적이고 감정적으로 강렬한 사건이 기억에서 쉽게 인출되기 때문이다. 이러한 가용성 편향은 위험 인식의 왜곡을 초래하여 비합리적인 의사 결정으로 이어질 수 있다. 정책 결정 과정에서도 가용성 편향은 중대한 문제를 야기하는데, 최근에 발생한 사건이나 미디어의 주목을 받은 이슈에 자원이 집중적으로 배분되는 반면 실질적으로 더 중대하지만 덜 가시적인 문제에는 관심이 부족해지는 현상이 나타난다. 따라서 합리적인 의사 결정을 위해서는 직관적 인상이 아니라 통계적 데이터에 기반한 체계적 분석이 필수적이다."
    },
    {
      id: "p4",
      text: "인지 편향에 대한 이해는 개인적 차원의 합리성 향상을 넘어 사회 제도의 설계에도 중요한 시사점을 제공한다. 행동경제학에서 제안하는 넛지는 인간의 인지 편향을 고려하여 선택의 구조를 설계함으로써 사람들이 더 나은 결정을 내리도록 유도하는 전략이다. 예컨대 은퇴 연금의 자동 가입 제도는 현상 유지 편향을 활용한 것으로, 사람들이 기존 상태를 변경하기 꺼리는 경향을 이용하여 저축률을 높이는 효과를 달성한다. 그러나 넛지에 대해서는 개인의 자율적 선택을 조종한다는 윤리적 비판이 제기되기도 한다. 인지 편향의 존재가 외부적 개입을 정당화하는 근거가 될 수 있는지, 그리고 이러한 개입이 자유주의적 가치와 양립할 수 있는지에 대한 철학적 논쟁은 현재까지도 계속되고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "카너먼과 트버스키의 이중 과정 이론에서 시스템 1의 특징과 한계는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "빠르고 직관적이며 자동적으로 작동하는 사고 방식으로, 일상적 상황에서 효율적인 판단을 가능하게 하지만 체계적 오류에 취약하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "확증 편향이 과학적 탐구에서 야기할 수 있는 문제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "연구자가 자신의 가설을 지지하는 실험 결과에만 주목하고 반증 사례를 간과할 위험이 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "칼 포퍼의 반증 가능성 원리가 확증 편향에 대한 대응으로 이해되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "과학적 가설은 검증이 아니라 반증의 시도를 통해 그 견고성이 시험되어야 한다는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "가용성 편향이 정책 결정 과정에서 야기하는 구체적 문제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "최근에 발생한 사건이나 미디어의 주목을 받은 이슈에 자원이 집중적으로 배분되는 반면 실질적으로 더 중대하지만 덜 가시적인 문제에는 관심이 부족해지는 현상이 나타난다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "넛지가 활용하는 인지 편향의 구체적 사례는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "사람들이 기존 상태를 변경하기 꺼리는 경향을 이용하여 저축률을 높이는 효과를 달성한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "넛지에 대해 제기되는 윤리적 논쟁의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "인지 편향의 존재가 외부적 개입을 정당화하는 근거가 될 수 있는지, 그리고 이러한 개입이 자유주의적 가치와 양립할 수 있는지에 대한 철학적 논쟁은 현재까지도 계속되고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(67, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 68: 문학 (LITERATURE) ───
function buildDay68() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대시에서 서정주는 생명의 원초적 에너지를 시적으로 형상화한 독자적 시 세계를 구축한 시인이다. 그의 초기 시집 「화사집」은 뱀, 문둥이, 자화상 등 강렬하고 원시적인 이미지를 통해 인간 존재의 본능적 차원을 탐구하였다. 특히 대표작 「자화상」에서 스물세 해 동안의 삶을 반추하며 자신의 존재를 응시하는 시적 주체는, 수줍음과 부끄러움이라는 내면의 감정을 통해 자기 인식의 고통을 드러낸다. 이 시에서 애비는 종이었다라는 구절은 식민지 현실과 개인사의 아픔을 동시에 함축하며, 가족사의 비극을 통해 존재의 근원적 상처를 형상화한다. 서정주의 초기 시는 보들레르와 릴케의 영향 속에서 한국적 토속성과 서구 모더니즘의 감수성을 독특하게 결합하였으며, 이를 통해 한국 현대시의 감각적 지평을 확장하였다는 평가를 받는다."
    },
    {
      id: "p2",
      text: "서정주의 시 세계는 중기로 접어들면서 불교적 생사관과 신라 정신이라는 새로운 미학적 지향으로 전환되었다. 시집 「귀촉도」에서 나타나는 윤회적 세계관은 삶과 죽음의 경계를 허물고 존재의 영원한 순환을 노래하는 시적 비전을 제시한다. 서정주는 이 시기에 신라의 화랑도 정신과 불교적 초월의 미학을 결합하여, 한국 고유의 정신적 전통에서 시적 원천을 발견하고자 하였다. 이러한 전환은 그가 서구적 근대성의 영향에서 벗어나 한국적 미의식의 독자적 근거를 확보하려는 시도로 해석된다. 특히 그는 신라의 문화적 유산을 현재적 시적 체험으로 변환함으로써, 과거와 현재를 관통하는 영원의 감각을 시에 구현하고자 하였다. 이러한 영원주의적 시학은 서정주 문학의 핵심적 특징으로, 시간의 유한성을 초월하여 존재의 본질에 도달하려는 지속적 노력의 산물이었다."
    },
    {
      id: "p3",
      text: "서정주의 후기 시는 질마재 신화라는 독자적 시적 공간의 창조로 특징지어진다. 질마재는 그의 고향인 전북 고창의 실제 지명에서 비롯된 것이나, 시 속에서는 현실의 지리적 공간을 넘어 민중의 삶과 정서가 응축된 신화적 공간으로 변모한다. 「질마재 신화」 연작에서 서정주는 마을 사람들의 일상적 이야기를 소재로 하면서도, 이를 신화적 상상력을 통해 보편적 인간 경험의 차원으로 승화시킨다. 할머니의 가르침, 마을의 전설, 자연의 순환 등이 시적 서사의 축을 이루며, 이는 근대적 개인 의식에 앞서는 공동체적 지혜와 생명의 원리를 형상화한 것이다. 서정주의 질마재 시편들은 한국 서정시의 서사적 확장 가능성을 보여 주는 동시에, 개인적 서정을 공동체적 신화의 차원으로 넓혀 놓은 문학사적 성취로 평가된다."
    },
    {
      id: "p4",
      text: "서정주의 문학사적 위상은 그의 시적 성취와 함께 역사적 행적에 대한 비판이 공존하는 복합적인 것이다. 시적 완성도의 측면에서 서정주는 한국어의 음악적 가능성을 극한까지 탐구하고 한국적 서정의 독자적 미학을 구축한 시인으로 인정받는다. 그의 시에 나타나는 유려한 율격과 풍부한 감각적 이미지는 한국 현대시의 미적 기준을 형성하는 데 기여하였다. 그러나 일제 강점기의 친일 행적과 권위주의 정권에 대한 협력은 그의 시적 업적에 지울 수 없는 그늘을 드리우고 있으며, 이는 예술적 탁월성과 윤리적 책임 사이의 관계라는 보편적 문제를 제기한다. 서정주에 대한 평가는 미학적 가치와 역사적 책임을 어떻게 종합적으로 판단할 것인가라는 한국 문학 비평의 핵심적 쟁점을 형성하고 있으며, 이 논쟁은 문학과 윤리의 관계에 대한 깊은 성찰을 촉구한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "서정주의 「자화상」에서 '애비는 종이었다'라는 구절이 함축하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "식민지 현실과 개인사의 아픔을 동시에 함축하며, 가족사의 비극을 통해 존재의 근원적 상처를 형상화한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "서정주의 중기 시에서 나타나는 미학적 전환의 방향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "서구적 근대성의 영향에서 벗어나 한국적 미의식의 독자적 근거를 확보하려는 시도로 해석된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "서정주의 영원주의적 시학이 추구하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "시간의 유한성을 초월하여 존재의 본질에 도달하려는 지속적 노력의 산물이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "질마재 시편이 한국 서정시에서 지니는 문학사적 의의는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "한국 서정시의 서사적 확장 가능성을 보여 주는 동시에, 개인적 서정을 공동체적 신화의 차원으로 넓혀 놓은 문학사적 성취로 평가된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "서정주의 역사적 행적이 제기하는 보편적 문제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "예술적 탁월성과 윤리적 책임 사이의 관계라는 보편적 문제를 제기한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "서정주에 대한 평가 논쟁이 한국 문학 비평에서 형성하는 쟁점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "미학적 가치와 역사적 책임을 어떻게 종합적으로 판단할 것인가라는 한국 문학 비평의 핵심적 쟁점을 형성하고 있으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(68, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 69: 비문학 (NONFICTION) ───
function buildDay69() {
  const paragraphs = [
    {
      id: "p1",
      text: "복잡계 이론은 다수의 구성 요소가 상호작용하면서 나타나는 거시적 패턴과 질서를 연구하는 학문 분야이다. 전통적인 과학은 환원주의적 방법론에 기반하여 복잡한 현상을 단순한 요소로 분해하고 각 요소의 성질로부터 전체를 설명하려 하였다. 그러나 복잡계 이론은 전체가 부분의 단순한 합이 아니며, 구성 요소 간의 비선형적 상호작용에서 새로운 성질이 출현한다는 창발의 개념을 핵심 원리로 제시한다. 예컨대 개별 뉴런의 전기 화학적 활동만으로는 의식이라는 현상을 설명할 수 없으며, 수십억 개의 뉴런이 복잡한 네트워크를 형성하여 상호작용할 때 비로소 의식이 창발하는 것이다. 이러한 창발적 성질은 구성 요소의 수준에서는 예측할 수 없는 것으로, 환원주의적 분석만으로는 포착할 수 없는 현실의 차원을 드러낸다."
    },
    {
      id: "p2",
      text: "복잡계의 핵심적 특성 중 하나는 자기 조직화로, 외부의 중앙 통제 없이 시스템 내부의 국소적 상호작용만으로 거시적 질서가 형성되는 현상을 가리킨다. 개미 군집이 보여 주는 집단 지능은 자기 조직화의 대표적 사례이다. 개별 개미는 단순한 화학적 신호인 페로몬에 반응하여 행동할 뿐이지만, 이러한 국소적 상호작용이 축적되면 최적 경로 탐색이나 효율적 식량 분배와 같은 복잡한 집단적 행동이 출현한다. 이러한 자기 조직화는 생물학적 시스템에만 국한되지 않으며, 시장 경제에서 가격의 형성, 도시의 자연발생적 성장, 인터넷의 구조적 진화 등 다양한 사회적 현상에서도 관찰된다. 자기 조직화의 원리는 중앙 집중적 통제가 반드시 최적의 결과를 산출하는 것은 아니며, 분산된 행위자들의 자율적 상호작용이 놀라운 수준의 질서를 만들어낼 수 있음을 보여 준다."
    },
    {
      id: "p3",
      text: "복잡계는 카오스의 가장자리라 불리는 임계 상태에서 가장 역동적이고 적응적인 행동을 보인다. 완전한 질서의 상태에서 시스템은 안정적이지만 경직되어 환경 변화에 대응할 수 없고, 완전한 무질서의 상태에서는 어떤 구조도 유지될 수 없다. 카오스의 가장자리는 이 양극단 사이의 전이 지점으로, 질서와 무질서가 공존하면서 시스템이 최대한의 연산 능력과 적응 능력을 발휘하는 영역이다. 생명체의 진화는 이러한 카오스의 가장자리에서 일어나는 것으로 해석되며, 지나치게 안정적인 유전적 구조는 환경 변화에 적응하지 못하고 지나치게 불안정한 구조는 생존에 필요한 기능을 유지할 수 없기 때문이다. 이러한 원리는 조직 이론에도 적용되어, 혁신적인 조직은 완전한 통제와 완전한 자유 사이의 균형 지점에서 최적의 창의성을 발휘한다는 경영학적 시사점을 제공한다."
    },
    {
      id: "p4",
      text: "복잡계 이론은 전통적 과학의 인식론적 전제에 근본적 도전을 제기한다. 라플라스적 결정론이 초기 조건을 완전히 알면 미래를 정확히 예측할 수 있다고 가정한 반면, 복잡계에서는 초기 조건에 대한 민감한 의존성으로 인해 장기적 예측이 원리적으로 불가능하다. 이는 나비 효과라는 비유로 널리 알려진 현상으로, 초기 조건의 미세한 차이가 시간이 지남에 따라 기하급수적으로 증폭되어 전혀 다른 결과를 초래하는 것이다. 이러한 인식은 기상 예측, 경제 예측, 사회 변동의 예측 등에서 정확한 장기 예측의 한계를 인정하면서도, 시스템의 거시적 패턴과 경향성을 파악하는 데 초점을 맞추는 새로운 예측 방법론의 발전으로 이어졌다. 복잡계 이론은 불확실성을 제거의 대상이 아니라 현실의 본질적 속성으로 받아들이면서 그 속에서 의미 있는 패턴을 발견하려는 과학적 태도를 요구한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "복잡계 이론에서 창발의 개념이 환원주의와 대비되는 지점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "구성 요소의 수준에서는 예측할 수 없는 것으로, 환원주의적 분석만으로는 포착할 수 없는 현실의 차원을 드러낸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "자기 조직화의 원리가 사회적 현상에서 시사하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "중앙 집중적 통제가 반드시 최적의 결과를 산출하는 것은 아니며, 분산된 행위자들의 자율적 상호작용이 놀라운 수준의 질서를 만들어낼 수 있음을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "카오스의 가장자리가 시스템에서 중요한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "질서와 무질서가 공존하면서 시스템이 최대한의 연산 능력과 적응 능력을 발휘하는 영역이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "카오스의 가장자리 원리가 조직 이론에 제공하는 시사점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "혁신적인 조직은 완전한 통제와 완전한 자유 사이의 균형 지점에서 최적의 창의성을 발휘한다는 경영학적 시사점을 제공한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "나비 효과가 장기 예측을 원리적으로 불가능하게 만드는 메커니즘은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "초기 조건의 미세한 차이가 시간이 지남에 따라 기하급수적으로 증폭되어 전혀 다른 결과를 초래하는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "복잡계 이론이 과학적 태도에 요구하는 변화는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "불확실성을 제거의 대상이 아니라 현실의 본질적 속성으로 받아들이면서 그 속에서 의미 있는 패턴을 발견하려는 과학적 태도를 요구한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(69, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 70: 문학 (LITERATURE) ───
function buildDay70() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대 소설에서 박경리의 「토지」는 한국 문학사상 가장 방대한 규모의 대하소설로서 독보적인 위상을 차지한다. 1969년에 연재를 시작하여 1994년에 완간된 이 소설은 구한말부터 해방에 이르는 약 반세기의 역사를 배경으로, 경남 하동 악양 평사리의 최참판댁을 중심으로 한 수백 명의 인물이 얽히고설킨 거대한 서사를 펼쳐 놓는다. 박경리는 이 작품을 통해 한국 근현대사의 격동적 변화를 개인의 삶과 공동체의 운명이라는 미시적 차원에서 조명하였으며, 역사적 사건들이 평범한 사람들의 일상에 어떤 파장을 미치는지를 총체적으로 형상화하였다. 「토지」의 서사적 규모는 단순한 양적 팽창이 아니라, 한국 사회의 복합적 현실을 온전히 담아내기 위한 필연적 선택의 결과로 이해되어야 한다."
    },
    {
      id: "p2",
      text: "「토지」의 서사적 핵심은 토지를 둘러싼 소유와 상실의 문제에 있다. 최참판댁의 가문이 토지를 빼앗기고 이를 되찾기 위해 투쟁하는 과정은 작품의 기본적인 서사 동력을 형성한다. 그러나 박경리에게 토지는 단순한 재산의 의미를 넘어 삶의 근거이자 정체성의 토대로서 존재론적 의미를 지닌다. 토지의 상실은 곧 삶의 뿌리가 뽑히는 것이며, 토지의 회복은 인간이 대지에 뿌리를 내리고 존엄한 삶을 영위할 수 있는 조건의 회복을 의미한다. 이러한 토지관은 식민지 수탈의 역사적 경험과 결합하여, 제국주의적 착취가 물질적 약탈에 그치지 않고 인간의 존재론적 기반까지 파괴하는 폭력임을 드러내는 비평적 시각을 제공한다. 박경리는 토지라는 물질적 대상을 통해 인간과 자연, 개인과 공동체, 전통과 근대의 관계를 총체적으로 사유하는 철학적 깊이를 달성하였다."
    },
    {
      id: "p3",
      text: "「토지」에서 여성 인물의 형상화는 한국 소설사에서 특히 주목할 만한 성취이다. 주인공 최서희는 가부장적 질서 속에서 가문의 토지를 되찾고 공동체를 이끌어 나가는 강인한 여성으로 묘사되며, 그녀의 서사는 전통적인 여성 서사의 한계를 넘어선다. 최서희는 유교적 여성 규범에 순응하면서도 그 내부에서 주체적 의지를 관철하는 복합적 인물로, 순종과 저항이 공존하는 그녀의 태도는 식민지 시기 한국 여성의 현실적 조건을 반영한다. 또한 소설에 등장하는 다양한 여성 인물들은 계층과 성격에 따른 각기 다른 삶의 양태를 보여 주면서, 여성의 경험이 단일한 범주로 환원될 수 없는 다층적인 것임을 형상화한다. 박경리는 이들 여성 인물을 통해 역사의 주체가 영웅적 남성에 국한되지 않으며, 일상을 지탱하고 생명을 이어가는 여성의 힘이 역사를 움직이는 근본적 동력임을 문학적으로 증언하였다."
    },
    {
      id: "p4",
      text: "「토지」가 한국 문학사에서 차지하는 위상은 서사적 성취를 넘어 문명론적 비전의 차원에서도 평가되어야 한다. 박경리는 이 소설을 통해 근대화와 식민화가 동시에 진행된 한국의 특수한 역사적 경험을 보편적 인간 조건의 관점에서 성찰하였다. 근대성이 가져온 합리화와 개인화의 과정이 공동체의 해체와 인간 소외로 이어지는 문제를 날카롭게 포착하면서도, 전통 사회로의 회귀가 아닌 새로운 공동체적 가치의 모색을 지향한다. 소설의 후반부에서 강조되는 생명 사상은 인간과 자연의 유기적 관계를 회복하고 이윤 추구에 의한 자연의 도구화를 극복해야 한다는 생태적 문제의식을 선취한 것으로 평가된다. 「토지」는 대하소설이라는 형식을 통해 한국 사회의 총체성을 문학적으로 구현한 작품이자, 근대 문명에 대한 근원적 성찰을 담은 작품으로서 한국 문학의 고전적 위상을 확보하고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "「토지」의 서사적 규모가 단순한 양적 팽창이 아닌 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "한국 사회의 복합적 현실을 온전히 담아내기 위한 필연적 선택의 결과로 이해되어야 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "박경리에게 토지의 상실이 지니는 존재론적 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "토지의 상실은 곧 삶의 뿌리가 뽑히는 것이며, 토지의 회복은 인간이 대지에 뿌리를 내리고 존엄한 삶을 영위할 수 있는 조건의 회복을 의미한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "최서희의 인물 형상이 복합적이라고 평가되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "유교적 여성 규범에 순응하면서도 그 내부에서 주체적 의지를 관철하는 복합적 인물로, 순종과 저항이 공존하는 그녀의 태도는 식민지 시기 한국 여성의 현실적 조건을 반영한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "박경리가 여성 인물들을 통해 문학적으로 증언한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "일상을 지탱하고 생명을 이어가는 여성의 힘이 역사를 움직이는 근본적 동력임을 문학적으로 증언하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "「토지」 후반부의 생명 사상이 선취한 문제의식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "인간과 자연의 유기적 관계를 회복하고 이윤 추구에 의한 자연의 도구화를 극복해야 한다는 생태적 문제의식을 선취한 것으로 평가된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "「토지」가 한국 문학의 고전적 위상을 확보하는 근거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "한국 사회의 총체성을 문학적으로 구현한 작품이자, 근대 문명에 대한 근원적 성찰을 담은 작품으로서 한국 문학의 고전적 위상을 확보하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(70, "LITERATURE", "문학", paragraphs, confirmQuestions);
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
  console.log("=== 비트겐슈타인3 Day 66~70 빌드 시작 ===\n");

  const contents = [
    buildDay66(),
    buildDay67(),
    buildDay68(),
    buildDay69(),
    buildDay70()
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

  const dayIndices = [66, 67, 68, 69, 70];
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
