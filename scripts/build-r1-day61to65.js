// 일일독해 러셀1 Day 61~65 콘텐츠 빌더 스크립트
const fs = require('fs');
const path = require('path');

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
  if (!para) throw new Error(`단락 ${pid} 없음`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText.substring(0,30)}..." → ${pid}에서 찾을 수 없음`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

function hashIdx(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function truncate(text, len) {
  return text.length > len ? text.substring(0, len) + '…' : text;
}

function shuffleChoices(choices, answerId) {
  const arr = [...choices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 정독 타임라인 빌더
function buildTimeline(paragraphs, questionsPerPara) {
  const timeline = [];
  let stepNum = 1;
  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);
    const qs = questionsPerPara[pi];
    sents.forEach((sent, si) => {
      const q = qs.sentences[si];
      timeline.push({
        stepId: `s${stepNum++}`,
        highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] },
        question: {
          prompt: q.prompt,
          choices: q.choices.map((c, ci) => ({ id: String.fromCharCode(65 + ci), text: c })),
          answerId: q.answerId,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });
    const paraQ = qs.paraCenter;
    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] },
      question: {
        prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
        choices: paraQ.choices.map((c, ci) => ({ id: String.fromCharCode(65 + ci), text: c })),
        answerId: paraQ.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  });
  return timeline;
}

// 복기 카드 생성 — 전체 텍스트를 정확히 8장으로 분할
function buildRecallCards(paragraphs, count = 8) {
  const fullText = paragraphs.map(p => p.text).join(' ');
  const totalLen = fullText.length;
  const chunkSize = Math.floor(totalLen / count);
  const cards = [];
  for (let i = 0; i < count; i++) {
    const start = i * chunkSize;
    const end = i === count - 1 ? totalLen : (i + 1) * chunkSize;
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
  }
  return {
    cards,
    correctOrder: cards.map(c => c.id),
    seedPenalty: 1
  };
}

// 콘텐츠 래퍼
function assembleFull({ dayIndex, subArea, paragraphs, intensive, recall, confirm }) {
  const dayStr = String(dayIndex).padStart(3, '0');
  const subAreaKo = subArea === 'LITERATURE' ? '문학' : '비문학';
  return {
    contentId: `dr-r1-${dayStr}`,
    contentType: 'DAILY_READING',
    version: 1,
    status: 'PUBLISHED',
    title: `일일 독해(러셀 1) Day ${dayIndex} ${subAreaKo}`,
    description: '일일 독해 - 정독·복기·확인',
    targetLevel: 'RUSSELL_1',
    schoolGradeRange: { min: 7, max: 8 },
    area: 'READING',
    subArea,
    competencies: ['READING'],
    tags: ['daily'],
    access: { mode: 'FREE' },
    seedReward: { seedType: 'WHEAT', count: 3, multiplier: 1 },
    timeLimitSec: 480,
    assets: {},
    payload: {
      passage: { format: 'TEXT', paragraphs },
      intensive,
      recall,
      confirm
    }
  };
}

// 배치 아이템 래퍼
function wrapBatchItem(dayIndex, subArea, content) {
  return {
    content_type: 'DAILY_READING',
    level_id: 'RUSSELL_1',
    area: 'READING',
    sub_area: subArea,
    day_index: dayIndex,
    module_key: 'reading_training',
    schema_version: '1.0',
    content
  };
}

// ════════════════════════════════════════════════
//  Day 61 — 비문학: 지진과 판 구조론
// ════════════════════════════════════════════════
function buildDay61() {
  const paragraphs = [
    {
      id: 'p1',
      text: '지구의 표면은 하나의 단단한 덩어리가 아니라 여러 개의 거대한 판으로 이루어져 있다. 이 판들은 지구 내부의 뜨거운 맨틀 위에 떠 있으며, 맨틀의 대류 작용에 의해 매우 느린 속도로 끊임없이 이동하고 있다. 판의 이동 속도는 일 년에 수 센티미터에 불과하지만, 수백만 년에 걸쳐 축적되면 대륙의 위치를 크게 바꿀 수 있다. 판 구조론은 이러한 판의 이동과 상호 작용이 지진, 화산 활동, 산맥 형성 등 다양한 지질 현상의 원인이 된다고 설명하는 이론이다. 이 이론은 1960년대에 본격적으로 체계화되었으며, 그 이전에는 베게너가 제시한 대륙 이동설이 오랫동안 논쟁의 대상이었다. 오늘날 판 구조론은 지구과학의 가장 중요한 이론 가운데 하나로 자리 잡아 지진 예측과 화산 감시의 과학적 기초를 제공하고 있다.'
    },
    {
      id: 'p2',
      text: '판과 판이 만나는 경계에서는 세 가지 유형의 운동이 일어난다. 첫째, 두 판이 서로 멀어지는 발산 경계에서는 맨틀의 마그마가 올라와 새로운 지각을 형성하며, 대서양 중앙 해령이 그 대표적인 예이다. 둘째, 두 판이 서로 부딪치는 수렴 경계에서는 한쪽 판이 다른 쪽 아래로 밀려 들어가는 섭입 현상이 발생한다. 이때 강한 지진이 일어나거나 화산이 분출하기도 하며, 히말라야 산맥처럼 거대한 산맥이 만들어지기도 한다. 셋째, 두 판이 수평으로 스쳐 지나가는 변환 경계에서는 판이 서로 마찰하면서 에너지가 축적되었다가 한꺼번에 방출되어 지진이 발생한다. 미국 캘리포니아의 산안드레아스 단층이 변환 경계의 대표적 사례로서, 이 지역에서는 주기적으로 강한 지진이 기록되어 왔다.'
    },
    {
      id: 'p3',
      text: '지진은 판의 경계에서 축적된 에너지가 갑자기 방출될 때 발생하는 자연 현상이다. 지진의 세기는 리히터 규모와 모멘트 규모 등의 척도로 측정되는데, 규모가 1 증가할 때마다 에너지는 약 32배씩 커진다. 규모 7 이상의 강한 지진은 건물을 무너뜨리고 도로를 파괴하는 등 막대한 피해를 야기한다. 특히 해저에서 발생하는 지진은 해일을 일으켜 해안 지역에 추가적인 재난을 초래하기도 한다. 이러한 위험에 대비하기 위해 각국은 지진 조기 경보 시스템을 구축하고, 내진 설계 기준을 마련하여 건축물의 안전성을 높이는 노력을 기울이고 있다. 또한 과학자들은 지진파를 분석하여 지구 내부의 구조를 연구하고, 장기적인 지진 발생 가능성을 예측하는 연구를 꾸준히 진행하고 있다.'
    }
  ];

  const questionsPerPara = [
    { // p1 — 6문장
      sentences: [
        { prompt: '지구 표면의 구조에 대한 설명으로 적절한 것은?',
          choices: ['하나의 단단한 덩어리로 이루어져 있다.', '여러 개의 거대한 판으로 이루어져 있다.', '액체 상태의 물질로 완전히 덮여 있다.', '가스로 이루어진 얇은 막이 표면을 감싸고 있다.'],
          answerId: 'B' },
        { prompt: '판이 이동하는 원인으로 적절한 것은?',
          choices: ['지구 자전에 의한 원심력이 판을 밀어낸다.', '달의 인력이 판을 끌어당기기 때문이다.', '맨틀의 대류 작용에 의해 판이 이동한다.', '태양 에너지가 직접 판을 가열하여 이동시킨다.'],
          answerId: 'C' },
        { prompt: '판의 이동 속도에 대한 설명으로 적절한 것은?',
          choices: ['일 년에 수 미터씩 빠르게 이동한다.', '일 년에 수 센티미터에 불과하지만 오랜 기간 축적되면 큰 변화를 만든다.', '판의 이동 속도는 측정할 수 없을 정도로 빠르다.', '판은 이동하지 않고 항상 같은 자리에 있다.'],
          answerId: 'B' },
        { prompt: '판 구조론이 설명하는 현상으로 적절하지 않은 것은?',
          choices: ['지진과 화산 활동의 원인을 설명한다.', '산맥 형성의 원리를 설명한다.', '판의 이동과 상호 작용을 다룬다.', '대기 중 이산화탄소 농도 변화를 설명한다.'],
          answerId: 'D' },
        { prompt: '판 구조론이 체계화되기 전 논쟁이 된 이론은?',
          choices: ['뉴턴의 만유인력 법칙이었다.', '베게너가 제시한 대륙 이동설이었다.', '다윈의 진화론이었다.', '아인슈타인의 상대성 이론이었다.'],
          answerId: 'B' },
        { prompt: '오늘날 판 구조론이 제공하는 것으로 적절한 것은?',
          choices: ['대기 오염 측정의 기초를 제공한다.', '지진 예측과 화산 감시의 과학적 기초를 제공한다.', '해양 생물 분류의 기준을 제공한다.', '기상 예보의 핵심 원리를 제공한다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['판 구조론의 개념, 판의 이동 원리, 이론의 역사적 발전을 소개하고 있다.', '지진 피해의 사례와 대비책을 제시하고 있다.', '화산 활동이 인류에게 미치는 영향을 분석하고 있다.', '맨틀의 화학적 구성 성분을 상세히 설명하고 있다.'],
        answerId: 'A'
      }
    },
    { // p2 — 6문장
      sentences: [
        { prompt: '판의 경계에서 일어나는 운동 유형은 몇 가지인가?',
          choices: ['두 가지 유형이 있다.', '세 가지 유형이 있다.', '네 가지 유형이 있다.', '다섯 가지 유형이 있다.'],
          answerId: 'B' },
        { prompt: '발산 경계에서 일어나는 현상으로 적절한 것은?',
          choices: ['한쪽 판이 다른 쪽 아래로 밀려 들어간다.', '맨틀의 마그마가 올라와 새로운 지각을 형성한다.', '두 판이 수평으로 스쳐 지나간다.', '판이 서로 충돌하여 산맥이 형성된다.'],
          answerId: 'B' },
        { prompt: '수렴 경계에서 발생하는 섭입 현상의 의미는?',
          choices: ['두 판이 서로 멀어지면서 틈이 벌어지는 현상이다.', '한쪽 판이 다른 쪽 아래로 밀려 들어가는 현상이다.', '판이 수평으로 이동하면서 마찰이 생기는 현상이다.', '판 위에 퇴적물이 쌓여 새 대륙이 만들어지는 현상이다.'],
          answerId: 'B' },
        { prompt: '수렴 경계에서 형성될 수 있는 지형은?',
          choices: ['대서양 중앙 해령과 같은 해저 산맥이 형성된다.', '히말라야 산맥처럼 거대한 산맥이 만들어진다.', '깊은 바다 밑에 평탄한 해저 평원이 생긴다.', '넓은 사막 지형이 형성된다.'],
          answerId: 'B' },
        { prompt: '변환 경계에서 지진이 발생하는 원리는?',
          choices: ['마그마가 분출하면서 주변 지각이 흔들리기 때문이다.', '판이 서로 마찰하며 축적된 에너지가 방출되기 때문이다.', '두 판이 합쳐지면서 내부 압력이 높아지기 때문이다.', '해수면 변화로 지각에 압력이 가해지기 때문이다.'],
          answerId: 'B' },
        { prompt: '변환 경계의 대표적 사례는?',
          choices: ['히말라야 산맥이 대표적 사례이다.', '대서양 중앙 해령이 대표적 사례이다.', '미국 캘리포니아의 산안드레아스 단층이 대표적 사례이다.', '일본 해구가 대표적 사례이다.'],
          answerId: 'C' }
      ],
      paraCenter: {
        choices: ['판 경계의 세 가지 유형과 각각의 특징 및 대표 사례를 설명하고 있다.', '지진 발생 시 대피 요령을 구체적으로 안내하고 있다.', '화산 폭발의 역사적 사례를 시간순으로 나열하고 있다.', '맨틀 대류의 물리적 원리를 수식으로 증명하고 있다.'],
        answerId: 'A'
      }
    },
    { // p3 — 6문장
      sentences: [
        { prompt: '지진이 발생하는 근본적인 원인은?',
          choices: ['대기 중 기압 변화가 지각에 영향을 주기 때문이다.', '판의 경계에서 축적된 에너지가 갑자기 방출되기 때문이다.', '지구 내핵의 온도가 급격히 변하기 때문이다.', '화산 폭발로 인한 충격파가 지각을 흔들기 때문이다.'],
          answerId: 'B' },
        { prompt: '리히터 규모가 1 증가하면 에너지는 얼마나 커지는가?',
          choices: ['약 2배씩 커진다.', '약 10배씩 커진다.', '약 32배씩 커진다.', '약 100배씩 커진다.'],
          answerId: 'C' },
        { prompt: '규모 7 이상의 강한 지진이 야기하는 피해로 적절한 것은?',
          choices: ['소규모 진동만 감지되어 피해가 거의 없다.', '건물을 무너뜨리고 도로를 파괴하는 등 막대한 피해를 야기한다.', '해수면만 약간 상승시키는 정도의 영향을 미친다.', '지하수의 온도만 변화시키는 수준의 영향에 그친다.'],
          answerId: 'B' },
        { prompt: '해저 지진이 추가적으로 초래할 수 있는 재난은?',
          choices: ['대규모 산사태가 내륙 깊숙이 발생한다.', '해일을 일으켜 해안 지역에 재난을 초래한다.', '화산재가 대기를 뒤덮어 기후 변화를 야기한다.', '지하 동굴이 붕괴하여 지반 침하가 발생한다.'],
          answerId: 'B' },
        { prompt: '지진에 대비하기 위한 노력으로 언급된 것은?',
          choices: ['지진 발생 지역의 주민을 전원 이주시키는 정책을 시행한다.', '조기 경보 시스템 구축과 내진 설계 기준 마련이다.', '지하 깊이 인공 구조물을 설치하여 판의 이동을 막는다.', '해안 지역에 방파제를 건설하여 해일만 차단한다.'],
          answerId: 'B' },
        { prompt: '과학자들이 지진파를 분석하여 하는 연구는?',
          choices: ['대기의 화학 성분을 분석하는 연구이다.', '지구 내부의 구조를 연구하고 지진 발생 가능성을 예측한다.', '해양 생물의 이동 경로를 추적하는 연구이다.', '화성의 지질 구조를 비교하는 연구이다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['지진의 원인, 규모 측정, 피해, 대비책, 연구 동향을 종합적으로 설명하고 있다.', '판 구조론의 역사적 발전 과정을 시대별로 정리하고 있다.', '화산 활동과 지진의 관계를 실험 결과로 증명하고 있다.', '지진 발생 시 행동 요령을 단계별로 안내하고 있다.'],
        answerId: 'A'
      }
    }
  ];

  const timeline = buildTimeline(paragraphs, questionsPerPara);
  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '지구의 판이 이동하는 원인은 무엇인가요?',
        answerRanges: [findRange(paragraphs, 'p1', '맨틀의 대류 작용')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '판 구조론이 체계화되기 전에 논쟁이 된 이론은?',
        answerRanges: [findRange(paragraphs, 'p1', '대륙 이동설')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '발산 경계의 대표적인 예로 언급된 것은?',
        answerRanges: [findRange(paragraphs, 'p2', '대서양 중앙 해령')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '수렴 경계에서 형성된 산맥의 예는?',
        answerRanges: [findRange(paragraphs, 'p2', '히말라야 산맥')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '리히터 규모가 1 증가할 때 에너지는 약 몇 배 커지나요?',
        answerRanges: [findRange(paragraphs, 'p3', '약 32배')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '해저 지진이 추가로 초래할 수 있는 재난은?',
        answerRanges: [findRange(paragraphs, 'p3', '해일')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      }
    ]
  };

  return assembleFull({
    dayIndex: 61,
    subArea: 'NONFICTION',
    paragraphs,
    intensive: { timeline },
    recall,
    confirm
  });
}

// ════════════════════════════════════════════════
//  Day 62 — 문학: 황순원 「소나기」 분석
// ════════════════════════════════════════════════
function buildDay62() {
  const paragraphs = [
    {
      id: 'p1',
      text: '황순원의 단편 소설 「소나기」는 1953년에 발표된 작품으로, 시골 마을을 배경으로 한 소년과 소녀의 짧고 순수한 만남을 그리고 있다. 소년은 개울가에서 물장난을 하다가 윤 초시네 증손녀인 소녀를 처음 만나게 된다. 소녀는 서울에서 내려온 아이로, 소년에게는 낯설고 호기심을 자극하는 존재였다. 처음에는 소녀가 소년에게 조약돌을 던지며 장난을 치고, 소년은 그 행동에 당황하면서도 은근히 소녀에게 마음이 끌리기 시작한다. 이러한 감정의 변화는 직접적으로 서술되지 않고, 소년의 행동과 시선의 변화를 통해 간접적으로 드러난다. 이후 두 사람은 들판과 산을 함께 다니며 자연 속에서 맑고 순수한 우정을 쌓아 가는데, 이 과정에서 계절의 변화와 자연 풍경이 두 아이의 감정을 반영하는 배경으로 효과적으로 활용된다.'
    },
    {
      id: 'p2',
      text: '작품의 전환점은 갑작스러운 소나기가 내리는 장면에서 나타난다. 소년과 소녀가 들판에서 놀고 있을 때 하늘이 갑자기 어두워지고 굵은 빗방울이 쏟아지기 시작한다. 두 아이는 수숫단 아래에 숨어 비를 피하는데, 이 순간은 두 사람의 감정이 가장 가까워지는 장면으로 읽힌다. 소녀는 비에 젖으면서도 행복한 표정을 짓고, 소년은 소녀를 보호하려는 마음에 자신의 옷을 소녀에게 덮어 준다. 이 소나기 장면은 갑작스럽게 찾아오는 감정의 순간을 상징하며, 두 아이의 순수한 교감이 자연 현상과 조화를 이루는 서정적인 절정부를 형성한다. 특히 빗소리와 젖은 흙냄새 같은 감각적 묘사가 어우러져 독자에게 생생한 현장감을 전달한다.'
    },
    {
      id: 'p3',
      text: '「소나기」의 결말은 소녀가 병으로 세상을 떠났다는 소식이 전해지면서 비극적 여운을 남긴다. 소녀는 죽기 전에 자신이 입었던 옷을 그대로 묻어 달라는 유언을 남겼는데, 그 옷은 소나기를 맞으며 소년과 함께 지낸 날의 옷이었다. 이 유언은 소녀가 소년과 함께한 시간을 얼마나 소중하게 여겼는지를 보여 주며, 독자에게 깊은 감동을 전한다. 작품 전체에 걸쳐 황순원은 직접적인 감정 표현을 절제하고 행동과 풍경 묘사를 통해 인물의 내면을 드러내는 서술 방식을 취한다. 이러한 절제된 문체는 오히려 독자의 상상력을 자극하며, 작품의 여운을 더욱 깊게 만드는 효과를 지닌다. 그렇기에 「소나기」는 발표된 지 오래되었음에도 불구하고 한국 현대 문학의 대표적 단편으로서 여전히 많은 독자에게 사랑받고 있다.'
    }
  ];

  const questionsPerPara = [
    { // p1 — 6문장
      sentences: [
        { prompt: '「소나기」가 발표된 연도와 배경으로 적절한 것은?',
          choices: ['1940년에 발표되었으며 도시를 배경으로 한다.', '1953년에 발표되었으며 시골 마을을 배경으로 한다.', '1960년에 발표되었으며 전쟁터를 배경으로 한다.', '1975년에 발표되었으며 학교를 배경으로 한다.'],
          answerId: 'B' },
        { prompt: '소년이 소녀를 처음 만난 장소는 어디인가?',
          choices: ['학교 운동장에서 처음 만났다.', '마을 장터에서 우연히 마주쳤다.', '개울가에서 물장난을 하다 만났다.', '산꼭대기 정자에서 만났다.'],
          answerId: 'C' },
        { prompt: '소녀의 출신에 대한 설명으로 적절한 것은?',
          choices: ['이 마을에서 태어나고 자란 토박이이다.', '서울에서 내려온 아이로 소년에게 낯선 존재였다.', '바닷가 마을에서 온 어부의 딸이다.', '외국에서 돌아온 유학생의 자녀이다.'],
          answerId: 'B' },
        { prompt: '소녀가 소년에게 처음 한 행동은?',
          choices: ['소년에게 인사를 건네며 자기소개를 했다.', '소년에게 조약돌을 던지며 장난을 쳤다.', '소년에게 꽃다발을 선물하며 다가왔다.', '소년의 이름을 부르며 함께 놀자고 말했다.'],
          answerId: 'B' },
        { prompt: '소년의 감정 변화가 드러나는 방식은?',
          choices: ['소년이 직접 자신의 감정을 독백으로 토로한다.', '소년의 행동과 시선의 변화를 통해 간접적으로 드러난다.', '서술자가 소년의 심리를 분석적으로 설명한다.', '다른 인물이 소년의 감정을 대신 말해 준다.'],
          answerId: 'B' },
        { prompt: '두 사람이 우정을 쌓는 과정에서 활용된 것은?',
          choices: ['편지와 일기가 소통 수단으로 활용된다.', '계절의 변화와 자연 풍경이 감정을 반영하는 배경으로 활용된다.', '마을 어른들의 조언이 관계 형성에 기여한다.', '학교 수업 시간이 만남의 계기로 활용된다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['소년과 소녀의 첫 만남, 감정 변화, 순수한 교류 과정을 소개하고 있다.', '소나기 장면에서 두 아이의 감정 변화를 묘사하고 있다.', '소녀의 죽음과 그에 따른 소년의 심리 변화를 다루고 있다.', '황순원의 생애와 문학적 업적을 개괄하고 있다.'],
        answerId: 'A'
      }
    },
    { // p2 — 6문장
      sentences: [
        { prompt: '작품의 전환점이 되는 장면은?',
          choices: ['소년이 마을을 떠나는 장면이다.', '갑작스러운 소나기가 내리는 장면이다.', '소녀가 서울에서 도착하는 장면이다.', '소년이 소녀에게 편지를 쓰는 장면이다.'],
          answerId: 'B' },
        { prompt: '소나기가 오기 직전에 나타난 변화는?',
          choices: ['바람이 멈추고 햇빛이 강해졌다.', '하늘이 갑자기 어두워지고 굵은 빗방울이 쏟아졌다.', '천둥 소리 없이 안개만 짙어졌다.', '기온이 급격히 올라가면서 땅이 갈라졌다.'],
          answerId: 'B' },
        { prompt: '비를 피한 장소는 어디인가?',
          choices: ['마을 입구의 정자에 숨었다.', '수숫단 아래에 숨어 비를 피했다.', '큰 나무 밑에서 우산을 펼쳤다.', '근처 가게 처마 밑으로 뛰어갔다.'],
          answerId: 'B' },
        { prompt: '소년이 소녀를 위해 한 행동은?',
          choices: ['소녀를 업고 개울을 건넜다.', '소녀에게 우산을 가져다주었다.', '자신의 옷을 소녀에게 덮어 주었다.', '소녀의 집까지 바래다주었다.'],
          answerId: 'C' },
        { prompt: '소나기 장면이 상징하는 것으로 적절한 것은?',
          choices: ['갑작스럽게 찾아오는 감정의 순간을 상징한다.', '자연의 파괴적인 힘과 인간의 무력함을 상징한다.', '계절의 변화에 따른 농촌 생활의 어려움을 상징한다.', '도시 문명에 대한 거부감을 상징한다.'],
          answerId: 'A' },
        { prompt: '이 장면에서 독자에게 현장감을 전달하는 요소는?',
          choices: ['인물 간의 긴 대화가 현장감을 전달한다.', '빗소리와 젖은 흙냄새 같은 감각적 묘사가 현장감을 전달한다.', '작가의 직접적인 논평이 현장감을 높인다.', '다른 인물의 목격담이 현장감을 더한다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['소나기 장면을 중심으로 두 아이의 감정적 교감과 감각적 묘사를 서술하고 있다.', '소녀의 병과 죽음에 대한 복선을 제시하고 있다.', '시골 마을의 자연환경을 사실적으로 기록하고 있다.', '소년의 성장 과정에서 겪는 내적 갈등을 분석하고 있다.'],
        answerId: 'A'
      }
    },
    { // p3 — 6문장
      sentences: [
        { prompt: '작품의 결말에서 전해지는 소식은?',
          choices: ['소녀가 서울로 다시 올라갔다는 소식이다.', '소녀가 병으로 세상을 떠났다는 소식이다.', '소년이 도시로 유학을 떠났다는 소식이다.', '소녀의 가족이 마을에 정착했다는 소식이다.'],
          answerId: 'B' },
        { prompt: '소녀가 남긴 유언의 내용은?',
          choices: ['소년에게 편지를 전해 달라는 부탁이었다.', '자신이 입었던 옷을 그대로 묻어 달라는 것이었다.', '개울가에 자신의 이름을 새겨 달라는 것이었다.', '마을 사람들에게 감사를 전해 달라는 것이었다.'],
          answerId: 'B' },
        { prompt: '소녀의 유언이 보여 주는 것은?',
          choices: ['소녀가 마을 생활에 불만을 품고 있었다는 사실이다.', '소년과 함께한 시간을 소중하게 여겼다는 마음이다.', '소녀가 자신의 병을 미리 알고 있었다는 사실이다.', '소녀가 서울로 돌아가고 싶은 마음이 강했다는 것이다.'],
          answerId: 'B' },
        { prompt: '황순원의 서술 방식으로 적절한 것은?',
          choices: ['감정을 과장하여 독자의 눈물을 유도하는 방식이다.', '직접적인 감정 표현을 절제하고 행동과 풍경으로 내면을 드러낸다.', '등장인물의 독백을 길게 서술하여 심리를 분석하는 방식이다.', '논리적 설명과 비유를 통해 인물 관계를 풀이하는 방식이다.'],
          answerId: 'B' },
        { prompt: '절제된 문체의 효과로 적절한 것은?',
          choices: ['독자가 작품에 흥미를 잃게 만드는 한계가 있다.', '독자의 상상력을 자극하며 여운을 더욱 깊게 한다.', '사건의 전개를 빠르게 하여 긴장감을 높인다.', '인물의 성격을 명확하게 규정하는 효과가 있다.'],
          answerId: 'B' },
        { prompt: '「소나기」가 오랫동안 사랑받는 이유로 적절한 것은?',
          choices: ['파격적인 실험 기법을 사용했기 때문이다.', '한국 현대 문학의 대표적 단편으로서 여전히 많은 독자에게 읽히기 때문이다.', '실화를 바탕으로 한 논픽션 작품이기 때문이다.', '영화로 제작되어 대중적 인기를 얻었기 때문이다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['소녀의 죽음과 유언을 통한 비극적 여운, 절제된 서술 방식, 작품의 가치를 설명하고 있다.', '소년이 소녀의 죽음 이후 겪는 성장 과정을 서술하고 있다.', '「소나기」에 대한 문학 비평가들의 다양한 평가를 소개하고 있다.', '황순원의 다른 작품들과 「소나기」의 공통점을 비교하고 있다.'],
        answerId: 'A'
      }
    }
  ];

  const timeline = buildTimeline(paragraphs, questionsPerPara);
  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '소년이 소녀를 처음 만난 장소는 어디인가요?',
        answerRanges: [findRange(paragraphs, 'p1', '개울가')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '소녀는 어디에서 온 아이인가요?',
        answerRanges: [findRange(paragraphs, 'p1', '서울에서 내려온')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '두 아이가 비를 피한 장소는?',
        answerRanges: [findRange(paragraphs, 'p2', '수숫단 아래')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '소년이 소녀를 보호하기 위해 한 행동은?',
        answerRanges: [findRange(paragraphs, 'p2', '자신의 옷을 소녀에게 덮어 준다')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '소녀가 남긴 유언은 무엇인가요?',
        answerRanges: [findRange(paragraphs, 'p3', '자신이 입었던 옷을 그대로 묻어 달라')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '황순원이 인물의 내면을 드러내는 방식은?',
        answerRanges: [findRange(paragraphs, 'p3', '행동과 풍경 묘사를 통해')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      }
    ]
  };

  return assembleFull({
    dayIndex: 62,
    subArea: 'LITERATURE',
    paragraphs,
    intensive: { timeline },
    recall,
    confirm
  });
}

// ════════════════════════════════════════════════
//  Day 63 — 비문학: 광합성의 원리와 중요성
// ════════════════════════════════════════════════
function buildDay63() {
  const paragraphs = [
    {
      id: 'p1',
      text: '광합성은 식물이 빛 에너지를 이용하여 이산화탄소와 물로부터 포도당을 합성하는 과정이다. 이 과정은 주로 잎의 엽록체에서 일어나며, 엽록체 안에 있는 엽록소라는 색소가 빛을 흡수하는 역할을 한다. 엽록소는 주로 붉은색과 푸른색 빛을 흡수하고 초록색 빛을 반사하기 때문에 식물의 잎이 초록색으로 보이는 것이다. 광합성의 전체 반응을 간단히 요약하면 이산화탄소 여섯 분자와 물 여섯 분자가 빛 에너지의 도움을 받아 포도당 한 분자와 산소 여섯 분자를 만들어 내는 것이다. 이때 생산된 산소는 대기 중으로 방출되어 지구상 대부분의 생물이 호흡하는 데 쓰이며, 포도당은 식물 자신의 생장과 에너지원으로도 활용된다.'
    },
    {
      id: 'p2',
      text: '광합성은 크게 명반응과 암반응의 두 단계로 나뉜다. 명반응은 빛이 있을 때 엽록체의 틸라코이드 막에서 진행되며, 빛 에너지를 화학 에너지로 전환하는 역할을 한다. 이 과정에서 물 분자가 분해되어 산소가 발생하고, 생성된 화학 에너지는 다음 단계에서 사용될 에너지 운반체에 저장된다. 암반응은 빛이 직접 필요하지 않으며 엽록체의 스트로마에서 진행된다. 이 단계에서는 명반응에서 만들어진 화학 에너지를 이용하여 이산화탄소를 포도당으로 전환하는 탄소 고정 반응이 일어난다. 이 두 단계가 유기적으로 연결되어야 광합성이 정상적으로 이루어지며, 빛의 세기나 온도, 이산화탄소 농도 등 환경 요인이 광합성 속도에 영향을 미치기도 한다.'
    },
    {
      id: 'p3',
      text: '광합성의 중요성은 여러 측면에서 확인할 수 있다. 첫째, 광합성은 지구 대기의 산소를 공급하는 가장 주요한 과정으로, 동물과 인간을 포함한 거의 모든 생물의 호흡에 필수적이다. 둘째, 광합성을 통해 만들어진 포도당은 생태계 먹이 사슬의 출발점이 되어 모든 생물에게 에너지를 제공한다. 셋째, 광합성은 대기 중의 이산화탄소를 흡수하여 온실 효과를 완화하는 역할을 하므로 기후 변화 대응에서도 핵심적인 위치를 차지한다. 따라서 산림을 보전하고 녹지를 확대하는 노력은 단순히 자연 보호의 차원을 넘어 인류의 생존과 직결되는 과제라 할 수 있다. 나아가 과학자들은 인공 광합성 기술을 개발하여 태양 에너지를 보다 효율적으로 활용하는 미래 에너지 해법을 모색하고 있다.'
    }
  ];

  const questionsPerPara = [
    { // p1 — 5문장
      sentences: [
        { prompt: '광합성의 정의로 적절한 것은?',
          choices: ['식물이 토양의 영양분만으로 성장하는 과정이다.', '식물이 빛 에너지를 이용하여 이산화탄소와 물로부터 포도당을 합성하는 과정이다.', '동물이 음식을 섭취하여 에너지를 얻는 과정이다.', '미생물이 유기물을 분해하여 에너지를 방출하는 과정이다.'],
          answerId: 'B' },
        { prompt: '광합성이 일어나는 주된 장소와 빛을 흡수하는 색소는?',
          choices: ['뿌리의 세포막에서 일어나며 카로틴이 빛을 흡수한다.', '줄기의 물관에서 일어나며 안토시아닌이 빛을 흡수한다.', '잎의 엽록체에서 일어나며 엽록소가 빛을 흡수한다.', '꽃잎의 표피에서 일어나며 멜라닌이 빛을 흡수한다.'],
          answerId: 'C' },
        { prompt: '식물의 잎이 초록색으로 보이는 이유는?',
          choices: ['엽록소가 초록색 빛을 흡수하기 때문이다.', '엽록소가 붉은색과 푸른색 빛을 흡수하고 초록색 빛을 반사하기 때문이다.', '잎의 표면에 초록색 왁스가 코팅되어 있기 때문이다.', '광합성 과정에서 초록색 물질이 생성되기 때문이다.'],
          answerId: 'B' },
        { prompt: '광합성의 전체 반응에서 최종 생성물은?',
          choices: ['이산화탄소와 물이 최종 생성물이다.', '포도당 한 분자와 산소 여섯 분자가 만들어진다.', '단백질과 지방이 합성된다.', '질소와 수소가 결합하여 암모니아가 생성된다.'],
          answerId: 'B' },
        { prompt: '생산된 산소와 포도당의 역할로 적절한 것은?',
          choices: ['산소는 토양에 저장되고 포도당은 뿌리에서만 사용된다.', '산소는 대기 중으로 방출되어 생물의 호흡에 쓰이고 포도당은 식물의 생장에 활용된다.', '산소와 포도당 모두 식물 내부에만 저장된다.', '산소는 물속에 용해되고 포도당은 공기 중으로 방출된다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['광합성의 정의, 장소, 엽록소의 역할, 반응 과정을 설명하고 있다.', '광합성의 두 단계인 명반응과 암반응을 구분하여 서술하고 있다.', '광합성이 기후 변화에 미치는 영향을 분석하고 있다.', '광합성에 관한 과학적 실험의 역사를 소개하고 있다.'],
        answerId: 'A'
      }
    },
    { // p2 — 6문장
      sentences: [
        { prompt: '광합성은 크게 몇 단계로 나뉘는가?',
          choices: ['한 단계로 이루어진다.', '크게 명반응과 암반응의 두 단계로 나뉜다.', '세 단계로 나뉜다.', '네 단계로 나뉜다.'],
          answerId: 'B' },
        { prompt: '명반응이 진행되는 장소와 조건은?',
          choices: ['빛이 없을 때 스트로마에서 진행된다.', '빛이 있을 때 틸라코이드 막에서 진행된다.', '어둠 속에서 세포질에서 진행된다.', '빛과 관계없이 미토콘드리아에서 진행된다.'],
          answerId: 'B' },
        { prompt: '명반응 과정에서 발생하는 것은?',
          choices: ['포도당이 직접 합성된다.', '물 분자가 분해되어 산소가 발생한다.', '이산화탄소가 고정되어 포도당이 된다.', '단백질이 합성되어 세포막이 형성된다.'],
          answerId: 'B' },
        { prompt: '암반응이 진행되는 장소의 특징은?',
          choices: ['빛이 반드시 필요하며 틸라코이드 막에서 진행된다.', '빛이 직접 필요하지 않으며 스트로마에서 진행된다.', '빛과 열이 동시에 필요하며 세포핵에서 진행된다.', '빛이 차단된 뿌리 세포에서만 진행된다.'],
          answerId: 'B' },
        { prompt: '암반응에서 일어나는 핵심 과정은?',
          choices: ['물 분자를 분해하여 수소를 추출하는 과정이다.', '이산화탄소를 포도당으로 전환하는 탄소 고정 반응이다.', '산소를 흡수하여 에너지를 방출하는 호흡 과정이다.', '엽록소가 빛을 흡수하여 전자를 방출하는 과정이다.'],
          answerId: 'B' },
        { prompt: '광합성 속도에 영향을 미치는 환경 요인은?',
          choices: ['토양의 산성도와 미생물의 종류이다.', '빛의 세기나 온도, 이산화탄소 농도 등이다.', '해발 고도와 대기압만이 영향을 미친다.', '바람의 방향과 습도만이 관련된다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['광합성의 두 단계인 명반응과 암반응의 과정, 연결 관계, 환경 요인을 설명하고 있다.', '광합성 산물이 생태계에서 순환하는 과정을 분석하고 있다.', '광합성 연구의 역사적 발전 과정을 시대별로 소개하고 있다.', '광합성과 호흡의 차이를 비교 분석하고 있다.'],
        answerId: 'A'
      }
    },
    { // p3 — 6문장
      sentences: [
        { prompt: '광합성의 중요성을 확인할 수 있는 측면은?',
          choices: ['오직 농업 생산성의 측면에서만 확인할 수 있다.', '여러 측면에서 확인할 수 있다.', '미적 감각의 측면에서만 의미가 있다.', '공학 기술 발전의 측면에서만 중요하다.'],
          answerId: 'B' },
        { prompt: '광합성이 산소를 공급하는 과정의 의미는?',
          choices: ['식물만 이용할 수 있는 산소를 생산한다.', '거의 모든 생물의 호흡에 필수적인 산소를 공급한다.', '해양 생물에게만 산소를 공급하는 과정이다.', '산소를 생산하지만 인간의 호흡과는 무관하다.'],
          answerId: 'B' },
        { prompt: '광합성으로 만들어진 포도당의 생태적 역할은?',
          choices: ['특정 식물만 이용하는 에너지원이다.', '먹이 사슬의 출발점이 되어 모든 생물에게 에너지를 제공한다.', '토양의 무기물을 보충하는 데만 쓰인다.', '대기 중 질소를 고정하는 원료로 사용된다.'],
          answerId: 'B' },
        { prompt: '광합성이 기후 변화 대응에서 중요한 이유는?',
          choices: ['오존층을 직접 복원하기 때문이다.', '이산화탄소를 흡수하여 온실 효과를 완화하기 때문이다.', '태양 에너지를 차단하여 기온을 낮추기 때문이다.', '비를 내리게 하여 가뭄을 해소하기 때문이다.'],
          answerId: 'B' },
        { prompt: '산림 보전과 녹지 확대가 인류에게 중요한 이유는?',
          choices: ['관광 산업 활성화에만 기여하기 때문이다.', '인류의 생존과 직결되는 과제이기 때문이다.', '목재 자원 확보에만 필요하기 때문이다.', '동물 서식지 보호만을 위한 것이기 때문이다.'],
          answerId: 'B' },
        { prompt: '과학자들이 모색하는 미래 에너지 해법은?',
          choices: ['화석 연료의 매장량을 늘리는 기술이다.', '인공 광합성 기술을 개발하여 태양 에너지를 효율적으로 활용하는 것이다.', '핵융합 발전소를 대규모로 건설하는 것이다.', '풍력 발전만으로 모든 에너지를 공급하는 것이다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['광합성의 중요성을 산소 공급, 먹이 사슬, 기후 변화, 미래 에너지의 측면에서 설명하고 있다.', '광합성의 화학적 반응식을 수식으로 증명하고 있다.', '광합성 효율을 높이기 위한 농업 기술을 소개하고 있다.', '광합성과 관련된 과학자들의 업적을 나열하고 있다.'],
        answerId: 'A'
      }
    }
  ];

  const timeline = buildTimeline(paragraphs, questionsPerPara);
  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '광합성에서 빛을 흡수하는 색소는 무엇인가요?',
        answerRanges: [findRange(paragraphs, 'p1', '엽록소')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '광합성에서 생산된 산소는 어디로 방출되나요?',
        answerRanges: [findRange(paragraphs, 'p1', '대기 중으로 방출')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '명반응이 진행되는 장소는?',
        answerRanges: [findRange(paragraphs, 'p2', '틸라코이드 막')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '암반응에서 일어나는 핵심 과정은?',
        answerRanges: [findRange(paragraphs, 'p2', '탄소 고정 반응')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '광합성이 기후 변화 대응에서 중요한 이유는?',
        answerRanges: [findRange(paragraphs, 'p3', '이산화탄소를 흡수하여 온실 효과를 완화')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '포도당이 생태계에서 하는 역할은?',
        answerRanges: [findRange(paragraphs, 'p3', '먹이 사슬의 출발점')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      }
    ]
  };

  return assembleFull({
    dayIndex: 63,
    subArea: 'NONFICTION',
    paragraphs,
    intensive: { timeline },
    recall,
    confirm
  });
}

// ════════════════════════════════════════════════
//  Day 64 — 문학: 김소월 「진달래꽃」 분석
// ════════════════════════════════════════════════
function buildDay64() {
  const paragraphs = [
    {
      id: 'p1',
      text: '김소월은 한국 현대 시 문학의 대표적 서정 시인으로, 민요적 가락과 한국 전통 정서를 현대시의 형식에 녹여낸 것으로 평가받는다. 그의 대표작 「진달래꽃」은 1925년 시집 『진달래꽃』에 수록된 작품으로, 이별의 슬픔을 한의 정서로 승화시킨 명시이다. 이 시에서 화자는 사랑하는 사람이 떠나간다는 가정 하에, 영변 약산의 진달래꽃을 한 아름 따다가 떠나는 이의 발걸음 위에 뿌리겠다고 말한다. 이러한 표현은 이별을 만류하는 대신, 떠나는 이를 위해 꽃길을 깔아 주겠다는 희생적 사랑의 태도를 보여 준다. 김소월은 이처럼 소박하면서도 깊은 감정을 담은 시어를 사용하여 독자의 마음에 자연스럽게 스며드는 서정의 세계를 구축하였다.'
    },
    {
      id: 'p2',
      text: '이 시의 핵심적인 정서는 한과 체념이다. 화자는 사랑하는 사람이 떠나는 상황에서 울거나 붙잡지 않겠다고 다짐한다. 나 보기가 역겨워 가실 때에는이라는 첫 구절은 이별이 상대의 선택에 의한 것임을 보여 주면서, 화자가 그 선택을 받아들이는 태도를 드러낸다. 그러나 이러한 체념의 이면에는 깊은 슬픔과 미련이 감추어져 있다. 마지막 연에서 화자가 죽어도 아니 눈물 흘리우리다라고 말하는 부분은, 오히려 참을 수 없는 슬픔을 억누르고 있음을 역설적으로 보여 준다. 이처럼 김소월은 직접적으로 슬픔을 토로하는 대신, 부정의 표현을 통해 더 깊은 감정을 전달하는 역설의 기법을 효과적으로 사용하고 있다.'
    },
    {
      id: 'p3',
      text: '「진달래꽃」의 문학적 가치는 여러 면에서 찾을 수 있다. 우선, 삼음보 율격에 기반한 민요적 리듬은 한국어의 자연스러운 호흡에 맞아 시를 소리 내어 읽을 때 음악적 아름다움을 느끼게 한다. 또한 진달래꽃이라는 자연물은 한국의 봄을 상징하는 동시에, 화자의 사랑과 희생을 시각적으로 형상화하는 핵심 소재로 기능한다. 이 시는 발표된 지 백 년이 넘었지만 여전히 한국인들에게 가장 사랑받는 시 가운데 하나로 꼽힌다. 그 이유는 이별이라는 보편적 주제를 한국 고유의 정서인 한으로 풀어내어 시대와 세대를 넘는 공감을 이끌어 내기 때문이다. 나아가 김소월의 시는 후대 시인들에게도 큰 영향을 미쳐 한국 서정시의 전통을 형성하는 데 중요한 기여를 하였다. 결국 「진달래꽃」은 민족 정서와 보편적 감정을 동시에 담아낸 한국 서정시의 정수라 할 만하다.'
    }
  ];

  const questionsPerPara = [
    { // p1 — 5문장
      sentences: [
        { prompt: '김소월에 대한 평가로 적절한 것은?',
          choices: ['사회 비판적 참여시를 주로 썼다는 평가를 받는다.', '민요적 가락과 한국 전통 정서를 현대시에 녹여냈다는 평가를 받는다.', '서양의 상징주의 기법을 도입한 선구자라는 평가를 받는다.', '실험적 자유시의 형식을 확립한 전위적 시인이라는 평가를 받는다.'],
          answerId: 'B' },
        { prompt: '「진달래꽃」의 핵심 정서는?',
          choices: ['이별의 슬픔을 한의 정서로 승화시킨 것이다.', '고향에 대한 그리움을 노래한 것이다.', '사회적 불의에 대한 분노를 표현한 것이다.', '자연의 아름다움을 예찬한 것이다.'],
          answerId: 'A' },
        { prompt: '화자가 진달래꽃을 뿌리겠다고 한 이유는?',
          choices: ['떠나는 이의 앞길을 막기 위해서이다.', '떠나는 이를 위해 꽃길을 깔아 주기 위해서이다.', '자연의 아름다움을 함께 감상하기 위해서이다.', '이별의 분노를 표출하기 위해서이다.'],
          answerId: 'B' },
        { prompt: '화자의 태도로 적절한 것은?',
          choices: ['떠나는 이를 적극적으로 만류하는 태도이다.', '떠나는 이에게 분노를 표출하는 태도이다.', '희생적 사랑으로 이별을 수용하는 태도이다.', '이별에 무관심하고 담담한 태도이다.'],
          answerId: 'C' },
        { prompt: '김소월의 시어가 지닌 특징은?',
          choices: ['난해하고 추상적인 시어를 사용하여 해석의 여지를 넓혔다.', '소박하면서도 깊은 감정을 담아 독자의 마음에 자연스럽게 스며든다.', '외래어를 적극적으로 도입하여 현대적 감각을 드러냈다.', '논리적이고 분석적인 시어로 지식인의 세계를 표현하였다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['김소월의 문학적 위치와 「진달래꽃」의 핵심 내용, 화자의 태도를 소개하고 있다.', '「진달래꽃」의 역설적 표현 기법을 분석하고 있다.', '민요적 리듬의 특징과 음악적 효과를 설명하고 있다.', '한국 현대 시사에서 김소월의 영향력을 평가하고 있다.'],
        answerId: 'A'
      }
    },
    { // p2 — 6문장
      sentences: [
        { prompt: '이 시의 핵심적인 정서는?',
          choices: ['기쁨과 감사의 정서이다.', '한과 체념의 정서이다.', '분노와 저항의 정서이다.', '호기심과 탐구의 정서이다.'],
          answerId: 'B' },
        { prompt: '화자가 다짐하는 내용은?',
          choices: ['떠나는 이를 끝까지 따라가겠다는 다짐이다.', '울거나 붙잡지 않겠다는 다짐이다.', '새로운 사랑을 찾겠다는 다짐이다.', '이별의 원인을 밝히겠다는 다짐이다.'],
          answerId: 'B' },
        { prompt: '첫 구절이 드러내는 것은?',
          choices: ['이별이 화자의 선택에 의한 것임을 보여 준다.', '이별이 상대의 선택에 의한 것이며 화자가 이를 받아들이는 태도를 드러낸다.', '두 사람이 합의하여 이별을 결정했음을 보여 준다.', '외부의 강제에 의해 이별하게 되었음을 암시한다.'],
          answerId: 'B' },
        { prompt: '체념의 이면에 감추어진 것은?',
          choices: ['상대에 대한 원망과 복수심이다.', '깊은 슬픔과 미련이 감추어져 있다.', '새로운 만남에 대한 기대감이다.', '자유를 얻은 데 대한 안도감이다.'],
          answerId: 'B' },
        { prompt: '마지막 연의 표현이 역설적인 이유는?',
          choices: ['눈물을 흘리지 않겠다는 말 자체가 참을 수 없는 슬픔을 보여 주기 때문이다.', '눈물을 흘리겠다고 직접적으로 고백하기 때문이다.', '죽음에 대한 공포를 감추지 않고 드러내기 때문이다.', '기쁨을 표현하면서도 슬픈 표정을 짓기 때문이다.'],
          answerId: 'A' },
        { prompt: '김소월이 감정을 전달하는 기법은?',
          choices: ['감정을 직접적으로 토로하여 독자를 설득하는 기법이다.', '부정의 표현을 통해 더 깊은 감정을 전달하는 역설의 기법이다.', '논리적 근거를 나열하여 감정을 분석하는 기법이다.', '다른 시인의 작품을 인용하여 감정을 비교하는 기법이다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['「진달래꽃」에 나타난 한과 체념의 정서, 역설적 표현 기법을 분석하고 있다.', '김소월의 생애와 시 창작 배경을 서술하고 있다.', '「진달래꽃」이 후대 시인에게 미친 영향을 평가하고 있다.', '이별 시에 나타난 다양한 감정 표현 방식을 비교하고 있다.'],
        answerId: 'A'
      }
    },
    { // p3 — 7문장
      sentences: [
        { prompt: '「진달래꽃」의 문학적 가치가 인정되는 이유는?',
          choices: ['한 가지 측면에서만 가치가 있다.', '여러 면에서 문학적 가치를 찾을 수 있다.', '외국 문학 작품의 영향을 받은 점이 유일한 가치이다.', '역사적 사건을 기록한 점에서만 가치가 인정된다.'],
          answerId: 'B' },
        { prompt: '삼음보 율격의 효과는?',
          choices: ['시를 읽을 때 긴장감과 속도감을 부여한다.', '한국어의 자연스러운 호흡에 맞아 음악적 아름다움을 느끼게 한다.', '서양 시의 리듬을 그대로 재현하는 효과가 있다.', '시의 의미를 모호하게 만들어 해석의 여지를 넓힌다.'],
          answerId: 'B' },
        { prompt: '진달래꽃이라는 소재의 기능은?',
          choices: ['한국의 가을 풍경을 묘사하는 배경 소재이다.', '화자의 사랑과 희생을 형상화하는 핵심 소재이다.', '이별의 분노를 표현하는 대조적 소재이다.', '자연 파괴에 대한 경각심을 일깨우는 소재이다.'],
          answerId: 'B' },
        { prompt: '이 시가 한국인에게 사랑받는 현재 위상은?',
          choices: ['소수 전문가만 연구하는 난해한 작품으로 남아 있다.', '발표 이후 곧 잊혀진 작품이 되었다.', '가장 사랑받는 시 가운데 하나로 꼽힌다.', '번역을 통해 해외에서만 인정받는 작품이다.'],
          answerId: 'C' },
        { prompt: '이 시가 시대를 넘어 공감을 이끌어 내는 이유는?',
          choices: ['특정 시대의 역사적 사건만을 다루고 있기 때문이다.', '이별이라는 보편적 주제를 한국 고유의 한으로 풀어냈기 때문이다.', '외국 문학의 주제를 그대로 차용했기 때문이다.', '학교 교과서에 수록되어 의무적으로 읽히기 때문이다.'],
          answerId: 'B' },
        { prompt: '김소월의 시가 후대에 미친 영향은?',
          choices: ['후대 시인들에게 영향을 미치지 못하고 단절되었다.', '한국 서정시의 전통을 형성하는 데 중요한 기여를 하였다.', '외국 시인들에게만 영향을 미쳤다.', '소설 문학의 발전에만 기여하였다.'],
          answerId: 'B' },
        { prompt: '「진달래꽃」에 대한 총평으로 적절한 것은?',
          choices: ['실험적 형식을 추구한 전위적 시이다.', '민족 정서와 보편적 감정을 동시에 담아낸 한국 서정시의 정수이다.', '사회 비판적 메시지를 전달하는 참여시의 대표작이다.', '자연 풍경을 객관적으로 묘사한 사실주의 시이다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['「진달래꽃」의 문학적 가치를 리듬, 소재, 공감, 후대 영향의 측면에서 종합 평가하고 있다.', '김소월이 영향을 받은 외국 시인들의 작품을 소개하고 있다.', '「진달래꽃」의 판본별 차이를 비교 분석하고 있다.', '한국 현대 시사에서 서정시의 흐름을 개괄하고 있다.'],
        answerId: 'A'
      }
    }
  ];

  const timeline = buildTimeline(paragraphs, questionsPerPara);
  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '「진달래꽃」은 어떤 시집에 수록되었나요?',
        answerRanges: [findRange(paragraphs, 'p1', '시집 『진달래꽃』')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '화자가 진달래꽃을 따는 장소는 어디인가요?',
        answerRanges: [findRange(paragraphs, 'p1', '영변 약산')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '체념의 이면에 감추어진 감정은?',
        answerRanges: [findRange(paragraphs, 'p2', '깊은 슬픔과 미련')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '김소월이 사용한 핵심적인 기법은?',
        answerRanges: [findRange(paragraphs, 'p2', '역설의 기법')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '이 시의 리듬 체계는 무엇에 기반하고 있나요?',
        answerRanges: [findRange(paragraphs, 'p3', '삼음보 율격')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '이 시가 시대를 넘어 공감을 이끌어 내는 이유는?',
        answerRanges: [findRange(paragraphs, 'p3', '이별이라는 보편적 주제를 한국 고유의 정서인 한으로 풀어내어')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      }
    ]
  };

  return assembleFull({
    dayIndex: 64,
    subArea: 'LITERATURE',
    paragraphs,
    intensive: { timeline },
    recall,
    confirm
  });
}

// ════════════════════════════════════════════════
//  Day 65 — 비문학: 민주주의의 발전과 시민 참여
// ════════════════════════════════════════════════
function buildDay65() {
  const paragraphs = [
    {
      id: 'p1',
      text: '민주주의는 국민이 권력의 주체가 되어 나라의 중요한 일을 스스로 결정하는 정치 체제이다. 이 개념은 고대 그리스 아테네에서 시작되었는데, 당시 시민들은 광장에 모여 직접 토론하고 투표하는 방식으로 국가의 정책을 결정하였다. 그러나 고대 아테네의 민주주의는 성인 남성 시민에게만 참정권이 주어졌으며, 여성이나 노예, 외국인은 정치에 참여할 수 없었다는 한계가 있었다. 이후 중세를 거치면서 왕이나 귀족이 권력을 독점하는 시대가 오랫동안 이어졌고, 이 시기에는 일반 백성의 정치적 권리가 거의 인정되지 않았다. 근대에 이르러 시민 혁명을 통해 민주주의의 이념이 되살아났으며, 모든 국민이 동등한 권리를 가진다는 원칙이 점차 확립되었다.'
    },
    {
      id: 'p2',
      text: '오늘날 대부분의 민주주의 국가는 대의 민주주의 체제를 채택하고 있다. 대의 민주주의란 국민이 직접 정책을 결정하는 대신, 선거를 통해 자신의 대표자를 선출하고 그 대표자가 국민을 대신하여 법률을 만들고 정책을 집행하는 방식이다. 이 제도는 인구가 많은 현대 국가에서 모든 시민이 직접 정치에 참여하기 어렵다는 현실적 한계를 보완하기 위해 발전하였다. 그러나 대의 민주주의가 제대로 작동하려면 시민이 선거에 적극적으로 참여하여 자신의 뜻을 반영할 대표자를 신중하게 선택해야 한다. 또한 선출된 대표자가 국민의 의견을 충실히 반영하고 있는지를 시민이 지속적으로 감시하고 비판하는 것도 중요하다. 이와 더불어 언론의 자유와 정보 공개가 보장되어야 시민이 올바른 판단을 내릴 수 있다.'
    },
    {
      id: 'p3',
      text: '시민 참여는 선거뿐만 아니라 다양한 형태로 이루어질 수 있다. 시민들은 공청회나 주민 토론회에 참석하여 지역 사회의 문제에 대해 의견을 개진할 수 있고, 시민 단체에 가입하여 환경 보호나 인권 증진 같은 공익적 활동에 참여할 수도 있다. 최근에는 인터넷과 소셜 미디어의 발달로 온라인 청원이나 전자 투표 등 디지털 시민 참여의 방식도 확대되고 있다. 이처럼 시민이 자발적이고 적극적으로 사회 문제에 관심을 갖고 참여하는 것은 민주주의를 건강하게 유지하는 핵심 조건이다. 민주주의는 한 번 확립되면 영원히 유지되는 것이 아니라, 시민의 끊임없는 관심과 노력을 통해 지켜지고 발전하는 살아 있는 체제이다. 결국 민주주의의 힘은 제도 자체가 아니라 그 제도를 운영하는 시민의 참여 의식에서 비롯된다.'
    }
  ];

  const questionsPerPara = [
    { // p1 — 5문장
      sentences: [
        { prompt: '민주주의의 정의로 적절한 것은?',
          choices: ['소수의 전문가가 국가를 통치하는 정치 체제이다.', '국민이 권력의 주체가 되어 나라의 중요한 일을 스스로 결정하는 정치 체제이다.', '군주가 절대 권력을 행사하는 정치 체제이다.', '종교 지도자가 국가 운영을 담당하는 정치 체제이다.'],
          answerId: 'B' },
        { prompt: '고대 아테네에서 시민들이 정책을 결정한 방식은?',
          choices: ['왕의 명령에 따라 정책을 수행하였다.', '광장에 모여 직접 토론하고 투표하였다.', '귀족 회의에서 결정된 사항을 통보받았다.', '종교 의식을 통해 신의 뜻을 확인하였다.'],
          answerId: 'B' },
        { prompt: '고대 아테네 민주주의의 한계는?',
          choices: ['모든 거주민에게 평등하게 참정권이 주어졌다.', '여성, 노예, 외국인은 정치에 참여할 수 없었다.', '시민들의 투표율이 너무 높아 혼란이 발생했다.', '경제적 능력에 따라 투표권의 크기가 달랐다.'],
          answerId: 'B' },
        { prompt: '중세 시대의 권력 구조는 어떠했나요?',
          choices: ['시민들이 직접 민주주의를 실천하였다.', '왕이나 귀족이 권력을 독점하고 일반 백성의 정치적 권리가 거의 인정되지 않았다.', '선거를 통해 대표자를 뽑는 제도가 발달하였다.', '종교와 정치가 완전히 분리되어 운영되었다.'],
          answerId: 'B' },
        { prompt: '근대 민주주의가 되살아난 계기는?',
          choices: ['식민지 개척을 통해 민주주의가 전파되었다.', '시민 혁명을 통해 민주주의의 이념이 되살아났다.', '과학 기술의 발전으로 자연스럽게 민주화가 이루어졌다.', '왕이 자발적으로 권력을 국민에게 이양하였다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['민주주의의 개념과 고대부터 근대까지의 역사적 발전 과정을 개괄하고 있다.', '대의 민주주의의 장점과 단점을 비교 분석하고 있다.', '시민 참여의 다양한 형태를 구체적으로 소개하고 있다.', '현대 민주주의 국가들의 정치 체제를 비교하고 있다.'],
        answerId: 'A'
      }
    },
    { // p2 — 6문장
      sentences: [
        { prompt: '오늘날 대부분의 민주주의 국가가 채택한 체제는?',
          choices: ['직접 민주주의 체제를 채택하고 있다.', '대의 민주주의 체제를 채택하고 있다.', '군주제와 민주주의가 혼합된 체제이다.', '귀족 공화제를 채택하고 있다.'],
          answerId: 'B' },
        { prompt: '대의 민주주의의 핵심적인 작동 방식은?',
          choices: ['국민이 모든 법률에 직접 투표하는 방식이다.', '선거를 통해 대표자를 선출하고 대표자가 법률과 정책을 담당하는 방식이다.', '전문가 집단이 정책을 결정하고 국민이 사후 승인하는 방식이다.', '지역별 추첨으로 대표를 뽑는 방식이다.'],
          answerId: 'B' },
        { prompt: '대의 민주주의가 발전한 이유는?',
          choices: ['직접 민주주의보다 비용이 적게 들기 때문이다.', '인구가 많은 현대 국가에서 모든 시민이 직접 참여하기 어렵기 때문이다.', '전문가의 판단이 시민의 판단보다 우수하기 때문이다.', '왕이 자발적으로 권력을 분산시켰기 때문이다.'],
          answerId: 'B' },
        { prompt: '대의 민주주의가 제대로 작동하기 위한 조건은?',
          choices: ['시민이 정치에 관심을 갖지 않아도 제도가 자동으로 운영된다.', '시민이 선거에 적극 참여하여 대표자를 신중하게 선택해야 한다.', '대표자가 한번 선출되면 임기 동안 무조건 신뢰해야 한다.', '시민의 참여보다 법률 제도의 완비가 더 중요하다.'],
          answerId: 'B' },
        { prompt: '시민의 감시와 비판이 중요한 이유는?',
          choices: ['대표자를 견제하여 국민 의견이 충실히 반영되도록 하기 위해서이다.', '대표자의 사생활을 감시하여 도덕성을 확보하기 위해서이다.', '대표자의 업무 효율을 높이기 위해서이다.', '새로운 법률을 직접 만들기 위해서이다.'],
          answerId: 'A' },
        { prompt: '시민이 올바른 판단을 내리기 위해 보장되어야 하는 것은?',
          choices: ['경제적 보상과 세금 감면이 보장되어야 한다.', '언론의 자유와 정보 공개가 보장되어야 한다.', '모든 시민에게 정치 교육이 의무적으로 제공되어야 한다.', '국가가 시민의 의견을 대신 결정해 주어야 한다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['대의 민주주의의 개념, 발전 배경, 작동 조건, 언론의 역할을 설명하고 있다.', '직접 민주주의와 대의 민주주의의 역사적 전환 과정을 서술하고 있다.', '선거 제도의 종류와 각각의 장단점을 비교하고 있다.', '시민 참여의 구체적인 방법을 사례별로 안내하고 있다.'],
        answerId: 'A'
      }
    },
    { // p3 — 6문장
      sentences: [
        { prompt: '시민 참여가 가능한 영역은?',
          choices: ['선거에서만 시민 참여가 가능하다.', '선거뿐만 아니라 다양한 형태로 이루어질 수 있다.', '법률 제정 과정에만 참여할 수 있다.', '경제 활동을 통해서만 참여가 가능하다.'],
          answerId: 'B' },
        { prompt: '시민들이 지역 사회 문제에 참여하는 방법으로 언급된 것은?',
          choices: ['지역 신문에 독자 투고를 하는 것이다.', '공청회나 주민 토론회에 참석하거나 시민 단체에 가입하는 것이다.', '국회에 직접 법안을 제출하는 것이다.', '지역 축제를 기획하고 운영하는 것이다.'],
          answerId: 'B' },
        { prompt: '최근 확대되고 있는 시민 참여 방식은?',
          choices: ['전통적인 서명 운동이 더욱 활성화되고 있다.', '온라인 청원이나 전자 투표 등 디지털 시민 참여이다.', '군사적 훈련을 통한 국방 참여가 늘고 있다.', '해외 봉사 활동을 통한 국제적 참여이다.'],
          answerId: 'B' },
        { prompt: '시민의 자발적 참여가 중요한 이유는?',
          choices: ['경제적 이익을 얻기 위해서이다.', '민주주의를 건강하게 유지하는 핵심 조건이기 때문이다.', '법적 의무를 이행하기 위해서이다.', '개인의 명예를 높이기 위해서이다.'],
          answerId: 'B' },
        { prompt: '민주주의의 본질에 대한 설명으로 적절한 것은?',
          choices: ['한 번 확립되면 영원히 유지되는 안정적인 체제이다.', '시민의 끊임없는 관심과 노력을 통해 지켜지고 발전하는 살아 있는 체제이다.', '제도만 갖추면 시민 참여 없이도 자동으로 운영되는 체제이다.', '특정 지도자의 능력에 의해 좌우되는 체제이다.'],
          answerId: 'B' },
        { prompt: '민주주의의 힘이 비롯되는 근원은?',
          choices: ['강력한 법률과 제도 자체에서 비롯된다.', '시민의 참여 의식에서 비롯된다.', '군사력의 강화에서 비롯된다.', '경제적 풍요에서 비롯된다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['선거 외 다양한 시민 참여 방식과 민주주의 유지에서 시민 참여의 중요성을 설명하고 있다.', '민주주의 국가들의 선거 제도를 비교 분석하고 있다.', '인터넷의 발달이 정치에 미친 부정적 영향을 경고하고 있다.', '시민 단체의 역사적 발전 과정을 시대별로 소개하고 있다.'],
        answerId: 'A'
      }
    }
  ];

  const timeline = buildTimeline(paragraphs, questionsPerPara);
  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '민주주의가 시작된 곳은 어디인가요?',
        answerRanges: [findRange(paragraphs, 'p1', '고대 그리스 아테네')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '고대 아테네 민주주의에서 정치에 참여할 수 없었던 사람들은?',
        answerRanges: [findRange(paragraphs, 'p1', '여성이나 노예, 외국인')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '대의 민주주의에서 대표자를 선출하는 방법은?',
        answerRanges: [findRange(paragraphs, 'p2', '선거를 통해')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '최근 확대되고 있는 디지털 시민 참여의 예는?',
        answerRanges: [findRange(paragraphs, 'p3', '온라인 청원이나 전자 투표')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '민주주의의 힘은 어디에서 비롯되나요?',
        answerRanges: [findRange(paragraphs, 'p3', '시민의 참여 의식에서 비롯된다')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '근대에 민주주의가 되살아난 계기는?',
        answerRanges: [findRange(paragraphs, 'p1', '시민 혁명')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      }
    ]
  };

  return assembleFull({
    dayIndex: 65,
    subArea: 'NONFICTION',
    paragraphs,
    intensive: { timeline },
    recall,
    confirm
  });
}

// ════════════════════════════════════════════════
//  메인 실행
// ════════════════════════════════════════════════
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const BATCH_PATH = path.join(ROOT, 'generated', 'daily-batch-reading-russell1.json');
  const STATIC_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'russell1');

  console.log('=== 러셀1 Day 61~65 콘텐츠 빌더 시작 ===\n');

  // 콘텐츠 빌드
  const day61 = buildDay61();
  const day62 = buildDay62();
  const day63 = buildDay63();
  const day64 = buildDay64();
  const day65 = buildDay65();

  const contents = [
    { day: 61, content: day61, index: 60 },
    { day: 62, content: day62, index: 61 },
    { day: 63, content: day63, index: 62 },
    { day: 64, content: day64, index: 63 },
    { day: 65, content: day65, index: 64 }
  ];

  // 검증
  console.log('\n=== 검증 ===');
  let hasError = false;

  for (const { day, content } of contents) {
    const paras = content.payload.passage.paragraphs;
    const total = charLen(paras);
    const recallCards = content.payload.recall.cards.length;
    const confirmQs = content.payload.confirm.questions.length;
    const timelineSteps = content.payload.intensive.timeline.length;

    console.log(`\n  Day ${day}:`);
    console.log(`    지문 길이: ${total}자 (목표: 1050~1150)`);
    console.log(`    타임라인 스텝: ${timelineSteps}개`);
    console.log(`    복기 카드: ${recallCards}장 (목표: 8)`);
    console.log(`    확인 문항: ${confirmQs}개 (목표: 5~8)`);
    console.log(`    timeLimitSec: ${content.timeLimitSec}`);
    console.log(`    schoolGradeRange: ${JSON.stringify(content.schoolGradeRange)}`);
    console.log(`    subArea: ${content.subArea}`);
    console.log(`    contentId: ${content.contentId}`);

    if (total < 1050 || total > 1150) {
      console.log(`    [경고] 지문 길이가 목표 범위(1050~1150)를 벗어남!`);
      hasError = true;
    }
    if (recallCards !== 8) {
      console.log(`    [오류] 복기 카드가 8장이 아님!`);
      hasError = true;
    }
    if (confirmQs < 5 || confirmQs > 8) {
      console.log(`    [오류] 확인 문항이 5~8 범위를 벗어남!`);
      hasError = true;
    }
    if (content.timeLimitSec !== 480) {
      console.log(`    [오류] timeLimitSec이 480이 아님!`);
      hasError = true;
    }
    if (content.schoolGradeRange.min !== 7 || content.schoolGradeRange.max !== 8) {
      console.log(`    [오류] schoolGradeRange가 {min:7,max:8}이 아님!`);
      hasError = true;
    }

    // seedPenalty 확인
    if (content.payload.recall.seedPenalty !== 1) {
      console.log(`    [오류] seedPenalty가 1이 아님!`);
      hasError = true;
    }

    // 확인 문제 revealOnWrong, answerMatchMode 확인
    for (const q of content.payload.confirm.questions) {
      if (q.answerMatchMode !== 'ANY') {
        console.log(`    [오류] ${q.id} answerMatchMode가 ANY가 아님!`);
        hasError = true;
      }
      if (q.revealOnWrong !== true) {
        console.log(`    [오류] ${q.id} revealOnWrong가 true가 아님!`);
        hasError = true;
      }
    }
  }

  if (hasError) {
    console.log('\n[경고] 일부 검증 실패 항목이 있습니다. 출력을 계속합니다.');
  } else {
    console.log('\n  모든 검증 통과!');
  }

  // 1) static 파일 출력
  console.log('\n=== static 파일 생성 ===');
  for (const { day, content } of contents) {
    const dayStr = String(day).padStart(3, '0');
    const filePath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`  ${filePath} 생성 완료`);
  }

  // 2) 배치 파일 업데이트
  console.log('\n=== 배치 파일 업데이트 ===');
  const batch = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));

  for (const { day, content, index } of contents) {
    const batchItem = wrapBatchItem(day, content.subArea, content);
    batch.items[index] = batchItem;
    console.log(`  items[${index}] (Day ${day}) 교체 완료`);
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batch, null, 2), 'utf8');
  console.log(`  ${BATCH_PATH} 저장 완료`);

  console.log('\n=== 작업 완료 ===');
}

main();
