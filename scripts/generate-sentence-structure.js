/**
 * 문장의 짜임 콘텐츠 생성
 * 기초 10개 + 심화 5개 (각 5문장)
 */
const fs = require("fs");
const path = require("path");

// ─── 기초 문장 (레이어 1~2) ───
const BASIC = [
  // 홑문장 (레이어 1만)
  { id: "s1", text: "꽃이 핀다.",
    boxes: [
      { id: "b1", text: "꽃이", role: "주어", layer: 1 },
      { id: "b2", text: "핀다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b2", "b1"], clauses: [], linkedSentence: null },
  { id: "s2", text: "아이가 밥을 먹는다.",
    boxes: [
      { id: "b1", text: "아이가", role: "주어", layer: 1 },
      { id: "b2", text: "밥을", role: "목적어", layer: 1 },
      { id: "b3", text: "먹는다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b3", "b1", "b2"], clauses: [], linkedSentence: null },
  { id: "s3", text: "하늘이 매우 높다.",
    boxes: [
      { id: "b1", text: "하늘이", role: "주어", layer: 1 },
      { id: "b2", text: "매우", role: "부사어", layer: 1 },
      { id: "b3", text: "높다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b3", "b1", "b2"], clauses: [], linkedSentence: null },
  { id: "s4", text: "어머니께서 시장에 가셨다.",
    boxes: [
      { id: "b1", text: "어머니께서", role: "주어", layer: 1 },
      { id: "b2", text: "시장에", role: "부사어", layer: 1 },
      { id: "b3", text: "가셨다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b3", "b1", "b2"], clauses: [], linkedSentence: null },
  { id: "s5", text: "그 사람이 의사가 되었다.",
    boxes: [
      { id: "b1", text: "그", role: "관형어", layer: 1 },
      { id: "b2", text: "사람이", role: "주어", layer: 1 },
      { id: "b3", text: "의사가", role: "보어", layer: 1 },
      { id: "b4", text: "되었다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b4", "b2", "b3", "b1"], clauses: [], linkedSentence: null },
  // 겹문장 (레이어 2)
  { id: "s6", text: "그가 범인임이 확실하다.",
    boxes: [
      { id: "b1", text: "그가", role: "주어", layer: 2 },
      { id: "b2", text: "범인임이", role: "서술어", layer: 2 },
      { id: "b3", text: "확실하다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b3", "b1", "b2"],
    clauses: [{ range: ["b1","b2"], layer: 2, parentRole: "주어", parentLayer: 1, clauseType: "명사절" }] },
  { id: "s7", text: "비가 오고 바람이 분다.",
    boxes: [
      { id: "b1", text: "비가", role: "주어", layer: 2 },
      { id: "b2", text: "오고", role: "서술어", layer: 2 },
      { id: "b3", text: "바람이", role: "주어", layer: 1 },
      { id: "b4", text: "분다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b4", "b3", "b2", "b1"],
    clauses: [{ range: ["b1","b2"], layer: 2, parentRole: "이어진 문장", parentLayer: 1, clauseType: "대등" }] },
  { id: "s8", text: "내가 읽은 책이 재미있다.",
    boxes: [
      { id: "b1", text: "내가", role: "주어", layer: 2 },
      { id: "b2", text: "읽은", role: "서술어", layer: 2 },
      { id: "b3", text: "책이", role: "주어", layer: 1 },
      { id: "b4", text: "재미있다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b4", "b3", "b2", "b1"],
    clauses: [{ range: ["b1","b2"], layer: 2, parentRole: "관형어", parentLayer: 1, clauseType: "관형절" }] },
  { id: "s9", text: "날씨가 추우면 집에 있자.",
    boxes: [
      { id: "b1", text: "날씨가", role: "주어", layer: 2 },
      { id: "b2", text: "추우면", role: "서술어", layer: 2 },
      { id: "b3", text: "집에", role: "부사어", layer: 1 },
      { id: "b4", text: "있자", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b4", "b3", "b2", "b1"],
    clauses: [{ range: ["b1","b2"], layer: 2, parentRole: "이어진 문장", parentLayer: 1, clauseType: "종속" }] },
  { id: "s10", text: "토끼가 빠르게 달린다.",
    boxes: [
      { id: "b1", text: "토끼가", role: "주어", layer: 1 },
      { id: "b2", text: "빠르게", role: "부사어", layer: 1 },
      { id: "b3", text: "달린다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b3", "b1", "b2"], clauses: [], linkedSentence: null },
  { id: "s11", text: "선생님이 학생에게 상을 주셨다.",
    boxes: [
      { id: "b1", text: "선생님이", role: "주어", layer: 1 },
      { id: "b2", text: "학생에게", role: "부사어", layer: 1 },
      { id: "b3", text: "상을", role: "목적어", layer: 1 },
      { id: "b4", text: "주셨다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b4", "b1", "b2", "b3"], clauses: [], linkedSentence: null },
  { id: "s12", text: "그가 떠남이 슬프다.",
    boxes: [
      { id: "b1", text: "그가", role: "주어", layer: 2 },
      { id: "b2", text: "떠남이", role: "서술어", layer: 2 },
      { id: "b3", text: "슬프다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b3", "b1", "b2"],
    clauses: [{ range: ["b1","b2"], layer: 2, parentRole: "주어", parentLayer: 1, clauseType: "명사절" }] },
  { id: "s13", text: "봄이 오면 꽃이 핀다.",
    boxes: [
      { id: "b1", text: "봄이", role: "주어", layer: 2 },
      { id: "b2", text: "오면", role: "서술어", layer: 2 },
      { id: "b3", text: "꽃이", role: "주어", layer: 1 },
      { id: "b4", text: "핀다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b4", "b3", "b2", "b1"],
    clauses: [{ range: ["b1","b2"], layer: 2, parentRole: "이어진 문장", parentLayer: 1, clauseType: "종속" }] },
  { id: "s14", text: "나는 그를 믿는다.",
    boxes: [
      { id: "b1", text: "나는", role: "주어", layer: 1 },
      { id: "b2", text: "그를", role: "목적어", layer: 1 },
      { id: "b3", text: "믿는다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b3", "b1", "b2"], clauses: [], linkedSentence: null },
  { id: "s15", text: "어머니가 만든 음식이 맛있다.",
    boxes: [
      { id: "b1", text: "어머니가", role: "주어", layer: 2 },
      { id: "b2", text: "만든", role: "서술어", layer: 2 },
      { id: "b3", text: "음식이", role: "주어", layer: 1 },
      { id: "b4", text: "맛있다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b4", "b3", "b2", "b1"],
    clauses: [{ range: ["b1","b2"], layer: 2, parentRole: "관형어", parentLayer: 1, clauseType: "관형절" }] },
];

// ─── 심화 문장 (레이어 3 이상) ───
const ADVANCED = [
  { id: "sa1", text: "나는 그가 준 책을 잃어버린 기억을 잊고 싶다.",
    boxes: [
      { id: "b1", text: "나는", role: "주어", layer: 1 },
      { id: "b2", text: "그가", role: "주어", layer: 3 },
      { id: "b3", text: "준", role: "서술어", layer: 3 },
      { id: "b4", text: "책을", role: "목적어", layer: 2 },
      { id: "b5", text: "잃어버린", role: "서술어", layer: 2 },
      { id: "b6", text: "기억을", role: "목적어", layer: 1 },
      { id: "b7", text: "잊고 싶다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b7", "b1", "b6", "b5", "b4", "b3", "b2"],
    clauses: [
      { range: ["b2","b3"], layer: 3, parentRole: "관형어", parentLayer: 2, clauseType: "관형절" },
      { range: ["b2","b3","b4","b5"], layer: 2, parentRole: "관형어", parentLayer: 1, clauseType: "관형절" },
    ] },
  { id: "sa2", text: "그는 자기가 잘못했다고 말했다.",
    boxes: [
      { id: "b1", text: "그는", role: "주어", layer: 1 },
      { id: "b2", text: "자기가", role: "주어", layer: 2 },
      { id: "b3", text: "잘못했다고", role: "서술어", layer: 2 },
      { id: "b4", text: "말했다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b4", "b1", "b3", "b2"],
    clauses: [
      { range: ["b2","b3"], layer: 2, parentRole: "부사어", parentLayer: 1, clauseType: "인용절" },
    ] },
  { id: "sa3", text: "비가 오고 바람이 불어서 우리는 집에 있었다.",
    boxes: [
      { id: "b1", text: "비가", role: "주어", layer: 3 },
      { id: "b2", text: "오고", role: "서술어", layer: 3 },
      { id: "b3", text: "바람이", role: "주어", layer: 2 },
      { id: "b4", text: "불어서", role: "서술어", layer: 2 },
      { id: "b5", text: "우리는", role: "주어", layer: 1 },
      { id: "b6", text: "집에", role: "부사어", layer: 1 },
      { id: "b7", text: "있었다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b7", "b5", "b6", "b4", "b3", "b2", "b1"],
    clauses: [
      { range: ["b1","b2"], layer: 3, parentRole: "이어진 문장", parentLayer: 2, clauseType: "대등" },
      { range: ["b1","b2","b3","b4"], layer: 2, parentRole: "이어진 문장", parentLayer: 1, clauseType: "종속" },
    ] },
  { id: "sa4", text: "철수는 영희가 예쁘다고 생각한다.",
    boxes: [
      { id: "b1", text: "철수는", role: "주어", layer: 1 },
      { id: "b2", text: "영희가", role: "주어", layer: 2 },
      { id: "b3", text: "예쁘다고", role: "서술어", layer: 2 },
      { id: "b4", text: "생각한다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b4", "b1", "b3", "b2"],
    clauses: [
      { range: ["b2","b3"], layer: 2, parentRole: "부사어", parentLayer: 1, clauseType: "인용절" },
    ] },
  { id: "sa5", text: "우리가 살고 있는 세상이 아름답다.",
    boxes: [
      { id: "b1", text: "우리가", role: "주어", layer: 2 },
      { id: "b2", text: "살고 있는", role: "서술어", layer: 2 },
      { id: "b3", text: "세상이", role: "주어", layer: 1 },
      { id: "b4", text: "아름답다", role: "서술어", layer: 1 },
    ],
    roleOrder: ["b4", "b3", "b2", "b1"],
    clauses: [
      { range: ["b1","b2"], layer: 2, parentRole: "관형어", parentLayer: 1, clauseType: "관형절" },
    ] },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createQuizJson(sents, idx, prefix, level) {
  const nn = String(idx).padStart(2, "0");
  const isBasic = prefix === "basic";
  return {
    contentType: "GRAMMAR_SENTENCE_STRUCTURE",
    title: isBasic ? `문장의 짜임 기초 ${nn}` : `문장의 짜임 심화 ${nn}`,
    targetLevel: level,
    area: "GRAMMAR",
    subArea: "SENTENCE_STRUCTURE",
    timeLimitSec: isBasic ? 300 : 420,
    payload: { sentences: sents },
  };
}

function main() {
  const outDir = path.join(__dirname, "../frontend/public/farm/grammar/sentence-structure");
  fs.mkdirSync(outDir, { recursive: true });

  // 기초 10개 (5문장씩)
  for (let i = 0; i < 10; i++) {
    const group = shuffleArray(BASIC).slice(0, 5);
    const json = createQuizJson(group, i + 1, "basic", "RUSSELL_1");
    fs.writeFileSync(path.join(outDir, `ss_basic_${String(i+1).padStart(2,"0")}.json`), JSON.stringify(json, null, 2), "utf8");
  }
  console.log("기초 10개 생성");

  // 심화 5개 (기초+심화 혼합 5문장씩)
  for (let i = 0; i < 5; i++) {
    const group = [...shuffleArray(ADVANCED).slice(0, 3), ...shuffleArray(BASIC.filter(s => s.clauses.length > 0)).slice(0, 2)];
    const json = createQuizJson(group, i + 1, "advanced", "WITTGENSTEIN_1");
    fs.writeFileSync(path.join(outDir, `ss_advanced_${String(i+1).padStart(2,"0")}.json`), JSON.stringify(json, null, 2), "utf8");
  }
  console.log("심화 5개 생성");
}

main();
