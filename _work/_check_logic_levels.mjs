// LOGIC 콘텐츠의 실제 level_id 분포 확인
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
    host: ext(block, 'host'), port: Number(ext(block, 'port')) || 3306,
    user: ext(block, 'user'), password: ext(block, 'password'), database: ext(block, 'database'),
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

  console.log('=== LOGIC_REASONING_QUIZ level_id 분포 ===');
  const [r1] = await conn.query(`
    SELECT level_id, COUNT(*) AS cnt FROM contents
    WHERE content_type = 'LOGIC_REASONING_QUIZ'
    GROUP BY level_id ORDER BY level_id
  `);
  console.table(r1);

  console.log('\n=== PRO_LOGIC level_id 분포 ===');
  const [r2] = await conn.query(`
    SELECT level_id, COUNT(*) AS cnt FROM contents
    WHERE content_type = 'PRO_LOGIC'
    GROUP BY level_id ORDER BY level_id
  `);
  console.table(r2);

  console.log('\n=== LOGIC_REASONING_QUIZ 비트 관련 샘플 5건 (level_id LIKE %BITT% or %WITT%) ===');
  const [r3] = await conn.query(`
    SELECT id, level_id, title FROM contents
    WHERE content_type = 'LOGIC_REASONING_QUIZ'
      AND (level_id LIKE '%BITT%' OR level_id LIKE '%WITT%' OR level_id LIKE '%bitt%' OR level_id LIKE '%witt%')
    LIMIT 10
  `);
  console.table(r3);

  console.log('\n=== PRO_LOGIC 비트 관련 샘플 5건 ===');
  const [r4] = await conn.query(`
    SELECT id, level_id, title FROM contents
    WHERE content_type = 'PRO_LOGIC'
      AND (level_id LIKE '%BITT%' OR level_id LIKE '%WITT%' OR level_id LIKE '%bitt%' OR level_id LIKE '%witt%')
    LIMIT 10
  `);
  console.table(r4);

  await conn.end();
  t.server.close();
  t.ssh.end();
})().catch((e) => { console.error('실패:', e.message); process.exit(1); });
