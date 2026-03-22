// 비트겐슈타인2 Day 61~65 콘텐츠 빌더
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

function buildTimeline(paragraphs, customQuestions) {
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);
    sents.forEach((sent, si) => {
      stepNum++;
      const range = { paragraphId: para.id, start: sent.start, end: sent.end };
      let question;

      // 커스텀 질문 검색
      const key = `p${pi}_s${si}`;
      const custom = customQuestions[key];
      if (custom) {
        question = custom;
      } else {
        // 자동 생성: 다른 문단 문장과 섞어서 4지선다
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
    const centralTheme = customQuestions[`central_p${pi}`];
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

// ── Day 61: 비문학 (NONFICTION, 홀수) ──
// 주제: 인지 편향과 합리적 의사결정
function buildDay61() {
  const paragraphs = [
    {
      id: "p1",
      text: "인간의 의사결정은 논리적 추론에 기반한 합리적 과정이라고 흔히 가정되지만, 행동경제학의 연구 성과는 이러한 가정이 현실과 크게 괴리되어 있음을 보여준다. 대니얼 카너먼과 아모스 트버스키는 1979년에 발표한 전망 이론을 통해 인간이 이익과 손실을 비대칭적으로 평가한다는 사실을 실증적으로 입증하였다. 그들의 실험에 따르면 동일한 금액이라도 이익으로 얻을 때의 심리적 만족보다 손실로 잃을 때의 심리적 고통이 약 두 배 이상 크게 느껴지는데, 이를 손실 회피 편향이라 한다. 이 발견은 전통 경제학이 전제하는 기대효용이론의 근본적 한계를 드러내며, 인간의 경제적 행동이 수학적 합리성이 아닌 심리적 메커니즘에 의해 체계적으로 왜곡될 수 있음을 학문적으로 확립하였다."
    },
    {
      id: "p2",
      text: "인지 편향의 대표적 유형으로 가용성 휴리스틱과 확증 편향을 들 수 있다. 가용성 휴리스틱이란 어떤 사건의 발생 확률을 판단할 때 떠올리기 쉬운 사례의 수에 의존하는 인지적 지름길을 의미한다. 예를 들어 비행기 사고가 언론에 반복적으로 보도되면 사람들은 비행기 여행의 위험성을 실제보다 훨씬 높게 추정하게 되는데, 이는 통계적 사실이 아니라 기억의 용이성이 판단의 기준이 되기 때문이다. 확증 편향은 자신의 기존 신념이나 가설을 지지하는 정보만을 선택적으로 수집하고 해석하며, 이에 반하는 증거는 무시하거나 축소하려는 경향을 가리킨다. 이 두 가지 편향은 개인의 일상적 판단에서부터 전문가의 정책 결정에 이르기까지 광범위한 영역에서 체계적 오류를 유발하는 것으로 밝혀져 왔다."
    },
    {
      id: "p3",
      text: "프레이밍 효과는 동일한 정보라도 그것이 제시되는 틀이나 맥락에 따라 사람들의 선택이 달라지는 현상을 말한다. 카너먼과 트버스키의 고전적 실험에서 참가자들에게 전염병 대응 방안을 두 가지 방식으로 제시하였다. 생존자 수로 표현한 경우에는 확실한 이득을 선호하는 위험 회피적 선택이 우세하였고, 사망자 수로 표현한 경우에는 도박적 대안을 선호하는 위험 추구적 선택이 우세하게 나타났다. 이는 객관적으로 동일한 결과임에도 표현 방식의 차이만으로 선호가 역전되는 것으로, 합리적 선택 이론의 핵심 공리인 기술 불변성의 원칙에 정면으로 위배된다. 프레이밍 효과는 정치적 선전, 마케팅 전략, 의료 정보 전달 등 현실의 다양한 영역에서 의사결정을 조작하는 강력한 도구로 활용될 수 있다는 점에서 그 사회적 함의가 매우 크다."
    },
    {
      id: "p4",
      text: "인지 편향에 대한 이해는 넛지라는 정책적 개념의 이론적 토대를 제공하였다. 넛지란 선택의 자유를 제한하지 않으면서도 사람들이 더 나은 결정을 내리도록 선택 환경을 설계하는 부드러운 개입 전략을 의미한다. 예를 들어 장기 기증 동의 제도에서 기본 설정을 기증 동의로 바꾸는 것만으로 기증률이 극적으로 상승한 사례는 넛지의 효과를 잘 보여준다. 그러나 넛지에 대한 비판도 존재하는데, 이는 개인의 자율적 판단 능력을 과소평가하고 설계자의 가치 판단을 은밀하게 부과하는 온정주의적 개입이 될 수 있다는 우려이다. 따라서 인지 편향의 연구는 인간 이성의 한계를 인정하면서도 그 한계를 보완하기 위한 사회적 장치가 민주적 투명성과 개인의 자율성을 동시에 존중하는 방향으로 설계되어야 한다는 규범적 과제를 남기고 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 61 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 인간 의사결정에 대한 전통적 가정과 행동경제학의 연구 결과의 관계로 적절한 것은?",
      choices: [
        { id: "A", text: "합리적 의사결정이라는 가정이 현실과 크게 괴리되어 있음을 보여준다" },
        { id: "B", text: "논리적 추론이 경제적 의사결정의 유일한 기반임을 재확인한다" },
        { id: "C", text: "인간의 직관이 수학적 계산보다 항상 정확하다고 입증한다" },
        { id: "D", text: "전통 경제학의 합리성 가정이 행동경제학에 의해 완전히 폐기되었음을 선언한다" }
      ],
      answerId: "A"
    },
    'p0_s2': {
      prompt: "하이라이트된 문장에서 이익과 손실에 대한 심리적 반응의 비대칭성을 설명하는 개념은?",
      choices: [
        { id: "A", text: "손실 회피 편향이라 한다" },
        { id: "B", text: "매몰 비용 오류라 한다" },
        { id: "C", text: "현재 편향이라 한다" },
        { id: "D", text: "과잉 확신 편향이라 한다" }
      ],
      answerId: "A"
    },
    'p1_s0': {
      prompt: "하이라이트된 문장에서 인지 편향의 대표적 유형으로 제시된 두 가지는?",
      choices: [
        { id: "A", text: "가용성 휴리스틱과 확증 편향이다" },
        { id: "B", text: "앵커링 효과와 프레이밍 효과이다" },
        { id: "C", text: "후광 효과와 밴드왜건 효과이다" },
        { id: "D", text: "손실 회피와 현상 유지 편향이다" }
      ],
      answerId: "A"
    },
    'p1_s3': {
      prompt: "하이라이트된 문장에서 확증 편향의 핵심적 특성으로 적절한 것은?",
      choices: [
        { id: "A", text: "기존 신념을 지지하는 정보만을 선택적으로 수집하고 반증은 무시하는 경향이다" },
        { id: "B", text: "새로운 증거를 접하면 즉시 기존 신념을 수정하는 합리적 태도이다" },
        { id: "C", text: "모든 정보를 동등하게 평가하되 결론 도출을 지연하는 성향이다" },
        { id: "D", text: "통계적 확률에 기반하여 객관적 판단을 내리려는 체계적 노력이다" }
      ],
      answerId: "A"
    },
    'p2_s0': {
      prompt: "하이라이트된 문장에서 프레이밍 효과의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "동일한 정보라도 제시되는 틀이나 맥락에 따라 선택이 달라지는 현상이다" },
        { id: "B", text: "정보의 양이 많을수록 더 정확한 판단을 내리게 되는 현상이다" },
        { id: "C", text: "첫 번째 제시된 정보가 이후 판단의 기준점이 되는 현상이다" },
        { id: "D", text: "복수의 선택지가 주어질 때 중간 옵션을 선호하는 현상이다" }
      ],
      answerId: "A"
    },
    'p2_s3': {
      prompt: "하이라이트된 문장에서 프레이밍 효과가 위배하는 합리적 선택 이론의 원칙은?",
      choices: [
        { id: "A", text: "기술 불변성의 원칙에 정면으로 위배된다" },
        { id: "B", text: "이행성의 원칙에 간접적으로 위배된다" },
        { id: "C", text: "완전성의 원칙에 부분적으로 위배된다" },
        { id: "D", text: "독립성의 원칙에 체계적으로 위배된다" }
      ],
      answerId: "A"
    },
    'p3_s0': {
      prompt: "하이라이트된 문장에서 넛지의 정의로 적절한 것은?",
      choices: [
        { id: "A", text: "선택의 자유를 제한하지 않으면서 더 나은 결정을 유도하는 부드러운 개입 전략이다" },
        { id: "B", text: "법적 규제를 통해 개인의 비합리적 행동을 강제로 교정하는 정책이다" },
        { id: "C", text: "경제적 인센티브를 제공하여 특정 행동을 유도하는 시장 메커니즘이다" },
        { id: "D", text: "교육과 계몽을 통해 인지 편향을 근본적으로 제거하는 프로그램이다" }
      ],
      answerId: "A"
    },
    'p3_s3': {
      prompt: "하이라이트된 문장에서 넛지에 대한 비판의 핵심 내용으로 적절한 것은?",
      choices: [
        { id: "A", text: "설계자의 가치 판단을 은밀하게 부과하는 온정주의적 개입이 될 수 있다" },
        { id: "B", text: "선택의 자유를 지나치게 확대하여 결정 피로를 유발할 수 있다" },
        { id: "C", text: "인간의 합리적 판단 능력을 과대평가하여 효과가 미미할 수 있다" },
        { id: "D", text: "경제적 비용이 과다하여 정책적 실현 가능성이 낮을 수 있다" }
      ],
      answerId: "A"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "전망 이론과 손실 회피 편향을 통해 인간 의사결정의 비합리성을 실증적으로 입증" },
        { id: "B", text: "고전 역학의 결정론적 세계관과 양자역학의 확률적 해석 사이의 갈등" },
        { id: "C", text: "진화론에 대한 다양한 학설과 자연선택의 메커니즘 분석" },
        { id: "D", text: "근대 철학에서 합리론과 경험론의 대립과 그 종합의 시도" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "가용성 휴리스틱과 확증 편향이 개인과 전문가의 판단에 미치는 체계적 오류" },
        { id: "B", text: "DNA 이중나선 구조의 발견 과정과 분자생물학의 탄생" },
        { id: "C", text: "블록체인 기술의 작동 원리와 암호화폐의 경제적 의의" },
        { id: "D", text: "국제 무역 이론의 발전과 비교우위론의 현대적 적용" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "프레이밍 효과의 실험적 입증과 합리적 선택 이론에 대한 도전" },
        { id: "B", text: "빅뱅 우주론의 증거와 우주 팽창 가설의 검증" },
        { id: "C", text: "인공지능의 학습 알고리즘과 딥러닝 기술의 발전 단계" },
        { id: "D", text: "세계화의 역사적 전개와 국가 간 경제적 상호의존성 심화" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "넛지의 정의와 효과, 그리고 자율성과 투명성에 관한 규범적 과제" },
        { id: "B", text: "환경 오염의 원인과 지속 가능한 발전을 위한 국제 협약" },
        { id: "C", text: "중세 유럽의 봉건 제도와 상업 혁명의 사회적 영향" },
        { id: "D", text: "현대 민주주의의 위기와 대의 정치의 구조적 한계" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "카너먼과 트버스키가 1979년에 발표한 이론의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "전망 이론")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "동일한 금액의 손실이 이익보다 약 몇 배 크게 느껴진다고 하였는가?",
      answerRanges: [findRange(paragraphs, "p1", "두 배")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "사건 확률 판단 시 떠올리기 쉬운 사례에 의존하는 인지적 지름길의 이름은?",
      answerRanges: [findRange(paragraphs, "p2", "가용성 휴리스틱")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "프레이밍 효과가 위배하는 합리적 선택 이론의 원칙은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "기술 불변성")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "선택의 자유를 제한하지 않으면서 더 나은 결정을 유도하는 정책적 개념의 이름은?",
      answerRanges: [findRange(paragraphs, "p4", "넛지")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "넛지에 대한 비판에서 설계자의 가치를 은밀하게 부과하는 개입을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "온정주의적")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(61, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(61, "NONFICTION", content);
}

// ── Day 62: 문학 (LITERATURE, 짝수) ──
// 주제: 윤동주의 시 세계와 자아 성찰
function buildDay62() {
  const paragraphs = [
    {
      id: "p1",
      text: "윤동주의 시는 식민지 시대 한국 문학에서 내면적 성찰과 윤리적 자각을 가장 순수한 형태로 구현한 문학적 성취로 평가받고 있다. 그의 시적 화자는 외부 현실에 대한 직접적인 저항을 선언하기보다 자신의 내면을 끊임없이 성찰하며, 부끄러움과 괴로움이라는 정서를 통해 시대적 양심의 문제를 제기한다. 「서시」에서 드러나는 '죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를'이라는 다짐은 외부 세계의 압도적 폭력 앞에서 도덕적 순결을 지키려는 개인적 결의이자, 동시에 양심적 지식인의 보편적 윤리 선언으로 읽힐 수 있다. 이러한 내면 지향적 시 세계는 함성과 구호로 대표되는 직접적 저항 문학과는 구별되는 '조용한 저항'의 미학을 형성하며, 그 정신적 깊이에서 오히려 더 강렬한 울림을 만들어낸다."
    },
    {
      id: "p2",
      text: "윤동주 시의 핵심적 주제 의식은 자아의 분열과 그 극복이라는 틀로 파악할 수 있다. 「자화상」에서 화자는 우물 속에 비친 자신의 모습을 바라보면서 미워하다가 다시 그리워하는 양가적 감정을 드러내는데, 이는 현실 속의 나와 이상적인 나 사이의 간극에서 발생하는 존재론적 긴장의 표현이다. 식민지라는 비정상적 현실 속에서 타협하며 살아가는 현실의 자아와 양심의 자아가 끊임없이 대립하고 갈등하는 것이 윤동주 시의 핵심 구조를 이룬다. 이러한 자아 분열의 형상화는 단순한 개인적 고뇌가 아니라 식민지 지식인 전체가 겪는 정체성 위기의 알레고리이다."
    },
    {
      id: "p3",
      text: "윤동주의 시에서 별, 바람, 하늘과 같은 자연적 이미지는 단순한 서정적 배경이 아니라 윤리적 가치를 담지하는 상징 체계로 작동한다. 「별 헤는 밤」에서 화자가 하나에 하나씩 불러보는 별들은 추억, 사랑, 그리움 등 화자의 내밀한 정서적 세계를 구성하는 요소들이자, 암울한 현실 속에서도 지켜야 할 소중한 가치들의 은유이다. 바람이 스치는 감각은 현실의 시련이 화자의 존재에 가하는 물리적 압력을 형상화하며, 그 바람 앞에서도 흔들리지 않으려는 결연한 자세는 윤리적 주체로서의 의지를 드러낸다. 하늘은 인간의 유한한 삶 너머에 존재하는 초월적 가치의 공간으로, 화자가 지향하는 도덕적 이상의 형상이다. 이처럼 자연 이미지에 윤리적 의미를 부여하는 방식은 윤동주 시의 가장 독특한 미학적 전략이라 할 수 있다."
    },
    {
      id: "p4",
      text: "윤동주의 문학사적 의의는 저항의 방식을 확장하였다는 점에서 특별하다. 일제 말기의 극심한 검열과 탄압 속에서 그는 직접적 정치 언어를 사용하지 않으면서도 양심과 수치의 정서를 통해 지배 질서에 대한 근원적 불복종의 태도를 표현하였다. 이러한 전략은 검열의 망을 우회하면서도 시적 진실성을 훼손하지 않는 이중적 효과를 거두었다. 그의 시가 해방 이후에 발견되어 널리 읽히게 된 것은 그 자체로 식민지 시대의 억압된 양심이 역사적으로 복원되는 상징적 사건이었다. 오늘날 윤동주의 시는 특정 시대의 산물을 넘어서 인간이 부당한 현실 앞에서 어떻게 자기 자신의 도덕적 존엄을 지킬 수 있는가라는 보편적 물음에 대한 응답으로 계속 읽히고 있으며, 이는 그의 시가 시대를 초월한 영속적 가치를 지닌 문학임을 증명한다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 62 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 윤동주 시의 문학적 성취로 제시된 것은?",
      choices: [
        { id: "A", text: "내면적 성찰과 윤리적 자각을 가장 순수한 형태로 구현하였다" },
        { id: "B", text: "외부 현실에 대한 직접적 저항을 강렬하게 선언하였다" },
        { id: "C", text: "민족 공동체의 집단적 정서를 서사적으로 형상화하였다" },
        { id: "D", text: "모더니즘 기법을 도입하여 언어 실험의 새로운 지평을 열었다" }
      ],
      answerId: "A"
    },
    'p0_s3': {
      prompt: "하이라이트된 문장에서 윤동주 시의 미학적 특성으로 적절한 것은?",
      choices: [
        { id: "A", text: "직접적 저항 문학과 구별되는 '조용한 저항'의 미학을 형성한다" },
        { id: "B", text: "함성과 구호를 활용한 선동적 저항의 미학을 계승한다" },
        { id: "C", text: "현실 도피적 자연 예찬의 미학을 구축한다" },
        { id: "D", text: "객관적 사실 기록을 통한 다큐멘터리적 미학을 추구한다" }
      ],
      answerId: "A"
    },
    'p1_s0': {
      prompt: "하이라이트된 문장에서 윤동주 시의 핵심적 주제 의식으로 제시된 것은?",
      choices: [
        { id: "A", text: "자아의 분열과 그 극복이다" },
        { id: "B", text: "자연과 인간의 조화로운 합일이다" },
        { id: "C", text: "민족적 정체성의 회복과 독립 의지이다" },
        { id: "D", text: "근대 문명에 대한 비판과 전통 회귀이다" }
      ],
      answerId: "A"
    },
    'p1_s2': {
      prompt: "하이라이트된 문장에서 윤동주 시의 핵심 구조를 이루는 갈등 양상은?",
      choices: [
        { id: "A", text: "현실의 자아와 양심의 자아가 끊임없이 대립하고 갈등한다" },
        { id: "B", text: "개인의 이상과 사회적 의무가 조화롭게 통합된다" },
        { id: "C", text: "과거의 기억과 미래의 전망이 시간적으로 교차한다" },
        { id: "D", text: "도시적 감수성과 농촌적 서정이 공간적으로 대비된다" }
      ],
      answerId: "A"
    },
    'p2_s0': {
      prompt: "하이라이트된 문장에서 윤동주 시의 자연 이미지가 지닌 기능으로 적절한 것은?",
      choices: [
        { id: "A", text: "단순한 서정적 배경이 아니라 윤리적 가치를 담지하는 상징 체계로 작동한다" },
        { id: "B", text: "자연 과학적 관찰에 기반한 객관적 묘사의 대상이 된다" },
        { id: "C", text: "화자의 정서와 무관한 장식적 배경으로만 기능한다" },
        { id: "D", text: "현실 도피를 위한 유토피아적 공간으로만 제시된다" }
      ],
      answerId: "A"
    },
    'p2_s4': {
      prompt: "하이라이트된 문장에서 '하늘'이 상징하는 의미로 적절한 것은?",
      choices: [
        { id: "A", text: "화자가 지향하는 도덕적 이상의 형상이다" },
        { id: "B", text: "화자가 도달할 수 없는 절망의 공간이다" },
        { id: "C", text: "식민지 지배 권력의 억압적 시선을 상징한다" },
        { id: "D", text: "자연 그 자체의 물리적 아름다움을 나타낸다" }
      ],
      answerId: "A"
    },
    'p3_s0': {
      prompt: "하이라이트된 문장에서 윤동주의 문학사적 의의로 제시된 핵심은?",
      choices: [
        { id: "A", text: "저항의 방식을 확장하였다는 점이다" },
        { id: "B", text: "한국어의 문법적 규범을 확립하였다는 점이다" },
        { id: "C", text: "서양 시 형식을 완벽하게 이식하였다는 점이다" },
        { id: "D", text: "민족주의 운동의 실천적 지침을 제공하였다는 점이다" }
      ],
      answerId: "A"
    },
    'p3_s4': {
      prompt: "하이라이트된 문장에서 윤동주 시가 오늘날에도 읽히는 이유로 적절한 것은?",
      choices: [
        { id: "A", text: "부당한 현실 앞에서 도덕적 존엄을 지키는 보편적 물음에 대한 응답이기 때문이다" },
        { id: "B", text: "일제 강점기의 역사적 사실을 정확하게 기록한 사료적 가치 때문이다" },
        { id: "C", text: "한국어의 아름다움을 가장 완벽하게 보여주는 언어적 모범이기 때문이다" },
        { id: "D", text: "현대 시의 실험적 기법을 선구적으로 개척한 형식적 혁신 때문이다" }
      ],
      answerId: "A"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "윤동주 시의 내면적 성찰과 '조용한 저항'의 미학적 특성" },
        { id: "B", text: "한용운 시에 나타나는 불교적 세계관과 님의 의미" },
        { id: "C", text: "김소월 시의 민요적 율격과 이별 정서의 형상화" },
        { id: "D", text: "이육사 시에 드러나는 투쟁적 저항 의식과 광야의 상징" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "자아 분열의 형상화와 식민지 지식인의 정체성 위기에 대한 알레고리" },
        { id: "B", text: "서정주 시에 나타나는 생명의 역동성과 자화상의 의미" },
        { id: "C", text: "백석 시의 토속적 이미지와 공동체적 삶의 서정" },
        { id: "D", text: "정지용 시의 감각적 이미지즘과 언어 조탁의 기법" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "별·바람·하늘 이미지에 윤리적 의미를 부여하는 독특한 상징 체계" },
        { id: "B", text: "조지훈 시에 나타나는 전통 미학과 고전적 정서의 계승" },
        { id: "C", text: "김수영 시의 참여적 자유 의식과 현대적 저항 정신" },
        { id: "D", text: "박목월 시의 자연 친화적 목가와 향토적 서정" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "검열 우회적 저항 전략의 문학사적 의의와 시대 초월적 보편성" },
        { id: "B", text: "신동엽 시의 역사 의식과 민중적 서사시의 전통" },
        { id: "C", text: "김지하 시의 풍자적 저항과 민주화 운동의 문학적 표현" },
        { id: "D", text: "황동규 시의 존재론적 탐구와 현대시의 지적 경향" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "「서시」에서 화자가 죽는 날까지 지키고자 하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "부끄럼이 없기를")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「자화상」에서 화자가 자신의 모습을 비추어 보는 대상은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "우물")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "윤동주 시에서 화자의 존재에 가하는 현실의 시련을 형상화하는 자연 이미지는?",
      answerRanges: [findRange(paragraphs, "p3", "바람")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "「별 헤는 밤」에서 화자가 하나에 하나씩 불러보는 대상은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "별들")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "윤동주가 검열을 우회하면서 저항 의식을 표현한 정서적 수단 두 가지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "양심과 수치")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "윤동주 시가 시대를 초월하여 던지는 보편적 물음의 핵심 주제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "도덕적 존엄")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(62, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(62, "LITERATURE", content);
}

// ── Day 63: 비문학 (NONFICTION, 홀수) ──
// 주제: 열역학 법칙과 엔트로피
function buildDay63() {
  const paragraphs = [
    {
      id: "p1",
      text: "열역학은 에너지의 전환과 흐름을 다루는 물리학의 핵심 분야로, 그 법칙들은 우주의 가장 근본적인 작동 원리를 기술한다. 열역학 제1법칙은 에너지 보존의 법칙으로, 에너지는 형태를 바꿀 수 있으나 새로 생성되거나 완전히 소멸될 수 없다는 원리를 선언한다. 이 법칙에 따르면 고립된 계에서 에너지의 총량은 항상 일정하게 유지되며, 열에너지가 역학적 에너지로 전환되거나 그 반대의 과정이 일어나더라도 전체 에너지의 양은 변하지 않는다. 에너지 보존 법칙은 영구 기관의 제1종, 즉 에너지를 무한히 공급받지 않고도 영원히 작동하는 장치의 불가능성을 이론적으로 확립하였으며, 이는 모든 공학적 시스템 설계의 기본 전제로 기능하고 있다."
    },
    {
      id: "p2",
      text: "열역학 제2법칙은 에너지 전환의 방향성에 관한 법칙으로, 자연계에서 발생하는 모든 과정은 엔트로피가 증가하는 방향으로 진행된다는 원리를 제시한다. 엔트로피는 계의 무질서도 또는 에너지의 분산 정도를 나타내는 물리량으로, 고온의 물체에서 저온의 물체로 열이 자발적으로 이동하지만 그 반대는 외부 에너지 없이 일어나지 않는 비가역적 현상이 대표적 사례이다. 커피 한 잔에 떨어뜨린 크림이 균일하게 퍼져나가는 과정은 자발적이지만, 퍼진 크림이 다시 한 점으로 모이는 과정은 자발적으로 일어나지 않으며, 이는 미시 상태의 수가 더 많은 분산된 배열로 계가 진행하는 통계적 필연성에 기인한다. 열역학 제2법칙은 열을 완전히 일로 전환하는 장치의 불가능성을 선언하며, 모든 에너지 전환에서 일부가 불가피하게 사용 불가능한 형태로 퇴화함을 의미한다."
    },
    {
      id: "p3",
      text: "엔트로피 개념은 물리학을 넘어서 정보 이론, 생물학, 경제학 등 다양한 학문 분야로 확장되어 적용되고 있다. 클로드 섀넌은 1948년에 정보 엔트로피라는 개념을 도입하여 메시지의 정보량을 정량적으로 측정하는 틀을 제시하였는데, 이는 열역학적 엔트로피와 수학적 구조가 동일하다는 점에서 주목받았다. 생물학에서 생명체는 외부에서 에너지를 섭취하여 내부 질서를 유지하는 개방 시스템으로 이해되며, 이러한 국소적 엔트로피 감소는 주변 환경의 엔트로피 증가를 대가로 이루어지므로 열역학 제2법칙에 위배되지 않는다. 슈뢰딩거는 「생명이란 무엇인가」에서 생명체를 네겐트로피, 즉 음의 엔트로피를 섭취하여 질서를 유지하는 존재로 정의함으로써 물리학과 생물학의 접점을 탐색하였다."
    },
    {
      id: "p4",
      text: "열역학 법칙은 우주의 궁극적 운명에 관한 철학적 문제를 제기한다. 엔트로피가 지속적으로 증가하는 우주에서 모든 에너지가 균일하게 분산되면 온도 차이가 사라지고 유용한 일을 수행할 수 없는 열적 평형 상태에 도달하게 되는데, 이를 열 죽음이라 한다. 이 전망은 19세기 물리학자들에게 깊은 불안을 야기하였으며, 우주의 목적론적 해석에 심각한 도전을 제기하였다. 그러나 현대 물리학은 우주가 팽창하고 있으며 국소적으로 중력의 작용에 의해 별과 은하 같은 복잡한 구조가 형성될 수 있음을 밝혀냈고, 이는 전체적인 엔트로피 증가 속에서도 국소적 질서의 생성이 가능함을 보여준다. 따라서 열역학 법칙은 우주의 종말을 예언하는 비관적 원리가 아니라, 에너지와 질서가 끊임없이 재배치되는 동적 과정의 근본 규칙으로 이해되어야 한다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 63 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 열역학의 학문적 위상으로 적절한 것은?",
      choices: [
        { id: "A", text: "에너지의 전환과 흐름을 다루는 물리학의 핵심 분야이다" },
        { id: "B", text: "물질의 화학적 구성을 분석하는 화학의 기초 이론이다" },
        { id: "C", text: "천체의 운동 법칙을 설명하는 천문학의 핵심 영역이다" },
        { id: "D", text: "미시적 입자의 양자 상태를 기술하는 현대 물리학의 분야이다" }
      ],
      answerId: "A"
    },
    'p0_s3': {
      prompt: "하이라이트된 문장에서 에너지 보존 법칙이 확립한 것으로 적절한 것은?",
      choices: [
        { id: "A", text: "영구 기관의 제1종이 불가능하다는 이론적 근거를 확립하였다" },
        { id: "B", text: "에너지를 무한히 증폭하는 기술적 가능성을 열었다" },
        { id: "C", text: "열에너지만이 유일한 에너지 형태임을 입증하였다" },
        { id: "D", text: "역학적 에너지가 열에너지보다 항상 효율적임을 증명하였다" }
      ],
      answerId: "A"
    },
    'p1_s0': {
      prompt: "하이라이트된 문장에서 열역학 제2법칙의 핵심 원리로 적절한 것은?",
      choices: [
        { id: "A", text: "자연계의 모든 과정은 엔트로피가 증가하는 방향으로 진행된다" },
        { id: "B", text: "에너지의 총량은 항상 일정하게 유지된다" },
        { id: "C", text: "절대 영도에서 모든 물질의 엔트로피는 0이 된다" },
        { id: "D", text: "열역학적 평형 상태에서 모든 과정이 정지한다" }
      ],
      answerId: "A"
    },
    'p1_s2': {
      prompt: "하이라이트된 문장에서 크림이 퍼져나가는 과정이 자발적인 이유로 적절한 것은?",
      choices: [
        { id: "A", text: "미시 상태의 수가 더 많은 분산된 배열로 진행하는 통계적 필연성에 기인한다" },
        { id: "B", text: "크림의 화학적 성분이 물과 결합하여 새로운 화합물을 형성하기 때문이다" },
        { id: "C", text: "중력의 작용에 의해 무거운 크림이 아래로 가라앉기 때문이다" },
        { id: "D", text: "커피의 열에너지가 크림을 분해하여 균일한 용액을 만들기 때문이다" }
      ],
      answerId: "A"
    },
    'p2_s0': {
      prompt: "하이라이트된 문장에서 엔트로피 개념이 확장된 학문 분야로 적절하지 않은 것은?",
      choices: [
        { id: "A", text: "고고학, 미술사학, 음악학 분야이다" },
        { id: "B", text: "정보 이론 분야이다" },
        { id: "C", text: "생물학 분야이다" },
        { id: "D", text: "경제학 분야이다" }
      ],
      answerId: "A"
    },
    'p2_s2': {
      prompt: "하이라이트된 문장에서 생명체의 국소적 엔트로피 감소가 가능한 이유로 적절한 것은?",
      choices: [
        { id: "A", text: "주변 환경의 엔트로피 증가를 대가로 이루어지기 때문이다" },
        { id: "B", text: "생명체가 열역학 제2법칙의 적용을 받지 않기 때문이다" },
        { id: "C", text: "생명체 내부에서 에너지가 자발적으로 생성되기 때문이다" },
        { id: "D", text: "생명체의 물질 구성이 물리 법칙과 독립적이기 때문이다" }
      ],
      answerId: "A"
    },
    'p3_s1': {
      prompt: "하이라이트된 문장에서 모든 에너지가 균일하게 분산된 최종 상태를 무엇이라 하는가?",
      choices: [
        { id: "A", text: "열 죽음이라 한다" },
        { id: "B", text: "빅 크런치라 한다" },
        { id: "C", text: "절대 영도라 한다" },
        { id: "D", text: "양자 붕괴라 한다" }
      ],
      answerId: "A"
    },
    'p3_s4': {
      prompt: "하이라이트된 문장에서 열역학 법칙에 대한 현대적 이해로 적절한 것은?",
      choices: [
        { id: "A", text: "에너지와 질서가 끊임없이 재배치되는 동적 과정의 근본 규칙이다" },
        { id: "B", text: "우주의 종말을 불가피하게 예언하는 비관적 원리이다" },
        { id: "C", text: "인간의 기술 발전으로 궁극적으로 극복될 수 있는 임시적 제약이다" },
        { id: "D", text: "오직 고립된 실험실 환경에서만 적용되는 이론적 원리이다" }
      ],
      answerId: "A"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "열역학 제1법칙(에너지 보존)의 원리와 영구 기관 불가능성의 확립" },
        { id: "B", text: "뉴턴 역학의 세 가지 운동 법칙과 만유인력의 발견" },
        { id: "C", text: "전자기학의 발전과 맥스웰 방정식의 통일적 체계" },
        { id: "D", text: "상대성 이론의 핵심 원리와 시공간의 곡률 개념" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "열역학 제2법칙과 엔트로피 증가의 비가역적 방향성" },
        { id: "B", text: "양자역학의 불확정성 원리와 파동-입자 이중성" },
        { id: "C", text: "핵분열과 핵융합의 메커니즘과 에너지 방출 원리" },
        { id: "D", text: "초전도 현상의 발견과 극저온 물리학의 발전" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "엔트로피 개념의 학제적 확장과 생명체의 질서 유지 메커니즘" },
        { id: "B", text: "카오스 이론의 등장과 비선형 동역학적 체계의 이해" },
        { id: "C", text: "나노기술의 원리와 물질의 미시적 구조 제어 방법" },
        { id: "D", text: "유전 공학의 발전과 DNA 재조합 기술의 윤리적 쟁점" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "열 죽음 가설과 국소적 질서 생성의 가능성에 대한 현대적 이해" },
        { id: "B", text: "암흑 물질의 존재 증거와 우주 구조 형성에 미치는 영향" },
        { id: "C", text: "인공지능의 에너지 소비와 지속 가능한 컴퓨팅의 과제" },
        { id: "D", text: "기후 변화의 물리적 메커니즘과 탄소 순환의 교란" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "에너지는 형태를 바꿀 수 있으나 새로 생성되거나 소멸될 수 없다는 법칙의 이름은?",
      answerRanges: [findRange(paragraphs, "p1", "에너지 보존의 법칙")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "계의 무질서도 또는 에너지의 분산 정도를 나타내는 물리량의 이름은?",
      answerRanges: [findRange(paragraphs, "p2", "엔트로피")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "1948년에 정보 엔트로피 개념을 도입한 학자의 이름은?",
      answerRanges: [findRange(paragraphs, "p3", "클로드 섀넌")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "슈뢰딩거가 생명체를 정의할 때 사용한, 음의 엔트로피를 뜻하는 용어는?",
      answerRanges: [findRange(paragraphs, "p3", "네겐트로피")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "모든 에너지가 균일하게 분산되어 유용한 일을 수행할 수 없는 상태를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "열 죽음")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "전체적 엔트로피 증가 속에서도 국소적으로 복잡한 구조를 형성하게 하는 힘은?",
      answerRanges: [findRange(paragraphs, "p4", "중력")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(63, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(63, "NONFICTION", content);
}

// ── Day 64: 문학 (LITERATURE, 짝수) ──
// 주제: 김승옥 「무진기행」의 문학적 분석
function buildDay64() {
  const paragraphs = [
    {
      id: "p1",
      text: "김승옥의 중편소설 「무진기행」은 1964년에 발표되어 한국 문학사에서 1960년대 감수성을 대표하는 작품으로 자리매김해 왔다. 이 소설은 서울에서 성공적인 삶을 영위하던 주인공 윤희중이 처가의 제약회사 전무 승진을 앞두고 고향 무진을 방문하는 여정을 다루고 있다. 무진은 안개로 뒤덮인 소도시로, 주인공이 어린 시절을 보낸 공간이자 그가 떠나온 과거의 자아가 잠들어 있는 장소이다. 서울로 상징되는 현재의 삶은 세속적 성공과 타협으로 점철되어 있으며, 무진으로의 귀환은 잃어버린 자아의 순수성과 대면하는 내면적 여행의 성격을 지닌다."
    },
    {
      id: "p2",
      text: "이 소설에서 안개는 가장 중요한 상징적 장치로 기능하며, 작품의 주제 의식을 응축적으로 드러낸다. 무진을 가득 채운 안개는 현실과 환상의 경계를 모호하게 만들어 주인공이 과거의 감정과 기억 속으로 빠져들게 하는 매개체이다. 안개 속에서 윤희중은 일상적 합리성과 사회적 정체성으로부터 일시적으로 해방되어 자신의 진정한 욕망과 감정에 접근하게 되는데, 이는 안개가 이성적 판단을 유보하게 만드는 심리적 환경을 조성하기 때문이다. 그러나 안개는 동시에 방향 감각의 상실, 정체성의 혼란, 도덕적 판단력의 약화라는 부정적 의미도 내포하고 있어, 안개 속에서의 경험이 진정한 자아 발견인지 아니면 자기기만적 일탈인지를 모호하게 만드는 양가적 기능을 수행한다."
    },
    {
      id: "p3",
      text: "무진에서 윤희중이 만나는 하인숙이라는 여인과의 관계는 작품의 핵심적 서사 축을 형성한다. 하인숙은 서울의 삶에서 윤희중이 억압해온 감정적 진솔함과 존재론적 자유를 체현하는 인물로, 그녀와의 짧은 만남은 윤희중에게 잊혀진 자아의 가능성을 일깨워준다. 그러나 윤희중은 결국 하인숙에게 편지 한 장을 남기고 서울로 돌아가는데, 이 선택은 세속적 성공이라는 현실의 무게가 내면의 진정성에 대한 열망을 압도하는 순간을 보여준다. 편지를 쓰는 행위는 떠남에 대한 최소한의 윤리적 제스처이면서 동시에 완전한 결별의 선언이며, 이 모순적 행위 속에서 윤희중의 자기 분열이 극적으로 응축된다. 서울행 버스에 오르는 마지막 장면에서 윤희중이 창밖의 안개를 바라보는 시선에는 안도와 상실이 동시에 깃들어 있으며, 이는 근대적 주체가 자유와 안정 사이에서 겪는 영원한 딜레마를 형상화한 것이다."
    },
    {
      id: "p4",
      text: "「무진기행」의 문학사적 의의는 한국 소설에서 내면 심리의 미세한 결을 감각적 문체로 포착하는 새로운 서술 방식을 개척하였다는 점에 있다. 김승옥 이전의 한국 소설이 주로 사회적 현실이나 역사적 사건에 초점을 맞추었다면, 김승옥은 개인의 감각과 정서, 순간적인 인상과 분위기를 정교하게 포착하여 소설의 주된 질료로 삼았다. 안개에 젖은 공기의 촉감, 바다 냄새의 기억, 밤거리의 쓸쓸한 정경 등을 묘사하는 그의 문장들은 시적 함축성과 서사적 기능을 동시에 달성하며, 이러한 감각적 서술은 이후 한국 소설의 문체적 전환에 결정적 영향을 미쳤다. 이 작품은 한국 문학에서 근대적 개인의 내면이 독자적인 서사적 영토로 확립되는 전환점을 표시하며, 성장과 타협, 순수와 세속 사이의 긴장이라는 보편적 주제를 통해 시대를 초월한 공감대를 형성하고 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 64 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 「무진기행」의 문학사적 위치로 적절한 것은?",
      choices: [
        { id: "A", text: "1960년대 감수성을 대표하는 작품이다" },
        { id: "B", text: "1930년대 모더니즘 문학의 정점을 보여주는 작품이다" },
        { id: "C", text: "1970년대 민중 문학 운동의 출발점이 된 작품이다" },
        { id: "D", text: "1950년대 전후 문학의 대표작으로 전쟁의 참상을 다룬 작품이다" }
      ],
      answerId: "A"
    },
    'p0_s3': {
      prompt: "하이라이트된 문장에서 무진으로의 귀환이 지닌 성격으로 적절한 것은?",
      choices: [
        { id: "A", text: "잃어버린 자아의 순수성과 대면하는 내면적 여행이다" },
        { id: "B", text: "경제적 성공을 위한 사업적 탐사의 성격을 지닌다" },
        { id: "C", text: "가문의 역사를 기록하기 위한 학술적 조사의 여정이다" },
        { id: "D", text: "도시 생활의 피로를 회복하기 위한 단순한 휴양 여행이다" }
      ],
      answerId: "A"
    },
    'p1_s1': {
      prompt: "하이라이트된 문장에서 안개의 서사적 기능으로 적절한 것은?",
      choices: [
        { id: "A", text: "현실과 환상의 경계를 모호하게 만들어 과거의 기억 속으로 빠져들게 한다" },
        { id: "B", text: "주인공의 시야를 차단하여 외부 세계와의 물리적 단절을 만든다" },
        { id: "C", text: "자연 현상의 과학적 원리를 설명하는 배경적 요소로 기능한다" },
        { id: "D", text: "등장인물 간의 갈등을 해소하는 화해의 매개체 역할을 한다" }
      ],
      answerId: "A"
    },
    'p1_s3': {
      prompt: "하이라이트된 문장에서 안개의 양가적 기능으로 적절한 것은?",
      choices: [
        { id: "A", text: "자아 발견인지 자기기만적 일탈인지를 모호하게 만든다" },
        { id: "B", text: "긍정적으로는 성공을, 부정적으로는 실패를 상징한다" },
        { id: "C", text: "낮에는 희망을, 밤에는 절망을 의미하는 시간적 상징이다" },
        { id: "D", text: "주인공에게는 위안을, 다른 인물에게는 위협을 주는 이중 기능이다" }
      ],
      answerId: "A"
    },
    'p2_s0': {
      prompt: "하이라이트된 문장에서 하인숙이 윤희중에게 체현하는 것으로 적절한 것은?",
      choices: [
        { id: "A", text: "억압해온 감정적 진솔함과 존재론적 자유이다" },
        { id: "B", text: "세속적 성공과 사회적 지위 상승의 가능성이다" },
        { id: "C", text: "고향에 대한 향수와 유년 시절의 순수한 기억이다" },
        { id: "D", text: "현실적 판단력과 실용적 지혜의 구현이다" }
      ],
      answerId: "A"
    },
    'p2_s3': {
      prompt: "하이라이트된 문장에서 편지를 쓰는 행위의 모순적 의미로 적절한 것은?",
      choices: [
        { id: "A", text: "최소한의 윤리적 제스처이면서 동시에 완전한 결별의 선언이다" },
        { id: "B", text: "사랑의 고백이자 동시에 재회의 약속을 담고 있다" },
        { id: "C", text: "자기 성찰의 기록이자 미래에 대한 희망의 표현이다" },
        { id: "D", text: "사회적 관습의 이행이자 개인적 무관심의 표출이다" }
      ],
      answerId: "A"
    },
    'p3_s0': {
      prompt: "하이라이트된 문장에서 「무진기행」의 문학사적 의의로 제시된 것은?",
      choices: [
        { id: "A", text: "내면 심리의 미세한 결을 감각적 문체로 포착하는 새로운 서술 방식을 개척하였다" },
        { id: "B", text: "사회적 현실의 모순을 고발하는 참여 문학의 전범을 제시하였다" },
        { id: "C", text: "전통적 서사 구조를 완성하여 한국 소설의 형식적 기틀을 마련하였다" },
        { id: "D", text: "구어체 문장의 활용을 통해 한국어의 문법적 규범을 확립하였다" }
      ],
      answerId: "A"
    },
    'p3_s3': {
      prompt: "하이라이트된 문장에서 이 작품이 한국 문학사에 표시하는 전환점은 무엇인가?",
      choices: [
        { id: "A", text: "근대적 개인의 내면이 독자적인 서사적 영토로 확립되는 전환점이다" },
        { id: "B", text: "한국 소설이 세계 시장에 진출하는 국제화의 출발점이다" },
        { id: "C", text: "전통 문학과 현대 문학의 형식적 단절이 완성되는 지점이다" },
        { id: "D", text: "민족주의 문학에서 탈민족주의 문학으로 전환되는 분기점이다" }
      ],
      answerId: "A"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "주인공의 무진 귀환과 서울/무진으로 상징되는 현재와 과거의 대비" },
        { id: "B", text: "황석영의 「삼포 가는 길」에 나타나는 산업화와 유랑의 서사" },
        { id: "C", text: "최인훈의 「광장」에 드러나는 이념적 갈등과 제3의 선택" },
        { id: "D", text: "이청준의 「당신들의 천국」에 나타나는 권력과 유토피아의 문제" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "안개의 양가적 상징을 통한 현실과 환상, 이성과 감정의 경계 흐림" },
        { id: "B", text: "조세희의 「난장이가 쏘아올린 작은 공」에 나타나는 계급적 모순" },
        { id: "C", text: "박경리의 「토지」에 드러나는 역사적 격변과 인간 군상" },
        { id: "D", text: "이문열의 「우리들의 일그러진 영웅」에 나타나는 권력의 알레고리" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "하인숙과의 관계와 윤희중의 자기 분열, 자유와 안정 사이의 딜레마" },
        { id: "B", text: "윤흥길의 「장마」에 나타나는 이념 대립과 가족 공동체의 치유" },
        { id: "C", text: "박완서의 소설에 드러나는 전쟁 트라우마와 중산층 여성의 삶" },
        { id: "D", text: "신경숙의 「엄마를 부탁해」에 나타나는 모성과 기억의 서사" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "감각적 문체의 개척과 한국 소설에서 개인 내면의 서사적 영토 확립" },
        { id: "B", text: "한강의 「채식주의자」에 나타나는 폭력과 저항의 알레고리" },
        { id: "C", text: "오정희의 소설에 드러나는 여성적 감수성과 일상의 심연" },
        { id: "D", text: "김훈의 「칼의 노래」에 나타나는 역사적 인물의 내면 재구성" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "주인공 윤희중이 서울에서 승진을 앞두고 있는 직책은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "전무")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "무진을 상징적으로 뒤덮고 있는 자연 현상은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "안개")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "윤희중이 무진에서 만나는 여인의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "하인숙")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "윤희중이 하인숙에게 남기고 서울로 돌아갈 때 쓴 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "편지")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "김승옥이 소설의 주된 질료로 삼은 것은 기존 소설과 달리 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "개인의 감각과 정서")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이 작품이 이후 한국 소설에 결정적 영향을 미친 서술 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "감각적 서술")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(64, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(64, "LITERATURE", content);
}

// ── Day 65: 비문학 (NONFICTION, 홀수) ──
// 주제: 민주주의와 다수결의 역설
function buildDay65() {
  const paragraphs = [
    {
      id: "p1",
      text: "민주주의의 의사결정 방식으로 가장 널리 채택되고 있는 다수결 원칙은 그 단순성과 직관적 정당성에도 불구하고 심각한 이론적 한계를 지닌다. 18세기 프랑스의 수학자 콩도르세는 투표의 역설이라 불리는 현상을 발견하였는데, 이는 세 명 이상의 유권자가 세 가지 이상의 대안에 대해 투표할 때 다수결의 결과가 순환적 비일관성을 보일 수 있다는 것이다. 예를 들어 유권자 집단이 대안 A를 B보다, B를 C보다, C를 A보다 선호하는 상황이 발생할 수 있으며, 이 경우 다수결은 어떠한 대안도 일관되게 최선으로 선택하지 못하는 교착 상태에 빠지게 된다. 이 역설은 개인의 합리적 선호가 집단적 의사결정으로 집합될 때 반드시 합리적 결과를 산출하는 것은 아니라는 심대한 함의를 지니며, 민주적 의사결정의 수학적 토대에 근본적 의문을 제기하였다."
    },
    {
      id: "p2",
      text: "콩도르세의 역설이 제기한 문제는 20세기에 애로우의 불가능성 정리에 의해 더욱 심화되었다. 애로우는 1951년에 발표한 이 정리에서, 세 가지 이상의 대안이 존재할 때 합리적 투표 시스템의 공정성 조건들을 동시에 만족시키는 사회적 선택 함수는 독재적 규칙을 제외하면 존재하지 않음을 수학적으로 증명하였다. 여기서 공정성 조건이란 파레토 효율성, 비독재성, 무관한 대안으로부터의 독립성 등을 포함하는데, 이 조건들은 개별적으로는 합리적이고 당연해 보이지만 논리적으로 동시에 충족될 수 없다는 것이 정리의 핵심이다. 애로우의 불가능성 정리는 완벽한 민주적 투표 시스템이 원리적으로 불가능하다는 결론을 도출하여 정치학과 경제학에 지대한 영향을 미쳤다."
    },
    {
      id: "p3",
      text: "다수결의 또 다른 한계는 다수의 횡포라 불리는 문제에서 드러난다. 단순 다수결은 과반수의 의사를 관철시키는 데 효과적이지만, 소수의 근본적 권리나 핵심적 이익이 침해될 수 있다는 위험을 구조적으로 내포하고 있다. 역사적으로 민주적 다수의 결정이 특정 인종, 종교, 성별에 대한 차별을 정당화하는 데 이용된 사례는 무수히 존재하며, 이는 다수결이 정의와 동일시될 수 없음을 보여준다. 밀은 「자유론」에서 다수의 여론이 개인의 자유를 억압하는 사회적 전제가 정치적 전제 못지않게 위험하다고 경고하였으며, 이러한 통찰은 현대 입헌 민주주의에서 기본권의 헌법적 보장과 사법 심사 제도의 이론적 근거가 되었다."
    },
    {
      id: "p4",
      text: "이러한 한계에도 불구하고 다수결은 현실적으로 대체 불가능한 의사결정 방식으로 기능하고 있으며, 그 한계를 보완하기 위한 다양한 제도적 장치들이 발전해 왔다. 헌법에 의한 기본권 보장은 다수결로도 침해할 수 없는 가치의 영역을 설정함으로써 다수의 횡포를 구조적으로 방지하고, 위헌법률심사 제도는 다수의 결정이 헌법적 가치에 부합하는지를 독립적 기관이 검증하는 견제 장치로 작동한다. 숙의 민주주의 이론은 단순한 선호의 집합이 아니라 시민 간의 공적 토론과 상호 설득을 통해 선호 자체를 변형시키는 과정을 민주주의의 본질로 파악함으로써, 다수결의 형식적 한계를 넘어서는 실질적 민주주의의 가능성을 모색하고 있다. 따라서 민주주의의 건강성은 다수결이라는 형식 자체보다 그 형식을 둘러싼 숙의의 질, 소수자 보호의 제도적 장치, 시민의 비판적 참여 역량에 의해 결정된다고 할 수 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 65 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 다수결 원칙의 양면적 성격으로 적절한 것은?",
      choices: [
        { id: "A", text: "단순성과 직관적 정당성에도 불구하고 심각한 이론적 한계를 지닌다" },
        { id: "B", text: "복잡성과 정교함에도 불구하고 실천적 효용성이 부족하다" },
        { id: "C", text: "수학적 완벽성에도 불구하고 현실적 적용이 어렵다" },
        { id: "D", text: "역사적 전통에도 불구하고 현대 사회에서 더 이상 유효하지 않다" }
      ],
      answerId: "A"
    },
    'p0_s1': {
      prompt: "하이라이트된 문장에서 투표의 역설을 발견한 인물과 그 핵심 내용은?",
      choices: [
        { id: "A", text: "콩도르세가 발견하였으며 다수결 결과가 순환적 비일관성을 보일 수 있다는 것이다" },
        { id: "B", text: "애로우가 증명하였으며 모든 투표 시스템이 독재적이라는 것이다" },
        { id: "C", text: "밀이 주장하였으며 다수의 의견이 항상 옳다는 것이다" },
        { id: "D", text: "루소가 제안하였으며 일반 의지가 개인 의지에 우선한다는 것이다" }
      ],
      answerId: "A"
    },
    'p1_s0': {
      prompt: "하이라이트된 문장에서 콩도르세 역설의 문제를 심화시킨 학자와 그 이론은?",
      choices: [
        { id: "A", text: "애로우의 불가능성 정리이다" },
        { id: "B", text: "내쉬의 균형 이론이다" },
        { id: "C", text: "코즈의 거래 비용 정리이다" },
        { id: "D", text: "하이에크의 자생적 질서 이론이다" }
      ],
      answerId: "A"
    },
    'p1_s2': {
      prompt: "하이라이트된 문장에서 애로우가 제시한 공정성 조건에 포함되지 않는 것은?",
      choices: [
        { id: "A", text: "다수결의 절대적 우선성이다" },
        { id: "B", text: "파레토 효율성이다" },
        { id: "C", text: "비독재성이다" },
        { id: "D", text: "무관한 대안으로부터의 독립성이다" }
      ],
      answerId: "A"
    },
    'p2_s0': {
      prompt: "하이라이트된 문장에서 다수결의 또 다른 한계로 제시된 문제는?",
      choices: [
        { id: "A", text: "다수의 횡포라 불리는 문제이다" },
        { id: "B", text: "소수의 거부권이라 불리는 문제이다" },
        { id: "C", text: "무관심의 역설이라 불리는 문제이다" },
        { id: "D", text: "정보 비대칭이라 불리는 문제이다" }
      ],
      answerId: "A"
    },
    'p2_s3': {
      prompt: "하이라이트된 문장에서 밀이 「자유론」에서 경고한 내용으로 적절한 것은?",
      choices: [
        { id: "A", text: "다수의 여론이 개인의 자유를 억압하는 사회적 전제가 위험하다" },
        { id: "B", text: "소수의 전문가가 정책을 결정하는 엘리트주의가 바람직하다" },
        { id: "C", text: "경제적 자유가 정치적 자유보다 우선시되어야 한다" },
        { id: "D", text: "국가의 개입이 최소화될 때 개인의 행복이 극대화된다" }
      ],
      answerId: "A"
    },
    'p3_s1': {
      prompt: "하이라이트된 문장에서 다수의 횡포를 구조적으로 방지하는 제도적 장치는?",
      choices: [
        { id: "A", text: "헌법에 의한 기본권 보장이다" },
        { id: "B", text: "행정부의 긴급 명령권이다" },
        { id: "C", text: "국민투표를 통한 직접 민주주의이다" },
        { id: "D", text: "정당 간 합의에 의한 연립 정부 구성이다" }
      ],
      answerId: "A"
    },
    'p3_s2': {
      prompt: "하이라이트된 문장에서 숙의 민주주의가 민주주의의 본질로 파악하는 것은?",
      choices: [
        { id: "A", text: "시민 간의 공적 토론과 상호 설득을 통해 선호를 변형시키는 과정이다" },
        { id: "B", text: "전문가의 과학적 분석에 기초한 합리적 정책 결정이다" },
        { id: "C", text: "각 개인의 고정된 선호를 기계적으로 집합하는 절차이다" },
        { id: "D", text: "선출된 대표자에게 의사결정 권한을 전면적으로 위임하는 것이다" }
      ],
      answerId: "A"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "콩도르세의 투표 역설과 다수결의 순환적 비일관성 문제" },
        { id: "B", text: "국제 연합의 설립 과정과 안전보장이사회의 거부권 제도" },
        { id: "C", text: "고대 그리스 아테네 민주정의 구조와 시민 참여 방식" },
        { id: "D", text: "프랑스 대혁명의 전개와 인권 선언의 역사적 의의" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "애로우의 불가능성 정리와 완벽한 투표 시스템의 원리적 불가능성" },
        { id: "B", text: "게임 이론의 기초와 죄수의 딜레마에 나타나는 협력의 문제" },
        { id: "C", text: "공공 선택 이론의 등장과 관료제의 비효율성에 대한 분석" },
        { id: "D", text: "합리적 무지 가설과 유권자의 정보 비용 문제" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "다수의 횡포 문제와 밀의 자유론에 기초한 입헌적 보장 장치" },
        { id: "B", text: "권력 분립의 원리와 삼권 상호 간의 견제와 균형" },
        { id: "C", text: "시민 불복종의 정당성과 소로·간디·킹의 사상적 계보" },
        { id: "D", text: "선거 제도의 유형별 비교와 비례대표제의 장단점" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "다수결의 한계를 보완하는 제도적 장치와 숙의 민주주의의 가능성" },
        { id: "B", text: "전자 민주주의의 발전과 디지털 플랫폼을 통한 시민 참여" },
        { id: "C", text: "포퓰리즘의 부상과 대의 민주주의의 위기에 관한 현대적 논의" },
        { id: "D", text: "사회 계약론의 역사적 전개와 홉스·로크·루소의 사상 비교" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "투표의 역설을 발견한 18세기 프랑스 수학자의 이름은?",
      answerRanges: [findRange(paragraphs, "p1", "콩도르세")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "합리적 투표 시스템의 공정성 조건을 동시에 만족시킬 수 없음을 증명한 정리의 이름은?",
      answerRanges: [findRange(paragraphs, "p2", "불가능성 정리")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "다수결이 소수의 권리를 침해하는 위험을 가리키는 용어는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "다수의 횡포")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "「자유론」에서 사회적 전제의 위험을 경고한 사상가의 이름은?",
      answerRanges: [findRange(paragraphs, "p3", "밀")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "시민 간 공적 토론과 상호 설득을 민주주의의 본질로 보는 이론의 이름은?",
      answerRanges: [findRange(paragraphs, "p4", "숙의 민주주의")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "다수결의 결정이 헌법적 가치에 부합하는지 검증하는 제도적 장치는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "위헌법률심사")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(65, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(65, "NONFICTION", content);
}

// ── 메인 실행 ──
function main() {
  console.log('=== 비트겐슈타인2 Day 61~65 콘텐츠 빌드 시작 ===\n');

  const items = [
    buildDay61(),
    buildDay62(),
    buildDay63(),
    buildDay64(),
    buildDay65()
  ];

  // 길이 검증
  let hasWarning = false;
  items.forEach((item) => {
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
    console.log('\n[주의] 검증 경고가 있지만 파일은 생성합니다.\n');
  }

  // 배치 파일 읽기
  console.log('\n배치 파일 읽기...');
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`배치 파일 총 items: ${batchData.items.length}`);

  // Day 61~65는 0-indexed 60~64에 해당
  for (let i = 0; i < 5; i++) {
    const targetIdx = 60 + i;
    const oldItem = batchData.items[targetIdx];
    console.log(`교체: items[${targetIdx}] (Day ${oldItem.day_index}) -> Day ${items[i].day_index}`);
    batchData.items[targetIdx] = items[i];
  }

  // 배치 파일 저장
  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료: ${BATCH_PATH}`);

  // static 파일 생성
  if (!fs.existsSync(STATIC_DIR)) {
    fs.mkdirSync(STATIC_DIR, { recursive: true });
  }
  for (const item of items) {
    const dayStr = String(item.day_index).padStart(3, '0');
    const staticPath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(staticPath, JSON.stringify(item.content, null, 2), 'utf8');
    console.log(`static 파일 저장 완료: ${staticPath}`);
  }

  console.log('\n=== 빌드 완료 ===');
}

main();
