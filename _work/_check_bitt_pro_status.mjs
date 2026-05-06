// 비트 PRO 콘텐츠 + pro_chapters/items 현황 정밀 확인
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

function ext(s, k) { const m = s.match(new RegExp(`${k}:\\s*(?:['"]([^'"]+)['"]|(\\d+))`)); return m ? (m[1] ?? m[2]) : null; }
function readDbConfig() {
  const src = fs.readFileSync(path.join(ROOT, 'scripts', 'import-pro-content.js'), 'utf8');
  const block = src.match(/const DB_CONFIG = \{([\s\S]*?)\};/)[1];
  return { host: ext(block, 'host'), port: Number(ext(block, 'port')) || 3306, user: ext(block, 'user'), password: ext(block, 'password'), database: ext(block, 'database') };
}
function tunnel(cfg) {
  return new Promise((resolve, reject) => {
    const ssh = new Client();
    const keyPath = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'korfarm-ec2.pem');
    ssh.on('ready', () => {
      const server = net.createServer((sock) => {
        ssh.forwardOut('127.0.0.1', 0, cfg.host, cfg.port, (err, stream) => { if (err) return sock.destroy(err); sock.pipe(stream).pipe(sock); });
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
  const conn = await mysql.createConnection({ host: '127.0.0.1', port: t.port, user: cfg.user, password: cfg.password, database: cfg.database, charset: 'utf8mb4' });

  console.log('=== 1. 모든 PRO_* 콘텐츠 비트 분포 ===');
  const [r1] = await conn.query(`
    SELECT content_type, level_id, COUNT(*) AS cnt FROM contents
    WHERE content_type LIKE 'PRO_%' AND level_id LIKE 'wittgenstein%'
    GROUP BY content_type, level_id ORDER BY content_type, level_id
  `);
  console.table(r1);

  console.log('\n=== 2. 모든 PRO_* 콘텐츠 소쉬르1 분포 (모범) ===');
  const [r2] = await conn.query(`
    SELECT content_type, level_id, COUNT(*) AS cnt, MIN(day_index) AS d_min, MAX(day_index) AS d_max FROM contents
    WHERE content_type LIKE 'PRO_%' AND level_id = 'saussure1'
    GROUP BY content_type, level_id ORDER BY content_type
  `);
  console.table(r2);

  console.log('\n=== 3. pro_chapters 모범 — saussure1 ch1 ===');
  const [r3] = await conn.query(`
    SELECT * FROM pro_chapters WHERE level_id = 'saussure1' AND chapter_number = 1
  `);
  console.table(r3);

  console.log('\n=== 4. pro_chapter_items 모범 — saussure1 ch1 ===');
  if (r3.length > 0) {
    const [r4] = await conn.query(`
      SELECT id, chapter_id, type, content_id, item_order, label
      FROM pro_chapter_items WHERE chapter_id = ? ORDER BY item_order
    `, [r3[0].id]);
    console.table(r4);
  }

  console.log('\n=== 5. pro_chapters 글로벌 챕터 번호 max (level_id별) ===');
  const [r5] = await conn.query(`
    SELECT level_id, MIN(book_number) AS bk_min, MAX(book_number) AS bk_max,
           MIN(chapter_number) AS ch_min, MAX(chapter_number) AS ch_max,
           MIN(global_chapter_number) AS g_min, MAX(global_chapter_number) AS g_max,
           COUNT(*) AS cnt
    FROM pro_chapters GROUP BY level_id ORDER BY level_id
  `);
  console.table(r5);

  await conn.end();
  t.server.close();
  t.ssh.end();
})().catch((e) => { console.error('실패:', e.message); process.exit(1); });
