// 118일차 러셀3 Q10 (모델 케이스) 풀 dump
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
    const ids = ['dq-RUSSELL_3-118'];
    const ph = ids.map(() => '?').join(',');
    const [rows] = await conn.execute(
      `SELECT cv.content_id, cv.content_json
       FROM content_versions cv
       INNER JOIN (
         SELECT content_id, MAX(created_at) AS max_at FROM content_versions WHERE content_id IN (${ph}) GROUP BY content_id
       ) latest ON latest.content_id = cv.content_id AND latest.max_at = cv.created_at`,
      ids,
    );
    for (const r of rows) {
      const w = JSON.parse(r.content_json);
      const p = w.payload || w;
      const q10 = (p.questions || [])[9];
      fs.writeFileSync(
        path.join(ROOT, 'scripts', '_d118_r3_q10.json'),
        JSON.stringify({ contentId: r.content_id, title: w.title, targetLevel: w.targetLevel, q10 }, null, 2),
        'utf8',
      );
      console.log(`덤프 → scripts/_d118_r3_q10.json (q10.type=${q10?.type})`);
    }
  } finally {
    await conn.end();
    await new Promise((r) => t.server.close(r));
    t.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
