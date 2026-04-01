/**
 * 단어의 형성 학습 콘텐츠 생성 스크립트
 * 기초 20개 + 심화 10개
 * 사용법: node scripts/generate-word-formation.js
 */
const fs = require("fs");
const path = require("path");

// ─── 기초 단어 데이터 (형태소 2개 이하, 어미 제외) ───
// 단일어, 합성어, 파생어 혼합. 10개씩 한 학습
const BASIC_WORDS = [
  // 단일어
  { word: "구름", morphemes: [{ form: "구름", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" }], formation: "단일어" },
  { word: "하늘", morphemes: [{ form: "하늘", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" }], formation: "단일어" },
  { word: "나무", morphemes: [{ form: "나무", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" }], formation: "단일어" },
  { word: "바람", morphemes: [{ form: "바람", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" }], formation: "단일어" },
  { word: "사람", morphemes: [{ form: "사람", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" }], formation: "단일어" },
  { word: "소리", morphemes: [{ form: "소리", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" }], formation: "단일어" },
  { word: "마음", morphemes: [{ form: "마음", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" }], formation: "단일어" },
  { word: "아이", morphemes: [{ form: "아이", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" }], formation: "단일어" },
  // 합성어 (어근+어근)
  { word: "눈사람", morphemes: [
    { form: "눈", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
    { form: "사람", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "합성어" },
  { word: "논밭", morphemes: [
    { form: "논", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
    { form: "밭", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "합성어" },
  { word: "쌀밥", morphemes: [
    { form: "쌀", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
    { form: "밥", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "합성어" },
  { word: "돌다리", morphemes: [
    { form: "돌", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
    { form: "다리", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "합성어" },
  { word: "책가방", morphemes: [
    { form: "책", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
    { form: "가방", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "합성어" },
  { word: "밤낮", morphemes: [
    { form: "밤", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
    { form: "낮", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "합성어" },
  { word: "밀물", morphemes: [
    { form: "밀-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
    { form: "물", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "합성어" },
  { word: "썰물", morphemes: [
    { form: "썰-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
    { form: "물", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "합성어" },
  { word: "빛나다", morphemes: [
    { form: "빛", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
    { form: "나-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
  ], formation: "합성어" },
  { word: "뛰놀다", morphemes: [
    { form: "뛰-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
    { form: "놀-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
  ], formation: "합성어" },
  { word: "오가다", morphemes: [
    { form: "오-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
    { form: "가-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
  ], formation: "합성어" },
  { word: "여닫다", morphemes: [
    { form: "열-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
    { form: "닫-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
  ], formation: "합성어" },
  { word: "앞서다", morphemes: [
    { form: "앞", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
    { form: "서-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
  ], formation: "합성어" },
  { word: "본받다", morphemes: [
    { form: "본", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
    { form: "받-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
  ], formation: "합성어" },
  { word: "첫사랑", morphemes: [
    { form: "첫", name: "관형사", nameDetail: "수 관형사", type: "실질 자립", mark: "circle" },
    { form: "사랑", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "합성어" },
  // 파생어 (접사+어근 또는 어근+접사)
  { word: "맨손", morphemes: [
    { form: "맨-", name: "접사", nameDetail: "접두사", type: "형식 의존", mark: "square" },
    { form: "손", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "파생어" },
  { word: "헛기침", morphemes: [
    { form: "헛-", name: "접사", nameDetail: "접두사", type: "형식 의존", mark: "square" },
    { form: "기침", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "파생어" },
  { word: "풋사과", morphemes: [
    { form: "풋-", name: "접사", nameDetail: "접두사", type: "형식 의존", mark: "square" },
    { form: "사과", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "파생어" },
  { word: "날고기", morphemes: [
    { form: "날-", name: "접사", nameDetail: "접두사", type: "형식 의존", mark: "square" },
    { form: "고기", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "파생어" },
  { word: "맏딸", morphemes: [
    { form: "맏-", name: "접사", nameDetail: "접두사", type: "형식 의존", mark: "square" },
    { form: "딸", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "파생어" },
  { word: "군소리", morphemes: [
    { form: "군-", name: "접사", nameDetail: "접두사", type: "형식 의존", mark: "square" },
    { form: "소리", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
  ], formation: "파생어" },
  { word: "가위질", morphemes: [
    { form: "가위", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
    { form: "-질", name: "접사", nameDetail: "접미사", type: "형식 의존", mark: "square" },
  ], formation: "파생어" },
  { word: "먹이", morphemes: [
    { form: "먹-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
    { form: "-이", name: "접사", nameDetail: "접미사", type: "형식 의존", mark: "square" },
  ], formation: "파생어" },
  { word: "사기꾼", morphemes: [
    { form: "사기", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
    { form: "-꾼", name: "접사", nameDetail: "접미사", type: "형식 의존", mark: "square" },
  ], formation: "파생어" },
  { word: "지우개", morphemes: [
    { form: "지우-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
    { form: "-개", name: "접사", nameDetail: "접미사", type: "형식 의존", mark: "square" },
  ], formation: "파생어" },
  { word: "돌멩이", morphemes: [
    { form: "돌", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
    { form: "-멩이", name: "접사", nameDetail: "접미사", type: "형식 의존", mark: "square" },
  ], formation: "파생어" },
  { word: "샛노랗다", morphemes: [
    { form: "샛-", name: "접사", nameDetail: "접두사", type: "형식 의존", mark: "square" },
    { form: "노랗-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존", mark: "circle" },
  ], formation: "파생어" },
  { word: "되살리다", morphemes: [
    { form: "되-", name: "접사", nameDetail: "접두사", type: "형식 의존", mark: "square" },
    { form: "살리-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
  ], formation: "파생어" },
];

// ─── 심화 단어 데이터 (3개 이상 형태소, 결합 순서 분석) ───
const ADVANCED_WORDS = [
  {
    word: "거짓말쟁이",
    morphemes: [
      { form: "거짓", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
      { form: "말", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
      { form: "-쟁이", name: "접사", nameDetail: "접미사", type: "형식 의존", mark: "square" },
    ],
    formation: "파생어",
    steps: [
      { targetIdx: 1, pairIdx: 0, resultFormation: "합성어" },
      // 거짓+말 → 거짓말(합성어) → 거짓말+-쟁이 → 파생어
    ],
    compoundInfo: { syntactic: "통사적", relation: "종속" },
  },
  {
    word: "길짐승",
    morphemes: [
      { form: "기-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존", mark: "circle" },
      { form: "-ㄹ", name: "어미", nameDetail: "전성 어미", type: "형식 의존", mark: "none" },
      { form: "짐승", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
    ],
    formation: "합성어",
    steps: [],
    compoundInfo: { syntactic: "통사적", relation: "종속" },
  },
  {
    word: "짓밟다",
    morphemes: [
      { form: "짓-", name: "접사", nameDetail: "접두사", type: "형식 의존", mark: "square" },
      { form: "밟-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
    ],
    formation: "파생어",
    steps: [],
    compoundInfo: null,
  },
  {
    word: "치솟다",
    morphemes: [
      { form: "치-", name: "접사", nameDetail: "접두사", type: "형식 의존", mark: "square" },
      { form: "솟-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
    ],
    formation: "파생어",
    steps: [],
    compoundInfo: null,
  },
  {
    word: "배부르다",
    morphemes: [
      { form: "배", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
      { form: "부르-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존", mark: "circle" },
    ],
    formation: "합성어",
    steps: [],
    compoundInfo: { syntactic: "비통사적", relation: "종속" },
  },
  {
    word: "높푸르다",
    morphemes: [
      { form: "높-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존", mark: "circle" },
      { form: "푸르-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존", mark: "circle" },
    ],
    formation: "합성어",
    steps: [],
    compoundInfo: { syntactic: "비통사적", relation: "대등" },
  },
  {
    word: "풋사랑",
    morphemes: [
      { form: "풋-", name: "접사", nameDetail: "접두사", type: "형식 의존", mark: "square" },
      { form: "사랑", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
    ],
    formation: "파생어",
    steps: [],
    compoundInfo: null,
  },
  {
    word: "말썽꾸러기",
    morphemes: [
      { form: "말썽", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
      { form: "-꾸러기", name: "접사", nameDetail: "접미사", type: "형식 의존", mark: "square" },
    ],
    formation: "파생어",
    steps: [],
    compoundInfo: null,
  },
  {
    word: "헛웃음짓다",
    morphemes: [
      { form: "헛-", name: "접사", nameDetail: "접두사", type: "형식 의존", mark: "square" },
      { form: "웃음", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
      { form: "짓-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
    ],
    formation: "합성어",
    steps: [
      { targetIdx: 1, pairIdx: 0, resultFormation: "파생어" },
      // 헛-+웃음 → 헛웃음(파생어) → 헛웃음+짓- → 합성어
    ],
    compoundInfo: { syntactic: "비통사적", relation: "종속" },
  },
  {
    word: "새해맞이",
    morphemes: [
      { form: "새", name: "관형사", nameDetail: "성상 관형사", type: "실질 자립", mark: "circle" },
      { form: "해", name: "명사", nameDetail: "보통 명사", type: "실질 자립", mark: "circle" },
      { form: "맞-", name: "어간", nameDetail: "동사 어간", type: "실질 의존", mark: "circle" },
      { form: "-이", name: "접사", nameDetail: "접미사", type: "형식 의존", mark: "square" },
    ],
    formation: "파생어",
    steps: [
      { targetIdx: 1, pairIdx: 0, resultFormation: "합성어" },
      { targetIdx: 1, pairIdx: 2, resultFormation: "합성어" },
      // 새+해 → 새해(합성어), 새해+맞- → 새해맞-(합성어), 새해맞-+-이 → 파생어
    ],
    compoundInfo: null,
  },
];

// ─── 선택지 생성 ───
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildWordEntry(w, idx) {
  const morphemes = w.morphemes;
  const count = morphemes.length;
  const correctSplit = morphemes.map(m => m.form).join(", ");

  // 개수 선택지
  const countSet = new Set([count]);
  [count - 2, count - 1, count + 1, count + 2].forEach(n => { if (n > 0) countSet.add(n); });
  const countChoices = shuffleArray([...countSet]).slice(0, 4);
  if (!countChoices.includes(count)) countChoices[0] = count;

  // 구분 선택지
  const wrongSplits = [
    morphemes.map(m => m.form).join(""),
    morphemes.length > 1 ? morphemes[0].form + morphemes.slice(1).map(m => m.form).join("") : correctSplit + ", ?",
    correctSplit.split(", ").reverse().join(", "),
  ].filter(s => s !== correctSplit).slice(0, 3);
  while (wrongSplits.length < 3) wrongSplits.push(correctSplit + " (오류)");

  const splitAll = shuffleArray([
    { id: "A", text: correctSplit },
    { id: "B", text: wrongSplits[0] },
    { id: "C", text: wrongSplits[1] },
    { id: "D", text: wrongSplits[2] },
  ]);
  const splitChoices = splitAll.map((c, i) => ({ id: ["A","B","C","D"][i], text: c.text }));
  const splitAnswer = splitChoices.find(c => c.text === correctSplit)?.id || "A";

  return {
    id: `w${idx + 1}`,
    word: w.word,
    morphemes,
    countChoices: shuffleArray(countChoices),
    countAnswer: count,
    splitChoices,
    splitAnswer,
    formation: w.formation,
    steps: w.steps || [],
    compoundInfo: w.compoundInfo || null,
  };
}

function createQuizJson(words, quizIdx, prefix, level) {
  const nn = String(quizIdx).padStart(2, "0");
  const isBasic = prefix === "basic";
  return {
    contentType: "GRAMMAR_WORD_FORMATION",
    title: isBasic ? `단어의 형성 기초 ${nn}` : `단어의 형성 심화 ${nn}`,
    targetLevel: level,
    area: "GRAMMAR",
    subArea: "WORD_FORMATION",
    payload: {
      mode: "word_formation",
      words: words.map((w, i) => buildWordEntry(w, i)),
    },
  };
}

// ─── 메인 ───
function main() {
  const outDir = path.join(__dirname, "../frontend/public/farm/grammar/word-formation");
  fs.mkdirSync(outDir, { recursive: true });

  // 기초 20개 (10단어씩)
  const allBasic = shuffleArray(BASIC_WORDS);
  for (let i = 0; i < 20; i++) {
    const group = [];
    for (let j = 0; j < 10; j++) {
      group.push(allBasic[(i * 10 + j) % allBasic.length]);
    }
    const level = "RUSSELL_1";
    const json = createQuizJson(group, i + 1, "basic", level);
    fs.writeFileSync(path.join(outDir, `wf_basic_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(json, null, 2), "utf8");
  }
  console.log("기초 20개 생성");

  // 심화 10개 (기초 단어 + 심화 단어 혼합)
  const allAdvanced = [...BASIC_WORDS, ...ADVANCED_WORDS];
  for (let i = 0; i < 10; i++) {
    const group = shuffleArray(allAdvanced).slice(0, 10);
    const level = "WITTGENSTEIN_1";
    const json = createQuizJson(group, i + 1, "advanced", level);
    fs.writeFileSync(path.join(outDir, `wf_advanced_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(json, null, 2), "utf8");
  }
  console.log("심화 10개 생성");
  console.log("출력:", outDir);
}

main();
