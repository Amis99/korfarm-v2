/**
 * 논리 사고력 480건 DB 반영 스크립트 (Phase D)
 *
 * 정책: UPSERT
 *  - 기존 매칭 콘텐츠가 있으면 contents 메타 + content_versions.content_json 을 UPDATE
 *    (content_id 유지 → pro_chapter_items 외래키 안 깨짐)
 *  - 없으면 새 content_id 로 INSERT (비트 PRO 60건 신규)
 *
 * 매칭 키:
 *  - 농장 (LOGIC_REASONING_QUIZ): (level_id, content_type, title) — 기존 title="논리 사고력 NN"
 *  - 프로 (PRO_LOGIC): (level_id, content_type, day_index) — 기존 day_index=챕터번호
 *
 * 실행 옵션:
 *   node scripts/replace-logic-content.js           # dry-run (DB 변경 X, 매칭 결과만 출력)
 *   node scripts/replace-logic-content.js --execute # 실제 UPDATE/INSERT 수행
 */
const mysql = require('mysql2/promise');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');

const SRC_DIR = path.join(__dirname, '..', 'generated', 'logic-rewrite');
const EXECUTE = process.argv.includes('--execute');

const SSH_CONFIG = {
  host: '43.200.104.102',
  port: 22,
  username: 'ec2-user',
  privateKey: fs.readFileSync(path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'korfarm-ec2.pem'))
};
const DB_CONFIG = {
  host: 'korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com',
  port: 3306,
  user: 'admin',
  password: 'xXoM4Ld7VAIYl9W874md5kic',
  database: 'korfarm'
};

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
}

function parseFilename(filename) {
  const m = filename.match(/^([a-z]+\d)_(farm|pro)_(\d{2})\.json$/);
  if (!m) return null;
  return { fileLevel: m[1], mode: m[2], chapter: parseInt(m[3], 10) };
}

async function createSshTunnel() {
  return new Promise((resolve, reject) => {
    const sshClient = new Client();
    sshClient.on('ready', () => {
      const server = net.createServer((sock) => {
        sshClient.forwardOut('127.0.0.1', 0, DB_CONFIG.host, DB_CONFIG.port, (err, stream) => {
          if (err) { sock.end(); return; }
          sock.pipe(stream).pipe(sock);
        });
      });
      server.listen(0, '127.0.0.1', () => resolve({ sshClient, server, localPort: server.address().port }));
    });
    sshClient.on('error', reject);
    sshClient.connect(SSH_CONFIG);
  });
}

async function main() {
  console.log(`=== 논리 사고력 480건 DB 반영 (${EXECUTE ? 'EXECUTE' : 'DRY-RUN'}) ===\n`);

  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.json')).sort();
  console.log(`대상 파일: ${files.length}개\n`);

  const { sshClient, server, localPort } = await createSshTunnel();
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: localPort,
    user: DB_CONFIG.user, password: DB_CONFIG.password, database: DB_CONFIG.database, charset: 'utf8mb4'
  });
  console.log('DB 연결 성공\n');

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  let updated = 0, inserted = 0, failed = 0;
  const summaryByLevel = {};

  for (const filename of files) {
    const parsed = parseFilename(filename);
    if (!parsed) { console.log(`  건너뜀: ${filename}`); continue; }

    const { fileLevel, mode, chapter } = parsed;
    const json = JSON.parse(fs.readFileSync(path.join(SRC_DIR, filename), 'utf8'));
    const contentJson = JSON.stringify(json);

    const contentType = json.contentType;
    const levelId = json.targetLevel;
    const title = json.title;
    const area = json.area || 'LOGIC';
    const subArea = json.subArea || (mode === 'farm' ? 'REASONING' : 'PRO');
    const moduleKey = 'logic_reasoning';
    const dayIndex = mode === 'farm' ? null : chapter;
    const categories = mode === 'farm' ? '["LOGIC"]' : '["PRO_LOGIC","LOGIC"]';

    try {
      let existingRow = null;
      if (mode === 'farm') {
        const [rows] = await conn.execute(
          `SELECT id FROM contents WHERE content_type = 'LOGIC_REASONING_QUIZ' AND level_id = ? AND title = ? LIMIT 1`,
          [levelId, title]
        );
        existingRow = rows[0] || null;
      } else {
        const [rows] = await conn.execute(
          `SELECT id FROM contents WHERE content_type = 'PRO_LOGIC' AND level_id = ? AND day_index = ? LIMIT 1`,
          [levelId, dayIndex]
        );
        existingRow = rows[0] || null;
      }

      const lvKey = levelId + '_' + mode;
      summaryByLevel[lvKey] = summaryByLevel[lvKey] || { update: 0, insert: 0 };

      if (existingRow) {
        if (EXECUTE) {
          await conn.execute(
            `UPDATE contents SET title = ?, area = ?, sub_area = ?, day_index = ?, module_key = ?, categories = ?, status = 'active', updated_at = ? WHERE id = ?`,
            [title, area, subArea, dayIndex, moduleKey, categories, now, existingRow.id]
          );
          const [vRows] = await conn.execute(
            `SELECT id FROM content_versions WHERE content_id = ? ORDER BY created_at DESC LIMIT 1`,
            [existingRow.id]
          );
          if (vRows.length > 0) {
            await conn.execute(
              `UPDATE content_versions SET content_json = ?, updated_at = ? WHERE id = ?`,
              [contentJson, now, vRows[0].id]
            );
          } else {
            const versionId = newId('cv');
            await conn.execute(
              `INSERT INTO content_versions (id, content_id, schema_version, content_json, uploaded_by, created_at, updated_at)
               VALUES (?, ?, '1.0', ?, 'u_hq_admin', ?, ?)`,
              [versionId, existingRow.id, contentJson, now, now]
            );
          }
        }
        updated++;
        summaryByLevel[lvKey].update++;
        process.stdout.write('U');
      } else {
        if (EXECUTE) {
          const contentId = newId('content');
          const versionId = newId('cv');
          await conn.execute(
            `INSERT INTO contents (id, content_type, level_id, title, status, area, sub_area, day_index, module_key, categories, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)`,
            [contentId, contentType, levelId, title, area, subArea, dayIndex, moduleKey, categories, now, now]
          );
          await conn.execute(
            `INSERT INTO content_versions (id, content_id, schema_version, content_json, uploaded_by, created_at, updated_at)
             VALUES (?, ?, '1.0', ?, 'u_hq_admin', ?, ?)`,
            [versionId, contentId, contentJson, now, now]
          );
        }
        inserted++;
        summaryByLevel[lvKey].insert++;
        process.stdout.write('I');
      }
    } catch (err) {
      console.error(`\n  실패 [${filename}]: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n\n=== ${EXECUTE ? '완료' : 'DRY-RUN 결과'} ===`);
  console.log(`UPDATE 매칭: ${updated}개`);
  console.log(`INSERT 신규: ${inserted}개`);
  console.log(`실패: ${failed}개`);
  console.log(`총: ${updated + inserted}개\n`);

  console.log('레벨·모드별 집계:');
  const rows = Object.keys(summaryByLevel).sort().map(k => ({
    'level_mode': k,
    'UPDATE': summaryByLevel[k].update,
    'INSERT': summaryByLevel[k].insert,
  }));
  console.table(rows);

  if (!EXECUTE) {
    console.log('\n※ DRY-RUN 모드 — DB 변경 없음. 실제 적용은 --execute 플래그 필요:');
    console.log('  node scripts/replace-logic-content.js --execute');
  }

  await conn.end();
  server.close();
  sshClient.end();
}

main().catch(err => {
  console.error('치명적 에러:', err.message);
  process.exit(1);
});
