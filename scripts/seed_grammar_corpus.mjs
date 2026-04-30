/**
 * 문법 RAG 코퍼스 import 스크립트.
 *
 * 동작:
 *   1) `참고용 기출 지문/참고용 문법 자료/` 의 핵심 MD/JSON 파일을 읽어
 *      `grammar_corpus` 테이블에 INSERT (이미 있으면 UPDATE).
 *   2) 파일명에서 topic 추출 (음운·단어·문장·의미·담화·국어사·매체).
 *   3) source = 폴더명, title = 파일명, content_md = 본문 그대로.
 *
 * 실행: node scripts/seed_grammar_corpus.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const SOURCE_ROOT = 'C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지\\참고용 기출 지문\\참고용 문법 자료';

function ext(s, k) { const m = s.match(new RegExp(`${k}:\\s*(?:['"]([^'"]+)['"]|(\\d+))`)); return m ? (m[1] ?? m[2]) : null; }
function readDbConfig() {
  const src = fs.readFileSync(path.join(ROOT, 'scripts', 'import-pro-content.js'), 'utf8');
  const block = src.match(/const DB_CONFIG = \{([\s\S]*?)\};/)[1];
  return { host: ext(block,'host'), port: Number(ext(block,'port'))||3306, user: ext(block,'user'), password: ext(block,'password'), database: ext(block,'database') };
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

// 파일명에서 topic 추출
const TOPIC_PATTERNS = [
  { re: /음운/, topic: '음운' },
  { re: /단어/, topic: '단어' },
  { re: /문장/, topic: '문장' },
  { re: /의미/, topic: '의미' },
  { re: /담화/, topic: '담화' },
  { re: /국어사/, topic: '국어사' },
  { re: /높임/, topic: '문장' },
  { re: /매체/, topic: '매체' },
  { re: /시제/, topic: '문장' },
  { re: /피동|사동/, topic: '문장' },
  { re: /형성/, topic: '단어' },
  { re: /품사/, topic: '단어' },
];
function extractTopic(filename) {
  for (const { re, topic } of TOPIC_PATTERNS) {
    if (re.test(filename)) return topic;
  }
  return null;
}

function genId(name) {
  return 'gc_' + crypto.createHash('md5').update(name).digest('hex').slice(0, 24);
}

(async () => {
  // 우선순위: 27수특 언매 MD + json 폴더 + 핵심 MD
  const targets = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/\.(md|json)$/i.test(ent.name)) targets.push(p);
    }
  };
  walk(SOURCE_ROOT);

  const items = [];
  for (const fp of targets) {
    const filename = path.basename(fp);
    const topic = extractTopic(filename);
    if (!topic) continue;  // 토픽 매칭 안 되면 스킵
    const content = fs.readFileSync(fp, 'utf8');
    if (content.length < 50) continue;  // 빈 파일 스킵
    if (content.length > 200_000) continue;  // 너무 큰 파일 스킵 (200KB 한도)
    const relSrc = path.relative(SOURCE_ROOT, path.dirname(fp)) || '루트';
    items.push({
      id: genId(fp),
      topic,
      source: relSrc,
      title: filename.replace(/\.(md|json)$/i, ''),
      content_md: content,
    });
  }
  console.log(`총 ${items.length}건 import 대상`);

  const cfg = readDbConfig();
  const t = await tunnel(cfg);
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: t.port,
    user: cfg.user, password: cfg.password, database: cfg.database, charset: 'utf8mb4',
  });
  try {
    let inserted = 0, updated = 0;
    for (const it of items) {
      const [rs] = await conn.execute(
        `INSERT INTO grammar_corpus (id, topic, source, title, content_md, status)
         VALUES (?, ?, ?, ?, ?, 'active')
         ON DUPLICATE KEY UPDATE topic=VALUES(topic), source=VALUES(source), title=VALUES(title), content_md=VALUES(content_md), updated_at=CURRENT_TIMESTAMP`,
        [it.id, it.topic, it.source, it.title, it.content_md]
      );
      if (rs.affectedRows === 1) inserted++;
      else updated++;
    }
    console.log(`완료: 신규 ${inserted}, 갱신 ${updated}`);

    const [byTopic] = await conn.execute(
      `SELECT topic, COUNT(*) cnt FROM grammar_corpus GROUP BY topic ORDER BY topic`
    );
    console.log('\n토픽별 분포:');
    for (const r of byTopic) console.log(`  ${r.topic}: ${r.cnt}`);
  } finally {
    await conn.end();
    await new Promise(r => t.server.close(r));
    t.ssh.end();
  }
})().catch(e => { console.error(e); process.exit(1); });
