const fs = require('fs');
const filePath = 'frontend/public/daily-quiz/프레게3/227.json';
const raw = fs.readFileSync(filePath, 'utf8');

let out = '';
let inString = false;
let escNext = false;
let fixCount = 0;

for (let i = 0; i < raw.length; i++) {
  const ch = raw[i];
  const code = raw.charCodeAt(i);

  if (escNext) {
    out += ch;
    escNext = false;
    continue;
  }

  if (ch === '\\') {
    escNext = true;
    out += ch;
    continue;
  }

  if (ch === '"') {
    inString = !inString;
    out += ch;
    continue;
  }

  if (inString && code < 0x20) {
    fixCount++;
    if (code === 0x09) out += '\\t';
    else if (code === 0x0A) out += '\\n';
    else if (code === 0x0D) out += '\\r';
    // 그 외 제어문자는 제거
    continue;
  }

  out += ch;
}

console.log('수정 건수:', fixCount);
try {
  JSON.parse(out);
  fs.writeFileSync(filePath, out, 'utf8');
  console.log('OK: 파싱 성공, 저장 완료');
} catch (e) {
  console.log('ERR:', e.message.substring(0, 120));
}
