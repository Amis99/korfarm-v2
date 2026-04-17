/**
 * 비트 reading_NN.json의 passage에 figures 빈 배열 필드 추가.
 * 메타 필드만 추가, 콘텐츠는 그대로.
 *
 * 정책 (사용자 결정 2026-04-17): 메타 필드는 스크립트 일괄 OK.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
let touched = 0, skipped = 0;

for (const L of ["비트겐슈타인1", "비트겐슈타인2", "비트겐슈타인3"]) {
  const dir = path.join(ROOT, L);
  if (!fs.existsSync(dir)) continue;
  for (const ch of fs.readdirSync(dir)) {
    const chDir = path.join(dir, ch);
    if (!fs.statSync(chDir).isDirectory() || !ch.startsWith("ch")) continue;
    for (const f of fs.readdirSync(chDir)) {
      if (!f.startsWith("reading_") || !f.endsWith(".json")) continue;
      const p = path.join(chDir, f);
      let txt = fs.readFileSync(p, "utf8");
      if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1);
      const d = JSON.parse(txt);
      if (!d.passage || typeof d.passage !== "object") { skipped++; continue; }
      if (Array.isArray(d.passage.figures)) { skipped++; continue; }
      d.passage.figures = [];
      fs.writeFileSync(p, JSON.stringify(d, null, 2), "utf8");
      touched++;
    }
  }
}
console.log(`figures 추가: ${touched}, 이미 있음·skip: ${skipped}`);
