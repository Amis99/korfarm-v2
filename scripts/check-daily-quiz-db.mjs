#!/usr/bin/env node
/** DB의 daily-quiz contentId 패턴 점검 */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

function extractConfigValue(source, key) {
  const match = source.match(new RegExp(`${key}:\\s*(?:['"]([^'"]+)['"]|(\\d+))`));
  if (!match) throw new Error(`DB config key not found: ${key}`);
  return match[1] ?? match[2];
}
function readDbConfig() {
  const source = fs.readFileSync(path.join(ROOT, 'scripts', 'import-pro-content.js'), 'utf8');
  const block = source.match(/const DB_CONFIG = \{([\s\S]*?)\};/);
  if (!block) throw new Error('DB_CONFIG block not found.');
  const cs = block[1];
  return {
    host: extractConfigValue(cs, 'host'),
    port: Number(extractConfigValue(cs, 'port')) || 3306,
    user: extractConfigValue(cs, 'user'),
    password: extractConfigValue(cs, 'password'),
    database: extractConfigValue(cs, 'database'),
  };
}
function createTunnel(dbConfig) {
  return new Promise((resolve, reject) => {
    const sshClient = new Client();
    const keyPath = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'korfarm-ec2.pem');
    sshClient.on('ready', () => {
      const server = net.createServer((sock) => {
        sshClient.forwardOut('127.0.0.1', 0, dbConfig.host, dbConfig.port, (err, stream) => {
          if (err) { sock.destroy(err); return; }
          sock.pipe(stream).pipe(sock);
        });
      });
      server.listen(0, '127.0.0.1', () => {
        resolve({ sshClient, server, localPort: server.address().port });
      });
    });
    sshClient.on('error', reject);
    sshClient.connect({
      host: '43.200.104.102', port: 22, username: 'ec2-user',
      privateKey: fs.readFileSync(keyPath),
    });
  });
}

async function main() {
  let tunnel = null, conn = null;
  try {
    const dbConfig = readDbConfig();
    tunnel = await createTunnel(dbConfig);
    conn = await mysql.createConnection({
      host: '127.0.0.1', port: tunnel.localPort,
      user: dbConfig.user, password: dbConfig.password, database: dbConfig.database,
      charset: 'utf8mb4',
    });

    // 1) daily-quiz 패턴 (dq- 접두) 카운트와 샘플
    const [c1] = await conn.execute(
      `SELECT COUNT(*) as cnt FROM content_versions WHERE content_id LIKE 'dq-%'`
    );
    console.log('dq-* contentId 개수:', c1[0].cnt);
    const [s1] = await conn.execute(
      `SELECT content_id FROM content_versions WHERE content_id LIKE 'dq-%' ORDER BY content_id LIMIT 20`
    );
    console.log('dq-* 샘플:', s1.map((r) => r.content_id));

    // 2) contents 컬럼
    const [cols] = await conn.execute(`SHOW COLUMNS FROM contents`);
    console.log('contents 컬럼:', cols.map((c) => c.Field).join(', '));
    // 3) DAILY_QUIZ row 샘플
    const [s2] = await conn.execute(
      `SELECT * FROM contents WHERE content_type = 'DAILY_QUIZ' LIMIT 3`
    );
    console.log('DAILY_QUIZ 샘플 row:');
    for (const r of s2) {
      const truncated = {};
      for (const [k, v] of Object.entries(r)) {
        truncated[k] = (typeof v === 'string' && v.length > 100) ? v.slice(0, 100) + '...' : v;
      }
      console.log(JSON.stringify(truncated));
    }
  } finally {
    if (conn) await conn.end();
    if (tunnel) await new Promise((r) => tunnel.server.close(r)) && tunnel.sshClient.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
