const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../saussure2');
const pins = {
  // 설날/한복
  '075': '035',
  '125': '036',
  '266': '037',
  // 봄비
  '022': '080',
  '058': '081',
  // 식목일
  '100': '095',
  '170': '096',
  // 어린이날
  '015': '125',
  // 어버이날
  '119': '128',
  // 스승의날
  '120': '135',
  // 현충일
  '177': '157',
  // 장마철/무더위 시작
  '112': '180',
  '174': '181',
  // 제헌절
  '185': '198',
  // 광복절
  '214': '227',
  // 가을
  '068': '250',
  // 한글날
  '065': '282',
  '103': '283',
  // 동지
  '338': '355',
  // 크리스마스
  '333': '359',
  '334': '360',
  '337': '361'
};

const allFilesPattern = /^[0-9]{3}\.json$/;
const oldFiles = fs.readdirSync(targetDir).filter(f => allFilesPattern.test(f)).map(f => f.replace('.json', '')).sort();

if (oldFiles.length !== 365) {
  console.error("Warning: count of old files is not 365, it is " + oldFiles.length);
}

const oldToNew = {};
const assignedNew = new Set();
const assignedOld = new Set();

for (const [oldNum, newNum] of Object.entries(pins)) {
  if (oldFiles.includes(oldNum)) {
    oldToNew[oldNum] = newNum;
    assignedNew.add(newNum);
    assignedOld.add(oldNum);
  }
}

// 남은 기존 파일과 빈자리 확보
const remainingOld = oldFiles.filter(o => !assignedOld.has(o)).sort();
const remainingNew = [];
for (let i = 1; i <= oldFiles.length; i++) {
  const newNumStr = i.toString().padStart(3, '0');
  if (!assignedNew.has(newNumStr)) {
    remainingNew.push(newNumStr);
  }
}

remainingNew.sort();

if (remainingOld.length !== remainingNew.length) {
  console.error("Mismatch in remaining arrays", remainingOld.length, remainingNew.length);
  process.exit(1);
}

for (let i = 0; i < remainingOld.length; i++) {
  oldToNew[remainingOld[i]] = remainingNew[i];
}

let movedCount = 0;
for (const oldNum of Object.keys(oldToNew)) {
  const newNum = oldToNew[oldNum];
  const oldPath = path.join(targetDir, `${oldNum}.json`);
  const newPath = path.join(targetDir, `s2_${newNum}.json`);
  
  const content = fs.readFileSync(oldPath, 'utf8');
  let data;
  try {
    data = JSON.parse(content);
  } catch(e) {
    console.error("Error parsing " + oldPath);
    continue;
  }
  
  // contentId 변경 (필요시 Regex 처리)
  data.contentId = `dr-s2-${newNum}`;
  
  fs.writeFileSync(newPath, JSON.stringify(data, null, 2), 'utf8');
  movedCount++;
}

console.log(`Successfully mapped and copied ${movedCount} files to s2_XXX.json format.`);
