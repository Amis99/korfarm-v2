// 콘텐츠 타입별 생성 함수
const { LEVEL_KR } = require('./gen-config');

// ===== PRO_READING 생성 =====
function generateReading(levelId, dayIndex, subArea, topic) {
  const paragraphs = (topic.p || topic.paragraphs).map((text, i) => ({
    id: `p${i + 1}`,
    text,
  }));

  const timeline = paragraphs.map((p, i) => ({
    stepId: `int-${i + 1}`,
    highlight: {
      ranges: [{ paragraphId: p.id, start: 0, end: Math.min(50, p.text.length) }],
    },
    question: {
      prompt: '이 부분에서 핵심 내용은?',
      choices: [
        { id: 'A', text: p.text.slice(0, 20) },
        { id: 'B', text: '해당 없음' },
        { id: 'C', text: p.text.slice(-15) },
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 15, wrongDeltaSec: -15 },
    },
  }));

  const cards = paragraphs.map((p, i) => ({
    id: `rc-${i + 1}`,
    front: p.text.slice(0, 50) + '...',
    back: p.text.slice(0, 120),
  }));

  return {
    contentType: 'PRO_READING',
    levelId,
    area: 'READING',
    subArea,
    dayIndex,
    moduleKey: 'reading_training',
    schemaVersion: '1.0',
    content: {
      contentType: 'PRO_READING',
      title: `${LEVEL_KR[levelId]} ${dayIndex}장 ${subArea} 독해`,
      targetLevel: levelId,
      area: 'READING',
      subArea,
      timeLimitSec: 300,
      seedReward: { seedType: 'seed_rice', count: 3, multiplier: 1 },
      payload: {
        passage: { paragraphs },
        intensive: { timeline },
        recall: { cards },
        confirm: { questions: [] },
      },
    },
  };
}

// ===== PRO_VOCAB 생성 =====
// 레벨별 어휘 풀
const VOCAB_POOLS = {
  FREGE_3: [
    ['논증 (論證)','근거를 들어 주장이 옳음을 밝히는 것'],
    ['전제 (前提)','어떤 결론에 이르기 위해 먼저 내세우는 조건이나 판단'],
    ['귀납 (歸納)','개별적 사례에서 일반 원리를 이끌어 내는 추론'],
    ['연역 (演繹)','일반 원리에서 구체적 결론을 이끌어 내는 추론'],
    ['유추 (類推)','유사한 점을 근거로 다른 것도 그러하리라고 미루어 짐작함'],
    ['함축 (含蓄)','겉으로 드러내지 않고 속에 담고 있는 뜻'],
    ['맥락 (脈絡)','사물이나 사건이 서로 이어져 있는 관계나 분위기'],
    ['개연성 (蓋然性)','아마 그러할 것이라고 인정되는 성질'],
    ['객관적 (客觀的)','제삼자의 입장에서 사물을 보거나 판단하는 것'],
    ['주관적 (主觀的)','자기만의 생각이나 관점에 치우쳐 판단하는 것'],
    ['타당성 (妥當性)','사리에 맞는 올바른 성질'],
    ['모순 (矛盾)','앞뒤가 서로 맞지 않음'],
    ['반론 (反論)','상대방의 의견에 반대하여 내세우는 논의'],
    ['편견 (偏見)','한쪽으로 치우친 생각이나 판단'],
    ['통찰 (洞察)','사물의 본질을 꿰뚫어 봄'],
  ],
  RUSSELL_1: [
    ['범주 (範疇)','같은 성질을 가진 부류나 영역'],
    ['추상 (抽象)','사물의 공통 성질을 뽑아내어 개념으로 만드는 것'],
    ['구체 (具體)','실제로 존재하여 형체가 있음'],
    ['본질 (本質)','사물이나 현상의 근본적인 성질'],
    ['현상 (現象)','겉으로 나타나 보이는 사물의 모양이나 상태'],
    ['인식 (認識)','사물을 분별하고 판단하여 앎'],
    ['관념 (觀念)','어떤 사물에 대하여 가지고 있는 생각'],
    ['보편 (普遍)','모든 것에 두루 미치거나 통하는 것'],
    ['특수 (特殊)','보통과 다른 독특한 것'],
    ['상대적 (相對的)','다른 것과의 관계에 의하여 성립하거나 규정되는 것'],
    ['절대적 (絕對的)','아무런 조건이나 제한이 붙지 않는 것'],
    ['합리적 (合理的)','이치에 맞는 것'],
    ['비합리적 (非合理的)','이치에 어긋나는 것'],
    ['선험적 (先驗的)','경험에 앞서 주어지는 것'],
    ['경험적 (經驗的)','실제 경험을 통하여 얻어지는 것'],
  ],
  RUSSELL_2: [
    ['패러다임 (paradigm)','한 시대의 과학자 사회가 공유하는 이론적 틀'],
    ['담론 (談論)','특정 주제에 대한 사회적 논의나 대화의 체계'],
    ['이데올로기 (ideology)','사회적·정치적 견해의 체계'],
    ['해석 (解釋)','사물이나 행위의 뜻을 밝혀 설명하는 것'],
    ['비평 (批評)','사물의 옳고 그름, 아름답고 추한 것 등을 분석하여 평가함'],
    ['서사 (敍事)','사건이나 이야기를 서술하는 방식'],
    ['수사 (修辭)','말이나 글을 아름답고 효과적으로 꾸미는 기술'],
    ['은유 (隱喩)','원관념을 감추고 보조관념만으로 표현하는 비유법'],
    ['환유 (換喩)','인접성을 바탕으로 다른 것으로 대신 나타내는 비유법'],
    ['역설 (逆說)','겉으로는 모순되나 속에 진리를 담고 있는 표현'],
    ['아이러니 (irony)','표면적 의미와 이면적 의미가 반대되는 표현'],
    ['알레고리 (allegory)','추상적 관념을 구체적 형상으로 나타내는 문학적 기법'],
    ['상징 (象徵)','추상적 의미를 구체적 사물로 나타내는 것'],
    ['모티프 (motif)','작품 속에서 반복되는 의미 있는 요소'],
    ['주제 (主題)','예술 작품에서 작가가 전달하고자 하는 중심 사상'],
  ],
  RUSSELL_3: [
    ['인과율 (因果律)','모든 사건에는 반드시 원인이 있다는 원리'],
    ['결정론 (決定論)','모든 사건이 이전 원인에 의해 필연적으로 결정된다는 견해'],
    ['자유의지 (自由意志)','외부 강제 없이 스스로 판단하고 선택하는 의지'],
    ['존재론 (存在論)','존재의 본질과 구조를 연구하는 철학 분야'],
    ['인식론 (認識論)','인간의 인식 능력과 한계를 연구하는 철학 분야'],
    ['윤리학 (倫理學)','도덕의 원리와 본질을 연구하는 학문'],
    ['형이상학 (形而上學)','경험을 초월한 존재의 근본 원리를 탐구하는 학문'],
    ['변증법 (辯證法)','모순 대립의 통일을 통해 진리에 도달하는 사고 방법'],
    ['실증주의 (實證主義)','경험적 사실과 관찰 가능한 것만을 지식으로 인정하는 입장'],
    ['상대주의 (相對主義)','모든 가치나 진리가 절대적이지 않고 상대적이라는 견해'],
    ['구조주의 (構造主義)','현상의 배후에 있는 구조를 분석하여 이해하는 방법론'],
    ['해체주의 (解體主義)','텍스트의 고정된 의미를 해체하는 비평적 접근법'],
    ['실용주의 (實用主義)','실제적 결과와 유용성을 중시하는 철학 사조'],
    ['합목적성 (合目的性)','목적에 부합하는 성질'],
    ['당위 (當爲)','마땅히 그래야 하는 것'],
  ],
};

function generateVocab(levelId, dayIndex) {
  const pool = VOCAB_POOLS[levelId] || VOCAB_POOLS.RUSSELL_1;
  // 챕터별로 다른 어휘 선택 (순환)
  const count = levelId.startsWith('FREGE') ? 15 : 15;
  const questions = [];
  for (let i = 0; i < count; i++) {
    const idx = ((dayIndex - 1) * count + i) % pool.length;
    const [word, meaning] = pool[idx];
    // 오답 3개
    const wrongIdxs = [1, 2, 3].map(j => (idx + j) % pool.length);
    const choices = [
      { id: 'A', text: meaning },
      ...wrongIdxs.map((wi, j) => ({ id: String.fromCharCode(66 + j), text: pool[wi][1] })),
    ];
    // 셔플
    const shuffled = choices.sort(() => Math.random() - 0.5);
    const correctId = shuffled.find(c => c.text === meaning).id;
    questions.push({
      id: `vq-${i + 1}`,
      type: 'MULTI_CHOICE',
      stem: `'${word}'의 뜻으로 알맞은 것은?`,
      choices: shuffled,
      answerId: correctId,
      scoring: { correctDeltaSec: 10, wrongDeltaSec: -10 },
    });
  }

  return {
    contentType: 'PRO_VOCAB',
    levelId,
    area: 'VOCAB',
    subArea: 'PRO',
    dayIndex,
    moduleKey: 'worksheet_quiz',
    schemaVersion: '1.0',
    content: {
      contentType: 'PRO_VOCAB',
      title: `${LEVEL_KR[levelId]} ${dayIndex}장 어휘`,
      targetLevel: levelId,
      area: 'VOCAB',
      subArea: 'PRO',
      timeLimitSec: 300,
      seedReward: { seedType: 'seed_wheat', count: 3, multiplier: 1 },
      payload: { questions },
    },
  };
}

// ===== PRO_BACKGROUND 생성 =====
const BG_TOPICS = {
  FREGE_2: [
    ['문장에서 주어는 동작이나 상태의 주체를 나타낸다.','O','주어는 문장에서 \"누가/무엇이\"에 해당하는 말로, 동작이나 상태의 주체입니다.'],
    ['서술어는 문장에서 주어의 행동이나 상태를 풀이하는 역할을 한다.','O','서술어는 \"어찌하다/어떠하다/무엇이다\"에 해당합니다.'],
    ['목적어 뒤에는 조사 \'이/가\'가 붙는다.','X','목적어 뒤에는 \'을/를\'이 붙습니다. \'이/가\'는 주격 조사입니다.'],
    ['부사어는 주로 서술어를 꾸며 주는 역할을 한다.','O','부사어는 서술어를 꾸며 주어 동작의 정도, 방법, 시간 등을 나타냅니다.'],
    ['관형어는 서술어를 꾸며 주는 말이다.','X','관형어는 체언(명사)을 꾸며 줍니다. 서술어를 꾸미는 것은 부사어입니다.'],
  ],
  FREGE_3: [
    ['비유적 표현에서 원관념은 실제로 나타내고자 하는 대상이다.','O','원관념은 표현하려는 실제 대상이고, 보조관념은 빗대어 표현하는 대상입니다.'],
    ['은유법은 \'~처럼\', \'~같이\' 등의 표현을 사용한다.','X','\'~처럼\', \'~같이\'를 사용하는 것은 직유법입니다. 은유법은 \"A는 B이다\"의 형태입니다.'],
    ['의인법은 사람이 아닌 것을 사람처럼 표현하는 것이다.','O','의인법은 동물, 식물, 사물 등에 사람의 행동이나 감정을 부여하는 표현입니다.'],
    ['역설은 논리적으로 모순되지만 그 속에 진리를 담고 있는 표현이다.','O','\"아무도 모르게 다 알고 있었다\"와 같은 표현이 역설의 예입니다.'],
    ['반어법과 역설은 같은 표현 기법이다.','X','반어법은 의도와 반대로 말하는 것이고, 역설은 모순 속에 진리를 담는 것으로 다릅니다.'],
  ],
  RUSSELL_1: [
    ['연역 논증에서 전제가 참이면 결론도 반드시 참이다.','O','연역 논증은 전제의 참이 결론의 참을 필연적으로 보장하는 추론입니다.'],
    ['귀납 논증의 결론은 전제에 의해 확실하게 보장된다.','X','귀납 논증의 결론은 개연적(확률적)으로만 참이며, 필연적으로 보장되지 않습니다.'],
    ['비문학 지문에서 접속어는 글의 논리적 흐름을 파악하는 단서가 된다.','O','\"따라서\", \"그러나\", \"한편\" 등의 접속어는 글의 전개 방향을 예고합니다.'],
    ['상관관계가 있으면 반드시 인과관계도 있다.','X','상관관계는 두 변수의 관련성을 보여줄 뿐, 인과관계를 증명하지는 않습니다.'],
    ['글의 전개 방식과 글의 목적은 밀접한 관련이 있다.','O','설명하려면 정의·예시를, 설득하려면 논증을 사용하는 등 목적에 따라 전개 방식이 달라집니다.'],
  ],
  RUSSELL_2: [
    ['텍스트의 의미는 독자의 해석과 무관하게 고정되어 있다.','X','수용 미학에 따르면, 텍스트의 의미는 독자의 해석을 통해 완성됩니다.'],
    ['패러다임 전환이란 기존 이론의 틀이 새로운 틀로 대체되는 것이다.','O','토마스 쿤이 제시한 개념으로, 과학 혁명의 구조를 설명합니다.'],
    ['사실 판단과 가치 판단은 같은 성격의 판단이다.','X','사실 판단은 참/거짓을 판별할 수 있지만, 가치 판단은 옳고 그름의 평가입니다.'],
    ['은유는 A를 B에 빗대어 표현하되, 비교 표지를 사용하지 않는 비유법이다.','O','은유는 \"A는 B이다\" 형태로, \'~같이\', \'~처럼\' 없이 직접 동일시합니다.'],
    ['비평은 작품의 가치를 분석하고 평가하는 활동이다.','O','비평은 단순한 감상을 넘어 체계적 분석과 판단을 포함합니다.'],
  ],
  RUSSELL_3: [
    ['결정론에 따르면 인간의 모든 행위는 이전 원인에 의해 결정된다.','O','결정론은 자유의지의 존재를 부정하거나 제한하는 철학적 입장입니다.'],
    ['실증주의는 경험으로 검증할 수 없는 명제도 지식으로 인정한다.','X','실증주의는 경험적 검증이 가능한 것만을 진정한 지식으로 인정합니다.'],
    ['변증법에서 정(正)과 반(反)의 대립은 합(合)으로 지양된다.','O','헤겔의 변증법에서 모순의 통일을 통해 더 높은 단계로 발전합니다.'],
    ['해체주의는 텍스트의 고정된 의미를 인정한다.','X','해체주의는 텍스트에 고정된 단일 의미가 있다는 전제를 거부합니다.'],
    ['상대주의는 절대적 진리의 존재를 인정하는 입장이다.','X','상대주의는 모든 진리와 가치가 맥락에 따라 달라진다고 봅니다.'],
  ],
};

function generateBackground(levelId, dayIndex) {
  const pool = BG_TOPICS[levelId] || BG_TOPICS.RUSSELL_1;
  const questions = [];
  for (let i = 0; i < 5; i++) {
    const idx = ((dayIndex - 1) * 3 + i) % pool.length;
    const [stem, answer, explanation] = pool[idx];
    questions.push({
      id: `bg-${i + 1}`,
      type: 'MULTI_CHOICE',
      stem: stem + ' ( )',
      choices: [
        { id: 'O', text: 'O (맞다)' },
        { id: 'X', text: 'X (틀리다)' },
      ],
      answerId: answer,
      explanation: explanation || '',
      scoring: { correctDeltaSec: 10, wrongDeltaSec: -10 },
    });
  }

  return {
    contentType: 'PRO_BACKGROUND',
    levelId,
    area: 'BACKGROUND',
    subArea: 'PRO',
    dayIndex,
    moduleKey: 'worksheet_quiz',
    schemaVersion: '1.0',
    content: {
      contentType: 'PRO_BACKGROUND',
      title: `${LEVEL_KR[levelId]} ${dayIndex}장 배경지식`,
      targetLevel: levelId,
      area: 'BACKGROUND',
      subArea: 'PRO',
      timeLimitSec: 300,
      seedReward: { seedType: 'seed_corn', count: 3, multiplier: 1 },
      payload: { questions },
    },
  };
}

// ===== PRO_LOGIC 생성 =====
function generateLogicSaussure(levelId, dayIndex) {
  // 소쉬르 스타일: 문장 분석 2문제
  const questions = [
    {
      id: 'lg-1',
      type: 'MULTI_CHOICE',
      stem: '* 누가/무엇이:\n* 무엇을:\n* 어떻게 하다:',
      choices: [
        { id: 'A', text: `누가: 학생이 / 무엇을: 책을 / 어떻게 하다: 읽는다` },
        { id: 'B', text: '해당 없음' },
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 15, wrongDeltaSec: -15 },
    },
    {
      id: 'lg-2',
      type: 'MULTI_CHOICE',
      stem: '* 누가/무엇이:\n* 무엇을:\n* 어떻게 하다:',
      choices: [
        { id: 'A', text: `무엇이: 바람이 / 어떻게 하다: 세차게 분다` },
        { id: 'B', text: '해당 없음' },
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 15, wrongDeltaSec: -15 },
    },
  ];

  return {
    contentType: 'PRO_LOGIC',
    levelId,
    area: 'LOGIC',
    subArea: 'PRO',
    dayIndex,
    moduleKey: 'worksheet_quiz',
    schemaVersion: '1.0',
    content: {
      contentType: 'PRO_LOGIC',
      title: `${LEVEL_KR[levelId]} ${dayIndex}장 논리사고력`,
      targetLevel: levelId,
      area: 'LOGIC',
      subArea: 'PRO',
      timeLimitSec: 300,
      seedReward: { seedType: 'seed_grape', count: 3, multiplier: 1 },
      payload: { questions },
    },
  };
}

// 프레게1/2 LOGIC: 중간 난이도 독해 문제 10개
const LOGIC_PASSAGES_FREGE = [
  { title: '언어의 힘', qs: [
    ['언어가 가진 가장 중요한 기능은 무엇인가?',['의사소통','장식','운동','수면'],'1'],
    ['말과 글의 공통점은?',['생각을 전달한다','소리가 난다','종이에 쓴다','기계로 만든다'],'1'],
    ['언어가 없다면 어떤 어려움이 생길까?',['생각 전달이 어렵다','걷기 어렵다','보기 어렵다','듣기 어렵다'],'1'],
    ['언어는 사회에서 어떤 역할을 하는가?',['사람들을 연결한다','건물을 짓는다','음식을 만든다','옷을 만든다'],'1'],
    ['다음 중 언어의 특성이 아닌 것은?',['고정불변한다','사회적이다','자의적이다','역사적이다'],'1'],
  ]},
  { title: '우리말의 특성', qs: [
    ['우리말의 어순으로 올바른 것은?',['주어-목적어-서술어','서술어-주어-목적어','목적어-서술어-주어','주어-서술어-목적어'],'1'],
    ['우리말에서 높임 표현이 발달한 이유는?',['예절을 중시하는 문화','영어의 영향','과학의 발달','지리적 요인'],'1'],
    ['다음 중 교착어의 특징은?',['조사와 어미가 발달함','단어 순서가 고정됨','성별에 따라 변함','모음이 없음'],'1'],
    ['우리말의 존대법에 해당하지 않는 것은?',['시제법','주체 높임법','상대 높임법','객체 높임법'],'1'],
    ['한글이 과학적이라고 평가받는 이유는?',['체계적인 창제 원리','오래된 역사','많은 사용자 수','아름다운 글꼴'],'1'],
  ]},
  { title: '독서의 가치', qs: [
    ['독서가 우리에게 주는 가장 큰 이점은?',['지식과 사고력 향상','시력 강화','운동 능력 향상','수면 유도'],'1'],
    ['비판적 독서란 무엇인가?',['내용을 평가하며 읽기','빨리 읽기','소리 내어 읽기','그림만 보기'],'1'],
    ['독서 후 활동으로 적절하지 않은 것은?',['책 내용을 모두 암기하기','독후감 쓰기','토론하기','내용 요약하기'],'1'],
    ['다독(多讀)의 의미는?',['많은 책을 읽는 것','한 책을 여러 번 읽는 것','빨리 읽는 것','소리 내어 읽는 것'],'1'],
    ['글의 종류에 따라 읽는 방법을 달리해야 하는 이유는?',['글의 목적과 구조가 다르기 때문','글자 크기가 다르기 때문','색깔이 다르기 때문','무게가 다르기 때문'],'1'],
  ]},
];

function generateLogicFrege(levelId, dayIndex) {
  const passageIdx = (dayIndex - 1) % LOGIC_PASSAGES_FREGE.length;
  const passage = LOGIC_PASSAGES_FREGE[passageIdx];
  const questions = passage.qs.map(([stem, choices, answerId], i) => ({
    id: `lg-${i + 1}`,
    type: 'MULTI_CHOICE',
    stem,
    choices: choices.map((text, j) => ({ id: String(j + 1), text })),
    answerId,
    scoring: { correctDeltaSec: 15, wrongDeltaSec: -15 },
  }));

  return {
    contentType: 'PRO_LOGIC',
    levelId,
    area: 'LOGIC',
    subArea: 'PRO',
    dayIndex,
    moduleKey: 'worksheet_quiz',
    schemaVersion: '1.0',
    content: {
      contentType: 'PRO_LOGIC',
      title: `${LEVEL_KR[levelId]} ${dayIndex}장 논리사고력`,
      targetLevel: levelId,
      area: 'LOGIC',
      subArea: 'PRO',
      timeLimitSec: 300,
      seedReward: { seedType: 'seed_grape', count: 3, multiplier: 1 },
      payload: { questions },
    },
  };
}

// ===== TEST 생성 =====
function generateTest(levelId, dayIndex) {
  const chId = `pch_${require('./gen-config').LEVEL_FILE[levelId]}_${String(dayIndex).padStart(2,'0')}`;
  const kr = LEVEL_KR[levelId];

  // 7개 객관식 + 3개 서술형
  const mcQuestions = [];
  const mcTemplates = [
    { stem: '다음 중 글의 중심 내용으로 가장 적절한 것은?', choices: ['주제를 요약한 내용','세부 사항만 나열','관련 없는 내용','반대 의견'], correct: '1' },
    { stem: '밑줄 친 단어의 뜻으로 가장 알맞은 것은?', choices: ['문맥에 맞는 뜻','반대의 뜻','관련 없는 뜻','비슷하지만 다른 뜻'], correct: '1' },
    { stem: '이 글의 전개 방식으로 적절한 것은?', choices: ['원인과 결과','시간 순서','공간 이동','대화 중심'], correct: '1' },
    { stem: '다음 중 글의 내용과 일치하는 것은?', choices: ['본문에 나온 사실','본문과 반대 내용','언급되지 않은 내용','과장된 내용'], correct: '1' },
    { stem: '글쓴이의 의도로 가장 적절한 것은?', choices: ['정보 전달','오락 제공','상품 판매','일기 기록'], correct: '1' },
    { stem: '빈칸에 들어갈 말로 가장 적절한 것은?', choices: ['문맥에 맞는 표현','반대 표현','무관한 표현','중복 표현'], correct: '1' },
    { stem: '이 글에서 알 수 있는 내용이 아닌 것은?', choices: ['언급되지 않은 내용','첫 문단의 내용','두번째 문단의 내용','마지막 문단의 내용'], correct: '1' },
  ];

  for (let i = 0; i < 7; i++) {
    const t = mcTemplates[i];
    mcQuestions.push({
      number: i + 1,
      type: '객관식',
      domain: '종합',
      points: 3,
      stem: t.stem,
      passage: null,
      correctAnswer: t.correct,
      choices: t.choices.map((text, j) => ({ id: String(j + 1), text })),
      choiceExplanations: { [t.correct]: '정답입니다.' },
    });
  }

  const essayTemplates = [
    { stem: '이 글의 중심 내용을 한 문장으로 요약하세요.', model: '글의 핵심 주제를 간결하게 정리한 문장', keywords: ['중심','내용','요약'] },
    { stem: '글에서 근거로 제시된 내용을 하나 찾아 쓰세요.', model: '본문에 제시된 구체적 근거', keywords: ['근거','내용','제시'] },
    { stem: '이 글의 글쓴이가 전달하고자 하는 교훈을 쓰세요.', model: '글쓴이의 핵심 메시지와 교훈', keywords: ['교훈','메시지','전달'] },
  ];

  const essayQuestions = essayTemplates.map((t, i) => ({
    number: 8 + i,
    type: '서술형',
    domain: '종합',
    points: 8,
    stem: t.stem,
    passage: null,
    correctAnswer: null,
    choiceExplanations: {},
    modelAnswer: t.model,
    essayKeywords: t.keywords.map((kw, j) => ({ keyword: kw, weight: 5 - j })),
    essayRubric: `모범답안의 핵심 키워드(${t.keywords.join(', ')})가 포함되어야 합니다. ${8 + i}번 문항은 8점 만점입니다.`,
  }));

  return {
    chapterId: chId,
    levelId,
    title: `${kr} ${dayIndex}장 테스트`,
    questions: [...mcQuestions, ...essayQuestions],
  };
}

module.exports = {
  generateReading,
  generateVocab,
  generateBackground,
  generateLogicSaussure,
  generateLogicFrege,
  generateTest,
};
