// 일일독해 러셀1 Day 71~75 콘텐츠 빌드 스크립트
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

function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

function hashIdx(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function truncate(text, max) {
  return text.length > max ? text.substring(0, max) + '…' : text;
}

function shuffleChoices(choices, answerId, seed) {
  const rng = hashIdx(seed + answerId);
  const arr = [...choices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (rng + i * 31) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildTimeline(paragraphs, steps) {
  const timeline = [];
  let stepNum = 1;
  for (const step of steps) {
    const ranges = step.ranges.map(r => {
      if (r.full) return { paragraphId: r.pid, start: 0, end: paragraphs.find(p => p.id === r.pid).text.length };
      return findRange(paragraphs, r.pid, r.text);
    });
    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges },
      question: {
        prompt: step.prompt,
        choices: step.choices,
        answerId: step.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }
  return { timeline };
}

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
  return { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 };
}

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

// =============================================
// Day 71 - NONFICTION (비문학)
// 주제: 한반도의 계절풍과 기후
// =============================================
function buildDay71() {
  const paragraphs = [
    {
      id: 'p1',
      text: '한반도는 유라시아 대륙의 동쪽 끝에 위치하여 대륙성 기후와 해양성 기후의 영향을 동시에 받는 독특한 기후 특성을 지니고 있다. 이러한 특성의 핵심에는 계절풍, 즉 몬순이 자리하고 있다. 계절풍이란 계절에 따라 방향이 바뀌는 바람을 뜻하는데, 여름에는 남동쪽에서 고온 다습한 해양성 기류가 불어오고, 겨울에는 북서쪽에서 한랭 건조한 대륙성 기류가 불어온다. 이 바람의 방향 전환은 대륙과 해양의 비열 차이에서 비롯된다. 여름철에는 대륙이 해양보다 빨리 가열되어 저기압이 형성되므로 바다에서 육지로 바람이 불어오고, 겨울철에는 대륙이 해양보다 빨리 냉각되어 고기압이 형성되므로 육지에서 바다로 바람이 불어나간다.'
    },
    {
      id: 'p2',
      text: '계절풍은 한반도의 강수 패턴에도 결정적인 영향을 미친다. 여름 계절풍이 남쪽 바다에서 수증기를 대량으로 가져오기 때문에, 연간 강수량의 약 60퍼센트 이상이 6월에서 9월 사이에 집중된다. 이 시기에 장마전선이 한반도를 남북으로 오르내리면서 오랜 기간 비를 내리게 하는데, 장마전선은 차가운 대륙성 기단과 따뜻한 해양성 기단이 만나는 경계면에서 형성된다. 장마가 끝난 뒤에도 북태평양 고기압의 영향으로 무더운 날씨가 이어지다가, 가을이 되면 대륙성 고기압이 세력을 확장하면서 맑고 건조한 날씨가 찾아온다. 이처럼 한반도의 사계절이 뚜렷한 까닭은 계절풍의 규칙적인 전환과 밀접하게 연관되어 있다.'
    },
    {
      id: 'p3',
      text: '계절풍은 기후뿐 아니라 한반도의 문화와 농업에도 깊은 영향을 끼쳐 왔다. 여름철 집중 강우에 대비하여 전통 가옥은 처마를 길게 내밀고 배수 시설을 갖추었으며, 벼농사의 경우 여름 장마철의 풍부한 물을 활용하는 방식으로 발전해 왔다. 반대로 겨울철의 한랭 건조한 계절풍은 김장 문화의 형성에 기여하였는데, 낮은 기온이 자연 냉장고 역할을 하여 발효 식품의 저장에 유리한 조건을 만들었기 때문이다. 최근에는 지구 온난화의 영향으로 계절풍의 세기와 시기에 변화가 나타나고 있어, 집중 호우와 이상 고온 같은 극단적 기상 현상이 빈번해지고 있다. 이에 따라 기후 변화에 대응하기 위한 과학적 연구와 정책적 노력이 더욱 중요해지고 있으며, 농업 분야에서도 새로운 작물 재배 전략을 모색하는 움직임이 활발하다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 71 지문 길이: ${total}자`);

  const p1s = findSentences(paragraphs[0].text);
  const p2s = findSentences(paragraphs[1].text);
  const p3s = findSentences(paragraphs[2].text);

  const intensive = buildTimeline(paragraphs, [
    // p1 문장별
    { ranges: [{ pid: 'p1', text: p1s[0].text }], prompt: '한반도가 독특한 기후 특성을 지니는 이유로 적절한 것은?', choices: [
      { id: 'A', text: '대륙성 기후와 해양성 기후의 영향을 동시에 받기 때문' },
      { id: 'B', text: '적도 부근에 위치하여 열대성 기후가 지배적이기 때문' },
      { id: 'C', text: '사막 기후의 영향으로 연중 건조한 날씨가 이어지기 때문' },
      { id: 'D', text: '극지방과 인접하여 한대성 기후만 나타나기 때문' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p1', text: p1s[1].text }], prompt: '한반도 기후 특성의 핵심에 자리한 것은?', choices: [
      { id: 'A', text: '해류의 온도 변화' },
      { id: 'B', text: '계절풍, 즉 몬순' },
      { id: 'C', text: '화산 활동의 빈도' },
      { id: 'D', text: '지각판의 이동 속도' }
    ], answerId: 'B' },
    { ranges: [{ pid: 'p1', text: p1s[2].text }], prompt: '여름철 계절풍의 특성으로 올바른 것은?', choices: [
      { id: 'A', text: '북서쪽에서 한랭 건조한 기류가 불어옴' },
      { id: 'B', text: '남동쪽에서 고온 다습한 해양성 기류가 불어옴' },
      { id: 'C', text: '동쪽에서 온난 건조한 사막성 기류가 불어옴' },
      { id: 'D', text: '남서쪽에서 냉대성 한류가 밀려들어옴' }
    ], answerId: 'B' },
    { ranges: [{ pid: 'p1', text: p1s[3].text }], prompt: '바람 방향 전환의 근본 원인은?', choices: [
      { id: 'A', text: '대륙과 해양의 비열 차이' },
      { id: 'B', text: '달의 인력에 의한 조석 현상' },
      { id: 'C', text: '지구 자전축의 기울기 변화' },
      { id: 'D', text: '태양 흑점 활동의 주기적 변동' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p1', text: p1s[4].text }], prompt: '여름철 바다에서 육지로 바람이 부는 이유는?', choices: [
      { id: 'A', text: '대륙이 해양보다 빨리 가열되어 저기압이 형성되므로' },
      { id: 'B', text: '해양이 대륙보다 빨리 가열되어 고기압이 형성되므로' },
      { id: 'C', text: '대륙에 높은 산맥이 많아 기류를 끌어당기므로' },
      { id: 'D', text: '해양의 수온이 급격히 하강하여 상승 기류가 생기므로' }
    ], answerId: 'A' },
    // p1 중심 내용
    { ranges: [{ pid: 'p1', full: true }], prompt: '첫째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '계절풍의 개념과 한반도에서의 작동 원리' },
      { id: 'B', text: '한반도의 지형적 특성과 산맥 분포 양상' },
      { id: 'C', text: '태풍의 발생 원인과 한반도 상륙 경로의 분석' },
      { id: 'D', text: '지구 온난화에 따른 해수면 상승 문제의 심각성' }
    ], answerId: 'A' },
    // p2 문장별
    { ranges: [{ pid: 'p2', text: p2s[0].text }], prompt: '계절풍이 강수 패턴에 미치는 영향으로 적절한 것은?', choices: [
      { id: 'A', text: '결정적인 영향을 미침' },
      { id: 'B', text: '거의 영향을 미치지 않음' },
      { id: 'C', text: '겨울 강수에만 부분적으로 관련됨' },
      { id: 'D', text: '봄철 강수에만 미미한 영향을 줌' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p2', text: p2s[1].text }], prompt: '연간 강수량의 약 60퍼센트 이상이 집중되는 시기는?', choices: [
      { id: 'A', text: '12월에서 3월 사이의 겨울철' },
      { id: 'B', text: '6월에서 9월 사이의 여름철' },
      { id: 'C', text: '3월에서 5월 사이의 봄철' },
      { id: 'D', text: '10월에서 11월 사이의 가을철' }
    ], answerId: 'B' },
    { ranges: [{ pid: 'p2', text: p2s[2].text }], prompt: '장마전선이 형성되는 원리로 적절한 것은?', choices: [
      { id: 'A', text: '차가운 대륙성 기단과 따뜻한 해양성 기단이 만나는 경계면' },
      { id: 'B', text: '태풍이 한반도에 상륙하면서 발생하는 강한 소용돌이' },
      { id: 'C', text: '지표면의 열복사 에너지가 대기 중에 축적된 결과' },
      { id: 'D', text: '북극 빙하가 녹으면서 발생한 한류의 영향으로 생성' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p2', text: p2s[4].text }], prompt: '한반도의 사계절이 뚜렷한 까닭으로 적절한 것은?', choices: [
      { id: 'A', text: '계절풍의 규칙적인 전환과 밀접하게 연관되어 있음' },
      { id: 'B', text: '한반도 주변의 해류가 연중 일정한 온도를 유지하기 때문' },
      { id: 'C', text: '한반도의 위도가 적도와 극지방의 정확히 중간이기 때문' },
      { id: 'D', text: '화산 활동으로 지열이 계절마다 다르게 방출되기 때문' }
    ], answerId: 'A' },
    // p2 중심 내용
    { ranges: [{ pid: 'p2', full: true }], prompt: '둘째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '계절풍이 한반도의 강수 패턴과 사계절에 미치는 영향' },
      { id: 'B', text: '태풍의 이동 경로와 한반도 피해 사례의 역사적 정리' },
      { id: 'C', text: '세계 각국의 강수 분포와 한반도와의 비교 분석 결과' },
      { id: 'D', text: '장마철 대비를 위한 정부의 재난 관리 정책과 대응 방안' }
    ], answerId: 'A' },
    // p3 문장별
    { ranges: [{ pid: 'p3', text: p3s[0].text }], prompt: '계절풍이 영향을 끼친 분야로 언급된 것은?', choices: [
      { id: 'A', text: '문화와 농업' },
      { id: 'B', text: '군사와 외교' },
      { id: 'C', text: '수학과 천문학' },
      { id: 'D', text: '무역과 금융' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p3', text: p3s[1].text }], prompt: '벼농사가 발전한 방식으로 적절한 것은?', choices: [
      { id: 'A', text: '여름 장마철의 풍부한 물을 활용하는 방식' },
      { id: 'B', text: '겨울철 눈 녹은 물을 저수지에 모아 활용하는 방식' },
      { id: 'C', text: '지하수를 인공적으로 끌어 올려 관개하는 방식' },
      { id: 'D', text: '해수를 담수화하여 논에 공급하는 첨단 방식' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p3', text: p3s[2].text }], prompt: '김장 문화의 형성에 기여한 조건으로 적절한 것은?', choices: [
      { id: 'A', text: '겨울철 낮은 기온이 자연 냉장고 역할을 하여 발효 식품 저장에 유리' },
      { id: 'B', text: '여름철 높은 기온이 식품의 빠른 발효를 촉진하여 맛이 좋아짐' },
      { id: 'C', text: '봄철 온화한 기후가 채소의 수확량을 늘려 김장 재료를 풍부하게 함' },
      { id: 'D', text: '가을철 강한 바람이 채소를 자연 건조시켜 저장 기간을 연장함' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p3', text: p3s[3].text }], prompt: '최근 계절풍 변화의 원인으로 언급된 것은?', choices: [
      { id: 'A', text: '지구 온난화의 영향' },
      { id: 'B', text: '화산 폭발의 증가' },
      { id: 'C', text: '해저 지진의 빈발' },
      { id: 'D', text: '오존층의 완전 회복' }
    ], answerId: 'A' },
    // p3 중심 내용
    { ranges: [{ pid: 'p3', full: true }], prompt: '셋째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '계절풍이 한반도의 문화·농업에 끼친 영향과 최근 기후 변화' },
      { id: 'B', text: '한반도 전통 건축의 구조적 특징과 미학적 가치에 대한 평가' },
      { id: 'C', text: '세계 각국의 발효 식품 문화 비교와 한국 김치의 우수성 홍보' },
      { id: 'D', text: '기상 관측 기술의 발전 과정과 일기 예보 정확도의 향상 추이' }
    ], answerId: 'A' }
  ]);

  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      { id: 'q1', prompt: '계절풍의 방향 전환이 비롯되는 근본 원인은 무엇인가요?', answerRanges: [findRange(paragraphs, 'p1', '대륙과 해양의 비열 차이')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q2', prompt: '여름철 계절풍은 어느 방향에서 불어오나요?', answerRanges: [findRange(paragraphs, 'p1', '남동쪽에서 고온 다습한 해양성 기류')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q3', prompt: '연간 강수량의 약 60퍼센트 이상이 집중되는 시기는 언제인가요?', answerRanges: [findRange(paragraphs, 'p2', '6월에서 9월 사이')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q4', prompt: '장마전선은 어떤 기단들이 만나 형성되나요?', answerRanges: [findRange(paragraphs, 'p2', '차가운 대륙성 기단과 따뜻한 해양성 기단')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q5', prompt: '김장 문화 형성에 기여한 자연 조건은 무엇인가요?', answerRanges: [findRange(paragraphs, 'p3', '낮은 기온이 자연 냉장고 역할')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q6', prompt: '최근 계절풍 변화의 원인으로 언급된 것은 무엇인가요?', answerRanges: [findRange(paragraphs, 'p3', '지구 온난화의 영향')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' }
    ]
  };

  return assembleFull({ dayIndex: 71, subArea: 'NONFICTION', paragraphs, intensive, recall, confirm });
}

// =============================================
// Day 72 - LITERATURE (문학)
// 주제: 정지용의 시 「향수」 분석
// =============================================
function buildDay72() {
  const paragraphs = [
    {
      id: 'p1',
      text: '정지용은 한국 현대 시의 기틀을 마련한 시인으로, 감각적이고 세련된 언어를 통해 한국어 시의 표현 영역을 크게 확장한 인물이다. 그의 대표작 가운데 하나인 「향수」는 고향에 대한 그리움을 절제된 이미지로 형상화한 작품으로, 발표 이후 오랫동안 한국인의 마음속에 깊이 자리 잡아 왔다. 이 시는 넓은 벌 동쪽 끝으로 옛이야기 지줄대는 실개천이라는 도입부로 시작하여, 고향의 자연 풍경과 그곳에 깃든 추억을 하나하나 펼쳐 보인다. 시의 각 연에서 반복되는 그곳이 차마 꿈엔들 잊힐 리야라는 후렴구는 고향을 떠나 도시에서 살아가는 화자의 절절한 그리움을 효과적으로 전달한다. 이러한 반복 구조는 시에 음악적 리듬감을 부여하는 동시에, 그리움이라는 감정을 점층적으로 심화시키는 기능을 수행한다.'
    },
    {
      id: 'p2',
      text: '「향수」의 문학적 특징은 시각, 청각, 촉각 등 다양한 감각적 이미지를 활용하여 고향의 풍경을 생생하게 복원한다는 점에 있다. 실개천, 해설피 금빛 게으른 울음, 짚 베개 등의 구체적 소재는 독자로 하여금 마치 고향 마을에 직접 서 있는 듯한 생생한 체험을 하게 한다. 특히 청각적 이미지인 전설 바다에 춤추는 밤물결 같은 검은 귀밑머리라는 표현은 시각과 청각을 결합한 공감각적 비유로, 정지용 특유의 감각적 언어 운용을 잘 보여 준다. 이처럼 감각적 이미지의 중첩은 고향에 대한 기억을 단순한 회상이 아닌 살아 있는 체험으로 바꾸어 놓는다. 또한 이 시에서 사용된 토속적 어휘와 향토적 분위기는 근대화의 물결 속에서 사라져 가는 전통 농촌 사회의 정서를 환기하는 역할을 맡고 있다.'
    },
    {
      id: 'p3',
      text: '정지용의 「향수」가 오늘날까지 널리 사랑받는 이유는 단순히 고향에 대한 그리움만을 노래하기 때문이 아니다. 이 시는 근대화와 도시화 과정에서 잃어버린 원초적 공간에 대한 보편적 향수를 담고 있어서, 시대와 세대를 초월한 공감을 이끌어 낸다. 누구나 마음속에 돌아가고 싶은 어린 시절의 장소나 풍경이 있기 마련이고, 정지용은 그 보편적 감정에 구체적인 언어를 부여함으로써 독자 각자의 기억을 자극하는 데 성공하였다. 더 나아가 이 시는 한국어의 음악성을 최대한 살린 운율과 정교한 이미지 배치를 통해, 시를 읽는 행위 자체가 하나의 미적 체험이 되도록 구성되어 있다. 이러한 점에서 「향수」는 한국 현대 시의 고전으로서 문학 교육 현장에서 빠지지 않는 필수 작품이라 할 수 있다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 72 지문 길이: ${total}자`);

  const p1s = findSentences(paragraphs[0].text);
  const p2s = findSentences(paragraphs[1].text);
  const p3s = findSentences(paragraphs[2].text);

  const intensive = buildTimeline(paragraphs, [
    { ranges: [{ pid: 'p1', text: p1s[0].text }], prompt: '정지용이 한국 현대 시에 기여한 바로 적절한 것은?', choices: [
      { id: 'A', text: '감각적이고 세련된 언어로 한국어 시의 표현 영역을 확장함' },
      { id: 'B', text: '사회 비판적 산문시를 최초로 도입하여 문학 장르를 개혁함' },
      { id: 'C', text: '서양 시의 형식을 그대로 번역하여 한국 문단에 소개함' },
      { id: 'D', text: '구전 민요를 수집하고 정리하여 국문학 자료로 보존함' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p1', text: p1s[1].text }], prompt: '「향수」의 주제로 가장 적절한 것은?', choices: [
      { id: 'A', text: '고향에 대한 그리움을 절제된 이미지로 형상화한 것' },
      { id: 'B', text: '도시 문명의 발전을 찬양하며 미래를 전망한 것' },
      { id: 'C', text: '일제에 대한 분노를 직접적으로 표출한 저항시' },
      { id: 'D', text: '사랑하는 이와의 이별을 한탄하며 재회를 기원한 것' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p1', text: p1s[3].text }], prompt: '후렴구 "그곳이 차마 꿈엔들 잊힐 리야"의 역할은?', choices: [
      { id: 'A', text: '화자의 절절한 그리움을 효과적으로 전달함' },
      { id: 'B', text: '시의 긴장감을 해소하고 유머를 제공함' },
      { id: 'C', text: '독자에게 도시 생활의 편리함을 강조함' },
      { id: 'D', text: '시간의 흐름을 역순으로 배치하는 장치로 기능함' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p1', text: p1s[4].text }], prompt: '반복 구조가 수행하는 기능으로 적절한 것은?', choices: [
      { id: 'A', text: '음악적 리듬감 부여와 그리움의 점층적 심화' },
      { id: 'B', text: '논리적 근거 제시와 주장의 타당성 강화' },
      { id: 'C', text: '인물 간 대화의 사실감 부여와 극적 긴장 고조' },
      { id: 'D', text: '역사적 사실의 나열과 시대적 배경 설명의 보충' }
    ], answerId: 'A' },
    // p1 중심
    { ranges: [{ pid: 'p1', full: true }], prompt: '첫째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '정지용과 「향수」의 소개, 후렴구의 기능과 반복 구조의 효과' },
      { id: 'B', text: '한국 현대 시의 역사적 전개 과정과 주요 시인의 연대기' },
      { id: 'C', text: '고향 마을의 지리적 특성과 자연환경에 대한 과학적 분석' },
      { id: 'D', text: '근대 문학 이론의 도입 과정과 서양 문학과의 비교 연구' }
    ], answerId: 'A' },
    // p2 문장별
    { ranges: [{ pid: 'p2', text: p2s[0].text }], prompt: '「향수」의 문학적 특징으로 제시된 것은?', choices: [
      { id: 'A', text: '다양한 감각적 이미지로 고향 풍경을 생생하게 복원' },
      { id: 'B', text: '추상적 개념을 철학적으로 논증하는 사변적 서술 방식' },
      { id: 'C', text: '역사적 사건을 시간순으로 나열하는 편년체 구성 방식' },
      { id: 'D', text: '등장인물 간 대화를 중심으로 갈등을 전개하는 극적 구성' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p2', text: p2s[1].text }], prompt: '구체적 소재가 독자에게 주는 효과는?', choices: [
      { id: 'A', text: '고향 마을에 직접 서 있는 듯한 생생한 체험' },
      { id: 'B', text: '도시의 번잡한 거리를 걷는 듯한 역동적 느낌' },
      { id: 'C', text: '역사 교과서를 읽는 듯한 객관적이고 정보적인 인상' },
      { id: 'D', text: '과학 실험을 관찰하는 듯한 분석적이고 냉철한 감각' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p2', text: p2s[2].text }], prompt: '"전설 바다에 춤추는 밤물결" 표현의 수사법은?', choices: [
      { id: 'A', text: '시각과 청각을 결합한 공감각적 비유' },
      { id: 'B', text: '대상을 사람처럼 표현하는 의인법' },
      { id: 'C', text: '사물의 크기를 과장하여 표현하는 과장법' },
      { id: 'D', text: '반대되는 개념을 나란히 놓는 대조법' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p2', text: p2s[4].text }], prompt: '토속적 어휘와 향토적 분위기가 환기하는 것은?', choices: [
      { id: 'A', text: '근대화 속에서 사라져 가는 전통 농촌 사회의 정서' },
      { id: 'B', text: '미래 도시의 첨단 기술이 가져올 편리한 생활상' },
      { id: 'C', text: '국제 교류를 통해 유입된 외래 문화의 다양한 양상' },
      { id: 'D', text: '산업 혁명 이후 도시 노동자 계급의 열악한 생활 조건' }
    ], answerId: 'A' },
    // p2 중심
    { ranges: [{ pid: 'p2', full: true }], prompt: '둘째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '「향수」의 감각적 이미지 활용과 토속적 분위기의 효과' },
      { id: 'B', text: '정지용의 유학 시절 경험과 그것이 시에 미친 영향' },
      { id: 'C', text: '한국 전통 농촌의 연간 농사 일정과 세시 풍속의 기록' },
      { id: 'D', text: '공감각적 표현 기법의 서양 문학사적 기원과 발전 과정' }
    ], answerId: 'A' },
    // p3 문장별
    { ranges: [{ pid: 'p3', text: p3s[1].text }], prompt: '이 시가 시대를 초월한 공감을 이끌어 내는 이유는?', choices: [
      { id: 'A', text: '잃어버린 원초적 공간에 대한 보편적 향수를 담고 있어서' },
      { id: 'B', text: '특정 지역의 역사적 사건을 상세히 기록하고 있어서' },
      { id: 'C', text: '어려운 한자어를 많이 사용하여 학술적 권위를 지녀서' },
      { id: 'D', text: '정치적 메시지를 강하게 담아 사회 운동과 결합했기에' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p3', text: p3s[2].text }], prompt: '정지용이 독자 각자의 기억을 자극하는 데 성공한 방법은?', choices: [
      { id: 'A', text: '보편적 감정에 구체적인 언어를 부여함으로써' },
      { id: 'B', text: '개인적 일기를 그대로 시에 옮겨 적음으로써' },
      { id: 'C', text: '외국 시인의 작품을 번안하여 소개함으로써' },
      { id: 'D', text: '당시 유행하던 대중가요의 가사를 인용함으로써' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p3', text: p3s[4].text }], prompt: '「향수」의 문학사적 위상으로 적절한 것은?', choices: [
      { id: 'A', text: '한국 현대 시의 고전으로서 문학 교육 현장의 필수 작품' },
      { id: 'B', text: '서양 낭만주의 시의 대표작으로 세계 문학사에 등재된 작품' },
      { id: 'C', text: '현대 대중가요의 원형이 되어 음악계에 큰 영향을 준 작품' },
      { id: 'D', text: '최초의 한글 소설로 인정받아 국보로 지정된 작품' }
    ], answerId: 'A' },
    // p3 중심
    { ranges: [{ pid: 'p3', full: true }], prompt: '셋째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '「향수」가 오늘날까지 사랑받는 이유와 문학사적 위상' },
      { id: 'B', text: '정지용과 동시대 시인들 사이의 문학적 논쟁의 전개 과정' },
      { id: 'C', text: '한국 교육 과정의 변천사와 국어 교과서 수록 작품의 변화' },
      { id: 'D', text: '근대화 이후 한국 농촌의 경제적 변화와 인구 이동의 추이' }
    ], answerId: 'A' }
  ]);

  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      { id: 'q1', prompt: '「향수」에서 반복되는 후렴구는 무엇인가요?', answerRanges: [findRange(paragraphs, 'p1', '그곳이 차마 꿈엔들 잊힐 리야')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q2', prompt: '반복 구조가 수행하는 두 가지 기능은 무엇인가요?', answerRanges: [findRange(paragraphs, 'p1', '음악적 리듬감을 부여하는 동시에, 그리움이라는 감정을 점층적으로 심화')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q3', prompt: '"검은 귀밑머리" 표현에 사용된 수사법은 무엇인가요?', answerRanges: [findRange(paragraphs, 'p2', '공감각적 비유')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q4', prompt: '토속적 어휘가 환기하는 정서는 무엇인가요?', answerRanges: [findRange(paragraphs, 'p2', '전통 농촌 사회의 정서')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q5', prompt: '이 시가 시대를 초월한 공감을 이끄는 이유는 무엇인가요?', answerRanges: [findRange(paragraphs, 'p3', '원초적 공간에 대한 보편적 향수')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q6', prompt: '정지용이 독자 각자의 기억을 자극한 방법은?', answerRanges: [findRange(paragraphs, 'p3', '보편적 감정에 구체적인 언어를 부여')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q7', prompt: '「향수」의 문학사적 위상은 어떻게 평가되나요?', answerRanges: [findRange(paragraphs, 'p3', '한국 현대 시의 고전')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' }
    ]
  };

  return assembleFull({ dayIndex: 72, subArea: 'LITERATURE', paragraphs, intensive, recall, confirm });
}

// =============================================
// Day 73 - NONFICTION (비문학)
// 주제: 인공지능과 자연어 처리
// =============================================
function buildDay73() {
  const paragraphs = [
    {
      id: 'p1',
      text: '인공지능 기술이 빠르게 발전하면서 자연어 처리 분야가 우리 생활 곳곳에 스며들고 있다. 자연어 처리란 인간이 일상에서 사용하는 언어를 컴퓨터가 이해하고 생성할 수 있도록 하는 기술을 가리킨다. 과거에는 컴퓨터가 인간의 언어를 처리하기 위해 문법 규칙을 일일이 입력받아야 했으나, 최근에는 대규모 텍스트 데이터를 학습하여 스스로 언어의 패턴을 파악하는 기계 학습 방식이 주류가 되었다. 특히 딥러닝 기술의 등장은 자연어 처리의 성능을 비약적으로 향상시켰는데, 인공 신경망이라 불리는 수학적 모형이 문맥에 따른 단어의 의미 변화까지 포착할 수 있게 되었기 때문이다. 이러한 발전 덕분에 번역기, 음성 인식 비서, 문서 요약 도구 등 다양한 서비스가 실용화되어 일반 사용자에게도 친숙해졌다.'
    },
    {
      id: 'p2',
      text: '자연어 처리 기술이 특히 주목받는 영역 가운데 하나가 기계 번역이다. 과거의 기계 번역은 단어 대 단어로 치환하는 방식이어서 어색한 문장이 많았지만, 현재의 신경망 기계 번역은 문장 전체의 맥락을 고려하여 자연스러운 번역을 생성한다. 이러한 변화의 핵심에는 주의 집중 메커니즘이라는 기술이 있는데, 이는 문장 속에서 번역에 중요한 단어에 더 큰 가중치를 부여하여 정확도를 높이는 방식이다. 그 결과 한국어와 영어처럼 어순이 크게 다른 언어 쌍의 번역 품질도 크게 개선되었다. 그러나 관용 표현이나 문화적 맥락이 담긴 문장의 번역에서는 여전히 인간 번역가의 역할이 중요하며, 기계 번역은 보조 도구로서의 기능을 수행하는 것이 현재의 합리적인 활용 방식이라 할 수 있다.'
    },
    {
      id: 'p3',
      text: '자연어 처리 기술의 발전은 편의성을 높이는 동시에 윤리적 쟁점도 제기하고 있다. 대규모 언어 모형이 학습하는 데이터에 편향이 포함되어 있을 경우, 그 편향이 결과물에 그대로 반영될 수 있다는 문제가 대표적이다. 예를 들어 특정 성별이나 인종에 대한 고정관념이 담긴 텍스트로 학습한 모형은 차별적인 표현을 생성할 위험이 있다. 또한 인공지능이 작성한 글이 사람이 쓴 글처럼 보이기 때문에, 허위 정보의 대량 생산과 유포에 악용될 가능성도 우려되고 있다. 이에 따라 인공지능의 투명성과 책임성을 확보하기 위한 제도적 장치를 마련해야 한다는 목소리가 높아지고 있으며, 기술 개발자와 사회 구성원 모두가 함께 논의에 참여해야 한다는 인식이 확산되고 있다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 73 지문 길이: ${total}자`);

  const p1s = findSentences(paragraphs[0].text);
  const p2s = findSentences(paragraphs[1].text);
  const p3s = findSentences(paragraphs[2].text);

  const intensive = buildTimeline(paragraphs, [
    { ranges: [{ pid: 'p1', text: p1s[0].text }], prompt: '우리 생활 곳곳에 스며들고 있는 분야는?', choices: [
      { id: 'A', text: '자연어 처리 분야' },
      { id: 'B', text: '양자 컴퓨팅 분야' },
      { id: 'C', text: '로봇 공학 분야' },
      { id: 'D', text: '유전자 편집 분야' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p1', text: p1s[1].text }], prompt: '자연어 처리의 정의로 적절한 것은?', choices: [
      { id: 'A', text: '인간의 일상 언어를 컴퓨터가 이해하고 생성할 수 있게 하는 기술' },
      { id: 'B', text: '컴퓨터 프로그래밍 언어를 자동으로 번역하는 소프트웨어 기술' },
      { id: 'C', text: '자연 현상을 수학적으로 모델링하는 과학 시뮬레이션 기술' },
      { id: 'D', text: '인간의 뇌파를 분석하여 생각을 읽어내는 신경과학 기술' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p1', text: p1s[2].text }], prompt: '최근 자연어 처리의 주류 방식은?', choices: [
      { id: 'A', text: '대규모 텍스트 데이터를 학습하여 패턴을 파악하는 기계 학습 방식' },
      { id: 'B', text: '문법 규칙을 사람이 일일이 코딩하여 입력하는 규칙 기반 방식' },
      { id: 'C', text: '사전에 등록된 단어만 인식하는 키워드 매칭 방식' },
      { id: 'D', text: '소수의 전문가가 수동으로 번역하는 인력 중심 방식' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p1', text: p1s[3].text }], prompt: '딥러닝 기술이 자연어 처리에 기여한 바는?', choices: [
      { id: 'A', text: '인공 신경망이 문맥에 따른 단어의 의미 변화까지 포착 가능해짐' },
      { id: 'B', text: '컴퓨터의 처리 속도가 느려져 정확한 분석이 가능해짐' },
      { id: 'C', text: '인간의 직관을 완전히 대체하여 번역가가 불필요해짐' },
      { id: 'D', text: '모든 언어의 문법 규칙을 자동으로 통일하는 것이 가능해짐' }
    ], answerId: 'A' },
    // p1 중심
    { ranges: [{ pid: 'p1', full: true }], prompt: '첫째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '자연어 처리의 개념, 발전 과정, 딥러닝의 기여' },
      { id: 'B', text: '컴퓨터 하드웨어의 발전 역사와 미래 전망' },
      { id: 'C', text: '프로그래밍 언어의 종류와 각각의 특성 비교' },
      { id: 'D', text: '인터넷의 탄생 과정과 월드와이드웹의 역사' }
    ], answerId: 'A' },
    // p2
    { ranges: [{ pid: 'p2', text: p2s[0].text }], prompt: '자연어 처리가 특히 주목받는 영역으로 언급된 것은?', choices: [
      { id: 'A', text: '기계 번역' },
      { id: 'B', text: '자율 주행' },
      { id: 'C', text: '의료 진단' },
      { id: 'D', text: '게임 개발' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p2', text: p2s[1].text }], prompt: '현재의 신경망 기계 번역이 과거와 다른 점은?', choices: [
      { id: 'A', text: '문장 전체의 맥락을 고려하여 자연스러운 번역을 생성' },
      { id: 'B', text: '단어 대 단어로 치환하여 빠르고 정확한 번역을 제공' },
      { id: 'C', text: '모든 언어의 번역이 완벽하여 오류가 전혀 발생하지 않음' },
      { id: 'D', text: '인간 번역가보다 문학 작품의 번역 품질이 항상 우수함' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p2', text: p2s[2].text }], prompt: '주의 집중 메커니즘의 작동 방식은?', choices: [
      { id: 'A', text: '번역에 중요한 단어에 더 큰 가중치를 부여하여 정확도를 높임' },
      { id: 'B', text: '불필요한 단어를 삭제하여 문장의 길이를 줄이는 방식' },
      { id: 'C', text: '모든 단어에 동일한 비중을 두어 균형 잡힌 번역을 생성' },
      { id: 'D', text: '사용자가 직접 중요 단어를 지정하면 해당 단어만 번역함' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p2', text: p2s[4].text }], prompt: '기계 번역의 현재 합리적 활용 방식으로 적절한 것은?', choices: [
      { id: 'A', text: '보조 도구로서의 기능을 수행하는 것' },
      { id: 'B', text: '인간 번역가를 완전히 대체하는 것' },
      { id: 'C', text: '문학 작품 번역에만 한정하여 사용하는 것' },
      { id: 'D', text: '일상 대화에서는 사용하지 않고 학술 논문에만 활용하는 것' }
    ], answerId: 'A' },
    // p2 중심
    { ranges: [{ pid: 'p2', full: true }], prompt: '둘째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '기계 번역의 발전 과정, 핵심 기술, 현재의 한계와 활용 방식' },
      { id: 'B', text: '세계 주요 언어의 문법적 특징 비교와 번역의 어려움 사례' },
      { id: 'C', text: '한국어 문법의 체계적 분석과 외국인 학습자를 위한 교육법' },
      { id: 'D', text: '번역 문학의 역사와 한국 문학의 해외 수출 현황에 대한 보고' }
    ], answerId: 'A' },
    // p3
    { ranges: [{ pid: 'p3', text: p3s[0].text }], prompt: '자연어 처리 기술 발전이 제기하는 문제는?', choices: [
      { id: 'A', text: '편의성 향상과 동시에 윤리적 쟁점도 제기됨' },
      { id: 'B', text: '기술 비용이 지나치게 높아 대중화가 불가능해짐' },
      { id: 'C', text: '컴퓨터의 전력 소비가 감소하여 환경에 긍정적 영향을 줌' },
      { id: 'D', text: '프로그래머의 일자리가 크게 증가하여 경제가 활성화됨' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p3', text: p3s[1].text }], prompt: '데이터 편향 문제의 본질은?', choices: [
      { id: 'A', text: '학습 데이터의 편향이 결과물에 그대로 반영될 수 있음' },
      { id: 'B', text: '데이터의 양이 너무 적어서 학습 자체가 불가능함' },
      { id: 'C', text: '모든 데이터가 동일한 품질을 유지하여 편향이 전혀 없음' },
      { id: 'D', text: '데이터를 수집하는 과정에서 저작권 문제만 발생함' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p3', text: p3s[3].text }], prompt: '인공지능이 작성한 글에 대한 우려로 적절한 것은?', choices: [
      { id: 'A', text: '허위 정보의 대량 생산과 유포에 악용될 가능성' },
      { id: 'B', text: '문학 작품의 질이 비약적으로 향상될 가능성' },
      { id: 'C', text: '인간의 창의력이 완전히 대체될 가능성' },
      { id: 'D', text: '모든 언어가 하나로 통합될 가능성' }
    ], answerId: 'A' },
    // p3 중심
    { ranges: [{ pid: 'p3', full: true }], prompt: '셋째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '자연어 처리 기술의 윤리적 쟁점과 제도적 대응의 필요성' },
      { id: 'B', text: '인공지능 기술의 상업적 성공 사례와 시장 규모의 성장 추이' },
      { id: 'C', text: '프로그래밍 교육의 중요성과 코딩 의무 교육 도입 방안' },
      { id: 'D', text: '사이버 보안 기술의 발전 과정과 해킹 방지 시스템의 구조' }
    ], answerId: 'A' }
  ]);

  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      { id: 'q1', prompt: '자연어 처리란 무엇을 가리키나요?', answerRanges: [findRange(paragraphs, 'p1', '인간이 일상에서 사용하는 언어를 컴퓨터가 이해하고 생성할 수 있도록 하는 기술')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q2', prompt: '딥러닝으로 가능해진 것은 무엇인가요?', answerRanges: [findRange(paragraphs, 'p1', '문맥에 따른 단어의 의미 변화까지 포착')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q3', prompt: '주의 집중 메커니즘은 어떻게 정확도를 높이나요?', answerRanges: [findRange(paragraphs, 'p2', '번역에 중요한 단어에 더 큰 가중치를 부여')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q4', prompt: '기계 번역의 합리적 활용 방식은 무엇인가요?', answerRanges: [findRange(paragraphs, 'p2', '보조 도구로서의 기능')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q5', prompt: '학습 데이터 편향의 위험성은 무엇인가요?', answerRanges: [findRange(paragraphs, 'p3', '차별적인 표현을 생성할 위험')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q6', prompt: '인공지능의 투명성 확보를 위해 필요한 것은?', answerRanges: [findRange(paragraphs, 'p3', '제도적 장치를 마련')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' }
    ]
  };

  return assembleFull({ dayIndex: 73, subArea: 'NONFICTION', paragraphs, intensive, recall, confirm });
}

// =============================================
// Day 74 - LITERATURE (문학)
// 주제: 황순원의 「소나기」 분석
// =============================================
function buildDay74() {
  const paragraphs = [
    {
      id: 'p1',
      text: '황순원의 「소나기」는 1953년에 발표된 단편 소설로, 시골 소년과 도시에서 온 소녀의 짧고 순수한 만남을 그린 작품이다. 소년은 개울가에서 물장난을 하다가 소녀를 처음 만나게 되는데, 소녀의 맑고 당당한 모습에 점차 마음이 끌리게 된다. 이후 두 사람은 들판과 수숫단 사이를 함께 걸으며 어린 시절 특유의 순수한 교감을 나누다가, 갑작스러운 소나기를 만나 수숫단 밑에 함께 숨게 된다. 이 소나기 장면은 두 사람의 감정이 절정에 이르는 순간을 상징하며, 자연 현상이 인물의 내면 심리를 반영하는 한국 소설의 전통적 기법을 잘 보여 준다. 소설의 결말에서 소녀가 병으로 세상을 떠났다는 소식은 독자에게 깊은 여운을 남기며, 아름답지만 다시 돌아올 수 없는 순간의 소중함을 되새기게 한다.'
    },
    {
      id: 'p2',
      text: '「소나기」의 서술 방식은 간결하면서도 감각적이다. 황순원은 인물의 심리를 직접 서술하지 않고 행동과 대화, 자연 풍경의 묘사를 통해 간접적으로 드러내는 방식을 택하였다. 소년이 소녀에게 마음이 끌리는 과정은 그가 개울가에서 자주 서성이거나 소녀의 행동을 몰래 바라보는 장면을 통해 암시된다. 이러한 행동 중심의 서술은 독자로 하여금 인물의 감정을 스스로 유추하도록 유도하여 읽는 재미를 더한다. 또한 들판, 개울, 수숫단, 코스모스 등 향토적 자연 소재가 등장하여 작품 전체에 서정적이고 목가적인 분위기를 형성한다. 특히 소나기가 내린 뒤 무지개가 뜨는 장면은 두 사람의 만남이 아름답지만 잠시뿐인 것임을 예고하는 복선으로 읽힌다.'
    },
    {
      id: 'p3',
      text: '「소나기」가 오랫동안 한국인에게 사랑받는 이유는 누구에게나 있을 법한 어린 시절의 순수한 감정을 보편적으로 환기하기 때문이다. 작품 속 소년과 소녀의 관계는 특정 시대나 계층에 한정되지 않고, 인간이라면 누구나 한 번쯤 경험했을 법한 설렘과 아쉬움을 대변한다. 또한 소녀가 세상을 떠났다는 결말은 독자에게 상실의 아픔을 전하면서도, 그 짧은 만남이 소년의 삶에 남긴 깊은 흔적을 암시한다. 황순원은 짧은 분량 안에서 인물의 성장과 이별을 압축적으로 그려 내어, 단편 소설이 지닌 문학적 가능성을 최대한 보여 주었다. 이 작품은 중학교 국어 교과서에 오랫동안 수록되어 한국 문학 교육의 대표적 교재로 활용되고 있으며, 세대를 넘어 전해지는 한국 문학의 고전으로 자리매김하고 있다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 74 지문 길이: ${total}자`);

  const p1s = findSentences(paragraphs[0].text);
  const p2s = findSentences(paragraphs[1].text);
  const p3s = findSentences(paragraphs[2].text);

  const intensive = buildTimeline(paragraphs, [
    { ranges: [{ pid: 'p1', text: p1s[0].text }], prompt: '「소나기」에 대한 설명으로 적절한 것은?', choices: [
      { id: 'A', text: '시골 소년과 도시 소녀의 짧고 순수한 만남을 그린 작품' },
      { id: 'B', text: '도시 청년의 사회적 성공과 좌절을 다룬 장편 소설' },
      { id: 'C', text: '전쟁 중 군인들의 우정과 희생을 형상화한 전쟁 문학' },
      { id: 'D', text: '농촌 사회의 계급 갈등과 토지 분쟁을 비판한 사회 소설' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p1', text: p1s[1].text }], prompt: '소년이 소녀에게 마음이 끌리게 된 계기는?', choices: [
      { id: 'A', text: '소녀의 맑고 당당한 모습' },
      { id: 'B', text: '소녀가 선물을 주었기 때문' },
      { id: 'C', text: '부모의 소개로 만나게 되어서' },
      { id: 'D', text: '같은 학교에 다니며 친해져서' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p1', text: p1s[3].text }], prompt: '소나기 장면이 상징하는 것으로 적절한 것은?', choices: [
      { id: 'A', text: '두 사람의 감정이 절정에 이르는 순간' },
      { id: 'B', text: '소년과 소녀 사이의 갈등이 최고조에 달하는 순간' },
      { id: 'C', text: '마을 주민들이 협력하여 자연재해를 극복하는 장면' },
      { id: 'D', text: '소년이 도시로 떠나기로 결심하는 전환점' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p1', text: p1s[4].text }], prompt: '소녀의 죽음이 독자에게 전하는 메시지는?', choices: [
      { id: 'A', text: '다시 돌아올 수 없는 순간의 소중함' },
      { id: 'B', text: '의학 기술의 발전이 시급하다는 경각심' },
      { id: 'C', text: '도시와 농촌의 의료 격차에 대한 비판' },
      { id: 'D', text: '어린이 건강 관리의 중요성에 대한 교훈' }
    ], answerId: 'A' },
    // p1 중심
    { ranges: [{ pid: 'p1', full: true }], prompt: '첫째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '「소나기」의 줄거리 요약과 소나기 장면의 상징적 의미' },
      { id: 'B', text: '황순원의 생애와 작가로서의 성장 배경에 대한 전기적 서술' },
      { id: 'C', text: '한국 전쟁 이후 문학계의 전반적 동향과 주요 작가들의 목록' },
      { id: 'D', text: '한국 농촌의 자연환경과 계절별 풍경의 과학적 분석' }
    ], answerId: 'A' },
    // p2
    { ranges: [{ pid: 'p2', text: p2s[0].text }], prompt: '「소나기」의 서술 방식의 특징은?', choices: [
      { id: 'A', text: '간결하면서도 감각적' },
      { id: 'B', text: '장황하고 설명적' },
      { id: 'C', text: '난해하고 추상적' },
      { id: 'D', text: '풍자적이고 비판적' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p2', text: p2s[1].text }], prompt: '황순원이 심리를 드러내는 방식으로 적절한 것은?', choices: [
      { id: 'A', text: '행동과 대화, 자연 풍경의 묘사를 통해 간접적으로 드러냄' },
      { id: 'B', text: '등장인물의 일기를 직접 인용하여 내면을 상세히 설명함' },
      { id: 'C', text: '전지적 서술자가 모든 인물의 생각을 낱낱이 분석하여 전달함' },
      { id: 'D', text: '편지 형식을 빌려 인물이 자신의 감정을 독자에게 고백함' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p2', text: p2s[3].text }], prompt: '행동 중심 서술이 독자에게 주는 효과는?', choices: [
      { id: 'A', text: '인물의 감정을 스스로 유추하도록 유도하여 읽는 재미를 더함' },
      { id: 'B', text: '줄거리를 빠르게 파악할 수 있어 독서 시간을 단축함' },
      { id: 'C', text: '등장인물에 대한 객관적 평가만 가능하여 감정 이입을 차단함' },
      { id: 'D', text: '작품의 주제를 명확히 제시하여 해석의 여지를 없앰' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p2', text: p2s[5].text }], prompt: '무지개가 뜨는 장면의 서사적 기능은?', choices: [
      { id: 'A', text: '만남이 아름답지만 잠시뿐임을 예고하는 복선' },
      { id: 'B', text: '두 사람의 관계가 영원히 지속될 것을 암시하는 장치' },
      { id: 'C', text: '마을에 행복한 사건이 일어날 것을 예고하는 길조' },
      { id: 'D', text: '소년이 도시로 유학을 떠나게 되는 계기를 마련하는 장면' }
    ], answerId: 'A' },
    // p2 중심
    { ranges: [{ pid: 'p2', full: true }], prompt: '둘째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '「소나기」의 간접적 서술 방식과 자연 소재의 서정적 기능' },
      { id: 'B', text: '한국 단편 소설의 역사적 전개와 주요 작가들의 작품 목록' },
      { id: 'C', text: '소설의 서술 시점 분류와 각 시점의 장단점에 대한 이론적 설명' },
      { id: 'D', text: '황순원이 영향받은 외국 문학 사조와 그 수용 과정에 대한 분석' }
    ], answerId: 'A' },
    // p3
    { ranges: [{ pid: 'p3', text: p3s[0].text }], prompt: '「소나기」가 사랑받는 이유로 제시된 것은?', choices: [
      { id: 'A', text: '어린 시절의 순수한 감정을 보편적으로 환기하기 때문' },
      { id: 'B', text: '역사적 사건을 정확하게 기록한 다큐멘터리이기 때문' },
      { id: 'C', text: '복잡한 추리 과정이 독자에게 지적 쾌감을 주기 때문' },
      { id: 'D', text: '외국어로 번역되어 세계적 베스트셀러가 되었기 때문' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p3', text: p3s[2].text }], prompt: '소녀의 죽음이 암시하는 것으로 적절한 것은?', choices: [
      { id: 'A', text: '짧은 만남이 소년의 삶에 남긴 깊은 흔적' },
      { id: 'B', text: '농촌 의료 체계의 심각한 문제점' },
      { id: 'C', text: '소년이 의사가 되겠다는 결심을 하게 된 동기' },
      { id: 'D', text: '전쟁으로 인한 민간인 피해의 참혹함' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p3', text: p3s[4].text }], prompt: '「소나기」의 문학사적 위치로 적절한 것은?', choices: [
      { id: 'A', text: '세대를 넘어 전해지는 한국 문학의 고전' },
      { id: 'B', text: '최초의 한글 소설로 국보에 지정된 문학 유산' },
      { id: 'C', text: '해외 문학상을 수상한 최초의 한국 작품' },
      { id: 'D', text: '대중 매체에 의해 상업적으로만 소비된 통속 문학' }
    ], answerId: 'A' },
    // p3 중심
    { ranges: [{ pid: 'p3', full: true }], prompt: '셋째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '「소나기」가 사랑받는 이유와 한국 문학 교육에서의 위상' },
      { id: 'B', text: '황순원과 동시대 작가들의 문학적 경쟁과 논쟁의 기록' },
      { id: 'C', text: '한국 중학교 국어 교과서의 변천사와 수록 기준의 변화' },
      { id: 'D', text: '단편 소설과 장편 소설의 형식적 차이에 대한 문학 이론' }
    ], answerId: 'A' }
  ]);

  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      { id: 'q1', prompt: '소년과 소녀가 처음 만나게 된 장소는 어디인가요?', answerRanges: [findRange(paragraphs, 'p1', '개울가에서')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q2', prompt: '소나기 장면이 상징하는 것은 무엇인가요?', answerRanges: [findRange(paragraphs, 'p1', '두 사람의 감정이 절정에 이르는 순간')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q3', prompt: '황순원이 심리를 드러내는 데 사용한 방식은?', answerRanges: [findRange(paragraphs, 'p2', '행동과 대화, 자연 풍경의 묘사를 통해 간접적으로')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q4', prompt: '무지개 장면의 서사적 기능은 무엇인가요?', answerRanges: [findRange(paragraphs, 'p2', '아름답지만 잠시뿐인 것임을 예고하는 복선')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q5', prompt: '이 작품이 보편적으로 사랑받는 이유는 무엇인가요?', answerRanges: [findRange(paragraphs, 'p3', '어린 시절의 순수한 감정을 보편적으로 환기')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q6', prompt: '이 작품의 문학사적 위치는 어떻게 평가되나요?', answerRanges: [findRange(paragraphs, 'p3', '한국 문학의 고전으로 자리매김')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' }
    ]
  };

  return assembleFull({ dayIndex: 74, subArea: 'LITERATURE', paragraphs, intensive, recall, confirm });
}

// =============================================
// Day 75 - NONFICTION (비문학)
// 주제: 빛의 성질과 광학의 원리
// =============================================
function buildDay75() {
  const paragraphs = [
    {
      id: 'p1',
      text: '빛은 우리가 세상을 볼 수 있게 해 주는 근본적인 매개체이자, 물리학에서 가장 활발하게 연구되어 온 대상 중 하나이다. 빛의 본질에 대한 탐구는 오래전부터 이루어져 왔는데, 17세기에 뉴턴은 빛이 작은 입자로 이루어져 있다는 입자설을 주장한 반면, 같은 시기의 하위헌스는 빛이 파동의 형태로 전파된다는 파동설을 제시하였다. 이 두 이론은 오랜 기간 논쟁의 대상이 되었으나, 19세기에 영의 이중 슬릿 실험이 빛의 간섭 현상을 증명함으로써 파동설이 큰 지지를 얻게 되었다. 그러나 20세기 초에 아인슈타인이 광전 효과를 설명하면서 빛이 입자적 성질도 지닌다는 사실이 다시 밝혀졌고, 결국 빛은 파동과 입자의 이중성을 동시에 지닌 존재로 이해되기에 이르렀다.'
    },
    {
      id: 'p2',
      text: '빛의 성질 가운데 일상에서 가장 쉽게 관찰할 수 있는 것은 반사와 굴절이다. 반사란 빛이 물체의 표면에 부딪혀 되돌아오는 현상으로, 거울에 비친 자신의 모습을 볼 수 있는 것이 이 원리 덕분이다. 굴절은 빛이 서로 다른 매질의 경계면을 지날 때 진행 방향이 꺾이는 현상인데, 물속에 담근 젓가락이 꺾여 보이는 것이 대표적인 사례이다. 굴절이 일어나는 까닭은 빛이 매질에 따라 속도가 달라지기 때문이며, 이 속도의 비율을 굴절률이라 부른다. 이러한 반사와 굴절의 원리는 안경, 망원경, 카메라 렌즈 등 다양한 광학 기기의 설계에 핵심적으로 활용되고 있으며, 현대 광통신 기술에서도 광섬유를 통해 빛을 전달하는 데 굴절의 원리가 적용되고 있다.'
    },
    {
      id: 'p3',
      text: '빛의 또 다른 중요한 성질로 분산이 있다. 분산이란 백색광이 프리즘을 통과할 때 여러 색깔의 빛으로 나뉘는 현상을 말하는데, 이는 빛의 파장에 따라 굴절률이 다르기 때문에 일어난다. 파장이 짧은 보라색 빛은 많이 굴절되고, 파장이 긴 빨간색 빛은 적게 굴절되어 색깔별로 분리되는 것이다. 비가 온 뒤 하늘에 나타나는 무지개도 분산의 원리로 설명할 수 있는데, 공기 중에 떠 있는 물방울이 프리즘 역할을 하여 햇빛을 여러 색깔로 나누어 보여 주는 것이다. 이러한 빛의 분산 현상은 분광학이라는 학문의 기초가 되어, 별빛을 분석하여 멀리 떨어진 별의 구성 원소와 온도를 알아내는 천문학 연구에도 활용되고 있다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 75 지문 길이: ${total}자`);

  const p1s = findSentences(paragraphs[0].text);
  const p2s = findSentences(paragraphs[1].text);
  const p3s = findSentences(paragraphs[2].text);

  const intensive = buildTimeline(paragraphs, [
    { ranges: [{ pid: 'p1', text: p1s[0].text }], prompt: '빛에 대한 설명으로 적절한 것은?', choices: [
      { id: 'A', text: '세상을 볼 수 있게 해 주는 근본적 매개체이자 활발히 연구된 대상' },
      { id: 'B', text: '소리를 전달하는 매체로서 청각의 기본 원리를 설명하는 존재' },
      { id: 'C', text: '지구의 자전을 유발하는 에너지원으로 중력과 관련된 힘' },
      { id: 'D', text: '물질의 내부 구조를 결정하는 화학 결합의 핵심 요소' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p1', text: p1s[1].text }], prompt: '뉴턴이 주장한 빛의 이론은?', choices: [
      { id: 'A', text: '빛이 작은 입자로 이루어져 있다는 입자설' },
      { id: 'B', text: '빛이 파동의 형태로 전파된다는 파동설' },
      { id: 'C', text: '빛이 열에 의해 발생한다는 열복사설' },
      { id: 'D', text: '빛이 전자기장에 의해 생성된다는 장이론' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p1', text: p1s[2].text }], prompt: '이중 슬릿 실험이 증명한 것은?', choices: [
      { id: 'A', text: '빛의 간섭 현상, 파동설에 큰 지지를 줌' },
      { id: 'B', text: '빛의 입자적 성질만이 유일하게 올바르다는 사실' },
      { id: 'C', text: '빛이 진공 속에서는 전혀 전파되지 않는다는 점' },
      { id: 'D', text: '빛의 속도가 관측자에 따라 달라진다는 원리' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p1', text: p1s[3].text }], prompt: '아인슈타인이 밝힌 것으로 적절한 것은?', choices: [
      { id: 'A', text: '빛이 입자적 성질도 지닌다는 사실 (광전 효과)' },
      { id: 'B', text: '빛의 속도가 무한하다는 사실' },
      { id: 'C', text: '빛이 오직 파동으로만 존재한다는 최종 결론' },
      { id: 'D', text: '빛이 중력에 전혀 영향을 받지 않는다는 발견' }
    ], answerId: 'A' },
    // p1 중심
    { ranges: [{ pid: 'p1', full: true }], prompt: '첫째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '빛의 본질에 대한 역사적 논쟁과 파동-입자 이중성의 확립' },
      { id: 'B', text: '뉴턴의 역학 법칙과 그것이 현대 물리학에 미친 영향' },
      { id: 'C', text: '전자기파의 종류별 특성과 각각의 산업적 활용 분야' },
      { id: 'D', text: '양자역학의 수학적 기초와 슈뢰딩거 방정식의 유도 과정' }
    ], answerId: 'A' },
    // p2
    { ranges: [{ pid: 'p2', text: p2s[0].text }], prompt: '일상에서 가장 쉽게 관찰할 수 있는 빛의 성질은?', choices: [
      { id: 'A', text: '반사와 굴절' },
      { id: 'B', text: '편광과 회절' },
      { id: 'C', text: '간섭과 분산' },
      { id: 'D', text: '흡수와 방출' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p2', text: p2s[1].text }], prompt: '반사의 정의로 적절한 것은?', choices: [
      { id: 'A', text: '빛이 물체의 표면에 부딪혀 되돌아오는 현상' },
      { id: 'B', text: '빛이 매질의 경계면에서 꺾이는 현상' },
      { id: 'C', text: '빛이 여러 색깔로 분리되는 현상' },
      { id: 'D', text: '빛이 장애물 뒤쪽으로 돌아 들어가는 현상' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p2', text: p2s[2].text }], prompt: '굴절의 대표적 사례로 제시된 것은?', choices: [
      { id: 'A', text: '물속에 담근 젓가락이 꺾여 보이는 현상' },
      { id: 'B', text: '거울에 비친 자신의 모습을 볼 수 있는 현상' },
      { id: 'C', text: '무지개가 비 온 뒤 하늘에 나타나는 현상' },
      { id: 'D', text: '그림자가 물체의 뒤쪽에 생기는 현상' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p2', text: p2s[3].text }], prompt: '굴절이 일어나는 까닭은?', choices: [
      { id: 'A', text: '빛이 매질에 따라 속도가 달라지기 때문' },
      { id: 'B', text: '빛이 매질에 관계없이 항상 같은 속도로 이동하기 때문' },
      { id: 'C', text: '빛의 색깔이 매질에 의해 변하기 때문' },
      { id: 'D', text: '빛이 매질을 통과하면서 에너지를 완전히 잃기 때문' }
    ], answerId: 'A' },
    // p2 중심
    { ranges: [{ pid: 'p2', full: true }], prompt: '둘째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '반사와 굴절의 원리 및 광학 기기와 광통신에의 활용' },
      { id: 'B', text: '렌즈 제조 기술의 발전 과정과 안경 산업의 시장 규모' },
      { id: 'C', text: '카메라의 역사적 발전과 디지털 사진 기술의 미래 전망' },
      { id: 'D', text: '빛의 속도 측정 실험의 역사와 주요 과학자들의 업적 소개' }
    ], answerId: 'A' },
    // p3
    { ranges: [{ pid: 'p3', text: p3s[0].text }], prompt: '빛의 또 다른 중요한 성질로 언급된 것은?', choices: [
      { id: 'A', text: '분산' },
      { id: 'B', text: '편광' },
      { id: 'C', text: '흡수' },
      { id: 'D', text: '형광' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p3', text: p3s[1].text }], prompt: '분산이 일어나는 원인은?', choices: [
      { id: 'A', text: '빛의 파장에 따라 굴절률이 다르기 때문' },
      { id: 'B', text: '빛의 밝기에 따라 반사율이 달라지기 때문' },
      { id: 'C', text: '프리즘의 무게에 따라 빛의 속도가 변하기 때문' },
      { id: 'D', text: '백색광의 온도에 따라 파장이 동일하게 유지되기 때문' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p3', text: p3s[3].text }], prompt: '무지개가 나타나는 원리로 적절한 것은?', choices: [
      { id: 'A', text: '물방울이 프리즘 역할을 하여 햇빛을 여러 색깔로 나눔' },
      { id: 'B', text: '공기 중의 먼지가 빛을 반사하여 색깔이 나타남' },
      { id: 'C', text: '구름 속의 얼음 결정이 빛을 흡수하여 발색함' },
      { id: 'D', text: '태양의 열에너지가 대기 중 수증기를 가열하여 발광함' }
    ], answerId: 'A' },
    { ranges: [{ pid: 'p3', text: p3s[4].text }], prompt: '분산 현상이 활용되는 분야로 적절한 것은?', choices: [
      { id: 'A', text: '분광학을 기초로 한 천문학 연구' },
      { id: 'B', text: '해양 생물의 생태를 관찰하는 해양학 연구' },
      { id: 'C', text: '토양의 성분을 분석하는 농업 화학 연구' },
      { id: 'D', text: '인체 내부를 촬영하는 의료 영상 진단 연구' }
    ], answerId: 'A' },
    // p3 중심
    { ranges: [{ pid: 'p3', full: true }], prompt: '셋째 문단의 중심 내용으로 가장 적절한 것은?', choices: [
      { id: 'A', text: '빛의 분산 현상의 원리, 무지개의 생성, 분광학의 활용' },
      { id: 'B', text: '프리즘의 제조 공정과 유리 산업의 발전 과정에 대한 설명' },
      { id: 'C', text: '무지개에 관한 동서양의 신화와 문학 작품 속 상징 분석' },
      { id: 'D', text: '별의 탄생과 소멸 과정에 대한 천체 물리학적 이론 소개' }
    ], answerId: 'A' }
  ]);

  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      { id: 'q1', prompt: '뉴턴이 주장한 빛에 대한 이론은 무엇인가요?', answerRanges: [findRange(paragraphs, 'p1', '입자설')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q2', prompt: '빛이 파동과 입자의 성질을 동시에 지닌 것을 무엇이라 하나요?', answerRanges: [findRange(paragraphs, 'p1', '이중성')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q3', prompt: '굴절이 일어나는 까닭은 무엇인가요?', answerRanges: [findRange(paragraphs, 'p2', '빛이 매질에 따라 속도가 달라지기 때문')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q4', prompt: '빛의 속도 비율을 나타내는 용어는 무엇인가요?', answerRanges: [findRange(paragraphs, 'p2', '굴절률')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q5', prompt: '분산이란 어떤 현상인가요?', answerRanges: [findRange(paragraphs, 'p3', '백색광이 프리즘을 통과할 때 여러 색깔의 빛으로 나뉘는 현상')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q6', prompt: '분산 현상의 기초가 되는 학문은 무엇인가요?', answerRanges: [findRange(paragraphs, 'p3', '분광학')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' },
      { id: 'q7', prompt: '무지개에서 프리즘 역할을 하는 것은 무엇인가요?', answerRanges: [findRange(paragraphs, 'p3', '물방울이 프리즘 역할')], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: 'ANY' }
    ]
  };

  return assembleFull({ dayIndex: 75, subArea: 'NONFICTION', paragraphs, intensive, recall, confirm });
}

// =============================================
// 메인 실행
// =============================================
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const BATCH_PATH = path.join(ROOT, 'generated', 'daily-batch-reading-russell1.json');
  const STATIC_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'russell1');

  console.log('=== 러셀1 Day 71~75 콘텐츠 빌드 시작 ===\n');

  const day71 = buildDay71();
  const day72 = buildDay72();
  const day73 = buildDay73();
  const day74 = buildDay74();
  const day75 = buildDay75();

  const contents = [
    { day: 71, content: day71, index: 70 },
    { day: 72, content: day72, index: 71 },
    { day: 73, content: day73, index: 72 },
    { day: 74, content: day74, index: 73 },
    { day: 75, content: day75, index: 74 }
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
    if (content.payload.recall.seedPenalty !== 1) {
      console.log(`    [오류] seedPenalty가 1이 아님!`);
      hasError = true;
    }
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
  if (!fs.existsSync(STATIC_DIR)) {
    fs.mkdirSync(STATIC_DIR, { recursive: true });
  }
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
