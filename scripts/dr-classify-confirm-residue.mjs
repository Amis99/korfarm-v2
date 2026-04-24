#!/usr/bin/env node
/**
 * confirm 잔여(Q-A 노출) 케이스를 분류:
 *   - "truncated": ans가 prompt의 더 긴 단어의 일부 (잘림)
 *   - "explanatory": prompt가 풀이형 (긴 prompt + ans는 정답 단어/구절)
 *   - "find_form": prompt가 이미 찾기 형식 (audit이 잡으면 안 되는 케이스)
 *   - "other": 그 외
 *
 * 출력: tmp/confirm-residue-{kind}.txt 4개
 *   각 파일에 케이스 목록 (level/day/qid + prompt + ans + ranges)
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

function paragraphMap(payload) {
  const paras = (payload?.passage?.paragraphs) || [];
  return Object.fromEntries(paras.map((p) => [p.id, p.text || '']));
}

function isFindForm(prompt) {
  return /(찾으시오|찾아라|찾으세요|찾아\s*보세요|찾기)/.test(prompt);
}

// prompt에서 ans를 둘러싼 한글 단어 추출.
// ans가 더 긴 단어의 일부면 그 더 긴 단어 반환. 아니면 null.
function findEnclosingWord(prompt, ans) {
  // 한글/숫자/영문 연속을 단어로 (조사 제외 위해 어절 단위 사용)
  // 예: "속력은" → 어절 → "속력"이라는 단어가 ans="속"을 포함
  const tokens = prompt.split(/[\s.,?!"'‘’"“"`「」『』《》<>()]+/);
  for (const t of tokens) {
    if (!t) continue;
    if (t === ans) continue;
    // ans가 t의 부분문자열이면서 t가 더 긴 경우 (조사 등 포함)
    if (t.includes(ans) && t.length > ans.length) {
      // 단어 끝에 조사가 붙은 경우 어간 추출 시도
      // 한글 받침 + 은/는/이/가/을/를/의/에/와/과/로/으로/도/만 등
      let stem = t;
      const josaList = ['으로', '으로서', '으로써', '에서', '에게', '에', '으로부터', '부터',
                         '까지', '한테', '에게서', '한테서', '에서부터', '와', '과', '도', '만',
                         '의', '은', '는', '이', '가', '을', '를', '로', '아', '야', '여', '이여'];
      for (const j of josaList) {
        if (stem.endsWith(j) && stem.length > j.length) { stem = stem.slice(0, -j.length); break; }
      }
      if (stem !== ans && stem.includes(ans)) return stem;
    }
  }
  return null;
}

const buckets = {
  truncated: [],
  find_form: [],
  explanatory: [],
  other: [],
};

let scanned = 0;
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
    cqs.forEach((q) => {
      scanned += 1;
      const prompt = String(q.prompt || '').trim();
      const ans = String(q.answerText || '').trim();
      if (!ans || !prompt.includes(ans)) return;
      const item = { level, day, qid: q.id || '', prompt, ans, ranges: q.answerRanges || [], mode: q.answerMatchMode || '' };
      if (isFindForm(prompt)) { buckets.find_form.push(item); return; }
      const enclosing = findEnclosingWord(prompt, ans);
      if (enclosing) {
        item.suggestedAns = enclosing;
        // 지문에서 enclosing이 등장하는지 확인
        const occs = [];
        for (const [pid, ptext] of Object.entries(paras)) {
          let from = 0;
          while (true) {
            const idx = ptext.indexOf(enclosing, from);
            if (idx < 0) break;
            occs.push({ paragraphId: pid, start: idx, end: idx + enclosing.length });
            from = idx + 1;
          }
        }
        item.suggestedRanges = occs;
        buckets.truncated.push(item);
        return;
      }
      // 풀이형 = ans 길고 prompt가 그것보다 그리 길지 않음 (대략 ans 포함 마지막 어절이 ans인 형태)
      if (ans.length >= 4 && prompt.length < ans.length * 3) {
        buckets.explanatory.push(item);
        return;
      }
      buckets.other.push(item);
    });
  }
}

fs.mkdirSync(TMP_DIR, { recursive: true });
const summary = [];
for (const [kind, list] of Object.entries(buckets)) {
  const out = path.join(TMP_DIR, `confirm-residue-${kind}.txt`);
  const lines = [];
  lines.push(`# ${kind} — ${list.length}건`);
  lines.push('');
  for (const it of list) {
    lines.push(`[${it.level}/${it.day}#${it.qid}] (${it.mode})`);
    lines.push(`  PROMPT: ${it.prompt}`);
    lines.push(`  ANS:    ${it.ans}`);
    if (it.suggestedAns) lines.push(`  →ANS:   ${it.suggestedAns} (지문 등장 ${it.suggestedRanges.length}회)`);
    lines.push('');
  }
  fs.writeFileSync(out, lines.join('\n'), 'utf8');
  summary.push(`  ${kind.padEnd(12)} ${String(list.length).padStart(5)}  → ${out}`);
}

console.log(`scanned=${scanned}  Q-A overlap=${Object.values(buckets).reduce((s,l)=>s+l.length,0)}`);
console.log(summary.join('\n'));
