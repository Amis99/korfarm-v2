// 배치 파일 items[3]~items[5] (Day 4~6) 교체
const fs = require('fs');
const path = require('path');

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell1.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

const days = [
  { dayIndex: 4, subArea: 'LITERATURE', file: '004.json' },
  { dayIndex: 5, subArea: 'NONFICTION', file: '005.json' },
  { dayIndex: 6, subArea: 'LITERATURE', file: '006.json' },
];

for (const day of days) {
  const contentPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell1', day.file);
  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

  const item = {
    content_type: "DAILY_READING",
    level_id: "RUSSELL_1",
    area: "READING",
    sub_area: day.subArea,
    day_index: day.dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content: content
  };

  // items 배열 인덱스: day_index - 1
  const idx = day.dayIndex - 1;
  if (idx < batch.items.length) {
    batch.items[idx] = item;
    console.log(`items[${idx}] (Day ${day.dayIndex}) 교체 완료`);
  } else {
    console.log(`ERROR: items[${idx}] 범위 초과. items.length=${batch.items.length}`);
  }
}

fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log('\n배치 파일 저장:', batchPath);
console.log('총 items:', batch.items.length);
