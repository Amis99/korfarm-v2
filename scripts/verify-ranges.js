const fs = require('fs');
const file = process.argv[2];
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const paras = data.content.payload.passage.paragraphs;
const confirms = data.content.payload.confirm.questions;
let allOk = true;
for (const q of confirms) {
  for (const r of q.answerRanges) {
    const para = paras.find(p => p.id === r.paragraphId);
    const extracted = para.text.substring(r.start, r.end);
    const ok = extracted === q.answerText;
    if (!ok) allOk = false;
    console.log(q.id + ': 답=' + JSON.stringify(q.answerText) + ' 추출=' + JSON.stringify(extracted) + ' [' + r.paragraphId + ':' + r.start + '-' + r.end + '] ' + (ok ? '✅' : '❌ 불일치!'));
  }
}
if (allOk) console.log('\n✅ 모든 answerRange 정확');
else console.log('\n❌ 일부 answerRange 불일치 - 수정 필요');
