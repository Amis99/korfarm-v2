// 비트겐슈타인2 Day 81~85 콘텐츠 빌더
// 홀수 day = NONFICTION, 짝수 day = LITERATURE
// 목표: 1500자 ±50 (1450~1550), 4문단, 고1~고2 수준

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated', 'daily-batch-reading-wittgenstein2.json');
const STATIC_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'wittgenstein2');

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
  if (!para) throw new Error(`문단 ${pid}를 찾을 수 없습니다`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText.substring(0,30)}..." not found in ${pid}`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

function hashIdx(dayIndex) {
  // day_index -> 배치 파일 내 0-based index
  return dayIndex - 1;
}

function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}

function shuffleChoices(choices, correctId) {
  const correctText = choices.find(c => c.id === correctId).text;
  const arr = [...choices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const ids = ["A", "B", "C", "D"];
  let newAnswerId = "A";
  const result = arr.map((c, idx) => {
    const newId = ids[idx];
    if (c.text === correctText) newAnswerId = newId;
    return { id: newId, text: c.text };
  });
  return { choices: result, answerId: newAnswerId };
}

function buildTimeline(paragraphs, customQuestions) {
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);
    sents.forEach((sent, si) => {
      stepNum++;
      const range = { paragraphId: para.id, start: sent.start, end: sent.end };
      let question;

      // customQuestions 에서 매칭되는 질문 찾기
      const key = `p${pi}_s${si}`;
      if (customQuestions[key]) {
        question = customQuestions[key];
      } else {
        // 자동 생성: 다른 문단 문장에서 오답 추출
        const otherSents = [];
        paragraphs.forEach((op, opi) => {
          if (opi !== pi) {
            const os = findSentences(op.text);
            os.forEach(s => otherSents.push(s.text));
          }
        });
        const correctText = truncate(sent.text, 60);
        const wrongs = [];
        for (let k = 0; k < otherSents.length && wrongs.length < 3; k++) {
          const t = truncate(otherSents[k], 60);
          if (t !== correctText) wrongs.push(t);
        }
        const allChoices = [
          { id: "A", text: correctText },
          { id: "B", text: wrongs[0] || "해당 없음" },
          { id: "C", text: wrongs[1] || "해당 없음" },
          { id: "D", text: wrongs[2] || "해당 없음" }
        ];
        const shuffled = shuffleChoices(allChoices, "A");
        question = {
          prompt: "하이라이트된 문장의 내용으로 가장 적절한 것은?",
          choices: shuffled.choices,
          answerId: shuffled.answerId
        };
      }

      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [range] },
        question: {
          ...question,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    // 문단별 중심내용
    stepNum++;
    const paraRange = { paragraphId: para.id, start: 0, end: para.text.length };
    const centralKey = `central_p${pi}`;
    if (customQuestions[centralKey]) {
      const cq = customQuestions[centralKey];
      const cShuffled = shuffleChoices(cq.choices, cq.answerId);
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [paraRange] },
        question: {
          prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
          choices: cShuffled.choices,
          answerId: cShuffled.answerId,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
  });

  return timeline;
}

function buildRecallCards(paragraphs, n) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length;
  const avgLen = Math.floor(totalLen / n);
  const cards = [];
  let pos = 0;

  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      cards.push({ id: `c${i + 1}`, text: fullText.substring(pos) });
    } else {
      let target = pos + avgLen;
      let bestCut = target;
      for (let j = Math.max(pos + 50, target - 50); j < Math.min(totalLen, target + 50); j++) {
        if (fullText[j] === '.' && j + 1 < totalLen && (fullText[j + 1] === ' ' || fullText[j + 1] === '\n')) {
          bestCut = j + 1;
          break;
        }
      }
      while (bestCut < totalLen && fullText[bestCut] === ' ') bestCut++;
      cards.push({ id: `c${i + 1}`, text: fullText.substring(pos, bestCut) });
      pos = bestCut;
    }
  }
  return cards;
}

function assembleFull(dayIndex, subArea, paragraphs, timeline, cards, confirmQuestions) {
  const dayStr = String(dayIndex).padStart(3, '0');
  const subAreaKo = subArea === 'LITERATURE' ? '문학' : '비문학';
  return {
    contentId: `dr-w2-${dayStr}`,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(비트겐슈타인 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "WITTGENSTEIN_2",
    schoolGradeRange: { min: 10, max: 11 },
    area: "READING",
    subArea: subArea,
    competencies: ["READING"],
    tags: ["daily"],
    access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480,
    assets: {},
    payload: {
      passage: {
        format: "TEXT",
        paragraphs: paragraphs
      },
      intensive: { timeline },
      recall: {
        cards: cards,
        correctOrder: cards.map(c => c.id),
        seedPenalty: 1
      },
      confirm: {
        questions: confirmQuestions
      }
    }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return {
    content_type: "DAILY_READING",
    level_id: "WITTGENSTEIN_2",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content: content
  };
}

// ── Day 81: NONFICTION (비문학) ──
function buildDay81() {
  const paragraphs = [
    {
      id: "p1",
      text: "인간의 기억은 사건을 있는 그대로 저장하는 녹화 장치가 아니라, 저장과 인출 과정에서 끊임없이 재구성되는 능동적 구성 과정이다. 인지심리학자 엘리자베스 로프터스는 일련의 실험을 통해 사후 정보 효과를 밝혔는데, 이는 사건을 경험한 후에 접하는 새로운 정보가 원래의 기억을 변형시키는 현상을 가리킨다. 그녀의 대표적 실험에서 참가자들은 자동차 충돌 영상을 시청한 뒤 차량이 서로 어떻게 부딪혔느냐는 질문과 어떻게 충돌했느냐는 질문을 각각 다르게 받았는데, 충돌이라는 강한 표현을 접한 집단은 실제보다 높은 속도를 추정하고 존재하지 않던 깨진 유리를 기억했다고 보고하였다. 이 실험은 질문의 표현 방식이라는 외부 정보가 원래 기억의 내용을 실질적으로 변형시킬 수 있음을 실증적으로 입증한 것이다."
    },
    {
      id: "p2",
      text: "기억 왜곡의 메커니즘은 부호화, 저장, 인출이라는 기억의 세 단계 모두에서 작동한다. 부호화 단계에서 인간은 감각적으로 유입되는 모든 정보를 처리할 수 없으므로 선택적 주의에 의해 일부 정보만을 취사선택하며, 이 과정에서 기존의 도식이 정보 처리의 방향을 결정한다. 저장 단계에서는 시간의 경과에 따라 세부 정보가 점진적으로 소실되면서 빈 공간이 생기고, 인간은 이 공백을 자신의 추론과 기대에 부합하는 정보로 무의식적으로 채워 넣는 경향을 보인다. 인출 단계에서는 현재의 맥락, 감정 상태, 사회적 압력 등이 기억의 재구성 방향에 영향을 미치며, 특히 유도 질문이나 반복적 암시는 실제로 경험하지 않은 사건에 대한 생생한 허위 기억을 형성시킬 수 있다."
    },
    {
      id: "p3",
      text: "기억의 구성적 본질은 법적 영역에서 심각한 실질적 문제를 야기한다. 미국의 이노센스 프로젝트가 DNA 증거를 통해 무죄를 입증한 사건들을 분석한 결과, 잘못된 유죄 판결의 약 70퍼센트에서 목격자의 잘못된 기억이 핵심적 원인으로 작용한 것으로 확인되었다. 범죄 현장의 극도의 스트레스, 무기 집중 효과로 인한 범인 얼굴의 부정확한 부호화, 라인업 절차에서 수사관의 미묘한 암시 등이 복합적으로 작용하여 목격자는 자신의 기억에 대해 높은 확신을 갖지만 실제로는 부정확한 진술을 하게 된다. 이러한 발견은 목격자 증언의 신뢰성에 대한 전통적 가정에 근본적 의문을 제기하였으며, 이중 맹검 라인업 절차와 같은 제도적 개선의 필요성을 부각시켰다."
    },
    {
      id: "p4",
      text: "기억 왜곡에 대한 이해는 교육적 차원에서도 중요한 시사점을 제공한다. 학습한 내용을 정확하게 인출하는 능력은 시험과 학업 수행의 핵심이므로, 기억의 구성적 특성을 인식하고 이를 보완하는 학습 전략의 채택이 필수적이다. 시험 효과 연구에 따르면 학습 후 반복적으로 인출 연습을 하는 것이 단순 재독보다 장기 기억의 정확성과 지속성을 현저히 향상시키는데, 이는 인출 과정이 기억 흔적을 강화하고 정교화하는 기능을 수행하기 때문이다. 또한 간격 학습, 교차 연습, 정교화 질문 등의 전략은 기억의 부호화를 다층적으로 촉진하여 왜곡에 대한 저항력을 높인다. 기억이 완전무결한 기록이 아니라 재구성의 산물이라는 인식은 비판적 사고의 출발점이 되며, 자신의 기억을 과신하지 않고 객관적 증거와 교차 검증하는 태도가 지적 성숙의 핵심 요소임을 일깨워준다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 81 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 인간 기억의 본질에 대한 설명으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "저장과 인출 과정에서 끊임없이 재구성되는 능동적 구성 과정이다" },
        { id: "B", text: "감각 기관이 수용한 정보를 있는 그대로 저장하는 수동적 과정이다" },
        { id: "C", text: "뇌의 특정 영역에 불변의 형태로 보존되는 고정적 기록이다" },
        { id: "D", text: "유전적으로 결정된 용량에 따라 자동으로 처리되는 기계적 과정이다" }
      ],
      answerId: "A"
    },
    'p0_s1': {
      prompt: "하이라이트된 문장에서 사후 정보 효과의 정의로 적절한 것은?",
      choices: [
        { id: "A", text: "사건 경험 후 접하는 새로운 정보가 원래 기억을 변형시키는 현상이다" },
        { id: "B", text: "반복 학습을 통해 기억의 정확성이 점진적으로 향상되는 현상이다" },
        { id: "C", text: "강렬한 감정을 동반한 사건이 장기 기억으로 전환되는 현상이다" },
        { id: "D", text: "시간의 경과와 함께 기억이 자연적으로 소멸되는 망각 현상이다" }
      ],
      answerId: "A"
    },
    'p1_s0': {
      prompt: "하이라이트된 문장에서 기억 왜곡이 작동하는 단계로 적절한 것은?",
      choices: [
        { id: "A", text: "부호화, 저장, 인출이라는 기억의 세 단계 모두에서 작동한다" },
        { id: "B", text: "오직 인출 단계에서만 발생하는 특수한 현상이다" },
        { id: "C", text: "저장 단계에서 정보가 물리적으로 손상될 때만 나타난다" },
        { id: "D", text: "부호화 단계에서 주의력이 완전히 결핍될 때만 발생한다" }
      ],
      answerId: "A"
    },
    'p1_s3': {
      prompt: "하이라이트된 문장에서 인출 단계의 기억 왜곡 요인으로 적절하지 않은 것은?",
      choices: [
        { id: "A", text: "현재의 맥락과 감정 상태가 기억 재구성에 영향을 미친다" },
        { id: "B", text: "사회적 압력이 기억의 재구성 방향에 영향을 미친다" },
        { id: "C", text: "유도 질문이나 반복적 암시가 허위 기억을 형성시킬 수 있다" },
        { id: "D", text: "유전적 소인이 기억 인출의 정확도를 결정적으로 좌우한다" }
      ],
      answerId: "D"
    },
    'p2_s0': {
      prompt: "하이라이트된 문장에서 기억의 구성적 본질이 야기하는 법적 문제로 적절한 것은?",
      choices: [
        { id: "A", text: "법적 영역에서 심각한 실질적 문제를 야기한다" },
        { id: "B", text: "법률 조항의 해석에 혼란을 초래한다" },
        { id: "C", text: "판사의 판결 능력에 직접적 영향을 미친다" },
        { id: "D", text: "법적 절차의 비효율성을 심화시킨다" }
      ],
      answerId: "A"
    },
    'p2_s1': {
      prompt: "하이라이트된 문장에서 잘못된 유죄 판결에서 목격자 기억이 차지하는 비중은?",
      choices: [
        { id: "A", text: "약 70퍼센트에서 핵심적 원인으로 작용하였다" },
        { id: "B", text: "약 30퍼센트에서 부분적 원인으로 작용하였다" },
        { id: "C", text: "약 90퍼센트에서 유일한 원인으로 확인되었다" },
        { id: "D", text: "약 50퍼센트에서 보조적 원인으로 분류되었다" }
      ],
      answerId: "A"
    },
    'p3_s0': {
      prompt: "하이라이트된 문장에서 기억 왜곡의 이해가 제공하는 시사점의 영역으로 적절한 것은?",
      choices: [
        { id: "A", text: "교육적 차원에서 중요한 시사점을 제공한다" },
        { id: "B", text: "의료 기술의 발전에 핵심적 기여를 한다" },
        { id: "C", text: "인공지능 개발에 직접적 활용 가능성을 제시한다" },
        { id: "D", text: "경제학적 의사결정 이론의 근거를 확립한다" }
      ],
      answerId: "A"
    },
    'p3_s1': {
      prompt: "하이라이트된 문장에서 반복 인출 연습이 단순 재독보다 효과적인 이유는?",
      choices: [
        { id: "A", text: "인출 과정이 기억 흔적을 강화하고 정교화하기 때문이다" },
        { id: "B", text: "재독은 뇌에 부담을 주어 기억을 방해하기 때문이다" },
        { id: "C", text: "반복 읽기는 시각적 피로를 유발하여 집중력을 저하시키기 때문이다" },
        { id: "D", text: "인출 연습은 새로운 정보를 추가적으로 학습하게 하기 때문이다" }
      ],
      answerId: "A"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "기억의 능동적 구성 본질과 사후 정보 효과의 실험적 입증" },
        { id: "B", text: "뇌 과학의 최신 기술을 활용한 기억 저장 메커니즘의 규명" },
        { id: "C", text: "인공지능의 학습 알고리즘과 인간 기억의 유사성 비교" },
        { id: "D", text: "수면과 기억 공고화 사이의 인과관계에 대한 실험적 검증" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "부호화·저장·인출 세 단계에서 작동하는 기억 왜곡의 구체적 메커니즘" },
        { id: "B", text: "기억력을 향상시키기 위한 다양한 약물적 개입 방법의 효과" },
        { id: "C", text: "유전적 요인이 기억 능력의 개인차를 결정하는 과정의 분석" },
        { id: "D", text: "디지털 기기의 사용이 인간의 단기 기억에 미치는 부정적 영향" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "목격자 기억의 오류가 법적 판결에 미치는 영향과 제도적 개선의 필요성" },
        { id: "B", text: "범죄 예방을 위한 CCTV 기술의 발전과 사생활 침해 논란" },
        { id: "C", text: "형사 사법 제도에서 배심원의 심리적 편향이 판결에 미치는 영향" },
        { id: "D", text: "사이버 범죄의 증가에 따른 디지털 포렌식 기술의 발전 과정" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "기억의 구성적 특성을 인식한 효과적 학습 전략과 비판적 사고의 중요성" },
        { id: "B", text: "표준화된 시험 제도가 학생들의 창의성을 억압하는 구조적 문제" },
        { id: "C", text: "온라인 교육 플랫폼의 확산이 전통적 교실 수업에 미치는 영향" },
        { id: "D", text: "영재 교육 프로그램의 효과성에 대한 종단 연구의 결과 분석" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "기억의 사후 정보 효과를 밝힌 인지심리학자의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "엘리자베스 로프터스")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "부호화 단계에서 정보 처리의 방향을 결정하는 인지적 구조를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "도식")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "DNA 증거를 통해 무죄를 입증하는 활동을 수행하는 미국 조직의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "이노센스 프로젝트")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "범죄 현장에서 무기에 주의가 집중되어 범인 얼굴을 부정확하게 기억하는 현상을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p3", "무기 집중 효과")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "학습 후 반복적으로 인출 연습을 하는 것이 재독보다 효과적이라는 연구를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "시험 효과")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "기억 왜곡에 대한 저항력을 높이는 학습 전략으로 간격 학습과 함께 언급된 전략은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "교차 연습")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(81, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 82: LITERATURE (문학) ──
function buildDay82() {
  const paragraphs = [
    {
      id: "p1",
      text: "윤동주의 시 「서시」는 1941년에 창작된 것으로 추정되며, 그의 유고 시집 『하늘과 바람과 별과 시』의 서문에 해당하는 대표적인 작품이다. 죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를이라는 첫 행은 시인의 윤리적 지향을 압축적으로 선언하는 것으로, 하늘이라는 초월적 심급 앞에서 자기 삶의 도덕적 순결성을 서약하는 행위에 해당한다. 이 시의 화자는 잎새에 이는 바람에도 괴로워하는 극도로 섬세한 도덕적 감수성을 지닌 존재로서, 사소한 자연 현상에서도 자기 성찰의 계기를 발견하는 깊은 내면적 성찰 능력을 보여준다. 이러한 자기 검열적 태도는 단순한 개인적 결벽이 아니라, 일제 강점기라는 암울한 역사적 상황에서 양심을 지키려는 지식인의 실존적 결단을 반영하는 것이다."
    },
    {
      id: "p2",
      text: "「서시」에서 별, 바람, 하늘이라는 자연 이미지들은 단순한 배경이 아니라 시적 의미를 구축하는 핵심적인 상징 체계를 형성한다. 별은 화자가 추구하는 이상과 순수한 가치를 표상하는 동시에, 어둠 속에서만 빛나는 존재로서 고난의 시대에 더욱 빛나는 양심의 상징으로 기능한다. 바람은 화자의 내면을 흔드는 외적 시련이자 역사적 격동의 메타포로서, 잎새에 이는 바람이라는 표현은 미세한 현실적 압력조차 도덕적 고뇌의 대상이 됨을 보여준다. 하늘은 절대적 도덕 법칙의 상징이며 동시에 화자가 자신의 삶을 비추어 보는 거울의 역할을 수행하는데, 하늘을 우러러 한 점 부끄럼이 없기를이라는 간절한 소망은 칸트적 의미에서의 도덕적 당위에 대한 시적 표현으로 읽힐 수 있다."
    },
    {
      id: "p3",
      text: "윤동주 시의 문학사적 독특성은 저항과 서정의 결합에 있다. 같은 시기의 저항 시인들이 직접적인 항일 의지나 민족 의식을 전면에 내세운 것과 달리, 윤동주는 자기 성찰이라는 내면적 경로를 통해 시대와 대결하는 독자적인 방식을 택하였다. 그의 시에서 저항은 외부 세계를 향한 공격이 아니라 자기 내면을 향한 엄격한 윤리적 질문으로 나타나며, 이러한 내면화된 저항은 오히려 더 깊은 울림과 보편적 호소력을 획득하게 된다. 이러한 시적 전략은 그의 시가 특정 역사적 맥락을 초월하여 보편적 양심의 문학으로 읽히는 것을 가능하게 하며, 이는 윤동주의 시가 시대와 세대를 넘어 지속적으로 깊은 공감을 얻는 근본적 이유이기도 하다."
    },
    {
      id: "p4",
      text: "「서시」의 마지막 연에서 별을 노래하는 마음으로 모든 죽어가는 것을 사랑해야지라는 구절은 이 시의 윤리적 비전이 도달하는 최종적인 지향점을 보여준다. 죽어가는 것에 대한 사랑은 소멸과 유한성에 대한 수용이면서 동시에, 고통받는 모든 존재에 대한 연민과 연대의 표명이기도 하다. 별을 노래하는 마음이라는 표현은 이상을 향한 지향이 현실의 고통에 대한 외면이 아니라 오히려 고통과 직면하는 용기의 원천이 됨을 역설적으로 보여준다. 이 시가 한국 문학에서 가장 많이 암송되는 작품 중 하나로 자리 잡은 것은, 그것이 개인의 도덕적 각성과 타자에 대한 사랑이라는 보편적 인간 가치를 언어의 투명성과 정서의 깊이를 동시에 갖춘 탁월한 형식으로 구현하였기 때문이다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 82 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 「서시」의 창작 시기와 작품의 위치에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "1941년에 창작되었으며, 유고 시집의 서문에 해당하는 작품이다" },
        { id: "B", text: "해방 직후에 발표되었으며, 시인의 대표적 장편시이다" },
        { id: "C", text: "1930년대 초에 창작되었으며, 동인지에 발표된 습작시이다" },
        { id: "D", text: "일제 말기에 발표되었으며, 저항 선언문의 성격을 지닌 작품이다" }
      ],
      answerId: "A"
    },
    'p0_s3': {
      prompt: "하이라이트된 문장에서 화자의 자기 검열적 태도가 반영하는 것으로 적절한 것은?",
      choices: [
        { id: "A", text: "일제 강점기에 양심을 지키려는 지식인의 실존적 결단을 반영한다" },
        { id: "B", text: "개인적 성격의 완벽주의적 경향을 반영한다" },
        { id: "C", text: "유교적 수양론의 전통적 실천을 반영한다" },
        { id: "D", text: "문학적 기교에 대한 예술가적 집착을 반영한다" }
      ],
      answerId: "A"
    },
    'p1_s1': {
      prompt: "하이라이트된 문장에서 별이 상징하는 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "이상과 순수한 가치, 고난의 시대에 빛나는 양심을 상징한다" },
        { id: "B", text: "우주의 무한함과 인간 존재의 미미함을 표상한다" },
        { id: "C", text: "자연의 아름다움을 관조하는 시인의 심미적 태도를 나타낸다" },
        { id: "D", text: "과학적 탐구의 대상으로서의 자연을 상징한다" }
      ],
      answerId: "A"
    },
    'p1_s3': {
      prompt: "하이라이트된 문장에서 하늘이 수행하는 역할로 적절한 것은?",
      choices: [
        { id: "A", text: "절대적 도덕 법칙의 상징이며 화자의 삶을 비추는 거울 역할을 한다" },
        { id: "B", text: "자유로운 비상의 공간으로서 시인의 도피처 역할을 한다" },
        { id: "C", text: "종교적 구원의 대상으로서 화자의 기도를 수용하는 역할을 한다" },
        { id: "D", text: "계절의 순환을 보여주는 자연 현상의 무대 역할을 한다" }
      ],
      answerId: "A"
    },
    'p2_s0': {
      prompt: "하이라이트된 문장에서 윤동주 시의 문학사적 독특성으로 제시된 것은?",
      choices: [
        { id: "A", text: "저항과 서정의 결합에 있다" },
        { id: "B", text: "모더니즘적 형식 실험에 있다" },
        { id: "C", text: "민중 언어의 문학적 형상화에 있다" },
        { id: "D", text: "서사적 구조의 시적 전환에 있다" }
      ],
      answerId: "A"
    },
    'p2_s2': {
      prompt: "하이라이트된 문장에서 윤동주 시에 나타나는 저항의 방식으로 적절한 것은?",
      choices: [
        { id: "A", text: "자기 내면을 향한 엄격한 윤리적 질문으로 나타난다" },
        { id: "B", text: "일제에 대한 직접적이고 전투적인 구호로 표현된다" },
        { id: "C", text: "민족 공동체의 결속을 호소하는 선동적 어조로 나타난다" },
        { id: "D", text: "식민지 체제의 구조적 모순을 분석하는 논증적 방식으로 표현된다" }
      ],
      answerId: "A"
    },
    'p3_s0': {
      prompt: "하이라이트된 문장에서 '죽어가는 것을 사랑해야지'가 의미하는 바로 적절한 것은?",
      choices: [
        { id: "A", text: "소멸에 대한 수용과 고통받는 모든 존재에 대한 연민의 표명이다" },
        { id: "B", text: "생명의 유한성을 부정하고 영원한 삶을 추구하는 의지의 표현이다" },
        { id: "C", text: "현실 세계를 떠나 내세의 구원을 바라는 종교적 신앙의 고백이다" },
        { id: "D", text: "자연의 순환적 질서에 순응하려는 도가적 태도의 표출이다" }
      ],
      answerId: "A"
    },
    'p3_s3': {
      prompt: "하이라이트된 문장에서 「서시」가 가장 많이 암송되는 작품이 된 근본적 이유는?",
      choices: [
        { id: "A", text: "보편적 인간 가치를 언어의 투명성과 정서의 깊이로 구현했기 때문이다" },
        { id: "B", text: "시의 길이가 짧아 암기하기 용이했기 때문이다" },
        { id: "C", text: "교과서에 수록되어 학교 교육에서 반복적으로 학습되었기 때문이다" },
        { id: "D", text: "시인의 비극적 생애가 대중의 동정심을 불러일으켰기 때문이다" }
      ],
      answerId: "A"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "「서시」의 창작 배경과 화자의 윤리적 지향 및 도덕적 감수성" },
        { id: "B", text: "일제 강점기 저항 시인들의 문학적 활동과 사회적 영향" },
        { id: "C", text: "한국 현대시의 형식적 발전 과정과 자유시의 정착" },
        { id: "D", text: "1940년대 한국 문단의 문학적 지형도와 주요 동인지 활동" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "별·바람·하늘의 자연 이미지가 구축하는 상징 체계와 시적 의미" },
        { id: "B", text: "한국 시에 나타나는 자연 친화적 세계관의 역사적 변천 과정" },
        { id: "C", text: "독일 관념론 철학이 한국 근대시에 미친 사상적 영향" },
        { id: "D", text: "서양 상징주의 시론의 수용과 한국적 변용의 양상" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "내면적 자기 성찰을 통한 저항이라는 윤동주 시의 독자적 방식과 보편적 호소력" },
        { id: "B", text: "해방 이후 한국 시단에서 저항시의 전통이 계승되는 양상" },
        { id: "C", text: "1920년대 낭만주의 시 운동과 감상적 서정의 특징" },
        { id: "D", text: "프랑스 실존주의 문학이 한국 현대시에 미친 영향의 분석" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "죽어가는 것에 대한 사랑이라는 윤리적 비전과 작품의 영속적 감동의 근거" },
        { id: "B", text: "한국 현대시에서 죽음의 모티프가 변주되는 다양한 양상" },
        { id: "C", text: "시적 화자의 자전적 요소와 작가의 실제 삶 사이의 관계" },
        { id: "D", text: "한국 시의 음악성과 율격 구조에 대한 형식적 분석" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "「서시」가 수록된 윤동주의 유고 시집의 제목은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "하늘과 바람과 별과 시")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "화자가 사소한 자연 현상에서도 괴로움을 느끼는 구절의 표현은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "잎새에 이는 바람")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "하늘을 우러러본다는 소망이 칸트적 의미에서 무엇에 대한 시적 표현으로 읽힐 수 있는가?",
      answerRanges: [findRange(paragraphs, "p2", "도덕적 당위")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "윤동주 시의 문학사적 독특성으로 제시된 결합의 두 요소는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "저항과 서정")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "시의 마지막 연에서 화자가 사랑하겠다고 선언하는 대상은 어떤 존재인가?",
      answerRanges: [findRange(paragraphs, "p4", "죽어가는 것")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이 시가 지속적으로 공감을 얻는 근본적 이유로 제시된 형식적 특징 두 가지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "언어의 투명성과 정서의 깊이")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(82, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 83: NONFICTION (비문학) ──
function buildDay83() {
  const paragraphs = [
    {
      id: "p1",
      text: "플라시보 효과란 약리학적으로 유효한 성분이 전혀 포함되지 않은 가짜 약을 투여받은 환자가 실제로 증상이 호전되는 현상을 가리킨다. 이 현상은 오랫동안 환자의 주관적 착각이나 자연 회복의 결과로 치부되어 왔으나, 현대 신경과학의 발전에 의해 그 생물학적 실체가 구체적으로 규명되기 시작하였다. 기능적 자기공명영상 연구에 의하면 플라시보를 투여받은 환자의 뇌에서는 전대상피질과 전전두엽 피질의 활성화가 관찰되며, 이 영역들은 통증 조절과 보상 기대에 관여하는 것으로 알려져 있다. 또한 플라시보 진통 효과가 나타날 때 내인성 오피오이드 시스템이 활성화된다는 사실이 밝혀지면서, 플라시보 효과가 순전한 심리적 현상이 아닌 측정 가능한 신경화학적 변화를 수반하는 현상임이 입증되었다."
    },
    {
      id: "p2",
      text: "플라시보 효과의 강도는 여러 맥락적 요인에 의해 체계적으로 달라진다. 약의 형태에 따른 효과 차이가 대표적인데, 알약보다 주사가, 주사보다 수술적 절차가 더 강한 플라시보 효과를 유발하는 것으로 보고되어 있다. 약의 색상도 영향을 미쳐 빨간색 알약은 각성과 통증 완화에, 파란색 알약은 진정과 수면 유도에 더 효과적인 경향을 보인다. 의사와 환자 사이의 치료적 관계의 질 역시 핵심적 요인으로, 의사가 따뜻하고 공감적인 태도로 치료에 대한 긍정적 기대를 심어줄 때 플라시보 효과는 현저히 증가한다. 이러한 발견들은 플라시보 효과가 단순한 속임수의 결과가 아니라, 인간의 기대와 신념 체계가 생리적 과정에 실질적으로 개입하는 정신신체적 상호작용의 메커니즘임을 보여준다."
    },
    {
      id: "p3",
      text: "플라시보 효과의 반대 현상인 노시보 효과도 임상적으로 중요한 의미를 지닌다. 노시보 효과란 치료에 대한 부정적 기대가 실제로 부작용을 유발하거나 증상을 악화시키는 현상으로, 약의 부작용에 대한 사전 설명이 해당 부작용의 발생률을 유의미하게 높인다는 연구 결과가 이를 뒷받침한다. 예를 들어, 동일한 성분의 약을 투여하면서 한 집단에는 두통이 발생할 수 있다고 안내하고 다른 집단에는 안내하지 않았을 때, 전자의 집단에서 두통 보고가 유의미하게 증가하는 현상이 반복적으로 관찰된다. 이는 의학적 고지의 방식이 치료 결과에 직접적 영향을 미칠 수 있음을 시사하며, 의료 윤리에서 고지된 동의의 구체적 실행 방식에 대한 재검토의 필요성을 제기한다."
    },
    {
      id: "p4",
      text: "플라시보 효과에 대한 현대적 이해는 의학의 근본적 패러다임에 도전적 질문을 제기한다. 전통적으로 의학은 약물의 약리학적 효과와 플라시보 효과를 엄격히 분리하여 전자만을 진정한 치료 효과로 인정해 왔으나, 실제 임상 현장에서 환자가 경험하는 치료 효과는 약물의 약리 작용, 자연 회복, 그리고 플라시보 효과가 복합적으로 작용한 결과이다. 최근에는 환자에게 플라시보임을 공개적으로 알린 후에도 치료 효과가 나타나는 개방형 플라시보 연구가 주목받고 있는데, 이는 속임수 없이도 기대와 조건화의 메커니즘이 작동할 수 있음을 시사한다. 플라시보 효과의 연구는 궁극적으로 마음과 몸의 관계에 대한 과학적 이해를 심화시키며, 환자 중심 의료의 이론적 근거를 제공함으로써 치료의 개념 자체를 약물 투여를 넘어 전인적 돌봄으로 확장하는 데 기여하고 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 83 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 플라시보 효과의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "유효 성분이 없는 가짜 약을 투여받은 환자가 실제로 증상이 호전되는 현상이다" },
        { id: "B", text: "약물의 과다 복용으로 인해 예상치 못한 부작용이 발생하는 현상이다" },
        { id: "C", text: "환자가 치료를 거부하면서도 자연적으로 치유되는 현상이다" },
        { id: "D", text: "의사의 진단이 잘못되었음에도 환자가 호전되는 의학적 오류이다" }
      ],
      answerId: "A"
    },
    'p0_s2': {
      prompt: "하이라이트된 문장에서 플라시보 투여 시 활성화되는 뇌 영역으로 언급된 것은?",
      choices: [
        { id: "A", text: "전대상피질과 전전두엽 피질이 활성화된다" },
        { id: "B", text: "해마와 편도체가 주로 활성화된다" },
        { id: "C", text: "소뇌와 뇌간의 운동 조절 영역이 활성화된다" },
        { id: "D", text: "측두엽의 언어 처리 영역이 활성화된다" }
      ],
      answerId: "A"
    },
    'p1_s1': {
      prompt: "하이라이트된 문장에서 약의 형태에 따른 플라시보 효과의 강도 차이로 적절한 것은?",
      choices: [
        { id: "A", text: "알약보다 주사가, 주사보다 수술적 절차가 더 강한 효과를 유발한다" },
        { id: "B", text: "주사보다 알약이, 알약보다 외용제가 더 강한 효과를 유발한다" },
        { id: "C", text: "모든 형태의 약이 동일한 수준의 플라시보 효과를 나타낸다" },
        { id: "D", text: "수술적 절차는 플라시보 효과와 무관한 것으로 확인되었다" }
      ],
      answerId: "A"
    },
    'p1_s4': {
      prompt: "하이라이트된 문장에서 플라시보 효과의 본질에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "인간의 기대와 신념 체계가 생리적 과정에 실질적으로 개입하는 메커니즘이다" },
        { id: "B", text: "환자의 의지력이 질병을 극복하는 초자연적 현상이다" },
        { id: "C", text: "의사의 권위에 의한 심리적 압박이 환자를 순응시키는 현상이다" },
        { id: "D", text: "약물 성분이 미량이라도 포함되어 있어 발생하는 약리적 효과이다" }
      ],
      answerId: "A"
    },
    'p2_s0': {
      prompt: "하이라이트된 문장에서 노시보 효과의 정의로 적절한 것은?",
      choices: [
        { id: "A", text: "부정적 기대가 실제로 부작용을 유발하거나 증상을 악화시키는 현상이다" },
        { id: "B", text: "약물의 유효 성분이 환자에게 해로운 영향을 미치는 현상이다" },
        { id: "C", text: "치료를 중단한 후에 반동적으로 증상이 악화되는 현상이다" },
        { id: "D", text: "여러 약물을 동시에 복용할 때 상호작용으로 부작용이 발생하는 현상이다" }
      ],
      answerId: "A"
    },
    'p2_s3': {
      prompt: "하이라이트된 문장에서 노시보 효과 연구가 제기하는 의료 윤리적 과제는?",
      choices: [
        { id: "A", text: "고지된 동의의 구체적 실행 방식에 대한 재검토의 필요성이다" },
        { id: "B", text: "임상 시험에서 대조군 설정의 윤리적 정당성에 대한 논의이다" },
        { id: "C", text: "의사의 치료 거부권에 대한 법적 보장의 필요성이다" },
        { id: "D", text: "환자 정보 보호를 위한 전자 의무 기록 시스템의 보안 강화이다" }
      ],
      answerId: "A"
    },
    'p3_s2': {
      prompt: "하이라이트된 문장에서 개방형 플라시보 연구가 시사하는 바로 적절한 것은?",
      choices: [
        { id: "A", text: "속임수 없이도 기대와 조건화의 메커니즘이 작동할 수 있다" },
        { id: "B", text: "환자에게 진실을 알리면 플라시보 효과가 완전히 사라진다" },
        { id: "C", text: "플라시보 효과는 오직 기만적 상황에서만 발생한다" },
        { id: "D", text: "개방형 투여는 약물의 약리적 효과를 증강시킨다" }
      ],
      answerId: "A"
    },
    'p3_s3': {
      prompt: "하이라이트된 문장에서 플라시보 연구가 기여하는 궁극적 방향으로 적절한 것은?",
      choices: [
        { id: "A", text: "치료 개념을 약물 투여를 넘어 전인적 돌봄으로 확장하는 것이다" },
        { id: "B", text: "모든 약물 치료를 플라시보로 대체하는 것이다" },
        { id: "C", text: "의학 연구에서 이중 맹검 실험을 폐지하는 것이다" },
        { id: "D", text: "환자의 심리적 상태를 무시하고 생물학적 치료에만 집중하는 것이다" }
      ],
      answerId: "A"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "플라시보 효과의 정의와 신경과학적 연구를 통한 생물학적 실체의 규명" },
        { id: "B", text: "신약 개발의 임상 시험 단계와 각 단계별 검증 절차의 구체적 과정" },
        { id: "C", text: "인간 뇌의 구조와 기능에 대한 신경해부학적 지식의 발전 과정" },
        { id: "D", text: "만성 통증 환자를 위한 약물 치료와 비약물 치료의 효과 비교" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "약의 형태·색상·의사-환자 관계 등 맥락적 요인이 플라시보 효과 강도에 미치는 영향" },
        { id: "B", text: "제약 산업에서 약물 디자인이 소비자의 구매 행동에 미치는 마케팅적 효과" },
        { id: "C", text: "동양 의학과 서양 의학의 치료 철학에 대한 비교 문화적 분석" },
        { id: "D", text: "환자 만족도 조사의 방법론적 한계와 의료 질 평가의 대안적 지표" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "노시보 효과의 정의 및 의학적 고지 방식이 치료 결과에 미치는 영향" },
        { id: "B", text: "약물 부작용의 분류 체계와 이상반응 보고 시스템의 운영 방식" },
        { id: "C", text: "환자 자율성의 원칙과 의료 가부장주의 사이의 윤리적 긴장 관계" },
        { id: "D", text: "정신 건강 영역에서 인지행동치료의 효과와 적용 범위의 확대" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "개방형 플라시보 연구의 의의와 전인적 돌봄으로의 치료 개념 확장" },
        { id: "B", text: "근거 중심 의학의 발전 과정과 체계적 문헌 고찰의 방법론적 기준" },
        { id: "C", text: "대체 의학의 과학적 검증과 제도권 의학과의 통합 가능성 탐색" },
        { id: "D", text: "인공지능을 활용한 신약 후보 물질 탐색의 최신 연구 동향" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "플라시보 투여 시 활성화되는 내인성 통증 조절 시스템의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "오피오이드")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "빨간색 알약이 효과적인 경향을 보이는 두 가지 영역은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "각성과 통증 완화")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "플라시보 효과의 반대 현상을 가리키는 용어는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "노시보 효과")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "노시보 효과 연구가 재검토의 필요성을 제기한 의료 윤리 개념은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "고지된 동의")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "환자에게 플라시보임을 공개적으로 알린 후에도 효과가 나타나는 연구를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "개방형 플라시보")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "플라시보 연구가 확장하려는 치료 개념의 방향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "전인적 돌봄")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(83, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 84: LITERATURE (문학) ──
function buildDay84() {
  const paragraphs = [
    {
      id: "p1",
      text: "황순원의 단편소설 「소나기」는 1953년에 발표된 작품으로, 시골 소년과 도시에서 온 소녀의 짧고 순수한 만남과 이별을 서정적 산문으로 형상화한 한국 단편문학의 고전이다. 이 작품에서 서술자는 소년의 시선에 밀착하여 사건을 전달하되, 소년의 내면을 직접적으로 설명하지 않고 행동과 감각적 묘사를 통해 간접적으로 드러내는 절제된 서술 전략을 구사한다. 개울가에서 처음 소녀를 만나는 장면에서 소년은 소녀가 물속에 비친 자기 그림자를 들여다보다가 물을 움켜쥐는 모습을 목격하는데, 이 시각적 이미지는 소년의 의식 속에 강렬한 인상으로 각인된다. 이후 소년이 소녀에게 이끌리면서도 직접적 표현을 회피하는 태도는 사춘기 이전의 순수한 감정이 언어화되기 이전의 상태에 머무는 것을 사실적으로 포착한 것이다."
    },
    {
      id: "p2",
      text: "작품의 제목이자 핵심적 사건인 소나기는 소년과 소녀의 관계를 변화시키는 결정적 전환점이자 작품 전체의 의미를 응축하는 상징적 장치이다. 갑작스럽게 쏟아지는 소나기에 의해 두 아이는 원두막 아래로 피신하게 되고, 이 공간적 근접은 신체적 접촉이라는 관계의 도약을 자연스럽게 유도한다. 소나기가 쏟아지는 동안 소녀의 체온과 소년의 떨림이 겹쳐지는 장면은 이 작품에서 감정적 강도가 가장 높은 순간으로, 언어적 소통 없이 신체적 감각만으로 교감이 이루어지는 전언어적 친밀성의 순간을 포착하고 있다. 소나기라는 자연 현상의 갑작스러움과 일시성은 두 인물의 만남 자체가 지닌 우연적이고 비영속적인 성격을 반영하며, 소나기가 그친 뒤의 맑은 하늘은 감정의 고조 이후 찾아오는 일상으로의 복귀와 상실의 예감을 동시에 내포한다."
    },
    {
      id: "p3",
      text: "「소나기」의 결말에서 소녀의 죽음은 직접적으로 서술되지 않고 소녀 어머니의 말을 통해 간접적으로 전달된다. 소녀가 자신이 입던 옷을 그대로 입혀서 묻어 달라고 했다는 유언은 소나기를 맞으며 소년과 함께한 경험이 소녀에게 삶에서 가장 소중한 순간이었음을 암시하며, 이 간접적 전달 방식은 독자에게 감정적 충격을 극대화하는 서사적 효과를 발휘한다. 작가 황순원은 죽음이라는 무거운 주제를 최소한의 언어로 처리함으로써 오히려 그 정서적 무게를 증폭시키는 생략의 미학을 구현하였다. 이 결말은 순수한 감정이 영원히 보존될 수 있는 유일한 방법이 역설적으로 그 감정의 주체가 소멸하는 것이라는 비극적 아이러니를 담고 있으며, 이는 「소나기」가 단순한 성장 소설을 넘어서는 존재론적 깊이를 획득하는 지점이다."
    },
    {
      id: "p4",
      text: "「소나기」의 문학사적 가치는 한국어 산문의 서정적 가능성을 극한까지 탐구한 데 있다. 황순원의 문장은 군더더기 없는 간결함과 감각적 이미지의 선명함을 동시에 갖추고 있으며, 모든 문장이 전체 서사의 유기적 구조 속에서 필연적 위치를 점하는 정밀한 구성을 보여준다. 들국화, 도라지꽃, 메밀꽃 등 토속적 자연물의 정교한 배치는 계절의 진행과 감정의 변화를 동시에 표현하는 이중 기능을 수행하며, 이는 자연과 인간 감정의 유기적 일체성을 형식적 차원에서 구현한 것이다. 이 작품이 수십 년에 걸쳐 교과서에 수록되며 세대를 초월한 공감을 얻어온 것은 사춘기의 순수한 감정과 그 상실이라는 보편적 주제를 한국적 자연 풍광 속에 완벽하게 융합시킨 예술적 성취에 기인한다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 84 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 「소나기」의 문학사적 위치에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "순수한 만남과 이별을 서정적 산문으로 형상화한 한국 단편문학의 고전이다" },
        { id: "B", text: "전쟁의 비극을 사실적으로 재현한 한국 전쟁 문학의 대표작이다" },
        { id: "C", text: "농촌 근대화의 갈등을 그린 한국 농촌 소설의 시발점이다" },
        { id: "D", text: "도시 빈민의 삶을 고발한 한국 사회 비판 소설의 전형이다" }
      ],
      answerId: "A"
    },
    'p0_s1': {
      prompt: "하이라이트된 문장에서 이 작품의 서술 전략으로 적절한 것은?",
      choices: [
        { id: "A", text: "소년의 내면을 행동과 감각적 묘사를 통해 간접적으로 드러내는 절제된 방식이다" },
        { id: "B", text: "전지적 서술자가 모든 인물의 내면을 직접 설명하는 방식이다" },
        { id: "C", text: "소녀의 관점에서 사건을 회상하는 1인칭 고백체 방식이다" },
        { id: "D", text: "여러 인물의 시점이 교차하는 다시점 서술 방식이다" }
      ],
      answerId: "A"
    },
    'p1_s0': {
      prompt: "하이라이트된 문장에서 소나기가 작품에서 수행하는 기능으로 적절한 것은?",
      choices: [
        { id: "A", text: "관계의 전환점이자 작품 전체의 의미를 응축하는 상징적 장치이다" },
        { id: "B", text: "두 인물 사이의 갈등을 야기하는 외적 장애물이다" },
        { id: "C", text: "시간의 흐름을 표시하는 서사적 지표에 불과하다" },
        { id: "D", text: "농경 사회의 자연 의존성을 보여주는 배경적 요소이다" }
      ],
      answerId: "A"
    },
    'p1_s2': {
      prompt: "하이라이트된 문장에서 소나기 장면이 포착하는 교감의 특성으로 적절한 것은?",
      choices: [
        { id: "A", text: "언어적 소통 없이 신체적 감각만으로 이루어지는 전언어적 친밀성이다" },
        { id: "B", text: "깊은 대화를 통해 서로의 내면을 이해하는 지적 교감이다" },
        { id: "C", text: "공동 작업을 통해 형성되는 협력적 유대이다" },
        { id: "D", text: "편지를 주고받으며 형성되는 문학적 교감이다" }
      ],
      answerId: "A"
    },
    'p2_s1': {
      prompt: "하이라이트된 문장에서 소녀의 유언이 암시하는 바로 적절한 것은?",
      choices: [
        { id: "A", text: "소나기를 맞으며 소년과 함께한 순간이 삶에서 가장 소중한 경험이었음을 암시한다" },
        { id: "B", text: "소녀가 자신의 죽음을 미리 예감하고 있었음을 보여준다" },
        { id: "C", text: "소녀가 소년에게 원망의 감정을 품고 있었음을 드러낸다" },
        { id: "D", text: "당시 농촌 사회의 장례 풍습을 사실적으로 반영한 것이다" }
      ],
      answerId: "A"
    },
    'p2_s2': {
      prompt: "하이라이트된 문장에서 황순원이 구현한 서술 미학의 핵심은 무엇인가?",
      choices: [
        { id: "A", text: "최소한의 언어로 정서적 무게를 증폭시키는 생략의 미학이다" },
        { id: "B", text: "화려한 수사를 통해 감정의 강도를 극대화하는 과장의 미학이다" },
        { id: "C", text: "사건의 전말을 빠짐없이 서술하는 완결의 미학이다" },
        { id: "D", text: "독자의 상상력을 차단하는 설명의 미학이다" }
      ],
      answerId: "A"
    },
    'p3_s0': {
      prompt: "하이라이트된 문장에서 「소나기」의 문학사적 가치로 제시된 것은?",
      choices: [
        { id: "A", text: "한국어 산문의 서정적 가능성을 극한까지 탐구한 데 있다" },
        { id: "B", text: "한국 소설에서 최초로 의식의 흐름 기법을 시도한 데 있다" },
        { id: "C", text: "한국 문학에서 사회 비판적 리얼리즘을 정립한 데 있다" },
        { id: "D", text: "한국 소설의 분량적 한계를 넘어선 대하소설의 가능성을 연 데 있다" }
      ],
      answerId: "A"
    },
    'p3_s3': {
      prompt: "하이라이트된 문장에서 이 작품이 세대를 초월한 공감을 얻은 이유로 적절한 것은?",
      choices: [
        { id: "A", text: "순수한 감정과 그 상실이라는 보편적 주제를 한국적 풍광에 융합시켰기 때문이다" },
        { id: "B", text: "역사적 사건을 정확하게 기록하여 교육적 가치를 인정받았기 때문이다" },
        { id: "C", text: "독자에게 명확한 교훈을 제시하는 교훈 소설의 전형이기 때문이다" },
        { id: "D", text: "복잡한 서사 구조가 독자의 지적 호기심을 자극하기 때문이다" }
      ],
      answerId: "A"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "소년의 시선에 밀착한 절제된 서술과 사춘기 이전 순수한 감정의 사실적 포착" },
        { id: "B", text: "한국 전쟁이 농촌 공동체에 미친 사회적 영향의 문학적 재현" },
        { id: "C", text: "1950년대 한국 단편소설의 다양한 서술 기법에 대한 형식적 분석" },
        { id: "D", text: "황순원 문학 세계의 전체적 변천 과정과 각 시기별 대표작 분석" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "소나기의 상징적 의미와 전언어적 친밀성의 순간 포착, 만남의 비영속성" },
        { id: "B", text: "한국 문학에서 기상 현상이 서사에 활용되는 다양한 사례 분석" },
        { id: "C", text: "아동 문학과 성인 문학의 경계에 위치한 작품의 장르적 정체성" },
        { id: "D", text: "한국 농촌의 계절적 변화가 소설의 배경으로 기능하는 양상" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "소녀 죽음의 간접적 전달 방식과 생략의 미학, 순수 감정의 역설적 보존" },
        { id: "B", text: "한국 소설에서 죽음의 모티프가 시대별로 변주되는 양상 분석" },
        { id: "C", text: "소설 결말의 유형 분류와 각 유형이 독자에게 미치는 심리적 효과" },
        { id: "D", text: "비극적 서사의 구조적 특징과 고전 비극과의 비교 문학적 분석" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "간결한 문장과 자연물 배치의 이중 기능, 한국적 풍광과 보편적 주제의 융합" },
        { id: "B", text: "한국 교과서 선정 문학 작품의 역사적 변천과 선정 기준의 변화" },
        { id: "C", text: "한국 현대 소설에서 자연 묘사의 기법적 발전 과정에 대한 통시적 분석" },
        { id: "D", text: "서정시와 서사 산문의 장르적 융합이 현대 문학에서 시도된 다양한 사례" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "소년이 처음 소녀를 만난 장소는 어디인가?",
      answerRanges: [findRange(paragraphs, "p1", "개울가")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "소나기를 피해 두 아이가 대피한 장소는 어디인가?",
      answerRanges: [findRange(paragraphs, "p2", "원두막")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "소녀의 유언에서 자신이 입던 옷에 대해 어떤 요청을 했는가?",
      answerRanges: [findRange(paragraphs, "p3", "그대로 입혀서 묻어 달라")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "황순원이 이 작품에서 구현한 서술 미학을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p3", "생략의 미학")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "작품에서 계절의 진행과 감정의 변화를 동시에 표현하는 자연물로 언급된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "들국화")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "자연과 인간 감정의 관계를 표현하기 위해 황순원이 형식적으로 구현한 개념은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "유기적 일체성")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(84, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 85: NONFICTION (비문학) ──
function buildDay85() {
  const paragraphs = [
    {
      id: "p1",
      text: "행동경제학은 인간이 전통적 경제학에서 가정하는 합리적 경제인 모형과는 달리 체계적인 인지적 편향에 의해 비합리적 의사결정을 내린다는 것을 실증적으로 규명하는 학문 분야이다. 이 분야의 개척자인 대니얼 카너먼과 아모스 트버스키는 전망 이론을 통해 인간이 동일한 크기의 이익과 손실을 비대칭적으로 평가한다는 사실을 밝혔다. 구체적으로 손실이 주는 심리적 고통은 동일한 크기의 이익이 주는 만족감의 약 두 배에 달하는데, 이를 손실 회피라 한다. 이러한 손실 회피 성향은 투자자들이 손실이 발생한 주식은 팔지 못하고 계속 보유하면서 이익이 발생한 주식은 조기에 매도하는 처분 효과로 나타나며, 이는 합리적 투자 행동의 관점에서 명백히 비효율적인 패턴이다."
    },
    {
      id: "p2",
      text: "인간의 의사결정에서 나타나는 또 다른 체계적 편향으로 앵커링 효과가 있다. 앵커링 효과란 의사결정 과정에서 처음 접한 정보가 닻과 같이 고정되어 이후의 판단을 그 기준점으로부터의 불충분한 조정에 그치게 만드는 현상을 가리킨다. 카너먼과 트버스키의 실험에서 참가자들에게 룰렛으로 나온 임의의 숫자를 보여준 후 아프리카 국가들의 UN 가입 비율을 추정하게 하였더니, 높은 숫자를 본 집단은 유의미하게 높은 추정치를 제시하였다. 앵커링 효과는 부동산 가격 협상, 연봉 협상, 법정 배상액 결정 등 실제 의사결정 상황에서도 강력하게 작동하는 것으로 확인되어 있으며, 전문가라 하더라도 이 편향에서 자유롭지 못하다는 연구 결과가 다수 보고되어 있다."
    },
    {
      id: "p3",
      text: "행동경제학의 실천적 응용 가운데 가장 주목받는 분야는 넛지 이론이다. 리처드 탈러와 캐스 선스타인이 제안한 넛지란 선택의 자유를 제한하지 않으면서도 사람들이 더 나은 의사결정을 하도록 선택 구조를 설계하는 것을 의미한다. 대표적 사례로 퇴직연금 가입을 기본 옵션으로 설정하는 자동 가입 제도가 있는데, 이 제도는 현상 유지 편향을 활용하여 직원들이 별도의 행동을 취하지 않아도 자동으로 연금에 가입되게 함으로써 노후 대비율을 극적으로 향상시켰다. 또한 카페테리아에서 건강한 음식을 눈높이에 배치하고 기름진 음식을 후방에 배치하는 선택 설계도 넛지의 실례로, 이는 직접적 금지나 경제적 인센티브 없이도 건강한 식습관을 유도하는 방식이다."
    },
    {
      id: "p4",
      text: "행동경제학에 대한 비판도 존재한다. 일부 학자들은 실험실에서 관찰된 인지적 편향이 실제 시장 환경에서는 경험과 학습에 의해 상당 부분 교정될 수 있으므로 그 현실적 중요성이 과대평가되어 있다고 주장한다. 넛지에 대해서는 정부나 기업이 개인의 선택을 특정 방향으로 유도하는 것이 자유주의적 가부장주의라는 비판이 제기되며, 누가 무엇이 더 나은 선택인지를 결정할 권한을 가지는가라는 근본적 질문이 따라붙는다. 그럼에도 불구하고 행동경제학은 인간의 의사결정이 맥락과 프레이밍에 의해 체계적으로 영향받는다는 사실을 명확히 드러냄으로써, 정책 설계와 제도 구축에서 인간 행동의 실질적 양상을 반영해야 한다는 중요한 교훈을 제공하고 있다. 이 분야는 경제학, 심리학, 공공정책학의 경계를 가로지르며 인간 행동에 대한 더욱 현실적이고 정교한 이해를 추구하는 학제적 연구의 모범을 보여주고 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 85 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 행동경제학이 규명하는 핵심 내용으로 적절한 것은?",
      choices: [
        { id: "A", text: "인간이 체계적 인지적 편향에 의해 비합리적 의사결정을 내린다는 것이다" },
        { id: "B", text: "시장 경제가 자연적으로 균형 상태에 도달한다는 것이다" },
        { id: "C", text: "인간의 경제 행위는 완전히 무작위적이라는 것이다" },
        { id: "D", text: "합리적 경제인 모형이 현실을 정확히 설명한다는 것이다" }
      ],
      answerId: "A"
    },
    'p0_s2': {
      prompt: "하이라이트된 문장에서 손실 회피의 구체적 비율로 적절한 것은?",
      choices: [
        { id: "A", text: "손실의 심리적 고통이 동일 크기 이익의 만족감의 약 두 배에 달한다" },
        { id: "B", text: "이익의 만족감이 손실의 고통보다 세 배 이상 크다" },
        { id: "C", text: "이익과 손실에 대한 심리적 반응은 동일한 크기이다" },
        { id: "D", text: "손실에 대한 반응은 이익에 대한 반응의 절반 수준이다" }
      ],
      answerId: "A"
    },
    'p1_s0': {
      prompt: "하이라이트된 문장에서 앵커링 효과 외에 또 다른 체계적 편향으로 언급하는 대상은?",
      choices: [
        { id: "A", text: "앵커링 효과를 인간 의사결정의 또 다른 체계적 편향으로 소개한다" },
        { id: "B", text: "확증 편향을 인간 인지의 근본적 한계로 제시한다" },
        { id: "C", text: "후견 편향을 의사결정 과정의 주된 오류로 지목한다" },
        { id: "D", text: "가용성 편향을 정보 처리의 핵심 오류로 설명한다" }
      ],
      answerId: "A"
    },
    'p1_s1': {
      prompt: "하이라이트된 문장에서 앵커링 효과의 정의로 적절한 것은?",
      choices: [
        { id: "A", text: "처음 접한 정보가 닻처럼 고정되어 이후 판단을 불충분한 조정에 그치게 만든다" },
        { id: "B", text: "가장 최근에 접한 정보가 이전 모든 판단을 대체하는 현상이다" },
        { id: "C", text: "자신의 기존 신념과 일치하는 정보만을 선택적으로 수용하는 현상이다" },
        { id: "D", text: "다수의 의견에 무비판적으로 동조하는 집단사고 현상이다" }
      ],
      answerId: "A"
    },
    'p2_s1': {
      prompt: "하이라이트된 문장에서 넛지의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "선택의 자유를 제한하지 않으면서 더 나은 의사결정을 유도하는 선택 구조 설계이다" },
        { id: "B", text: "법적 규제를 통해 특정 행동을 강제하는 정부 개입이다" },
        { id: "C", text: "경제적 인센티브를 제공하여 바람직한 행동을 유도하는 보상 시스템이다" },
        { id: "D", text: "교육과 홍보를 통해 시민의 인식을 변화시키는 계몽 활동이다" }
      ],
      answerId: "A"
    },
    'p2_s2': {
      prompt: "하이라이트된 문장에서 자동 가입 제도가 활용하는 행동경제학적 편향은 무엇인가?",
      choices: [
        { id: "A", text: "현상 유지 편향을 활용한다" },
        { id: "B", text: "손실 회피 성향을 활용한다" },
        { id: "C", text: "앵커링 효과를 활용한다" },
        { id: "D", text: "확증 편향을 활용한다" }
      ],
      answerId: "A"
    },
    'p3_s1': {
      prompt: "하이라이트된 문장에서 실험실 편향에 대한 비판의 핵심 논거로 적절한 것은?",
      choices: [
        { id: "A", text: "실제 시장에서는 경험과 학습에 의해 편향이 상당 부분 교정될 수 있다" },
        { id: "B", text: "실험실 연구의 표본 크기가 통계적으로 불충분하다" },
        { id: "C", text: "인지적 편향은 문화적 차이에 의해 전혀 다르게 나타난다" },
        { id: "D", text: "실험 참가자의 동기가 실제 경제 행위자와 근본적으로 다르다" }
      ],
      answerId: "A"
    },
    'p3_s4': {
      prompt: "하이라이트된 문장에서 행동경제학이 보여주는 학제적 특성으로 적절한 것은?",
      choices: [
        { id: "A", text: "경제학, 심리학, 공공정책학의 경계를 가로지르는 학제적 연구의 모범이다" },
        { id: "B", text: "순수 경제학의 전통을 가장 충실히 계승하는 학문 분야이다" },
        { id: "C", text: "자연과학적 방법론을 사회과학에 처음 도입한 선구적 분야이다" },
        { id: "D", text: "철학과 신학의 전통적 논쟁을 경험적으로 해결하는 분야이다" }
      ],
      answerId: "A"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "전망 이론과 손실 회피를 통한 비합리적 의사결정의 실증적 규명" },
        { id: "B", text: "주식 시장의 효율적 시장 가설과 자산 가격 결정 모형의 검증" },
        { id: "C", text: "화폐의 기원과 교환 경제의 발전 과정에 대한 역사적 분석" },
        { id: "D", text: "국제 무역 이론의 비교우위 원리와 자유무역 협정의 경제적 효과" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "앵커링 효과의 정의, 실험적 근거, 그리고 실제 의사결정 상황에서의 강력한 작동" },
        { id: "B", text: "소비자 행동을 예측하기 위한 빅데이터 분석 기법의 발전과 적용" },
        { id: "C", text: "게임 이론에서 내시 균형의 개념과 전략적 의사결정에의 응용" },
        { id: "D", text: "중앙은행의 통화 정책이 소비자 심리에 미치는 영향의 거시경제학적 분석" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "넛지 이론의 정의와 자동 가입 제도·선택 설계 등 실천적 응용 사례" },
        { id: "B", text: "기업의 사회적 책임 활동이 소비자 충성도에 미치는 긍정적 효과" },
        { id: "C", text: "환경 규제 정책의 경제적 비용과 편익에 대한 정량적 분석" },
        { id: "D", text: "공공재의 과소 공급 문제와 정부 개입의 이론적 정당성" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "행동경제학에 대한 비판과 인간 행동의 현실적 양상을 반영한 정책 설계의 중요성" },
        { id: "B", text: "신고전파 경제학의 기본 가정과 한계에 대한 체계적 비판" },
        { id: "C", text: "디지털 경제에서 플랫폼 기업의 시장 지배력과 반독점 규제의 필요성" },
        { id: "D", text: "기후 변화 대응을 위한 탄소세와 배출권 거래제의 경제적 효과 비교" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "전망 이론을 제안한 두 학자의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "대니얼 카너먼과 아모스 트버스키")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "이익 주식을 조기 매도하고 손실 주식을 계속 보유하는 비효율적 행동 패턴을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p1", "처분 효과")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "처음 접한 정보가 닻처럼 고정되어 판단에 영향을 미치는 현상을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "앵커링 효과")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "넛지 이론을 제안한 두 학자는 누구인가?",
      answerRanges: [findRange(paragraphs, "p3", "리처드 탈러와 캐스 선스타인")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "넛지에 대한 비판에서 정부가 개인의 선택을 유도하는 것을 무엇이라 비판하는가?",
      answerRanges: [findRange(paragraphs, "p4", "자유주의적 가부장주의")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "행동경제학이 경계를 가로지르는 세 가지 학문 분야는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "경제학, 심리학, 공공정책학")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(85, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
}

// ── 메인 실행 ──
function main() {
  console.log('=== 비트겐슈타인2 Day 81~85 콘텐츠 빌드 시작 ===\n');

  const builders = [buildDay81, buildDay82, buildDay83, buildDay84, buildDay85];
  const contents = builders.map(fn => fn());

  // 배치 아이템 래핑
  const batchItems = contents.map((content, i) => {
    const dayIndex = 81 + i;
    const subArea = dayIndex % 2 === 1 ? "NONFICTION" : "LITERATURE";
    return wrapBatchItem(dayIndex, subArea, content);
  });

  // 길이 검증
  let hasWarning = false;
  batchItems.forEach((item) => {
    const paras = item.content.payload.passage.paragraphs;
    const len = paras.reduce((s, p) => s + p.text.length, 0);
    const cards = item.content.payload.recall.cards;
    const confirms = item.content.payload.confirm.questions;
    const steps = item.content.payload.intensive.timeline;
    console.log(`Day ${item.day_index}: 지문 ${len}자, 정독 ${steps.length}스텝, 복기 ${cards.length}장, 확인 ${confirms.length}문항`);

    if (len < 1450 || len > 1550) {
      console.error(`  [경고] Day ${item.day_index} 지문 길이 ${len}자 - 범위(1450~1550) 벗어남!`);
      hasWarning = true;
    }
    if (cards.length !== 8) {
      console.error(`  [경고] Day ${item.day_index} 복기 카드 ${cards.length}장 - 8장이어야 합니다!`);
      hasWarning = true;
    }
    if (confirms.length < 5 || confirms.length > 8) {
      console.error(`  [경고] Day ${item.day_index} 확인 문항 ${confirms.length}개 - 5~8개여야 합니다!`);
      hasWarning = true;
    }
  });

  if (hasWarning) {
    console.log('\n[경고가 있으나 파일은 생성합니다]');
  }

  // 배치 파일 읽기
  console.log('\n배치 파일 읽기...');
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`배치 파일 총 items: ${batchData.items.length}`);

  // items 교체: Day 81~85는 0-indexed 80~84
  for (let i = 0; i < 5; i++) {
    const targetIdx = hashIdx(81 + i);
    const oldItem = batchData.items[targetIdx];
    console.log(`교체: items[${targetIdx}] (Day ${oldItem.day_index}) -> Day ${batchItems[i].day_index}`);
    batchData.items[targetIdx] = batchItems[i];
  }

  // 배치 파일 저장
  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료: ${BATCH_PATH}`);

  // static 파일 생성
  if (!fs.existsSync(STATIC_DIR)) {
    fs.mkdirSync(STATIC_DIR, { recursive: true });
  }

  for (const item of batchItems) {
    const dayStr = String(item.day_index).padStart(3, '0');
    const staticPath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(staticPath, JSON.stringify(item.content, null, 2), 'utf8');
    console.log(`static 파일 저장 완료: ${staticPath}`);
  }

  console.log('\n=== 빌드 완료 ===');
}

main();
