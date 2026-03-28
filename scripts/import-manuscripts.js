#!/usr/bin/env node
/**
 * 프로모드 원고 JSON → DB 등록 스크립트
 *
 * 원고 JSON을 변환 없이 PRO_MANUSCRIPT 타입으로 DB에 저장합니다.
 * 기존 학습 콘텐츠(PRO_READING 등)는 건드리지 않습니다.
 *
 * 사용법:
 *   node scripts/import-manuscripts.js                    # JSON 생성만
 *   node scripts/import-manuscripts.js --upload           # 생성 + DB 업로드
 *   node scripts/import-manuscripts.js --upload --level russell1  # 특정 레벨만
 *
 * 환경변수 (--upload 시):
 *   API_URL  — 백엔드 URL (기본: https://api.korfarm.com)
 *   ADMIN_ID — 관리자 ID
 *   ADMIN_PW — 관리자 비밀번호
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANUSCRIPT_DIR = path.join(ROOT, '프로모드 원고');
const OUTPUT_DIR = path.join(ROOT, 'generated');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── 레벨 설정 ───
const LEVELS = [
  { folder: '소쉬르1', levelId: 'saussure1', prefix: '소쉬르1' },
  { folder: '소쉬르2', levelId: 'saussure2', prefix: '소쉬르2' },
  { folder: '소쉬르3', levelId: 'saussure3', prefix: '소쉬르3' },
  { folder: '프레게1', levelId: 'frege1', prefix: '프레게1' },
  { folder: '프레게2', levelId: 'frege2', prefix: '프레게2' },
  { folder: '프레게3', levelId: 'frege3', prefix: '프레게3' },
  { folder: '러셀1', levelId: 'russell1', prefix: '러셀1' },
  { folder: '러셀2', levelId: 'russell2', prefix: '러셀2' },
  { folder: '러셀3', levelId: 'russell3', prefix: '러셀3' },
];

// ─── CLI 인자 파싱 ───
const args = process.argv.slice(2);
const doUpload = args.includes('--upload');
const levelArg = args.indexOf('--level');
const targetLevelId = levelArg >= 0 ? args[levelArg + 1] : null;

const targetLevels = targetLevelId
  ? LEVELS.filter(l => l.levelId === targetLevelId)
  : LEVELS;

if (targetLevels.length === 0) {
  console.error('유효하지 않은 레벨:', targetLevelId);
  console.error('사용 가능:', LEVELS.map(l => l.levelId).join(', '));
  process.exit(1);
}

// ─── 원고 파일 읽기 ───
function readManuscript(level, chapterNum) {
  const dir = path.join(MANUSCRIPT_DIR, level.folder);
  const patterns = [
    `${level.prefix} (챕터${chapterNum}).json`,
    `${level.prefix}(챕터${chapterNum}).json`,
    `${level.prefix} (챕터 ${chapterNum}).json`,
  ];
  for (const p of patterns) {
    const fp = path.join(dir, p);
    if (fs.existsSync(fp)) {
      let raw = fs.readFileSync(fp, 'utf-8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      return JSON.parse(raw);
    }
  }
  return null;
}

// ─── 메인: JSON 생성 ───
console.log('=== 프로모드 원고 DB 등록 ===\n');

const allFiles = [];

for (const level of targetLevels) {
  console.log(`[${level.levelId}] ${level.folder}`);
  const items = [];

  for (let ch = 1; ch <= 20; ch++) {
    const ms = readManuscript(level, ch);
    if (!ms) {
      console.warn(`  ⚠ 원고 없음: 챕터${ch}`);
      continue;
    }

    const title = ms['메타']?.['과정']
      ? `${ms['메타']['과정']} ${ch}장`
      : `${level.prefix} ${ch}장`;

    items.push({
      content_type: 'PRO_MANUSCRIPT',
      level_id: level.levelId,
      area: 'MANUSCRIPT',
      sub_area: 'RAW',
      day_index: ch,
      module_key: 'manuscript',
      schema_version: '1.0',
      content: {
        title,
        content_type: 'PRO_MANUSCRIPT',
        target_level: level.levelId,
        chapter_number: ch,
        manuscript: ms,
      },
    });
  }

  const outPath = path.join(OUTPUT_DIR, `manuscript-${level.levelId}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ items }, null, 2), 'utf-8');
  const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(0);
  console.log(`  → ${items.length}챕터, ${sizeKB}KB → ${outPath}`);

  allFiles.push({ level, outPath, count: items.length });
}

console.log(`\n총 ${allFiles.reduce((s, f) => s + f.count, 0)}개 원고 JSON 생성 완료\n`);

// ─── 업로드 (--upload) ───
if (!doUpload) {
  console.log('업로드하려면: node scripts/import-manuscripts.js --upload');
  process.exit(0);
}

const API_URL = process.env.API_URL || 'https://api.korfarm.com';
const ADMIN_ID = process.env.ADMIN_ID;
const ADMIN_PW = process.env.ADMIN_PW;

if (!ADMIN_ID || !ADMIN_PW) {
  console.error('환경변수 ADMIN_ID, ADMIN_PW 필요');
  process.exit(1);
}

(async () => {
  // 로그인
  console.log(`[로그인] ${ADMIN_ID}@${API_URL}`);
  const loginRes = await fetch(`${API_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: ADMIN_ID, password: ADMIN_PW }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.success) {
    console.error('로그인 실패:', loginData);
    process.exit(1);
  }
  const token = loginData.data?.access_token || loginData.data?.accessToken || loginData.data?.token;
  console.log('  → 로그인 성공\n');

  // 레벨별 업로드
  for (const { level, outPath, count } of allFiles) {
    console.log(`[업로드] ${level.levelId} (${count}개)...`);
    const payload = JSON.parse(fs.readFileSync(outPath, 'utf-8'));

    const res = await fetch(`${API_URL}/v1/admin/content/batch-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error(`  ✗ 실패:`, data.error || data.message || res.status);
    } else {
      const r = data.data;
      console.log(`  ✓ 성공: ${r.imported}개 등록, ${r.failed}개 실패`);
      if (r.failed > 0) {
        for (const item of r.results.filter(i => !i.success)) {
          console.error(`    [${item.index}] ${item.error}`);
        }
      }
    }
  }

  console.log('\n=== 업로드 완료 ===');
})();
