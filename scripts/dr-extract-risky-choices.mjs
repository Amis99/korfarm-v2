#!/usr/bin/env node
/**
 * 일일독해 위험 문항(단독 최장=정답) 추출.
 * 한 배치(N문항)를 사람/LLM이 검토할 수 있는 컴팩트한 텍스트 형식으로 출력.
 *
 * 사용:
 *   node scripts/dr-extract-risky-choices.mjs --level russell1 --start-day 1 --end-day 5
 *   node scripts/dr-extract-risky-choices.mjs --level russell1 --max 50
 *
 * 출력:
 *   tmp/risky-choices-{level}-{stamp}.txt   (사람 읽기용)
 *   tmp/risky-choices-{level}-{stamp}.json  (패치 적용용 메타)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const DAILY_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading');
const TMP_DIR = path.join(ROOT, 'tmp');

// CLI args: --key=value 또는 --key value 둘 다 지원
const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (!m) { args[a] = true; continue; }
  const key = m[1];
  if (m[2] !== undefined) { args[key] = m[2]; continue; }
  const next = argv[i + 1];
  if (next != null && !next.startsWith('--')) { args[key] = next; i += 1; }
  else { args[key] = true; }
}
const level = args.level;
const startDay = Number(args['start-day'] || 1);
const endDay = Number(args['end-day'] || 365);
const maxItems = Number(args.max || Infinity);

if (!level) { console.error('--level required'); process.exit(2); }

const dir = path.join(DAILY_DIR, level);
if (!fs.existsSync(dir)) { console.error('not found:', dir); process.exit(2); }

function lengthOf(t) { return String(t || '').trim().length; }

function paragraphTextOf(payload, paragraphId) {
  const paras = (payload?.passage?.paragraphs) || [];
  const p = paras.find((x) => x?.id === paragraphId);
  return p?.text || '';
}

function sliceWithEllipsis(text, start, end, pad = 30) {
  const s = Math.max(0, (start ?? 0) - pad);
  const e = Math.min(text.length, (end ?? text.length) + pad);
  return (s > 0 ? '…' : '') + text.slice(s, e) + (e < text.length ? '…' : '');
}

const files = fs.readdirSync(dir).filter((n) => /^\d{3}\.json$/.test(n)).sort();
const items = [];
for (const fname of files) {
  const day = Number(fname.slice(0, 3));
  if (day < startDay || day > endDay) continue;
  const docPath = path.join(dir, fname);
  let doc;
  try { doc = JSON.parse(fs.readFileSync(docPath, 'utf8')); } catch { continue; }
  const payload = doc?.payload || doc;
  const tl = (payload?.intensive?.timeline) || [];
  tl.forEach((step, idx) => {
    const q = step?.question || {};
    const choices = q.choices || [];
    const answerId = q.answerId;
    if (!Array.isArray(choices) || choices.length < 2 || !answerId) return;
    const lens = choices.map((c) => ({ id: c.id || c.choiceId, len: lengthOf(c.text), text: c.text }));
    const maxLen = Math.max(...lens.map((x) => x.len));
    const longest = lens.filter((x) => x.len === maxLen);
    if (longest.length !== 1) return; // tie → 휴리스틱 안 통함
    if (longest[0].id !== answerId) return; // 단독 최장 ≠ 정답 → OK
    // 위험 문항: 단독 최장 = 정답
    // paragraph 컨텍스트
    const h = step?.highlight || {};
    const ranges = h.ranges || (h.paragraphId && h.range ? [{ paragraphId: h.paragraphId, start: h.range.start, end: h.range.end }] : []);
    const pid = ranges[0]?.paragraphId || null;
    const paraText = pid ? paragraphTextOf(payload, pid) : '';
    const start = ranges[0]?.start;
    const end = ranges[0]?.end;
    const highlightSnippet = (start != null && end != null && paraText)
      ? sliceWithEllipsis(paraText, start, end)
      : (paraText.slice(0, 100) + (paraText.length > 100 ? '…' : ''));
    items.push({
      level, day: fname.slice(0, 3), stepIdx: idx,
      stepId: step?.stepId || null,
      paragraphId: pid,
      passageSnippet: highlightSnippet,
      prompt: q.prompt || '',
      answerId,
      choices: lens,
    });
    if (items.length >= maxItems) return;
  });
  if (items.length >= maxItems) break;
}

fs.mkdirSync(TMP_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outBase = path.join(TMP_DIR, `risky-choices-${level}-d${startDay}-${endDay}-${stamp}`);
const txtLines = [];
txtLines.push(`# 위험 문항 ${items.length}개 (level=${level}, days ${startDay}-${endDay})`);
txtLines.push(`# 정답이 단독 최장 — 학생이 길이만 보고도 정답 짚을 가능성 큼.`);
txtLines.push(`# 보강 방향:`);
txtLines.push(`#   - 정답 길이는 그대로 두고 다른 오답 1~2개를 자연스러운 표현으로 길이 비슷하게.`);
txtLines.push(`#   - 또는 정답을 간결하게 다듬고, 짧은 오답을 그대로.`);
txtLines.push(`#   - 모든 선택지 자연스러운 한국어. 학년 수준에 맞춤.`);
txtLines.push(`#   - 답 ID는 유지.`);
txtLines.push('');
items.forEach((it, i) => {
  txtLines.push(`[#${i + 1}] ${it.level}/${it.day} step${it.stepIdx} (stepId=${it.stepId})`);
  txtLines.push(`  지문: ${it.passageSnippet}`);
  txtLines.push(`  발문: ${it.prompt}`);
  txtLines.push(`  정답 ID: ${it.answerId}`);
  it.choices.forEach((c) => {
    const star = c.id === it.answerId ? ' ★정답' : '';
    txtLines.push(`    [${c.id}] (${c.len}자) ${c.text}${star}`);
  });
  txtLines.push('');
});

fs.writeFileSync(`${outBase}.txt`, txtLines.join('\n'), 'utf8');
fs.writeFileSync(`${outBase}.json`, JSON.stringify(items, null, 2), 'utf8');
console.log(`총 ${items.length}개 위험 문항`);
console.log(`TXT: ${outBase}.txt`);
console.log(`JSON: ${outBase}.json`);
