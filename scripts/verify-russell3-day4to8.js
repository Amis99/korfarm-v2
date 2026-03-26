// 러셀3 Day 4~8 검증 스크립트
const fs = require('fs');

const days = [4, 5, 6, 7, 8];
const errors = [];

for (const day of days) {
  const pad = String(day).padStart(3, '0');
  const staticPath = `frontend/public/daily-reading/russell3/${pad}.json`;

  console.log(`\n=== Day ${day} (${staticPath}) ===`);

  let data;
  try {
    data = JSON.parse(fs.readFileSync(staticPath, 'utf-8'));
  } catch (e) {
    errors.push(`Day ${day}: 파일 읽기 실패 - ${e.message}`);
    continue;
  }

  // 기본 필드 검증
  if (data.contentId !== `dr-r3-${pad}`) errors.push(`Day ${day}: contentId 불일치 (${data.contentId})`);
  if (data.title !== `일일 독해(러셀 3) Day ${day} ${day % 2 === 0 ? '문학' : '비문학'}`)
    errors.push(`Day ${day}: title 불일치 (${data.title})`);

  const expectedSubArea = day % 2 === 0 ? 'LITERATURE' : 'NONFICTION';
  if (data.subArea !== expectedSubArea) errors.push(`Day ${day}: subArea 불일치 (${data.subArea} vs ${expectedSubArea})`);

  if (data.schoolGradeRange.min !== 8 || data.schoolGradeRange.max !== 9)
    errors.push(`Day ${day}: schoolGradeRange 불일치 (${JSON.stringify(data.schoolGradeRange)})`);

  // 지문 길이
  const paras = data.payload.passage.paragraphs;
  const totalLen = paras.reduce((sum, p) => sum + p.text.length, 0);
  console.log(`  지문 길이: ${totalLen}자 (${paras.length}문단)`);
  if (totalLen < 1250 || totalLen > 1350) errors.push(`Day ${day}: 지문 길이 범위 이탈 (${totalLen})`);

  // timeline 검증
  const timeline = data.payload.intensive.timeline;
  console.log(`  타임라인: ${timeline.length}스텝`);

  let answerIdErrors = 0;
  let rangeErrors = 0;
  for (const step of timeline) {
    // answerId = "A" 검증
    if (step.question.answerId !== 'A') answerIdErrors++;

    // highlight range 검증
    for (const r of step.highlight.ranges) {
      const para = paras.find(p => p.id === r.paragraphId);
      if (!para) {
        rangeErrors++;
        continue;
      }
      if (r.start < 0 || r.end > para.text.length || r.start >= r.end) {
        rangeErrors++;
        errors.push(`Day ${day} ${step.stepId}: 범위 오류 [${r.start}, ${r.end}] (텍스트 길이: ${para.text.length})`);
      }
    }

    // scoring 검증
    const s = step.question.scoring;
    if (s.correctDeltaSec !== 20 || s.wrongDeltaSec !== -40 || !s.eliminateWrongChoice)
      errors.push(`Day ${day} ${step.stepId}: scoring 오류`);

    // 선택지 4개 검증
    if (step.question.choices.length !== 4)
      errors.push(`Day ${day} ${step.stepId}: 선택지 수 ${step.question.choices.length}`);
  }

  if (answerIdErrors > 0) errors.push(`Day ${day}: answerId "A" 아닌 것 ${answerIdErrors}개`);
  if (rangeErrors > 0) console.log(`  ⚠️ 범위 오류: ${rangeErrors}건`);

  // 복기 카드 검증
  const cards = data.payload.recall.cards;
  console.log(`  복기 카드: ${cards.length}개`);
  if (cards.length !== 8) errors.push(`Day ${day}: 복기 카드 ${cards.length}개 (8개여야 함)`);
  if (data.payload.recall.seedPenalty !== 1) errors.push(`Day ${day}: seedPenalty ${data.payload.recall.seedPenalty}`);

  // 확인 문항 검증
  const confirm = data.payload.confirm.questions;
  console.log(`  확인 문항: ${confirm.length}개`);
  if (confirm.length < 5 || confirm.length > 10)
    errors.push(`Day ${day}: 확인 문항 수 ${confirm.length} (5~10개여야 함)`);

  for (const q of confirm) {
    if (q.answerMatchMode !== 'ANY') errors.push(`Day ${day} ${q.id}: answerMatchMode 오류`);
    if (!q.revealOnWrong) errors.push(`Day ${day} ${q.id}: revealOnWrong 오류`);
    if (q.scoring.correctDeltaSec !== 30 || q.scoring.wrongDeltaSec !== -45)
      errors.push(`Day ${day} ${q.id}: confirm scoring 오류`);

    // answerRange 검증
    for (const r of q.answerRanges) {
      const para = paras.find(p => p.id === r.paragraphId);
      if (!para) {
        errors.push(`Day ${day} ${q.id}: paragraphId "${r.paragraphId}" 없음`);
        continue;
      }
      if (r.start < 0 || r.end > para.text.length || r.start >= r.end) {
        errors.push(`Day ${day} ${q.id}: 확인 범위 오류 [${r.start}, ${r.end}]`);
      }
    }
  }

  console.log(`  ✅ 기본 검증 통과`);
}

// 배치 파일 검증
console.log("\n=== 배치 파일 검증 ===");
const batch = JSON.parse(fs.readFileSync('generated/daily-batch-reading-russell3.json', 'utf-8'));
for (const day of days) {
  const idx = day - 1; // 0-indexed
  const item = batch.items[idx];
  if (!item) {
    errors.push(`배치 items[${idx}] 없음`);
    continue;
  }
  if (item.day_index !== day) errors.push(`배치 items[${idx}]: day_index ${item.day_index} vs ${day}`);
  if (item.content.contentId !== `dr-r3-${String(day).padStart(3, '0')}`)
    errors.push(`배치 items[${idx}]: contentId 불일치`);
  console.log(`  items[${idx}]: Day ${item.day_index}, ${item.sub_area}, contentId=${item.content.contentId}`);
}

// 결과 출력
console.log("\n=== 최종 결과 ===");
if (errors.length === 0) {
  console.log("✅ 모든 검증 통과!");
} else {
  console.log(`❌ 오류 ${errors.length}건:`);
  for (const e of errors) {
    console.log(`  - ${e}`);
  }
}
