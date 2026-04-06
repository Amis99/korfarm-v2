/**
 * 배경지식 학습 콘텐츠 업로드 스크립트
 *
 * frontend/public/farm/background/ 아래 JSON 380개를 DB에 upsert.
 * - 기존 존재 시 (contentType, levelId, dayIndex) 키로 PUT 업데이트
 * - 없으면 POST /v1/admin/content/batch-import 로 신규 생성
 *
 * 사용법:
 *   node scripts/upload-background-knowledge.mjs [--dry-run]
 *
 * 환경변수:
 *   API_URL, ADMIN_ID, ADMIN_PW
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const API_URL = process.env.API_URL || 'http://43.200.104.102:8080';
const ADMIN_ID = process.env.ADMIN_ID || 'admin';
const ADMIN_PW = process.env.ADMIN_PW || 'admin';
const DRY_RUN = process.argv.includes('--dry-run');

const BG_DIR = path.join(ROOT, 'frontend', 'public', 'farm', 'background');

// 대상 레벨 폴더
const LEVELS = [
  { folder: 'saussure1',     levelId: 'SAUSSURE_1',     prefix: 'bg_s1' },
  { folder: 'saussure2',     levelId: 'SAUSSURE_2',     prefix: 'bg_s2' },
  { folder: 'saussure3',     levelId: 'SAUSSURE_3',     prefix: 'bg_s3' },
  { folder: 'frege1',        levelId: 'FREGE_1',        prefix: 'bg_f1' },
  { folder: 'frege2',        levelId: 'FREGE_2',        prefix: 'bg_f2' },
  { folder: 'frege3',        levelId: 'FREGE_3',        prefix: 'bg_f3' },
  { folder: 'russell1',      levelId: 'RUSSELL_1',      prefix: 'bg_r1' },
  { folder: 'russell2',      levelId: 'RUSSELL_2',      prefix: 'bg_r2' },
  { folder: 'russell3',      levelId: 'RUSSELL_3',      prefix: 'bg_r3' },
  { folder: 'wittgenstein1', levelId: 'WITTGENSTEIN_1', prefix: 'bg_w1' },
  { folder: 'wittgenstein2', levelId: 'WITTGENSTEIN_2', prefix: 'bg_w2' },
  { folder: 'wittgenstein3', levelId: 'WITTGENSTEIN_3', prefix: 'bg_w3' },
];

const CONTENT_TYPE = 'BACKGROUND_KNOWLEDGE';
const MODULE_KEY = 'background_knowledge';

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

// ── API ──
let authToken = '';
async function api(method, apiPath, body, silent = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API_URL}${apiPath}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error(`API 응답 파싱 실패 (${res.status}): ${text.slice(0, 300)}`); }
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
    login_id: ADMIN_ID, password: ADMIN_PW,
  });
  authToken = data.access_token || data.accessToken || data.token;
  if (!authToken) throw new Error('토큰을 받지 못했습니다');
  console.log('  → 로그인 성공\n');
}

// ── 메인 ──
async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  배경지식 학습 콘텐츠 업로드 (380개)       ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log(`API: ${API_URL}`);
  console.log(`모드: ${DRY_RUN ? 'DRY RUN' : '실행'}\n`);

  await login();

  // 1. 기존 DB 콘텐츠 목록 조회 (catalog API 사용 - level_id, title 포함)
  console.log('[1/3] 기존 DB BACKGROUND_KNOWLEDGE 목록 조회 (catalog)...');
  const catalogRes = await fetch(`${API_URL}/v1/learning/catalog/background`);
  const catalogJson = await catalogRes.json();
  const catalogList = catalogJson.data || [];
  const existingMap = new Map(); // `${levelId}:${title}` → contentId
  let bgCount = 0;
  for (const item of catalogList) {
    if (item.content_type !== CONTENT_TYPE) continue;
    const lv = item.level_id;
    const title = item.title;
    const id = item.content_id;
    if (lv && title && id) {
      existingMap.set(`${lv}:${title}`, id);
      bgCount++;
    }
  }
  console.log(`  → 기존 BACKGROUND_KNOWLEDGE: ${bgCount}건\n`);

  // 2. 파일 스캔 + 업로드
  let totalUpdated = 0, totalCreated = 0, totalFailed = 0;
  const newItems = [];
  const updateItems = []; // {contentId, body, label}

  for (const lv of LEVELS) {
    const levelDir = path.join(BG_DIR, lv.folder);
    if (!fs.existsSync(levelDir)) {
      console.log(`  ⚠️  ${lv.folder}/ 폴더 없음, 건너뜀`);
      continue;
    }
    const files = fs.readdirSync(levelDir)
      .filter(f => f.startsWith(lv.prefix) && f.endsWith('.json'))
      .sort();

    for (const file of files) {
      // 파일명에서 dayIndex 추출 (bg_w1_01.json → 1)
      const m = file.match(/_(\d+)\.json$/);
      if (!m) { console.log(`  ⚠️  파일명 파싱 실패: ${file}`); continue; }
      const dayIndex = parseInt(m[1], 10);

      const content = JSON.parse(fs.readFileSync(path.join(levelDir, file), 'utf8'));
      const title = content.title || `${CONTENT_TYPE} ${lv.levelId} ${dayIndex}`;
      const area = content.area || 'BACKGROUND';
      const subArea = content.subArea || 'GENERAL';
      // 매칭 키: (levelId, title). 기존 DB 레코드에 day_index가 없어 title로 매칭.
      const key = `${lv.levelId}:${title}`;
      const existingId = existingMap.get(key);
      const label = `${lv.folder}/${file}`;

      if (existingId) {
        updateItems.push({
          contentId: existingId,
          label,
          body: {
            content_type: CONTENT_TYPE,
            level_id: lv.levelId,
            area,
            sub_area: subArea,
            day_index: dayIndex,
            module_key: MODULE_KEY,
            schema_version: '1.0',
            content,
          },
        });
      } else {
        newItems.push({
          contentType: CONTENT_TYPE,
          levelId: lv.levelId,
          area,
          subArea,
          dayIndex,
          moduleKey: MODULE_KEY,
          schemaVersion: '1.0',
          content,
        });
      }
    }
  }

  console.log(`[2/3] 업로드 계획: 업데이트 ${updateItems.length}건, 신규 ${newItems.length}건`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] 실제 업로드 생략');
    const byLevel = new Map();
    for (const it of updateItems) {
      const lv = it.label.split('/')[0];
      byLevel.set(lv, (byLevel.get(lv) || 0) + 1);
    }
    console.log('  업데이트 분포:');
    for (const [lv, cnt] of byLevel) console.log(`    ${lv}: ${cnt}`);
    if (newItems.length > 0) {
      console.log(`  신규 ${newItems.length}건 → batch-import로 생성 예정`);
    }
    return;
  }

  // 3. 업데이트 실행
  console.log(`\n[3/3] 업데이트 실행...`);
  for (let i = 0; i < updateItems.length; i++) {
    const item = updateItems[i];
    try {
      await api('PUT', `/v1/admin/content/${item.contentId}`, item.body, true);
      totalUpdated++;
      if ((i + 1) % 20 === 0 || i === updateItems.length - 1) {
        process.stdout.write(`  업데이트 진행: ${i + 1}/${updateItems.length}\r`);
      }
    } catch (err) {
      console.error(`\n  ❌ ${item.label} 업데이트 실패: ${err.message}`);
      totalFailed++;
    }
  }
  console.log(`\n  → 업데이트 ${totalUpdated}건, 실패 ${totalFailed}건`);

  // 4. 신규 생성 (있으면)
  if (newItems.length > 0) {
    console.log(`\n[추가] 신규 ${newItems.length}건 batch-import...`);
    const CHUNK = 50;
    for (let i = 0; i < newItems.length; i += CHUNK) {
      const chunk = newItems.slice(i, i + CHUNK);
      const snakeItems = chunk.map(it => keysToSnake(it));
      try {
        const result = await api('POST', '/v1/admin/content/batch-import', { items: snakeItems });
        totalCreated += result.imported;
        totalFailed += result.failed;
        console.log(`  [${i}..${i + chunk.length - 1}]: 성공 ${result.imported}, 실패 ${result.failed}`);
      } catch (err) {
        console.error(`  [${i}..${i + chunk.length - 1}] 배치 실패: ${err.message}`);
        totalFailed += chunk.length;
      }
    }
  }

  console.log(`\n═══ 완료 ═══`);
  console.log(`  교체: ${totalUpdated}`);
  console.log(`  신규: ${totalCreated}`);
  console.log(`  실패: ${totalFailed}`);
}

main().catch(err => {
  console.error('\n치명적 에러:', err.message);
  process.exit(1);
});
