/**
 * 프로모드 어휘(PRO_VOCAB) 콘텐츠 DB 업데이트 스크립트
 * - generated/pro-vocab/*.json 파일을 읽어서 DB의 content_versions.content_json을 업데이트
 * - SSH 터널을 통해 RDS에 접속
 */
const mysql = require('mysql2/promise');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');

const GEN_DIR = path.join(__dirname, '..', 'generated', 'pro-vocab');

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

// targetLevel → level_id 매핑
const LEVEL_MAP = {
  saussure1: 'saussure1', saussure2: 'saussure2', saussure3: 'saussure3',
  frege1: 'frege1', frege2: 'frege2', frege3: 'frege3',
  russell1: 'russell1', russell2: 'russell2', russell3: 'russell3',
};

// 파일명에서 챕터 번호 추출
function parseFilename(filename) {
  const m = filename.match(/^(\w+)_ch(\d+)\.json$/);
  if (!m) return null;
  const levelCode = m[1]; // saussure1, frege2, russell3
  const chapter = parseInt(m[2], 10);
  return { levelCode, chapter };
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
      server.listen(0, '127.0.0.1', () => {
        resolve({ sshClient, server, localPort: server.address().port });
      });
    });
    sshClient.on('error', reject);
    sshClient.connect(SSH_CONFIG);
  });
}

async function main() {
  console.log('=== 프로모드 어휘(VOCAB) DB 업데이트 시작 ===\n');

  // 1. 파일 목록 수집
  const files = fs.readdirSync(GEN_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('SKILLS') && !f.startsWith('dict-'))
    .sort();
  console.log(`대상 파일: ${files.length}개\n`);

  // 2. SSH 터널
  console.log('SSH 터널 생성 중...');
  const { sshClient, server, localPort } = await createSshTunnel();
  console.log(`SSH 터널 열림: 127.0.0.1:${localPort}\n`);

  // 3. DB 연결
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: localPort,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    database: DB_CONFIG.database,
    charset: 'utf8mb4'
  });
  console.log('DB 연결 성공\n');

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  let updated = 0, inserted = 0, failed = 0;

  for (const filename of files) {
    const parsed = parseFilename(filename);
    if (!parsed) { console.log(`  건너뜀: ${filename}`); continue; }

    const { levelCode, chapter } = parsed;
    const levelId = LEVEL_MAP[levelCode];
    if (!levelId) { console.log(`  레벨 매핑 없음: ${levelCode}`); continue; }

    const content = JSON.parse(fs.readFileSync(path.join(GEN_DIR, filename), 'utf-8'));
    const contentJson = JSON.stringify(content);

    try {
      // 기존 콘텐츠 찾기
      const [rows] = await conn.execute(
        `SELECT c.id, cv.id as version_id
         FROM contents c
         JOIN content_versions cv ON cv.content_id = c.id
         WHERE c.content_type = 'PRO_VOCAB'
           AND c.level_id = ?
           AND c.day_index = ?
         ORDER BY cv.created_at DESC LIMIT 1`,
        [levelId, chapter]
      );

      if (rows.length > 0) {
        // 기존 콘텐츠 업데이트
        await conn.execute(
          `UPDATE content_versions SET content_json = ?, updated_at = ? WHERE id = ?`,
          [contentJson, now, rows[0].version_id]
        );
        updated++;
        process.stdout.write('U');
      } else {
        // 새 콘텐츠 삽입
        const contentId = newId('content');
        const versionId = newId('cv');

        await conn.execute(
          `INSERT INTO contents (id, content_type, level_id, title, status, area, sub_area, day_index, module_key, created_at, updated_at)
           VALUES (?, 'PRO_VOCAB', ?, ?, 'active', 'VOCAB', 'PRO', ?, 'vocab', ?, ?)`,
          [contentId, levelId, content.title, chapter, now, now]
        );

        await conn.execute(
          `INSERT INTO content_versions (id, content_id, schema_version, content_json, uploaded_by, created_at, updated_at)
           VALUES (?, ?, '1.0', ?, 'u_hq_admin', ?, ?)`,
          [versionId, contentId, contentJson, now, now]
        );
        inserted++;
        process.stdout.write('I');
      }
    } catch (err) {
      console.error(`\n  실패 [${filename}]: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n\n=== 완료 ===`);
  console.log(`업데이트: ${updated}개, 새로 삽입: ${inserted}개, 실패: ${failed}개`);
  console.log(`총: ${updated + inserted}개 처리`);

  await conn.end();
  server.close();
  sshClient.end();
}

main().catch(err => {
  console.error('치명적 에러:', err.message);
  process.exit(1);
});
