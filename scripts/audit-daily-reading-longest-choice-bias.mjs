#!/usr/bin/env node
/**
 * 일일독해 intensive 객관식 — "가장 긴 선택지 = 정답" 휴리스틱 분포 측정
 *
 * 각 question(choices + answerId)에 대해:
 *   - 선택지 글자 수
 *   - 단독 최장 선택지의 id가 answerId와 일치하면 "longest_correct"
 *   - 동률 최장(tie)이면 "tied" — 휴리스틱 안 통함
 *
 * 레벨별·전체 집계:
 *   total / longestCorrect / longestWrong / tied  →  비율
 *
 * 사용:
 *   node scripts/audit-daily-reading-longest-choice-bias.mjs
 *   node scripts/audit-daily-reading-longest-choice-bias.mjs --csv  (상세 CSV 출력)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const DAILY_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading');
const TMP_DIR = path.join(ROOT, 'tmp');
const LEVELS = [
  'saussure1','saussure2','saussure3',
  'frege1','frege2','frege3',
  'russell1','russell2','russell3',
  'wittgenstein1','wittgenstein2','wittgenstein3',
];

const writeCsv = process.argv.includes('--csv');

function lengthOf(text) {
  if (!text) return 0;
  // 선택지 텍스트 길이는 char count로 충분 (한글 1자 = 1)
  return String(text).trim().length;
}

function audit() {
  const stats = {};
  const csvRows = [['level','day','stepIdx','choices','lens','answerId','longestId','tie','outcome']];
  for (const level of LEVELS) {
    const dir = path.join(DAILY_DIR, level);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((n) => /^\d{3}\.json$/.test(n)).sort();
    const s = stats[level] = { total: 0, longestCorrect: 0, longestWrong: 0, tied: 0 };
    for (const fname of files) {
      const day = fname.slice(0, 3);
      let doc;
      try { doc = JSON.parse(fs.readFileSync(path.join(dir, fname), 'utf8')); } catch { continue; }
      const tl = (doc?.payload?.intensive || doc?.intensive || {}).timeline || [];
      tl.forEach((step, idx) => {
        const q = step?.question || {};
        const choices = q.choices || [];
        const answerId = q.answerId;
        if (!Array.isArray(choices) || choices.length < 2 || !answerId) return;
        const lens = choices.map((c) => ({ id: c.id || c.choiceId, len: lengthOf(c.text) }));
        const maxLen = Math.max(...lens.map((x) => x.len));
        const longest = lens.filter((x) => x.len === maxLen);
        const tie = longest.length > 1;
        s.total += 1;
        let outcome;
        if (tie) {
          s.tied += 1;
          outcome = 'tied';
        } else {
          if (longest[0].id === answerId) {
            s.longestCorrect += 1;
            outcome = 'longest_correct';
          } else {
            s.longestWrong += 1;
            outcome = 'longest_wrong';
          }
        }
        if (writeCsv) {
          csvRows.push([
            level, day, idx, choices.length,
            lens.map((x) => x.len).join('|'),
            answerId, longest.map((x) => x.id).join('+'), tie ? 'Y' : 'N', outcome,
          ]);
        }
      });
    }
  }
  return { stats, csvRows };
}

function pct(a, b) {
  if (!b) return '0.0%';
  return ((a / b) * 100).toFixed(1) + '%';
}

function main() {
  const { stats, csvRows } = audit();
  const totalAll = { total: 0, longestCorrect: 0, longestWrong: 0, tied: 0 };
  console.log('Level                total | longest_correct  ratio | longest_wrong | tied');
  console.log('-'.repeat(90));
  for (const level of LEVELS) {
    const s = stats[level];
    if (!s) continue;
    totalAll.total += s.total;
    totalAll.longestCorrect += s.longestCorrect;
    totalAll.longestWrong += s.longestWrong;
    totalAll.tied += s.tied;
    console.log(
      `${level.padEnd(20)} ${String(s.total).padStart(5)} | ${String(s.longestCorrect).padStart(5)}  ${pct(s.longestCorrect, s.total).padStart(8)} | ${String(s.longestWrong).padStart(6)}  ${pct(s.longestWrong, s.total).padStart(7)} | ${String(s.tied).padStart(5)} ${pct(s.tied, s.total).padStart(8)}`
    );
  }
  console.log('-'.repeat(90));
  console.log(
    `TOTAL                ${String(totalAll.total).padStart(5)} | ${String(totalAll.longestCorrect).padStart(5)}  ${pct(totalAll.longestCorrect, totalAll.total).padStart(8)} | ${String(totalAll.longestWrong).padStart(6)}  ${pct(totalAll.longestWrong, totalAll.total).padStart(7)} | ${String(totalAll.tied).padStart(5)} ${pct(totalAll.tied, totalAll.total).padStart(8)}`
  );
  console.log('\n* 4지선다 균등 가정 시 longest_correct 기댓값 = 25% 내외');
  console.log('* tied = 단독 최장이 아닌 경우 (휴리스틱 안 통함)');

  if (writeCsv) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    const out = path.join(TMP_DIR, 'longest-choice-bias.csv');
    fs.writeFileSync(out, csvRows.map((r) => r.join(',')).join('\n'), 'utf8');
    console.log(`\nCSV → ${out}`);
  }

  // JSON 보고서
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const json = path.join(TMP_DIR, 'longest-choice-bias-summary.json');
  fs.writeFileSync(json, JSON.stringify({ stats, total: totalAll }, null, 2), 'utf8');
  console.log(`JSON → ${json}`);
}

main();
