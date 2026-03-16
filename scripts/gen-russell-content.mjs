/**
 * 러셀1~3 원고 JSON → PRO_VOCAB / PRO_BACKGROUND 콘텐츠 생성
 *
 * 원고 구조:
 *   비문학_어휘 + 비문학_어휘_정답 → VOCAB (어휘 객관식)
 *   개념_객관식 + 비문학_객관식 → BACKGROUND (배경지식 객관식)
 *
 * 출력: 프로모드 콘텐츠/러셀{N}/ch{NN}_{type}.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, '프로모드 원고');
const OUT_DIR = path.join(ROOT, '프로모드 콘텐츠');

const LEVELS = [
  { folder: '러셀1', levelId: 'RUSSELL_1', bookNum: 1 },
  { folder: '러셀2', levelId: 'RUSSELL_2', bookNum: 2 },
  { folder: '러셀3', levelId: 'RUSSELL_3', bookNum: 3 },
];

const range = (s, e) => Array.from({ length: e - s + 1 }, (_, i) => s + i);

// ─── 유틸리티 ───

/** 원 번호(①②③...) → 인덱스 1~N */
function circledToNum(c) {
  const map = { '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5, '⑥': 6, '⑦': 7, '⑧': 8, '⑨': 9, '⑩': 10 };
  return map[c] || parseInt(c, 10) || 0;
}

/** ①②③... → A,B,C... */
function numToLetter(n) {
  return String.fromCharCode(64 + n); // 1→A, 2→B ...
}

/** 선택지 텍스트에서 번호 접두사 제거 "① 텍스트" → "텍스트" */
function stripPrefix(text) {
  return text.replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '').trim();
}

/** 정답 텍스트(①②...) → choice id(A,B,C...) */
function answerToChoiceId(answerStr, choicesArr) {
  // "②" 같은 원 번호 → 선택지 인덱스
  const idx = circledToNum(answerStr.trim());
  if (idx >= 1 && idx <= choicesArr.length) {
    return choicesArr[idx - 1].id;
  }
  return 'A'; // fallback
}

// ─── 어휘 정답 파싱 (원고의 불규칙 데이터 처리) ───

/** 번호 키 정규화: "**①**" → "①", "1" → "①" */
function normalizeNumKey(key) {
  const stripped = key.replace(/\*+/g, '').trim();
  // 이미 원 번호면 그대로
  if (/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫]$/.test(stripped)) return stripped;
  // 숫자 → 원 번호
  const numToCircled = { 1: '①', 2: '②', 3: '③', 4: '④', 5: '⑤', 6: '⑥', 7: '⑦', 8: '⑧', 9: '⑨', 10: '⑩', 11: '⑪', 12: '⑫' };
  const n = parseInt(stripped, 10);
  return numToCircled[n] || stripped;
}

function parseVocabAnswers(rawAnswers) {
  // 때로 "③": "인정 ④ 간섭" 처럼 하나의 값에 여러 정답이 합쳐진 경우
  const result = {};
  for (const [rawKey, val] of Object.entries(rawAnswers)) {
    const key = normalizeNumKey(rawKey);
    // "인정 ④ 간섭" → { ③: "인정", ④: "간섭" }
    const parts = val.split(/\s+([①②③④⑤⑥⑦⑧⑨⑩⑪⑫])\s*/);
    if (parts.length > 1) {
      result[key] = parts[0].trim();
      for (let i = 1; i < parts.length; i += 2) {
        if (parts[i] && parts[i + 1]) {
          result[parts[i]] = parts[i + 1].trim();
        }
      }
    } else {
      result[key] = val.trim();
    }
  }
  return result;
}

// ─── VOCAB 생성 ───

function generateVocab(raw, level, chapter) {
  const bm = raw['비문학'];
  if (!bm || !bm['비문학_어휘'] || !bm['비문학_어휘_정답']) return null;

  const vocabItems = bm['비문학_어휘'];
  const vocabAnswers = parseVocabAnswers(bm['비문학_어휘_정답']);

  // 어휘 쌍 추출: [{word, meaning}]
  const pairs = [];
  for (const item of vocabItems) {
    const num = normalizeNumKey(item['번호']);
    const meaning = item['의미'];
    const word = vocabAnswers[num];
    if (word && meaning) {
      pairs.push({ word, meaning });
    }
  }

  if (pairs.length === 0) return null;

  const questions = [];
  let qIdx = 1;

  // 유형 1: 낱말 → 뜻 (WORD_TO_MEANING)
  for (const pair of pairs) {
    // 오답 생성: 다른 어휘의 의미에서 3개 선택
    const wrongMeanings = pairs
      .filter(p => p.word !== pair.word)
      .map(p => p.meaning);
    const distractors = shuffle(wrongMeanings).slice(0, 3);

    const allChoices = shuffle([
      { text: pair.meaning, correct: true },
      ...distractors.map(d => ({ text: d, correct: false })),
    ]);

    // 4개 미만이면 패딩
    while (allChoices.length < 4) {
      allChoices.push({ text: '해당 없음', correct: false });
    }

    const choices = allChoices.slice(0, 4).map((c, i) => ({
      id: numToLetter(i + 1),
      text: c.text,
    }));
    const answerId = choices.find((c, i) => allChoices[i].correct)?.id || 'A';

    questions.push({
      id: `vb-${qIdx++}`,
      type: 'MULTI_CHOICE',
      questionKind: 'WORD_TO_MEANING',
      stem: `낱말: ${pair.word}`,
      prompt: '뜻을 고르세요.',
      choices,
      answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40 },
    });
  }

  // 유형 2: 뜻 → 낱말 (MEANING_TO_WORD)
  for (const pair of pairs) {
    const wrongWords = pairs
      .filter(p => p.word !== pair.word)
      .map(p => p.word);
    const distractors = shuffle(wrongWords).slice(0, 3);

    const allChoices = shuffle([
      { text: pair.word, correct: true },
      ...distractors.map(d => ({ text: d, correct: false })),
    ]);

    while (allChoices.length < 4) {
      allChoices.push({ text: '해당 없음', correct: false });
    }

    const choices = allChoices.slice(0, 4).map((c, i) => ({
      id: numToLetter(i + 1),
      text: c.text,
    }));
    const answerId = choices.find((c, i) => allChoices[i].correct)?.id || 'A';

    questions.push({
      id: `vb-${qIdx++}`,
      type: 'MULTI_CHOICE',
      questionKind: 'MEANING_TO_WORD',
      stem: `뜻: ${pair.meaning}`,
      prompt: '알맞은 낱말을 고르세요.',
      choices,
      answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40 },
    });
  }

  // 유형 3: 비문학 객관식 중 어휘 관련 문제 추가 (있으면)
  // → 대부분 독해 문제이므로 생략, 어휘 쌍만으로 충분

  return {
    contentType: 'PRO_VOCAB',
    title: `어휘 학습 — 챕터 ${chapter}`,
    description: `핵심 어휘를 다양한 유형의 문제로 학습`,
    targetLevel: level.levelId,
    area: 'VOCAB',
    subArea: 'BASIC',
    competencies: ['VOCABULARY'],
    tags: ['pro-vocab', `russell${level.bookNum}-ch${String(chapter).padStart(2, '0')}`],
    seedReward: { seedType: 'WHEAT', count: 3, multiplier: 1 },
    timeLimitSec: 180,
    payload: {
      pageStack: true,
      layout: 'EXAM_SHEET',
      questions,
    },
  };
}

// ─── BACKGROUND 생성 ───

function generateBackground(raw, level, chapter) {
  const questions = [];
  let qIdx = 1;

  // 소스 1: 개념_객관식
  const concept = raw['개념'];
  if (concept && concept['개념_객관식_문제'] && concept['개념_객관식_선택지'] && concept['개념_객관식_정답']) {
    for (const prob of concept['개념_객관식_문제']) {
      const num = String(prob['번호']);
      const choicesRaw = concept['개념_객관식_선택지'][num];
      const answerRaw = concept['개념_객관식_정답'][num];
      if (!choicesRaw || !answerRaw) continue;

      const choices = choicesRaw.map((text, i) => ({
        id: numToLetter(i + 1),
        text: stripPrefix(text),
      }));

      const answerId = answerToChoiceId(answerRaw, choices);

      questions.push({
        id: `bg-${qIdx++}`,
        type: 'MULTI_CHOICE',
        stem: prob['문제'],
        prompt: '알맞은 답을 고르세요.',
        choices,
        answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40 },
      });
    }
  }

  // 소스 2: 비문학_객관식 (독해력보다 배경지식에 가까운 문제 포함)
  const bm = raw['비문학'];
  if (bm && bm['비문학_객관식_문제'] && bm['비문학_객관식_선택지'] && bm['비문학_객관식_정답']) {
    for (const prob of bm['비문학_객관식_문제']) {
      const num = String(prob['번호']);
      const choicesRaw = bm['비문학_객관식_선택지'][num];
      const answerRaw = bm['비문학_객관식_정답'][num];
      if (!choicesRaw || !answerRaw) continue;

      const choices = choicesRaw.map((text, i) => ({
        id: numToLetter(i + 1),
        text: stripPrefix(text),
      }));

      const answerId = answerToChoiceId(answerRaw, choices);

      questions.push({
        id: `bg-${qIdx++}`,
        type: 'MULTI_CHOICE',
        stem: prob['문제'],
        prompt: '알맞은 답을 고르세요.',
        choices,
        answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40 },
      });
    }
  }

  if (questions.length === 0) return null;

  return {
    contentType: 'PRO_BACKGROUND',
    title: `배경지식 — 챕터 ${chapter}`,
    description: `개념과 비문학 독해 관련 배경지식 학습`,
    targetLevel: level.levelId,
    area: 'BACKGROUND',
    subArea: 'KNOWLEDGE',
    competencies: ['BACKGROUND_KNOWLEDGE'],
    tags: ['pro-background', `russell${level.bookNum}-ch${String(chapter).padStart(2, '0')}`],
    seedReward: { seedType: 'CORN', count: 3, multiplier: 1 },
    timeLimitSec: 300,
    payload: {
      pageStack: true,
      layout: 'EXAM_SHEET',
      questions,
    },
  };
}

// ─── 셔플 ───

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── 메인 ───

let totalVocab = 0;
let totalBg = 0;

for (const level of LEVELS) {
  const srcDir = path.join(SRC_DIR, level.folder);
  const outDir = path.join(OUT_DIR, level.folder);

  // 출력 폴더 생성
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const ch of range(1, 20)) {
    const srcFile = path.join(srcDir, `${level.folder} (챕터${ch}).json`);
    if (!fs.existsSync(srcFile)) {
      console.error(`  파일 없음: ${srcFile}`);
      continue;
    }

    let raw;
    try {
      let text = fs.readFileSync(srcFile, 'utf8');
      // BOM 제거
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      raw = JSON.parse(text);
    } catch (e) {
      console.error(`  JSON 파싱 실패: ${srcFile} — ${e.message}`);
      continue;
    }

    const chStr = String(ch).padStart(2, '0');

    // VOCAB 생성
    const vocab = generateVocab(raw, level, ch);
    if (vocab) {
      const vocabPath = path.join(outDir, `ch${chStr}_vocab.json`);
      fs.writeFileSync(vocabPath, JSON.stringify(vocab, null, 2), 'utf8');
      totalVocab++;
    } else {
      console.warn(`  ⚠️ VOCAB 생성 불가: ${level.folder} ch${chStr}`);
    }

    // BACKGROUND 생성
    const bg = generateBackground(raw, level, ch);
    if (bg) {
      const bgPath = path.join(outDir, `ch${chStr}_background.json`);
      fs.writeFileSync(bgPath, JSON.stringify(bg, null, 2), 'utf8');
      totalBg++;
    } else {
      console.warn(`  ⚠️ BACKGROUND 생성 불가: ${level.folder} ch${chStr}`);
    }
  }

  console.log(`${level.folder}: VOCAB ${totalVocab}개, BACKGROUND ${totalBg}개`);
}

console.log(`\n총 VOCAB: ${totalVocab}개, BACKGROUND: ${totalBg}개 생성 완료`);
