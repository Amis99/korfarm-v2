#!/usr/bin/env node
/**
 * V0022 진단 시드 SQL을 파싱해서:
 *  - 모든 지문 (id, tier, level, genre, text_md 길이)
 *  - 모든 문항 (id, passage_id, tier, type, stem, correct_choice, choice_count, order_in_passage)
 *  - V0048 ROW_NUMBER 순서로 정렬한 객관식 192개의 (tier, number, question_id) 매핑
 *
 * 출력: scripts/diag_mapping.json
 *   { passages: [...], questions: [...], numbering: { tier → [{number, questionId, passageId, ...}] } }
 *
 * 사용:  node scripts/parse_diag_v0022.mjs
 */
import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const V0022 = path.join(
  PROJECT_ROOT,
  "backend/src/main/resources/db/migration/V0022__seed_diagnostic_v2_data.sql",
);
const OUT = path.join(PROJECT_ROOT, "scripts/diag_mapping.json");

const sql = fs.readFileSync(V0022, "utf8");

// ── 지문 파싱 ──
// INSERT INTO diag_passages (id, tier, level, genre, text_md) VALUES ('S1_LIT_P1', 'sohssure', 1, '문학', '...');
const passages = [];
for (const line of sql.split(/\r?\n/)) {
  const m = line.match(
    /^INSERT INTO diag_passages.*VALUES \('([^']+)',\s*'([^']+)',\s*(\d+),\s*'([^']+)',\s*'(.+)'\);\s*$/s,
  );
  if (m) {
    passages.push({
      id: m[1],
      tier: m[2],
      level: parseInt(m[3], 10),
      genre: m[4],
      textMdLength: m[5].length,
    });
  }
}

// ── 문항 파싱 ──
// INSERT INTO diag_questions (id, passage_id, tier, question_type, stem, box_content, correct_choice, choices_json, model_answer, grading_criteria_json, pair_id, order_in_passage) VALUES ('S1_LIT_Q01', 'S1_LIT_P1', 'sohssure', '지문근거형', '...', NULL, 'C', '[...]', NULL, NULL, NULL, 1);
const questions = [];
const qRegex =
  /^INSERT INTO diag_questions[^V]*VALUES \(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'((?:[^'\\]|\\.)*)',\s*(?:NULL|'((?:[^'\\]|\\.)*)'),\s*(?:NULL|'([^']*)'),\s*'((?:[^'\\]|\\.)*)',\s*(?:NULL|'((?:[^'\\]|\\.)*)'),\s*(?:NULL|'((?:[^'\\]|\\.)*)'),\s*(?:NULL|'([^']*)'),\s*(\d+)\);\s*$/s;

// 정규식으로 멀티라인 안전하게 처리하려면 한 줄씩이 아니라 전체에서 매칭 (각 INSERT가 한 줄에 다 있음을 확인했음)
for (const line of sql.split(/\r?\n/)) {
  if (!line.startsWith("INSERT INTO diag_questions")) continue;
  const m = line.match(qRegex);
  if (!m) {
    // fallback: 더 단순한 파싱 시도 (필드 일부만)
    const simple = line.match(
      /VALUES \('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'/,
    );
    if (simple) {
      // correct_choice 와 order_in_passage 추출
      const cc = line.match(/,\s*(?:NULL|'([A-E])'),\s*'\[/);
      const order = line.match(/,\s*(\d+)\);\s*$/);
      const choices = line.match(/'(\[.+?\])'/);
      const choiceCount = choices ? (choices[1].match(/"choice_id":/g) || []).length : 0;
      questions.push({
        id: simple[1],
        passageId: simple[2],
        tier: simple[3],
        questionType: simple[4],
        correctChoice: cc ? cc[1] || null : null,
        orderInPassage: order ? parseInt(order[1], 10) : null,
        choiceCount,
      });
      continue;
    }
    console.error("[parse-fail]", line.slice(0, 200));
    continue;
  }
  const choicesJson = m[8];
  const choiceCount = (choicesJson.match(/"choice_id":/g) || []).length;
  questions.push({
    id: m[1],
    passageId: m[2],
    tier: m[3],
    questionType: m[4],
    correctChoice: m[7] || null,
    orderInPassage: parseInt(m[11], 10),
    choiceCount,
  });
}

// ── V0048 ROW_NUMBER 순서로 객관식 정렬 ──
//   ROW_NUMBER() OVER (PARTITION BY q.tier ORDER BY p.level, p.id, q.order_in_passage)
const passageById = Object.fromEntries(passages.map((p) => [p.id, p]));
const numbering = {};

for (const tier of ["sohssure", "frege", "russell", "wittgenstein"]) {
  const objQuestions = questions
    .filter((q) => q.tier === tier && q.questionType !== "서술형")
    .map((q) => ({ ...q, passageLevel: passageById[q.passageId]?.level }))
    .sort((a, b) => {
      if (a.passageLevel !== b.passageLevel) return a.passageLevel - b.passageLevel;
      if (a.passageId !== b.passageId) return a.passageId.localeCompare(b.passageId);
      return a.orderInPassage - b.orderInPassage;
    })
    .map((q, i) => ({ number: i + 1, ...q }));
  numbering[tier] = objQuestions;
}

// ── 출력 ──
fs.writeFileSync(
  OUT,
  JSON.stringify({ passages, questions, numbering }, null, 2),
  "utf8",
);

// ── 콘솔 요약 ──
console.log(`✓ V0022 파싱 완료`);
console.log(`  지문: ${passages.length}개`);
console.log(`  문항: ${questions.length}개`);
const objTotal = questions.filter((q) => q.questionType !== "서술형").length;
console.log(`  객관식: ${objTotal}개`);
for (const tier of ["sohssure", "frege", "russell", "wittgenstein"]) {
  console.log(`  ${tier}: ${numbering[tier].length}문항`);
}
console.log(`  → ${OUT}`);
