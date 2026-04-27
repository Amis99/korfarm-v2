#!/usr/bin/env node
/**
 * 정상 7개 한글 폴더(러셀1·러셀2·비트1·소쉬르1·소쉬르3·프레게2·프레게3)의 daily-quiz JSON을
 * contents + content_versions 테이블에 새로 등록한다.
 *
 * 처리 순서:
 *  1) 기존 DAILY_QUIZ row 백업 (contents + content_versions)
 *  2) DELETE FROM content_versions WHERE content_id IN (SELECT id FROM contents WHERE content_type='DAILY_QUIZ')
 *  3) DELETE FROM contents WHERE content_type='DAILY_QUIZ'
 *  4) 정상 7폴더 walk → INSERT contents + content_versions
 *
 * 비정상 5폴더(러셀3·비트2·비트3·소쉬르2·프레게1)는 contentId가 다른 레벨 데이터의 복사본이므로 SKIP.
 *
 * 사용:
 *   node scripts/insert-daily-quiz-to-db.mjs            # dry-run
 *   node scripts/insert-daily-quiz-to-db.mjs --apply-db
 */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const QUIZ_DIR = path.join(ROOT, 'frontend', 'public', 'daily-quiz');
const TMP_DIR = path.join(ROOT, 'tmp');

const args = {};
for (const a of process.argv.slice(2)) args[a.replace(/^--/, '')] = true;
const APPLY_DB = !!args['apply-db'];

const VALID_FOLDERS = [
  '소쉬르1', '소쉬르2', '소쉬르3',
  '프레게1', '프레게2', '프레게3',
  '러셀1', '러셀2', '러셀3',
  '비트겐슈타인1', '비트겐슈타인2', '비트겐슈타인3',
];
const FOLDER_TO_LEVEL = {
  '소쉬르1': 'SAUSSURE_1', '소쉬르2': 'SAUSSURE_2', '소쉬르3': 'SAUSSURE_3',
  '프레게1': 'FREGE_1', '프레게2': 'FREGE_2', '프레게3': 'FREGE_3',
  '러셀1': 'RUSSELL_1', '러셀2': 'RUSSELL_2', '러셀3': 'RUSSELL_3',
  '비트겐슈타인1': 'WITTGENSTEIN_1', '비트겐슈타인2': 'WITTGENSTEIN_2', '비트겐슈타인3': 'WITTGENSTEIN_3',
};

function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }
function newId(prefix) { return `${prefix}_${crypto.randomBytes(16).toString('hex')}`; }
function extractConfigValue(s, key) {
  const m = s.match(new RegExp(`${key}:\\s*(?:['"]([^'"]+)['"]|(\\d+))`));
  return m[1] ?? m[2];
}
function readDbConfig() {
  const s = fs.readFileSync(path.join(ROOT, 'scripts', 'import-pro-content.js'), 'utf8');
  const cs = s.match(/const DB_CONFIG = \{([\s\S]*?)\};/)[1];
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
      server.listen(0, '127.0.0.1', () => resolve({ sshClient, server, localPort: server.address().port }));
    });
    sshClient.on('error', reject);
    sshClient.connect({
      host: '43.200.104.102', port: 22, username: 'ec2-user',
      privateKey: fs.readFileSync(keyPath),
    });
  });
}

async function main() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const runStamp = stamp();

  // 1) 정상 7폴더 walk
  const targets = [];
  const skipped = [];
  for (const folder of VALID_FOLDERS) {
    const expectedLevel = FOLDER_TO_LEVEL[folder];
    const dir = path.join(QUIZ_DIR, folder);
    if (!fs.existsSync(dir)) { skipped.push({ folder, why: 'no-dir' }); continue; }
    for (const fname of fs.readdirSync(dir).filter((n) => /^\d{3}\.json$/.test(n))) {
      const abs = path.join(dir, fname);
      const day = parseInt(fname.slice(0, 3), 10);
      let doc;
      try { doc = JSON.parse(fs.readFileSync(abs, 'utf8')); }
      catch { skipped.push({ folder, fname, why: 'parse' }); continue; }
      const contentId = doc.contentId || doc.payload?.contentId;
      if (!contentId) { skipped.push({ folder, fname, why: 'no-contentId' }); continue; }
      const tl = doc.targetLevel;
      if (tl !== expectedLevel) { skipped.push({ folder, fname, why: `targetLevel ${tl} ≠ ${expectedLevel}` }); continue; }
      targets.push({
        folder, fname, abs, day, doc, contentId,
        levelId: expectedLevel,
        title: doc.title || `${expectedLevel} 일일퀴즈 Day ${day}`,
        area: doc.area || 'GENERAL',
        subArea: doc.subArea || 'DAILY',
        moduleKey: doc.moduleKey || null,
      });
    }
  }
  console.log(`정상 폴더 처리 대상: ${targets.length}개  (skip ${skipped.length})`);
  if (skipped.length) console.log('  skip 첫 5건:', skipped.slice(0, 5));

  // contentId 중복 제거 (첫 번째만 유지)
  const seen = new Set();
  const dedupedTargets = [];
  const droppedDuplicates = [];
  for (const t of targets) {
    if (seen.has(t.contentId)) {
      droppedDuplicates.push({ folder: t.folder, fname: t.fname, contentId: t.contentId });
      continue;
    }
    seen.add(t.contentId);
    dedupedTargets.push(t);
  }
  if (droppedDuplicates.length) {
    console.log(`⚠️ 중복 contentId 제거 ${droppedDuplicates.length}건:`, droppedDuplicates.slice(0, 5));
  }
  console.log(`최종 처리 대상: ${dedupedTargets.length}개`);

  if (!APPLY_DB) {
    console.log('(dry-run — --apply-db 없음)');
    return;
  }

  // 2) DB 작업
  let tunnel = null, conn = null;
  try {
    const dbConfig = readDbConfig();
    tunnel = await createTunnel(dbConfig);
    conn = await mysql.createConnection({
      host: '127.0.0.1', port: tunnel.localPort,
      user: dbConfig.user, password: dbConfig.password, database: dbConfig.database,
      charset: 'utf8mb4',
    });

    // 백업
    console.log('기존 DAILY_QUIZ 백업…');
    const [exContents] = await conn.execute(
      `SELECT * FROM contents WHERE content_type = 'DAILY_QUIZ'`
    );
    const [exVersions] = await conn.execute(
      `SELECT cv.* FROM content_versions cv JOIN contents c ON c.id = cv.content_id WHERE c.content_type = 'DAILY_QUIZ'`
    );
    const backupPath = path.join(TMP_DIR, `daily-quiz-fullbackup-${runStamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify({ contents: exContents, versions: exVersions }, null, 2), 'utf8');
    console.log(`백업 → ${backupPath}  (contents ${exContents.length}, versions ${exVersions.length})`);

    // 트랜잭션
    await conn.beginTransaction();
    try {
      console.log('기존 DAILY_QUIZ DELETE…');
      const [delV] = await conn.execute(
        `DELETE cv FROM content_versions cv JOIN contents c ON c.id = cv.content_id WHERE c.content_type = 'DAILY_QUIZ'`
      );
      const [delC] = await conn.execute(`DELETE FROM contents WHERE content_type = 'DAILY_QUIZ'`);
      console.log(`  content_versions deleted: ${delV.affectedRows}, contents deleted: ${delC.affectedRows}`);

      console.log('새 row INSERT…');
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      let ok = 0;
      for (const t of dedupedTargets) {
        await conn.execute(
          `INSERT INTO contents (id, content_type, level_id, title, status, area, sub_area, day_index, module_key, created_at, updated_at)
           VALUES (?, 'DAILY_QUIZ', ?, ?, 'active', ?, ?, ?, ?, ?, ?)`,
          [t.contentId, t.levelId, t.title, t.area, t.subArea, t.day, t.moduleKey, now, now]
        );
        await conn.execute(
          `INSERT INTO content_versions (id, content_id, schema_version, content_json, uploaded_by, created_at, updated_at)
           VALUES (?, ?, '1.0', ?, 'u_hq_admin', ?, ?)`,
          [newId('cv'), t.contentId, JSON.stringify(t.doc), now, now]
        );
        ok += 1;
      }
      await conn.commit();
      console.log(`✅ INSERT 완료: ${ok}건 (contents + content_versions)`);
    } catch (e) {
      await conn.rollback();
      console.error('❌ 트랜잭션 롤백:', e.message);
      throw e;
    }
  } finally {
    if (conn) await conn.end();
    if (tunnel) { await new Promise((r) => tunnel.server.close(r)); tunnel.sshClient.end(); }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
