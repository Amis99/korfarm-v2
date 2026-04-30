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

(async () => {
  const cfg = readDbConfig();
  const tunnel = await createTunnel(cfg);
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: tunnel.port,
    user: cfg.user, password: cfg.password, database: cfg.database, charset: 'utf8mb4',
  });
  try {
    const [rows3] = await conn.execute(
      "SELECT content_type, COUNT(*) AS n FROM contents WHERE content_type LIKE '%GRAMMAR%' OR content_type LIKE '%PHONEME%' OR content_type LIKE '%WORD_FORMATION%' OR content_type LIKE '%SENTENCE%' OR content_type LIKE '%MORPHEME%' GROUP BY content_type ORDER BY n DESC"
    );
    console.log('전체 문법 content_type 분포:');
    console.table(rows3);

    const [rows4] = await conn.execute(
      "SELECT id, content_type, categories, title FROM contents WHERE content_type LIKE '%MORPHEME%' OR categories LIKE '%MORPHEME%' LIMIT 8"
    );
    console.log('\n형태소 관련 샘플:');
    console.table(rows4);
  } finally {
    await conn.end();
    await new Promise((r) => tunnel.server.close(r));
    tunnel.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
