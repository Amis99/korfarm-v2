// 비트겐슈타인2 Day 66~70 콘텐츠 빌더
// 짝수 day = LITERATURE, 홀수 day = NONFICTION
// 목표: 1500자 ±50, 4문단, 고1~고2 수준

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

function hashIdx(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
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

function buildTimeline(paragraphs, questionBank) {
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);
    sents.forEach((sent, si) => {
      stepNum++;
      const range = { paragraphId: para.id, start: sent.start, end: sent.end };
      let question;

      const key = `p${pi}_s${si}`;
      if (questionBank[key]) {
        question = questionBank[key];
      } else {
        // 기본 문장 매칭 문제
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
    const centralTheme = questionBank[`central_p${pi}`];
    if (centralTheme) {
      const cShuffled = shuffleChoices(centralTheme.choices, centralTheme.answerId);
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
  const subAreaLabel = subArea === 'LITERATURE' ? '문학' : '비문학';
  return {
    contentId: `dr-w2-${dayStr}`,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(비트겐슈타인 2) Day ${dayIndex} ${subAreaLabel}`,
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

// ── Day 66: 문학 (LITERATURE, 짝수) ──
// 주제: 김수영 시론 — 현대시에서의 자유와 참여의 문제
function buildDay66() {
  const paragraphs = [
    {
      id: "p1",
      text: "김수영은 한국 현대시사에서 참여와 순수의 이분법을 넘어선 독자적인 시론을 정립한 시인으로, 1960년대 한국 시단의 지적 풍경을 근본적으로 변화시킨 인물이다. 그의 시적 사유의 핵심에는 자유라는 개념이 놓여 있는데, 이때 자유는 정치적 해방이나 개인의 방종을 의미하는 것이 아니라 시적 언어가 관습적 형식과 의미의 제약으로부터 해방되는 미학적 자유를 뜻한다. 김수영에게 시를 쓴다는 행위는 기존의 관습적 사유 체계를 파괴하고 새로운 언어적 지평을 여는 것이며, 이러한 형식적 혁신 자체가 곧 사회적 변혁의 가능성을 내포한다는 것이 그의 근본적 신념이었다. 그는 시가 정치적 구호를 반복하는 도구로 전락하는 것을 거부하면서도, 시적 언어의 혁신이 현실 비판의 가장 근본적인 형태라고 주장하였다."
    },
    {
      id: "p2",
      text: "김수영의 대표시 「풀」은 이러한 시론이 작품으로 구현된 대표적 사례이다. 이 시에서 풀은 바람에 눕지만 바람보다 먼저 일어나는 존재로 묘사되는데, 풀은 민중의 알레고리이자 생명력 자체의 상징이며, 바람은 권력과 억압의 형상화이다. 풀이 바람보다 먼저 일어난다는 역설적 표현은 피억압자가 억압 세력보다 더 근원적인 생명력을 지니고 있다는 인식을 담고 있으며, 이는 단순한 저항의 의지를 넘어 존재론적 차원의 회복력을 형상화한 것이다. 이 시의 언어는 극도로 절제되어 있어 군더더기 없는 이미지의 연쇄로만 구성되어 있는데, 이러한 형식적 절제 자체가 시적 자유의 실천이며 동시에 정치적 발언의 가장 효과적인 방식이 된다는 점에서 김수영 시론의 핵심을 체현하고 있다."
    },
    {
      id: "p3",
      text: "김수영은 산문에서 반복적으로 시인의 양심이라는 문제를 제기하였다. 그에게 양심이란 도덕적 선악의 판단 기준이 아니라, 시인이 자신의 비겁함과 타협을 직시하는 자기 성찰의 태도를 의미한다. 그의 산문 「시여, 침을 뱉어라」에서 시가 현실과 타협하고 안주하는 것은 시 자체의 죽음이라고 선언한 것은, 시적 언어가 끊임없이 자기 갱신을 수행해야 한다는 요구이자 시인이 기존 질서에 안주하는 자신의 나태함을 먼저 공격해야 한다는 자기비판의 윤리학이었다. 김수영에게 시의 참여란 시인이 거리로 나서는 것이 아니라 언어 내부에서 관습과 싸우는 것이며, 이러한 내면의 전쟁이 외부 세계의 변혁으로 이어질 수 있다는 급진적 미학적 신념을 견지하였다."
    },
    {
      id: "p4",
      text: "김수영의 시론이 오늘날까지 유효한 까닭은 참여 문학과 순수 문학이라는 한국 문학계의 오랜 대립 구도를 근본적으로 해체하는 사유를 제공하기 때문이다. 그의 논리에 따르면 진정한 시적 혁신은 필연적으로 사회적 혁신을 수반하며, 형식적 모험을 포기한 참여시는 구호에 불과하고, 현실에 무관심한 순수시는 기만에 불과하다. 이 양면적 비판은 시가 무엇을 말하느냐의 문제와 어떻게 말하느냐의 문제가 분리될 수 없다는 인식에 기반한다. 김수영이 남긴 이 시론적 유산은 이후 한국 시단에서 참여와 형식 실험의 결합을 모색하는 시인들에게 근본적인 좌표계 역할을 하였으며, 시적 언어와 정치적 실천의 관계에 대한 가장 깊이 있는 성찰로 평가되고 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 66 지문 길이: ${len}자`);

  const questionBank = {
    "p0_s0": {
      prompt: "하이라이트된 문장에서 김수영의 시적 위치에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "참여와 순수의 이분법을 넘어선 독자적 시론을 정립하였다" },
        { id: "B", text: "순수 문학만을 추구하며 현실 참여를 완전히 거부하였다" },
        { id: "C", text: "참여 문학의 전형적인 대표 시인으로 활동하였다" },
        { id: "D", text: "전통 시조의 형식을 현대적으로 계승하는 데 집중하였다" }
      ],
      answerId: "A"
    },
    "p0_s2": {
      prompt: "하이라이트된 문장에서 김수영에게 시 쓰기의 본질은 무엇인가?",
      choices: [
        { id: "A", text: "관습적 사유 체계를 파괴하고 새로운 언어적 지평을 여는 것이다" },
        { id: "B", text: "전통적 운율을 충실히 계승하여 미학적 완결성을 추구하는 것이다" },
        { id: "C", text: "민중의 삶을 사실적으로 기록하는 르포르타주를 작성하는 것이다" },
        { id: "D", text: "서양 시의 형식을 한국어로 정확히 번역하는 것이다" }
      ],
      answerId: "A"
    },
    "p1_s0": {
      prompt: "하이라이트된 문장에서 「풀」에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "김수영의 시론이 작품으로 구현된 대표적 사례이다" },
        { id: "B", text: "순수 서정의 전통을 계승한 자연 묘사 시이다" },
        { id: "C", text: "해방 직후의 정치적 혼란을 직접적으로 다룬 시이다" },
        { id: "D", text: "실험적 형식을 포기하고 대중적 소통을 추구한 시이다" }
      ],
      answerId: "A"
    },
    "p1_s2": {
      prompt: "하이라이트된 문장에서 '풀이 바람보다 먼저 일어난다'는 표현의 의미로 적절한 것은?",
      choices: [
        { id: "A", text: "피억압자가 억압 세력보다 더 근원적인 생명력을 지닌다는 인식이다" },
        { id: "B", text: "자연의 순환이 인간의 의지보다 강하다는 인식이다" },
        { id: "C", text: "풀이 바람보다 물리적으로 빠르게 움직인다는 관찰이다" },
        { id: "D", text: "약자가 강자에게 순응해야 한다는 교훈을 담고 있다" }
      ],
      answerId: "A"
    },
    "p2_s0": {
      prompt: "하이라이트된 문장에서 김수영이 산문에서 반복적으로 제기한 문제는 무엇인가?",
      choices: [
        { id: "A", text: "시인의 양심이라는 문제를 반복적으로 제기하였다" },
        { id: "B", text: "한글 맞춤법의 개혁이라는 문제를 반복적으로 제기하였다" },
        { id: "C", text: "시의 상업적 유통이라는 문제를 반복적으로 제기하였다" },
        { id: "D", text: "전통 시가의 보존이라는 문제를 반복적으로 제기하였다" }
      ],
      answerId: "A"
    },
    "p2_s3": {
      prompt: "하이라이트된 문장에서 김수영이 말하는 시의 참여란 어떤 것인가?",
      choices: [
        { id: "A", text: "언어 내부에서 관습과 싸우는 것이다" },
        { id: "B", text: "시인이 거리로 나서서 시위에 참가하는 것이다" },
        { id: "C", text: "정치적 선언문을 시의 형식으로 발표하는 것이다" },
        { id: "D", text: "민중의 삶을 직접 체험하고 기록하는 것이다" }
      ],
      answerId: "A"
    },
    "p3_s0": {
      prompt: "하이라이트된 문장에서 김수영 시론이 오늘날까지 유효한 이유는 무엇인가?",
      choices: [
        { id: "A", text: "참여와 순수의 대립 구도를 근본적으로 해체하는 사유를 제공하기 때문이다" },
        { id: "B", text: "한국 시의 전통적 형식을 가장 정확하게 계승하고 있기 때문이다" },
        { id: "C", text: "서양 문학 이론을 한국에 최초로 소개하였기 때문이다" },
        { id: "D", text: "시의 대중화에 가장 크게 기여한 이론이기 때문이다" }
      ],
      answerId: "A"
    },
    "p3_s3": {
      prompt: "하이라이트된 문장에서 김수영의 시론적 유산이 후대에 미친 영향으로 적절한 것은?",
      choices: [
        { id: "A", text: "참여와 형식 실험의 결합을 모색하는 시인들에게 좌표계 역할을 하였다" },
        { id: "B", text: "순수시 운동의 확산에 결정적인 이론적 기반을 마련하였다" },
        { id: "C", text: "시의 상업적 성공을 위한 방법론을 제시하였다" },
        { id: "D", text: "전통 시조의 현대적 부활을 이끄는 계기가 되었다" }
      ],
      answerId: "A"
    },
    "central_p0": {
      choices: [
        { id: "A", text: "김수영 시론의 핵심인 미학적 자유와 형식 혁신을 통한 사회 변혁의 가능성" },
        { id: "B", text: "1950년대 한국 전쟁 문학의 전개와 트라우마 서사의 양상" },
        { id: "C", text: "서정주의 생명파 시학과 영원성의 추구" },
        { id: "D", text: "해방 공간에서의 좌우 문단 대립과 이념적 갈등" }
      ],
      answerId: "A"
    },
    "central_p1": {
      choices: [
        { id: "A", text: "시 「풀」에 나타난 민중적 생명력의 알레고리와 형식적 절제의 의미" },
        { id: "B", text: "윤동주 시에 나타난 자기 성찰과 민족 의식의 조화" },
        { id: "C", text: "이상 시의 실험적 형식과 모더니즘적 해체의 양상" },
        { id: "D", text: "정지용 시의 감각적 이미지즘과 언어 미학의 특징" }
      ],
      answerId: "A"
    },
    "central_p2": {
      choices: [
        { id: "A", text: "시인의 양심과 자기비판의 윤리학, 언어 내부의 관습과의 투쟁으로서의 참여" },
        { id: "B", text: "1960년대 민중 문학 운동의 전개와 리얼리즘 논쟁" },
        { id: "C", text: "백석 시의 토속적 서정과 근대적 향수의 미학" },
        { id: "D", text: "한국 현대 소설에 나타난 분단 의식의 변화 양상" }
      ],
      answerId: "A"
    },
    "central_p3": {
      choices: [
        { id: "A", text: "참여와 순수의 대립 해체, 형식과 내용의 불가분성에 대한 김수영의 유산" },
        { id: "B", text: "한국 현대시의 포스트모더니즘적 전환과 해체적 글쓰기" },
        { id: "C", text: "여성 문학의 성장과 페미니즘 비평의 발전 과정" },
        { id: "D", text: "디지털 시대 문학의 위기와 새로운 매체 환경의 도전" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, questionBank);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "김수영에게 시적 자유란 구체적으로 어떤 자유를 의미하는가?",
      answerRanges: [findRange(paragraphs, "p1", "미학적 자유")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "시 「풀」에서 풀은 어떤 존재의 알레고리인가?",
      answerRanges: [findRange(paragraphs, "p2", "민중")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "시 「풀」에서 바람은 무엇을 형상화한 것인가?",
      answerRanges: [findRange(paragraphs, "p2", "권력과 억압")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "김수영이 시의 타협과 안주를 공격한 산문의 제목은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "시여, 침을 뱉어라")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "김수영의 논리에서 형식적 모험을 포기한 참여시는 무엇에 불과한가?",
      answerRanges: [findRange(paragraphs, "p4", "구호")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "김수영의 논리에서 현실에 무관심한 순수시는 무엇에 불과한가?",
      answerRanges: [findRange(paragraphs, "p4", "기만")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return { dayIndex: 66, subArea: "LITERATURE", paragraphs, timeline, cards, confirmQuestions };
}

// ── Day 67: 비문학 (NONFICTION, 홀수) ──
// 주제: 인지 편향 — 확증 편향의 심리학적 메커니즘
function buildDay67() {
  const paragraphs = [
    {
      id: "p1",
      text: "확증 편향이란 자신이 이미 가지고 있는 신념이나 가설을 지지하는 정보는 적극적으로 탐색하고 수용하면서, 이에 반하는 정보는 무시하거나 과소평가하는 인지적 경향성을 가리킨다. 이 개념은 영국의 인지심리학자 피터 웨이슨이 1960년대에 수행한 고전적 실험을 통해 체계적으로 입증되었다. 웨이슨의 사칙 선택 과제에서 참가자들은 가설을 검증할 때 확인하는 사례만을 선택적으로 찾는 반면, 가설을 반증할 수 있는 결정적인 사례는 체계적으로 간과하는 양상을 보였다. 이 실험은 인간의 추론 능력이 논리적 규칙에 충실하게 작동하는 것이 아니라, 기존 신념을 보존하는 방향으로 편향되어 있다는 사실을 최초로 실험적으로 증명한 것이었다."
    },
    {
      id: "p2",
      text: "확증 편향이 발생하는 심리적 메커니즘은 여러 층위에서 작동한다. 첫째, 정보 탐색 단계에서 사람들은 자신의 기존 견해와 일치하는 정보원에 선택적으로 접근하는 선택적 노출 경향을 보이며, 이는 디지털 미디어 환경에서 필터 버블이라는 현상으로 증폭된다. 둘째, 동일한 정보를 접하더라도 자신의 신념에 부합하는 내용은 정확하고 신뢰할 만하다고 평가하는 반면 반대되는 내용은 결함이 있거나 편향된 것으로 평가하는 편향된 해석이 작동한다. 셋째, 자신의 입장을 지지하는 정보는 오래 기억하고 반대 정보는 쉽게 망각하는 선택적 기억이 확증 편향을 시간이 지날수록 강화시킨다. 이 세 가지 메커니즘이 중첩되면서 개인의 신념 체계는 자기 강화적 폐쇄 회로를 형성하게 된다."
    },
    {
      id: "p3",
      text: "확증 편향은 개인의 일상적 판단에서부터 사회적 의사결정에 이르기까지 광범위한 영역에서 부정적 영향을 미친다. 의료 분야에서는 의사가 초기 진단에 대한 확증 편향으로 인해 대안적 진단 가능성을 충분히 고려하지 않는 조기 폐쇄 오류가 오진의 주요 원인 중 하나로 지목되고 있다. 사법 영역에서는 수사관이 초기에 형성한 유죄 심증이 이후 수집하는 증거의 해석을 편향시켜 무고한 피의자에 대한 기소로 이어지는 사례가 보고되어 있다. 과학 연구에서도 연구자가 자신의 가설을 확인하는 데이터에 주목하고 반증 데이터를 간과하는 경향이 재현성 위기의 한 원인으로 논의되고 있으며, 이는 과학적 방법론 자체의 핵심인 반증 가능성의 원리가 인간의 인지적 한계에 의해 위협받고 있음을 시사한다."
    },
    {
      id: "p4",
      text: "확증 편향을 완전히 제거하는 것은 인간의 인지 구조상 불가능하지만, 그 영향을 완화하기 위한 다양한 전략이 제안되어 있다. 가장 효과적인 방법 중 하나는 자신의 입장과 반대되는 논거를 의도적으로 구성해 보는 반대 논증 생성 기법으로, 이는 편향된 정보 처리의 자동성을 깨뜨리는 메타인지적 개입에 해당한다. 조직적 차원에서는 의사결정 과정에 공식적인 반론 제기자인 악마의 옹호자 역할을 배치하는 것이 집단사고를 예방하는 데 유효한 것으로 알려져 있다. 교육적 관점에서는 비판적 사고 훈련이 학생들의 확증 편향을 유의미하게 감소시킨다는 연구 결과가 축적되고 있으며, 이는 확증 편향이 고정불변의 인지적 결함이 아니라 의식적 노력과 제도적 장치를 통해 관리 가능한 인지적 경향성임을 보여준다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 67 지문 길이: ${len}자`);

  const questionBank = {
    "p0_s0": {
      prompt: "하이라이트된 문장에서 확증 편향의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "기존 신념을 지지하는 정보를 선호하고 반대 정보를 과소평가하는 인지적 경향이다" },
        { id: "B", text: "새로운 정보를 무조건적으로 수용하는 무비판적 사고 양식이다" },
        { id: "C", text: "과거의 경험에 의존하여 현재의 문제를 해결하는 경험적 방법이다" },
        { id: "D", text: "논리적 추론보다 감정적 직관에 의존하는 판단 방식이다" }
      ],
      answerId: "A"
    },
    "p0_s1": {
      prompt: "하이라이트된 문장에서 확증 편향을 체계적으로 입증한 학자는 누구인가?",
      choices: [
        { id: "A", text: "영국의 인지심리학자 피터 웨이슨이다" },
        { id: "B", text: "미국의 행동경제학자 대니얼 카너먼이다" },
        { id: "C", text: "독일의 게슈탈트 심리학자 볼프강 쾰러이다" },
        { id: "D", text: "스위스의 발달심리학자 장 피아제이다" }
      ],
      answerId: "A"
    },
    "p1_s0": {
      prompt: "하이라이트된 문장에서 확증 편향의 심리적 메커니즘에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "여러 층위에서 작동하는 복합적 메커니즘이다" },
        { id: "B", text: "단일한 원인으로 설명되는 단순한 현상이다" },
        { id: "C", text: "유전적으로 결정되는 선천적 능력이다" },
        { id: "D", text: "특정 문화권에서만 관찰되는 사회적 현상이다" }
      ],
      answerId: "A"
    },
    "p1_s1": {
      prompt: "하이라이트된 문장에서 디지털 미디어 환경에서 선택적 노출이 증폭되는 현상을 무엇이라 하는가?",
      choices: [
        { id: "A", text: "필터 버블이라는 현상으로 증폭된다" },
        { id: "B", text: "에코 체임버라는 현상으로 증폭된다" },
        { id: "C", text: "정보 과부하라는 현상으로 증폭된다" },
        { id: "D", text: "디지털 디바이드라는 현상으로 증폭된다" }
      ],
      answerId: "A"
    },
    "p2_s1": {
      prompt: "하이라이트된 문장에서 의료 분야에서 확증 편향이 초래하는 문제를 무엇이라 하는가?",
      choices: [
        { id: "A", text: "대안적 진단 가능성을 충분히 고려하지 않는 조기 폐쇄 오류이다" },
        { id: "B", text: "환자의 증상을 과대해석하는 과잉 진단 오류이다" },
        { id: "C", text: "불필요한 검사를 반복하는 방어적 의료 행위이다" },
        { id: "D", text: "의사와 환자 간 의사소통 단절로 인한 치료 중단이다" }
      ],
      answerId: "A"
    },
    "p2_s3": {
      prompt: "하이라이트된 문장에서 과학적 방법론의 핵심 원리가 위협받는 원인으로 제시된 것은?",
      choices: [
        { id: "A", text: "인간의 인지적 한계에 의해 반증 가능성의 원리가 위협받고 있다" },
        { id: "B", text: "연구 윤리 위원회의 과도한 규제가 자유로운 연구를 방해한다" },
        { id: "C", text: "연구비 부족으로 충분한 실험 반복이 이루어지지 못한다" },
        { id: "D", text: "학제 간 소통의 부재로 통합적 연구가 불가능하다" }
      ],
      answerId: "A"
    },
    "p3_s1": {
      prompt: "하이라이트된 문장에서 확증 편향 완화를 위한 효과적인 방법으로 제시된 것은?",
      choices: [
        { id: "A", text: "반대 논증 생성 기법으로, 편향된 정보 처리의 자동성을 깨뜨린다" },
        { id: "B", text: "명상과 이완 훈련으로, 감정적 반응을 억제한다" },
        { id: "C", text: "정보 차단 기법으로, 편향된 정보원에 대한 접근을 제한한다" },
        { id: "D", text: "집단 토론 기법으로, 다수의 의견을 합산하여 결론을 도출한다" }
      ],
      answerId: "A"
    },
    "p3_s3": {
      prompt: "하이라이트된 문장에서 확증 편향에 대한 궁극적 평가로 적절한 것은?",
      choices: [
        { id: "A", text: "의식적 노력과 제도적 장치를 통해 관리 가능한 인지적 경향성이다" },
        { id: "B", text: "유전적으로 결정된 불가변적 인지적 결함이다" },
        { id: "C", text: "교육 수준이 높은 사람에게는 나타나지 않는 현상이다" },
        { id: "D", text: "현대 사회에서만 관찰되는 새로운 인지적 현상이다" }
      ],
      answerId: "A"
    },
    "central_p0": {
      choices: [
        { id: "A", text: "확증 편향의 정의와 웨이슨의 실험을 통한 인간 추론의 편향성 입증" },
        { id: "B", text: "인공지능의 알고리즘적 편향과 공정성 문제에 대한 논의" },
        { id: "C", text: "행동경제학의 기본 개념과 합리적 선택 이론의 한계" },
        { id: "D", text: "신경과학의 발전에 따른 뇌 기능 매핑 연구의 성과" }
      ],
      answerId: "A"
    },
    "central_p1": {
      choices: [
        { id: "A", text: "선택적 노출·편향된 해석·선택적 기억이라는 확증 편향의 세 가지 작동 메커니즘" },
        { id: "B", text: "소셜 미디어의 알고리즘이 정치적 양극화에 미치는 영향" },
        { id: "C", text: "기억의 왜곡에 관한 엘리자베스 로프터스의 목격자 증언 연구" },
        { id: "D", text: "무의식적 편향이 채용 과정에서 다양성을 저해하는 양상" }
      ],
      answerId: "A"
    },
    "central_p2": {
      choices: [
        { id: "A", text: "의료·사법·과학 분야에서 확증 편향이 초래하는 부정적 영향과 재현성 위기" },
        { id: "B", text: "기후 변화 부정론의 확산과 과학적 합의에 대한 대중의 불신" },
        { id: "C", text: "법적 판단에서 인공지능 활용의 가능성과 윤리적 쟁점" },
        { id: "D", text: "빅데이터 분석 기법의 발전과 사회 현상 예측의 정확도 향상" }
      ],
      answerId: "A"
    },
    "central_p3": {
      choices: [
        { id: "A", text: "반대 논증 생성·악마의 옹호자·비판적 사고 훈련 등 확증 편향 완화 전략" },
        { id: "B", text: "인지행동치료의 원리와 정신건강 개선에 대한 효과" },
        { id: "C", text: "교육 과정에서 디지털 리터러시 교육의 필요성과 방향" },
        { id: "D", text: "조직 내 의사결정 구조의 민주화와 수평적 소통의 중요성" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, questionBank);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "확증 편향을 최초로 실험적으로 입증한 심리학자는 누구인가?",
      answerRanges: [findRange(paragraphs, "p1", "피터 웨이슨")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "디지털 미디어 환경에서 선택적 노출이 증폭되는 현상을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "필터 버블")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "의료 분야에서 초기 진단에 대한 확증 편향이 초래하는 오류를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p3", "조기 폐쇄 오류")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "과학 연구에서 재현성 위기의 한 원인으로 논의되는 과학적 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "반증 가능성")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "집단사고 예방을 위해 의사결정 과정에 배치하는 역할을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "악마의 옹호자")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "확증 편향 완화를 위해 자신의 입장과 반대되는 논거를 구성하는 기법을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "반대 논증 생성")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return { dayIndex: 67, subArea: "NONFICTION", paragraphs, timeline, cards, confirmQuestions };
}

// ── Day 68: 문학 (LITERATURE, 짝수) ──
// 주제: 황석영 「삼포 가는 길」 — 산업화 시대 유랑하는 인간 군상
function buildDay68() {
  const paragraphs = [
    {
      id: "p1",
      text: "황석영의 단편소설 「삼포 가는 길」은 1973년에 발표된 작품으로, 산업화 시대에 고향을 상실한 채 떠도는 인간 군상의 비애를 서정적으로 형상화한 한국 현대 단편의 수작이다. 이 소설의 중심인물인 영달은 전국의 건설 현장을 떠돌며 일하는 일용직 노동자로, 마지막 현장에서 임금 체불을 당한 뒤 고향 삼포로 향한다. 삼포는 영달에게 유년의 기억이 깃든 원초적 안식처이자, 현재의 고단한 삶에서 벗어나고자 하는 귀향 욕망의 대상이다. 그러나 소설은 처음부터 이 귀향이 실현 불가능한 것임을 암시하는데, 삼포라는 이름 자체가 지니는 이상적 울림과 영달이 처한 현실 사이의 거리가 서사 전체에 걸쳐 점진적으로 벌어지기 때문이다."
    },
    {
      id: "p2",
      text: "여행 도중 영달은 정씨라는 중년 노동자를 만나게 되는데, 정씨 또한 건설 현장을 전전하며 살아온 인물이다. 정씨는 영달보다 더 오랜 세월을 유랑해 온 인물로서, 가족과의 유대마저 끊어진 채 고향에 대한 향수조차 이미 희미해진 상태에 있다. 두 사람의 동행은 세대를 초월한 유랑 노동자들의 연대이자, 산업화라는 거대한 흐름 앞에서 개인이 겪는 소외의 보편성을 드러내는 서사적 장치이다. 이후 합류하는 백화라는 젊은 여성은 유흥업소에서 도주한 인물로, 이 세 사람의 동행은 산업화 시대에 경제적 논리에 의해 착취당하고 내몰리는 하층민의 다양한 양상을 하나의 여정 서사 안에 집약적으로 보여준다."
    },
    {
      id: "p3",
      text: "소설의 결말에서 영달은 삼포 역시 이미 관광 단지로 개발되어 옛 모습을 완전히 잃어버렸다는 소식을 듣게 된다. 이 반전은 귀향 서사의 파탄을 의미하며, 고향이라는 정신적 거점의 소멸이 산업화의 불가피한 대가임을 극적으로 보여준다. 삼포의 변질은 특정 인물의 불행에 국한되지 않고 1970년대 한국 사회 전체가 경험한 공동체 해체의 알레고리로 확장되며, 독자에게 경제 성장의 이면에 존재하는 인간적 상실에 대한 성찰을 촉구한다. 소설의 마지막 장면에서 영달이 삼포 대신 다른 건설 현장으로 발길을 돌리는 행위는 귀향의 꿈을 포기한 것이 아니라, 어디에도 도착할 수 없는 영원한 이동 자체가 유랑 노동자의 존재 양식임을 수용하는 체념적 깨달음의 표현이다."
    },
    {
      id: "p4",
      text: "「삼포 가는 길」의 문학적 성취는 산업화에 대한 비판을 구호나 선언이 아닌 서정적 서사를 통해 구현한 데 있다. 황석영은 눈 덮인 겨울 풍경 속을 걸어가는 세 사람의 여정을 통해 소외와 상실의 감정을 감각적으로 전달하며, 정치적 메시지를 미학적 형식 안에 자연스럽게 용해시킨다. 특히 추운 겨울밤에 세 사람이 주막에서 함께 술을 나누는 장면은 유랑하는 인간들 사이에 피어나는 일시적이지만 진실한 연대의 순간을 감동적으로 포착한다. 이 작품에서 길은 물리적 이동 경로인 동시에 인물들이 각자의 과거와 현재, 욕망과 좌절을 반추하는 내면의 통로로 기능하며, 여정 문학의 형식이 지닌 서사적 잠재력을 탁월하게 활용한 사례이다. 이 단편은 1970년대 한국 리얼리즘 문학의 대표작으로 자리매김하였으며, 산업화 시대 민중의 삶을 문학적으로 증언한 작품으로서 오늘날에도 꾸준히 읽히고 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 68 지문 길이: ${len}자`);

  const questionBank = {
    "p0_s0": {
      prompt: "하이라이트된 문장에서 「삼포 가는 길」에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "산업화 시대에 떠도는 인간 군상의 비애를 서정적으로 형상화한 단편이다" },
        { id: "B", text: "해방 직후 귀향하는 민중의 기쁨을 사실적으로 묘사한 소설이다" },
        { id: "C", text: "전쟁의 참상을 르포르타주 형식으로 기록한 논픽션이다" },
        { id: "D", text: "농촌 공동체의 전통적 삶의 양식을 예찬한 전원 소설이다" }
      ],
      answerId: "A"
    },
    "p0_s2": {
      prompt: "하이라이트된 문장에서 삼포가 영달에게 지니는 의미로 적절한 것은?",
      choices: [
        { id: "A", text: "유년의 기억이 깃든 원초적 안식처이자 귀향 욕망의 대상이다" },
        { id: "B", text: "새로운 경제적 기회가 기다리는 미래의 성공 공간이다" },
        { id: "C", text: "친구들과의 우정이 살아 있는 현재의 직장이다" },
        { id: "D", text: "전쟁 중 피난했던 일시적 체류지이다" }
      ],
      answerId: "A"
    },
    "p1_s2": {
      prompt: "하이라이트된 문장에서 두 사람의 동행이 서사적으로 드러내는 바는 무엇인가?",
      choices: [
        { id: "A", text: "산업화 앞에서 개인이 겪는 소외의 보편성을 드러내는 장치이다" },
        { id: "B", text: "노동 현장에서의 동료 의식과 협업의 중요성을 보여준다" },
        { id: "C", text: "세대 간 가치관 충돌과 갈등의 심화 과정을 재현한다" },
        { id: "D", text: "우연한 만남이 운명적 사건으로 발전하는 모험 서사이다" }
      ],
      answerId: "A"
    },
    "p1_s3": {
      prompt: "하이라이트된 문장에서 세 사람의 동행이 보여주는 바로 적절한 것은?",
      choices: [
        { id: "A", text: "경제적 논리에 의해 착취당하고 내몰리는 하층민의 다양한 양상이다" },
        { id: "B", text: "도시와 농촌 사이의 문화적 격차와 소통의 어려움이다" },
        { id: "C", text: "산업화의 혜택을 균등하게 나누는 복지 제도의 필요성이다" },
        { id: "D", text: "개인의 자유로운 선택에 의한 낭만적 방랑의 즐거움이다" }
      ],
      answerId: "A"
    },
    "p2_s0": {
      prompt: "하이라이트된 문장에서 소설 결말의 반전 내용으로 적절한 것은?",
      choices: [
        { id: "A", text: "삼포가 관광 단지로 개발되어 옛 모습을 완전히 잃어버렸다" },
        { id: "B", text: "영달이 삼포에 도착하여 가족과 감격적으로 재회하였다" },
        { id: "C", text: "정씨가 삼포에 남아 새로운 사업을 시작하기로 결심하였다" },
        { id: "D", text: "백화가 삼포에서 새로운 삶의 기반을 마련하였다" }
      ],
      answerId: "A"
    },
    "p2_s3": {
      prompt: "하이라이트된 문장에서 영달이 다른 건설 현장으로 발길을 돌리는 행위의 의미는?",
      choices: [
        { id: "A", text: "영원한 이동 자체가 유랑 노동자의 존재 양식임을 수용하는 체념적 깨달음이다" },
        { id: "B", text: "새로운 건설 현장에서 더 나은 임금을 받을 수 있다는 낙관적 기대이다" },
        { id: "C", text: "고향을 찾아가기 전에 여비를 마련하겠다는 실용적 판단이다" },
        { id: "D", text: "정씨와의 우정을 이어가기 위해 동행을 결심한 것이다" }
      ],
      answerId: "A"
    },
    "p3_s0": {
      prompt: "하이라이트된 문장에서 이 작품의 문학적 성취로 제시된 것은?",
      choices: [
        { id: "A", text: "산업화 비판을 서정적 서사를 통해 구현한 점이다" },
        { id: "B", text: "역사적 사실을 정확하게 기록한 다큐멘터리적 가치이다" },
        { id: "C", text: "실험적 형식을 통해 서사 구조를 해체한 모더니즘적 성과이다" },
        { id: "D", text: "등장인물의 심리를 의식의 흐름 기법으로 묘사한 혁신성이다" }
      ],
      answerId: "A"
    },
    "p3_s3": {
      prompt: "하이라이트된 문장에서 이 작품이 한국 문학사에서 차지하는 위치로 적절한 것은?",
      choices: [
        { id: "A", text: "1970년대 한국 리얼리즘 문학의 대표작으로 자리매김하였다" },
        { id: "B", text: "1960년대 한국 모더니즘 문학의 선구적 작품으로 평가된다" },
        { id: "C", text: "1980년대 민중 문학 운동의 출발점이 된 작품이다" },
        { id: "D", text: "한국 전쟁 이후 전후 문학의 대표적 성과이다" }
      ],
      answerId: "A"
    },
    "central_p0": {
      choices: [
        { id: "A", text: "영달의 귀향 욕망과 삼포라는 이상적 공간의 설정, 그리고 귀향 불가능성의 암시" },
        { id: "B", text: "해방기 문학에 나타난 이산과 귀환의 주제와 민족 정체성의 모색" },
        { id: "C", text: "1980년대 노동 문학의 전개와 노동자 계급의 자기 서사 형성" },
        { id: "D", text: "한국 전후 소설에서 전쟁 트라우마와 실존적 불안의 양상" }
      ],
      answerId: "A"
    },
    "central_p1": {
      choices: [
        { id: "A", text: "정씨와 백화의 합류를 통해 드러나는 유랑 노동자 군상의 소외와 착취의 보편성" },
        { id: "B", text: "조세희 「난장이가 쏘아올린 작은 공」에 나타난 도시 빈민의 삶" },
        { id: "C", text: "이문구 소설에 나타난 농촌 공동체의 해체와 향토적 서정" },
        { id: "D", text: "박경리 『토지』의 다층적 인물 구성과 역사적 서사" }
      ],
      answerId: "A"
    },
    "central_p2": {
      choices: [
        { id: "A", text: "삼포의 변질이 상징하는 귀향 서사의 파탄과 산업화에 의한 공동체 해체" },
        { id: "B", text: "한국 현대 도시 소설에 나타난 아파트 문화와 개인주의의 확산" },
        { id: "C", text: "탈북 문학에 나타난 이산의 경험과 정체성의 위기" },
        { id: "D", text: "디아스포라 문학에서의 문화적 혼종성과 다중 정체성" }
      ],
      answerId: "A"
    },
    "central_p3": {
      choices: [
        { id: "A", text: "서정적 서사를 통한 산업화 비판, 여정 문학의 형식적 성취와 리얼리즘적 위상" },
        { id: "B", text: "한국 현대시에서 서사시의 가능성과 장시 형식의 실험" },
        { id: "C", text: "판소리 소설의 현대적 변용과 구비 문학 전통의 계승" },
        { id: "D", text: "한국 추리 소설의 장르적 발전과 대중 문학의 성장" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, questionBank);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "영달이 마지막 건설 현장에서 당한 부당한 처사는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "임금 체불")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "여행 중 영달이 만나는 중년 노동자의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "정씨")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "이후 합류하는 젊은 여성 인물의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "백화")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "삼포가 변해버린 모습은 무엇으로 개발된 것인가?",
      answerRanges: [findRange(paragraphs, "p3", "관광 단지")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이 작품이 대표하는 1970년대 한국 문학의 경향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "리얼리즘")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이 소설에서 길이 물리적 이동 외에 지니는 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "내면의 통로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return { dayIndex: 68, subArea: "LITERATURE", paragraphs, timeline, cards, confirmQuestions };
}

// ── Day 69: 비문학 (NONFICTION, 홀수) ──
// 주제: 열역학 제2법칙과 엔트로피
function buildDay69() {
  const paragraphs = [
    {
      id: "p1",
      text: "열역학 제2법칙은 자연 과정의 방향성을 규정하는 물리학의 근본 원리로, 고립 계의 엔트로피는 자발적 과정에서 항상 증가하거나 최소한 유지된다는 것을 골자로 한다. 여기서 엔트로피란 계의 무질서도 또는 미시 상태의 수를 나타내는 열역학적 함수이며, 이 개념은 독일의 물리학자 루돌프 클라우지우스가 1865년에 처음 도입하였다. 일상적으로 관찰되는 많은 비가역적 현상이 이 법칙의 구체적인 발현인데, 뜨거운 물체에서 차가운 물체로 열이 자발적으로 이동하지만 그 역과정은 외부의 일 없이는 일어나지 않는 현상이 대표적이다. 이 법칙은 에너지의 총량은 보존되더라도 에너지의 질은 지속적으로 하락한다는 사실을 의미하며, 이는 우주의 모든 자연 과정에 시간적 비대칭성을 부여하는 근본적인 원리이다."
    },
    {
      id: "p2",
      text: "엔트로피 증가의 원리가 갖는 심층적 의미는 루트비히 볼츠만의 통계역학적 해석을 통해 명확해진다. 볼츠만은 엔트로피를 미시 상태의 수에 대한 로그 함수로 정의함으로써, 거시적인 열역학적 양이 미시적인 분자 운동의 통계적 성질에 기반한다는 것을 밝혔다. 이 관점에서 엔트로피의 증가란 계가 확률적으로 가장 가능성이 높은 거시 상태, 즉 가장 많은 미시 상태에 대응하는 균일한 상태로 이행하는 자연적 경향을 의미한다. 예를 들어 향수 병을 개봉하면 향기 분자가 방 전체로 퍼져나가는 것은 분자들이 특정 영역에 집중된 상태보다 방 전체에 균일하게 분포된 상태에 대응하는 미시 상태의 수가 압도적으로 많기 때문이며, 그 역과정이 자발적으로 일어날 확률은 사실상 영에 가깝다."
    },
    {
      id: "p3",
      text: "열역학 제2법칙은 물리학을 넘어 생물학, 정보 이론, 경제학 등 다양한 학문 분야에 깊은 영향을 미쳤다. 생물학에서 생명체는 내부의 질서를 유지하기 위해 끊임없이 외부로부터 에너지를 섭취하고 엔트로피가 높은 열과 폐기물을 방출하는 개방 계로 기능하는데, 이는 국소적으로 엔트로피를 감소시키되 전체 계의 엔트로피는 증가시키는 방식으로 제2법칙과 양립한다. 정보 이론에서 클로드 섀넌은 엔트로피 개념을 정보의 불확실성을 측정하는 도구로 재해석하여 현대 통신 이론의 수학적 기초를 확립하였다. 경제학에서는 니콜라스 조르제스쿠-뢰겐이 경제 과정의 불가역성과 자원 고갈의 문제를 열역학적 관점에서 분석하여, 무한 성장이라는 경제학적 전제에 물리적 한계가 존재한다는 생태경제학의 토대를 놓았다."
    },
    {
      id: "p4",
      text: "엔트로피의 개념은 우주의 궁극적 운명에 대한 예측과도 연결된다. 19세기 물리학자들은 엔트로피가 극대값에 도달하면 우주의 모든 에너지가 균일하게 분포되어 더 이상 어떠한 열역학적 과정도 일어날 수 없는 상태, 즉 열적 죽음에 이를 것이라고 예측하였다. 현대 우주론에서는 우주의 팽창이 가속되고 있다는 관측 결과와 결합하여, 모든 항성이 소진되고 물질이 극도로 분산되는 상태로의 전이가 수조 년에 걸쳐 진행될 것이라는 시나리오가 제시되고 있다. 그러나 열역학 제2법칙이 궁극적으로 함의하는 바는 파괴나 소멸이 아니라, 자연의 모든 과정에는 방향이 있다는 시간의 화살이라는 근본적 통찰이며, 이 통찰은 물리학이 제공하는 세계관 가운데 가장 심오하고 포괄적인 원리의 하나로 평가되고 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 69 지문 길이: ${len}자`);

  const questionBank = {
    "p0_s0": {
      prompt: "하이라이트된 문장에서 열역학 제2법칙의 핵심 내용으로 적절한 것은?",
      choices: [
        { id: "A", text: "고립 계의 엔트로피는 자발적 과정에서 항상 증가하거나 유지된다" },
        { id: "B", text: "에너지는 생성되거나 소멸될 수 없으며 형태만 전환된다" },
        { id: "C", text: "절대 영도에서 완전 결정의 엔트로피는 영이다" },
        { id: "D", text: "열평형 상태에 있는 두 계는 서로 열적 평형에 있다" }
      ],
      answerId: "A"
    },
    "p0_s1": {
      prompt: "하이라이트된 문장에서 엔트로피 개념을 최초로 도입한 과학자는 누구인가?",
      choices: [
        { id: "A", text: "독일의 물리학자 루돌프 클라우지우스이다" },
        { id: "B", text: "영국의 물리학자 아이작 뉴턴이다" },
        { id: "C", text: "오스트리아의 물리학자 루트비히 볼츠만이다" },
        { id: "D", text: "프랑스의 화학자 앙투안 라부아지에이다" }
      ],
      answerId: "A"
    },
    "p1_s0": {
      prompt: "하이라이트된 문장에서 엔트로피의 심층적 의미를 밝힌 학문적 접근은 무엇인가?",
      choices: [
        { id: "A", text: "볼츠만의 통계역학적 해석을 통해 명확해진다" },
        { id: "B", text: "아인슈타인의 상대성 이론을 통해 재해석되었다" },
        { id: "C", text: "하이젠베르크의 불확정성 원리와의 관계에서 밝혀졌다" },
        { id: "D", text: "맥스웰의 전자기 이론에 의해 수학적으로 정식화되었다" }
      ],
      answerId: "A"
    },
    "p1_s2": {
      prompt: "하이라이트된 문장에서 엔트로피 증가가 의미하는 바로 적절한 것은?",
      choices: [
        { id: "A", text: "확률적으로 가장 가능성이 높은 균일한 상태로 이행하는 자연적 경향이다" },
        { id: "B", text: "외부 에너지 투입에 의해 계의 질서가 증가하는 현상이다" },
        { id: "C", text: "미시 상태의 수가 감소하면서 질서가 형성되는 과정이다" },
        { id: "D", text: "분자의 운동이 점차 느려져 절대 영도에 수렴하는 경향이다" }
      ],
      answerId: "A"
    },
    "p2_s1": {
      prompt: "하이라이트된 문장에서 생명체가 제2법칙과 양립하는 방식으로 적절한 것은?",
      choices: [
        { id: "A", text: "국소적으로 엔트로피를 감소시키되 전체 계의 엔트로피는 증가시킨다" },
        { id: "B", text: "내부 에너지를 무한히 재활용하여 엔트로피 증가를 완전히 방지한다" },
        { id: "C", text: "열역학 법칙이 생물 계에는 적용되지 않는 예외적 영역이다" },
        { id: "D", text: "외부로부터 엔트로피를 흡수하여 내부 질서를 파괴한다" }
      ],
      answerId: "A"
    },
    "p2_s2": {
      prompt: "하이라이트된 문장에서 엔트로피 개념을 정보 이론에 활용한 학자는 누구인가?",
      choices: [
        { id: "A", text: "클로드 섀넌이 정보의 불확실성 측정 도구로 재해석하였다" },
        { id: "B", text: "앨런 튜링이 계산 가능성의 이론적 토대로 활용하였다" },
        { id: "C", text: "존 폰 노이만이 게임 이론의 수학적 기초로 적용하였다" },
        { id: "D", text: "노버트 위너가 사이버네틱스의 핵심 원리로 발전시켰다" }
      ],
      answerId: "A"
    },
    "p3_s1": {
      prompt: "하이라이트된 문장에서 엔트로피가 극대값에 도달한 우주의 상태를 무엇이라 하는가?",
      choices: [
        { id: "A", text: "더 이상 열역학적 과정이 일어날 수 없는 열적 죽음 상태이다" },
        { id: "B", text: "우주가 수축하여 특이점으로 회귀하는 빅 크런치 상태이다" },
        { id: "C", text: "물질이 한 점에 집중되는 블랙홀 형성 상태이다" },
        { id: "D", text: "새로운 빅뱅이 시작되는 순환적 재생 상태이다" }
      ],
      answerId: "A"
    },
    "p3_s3": {
      prompt: "하이라이트된 문장에서 열역학 제2법칙이 함의하는 근본적 통찰은 무엇인가?",
      choices: [
        { id: "A", text: "자연의 모든 과정에는 방향이 있다는 '시간의 화살'이라는 통찰이다" },
        { id: "B", text: "에너지와 질량은 서로 전환될 수 있다는 등가 원리이다" },
        { id: "C", text: "관측 행위가 물리적 현상을 변화시킨다는 양자역학적 원리이다" },
        { id: "D", text: "빛의 속도는 모든 관성계에서 동일하다는 불변 원리이다" }
      ],
      answerId: "A"
    },
    "central_p0": {
      choices: [
        { id: "A", text: "열역학 제2법칙의 핵심 내용과 엔트로피 개념의 정의 및 시간적 비대칭성" },
        { id: "B", text: "뉴턴 역학의 세 가지 운동 법칙과 관성의 원리" },
        { id: "C", text: "양자역학의 기본 원리와 파동-입자 이중성의 해석" },
        { id: "D", text: "특수 상대성 이론에서의 시간 지연과 공간 수축 현상" }
      ],
      answerId: "A"
    },
    "central_p1": {
      choices: [
        { id: "A", text: "볼츠만의 통계역학적 해석을 통한 엔트로피의 미시적 의미와 확률적 경향" },
        { id: "B", text: "열기관의 효율성 향상을 위한 공학적 설계 원리와 카르노 순환" },
        { id: "C", text: "절대 영도 근처에서 물질의 양자적 행동과 초전도 현상" },
        { id: "D", text: "원자 모형의 역사적 발전과 보어 모형의 한계" }
      ],
      answerId: "A"
    },
    "central_p2": {
      choices: [
        { id: "A", text: "생물학·정보 이론·경제학 등 열역학 제2법칙의 학제 간 확장과 응용" },
        { id: "B", text: "재생 에너지 기술의 발전과 에너지 효율 향상의 공학적 과제" },
        { id: "C", text: "유전자 편집 기술의 윤리적 쟁점과 생명과학의 사회적 책임" },
        { id: "D", text: "인공지능 알고리즘의 작동 원리와 딥러닝 모델의 구조" }
      ],
      answerId: "A"
    },
    "central_p3": {
      choices: [
        { id: "A", text: "엔트로피와 우주의 궁극적 운명, 시간의 화살이라는 근본적 통찰" },
        { id: "B", text: "암흑 물질과 암흑 에너지의 존재 증거와 관측 방법" },
        { id: "C", text: "빅뱅 우주론의 세 가지 관측적 증거와 표준 모형의 검증" },
        { id: "D", text: "다중 우주 가설의 이론적 배경과 철학적 함의" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, questionBank);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "엔트로피 개념을 1865년에 최초로 도입한 물리학자는 누구인가?",
      answerRanges: [findRange(paragraphs, "p1", "루돌프 클라우지우스")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "엔트로피를 미시 상태의 수에 대한 로그 함수로 정의한 과학자는 누구인가?",
      answerRanges: [findRange(paragraphs, "p2", "볼츠만")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "엔트로피 개념을 정보의 불확실성 측정 도구로 재해석한 학자는 누구인가?",
      answerRanges: [findRange(paragraphs, "p3", "클로드 섀넌")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "경제 과정의 불가역성을 열역학적 관점에서 분석한 경제학자는 누구인가?",
      answerRanges: [findRange(paragraphs, "p3", "니콜라스 조르제스쿠-뢰겐")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "엔트로피가 극대값에 도달하여 열역학적 과정이 멈추는 상태를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "열적 죽음")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "열역학 제2법칙이 자연 과정에 부여하는 근본적 성질을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "시간의 화살")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return { dayIndex: 69, subArea: "NONFICTION", paragraphs, timeline, cards, confirmQuestions };
}

// ── Day 70: 문학 (LITERATURE, 짝수) ──
// 주제: 윤동주 시의 자기 성찰과 부끄러움의 시학
function buildDay70() {
  const paragraphs = [
    {
      id: "p1",
      text: "윤동주는 일제 강점기 말기에 활동한 시인으로, 그의 시 세계의 핵심에는 자기 성찰과 부끄러움이라는 윤리적 정서가 놓여 있다. 윤동주의 시적 자아는 외부의 적에게 분노를 표출하는 저항적 주체가 아니라, 자신의 내면에서 비겁함과 나약함을 발견하고 이를 고백하는 반성적 주체로서 자기 자신을 끊임없이 심문한다. 대표시 「서시」에서 죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를 바란다는 고백은, 식민지 현실 앞에서 어떠한 실천적 행동도 하지 못하는 자신에 대한 도덕적 자책이자, 그럼에도 불구하고 윤리적 순결을 포기하지 않겠다는 의지의 표현이다. 이 부끄러움의 시학은 한국 문학사에서 저항이라는 개념의 외연을 확장하여, 내면적 성찰 자체가 식민지 상황에서의 진정한 저항이 될 수 있음을 보여주었다."
    },
    {
      id: "p2",
      text: "「자화상」은 윤동주의 자기 성찰이 가장 응축된 형태로 구현된 작품이다. 이 시에서 화자는 우물 속에 비친 자신의 모습을 들여다보며 그 사나이가 미워지기도 하고 가엾어지기도 하는 양가적 감정을 표출한다. 우물은 자기 인식의 매체이자 무의식의 상징 공간으로 기능하며, 우물 속의 자기 모습은 현실 속 자아와 이상적 자아 사이의 괴리를 가시화하는 거울 이미지이다. 화자가 돌아서면 사나이가 그리워진다는 결말은 자기 혐오와 자기 연민이 순환하는 구조를 형성하며, 이는 윤동주 시 전체를 관통하는 자아 분열의 모티프를 집약적으로 보여주고 있다. 이러한 자아 탐구의 깊이는 같은 시기 다른 시인들의 작품에서는 쉽게 발견되지 않는 윤동주만의 독특한 성취이다."
    },
    {
      id: "p3",
      text: "「십자가」와 「별 헤는 밤」에서 윤동주의 시적 사유는 개인의 차원을 넘어 공동체적 의미로 확장된다. 「십자가」에서 화자는 십자가에 걸리는 기독교적 수난의 이미지를 통해 자신의 고통이 민족의 고통과 연결되어 있음을 암시하며, 개인의 희생이 공동체의 구원으로 이어질 수 있다는 희망을 조심스럽게 표현한다. 「별 헤는 밤」에서는 별 하나에 사랑과 별 하나에 쓸쓸함이라는 반복 구조를 통해 소중한 것들에 대한 그리움을 무한히 확장하며, 밤하늘의 별들은 시인의 기억 속에 존재하는 사랑하는 사람들과 가치들의 총체적 은유가 된다. 이 시에서 별은 도달할 수 없는 이상이면서도 끊임없이 헤아리고 향해 가야 할 지향점으로 기능하며, 이를 통해 윤동주는 현실적 좌절 속에서도 가치를 포기하지 않는 인간의 윤리적 자세를 형상화한다."
    },
    {
      id: "p4",
      text: "윤동주의 시가 시대를 초월하여 읽히는 까닭은 그의 시적 언어가 지닌 투명한 진정성에 있다. 그의 시는 난해한 수사나 과잉된 감정 표현을 배제하고, 평이하면서도 깊이 있는 언어로 인간 내면의 보편적 갈등을 포착한다. 특히 윤동주의 시에서 반복적으로 나타나는 바람, 하늘, 별, 우물 같은 자연 이미지들은 단순한 배경이 아니라 시인의 내면 세계를 투영하는 객관적 상관물로 기능하며, 감각적 구체성과 상징적 깊이를 동시에 획득한다. 윤동주는 한국 현대시에서 서정적 아름다움과 윤리적 깊이를 가장 자연스럽게 결합시킨 시인으로 평가되며, 그의 시적 유산은 이후 한국 시단에서 개인의 내면과 사회적 현실을 통합하는 시적 전통의 원천으로 작용하고 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 70 지문 길이: ${len}자`);

  const questionBank = {
    "p0_s0": {
      prompt: "하이라이트된 문장에서 윤동주 시 세계의 핵심에 놓인 윤리적 정서는 무엇인가?",
      choices: [
        { id: "A", text: "자기 성찰과 부끄러움이라는 윤리적 정서이다" },
        { id: "B", text: "식민지 지배자에 대한 강렬한 분노와 저항 의지이다" },
        { id: "C", text: "자연에 대한 경외와 생태적 감수성이다" },
        { id: "D", text: "민족 해방에 대한 낙관적 확신과 투쟁적 열정이다" }
      ],
      answerId: "A"
    },
    "p0_s2": {
      prompt: "하이라이트된 문장에서 「서시」의 고백이 담고 있는 이중적 의미로 적절한 것은?",
      choices: [
        { id: "A", text: "실천 불능에 대한 도덕적 자책이자 윤리적 순결을 포기하지 않으려는 의지이다" },
        { id: "B", text: "일제에 대한 직접적 저항 선언이자 독립 운동 참여의 결의이다" },
        { id: "C", text: "문학적 성공에 대한 자신감이자 시인으로서의 사명 의식이다" },
        { id: "D", text: "고향에 대한 향수이자 자연으로의 회귀 욕구이다" }
      ],
      answerId: "A"
    },
    "p1_s0": {
      prompt: "하이라이트된 문장에서 「자화상」에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "윤동주의 자기 성찰이 가장 응축된 형태로 구현된 작품이다" },
        { id: "B", text: "민족 해방의 열망을 서사적으로 전개한 장편시이다" },
        { id: "C", text: "전원적 삶의 아름다움을 감각적으로 묘사한 서정시이다" },
        { id: "D", text: "현대 도시 문명을 비판적으로 묘사한 풍자시이다" }
      ],
      answerId: "A"
    },
    "p1_s2": {
      prompt: "하이라이트된 문장에서 우물이 시적으로 기능하는 방식으로 적절한 것은?",
      choices: [
        { id: "A", text: "자기 인식의 매체이자 무의식의 상징 공간으로 기능한다" },
        { id: "B", text: "생명수를 공급하는 실용적 공간으로 기능한다" },
        { id: "C", text: "과거의 기억을 지우는 망각의 장치로 기능한다" },
        { id: "D", text: "타인과의 소통을 매개하는 공공의 공간으로 기능한다" }
      ],
      answerId: "A"
    },
    "p2_s1": {
      prompt: "하이라이트된 문장에서 「십자가」에서 화자의 고통이 연결되는 대상은 무엇인가?",
      choices: [
        { id: "A", text: "민족의 고통과 연결되어 있음을 암시한다" },
        { id: "B", text: "개인의 신체적 질병과 연결되어 있음을 보여준다" },
        { id: "C", text: "예술적 창작의 고통과 연결되어 있음을 시사한다" },
        { id: "D", text: "경제적 궁핍과 연결되어 있음을 고백한다" }
      ],
      answerId: "A"
    },
    "p2_s3": {
      prompt: "하이라이트된 문장에서 「별 헤는 밤」의 별이 상징적으로 기능하는 방식은?",
      choices: [
        { id: "A", text: "도달할 수 없지만 끊임없이 향해 가야 할 지향점으로 기능한다" },
        { id: "B", text: "과학적 탐구의 대상으로서 우주의 물리적 법칙을 재현한다" },
        { id: "C", text: "현실적 성취를 통해 얻을 수 있는 구체적 보상을 상징한다" },
        { id: "D", text: "과거의 영광스러운 역사적 성과를 회고하는 매개물이다" }
      ],
      answerId: "A"
    },
    "p3_s0": {
      prompt: "하이라이트된 문장에서 윤동주의 시가 시대를 초월하여 읽히는 이유는 무엇인가?",
      choices: [
        { id: "A", text: "그의 시적 언어가 지닌 투명한 진정성 때문이다" },
        { id: "B", text: "난해한 수사와 실험적 형식이 학문적 관심을 끌기 때문이다" },
        { id: "C", text: "직접적인 정치적 선동으로 대중적 호소력이 강하기 때문이다" },
        { id: "D", text: "서양 모더니즘 시학을 충실히 번역하여 소개하였기 때문이다" }
      ],
      answerId: "A"
    },
    "p3_s3": {
      prompt: "하이라이트된 문장에서 윤동주에 대한 문학사적 평가로 적절한 것은?",
      choices: [
        { id: "A", text: "서정적 아름다움과 윤리적 깊이를 가장 자연스럽게 결합시킨 시인이다" },
        { id: "B", text: "한국 모더니즘 시의 형식적 실험을 주도한 전위적 시인이다" },
        { id: "C", text: "민중 문학의 이론적 토대를 마련한 비평가이자 시인이다" },
        { id: "D", text: "전통 시조의 현대적 부활을 이끈 고전 문학 연구자이다" }
      ],
      answerId: "A"
    },
    "central_p0": {
      choices: [
        { id: "A", text: "윤동주 시의 핵심인 자기 성찰과 부끄러움의 윤리, 「서시」에 나타난 내면적 저항" },
        { id: "B", text: "이육사 시에 나타난 의지적 저항과 민족 해방의 열망" },
        { id: "C", text: "서정주의 「자화상」에 나타난 운명적 자아 인식과 생명의식" },
        { id: "D", text: "백석 시에 나타난 토속적 서정과 유년의 세계에 대한 향수" }
      ],
      answerId: "A"
    },
    "central_p1": {
      choices: [
        { id: "A", text: "「자화상」에 나타난 우물의 상징, 자아 분열의 모티프와 양가적 자기 인식" },
        { id: "B", text: "정지용 시의 감각적 이미지즘과 모더니즘적 언어 실험" },
        { id: "C", text: "한용운 「님의 침묵」에 나타난 부재하는 님에 대한 영원한 기다림" },
        { id: "D", text: "김소월 시에 나타난 한과 이별의 정서적 전통" }
      ],
      answerId: "A"
    },
    "central_p2": {
      choices: [
        { id: "A", text: "「십자가」와 「별 헤는 밤」에서 개인적 성찰이 공동체적 의미로 확장되는 양상" },
        { id: "B", text: "조지훈의 전통 미학과 고전적 정서의 현대적 형상화" },
        { id: "C", text: "박목월 시에 나타난 자연과 인간의 조화로운 교감" },
        { id: "D", text: "김수영 시에 나타난 시적 자유와 사회 참여의 결합" }
      ],
      answerId: "A"
    },
    "central_p3": {
      choices: [
        { id: "A", text: "윤동주 시어의 투명한 진정성, 자연 이미지의 상징적 기능, 시적 유산의 의의" },
        { id: "B", text: "한국 현대시에서 포스트모더니즘적 전환과 해체적 글쓰기의 확산" },
        { id: "C", text: "1980년대 민중시 운동의 전개와 사회 변혁적 시의 역할" },
        { id: "D", text: "여성 시인들의 등장과 페미니즘 시학의 형성 과정" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, questionBank);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "「서시」에서 화자가 죽는 날까지 바라는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "부끄럼이 없기를")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「자화상」에서 화자가 자신의 모습을 들여다보는 매체는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "우물")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「십자가」에서 화자의 고통이 연결되는 기독교적 이미지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "수난")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "「별 헤는 밤」에서 별들은 시인의 무엇에 대한 총체적 은유인가?",
      answerRanges: [findRange(paragraphs, "p3", "사랑하는 사람들과 가치들")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "윤동주 시에서 바람, 하늘, 별 같은 자연 이미지가 기능하는 문학적 장치를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "객관적 상관물")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "윤동주는 한국 현대시에서 어떤 두 가지를 가장 자연스럽게 결합시킨 시인으로 평가되는가?",
      answerRanges: [findRange(paragraphs, "p4", "서정적 아름다움과 윤리적 깊이")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return { dayIndex: 70, subArea: "LITERATURE", paragraphs, timeline, cards, confirmQuestions };
}

// ── 메인 실행 ──
function main() {
  console.log('=== 비트겐슈타인2 Day 66~70 콘텐츠 빌드 시작 ===\n');

  const builders = [buildDay66, buildDay67, buildDay68, buildDay69, buildDay70];
  const results = [];

  for (const builder of builders) {
    const { dayIndex, subArea, paragraphs, timeline, cards, confirmQuestions } = builder();
    const content = assembleFull(dayIndex, subArea, paragraphs, timeline, cards, confirmQuestions);
    const batchItem = wrapBatchItem(dayIndex, subArea, content);
    results.push(batchItem);
  }

  // 길이 검증
  results.forEach((item) => {
    const paras = item.content.payload.passage.paragraphs;
    const len = paras.reduce((s, p) => s + p.text.length, 0);
    const cards = item.content.payload.recall.cards;
    const confirms = item.content.payload.confirm.questions;
    const steps = item.content.payload.intensive.timeline;
    console.log(`Day ${item.day_index}: 지문 ${len}자, 정독 ${steps.length}스텝, 복기 ${cards.length}장, 확인 ${confirms.length}문항`);

    if (len < 1450 || len > 1550) {
      console.error(`  [경고] Day ${item.day_index} 지문 길이 ${len}자 - 범위(1450~1550) 벗어남!`);
    }
    if (cards.length !== 8) {
      console.error(`  [경고] Day ${item.day_index} 복기 카드 ${cards.length}장 - 8장이어야 합니다!`);
    }
    if (confirms.length < 5 || confirms.length > 8) {
      console.error(`  [경고] Day ${item.day_index} 확인 문항 ${confirms.length}개 - 5~8개여야 합니다!`);
    }
  });

  // 배치 파일 읽기
  console.log('\n배치 파일 읽기...');
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`배치 파일 총 items: ${batchData.items.length}`);

  // items[65]~[69] 교체 (Day 66~70은 0-indexed 65~69)
  for (let i = 0; i < 5; i++) {
    const targetIdx = 65 + i;
    const oldItem = batchData.items[targetIdx];
    console.log(`교체: items[${targetIdx}] (Day ${oldItem.day_index}) -> Day ${results[i].day_index}`);
    batchData.items[targetIdx] = results[i];
  }

  // 배치 파일 저장
  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료: ${BATCH_PATH}`);

  // static 파일 생성
  for (const item of results) {
    const dayStr = String(item.day_index).padStart(3, '0');
    const staticPath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(staticPath, JSON.stringify(item.content, null, 2), 'utf8');
    console.log(`static 파일 저장 완료: ${staticPath}`);
  }

  console.log('\n=== 빌드 완료 ===');
}

main();
