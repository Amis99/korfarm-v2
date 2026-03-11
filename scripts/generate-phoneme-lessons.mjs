/**
 * 음운 변동 연습 HTML → 학습 JSON 38개 생성 스크립트
 *
 * 사용법: node scripts/generate-phoneme-lessons.mjs
 *
 * - HTML "연습하기 답" 섹션에서 192개 단어의 음운 분석 데이터를 추출
 * - 절음(연음만 있고 실질 변동 없는 단어)은 제외
 * - 5개씩 묶어 JSON 학습 파일 생성
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── 상수 ──
const HTML_PATH = path.join(ROOT, '참고용 기출 지문', '참고용 문법 자료', '문법_개념_학습_음운_문법요소.html');
const OUT_DIR = path.join(ROOT, 'frontend', 'public', 'farm', 'grammar');
const WORDS_PER_LESSON = 5;

const CONSONANTS = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const VOWELS = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];

const RULE_POOL = [
  '음절 끝소리 규칙', '비음화', '유음화', '구개음화', '된소리되기',
  'ㄴ첨가', '자음군 단순화', 'ㅎ탈락', '거센소리되기',
  'ㅡ탈락', '동음 탈락', '유음의 비음화', '반모음화'
];

const CHOICE_IDS = ['A', 'B', 'C', 'D'];

// ── 유틸 ──
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 정답 + 오답 3개 = 4개 선택지 (셔플, 정답 ID 반환) */
function makeChoices(answer, pool) {
  const wrongs = shuffle(pool.filter(x => x !== answer)).slice(0, 3);
  const four = shuffle([answer, ...wrongs]);
  const choices = four.map((text, i) => ({ id: CHOICE_IDS[i], text }));
  const answerId = choices.find(c => c.text === answer).id;
  return { choices, answerId };
}

/** 규칙 텍스트에서 핵심 규칙명 정규화 */
function normalizeRule(ruleText) {
  // "교체(음절 끝소리 규칙)" → "음절 끝소리 규칙"
  // "탈락(자음군 단순화, 11항)" → "자음군 단순화"
  // "축약(거센소리되기)" → "거센소리되기"
  // "첨가(ㄴ첨가)" → "ㄴ첨가"
  const m = ruleText.match(/\((.+?)(,.*)?\)/);
  if (m) return m[1].trim();
  return ruleText.trim();
}

function isConsonant(ch) { return CONSONANTS.includes(ch); }
function isVowel(ch) { return VOWELS.includes(ch); }

// ── HTML 파싱 ──
function parseHTML() {
  const html = fs.readFileSync(HTML_PATH, 'utf-8');
  const $ = cheerio.load(html);

  // 음운 변동 연습하기 답 섹션 찾기
  // answer-section들 중 음운 변동 관련 섹션을 찾는다
  const answerSections = $('div.answer-section');

  // 모든 answer-list + phoneme-analysis 쌍 수집
  const words = [];

  // 모든 answer-section 내의 answer-content에서 단어 블록 추출
  answerSections.each((si, section) => {
    const content = $(section).find('.answer-content');
    if (!content.length) return;

    // answer-content 내부의 자식들을 순회하면서 ol.answer-list와 div.phoneme-analysis 쌍을 매칭
    const children = content.children().toArray();

    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      if ($(el).is('ol.answer-list')) {
        const strong = $(el).find('strong');
        if (!strong.length) continue;
        const surface = strong.text().trim();
        const qNum = $(el).find('.q-num').text().trim();

        // 다음 형제가 phoneme-analysis인지 확인
        const next = children[i + 1];
        if (next && $(next).is('div.phoneme-analysis')) {
          const analysis = parsePhonemeAnalysis($, $(next));
          if (analysis) {
            words.push({ qNum: parseInt(qNum), surface, ...analysis });
          }
          i++; // phoneme-analysis 건너뜀
        }
      }
    }
  });

  console.log(`총 ${words.length}개 단어 파싱 완료`);
  return words;
}

/** phoneme-analysis div에서 cells + 변동 단계 추출 */
function parsePhonemeAnalysis($, analysisEl) {
  const lines = analysisEl.find('.phoneme-line').toArray();
  if (lines.length === 0) return null;

  // 1행: S행 (기저형)
  const sLine = $(lines[0]);
  const cells = parseCells($, sLine);

  // 2행~: 변동 단계
  const changeLines = [];
  for (let i = 1; i < lines.length; i++) {
    changeLines.push(parseChangeLine($, $(lines[i]), i));
  }

  return { cells, changeLines };
}

/** phoneme-line에서 셀 배열 추출 (S행용) */
function parseCells($, lineEl) {
  const cells = [];
  let cellNo = 1;
  lineEl.find('span.phoneme-box').each((_, box) => {
    const $box = $(box);
    const text = $box.text().trim();
    if ($box.hasClass('space')) return; // S행에서 space는 무시
    cells.push({ cellNo: cellNo++, text: text || ',' });
  });
  return cells;
}

/** 변동 라인에서 변경 정보 추출 */
function parseChangeLine($, lineEl, lineIndex) {
  // 규칙명 추출: phoneme-box 이후의 텍스트 노드
  let ruleText = '';
  const lineHtml = lineEl.html();

  // 규칙명: 전각 공백(　) 뒤의 텍스트, yeonum-tag 앞까지
  const ruleMatch = lineHtml.match(/\u3000([^<]+)/);
  if (ruleMatch) {
    ruleText = ruleMatch[1].trim();
  }

  // 연음 태그 존재 여부
  const hasYeonum = lineEl.find('.yeonum-tag').length > 0;

  // 변경된 셀 추출
  const changedCells = [];
  let cellNo = 1;
  const boxes = lineEl.find('span.phoneme-box').toArray();

  for (const box of boxes) {
    const $box = $(box);
    const text = $box.text().trim();
    const isSpace = $box.hasClass('space');
    const isSep = $box.hasClass('sep');
    const isRed = $box.hasClass('changed-red');
    const isGreen = $box.hasClass('changed-green');
    const isPurple = $box.hasClass('changed-purple');

    // space 박스도 cellNo 부여 (S행의 sep 위치에 대응)
    const cell = { cellNo: cellNo++, text: text || (isSpace ? ',' : ','), isRed, isGreen, isPurple, isSpace, isSep };
    if (isRed || isGreen || isPurple) {
      changedCells.push(cell);
    }
  }

  return {
    ruleText,
    ruleName: ruleText ? normalizeRule(ruleText) : '',
    hasYeonum,
    changedCells,
    isYeonumOnly: hasYeonum && !ruleText && changedCells.length === 0
  };
}

// ── 단어 필터링 (절음/연음만 있는 단어 제외) ──
function hasRealChange(word) {
  // changeLines 중 실질적 변동(규칙명이 있는) 라인이 하나라도 있으면 true
  for (const line of word.changeLines) {
    if (line.ruleName && !line.isYeonumOnly) {
      return true;
    }
  }
  return false;
}

// ── 단어 → word 객체 변환 ──
function buildWordObject(word, wordIndex) {
  const wId = `w${wordIndex}`;
  const steps = [];
  let stepCount = 0;

  // 현재 셀 상태 추적 (S행에서 시작)
  const currentCells = word.cells.map(c => ({ ...c }));

  for (const changeLine of word.changeLines) {
    if (!changeLine.ruleName) continue; // 연음만 있는 라인 스킵
    if (changeLine.changedCells.length === 0) continue;

    stepCount++;

    // 변동 대상 셀: red 또는 purple 또는 green
    // 실제 변동 대상 = red (결과값이 변경됨) 또는 green (첨가)
    // purple = 이전 단계에서 변경된 셀이 다시 변동되는 경우

    // 변동된 셀들 중 대표 타겟 결정
    // red: 교체/축약/탈락 결과
    // green: 첨가된 음운
    // purple: 연쇄 변동에서 다시 변하는 셀

    const targets = changeLine.changedCells.filter(c => c.isRed || c.isPurple || c.isGreen);

    // 첨가의 경우: green 셀이 쉼표→음소로 바뀜
    // 그 외: red/purple 셀이 변동 결과

    for (const target of targets) {
      // 첨가(ㄴ첨가)에서 green 셀: 쉼표 슬롯이 ㄴ으로 변환
      // 교체/축약에서 red/purple: 기존 음소가 다른 음소로 변환

      const newText = target.text;

      // 이전 상태에서 해당 cellNo의 텍스트 확인
      const prevCell = currentCells.find(c => c.cellNo === target.cellNo);
      if (!prevCell) {
        // 새로운 셀 (첨가로 인해 셀 수 증가) - 스킵
        continue;
      }

      const oldText = prevCell.text;

      // green+space인 경우: 쉼표→공백→새 음소 (첨가)
      // 이 경우 실제로 쉼표 셀이 음소로 변환됨
      if (target.isGreen && target.isSpace) {
        // 이건 공백이 녹색으로 변한 경우 - 다음 라인에서 실제 음소가 채워짐
        continue;
      }

      // 같은 음소면 스킵 (절음 방지)
      if (oldText === newText && !target.isGreen) continue;

      // envCellNos: 타겟 주변 관련 셀
      const envCellNos = [];
      const tNo = target.cellNo;

      // 비음화/유음화: 인접 셀
      if (['비음화', '유음화', '유음의 비음화'].includes(changeLine.ruleName)) {
        // 타겟 앞뒤 셀 중 자음인 것
        for (const c of currentCells) {
          if (c.cellNo !== tNo && Math.abs(c.cellNo - tNo) <= 2 && c.text !== ',' && isConsonant(c.text)) {
            envCellNos.push(c.cellNo);
          }
        }
      }
      // 구개음화: ㅣ 모음 위치
      if (changeLine.ruleName === '구개음화') {
        for (const c of currentCells) {
          if (c.cellNo !== tNo && c.text === 'ㅣ' && c.cellNo > tNo) {
            envCellNos.push(c.cellNo);
          }
        }
      }
      // 된소리되기: 앞 받침
      if (changeLine.ruleName === '된소리되기') {
        for (const c of currentCells) {
          if (c.cellNo < tNo && isConsonant(c.text) && c.text !== ',') {
            envCellNos.push(c.cellNo);
            break;
          }
        }
      }
      // 거센소리되기(축약): ㅎ 위치
      if (changeLine.ruleName === '거센소리되기') {
        for (const c of currentCells) {
          if (c.cellNo !== tNo && c.text === 'ㅎ' && Math.abs(c.cellNo - tNo) <= 2) {
            envCellNos.push(c.cellNo);
          }
        }
      }
      // ㄴ첨가: 인접 자음/모음
      if (changeLine.ruleName === 'ㄴ첨가') {
        for (const c of currentCells) {
          if (c.cellNo !== tNo && Math.abs(c.cellNo - tNo) <= 2 && c.text !== ',') {
            envCellNos.push(c.cellNo);
          }
        }
      }

      // PHONEME_RESULT step
      const phonemePool = isConsonant(newText) ? CONSONANTS : (isVowel(newText) ? VOWELS : CONSONANTS);
      const phChoices = makeChoices(newText, phonemePool);
      steps.push({
        stepId: `${wId}_s${stepCount}_ph`,
        targetCellNo: target.cellNo,
        envCellNos: envCellNos.slice(0, 3),
        questionType: 'PHONEME_RESULT',
        prompt: '이 칸에 들어갈 음운을 고르세요.',
        choices: phChoices.choices,
        answerId: phChoices.answerId,
        onCorrect: { deltaSec: 20, applyCellText: { cellNo: target.cellNo, newText } },
        onWrong: { deltaSec: -40, retry: true }
      });

      // RULE_EXPLANATION step
      const ruleChoices = makeChoices(changeLine.ruleName, RULE_POOL);
      steps.push({
        stepId: `${wId}_s${stepCount}_rule`,
        targetCellNo: target.cellNo,
        envCellNos: envCellNos.slice(0, 3),
        questionType: 'RULE_EXPLANATION',
        prompt: '이 음운 변동의 종류를 고르세요.',
        choices: ruleChoices.choices,
        answerId: ruleChoices.answerId,
        onCorrect: { deltaSec: 0 },
        onWrong: { deltaSec: -40, retry: true }
      });
    }

    // 현재 셀 상태 업데이트
    for (const target of targets) {
      const prevCell = currentCells.find(c => c.cellNo === target.cellNo);
      if (prevCell) {
        prevCell.text = target.text;
      }
    }
  }

  // steps가 비어있으면 null 반환 (제외 대상)
  if (steps.length === 0) return null;

  return {
    wordId: wId,
    surface: word.surface,
    cells: word.cells,
    steps
  };
}

// ── JSON 파일 생성 ──
function generateLessons(wordObjects) {
  const totalLessons = Math.ceil(wordObjects.length / WORDS_PER_LESSON);

  console.log(`유효 단어 ${wordObjects.length}개 → ${totalLessons}개 레슨 생성`);

  // 출력 디렉토리 확인
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  for (let lesson = 0; lesson < totalLessons; lesson++) {
    const start = lesson * WORDS_PER_LESSON;
    const end = Math.min(start + WORDS_PER_LESSON, wordObjects.length);
    const lessonWords = wordObjects.slice(start, end);

    // wordId 재번호
    const reindexedWords = lessonWords.map((w, i) => {
      const newWId = `w${i + 1}`;
      const reSteps = w.steps.map(s => ({
        ...s,
        stepId: s.stepId.replace(/^w\d+/, newWId)
      }));
      return { ...w, wordId: newWId, steps: reSteps };
    });

    const nn = String(lesson + 1).padStart(2, '0');
    const json = {
      contentId: `phoneme-change-${nn}`,
      contentType: 'GRAMMAR_PHONEME_CHANGE',
      version: 2,
      status: 'PUBLISHED',
      title: `음운 변동 분석 ${nn}`,
      description: '음운 변동을 분석하고 도착점을 완성하세요',
      targetLevel: 'RUSSELL_1',
      schoolGradeRange: { min: 4, max: 6 },
      area: 'GRAMMAR',
      subArea: 'PHONEME_CHANGE',
      competencies: ['VOCAB', 'READING'],
      tags: [],
      access: { mode: 'FREE' },
      seedReward: { seedType: 'WHEAT', count: 3, multiplier: 1 },
      timeLimitSec: 180,
      assets: {},
      payload: {
        words: reindexedWords,
        pageStack: true
      }
    };

    const outPath = path.join(OUT_DIR, `grammar_phoneme_change_${nn}.json`);
    fs.writeFileSync(outPath, JSON.stringify(json, null, 2), 'utf-8');
    console.log(`  ✓ ${path.basename(outPath)} (${reindexedWords.length}개 단어, ${reindexedWords.reduce((s, w) => s + w.steps.length, 0)}개 스텝)`);
  }

  return totalLessons;
}

// ── 메인 ──
function main() {
  console.log('=== 음운 변동 학습 JSON 생성 ===\n');

  // 1. HTML 파싱
  const allWords = parseHTML();

  // 2. 실질 변동 없는 단어 제외 (절음/연음만)
  const filtered = [];
  const excluded = [];

  for (const w of allWords) {
    const wordObj = buildWordObject(w, filtered.length + 1);
    if (wordObj && hasRealChange(w)) {
      filtered.push(wordObj);
    } else {
      excluded.push(w);
    }
  }

  console.log(`\n실질 변동 있는 단어: ${filtered.length}개`);
  if (excluded.length > 0) {
    console.log(`제외된 단어 (절음/연음만): ${excluded.length}개`);
    excluded.forEach(w => console.log(`  - ${w.qNum}. ${w.surface}`));
  }

  // 3. JSON 생성
  console.log('');
  const count = generateLessons(filtered);

  console.log(`\n완료! ${count}개 레슨 파일 생성됨.`);
}

main();
