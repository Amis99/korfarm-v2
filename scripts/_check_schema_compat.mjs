#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

function extractConfigValue(source, key) {
  const m = source.match(new RegExp(`${key}:\\s*(?:['"]([^'"]+)['"]|(\\d+))`));
  if (!m) throw new Error(`DB key not found: ${key}`);
  return m[1] ?? m[2];
}
function readDbConfig() {
  const src = fs.readFileSync(path.join(ROOT, 'scripts', 'import-pro-content.js'), 'utf8');
  const block = src.match(/const DB_CONFIG = \{([\s\S]*?)\};/)[1];
  return {
    host: extractConfigValue(block, 'host'),
    port: Number(extractConfigValue(block, 'port')) || 3306,
    user: extractConfigValue(block, 'user'),
    password: extractConfigValue(block, 'password'),
    database: extractConfigValue(block, 'database'),
  };
}
function createTunnel(cfg) {
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

const TARGETS = [
  "READING", "STORY", "CLASSIC", "PRO_READING",
  "VOCAB", "VOCAB_BASIC",
  "CHOICE_ANALYSIS",
  "STUDY_CONTENT", "CONTENT_PDF", "CONTENT_PDF_QUIZ",
  "GRAMMAR_POS", "CONCEPT",
];

(async () => {
  const cfg = readDbConfig();
  const tunnel = await createTunnel(cfg);
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: tunnel.port,
    user: cfg.user, password: cfg.password, database: cfg.database, charset: 'utf8mb4',
  });
  try {
    // 카테고리별 건수
    const [counts] = await conn.execute(
      `SELECT content_type, COUNT(*) AS n FROM contents
       WHERE content_type IN (${TARGETS.map(() => '?').join(',')})
       GROUP BY content_type ORDER BY n DESC`,
      TARGETS,
    );
    console.log('\n=== 카테고리별 DB 콘텐츠 건수 ===');
    console.table(counts);

    // 각 카테고리에서 첫 번째 콘텐츠의 payload 키 추출
    console.log('\n=== 카테고리별 payload 핵심 키 (1건 샘플) ===');
    for (const t of TARGETS) {
      const [rows] = await conn.execute(
        `SELECT c.id, c.title, cv.content_json
         FROM contents c
         JOIN content_versions cv ON cv.content_id = c.id
         WHERE c.content_type = ?
         ORDER BY cv.created_at DESC LIMIT 1`,
        [t],
      );
      if (rows.length === 0) {
        console.log(`  [${t}] (DB 없음)`);
        continue;
      }
      try {
        const wrapper = JSON.parse(rows[0].content_json);
        const payload = wrapper.payload || wrapper;
        const topKeys = Object.keys(payload);
        const sub = {};
        for (const k of topKeys) {
          const v = payload[k];
          if (Array.isArray(v)) sub[k] = `array(${v.length}) → keys: ${v[0] ? Object.keys(v[0]).slice(0, 6).join('/') : '(empty)'}`;
          else if (typeof v === 'object' && v !== null) sub[k] = `object → keys: ${Object.keys(v).slice(0, 6).join('/')}`;
          else sub[k] = typeof v;
        }
        console.log(`\n  [${t}] ${rows[0].title}`);
        for (const [k, v] of Object.entries(sub)) console.log(`    .${k}: ${v}`);
      } catch (e) {
        console.log(`  [${t}] (parse 실패)`);
      }
    }
  } finally {
    await conn.end();
    await new Promise((r) => tunnel.server.close(r));
    tunnel.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
