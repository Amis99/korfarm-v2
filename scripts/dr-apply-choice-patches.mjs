#!/usr/bin/env node
/**
 * 일일독해 선택지 보강 패치를 로컬 JSON에 적용 (DB 적용은 별도 단계).
 *
 * 패치 형식 (JSON 배열):
 *   [
 *     { "level": "russell1", "day": "001", "stepIdx": 3, "stepId": "...",
 *       "answerId": "B", "newChoices": [
 *         { "id": "A", "text": "..." },
 *         { "id": "B", "text": "..." },  // 정답
 *         { "id": "C", "text": "..." },
 *         { "id": "D", "text": "..." }
 *       ]
 *     },
 *     ...
 *   ]
 *
 * 검증:
 *   - 각 choice의 id가 기존과 동일한 집합인지
 *   - answerId가 newChoices에 존재하는지
 *   - 단독 최장 ≠ 정답 (보강 효과 검증)
 *
 * 사용:
 *   node scripts/dr-apply-choice-patches.mjs --patch tmp/patches.json
 *   node scripts/dr-apply-choice-patches.mjs --patch tmp/patches.json --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const DAILY_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading');

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
const patchPath = args.patch;
const dryRun = args['dry-run'] === true || args['dry-run'] === 'true';
if (!patchPath) { console.error('--patch <file> required'); process.exit(2); }

const patches = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
if (!Array.isArray(patches)) { console.error('patch file must be JSON array'); process.exit(2); }

let ok = 0, skipped = 0, failed = 0;
const fileGroups = new Map();
for (const p of patches) {
  const key = `${p.level}/${p.day}.json`;
  if (!fileGroups.has(key)) fileGroups.set(key, []);
  fileGroups.get(key).push(p);
}

for (const [key, groupPatches] of fileGroups) {
  const filePath = path.join(DAILY_DIR, key);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP ${key}: file not found`); skipped += groupPatches.length; continue;
  }
  let doc;
  try { doc = JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (e) { console.log(`FAIL ${key}: ${e.message}`); failed += groupPatches.length; continue; }
  const tl = (doc?.payload?.intensive || doc?.intensive || {}).timeline || [];
  let touched = false;
  for (const p of groupPatches) {
    const step = tl[p.stepIdx];
    if (!step) { console.log(`FAIL ${key}#${p.stepIdx}: step not found`); failed++; continue; }
    if (p.stepId && step.stepId && step.stepId !== p.stepId) {
      console.log(`SKIP ${key}#${p.stepIdx}: stepId mismatch (${step.stepId} vs ${p.stepId})`); skipped++; continue;
    }
    const q = step.question || {};
    const oldChoices = q.choices || [];
    const newChoices = p.newChoices || [];
    const oldIds = oldChoices.map((c) => c.id || c.choiceId).sort().join(',');
    const newIds = newChoices.map((c) => c.id).sort().join(',');
    if (oldIds !== newIds) {
      console.log(`FAIL ${key}#${p.stepIdx}: choice id set mismatch (${oldIds} vs ${newIds})`); failed++; continue;
    }
    const ansId = p.answerId || q.answerId;
    if (!newChoices.find((c) => c.id === ansId)) {
      console.log(`FAIL ${key}#${p.stepIdx}: answerId ${ansId} not in newChoices`); failed++; continue;
    }
    // 길이 검증 — 단독 최장 ≠ 정답
    const lens = newChoices.map((c) => ({ id: c.id, len: String(c.text || '').trim().length }));
    const maxLen = Math.max(...lens.map((x) => x.len));
    const longest = lens.filter((x) => x.len === maxLen);
    if (longest.length === 1 && longest[0].id === ansId) {
      console.log(`WARN ${key}#${p.stepIdx}: 보강 후에도 정답이 단독 최장 (${ansId}, ${maxLen}자)`);
    }
    if (!dryRun) {
      // 기존 choices의 id 순서 유지하며 text만 교체
      const newTextById = Object.fromEntries(newChoices.map((c) => [c.id, c.text]));
      step.question.choices = oldChoices.map((c) => ({
        ...c,
        text: newTextById[c.id || c.choiceId] ?? c.text,
      }));
      touched = true;
    }
    ok++;
  }
  if (touched) {
    fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  }
}

console.log(`\n=== 적용 완료 === ok=${ok} skipped=${skipped} failed=${failed} (dryRun=${dryRun})`);
