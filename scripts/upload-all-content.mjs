/**
 * 종합 콘텐츠 업로드 스크립트
 *
 * 1) 프로모드 신규 콘텐츠 (101개) 배치 업로드
 * 2) 일일퀴즈 / 일일독해 전체 교체 (upsert)
 *
 * 사용법:
 *   node scripts/upload-all-content.mjs [--pro-only] [--daily-only] [--dry-run]
 *
 * 환경변수:
 *   API_URL  — 백엔드 URL (기본: http://43.200.104.102:8080)
 *   ADMIN_ID — 관리자 로그인 ID
 *   ADMIN_PW — 관리자 비밀번호
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const API_URL = process.env.API_URL || 'http://43.200.104.102:8080';
const ADMIN_ID = process.env.ADMIN_ID || 'admin';
const ADMIN_PW = process.env.ADMIN_PW || 'admin';

const args = process.argv.slice(2);
const PRO_ONLY = args.includes('--pro-only');
const DAILY_ONLY = args.includes('--daily-only');
const DRY_RUN = args.includes('--dry-run');

// ── camelCase → snake_case ──
function toSnake(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function keysToSnake(obj) {
  if (Array.isArray(obj)) return obj.map(keysToSnake);
  if (obj !== null && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'content' || k === 'payload') {
        out[toSnake(k)] = v;
      } else {
        out[toSnake(k)] = keysToSnake(v);
      }
    }
    return out;
  }
  return obj;
}

// ── API 호출 ──
let authToken = '';

async function api(method, apiPath, body, silent = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${apiPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`API 응답 파싱 실패 (${res.status}): ${text.slice(0, 300)}`);
  }

  if (!res.ok || !json.success) {
    const errMsg = json.error || json.message || text.slice(0, 300);
    if (!silent) console.error(`  API 에러 (${res.status}): ${errMsg}`);
    throw new Error(errMsg);
  }

  return json.data;
}

async function login() {
  console.log(`[로그인] ${ADMIN_ID}@${API_URL}`);
  const data = await api('POST', '/v1/auth/login', {
    login_id: ADMIN_ID,
    password: ADMIN_PW,
  });
  authToken = data.access_token || data.accessToken || data.token;
  if (!authToken) throw new Error('토큰을 받지 못했습니다');
  console.log('  → 로그인 성공\n');
}

// ══════════════════════════════════════════════════
// 1. 프로모드 신규 콘텐츠 업로드
// ══════════════════════════════════════════════════

async function uploadNewProContent() {
  console.log('═══ 프로모드 신규 콘텐츠 업로드 ═══');

  // 신규 항목 정의 (fill-missing-batch-content.mjs에서 추가한 것들)
  const CONTENT_DIR = path.join(ROOT, '프로모드 콘텐츠');
  const newItemDefs = [
    { folder: '프레게1', levelId: 'FREGE_1', type: 'logic', chapters: range(1, 20) },
    { folder: '프레게2', levelId: 'FREGE_2', type: 'logic', chapters: range(1, 20) },
    { folder: '프레게2', levelId: 'FREGE_2', type: 'background', chapters: range(1, 20).filter(n => n !== 5) },
    { folder: '프레게3', levelId: 'FREGE_3', type: 'vocab', chapters: range(1, 20) },
    { folder: '프레게3', levelId: 'FREGE_3', type: 'background', chapters: range(1, 20) },
    { folder: '소쉬르3', levelId: 'SAUSSURE_3', type: 'logic', chapters: [5, 6] },
  ];

  const TYPE_CONFIG = {
    logic:      { contentType: 'PRO_LOGIC',      area: 'LOGIC',      subArea: 'PRO', moduleKey: 'worksheet_quiz' },
    vocab:      { contentType: 'PRO_VOCAB',       area: 'VOCAB',      subArea: 'PRO', moduleKey: 'worksheet_quiz' },
    background: { contentType: 'PRO_BACKGROUND',  area: 'BACKGROUND', subArea: 'PRO', moduleKey: 'worksheet_quiz' },
  };

  // 배치 아이템 생성
  const newItems = [];
  for (const def of newItemDefs) {
    const cfg = TYPE_CONFIG[def.type];
    for (const ch of def.chapters) {
      const chStr = String(ch).padStart(2, '0');
      const fp = path.join(CONTENT_DIR, def.folder, `ch${chStr}_${def.type}.json`);
      if (!fs.existsSync(fp)) {
        console.log(`  ❌ 파일 없음: ${fp}`);
        continue;
      }
      const content = JSON.parse(fs.readFileSync(fp, 'utf8'));
      newItems.push({
        contentType: cfg.contentType,
        levelId: def.levelId,
        area: cfg.area,
        subArea: cfg.subArea,
        dayIndex: ch,
        moduleKey: cfg.moduleKey,
        schemaVersion: '1.0',
        content,
      });
    }
  }

  console.log(`  총 ${newItems.length}개 신규 프로모드 항목 준비\n`);

  if (DRY_RUN) {
    console.log('  [DRY RUN] 업로드 건너뜀\n');
    return;
  }

  // 50개씩 청크 업로드
  const CHUNK = 50;
  let success = 0, fail = 0;
  for (let i = 0; i < newItems.length; i += CHUNK) {
    const chunk = newItems.slice(i, i + CHUNK);
    const snakeItems = chunk.map(item => keysToSnake(item));
    try {
      const result = await api('POST', '/v1/admin/content/batch-import', { items: snakeItems });
      success += result.imported;
      fail += result.failed;
      process.stdout.write(`  프로모드 [${i}..${i + chunk.length - 1}]: ${result.imported}성공 ${result.failed}실패\n`);
    } catch (err) {
      console.error(`  프로모드 [${i}..${i + chunk.length - 1}] 실패: ${err.message}`);
      fail += chunk.length;
    }
  }

  console.log(`\n  → 프로모드 완료: ${success}성공, ${fail}실패\n`);
}

// ══════════════════════════════════════════════════
// 2. 일일퀴즈/독해 교체 업로드
// ══════════════════════════════════════════════════

const DAILY_LEVELS = [
  'saussure1', 'saussure2', 'saussure3',
  'frege1', 'frege2', 'frege3',
  'russell1', 'russell2', 'russell3',
  'wittgenstein1', 'wittgenstein2', 'wittgenstein3',
];

// 레벨 폴더 → API levelId
function folderToLevelId(folder) {
  const parts = folder.match(/^([a-z]+)(\d+)$/);
  if (!parts) return folder;
  return `${parts[1].toUpperCase()}_${parts[2]}`;
}

async function uploadDailyContent() {
  console.log('═══ 일일퀴즈/독해 교체 업로드 ═══');

  // 1단계: 기존 콘텐츠 목록 조회
  console.log('[1/3] 기존 DB 콘텐츠 목록 조회...');
  let existingList = [];
  try {
    existingList = await api('GET', '/v1/admin/content');
  } catch (err) {
    console.error('  기존 콘텐츠 목록 조회 실패:', err.message);
    console.log('  → 신규 생성 모드로 전환\n');
  }

  // (contentType, levelId, dayIndex) → contentId 매핑
  const existingMap = new Map();
  for (const item of existingList) {
    const lv = item.level_id || item.levelId;
    const ct = item.content_type || item.contentType;
    const di = item.day_index ?? item.dayIndex;
    const id = item.content_id || item.contentId;
    if (ct && lv && di != null) {
      existingMap.set(`${ct}:${lv}:${di}`, id);
    }
  }
  console.log(`  → 기존 콘텐츠 ${existingList.length}개 (일일: ${[...existingMap.keys()].filter(k => k.startsWith('DAILY_')).length}개)\n`);

  // 2단계: 로컬 파일 읽기 + 업로드
  const contentTypes = [
    { folder: 'daily-quiz', contentType: 'DAILY_QUIZ', moduleKey: 'worksheet_quiz' },
    { folder: 'daily-reading', contentType: 'DAILY_READING', moduleKey: 'reading_training' },
  ];

  for (const ct of contentTypes) {
    if (DRY_RUN) {
      console.log(`[DRY RUN] ${ct.contentType} 스캔만 수행\n`);
    }
    console.log(`[2/3] ${ct.contentType} 업로드 시작...`);

    let totalUpdated = 0, totalCreated = 0, totalFailed = 0;
    const baseDir = path.join(ROOT, 'frontend', 'public', ct.folder);

    for (const levelFolder of DAILY_LEVELS) {
      const levelDir = path.join(baseDir, levelFolder);
      if (!fs.existsSync(levelDir)) {
        console.log(`  ⚠️ ${levelFolder}/ 폴더 없음, 건너뜀`);
        continue;
      }

      const levelId = folderToLevelId(levelFolder);
      const files = fs.readdirSync(levelDir)
        .filter(f => /^\d{3}\.json$/.test(f))
        .sort();

      // 배치 생성 (신규용)
      const newItems = [];
      const updateItems = []; // {contentId, body}

      for (const file of files) {
        const dayIndex = parseInt(file.replace('.json', ''), 10);
        const content = JSON.parse(fs.readFileSync(path.join(levelDir, file), 'utf8'));
        const key = `${ct.contentType}:${levelId}:${dayIndex}`;
        const existingId = existingMap.get(key);

        // title 추출
        const title = content.title || `${ct.contentType} ${levelFolder} Day ${dayIndex}`;

        if (existingId) {
          // 업데이트 대상
          updateItems.push({
            contentId: existingId,
            body: {
              content_type: ct.contentType,
              level_id: levelId,
              area: content.area || 'GENERAL',
              sub_area: content.subArea || 'DAILY',
              day_index: dayIndex,
              module_key: ct.moduleKey,
              schema_version: '1.0',
              content,
            },
          });
        } else {
          // 신규 생성 대상
          newItems.push({
            contentType: ct.contentType,
            levelId,
            area: content.area || 'GENERAL',
            subArea: content.subArea || 'DAILY',
            dayIndex,
            moduleKey: ct.moduleKey,
            schemaVersion: '1.0',
            content,
          });
        }
      }

      if (DRY_RUN) {
        console.log(`  ${levelFolder}: ${files.length}파일 (업데이트:${updateItems.length}, 신규:${newItems.length})`);
        continue;
      }

      // 업데이트 실행
      let updated = 0, failed = 0;
      for (const item of updateItems) {
        try {
          await api('PUT', `/v1/admin/content/${item.contentId}`, item.body, true);
          updated++;
        } catch {
          failed++;
        }
      }
      totalUpdated += updated;
      totalFailed += failed;

      // 신규 배치 업로드 (50개씩)
      const CHUNK = 50;
      for (let i = 0; i < newItems.length; i += CHUNK) {
        const chunk = newItems.slice(i, i + CHUNK);
        const snakeItems = chunk.map(item => keysToSnake(item));
        try {
          const result = await api('POST', '/v1/admin/content/batch-import', { items: snakeItems });
          totalCreated += result.imported;
          totalFailed += result.failed;
        } catch (err) {
          console.error(`    ${levelFolder} 배치 실패: ${err.message}`);
          totalFailed += chunk.length;
        }
      }

      const verb = updateItems.length > 0 ? `교체${updated}` : '';
      const verb2 = newItems.length > 0 ? `신규${newItems.length - (totalFailed - failed)}` : '';
      process.stdout.write(`  ${levelFolder}: ${[verb, verb2].filter(Boolean).join('+')} (${files.length}파일)\n`);
    }

    console.log(`  → ${ct.contentType} 완료: 교체${totalUpdated}, 신규${totalCreated}, 실패${totalFailed}\n`);
  }
}

// ══════════════════════════════════════════════════
// 유틸리티
// ══════════════════════════════════════════════════

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// ══════════════════════════════════════════════════
// 메인 실행
// ══════════════════════════════════════════════════

async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   종합 콘텐츠 업로드 스크립트             ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log(`API: ${API_URL}`);
  console.log(`모드: ${DRY_RUN ? 'DRY RUN (실제 업로드 없음)' : '실행'}`);
  console.log(`대상: ${PRO_ONLY ? '프로모드만' : DAILY_ONLY ? '일일콘텐츠만' : '전체'}\n`);

  await login();

  if (!DAILY_ONLY) {
    await uploadNewProContent();
  }

  if (!PRO_ONLY) {
    await uploadDailyContent();
  }

  console.log('═══ 모든 업로드 완료 ═══');
}

main().catch(err => {
  console.error('\n치명적 에러:', err.message);
  process.exit(1);
});
