// scripts/_q10_drafts/{contentId}.json 에 정의된 신규 Q10 (substring 형 evidence)을
// CHOICE_COMPLEX_OX 스키마로 변환 후 DB content_versions UPDATE.
//
// 사용:
//   node scripts/_apply_q10_draft.mjs dq-SAUSSURE_1-001            (실 DB UPDATE)
//   node scripts/_apply_q10_draft.mjs dq-SAUSSURE_1-001 --dry      (dry run, JSON 출력)
//   node scripts/_apply_q10_draft.mjs --all                        (drafts 폴더의 모든 파일)
//   node scripts/_apply_q10_draft.mjs --pairs                      (PAIRS 매핑대로 Day 1 12개 적용)
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

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

const COMP_WHITELIST = new Set([
  '어휘력', '문장 독해력', '구조 독해력', '논리 사고력',
  '어법·문법 능력', '국어 개념 적용 능력',
  '국어 관련 배경지식', '비문학 배경지식',
  '문제 분석 및 전략 수립 능력', '선택지 분석 및 전략 수립 능력',
]);

function buildEvidenceRanges(passage, evidence) {
  const ranges = [];
  for (const e of evidence) {
    const para = passage.paragraphs.find((p) => p.id === e.paragraphId);
    if (!para) throw new Error(`paragraphId not found: ${e.paragraphId}`);
    const idx = para.text.indexOf(e.substring);
    if (idx < 0) throw new Error(`substring not found in ${e.paragraphId}: "${e.substring}"`);
    ranges.push({ paragraphId: e.paragraphId, start: idx, end: idx + e.substring.length });
  }
  return ranges;
}

function validateDraft(draft) {
  const errs = [];
  const warns = [];
  // 발문에 <u>않은</u> 포함 여부
  if (!/적절하지\s*<u>않은<\/u>/.test(draft.stem)) {
    errs.push('stem에 "적절하지 <u>않은</u>" 패턴이 없음');
  }
  // 선택지 4~5개
  if (draft.choices.length < 4 || draft.choices.length > 5) {
    errs.push(`choices 개수: ${draft.choices.length} (4~5 권장)`);
  }
  // 정답 선지가 정확히 1개
  const correctCount = draft.choices.filter((c) => c.isCorrect).length;
  if (correctCount !== 1) {
    errs.push(`정답(부적절) 선지가 1개여야 함 — 현재 ${correctCount}`);
  }
  // 글자수 균형 — 정답 선지가 가장 길 때 2위 + 5 이상 안 됨
  const lens = draft.choices.map((c) => ({ id: c.choiceId, len: c.text.length, isCorrect: !!c.isCorrect }));
  const sorted = [...lens].sort((a, b) => b.len - a.len);
  if (sorted[0].isCorrect && sorted[0].len - sorted[1].len > 5) {
    errs.push(`정답 선지(${sorted[0].id} ${sorted[0].len}자)가 2위(${sorted[1].id} ${sorted[1].len}자)보다 5자 초과`);
  }
  // 한정 표현은 경고(warning) — 지문 인용/본질 필요충분 조건은 OK
  const restrictWords = ['모든 ', '항상 ', '절대 ', '결코 ', '오직 ', '반드시 '];
  for (const c of draft.choices) {
    for (const rw of restrictWords) {
      if (c.text.includes(rw)) warns.push(`선지 ${c.choiceId}: 한정 표현 "${rw.trim()}" 포함 — 본질 필요충분 조건이면 무시`);
    }
  }
  // 괄호 — 한자 병기 외
  for (const c of draft.choices) {
    if (/[(](?![一-龥A-Za-z])/.test(c.text)) errs.push(`선지 ${c.choiceId}: 괄호 부연 의심`);
  }
  // 명제 개수 2~4
  for (const c of draft.choices) {
    if (c.propositions.length < 1 || c.propositions.length > 4) {
      errs.push(`선지 ${c.choiceId}: propositions ${c.propositions.length}개 (1~4)`);
    }
  }
  // 부적절 선지에 X 명제 1개 이상
  const wrongChoice = draft.choices.find((c) => c.isCorrect);
  if (wrongChoice && !wrongChoice.propositions.some((p) => p.oxAnswer === 'X')) {
    errs.push(`정답(부적절) 선지에 X 명제가 1개 이상 있어야 함`);
  }
  // 적절 선지는 모든 명제 O
  for (const c of draft.choices) {
    if (!c.isCorrect) {
      const xs = c.propositions.filter((p) => p.oxAnswer === 'X');
      if (xs.length > 0) errs.push(`적절 선지 ${c.choiceId}에 X 명제 (${xs.map((p) => p.propId).join(',')}) 존재`);
    }
  }
  // 벡터 화이트리스트
  for (const k of Object.keys(draft.competencyVector || {})) {
    if (!COMP_WHITELIST.has(k)) errs.push(`competencyVector 비표준 키: "${k}"`);
  }
  for (const c of draft.choices) {
    for (const k of Object.keys(c.wrongVector || {})) {
      if (!COMP_WHITELIST.has(k)) errs.push(`선지 ${c.choiceId} wrongVector 비표준 키: "${k}"`);
    }
  }
  return { errs, warns };
}

function buildQ10(draft) {
  const choices = draft.choices.map((c) => {
    const propositions = c.propositions.map((p) => ({
      propId: p.propId,
      text: p.text,
      oxAnswer: p.oxAnswer,
      matchMode: p.matchMode || 'ALL',
      evidenceRanges: buildEvidenceRanges(draft.passage, p.evidence),
    }));
    const out = {
      choiceId: c.choiceId,
      text: c.text,
      propositions,
    };
    if (c.wrongVector && Object.keys(c.wrongVector).length > 0) {
      out.wrongVector = c.wrongVector;
    }
    return out;
  });
  const q10 = {
    id: draft.questionId,
    type: 'CHOICE_COMPLEX_OX',
    questionKind: 'CHOICE_ANALYSIS',
    competency: draft.competencyKeyword || '',
    stem: draft.stem,
    passage: draft.passage,
    choices,
    explanation: draft.explanation,
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40 },
  };
  if (draft.competencyVector) q10.competencyVector = draft.competencyVector;
  return q10;
}

async function applyOne(conn, draftPath, dryRun) {
  const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
  const { errs, warns } = validateDraft(draft);
  if (errs.length > 0) {
    console.log(`\n=== ${draft.contentId} 검증 실패 ===`);
    errs.forEach((e) => console.log('  ✗ ' + e));
    warns.forEach((w) => console.log('  ⚠ ' + w));
    if (!dryRun) {
      console.log('  (실 적용 중단)');
      return false;
    }
  } else {
    console.log(`\n=== ${draft.contentId} 검증 통과${warns.length ? ' (경고 있음)' : ''} ===`);
    warns.forEach((w) => console.log('  ⚠ ' + w));
  }
  let newQ10;
  try {
    newQ10 = buildQ10(draft);
  } catch (e) {
    console.log(`  ✗ buildQ10 오류: ${e.message}`);
    return false;
  }
  // 글자수 정보
  const lens = draft.choices.map((c) => `${c.choiceId}:${c.text.length}자${c.isCorrect ? '★' : ''}`);
  console.log(`  선지 글자수: ${lens.join(' / ')}`);

  if (dryRun) {
    const outPath = path.join(ROOT, 'scripts', '_q10_drafts', `${draft.contentId}.q10.compiled.json`);
    fs.writeFileSync(outPath, JSON.stringify(newQ10, null, 2), 'utf8');
    console.log(`  dry — compiled JSON → ${path.relative(ROOT, outPath)}`);
    return true;
  }

  // 최신 row 조회 (uploaded_by, version 등 모두 가져옴)
  const [rows] = await conn.execute(
    `SELECT * FROM content_versions
     WHERE content_id = ? ORDER BY created_at DESC LIMIT 1`,
    [draft.contentId],
  );
  if (rows.length === 0) {
    console.log(`  ✗ content_versions 행 없음`);
    return false;
  }
  const prev = rows[0];
  const w = JSON.parse(prev.content_json);
  const p = w.payload || w;
  const qs = p.questions || [];
  if (qs.length < 10) {
    console.log(`  ✗ questions 길이 부족: ${qs.length}`);
    return false;
  }
  qs[9] = newQ10;
  if (w.payload) w.payload.questions = qs;
  else w.questions = qs;
  const newJson = JSON.stringify(w);

  // unique key (content_id, schema_version) 으로 INSERT 중복 불가 → UPDATE
  // 백업: 원본 content_json 은 _day001_full_dump.json 에 보관됨
  await conn.execute(
    `UPDATE content_versions SET content_json = ?, updated_at = NOW() WHERE id = ?`,
    [newJson, prev.id],
  );
  console.log(`  ✓ DB UPDATE 완료 (id=${prev.id}, schema_version=${prev.schema_version})`);
  return true;
}

// Day 1 페어 매핑 (왼쪽 표준 → 오른쪽 복사) — Day 1 전용. Day N 의 페어 매핑은 _summary.json 의 pairStandards 사용
const DAY1_PAIRS = [
  ['dq-SAUSSURE_1-001', 'dq-SAUSSURE_2-001'],
  ['dq-SAUSSURE_3-001', 'dq-FREGE_1-001'],
  ['dq-FREGE_3-001', 'dq-FREGE_2-001'],
  ['dq-RUSSELL_1-001', 'dq-RUSSELL_2-001'],
  ['dq-RUSSELL_3-001', 'dq-WITTGENSTEIN_1-1'],
  ['dq-WITTGENSTEIN_2-1', 'dq-WITTGENSTEIN_3-1'],
];

function pairsFromSummary(day) {
  const summaryPath = path.join(ROOT, 'scripts', '_q10_drafts', `day${String(day).padStart(3, '0')}`, '_summary.json');
  if (!fs.existsSync(summaryPath)) {
    throw new Error(`summary 없음: ${summaryPath}\n먼저 'node scripts/_dump_day.mjs ${day}' 실행`);
  }
  const s = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  return s.pairStandards.map((ps) => [ps.standardId, ps.fallbackId]);
}

async function applyPairCopy(conn, srcId, dstId) {
  const [rows] = await conn.execute(
    `SELECT * FROM content_versions WHERE content_id = ? ORDER BY created_at DESC LIMIT 1`,
    [srcId],
  );
  if (rows.length === 0) {
    console.log(`  ✗ src 행 없음: ${srcId}`);
    return false;
  }
  const srcW = JSON.parse(rows[0].content_json);
  const srcP = srcW.payload || srcW;
  const srcQ10 = (srcP.questions || [])[9];
  if (!srcQ10 || srcQ10.type !== 'CHOICE_COMPLEX_OX') {
    console.log(`  ✗ src Q10 가 CHOICE_COMPLEX_OX 아님: ${srcId} (type=${srcQ10?.type})`);
    return false;
  }
  // dst 콘텐츠 조회
  const [drows] = await conn.execute(
    `SELECT * FROM content_versions WHERE content_id = ? ORDER BY created_at DESC LIMIT 1`,
    [dstId],
  );
  if (drows.length === 0) {
    console.log(`  ✗ dst 행 없음: ${dstId}`);
    return false;
  }
  const dst = drows[0];
  const dstW = JSON.parse(dst.content_json);
  const dstP = dstW.payload || dstW;
  const dstQs = dstP.questions || [];
  if (dstQs.length < 10) {
    console.log(`  ✗ dst questions 길이 부족: ${dstQs.length}`);
    return false;
  }
  // questionId 만 dst 의 ID 형식으로 변경 (dst-10), 나머지는 동일
  const cloned = JSON.parse(JSON.stringify(srcQ10));
  cloned.id = `${dstId}-10`;
  dstQs[9] = cloned;
  if (dstW.payload) dstW.payload.questions = dstQs;
  else dstW.questions = dstQs;
  await conn.execute(
    `UPDATE content_versions SET content_json = ?, updated_at = NOW() WHERE id = ?`,
    [JSON.stringify(dstW), dst.id],
  );
  console.log(`  ✓ ${srcId} → ${dstId} 페어 복사 완료`);
  return true;
}

(async () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry');
  const all = args.includes('--all');
  const pairs = args.includes('--pairs');
  const draftsDir = path.join(ROOT, 'scripts', '_q10_drafts');

  let conn = null;
  let t = null;
  if (!dryRun) {
    const cfg = readDbConfig();
    t = await tunnel(cfg);
    conn = await mysql.createConnection({
      host: '127.0.0.1', port: t.port,
      user: cfg.user, password: cfg.password, database: cfg.database, charset: 'utf8mb4',
    });
  }
  try {
    let ok = 0, fail = 0;

    // --day NNN 인자 파싱
    const dayArgIdx = args.indexOf('--day');
    const dayNum = dayArgIdx >= 0 ? Number(args[dayArgIdx + 1]) : null;
    const dayDir = dayNum
      ? path.join(draftsDir, `day${String(dayNum).padStart(3, '0')}`)
      : draftsDir;

    if (pairs) {
      // 페어 매핑: Day 지정시 _summary.json 사용, 없으면 Day 1 default
      const pairList = dayNum ? pairsFromSummary(dayNum) : DAY1_PAIRS;
      for (const [srcId, dstId] of pairList) {
        console.log(`\n[페어] ${srcId} → ${dstId}`);
        const success = await applyPairCopy(conn, srcId, dstId);
        if (success) ok++; else fail++;
      }
    } else {
      let targetFiles;
      if (all) {
        targetFiles = fs.readdirSync(dayDir)
          .filter((f) => f.endsWith('.json') && !f.endsWith('.compiled.json') && !f.startsWith('_'))
          .map((f) => path.join(dayDir, f));
      } else {
        const cid = args.find((a) => !a.startsWith('--') && !a.match(/^\d+$/));
        if (!cid) {
          console.error('사용: node scripts/_apply_q10_draft.mjs [--day NNN] <contentId> [--dry] | --all | --pairs');
          process.exit(1);
        }
        targetFiles = [path.join(dayDir, `${cid}.json`)];
      }
      for (const f of targetFiles) {
        const success = await applyOne(conn, f, dryRun);
        if (success) ok++; else fail++;
      }
    }
    console.log(`\n결과: 통과 ${ok} / 실패 ${fail}`);
  } finally {
    if (conn) await conn.end();
    if (t) {
      await new Promise((r) => t.server.close(r));
      t.ssh.end();
    }
  }
})().catch((e) => { console.error(e); process.exit(1); });
