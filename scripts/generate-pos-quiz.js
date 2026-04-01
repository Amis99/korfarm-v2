/**
 * 품사 학습 DB 생성 스크립트
 * 1단계: 단어 선별 + 사전 조회 → 중간 데이터 수집
 * 2단계: JSON 파일 100개 생성
 *
 * 사용법: node scripts/generate-pos-quiz.js
 */
const fs = require("fs");
const path = require("path");
const { lookupWords } = require("../generated/pro-vocab/dict-lookup");

// ─── 9품사 목록 ───
const POS_LIST = ["명사", "대명사", "수사", "동사", "형용사", "관형사", "부사", "감탄사", "조사"];
const POS_MAIN = ["명사", "동사", "형용사", "부사", "관형사", "감탄사", "조사", "대명사", "수사"];

// ─── 기초 단어 후보 (품사 통용 없는 단어 위주) ───
const BASIC_WORDS = [
  // 명사
  "사람","학교","마음","시간","나라","하늘","바람","물","책","길",
  "꽃","산","바다","돌","불","눈","손","발","입","귀",
  "집","밤","아침","저녁","봄","여름","가을","겨울","비","구름",
  "땅","강","숲","나무","풀","별","달","해","소리","빛",
  "힘","뜻","말","생각","느낌","기쁨","슬픔","사랑","꿈","희망",
  "가족","친구","선생","아이","어머니","아버지","형","누나","동생","아기",
  "음식","밥","물","옷","모자","신발","가방","연필","공","종이",
  "문","창","벽","지붕","계단","다리","길","거리","마을","도시",
  // 동사
  "가다","오다","먹다","마시다","자다","일어나다","앉다","서다","걷다","뛰다",
  "읽다","쓰다","듣다","말하다","노래하다","춤추다","웃다","울다","놀다","일하다",
  "만들다","부수다","던지다","잡다","놓다","열다","닫다","넣다","꺼내다","씻다",
  "입다","벗다","신다","쓰다","타다","내리다","오르다","건너다","돌다","멈추다",
  "살다","죽다","태어나다","자라다","늙다","배우다","가르치다","알다","모르다","찾다",
  // 형용사
  "크다","작다","높다","낮다","길다","짧다","넓다","좁다","두껍다","얇다",
  "무겁다","가볍다","빠르다","느리다","밝다","어둡다","뜨겁다","차갑다","맛있다","맛없다",
  "좋다","나쁘다","아름답다","예쁘다","귀엽다","착하다","슬프다","기쁘다","무섭다","외롭다",
  "조용하다","시끄럽다","깨끗하다","더럽다","새롭다","오래되다","쉽다","어렵다","바쁘다","한가하다",
  // 부사
  "매우","아주","너무","정말","참","꽤","좀","약간","조금","많이",
  "항상","늘","자주","가끔","때때로","이미","아직","벌써","곧","먼저",
  "천천히","빨리","잘","못","다","모두","함께","따로","겨우","비로소",
  // 관형사
  "새","헌","온","모든","각","별","첫","옛",
  // 감탄사
  "아","어머","글쎄","네","아니","여보세요","얘","저기","만세","세상에",
  // 수사
  "하나","둘","셋","넷","다섯","여섯","일곱","여덟","아홉","열",
  "첫째","둘째","셋째",
];

// ─── 심화 단어 후보 (품사 통용 있는 단어) ───
const ADVANCED_WORDS = [
  // 조사/부사 통용
  "같이","만큼","대로","뿐","밖","까지","마저","조차","부터",
  // 동사/조사 통용
  "보다",
  // 명사/관형사 통용
  "새","다른",
  // 수사/관형사 통용
  "하나","둘","셋","넷","다섯","여섯","일곱","여덟","아홉","열",
  // 명사/부사 통용
  "못","바로","그대로","그냥","더","덜",
  // 동사/형용사 통용
  "늙다","익다","밝다",
  // 의존명사/조사 통용
  "만","만큼","뿐","대로","밖","바","지","줄","수","리",
  // 부사/감탄사 통용
  "네","예","아니",
  // 본용언/보조용언
  "가다","오다","보다","주다","놓다","두다","버리다","내다","대다",
  // 접속부사 vs 접속조사
  "그리고","그러나","그런데","또","및",
  // 기타 품사 통용
  "아니다","이다","하다","되다","있다","없다","않다",
  "이","그","저","무엇","어디","언제","왜","어떻게",
  "나","너","우리","저","자기","자신",
  // 관계언 심화
  "은","는","이","가","을","를","에","에서","에게","한테","으로","와","과",
  // 용언 활용 심화
  "먹다","잡다","읽다","걷다","듣다","짓다","낫다","잇다",
];

// ─── 사전 조회 ───
function collectDictData(wordList) {
  console.log(`사전 조회 중... (${wordList.length}개 단어)`);
  const unique = [...new Set(wordList)];
  const results = lookupWords(unique);
  let found = 0, notFound = 0;
  for (const [w, entries] of Object.entries(results)) {
    if (entries.length > 0) found++;
    else notFound++;
  }
  console.log(`  조회 완료: ${found}개 발견, ${notFound}개 미발견`);
  return results;
}

// ─── 예문 선택 (짧고 자연스러운 것 우선) ───
function pickExample(senses, word) {
  const all = [];
  for (const s of senses) {
    for (const ex of (s.examples || [])) {
      if (ex.includes(word) && ex.length >= 5 && ex.length <= 60) {
        all.push(ex);
      }
    }
  }
  // 짧은 예문 우선
  all.sort((a, b) => a.length - b.length);
  return all[0] || null;
}

// ─── 오답 선택지 생성 ───
function generateDistractors(correctPos, count = 3) {
  const pool = POS_MAIN.filter(p => p !== correctPos);
  // 셔플
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

// ─── 선택지 셔플 (정답 위치 랜덤) ───
function shuffleChoices(correctText, distractors) {
  const ids = ["A", "B", "C", "D"];
  const all = [correctText, ...distractors];
  // 셔플
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const answerId = ids[all.indexOf(correctText)];
  const choices = all.map((text, idx) => ({ id: ids[idx], text }));
  return { choices, answerId };
}

// ─── 기초 문제 생성 ───
function generateBasicQuestions(dictData) {
  const questions = [];
  for (const [word, entries] of Object.entries(dictData)) {
    if (entries.length === 0) continue;
    // 품사 통용 확인 - 기초에서는 단일 품사만
    const posSet = new Set(entries.map(e => e.pos).filter(Boolean));
    if (posSet.size > 1) continue; // 품사 통용 → 기초에서 제외

    for (const entry of entries) {
      if (!entry.pos || !POS_LIST.includes(entry.pos)) continue;
      const example = pickExample(entry.senses, word);
      if (!example) continue;

      const distractors = generateDistractors(entry.pos);
      const { choices, answerId } = shuffleChoices(entry.pos, distractors);

      questions.push({
        word,
        pos: entry.pos,
        definition: entry.senses[0]?.definition || "",
        passage: example,
        highlight: { text: word },
        choices,
        answerId,
      });
    }
  }
  return questions;
}

// ─── 심화 문제 생성 (품사 통용 단어) ───
function generateAdvancedQuestions(dictData) {
  const questions = [];
  for (const [word, entries] of Object.entries(dictData)) {
    if (entries.length === 0) continue;

    // 각 품사별로 예문 수집
    for (const entry of entries) {
      if (!entry.pos || !POS_LIST.includes(entry.pos)) continue;
      const example = pickExample(entry.senses, word);
      if (!example) continue;

      const distractors = generateDistractors(entry.pos);
      const { choices, answerId } = shuffleChoices(entry.pos, distractors);

      questions.push({
        word,
        pos: entry.pos,
        definition: entry.senses[0]?.definition || "",
        passage: example,
        highlight: { text: word },
        choices,
        answerId,
        isMultiPos: entries.filter(e => e.pos !== entry.pos).length > 0,
      });
    }
  }
  return questions;
}

// ─── JSON 파일 생성 ───
function createQuizJson(questions, idx, prefix, level) {
  const nn = String(idx).padStart(2, "0");
  const isBasic = prefix === "basic";
  const title = isBasic ? `품사 기초 학습 ${nn}` : `품사 심화 학습 ${nn}`;

  return {
    contentType: "GRAMMAR_POS",
    title,
    description: isBasic
      ? "기본 품사를 판별하는 연습"
      : "품사 통용 단어의 문맥별 품사를 판별하는 연습",
    targetLevel: level,
    area: "GRAMMAR",
    subArea: "POS",
    competencies: ["GRAMMAR"],
    tags: [isBasic ? "pos-basic" : "pos-advanced"],
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: isBasic ? 180 : 240,
    payload: {
      layout: "EXAM_SHEET",
      pageStack: true,
      questions: questions.map((q, i) => ({
        id: `pos-${prefix[0]}${nn}-${String(i + 1).padStart(2, "0")}`,
        type: "MULTI_CHOICE",
        questionKind: "POS",
        competency: "문법능력",
        stem: "다음 문장에서 밑줄 친 단어의 품사를 고르세요.",
        passage: q.passage,
        highlight: q.highlight,
        prompt: "품사를 고르세요.",
        choices: q.choices,
        answerId: q.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -20 },
      })),
    },
  };
}

// ─── 메인 실행 ───
function main() {
  const outDir = path.join(__dirname, "../frontend/public/farm/grammar/pos");
  fs.mkdirSync(outDir, { recursive: true });

  // 1. 사전 조회
  console.log("=== 기초 단어 사전 조회 ===");
  const basicDict = collectDictData(BASIC_WORDS);
  console.log("=== 심화 단어 사전 조회 ===");
  const advDict = collectDictData(ADVANCED_WORDS);

  // 2. 문제 생성
  console.log("\n=== 기초 문제 생성 ===");
  let basicQs = generateBasicQuestions(basicDict);
  console.log(`  기초 문제: ${basicQs.length}개 생성`);

  console.log("=== 심화 문제 생성 ===");
  let advQs = generateAdvancedQuestions(advDict);
  console.log(`  심화 문제: ${advQs.length}개 생성`);

  // 3. 셔플
  basicQs.sort(() => Math.random() - 0.5);
  advQs.sort(() => Math.random() - 0.5);

  // 4. 20문항씩 묶어서 JSON 생성
  const QUESTIONS_PER_QUIZ = 20;
  const TARGET_QUIZZES = 50;
  const TARGET_QUESTIONS = TARGET_QUIZZES * QUESTIONS_PER_QUIZ;

  // 기초: 부족하면 반복 사용
  while (basicQs.length < TARGET_QUESTIONS) {
    basicQs = basicQs.concat(basicQs.slice(0, TARGET_QUESTIONS - basicQs.length));
  }
  while (advQs.length < TARGET_QUESTIONS) {
    advQs = advQs.concat(advQs.slice(0, TARGET_QUESTIONS - advQs.length));
  }

  console.log(`\n=== JSON 파일 생성 ===`);

  // 기초 50개
  for (let i = 0; i < TARGET_QUIZZES; i++) {
    const qs = basicQs.slice(i * QUESTIONS_PER_QUIZ, (i + 1) * QUESTIONS_PER_QUIZ);
    const level = i < 25 ? "FREGE_1" : "RUSSELL_1";
    const json = createQuizJson(qs, i + 1, "basic", level);
    const file = path.join(outDir, `pos_basic_${String(i + 1).padStart(2, "0")}.json`);
    fs.writeFileSync(file, JSON.stringify(json, null, 2), "utf-8");
  }
  console.log(`  기초: 50개 파일 생성 완료`);

  // 심화 50개
  for (let i = 0; i < TARGET_QUIZZES; i++) {
    const qs = advQs.slice(i * QUESTIONS_PER_QUIZ, (i + 1) * QUESTIONS_PER_QUIZ);
    const level = i < 25 ? "RUSSELL_1" : "WITTGENSTEIN_1";
    const json = createQuizJson(qs, i + 1, "advanced", level);
    const file = path.join(outDir, `pos_advanced_${String(i + 1).padStart(2, "0")}.json`);
    fs.writeFileSync(file, JSON.stringify(json, null, 2), "utf-8");
  }
  console.log(`  심화: 50개 파일 생성 완료`);

  console.log(`\n=== 완료 ===`);
  console.log(`출력 경로: ${outDir}`);
  console.log(`총 파일: 100개`);
  console.log(`총 문항: ${TARGET_QUIZZES * 2 * QUESTIONS_PER_QUIZ}개`);
}

main();
