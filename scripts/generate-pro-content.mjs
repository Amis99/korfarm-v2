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
  { folder: '소쉬르1', levelId: 'SAUSSURE_1', prefix: '소쉬르1', bookNum: 1, type: 'saussure' },
  { folder: '소쉬르2', levelId: 'SAUSSURE_2', prefix: '소쉬르2', bookNum: 2, type: 'saussure' },
  { folder: '소쉬르3', levelId: 'SAUSSURE_3', prefix: '소쉬르3', bookNum: 3, type: 'saussure' },
  { folder: '프레게1', levelId: 'FREGE_1', prefix: '프레게1', bookNum: 1, type: 'frege' },
  { folder: '프레게2', levelId: 'FREGE_2', prefix: '프레게2', bookNum: 2, type: 'frege' },
  { folder: '프레게3', levelId: 'FREGE_3', prefix: '프레게3', bookNum: 3, type: 'frege' },
  { folder: '러셀1', levelId: 'RUSSELL_1', prefix: '러셀1', bookNum: 1, type: 'russell' },
  { folder: '러셀2', levelId: 'RUSSELL_2', prefix: '러셀2', bookNum: 2, type: 'russell' },
  { folder: '러셀3', levelId: 'RUSSELL_3', prefix: '러셀3', bookNum: 3, type: 'russell' },
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
      return JSON.parse(raw);
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

// ─── 1. 독해 콘텐츠 생성 (reading_training) ───
function generateReading(ms, level, chapterNum) {
  const contents = [];
  const sections = [];

  // 개념 지문
  const concept = ms['개념'];
  if (concept) {
    const passage = getVal(concept, '개념_배경지식_지문', '개념_훈련_제목');
    if (passage && String(passage).length > 50) {
      sections.push({ label: '개념', passage: String(passage) });
    }
  }

  // 비문학 지문
  const nonfic = ms['비문학'];
  if (nonfic) {
    const passage = getVal(nonfic, '비문학_지문');
    if (passage) sections.push({ label: '비문학', passage: String(passage) });
  }

  // 문학 지문
  const lit = ms['문학'];
  if (lit) {
    const passage = getVal(lit, '문학_작품_지문');
    if (passage) sections.push({ label: '문학', passage: String(passage) });
  }

  // 문법 지문 (프레게/러셀)
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

    // 타임라인: 각 문단에 대해 간단한 이해 확인 문제 생성
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

    // 리콜 카드
    const recallCards = paragraphs.slice(0, 3).map((p, i) => ({
      id: `rc-${i + 1}`,
      front: p.text.slice(0, 60) + '...',
      back: p.text.slice(0, 120)
    }));

    const contentId = `pro_read_${level.levelId.toLowerCase()}_ch${chapterNum}_${sec.label}`;
    contents.push({
      id: contentId,
      contentType: 'PRO_READING',
      levelId: level.levelId,
      area: 'READING',
      subArea: sec.label.toUpperCase(),
      moduleKey: 'reading_training',
      title: `${level.prefix} ${chapterNum}장 ${sec.label} 독해`,
      content: {
        contentType: 'PRO_READING',
        title: `${level.prefix} ${chapterNum}장 ${sec.label} 독해`,
        targetLevel: level.levelId,
        area: 'READING',
        subArea: sec.label.toUpperCase(),
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
function generateVocab(ms, level, chapterNum) {
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

// ─── 3. 배경지식 콘텐츠 생성 (worksheet_quiz, PRO_BACKGROUND) ───
function generateBackground(ms, level, chapterNum) {
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
    moduleKey: 'worksheet_quiz',
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

// ─── 4. 논리사고력 콘텐츠 생성 (worksheet_quiz, PRO_LOGIC) ───
function generateLogic(ms, level, chapterNum) {
  const questions = [];
  let qIdx = 0;

  // 문장 독해 문제에서 논리 문제 추출
  const sources = [
    ms['비문학'],
    ms['문법'],
    ms['문학'],
  ].filter(Boolean);

  for (const section of sources) {
    // 문장 독해 문제
    const sentences = getVal(section, '문장_독해_훈련_문장', '비문학_문장_독해_문장', '문학_문장_독해_문장', '문법_문장_독해_문제') || [];
    const sentenceProblems = getVal(section, '문장_독해_훈련_문제', '비문학_문장_독해_문제', '문학_문장_독해_문제') || [];
    const sentenceChoices = getVal(section, '비문학_문장_독해_선택지') || {};
    const sentenceAnswers = getVal(section, '문장_독해_훈련_정답', '비문학_문장_독해_정답', '문학_문장_독해_정답') || {};

    for (const prob of sentenceProblems) {
      qIdx++;
      const num = String(prob['번호'] || prob.번호 || qIdx);
      const stem = prob['문제'] || prob.문제 || '';
      const answer = sentenceAnswers[num] || '';
      if (!stem) continue;

      const choiceArr = sentenceChoices[num];
      if (choiceArr && Array.isArray(choiceArr)) {
        const choices = toChoices(choiceArr);
        const answerId = circledToNum(answer);
        questions.push({
          id: `lg-${qIdx}`,
          type: 'MULTI_CHOICE',
          stem: stem,
          choices,
          answerId,
          scoring: { correctDeltaSec: 15, wrongDeltaSec: -15 }
        });
      } else if (answer) {
        // 단답형 → MULTI_CHOICE로 변환 (정답 + 오답 보기)
        questions.push({
          id: `lg-${qIdx}`,
          type: 'MULTI_CHOICE',
          stem: stem,
          choices: [
            { id: 'A', text: String(answer) },
            { id: 'B', text: '해당 없음' },
          ],
          answerId: 'A',
          scoring: { correctDeltaSec: 15, wrongDeltaSec: -15 }
        });
      }
    }
  }

  if (questions.length === 0) return [];

  const contentId = `pro_logic_${level.levelId.toLowerCase()}_ch${chapterNum}`;
  return [{
    id: contentId,
    contentType: 'PRO_LOGIC',
    levelId: level.levelId,
    area: 'LOGIC',
    subArea: 'PRO',
    moduleKey: 'worksheet_quiz',
    title: `${level.prefix} ${chapterNum}장 논리사고력`,
    content: {
      contentType: 'PRO_LOGIC',
      title: `${level.prefix} ${chapterNum}장 논리사고력`,
      targetLevel: level.levelId,
      area: 'LOGIC',
      subArea: 'PRO',
      timeLimitSec: 300,
      seedReward: { seedType: 'seed_grape', count: 3, multiplier: 1 },
      payload: { questions }
    }
  }];
}

// problems 값이 배열이 아닌 객체({1:[...], 2:[...]})일 때 배열로 변환
function ensureArray(val) {
  if (val == null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') {
    // {1: [...items], 2: [...items]} → flatten
    const entries = Object.values(val);
    const flat = [];
    for (const e of entries) {
      if (Array.isArray(e)) flat.push(...e);
      else flat.push(e);
    }
    return flat;
  }
  return [];
}

// ─── 5. 모범답안 콘텐츠 생성 (answer_key, PRO_ANSWER) ───
function generateAnswerKey(ms, level, chapterNum) {
  const sections = [];

  // 각 섹션에서 정답/해설 추출
  const sectionNames = ['개념', '문법', '문학', '비문학'];

  for (const secName of sectionNames) {
    const sec = ms[secName];
    if (!sec) continue;

    const items = [];
    let itemNum = 0;

    // 모든 키를 순회하면서 정답/해설 찾기
    const allKeys = getAllKeysFlat(sec);

    // 객관식 문제+정답+해설
    for (const keySet of findQuestionSets(allKeys, '객관식')) {
      const problems = ensureArray(resolveVal(sec, keySet.problems));
      const answers = resolveVal(sec, keySet.answers) || {};
      const explanations = resolveVal(sec, keySet.explanations) || {};
      const choices = resolveVal(sec, keySet.choices) || {};

      for (const prob of problems) {
        itemNum++;
        const num = String(prob['번호'] || prob.번호 || itemNum);
        items.push({
          number: itemNum,
          type: '객관식',
          question: prob['문제'] || prob.문제 || '',
          answer: answers[num] || '',
          explanation: explanations[num] || '',
          choices: choices[num] || []
        });
      }
    }

    // 서술형 문제+모범답안
    for (const keySet of findQuestionSets(allKeys, '서술형')) {
      const problems = ensureArray(resolveVal(sec, keySet.problems));
      const answers = resolveVal(sec, keySet.answers) || {};

      for (const prob of problems) {
        itemNum++;
        const num = String(prob['번호'] || prob.번호 || itemNum);
        items.push({
          number: itemNum,
          type: '서술형',
          question: prob['문제'] || prob.문제 || '',
          answer: '',
          modelAnswer: answers[num] || '',
        });
      }
    }

    // 단답형 문제+정답
    for (const keySet of findQuestionSets(allKeys, '단답형')) {
      const problems = ensureArray(resolveVal(sec, keySet.problems));
      const answers = resolveVal(sec, keySet.answers) || {};

      for (const prob of problems) {
        itemNum++;
        const num = String(prob['번호'] || prob.번호 || itemNum);
        items.push({
          number: itemNum,
          type: '단답형',
          question: prob['문제'] || prob.문제 || '',
          answer: answers[num] || '',
        });
      }
    }

    // OX 문제+정답+해설
    for (const keySet of findQuestionSets(allKeys, 'OX')) {
      const problems = ensureArray(resolveVal(sec, keySet.problems));
      const answers = resolveVal(sec, keySet.answers) || {};
      const explanations = resolveVal(sec, keySet.explanations) || {};

      for (const prob of problems) {
        itemNum++;
        const num = String(prob['번호'] || prob.번호 || itemNum);
        items.push({
          number: itemNum,
          type: 'OX',
          question: prob['문제'] || prob.문제 || '',
          answer: answers[num] || '',
          explanation: explanations[num] || '',
        });
      }
    }

    // 글쓰기 문제+모범답안
    for (const keySet of findQuestionSets(allKeys, '글쓰기')) {
      const problems = resolveVal(sec, keySet.problems);
      const answers = resolveVal(sec, keySet.answers);
      if (problems) {
        itemNum++;
        const probText = typeof problems === 'string' ? problems :
          Array.isArray(problems) ? problems.map(p => p['문제'] || p.문제 || '').join('\n') :
          typeof problems === 'object' ? Object.values(problems).map(v => v['문제'] || v.문제 || String(v)).join('\n') : '';
        const answerText = typeof answers === 'string' ? answers :
          typeof answers === 'object' ? Object.values(answers).join('\n') : '';
        items.push({
          number: itemNum,
          type: '글쓰기',
          question: probText,
          modelAnswer: answerText,
        });
      }
    }

    if (items.length > 0) {
      sections.push({ label: secName, items });
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
    title: `${level.prefix} ${chapterNum}장 모범답안`,
    content: {
      contentType: 'PRO_ANSWER',
      title: `${level.prefix} ${chapterNum}장 모범답안`,
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
function generateTest(ms, level, chapterNum) {
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

// ─── 헬퍼: 섹션 내 모든 키를 플랫하게 수집 ───
function getAllKeysFlat(obj) {
  if (!obj) return [];
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    keys.push(k);
    if (v && typeof v === 'object' && !Array.isArray(v) && k.includes('활동')) {
      for (const subK of Object.keys(v)) {
        keys.push(subK);
      }
    }
  }
  return keys;
}

// 섹션에서 값 해석 (플랫/네스트 모두)
function resolveVal(section, key) {
  if (!section || !key) return undefined;
  if (section[key] !== undefined) return section[key];
  for (const v of Object.values(section)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && v[key] !== undefined) {
      return v[key];
    }
  }
  return undefined;
}

// 문제 세트 찾기 (문제/정답/해설 키 그룹)
function findQuestionSets(keys, type) {
  const sets = [];
  const problemKeys = keys.filter(k => k.includes(`${type}_문제`));
  for (const pk of problemKeys) {
    const base = pk.replace(`${type}_문제`, '');
    sets.push({
      problems: pk,
      answers: keys.find(k => k === `${base}${type}_정답`) || keys.find(k => k === `${base}${type}_모범_답안`),
      explanations: keys.find(k => k === `${base}${type}_해설`),
      choices: keys.find(k => k === `${base}${type}_선택지`),
    });
  }
  return sets;
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
