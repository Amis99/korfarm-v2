const fs = require('fs');
const path = require('path');

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1');
const days = [5, 6, 7, 8, 9];
let allOk = true;

for (const day of days) {
  const file = path.join(staticDir, `${String(day).padStart(3, '0')}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const errors = [];

  // 1. 메타데이터
  if (data.contentId !== `dr-w1-${String(day).padStart(3, '0')}`) errors.push(`contentId 불일치: ${data.contentId}`);
  if (data.targetLevel !== 'WITTGENSTEIN_1') errors.push('targetLevel 불일치');
  if (data.schoolGradeRange.min !== 9 || data.schoolGradeRange.max !== 10) errors.push('schoolGradeRange 불일치');

  // 2. 지문 글자 수
  const totalLen = data.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
  if (totalLen < 1350 || totalLen > 1450) errors.push(`글자 수 범위 밖: ${totalLen}`);

  // 3. 문단 수
  const numParagraphs = data.payload.passage.paragraphs.length;
  if (numParagraphs < 3 || numParagraphs > 4) errors.push(`문단 수 이상: ${numParagraphs}`);

  // 4. recall 카드 수
  const recallCount = data.payload.recall.cards.length;
  if (recallCount !== 8) errors.push(`recall 카드 수: ${recallCount} (8이어야 함)`);

  // 5. seedPenalty
  if (data.payload.recall.seedPenalty !== 1) errors.push('seedPenalty 불일치');

  // 6. confirm 문항 수
  const confirmCount = data.payload.confirm.questions.length;
  if (confirmCount < 5 || confirmCount > 10) errors.push(`confirm 문항 수: ${confirmCount} (5~10이어야 함)`);

  // 7. confirm 형식 검증 (질문형, answerRanges 존재, revealOnWrong)
  for (const q of data.payload.confirm.questions) {
    if (!q.prompt || !q.prompt.includes('?') && !q.prompt.includes('나요')) errors.push(`confirm ${q.id}: 질문형이 아님`);
    if (!q.answerRanges || q.answerRanges.length === 0) errors.push(`confirm ${q.id}: answerRanges 없음`);
    if (q.revealOnWrong !== true) errors.push(`confirm ${q.id}: revealOnWrong 미설정`);
    if (!q.scoring || q.scoring.correctDeltaSec !== 30 || q.scoring.wrongDeltaSec !== -45) errors.push(`confirm ${q.id}: scoring 불일치`);

    // answerRanges 유효성 검증
    for (const r of (q.answerRanges || [])) {
      const p = data.payload.passage.paragraphs.find(x => x.id === r.paragraphId);
      if (!p) { errors.push(`confirm ${q.id}: 문단 ${r.paragraphId} 없음`); continue; }
      if (r.start < 0 || r.end > p.text.length || r.start >= r.end) {
        errors.push(`confirm ${q.id}: 범위 이상 [${r.start},${r.end}] in ${r.paragraphId}(len=${p.text.length})`);
      }
    }
  }

  // 8. intensive 검증 - 각 문단 마지막이 중심내용인지
  const timeline = data.payload.intensive.timeline;
  // scoring 검증
  for (const step of timeline) {
    const s = step.question.scoring;
    if (s.correctDeltaSec !== 20 || s.wrongDeltaSec !== -40 || s.eliminateWrongChoice !== true) {
      errors.push(`intensive ${step.stepId}: scoring 불일치`);
    }
    // 4지선다 검증
    if (!step.question.choices || step.question.choices.length !== 4) {
      errors.push(`intensive ${step.stepId}: 선지 수 ${step.question.choices?.length} (4이어야 함)`);
    }
    // highlight 범위 검증
    for (const r of step.highlight.ranges) {
      const p = data.payload.passage.paragraphs.find(x => x.id === r.paragraphId);
      if (!p) { errors.push(`intensive ${step.stepId}: 문단 ${r.paragraphId} 없음`); continue; }
      if (r.start < 0 || r.end > p.text.length || r.start >= r.end) {
        errors.push(`intensive ${step.stepId}: 범위 이상 [${r.start},${r.end}] in ${r.paragraphId}(len=${p.text.length})`);
      }
    }
  }

  // 결과 출력
  if (errors.length === 0) {
    console.log(`Day ${day}: OK (${totalLen}자, intensive=${timeline.length}steps, recall=${recallCount}, confirm=${confirmCount})`);
  } else {
    allOk = false;
    console.log(`Day ${day}: 오류 ${errors.length}개`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
}

// 배치 파일 검증
const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-wittgenstein1.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
for (const day of days) {
  const item = batch.items.find(i => i.day_index === day && i.level_id === 'WITTGENSTEIN_1');
  if (!item) {
    console.log(`배치: Day ${day} 항목 없음!`);
    allOk = false;
  } else if (item.content.contentId !== `dr-w1-${String(day).padStart(3, '0')}`) {
    console.log(`배치: Day ${day} contentId 불일치`);
    allOk = false;
  }
}

console.log(allOk ? '\n전체 검증 통과!' : '\n일부 오류가 있습니다.');
