// 배치 파일 items[2]~items[4] 교체
const fs = require('fs');

const batchPath = './generated/daily-batch-reading-russell2.json';
const data = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

const day3 = JSON.parse(fs.readFileSync('./scripts/day3-batch-item.json', 'utf8'));
const day4 = JSON.parse(fs.readFileSync('./scripts/day4-batch-item.json', 'utf8'));
const day5 = JSON.parse(fs.readFileSync('./scripts/day5-batch-item.json', 'utf8'));

// items[2] = Day 3 (index 0-based), items[3] = Day 4, items[4] = Day 5
data.items[2] = day3;
data.items[3] = day4;
data.items[4] = day5;

fs.writeFileSync(batchPath, JSON.stringify(data, null, 2), 'utf8');
console.log("배치 파일 업데이트 완료:", batchPath);

// 검증
for (let i = 2; i <= 4; i++) {
  const item = data.items[i];
  const c = item.content;
  const pLen = c.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
  const recall = c.payload.recall.cards.length;
  const confirm = c.payload.confirm.questions.length;
  const intensive = c.payload.intensive.timeline.length;
  console.log(`Day ${i+1}: 글자수=${pLen}, recall=${recall}, confirm=${confirm}, intensive=${intensive}, contentId=${c.contentId}`);
}
