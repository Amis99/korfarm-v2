// 한 Day 의 12 콘텐츠 Q10 + 전체 questions 를 콘텐츠별 JSON 으로 dump.
// 한국어 텍스트는 절대 생성하지 않음 — DB 조회·파일 분리만.
//
// 사용:
//   node scripts/_dump_day.mjs 2
//   node scripts/_dump_day.mjs 100 --concise   (Q10만 짧게)
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
  'SAUSSURE_1', 'SAUSSURE_2', 'SAUSSURE_3',
  'FREGE_1', 'FREGE_2', 'FREGE_3',
  'RUSSELL_1', 'RUSSELL_2', 'RUSSELL_3',
  'WITTGENSTEIN_1', 'WITTGENSTEIN_2', 'WITTGENSTEIN_3',
];

// Day 별 ID 패턴: SAUSSURE/FREGE/RUSSELL = 3-digit zero-pad / WITTGENSTEIN = no zero-pad
function idFor(level, day) {
  if (level.startsWith('WITT')) return `dq-${level}-${day}`;
  return `dq-${level}-${String(day).padStart(3, '0')}`;
}

const PAIR_LEFT = ['SAUSSURE_1', 'SAUSSURE_3', 'FREGE_2', 'RUSSELL_1', 'RUSSELL_3', 'WITTGENSTEIN_2'];
const PAIR_RIGHT = ['SAUSSURE_2', 'FREGE_1', 'FREGE_3', 'RUSSELL_2', 'WITTGENSTEIN_1', 'WITTGENSTEIN_3'];

function isPassageDeficient(passage) {
  if (!passage) return { deficient: true, reason: '없음' };
  const text = typeof passage === 'string'
    ? passage
    : (passage?.paragraphs?.map((p) => p.text).join('\n') || '');
  if (!text) return { deficient: true, reason: '없음' };
  const sentenceCount = (text.match(/[.!?。]/g) || []).length;
  // 부실 기준: 단일 문장 OR 매우 짧음(< 30자, 다문장이어도 분해 불가능 수준)
  if (sentenceCount <= 1) return { deficient: true, reason: `단일 문장(${text.length}자)` };
  if (text.length < 30) return { deficient: true, reason: `매우 짧음(${text.length}자)` };
  return { deficient: false };
}

(async () => {
  const args = process.argv.slice(2);
  const day = Number(args.find((a) => !a.startsWith('--')));
  if (!day || day < 1 || day > 365) {
    console.error('사용: node scripts/_dump_day.mjs <day 1~365> [--concise]');
    process.exit(1);
  }
  const concise = args.includes('--concise');

  const ids = LEVELS.map((l) => idFor(l, day));
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
    if (rows.length !== 12) {
      console.warn(`경고: ${rows.length}/12 콘텐츠 조회됨. 누락: ${ids.filter((id) => !rows.find((r) => r.content_id === id)).join(', ')}`);
    }

    const dayRoot = path.join(ROOT, 'scripts', '_q10_drafts', `day${String(day).padStart(3, '0')}`);
    const dayDir = path.join(dayRoot, '_inputs');     // dump 전용 (draft 와 충돌 방지)
    fs.mkdirSync(dayDir, { recursive: true });
    fs.mkdirSync(dayRoot, { recursive: true });

    const map = new Map(rows.map((r) => [r.content_id, r]));
    const summary = [];
    for (const level of LEVELS) {
      const id = idFor(level, day);
      const r = map.get(id);
      if (!r) {
        summary.push({ level, contentId: id, missing: true });
        continue;
      }
      const w = JSON.parse(r.content_json);
      const p = w.payload || w;
      const q10 = (p.questions || [])[9];
      const def = isPassageDeficient(q10?.passage);
      const out = {
        contentId: id,
        title: w.title,
        targetLevel: w.targetLevel,
        questions: (p.questions || []).map((q, i) => ({
          idx: i + 1, id: q.id, type: q.type, questionKind: q.questionKind,
          stem: q.stem, passage: q.passage, choices: q.choices,
          answerId: q.answerId, explanation: q.explanation,
        })),
      };
      fs.writeFileSync(path.join(dayDir, `${id}.json`), JSON.stringify(out, null, 2), 'utf8');
      summary.push({ level, contentId: id, q10Type: q10?.type, deficient: def.deficient, reason: def.reason || '' });
    }

    // 페어 표준 결정
    const pairStandards = [];
    for (let i = 0; i < 6; i++) {
      const left = PAIR_LEFT[i], right = PAIR_RIGHT[i];
      const ls = summary.find((s) => s.level === left);
      const rs = summary.find((s) => s.level === right);
      let std = left, fall = right, note = '왼쪽 표준 (default)';
      if (ls?.missing || rs?.missing) {
        note = '누락 콘텐츠 — 점검 필요';
      } else if (ls.deficient && !rs.deficient) {
        std = right; fall = left; note = `왼쪽 부실(${ls.reason}) → 오른쪽 표준`;
      } else if (!ls.deficient && rs.deficient) {
        note = `오른쪽 부실(${rs.reason}) → 왼쪽 표준`;
      } else if (ls.deficient && rs.deficient) {
        note = `🚨 양쪽 부실 — 예외 큐 (${ls.reason} / ${rs.reason})`;
      }
      pairStandards.push({
        pair: i + 1,
        left, right,
        standardLevel: std, fallbackLevel: fall,
        standardId: idFor(std, day), fallbackId: idFor(fall, day),
        note,
      });
    }

    fs.writeFileSync(
      path.join(dayRoot, '_summary.json'),
      JSON.stringify({ day, summary, pairStandards }, null, 2),
      'utf8',
    );

    console.log(`\nDay ${day} dump → ${path.relative(ROOT, dayRoot)}/`);
    console.log(`  inputs (dump): ${path.relative(ROOT, dayDir)}/`);
    console.log(`  drafts: 직접 작성해서 ${path.relative(ROOT, dayRoot)}/{contentId}.json 으로 저장`);
    console.log('\n페어 표준 매핑:');
    for (const ps of pairStandards) {
      console.log(`  페어 ${ps.pair}: 표준 = ${ps.standardId.padEnd(28)} ← ${ps.fallbackId.padEnd(28)}  ${ps.note}`);
    }
    if (concise) {
      console.log('\nQ10 지문 (앞 100자):');
      for (const s of summary) {
        if (s.missing) { console.log(`  ${s.contentId}: 누락`); continue; }
        const r = map.get(s.contentId);
        const w = JSON.parse(r.content_json);
        const p = w.payload || w;
        const q10 = (p.questions || [])[9];
        const txt = typeof q10?.passage === 'string' ? q10.passage : (q10?.passage?.paragraphs?.map((x) => x.text).join('\n') || '');
        const flag = s.deficient ? `🚨${s.reason}` : '';
        console.log(`  [${s.level.padEnd(15)}] ${flag} ${txt.slice(0, 100)}`);
      }
    }
  } finally {
    await conn.end();
    await new Promise((r) => t.server.close(r));
    t.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
