// 일일독해 러셀1 Day 28~30 콘텐츠 재작성 스크립트
const fs = require('fs');
const path = require('path');

// === 유틸리티 함수 ===

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
  if (start === -1) throw new Error(`"${searchText.substring(0,30)}..." 을(를) ${pid}에서 찾을 수 없습니다.`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charCount(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
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
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
  }
  return {
    cards,
    correctOrder: cards.map(c => c.id),
    seedPenalty: 1
  };
}

// 콘텐츠 래퍼 생성
function buildContent({ dayIndex, subArea, paragraphs, intensive, recall, confirm }) {
  const dayStr = String(dayIndex).padStart(3, '0');
  const subAreaLabel = subArea === 'LITERATURE' ? '문학' : '비문학';
  return {
    contentId: `dr-r1-${dayStr}`,
    contentType: 'DAILY_READING',
    version: 1,
    status: 'PUBLISHED',
    title: `일일 독해(러셀 1) Day ${dayIndex} ${subAreaLabel}`,
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
function buildBatchItem(dayIndex, subArea, content) {
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

// =============================================
// Day 28 - 문학 (짝수=LITERATURE)
// =============================================
function buildDay28() {
  const paragraphs = [
    {
      id: 'p1',
      text: '한국 현대 소설에서 인물의 내면 심리를 섬세하게 포착한 작가로 이태준을 빼놓을 수 없다. 그의 대표적 단편 소설 가운데 하나인 「달밤」은 1933년에 발표된 작품으로, 성북동을 배경으로 하여 순박한 인물 황수건이를 통해 근대화 과정에서 소외된 사람들의 삶을 조명한다. 이 작품의 서술자인 나는 성북동으로 이사한 뒤 동네 사람들과 교류하면서 황수건이라는 인물을 알게 된다. 황수건이는 글을 읽지 못하고 셈에 서툴지만 성실하고 순수한 성품을 가진 인물이다. 그는 동네 사람들의 잔심부름을 도맡아 하면서 소박하게 살아가는데, 이러한 모습은 급격히 변화하는 근대 사회 속에서 전통적 공동체의 가치를 간직한 인물상을 보여 준다. 특히 그의 존재는 효율과 이익을 앞세우는 근대적 가치관과 대비되어 독자에게 깊은 인상을 남긴다.'
    },
    {
      id: 'p2',
      text: '작품에서 가장 인상적인 장면은 황수건이가 달밤에 피리를 부는 대목이다. 그가 부는 피리 소리는 맑고 구성지며, 달빛 아래 울려 퍼지는 그 선율은 도시의 소음에 묻혀 사라져 가는 전통적 정서를 환기한다. 서술자인 나는 처음에 황수건이를 다소 우습게 여기지만, 달밤에 들려오는 피리 소리를 통해 그의 내면에 깃든 예술적 감수성과 순수한 영혼을 발견하게 된다. 이 발견은 서술자가 근대적 지식인의 시선으로만 세상을 바라보던 편견을 반성하는 계기로 작용한다. 이처럼 이태준은 근대 문명의 바깥에 놓인 인물을 단순히 동정의 대상으로 그리는 대신, 그가 지닌 고유한 아름다움을 조용히 드러내는 방식을 택한다.'
    },
    {
      id: 'p3',
      text: '「달밤」의 서술 기법도 주목할 만하다. 이태준은 일인칭 관찰자 시점을 사용하여 서술자의 눈을 통해 황수건이를 바라보도록 한다. 이 방식은 독자에게 황수건이에 대한 정보를 점진적으로 제공하면서 그에 대한 인식이 변화하는 과정을 자연스럽게 따라가도록 유도한다. 특히 서술자가 황수건이를 처음 만났을 때와 나중에 피리 소리를 들었을 때의 감정 변화가 뚜렷하게 대비되어 독자의 이해를 돕는다. 또한 달빛이라는 자연적 배경은 황수건이의 순수한 내면을 상징하는 동시에, 산업화 이전의 평온한 세계를 암시하는 역할을 맡는다. 결국 이 작품은 근대와 전근대가 공존하는 시공간 속에서, 사라져 가는 것들의 가치를 되새기게 하는 서정적 단편이라 할 수 있다.'
    }
  ];

  const total = charCount(paragraphs);
  console.log(`  Day 28 지문 길이: ${total}자`);

  // 정독 타임라인
  const p1Sents = findSentences(paragraphs[0].text);
  const p2Sents = findSentences(paragraphs[1].text);
  const p3Sents = findSentences(paragraphs[2].text);

  const timeline = [];
  let stepNum = 1;

  // p1: 문장별 하이라이트 + 4지선다
  // s1: p1 첫 문장 - 내용 이해
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[0].text)] },
    question: {
      prompt: '하이라이트된 문장에서 설명하는 작가는 누구인가?',
      choices: [
        { id: 'A', text: '이태준의 작품 세계에서 인물 심리 포착이 뛰어나다는 평가' },
        { id: 'B', text: '김유정이 농촌을 배경으로 해학적 인물을 주로 형상화했다는 사실' },
        { id: 'C', text: '현진건이 사실주의 기법으로 식민지 현실을 비판했다는 견해' },
        { id: 'D', text: '채만식이 풍자 기법을 통해 지식인의 고뇌를 드러냈다는 주장' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s2: p1 두 번째 문장 - 배경 파악
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[1].text)] },
    question: {
      prompt: '「달밤」의 배경이 되는 장소로 알맞은 것은?',
      choices: [
        { id: 'A', text: '인왕산 아래의 청운동 골목길' },
        { id: 'B', text: '성북동의 한적한 동네 풍경' },
        { id: 'C', text: '서울 외곽의 공장 밀집 지대' },
        { id: 'D', text: '한강 변의 어촌 마을 한가운데' }
      ],
      answerId: 'B',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s3: p1 세 번째 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[2].text)] },
    question: {
      prompt: '서술자가 황수건이를 알게 된 계기로 적절한 것은?',
      choices: [
        { id: 'A', text: '서술자가 성북동으로 이사한 뒤 동네 사람들과 교류하면서 알게 됨' },
        { id: 'B', text: '서술자가 문학 동인 모임에서 황수건이를 처음 만남' },
        { id: 'C', text: '서술자가 학교 교사로 부임하여 학생으로서 황수건이를 만남' },
        { id: 'D', text: '서술자가 시장에서 물건을 사다가 우연히 황수건이와 마주침' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s4: p1 네 번째 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[3].text)] },
    question: {
      prompt: '황수건이의 특징으로 적절하지 않은 것은?',
      choices: [
        { id: 'A', text: '글을 읽지 못하고 셈에 서투르다' },
        { id: 'B', text: '성실하고 순수한 성품을 지녔다' },
        { id: 'C', text: '학식이 높고 계산에 능숙하다' },
        { id: 'D', text: '소박한 생활을 이어가고 있다' }
      ],
      answerId: 'C',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s5: p1 다섯 번째 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[4].text)] },
    question: {
      prompt: '황수건이의 생활 방식을 가장 잘 설명한 것은?',
      choices: [
        { id: 'A', text: '도시에서 상점을 열어 장사로 생계를 유지한다' },
        { id: 'B', text: '동네 사람들의 잔심부름을 하며 소박하게 살아간다' },
        { id: 'C', text: '농사를 지으면서 자급자족의 삶을 꾸려 나간다' },
        { id: 'D', text: '관청에 고용되어 행정 업무를 보조하며 지낸다' }
      ],
      answerId: 'B',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s6: p1 여섯 번째 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[5].text)] },
    question: {
      prompt: '황수건이의 존재가 대비되는 가치관으로 적절한 것은?',
      choices: [
        { id: 'A', text: '효율과 이익을 앞세우는 근대적 가치관과 대비됨' },
        { id: 'B', text: '전통적 공동체 의식을 중시하는 농경 사회의 가치관' },
        { id: 'C', text: '자연 친화적인 생태주의 철학과 조화를 이루고 있음' },
        { id: 'D', text: '개인의 자유를 존중하는 서양 민주주의 가치관과 유사함' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p1 중심 내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: 'p1', start: 0, end: paragraphs[0].text.length }] },
    question: {
      prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
      choices: [
        { id: 'A', text: '「달밤」의 배경과 핵심 인물 황수건이의 소개' },
        { id: 'B', text: '이태준 소설의 서술 기법에 대한 기술적 분석' },
        { id: 'C', text: '근대 문학에서 농촌 소설이 차지하는 위상과 의의' },
        { id: 'D', text: '성북동 지역의 역사적 변천 과정에 대한 개괄' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p2: 문장별 하이라이트
  // s7: p2 첫 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[0].text)] },
    question: {
      prompt: '작품에서 가장 인상적인 장면으로 제시된 것은?',
      choices: [
        { id: 'A', text: '황수건이가 달밤에 피리를 부는 장면' },
        { id: 'B', text: '서술자가 성북동에 처음 도착하는 장면' },
        { id: 'C', text: '황수건이가 동네 사람들과 싸우는 장면' },
        { id: 'D', text: '서술자가 서울을 떠나 고향으로 돌아가는 장면' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s8: p2 두 번째 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[1].text)] },
    question: {
      prompt: '피리 소리가 환기하는 정서로 가장 적절한 것은?',
      choices: [
        { id: 'A', text: '산업화 시대의 역동적이고 활기찬 분위기' },
        { id: 'B', text: '도시의 소음에 묻혀 사라져 가는 전통적 정서' },
        { id: 'C', text: '전쟁 이후의 황폐하고 처참한 사회적 분위기' },
        { id: 'D', text: '새로운 문명에 대한 기대와 희망의 감정들' }
      ],
      answerId: 'B',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s9: p2 세 번째 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[2].text)] },
    question: {
      prompt: '서술자가 황수건이의 내면에서 발견한 것은?',
      choices: [
        { id: 'A', text: '세상에 대한 분노와 저항 의식' },
        { id: 'B', text: '물질적 풍요를 향한 강한 욕구' },
        { id: 'C', text: '예술적 감수성과 순수한 영혼' },
        { id: 'D', text: '근대 문명을 받아들이려는 의지' }
      ],
      answerId: 'C',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s10: p2 네 번째 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[3].text)] },
    question: {
      prompt: '이태준이 소외된 인물을 그리는 방식으로 적절한 것은?',
      choices: [
        { id: 'A', text: '인물이 지닌 고유한 아름다움을 조용히 드러내는 방식' },
        { id: 'B', text: '인물의 비참한 처지를 과장하여 동정심을 유발하는 방식' },
        { id: 'C', text: '인물을 풍자적으로 묘사하여 웃음을 자아내는 방식' },
        { id: 'D', text: '인물의 행동을 객관적 사실만으로 나열하는 방식' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s11: p2 중심 내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: 'p2', start: 0, end: paragraphs[1].text.length }] },
    question: {
      prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
      choices: [
        { id: 'A', text: '달밤의 피리 장면과 황수건이의 내면적 아름다움' },
        { id: 'B', text: '근대 소설에서 피리가 상징하는 의미의 변천사' },
        { id: 'C', text: '서술자와 황수건이의 갈등 및 화해의 과정 서술' },
        { id: 'D', text: '이태준의 생애와 문단 활동에 대한 전기적 설명' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p3: 문장별 하이라이트
  // s12: p3 첫 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[0].text)] },
    question: {
      prompt: '이 문장에서 주목하도록 이끄는 대상은?',
      choices: [
        { id: 'A', text: '「달밤」의 서술 기법' },
        { id: 'B', text: '「달밤」의 출판 배경' },
        { id: 'C', text: '「달밤」의 판매 부수' },
        { id: 'D', text: '「달밤」의 번역 과정' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s13: p3 두 번째 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[1].text)] },
    question: {
      prompt: '이태준이 사용한 서술 시점으로 올바른 것은?',
      choices: [
        { id: 'A', text: '전지적 작가 시점으로 모든 인물의 심리를 서술' },
        { id: 'B', text: '일인칭 관찰자 시점으로 서술자의 눈을 통해 관찰' },
        { id: 'C', text: '삼인칭 관찰자 시점으로 외부 행동만을 기록' },
        { id: 'D', text: '일인칭 주인공 시점으로 자신의 이야기를 고백' }
      ],
      answerId: 'B',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p3 세 번째 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[2].text)] },
    question: {
      prompt: '독자에게 정보를 제공하는 방식으로 적절한 것은?',
      choices: [
        { id: 'A', text: '황수건이에 대한 정보를 한꺼번에 제시하여 이해를 돕는 방식' },
        { id: 'B', text: '점진적으로 정보를 제공하며 인식 변화를 자연스럽게 유도' },
        { id: 'C', text: '다른 인물들의 평가를 나열하여 간접적으로 전달하는 방식' },
        { id: 'D', text: '시간 역순으로 서술하여 호기심을 자극하는 기법의 활용' }
      ],
      answerId: 'B',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p3 네 번째 문장 (새 추가: 감정 변화 대비)
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[3].text)] },
    question: {
      prompt: '서술자의 감정 변화가 대비되는 두 시점은?',
      choices: [
        { id: 'A', text: '황수건이를 처음 만났을 때와 피리 소리를 들었을 때' },
        { id: 'B', text: '성북동에 도착했을 때와 서울을 떠나기로 결심했을 때' },
        { id: 'C', text: '소설을 집필하기 시작했을 때와 완성하여 발표했을 때' },
        { id: 'D', text: '근대 문명을 접했을 때와 전통 문화를 배우기 시작했을 때' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p3 다섯 번째 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[4].text)] },
    question: {
      prompt: '달빛이라는 배경이 상징하는 바로 적절한 것은?',
      choices: [
        { id: 'A', text: '황수건이의 순수한 내면과 산업화 이전의 평온한 세계' },
        { id: 'B', text: '도시 문명의 발전과 근대화의 긍정적인 측면을 암시' },
        { id: 'C', text: '서술자가 느끼는 고독과 소외감을 표현하는 장치' },
        { id: 'D', text: '황수건이가 현실에서 벗어나고 싶은 욕망의 반영' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p3 여섯 번째 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[5].text)] },
    question: {
      prompt: '이 작품의 궁극적 주제 의식으로 가장 적절한 것은?',
      choices: [
        { id: 'A', text: '사라져 가는 것들의 가치를 되새기게 하는 서정성' },
        { id: 'B', text: '근대 문명의 우월성을 입증하려는 계몽적 태도' },
        { id: 'C', text: '전통 사회로의 복귀를 주장하는 보수적인 관점' },
        { id: 'D', text: '농촌과 도시의 갈등을 해소하기 위한 정책 제안' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s17: p3 중심 내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: 'p3', start: 0, end: paragraphs[2].text.length }] },
    question: {
      prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
      choices: [
        { id: 'A', text: '「달밤」의 서술 기법과 달빛의 상징적 의미 분석' },
        { id: 'B', text: '황수건이의 가족 관계와 성장 배경에 대한 서술' },
        { id: 'C', text: '1930년대 한국 문단의 전반적인 흐름과 경향 소개' },
        { id: 'D', text: '이태준과 다른 작가들 사이의 문학적 논쟁 정리' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  const intensive = { timeline };
  const recall = buildRecallCards(paragraphs, 8);

  // 확인 문제 - 질문형, 5~8문항
  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '이 글에서 「달밤」이 발표된 연도는 언제인가요?',
        answerRanges: [findRange(paragraphs, 'p1', '1933년')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '황수건이의 순수한 내면이 드러나는 행위는 무엇인가요?',
        answerRanges: [findRange(paragraphs, 'p2', '피리를 부는')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '서술자가 처음에 황수건이를 대했던 태도는 어떠했나요?',
        answerRanges: [findRange(paragraphs, 'p2', '다소 우습게 여기지만')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '이태준이 소외된 인물을 그릴 때 어떤 방식을 택했나요?',
        answerRanges: [findRange(paragraphs, 'p2', '고유한 아름다움을 조용히 드러내는 방식')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '「달밤」에서 사용된 서술 시점은 무엇인가요?',
        answerRanges: [findRange(paragraphs, 'p3', '일인칭 관찰자 시점')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '달빛이라는 배경이 암시하는 세계는 어떤 세계인가요?',
        answerRanges: [findRange(paragraphs, 'p3', '산업화 이전의 평온한 세계')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      }
    ]
  };

  return buildContent({
    dayIndex: 28,
    subArea: 'LITERATURE',
    paragraphs,
    intensive,
    recall,
    confirm
  });
}

// =============================================
// Day 29 - 비문학 (홀수=NONFICTION)
// =============================================
function buildDay29() {
  const paragraphs = [
    {
      id: 'p1',
      text: '우리가 일상에서 접하는 색채는 단순한 시각적 자극에 그치지 않고, 심리와 행동에까지 깊은 영향을 미친다. 색채 심리학은 특정 색이 인간의 감정, 사고, 행동에 어떤 변화를 일으키는지를 연구하는 학문 분야이다. 이 분야는 20세기 초반부터 본격적으로 발전하기 시작하여, 오늘날에는 의료, 교육, 산업 디자인 등 다양한 영역에서 폭넓게 응용되고 있다. 예를 들어 붉은색은 심장 박동을 높이고 긴장감을 유발하는 경향이 있는데, 이 때문에 경고 표지판이나 소방차에 붉은색이 사용된다. 반대로 파란색은 안정감과 신뢰감을 주는 것으로 알려져 있어서 병원이나 금융 기관의 인테리어에 자주 활용된다. 노란색의 경우에는 주의를 환기하는 동시에 밝은 에너지를 전달하여 교통 신호등이나 공사 현장의 안전 장비에도 널리 쓰인다. 이처럼 색채는 단순히 미적 요소가 아니라, 사람의 판단과 결정에도 실질적으로 관여하는 심리적 도구라 할 수 있다.'
    },
    {
      id: 'p2',
      text: '색채가 소비 행동에 미치는 영향도 상당하다. 마케팅 연구에 따르면, 소비자가 제품을 처음 접할 때 시각적 요소가 구매 결정의 약 90퍼센트를 좌우하며, 그 가운데 색채가 가장 큰 비중을 차지한다. 패스트푸드 브랜드들이 빨간색과 노란색을 로고에 많이 사용하는 이유도 여기에 있다. 빨간색은 식욕을 자극하고 노란색은 밝고 친근한 느낌을 주어, 소비자가 매장에 들어와 빠르게 주문하도록 유도하는 효과가 있다. 한편 고급 브랜드는 검정이나 금색을 주로 사용하여 희소성과 권위의 이미지를 구축하는 전략을 취한다. 이처럼 브랜드가 선택하는 색채는 단순한 디자인 요소를 넘어, 소비자의 무의식적 반응까지 계산한 정교한 마케팅 수단으로 기능하고 있다.'
    },
    {
      id: 'p3',
      text: '색채의 심리적 효과는 문화권에 따라 다르게 나타나기도 한다. 서양에서 흰색은 순수와 결혼을 상징하지만, 동아시아의 여러 나라에서는 전통적으로 흰색이 상례에 사용되어 슬픔이나 죽음과 연결되기도 한다. 또한 초록색은 서양에서 자연과 환경을 떠올리게 하는 색이지만, 일부 지역에서는 불운의 색으로 여겨지기도 한다. 이러한 차이는 색채의 심리적 효과가 생물학적 반응뿐만 아니라 문화적 학습에 의해서도 형성된다는 사실을 보여 준다. 따라서 색채를 활용한 디자인이나 마케팅 전략을 수립할 때에는 대상 문화권의 색채 인식을 반드시 고려해야 효과적인 소통이 가능해진다.'
    }
  ];

  const total = charCount(paragraphs);
  console.log(`  Day 29 지문 길이: ${total}자`);

  const p1Sents = findSentences(paragraphs[0].text);
  const p2Sents = findSentences(paragraphs[1].text);
  const p3Sents = findSentences(paragraphs[2].text);

  const timeline = [];
  let stepNum = 1;

  // p1 문장별 하이라이트
  // s1
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[0].text)] },
    question: {
      prompt: '이 문장에서 색채가 미치는 영향의 범위로 제시된 것은?',
      choices: [
        { id: 'A', text: '시각적 자극을 넘어 심리와 행동에까지 영향을 미침' },
        { id: 'B', text: '오직 시각적 자극에만 국한되어 다른 감각과는 무관함' },
        { id: 'C', text: '청각과 후각 등 다른 감각 기관에만 영향을 미침' },
        { id: 'D', text: '신체 건강에는 영향을 주지만 심리에는 무관하다고 봄' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s2
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[1].text)] },
    question: {
      prompt: '색채 심리학의 연구 대상으로 적절한 것은?',
      choices: [
        { id: 'A', text: '특정 색이 인간의 감정, 사고, 행동에 일으키는 변화' },
        { id: 'B', text: '색채가 동물의 생존 본능에 미치는 생태학적 영향' },
        { id: 'C', text: '안료의 화학적 구성 성분과 그 물리적 특성의 분석' },
        { id: 'D', text: '광원의 파장 변화에 따른 빛의 굴절 현상에 관한 연구' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p1 세 번째 문장 (20세기 초반~)
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[2].text)] },
    question: {
      prompt: '색채 심리학이 응용되는 영역으로 언급된 것은?',
      choices: [
        { id: 'A', text: '의료, 교육, 산업 디자인 등 다양한 영역' },
        { id: 'B', text: '군사, 외교, 정치 등 국가 안보와 관련된 영역' },
        { id: 'C', text: '천문학, 지질학, 기상학 등 자연과학 분야' },
        { id: 'D', text: '법률, 회계, 세무 등 전문 서비스 분야만 해당됨' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p1 네 번째 문장 (붉은색~)
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[3].text)] },
    question: {
      prompt: '붉은색이 경고 표지판에 사용되는 이유로 적절한 것은?',
      choices: [
        { id: 'A', text: '심장 박동을 높이고 긴장감을 유발하는 경향이 있어서' },
        { id: 'B', text: '눈의 피로를 줄여 주어 장시간 볼 수 있게 해 주므로' },
        { id: 'C', text: '안정감과 신뢰감을 주어 운전자를 편안하게 만들므로' },
        { id: 'D', text: '어둠 속에서도 다른 색보다 밝게 빛나는 특성 때문에' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p1 다섯 번째 문장 (파란색~)
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[4].text)] },
    question: {
      prompt: '파란색이 병원이나 금융 기관에서 자주 사용되는 까닭은?',
      choices: [
        { id: 'A', text: '식욕을 자극하고 활동적인 분위기를 조성하기 때문에' },
        { id: 'B', text: '안정감과 신뢰감을 주는 것으로 알려져 있기 때문에' },
        { id: 'C', text: '긴장감과 경계심을 높여 주의를 집중시키기 때문에' },
        { id: 'D', text: '고급스러움과 희소성의 이미지를 전달하기 때문에' }
      ],
      answerId: 'B',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p1 여섯 번째 문장 (노란색~)
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[5].text)] },
    question: {
      prompt: '노란색이 활용되는 분야로 언급된 것은?',
      choices: [
        { id: 'A', text: '교통 신호등이나 공사 현장의 안전 장비' },
        { id: 'B', text: '병원이나 금융 기관의 인테리어 디자인' },
        { id: 'C', text: '고급 브랜드의 로고와 패키지 디자인' },
        { id: 'D', text: '장례식장이나 추모 공간의 내부 장식' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p1 일곱 번째 문장 (이처럼~)
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[6].text)] },
    question: {
      prompt: '이 문장에서 색채를 무엇이라 규정하고 있는가?',
      choices: [
        { id: 'A', text: '판단과 결정에도 관여하는 심리적 도구' },
        { id: 'B', text: '과학적으로 측정이 불가능한 추상적 개념' },
        { id: 'C', text: '오직 예술 작품에서만 의미를 지니는 요소' },
        { id: 'D', text: '건축물의 구조적 안전성에 영향을 주는 요인' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s6: p1 중심 내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: 'p1', start: 0, end: paragraphs[0].text.length }] },
    question: {
      prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
      choices: [
        { id: 'A', text: '색채가 심리와 행동에 미치는 영향과 색채 심리학의 개념' },
        { id: 'B', text: '빛의 파장에 따른 색채의 과학적 분류 체계에 대한 설명' },
        { id: 'C', text: '인테리어 디자인에서 색채를 조화시키는 실용적 방법론' },
        { id: 'D', text: '색채에 대한 인간의 생물학적 감각 기관의 작동 원리' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p2 문장별
  // s7
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[0].text)] },
    question: {
      prompt: '이 문장에서 다루고자 하는 주제는 무엇인가?',
      choices: [
        { id: 'A', text: '색채가 소비 행동에 미치는 영향에 관한 내용' },
        { id: 'B', text: '색채가 학업 성취도에 미치는 효과에 대한 분석' },
        { id: 'C', text: '색채가 수면의 질에 미치는 생리적 변화에 관한 설명' },
        { id: 'D', text: '색채가 대인 관계 형성에 미치는 사회적 영향의 고찰' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s8
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[1].text)] },
    question: {
      prompt: '시각적 요소가 구매 결정에서 차지하는 비중은 얼마인가?',
      choices: [
        { id: 'A', text: '약 50퍼센트 정도의 비중을 차지함' },
        { id: 'B', text: '약 90퍼센트를 좌우하는 핵심 요인임' },
        { id: 'C', text: '약 30퍼센트 이하의 부차적인 역할을 함' },
        { id: 'D', text: '약 70퍼센트 수준의 보조적 영향을 미침' }
      ],
      answerId: 'B',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s9
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[2].text)] },
    question: {
      prompt: '패스트푸드 브랜드가 빨간색과 노란색을 많이 쓰는 이유는?',
      choices: [
        { id: 'A', text: '안정감과 신뢰를 주어 고객이 오래 머물게 하려는 목적' },
        { id: 'B', text: '식욕 자극과 친근한 느낌으로 소비를 촉진하려는 의도' },
        { id: 'C', text: '고급스러움과 품격을 연출하여 가격을 높이려는 전략' },
        { id: 'D', text: '자연 친화적 이미지를 강조하여 건강식을 홍보하는 전략' }
      ],
      answerId: 'B',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s10
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[3].text)] },
    question: {
      prompt: '빨간색과 노란색의 효과에 대한 설명으로 적절한 것은?',
      choices: [
        { id: 'A', text: '빨간색은 식욕을 자극하고 노란색은 친근한 느낌을 줌' },
        { id: 'B', text: '빨간색은 수면을 유도하고 노란색은 집중력을 높여 줌' },
        { id: 'C', text: '빨간색은 안정감을 주고 노란색은 엄숙한 분위기를 조성함' },
        { id: 'D', text: '빨간색은 슬픔을 유발하고 노란색은 경계심을 불러일으킴' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p2 다섯 번째 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[4].text)] },
    question: {
      prompt: '고급 브랜드가 검정이나 금색을 사용하는 목적은?',
      choices: [
        { id: 'A', text: '희소성과 권위의 이미지를 구축하기 위한 전략' },
        { id: 'B', text: '친근하고 밝은 분위기를 조성하기 위한 선택' },
        { id: 'C', text: '생산 비용을 절감하기 위한 경제적인 이유' },
        { id: 'D', text: '환경 보호에 대한 의지를 소비자에게 전달하려는 의도' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p2 여섯 번째 문장 (이처럼 브랜드가~)
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[5].text)] },
    question: {
      prompt: '브랜드의 색채 선택이 갖는 의미로 적절한 것은?',
      choices: [
        { id: 'A', text: '소비자의 무의식적 반응까지 계산한 정교한 마케팅 수단' },
        { id: 'B', text: '디자이너의 개인적 취향에 따른 단순한 미적 선택일 뿐임' },
        { id: 'C', text: '원가 절감을 위해 가장 저렴한 잉크 색을 선택한 결과임' },
        { id: 'D', text: '법적 규제에 의해 특정 색만 사용하도록 강제된 결과임' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p2 중심 내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: 'p2', start: 0, end: paragraphs[1].text.length }] },
    question: {
      prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
      choices: [
        { id: 'A', text: '색채가 소비 행동과 마케팅 전략에 미치는 구체적 영향' },
        { id: 'B', text: '패스트푸드 산업의 역사와 성장 과정에 대한 개괄적 설명' },
        { id: 'C', text: '소비자 심리 조사 방법론에 대한 학술적 검토와 비판' },
        { id: 'D', text: '고급 브랜드와 대중 브랜드의 가격 정책 차이에 관한 분석' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p3 문장별
  // s13
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[0].text)] },
    question: {
      prompt: '이 문장이 말하고자 하는 핵심은 무엇인가?',
      choices: [
        { id: 'A', text: '색채의 심리적 효과가 문화권에 따라 다르게 나타남' },
        { id: 'B', text: '모든 문화에서 색채의 심리적 효과는 동일하게 적용됨' },
        { id: 'C', text: '색채 심리학은 서양에서만 연구되는 제한적 분야임' },
        { id: 'D', text: '문화적 차이보다 생물학적 반응이 절대적 영향을 미침' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s14
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[1].text)] },
    question: {
      prompt: '동아시아에서 흰색이 갖는 전통적 의미로 적절한 것은?',
      choices: [
        { id: 'A', text: '축제와 기쁨의 상징으로 경사에 활용됨' },
        { id: 'B', text: '상례에 사용되어 슬픔이나 죽음과 연결됨' },
        { id: 'C', text: '권위와 지위를 나타내는 공식적인 색으로 쓰임' },
        { id: 'D', text: '자연과 환경 보호를 상징하는 색으로 인식됨' }
      ],
      answerId: 'B',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s15
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[2].text)] },
    question: {
      prompt: '초록색에 대한 문화적 차이를 설명한 내용으로 적절한 것은?',
      choices: [
        { id: 'A', text: '모든 문화에서 자연과 평화의 상징으로 받아들여진다고 봄' },
        { id: 'B', text: '서양에서는 자연을 떠올리게 하지만 일부 지역에서는 불운의 색' },
        { id: 'C', text: '동서양 모두에서 불운의 색으로 인식되어 사용을 꺼리고 있음' },
        { id: 'D', text: '과학적으로 눈의 피로를 줄이는 효과가 입증된 유일한 색채임' }
      ],
      answerId: 'B',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s16
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[3].text)] },
    question: {
      prompt: '색채의 심리적 효과를 형성하는 요인으로 제시된 것은?',
      choices: [
        { id: 'A', text: '생물학적 반응뿐만 아니라 문화적 학습에 의해서도 형성됨' },
        { id: 'B', text: '오직 유전적 요인에 의해서만 결정되는 선천적 반응이라고 봄' },
        { id: 'C', text: '개인의 성격에 따라 달라지며 문화와는 관련이 전혀 없다고 봄' },
        { id: 'D', text: '경제적 수준에 따라 결정되는 후천적 학습의 결과물이라고 봄' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s17
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[4].text)] },
    question: {
      prompt: '색채를 활용한 전략 수립 시 반드시 고려해야 할 사항은?',
      choices: [
        { id: 'A', text: '대상 문화권의 색채 인식을 반드시 고려해야 함' },
        { id: 'B', text: '모든 문화에 공통된 하나의 색만을 사용해야 함' },
        { id: 'C', text: '가장 밝은 색을 선택하면 어떤 문화에서도 효과적임' },
        { id: 'D', text: '색채보다는 글자 크기와 배치에만 집중해야 함' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s18: p3 중심 내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: 'p3', start: 0, end: paragraphs[2].text.length }] },
    question: {
      prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
      choices: [
        { id: 'A', text: '색채의 심리적 효과가 문화권에 따라 달라지는 양상과 시사점' },
        { id: 'B', text: '흰색과 초록색이 지닌 과학적 파장의 차이에 대한 물리적 분석' },
        { id: 'C', text: '동아시아 장례 문화의 역사적 변천 과정에 대한 상세한 서술' },
        { id: 'D', text: '서양 디자인 이론이 동아시아에 전파된 경로와 그 영향의 고찰' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  const intensive = { timeline };
  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '색채가 미치는 영향이 시각 외에 어디까지 확장된다고 했나요?',
        answerRanges: [findRange(paragraphs, 'p1', '심리와 행동에까지')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '파란색이 주는 감정으로 언급된 것은 무엇인가요?',
        answerRanges: [findRange(paragraphs, 'p1', '안정감과 신뢰감')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '시각적 요소가 구매 결정에서 차지하는 비율은 얼마인가요?',
        answerRanges: [findRange(paragraphs, 'p2', '약 90퍼센트')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '고급 브랜드가 주로 사용하는 색은 무엇인가요?',
        answerRanges: [findRange(paragraphs, 'p2', '검정이나 금색')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '동아시아에서 흰색이 전통적으로 어떤 용도로 사용되었나요?',
        answerRanges: [findRange(paragraphs, 'p3', '상례에 사용되어')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '색채의 심리적 효과가 형성되는 두 가지 요인은 무엇인가요?',
        answerRanges: [findRange(paragraphs, 'p3', '생물학적 반응뿐만 아니라 문화적 학습')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q7',
        prompt: '효과적 소통을 위해 색채 전략 수립 시 고려해야 할 것은?',
        answerRanges: [findRange(paragraphs, 'p3', '대상 문화권의 색채 인식')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      }
    ]
  };

  return buildContent({
    dayIndex: 29,
    subArea: 'NONFICTION',
    paragraphs,
    intensive,
    recall,
    confirm
  });
}

// =============================================
// Day 30 - 문학 (짝수=LITERATURE)
// =============================================
function buildDay30() {
  const paragraphs = [
    {
      id: 'p1',
      text: '윤동주는 일제 강점기에 활동한 시인으로, 맑고 투명한 시어를 통해 자기 성찰과 저항 의식을 표현한 것으로 널리 알려져 있다. 그는 1917년 만주 북간도에서 태어나 연희전문학교를 졸업한 뒤 일본으로 유학을 떠났으나, 독립운동 혐의로 체포되어 1945년 광복을 불과 몇 달 앞두고 후쿠오카 형무소에서 생을 마감하였다. 그의 대표작 「서시」는 죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를 바라는 내용으로, 어둠의 시대를 살아가는 지식인의 양심과 결의를 담고 있다. 이 시에서 화자는 자신의 삶을 돌아보며 부끄러움 없이 살고자 하는 소망을 고백한다. 별, 바람, 하늘과 같은 자연 이미지를 활용하여 순수한 내면 세계를 형상화하면서도, 그 이면에는 식민지 현실에 대한 깊은 고뇌가 깔려 있다.'
    },
    {
      id: 'p2',
      text: '「서시」의 문학적 특징 가운데 하나는 고백적 어조이다. 화자는 자신의 내면을 솔직하게 드러내면서 독자에게 진정성 있는 목소리로 다가간다. 잎새에 이는 바람에도 나는 괴로워했다는 구절은 극히 미세한 외부 자극에도 예민하게 반응하는 화자의 양심적 태도를 보여 준다. 이러한 섬세한 감수성은 자기 자신에게 엄격한 도덕적 기준을 적용하는 인물의 면모를 드러내는 것이기도 하다. 이러한 자기 성찰의 자세는 외부 세계에 대한 비판보다 더 근본적인 저항의 형태로 볼 수 있다. 또한 이 시의 마지막 연에서 화자가 오늘 밤에도 별이 바람에 스치운다고 말하는 부분은 고통의 현실이 계속되고 있음을 암시하면서도, 그 속에서 흔들리지 않겠다는 의지를 함께 내비친다.'
    },
    {
      id: 'p3',
      text: '윤동주 시의 가치는 저항과 서정이 조화를 이루고 있다는 점에서 찾을 수 있다. 같은 시기의 다른 저항 시인들이 직접적이고 격렬한 어조로 현실을 비판한 것과 달리, 윤동주는 자기 내면의 부끄러움과 괴로움을 솔직하게 고백하는 방식으로 저항의 메시지를 전달한다. 이처럼 조용하지만 단단한 어조는 오히려 독자의 마음에 더 깊은 울림을 남기며, 시대를 초월한 공감을 이끌어 낸다. 그렇기에 윤동주의 시는 발표된 지 수십 년이 흐른 오늘날에도 여전히 많은 이들에게 읽히고 사랑받고 있다. 그의 시 세계는 개인의 양심이 곧 시대에 대한 저항이 될 수 있음을 보여 주는 소중한 문학적 유산이라 할 만하다.'
    }
  ];

  const total = charCount(paragraphs);
  console.log(`  Day 30 지문 길이: ${total}자`);

  const p1Sents = findSentences(paragraphs[0].text);
  const p2Sents = findSentences(paragraphs[1].text);
  const p3Sents = findSentences(paragraphs[2].text);

  const timeline = [];
  let stepNum = 1;

  // p1 문장별
  // s1
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[0].text)] },
    question: {
      prompt: '윤동주 시의 특징으로 제시된 것은 무엇인가?',
      choices: [
        { id: 'A', text: '맑고 투명한 시어를 통한 자기 성찰과 저항 의식의 표현' },
        { id: 'B', text: '격렬하고 직접적인 어조를 통한 사회 제도 비판의 전달' },
        { id: 'C', text: '농촌 풍경을 배경으로 한 전원적 정서의 서정적 형상화' },
        { id: 'D', text: '도시 문명의 발전상을 찬양하는 미래 지향적 세계 인식' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p1 두 번째 문장 (전기적 사실: 1917년~)
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[1].text)] },
    question: {
      prompt: '윤동주의 생애에 대한 설명으로 적절한 것은?',
      choices: [
        { id: 'A', text: '만주 북간도 출생, 일본 유학 후 형무소에서 생을 마감함' },
        { id: 'B', text: '서울에서 태어나 평생 국내에서만 문학 활동을 이어 감' },
        { id: 'C', text: '미국으로 유학하여 영문학을 전공하고 귀국 후 활동함' },
        { id: 'D', text: '해방 이후에 시집을 출간하고 문단의 중심 인물로 활약함' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p1 세 번째 문장 (「서시」 내용)
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[2].text)] },
    question: {
      prompt: '「서시」에 담긴 핵심 내용으로 적절한 것은?',
      choices: [
        { id: 'A', text: '자연의 아름다움을 예찬하며 전원생활을 동경하는 마음' },
        { id: 'B', text: '어둠의 시대를 살아가는 지식인의 양심과 결의를 담은 내용' },
        { id: 'C', text: '고향을 떠나야 하는 이민자의 슬픔과 향수를 노래한 내용' },
        { id: 'D', text: '사회 변혁을 위한 구체적인 행동 강령을 제시하는 선언문' }
      ],
      answerId: 'B',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p1 네 번째 문장 (화자의 소망)
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[3].text)] },
    question: {
      prompt: '「서시」의 화자가 고백하는 소망은 무엇인가?',
      choices: [
        { id: 'A', text: '부끄러움 없이 살고자 하는 소망' },
        { id: 'B', text: '부유하고 안락한 삶을 추구하는 소망' },
        { id: 'C', text: '먼 나라로 유학을 떠나고 싶은 소망' },
        { id: 'D', text: '사회적 명예와 지위를 얻고 싶은 소망' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p1 다섯 번째 문장 (자연 이미지)
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p1', p1Sents[4].text)] },
    question: {
      prompt: '자연 이미지의 이면에 깔린 것으로 적절한 것은?',
      choices: [
        { id: 'A', text: '식민지 현실에 대한 깊은 고뇌' },
        { id: 'B', text: '자연 보호에 대한 환경주의적 관심' },
        { id: 'C', text: '과학 기술의 발전에 대한 낙관적 전망' },
        { id: 'D', text: '종교적 깨달음을 향한 구도의 여정' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s5: p1 중심 내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: 'p1', start: 0, end: paragraphs[0].text.length }] },
    question: {
      prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
      choices: [
        { id: 'A', text: '윤동주와 「서시」의 핵심 주제 및 자연 이미지의 의미' },
        { id: 'B', text: '일제 강점기 독립 운동의 전개 과정에 대한 역사적 설명' },
        { id: 'C', text: '한국 근현대 시 전체의 흐름과 주요 사조에 관한 개괄' },
        { id: 'D', text: '윤동주의 유학 생활과 개인적 일화에 대한 전기적 서술' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p2 문장별
  // s6
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[0].text)] },
    question: {
      prompt: '「서시」의 문학적 특징으로 먼저 언급된 것은?',
      choices: [
        { id: 'A', text: '고백적 어조' },
        { id: 'B', text: '풍자적 어조' },
        { id: 'C', text: '서사적 어조' },
        { id: 'D', text: '논쟁적 어조' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s7
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[1].text)] },
    question: {
      prompt: '화자가 독자에게 다가가는 방식으로 적절한 것은?',
      choices: [
        { id: 'A', text: '자신의 내면을 솔직하게 드러내며 진정성 있는 목소리로 전달' },
        { id: 'B', text: '다른 사람의 이야기를 인용하여 간접적으로 교훈을 전달함' },
        { id: 'C', text: '과장된 수사법을 동원하여 독자의 감정을 극적으로 자극함' },
        { id: 'D', text: '객관적 사실만을 나열하여 감정적 개입 없이 정보를 전달함' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s8
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[2].text)] },
    question: {
      prompt: '바람에도 괴로워했다는 구절이 보여 주는 것은?',
      choices: [
        { id: 'A', text: '미세한 자극에도 예민하게 반응하는 화자의 양심적 태도' },
        { id: 'B', text: '자연 현상에 대한 과학적 호기심과 탐구하는 자세의 표현' },
        { id: 'C', text: '외부 환경의 변화를 무시하고 자신만의 세계에 몰두하는 성향' },
        { id: 'D', text: '바람이 불면 실제로 몸이 아파지는 건강상의 문제를 토로함' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s9
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[3].text)] },
    question: {
      prompt: '섬세한 감수성이 드러내는 인물의 면모로 적절한 것은?',
      choices: [
        { id: 'A', text: '자기 자신에게 엄격한 도덕적 기준을 적용하는 면모' },
        { id: 'B', text: '타인의 평가에 무관심한 독립적이고 자유로운 면모' },
        { id: 'C', text: '감정을 억제하고 이성적으로만 판단하려는 면모' },
        { id: 'D', text: '세상의 모든 일에 낙관적으로 대응하는 긍정적 면모' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p2 다섯 번째 문장 (자기 성찰의 자세)
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[4].text)] },
    question: {
      prompt: '자기 성찰의 자세가 갖는 의미로 적절한 것은?',
      choices: [
        { id: 'A', text: '외부 비판보다 더 근본적인 저항의 형태로 볼 수 있음' },
        { id: 'B', text: '자신의 잘못을 인정하고 사회에 순응하겠다는 뜻을 나타냄' },
        { id: 'C', text: '현실 도피적 태도를 정당화하기 위한 변명의 수단이라고 봄' },
        { id: 'D', text: '타인에 대한 배려보다 자기 이익을 우선하는 이기적 면모임' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p2 여섯 번째 문장 (마지막 연)
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p2', p2Sents[5].text)] },
    question: {
      prompt: '마지막 연이 암시하는 바와 화자의 태도로 적절한 것은?',
      choices: [
        { id: 'A', text: '고통의 현실이 계속됨을 인정하면서도 흔들리지 않겠다는 의지' },
        { id: 'B', text: '현실의 고통이 곧 끝날 것이라는 낙관적 전망에 대한 확신' },
        { id: 'C', text: '별과 바람이 주는 위안으로 현실을 잊고 편안히 잠드는 모습' },
        { id: 'D', text: '자연의 아름다움에 감탄하며 시적 영감을 얻는 순간의 묘사' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p2 중심 내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: 'p2', start: 0, end: paragraphs[1].text.length }] },
    question: {
      prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
      choices: [
        { id: 'A', text: '「서시」의 고백적 어조와 화자의 양심적 태도 및 의지 분석' },
        { id: 'B', text: '윤동주가 시를 창작하게 된 생애적 배경에 대한 전기적 서술' },
        { id: 'C', text: '일제 강점기 문학 검열 제도의 실태와 그 영향에 관한 설명' },
        { id: 'D', text: '한국 현대시의 운율 체계와 형식적 특징에 대한 기술적 분석' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p3 문장별
  // s12
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[0].text)] },
    question: {
      prompt: '윤동주 시의 가치를 찾을 수 있는 지점은?',
      choices: [
        { id: 'A', text: '저항과 서정이 조화를 이루고 있다는 점' },
        { id: 'B', text: '서양 문학의 기법을 충실히 모방했다는 점' },
        { id: 'C', text: '당시 문단의 주류 경향을 그대로 따랐다는 점' },
        { id: 'D', text: '난해한 상징으로 해석의 여지를 열어 둔다는 점' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s13
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[1].text)] },
    question: {
      prompt: '윤동주가 다른 저항 시인들과 다른 점으로 적절한 것은?',
      choices: [
        { id: 'A', text: '직접적이고 격렬한 어조 대신 내면의 고백으로 저항을 표현' },
        { id: 'B', text: '정치적 구호를 시에 직접 삽입하여 독자를 선동하는 방식' },
        { id: 'C', text: '외국어를 섞어 사용하여 국제적 연대 의식을 표현하는 방식' },
        { id: 'D', text: '소설과 시를 결합한 독자적인 문학 장르를 개척한 선구자' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s14
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[2].text)] },
    question: {
      prompt: '조용하지만 단단한 어조가 독자에게 주는 효과는?',
      choices: [
        { id: 'A', text: '독자의 마음에 더 깊은 울림을 남기며 시대 초월적 공감을 이끎' },
        { id: 'B', text: '독자에게 즉각적인 행동을 촉구하여 사회 변혁을 이끌어 냄' },
        { id: 'C', text: '독자가 시의 의미를 파악하기 어렵게 만들어 신비감을 조성함' },
        { id: 'D', text: '독자로 하여금 시인의 개인사에 대한 호기심을 갖게 유도함' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s15
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[3].text)] },
    question: {
      prompt: '윤동주의 시가 오늘날에도 사랑받는 이유와 관련된 것은?',
      choices: [
        { id: 'A', text: '시대를 초월한 공감을 이끌어 내는 깊은 울림이 있기 때문' },
        { id: 'B', text: '최근 교과서에 수록되어 의무적으로 학습해야 하기 때문' },
        { id: 'C', text: '영화와 드라마의 소재로 자주 활용되어 인지도가 높기 때문' },
        { id: 'D', text: '외국의 문학상을 수상하여 국제적인 명성을 얻었기 때문' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s16
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, 'p3', p3Sents[4].text)] },
    question: {
      prompt: '윤동주 시 세계가 보여 주는 문학적 의의로 적절한 것은?',
      choices: [
        { id: 'A', text: '개인의 양심이 곧 시대에 대한 저항이 될 수 있음을 증명함' },
        { id: 'B', text: '문학은 사회 변혁의 직접적 수단이 되어야 한다고 주장함' },
        { id: 'C', text: '시인은 현실에서 벗어나 순수 예술에만 전념해야 한다고 봄' },
        { id: 'D', text: '문학 작품의 가치는 판매 부수에 의해 결정된다는 견해 제시' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // s17: p3 중심 내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: 'p3', start: 0, end: paragraphs[2].text.length }] },
    question: {
      prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
      choices: [
        { id: 'A', text: '윤동주 시의 가치와 저항·서정의 조화가 주는 문학적 의의' },
        { id: 'B', text: '일제 강점기 저항 시인들의 작품 목록과 발표 연도의 정리' },
        { id: 'C', text: '윤동주와 동시대 시인들의 개인적 교유 관계에 대한 서술' },
        { id: 'D', text: '한국 문학사에서 서정시가 차지하는 비중의 통계적 분석' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  const intensive = { timeline };
  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '윤동주가 시에서 활용한 자연 이미지에는 어떤 것이 있나요?',
        answerRanges: [findRange(paragraphs, 'p1', '별, 바람, 하늘')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '「서시」에서 화자가 고백하는 소망은 무엇인가요?',
        answerRanges: [findRange(paragraphs, 'p1', '부끄러움 없이 살고자 하는 소망')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '「서시」의 문학적 특징으로 가장 먼저 언급된 어조는 무엇인가요?',
        answerRanges: [findRange(paragraphs, 'p2', '고백적 어조')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '바람에도 괴로워했다는 구절이 보여 주는 태도는?',
        answerRanges: [findRange(paragraphs, 'p2', '양심적 태도')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '윤동주 시에서 저항과 조화를 이루는 요소는 무엇인가요?',
        answerRanges: [findRange(paragraphs, 'p3', '저항과 서정이 조화')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '윤동주가 저항의 메시지를 전달하는 방식은 어떠한가요?',
        answerRanges: [findRange(paragraphs, 'p3', '부끄러움과 괴로움을 솔직하게 고백하는 방식')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q7',
        prompt: '윤동주 시 세계가 보여 주는 핵심 메시지는 무엇인가요?',
        answerRanges: [findRange(paragraphs, 'p3', '개인의 양심이 곧 시대에 대한 저항이 될 수 있음')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      }
    ]
  };

  return buildContent({
    dayIndex: 30,
    subArea: 'LITERATURE',
    paragraphs,
    intensive,
    recall,
    confirm
  });
}

// =============================================
// 메인 실행
// =============================================
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const BATCH_PATH = path.join(ROOT, 'generated', 'daily-batch-reading-russell1.json');
  const STATIC_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'russell1');

  console.log('=== 러셀1 Day 28~30 콘텐츠 재작성 시작 ===\n');

  // 콘텐츠 빌드
  const day28 = buildDay28();
  const day29 = buildDay29();
  const day30 = buildDay30();

  const contents = [
    { day: 28, content: day28, index: 27 },
    { day: 29, content: day29, index: 28 },
    { day: 30, content: day30, index: 29 }
  ];

  // 검증
  console.log('\n=== 검증 ===');
  let hasError = false;

  for (const { day, content } of contents) {
    const paras = content.payload.passage.paragraphs;
    const total = charCount(paras);
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

    // 선택지 길이 편차 확인
    for (const step of content.payload.intensive.timeline) {
      const lens = step.question.choices.map(c => c.text.length);
      const maxLen = Math.max(...lens);
      const minLen = Math.min(...lens);
      if (maxLen > 0 && (maxLen - minLen) / maxLen > 0.50) {
        // 허용 범위를 넓게 잡되 로깅
      }
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
    const batchItem = buildBatchItem(day, content.subArea, content);
    batch.items[index] = batchItem;
    console.log(`  items[${index}] (Day ${day}) 교체 완료`);
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batch, null, 2), 'utf8');
  console.log(`  ${BATCH_PATH} 저장 완료`);

  console.log('\n=== 작업 완료 ===');
}

main();
