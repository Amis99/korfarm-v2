#!/usr/bin/env node
// 비트겐슈타인2 Day 51~55 콘텐츠 빌더
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

function totalLength(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

function shuffleWithAnswer(choices, correctId) {
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

function splitIntoCards(text, n) {
  const totalLen = text.length;
  const avgLen = Math.floor(totalLen / n);
  const cards = [];
  let pos = 0;

  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      cards.push({ id: `c${i + 1}`, text: text.substring(pos) });
    } else {
      let target = pos + avgLen;
      let bestCut = target;
      for (let j = Math.max(pos + 50, target - 50); j < Math.min(totalLen, target + 50); j++) {
        if (text[j] === '.' && j + 1 < totalLen && (text[j + 1] === ' ' || text[j + 1] === '\n')) {
          bestCut = j + 1;
          break;
        }
      }
      while (bestCut < totalLen && text[bestCut] === ' ') bestCut++;
      cards.push({ id: `c${i + 1}`, text: text.substring(pos, bestCut) });
      pos = bestCut;
    }
  }
  return cards;
}

function buildContent(dayIndex, subArea, paragraphs, timeline, cards, confirmQuestions) {
  const dayStr = String(dayIndex).padStart(3, '0');
  const subAreaLabel = subArea === 'LITERATURE' ? '문학' : '비문학';
  return {
    content_type: "DAILY_READING",
    level_id: "WITTGENSTEIN_2",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content: {
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
    }
  };
}

// ── 공통 타임라인 빌더 ──
function buildDayTimeline(paragraphs, specialQuestions, centralThemes, wrongThemes) {
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);
    sents.forEach((sent, si) => {
      stepNum++;
      const range = { paragraphId: para.id, start: sent.start, end: sent.end };
      let question;

      const key = `${pi}_${si}`;
      if (specialQuestions[key]) {
        question = specialQuestions[key];
      } else {
        const otherSents = [];
        paragraphs.forEach((op, opi) => {
          if (opi !== pi) {
            const os = findSentences(op.text);
            os.forEach(s => otherSents.push(s.text));
          }
        });
        const correctText = sent.text.length > 60 ? sent.text.substring(0, 60) + '...' : sent.text;
        const wrongs = [];
        for (let k = 0; k < otherSents.length && wrongs.length < 3; k++) {
          const t = otherSents[k].length > 60 ? otherSents[k].substring(0, 60) + '...' : otherSents[k];
          if (t !== correctText) wrongs.push(t);
        }
        const allChoices = [
          { id: "A", text: correctText },
          { id: "B", text: wrongs[0] || "해당 없음" },
          { id: "C", text: wrongs[1] || "해당 없음" },
          { id: "D", text: wrongs[2] || "해당 없음" }
        ];
        const shuffled = shuffleWithAnswer(allChoices, "A");
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
    const cShuffled = shuffleWithAnswer(cChoices, "A");
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

// ── Day 51: 비문학 (NONFICTION, 홀수) ── 주제: 인지편향과 의사결정
function buildDay51() {
  const paragraphs = [
    {
      id: "p1",
      text: "인간의 의사결정은 합리적 추론의 산물이라는 전통적 경제학의 가정과 달리, 실제로는 다양한 인지 편향에 의해 체계적으로 왜곡된다. 행동경제학의 창시자로 평가받는 대니얼 카너먼과 아모스 트버스키는 1970년대에 전망 이론을 제안하며, 인간이 이득과 손실을 대칭적으로 평가하지 않는다는 사실을 실증적으로 입증하였다. 이들의 연구에 따르면, 동일한 크기의 이득이 주는 심리적 만족보다 동일한 크기의 손실이 야기하는 심리적 고통이 약 두 배 이상 크며, 이러한 비대칭성을 손실 회피라 부른다. 손실 회피는 투자자가 손실을 본 주식을 비합리적으로 오래 보유하거나, 소비자가 이미 지불한 비용에 집착하는 매몰 비용 효과 등 일상적 의사결정의 여러 영역에서 관찰되는 현상이다."
    },
    {
      id: "p2",
      text: "확증 편향은 자신의 기존 믿음이나 가설에 부합하는 정보를 선택적으로 수집하고 해석하며, 이에 반하는 증거는 무시하거나 과소평가하는 경향을 가리킨다. 이 편향은 과학적 탐구에서조차 연구자가 자신의 가설을 지지하는 데이터만을 편향적으로 보고하는 출판 편향의 구조적 원인으로 작용하며, 정치적 영역에서는 유권자들이 자신이 지지하는 후보의 정책만을 긍정적으로 해석하는 현상으로 나타난다. 소셜 미디어 환경에서 확증 편향은 알고리즘에 의한 필터 버블과 결합하여 더욱 강화되는 양상을 보이는데, 플랫폼이 사용자의 기존 선호에 부합하는 콘텐츠를 우선적으로 노출시킴으로써 개인은 자신의 관점을 지속적으로 확인하는 정보 환경 속에 갇히게 된다. 이러한 정보 편식은 사회적 차원에서 집단 극화를 촉진하여 건전한 공론장의 형성을 어렵게 만든다."
    },
    {
      id: "p3",
      text: "가용성 휴리스틱은 어떤 사건의 발생 확률을 판단할 때, 실제 통계적 빈도보다는 해당 사건이 기억에서 얼마나 쉽게 떠오르는지에 의존하여 추정하는 인지적 지름길을 의미한다. 항공기 사고에 대한 언론 보도가 집중적으로 이루어지면 사람들은 항공 여행의 위험성을 실제보다 크게 과대평가하며, 반면 자동차 사고처럼 빈번하지만 개별적으로 덜 보도되는 위험은 과소평가하는 경향이 나타난다. 이 휴리스틱은 자연재해, 범죄, 질병 등에 대한 공포의 비합리적 분포를 설명하는 데 유용하며, 정책 입안자들이 언론에 많이 보도되는 위험에 자원을 과도하게 집중하고 실제로 더 치명적인 위험에는 충분한 주의를 기울이지 않는 자원 배분의 왜곡을 초래할 수 있다."
    },
    {
      id: "p4",
      text: "인지 편향에 대한 이해는 개인의 의사결정 개선뿐 아니라 공공정책의 설계에도 중요한 시사점을 제공한다. 리처드 탈러와 캐스 선스타인이 제안한 넛지 이론은 인간의 인지적 한계를 인정하면서도 선택의 자유를 침해하지 않는 방식으로 바람직한 행동을 유도하는 정책 설계를 지향한다. 퇴직연금 자동 가입 제도는 현상 유지 편향을 활용한 대표적인 넛지로, 가입 여부를 능동적으로 결정해야 하는 기존 방식에서는 상당수가 미가입 상태를 유지하였으나 자동 가입 후 탈퇴를 선택하도록 기본값을 변경하자 가입률이 획기적으로 증가하였다. 그러나 넛지가 개인의 자율적 판단을 은밀히 조종할 수 있다는 자유주의적 비판과, 구조적 불평등 문제를 개인의 행동 교정으로 환원시킨다는 비판도 제기되고 있어, 인지 편향에 기반한 정책 개입의 윤리적 경계에 대한 심도 있는 논의가 필요하다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 51 지문 길이: ${len}자`);

  const specialQuestions = {
    "0_0": {
      prompt: "하이라이트된 문장에서 전통적 경제학의 가정과 실제 인간 의사결정의 차이로 적절한 것은?",
      choices: [
        { id: "A", text: "합리적 추론의 산물이라는 가정과 달리 인지 편향에 의해 왜곡된다" },
        { id: "B", text: "감정적 직관이라는 가정과 달리 논리적 계산에 의해 결정된다" },
        { id: "C", text: "본능적 반응이라는 가정과 달리 학습에 의해 완벽히 교정된다" },
        { id: "D", text: "사회적 합의라는 가정과 달리 개인의 이기심에 의해 결정된다" }
      ],
      answerId: "A"
    },
    "0_2": {
      prompt: "하이라이트된 문장에서 손실 회피의 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "동일한 크기의 손실이 주는 고통이 이득의 만족보다 약 두 배 이상 크다" },
        { id: "B", text: "인간은 손실을 완전히 회피하여 위험이 없는 선택만을 한다" },
        { id: "C", text: "이득과 손실의 크기에 관계없이 항상 동일한 심리적 반응을 보인다" },
        { id: "D", text: "손실을 경험하면 그 후 이득에 대한 기대를 완전히 포기한다" }
      ],
      answerId: "A"
    },
    "1_0": {
      prompt: "하이라이트된 문장에서 확증 편향의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "기존 믿음에 부합하는 정보를 선택적으로 수집하고 반대 증거를 무시하는 경향이다" },
        { id: "B", text: "새로운 정보에 지나치게 민감하게 반응하여 기존 믿음을 쉽게 바꾸는 경향이다" },
        { id: "C", text: "모든 정보를 동등하게 평가하여 편향 없는 결론을 도출하는 경향이다" },
        { id: "D", text: "정보의 양이 증가할수록 의사결정의 정확도가 비례하여 높아지는 현상이다" }
      ],
      answerId: "A"
    },
    "1_2": {
      prompt: "하이라이트된 문장에서 소셜 미디어 환경에서 확증 편향이 강화되는 메커니즘으로 적절한 것은?",
      choices: [
        { id: "A", text: "알고리즘이 사용자의 기존 선호에 부합하는 콘텐츠를 우선 노출시킨다" },
        { id: "B", text: "사용자가 의도적으로 반대 관점의 콘텐츠만을 검색한다" },
        { id: "C", text: "소셜 미디어 플랫폼이 모든 정보를 무작위로 배분한다" },
        { id: "D", text: "알고리즘이 사용자에게 가장 불편한 정보를 우선적으로 제공한다" }
      ],
      answerId: "A"
    },
    "2_0": {
      prompt: "하이라이트된 문장에서 가용성 휴리스틱의 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "사건이 기억에서 쉽게 떠오르는 정도에 의존하여 발생 확률을 추정하는 인지적 지름길이다" },
        { id: "B", text: "사용 가능한 모든 데이터를 종합하여 정확한 확률을 계산하는 방법이다" },
        { id: "C", text: "특정 사건의 원인을 체계적으로 분석하는 과학적 추론 방식이다" },
        { id: "D", text: "전문가의 판단을 참고하여 의사결정의 정확성을 높이는 전략이다" }
      ],
      answerId: "A"
    },
    "2_2": {
      prompt: "하이라이트된 문장에서 가용성 휴리스틱이 정책에 미치는 영향으로 적절한 것은?",
      choices: [
        { id: "A", text: "언론에 많이 보도되는 위험에 자원을 과도하게 집중하고 실제 위험에는 주의를 기울이지 않는다" },
        { id: "B", text: "정책 입안자들이 모든 위험에 균등하게 자원을 배분하게 만든다" },
        { id: "C", text: "언론 보도와 무관하게 과학적 근거에 따라 자원을 배분하게 된다" },
        { id: "D", text: "정책 결정에서 전문가의 의견이 완전히 배제되는 결과를 초래한다" }
      ],
      answerId: "A"
    },
    "3_0": {
      prompt: "하이라이트된 문장에서 인지 편향 이해의 의의로 적절한 것은?",
      choices: [
        { id: "A", text: "개인의 의사결정 개선뿐 아니라 공공정책 설계에도 시사점을 제공한다" },
        { id: "B", text: "인간의 의사결정이 완벽하다는 것을 증명하는 데 활용된다" },
        { id: "C", text: "경제학 이론의 수학적 정교화에만 기여하는 학술적 성과이다" },
        { id: "D", text: "인지 편향이 존재하지 않는다는 반증을 제공하는 데 의의가 있다" }
      ],
      answerId: "A"
    },
    "3_2": {
      prompt: "하이라이트된 문장에서 퇴직연금 자동 가입 제도가 활용하는 인지 편향은 무엇인가?",
      choices: [
        { id: "A", text: "현상 유지 편향을 활용한 넛지이다" },
        { id: "B", text: "손실 회피를 이용한 강제적 규제이다" },
        { id: "C", text: "확증 편향을 극복하기 위한 교육 프로그램이다" },
        { id: "D", text: "가용성 휴리스틱을 차단하기 위한 정보 통제이다" }
      ],
      answerId: "A"
    }
  };

  const centralThemes = [
    "전망 이론과 손실 회피를 통해 본 인간 의사결정의 비대칭적 왜곡",
    "확증 편향의 작동 방식과 소셜 미디어 환경에서의 강화 메커니즘",
    "가용성 휴리스틱의 개념과 정책적 자원 배분 왜곡에 미치는 영향",
    "넛지 이론의 정책적 활용과 이에 대한 윤리적 비판"
  ];
  const wrongThemes = [
    "진화심리학에서 본 인간 공격성의 기원과 사회적 통제 방안",
    "양자역학의 불확정성 원리와 관측 문제에 대한 해석 논쟁",
    "중세 유럽의 길드 제도와 근대적 노동 시장의 형성 과정"
  ];

  const timeline = buildDayTimeline(paragraphs, specialQuestions, centralThemes, wrongThemes);

  const fullText = paragraphs.map(p => p.text).join('\n');
  const cards = splitIntoCards(fullText, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "인간이 이득과 손실을 비대칭적으로 평가한다는 이론의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "전망 이론")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "동일한 크기의 손실이 이득보다 더 큰 심리적 고통을 야기하는 현상을 무엇이라 부르는가?",
      answerRanges: [findRange(paragraphs, "p1", "손실 회피")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "소셜 미디어 알고리즘이 사용자의 기존 선호에 맞는 콘텐츠만 보여주는 현상을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "필터 버블")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "사건의 발생 확률을 기억의 용이성에 의존하여 판단하는 인지적 지름길을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p3", "가용성 휴리스틱")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "인지적 한계를 인정하면서 선택의 자유를 침해하지 않고 바람직한 행동을 유도하는 정책 이론의 이름은?",
      answerRanges: [findRange(paragraphs, "p4", "넛지 이론")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "퇴직연금 자동 가입 제도가 활용하는 인지 편향의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "현상 유지 편향")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(51, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 52: 문학 (LITERATURE, 짝수) ── 주제: 윤동주의 시 세계
function buildDay52() {
  const paragraphs = [
    {
      id: "p1",
      text: "윤동주의 시는 일제 강점기라는 암흑의 시대에 순수한 양심의 언어로 저항의 의미를 구현한 한국 문학의 가장 순결한 유산으로 평가받고 있다. 그의 대표 시집 『하늘과 바람과 별과 시』는 1948년에 유고 시집으로 출간되었으며, 수록된 작품들은 대부분 연희전문학교와 도시샤 대학 재학 시절에 창작된 것들이다. 윤동주 시의 가장 두드러진 특질은 거대한 역사적 폭력 앞에서 자기 내면을 향한 성찰을 통해 저항의 윤리를 모색한다는 점에 있다. 그의 시에는 제국주의에 대한 직접적인 분노나 선동적인 구호가 등장하지 않으며, 대신 부끄러움과 자기 연민, 그리고 순결한 삶에 대한 열망이 서정적 언어로 표현되어 독자의 양심에 조용히 호소하는 힘을 발휘한다."
    },
    {
      id: "p2",
      text: "「서시」에서 윤동주는 죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를 소원한다고 고백함으로써, 외적 성취가 아닌 내면적 도덕성을 삶의 궁극적 기준으로 설정하고 있다. 잎새에 이는 바람에도 괴로워하는 화자의 극도로 예민한 감수성은 미세한 불의에도 반응하는 양심의 촉각을 상징하며, 이러한 자기 경계의 태도가 시 전체를 관통하는 윤리적 긴장을 형성한다. 별을 노래하는 마음으로 모든 죽어가는 것을 사랑해야지라는 구절에서 별은 순수한 이상을 상징하고, 죽어가는 것은 식민지 현실에서 소멸해 가는 인간적 가치를 함축한다. 이 시의 서정적 아름다움은 개인의 도덕적 결의와 시대적 비극이 만나는 지점에서 발생하며, 바로 이 때문에 「서시」는 단순한 개인 서정을 넘어 시대의 양심을 대표하는 텍스트로 읽히게 된다."
    },
    {
      id: "p3",
      text: "「자화상」에서 윤동주는 산모퉁이 우물에 비친 자신의 모습을 바라보며 자아와의 대면을 시도한다. 우물 속의 나는 현재의 자아를 비추는 거울이자 동시에 이상적 자아와의 괴리를 인식하게 하는 매개체로 기능한다. 화자가 우물 속의 사나이를 미워하다가 가엾어하고 다시 그리워하는 감정의 순환은 자기 혐오와 자기 연민, 그리고 자기 수용 사이를 오가는 복잡한 내면적 역동을 드러낸다. 이러한 자아 성찰의 구조는 식민지 지식인이 행동하지 못하는 자신에 대한 부끄러움과 그럼에도 순수함을 잃지 않으려는 의지 사이에서 갈등하는 실존적 상황의 시적 형상화이며, 이 작품을 자기 고백의 문학적 전범으로 만들어준다."
    },
    {
      id: "p4",
      text: "윤동주 시의 문학사적 의의는 저항의 개념을 확장했다는 점에서 특히 주목된다. 일제 강점기의 저항 문학이 대체로 민족의식의 직접적 고양이나 사회적 투쟁의 선동에 초점을 맞추었다면, 윤동주는 자기 내면의 순수성을 지켜내는 행위 자체를 저항의 한 형태로 제시하였다. 이는 외적 행동만을 저항으로 인정하는 관점에서 벗어나, 양심을 보존하고 부끄러움의 감각을 유지하는 것이 전체주의적 폭력에 대한 본질적인 대응이 될 수 있음을 보여주는 것이다. 윤동주의 시는 해방 이후부터 현재에 이르기까지 한국인에게 가장 사랑받는 시로 자리매김하고 있으며, 그의 시가 지닌 보편적 호소력은 시대와 국경을 초월하여 양심적 삶의 의미를 묻는 모든 독자에게 여전히 깊은 울림을 전하고 있다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 52 지문 길이: ${len}자`);

  const specialQuestions = {
    "0_0": {
      prompt: "하이라이트된 문장에서 윤동주 시의 문학사적 위상으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "순수한 양심의 언어로 저항의 의미를 구현한 한국 문학의 유산이다" },
        { id: "B", text: "사회주의 이념을 직접적으로 선전한 프로문학의 대표적 성과이다" },
        { id: "C", text: "모더니즘 형식 실험에 치중한 전위적 시 운동의 산물이다" },
        { id: "D", text: "전통 시조의 형식을 현대적으로 계승한 민족 문학의 정수이다" }
      ],
      answerId: "A"
    },
    "0_2": {
      prompt: "하이라이트된 문장에서 윤동주 시의 가장 두드러진 특질로 적절한 것은?",
      choices: [
        { id: "A", text: "자기 내면 성찰을 통해 저항의 윤리를 모색한다는 점이다" },
        { id: "B", text: "제국주의에 대한 직접적 분노를 격렬하게 표출한다는 점이다" },
        { id: "C", text: "형식적 실험을 통해 언어의 한계를 탐구한다는 점이다" },
        { id: "D", text: "자연의 아름다움을 사실적으로 묘사한다는 점이다" }
      ],
      answerId: "A"
    },
    "1_0": {
      prompt: "하이라이트된 문장에서 윤동주가 삶의 궁극적 기준으로 설정한 것은?",
      choices: [
        { id: "A", text: "외적 성취가 아닌 내면적 도덕성을 삶의 기준으로 삼고 있다" },
        { id: "B", text: "사회적 명성과 물질적 성공을 삶의 최고 가치로 추구하고 있다" },
        { id: "C", text: "민족 독립이라는 거시적 목표를 위한 헌신을 강조하고 있다" },
        { id: "D", text: "학문적 탁월성을 통한 자기실현을 궁극적 목표로 삼고 있다" }
      ],
      answerId: "A"
    },
    "1_2": {
      prompt: "하이라이트된 문장에서 '별'과 '죽어가는 것'이 각각 상징하는 바로 적절한 것은?",
      choices: [
        { id: "A", text: "별은 순수한 이상을, 죽어가는 것은 소멸해 가는 인간적 가치를 함축한다" },
        { id: "B", text: "별은 물질적 풍요를, 죽어가는 것은 전통적 농경 사회를 의미한다" },
        { id: "C", text: "별은 일본 제국을, 죽어가는 것은 저항 세력의 약화를 상징한다" },
        { id: "D", text: "별은 과학적 진리를, 죽어가는 것은 비과학적 미신의 소멸을 의미한다" }
      ],
      answerId: "A"
    },
    "2_0": {
      prompt: "하이라이트된 문장에서 「자화상」의 핵심 행위로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "우물에 비친 자신의 모습을 바라보며 자아와의 대면을 시도한다" },
        { id: "B", text: "거울에 비친 타인의 모습을 관찰하며 사회적 비판을 시도한다" },
        { id: "C", text: "강물에 비친 자연을 묘사하며 생태적 성찰을 시도한다" },
        { id: "D", text: "사진 속 과거의 자신을 회상하며 향수에 젖어든다" }
      ],
      answerId: "A"
    },
    "2_2": {
      prompt: "하이라이트된 문장에서 화자가 우물 속 사나이에 대해 보이는 감정의 순환으로 적절한 것은?",
      choices: [
        { id: "A", text: "미워하다가 가엾어하고 다시 그리워하는 감정의 순환이다" },
        { id: "B", text: "존경하다가 경멸하고 다시 무관심해지는 감정의 변화이다" },
        { id: "C", text: "두려워하다가 안심하고 다시 분노하는 감정의 반복이다" },
        { id: "D", text: "사랑하다가 증오하고 완전히 잊어버리는 감정의 소멸이다" }
      ],
      answerId: "A"
    },
    "3_0": {
      prompt: "하이라이트된 문장에서 윤동주 시의 문학사적 의의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "저항의 개념을 확장했다는 점에서 특히 주목된다" },
        { id: "B", text: "한국 시의 형식적 혁신을 이끌었다는 점에서 평가된다" },
        { id: "C", text: "서구 시의 기법을 최초로 도입했다는 점에서 의의가 있다" },
        { id: "D", text: "대중적 가요의 토대를 마련했다는 점에서 기여가 크다" }
      ],
      answerId: "A"
    },
    "3_2": {
      prompt: "하이라이트된 문장에서 윤동주가 제시한 저항의 형태로 적절한 것은?",
      choices: [
        { id: "A", text: "양심을 보존하고 부끄러움의 감각을 유지하는 것이 전체주의에 대한 본질적 대응이다" },
        { id: "B", text: "무력 투쟁을 통한 직접적 저항만이 진정한 저항으로 인정받을 수 있다" },
        { id: "C", text: "문학적 창작을 포기하고 실천적 행동에 전념하는 것이 저항이다" },
        { id: "D", text: "해외 망명을 통해 안전한 곳에서 비판적 글을 쓰는 것이 저항이다" }
      ],
      answerId: "A"
    }
  };

  const centralThemes = [
    "윤동주 시의 문학사적 위상과 내면 성찰을 통한 저항의 특질",
    "「서시」에 나타난 도덕적 결의와 서정적 아름다움의 결합",
    "「자화상」에서 드러나는 자아와의 대면과 실존적 갈등의 시적 형상화",
    "저항 개념의 확장과 윤동주 시의 보편적 호소력"
  ];
  const wrongThemes = [
    "김소월 시에 나타나는 전통적 한의 정서와 민요적 율격",
    "1920년대 프로문학 운동의 전개와 사회적 의의",
    "정지용 시에 나타나는 감각적 이미지즘과 모더니즘적 기법"
  ];

  const timeline = buildDayTimeline(paragraphs, specialQuestions, centralThemes, wrongThemes);

  const fullText = paragraphs.map(p => p.text).join('\n');
  const cards = splitIntoCards(fullText, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "윤동주의 유고 시집의 제목은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "하늘과 바람과 별과 시")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「서시」에서 화자가 죽는 날까지 소원하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "한 점 부끄럼이 없기를")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「서시」에서 화자의 극도로 예민한 감수성을 보여주는 자연 현상은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "잎새에 이는 바람")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "「자화상」에서 화자가 자신의 모습을 비추어 보는 장소는 어디인가?",
      answerRanges: [findRange(paragraphs, "p3", "우물")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "윤동주가 자기 내면의 순수성을 지켜내는 행위 자체를 무엇의 한 형태로 제시하였는가?",
      answerRanges: [findRange(paragraphs, "p4", "저항")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "윤동주의 시가 가장 사랑받는 시로 자리매김한 시기는 언제부터인가?",
      answerRanges: [findRange(paragraphs, "p4", "해방 이후")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(52, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 53: 비문학 (NONFICTION, 홀수) ── 주제: 인공지능의 윤리와 편향
function buildDay53() {
  const paragraphs = [
    {
      id: "p1",
      text: "인공지능 기술의 급속한 발전은 의료 진단, 사법 판결, 채용 과정 등 인간의 삶에 중대한 영향을 미치는 영역에서 자동화된 의사결정을 가능하게 하였으나, 동시에 이러한 시스템이 내포하는 편향과 불공정성에 대한 심각한 우려를 불러일으키고 있다. 머신러닝 알고리즘은 학습 데이터에 내재된 패턴을 추출하여 예측 모델을 구축하는데, 학습 데이터 자체에 역사적으로 축적된 사회적 편견이 반영되어 있다면 알고리즘은 이를 학습하여 기존의 차별적 구조를 재생산하거나 증폭시키게 된다. 아마존이 개발한 인공지능 채용 시스템이 여성 지원자를 체계적으로 불이익하게 평가한 사례는 남성 중심의 채용 이력 데이터가 알고리즘에 내재화된 결과였으며, 이는 기술적 중립성에 대한 신뢰가 근거 없는 환상일 수 있음을 보여주었다."
    },
    {
      id: "p2",
      text: "인공지능의 편향 문제는 단순히 데이터의 결함에서만 비롯되는 것이 아니라, 알고리즘의 설계 과정과 평가 기준의 선택에서도 발생할 수 있다. 어떤 변수를 예측에 포함시킬 것인지, 어떤 성과 지표를 최적화할 것인지에 대한 결정은 근본적으로 가치 판단을 수반하는 행위이며, 이러한 판단은 개발자의 세계관과 조직의 이해관계에 의해 영향을 받는다. 얼굴 인식 기술에서 백인 남성에 비해 유색 인종 여성의 오인식률이 현저히 높게 나타난 연구 결과는 학습 데이터의 인구통계학적 불균형뿐 아니라, 시스템의 정확도를 평가할 때 어떤 집단의 경험을 기준으로 삼았는지의 문제를 동시에 드러낸다. 이처럼 기술적 선택 속에 내재된 가치 편향은 알고리즘의 수학적 정밀성 뒤에 은폐되어 비가시적으로 작동한다는 점에서 특히 위험하다."
    },
    {
      id: "p3",
      text: "인공지능의 공정성을 확보하기 위한 기술적 접근으로는 편향 탐지와 완화를 위한 다양한 방법론이 제안되고 있다. 학습 데이터의 전처리 단계에서 보호 속성에 따른 불균형을 교정하는 기법, 알고리즘의 학습 과정에서 공정성 제약 조건을 부과하는 기법, 그리고 결과물에 대한 사후 보정을 통해 집단 간 격차를 줄이는 기법이 대표적이다. 그러나 공정성의 정의 자체가 다양한 수학적 형식화를 허용하며, 개인적 공정성과 집단적 공정성, 기회의 평등과 결과의 평등 같은 서로 다른 공정성 기준들이 상호 충돌할 수 있다는 이론적 한계가 존재한다. 이는 인공지능의 공정성 문제가 순수하게 기술적 수단만으로는 해결될 수 없으며, 사회적 합의와 윤리적 판단이 반드시 개입해야 함을 시사한다."
    },
    {
      id: "p4",
      text: "인공지능 윤리의 또 다른 핵심 쟁점은 자동화된 의사결정의 투명성과 설명 가능성의 문제이다. 심층 신경망과 같은 복잡한 모델은 높은 예측 정확도를 달성하지만, 특정 결정이 어떤 근거로 내려졌는지를 인간이 이해할 수 있는 형태로 설명하기 어렵다는 블랙박스 문제를 안고 있다. 유럽연합의 일반 데이터 보호 규정은 자동화된 의사결정의 대상이 되는 개인에게 해당 결정의 논리에 대한 설명을 요구할 수 있는 권리를 부여하였으며, 이는 설명 가능한 인공지능의 개발을 촉진하는 규범적 동력으로 작용하고 있다. 궁극적으로 인공지능 윤리는 기술의 발전 속도에 상응하는 제도적 장치와 사회적 감시 체계를 갖추는 것이 핵심이며, 기술 개발자, 정책 입안자, 시민 사회가 함께 참여하는 다층적 거버넌스 구조의 확립이 요구되고 있다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 53 지문 길이: ${len}자`);

  const specialQuestions = {
    "0_0": {
      prompt: "하이라이트된 문장에서 인공지능의 자동화된 의사결정이 야기하는 우려로 적절한 것은?",
      choices: [
        { id: "A", text: "시스템이 내포하는 편향과 불공정성에 대한 심각한 우려이다" },
        { id: "B", text: "인공지능이 인간의 일자리를 완전히 대체할 것이라는 우려이다" },
        { id: "C", text: "인공지능의 처리 속도가 인간보다 느리다는 기술적 한계이다" },
        { id: "D", text: "인공지능이 감정을 가지게 되어 통제 불가능해질 우려이다" }
      ],
      answerId: "A"
    },
    "0_2": {
      prompt: "하이라이트된 문장에서 아마존 채용 시스템 사례가 보여주는 교훈으로 적절한 것은?",
      choices: [
        { id: "A", text: "기술적 중립성에 대한 신뢰가 근거 없는 환상일 수 있음을 보여주었다" },
        { id: "B", text: "인공지능이 인간보다 공정한 채용 결정을 내린다는 것을 입증하였다" },
        { id: "C", text: "데이터의 양이 충분하면 편향이 자동으로 해소된다는 것을 확인하였다" },
        { id: "D", text: "인공지능 채용 시스템이 모든 산업에서 즉시 도입되어야 함을 보여주었다" }
      ],
      answerId: "A"
    },
    "1_0": {
      prompt: "하이라이트된 문장에서 편향의 발생 원인으로 데이터 외에 추가로 제시된 것은?",
      choices: [
        { id: "A", text: "알고리즘의 설계 과정과 평가 기준의 선택에서도 발생할 수 있다" },
        { id: "B", text: "컴퓨터의 연산 능력 부족에서 발생하는 기술적 한계이다" },
        { id: "C", text: "인공지능이 독자적으로 가치 판단을 내리는 능력에서 비롯된다" },
        { id: "D", text: "사용자의 오용에서만 비롯되며 기술 자체와는 무관하다" }
      ],
      answerId: "A"
    },
    "1_3": {
      prompt: "하이라이트된 문장에서 기술적 선택 속 가치 편향이 특히 위험한 이유로 적절한 것은?",
      choices: [
        { id: "A", text: "수학적 정밀성 뒤에 은폐되어 비가시적으로 작동하기 때문이다" },
        { id: "B", text: "쉽게 발견할 수 있어 빠르게 교정할 수 있기 때문이다" },
        { id: "C", text: "모든 사용자가 편향의 존재를 인지하고 있기 때문이다" },
        { id: "D", text: "법적 규제에 의해 완전히 통제되고 있기 때문이다" }
      ],
      answerId: "A"
    },
    "2_0": {
      prompt: "하이라이트된 문장에서 인공지능 공정성 확보를 위해 제안된 접근 방식은 무엇인가?",
      choices: [
        { id: "A", text: "편향 탐지와 완화를 위한 다양한 기술적 방법론이 제안되고 있다" },
        { id: "B", text: "인공지능의 사용을 전면 금지하는 법적 조치가 시행되고 있다" },
        { id: "C", text: "모든 인공지능 시스템을 인간이 수동으로 검토하는 방식이 채택되었다" },
        { id: "D", text: "인공지능 개발을 특정 기업에만 허용하는 독점 체제가 도입되었다" }
      ],
      answerId: "A"
    },
    "2_3": {
      prompt: "하이라이트된 문장에서 인공지능 공정성 문제 해결의 한계로 적절한 것은?",
      choices: [
        { id: "A", text: "순수하게 기술적 수단만으로는 해결될 수 없으며 사회적 합의가 필요하다" },
        { id: "B", text: "충분한 컴퓨팅 자원만 투입하면 모든 공정성 문제가 해결된다" },
        { id: "C", text: "공정성의 정의가 보편적이어서 기술적으로 쉽게 구현할 수 있다" },
        { id: "D", text: "현재의 기술 수준으로는 편향을 탐지하는 것 자체가 불가능하다" }
      ],
      answerId: "A"
    },
    "3_0": {
      prompt: "하이라이트된 문장에서 인공지능 윤리의 또 다른 핵심 쟁점으로 제시된 것은?",
      choices: [
        { id: "A", text: "자동화된 의사결정의 투명성과 설명 가능성의 문제이다" },
        { id: "B", text: "인공지능의 에너지 소비량이 환경에 미치는 영향이다" },
        { id: "C", text: "인공지능 개발 비용의 경제적 효율성 문제이다" },
        { id: "D", text: "인공지능의 창작물에 대한 저작권 귀속 문제이다" }
      ],
      answerId: "A"
    },
    "3_2": {
      prompt: "하이라이트된 문장에서 유럽연합의 규정이 부여한 권리로 적절한 것은?",
      choices: [
        { id: "A", text: "자동화된 의사결정의 논리에 대한 설명을 요구할 수 있는 권리이다" },
        { id: "B", text: "모든 인공지능 서비스를 무료로 이용할 수 있는 권리이다" },
        { id: "C", text: "인공지능 개발에 직접 참여할 수 있는 권리이다" },
        { id: "D", text: "인공지능 시스템을 자유롭게 복제할 수 있는 권리이다" }
      ],
      answerId: "A"
    }
  };

  const centralThemes = [
    "학습 데이터의 편견이 인공지능의 차별적 구조 재생산으로 이어지는 메커니즘",
    "알고리즘 설계와 평가 기준 선택에 내재된 가치 편향의 비가시성",
    "공정성 확보를 위한 기술적 접근과 공정성 정의의 다원적 충돌",
    "투명성과 설명 가능성 문제 및 다층적 거버넌스 구조의 필요성"
  ];
  const wrongThemes = [
    "블록체인 기술의 탈중앙화 원리와 암호화폐의 경제적 영향",
    "CRISPR 유전자 편집 기술의 의학적 활용과 생명윤리 쟁점",
    "우주 탐사에서 화성 거주 가능성의 과학적 평가와 기술적 과제"
  ];

  const timeline = buildDayTimeline(paragraphs, specialQuestions, centralThemes, wrongThemes);

  const fullText = paragraphs.map(p => p.text).join('\n');
  const cards = splitIntoCards(fullText, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "아마존의 인공지능 채용 시스템이 체계적으로 불이익하게 평가한 대상은 누구인가?",
      answerRanges: [findRange(paragraphs, "p1", "여성 지원자")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "얼굴 인식 기술에서 오인식률이 현저히 높게 나타난 집단은 누구인가?",
      answerRanges: [findRange(paragraphs, "p2", "유색 인종 여성")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "공정성의 서로 다른 기준들이 서로 충돌할 수 있다는 문제를 무엇이라 하였는가?",
      answerRanges: [findRange(paragraphs, "p3", "이론적 한계")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "심층 신경망 모델이 결정의 근거를 설명하기 어려운 문제를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "블랙박스 문제")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "자동화된 의사결정에 대한 설명을 요구할 권리를 부여한 유럽연합 규정의 이름은?",
      answerRanges: [findRange(paragraphs, "p4", "일반 데이터 보호 규정")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "인공지능 윤리를 위해 기술 개발자, 정책 입안자, 시민 사회가 함께 참여하는 구조를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "거버넌스 구조")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(53, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 54: 문학 (LITERATURE, 짝수) ── 주제: 황순원의 「소나기」 분석
function buildDay54() {
  const paragraphs = [
    {
      id: "p1",
      text: "황순원의 단편소설 「소나기」는 1953년에 발표된 작품으로, 도시에서 시골로 전학 온 소녀와 시골 소년 사이의 짧고 순수한 만남을 서정적으로 그려낸 한국 문학의 대표적인 성장 소설이다. 이 작품에서 소년과 소녀의 만남은 개울가라는 자연 공간에서 시작되며, 두 인물의 교감은 말보다는 시선, 행동, 자연물의 매개를 통해 비언어적으로 이루어진다. 황순원은 인물의 내면 심리를 직접 서술하지 않고 외부적 행위와 자연 풍경의 묘사를 통해 간접적으로 전달하는 절제된 서술 기법을 구사하며, 이러한 기법은 독자로 하여금 행간의 의미를 능동적으로 포착하도록 유도하는 독특한 미학적 효과를 창출한다. 대화와 설명이 최소화된 이 간결한 서술 방식은 작품 전체에 시적 함축성을 부여하며, 산문이면서 동시에 시에 가까운 문학적 질감을 만들어낸다."
    },
    {
      id: "p2",
      text: "작품의 서사적 전환점은 소년과 소녀가 함께 소나기를 만나는 장면에서 형성된다. 갑작스럽게 쏟아지는 소나기 속에서 두 인물이 수숫단 아래에 함께 몸을 피하는 장면은 자연의 힘 앞에서 인위적 거리가 무너지고 순간적인 친밀감이 형성되는 결정적 계기를 제공한다. 소나기는 예고 없이 찾아와 맹렬하게 쏟아지다가 짧은 시간 안에 그치는 자연 현상으로, 이는 두 인물의 만남 자체가 지닌 격렬하면서도 일시적인 성격을 상징적으로 반영한다. 비가 그친 뒤 하늘에 무지개가 뜨는 장면은 소나기 이후의 정화와 아름다움을 암시하면서, 두 인물의 만남이 비록 짧았으나 감정적으로 깊은 인상을 남기는 체험이었음을 시각적으로 형상화한다."
    },
    {
      id: "p3",
      text: "소녀의 죽음은 작품의 결말부에서 간접적으로 전달되며, 이 서술 전략은 소설 전체의 서정적 절제와 일관된 방식으로 비극적 사건을 처리한다. 소녀가 소년이 조약돌을 주워 준 것을 소중히 간직하고, 죽을 때 입고 묻어 달라고 당부한 옷이 소나기를 맞은 날의 옷이라는 사실은 직접적인 감정 표현 없이도 소녀의 내면에 소년과의 만남이 얼마나 깊은 의미를 지니고 있었는지를 강렬하게 환기시킨다. 이 결말은 독자에게 상실의 슬픔과 함께 순수한 감정의 영속성에 대한 깊은 여운을 남기며, 죽음이라는 비극적 사건조차 감정의 순수성을 훼손하지 못한다는 메시지를 전달하여 작품의 서정적 완결성을 높인다."
    },
    {
      id: "p4",
      text: "「소나기」가 발표 이후 수십 년에 걸쳐 한국인에게 가장 널리 읽히고 사랑받는 단편소설로 자리매김한 것은 이 작품이 특정 시대나 사회적 맥락에 구속되지 않는 보편적인 주제를 다루고 있기 때문이다. 성장기의 첫사랑과 상실이라는 경험은 문화와 세대를 초월하여 대부분의 독자가 공감할 수 있는 원형적 서사에 해당하며, 황순원의 절제된 문체는 이 보편적 감정을 과장이나 감상 없이 담아내어 독자 각자의 개인적 경험과 기억을 투사할 수 있는 열린 텍스트를 구성한다. 자연과 인간의 감정이 유기적으로 호응하는 이 작품의 서술 구조는 한국 단편소설의 서정적 전통을 대표하는 전범으로 평가되며, 소설이라는 장르가 시의 함축성과 결합할 때 도달할 수 있는 미학적 가능성을 탁월하게 보여주고 있다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 54 지문 길이: ${len}자`);

  const specialQuestions = {
    "0_0": {
      prompt: "하이라이트된 문장에서 「소나기」의 장르적 성격으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "순수한 만남을 서정적으로 그린 성장 소설이다" },
        { id: "B", text: "사회적 불평등을 고발하는 리얼리즘 소설이다" },
        { id: "C", text: "역사적 사건을 재구성한 역사 소설이다" },
        { id: "D", text: "초자연적 현상을 다루는 환상 소설이다" }
      ],
      answerId: "A"
    },
    "0_2": {
      prompt: "하이라이트된 문장에서 황순원의 서술 기법의 특징으로 적절한 것은?",
      choices: [
        { id: "A", text: "내면 심리를 직접 서술하지 않고 외부적 행위와 풍경으로 간접 전달한다" },
        { id: "B", text: "인물의 내면 독백을 통해 심리를 상세하게 서술한다" },
        { id: "C", text: "서술자가 전지적 시점에서 인물의 감정을 직접 해설한다" },
        { id: "D", text: "대화 위주의 서술로 인물 간의 갈등을 극대화한다" }
      ],
      answerId: "A"
    },
    "1_0": {
      prompt: "하이라이트된 문장에서 서사적 전환점이 형성되는 장면으로 적절한 것은?",
      choices: [
        { id: "A", text: "소년과 소녀가 함께 소나기를 만나는 장면이다" },
        { id: "B", text: "소년이 마을을 떠나 도시로 향하는 장면이다" },
        { id: "C", text: "소녀가 학교에서 상을 받는 장면이다" },
        { id: "D", text: "두 인물이 시장에서 우연히 재회하는 장면이다" }
      ],
      answerId: "A"
    },
    "1_2": {
      prompt: "하이라이트된 문장에서 소나기가 상징하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "두 인물의 만남이 지닌 격렬하면서도 일시적인 성격을 반영한다" },
        { id: "B", text: "소녀의 건강 악화를 예고하는 불길한 징조를 나타낸다" },
        { id: "C", text: "시골 생활의 고단함과 자연의 가혹함을 상징한다" },
        { id: "D", text: "사회적 변혁의 불가피성을 암시하는 정치적 은유이다" }
      ],
      answerId: "A"
    },
    "2_0": {
      prompt: "하이라이트된 문장에서 소녀의 죽음이 전달되는 방식으로 적절한 것은?",
      choices: [
        { id: "A", text: "작품 결말부에서 간접적으로 전달되며 서정적 절제와 일관되게 처리된다" },
        { id: "B", text: "작품 초반부에서 직접적으로 서술되어 비극적 분위기를 조성한다" },
        { id: "C", text: "서술자의 감정적 논평을 통해 상세히 묘사된다" },
        { id: "D", text: "소년의 장문의 독백을 통해 극적으로 표현된다" }
      ],
      answerId: "A"
    },
    "2_1": {
      prompt: "하이라이트된 문장에서 소녀가 죽을 때 입고 묻어 달라고 한 옷이 암시하는 바로 적절한 것은?",
      choices: [
        { id: "A", text: "소년과의 만남이 소녀의 내면에 깊은 의미를 지니고 있었음을 환기시킨다" },
        { id: "B", text: "소녀가 물질적 소유에 집착하는 성격임을 보여준다" },
        { id: "C", text: "당시 농촌 가정의 경제적 빈곤을 간접적으로 드러낸다" },
        { id: "D", text: "소녀의 부모가 소년과의 만남을 승인했음을 암시한다" }
      ],
      answerId: "A"
    },
    "3_0": {
      prompt: "하이라이트된 문장에서 「소나기」가 오랫동안 사랑받는 이유로 적절한 것은?",
      choices: [
        { id: "A", text: "특정 시대에 구속되지 않는 보편적인 주제를 다루고 있기 때문이다" },
        { id: "B", text: "역사적 사건을 정확하게 기록하고 있기 때문이다" },
        { id: "C", text: "복잡한 서사 구조로 독자의 지적 호기심을 자극하기 때문이다" },
        { id: "D", text: "당시 사회 문제에 대한 구체적 해결책을 제시하기 때문이다" }
      ],
      answerId: "A"
    },
    "3_2": {
      prompt: "하이라이트된 문장에서 이 작품의 서술 구조가 대표하는 전통으로 적절한 것은?",
      choices: [
        { id: "A", text: "한국 단편소설의 서정적 전통을 대표하는 전범으로 평가된다" },
        { id: "B", text: "한국 장편소설의 서사적 전통을 개척한 선구적 작품이다" },
        { id: "C", text: "서구 모더니즘을 그대로 이식한 실험적 작품으로 분류된다" },
        { id: "D", text: "한국 판소리 전통을 현대 소설로 변환한 작품이다" }
      ],
      answerId: "A"
    }
  };

  const centralThemes = [
    "절제된 서술 기법과 시적 함축성을 통한 소년·소녀 만남의 서정적 형상화",
    "소나기 장면에서 형성되는 서사적 전환과 자연 현상의 상징적 의미",
    "소녀의 죽음에 대한 간접적 서술과 순수한 감정의 영속성 전달",
    "보편적 주제와 절제된 문체를 통한 한국 서정소설의 전범적 성취"
  ];
  const wrongThemes = [
    "이청준 소설에 나타나는 서사적 자기 반영성과 메타 소설적 기법",
    "김유정 소설에 나타나는 농촌 공동체의 해학적 묘사",
    "최인훈의 「광장」에 드러나는 분단 현실과 이데올로기의 갈등"
  ];

  const timeline = buildDayTimeline(paragraphs, specialQuestions, centralThemes, wrongThemes);

  const fullText = paragraphs.map(p => p.text).join('\n');
  const cards = splitIntoCards(fullText, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "소년과 소녀의 만남이 시작되는 자연 공간은 어디인가?",
      answerRanges: [findRange(paragraphs, "p1", "개울가")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "두 인물이 소나기를 피해 함께 몸을 숨긴 장소는 어디인가?",
      answerRanges: [findRange(paragraphs, "p2", "수숫단")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "비가 그친 뒤 두 인물의 만남의 아름다움을 시각적으로 형상화하는 자연 현상은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "무지개")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "소녀가 소년에게서 받아 소중히 간직한 물건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "조약돌")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이 작품이 다루는 보편적 서사의 원형은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "첫사랑과 상실")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "황순원의 문체가 독자에게 허용하는 것으로 서술된 텍스트의 성격은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "열린 텍스트")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(54, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 55: 비문학 (NONFICTION, 홀수) ── 주제: 도시 열섬 현상과 녹색 인프라
function buildDay55() {
  const paragraphs = [
    {
      id: "p1",
      text: "도시 열섬 현상은 도시 지역의 기온이 주변 교외나 농촌보다 현저하게 높게 나타나는 미기후학적 현상으로, 급속한 도시화와 기후변화가 교차하는 현대 사회에서 주요한 환경 문제로 부각되고 있다. 이 현상의 핵심적 원인은 도시 지표면 성질의 변화에 있는데, 아스팔트와 콘크리트로 이루어진 불투수성 표면은 태양 복사에너지를 대량으로 흡수하고 야간에 서서히 방출하여 냉각을 지연시킨다. 건물과 도로가 밀집한 도시의 기하학적 구조는 일사를 반복적으로 반사시키면서 열을 가두는 도시 협곡 효과를 생성하고, 자동차 배기열과 냉난방 시스템 등에서 발생하는 인공 발열 역시 도시의 열 수지를 양의 방향으로 편향시킨다. 대도시에서 열섬 강도는 주변 지역 대비 섭씨 2도에서 최대 8도까지 차이를 보이며, 이는 폭염 시기에 시민의 건강에 치명적인 위협을 가한다."
    },
    {
      id: "p2",
      text: "도시 열섬은 단순한 기온 상승에 그치지 않고 다양한 연쇄적 영향을 초래한다. 열 스트레스의 증가는 온열 질환과 심혈관계 질환의 발생률을 높이며, 특히 노인, 만성 질환자 등 취약 계층에게 불균형적으로 큰 위험을 야기한다. 기온 상승은 냉방 에너지 수요를 급격히 증가시키는데, 이는 다시 화석 연료 기반 발전의 증가로 이어져 온실가스 배출을 가중시키는 악순환적 되먹임 구조를 형성한다. 대기 중 오존과 미세먼지의 농도는 기온 상승과 함께 높아지는 경향을 보이므로, 열섬 현상은 도시의 대기 질을 악화시키는 간접적 원인으로도 작용한다. 또한 불투수면 비율의 증가는 빗물의 지표 유출량을 증대시켜 도시 홍수의 위험을 높이며, 하천의 수온을 상승시켜 수생태계의 교란을 유발한다."
    },
    {
      id: "p3",
      text: "녹색 인프라는 도시 열섬 현상을 완화하기 위한 가장 효과적인 자연 기반 해법으로 주목받고 있다. 도시 숲과 가로수는 증산 작용을 통해 주변 공기의 온도를 낮추는 냉각 효과를 발휘하며, 동시에 그늘을 제공하여 지표면과 건물 외벽의 직접적인 태양 복사 흡수를 차단한다. 옥상 녹화와 벽면 녹화는 건물의 단열 성능을 향상시켜 냉방 에너지 소비를 절감하는 효과가 있으며, 투수성 포장재의 도입은 빗물의 자연적 침투를 촉진하여 증발 냉각에 기여하는 동시에 도시 홍수 위험을 감소시킨다. 싱가포르의 수퍼트리 그로브나 서울의 서울숲은 도심 내 대규모 녹지를 조성하여 열섬 효과를 효과적으로 완화하고 있는 대표적인 사례로, 이러한 프로젝트들은 환경적 기능과 도시 경관의 심미적 가치를 동시에 향상시킨다."
    },
    {
      id: "p4",
      text: "녹색 인프라의 효과를 극대화하기 위해서는 산발적인 녹지 조성이 아닌 도시 전체 차원의 체계적인 계획이 필수적이다. 열화상 위성 데이터와 미기후 시뮬레이션 기술의 발전은 도시 내 열취약지역을 정밀하게 식별하고, 녹색 인프라의 최적 배치를 과학적으로 설계할 수 있는 기반을 제공하고 있다. 그러나 녹색 인프라의 도입이 주변 부동산 가치를 상승시켜 기존 저소득 주민이 밀려나는 녹색 젠트리피케이션의 위험이 존재하며, 이는 환경적 혜택의 공정한 분배라는 환경 정의의 관점에서 중요한 과제를 제기한다. 따라서 녹색 인프라 정책은 생태적 효과와 사회적 형평성을 동시에 고려하는 통합적 접근이 요구되며, 기후 적응과 사회적 포용을 동시에 달성하는 지속 가능한 도시 설계를 지향해야 한다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 55 지문 길이: ${len}자`);

  const specialQuestions = {
    "0_0": {
      prompt: "하이라이트된 문장에서 도시 열섬 현상의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "도시 지역의 기온이 주변 교외보다 현저하게 높게 나타나는 미기후학적 현상이다" },
        { id: "B", text: "도시 지역의 습도가 농촌보다 낮아지는 대기 순환 현상이다" },
        { id: "C", text: "도시의 지하수 온도가 급격히 상승하는 지질학적 현상이다" },
        { id: "D", text: "도시 주변의 농경지 기온이 상승하여 작물에 피해를 주는 현상이다" }
      ],
      answerId: "A"
    },
    "0_1": {
      prompt: "하이라이트된 문장에서 도시 열섬의 핵심적 원인으로 제시된 것은?",
      choices: [
        { id: "A", text: "불투수성 표면이 태양 복사에너지를 흡수하고 야간에 방출하여 냉각을 지연시킨다" },
        { id: "B", text: "도시의 고층 건물이 바람을 차단하여 공기 순환이 감소한다" },
        { id: "C", text: "도시 주민의 체열이 대기 온도를 직접적으로 상승시킨다" },
        { id: "D", text: "도시의 지하 배관에서 발생하는 열이 지표면을 가열한다" }
      ],
      answerId: "A"
    },
    "1_0": {
      prompt: "하이라이트된 문장에서 도시 열섬의 영향으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "단순한 기온 상승에 그치지 않고 다양한 연쇄적 영향을 초래한다" },
        { id: "B", text: "기온 상승만이 유일한 영향이며 다른 환경 문제와 무관하다" },
        { id: "C", text: "도시의 강수량을 증가시켜 가뭄 문제를 해결하는 효과가 있다" },
        { id: "D", text: "대기 오염을 감소시키는 긍정적 효과를 함께 가져온다" }
      ],
      answerId: "A"
    },
    "1_2": {
      prompt: "하이라이트된 문장에서 냉방 에너지 수요 증가가 야기하는 문제 구조로 적절한 것은?",
      choices: [
        { id: "A", text: "화석 연료 발전 증가로 온실가스 배출을 가중시키는 악순환적 되먹임 구조이다" },
        { id: "B", text: "재생에너지 전환을 촉진하여 에너지 효율이 향상되는 선순환 구조이다" },
        { id: "C", text: "에너지 수요가 감소하여 발전소 가동률이 떨어지는 구조이다" },
        { id: "D", text: "냉방 기술의 발전으로 에너지 소비가 자동으로 감소하는 구조이다" }
      ],
      answerId: "A"
    },
    "2_0": {
      prompt: "하이라이트된 문장에서 녹색 인프라의 성격으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "도시 열섬 현상을 완화하기 위한 가장 효과적인 자연 기반 해법이다" },
        { id: "B", text: "인공적 냉방 시스템을 도시 전체에 확대 설치하는 기술적 방안이다" },
        { id: "C", text: "도시의 건물 높이를 제한하는 건축 규제 정책을 의미한다" },
        { id: "D", text: "도시 주민의 행동 양식을 변화시키기 위한 교육 프로그램이다" }
      ],
      answerId: "A"
    },
    "2_3": {
      prompt: "하이라이트된 문장에서 싱가포르와 서울의 사례가 보여주는 녹색 인프라의 효과로 적절한 것은?",
      choices: [
        { id: "A", text: "열섬 효과 완화와 도시 경관의 심미적 가치를 동시에 향상시킨다" },
        { id: "B", text: "열섬 효과를 완전히 제거하여 도시와 농촌의 기온 차이를 없앤다" },
        { id: "C", text: "경제적 비용만 증가시킬 뿐 환경적 효과는 미미하다" },
        { id: "D", text: "도시의 인구 밀도를 감소시켜 열섬 문제를 해결한다" }
      ],
      answerId: "A"
    },
    "3_0": {
      prompt: "하이라이트된 문장에서 녹색 인프라 효과 극대화의 조건으로 적절한 것은?",
      choices: [
        { id: "A", text: "산발적 녹지 조성이 아닌 도시 전체 차원의 체계적 계획이 필수적이다" },
        { id: "B", text: "개별 건물 소유자의 자발적 참여만으로 충분히 달성될 수 있다" },
        { id: "C", text: "특정 지역에 대규모 녹지만 집중 조성하면 효과가 극대화된다" },
        { id: "D", text: "기존의 녹지를 유지하는 것만으로도 충분한 효과를 얻을 수 있다" }
      ],
      answerId: "A"
    },
    "3_2": {
      prompt: "하이라이트된 문장에서 녹색 인프라 도입이 야기할 수 있는 사회적 문제로 적절한 것은?",
      choices: [
        { id: "A", text: "주변 부동산 가치 상승으로 저소득 주민이 밀려나는 녹색 젠트리피케이션이다" },
        { id: "B", text: "녹지 조성으로 도시의 세수 수입이 감소하는 재정 문제이다" },
        { id: "C", text: "도시 녹지가 범죄 발생 공간으로 전용되는 치안 문제이다" },
        { id: "D", text: "녹지 관리를 위한 용수 부족으로 식수 공급이 불안해지는 문제이다" }
      ],
      answerId: "A"
    }
  };

  const centralThemes = [
    "도시 열섬 현상의 정의, 핵심 원인 및 열섬 강도의 규모",
    "열섬 현상이 초래하는 건강·에너지·대기질·수생태계에 대한 연쇄적 영향",
    "녹색 인프라의 다양한 유형과 냉각 효과 및 구체적 적용 사례",
    "녹색 인프라의 체계적 계획과 녹색 젠트리피케이션에 대한 환경 정의 과제"
  ];
  const wrongThemes = [
    "해양 산성화가 산호초 생태계에 미치는 영향과 대응 전략",
    "핵융합 에너지의 원리와 상용화를 위한 기술적 과제",
    "우주 쓰레기의 증가와 우주 환경 보전을 위한 국제 협력"
  ];

  const timeline = buildDayTimeline(paragraphs, specialQuestions, centralThemes, wrongThemes);

  const fullText = paragraphs.map(p => p.text).join('\n');
  const cards = splitIntoCards(fullText, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "도시에서 건물과 도로가 열을 가두는 효과를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p1", "도시 협곡 효과")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "열섬 현상으로 특히 불균형적으로 큰 위험에 처하는 집단으로 언급된 대상은 누구인가?",
      answerRanges: [findRange(paragraphs, "p2", "취약 계층")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "도시 숲과 가로수가 주변 공기의 온도를 낮추는 생리적 과정은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "증산 작용")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "도심 내 대규모 녹지 사례로 언급된 싱가포르의 시설 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "수퍼트리 그로브")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "녹색 인프라 도입으로 저소득 주민이 밀려나는 현상을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "녹색 젠트리피케이션")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "환경적 혜택의 공정한 분배 문제를 다루는 관점을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "환경 정의")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(55, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
}

// ── 메인 실행 ──
function main() {
  console.log('=== 비트겐슈타인2 Day 51~55 콘텐츠 빌드 시작 ===\n');

  const items = [
    buildDay51(),
    buildDay52(),
    buildDay53(),
    buildDay54(),
    buildDay55()
  ];

  // 길이 검증
  let hasError = false;
  items.forEach((item) => {
    const paras = item.content.payload.passage.paragraphs;
    const len = paras.reduce((s, p) => s + p.text.length, 0);
    const cards = item.content.payload.recall.cards;
    const confirms = item.content.payload.confirm.questions;
    const steps = item.content.payload.intensive.timeline;
    console.log(`Day ${item.day_index}: 지문 ${len}자, 정독 ${steps.length}스텝, 복기 ${cards.length}장, 확인 ${confirms.length}문항`);

    if (len < 1450 || len > 1550) {
      console.error(`  [경고] Day ${item.day_index} 지문 길이 ${len}자 - 범위(1450~1550) 벗어남!`);
      hasError = true;
    }
    if (cards.length !== 8) {
      console.error(`  [경고] Day ${item.day_index} 복기 카드 ${cards.length}장 - 8장이어야 합니다!`);
      hasError = true;
    }
    if (confirms.length < 5 || confirms.length > 8) {
      console.error(`  [경고] Day ${item.day_index} 확인 문항 ${confirms.length}개 - 5~8개여야 합니다!`);
      hasError = true;
    }
  });

  // 배치 파일 읽기
  console.log('\n배치 파일 읽기...');
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`배치 파일 총 items: ${batchData.items.length}`);

  // items[50]~[54] 교체 (Day 51~55는 0-indexed 50~54)
  for (let i = 0; i < 5; i++) {
    const targetIdx = 50 + i;
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

  if (hasError) {
    console.log('\n[주의] 일부 경고가 있으나 파일은 생성되었습니다.');
  }
  console.log('\n=== 빌드 완료 ===');
}

main();
