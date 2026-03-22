// 프레게3 Day 4~7 최종 검증 스크립트
const fs = require('fs');

const days = [
  { day: 4, file: 'frontend/public/daily-reading/frege3/004.json', subArea: 'LITERATURE' },
  { day: 5, file: 'frontend/public/daily-reading/frege3/005.json', subArea: 'NONFICTION' },
  { day: 6, file: 'frontend/public/daily-reading/frege3/006.json', subArea: 'LITERATURE' },
  { day: 7, file: 'frontend/public/daily-reading/frege3/007.json', subArea: 'NONFICTION' }
];

let allOk = true;

for (const d of days) {
  console.log(`\n=== Day ${d.day} (${d.subArea}) ===`);

  const path = `C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/${d.file}`;
  let content;
  try {
    content = JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (e) {
    console.error(`FAIL: JSON 파싱 실패 - ${e.message}`);
    allOk = false;
    continue;
  }

  // 1. 기본 메타데이터
  const checks = [
    ['contentId', content.contentId === `dr-f3-00${d.day}`],
    ['targetLevel', content.targetLevel === 'FREGE_3'],
    ['subArea', content.subArea === d.subArea],
    ['schoolGradeRange.min', content.schoolGradeRange.min === 6],
    ['schoolGradeRange.max', content.schoolGradeRange.max === 7],
    ['seedReward.count', content.seedReward.count === 3],
    ['timeLimitSec', content.timeLimitSec === 300]
  ];

  for (const [name, ok] of checks) {
    if (!ok) {
      console.error(`  FAIL: ${name}`);
      allOk = false;
    }
  }

  // 2. 지문 길이
  const paragraphs = content.payload.passage.paragraphs;
  const totalLen = paragraphs.reduce((sum, p) => sum + p.text.length, 0);
  const lenOk = totalLen >= 950 && totalLen <= 1050;
  console.log(`  지문 길이: ${totalLen} (${lenOk ? 'OK' : 'FAIL'})`);
  if (!lenOk) allOk = false;

  // 3. recall cards
  const recallCount = content.payload.recall.cards.length;
  const recallOk = recallCount === 8;
  console.log(`  recall cards: ${recallCount} (${recallOk ? 'OK' : 'FAIL'})`);
  if (!recallOk) allOk = false;

  // 4. confirm questions
  const confirmCount = content.payload.confirm.questions.length;
  const confirmOk = confirmCount >= 5 && confirmCount <= 10;
  console.log(`  confirm questions: ${confirmCount} (${confirmOk ? 'OK' : 'FAIL'})`);
  if (!confirmOk) allOk = false;

  // 5. intensive steps
  const steps = content.payload.intensive.timeline.length;
  console.log(`  intensive steps: ${steps}`);

  // 6. highlight ranges 검증
  let hlOk = true;
  const pMap = {};
  for (const p of paragraphs) pMap[p.id] = p.text;

  for (const step of content.payload.intensive.timeline) {
    for (const r of step.highlight.ranges) {
      const pText = pMap[r.paragraphId];
      if (!pText) { console.error(`  FAIL: ${step.stepId} unknown paragraph ${r.paragraphId}`); hlOk = false; continue; }
      if (r.start < 0 || r.end > pText.length || r.start >= r.end) {
        console.error(`  FAIL: ${step.stepId} highlight [${r.start},${r.end}] out of bounds (${pText.length})`);
        hlOk = false;
      }
    }
  }
  console.log(`  highlight ranges: ${hlOk ? 'OK' : 'FAIL'}`);
  if (!hlOk) allOk = false;

  // 7. answerRanges 검증
  let arOk = true;
  for (const q of content.payload.confirm.questions) {
    if (!q.answerRanges || q.answerRanges.length === 0) continue;
    for (const r of q.answerRanges) {
      const pText = pMap[r.paragraphId];
      if (!pText) { console.error(`  FAIL: ${q.id} unknown paragraph`); arOk = false; continue; }
      const extracted = pText.substring(r.start, r.end);
      if (extracted !== q.answerText) {
        console.error(`  FAIL: ${q.id} expected "${q.answerText}" got "${extracted}"`);
        arOk = false;
      }
    }
  }
  console.log(`  answerRanges: ${arOk ? 'OK' : 'FAIL'}`);
  if (!arOk) allOk = false;

  // 8. 직접찾기 표현 금지 체크
  let findOk = true;
  for (const q of content.payload.confirm.questions) {
    if (q.prompt.includes('찾아') && q.prompt.includes('클릭')) {
      console.error(`  FAIL: ${q.id} 직접찾기 표현 발견: "${q.prompt}"`);
      findOk = false;
    }
  }
  if (!findOk) allOk = false;

  console.log(`  Day ${d.day}: 모든 검증 ${hlOk && arOk && lenOk && recallOk && confirmOk && findOk ? 'PASS' : 'FAIL'}`);
}

// 배치 파일 검증
console.log("\n=== 배치 파일 검증 ===");
const batchPath = 'C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/generated/daily-batch-reading-frege3.json';
try {
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  for (const d of days) {
    const item = batch.items[d.day - 1];
    const ok = item && item.content && item.content.contentId === `dr-f3-00${d.day}` && item.sub_area === d.subArea;
    console.log(`  Day ${d.day} batch item: ${ok ? 'OK' : 'FAIL'}`);
    if (!ok) allOk = false;
  }
} catch (e) {
  console.error(`FAIL: 배치 JSON 파싱 실패`);
  allOk = false;
}

console.log(`\n=== 최종 결과: ${allOk ? 'ALL PASS' : 'SOME FAILURES'} ===`);
