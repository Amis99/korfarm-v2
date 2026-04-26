#!/usr/bin/env node
/**
 * frontend/public/daily-quiz 의 모든 JSON을 DB에 업로드.
 * 한글 폴더(소쉬르1, 프레게1, 러셀1, 비트겐슈타인1, …) walk → contentId 추출 → DB UPDATE.
 *
 * 사용:
 *   node scripts/sync-daily-quiz-to-db.mjs --apply-db
 *   node scripts/sync-daily-quiz-to-db.mjs              # dry-run
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

function walkJsonFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkJsonFiles(full));
    else if (ent.isFile() && ent.name.endsWith('.json')) out.push(full);
  }
  return out;
}

async function main() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const runStamp = stamp();
  const allFiles = walkJsonFiles(QUIZ_DIR);
  console.log(`daily-quiz JSON 파일: ${allFiles.length}개`);
  if (!allFiles.length) return;

  let tunnel = null, conn = null;
  try {
    const dbConfig = readDbConfig();
    tunnel = await createTunnel(dbConfig);
    conn = await mysql.createConnection({
      host: '127.0.0.1', port: tunnel.localPort,
      user: dbConfig.user, password: dbConfig.password, database: dbConfig.database,
      charset: 'utf8mb4',
    });

    // contentId 추출
    const targets = [];
    const skipped = [];
    for (const abs of allFiles) {
      const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
      let doc;
      try { doc = JSON.parse(fs.readFileSync(abs, 'utf8')); }
      catch (e) { skipped.push({ rel, why: 'parse' }); continue; }
      const contentId = doc.contentId || doc.payload?.contentId;
      if (!contentId) { skipped.push({ rel, why: 'no-contentId' }); continue; }
      targets.push({ rel, abs, doc, contentId });
    }
    console.log(`업로드 대상: ${targets.length}개  (skip ${skipped.length})`);
    if (skipped.length) console.log(`  skip 첫 5건:`, skipped.slice(0, 5));

    if (!APPLY_DB) {
      console.log(`(dry-run — --apply-db 없으면 DB 변경 안 함)`);
      return;
    }

    // 기존 row 조회
    const ids = targets.map((t) => t.contentId);
    const existingIds = new Set();
    const CHUNK = 200;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const slice = ids.slice(i, i + CHUNK);
      const placeholders = slice.map(() => '?').join(',');
      const [rows] = await conn.execute(
        `SELECT content_id FROM content_versions WHERE content_id IN (${placeholders})`,
        slice,
      );
      for (const r of rows) existingIds.add(r.content_id);
    }
    const updateTargets = targets.filter((t) => existingIds.has(t.contentId));
    const missingTargets = targets.filter((t) => !existingIds.has(t.contentId));
    console.log(`기존 row: ${updateTargets.length}  /  DB에 없는 contentId: ${missingTargets.length}`);
    if (missingTargets.length) {
      const missingPath = path.join(TMP_DIR, `daily-quiz-missing-content-ids-${runStamp}.txt`);
      fs.writeFileSync(missingPath, missingTargets.map((t) => `${t.contentId}\t${t.rel}`).join('\n'), 'utf8');
      console.log(`DB에 없는 contentId 목록 → ${missingPath}`);
    }

    // 백업
    const backupRows = [];
    const updateIds = updateTargets.map((t) => t.contentId);
    for (let i = 0; i < updateIds.length; i += CHUNK) {
      const slice = updateIds.slice(i, i + CHUNK);
      const placeholders = slice.map(() => '?').join(',');
      const [rows] = await conn.execute(
        `SELECT content_id, content_json FROM content_versions WHERE content_id IN (${placeholders})`,
        slice,
      );
      backupRows.push(...rows);
    }
    const backupPath = path.join(TMP_DIR, `daily-quiz-db-backup-${runStamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backupRows, null, 2), 'utf8');
    console.log(`DB 백업 → ${backupPath} (${backupRows.length} rows)`);

    // 업데이트
    await conn.beginTransaction();
    let ok = 0, fail = 0;
    try {
      for (const t of updateTargets) {
        const [r] = await conn.execute(
          'UPDATE content_versions SET content_json = ?, updated_at = NOW() WHERE content_id = ?',
          [JSON.stringify(t.doc), t.contentId],
        );
        if (r.affectedRows > 0) ok += 1; else fail += 1;
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    }
    console.log(`UPDATE 완료: ok=${ok}  fail=${fail}  (DB-missing=${missingTargets.length})`);
  } finally {
    if (conn) await conn.end();
    if (tunnel) await closeTunnel(tunnel);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
