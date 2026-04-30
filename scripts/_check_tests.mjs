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
    console.log('=== test_papers 총 개수 ===');
    const [c1] = await conn.execute(`SELECT COUNT(*) as cnt FROM test_papers`);
    console.log('  ', c1[0].cnt);

    console.log('\n=== test_papers 샘플 5건 (최근) ===');
    const [r1] = await conn.execute(
      `SELECT id, title, level_id, exam_date, total_questions, total_points, status, org_id, created_at
       FROM test_papers ORDER BY created_at DESC LIMIT 5`
    );
    for (const r of r1) {
      console.log(' ', r);
    }

    console.log('\n=== test_submissions 총 개수 ===');
    const [c2] = await conn.execute(`SELECT COUNT(*) as cnt FROM test_submissions`);
    console.log('  ', c2[0].cnt);

    console.log('\n=== test_submissions 샘플 5건 (최근) ===');
    const [r2] = await conn.execute(
      `SELECT id, test_id, user_id, score, correct_count, status, created_at
       FROM test_submissions ORDER BY created_at DESC LIMIT 5`
    );
    for (const r of r2) {
      console.log(' ', r);
    }

    console.log('\n=== 응시자가 있는 시험 top 10 ===');
    const [r3] = await conn.execute(
      `SELECT test_id, COUNT(*) as cnt FROM test_submissions GROUP BY test_id ORDER BY cnt DESC LIMIT 10`
    );
    for (const r of r3) {
      console.log(' ', r);
    }
  } finally {
    await conn.end();
    await new Promise((r) => t.server.close(r));
    t.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
