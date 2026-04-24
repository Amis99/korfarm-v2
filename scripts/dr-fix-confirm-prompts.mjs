#!/usr/bin/env node
/**
 * 일일독해 confirm 문항의 prompt를 자동 변환 (찾기 형식으로).
 *
 * 검출 규칙: prompt에 answerText가 들어 있고, prompt가 의미·해당·위치를 묻는 패턴.
 *
 * 변환 형식 (학년별):
 *   소쉬르: "지문에서 '{X}'을(를) 모두 찾아 보세요."
 *   프레게: "지문에서 '{X}'을(를) 모두 찾으세요."
 *   러셀:   "지문에서 '{X}'을(를) 모두 찾으시오."
 *   비트:   "본문에서 '{X}'을(를) 모두 찾으시오."
 *
 * 비트 분석 패턴(예: "여섯째 문단은 'X'의 핵심을..."):
 *   "{문단 번호} 문단에서 '{X}'에 해당하는 부분을 모두 찾으시오."
 *
 * 이미 자연스럽게 작동하는(정상) 케이스는 건너뜀:
 *   - prompt가 이미 "찾으시오/찾아라/찾으세요/찾아 보세요" 포함
 *   - prompt에 answerText 없음
 *
 * ALL 모드: 변환 후 "모두" 자동 포함.
 *
 * 사용:
 *   node scripts/dr-fix-confirm-prompts.mjs --dry-run     변환 결과만 출력
 *   node scripts/dr-fix-confirm-prompts.mjs               파일에 적용
 *   node scripts/dr-fix-confirm-prompts.mjs --report      tmp/confirm-fix-report.txt 생성
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const DAILY_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading');
const TMP_DIR = path.join(ROOT, 'tmp');

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (!m) { args[a] = true; continue; }
  const key = m[1];
  if (m[2] !== undefined) { args[key] = m[2]; continue; }
  const next = argv[i + 1];
  if (next != null && !next.startsWith('--')) { args[key] = next; i += 1; }
  else { args[key] = true; }
}

const dryRun = args['dry-run'] === true || args['dry-run'] === 'true';
const writeReport = args.report === true || args.report === 'true';

const LEVELS = [
  'saussure1','saussure2','saussure3',
  'frege1','frege2','frege3',
  'russell1','russell2','russell3',
  'wittgenstein1','wittgenstein2','wittgenstein3',
];

// 학년별 prompt 형식
function newPromptByLevel(level, X, paragraphHint) {
  // 받침 → 조사
  const last = X.slice(-1);
  const code = last.charCodeAt(0);
  let josa;
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const hasBatchim = (code - 0xAC00) % 28 !== 0;
    josa = hasBatchim ? '을' : '를';
  } else {
    josa = '을(를)';
  }
  // 문단 힌트가 있으면 비트 분석 패턴
  if (paragraphHint && level.startsWith('wittgenstein')) {
    return `${paragraphHint}에서 '${X}'에 해당하는 부분을 모두 찾으시오.`;
  }
  if (level.startsWith('saussure')) {
    return `지문에서 '${X}'${josa} 모두 찾아 보세요.`;
  }
  if (level.startsWith('frege')) {
    return `지문에서 '${X}'${josa} 모두 찾으세요.`;
  }
  if (level.startsWith('russell')) {
    return `지문에서 '${X}'${josa} 모두 찾으시오.`;
  }
  // wittgenstein 일반
  return `본문에서 '${X}'${josa} 모두 찾으시오.`;
}

// 비트 분석 패턴에서 문단 힌트 추출
const PARAGRAPH_HINT_RX = /^(첫째|둘째|셋째|넷째|다섯째|여섯째|일곱째|여덟째|아홉째|열째|마지막)\s*문단/;

function extractParagraphHint(prompt) {
  const m = prompt.match(PARAGRAPH_HINT_RX);
  return m ? m[0] : null;
}

// 이미 자연스럽게 작동하는 케이스 — 그대로 둠
function alreadyOk(prompt) {
  if (/(찾으시오|찾아라|찾으세요|찾아 보세요|찾아\s*보세요|찾아라|찾기)/.test(prompt)) return true;
  return false;
}

// 변환 대상 정밀 판단 — 명확히 "뜻 묻기" 또는 "비트 분석 묻기" 또는 "ALL+모두 누락"만:
//   TYPE 1 — "뜻"/"의미" 단어 포함 + ans 노출
//   TYPE 3 — "{N}째 문단" + 분석 키워드(핵심/관점/생각/개념/특징/이유/소개/설명/정리/방식) + ans 노출
//   ALL 키워드 누락 — ALL 모드 + ans 노출 + "모두" 류 없음
//   그 외(prompt가 풀이형 의미 설명 등)는 잘 돌아갈 가능성이 있어 변환 안 함.
const TYPE1_RX = /(뜻|의미)/;
const TYPE3_RX = /(첫째|둘째|셋째|넷째|다섯째|여섯째|일곱째|여덟째|아홉째|열째|마지막)\s*문단/;
const ANALYZE_RX = /(핵심|관점|생각|개념|특징|이유|소개|설명|정리|방식|구조|작동|적용|활용|역할|효과|관계|반응|변화|영향|대조|한계|대비|차이|문제|결과|원인)/;
const ALL_RX_HAS_MODU = /(모두|전부|모조리|다\s*골라|모든|전체)/;

function shouldFix(prompt, ansText, mode) {
  if (!ansText) return false;
  if (ansText.length < 2) return false; // 1글자 ans는 데이터 오류 의심 — 별도 처리
  if (alreadyOk(prompt)) return false;
  const hasOverlap = prompt.includes(ansText);
  const isShort = prompt.length < ansText.length * 3 + 22; // 단순 패턴만

  // TYPE 1: 뜻/의미 묻기 + ans 노출 + 짧은 prompt (풀이형 제외)
  if (hasOverlap && TYPE1_RX.test(prompt) && isShort) return true;
  // TYPE 3: 비트 분석형 + ans 노출 (이건 길이 무관)
  if (hasOverlap && TYPE3_RX.test(prompt) && ANALYZE_RX.test(prompt)) return true;
  // ALL + 모두 표현 없음 (ans가 prompt에 있을 때만 + 짧은 prompt)
  if (hasOverlap && String(mode).toUpperCase() === 'ALL' && !ALL_RX_HAS_MODU.test(prompt) && isShort) return true;
  return false;
}

// 별도: 데이터 오류 의심 케이스 (1글자 ans + Q-A overlap) 수집용
function isSuspect(prompt, ansText) {
  if (!ansText) return false;
  if (ansText.length >= 2) return false;
  return prompt.includes(ansText);
}

const results = [];
let touched = 0, scanned = 0, fixed = 0;
const fileChanges = new Map();

for (const level of LEVELS) {
  const dir = path.join(DAILY_DIR, level);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter((n) => /^\d{3}\.json$/.test(n)).sort();
  for (const fname of files) {
    const day = fname.slice(0, 3);
    const filePath = path.join(dir, fname);
    let doc;
    try { doc = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { continue; }
    const payload = doc?.payload || doc;
    const cqs = (payload?.confirm?.questions) || [];
    let changedThisFile = false;
    cqs.forEach((q) => {
      scanned += 1;
      const prompt = String(q.prompt || '').trim();
      const ansText = String(q.answerText || '').trim();
      const mode = q.answerMatchMode || '';
      if (!shouldFix(prompt, ansText, mode)) return;
      const hint = extractParagraphHint(prompt);
      const newPrompt = newPromptByLevel(level, ansText, hint);
      results.push({ level, day, qid: q.id || '', oldPrompt: prompt, newPrompt, ansText, mode });
      if (!dryRun) {
        q.prompt = newPrompt;
        changedThisFile = true;
        fixed += 1;
      } else {
        fixed += 1;
      }
    });
    if (changedThisFile) {
      fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
      touched += 1;
    }
  }
}

console.log(`scanned=${scanned}  fix候=${fixed}  files touched=${touched}  (dryRun=${dryRun})`);

if (writeReport || dryRun) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const out = path.join(TMP_DIR, `confirm-fix-report${dryRun?'-dryrun':''}.txt`);
  const lines = [];
  lines.push(`# confirm prompt 변환 보고서 (${results.length}건)`);
  lines.push(`# scanned=${scanned}  fixed=${fixed}  dryRun=${dryRun}`);
  lines.push('');
  // 레벨별 정렬 + 압축 출력 (한 줄당 한 변환)
  for (const r of results) {
    lines.push(`[${r.level}/${r.day}#${r.qid}] (${r.mode})`);
    lines.push(`  OLD: ${r.oldPrompt}`);
    lines.push(`  NEW: ${r.newPrompt}`);
    lines.push(`  ANS: ${r.ansText}`);
    lines.push('');
  }
  fs.writeFileSync(out, lines.join('\n'), 'utf8');
  console.log(`보고서 → ${out}`);
}
