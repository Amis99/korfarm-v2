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
    for (const tbl of ['pro_chapter_tests', 'pro_chapter_items', 'pro_chapters', 'pro_test_sessions', 'test_results', 'test_answer_keys']) {
      console.log(`\n=== ${tbl} ===`);
      try {
        const [cols] = await conn.execute(`SHOW COLUMNS FROM \`${tbl}\``);
        console.log('  스키마:', cols.map(c => `${c.Field}(${c.Type})`).join(', '));
        const [c] = await conn.execute(`SELECT COUNT(*) cnt FROM \`${tbl}\``);
        console.log('  카운트:', c[0].cnt);
        if (c[0].cnt > 0 && c[0].cnt < 10) {
          const [rows] = await conn.execute(`SELECT * FROM \`${tbl}\` LIMIT 3`);
          for (const r of rows) console.log('  샘플:', JSON.stringify(r).slice(0, 200));
        } else if (c[0].cnt > 0) {
          const [rows] = await conn.execute(`SELECT * FROM \`${tbl}\` LIMIT 2`);
          for (const r of rows) console.log('  샘플:', JSON.stringify(r).slice(0, 200));
        }
      } catch (e) { console.log('  오류:', e.code || e.message); }
    }
  } finally {
    await conn.end();
    await new Promise((r) => t.server.close(r));
    t.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
