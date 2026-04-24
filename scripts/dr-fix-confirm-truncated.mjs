#!/usr/bin/env node
/**
 * confirm 잔여 truncated 케이스 자동 수정:
 *   - ans가 prompt의 더 긴 단어 일부 → enclosing 단어로 복원 (단, 지문 등장 ≥1회)
 *   - prompt를 학년별 "찾기" 형식으로 변환
 *   - answerRanges를 새 ans 위치들로 갱신
 *
 * 보호:
 *   - enclosing이 지문에 없으면 ans 유지 (수동 검토용 보고서로 분리)
 *   - 한자 학습형 (saussure: prompt에 "글자/한자" + ans 1글자) → 변환 제외
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const DAILY_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading');
const TMP_DIR = path.join(ROOT, 'tmp');

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
const dryRun = args['dry-run'] === true || args['dry-run'] === 'true';

const LEVELS = [
  'saussure1','saussure2','saussure3',
  'frege1','frege2','frege3',
  'russell1','russell2','russell3',
  'wittgenstein1','wittgenstein2','wittgenstein3',
];

function paragraphMap(payload) {
  const paras = (payload?.passage?.paragraphs) || [];
  return Object.fromEntries(paras.map((p) => [p.id, p.text || '']));
}

function findEnclosingWord(prompt, ans) {
  const tokens = prompt.split(/[\s.,?!"'‘’"“"`「」『』《》<>()]+/);
  const josaList = ['으로서','으로써','으로부터','부터','까지','한테','에게서','한테서','에서부터',
                    '에서','에게','으로','와','과','도','만','의','은','는','이','가','을','를','로','이여','여'];
  for (const t of tokens) {
    if (!t || t === ans) continue;
    if (t.includes(ans) && t.length > ans.length) {
      let stem = t;
      for (const j of josaList) {
        if (stem.endsWith(j) && stem.length > j.length) { stem = stem.slice(0, -j.length); break; }
      }
      if (stem.length > ans.length && stem.includes(ans)) return stem;
    }
  }
  return null;
}

function findAllOccurrences(haystack, needle) {
  if (!needle) return [];
  const out = [];
  let from = 0;
  while (true) {
    const idx = haystack.indexOf(needle, from);
    if (idx < 0) break;
    out.push({ start: idx, end: idx + needle.length });
    from = idx + 1;
  }
  return out;
}

function isFindForm(prompt) {
  return /(찾으시오|찾아라|찾으세요|찾아\s*보세요|찾기)/.test(prompt);
}

function newPromptByLevel(level, X) {
  const last = X.slice(-1);
  const code = last.charCodeAt(0);
  let josa;
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const hasBatchim = (code - 0xAC00) % 28 !== 0;
    josa = hasBatchim ? '을' : '를';
  } else josa = '을(를)';
  if (level.startsWith('saussure')) return `지문에서 '${X}'${josa} 모두 찾아 보세요.`;
  if (level.startsWith('frege')) return `지문에서 '${X}'${josa} 모두 찾으세요.`;
  if (level.startsWith('russell')) return `지문에서 '${X}'${josa} 모두 찾으시오.`;
  return `본문에서 '${X}'${josa} 모두 찾으시오.`;
}

const results = { fixed: [], skipped_no_enclosing: [], skipped_hanja_lesson: [], skipped_already_find: [] };
let scanned = 0, touchedFiles = 0;

for (const level of LEVELS) {
  const dir = path.join(DAILY_DIR, level);
  if (!fs.existsSync(dir)) continue;
  for (const fname of fs.readdirSync(dir).filter((n) => /^\d{3}\.json$/.test(n))) {
    const day = fname.slice(0, 3);
    const filePath = path.join(dir, fname);
    let doc;
    try { doc = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { continue; }
    const payload = doc?.payload || doc;
    const cqs = (payload?.confirm?.questions) || [];
    const paras = paragraphMap(payload);
    let touched = false;
    cqs.forEach((q) => {
      scanned += 1;
      const prompt = String(q.prompt || '').trim();
      const ans = String(q.answerText || '').trim();
      if (!ans || !prompt.includes(ans)) return;
      if (isFindForm(prompt)) {
        results.skipped_already_find.push({ level, day, qid: q.id || '', prompt, ans });
        return;
      }
      const enclosing = findEnclosingWord(prompt, ans);
      if (!enclosing) return; // truncated 아님
      // 한자 학습형 보호: prompt에 "글자|한자" 키워드 + ans 1글자
      if (/(글자|한자)/.test(prompt) && ans.length === 1) {
        results.skipped_hanja_lesson.push({ level, day, qid: q.id || '', prompt, ans });
        return;
      }
      // enclosing이 지문에 등장하는지
      const occs = [];
      for (const [pid, ptext] of Object.entries(paras)) {
        for (const o of findAllOccurrences(ptext, enclosing)) {
          occs.push({ paragraphId: pid, start: o.start, end: o.end });
        }
      }
      if (occs.length === 0) {
        results.skipped_no_enclosing.push({ level, day, qid: q.id || '', prompt, ans, suggestedAns: enclosing });
        return;
      }
      // 자동 적용 안전 기준:
      //   1) prompt가 짧음 (≤18자)
      //   2) prompt 첫 단어가 enclosing으로 시작 (주어=묻는 단어)
      //   이외는 false positive 위험 → 보고서만
      const isShortLeading = prompt.length <= 18 && (
        prompt.startsWith(enclosing + '은') || prompt.startsWith(enclosing + '는') ||
        prompt.startsWith(enclosing + '이') || prompt.startsWith(enclosing + '가') ||
        prompt.startsWith(enclosing + '의')
      );
      if (!isShortLeading) {
        results.skipped_no_enclosing.push({ level, day, qid: q.id || '', prompt, ans, suggestedAns: enclosing,
          reason: prompt.length > 18 ? 'prompt too long (풀이형 가능)' : 'first word ≠ enclosing (false positive 위험)' });
        return;
      }
      // 적용: ans=enclosing, ranges=occs, prompt=찾기 형식
      const newAns = enclosing;
      const newRanges = occs;
      const newPrompt = newPromptByLevel(level, newAns);
      results.fixed.push({ level, day, qid: q.id || '', oldPrompt: prompt, newPrompt, oldAns: ans, newAns,
                          oldRangeCount: (q.answerRanges || []).length, newRangeCount: newRanges.length });
      if (!dryRun) {
        q.prompt = newPrompt;
        q.answerText = newAns;
        q.answerRanges = newRanges;
        touched = true;
      }
    });
    if (touched) {
      fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
      touchedFiles += 1;
    }
  }
}

console.log(`scanned=${scanned}  fixed=${results.fixed.length}  skipped_no_enclosing=${results.skipped_no_enclosing.length}  skipped_hanja=${results.skipped_hanja_lesson.length}  files touched=${touchedFiles}  (dryRun=${dryRun})`);

// 보고서
fs.mkdirSync(TMP_DIR, { recursive: true });
const out = path.join(TMP_DIR, `confirm-truncated-fix-report${dryRun?'-dryrun':''}.txt`);
const lines = [];
lines.push(`# truncated 자동 수정 보고서  fixed=${results.fixed.length}  no_enclosing=${results.skipped_no_enclosing.length}  hanja=${results.skipped_hanja_lesson.length}`);
lines.push('\n# ─── 수정됨 ───\n');
for (const r of results.fixed) {
  lines.push(`[${r.level}/${r.day}#${r.qid}]`);
  lines.push(`  OLD prompt: ${r.oldPrompt}`);
  lines.push(`  NEW prompt: ${r.newPrompt}`);
  lines.push(`  OLD ans=${r.oldAns}(ranges=${r.oldRangeCount}) → NEW ans=${r.newAns}(ranges=${r.newRangeCount})`);
  lines.push('');
}
lines.push('\n# ─── 지문에 enclosing 없음 (수동 검토) ───\n');
for (const r of results.skipped_no_enclosing) {
  lines.push(`[${r.level}/${r.day}#${r.qid}] prompt=${r.prompt} | ans=${r.ans} | 추천=${r.suggestedAns}(0회)`);
}
lines.push('\n# ─── 한자 학습 — 그대로 ───\n');
for (const r of results.skipped_hanja_lesson) {
  lines.push(`[${r.level}/${r.day}#${r.qid}] prompt=${r.prompt} | ans=${r.ans}`);
}
fs.writeFileSync(out, lines.join('\n'), 'utf8');
console.log(`보고서 → ${out}`);
