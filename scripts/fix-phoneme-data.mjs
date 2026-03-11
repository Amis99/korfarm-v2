/**
 * 음운 변동 JSON 데이터 수정 스크립트
 *
 * 수정 내용:
 * 1. 탈락 시 "," → "∅" 표현
 * 2. 축약(거센소리되기) 패턴을 단일 multi-cell 스텝으로 병합
 * 3. 무변화 스텝 제거 (답이 현재 셀 텍스트와 동일)
 * 4. 중복 stepId 재번호
 *
 * 사용법: node scripts/fix-phoneme-data.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'frontend', 'public', 'farm', 'grammar');

function getAnswerText(step) {
  const choice = step.choices?.find(c => c.id === step.answerId);
  return choice?.text;
}

function fixWord(word) {
  const oldSteps = word.steps || [];
  const newSteps = [];
  const report = [];

  // 셀 상태 추적 (D행 기준)
  const cellState = {};
  for (const c of word.cells) {
    cellState[c.cellNo] = c.text === ',' ? '' : c.text;
  }

  let i = 0;
  let stepNum = 0;

  while (i < oldSteps.length) {
    const step = oldSteps[i];

    // ── 축약 패턴 탐지 ──
    // [ph(delete, ","), rule("거센소리되기"), ph(fill, result), rule("거센소리되기")]
    if (
      step.questionType === 'PHONEME_RESULT' &&
      i + 3 < oldSteps.length &&
      oldSteps[i + 1].questionType === 'RULE_EXPLANATION' &&
      oldSteps[i + 2].questionType === 'PHONEME_RESULT' &&
      oldSteps[i + 3].questionType === 'RULE_EXPLANATION'
    ) {
      const deleteStep = oldSteps[i];
      const deleteRule = oldSteps[i + 1];
      const fillStep = oldSteps[i + 2];
      const fillRule = oldSteps[i + 3];

      const deleteAnswer = getAnswerText(deleteStep);
      const deleteRuleText = getAnswerText(deleteRule);
      const fillRuleText = getAnswerText(fillRule);

      // 축약 검증: fill 타겟이 S행에서 쉼표 슬롯이어야 함
      const srcY = word.cells.find(c => c.cellNo === fillStep.targetCellNo);
      if (
        deleteAnswer === ',' &&
        deleteRuleText === '거센소리되기' &&
        fillRuleText === '거센소리되기' &&
        srcY?.text === ','
      ) {
        stepNum++;
        const X = deleteStep.targetCellNo; // 삭제되는 자음
        const Y = fillStep.targetCellNo;   // 쉼표 슬롯 → 축약 결과
        const Z = X === Y - 1 ? Y + 1 : Y - 1; // 반대편 자음 (ㅎ 또는 평음)
        const result = getAnswerText(fillStep);

        report.push(`축약 병합: D${X}+D${Z} → D${Y}="${result}" (거센소리되기)`);

        // 병합된 PHONEME_RESULT
        const mergedPhStep = {
          ...fillStep,
          stepId: `${word.wordId}_s${stepNum}_ph`,
          onCorrect: {
            deltaSec: fillStep.onCorrect?.deltaSec ?? 20,
            applyCellTexts: [
              { cellNo: Y, newText: result },
              { cellNo: X, newText: '∅' },
              { cellNo: Z, newText: '∅' }
            ]
          }
        };
        // 단일 applyCellText 제거 (applyCellTexts로 대체)
        delete mergedPhStep.onCorrect.applyCellText;

        const mergedRuleStep = {
          ...fillRule,
          stepId: `${word.wordId}_s${stepNum}_rule`,
        };

        newSteps.push(mergedPhStep, mergedRuleStep);

        cellState[Y] = result;
        cellState[X] = '∅';
        cellState[Z] = '∅';

        i += 4;
        continue;
      }
    }

    // ── 일반 스텝 처리 ──
    if (step.questionType === 'PHONEME_RESULT') {
      const answerText = getAnswerText(step);
      const currentCellText = cellState[step.targetCellNo];

      // 무변화 스텝 감지: 답이 현재 셀 텍스트와 동일 (쉼표 제외)
      if (
        answerText !== undefined &&
        answerText === currentCellText &&
        answerText !== ',' &&
        answerText !== '∅' &&
        i + 1 < oldSteps.length &&
        oldSteps[i + 1].questionType === 'RULE_EXPLANATION'
      ) {
        const ruleName = getAnswerText(oldSteps[i + 1]);
        report.push(`무변화 스텝 제거: D${step.targetCellNo} "${currentCellText}" (${ruleName})`);
        i += 2;
        continue;
      }

      // 중복 탈락 스텝 감지: 축약 병합으로 이미 ∅인 셀에 다시 탈락
      if (
        (answerText === ',' || answerText === '∅') &&
        currentCellText === '∅' &&
        i + 1 < oldSteps.length &&
        oldSteps[i + 1].questionType === 'RULE_EXPLANATION'
      ) {
        const ruleName = getAnswerText(oldSteps[i + 1]);
        report.push(`중복 탈락 제거: D${step.targetCellNo} 이미 ∅ (${ruleName})`);
        i += 2;
        continue;
      }

      stepNum++;

      // 탈락 감지: 답이 ","
      if (answerText === ',') {
        report.push(`탈락 ∅ 변환: D${step.targetCellNo} → ∅`);

        const fixedChoices = step.choices.map(c => ({
          ...c,
          text: c.text === ',' ? '∅' : c.text
        }));

        const fixedOnCorrect = { ...step.onCorrect };
        if (fixedOnCorrect.applyCellText?.newText === ',') {
          fixedOnCorrect.applyCellText = { ...fixedOnCorrect.applyCellText, newText: '∅' };
        }

        newSteps.push({
          ...step,
          stepId: `${word.wordId}_s${stepNum}_ph`,
          choices: fixedChoices,
          onCorrect: fixedOnCorrect
        });

        cellState[step.targetCellNo] = '∅';
      } else {
        // 일반 변동
        newSteps.push({
          ...step,
          stepId: `${word.wordId}_s${stepNum}_ph`
        });

        // cellState 반영: multi-cell (applyCellTexts) 또는 단일
        if (step.onCorrect?.applyCellTexts) {
          for (const u of step.onCorrect.applyCellTexts) {
            cellState[u.cellNo] = u.newText;
          }
        } else if (answerText) {
          cellState[step.targetCellNo] = answerText;
        }
      }
    } else if (step.questionType === 'RULE_EXPLANATION') {
      newSteps.push({
        ...step,
        stepId: `${word.wordId}_s${stepNum}_rule`
      });
    }

    i++;
  }

  return { fixedWord: { ...word, steps: newSteps }, report };
}

function processFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const fileName = path.basename(filePath);

  let totalChanges = 0;

  const fixedWords = data.payload.words.map((word) => {
    const { fixedWord, report } = fixWord(word);

    if (report.length > 0) {
      console.log(`  ${word.surface}:`);
      report.forEach(r => console.log(`    - ${r}`));
      totalChanges += report.length;
    }

    return fixedWord;
  });

  data.payload.words = fixedWords;

  // 요약 출력: 단어별 스텝 시퀀스
  console.log('  ── 검수 요약 ──');
  for (const word of fixedWords) {
    const cellsStr = word.cells.map(c => c.text).join(' ');
    console.log(`  ${word.surface}: [${cellsStr}]`);
    for (let si = 0; si < word.steps.length; si += 2) {
      const ph = word.steps[si];
      const rule = word.steps[si + 1];
      if (!ph || !rule) break;
      const ans = getAnswerText(ph);
      const ruleName = getAnswerText(rule);
      const multi = ph.onCorrect?.applyCellTexts ? ' (multi)' : '';
      console.log(`    ${si / 2 + 1}. D${ph.targetCellNo} → ${ans} [${ruleName}]${multi}`);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

  return totalChanges;
}

function main() {
  console.log('=== 음운 변동 데이터 수정 ===\n');

  let totalFiles = 0;
  let totalChanges = 0;

  for (let i = 1; i <= 37; i++) {
    const nn = String(i).padStart(2, '0');
    const filePath = path.join(DATA_DIR, `grammar_phoneme_change_${nn}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠ grammar_phoneme_change_${nn}.json 없음`);
      continue;
    }

    console.log(`\n[${nn}] grammar_phoneme_change_${nn}.json:`);
    const changes = processFile(filePath);

    if (changes === 0) {
      console.log('  (변경 없음)');
    }

    totalFiles++;
    totalChanges += changes;
  }

  console.log(`\n=== 완료: ${totalFiles}개 파일 처리, ${totalChanges}개 수정 적용 ===`);
}

main();
