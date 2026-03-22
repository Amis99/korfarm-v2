// 비트겐슈타인2 Day 76~80 콘텐츠 빌더
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
  if (!para) {
    console.error(`[경고] 문단 ${pid}를 찾을 수 없습니다`);
    return { paragraphId: pid, start: 0, end: 1 };
  }
  const start = para.text.indexOf(searchText);
  if (start === -1) {
    console.error(`[경고] "${searchText.substring(0,30)}..." not found in ${pid}`);
    return { paragraphId: pid, start: 0, end: 1 };
  }
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

function hashIdx(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
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

function buildTimeline(paragraphs, customQuestions, centralThemes, wrongThemes) {
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
        const otherSents = [];
        paragraphs.forEach((op, opi) => {
          if (opi !== pi) {
            findSentences(op.text).forEach(s => otherSents.push(s.text));
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
    const cChoices = [
      { id: "A", text: centralThemes[pi] },
      { id: "B", text: wrongThemes[0] },
      { id: "C", text: wrongThemes[1] },
      { id: "D", text: wrongThemes[2] }
    ];
    const cShuffled = shuffleChoices(cChoices, "A");
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


// ══════════════════════════════════════════
// Day 76: 문학 (LITERATURE) — 윤동주 시 세계
// ══════════════════════════════════════════
function buildDay76() {
  const paragraphs = [
    {
      id: "p1",
      text: "윤동주의 시는 일제 강점기라는 암울한 역사적 상황 속에서 자기 성찰과 양심의 고뇌를 서정적으로 형상화한 독보적인 문학적 성취이다. 그의 대표작 「서시」는 죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를 바라는 화자의 간절한 소망을 담고 있으며, 이 소망은 단순한 도덕적 결의를 넘어 식민지 지식인으로서 시대적 현실에 직면한 양심의 절박한 호소로 해석된다. 바람에 괴로워하는 행위는 외부 세계의 폭력적 압력에 대한 내면의 고통스러운 반응을 형상화한 것이며, 별을 노래하는 마음은 암흑 속에서도 이상적 가치를 포기하지 않으려는 의지의 발현이다. 이러한 대조적 이미지의 병치는 윤동주 시 세계의 핵심적 구조 원리를 이루며, 고통과 순수 사이의 긴장이 그의 시에 깊은 울림을 부여한다."
    },
    {
      id: "p2",
      text: "윤동주의 시에서 반복적으로 등장하는 부끄러움이라는 정서는 단순한 수치심이 아니라 윤리적 자기 검열의 기제로 기능한다. 「참회록」에서 화자는 파란 녹이 낀 구리 거울 속 자신의 얼굴을 응시하며 남몰래 부끄러워하는데, 이 응시의 행위는 타인이 아닌 자기 자신을 윤리적 판단의 대상으로 삼는 내면적 재판의 구조를 보여준다. 구리 거울이라는 소재는 현대적 투명함이 아닌 불투명하고 흐릿한 반영을 제공하여 자아 인식의 불완전성을 암시하며, 파란 녹은 시간의 경과에 따라 축적된 자기 배반의 흔적을 물질적으로 형상화한다. 이처럼 윤동주의 부끄러움은 행동하지 못하는 지식인의 자기 비판이면서 동시에 그 비판 자체가 도덕적 감수성의 증거가 되는 역설적 구조를 지닌다."
    },
    {
      id: "p3",
      text: "윤동주 시의 자연 이미지는 단순한 배경이 아니라 화자의 내면 상태와 시대적 상황을 동시에 반영하는 상징적 체계를 형성한다. 「별 헤는 밤」에서 화자가 밤하늘의 별을 하나하나 헤아리며 그리운 이름들을 불러보는 행위는 상실된 관계들에 대한 애도이자 기억을 통한 존재의 복원 시도이다. 별은 도달할 수 없는 이상의 세계를 상징하면서 동시에 어둠이 있어야만 비로소 드러나는 존재라는 점에서 고통의 시대에만 빛나는 양심의 메타포로 기능한다. 가을과 겨울이 교차하는 계절적 배경은 생명이 소멸해 가는 시간의 흐름 속에서 봄을 기다리는 희망의 구조를 내포하며, 이는 해방을 꿈꾸되 그것을 확신할 수 없었던 식민지인의 실존적 시간 감각을 정확히 포착한다."
    },
    {
      id: "p4",
      text: "윤동주의 문학적 유산은 그의 시가 저항의 방식에 대한 근본적인 질문을 제기한다는 점에서 그 의의가 깊다. 그는 총을 들거나 격문을 쓰는 직접적 저항이 아니라 자기 내면의 진실성을 끝까지 지키려는 윤리적 저항을 택했으며, 이는 외부적 행위보다 내면의 성실성이 더 근원적인 저항이 될 수 있다는 명제를 시적으로 실천한 것이다. 후쿠오카 형무소에서의 비극적 죽음은 그의 시에 담긴 예감과 각오가 수사적 과장이 아닌 실존적 진실이었음을 역설적으로 증명하였다. 해방 이후 그의 시가 한국인의 집단적 양심의 거울로 자리매김한 것은 개인의 내면적 고투가 공동체의 도덕적 자산으로 전환될 수 있음을 보여주는 문학사적 사례이며, 윤동주는 시인이자 양심의 상징으로서 한국 문화의 영구적인 정신적 좌표가 되었다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 76 지문 길이: ${len}자`);

  const customQuestions = {
    "0-0": {
      prompt: "하이라이트된 문장에서 윤동주 시의 문학사적 위치로 적절한 것은?",
      choices: [
        { id: "A", text: "자기 성찰과 양심의 고뇌를 서정적으로 형상화한 독보적 성취이다" },
        { id: "B", text: "민중의 집단적 분노를 서사시 형식으로 표현한 저항 문학이다" },
        { id: "C", text: "전통적 시조 양식을 현대적으로 계승한 고전 부흥 운동이다" },
        { id: "D", text: "서양 모더니즘 기법을 실험적으로 도입한 전위 시 운동이다" }
      ],
      answerId: "A"
    },
    "0-2": {
      prompt: "하이라이트된 문장에서 '바람에 괴로워하는 행위'가 형상화하는 것은?",
      choices: [
        { id: "A", text: "외부 세계의 폭력적 압력에 대한 내면의 고통스러운 반응이다" },
        { id: "B", text: "자연의 아름다움에 대한 시인의 감각적 감탄이다" },
        { id: "C", text: "고향에 대한 그리움이 불러일으키는 향수의 감정이다" },
        { id: "D", text: "개인적 실연으로 인한 감상적 슬픔의 표현이다" }
      ],
      answerId: "A"
    },
    "1-0": {
      prompt: "하이라이트된 문장에서 윤동주 시의 '부끄러움'이 기능하는 방식은?",
      choices: [
        { id: "A", text: "윤리적 자기 검열의 기제로 기능한다" },
        { id: "B", text: "타인에 대한 사회적 예절의 표현으로 기능한다" },
        { id: "C", text: "문학적 겸양의 수사적 장치로 기능한다" },
        { id: "D", text: "집단적 수치심의 정치적 표현으로 기능한다" }
      ],
      answerId: "A"
    },
    "1-3": {
      prompt: "하이라이트된 문장에서 윤동주의 부끄러움이 지닌 역설적 구조란?",
      choices: [
        { id: "A", text: "자기 비판 자체가 도덕적 감수성의 증거가 되는 구조이다" },
        { id: "B", text: "부끄러움을 극복함으로써 행동의 동력을 얻는 구조이다" },
        { id: "C", text: "개인의 수치심이 사회적 분노로 전환되는 구조이다" },
        { id: "D", text: "부끄러움의 감정이 시적 창작을 방해하는 구조이다" }
      ],
      answerId: "A"
    },
    "2-0": {
      prompt: "하이라이트된 문장에서 윤동주 시의 자연 이미지가 지닌 기능은?",
      choices: [
        { id: "A", text: "화자의 내면 상태와 시대적 상황을 동시에 반영하는 상징 체계이다" },
        { id: "B", text: "시인의 고향 풍경을 사실적으로 재현하는 묘사 수단이다" },
        { id: "C", text: "시적 분위기를 조성하기 위한 장식적 배경에 불과하다" },
        { id: "D", text: "과학적 관찰에 기반한 자연 현상의 객관적 기록이다" }
      ],
      answerId: "A"
    },
    "2-2": {
      prompt: "하이라이트된 문장에서 '별'이 양심의 메타포로 기능하는 근거는?",
      choices: [
        { id: "A", text: "어둠이 있어야만 비로소 드러나는 존재라는 점 때문이다" },
        { id: "B", text: "누구나 쉽게 볼 수 있는 보편적 존재라는 점 때문이다" },
        { id: "C", text: "계절에 관계없이 항상 같은 위치에 있다는 점 때문이다" },
        { id: "D", text: "과학적으로 정확하게 측정할 수 있다는 점 때문이다" }
      ],
      answerId: "A"
    },
    "3-0": {
      prompt: "하이라이트된 문장에서 윤동주 문학이 제기하는 근본적 질문은?",
      choices: [
        { id: "A", text: "저항의 방식에 대한 근본적 질문을 제기한다" },
        { id: "B", text: "예술의 자율성에 대한 미학적 질문을 제기한다" },
        { id: "C", text: "언어의 본질에 대한 철학적 질문을 제기한다" },
        { id: "D", text: "민족 정체성에 대한 역사학적 질문을 제기한다" }
      ],
      answerId: "A"
    },
    "3-2": {
      prompt: "하이라이트된 문장에서 윤동주의 죽음이 역설적으로 증명한 것은?",
      choices: [
        { id: "A", text: "시에 담긴 예감과 각오가 실존적 진실이었음을 증명하였다" },
        { id: "B", text: "문학적 상상력이 현실을 예언할 수 있음을 증명하였다" },
        { id: "C", text: "식민지 체제의 폭력성이 개인에게 미치는 물리적 영향을 증명하였다" },
        { id: "D", text: "시인의 사후에야 작품이 인정받는 문학사적 관행을 증명하였다" }
      ],
      answerId: "A"
    }
  };

  const centralThemes = [
    "「서시」를 중심으로 한 윤동주 시의 대조적 이미지와 양심의 호소",
    "부끄러움의 정서가 윤리적 자기 검열로 기능하는 역설적 구조",
    "자연 이미지가 내면 상태와 시대 상황을 동시에 반영하는 상징 체계",
    "윤리적 저항으로서의 시적 실천과 문학적 유산의 의의"
  ];
  const wrongThemes = [
    "1920년대 카프 문학의 이념적 지향과 계급 투쟁의 서사",
    "김소월 시에 나타나는 전통적 한의 정서와 민요적 율격",
    "이육사 시의 강인한 저항 의지와 초인적 자아상"
  ];

  const timeline = buildTimeline(paragraphs, customQuestions, centralThemes, wrongThemes);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "「서시」에서 화자가 죽는 날까지 바라는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "한 점 부끄럼이 없기를")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「참회록」에서 화자가 응시하는 대상은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "구리 거울")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "구리 거울에 낀 '파란 녹'이 형상화하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "자기 배반의 흔적")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "「별 헤는 밤」에서 화자가 별을 헤아리며 하는 행위는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "그리운 이름들을 불러보는")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "윤동주가 택한 저항의 방식은 어떤 종류의 저항인가?",
      answerRanges: [findRange(paragraphs, "p4", "윤리적 저항")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "윤동주가 죽음을 맞이한 장소는 어디인가?",
      answerRanges: [findRange(paragraphs, "p4", "후쿠오카 형무소")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(76, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(76, "LITERATURE", content);
}


// ══════════════════════════════════════════
// Day 77: 비문학 (NONFICTION) — 인지 편향과 의사 결정
// ══════════════════════════════════════════
function buildDay77() {
  const paragraphs = [
    {
      id: "p1",
      text: "인간의 의사 결정은 합리적 판단의 산물이라는 전통 경제학의 가정과 달리, 실제로는 다양한 인지 편향에 의해 체계적으로 왜곡된다. 대니얼 카너먼과 아모스 트버스키는 1970년대부터 실험을 통해 인간이 확률과 위험을 판단할 때 직관적 어림짐작인 휴리스틱에 의존하며, 예측 가능한 방향으로 오류를 범한다는 사실을 입증하였다. 이들이 제안한 전망 이론은 사람들이 이익과 손실을 비대칭적으로 경험한다는 점을 핵심으로 하며, 동일한 금액이라도 얻는 기쁨보다 잃는 고통이 약 두 배 더 크게 느껴진다는 손실 회피 현상을 규명하였다. 이 발견은 투자, 보험, 정책 설계 등 다양한 영역에서 인간 행동을 설명하는 이론적 틀을 제공하였다."
    },
    {
      id: "p2",
      text: "대표적인 인지 편향 중 하나인 확증 편향은 기존 신념과 일치하는 정보만을 선택적으로 수용하고, 반하는 증거는 무시하거나 과소평가하는 경향을 말한다. 이 편향은 정보 탐색 단계에서부터 작동하여 자신의 가설을 확인해 주는 자료만을 찾게 만들며, 동일한 증거를 접하더라도 자신의 입장을 지지하는 방향으로 해석하는 편향적 동화 현상을 유발한다. 소셜 미디어 알고리즘이 사용자의 기존 선호에 부합하는 콘텐츠를 우선 노출시키는 필터 버블 현상은 확증 편향을 기술적으로 증폭시키는 현대적 메커니즘으로 기능하고 있다. 확증 편향은 과학적 연구에서도 연구자가 자신의 가설에 유리한 데이터를 무의식적으로 선별하는 연구자 편향의 형태로 나타나며, 이를 방지하기 위해 이중 맹검 실험 설계와 동료 심사 제도가 운용되고 있다."
    },
    {
      id: "p3",
      text: "닻내림 효과는 처음 제시된 정보가 이후의 판단에 과도한 영향을 미치는 인지 편향으로, 협상이나 가격 판단에서 특히 강력하게 작동한다. 부동산 가격 협상에서 매도자가 높은 호가를 제시하면 그 수치가 심리적 기준점으로 작용하여 최종 합의 가격이 상승하는 경향이 있으며, 이는 구매자가 이성적으로 시장 가치를 분석하더라도 최초 제시된 수치로부터 충분히 이탈하지 못하기 때문이다. 법정에서 검찰이 높은 구형량을 제시하면 판사의 선고형이 이에 영향을 받는다는 연구 결과는 전문가조차 닻내림 효과에서 자유롭지 못함을 보여준다. 마케팅 분야에서는 정가를 높게 설정한 후 할인율을 강조하는 전략이 소비자의 체감 할인 효과를 극대화하는 데 활용되며, 이는 닻내림 효과의 상업적 응용 사례에 해당한다."
    },
    {
      id: "p4",
      text: "인지 편향에 대한 이해는 개인의 판단력 향상뿐 아니라 사회적 의사 결정 시스템의 설계에도 중요한 시사점을 제공한다. 리처드 탈러와 캐스 선스타인이 제안한 넛지 이론은 인간의 인지 편향을 제거하려 하기보다 오히려 그 특성을 활용하여 바람직한 선택을 유도하는 선택 설계의 방법론을 체계화한 것이다. 퇴직 연금의 자동 가입 제도가 대표적인 사례로, 가입을 기본 선택으로 설정하고 탈퇴를 별도의 행위로 만듦으로써 현상 유지 편향을 활용하여 저축률을 크게 높이는 데 성공하였다. 그러나 넛지 이론에 대해서는 개인의 자율적 의사 결정을 은밀하게 조작한다는 자유주의적 온정주의에 대한 비판이 존재하며, 편향의 교정과 자유의 보장 사이에서 어떤 균형을 찾을 것인가는 행동 경제학이 직면한 핵심적 윤리 과제로 남아 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 77 지문 길이: ${len}자`);

  const customQuestions = {
    "0-1": {
      prompt: "하이라이트된 문장에서 카너먼과 트버스키가 입증한 핵심 사실은?",
      choices: [
        { id: "A", text: "인간이 휴리스틱에 의존하여 예측 가능한 오류를 범한다는 사실이다" },
        { id: "B", text: "인간의 직관이 항상 합리적 분석보다 우수하다는 사실이다" },
        { id: "C", text: "경제적 의사 결정이 순수한 감정에 의해 좌우된다는 사실이다" },
        { id: "D", text: "집단적 의사 결정이 개인적 판단보다 정확하다는 사실이다" }
      ],
      answerId: "A"
    },
    "0-2": {
      prompt: "하이라이트된 문장에서 전망 이론의 핵심 내용은?",
      choices: [
        { id: "A", text: "사람들이 이익과 손실을 비대칭적으로 경험한다는 점이다" },
        { id: "B", text: "미래의 이익을 현재 가치로 정확히 환산할 수 있다는 점이다" },
        { id: "C", text: "위험 상황에서 인간이 항상 최적의 선택을 한다는 점이다" },
        { id: "D", text: "집단의 판단이 개인의 판단보다 합리적이라는 점이다" }
      ],
      answerId: "A"
    },
    "1-0": {
      prompt: "하이라이트된 문장에서 확증 편향의 정의로 적절한 것은?",
      choices: [
        { id: "A", text: "기존 신념과 일치하는 정보만 수용하고 반하는 증거는 무시하는 경향이다" },
        { id: "B", text: "새로운 정보를 접할 때마다 기존 신념을 즉시 수정하는 경향이다" },
        { id: "C", text: "다수의 의견에 무조건 동조하려는 사회적 압력의 산물이다" },
        { id: "D", text: "감정적 판단을 이성적 분석보다 우선시하는 본능적 반응이다" }
      ],
      answerId: "A"
    },
    "1-2": {
      prompt: "하이라이트된 문장에서 '필터 버블'이 확증 편향과 관련되는 방식은?",
      choices: [
        { id: "A", text: "확증 편향을 기술적으로 증폭시키는 현대적 메커니즘으로 기능한다" },
        { id: "B", text: "확증 편향을 완화하여 다양한 관점에 노출시키는 역할을 한다" },
        { id: "C", text: "확증 편향과 무관하게 순수한 정보 필터링 기능만 수행한다" },
        { id: "D", text: "확증 편향을 개인적 차원에서 집단적 차원으로 전환시킨다" }
      ],
      answerId: "A"
    },
    "2-0": {
      prompt: "하이라이트된 문장에서 닻내림 효과의 정의로 적절한 것은?",
      choices: [
        { id: "A", text: "처음 제시된 정보가 이후 판단에 과도한 영향을 미치는 편향이다" },
        { id: "B", text: "최근에 접한 정보가 오래된 정보보다 강하게 기억되는 현상이다" },
        { id: "C", text: "익숙한 대상을 낯선 대상보다 선호하는 인지적 경향이다" },
        { id: "D", text: "자신의 능력을 실제보다 과대평가하는 자기 과신의 편향이다" }
      ],
      answerId: "A"
    },
    "2-2": {
      prompt: "하이라이트된 문장에서 법정 연구가 보여주는 닻내림 효과의 특성은?",
      choices: [
        { id: "A", text: "전문가조차 닻내림 효과에서 자유롭지 못하다는 점이다" },
        { id: "B", text: "법률 전문가는 닻내림 효과를 완전히 극복할 수 있다는 점이다" },
        { id: "C", text: "닻내림 효과가 법정에서만 특수하게 발생한다는 점이다" },
        { id: "D", text: "판사의 선고형이 구형량과 무관하게 결정된다는 점이다" }
      ],
      answerId: "A"
    },
    "3-1": {
      prompt: "하이라이트된 문장에서 넛지 이론의 핵심 방법론은?",
      choices: [
        { id: "A", text: "인지 편향의 특성을 활용하여 바람직한 선택을 유도하는 선택 설계이다" },
        { id: "B", text: "법적 규제를 통해 비합리적 선택을 강제로 금지하는 방법이다" },
        { id: "C", text: "교육을 통해 모든 인지 편향을 완전히 제거하는 방법이다" },
        { id: "D", text: "인공지능이 인간 대신 최적의 의사 결정을 수행하는 방법이다" }
      ],
      answerId: "A"
    },
    "3-3": {
      prompt: "하이라이트된 문장에서 넛지 이론에 대한 비판의 핵심은?",
      choices: [
        { id: "A", text: "개인의 자율적 의사 결정을 은밀하게 조작한다는 비판이다" },
        { id: "B", text: "인지 편향의 존재를 과학적으로 입증하지 못했다는 비판이다" },
        { id: "C", text: "경제적 효율성을 저해하여 시장 기능을 왜곡한다는 비판이다" },
        { id: "D", text: "특정 정치 이념만을 지지하는 편향된 이론이라는 비판이다" }
      ],
      answerId: "A"
    }
  };

  const centralThemes = [
    "인지 편향의 발견과 전망 이론을 통한 손실 회피 현상의 규명",
    "확증 편향의 작동 방식과 필터 버블에 의한 기술적 증폭",
    "닻내림 효과의 개념과 협상·법정·마케팅에서의 작동 사례",
    "넛지 이론의 선택 설계 방법론과 자율성 침해에 대한 윤리적 논쟁"
  ];
  const wrongThemes = [
    "양자 역학의 불확정성 원리와 관측자 효과의 철학적 함의",
    "르네상스 시대 원근법의 발명이 회화에 미친 구조적 변화",
    "포유류의 체온 조절 메커니즘과 항온 동물의 진화적 이점"
  ];

  const timeline = buildTimeline(paragraphs, customQuestions, centralThemes, wrongThemes);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "인간이 확률과 위험을 판단할 때 의존하는 직관적 어림짐작을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p1", "휴리스틱")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "동일한 금액이라도 잃는 고통이 얻는 기쁨보다 크게 느껴지는 현상을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p1", "손실 회피")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "기존 신념에 반하는 증거를 무시하는 인지 편향의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "확증 편향")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "처음 제시된 정보가 이후 판단에 과도한 영향을 미치는 편향을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p3", "닻내림 효과")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "인지 편향을 활용하여 바람직한 선택을 유도하는 이론의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "넛지")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "퇴직 연금 자동 가입 제도가 활용하는 편향의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "현상 유지 편향")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(77, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(77, "NONFICTION", content);
}


// ══════════════════════════════════════════
// Day 78: 문학 (LITERATURE) — 이청준 「소문의 벽」
// ══════════════════════════════════════════
function buildDay78() {
  const paragraphs = [
    {
      id: "p1",
      text: "이청준의 소설 「소문의 벽」은 1971년에 발표된 작품으로, 진실과 소문 사이의 경계가 소멸되는 현대 사회의 소통 불가능성을 탐구한 문제적 텍스트이다. 소설의 화자인 박준은 친구 이명재가 남긴 유서의 진위를 추적하면서, 죽은 자의 진실에 접근하려는 시도가 오히려 더 많은 해석과 소문을 생산하는 역설적 구조에 빠져든다. 이 소설에서 진실은 실체적으로 존재하는 어떤 것이 아니라 다양한 해석들이 경쟁하는 담론적 장에서 끊임없이 구성되고 해체되는 유동적 대상으로 제시되며, 확정된 의미에 도달하려는 모든 시도는 또 다른 불확정성을 낳는 순환 구조를 형성한다. 이러한 인식은 절대적 진리에 대한 근대적 신뢰가 해체되기 시작한 1970년대 한국 지성사의 전환을 문학적으로 포착한 것이다."
    },
    {
      id: "p2",
      text: "소설에서 박준이 이명재의 죽음에 대한 진실을 추적하는 과정은 의도치 않게 새로운 소문을 생성하는 행위로 전화된다. 목격자들의 증언은 서로 모순되며, 각 증언자는 자신의 기억을 무의식적으로 재구성하여 일관된 서사를 만들어내려 하지만 그 서사들은 결코 하나의 진실로 수렴하지 않는다. 이러한 서사적 장치는 라쇼몬 효과와 유사한 구조를 지니되, 이청준의 소설에서는 진실의 다원성 자체보다 진실을 확정하려는 욕망이 오히려 진실에서 멀어지게 만든다는 인식론적 비극에 초점이 놓인다. 소문은 진실의 결여에서 발생하는 것이 아니라 진실에 대한 과잉된 욕망이 생산하는 불가피한 부산물로서, 말하고자 하는 충동과 알 수 없음 사이의 불균형이 만들어내는 담론적 현상인 것이다."
    },
    {
      id: "p3",
      text: "이청준은 이 소설에서 언어 자체의 신뢰성에 대한 근본적인 의문을 제기한다. 유서라는 형식은 죽은 자의 최후 진술이라는 점에서 가장 진정성 있는 언어 행위로 간주되지만, 소설에서 유서의 내용은 여러 사람에 의해 다르게 전달되고 해석됨으로써 그 진정성이 와해된다. 문자로 기록된 언어조차 읽는 주체의 맥락에 따라 상이한 의미를 산출한다는 인식은 언어가 현실을 투명하게 반영하는 도구가 아니라 현실을 왜곡하고 재구성하는 불투명한 매개체임을 보여주며, 소통의 본질에 대한 회의를 독자에게 직접적으로 환기시킨다. 이러한 언어관은 1970년대 구조주의와 해체주의의 영향이 한국 문학에 침투하기 시작한 지적 분위기를 반영하며, 이청준을 한국 소설의 지적 전위로 자리매김하게 한 핵심 요인이다."
    },
    {
      id: "p4",
      text: "「소문의 벽」의 문학적 의의는 소문이라는 일상적 현상을 존재론적 차원으로 격상시킨 데 있다. 소문의 벽이라는 제목에서 벽은 진실에 도달하는 것을 가로막는 장벽이자, 동시에 소문들이 벽돌처럼 쌓여 만들어낸 허위의 구조물이라는 이중적 의미를 지닌다. 이 벽은 물리적 실체가 아니라 인간의 해석과 전달 행위가 축적되어 형성된 담론적 장벽으로, 사회가 합의된 진실에 도달하지 못하는 구조적 원인을 상징적으로 제시한다. 이청준의 이러한 문제의식은 오늘날 가짜 뉴스와 탈진실의 시대에 더욱 절실한 통찰을 제공하며, 정보의 폭증이 진실의 확립을 오히려 방해하는 현대 사회의 역설을 반세기 전에 예견한 선구적 작품으로서 그 가치가 재평가되고 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 78 지문 길이: ${len}자`);

  const customQuestions = {
    "0-0": {
      prompt: "하이라이트된 문장에서 「소문의 벽」이 탐구하는 핵심 주제는?",
      choices: [
        { id: "A", text: "진실과 소문 사이의 경계가 소멸되는 소통 불가능성이다" },
        { id: "B", text: "식민지 지식인의 정체성 혼란과 문화적 갈등이다" },
        { id: "C", text: "산업화 과정에서의 농촌 공동체 해체와 이농 현상이다" },
        { id: "D", text: "분단 현실이 개인의 삶에 미치는 심리적 영향이다" }
      ],
      answerId: "A"
    },
    "0-2": {
      prompt: "하이라이트된 문장에서 이 소설이 제시하는 진실의 성격은?",
      choices: [
        { id: "A", text: "다양한 해석들이 경쟁하는 담론적 장에서 유동적으로 구성되는 대상이다" },
        { id: "B", text: "객관적 증거를 통해 과학적으로 확인 가능한 실체적 사실이다" },
        { id: "C", text: "권위 있는 인물의 증언에 의해 최종적으로 확정되는 판결이다" },
        { id: "D", text: "시간이 지나면 자연스럽게 드러나는 불변의 사실이다" }
      ],
      answerId: "A"
    },
    "1-1": {
      prompt: "하이라이트된 문장에서 목격자 증언들의 특징으로 적절한 것은?",
      choices: [
        { id: "A", text: "서로 모순되며 하나의 진실로 수렴하지 않는다" },
        { id: "B", text: "정확하게 일치하여 사건의 전모를 밝혀준다" },
        { id: "C", text: "시간이 지남에 따라 점차 정확해진다" },
        { id: "D", text: "물적 증거와 완전히 부합하여 신빙성이 높다" }
      ],
      answerId: "A"
    },
    "1-3": {
      prompt: "하이라이트된 문장에서 소문이 발생하는 원인으로 제시된 것은?",
      choices: [
        { id: "A", text: "진실에 대한 과잉된 욕망이 생산하는 불가피한 부산물이다" },
        { id: "B", text: "악의적 의도를 가진 개인이 의도적으로 유포하는 것이다" },
        { id: "C", text: "정보 부족으로 인한 불안감이 만들어내는 방어 기제이다" },
        { id: "D", text: "대중매체의 상업적 이익 추구가 만들어내는 구조적 산물이다" }
      ],
      answerId: "A"
    },
    "2-0": {
      prompt: "하이라이트된 문장에서 이청준이 제기하는 근본적 의문은?",
      choices: [
        { id: "A", text: "언어 자체의 신뢰성에 대한 의문이다" },
        { id: "B", text: "사법 제도의 공정성에 대한 의문이다" },
        { id: "C", text: "역사 기록의 객관성에 대한 의문이다" },
        { id: "D", text: "과학적 방법론의 타당성에 대한 의문이다" }
      ],
      answerId: "A"
    },
    "2-2": {
      prompt: "하이라이트된 문장에서 언어에 대한 인식으로 적절한 것은?",
      choices: [
        { id: "A", text: "현실을 왜곡하고 재구성하는 불투명한 매개체이다" },
        { id: "B", text: "현실을 투명하게 반영하는 정확한 도구이다" },
        { id: "C", text: "감정을 표현하는 유일한 소통 수단이다" },
        { id: "D", text: "논리적 사고를 가능하게 하는 형식적 체계이다" }
      ],
      answerId: "A"
    },
    "3-0": {
      prompt: "하이라이트된 문장에서 「소문의 벽」의 문학적 의의는?",
      choices: [
        { id: "A", text: "소문이라는 일상적 현상을 존재론적 차원으로 격상시킨 점이다" },
        { id: "B", text: "농촌 사회의 풍속을 사실적으로 기록한 민속지적 가치이다" },
        { id: "C", text: "전쟁의 참상을 생생하게 재현한 르포르타주적 성격이다" },
        { id: "D", text: "여성 인물의 내면을 최초로 주목한 페미니즘적 시도이다" }
      ],
      answerId: "A"
    },
    "3-3": {
      prompt: "하이라이트된 문장에서 이 작품이 현대 사회에 주는 통찰은?",
      choices: [
        { id: "A", text: "정보의 폭증이 진실의 확립을 오히려 방해하는 역설을 예견한다" },
        { id: "B", text: "전통적 공동체의 회복이 현대 사회 문제의 해결책임을 제시한다" },
        { id: "C", text: "기술 발전이 인간 소통의 모든 장벽을 해소할 것을 전망한다" },
        { id: "D", text: "법적 규제를 통해 허위 정보를 완전히 차단할 수 있음을 시사한다" }
      ],
      answerId: "A"
    }
  };

  const centralThemes = [
    "진실과 소문의 경계 소멸을 통해 드러나는 현대 사회의 소통 불가능성",
    "진실 추적이 새로운 소문을 생성하는 역설과 인식론적 비극",
    "유서의 진정성 와해를 통한 언어 신뢰성에 대한 근본적 의문 제기",
    "소문의 벽이라는 상징이 지닌 이중적 의미와 탈진실 시대의 선구적 통찰"
  ];
  const wrongThemes = [
    "박경리 「토지」에 나타나는 한국 근대사의 서사적 재현",
    "황석영 소설에 드러나는 산업화 시대 노동자 계급의 삶",
    "최인훈 「광장」이 제기하는 이념적 선택의 실존적 고뇌"
  ];

  const timeline = buildTimeline(paragraphs, customQuestions, centralThemes, wrongThemes);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "소설의 화자가 추적하는 것은 친구가 남긴 무엇의 진위인가?",
      answerRanges: [findRange(paragraphs, "p1", "유서")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "여러 목격자의 증언이 하나로 수렴되지 않는 구조와 유사한 것으로 언급된 효과는?",
      answerRanges: [findRange(paragraphs, "p2", "라쇼몬 효과")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "이 소설의 언어관에 영향을 준 것으로 언급된 서구 사조는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "해체주의")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "이 소설에서 언어는 현실을 반영하는 투명한 도구가 아니라 무엇으로 제시되는가?",
      answerRanges: [findRange(paragraphs, "p3", "불투명한 매개체")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "제목의 '벽'이 상징하는 것 중 하나로, 소문들이 쌓여 만들어낸 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "허위의 구조물")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이 작품이 예견한 현대 사회의 역설과 관련된 개념으로 언급된 것은?",
      answerRanges: [findRange(paragraphs, "p4", "탈진실")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(78, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(78, "LITERATURE", content);
}


// ══════════════════════════════════════════
// Day 79: 비문학 (NONFICTION) — 도시 열섬 효과
// ══════════════════════════════════════════
function buildDay79() {
  const paragraphs = [
    {
      id: "p1",
      text: "도시 열섬 효과란 도시 지역의 기온이 주변 교외 지역보다 현저하게 높게 나타나는 기후 현상으로, 토지 피복의 변화와 인간 활동에 의한 열 방출이 복합적으로 작용하여 발생한다. 자연 지표면인 초지와 삼림이 아스팔트, 콘크리트 등 인공 구조물로 대체되면 태양 복사 에너지의 흡수·저장·방출 패턴이 변화하는데, 인공 재료는 식생에 비해 열용량이 높아 낮 동안 더 많은 열을 흡수하고 야간에 서서히 방출함으로써 도시의 최저 기온을 상승시킨다. 서울의 경우 도심부와 교외 산림 지역 사이의 야간 기온 차이가 최대 섭씨 5도에 이르는 것으로 관측되며, 이러한 기온 격차는 여름철 열대야 발생 빈도의 차이로 직접 이어진다. 도시 열섬 현상은 산업혁명 이후 도시화가 진행된 모든 대도시에서 보편적으로 관찰된다."
    },
    {
      id: "p2",
      text: "도시 열섬 효과의 원인은 크게 세 가지 범주로 분류할 수 있다. 첫째, 토지 피복 변화에 의한 증발산량의 감소로, 자연 식생이 가진 증발산 기능은 잠열의 형태로 에너지를 소산시켜 지표면 온도를 낮추는 역할을 하지만, 불투수면으로 대체되면 이 냉각 메커니즘이 상실된다. 둘째, 도시 건축물의 기하학적 배치가 형성하는 도시 협곡 구조가 태양 복사의 다중 반사를 유발하여 흡수율을 높이고, 동시에 건물들이 바람의 통로를 차단함으로써 대류에 의한 열 확산을 억제한다. 셋째, 자동차, 냉난방 시스템, 산업 시설 등에서 배출되는 인공 발열이 직접적으로 대기 온도를 상승시키는데, 이 기여분은 인구 밀도가 높은 도심에서 특히 크게 나타난다. 이 세 요인은 상호 강화적으로 작용하여 열섬 효과의 강도를 증폭시킨다."
    },
    {
      id: "p3",
      text: "도시 열섬 효과는 인간의 건강과 생태계에 다차원적인 영향을 미친다. 폭염 시기에 도시 열섬은 열사병과 열탈진 등 온열 질환의 발생 위험을 가중시키며, 특히 노인, 만성 질환자, 야외 노동자 등 취약 계층에게 불균형적으로 큰 위협을 가한다. 고온 환경은 지표면 오존의 생성을 촉진하여 대기 질을 악화시키며, 이는 호흡기 질환과 심혈관 질환의 발병률을 높이는 이차적 건강 영향을 유발한다. 생태적 측면에서 도시 열섬은 식물의 개화 시기를 앞당기고 곤충의 활동 기간을 연장시키는 등 도시 생태계의 물후학적 교란을 야기하며, 일부 열대성 해충 종이 온대 도시에서 월동할 수 있는 환경을 조성하여 외래종의 정착을 촉진하는 결과를 초래하기도 한다."
    },
    {
      id: "p4",
      text: "도시 열섬 효과를 완화하기 위한 전략은 녹색 인프라와 건축 기술의 두 축을 중심으로 발전하고 있다. 옥상 녹화와 벽면 녹화는 건물 표면의 증발산을 회복시켜 국지적 냉각 효과를 제공하며, 도시 숲과 가로수 식재는 차양 효과와 증산 작용을 통해 체감 온도를 낮추는 것으로 입증되었다. 높은 반사율을 가진 도료를 지붕과 도로에 적용하는 쿨루프와 쿨페이브먼트 기술은 표면의 태양 에너지 흡수를 줄여 열 축적을 억제하는 공학적 접근이다. 투수성 포장재의 사용은 빗물의 침투를 허용하여 증발 냉각 효과를 회복시키고 동시에 도시 홍수를 예방하는 이중적 편익을 제공한다. 이러한 기술들은 도시 계획 차원에서 바람 통로의 확보, 건폐율 규제 등 거시적 공간 전략과 결합될 때 최대의 효과를 발휘한다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 79 지문 길이: ${len}자`);

  const customQuestions = {
    "0-0": {
      prompt: "하이라이트된 문장에서 도시 열섬 효과의 정의로 적절한 것은?",
      choices: [
        { id: "A", text: "도시 기온이 주변 교외보다 높게 나타나는 기후 현상이다" },
        { id: "B", text: "도시의 습도가 교외보다 높아 불쾌지수가 상승하는 현상이다" },
        { id: "C", text: "도시에서 발생한 열이 교외로 확산되는 대류 현상이다" },
        { id: "D", text: "지구 온난화로 인해 도시의 해수면이 상승하는 현상이다" }
      ],
      answerId: "A"
    },
    "0-2": {
      prompt: "하이라이트된 문장에서 서울 도심부와 교외 산림 지역의 야간 기온 차이는?",
      choices: [
        { id: "A", text: "최대 섭씨 5도에 이르는 것으로 관측된다" },
        { id: "B", text: "최대 섭씨 10도에 이르는 것으로 관측된다" },
        { id: "C", text: "평균 섭씨 2도 이내로 미미하다" },
        { id: "D", text: "계절에 관계없이 일정하게 유지된다" }
      ],
      answerId: "A"
    },
    "1-0": {
      prompt: "하이라이트된 문장에서 도시 열섬 효과의 원인 범주 수는?",
      choices: [
        { id: "A", text: "크게 세 가지 범주로 분류된다" },
        { id: "B", text: "크게 다섯 가지 범주로 분류된다" },
        { id: "C", text: "단일 원인으로 설명된다" },
        { id: "D", text: "크게 두 가지 범주로 분류된다" }
      ],
      answerId: "A"
    },
    "1-2": {
      prompt: "하이라이트된 문장에서 도시 협곡 구조가 열섬에 기여하는 방식은?",
      choices: [
        { id: "A", text: "태양 복사의 다중 반사로 흡수율을 높이고 바람 통로를 차단한다" },
        { id: "B", text: "건물 사이로 바람을 유도하여 냉각 효과를 증가시킨다" },
        { id: "C", text: "건물 그림자로 지표면의 태양광 도달을 차단한다" },
        { id: "D", text: "건물 외벽에서 열을 반사하여 대기 중으로 방출한다" }
      ],
      answerId: "A"
    },
    "2-0": {
      prompt: "하이라이트된 문장에서 도시 열섬이 미치는 영향의 범위는?",
      choices: [
        { id: "A", text: "인간의 건강과 생태계에 다차원적 영향을 미친다" },
        { id: "B", text: "건축물의 내구성에만 국한된 영향을 미친다" },
        { id: "C", text: "농업 생산성에만 직접적 영향을 미친다" },
        { id: "D", text: "수자원 관리에만 간접적 영향을 미친다" }
      ],
      answerId: "A"
    },
    "2-2": {
      prompt: "하이라이트된 문장에서 고온 환경이 대기 질에 미치는 영향은?",
      choices: [
        { id: "A", text: "지표면 오존의 생성을 촉진하여 대기 질을 악화시킨다" },
        { id: "B", text: "미세먼지를 지표면에 가라앉혀 대기 질을 개선시킨다" },
        { id: "C", text: "강수량을 증가시켜 대기 중 오염물질을 씻어낸다" },
        { id: "D", text: "바람의 세기를 강화하여 대기 오염물질을 분산시킨다" }
      ],
      answerId: "A"
    },
    "3-0": {
      prompt: "하이라이트된 문장에서 열섬 완화 전략의 두 축은?",
      choices: [
        { id: "A", text: "녹색 인프라와 건축 기술이다" },
        { id: "B", text: "교통 규제와 산업 이전이다" },
        { id: "C", text: "인구 분산과 행정 구역 조정이다" },
        { id: "D", text: "에너지 절약과 재생 에너지 전환이다" }
      ],
      answerId: "A"
    },
    "3-2": {
      prompt: "하이라이트된 문장에서 쿨루프와 쿨페이브먼트 기술의 원리는?",
      choices: [
        { id: "A", text: "높은 반사율로 태양 에너지 흡수를 줄여 열 축적을 억제한다" },
        { id: "B", text: "단열재를 두텁게 시공하여 외부 열의 유입을 차단한다" },
        { id: "C", text: "지하로 열을 전도시켜 지표면 온도를 낮춘다" },
        { id: "D", text: "냉매를 순환시켜 지붕과 도로를 인위적으로 냉각한다" }
      ],
      answerId: "A"
    }
  };

  const centralThemes = [
    "도시 열섬 효과의 정의와 인공 구조물에 의한 열 흡수·방출 패턴 변화",
    "토지 피복 변화, 도시 협곡 구조, 인공 발열이라는 세 가지 원인 범주",
    "폭염 시 건강 위협과 생태계 물후학적 교란 등 다차원적 영향",
    "녹색 인프라와 건축 기술을 결합한 열섬 완화 전략"
  ];
  const wrongThemes = [
    "판구조론에 의한 지진 발생 메커니즘과 지진파의 전파 특성",
    "광합성의 명반응과 암반응에서 일어나는 에너지 전환 과정",
    "조선 시대 실학 사상의 전개와 경세치용학파의 개혁론"
  ];

  const timeline = buildTimeline(paragraphs, customQuestions, centralThemes, wrongThemes);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "서울의 도심부와 교외 산림 지역 사이의 야간 최대 기온 차이는 얼마인가?",
      answerRanges: [findRange(paragraphs, "p1", "섭씨 5도")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "자연 식생이 가진 냉각 기능 중, 잠열의 형태로 에너지를 소산시키는 과정은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "증발산")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "건물 배치가 형성하여 태양 복사의 다중 반사를 유발하는 구조를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "도시 협곡")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "도시 열섬으로 인해 촉진되어 대기 질을 악화시키는 물질은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "오존")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "높은 반사율의 도료를 지붕에 적용하는 기술을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "쿨루프")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "빗물 침투를 허용하여 증발 냉각과 도시 홍수 예방이라는 이중 편익을 제공하는 재료는?",
      answerRanges: [findRange(paragraphs, "p4", "투수성 포장재")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(79, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(79, "NONFICTION", content);
}


// ══════════════════════════════════════════
// Day 80: 문학 (LITERATURE) — 박완서 소설 세계
// ══════════════════════════════════════════
function buildDay80() {
  const paragraphs = [
    {
      id: "p1",
      text: "박완서는 한국전쟁의 체험을 문학적 원천으로 삼아 전쟁이 개인의 내면에 남긴 상흔을 집요하게 추적한 작가이다. 그의 자전적 장편소설 「그 많던 싱아는 누가 다 먹었을까」는 전쟁 이전 개성에서의 유년 시절을 회고하면서, 전쟁이 파괴한 것이 물리적 공간만이 아니라 인간적 관계와 감각적 기억의 총체였음을 세밀한 묘사를 통해 복원한다. 싱아를 먹던 기억이라는 미각적 경험은 잃어버린 세계에 대한 그리움의 감각적 응축물로 기능하며, 이 제목 자체가 상실된 과거에 대한 화자의 존재론적 질문을 함축한다. 박완서는 거대 서사의 틀이 아닌 개인의 감각과 기억이라는 미시적 통로를 통해 전쟁의 본질에 접근하는 독자적인 서사 전략을 구축하였다."
    },
    {
      id: "p2",
      text: "박완서 소설의 또 다른 핵심 주제는 중산층 가정의 일상 속에 은폐된 위선과 허위 의식에 대한 날카로운 비판이다. 다수의 작품에서 그는 경제 성장기 한국 사회의 중산층이 물질적 풍요를 추구하면서도 정신적 빈곤과 관계의 소외를 직시하지 못하는 자기기만의 구조를 해부한다. 아파트로 대표되는 중산층의 주거 공간은 외부 세계와의 단절과 내부의 고립을 동시에 상징하며, 브랜드 소비와 자녀 교육에 대한 과도한 집착은 내면의 공허를 은폐하기 위한 보상 행위로 분석된다. 박완서의 비판이 힘을 발휘하는 것은 그가 이 중산층의 내부자로서 발언하기 때문인데, 비판의 대상인 속물적 욕망이 화자 자신에게도 내재해 있음을 인정하는 자기 반성적 서술 태도가 독자에게 도덕적 우위가 아닌 공감적 성찰을 이끌어낸다."
    },
    {
      id: "p3",
      text: "박완서 문학에서 여성 인물들은 가부장제의 억압 속에서도 생존의 주체로서 삶을 이어가는 강인한 존재로 그려진다. 전쟁으로 남성 가장이 부재하거나 무력화된 가정에서 여성들은 가족의 생계를 책임지며 현실적 문제 해결의 주도권을 장악하는데, 이러한 설정은 가부장적 이데올로기가 규정하는 여성상과 실제 역사적 경험 사이의 괴리를 드러내는 서사적 장치로 기능한다. 특히 어머니 인물들은 자식의 생존을 위해 모든 사회적 체면과 도덕적 원칙마저 유보할 수 있는 원초적 생명력의 담지자로 형상화되며, 이 원초적 힘은 숭고함과 잔인함을 동시에 내포하는 양가적 속성을 지닌다. 박완서는 여성의 경험을 통해 전쟁과 근대화라는 거시적 역사를 재조명함으로써, 공식 역사에서 주변화된 목소리를 문학적으로 복원하는 작업을 수행하였다."
    },
    {
      id: "p4",
      text: "박완서 소설의 문체는 일상어의 리듬과 감각적 구체성을 결합한 독특한 서술 방식으로 한국 현대 소설의 문체적 지평을 확장하였다. 그의 문장은 구어체의 자연스러운 호흡을 유지하면서도 핵심적 순간에는 감각적 묘사의 밀도를 극대화하여 독자의 몰입을 유도하는데, 이는 문어적 형식성과 구어적 친밀감 사이의 이상적 균형을 달성한 것으로 평가된다. 음식의 맛과 냄새, 옷감의 촉감, 계절의 빛깔 등 감각적 디테일은 서사의 장식이 아니라 인물의 심리와 시대적 분위기를 전달하는 핵심적 서사 수단으로 기능한다. 박완서는 이러한 문체를 통해 한국 문학에서 일상의 문학적 격상이라는 과제를 가장 성공적으로 수행한 작가로 기억되고 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 80 지문 길이: ${len}자`);

  const customQuestions = {
    "0-0": {
      prompt: "하이라이트된 문장에서 박완서 문학의 원천으로 제시된 것은?",
      choices: [
        { id: "A", text: "한국전쟁의 체험을 문학적 원천으로 삼았다" },
        { id: "B", text: "산업화 과정의 노동 현장을 문학적 원천으로 삼았다" },
        { id: "C", text: "해외 유학 경험을 문학적 원천으로 삼았다" },
        { id: "D", text: "전통 민속 문화의 연구를 문학적 원천으로 삼았다" }
      ],
      answerId: "A"
    },
    "0-2": {
      prompt: "하이라이트된 문장에서 '싱아를 먹던 기억'이 기능하는 방식은?",
      choices: [
        { id: "A", text: "잃어버린 세계에 대한 그리움의 감각적 응축물로 기능한다" },
        { id: "B", text: "전쟁 중 겪은 굶주림의 고통을 직접적으로 환기시킨다" },
        { id: "C", text: "농촌 공동체의 식문화를 기록하는 민속지적 자료로 기능한다" },
        { id: "D", text: "전후 경제 부흥기의 풍요로운 식생활을 상징한다" }
      ],
      answerId: "A"
    },
    "1-0": {
      prompt: "하이라이트된 문장에서 박완서가 비판하는 핵심 대상은?",
      choices: [
        { id: "A", text: "중산층 일상 속에 은폐된 위선과 허위 의식이다" },
        { id: "B", text: "하층민에 대한 사회적 차별과 계급 착취이다" },
        { id: "C", text: "정치 권력의 부패와 독재 체제의 폭력성이다" },
        { id: "D", text: "전통 문화의 소멸과 서구 문화의 무분별한 수용이다" }
      ],
      answerId: "A"
    },
    "1-3": {
      prompt: "하이라이트된 문장에서 박완서 비판의 힘의 원천은?",
      choices: [
        { id: "A", text: "속물적 욕망이 자신에게도 내재함을 인정하는 자기 반성적 태도이다" },
        { id: "B", text: "중산층 외부자로서의 객관적 관찰력이다" },
        { id: "C", text: "학문적 이론에 기반한 사회과학적 분석력이다" },
        { id: "D", text: "도덕적 우위에서 발언하는 계몽적 어조이다" }
      ],
      answerId: "A"
    },
    "2-0": {
      prompt: "하이라이트된 문장에서 박완서 소설의 여성 인물이 그려지는 방식은?",
      choices: [
        { id: "A", text: "가부장제 억압 속에서도 생존의 주체로서 강인하게 그려진다" },
        { id: "B", text: "남성 인물에 종속된 수동적 조력자로 그려진다" },
        { id: "C", text: "이상화된 전통적 여성상의 전형으로 그려진다" },
        { id: "D", text: "서구적 가치관을 대변하는 신여성의 모습으로 그려진다" }
      ],
      answerId: "A"
    },
    "2-2": {
      prompt: "하이라이트된 문장에서 어머니 인물들이 형상화되는 방식은?",
      choices: [
        { id: "A", text: "원초적 생명력의 담지자로서 숭고함과 잔인함을 동시에 내포한다" },
        { id: "B", text: "헌신적 자기희생만을 보여주는 이상적 모성으로 형상화된다" },
        { id: "C", text: "가부장적 질서를 수호하는 보수적 존재로 형상화된다" },
        { id: "D", text: "자녀의 독립을 적극적으로 장려하는 진보적 존재로 형상화된다" }
      ],
      answerId: "A"
    },
    "3-0": {
      prompt: "하이라이트된 문장에서 박완서 문체의 특징은?",
      choices: [
        { id: "A", text: "일상어의 리듬과 감각적 구체성을 결합한 독특한 서술 방식이다" },
        { id: "B", text: "고도로 지적인 관념어를 구사하는 사변적 문체이다" },
        { id: "C", text: "시적 운율과 상징을 중심으로 한 서정적 문체이다" },
        { id: "D", text: "저널리즘적 간결함을 추구하는 보도문 형식의 문체이다" }
      ],
      answerId: "A"
    },
    "3-2": {
      prompt: "하이라이트된 문장에서 감각적 디테일이 서사에서 기능하는 방식은?",
      choices: [
        { id: "A", text: "인물의 심리와 시대적 분위기를 전달하는 핵심 서사 수단이다" },
        { id: "B", text: "사건의 전개를 지연시키는 장식적 삽입 요소이다" },
        { id: "C", text: "독자의 오감을 자극하기 위한 기술적 수사법이다" },
        { id: "D", text: "서사의 객관성을 확보하기 위한 사실적 기록이다" }
      ],
      answerId: "A"
    }
  };

  const centralThemes = [
    "한국전쟁 체험의 감각적 복원과 미시적 서사를 통한 역사 접근",
    "중산층의 물질적 풍요 이면에 존재하는 위선과 자기기만에 대한 비판",
    "가부장제 속 여성의 생존 주체성과 어머니 인물의 양가적 형상화",
    "일상어와 감각적 세부 묘사를 결합한 독자적 문체의 문학적 성취"
  ];
  const wrongThemes = [
    "김승옥 소설에 나타나는 감수성의 혁명과 도시적 고독의 미학",
    "조세희 「난장이가 쏘아올린 작은 공」의 산업화 비판과 기법적 실험",
    "이문열 소설의 지적 탐구와 전통 가치에 대한 보수적 성찰"
  ];

  const timeline = buildTimeline(paragraphs, customQuestions, centralThemes, wrongThemes);
  const cards = buildRecallCards(paragraphs, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "전쟁 이전의 유년 시절을 회고한 자전적 장편소설의 제목은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "그 많던 싱아는 누가 다 먹었을까")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "박완서가 거대 서사 대신 활용한 서사적 통로는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "개인의 감각과 기억")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "중산층의 주거 공간으로 외부와의 단절과 내부의 고립을 상징하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "아파트")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "어머니 인물이 형상화되는 존재적 특성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "원초적 생명력")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "박완서 문체가 달성한 이상적 균형은 어떤 두 요소 사이의 것인가?",
      answerRanges: [findRange(paragraphs, "p4", "문어적 형식성과 구어적 친밀감")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "박완서가 가장 성공적으로 수행한 문학적 과제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "일상의 문학적 격상")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const content = assembleFull(80, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
  return wrapBatchItem(80, "LITERATURE", content);
}


// ══════════════════════════════════════════
// 메인 실행
// ══════════════════════════════════════════
function main() {
  console.log('=== 비트겐슈타인2 Day 76~80 콘텐츠 빌드 시작 ===\n');

  const items = [
    buildDay76(),
    buildDay77(),
    buildDay78(),
    buildDay79(),
    buildDay80()
  ];

  // 길이 검증
  let hasWarning = false;
  items.forEach(item => {
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
    console.log('\n[주의] 경고가 있지만 파일은 생성합니다.\n');
  }

  // 배치 파일 읽기
  console.log('\n배치 파일 읽기...');
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`배치 파일 총 items: ${batchData.items.length}`);

  // items[75]~[79] 교체 (Day 76~80은 0-indexed 75~79)
  for (let i = 0; i < 5; i++) {
    const targetIdx = 75 + i;
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
