#!/usr/bin/env node
/**
 * V0065 에서 _skip 처리된 9개 문항의 V0022 원본 stem/choices 를 추출.
 * 마크업 적용 작업의 입력 자료.
 */
import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const V0022 = path.join(
  PROJECT_ROOT,
  "backend/src/main/resources/db/migration/V0022__seed_diagnostic_v2_data.sql",
);

const SKIP_IDS = [
  "S1_NON_P3_Q02",  // 소쉬르 42 — '않은' 밑줄
  "F1_NON_P5_Q03",  // 프레게 43 — <보기> 안 '백성' 밑줄
  "R1_LIT_Q04",     // 러셀 4 — 별표→밑줄 + 괄호 품사 삭제
  "R1_LIT_P3_Q04",  // 러셀 20 — 괄호 정답 노출 삭제
  "R1_NON_P3_Q05",  // 러셀 29 — 괄호 정답 노출 삭제
  "R1_LIT_P5_Q03",  // 러셀 35 — 별표→밑줄
  "R1_LIT_P5_Q05",  // 러셀 37 — 별표→밑줄
  "R1_NON_P5_Q04",  // 러셀 44 — 별표→밑줄
  "W1_NON_Q07",     // 비트겐슈타인 15 — <보기> 별표→밑줄
];

const sql = fs.readFileSync(V0022, "utf8");

for (const id of SKIP_IDS) {
  const lineRegex = new RegExp(`^INSERT INTO diag_questions[^\\n]*'${id}'[^\\n]*$`, "m");
  const m = sql.match(lineRegex);
  if (!m) {
    console.log(`\n━━━ ${id}\n  ❌ 라인 못 찾음`);
    continue;
  }
  const line = m[0];

  // stem 추출 (4번째 ' 와 5번째 ' 사이)
  // VALUES ('id', 'pid', 'tier', 'qtype', 'stem', box, ...
  const fields = [];
  let i = line.indexOf("VALUES (") + 8;
  let cur = "";
  let inQuote = false;
  let bracketDepth = 0;
  while (i < line.length && fields.length < 12) {
    const ch = line[i];
    if (inQuote) {
      if (ch === "\\" && line[i + 1] === "'") {
        cur += "'"; i += 2; continue;
      }
      if (ch === "'" && line[i + 1] === "'") {
        cur += "'"; i += 2; continue;
      }
      if (ch === "'") { inQuote = false; i++; continue; }
      cur += ch; i++; continue;
    } else {
      if (ch === "'") { inQuote = true; i++; continue; }
      if (ch === "[") bracketDepth++;
      if (ch === "]") bracketDepth--;
      if (ch === "," && bracketDepth === 0) {
        fields.push(cur.trim());
        cur = ""; i++; continue;
      }
      if (ch === ")" && bracketDepth === 0) {
        fields.push(cur.trim());
        break;
      }
      cur += ch; i++;
    }
  }

  const [qid, passageId, tier, qtype, stem, boxContent, correctChoice, choicesJsonRaw] = fields;
  console.log(`\n━━━ ${id} (${tier}, ${qtype}, 정답:${correctChoice})`);
  console.log(`  stem: ${stem}`);
  if (boxContent && boxContent !== "NULL") console.log(`  box: ${boxContent}`);
  if (choicesJsonRaw && choicesJsonRaw !== "NULL") {
    try {
      const choices = JSON.parse(choicesJsonRaw.replace(/\\'/g, "'"));
      for (const c of choices) {
        console.log(`    [${c.choice_id}] ${c.text}`);
      }
    } catch (e) {
      console.log(`  choices_json (raw): ${choicesJsonRaw.slice(0, 200)}...`);
      console.log(`  parse error: ${e.message}`);
    }
  }
}
