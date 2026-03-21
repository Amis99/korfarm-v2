/**
 * 프로 모드 콘텐츠 임포트 스크립트
 * - contents + content_versions 삽입
 * - pro_chapters 생성
 * - pro_chapter_items 생성
 * - test_papers + test_questions + pro_chapter_tests 생성
 */
const mysql = require('mysql2/promise');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');

const GEN_DIR = path.join(__dirname, '..', 'generated');

// SSH/DB 설정
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

// ID 생성 (백엔드 IdGenerator.newId 호환)
function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
}

// 레벨 파일 순서
const LEVEL_FILES = [
  'saussure_1', 'saussure_2', 'saussure_3',
  'frege_1', 'frege_2', 'frege_3',
  'russell_1', 'russell_2', 'russell_3'
];

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
  console.log('=== 프로 모드 콘텐츠 임포트 시작 ===\n');

  // 1. SSH 터널 생성
  console.log('1. SSH 터널 생성 중...');
  const { sshClient, server, localPort } = await createSshTunnel();

  // 2. DB 연결
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
    // pro_chapter_items의 (chapter_id, type) 2컬럼 유니크 제약 제거
    // V0025는 (chapter_id, type, item_order)로 변경해야 함
    try {
      console.log('pro_chapter_items 유니크 제약 확인 중...');
      const [allIdx] = await conn.execute("SHOW INDEX FROM pro_chapter_items WHERE Non_unique = 0 AND Key_name != 'PRIMARY'");
      // (chapter_id, type)만의 2컬럼 유니크 인덱스 찾아서 삭제
      const uniqueNames = [...new Set(allIdx.map(r => r.Key_name))];
      for (const keyName of uniqueNames) {
        const cols = allIdx.filter(r => r.Key_name === keyName).sort((a,b) => a.Seq_in_index - b.Seq_in_index).map(r => r.Column_name);
        const colStr = cols.join(',');
        console.log(`  인덱스 ${keyName}: (${colStr})`);
        // 2컬럼짜리 (chapter_id, type) 제거
        if (colStr === 'chapter_id,type') {
          console.log(`  → 삭제: ${keyName}`);
          await conn.execute(`ALTER TABLE pro_chapter_items DROP INDEX \`${keyName}\``);
        }
      }
      // (chapter_id, type, item_order) 인덱스 확인/생성
      const [afterIdx] = await conn.execute("SHOW INDEX FROM pro_chapter_items WHERE Non_unique = 0 AND Key_name != 'PRIMARY'");
      const afterNames = [...new Set(afterIdx.map(r => r.Key_name))];
      let has3col = false;
      for (const keyName of afterNames) {
        const cols = afterIdx.filter(r => r.Key_name === keyName).sort((a,b) => a.Seq_in_index - b.Seq_in_index).map(r => r.Column_name);
        if (cols.join(',') === 'chapter_id,type,item_order') has3col = true;
      }
      if (!has3col) {
        console.log('  → uk_chapter_type_order 생성');
        await conn.execute("ALTER TABLE pro_chapter_items ADD CONSTRAINT uk_chapter_type_order UNIQUE (chapter_id, type, item_order)");
      }
      // label 컬럼 확인/추가
      try { await conn.execute("ALTER TABLE pro_chapter_items ADD COLUMN label VARCHAR(200) NULL AFTER item_order"); } catch(e) { /* 이미 존재 */ }
      // mode 컬럼 확인/추가
      try { await conn.execute("ALTER TABLE pro_test_sessions ADD COLUMN mode VARCHAR(20) NOT NULL DEFAULT 'print' AFTER chapter_test_id"); } catch(e) { /* 이미 존재 */ }
      console.log('유니크 제약 설정 완료\n');
    } catch(e) {
      console.log('유니크 제약 확인 중 오류:', e.message);
    }

    // 기존 데이터 확인
    const [existingContents] = await conn.execute("SELECT COUNT(*) as cnt FROM contents WHERE content_type LIKE 'PRO_%'");
    const [existingChapters] = await conn.execute("SELECT COUNT(*) as cnt FROM pro_chapters");
    if (existingContents[0].cnt > 0 || existingChapters[0].cnt > 0) {
      console.log(`기존 데이터 발견: 콘텐츠 ${existingContents[0].cnt}개, 챕터 ${existingChapters[0].cnt}개`);
      console.log('기존 데이터를 삭제하고 새로 삽입합니다...');
      // 테스트 관련 삭제
      await conn.execute("DELETE FROM test_answer_keys WHERE test_id IN (SELECT test_paper_id FROM pro_chapter_tests)");
      await conn.execute("DELETE FROM test_questions WHERE test_id IN (SELECT test_paper_id FROM pro_chapter_tests)");
      await conn.execute("DELETE FROM test_papers WHERE id IN (SELECT test_paper_id FROM pro_chapter_tests)");
      await conn.execute("DELETE FROM pro_chapter_tests");
      await conn.execute("DELETE FROM pro_chapter_items");
      await conn.execute("DELETE FROM pro_chapters");
      await conn.execute("DELETE FROM content_versions WHERE content_id IN (SELECT id FROM contents WHERE content_type LIKE 'PRO_%')");
      await conn.execute("DELETE FROM contents WHERE content_type LIKE 'PRO_%'");
      console.log('기존 데이터 삭제 완료\n');
    }

    // ========== STEP 1: 콘텐츠 임포트 ==========
    console.log('2. 콘텐츠 임포트 중...');
    const idMapping = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'id-mapping.json'), 'utf8'));

    // generatedId 기반 빠른 조회용 맵 구성
    const genIdLookup = {};
    for (const entry of idMapping) {
      genIdLookup[entry.generatedId] = entry;
    }

    // 배치 아이템에서 generatedId를 구성하는 헬퍼
    function buildGeneratedId(item, levelFile) {
      const lf = levelFile;
      const ch = item.dayIndex;
      switch (item.contentType) {
        case 'PRO_READING':  return `pro_read_${lf}_ch${ch}_${item.subArea}`;
        case 'PRO_VOCAB':    return `pro_vocab_${lf}_ch${ch}`;
        case 'PRO_BACKGROUND': return `pro_bg_${lf}_ch${ch}`;
        case 'PRO_LOGIC':    return `pro_logic_${lf}_ch${ch}`;
        case 'PRO_ANSWER':   return `pro_answer_${lf}_ch${ch}`;
        default:             return null;
      }
    }

    // generatedId → content_UUID 매핑 저장
    const contentIdMap = {};
    let totalImported = 0;

    for (const levelFile of LEVEL_FILES) {
      const levelId = levelFile.replace(/_/g, '');
      const batchData = JSON.parse(fs.readFileSync(path.join(GEN_DIR, `batch-import-${levelFile}.json`), 'utf8'));

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      for (let i = 0; i < batchData.items.length; i++) {
        const item = batchData.items[i];
        const generatedId = buildGeneratedId(item, levelFile);
        const contentId = newId('content');
        const versionId = newId('cv');

        // generatedId → contentId 매핑 저장
        if (generatedId) {
          contentIdMap[generatedId] = contentId;
        }

        // contents 테이블 삽입
        const title = item.content?.title || `${levelId} ${item.contentType} ${item.dayIndex}`;
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

        totalImported++;
      }
      console.log(`  ${levelFile}: ${batchData.items.length}개 완료`);
    }
    console.log(`콘텐츠 임포트 완료: 총 ${totalImported}개\n`);

    // ========== STEP 2: 프로 챕터 생성 ==========
    console.log('3. 프로 챕터 생성 중...');
    const chapters = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'chapters-setup.json'), 'utf8'));
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    for (const ch of chapters) {
      await conn.execute(
        `INSERT INTO pro_chapters (id, level_id, book_number, chapter_number, global_chapter_number, title, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        [ch.chapterId, ch.levelId, ch.bookNumber, ch.chapterNumber, ch.globalChapterNumber, ch.title, now, now]
      );
    }
    console.log(`챕터 생성 완료: ${chapters.length}개\n`);

    // ========== STEP 3: 챕터 아이템 설정 ==========
    console.log('4. 챕터 아이템 설정 중...');
    let totalItems = 0;

    for (const ch of chapters) {
      for (const item of ch.items) {
        const itemId = newId('pci');
        let resolvedContentId = null;

        if (item.contentId) {
          resolvedContentId = contentIdMap[item.contentId] || null;
          if (!resolvedContentId) {
            console.error(`  경고: ${ch.chapterId} - ${item.type} 매핑 실패: ${item.contentId}`);
          }
        }

        await conn.execute(
          `INSERT INTO pro_chapter_items (id, chapter_id, type, content_id, item_order, label, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [itemId, ch.chapterId, item.type, resolvedContentId, item.order, item.label || null, now, now]
        );
        totalItems++;
      }
    }
    console.log(`챕터 아이템 설정 완료: ${totalItems}개\n`);

    // ========== STEP 4: 테스트 임포트 ==========
    console.log('5. 테스트 임포트 중...');
    const tests = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'tests-setup.json'), 'utf8'));
    let testCount = 0;

    for (const test of tests) {
      // test_papers 생성
      const paperId = newId('tp');
      const totalQuestions = test.questions.length;
      const totalPoints = test.questions.reduce((s, q) => s + (q.points || 0), 0);

      await conn.execute(
        `INSERT INTO test_papers (id, org_id, title, pdf_file_id, status, level_id, series, total_questions, total_points, created_at, updated_at)
         VALUES (?, 'org_hq', ?, '', 'open', ?, 'chapter', ?, ?, ?, ?)`,
        [paperId, test.title, test.levelId, totalQuestions, totalPoints, now, now]
      );

      // test_questions 생성
      for (const q of test.questions) {
        const qId = newId('tq');
        await conn.execute(
          `INSERT INTO test_questions (id, test_id, number, type, domain, points, correct_answer, choices_json, choice_explanations_json, passage, model_answer, essay_keywords_json, essay_rubric_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [qId, paperId, q.number || 0, q.type || '객관식', q.domain || null, q.points || 0,
           q.correctAnswer || null, JSON.stringify(q.choices || []), JSON.stringify(q.choiceExplanations || {}), q.passage || null,
           q.modelAnswer || null, q.essayKeywords ? JSON.stringify(q.essayKeywords) : null, q.essayRubric || null, now]
        );
      }

      // test_answer_keys 생성
      const answersJson = {};
      for (const q of test.questions) {
        answersJson[String(q.number)] = q.correctAnswer;
      }
      const akId = newId('tak');
      await conn.execute(
        `INSERT INTO test_answer_keys (id, test_id, answers_json, created_by, created_at, updated_at)
         VALUES (?, ?, ?, 'u_hq_admin', ?, ?)`,
        [akId, paperId, JSON.stringify(answersJson), now, now]
      );

      // pro_chapter_tests 생성
      const pctId = newId('pct');
      await conn.execute(
        `INSERT INTO pro_chapter_tests (id, chapter_id, version, test_paper_id, status, created_at, updated_at)
         VALUES (?, ?, 1, ?, 'active', ?, ?)`,
        [pctId, test.chapterId, paperId, now, now]
      );

      testCount++;
    }
    console.log(`테스트 임포트 완료: ${testCount}개\n`);

    // ========== 검증 ==========
    console.log('6. 검증 중...');
    const [cntContents] = await conn.execute("SELECT COUNT(*) as cnt FROM contents WHERE content_type LIKE 'PRO_%'");
    const [cntVersions] = await conn.execute("SELECT COUNT(*) as cnt FROM content_versions WHERE content_id LIKE 'content_%' AND uploaded_by = 'u_hq_admin'");
    const [cntChapters] = await conn.execute("SELECT COUNT(*) as cnt FROM pro_chapters");
    const [cntItems] = await conn.execute("SELECT COUNT(*) as cnt FROM pro_chapter_items");
    const [cntTests] = await conn.execute("SELECT COUNT(*) as cnt FROM pro_chapter_tests");
    const [cntPapers] = await conn.execute("SELECT COUNT(*) as cnt FROM test_papers WHERE series = 'chapter'");

    console.log(`  contents: ${cntContents[0].cnt}`);
    console.log(`  content_versions: ${cntVersions[0].cnt}`);
    console.log(`  pro_chapters: ${cntChapters[0].cnt}`);
    console.log(`  pro_chapter_items: ${cntItems[0].cnt}`);
    console.log(`  pro_chapter_tests: ${cntTests[0].cnt}`);
    console.log(`  test_papers (chapter): ${cntPapers[0].cnt}`);

    // 매핑 안 된 항목 확인
    const [unmapped] = await conn.execute("SELECT COUNT(*) as cnt FROM pro_chapter_items WHERE content_id IS NULL AND type != 'test'");
    if (unmapped[0].cnt > 0) {
      console.log(`\n  경고: content_id가 NULL인 non-test 아이템 ${unmapped[0].cnt}개`);
    }

    console.log('\n=== 임포트 완료 ===');

  } finally {
    await conn.end();
    server.close();
    sshClient.end();
  }
}

main().catch(err => {
  console.error('임포트 실패:', err);
  process.exit(1);
});
