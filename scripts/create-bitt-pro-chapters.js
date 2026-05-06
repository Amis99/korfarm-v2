/**
 * 비트겐슈타인 PRO 챕터 생성 (Phase E)
 *
 * 동작:
 *  - pro_chapters 60건 INSERT (wittgenstein1/2/3 × 챕터 1~20)
 *  - pro_chapter_items type='logic' 60건 INSERT (PRO_LOGIC content_id 매핑)
 *  - 다른 type(reading/vocab/background/answer/manuscript)은 콘텐츠 자체가 비트에 없어 미생성
 *
 * 모범 패턴: scripts/import-pro-content.js
 *  - pro_chapters: id=pch_wittgenstein_{N}_{NN}, level_id=wittgenstein{N},
 *                  book_number={N}, chapter_number=1~20,
 *                  global_chapter_number=181~240 (기존 max=180), title='비트겐슈타인{N} {ch}장'
 *  - pro_chapter_items: id=pci_<uuid>, chapter_id=...,
 *                       type='logic', content_id=PRO_LOGIC.id, item_order=12 (모범 패턴 동일)
 *
 * 실행:
 *   node scripts/create-bitt-pro-chapters.js           # dry-run
 *   node scripts/create-bitt-pro-chapters.js --execute # 실제 INSERT
 */
const mysql = require('mysql2/promise');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');

const EXECUTE = process.argv.includes('--execute');

const SSH_CONFIG = {
  host: '43.200.104.102', port: 22, username: 'ec2-user',
  privateKey: fs.readFileSync(path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'korfarm-ec2.pem'))
};
const DB_CONFIG = {
  host: 'korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com',
  port: 3306, user: 'admin', password: 'xXoM4Ld7VAIYl9W874md5kic', database: 'korfarm'
};

function newId(prefix) { return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`; }

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
  console.log(`=== 비트 PRO 챕터 생성 (${EXECUTE ? 'EXECUTE' : 'DRY-RUN'}) ===\n`);

  const { sshClient, server, localPort } = await createSshTunnel();
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: localPort,
    user: DB_CONFIG.user, password: DB_CONFIG.password, database: DB_CONFIG.database, charset: 'utf8mb4'
  });

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // 비트 PRO_LOGIC 60건 매핑 사전 로드
  const [logicRows] = await conn.execute(
    `SELECT id, level_id, day_index FROM contents
     WHERE content_type = 'PRO_LOGIC' AND level_id LIKE 'wittgenstein%'
     ORDER BY level_id, day_index`
  );
  console.log(`PRO_LOGIC 비트 콘텐츠: ${logicRows.length}건 로드`);
  if (logicRows.length !== 60) {
    console.error(`  경고: 60건이 아님 (${logicRows.length}건)`);
  }
  const logicMap = {};
  for (const r of logicRows) logicMap[`${r.level_id}_${r.day_index}`] = r.id;

  // 기존 비트 챕터 확인
  const [existing] = await conn.execute(
    `SELECT id, level_id, chapter_number FROM pro_chapters WHERE level_id LIKE 'wittgenstein%'`
  );
  const existingSet = new Set(existing.map(r => `${r.level_id}_${r.chapter_number}`));
  console.log(`기존 비트 챕터: ${existing.length}건`);

  // 글로벌 챕터 번호 시작 = 기존 max + 1
  const [maxRow] = await conn.execute(`SELECT MAX(global_chapter_number) AS mx FROM pro_chapters`);
  const baseGlobal = (maxRow[0].mx || 0);
  console.log(`현재 max global_chapter_number = ${baseGlobal} → 비트 시작 = ${baseGlobal + 1}\n`);

  let chaptersInserted = 0, itemsInserted = 0, skipped = 0;
  const inserts = [];

  let globalCounter = baseGlobal;
  for (let book = 1; book <= 3; book++) {
    const levelId = `wittgenstein${book}`;
    for (let ch = 1; ch <= 20; ch++) {
      globalCounter++;
      const key = `${levelId}_${ch}`;
      if (existingSet.has(key)) { skipped++; continue; }

      const chapterId = `pch_wittgenstein_${book}_${String(ch).padStart(2, '0')}`;
      const title = `비트겐슈타인${book} ${ch}장`;
      const logicContentId = logicMap[`${levelId}_${ch}`] || null;
      const pciId = newId('pci');

      inserts.push({ chapterId, levelId, book, ch, globalNum: globalCounter, title, logicContentId, pciId });

      if (EXECUTE) {
        await conn.execute(
          `INSERT INTO pro_chapters (id, level_id, book_number, chapter_number, global_chapter_number, title, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
          [chapterId, levelId, book, ch, globalCounter, title, now, now]
        );
        chaptersInserted++;

        if (logicContentId) {
          await conn.execute(
            `INSERT INTO pro_chapter_items (id, chapter_id, type, content_id, item_order, label, created_at, updated_at)
             VALUES (?, ?, 'logic', ?, 12, NULL, ?, ?)`,
            [pciId, chapterId, logicContentId, now, now]
          );
          itemsInserted++;
        }
        process.stdout.write('C');
      } else {
        chaptersInserted++;
        if (logicContentId) itemsInserted++;
      }
    }
  }

  console.log(`\n\n=== ${EXECUTE ? '완료' : 'DRY-RUN 결과'} ===`);
  console.log(`챕터 INSERT: ${chaptersInserted}개`);
  console.log(`logic 아이템 INSERT: ${itemsInserted}개`);
  console.log(`기존 존재로 건너뜀: ${skipped}개\n`);

  console.log('샘플 5건:');
  console.table(inserts.slice(0, 5).map(x => ({
    chapter_id: x.chapterId, level: x.levelId, book: x.book, ch: x.ch, global: x.globalNum, title: x.title,
    logic_content: x.logicContentId ? x.logicContentId.slice(0, 20) + '...' : '(없음)'
  })));

  if (!EXECUTE) {
    console.log('\n※ DRY-RUN 모드 — DB 변경 없음. 실제 적용은 --execute 플래그 필요.');
  }

  await conn.end();
  server.close();
  sshClient.end();
}

main().catch(err => { console.error('치명적 에러:', err.message); process.exit(1); });
