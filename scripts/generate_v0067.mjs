#!/usr/bin/env node
/**
 * V0067 마이그레이션 SQL 생성기.
 * - V0065 에서 _skip 처리됐던 8개 문항의 마크업 보강(별표→밑줄, 괄호 부연 삭제 등) 적용.
 * - 정답은 모두 V0022 그대로 유지 → V0066 의 vector 데이터 보존(stem 만 UPDATE).
 * - choices_json: V0066 에서 생성된 vector 를 보존하면서 text 만 갱신해야 함
 *   → 백엔드 적용 후 V0066 같은 패턴으로 vector 재생성 가능하지만,
 *     본 V0067 에서는 단순히 text 변경 → vector 자동 재계산 안 함.
 *   → 안전을 위해 V0066 의 generate_v0066_vectors.mjs 에 v0067 데이터를 합치고
 *     V0066 와 동일 패턴으로 192문항 vector 를 다시 출력.
 *     본 generator 는 그 파이프라인을 호출하여 V0067 SQL 생성.
 *
 * 출력: backend/.../V0067__diagnostic_skip_markup_2026_04.sql
 */
import fs from "node:fs";
import path from "node:path";
import { questions as v67Questions } from "./v0067_data.mjs";
import { questions as v65Questions } from "./v0065_data.mjs";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const V0022 = path.join(
  PROJECT_ROOT,
  "backend/src/main/resources/db/migration/V0022__seed_diagnostic_v2_data.sql",
);
const OUT_SQL = path.join(
  PROJECT_ROOT,
  "backend/src/main/resources/db/migration/V0067__diagnostic_skip_markup_2026_04.sql",
);

// ── 10대 역량 ──
const COMPETENCIES = [
  "어휘력","문장 독해력","구조 독해력","논리 사고력","어법·문법 능력",
  "국어 개념 적용 능력","국어 관련 배경지식","비문학 배경지식",
  "문제 분석 및 전략 수립 능력","선택지 분석 및 전략 수립 능력",
];

const TYPE_CORRECT_VECTOR = {
  지문근거형: { "문장 독해력": 10, 어휘력: 3, "구조 독해력": 2 },
  논리추론형: { "논리 사고력": 10, "문장 독해력": 5, "구조 독해력": 3 },
  어휘단독형: { 어휘력: 10, "어법·문법 능력": 3, "국어 개념 적용 능력": 2 },
};

const ERROR_PATTERNS = [
  { keywords: ["어법", "문법", "맞춤법", "표기", "띄어쓰기"], vector: { "어법·문법 능력": -5 } },
  { keywords: ["어휘", "단어 의미", "낱말", "어원", "관용", "뜻 오해", "동음"], vector: { 어휘력: -5 } },
  { keywords: ["시제", "인칭", "주어", "서술어", "수식 관계", "문장 성분"], vector: { "문장 독해력": -5 } },
  { keywords: ["인과", "비약", "추론", "전제", "결론", "논리 관계"], vector: { "논리 사고력": -5 } },
  { keywords: ["흐름", "구조", "전개", "문단", "전체 구조"], vector: { "구조 독해력": -5 } },
  { keywords: ["발문", "문제 의도", "지문 외", "엉뚱한 내용"], vector: { "문제 분석 및 전략 수립 능력": -5 } },
  { keywords: ["반대", "정반대", "역의", "매력적 오답", "헷갈리는"], vector: { "선택지 분석 및 전략 수립 능력": -7, "문장 독해력": -3 } },
  { keywords: ["비유", "상징", "수사법", "서사", "갈래", "장르 특성"], vector: { "국어 개념 적용 능력": -5 } },
  { keywords: ["배경지식", "비문학"], vector: { "비문학 배경지식": -5 } },
  { keywords: ["문학사", "작가", "시대", "문학"], vector: { "국어 관련 배경지식": -5 } },
  { keywords: ["심리", "인물 심리", "감정", "정서"], vector: { "문장 독해력": -3, "논리 사고력": -3 } },
];

const META_BONUS_CORRECT = {
  "문제 분석 및 전략 수립 능력": 1,
  "선택지 분석 및 전략 수립 능력": 1,
};

// ── V0022 에서 각 V0067 대상 문항의 questionType, genre 추출 ──
const sql = fs.readFileSync(V0022, "utf8");
const passageGenre = {};
for (const line of sql.split(/\r?\n/)) {
  const pm = line.match(
    /^INSERT INTO diag_passages.*VALUES\s*\(\s*'([^']+)',\s*'[^']+',\s*\d+,\s*'([^']+)'/,
  );
  if (pm) passageGenre[pm[1]] = pm[2];
}

const qInfo = {};
for (const line of sql.split(/\r?\n/)) {
  if (!line.startsWith("INSERT INTO diag_questions")) continue;
  const idM = line.match(/VALUES\s*\(\s*'([^']+)'/);
  if (!idM) continue;
  const id = idM[1];
  const pidM = line.match(/VALUES\s*\(\s*'[^']+',\s*'([^']+)'/);
  const passageId = pidM ? pidM[1] : null;
  const qtypeM = line.match(/'(지문근거형|논리추론형|어휘단독형|구조형|개념적용형|배경지식형|함정형|선택지비교형|서술형)'/);
  qInfo[id] = {
    passageId,
    genre: passageId ? passageGenre[passageId] : null,
    questionType: qtypeM ? qtypeM[1] : null,
  };
}

function vectorForCorrect(questionType, genre) {
  const base = TYPE_CORRECT_VECTOR[questionType] || { "문장 독해력": 10 };
  const bg =
    genre === "비문학" ? { "비문학 배경지식": 3 }
    : genre === "문학" ? { "국어 관련 배경지식": 2 }
    : {};
  return { ...base, ...bg, ...META_BONUS_CORRECT };
}

function vectorForWrong(questionType, errorPath) {
  const ep = (errorPath || "").trim();
  for (const pat of ERROR_PATTERNS) {
    if (pat.keywords.some((kw) => ep.includes(kw))) return pat.vector;
  }
  const typeMap = {
    지문근거형: { "문장 독해력": -5 },
    논리추론형: { "논리 사고력": -5 },
    어휘단독형: { 어휘력: -5 },
  };
  return typeMap[questionType] || { "문장 독해력": -5 };
}

// ── V0067 SQL 생성 ──
const lines = [];
lines.push("-- V0067: 진단 SKIP 문항 마크업 보강 (2026-04-27)");
lines.push("--   V0065 에서 stem/선지 텍스트가 명시되지 않아 _skip 처리됐던 8개 문항의");
lines.push("--   별표→밑줄 변환, 괄호 부연/정답 노출 삭제, 부정어/핵심 어휘 밑줄 적용.");
lines.push("--   정답은 모두 V0022 그대로 유지 → vector 도 V0066 와 동일 패턴으로 재생성.");
lines.push("");

let count = 0;
for (const q of v67Questions) {
  const info = qInfo[q.id];
  if (!info) {
    lines.push(`-- [WARN] ${q.id} — V0022 에 없음, SKIP`);
    continue;
  }
  const { questionType, genre } = info;
  // choices_json 새로 생성 (V0066 와 동일 vector 매핑)
  const choices = q.choices.map((c) => {
    const isCorrect = c.id === q.correct_choice;
    const vec = isCorrect
      ? vectorForCorrect(questionType, genre)
      : vectorForWrong(questionType, "");
    return {
      choice_id: c.id,
      text: c.text,
      vector: vec,
      error_path: isCorrect ? "정답" : "",
    };
  });
  const choicesJson = JSON.stringify(choices).replace(/'/g, "''");
  const stemEsc = q.stem.replace(/'/g, "''");
  lines.push(
    `UPDATE diag_questions SET stem = '${stemEsc}', choices_json = '${choicesJson}', correct_choice = '${q.correct_choice}' WHERE id = '${q.id}';`,
  );
  count++;
}
lines.push("");

// test_questions 재시드 (V0066 와 동일 패턴)
lines.push("-- test_questions 재시드 (stem/choices_json 변경분 반영)");
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

// 또한 V0067 에서 stem 에 <보기> 가 통합된 경우 box_content 를 NULL 로 정리 (이중 표시 방지)
lines.push("-- stem 에 <보기> 가 이미 포함된 V0067 문항은 box_content 비움 (이중 표시 방지)");
for (const q of v67Questions) {
  if (q.stem && q.stem.includes("<보기>")) {
    lines.push(`UPDATE diag_questions SET box_content = NULL WHERE id = '${q.id}';`);
  }
}

const out = lines.join("\n");
fs.writeFileSync(OUT_SQL, out, "utf8");

console.log(`✓ V0067 생성 완료`);
console.log(`  문항 UPDATE: ${count}건`);
console.log(`  → ${OUT_SQL}`);
console.log(`  파일 크기: ${(out.length / 1024).toFixed(1)} KB`);
