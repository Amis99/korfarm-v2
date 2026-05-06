// 비트 120개 JSON 파일의 targetLevel 만 정규화 (BITT_N → WITTGENSTEIN_N, bittN → wittgensteinN)
// 1회용 (idempotent — 이미 변환된 파일 다시 실행해도 안전)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const DIR = path.join(ROOT, 'generated', 'logic-rewrite');

const FARM_MAP = { BITT_1: 'WITTGENSTEIN_1', BITT_2: 'WITTGENSTEIN_2', BITT_3: 'WITTGENSTEIN_3' };
const PRO_MAP = { bitt1: 'wittgenstein1', bitt2: 'wittgenstein2', bitt3: 'wittgenstein3' };

let changed = 0, skipped = 0;
const files = fs.readdirSync(DIR).filter(f => f.startsWith('bitt') && f.endsWith('.json')).sort();
for (const f of files) {
  const fp = path.join(DIR, f);
  const j = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const before = j.targetLevel;
  let after = before;
  if (j.contentType === 'LOGIC_REASONING_QUIZ' && FARM_MAP[before]) after = FARM_MAP[before];
  else if (j.contentType === 'PRO_LOGIC' && PRO_MAP[before]) after = PRO_MAP[before];
  if (after !== before) {
    j.targetLevel = after;
    fs.writeFileSync(fp, JSON.stringify(j, null, 2) + '\n', 'utf8');
    changed++;
    console.log(`  ${f}: ${before} → ${after}`);
  } else {
    skipped++;
  }
}
console.log(`\n=== 완료: 변환 ${changed}건, 유지 ${skipped}건 ===`);
