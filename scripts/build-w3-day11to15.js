const fs = require('fs');
const path = require('path');

// ── 유틸리티 ──
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
  if (start === -1) throw new Error(`"${searchText.substring(0, 30)}..." not found in ${pid}`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charCount(paragraphs) {
  return paragraphs.reduce((s, p) => s + p.text.length, 0);
}

function makeShell(dayIndex, subArea, contentId) {
  const isLit = subArea === 'LITERATURE';
  return {
    contentId,
    contentType: 'DAILY_READING',
    version: 1,
    status: 'PUBLISHED',
    title: `일일 독해(비트겐슈타인 3) Day ${dayIndex} ${isLit ? '문학' : '비문학'}`,
    description: '일일 독해 - 정독·복기·확인',
    targetLevel: 'WITTGENSTEIN_3',
    schoolGradeRange: { min: 11, max: 12 },
    area: 'READING',
    subArea,
    competencies: ['READING'],
    tags: ['daily'],
    access: { mode: 'FREE' },
    seedReward: { seedType: 'WHEAT', count: 3, multiplier: 1 },
    timeLimitSec: 480,
    assets: {},
    payload: {}
  };
}

function makeBatchItem(dayIndex, subArea, content) {
  return {
    content_type: 'DAILY_READING',
    level_id: 'WITTGENSTEIN_3',
    area: 'READING',
    sub_area: subArea,
    day_index: dayIndex,
    module_key: 'reading_training',
    schema_version: '1.0',
    content
  };
}

// ── Day 11 (NONFICTION) ── 화폐의 역사와 현대 금융 시스템
function buildDay11() {
  const paragraphs = [
    {
      id: 'p1',
      text: '화폐는 인류 문명의 발전과 함께 물물교환의 비효율성을 극복하기 위해 등장한 교환 매개물이다. 초기 사회에서는 조개껍데기, 곡물, 가축 등 특정 재화가 교환의 매개로 사용되었으나, 이러한 물품 화폐는 보관과 운반의 어려움, 가치 측정의 불일치 등 다양한 한계를 지니고 있었다. 이후 금속 주조 기술의 발달과 함께 금, 은 등 귀금속을 소재로 한 금속 화폐가 널리 보급되었으며, 이는 내구성과 균질성, 분할 가능성이라는 화폐의 이상적 조건을 충족시켰다. 특히 고대 리디아 왕국에서 최초로 주조된 금화는 국가가 화폐의 가치를 보증하는 체계의 시작을 알렸으며, 이후 로마 제국과 중국 한나라 등 고대 문명들은 통일된 화폐 제도를 통해 광범위한 경제 활동을 가능하게 하였다. 금속 화폐의 보급은 상업의 확대와 도시 경제의 발전을 촉진하는 핵심 동인으로 작용하였다.'
    },
    {
      id: 'p2',
      text: '중세 유럽에서 금세공업자들이 금을 보관하고 그 대가로 보관 증서를 발행한 것이 지폐의 기원으로 알려져 있다. 보관 증서는 실물 금과 동일한 가치를 지닌 것으로 인정받아 유통되기 시작하였으며, 이 과정에서 금세공업자들은 예치된 금의 전부가 동시에 인출되지 않는다는 사실을 발견하고 실제 보유 금보다 많은 증서를 발행하게 되었다. 이것이 부분 지급 준비 제도의 원형이며, 근대 은행 시스템의 토대가 되었다. 국가 차원의 지폐 발행은 중국 송나라의 교자에서 처음 시도되었으며, 유럽에서는 17세기 스웨덴 국립은행이 최초로 정부 보증 지폐를 발행하였다. 지폐는 귀금속에 비해 휴대가 간편하고 대량 거래를 용이하게 한다는 장점이 있으나, 발행 주체에 대한 신뢰가 훼손되면 가치가 급격히 하락하는 본질적 취약성을 내포하고 있다.'
    },
    {
      id: 'p3',
      text: '20세기에 들어서면서 화폐 제도는 금본위제에서 관리 통화 제도로 전환되는 근본적인 변화를 겪었다. 금본위제하에서 화폐의 가치는 일정량의 금에 의해 뒷받침되었으나, 두 차례의 세계 대전과 대공황을 거치면서 금 보유량만으로는 경제 위기에 대응하기 어렵다는 한계가 드러났다. 1944년 브레턴우즈 체제는 미국 달러를 기축 통화로 설정하고 달러와 금의 교환을 보장함으로써 과도기적 질서를 형성하였으나, 1971년 닉슨 대통령의 금태환 정지 선언으로 이 체제마저 붕괴하였다. 이후 각국 정부와 중앙은행은 통화량 조절과 금리 정책을 통해 화폐 가치를 관리하는 방식을 채택하였다. 관리 통화 제도에서 화폐의 가치는 실물 자산이 아닌 국가의 경제력과 정책 신뢰도에 의해 결정되므로, 중앙은행의 독립성과 정책 투명성이 화폐 가치 안정의 핵심 요소로 자리 잡았다.'
    },
    {
      id: 'p4',
      text: '디지털 기술의 발전은 화폐의 형태를 다시 한번 혁신적으로 변화시키고 있다. 신용카드와 전자 결제의 확산으로 물리적 화폐의 사용 비중이 감소하고 있으며, 중앙은행 디지털 화폐의 도입 논의가 전 세계적으로 활발해지고 있다. 블록체인 기술에 기반한 암호 화폐는 중앙 기관의 개입 없이 탈중앙화된 방식으로 거래를 검증하고 기록할 수 있다는 점에서 기존 금융 체계에 근본적인 도전을 제기하고 있다. 그러나 암호 화폐는 가격 변동성이 극심하고 화폐로서의 가치 저장 기능이 불안정하여 법정 화폐를 대체하기에는 여전히 한계가 존재한다. 향후 화폐 제도는 디지털 전환의 가속화 속에서 효율성과 안정성, 개인 정보 보호와 투명성이라는 상충하는 가치들 사이에서 새로운 균형점을 찾아야 하는 과제를 안고 있다.'
    }
  ];

  const total = charCount(paragraphs);
  console.log(`Day 11 글자수: ${total}`);

  const content = makeShell(11, 'NONFICTION', 'dr-w3-011');
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);

    // 문장 성분 문제
    if (pi === 0) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '교환 매개물이다')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '목적어' },
            { id: 'B', text: '서술어' },
            { id: 'C', text: '부사어' },
            { id: 'D', text: '주어' }
          ],
          answerId: 'B',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 1) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '보관 증서는')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '서술어' },
            { id: 'B', text: '부사어' },
            { id: 'C', text: '주어' },
            { id: 'D', text: '목적어' }
          ],
          answerId: 'C',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 2) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '통화량 조절과 금리 정책을')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '부사어' },
            { id: 'B', text: '주어' },
            { id: 'C', text: '목적어' },
            { id: 'D', text: '서술어' }
          ],
          answerId: 'A',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 3) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '물리적 화폐의 사용 비중이')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '서술어' },
            { id: 'B', text: '목적어' },
            { id: 'C', text: '주어' },
            { id: 'D', text: '부사어' }
          ],
          answerId: 'C',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }

    // 문장별 하이라이트 + 내용 파악
    sents.forEach((sent, si) => {
      stepNum++;
      const r = { paragraphId: para.id, start: sent.start, end: sent.end };
      const wrongSents = [];
      paragraphs.forEach((op, opi) => {
        if (opi !== pi) {
          const oSents = findSentences(op.text);
          if (oSents.length > 0) wrongSents.push(oSents[Math.min(si, oSents.length - 1)].text);
        }
      });
      const choices = [
        { id: 'A', text: sent.text.length > 80 ? sent.text.substring(0, 80) : sent.text },
        { id: 'B', text: wrongSents[0] ? (wrongSents[0].length > 80 ? wrongSents[0].substring(0, 80) : wrongSents[0]) : '해당 내용이 본문에 나타나지 않는다.' },
        { id: 'C', text: wrongSents[1] ? (wrongSents[1].length > 80 ? wrongSents[1].substring(0, 80) : wrongSents[1]) : '지문의 주제와 무관한 서술이다.' },
        { id: 'D', text: wrongSents[2] ? (wrongSents[2].length > 80 ? wrongSents[2].substring(0, 80) : wrongSents[2]) : '필자의 의견이 명시적으로 드러나지 않는다.' }
      ];
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [r] },
        question: {
          prompt: '하이라이트된 문장의 내용으로 알맞은 것은?',
          choices,
          answerId: 'A',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    // 문단 중심내용
    stepNum++;
    const firstSent = sents[0].text;
    const wrongParaTexts = [];
    paragraphs.forEach((op, opi) => {
      if (opi !== pi) {
        const oSents = findSentences(op.text);
        wrongParaTexts.push(oSents[0].text.length > 80 ? oSents[0].text.substring(0, 80) : oSents[0].text);
      }
    });
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] },
      question: {
        prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
        choices: [
          { id: 'A', text: firstSent.length > 80 ? firstSent.substring(0, 80) : firstSent },
          { id: 'B', text: wrongParaTexts[0] || '해당 내용이 본문에 나타나지 않는다.' },
          { id: 'C', text: wrongParaTexts[1] || '지문의 주제와 무관한 서술이다.' },
          { id: 'D', text: wrongParaTexts[2] || '필자의 의견이 명시적으로 드러나지 않는다.' }
        ],
        answerId: 'A',
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  });

  // 복기 - 8장
  const recall = {
    cards: [
      { id: 'c1', text: '화폐는 물물교환의 비효율성을 극복하기 위해 등장하였으며, 초기에는 조개껍데기와 곡물 등의 물품 화폐가 사용되었으나 보관과 가치 측정의 한계가 있었다.' },
      { id: 'c2', text: '귀금속 기반 금속 화폐는 내구성과 균질성, 분할 가능성을 갖추었으며, 리디아 왕국의 금화를 시작으로 국가가 화폐 가치를 보증하는 체계가 형성되었다.' },
      { id: 'c3', text: '중세 금세공업자들의 보관 증서가 지폐의 기원이 되었으며, 예치금보다 많은 증서를 발행한 관행이 부분 지급 준비 제도와 근대 은행 시스템의 토대가 되었다.' },
      { id: 'c4', text: '지폐는 휴대가 간편하고 대량 거래를 용이하게 하지만, 발행 주체에 대한 신뢰가 훼손되면 가치가 급격히 하락하는 취약성이 있다.' },
      { id: 'c5', text: '금본위제는 두 차례의 세계 대전과 대공황을 거치며 한계를 드러냈고, 1971년 금태환 정지 이후 관리 통화 제도로 전환되었다.' },
      { id: 'c6', text: '관리 통화 제도에서 화폐 가치는 국가의 경제력과 정책 신뢰도에 의해 결정되므로, 중앙은행의 독립성과 정책 투명성이 핵심 요소이다.' },
      { id: 'c7', text: '블록체인 기반 암호 화폐는 탈중앙화된 거래 검증이 가능하나, 가격 변동성이 극심하고 가치 저장 기능이 불안정하여 법정 화폐 대체에 한계가 있다.' },
      { id: 'c8', text: '향후 화폐 제도는 디지털 전환 속에서 효율성과 안정성, 개인 정보 보호와 투명성 사이의 새로운 균형점을 찾아야 하는 과제를 안고 있다.' }
    ],
    correctOrder: ['c1','c2','c3','c4','c5','c6','c7','c8'],
    seedPenalty: 1
  };

  // 확인 - 6문항
  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '금속 화폐가 이상적 조건을 갖춘 것으로 평가되는 구체적 속성은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p1', '내구성과 균질성, 분할 가능성이라는 화폐의 이상적 조건을 충족시켰다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '부분 지급 준비 제도의 원형이 형성된 배경은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p2', '예치된 금의 전부가 동시에 인출되지 않는다는 사실을 발견하고 실제 보유 금보다 많은 증서를 발행하게 되었다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '지폐가 지닌 본질적 취약성은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p2', '발행 주체에 대한 신뢰가 훼손되면 가치가 급격히 하락하는 본질적 취약성을 내포하고 있다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '브레턴우즈 체제가 붕괴된 계기는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '1971년 닉슨 대통령의 금태환 정지 선언으로 이 체제마저 붕괴하였다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '암호 화폐가 기존 금융 체계에 도전이 되는 근거는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '중앙 기관의 개입 없이 탈중앙화된 방식으로 거래를 검증하고 기록할 수 있다는 점에서')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '관리 통화 제도에서 화폐 가치 안정의 핵심 요소로 제시된 것은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '중앙은행의 독립성과 정책 투명성이 화폐 가치 안정의 핵심 요소로 자리 잡았다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      }
    ]
  };

  content.payload = {
    passage: { format: 'TEXT', paragraphs },
    intensive: { timeline },
    recall,
    confirm
  };
  return content;
}

// ── Day 12 (LITERATURE) ── 이상 소설의 실험적 서사와 근대적 자아
function buildDay12() {
  const paragraphs = [
    {
      id: 'p1',
      text: '이상의 소설 「날개」는 1936년 발표된 한국 모더니즘 문학의 대표작으로, 전통적 소설 문법을 해체하고 의식의 흐름 기법을 통해 식민지 근대 도시인의 내면을 탐구한 작품이다. 일인칭 서술자인 나는 아내가 운영하는 방에 갇혀 무기력하게 살아가는 인물로, 경제적 능력을 상실한 근대 지식인의 좌절을 형상화한다. 작품의 도입부에 등장하는 박제가 되어 버린 천재라는 표현은 자기 비하이자 동시에 시대에 대한 항의를 함축하는 중의적 진술이다. 이상은 의도적으로 인과 관계가 모호한 서사를 배치하여 독자가 의미를 능동적으로 구성하도록 유도하며, 이러한 서사 전략은 기존의 사실주의 소설과 근본적으로 차별화되는 지점이다. 날개의 서사는 선형적 시간 순서를 따르지 않고 의식의 단편들이 비연속적으로 나열되는 방식으로 전개된다.'
    },
    {
      id: 'p2',
      text: '작품에서 아내와 나의 관계는 경제적 종속과 정서적 소외가 중첩된 복합적 구조를 이룬다. 아내는 나에게 수면제를 먹여 재우고 그 사이에 손님을 받는데, 이는 식민지 자본주의 체제 아래에서 인간관계마저 상품화되는 현실을 우회적으로 형상화한 것이다. 나는 아내에게 경제적으로 의존하면서도 그 관계의 본질을 의식적으로 회피하는데, 이러한 자기기만적 태도는 식민지 지식인의 현실 인식 방식을 상징적으로 보여 준다. 아내의 방과 나의 방이 분리된 공간 구조는 두 인물 사이의 단절과 소통 불능을 물리적으로 가시화하며, 밀폐된 실내 공간은 식민지 근대의 억압적 구조에 대한 은유로 기능한다. 이러한 공간적 설정은 이상 소설의 주요 특징인 공간의 서사화를 잘 보여 주는 사례이다.'
    },
    {
      id: 'p3',
      text: '「날개」의 결말에서 나는 미쓰코시 백화점 옥상으로 올라가 날개야 다시 돋아라고 외치는데, 이 장면은 한국 근대 소설사에서 가장 많이 논의된 결말 가운데 하나이다. 이 외침은 무기력한 자아가 현실의 속박에서 벗어나 비상하고자 하는 욕망의 표출로 해석되지만, 동시에 그 비상이 실현 불가능한 것임을 암시하는 비극적 아이러니도 내포하고 있다. 미쓰코시 백화점이라는 장소는 식민지 근대의 소비 문화와 자본주의적 욕망이 집약된 공간으로, 그 옥상에서의 외침은 근대성 자체에 대한 양가적 태도를 드러낸다. 날개라는 상징은 자유와 해방의 가능성을 지시하면서도, 이미 상실된 것을 되찾으려는 절망적 시도라는 점에서 근대적 주체의 분열을 응축적으로 표현한다. 결말의 개방성은 단일한 해석을 거부하며, 이는 이상 문학의 핵심적 미학 원리로 평가된다.'
    },
    {
      id: 'p4',
      text: '이상의 문학적 실험은 「날개」에 국한되지 않고 「오감도」 연작시, 수필 「권태」 등 다양한 장르에 걸쳐 전개되었다. 「오감도」는 발표 당시 독자들의 항의로 연재가 중단될 만큼 파격적이었으며, 전통적 시 문법을 완전히 해체한 실험적 형식이 특징적이다. 이상은 수학적 기호와 도형, 일본어와 한국어의 혼용 등 다양한 비문학적 요소를 텍스트에 도입함으로써, 언어 자체의 의미 전달 기능에 대한 근본적 질문을 제기하였다. 이러한 실험 정신은 당대 유럽의 초현실주의와 다다이즘 등 전위 예술 운동과 맥을 같이하면서도, 식민지라는 특수한 역사적 맥락 속에서 고유한 의미를 획득하였다. 이상 문학은 발표 당시의 혹평에도 불구하고 후대 작가들에게 지속적인 영향을 미쳤으며, 한국 문학사에서 모더니즘의 정점으로 자리매김하고 있다.'
    }
  ];

  const total = charCount(paragraphs);
  console.log(`Day 12 글자수: ${total}`);

  const content = makeShell(12, 'LITERATURE', 'dr-w3-012');
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);

    if (pi === 0) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '한국 모더니즘 문학의 대표작으로')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '주어' },
            { id: 'B', text: '부사어' },
            { id: 'C', text: '목적어' },
            { id: 'D', text: '서술어' }
          ],
          answerId: 'B',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 1) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '복합적 구조를')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '서술어' },
            { id: 'B', text: '주어' },
            { id: 'C', text: '목적어' },
            { id: 'D', text: '부사어' }
          ],
          answerId: 'C',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 2) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '이 외침은')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '부사어' },
            { id: 'B', text: '서술어' },
            { id: 'C', text: '목적어' },
            { id: 'D', text: '주어' }
          ],
          answerId: 'D',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 3) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '실험 정신은')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '목적어' },
            { id: 'B', text: '주어' },
            { id: 'C', text: '부사어' },
            { id: 'D', text: '서술어' }
          ],
          answerId: 'B',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }

    sents.forEach((sent, si) => {
      stepNum++;
      const r = { paragraphId: para.id, start: sent.start, end: sent.end };
      const wrongSents = [];
      paragraphs.forEach((op, opi) => {
        if (opi !== pi) {
          const oSents = findSentences(op.text);
          if (oSents.length > 0) wrongSents.push(oSents[Math.min(si, oSents.length - 1)].text);
        }
      });
      const choices = [
        { id: 'A', text: sent.text.length > 80 ? sent.text.substring(0, 80) : sent.text },
        { id: 'B', text: wrongSents[0] ? (wrongSents[0].length > 80 ? wrongSents[0].substring(0, 80) : wrongSents[0]) : '해당 내용이 본문에 나타나지 않는다.' },
        { id: 'C', text: wrongSents[1] ? (wrongSents[1].length > 80 ? wrongSents[1].substring(0, 80) : wrongSents[1]) : '지문의 주제와 무관한 서술이다.' },
        { id: 'D', text: wrongSents[2] ? (wrongSents[2].length > 80 ? wrongSents[2].substring(0, 80) : wrongSents[2]) : '필자의 의견이 명시적으로 드러나지 않는다.' }
      ];
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [r] },
        question: {
          prompt: '하이라이트된 문장의 내용으로 알맞은 것은?',
          choices,
          answerId: 'A',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    stepNum++;
    const firstSent = sents[0].text;
    const wrongParaTexts = [];
    paragraphs.forEach((op, opi) => {
      if (opi !== pi) {
        const oSents = findSentences(op.text);
        wrongParaTexts.push(oSents[0].text.length > 80 ? oSents[0].text.substring(0, 80) : oSents[0].text);
      }
    });
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] },
      question: {
        prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
        choices: [
          { id: 'A', text: firstSent.length > 80 ? firstSent.substring(0, 80) : firstSent },
          { id: 'B', text: wrongParaTexts[0] || '해당 내용이 본문에 나타나지 않는다.' },
          { id: 'C', text: wrongParaTexts[1] || '지문의 주제와 무관한 서술이다.' },
          { id: 'D', text: wrongParaTexts[2] || '필자의 의견이 명시적으로 드러나지 않는다.' }
        ],
        answerId: 'A',
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  });

  const recall = {
    cards: [
      { id: 'c1', text: '이상의 「날개」는 의식의 흐름 기법으로 식민지 근대 도시인의 내면을 탐구하며, 박제가 되어 버린 천재라는 표현은 자기 비하와 시대 항의를 함축한다.' },
      { id: 'c2', text: '서술자 나는 경제적 능력을 상실한 지식인으로, 인과 관계가 모호한 비선형적 서사를 통해 기존 사실주의와 차별화된 서사 전략이 구현된다.' },
      { id: 'c3', text: '아내는 나에게 수면제를 먹이고 손님을 받는데, 이는 식민지 자본주의 아래 인간관계의 상품화를 우회적으로 형상화한 것이다.' },
      { id: 'c4', text: '분리된 방이라는 공간 구조는 인물 간 단절과 소통 불능을 가시화하며, 밀폐된 실내는 식민지 근대의 억압적 구조에 대한 은유이다.' },
      { id: 'c5', text: '결말에서 나는 미쓰코시 백화점 옥상에서 날개야 다시 돋아라고 외치며, 이는 비상의 욕망과 실현 불가능성이 겹치는 비극적 아이러니이다.' },
      { id: 'c6', text: '날개라는 상징은 자유와 해방의 가능성을 지시하면서 이미 상실된 것을 되찾으려는 절망적 시도라는 점에서 근대적 주체의 분열을 응축한다.' },
      { id: 'c7', text: '「오감도」는 전통적 시 문법을 완전히 해체하였고, 수학적 기호와 도형 등을 도입하여 언어의 의미 전달 기능에 대한 근본적 질문을 제기하였다.' },
      { id: 'c8', text: '이상 문학은 유럽 전위 예술과 맥을 같이하되 식민지 맥락에서 고유한 의미를 획득하였으며, 한국 문학사에서 모더니즘의 정점으로 자리매김하고 있다.' }
    ],
    correctOrder: ['c1','c2','c3','c4','c5','c6','c7','c8'],
    seedPenalty: 1
  };

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '「날개」의 서사가 기존 사실주의 소설과 구별되는 방식은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p1', '의식의 단편들이 비연속적으로 나열되는 방식으로 전개된다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '아내의 행위가 상징하는 식민지 현실의 양상은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p2', '식민지 자본주의 체제 아래에서 인간관계마저 상품화되는 현실을 우회적으로 형상화한 것이다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '밀폐된 실내 공간이 지닌 서사적 기능은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p2', '밀폐된 실내 공간은 식민지 근대의 억압적 구조에 대한 은유로 기능한다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '미쓰코시 백화점이라는 장소가 드러내는 인물의 태도는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '근대성 자체에 대한 양가적 태도를 드러낸다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '「오감도」가 전통 시 문법과 다른 점을 드러내는 구체적 요소는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '수학적 기호와 도형, 일본어와 한국어의 혼용 등 다양한 비문학적 요소를 텍스트에 도입함으로써')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '이상 문학의 실험이 유럽 전위 예술과 구별되는 맥락은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '식민지라는 특수한 역사적 맥락 속에서 고유한 의미를 획득하였다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      }
    ]
  };

  content.payload = {
    passage: { format: 'TEXT', paragraphs },
    intensive: { timeline },
    recall,
    confirm
  };
  return content;
}

// ── Day 13 (NONFICTION) ── 면역 체계의 구조와 작동 원리
function buildDay13() {
  const paragraphs = [
    {
      id: 'p1',
      text: '면역 체계는 외부에서 침입하는 병원체로부터 인체를 방어하는 복잡한 생물학적 체계로, 선천 면역과 적응 면역이라는 두 가지 주요 기제로 구성된다. 선천 면역은 태어날 때부터 갖추고 있는 비특이적 방어 체계로서, 피부와 점막 같은 물리적 장벽, 체온 상승과 염증 반응 같은 생리적 반응, 대식세포와 자연살해세포 같은 세포 매개 반응을 포함한다. 선천 면역의 핵심 특징은 병원체의 종류와 무관하게 즉각적이고 광범위한 방어를 수행한다는 점이며, 이를 통해 대부분의 감염이 초기 단계에서 억제된다. 그러나 선천 면역만으로는 특정 병원체에 최적화된 방어가 어려우며, 반복 감염에 대해서도 동일한 수준의 반응만 나타내는 한계가 있다. 이러한 한계를 보완하기 위해 진화적으로 발달한 것이 적응 면역 체계이다.'
    },
    {
      id: 'p2',
      text: '적응 면역은 특정 항원을 인식하고 이에 맞춤화된 반응을 생성하는 고도로 정교한 방어 체계이다. 적응 면역의 두 축은 체액성 면역과 세포 매개 면역으로, 전자는 B림프구가 생산하는 항체를 통해, 후자는 T림프구가 직접 감염 세포를 제거하는 방식으로 작동한다. B림프구는 항원과 결합하는 특이적 항체를 분비하여 병원체를 중화시키거나 다른 면역 세포가 이를 제거하도록 표지하는 역할을 수행한다. T림프구는 보조 T세포와 세포독성 T세포로 구분되는데, 보조 T세포는 다른 면역 세포를 활성화하는 조절 기능을 담당하고 세포독성 T세포는 바이러스에 감염된 세포를 직접 파괴한다. 적응 면역은 선천 면역에 비해 반응 개시까지 시간이 더 소요되지만, 한번 활성화되면 매우 정밀하고 강력한 방어를 수행한다.'
    },
    {
      id: 'p3',
      text: '적응 면역의 가장 중요한 특성 가운데 하나는 면역 기억이다. 최초 감염 시 활성화된 림프구의 일부는 기억 세포로 분화하여 체내에 장기간 존속하며, 동일한 병원체가 재침입할 경우 이전보다 훨씬 빠르고 강력한 이차 면역 반응을 일으킨다. 백신의 원리는 바로 이 면역 기억 현상을 인위적으로 유도하는 것이다. 약독화 백신은 병원성이 약화된 생존 병원체를 사용하여 실제 감염과 유사한 면역 반응을 유도하고, 불활화 백신은 사멸된 병원체나 그 구성 성분을 사용하여 보다 안전하게 면역을 형성한다. 최근에는 메신저 리보핵산 기술을 활용한 새로운 유형의 백신이 개발되어, 병원체의 유전 정보를 전달함으로써 체내에서 항원 단백질을 직접 합성하도록 유도하는 방식이 상용화되었다. 이러한 기술 혁신은 전통적 백신 개발에 비해 제조 기간을 획기적으로 단축시켰다.'
    },
    {
      id: 'p4',
      text: '면역 체계의 정교한 작동은 자기와 비자기를 구별하는 능력에 기반하는데, 이 구별 기제가 오작동하면 자가 면역 질환이 발생한다. 류마티스 관절염, 전신성 홍반성 루푸스, 제1형 당뇨병 등이 대표적인 자가 면역 질환으로, 면역 세포가 자신의 정상 조직을 공격하여 만성적인 염증과 조직 손상을 유발한다. 자가 면역 질환의 정확한 원인은 아직 완전히 규명되지 않았으나, 유전적 소인과 환경적 요인의 복합 작용이 관여하는 것으로 알려져 있다. 면역 관용이라 불리는 자기 세포에 대한 면역 억제 기제가 손상되면 자가 반응성 림프구가 활성화되어 정상 조직을 표적으로 삼게 되는 것이다. 현재 자가 면역 질환의 치료는 면역 억제제를 통한 증상 관리가 주류이나, 면역 관용을 회복시키는 근본적 치료법에 대한 연구가 활발히 진행되고 있다.'
    }
  ];

  const total = charCount(paragraphs);
  console.log(`Day 13 글자수: ${total}`);

  const content = makeShell(13, 'NONFICTION', 'dr-w3-013');
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);

    if (pi === 0) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '생물학적 체계로')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '주어' },
            { id: 'B', text: '서술어' },
            { id: 'C', text: '부사어' },
            { id: 'D', text: '목적어' }
          ],
          answerId: 'C',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 1) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '방어 체계이다')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '목적어' },
            { id: 'B', text: '주어' },
            { id: 'C', text: '부사어' },
            { id: 'D', text: '서술어' }
          ],
          answerId: 'D',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 2) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '면역 기억이다')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '부사어' },
            { id: 'B', text: '서술어' },
            { id: 'C', text: '목적어' },
            { id: 'D', text: '주어' }
          ],
          answerId: 'B',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 3) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '자가 면역 질환이')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '서술어' },
            { id: 'B', text: '부사어' },
            { id: 'C', text: '주어' },
            { id: 'D', text: '목적어' }
          ],
          answerId: 'C',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }

    sents.forEach((sent, si) => {
      stepNum++;
      const r = { paragraphId: para.id, start: sent.start, end: sent.end };
      const wrongSents = [];
      paragraphs.forEach((op, opi) => {
        if (opi !== pi) {
          const oSents = findSentences(op.text);
          if (oSents.length > 0) wrongSents.push(oSents[Math.min(si, oSents.length - 1)].text);
        }
      });
      const choices = [
        { id: 'A', text: sent.text.length > 80 ? sent.text.substring(0, 80) : sent.text },
        { id: 'B', text: wrongSents[0] ? (wrongSents[0].length > 80 ? wrongSents[0].substring(0, 80) : wrongSents[0]) : '해당 내용이 본문에 나타나지 않는다.' },
        { id: 'C', text: wrongSents[1] ? (wrongSents[1].length > 80 ? wrongSents[1].substring(0, 80) : wrongSents[1]) : '지문의 주제와 무관한 서술이다.' },
        { id: 'D', text: wrongSents[2] ? (wrongSents[2].length > 80 ? wrongSents[2].substring(0, 80) : wrongSents[2]) : '필자의 의견이 명시적으로 드러나지 않는다.' }
      ];
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [r] },
        question: {
          prompt: '하이라이트된 문장의 내용으로 알맞은 것은?',
          choices,
          answerId: 'A',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    stepNum++;
    const firstSent = sents[0].text;
    const wrongParaTexts = [];
    paragraphs.forEach((op, opi) => {
      if (opi !== pi) {
        const oSents = findSentences(op.text);
        wrongParaTexts.push(oSents[0].text.length > 80 ? oSents[0].text.substring(0, 80) : oSents[0].text);
      }
    });
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] },
      question: {
        prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
        choices: [
          { id: 'A', text: firstSent.length > 80 ? firstSent.substring(0, 80) : firstSent },
          { id: 'B', text: wrongParaTexts[0] || '해당 내용이 본문에 나타나지 않는다.' },
          { id: 'C', text: wrongParaTexts[1] || '지문의 주제와 무관한 서술이다.' },
          { id: 'D', text: wrongParaTexts[2] || '필자의 의견이 명시적으로 드러나지 않는다.' }
        ],
        answerId: 'A',
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  });

  const recall = {
    cards: [
      { id: 'c1', text: '면역 체계는 선천 면역과 적응 면역으로 구성되며, 선천 면역은 비특이적이고 즉각적인 방어를 수행하지만 특정 병원체에 최적화된 대응에는 한계가 있다.' },
      { id: 'c2', text: '선천 면역은 피부와 점막 같은 물리적 장벽, 체온 상승과 염증 반응, 대식세포와 자연살해세포 등 세포 매개 반응을 포함하는 다층적 방어 체계이다.' },
      { id: 'c3', text: '적응 면역은 B림프구의 항체를 통한 체액성 면역과 T림프구가 감염 세포를 제거하는 세포 매개 면역의 두 축으로 작동한다.' },
      { id: 'c4', text: '보조 T세포는 다른 면역 세포를 활성화하는 조절 기능을 담당하고, 세포독성 T세포는 바이러스 감염 세포를 직접 파괴한다.' },
      { id: 'c5', text: '면역 기억은 기억 세포가 장기간 존속하여 동일 병원체 재침입 시 빠르고 강력한 이차 면역 반응을 일으키는 현상이며, 이것이 백신의 원리이다.' },
      { id: 'c6', text: '메신저 리보핵산 기술 백신은 병원체의 유전 정보를 전달하여 체내에서 항원 단백질을 직접 합성하도록 유도하는 새로운 방식으로 제조 기간을 획기적으로 단축하였다.' },
      { id: 'c7', text: '자가 면역 질환은 자기와 비자기를 구별하는 면역 관용 기제가 오작동하여 면역 세포가 정상 조직을 공격할 때 발생한다.' },
      { id: 'c8', text: '자가 면역 질환은 유전적 소인과 환경적 요인의 복합 작용이 관여하며, 현재는 면역 억제제 중심의 증상 관리가 주류이나 면역 관용 회복 연구가 진행 중이다.' }
    ],
    correctOrder: ['c1','c2','c3','c4','c5','c6','c7','c8'],
    seedPenalty: 1
  };

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '선천 면역이 적응 면역과 구별되는 핵심 특징은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p1', '병원체의 종류와 무관하게 즉각적이고 광범위한 방어를 수행한다는 점이며')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: 'B림프구가 수행하는 구체적 역할은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p2', '항원과 결합하는 특이적 항체를 분비하여 병원체를 중화시키거나 다른 면역 세포가 이를 제거하도록 표지하는 역할을 수행한다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '백신이 면역을 형성하는 근본 원리는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '백신의 원리는 바로 이 면역 기억 현상을 인위적으로 유도하는 것이다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '메신저 리보핵산 백신의 작동 방식은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '병원체의 유전 정보를 전달함으로써 체내에서 항원 단백질을 직접 합성하도록 유도하는 방식이 상용화되었다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '자가 면역 질환이 발생하는 면역학적 기제는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '면역 관용이라 불리는 자기 세포에 대한 면역 억제 기제가 손상되면 자가 반응성 림프구가 활성화되어 정상 조직을 표적으로 삼게 되는 것이다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '자가 면역 질환의 발병 원인으로 알려진 요인의 관계는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '유전적 소인과 환경적 요인의 복합 작용이 관여하는 것으로 알려져 있다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      }
    ]
  };

  content.payload = {
    passage: { format: 'TEXT', paragraphs },
    intensive: { timeline },
    recall,
    confirm
  };
  return content;
}

// ── Day 14 (LITERATURE) ── 박경리 「토지」의 서사 구조와 민족서사
function buildDay14() {
  const paragraphs = [
    {
      id: 'p1',
      text: '박경리의 장편 소설 「토지」는 1969년부터 1994년까지 26년에 걸쳐 완성된 한국 문학사의 기념비적 대하소설로, 구한말에서 해방에 이르는 격동의 시기를 배경으로 여러 세대에 걸친 인물들의 삶을 형상화한 작품이다. 전체 5부 16권에 달하는 방대한 분량 속에 최참판댁의 몰락과 재기, 일제 강점기의 민족 수난, 토지를 둘러싼 경제적 갈등이 복합적으로 얽혀 있다. 서희라는 중심인물은 가문의 빼앗긴 토지를 되찾기 위해 분투하는 과정에서 시대의 모순과 대결하는 여성 주체로 성장하며, 이는 전통적 가부장 서사에서 벗어난 새로운 인물 유형으로 평가된다. 작품의 공간적 배경은 경남 하동의 평사리에서 출발하여 진주, 서울, 간도, 일본 등으로 확장되면서 개인의 서사가 민족의 서사로 자연스럽게 확대되는 구조를 취하고 있다.'
    },
    {
      id: 'p2',
      text: '「토지」의 서사적 특징 가운데 하나는 중심인물과 주변 인물이 거의 동등한 서사적 비중을 부여받는다는 점이다. 서희를 중심으로 하면서도 길상, 용이, 봉순, 김환 등 다양한 계층과 배경의 인물들이 각자의 서사를 충실히 전개한다. 소작농의 고통과 저항, 개화기 지식인의 갈등, 독립운동가의 희생 등이 병렬적으로 서술됨으로써 특정 계층의 시각에 편향되지 않는 총체적 사회 묘사가 이루어진다. 이러한 다성적 서사 구조는 러시아 소설의 전통과 비교되기도 하지만, 한국의 역사적 맥락과 공동체적 세계관이 반영되어 있다는 점에서 독자적 성격을 지닌다. 특히 하층민 인물들이 단순한 배경으로 머물지 않고 역사의 주체로 형상화된다는 점은 이 작품의 민중적 지향을 잘 보여 준다.'
    },
    {
      id: 'p3',
      text: '토지라는 제목 자체가 작품 전체를 관통하는 핵심 상징이다. 토지는 경제적 생존의 기반이자 정체성의 근거이며, 동시에 권력 관계를 결정짓는 사회적 매개물로 기능한다. 최참판댁의 토지가 조준구에게 빼앗기는 서사는 개인적 원한의 서사이면서 동시에 일제에 의한 민족 자산 수탈의 알레고리로 읽힌다. 서희가 토지를 되찾는 과정은 경제적 복원을 넘어 정체성의 회복과 공동체 재건의 의미를 지닌다. 또한 토지를 경작하는 농민들의 삶은 땅과 인간의 원초적 관계를 형상화하며, 이는 근대화 과정에서 상실된 유기적 공동체에 대한 향수와 비판적 성찰을 동시에 내포하고 있다. 이러한 상징적 다층성은 「토지」를 단순한 역사 소설의 범주를 넘어 한국적 세계관을 담은 문명론적 서사로 격상시키는 요인이다.'
    },
    {
      id: 'p4',
      text: '「토지」의 문학사적 의의는 한국 대하소설의 가능성을 극대화하고 민족 서사의 새로운 전범을 제시한 데 있다. 26년이라는 집필 기간 자체가 한 작가의 문학적 헌신을 증명하는 동시에, 단일 작품 안에서 한국 근현대사의 총체적 조망이 이루어졌다는 점에서 문학적 성취가 탁월하다. 박경리는 특정 이데올로기에 치우치지 않고 인간의 보편적 삶의 양태를 형상화함으로써, 민족 서사가 편협한 민족주의로 환원되는 것을 경계하였다. 자연과 인간, 전통과 근대, 개인과 공동체라는 대립항들이 작품 안에서 대화하고 충돌하며 새로운 의미를 생성하는 변증법적 서사 구조는 이 소설의 핵심적 미학 원리이다. 「토지」는 한국 문학이 세계 문학과 대등한 수준에서 인간과 역사의 근본 문제를 탐구할 수 있음을 입증한 작품으로서 그 가치를 인정받고 있다.'
    }
  ];

  const total = charCount(paragraphs);
  console.log(`Day 14 글자수: ${total}`);

  const content = makeShell(14, 'LITERATURE', 'dr-w3-014');
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);

    if (pi === 0) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '대하소설로')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '목적어' },
            { id: 'B', text: '부사어' },
            { id: 'C', text: '주어' },
            { id: 'D', text: '서술어' }
          ],
          answerId: 'B',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 1) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '총체적 사회 묘사가')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '서술어' },
            { id: 'B', text: '주어' },
            { id: 'C', text: '목적어' },
            { id: 'D', text: '부사어' }
          ],
          answerId: 'B',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 2) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '핵심 상징이다')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '부사어' },
            { id: 'B', text: '목적어' },
            { id: 'C', text: '서술어' },
            { id: 'D', text: '주어' }
          ],
          answerId: 'C',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 3) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '문학사적 의의는')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '서술어' },
            { id: 'B', text: '부사어' },
            { id: 'C', text: '목적어' },
            { id: 'D', text: '주어' }
          ],
          answerId: 'D',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }

    sents.forEach((sent, si) => {
      stepNum++;
      const r = { paragraphId: para.id, start: sent.start, end: sent.end };
      const wrongSents = [];
      paragraphs.forEach((op, opi) => {
        if (opi !== pi) {
          const oSents = findSentences(op.text);
          if (oSents.length > 0) wrongSents.push(oSents[Math.min(si, oSents.length - 1)].text);
        }
      });
      const choices = [
        { id: 'A', text: sent.text.length > 80 ? sent.text.substring(0, 80) : sent.text },
        { id: 'B', text: wrongSents[0] ? (wrongSents[0].length > 80 ? wrongSents[0].substring(0, 80) : wrongSents[0]) : '해당 내용이 본문에 나타나지 않는다.' },
        { id: 'C', text: wrongSents[1] ? (wrongSents[1].length > 80 ? wrongSents[1].substring(0, 80) : wrongSents[1]) : '지문의 주제와 무관한 서술이다.' },
        { id: 'D', text: wrongSents[2] ? (wrongSents[2].length > 80 ? wrongSents[2].substring(0, 80) : wrongSents[2]) : '필자의 의견이 명시적으로 드러나지 않는다.' }
      ];
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [r] },
        question: {
          prompt: '하이라이트된 문장의 내용으로 알맞은 것은?',
          choices,
          answerId: 'A',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    stepNum++;
    const firstSent = sents[0].text;
    const wrongParaTexts = [];
    paragraphs.forEach((op, opi) => {
      if (opi !== pi) {
        const oSents = findSentences(op.text);
        wrongParaTexts.push(oSents[0].text.length > 80 ? oSents[0].text.substring(0, 80) : oSents[0].text);
      }
    });
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] },
      question: {
        prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
        choices: [
          { id: 'A', text: firstSent.length > 80 ? firstSent.substring(0, 80) : firstSent },
          { id: 'B', text: wrongParaTexts[0] || '해당 내용이 본문에 나타나지 않는다.' },
          { id: 'C', text: wrongParaTexts[1] || '지문의 주제와 무관한 서술이다.' },
          { id: 'D', text: wrongParaTexts[2] || '필자의 의견이 명시적으로 드러나지 않는다.' }
        ],
        answerId: 'A',
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  });

  const recall = {
    cards: [
      { id: 'c1', text: '박경리의 「토지」는 구한말에서 해방까지 여러 세대의 삶을 형상화한 대하소설로, 최참판댁의 몰락과 재기, 민족 수난이 복합적으로 얽혀 있다.' },
      { id: 'c2', text: '서희는 빼앗긴 토지를 되찾기 위해 분투하며 시대 모순과 대결하는 여성 주체로 성장하며, 전통 가부장 서사에서 벗어난 새로운 인물 유형이다.' },
      { id: 'c3', text: '중심인물과 주변 인물이 거의 동등한 비중을 부여받으며, 소작농과 지식인, 독립운동가 등의 서사가 병렬적으로 서술되어 총체적 사회 묘사가 이루어진다.' },
      { id: 'c4', text: '하층민 인물들이 역사의 주체로 형상화되는 점이 작품의 민중적 지향을 보여 주며, 이 다성적 서사 구조는 한국의 공동체적 세계관이 반영된 독자적 성격을 지닌다.' },
      { id: 'c5', text: '토지라는 상징은 경제적 생존과 정체성의 근거이자 권력 관계를 결정짓는 사회적 매개물이며, 최참판댁 토지 수탈은 민족 자산 수탈의 알레고리이다.' },
      { id: 'c6', text: '서희의 토지 회복은 경제적 복원을 넘어 정체성 회복과 공동체 재건의 의미를 지니며, 농민의 삶은 땅과 인간의 원초적 관계를 형상화한다.' },
      { id: 'c7', text: '박경리는 특정 이데올로기에 치우치지 않고 인간의 보편적 삶을 형상화하여 민족 서사가 편협한 민족주의로 환원되는 것을 경계하였다.' },
      { id: 'c8', text: '자연과 인간, 전통과 근대, 개인과 공동체의 대립항이 변증법적으로 대화하는 서사 구조는 한국 문학의 세계 문학적 가능성을 입증하는 핵심 원리이다.' }
    ],
    correctOrder: ['c1','c2','c3','c4','c5','c6','c7','c8'],
    seedPenalty: 1
  };

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '서희라는 인물이 기존 소설의 인물 유형과 구별되는 점은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p1', '시대의 모순과 대결하는 여성 주체로 성장하며, 이는 전통적 가부장 서사에서 벗어난 새로운 인물 유형으로 평가된다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '「토지」의 다성적 서사 구조가 독자적 성격을 지니는 이유는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p2', '한국의 역사적 맥락과 공동체적 세계관이 반영되어 있다는 점에서 독자적 성격을 지닌다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '최참판댁의 토지 수탈이 갖는 상징적 의미는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '일제에 의한 민족 자산 수탈의 알레고리로 읽힌다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '토지 경작 농민의 삶이 형상화하는 문학적 의미는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '근대화 과정에서 상실된 유기적 공동체에 대한 향수와 비판적 성찰을 동시에 내포하고 있다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '박경리가 민족 서사를 다루면서 경계한 것은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '민족 서사가 편협한 민족주의로 환원되는 것을 경계하였다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '「토지」의 핵심적 미학 원리로 제시된 서사 구조의 특징은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '대립항들이 작품 안에서 대화하고 충돌하며 새로운 의미를 생성하는 변증법적 서사 구조는 이 소설의 핵심적 미학 원리이다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      }
    ]
  };

  content.payload = {
    passage: { format: 'TEXT', paragraphs },
    intensive: { timeline },
    recall,
    confirm
  };
  return content;
}

// ── Day 15 (NONFICTION) ── 기후 변화의 과학적 기제와 대응 전략
function buildDay15() {
  const paragraphs = [
    {
      id: 'p1',
      text: '기후 변화는 대기 중 온실가스 농도의 증가로 인해 지구의 평균 기온이 상승하는 현상으로, 그 과학적 기제는 복사 강제력의 변화에 의해 설명된다. 태양으로부터 유입되는 단파 복사 에너지는 지표면에 흡수된 뒤 장파 복사의 형태로 방출되는데, 이산화탄소와 메탄, 아산화질소 등의 온실가스가 이 장파 복사를 흡수하고 재방출함으로써 대기의 온도를 높이는 온실 효과가 발생한다. 산업 혁명 이전 대기 중 이산화탄소 농도는 약 280피피엠이었으나, 화석 연료의 대량 연소와 산림 벌채로 인해 현재 420피피엠을 상회하고 있다. 온실가스 농도의 증가는 복사 강제력의 양의 값을 키워 지구 에너지 수지의 불균형을 초래하며, 이러한 불균형이 지속되면 해양과 대기의 열 축적이 가속화되어 전 지구적 기온 상승으로 이어진다.'
    },
    {
      id: 'p2',
      text: '기후 변화의 영향은 기온 상승에 그치지 않고 지구 시스템 전반에 걸쳐 연쇄적으로 나타난다. 극지방과 고산 지역의 빙하가 가속적으로 융해되면서 해수면이 상승하고, 이는 저지대 연안 도시와 섬나라의 존립을 위협하고 있다. 해양의 열 흡수 증가는 해수 온도 상승을 야기하여 산호 백화 현상과 해양 생태계의 교란을 초래하며, 대기 중 수증기량의 증가는 강수 패턴의 변화와 극단적 기상 현상의 빈도 및 강도를 증가시킨다. 가뭄과 홍수의 교대적 발생, 열파의 장기화, 태풍의 강도 증가 등은 농업 생산성을 저하시키고 수자원 관리를 어렵게 하여 식량 안보와 공중 보건에 심각한 위협을 가하고 있다. 이러한 복합적 영향은 기후 변화가 환경 문제를 넘어 사회적·경제적 안보 문제로 확장되고 있음을 보여 준다.'
    },
    {
      id: 'p3',
      text: '기후 변화에 대한 국제 사회의 대응은 완화와 적응이라는 두 가지 전략으로 구분된다. 완화 전략은 온실가스 배출량 자체를 줄이는 것을 목표로 하며, 재생 에너지로의 전환, 에너지 효율 향상, 탄소 포집 및 저장 기술의 개발 등을 포함한다. 파리 협정은 지구 평균 기온 상승을 산업화 이전 대비 섭씨 2도 이내로 제한하고 가능하면 1.5도 이내로 억제하겠다는 국제적 목표를 설정하였으며, 이를 달성하기 위해 각국이 자발적으로 감축 목표를 제출하도록 규정하였다. 탄소 배출권 거래제와 탄소세 등 시장 기반 정책 수단도 도입되어, 배출량 감축에 경제적 유인을 제공하고 있다. 그러나 선진국과 개발도상국 간의 역사적 배출 책임과 현재의 경제적 여건 차이로 인해 공정한 부담 배분을 둘러싼 갈등이 지속되고 있다.'
    },
    {
      id: 'p4',
      text: '적응 전략은 이미 진행되고 있는 기후 변화의 영향에 대한 사회적 회복력을 강화하는 데 초점을 맞춘다. 해안 방벽의 건설, 내열성 작물 품종의 개발, 조기 경보 시스템의 구축 등이 대표적인 적응 방안이며, 이러한 조치들은 특히 기후 변화에 취약한 개발도상국과 소규모 섬 국가에서 더욱 시급하게 요구된다. 기후 정의의 관점에서 볼 때, 온실가스를 가장 적게 배출한 국가와 공동체가 가장 큰 피해를 입는다는 불균형은 국제 협력의 윤리적 토대를 구성하는 핵심 쟁점이다. 최근에는 손실과 피해 기금의 설립을 통해 취약 국가에 대한 재정적 지원을 제도화하려는 움직임이 구체화되고 있다. 궁극적으로 기후 변화 대응은 과학적 근거에 기반한 정책 설계와 전 지구적 연대가 결합될 때 실효성을 확보할 수 있으며, 이는 현세대와 미래 세대 모두를 위한 공동의 책무이다.'
    }
  ];

  const total = charCount(paragraphs);
  console.log(`Day 15 글자수: ${total}`);

  const content = makeShell(15, 'NONFICTION', 'dr-w3-015');
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);

    if (pi === 0) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '복사 강제력의 변화에 의해')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '주어' },
            { id: 'B', text: '부사어' },
            { id: 'C', text: '서술어' },
            { id: 'D', text: '목적어' }
          ],
          answerId: 'B',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 1) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '기후 변화의 영향은')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '서술어' },
            { id: 'B', text: '목적어' },
            { id: 'C', text: '주어' },
            { id: 'D', text: '부사어' }
          ],
          answerId: 'C',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 2) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '국제적 목표를')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '부사어' },
            { id: 'B', text: '주어' },
            { id: 'C', text: '서술어' },
            { id: 'D', text: '목적어' }
          ],
          answerId: 'D',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 3) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '사회적 회복력을')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '주어' },
            { id: 'B', text: '서술어' },
            { id: 'C', text: '목적어' },
            { id: 'D', text: '부사어' }
          ],
          answerId: 'C',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }

    sents.forEach((sent, si) => {
      stepNum++;
      const r = { paragraphId: para.id, start: sent.start, end: sent.end };
      const wrongSents = [];
      paragraphs.forEach((op, opi) => {
        if (opi !== pi) {
          const oSents = findSentences(op.text);
          if (oSents.length > 0) wrongSents.push(oSents[Math.min(si, oSents.length - 1)].text);
        }
      });
      const choices = [
        { id: 'A', text: sent.text.length > 80 ? sent.text.substring(0, 80) : sent.text },
        { id: 'B', text: wrongSents[0] ? (wrongSents[0].length > 80 ? wrongSents[0].substring(0, 80) : wrongSents[0]) : '해당 내용이 본문에 나타나지 않는다.' },
        { id: 'C', text: wrongSents[1] ? (wrongSents[1].length > 80 ? wrongSents[1].substring(0, 80) : wrongSents[1]) : '지문의 주제와 무관한 서술이다.' },
        { id: 'D', text: wrongSents[2] ? (wrongSents[2].length > 80 ? wrongSents[2].substring(0, 80) : wrongSents[2]) : '필자의 의견이 명시적으로 드러나지 않는다.' }
      ];
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [r] },
        question: {
          prompt: '하이라이트된 문장의 내용으로 알맞은 것은?',
          choices,
          answerId: 'A',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    stepNum++;
    const firstSent = sents[0].text;
    const wrongParaTexts = [];
    paragraphs.forEach((op, opi) => {
      if (opi !== pi) {
        const oSents = findSentences(op.text);
        wrongParaTexts.push(oSents[0].text.length > 80 ? oSents[0].text.substring(0, 80) : oSents[0].text);
      }
    });
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] },
      question: {
        prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
        choices: [
          { id: 'A', text: firstSent.length > 80 ? firstSent.substring(0, 80) : firstSent },
          { id: 'B', text: wrongParaTexts[0] || '해당 내용이 본문에 나타나지 않는다.' },
          { id: 'C', text: wrongParaTexts[1] || '지문의 주제와 무관한 서술이다.' },
          { id: 'D', text: wrongParaTexts[2] || '필자의 의견이 명시적으로 드러나지 않는다.' }
        ],
        answerId: 'A',
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  });

  const recall = {
    cards: [
      { id: 'c1', text: '기후 변화는 온실가스 농도 증가로 복사 강제력이 변하여 지구 에너지 수지가 불균형해지면서 해양과 대기의 열 축적이 가속화되는 현상이다.' },
      { id: 'c2', text: '산업 혁명 이전 약 280피피엠이던 이산화탄소 농도가 화석 연료 연소와 산림 벌채로 현재 420피피엠을 상회하고 있다.' },
      { id: 'c3', text: '빙하 융해로 해수면이 상승하고, 해수 온도 상승은 산호 백화와 해양 생태계 교란을 야기하며, 극단적 기상 현상의 빈도와 강도가 증가하고 있다.' },
      { id: 'c4', text: '가뭄, 홍수, 열파, 태풍 강도 증가 등은 농업 생산성 저하와 수자원 관리 어려움을 야기하여 식량 안보와 공중 보건을 위협한다.' },
      { id: 'c5', text: '완화 전략은 온실가스 배출량 감소를 목표로 재생 에너지 전환, 에너지 효율 향상, 탄소 포집 기술 등을 포함하며, 파리 협정이 국제적 감축 목표를 설정하였다.' },
      { id: 'c6', text: '탄소 배출권 거래제와 탄소세 등 시장 기반 정책 수단이 도입되었으나, 선진국과 개발도상국 간 공정한 부담 배분을 둘러싼 갈등이 지속된다.' },
      { id: 'c7', text: '적응 전략은 해안 방벽 건설, 내열성 작물 개발, 조기 경보 시스템 구축 등으로 기후 변화 영향에 대한 사회적 회복력을 강화하는 데 초점을 맞춘다.' },
      { id: 'c8', text: '기후 변화 대응은 과학적 근거에 기반한 정책 설계와 전 지구적 연대가 결합될 때 실효성을 가지며, 현세대와 미래 세대 모두를 위한 공동의 책무이다.' }
    ],
    correctOrder: ['c1','c2','c3','c4','c5','c6','c7','c8'],
    seedPenalty: 1
  };

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '온실 효과가 발생하는 구체적 기제는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p1', '온실가스가 이 장파 복사를 흡수하고 재방출함으로써 대기의 온도를 높이는 온실 효과가 발생한다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '기후 변화가 환경 문제를 넘어서는 차원으로 확장되는 이유는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p2', '기후 변화가 환경 문제를 넘어 사회적·경제적 안보 문제로 확장되고 있음을 보여 준다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '파리 협정이 설정한 기온 상승 제한 목표는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '지구 평균 기온 상승을 산업화 이전 대비 섭씨 2도 이내로 제한하고 가능하면 1.5도 이내로 억제하겠다는')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '완화 전략과 관련하여 국가 간 갈등이 지속되는 원인은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '선진국과 개발도상국 간의 역사적 배출 책임과 현재의 경제적 여건 차이로 인해 공정한 부담 배분을 둘러싼 갈등이 지속되고 있다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '기후 정의 관점에서 국제 협력의 윤리적 토대를 구성하는 핵심 쟁점은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '온실가스를 가장 적게 배출한 국가와 공동체가 가장 큰 피해를 입는다는 불균형은 국제 협력의 윤리적 토대를 구성하는 핵심 쟁점이다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '기후 변화 대응이 실효성을 확보하기 위한 조건은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '과학적 근거에 기반한 정책 설계와 전 지구적 연대가 결합될 때 실효성을 확보할 수 있으며')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      }
    ]
  };

  content.payload = {
    passage: { format: 'TEXT', paragraphs },
    intensive: { timeline },
    recall,
    confirm
  };
  return content;
}

// ── 메인 실행 ──
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const batchPath = path.join(ROOT, 'generated', 'daily-batch-reading-wittgenstein3.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'wittgenstein3');

  // 빌드
  const days = [
    { idx: 11, build: buildDay11 },
    { idx: 12, build: buildDay12 },
    { idx: 13, build: buildDay13 },
    { idx: 14, build: buildDay14 },
    { idx: 15, build: buildDay15 }
  ];

  const contents = [];
  for (const d of days) {
    const c = d.build();
    const total = charCount(c.payload.passage.paragraphs);
    if (total < 1550 || total > 1650) {
      console.error(`[경고] Day ${d.idx} 글자수 ${total} 범위 밖 (1550~1650)`);
    }
    // 복기 카드 8장 확인
    if (c.payload.recall.cards.length !== 8) {
      console.error(`[경고] Day ${d.idx} 복기 카드 ${c.payload.recall.cards.length}장 (8장 필요)`);
    }
    contents.push({ idx: d.idx, content: c });
  }

  // 배치 파일 최신 상태 읽기
  console.log('\n배치 파일 읽기...');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  console.log(`배치 items 수: ${batch.items.length}`);

  // items[10]~[14] 교체 (day 11~15)
  for (const { idx, content } of contents) {
    const batchIdx = idx - 1; // day 11 -> index 10
    const subArea = idx % 2 === 0 ? 'LITERATURE' : 'NONFICTION';
    batch.items[batchIdx] = makeBatchItem(idx, subArea, content);
    console.log(`배치 items[${batchIdx}] 교체 완료 (Day ${idx})`);
  }

  // 배치 파일 저장
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
  console.log('배치 파일 저장 완료');

  // static 파일 생성
  for (const { idx, content } of contents) {
    const fname = String(idx).padStart(3, '0') + '.json';
    const fpath = path.join(staticDir, fname);
    fs.writeFileSync(fpath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`${fname} 저장 완료`);
  }

  console.log('\n모든 작업 완료!');
}

main();
