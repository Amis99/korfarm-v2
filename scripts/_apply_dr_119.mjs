// _dr_119_fixed/{contentId}.json 의 payload.payload 를 content_versions 의 최신 row 에 UPDATE.
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
  const fixedDir = path.join(ROOT, 'scripts', '_dr_119_fixed');
  const files = fs.readdirSync(fixedDir).filter((f) => f.endsWith('.json'));
  const cfg = readDbConfig();
  const t = await tunnel(cfg);
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: t.port,
    user: cfg.user, password: cfg.password, database: cfg.database, charset: 'utf8mb4',
  });
  let okCount = 0, failCount = 0;
  try {
    for (const f of files) {
      const wrap = JSON.parse(fs.readFileSync(path.join(fixedDir, f), 'utf8'));
      const contentId = wrap.contentId;
      const innerPayload = wrap.payload;  // 외부 payload (전체 content 객체)
      const newJson = JSON.stringify(innerPayload);

      const [rows] = await conn.execute(
        `SELECT id FROM content_versions WHERE content_id = ? ORDER BY created_at DESC LIMIT 1`,
        [contentId]
      );
      if (rows.length === 0) {
        console.warn(`✗ ${contentId} content_versions 행 없음`);
        failCount++;
        continue;
      }
      const versionId = rows[0].id;
      await conn.execute(
        `UPDATE content_versions SET content_json = ?, updated_at = NOW() WHERE id = ?`,
        [newJson, versionId]
      );
      console.log(`✓ ${contentId} UPDATE (version_id=${versionId})`);
      okCount++;
    }
    console.log(`\n결과: 성공 ${okCount} / 실패 ${failCount}`);
  } finally {
    await conn.end();
    await new Promise((r) => t.server.close(r));
    t.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
