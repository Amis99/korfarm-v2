// 배치 파일 items[2], items[3] 교체
const fs = require('fs');

const batchPath = 'generated/daily-batch-reading-wittgenstein1.json';
const day3Path = 'frontend/public/daily-reading/wittgenstein1/003.json';
const day4Path = 'frontend/public/daily-reading/wittgenstein1/004.json';

const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const day3 = JSON.parse(fs.readFileSync(day3Path, 'utf8'));
const day4 = JSON.parse(fs.readFileSync(day4Path, 'utf8'));

// items[2] = day_index 3
batch.items[2] = {
  content_type: "DAILY_READING",
  level_id: "WITTGENSTEIN_1",
  area: "READING",
  sub_area: "NONFICTION",
  day_index: 3,
  module_key: "reading_training",
  schema_version: "1.0",
  content: day3
};

// items[3] = day_index 4
batch.items[3] = {
  content_type: "DAILY_READING",
  level_id: "WITTGENSTEIN_1",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 4,
  module_key: "reading_training",
  schema_version: "1.0",
  content: day4
};

fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');

// 검증
console.log('배치 파일 업데이트 완료');
console.log('items[2]:', batch.items[2].day_index, batch.items[2].sub_area, batch.items[2].content.contentId);
console.log('items[3]:', batch.items[3].day_index, batch.items[3].sub_area, batch.items[3].content.contentId);

// 최종 검증
for (let idx of [2, 3]) {
  const item = batch.items[idx];
  const c = item.content;
  const paras = c.payload.passage.paragraphs;
  const totalLen = paras.reduce((sum, p) => sum + p.text.length, 0);
  const recall = c.payload.recall.cards.length;
  const confirm = c.payload.confirm.questions.length;
  console.log(`\nDay ${item.day_index} (${item.sub_area}):`);
  console.log(`  지문 길이: ${totalLen}자 (${totalLen >= 1350 && totalLen <= 1450 ? 'OK' : 'FAIL'})`);
  console.log(`  복기 카드: ${recall}개 (${recall === 8 ? 'OK' : 'FAIL'})`);
  console.log(`  확인 문항: ${confirm}개 (${confirm >= 5 && confirm <= 10 ? 'OK' : 'FAIL'})`);
}
