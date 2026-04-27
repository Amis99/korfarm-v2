#!/usr/bin/env node
/** DB의 daily-quiz 메타데이터 한 건 직접 확인 */
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

    // contents.DAILY_QUIZ의 첫 row + content_versions의 content_json 일부
    const [rows] = await conn.execute(
      `SELECT c.id, c.level_id, c.day_index, cv.content_json FROM contents c
       JOIN content_versions cv ON cv.content_id = c.id
       WHERE c.content_type = 'DAILY_QUIZ' LIMIT 3`
    );
    console.log('DAILY_QUIZ + content_versions JOIN 샘플:');
    for (const r of rows) {
      const cj = r.content_json;
      let cidField = '?';
      try {
        const obj = typeof cj === 'string' ? JSON.parse(cj) : cj;
        cidField = obj.contentId || obj.payload?.contentId || '(없음)';
      } catch { cidField = '(parse-fail)'; }
      console.log(`  contents.id=${r.id}  level=${r.level_id}  day=${r.day_index}  content_json.contentId=${cidField}`);
    }
    // content_json 안 dq- 패턴 카운트
    const [r2x] = await conn.execute(
      `SELECT COUNT(*) c FROM content_versions WHERE content_json LIKE '%"contentId":"dq-%'`
    );
    console.log('content_versions.content_json에 dq-* contentId 포함:', r2x[0].c);

    // dq- 패턴 검색
    const [r2] = await conn.execute(`SELECT COUNT(*) c FROM contents WHERE id LIKE 'dq-%'`);
    console.log('contents.id LIKE dq-% :', r2[0].c);

    // level별 카운트
    const [r3] = await conn.execute(
      `SELECT level_id, COUNT(*) c FROM contents WHERE content_type = 'DAILY_QUIZ' GROUP BY level_id ORDER BY level_id`
    );
    console.log('DAILY_QUIZ level별 카운트:');
    for (const r of r3) console.log('  ', r.level_id, ':', r.c);
  } finally {
    if (conn) await conn.end();
    if (tunnel) { await new Promise((r) => tunnel.server.close(r)); tunnel.sshClient.end(); }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
