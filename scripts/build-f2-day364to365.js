#!/usr/bin/env node
// 프레게2 Day 364~365 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE, 홀수 Day = NONFICTION
// 목표 글자수: 900±50 (850~950자)

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
  return { contentId: `dr-f2-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(프레게 2) Day ${dayIndex} ${subAreaKo}`, description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_2", schoolGradeRange: { min: 6, max: 6 }, area: "READING", subArea,
    competencies: ["READING"], tags: ["daily"], access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 }, timeLimitSec: 480, assets: {},
    payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 }, confirm: { questions: confirmQuestions } }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return { content_type: "DAILY_READING", level_id: "FREGE_2", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// ─── Day 364: 짝수 → 문학 (LITERATURE) — 창작 단편: 졸업식 날 ───
function buildDay364() {
  const paragraphs = [
    { id: "p1", text: "졸업식 아침, 수빈이는 교복 단추를 채우다가 손이 떨리는 것을 느꼈다. 거울 속의 자신은 삼 년 전 입학식 날과 같은 교복을 입고 있었지만, 얼굴은 확연히 달라져 있었다. 볼이 홀쭉해지고 턱선이 뚜렷해졌으며, 무엇보다 눈빛이 달랐다. 입학식 때는 설렘과 두려움이 반반이던 눈이 이제는 아쉬움과 기대가 뒤섞인 복잡한 빛을 띠고 있었다. 엄마가 현관에서 카메라를 들고 기다리셨지만, 수빈이는 사진을 찍을 마음이 나지 않았다." },
    { id: "p2", text: "학교에 도착하니 운동장에는 이미 하얀 의자가 가지런히 놓여 있었다. 친구들이 삼삼오오 모여 사진을 찍고 있었고, 누군가는 벌써 눈물을 흘리고 있었다. 수빈이는 교실로 올라갔다. 삼 년 동안 앉았던 책상 위에 낙서가 빼곡했다. 일 학년 때 짝꿍이었던 민호가 새겨 놓은 별 모양, 이 학년 때 시험 전날 외운 영어 단어들, 삼 학년 때 친구가 써 준 응원 문구까지. 책상 하나가 삼 년의 시간을 고스란히 품고 있었다." },
    { id: "p3", text: "졸업장을 받고 교실로 돌아왔을 때, 담임 선생님이 편지 한 장씩을 나눠 주셨다. 입학 첫날 선생님이 아이들에게 '삼 년 뒤의 나에게'라는 제목으로 쓰게 했던 편지였다. 수빈이는 자신의 편지를 펼쳤다. 삐뚤빼뚤한 글씨로 적혀 있었다. '중학교 졸업할 때쯤이면 키가 많이 컸을까. 친구가 많아졌을까. 수학을 잘하게 됐을까.' 소박한 질문들이 적혀 있었고, 마지막 줄에는 '힘들어도 포기하지 마'라고 써 있었다." },
    { id: "p4", text: "수빈이는 편지를 접어 주머니에 넣고 교실을 나섰다. 복도 끝 창문으로 운동장이 보였다. 의자는 이미 치워지고 있었고, 현수막도 내려지는 중이었다. 모든 것이 빠르게 정리되고 있었지만, 삼 년의 기억은 쉽게 정리되지 않았다. 교문을 나서며 수빈이는 한 번 뒤를 돌아보았다. 학교 건물은 늘 보던 그대로였지만 어딘가 낯설게 느껴졌다. 이제 이곳은 돌아갈 수 없는 장소가 되었다는 것을 수빈이는 알고 있었다." }
  ];
  console.log(`Day 364 글자수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("cq1", "졸업식 아침 거울 속 수빈이의 눈빛은 어떻게 변했나요?", [findRange(paragraphs, "p1", "아쉬움과 기대가 뒤섞인 복잡한 빛을 띠고 있었다")]),
    makeConfirmQ("cq2", "수빈이의 책상 위에는 어떤 흔적들이 남아 있었나요?", [findRange(paragraphs, "p2", "일 학년 때 짝꿍이었던 민호가 새겨 놓은 별 모양, 이 학년 때 시험 전날 외운 영어 단어들, 삼 학년 때 친구가 써 준 응원 문구까지")]),
    makeConfirmQ("cq3", "담임 선생님이 나눠 준 편지는 언제 쓴 것이었나요?", [findRange(paragraphs, "p3", "입학 첫날 선생님이 아이들에게 '삼 년 뒤의 나에게'라는 제목으로 쓰게 했던 편지였다")]),
    makeConfirmQ("cq4", "수빈이가 삼 년 전 자신에게 쓴 편지의 마지막 줄에는 무엇이 적혀 있었나요?", [findRange(paragraphs, "p3", "힘들어도 포기하지 마")]),
    makeConfirmQ("cq5", "졸업식 후 운동장의 모습은 어떠했나요?", [findRange(paragraphs, "p4", "의자는 이미 치워지고 있었고, 현수막도 내려지는 중이었다")]),
    makeConfirmQ("cq6", "교문을 나서며 수빈이가 깨달은 것은 무엇이었나요?", [findRange(paragraphs, "p4", "이제 이곳은 돌아갈 수 없는 장소가 되었다는 것을 수빈이는 알고 있었다")])
  ];
  const content = assembleFull(364, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 365: 홀수 → 비문학 (NONFICTION) — 독서의 가치와 방법 ───
function buildDay365() {
  const paragraphs = [
    { id: "p1", text: "독서는 단순히 글자를 읽는 행위가 아니라 사고를 확장하는 과정이다. 책을 읽을 때 우리의 뇌는 문자를 해독하는 동시에 배경지식을 떠올리고, 내용을 예측하며, 등장인물의 감정에 공감하는 등 복잡한 인지 활동을 수행한다. 연구에 따르면 꾸준히 독서하는 사람은 그렇지 않은 사람에 비해 어휘력이 풍부하고 논리적 사고력이 높으며, 타인의 감정을 이해하는 공감 능력도 뛰어나다. 독서가 학업 성취뿐 아니라 사회적 관계에도 긍정적인 영향을 미치는 이유가 바로 여기에 있다." },
    { id: "p2", text: "효과적인 독서를 위해서는 읽기 전, 중, 후의 단계별 전략이 중요하다. 읽기 전에는 제목과 목차를 훑어보며 내용을 미리 추측해 보는 것이 좋다. 이 과정에서 뇌가 관련 배경지식을 활성화하여 본문 이해를 돕는다. 읽는 중에는 핵심 내용에 밑줄을 긋거나 여백에 자신의 생각을 메모하는 능동적 읽기가 효과적이다. 단순히 눈으로 글자를 훑는 수동적 읽기에 비해 정보의 기억과 이해가 훨씬 오래 지속된다." },
    { id: "p3", text: "읽기 후에는 내용을 요약하거나 다른 사람에게 설명해 보는 것이 기억 정착에 도움이 된다. 읽은 내용을 자신의 말로 바꾸어 표현하면 피상적으로 이해한 부분과 깊이 이해한 부분이 구분되기 때문이다. 또한 같은 주제의 다른 책을 비교하며 읽는 비교 독서는 하나의 관점에 치우치지 않고 균형 잡힌 시각을 기르는 데 효과적이다. 이러한 방법들을 습관화하면 독서의 질이 크게 높아진다." },
    { id: "p4", text: "독서 습관을 들이기 위해서는 처음부터 두꺼운 책을 선택하기보다 자신이 흥미를 느끼는 분야의 짧은 글부터 시작하는 것이 바람직하다. 하루에 십 분이라도 규칙적으로 읽는 것이 가끔 몇 시간씩 몰아 읽는 것보다 효과가 크다. 읽는 시간과 장소를 정해 두면 독서가 일상의 일부로 자리 잡기 쉬워진다. 독서는 가장 적은 비용으로 가장 넓은 세계를 경험하게 해 주는 활동이며, 꾸준한 독서야말로 평생 학습의 가장 든든한 토대가 된다." }
  ];
  console.log(`Day 365 글자수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("cq1", "독서할 때 뇌가 수행하는 복잡한 인지 활동에는 어떤 것들이 있나요?", [findRange(paragraphs, "p1", "문자를 해독하는 동시에 배경지식을 떠올리고, 내용을 예측하며, 등장인물의 감정에 공감하는 등 복잡한 인지 활동을 수행한다")]),
    makeConfirmQ("cq2", "꾸준히 독서하는 사람이 갖게 되는 능력에는 어떤 것들이 있나요?", [findRange(paragraphs, "p1", "어휘력이 풍부하고 논리적 사고력이 높으며, 타인의 감정을 이해하는 공감 능력도 뛰어나다")]),
    makeConfirmQ("cq3", "읽기 전에 제목과 목차를 훑어보는 것이 도움이 되는 이유는 무엇인가요?", [findRange(paragraphs, "p2", "뇌가 관련 배경지식을 활성화하여 본문 이해를 돕는다")]),
    makeConfirmQ("cq4", "읽는 중에 효과적인 읽기 방법은 무엇인가요?", [findRange(paragraphs, "p2", "핵심 내용에 밑줄을 긋거나 여백에 자신의 생각을 메모하는 능동적 읽기가 효과적이다")]),
    makeConfirmQ("cq5", "읽기 후 내용을 자신의 말로 바꾸어 표현하면 좋은 이유는 무엇인가요?", [findRange(paragraphs, "p3", "피상적으로 이해한 부분과 깊이 이해한 부분이 구분되기 때문이다")]),
    makeConfirmQ("cq6", "비교 독서의 효과는 무엇인가요?", [findRange(paragraphs, "p3", "하나의 관점에 치우치지 않고 균형 잡힌 시각을 기르는 데 효과적이다")]),
    makeConfirmQ("cq7", "독서 습관을 들이기 위해 효과적인 방법은 무엇인가요?", [findRange(paragraphs, "p4", "하루에 십 분이라도 규칙적으로 읽는 것이 가끔 몇 시간씩 몰아 읽는 것보다 효과가 크다")])
  ];
  const content = assembleFull(365, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── 실행 ───
const results = [
  { dayIndex: 364, ...buildDay364() },
  { dayIndex: 365, ...buildDay365() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
if (!fs.existsSync(staticDir)) fs.mkdirSync(staticDir, { recursive: true });

const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

const newDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
fs.writeFileSync(path.join(newDir, 'batch-f2-364-365.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ 배치 파일: generated/new/batch-f2-364-365.json`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
