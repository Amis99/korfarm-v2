#!/usr/bin/env node
/**
 * 비트겐슈타인 진단 테스트(diag_paper_wittgenstein) payload + diag_passages/diag_questions dump.
 * 출력: generated/wittgenstein_payload_input.json + 백업
 */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const OUT_DIR = path.join(ROOT, 'generated');

function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }

function extractConfigValue(source, key) {
  const m = source.match(new RegExp(`${key}:\\s*(?:['"]([^'"]+)['"]|(\\d+))`));
  if (!m) throw new Error(`DB config key not found: ${key}`);
  return m[1] ?? m[2];
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
async function closeTunnel(t) {
  await new Promise((r) => t.server.close(r));
  t.sshClient.end();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const runStamp = stamp();
  let tunnel = null, conn = null;
  try {
    const dbConfig = readDbConfig();
    tunnel = await createTunnel(dbConfig);
    conn = await mysql.createConnection({
      host: '127.0.0.1', port: tunnel.localPort,
      user: dbConfig.user, password: dbConfig.password, database: dbConfig.database,
      charset: 'utf8mb4',
    });

    const [paperRows] = await conn.execute(
      "SELECT id, title, payload_json FROM test_papers WHERE id = 'diag_paper_wittgenstein'"
    );
    if (paperRows.length === 0) throw new Error('diag_paper_wittgenstein 행이 없습니다.');
    const paper = paperRows[0];
    let payload = paper.payload_json;
    if (typeof payload === 'string') payload = JSON.parse(payload);

    const passagesCount = Array.isArray(payload.passages) ? payload.passages.length : 0;
    const questionsCount = Array.isArray(payload.questions) ? payload.questions.length : 0;
    console.log(`test_papers: ${paper.id} / ${paper.title}`);
    console.log(`  지문 ${passagesCount}개 · 문항 ${questionsCount}개`);

    const [diagPRows] = await conn.execute(
      "SELECT id, level, genre, text_md FROM diag_passages WHERE tier = 'wittgenstein' ORDER BY id"
    );
    const [diagQRows] = await conn.execute(
      "SELECT id, passage_id, order_in_passage, stem, correct_choice, choices_json FROM diag_questions WHERE tier = 'wittgenstein' ORDER BY passage_id, order_in_passage, id"
    );
    console.log(`diag_passages: ${diagPRows.length}개`);
    console.log(`diag_questions: ${diagQRows.length}개`);

    const dump = {
      test_paper: paper,
      payload,
      diag_passages: diagPRows,
      diag_questions: diagQRows.map((r) => ({
        ...r,
        choices_json: typeof r.choices_json === 'string' ? JSON.parse(r.choices_json) : r.choices_json,
      })),
      stamp: runStamp,
    };

    const inputPath = path.join(OUT_DIR, 'wittgenstein_payload_input.json');
    fs.writeFileSync(inputPath, JSON.stringify(dump, null, 2), 'utf8');
    console.log(`작업용 저장 → ${inputPath}`);
    const backupPath = path.join(OUT_DIR, `wittgenstein_payload_backup_${runStamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(dump, null, 2), 'utf8');
    console.log(`백업 저장 → ${backupPath}`);

    // 33~48 미리보기 (passage·question 매핑 확인용)
    if (Array.isArray(payload.questions)) {
      console.log('\n=== 33~48 문항 미리보기 ===');
      for (let i = 32; i < 48 && i < payload.questions.length; i++) {
        const q = payload.questions[i];
        const stem = (q.stem || '').replace(/\s+/g, ' ').slice(0, 50);
        console.log(`  Q${i + 1} id=${q.id} passage=${q.passageId || q.passage_id} | ${stem}...`);
      }
    }
    if (Array.isArray(payload.passages)) {
      console.log('\n=== 지문 목록 ===');
      for (const p of payload.passages) {
        const t = (p.text || p.body || '').replace(/\s+/g, ' ').slice(0, 60);
        console.log(`  id=${p.id} domain=${p.domain || ''} subDomain=${p.subDomain || ''} | ${t}...`);
      }
    }
  } finally {
    if (conn) await conn.end();
    if (tunnel) await closeTunnel(tunnel);
  }
}
main().catch((e) => { console.error('ERR:', e.message); process.exit(1); });
