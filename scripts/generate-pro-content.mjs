#!/usr/bin/env node
/**
 * 프로모드 전체 콘텐츠 생성 스크립트
 * 180챕터 × 6종 콘텐츠 (독해, 어휘, 배경지식, 논리, 모범답안, 테스트)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const MANUSCRIPT_DIR = join(ROOT, '프로모드 원고');
const OUTPUT_DIR = join(ROOT, 'generated');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── 레벨 설정 ───
const LEVELS = [
  { folder: '소쉬르1', levelId: 'saussure1', prefix: '소쉬르1', bookNum: 1, type: 'saussure' },
  { folder: '소쉬르2', levelId: 'saussure2', prefix: '소쉬르2', bookNum: 2, type: 'saussure' },
  { folder: '소쉬르3', levelId: 'saussure3', prefix: '소쉬르3', bookNum: 3, type: 'saussure' },
  { folder: '프레게1', levelId: 'frege1', prefix: '프레게1', bookNum: 1, type: 'frege' },
  { folder: '프레게2', levelId: 'frege2', prefix: '프레게2', bookNum: 2, type: 'frege' },
  { folder: '프레게3', levelId: 'frege3', prefix: '프레게3', bookNum: 3, type: 'frege' },
  { folder: '러셀1', levelId: 'russell1', prefix: '러셀1', bookNum: 1, type: 'russell' },
  { folder: '러셀2', levelId: 'russell2', prefix: '러셀2', bookNum: 2, type: 'russell' },
  { folder: '러셀3', levelId: 'russell3', prefix: '러셀3', bookNum: 3, type: 'russell' },
];

let idCounter = 0;
const genId = (prefix) => `${prefix}_${Date.now().toString(36)}_${(++idCounter).toString(36).padStart(4, '0')}`;

// ─── 원고 파일 읽기 ───
function readManuscript(level, chapterNum) {
  const dir = join(MANUSCRIPT_DIR, level.folder);
  // 파일명 패턴이 레벨마다 다름
  const patterns = [
    `${level.prefix} (챕터${chapterNum}).json`,
    `${level.prefix}(챕터${chapterNum}).json`,
    `${level.prefix} (챕터 ${chapterNum}).json`,
  ];
  for (const p of patterns) {
    const fp = join(dir, p);
    if (existsSync(fp)) {
      let raw = readFileSync(fp, 'utf-8');
      // BOM 제거
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.warn(`  JSON 파싱 에러: ${fp} — ${e.message}`);
        return null;
      }
    }
  }
  console.warn(`  원고 없음: ${level.folder}/챕터${chapterNum}`);
  return null;
}

// ─── 헬퍼: 플랫/네스트 모두에서 값 추출 ───
function getVal(section, ...keys) {
  if (!section) return undefined;
  for (const k of keys) {
    if (section[k] !== undefined) return section[k];
  }
  // nested 구조에서 찾기 (프레게)
  for (const v of Object.values(section)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const k of keys) {
        if (v[k] !== undefined) return v[k];
      }
    }
  }
  return undefined;
}

// 원문자를 번호로 변환
function circledToNum(s) {
  if (!s) return s;
  const map = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5' };
  return map[String(s).trim()] || String(s).trim();
}

// 선택지 배열을 choices 형식으로 변환
function toChoices(arr) {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.map((text, i) => {
    const cleaned = String(text).replace(/^[①②③④⑤]\s*/, '').trim();
    return { id: String(i + 1), text: cleaned };
  });
}

// 지문 텍스트를 문단 배열로 변환
function toParagraphs(text) {
  if (!text) return [];
  return String(text).split(/\n\n+/).filter(Boolean).map((t, i) => ({
    id: `p${i + 1}`,
    text: t.trim()
  }));
}

// ─── 수동 작성 파일 로드 경로 ───
const PRO_READING_DIR = join(ROOT, 'generated', 'pro-reading');
const PRO_VOCAB_DIR = join(ROOT, 'generated', 'pro-vocab');
const PRO_BACKGROUND_DIR = join(ROOT, 'generated', 'pro-background');
const PRO_LOGIC_DIR = join(ROOT, 'generated', 'pro-logic');
const PRO_TESTS_DIR = join(ROOT, 'generated', 'pro-tests');

// subArea 한글→영어 매핑
const SUB_AREA_MAP = { '개념': 'CONCEPT', '문학': 'LITERATURE', '비문학': 'NONFICTION', '문법': 'GRAMMAR' };

// ─── 1. 독해 콘텐츠 생성 (reading_training) ───
// generated/pro-reading/ 에 수동 작성된 파일이 있으면 우선 사용, 없으면 자동 생성 fallback
function generateReading(ms, level, chapterNum) {
  // 수동 작성 파일 확인
  const manualFile = join(PRO_READING_DIR, `${level.levelId}_ch${String(chapterNum).padStart(2, '0')}.json`);
  if (existsSync(manualFile)) {
    try {
      const items = JSON.parse(readFileSync(manualFile, 'utf-8'));
      return items.map(item => ({
        id: `pro_read_${level.levelId.toLowerCase()}_ch${chapterNum}_${item.subArea}`,
        contentType: 'PRO_READING',
        levelId: level.levelId,
        area: 'READING',
        subArea: item.subArea,
        moduleKey: 'reading_training',
        title: item.title,
        content: item
      }));
    } catch (e) {
      console.warn(`  수동 파일 로드 실패 (fallback): ${manualFile} — ${e.message}`);
    }
  }

  // fallback: 자동 생성
  const contents = [];
  const sections = [];

  const concept = ms['개념'];
  if (concept) {
    const passage = getVal(concept, '개념_배경지식_지문', '개념_지문', '개념_훈련_제목');
    if (passage && String(passage).length > 50) {
      sections.push({ label: '개념', passage: String(passage) });
    }
  }

  const nonfic = ms['비문학'];
  if (nonfic) {
    const passage = getVal(nonfic, '비문학_지문');
    if (passage) sections.push({ label: '비문학', passage: String(passage) });
  }

  const lit = ms['문학'];
  if (lit) {
    const passage = getVal(lit, '문학_작품_지문');
    if (passage) sections.push({ label: '문학', passage: String(passage) });
  }

  const gram = ms['문법'];
  if (gram) {
    const passage = getVal(gram, '문법_지문');
    if (passage && String(passage).length > 50) {
      sections.push({ label: '문법', passage: String(passage) });
    }
  }

  for (const sec of sections) {
    const paragraphs = toParagraphs(sec.passage);
    if (paragraphs.length === 0) continue;

    const timeline = paragraphs.slice(0, 5).map((p, i) => {
      const words = p.text.split(/\s+/);
      const keyPhrase = words.slice(0, Math.min(5, words.length)).join(' ');
      return {
        stepId: `int-${i + 1}`,
        highlight: { ranges: [{ paragraphId: p.id, start: 0, end: Math.min(50, p.text.length) }] },
        question: {
          prompt: `이 부분에서 핵심 내용은?`,
          choices: [
            { id: 'A', text: keyPhrase.slice(0, 30) },
            { id: 'B', text: '해당 없음' },
            { id: 'C', text: words.length > 3 ? words.slice(-3).join(' ').slice(0, 30) : '기타' },
          ],
          answerId: 'A',
          scoring: { correctDeltaSec: 15, wrongDeltaSec: -15 }
        }
      };
    });

    const recallCards = paragraphs.slice(0, 3).map((p, i) => ({
      id: `rc-${i + 1}`,
      front: p.text.slice(0, 60) + '...',
      back: p.text.slice(0, 120)
    }));

    const subArea = SUB_AREA_MAP[sec.label] || sec.label.toUpperCase();
    const contentId = `pro_read_${level.levelId.toLowerCase()}_ch${chapterNum}_${subArea}`;
    contents.push({
      id: contentId,
      contentType: 'PRO_READING',
      levelId: level.levelId,
      area: 'READING',
      subArea,
      moduleKey: 'reading_training',
      title: `${level.prefix} ${chapterNum}장 ${sec.label} 독해`,
      content: {
        contentType: 'PRO_READING',
        title: `${level.prefix} ${chapterNum}장 ${sec.label} 독해`,
        targetLevel: level.levelId,
        area: 'READING',
        subArea,
        timeLimitSec: 300,
        seedReward: { seedType: 'seed_rice', count: 3, multiplier: 1 },
        payload: {
          passage: { paragraphs },
          intensive: { timeline },
          recall: { cards: recallCards },
          confirm: { questions: [] }
        }
      }
    });
  }

  return contents;
}

// ─── 2. 어휘 콘텐츠 생성 (worksheet_quiz, PRO_VOCAB) ───
// generated/pro-vocab/ 에 수동 작성된 파일이 있으면 우선 사용, 없으면 자동 생성 fallback
function generateVocab(ms, level, chapterNum) {
  // 수동 작성 파일 확인
  const manualFile = join(PRO_VOCAB_DIR, `${level.levelId}_ch${String(chapterNum).padStart(2, '0')}.json`);
  if (existsSync(manualFile)) {
    try {
      const vocabData = JSON.parse(readFileSync(manualFile, 'utf-8'));
      const contentId = `pro_vocab_${level.levelId.toLowerCase()}_ch${chapterNum}`;
      return [{
        id: contentId,
        contentType: 'PRO_VOCAB',
        levelId: level.levelId,
        area: 'VOCAB',
        subArea: 'PRO',
        moduleKey: 'worksheet_quiz',
        title: vocabData.title,
        content: vocabData
      }];
    } catch (e) {
      console.warn(`  어휘 수동 파일 로드 실패 (fallback): ${manualFile} — ${e.message}`);
    }
  }

  // fallback: 기존 자동 생성
  const concept = ms['개념'];
  if (!concept) return [];

  const vocabList = getVal(concept, '개념_어휘_목록') || [];
  if (vocabList.length === 0) return [];

  const questions = [];
  let qIdx = 0;

  // 어휘 → 뜻 객관식
  for (const vocab of vocabList) {
    qIdx++;
    const word = vocab['어휘'] || vocab.어휘 || '';
    const meaning = vocab['뜻'] || vocab.뜻 || '';
    if (!word || !meaning) continue;

    // 다른 어휘들에서 오답 생성
    const distractors = vocabList
      .filter(v => (v['어휘'] || v.어휘) !== word)
      .slice(0, 3)
      .map(v => v['뜻'] || v.뜻 || '');

    const choices = [
      { id: 'A', text: meaning },
      ...distractors.map((d, i) => ({ id: String.fromCharCode(66 + i), text: d }))
    ].slice(0, 4);

    // 셔플
    const shuffled = choices.sort(() => Math.random() - 0.5);
    const answerId = shuffled.find(c => c.text === meaning)?.id || 'A';

    questions.push({
      id: `vq-${qIdx}`,
      type: 'MULTI_CHOICE',
      stem: `'${word}'의 뜻으로 알맞은 것은?`,
      choices: shuffled,
      answerId,
      scoring: { correctDeltaSec: 10, wrongDeltaSec: -10 }
    });
  }

  // 빈칸 채우기 (어휘 연결 문제에서)
  const fillProblems = getVal(concept, '개념_어휘_연결_문제', '개념_어휘_빈칸_문제') || [];
  const fillAnswers = getVal(concept, '개념_어휘_연결_정답', '개념_어휘_빈칸_정답') || {};
  for (const prob of fillProblems) {
    qIdx++;
    const num = String(prob['번호'] || prob.번호 || qIdx);
    const stem = prob['문제'] || prob.문제 || '';
    const answer = fillAnswers[num] || '';
    if (!stem || !answer) continue;

    // FILL_BLANKS로 변환
    const template = stem.includes('____') ? stem : stem + ' ____';
    const answerChoices = [answer, ...vocabList.slice(0, 3).map(v => v['어휘'] || v.어휘).filter(w => w !== answer)].slice(0, 4);

    questions.push({
      id: `vq-${qIdx}`,
      type: 'FILL_BLANKS',
      template,
      blanks: [{
        id: 'b1',
        answerId: 'c1',
        choices: answerChoices.map((t, i) => ({ id: `c${i + 1}`, text: t }))
      }],
      scoring: { correctDeltaSec: 10, wrongDeltaSec: -10 }
    });
  }

  if (questions.length === 0) return [];

  const contentId = `pro_vocab_${level.levelId.toLowerCase()}_ch${chapterNum}`;
  return [{
    id: contentId,
    contentType: 'PRO_VOCAB',
    levelId: level.levelId,
    area: 'VOCAB',
    subArea: 'PRO',
    moduleKey: 'worksheet_quiz',
    title: `${level.prefix} ${chapterNum}장 어휘`,
    content: {
      contentType: 'PRO_VOCAB',
      title: `${level.prefix} ${chapterNum}장 어휘`,
      targetLevel: level.levelId,
      area: 'VOCAB',
      subArea: 'PRO',
      timeLimitSec: 300,
      seedReward: { seedType: 'seed_wheat', count: 3, multiplier: 1 },
      payload: { questions }
    }
  }];
}

// ─── 3. 배경지식 콘텐츠 생성 (background_knowledge, PRO_BACKGROUND) ───
function generateBackground(ms, level, chapterNum) {
  // 수동 작성 파일 우선 로드
  const manualFile = join(PRO_BACKGROUND_DIR,
    `${level.levelId}_ch${String(chapterNum).padStart(2, '0')}.json`);
  if (existsSync(manualFile)) {
    try {
      const bgData = JSON.parse(readFileSync(manualFile, 'utf-8'));
      const contentId = `pro_bg_${level.levelId.toLowerCase()}_ch${chapterNum}`;
      return [{
        id: contentId,
        contentType: 'PRO_BACKGROUND',
        levelId: level.levelId,
        area: 'BACKGROUND',
        subArea: 'PRO',
        moduleKey: 'background_knowledge',
        title: bgData.title,
        content: bgData
      }];
    } catch (e) {
      console.warn(`  배경지식 수동 파일 로드 실패 (fallback): ${manualFile}`);
    }
  }

  // fallback: 기존 자동 생성
  const concept = ms['개념'];
  if (!concept) return [];

  const oxProblems = getVal(concept, '개념_배경지식_OX_문제') || [];
  const oxAnswers = getVal(concept, '개념_배경지식_OX_정답') || {};
  const oxExplanations = getVal(concept, '개념_배경지식_OX_해설') || {};

  const questions = [];
  let qIdx = 0;

  // OX 문제 → MULTI_CHOICE로 변환
  for (const prob of oxProblems) {
    qIdx++;
    const num = String(prob['번호'] || prob.번호 || qIdx);
    const stem = prob['문제'] || prob.문제 || '';
    const answer = oxAnswers[num] || '';
    if (!stem) continue;

    questions.push({
      id: `bg-${qIdx}`,
      type: 'MULTI_CHOICE',
      stem: stem,
      choices: [
        { id: 'O', text: 'O (맞다)' },
        { id: 'X', text: 'X (틀리다)' }
      ],
      answerId: answer === 'O' ? 'O' : 'X',
      explanation: oxExplanations[num] || '',
      scoring: { correctDeltaSec: 10, wrongDeltaSec: -10 }
    });
  }

  // 괄호 선택형 문제 추가 (소쉬르)
  const bracketProblems = getVal(concept, '개념_훈련_괄호_선택형_문제') || [];
  const bracketAnswers = getVal(concept, '개념_훈련_괄호_선택형_정답') || {};
  for (const prob of bracketProblems) {
    qIdx++;
    const num = String(prob['번호'] || prob.번호 || qIdx);
    const stem = prob['문제'] || prob.문제 || '';
    const answer = bracketAnswers[num] || '';
    if (!stem || !answer) continue;

    questions.push({
      id: `bg-${qIdx}`,
      type: 'MULTI_CHOICE',
      stem: stem,
      choices: [
        { id: 'A', text: answer },
        { id: 'B', text: '해당 없음' }
      ],
      answerId: 'A',
      scoring: { correctDeltaSec: 10, wrongDeltaSec: -10 }
    });
  }

  if (questions.length === 0) return [];

  const contentId = `pro_bg_${level.levelId.toLowerCase()}_ch${chapterNum}`;
  return [{
    id: contentId,
    contentType: 'PRO_BACKGROUND',
    levelId: level.levelId,
    area: 'BACKGROUND',
    subArea: 'PRO',
    moduleKey: 'background_knowledge',
    title: `${level.prefix} ${chapterNum}장 배경지식`,
    content: {
      contentType: 'PRO_BACKGROUND',
      title: `${level.prefix} ${chapterNum}장 배경지식`,
      targetLevel: level.levelId,
      area: 'BACKGROUND',
      subArea: 'PRO',
      timeLimitSec: 300,
      seedReward: { seedType: 'seed_corn', count: 3, multiplier: 1 },
      payload: { questions }
    }
  }];
}

// ─── 4. 논리사고력 콘텐츠 생성 (logic_reasoning, PRO_LOGIC) ───
// 수동 작성 파일만 사용 (자동 생성 완전 제거)
function generateLogic(ms, level, chapterNum) {
  const manualFile = join(PRO_LOGIC_DIR,
    `${level.levelId}_ch${String(chapterNum).padStart(2, '0')}.json`);
  if (existsSync(manualFile)) {
    try {
      const logicData = JSON.parse(readFileSync(manualFile, 'utf-8'));
      const contentId = `pro_logic_${level.levelId.toLowerCase()}_ch${chapterNum}`;
      return [{
        id: contentId,
        contentType: 'PRO_LOGIC',
        levelId: level.levelId,
        area: 'LOGIC',
        subArea: 'PRO',
        moduleKey: 'logic_reasoning',
        title: logicData.title,
        content: logicData
      }];
    } catch (e) {
      console.warn(`  논리사고력 수동 파일 로드 실패: ${manualFile}`);
    }
  }
  // 수동 파일 없으면 빈 배열 반환
  return [];
}

// ─── 정답과 해설 생성 헬퍼 ───

// 레벨 타입별 섹션 처리 순서 (교재 스타일)
function getSectionOrder(levelType) {
  switch (levelType) {
    case 'saussure': return ['개념', '문학', '비문학', '문법', '주간_실력_확인'];
    case 'frege': return ['어휘', '개념', '문학', '비문학', '문법', '주간_실력_확인'];
    case 'russell': return ['문법', '개념', '문학', '비문학'];
    default: return ['개념', '문학', '비문학', '문법', '주간_실력_확인'];
  }
}

// 중첩 활동 객체를 플랫하게 풀기 (프레게 활동 구조 지원)
// 키가 "활동N"으로 끝나는 객체만 중첩 컨테이너로 인식 (소쉬르의 플랫 키와 구분)
function flattenSection(secData) {
  const flat = {};
  for (const [key, value] of Object.entries(secData)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && /활동\d+$/.test(key)) {
      for (const [subKey, subValue] of Object.entries(value)) {
        flat[subKey] = subValue;
      }
    } else {
      flat[key] = value;
    }
  }
  return flat;
}

// 그룹 제목 생성: 섹션 접두사 제거 후 읽기 좋게 변환
function deriveGroupTitle(basePath, secName) {
  let title = basePath;
  if (secName === '주간_실력_확인') {
    if (title.startsWith('주간_실력_확인_')) title = title.slice('주간_실력_확인_'.length);
    else if (title.startsWith('실력_확인_')) title = title.slice('실력_확인_'.length);
  } else if (title.startsWith(secName + '_')) {
    title = title.slice(secName.length + 1);
  }
  title = title.replace(/_/g, ' ').trim();
  return title || basePath.replace(/_/g, ' ');
}

// 정답 키의 표시 타입 결정
function determineDisplayType(ansKey, ansValue) {
  if (ansKey.includes('_객관식_')) return 'choice';
  if (ansKey.includes('_OX_')) return 'ox';
  if (ansKey.includes('_서술형_') || ansKey.includes('_글쓰기_')) return 'essay';
  if (ansKey.endsWith('_모범_답안')) return 'essay';
  if (typeof ansValue === 'string') return 'fill';
  if (typeof ansValue === 'object' && !Array.isArray(ansValue)) {
    const vals = Object.values(ansValue);
    if (vals.length > 0 && typeof vals[0] === 'object' && vals[0] !== null && !Array.isArray(vals[0])) {
      return 'nested';
    }
  }
  return 'short';
}

// 문제 텍스트 추출 (배열/객체 모두 지원)
function getQuestionText(questions, key) {
  if (!questions) return '';
  if (Array.isArray(questions)) {
    const q = questions.find(q => String(q['번호'] || q.번호) === key);
    return q ? String(q['문제'] || q.문제 || '') : '';
  }
  if (typeof questions === 'object') {
    const q = questions[key];
    if (typeof q === 'string') return q;
    if (q && typeof q === 'object' && !Array.isArray(q)) return String(q['문제'] || q.문제 || '');
  }
  return '';
}

// 해설 텍스트 추출 (객체/배열/문자열 모두 지원)
function getExplanationText(explanations, key) {
  if (!explanations) return '';
  if (typeof explanations === 'string') return explanations;
  if (Array.isArray(explanations)) {
    const idx = parseInt(key) - 1;
    if (idx < 0 || idx >= explanations.length) return '';
    const val = explanations[idx];
    return Array.isArray(val) ? val.join(' ') : String(val);
  }
  if (typeof explanations === 'object') {
    const val = explanations[key];
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.join(' ');
    return String(val);
  }
  return '';
}

// 선택지 추출
function getChoicesForKey(choices, key) {
  if (!choices || typeof choices !== 'object') return null;
  const arr = choices[key];
  if (Array.isArray(arr)) return arr.map(c => String(c));
  return null;
}

// 정답 값 → items 배열 변환
function buildAnswerItems(ansValue, questions, choices, explanations) {
  // 문자열 정답 → 단일 항목 (빈칸 채우기)
  if (typeof ansValue === 'string') {
    return [{ num: '', answer: ansValue }];
  }
  if (typeof ansValue !== 'object' || Array.isArray(ansValue)) {
    return [{ num: '', answer: String(ansValue) }];
  }

  const items = [];
  const sortedKeys = Object.keys(ansValue).sort((a, b) => {
    const na = parseInt(a), nb = parseInt(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  for (const key of sortedKeys) {
    const ans = ansValue[key];

    // 중첩 객체 정답 (문학_해설_정답: {"1": {"1": "답", "2": "답"}})
    if (ans && typeof ans === 'object' && !Array.isArray(ans)) {
      let nestedQuestions = null;
      if (questions && typeof questions === 'object' && !Array.isArray(questions)) {
        nestedQuestions = questions[key];
      }
      const subKeys = Object.keys(ans).sort((a, b) => {
        const na = parseInt(a), nb = parseInt(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.localeCompare(b);
      });
      for (const subKey of subKeys) {
        const item = { num: `${key}-${subKey}`, answer: String(ans[subKey]) };
        if (Array.isArray(nestedQuestions)) {
          const q = nestedQuestions.find(q => String(q['번호'] || q.번호) === subKey);
          if (q) item.question = String(q['문제'] || q.문제 || '');
        }
        items.push(item);
      }
      continue;
    }

    // 배열 정답 (문장_독해_정답: {"1": ["④", "④", "③"]})
    if (Array.isArray(ans)) {
      const item = { num: key, answer: ans.map(a => String(a)).join(', ') };
      const q = getQuestionText(questions, key);
      if (q) item.question = q;
      items.push(item);
      continue;
    }

    // 일반 정답 (문자열/숫자)
    const item = { num: key, answer: String(ans) };
    const question = getQuestionText(questions, key);
    if (question) item.question = question;
    const explanation = getExplanationText(explanations, key);
    if (explanation) item.explanation = explanation;
    const itemChoices = getChoicesForKey(choices, key);
    if (itemChoices) item.choices = itemChoices;
    items.push(item);
  }

  return items;
}

// ─── 5. 정답과 해설 콘텐츠 생성 (answer_key, PRO_ANSWER) ───
function generateAnswerKey(ms, level, chapterNum) {
  const sectionOrder = getSectionOrder(level.type);
  const sections = [];

  for (const secName of sectionOrder) {
    const secData = ms[secName];
    if (!secData || typeof secData !== 'object') continue;
    if (Object.keys(secData).length === 0) continue;

    // 중첩 활동 객체 플랫하게 풀기 (프레게)
    const flat = flattenSection(secData);

    // 정답/모범답안 키 수집 (원본 순서 유지)
    const answerKeys = [];
    for (const k of Object.keys(flat)) {
      if (k.endsWith('_정답') || k.endsWith('_모범_답안')) {
        answerKeys.push(k);
      }
    }

    const groups = [];

    for (const ansKey of answerKeys) {
      const ansValue = flat[ansKey];
      if (ansValue === undefined || ansValue === null) continue;
      if (typeof ansValue === 'object' && !Array.isArray(ansValue) && Object.keys(ansValue).length === 0) continue;
      if (typeof ansValue === 'string' && ansValue.trim() === '') continue;

      // 기본 경로 (관련 키 찾기용)
      let basePath;
      if (ansKey.endsWith('_모범_답안')) {
        basePath = ansKey.slice(0, -'_모범_답안'.length);
      } else {
        basePath = ansKey.slice(0, -'_정답'.length);
      }

      // 관련 키 탐색
      const questions = flat[basePath + '_문제'] ?? null;
      const choices = flat[basePath + '_선택지'] ?? null;
      const explanations = flat[basePath + '_해설'] ?? null;

      // 그룹 제목 및 타입
      const groupTitle = deriveGroupTitle(basePath, secName);
      const displayType = determineDisplayType(ansKey, ansValue);

      // 항목 생성
      const items = buildAnswerItems(ansValue, questions, choices, explanations);

      if (items.length > 0) {
        groups.push({ title: groupTitle, type: displayType, items });
      }
    }

    if (groups.length > 0) {
      sections.push({ title: secName, groups });
    }
  }

  if (sections.length === 0) return [];

  const contentId = `pro_answer_${level.levelId.toLowerCase()}_ch${chapterNum}`;
  return [{
    id: contentId,
    contentType: 'PRO_ANSWER',
    levelId: level.levelId,
    area: 'ANSWER',
    subArea: 'PRO',
    moduleKey: 'answer_key',
    title: `${level.prefix} ${chapterNum}장 정답과 해설`,
    content: {
      contentType: 'PRO_ANSWER',
      title: `${level.prefix} ${chapterNum}장 정답과 해설`,
      targetLevel: level.levelId,
      area: 'ANSWER',
      subArea: 'PRO',
      timeLimitSec: 9999,
      seedReward: { seedType: 'seed_rice', count: 0, multiplier: 0 },
      payload: { sections }
    }
  }];
}

// ─── 6. 테스트 문제 생성 ───
// generated/pro-tests/ 에 수동 작성된 파일이 있으면 우선 사용, 없으면 원고 기반 자동 생성 fallback
function generateTest(ms, level, chapterNum) {
  // 수동 작성 파일 확인
  const manualFile = join(PRO_TESTS_DIR,
    `${level.levelId}_ch${String(chapterNum).padStart(2, '0')}.json`);
  if (existsSync(manualFile)) {
    try {
      let raw = readFileSync(manualFile, 'utf-8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      const testData = JSON.parse(raw);
      // 수동 파일은 { questions: [...] } 형태 또는 배열 형태 지원
      const questions = Array.isArray(testData) ? testData : (testData.questions || []);
      if (questions.length > 0) {
        console.log(`    ✓ 수동 테스트 로드: ${manualFile} (${questions.length}문항)`);
        return { questions };
      }
    } catch (e) {
      console.warn(`  수동 테스트 파일 로드 실패 (fallback): ${manualFile} — ${e.message}`);
    }
  }

  // fallback: 원고 기반 자동 생성
  const questions = [];
  let qNum = 0;

  // 주간_실력_확인 섹션에서 문제 추출
  const weekly = ms['주간_실력_확인'];
  if (!weekly) return { questions: [] };

  // 키 접두사 확인 (소쉬르: '실력_확인_', 프레게/러셀: '주간_실력_확인_')
  const allKeys = Object.keys(weekly);
  const prefix = allKeys.find(k => k.startsWith('주간_실력_확인_')) ? '주간_실력_확인_' : '실력_확인_';

  // 객관식 문제
  const mcProblems = weekly[`${prefix}객관식_문제`] || [];
  const mcChoices = weekly[`${prefix}객관식_선택지`] || {};
  const mcAnswers = weekly[`${prefix}객관식_정답`] || {};
  const mcExpl = weekly[`${prefix}객관식_해설`] || {};
  const mcPassages = weekly[`${prefix}문제_지문`] || {};

  for (const prob of mcProblems) {
    qNum++;
    const num = String(prob['번호'] || prob.번호 || qNum);
    const stem = prob['문제'] || prob.문제 || '';
    const choiceArr = mcChoices[num] || [];
    const answer = circledToNum(mcAnswers[num]);
    const explanation = mcExpl[num] || '';
    const passageInfo = mcPassages[num];
    let passage = '';
    if (passageInfo) {
      passage = typeof passageInfo === 'string' ? passageInfo :
        passageInfo['지문'] || passageInfo.지문 || '';
    }

    questions.push({
      number: qNum,
      type: '객관식',
      domain: '종합',
      points: 3,
      stem: stem,
      passage: passage || null,
      correctAnswer: answer,
      choices: toChoices(choiceArr),
      choiceExplanations: explanation ? { [answer]: explanation } : {},
    });
  }

  // 서술형 문제
  const essayProblems = weekly[`${prefix}서술형_문제`] || [];
  const essayAnswers = weekly[`${prefix}서술형_모범_답안`] || {};
  const essayExpl = weekly[`${prefix}서술형_해설`] || {};

  for (const prob of essayProblems) {
    qNum++;
    const num = String(prob['번호'] || prob.번호 || qNum);
    const stem = prob['문제'] || prob.문제 || '';
    const modelAnswer = essayAnswers[num] || '';

    // 모범답안에서 키워드 추출 (단어 기준)
    const keywords = extractKeywords(modelAnswer);

    questions.push({
      number: qNum,
      type: '서술형',
      domain: '종합',
      points: 8,
      stem: stem,
      passage: null,
      correctAnswer: null,
      choiceExplanations: {},
      modelAnswer: modelAnswer,
      essayKeywords: keywords,
      essayRubric: `모범답안의 핵심 키워드(${keywords.map(k => k.keyword).join(', ')})가 포함되어야 합니다. ${questions.length + 1}번 문항은 ${8}점 만점입니다.`,
    });
  }

  return { questions };
}

// 모범답안에서 키워드 추출
function extractKeywords(text) {
  if (!text || typeof text !== 'string') return [];
  // 2글자 이상 단어, 조사 제외, 최대 5개
  const words = text.replace(/[^가-힣a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  const stopWords = new Set(['것이다', '때문에', '그리고', '하지만', '그러나', '따라서', '이것은', '그것은', '있다', '없다', '된다', '한다', '이다', '아니다', '위해', '통해', '대한', '또한', '이를', '이것']);
  const unique = [...new Set(words)].filter(w => !stopWords.has(w));
  return unique.slice(0, 5).map((kw, i) => ({ keyword: kw, weight: 5 - i }));
}


// ─── 메인 실행 ───
console.log('=== 프로모드 전체 콘텐츠 생성 시작 ===\n');

const allBatchItems = [];
const allChapters = [];
const allTests = [];
let totalContents = 0;
let globalChapterNum = 0;

for (const level of LEVELS) {
  console.log(`\n[${level.levelId}] ${level.folder} 처리 중...`);
  const levelBatch = [];

  for (let ch = 1; ch <= 20; ch++) {
    const ms = readManuscript(level, ch);
    if (!ms) continue;

    globalChapterNum++;
    const chapterId = `pch_${level.levelId.toLowerCase()}_${String(ch).padStart(2, '0')}`;

    // 6종 콘텐츠 생성
    const reading = generateReading(ms, level, ch);
    const vocab = generateVocab(ms, level, ch);
    const background = generateBackground(ms, level, ch);
    const logic = generateLogic(ms, level, ch);
    const answerKey = generateAnswerKey(ms, level, ch);
    const test = generateTest(ms, level, ch);

    const allContent = [...reading, ...vocab, ...background, ...logic, ...answerKey];
    totalContents += allContent.length;

    // batch import 아이템으로 변환
    for (const c of allContent) {
      levelBatch.push({
        contentType: c.contentType,
        levelId: c.levelId,
        area: c.area,
        subArea: c.subArea,
        dayIndex: ch,
        moduleKey: c.moduleKey,
        schemaVersion: '1.0',
        content: c.content,
        _generatedId: c.id,
      });
    }

    // 챕터 정보
    const chapterTitle = ms['메타']?.['과정'] ?
      `${ms['메타']['과정']} ${ch}장` :
      `${level.prefix} ${ch}장`;

    allChapters.push({
      chapterId,
      levelId: level.levelId,
      bookNumber: level.bookNum,
      chapterNumber: ch,
      globalChapterNumber: globalChapterNum,
      title: chapterTitle,
      items: [
        { type: 'reading', contentId: reading[0]?.id || null, order: 1 },
        { type: 'vocab', contentId: vocab[0]?.id || null, order: 2 },
        { type: 'background', contentId: background[0]?.id || null, order: 3 },
        { type: 'logic', contentId: logic[0]?.id || null, order: 4 },
        { type: 'answer', contentId: answerKey[0]?.id || null, order: 5 },
        { type: 'test', contentId: null, order: 6 },
      ],
      test: test.questions.length > 0 ? {
        title: `${chapterTitle} 테스트`,
        questions: test.questions,
        totalQuestions: test.questions.length,
        totalPoints: test.questions.reduce((s, q) => s + q.points, 0),
      } : null,
    });

    if (test.questions.length > 0) {
      allTests.push({
        chapterId,
        levelId: level.levelId,
        title: `${chapterTitle} 테스트`,
        questions: test.questions,
      });
    }

    process.stdout.write(`  챕터${ch}: 콘텐츠 ${allContent.length}개, 테스트 문항 ${test.questions.length}개\n`);
  }

  allBatchItems.push(...levelBatch);
  console.log(`  → ${level.levelId} 완료: ${levelBatch.length}개 콘텐츠`);
}

// ─── 출력 ───
console.log(`\n=== 생성 완료 ===`);
console.log(`총 콘텐츠: ${totalContents}개`);
console.log(`총 챕터: ${allChapters.length}개`);
console.log(`총 테스트: ${allTests.length}개`);

// 레벨별로 분할 출력 (파일 크기 관리)
for (const level of LEVELS) {
  const items = allBatchItems.filter(i => i.levelId === level.levelId);
  if (items.length === 0) continue;

  // batch import 형식 (_generatedId 제거)
  const batchPayload = { items: items.map(({ _generatedId, ...rest }) => rest) };
  const fp = join(OUTPUT_DIR, `batch-import-${level.levelId.toLowerCase()}.json`);
  writeFileSync(fp, JSON.stringify(batchPayload, null, 2), 'utf-8');
  console.log(`  ${fp} (${items.length}개)`);
}

// 챕터 설정 출력
writeFileSync(
  join(OUTPUT_DIR, 'chapters-setup.json'),
  JSON.stringify(allChapters, null, 2),
  'utf-8'
);
console.log(`  chapters-setup.json (${allChapters.length}개)`);

// 테스트 출력
writeFileSync(
  join(OUTPUT_DIR, 'tests-setup.json'),
  JSON.stringify(allTests, null, 2),
  'utf-8'
);
console.log(`  tests-setup.json (${allTests.length}개)`);

// ID 매핑 파일 (batch import 결과와 매칭용)
const idMapping = allBatchItems.map(i => ({
  generatedId: i._generatedId,
  contentType: i.contentType,
  levelId: i.levelId,
  dayIndex: i.dayIndex,
}));
writeFileSync(
  join(OUTPUT_DIR, 'id-mapping.json'),
  JSON.stringify(idMapping, null, 2),
  'utf-8'
);

console.log('\n생성 완료!');
