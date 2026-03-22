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
  if (start === -1) throw new Error(`"${searchText.substring(0,30)}..." not found in ${pid}`);
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

// ── Day 6 (LITERATURE) ──
function buildDay6() {
  const paragraphs = [
    {
      id: 'p1',
      text: '김소월의 시 세계는 전통적 정한의 미학을 근대적 서정시의 형식으로 재구성한 것으로 평가된다. 그의 대표작 「진달래꽃」은 이별의 상황을 가정하여 화자의 정서를 드러내는 구조를 취한다. 화자는 떠나는 임에게 진달래꽃을 뿌려주겠다는 역설적 행위를 통해 슬픔을 절제하며, 이러한 절제는 오히려 정서적 깊이를 강화하는 효과를 낳는다. 이 작품에서 반복되는 시행 구조와 점층적 감정의 고조는 민요적 율격과 긴밀히 결합되어 있다. 「산유화」나 「초혼」에서도 유사한 정서적 구조가 관찰되는데, 자연물에 감정을 투사하여 화자의 내면을 우회적으로 표현하는 방식이 일관되게 나타난다. 소월 시의 핵심은 직접적 감정 토로를 자제하고 행위의 묘사를 통해 내면을 간접적으로 형상화하는 데 있으며, 이는 한국 서정시의 한 전범으로 자리 잡았다.'
    },
    {
      id: 'p2',
      text: '한용운의 「님의 침묵」은 소월과는 다른 방식으로 이별의 정서를 형상화한다. 한용운은 님의 부재를 단순한 연정이 아닌 존재론적 결핍으로 확대하며, 종교적·철학적 사유를 시적 언어에 담아낸다. 「님의 침묵」에서 님은 연인이자 조국이자 절대자를 동시에 지시하는 다의적 상징이다. 화자는 님이 떠났음에도 이별을 부정하고 재회를 확신하는데, 이러한 역설적 구조는 불교의 공(空) 사상과 맞닿아 있다. 곧 부재가 곧 존재의 전제이며, 침묵이 곧 말의 시작이라는 역설이 작품 전체를 관통한다. 이러한 역설적 사유는 논리적 모순이 아니라 대립항의 변증법적 통합을 지향하는 것으로, 동양 철학의 전통과 근대적 시 형식이 만나는 독특한 지점을 형성한다. 이처럼 한용운은 감정의 직접적 표출보다 관념의 시화(詩化)를 통해 이별의 보편성을 탐구하였다.'
    },
    {
      id: 'p3',
      text: '윤동주의 시는 자아 성찰을 통한 윤리적 지향이라는 독자적 영역을 구축하였다. 「서시」에서 화자는 죽는 날까지 하늘을 우러러 한 점 부끄럼 없기를 바라며, 이는 식민지 현실 속에서 자기 정화의 의지를 표명한 것이다. 윤동주 시의 특징은 화려한 수사 없이 일상적 어휘만으로 깊은 내면의 갈등을 표현한다는 점에 있다. 그의 시에서 별, 바람, 하늘 등의 자연물은 순수와 이상의 상징으로 기능하며, 이러한 상징들은 현실의 어둠과 대비되어 시적 긴장을 형성한다. 「자화상」에서 우물 속 자신을 바라보는 장면은 자기 분열과 통합의 욕망이 교차하는 순간을 포착한 것으로, 근대적 자아의 내면 풍경을 섬세하게 그려낸다. 고백적 어조와 자기 응시의 태도는 윤동주 시를 다른 저항시와 구별 짓는 핵심 요소이다.'
    },
    {
      id: 'p4',
      text: '이 세 시인의 작품을 비교하면 한국 근대 서정시의 스펙트럼이 드러난다. 소월이 민요적 율격과 절제된 감정으로 전통 서정의 근대적 변용을 이루었다면, 한용운은 관념적 사유를 시적 형식에 녹여 철학적 서정시를 개척하였다. 윤동주는 자아 성찰이라는 내면의 윤리적 투쟁을 시의 중심에 놓음으로써 서정시의 도덕적 차원을 확장하였다. 세 시인 모두 이별과 부재, 그리움이라는 공통 주제를 다루되, 각기 다른 미학적 방법론을 통해 독자적 시 세계를 구축했다는 점에서 한국 현대시의 다양성과 깊이를 입증하고 있다. 이들은 일제 강점기라는 동일한 시대적 배경 속에서 문학적 활동을 전개하였으나, 시적 대응 방식에서 뚜렷한 차이를 보인다. 이들의 문학적 유산은 이후 한국 시문학 전개에 근본적 자양분이 되었으며 오늘날까지 널리 향유되고 있다.'
    }
  ];

  const total = charCount(paragraphs);
  console.log(`Day 6 글자수: ${total}`);

  const content = makeShell(6, 'LITERATURE', 'dr-w3-006');

  // intensive
  const timeline = [];
  let stepNum = 0;
  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);

    // 문장 성분 문제 (첫 문장에서)
    if (pi === 0) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '전통적 정한의 미학을')] },
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
        highlight: { ranges: [findRange(paragraphs, para.id, '한용운은')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '부사어' },
            { id: 'B', text: '서술어' },
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
        highlight: { ranges: [findRange(paragraphs, para.id, '독자적 영역을')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '서술어' },
            { id: 'B', text: '목적어' },
            { id: 'C', text: '부사어' },
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
        highlight: { ranges: [findRange(paragraphs, para.id, '스펙트럼이')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '주어' },
            { id: 'B', text: '부사어' },
            { id: 'C', text: '목적어' },
            { id: 'D', text: '서술어' }
          ],
          answerId: 'A',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }

    // 문장별 하이라이트 + 내용 파악
    sents.forEach((sent, si) => {
      stepNum++;
      const r = { paragraphId: para.id, start: sent.start, end: sent.end };
      // 오답 선지 - 다른 문단의 문장들
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
    const paraRange = { paragraphId: para.id, start: 0, end: para.text.length };
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
      highlight: { ranges: [paraRange] },
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

  // recall - 8장
  const recall = {
    cards: [
      { id: 'c1', text: '김소월의 시 세계는 전통적 정한의 미학을 근대적 서정시의 형식으로 재구성한 것으로 평가되며, 「진달래꽃」은 이별 상황을 가정하여 화자의 정서를 드러낸다.' },
      { id: 'c2', text: '화자는 떠나는 임에게 진달래꽃을 뿌려주겠다는 역설적 행위로 슬픔을 절제하며, 반복 시행과 점층적 감정 고조는 민요적 율격과 결합되어 있다.' },
      { id: 'c3', text: '한용운의 「님의 침묵」은 님의 부재를 존재론적 결핍으로 확대하며, 님은 연인이자 조국이자 절대자를 동시에 지시하는 다의적 상징이다.' },
      { id: 'c4', text: '한용운은 부재가 존재의 전제이고 침묵이 말의 시작이라는 역설 구조를 통해 불교의 공 사상과 연결된 철학적 서정시를 개척하였다.' },
      { id: 'c5', text: '윤동주의 「서시」는 식민지 현실 속에서 자기 정화의 의지를 표명하며, 화려한 수사 없이 일상적 어휘로 깊은 내면의 갈등을 표현한다.' },
      { id: 'c6', text: '윤동주 시에서 별, 바람, 하늘 등의 자연물은 순수와 이상의 상징으로 기능하며, 고백적 어조와 자기 응시 태도가 핵심 특징이다.' },
      { id: 'c7', text: '소월은 민요적 율격과 절제된 감정으로, 한용운은 관념적 사유로, 윤동주는 자아 성찰의 윤리적 투쟁으로 각각 독자적 시 세계를 구축하였다.' },
      { id: 'c8', text: '세 시인 모두 이별과 부재, 그리움의 공통 주제를 다루되 서로 다른 미학적 방법론을 활용하여 한국 현대시의 다양성과 깊이를 입증하고 있다.' }
    ],
    correctOrder: ['c1','c2','c3','c4','c5','c6','c7','c8'],
    seedPenalty: 1
  };

  // confirm - 6문항
  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '김소월 시에서 슬픔의 감정이 강화되는 핵심적인 방법은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p1', '이러한 절제는 오히려 정서적 깊이를 강화하는 효과를 낳는다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '한용운의 「님의 침묵」에서 님이 지닌 상징적 의미의 특성은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p2', '님은 연인이자 조국이자 절대자를 동시에 지시하는 다의적 상징이다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '한용운 시의 역설적 구조와 연결되는 사상적 배경은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p2', '이러한 역설적 구조는 불교의 공(空) 사상과 맞닿아 있다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '윤동주 시에서 별, 바람, 하늘 같은 자연물이 담당하는 역할은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '별, 바람, 하늘 등의 자연물은 순수와 이상의 상징으로 기능하며')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '한용운이 이별의 보편성을 탐구한 주된 시적 방법론은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p2', '관념의 시화(詩化)를 통해 이별의 보편성을 탐구하였다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '세 시인이 공유하는 공통 주제는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '이별과 부재, 그리움이라는 공통 주제를 다루되')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true,
        answerMatchMode: 'ANY'
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

// ── Day 7 (NONFICTION) ──
function buildDay7() {
  const paragraphs = [
    {
      id: 'p1',
      text: '인공지능의 의사결정 과정에서 발생하는 편향 문제는 현대 기술 윤리의 핵심 쟁점으로 부상하고 있다. 기계 학습 알고리즘은 학습 데이터에 내재된 패턴을 반영하여 결과를 산출하는데, 학습 데이터 자체에 사회적 편견이 포함되어 있을 경우 알고리즘의 출력 역시 편향된 결과를 재생산하게 된다. 예컨대 과거의 채용 데이터를 학습한 인공지능이 특정 성별이나 인종에 불리한 판정을 내리는 사례가 보고되었으며, 이는 알고리즘이 차별을 자동화하는 결과를 초래한다. 신용 평가, 범죄 예측, 의료 진단 등 사회적 영향력이 큰 분야에서 이러한 편향이 발생하면 개인과 집단 모두에 심각한 피해를 줄 수 있다. 이러한 문제를 알고리즘 편향이라 부르며, 그 원인은 데이터 수집 단계의 표본 왜곡, 특성 선택의 부적절성, 모델 설계의 구조적 한계 등 다층적이다.'
    },
    {
      id: 'p2',
      text: '알고리즘 편향에 대응하기 위해 기술적·제도적 접근이 모두 필요하다. 기술적 측면에서는 학습 데이터의 균형성을 확보하고, 모델의 공정성을 측정하는 지표를 도입하며, 편향을 탐지하고 보정하는 후처리 기법을 적용하는 방법이 연구되고 있다. 대표적인 공정성 지표로는 통계적 동등성, 기회 균등, 예측 동등성 등이 있으며, 각각 다른 측면에서 알고리즘의 공정한 작동 여부를 판단한다. 그러나 공정성의 정의 자체가 맥락에 따라 달라지기 때문에, 하나의 기술적 해법으로 모든 편향을 제거하기는 어렵다. 예를 들어 개인 공정성과 집단 공정성은 수학적으로 동시에 충족될 수 없는 경우가 있으며, 이는 공정성 개념 간의 상충 관계를 의미한다. 따라서 기술적 보정만으로는 한계가 있으며, 사회적 합의를 바탕으로 한 규범적 기준의 설정이 병행되어야 한다.'
    },
    {
      id: 'p3',
      text: '제도적 차원에서는 알고리즘의 투명성 확보와 설명 가능성 보장이 핵심 과제로 제기된다. 유럽연합의 일반 데이터 보호 규정(GDPR)은 자동화된 의사결정에 대해 개인이 설명을 요구할 권리를 규정하고 있으며, 이는 알고리즘의 블랙박스 문제를 해소하기 위한 법적 장치이다. 또한 알고리즘 영향 평가 제도를 도입하여 인공지능 시스템이 사회에 미치는 잠재적 위험을 사전에 식별하고 관리하도록 요구하는 움직임이 확산되고 있다. 한국에서도 인공지능 윤리 기준이 마련되었으며, 공공 부문의 인공지능 도입 시 영향 평가를 의무화하는 법제화 논의가 진행 중이다. 이러한 제도적 장치는 기업의 자율 규제만으로는 충분치 않으며, 독립적인 감독 기구의 운영과 시민 참여가 보완되어야 실효성을 갖출 수 있다.'
    },
    {
      id: 'p4',
      text: '알고리즘 편향 문제의 근본적 해결을 위해서는 기술과 제도를 아우르는 통합적 거버넌스가 필요하다. 기술 개발자는 설계 단계에서부터 공정성과 포용성을 핵심 가치로 설정해야 하며, 정책 입안자는 빠르게 변화하는 기술 환경에 적응할 수 있는 유연한 규제 체계를 구축해야 한다. 더불어 인공지능의 편향이 특정 집단에 불균형한 피해를 유발할 수 있으므로, 피해 당사자의 목소리를 의사결정 과정에 반영하는 참여적 설계 방법론의 확립이 요청된다. 이를 위해 다양한 배경을 가진 전문가와 시민이 함께하는 다학제적 거버넌스 구조의 설계가 중요하다. 궁극적으로 알고리즘 편향의 해소는 기술적 정밀성과 사회적 정의가 결합될 때 비로소 실현될 수 있으며, 이는 인공지능 시대의 민주주의를 유지하기 위한 필수 조건이다.'
    }
  ];

  const total = charCount(paragraphs);
  console.log(`Day 7 글자수: ${total}`);

  const content = makeShell(7, 'NONFICTION', 'dr-w3-007');
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);

    // 문장 성분 문제
    if (pi === 0) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '편향 문제는')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '주어' },
            { id: 'B', text: '목적어' },
            { id: 'C', text: '부사어' },
            { id: 'D', text: '서술어' }
          ],
          answerId: 'A',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 1) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '학습 데이터의 균형성을')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '서술어' },
            { id: 'B', text: '목적어' },
            { id: 'C', text: '주어' },
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
        highlight: { ranges: [findRange(paragraphs, para.id, '투명성 확보와 설명 가능성 보장이')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '부사어' },
            { id: 'B', text: '서술어' },
            { id: 'C', text: '주어' },
            { id: 'D', text: '목적어' }
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
        highlight: { ranges: [findRange(paragraphs, para.id, '통합적 거버넌스가')] },
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
      { id: 'c1', text: '기계 학습 알고리즘은 학습 데이터에 내재된 패턴을 반영하며, 데이터 자체에 사회적 편견이 포함되면 편향된 결과를 재생산하게 된다.' },
      { id: 'c2', text: '알고리즘 편향의 원인은 데이터 수집 단계의 표본 왜곡, 특성 선택의 부적절성, 모델 설계의 구조적 한계 등 다층적이다.' },
      { id: 'c3', text: '공정성의 정의 자체가 맥락에 따라 달라지므로, 개인 공정성과 집단 공정성은 수학적으로 동시에 충족될 수 없는 경우가 있다.' },
      { id: 'c4', text: '기술적 보정만으로는 한계가 있으며, 사회적 합의를 바탕으로 한 규범적 기준 설정이 병행되어야 한다.' },
      { id: 'c5', text: '유럽연합의 GDPR은 자동화된 의사결정에 대해 개인이 설명을 요구할 권리를 규정하고, 알고리즘의 블랙박스 문제 해소를 위한 법적 장치이다.' },
      { id: 'c6', text: '알고리즘 영향 평가 제도를 도입하여 인공지능 시스템이 사회에 미치는 잠재적 위험을 사전에 식별하고 관리하도록 요구하는 움직임이 확산되고 있다.' },
      { id: 'c7', text: '기술 개발자는 설계 단계에서 공정성과 포용성을 핵심 가치로 설정하고, 정책 입안자는 유연한 규제 체계를 구축해야 한다.' },
      { id: 'c8', text: '알고리즘 편향 해소는 기술적 정밀성과 사회적 정의가 결합될 때 실현될 수 있으며, 인공지능 시대 민주주의 유지를 위한 필수 조건이다.' }
    ],
    correctOrder: ['c1','c2','c3','c4','c5','c6','c7','c8'],
    seedPenalty: 1
  };

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '알고리즘 편향의 원인이 다층적이라 할 때, 그 구체적 원인으로 제시된 것은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p1', '데이터 수집 단계의 표본 왜곡, 특성 선택의 부적절성, 모델 설계의 구조적 한계 등 다층적이다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '공정성 개념 간 상충 관계란 구체적으로 어떤 상황을 의미하는가?',
        answerRanges: [findRange(paragraphs, 'p2', '개인 공정성과 집단 공정성은 수학적으로 동시에 충족될 수 없는 경우가 있으며')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: 'GDPR에서 규정한 개인의 권리는 구체적으로 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '자동화된 의사결정에 대해 개인이 설명을 요구할 권리를 규정하고 있으며')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '제도적 장치가 실효성을 갖추기 위해 보완되어야 하는 요소는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '독립적인 감독 기구의 운영과 시민 참여가 보완되어야 실효성을 갖출 수 있다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '피해 당사자의 참여가 필요한 이유와 관련된 설계 방법론은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '피해 당사자의 목소리를 의사결정 과정에 반영하는 참여적 설계 방법론의 확립이 요청된다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '알고리즘 편향 해소가 궁극적으로 실현되기 위한 조건은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '기술적 정밀성과 사회적 정의가 결합될 때 비로소 실현될 수 있으며')],
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

// ── Day 8 (LITERATURE) ──
function buildDay8() {
  const paragraphs = [
    {
      id: 'p1',
      text: '판소리계 소설 「춘향전」은 신분제 사회의 모순을 사랑이라는 서사를 통해 형상화한 고전 서사 문학의 대표작이다. 이 작품에서 춘향은 퇴기의 딸이라는 신분적 한계에도 불구하고 이몽룡과의 사랑을 지키기 위해 변학도의 수청 요구에 항거한다. 춘향의 항거는 개인적 사랑의 수호에 그치지 않고 부당한 권력에 대한 저항이라는 사회적 의미를 획득한다. 특히 춘향이 옥중에서도 절개를 지키는 장면은 조선 후기 민중이 지향했던 도덕적 이상을 집약적으로 형상화한 대목이다. 작품의 서사 구조는 만남과 이별, 시련과 재회라는 전형적 로맨스 플롯을 따르면서도, 그 안에 조선 후기 사회의 계급 갈등과 민중 의식의 성장을 반영하고 있다는 점에서 단순한 애정 서사를 넘어선다. 이러한 중층적 의미 구조 때문에 춘향전은 문학 연구뿐 아니라 사회사 연구의 자료로도 활용되고 있다.'
    },
    {
      id: 'p2',
      text: '춘향전의 문학적 가치는 다층적 인물 형상화에서도 확인된다. 춘향은 열녀이자 의인이며 동시에 자기 운명을 개척하는 주체적 여성으로 그려진다. 이몽룡은 풍류적 양반에서 출발하여 암행어사로 변모하는데, 이는 당대 민중이 꿈꾸던 이상적 관리상의 투영이다. 변학도는 탐관오리의 전형으로서 권력의 횡포와 부패를 상징하며, 방자와 향단 등 주변 인물들은 해학과 풍자를 통해 서사에 생동감을 부여한다. 특히 방자는 양반과 천민 사이를 오가며 두 계층의 언어와 관습을 매개하는 인물로, 신분 질서의 경계를 가시화하는 역할을 수행한다. 이처럼 다양한 인물 유형의 배치는 작품이 특정 계층의 시각에 머물지 않고 사회 전체를 조망하는 시야를 확보하게 하는 장치로 기능한다.'
    },
    {
      id: 'p3',
      text: '「춘향전」의 또 다른 특징은 판소리라는 공연 예술의 서사 양식을 소설 형태로 정착시킨 데 있다. 판소리의 구술적 특성은 문체에 고스란히 반영되어, 운문과 산문이 교차하고 창과 아니리가 번갈아 나타나는 독특한 서술 방식이 형성되었다. 이러한 혼합 문체는 독자로 하여금 청각적 상상력을 자극하며, 읽는 행위 속에서 듣는 체험을 가능하게 한다. 특히 춘향과 이도령의 사랑 장면에서는 서정적 운문이, 변학도의 생일잔치 장면에서는 풍자적 산문이 우세하게 나타나 장면의 분위기에 따라 문체가 유기적으로 변화한다. 또한 작품 곳곳에 삽입된 한시와 민요, 속담 등은 당대의 언어 문화를 풍부하게 담아내고 있어, 춘향전은 문학 텍스트인 동시에 문화사적 자료로서의 가치도 지닌다.'
    },
    {
      id: 'p4',
      text: '춘향전이 수백 년에 걸쳐 전승되며 다양한 이본이 생성된 것은 이 작품의 개방적 서사 구조에 기인한다. 판소리로 불리던 시절부터 창자에 따라 내용이 변형되었으며, 필사본과 방각본, 활자본 등 매체의 변화에 따라 서사의 세부가 달라졌다. 이러한 이본의 다양성은 춘향전이 고정된 하나의 텍스트가 아니라, 공동체의 집단적 상상력이 축적된 열린 서사임을 보여준다. 대표적으로 완판본과 경판본은 서사의 분량과 세부 묘사에서 현저한 차이를 보이며, 이는 지역적 문화 전통의 차이가 반영된 결과이다. 근현대에 이르러 춘향전은 소설뿐 아니라 영화, 오페라, 뮤지컬 등 다양한 장르로 재창작되었으며, 이는 이 작품이 가진 서사적 보편성과 문화적 생명력을 증명하는 것이다. 춘향전의 지속적 변용은 고전이 현재와 대화하는 방식의 전형적 사례에 해당한다.'
    }
  ];

  const total = charCount(paragraphs);
  console.log(`Day 8 글자수: ${total}`);

  const content = makeShell(8, 'LITERATURE', 'dr-w3-008');
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);

    if (pi === 0) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '고전 서사 문학의 대표작이다')] },
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
        highlight: { ranges: [findRange(paragraphs, para.id, '문학적 가치는')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '주어' },
            { id: 'B', text: '목적어' },
            { id: 'C', text: '부사어' },
            { id: 'D', text: '서술어' }
          ],
          answerId: 'A',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 2) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '청각적 상상력을')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '부사어' },
            { id: 'B', text: '서술어' },
            { id: 'C', text: '목적어' },
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
        highlight: { ranges: [findRange(paragraphs, para.id, '개방적 서사 구조에')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '서술어' },
            { id: 'B', text: '주어' },
            { id: 'C', text: '부사어' },
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
      { id: 'c1', text: '「춘향전」은 신분제 사회의 모순을 사랑 서사로 형상화하며, 춘향의 항거는 부당한 권력에 대한 저항이라는 사회적 의미를 획득한다.' },
      { id: 'c2', text: '서사 구조는 만남과 이별, 시련과 재회의 로맨스 플롯을 따르면서 조선 후기 계급 갈등과 민중 의식의 성장을 반영한다.' },
      { id: 'c3', text: '춘향은 열녀이자 의인이며 주체적 여성으로 그려지고, 이몽룡은 당대 민중이 꿈꾸던 이상적 관리상의 투영이다.' },
      { id: 'c4', text: '변학도는 탐관오리의 전형이며, 방자와 향단 등 주변 인물들은 해학과 풍자를 통해 서사에 생동감을 부여한다.' },
      { id: 'c5', text: '판소리의 구술적 특성이 문체에 반영되어 운문과 산문이 교차하고 창과 아니리가 번갈아 나타나는 독특한 서술 방식이 형성되었다.' },
      { id: 'c6', text: '작품에 삽입된 한시와 민요, 속담 등은 당대 언어 문화를 담아내어 춘향전은 문학 텍스트이자 문화사적 자료로서의 가치를 지닌다.' },
      { id: 'c7', text: '이본의 다양성은 춘향전이 공동체의 집단적 상상력이 축적된 열린 서사임을 보여준다.' },
      { id: 'c8', text: '근현대에 영화, 오페라, 뮤지컬 등으로 재창작되었으며, 이는 서사적 보편성과 문화적 생명력을 증명한다.' }
    ],
    correctOrder: ['c1','c2','c3','c4','c5','c6','c7','c8'],
    seedPenalty: 1
  };

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '춘향의 항거가 지닌 사회적 의미는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p1', '부당한 권력에 대한 저항이라는 사회적 의미를 획득한다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '이몽룡의 인물 형상이 민중 의식과 관련되는 이유는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p2', '당대 민중이 꿈꾸던 이상적 관리상의 투영이다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '판소리의 구술적 특성이 소설 문체에 미친 영향은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '운문과 산문이 교차하고 창과 아니리가 번갈아 나타나는 독특한 서술 방식이 형성되었다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '춘향전이 문학 텍스트 이외에 어떤 가치를 지닌다고 평가되는가?',
        answerRanges: [findRange(paragraphs, 'p3', '문화사적 자료로서의 가치도 지닌다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '이본의 다양성이 춘향전에 대해 보여주는 바는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '공동체의 집단적 상상력이 축적된 열린 서사임을 보여준다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '춘향전의 근현대 재창작이 증명하는 것은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '서사적 보편성과 문화적 생명력을 증명하는 것이다.')],
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

// ── Day 9 (NONFICTION) ──
function buildDay9() {
  const paragraphs = [
    {
      id: 'p1',
      text: '기후 변화에 대응하기 위한 국제 사회의 노력은 1992년 유엔기후변화협약(UNFCCC)의 채택으로 본격화되었다. 이 협약은 온실가스 배출을 안정화하여 기후 체계에 대한 위험한 인위적 간섭을 방지한다는 궁극적 목표를 설정하였다. 이후 1997년 교토의정서는 선진국에 온실가스 감축 의무를 부과하는 구속력 있는 국제 규범으로 기능하였으나, 미국의 비준 거부와 개발도상국의 감축 의무 면제라는 구조적 한계로 실효성에 의문이 제기되었다. 특히 교토의정서 체제에서는 전 세계 온실가스 배출의 상당 부분을 차지하는 중국과 인도가 감축 의무에서 제외되어, 지구 전체의 배출량 감소 효과가 제한적이었다. 이러한 한계를 극복하기 위해 2015년 파리협정이 체결되었으며, 이는 모든 당사국이 자발적으로 감축 목표를 설정하는 상향식 접근 방식을 채택하여 기존 체제와 차별화된다.'
    },
    {
      id: 'p2',
      text: '파리협정의 핵심 메커니즘은 국가결정기여(NDC)이다. 각 당사국은 자국의 경제 상황과 역량을 고려하여 온실가스 감축 목표를 자체적으로 설정하고 이를 유엔에 제출한다. 이 목표는 5년마다 갱신되며, 이전보다 더 의욕적인 목표를 제시해야 한다는 진전 원칙이 적용된다. 아울러 전 지구적 이행 점검 체계를 통해 각국의 감축 노력을 종합적으로 평가하고, 그 결과를 차기 NDC 설정에 반영하도록 하고 있다. 그러나 NDC의 이행을 강제할 법적 구속력이 부재하다는 점은 파리협정의 구조적 약점으로 지적된다. 각국의 자발적 의지에 의존하는 체제는 무임승차 문제를 야기할 수 있으며, 실제로 일부 국가는 목표 달성에 필요한 정책 조치를 충분히 이행하지 않고 있다.'
    },
    {
      id: 'p3',
      text: '기후 변화의 영향이 국가 간 불균등하게 분포한다는 점에서 기후 정의의 문제가 부각된다. 역사적으로 온실가스를 대량 배출한 선진국과 그 피해를 집중적으로 받는 개발도상국 사이의 책임 분배는 기후 협상의 핵심 쟁점이다. 이를 공통의 그러나 차별화된 책임 원칙이라 부르며, 선진국이 역사적 배출에 대해 더 큰 책임을 져야 한다는 논리적 근거가 된다. 기후 취약국들은 자국의 배출량이 미미함에도 해수면 상승, 극단적 기상현상 등으로 존립 자체가 위협받고 있으며, 이에 대한 손실과 피해 보상 체계의 구축을 강력히 요구하고 있다. 2022년 샤름엘셰이크에서 개최된 유엔기후변화당사국총회(COP27)에서는 손실과 피해 기금의 설립이 합의되었으나, 기금의 규모와 운영 방식에 대한 세부 사항은 여전히 논의 중이다.'
    },
    {
      id: 'p4',
      text: '기후 위기의 해결을 위해서는 감축과 적응이라는 두 축의 전략이 동시에 추진되어야 한다. 감축은 온실가스 배출 자체를 줄이는 것으로, 재생에너지 전환, 에너지 효율 개선, 탄소 포집 및 저장 기술 등이 핵심 수단이다. 적응은 이미 진행 중인 기후 변화의 영향에 대비하는 것으로, 방재 인프라 구축, 농업 체계 전환, 조기경보 시스템 운영 등을 포함한다. 두 전략 모두 막대한 재정 투입을 필요로 하며, 특히 개발도상국의 경우 자체 재원만으로는 충분한 대응이 어렵기 때문에 선진국의 기후 재정 지원이 필수적이다. 선진국들은 연간 1천억 달러의 기후 재정 지원을 약속한 바 있으나, 실제 이행 수준은 목표에 미치지 못하고 있다. 기후 위기는 특정 국가만의 문제가 아닌 전 지구적 공공재의 관리 문제이므로, 국제 협력의 강화가 그 어느 때보다 절실하다.'
    }
  ];

  const total = charCount(paragraphs);
  console.log(`Day 9 글자수: ${total}`);

  const content = makeShell(9, 'NONFICTION', 'dr-w3-009');
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);

    if (pi === 0) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '국제 사회의 노력은')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '주어' },
            { id: 'B', text: '서술어' },
            { id: 'C', text: '목적어' },
            { id: 'D', text: '부사어' }
          ],
          answerId: 'A',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 1) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '국가결정기여(NDC)이다')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '부사어' },
            { id: 'B', text: '서술어' },
            { id: 'C', text: '주어' },
            { id: 'D', text: '목적어' }
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
        highlight: { ranges: [findRange(paragraphs, para.id, '기후 정의의 문제가')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '목적어' },
            { id: 'B', text: '부사어' },
            { id: 'C', text: '주어' },
            { id: 'D', text: '서술어' }
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
        highlight: { ranges: [findRange(paragraphs, para.id, '감축과 적응이라는 두 축의 전략이')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '주어' },
            { id: 'B', text: '목적어' },
            { id: 'C', text: '서술어' },
            { id: 'D', text: '부사어' }
          ],
          answerId: 'A',
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
      { id: 'c1', text: '유엔기후변화협약(1992)으로 기후 대응이 본격화되었고, 교토의정서(1997)는 선진국에 감축 의무를 부과했으나 구조적 한계가 있었다.' },
      { id: 'c2', text: '파리협정(2015)은 모든 당사국이 자발적으로 감축 목표를 설정하는 상향식 접근을 채택하여 기존 체제와 차별화된다.' },
      { id: 'c3', text: 'NDC는 5년마다 갱신되며 이전보다 의욕적인 목표를 제시해야 하는 진전 원칙이 적용되나, 법적 구속력이 부재하다.' },
      { id: 'c4', text: '자발적 체제는 무임승차 문제를 야기할 수 있으며, 일부 국가는 필요한 정책 조치를 충분히 이행하지 않고 있다.' },
      { id: 'c5', text: '기후 취약국은 배출량이 미미함에도 해수면 상승 등으로 존립이 위협받으며, 손실과 피해 보상 체계 구축을 요구한다.' },
      { id: 'c6', text: 'COP27에서 손실과 피해 기금 설립이 합의되었으나, 기금 규모와 운영 방식의 세부 사항은 논의 중이다.' },
      { id: 'c7', text: '감축은 배출 자체를 줄이는 전략이고, 적응은 이미 진행 중인 기후 변화의 영향에 대비하는 전략이다.' },
      { id: 'c8', text: '기후 위기는 전 지구적 공공재 관리 문제이므로, 개발도상국에 대한 기후 재정 지원과 국제 협력 강화가 절실하다.' }
    ],
    correctOrder: ['c1','c2','c3','c4','c5','c6','c7','c8'],
    seedPenalty: 1
  };

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '교토의정서의 구조적 한계로 지적된 사항은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p1', '미국의 비준 거부와 개발도상국의 감축 의무 면제라는 구조적 한계로 실효성에 의문이 제기되었다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: 'NDC 체제에서 적용되는 진전 원칙의 구체적 내용은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p2', '이전보다 더 의욕적인 목표를 제시해야 한다는 진전 원칙이 적용된다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '파리협정의 구조적 약점으로 지적되는 사항은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p2', 'NDC의 이행을 강제할 법적 구속력이 부재하다는 점은 파리협정의 구조적 약점으로 지적된다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '기후 취약국이 겪는 구체적 피해 양상은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '해수면 상승, 극단적 기상현상 등으로 존립 자체가 위협받고 있으며')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '감축 전략의 핵심 수단으로 제시된 것은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '재생에너지 전환, 에너지 효율 개선, 탄소 포집 및 저장 기술 등이 핵심 수단이다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '기후 위기가 전 지구적 차원에서 관리되어야 하는 이유는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '특정 국가만의 문제가 아닌 전 지구적 공공재의 관리 문제이므로')],
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

// ── Day 10 (LITERATURE) ──
function buildDay10() {
  const paragraphs = [
    {
      id: 'p1',
      text: '이상의 소설 「날개」는 1936년 잡지 《조광》에 발표된 한국 모더니즘 문학의 대표작으로, 식민지 근대의 소외된 지식인을 통해 자아의 위기와 회복의 문제를 탐구한다. 작품의 화자인 나는 아내에 의해 방 안에 유폐된 채 무기력한 일상을 보내는 인물로, 자의식은 과잉되어 있으나 실제 행동력은 극도로 위축되어 있다. 이러한 인물 설정은 식민지 지식인이 처한 현실적 무력감을 상징하며, 동시에 근대적 자아가 외부 세계와 맺는 불안한 관계를 형상화한다. 화자가 반복적으로 진술하는 권태와 무의미의 감각은 실존주의적 인간 인식과도 맞닿아 있어, 동시대 세계 문학의 흐름과 교차하는 지점을 보여준다. 작품의 제목인 날개는 억압된 존재가 자유와 해방을 향해 비상하려는 의지의 상징으로 해석되며, 마지막 장면의 절규는 한국 근대 문학사에서 가장 인상적인 결말 중 하나로 평가된다.'
    },
    {
      id: 'p2',
      text: '「날개」의 서사 구조는 전통적 소설의 인과적 플롯과 현저히 다르다. 사건의 시간적 순서가 뒤섞이고, 화자의 의식 흐름에 따라 서술이 전개되며, 현실과 환상의 경계가 모호하게 처리된다. 이러한 서술 기법은 제임스 조이스와 버지니아 울프 등 서구 모더니즘 작가들의 의식의 흐름 기법과 유사하되, 이상은 이를 식민지라는 특수한 맥락에 적용하여 독자적인 문학적 성취를 이루었다. 또한 숫자와 기호를 활용한 파격적 문장 구성, 패러독스와 아이러니의 중첩은 이상 특유의 전위적 문체를 형성하는 핵심 요소이다. 특히 화자의 자의식이 서술의 중심이 되면서 외부 세계는 왜곡되고 파편화된 형태로 재현되는데, 이는 근대적 주체의 불안정성을 형식적 차원에서 구현한 것이라 할 수 있다.'
    },
    {
      id: 'p3',
      text: '작품에서 아내와 나의 관계는 경제적 종속과 정서적 소외라는 이중 구조를 형성한다. 아내는 화장품과 거울로 대표되는 근대적 소비 문화의 향유자이자 경제적 주체이며, 나는 아내가 제공하는 아스피린에 의존하여 수면과 각성의 리듬을 잃어가는 존재로 그려진다. 이 관계의 역전은 당대 가부장적 질서의 균열을 암시하는 동시에, 화폐 경제가 인간관계를 재편하는 양상을 비유적으로 드러낸다. 아내의 방과 나의 방이 분리된 공간 구성은 두 인물 사이의 단절을 물리적으로 가시화하는 서사적 장치이기도 하다. 나아가 밀폐된 방이라는 공간은 화자의 심리적 감옥이자 식민지 현실의 축소판으로 기능하며, 방 밖으로의 외출은 일시적 해방의 체험이자 자아 각성의 계기로 작용한다.'
    },
    {
      id: 'p4',
      text: '「날개」의 문학사적 의의는 한국 소설이 전통적 리얼리즘의 서사 관습에서 벗어나 모더니즘적 실험을 본격적으로 수행한 최초의 성과라는 데 있다. 이상은 언어 자체를 실험의 대상으로 삼아 의미의 다층성과 형식의 파격성을 동시에 추구하였으며, 이는 한국 문학의 표현 가능성을 비약적으로 확장하였다. 또한 이 작품은 근대 도시 서울의 풍경과 식민지 자본주의의 일상을 섬세하게 포착하고 있어, 문학 텍스트이면서 동시에 역사적 기록으로서의 가치를 지닌다. 경성의 거리와 백화점, 카페 등이 작품 속에 구체적으로 묘사되어 당대 도시 문화의 단면을 생생하게 전달하고 있다. 이상 문학에 대한 연구는 오늘날까지 활발히 이루어지고 있으며, 그의 작품은 한국 현대 문학을 이해하는 데 빠뜨릴 수 없는 필수적 텍스트로 자리매김하고 있다.'
    }
  ];

  const total = charCount(paragraphs);
  console.log(`Day 10 글자수: ${total}`);

  const content = makeShell(10, 'LITERATURE', 'dr-w3-010');
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
            { id: 'A', text: '부사어' },
            { id: 'B', text: '주어' },
            { id: 'C', text: '서술어' },
            { id: 'D', text: '목적어' }
          ],
          answerId: 'A',
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    if (pi === 1) {
      stepNum++;
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [findRange(paragraphs, para.id, '서사 구조는')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '목적어' },
            { id: 'B', text: '서술어' },
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
        highlight: { ranges: [findRange(paragraphs, para.id, '이중 구조를')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '서술어' },
            { id: 'B', text: '목적어' },
            { id: 'C', text: '주어' },
            { id: 'D', text: '부사어' }
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
        highlight: { ranges: [findRange(paragraphs, para.id, '문학사적 의의는')] },
        question: {
          prompt: '하이라이트된 부분의 문장 성분으로 가장 알맞은 것은?',
          choices: [
            { id: 'A', text: '주어' },
            { id: 'B', text: '부사어' },
            { id: 'C', text: '목적어' },
            { id: 'D', text: '서술어' }
          ],
          answerId: 'A',
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
      { id: 'c1', text: '이상의 「날개」는 식민지 근대의 소외된 지식인을 통해 자아의 위기와 회복을 탐구하며, 날개는 자유와 해방 의지의 상징이다.' },
      { id: 'c2', text: '화자인 나는 자의식은 과잉되어 있으나 행동력은 위축되어 있어, 식민지 지식인의 현실적 무력감을 상징한다.' },
      { id: 'c3', text: '서사 구조는 의식의 흐름 기법으로 전개되며, 현실과 환상의 경계가 모호하게 처리되는 모더니즘적 특성을 보인다.' },
      { id: 'c4', text: '이상은 서구 모더니즘 기법을 식민지라는 특수한 맥락에 적용하여 독자적 문학적 성취를 이루었다.' },
      { id: 'c5', text: '아내와 나의 관계는 경제적 종속과 정서적 소외의 이중 구조이며, 가부장적 질서의 균열과 화폐 경제의 영향을 암시한다.' },
      { id: 'c6', text: '밀폐된 방은 심리적 감옥이자 식민지 현실의 축소판이고, 외출은 일시적 해방과 자아 각성의 계기이다.' },
      { id: 'c7', text: '한국 소설이 전통적 리얼리즘에서 벗어나 모더니즘적 실험을 본격 수행한 최초의 성과로 평가된다.' },
      { id: 'c8', text: '근대 도시 서울과 식민지 자본주의 일상을 섬세하게 포착하여 문학 텍스트이면서 역사적 기록으로서의 가치를 지닌다.' }
    ],
    correctOrder: ['c1','c2','c3','c4','c5','c6','c7','c8'],
    seedPenalty: 1
  };

  const confirm = {
    questions: [
      {
        id: 'q1',
        prompt: '「날개」에서 화자의 인물 설정이 상징하는 바는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p1', '식민지 지식인이 처한 현실적 무력감을 상징하며')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q2',
        prompt: '작품 제목 날개가 상징하는 의미는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p1', '억압된 존재가 자유와 해방을 향해 비상하려는 의지의 상징으로 해석되며')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q3',
        prompt: '화자의 자의식 중심 서술이 형식적으로 구현하는 바는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p2', '근대적 주체의 불안정성을 형식적 차원에서 구현한 것이라 할 수 있다.')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q4',
        prompt: '아내와 나의 관계에서 나타나는 역전이 암시하는 사회적 의미는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '당대 가부장적 질서의 균열을 암시하는 동시에')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q5',
        prompt: '밀폐된 방이라는 공간이 작품에서 수행하는 이중적 기능은 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p3', '화자의 심리적 감옥이자 식민지 현실의 축소판으로 기능하며')],
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: 'ANY'
      },
      {
        id: 'q6',
        prompt: '이 작품이 문학 텍스트 외에 지닌 또 다른 가치는 무엇인가?',
        answerRanges: [findRange(paragraphs, 'p4', '역사적 기록으로서의 가치를 지닌다.')],
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
    { idx: 6, build: buildDay6 },
    { idx: 7, build: buildDay7 },
    { idx: 8, build: buildDay8 },
    { idx: 9, build: buildDay9 },
    { idx: 10, build: buildDay10 }
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

  // items[5]~[9] 교체 (day 6~10)
  for (const { idx, content } of contents) {
    const batchIdx = idx - 1; // day 6 -> index 5
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
