import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

function ext(s, k) {
  const m = s.match(new RegExp(`${k}:\\s*(?:['"]([^'"]+)['"]|(\\d+))`));
  return m ? (m[1] ?? m[2]) : null;
}
function readDbConfig() {
  const src = fs.readFileSync(path.join(ROOT, 'scripts', 'import-pro-content.js'), 'utf8');
  const block = src.match(/const DB_CONFIG = \{([\s\S]*?)\};/)[1];
  return {
    host: ext(block, 'host'),
    port: Number(ext(block, 'port')) || 3306,
    user: ext(block, 'user'),
    password: ext(block, 'password'),
    database: ext(block, 'database'),
  };
}
function tunnel(cfg) {
  return new Promise((resolve, reject) => {
    const ssh = new Client();
    const keyPath = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'korfarm-ec2.pem');
    ssh.on('ready', () => {
      const server = net.createServer((sock) => {
        ssh.forwardOut('127.0.0.1', 0, cfg.host, cfg.port, (err, stream) => {
          if (err) return sock.destroy(err);
          sock.pipe(stream).pipe(sock);
        });
      });
      server.listen(0, '127.0.0.1', () => resolve({ ssh, server, port: server.address().port }));
    });
    ssh.on('error', reject);
    ssh.connect({ host: '43.200.104.102', port: 22, username: 'ec2-user', privateKey: fs.readFileSync(keyPath) });
  });
}

(async () => {
  const cfg = readDbConfig();
  const t = await tunnel(cfg);
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: t.port,
    user: cfg.user, password: cfg.password, database: cfg.database, charset: 'utf8mb4',
  });
  try {
    console.log('=== 진단 관련 테이블 목록 ===');
    const [tables] = await conn.execute(
      `SHOW TABLES LIKE '%diag%'`
    );
    for (const r of tables) console.log(' ', Object.values(r)[0]);

    console.log('\n=== diagnostic_sessions 카운트 (있다면) ===');
    try {
      const [c1] = await conn.execute(`SELECT COUNT(*) cnt FROM diagnostic_sessions`);
      console.log('  ', c1[0].cnt);
      const [r1] = await conn.execute(
        `SELECT id, user_id, level_id, status, score, total_score, completed_at, created_at
         FROM diagnostic_sessions ORDER BY created_at DESC LIMIT 5`
      );
      for (const r of r1) console.log(' ', r);
    } catch (e) { console.log('  (없음/오류:', e.code || e.message, ')'); }

    console.log('\n=== diagnostic_results 카운트 (있다면) ===');
    try {
      const [c2] = await conn.execute(`SELECT COUNT(*) cnt FROM diagnostic_results`);
      console.log('  ', c2[0].cnt);
    } catch (e) { console.log('  (없음/오류:', e.code || e.message, ')'); }

    console.log('\n=== test_submissions 안에 diag_paper 응시 있나 ===');
    const [r2] = await conn.execute(
      `SELECT test_id, COUNT(*) cnt FROM test_submissions WHERE test_id LIKE 'diag_%' GROUP BY test_id`
    );
    if (r2.length === 0) console.log('  (test_submissions 에는 진단 응시 없음 — 별도 테이블 사용)');
    else for (const r of r2) console.log(' ', r);
  } finally {
    await conn.end();
    await new Promise((r) => t.server.close(r));
    t.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
