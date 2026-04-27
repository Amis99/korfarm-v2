#!/usr/bin/env node
/**
 * q10_authoring_built.json 의 12개 신 q10 데이터를 로컬 정적 파일에도 반영.
 * (배포에 사용되지는 않지만, 추후 DB 재등록·검수용으로 동기화 유지)
 *
 * 대상: frontend/public/daily-quiz/{한글폴더}/118.json
 *
 * 사용:
 *   node scripts/q10_apply_to_static.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

const FOLDER_MAP = {
  'dq-SAUSSURE_1-118': '소쉬르1',
  'dq-SAUSSURE_2-118': '소쉬르2',
  'dq-SAUSSURE_3-118': '소쉬르3',
  'dq-FREGE_1-118':    '프레게1',
  'dq-FREGE_2-118':    '프레게2',
  'dq-FREGE_3-118':    '프레게3',
  'dq-RUSSELL_1-118':  '러셀1',
  'dq-RUSSELL_2-118':  '러셀2',
  'dq-RUSSELL_3-118':  '러셀3',
  'dq-WITTGENSTEIN_1-118': '비트겐슈타인1',
  'dq-WITTGENSTEIN_2-118': '비트겐슈타인2',
  'dq-WITTGENSTEIN_3-118': '비트겐슈타인3',
};

const builtPath = path.join(ROOT, 'scripts', 'q10_authoring_built.json');
if (!fs.existsSync(builtPath)) {
  console.error('q10_authoring_built.json 이 없습니다. 먼저 q10_authoring_all.mjs 실행.');
  process.exit(1);
}
const built = JSON.parse(fs.readFileSync(builtPath, 'utf8'));

let ok = 0, miss = 0, fail = 0;
for (const b of built) {
  const folder = FOLDER_MAP[b.contentId];
  if (!folder) { console.error(`[skip] ${b.contentId}: 폴더 매핑 없음`); fail += 1; continue; }
  const filePath = path.join(ROOT, 'frontend', 'public', 'daily-quiz', folder, '118.json');
  if (!fs.existsSync(filePath)) { console.warn(`[miss] ${b.contentId}: ${filePath}`); miss += 1; continue; }
  const raw = fs.readFileSync(filePath, 'utf8');
  let doc;
  try { doc = JSON.parse(raw); }
  catch (e) { console.error(`[fail] ${b.contentId}: JSON 파싱 실패`, e.message); fail += 1; continue; }
  const payload = doc.payload || doc;
  if (!Array.isArray(payload.questions) || payload.questions.length < 10) {
    console.error(`[fail] ${b.contentId}: questions 배열 이상`);
    fail += 1; continue;
  }
  const oldType = payload.questions[9]?.type ?? '?';
  payload.questions[9] = b.newQ10;
  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf8');
  console.log(`  ${b.contentId} (${folder}): ${oldType} → CHOICE_COMPLEX_OX`);
  ok += 1;
}
console.log(`\n정적 파일 수정 완료: ok=${ok} miss=${miss} fail=${fail}`);
