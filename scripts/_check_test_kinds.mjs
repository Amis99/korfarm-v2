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
    console.log('=== test_papers 스키마 ===');
    const [cols] = await conn.execute(`SHOW COLUMNS FROM test_papers`);
    for (const c of cols) console.log(' ', c.Field, c.Type);

    console.log('\n=== test_papers ID 패턴별 분포 ===');
    const [r1] = await conn.execute(
      `SELECT
        CASE
          WHEN id LIKE 'diag_paper_%' THEN '진단 시험지'
          WHEN id LIKE 'tp_%' THEN '일반(tp_)'
          ELSE '기타'
        END as kind,
        COUNT(*) cnt
       FROM test_papers GROUP BY kind`
    );
    for (const r of r1) console.log(' ', r);

    console.log('\n=== series·level 분포 (tp_*만) ===');
    const [r2] = await conn.execute(
      `SELECT series, COUNT(*) cnt FROM test_papers WHERE id LIKE 'tp_%' GROUP BY series ORDER BY cnt DESC`
    );
    for (const r of r2) console.log(' ', r);

    console.log('\n=== title 패턴 — 챕터 테스트로 보이는 것 ===');
    const [r3] = await conn.execute(
      `SELECT id, title FROM test_papers WHERE title LIKE '%장 테스트%' OR title LIKE '%챕터%' LIMIT 10`
    );
    for (const r of r3) console.log(' ', r);
    const [r4] = await conn.execute(
      `SELECT COUNT(*) cnt FROM test_papers WHERE title LIKE '%장 테스트%' OR title LIKE '%챕터%'`
    );
    console.log('  총:', r4[0].cnt);

    console.log('\n=== 별도 테이블 후보 검색 ===');
    const [r5] = await conn.execute(
      `SHOW TABLES LIKE '%chapter%'`
    );
    for (const r of r5) console.log('  chapter*:', Object.values(r)[0]);
    const [r6] = await conn.execute(
      `SHOW TABLES LIKE '%test%'`
    );
    for (const r of r6) console.log('  test*:', Object.values(r)[0]);
  } finally {
    await conn.end();
    await new Promise((r) => t.server.close(r));
    t.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
