// 수리된 패치 파일을 배치 파일에 적용
const fs = require('fs');
const path = require('path');

const GENERATED_DIR = path.join(__dirname, '..', 'generated');

const levelKey = process.argv[2];
const patchFile = process.argv[3];

if (!levelKey || !patchFile) {
  console.log('사용법: node apply-broken-fixes.js <level> <patch-file.json>');
  process.exit(1);
}

const patches = JSON.parse(fs.readFileSync(patchFile, 'utf8'));
const batchPath = path.join(GENERATED_DIR, `daily-batch-reading-${levelKey}.json`);
const data = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

let applied = 0;
let skipped = 0;
let empty = 0;

for (const patch of patches) {
  if (!patch.fix || patch.fix.trim() === '') {
    empty++;
    continue;
  }

  const item = data.items[patch.dayIndex - 1];
  if (!item) { skipped++; continue; }

  const timeline = item.content?.payload?.intensive?.timeline || [];
  const step = timeline.find(s => s.stepId === patch.stepId);
  if (!step) { skipped++; continue; }

  const choice = step.question?.choices?.find(c => c.id === patch.choiceId);
  if (!choice) { skipped++; continue; }

  choice.text = patch.fix;
  applied++;
}

console.log(`적용: ${applied}건, 건너뜀: ${skipped}건, 빈 fix: ${empty}건`);

if (applied > 0) {
  fs.writeFileSync(batchPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ ${batchPath} 저장 완료`);
} else {
  console.log('적용할 수정사항 없음');
}
