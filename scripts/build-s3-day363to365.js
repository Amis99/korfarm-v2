#!/usr/bin/env node
// 소쉬르3 Day 363~365 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION (비문학), 짝수 Day = LITERATURE (문학)
// 목표 글자수: 700±50자 (650~750), 초등 5학년 수준

const fs = require('fs');
const path = require('path');

// ─── 유틸리티 함수 ───

function findSentences(text) {
  const sentences = []; let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1; while (next < text.length && (text[next] === ' ' || text[next] === '\n')) next++; start = next;
    }
  }
  if (start < text.length) sentences.push({ start, end: text.length, text: text.substring(start) });
  return sentences;
}

function findRange(paragraphs, pid, searchText) {
  const para = paragraphs.find(p => p.id === pid);
  if (!para) throw new Error(`문단 ${pid} 없음`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText.substring(0, 30)}..." ${pid}에서 찾을 수 없음`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charLen(paragraphs) { return paragraphs.reduce((sum, p) => sum + p.text.length, 0); }

function buildTimeline(paragraphs) {
  let stepNum = 0; const timeline = [];
  paragraphs.forEach((para) => {
    const sents = findSentences(para.text);
    sents.forEach((sent) => { stepNum++; timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] } }); });
    stepNum++; timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] } });
  });
  return timeline;
}

function buildRecallCards(paragraphs) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length; const chunkSize = Math.ceil(totalLen / 8); const cards = [];
  for (let i = 0; i < 8; i++) { const s = i * chunkSize; const e = Math.min(s + chunkSize, totalLen); cards.push({ id: `c${i+1}`, text: fullText.substring(s, e) }); }
  return cards;
}

function makeConfirmQ(id, prompt, ranges) {
  return { id, prompt, answerRanges: ranges, scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: "ANY" };
}

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs); const cards = buildRecallCards(paragraphs);
  const nn = String(dayIndex).padStart(3, '0');
  return { contentId: `dr-s3-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(소쉬르 3) Day ${dayIndex} ${subAreaKo}`, description: "일일 독해 - 정독·복기·확인",
    targetLevel: "SAUSSURE_3", schoolGradeRange: { min: 5, max: 5 }, area: "READING", subArea,
    competencies: ["READING"], tags: ["daily"], access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 }, timeLimitSec: 480, assets: {},
    payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 }, confirm: { questions: confirmQuestions } }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return { content_type: "DAILY_READING", level_id: "SAUSSURE_3", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// ─── Day 363: 비문학 (NONFICTION) — 재활용과 분리수거의 중요성 ───
function buildDay363() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리가 매일 버리는 쓰레기는 어디로 갈까요? 쓰레기를 그냥 땅에 묻으면 환경이 오염되고, 태우면 나쁜 연기가 나옵니다. 그래서 다시 쓸 수 있는 것을 골라내는 일이 매우 중요합니다. 이것을 분리수거라고 합니다. 분리수거란 종이, 플라스틱, 유리, 캔 같은 재료를 종류별로 나누어 버리는 것입니다. 이렇게 나눠서 버린 물건은 공장에서 새 물건으로 다시 만들어집니다. 예를 들어 다 쓴 종이는 새 종이로, 빈 페트병은 옷의 재료로 다시 태어날 수 있습니다."
    },
    {
      id: "p2",
      text: "분리수거를 잘하면 좋은 점이 많습니다. 먼저, 자연에서 새로운 재료를 덜 꺼내도 되기 때문에 산과 바다를 보호할 수 있습니다. 나무를 덜 베어도 되니 숲이 더 건강해지고, 석유를 덜 쓰니 공기도 깨끗해집니다. 또한 쓰레기 매립지에 묻는 양이 줄어들어 땅도 덜 오염됩니다. 무엇보다 재활용은 에너지를 아끼는 데 큰 도움이 됩니다. 새 물건을 처음부터 만드는 것보다 재활용하는 것이 에너지를 훨씬 적게 사용하기 때문입니다."
    },
    {
      id: "p3",
      text: "분리수거를 잘하려면 몇 가지 습관이 필요합니다. 첫째, 음식물이 묻은 용기는 깨끗이 헹궈서 버려야 합니다. 더러운 상태로 버리면 재활용이 어렵기 때문입니다. 둘째, 종이와 비닐은 섞지 말고 따로 모아야 합니다. 셋째, 페트병은 라벨을 떼고 납작하게 눌러서 버리는 것이 좋습니다. 이런 작은 실천이 모이면 큰 변화를 만들어 냅니다. 재활용은 어른만 하는 일이 아닙니다. 어린이도 집에서 분리수거를 도우면 지구를 지키는 멋진 일에 참여할 수 있습니다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "분리수거란 무엇을 말하나요?",
      [findRange(paragraphs, "p1", "종이, 플라스틱, 유리, 캔 같은 재료를 종류별로 나누어 버리는 것입니다")]),
    makeConfirmQ("q2", "다 쓴 종이와 빈 페트병은 각각 무엇으로 다시 만들어지나요?",
      [findRange(paragraphs, "p1", "다 쓴 종이는 새 종이로, 빈 페트병은 옷의 재료로 다시 태어날 수 있습니다")]),
    makeConfirmQ("q3", "분리수거를 하면 숲이 건강해지는 이유는 무엇인가요?",
      [findRange(paragraphs, "p2", "나무를 덜 베어도 되니 숲이 더 건강해지고")]),
    makeConfirmQ("q4", "재활용이 에너지를 아끼는 데 도움이 되는 이유는 무엇인가요?",
      [findRange(paragraphs, "p2", "새 물건을 처음부터 만드는 것보다 재활용하는 것이 에너지를 훨씬 적게 사용하기 때문입니다")]),
    makeConfirmQ("q5", "음식물이 묻은 용기는 어떻게 해야 하나요?",
      [findRange(paragraphs, "p3", "음식물이 묻은 용기는 깨끗이 헹궈서 버려야 합니다")]),
    makeConfirmQ("q6", "페트병을 버릴 때 올바른 방법은 무엇인가요?",
      [findRange(paragraphs, "p3", "페트병은 라벨을 떼고 납작하게 눌러서 버리는 것이 좋습니다")])
  ];

  const content = assembleFull(363, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 364: 문학 (LITERATURE) — 창작 단편: 마지막 수업 시간 ───
function buildDay364() {
  const paragraphs = [
    {
      id: "p1",
      text: "종업식 전날, 교실에는 묘한 분위기가 감돌았습니다. 담임 선생님이 칠판에 큰 글씨로 '마지막 수업'이라고 쓰셨기 때문입니다. 지호는 괜히 가슴이 뭉클해졌습니다. 선생님은 엄격하셨지만, 힘들 때마다 조용히 다가와 등을 토닥여 주셨습니다. 수학을 어려워하던 지호에게 쉬는 시간마다 문제를 풀어 주시던 모습이 떠올랐습니다. 선생님이 말씀하셨습니다. 여러분과 보낸 일 년이 선생님에게도 가장 소중한 시간이었습니다. 교실이 조용해졌고, 몇몇 아이들이 고개를 숙였습니다."
    },
    {
      id: "p2",
      text: "선생님은 한 사람씩 이름을 부르며 편지를 나눠 주셨습니다. 지호는 떨리는 손으로 편지를 펼쳤습니다. 거기에는 이렇게 적혀 있었습니다. 지호야, 네가 수학 문제를 풀고 환하게 웃던 날을 잊지 못할 거야. 포기하지 않는 네가 정말 멋졌어. 지호는 눈물이 핑 돌았습니다. 옆자리의 민서도 편지를 읽다가 코를 훌쩍였습니다. 교실 곳곳에서 작은 울음소리가 들렸습니다. 한 해 동안 당연하다고 느꼈던 선생님의 관심이 얼마나 따뜻한 것이었는지 그제야 알게 되었습니다."
    },
    {
      id: "p3",
      text: "수업이 끝나고 아이들은 하나둘 교실을 나섰습니다. 지호는 문 앞에서 잠시 멈춰 섰습니다. 돌아보니 선생님이 빈 교실에 앉아 창밖을 바라보고 계셨습니다. 지호는 다시 교실로 들어가 선생님 앞에 섰습니다. 선생님, 감사합니다. 내년에도 가끔 놀러 올게요. 선생님은 환하게 웃으며 고개를 끄덕이셨습니다. 지호는 교문을 나서며 하늘을 올려다보았습니다. 봄바람이 살랑살랑 불어왔고, 지호의 마음속에는 따뜻한 기억이 가득 차올랐습니다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "교실에 묘한 분위기가 감돈 이유는 무엇인가요?",
      [findRange(paragraphs, "p1", "담임 선생님이 칠판에 큰 글씨로 '마지막 수업'이라고 쓰셨기 때문입니다")]),
    makeConfirmQ("q2", "선생님은 수학을 어려워하던 지호에게 어떻게 도움을 주셨나요?",
      [findRange(paragraphs, "p1", "수학을 어려워하던 지호에게 쉬는 시간마다 문제를 풀어 주시던 모습이 떠올랐습니다")]),
    makeConfirmQ("q3", "선생님이 지호에게 쓴 편지에는 어떤 내용이 담겨 있었나요?",
      [findRange(paragraphs, "p2", "지호야, 네가 수학 문제를 풀고 환하게 웃던 날을 잊지 못할 거야. 포기하지 않는 네가 정말 멋졌어.")]),
    makeConfirmQ("q4", "아이들이 편지를 읽고 알게 된 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "한 해 동안 당연하다고 느꼈던 선생님의 관심이 얼마나 따뜻한 것이었는지 그제야 알게 되었습니다")]),
    makeConfirmQ("q5", "지호가 교실로 다시 들어간 이유는 무엇인가요?",
      [findRange(paragraphs, "p3", "선생님, 감사합니다. 내년에도 가끔 놀러 올게요.")]),
    makeConfirmQ("q6", "이야기의 마지막 장면에서 지호의 마음은 어떠했나요?",
      [findRange(paragraphs, "p3", "지호의 마음속에는 따뜻한 기억이 가득 차올랐습니다")])
  ];

  const content = assembleFull(364, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 365: 비문학 (NONFICTION) — 책 읽기의 즐거움과 습관 ───
function buildDay365() {
  const paragraphs = [
    {
      id: "p1",
      text: "책 읽기는 우리에게 많은 즐거움을 줍니다. 책을 읽으면 가보지 못한 나라를 여행하는 기분을 느낄 수 있고, 만나 본 적 없는 사람의 이야기를 들을 수도 있습니다. 모험 이야기를 읽을 때면 주인공과 함께 달리는 것 같은 두근거림을 느끼게 됩니다. 과학책을 읽으면 우주와 자연의 비밀을 하나씩 알아가는 재미가 있습니다. 이처럼 책은 우리의 상상력을 키워 주고 새로운 세상을 보여 주는 창문과 같습니다."
    },
    {
      id: "p2",
      text: "책 읽기는 즐거울 뿐만 아니라 여러 능력도 길러 줍니다. 책을 많이 읽으면 어휘력이 늘어나서 자기 생각을 더 잘 표현할 수 있게 됩니다. 또한 긴 글을 끝까지 읽는 습관이 생기면 집중력도 좋아집니다. 다양한 이야기를 읽다 보면 다른 사람의 마음을 이해하는 힘도 자라납니다. 슬픈 이야기에서 눈물을 흘리고, 재미있는 이야기에서 함께 웃으면서 우리는 자연스럽게 공감하는 능력을 배우게 됩니다. 이런 능력들은 학교 공부뿐만 아니라 친구 관계에서도 큰 도움이 됩니다."
    },
    {
      id: "p3",
      text: "좋은 독서 습관을 들이려면 어떻게 해야 할까요? 먼저, 매일 정해진 시간에 책을 읽는 것이 좋습니다. 자기 전 이십 분이나 아침 식사 후 십 분처럼 짧은 시간이라도 꾸준히 읽는 것이 중요합니다. 둘째, 자기가 좋아하는 책부터 시작하면 됩니다. 억지로 어려운 책을 읽기보다는 재미있는 책을 골라 읽는 것이 독서의 첫걸음입니다. 셋째, 읽은 책에 대해 가족이나 친구와 이야기를 나누면 더 오래 기억에 남습니다. 작은 습관부터 시작하면 어느새 책 읽기가 가장 즐거운 취미가 될 것입니다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "책은 우리에게 어떤 역할을 하나요?",
      [findRange(paragraphs, "p1", "책은 우리의 상상력을 키워 주고 새로운 세상을 보여 주는 창문과 같습니다")]),
    makeConfirmQ("q2", "책을 많이 읽으면 자기 생각을 더 잘 표현할 수 있는 이유는 무엇인가요?",
      [findRange(paragraphs, "p2", "책을 많이 읽으면 어휘력이 늘어나서 자기 생각을 더 잘 표현할 수 있게 됩니다")]),
    makeConfirmQ("q3", "다양한 이야기를 읽으면 자라나는 능력은 무엇인가요?",
      [findRange(paragraphs, "p2", "다른 사람의 마음을 이해하는 힘도 자라납니다")]),
    makeConfirmQ("q4", "공감하는 능력을 배우게 되는 과정은 어떤 것인가요?",
      [findRange(paragraphs, "p2", "슬픈 이야기에서 눈물을 흘리고, 재미있는 이야기에서 함께 웃으면서 우리는 자연스럽게 공감하는 능력을 배우게 됩니다")]),
    makeConfirmQ("q5", "독서의 첫걸음으로 어떤 책을 고르는 것이 좋은가요?",
      [findRange(paragraphs, "p3", "억지로 어려운 책을 읽기보다는 재미있는 책을 골라 읽는 것이 독서의 첫걸음입니다")]),
    makeConfirmQ("q6", "읽은 책을 더 오래 기억하려면 어떻게 하면 좋은가요?",
      [findRange(paragraphs, "p3", "읽은 책에 대해 가족이나 친구와 이야기를 나누면 더 오래 기억에 남습니다")])
  ];

  const content = assembleFull(365, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── 메인 실행 ───

const results = [
  { dayIndex: 363, ...buildDay363() },
  { dayIndex: 364, ...buildDay364() },
  { dayIndex: 365, ...buildDay365() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

const batchDir = path.join(__dirname, '..', 'generated', 'new');
fs.writeFileSync(
  path.join(batchDir, 'batch-s3-363-365.json'),
  JSON.stringify(batchItems, null, 2), 'utf8'
);
console.log(`  ✅ 배치 파일: generated/new/batch-s3-363-365.json`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
