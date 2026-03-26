/**
 * 러셀2(RUSSELL_2) Day 81~85 일일독해 콘텐츠 빌더
 * - Day 81: 비문학(NONFICTION), Day 82: 문학(LITERATURE)
 * - Day 83: 비문학(NONFICTION), Day 84: 문학(LITERATURE)
 * - Day 85: 비문학(NONFICTION)
 * - 목표 길이: 1200자 ±50 (1150~1250)
 * - schoolGradeRange: { min: 8, max: 9 }
 * - timeLimitSec: 480
 * - 복기 카드: 정확히 8장
 * - 확인 문항: 5~8문항, 질문형, answerMatchMode: "ANY", revealOnWrong: true
 */

const fs = require('fs');
const path = require('path');

// ─── 유틸리티 함수 ───

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
  if (!para) throw new Error(`단락 ${pid}를 찾을 수 없음`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText.substring(0, 30)}..." not found in ${pid}`);
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
  return text.substring(0, maxLen - 3) + '...';
}

function shuffleChoices(choices, answerId, seed) {
  const rng = hashIdx(seed + answerId);
  const arr = [...choices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (rng + i * 7) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── 콘텐츠 골격 생성 ───

function assembleFull(dayIndex, subArea, contentId, title) {
  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "RUSSELL_2",
    schoolGradeRange: { min: 8, max: 9 },
    area: "READING",
    subArea,
    competencies: ["READING"],
    tags: ["daily"],
    access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480,
    assets: {},
    payload: null
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return {
    content_type: "DAILY_READING",
    level_id: "RUSSELL_2",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content
  };
}

// 정독 스코어링
const intensiveScoring = { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true };
// 확인 스코어링
const confirmScoring = { correctDeltaSec: 30, wrongDeltaSec: -45 };

// 정독 타임라인 빌더
function buildTimeline(paragraphs, steps) {
  const timeline = [];
  let stepNum = 1;
  for (const step of steps) {
    const ranges = step.ranges.map(r => {
      if (r.full) {
        const para = paragraphs.find(p => p.id === r.pid);
        return { paragraphId: r.pid, start: 0, end: para.text.length };
      }
      return findRange(paragraphs, r.pid, r.text);
    });
    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges },
      question: {
        prompt: step.prompt,
        choices: step.choices,
        answerId: step.answerId,
        scoring: intensiveScoring
      }
    });
  }
  return timeline;
}

// 복기 카드 8장 생성
function buildRecallCards(paragraphs) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({
      id: `c${i + 1}`,
      text: fullText.substring(start, end)
    });
  }
  return {
    cards,
    correctOrder: cards.map(c => c.id),
    seedPenalty: 1
  };
}


// ════════════════════════════════════════════════════════════════
// Day 81 — 비문학(NONFICTION): 인공 위성과 우주 쓰레기
// ════════════════════════════════════════════════════════════════

function buildDay81() {
  const paragraphs = [
    {
      id: "p1",
      text: "인류가 처음 인공위성을 지구 궤도에 올린 것은 1957년이었다. 소련이 발사한 스푸트니크 1호는 무게 약 83킬로그램의 금속 구체로, 지구를 돌며 단순한 전파 신호를 송신하였다. 이 사건은 냉전 시대 우주 경쟁의 서막을 열었고, 미국은 이에 자극받아 이듬해 익스플로러 1호를 발사하였다. 그로부터 반세기가 넘는 시간 동안 각국은 경쟁적으로 위성을 쏘아 올렸고, 현재 지구 궤도에는 약 7천 기 이상의 활성 위성이 운용되고 있다. 통신, 기상 관측, 항법, 군사 정찰, 과학 연구 등 위성의 용도는 매우 다양하며, 현대 문명은 위성 없이는 유지되기 어려운 구조로 발전하였다."
    },
    {
      id: "p2",
      text: "그러나 인공위성의 증가는 우주 쓰레기라는 심각한 문제를 함께 낳았다. 우주 쓰레기란 수명을 다한 위성, 로켓 잔해, 충돌 파편, 우주인이 분실한 도구 등 더 이상 기능하지 않는 인공 물체를 통틀어 이르는 말이다. 현재 지구 궤도에는 약 3만 4천 개 이상의 10센티미터 이상 크기 파편이 추적되고 있으며, 1센티미터 이상인 것까지 포함하면 그 수는 100만 개를 넘는 것으로 추정된다. 이 파편들은 초속 7~8킬로미터의 속도로 궤도를 돌고 있어, 직경 1센티미터의 조각도 위성이나 우주 정거장에 치명적인 손상을 입힐 수 있다."
    },
    {
      id: "p3",
      text: "특히 우려되는 것은 케슬러 증후군이라 불리는 연쇄 충돌 시나리오이다. 궤도 위 파편이 일정 밀도를 초과하면, 충돌로 생긴 새로운 파편이 또 다른 충돌을 유발하는 연쇄 반응이 일어나 궤도 전체가 사용 불가능해질 수 있다. 이 현상이 현실화되면 인류는 통신, 날씨 예보, GPS 항법 등 위성에 의존하는 거의 모든 서비스를 잃게 된다. 2009년 미국의 이리듐 33호와 러시아의 코스모스 2251호가 시속 4만 킬로미터로 충돌하여 수천 개의 새 파편을 만들어 낸 사건은, 이 시나리오가 단순한 이론이 아님을 보여 주었다."
    },
    {
      id: "p4",
      text: "국제 사회는 이 문제를 해결하기 위해 다양한 방안을 모색하고 있다. 유럽 우주국은 로봇 팔로 대형 잔해를 포획하여 대기권에 재진입시키는 임무를 계획하고 있으며, 일본의 한 벤처 기업은 자석을 이용하여 금속 파편을 수거하는 기술을 개발 중이다. 또한 새로 발사하는 위성에는 수명이 다한 뒤 스스로 궤도를 낮추어 소멸하는 장치를 의무화하는 국제 지침이 마련되고 있다. 그러나 이미 궤도에 축적된 잔해의 양이 방대하기 때문에, 우주 쓰레기 문제의 해결에는 기술 개발과 함께 국가 간 협력이 필수적이다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 81 지문 길이: ${totalLen}자`);

  const content = assembleFull(81, "NONFICTION", "dr-r2-081", "일일 독해(러셀 2) Day 81 비문학");

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "소련이 발사한 스푸트니크 1호는 무게 약 83킬로그램의 금속 구체로, 지구를 돌며 단순한 전파 신호를 송신하였다." }],
      prompt: "최초의 인공위성인 스푸트니크 1호에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "약 83킬로그램의 금속 구체로 전파 신호를 송신하였다." },
        { id: "B", text: "미국이 개발한 최첨단 통신 위성이었다." },
        { id: "C", text: "GPS 항법 기능을 탑재한 첫 번째 위성이었다." },
        { id: "D", text: "유인 우주 비행을 목적으로 발사된 캡슐이었다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "현대 문명은 위성 없이는 유지되기 어려운 구조로 발전하였다." }],
      prompt: "이 문장이 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "위성이 현대 사회의 필수 인프라로 자리 잡았다는 의미이다." },
        { id: "B", text: "위성 없이도 현대 문명이 충분히 유지될 수 있다는 뜻이다." },
        { id: "C", text: "위성 기술이 더 이상 발전할 여지가 없다는 뜻이다." },
        { id: "D", text: "위성 대신 지상 시설로 모든 기능을 대체할 수 있다는 주장이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "인공위성의 역사와 현대 문명에서의 필수적 역할을 소개한다." },
        { id: "B", text: "우주 쓰레기의 정의와 위험성을 상세히 설명한다." },
        { id: "C", text: "인공위성 발사 비용의 경제적 부담을 분석한다." },
        { id: "D", text: "우주 탐사를 위한 국제 협력의 필요성을 주장한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "우주 쓰레기란 수명을 다한 위성, 로켓 잔해, 충돌 파편, 우주인이 분실한 도구 등 더 이상 기능하지 않는 인공 물체를 통틀어 이르는 말이다." }],
      prompt: "우주 쓰레기의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "수명이 다하거나 기능을 잃은 인공 물체를 모두 포함하는 개념이다." },
        { id: "B", text: "우주에서 자연적으로 발생하는 운석이나 소행성 조각이다." },
        { id: "C", text: "재활용이 가능한 위성 부품만을 가리키는 용어이다." },
        { id: "D", text: "우주 정거장에서 의도적으로 버리는 생활 폐기물이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "이 파편들은 초속 7~8킬로미터의 속도로 궤도를 돌고 있어, 직경 1센티미터의 조각도 위성이나 우주 정거장에 치명적인 손상을 입힐 수 있다." }],
      prompt: "작은 우주 파편도 위험한 이유로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "초속 7~8킬로미터의 극도로 빠른 속도로 이동하기 때문이다." },
        { id: "B", text: "파편이 독성 화학 물질을 방출하기 때문이다." },
        { id: "C", text: "파편이 전자기파를 교란하여 통신을 마비시키기 때문이다." },
        { id: "D", text: "지구로 떨어져 지상의 건물을 파괴할 수 있기 때문이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "우주 쓰레기의 정의, 규모, 위험성을 구체적으로 설명한다." },
        { id: "B", text: "인공위성 발사의 역사적 과정을 시간순으로 정리한다." },
        { id: "C", text: "우주 쓰레기 해결을 위한 국제적 대응 방안을 소개한다." },
        { id: "D", text: "케슬러 증후군의 연쇄 반응 원리를 과학적으로 분석한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "궤도 위 파편이 일정 밀도를 초과하면, 충돌로 생긴 새로운 파편이 또 다른 충돌을 유발하는 연쇄 반응이 일어나 궤도 전체가 사용 불가능해질 수 있다." }],
      prompt: "케슬러 증후군이 위험한 이유로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "연쇄 충돌로 궤도 전체가 사용 불가능해질 수 있기 때문이다." },
        { id: "B", text: "파편이 대기권에 진입하면 지구 온난화를 가속하기 때문이다." },
        { id: "C", text: "하나의 파편이 지구 전체를 감싸는 먼지층을 형성하기 때문이다." },
        { id: "D", text: "우주 정거장의 승무원이 즉시 대피해야 하는 상황이 생기기 때문이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "케슬러 증후군의 원리와 실제 충돌 사례를 통해 그 위험성을 경고한다." },
        { id: "B", text: "우주 쓰레기의 종류와 크기를 분류하여 설명하고 있다." },
        { id: "C", text: "인공위성 기술의 발전 과정을 시간순으로 서술하고 있다." },
        { id: "D", text: "우주 쓰레기 수거 기술의 성공 사례를 소개하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "유럽 우주국은 로봇 팔로 대형 잔해를 포획하여 대기권에 재진입시키는 임무를 계획하고 있으며, 일본의 한 벤처 기업은 자석을 이용하여 금속 파편을 수거하는 기술을 개발 중이다." }],
      prompt: "우주 쓰레기 해결을 위해 시도되고 있는 기술로 적절한 것은?",
      choices: [
        { id: "A", text: "로봇 팔로 잔해를 포획하거나 자석으로 금속 파편을 수거하는 기술이다." },
        { id: "B", text: "레이저로 모든 파편을 즉시 증발시키는 기술이다." },
        { id: "C", text: "거대한 그물을 우주에 펼쳐 파편을 한꺼번에 쓸어 담는 기술이다." },
        { id: "D", text: "파편을 달 표면에 안전하게 착륙시키는 기술이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "우주 쓰레기 문제의 해결에는 기술 개발과 함께 국가 간 협력이 필수적이다." }],
      prompt: "필자가 강조하는 우주 쓰레기 문제 해결의 핵심 조건으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "기술 개발과 국가 간 협력이 함께 이루어져야 한다." },
        { id: "B", text: "한 국가가 단독으로 모든 파편을 수거해야 한다." },
        { id: "C", text: "위성 발사를 전면 중단하는 것만이 유일한 방법이다." },
        { id: "D", text: "민간 기업에 전적으로 맡기는 것이 가장 효율적이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "우주 쓰레기 해결을 위한 기술적 시도와 국제 협력의 필요성을 제시한다." },
        { id: "B", text: "인공위성의 다양한 용도와 현대 사회에서의 중요성을 설명한다." },
        { id: "C", text: "케슬러 증후군의 연쇄 반응 원리를 과학적으로 증명한다." },
        { id: "D", text: "우주 쓰레기의 정의와 발생 원인을 체계적으로 분류한다." }
      ],
      answerId: "A"
    }
  ]);

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "인류 최초의 인공위성 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "스푸트니크 1호")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "현재 지구 궤도에서 운용되는 활성 위성의 수는 약 몇 기인가?",
      answerRanges: [findRange(paragraphs, "p1", "7천 기")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "우주 파편이 궤도를 도는 속도는 초속 얼마인가?",
      answerRanges: [findRange(paragraphs, "p2", "초속 7~8킬로미터")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "연쇄 충돌 시나리오를 무엇이라 부르는가?",
      answerRanges: [findRange(paragraphs, "p3", "케슬러 증후군")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "2009년 충돌 사건의 두 위성 중 미국 측 위성의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "이리듐 33호")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "일본 벤처 기업이 파편 수거에 이용하려는 수단은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "자석")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "새 위성에 의무화하려는 장치는 어떤 기능을 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "수명이 다한 뒤 스스로 궤도를 낮추어 소멸하는")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: buildRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
}


// ════════════════════════════════════════════════════════════════
// Day 82 — 문학(LITERATURE): 현대 소설 — 빈 의자
// ════════════════════════════════════════════════════════════════

function buildDay82() {
  const paragraphs = [
    {
      id: "p1",
      text: "식탁에는 늘 네 개의 의자가 놓여 있었다. 아버지, 어머니, 나, 그리고 형. 아침마다 네 사람이 마주 앉아 밥을 먹는 것이 우리 집의 가장 평범한 풍경이었다. 형은 항상 밥을 빨리 먹고 먼저 일어났고, 나는 느릿느릿 숟가락을 놀려 어머니에게 잔소리를 들었다. 아버지는 신문을 읽으며 말없이 국을 마셨고, 어머니는 반찬이 부족하면 자기 접시에서 덜어 주었다. 식탁 위에는 항상 김치찌개나 된장찌개가 올라왔고, 계절마다 달라지는 나물 반찬이 작은 접시에 가지런히 놓였다. 이 작고 반복적인 장면들이 쌓여 나의 일상이 되었고, 그것이 영원히 계속될 것이라고 나는 의심 없이 믿었다."
    },
    {
      id: "p2",
      text: "형이 대학에 가면서 의자 하나가 비었다. 처음에는 빈 의자가 어색했지만 곧 익숙해졌다. 방학이면 형이 돌아와 다시 네 자리가 채워졌고, 그때마다 식탁은 예전의 소란스러움을 되찾았다. 그러나 졸업 후 형이 먼 도시에 취직하면서 빈 의자는 더 오래 남게 되었다. 명절에 형이 올 때면 어머니는 전날부터 반찬을 준비했고, 아버지는 평소보다 일찍 면도를 하였다. 그 모습을 보며 나는, 사람이 없는 자리가 오히려 그 사람의 무게를 드러낸다는 것을 느꼈다."
    },
    {
      id: "p3",
      text: "시간이 흘러 나도 집을 떠났다. 부모님만 남은 식탁에는 두 개의 빈 의자가 놓여 있었을 것이다. 나는 가끔 전화를 걸어 안부를 물었지만, 식사 시간에 맞추어 전화하는 법은 없었다. 바쁜 일상 속에서 부모님의 끼니는 내 관심 밖의 일이 되어 있었다. 어느 날 어머니가 말했다. 요즘은 밥을 차려도 금방 먹어 버린다고, 밥상이 너무 조용하다고. 그 목소리에는 원망이 아니라 담담한 그리움이 묻어 있었다. 나는 수화기를 내려놓고 한참 동안 식탁을 떠올렸다. 네 사람이 마주 앉아 밥을 먹던 그 시절, 소란스럽고 평범했던 아침이 왜 그토록 소중하게 느껴지는지 알 수 없었다."
    },
    {
      id: "p4",
      text: "추석 연휴에 형과 함께 집에 갔다. 현관문을 열자 된장찌개 냄새가 났다. 식탁에는 네 개의 의자가 그대로 있었고, 반찬이 가득 차려져 있었다. 어머니는 태연한 척했지만 눈가가 붉어져 있었고, 아버지는 여전히 말없이 국을 마시다가 작게 헛기침을 하였다. 형과 나는 일부러 밥을 천천히 먹었다. 형은 반찬 하나하나에 감탄하며 어머니에게 맛있다고 말했고, 나는 국물을 한 숟갈 더 떠먹었다. 식사가 끝나도 아무도 먼저 일어나지 않았다. 한참 후 아버지가 나직이 말했다. 다들 있으니까, 밥맛이 난다. 그 한마디에 우리는 웃었고, 나는 빈 의자가 채워진 식탁이 세상에서 가장 따뜻한 풍경이라는 것을 깨달았다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 82 지문 길이: ${totalLen}자`);

  const content = assembleFull(82, "LITERATURE", "dr-r2-082", "일일 독해(러셀 2) Day 82 문학");

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "이 작고 반복적인 장면들이 쌓여 나의 일상이 되었고, 그것이 영원히 계속될 것이라고 나는 의심 없이 믿었다." }],
      prompt: "이 문장에서 드러나는 화자의 심리로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "가족과의 평범한 일상이 변하지 않을 것이라는 무의식적 믿음이다." },
        { id: "B", text: "지루한 일상에서 벗어나고 싶다는 강한 열망이다." },
        { id: "C", text: "가족과의 갈등으로 인해 집을 떠나고 싶어하는 마음이다." },
        { id: "D", text: "가족의 건강을 걱정하는 불안한 심리이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "네 식구가 함께하던 식탁의 평범한 일상과 화자의 당연한 믿음을 그린다." },
        { id: "B", text: "가족 간의 심각한 갈등과 불화가 점차 심화되는 과정을 보여 준다." },
        { id: "C", text: "어머니의 요리 실력이 뛰어나 가족 모두가 감탄하는 장면이다." },
        { id: "D", text: "형이 집을 떠나 가족이 슬퍼하는 장면을 묘사하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "사람이 없는 자리가 오히려 그 사람의 무게를 드러낸다는 것을 느꼈다." }],
      prompt: "이 문장이 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "부재가 오히려 그 사람의 존재감과 소중함을 더 크게 느끼게 한다." },
        { id: "B", text: "사람이 없으면 의자가 가벼워져 실제 무게가 줄어든다는 뜻이다." },
        { id: "C", text: "형이 떠난 뒤 남은 가족의 식비 부담이 줄었다는 의미이다." },
        { id: "D", text: "빈 의자에 다른 사람을 초대해야 한다는 뜻이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "형의 부재로 빈 의자가 생기면서 화자가 존재의 소중함을 깨닫기 시작한다." },
        { id: "B", text: "형이 대학에서 좋은 성적을 거두어 가족이 자랑스러워하는 내용이다." },
        { id: "C", text: "부모님이 형의 방을 다른 용도로 바꾸는 과정을 서술한다." },
        { id: "D", text: "명절에 가족이 다투어 분위기가 어색해지는 장면이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "그 목소리에는 원망이 아니라 담담한 그리움이 묻어 있었다." }],
      prompt: "어머니의 목소리에서 느껴지는 감정으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "자식들에 대한 원망 없는 조용한 그리움이다." },
        { id: "B", text: "자식들이 전화를 하지 않는 것에 대한 분노이다." },
        { id: "C", text: "빈 식탁에 적응하여 편안해진 마음이다." },
        { id: "D", text: "혼자 밥을 먹는 것이 더 편하다는 만족감이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "네 사람이 마주 앉아 밥을 먹던 그 시절, 소란스럽고 평범했던 아침이 왜 그토록 소중하게 느껴지는지 알 수 없었다." }],
      prompt: "화자가 과거의 아침을 소중하게 느끼는 이유로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "함께였기에 당연하게 여겼던 시간이 떨어져 보니 귀중함을 깨달았기 때문이다." },
        { id: "B", text: "어머니의 요리 솜씨가 점점 나빠져 예전 음식이 그립기 때문이다." },
        { id: "C", text: "형과 밥을 빨리 먹는 내기를 하던 재미가 그립기 때문이다." },
        { id: "D", text: "아버지가 신문의 재미있는 기사를 읽어 주던 것이 그립기 때문이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "화자도 집을 떠난 후 어머니의 그리움을 느끼며 가족의 소중함을 회상한다." },
        { id: "B", text: "화자가 독립한 뒤 자유로운 생활에 만족하는 모습을 그린다." },
        { id: "C", text: "부모님이 식탁을 정리하고 작은 밥상으로 교체하는 장면이다." },
        { id: "D", text: "형과 화자가 전화로 부모님의 건강 문제를 논의하는 내용이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "다들 있으니까, 밥맛이 난다." }],
      prompt: "아버지의 이 말이 지닌 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "가족이 함께하는 것 자체가 식사를 풍요롭게 만든다는 뜻이다." },
        { id: "B", text: "어머니의 요리 실력이 예전보다 나아졌다는 칭찬이다." },
        { id: "C", text: "날씨가 좋아져 입맛이 돌아왔다는 계절적 감상이다." },
        { id: "D", text: "오랜만에 먹는 집밥의 영양가가 높다는 건강적 평가이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "빈 의자가 채워진 식탁이 세상에서 가장 따뜻한 풍경이라는 것을 깨달았다." }],
      prompt: "화자가 최종적으로 깨달은 것으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "가족이 함께 모여 앉은 식탁이 가장 소중한 풍경이라는 것이다." },
        { id: "B", text: "의자를 새것으로 교체해야 식탁이 아름다워진다는 것이다." },
        { id: "C", text: "명절 음식이 평소보다 맛있다는 사실이다." },
        { id: "D", text: "가족이 함께 살면 불편한 점이 더 많다는 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "추석에 가족이 다시 모여 빈 의자가 채워지며 화자가 가족의 소중함을 깨닫는다." },
        { id: "B", text: "형이 취직 후 독립하여 가족과 영원히 이별하는 장면이다." },
        { id: "C", text: "아버지가 식탁 의자를 새로 구입하여 가족에게 선물하는 내용이다." },
        { id: "D", text: "어머니가 명절 준비를 거부하며 가족에게 서운함을 표현한다." }
      ],
      answerId: "A"
    }
  ]);

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "식탁에 놓인 의자는 모두 몇 개인가?",
      answerRanges: [findRange(paragraphs, "p1", "네 개")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "아버지가 식사 중에 하는 행동은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "신문을 읽으며 말없이 국을 마셨고")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "형이 처음으로 집을 떠난 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "대학에 가면서")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "형이 명절에 올 때 아버지가 평소와 달리 한 행동은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "일찍 면도를 하였다")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "어머니가 전화에서 한 말의 요지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "밥상이 너무 조용하다고")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "추석에 현관문을 열자 화자가 맡은 냄새는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "된장찌개 냄새")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "아버지가 식사 중에 나직이 한 말은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "다들 있으니까, 밥맛이 난다")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: buildRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
}


// ════════════════════════════════════════════════════════════════
// Day 83 — 비문학(NONFICTION): 수면과 학습의 관계
// ════════════════════════════════════════════════════════════════

function buildDay83() {
  const paragraphs = [
    {
      id: "p1",
      text: "인간은 하루 평균 7~8시간을 잠으로 보낸다. 이는 일생의 약 3분의 1에 해당하는 시간이다. 수면이 이렇게 많은 시간을 차지하는 데에는 분명한 이유가 있다. 수면 중에 뇌는 낮 동안 받아들인 정보를 정리하고 저장하는 작업을 수행한다. 불필요한 신경 연결은 약화시키고, 중요한 연결은 강화하는 시냅스 재편성이 이루어진다. 특히 깊은 잠에 해당하는 서파 수면 단계에서는 해마에 임시로 저장된 기억이 대뇌 피질로 옮겨져 장기 기억으로 전환되는데, 이 과정을 기억 공고화라고 한다. 잠을 자지 않으면 이 과정이 제대로 이루어지지 않아 학습 내용이 쉽게 잊혀진다."
    },
    {
      id: "p2",
      text: "수면의 효과는 기억 저장에 그치지 않는다. 수면 중에는 뇌의 노폐물 제거 시스템인 글림프 시스템이 활발하게 작동한다. 깨어 있는 동안 뇌세포가 활동하면서 생기는 대사 부산물, 특히 알츠하이머병과 관련된 베타 아밀로이드 단백질이 뇌 속에 축적되는데, 수면 중에 뇌척수액이 뇌 조직 사이를 흘러 이 물질을 씻어 낸다. 이 과정은 깊은 수면 상태에서 가장 효율적으로 이루어지며, 얕은 잠만으로는 충분한 효과를 기대하기 어렵다. 만성적인 수면 부족은 이러한 노폐물 제거를 방해하여 장기적으로 인지 기능 저하와 신경 퇴행성 질환의 위험을 높일 수 있다."
    },
    {
      id: "p3",
      text: "청소년기의 수면은 성인과 비교하여 몇 가지 특수한 양상을 보인다. 사춘기에 접어들면 생체 시계를 조절하는 호르몬인 멜라토닌의 분비 시점이 1~2시간 늦어지면서 자연스럽게 늦게 자고 늦게 일어나는 경향이 나타난다. 이는 게으름이 아니라 생물학적 변화에 의한 현상이다. 그러나 대부분의 학교는 이른 등교 시간을 유지하고 있어 청소년들은 만성적 수면 부족에 시달리기 쉽다. 연구에 따르면 수면이 부족한 학생은 집중력, 판단력, 감정 조절 능력이 떨어지며 학업 성취도에서도 유의미한 차이를 보인다."
    },
    {
      id: "p4",
      text: "이러한 과학적 근거를 바탕으로 일부 국가에서는 등교 시간을 늦추는 정책을 시행하고 있다. 미국 캘리포니아주는 2022년부터 중학교와 고등학교의 수업 시작 시각을 각각 오전 8시와 8시 30분 이후로 의무화하였다. 이 정책을 적용한 학교에서는 학생들의 평균 수면 시간이 약 30분 증가하였으며, 지각률 감소와 학업 성적 향상이 동시에 관찰되었다. 일부 학교에서는 학생들의 우울감 지수가 낮아지고 체육 활동 참여율이 높아지는 부수적 효과도 보고되었다. 수면은 단순한 휴식이 아니라 학습과 건강의 기반이며, 충분한 수면을 보장하는 환경 조성이 교육 정책의 중요한 과제가 되고 있다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 83 지문 길이: ${totalLen}자`);

  const content = assembleFull(83, "NONFICTION", "dr-r2-083", "일일 독해(러셀 2) Day 83 비문학");

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "특히 깊은 잠에 해당하는 서파 수면 단계에서는 해마에 임시로 저장된 기억이 대뇌 피질로 옮겨져 장기 기억으로 전환되는데, 이 과정을 기억 공고화라고 한다." }],
      prompt: "'기억 공고화'의 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "해마의 임시 기억이 대뇌 피질의 장기 기억으로 전환되는 과정이다." },
        { id: "B", text: "잠을 자지 않고 밤새 공부하여 기억력을 높이는 방법이다." },
        { id: "C", text: "기억을 의도적으로 삭제하여 뇌 용량을 확보하는 과정이다." },
        { id: "D", text: "낮 동안 반복 학습을 통해 단기 기억을 강화하는 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "잠을 자지 않으면 이 과정이 제대로 이루어지지 않아 학습 내용이 쉽게 잊혀진다." }],
      prompt: "이 문장이 시사하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "충분한 수면이 학습 내용을 기억하는 데 필수적이라는 것이다." },
        { id: "B", text: "잠을 적게 자면 학습 능률이 오히려 올라간다는 것이다." },
        { id: "C", text: "기억은 수면과 무관하게 시간이 지나면 자연히 강화된다는 것이다." },
        { id: "D", text: "수면 중에는 뇌 활동이 완전히 멈추므로 기억이 사라진다는 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "수면 중 이루어지는 기억 공고화 과정과 학습에서의 수면의 중요성을 설명한다." },
        { id: "B", text: "다양한 수면 장애의 종류와 치료법을 소개하고 있다." },
        { id: "C", text: "뇌의 구조를 해부학적으로 분석하고 있다." },
        { id: "D", text: "수면 시간이 짧을수록 학업 성취가 높다는 연구 결과를 제시한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "수면 중에는 뇌의 노폐물 제거 시스템인 글림프 시스템이 활발하게 작동한다." }],
      prompt: "글림프 시스템의 역할로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "수면 중에 뇌에 축적된 노폐물을 제거하는 시스템이다." },
        { id: "B", text: "깨어 있는 동안 뇌에 영양소를 공급하는 시스템이다." },
        { id: "C", text: "꿈을 만들어 내는 뇌의 창의적 활동 시스템이다." },
        { id: "D", text: "잠에서 깨어날 수 있도록 돕는 각성 시스템이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "만성적인 수면 부족은 이러한 노폐물 제거를 방해하여 장기적으로 인지 기능 저하와 신경 퇴행성 질환의 위험을 높일 수 있다." }],
      prompt: "만성적 수면 부족이 가져올 수 있는 위험으로 적절한 것은?",
      choices: [
        { id: "A", text: "인지 기능 저하와 신경 퇴행성 질환의 위험이 증가한다." },
        { id: "B", text: "뇌의 크기가 물리적으로 줄어들어 두개골이 변형된다." },
        { id: "C", text: "수면 시간이 자연스럽게 늘어나 과수면이 된다." },
        { id: "D", text: "뇌에서 새로운 노폐물 제거 경로가 만들어진다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "수면 중 글림프 시스템의 노폐물 제거 기능과 수면 부족의 장기적 위험을 설명한다." },
        { id: "B", text: "알츠하이머병의 치료법을 상세히 소개하고 있다." },
        { id: "C", text: "수면 중 뇌가 새로운 지식을 독자적으로 생성하는 과정을 서술한다." },
        { id: "D", text: "뇌척수액의 화학적 성분과 생산 과정을 과학적으로 분석한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "사춘기에 접어들면 생체 시계를 조절하는 호르몬인 멜라토닌의 분비 시점이 1~2시간 늦어지면서 자연스럽게 늦게 자고 늦게 일어나는 경향이 나타난다." }],
      prompt: "청소년이 늦게 자고 늦게 일어나는 원인으로 적절한 것은?",
      choices: [
        { id: "A", text: "멜라토닌 분비 시점이 1~2시간 늦어지는 생물학적 변화 때문이다." },
        { id: "B", text: "스마트폰 사용 시간이 늘어나 게으름이 심해지기 때문이다." },
        { id: "C", text: "학교 과제가 많아 밤늦게까지 공부해야 하기 때문이다." },
        { id: "D", text: "성장 호르몬이 아침에만 분비되어 잠을 더 자려 하기 때문이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "청소년 수면의 생물학적 특성과 이른 등교로 인한 만성 수면 부족 문제를 다룬다." },
        { id: "B", text: "청소년의 게으름을 교정하기 위한 교육적 방법을 제안한다." },
        { id: "C", text: "성인과 청소년의 학업 성취도를 비교 분석하고 있다." },
        { id: "D", text: "수면 부족이 신체적 성장에 미치는 영향을 통계로 제시한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "이 정책을 적용한 학교에서는 학생들의 평균 수면 시간이 약 30분 증가하였으며, 지각률 감소와 학업 성적 향상이 동시에 관찰되었다." }],
      prompt: "등교 시간을 늦춘 정책의 효과로 적절한 것은?",
      choices: [
        { id: "A", text: "평균 수면 약 30분 증가, 지각률 감소, 학업 성적 향상이 나타났다." },
        { id: "B", text: "학생들의 수면 시간에는 변화가 없었지만 만족도가 높아졌다." },
        { id: "C", text: "학생들이 더 늦게 자게 되어 수면 부족이 오히려 악화되었다." },
        { id: "D", text: "등교 시간 변경으로 교통 혼잡이 심해져 부정적 효과가 나타났다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "등교 시간 조정 정책의 실제 효과와 수면 보장의 교육적 중요성을 제시한다." },
        { id: "B", text: "캘리포니아주의 교육 제도 전반을 역사적으로 개관하고 있다." },
        { id: "C", text: "글림프 시스템의 작동 원리를 보다 상세히 분석하고 있다." },
        { id: "D", text: "수면이 신체 성장에 미치는 영향을 과학적으로 증명하고 있다." }
      ],
      answerId: "A"
    }
  ]);

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "기억 공고화가 일어나는 수면 단계의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "서파 수면")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "해마에 저장된 기억은 어디로 옮겨져 장기 기억이 되는가?",
      answerRanges: [findRange(paragraphs, "p1", "대뇌 피질")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "뇌의 노폐물 제거 시스템의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "글림프 시스템")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "알츠하이머병과 관련된 단백질의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "베타 아밀로이드")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "청소년의 생체 시계를 조절하는 호르몬 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "멜라토닌")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "캘리포니아주가 고등학교 수업 시작 시각을 몇 시 이후로 의무화하였는가?",
      answerRanges: [findRange(paragraphs, "p4", "8시 30분")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "필자는 수면을 단순한 무엇이 아니라 학습과 건강의 기반이라고 하였는가?",
      answerRanges: [findRange(paragraphs, "p4", "휴식")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: buildRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
}


// ════════════════════════════════════════════════════════════════
// Day 84 — 문학(LITERATURE): 현대 시 — 골목길의 고양이
// ════════════════════════════════════════════════════════════════

function buildDay84() {
  const paragraphs = [
    {
      id: "p1",
      text: "학교에서 돌아오는 길, 나는 늘 같은 골목을 지났다. 좁은 골목 양쪽으로 낡은 담장이 늘어서 있었고, 담 위에는 유리 조각이 박혀 있었다. 시멘트 바닥에는 빗물이 고인 자국이 이어져 있었고, 전봇대마다 낡은 전선이 거미줄처럼 엉켜 있었다. 봄이면 담 너머로 살구꽃이 피어올랐고, 가을에는 감나무 가지가 담 밖으로 삐져나와 주황빛 감이 대롱대롱 매달렸다. 그 골목 한가운데에 회색 줄무늬 고양이 한 마리가 살았다. 고양이는 오후 햇살이 비추는 담벼락 아래에 웅크리고 앉아 졸고 있었는데, 내가 지나가면 한쪽 눈을 살짝 떴다가 다시 감았다. 그 무심한 태도가 나는 좋았다."
    },
    {
      id: "p2",
      text: "나는 가끔 주머니에서 과자 부스러기를 꺼내 고양이 앞에 놓아 주었다. 고양이는 내가 멀찍이 물러서야 비로소 다가와 냄새를 맡았다. 급히 먹지 않고 한참을 들여다본 뒤 천천히 혀를 내밀어 핥았다. 그 모습이 마치 선물의 포장을 조심스럽게 뜯는 사람 같았다. 어느 날 비가 내렸을 때 고양이는 처마 밑 좁은 공간에 몸을 숨기고 있었다. 젖은 털이 몸에 달라붙어 평소보다 훨씬 작아 보였고, 두 눈은 빗줄기를 쫓듯 한쪽으로 가만히 향해 있었다. 나는 우산을 기울여 고양이 쪽으로 비를 막아 주려 했지만, 고양이는 슬쩍 몸을 빼며 더 깊숙한 곳으로 물러났다."
    },
    {
      id: "p3",
      text: "겨울이 오자 나는 고양이가 걱정되었다. 골목의 찬바람은 거셌고, 담벼락 아래는 더 이상 따뜻하지 않았다. 나는 작은 종이 상자에 헌 수건을 깔아 골목 한쪽에 놓아두었다. 며칠 뒤 보니 상자 안에 회색 털 몇 가닥이 붙어 있었다. 고양이가 들어갔다 나온 흔적이었다. 나는 기쁘면서도 약간 서운했다. 고양이가 나를 받아들인 것인지, 아니면 추위 앞에서 어쩔 수 없이 양보한 것인지 알 수 없었기 때문이다. 어쩌면 사람과 동물 사이의 관계란 원래 이런 것인지도 몰랐다. 완전히 이해하거나 완전히 거부하지 않는, 적당한 거리 위의 공존."
    },
    {
      id: "p4",
      text: "이듬해 봄, 살구꽃이 다시 필 무렵 고양이는 사라졌다. 담벼락 아래 자리는 비어 있었고, 종이 상자는 빗물에 젖어 쭈그러져 있었다. 나는 며칠 동안 골목을 서성였지만 고양이를 다시 보지 못했다. 슬프다기보다 어딘가 허전했다. 매일 지나치던 풍경에서 하나가 빠지자 골목 전체가 달라 보였다. 담벼락 아래의 빈자리가 유독 넓어 보였고, 골목의 고요함이 이전과는 다른 무게로 느껴졌다. 나는 그때 깨달았다. 매일 만나도 말 한마디 나누지 않던 존재가, 내 일상의 한 부분을 차지하고 있었다는 것을. 골목길의 고양이는 내게 소리 없이 존재의 의미를 가르쳐 주었다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 84 지문 길이: ${totalLen}자`);

  const content = assembleFull(84, "LITERATURE", "dr-r2-084", "일일 독해(러셀 2) Day 84 문학");

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "그 무심한 태도가 나는 좋았다." }],
      prompt: "화자가 고양이의 무심한 태도를 좋아한 이유로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "다가오지도 피하지도 않는 자연스러운 거리감이 편안했기 때문이다." },
        { id: "B", text: "고양이가 자신에게 적극적으로 애교를 부렸기 때문이다." },
        { id: "C", text: "고양이가 무서워서 공격하지 않아 안심했기 때문이다." },
        { id: "D", text: "고양이의 줄무늬 모양이 예뻐서 구경하기 좋았기 때문이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "골목길의 풍경과 고양이와의 첫 만남 및 그 인상을 서술한다." },
        { id: "B", text: "화자가 고양이를 집으로 데려가 키우기 시작한 과정을 보여 준다." },
        { id: "C", text: "골목의 위험성과 낡은 담장의 문제점을 지적하고 있다." },
        { id: "D", text: "봄과 가을의 계절 변화를 과학적으로 설명하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "그 모습이 마치 선물의 포장을 조심스럽게 뜯는 사람 같았다." }],
      prompt: "이 비유가 표현하는 고양이의 모습으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "과자를 급히 먹지 않고 조심스럽게 살피는 신중한 태도이다." },
        { id: "B", text: "선물을 받고 기뻐서 빠르게 뜯어 보는 모습이다." },
        { id: "C", text: "음식에 관심이 없어 무시하고 지나가는 태도이다." },
        { id: "D", text: "포장지를 모아 장난감으로 사용하는 영리한 행동이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "고양이는 슬쩍 몸을 빼며 더 깊숙한 곳으로 물러났다." }],
      prompt: "비를 막아 주려는 화자에게 고양이가 물러난 이유로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "사람과의 지나친 접촉을 피하려는 고양이 특유의 경계심 때문이다." },
        { id: "B", text: "우산 색깔이 무서워서 놀라 도망친 것이다." },
        { id: "C", text: "비를 맞는 것을 오히려 즐기기 때문에 거부한 것이다." },
        { id: "D", text: "화자가 이전에 고양이를 괴롭힌 적이 있어 경험적으로 피한 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "화자와 고양이 사이의 조심스러운 교류와 일정한 거리 유지를 그린다." },
        { id: "B", text: "비 오는 날 화자가 우산 없이 집에 돌아가는 고난을 묘사한다." },
        { id: "C", text: "고양이가 화자의 집에 들어와 함께 생활하는 모습을 서술한다." },
        { id: "D", text: "화자가 고양이에게 매일 풍성한 식사를 제공하는 장면이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "완전히 이해하거나 완전히 거부하지 않는, 적당한 거리 위의 공존." }],
      prompt: "이 문장이 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "사람과 동물의 관계는 완전한 소통도 단절도 아닌 적절한 거리감의 공존이라는 뜻이다." },
        { id: "B", text: "고양이와 사람은 절대로 친해질 수 없다는 단정적 판단이다." },
        { id: "C", text: "동물을 야생에 그대로 두는 것이 최선이라는 환경론적 주장이다." },
        { id: "D", text: "고양이가 사람을 완전히 신뢰하게 되었다는 긍정적 결론이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "겨울에 상자를 마련해 준 화자가 사람과 동물 사이 관계의 본질을 성찰한다." },
        { id: "B", text: "고양이가 추위를 이겨 내는 생물학적 메커니즘을 설명한다." },
        { id: "C", text: "화자가 동물 보호소에 연락하여 고양이를 구조하는 과정이다." },
        { id: "D", text: "겨울철 골목 주민들이 함께 길고양이를 돌보는 이야기이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "매일 만나도 말 한마디 나누지 않던 존재가, 내 일상의 한 부분을 차지하고 있었다는 것을." }],
      prompt: "화자가 깨달은 것으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "말 없이 존재하던 고양이가 자신의 일상에 중요한 부분이었다는 것이다." },
        { id: "B", text: "고양이에게 말을 가르쳤어야 했다는 후회이다." },
        { id: "C", text: "길고양이를 집에서 키우는 것이 더 나았을 것이라는 판단이다." },
        { id: "D", text: "고양이가 다른 골목으로 이사한 것이 확실하다는 추측이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "골목길의 고양이는 내게 소리 없이 존재의 의미를 가르쳐 주었다." }],
      prompt: "마지막 문장의 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "고양이와의 경험을 통해 말 없는 존재도 삶에 깊은 의미를 줄 수 있음을 배웠다." },
        { id: "B", text: "고양이가 화자에게 직접적으로 인생의 교훈을 전달하였다." },
        { id: "C", text: "골목길 자체가 화자에게 학업적 지식을 가르쳐 주었다." },
        { id: "D", text: "고양이를 잃은 슬픔이 너무 커서 다시는 동물을 좋아하지 않겠다는 다짐이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "고양이가 사라진 후 화자가 존재의 소중함과 부재의 허전함을 깨닫는다." },
        { id: "B", text: "새로운 고양이가 골목에 나타나 화자와 친구가 되는 내용이다." },
        { id: "C", text: "봄에 살구꽃이 피는 자연의 아름다움을 묘사하는 데 집중한다." },
        { id: "D", text: "화자가 고양이를 찾기 위해 도시 전체를 돌아다니는 이야기이다." }
      ],
      answerId: "A"
    }
  ]);

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "고양이의 외형적 특징은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "회색 줄무늬")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "고양이가 평소 앉아 있던 장소는 어디인가?",
      answerRanges: [findRange(paragraphs, "p1", "담벼락 아래")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "화자가 고양이 앞에 놓아 준 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "과자 부스러기")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "비 오는 날 고양이가 몸을 숨긴 곳은 어디인가?",
      answerRanges: [findRange(paragraphs, "p2", "처마 밑 좁은 공간")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "화자가 겨울에 고양이를 위해 골목에 놓아둔 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "작은 종이 상자에 헌 수건을 깔아")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "고양이가 상자에 들어갔음을 알려 주는 흔적은 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p3", "회색 털 몇 가닥")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "고양이가 사라진 계절은 언제인가?",
      answerRanges: [findRange(paragraphs, "p4", "봄")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: buildRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
}


// ════════════════════════════════════════════════════════════════
// Day 85 — 비문학(NONFICTION): 지도의 역사와 발전
// ════════════════════════════════════════════════════════════════

function buildDay85() {
  const paragraphs = [
    {
      id: "p1",
      text: "지도는 인류가 발명한 가장 오래된 정보 전달 도구 가운데 하나이다. 현존하는 가장 오래된 지도는 약 기원전 2300년경 메소포타미아 지역에서 만들어진 점토판 지도로, 강과 산, 도시의 위치가 간략히 새겨져 있다. 고대 그리스의 지리학자 에라토스테네스는 기원전 3세기에 지구의 둘레를 계산하고 최초의 경위도 체계를 고안하여 보다 정밀한 세계 지도를 만들었다. 이후 로마 시대에는 도로와 군사 거점을 표시한 실용적인 지도가 활용되었으며, 중세 유럽에서는 종교적 세계관을 반영한 TO 지도가 제작되었다."
    },
    {
      id: "p2",
      text: "대항해 시대에 접어들면서 지도 제작 기술은 비약적으로 발전하였다. 15세기 포르투갈과 에스파냐의 항해사들이 아프리카 해안과 아메리카 대륙을 탐험하면서 미지의 지역에 대한 지리 정보가 축적되었고, 이를 반영한 세계 지도가 잇달아 출판되었다. 1569년 플랑드르의 지도 제작자 메르카토르는 구면인 지구를 평면에 표현할 때 항로를 직선으로 나타낼 수 있는 투영법을 개발하였는데, 이 메르카토르 도법은 오늘날까지 항해와 항공에서 널리 사용되고 있다. 그러나 이 도법은 고위도 지역의 면적을 과장하는 단점이 있어, 세계의 실제 크기 비율과는 차이가 있다."
    },
    {
      id: "p3",
      text: "20세기 후반 인공위성과 컴퓨터 기술의 발전은 지도의 형태를 근본적으로 바꾸어 놓았다. 위성 사진과 항공 측량 데이터를 기반으로 한 수치 지도가 등장하였고, 이를 컴퓨터로 분석하고 관리하는 지리 정보 시스템인 GIS가 보급되었다. GIS는 단순히 위치를 보여 주는 것을 넘어, 인구 밀도, 토지 이용, 교통량, 환경 오염 등 다양한 정보를 지도 위에 겹쳐 표시하여 의사 결정을 지원한다. 도시 계획, 재난 관리, 물류 최적화 등 현대 사회의 핵심 분야에서 GIS는 필수적인 도구로 자리 잡았다."
    },
    {
      id: "p4",
      text: "오늘날 우리가 일상적으로 사용하는 디지털 지도는 이러한 기술 발전의 결과물이다. 스마트폰의 내비게이션 앱은 GPS 위성 신호를 받아 실시간 위치를 파악하고 최적의 경로를 안내한다. 또한 위성 영상과 거리 사진을 결합한 서비스를 통해 세계 어디든 가상으로 돌아볼 수 있게 되었다. 그러나 디지털 지도의 편리함 속에서 간과되기 쉬운 점이 있다. 지도는 단순한 위치 안내를 넘어, 세계를 어떤 시각으로 바라보느냐를 반영하는 문화적 산물이라는 것이다. 메르카토르 도법이 유럽 중심적 세계관을 반영하듯, 모든 지도에는 제작자의 관점과 시대의 가치관이 담겨 있다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 85 지문 길이: ${totalLen}자`);

  const content = assembleFull(85, "NONFICTION", "dr-r2-085", "일일 독해(러셀 2) Day 85 비문학");

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "현존하는 가장 오래된 지도는 약 기원전 2300년경 메소포타미아 지역에서 만들어진 점토판 지도로, 강과 산, 도시의 위치가 간략히 새겨져 있다." }],
      prompt: "현존하는 가장 오래된 지도에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "기원전 2300년경 메소포타미아의 점토판에 강, 산, 도시가 새겨져 있다." },
        { id: "B", text: "고대 그리스에서 양피지에 정밀하게 그려진 세계 지도이다." },
        { id: "C", text: "로마 시대에 제작된 군사용 도로 지도이다." },
        { id: "D", text: "중세 유럽에서 종교적 목적으로 제작된 지도이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "에라토스테네스는 기원전 3세기에 지구의 둘레를 계산하고 최초의 경위도 체계를 고안하여 보다 정밀한 세계 지도를 만들었다." }],
      prompt: "에라토스테네스의 업적으로 적절한 것은?",
      choices: [
        { id: "A", text: "지구 둘레를 계산하고 최초의 경위도 체계를 고안하였다." },
        { id: "B", text: "메르카토르 도법을 최초로 발명하여 항해에 활용하였다." },
        { id: "C", text: "점토판에 세계 최초의 지도를 새겼다." },
        { id: "D", text: "인공위성을 이용한 위성 사진 지도를 개발하였다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "고대부터 중세까지 지도의 기원과 발전 과정을 시간순으로 소개한다." },
        { id: "B", text: "메르카토르 도법의 원리와 장단점을 분석하고 있다." },
        { id: "C", text: "디지털 지도의 현대적 활용 사례를 설명하고 있다." },
        { id: "D", text: "GIS 시스템의 구성 요소와 기능을 상세히 서술한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "이 메르카토르 도법은 오늘날까지 항해와 항공에서 널리 사용되고 있다." }],
      prompt: "메르카토르 도법이 오늘날까지 사용되는 분야로 적절한 것은?",
      choices: [
        { id: "A", text: "항해와 항공 분야에서 널리 활용되고 있다." },
        { id: "B", text: "고고학적 유물 발굴 현장에서만 사용된다." },
        { id: "C", text: "인구 조사와 통계 분석에 주로 사용된다." },
        { id: "D", text: "건축 설계에서 건물 배치를 계획할 때 사용된다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "이 도법은 고위도 지역의 면적을 과장하는 단점이 있어, 세계의 실제 크기 비율과는 차이가 있다." }],
      prompt: "메르카토르 도법의 단점으로 적절한 것은?",
      choices: [
        { id: "A", text: "고위도 지역의 면적이 실제보다 크게 표현된다." },
        { id: "B", text: "항로를 곡선으로만 표현할 수 있어 항해에 불편하다." },
        { id: "C", text: "적도 부근의 대륙이 실제보다 훨씬 작게 나타난다." },
        { id: "D", text: "경위도 선이 표시되지 않아 좌표 확인이 불가능하다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "대항해 시대의 지리 탐험과 메르카토르 도법의 발명 및 한계를 설명한다." },
        { id: "B", text: "고대 그리스의 지리학 발전을 시간순으로 정리하고 있다." },
        { id: "C", text: "디지털 지도 기술의 발전과 스마트폰 활용을 다루고 있다." },
        { id: "D", text: "GIS의 다양한 활용 분야를 구체적 사례와 함께 소개한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "GIS는 단순히 위치를 보여 주는 것을 넘어, 인구 밀도, 토지 이용, 교통량, 환경 오염 등 다양한 정보를 지도 위에 겹쳐 표시하여 의사 결정을 지원한다." }],
      prompt: "GIS의 핵심 기능으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "다양한 정보를 지도 위에 겹쳐 표시하여 의사 결정을 지원한다." },
        { id: "B", text: "종이 지도를 자동으로 인쇄하는 기능을 수행한다." },
        { id: "C", text: "위성을 직접 조종하여 사진을 촬영하는 시스템이다." },
        { id: "D", text: "지도의 역사적 변천 과정을 데이터베이스로 관리한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "인공위성과 컴퓨터 기술에 의한 수치 지도와 GIS의 등장 및 활용을 설명한다." },
        { id: "B", text: "메르카토르 도법의 역사적 발전 과정을 보충 설명하고 있다." },
        { id: "C", text: "지도 제작에 사용되는 종이와 잉크의 발전사를 다루고 있다." },
        { id: "D", text: "스마트폰 내비게이션의 경로 안내 알고리즘을 분석한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "지도는 단순한 위치 안내를 넘어, 세계를 어떤 시각으로 바라보느냐를 반영하는 문화적 산물이라는 것이다." }],
      prompt: "필자가 강조하는 지도의 본질로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "지도는 제작자의 관점과 시대의 가치관이 담긴 문화적 산물이다." },
        { id: "B", text: "지도는 오직 정확한 위치 정보만을 전달하는 과학적 도구이다." },
        { id: "C", text: "지도는 예술 작품으로서 미적 감상의 대상이다." },
        { id: "D", text: "지도는 군사적 목적으로만 사용되는 기밀 문서이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "디지털 지도의 편리함과 함께 지도가 문화적 산물임을 강조한다." },
        { id: "B", text: "GPS 위성의 기술적 원리를 과학적으로 분석하고 있다." },
        { id: "C", text: "고대 지도와 현대 지도의 정확도를 수치로 비교하고 있다." },
        { id: "D", text: "종이 지도가 디지털 지도보다 우수하다는 주장을 펼치고 있다." }
      ],
      answerId: "A"
    }
  ]);

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "현존하는 가장 오래된 지도가 만들어진 재료는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "점토판")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "에라토스테네스가 고안한 것은 최초의 무엇 체계인가?",
      answerRanges: [findRange(paragraphs, "p1", "경위도")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "메르카토르 도법을 개발한 인물의 출신 지역은 어디인가?",
      answerRanges: [findRange(paragraphs, "p2", "플랑드르")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "메르카토르 도법의 단점은 어떤 지역의 면적을 과장하는 것인가?",
      answerRanges: [findRange(paragraphs, "p2", "고위도 지역")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "다양한 정보를 지도 위에 겹쳐 표시하는 시스템의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "GIS")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "스마트폰 내비게이션이 실시간 위치를 파악하기 위해 받는 신호는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "GPS 위성 신호")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "필자에 따르면 모든 지도에는 제작자의 무엇이 담겨 있는가?",
      answerRanges: [findRange(paragraphs, "p4", "관점과 시대의 가치관")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: buildRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
}


// ════════════════════════════════════════════════════════════════
// main
// ════════════════════════════════════════════════════════════════

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const staticDir = path.join(rootDir, 'frontend', 'public', 'daily-reading', 'russell2');
  const batchPath = path.join(rootDir, 'generated', 'daily-batch-reading-russell2.json');

  // 디렉터리 확인
  if (!fs.existsSync(staticDir)) fs.mkdirSync(staticDir, { recursive: true });

  const contents = [
    { day: 81, subArea: "NONFICTION", content: buildDay81() },
    { day: 82, subArea: "LITERATURE", content: buildDay82() },
    { day: 83, subArea: "NONFICTION", content: buildDay83() },
    { day: 84, subArea: "LITERATURE", content: buildDay84() },
    { day: 85, subArea: "NONFICTION", content: buildDay85() }
  ];

  // 검증
  for (const { day, content } of contents) {
    const len = charLen(content.payload.passage.paragraphs);
    if (len < 1150 || len > 1250) {
      console.warn(`경고: Day ${day} 지문 길이 ${len}자 (목표 1150~1250)`);
    }

    // 복기 카드 수 검증
    const cardCount = content.payload.recall.cards.length;
    if (cardCount !== 8) {
      console.error(`오류: Day ${day} 복기 카드 ${cardCount}장 (목표 8장)`);
      process.exit(1);
    }

    // 확인 문항 수 검증
    const qCount = content.payload.confirm.questions.length;
    if (qCount < 5 || qCount > 8) {
      console.error(`오류: Day ${day} 확인 문항 ${qCount}개 (목표 5~8)`);
      process.exit(1);
    }

    console.log(`Day ${day}: 길이=${len}자, 정독=${content.payload.intensive.timeline.length}단계, 복기=${cardCount}장, 확인=${qCount}문항`);
  }

  // 배치 파일 최신 상태 읽기 후 교체
  console.log('\n배치 파일 읽기...');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  console.log(`배치 파일 items 수: ${batch.items.length}`);

  for (const { day, subArea, content } of contents) {
    const idx = day - 1; // items[80]~[84]
    const batchItem = wrapBatchItem(day, subArea, content);
    batch.items[idx] = batchItem;
    console.log(`items[${idx}] (Day ${day}) 교체 완료`);
  }

  // 배치 파일 쓰기
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
  console.log(`배치 파일 저장: ${batchPath}`);

  // static 파일 쓰기
  for (const { day, content } of contents) {
    const fileName = String(day).padStart(3, '0') + '.json';
    const filePath = path.join(staticDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`static 파일 저장: ${filePath}`);
  }

  console.log('\n모든 작업 완료!');
}

main();
