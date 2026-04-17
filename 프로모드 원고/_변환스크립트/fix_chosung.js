/**
 * 비트겐슈타인 literature commentary blanks 초성 hint 일괄 재계산.
 *
 * 정책: 정답(answer)에서 한글만 초성으로 변환, 공백·특수문자는 그대로 유지.
 *  예) "자아 성찰" → "ㅈㅇ ㅅㅊ"
 *      "비정규직"  → "ㅂㅈㄱㅈ"
 *
 * 실행:
 *   node fix_chosung.js          # 모든 파일 처리
 *   node fix_chosung.js --dry    # 변경 대상만 표시
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry");

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
function chosungChar(ch) {
  const c = ch.charCodeAt(0) - 0xAC00;
  if (c < 0 || c > 11171) return ch;
  return CHO[Math.floor(c / 588)];
}
/**
 * 정책:
 *  - 한글 음절 → 초성
 *  - 공백 → 공백 보존
 *  - 그 외(한자·괄호·구두점·숫자 등) → 제거
 *  - 연속 공백·앞뒤 공백 정리
 *  예) "자아 성찰"  → "ㅈㅇ ㅅㅊ"
 *      "기(記)문"   → "ㄱㅁ"
 *      "나, 곧 자아" → "ㄴ ㄱ ㅈㅇ"
 */
function chosungPreserveSpace(s) {
  let out = [...String(s)].map(c => {
    if (/[가-힣]/.test(c)) return chosungChar(c);
    if (c === " ") return " ";
    return ""; // 한자·구두점·괄호·숫자 등 제거
  }).join("");
  // 연속 공백 단일화 + trim
  return out.replace(/\s+/g, " ").trim();
}

const stats = { files: 0, blanks: 0, changed: 0, samples: [] };

function processFile(p) {
  let txt = fs.readFileSync(p, "utf8");
  if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1);
  const d = JSON.parse(txt);
  if (!d.commentary || !Array.isArray(d.commentary.blanks)) return;
  stats.files++;
  let modifiedAny = false;
  for (const b of d.commentary.blanks) {
    if (!b.answer) continue;
    stats.blanks++;
    const expected = chosungPreserveSpace(b.answer);
    if (b.hint !== expected) {
      stats.changed++;
      if (stats.samples.length < 8) {
        stats.samples.push({ file: path.relative(ROOT, p), id: b.id, answer: b.answer, oldHint: b.hint, newHint: expected });
      }
      b.hint = expected;
      modifiedAny = true;
    }
  }
  if (modifiedAny && !DRY) {
    fs.writeFileSync(p, JSON.stringify(d, null, 2), "utf8");
  }
}

function walkLiterature(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ch of fs.readdirSync(dir)) {
    const chDir = path.join(dir, ch);
    if (!fs.statSync(chDir).isDirectory() || !ch.startsWith("ch")) continue;
    for (const f of fs.readdirSync(chDir)) {
      if (f.startsWith("literature_") && f.endsWith(".json")) {
        try { processFile(path.join(chDir, f)); }
        catch (e) { console.error(`[err] ${chDir}/${f}: ${e.message}`); }
      }
    }
  }
}

console.log(`[fix_chosung] DRY=${DRY}`);
for (const L of ["비트겐슈타인1", "비트겐슈타인2", "비트겐슈타인3"]) {
  walkLiterature(path.join(ROOT, L));
}
console.log(`처리 파일: ${stats.files}, 전체 blanks: ${stats.blanks}, 수정: ${stats.changed}`);
console.log("\n--- 샘플 변경 ---");
for (const s of stats.samples) {
  console.log(`  ${s.file} ${s.id}: "${s.answer}" hint "${s.oldHint}" → "${s.newHint}"`);
}
if (DRY) console.log("\n[DRY 모드 — 파일 변경 없음]");
