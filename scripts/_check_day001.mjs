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

const LEVELS = [
  "SAUSSURE_1", "SAUSSURE_2", "SAUSSURE_3",
  "FREGE_1", "FREGE_2", "FREGE_3",
  "RUSSELL_1", "RUSSELL_2", "RUSSELL_3",
  "WITTGENSTEIN_1", "WITTGENSTEIN_2", "WITTGENSTEIN_3",
];
// 패턴 차이: WITT 는 zero-padding 없음 (`dq-WITTGENSTEIN_X-1`),
// 나머지 9 레벨은 3-digit (`dq-LEVEL-001`)
const ids = LEVELS.map((l) => l.startsWith('WITT') ? `dq-${l}-1` : `dq-${l}-001`);

(async () => {
  const cfg = readDbConfig();
  const t = await tunnel(cfg);
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: t.port,
    user: cfg.user, password: cfg.password, database: cfg.database, charset: 'utf8mb4',
  });
  try {
    const ph = ids.map(() => '?').join(',');
    const [rows] = await conn.execute(
      `SELECT cv.content_id, cv.content_json
       FROM content_versions cv
       INNER JOIN (
         SELECT content_id, MAX(created_at) AS max_at FROM content_versions WHERE content_id IN (${ph}) GROUP BY content_id
       ) latest ON latest.content_id = cv.content_id AND latest.max_at = cv.created_at`,
      ids,
    );
    console.log(`조회: ${rows.length}/${ids.length}`);
    const out = [];
    for (const r of rows) {
      const w = JSON.parse(r.content_json);
      const p = w.payload || w;
      out.push({
        contentId: r.content_id,
        title: w.title,
        targetLevel: w.targetLevel,
        questions: (p.questions || []).map((q, i) => ({
          idx: i + 1,
          id: q.id,
          type: q.type,
          questionKind: q.questionKind,
          stem: q.stem,
          passage: q.passage,
          choices: q.choices,
          answerId: q.answerId,
          explanation: q.explanation,
        })),
      });
    }
    fs.writeFileSync(
      path.join(ROOT, 'scripts', '_day001_full_dump.json'),
      JSON.stringify(out, null, 2), 'utf8',
    );
    console.log('전체 덤프 → scripts/_day001_full_dump.json');
  } finally {
    await conn.end();
    await new Promise((r) => t.server.close(r));
    t.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
