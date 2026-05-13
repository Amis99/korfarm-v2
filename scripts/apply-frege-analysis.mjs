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
 *   node scripts/apply-frege-analysis.mjs              # dry-run (변경 없음)
 *   node scripts/apply-frege-analysis.mjs --apply-db   # 실제 적용
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

// 한글 세부영역 라벨 → classification_master 코드 매핑 (프레게 분석 JSON 호환)
const SUBDOMAIN_LABEL_TO_CODE = {
  '인문': 'READ_HUMANITIES', '사회': 'READ_SOCIETY', '과학': 'READ_SCIENCE',
  '기술': 'READ_TECH', '예술': 'READ_ART',
  '현대시': 'LIT_MODERN_POETRY', '고전시가': 'LIT_CLASSIC_POETRY',
  '현대소설': 'LIT_MODERN_NOVEL', '고전산문': 'LIT_CLASSIC_PROSE',
  '수필': 'LIT_ESSAY', '극': 'LIT_DRAMA',
  '음운': 'GRAM_PHONOLOGY', '단어': 'GRAM_WORD', '단어·형태론': 'GRAM_WORD',
  '문장': 'GRAM_SENTENCE', '담화': 'GRAM_DISCOURSE', '국어사': 'GRAM_HISTORY',
};
function labelToSubDomainCode(label) {
  if (!label) return null;
  return SUBDOMAIN_LABEL_TO_CODE[label] || null;
}

function buildUpdatedPayload(originalPayload, analysis) {
  // 깊은 복사 후 분석 메타 머지 (전체 덮어쓰기 정책)
  // 비주얼 에디터 UI 는 passage.domain (영역 코드), passage.subDomain (세부영역 코드),
  // choice.wrongVector / choice.wrongPattern 을 읽음.
  const p = JSON.parse(JSON.stringify(originalPayload));

  if (Array.isArray(p.passages)) {
    for (const pas of p.passages) {
      const a = analysis.passages[pas.id];
      if (!a) continue;
      pas.domain = a.areaCode || a.domain;
      pas.subDomain = a.subAreaCode || labelToSubDomainCode(a.subDomain);
      pas.theme = a.theme;
    }
  }
  if (Array.isArray(p.questions)) {
    for (const q of p.questions) {
      const a = analysis.questions[q.id];
      if (!a) continue;
      q.domain = a.areaCode || a.domain;
      q.subDomain = a.subAreaCode || labelToSubDomainCode(a.subDomain);
      q.questionType = a.questionType;
      q.competencyVector = a.competencyVector;
      q.intent = a.intent;
      q.explanation = a.explanation;
      q.choiceExplanations = a.choiceExplanations;
      q.wrongPattern = a.wrongPattern;

      // choices[] — 비주얼 에디터·학생 채점·PDF 호환 4개 필드
      const correctId = q.answerId;
      if (Array.isArray(q.choices)) {
        for (const c of q.choices) {
          const cid = c.id;
          if (cid === correctId) {
            c.vector = cleanVec(a.competencyVector);
            c.errorPath = '정답';
            c.wrongVector = {};
            c.wrongPattern = null;
          } else {
            const wv = cleanVec(a.choiceWrongVectors[cid] || {});
            const wp = a.wrongPattern[cid] || null;
            c.vector = wv;
            c.errorPath = wp;
            c.wrongVector = wv;
            c.wrongPattern = wp;
          }
        }
      }
    }
  }
  return p;
}

// 분석 결과에서 분류 코드 추출 (areaCode 또는 한글 라벨에서 매핑)
function extractClassificationCodes(a, validCodes) {
  const codes = [];
  const area = a?.areaCode || a?.domain;  // domain 이 영역 코드 (READ/LIT/...)
  if (area && validCodes.has(area)) codes.push(area);
  const sub = a?.subAreaCode || labelToSubDomainCode(a?.subDomain);
  if (sub && validCodes.has(sub)) codes.push(sub);
  const theme = a?.themeCode;
  if (theme && validCodes.has(theme)) codes.push(theme);
  return codes;
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
  const analysis = JSON.parse(fs.readFileSync(path.join(GEN, 'frege_analysis_filled.json'), 'utf8'));
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
      "SELECT id, payload_json FROM test_papers WHERE id = 'diag_paper_frege'",
    );
    if (paperRows.length === 0) throw new Error('test_papers diag_paper_frege 없음');
    const paper = paperRows[0];
    const originalPayload = typeof paper.payload_json === 'string' ? JSON.parse(paper.payload_json) : paper.payload_json;

    const [diagQRows] = await conn.execute(
      "SELECT id, passage_id, order_in_passage, correct_choice, choices_json FROM diag_questions WHERE tier = 'frege' ORDER BY passage_id, order_in_passage, id",
    );
    const diagQs = diagQRows.map((r) => ({
      ...r,
      choices_json: typeof r.choices_json === 'string' ? JSON.parse(r.choices_json) : r.choices_json,
    }));
    console.log(`DB 로드: test_papers 1행, diag_questions ${diagQs.length}행`);

    const backupPath = path.join(GEN, `frege_apply_backup_${runStamp}.json`);
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

    const filledPath = path.join(GEN, `frege_payload_filled_${runStamp}.json`);
    fs.writeFileSync(filledPath, JSON.stringify(newPayload, null, 2), 'utf8');
    console.log(`갱신된 payload 미리보기 → ${filledPath}`);

    if (!APPLY_DB) {
      console.log('\n(dry-run — --apply-db 없으면 DB 변경 안 함)');
      return;
    }

    await conn.beginTransaction();
    try {
      const [r1] = await conn.execute(
        "UPDATE test_papers SET payload_json = ?, updated_at = NOW() WHERE id = 'diag_paper_frege'",
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

      // 분류 자동 INSERT — content_classifications + test_question_classifications
      const [masterRows] = await conn.execute(
        "SELECT code FROM classification_master WHERE active = 1",
      );
      const validCodes = new Set(masterRows.map((r) => r.code));

      // 1) 지문 → content_classifications
      for (const [pid, pa] of Object.entries(analysis.passages)) {
        const codes = extractClassificationCodes(pa, validCodes);
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

      // 2) 문항 → test_question_classifications
      for (const [qid, qa] of Object.entries(analysis.questions)) {
        const codes = extractClassificationCodes(qa, validCodes);
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

      // 3) 시험지 전체 union → content_classifications (contentId = testId)
      const testId = 'diag_paper_frege';
      const allCodes = new Set();
      for (const a of Object.values(analysis.passages)) extractClassificationCodes(a, validCodes).forEach((c) => allCodes.add(c));
      for (const a of Object.values(analysis.questions)) extractClassificationCodes(a, validCodes).forEach((c) => allCodes.add(c));
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
