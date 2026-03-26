// Day 4~8 최종 검증 스크립트
const fs = require('fs');

const days = [4, 5, 6, 7, 8];
let allPass = true;

for (const day of days) {
  const pad = String(day).padStart(3, '0');
  const staticPath = `frontend/public/daily-reading/russell3/${pad}.json`;
  const data = JSON.parse(fs.readFileSync(staticPath, 'utf8'));

  const paragraphs = data.payload.passage.paragraphs;
  const timeline = data.payload.intensive.timeline;
  const recall = data.payload.recall;
  const confirm = data.payload.confirm;

  const totalLength = paragraphs.reduce((sum, p) => sum + p.text.length, 0);
  const paraCount = paragraphs.length;

  // 기본 메타 검증
  const checks = [];
  if (data.contentId !== `dr-r3-${pad}`) checks.push(`contentId 불일치: ${data.contentId}`);
  if (data.targetLevel !== "RUSSELL_3") checks.push(`targetLevel 불일치`);
  if (data.subArea !== (day % 2 === 0 ? "LITERATURE" : "NONFICTION")) checks.push(`subArea 불일치: ${data.subArea}`);
  if (totalLength < 1250 || totalLength > 1350) checks.push(`글자수 범위 이탈: ${totalLength}`);
  if (paraCount < 3 || paraCount > 4) checks.push(`문단 수 이상: ${paraCount}`);
  if (recall.cards.length !== 8) checks.push(`recall 카드 수: ${recall.cards.length} (목표: 8)`);
  if (recall.seedPenalty !== 1) checks.push(`seedPenalty: ${recall.seedPenalty}`);
  if (confirm.questions.length < 5 || confirm.questions.length > 10) checks.push(`confirm 문항 수: ${confirm.questions.length} (목표: 5~10)`);

  // highlight ranges 검증
  for (const step of timeline) {
    for (const range of step.highlight.ranges) {
      const para = paragraphs.find(p => p.id === range.paragraphId);
      if (!para) { checks.push(`${step.stepId}: 문단 ${range.paragraphId} 없음`); continue; }
      if (range.start < 0 || range.end > para.text.length || range.start >= range.end) {
        checks.push(`${step.stepId}: 범위 오류 (${range.start}-${range.end}, 길이: ${para.text.length})`);
      }
    }
    // scoring 검증
    if (!step.question.scoring || step.question.scoring.correctDeltaSec !== 20 || step.question.scoring.wrongDeltaSec !== -40) {
      checks.push(`${step.stepId}: intensive scoring 이상`);
    }
    if (!step.question.scoring.eliminateWrongChoice) {
      checks.push(`${step.stepId}: eliminateWrongChoice 누락`);
    }
  }

  // answerRanges 검증
  for (const q of confirm.questions) {
    if (!q.answerRanges || q.answerRanges.length === 0) {
      checks.push(`${q.id}: answerRanges 누락`);
      continue;
    }
    for (const range of q.answerRanges) {
      const para = paragraphs.find(p => p.id === range.paragraphId);
      if (!para) { checks.push(`${q.id}: 문단 ${range.paragraphId} 없음`); continue; }
      if (range.start < 0 || range.end > para.text.length) {
        checks.push(`${q.id}: answerRange 범위 오류`);
      }
    }
    if (!q.scoring || q.scoring.correctDeltaSec !== 30 || q.scoring.wrongDeltaSec !== -45) {
      checks.push(`${q.id}: confirm scoring 이상`);
    }
    if (!q.revealOnWrong) {
      checks.push(`${q.id}: revealOnWrong 누락`);
    }
    // 직접찾기 질문 검증 (prompt에 "클릭" 포함 시 경고)
    if (q.prompt.includes('클릭') || q.prompt.includes('찾아')) {
      checks.push(`${q.id}: 직접찾기 질문 감지 - "${q.prompt}"`);
    }
  }

  // 선택지 개수 검증 (4지선다)
  for (const step of timeline) {
    if (step.question.choices.length !== 4) {
      checks.push(`${step.stepId}: 선택지 ${step.question.choices.length}개 (목표: 4)`);
    }
  }

  const status = checks.length === 0 ? "PASS" : "FAIL";
  if (checks.length > 0) allPass = false;

  console.log(`\n=== Day ${day} (${pad}.json) - ${status} ===`);
  console.log(`  제목: ${data.title}`);
  console.log(`  영역: ${data.subArea}`);
  console.log(`  글자수: ${totalLength}자 (${paraCount}문단)`);
  console.log(`  정독 steps: ${timeline.length}`);
  console.log(`  복기 cards: ${recall.cards.length}`);
  console.log(`  확인 questions: ${confirm.questions.length}`);
  if (checks.length > 0) {
    for (const c of checks) console.log(`  [오류] ${c}`);
  }
}

// 배치 파일 동기화 검증
console.log(`\n=== 배치 파일 동기화 검증 ===`);
const batch = JSON.parse(fs.readFileSync('generated/daily-batch-reading-russell3.json', 'utf8'));
for (const day of days) {
  const pad = String(day).padStart(3, '0');
  const staticData = JSON.parse(fs.readFileSync(`frontend/public/daily-reading/russell3/${pad}.json`, 'utf8'));
  const batchItem = batch.items.find(item => item.day_index === day);

  if (!batchItem) {
    console.log(`  Day ${day}: 배치에서 찾을 수 없음 - FAIL`);
    allPass = false;
    continue;
  }

  const match = JSON.stringify(batchItem.content) === JSON.stringify(staticData);
  console.log(`  Day ${day}: static/batch 동기화 - ${match ? 'OK' : 'MISMATCH'}`);
  if (!match) allPass = false;
}

console.log(`\n${'='.repeat(40)}`);
console.log(`최종 결과: ${allPass ? '모든 검증 통과!' : '일부 검증 실패!'}`);
if (!allPass) process.exit(1);
