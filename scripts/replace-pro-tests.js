/**
 * 프로 모드 테스트 문항 교체 스크립트
 * - generated/pro-tests/ 폴더의 180개 JSON 파일로 기존 DB 문항을 전량 교체
 * - 기존 테스트가 있으면: test_questions, test_answer_keys 삭제 후 재삽입
 * - 기존 테스트가 없으면: test_papers + pro_chapter_tests + test_questions + test_answer_keys 신규 생성
 */
const mysql = require('mysql2/promise');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');

const PRO_TESTS_DIR = path.join(__dirname, '..', 'generated', 'pro-tests');

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

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
}

// 레벨 한국어 이름
const LEVEL_KO = {
  saussure1: '소쉬르1', saussure2: '소쉬르2', saussure3: '소쉬르3',
  frege1: '프레게1', frege2: '프레게2', frege3: '프레게3',
  russell1: '러셀1', russell2: '러셀2', russell3: '러셀3',
};

function parseFilename(filename) {
  // saussure1_ch01.json → level='saussure1', chNum='01'
  const m = filename.match(/^([a-z]+)(\d)_ch(\d{2})\.json$/);
  if (!m) return null;
  const levelName = m[1];    // saussure, frege, russell
  const levelNum = m[2];     // 1, 2, 3
  const chNum = m[3];        // 01~20
  const levelId = `${levelName}${levelNum}`;
  // DB 형식: pch_saussure_1_01 (레벨명_번호_챕터번호)
  const chapterId = `pch_${levelName}_${levelNum}_${chNum}`;
  const chInt = parseInt(chNum, 10);
  const title = `${LEVEL_KO[levelId]} ${chInt}장 테스트`;
  return { levelName, levelNum, chNum, chapterId, levelId, title };
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

async function insertQuestions(conn, testPaperId, questions, now) {
  for (const q of questions) {
    const qId = newId('tq');
    await conn.execute(
      `INSERT INTO test_questions (id, test_id, number, type, domain, points, correct_answer, choices_json, choice_explanations_json, passage, stem, model_answer, essay_keywords_json, essay_rubric_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        qId, testPaperId, q.number || 0, q.type || '객관식', q.domain || null, q.points || 0,
        q.correctAnswer || null,
        JSON.stringify(q.choices || []),
        JSON.stringify(q.choiceExplanations || {}),
        q.passage || null,
        q.stem || null,
        q.modelAnswer || null,
        q.essayKeywords ? JSON.stringify(q.essayKeywords) : null,
        q.essayRubric || null,
        now
      ]
    );
  }
}

async function insertAnswerKey(conn, testPaperId, questions, now) {
  const answersJson = {};
  for (const q of questions) {
    answersJson[String(q.number)] = q.correctAnswer;
  }
  const akId = newId('tak');
  await conn.execute(
    `INSERT INTO test_answer_keys (id, test_id, answers_json, created_by, created_at, updated_at)
     VALUES (?, ?, ?, 'u_hq_admin', ?, ?)`,
    [akId, testPaperId, JSON.stringify(answersJson), now, now]
  );
}

async function main() {
  console.log('=== 프로 모드 테스트 문항 교체 시작 ===\n');

  const files = fs.readdirSync(PRO_TESTS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();
  console.log(`대상 파일: ${files.length}개\n`);

  console.log('1. SSH 터널 생성 중...');
  const { sshClient, server, localPort } = await createSshTunnel();

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: localPort,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    database: DB_CONFIG.database,
    charset: 'utf8mb4'
  });
  console.log('DB 연결 완료\n');

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  let replaceCount = 0;
  let createCount = 0;
  let skipCount = 0;
  let totalQuestionsInserted = 0;

  for (const file of files) {
    const meta = parseFilename(file);
    if (!meta) {
      console.log(`  건너뜀 (파일명 파싱 실패): ${file}`);
      skipCount++;
      continue;
    }

    const testData = JSON.parse(fs.readFileSync(path.join(PRO_TESTS_DIR, file), 'utf8'));
    const questions = testData.questions || [];
    if (questions.length === 0) {
      console.log(`  건너뜀 (문항 없음): ${file}`);
      skipCount++;
      continue;
    }

    const totalPoints = questions.reduce((s, q) => s + (q.points || 0), 0);

    // 기존 pro_chapter_tests 조회
    const [rows] = await conn.execute(
      `SELECT pct.test_paper_id FROM pro_chapter_tests pct WHERE pct.chapter_id = ? AND pct.status = 'active' LIMIT 1`,
      [meta.chapterId]
    );

    let testPaperId;

    if (rows.length > 0) {
      // === 기존 테스트 교체 ===
      testPaperId = rows[0].test_paper_id;
      await conn.execute(`DELETE FROM test_questions WHERE test_id = ?`, [testPaperId]);
      await conn.execute(`DELETE FROM test_answer_keys WHERE test_id = ?`, [testPaperId]);

      await insertQuestions(conn, testPaperId, questions, now);
      await insertAnswerKey(conn, testPaperId, questions, now);

      await conn.execute(
        `UPDATE test_papers SET total_questions = ?, total_points = ?, updated_at = ? WHERE id = ?`,
        [questions.length, totalPoints, now, testPaperId]
      );

      replaceCount++;
      totalQuestionsInserted += questions.length;
      console.log(`  ↻ 교체 ${meta.chapterId}: ${questions.length}문항, ${totalPoints}점`);

    } else {
      // === 신규 테스트 생성 ===
      testPaperId = newId('tp');

      // test_papers 생성
      await conn.execute(
        `INSERT INTO test_papers (id, org_id, title, pdf_file_id, status, level_id, series, total_questions, total_points, created_at, updated_at)
         VALUES (?, 'org_hq', ?, '', 'open', ?, 'chapter', ?, ?, ?, ?)`,
        [testPaperId, meta.title, meta.levelId, questions.length, totalPoints, now, now]
      );

      // test_questions 생성
      await insertQuestions(conn, testPaperId, questions, now);

      // test_answer_keys 생성
      await insertAnswerKey(conn, testPaperId, questions, now);

      // pro_chapter_tests 생성
      const pctId = newId('pct');
      await conn.execute(
        `INSERT INTO pro_chapter_tests (id, chapter_id, version, test_paper_id, status, created_at, updated_at)
         VALUES (?, ?, 1, ?, 'active', ?, ?)`,
        [pctId, meta.chapterId, testPaperId, now, now]
      );

      createCount++;
      totalQuestionsInserted += questions.length;
      console.log(`  ＋ 신규 ${meta.chapterId}: ${questions.length}문항, ${totalPoints}점`);
    }
  }

  console.log(`\n=== 완료 ===`);
  console.log(`교체: ${replaceCount}개 챕터`);
  console.log(`신규: ${createCount}개 챕터`);
  console.log(`건너뜀: ${skipCount}개`);
  console.log(`총 삽입 문항: ${totalQuestionsInserted}개`);

  await conn.end();
  server.close();
  sshClient.end();
}

main().catch(err => {
  console.error('오류:', err);
  process.exit(1);
});
