// 일일독해 러셀1 Day 76~80 콘텐츠 빌더 스크립트
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
  if (!para) throw new Error(`단락 ${pid}을(를) 찾을 수 없습니다.`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText.substring(0, 30)}..." 을(를) ${pid}에서 찾을 수 없습니다.`);
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

function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 1) + '…';
}

function shuffleChoices(choices, answerId) {
  // 정답 텍스트 보존하면서 셔플
  const answerText = choices.find(c => c.id === answerId).text;
  const arr = [...choices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = hashIdx(arr[i].text + String(i)) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const newAnswerId = arr.find(c => c.text === answerText).id;
  return { choices: arr, answerId: newAnswerId };
}

// 정독 타임라인 빌더: 문장별 하이라이트 + 4지선다, 문단 끝에 문단 전체 하이라이트 + 중심내용
function buildTimeline(paragraphs, questionsPerPara) {
  const timeline = [];
  let stepNum = 1;
  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);
    const qs = questionsPerPara[pi];
    sents.forEach((sent, si) => {
      if (si >= qs.sentences.length) return;
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
    // 문단 전체 하이라이트 + 중심내용
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

// 복기 카드 생성 - 전체 텍스트를 정확히 8장으로 분할
function buildRecallCards(paragraphs, count = 8) {
  const fullText = paragraphs.map(p => p.text).join(' ');
  const totalLen = fullText.length;
  const chunkSize = Math.floor(totalLen / count);
  const cards = [];
  for (let i = 0; i < count; i++) {
    const start = i * chunkSize;
    const end = i === count - 1 ? totalLen : (i + 1) * chunkSize;
    cards.push({ id: `c${i + 1}`, text: fullText.substring(start, end) });
  }
  return {
    cards,
    correctOrder: cards.map(c => c.id),
    seedPenalty: 1
  };
}

// 콘텐츠 래퍼 생성
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

// ════════════════════════════════════════
// Day 76 — 문학 (LITERATURE)
// 주제: 김소월 「진달래꽃」 - 이별의 정한
// ════════════════════════════════════════
function buildDay76() {
  const paragraphs = [
    {
      id: 'p1',
      text: '김소월은 한국 현대시의 대표적 서정 시인으로, 전통적 율격과 한국적 정서를 결합하여 독자적인 시 세계를 구축하였다. 그는 1902년 평안북도 구성에서 태어나 오산학교에서 스승 김억의 영향을 받으며 시 창작을 시작하였다. 그의 대표작 「진달래꽃」은 1925년 시집 『진달래꽃』에 수록된 작품으로, 떠나는 임을 앞에 두고 화자가 보이는 태도를 통해 이별의 정한을 형상화하고 있다. 이 시에서 화자는 사랑하는 사람이 떠난다 하더라도 말없이 보내 주겠다고 말하며, 영변 약산의 진달래꽃을 한 아름 꺾어 가시는 길에 뿌리겠다는 의지를 표현한다. 이처럼 이별 앞에서 체념하는 듯한 자세를 취하면서도 내면에서는 깊은 슬픔과 미련을 품고 있다는 점이 이 시의 정서적 핵심이다.'
    },
    {
      id: 'p2',
      text: '「진달래꽃」의 문학적 특징 가운데 하나는 역설적 표현의 활용이다. 화자는 임이 떠나는 상황에서 눈물을 흘리지 않겠다고 선언하면서도, 꽃을 뿌리는 행위 자체가 이별의 슬픔을 상징적으로 드러낸다. 또한 나 보기가 역겨워 가실 때에는이라는 시구에서 역겨워라는 극단적 표현을 사용함으로써 오히려 화자의 간절한 사랑을 강조하는 효과를 거둔다. 이러한 역설은 직접적으로 슬픔을 토로하는 것보다 더 강렬한 감정의 울림을 만들어 낸다. 특히 마지막 연에서 죽어도 아니 눈물 흘리오리다라는 결의에 찬 표현은 극도의 자기 억제를 통해 역설적으로 가장 깊은 슬픔을 전달하며 독자의 공감을 이끌어 낸다.'
    },
    {
      id: 'p3',
      text: '이 시가 오랫동안 사랑받는 이유는 한국적 정서인 정한을 탁월하게 포착했기 때문이다. 정한이란 깊은 슬픔을 안으로 삭이면서도 겉으로는 의연한 모습을 보이는 한국 특유의 정서적 태도를 가리킨다. 화자는 떠나는 임에게 원망이나 비난 대신 꽃을 뿌려 주겠다는 헌신적 자세를 취함으로써 한국 전통 여성상의 인내와 사랑을 형상화한다. 또한 진달래꽃이라는 소재는 봄철 산야에 흔하게 피어나는 꽃으로, 소박하면서도 아름다운 한국의 자연과 정서를 상징한다. 김소월은 민요 특유의 반복과 리듬을 현대시에 접목하여 구어적 자연스러움과 시적 긴장감을 동시에 확보하였으며, 이는 한국어의 음악성을 가장 효과적으로 살린 성취로 평가받고 있다. 이러한 이유로 「진달래꽃」은 한국인이 가장 사랑하는 시 가운데 하나로 꼽힌다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 76 지문 길이: ${total}자`);

  const questionsPerPara = [
    { // p1 — 5문장
      sentences: [
        { prompt: '김소월의 시 세계의 특징으로 적절한 것은?',
          choices: ['전통적 율격과 한국적 정서를 결합하여 독자적인 세계를 구축하였다.', '서양 모더니즘 기법을 도입하여 실험적인 형식을 추구하였다.', '사회 비판적 주제를 직설적 어조로 표현하는 데 주력하였다.', '자연과학적 관찰을 바탕으로 객관적 묘사를 중시하였다.'],
          answerId: 'A' },
        { prompt: '김소월의 시 창작에 영향을 준 스승은 누구인가?',
          choices: ['오산학교에서 가르침을 받은 김억이다.', '연희전문학교에서 지도한 이광수이다.', '서울에서 만난 문인 한용운이다.', '일본 유학 시절 알게 된 정지용이다.'],
          answerId: 'A' },
        { prompt: '「진달래꽃」에서 화자가 형상화하고자 하는 감정은?',
          choices: ['미래에 대한 희망과 기대감이다.', '이별의 정한이다.', '타인에 대한 분노와 저항이다.', '자연 속에서의 평온한 안식이다.'],
          answerId: 'B' },
        { prompt: '화자가 진달래꽃을 가시는 길에 뿌리겠다고 한 이유로 적절한 것은?',
          choices: ['떠나는 임에 대한 원망을 표현하기 위해서이다.', '임이 돌아올 길을 표시해 두기 위해서이다.', '이별 앞에서 자신의 사랑을 상징적으로 전달하기 위해서이다.', '꽃을 팔아 경제적 이익을 얻기 위해서이다.'],
          answerId: 'C' },
        { prompt: '이 시의 정서적 핵심으로 가장 적절한 것은?',
          choices: ['체념하는 듯하면서도 내면에 깊은 슬픔과 미련을 품고 있다는 점이다.', '이별을 당연하게 받아들이고 새 출발을 다짐하는 태도이다.', '적극적으로 임의 마음을 돌리려는 설득의 자세이다.', '이별 상황에서 분노를 폭발시키는 격렬한 감정이다.'],
          answerId: 'A' }
      ],
      paraCenter: {
        choices: ['김소월의 시적 특징과 「진달래꽃」의 이별 정서를 소개하고 있다.', '진달래꽃의 생태학적 특성과 분포 지역을 설명하고 있다.', '한국 현대시의 발전 과정을 시대순으로 정리하고 있다.', '김소월의 생애와 가족 관계를 상세히 서술하고 있다.'],
        answerId: 'A'
      }
    },
    { // p2 — 5문장
      sentences: [
        { prompt: '「진달래꽃」의 문학적 특징으로 제시된 것은?',
          choices: ['역설적 표현의 활용이다.', '사실주의적 묘사의 철저함이다.', '과학적 용어의 적극적 도입이다.', '외래어 혼용을 통한 국제적 감각이다.'],
          answerId: 'A' },
        { prompt: '꽃을 뿌리는 행위가 상징적으로 드러내는 것은?',
          choices: ['축제의 기쁨과 환희이다.', '이별의 슬픔이다.', '자연에 대한 경외감이다.', '경제적 풍요에 대한 소망이다.'],
          answerId: 'B' },
        { prompt: '역겨워라는 극단적 표현이 거두는 효과로 적절한 것은?',
          choices: ['임에 대한 증오를 직접적으로 전달하는 효과이다.', '오히려 화자의 간절한 사랑을 강조하는 효과이다.', '독자에게 불쾌감을 주어 관심을 유도하는 효과이다.', '사실적 상황 묘사를 통한 현장감 전달의 효과이다.'],
          answerId: 'B' },
        { prompt: '역설적 표현이 직접적 감정 토로보다 나은 점은?',
          choices: ['더 강렬한 감정의 울림을 만들어 낸다.', '독자가 내용을 쉽게 이해하도록 돕는다.', '작품의 분량을 효과적으로 늘릴 수 있다.', '다른 문학 장르로의 변환이 용이해진다.'],
          answerId: 'A' },
        { prompt: '마지막 연의 표현이 전달하는 감정으로 적절한 것은?',
          choices: ['이별에 대한 무관심과 초연한 태도이다.', '극도의 자기 억제를 통해 가장 깊은 슬픔을 전달한다.', '새로운 만남에 대한 설렘과 기대감이다.', '임에 대한 원한과 복수심이다.'],
          answerId: 'B' }
      ],
      paraCenter: {
        choices: ['「진달래꽃」에 나타난 역설적 표현과 그 문학적 효과를 분석하고 있다.', '김소월 시의 출판 과정과 문단 반응을 정리하고 있다.', '한국 현대시에서 역설이 사용된 모든 작품을 나열하고 있다.', '이별 시의 역사적 변천을 시대별로 고찰하고 있다.'],
        answerId: 'A'
      }
    },
    { // p3 — 5문장
      sentences: [
        { prompt: '이 시가 오랫동안 사랑받는 이유로 제시된 것은?',
          choices: ['서양 문학의 영향을 충실히 반영했기 때문이다.', '한국적 정서인 정한을 탁월하게 포착했기 때문이다.', '파격적인 형식 실험으로 문단에 충격을 주었기 때문이다.', '정치적 메시지를 효과적으로 전달했기 때문이다.'],
          answerId: 'B' },
        { prompt: '정한이라는 정서의 의미로 적절한 것은?',
          choices: ['깊은 슬픔을 안으로 삭이면서 겉으로는 의연한 태도를 보이는 것이다.', '억눌린 분노를 격렬하게 표출하는 감정적 폭발이다.', '타인의 고통에 무관심한 냉담한 태도를 가리킨다.', '모든 감정을 이성으로 통제하려는 합리적 자세이다.'],
          answerId: 'A' },
        { prompt: '화자가 꽃을 뿌려 주겠다는 헌신이 형상화하는 것은?',
          choices: ['한국 전통 여성상의 인내와 사랑이다.', '남성 화자의 강인한 의지와 결단이다.', '현대 사회에서의 양성평등 의식이다.', '종교적 희생과 구원의 이미지이다.'],
          answerId: 'A' },
        { prompt: '진달래꽃이라는 소재가 상징하는 것으로 적절한 것은?',
          choices: ['소박하면서도 아름다운 한국의 자연과 정서이다.', '부유함과 사치스러운 삶의 가치관이다.', '도시 문명의 발전과 근대화의 열망이다.', '권력과 지위를 향한 야심의 표상이다.'],
          answerId: 'A' },
        { prompt: '김소월이 민요 리듬을 접목하여 확보한 것으로 적절한 것은?',
          choices: ['구어적 자연스러움과 시적 긴장감을 동시에 확보하였다.', '학술적 논문에 적합한 객관적 서술 방식을 완성하였다.', '외국어 번역에 유리한 범용적 문체를 개발하였다.', '산문 형식의 서사 구조를 시에 도입하는 데 성공하였다.'],
          answerId: 'A' },
        { prompt: '「진달래꽃」의 위상으로 적절한 것은?',
          choices: ['한국인이 가장 사랑하는 시 가운데 하나로 꼽힌다.', '해외에서만 높이 평가받고 국내에서는 알려지지 않았다.', '발표 당시에는 주목받지 못하고 사후에 재발견되었다.', '문학 전문가들만 읽는 난해한 시로 분류된다.'],
          answerId: 'A' }
      ],
      paraCenter: {
        choices: ['「진달래꽃」이 사랑받는 이유와 정한의 정서, 민요적 리듬의 효과를 설명하고 있다.', '한국 민요의 종류와 각 지역별 특징을 분류하고 있다.', '진달래꽃의 재배 방법과 활용 사례를 소개하고 있다.', '김소월 이후 한국 시단의 흐름을 개괄하고 있다.'],
        answerId: 'A'
      }
    }
  ];

  const timeline = buildTimeline(paragraphs, questionsPerPara);
  const intensive = { timeline };
  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '「진달래꽃」이 수록된 시집의 출간 연도는?',
        answerRanges: [findRange(paragraphs, 'p1', '1925년')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '화자가 꺾어 뿌리겠다고 한 꽃이 피는 장소는?',
        answerRanges: [findRange(paragraphs, 'p1', '영변 약산')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '꽃을 뿌리는 행위가 상징적으로 드러내는 감정은?',
        answerRanges: [findRange(paragraphs, 'p2', '이별의 슬픔')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '마지막 연에서 화자의 결의를 담은 표현은?',
        answerRanges: [findRange(paragraphs, 'p2', '죽어도 아니 눈물 흘리오리다')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '이 시가 포착한 한국적 정서를 무엇이라 하나요?',
        answerRanges: [findRange(paragraphs, 'p3', '정한')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '김소월이 현대시에 접목한 전통적 요소는?',
        answerRanges: [findRange(paragraphs, 'p3', '민요 특유의 반복과 리듬')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      }
    ]
  };

  return assembleFull({
    dayIndex: 76,
    subArea: 'LITERATURE',
    paragraphs,
    intensive,
    recall,
    confirm
  });
}

// ════════════════════════════════════════
// Day 77 — 비문학 (NONFICTION)
// 주제: 생태계의 먹이 사슬과 에너지 흐름
// ════════════════════════════════════════
function buildDay77() {
  const paragraphs = [
    {
      id: 'p1',
      text: '생태계에서 생물들은 먹이 사슬을 통해 서로 연결되어 있으며, 이 사슬을 따라 에너지가 한 단계에서 다음 단계로 이동한다. 먹이 사슬의 출발점은 식물과 같은 생산자이다. 생산자는 태양 에너지를 이용하여 광합성을 통해 유기물을 스스로 만들어 내며, 이 과정에서 생성된 유기물이 생태계 전체의 에너지원이 된다. 생산자가 만든 유기물은 초식 동물인 일차 소비자에게 전달되고, 일차 소비자는 다시 이차 소비자에게 먹히면서 에너지가 이동한다. 이처럼 에너지는 생산자에서 최종 소비자까지 일방향으로 흐르는 특성을 지니며, 각 단계를 거칠 때마다 에너지의 일부가 열로 소실되어 상위 단계로 갈수록 이용 가능한 에너지의 총량이 줄어든다.'
    },
    {
      id: 'p2',
      text: '먹이 사슬에서 에너지의 전달 효율은 대체로 10퍼센트 정도에 불과하다. 이는 한 영양 단계의 생물이 보유한 에너지 가운데 약 10퍼센트만이 다음 영양 단계의 생물에게 전달된다는 뜻이다. 나머지 90퍼센트는 생물의 생명 활동에 사용되거나 열에너지의 형태로 환경에 방출된다. 이러한 에너지 전달의 비효율성 때문에 먹이 사슬의 단계 수는 보통 네다섯 단계를 넘기 어렵다. 만약 에너지의 전달 효율이 더 높다면 먹이 사슬은 더 많은 단계로 이루어질 수 있겠으나, 현실에서는 상위 포식자에게 도달하는 에너지가 극히 적어 개체 수도 제한된다. 이러한 원리를 시각적으로 나타낸 것이 생태 피라미드이며, 피라미드의 아래쪽에는 생산자가, 위쪽에는 최종 소비자가 위치한다.'
    },
    {
      id: 'p3',
      text: '먹이 사슬은 단순한 일직선 구조가 아니라 복잡하게 얽혀 있는 먹이 그물의 형태를 띠는 경우가 많다. 하나의 종이 여러 종류의 먹이를 먹고, 동시에 여러 종류의 포식자에게 먹히기 때문이다. 이러한 복잡한 관계는 생태계의 안정성을 높이는 역할을 한다. 어떤 종의 개체 수가 급격히 줄어들더라도 다른 먹이를 이용할 수 있는 대안이 있기 때문에 전체 시스템이 쉽게 무너지지 않는 것이다. 그러나 핵심종이라 불리는 특정 종이 사라지면 먹이 그물 전체가 크게 흔들릴 수 있다. 예를 들어 바다에서 해달의 개체 수가 급감하면 성게가 폭발적으로 증가하여 해조류 숲이 파괴되고, 이는 다시 수많은 해양 생물의 서식지 상실로 이어진다. 따라서 생태계의 균형을 유지하기 위해서는 먹이 그물의 구조와 핵심종의 역할을 이해하는 일이 필수적이다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 77 지문 길이: ${total}자`);

  const questionsPerPara = [
    { // p1 — 5문장
      sentences: [
        { prompt: '생태계에서 생물들이 서로 연결되는 방식은?',
          choices: ['먹이 사슬을 통해 연결되며 에너지가 이동한다.', '공기 순환을 통해 연결되며 산소가 공유된다.', '지각 변동을 통해 연결되며 서식지가 변화한다.', '인공적 통로를 통해 연결되며 유전자가 교환된다.'],
          answerId: 'A' },
        { prompt: '먹이 사슬의 출발점에 해당하는 생물은?',
          choices: ['최종 소비자인 대형 포식 동물이다.', '식물과 같은 생산자이다.', '세균과 같은 분해자이다.', '초식 동물인 일차 소비자이다.'],
          answerId: 'B' },
        { prompt: '생산자가 유기물을 만드는 과정은 무엇인가?',
          choices: ['태양 에너지를 이용한 광합성이다.', '토양의 무기물을 직접 흡수하는 과정이다.', '다른 생물을 분해하여 양분을 얻는 과정이다.', '물의 증발을 이용한 수분 순환이다.'],
          answerId: 'A' },
        { prompt: '일차 소비자에서 이차 소비자로의 에너지 이동 방식은?',
          choices: ['일차 소비자가 이차 소비자에게 먹히면서 에너지가 이동한다.', '일차 소비자가 죽어 자연 분해되면서 에너지가 전달된다.', '이차 소비자가 광합성을 통해 스스로 에너지를 생산한다.', '일차 소비자와 이차 소비자가 에너지를 교환한다.'],
          answerId: 'A' },
        { prompt: '상위 단계로 갈수록 에너지 총량이 줄어드는 이유는?',
          choices: ['각 단계에서 에너지 일부가 열로 소실되기 때문이다.', '상위 단계의 생물이 에너지를 저장하지 않기 때문이다.', '태양 에너지가 상위 단계까지 직접 도달하기 때문이다.', '생산자가 에너지를 의도적으로 제한하기 때문이다.'],
          answerId: 'A' }
      ],
      paraCenter: {
        choices: ['먹이 사슬의 개념과 에너지가 일방향으로 흐르며 감소하는 원리를 설명하고 있다.', '생산자의 광합성 과정을 화학식과 함께 상세히 기술하고 있다.', '초식 동물과 육식 동물의 신체 구조 차이를 비교하고 있다.', '생태계에서 인간이 차지하는 위치와 역할을 논의하고 있다.'],
        answerId: 'A'
      }
    },
    { // p2 — 6문장
      sentences: [
        { prompt: '먹이 사슬에서 에너지 전달 효율은 대략 얼마인가?',
          choices: ['약 50퍼센트이다.', '약 10퍼센트이다.', '약 30퍼센트이다.', '약 90퍼센트이다.'],
          answerId: 'B' },
        { prompt: '에너지 전달 효율 10퍼센트가 의미하는 바는?',
          choices: ['한 단계의 에너지 중 10퍼센트만 다음 단계에 전달된다.', '전체 에너지의 10퍼센트가 열로 소실된다.', '생산자가 총 에너지의 10퍼센트를 저장한다.', '최종 소비자가 에너지의 10퍼센트를 환경에 돌려준다.'],
          answerId: 'A' },
        { prompt: '나머지 90퍼센트의 에너지가 사용되는 방식은?',
          choices: ['생물의 생명 활동에 쓰이거나 열에너지로 방출된다.', '토양에 저장되어 다음 세대로 전달된다.', '다른 영양 단계의 생물에게 분배된다.', '대기 중 이산화탄소로 전환되어 축적된다.'],
          answerId: 'A' },
        { prompt: '먹이 사슬의 단계 수가 제한되는 이유는?',
          choices: ['에너지 전달의 비효율성 때문이다.', '생물 종의 수가 절대적으로 부족하기 때문이다.', '지구의 면적이 한정되어 있기 때문이다.', '모든 생물이 같은 먹이를 먹기 때문이다.'],
          answerId: 'A' },
        { prompt: '상위 포식자의 개체 수가 제한되는 까닭은?',
          choices: ['도달하는 에너지가 극히 적기 때문이다.', '포식자 사이의 경쟁이 없기 때문이다.', '서식지가 한정되어 있기 때문이다.', '인간의 사냥으로 인해 줄어들기 때문이다.'],
          answerId: 'A' },
        { prompt: '에너지 전달 원리를 시각적으로 나타낸 것은?',
          choices: ['생태 피라미드이다.', '먹이 그물 지도이다.', '생물 분류 계통도이다.', '유전자 지도이다.'],
          answerId: 'A' }
      ],
      paraCenter: {
        choices: ['에너지 전달 효율과 먹이 사슬 단계 제한의 원리를 설명하고 있다.', '생태 피라미드의 종류와 작성 방법을 안내하고 있다.', '생산자와 소비자의 개체 수를 구체적으로 비교하고 있다.', '에너지 보존 법칙의 물리학적 원리를 증명하고 있다.'],
        answerId: 'A'
      }
    },
    { // p3 — 7문장
      sentences: [
        { prompt: '먹이 사슬이 실제로 띠는 형태는?',
          choices: ['복잡하게 얽힌 먹이 그물의 형태이다.', '완전히 독립적인 여러 개의 직선 구조이다.', '순환하는 고리 형태이다.', '피라미드 모양의 계층 구조이다.'],
          answerId: 'A' },
        { prompt: '먹이 그물이 형성되는 이유는?',
          choices: ['하나의 종이 여러 먹이를 먹고 여러 포식자에게 먹히기 때문이다.', '모든 종이 하나의 먹이만을 섭취하기 때문이다.', '포식자와 피식자가 항상 일대일로 대응하기 때문이다.', '생물 종의 수가 매우 적기 때문이다.'],
          answerId: 'A' },
        { prompt: '복잡한 먹이 관계가 생태계에 미치는 영향은?',
          choices: ['생태계의 안정성을 높이는 역할을 한다.', '생태계를 더욱 불안정하게 만든다.', '생물 종의 다양성을 감소시킨다.', '에너지 전달 효율을 크게 높인다.'],
          answerId: 'A' },
        { prompt: '특정 종의 개체 수 감소에도 전체 시스템이 유지되는 이유는?',
          choices: ['다른 먹이를 이용할 수 있는 대안이 있기 때문이다.', '생태계가 자동으로 새로운 종을 만들어 내기 때문이다.', '모든 종이 서로 독립적으로 살아가기 때문이다.', '인간이 즉시 개입하여 복원하기 때문이다.'],
          answerId: 'A' },
        { prompt: '핵심종이 사라지면 생태계에 어떤 일이 벌어지나?',
          choices: ['먹이 그물 전체가 크게 흔들릴 수 있다.', '다른 종이 즉시 그 역할을 대신한다.', '생태계에 아무런 변화가 일어나지 않는다.', '새로운 핵심종이 자동으로 등장한다.'],
          answerId: 'A' },
        { prompt: '해달 개체 수 급감이 초래하는 연쇄적 결과는?',
          choices: ['성게 증가로 해조류 숲이 파괴되고 서식지가 상실된다.', '해조류가 폭발적으로 성장하여 바다가 녹색으로 변한다.', '해양 생물의 종류가 오히려 다양해진다.', '바다의 수온이 급격히 상승한다.'],
          answerId: 'A' },
        { prompt: '생태계 균형 유지를 위해 필수적인 것은?',
          choices: ['먹이 그물의 구조와 핵심종의 역할을 이해하는 일이다.', '모든 포식자를 제거하여 초식 동물을 보호하는 일이다.', '인공적으로 새로운 먹이 사슬을 만드는 일이다.', '생산자의 수를 무한히 늘리는 일이다.'],
          answerId: 'A' }
      ],
      paraCenter: {
        choices: ['먹이 그물의 복잡성과 핵심종의 역할이 생태계 안정성에 미치는 영향을 설명하고 있다.', '바다 생태계의 모든 생물 종을 목록으로 정리하고 있다.', '해달의 생태와 행동 양식을 상세히 분석하고 있다.', '인간 활동이 먹이 사슬에 미치는 긍정적 영향을 강조하고 있다.'],
        answerId: 'A'
      }
    }
  ];

  const timeline = buildTimeline(paragraphs, questionsPerPara);
  const intensive = { timeline };
  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '먹이 사슬의 출발점이 되는 생물의 종류는?',
        answerRanges: [findRange(paragraphs, 'p1', '생산자')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '에너지가 각 단계를 거칠 때 소실되는 형태는?',
        answerRanges: [findRange(paragraphs, 'p1', '열로 소실')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '한 영양 단계에서 다음 단계로 전달되는 에너지 비율은?',
        answerRanges: [findRange(paragraphs, 'p2', '약 10퍼센트')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '에너지 전달 원리를 시각적으로 나타낸 도구는?',
        answerRanges: [findRange(paragraphs, 'p2', '생태 피라미드')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '생태계 안정성을 높이는 먹이 구조의 형태는?',
        answerRanges: [findRange(paragraphs, 'p3', '먹이 그물')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '사라지면 먹이 그물 전체가 흔들릴 수 있는 종을 무엇이라 하나?',
        answerRanges: [findRange(paragraphs, 'p3', '핵심종')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q7',
        prompt: '해달 감소 시 폭발적으로 증가하는 해양 생물은?',
        answerRanges: [findRange(paragraphs, 'p3', '성게')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      }
    ]
  };

  return assembleFull({
    dayIndex: 77,
    subArea: 'NONFICTION',
    paragraphs,
    intensive,
    recall,
    confirm
  });
}

// ════════════════════════════════════════
// Day 78 — 문학 (LITERATURE)
// 주제: 황순원 「소나기」 - 순수한 사랑과 자연
// ════════════════════════════════════════
function buildDay78() {
  const paragraphs = [
    {
      id: 'p1',
      text: '황순원의 단편 소설 「소나기」는 1953년에 발표된 작품으로, 시골 마을을 배경으로 소년과 소녀 사이의 순수한 만남과 이별을 그리고 있다. 황순원은 1915년에 태어나 일본 와세다 대학에서 영문학을 전공하였으며, 간결하고 서정적인 문체로 한국 단편 소설의 전범을 이루었다는 평가를 받는 작가이다. 소년은 개울가에서 빨래를 하던 소녀를 처음 만나게 되며, 시간이 흐르면서 둘은 들판과 논길을 함께 걸으며 자연스럽게 가까워진다. 소녀는 도시에서 시골 할아버지 댁으로 온 아이로, 소년과는 다른 세계에서 자란 인물이다. 이러한 배경의 차이에도 불구하고 두 아이는 맑고 순수한 감정으로 교류하며, 이들의 관계는 어른 세계의 이해관계나 계산과는 무관한 순결한 우정이자 사랑으로 형상화된다.'
    },
    {
      id: 'p2',
      text: '작품에서 핵심적인 장면은 소년과 소녀가 들길을 걷다가 갑자기 쏟아지는 소나기를 만나는 대목이다. 두 아이는 비를 피하기 위해 수숫단 사이에 몸을 숨기게 되며, 이때 소녀가 소년의 등에 대고 기대는 장면은 이 소설에서 가장 순수하고 아름다운 순간으로 꼽힌다. 소나기라는 자연 현상은 예고 없이 쏟아졌다가 금방 그치는 특성을 지니는데, 이는 소년과 소녀 사이의 만남 역시 짧고 갑작스럽게 끝나리라는 것을 암시하는 복선의 역할을 한다. 또한 비에 젖은 소녀의 모습과 젖은 수숫잎 사이로 비치는 햇살은 아름다우면서도 곧 사라질 것에 대한 아련한 정서를 불러일으킨다.'
    },
    {
      id: 'p3',
      text: '이 소설의 결말에서 소녀는 병을 앓다가 세상을 떠나며, 죽기 전에 자신이 입었던 옷을 그대로 묻어 달라는 유언을 남긴다. 그 옷은 소나기를 맞을 때 소년과 함께 있던 날 입었던 옷이다. 이 유언은 소녀가 소년과의 순수한 추억을 영원히 간직하고 싶었음을 보여 주는 상징적 장치이다. 소년은 소녀의 죽음을 나중에 전해 듣게 되며, 이로써 두 사람의 만남은 다시 돌아올 수 없는 지나간 시간으로 확정된다. 황순원은 감정을 직접 서술하지 않고 행동과 상황 묘사를 통해 인물의 심리를 간접적으로 전달하는 기법을 사용하였다. 이러한 절제된 문체는 독자가 스스로 감정을 채워 넣도록 유도하여 오히려 더 깊은 여운을 남기며, 「소나기」가 한국 단편 소설의 걸작으로 평가받는 핵심 요인 가운데 하나이다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 78 지문 길이: ${total}자`);

  const questionsPerPara = [
    { // p1 — 5문장
      sentences: [
        { prompt: '「소나기」가 발표된 연도와 배경으로 적절한 것은?',
          choices: ['1953년에 발표되었으며 시골 마을이 배경이다.', '1945년에 발표되었으며 도시가 배경이다.', '1960년에 발표되었으며 바닷가가 배경이다.', '1930년에 발표되었으며 산속 마을이 배경이다.'],
          answerId: 'A' },
        { prompt: '황순원의 문체에 대한 평가로 적절한 것은?',
          choices: ['간결하고 서정적인 문체로 한국 단편 소설의 전범을 이루었다.', '화려하고 장식적인 문체로 대중적 인기를 얻었다.', '실험적이고 난해한 문체로 문단의 논쟁을 불러일으켰다.', '구어체를 그대로 살린 사실적 문체가 특징이다.'],
          answerId: 'A' },
        { prompt: '소년과 소녀가 가까워지는 과정으로 적절한 것은?',
          choices: ['들판과 논길을 함께 걸으며 자연스럽게 가까워진다.', '학교에서 같은 반이 되면서 친구가 된다.', '이웃 어른의 소개로 만나 인사를 나눈다.', '시장에서 우연히 마주쳐 대화를 시작한다.'],
          answerId: 'A' },
        { prompt: '소녀의 출신 배경으로 적절한 것은?',
          choices: ['도시에서 시골 할아버지 댁으로 온 아이이다.', '시골에서 태어나 줄곧 마을에서 자란 아이이다.', '외국에서 돌아온 유학생이다.', '고아원에서 자란 아이이다.'],
          answerId: 'A' },
        { prompt: '두 아이의 관계가 형상화되는 방식으로 적절한 것은?',
          choices: ['어른 세계의 이해관계와 무관한 순결한 우정이자 사랑이다.', '경제적 이해관계에 기반한 실용적 관계이다.', '경쟁과 갈등으로 점철된 대립적 관계이다.', '부모의 강요에 의한 형식적 관계이다.'],
          answerId: 'A' }
      ],
      paraCenter: {
        choices: ['「소나기」의 배경과 소년·소녀의 순수한 만남을 소개하고 있다.', '황순원의 생애와 문학관을 시대순으로 정리하고 있다.', '1950년대 한국 농촌의 경제 상황을 분석하고 있다.', '소설에 등장하는 자연물의 생태학적 특성을 설명하고 있다.'],
        answerId: 'A'
      }
    },
    { // p2 — 4문장
      sentences: [
        { prompt: '핵심 장면에서 두 아이가 겪는 자연 현상은?',
          choices: ['갑자기 쏟아지는 소나기를 만난다.', '갑작스러운 폭설을 맞이한다.', '강풍에 휩쓸릴 뻔한다.', '홍수로 인해 길이 막힌다.'],
          answerId: 'A' },
        { prompt: '수숫단 사이에서 소녀가 보인 행동으로 적절한 것은?',
          choices: ['소년의 등에 대고 기대는 행동이다.', '소년에게 노래를 불러 주는 행동이다.', '비를 맞으며 혼자 뛰어가는 행동이다.', '소년에게 우산을 빌려 주는 행동이다.'],
          answerId: 'A' },
        { prompt: '소나기가 상징적으로 암시하는 것은?',
          choices: ['두 아이의 만남이 짧고 갑작스럽게 끝날 것이라는 복선이다.', '두 아이의 우정이 영원히 지속될 것이라는 약속이다.', '시골 생활의 풍요로움을 상징하는 장치이다.', '계절의 변화를 알리는 시간적 배경 장치이다.'],
          answerId: 'A' },
        { prompt: '비에 젖은 장면이 불러일으키는 정서는?',
          choices: ['아름다우면서도 곧 사라질 것에 대한 아련한 정서이다.', '공포와 불안의 정서이다.', '축제 분위기의 흥겨운 정서이다.', '분노와 좌절의 격렬한 정서이다.'],
          answerId: 'A' }
      ],
      paraCenter: {
        choices: ['소나기 장면의 상징성과 순수한 사랑의 순간을 분석하고 있다.', '한국 기후의 특성과 소나기의 기상학적 원인을 설명하고 있다.', '수수 농사의 재배 과정과 수확 방법을 안내하고 있다.', '소설에서 비가 등장하는 다른 작품들을 열거하고 있다.'],
        answerId: 'A'
      }
    },
    { // p3 — 6문장
      sentences: [
        { prompt: '소녀가 세상을 떠나기 전에 남긴 유언은?',
          choices: ['입었던 옷을 그대로 묻어 달라는 것이다.', '소년에게 편지를 전해 달라는 것이다.', '고향 마을에 돌아가서 묻어 달라는 것이다.', '자신의 일기장을 불태워 달라는 것이다.'],
          answerId: 'A' },
        { prompt: '그 옷이 특별한 의미를 지니는 이유는?',
          choices: ['소나기를 맞을 때 소년과 함께 있던 날 입었던 옷이기 때문이다.', '소녀의 어머니가 직접 만들어 준 옷이기 때문이다.', '시골에서 가장 비싼 옷이기 때문이다.', '소년이 선물로 준 옷이기 때문이다.'],
          answerId: 'A' },
        { prompt: '이 유언이 보여 주는 소녀의 마음은?',
          choices: ['소년과의 순수한 추억을 영원히 간직하고 싶었다는 것이다.', '물질적 집착이 강한 소녀의 성격을 보여 준다.', '부모에 대한 원망의 마음을 표현한 것이다.', '시골 생활에 대한 미련이 크다는 것이다.'],
          answerId: 'A' },
        { prompt: '소년이 소녀의 죽음을 알게 되는 방식은?',
          choices: ['나중에 전해 듣게 된다.', '소녀가 직접 편지로 알려 준다.', '병원에서 소녀의 임종을 지켜본다.', '마을 어른이 즉시 알려 준다.'],
          answerId: 'A' },
        { prompt: '황순원이 사용한 심리 전달 기법으로 적절한 것은?',
          choices: ['행동과 상황 묘사를 통해 간접적으로 심리를 전달하는 기법이다.', '화자의 독백을 통해 심리를 직접 서술하는 기법이다.', '편지 형식을 통해 인물의 생각을 전달하는 기법이다.', '작가가 직접 개입하여 인물의 심리를 설명하는 기법이다.'],
          answerId: 'A' },
        { prompt: '절제된 문체가 독자에게 미치는 효과는?',
          choices: ['독자가 감정을 채워 넣도록 유도하여 더 깊은 여운을 남긴다.', '독자에게 명확한 답을 제시하여 이해를 돕는다.', '긴장감을 고조시켜 공포의 분위기를 조성한다.', '유머를 통해 즐거운 독서 경험을 제공한다.'],
          answerId: 'A' }
      ],
      paraCenter: {
        choices: ['소녀의 유언과 절제된 문체가 「소나기」의 문학적 가치를 높이는 요인임을 설명하고 있다.', '황순원의 다른 대표작들을 시대순으로 소개하고 있다.', '한국 단편 소설의 역사적 발전 과정을 개괄하고 있다.', '소녀의 병명과 치료 과정을 상세히 기술하고 있다.'],
        answerId: 'A'
      }
    }
  ];

  const timeline = buildTimeline(paragraphs, questionsPerPara);
  const intensive = { timeline };
  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '「소나기」가 발표된 연도는?',
        answerRanges: [findRange(paragraphs, 'p1', '1953년')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '두 아이가 비를 피해 숨은 장소는?',
        answerRanges: [findRange(paragraphs, 'p2', '수숫단 사이')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '소나기가 상징적으로 암시하는 만남의 특성은?',
        answerRanges: [findRange(paragraphs, 'p2', '짧고 갑작스럽게 끝나리라는')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '소녀가 죽기 전에 남긴 유언의 내용은?',
        answerRanges: [findRange(paragraphs, 'p3', '옷을 그대로 묻어 달라')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '황순원이 인물의 심리를 전달하는 방식은?',
        answerRanges: [findRange(paragraphs, 'p3', '행동과 상황 묘사를 통해')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '절제된 문체가 독자에게 남기는 효과는?',
        answerRanges: [findRange(paragraphs, 'p3', '더 깊은 여운을 남기며')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      }
    ]
  };

  return assembleFull({
    dayIndex: 78,
    subArea: 'LITERATURE',
    paragraphs,
    intensive,
    recall,
    confirm
  });
}

// ════════════════════════════════════════
// Day 79 — 비문학 (NONFICTION)
// 주제: 인공지능과 기계 학습의 원리
// ════════════════════════════════════════
function buildDay79() {
  const paragraphs = [
    {
      id: 'p1',
      text: '인공지능이란 인간의 지능이 수행하는 학습, 추론, 판단 등의 과정을 컴퓨터 프로그램으로 구현한 기술을 말한다. 인공지능 연구는 1950년대에 시작되었으며, 초기에는 사람이 직접 규칙을 프로그래밍하여 컴퓨터가 문제를 풀도록 하는 방식이 주류를 이루었다. 그러나 이러한 규칙 기반 접근법은 복잡한 현실 세계의 문제를 처리하는 데 한계를 보였고, 이를 극복하기 위해 기계 학습이라는 새로운 방법이 등장하였다. 기계 학습은 컴퓨터가 대량의 데이터를 분석하여 스스로 패턴을 발견하고 규칙을 도출하도록 하는 기술이다. 이 방식은 사람이 모든 규칙을 일일이 지정할 필요가 없다는 점에서 기존 방식과 근본적으로 다르며, 오늘날 인공지능 기술 발전의 핵심 원동력이 되고 있다.'
    },
    {
      id: 'p2',
      text: '기계 학습은 크게 지도 학습, 비지도 학습, 강화 학습의 세 가지 유형으로 나뉜다. 지도 학습은 정답이 포함된 데이터를 컴퓨터에 제공하여 입력과 출력 사이의 관계를 학습하도록 하는 방식이다. 예를 들어 수천 장의 고양이 사진과 그에 대한 정답 표지를 제공하면, 컴퓨터는 고양이의 특징을 스스로 파악하여 새로운 사진에서도 고양이를 식별할 수 있게 된다. 비지도 학습은 정답 없이 데이터의 내재적 구조와 패턴을 스스로 발견하도록 하는 방식으로, 고객 분류나 이상 탐지 등에 활용된다. 강화 학습은 보상과 벌칙이라는 신호를 통해 컴퓨터가 시행착오를 거치며 최적의 행동을 학습하는 방식이며, 게임 인공지능이나 로봇 제어 등에서 뛰어난 성과를 보이고 있다.'
    },
    {
      id: 'p3',
      text: '기계 학습의 발전은 우리 생활 곳곳에 변화를 가져오고 있다. 음성 인식 기술은 사람의 말을 문자로 변환하여 스마트폰의 음성 비서 서비스를 가능하게 만들었다. 번역 서비스는 수백만 건의 번역 데이터를 학습하여 과거보다 훨씬 자연스러운 문장을 생성할 수 있게 되었다. 의료 분야에서는 엑스레이나 시티 촬영 영상을 분석하여 질환을 조기에 발견하는 데 기계 학습이 활용되고 있다. 그러나 인공지능의 발전에는 과제도 남아 있다. 학습 데이터에 편향이 포함되면 결과 역시 편향될 수 있으며, 인공지능이 내린 판단의 근거를 사람이 이해하기 어려운 문제도 존재한다. 따라서 인공지능 기술을 올바르게 활용하기 위해서는 기술적 이해뿐 아니라 윤리적 기준과 사회적 합의를 함께 마련해야 한다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 79 지문 길이: ${total}자`);

  const questionsPerPara = [
    { // p1 — 5문장
      sentences: [
        { prompt: '인공지능의 정의로 적절한 것은?',
          choices: ['인간 지능의 학습·추론·판단 과정을 컴퓨터로 구현한 기술이다.', '인간의 신체적 능력을 기계로 대체하는 기술이다.', '자연 현상을 관찰하고 기록하는 과학적 방법이다.', '로봇이 스스로 에너지를 생산하는 기술이다.'],
          answerId: 'A' },
        { prompt: '초기 인공지능 연구의 주류 방식은?',
          choices: ['사람이 규칙을 프로그래밍하여 문제를 풀도록 하는 방식이다.', '컴퓨터가 스스로 규칙을 만들도록 하는 방식이다.', '인간 뇌를 직접 컴퓨터에 연결하는 방식이다.', '동물의 행동을 모방하는 로봇을 제작하는 방식이다.'],
          answerId: 'A' },
        { prompt: '규칙 기반 접근법의 한계로 적절한 것은?',
          choices: ['복잡한 현실 세계의 문제를 처리하는 데 한계를 보였다.', '단순한 계산 문제에도 적용이 불가능했다.', '프로그래밍 언어를 사용할 수 없었다.', '전력 소모가 지나치게 커서 사용이 불가능했다.'],
          answerId: 'A' },
        { prompt: '기계 학습의 핵심 특징으로 적절한 것은?',
          choices: ['대량의 데이터를 분석하여 스스로 패턴을 발견한다.', '사람이 모든 규칙을 미리 프로그래밍해야 한다.', '소량의 데이터만으로 완벽한 결과를 도출한다.', '인터넷 연결 없이도 작동할 수 있다.'],
          answerId: 'A' },
        { prompt: '기계 학습이 기존 방식과 근본적으로 다른 점은?',
          choices: ['사람이 모든 규칙을 지정할 필요가 없다는 점이다.', '계산 속도가 기존보다 느려졌다는 점이다.', '하드웨어 없이 소프트웨어만으로 작동한다는 점이다.', '오직 텍스트 데이터만 처리할 수 있다는 점이다.'],
          answerId: 'A' }
      ],
      paraCenter: {
        choices: ['인공지능의 정의와 기계 학습이 등장하게 된 배경을 설명하고 있다.', '인공지능의 역사를 1950년대부터 현재까지 연대기적으로 정리하고 있다.', '컴퓨터 프로그래밍 언어의 종류와 특징을 비교하고 있다.', '규칙 기반 인공지능의 성공 사례를 열거하고 있다.'],
        answerId: 'A'
      }
    },
    { // p2 — 5문장
      sentences: [
        { prompt: '기계 학습의 세 가지 유형으로 적절한 것은?',
          choices: ['지도 학습, 비지도 학습, 강화 학습이다.', '입력 학습, 출력 학습, 순환 학습이다.', '관찰 학습, 실험 학습, 반복 학습이다.', '수동 학습, 능동 학습, 자동 학습이다.'],
          answerId: 'A' },
        { prompt: '지도 학습의 방식으로 적절한 것은?',
          choices: ['정답이 포함된 데이터를 제공하여 관계를 학습하도록 한다.', '정답 없이 데이터의 구조를 스스로 파악하도록 한다.', '보상과 벌칙을 통해 시행착오로 학습하도록 한다.', '인간이 직접 규칙을 지정하여 처리하도록 한다.'],
          answerId: 'A' },
        { prompt: '고양이 사진 예시가 보여 주는 학습 방식은?',
          choices: ['정답 표지를 통해 특징을 파악하는 지도 학습이다.', '정답 없이 유사한 사진을 분류하는 비지도 학습이다.', '보상 신호를 통해 최적의 선택을 찾는 강화 학습이다.', '규칙을 직접 프로그래밍하는 전통적 방식이다.'],
          answerId: 'A' },
        { prompt: '비지도 학습이 활용되는 분야로 적절한 것은?',
          choices: ['고객 분류나 이상 탐지 등이다.', '게임 인공지능이나 로봇 제어이다.', '음성 인식이나 번역 서비스이다.', '의료 영상 판독이나 질환 진단이다.'],
          answerId: 'A' },
        { prompt: '강화 학습이 뛰어난 성과를 보이는 분야는?',
          choices: ['게임 인공지능이나 로봇 제어 등이다.', '고객 분류나 이상 탐지 등이다.', '문서 요약이나 키워드 추출이다.', '날씨 예보나 기후 변화 분석이다.'],
          answerId: 'A' }
      ],
      paraCenter: {
        choices: ['기계 학습의 세 가지 유형과 각각의 특징 및 활용 분야를 설명하고 있다.', '지도 학습만의 장단점을 심층적으로 분석하고 있다.', '인공지능이 인간의 일자리를 대체하는 문제를 논의하고 있다.', '기계 학습에 필요한 컴퓨터 하드웨어의 사양을 안내하고 있다.'],
        answerId: 'A'
      }
    },
    { // p3 — 7문장
      sentences: [
        { prompt: '기계 학습의 발전이 가져온 변화의 범위는?',
          choices: ['우리 생활 곳곳에 변화를 가져오고 있다.', '오직 산업 현장에서만 변화를 일으키고 있다.', '아직까지 실생활에는 적용되지 않고 있다.', '군사 분야에만 한정적으로 활용되고 있다.'],
          answerId: 'A' },
        { prompt: '음성 인식 기술이 가능하게 만든 서비스는?',
          choices: ['스마트폰의 음성 비서 서비스이다.', '자동차의 자율 주행 기능이다.', '공장의 로봇 조립 공정이다.', '은행의 온라인 송금 서비스이다.'],
          answerId: 'A' },
        { prompt: '번역 서비스의 발전 원인으로 적절한 것은?',
          choices: ['수백만 건의 번역 데이터를 학습했기 때문이다.', '번역가가 직접 모든 규칙을 입력했기 때문이다.', '하나의 언어만 집중 학습했기 때문이다.', '문법 규칙만으로 번역이 이루어지기 때문이다.'],
          answerId: 'A' },
        { prompt: '의료 분야에서 기계 학습이 활용되는 방식은?',
          choices: ['영상을 분석하여 질환을 조기에 발견하는 데 활용된다.', '환자의 식단을 자동으로 관리하는 데 활용된다.', '수술 로봇을 원격으로 조종하는 데 활용된다.', '약품의 유통 기한을 관리하는 데 활용된다.'],
          answerId: 'A' },
        { prompt: '인공지능 발전에 남아 있는 과제로 적절한 것은?',
          choices: ['학습 데이터의 편향이 결과에 영향을 미칠 수 있다.', '인공지능의 계산 속도가 아직 너무 느리다.', '데이터 저장 공간이 절대적으로 부족하다.', '프로그래밍 언어가 아직 개발되지 않았다.'],
          answerId: 'A' },
        { prompt: '인공지능 판단의 근거와 관련된 문제는?',
          choices: ['판단 근거를 사람이 이해하기 어려운 문제가 있다.', '판단이 항상 정확하여 문제가 전혀 없다.', '판단 과정이 너무 단순하여 신뢰도가 낮다.', '판단 결과를 저장할 공간이 부족한 문제가 있다.'],
          answerId: 'A' },
        { prompt: '인공지능을 올바르게 활용하기 위해 필요한 것은?',
          choices: ['기술적 이해와 함께 윤리적 기준과 사회적 합의가 필요하다.', '기술 개발에만 집중하면 모든 문제가 해결된다.', '법적 규제를 전면 폐지해야 한다.', '인공지능 사용을 전면 금지해야 한다.'],
          answerId: 'A' }
      ],
      paraCenter: {
        choices: ['기계 학습의 실생활 활용 사례와 인공지능 발전의 과제 및 윤리적 고려를 설명하고 있다.', '인공지능이 인간보다 우수한 이유를 증명하고 있다.', '음성 인식 기술의 프로그래밍 과정을 상세히 기술하고 있다.', '의료 인공지능의 법적 지위에 대한 논쟁을 정리하고 있다.'],
        answerId: 'A'
      }
    }
  ];

  const timeline = buildTimeline(paragraphs, questionsPerPara);
  const intensive = { timeline };
  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '인공지능 연구가 시작된 시기는?',
        answerRanges: [findRange(paragraphs, 'p1', '1950년대')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '기계 학습의 핵심 특징은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p1', '스스로 패턴을 발견하고 규칙을 도출')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '기계 학습의 세 가지 유형은?',
        answerRanges: [findRange(paragraphs, 'p2', '지도 학습, 비지도 학습, 강화 학습')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '강화 학습이 뛰어난 성과를 보이는 분야는?',
        answerRanges: [findRange(paragraphs, 'p2', '게임 인공지능이나 로봇 제어')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '학습 데이터에 편향이 포함되면 어떤 문제가 생기나?',
        answerRanges: [findRange(paragraphs, 'p3', '결과 역시 편향될 수 있으며')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '인공지능을 올바르게 활용하기 위해 기술과 함께 마련해야 할 것은?',
        answerRanges: [findRange(paragraphs, 'p3', '윤리적 기준과 사회적 합의')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      }
    ]
  };

  return assembleFull({
    dayIndex: 79,
    subArea: 'NONFICTION',
    paragraphs,
    intensive,
    recall,
    confirm
  });
}

// ════════════════════════════════════════
// Day 80 — 문학 (LITERATURE)
// 주제: 이육사 「광야」 - 저항 의지와 미래 전망
// ════════════════════════════════════════
function buildDay80() {
  const paragraphs = [
    {
      id: 'p1',
      text: '이육사는 일제 강점기의 대표적인 저항 시인으로, 강인한 의지와 미래에 대한 희망을 시로 노래한 인물이다. 그의 본명은 이원록이며, 대구 형무소에서의 수감 번호인 264를 따서 이육사라는 필명을 사용하였다. 그는 평생 독립운동에 헌신하면서 시를 통해 민족의 정신을 고양하는 데 힘썼다. 이육사의 대표작 「광야」는 1946년 유고 시집에 수록된 작품으로, 까마득한 날에 하늘이 처음 열리고 어디 닭 우는 소리 들렸으리라는 시구로 시작한다. 이 시는 한반도의 까마득한 태초부터 미래의 해방된 세계까지를 조망하며, 암울한 현실 속에서도 민족의 밝은 미래를 굳건히 믿는 화자의 의지를 형상화하고 있다.'
    },
    {
      id: 'p2',
      text: '「광야」에서 가장 주목할 만한 시적 기법은 시간의 확장과 공간의 상징화이다. 시의 전반부에서 화자는 까마득한 날이라는 표현을 통해 역사 이전의 원시적 시간으로 거슬러 올라간다. 이어서 매운 계절의 채찍에 갈겨라는 시구에서 매운 계절은 일제의 가혹한 탄압을 은유하며, 채찍이라는 단어는 고통의 감각을 생생하게 전달한다. 한편 광야라는 공간은 황량하고 텅 빈 벌판을 뜻하지만, 이 시에서는 억압의 시대를 견딘 뒤 마침내 열릴 광활한 자유의 땅을 상징한다. 이처럼 이육사는 시간적으로는 태초에서 미래까지, 공간적으로는 억압에서 자유까지를 아우르는 거대한 시적 구도를 통해 민족 전체의 서사를 한 편의 시에 응축시키고 있다.'
    },
    {
      id: 'p3',
      text: '「광야」의 마지막 연에서 화자는 백마 타고 오는 초인이 등장할 것이라고 노래한다. 여기서 초인은 민족을 해방시킬 위대한 존재 또는 해방 그 자체를 상징하는 것으로 해석된다. 이 초인의 등장은 화자의 희망이자 신념이며, 아무리 오랜 고난이 계속되더라도 반드시 자유의 날이 올 것이라는 확신의 표현이다. 이육사 시의 가장 큰 특징은 절망에 굴하지 않는 불굴의 정신이 시 전체를 관통한다는 점이다. 그의 시에는 슬픔이나 탄식보다는 단단한 결의와 비장한 기개가 담겨 있으며, 이는 독자에게 깊은 감동과 용기를 전해 준다. 이육사는 끝내 광복을 보지 못하고 1944년 베이징 감옥에서 순국하였지만, 그의 시 세계는 어둠 속에서도 빛을 향한 의지를 잃지 않는 인간 정신의 고귀함을 증명하는 문학적 유산으로 남아 있다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 80 지문 길이: ${total}자`);

  const questionsPerPara = [
    { // p1 — 5문장
      sentences: [
        { prompt: '이육사의 시 세계의 특징으로 적절한 것은?',
          choices: ['강인한 의지와 미래에 대한 희망을 노래하였다.', '자연의 아름다움을 서정적으로 묘사하였다.', '사회 풍자와 해학을 주된 기법으로 삼았다.', '도시 생활의 소외와 고독을 형상화하였다.'],
          answerId: 'A' },
        { prompt: '이육사라는 필명의 유래로 적절한 것은?',
          choices: ['대구 형무소 수감 번호 264에서 따온 것이다.', '고향 마을의 이름에서 유래한 것이다.', '존경하는 스승의 이름을 딴 것이다.', '일본 유학 시절 동료가 지어 준 것이다.'],
          answerId: 'A' },
        { prompt: '이육사가 시를 통해 힘쓴 바는?',
          choices: ['민족의 정신을 고양하는 데 힘썼다.', '한국어 문법 체계를 정리하는 데 힘썼다.', '외국 문학을 번역하여 소개하는 데 힘썼다.', '대중 문화를 비판하는 데 힘썼다.'],
          answerId: 'A' },
        { prompt: '「광야」가 수록된 곳과 시기로 적절한 것은?',
          choices: ['1946년 유고 시집에 수록되었다.', '1930년대 문예지에 처음 발표되었다.', '1950년대 교과서에 처음 수록되었다.', '1920년대 동인지에 발표되었다.'],
          answerId: 'A' },
        { prompt: '「광야」가 형상화하는 화자의 의지는?',
          choices: ['암울한 현실 속에서도 밝은 미래를 굳건히 믿는 의지이다.', '현실에서 도피하여 자연 속에서 안식을 찾으려는 소망이다.', '과거의 영화로운 시절을 그리워하는 향수이다.', '외국으로 이주하여 새 삶을 시작하려는 결심이다.'],
          answerId: 'A' }
      ],
      paraCenter: {
        choices: ['이육사의 생애와 「광야」의 주제 의식을 소개하고 있다.', '일제 강점기 독립운동의 구체적 방법론을 설명하고 있다.', '1940년대 한국 시단의 전체적 흐름을 정리하고 있다.', '이육사와 다른 저항 시인들의 작품 목록을 나열하고 있다.'],
        answerId: 'A'
      }
    },
    { // p2 — 5문장
      sentences: [
        { prompt: '「광야」에서 주목할 만한 시적 기법은?',
          choices: ['시간의 확장과 공간의 상징화이다.', '의성어와 의태어의 반복적 사용이다.', '일상적 구어체를 활용한 친근한 어조이다.', '서양 시의 각운 체계를 차용한 형식 실험이다.'],
          answerId: 'A' },
        { prompt: '까마득한 날이라는 표현이 뜻하는 시간은?',
          choices: ['역사 이전의 원시적 시간이다.', '시인이 태어난 구체적 날짜이다.', '일제 강점이 시작된 해이다.', '해방 직후의 시간이다.'],
          answerId: 'A' },
        { prompt: '매운 계절이 은유하는 대상은?',
          choices: ['일제의 가혹한 탄압이다.', '겨울의 추위와 한파이다.', '농촌의 고된 노동이다.', '청춘의 방황과 고민이다.'],
          answerId: 'A' },
        { prompt: '광야라는 공간이 이 시에서 상징하는 것은?',
          choices: ['억압의 시대를 견딘 뒤 열릴 광활한 자유의 땅이다.', '농사를 짓기에 적합한 비옥한 토지이다.', '전쟁으로 황폐해진 폐허의 땅이다.', '인간이 접근할 수 없는 미지의 영역이다.'],
          answerId: 'A' },
        { prompt: '이육사가 시적 구도를 통해 응축시킨 것은?',
          choices: ['민족 전체의 서사를 한 편의 시에 담아낸 것이다.', '한 개인의 사적 감정을 일기체로 기록한 것이다.', '특정 지역의 풍경을 사실적으로 묘사한 것이다.', '다른 시인의 작품을 패러디하여 재해석한 것이다.'],
          answerId: 'A' }
      ],
      paraCenter: {
        choices: ['「광야」의 시간 확장과 공간 상징화 기법을 분석하고 있다.', '일제 강점기의 문화 정책을 연대기적으로 서술하고 있다.', '광야라는 지리적 개념의 과학적 정의를 제시하고 있다.', '이육사의 다른 작품들과 비교하여 우열을 평가하고 있다.'],
        answerId: 'A'
      }
    },
    { // p3 — 6문장
      sentences: [
        { prompt: '마지막 연에서 등장할 것이라고 노래한 존재는?',
          choices: ['백마 타고 오는 초인이다.', '해를 품고 오는 봉황이다.', '바다를 건너오는 선비이다.', '하늘에서 내려오는 천사이다.'],
          answerId: 'A' },
        { prompt: '초인이 상징하는 것으로 적절한 것은?',
          choices: ['민족을 해방시킬 위대한 존재 또는 해방 그 자체이다.', '종교적 구원자로서의 신적 존재이다.', '외국에서 돌아오는 유학생을 의미한다.', '시인 자신의 분신을 상징한다.'],
          answerId: 'A' },
        { prompt: '초인의 등장이 표현하는 것은?',
          choices: ['반드시 자유의 날이 올 것이라는 확신이다.', '현실에서의 도피를 꿈꾸는 허무주의이다.', '과거로의 회귀를 바라는 복고적 심리이다.', '개인적 성공에 대한 야심의 표현이다.'],
          answerId: 'A' },
        { prompt: '이육사 시의 가장 큰 특징으로 적절한 것은?',
          choices: ['절망에 굴하지 않는 불굴의 정신이 시 전체를 관통한다.', '유머와 풍자가 작품의 중심을 이룬다.', '일상적 소재를 통한 따뜻한 서정이 주조를 이룬다.', '외래어와 한자어를 많이 사용하여 학문적 분위기를 조성한다.'],
          answerId: 'A' },
        { prompt: '이육사 시에 담긴 정서로 적절한 것은?',
          choices: ['단단한 결의와 비장한 기개가 담겨 있다.', '깊은 슬픔과 체념이 지배적이다.', '밝은 유머와 해학이 넘쳐흐른다.', '차가운 냉소와 비꼼이 주를 이룬다.'],
          answerId: 'A' },
        { prompt: '이육사의 순국 장소와 시기로 적절한 것은?',
          choices: ['1944년 베이징 감옥에서 순국하였다.', '1945년 서울 감옥에서 순국하였다.', '1943년 도쿄 형무소에서 순국하였다.', '1946년 대구 형무소에서 순국하였다.'],
          answerId: 'A' }
      ],
      paraCenter: {
        choices: ['초인의 상징적 의미와 이육사 시의 불굴의 정신, 문학적 유산을 설명하고 있다.', '이육사의 독립운동 활동을 시간순으로 나열하고 있다.', '「광야」의 출판 과정과 판매 부수를 상세히 기록하고 있다.', '이육사와 윤동주의 시 세계를 비교 분석하고 있다.'],
        answerId: 'A'
      }
    }
  ];

  const timeline = buildTimeline(paragraphs, questionsPerPara);
  const intensive = { timeline };
  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '이육사라는 필명은 어디에서 유래하였나요?',
        answerRanges: [findRange(paragraphs, 'p1', '수감 번호인 264')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '「광야」가 수록된 시집의 종류는?',
        answerRanges: [findRange(paragraphs, 'p1', '유고 시집')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '매운 계절이 은유하는 대상은?',
        answerRanges: [findRange(paragraphs, 'p2', '일제의 가혹한 탄압')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '광야가 상징하는 것은 무엇인가요?',
        answerRanges: [findRange(paragraphs, 'p2', '광활한 자유의 땅')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '마지막 연에서 등장하는 존재는?',
        answerRanges: [findRange(paragraphs, 'p3', '백마 타고 오는 초인')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '이육사가 순국한 장소는 어디인가요?',
        answerRanges: [findRange(paragraphs, 'p3', '베이징 감옥')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q7',
        prompt: '이육사 시에 담긴 정서적 특질은?',
        answerRanges: [findRange(paragraphs, 'p3', '단단한 결의와 비장한 기개')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      }
    ]
  };

  return assembleFull({
    dayIndex: 80,
    subArea: 'LITERATURE',
    paragraphs,
    intensive,
    recall,
    confirm
  });
}

// ════════════════════════════════════════
// 메인 실행
// ════════════════════════════════════════
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const BATCH_PATH = path.join(ROOT, 'generated', 'daily-batch-reading-russell1.json');
  const STATIC_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'russell1');

  console.log('=== 러셀1 Day 76~80 콘텐츠 빌드 시작 ===\n');

  // 콘텐츠 빌드
  const day76 = buildDay76();
  const day77 = buildDay77();
  const day78 = buildDay78();
  const day79 = buildDay79();
  const day80 = buildDay80();

  const contents = [
    { day: 76, content: day76, subArea: 'LITERATURE' },
    { day: 77, content: day77, subArea: 'NONFICTION' },
    { day: 78, content: day78, subArea: 'LITERATURE' },
    { day: 79, content: day79, subArea: 'NONFICTION' },
    { day: 80, content: day80, subArea: 'LITERATURE' }
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

    // 확인 문제 revealOnWrong, answerMatchMode, scoring 확인
    for (const q of content.payload.confirm.questions) {
      if (q.answerMatchMode !== 'ANY') {
        console.log(`    [오류] ${q.id} answerMatchMode가 ANY가 아님!`);
        hasError = true;
      }
      if (q.revealOnWrong !== true) {
        console.log(`    [오류] ${q.id} revealOnWrong가 true가 아님!`);
        hasError = true;
      }
      if (q.scoring.correctDeltaSec !== 30 || q.scoring.wrongDeltaSec !== -45) {
        console.log(`    [오류] ${q.id} scoring 값이 올바르지 않음!`);
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

  for (const { day, content, subArea } of contents) {
    const batchItem = wrapBatchItem(day, subArea, content);
    // day_index로 기존 아이템 찾아서 교체
    const idx = batch.items.findIndex(it => it.day_index === day);
    if (idx !== -1) {
      batch.items[idx] = batchItem;
      console.log(`  items[${idx}] (Day ${day}) 교체 완료`);
    } else {
      console.log(`  [경고] Day ${day} 아이템을 배치 파일에서 찾을 수 없음. 끝에 추가합니다.`);
      batch.items.push(batchItem);
    }
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batch, null, 2), 'utf8');
  console.log(`  ${BATCH_PATH} 저장 완료`);

  console.log('\n=== 작업 완료 ===');
}

main();
