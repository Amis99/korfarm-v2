#!/usr/bin/env node
// 일일독해 콘텐츠 품질 진단 스크립트 (읽기 전용 - 분석만)
const fs = require('fs');
const path = require('path');

const GENERATED_DIR = path.join(__dirname, '..', 'generated');

const LEVEL_CONFIG = {
  saussure1: { targetLen: 500, label: '소쉬르1', abbr: 's1' },
  saussure2: { targetLen: 600, label: '소쉬르2', abbr: 's2' },
  saussure3: { targetLen: 700, label: '소쉬르3', abbr: 's3' },
  frege1:    { targetLen: 800, label: '프레게1', abbr: 'f1' },
  frege2:    { targetLen: 900, label: '프레게2', abbr: 'f2' },
  frege3:    { targetLen: 1000, label: '프레게3', abbr: 'f3' },
  russell1:  { targetLen: 1100, label: '러셀1', abbr: 'r1' },
  russell2:  { targetLen: 1200, label: '러셀2', abbr: 'r2' },
  russell3:  { targetLen: 1300, label: '러셀3', abbr: 'r3' },
  wittgenstein1: { targetLen: 1400, label: '비트겐슈타인1', abbr: 'w1' },
  wittgenstein2: { targetLen: 1500, label: '비트겐슈타인2', abbr: 'w2' },
  wittgenstein3: { targetLen: 1600, label: '비트겐슈타인3', abbr: 'w3' },
};

function getPassageLength(item) {
  const paragraphs = item.content?.payload?.passage?.paragraphs || [];
  return paragraphs.reduce((sum, p) => sum + (p.text || '').length, 0);
}

function getIntensiveSteps(item) {
  return item.content?.payload?.intensive?.timeline?.length || 0;
}

function getRecallCards(item) {
  return item.content?.payload?.recall?.cards?.length || 0;
}

function getConfirmQuestions(item) {
  return item.content?.payload?.confirm?.questions?.length || 0;
}

function hasAnswerMatchMode(item) {
  const questions = item.content?.payload?.confirm?.questions || [];
  return questions.every(q => q.answerMatchMode);
}

function checkChoiceLengthVariance(item) {
  const timeline = item.content?.payload?.intensive?.timeline || [];
  const issues = [];
  for (const step of timeline) {
    const choices = step.question?.choices || [];
    if (choices.length === 0) continue;
    const lengths = choices.map(c => (c.text || '').length);
    const maxLen = Math.max(...lengths);
    const minLen = Math.min(...lengths);
    if (maxLen > 0 && minLen > 0) {
      const variance = (maxLen - minLen) / maxLen;
      if (variance > 0.15) {
        issues.push({ stepId: step.stepId, variance: (variance * 100).toFixed(1) + '%', lengths });
      }
    }
  }
  return issues;
}

function hasDirectFindType(item) {
  const confirmQs = item.content?.payload?.confirm?.questions || [];
  const intensiveSteps = item.content?.payload?.intensive?.timeline || [];
  const allPrompts = [
    ...confirmQs.map(q => q.prompt || ''),
    ...intensiveSteps.map(s => s.question?.prompt || '')
  ];
  // 지시형 직접찾기만 감지 ("지문에서 ~를 찾아 클릭하세요" 등)
  // "~를 찾아낸 곳은?" 같은 질문형은 정상이므로 제외
  const directFindPatterns = [
    /지문에서.*찾/,
    /찾아\s*클릭/,
    /찾아\s*누르/,
    /찾아\s*선택/,
    /찾으세요/,
    /찾으시오/,
    /클릭하세요/,
    /클릭하시오/,
    /골라\s*보세요/,
    /골라\s*클릭/,
  ];
  return allPrompts.some(p => directFindPatterns.some(pat => pat.test(p)));
}

function auditDay(item, levelConfig) {
  const passageLen = getPassageLength(item);
  const intensiveSteps = getIntensiveSteps(item);
  const recallCards = getRecallCards(item);
  const confirmQs = getConfirmQuestions(item);
  const allHaveMatchMode = hasAnswerMatchMode(item);
  const choiceIssues = checkChoiceLengthVariance(item);
  const hasDirectFind = hasDirectFindType(item);

  const issues = [];

  // 지문 길이 점검
  const lenDiff = passageLen - levelConfig.targetLen;
  if (Math.abs(lenDiff) > 50) {
    issues.push(`지문길이 ${passageLen}자 (목표 ${levelConfig.targetLen}±50, 차이 ${lenDiff > 0 ? '+' : ''}${lenDiff})`);
  }

  // 확인학습 문항 수
  if (confirmQs < 5) {
    issues.push(`확인학습 ${confirmQs}문항 (최소 5 필요)`);
  }

  // 복기 카드 수
  if (recallCards !== 8) {
    issues.push(`복기카드 ${recallCards}장 (8장 필요)`);
  }

  // answerMatchMode 누락
  if (!allHaveMatchMode && confirmQs > 0) {
    issues.push('answerMatchMode 누락');
  }

  // 선택지 편차
  if (choiceIssues.length > 0) {
    issues.push(`선택지편차 ${choiceIssues.length}건 (최대 ${choiceIssues[0]?.variance})`);
  }

  // 직접찾기형
  if (hasDirectFind) {
    issues.push('직접찾기형 문제 존재');
  }

  return {
    dayIndex: item.day_index,
    subArea: item.sub_area,
    passageLen,
    intensiveSteps,
    recallCards,
    confirmQs,
    allHaveMatchMode,
    choiceIssueCount: choiceIssues.length,
    hasDirectFind,
    issues,
    isOk: issues.length === 0
  };
}

function loadLevel(levelKey) {
  const filePath = path.join(GENERATED_DIR, `daily-batch-reading-${levelKey}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return data.items;
}

// 메인
const args = process.argv.slice(2);
const mode = args[0] || 'summary'; // summary, sample, range
const levelKey = args[1] || 'saussure1';
const rangeStart = parseInt(args[2]) || 1;
const rangeEnd = parseInt(args[3]) || 30;

const config = LEVEL_CONFIG[levelKey];
if (!config) {
  console.error(`알 수 없는 레벨: ${levelKey}`);
  console.error('사용 가능: ' + Object.keys(LEVEL_CONFIG).join(', '));
  process.exit(1);
}

console.log(`\n=== ${config.label} (${levelKey}) 진단 ===\n`);

const items = loadLevel(levelKey);
console.log(`총 항목: ${items.length}일\n`);

if (mode === 'summary') {
  // 전체 요약 통계
  let okCount = 0;
  let badCount = 0;
  let totalLen = 0;
  const issueSummary = {};

  for (const item of items) {
    const result = auditDay(item, config);
    totalLen += result.passageLen;
    if (result.isOk) okCount++;
    else badCount++;
    for (const issue of result.issues) {
      const key = issue.split(' ')[0];
      issueSummary[key] = (issueSummary[key] || 0) + 1;
    }
  }

  console.log(`평균 지문 길이: ${Math.round(totalLen / items.length)}자 (목표: ${config.targetLen}자)`);
  console.log(`정상: ${okCount}일 / 불량: ${badCount}일 (불량률: ${Math.round(badCount / items.length * 100)}%)`);
  console.log('\n결함 유형별 집계:');
  for (const [key, count] of Object.entries(issueSummary).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${key}: ${count}건`);
  }

} else if (mode === 'sample') {
  // T0 샘플 점검 (Day 1, 10, 20, 50, 100, 200, 300, 365)
  const sampleDays = [1, 10, 20, 50, 100, 200, 300, 365];
  for (const day of sampleDays) {
    const item = items[day - 1];
    if (!item) continue;
    const result = auditDay(item, config);
    const status = result.isOk ? '✅' : '❌';
    console.log(`Day ${String(day).padStart(3)}: ${status} ${result.passageLen}자 | 정독${result.intensiveSteps}스텝 | 복기${result.recallCards}카드 | 확인${result.confirmQs}문항 | ${result.subArea}`);
    if (!result.isOk) {
      for (const issue of result.issues) {
        console.log(`         ⚠ ${issue}`);
      }
    }
  }

} else if (mode === 'range') {
  // 범위 상세 점검
  console.log(`Day ${rangeStart}~${rangeEnd} 상세 점검:\n`);
  for (let i = rangeStart; i <= Math.min(rangeEnd, items.length); i++) {
    const item = items[i - 1];
    if (!item) continue;
    const result = auditDay(item, config);
    const status = result.isOk ? '✅' : '❌';
    console.log(`Day ${String(i).padStart(3)}: ${status} ${result.passageLen}자 | 정독${result.intensiveSteps}스텝 | 복기${result.recallCards}카드 | 확인${result.confirmQs}문항 | ${result.subArea}`);
    if (!result.isOk) {
      for (const issue of result.issues) {
        console.log(`         ⚠ ${issue}`);
      }
    }
  }

} else if (mode === 'detail') {
  // 특정 day 상세 출력
  const dayIndex = rangeStart;
  const item = items[dayIndex - 1];
  if (!item) { console.error(`Day ${dayIndex} 없음`); process.exit(1); }

  const result = auditDay(item, config);
  const passage = item.content?.payload?.passage?.paragraphs || [];
  const intensive = item.content?.payload?.intensive?.timeline || [];
  const recall = item.content?.payload?.recall?.cards || [];
  const confirm = item.content?.payload?.confirm?.questions || [];

  console.log(`Day ${dayIndex} 상세 분석`);
  console.log(`subArea: ${item.sub_area}`);
  console.log(`지문 길이: ${result.passageLen}자 (목표 ${config.targetLen}±50)`);
  console.log(`\n--- 지문 ---`);
  for (const p of passage) {
    console.log(`[${p.id}] (${p.text.length}자) ${p.text.substring(0, 100)}...`);
  }

  console.log(`\n--- 정독 (${intensive.length}스텝) ---`);
  for (const step of intensive) {
    const q = step.question;
    const choices = q?.choices || [];
    const lengths = choices.map(c => c.text.length);
    const maxL = Math.max(...lengths);
    const minL = Math.min(...lengths);
    const variance = maxL > 0 ? ((maxL - minL) / maxL * 100).toFixed(0) : 0;
    console.log(`  ${step.stepId}: [${step.highlight?.paragraphId || '?'}:${step.highlight?.range?.start}-${step.highlight?.range?.end}] "${(q?.prompt || '').substring(0, 50)}..." 정답:${q?.answerId} 선택지편차:${variance}%`);
  }

  console.log(`\n--- 복기 (${recall.length}카드) ---`);
  for (const card of recall) {
    console.log(`  ${card.id}: "${(card.text || '').substring(0, 60)}..."`);
  }

  console.log(`\n--- 확인학습 (${confirm.length}문항) ---`);
  for (const q of confirm) {
    console.log(`  ${q.id}: "${(q.prompt || '').substring(0, 60)}..." mode:${q.answerMatchMode || '없음'} answer:"${(q.answerText || '').substring(0, 20)}"`);
  }

  if (result.issues.length > 0) {
    console.log(`\n--- 결함 ---`);
    for (const issue of result.issues) {
      console.log(`  ⚠ ${issue}`);
    }
  } else {
    console.log(`\n✅ 모든 검증 통과`);
  }
}
