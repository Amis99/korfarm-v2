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
    const [r1] = await conn.execute(
      `SELECT id, title, total_questions, org_id, created_at FROM test_papers
       WHERE id IN ('tp_db4b361efab34fd693f311d943dcdc4a','tp_655d0cef31ab4298b8afdf75c49826b8','tp_80a0c4c5a1714e3a88dc4dd298d6f928')`
    );
    console.log('=== 응시 있는 시험지 정보 ===');
    for (const r of r1) console.log(' ', r);

    const [r2] = await conn.execute(
      `SELECT user_id, org_id, role, status FROM org_memberships WHERE user_id='u_hq_admin' LIMIT 10`
    );
    console.log('\n=== u_hq_admin 멤버십 ===');
    for (const r of r2) console.log(' ', r);

    const [r3] = await conn.execute(`SELECT id, role, name, status FROM users WHERE id='u_hq_admin'`);
    console.log('\n=== u_hq_admin 유저 ===');
    for (const r of r3) console.log(' ', r);

    // 응시 있는 시험들이 page에서 위에 안 떠서 안 보일 수 있음 - createdAt 기준 정렬 위치 확인
    const [r4] = await conn.execute(
      `SELECT id, title, created_at FROM test_papers
       WHERE id IN ('tp_db4b361efab34fd693f311d943dcdc4a','tp_655d0cef31ab4298b8afdf75c49826b8','tp_80a0c4c5a1714e3a88dc4dd298d6f928')
       ORDER BY created_at DESC`
    );
    console.log('\n=== created_at DESC ===');
    for (const r of r4) console.log(' ', r);
  } finally {
    await conn.end();
    await new Promise((r) => t.server.close(r));
    t.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
