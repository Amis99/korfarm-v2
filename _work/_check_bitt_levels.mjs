// 비트겐슈타인 level_id 형식 확인 (PRO_*, pro_chapters)
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

  console.log('=== contents 컬럼 ===');
  const [cols] = await conn.query(`SHOW COLUMNS FROM contents`);
  console.log(cols.map(c => `${c.Field}(${c.Type})`).join(', '));

  console.log('\n=== content_type별 level_id 비트 관련 ===');
  const [r1] = await conn.query(`
    SELECT content_type, level_id, COUNT(*) AS cnt FROM contents
    WHERE level_id LIKE '%itt%' OR level_id LIKE '%ITT%'
    GROUP BY content_type, level_id ORDER BY content_type, level_id
  `);
  console.table(r1);

  console.log('\n=== pro_chapters level_id 분포 ===');
  const [r2] = await conn.query(`
    SELECT level_id, COUNT(*) AS cnt FROM pro_chapters
    GROUP BY level_id ORDER BY level_id
  `);
  console.table(r2);

  console.log('\n=== levels 테이블 (있다면) ===');
  try {
    const [r3] = await conn.query(`SHOW TABLES LIKE 'levels'`);
    if (r3.length > 0) {
      const [r4] = await conn.query(`SELECT * FROM levels LIMIT 30`);
      console.table(r4);
    } else {
      console.log('levels 테이블 없음');
    }
  } catch (e) { console.log('levels 조회 실패:', e.message); }

  console.log('\n=== contents 의 levels 참조 가능성 (level 컬럼) ===');
  const [r5] = await conn.query(`
    SELECT level_id, COUNT(*) AS cnt FROM contents
    WHERE level_id IS NOT NULL
    GROUP BY level_id ORDER BY level_id
  `);
  console.table(r5);

  await conn.end();
  t.server.close();
  t.ssh.end();
})().catch((e) => { console.error('실패:', e.message); process.exit(1); });
