#!/usr/bin/env node
/**
 * q10_authoring_built.json 의 12개 신 q10 데이터를 DB(content_versions)에 적용.
 *
 * 흐름:
 *  1) SSH 터널 + DB 접속
 *  2) 12개 contentId 의 content_json SELECT
 *  3) wrapper.payload.questions[9] 를 새 q10 으로 교체
 *  4) tmp/q10-db-backup-{stamp}.json 으로 원본 백업
 *  5) UPDATE content_versions SET content_json = ?, updated_at = NOW()
 *
 * 사용:
 *   node scripts/q10_apply_to_db.mjs              # dry-run (변경 없음)
 *   node scripts/q10_apply_to_db.mjs --apply-db   # 실제 적용
 */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const TMP_DIR = path.join(ROOT, 'tmp');

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (!m) { args[a] = true; continue; }
  args[m[1]] = m[2] ?? true;
}
const APPLY_DB = args['apply-db'] === true || args['apply-db'] === 'true';

function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }

function extractConfigValue(source, key) {
  const match = source.match(new RegExp(`${key}:\\s*(?:['"]([^'"]+)['"]|(\\d+))`));
  if (!match) throw new Error(`DB config key not found: ${key}`);
  return match[1] ?? match[2];
}
function readDbConfig() {
  const source = fs.readFileSync(path.join(ROOT, 'scripts', 'import-pro-content.js'), 'utf8');
  const block = source.match(/const DB_CONFIG = \{([\s\S]*?)\};/);
  if (!block) throw new Error('DB_CONFIG block not found.');
  const cs = block[1];
  return {
    host: extractConfigValue(cs, 'host'),
    port: Number(extractConfigValue(cs, 'port')) || 3306,
    user: extractConfigValue(cs, 'user'),
    password: extractConfigValue(cs, 'password'),
    database: extractConfigValue(cs, 'database'),
  };
}

function createTunnel(dbConfig) {
  return new Promise((resolve, reject) => {
    const sshClient = new Client();
    const keyPath = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'korfarm-ec2.pem');
    sshClient.on('ready', () => {
      const server = net.createServer((sock) => {
        sshClient.forwardOut('127.0.0.1', 0, dbConfig.host, dbConfig.port, (err, stream) => {
          if (err) { sock.destroy(err); return; }
          sock.pipe(stream).pipe(sock);
        });
      });
      server.listen(0, '127.0.0.1', () => {
        resolve({ sshClient, server, localPort: server.address().port });
      });
    });
    sshClient.on('error', reject);
    sshClient.connect({
      host: '43.200.104.102',
      port: 22,
      username: 'ec2-user',
      privateKey: fs.readFileSync(keyPath),
    });
  });
}
async function closeTunnel(t) {
  await new Promise((r) => t.server.close(r));
  t.sshClient.end();
}

async function main() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const runStamp = stamp();

  const builtPath = path.join(ROOT, 'scripts', 'q10_authoring_built.json');
  if (!fs.existsSync(builtPath)) {
    console.error('q10_authoring_built.json 이 없습니다. 먼저 q10_authoring_all.mjs 실행하세요.');
    process.exit(1);
  }
  const built = JSON.parse(fs.readFileSync(builtPath, 'utf8'));
  console.log(`q10 신 데이터: ${built.length}건`);

  let tunnel = null, conn = null;
  try {
    const dbConfig = readDbConfig();
    tunnel = await createTunnel(dbConfig);
    conn = await mysql.createConnection({
      host: '127.0.0.1', port: tunnel.localPort,
      user: dbConfig.user, password: dbConfig.password, database: dbConfig.database,
      charset: 'utf8mb4',
    });

    const ids = built.map((b) => b.contentId);
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await conn.execute(
      `SELECT content_id, content_json FROM content_versions WHERE content_id IN (${placeholders})`,
      ids,
    );
    console.log(`DB 조회 결과: ${rows.length}/${ids.length}건`);
    const dbMap = new Map(rows.map((r) => [r.content_id, r.content_json]));

    const missing = ids.filter((id) => !dbMap.has(id));
    if (missing.length) {
      console.log('DB에 없는 contentId:');
      for (const id of missing) console.log(`  - ${id}`);
    }

    // 백업
    const backupPath = path.join(TMP_DIR, `q10-db-backup-${runStamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(rows, null, 2), 'utf8');
    console.log(`백업 저장 → ${backupPath}`);

    // 신 wrapper 빌드
    const updates = [];
    for (const b of built) {
      const raw = dbMap.get(b.contentId);
      if (!raw) { console.warn(`[skip] ${b.contentId}: DB 없음`); continue; }
      let wrapper;
      try { wrapper = typeof raw === 'string' ? JSON.parse(raw) : raw; }
      catch (e) { console.error(`[fail] ${b.contentId}: content_json parse 실패`, e.message); continue; }
      const payload = wrapper.payload || wrapper;
      if (!Array.isArray(payload.questions)) {
        console.error(`[fail] ${b.contentId}: payload.questions 배열 아님`);
        continue;
      }
      if (payload.questions.length < 10) {
        console.error(`[fail] ${b.contentId}: questions ${payload.questions.length}개 (10번 없음)`);
        continue;
      }
      const oldQ10 = payload.questions[9];
      payload.questions[9] = b.newQ10;
      console.log(`  ${b.contentId}: q10 ${oldQ10?.type ?? '?'} → CHOICE_COMPLEX_OX`);
      updates.push({ contentId: b.contentId, json: JSON.stringify(wrapper) });
    }

    if (!APPLY_DB) {
      console.log(`\n(dry-run — --apply-db 없으면 DB 변경 안 함)`);
      console.log(`적용 대기: ${updates.length}건`);
      return;
    }

    await conn.beginTransaction();
    let ok = 0, fail = 0;
    try {
      for (const u of updates) {
        const [r] = await conn.execute(
          'UPDATE content_versions SET content_json = ?, updated_at = NOW() WHERE content_id = ?',
          [u.json, u.contentId],
        );
        if (r.affectedRows > 0) ok += 1; else fail += 1;
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    }
    console.log(`\nUPDATE 완료: ok=${ok}  fail=${fail}`);
  } finally {
    if (conn) await conn.end();
    if (tunnel) await closeTunnel(tunnel);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
