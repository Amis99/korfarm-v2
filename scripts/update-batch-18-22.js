const fs = require('fs');
const path = require('path');

const batchFile = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell1.json');
const data = JSON.parse(fs.readFileSync(batchFile, 'utf8'));

// 새로운 Day 18~22 배치 아이템 로드
for (let day = 18; day <= 22; day++) {
  const newItem = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'generated', 'new', `day${day}-batch.json`), 'utf8'));
  const idx = data.items.findIndex(item => item.day_index === day);
  if (idx === -1) {
    console.log(`Day ${day}: 기존 항목 없음, 스킵`);
    continue;
  }
  data.items[idx] = newItem;
  console.log(`Day ${day}: 인덱스 ${idx} 교체 완료`);
}

fs.writeFileSync(batchFile, JSON.stringify(data, null, 2), 'utf8');
console.log('배치 파일 업데이트 완료!');
