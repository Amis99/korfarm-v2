// 특정 Day의 static 파일을 배치 파일에 동기화하는 스크립트
// 사용법: node scripts/sync-batch-r3.js [dayIndex]

const fs = require('fs');
const dayIndex = parseInt(process.argv[2]);
if (!dayIndex) {
  console.error('사용법: node scripts/sync-batch-r3.js [dayIndex]');
  process.exit(1);
}

const batchPath = 'generated/daily-batch-reading-russell3.json';
const staticPath = `frontend/public/daily-reading/russell3/${String(dayIndex).padStart(3, '0')}.json`;

const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const staticContent = JSON.parse(fs.readFileSync(staticPath, 'utf8'));

// 배치에서 해당 day_index 항목 찾기
const itemIndex = batch.items.findIndex(item => item.day_index === dayIndex);
if (itemIndex === -1) {
  console.error(`day_index ${dayIndex}를 배치 파일에서 찾을 수 없음`);
  process.exit(1);
}

// content 교체
batch.items[itemIndex].content = staticContent;
// sub_area도 동기화
batch.items[itemIndex].sub_area = staticContent.subArea;

fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log(`배치 파일 Day ${dayIndex} 동기화 완료 (index: ${itemIndex})`);
