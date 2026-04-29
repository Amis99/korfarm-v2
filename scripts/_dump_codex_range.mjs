// Day 범위(예: 20~365)를 한 번의 SSH 터널로 일괄 dump.
// 출력: C:/Users/RENEWCOM PC/Documents/국어농장v2_q10_codex/inputs/dayNNN/dq-LEVEL-NNN.json
//       + pair_mappings.json (각 Day 의 페어 표준)
// 사용:
//   node scripts/_dump_codex_range.mjs 20 365
//   node scripts/_dump_codex_range.mjs 20 365 --skip 118
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

const CODEX_ROOT = 'C:/Users/RENEWCOM PC/Documents/국어농장v2_q10_codex';
const INPUTS_ROOT = path.join(CODEX_ROOT, 'inputs');

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
  if (sentenceCount <= 1) return { deficient: true, reason: `단일 문장(${text.length}자)` };
  if (text.length < 30) return { deficient: true, reason: `매우 짧음(${text.length}자)` };
  return { deficient: false };
}

(async () => {
  const args = process.argv.slice(2);
  const nums = args.filter((a) => /^\d+$/.test(a)).map(Number);
  const fromDay = nums[0];
  const toDay = nums[1];
  if (!fromDay || !toDay || fromDay > toDay) {
    console.error('사용: node scripts/_dump_codex_range.mjs <from> <to> [--skip 118]');
    process.exit(1);
  }
  const skipIdx = args.indexOf('--skip');
  const skipDays = new Set();
  if (skipIdx >= 0) {
    for (let i = skipIdx + 1; i < args.length; i++) {
      if (/^\d+$/.test(args[i])) skipDays.add(Number(args[i]));
      else break;
    }
  }

  fs.mkdirSync(INPUTS_ROOT, { recursive: true });

  const cfg = readDbConfig();
  console.log(`SSH 터널 연결 중 → ${cfg.host}:${cfg.port}`);
  const t = await tunnel(cfg);
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: t.port,
    user: cfg.user, password: cfg.password, database: cfg.database, charset: 'utf8mb4',
  });
  console.log(`SSH 터널 OK. Day ${fromDay} ~ ${toDay} dump 시작 (제외: ${[...skipDays].join(',') || '없음'})`);

  const allMappings = {};
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (let day = fromDay; day <= toDay; day++) {
      if (skipDays.has(day)) {
        skipped++;
        continue;
      }
      const ids = LEVELS.map((l) => idFor(l, day));
      const ph = ids.map(() => '?').join(',');
      try {
        const [rows] = await conn.execute(
          `SELECT cv.content_id, cv.content_json
           FROM content_versions cv
           INNER JOIN (
             SELECT content_id, MAX(created_at) AS max_at FROM content_versions WHERE content_id IN (${ph}) GROUP BY content_id
           ) latest ON latest.content_id = cv.content_id AND latest.max_at = cv.created_at`,
          ids,
        );
        if (rows.length === 0) {
          console.warn(`Day ${day}: 0/12 — 콘텐츠 누락, 건너뜀`);
          failed++;
          continue;
        }

        const dayDir = path.join(INPUTS_ROOT, `day${String(day).padStart(3, '0')}`);
        fs.mkdirSync(dayDir, { recursive: true });

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

        // 페어 표준 매핑
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
            pair: i + 1, left, right,
            standardLevel: std, fallbackLevel: fall,
            standardId: idFor(std, day), fallbackId: idFor(fall, day),
            note,
          });
        }

        fs.writeFileSync(path.join(dayDir, '_pair_mapping.json'),
          JSON.stringify({ day, pairStandards }, null, 2), 'utf8');

        allMappings[`day${String(day).padStart(3, '0')}`] = pairStandards;
        processed++;

        if (processed % 20 === 0) {
          console.log(`  ${processed}일 완료...`);
        }
      } catch (e) {
        console.error(`Day ${day} 실패: ${e.message}`);
        failed++;
      }
    }

    fs.writeFileSync(path.join(CODEX_ROOT, 'pair_mappings.json'),
      JSON.stringify(allMappings, null, 2), 'utf8');

    console.log(`\n=== 완료 ===`);
    console.log(`처리: ${processed}일 / 건너뜀: ${skipped}일 / 실패: ${failed}일`);
    console.log(`출력: ${INPUTS_ROOT}`);
    console.log(`매핑: ${path.join(CODEX_ROOT, 'pair_mappings.json')}`);
  } finally {
    await conn.end();
    await new Promise((r) => t.server.close(r));
    t.ssh.end();
  }
})().catch((e) => { console.error(e); process.exit(1); });
