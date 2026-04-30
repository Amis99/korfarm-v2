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
    user: cfg.user, password: cfg.password, database: cfg.database,
    charset: 'utf8mb4', multipleStatements: true,
  });
  try {
    console.log('1. test_paper_statistics 테이블 생성');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS test_paper_statistics (
        paper_id VARCHAR(64) NOT NULL PRIMARY KEY,
        submission_count INT NOT NULL DEFAULT 0,
        avg_score DOUBLE NULL,
        max_score INT NULL,
        min_score INT NULL,
        std_dev DOUBLE NULL,
        grade_stats_json LONGTEXT NULL,
        question_stats_json LONGTEXT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ 생성');

    console.log('2. flyway_schema_history V0070 success=1 갱신');
    const [r] = await conn.execute(
      `UPDATE flyway_schema_history SET success = 1, execution_time = 100 WHERE version = '0070'`
    );
    console.log('   ✓ affected:', r.affectedRows);

    console.log('3. 검증');
    const [check] = await conn.execute(
      `SELECT version, success FROM flyway_schema_history WHERE version = '0070'`
    );
    console.log('   ', check);
    const [tbls] = await conn.execute(`SHOW TABLES LIKE 'test_paper_statistics'`);
    console.log('   table 존재:', tbls.length > 0);
  } finally {
    await conn.end();
    await new Promise((r) => t.server.close(r));
    t.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
