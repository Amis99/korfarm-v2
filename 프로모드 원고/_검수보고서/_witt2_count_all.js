const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '비트겐슈타인2');
const chapters = []; for (let i=1;i<=20;i++) chapters.push('ch'+String(i).padStart(2,'0'));

let total = 0;
const breakdown = {};
for (const ch of chapters) {
  const dir = path.join(root, ch);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json');
  for (const f of files) {
    let data;
    try { data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch(e){continue;}
    const mc = data?.questions?.multipleChoice;
    if (Array.isArray(mc)) {
      total += mc.length;
      breakdown[f] = (breakdown[f]||0) + mc.length;
    }
    // pattern_workbook, chapter_test에서도 multipleChoice가 있을 수 있음
    if (data?.problems) {
      const cnt = data.problems.filter(p => p.type === 'multipleChoice' || (p.choices && p.answer)).length;
      if (cnt > 0) { total += cnt; breakdown['(test/pattern)'+f] = (breakdown['(test/pattern)'+f]||0)+cnt; }
    }
  }
}
console.error('total:', total);
console.error('breakdown:', breakdown);
