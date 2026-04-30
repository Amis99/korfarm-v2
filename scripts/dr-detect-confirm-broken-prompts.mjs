#!/usr/bin/env node
/**
 * 확인학습 prompt에서 한국어 비문/어색한 패턴 검출 (검출 전용 — 수정 X)
 *
 * 검출 패턴:
 *  A. 조사 오류
 *      - "무엇를", "무엇은", "어디를", "어디은", "누구를", "누구은"
 *      - 의문사 + 잘못된 조사
 *  B. 동사 활용 오류
 *      - "심인나요", "받인나요", "들인나요", "났인나요" 등 -ㅆ인나요/-인나요 형태
 *      - "심으나요", "받으나요" 등 비표준 활용
 *  C. 다중 의문사 (한 prompt에 의문사 2개 이상)
 *      - 무엇/어디/언제/누가/누구/왜/어떻게/어느/어떤/몇 중 2개 이상
 *  D. 어색한 종결
 *      - "~하나요?" 다음 다른 어구 이어짐
 *      - "??" 또는 "?." 같은 부호 오류
 *      - 마침표·물음표 누락
 *  E. 반복 음절/어절
 *      - 같은 어절이 연속 반복 ("물을 물을")
 *  F. 문장 단편화
 *      - prompt 끝이 조사로 끝남 ("~을", "~는")
 *      - prompt 끝이 미완 동사 어간 ("~하"·"~되")
 *
 * 출력: tmp/confirm-broken-prompts.txt (카테고리별 케이스 + 지문 발췌)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const DAILY_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading');
const TMP_DIR = path.join(ROOT, 'tmp');

const LEVELS = [
  'saussure1','saussure2','saussure3',
  'frege1','frege2','frege3',
  'russell1','russell2','russell3',
  'wittgenstein1','wittgenstein2','wittgenstein3',
];

// ─── 패턴 ───
const QWORDS = ['무엇','어디','언제','누가','누구','왜','어떻게','어느','어떤','몇'];

// A. 조사 오류 (강화)
const PARTICLE_HARD = [
  /무엇를/, /무엇가(?!\s*나타|\s*있)/,           // "무엇를", "무엇가" — "무엇을/무엇이"가 정상
  /어디을/, /어디를/,                               // (지문 인용 부분 제외 위해 별도 가드 필요할 수 있음)
  /누구은/, /누구이/,
  /어느을/, /어느를/, /어떤를/,
  /몇를/, /몇은/, /몇는/,
];

// B. 동사 활용 오류 (-ㅆ인나요, -인나요 같은 비표준)
const VERB_BROKEN = [
  /[가-힣]+인나요/,    // 심인나요, 받인나요, 들인나요
  /[가-힣]+ㅆ나요/,    // 자모 분리된 형태
  /[가-힣]+았인/, /[가-힣]+었인/,
  /[가-힣]+으나요/,    // 비표준 어미
  /[가-힣]+나뇨/, /[가-힣]+요\?\s*요/,
  /[가-힣]+든가요/,    // (의도 OK이지만 어색)
];
const VERB_HARD = [
  /[가-힣]+인나요/, /[가-힣]+ㅆ나요/, /[가-힣]+았인/, /[가-힣]+었인/,
];

// C. 다중 의문사
function multiQuestionWords(prompt) {
  const found = QWORDS.filter((q) => prompt.includes(q));
  return found.length >= 2 ? found : null;
}

// D. 어색한 종결·부호
const PUNCT_HARD = [
  /\?\?/, /\?\./, /\.\?/,
];
const ENDS_BAD = [
  /[가-힣][을를이가은는의에로]\s*$/,  // 조사로 끝남
  /[가-힣](?:하|되|이|있|없)\s*$/,    // 어간으로 끝남
];

// E. 반복 음절/어절
function repeatedToken(prompt) {
  const tokens = prompt.split(/\s+/);
  for (let i = 1; i < tokens.length; i += 1) {
    if (tokens[i] && tokens[i] === tokens[i-1] && tokens[i].length >= 2) {
      return tokens[i];
    }
  }
  return null;
}

// ─── 스캔 ───
const buckets = {
  particle_wrong: [],
  verb_broken: [],
  multi_q: [],
  punct_bad: [],
  ends_bad: [],
  repeated: [],
};
let scanned = 0;

function paragraphMap(payload) {
  const paras = (payload?.passage?.paragraphs) || [];
  return Object.fromEntries(paras.map((p) => [p.id, p.text || '']));
}

for (const level of LEVELS) {
  const dir = path.join(DAILY_DIR, level);
  if (!fs.existsSync(dir)) continue;
  for (const fname of fs.readdirSync(dir).filter((n) => /^\d{3}\.json$/.test(n))) {
    const day = fname.slice(0, 3);
    let doc;
    try { doc = JSON.parse(fs.readFileSync(path.join(dir, fname), 'utf8')); } catch { continue; }
    const payload = doc?.payload || doc;
    const cqs = (payload?.confirm?.questions) || [];
    const paras = paragraphMap(payload);
    const passageText = Object.values(paras).join('\n');
    cqs.forEach((q) => {
      scanned += 1;
      const prompt = String(q.prompt || '').trim();
      const ans = String(q.answerText || '').trim();
      if (!prompt) return;
      const item = { level, day, qid: q.id || '', prompt, ans, passage: passageText.slice(0, 280) };

      if (PARTICLE_HARD.some((rx) => rx.test(prompt))) buckets.particle_wrong.push(item);
      else if (VERB_HARD.some((rx) => rx.test(prompt))) buckets.verb_broken.push(item);

      const mq = multiQuestionWords(prompt);
      if (mq) buckets.multi_q.push({ ...item, hits: mq });

      if (PUNCT_HARD.some((rx) => rx.test(prompt))) buckets.punct_bad.push(item);
      if (ENDS_BAD.some((rx) => rx.test(prompt))) buckets.ends_bad.push(item);

      const rep = repeatedToken(prompt);
      if (rep) buckets.repeated.push({ ...item, token: rep });
    });
  }
}

fs.mkdirSync(TMP_DIR, { recursive: true });
const out = path.join(TMP_DIR, 'confirm-broken-prompts.txt');
const lines = [];
const total = Object.values(buckets).reduce((s,l)=>s+l.length,0);
lines.push(`# 확인학습 비문/어색 prompt 검출  scanned=${scanned}  total flagged=${total}`);
lines.push('');
for (const [kind, list] of Object.entries(buckets)) {
  lines.push(`\n## ${kind} — ${list.length}건\n`);
  for (const it of list.slice(0, 50)) {
    lines.push(`[${it.level}/${it.day}#${it.qid}]`);
    lines.push(`  PROMPT: ${it.prompt}`);
    lines.push(`  ANS:    ${it.ans}`);
    if (it.hits) lines.push(`  의문사: ${it.hits.join(', ')}`);
    if (it.token) lines.push(`  반복:  ${it.token}`);
    lines.push('');
  }
  if (list.length > 50) lines.push(`  ... +${list.length - 50}건 더\n`);
}
fs.writeFileSync(out, lines.join('\n'), 'utf8');

console.log(`scanned=${scanned}  flagged=${total}`);
for (const [k, v] of Object.entries(buckets)) console.log(`  ${k.padEnd(18)} ${v.length}`);
console.log(`보고서 → ${out}`);
