#!/usr/bin/env node
/**
 * frontend/public/daily-reading 의 변경된 JSON을 DB에 업로드.
 * git status (Modified)을 기준으로 대상 파일을 선정하거나, --files 인자로 직접 지정.
 *
 * 사용:
 *   node scripts/sync-daily-reading-to-db.mjs --git-modified --apply-db
 *   node scripts/sync-daily-reading-to-db.mjs --git-modified              # dry-run (기본)
 *   node scripts/sync-daily-reading-to-db.mjs --files file1,file2 --apply-db
 */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const DAILY_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading');
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
const USE_GIT = args['git-modified'] === true || args['git-modified'] === 'true';
const FILES_ARG = args.files || '';
const SINCE_REF = args.since || ''; // git diff --name-only since SINCE_REF (예: HEAD~1)

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

function listFiles() {
  if (FILES_ARG) {
    return FILES_ARG.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (USE_GIT) {
    // git status의 Modified 파일 중 daily-reading
    const out = execSync('git status --porcelain frontend/public/daily-reading', { cwd: ROOT, encoding: 'utf8' });
    return out.split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('M ') || l.startsWith('MM') || l.startsWith('A ') || l.startsWith('M\t') || l.startsWith('AM'))
      .map((l) => l.replace(/^[A-Z?]{1,2}\s+/, ''))
      .filter((p) => /frontend\/public\/daily-reading\//.test(p));
  }
  if (SINCE_REF) {
    const out = execSync(`git diff --name-only ${SINCE_REF} -- frontend/public/daily-reading`, { cwd: ROOT, encoding: 'utf8' });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  throw new Error('파일 목록 지정 필요: --git-modified | --since <ref> | --files a,b,c');
}

async function main() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const runStamp = stamp();
  const files = listFiles();
  console.log(`대상 파일: ${files.length}개`);
  if (!files.length) return;

  let tunnel = null, conn = null;
  try {
    const dbConfig = readDbConfig();
    tunnel = await createTunnel(dbConfig);
    conn = await mysql.createConnection({
      host: '127.0.0.1', port: tunnel.localPort,
      user: dbConfig.user, password: dbConfig.password, database: dbConfig.database,
      charset: 'utf8mb4',
    });

    // contentId 추출 — 각 JSON의 contentId 필드 (또는 payload.contentId)
    const targets = [];
    for (const rel of files) {
      const abs = path.join(ROOT, rel);
      if (!fs.existsSync(abs)) { console.log(`SKIP ${rel}: not found`); continue; }
      let doc;
      try { doc = JSON.parse(fs.readFileSync(abs, 'utf8')); }
      catch (e) { console.log(`SKIP ${rel}: parse error`); continue; }
      const contentId = doc.contentId || doc.payload?.contentId;
      if (!contentId) { console.log(`SKIP ${rel}: no contentId`); continue; }
      targets.push({ rel, abs, doc, contentId });
    }
    console.log(`업로드 대상: ${targets.length}개 (contentId 보유)`);

    if (!APPLY_DB) {
      console.log(`(dry-run — --apply-db 없으면 DB 변경 안 함)`);
      return;
    }

    // 백업: DB 현재 content_json
    const ids = targets.map((t) => t.contentId);
    const backupRows = [];
    const CHUNK = 200;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const slice = ids.slice(i, i + CHUNK);
      const placeholders = slice.map(() => '?').join(',');
      const [rows] = await conn.execute(
        `SELECT content_id, content_json FROM content_versions WHERE content_id IN (${placeholders})`,
        slice,
      );
      backupRows.push(...rows);
    }
    const backupPath = path.join(TMP_DIR, `daily-reading-confirm-prompt-db-backup-${runStamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backupRows, null, 2), 'utf8');
    console.log(`DB 백업 → ${backupPath} (${backupRows.length} rows)`);

    // 업데이트
    await conn.beginTransaction();
    let ok = 0, fail = 0;
    try {
      for (const t of targets) {
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
    console.log(`UPDATE 완료: ok=${ok}  fail=${fail}`);
  } finally {
    if (conn) await conn.end();
    if (tunnel) await closeTunnel(tunnel);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
