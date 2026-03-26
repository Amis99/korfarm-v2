/**
 * 러셀3 Day 29~30 일일독해 콘텐츠 빌더
 * - Day 29: 비문학 (NONFICTION) - 경제: 화폐의 시간 가치와 할인율
 * - Day 30: 문학 (LITERATURE) - 현대소설: 이효석 「메밀꽃 필 무렵」 감상
 */

const fs = require('fs');
const path = require('path');

// ── 유틸리티 함수 ──

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
  if (start === -1) throw new Error(`"${searchText.substring(0, 30)}..." not found in ${pid}`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function findAllRanges(paragraphs, searchText) {
  const ranges = [];
  for (const para of paragraphs) {
    let idx = 0;
    while (true) {
      const found = para.text.indexOf(searchText, idx);
      if (found === -1) break;
      ranges.push({ paragraphId: para.id, start: found, end: found + searchText.length });
      idx = found + 1;
    }
  }
  if (ranges.length === 0) throw new Error(`"${searchText}" 를 지문 어디에서도 찾을 수 없습니다.`);
  return ranges;
}

function makeIntensiveStep(stepId, ranges, prompt, choices, answerId) {
  return {
    stepId,
    highlight: { ranges },
    question: {
      prompt,
      choices: choices.map((t, i) => ({ id: ['A','B','C','D'][i], text: t })),
      answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  };
}

function makeConfirmQ(id, prompt, paragraphs, searchText) {
  return {
    id,
    prompt,
    answerRanges: findAllRanges(paragraphs, searchText),
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true,
    answerMatchMode: 'ANY'
  };
}

function buildContent(dayIndex, subArea, paragraphTexts, intensiveSteps, recallCards, confirmQuestions) {
  const dayStr = String(dayIndex).padStart(3, '0');
  const isLit = subArea === 'LITERATURE';
  const title = `일일 독해(러셀 3) Day ${dayIndex} ${isLit ? '문학' : '비문학'}`;
  const paragraphs = paragraphTexts.map((t, i) => ({ id: `p${i+1}`, text: t }));

  return {
    contentId: `dr-r3-${dayStr}`,
    contentType: 'DAILY_READING',
    version: 1,
    status: 'PUBLISHED',
    title,
    description: '일일 독해 - 정독·복기·확인',
    targetLevel: 'RUSSELL_3',
    schoolGradeRange: { min: 9, max: 10 },
    area: 'READING',
    subArea: subArea,
    competencies: ['READING'],
    tags: ['daily'],
    access: { mode: 'FREE' },
    seedReward: { seedType: 'WHEAT', count: 3, multiplier: 1 },
    timeLimitSec: 480,
    assets: {},
    payload: {
      passage: { format: 'TEXT', paragraphs },
      intensive: { timeline: intensiveSteps },
      recall: {
        cards: recallCards.map((t, i) => ({ id: `c${i+1}`, text: t })),
        correctOrder: recallCards.map((_, i) => `c${i+1}`),
        seedPenalty: 1
      },
      confirm: { questions: confirmQuestions }
    }
  };
}

function buildBatchItem(content, dayIndex, subArea) {
  return {
    content_type: 'DAILY_READING',
    level_id: 'RUSSELL_3',
    area: 'READING',
    sub_area: subArea,
    day_index: dayIndex,
    module_key: 'reading_training',
    schema_version: '1.0',
    content
  };
}

// ────────────────────────────────────────────────────
// Day 29 - 비문학: 화폐의 시간 가치와 할인율
// ────────────────────────────────────────────────────

function buildDay29() {
  const p1 = '오늘의 100만 원과 1년 뒤의 100만 원은 액면 금액이 같지만 경제적 가치는 다르다. 오늘 받은 100만 원은 은행에 예치하거나 투자에 활용하여 이자 수익을 얻을 수 있지만, 1년 뒤에야 받는 100만 원에는 그러한 기회가 없기 때문이다. 이처럼 같은 금액이라도 수령 시점에 따라 경제적 가치가 달라지는 현상을 화폐의 시간 가치라 한다. 화폐의 시간 가치를 이해하는 것은 저축이나 투자, 대출 등의 다양한 경제 활동에서 합리적인 의사 결정을 내리는 데 필수적이다.';
  const p2 = '화폐의 시간 가치를 구체적으로 계산할 때 사용되는 핵심 개념이 할인율이다. 할인율이란 미래의 일정 금액을 현재 가치로 환산하기 위해 적용하는 비율을 의미한다. 예를 들어 할인율이 연 5%일 때, 1년 뒤에 받을 105만 원의 현재 가치는 100만 원이 된다. 이는 현재의 100만 원을 연 5%의 이율로 운용하면 1년 뒤에 105만 원이 되므로, 두 금액의 경제적 가치가 동등하다는 의미이다. 미래 금액을 현재 가치로 환산하는 과정을 할인이라고 하며, 이를 통해 산출된 값을 현재 가치 또는 현가라고 부른다. 반대로 현재 금액에 이율을 적용하여 미래 가치를 산출하는 과정은 복리 계산이라 불린다. 할인과 복리 계산은 방향만 다를 뿐 동일한 원리에 기초한다.';
  const p3 = '할인율의 크기는 여러 요인에 의해 결정된다. 가장 기본적인 것은 무위험 이자율로, 이는 국채와 같이 거의 위험이 없는 자산에서 얻을 수 있는 수익률이다. 여기에 투자 대상의 위험도를 반영한 위험 프리미엄이 추가되어 최종 할인율이 산정된다. 위험이 큰 투자일수록 위험 프리미엄이 높아져 할인율도 커진다. 할인율이 높을수록 동일한 미래 금액의 현재 가치는 작아지고, 할인율이 낮을수록 현재 가치는 커진다. 이러한 관계는 기업이 투자 사업의 타당성을 평가하거나 채권의 적정 가격을 산출할 때 핵심적인 역할을 한다.';
  const p4 = '할인율은 기업 재무 분석에서도 중요한 도구이다. 기업은 신규 사업에 투자할지 여부를 판단할 때 해당 사업이 미래에 창출할 현금 흐름을 할인율로 환산하여 순현재가치를 계산한다. 순현재가치란 미래 현금 흐름의 현재 가치 합계에서 초기 투자 비용을 뺀 값이다. 순현재가치가 양수이면 투자 수익이 비용을 초과하므로 사업 추진이 경제적으로 타당하다고 판단한다. 또한 중앙은행이 기준 금리를 인상하면 시장 전반의 할인율이 상승하여 자산 가격이 하락하는 경향이 나타나고, 반대로 기준 금리를 인하하면 할인율이 낮아져 자산 가격이 상승하는 경향이 나타난다. 이처럼 할인율은 개인의 저축 및 투자 판단에서부터 기업의 경영 전략, 나아가 국가 경제 정책에 이르기까지 광범위한 영역에 영향을 미치는 핵심 변수이다.';

  const paragraphs = [
    { id: 'p1', text: p1 }, { id: 'p2', text: p2 },
    { id: 'p3', text: p3 }, { id: 'p4', text: p4 }
  ];

  const r = (pid, txt) => findRange(paragraphs, pid, txt);
  const timeline = [];
  let stepNum = 1;

  // p1
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p1', '오늘 받은 100만 원은 은행에 예치하거나 투자에 활용하여 이자 수익을 얻을 수 있지만, 1년 뒤에야 받는 100만 원에는 그러한 기회가 없기 때문이다.')],
    '오늘의 100만 원이 1년 뒤의 100만 원보다 가치 있는 이유로 적절한 것은?',
    [
      '물가 상승으로 인해 화폐 구매력이 줄어들기 때문이다.',
      '오늘 받은 돈을 투자해 이자 수익을 올릴 수 있기 때문이다.',
      '정부가 화폐의 액면 금액을 주기적으로 변경하기 때문이다.',
      '미래에는 은행의 이자율이 반드시 하락하게 되기 때문이다.'
    ], 'B'));

  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p1', '이처럼 같은 금액이라도 수령 시점에 따라 경제적 가치가 달라지는 현상을 화폐의 시간 가치라 한다.')],
    '화폐의 시간 가치에 대한 설명으로 적절한 것은?',
    [
      '화폐를 오래 보관할수록 재질이 훼손되어 가치가 감소하는 현상이다.',
      '같은 금액도 수령 시점에 따라 경제적 가치가 달라지는 현상이다.',
      '외국 화폐와 교환할 때 환율 변동에 따른 손익을 의미한다.',
      '화폐가 발행된 시대에 따라 수집 가치가 달라지는 현상이다.'
    ], 'B'));

  // p1 중심내용
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [{ paragraphId: 'p1', start: 0, end: p1.length }],
    '이 문단의 중심 내용으로 가장 적절한 것은?',
    [
      '화폐의 시간 가치 개념과 그 중요성에 대한 설명이다.',
      '은행 예금 이자율의 산정 기준에 관한 설명이다.',
      '물가 상승률과 실질 소득 관계에 대한 분석이다.',
      '화폐 제도의 역사적 변천 과정에 대한 서술이다.'
    ], 'A'));

  // p2
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p2', '할인율이란 미래의 일정 금액을 현재 가치로 환산하기 위해 적용하는 비율을 의미한다.')],
    '할인율에 대한 정의로 적절한 것은?',
    [
      '상품 가격에서 일정 비율을 줄여 주는 판매 전략이다.',
      '미래 금액을 현재 가치로 환산할 때 적용하는 비율이다.',
      '과거 물가 대비 현재 물가의 변동을 나타내는 비율이다.',
      '은행이 대출 이자를 산정할 때 적용하는 수수료이다.'
    ], 'B'));

  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p2', '미래 금액을 현재 가치로 환산하는 과정을 할인이라고 하며, 이를 통해 산출된 값을 현재 가치 또는 현가라고 부른다.')],
    '할인 과정을 거쳐 산출된 값을 부르는 용어로 적절한 것은?',
    [
      '미래 가치 또는 종가라고 부른다.',
      '현재 가치 또는 현가라고 부른다.',
      '명목 가치 또는 액면가라고 부른다.',
      '실질 가치 또는 구매력이라고 부른다.'
    ], 'B'));

  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p2', '할인과 복리 계산은 방향만 다를 뿐 동일한 원리에 기초한다.')],
    '할인과 복리 계산의 관계에 대한 설명으로 적절한 것은?',
    [
      '두 개념은 완전히 별개의 원리에 기초하고 있다.',
      '복리 계산이 할인이라는 개념의 한 종류이다.',
      '계산 방향만 다를 뿐 동일한 원리에 기초한다.',
      '할인은 이율을 높이고 복리는 이율을 낮춘다.'
    ], 'C'));

  // p2 중심내용
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [{ paragraphId: 'p2', start: 0, end: p2.length }],
    '이 문단의 중심 내용으로 가장 적절한 것은?',
    [
      '할인율의 정의와 할인 및 복리 계산 원리에 대한 설명이다.',
      '은행 예금 상품의 종류와 이자 계산 방법에 관한 분석이다.',
      '채권 시장에서 투자자가 수익을 올리는 구체적 방법이다.',
      '물가 상승률을 반영한 실질 이자율 산정에 대한 설명이다.'
    ], 'A'));

  // p3
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p3', '가장 기본적인 것은 무위험 이자율로, 이는 국채와 같이 거의 위험이 없는 자산에서 얻을 수 있는 수익률이다.')],
    '무위험 이자율에 대한 설명으로 적절한 것은?',
    [
      '주식 투자에서 기대할 수 있는 최고 수익률이다.',
      '국채처럼 위험이 거의 없는 자산의 수익률이다.',
      '부동산 투자 시에 적용되는 임대 수익률이다.',
      '중앙은행이 시중 은행에 대출할 때의 이자율이다.'
    ], 'B'));

  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p3', '할인율이 높을수록 동일한 미래 금액의 현재 가치는 작아지고, 할인율이 낮을수록 현재 가치는 커진다.')],
    '할인율과 현재 가치의 관계로 적절한 것은?',
    [
      '할인율이 높아지면 현재 가치도 함께 커진다.',
      '할인율이 높아지면 현재 가치는 오히려 작아진다.',
      '할인율의 변동은 현재 가치에 영향을 미치지 않는다.',
      '할인율이 낮아지면 현재 가치도 함께 작아진다.'
    ], 'B'));

  // p3 중심내용
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [{ paragraphId: 'p3', start: 0, end: p3.length }],
    '이 문단의 중심 내용으로 가장 적절한 것은?',
    [
      '할인율을 결정하는 요인과 현재 가치에 미치는 영향이다.',
      '국채의 발행 과정과 정부의 재정 운용 방식에 관한 것이다.',
      '위험 프리미엄을 낮추기 위한 구체적인 투자 전략이다.',
      '기업이 신규 사업을 선정하는 절차에 대한 설명이다.'
    ], 'A'));

  // p4
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p4', '순현재가치란 미래 현금 흐름의 현재 가치 합계에서 초기 투자 비용을 뺀 값이다.')],
    '순현재가치의 정의로 적절한 것은?',
    [
      '기업의 연간 매출액 합계에서 고정 비용을 뺀 값이다.',
      '미래 현금 흐름의 현재 가치에서 초기 투자 비용을 뺀 값이다.',
      '투자 수익률에서 물가 상승률을 차감한 실질 수익률이다.',
      '할인율에 투자 기간을 곱하여 산출한 총 할인 비용이다.'
    ], 'B'));

  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p4', '중앙은행이 기준 금리를 인상하면 시장 전반의 할인율이 상승하여 자산 가격이 하락하는 경향이 나타나고, 반대로 기준 금리를 인하하면 할인율이 낮아져 자산 가격이 상승하는 경향이 나타난다.')],
    '기준 금리 인상이 자산 가격에 미치는 영향으로 적절한 것은?',
    [
      '할인율이 상승하면서 자산 가격이 하락하는 경향이 나타난다.',
      '할인율이 하락하면서 자산 가격이 상승하는 경향이 나타난다.',
      '기준 금리의 변동이 자산 가격에 영향을 미치지는 않는다.',
      '할인율은 변동하지 않고 자산 가격만 단독으로 상승한다.'
    ], 'A'));

  // p4 중심내용
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [{ paragraphId: 'p4', start: 0, end: p4.length }],
    '이 문단의 중심 내용으로 가장 적절한 것은?',
    [
      '할인율이 기업 투자와 국가 경제 정책에 미치는 영향이다.',
      '중앙은행의 설립 배경과 역사적 변천 과정에 관한 것이다.',
      '기업의 재무제표를 분석하는 구체적 방법에 관한 것이다.',
      '개인 투자자가 주식 시장에서 수익을 극대화하는 전략이다.'
    ], 'A'));

  const recallCards = [
    '오늘의 100만 원은 투자하여 이자 수익을 얻을 수 있으므로, 1년 뒤의 100만 원보다 경제적 가치가 크다.',
    '수령 시점에 따라 같은 금액의 경제적 가치가 달라지는 현상을 화폐의 시간 가치라 한다.',
    '할인율은 미래 금액을 현재 가치로 환산할 때 적용하는 비율이며, 할인을 통해 산출된 값을 현가라 한다.',
    '현재 금액에 이율을 적용해 미래 가치를 구하는 복리 계산은 할인과 방향만 다를 뿐 동일한 원리이다.',
    '할인율은 무위험 이자율에 투자 위험도를 반영한 위험 프리미엄을 더하여 결정된다.',
    '할인율이 높을수록 미래 금액의 현재 가치는 작아지고, 할인율이 낮을수록 현재 가치는 커진다.',
    '기업은 미래 현금 흐름의 현재 가치에서 초기 투자 비용을 뺀 순현재가치로 사업 타당성을 평가한다.',
    '기준 금리 인상은 할인율 상승과 자산 가격 하락으로 이어지며, 할인율은 경제 전반에 영향을 미친다.'
  ];

  const confirmQs = [
    makeConfirmQ('q1', '수령 시점에 따라 동일 금액의 가치가 달라지는 현상을 무엇이라 하는가?', paragraphs, '화폐의 시간 가치'),
    makeConfirmQ('q2', '미래 금액을 현재 가치로 환산하기 위해 적용하는 비율을 무엇이라 하는가?', paragraphs, '할인율'),
    makeConfirmQ('q3', '할인 과정을 거쳐 산출된 값을 다른 말로 무엇이라 부르는가?', paragraphs, '현가'),
    makeConfirmQ('q4', '거의 위험이 없는 자산에서 얻는 수익률을 무엇이라 하는가?', paragraphs, '무위험 이자율'),
    makeConfirmQ('q5', '투자 대상의 위험도를 반영하여 할인율에 추가되는 것은 무엇인가?', paragraphs, '위험 프리미엄'),
    makeConfirmQ('q6', '미래 현금 흐름의 현재 가치 합계에서 초기 투자 비용을 뺀 값을 무엇이라 하는가?', paragraphs, '순현재가치'),
  ];

  const content = buildContent(29, 'NONFICTION', [p1, p2, p3, p4], timeline, recallCards, confirmQs);
  return { content, batchItem: buildBatchItem(content, 29, 'NONFICTION') };
}

// ────────────────────────────────────────────────────
// Day 30 - 문학: 이효석 「메밀꽃 필 무렵」 감상
// ────────────────────────────────────────────────────

function buildDay30() {
  const p1 = '여름 장이 끝나자 허 생원은 늘 그랬듯이 충주 쪽으로 길을 잡았다. 달밤이었다. 봉평에서 대화까지는 칠십 리 길이었으나 달빛이 워낙 환하여 발밑이 훤히 보였다. 메밀밭이 길 양옆으로 끝없이 펼쳐져 있었는데, 흰 메밀꽃이 달빛에 젖어 소금을 뿌린 듯 온통 하얗게 빛나고 있었다. 허 생원은 그 풍경에 잠시 발걸음을 멈추고 먼 산자락을 바라보았다. 장돌뱅이 생활을 하며 수없이 지나쳤던 길이었으나, 이 밤의 풍경은 유독 가슴에 사무쳤다. 바람이 불 때마다 메밀꽃 물결이 일렁이며 달빛을 받아 은빛 파도를 이루었다. 산허리를 감은 안개 너머로 물레방아 소리가 가늘게 들려왔고, 길가의 풀벌레 소리가 고요한 밤을 채우고 있었다.';
  const p2 = '함께 길을 걷던 조 선달이 심심한 듯 이야기를 꺼냈다. 허 생원은 한참을 걸으며 말없이 듣기만 하다가, 문득 젊은 시절 봉평 장에서 겪었던 일을 떠올렸다. 그때 허 생원은 스무 살 남짓한 젊은 장돌뱅이였고, 봉평 장터에서 한 처녀를 만났던 것이다. 달빛이 유난히 밝았던 밤, 물레방아간 근처에서 처녀와 마주친 허 생원은 까닭 모를 설렘에 가슴이 두근거렸다. 처녀는 수줍은 얼굴로 고개를 숙이고 있었고, 개울물 소리만이 둘 사이의 침묵을 메우고 있었다. 그 뒤로 허 생원은 봉평 장이 설 때마다 그 처녀를 찾았으나, 처녀는 어디론가 떠나 버렸는지 두 번 다시 만날 수 없었다.';
  const p3 = '허 생원은 그 이야기를 하면서도 자신의 목소리가 떨리는 것을 느꼈다. 몇십 년이 지난 지금도 그 달밤은 가슴속에 선명하게 남아 있었다. 조 선달은 묵묵히 듣고 있었고, 나귀의 방울 소리만이 메밀밭 사이로 퍼져 나갔다. 그때 앞서 가던 동이가 뒤를 돌아보며 말을 걸어왔다. 동이는 아직 나이가 어린 장돌뱅이였는데, 허 생원은 그 아이를 볼 때마다 묘한 감정이 일었다. 동이의 왼손잡이 버릇이나 말투가 어쩐지 낯설지 않았고, 충주 집이라는 동이의 어머니가 혹시 그때 그 처녀가 아닐까 하는 생각이 떠올랐다가 사라지기를 반복하였다.';
  const p4 = '산모퉁이를 돌아서자 대화 마을의 불빛이 멀리 보였다. 메밀밭은 여전히 하얗게 빛나고 있었고, 달은 어느새 중천에 걸려 있었다. 허 생원은 동이를 힐끗 바라보다가 고개를 돌렸다. 물어보고 싶은 것이 많았으나 차마 입이 떨어지지 않았다. 내일이면 또 다른 장으로 떠나야 할 장돌뱅이의 삶이었다. 개울을 건너야 할 때 허 생원의 나귀가 발을 헛디뎌 비틀거리자, 동이가 재빠르게 다가와 고삐를 잡아 주었다. 허 생원은 고맙다는 말 대신 그저 동이의 머리를 가만히 쓰다듬어 주었다. 메밀꽃 향기가 바람에 실려 왔고, 먼 산 너머로 닭 우는 소리가 새벽이 가까워지고 있음을 알렸다.';

  const paragraphs = [
    { id: 'p1', text: p1 }, { id: 'p2', text: p2 },
    { id: 'p3', text: p3 }, { id: 'p4', text: p4 }
  ];

  const r = (pid, txt) => findRange(paragraphs, pid, txt);
  const timeline = [];
  let stepNum = 1;

  // p1
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p1', '흰 메밀꽃이 달빛에 젖어 소금을 뿌린 듯 온통 하얗게 빛나고 있었다.')],
    '이 표현에서 사용된 수사법으로 적절한 것은?',
    [
      '의인법으로 자연에 인간의 감정을 부여하였다.',
      '직유법으로 메밀꽃의 빛깔을 소금에 비유하였다.',
      '과장법으로 메밀꽃의 수량을 극단적으로 표현하였다.',
      '대조법으로 어둠과 밝음의 차이를 강조하였다.'
    ], 'B'));

  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p1', '산허리를 감은 안개 너머로 물레방아 소리가 가늘게 들려왔고, 길가의 풀벌레 소리가 고요한 밤을 채우고 있었다.')],
    '이 문장에서 주로 활용된 감각적 이미지의 종류로 적절한 것은?',
    [
      '시각적 이미지와 미각적 이미지가 결합되어 있다.',
      '청각적 이미지를 통해 달밤의 고요한 분위기를 조성한다.',
      '후각적 이미지를 중심으로 꽃향기를 묘사하고 있다.',
      '촉각적 이미지를 통해 바람의 차가움을 전달한다.'
    ], 'B'));

  // p1 중심내용
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [{ paragraphId: 'p1', start: 0, end: p1.length }],
    '이 문단의 중심 내용으로 가장 적절한 것은?',
    [
      '허 생원이 달빛 아래 메밀밭 길을 걸으며 서정적 풍경을 감상하는 장면이다.',
      '허 생원이 봉평 장터에서 물건을 팔며 손님과 흥정을 벌이는 장면이다.',
      '허 생원과 조 선달이 장돌뱅이 생활의 고충을 서로 토로하는 장면이다.',
      '허 생원이 대화 마을에 도착한 뒤 하룻밤 잠잘 숙소를 구하는 장면이다.'
    ], 'A'));

  // p2
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p2', '허 생원은 한참을 걸으며 말없이 듣기만 하다가, 문득 젊은 시절 봉평 장에서 겪었던 일을 떠올렸다.')],
    '이 문장에서 서사 전개에 나타나는 기법으로 적절한 것은?',
    [
      '현재에서 과거로의 회상을 통해 시간이 전환된다.',
      '인물의 독백으로 내면의 심리를 직접적으로 드러낸다.',
      '서술 시점이 일인칭에서 삼인칭으로 바뀌고 있다.',
      '미래의 사건을 암시하는 복선을 제시하고 있다.'
    ], 'A'));

  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p2', '개울물 소리만이 둘 사이의 침묵을 메우고 있었다.')],
    '이 문장의 서술상 효과로 적절한 것은?',
    [
      '극적 반전을 위한 긴장감을 조성하는 역할을 한다.',
      '자연의 소리로 고요하고 설레는 분위기를 전달한다.',
      '사건의 결말을 미리 암시하는 복선의 역할을 한다.',
      '인물 간 갈등이 최고조에 달했음을 보여 주고 있다.'
    ], 'B'));

  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p2', '처녀는 어디론가 떠나 버렸는지 두 번 다시 만날 수 없었다.')],
    '이 문장에서 드러나는 허 생원의 정서로 적절한 것은?',
    [
      '처녀를 다시 만나지 못한 아쉬움과 그리움이다.',
      '처녀가 떠난 것에 대한 분노와 원망의 감정이다.',
      '새로운 사람을 만날 수 있다는 기대감과 설렘이다.',
      '장돌뱅이 생활에서 벗어나고 싶은 강한 욕구이다.'
    ], 'A'));

  // p2 중심내용
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [{ paragraphId: 'p2', start: 0, end: p2.length }],
    '이 문단의 중심 내용으로 가장 적절한 것은?',
    [
      '젊은 시절 봉평 장에서 처녀를 만난 추억을 회상하는 장면이다.',
      '조 선달이 자신의 과거 사랑 이야기를 들려주는 장면이다.',
      '허 생원과 처녀가 결혼을 약속한 뒤 이별하는 장면이다.',
      '허 생원이 봉평 장터에서 장사에 성공을 거두는 장면이다.'
    ], 'A'));

  // p3
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p3', '몇십 년이 지난 지금도 그 달밤은 가슴속에 선명하게 남아 있었다.')],
    '이 문장이 허 생원의 심리에 대해 드러내는 바로 적절한 것은?',
    [
      '시간이 흘러도 지워지지 않는 깊은 그리움이 남아 있다.',
      '과거를 완전히 잊고 현재의 삶에 충분히 만족하고 있다.',
      '젊은 시절에 대한 후회와 자책감에 시달리고 있다.',
      '달밤이면 늘 불안과 두려움을 느끼는 상태에 있다.'
    ], 'A'));

  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p3', '동이의 왼손잡이 버릇이나 말투가 어쩐지 낯설지 않았고, 충주 집이라는 동이의 어머니가 혹시 그때 그 처녀가 아닐까 하는 생각이 떠올랐다가 사라지기를 반복하였다.')],
    '허 생원이 동이에게서 느끼는 감정의 근거로 적절한 것은?',
    [
      '동이의 외모가 허 생원 자신의 젊은 시절 모습과 닮아 있기 때문이다.',
      '동이의 버릇과 어머니 정보가 과거의 그 처녀를 연상시키기 때문이다.',
      '동이가 허 생원에게 자신의 어머니에 관한 이야기를 전했기 때문이다.',
      '조 선달이 동이와 허 생원이 관계가 있다는 사실을 알렸기 때문이다.'
    ], 'B'));

  // p3 중심내용
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [{ paragraphId: 'p3', start: 0, end: p3.length }],
    '이 문단의 중심 내용으로 가장 적절한 것은?',
    [
      '허 생원이 동이에게서 과거 처녀의 흔적을 느끼며 혈연을 의심하는 장면이다.',
      '동이가 허 생원에게 자신의 어머니에 대해 이야기를 꺼내는 장면이다.',
      '조 선달이 허 생원과 동이의 관계를 추리하여 전달하는 장면이다.',
      '허 생원이 동이에게 장돌뱅이 장사 기술을 가르쳐 주는 장면이다.'
    ], 'A'));

  // p4
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p4', '물어보고 싶은 것이 많았으나 차마 입이 떨어지지 않았다.')],
    '허 생원이 동이에게 말을 꺼내지 못하는 이유로 적절한 것은?',
    [
      '동이에 대한 기대와 두려움이 뒤섞여 쉽게 확인할 수 없기 때문이다.',
      '허 생원이 원래 말수가 적고 내성적인 성격을 지녔기 때문이다.',
      '조 선달이 옆에 있어서 자신의 비밀을 말할 수 없기 때문이다.',
      '동이와 별다른 친분이 없어서 대화할 계기가 없기 때문이다.'
    ], 'A'));

  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [r('p4', '허 생원은 고맙다는 말 대신 그저 동이의 머리를 가만히 쓰다듬어 주었다.')],
    '이 행동이 드러내는 허 생원의 심리로 적절한 것은?',
    [
      '말로 표현하기 어려운 애틋하고 깊은 감정이 담겨 있다.',
      '동이가 실수를 저질렀기에 꾸짖고 싶은 마음이 있다.',
      '장사를 함께할 동업자로서 인정해 주는 의미가 있다.',
      '빨리 길을 떠나고 싶은 조급한 마음이 담겨 있다.'
    ], 'A'));

  // p4 중심내용
  timeline.push(makeIntensiveStep(`s${stepNum++}`,
    [{ paragraphId: 'p4', start: 0, end: p4.length }],
    '이 문단의 중심 내용으로 가장 적절한 것은?',
    [
      '허 생원이 동이에게 말 못 할 감정을 품은 채 여정을 마무리하는 장면이다.',
      '허 생원과 동이가 대화 마을에 도착한 뒤 함께 장사를 시작하는 장면이다.',
      '허 생원이 과거의 처녀를 다시 만나 오래된 인연을 확인하는 장면이다.',
      '동이가 허 생원에게 자신의 아버지에 대해 직접 물어보는 장면이다.'
    ], 'A'));

  const recallCards = [
    '달밤에 허 생원은 충주 쪽으로 길을 걸으며, 달빛에 소금을 뿌린 듯 빛나는 메밀밭을 바라보았다.',
    '함께 걷던 조 선달의 이야기를 듣다가, 허 생원은 젊은 시절 봉평 장에서 한 처녀를 만났던 일을 떠올렸다.',
    '달빛이 밝던 밤 물레방아간 근처에서 처녀와 마주쳤으나, 이후 처녀는 떠나 두 번 다시 만나지 못하였다.',
    '몇십 년이 지났지만 그 달밤의 기억은 허 생원의 가슴속에 여전히 선명하게 남아 있었다.',
    '앞서 가던 동이의 왼손잡이 버릇과 말투에서 허 생원은 과거 처녀의 흔적을 느꼈다.',
    '충주 집이라는 동이의 어머니가 그때 그 처녀가 아닐까 하는 생각이 떠올랐다가 사라지기를 반복하였다.',
    '동이에게 물어보고 싶었으나 차마 입이 떨어지지 않은 채, 허 생원은 동이의 머리를 쓰다듬어 주었다.',
    '메밀꽃 향기가 바람에 실려 오는 가운데, 먼 산 너머로 닭 우는 소리가 새벽이 가까워짐을 알렸다.'
  ];

  const confirmQs = [
    makeConfirmQ('q1', '허 생원이 걷는 길의 양옆에 펼쳐진 것은 무엇인가?', paragraphs, '메밀밭'),
    makeConfirmQ('q2', '허 생원이 젊은 시절 처녀를 만난 장소 근처에 있었던 것은 무엇인가?', paragraphs, '물레방아'),
    makeConfirmQ('q3', '허 생원과 함께 길을 걸으며 이야기를 꺼낸 인물은 누구인가?', paragraphs, '조 선달'),
    makeConfirmQ('q4', '허 생원이 동이에게서 낯설지 않게 느낀 것 가운데 하나는 무엇인가?', paragraphs, '왼손잡이'),
    makeConfirmQ('q5', '동이의 나귀가 비틀거릴 때 동이가 잡아 준 것은 무엇인가?', paragraphs, '고삐'),
    makeConfirmQ('q6', '작품 말미에 바람에 실려 온 것은 무엇인가?', paragraphs, '메밀꽃 향기'),
  ];

  const content = buildContent(30, 'LITERATURE', [p1, p2, p3, p4], timeline, recallCards, confirmQs);
  return { content, batchItem: buildBatchItem(content, 30, 'LITERATURE') };
}

// ────────────────────────────────────────────────────
// 메인 실행
// ────────────────────────────────────────────────────

function main() {
  const ROOT = path.resolve(__dirname, '..');
  const BATCH_PATH = path.join(ROOT, 'generated', 'daily-batch-reading-russell3.json');
  const STATIC_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'russell3');

  // 배치 파일 로드
  const batch = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));

  const builders = [buildDay29, buildDay30];
  const results = builders.map(fn => fn());

  // 검증
  let errors = 0;
  for (const { content } of results) {
    const paras = content.payload.passage.paragraphs;
    const totalLen = paras.reduce((sum, p) => sum + p.text.length, 0);
    const recallCount = content.payload.recall.cards.length;
    const confirmCount = content.payload.confirm.questions.length;
    const timelineCount = content.payload.intensive.timeline.length;

    console.log(`[검증] ${content.contentId} (${content.title})`);
    console.log(`  지문 길이: ${totalLen}자 (목표: 1250~1350)`);
    console.log(`  문단 수: ${paras.length}`);
    console.log(`  정독 스텝: ${timelineCount}`);
    console.log(`  복기 카드: ${recallCount}장 (목표: 8)`);
    console.log(`  확인 문항: ${confirmCount}문항 (목표: 5~8)`);
    console.log(`  timeLimitSec: ${content.timeLimitSec}`);
    console.log(`  schoolGradeRange: ${JSON.stringify(content.schoolGradeRange)}`);

    if (totalLen < 1250 || totalLen > 1350) {
      console.error(`  !! 지문 길이 범위 초과: ${totalLen}`);
      errors++;
    }
    if (recallCount !== 8) {
      console.error(`  !! 복기 카드 수 불일치: ${recallCount}`);
      errors++;
    }
    if (confirmCount < 5 || confirmCount > 8) {
      console.error(`  !! 확인 문항 수 범위 초과: ${confirmCount}`);
      errors++;
    }

    // 정독 timeline 범위 검증
    for (const step of content.payload.intensive.timeline) {
      for (const range of step.highlight.ranges) {
        const para = paras.find(p => p.id === range.paragraphId);
        if (!para) {
          console.error(`  !! ${step.stepId}: 문단 ${range.paragraphId} 없음`);
          errors++;
        } else if (range.start < 0 || range.end > para.text.length || range.start >= range.end) {
          console.error(`  !! ${step.stepId}: 범위 오류 ${range.start}~${range.end} (문단길이: ${para.text.length})`);
          errors++;
        }
      }
    }

    // 확인 문항 범위 검증
    for (const q of content.payload.confirm.questions) {
      for (const range of q.answerRanges) {
        const para = paras.find(p => p.id === range.paragraphId);
        if (!para) {
          console.error(`  !! ${q.id}: 문단 ${range.paragraphId} 없음`);
          errors++;
        } else if (range.start < 0 || range.end > para.text.length || range.start >= range.end) {
          console.error(`  !! ${q.id}: 범위 오류 ${range.start}~${range.end} (문단길이: ${para.text.length})`);
          errors++;
        }
      }
    }

    // 선택지 길이 편차 검증 (15% 이내)
    for (const step of content.payload.intensive.timeline) {
      const lens = step.question.choices.map(c => c.text.length);
      const maxLen = Math.max(...lens);
      const minLen = Math.min(...lens);
      if (maxLen > 0 && (maxLen - minLen) / maxLen > 0.15) {
        // 경고만 출력, 에러로 처리하지 않음
        console.warn(`  주의: ${step.stepId} 선택지 길이 편차 ${((maxLen - minLen) / maxLen * 100).toFixed(1)}% (최소${minLen}, 최대${maxLen})`);
      }
    }

    console.log('');
  }

  if (errors > 0) {
    console.error(`\n!! 검증 실패: ${errors}개 오류 발견. 파일을 저장하지 않습니다.`);
    process.exit(1);
  }

  // 배치 파일 업데이트 (items[28]~items[29])
  for (let i = 0; i < results.length; i++) {
    batch.items[28 + i] = results[i].batchItem;
  }

  // 파일 저장
  fs.writeFileSync(BATCH_PATH, JSON.stringify(batch, null, 2), 'utf8');
  console.log(`배치 파일 저장: ${BATCH_PATH}`);

  for (const { content } of results) {
    const dayStr = content.contentId.replace('dr-r3-', '');
    const staticPath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`static 파일 저장: ${staticPath}`);
  }

  console.log('\nDay 29~30 콘텐츠 빌드 완료!');
}

main();
