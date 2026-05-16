#!/usr/bin/env node
/**
 * 프레게 진단 테스트 분석 적용 결과 검증.
 *  - test_papers.payload_json : passages 분류 + questions 분석 메타 9개 필드 확인
 *  - diag_questions.choices_json : 모든 choice 에 vector·error_path 채워졌는지 확인
 *  - 임의 샘플 5문항·2지문 출력
 */
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
    const ssh = new Client();
    const keyPath = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'korfarm-ec2.pem');
    ssh.on('ready', () => {
      const server = net.createServer((sock) => {
        ssh.forwardOut('127.0.0.1', 0, dbConfig.host, dbConfig.port, (err, stream) => {
          if (err) { sock.destroy(err); return; }
          sock.pipe(stream).pipe(sock);
        });
      });
      server.listen(0, '127.0.0.1', () => resolve({ ssh, server, localPort: server.address().port }));
    });
    ssh.on('error', reject);
    ssh.connect({
      host: '43.200.104.102', port: 22, username: 'ec2-user',
      privateKey: fs.readFileSync(keyPath),
    });
  });
}
async function closeTunnel(t) {
  await new Promise((r) => t.server.close(r));
  t.ssh.end();
}

const PASSAGE_FIELDS = ['domain', 'subDomain', 'theme'];
const QUESTION_FIELDS = [
  'domain', 'subDomain', 'questionType',
  'competencyVector', 'intent', 'explanation',
  'choiceExplanations', 'wrongPattern',
];

function pickSample(arr, n) {
  const a = [...arr];
  const out = [];
  while (out.length < n && a.length) {
    const i = Math.floor(Math.random() * a.length);
    out.push(a.splice(i, 1)[0]);
  }
  return out;
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

    const [paperRows] = await conn.execute(
      "SELECT payload_json FROM test_papers WHERE id = 'diag_paper_wittgenstein'",
    );
    const payload = typeof paperRows[0].payload_json === 'string'
      ? JSON.parse(paperRows[0].payload_json) : paperRows[0].payload_json;

    let err = 0, ok = 0;
    console.log('── 1) payload.passages 검증 ──');
    for (const p of payload.passages) {
      for (const k of PASSAGE_FIELDS) {
        if (p[k] === undefined || p[k] === null || p[k] === '') {
          console.log(`  ✘ ${p.id} 누락: ${k}`);
          err++;
        }
      }
      ok++;
    }
    console.log(`  지문 ${ok}개 확인`);

    ok = 0;
    console.log('\n── 2) payload.questions 검증 ──');
    for (const q of payload.questions) {
      for (const k of QUESTION_FIELDS) {
        const v = q[k];
        if (v === undefined || v === null
          || (typeof v === 'string' && !v.trim())
          || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)) {
          console.log(`  ✘ ${q.id} 누락: ${k}`);
          err++;
        }
      }
      // choices 검증
      if (Array.isArray(q.choices)) {
        const correctId = q.answerId;
        for (const c of q.choices) {
          if (!c.vector || Object.keys(c.vector).length === 0) {
            if (c.id !== correctId) {
              // 오답 선지에 vector 가 비어 있으면 OK 가 아님 (wrongVector 누락)
              console.log(`  ✘ ${q.id} 선지 ${c.id} vector 누락`);
              err++;
            }
            // 정답 선지여도 vector 가 비어선 안 됨
            else {
              console.log(`  ✘ ${q.id} 정답 선지 ${c.id} vector 누락`);
              err++;
            }
          }
          if (c.errorPath === undefined) {
            console.log(`  ✘ ${q.id} 선지 ${c.id} errorPath 키 누락`);
            err++;
          }
        }
      }
      ok++;
    }
    console.log(`  문항 ${ok}개 확인`);

    console.log('\n── 3) diag_questions.choices_json 검증 ──');
    const [qRows] = await conn.execute(
      "SELECT id, correct_choice, choices_json FROM diag_questions WHERE tier = 'wittgenstein'",
    );
    let diagOk = 0;
    for (const r of qRows) {
      const cj = typeof r.choices_json === 'string' ? JSON.parse(r.choices_json) : r.choices_json;
      for (const c of cj) {
        if (!c.vector) {
          console.log(`  ✘ ${r.id} ${c.choice_id} diag vector 누락`);
          err++;
        }
        if (!('error_path' in c)) {
          console.log(`  ✘ ${r.id} ${c.choice_id} diag error_path 키 누락`);
          err++;
        }
      }
      diagOk++;
    }
    console.log(`  diag_questions ${diagOk}개 확인`);

    console.log('\n── 4) 샘플 ──');
    const sampleQs = pickSample(payload.questions, 5);
    for (const q of sampleQs) {
      console.log(`\n  ▷ ${q.id} (${q.domain}/${q.subDomain}/${q.questionType}) 정답=${q.answerId}`);
      console.log(`    intent: ${q.intent.slice(0, 60)}...`);
      console.log(`    competencyVector keys: ${Object.keys(q.competencyVector).join(',')}`);
      console.log(`    wrongPattern: ${JSON.stringify(q.wrongPattern)}`);
    }

    const samplePs = pickSample(payload.passages, 2);
    for (const p of samplePs) {
      console.log(`\n  ▷ ${p.id} ${p.domain}/${p.subDomain} — ${p.theme}`);
    }

    console.log('\n══════════════════════════════');
    if (err === 0) console.log('✔ 모두 채워짐 (errors: 0)');
    else console.log(`✘ 누락 ${err}건`);
  } finally {
    if (conn) await conn.end();
    if (tunnel) await closeTunnel(tunnel);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
