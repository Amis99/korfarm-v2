#!/usr/bin/env node
/**
 * 일일독해 confirm(확인학습) 점검:
 *   1) Q-A 노출: prompt에 answerText가 그대로 들어있어 학생이 그대로 답할 수 있는 케이스
 *   2) ALL 모드인데 prompt에 "모두/전부/모조리" 표현 없음
 *   3) answerText가 지문(paragraph) 어디에도 literal match 되지 않음 (변형·축약)
 *   4) answerText가 지문에 등장하는 모든 위치 vs answerRanges 차이 (누락/오위치)
 *   5) answerRanges 한 개라도 paragraph 내 실제 텍스트와 answerText 불일치
 *
 * 사용:
 *   node scripts/audit-daily-reading-confirm.mjs                   요약만
 *   node scripts/audit-daily-reading-confirm.mjs --csv             상세 CSV
 *   node scripts/audit-daily-reading-confirm.mjs --level russell1  특정 레벨만
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

const wantCsv = args.csv === true || args.csv === 'true';
const onlyLevel = args.level || null;

const ALL_RX = /(모두|전부|모조리|다\s*골라|모든|전체)/;

function paragraphMap(payload) {
  const paras = (payload?.passage?.paragraphs) || [];
  return Object.fromEntries(paras.map((p) => [p.id, p.text || '']));
}

function findAllOccurrences(haystack, needle) {
  if (!needle) return [];
  const out = [];
  let from = 0;
  while (true) {
    const idx = haystack.indexOf(needle, from);
    if (idx < 0) break;
    out.push({ start: idx, end: idx + needle.length });
    from = idx + 1; // overlapping 허용 (대부분 비중첩)
  }
  return out;
}

function rangesEqualSet(a, b) {
  // a, b: [{paragraphId, start, end}]; ignore order
  const norm = (xs) => xs
    .map((x) => `${x.paragraphId}:${x.start}-${x.end}`)
    .sort();
  const A = norm(a);
  const B = norm(b);
  if (A.length !== B.length) return false;
  return A.every((v, i) => v === B[i]);
}

function audit() {
  const stats = {};
  const csv = [['level','day','qid','issue','detail','prompt','answerText']];
  for (const level of LEVELS) {
    if (onlyLevel && level !== onlyLevel) continue;
    const dir = path.join(DAILY_DIR, level);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((n) => /^\d{3}\.json$/.test(n)).sort();
    const s = stats[level] = {
      total: 0,
      qa_overlap: 0,           // 1) prompt가 answerText 포함
      all_no_keyword: 0,       // 2) ALL인데 모두 표현 없음
      no_literal_match: 0,     // 3) literal match 0
      ranges_missing_or_extra: 0, // 4) 발견 위치 vs answerRanges 차이
      range_text_mismatch: 0,  // 5) answerRanges 위치의 실제 텍스트 ≠ answerText
    };
    for (const fname of files) {
      const day = fname.slice(0, 3);
      let doc;
      try { doc = JSON.parse(fs.readFileSync(path.join(dir, fname), 'utf8')); } catch { continue; }
      const payload = doc?.payload || doc;
      const cqs = (payload?.confirm?.questions) || [];
      const paras = paragraphMap(payload);
      cqs.forEach((q) => {
        s.total += 1;
        const prompt = String(q.prompt || '').trim();
        const ansText = String(q.answerText || '').trim();
        const mode = (q.answerMatchMode || '').toUpperCase();
        const ranges = q.answerRanges || [];

        // 1) Q-A overlap: prompt가 answerText 포함
        //   단, "찾기 형식"(찾으시오/찾으세요/찾아 보세요)이면 인용된 단어는 자연스러우므로 제외
        const isFindForm = /(찾으시오|찾으세요|찾아라|찾아\s*보세요|찾기)/.test(prompt);
        if (ansText && prompt.includes(ansText) && !isFindForm) {
          const quoted = new RegExp(`['‘'"“](${ansText.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})['’'"”]`).test(prompt);
          s.qa_overlap += 1;
          if (wantCsv) csv.push([level, day, q.id || '', 'qa_overlap', quoted ? 'quoted' : 'unquoted', prompt.slice(0, 80), ansText]);
        }

        // 2) ALL 모드 + "모두" 류 표현 없음
        if (mode === 'ALL' && !ALL_RX.test(prompt)) {
          s.all_no_keyword += 1;
          if (wantCsv) csv.push([level, day, q.id || '', 'all_no_keyword', mode, prompt.slice(0, 80), ansText]);
        }

        // 3/4) literal match
        if (ansText) {
          let foundCount = 0;
          const foundList = [];
          for (const [pid, ptext] of Object.entries(paras)) {
            const occs = findAllOccurrences(ptext, ansText);
            for (const o of occs) {
              foundList.push({ paragraphId: pid, start: o.start, end: o.end });
              foundCount += 1;
            }
          }
          if (foundCount === 0) {
            s.no_literal_match += 1;
            if (wantCsv) csv.push([level, day, q.id || '', 'no_literal_match', '0', prompt.slice(0, 80), ansText]);
          } else {
            // 4) ranges 비교
            // ALL이면 모든 위치가 ranges에 있어야 함
            // ANY이면 ranges가 발견 위치들의 부분집합이면 됨 (그러나 일반적으로 같은 게 좋음)
            if (mode === 'ALL') {
              if (!rangesEqualSet(foundList, ranges)) {
                s.ranges_missing_or_extra += 1;
                if (wantCsv) csv.push([level, day, q.id || '', 'ranges_missing_or_extra',
                  `found=${foundCount} ranges=${ranges.length}`, prompt.slice(0, 80), ansText]);
              }
            } else if (mode === 'ANY') {
              // ANY는 발견 위치 중 일부만 ranges에 있어도 OK. 그러나 ranges 1개 이상은 있어야.
              if (!ranges || ranges.length === 0) {
                s.ranges_missing_or_extra += 1;
                if (wantCsv) csv.push([level, day, q.id || '', 'ranges_missing_or_extra(ANY)',
                  `found=${foundCount} ranges=0`, prompt.slice(0, 80), ansText]);
              }
            }
          }

          // 5) ranges 각각의 실제 텍스트 = answerText 검증
          let mismatch = false;
          for (const r of ranges) {
            const t = paras[r.paragraphId];
            if (!t) { mismatch = true; break; }
            const slice = t.slice(r.start, r.end);
            if (slice !== ansText) { mismatch = true; break; }
          }
          if (mismatch) {
            s.range_text_mismatch += 1;
            if (wantCsv) csv.push([level, day, q.id || '', 'range_text_mismatch', '', prompt.slice(0, 80), ansText]);
          }
        }
      });
    }
  }
  return { stats, csv };
}

function main() {
  const { stats, csv } = audit();
  const totals = { total: 0, qa_overlap: 0, all_no_keyword: 0, no_literal_match: 0,
                    ranges_missing_or_extra: 0, range_text_mismatch: 0 };
  console.log(`Level                 total | Q-A 노출 | ALL 표현없음 | literal X | ranges 불일치 | range≠ans`);
  console.log('-'.repeat(110));
  for (const [level, s] of Object.entries(stats)) {
    Object.keys(totals).forEach((k) => totals[k] += s[k] || 0);
    const pct = (n) => s.total ? `${((n / s.total) * 100).toFixed(0)}%` : '0%';
    console.log(`${level.padEnd(20)} ${String(s.total).padStart(5)} | ${String(s.qa_overlap).padStart(6)} ${pct(s.qa_overlap).padStart(5)} | ${String(s.all_no_keyword).padStart(7)} ${pct(s.all_no_keyword).padStart(5)} | ${String(s.no_literal_match).padStart(6)} ${pct(s.no_literal_match).padStart(5)} | ${String(s.ranges_missing_or_extra).padStart(8)} ${pct(s.ranges_missing_or_extra).padStart(5)} | ${String(s.range_text_mismatch).padStart(6)} ${pct(s.range_text_mismatch).padStart(5)}`);
  }
  console.log('-'.repeat(110));
  const pctAll = (n) => totals.total ? `${((n / totals.total) * 100).toFixed(1)}%` : '0%';
  console.log(`TOTAL                ${String(totals.total).padStart(5)} | ${String(totals.qa_overlap).padStart(6)} ${pctAll(totals.qa_overlap).padStart(5)} | ${String(totals.all_no_keyword).padStart(7)} ${pctAll(totals.all_no_keyword).padStart(5)} | ${String(totals.no_literal_match).padStart(6)} ${pctAll(totals.no_literal_match).padStart(5)} | ${String(totals.ranges_missing_or_extra).padStart(8)} ${pctAll(totals.ranges_missing_or_extra).padStart(5)} | ${String(totals.range_text_mismatch).padStart(6)} ${pctAll(totals.range_text_mismatch).padStart(5)}`);

  if (wantCsv) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    const out = path.join(TMP_DIR, 'confirm-audit.csv');
    fs.writeFileSync(out, csv.map((r) => r.map((v) => String(v).replace(/,/g,';')).join(',')).join('\n'), 'utf8');
    console.log(`\nCSV → ${out}`);
  }
}

main();
