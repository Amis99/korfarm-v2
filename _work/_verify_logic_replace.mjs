// 논리 사고력 480건 DB 반영 결과 검증
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

  console.log('=== 1. LOGIC_REASONING_QUIZ + PRO_LOGIC level_id별 카운트 ===');
  const [r1] = await conn.query(`
    SELECT content_type, level_id, COUNT(*) AS cnt FROM contents
    WHERE content_type IN ('LOGIC_REASONING_QUIZ','PRO_LOGIC')
    GROUP BY content_type, level_id ORDER BY content_type, level_id
  `);
  console.table(r1);
  const totalCount = r1.reduce((s, r) => s + r.cnt, 0);
  console.log('총:', totalCount, '건');

  console.log('\n=== 2. 최근 updated_at 샘플 (최근 30분 내) ===');
  const [r2] = await conn.query(`
    SELECT content_type, level_id, title, updated_at FROM contents
    WHERE content_type IN ('LOGIC_REASONING_QUIZ','PRO_LOGIC')
      AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    ORDER BY updated_at DESC LIMIT 5
  `);
  console.table(r2);

  console.log('\n=== 3. 비트 PRO 신규 INSERT 검증 ===');
  const [r3] = await conn.query(`
    SELECT id, level_id, title, day_index, sub_area, categories
    FROM contents
    WHERE content_type = 'PRO_LOGIC' AND level_id LIKE 'wittgenstein%'
    ORDER BY level_id, day_index LIMIT 5
  `);
  console.table(r3);
  const [r3b] = await conn.query(`
    SELECT level_id, COUNT(*) AS cnt FROM contents
    WHERE content_type = 'PRO_LOGIC' AND level_id LIKE 'wittgenstein%'
    GROUP BY level_id ORDER BY level_id
  `);
  console.log('비트 PRO 카운트:');
  console.table(r3b);

  console.log('\n=== 4. content_versions 매핑 검증 (랜덤 1건의 최신 version) ===');
  const [sample] = await conn.query(`
    SELECT id FROM contents WHERE content_type = 'PRO_LOGIC' AND level_id = 'wittgenstein1' AND day_index = 1 LIMIT 1
  `);
  if (sample.length > 0) {
    const [vRows] = await conn.query(`
      SELECT id, content_id, schema_version, LENGTH(content_json) AS json_size, created_at, updated_at
      FROM content_versions WHERE content_id = ? ORDER BY created_at DESC LIMIT 1
    `, [sample[0].id]);
    console.table(vRows);
  } else {
    console.log('샘플 없음');
  }

  console.log('\n=== 5. pro_chapters 비트 챕터 (없을 것) ===');
  const [r5] = await conn.query(`
    SELECT level_id, COUNT(*) AS cnt FROM pro_chapters
    GROUP BY level_id ORDER BY level_id
  `);
  console.table(r5);

  await conn.end();
  t.server.close();
  t.ssh.end();
})().catch((e) => { console.error('실패:', e.message); process.exit(1); });
