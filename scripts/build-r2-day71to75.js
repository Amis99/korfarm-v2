/**
 * 러셀2(RUSSELL_2) Day 71~75 일일독해 콘텐츠 빌더
 * - Day 71: 비문학(NONFICTION), Day 72: 문학(LITERATURE)
 * - Day 73: 비문학(NONFICTION), Day 74: 문학(LITERATURE)
 * - Day 75: 비문학(NONFICTION)
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
    const j = (rng + i * 31) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── 콘텐츠 골격 생성 ───

function assembleFull(dayIndex, subArea, contentId, title, paragraphs, timeline, recallCards, confirmQuestions) {
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
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline },
      recall: recallCards,
      confirm: { questions: confirmQuestions }
    }
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

// 정독 타임라인 빌드
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
// Day 71 — 비문학(NONFICTION): 지진과 판 구조론
// ════════════════════════════════════════════════════════════════

function buildDay71() {
  const paragraphs = [
    {
      id: "p1",
      text: "지구의 표면은 하나의 단단한 껍질이 아니라, 여러 개의 거대한 판으로 이루어져 있다. 이 판들을 지각판이라 하며, 현재 약 열다섯 개의 주요 판이 확인되어 있다. 지각판은 지구 내부의 맨틀 위에 떠 있는 상태로, 맨틀의 대류 운동에 의해 매우 느린 속도로 이동한다. 판의 이동 속도는 연간 수 센티미터에 불과하지만, 수백만 년에 걸쳐 대륙의 위치를 크게 변화시킨다. 이러한 지구 표면의 역동적인 움직임을 설명하는 이론이 바로 판 구조론이다. 판 구조론은 독일의 기상학자 베게너가 제안한 대륙 이동설에서 출발하여 해저 확장설을 거쳐 오늘날의 형태로 발전하였다."
    },
    {
      id: "p2",
      text: "지진은 주로 지각판의 경계에서 발생한다. 판과 판이 서로 충돌하거나 어긋나 미끄러지거나 벌어지는 과정에서 엄청난 에너지가 축적되고, 이 에너지가 갑자기 방출될 때 지진이 일어난다. 지진의 세기는 규모와 진도로 나타낸다. 규모는 지진 자체가 방출한 에너지의 크기를 나타내는 절대적 수치이며, 진도는 특정 지점에서 느끼는 흔들림의 세기를 표현한 상대적 수치이다. 같은 규모의 지진이라도 진앙과의 거리, 지반의 특성에 따라 진도는 크게 달라질 수 있다. 환태평양 조산대, 이른바 불의 고리라 불리는 지역에는 지구 전체 지진의 약 팔십 퍼센트가 집중되어 있다."
    },
    {
      id: "p3",
      text: "지진이 발생하면 진동파가 사방으로 퍼져 나가며, 이 파동을 지진파라 한다. 지진파는 크게 P파와 S파로 나뉜다. P파는 매질을 압축과 팽창시키며 전달되는 종파로, 속도가 빠르기 때문에 지진 발생 직후 가장 먼저 도달한다. S파는 매질을 수직 방향으로 흔드는 횡파로, P파보다 느리지만 파괴력이 크다. 지진 관측소에서는 P파와 S파의 도착 시간 차이를 이용하여 진앙의 위치와 거리를 계산한다. 최소 세 곳 이상의 관측소 자료를 조합하면 진앙을 정확하게 결정할 수 있다. 이 원리를 삼각 측량법이라 하며, 지진 조기 경보 시스템의 핵심 기술로 활용된다."
    },
    {
      id: "p4",
      text: "한반도는 유라시아판 내부에 위치하여 판의 경계에 비해 지진 발생 빈도가 낮은 편이다. 그러나 역사 기록에 따르면 조선 시대에도 건물이 무너질 정도의 강한 지진이 여러 차례 발생한 바 있으며, 최근에도 경주와 포항에서 규모 오 이상의 지진이 발생하여 상당한 피해를 입혔다. 따라서 한반도라고 해서 지진 안전 지대는 아니다. 지진에 대비하기 위해서는 내진 설계를 강화하고, 지진 조기 경보 시스템을 확충하며, 국민이 지진 발생 시 행동 요령을 숙지하는 것이 중요하다. 지진은 예측이 어렵기 때문에 평소의 준비가 곧 최선의 대비책이 된다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 71 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "지구의 표면은 하나의 단단한 껍질이 아니라, 여러 개의 거대한 판으로 이루어져 있다." }],
      prompt: "이 문장에서 설명하는 지구 표면의 특성으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "지구 표면은 하나의 판이 아니라 여러 개의 판으로 구성되어 있다." },
        { id: "B", text: "지구 표면은 물로 이루어져 있어 항상 흔들린다." },
        { id: "C", text: "지구 표면은 완전히 부드러운 액체 상태이다." },
        { id: "D", text: "지구 표면은 하나의 거대한 금속 덩어리이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "판 구조론은 독일의 기상학자 베게너가 제안한 대륙 이동설에서 출발하여 해저 확장설을 거쳐 오늘날의 형태로 발전하였다." }],
      prompt: "판 구조론의 발전 과정으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "대륙 이동설에서 출발하여 해저 확장설을 거쳐 판 구조론으로 발전하였다." },
        { id: "B", text: "판 구조론이 먼저 나오고 이후 대륙 이동설이 등장하였다." },
        { id: "C", text: "해저 확장설과는 무관하게 독자적으로 등장한 이론이다." },
        { id: "D", text: "지진 관측 기술만으로 증명된 수학적 이론이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "지각판의 구성과 이동 원리, 판 구조론의 발전 과정을 소개하고 있다." },
        { id: "B", text: "지진의 발생 원인과 피해 사례를 구체적으로 설명하고 있다." },
        { id: "C", text: "화산 폭발과 지각판의 관계를 상세히 분석하고 있다." },
        { id: "D", text: "맨틀의 화학 성분과 온도 변화를 서술하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "규모는 지진 자체가 방출한 에너지의 크기를 나타내는 절대적 수치이며, 진도는 특정 지점에서 느끼는 흔들림의 세기를 표현한 상대적 수치이다." }],
      prompt: "규모와 진도의 차이로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "규모는 에너지의 절대적 크기이고, 진도는 특정 지점의 상대적 흔들림 세기이다." },
        { id: "B", text: "규모와 진도는 같은 의미로 혼용하여 사용할 수 있다." },
        { id: "C", text: "진도가 규모보다 항상 더 큰 수치로 표현된다." },
        { id: "D", text: "규모는 피해 정도를, 진도는 방출 에너지를 나타낸다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "지진의 발생 원리와 세기를 나타내는 규모·진도의 개념을 설명하고 있다." },
        { id: "B", text: "한반도에서 발생한 역대 지진 사례를 나열하고 있다." },
        { id: "C", text: "지진파의 종류와 전달 방식을 상세히 분석하고 있다." },
        { id: "D", text: "지진 대비 행동 요령을 단계별로 안내하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "P파는 매질을 압축과 팽창시키며 전달되는 종파로, 속도가 빠르기 때문에 지진 발생 직후 가장 먼저 도달한다." }],
      prompt: "P파의 특성으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "매질을 압축·팽창시키는 종파로, 속도가 빨라 가장 먼저 도달한다." },
        { id: "B", text: "매질을 수직으로 흔드는 횡파로, 파괴력이 매우 크다." },
        { id: "C", text: "속도가 느려 S파보다 항상 나중에 도착한다." },
        { id: "D", text: "액체를 통과하지 못하여 해양 관측이 불가능하다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "최소 세 곳 이상의 관측소 자료를 조합하면 진앙을 정확하게 결정할 수 있다. 이 원리를 삼각 측량법이라 하며, 지진 조기 경보 시스템의 핵심 기술로 활용된다." }],
      prompt: "진앙 결정에 사용되는 원리로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "세 곳 이상의 관측소 자료를 조합하는 삼각 측량법이다." },
        { id: "B", text: "위성에서 지표면의 균열을 직접 촬영하는 방법이다." },
        { id: "C", text: "지진 발생 후 주민 신고를 종합하여 결정하는 방법이다." },
        { id: "D", text: "한 곳의 관측소에서 S파만으로 계산하는 방법이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "지진파의 종류(P파·S파)와 진앙 결정 원리를 설명하고 있다." },
        { id: "B", text: "지각판의 종류와 경계를 분류하고 있다." },
        { id: "C", text: "한반도의 지진 대비 현황을 평가하고 있다." },
        { id: "D", text: "화산 활동과 지진의 인과 관계를 분석하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "최근에도 경주와 포항에서 규모 오 이상의 지진이 발생하여 상당한 피해를 입혔다." }],
      prompt: "한반도에서 최근 지진이 발생한 지역으로 언급된 곳은?",
      choices: [
        { id: "A", text: "경주와 포항에서 규모 오 이상의 지진이 발생하였다." },
        { id: "B", text: "서울과 부산에서 대규모 화산 폭발이 있었다." },
        { id: "C", text: "제주도에서 해일이 발생하여 큰 피해를 입었다." },
        { id: "D", text: "강원도에서 판의 경계가 새로 형성되었다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "한반도도 지진 안전 지대가 아니므로 대비가 필요하다는 점을 강조하고 있다." },
        { id: "B", text: "한반도가 판의 경계에 위치하여 매일 지진이 발생한다고 설명한다." },
        { id: "C", text: "일본의 지진 대비 시스템을 벤치마킹해야 한다고 주장한다." },
        { id: "D", text: "지각판의 이동 속도를 측정하는 방법을 소개하고 있다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "현재 확인된 주요 지각판의 수는 약 몇 개인가?",
      answerRanges: [findRange(paragraphs, "p1", "열다섯 개")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "판 구조론의 출발점이 된 이론을 제안한 학자는 누구인가?",
      answerRanges: [findRange(paragraphs, "p1", "베게너")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "지구 전체 지진의 약 팔십 퍼센트가 집중된 지역을 무엇이라 부르는가?",
      answerRanges: [findRange(paragraphs, "p2", "불의 고리")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "지진파 중 속도가 느리지만 파괴력이 큰 파동은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "S파")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "진앙의 위치를 결정하기 위해 사용하는 측량 방법의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "삼각 측량법")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "한반도에서 최근 규모 오 이상의 지진이 발생한 두 지역은 어디인가?",
      answerRanges: [findRange(paragraphs, "p4", "경주와 포항")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "지진 대비를 위해 건물에 적용해야 하는 설계 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "내진 설계")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const dayStr = "071";
  return assembleFull(71, "NONFICTION", `dr-r2-${dayStr}`, "일일 독해(러셀 2) Day 71 비문학", paragraphs, timeline, buildRecallCards(paragraphs), confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 72 — 문학(LITERATURE): 현대 소설 — 할머니의 텃밭
// ════════════════════════════════════════════════════════════════

function buildDay72() {
  const paragraphs = [
    {
      id: "p1",
      text: "도시에서 나고 자란 수빈이에게 시골 할머니 댁은 일 년에 한두 번 가는 먼 곳이었다. 부모님은 늘 바빠서 명절에도 하루만 머물다 돌아오곤 했다. 수빈이가 중학교에 올라가던 해, 할머니가 뇌졸중으로 쓰러지셨다는 연락이 왔다. 어머니는 급히 시골로 내려갔고, 수빈이도 방학을 이용해 할머니 댁에서 한 달간 머물게 되었다. 할머니는 병원에서 퇴원한 뒤 왼쪽 팔을 제대로 쓰지 못했지만, 매일 아침 지팡이를 짚고 마당의 텃밭으로 나갔다. 수빈이는 처음에 그런 할머니가 안쓰러워 말렸지만, 할머니는 씩씩하게 웃으며 식물이 기다린다고 말씀하셨다."
    },
    {
      id: "p2",
      text: "텃밭에는 상추, 고추, 토마토, 호박이 가지런히 심어져 있었다. 할머니는 한 손으로 물뿌리개를 들고 식물마다 정성스럽게 물을 주셨다. 수빈이가 대신 물을 주겠다고 하자, 할머니는 고맙다며 잡초 뽑는 법을 가르쳐 주셨다. 풀을 뽑는 일은 지루해 보였지만, 잡초와 작물을 구별하는 것이 의외로 재미있었다. 매일 아침 텃밭에 나가니 전날 보이지 않던 꽃이 피어 있기도 하고, 작은 열매가 하나씩 달려 가는 것이 신기했다. 수빈이는 처음으로 내 손으로 키운다는 느낌을 알게 되었다. 도시에서는 마트에 진열된 채소만 보았지, 흙 속에서 자라는 과정을 지켜본 적이 없었기 때문이다."
    },
    {
      id: "p3",
      text: "한 달이 지나자 수빈이가 뽑아 준 자리에서 상추가 쑥쑥 자라 먹을 수 있을 만큼 커졌다. 할머니는 첫 수확을 수빈이에게 맡기셨고, 수빈이는 상추 잎을 한 장 한 장 조심스럽게 따며 뿌듯함을 느꼈다. 저녁 식탁에는 그 상추로 쌈을 싸서 먹었다. 할머니는 수빈이가 키운 상추라며 맛이 특별하다고 하셨고, 수빈이는 얼굴이 빨갛게 달아올랐다. 식사를 마친 뒤 할머니는 텃밭은 결과보다 과정이 중요한 곳이라고 말씀하셨다. 씨앗을 심고, 물을 주고, 잡초를 뽑고, 기다리는 동안에 사람도 함께 자란다는 것이었다. 수빈이는 그 말이 자신에게도 해당되는 것 같아 고개를 끄덕였다."
    },
    {
      id: "p4",
      text: "서울로 돌아온 수빈이는 베란다 화분에 상추 씨앗을 심었다. 매일 아침 물을 주고, 잎이 나오는 것을 관찰 일기에 기록했다. 할머니와 영상 통화를 할 때면 화분을 보여 드리며 자라는 모습을 전했고, 할머니는 잘한다며 환하게 웃으셨다. 이전에는 학원과 게임으로만 채워졌던 하루에 작은 생명을 돌보는 시간이 추가되었다. 수빈이는 텃밭에서 보낸 한 달이 단순한 체험이 아니라 삶을 대하는 태도를 바꿔 준 시간이었음을 깨달았다. 기다림의 가치, 정성의 보람, 그리고 할머니의 따뜻한 손길을 잊지 않겠다고 마음속으로 약속했다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 72 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "할머니는 병원에서 퇴원한 뒤 왼쪽 팔을 제대로 쓰지 못했지만, 매일 아침 지팡이를 짚고 마당의 텃밭으로 나갔다." }],
      prompt: "이 문장에서 드러나는 할머니의 성격으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "몸이 불편해도 텃밭을 포기하지 않는 강인한 의지를 지닌 분이다." },
        { id: "B", text: "병을 무시하고 무리하게 일하는 무모한 성격이다." },
        { id: "C", text: "가족의 도움 없이 홀로 살아가는 고독한 모습이다." },
        { id: "D", text: "텃밭에 대한 관심이 없지만 억지로 나가는 모습이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "수빈이가 방학에 할머니 댁에 머물게 된 배경과 할머니의 강인한 모습을 소개한다." },
        { id: "B", text: "할머니가 병원에 입원한 기간의 치료 과정을 상세히 서술한다." },
        { id: "C", text: "수빈이가 시골 생활을 싫어하여 도시로 돌아가려는 모습을 그린다." },
        { id: "D", text: "부모님이 시골에서 농사를 짓기 시작하는 이야기이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "수빈이는 처음으로 내 손으로 키운다는 느낌을 알게 되었다." }],
      prompt: "이 문장이 전달하는 수빈이의 변화로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "직접 식물을 가꾸면서 생명을 돌보는 보람을 처음 경험했다." },
        { id: "B", text: "농사일이 힘들어 다시는 하고 싶지 않다는 감정을 느꼈다." },
        { id: "C", text: "도시의 편리함이 시골보다 월등히 좋다는 것을 깨달았다." },
        { id: "D", text: "텃밭 일보다 실내에서 공부하는 것이 낫다고 결심했다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "수빈이가 텃밭 일을 도우며 식물이 자라는 과정의 재미와 보람을 알게 된다." },
        { id: "B", text: "할머니가 수빈이에게 요리 방법을 가르쳐 주는 장면이다." },
        { id: "C", text: "텃밭에 병충해가 발생하여 작물이 모두 죽는 사건이다." },
        { id: "D", text: "수빈이가 텃밭 대신 마을 친구들과 놀러 다니는 이야기이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "텃밭은 결과보다 과정이 중요한 곳이라고 말씀하셨다. 씨앗을 심고, 물을 주고, 잡초를 뽑고, 기다리는 동안에 사람도 함께 자란다는 것이었다." }],
      prompt: "할머니 말씀의 핵심 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "텃밭 가꾸기의 과정 자체가 사람을 성장시킨다는 것이다." },
        { id: "B", text: "수확량이 많아야 좋은 텃밭이라는 실용적 관점이다." },
        { id: "C", text: "잡초를 뽑지 않아도 작물이 잘 자란다는 뜻이다." },
        { id: "D", text: "텃밭 일은 어른만 해야 하고 아이에게는 적합하지 않다는 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "첫 수확의 기쁨과 할머니의 가르침을 통해 수빈이가 성장하는 장면이다." },
        { id: "B", text: "상추 요리법과 영양소를 과학적으로 설명하고 있다." },
        { id: "C", text: "수빈이가 할머니의 조언을 거부하고 자기 방식대로 하는 이야기이다." },
        { id: "D", text: "텃밭의 작물이 모두 시들어 실패하는 이야기이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "수빈이는 텃밭에서 보낸 한 달이 단순한 체험이 아니라 삶을 대하는 태도를 바꿔 준 시간이었음을 깨달았다." }],
      prompt: "이 문장이 전달하는 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "텃밭 경험이 수빈이의 삶의 태도에 근본적인 변화를 주었다." },
        { id: "B", text: "수빈이가 농부가 되기로 진로를 결정한 것이다." },
        { id: "C", text: "체험 활동이 학교 성적 향상에 도움이 되었다는 뜻이다." },
        { id: "D", text: "도시 생활이 시골보다 열등하다는 결론을 내린 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "서울로 돌아온 수빈이가 텃밭 경험을 이어 가며 성장을 다짐하는 장면이다." },
        { id: "B", text: "수빈이가 할머니와의 추억을 잊고 도시 생활에 빠져드는 이야기이다." },
        { id: "C", text: "베란다 화분이 실패하여 수빈이가 좌절하는 내용이다." },
        { id: "D", text: "할머니가 서울로 이사 오는 계획을 세우는 이야기이다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "할머니가 쓰러지신 질병의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "뇌졸중")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "수빈이가 할머니 댁에서 머문 기간은 얼마인가?",
      answerRanges: [findRange(paragraphs, "p1", "한 달")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "텃밭에 심어져 있던 작물 중 네 가지를 모두 포함하는 부분은?",
      answerRanges: [findRange(paragraphs, "p2", "상추, 고추, 토마토, 호박")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "수빈이가 처음 수확한 작물은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "상추")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "할머니가 텃밭에서 결과보다 더 중요하다고 하신 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "과정")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "서울로 돌아온 수빈이가 베란다 화분에 심은 씨앗은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "상추 씨앗")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const dayStr = "072";
  return assembleFull(72, "LITERATURE", `dr-r2-${dayStr}`, "일일 독해(러셀 2) Day 72 문학", paragraphs, timeline, buildRecallCards(paragraphs), confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 73 — 비문학(NONFICTION): 인공지능과 기계 학습의 원리
// ════════════════════════════════════════════════════════════════

function buildDay73() {
  const paragraphs = [
    {
      id: "p1",
      text: "인공지능은 인간의 학습, 추론, 판단 능력을 컴퓨터로 구현하는 기술을 통칭한다. 인공지능의 역사는 1950년대로 거슬러 올라가며, 앨런 튜링이 기계의 사고 가능성을 제기한 것이 출발점으로 여겨진다. 초기 인공지능 연구는 명확한 규칙을 프로그래밍하여 문제를 해결하는 방식이었다. 그러나 현실 세계의 문제는 규칙으로 일일이 정의하기 어려운 경우가 많아 이 접근법에는 한계가 있었다. 이러한 한계를 극복하기 위해 등장한 것이 기계 학습이다. 기계 학습은 데이터를 통해 컴퓨터가 스스로 패턴을 발견하고 학습하는 방법으로, 인공지능의 핵심 분야 가운데 하나이다."
    },
    {
      id: "p2",
      text: "기계 학습은 크게 지도 학습, 비지도 학습, 강화 학습의 세 가지 유형으로 나뉜다. 지도 학습은 정답이 표시된 데이터를 제공하여 모델이 입력과 출력 사이의 관계를 학습하게 하는 방식이다. 예를 들어 수천 장의 고양이 사진과 개 사진에 각각 정답 표시를 붙여 학습시키면, 새로운 사진이 주어졌을 때 고양이인지 개인지를 분류할 수 있게 된다. 비지도 학습은 정답 없이 데이터 자체의 구조나 유사성을 찾아내는 방법이며, 고객 분류나 이상 탐지 등에 활용된다. 강화 학습은 시행착오를 통해 보상을 최대화하는 행동을 배우는 방식으로, 바둑 인공지능 알파고가 대표적인 사례이다."
    },
    {
      id: "p3",
      text: "최근 인공지능 발전의 핵심 동력은 딥러닝이다. 딥러닝은 인간 뇌의 신경 세포에서 영감을 받은 인공 신경망을 여러 층으로 쌓아 올린 구조를 사용한다. 층이 깊어질수록 더 복잡한 특징을 추출할 수 있으며, 이미지 인식, 음성 인식, 자연어 처리 등에서 기존 방법보다 월등한 성능을 보여 준다. 딥러닝이 최근에야 비약적으로 발전한 데에는 세 가지 요인이 작용했다. 첫째, 인터넷과 디지털 기기의 보급으로 대규모 데이터가 축적되었다. 둘째, 그래픽 처리 장치의 발전으로 복잡한 연산을 빠르게 수행할 수 있게 되었다. 셋째, 알고리즘 자체의 혁신이 이루어졌다."
    },
    {
      id: "p4",
      text: "인공지능은 의료 진단, 자율 주행, 번역, 추천 시스템 등 다양한 분야에서 실생활에 활용되고 있다. 그러나 편향된 데이터로 학습한 인공지능이 차별적 결과를 내놓거나, 판단의 근거를 설명하기 어려운 블랙박스 문제가 제기되기도 한다. 또한 인공지능이 인간의 일자리를 대체할 수 있다는 우려도 존재한다. 이에 따라 인공지능 윤리에 대한 논의가 활발히 이루어지고 있으며, 투명성과 공정성을 확보하기 위한 기술적·제도적 노력이 진행 중이다. 인공지능은 도구에 불과하므로, 이를 어떻게 개발하고 활용할지는 결국 인간의 선택에 달려 있다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 73 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "인공지능은 인간의 학습, 추론, 판단 능력을 컴퓨터로 구현하는 기술을 통칭한다." }],
      prompt: "인공지능의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "인간의 학습, 추론, 판단 능력을 컴퓨터로 구현하는 기술이다." },
        { id: "B", text: "로봇이 인간의 외형을 모방하여 만들어진 기계이다." },
        { id: "C", text: "인터넷에 연결된 모든 전자 기기를 통칭하는 용어이다." },
        { id: "D", text: "프로그래밍 언어의 한 종류를 가리키는 명칭이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "기계 학습은 데이터를 통해 컴퓨터가 스스로 패턴을 발견하고 학습하는 방법으로, 인공지능의 핵심 분야 가운데 하나이다." }],
      prompt: "기계 학습의 특징으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "데이터를 통해 컴퓨터가 스스로 패턴을 발견하고 학습하는 방법이다." },
        { id: "B", text: "프로그래머가 모든 규칙을 직접 입력해야 하는 방식이다." },
        { id: "C", text: "데이터 없이 이론만으로 문제를 해결하는 수학적 접근이다." },
        { id: "D", text: "인간이 기계를 조립하는 물리적 기술을 뜻한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "인공지능의 역사와 기계 학습 등장의 배경을 설명하고 있다." },
        { id: "B", text: "딥러닝의 구조와 작동 원리를 분석하고 있다." },
        { id: "C", text: "인공지능의 윤리적 문제를 비판적으로 논의하고 있다." },
        { id: "D", text: "자율 주행 자동차의 기술적 구현을 상세히 묘사하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "지도 학습은 정답이 표시된 데이터를 제공하여 모델이 입력과 출력 사이의 관계를 학습하게 하는 방식이다." }],
      prompt: "지도 학습의 특징으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "정답이 표시된 데이터를 제공하여 입력과 출력의 관계를 학습한다." },
        { id: "B", text: "보상과 처벌을 통해 최적의 행동을 배우는 방식이다." },
        { id: "C", text: "정답 없이 데이터의 구조만 분석하는 방법이다." },
        { id: "D", text: "인간이 직접 결과를 판단해 주는 수작업 방식이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "강화 학습은 시행착오를 통해 보상을 최대화하는 행동을 배우는 방식으로, 바둑 인공지능 알파고가 대표적인 사례이다." }],
      prompt: "강화 학습의 대표적 사례로 제시된 것은?",
      choices: [
        { id: "A", text: "바둑 인공지능인 알파고이다." },
        { id: "B", text: "고양이와 개를 분류하는 이미지 인식이다." },
        { id: "C", text: "고객을 유형별로 나누는 비지도 학습이다." },
        { id: "D", text: "인터넷 검색 엔진의 키워드 매칭이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "기계 학습의 세 가지 유형(지도·비지도·강화 학습)을 설명하고 있다." },
        { id: "B", text: "인공 신경망의 층 구조와 연산 방식을 서술하고 있다." },
        { id: "C", text: "인공지능이 일자리에 미치는 부정적 영향을 논의하고 있다." },
        { id: "D", text: "인공지능 연구의 역사적 기원을 시간순으로 정리하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "딥러닝은 인간 뇌의 신경 세포에서 영감을 받은 인공 신경망을 여러 층으로 쌓아 올린 구조를 사용한다." }],
      prompt: "딥러닝의 구조로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "인간 뇌의 신경 세포에서 영감을 받아 인공 신경망을 여러 층으로 쌓은 구조이다." },
        { id: "B", text: "단일 층의 간단한 수학 공식으로 이루어진 구조이다." },
        { id: "C", text: "규칙을 직접 프로그래밍하는 전통적 소프트웨어 방식이다." },
        { id: "D", text: "데이터 없이 논리적 추론만으로 작동하는 시스템이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "딥러닝의 구조와 최근 발전을 이끈 세 가지 요인을 설명하고 있다." },
        { id: "B", text: "인공지능 윤리 문제와 사회적 쟁점을 다루고 있다." },
        { id: "C", text: "기계 학습의 세 유형을 비교 분석하고 있다." },
        { id: "D", text: "앨런 튜링의 생애와 업적을 자세히 소개하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "편향된 데이터로 학습한 인공지능이 차별적 결과를 내놓거나, 판단의 근거를 설명하기 어려운 블랙박스 문제가 제기되기도 한다." }],
      prompt: "인공지능의 문제점으로 제시된 것은?",
      choices: [
        { id: "A", text: "편향된 데이터에 의한 차별적 결과와 블랙박스 문제이다." },
        { id: "B", text: "전력 소비가 적어 환경에 도움이 된다는 점이다." },
        { id: "C", text: "인간의 감정을 완벽하게 이해할 수 있다는 것이다." },
        { id: "D", text: "모든 분야에서 인간보다 정확한 판단을 내린다는 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "인공지능의 다양한 활용과 윤리적 문제, 인간 선택의 중요성을 논의한다." },
        { id: "B", text: "인공지능이 모든 일자리를 대체할 것이라는 전망을 확정적으로 서술한다." },
        { id: "C", text: "딥러닝의 기술적 구조를 수학적으로 분석하고 있다." },
        { id: "D", text: "강화 학습의 구체적인 알고리즘을 코드로 설명하고 있다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "기계의 사고 가능성을 최초로 제기한 학자는 누구인가?",
      answerRanges: [findRange(paragraphs, "p1", "앨런 튜링")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "정답이 표시된 데이터를 사용하여 학습하는 기계 학습의 유형은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "지도 학습")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "강화 학습의 대표적 사례로 언급된 바둑 인공지능의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "알파고")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "딥러닝이 영감을 받은 생물학적 구조는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "인간 뇌의 신경 세포")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "딥러닝 발전의 세 가지 요인 중 대규모 데이터 축적의 배경은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "인터넷과 디지털 기기의 보급")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "인공지능의 판단 근거를 설명하기 어려운 문제를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "블랙박스 문제")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "글의 마지막 문장에서 인공지능의 개발과 활용은 결국 무엇에 달려 있다고 하였는가?",
      answerRanges: [findRange(paragraphs, "p4", "인간의 선택")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const dayStr = "073";
  return assembleFull(73, "NONFICTION", `dr-r2-${dayStr}`, "일일 독해(러셀 2) Day 73 비문학", paragraphs, timeline, buildRecallCards(paragraphs), confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 74 — 문학(LITERATURE): 현대 수필 — 편지를 쓰는 시간
// ════════════════════════════════════════════════════════════════

function buildDay74() {
  const paragraphs = [
    {
      id: "p1",
      text: "다락방을 정리하다가 나무 상자 하나를 발견했다. 먼지가 수북이 쌓인 그 상자 안에는 어머니가 아버지에게 보낸 편지 스무 통이 차곡차곡 들어 있었다. 편지지는 누렇게 바래 있었고, 잉크는 군데군데 번져 있었지만, 어머니의 또박또박한 글씨는 여전히 읽을 수 있었다. 첫 번째 편지는 결혼 전 아버지에게 보낸 것이었다. 어머니는 오늘 하늘이 참 맑아서 편지를 쓰고 싶었다고 적었다. 특별한 사건이 아니라 날씨 이야기로 시작한 그 편지가 이상하게 가슴에 와닿았다. 말로는 차마 못 하는 감정을 글에 담아 보내는 그 시대의 방식이 참 아름답다고 느꼈다."
    },
    {
      id: "p2",
      text: "나는 편지를 한 통씩 읽어 나갔다. 어머니는 일상의 사소한 것들을 정성스럽게 적으셨다. 시장에서 산 배추로 김치를 담갔다는 이야기, 동네 고양이가 마루에 올라와 낮잠을 잤다는 이야기, 가을 은행나무가 노랗게 물들어 예뻤다는 이야기까지. 거창한 사건은 하나도 없었지만, 한 줄 한 줄이 그 시절 어머니의 하루를 생생하게 그려 주었다. 편지 중간에는 보고 싶다는 말이 자주 등장했는데, 그 말이 반복될수록 짧은 세 글자에 담긴 그리움의 무게가 점점 깊어지는 것이 느껴졌다. 지금이라면 전화 한 통이면 될 일을, 어머니는 한 글자 한 글자 정성 들여 적어 보내신 것이었다."
    },
    {
      id: "p3",
      text: "편지를 모두 읽고 나서 나도 편지를 쓰기로 했다. 책상 서랍에서 오래된 편지지를 꺼내고, 연필을 깎았다. 누구에게 쓸까 잠시 고민하다가 어머니에게 쓰기로 했다. 그런데 막상 첫 줄을 적으려 하니 무엇을 써야 할지 막막했다. 메신저에서는 짧은 이모티콘 하나로 감정을 전달하는 데 익숙해져 있었기 때문이다. 한참을 고민한 끝에 나는 오늘 다락방에서 편지를 발견했다는 것부터 적기 시작했다. 어머니의 글씨가 예뻤다는 것, 보고 싶다는 세 글자에 울컥했다는 것, 그리고 나도 이렇게 편지를 쓰고 싶어졌다는 것을 천천히 적어 나갔다."
    },
    {
      id: "p4",
      text: "편지를 다 쓰고 봉투에 넣으며 이상한 충만감이 밀려왔다. 디지털 시대에 손 글씨 편지를 쓴다는 것이 어색하기도 했지만, 한 글자를 쓰는 데 들이는 시간만큼 마음도 함께 실려 간다는 것을 알게 되었다. 빠른 전달이 아니라 느린 정성이 편지의 본질이라는 생각이 들었다. 나는 편지를 우체통에 넣으러 나가면서 어머니가 편지를 받고 어떤 표정을 지으실지 상상했다. 아마 놀라시겠지만, 분명 웃으실 것이다. 어머니의 나무 상자에 내 편지가 한 통 더 추가되기를 바라며, 나는 골목길 끝의 빨간 우체통을 향해 걸어갔다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 74 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "먼지가 수북이 쌓인 그 상자 안에는 어머니가 아버지에게 보낸 편지 스무 통이 차곡차곡 들어 있었다." }],
      prompt: "나무 상자 안에서 발견한 것으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "어머니가 아버지에게 보낸 편지 스무 통이다." },
        { id: "B", text: "아버지가 어머니에게 쓴 일기장 한 권이다." },
        { id: "C", text: "오래된 가족 사진 앨범이다." },
        { id: "D", text: "할머니가 남긴 요리 레시피 노트이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "말로는 차마 못 하는 감정을 글에 담아 보내는 그 시대의 방식이 참 아름답다고 느꼈다." }],
      prompt: "화자가 아름답다고 느낀 것으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "말로 표현하기 어려운 감정을 편지글에 담아 전하는 방식이다." },
        { id: "B", text: "편지지의 디자인과 색깔이 매우 화려했다는 점이다." },
        { id: "C", text: "편지를 빠르게 보낼 수 있는 우편 시스템의 효율성이다." },
        { id: "D", text: "어머니의 글씨가 인쇄체처럼 반듯했다는 사실이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "다락방에서 어머니의 편지를 발견하고 손 글씨 편지의 아름다움을 느끼는 장면이다." },
        { id: "B", text: "다락방을 수리하는 과정에서 나무 상자가 부서지는 사건이다." },
        { id: "C", text: "아버지가 어머니에게 보낸 답장의 내용을 소개하고 있다." },
        { id: "D", text: "편지지의 제조 과정과 종이의 재질을 설명하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "편지 중간에는 보고 싶다는 말이 자주 등장했는데, 그 말이 반복될수록 짧은 세 글자에 담긴 그리움의 무게가 점점 깊어지는 것이 느껴졌다." }],
      prompt: "이 문장에서 전달하는 감정으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "짧은 말이 반복되면서 그리움의 깊이가 더해지는 절절한 감정이다." },
        { id: "B", text: "같은 말의 반복에 지루함을 느끼는 화자의 심리이다." },
        { id: "C", text: "어머니가 글쓰기 실력이 부족하여 같은 말만 반복한 것이다." },
        { id: "D", text: "편지의 내용이 단조로워 감흥이 없었다는 비판이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "어머니의 편지에 담긴 소소한 일상과 깊은 그리움을 읽어 가는 과정이다." },
        { id: "B", text: "어머니가 편지 대신 전화를 사용하게 된 계기를 서술하고 있다." },
        { id: "C", text: "편지에 적힌 요리 레시피를 따라 음식을 만드는 장면이다." },
        { id: "D", text: "화자가 편지를 버리기로 결심하는 내용이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "메신저에서는 짧은 이모티콘 하나로 감정을 전달하는 데 익숙해져 있었기 때문이다." }],
      prompt: "화자가 편지 쓰기를 어려워한 이유로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "이모티콘 등 간편한 디지털 소통에 익숙해져 글로 감정을 표현하기 어려웠다." },
        { id: "B", text: "편지지를 구할 수 없어서 쓸 수가 없었다." },
        { id: "C", text: "어머니의 주소를 몰라서 보낼 곳이 없었다." },
        { id: "D", text: "글씨를 쓸 줄 몰라서 타자로 치려고 했기 때문이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "화자가 어머니에게 편지를 쓰기로 결심하고 어렵게 첫 글을 시작하는 과정이다." },
        { id: "B", text: "화자가 친구들에게 단체 메시지를 보내는 장면이다." },
        { id: "C", text: "편지를 쓰다가 포기하고 전화를 거는 이야기이다." },
        { id: "D", text: "연필을 깎다가 손을 다치는 사건을 서술하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "빠른 전달이 아니라 느린 정성이 편지의 본질이라는 생각이 들었다." }],
      prompt: "화자가 생각한 편지의 본질로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "빠른 전달이 아니라 한 글자 한 글자에 정성을 담는 느린 소통이다." },
        { id: "B", text: "정보를 가장 효율적으로 전달하는 수단이라는 점이다." },
        { id: "C", text: "우표 수집의 취미와 연결된다는 실용적 가치이다." },
        { id: "D", text: "디지털 기기를 사용할 수 없을 때의 대체 수단이라는 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "편지를 쓰고 보내면서 느린 정성의 가치를 깨달은 화자의 감동이다." },
        { id: "B", text: "우체통이 사라져서 편지를 보내지 못하는 사회 문제를 지적한다." },
        { id: "C", text: "어머니가 편지를 받고 실망하는 결말을 그리고 있다." },
        { id: "D", text: "화자가 편지 대신 이메일을 보내기로 방향을 바꾸는 내용이다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "화자가 다락방에서 발견한 상자 안에는 편지가 몇 통 들어 있었는가?",
      answerRanges: [findRange(paragraphs, "p1", "스무 통")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "어머니의 첫 번째 편지는 무엇에 대한 이야기로 시작하였는가?",
      answerRanges: [findRange(paragraphs, "p1", "날씨")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "편지에서 반복된 세 글자의 말은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "보고 싶다")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "화자가 편지를 쓰기 위해 서랍에서 꺼낸 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "오래된 편지지")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "화자가 편지의 본질이라고 생각한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "느린 정성")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "화자가 편지를 넣으러 향한 곳은 어디인가?",
      answerRanges: [findRange(paragraphs, "p4", "빨간 우체통")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const dayStr = "074";
  return assembleFull(74, "LITERATURE", `dr-r2-${dayStr}`, "일일 독해(러셀 2) Day 74 문학", paragraphs, timeline, buildRecallCards(paragraphs), confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 75 — 비문학(NONFICTION): 발효 식품의 과학
// ════════════════════════════════════════════════════════════════

function buildDay75() {
  const paragraphs = [
    {
      id: "p1",
      text: "발효는 미생물이 유기물을 분해하여 새로운 물질을 생성하는 생화학적 과정이다. 인류는 수천 년 전부터 발효를 활용해 왔으며, 빵, 치즈, 맥주, 와인, 간장, 김치 등 다양한 식품이 발효를 통해 만들어진다. 발효의 핵심 주체는 효모, 젖산균, 초산균 등의 미생물이다. 이들은 식품 속의 당분이나 단백질을 분해하면서 알코올, 젖산, 아세트산 등의 부산물을 생성한다. 발효가 부패와 다른 점은, 발효 과정에서 생성되는 물질이 인체에 유익하고 식품의 풍미를 향상시킨다는 것이다. 반면 부패는 유해 세균에 의해 식품이 변질되어 악취가 나고 독소가 생기는 현상이다."
    },
    {
      id: "p2",
      text: "한국의 대표적인 발효 식품인 김치는 배추나 무 등의 채소를 소금에 절인 뒤 젖산 발효시킨 것이다. 김치가 발효되는 과정에서 류코노스톡, 락토바실러스 등 다양한 젖산균이 활동한다. 발효 초기에는 류코노스톡이 먼저 번식하여 이산화탄소를 생성하는데, 이 과정에서 김치 특유의 청량한 맛이 만들어진다. 발효가 진행되면 락토바실러스가 주도권을 잡으며 젖산을 대량으로 생성하여 산도가 높아지고, 이로 인해 김치의 신맛이 강해진다. 이처럼 김치의 맛은 발효 단계에 따라 미생물의 종류와 비율이 달라지면서 변화하며, 온도와 소금 농도가 발효 속도를 조절하는 핵심 변수이다."
    },
    {
      id: "p3",
      text: "발효 식품이 건강에 유익한 이유는 여러 가지이다. 첫째, 발효 과정에서 미생물이 비타민 B군과 비타민 K 등의 영양소를 새롭게 합성한다. 둘째, 단백질이 아미노산으로 분해되고 전분이 단당류로 변환되어 소화 흡수율이 높아진다. 셋째, 발효 식품에 포함된 유산균은 장내 유익균의 증식을 돕고 유해균의 번식을 억제하여 장 건강을 개선한다. 이른바 프로바이오틱스라 불리는 이러한 유익 미생물은 면역 기능 강화와 알레르기 증상 완화에도 기여하는 것으로 보고되고 있다. 최근에는 장내 미생물 생태계가 뇌 기능과 정신 건강에도 영향을 미친다는 연구 결과가 주목받고 있다."
    },
    {
      id: "p4",
      text: "현대에는 전통적인 자연 발효 외에도 산업적 발효 기술이 다양한 분야에 적용되고 있다. 제약 산업에서는 미생물 발효를 이용해 항생제, 인슐린 등의 의약품을 생산하며, 바이오 에너지 분야에서는 식물 원료를 발효시켜 바이오 에탄올을 만들기도 한다. 또한 발효 기술은 폐기물 처리에도 활용되어, 음식물 쓰레기를 발효시켜 퇴비나 바이오가스를 생산하는 사례가 늘고 있다. 이처럼 발효는 단순한 식품 가공 기술을 넘어 의료, 에너지, 환경 등 다양한 영역으로 확장되고 있으며, 지속 가능한 미래를 위한 핵심 기술로 자리매김하고 있다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 75 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "발효는 미생물이 유기물을 분해하여 새로운 물질을 생성하는 생화학적 과정이다." }],
      prompt: "발효의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "미생물이 유기물을 분해하여 새로운 물질을 생성하는 과정이다." },
        { id: "B", text: "식품을 높은 온도에서 가열하여 변질시키는 과정이다." },
        { id: "C", text: "화학 약품을 첨가하여 식품의 맛을 개선하는 기술이다." },
        { id: "D", text: "식품을 냉동 보관하여 유통 기한을 늘리는 방법이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "발효가 부패와 다른 점은, 발효 과정에서 생성되는 물질이 인체에 유익하고 식품의 풍미를 향상시킨다는 것이다." }],
      prompt: "발효와 부패의 차이점으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "발효는 유익한 물질을 생성하고 풍미를 높이는 반면, 부패는 유해한 변질을 일으킨다." },
        { id: "B", text: "발효와 부패는 같은 현상을 서로 다른 이름으로 부르는 것이다." },
        { id: "C", text: "발효는 고온에서, 부패는 저온에서만 일어난다." },
        { id: "D", text: "발효는 화학적 과정이고, 부패는 물리적 과정이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "발효의 정의, 관련 미생물, 발효와 부패의 차이를 설명하고 있다." },
        { id: "B", text: "김치의 제조 과정과 젖산균의 역할을 상세히 분석하고 있다." },
        { id: "C", text: "산업적 발효 기술의 활용 사례를 소개하고 있다." },
        { id: "D", text: "발효 식품의 건강 효과를 과학적으로 증명하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "발효 초기에는 류코노스톡이 먼저 번식하여 이산화탄소를 생성하는데, 이 과정에서 김치 특유의 청량한 맛이 만들어진다." }],
      prompt: "김치 발효 초기에 활동하는 미생물과 그 역할로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "류코노스톡이 이산화탄소를 생성하여 청량한 맛을 만든다." },
        { id: "B", text: "락토바실러스가 알코올을 생성하여 단맛을 만든다." },
        { id: "C", text: "효모가 아세트산을 생성하여 신맛을 만든다." },
        { id: "D", text: "초산균이 젖산을 분해하여 감칠맛을 만든다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "김치 발효의 단계별 미생물 변화와 맛의 형성 과정을 설명하고 있다." },
        { id: "B", text: "발효 식품의 건강 효과를 과학적으로 분석하고 있다." },
        { id: "C", text: "산업적 발효 기술의 미래 전망을 제시하고 있다." },
        { id: "D", text: "발효와 부패의 차이를 화학적으로 비교하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "이른바 프로바이오틱스라 불리는 이러한 유익 미생물은 면역 기능 강화와 알레르기 증상 완화에도 기여하는 것으로 보고되고 있다." }],
      prompt: "프로바이오틱스의 건강 효과로 언급된 것은?",
      choices: [
        { id: "A", text: "면역 기능 강화와 알레르기 증상 완화이다." },
        { id: "B", text: "혈당을 급격히 높이고 식욕을 증가시키는 것이다." },
        { id: "C", text: "근육량을 직접적으로 증가시키는 것이다." },
        { id: "D", text: "유해균의 번식을 촉진하여 면역력을 자극하는 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "발효 식품이 건강에 유익한 구체적 이유를 제시하고 있다." },
        { id: "B", text: "김치의 종류와 지역별 특색을 소개하고 있다." },
        { id: "C", text: "발효의 정의와 역사적 배경을 설명하고 있다." },
        { id: "D", text: "바이오 에너지 생산 기술을 상세히 묘사하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "발효 기술은 폐기물 처리에도 활용되어, 음식물 쓰레기를 발효시켜 퇴비나 바이오가스를 생산하는 사례가 늘고 있다." }],
      prompt: "발효 기술의 환경 분야 활용으로 언급된 것은?",
      choices: [
        { id: "A", text: "음식물 쓰레기를 발효시켜 퇴비나 바이오가스를 생산하는 것이다." },
        { id: "B", text: "플라스틱을 발효시켜 의약품을 만드는 것이다." },
        { id: "C", text: "해수를 발효시켜 식수를 생산하는 것이다." },
        { id: "D", text: "대기 중 이산화탄소를 발효로 제거하는 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "발효 기술이 의료·에너지·환경 등 다양한 산업 분야로 확장되고 있음을 설명한다." },
        { id: "B", text: "전통 발효 식품이 현대에 와서 사라지고 있다는 우려를 표명한다." },
        { id: "C", text: "젖산균의 생물학적 분류와 번식 조건을 상세히 서술한다." },
        { id: "D", text: "발효 식품의 영양소를 정량적으로 분석한 연구 결과를 제시한다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "발효의 핵심 주체로 언급된 미생물 세 종류는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "효모, 젖산균, 초산균")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "김치 발효 초기에 먼저 번식하는 미생물은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "류코노스톡")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "김치의 발효 속도를 조절하는 핵심 변수 두 가지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "온도와 소금 농도")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "발효 식품에 포함된 유익 미생물을 통칭하는 용어는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "프로바이오틱스")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "제약 산업에서 미생물 발효로 생산되는 의약품으로 언급된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "항생제, 인슐린")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "식물 원료를 발효시켜 만드는 바이오 에너지의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "바이오 에탄올")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "글에서 발효가 지속 가능한 미래를 위한 무엇으로 자리매김하고 있다고 하였는가?",
      answerRanges: [findRange(paragraphs, "p4", "핵심 기술")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const dayStr = "075";
  return assembleFull(75, "NONFICTION", `dr-r2-${dayStr}`, "일일 독해(러셀 2) Day 75 비문학", paragraphs, timeline, buildRecallCards(paragraphs), confirmQuestions);
}


// ═══════════════════════════════════════════════════
// 메인: 빌드 + 파일 쓰기
// ═══════════════════════════════════════════════════

function main() {
  const BASE = path.resolve(__dirname, '..');
  const batchPath = path.join(BASE, 'generated', 'daily-batch-reading-russell2.json');
  const staticDir = path.join(BASE, 'frontend', 'public', 'daily-reading', 'russell2');

  // 콘텐츠 빌드
  const builders = [
    { day: 71, subArea: "NONFICTION", build: buildDay71 },
    { day: 72, subArea: "LITERATURE", build: buildDay72 },
    { day: 73, subArea: "NONFICTION", build: buildDay73 },
    { day: 74, subArea: "LITERATURE", build: buildDay74 },
    { day: 75, subArea: "NONFICTION", build: buildDay75 },
  ];

  const contents = [];
  for (const b of builders) {
    try {
      const content = b.build();
      contents.push({ day: b.day, subArea: b.subArea, content });

      // 길이 검증
      const paras = content.payload.passage.paragraphs;
      const len = charLen(paras);
      if (len < 1150 || len > 1250) {
        console.warn(`경고: Day ${b.day} 지문 길이 ${len}자 (목표 1150~1250)`);
      }

      // 복기 카드 수 검증
      const cardCount = content.payload.recall.cards.length;
      if (cardCount !== 8) {
        console.error(`오류: Day ${b.day} 복기 카드 ${cardCount}장 (목표 8장)`);
      }

      // 확인 문항 수 검증
      const qCount = content.payload.confirm.questions.length;
      if (qCount < 5 || qCount > 8) {
        console.error(`오류: Day ${b.day} 확인 문항 ${qCount}개 (목표 5~8)`);
      }

      console.log(`Day ${b.day}: 길이=${len}자, 정독=${content.payload.intensive.timeline.length}단계, 복기=${cardCount}장, 확인=${qCount}문항`);
    } catch (err) {
      console.error(`오류 (Day ${b.day}): ${err.message}`);
      // 검증 실패 시에도 파일 생성하되 경고 출력
    }
  }

  // 배치 파일 최신 상태 읽기 후 교체
  console.log('\n배치 파일 읽기...');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  console.log(`배치 파일 items 수: ${batch.items.length}`);

  for (const { day, subArea, content } of contents) {
    const idx = day - 1; // items[70]~[74]
    const batchItem = wrapBatchItem(day, subArea, content);
    batch.items[idx] = batchItem;
    console.log(`items[${idx}] (Day ${day}) 교체 완료`);
  }

  // 배치 파일 쓰기
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
  console.log(`배치 파일 저장: ${batchPath}`);

  // static 파일 쓰기
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
  }
  for (const { day, content } of contents) {
    const fileName = String(day).padStart(3, '0') + '.json';
    const filePath = path.join(staticDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`static 파일 저장: ${filePath}`);
  }

  console.log('\n모든 작업 완료!');
}

main();
