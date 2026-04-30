const fs = require('fs');
const filePath = 'frontend/public/daily-quiz/프레게3/227.json';
const raw = fs.readFileSync(filePath, 'utf8');

// evidenceTokens 위치 찾기
const etPos = raw.indexOf('"evidenceTokens"');
if (etPos === -1) { console.log('evidenceTokens 없음'); process.exit(1); }

// etPos 앞의 " 하나가 stem 문자열을 닫는 closing quote
// 그 뒤에 쉼표가 없으므로 삽입
// etPos 직전에 어떤 글자가 있는지 확인
console.log('etPos 앞 20자:', JSON.stringify(raw.substring(etPos - 20, etPos)));

// stem 닫히는 " 는 바로 etPos 바로 앞의 "
// 그 다음에 , 가 있는지 확인
const afterClose = raw.substring(etPos - 5, etPos + 5);
console.log('stem 종료 주변:', JSON.stringify(afterClose));

// 수정: evidenceTokens 앞에 ", " 가 없으면 삽입
// 실제로는 closing " 뒤에 바로 "evidenceTokens" 가 붙어있으므로
// "evidenceTokens" 앞에 ",\n        " 삽입
const fixed = raw.substring(0, etPos) + ',\n        ' + raw.substring(etPos);

try {
  JSON.parse(fixed);
  fs.writeFileSync(filePath, fixed, 'utf8');
  console.log('OK: 파싱 성공, 저장 완료');
} catch(e) {
  console.log('ERR:', e.message.substring(0, 150));
  // 에러 위치 주변 출력
  const m = e.message.match(/position (\d+)/);
  if (m) {
    const pos = parseInt(m[1]);
    console.log('오류 위치 주변:', JSON.stringify(fixed.substring(pos - 30, pos + 50)));
  }
}
