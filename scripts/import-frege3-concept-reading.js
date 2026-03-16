/**
 * 프레게3 개념 reading 8개 추가 삽입 스크립트
 * - 기존 데이터를 건드리지 않고 8개만 INSERT
 */
const mysql = require('mysql2/promise');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');

const GEN_DIR = path.join(__dirname, '..', 'generated');

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
        const localPort = server.address().port;
        console.log(`SSH 터널 열림: 127.0.0.1:${localPort} → RDS:3306`);
        resolve({ sshClient, server, localPort });
      });
    });
    sshClient.on('error', reject);
    sshClient.connect(SSH_CONFIG);
  });
}

async function main() {
  console.log('=== 프레게3 개념 reading 8개 추가 삽입 ===\n');

  // 배치 파일 로드
  const batchPath = path.join(GEN_DIR, 'batch-import-frege_3-concept-reading.json');
  const batchData = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  console.log(`배치 파일 로드: ${batchData.items.length}개 항목\n`);

  // SSH 터널 생성
  console.log('1. SSH 터널 생성 중...');
  const { sshClient, server, localPort } = await createSshTunnel();

  // DB 연결
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: localPort,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    database: DB_CONFIG.database,
    charset: 'utf8mb4'
  });
  console.log('DB 연결 성공\n');

  try {
    // 삽입 전 현황 확인
    const [before] = await conn.execute(
      "SELECT COUNT(*) as cnt FROM contents WHERE content_type = 'PRO_READING' AND level_id = 'FREGE_3'"
    );
    console.log(`삽입 전 FREGE_3 PRO_READING 수: ${before[0].cnt}\n`);

    // 중복 확인 — 이미 개념 reading이 있는지 체크
    const [existing] = await conn.execute(
      "SELECT day_index FROM contents WHERE content_type = 'PRO_READING' AND level_id = 'FREGE_3' AND sub_area = '개념'"
    );
    const existingDays = new Set(existing.map(r => r.day_index));
    if (existingDays.size > 0) {
      console.log(`이미 존재하는 개념 reading day_index: ${[...existingDays].join(', ')}`);
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let inserted = 0;

    for (const item of batchData.items) {
      // 중복 건너뛰기
      if (existingDays.has(item.dayIndex)) {
        console.log(`  건너뜀: dayIndex=${item.dayIndex} (이미 존재)`);
        continue;
      }

      const contentId = newId('content');
      const versionId = newId('cv');
      const title = item.content?.title || `FREGE_3 개념 독해 ${item.dayIndex}`;

      // contents 테이블 삽입
      await conn.execute(
        `INSERT INTO contents (id, content_type, level_id, title, status, area, sub_area, day_index, module_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)`,
        [contentId, item.contentType, item.levelId, title, item.area || null, item.subArea || null,
         item.dayIndex || null, item.moduleKey || null, now, now]
      );

      // content_versions 테이블 삽입
      await conn.execute(
        `INSERT INTO content_versions (id, content_id, schema_version, content_json, uploaded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'u_hq_admin', ?, ?)`,
        [versionId, contentId, item.schemaVersion || '1.0', JSON.stringify(item.content), now, now]
      );

      inserted++;
      console.log(`  삽입: dayIndex=${item.dayIndex}, contentId=${contentId}, title=${title}`);
    }

    console.log(`\n삽입 완료: ${inserted}개\n`);

    // 삽입 후 현황 확인
    const [after] = await conn.execute(
      "SELECT COUNT(*) as cnt FROM contents WHERE content_type = 'PRO_READING' AND level_id = 'FREGE_3'"
    );
    console.log(`삽입 후 FREGE_3 PRO_READING 수: ${after[0].cnt}`);

    // sub_area 별 카운트
    const [breakdown] = await conn.execute(
      "SELECT sub_area, COUNT(*) as cnt FROM contents WHERE content_type = 'PRO_READING' AND level_id = 'FREGE_3' GROUP BY sub_area ORDER BY sub_area"
    );
    console.log('\nsub_area별 분포:');
    for (const row of breakdown) {
      console.log(`  ${row.sub_area}: ${row.cnt}개`);
    }

  } finally {
    await conn.end();
    server.close();
    sshClient.end();
    console.log('\n연결 종료');
  }
}

main().catch(err => {
  console.error('오류:', err);
  process.exit(1);
});
