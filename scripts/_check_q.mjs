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
    const [rows] = await conn.execute(
      "SELECT c.title, cv.content_json FROM contents c JOIN content_versions cv ON cv.content_id=c.id WHERE c.content_type='GRAMMAR_POS' ORDER BY cv.created_at DESC LIMIT 2"
    );
    for (const r of rows) {
      const w = JSON.parse(r.content_json);
      const p = w.payload || w;
      const q1 = (p.questions || [])[0];
      console.log(`\n[${r.title}]`);
      if (q1) {
        console.log('  stem:', (q1.stem || '').slice(0, 100));
        console.log('  questionKind:', q1.questionKind);
        console.log('  competency:', q1.competency);
        console.log('  choices:', (q1.choices || []).slice(0, 4).map((c) => c.text || c).join(' / '));
      }
    }
  } finally {
    await conn.end();
    await new Promise((r) => tunnel.server.close(r));
    tunnel.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
