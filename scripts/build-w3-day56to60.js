#!/usr/bin/env node
// 비트겐슈타인3 Day 56~60 일일독해 콘텐츠 빌더
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

// ─── Day 56: 문학 (LITERATURE) ───
function buildDay56() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대 소설에서 박완서는 전쟁의 기억과 중산층 일상의 이면을 동시에 탐구한 작가로 독보적인 위치를 점한다. 그의 문학적 출발점이 된 한국전쟁의 경험은 오빠의 죽음이라는 개인적 비극을 통해 형상화되었으며, 이는 단순한 전쟁 체험의 기록이 아니라 전쟁이 한 가족의 삶을 어떻게 해체하고 변형시키는지를 미시적으로 추적하는 서사로 발전하였다. 데뷔작 「나목」은 전쟁 직후의 서울을 배경으로, 생존의 절박함 속에서도 예술적 감수성을 놓지 않으려는 젊은 여성의 내면을 섬세하게 그려내었다. 이 작품에서 미군 부대의 초상화 그리기라는 소재는 전후 한국 사회의 경제적 종속과 예술의 존재 의미를 동시에 환기하는 장치로 기능한다. 박완서는 거시적 역사 서사가 포착하지 못하는 일상의 균열과 상처를 여성적 시선으로 포착함으로써, 한국 전쟁 문학의 영역을 확장하는 데 기여하였다."
    },
    {
      id: "p2",
      text: "박완서 소설의 또 다른 축은 1970~80년대 한국 중산층의 허위의식과 물질주의에 대한 비판적 성찰이다. 급속한 경제 성장 속에서 형성된 중산층의 삶은 외면적으로는 풍요로워 보였으나, 그 이면에는 체면과 허영, 이웃에 대한 배타적 경쟁의식이 도사리고 있었다. 박완서는 아파트라는 공간을 한국 중산층의 욕망과 폐쇄성을 상징하는 장치로 활용하면서, 획일화된 주거 공간이 인간 관계의 획일화로 이어지는 과정을 날카롭게 포착하였다. 그의 소설에서 여성 인물들은 남편의 사회적 지위와 자녀의 학업 성취를 통해 자신의 존재 가치를 확인하려는 타율적 삶의 방식에 갇혀 있으며, 이러한 삶의 허위성을 자각하면서도 그로부터 벗어나지 못하는 모순적 상황에 놓여 있다. 이러한 인물 형상화는 개인의 문제를 넘어 한국 사회의 구조적 모순을 드러내는 장치로 기능한다."
    },
    {
      id: "p3",
      text: "박완서 문학의 미학적 특질 중 하나는 일상어의 문학적 전환에 있다. 그는 고도로 세련된 문체나 실험적 형식 대신, 일상적 대화에서 쓰이는 구어체를 소설의 서술 언어로 적극 활용하였다. 이러한 구어체 서술은 독자에게 친밀감을 제공하면서도, 그 속에 담긴 아이러니와 풍자를 통해 비판적 거리를 동시에 확보하는 이중적 효과를 발휘한다. 박완서의 서술자는 자기 자신의 삶을 성찰하면서도 동시에 주변 인물과 사회를 관찰하는 복합적 시선을 지니고 있으며, 이러한 서술적 자의식은 단순한 체험의 토로가 아닌 비평적 서사를 가능하게 한다. 특히 그의 소설에서 자주 등장하는 자기 비하적 유머는 서술자의 진정성을 강화하면서, 독자가 서술자의 시선을 통해 사회를 재인식하도록 유도하는 서사적 전략으로 작동한다."
    },
    {
      id: "p4",
      text: "박완서가 한국 문학사에 남긴 유산은 여러 층위에서 평가될 수 있다. 우선 그는 여성 작가로서 여성의 경험과 시선을 한국 소설의 중심부에 위치시켰다. 이전까지 한국 문학에서 여성의 이야기는 주변적이거나 보조적인 것으로 취급되는 경향이 있었으나, 박완서는 여성의 일상적 경험이 곧 사회를 이해하는 핵심적 통로가 될 수 있음을 자신의 작품을 통해 입증하였다. 또한 그는 전쟁과 분단이라는 거시적 주제를 가족과 개인의 차원으로 끌어내림으로써, 역사적 사건의 의미를 구체적 삶의 맥락 속에서 재조명하는 서사 방법론을 확립하였다. 이러한 방법론은 이후 신경숙, 공지영 등 후대 여성 작가들에게 계승되어 한국 소설의 풍경을 근본적으로 변화시키는 데 기여하였다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "박완서의 데뷔작 「나목」이 그려내는 핵심적 내용은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "생존의 절박함 속에서도 예술적 감수성을 놓지 않으려는 젊은 여성의 내면을 섬세하게 그려내었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "박완서 소설에서 아파트라는 공간이 상징하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "한국 중산층의 욕망과 폐쇄성을 상징하는 장치로 활용하면서")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "박완서 소설의 여성 인물들이 처한 모순적 상황은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "삶의 허위성을 자각하면서도 그로부터 벗어나지 못하는 모순적 상황에 놓여 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "박완서의 구어체 서술이 발휘하는 이중적 효과는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "독자에게 친밀감을 제공하면서도, 그 속에 담긴 아이러니와 풍자를 통해 비판적 거리를 동시에 확보하는 이중적 효과를 발휘한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "박완서가 여성 작가로서 한국 문학에 기여한 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "여성의 일상적 경험이 곧 사회를 이해하는 핵심적 통로가 될 수 있음을 자신의 작품을 통해 입증하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "박완서의 서사 방법론이 후대 작가들에게 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "신경숙, 공지영 등 후대 여성 작가들에게 계승되어 한국 소설의 풍경을 근본적으로 변화시키는 데 기여하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(56, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 57: 비문학 (NONFICTION) ───
function buildDay57() {
  const paragraphs = [
    {
      id: "p1",
      text: "인지 편향은 인간의 사고 과정에서 체계적으로 발생하는 비합리적 판단 경향을 가리키는 개념으로, 행동경제학과 인지심리학의 핵심 연구 주제이다. 다니엘 카너먼과 아모스 트버스키는 1970년대 일련의 실험을 통해, 인간이 불확실한 상황에서 합리적 계산보다 간편한 심리적 지름길인 휴리스틱에 의존한다는 사실을 밝혀냈다. 대표성 휴리스틱은 특정 사례가 어떤 범주의 전형적 특성과 유사한지에 근거하여 확률을 판단하는 경향으로, 통계적 기저율을 무시하게 만드는 오류를 초래한다. 예컨대 조용하고 책을 좋아하는 사람을 사서로 판단하는 경향은, 사서의 실제 비율이 극히 작다는 사실을 간과한 결과이다. 이러한 편향은 일상적 판단에서부터 의료 진단이나 법적 판결 같은 전문적 의사 결정에 이르기까지 광범위하게 나타나며, 그 영향력은 개인의 주관적 인식을 넘어 사회 전체의 합리성을 저해하는 수준에 이른다."
    },
    {
      id: "p2",
      text: "가용성 휴리스틱은 특정 사건이 기억에서 얼마나 쉽게 떠오르는지에 따라 그 사건의 발생 빈도나 확률을 추정하는 인지적 경향이다. 최근에 접한 뉴스나 감정적으로 강렬한 경험이 기억에 더 쉽게 접근 가능하기 때문에, 실제 통계와 무관하게 해당 사건의 발생 가능성을 과대평가하게 된다. 비행기 사고에 대한 뉴스를 접한 직후 비행을 두려워하면서도 자동차 사고의 위험은 과소평가하는 현상이 대표적 사례이다. 카너먼은 이 편향이 시스템1이라 명명한 직관적이고 자동적인 사고 체계의 작용에 기인한다고 설명하였다. 시스템1은 빠르고 효율적이지만, 복잡한 확률 계산이 필요한 상황에서는 체계적 오류를 발생시킨다. 반면 시스템2는 느리고 의도적인 분석적 사고를 수행하지만, 인지적 노력을 필요로 하기 때문에 대부분의 일상적 판단에서는 활성화되지 않는 경향이 있다."
    },
    {
      id: "p3",
      text: "앵커링 효과는 최초에 제시된 숫자나 정보가 이후의 판단에 부당한 영향을 미치는 현상이다. 트버스키와 카너먼의 실험에서, 무작위 숫자를 제시한 후 유엔 가입국 수를 추정하게 하였을 때, 참가자들의 추정치는 처음 본 숫자에 체계적으로 끌려갔다. 이 효과는 협상, 가격 책정, 양형 결정 등 다양한 상황에서 강력하게 작용하며, 전문가조차 이 편향에서 자유롭지 못하다는 점에서 그 심각성이 더욱 부각된다. 앵커링은 부동산 협상에서 최초 제시 가격이 최종 거래 가격에 결정적 영향을 미치는 현상이나, 소매업에서 정가를 높게 설정한 후 할인 가격을 제시하여 소비자의 가치 판단을 왜곡하는 마케팅 전략에서도 확인된다."
    },
    {
      id: "p4",
      text: "인지 편향에 대한 연구는 정책 설계와 제도 개선에도 중요한 함의를 지닌다. 리처드 탈러와 캐스 선스타인이 제안한 넛지 이론은 인간의 인지적 한계를 인정한 위에서, 선택 설계의 방법을 통해 개인이 보다 나은 의사 결정을 내리도록 유도하는 정책적 접근법이다. 예컨대 퇴직 연금 가입을 기본 옵션으로 설정하되 탈퇴를 선택할 수 있게 하는 방식은, 현상 유지 편향을 활용하여 장기적으로 개인에게 유리한 결과를 이끌어내는 대표적 넛지 전략이다. 그러나 이러한 접근에 대해서는 개인의 자율적 선택권을 은밀하게 조작한다는 비판이 존재하며, 넛지가 정부나 기업의 이익을 위해 악용될 가능성에 대한 우려도 제기된다. 따라서 넛지의 적용에는 투명성과 민주적 통제가 전제되어야 하며, 편향의 교정이 곧 개인의 자유를 축소하는 것으로 귀결되어서는 안 된다는 윤리적 원칙이 병행되어야 한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "대표성 휴리스틱이 초래하는 구체적 오류는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "통계적 기저율을 무시하게 만드는 오류를 초래한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "가용성 휴리스틱에 의해 사건의 발생 가능성이 과대평가되는 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "최근에 접한 뉴스나 감정적으로 강렬한 경험이 기억에 더 쉽게 접근 가능하기 때문에")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "시스템2가 일상적 판단에서 활성화되지 않는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "인지적 노력을 필요로 하기 때문에 대부분의 일상적 판단에서는 활성화되지 않는 경향이 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "앵커링 효과의 심각성이 더욱 부각되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "전문가조차 이 편향에서 자유롭지 못하다는 점에서 그 심각성이 더욱 부각된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "넛지 이론의 정책적 접근법은 어떤 전제에 기반하는가?",
      answerRanges: [findRange(paragraphs, "p4", "인간의 인지적 한계를 인정한 위에서, 선택 설계의 방법을 통해 개인이 보다 나은 의사 결정을 내리도록 유도하는 정책적 접근법이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "넛지 적용에 병행되어야 할 윤리적 원칙은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "편향의 교정이 곧 개인의 자유를 축소하는 것으로 귀결되어서는 안 된다는 윤리적 원칙이 병행되어야 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(57, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 58: 문학 (LITERATURE) ───
function buildDay58() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대시에서 서정주는 생명의 원초적 충동과 언어의 감각적 아름다움을 극한까지 추구한 시인으로 평가된다. 초기 시집 「화사집」에 수록된 작품들은 육체적 욕망과 고통, 원죄의식 등을 강렬한 감각적 이미지로 형상화하면서, 당시 한국 시단의 관념적이고 계몽적인 분위기와 뚜렷이 구별되는 독자적 시 세계를 개척하였다. 대표작 「자화상」에서 시인은 스스로를 풍문으로 여기며 자신의 존재를 부정적이고 고통스러운 것으로 인식하면서도, 그 고통 자체를 시적 미의 원천으로 전환시키는 역설적 태도를 보여 준다. 이러한 초기 시편들에서 서정주는 보들레르와 랭보로 대표되는 프랑스 상징주의의 영향을 수용하면서도, 한국적 토속 정서와 무속적 상상력을 결합하여 독창적인 미학을 형성하였다."
    },
    {
      id: "p2",
      text: "서정주 시의 중기 이후 변모는 동양적 관조와 영원성의 추구로 특징지어진다. 시집 「신라초」와 「동천」에서 그는 신라의 역사와 불교적 세계관을 시적 소재로 삼아, 현세적 고통을 초월하는 정신적 경지를 탐구하였다. 신라는 서정주에게 역사적 실체라기보다는 이상화된 미적 공간으로 기능하였으며, 이 공간 속에서 시인은 삶과 죽음의 순환, 시간의 영속성, 자연과 인간의 합일이라는 주제를 깊이 있게 탐색하였다. 「국화 옆에서」는 이러한 중기 시학의 대표적 성취로, 국화가 피기까지의 기다림을 통해 성숙과 완성에 이르는 시간의 의미를 응축적으로 형상화하고 있다. 이 시에서 소쩍새의 울음과 천둥, 무서리는 국화의 개화에 필요한 시련의 과정을 상징하며, 이는 예술적 완성이 고난을 통해서만 도달할 수 있다는 미학적 신념을 반영하는 것이다."
    },
    {
      id: "p3",
      text: "서정주의 시적 언어는 전통적 율격과 현대적 감수성의 독특한 결합을 특징으로 한다. 그는 전통 시가의 3음보적 리듬을 현대시의 자유로운 형식 속에 유기적으로 녹여내면서, 한국어 고유의 음악성을 극대화하는 시적 문체를 구현하였다. 서정주의 시어 선택에서 특히 주목할 점은 고어와 방언, 토속어의 적극적 활용이다. 이러한 시어들은 현대 표준어가 상실한 언어의 원초적 생명력과 감각적 질감을 시 속에 복원하는 효과를 발휘하며, 독자에게 친숙하면서도 낯선 미적 경험을 제공한다. 또한 서정주는 시의 음성적 차원에 깊은 관심을 기울여, 모음의 개폐와 자음의 경중을 세심하게 배치함으로써 시적 의미와 음향적 효과가 유기적으로 결합되는 언어적 조형을 추구하였다."
    },
    {
      id: "p4",
      text: "서정주에 대한 문학사적 평가는 미학적 성취와 역사적 행적 사이의 긴장 속에 놓여 있다. 그의 시는 한국어의 감각적 가능성을 극한까지 탐구하고 한국 현대시의 미학적 수준을 비약적으로 끌어올렸다는 점에서 높이 평가받는다. 그러나 일제 강점기의 친일 행적과 군사 정권에 대한 협력은 그의 문학적 유산에 지워지지 않는 오점으로 남아 있으며, 이는 예술적 탁월성과 윤리적 책임의 관계라는 근본적 문제를 제기한다. 작품의 미학적 가치를 작가의 삶과 분리하여 평가할 수 있는가라는 질문은 서정주 문학을 둘러싼 핵심적 쟁점이며, 이 문제에 대한 답은 문학 비평의 근본적 전제와 관련된다. 이러한 논쟁은 문학이 순수한 미적 대상이 아니라 역사적 맥락 속에서 생산되고 수용되는 사회적 실천이라는 인식을 환기시키며, 한국 문학사 서술의 방법론적 성찰을 촉구하고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "서정주의 초기 시가 당시 한국 시단과 구별되는 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "당시 한국 시단의 관념적이고 계몽적인 분위기와 뚜렷이 구별되는 독자적 시 세계를 개척하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「국화 옆에서」에서 소쩍새 울음과 천둥, 무서리가 상징하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "국화의 개화에 필요한 시련의 과정을 상징하며, 이는 예술적 완성이 고난을 통해서만 도달할 수 있다는 미학적 신념을 반영하는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "서정주가 고어와 방언을 적극 활용한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "현대 표준어가 상실한 언어의 원초적 생명력과 감각적 질감을 시 속에 복원하는 효과를 발휘하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "서정주가 시의 음성적 차원에서 추구한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "시적 의미와 음향적 효과가 유기적으로 결합되는 언어적 조형을 추구하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "서정주 문학을 둘러싼 핵심적 쟁점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "작품의 미학적 가치를 작가의 삶과 분리하여 평가할 수 있는가라는 질문은 서정주 문학을 둘러싼 핵심적 쟁점이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "서정주 논쟁이 한국 문학사에 환기시키는 인식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "문학이 순수한 미적 대상이 아니라 역사적 맥락 속에서 생산되고 수용되는 사회적 실천이라는 인식을 환기시키며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(58, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 59: 비문학 (NONFICTION) ───
function buildDay59() {
  const paragraphs = [
    {
      id: "p1",
      text: "과학 혁명의 구조를 분석한 토머스 쿤의 패러다임 이론은 과학의 발전이 지식의 점진적 축적이 아니라 근본적인 세계관의 전환을 통해 이루어진다고 주장한다. 쿤에 따르면 정상 과학의 시기에 과학자 공동체는 특정 패러다임을 공유하며, 이 패러다임이 제시하는 이론적 틀과 방법론적 규범 안에서 퍼즐 풀기에 해당하는 연구를 수행한다. 정상 과학의 목표는 새로운 발견이 아니라 기존 패러다임의 정합성과 설명력을 강화하는 것이며, 패러다임과 부합하지 않는 관찰 결과는 과학자의 실수나 미해결 문제로 처리된다. 이러한 정상 과학의 보수적 성격은 과학 연구의 효율성을 보장하지만, 동시에 패러다임에 대한 비판적 성찰을 억제하는 기제로도 작용한다. 패러다임은 과학자들에게 무엇을 연구할 것인가, 어떤 방법으로 연구할 것인가, 어떤 답이 수용 가능한가를 규정하는 인식론적 틀로 기능하기 때문이다."
    },
    {
      id: "p2",
      text: "쿤은 정상 과학의 과정에서 패러다임으로 설명할 수 없는 이상 현상이 축적되면, 기존 패러다임에 대한 위기가 발생한다고 보았다. 위기의 시기에 과학자 공동체는 기존 이론의 수정을 시도하거나, 대안 이론을 탐색하기 시작한다. 이 과정에서 새로운 패러다임이 등장하면 과학 혁명이 발생하는데, 새로운 패러다임은 이상 현상을 설명할 뿐만 아니라 과학적 탐구의 근본적인 전제와 방향을 재정립한다. 코페르니쿠스의 지동설이 천동설을 대체한 것이나, 아인슈타인의 상대성 이론이 뉴턴 역학의 한계를 드러낸 것이 대표적 사례이다. 쿤이 특히 강조한 것은 패러다임 전환이 순전히 논리적이고 실증적인 근거에 의해서만 이루어지는 것이 아니라, 세대 교체, 미학적 판단, 사회적 요인 등 비과학적 요소도 개입한다는 점이다."
    },
    {
      id: "p3",
      text: "쿤의 이론에서 가장 논쟁적인 개념은 공약 불가능성이다. 이 개념에 따르면 서로 다른 패러다임에 속한 이론들은 공통의 기준으로 비교할 수 없는데, 이는 패러다임이 단순한 이론의 집합이 아니라 세계를 바라보는 전체적인 관점의 틀이기 때문이다. 서로 다른 패러다임의 과학자들은 동일한 현상을 관찰하더라도 그것을 다른 개념적 범주로 해석하며, 심지어 동일한 용어를 사용하더라도 그 의미가 달라질 수 있다. 뉴턴 역학에서의 질량 개념과 아인슈타인 물리학에서의 질량 개념은 동일한 단어를 사용하지만 근본적으로 다른 이론적 맥락에 놓여 있다. 이러한 공약 불가능성 테제는 과학적 진보가 절대적 진리에 대한 접근이라는 전통적 관점에 도전하면서, 과학 지식의 상대성에 대한 논쟁을 촉발하였다."
    },
    {
      id: "p4",
      text: "쿤의 패러다임 이론은 과학철학을 넘어 사회과학과 인문학 전반에 광범위한 영향을 미쳤다. 패러다임이라는 용어는 특정 학문 공동체가 공유하는 인식의 틀을 지칭하는 일반 개념으로 확장되어, 다양한 분야에서 지식 체계의 구조와 변동을 분석하는 도구로 활용되고 있다. 그러나 쿤의 이론에 대해서는 여러 비판이 제기되었다. 칼 포퍼는 쿤의 정상 과학 개념이 과학자의 비판적 정신을 과소평가한다고 비판하면서, 과학은 본질적으로 추측과 논박의 과정이며 정상 과학에 매몰된 과학자는 좋은 과학자가 아니라고 주장하였다. 또한 이므레 라카토시는 쿤의 패러다임 전환이 비합리적 과정으로 묘사되는 것에 반대하면서, 연구 프로그램의 방법론이라는 대안적 모델을 제시하여 과학적 변화의 합리적 재구성을 시도하였다. 이러한 비판에도 불구하고 쿤의 이론은 과학이 사회적 활동임을 인식하게 한 결정적 전환점으로 평가받고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "정상 과학에서 패러다임과 부합하지 않는 관찰 결과는 어떻게 처리되는가?",
      answerRanges: [findRange(paragraphs, "p1", "패러다임과 부합하지 않는 관찰 결과는 과학자의 실수나 미해결 문제로 처리된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "쿤이 패러다임 전환과 관련하여 특히 강조한 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "패러다임 전환이 순전히 논리적이고 실증적인 근거에 의해서만 이루어지는 것이 아니라, 세대 교체, 미학적 판단, 사회적 요인 등 비과학적 요소도 개입한다는 점이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "서로 다른 패러다임의 이론들이 비교 불가능한 근본적 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "패러다임이 단순한 이론의 집합이 아니라 세계를 바라보는 전체적인 관점의 틀이기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "공약 불가능성 테제가 전통적 과학관에 던지는 도전은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "과학적 진보가 절대적 진리에 대한 접근이라는 전통적 관점에 도전하면서")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "칼 포퍼가 쿤의 정상 과학 개념을 비판한 요지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "과학은 본질적으로 추측과 논박의 과정이며 정상 과학에 매몰된 과학자는 좋은 과학자가 아니라고 주장하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "쿤의 이론이 과학철학사에서 결정적 전환점으로 평가받는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "과학이 사회적 활동임을 인식하게 한 결정적 전환점으로 평가받고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(59, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 60: 문학 (LITERATURE) ───
function buildDay60() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대 소설에서 이청준은 언어와 서사 자체에 대한 반성적 탐구를 문학의 중심 과제로 삼은 작가이다. 그의 소설은 이야기를 통해 세계를 재현하면서, 동시에 그 이야기가 어떻게 구성되고 전달되며 수용되는지를 끊임없이 질문하는 메타서사적 성격을 지닌다. 대표작 「병신과 머저리」는 전쟁의 외상을 안고 살아가는 형제의 이야기를 다루면서, 형의 그림과 동생의 글이라는 두 예술 형식이 현실의 고통을 어떻게 다르게 포착하는지를 탐구한다. 이 작품에서 예술적 재현의 문제는 단순한 미학적 논의가 아니라, 인간이 고통스러운 현실과 어떻게 관계를 맺을 것인가라는 실존적 질문과 연결된다. 이청준에게 이야기를 한다는 것은 곧 세계와의 관계를 재정립하는 행위이며, 서사는 현실을 반영하는 거울이 아니라 현실을 해석하고 구성하는 능동적 행위로 이해된다."
    },
    {
      id: "p2",
      text: "이청준 소설의 핵심적 특징 중 하나는 액자 구조의 정교한 활용이다. 그의 많은 작품에서 이야기 속에 또 다른 이야기가 내포되며, 서술자의 위치와 시점이 중첩적으로 배치된다. 이러한 구조는 독자에게 단일한 진실이 존재하지 않으며, 동일한 사건도 서술하는 주체에 따라 전혀 다른 의미를 획득할 수 있음을 보여 준다. 「이어도」는 이러한 액자 구조의 대표적 성취로, 실종된 인물을 둘러싼 여러 증언과 해석이 층층이 쌓이면서 진실에 대한 단일한 도달이 불가능함을 구조적으로 보여 준다. 이 작품에서 이어도라는 전설의 섬은 사실과 허구, 현실과 이상의 경계가 소멸하는 지점을 상징하며, 서사적 진실이란 발견되는 것이 아니라 구성되는 것이라는 이청준의 서사 인식을 집약적으로 드러낸다."
    },
    {
      id: "p3",
      text: "이청준의 후기 작품 세계는 남도 문화와 소리 예술에 대한 깊은 천착으로 특징지어진다. 「서편제」로 대표되는 남도 연작은 판소리라는 전통 예술을 매개로 하여 예술과 삶, 아버지와 자녀, 전통과 현대의 관계를 다층적으로 탐구한다. 이 작품에서 소리꾼 유봉이 딸 송화의 눈을 멀게 하는 충격적 행위는 예술적 완성을 위해 인간적 윤리를 희생시키는 극단적 선택으로, 예술의 본질과 한계에 대한 근본적 질문을 제기한다. 이청준은 판소리가 한이라는 정서를 예술적으로 승화시키는 과정에 주목하면서, 개인의 고통이 예술을 통해 보편적 정서로 전환될 수 있는가라는 문제를 탐색한다. 이 과정에서 소리는 언어 이전의 원초적 표현 수단으로서, 문자 언어가 포착하지 못하는 삶의 깊은 차원을 전달하는 매체로 의미화된다."
    },
    {
      id: "p4",
      text: "이청준이 한국 문학사에 남긴 가장 중요한 유산은 소설이라는 형식에 대한 근본적 성찰을 한국 문학의 핵심 의제로 정립한 것이다. 그 이전의 한국 소설이 주로 현실의 충실한 반영이나 이념의 전달에 집중하였다면, 이청준은 소설이 현실을 구성하는 방식 자체를 문제화함으로써 한국 소설의 인식론적 지평을 확장하였다. 그의 작품에서 반복적으로 등장하는 글쓰기에 대한 글쓰기라는 자기 반영적 구조는, 문학이 단순한 현실의 모사가 아니라 언어를 통한 세계 인식의 탐구임을 실천적으로 보여 준다. 이러한 메타서사적 탐구는 이후 윤대녕, 김영하 등 후대 작가들에게 계승되어, 한국 소설이 서사의 형식적 실험과 존재론적 탐구를 결합하는 새로운 방향으로 발전하는 데 중요한 토대를 마련하였다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "이청준에게 이야기를 한다는 것의 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "서사는 현실을 반영하는 거울이 아니라 현실을 해석하고 구성하는 능동적 행위로 이해된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "이청준 소설의 액자 구조가 독자에게 보여 주는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "단일한 진실이 존재하지 않으며, 동일한 사건도 서술하는 주체에 따라 전혀 다른 의미를 획득할 수 있음을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「이어도」에서 이어도라는 전설의 섬이 상징하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "사실과 허구, 현실과 이상의 경계가 소멸하는 지점을 상징하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "「서편제」에서 유봉의 행위가 제기하는 근본적 질문은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "예술적 완성을 위해 인간적 윤리를 희생시키는 극단적 선택으로, 예술의 본질과 한계에 대한 근본적 질문을 제기한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이청준이 한국 소설의 인식론적 지평을 확장한 방법은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "소설이 현실을 구성하는 방식 자체를 문제화함으로써 한국 소설의 인식론적 지평을 확장하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이청준의 메타서사적 탐구가 후대 한국 소설에 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "한국 소설이 서사의 형식적 실험과 존재론적 탐구를 결합하는 새로운 방향으로 발전하는 데 중요한 토대를 마련하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(60, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── 메인 실행 ───
function main() {
  console.log("=== 비트겐슈타인3 Day 56~60 빌드 시작 ===\n");

  const contents = [
    buildDay56(),
    buildDay57(),
    buildDay58(),
    buildDay59(),
    buildDay60()
  ];

  // 검증
  let allValid = true;
  for (const c of contents) {
    const len = charLen(c.payload.passage.paragraphs);
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

  const dayIndices = [56, 57, 58, 59, 60];
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
