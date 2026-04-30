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
  if (!m) throw new Error(`DB key not found: ${k}`);
  return m[1] ?? m[2];
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
    // 레벨별로 가장 작은 day_index, 가장 큰 day_index, 총 개수 파악
    const [stats] = await conn.execute(
      `SELECT level_id, COUNT(*) AS cnt, MIN(day_index) AS min_d, MAX(day_index) AS max_d
       FROM contents
       WHERE module_key = 'DAILY_QUIZ' OR id LIKE 'dq-%'
       GROUP BY level_id
       ORDER BY level_id`,
    );
    console.log('일일퀴즈 레벨별 분포:');
    stats.forEach(r => console.log(`  ${r.level_id}: ${r.cnt}개 (day ${r.min_d}~${r.max_d})`));

    // WITT 레벨 Day-1 ID 패턴 확인
    const [wittIds] = await conn.execute(
      `SELECT id, level_id, day_index FROM contents
       WHERE level_id LIKE 'WITT%' AND day_index BETWEEN 1 AND 5
       ORDER BY level_id, day_index LIMIT 30`,
    );
    console.log('WITT Day 1~5 IDs:');
    wittIds.forEach(r => console.log(`  ${r.id} (${r.level_id} day=${r.day_index})`));

    // Day 118 풀세트 확인
    const [d118] = await conn.execute(
      `SELECT id, level_id FROM contents
       WHERE day_index = 118 AND (module_key = 'DAILY_QUIZ' OR id LIKE 'dq-%')
       ORDER BY level_id`,
    );
    console.log('Day 118:');
    d118.forEach(r => console.log(`  ${r.id} (${r.level_id})`));
  } finally {
    await conn.end();
    await new Promise((r) => t.server.close(r));
    t.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
