#!/usr/bin/env node
// 비트겐슈타인3 Day 61~65 일일독해 콘텐츠 빌더
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

// ─── 정독 타임라인 빌더 ───
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

// ─── 복기 카드 빌더 (8장) ───
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

// ─── Day 61: 비문학 (NONFICTION) ───
function buildDay61() {
  const paragraphs = [
    {
      id: "p1",
      text: "인지 편향은 인간의 판단과 의사 결정 과정에서 체계적으로 발생하는 사고의 왜곡 현상을 가리킨다. 대니얼 카너먼과 아모스 트버스키는 1970년대 실험을 통해 인간이 합리적 경제 주체로서 최적의 판단을 내린다는 전통 경제학의 가정에 의문을 제기하였다. 이들은 인간의 인지 체계가 두 가지 사고 방식을 병행한다고 제안하였는데, 시스템 1은 빠르고 직관적이며 감정적인 사고를, 시스템 2는 느리고 분석적이며 의식적인 사고를 담당한다. 일상적 상황에서 시스템 1이 대부분의 판단을 주도하는데, 이 과정에서 다양한 인지 편향이 발생한다. 시스템 1은 정보 처리의 효율성을 위해 간편 추론법, 곧 휴리스틱을 사용하며, 이 휴리스틱이 체계적 오류를 유발하는 것이 인지 편향의 핵심 메커니즘이다."
    },
    {
      id: "p2",
      text: "대표적인 인지 편향으로 확증 편향이 있다. 확증 편향이란 자신의 기존 믿음이나 가설을 지지하는 정보를 선택적으로 수집하고, 그에 반하는 증거를 무시하거나 과소평가하는 경향을 말한다. 이 편향은 과학적 연구에서도 나타나는데, 연구자가 자신의 가설을 확인하는 데이터에 더 큰 비중을 부여하거나 반증 사례를 예외로 처리하는 경우가 이에 해당한다. 사회적 맥락에서 확증 편향은 집단 극화를 심화시키는 요인으로 작용한다. 동질적인 정보 환경에 노출된 개인들은 자신의 기존 견해를 강화하는 정보만을 반복적으로 소비하게 되고, 이는 상대측의 주장을 이해하고 수용하는 능력을 약화시킨다. 현대 디지털 환경에서 알고리즘 기반 콘텐츠 추천 시스템은 사용자의 기존 선호에 부합하는 정보를 집중적으로 제공함으로써 확증 편향을 구조적으로 강화하는 역할을 하고 있어 우려를 낳고 있다."
    },
    {
      id: "p3",
      text: "기준점 효과는 초기에 제시된 정보가 이후 판단에 과도한 영향을 미치는 현상이다. 트버스키와 카너먼의 실험에서 참가자들에게 무작위 숫자를 보여 준 후 아프리카 국가의 유엔 가입 비율을 추정하게 하였더니, 제시된 숫자가 높은 경우 추정값도 유의미하게 높아지는 결과가 나타났다. 이는 관련 없는 수치조차도 판단의 기준점으로 작용할 수 있음을 보여 준다. 기준점 효과는 상업적 영역에서 광범위하게 활용되는데, 제품의 원래 가격을 높게 제시한 후 할인 가격을 보여 주는 마케팅 전략이 대표적 사례이다. 소비자는 원래 가격이라는 기준점에 의해 할인 가격을 실제보다 더 매력적으로 느끼게 되며, 이는 합리적 가격 판단을 방해한다. 법적 영역에서도 기준점 효과는 배상액 산정에 영향을 미치는 것으로 보고되어, 사법적 판단의 객관성에 대한 성찰을 요구하고 있다."
    },
    {
      id: "p4",
      text: "인지 편향에 대한 연구는 행동경제학이라는 새로운 학문 분야의 형성으로 이어졌다. 리처드 탈러는 인지 편향을 정책 설계에 적용하는 넛지 이론을 제안하였는데, 이는 개인의 선택 자유를 제한하지 않으면서도 바람직한 방향으로 행동을 유도하는 설계를 뜻한다. 예컨대 연금 가입을 기본 설정으로 두고 탈퇴를 선택하게 하는 방식은, 현상 유지 편향을 활용하여 저축률을 높이는 효과적 개입으로 입증되었다. 그러나 넛지 이론에 대해서는 정부나 기업이 개인의 의사 결정을 조작하는 수단으로 전락할 수 있다는 비판이 제기된다. 무엇이 바람직한 행동인지를 누가 결정하는가의 문제는, 넛지가 자유주의적 개입인지 온정주의적 통제인지에 대한 근본적 논쟁을 야기한다. 따라서 인지 편향에 대한 이해는 인간 사고의 한계를 인식하는 데 그치지 않고, 그 활용에 관한 윤리적 성찰로 확장되어야 한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "카너먼과 트버스키가 제안한 시스템 1의 특성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "시스템 1은 빠르고 직관적이며 감정적인 사고를")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "확증 편향이 집단 극화를 심화시키는 메커니즘은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "자신의 기존 견해를 강화하는 정보만을 반복적으로 소비하게 되고, 이는 상대측의 주장을 이해하고 수용하는 능력을 약화시킨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "디지털 환경에서 확증 편향이 구조적으로 강화되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "알고리즘 기반 콘텐츠 추천 시스템은 사용자의 기존 선호에 부합하는 정보를 집중적으로 제공함으로써 확증 편향을 구조적으로 강화하는 역할을 하고 있어")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "기준점 효과가 소비자의 가격 판단에 미치는 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "원래 가격이라는 기준점에 의해 할인 가격을 실제보다 더 매력적으로 느끼게 되며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "넛지 이론에서 연금 가입 기본 설정이 활용하는 인지 편향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "현상 유지 편향을 활용하여 저축률을 높이는 효과적 개입으로 입증되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "넛지 이론에 대해 제기되는 근본적 논쟁의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "넛지가 자유주의적 개입인지 온정주의적 통제인지에 대한 근본적 논쟁을 야기한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(61, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 62: 문학 (LITERATURE) ───
function buildDay62() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대 소설에서 박완서는 전쟁의 기억과 중산층의 일상을 여성적 시각으로 형상화한 대표적 작가이다. 그녀의 문학 세계는 한국전쟁의 체험에서 출발하여 산업화 시대 중산층 가정의 내밀한 풍경에까지 이르는 넓은 스펙트럼을 포괄한다. 박완서의 첫 장편 소설 「나목」은 전쟁 중 PX에서 일하는 여성 화자의 시선을 통해 전쟁이 개인의 삶에 남기는 상흔을 섬세하게 그려 낸 작품이다. 이 소설에서 여성 화자의 시선은 전쟁의 영웅적 서사를 해체하고, 전쟁의 일상성과 그 속에서 살아남아야 하는 개인의 고통에 초점을 맞춘다. 박완서는 전쟁을 거시적 역사의 차원이 아니라 미시적 일상의 차원에서 포착함으로써, 기존의 남성 중심적 전쟁 서사와는 질적으로 다른 문학적 증언을 수행하였다."
    },
    {
      id: "p2",
      text: "박완서 소설의 두드러진 특징은 일상 언어의 문학적 활용에 있다. 그녀의 문장은 학술적 수사나 문학적 장식을 배제하고, 마치 이웃집 아주머니의 수다처럼 자연스러운 구어체로 진행된다. 그러나 이 평범해 보이는 언어 속에는 인간 관계의 위선과 사회적 허위를 꿰뚫는 날카로운 관찰이 담겨 있다. 「엄마의 말뚝」에서 어머니의 집착적 교육열은 일상적 언어로 서술되면서도, 식민지 경험과 전쟁으로 인한 계층 불안이 자녀 교육으로 전이되는 심층적 구조를 드러낸다. 박완서는 이처럼 일상의 표면 아래 숨겨진 사회 구조적 모순을 여성적 감수성과 구어체적 문체로 포착함으로써, 한국 사실주의 소설에 새로운 문체적 가능성을 열었다. 이는 문학적 언어가 반드시 일상 언어와 구별되어야 한다는 관념에 대한 효과적인 반론이기도 하였다."
    },
    {
      id: "p3",
      text: "박완서의 중기 이후 소설은 산업화와 도시화가 초래한 한국 중산층의 정신적 공허를 집중적으로 탐구한다. 「살아 있는 날의 시작」, 「그 가을의 사흘 동안」 등의 작품에서 중산층 여성 인물들은 물질적 안정 속에서도 존재론적 불안과 정체성의 위기를 경험한다. 이들의 불안은 단순한 개인적 심리의 문제가 아니라, 급속한 경제 성장이 기존의 공동체적 유대를 해체하고 물질적 가치를 삶의 유일한 기준으로 부상시킨 사회 구조적 변동의 산물이다. 박완서는 이러한 중산층의 내면적 풍경을 그리면서, 소비 사회가 인간의 관계와 정체성을 어떻게 왜곡하는지를 비판적으로 형상화한다. 특히 그녀의 소설에서 중산층 가정의 아파트는 단순한 거주 공간이 아니라 계층적 욕망과 사회적 허위가 응축된 상징적 공간으로 기능한다."
    },
    {
      id: "p4",
      text: "박완서 문학이 한국 소설사에서 갖는 의의는 여성주의적 관점의 확립에서도 찾을 수 있다. 그녀는 여성의 경험을 주변적이거나 부차적인 것이 아니라 인간 보편의 문제를 조명하는 핵심적 통로로 자리매김하였다. 어머니, 아내, 며느리라는 전통적 역할 속에서 자아를 모색하는 여성 인물들의 서사는, 가부장제 사회에서 여성이 처한 구조적 모순을 가시화하는 동시에 그 안에서의 생존 전략과 저항의 방식을 구체적으로 형상화한다. 박완서의 여성주의는 서구 페미니즘 이론의 직접적 수용이 아니라 한국 사회의 구체적 경험에서 발원한 것이라는 점에서 독자적 의의를 지닌다. 이러한 박완서의 문학적 성취는 이후 신경숙, 공지영 등 후세대 여성 작가들에게 중요한 문학적 자원이 되었으며, 한국 소설에서 여성 서사의 독립적 영역을 확보하는 데 결정적으로 기여하였다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "박완서가 전쟁 서사에서 기존 남성 중심적 서사와 차별화되는 지점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "전쟁을 거시적 역사의 차원이 아니라 미시적 일상의 차원에서 포착함으로써, 기존의 남성 중심적 전쟁 서사와는 질적으로 다른 문학적 증언을 수행하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "박완서의 일상적 문체가 한국 소설에 기여한 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "한국 사실주의 소설에 새로운 문체적 가능성을 열었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「엄마의 말뚝」에서 어머니의 교육열이 드러내는 심층적 구조는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "식민지 경험과 전쟁으로 인한 계층 불안이 자녀 교육으로 전이되는 심층적 구조를 드러낸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "박완서 소설에서 중산층 여성의 불안이 사회 구조적 산물인 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "급속한 경제 성장이 기존의 공동체적 유대를 해체하고 물질적 가치를 삶의 유일한 기준으로 부상시킨 사회 구조적 변동의 산물이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "박완서 소설에서 아파트 공간이 지니는 상징적 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "계층적 욕망과 사회적 허위가 응축된 상징적 공간으로 기능한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "박완서의 여성주의가 독자적 의의를 지니는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "서구 페미니즘 이론의 직접적 수용이 아니라 한국 사회의 구체적 경험에서 발원한 것이라는 점에서 독자적 의의를 지닌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(62, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 63: 비문학 (NONFICTION) ───
function buildDay63() {
  const paragraphs = [
    {
      id: "p1",
      text: "사회 계약론은 국가의 정당성과 정치적 의무의 근거를 합리적 개인들의 자발적 합의에서 찾는 정치철학적 전통이다. 이 이론의 핵심 전제는, 정치 공동체가 형성되기 이전의 자연 상태를 가정하고 그 상태의 문제점을 해결하기 위해 개인들이 이성적으로 사회 계약을 체결한다는 것이다. 토머스 홉스는 자연 상태를 만인의 만인에 대한 투쟁으로 묘사하였다. 홉스에 따르면 자연 상태에서 모든 개인은 자기 보존을 위해 무한한 자유를 행사하지만, 이 무한한 자유가 오히려 모든 개인의 안전을 위협하는 역설적 상황을 초래한다. 따라서 개인들은 자신의 자연적 자유를 절대적 주권자에게 양도하고, 그 대가로 안전과 질서를 보장받는 계약을 체결한다는 것이 홉스 사회 계약론의 골자이다."
    },
    {
      id: "p2",
      text: "존 로크는 홉스와 달리 자연 상태를 비교적 평화로운 상태로 보았으며, 자연법에 의해 규율되는 자유와 평등의 상태로 규정하였다. 로크의 자연 상태에서 개인은 생명, 자유, 재산에 대한 자연권을 이미 향유하고 있으나, 이 권리를 침해받았을 때 공정한 심판자가 부재하다는 문제가 존재한다. 따라서 로크의 사회 계약은 자연권을 주권자에게 양도하는 것이 아니라, 자연권을 더 효과적으로 보호하기 위해 제한된 권력을 가진 정부를 수립하는 것이다. 이 관점에서 정부의 권력은 인민의 동의에 기초하며, 정부가 인민의 자연권을 침해할 경우 인민은 저항할 권리를 가진다. 로크의 사회 계약론은 이후 미국 독립선언서와 프랑스 인권선언의 사상적 기초가 되었으며, 입헌주의와 대의 민주주의의 이론적 토대를 제공하였다."
    },
    {
      id: "p3",
      text: "장자크 루소의 사회 계약론은 홉스와 로크의 이론을 비판적으로 계승하면서 독자적인 정치 사상을 전개하였다. 루소는 자연 상태를 고귀한 야만인이 자유롭고 행복하게 살던 상태로 그렸으며, 사유재산의 출현이 불평등과 갈등을 야기하였다고 진단하였다. 루소의 사회 계약은 개인의 의지를 일반 의지에 통합함으로써 자유와 평등을 동시에 실현하는 것을 목표로 한다. 일반 의지는 개별 의지의 단순한 합이 아니라, 공동체 구성원 전체의 공통된 이익을 지향하는 의지이다. 루소에 따르면 개인이 일반 의지에 복종하는 것은 곧 자기 자신에게 복종하는 것이며, 따라서 사회 계약을 통해 자유가 제한되는 것이 아니라 오히려 도덕적 자유가 실현된다. 이러한 루소의 일반 의지 개념은 민주주의 이론에 심대한 영향을 미쳤으나, 일반 의지의 이름으로 소수의 자유가 억압될 수 있다는 전체주의적 해석의 위험성도 내포하고 있다."
    },
    {
      id: "p4",
      text: "현대 정치철학에서 존 롤스는 사회 계약론의 전통을 계승하여 정의론을 구축하였다. 롤스는 원초적 입장이라는 가상적 상황을 설정하는데, 이는 합리적 개인들이 무지의 베일 뒤에서 사회의 기본 원칙을 선택하는 사고 실험이다. 무지의 베일은 개인이 자신의 사회적 지위, 능력, 가치관 등을 모르는 상태를 의미하며, 이 조건하에서 합의된 원칙이 공정한 것으로 간주된다. 롤스에 따르면 이 상황에서 합리적 개인들은 두 가지 정의의 원칙을 선택하게 되는데, 첫째는 기본적 자유의 평등한 보장이고 둘째는 사회적·경제적 불평등이 최소 수혜자에게 최대 이익이 되도록 배열되어야 한다는 차등 원칙이다. 롤스의 정의론은 자유주의와 평등주의를 조화시키려는 시도로서 현대 정치철학의 중심적 논의를 형성하였으나, 공동체주의자들은 원초적 입장의 추상적 개인이 현실의 사회적 존재를 적절히 반영하지 못한다고 비판하였다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "홉스가 묘사한 자연 상태의 역설적 특성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "무한한 자유가 오히려 모든 개인의 안전을 위협하는 역설적 상황을 초래한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "로크의 사회 계약이 홉스와 근본적으로 다른 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "자연권을 주권자에게 양도하는 것이 아니라, 자연권을 더 효과적으로 보호하기 위해 제한된 권력을 가진 정부를 수립하는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "로크의 이론에서 인민의 저항권이 정당화되는 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "정부가 인민의 자연권을 침해할 경우 인민은 저항할 권리를 가진다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "루소의 사회 계약에서 자유가 제한되지 않는다고 보는 논리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "개인이 일반 의지에 복종하는 것은 곧 자기 자신에게 복종하는 것이며, 따라서 사회 계약을 통해 자유가 제한되는 것이 아니라 오히려 도덕적 자유가 실현된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "롤스의 무지의 베일이 보장하고자 하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "이 조건하에서 합의된 원칙이 공정한 것으로 간주된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "공동체주의자들이 롤스의 정의론에 제기한 비판의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "원초적 입장의 추상적 개인이 현실의 사회적 존재를 적절히 반영하지 못한다고 비판하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(63, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 64: 문학 (LITERATURE) ───
function buildDay64() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대시에서 백석은 토속적 언어와 서사적 구성을 통해 사라져 가는 전통적 삶의 세계를 형상화한 독보적 시인이다. 그의 시에는 평안도 방언과 고유어가 풍부하게 사용되며, 이러한 언어적 선택은 단순한 향토색의 재현이 아니라 근대화 과정에서 소멸해 가는 토착적 삶의 양식을 문학적으로 보존하려는 의식적 기획이었다. 백석의 대표작 「여승」은 한 여인의 비극적 생애를 역순행적 구성으로 서술하면서, 개인의 삶이 역사적 격변에 의해 파괴되는 과정을 압축적으로 보여 준다. 이 작품에서 여승이 된 여인의 현재는 가장 먼저 제시되고, 그 원인이 되는 과거의 사건들이 점차 드러나는 구성을 취하는데, 이러한 역순행적 서술은 독자에게 추리적 긴장감을 부여하는 동시에, 운명의 불가역성에 대한 비극적 인식을 효과적으로 전달한다."
    },
    {
      id: "p2",
      text: "백석 시의 또 다른 특징은 서사적 구성과 서정적 감수성의 독특한 결합에 있다. 전통적으로 시는 서정 장르로서 개인의 내면적 감정을 응축적으로 표현하는 것을 본령으로 삼아 왔으나, 백석은 이야기를 들려주듯 구체적인 인물과 사건을 시 속에 배치하면서도 깊은 서정적 여운을 남기는 독자적인 방법을 구현하였다. 「나와 나타샤와 흰 당나귀」에서 눈 내리는 밤에 나타샤와 함께 당나귀를 타고 가는 장면은, 구체적인 서사적 상황의 설정이면서 동시에 고독한 존재가 꿈꾸는 사랑과 교감의 이상적 세계를 상징하는 서정적 이미지이다. 백석은 이처럼 서사와 서정의 경계를 자유롭게 넘나들면서, 한국 현대시의 장르적 외연을 확장하였다. 이는 당시의 주류적 서정시가 관념적이고 추상적인 감정 표현에 치우치던 경향에 대한 효과적인 대안이었다."
    },
    {
      id: "p3",
      text: "백석의 시에서 음식은 단순한 소재를 넘어 문화적 기억과 공동체적 유대를 환기하는 핵심적 매개체로 기능한다. 「국수」에서 국수를 나누어 먹는 행위는 잔칫날의 풍경을 통해 전통적 공동체의 정서적 유대를 상징적으로 재현하며, 「흰 바람벽이 있어」에서 겨울밤에 떡을 굽고 콩을 볶는 장면은 가족 공동체의 따뜻한 친밀감을 촉각적이고 후각적인 감각으로 환기한다. 백석이 그리는 음식의 세계는 근대화와 식민지화로 인해 해체되어 가는 전통적 생활 공동체에 대한 향수와 애도의 정서를 담고 있다. 이는 단순한 복고적 감상이 아니라, 근대성이 파괴한 것에 대한 비판적 성찰을 내포하며, 음식이라는 구체적이고 감각적인 매개를 통해 추상적 관념이 아닌 체험적 진실에 도달하려는 시적 전략이기도 하다."
    },
    {
      id: "p4",
      text: "백석의 문학적 유산은 분단으로 인해 오랫동안 남한 문학사에서 제대로 평가받지 못하였으나, 1980년대 해금 이후 그의 시는 비로소 온전한 조명을 받게 되었다. 백석의 시가 재발견된 이후 한국 문학 연구에서는 그의 토속적 언어 사용과 서사적 시 구성이 한국 현대시의 독자적 미학을 형성하는 데 기여한 바에 대한 재평가가 활발히 이루어졌다. 특히 백석이 보여 준 방언과 고유어의 시적 활용은, 표준어 중심의 근대 문학어가 소거한 언어적 다양성과 감각적 풍부함을 복원하는 시도로서 문학사적 의의를 지닌다. 이러한 백석의 시적 방법론은 이후 서정주의 토착어 활용, 신경림의 농촌 서사시 등에서 변용되어 한국 현대시의 중요한 한 흐름을 형성하였으며, 오늘날에도 한국어의 감각적 잠재력을 탐구하는 시적 실험의 원천으로 참조되고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "백석이 평안도 방언과 고유어를 시에 사용한 의도는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "근대화 과정에서 소멸해 가는 토착적 삶의 양식을 문학적으로 보존하려는 의식적 기획이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「여승」의 역순행적 서술이 달성하는 문학적 효과는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "독자에게 추리적 긴장감을 부여하는 동시에, 운명의 불가역성에 대한 비극적 인식을 효과적으로 전달한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "백석이 서사와 서정을 결합함으로써 한국 시단에 기여한 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "한국 현대시의 장르적 외연을 확장하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "백석 시에서 음식이 담고 있는 정서적 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "근대화와 식민지화로 인해 해체되어 가는 전통적 생활 공동체에 대한 향수와 애도의 정서를 담고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "백석의 시가 남한에서 오랫동안 제대로 평가받지 못한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "분단으로 인해 오랫동안 남한 문학사에서 제대로 평가받지 못하였으나")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "백석의 방언과 고유어 활용이 지니는 문학사적 의의는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "표준어 중심의 근대 문학어가 소거한 언어적 다양성과 감각적 풍부함을 복원하는 시도로서 문학사적 의의를 지닌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(64, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 65: 비문학 (NONFICTION) ───
function buildDay65() {
  const paragraphs = [
    {
      id: "p1",
      text: "열역학 제2법칙은 자연계에서 에너지 변환의 방향성과 한계를 규정하는 근본적인 물리 법칙이다. 이 법칙은 여러 동치적 진술로 표현되는데, 클라우지우스의 진술에 따르면 열은 저온의 물체에서 고온의 물체로 자발적으로 이동하지 않는다. 켈빈-플랑크의 진술에 따르면 하나의 열원에서 열을 흡수하여 이를 모두 일로 변환하는 열기관은 존재하지 않는다. 이 두 진술은 표현은 다르지만 논리적으로 동치이며, 모든 자연 과정에는 에너지 변환의 비가역적 방향이 존재한다는 공통된 핵심을 담고 있다. 열역학 제1법칙이 에너지의 양적 보존을 말하는 데 반해, 제2법칙은 에너지의 질적 변환에 관한 제약을 규정한다. 즉 에너지는 보존되더라도 그 사용 가능한 형태는 점차 감소하며, 이 과정은 자발적으로 역행하지 않는다."
    },
    {
      id: "p2",
      text: "열역학 제2법칙을 정량적으로 표현하기 위해 도입된 개념이 엔트로피이다. 클라우지우스가 정의한 엔트로피는 가역 과정에서 열량을 온도로 나눈 값으로, 고립계에서 자연적 과정이 진행되면 엔트로피는 항상 증가하거나 유지된다. 볼츠만은 이 거시적 개념에 미시적 해석을 부여하여, 엔트로피를 계의 미시 상태 수의 함수로 정의하였다. 이에 따르면 엔트로피가 큰 상태란 그 거시 상태를 실현할 수 있는 미시적 배열의 수가 더 많은 상태를 의미한다. 예컨대 기체 분자가 용기의 한쪽에만 모여 있는 상태는 미시적 배열 수가 적으므로 엔트로피가 낮고, 기체가 용기 전체에 고르게 퍼진 상태는 배열 수가 압도적으로 많으므로 엔트로피가 높다. 따라서 기체가 자발적으로 한쪽에 모이는 현상은 통계적으로 거의 불가능하며, 이것이 비가역성의 통계역학적 근거이다."
    },
    {
      id: "p3",
      text: "엔트로피 개념은 물리학을 넘어 정보 이론, 생물학, 경제학 등 다양한 분야로 확장되었다. 클로드 섀넌은 정보 이론에서 엔트로피 개념을 차용하여 정보의 불확실성을 측정하는 도구로 활용하였는데, 섀넌 엔트로피는 메시지의 예측 불가능성이 높을수록 정보량이 크다는 직관을 수학적으로 정식화한 것이다. 생물학에서는 생명 현상이 국소적으로 엔트로피를 감소시키는 과정으로 이해되는데, 이는 열역학 제2법칙에 위배되는 것이 아니라 외부 환경의 엔트로피를 더 크게 증가시킴으로써 전체 엔트로피는 증가한다는 원리에 부합한다. 슈뢰딩거는 생명체가 환경으로부터 음의 엔트로피, 즉 네겐트로피를 섭취하여 내부의 질서를 유지한다고 설명하였으며, 이 관점은 이후 비평형 열역학과 자기 조직화 이론의 발전에 중요한 영감을 제공하였다."
    },
    {
      id: "p4",
      text: "열역학 제2법칙은 시간의 방향성이라는 근본적인 철학적 문제와도 연결된다. 뉴턴 역학이나 양자역학의 기본 방정식은 시간에 대해 대칭적이어서 과거와 미래를 구분하지 않지만, 열역학 제2법칙은 엔트로피 증가의 방향을 규정함으로써 시간의 비대칭성을 설명하는 유일한 물리 법칙으로 간주된다. 이를 열역학적 시간의 화살이라 부르며, 아서 에딩턴은 엔트로피 증가를 시간의 흐름과 동일시하였다. 그러나 미시적 차원에서 시간이 가역적인데 어떻게 거시적 비가역성이 출현하는가 하는 문제는 여전히 물리학과 철학의 핵심 논쟁 중 하나이다. 볼츠만은 비가역성이 미시적 법칙의 필연적 귀결이 아니라 초기 조건의 특수성과 통계적 경향에서 비롯된다고 보았으며, 이 설명은 우주의 초기 상태가 왜 극도로 낮은 엔트로피를 가졌는지에 대한 새로운 물음으로 이어진다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "열역학 제1법칙과 제2법칙이 다루는 에너지의 측면은 각각 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "열역학 제1법칙이 에너지의 양적 보존을 말하는 데 반해, 제2법칙은 에너지의 질적 변환에 관한 제약을 규정한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "볼츠만의 엔트로피 해석에서 엔트로피가 큰 상태의 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "그 거시 상태를 실현할 수 있는 미시적 배열의 수가 더 많은 상태를 의미한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "기체가 자발적으로 한쪽에 모이지 않는 통계역학적 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "기체가 자발적으로 한쪽에 모이는 현상은 통계적으로 거의 불가능하며, 이것이 비가역성의 통계역학적 근거이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "생명체의 엔트로피 감소가 열역학 제2법칙에 위배되지 않는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "외부 환경의 엔트로피를 더 크게 증가시킴으로써 전체 엔트로피는 증가한다는 원리에 부합한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "열역학 제2법칙이 시간의 비대칭성을 설명하는 유일한 물리 법칙으로 간주되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "엔트로피 증가의 방향을 규정함으로써 시간의 비대칭성을 설명하는 유일한 물리 법칙으로 간주된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "볼츠만이 거시적 비가역성의 근원으로 제시한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "비가역성이 미시적 법칙의 필연적 귀결이 아니라 초기 조건의 특수성과 통계적 경향에서 비롯된다고 보았으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(65, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── 메인 실행 ───
function main() {
  console.log("=== 비트겐슈타인3 Day 61~65 빌드 시작 ===\n");

  const contents = [
    buildDay61(),
    buildDay62(),
    buildDay63(),
    buildDay64(),
    buildDay65()
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

  // static 디렉토리 확인
  if (!fs.existsSync(STATIC_DIR)) {
    fs.mkdirSync(STATIC_DIR, { recursive: true });
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

  const dayIndices = [61, 62, 63, 64, 65];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1;
    const subArea = contents[i].subArea;
    const batchItem = wrapBatchItem(contents[i], dayIdx, subArea);

    // 배치 배열 크기 확장 필요 시
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
  console.log(`배치 파일 저장 완료 (총 ${batchData.items.length} items)`);

  console.log("\n=== 빌드 완료 ===");
}

main();
