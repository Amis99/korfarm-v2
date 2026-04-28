#!/usr/bin/env node
/**
 * 형태소 분석 콘텐츠 categories 정상화.
 * 현재: content_type='MORPHEME_ANALYSIS' 인데 categories=["GRAMMAR_POS"] 로 잘못 등록됨.
 * 수정: categories=["MORPHEME_ANALYSIS"] 로 교체.
 *
 * 실행:
 *   node scripts/fix_morpheme_categories.mjs            # dry-run
 *   node scripts/fix_morpheme_categories.mjs --apply    # 실제 적용
 */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const TMP_DIR = path.join(ROOT, 'tmp');
const APPLY = process.argv.includes('--apply');

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
function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }

(async () => {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const cfg = readDbConfig();
  const tunnel = await createTunnel(cfg);
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: tunnel.port,
    user: cfg.user, password: cfg.password, database: cfg.database, charset: 'utf8mb4',
  });
  try {
    const [rows] = await conn.execute(
      "SELECT id, content_type, categories, title FROM contents WHERE content_type = 'MORPHEME_ANALYSIS'"
    );
    console.log(`대상: ${rows.length} 건`);
    fs.writeFileSync(path.join(TMP_DIR, `morpheme-categories-backup-${stamp()}.json`), JSON.stringify(rows, null, 2), 'utf8');
    console.log('백업 저장 완료');

    for (const r of rows) {
      console.log(`  ${r.id} | ${r.title} | categories: ${r.categories}`);
    }

    if (!APPLY) {
      console.log('\n(dry-run — --apply 필요)');
      return;
    }

    const newCategories = JSON.stringify(["MORPHEME_ANALYSIS"]);
    await conn.beginTransaction();
    let ok = 0;
    try {
      for (const r of rows) {
        const [u] = await conn.execute(
          'UPDATE contents SET categories = ?, updated_at = NOW() WHERE id = ?',
          [newCategories, r.id]
        );
        if (u.affectedRows > 0) ok += 1;
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    }
    console.log(`\nUPDATE 완료: ${ok}건`);
  } finally {
    await conn.end();
    await new Promise((r) => tunnel.server.close(r));
    tunnel.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
