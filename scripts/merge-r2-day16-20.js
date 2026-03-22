// Day 16~20 배치 파일 교체 스크립트
const fs = require('fs');

const batchFile = "C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/generated/daily-batch-reading-russell2.json";
const batch = JSON.parse(fs.readFileSync(batchFile, 'utf8'));

const newDays = [16, 17, 18, 19, 20];
for (const day of newDays) {
  const newItem = JSON.parse(fs.readFileSync(`C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/generated/day${day}-batch.json`, 'utf8'));
  const idx = batch.items.findIndex(i => i.day_index === day);
  if (idx !== -1) {
    batch.items[idx] = newItem;
    console.log(`Day ${day}: 교체 완료 (index ${idx})`);
  } else {
    batch.items.push(newItem);
    console.log(`Day ${day}: 추가 완료`);
  }
}

fs.writeFileSync(batchFile, JSON.stringify(batch, null, 2), 'utf8');
console.log("\n배치 파일 저장 완료. 총 아이템:", batch.items.length);

// 임시 파일 삭제
for (const day of newDays) {
  const tempFile = `C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/generated/day${day}-batch.json`;
  fs.unlinkSync(tempFile);
}
console.log("임시 배치 파일 삭제 완료");
