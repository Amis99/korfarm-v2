const fs = require('fs');
const path = process.argv[2];
const queries = process.argv.slice(3);
const d = JSON.parse(fs.readFileSync(path, 'utf8'));
for (const p of d.payload.passage.paragraphs) {
  for (const q of queries) {
    let idx = 0;
    while (true) {
      const found = p.text.indexOf(q, idx);
      if (found < 0) break;
      console.log(`${q} | ${p.id} | start=${found} end=${found + q.length} | "${p.text.substring(Math.max(0, found - 8), found + q.length + 8)}"`);
      idx = found + 1;
    }
  }
}
