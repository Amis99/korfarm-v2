// 12레벨 LOGIC 콘텐츠 (농장 + 프로) 일괄 dump — Phase D 백업용
// 실행: node _work/_dump_all_logic_backup.mjs
// 출력: _work/{level_lower}_logic_dump_backup_{YYYY-MM-DD}.json (12개)
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

const LEVELS = [
  ['SAUSSURE_1', 'saussure1'],
  ['SAUSSURE_2', 'saussure2'],
  ['SAUSSURE_3', 'saussure3'],
  ['FREGE_1', 'frege1'],
  ['FREGE_2', 'frege2'],
  ['FREGE_3', 'frege3'],
  ['RUSSELL_1', 'russell1'],
  ['RUSSELL_2', 'russell2'],
  ['RUSSELL_3', 'russell3'],
  ['WITTGENSTEIN_1', 'wittgenstein1'],
  ['WITTGENSTEIN_2', 'wittgenstein2'],
  ['WITTGENSTEIN_3', 'wittgenstein3'],
];

function ext(s, k) {
  const m = s.match(new RegExp(`${k}:\\s*(?:['"]([^'"]+)['"]|(\\d+))`));
  return m ? (m[1] ?? m[2]) : null;
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

(async () => {
  const cfg = readDbConfig();
  const t = await tunnel(cfg);
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: t.port,
    user: cfg.user, password: cfg.password, database: cfg.database, charset: 'utf8mb4',
  });

  const today = new Date().toISOString().slice(0, 10);
  const summary = [];
  let totalRows = 0;

  for (const [levelUpper, levelLower] of LEVELS) {
    const [items] = await conn.query(`
      SELECT id, content_type, level_id, title, area, sub_area, day_index, module_key, status, categories
      FROM contents
      WHERE (level_id = ? AND content_type = 'LOGIC_REASONING_QUIZ')
         OR (level_id = ? AND content_type = 'PRO_LOGIC')
      ORDER BY content_type, title
    `, [levelUpper, levelLower]);

    const out = [];
    for (const it of items) {
      const [rows] = await conn.query(`
        SELECT id AS version_id, content_json, schema_version, uploaded_by, created_at, updated_at
        FROM content_versions
        WHERE content_id = ? ORDER BY created_at DESC LIMIT 1
      `, [it.id]);
      out.push({
        id: it.id,
        content_type: it.content_type,
        level_id: it.level_id,
        title: it.title,
        area: it.area,
        sub_area: it.sub_area,
        day_index: it.day_index,
        module_key: it.module_key,
        status: it.status,
        categories: it.categories,
        version_id: rows[0]?.version_id || null,
        schema_version: rows[0]?.schema_version || null,
        uploaded_by: rows[0]?.uploaded_by || null,
        created_at: rows[0]?.created_at || null,
        updated_at: rows[0]?.updated_at || null,
        payload: rows[0]?.content_json
          ? (typeof rows[0].content_json === 'string' ? JSON.parse(rows[0].content_json) : rows[0].content_json)
          : null,
      });
    }

    const outPath = path.join(ROOT, '_work', `${levelLower}_logic_dump_backup_${today}.json`);
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
    const farmCnt = out.filter(o => o.content_type === 'LOGIC_REASONING_QUIZ').length;
    const proCnt = out.filter(o => o.content_type === 'PRO_LOGIC').length;
    summary.push({ level: levelLower, farm: farmCnt, pro: proCnt, total: out.length, file: path.basename(outPath) });
    totalRows += out.length;
    console.log(`  ${levelLower}: 농장 ${farmCnt} + 프로 ${proCnt} = ${out.length}건 → ${path.basename(outPath)}`);
  }

  console.log(`\n=== 백업 완료: 12레벨 / 총 ${totalRows}건 ===`);
  console.table(summary);

  await conn.end();
  t.server.close();
  t.ssh.end();
})().catch((e) => {
  console.error('실패:', e.message);
  process.exit(1);
});
