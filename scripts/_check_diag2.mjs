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
    console.log('=== diag_sessions 스키마 ===');
    const [cols] = await conn.execute(`SHOW COLUMNS FROM diag_sessions`);
    for (const c of cols) console.log(' ', c.Field, c.Type);

    console.log('\n=== diag_sessions 카운트 ===');
    const [c1] = await conn.execute(`SELECT COUNT(*) cnt FROM diag_sessions`);
    console.log('  ', c1[0].cnt);

    console.log('\n=== diag_sessions 최근 10건 ===');
    const [r1] = await conn.execute(
      `SELECT id, user_id, tier, mode, status, answered_count, correct_count, raw_tci, recommended_level, started_at, completed_at FROM diag_sessions ORDER BY started_at DESC LIMIT 10`
    );
    for (const r of r1) console.log(' ', r);

    console.log('\n=== 레벨별 응시 수 ===');
    const [r2] = await conn.execute(
      `SELECT tier, COUNT(*) cnt FROM diag_sessions GROUP BY tier ORDER BY cnt DESC`
    );
    for (const r of r2) console.log(' ', r);
  } finally {
    await conn.end();
    await new Promise((r) => t.server.close(r));
    t.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
