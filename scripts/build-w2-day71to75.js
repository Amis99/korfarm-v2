// 비트겐슈타인2 Day 71~75 콘텐츠 빌더
// 홀수 day = NONFICTION, 짝수 day = LITERATURE
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

function buildTimeline(paragraphs, customQuestions) {
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);
    sents.forEach((sent, si) => {
      stepNum++;
      const range = { paragraphId: para.id, start: sent.start, end: sent.end };
      const key = `${pi}-${si}`;
      let question;

      if (customQuestions[key]) {
        question = customQuestions[key];
      } else {
        // 자동 생성: 다른 문단의 문장으로 오답 구성
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
    const centralTheme = customQuestions[`central-${pi}`];
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

// ── Day 71: 비문학 (NONFICTION, 홀수) ── 주제: 인지심리학 — 작업 기억 모델
function buildDay71() {
  const paragraphs = [
    {
      id: "p1",
      text: "작업 기억이란 정보를 일시적으로 저장하면서 동시에 그 정보를 조작하고 처리하는 인지 체계를 가리킨다. 이 개념은 단순히 정보를 수동적으로 보관하는 단기 기억과 구별되며, 복잡한 인지 활동의 토대가 되는 능동적 처리 기제로 이해된다. 영국의 심리학자 앨런 배들리는 1974년에 작업 기억의 다중 구성 요소 모델을 제안하여 이 분야의 연구에 획기적인 전환점을 마련하였다. 배들리의 모델은 중앙 집행기, 음운 루프, 시공간 잡기장이라는 세 가지 하위 체계로 구성되며, 이후 2000년에 일화적 완충기가 네 번째 구성 요소로 추가되어 현재의 완성된 모델에 이르렀다."
    },
    {
      id: "p2",
      text: "중앙 집행기는 작업 기억 체계 전체를 감독하고 통제하는 주의 조절 시스템으로, 하위 체계들 간의 정보 흐름을 조정하고 과제 수행에 필요한 자원을 배분하는 역할을 담당한다. 음운 루프는 언어적 정보를 일시적으로 보유하는 체계로, 내적 되뇌기를 통해 정보가 소멸되기 전에 재활성화시키는 기능을 수행하며, 전화번호를 잠시 외우거나 외국어 단어를 학습할 때 핵심적으로 작동한다. 시공간 잡기장은 시각적 이미지와 공간적 위치 정보를 일시 저장하며, 머릿속에서 물체를 회전시키거나 지도상의 경로를 탐색하는 등의 공간적 사고에 관여한다. 일화적 완충기는 음운 루프와 시공간 잡기장의 정보를 장기 기억의 정보와 통합하여 일관된 에피소드적 표상을 구성하는 역할을 수행한다."
    },
    {
      id: "p3",
      text: "작업 기억의 용량은 개인마다 차이가 있으며, 이 차이는 독해력, 추론 능력, 학업 성취도 등 다양한 인지 기능의 수행 수준을 예측하는 강력한 변인으로 작용한다. 작업 기억 용량이 큰 사람은 복잡한 문장을 읽으면서 앞부분의 정보를 유지하고 뒷부분과 통합하는 능력이 뛰어나기 때문에 글의 의미를 정확하게 파악하는 데 유리하다. 반대로 작업 기억 용량이 제한적인 경우에는 정보 과부하가 빈번하게 발생하여 핵심 정보와 부수적 정보를 효과적으로 구별하지 못하는 어려움을 겪게 된다. 이러한 연구 결과는 작업 기억의 개인차가 지능의 유동적 측면과 밀접하게 관련되어 있음을 시사하며, 작업 기억 훈련을 통한 인지 능력 향상의 가능성에 대한 활발한 논의를 촉발하였다."
    },
    {
      id: "p4",
      text: "작업 기억 연구는 교육 현장에서 실질적인 적용 가치를 지닌다. 교사가 한꺼번에 과도한 양의 정보를 제시하면 학습자의 작업 기억에 인지적 과부하가 발생하여 학습 효율이 현저히 저하될 수 있다. 이를 방지하기 위해 정보를 의미 있는 단위로 묶어 제시하는 청킹 전략이나 시각 자료와 언어 설명을 동시에 활용하는 이중 부호화 전략이 효과적으로 사용된다. 또한 작업 기억의 부담을 경감시키기 위해 학습 내용을 자동화 수준까지 반복 연습시키는 것도 중요한 교수 전략에 해당하며, 이러한 자동화는 의식적 처리 자원의 소모를 최소화하여 더 복잡한 과제에 자원을 집중할 수 있게 한다. 작업 기억에 대한 이해는 개별 학습자의 인지적 특성에 맞춘 맞춤형 교육을 설계하는 데 필수적인 이론적 기반을 제공하며, 나아가 학습 장애의 진단과 중재에도 핵심적인 역할을 수행하고 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 71 지문 길이: ${len}자`);

  const customQuestions = {
    "0-0": {
      prompt: "하이라이트된 문장에서 작업 기억의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "정보를 일시적으로 저장하면서 동시에 조작하고 처리하는 인지 체계이다" },
        { id: "B", text: "과거의 경험을 장기적으로 보관하는 기억 저장소를 가리킨다" },
        { id: "C", text: "감각 정보를 자동적으로 부호화하는 무의식적 처리 과정이다" },
        { id: "D", text: "반복 학습을 통해 형성되는 절차적 기억의 한 유형이다" }
      ],
      answerId: "A"
    },
    "0-2": {
      prompt: "하이라이트된 문장에서 작업 기억 모델을 제안한 학자와 시기로 적절한 것은?",
      choices: [
        { id: "A", text: "앨런 배들리가 1974년에 다중 구성 요소 모델을 제안하였다" },
        { id: "B", text: "조지 밀러가 1956년에 마법의 숫자 7 이론을 제안하였다" },
        { id: "C", text: "허먼 에빙하우스가 1885년에 망각 곡선 이론을 제안하였다" },
        { id: "D", text: "엔델 툴빙이 1972년에 일화 기억 이론을 제안하였다" }
      ],
      answerId: "A"
    },
    "1-0": {
      prompt: "하이라이트된 문장에서 중앙 집행기의 역할로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "작업 기억 전체를 감독하고 하위 체계 간 정보 흐름을 조정한다" },
        { id: "B", text: "언어적 정보를 내적 되뇌기를 통해 유지시키는 역할을 한다" },
        { id: "C", text: "시각적 이미지를 저장하고 공간적 사고를 담당한다" },
        { id: "D", text: "장기 기억과 단기 기억 사이의 정보를 통합한다" }
      ],
      answerId: "A"
    },
    "1-2": {
      prompt: "하이라이트된 문장에서 시공간 잡기장이 관여하는 인지 활동으로 적절한 것은?",
      choices: [
        { id: "A", text: "물체를 머릿속에서 회전시키거나 지도상 경로를 탐색하는 공간적 사고이다" },
        { id: "B", text: "외국어 단어를 반복적으로 암기하는 언어적 처리 활동이다" },
        { id: "C", text: "과거 경험을 시간 순서대로 회상하는 자전적 기억 활동이다" },
        { id: "D", text: "감정적 정보를 평가하고 정서적 반응을 조절하는 활동이다" }
      ],
      answerId: "A"
    },
    "2-0": {
      prompt: "하이라이트된 문장에서 작업 기억 용량 차이가 예측하는 것으로 적절한 것은?",
      choices: [
        { id: "A", text: "독해력, 추론 능력, 학업 성취도 등 다양한 인지 기능 수행 수준이다" },
        { id: "B", text: "신체적 건강 상태와 운동 능력의 수준이다" },
        { id: "C", text: "사회적 관계 형성 능력과 정서적 안정성이다" },
        { id: "D", text: "예술적 감수성과 창의적 표현 능력이다" }
      ],
      answerId: "A"
    },
    "2-3": {
      prompt: "하이라이트된 문장에서 작업 기억 개인차가 관련되는 것으로 적절한 것은?",
      choices: [
        { id: "A", text: "지능의 유동적 측면과 밀접하게 관련되어 있다" },
        { id: "B", text: "성격의 외향성 차원과 높은 상관을 보인다" },
        { id: "C", text: "감각 기관의 물리적 구조 차이에서 비롯된다" },
        { id: "D", text: "문화적 환경의 영향을 전혀 받지 않는 선천적 특성이다" }
      ],
      answerId: "A"
    },
    "3-1": {
      prompt: "하이라이트된 문장에서 인지적 과부하의 원인으로 적절한 것은?",
      choices: [
        { id: "A", text: "한꺼번에 과도한 양의 정보를 제시하면 작업 기억에 과부하가 발생한다" },
        { id: "B", text: "학습 속도가 느린 학생에게만 선택적으로 발생하는 현상이다" },
        { id: "C", text: "시각 자료를 사용할 때 반드시 동반되는 부작용이다" },
        { id: "D", text: "장기 기억의 용량이 부족할 때 나타나는 기억 간섭 현상이다" }
      ],
      answerId: "A"
    },
    "3-2": {
      prompt: "하이라이트된 문장에서 인지적 과부하를 방지하기 위한 전략으로 적절한 것은?",
      choices: [
        { id: "A", text: "청킹 전략이나 이중 부호화 전략이 효과적으로 사용된다" },
        { id: "B", text: "정보의 양을 최소화하고 반복 없이 단회 제시하는 것이 효과적이다" },
        { id: "C", text: "언어 설명만 단독으로 사용하여 시각적 간섭을 제거해야 한다" },
        { id: "D", text: "학습자의 흥미와 무관한 과제를 부과하여 집중력을 시험해야 한다" }
      ],
      answerId: "A"
    },
    "central-0": {
      choices: [
        { id: "A", text: "작업 기억의 개념 정의와 배들리의 다중 구성 요소 모델 제안" },
        { id: "B", text: "장기 기억의 종류와 각 기억 체계의 생물학적 기반" },
        { id: "C", text: "감각 기억의 특성과 정보 처리의 초기 단계 분석" },
        { id: "D", text: "기억 왜곡 현상의 원인과 목격자 증언의 신뢰도 문제" }
      ],
      answerId: "A"
    },
    "central-1": {
      choices: [
        { id: "A", text: "중앙 집행기, 음운 루프, 시공간 잡기장, 일화적 완충기의 역할과 기능" },
        { id: "B", text: "뇌의 해마 영역이 기억 형성에 기여하는 신경과학적 메커니즘" },
        { id: "C", text: "고전적 조건화와 조작적 조건화의 차이점 비교" },
        { id: "D", text: "수면이 기억 공고화에 미치는 영향과 수면 단계별 특성" }
      ],
      answerId: "A"
    },
    "central-2": {
      choices: [
        { id: "A", text: "작업 기억 용량의 개인차와 인지 기능 수행 수준 예측 및 지능과의 관계" },
        { id: "B", text: "주의력 결핍 과잉행동 장애의 진단 기준과 치료 방법" },
        { id: "C", text: "메타인지 전략의 종류와 자기조절 학습에서의 활용 방안" },
        { id: "D", text: "동기 부여 이론의 발전과 내재적 동기의 교육적 함의" }
      ],
      answerId: "A"
    },
    "central-3": {
      choices: [
        { id: "A", text: "작업 기억 연구의 교육적 적용과 인지적 과부하 방지 전략" },
        { id: "B", text: "표준화 시험의 문제점과 대안적 평가 방법의 모색" },
        { id: "C", text: "또래 학습의 효과와 협동 학습 모형의 설계 원리" },
        { id: "D", text: "교육 과정 개정의 역사와 핵심 역량 중심 교육의 전환" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "작업 기억의 다중 구성 요소 모델을 제안한 심리학자의 이름은?",
      answerRanges: [findRange(paragraphs, "p1", "앨런 배들리")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "언어적 정보를 내적 되뇌기로 유지시키는 하위 체계의 이름은?",
      answerRanges: [findRange(paragraphs, "p2", "음운 루프")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "2000년에 네 번째 구성 요소로 추가된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "일화적 완충기")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "작업 기억 용량의 개인차가 밀접하게 관련되어 있다고 서술된 지능의 측면은?",
      answerRanges: [findRange(paragraphs, "p3", "유동적 측면")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "정보를 의미 있는 단위로 묶어 제시하는 전략의 이름은?",
      answerRanges: [findRange(paragraphs, "p4", "청킹 전략")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "시각 자료와 언어 설명을 동시에 활용하는 전략의 이름은?",
      answerRanges: [findRange(paragraphs, "p4", "이중 부호화 전략")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(71, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(71, "NONFICTION", content);
}

// ── Day 72: 문학 (LITERATURE, 짝수) ── 주제: 현대시 비평 — 김수영의 시와 자유
function buildDay72() {
  const paragraphs = [
    {
      id: "p1",
      text: "김수영은 한국 현대시사에서 자유의 시학을 가장 치열하게 탐구한 시인으로 평가받는다. 그의 시적 여정은 해방 공간의 혼란에서 출발하여 한국전쟁의 포로 수용소 체험을 거쳐 4·19 혁명의 감격과 5·16 군사정변의 좌절에 이르기까지 격동의 현대사와 불가분의 관계를 맺고 있다. 김수영에게 자유란 정치적 억압으로부터의 해방이라는 소극적 의미에 머무르지 않고, 인간이 자기 존재의 진정성을 향해 끊임없이 자신을 갱신하는 능동적 실존의 운동을 의미하였다. 이러한 자유 의식은 그의 시에서 관습적 시어와 형식에 대한 과감한 거부, 일상 언어의 시적 전용, 자기 모순과 비겁함에 대한 냉정한 응시라는 독특한 형식적 특징으로 구현되었다."
    },
    {
      id: "p2",
      text: "「풀」은 김수영의 대표작 중 하나로, 풀이 바람에 눕는 행위를 통해 민중의 저항 정신을 형상화한 작품이다. 이 시에서 풀은 바람에 눕지만 결코 꺾이지 않으며, 바람보다 먼저 일어나 바람보다 먼저 웃는 존재로 그려진다. 여기서 바람은 권력이나 억압적 체제를 상징하고, 풀은 그에 맞서는 민중의 생명력을 상징한다. 그러나 이 시의 의미를 단순한 정치적 알레고리로 환원하면 텍스트가 지닌 존재론적 깊이를 놓치게 된다. 풀이 눕는 행위는 패배가 아니라 유연한 수용을 통해 자기를 보존하고 재기하는 생존의 지혜이며, 이는 경직된 저항이 아닌 유연한 생명력이야말로 진정한 힘의 원천임을 역설적으로 보여준다."
    },
    {
      id: "p3",
      text: "김수영의 시적 방법론에서 핵심적인 위치를 차지하는 것은 반시론적 시학이다. 그는 전통적으로 시적이라고 여겨지는 것들, 즉 아름다운 자연 이미지, 정교한 운율, 감정적 고양 등을 의도적으로 배제하고 일상의 구체적 사물과 행위를 시의 재료로 삼았다. 「거대한 뿌리」에서 그는 시가 만인의 것이 되어야 한다고 선언하며, 예술의 민주화를 주장한다. 이러한 반시론적 태도는 시를 소수 엘리트의 전유물에서 해방시켜 삶의 모든 영역을 시적 경험의 대상으로 확장하려는 시도로, 모더니즘의 일상성 미학과 맥을 같이하면서도 한국적 현실에 뿌리를 둔 독자적인 시적 지평을 열었다. 김수영이 추구한 것은 아름다움의 시학이 아니라 진실의 시학이었으며, 이 진실에의 의지가 그의 시를 시대의 증언이자 양심의 기록으로 만들었다."
    },
    {
      id: "p4",
      text: "김수영이 한국 시사에 남긴 가장 중요한 유산은 시와 삶의 일치라는 명제이다. 그는 시를 쓰는 행위 자체가 자유를 향한 실천이며, 시인의 윤리는 곧 시의 미학과 분리될 수 없다고 보았다. 이러한 시관은 시를 순수한 미적 형식으로만 파악하는 순수시론과 시를 사회 변혁의 도구로 보는 참여시론 모두를 넘어서는 제3의 입장을 구성한다. 김수영 이후의 한국 시는 그의 영향 아래서 시적 언어의 경계를 확장하고 일상과 현실을 시 속에 적극적으로 끌어들이는 방향으로 전개되었으며, 황동규, 김지하, 최승호 등 후속 세대의 시인들에게 깊은 영향을 미쳤다. 그의 시적 실천은 시인이 자기 시대의 모순과 대면하면서도 언어 예술로서의 시의 본질을 포기하지 않을 수 있음을 입증하였고, 이는 오늘날까지 한국 시의 핵심적인 과제로 남아 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 72 지문 길이: ${len}자`);

  const customQuestions = {
    "0-0": {
      prompt: "하이라이트된 문장에서 김수영에 대한 평가로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "자유의 시학을 가장 치열하게 탐구한 시인으로 평가받는다" },
        { id: "B", text: "전통적 서정시의 형식을 완성한 시인으로 평가받는다" },
        { id: "C", text: "순수 예술의 미학적 가치를 확립한 시인으로 평가받는다" },
        { id: "D", text: "서사시의 장르를 한국 문학에 정착시킨 시인으로 평가받는다" }
      ],
      answerId: "A"
    },
    "0-2": {
      prompt: "하이라이트된 문장에서 김수영에게 자유의 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "자기 존재의 진정성을 향해 끊임없이 자신을 갱신하는 능동적 실존의 운동이다" },
        { id: "B", text: "정치적 억압으로부터의 해방이라는 소극적 의미에 한정된다" },
        { id: "C", text: "경제적 안정과 물질적 풍요를 추구하는 실용적 목표이다" },
        { id: "D", text: "전통적 가치관에서 벗어나 서구 문화를 수용하는 것을 가리킨다" }
      ],
      answerId: "A"
    },
    "1-0": {
      prompt: "하이라이트된 문장에서 「풀」이 형상화하고 있는 것으로 적절한 것은?",
      choices: [
        { id: "A", text: "풀이 바람에 눕는 행위를 통해 민중의 저항 정신을 형상화한다" },
        { id: "B", text: "자연의 순환과 계절 변화를 서정적으로 묘사한다" },
        { id: "C", text: "도시 문명의 폐해와 전원 회귀의 소망을 표현한다" },
        { id: "D", text: "전쟁의 참상을 사실적으로 기록한다" }
      ],
      answerId: "A"
    },
    "1-4": {
      prompt: "하이라이트된 문장에서 풀이 눕는 행위가 보여주는 역설적 의미로 적절한 것은?",
      choices: [
        { id: "A", text: "유연한 생명력이야말로 진정한 힘의 원천임을 보여준다" },
        { id: "B", text: "억압에 대한 무조건적 순종이 생존의 유일한 방법임을 보여준다" },
        { id: "C", text: "자연의 법칙에 순응하는 것이 인간의 본질적 운명임을 보여준다" },
        { id: "D", text: "폭력적 저항만이 변화를 이끌어낼 수 있음을 보여준다" }
      ],
      answerId: "A"
    },
    "2-0": {
      prompt: "하이라이트된 문장에서 김수영의 시적 방법론의 핵심으로 적절한 것은?",
      choices: [
        { id: "A", text: "반시론적 시학이 핵심적 위치를 차지한다" },
        { id: "B", text: "전통적 운율과 정형시의 복원이 핵심이다" },
        { id: "C", text: "초현실주의적 자동기술법이 핵심적 방법이다" },
        { id: "D", text: "고전주의적 형식미의 추구가 핵심이다" }
      ],
      answerId: "A"
    },
    "2-4": {
      prompt: "하이라이트된 문장에서 김수영이 추구한 시학의 본질로 적절한 것은?",
      choices: [
        { id: "A", text: "아름다움의 시학이 아니라 진실의 시학을 추구하였다" },
        { id: "B", text: "형식적 완벽함과 기교의 극대화를 추구하였다" },
        { id: "C", text: "서양 모더니즘의 충실한 수용과 이식을 추구하였다" },
        { id: "D", text: "독자와의 소통보다 예술적 자율성만을 추구하였다" }
      ],
      answerId: "A"
    },
    "3-0": {
      prompt: "하이라이트된 문장에서 김수영이 남긴 가장 중요한 유산으로 적절한 것은?",
      choices: [
        { id: "A", text: "시와 삶의 일치라는 명제이다" },
        { id: "B", text: "순수시와 참여시의 완전한 분리라는 원칙이다" },
        { id: "C", text: "시적 언어의 순화와 미적 형식의 정교화이다" },
        { id: "D", text: "한국 고전시의 현대적 계승과 발전이다" }
      ],
      answerId: "A"
    },
    "3-2": {
      prompt: "하이라이트된 문장에서 김수영의 시관이 구성하는 입장으로 적절한 것은?",
      choices: [
        { id: "A", text: "순수시론과 참여시론 모두를 넘어서는 제3의 입장을 구성한다" },
        { id: "B", text: "순수시론의 가치를 재확인하는 입장을 구성한다" },
        { id: "C", text: "참여시론의 극단적 형태를 대표하는 입장을 구성한다" },
        { id: "D", text: "시의 사회적 기능을 전면 부정하는 입장을 구성한다" }
      ],
      answerId: "A"
    },
    "central-0": {
      choices: [
        { id: "A", text: "김수영의 시적 여정과 자유 개념의 실존적 의미 및 형식적 구현" },
        { id: "B", text: "해방 이후 한국 시단의 유파별 대립과 문학사적 전개 과정" },
        { id: "C", text: "한국 현대시의 주요 동인지 활동과 문단 형성 과정" },
        { id: "D", text: "1960년대 한국 소설의 실존주의적 경향과 대표 작가 분석" }
      ],
      answerId: "A"
    },
    "central-1": {
      choices: [
        { id: "A", text: "「풀」에서 바람과 풀의 상징적 의미와 유연한 저항의 역설" },
        { id: "B", text: "한국 서정시의 자연 이미지 변천사와 대표적 작품 분석" },
        { id: "C", text: "저항시의 기원과 일제 강점기 시인들의 항일 의식 표현" },
        { id: "D", text: "현대시에서 우화적 기법의 활용과 교훈적 메시지의 전달" }
      ],
      answerId: "A"
    },
    "central-2": {
      choices: [
        { id: "A", text: "반시론적 시학의 특징과 시의 민주화, 진실의 시학 추구" },
        { id: "B", text: "한국 시에서 전통적 운율 체계의 발전과 현대적 변용" },
        { id: "C", text: "모더니즘 시의 서구적 기원과 한국 수용 과정의 문제점" },
        { id: "D", text: "시적 화자의 유형 분류와 각 유형별 대표 작품 비교" }
      ],
      answerId: "A"
    },
    "central-3": {
      choices: [
        { id: "A", text: "시와 삶의 일치 명제, 순수시론·참여시론을 넘어선 제3의 입장과 시적 유산" },
        { id: "B", text: "한국 문학상의 역사와 수상작 선정 기준의 변화 추이" },
        { id: "C", text: "해외 한국 문학 번역의 현황과 세계 문학 시장에서의 위상" },
        { id: "D", text: "한국 현대 문학 교육 과정의 변천과 시 교육의 문제점" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "「풀」에서 바람이 상징하는 대상은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "권력이나 억압적 체제")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "김수영이 시의 재료로 삼은 것은 전통적 시어 대신 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "일상의 구체적 사물과 행위")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「거대한 뿌리」에서 김수영이 선언한 것은 시가 누구의 것이 되어야 한다는 것인가?",
      answerRanges: [findRange(paragraphs, "p3", "만인")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "김수영의 시적 방법론에서 핵심적 위치를 차지하는 것의 이름은?",
      answerRanges: [findRange(paragraphs, "p3", "반시론적 시학")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "김수영이 남긴 가장 중요한 유산으로 제시된 명제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "시와 삶의 일치")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "김수영의 시관이 넘어서는 두 입장은 각각 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "순수시론"), findRange(paragraphs, "p4", "참여시론")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(72, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(72, "LITERATURE", content);
}

// ── Day 73: 비문학 (NONFICTION, 홀수) ── 주제: 사회과학 — 공유지의 비극과 제도 설계
function buildDay73() {
  const paragraphs = [
    {
      id: "p1",
      text: "공유지의 비극이란 다수의 사용자가 공동으로 이용하는 자원이 개별 사용자의 합리적 이기심에 의해 남용되어 결국 고갈되는 현상을 가리키는 개념이다. 이 용어는 미국의 생물학자 가렛 하딘이 1968년 사이언스지에 발표한 논문에서 처음 대중적으로 알려졌다. 하딘은 누구나 자유롭게 가축을 방목할 수 있는 공유 목초지를 예로 들어, 각 목축업자가 자신의 가축 수를 한 마리라도 더 늘리려는 동기를 갖게 되며, 모든 목축업자가 이러한 전략을 동시에 추구할 경우 목초지의 수용 능력이 초과되어 궁극적으로 모두가 파멸에 이르게 된다고 주장하였다. 이 모델은 개인의 합리적 선택이 집단적으로는 비합리적 결과를 초래할 수 있다는 사회적 딜레마의 구조를 명쾌하게 보여준다."
    },
    {
      id: "p2",
      text: "하딘의 논문은 공유지 문제의 해법으로 사유화 또는 정부 규제라는 두 가지 경로만을 제시하여, 공유 자원의 관리가 시장 메커니즘이나 국가 권력에 의해서만 가능하다는 이분법적 틀을 형성하였다. 그러나 미국의 정치경제학자 엘리너 오스트롬은 세계 각지의 공유 자원 관리 사례에 대한 방대한 현장 연구를 통해 이 이분법에 도전하였다. 오스트롬은 공유 자원의 이용자들이 스스로 규칙을 만들고 상호 감시하며 위반자를 제재하는 자치적 거버넌스 체계를 구축할 수 있으며, 이러한 자율 관리가 시장이나 국가보다 효과적인 경우가 많다는 것을 실증적으로 입증하였다. 이 업적으로 오스트롬은 2009년 노벨 경제학상을 수상하며, 제도 분석이라는 새로운 연구 패러다임을 확립하였다."
    },
    {
      id: "p3",
      text: "오스트롬이 도출한 성공적인 공유 자원 관리의 설계 원칙은 여덟 가지로 정리된다. 자원의 경계와 이용자 자격의 명확한 규정, 자원 사용 규칙과 현지 조건 사이의 적합성, 규칙 수정 과정에 대한 이용자의 참여 보장, 이용자 스스로 수행하는 효과적 감시 체계, 위반의 심각성에 비례하는 단계적 제재, 접근하기 쉽고 비용이 적은 분쟁 해결 기제, 자율적 조직화에 대한 외부 권위의 최소한의 인정, 그리고 대규모 자원 체계에서의 중첩적 다층 거버넌스가 그것이다. 이들 원칙은 특정 문화나 자원 유형에 국한되지 않는 보편적 적용 가능성을 보여주며, 이후 환경 정책, 도시 계획, 디지털 공유재 관리 등 다양한 분야로 확장 적용되고 있다."
    },
    {
      id: "p4",
      text: "공유지의 비극 개념은 오늘날 기후 변화, 해양 자원 남획, 항생제 내성 확산 등 글로벌 규모의 공유 자원 문제를 이해하고 해결하는 데 핵심적인 분석 틀로 활용되고 있다. 대기라는 지구적 공유재를 과도하게 사용하여 온실 가스를 배출하는 각국의 행태는 하딘이 묘사한 목축업자의 행동과 구조적으로 동일하다. 그러나 국제 사회에는 강제력을 갖춘 상위 권위가 부재하므로, 파리 기후 협정과 같은 자발적 협약의 실효성 확보가 핵심 과제로 부상한다. 오스트롬의 연구가 시사하는 바는 성공적인 글로벌 공유 자원 관리가 하향식 규제만으로는 달성될 수 없으며, 지역 공동체에서 국제 사회에 이르는 다층적 협력 구조와 자율적 참여에 기반한 제도 설계가 병행되어야 한다는 것이다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 73 지문 길이: ${len}자`);

  const customQuestions = {
    "0-0": {
      prompt: "하이라이트된 문장에서 공유지의 비극의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "공동 자원이 개별 사용자의 합리적 이기심에 의해 남용되어 고갈되는 현상이다" },
        { id: "B", text: "사유 재산이 정부의 과도한 규제에 의해 효율적으로 활용되지 못하는 현상이다" },
        { id: "C", text: "공공 기관이 시장 논리를 무시하여 자원이 비효율적으로 배분되는 현상이다" },
        { id: "D", text: "기술 혁신의 속도가 자원 소비의 속도를 따라잡지 못하는 현상이다" }
      ],
      answerId: "A"
    },
    "0-2": {
      prompt: "하이라이트된 문장에서 하딘이 든 예시로 적절한 것은?",
      choices: [
        { id: "A", text: "공유 목초지에서 각 목축업자가 가축 수를 늘리려는 동기를 갖게 된다" },
        { id: "B", text: "개인 농장에서 농부들이 작물 다양성을 유지하려는 노력을 한다" },
        { id: "C", text: "국유림에서 정부가 벌목량을 철저히 관리하여 산림을 보호한다" },
        { id: "D", text: "사유지에서 토지 소유자가 환경 보전을 위해 자발적으로 보호 구역을 설정한다" }
      ],
      answerId: "A"
    },
    "1-1": {
      prompt: "하이라이트된 문장에서 하딘의 논문이 제시한 해법의 한계로 적절한 것은?",
      choices: [
        { id: "A", text: "사유화 또는 정부 규제만을 제시하여 이분법적 틀을 형성하였다" },
        { id: "B", text: "자원의 사유화를 전면 반대하여 실현 가능성을 잃었다" },
        { id: "C", text: "정부 규제의 효과를 과대평가하여 현실 적용에 실패하였다" },
        { id: "D", text: "공유 자원의 존재 자체를 부정하여 논리적 모순에 빠졌다" }
      ],
      answerId: "A"
    },
    "1-2": {
      prompt: "하이라이트된 문장에서 오스트롬이 실증한 것으로 적절한 것은?",
      choices: [
        { id: "A", text: "이용자들의 자치적 거버넌스 체계가 시장이나 국가보다 효과적일 수 있다" },
        { id: "B", text: "사유화만이 공유 자원 문제를 해결하는 유일한 방법이다" },
        { id: "C", text: "정부의 강력한 규제가 모든 공유 자원 문제에 최적의 해답이다" },
        { id: "D", text: "공유 자원은 자연적으로 균형을 유지하므로 관리가 불필요하다" }
      ],
      answerId: "A"
    },
    "2-0": {
      prompt: "하이라이트된 문장에서 오스트롬이 도출한 설계 원칙의 개수는?",
      choices: [
        { id: "A", text: "여덟 가지로 정리된다" },
        { id: "B", text: "다섯 가지로 정리된다" },
        { id: "C", text: "열두 가지로 정리된다" },
        { id: "D", text: "세 가지로 정리된다" }
      ],
      answerId: "A"
    },
    "2-3": {
      prompt: "하이라이트된 문장에서 오스트롬의 원칙이 확장 적용되는 분야로 적절한 것은?",
      choices: [
        { id: "A", text: "환경 정책, 도시 계획, 디지털 공유재 관리 등의 분야이다" },
        { id: "B", text: "군사 전략, 외교 협상, 정보 보안 등의 분야이다" },
        { id: "C", text: "유전공학, 로봇 공학, 인공지능 등의 기술 분야이다" },
        { id: "D", text: "문학 비평, 미술사, 음악 이론 등의 인문학 분야이다" }
      ],
      answerId: "A"
    },
    "3-0": {
      prompt: "하이라이트된 문장에서 공유지의 비극 개념이 활용되는 글로벌 문제로 적절하지 않은 것은?",
      choices: [
        { id: "A", text: "기후 변화, 해양 자원 남획, 항생제 내성 확산에 활용되고 있다" },
        { id: "B", text: "개인의 심리 치료와 정신 건강 관리에 핵심적 틀로 활용된다" },
        { id: "C", text: "사유 재산 보호를 위한 법률 제정에 직접적 근거로 사용된다" },
        { id: "D", text: "기업 경영의 효율성 평가에 주된 분석 도구로 활용된다" }
      ],
      answerId: "A"
    },
    "3-3": {
      prompt: "하이라이트된 문장에서 오스트롬의 연구가 시사하는 바로 적절한 것은?",
      choices: [
        { id: "A", text: "다층적 협력 구조와 자율적 참여에 기반한 제도 설계가 병행되어야 한다" },
        { id: "B", text: "하향식 규제만으로도 글로벌 공유 자원 관리가 충분히 달성 가능하다" },
        { id: "C", text: "시장 메커니즘만이 자원 배분의 최적 효율을 보장할 수 있다" },
        { id: "D", text: "기술 혁신이 모든 공유 자원 문제를 자동적으로 해결할 것이다" }
      ],
      answerId: "A"
    },
    "central-0": {
      choices: [
        { id: "A", text: "공유지의 비극의 개념 정의와 하딘의 목초지 모델을 통한 사회적 딜레마 구조 설명" },
        { id: "B", text: "고전 경제학의 수요·공급 법칙과 시장 균형 이론의 발전 과정" },
        { id: "C", text: "국제 무역의 비교 우위론과 자유 무역 협정의 경제적 효과" },
        { id: "D", text: "복지 국가 모델의 유형과 사회 보장 제도의 재원 조달 방식" }
      ],
      answerId: "A"
    },
    "central-1": {
      choices: [
        { id: "A", text: "하딘의 이분법에 대한 오스트롬의 도전과 자치적 거버넌스의 실증적 입증" },
        { id: "B", text: "민주주의의 발전 과정과 대의제 민주주의의 한계 분석" },
        { id: "C", text: "사회 계약론의 역사적 전개와 홉스·로크·루소의 비교" },
        { id: "D", text: "관료제의 특성과 막스 베버의 합리적 지배 유형론" }
      ],
      answerId: "A"
    },
    "central-2": {
      choices: [
        { id: "A", text: "오스트롬의 여덟 가지 설계 원칙과 다양한 분야로의 확장 적용 가능성" },
        { id: "B", text: "도시화의 원인과 농촌 인구 감소가 지역 경제에 미치는 영향" },
        { id: "C", text: "정보 사회의 특성과 디지털 격차 해소를 위한 정책 방안" },
        { id: "D", text: "인구 고령화의 사회경제적 영향과 연금 제도 개혁의 방향" }
      ],
      answerId: "A"
    },
    "central-3": {
      choices: [
        { id: "A", text: "글로벌 공유 자원 문제에 대한 공유지의 비극 개념의 적용과 다층적 제도 설계의 필요성" },
        { id: "B", text: "에너지 전환 정책의 경제적 비용 편익 분석과 재생 에너지 보급 전략" },
        { id: "C", text: "국제기구의 역할과 유엔 안전보장이사회의 개혁 논의" },
        { id: "D", text: "세계화의 명암과 반세계화 운동의 전개 및 영향" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "공유지의 비극 개념을 대중화한 학자의 이름은 누구인가?",
      answerRanges: [findRange(paragraphs, "p1", "가렛 하딘")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "하딘의 이분법에 도전한 정치경제학자의 이름은 누구인가?",
      answerRanges: [findRange(paragraphs, "p2", "엘리너 오스트롬")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "오스트롬이 수상한 상의 이름과 연도는?",
      answerRanges: [findRange(paragraphs, "p2", "2009년 노벨 경제학상")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "하딘이 공유 목초지 모델에서 궁극적 결과로 제시한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "파멸")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "글로벌 규모에서 공유지의 비극 해결의 핵심 과제로 부상한 협약의 이름은?",
      answerRanges: [findRange(paragraphs, "p4", "파리 기후 협정")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "오스트롬이 확립한 새로운 연구 패러다임의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "제도 분석")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(73, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(73, "NONFICTION", content);
}

// ── Day 74: 문학 (LITERATURE, 짝수) ── 주제: 고전소설 — 춘향전의 서사 구조와 문학사적 의의
function buildDay74() {
  const paragraphs = [
    {
      id: "p1",
      text: "춘향전은 한국 고전소설의 최고봉으로 평가받는 작품으로, 판소리 다섯 마당 가운데 하나인 춘향가를 소설로 정착시킨 판소리계 소설이다. 이 작품은 성춘향과 이몽룡의 사랑 이야기를 축으로 하되, 조선 후기 사회의 신분 갈등, 관료 부패, 민중 의식의 성장이라는 사회적 주제를 서사 속에 유기적으로 결합시키고 있다. 춘향전의 이본은 현재까지 확인된 것만 백이십여 종에 달하며, 이는 이 작품이 특정 작가의 단일한 창작물이 아니라 수많은 전승자와 향유자에 의해 끊임없이 변형되고 재창조된 집단적 서사임을 보여준다. 이러한 다중 이본의 존재는 고정된 텍스트가 아닌 유동적 서사라는 구비문학의 본질적 특성을 잘 드러낸다."
    },
    {
      id: "p2",
      text: "춘향전의 서사 구조에서 가장 핵심적인 갈등은 신분 질서와 인간적 사랑 사이의 충돌이다. 퇴기의 딸인 춘향과 양반 가문의 자제인 이몽룡의 결합은 조선 시대의 엄격한 신분제도 하에서는 정당한 혼인으로 인정받기 어려운 것이었다. 그러나 춘향은 변학도의 수청 요구를 목숨을 걸고 거부함으로써 자신의 사랑이 일시적 정분이 아닌 진정한 부부의 의리에 기반한 것임을 증명하고, 이를 통해 신분적 한계를 도덕적 정당성으로 초월하는 인물로 형상화된다. 변학도는 탐관오리의 전형으로서 권력의 횡포를 체현하는 인물이며, 그에 대한 춘향의 저항은 개인적 정절의 수호를 넘어 부당한 권력에 맞서는 민중적 저항의 알레고리로 읽힌다. 이러한 갈등 구조는 사랑 이야기라는 보편적 주제 안에 사회 비판적 메시지를 자연스럽게 내포시키는 이중적 서사 전략을 구현한다."
    },
    {
      id: "p3",
      text: "춘향전의 미학적 성취는 판소리적 표현 양식의 풍부한 활용에서 돋보인다. 작품 곳곳에 삽입된 노래와 사설, 한시와 속담의 혼용, 장중한 한문투와 해학적 구어체의 교차는 상층 문화와 하층 문화가 융합된 독특한 문체를 형성한다. 특히 춘향이 옥중에서 부르는 사랑가와 변학도의 학정을 풍자하는 장면에서의 언어적 기교는 한국 고전 산문이 도달한 수사적 절정을 보여준다. 이러한 다성적 문체는 단일한 서술 시점이 아닌 여러 목소리가 공존하는 서사 공간을 만들어내며, 이는 판소리가 창자와 청중의 상호작용 속에서 형성되는 공연 예술이라는 점에서 비롯된 소통적 미학이라 할 수 있다. 언어의 이러한 다층성은 춘향전이 단순한 서사적 재미를 넘어 깊은 미적 쾌감을 제공하는 근거가 된다."
    },
    {
      id: "p4",
      text: "춘향전이 오늘날까지 생명력을 유지하는 이유는 이 작품이 다루는 주제들이 시대를 초월하는 보편성을 지니고 있기 때문이다. 사랑과 신의에 대한 갈구, 부당한 권력에 대한 저항, 사회적 정의의 실현이라는 주제는 조선 시대뿐 아니라 현대 사회에서도 유효한 인간적 가치를 담고 있다. 춘향전은 소설, 판소리, 연극, 영화, 뮤지컬 등 다양한 장르와 매체로 끊임없이 변환되어 왔으며, 각 시대의 사회적 맥락에 맞게 재해석되며 새로운 의미를 획득해 왔다. 이러한 지속적인 재창작의 역사는 춘향전이 고정된 고전이 아니라 살아 있는 서사로서 한국 문화의 핵심적 원형을 형성하고 있음을 증명한다. 춘향전은 한국 문학이 세계에 내놓을 수 있는 가장 독자적이고 풍요로운 서사적 유산 중 하나이며, 그 문학적 가치는 앞으로도 새로운 세대의 독자와 창작자들에 의해 거듭 발견될 것이다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 74 지문 길이: ${len}자`);

  const customQuestions = {
    "0-0": {
      prompt: "하이라이트된 문장에서 춘향전의 문학사적 위치로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "한국 고전소설의 최고봉으로 평가받는 판소리계 소설이다" },
        { id: "B", text: "조선 초기에 창작된 최초의 한글 소설이다" },
        { id: "C", text: "중국 소설의 영향을 받아 번역된 번안 소설이다" },
        { id: "D", text: "양반 계층의 독서용으로 창작된 한문 소설이다" }
      ],
      answerId: "A"
    },
    "0-2": {
      prompt: "하이라이트된 문장에서 춘향전 이본의 존재가 보여주는 것으로 적절한 것은?",
      choices: [
        { id: "A", text: "수많은 전승자에 의해 변형·재창조된 집단적 서사임을 보여준다" },
        { id: "B", text: "특정 작가가 여러 판본을 의도적으로 창작했음을 보여준다" },
        { id: "C", text: "출판 기술의 발전으로 인쇄 오류가 반복되었음을 보여준다" },
        { id: "D", text: "지역 방언의 차이로 인해 내용이 왜곡되었음을 보여준다" }
      ],
      answerId: "A"
    },
    "1-0": {
      prompt: "하이라이트된 문장에서 춘향전의 핵심 갈등으로 적절한 것은?",
      choices: [
        { id: "A", text: "신분 질서와 인간적 사랑 사이의 충돌이다" },
        { id: "B", text: "유교적 가치관과 불교적 세계관 사이의 대립이다" },
        { id: "C", text: "중앙 정부와 지방 관아 사이의 행정적 갈등이다" },
        { id: "D", text: "남성과 여성 사이의 권력 투쟁이다" }
      ],
      answerId: "A"
    },
    "1-2": {
      prompt: "하이라이트된 문장에서 춘향이 변학도의 수청을 거부한 의미로 적절한 것은?",
      choices: [
        { id: "A", text: "신분적 한계를 도덕적 정당성으로 초월하는 인물로 형상화된다" },
        { id: "B", text: "조선 시대 여성의 수동적 순종의 전형을 보여준다" },
        { id: "C", text: "양반 가문에 편입되려는 신분 상승의 욕구를 드러낸다" },
        { id: "D", text: "개인적 복수심에 의한 감정적 대응임을 보여준다" }
      ],
      answerId: "A"
    },
    "2-0": {
      prompt: "하이라이트된 문장에서 춘향전의 미학적 성취가 돋보이는 점으로 적절한 것은?",
      choices: [
        { id: "A", text: "판소리적 표현 양식의 풍부한 활용에서 돋보인다" },
        { id: "B", text: "한문 산문의 정교한 수사적 기법에서 돋보인다" },
        { id: "C", text: "서양 소설의 서술 기법을 적극 수용한 점에서 돋보인다" },
        { id: "D", text: "사실주의적 묘사의 철저한 구현에서 돋보인다" }
      ],
      answerId: "A"
    },
    "2-3": {
      prompt: "하이라이트된 문장에서 다성적 문체가 비롯된 근원으로 적절한 것은?",
      choices: [
        { id: "A", text: "판소리가 창자와 청중의 상호작용 속에서 형성되는 공연 예술이라는 점이다" },
        { id: "B", text: "춘향전이 한 명의 작가에 의해 치밀하게 계산된 작품이라는 점이다" },
        { id: "C", text: "중국 고전 소설의 문체를 충실히 모방한 결과라는 점이다" },
        { id: "D", text: "조선 후기 한글 보급에 의해 문자 문화가 일반화된 결과라는 점이다" }
      ],
      answerId: "A"
    },
    "3-0": {
      prompt: "하이라이트된 문장에서 춘향전이 생명력을 유지하는 이유로 적절한 것은?",
      choices: [
        { id: "A", text: "다루는 주제들이 시대를 초월하는 보편성을 지니고 있기 때문이다" },
        { id: "B", text: "정부의 지속적인 문화 정책적 지원 덕분이다" },
        { id: "C", text: "교육 과정에 필수적으로 포함되어 강제적으로 읽히기 때문이다" },
        { id: "D", text: "외국 독자들의 높은 관심에 의해 국제적 명성을 유지하기 때문이다" }
      ],
      answerId: "A"
    },
    "3-3": {
      prompt: "하이라이트된 문장에서 춘향전의 지속적 재창작이 증명하는 것으로 적절한 것은?",
      choices: [
        { id: "A", text: "고정된 고전이 아니라 한국 문화의 핵심적 원형을 형성하는 살아 있는 서사이다" },
        { id: "B", text: "원본에 대한 충실한 복원이 문학 연구의 핵심 과제임을 증명한다" },
        { id: "C", text: "고전 문학은 현대적 변용 없이는 가치를 상실함을 증명한다" },
        { id: "D", text: "상업적 목적의 콘텐츠 재활용이 문학의 본질적 기능임을 증명한다" }
      ],
      answerId: "A"
    },
    "central-0": {
      choices: [
        { id: "A", text: "춘향전의 문학사적 위치, 사회적 주제의 결합, 집단적 서사로서의 특성" },
        { id: "B", text: "조선 후기 한글 소설의 유통 경로와 상업적 출판의 발전" },
        { id: "C", text: "판소리 다섯 마당의 음악적 특성과 창법의 비교 분석" },
        { id: "D", text: "한국 고전 시가의 형식적 특징과 대표 작품 해제" }
      ],
      answerId: "A"
    },
    "central-1": {
      choices: [
        { id: "A", text: "신분 질서와 사랑의 충돌, 춘향의 저항과 이중적 서사 전략" },
        { id: "B", text: "조선 시대 혼인 제도의 변천과 법적 규제의 발전" },
        { id: "C", text: "양반 관료 체제의 구조와 과거 시험의 운영 방식" },
        { id: "D", text: "고전 소설에 나타나는 도적 인물의 유형과 사회적 의미" }
      ],
      answerId: "A"
    },
    "central-2": {
      choices: [
        { id: "A", text: "판소리적 표현 양식의 활용, 다성적 문체, 소통적 미학의 특성" },
        { id: "B", text: "한국 전통 음악의 음계 체계와 서양 음악과의 비교" },
        { id: "C", text: "조선 시대 서당 교육의 내용과 한문 학습의 방법론" },
        { id: "D", text: "구비문학의 채록 방법과 현대적 아카이빙 기술의 적용" }
      ],
      answerId: "A"
    },
    "central-3": {
      choices: [
        { id: "A", text: "시대 초월적 보편성, 다양한 매체로의 재창작, 한국 문화의 핵심 원형으로서의 가치" },
        { id: "B", text: "고전 문학의 교육 과정 편성과 학생들의 수용 태도 분석" },
        { id: "C", text: "한국 영화 산업의 발전사와 사극 영화의 흥행 전략" },
        { id: "D", text: "세계 문학 유산의 보존 체계와 유네스코 등재 기준" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "춘향전의 현재까지 확인된 이본의 수는 대략 몇 종인가?",
      answerRanges: [findRange(paragraphs, "p1", "백이십여 종")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "춘향에게 수청을 요구한 탐관오리의 이름은 누구인가?",
      answerRanges: [findRange(paragraphs, "p2", "변학도")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "춘향이 옥중에서 부른 노래의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "사랑가")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "여러 목소리가 공존하는 문체를 무엇이라 표현하고 있는가?",
      answerRanges: [findRange(paragraphs, "p3", "다성적 문체")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "춘향전의 핵심 갈등이 존재하는 두 축은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "신분 질서와 인간적 사랑")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "춘향전이 한국 문화에서 형성하고 있다고 서술된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "핵심적 원형")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(74, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(74, "LITERATURE", content);
}

// ── Day 75: 비문학 (NONFICTION, 홀수) ── 주제: 물리학 — 열역학 제2법칙과 엔트로피
function buildDay75() {
  const paragraphs = [
    {
      id: "p1",
      text: "열역학 제2법칙은 자연계에서 일어나는 모든 과정의 방향성을 규정하는 물리학의 근본 법칙으로, 고립 계에서 엔트로피는 결코 감소하지 않는다는 명제로 표현된다. 엔트로피란 계의 무질서도를 정량적으로 나타내는 상태 함수로서, 독일의 물리학자 루돌프 클라우지우스가 1865년에 도입한 개념이다. 열은 온도가 높은 물체에서 낮은 물체로 자발적으로 흐르지만, 그 역방향의 과정은 외부에서 에너지의 형태로 일이 가해지지 않는 한 결코 자발적으로 일어나지 않는다. 이러한 비가역성의 원리는 시간의 화살이라는 개념과 깊이 연결되어 있으며, 물리학에서 과거와 미래를 구별하는 근본적인 기준을 제공한다."
    },
    {
      id: "p2",
      text: "열역학 제2법칙의 통계역학적 해석은 오스트리아의 물리학자 루트비히 볼츠만에 의해 19세기 후반에 확립되었다. 볼츠만은 엔트로피를 거시적 상태에 대응하는 미시적 배열의 수와 연결시킴으로써, 엔트로피 증가가 확률적 필연임을 명쾌하게 보여주었다. 예컨대 기체 분자들이 용기의 한쪽에만 몰려 있는 상태는 이론적으로 가능하지만, 균일하게 퍼져 있는 상태에 비해 실현 가능한 미시적 배열의 수가 압도적으로 적기 때문에 확률적으로 거의 일어나지 않는다. 볼츠만의 엔트로피 공식은 그의 묘비에 새겨져 있을 만큼 물리학사에서 기념비적인 위치를 차지하며, 거시적 세계의 비가역성이 미시적 세계의 통계적 법칙으로부터 자연스럽게 도출됨을 보여주는 핵심적 성과이다."
    },
    {
      id: "p3",
      text: "열역학 제2법칙은 공학적 응용에서 열기관의 효율에 대한 근본적인 한계를 설정한다. 프랑스의 공학자 사디 카르노가 1824년에 제시한 카르노 순환은 이상적인 열기관이 도달할 수 있는 최대 효율을 규정하는데, 이 효율은 오직 고열원과 저열원의 절대 온도 비에 의해서만 결정되며 작동 물질의 종류와는 무관하다. 이는 어떤 열기관도 흡수한 열에너지를 전부 유용한 일로 전환할 수 없으며, 반드시 일부를 저열원에 폐열로 방출해야 한다는 것을 의미한다. 이러한 효율의 상한은 에너지 위기 시대에 화력 발전소와 내연 기관의 설계에서 현실적 목표를 설정하는 기준이 되며, 열역학 제2법칙을 위반하는 이른바 제2종 영구 기관의 불가능성을 이론적으로 확증하는 근거이기도 하다."
    },
    {
      id: "p4",
      text: "열역학 제2법칙은 물리학의 경계를 넘어 생물학, 정보 이론, 우주론 등 광범위한 분야에서 심원한 함의를 지닌다. 생명체는 외부로부터 에너지를 흡수하여 내부의 질서를 유지하는 개방 계로서, 국소적으로 엔트로피를 감소시키는 대신 주변 환경의 엔트로피를 더 큰 폭으로 증가시킴으로써 전체적인 제2법칙을 충실히 준수한다. 정보 이론의 영역에서는 정보의 소거가 필연적으로 엔트로피 증가를 수반한다는 란다우어의 원리가 컴퓨팅의 물리적 한계를 규정하며, 이는 계산 과정의 에너지 효율에 관한 근본적인 제약 조건이 된다. 우주론의 관점에서 열역학 제2법칙은 우주가 최대 엔트로피 상태인 열적 사망을 향해 진행하고 있다는 전망을 제시하며, 이는 우주의 궁극적 운명에 대한 가장 근본적인 물리학적 예측 중 하나로 간주되고 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 75 지문 길이: ${len}자`);

  const customQuestions = {
    "0-0": {
      prompt: "하이라이트된 문장에서 열역학 제2법칙의 핵심 명제로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "고립 계에서 엔트로피는 결코 감소하지 않는다" },
        { id: "B", text: "에너지는 생성되거나 소멸될 수 없다" },
        { id: "C", text: "절대 영도에서 모든 물질의 엔트로피는 0이 된다" },
        { id: "D", text: "모든 작용에는 크기가 같고 방향이 반대인 반작용이 존재한다" }
      ],
      answerId: "A"
    },
    "0-1": {
      prompt: "하이라이트된 문장에서 엔트로피 개념을 도입한 학자로 적절한 것은?",
      choices: [
        { id: "A", text: "루돌프 클라우지우스가 1865년에 도입하였다" },
        { id: "B", text: "아이작 뉴턴이 1687년에 도입하였다" },
        { id: "C", text: "알베르트 아인슈타인이 1905년에 도입하였다" },
        { id: "D", text: "닐스 보어가 1913년에 도입하였다" }
      ],
      answerId: "A"
    },
    "0-3": {
      prompt: "하이라이트된 문장에서 비가역성의 원리가 연결되는 개념으로 적절한 것은?",
      choices: [
        { id: "A", text: "시간의 화살이라는 개념과 깊이 연결되어 있다" },
        { id: "B", text: "공간의 곡률이라는 상대성 이론의 핵심 개념과 연결된다" },
        { id: "C", text: "양자 중첩이라는 미시 세계의 원리와 연결된다" },
        { id: "D", text: "파동-입자 이중성이라는 빛의 본질적 성질과 연결된다" }
      ],
      answerId: "A"
    },
    "1-0": {
      prompt: "하이라이트된 문장에서 열역학 제2법칙의 통계역학적 해석을 확립한 학자로 적절한 것은?",
      choices: [
        { id: "A", text: "오스트리아의 물리학자 루트비히 볼츠만이 확립하였다" },
        { id: "B", text: "영국의 물리학자 제임스 맥스웰이 확립하였다" },
        { id: "C", text: "미국의 물리학자 리처드 파인만이 확립하였다" },
        { id: "D", text: "독일의 물리학자 막스 플랑크가 확립하였다" }
      ],
      answerId: "A"
    },
    "1-1": {
      prompt: "하이라이트된 문장에서 볼츠만이 보여준 것으로 적절한 것은?",
      choices: [
        { id: "A", text: "엔트로피 증가가 확률적 필연임을 보여주었다" },
        { id: "B", text: "엔트로피 감소가 고립 계에서도 가능함을 보여주었다" },
        { id: "C", text: "미시적 배열이 거시적 상태를 결정할 수 없음을 보여주었다" },
        { id: "D", text: "열역학 법칙이 미시 세계에서는 적용되지 않음을 보여주었다" }
      ],
      answerId: "A"
    },
    "2-0": {
      prompt: "하이라이트된 문장에서 열역학 제2법칙이 공학에서 설정하는 것으로 적절한 것은?",
      choices: [
        { id: "A", text: "열기관의 효율에 대한 근본적인 한계를 설정한다" },
        { id: "B", text: "전기 회로의 저항에 대한 최소 기준을 설정한다" },
        { id: "C", text: "건축 구조물의 강도에 대한 안전 계수를 설정한다" },
        { id: "D", text: "통신 시스템의 대역폭에 대한 상한을 설정한다" }
      ],
      answerId: "A"
    },
    "2-3": {
      prompt: "하이라이트된 문장에서 효율의 상한이 확증하는 것으로 적절한 것은?",
      choices: [
        { id: "A", text: "영구 기관의 불가능성을 이론적으로 확증하는 근거이다" },
        { id: "B", text: "화석 연료의 무한한 매장량을 확증하는 근거이다" },
        { id: "C", text: "재생 에너지의 경제적 비효율성을 확증하는 근거이다" },
        { id: "D", text: "핵융합 에너지의 상용화가 불가능함을 확증하는 근거이다" }
      ],
      answerId: "A"
    },
    "3-0": {
      prompt: "하이라이트된 문장에서 열역학 제2법칙이 함의를 지니는 분야로 적절한 것은?",
      choices: [
        { id: "A", text: "생물학, 정보 이론, 우주론 등 광범위한 분야이다" },
        { id: "B", text: "언어학, 심리학, 교육학 등 인문사회 분야이다" },
        { id: "C", text: "회계학, 경영학, 마케팅 등 상경 분야이다" },
        { id: "D", text: "건축학, 조경학, 토목공학 등 설계 분야이다" }
      ],
      answerId: "A"
    },
    "3-3": {
      prompt: "하이라이트된 문장에서 우주론적 관점의 열역학 제2법칙이 제시하는 전망은?",
      choices: [
        { id: "A", text: "우주가 최대 엔트로피 상태인 열적 사망을 향해 진행하고 있다" },
        { id: "B", text: "우주가 수축하여 빅 크런치를 향해 진행하고 있다" },
        { id: "C", text: "우주의 팽창이 멈추고 정적 상태를 영원히 유지한다" },
        { id: "D", text: "우주의 엔트로피가 감소하며 점차 질서가 증가하고 있다" }
      ],
      answerId: "A"
    },
    "central-0": {
      choices: [
        { id: "A", text: "열역학 제2법칙의 정의, 엔트로피 개념의 도입, 비가역성과 시간의 화살" },
        { id: "B", text: "열역학 제1법칙의 에너지 보존 원리와 다양한 형태의 에너지 전환" },
        { id: "C", text: "뉴턴 역학의 운동 법칙과 천체 운동에의 적용" },
        { id: "D", text: "양자역학의 불확정성 원리와 미시 세계의 확률적 특성" }
      ],
      answerId: "A"
    },
    "central-1": {
      choices: [
        { id: "A", text: "볼츠만의 통계역학적 해석과 엔트로피 증가의 확률적 필연성" },
        { id: "B", text: "맥스웰 방정식의 전자기 통합과 빛의 파동적 성질 규명" },
        { id: "C", text: "아인슈타인의 특수 상대성 이론과 질량-에너지 등가 원리" },
        { id: "D", text: "하이젠베르크의 행렬역학과 양자역학의 수학적 정립" }
      ],
      answerId: "A"
    },
    "central-2": {
      choices: [
        { id: "A", text: "카르노 순환과 열기관 최대 효율의 한계, 영구 기관의 불가능성" },
        { id: "B", text: "전기 모터의 작동 원리와 발전기의 에너지 변환 효율" },
        { id: "C", text: "반도체 소재의 물리적 특성과 집적 회로 기술의 발전사" },
        { id: "D", text: "태양 전지의 광전 효과와 재생 에너지 기술의 경제성" }
      ],
      answerId: "A"
    },
    "central-3": {
      choices: [
        { id: "A", text: "생물학, 정보 이론, 우주론에서의 열역학 제2법칙의 확장적 함의" },
        { id: "B", text: "진화론의 발전사와 자연 선택 메커니즘의 분자생물학적 기반" },
        { id: "C", text: "인공지능 기술의 발전과 기계 학습 알고리즘의 물리학적 토대" },
        { id: "D", text: "암흑 에너지와 암흑 물질의 발견 과정과 현대 우주론의 과제" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "엔트로피 개념을 도입한 물리학자의 이름은 누구인가?",
      answerRanges: [findRange(paragraphs, "p1", "루돌프 클라우지우스")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "열역학 제2법칙의 통계역학적 해석을 확립한 학자는 누구인가?",
      answerRanges: [findRange(paragraphs, "p2", "루트비히 볼츠만")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "이상적 열기관의 최대 효율을 규정하는 순환의 이름은?",
      answerRanges: [findRange(paragraphs, "p3", "카르노 순환")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "정보의 소거가 엔트로피 증가를 수반한다는 원리의 이름은?",
      answerRanges: [findRange(paragraphs, "p4", "란다우어의 원리")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "비가역성의 원리와 깊이 연결된 시간 관련 개념은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "시간의 화살")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "우주의 궁극적 운명으로 제시된 최대 엔트로피 상태는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "열적 사망")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(75, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(75, "NONFICTION", content);
}

// ── 메인 실행 ──
function main() {
  console.log('=== 비트겐슈타인2 Day 71~75 콘텐츠 빌드 시작 ===\n');

  const items = [
    buildDay71(),
    buildDay72(),
    buildDay73(),
    buildDay74(),
    buildDay75()
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
    console.log('\n[!] 경고가 있지만 파일은 생성합니다.\n');
  }

  // 배치 파일 읽기
  console.log('\n배치 파일 읽기...');
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`배치 파일 총 items: ${batchData.items.length}`);

  // items[70]~[74] 교체 (Day 71~75는 0-indexed 70~74)
  for (let i = 0; i < 5; i++) {
    const targetIdx = 70 + i;
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
