#!/usr/bin/env node
// 비트겐슈타인3 Day 71~75 일일독해 콘텐츠 빌더
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

// ─── Day 71: 비문학 (NONFICTION) ───
function buildDay71() {
  const paragraphs = [
    {
      id: "p1",
      text: "인지언어학은 언어를 인간의 일반적 인지 능력의 산물로 파악하는 언어학적 접근법이다. 촘스키의 생성 문법이 언어 능력을 다른 인지 능력과 독립된 자율적 모듈로 간주한 것과 달리, 인지언어학에서는 언어가 지각, 기억, 범주화, 추론 등 일반적 인지 과정에 기반하여 작동한다고 본다. 이 관점에 따르면, 문법 구조는 인간이 세계를 경험하고 개념화하는 방식을 반영하며, 선천적으로 주어진 보편 규칙이 아니다. 인지언어학의 기본 전제는 1980년대 레이코프와 래네커의 연구를 통해 체계화되었다. 레이코프는 개념적 은유 이론을 통해 추상적 사고가 신체 경험에 기반한 은유적 투사의 산물임을 논증하였고, 래네커는 인지 문법이라는 틀을 통해 문법 범주가 의미론적 토대 위에 성립함을 보여 주었다."
    },
    {
      id: "p2",
      text: "인지언어학에서 특히 주목되는 개념은 체화된 인지이다. 이는 인간의 사고와 언어가 신체적 경험에 뿌리를 두고 있다는 관점으로, 데카르트 이래의 심신 이원론을 비판한다. 체화된 인지 관점에서 보면, 우리가 사용하는 추상적 개념들은 신체 경험의 은유적 확장으로 이해된다. 예컨대 한국어에서 시간을 공간적 용어로 표현하는 것은 보편적 현상인데, 앞으로 다가올 미래나 지나간 과거라는 표현에서 시간은 공간적 이동의 은유를 통해 개념화된다. 이러한 은유적 사고는 단순한 수사적 기교가 아니라 인간의 근본적 인지 작용이며, 신체가 세계와 상호작용하는 방식에서 비롯된 것이다. 레이코프와 존슨은 이를 기초 은유라 명명하였으며, 위가 좋음이고 아래가 나쁨이라는 방향 은유 등이 대표적 사례이다."
    },
    {
      id: "p3",
      text: "인지언어학의 또 다른 핵심 개념인 프레임 의미론은 단어의 의미가 연관된 백과사전적 지식의 틀 속에서 파악되어야 한다고 주장한다. 찰스 필모어가 제안한 이 이론에 따르면, 사다라는 단어를 이해하려면 상업 거래라는 프레임이 활성화되어야 하며, 이 프레임에는 판매자, 구매자, 상품, 대금 등이 포함된다. 프레임은 특정 단어가 환기하는 개념적 배경 구조로서, 동일한 사건을 어떤 프레임으로 파악하느냐에 따라 상이한 언어적 표현이 선택된다. 예를 들어 동일한 경제 상황을 경기 침체라고 하느냐 경제 조정이라고 하느냐는 서로 다른 프레임을 활성화시키며, 청자의 해석과 반응도 달라진다. 프레임 의미론은 언어가 객관적 현실을 중립적으로 반영하는 것이 아니라, 특정한 관점에서 현실을 구성하는 도구임을 보여 준다는 점에서 정치 담론 분석이나 미디어 연구에도 적용되고 있다."
    },
    {
      id: "p4",
      text: "인지언어학은 언어 교육과 번역학에도 실질적으로 기여하고 있다. 전통적 외국어 교육에서 문법은 형식적 규칙의 암기로 다루어졌으나, 인지언어학적 관점에서는 문법 형식이 특정 의미 기능을 수행하므로, 학습자가 문법의 의미론적 동기를 파악하면 보다 효과적 습득이 가능하다. 또한 번역 과정에서 원어와 목표어 사이의 의미 차이는 단순한 어휘적 불일치가 아니라 두 언어 공동체의 개념화 방식의 차이에서 비롯되는 것이므로, 인지언어학적 분석은 번역의 질적 향상에 기여할 수 있다. 그러나 인지언어학에 대해서는 경험적 검증의 어려움이라는 비판도 제기된다. 체화된 인지나 개념적 은유의 존재를 주장하는 것과 이를 신경과학적으로 입증하는 것 사이에는 상당한 간극이 존재하며, 이 간극을 어떻게 메울 것인지가 인지언어학이 당면한 핵심 과제 중 하나이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "인지언어학이 생성 문법과 구별되는 핵심 전제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "언어가 지각, 기억, 범주화, 추론 등 일반적 인지 과정에 기반하여 작동한다고 본다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "체화된 인지 관점에서 추상적 개념이 형성되는 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "우리가 사용하는 추상적 개념들은 신체 경험의 은유적 확장으로 이해된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "레이코프와 존슨이 제시한 기초 은유의 특성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "단순한 수사적 기교가 아니라 인간의 근본적 인지 작용이며, 신체가 세계와 상호작용하는 방식에서 비롯된 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "프레임 의미론이 언어의 본질에 대해 시사하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "언어가 객관적 현실을 중립적으로 반영하는 것이 아니라, 특정한 관점에서 현실을 구성하는 도구임을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "인지언어학적 관점에서 번역의 의미 차이가 발생하는 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "두 언어 공동체의 개념화 방식의 차이에서 비롯되는 것이므로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "인지언어학에 제기되는 핵심적 비판은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "체화된 인지나 개념적 은유의 존재를 주장하는 것과 이를 신경과학적으로 입증하는 것 사이에는 상당한 간극이 존재하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(71, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 72: 문학 (LITERATURE) ───
function buildDay72() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 고전 소설에서 몽유록은 꿈을 서사적 틀로 활용하여 현실 비판과 이상 세계에 대한 지향을 동시에 표현하는 독특한 양식이다. 몽유록의 기본 구조는 현실에서 잠에 드는 입몽, 꿈속에서 특정한 인물이나 사건을 체험하는 몽중, 꿈에서 깨어나 현실로 복귀하는 각몽의 삼단 구성을 따른다. 이러한 구조는 표면적으로는 꿈이라는 허구적 장치를 통해 현실의 검열로부터 자유로운 발언 공간을 확보하면서, 내면적으로는 현실과 이상 사이의 괴리를 성찰하게 하는 이중적 기능을 수행한다. 몽유록의 원류는 중국 당대의 전기 소설에서 찾을 수 있으나, 조선 시대에 이르러 역사적 인물의 재평가와 당대 정치 현실에 대한 우회적 비판이라는 고유한 기능을 획득하면서 독자적인 문학 양식으로 발전하였다."
    },
    {
      id: "p2",
      text: "조선 전기의 대표적 몽유록인 김시습의 「남염부주지」는 몽유록 양식의 문학적 가능성을 탁월하게 보여 주는 작품이다. 이 작품에서 주인공 박생은 꿈속에서 저승의 염라대왕을 만나 인간 세상의 도리와 치국의 방도에 대해 논변을 벌인다. 김시습은 꿈이라는 장치를 통해 세조의 왕위 찬탈로 인한 정치적 혼란과 도덕적 타락을 우회적으로 비판하면서, 유교적 이상 정치의 원리를 역설하였다. 이 작품의 서사적 특징은 인물 간의 대화와 논변이 서사의 중심을 이루고 있다는 점이다. 박생과 염라대왕의 문답은 단순한 정보 전달이 아니라, 현실 정치에 대한 비판적 성찰을 담은 지적 대결의 성격을 지닌다. 이러한 논변 중심의 서사 구조는 몽유록이 단순한 환상 문학이 아니라 사상적 깊이를 지닌 철학적 서사임을 보여 주는 것이다."
    },
    {
      id: "p3",
      text: "조선 후기에 이르면 몽유록은 임병양란이라는 역사적 참화를 배경으로 새로운 양상을 보인다. 임제의 「원생몽유록」과 같은 작품에서는 전쟁에서 희생된 역사적 인물들이 꿈속에 등장하여 자신의 억울함을 호소하거나 전쟁의 참상을 증언한다. 이러한 유형의 몽유록에서 꿈은 죽은 자와 산 자가 소통하는 매개 공간으로 기능하며, 현실에서는 불가능한 역사적 인물의 재평가가 꿈의 공간에서 이루어진다. 특히 전쟁 몽유록에서 주목할 점은 역사적 사건에 대한 기억과 추모의 서사가 개인의 꿈이라는 사적 경험을 통해 매개된다는 것이다. 이는 공적 역사가 담지 못하는 개인적 감정과 도덕적 판단을 문학적으로 복원하려는 시도로, 오늘날의 증언 문학이나 기억 서사와 유사한 문학적 기능을 수행한다고 볼 수 있다."
    },
    {
      id: "p4",
      text: "몽유록의 문학사적 의의는 꿈이라는 서사 장치가 가진 다층적 기능에서 찾을 수 있다. 첫째, 꿈은 현실의 억압적 질서로부터 자유로운 발언의 공간을 제공함으로써, 직접적으로 표현하기 어려운 정치적 비판을 가능하게 하였다. 둘째, 꿈의 세계는 시공간의 제약을 초월하므로, 과거의 인물과 현재의 인물이 만나 대화할 수 있는 서사적 가능성을 열어 주었다. 셋째, 꿈에서 깨어난 후의 각성은 현실에 대한 새로운 인식을 촉발하는 계기로 작용하여, 독자에게도 현실을 다시 바라보게 하는 성찰적 효과를 발휘하였다. 이러한 몽유록의 전통은 현대 한국 문학에서도 다양한 방식으로 계승되고 있으며, 최인훈의 「광장」이나 이문열의 「금시조」 등에서 꿈과 환상의 서사 장치가 활용되는 것은 바로 몽유록 전통의 현대적 변용으로 이해될 수 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "몽유록의 삼단 구성이 수행하는 이중적 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "현실의 검열로부터 자유로운 발언 공간을 확보하면서, 내면적으로는 현실과 이상 사이의 괴리를 성찰하게 하는 이중적 기능을 수행한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "김시습의 「남염부주지」에서 꿈이라는 장치가 수행하는 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "세조의 왕위 찬탈로 인한 정치적 혼란과 도덕적 타락을 우회적으로 비판하면서, 유교적 이상 정치의 원리를 역설하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「남염부주지」의 논변 중심 서사 구조가 보여 주는 몽유록의 성격은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "몽유록이 단순한 환상 문학이 아니라 사상적 깊이를 지닌 철학적 서사임을 보여 주는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "전쟁 몽유록에서 꿈이 수행하는 서사적 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "죽은 자와 산 자가 소통하는 매개 공간으로 기능하며, 현실에서는 불가능한 역사적 인물의 재평가가 꿈의 공간에서 이루어진다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "전쟁 몽유록이 오늘날의 증언 문학과 유사한 기능을 수행하는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "공적 역사가 담지 못하는 개인적 감정과 도덕적 판단을 문학적으로 복원하려는 시도로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "몽유록에서 각몽이 독자에게 발휘하는 효과는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "독자에게도 현실을 다시 바라보게 하는 성찰적 효과를 발휘하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(72, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 73: 비문학 (NONFICTION) ───
function buildDay73() {
  const paragraphs = [
    {
      id: "p1",
      text: "행동경제학은 전통 경제학의 합리적 인간 모형에 도전하면서, 인간의 실제 의사 결정에서 나타나는 체계적 편향과 비합리성을 연구하는 학문이다. 전통 경제학에서 상정하는 호모 에코노미쿠스는 완전한 정보를 바탕으로 효용을 극대화하는 합리적 존재이나, 현실의 인간은 제한된 인지 능력과 감정적 요인의 영향 아래에서 판단을 내린다. 허버트 사이먼은 이를 제한된 합리성이라 개념화하였으며, 이후 카너먼과 트버스키의 연구를 통해 인간의 판단에서 반복 관찰되는 인지적 편향이 체계적으로 규명되었다. 카너먼은 인간의 사고 체계를 빠르고 직관적인 시스템 1과 느리고 분석적인 시스템 2로 구분하였으며, 일상적 판단의 대부분이 시스템 1에 의해 수행되기 때문에 다양한 인지적 편향이 불가피하게 발생한다고 설명하였다."
    },
    {
      id: "p2",
      text: "행동경제학에서 밝혀진 대표적 인지 편향 중 하나는 손실 회피 현상이다. 카너먼과 트버스키가 제안한 전망 이론에 따르면, 동일한 크기의 이득과 손실이 주어졌을 때 손실에서 느끼는 심리적 고통이 이득에서 느끼는 만족감보다 약 두 배 크다. 이러한 비대칭적 가치 평가는 전통 경제학의 기대 효용 이론으로는 설명할 수 없는 현상이다. 손실 회피는 다양한 경제적 행동에 영향을 미치는데, 투자자들이 손실이 난 주식을 매도하지 못하고 보유하는 현상이나, 소비자들이 이미 지불한 비용에 집착하여 비합리적 결정을 내리는 매몰 비용의 오류가 대표적 사례이다. 또한 전망 이론은 사람들이 이익의 영역에서는 위험 회피적이고 손실의 영역에서는 위험 추구적이라는 비대칭적 위험 태도를 설명하는데, 이는 보험 구매와 도박 행위가 동일한 개인에게서 동시에 나타날 수 있는 이유를 설명해 준다."
    },
    {
      id: "p3",
      text: "행동경제학의 실천적 적용에서 가장 주목받는 개념은 리처드 탈러와 캐스 선스타인이 제안한 넛지이다. 넛지는 선택의 자유를 제한하지 않으면서도 사람들이 더 나은 결정을 내리도록 선택 환경을 설계하는 전략을 의미한다. 기본 옵션의 설정은 넛지의 대표적 사례로, 퇴직 연금 가입을 기본 옵션으로 설정하면 명시적으로 탈퇴하지 않는 한 자동으로 가입되므로 가입률이 크게 상승한다. 이는 인간의 현상 유지 편향, 즉 기존 상태를 변경하는 데 드는 심리적 비용이 크기 때문에 주어진 기본 옵션을 그대로 수용하는 경향을 활용한 것이다. 넛지는 공공 정책 분야에서 건강 증진, 환경 보호, 저축 장려 등 다양한 영역에 적용되고 있으며, 영국과 미국 등 여러 국가에서 행동 통찰 팀을 설립하여 정책 설계에 행동경제학적 원리를 반영하고 있다."
    },
    {
      id: "p4",
      text: "그러나 행동경제학과 넛지에 대해서는 여러 비판이 제기된다. 첫째, 넛지가 개인의 자율적 의사 결정 능력을 과소평가하고 온정주의적 개입으로 흐를 수 있다는 우려가 있다. 탈러와 선스타인은 이를 자유주의적 온정주의라 칭하며 선택의 자유가 보장된다고 주장하지만, 기본 옵션의 설정 자체가 특정 방향으로의 유도를 내포하고 있다는 점에서 완전한 자유와는 거리가 있다. 둘째, 행동경제학적 편향이 문화와 맥락에 따라 다르게 나타날 수 있다는 점에서 연구 결과의 보편성에 대한 의문이 제기된다. 서구 사회에서 발견된 인지 편향이 다른 문화적 배경에서도 동일하게 작동하는지에 대해서는 추가적인 검증이 필요하다. 이러한 비판에도 불구하고 행동경제학은 인간 행동에 대한 현실적 이해를 제공함으로써 경제학과 공공 정책의 실효성을 높이고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "카너먼이 구분한 시스템 1의 특성과 이것이 인지 편향에 미치는 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "일상적 판단의 대부분이 시스템 1에 의해 수행되기 때문에 다양한 인지적 편향이 불가피하게 발생한다고 설명하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "전망 이론에서 밝혀진 이득과 손실에 대한 심리적 반응의 비대칭성은 어떠한가?",
      answerRanges: [findRange(paragraphs, "p2", "손실에서 느끼는 심리적 고통이 이득에서 느끼는 만족감보다 약 두 배 크다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "전망 이론이 보험 구매와 도박 행위의 공존을 설명하는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "사람들이 이익의 영역에서는 위험 회피적이고 손실의 영역에서는 위험 추구적이라는 비대칭적 위험 태도를 설명하는데")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "넛지의 대표적 사례인 기본 옵션 설정이 활용하는 인지적 편향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "인간의 현상 유지 편향, 즉 기존 상태를 변경하는 데 드는 심리적 비용이 크기 때문에 주어진 기본 옵션을 그대로 수용하는 경향을 활용한 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "넛지에 대해 제기되는 온정주의적 개입 우려의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "기본 옵션의 설정 자체가 특정 방향으로의 유도를 내포하고 있다는 점에서 완전한 자유와는 거리가 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "행동경제학 연구 결과의 보편성에 대한 의문이 제기되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "서구 사회에서 발견된 인지 편향이 다른 문화적 배경에서도 동일하게 작동하는지에 대해서는 추가적인 검증이 필요하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(73, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 74: 문학 (LITERATURE) ───
function buildDay74() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대시에서 서정주는 생명의 근원적 에너지와 전통적 미의식을 결합하여 독자적 시 세계를 구축한 시인으로 평가된다. 그의 초기 시집 「화사집」에 수록된 작품들은 원초적 생명력과 관능적 감각이 강렬하게 표출되어 있다. 대표작 「자화상」에서 시인은 스무세 해 동안의 간난한 삶의 궤적을 술회하면서, 개인의 존재를 운명적으로 수용하는 자세를 보여 준다. 서정주의 초기 시는 니체적 생명 철학의 영향 아래에서 본능과 육체의 언어를 시의 전면에 내세웠으며, 이는 당시 한국 시단이 관념적 서정에 치우쳐 있던 상황에 대한 하나의 문학적 돌파구였다. 그러나 원초적 생명력의 추구는 단순한 본능의 찬미에 머무르지 않고, 존재의 고통과 구원에 대한 근본적 물음을 내포하였으며, 이는 이후 시적 전환의 씨앗이 되었다."
    },
    {
      id: "p2",
      text: "서정주의 시적 전환은 중기 이후 한국의 전통적 미의식과 불교적 세계관을 본격적으로 수용하면서 이루어졌다. 「귀촉도」에서 시인은 눈물 아롱아롱 피리 불고 가신 님의 밤길이라는 구절을 통해, 이별의 정한을 한국적 정서의 전형인 한으로 승화시키고 있다. 서정주는 신라의 설화와 불교 사상에서 시적 소재와 세계관을 길어 올리면서, 전통과 현대의 접합을 시도하였다. 그의 연작시 「신라초」는 신라의 화랑 정신과 불교적 자비의 이념을 현대적 시어로 재구성한 것으로, 한국 고유의 정신적 전통 속에서 보편적 인간 가치를 발견하려는 시도였다. 이 시기 서정주의 시는 격렬한 생명의 분출에서 벗어나 원숙한 관조와 수용의 태도로 전환되었으며, 언어 또한 구어적 직접성에서 고전적 아름다움과 음악성을 갖춘 세련된 시어로 변모하였다."
    },
    {
      id: "p3",
      text: "서정주 시의 미학적 특질 가운데 가장 주목할 만한 것은 영원성에 대한 지향이다. 그의 시에서 개별적 존재의 유한성은 자연의 순환적 질서와 불교적 윤회 사상을 통해 영원성의 차원으로 확장된다. 「동천」에서 시인은 겨울의 밤하늘에 빛나는 별들을 바라보며, 유한한 생의 너머에 존재하는 영원의 세계를 감지한다. 이러한 영원성의 추구는 시인 개인의 형이상학적 관심에서 비롯된 것이기도 하지만, 동시에 한국 전통 사상에서 반복적으로 나타나는 자연 합일의 이념과 맞닿아 있다. 서정주에게 시를 쓴다는 것은 유한한 존재가 영원의 세계와 접촉하는 행위이며, 시의 언어는 그 접촉의 순간을 포착하고 보존하는 그릇이었다. 이러한 시관은 릴케의 예술관과 유사한 측면을 보이면서도, 한국의 자연관과 불교적 세계관이라는 독자적 토대 위에 서 있다는 점에서 차별화된다."
    },
    {
      id: "p4",
      text: "서정주의 문학적 유산에 대한 평가는 양면적이다. 미학적 측면에서 그는 한국어의 음악적 가능성을 극대화하고 전통적 정서와 현대적 감수성을 조화시킨 시인으로 인정받는다. 그의 시어는 한국어 고유의 리듬과 울림을 살려 시의 음악성을 높였으며, 한국적 서정의 가장 세련된 형태를 구현하였다는 평가를 받는다. 그러나 정치적 측면에서 서정주는 일제 강점기의 친일 행적과 권위주의 정권에 대한 찬양시로 인해 심각한 도덕적 비판에 직면하여 왔다. 시인의 미학적 성취와 정치적 행적 사이의 괴리는 예술과 윤리의 관계에 대한 근본적 질문을 제기하며, 이는 서정주 개인의 문제를 넘어 식민지와 분단을 경험한 한국 지식인 사회 전체의 역사적 과제이다. 서정주의 시를 어떻게 읽을 것인가라는 물음은 한국 문학이 자신의 역사적 상처를 어떻게 다루어야 하는가라는 보다 넓은 질문과 연결되어 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "서정주의 초기 시가 한국 시단에서 갖는 문학적 의의는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "당시 한국 시단이 관념적 서정에 치우쳐 있던 상황에 대한 하나의 문학적 돌파구였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "서정주의 중기 시에서 나타나는 태도와 언어의 변화는 어떠한가?",
      answerRanges: [findRange(paragraphs, "p2", "격렬한 생명의 분출에서 벗어나 원숙한 관조와 수용의 태도로 전환되었으며, 언어 또한 구어적 직접성에서 고전적 아름다움과 음악성을 갖춘 세련된 시어로 변모하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "서정주 시에서 개별 존재의 유한성이 영원성으로 확장되는 경로는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "자연의 순환적 질서와 불교적 윤회 사상을 통해 영원성의 차원으로 확장된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "서정주에게 시를 쓴다는 것은 어떤 행위인가?",
      answerRanges: [findRange(paragraphs, "p3", "유한한 존재가 영원의 세계와 접촉하는 행위이며, 시의 언어는 그 접촉의 순간을 포착하고 보존하는 그릇이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "서정주의 시어가 미학적으로 평가받는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "한국어 고유의 리듬과 울림을 살려 시의 음악성을 높였으며, 한국적 서정의 가장 세련된 형태를 구현하였다는 평가를 받는다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "서정주의 시를 어떻게 읽을 것인가라는 물음이 연결되는 보다 넓은 질문은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "한국 문학이 자신의 역사적 상처를 어떻게 다루어야 하는가라는 보다 넓은 질문과 연결되어 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(74, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 75: 비문학 (NONFICTION) ───
function buildDay75() {
  const paragraphs = [
    {
      id: "p1",
      text: "도시 열섬 효과는 도시 지역의 기온이 주변 농촌 지역보다 현저히 높게 나타나는 현상으로, 급속한 도시화가 진행된 현대 사회에서 중요한 환경 문제로 부각되고 있다. 이 현상의 주된 원인은 도시의 지표면 특성 변화에 있다. 자연 상태의 토양과 식생은 태양 복사 에너지의 상당 부분을 증발산을 통해 대기 중으로 방출하여 냉각 효과를 발휘하지만, 도시에서는 아스팔트와 콘크리트 등 인공 피복재가 지배적이다. 이러한 인공 피복재는 태양 에너지를 효율적으로 흡수하고 저장한 후 야간에 장파 복사의 형태로 서서히 방출함으로써 도시의 야간 기온을 상승시킨다. 특히 도시의 협곡 구조, 즉 고층 건물 사이의 좁은 가로 공간은 태양 복사를 다중 반사시켜 에너지 흡수율을 높이는 동시에, 장파 복사의 대기 중 방출을 차단하는 효과를 발생시켜 열섬 효과를 증폭시킨다."
    },
    {
      id: "p2",
      text: "도시 열섬 효과의 또 다른 주요 원인은 인공열의 방출이다. 도시에서는 건물의 냉난방 시스템, 교통 수단의 연료 연소, 산업 시설의 가동 등에서 대량의 열에너지가 배출된다. 이러한 인공열은 도시의 에너지 소비량에 비례하여 증가하며, 인구 밀도가 높은 대도시일수록 그 영향이 현저하게 나타난다. 연구에 따르면, 겨울철 고밀도 도시 중심부에서 인공열이 순복사 에너지의 절반 이상에 달하는 사례가 보고되기도 한다. 또한 도시 지역에서의 녹지 감소는 증발산에 의한 자연적 냉각 기제를 약화시킴으로써 열섬 효과를 가중시킨다. 식생은 증산 작용을 통해 잠열의 형태로 에너지를 소비하며, 그늘을 제공하여 지표면의 직접적 가열을 줄이는 역할을 수행한다. 따라서 도시의 녹지 비율이 낮아질수록 이러한 자연적 냉각 기능이 상실되어 열섬 현상이 심화되는 것이다."
    },
    {
      id: "p3",
      text: "도시 열섬 효과는 단순히 기온 상승에 그치지 않고, 도시 주민의 건강과 환경에 다방면의 부정적 영향을 미친다. 폭염 기간 동안 열섬 효과가 심한 도시 지역에서는 열사병, 열탈진 등 온열 질환의 발생률이 급증하며, 특히 고령자와 만성 질환자 등 취약 계층에 대한 건강 위협이 증대된다. 또한 고온 환경은 대기 중 질소산화물과 휘발성 유기 화합물의 광화학 반응을 촉진하여 지표면 오존 농도를 높이는데, 이는 호흡기 질환을 악화시키는 주요 요인으로 작용한다. 에너지 소비 측면에서도 열섬 효과는 냉방 에너지 수요를 증가시켜 전력 소비량의 상승과 이에 따른 온실 가스 배출량의 증가를 야기함으로써, 기후 변화를 가속화하는 악순환 구조를 형성한다. 이러한 복합적 영향은 도시 열섬 문제가 기상학적 현상을 넘어 공중 보건과 에너지 정책의 핵심 과제임을 보여 준다."
    },
    {
      id: "p4",
      text: "도시 열섬 효과를 완화하기 위한 전략은 도시 녹화, 고반사 재료 적용, 도시 설계 개선으로 구분된다. 도시 녹화는 옥상 녹화, 벽면 녹화, 가로수 식재 등을 통해 증발산과 차양 효과를 복원하는 방법으로, 국지적 기온을 수 도 낮출 수 있다. 고반사 재료인 쿨루프와 쿨페이브먼트는 태양 복사의 반사율을 높여 지표면의 열 흡수를 감소시키는 기술이다. 도시 설계 차원에서는 바람길의 확보가 중요한데, 건물 배치와 가로 폭을 조절하여 도시 내부의 공기 순환을 촉진함으로써 축적된 열을 배출할 수 있다. 이러한 전략들은 개별적으로 적용되기보다 도시 계획의 틀 안에서 통합적으로 추진될 때 최대의 효과를 발휘하며, 이를 위해서는 기상학, 건축학, 조경학, 공중 보건학 등 다학제적 협력이 필수적이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "도시의 인공 피복재가 야간 기온을 상승시키는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "태양 에너지를 효율적으로 흡수하고 저장한 후 야간에 장파 복사의 형태로 서서히 방출함으로써 도시의 야간 기온을 상승시킨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "도시의 협곡 구조가 열섬 효과를 증폭시키는 메커니즘은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "태양 복사를 다중 반사시켜 에너지 흡수율을 높이는 동시에, 장파 복사의 대기 중 방출을 차단하는 효과를 발생시켜 열섬 효과를 증폭시킨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "식생이 도시 냉각에 기여하는 구체적 기제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "증산 작용을 통해 잠열의 형태로 에너지를 소비하며, 그늘을 제공하여 지표면의 직접적 가열을 줄이는 역할을 수행한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "열섬 효과가 대기 오염에 미치는 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "대기 중 질소산화물과 휘발성 유기 화합물의 광화학 반응을 촉진하여 지표면 오존 농도를 높이는데")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "열섬 효과가 기후 변화와 관련하여 형성하는 악순환 구조는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "냉방 에너지 수요를 증가시켜 전력 소비량의 상승과 이에 따른 온실 가스 배출량의 증가를 야기함으로써, 기후 변화를 가속화하는 악순환 구조를 형성한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "열섬 완화 전략이 최대 효과를 발휘하기 위한 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "도시 계획의 틀 안에서 통합적으로 추진될 때 최대의 효과를 발휘하며, 이를 위해서는 기상학, 건축학, 조경학, 공중 보건학 등 다학제적 협력이 필수적이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(75, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── 메인 실행 ───
function main() {
  console.log("=== 비트겐슈타인3 Day 71~75 빌드 시작 ===\n");

  const contents = [
    buildDay71(),
    buildDay72(),
    buildDay73(),
    buildDay74(),
    buildDay75()
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
  if (!fs.existsSync(STATIC_DIR)) {
    fs.mkdirSync(STATIC_DIR, { recursive: true });
  }

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

  const dayIndices = [71, 72, 73, 74, 75];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1;
    const subArea = contents[i].subArea;
    const batchItem = wrapBatchItem(contents[i], dayIdx, subArea);

    if (batchData.items[batchIdx]) {
      console.log(`교체: items[${batchIdx}] (${batchData.items[batchIdx].content.contentId} -> ${contents[i].contentId})`);
    }
    batchData.items[batchIdx] = batchItem;
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료`);

  console.log("\n=== 빌드 완료 ===");
}

main();
