#!/usr/bin/env node
/**
 * 프레게 진단 테스트 Claude 수동 분석 결과를 DB에 적용.
 *
 * 적용 범위:
 *  - test_papers.payload_json (1행) — PDF·어드민 비주얼 에디터
 *  - diag_questions.choices_json (48행) — 학생 응시 채점·약점 누적
 *
 * 정책:
 *  - 전체 덮어쓰기 (사용자 확정).
 *  - 비파괴: DELETE/TRUNCATE 없음. UPDATE 만.
 *  - 트랜잭션: 실패 시 롤백.
 *
 * 사용:
 *   node scripts/apply-russell-analysis.mjs              # dry-run (변경 없음)
 *   node scripts/apply-russell-analysis.mjs --apply-db   # 실제 적용
 */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const GEN = path.join(ROOT, 'generated');

const args = {};
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (!m) continue;
  args[m[1]] = m[2] ?? true;
}
const APPLY_DB = args['apply-db'] === true || args['apply-db'] === 'true';

function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }

function extractConfigValue(source, key) {
  const m = source.match(new RegExp(`${key}:\\s*(?:['"]([^'"]+)['"]|(\\d+))`));
  if (!m) throw new Error(`DB config key not found: ${key}`);
  return m[1] ?? m[2];
}
function readDbConfig() {
  const source = fs.readFileSync(path.join(ROOT, 'scripts', 'import-pro-content.js'), 'utf8');
  const block = source.match(/const DB_CONFIG = \{([\s\S]*?)\};/);
  if (!block) throw new Error('DB_CONFIG block not found.');
  const cs = block[1];
  return {
    host: extractConfigValue(cs, 'host'),
    port: Number(extractConfigValue(cs, 'port')) || 3306,
    user: extractConfigValue(cs, 'user'),
    password: extractConfigValue(cs, 'password'),
    database: extractConfigValue(cs, 'database'),
  };
}
function createTunnel(dbConfig) {
  return new Promise((resolve, reject) => {
    const ssh = new Client();
    const keyPath = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'korfarm-ec2.pem');
    ssh.on('ready', () => {
      const server = net.createServer((sock) => {
        ssh.forwardOut('127.0.0.1', 0, dbConfig.host, dbConfig.port, (err, stream) => {
          if (err) { sock.destroy(err); return; }
          sock.pipe(stream).pipe(sock);
        });
      });
      server.listen(0, '127.0.0.1', () => resolve({ ssh, server, localPort: server.address().port }));
    });
    ssh.on('error', reject);
    ssh.connect({
      host: '43.200.104.102', port: 22, username: 'ec2-user',
      privateKey: fs.readFileSync(keyPath),
    });
  });
}
async function closeTunnel(t) {
  await new Promise((r) => t.server.close(r));
  t.ssh.end();
}

// 0 이하 키 제거 (음수·0 가중치는 채점 부담 줄임)
function cleanVec(v) {
  return Object.fromEntries(Object.entries(v || {}).filter(([_, x]) => Number(x) > 0));
}

function buildUpdatedPayload(originalPayload, analysis) {
  // 깊은 복사 후 분석 메타 머지 (전체 덮어쓰기 정책)
  // 비주얼 에디터 UI 는 다음 필드를 읽음:
  //   - passage.domain (영역 코드 e.g. "READ") / passage.subDomain (세부영역 코드 e.g. "READ_SCIENCE")
  //   - question.domain / question.subDomain (동일)
  //   - choice.wrongVector (오답 선지 약점 벡터) / choice.wrongPattern (함정 패턴 코드)
  // 학생 채점은 diag_questions.choices_json 의 vector/error_path 별도 사용.
  const p = JSON.parse(JSON.stringify(originalPayload));

  if (Array.isArray(p.passages)) {
    for (const pas of p.passages) {
      const a = analysis.passages[pas.id];
      if (!a) continue;
      pas.domain = a.areaCode || a.domain;         // 영역 코드
      pas.subDomain = a.subAreaCode || null;        // 세부영역 코드 (한글 라벨 X)
      pas.theme = a.theme;                          // 주제 — 자유 텍스트
    }
  }
  if (Array.isArray(p.questions)) {
    for (const q of p.questions) {
      const a = analysis.questions[q.id];
      if (!a) continue;
      q.domain = a.areaCode || a.domain;            // 영역 코드
      q.subDomain = a.subAreaCode || null;          // 세부영역 코드
      q.questionType = a.questionType;
      q.competencyVector = a.competencyVector;
      q.intent = a.intent;
      q.explanation = a.explanation;
      q.choiceExplanations = a.choiceExplanations;
      q.wrongPattern = a.wrongPattern;

      // choices[] — 비주얼 에디터·학생 채점·PDF 모두 호환되도록 4개 필드 박음
      const correctId = q.answerId;
      if (Array.isArray(q.choices)) {
        for (const c of q.choices) {
          const cid = c.id;
          if (cid === correctId) {
            // 정답 선지
            c.vector = cleanVec(a.competencyVector);
            c.errorPath = '정답';
            c.wrongVector = {};                      // 비주얼 에디터 정답 선지는 약점 없음
            c.wrongPattern = null;
          } else {
            // 오답 선지
            const wv = cleanVec(a.choiceWrongVectors[cid] || {});
            const wp = a.wrongPattern[cid] || null;
            c.vector = wv;                           // 학생 채점용 (diag 와 호환)
            c.errorPath = wp;
            c.wrongVector = wv;                      // 비주얼 에디터 모달 표시용
            c.wrongPattern = wp;                     // 비주얼 에디터 드롭다운 표시용
          }
        }
      }
    }
  }
  return p;
}

function buildDiagChoicesJson(diagQuestion, analysis) {
  // 기존 choices_json 의 choice_id·text 유지, vector·error_path 만 분석 결과로 교체.
  const a = analysis.questions[diagQuestion.id];
  if (!a) return null;
  const correctChoice = diagQuestion.correct_choice;

  return diagQuestion.choices_json.map((c) => {
    const cid = c.choice_id;
    if (cid === correctChoice) {
      return { choice_id: cid, text: c.text, vector: cleanVec(a.competencyVector), error_path: '정답' };
    }
    const wv = a.choiceWrongVectors[cid] || {};
    return { choice_id: cid, text: c.text, vector: cleanVec(wv), error_path: a.wrongPattern[cid] || null };
  });
}

async function main() {
  fs.mkdirSync(GEN, { recursive: true });
  const runStamp = stamp();
  const analysis = JSON.parse(fs.readFileSync(path.join(GEN, 'russell_analysis_filled.json'), 'utf8'));
  console.log(`분석 결과 로드: passages=${Object.keys(analysis.passages).length}, questions=${Object.keys(analysis.questions).length}`);

  let tunnel = null, conn = null;
  try {
    const dbConfig = readDbConfig();
    tunnel = await createTunnel(dbConfig);
    conn = await mysql.createConnection({
      host: '127.0.0.1', port: tunnel.localPort,
      user: dbConfig.user, password: dbConfig.password, database: dbConfig.database,
      charset: 'utf8mb4',
    });

    // 현재 데이터 조회 + 백업
    const [paperRows] = await conn.execute(
      "SELECT id, payload_json FROM test_papers WHERE id = 'diag_paper_russell'",
    );
    if (paperRows.length === 0) throw new Error('test_papers diag_paper_russell 없음');
    const paper = paperRows[0];
    const originalPayload = typeof paper.payload_json === 'string' ? JSON.parse(paper.payload_json) : paper.payload_json;

    const [diagQRows] = await conn.execute(
      "SELECT id, passage_id, order_in_passage, correct_choice, choices_json FROM diag_questions WHERE tier = 'russell' ORDER BY passage_id, order_in_passage, id",
    );
    const diagQs = diagQRows.map((r) => ({
      ...r,
      choices_json: typeof r.choices_json === 'string' ? JSON.parse(r.choices_json) : r.choices_json,
    }));
    console.log(`DB 로드: test_papers 1행, diag_questions ${diagQs.length}행`);

    const backupPath = path.join(GEN, `russell_apply_backup_${runStamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify({ paper, diagQs }, null, 2), 'utf8');
    console.log(`백업 → ${backupPath}`);

    // 새 payload 구축
    const newPayload = buildUpdatedPayload(originalPayload, analysis);
    const newPayloadJson = JSON.stringify(newPayload);

    // 각 diag_question 의 새 choices_json 구축
    const diagUpdates = [];
    let skipped = 0;
    for (const q of diagQs) {
      const newChoices = buildDiagChoicesJson(q, analysis);
      if (!newChoices) { skipped++; continue; }
      diagUpdates.push({ id: q.id, choicesJson: JSON.stringify(newChoices) });
    }
    console.log(`diag_questions 업데이트 대상: ${diagUpdates.length}건, 분석 누락 skip: ${skipped}건`);

    const filledPath = path.join(GEN, `russell_payload_filled_${runStamp}.json`);
    fs.writeFileSync(filledPath, JSON.stringify(newPayload, null, 2), 'utf8');
    console.log(`갱신된 payload 미리보기 → ${filledPath}`);

    if (!APPLY_DB) {
      console.log('\n(dry-run — --apply-db 없으면 DB 변경 안 함)');
      return;
    }

    await conn.beginTransaction();
    try {
      const [r1] = await conn.execute(
        "UPDATE test_papers SET payload_json = ?, updated_at = NOW() WHERE id = 'diag_paper_russell'",
        [newPayloadJson],
      );
      console.log(`test_papers UPDATE: affected=${r1.affectedRows}`);

      let ok = 0;
      for (const u of diagUpdates) {
        const [r] = await conn.execute(
          'UPDATE diag_questions SET choices_json = ? WHERE id = ?',
          [u.choicesJson, u.id],
        );
        if (r.affectedRows > 0) ok++;
      }
      console.log(`diag_questions UPDATE: ${ok}/${diagUpdates.length}`);

      // 분류 자동 INSERT (content_classifications + test_question_classifications)
      // 비주얼 에디터의 ClassificationPicker 와 동일 시스템 사용. 기존 분류는 보존(union).
      const [masterRows] = await conn.execute(
        "SELECT code FROM classification_master WHERE active = 1",
      );
      const validCodes = new Set(masterRows.map((r) => r.code));

      const extractCodes = (a) => [a?.areaCode, a?.subAreaCode, a?.themeCode]
        .filter((c) => typeof c === 'string' && c.length > 0 && validCodes.has(c));

      // 1) 지문별: content_classifications (contentId = passageId)
      for (const [pid, pa] of Object.entries(analysis.passages)) {
        const codes = extractCodes(pa);
        if (codes.length === 0) continue;
        const [existing] = await conn.execute(
          "SELECT classification_code FROM content_classifications WHERE content_id = ?",
          [pid],
        );
        const existSet = new Set(existing.map((r) => r.classification_code));
        for (const code of codes) {
          if (existSet.has(code)) continue;
          await conn.execute(
            "INSERT INTO content_classifications (content_id, classification_code, classification_type, is_primary, created_at) " +
            "SELECT ?, ?, type, 0, NOW() FROM classification_master WHERE code = ?",
            [pid, code, code],
          );
        }
      }

      // 2) 문항별: test_question_classifications (questionId)
      for (const [qid, qa] of Object.entries(analysis.questions)) {
        const codes = extractCodes(qa);
        if (codes.length === 0) continue;
        const [existing] = await conn.execute(
          "SELECT classification_code FROM test_question_classifications WHERE question_id = ?",
          [qid],
        );
        const existSet = new Set(existing.map((r) => r.classification_code));
        for (const code of codes) {
          if (existSet.has(code)) continue;
          await conn.execute(
            "INSERT INTO test_question_classifications (question_id, classification_code, classification_type, is_primary, created_at) " +
            "SELECT ?, ?, type, 0, NOW() FROM classification_master WHERE code = ?",
            [qid, code, code],
          );
        }
      }

      // 3) 시험지 전체: content_classifications (contentId = testId, 모든 지문·문항 union)
      const testId = 'diag_paper_russell';
      const allCodes = new Set();
      for (const a of Object.values(analysis.passages)) extractCodes(a).forEach((c) => allCodes.add(c));
      for (const a of Object.values(analysis.questions)) extractCodes(a).forEach((c) => allCodes.add(c));
      const [paperExist] = await conn.execute(
        "SELECT classification_code FROM content_classifications WHERE content_id = ?",
        [testId],
      );
      const paperExistSet = new Set(paperExist.map((r) => r.classification_code));
      let paperOk = 0;
      for (const code of allCodes) {
        if (paperExistSet.has(code)) continue;
        await conn.execute(
          "INSERT INTO content_classifications (content_id, classification_code, classification_type, is_primary, created_at) " +
          "SELECT ?, ?, type, 0, NOW() FROM classification_master WHERE code = ?",
          [testId, code, code],
        );
        paperOk++;
      }
      console.log(`분류 INSERT: 지문 ${Object.keys(analysis.passages).length}개 + 문항 ${Object.keys(analysis.questions).length}개 매핑, 시험지 누적 ${paperOk}건 추가 (총 ${allCodes.size}개 코드)`);

      await conn.commit();
      console.log('\n✔ 커밋 완료');
    } catch (e) {
      await conn.rollback();
      throw e;
    }
  } finally {
    if (conn) await conn.end();
    if (tunnel) await closeTunnel(tunnel);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
