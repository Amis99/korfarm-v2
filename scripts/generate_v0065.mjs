#!/usr/bin/env node
/**
 * V0065 마이그레이션 SQL 생성기.
 * - scripts/v0065_data.mjs 의 수정 사항을 SQL UPDATE 로 변환.
 * - choices 배열 → choices_json (vector 없이 텍스트만, vector 는 V0066 에서 자동 생성).
 * - test_questions 재시드 (V0048 와 동일 패턴).
 *
 * 출력: backend/src/main/resources/db/migration/V0065__diagnostic_revisions_2026_04.sql
 */
import fs from "node:fs";
import path from "node:path";
import { passages, questions } from "./v0065_data.mjs";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(
  PROJECT_ROOT,
  "backend/src/main/resources/db/migration/V0065__diagnostic_revisions_2026_04.sql",
);

// SQL string escape: ' → '' (MySQL 표준)
function sqlEscape(s) {
  if (s == null) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}

// V0022 에서 기존 choices_json 의 vector 와 error_path 를 보존하기 위해
// 본 V0065 에서는 vector 없이 단순 choices 만 갱신하는 케이스가 대부분.
// → choices 배열만 들어온 경우 vector/error_path 빈 값으로 만들고, V0066 에서 채움.
function buildChoicesJson(choices) {
  return JSON.stringify(
    choices.map((c) => ({
      choice_id: c.id,
      text: c.text,
      vector: {}, // V0066 에서 자동 생성 예정
      error_path: c.id ? "" : "",
    })),
  );
}

const lines = [];
lines.push("-- V0065: 진단 테스트 수정 (2026-04-27)");
lines.push("--   1) 지문 8건 UPDATE (출처/내용 교체, 기호 추가, 밑줄)");
lines.push("--   2) 문항 39건 중 명시 항목 UPDATE (stem/choices/correct_choice)");
lines.push("--   3) test_questions 재시드 (V0048 와 동일 패턴)");
lines.push("--");
lines.push("-- 본 마이그레이션은 V0066 (벡터 자동 생성) 과 함께 적용되어야 합니다.");
lines.push("");

// ── 1. 지문 UPDATE ──
lines.push("-- ─────────────────────────────────────────────────────────────");
lines.push("-- 1) 지문 UPDATE");
lines.push("-- ─────────────────────────────────────────────────────────────");
for (const p of passages) {
  lines.push(`UPDATE diag_passages SET text_md = ${sqlEscape(p.text_md)} WHERE id = ${sqlEscape(p.id)};`);
}
lines.push("");

// ── 2. 문항 UPDATE ──
lines.push("-- ─────────────────────────────────────────────────────────────");
lines.push("-- 2) 문항 UPDATE (사용자 수정안에 명시된 항목만)");
lines.push("-- ─────────────────────────────────────────────────────────────");

let updated = 0;
let skipped = 0;
for (const q of questions) {
  if (q._skip) {
    lines.push(`-- [SKIP] ${q.id} — 사용자 수정안에 stem/선지 명시 안 됨, 별도 처리 필요`);
    skipped++;
    continue;
  }
  const setParts = [];
  if (q.stem !== undefined) setParts.push(`stem = ${sqlEscape(q.stem)}`);
  if (q.correct_choice !== undefined)
    setParts.push(`correct_choice = ${sqlEscape(q.correct_choice)}`);
  if (q.choices_json !== undefined) {
    setParts.push(`choices_json = ${sqlEscape(q.choices_json)}`);
  } else if (q.choices !== undefined) {
    setParts.push(`choices_json = ${sqlEscape(buildChoicesJson(q.choices))}`);
  }
  if (setParts.length === 0) {
    lines.push(`-- [NO-OP] ${q.id} — 변경 사항 없음`);
    continue;
  }
  lines.push(
    `UPDATE diag_questions SET ${setParts.join(", ")} WHERE id = ${sqlEscape(q.id)};`,
  );
  updated++;
}
lines.push("");

// ── 3. test_questions 재시드 ──
lines.push("-- ─────────────────────────────────────────────────────────────");
lines.push("-- 3) test_questions 재시드 (V0048 와 동일 패턴)");
lines.push("--    diag_questions 변경분이 시험지 PDF/OMR 채점에도 반영되도록");
lines.push("-- ─────────────────────────────────────────────────────────────");
lines.push(`DELETE FROM test_questions WHERE test_id LIKE 'diag_paper_%';`);
lines.push("");
lines.push(`INSERT INTO test_questions
    (id, test_id, number, type, domain, sub_domain, passage, stem, points,
     correct_answer, choices_json, choice_explanations_json, intent,
     essay_keywords_json, essay_rubric_json, model_answer, created_at)
SELECT
    CONCAT('diag_tq_', q.id)                                                      AS id,
    CONCAT('diag_paper_', q.tier)                                                 AS test_id,
    ROW_NUMBER() OVER (PARTITION BY q.tier ORDER BY p.level, p.id, q.order_in_passage) AS number,
    '객관식'                                                                       AS type,
    q.question_type                                                               AS domain,
    p.genre                                                                       AS sub_domain,
    p.text_md                                                                     AS passage,
    CASE
        WHEN q.box_content IS NULL OR q.box_content = '' THEN q.stem
        ELSE CONCAT(q.stem, '\\n<보기>\\n', q.box_content)
    END                                                                           AS stem,
    10                                                                            AS points,
    q.correct_choice                                                              AS correct_answer,
    CAST(q.choices_json AS CHAR)                                                  AS choices_json,
    NULL                                                                          AS choice_explanations_json,
    NULL                                                                          AS intent,
    NULL                                                                          AS essay_keywords_json,
    NULL                                                                          AS essay_rubric_json,
    NULL                                                                          AS model_answer,
    NOW(6)                                                                        AS created_at
FROM diag_questions q
JOIN diag_passages  p ON p.id = q.passage_id
WHERE q.question_type <> '서술형';`);
lines.push("");

const out = lines.join("\n");
fs.writeFileSync(OUT, out, "utf8");

console.log(`✓ V0065 생성 완료`);
console.log(`  지문 UPDATE: ${passages.length}건`);
console.log(`  문항 UPDATE: ${updated}건 / SKIP: ${skipped}건`);
console.log(`  → ${OUT}`);
console.log(`  파일 크기: ${(out.length / 1024).toFixed(1)} KB`);
