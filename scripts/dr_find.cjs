// 사용법: node scripts/dr_find.cjs <파일경로> <단어>
const fs = require('fs');
const path = process.argv[2];
const word = process.argv[3];
const d = JSON.parse(fs.readFileSync(path, 'utf-8'));
for (const p of d.payload.passage.paragraphs) {
  const t = p.text;
  let i = 0;
  const positions = [];
  while ((i = t.indexOf(word, i)) !== -1) {
    positions.push(i);
    i += word.length;
  }
  if (positions.length) {
    for (const pos of positions) {
      const ctxS = Math.max(0, pos - 8);
      const ctxE = Math.min(t.length, pos + word.length + 8);
      console.log(`[${p.id}] start=${pos} end=${pos + word.length} ctx="${t.slice(ctxS, ctxE)}"`);
    }
  }
}
