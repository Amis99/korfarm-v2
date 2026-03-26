/**
 * 러셀2(RUSSELL_2) Day 61~65 일일독해 콘텐츠 빌더
 * - Day 61: 비문학(NONFICTION), Day 62: 문학(LITERATURE)
 * - Day 63: 비문학(NONFICTION), Day 64: 문학(LITERATURE)
 * - Day 65: 비문학(NONFICTION)
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
  return text.substring(0, maxLen) + '…';
}

function shuffleChoices(choices, answerId, seed) {
  const h = hashIdx(seed);
  const arr = [...choices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (h + i * 7) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── 콘텐츠 골격 생성 ───

function assembleFull(dayIndex, subArea, contentId, title, paragraphs, timeline, recall, confirmQuestions) {
  const subAreaKo = subArea === "LITERATURE" ? "문학" : "비문학";
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
      recall,
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
      if (r.search) return findRange(paragraphs, r.pid, r.search);
      return { paragraphId: r.pid, start: r.start, end: r.end };
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

// 복기 카드 8장 생성: 전체 텍스트를 이어 붙여 8등분
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
// Day 61 — 비문학(NONFICTION): 빛의 굴절과 무지개의 원리
// ════════════════════════════════════════════════════════════════

function buildDay61() {
  const paragraphs = [
    {
      id: "p1",
      text: "비가 갠 직후 하늘에 나타나는 무지개는 예로부터 사람들의 경탄을 자아내 왔다. 무지개가 만들어지는 원리를 이해하려면 먼저 빛의 성질을 알아야 한다. 우리가 흰색이라고 느끼는 햇빛은 사실 여러 색의 빛이 섞여 있는 것으로, 빨강·주황·노랑·초록·파랑·남색·보라 등 다양한 파장의 빛이 합쳐져 있다. 파장이 긴 빨간빛은 에너지가 낮고, 파장이 짧은 보라빛은 에너지가 높다. 이것을 처음 과학적으로 증명한 사람은 영국의 물리학자 아이작 뉴턴이다. 그는 삼각 프리즘에 햇빛을 통과시켜 빛이 여러 색으로 나뉘는 현상을 관찰하고, 이를 통해 백색광이 단일한 빛이 아님을 밝혀냈다."
    },
    {
      id: "p2",
      text: "무지개는 공기 중에 떠 있는 수많은 물방울이 프리즘 역할을 할 때 만들어진다. 물방울의 지름은 보통 0.5밀리미터에서 5밀리미터 사이이며, 크기가 클수록 선명한 무지개가 형성된다. 햇빛이 물방울에 들어가면 빛은 물방울 안쪽 면에서 굴절되고, 뒷면에서 반사된 뒤 다시 바깥으로 나오면서 한 번 더 굴절된다. 이 과정에서 각 색깔의 빛은 파장에 따라 서로 다른 각도로 꺾이기 때문에 색이 분리되어 우리 눈에 띠 모양으로 보이게 된다. 빨간빛은 약 42도, 보라빛은 약 40도의 각도로 나오므로 무지개의 바깥쪽에는 빨강이, 안쪽에는 보라색이 위치한다."
    },
    {
      id: "p3",
      text: "무지개를 보려면 관찰자는 태양을 등지고 서야 한다. 태양의 빛이 관찰자 뒤쪽에서 비추어 앞쪽에 떠 있는 물방울에 닿아야 무지개가 형성되기 때문이다. 이 조건 때문에 무지개는 항상 태양의 반대편 하늘에 나타나며, 태양의 고도가 높은 한낮에는 무지개의 호가 작아지고, 해 질 녘처럼 태양이 낮을 때에는 큰 반원을 그린다. 비행기에서 바라보면 무지개가 완전한 원 모양으로 보이기도 하는데, 이는 지평선 아래의 부분까지 관찰할 수 있기 때문이다."
    },
    {
      id: "p4",
      text: "때로는 무지개 바깥쪽에 색 순서가 반대인 두 번째 무지개가 나타나기도 하는데, 이를 부무지개라 한다. 부무지개는 빛이 물방울 내부에서 두 번 반사되어 생기며, 반사가 추가되는 만큼 빛 에너지가 줄어 본무지개보다 색이 흐리다. 본무지개와 부무지개 사이의 어두운 영역은 알렉산더의 어두운 띠라 불린다. 이처럼 무지개는 빛의 굴절·반사·분산이라는 물리적 현상이 자연 속에서 어우러져 만들어내는 스펙터클이다. 과학이 발달하기 전에는 신의 메시지나 행운의 징표로 여겨졌던 무지개가 물리학의 언어로 설명될 수 있다는 사실은, 자연 현상을 이해하려는 인간의 호기심이 얼마나 큰 성과를 거두어 왔는지를 잘 보여 준다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 61 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    // s1: 백색광의 구성
    {
      ranges: [{ pid: "p1", search: "우리가 흰색이라고 느끼는 햇빛은 사실 여러 색의 빛이 섞여 있는 것으로, 빨강·주황·노랑·초록·파랑·남색·보라 등 다양한 파장의 빛이 합쳐져 있다." }],
      prompt: "이 문장이 설명하는 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "백색광은 다양한 파장의 빛이 합쳐진 복합광이다." },
        { id: "B", text: "햇빛은 오직 흰색 파장 하나로 이루어져 있다." },
        { id: "C", text: "빨간빛과 보라빛은 같은 파장을 가진다." },
        { id: "D", text: "프리즘 없이도 빛의 색 분리를 관찰할 수 있다." }
      ],
      answerId: "A"
    },
    // s2: 뉴턴의 실험
    {
      ranges: [{ pid: "p1", search: "그는 삼각 프리즘에 햇빛을 통과시켜 빛이 여러 색으로 나뉘는 현상을 관찰하고, 이를 통해 백색광이 단일한 빛이 아님을 밝혀냈다." }],
      prompt: "뉴턴의 프리즘 실험이 증명한 것으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "백색광은 여러 색의 빛으로 구성되어 있다는 사실이다." },
        { id: "B", text: "프리즘은 빛의 속도를 높여 준다는 사실이다." },
        { id: "C", text: "빛은 진공에서만 색이 분리된다는 사실이다." },
        { id: "D", text: "프리즘은 빛을 흡수하여 열로 변환한다는 원리이다." }
      ],
      answerId: "A"
    },
    // s3: p1 중심내용
    {
      ranges: [{ pid: "p1", start: 0, end: paragraphs[0].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "백색광이 여러 색으로 구성되어 있으며, 뉴턴이 이를 실험으로 증명했다." },
        { id: "B", text: "무지개는 과학적으로 설명할 수 없는 신비로운 현상이다." },
        { id: "C", text: "뉴턴은 물방울을 이용하여 무지개를 인공적으로 만들었다." },
        { id: "D", text: "빛의 파장은 모두 동일하므로 색이 구분되지 않는다." }
      ],
      answerId: "A"
    },
    // s4: 물방울의 프리즘 역할
    {
      ranges: [{ pid: "p2", search: "햇빛이 물방울에 들어가면 빛은 물방울 안쪽 면에서 굴절되고, 뒷면에서 반사된 뒤 다시 바깥으로 나오면서 한 번 더 굴절된다." }],
      prompt: "물방울 속에서 빛이 겪는 과정으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "굴절→반사→재굴절의 순서를 거쳐 색이 분리된다." },
        { id: "B", text: "빛은 물방울을 관통하며 아무런 변화 없이 직진한다." },
        { id: "C", text: "빛이 물방울에서 흡수되어 열에너지로 전환된다." },
        { id: "D", text: "물방울 내부에서 빛의 파장이 모두 동일하게 바뀐다." }
      ],
      answerId: "A"
    },
    // s5: 색 분리 각도
    {
      ranges: [{ pid: "p2", search: "빨간빛은 약 42도, 보라빛은 약 40도의 각도로 나오므로 무지개의 바깥쪽에는 빨강이, 안쪽에는 보라색이 위치한다." }],
      prompt: "무지개 색 배치에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "빨간빛이 더 큰 각도로 꺾이므로 무지개의 바깥쪽에 위치한다." },
        { id: "B", text: "보라빛이 바깥쪽, 빨간빛이 안쪽에 위치한다." },
        { id: "C", text: "모든 색의 빛은 같은 각도로 나오므로 색의 배치가 불규칙하다." },
        { id: "D", text: "빨간빛이 파장이 짧아 안쪽에 위치한다." }
      ],
      answerId: "A"
    },
    // s6: p2 중심내용
    {
      ranges: [{ pid: "p2", start: 0, end: paragraphs[1].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "물방울 속에서 빛의 굴절과 반사가 일어나 무지개가 형성되는 원리를 설명한다." },
        { id: "B", text: "물방울의 크기에 따라 무지개의 색이 결정된다는 원리를 설명한다." },
        { id: "C", text: "무지개는 공기 중의 먼지에 의해 만들어진다는 이론을 제시한다." },
        { id: "D", text: "빛이 물방울을 통과하면 속도가 빨라져 무지개가 사라진다고 주장한다." }
      ],
      answerId: "A"
    },
    // s7: 관찰 조건
    {
      ranges: [{ pid: "p3", search: "무지개를 보려면 관찰자는 태양을 등지고 서야 한다." }],
      prompt: "무지개 관찰의 필수 조건으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "관찰자가 태양을 등지고 물방울이 있는 방향을 바라보아야 한다." },
        { id: "B", text: "관찰자가 태양을 정면으로 바라보아야 한다." },
        { id: "C", text: "비가 내리는 동안에만 관찰할 수 있다." },
        { id: "D", text: "태양의 고도가 가장 높은 정오에만 볼 수 있다." }
      ],
      answerId: "A"
    },
    // s8: p3 중심내용
    {
      ranges: [{ pid: "p3", start: 0, end: paragraphs[2].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "무지개가 관찰되기 위한 조건과 태양 고도에 따른 무지개 크기 변화를 설명한다." },
        { id: "B", text: "비행기에서만 무지개를 볼 수 있다는 사실을 강조한다." },
        { id: "C", text: "무지개는 항상 같은 크기의 반원으로 나타난다는 사실을 서술한다." },
        { id: "D", text: "태양의 위치와 무지개의 색 배열 사이의 관계를 설명한다." }
      ],
      answerId: "A"
    },
    // s9: 부무지개
    {
      ranges: [{ pid: "p4", search: "부무지개는 빛이 물방울 내부에서 두 번 반사되어 생기며, 반사가 추가되는 만큼 빛 에너지가 줄어 본무지개보다 색이 흐리다." }],
      prompt: "부무지개의 특징으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "내부에서 두 번 반사되어 생기며 본무지개보다 색이 흐리다." },
        { id: "B", text: "본무지개보다 색이 진하고 선명하게 나타난다." },
        { id: "C", text: "본무지개와 같은 색 순서로 나타난다." },
        { id: "D", text: "빛이 물방울에서 반사 없이 직진하여 만들어진다." }
      ],
      answerId: "A"
    },
    // s10: p4 중심내용
    {
      ranges: [{ pid: "p4", start: 0, end: paragraphs[3].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "부무지개의 원리를 설명하고, 무지개가 자연 속 물리 현상의 결합임을 정리한다." },
        { id: "B", text: "무지개가 신의 메시지라는 종교적 해석을 과학보다 우위에 놓는다." },
        { id: "C", text: "부무지개는 본무지개와 무관한 독립적 현상임을 강조한다." },
        { id: "D", text: "과학은 자연 현상을 설명하는 데 한계가 있다고 주장한다." }
      ],
      answerId: "A"
    }
  ]);

  const recall = buildRecallCards(paragraphs);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "백색광이 여러 색으로 구성되어 있음을 처음 증명한 과학자는 누구인가?",
      answerRanges: [findRange(paragraphs, "p1", "아이작 뉴턴")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "뉴턴이 빛의 분산 실험에 사용한 도구는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "삼각 프리즘")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "무지개에서 빨간빛이 나오는 각도는 약 몇 도인가?",
      answerRanges: [findRange(paragraphs, "p2", "약 42도")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "무지개를 보려면 관찰자는 태양을 어떻게 해야 하는가?",
      answerRanges: [findRange(paragraphs, "p3", "태양을 등지고 서야 한다")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "비행기에서 볼 수 있는 무지개의 형태는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "완전한 원 모양")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "부무지개가 본무지개보다 색이 흐린 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "반사가 추가되는 만큼 빛 에너지가 줄어")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(61, "NONFICTION", "dr-r2-061", "일일 독해(러셀 2) Day 61 비문학", paragraphs, timeline, recall, confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 62 — 문학(LITERATURE): 할아버지의 나무 (창작 수필)
// ════════════════════════════════════════════════════════════════

function buildDay62() {
  const paragraphs = [
    {
      id: "p1",
      text: "마당 한가운데 서 있는 감나무는 내가 태어나기 전부터 그 자리에 있었다. 할아버지가 결혼하던 해에 심었다는 이야기를 어머니에게 들은 것은 초등학교 때였다. 나무의 둘레는 내 두 팔을 벌려도 다 감싸지 못할 만큼 굵었고, 가지는 지붕보다 높이 뻗어 여름이면 마당 절반을 그늘로 덮어 주었다. 가을이 되면 나무에는 주먹만 한 감이 주렁주렁 달렸고, 할아버지는 긴 장대를 들고 나와 감을 따셨다. 감을 따는 동안 할아버지의 얼굴에는 늘 잔잔한 미소가 머물렀는데, 나중에 생각해 보니 그것은 단순히 열매에 대한 기쁨이 아니라 오랜 세월을 함께한 나무에 대한 애정이었다."
    },
    {
      id: "p2",
      text: "할아버지는 말씀이 적은 분이었다. 손자인 나에게도 잔소리나 훈계를 하신 적이 거의 없었다. 다만 감나무 아래 평상에 앉아 함께 하늘을 올려다보며 조용한 시간을 보내곤 하셨다. 어떤 날은 한마디도 없이 삼십 분을 앉아 있다가 할아버지가 불쑥 말씀하셨다. 나무는 자기 이야기를 하지 않는다, 하지만 나이테에 모든 것을 기록한다, 사람도 그래야 한다고. 나는 그때 그 말씀의 뜻을 잘 몰랐지만, 할아버지와 함께 앉아 있는 것만으로도 마음이 편안했다. 바람이 불면 감나무 잎이 서로 부딪혀 사각거렸고, 그 소리는 어떤 음악보다 다정했다."
    },
    {
      id: "p3",
      text: "중학교에 올라간 뒤로 나는 마당에 나가는 일이 줄었다. 공부와 학원에 쫓기다 보니 감나무를 올려다볼 여유조차 없었다. 할아버지가 편찮으시다는 소식을 듣고 병원에 달려갔을 때, 할아버지는 창밖을 가리키며 감나무가 올해도 열매를 맺었겠느냐고 물으셨다. 나는 대답을 하지 못했다. 어느새 나는 매일 마당에 서 있는 그 나무를 보지 못하는 사람이 되어 있었다. 병실에서 돌아오는 길에 나는 일부러 감나무 아래에 섰다. 나무는 변함없이 그 자리에 서서 가지 가득 감을 달고 있었고, 바람에 잎이 흔들리는 소리도 여전히 다정했다."
    },
    {
      id: "p4",
      text: "할아버지가 돌아가신 뒤 가족들은 집을 팔아야 할 상황에 놓였다. 새 주인이 나무를 베어 낼 것이라는 말에 어머니는 한동안 말을 잃으셨다. 이사를 하던 날, 나는 감나무 앞에 오래 서 있었다. 나무의 껍질 위로 세월의 주름이 깊게 파여 있었고, 뿌리는 땅속 깊이 단단히 박혀 있었다. 나는 할아버지의 말씀을 비로소 이해했다. 나무가 자기 이야기를 하지 않아도 나이테에 모든 것을 기록하듯, 할아버지도 말 대신 감나무를 통해 삶의 무게와 사랑을 전하고 계셨던 것이다. 감나무를 두고 떠나는 발걸음은 무거웠지만, 나무가 가르쳐 준 것은 이미 내 안에 뿌리내리고 있었다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 62 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    // s1: 감나무 묘사
    {
      ranges: [{ pid: "p1", search: "나무의 둘레는 내 두 팔을 벌려도 다 감싸지 못할 만큼 굵었고, 가지는 지붕보다 높이 뻗어 여름이면 마당 절반을 그늘로 덮어 주었다." }],
      prompt: "이 묘사에서 드러나는 감나무의 특징으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "오랜 세월 자라 매우 크고 굵은, 집안의 상징적 존재이다." },
        { id: "B", text: "최근에 심은 어린 묘목이라 아직 열매를 맺지 못한다." },
        { id: "C", text: "키가 작아 그늘을 만들지 못하는 관상용 나무이다." },
        { id: "D", text: "병충해로 가지가 마르고 잎이 없는 고목이다." }
      ],
      answerId: "A"
    },
    // s2: 할아버지의 미소
    {
      ranges: [{ pid: "p1", search: "나중에 생각해 보니 그것은 단순히 열매에 대한 기쁨이 아니라 오랜 세월을 함께한 나무에 대한 애정이었다." }],
      prompt: "할아버지의 미소에 담긴 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "열매 수확의 기쁨을 넘어 나무와 함께한 세월에 대한 깊은 애정이다." },
        { id: "B", text: "감을 팔아 큰 수입을 올릴 수 있다는 경제적 기대감이다." },
        { id: "C", text: "손자에게 감을 따 주려는 할아버지의 체력 자랑이다." },
        { id: "D", text: "이웃에게 감을 나누어 주어 칭찬받을 것이라는 자부심이다." }
      ],
      answerId: "A"
    },
    // s3: p1 중심내용
    {
      ranges: [{ pid: "p1", start: 0, end: paragraphs[0].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "가족사와 함께 성장해 온 감나무와 이를 아끼는 할아버지의 모습을 소개한다." },
        { id: "B", text: "감나무의 재배 방법과 감의 영양 성분을 설명한다." },
        { id: "C", text: "할아버지가 이웃과 감을 나누며 마을 공동체를 이끄는 모습이다." },
        { id: "D", text: "화자가 감나무를 싫어하게 된 계기를 서술하고 있다." }
      ],
      answerId: "A"
    },
    // s4: 할아버지의 말씀
    {
      ranges: [{ pid: "p2", search: "나무는 자기 이야기를 하지 않는다, 하지만 나이테에 모든 것을 기록한다, 사람도 그래야 한다고." }],
      prompt: "할아버지의 이 말씀이 전하는 교훈으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "말보다 삶의 행적으로 자신을 증명해야 한다는 뜻이다." },
        { id: "B", text: "나무의 나이테를 연구하는 학문의 중요성을 강조한 것이다." },
        { id: "C", text: "사람은 일기를 써서 매일의 기록을 남겨야 한다는 뜻이다." },
        { id: "D", text: "이야기를 많이 하는 사람이 성공한다는 처세술이다." }
      ],
      answerId: "A"
    },
    // s5: p2 중심내용
    {
      ranges: [{ pid: "p2", start: 0, end: paragraphs[1].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "말이 적었지만 나무를 통해 삶의 지혜를 전한 할아버지와의 교감이다." },
        { id: "B", text: "할아버지가 손자에게 엄격한 교육을 시킨 과정을 서술한다." },
        { id: "C", text: "감나무 잎의 소리가 너무 시끄러워 불편했다는 내용이다." },
        { id: "D", text: "할아버지가 음악을 좋아하여 평상에서 라디오를 들었다는 이야기이다." }
      ],
      answerId: "A"
    },
    // s6: 화자의 변화
    {
      ranges: [{ pid: "p3", search: "어느새 나는 매일 마당에 서 있는 그 나무를 보지 못하는 사람이 되어 있었다." }],
      prompt: "이 문장에서 화자가 깨달은 것으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "바쁜 생활에 쫓겨 소중한 것을 돌보지 못하게 되었다는 자각이다." },
        { id: "B", text: "감나무가 시야를 가려서 불편했다는 물리적 문제를 인식한 것이다." },
        { id: "C", text: "학업 성적이 올라 마당에 나갈 필요가 없어졌다는 만족감이다." },
        { id: "D", text: "감나무가 죽어서 볼 수 없게 되었다는 사실을 깨달은 것이다." }
      ],
      answerId: "A"
    },
    // s7: p3 중심내용
    {
      ranges: [{ pid: "p3", start: 0, end: paragraphs[2].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "성장하며 감나무와 멀어진 화자가 할아버지의 병문안을 계기로 나무의 소중함을 다시 느낀다." },
        { id: "B", text: "할아버지가 병원에서 퇴원하여 감나무 아래에서 감을 따는 장면이다." },
        { id: "C", text: "화자가 공부 대신 매일 감나무를 관찰하며 식물학을 연구한다." },
        { id: "D", text: "감나무의 열매가 올해 열리지 않아 가족이 실망하는 내용이다." }
      ],
      answerId: "A"
    },
    // s8: 나무를 두고 떠남
    {
      ranges: [{ pid: "p4", search: "감나무를 두고 떠나는 발걸음은 무거웠지만, 나무가 가르쳐 준 것은 이미 내 안에 뿌리내리고 있었다." }],
      prompt: "이 문장에 담긴 화자의 심정으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "물리적으로는 나무를 떠나지만, 나무를 통해 배운 가치는 마음속에 남아 있다." },
        { id: "B", text: "나무를 잘라 목재로 가져가고 싶다는 아쉬움이다." },
        { id: "C", text: "새 집에 감나무를 옮겨 심을 계획에 대한 기대감이다." },
        { id: "D", text: "나무에 대한 미련을 완전히 버리고 홀가분하게 떠나는 심정이다." }
      ],
      answerId: "A"
    },
    // s9: 깨달음
    {
      ranges: [{ pid: "p4", search: "할아버지도 말 대신 감나무를 통해 삶의 무게와 사랑을 전하고 계셨던 것이다." }],
      prompt: "화자가 비로소 이해한 할아버지의 의도로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "할아버지는 감나무라는 존재를 통해 말없이 삶의 가치와 사랑을 전달하고 있었다." },
        { id: "B", text: "할아버지는 감나무를 경제적 재산으로 물려주려 했다." },
        { id: "C", text: "할아버지는 감나무를 이용해 손자에게 농업 기술을 가르치려 했다." },
        { id: "D", text: "할아버지는 감나무를 싫어했지만 가족을 위해 참고 가꾼 것이다." }
      ],
      answerId: "A"
    },
    // s10: p4 중심내용
    {
      ranges: [{ pid: "p4", start: 0, end: paragraphs[3].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "집을 떠나며 화자가 할아버지의 삶과 사랑이 감나무에 담겨 있었음을 깨닫는다." },
        { id: "B", text: "새 주인이 감나무를 잘 관리하여 더 많은 열매를 수확한다." },
        { id: "C", text: "가족이 감나무를 다른 집 마당에 옮겨 심는 과정을 서술한다." },
        { id: "D", text: "화자가 감나무에 대한 기억을 의도적으로 잊으려 노력한다." }
      ],
      answerId: "A"
    }
  ]);

  const recall = buildRecallCards(paragraphs);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "감나무를 심은 시기는 언제인가?",
      answerRanges: [findRange(paragraphs, "p1", "할아버지가 결혼하던 해")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "할아버지가 감을 딸 때 사용한 도구는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "긴 장대")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "할아버지가 나무에 빗대어 사람이 기록해야 한다고 말한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "나이테")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "할아버지가 병원에서 화자에게 물은 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "감나무가 올해도 열매를 맺었겠느냐")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "집을 팔아야 하는 상황에서 어머니가 걱정한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "나무를 베어 낼 것이라는 말")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "화자가 할아버지의 말씀을 비로소 이해한 장소는 어디인가?",
      answerRanges: [findRange(paragraphs, "p4", "감나무 앞")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(62, "LITERATURE", "dr-r2-062", "일일 독해(러셀 2) Day 62 문학", paragraphs, timeline, recall, confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 63 — 비문학(NONFICTION): 인류의 시간 측정 역사
// ════════════════════════════════════════════════════════════════

function buildDay63() {
  const paragraphs = [
    {
      id: "p1",
      text: "시간을 정확히 측정하려는 노력은 인류 문명의 역사와 함께해 왔다. 고대 이집트인들은 기원전 1500년경 해시계를 만들어 태양 그림자의 위치로 시각을 알았고, 밤에는 물시계를 사용하였다. 물시계는 그릇에 작은 구멍을 뚫어 물이 일정하게 흘러나오도록 한 장치로, 물의 높이 변화로 경과 시간을 측정하는 원리이다. 한편 고대 중국에서는 향을 피워 그 연소 속도로 시간을 가늠하는 향시계를 사용하기도 하였다. 이러한 초기 시계들은 바람이나 온도 등 환경에 영향을 많이 받아 정밀도가 낮았으나, 인간이 시간을 객관적으로 파악하고자 한 최초의 시도라는 점에서 의의가 크다."
    },
    {
      id: "p2",
      text: "중세 유럽에서는 기계식 시계가 등장하여 시간 측정의 정밀도가 크게 향상되었다. 초기 기계식 시계는 추의 무게를 이용하여 톱니바퀴를 일정한 속도로 회전시키는 구조였다. 14세기에 제작된 탑시계는 교회와 도시의 중심에 설치되어 주민들에게 종소리로 시간을 알려 주었으며, 이는 예배·시장·노동 등 사회적 질서를 유지하는 데 중요한 역할을 하였다. 17세기에는 네덜란드의 과학자 크리스티안 하위헌스가 진자시계를 발명하였는데, 진자의 등시성을 이용한 이 시계는 하루 오차가 불과 수 초에 불과하여 이전 시계들에 비해 획기적으로 정확했다."
    },
    {
      id: "p3",
      text: "18세기에는 항해용 시계가 개발되면서 시간 측정이 지리적 발견에도 큰 기여를 하였다. 바다 위에서 경도를 정확히 알려면 출발지의 시간을 유지하는 정밀한 시계가 필요했기 때문이다. 당시 경도 측정의 오류로 수많은 선박이 좌초하여 막대한 인명 피해가 발생하자, 영국 의회는 경도 문제를 해결하는 사람에게 거액의 상금을 내걸었다. 영국의 시계공 존 해리슨은 바다의 흔들림에도 정확성을 유지하는 해양 크로노미터를 제작하여 경도 문제를 해결하였다. 이 발명 덕분에 항해 중 위치를 정확히 파악할 수 있게 되었고, 이는 국제 무역과 탐험의 발전에 커다란 영향을 미쳤다."
    },
    {
      id: "p4",
      text: "현대에 이르러 시간 측정의 정밀도는 상상을 초월하는 수준에 도달하였다. 1967년 국제도량형총회는 세슘 원자의 진동 주기를 기준으로 1초를 정의하였고, 이에 따라 원자시계가 시간의 표준이 되었다. 원자시계의 오차는 수천만 년에 1초 정도로, 위성 항법 시스템(GPS)이나 통신 네트워크 등 현대 기술의 근간을 이루고 있다. 최근에는 광격자 시계라는 차세대 시계가 개발되어 원자시계보다 100배 이상 정밀한 시간 측정이 가능해졌다. 해시계에서 원자시계에 이르기까지 시간 측정의 역사는 인류가 자연 현상을 관찰하고 이를 기술로 발전시켜 온 지적 여정 그 자체라 할 수 있다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 63 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    // s1: 해시계와 물시계
    {
      ranges: [{ pid: "p1", search: "고대 이집트인들은 기원전 1500년경 해시계를 만들어 태양 그림자의 위치로 시각을 알았고, 밤에는 물시계를 사용하였다." }],
      prompt: "고대 이집트의 시간 측정 방법으로 적절한 것은?",
      choices: [
        { id: "A", text: "낮에는 태양 그림자를 이용한 해시계, 밤에는 물시계를 사용하였다." },
        { id: "B", text: "향시계를 낮과 밤 모두 사용하여 시간을 측정하였다." },
        { id: "C", text: "기계식 시계를 발명하여 정밀하게 시간을 기록하였다." },
        { id: "D", text: "별의 위치만으로 시간을 측정하여 낮에는 시간을 알 수 없었다." }
      ],
      answerId: "A"
    },
    // s2: 초기 시계의 한계와 의의
    {
      ranges: [{ pid: "p1", search: "이러한 초기 시계들은 바람이나 온도 등 환경에 영향을 많이 받아 정밀도가 낮았으나, 인간이 시간을 객관적으로 파악하고자 한 최초의 시도라는 점에서 의의가 크다." }],
      prompt: "초기 시계들의 특징으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "정밀도는 낮았지만 시간을 객관적으로 측정하려는 최초의 시도로서 의의가 있다." },
        { id: "B", text: "환경의 영향을 받지 않아 매우 정확했다." },
        { id: "C", text: "현대 원자시계와 동일한 정밀도를 달성하였다." },
        { id: "D", text: "시간 측정의 필요성이 없어 실용적으로 사용되지 않았다." }
      ],
      answerId: "A"
    },
    // s3: p1 중심내용
    {
      ranges: [{ pid: "p1", start: 0, end: paragraphs[0].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "고대 문명에서 사용된 다양한 초기 시계의 원리와 의의를 소개한다." },
        { id: "B", text: "고대 이집트의 건축 기술이 시간 측정에 활용된 과정을 서술한다." },
        { id: "C", text: "향시계가 가장 정확한 시계로 평가받는 이유를 설명한다." },
        { id: "D", text: "물시계의 발명으로 해시계가 완전히 사라진 과정을 다룬다." }
      ],
      answerId: "A"
    },
    // s4: 기계식 시계
    {
      ranges: [{ pid: "p2", search: "초기 기계식 시계는 추의 무게를 이용하여 톱니바퀴를 일정한 속도로 회전시키는 구조였다." }],
      prompt: "초기 기계식 시계의 작동 원리로 적절한 것은?",
      choices: [
        { id: "A", text: "추의 무게로 톱니바퀴를 일정하게 회전시키는 방식이다." },
        { id: "B", text: "전기 에너지를 사용하여 모터를 돌리는 방식이다." },
        { id: "C", text: "물의 흐름으로 바퀴를 회전시키는 수력 방식이다." },
        { id: "D", text: "태양열을 에너지원으로 활용하는 구조이다." }
      ],
      answerId: "A"
    },
    // s5: 진자시계
    {
      ranges: [{ pid: "p2", search: "진자의 등시성을 이용한 이 시계는 하루 오차가 불과 수 초에 불과하여 이전 시계들에 비해 획기적으로 정확했다." }],
      prompt: "진자시계가 획기적이었던 이유로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "진자의 등시성 원리로 하루 오차가 수 초에 불과할 만큼 정확했다." },
        { id: "B", text: "크기가 매우 작아 휴대가 간편했기 때문이다." },
        { id: "C", text: "전기 없이도 영구적으로 작동할 수 있었기 때문이다." },
        { id: "D", text: "물시계보다 제작 비용이 저렴했기 때문이다." }
      ],
      answerId: "A"
    },
    // s6: p2 중심내용
    {
      ranges: [{ pid: "p2", start: 0, end: paragraphs[1].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "중세 기계식 시계의 등장과 진자시계의 발명으로 시간 측정이 정밀해진 과정이다." },
        { id: "B", text: "교회가 시계를 독점하여 사회적 갈등이 발생한 역사를 서술한다." },
        { id: "C", text: "네덜란드가 세계 최초로 원자시계를 개발한 과정이다." },
        { id: "D", text: "탑시계가 예술 작품으로서 가치를 인정받은 이유를 설명한다." }
      ],
      answerId: "A"
    },
    // s7: 해양 크로노미터
    {
      ranges: [{ pid: "p3", search: "영국의 시계공 존 해리슨은 바다의 흔들림에도 정확성을 유지하는 해양 크로노미터를 제작하여 경도 문제를 해결하였다." }],
      prompt: "존 해리슨의 해양 크로노미터가 해결한 문제로 적절한 것은?",
      choices: [
        { id: "A", text: "바다 위에서 경도를 정확히 파악하는 문제를 해결하였다." },
        { id: "B", text: "배의 속도를 측정하여 항해 시간을 단축하였다." },
        { id: "C", text: "날씨를 예측하여 폭풍을 피할 수 있게 하였다." },
        { id: "D", text: "바다의 수심을 측정하여 암초를 피하는 데 활용하였다." }
      ],
      answerId: "A"
    },
    // s8: p3 중심내용
    {
      ranges: [{ pid: "p3", start: 0, end: paragraphs[2].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "항해용 시계의 개발이 경도 문제를 해결하고 국제 무역과 탐험의 발전에 기여하였다." },
        { id: "B", text: "진자시계가 바다 위에서도 정확하게 작동했다는 사실을 설명한다." },
        { id: "C", text: "영국이 시간 측정 기술을 독점하여 다른 나라의 항해를 방해하였다." },
        { id: "D", text: "해양 탐험이 시간 측정의 필요성을 없앤 과정을 서술한다." }
      ],
      answerId: "A"
    },
    // s9: 원자시계
    {
      ranges: [{ pid: "p4", search: "원자시계의 오차는 수천만 년에 1초 정도로, 위성 항법 시스템(GPS)이나 통신 네트워크 등 현대 기술의 근간을 이루고 있다." }],
      prompt: "원자시계에 대한 설명으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "수천만 년에 1초의 오차로, GPS 등 현대 기술의 기반이 된다." },
        { id: "B", text: "오차가 하루 수 초로, 진자시계와 정밀도가 비슷하다." },
        { id: "C", text: "원자력 에너지로 작동하여 방사선 위험이 있다." },
        { id: "D", text: "가정용으로 널리 보급되어 모든 가정에서 사용한다." }
      ],
      answerId: "A"
    },
    // s10: p4 중심내용
    {
      ranges: [{ pid: "p4", start: 0, end: paragraphs[3].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "원자시계의 등장으로 시간 측정이 극도로 정밀해졌으며, 이는 인류의 지적 여정을 보여 준다." },
        { id: "B", text: "GPS의 작동 원리를 상세히 분석하고 있다." },
        { id: "C", text: "세슘 원자의 화학적 성질을 실험 결과와 함께 설명한다." },
        { id: "D", text: "원자시계의 발명으로 해시계와 물시계가 다시 주목받고 있다." }
      ],
      answerId: "A"
    }
  ]);

  const recall = buildRecallCards(paragraphs);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "고대 중국에서 시간을 측정하기 위해 사용한 도구는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "향시계")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "진자시계를 발명한 과학자의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "크리스티안 하위헌스")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "항해 중 경도를 알기 위해 필요한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "출발지의 시간을 유지하는 정밀한 시계")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "해양 크로노미터를 제작한 영국의 시계공은 누구인가?",
      answerRanges: [findRange(paragraphs, "p3", "존 해리슨")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "현대의 1초 정의에 사용되는 원자는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "세슘 원자")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "원자시계의 오차는 어느 정도인가?",
      answerRanges: [findRange(paragraphs, "p4", "수천만 년에 1초")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(63, "NONFICTION", "dr-r2-063", "일일 독해(러셀 2) Day 63 비문학", paragraphs, timeline, recall, confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 64 — 문학(LITERATURE): 비 오는 날의 도서관 (창작 단편)
// ════════════════════════════════════════════════════════════════

function buildDay64() {
  const paragraphs = [
    {
      id: "p1",
      text: "토요일 오후, 갑자기 쏟아진 비를 피해 나는 동네 도서관으로 뛰어 들어갔다. 우산을 가져오지 않았기에 입구에서 빗물을 털며 안으로 들어서니, 낡은 나무 바닥에서 비 냄새와 오래된 종이 냄새가 뒤섞여 올라왔다. 도서관은 평소보다 조용했다. 비 때문에 사람들이 밖에 나오지 않은 탓인지 열람실에는 나 혼자뿐이었다. 창밖으로 빗줄기가 끊임없이 내리는 것을 바라보며, 나는 서가 사이를 천천히 걸었다. 손끝으로 책등을 스치며 지나가다 한 권의 낡은 시집이 눈에 들어왔다. 표지가 바래고 모서리가 닳은 작은 책이었다."
    },
    {
      id: "p2",
      text: "시집을 펼치니 첫 페이지에 누군가가 연필로 적어 놓은 글귀가 있었다. '이 책을 읽는 당신에게, 비 오는 날에는 시를 읽으세요. 빗소리가 운율이 됩니다.' 글씨는 둥글고 정성스러웠으며, 오래전에 쓰인 것임을 한눈에 알 수 있었다. 나는 그 글귀에 이끌려 시집의 첫 시를 읽기 시작했다. 비에 관한 시였다. 시인은 빗방울이 지붕을 두드리는 소리를 세상에서 가장 정직한 박수라고 표현했고, 우산 없이 비를 맞는 사람을 하늘과 가장 가까운 사람이라고 썼다. 나는 시를 읽으며 창밖의 빗소리에 귀를 기울였고, 정말로 빗소리가 시의 운율처럼 들리기 시작했다."
    },
    {
      id: "p3",
      text: "시집을 읽다 보니 시간이 얼마나 흘렀는지 몰랐다. 한 편 한 편 넘길 때마다 시인이 포착한 일상의 순간들이 나를 사로잡았다. 버스 정류장에서 기다리는 사람의 뒷모습, 골목길에 핀 이름 모를 꽃, 늦은 밤 편의점의 형광등 불빛. 어디서나 볼 수 있는 풍경이었지만, 시인의 눈을 빌려 보니 모든 것이 특별하게 느껴졌다. 나는 문득 내가 매일 지나치는 것들 속에도 이런 아름다움이 숨어 있을지 모른다는 생각이 들었다. 평범한 것을 특별하게 바라보는 힘, 그것이 시의 본질이 아닐까."
    },
    {
      id: "p4",
      text: "비가 그쳤을 때 나는 시집을 제자리에 꽂았다. 연필 글귀를 남긴 그 사람이 누구인지 알 수 없었지만, 나에게 보낸 것 같은 그 메시지 덕분에 비 오는 오후가 특별한 시간이 되었다. 도서관을 나서니 비 갠 뒤의 공기가 맑고 싱그러웠다. 웅덩이에 비친 하늘이 푸르렀고, 나뭇잎 끝에 매달린 빗방울이 햇살을 받아 반짝였다. 나는 걸으면서 아까 읽은 시의 한 구절을 떠올렸다. 세상에서 가장 정직한 박수. 빗소리는 멈추었지만, 그 시가 내 안에 남긴 울림은 오래도록 이어질 것 같았다. 나는 다음에 비가 오면 다시 이 도서관에 와야겠다고 마음먹었다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 64 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    // s1: 도서관 분위기
    {
      ranges: [{ pid: "p1", search: "낡은 나무 바닥에서 비 냄새와 오래된 종이 냄새가 뒤섞여 올라왔다." }],
      prompt: "이 묘사가 전달하는 분위기로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "비 냄새와 종이 냄새가 어우러져 아늑하고 고즈넉한 분위기를 조성한다." },
        { id: "B", text: "낡은 바닥에서 불쾌한 냄새가 나서 화자가 불편해하고 있다." },
        { id: "C", text: "도서관이 새로 개관하여 깨끗하고 현대적인 분위기이다." },
        { id: "D", text: "비가 새어 들어와 도서관의 책이 훼손되고 있는 상황이다." }
      ],
      answerId: "A"
    },
    // s2: 낡은 시집 발견
    {
      ranges: [{ pid: "p1", search: "표지가 바래고 모서리가 닳은 작은 책이었다." }],
      prompt: "이 묘사에서 알 수 있는 시집의 특징으로 적절한 것은?",
      choices: [
        { id: "A", text: "오랜 시간 여러 사람의 손을 거친, 세월의 흔적이 묻은 책이다." },
        { id: "B", text: "최근에 출판되어 아직 아무도 읽지 않은 신간이다." },
        { id: "C", text: "고가의 한정판으로 특별 보관되어 있었다." },
        { id: "D", text: "화자가 직접 쓴 시집을 도서관에 기증한 것이다." }
      ],
      answerId: "A"
    },
    // s3: p1 중심내용
    {
      ranges: [{ pid: "p1", start: 0, end: paragraphs[0].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "비를 피해 도서관에 들어간 화자가 조용한 분위기 속에서 낡은 시집을 발견한다." },
        { id: "B", text: "화자가 비를 좋아하여 일부러 도서관 대신 비를 맞으러 나간다." },
        { id: "C", text: "도서관에 사람이 많아 자리를 찾지 못하는 화자의 모습이다." },
        { id: "D", text: "화자가 도서관에서 공부하기 위해 교과서를 찾는 장면이다." }
      ],
      answerId: "A"
    },
    // s4: 연필 글귀
    {
      ranges: [{ pid: "p2", search: "이 책을 읽는 당신에게, 비 오는 날에는 시를 읽으세요. 빗소리가 운율이 됩니다." }],
      prompt: "연필 글귀가 화자에게 준 영향으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "시를 읽으며 빗소리를 운율로 느끼게 하는 계기가 되었다." },
        { id: "B", text: "시집을 훼손한 사람에 대한 분노를 느끼게 했다." },
        { id: "C", text: "비가 올 때 도서관을 피하라는 경고로 받아들였다." },
        { id: "D", text: "시를 읽는 것보다 소설을 읽는 것이 낫다는 생각을 하게 했다." }
      ],
      answerId: "A"
    },
    // s5: 시의 표현
    {
      ranges: [{ pid: "p2", search: "시인은 빗방울이 지붕을 두드리는 소리를 세상에서 가장 정직한 박수라고 표현했고, 우산 없이 비를 맞는 사람을 하늘과 가장 가까운 사람이라고 썼다." }],
      prompt: "시인의 표현에서 드러나는 관점으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "비를 부정적으로 보지 않고, 자연과 교감하는 긍정적 시선으로 바라본다." },
        { id: "B", text: "우산이 없는 사람의 불편함을 동정하는 시선이다." },
        { id: "C", text: "비를 인공적으로 만들어야 한다는 과학적 관점이다." },
        { id: "D", text: "빗소리가 소음 공해라는 비판적 시각이다." }
      ],
      answerId: "A"
    },
    // s6: p2 중심내용
    {
      ranges: [{ pid: "p2", start: 0, end: paragraphs[1].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "시집에 남겨진 글귀에 이끌려 시를 읽으며 빗소리와 시의 운율을 연결하는 경험을 한다." },
        { id: "B", text: "화자가 시집에 자신의 글귀를 적어 넣는 과정을 서술한다." },
        { id: "C", text: "시인이 도서관을 방문하여 화자와 대화를 나누는 장면이다." },
        { id: "D", text: "화자가 시집을 읽지 않고 창밖만 바라보는 모습이다." }
      ],
      answerId: "A"
    },
    // s7: 시의 본질
    {
      ranges: [{ pid: "p3", search: "평범한 것을 특별하게 바라보는 힘, 그것이 시의 본질이 아닐까." }],
      prompt: "이 문장에서 화자가 생각하는 시의 본질로 적절한 것은?",
      choices: [
        { id: "A", text: "일상의 평범한 풍경을 특별한 시선으로 바라보게 하는 힘이다." },
        { id: "B", text: "어렵고 복잡한 언어를 사용하여 독자를 혼란에 빠뜨리는 것이다." },
        { id: "C", text: "특별한 사건만을 소재로 다루는 문학 장르이다." },
        { id: "D", text: "운율과 형식을 엄격히 지키는 것이 가장 중요하다." }
      ],
      answerId: "A"
    },
    // s8: p3 중심내용
    {
      ranges: [{ pid: "p3", start: 0, end: paragraphs[2].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "시인의 눈을 빌려 일상의 풍경이 특별하게 느껴진 화자의 깨달음이다." },
        { id: "B", text: "화자가 직접 시를 쓰기 시작하여 시인이 되는 과정이다." },
        { id: "C", text: "도서관에서 다른 독자들과 시에 대해 토론하는 장면이다." },
        { id: "D", text: "화자가 시집을 지루하게 느끼고 다른 책을 찾아 나서는 내용이다." }
      ],
      answerId: "A"
    },
    // s9: 시의 울림
    {
      ranges: [{ pid: "p4", search: "빗소리는 멈추었지만, 그 시가 내 안에 남긴 울림은 오래도록 이어질 것 같았다." }],
      prompt: "이 문장에서 '울림'이 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "시를 읽으며 느낀 감동과 깨달음이 마음속에 오래 남는다는 뜻이다." },
        { id: "B", text: "귀에서 빗소리가 계속 울려 퍼지는 이명 현상을 가리킨다." },
        { id: "C", text: "도서관 건물의 반향 효과로 소리가 오래 지속된다는 뜻이다." },
        { id: "D", text: "시집의 내용이 너무 슬퍼서 화자가 울게 되었다는 표현이다." }
      ],
      answerId: "A"
    },
    // s10: p4 중심내용
    {
      ranges: [{ pid: "p4", start: 0, end: paragraphs[3].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "비 갠 뒤 도서관을 나선 화자가 시의 감동을 간직하며 일상을 새롭게 바라본다." },
        { id: "B", text: "화자가 시집을 빌려가 집에서 다시 읽기로 결심한다." },
        { id: "C", text: "비가 다시 와서 화자가 도서관에 머물게 되는 상황이다." },
        { id: "D", text: "화자가 시집에 적힌 글귀의 주인을 찾아 나서는 내용이다." }
      ],
      answerId: "A"
    }
  ]);

  const recall = buildRecallCards(paragraphs);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "화자가 도서관에서 발견한 책은 어떤 종류의 책인가?",
      answerRanges: [findRange(paragraphs, "p1", "시집")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "시집 첫 페이지에 글귀를 적는 데 사용된 필기구는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "연필")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "시인이 빗방울이 지붕을 두드리는 소리를 무엇이라 표현했는가?",
      answerRanges: [findRange(paragraphs, "p2", "세상에서 가장 정직한 박수")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "화자가 시의 본질이라고 생각한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "평범한 것을 특별하게 바라보는 힘")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "화자가 도서관을 나선 뒤 웅덩이에 비친 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "하늘")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "화자가 다음에 비가 오면 하려고 마음먹은 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "다시 이 도서관에 와야겠다")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(64, "LITERATURE", "dr-r2-064", "일일 독해(러셀 2) Day 64 문학", paragraphs, timeline, recall, confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 65 — 비문학(NONFICTION): 발효 식품의 과학
// ════════════════════════════════════════════════════════════════

function buildDay65() {
  const paragraphs = [
    {
      id: "p1",
      text: "발효는 미생물이 유기물을 분해하여 새로운 물질을 만들어 내는 생화학적 과정이다. 인류는 수천 년 전부터 발효를 식품 보존과 가공에 활용해 왔으며, 김치·된장·요구르트·빵·치즈·식초 등 세계 각지의 전통 음식에 발효 기술이 녹아 있다. 발효의 핵심 주체는 세균·곰팡이·효모 등의 미생물로, 이들은 식품 속의 당분이나 단백질을 분해하면서 젖산·알코올·유기산 등 다양한 대사산물을 생성한다. 이러한 대사산물은 식품에 독특한 맛과 향을 부여할 뿐 아니라 유해 세균의 번식을 억제하여 자연스러운 보존 효과를 가져다준다."
    },
    {
      id: "p2",
      text: "김치의 발효 과정은 그 대표적인 예이다. 배추에 소금을 뿌려 절이면 삼투압에 의해 세포 내 수분이 빠져나오고, 이 과정에서 유해균은 억제되고 젖산균이 증식하기 시작한다. 젖산균은 배추의 당분을 분해하여 젖산을 만들어 내며, 이 젖산이 김치 특유의 새콤한 맛을 낸다. 동시에 김치의 산도가 높아지면서 다른 잡균이 살기 어려운 환경이 조성되어 장기 보존이 가능해진다. 김치는 적정 온도인 섭씨 0도에서 4도 사이에서 숙성될 때 가장 좋은 맛과 식감을 유지한다. 발효가 진행될수록 비타민 B군과 유산균의 양이 증가하여 원재료인 배추보다 영양 가치가 높아지기도 한다."
    },
    {
      id: "p3",
      text: "요구르트 역시 발효 식품의 대표 사례이다. 우유에 유산균을 접종하면 유산균이 우유 속 유당을 분해하여 젖산을 생성하고, 이에 따라 우유의 산도가 높아져 단백질인 카세인이 응고되면서 걸쭉한 질감이 만들어진다. 이 과정에서 유당이 분해되기 때문에 유당불내증이 있는 사람도 요구르트를 비교적 편하게 섭취할 수 있다. 또한 유산균은 장내 유익균의 활동을 돕고 면역력 강화에 기여하는 것으로 알려져 있어, 현대 영양학에서도 발효 유제품의 건강상 이점이 주목받고 있다."
    },
    {
      id: "p4",
      text: "발효 기술은 전통적 식품 가공을 넘어 현대 생명 공학 분야에서도 폭넓게 활용된다. 의약품 생산에서는 미생물 발효를 통해 항생제·인슐린 등을 대량으로 합성하며, 바이오 에너지 분야에서는 옥수수나 사탕수수의 식물 섬유소를 발효시켜 바이오에탄올을 생산하기도 한다. 최근에는 미생물의 유전자를 편집하여 원하는 물질을 보다 효율적으로 생산하는 합성생물학 기반의 발효 기술이 연구되고 있다. 이처럼 발효는 고대의 경험적 지혜에서 출발하여 첨단 과학 기술로 발전해 왔으며, 앞으로도 인류의 식량·건강·에너지 문제를 해결하는 핵심 기술로 자리잡을 전망이다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 65 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    // s1: 발효의 정의
    {
      ranges: [{ pid: "p1", search: "발효는 미생물이 유기물을 분해하여 새로운 물질을 만들어 내는 생화학적 과정이다." }],
      prompt: "이 문장에서 정의하는 발효의 핵심 과정으로 적절한 것은?",
      choices: [
        { id: "A", text: "미생물이 유기물을 분해하여 새로운 물질을 생성하는 것이다." },
        { id: "B", text: "화학 약품을 첨가하여 식품의 색을 변화시키는 것이다." },
        { id: "C", text: "고온에서 식품을 가열하여 살균하는 것이다." },
        { id: "D", text: "자외선을 이용하여 식품의 성분을 변화시키는 것이다." }
      ],
      answerId: "A"
    },
    // s2: 대사산물의 역할
    {
      ranges: [{ pid: "p1", search: "이러한 대사산물은 식품에 독특한 맛과 향을 부여할 뿐 아니라 유해 세균의 번식을 억제하여 자연스러운 보존 효과를 가져다준다." }],
      prompt: "발효 대사산물의 역할로 적절한 것은?",
      choices: [
        { id: "A", text: "맛과 향을 부여하고 유해 세균의 번식을 억제하여 보존 효과를 낸다." },
        { id: "B", text: "식품의 색을 변화시키는 것이 유일한 역할이다." },
        { id: "C", text: "유해 세균의 번식을 촉진하여 발효 속도를 높인다." },
        { id: "D", text: "식품의 영양 성분을 모두 파괴하여 열량을 낮춘다." }
      ],
      answerId: "A"
    },
    // s3: p1 중심내용
    {
      ranges: [{ pid: "p1", start: 0, end: paragraphs[0].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "발효의 정의와 핵심 미생물, 대사산물의 역할을 개괄적으로 소개한다." },
        { id: "B", text: "김치의 발효 과정을 단계별로 상세히 설명한다." },
        { id: "C", text: "발효 식품이 건강에 해롭다는 최근 연구 결과를 소개한다." },
        { id: "D", text: "세계 각지의 발효 음식 조리법을 비교 분석한다." }
      ],
      answerId: "A"
    },
    // s4: 김치 발효 원리
    {
      ranges: [{ pid: "p2", search: "젖산균은 배추의 당분을 분해하여 젖산을 만들어 내며, 이 젖산이 김치 특유의 새콤한 맛을 낸다." }],
      prompt: "김치의 새콤한 맛이 만들어지는 원리로 적절한 것은?",
      choices: [
        { id: "A", text: "젖산균이 당분을 분해하여 젖산을 생성하기 때문이다." },
        { id: "B", text: "소금이 배추의 성분과 반응하여 산을 만들기 때문이다." },
        { id: "C", text: "배추 자체에 포함된 산 성분이 시간이 지나면서 드러나기 때문이다." },
        { id: "D", text: "식초를 첨가하여 인위적으로 맛을 조절하기 때문이다." }
      ],
      answerId: "A"
    },
    // s5: 김치의 영양 가치
    {
      ranges: [{ pid: "p2", search: "발효가 진행될수록 비타민 B군과 유산균의 양이 증가하여 원재료인 배추보다 영양 가치가 높아지기도 한다." }],
      prompt: "김치 발효의 영양학적 효과로 적절한 것은?",
      choices: [
        { id: "A", text: "발효가 진행되면서 비타민과 유산균이 증가하여 영양 가치가 높아진다." },
        { id: "B", text: "발효가 진행되면 모든 영양소가 파괴되어 영양 가치가 떨어진다." },
        { id: "C", text: "소금의 양이 늘어나 나트륨 함량만 증가한다." },
        { id: "D", text: "발효 과정에서 배추의 섬유질이 완전히 사라진다." }
      ],
      answerId: "A"
    },
    // s6: p2 중심내용
    {
      ranges: [{ pid: "p2", start: 0, end: paragraphs[1].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "김치 발효의 과학적 원리와 보존 효과, 영양 가치 향상을 설명한다." },
        { id: "B", text: "김치의 다양한 종류와 지역별 특색을 소개한다." },
        { id: "C", text: "김치가 세계문화유산으로 등재된 과정을 서술한다." },
        { id: "D", text: "김치 발효에 필요한 재료의 가격 변동을 분석한다." }
      ],
      answerId: "A"
    },
    // s7: 요구르트와 유당불내증
    {
      ranges: [{ pid: "p3", search: "이 과정에서 유당이 분해되기 때문에 유당불내증이 있는 사람도 요구르트를 비교적 편하게 섭취할 수 있다." }],
      prompt: "유당불내증 환자가 요구르트를 섭취할 수 있는 이유로 적절한 것은?",
      choices: [
        { id: "A", text: "발효 과정에서 유산균이 유당을 분해하기 때문이다." },
        { id: "B", text: "요구르트에는 유당이 처음부터 포함되어 있지 않기 때문이다." },
        { id: "C", text: "유당불내증은 요구르트를 먹으면 자연히 치유되기 때문이다." },
        { id: "D", text: "요구르트의 고온 살균이 유당을 증발시키기 때문이다." }
      ],
      answerId: "A"
    },
    // s8: p3 중심내용
    {
      ranges: [{ pid: "p3", start: 0, end: paragraphs[2].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "요구르트의 발효 원리와 유당불내증 환자에게의 이점, 건강상 효능을 설명한다." },
        { id: "B", text: "우유와 요구르트의 가격 차이를 경제학적으로 분석한다." },
        { id: "C", text: "요구르트의 다양한 맛과 종류를 소개한다." },
        { id: "D", text: "유산균이 유해하다는 최근 연구 결과를 제시한다." }
      ],
      answerId: "A"
    },
    // s9: 현대 응용
    {
      ranges: [{ pid: "p4", search: "의약품 생산에서는 미생물 발효를 통해 항생제·인슐린 등을 대량으로 합성하며, 바이오 에너지 분야에서는 옥수수나 사탕수수의 식물 섬유소를 발효시켜 바이오에탄올을 생산하기도 한다." }],
      prompt: "현대에 발효 기술이 활용되는 분야로 적절한 것은?",
      choices: [
        { id: "A", text: "의약품 합성과 바이오 에너지 생산에 활용된다." },
        { id: "B", text: "전통 식품 가공에만 한정적으로 사용된다." },
        { id: "C", text: "건축 자재를 생산하는 데 주로 활용된다." },
        { id: "D", text: "섬유 의류를 제조하는 핵심 기술로 사용된다." }
      ],
      answerId: "A"
    },
    // s10: p4 중심내용
    {
      ranges: [{ pid: "p4", start: 0, end: paragraphs[3].text.length }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "발효 기술이 전통 식품을 넘어 의약·에너지·합성생물학으로 확장되고 있음을 설명한다." },
        { id: "B", text: "합성생물학이 발효 기술을 대체하여 더 이상 발효가 필요 없음을 주장한다." },
        { id: "C", text: "바이오에탄올이 석유보다 저렴하다는 경제적 분석을 제시한다." },
        { id: "D", text: "유전자 편집 기술의 윤리적 문제만을 집중적으로 다루고 있다." }
      ],
      answerId: "A"
    }
  ]);

  const recall = buildRecallCards(paragraphs);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "발효의 핵심 주체가 되는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "세균·곰팡이·효모 등의 미생물")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "배추를 소금에 절이면 어떤 현상에 의해 수분이 빠져나오는가?",
      answerRanges: [findRange(paragraphs, "p2", "삼투압")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "김치의 새콤한 맛을 만들어 내는 물질은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "젖산")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "요구르트 발효 과정에서 단백질이 응고되는 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "산도가 높아져")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "바이오 에너지 분야에서 발효를 통해 생산하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "바이오에탄올")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "미생물의 유전자를 편집하여 물질을 생산하는 기술은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "합성생물학")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(65, "NONFICTION", "dr-r2-065", "일일 독해(러셀 2) Day 65 비문학", paragraphs, timeline, recall, confirmQuestions);
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
    { day: 61, subArea: "NONFICTION", build: buildDay61 },
    { day: 62, subArea: "LITERATURE", build: buildDay62 },
    { day: 63, subArea: "NONFICTION", build: buildDay63 },
    { day: 64, subArea: "LITERATURE", build: buildDay64 },
    { day: 65, subArea: "NONFICTION", build: buildDay65 },
  ];

  const contents = [];
  let hasWarning = false;

  for (const b of builders) {
    try {
      const content = b.build();
      contents.push({ day: b.day, subArea: b.subArea, content });

      // 길이 검증
      const paras = content.payload.passage.paragraphs;
      const len = charLen(paras);
      if (len < 1150 || len > 1250) {
        console.warn(`⚠ 경고: Day ${b.day} 지문 길이 ${len}자 (목표 1150~1250)`);
        hasWarning = true;
      }

      // 복기 카드 수 검증
      const cardCount = content.payload.recall.cards.length;
      if (cardCount !== 8) {
        console.warn(`⚠ 경고: Day ${b.day} 복기 카드 ${cardCount}장 (목표 8장)`);
        hasWarning = true;
      }

      // 확인 문항 수 검증
      const qCount = content.payload.confirm.questions.length;
      if (qCount < 5 || qCount > 8) {
        console.warn(`⚠ 경고: Day ${b.day} 확인 문항 ${qCount}개 (목표 5~8)`);
        hasWarning = true;
      }

      console.log(`Day ${b.day}: 길이=${len}자, 정독=${content.payload.intensive.timeline.length}단계, 복기=${cardCount}장, 확인=${qCount}문항`);
    } catch (e) {
      console.error(`오류 (Day ${b.day}): ${e.message}`);
      hasWarning = true;
    }
  }

  if (contents.length === 0) {
    console.error('콘텐츠 빌드 실패: 생성된 콘텐츠가 없습니다.');
    process.exit(1);
  }

  // 배치 파일 최신 상태 읽기 후 교체
  console.log('\n배치 파일 읽기...');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  console.log(`배치 파일 items 수: ${batch.items.length}`);

  for (const { day, subArea, content } of contents) {
    const idx = day - 1; // items[60]~[64]
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

  if (hasWarning) {
    console.log('\n⚠ 일부 경고가 있었지만 파일은 생성되었습니다.');
  } else {
    console.log('\n모든 작업 완료!');
  }
}

main();
