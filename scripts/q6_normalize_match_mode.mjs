#!/usr/bin/env node
/**
 * 일일퀴즈 6번(TEXT_SELECT) answerMatchMode 정상화.
 *
 * 비정상 값 → ALL 로 보정 (학습 효과 안전 default):
 *   · "ALL(모두 찾기) 또는 ANY(부분 찾기)" placeholder
 *   · "INCLUDES"
 *   · 빈 값 / undefined
 *
 * 정상 값(ALL · ANY)은 그대로 둠.
 *
 * 흐름:
 *   1) 정적 파일 walk → 6번 q.answerMatchMode 정상화 → 파일 다시 쓰기
 *   2) 동일 contentId 들 DB content_versions UPDATE (wrapper.payload.questions[5] 만 갱신)
 *
 * 사용:
 *   node scripts/q6_normalize_match_mode.mjs              # dry-run
 *   node scripts/q6_normalize_match_mode.mjs --apply      # 실제 적용 (정적 + DB)
 *   node scripts/q6_normalize_match_mode.mjs --static     # 정적만
 */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const QUIZ_DIR = path.join(ROOT, 'frontend', 'public', 'daily-quiz');
const TMP_DIR = path.join(ROOT, 'tmp');

const args = {};
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i];
  if (a.startsWith('--')) args[a.slice(2)] = true;
}
const APPLY_ALL = args.apply === true;
const STATIC_ONLY = args.static === true;

function isAbnormal(v) {
  if (v == null) return true;
  const s = String(v).toUpperCase();
  return !(s === 'ALL' || s === 'ANY');
}
function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }

// ── 정적 파일 정상화 ──
function walkAll() {
  const out = [];
  for (const folder of fs.readdirSync(QUIZ_DIR)) {
    const dir = path.join(QUIZ_DIR, folder);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      out.push({ folder, file, abs: path.join(dir, file) });
    }
  }
  return out;
}

const fixes = []; // { contentId, before, after, abs }
for (const ent of walkAll()) {
  let doc;
  try { doc = JSON.parse(fs.readFileSync(ent.abs, 'utf8')); }
  catch (e) { continue; }
  const payload = doc.payload || doc;
  const q6 = (payload.questions || [])[5];
  if (!q6 || q6.type !== 'TEXT_SELECT') continue;
  const before = q6.answerMatchMode;
  if (!isAbnormal(before)) continue;
  const after = 'ALL';
  fixes.push({
    contentId: doc.contentId || payload.contentId || `?-${ent.folder}-${ent.file}`,
    folder: ent.folder, file: ent.file, abs: ent.abs,
    before: before == null ? '(none)' : String(before).slice(0, 50),
    after,
    doc, q6,
  });
}
console.log(`정상화 대상: ${fixes.length}건`);
for (const f of fixes.slice(0, 10)) {
  console.log(`  ${f.contentId.padEnd(28)} | ${f.before.padEnd(40)} → ${f.after}`);
}
if (fixes.length > 10) console.log(`  ... 외 ${fixes.length - 10}건`);

if (!APPLY_ALL && !STATIC_ONLY) {
  console.log('\n(dry-run — --apply 또는 --static 필요)');
  process.exit(0);
}

// 정적 파일 쓰기
let staticOk = 0;
for (const f of fixes) {
  f.q6.answerMatchMode = f.after;
  fs.writeFileSync(f.abs, JSON.stringify(f.doc, null, 2), 'utf8');
  staticOk += 1;
}
console.log(`\n정적 파일 정상화: ${staticOk}건`);

if (STATIC_ONLY) process.exit(0);

// ── DB 동기화 ──
function extractConfigValue(source, key) {
  const m = source.match(new RegExp(`${key}:\\s*(?:['"]([^'"]+)['"]|(\\d+))`));
  if (!m) throw new Error(`DB key not found: ${key}`);
  return m[1] ?? m[2];
}
function readDbConfig() {
  const src = fs.readFileSync(path.join(ROOT, 'scripts', 'import-pro-content.js'), 'utf8');
  const block = src.match(/const DB_CONFIG = \{([\s\S]*?)\};/)[1];
  return {
    host: extractConfigValue(block, 'host'),
    port: Number(extractConfigValue(block, 'port')) || 3306,
    user: extractConfigValue(block, 'user'),
    password: extractConfigValue(block, 'password'),
    database: extractConfigValue(block, 'database'),
  };
}
function createTunnel(cfg) {
  return new Promise((resolve, reject) => {
    const ssh = new Client();
    const keyPath = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'korfarm-ec2.pem');
    ssh.on('ready', () => {
      const server = net.createServer((sock) => {
        ssh.forwardOut('127.0.0.1', 0, cfg.host, cfg.port, (err, stream) => {
          if (err) { sock.destroy(err); return; }
          sock.pipe(stream).pipe(sock);
        });
      });
      server.listen(0, '127.0.0.1', () => resolve({ ssh, server, port: server.address().port }));
    });
    ssh.on('error', reject);
    ssh.connect({
      host: '43.200.104.102', port: 22, username: 'ec2-user',
      privateKey: fs.readFileSync(keyPath),
    });
  });
}
async function closeTunnel(t) {
  await new Promise((r) => t.server.close(r));
  t.ssh.end();
}

(async () => {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const cfg = readDbConfig();
  const tunnel = await createTunnel(cfg);
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: tunnel.port,
    user: cfg.user, password: cfg.password, database: cfg.database,
    charset: 'utf8mb4',
  });
  try {
    const ids = [...new Set(fixes.map((f) => f.contentId))];
    const ph = ids.map(() => '?').join(',');
    const [rows] = await conn.execute(
      `SELECT content_id, content_json FROM content_versions WHERE content_id IN (${ph})`,
      ids,
    );
    console.log(`DB 조회: ${rows.length} rows / ${ids.length} contentIds`);
    fs.writeFileSync(path.join(TMP_DIR, `q6-db-backup-${stamp()}.json`), JSON.stringify(rows, null, 2), 'utf8');

    // contentId 별 fixes 매핑
    const byId = {};
    for (const f of fixes) (byId[f.contentId] = byId[f.contentId] || []).push(f);

    await conn.beginTransaction();
    let ok = 0, miss = 0;
    try {
      for (const r of rows) {
        let wrapper;
        try { wrapper = typeof r.content_json === 'string' ? JSON.parse(r.content_json) : r.content_json; }
        catch (e) { miss += 1; continue; }
        const payload = wrapper.payload || wrapper;
        const q6 = (payload.questions || [])[5];
        if (!q6 || q6.type !== 'TEXT_SELECT') { miss += 1; continue; }
        if (!isAbnormal(q6.answerMatchMode)) continue; // 정상이면 skip (DB만 정상이면 패스)
        q6.answerMatchMode = 'ALL';
        await conn.execute(
          'UPDATE content_versions SET content_json = ?, updated_at = NOW() WHERE content_id = ?',
          [JSON.stringify(wrapper), r.content_id],
        );
        ok += 1;
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    }
    console.log(`DB UPDATE: ok=${ok}  miss=${miss}`);
  } finally {
    await conn.end();
    await closeTunnel(tunnel);
  }
})().catch((e) => { console.error(e); process.exit(1); });
