const fs = require('fs');
const filePath = 'frontend/public/daily-quiz/프레게3/227.json';
const raw = fs.readFileSync(filePath, 'utf8');

// 1단계: string 내부 literal 제어문자 이스케이프
let step1 = '';
let inString = false;
let escNext = false;
let fixCount = 0;

for (let i = 0; i < raw.length; i++) {
  const ch = raw[i];
  const code = raw.charCodeAt(i);

  if (escNext) {
    step1 += ch;
    escNext = false;
    continue;
  }
  if (ch === '\\') {
    escNext = true;
    step1 += ch;
    continue;
  }
  if (ch === '"') {
    inString = !inString;
    step1 += ch;
    continue;
  }
  if (inString && code < 0x20) {
    fixCount++;
    if (code === 0x09) step1 += '\\t';
    else if (code === 0x0A) step1 += '\\n';
    else if (code === 0x0D) step1 += '\\r';
    continue;
  }
  step1 += ch;
}
console.log('제어문자 수정:', fixCount, '건');

// 2단계: 1단계 결과 파싱 시도
try {
  JSON.parse(step1);
  fs.writeFileSync(filePath, step1, 'utf8');
  console.log('OK: 1단계만으로 파싱 성공');
  process.exit(0);
} catch(e) {
  console.log('1단계 후 에러:', e.message.substring(0, 120));
  const m = e.message.match(/position (\d+)/);
  if (m) {
    const pos = parseInt(m[1]);
    console.log('오류 위치 주변:', JSON.stringify(step1.substring(pos - 30, pos + 60)));
  }
}

// 3단계: evidenceTokens 앞에 쉼표 삽입 후 재시도
const etPos = step1.indexOf('"evidenceTokens"');
if (etPos === -1) { console.log('evidenceTokens 없음'); process.exit(1); }

const step2 = step1.substring(0, etPos) + ',\n        ' + step1.substring(etPos);

try {
  JSON.parse(step2);
  fs.writeFileSync(filePath, step2, 'utf8');
  console.log('OK: 3단계(쉼표 삽입) 파싱 성공, 저장 완료');
  process.exit(0);
} catch(e) {
  console.log('3단계 후 에러:', e.message.substring(0, 150));
  const m = e.message.match(/position (\d+)/);
  if (m) {
    const pos = parseInt(m[1]);
    console.log('오류 위치 주변:', JSON.stringify(step2.substring(pos - 30, pos + 60)));
  }
}
