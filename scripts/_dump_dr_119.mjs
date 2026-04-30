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
    const [rows] = await conn.execute(
      `SELECT id, content_type, level_id, day_index, title FROM contents
       WHERE day_index = 119 AND content_type IN ('DAILY_READING','READING')
       ORDER BY level_id`
    );
    const ids = rows.map((r) => r.id);
    console.log('대상:', ids.length, '개');

    const ph = ids.map(() => '?').join(',');
    const [versions] = await conn.execute(
      `SELECT cv.content_id, cv.content_json
       FROM content_versions cv
       INNER JOIN (
         SELECT content_id, MAX(created_at) AS max_at FROM content_versions WHERE content_id IN (${ph}) GROUP BY content_id
       ) latest ON latest.content_id = cv.content_id AND latest.max_at = cv.created_at`,
      ids,
    );
    const meta = new Map(rows.map((r) => [r.id, r]));
    const outDir = path.join(ROOT, 'scripts', '_dr_119_dump');
    fs.mkdirSync(outDir, { recursive: true });
    for (const v of versions) {
      const m = meta.get(v.content_id);
      const wrap = { contentId: v.content_id, level: m.level_id, title: m.title, payload: JSON.parse(v.content_json) };
      fs.writeFileSync(path.join(outDir, `${v.content_id}.json`), JSON.stringify(wrap, null, 2), 'utf8');
      console.log(`✓ ${v.content_id}`);
    }
    console.log('119일차 일일독해 콘텐츠 수:', rows.length);
    for (const r of rows) {
      console.log(`  ${r.content_id} [${r.target_level}] type=${r.content_type}`);
    }

    if (rows.length === 0) {
      console.log('\nLIKE %119% 검색:');
      const [r2] = await conn.execute(
        `SELECT content_id, content_type, target_level, day_index FROM contents WHERE content_id LIKE '%119%' AND content_type IN ('DAILY_READING','READING') ORDER BY content_id LIMIT 30`
      );
      console.log('결과:', r2.length);
      for (const r of r2) console.log(`  ${r.content_id} [${r.target_level}] type=${r.content_type} day=${r.day_index}`);
    }
  } finally {
    await conn.end();
    await new Promise((r) => t.server.close(r));
    t.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
