#!/usr/bin/env node
/**
 * V0066 마이그레이션 SQL 생성기 — 진단 문항 vector 자동 생성.
 *
 * 입력: V0022 (원본) + V0065 (수정안) → 통합 192 객관식 문항
 * 처리:
 *   1) 각 문항 question_type 으로 정답 선지 vector 자동 부여 (개선안 A)
 *   2) error_path 키워드 매칭으로 오답 선지 vector 자동 부여 (개선안 B)
 *   3) 모든 정답에 메타 역량 (문제 분석/선택지 분석) +1 누적 (개선안 C)
 *   4) 기존 vector 폐기, 새 vector 로 교체
 * 검증:
 *   - 10대 역량 측정 빈도 (모든 역량 ≥12회 권장)
 * 출력:
 *   - backend/.../V0066__diagnostic_vectors_v2.sql
 *   - scripts/diag_vector_report.json (빈도 리포트)
 */
import fs from "node:fs";
import path from "node:path";
import { passages as v65Passages, questions as v65Questions } from "./v0065_data.mjs";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const V0022 = path.join(
  PROJECT_ROOT,
  "backend/src/main/resources/db/migration/V0022__seed_diagnostic_v2_data.sql",
);
const OUT_SQL = path.join(
  PROJECT_ROOT,
  "backend/src/main/resources/db/migration/V0066__diagnostic_vectors_v2.sql",
);
const OUT_REPORT = path.join(PROJECT_ROOT, "scripts/diag_vector_report.json");

// ── 10대 역량 ──
const COMPETENCIES = [
  "어휘력",
  "문장 독해력",
  "구조 독해력",
  "논리 사고력",
  "어법·문법 능력",
  "국어 개념 적용 능력",
  "국어 관련 배경지식",
  "비문학 배경지식",
  "문제 분석 및 전략 수립 능력",
  "선택지 분석 및 전략 수립 능력",
];

// ── question_type → 정답 vector 매핑 (개선안 A) ──
//   각 type 에 주역량 + 부역량 + 보조역량(빈도 균형용) 부여
const TYPE_CORRECT_VECTOR = {
  지문근거형: { 문장_독해력: 10, 어휘력: 3, 구조_독해력: 2 },
  논리추론형: { 논리_사고력: 10, 문장_독해력: 5, 구조_독해력: 3 },
  어휘단독형: { 어휘력: 10, "어법·문법_능력": 3, 국어_개념_적용_능력: 2 },
  구조형: { 구조_독해력: 10, 논리_사고력: 5 },
  개념적용형: { 국어_개념_적용_능력: 10, 문장_독해력: 3 },
  배경지식형: { 비문학_배경지식: 10, 문장_독해력: 3 },
  함정형: { 문제_분석_및_전략_수립_능력: 10, 선택지_분석_및_전략_수립_능력: 5 },
  선택지비교형: { 선택지_분석_및_전략_수립_능력: 10, 문장_독해력: 5 },
};

// 키 underscore → space 복원
function denorm(key) {
  return key.replace(/_/g, " ").replace(/어법 문법/g, "어법·문법");
}
function denormVector(v) {
  const out = {};
  for (const [k, val] of Object.entries(v)) {
    out[denorm(k)] = val;
  }
  return out;
}

// ── error_path 키워드 → 음수 vector 매핑 (개선안 B) ──
const ERROR_PATTERNS = [
  // 패턴 우선순위: 위에서 아래로 매칭
  { keywords: ["어법", "문법", "맞춤법", "표기", "띄어쓰기"], vector: { "어법·문법_능력": -5 } },
  { keywords: ["어휘", "단어 의미", "낱말", "어원", "관용", "뜻 오해", "동음"], vector: { 어휘력: -5 } },
  { keywords: ["시제", "인칭", "주어", "서술어", "수식 관계", "문장 성분"], vector: { 문장_독해력: -5 } },
  { keywords: ["인과", "비약", "추론", "전제", "결론", "논리 관계"], vector: { 논리_사고력: -5 } },
  { keywords: ["흐름", "구조", "전개", "문단", "전체 구조"], vector: { 구조_독해력: -5 } },
  { keywords: ["발문", "문제 의도", "지문 외", "엉뚱한 내용"], vector: { 문제_분석_및_전략_수립_능력: -5 } },
  { keywords: ["반대", "정반대", "역의", "매력적 오답", "헷갈리는"], vector: { 선택지_분석_및_전략_수립_능력: -7, 문장_독해력: -3 } },
  { keywords: ["비유", "상징", "수사법", "서사", "갈래", "장르 특성"], vector: { 국어_개념_적용_능력: -5 } },
  { keywords: ["배경지식", "비문학"], vector: { 비문학_배경지식: -5 } },
  { keywords: ["문학사", "작가", "시대", "문학"], vector: { 국어_관련_배경지식: -5 } },
  { keywords: ["심리", "인물 심리", "감정", "정서"], vector: { 문장_독해력: -3, 논리_사고력: -3 } },
];

// 정답 메타 보너스 (개선안 C)
const META_BONUS_CORRECT = {
  문제_분석_및_전략_수립_능력: 1,
  선택지_분석_및_전략_수립_능력: 1,
};

function vectorForCorrect(questionType, genre) {
  const base = TYPE_CORRECT_VECTOR[questionType] || { 문장_독해력: 10 };
  // 지문 장르별 배경지식 자동 보조 — 비문학 ↔ 비문학 배경지식, 문학 ↔ 국어 관련 배경지식
  const bg =
    genre === "비문학"
      ? { 비문학_배경지식: 3 }
      : genre === "문학"
        ? { 국어_관련_배경지식: 2 }
        : {};
  return denormVector({ ...base, ...bg, ...META_BONUS_CORRECT });
}

function vectorForWrong(questionType, errorPath) {
  const ep = (errorPath || "").trim();
  // 패턴 매칭
  for (const pat of ERROR_PATTERNS) {
    if (pat.keywords.some((kw) => ep.includes(kw))) {
      return denormVector(pat.vector);
    }
  }
  // 매칭 실패 → type 기반 디폴트 음수
  const typeMap = {
    지문근거형: { 문장_독해력: -5 },
    논리추론형: { 논리_사고력: -5 },
    어휘단독형: { 어휘력: -5 },
    구조형: { 구조_독해력: -5 },
    개념적용형: { 국어_개념_적용_능력: -5 },
    배경지식형: { 비문학_배경지식: -5 },
    함정형: { 문제_분석_및_전략_수립_능력: -5 },
    선택지비교형: { 선택지_분석_및_전략_수립_능력: -5 },
  };
  return denormVector(typeMap[questionType] || { 문장_독해력: -5 });
}

// ── V0022 파싱 ──
//   각 INSERT 라인에서 (id, passage_id, question_type, correct_choice, choices_json) 추출
//   + diag_passages 라인에서 (id, genre) 추출 → 매핑
function parseV0022() {
  const sql = fs.readFileSync(V0022, "utf8");
  const result = [];
  const passageGenre = {};
  for (const line of sql.split(/\r?\n/)) {
    const pm = line.match(
      /^INSERT INTO diag_passages.*VALUES\s*\(\s*'([^']+)',\s*'[^']+',\s*\d+,\s*'([^']+)'/,
    );
    if (pm) passageGenre[pm[1]] = pm[2];
  }
  for (const line of sql.split(/\r?\n/)) {
    if (!line.startsWith("INSERT INTO diag_questions")) continue;
    // VALUES (...) 안에서 필드 추출
    // 필드 순서: id, passage_id, tier, question_type, stem, box_content, correct_choice, choices_json, ...
    // 가장 까다로운 건 stem 안의 ' 와 choices_json. choices_json 은 JSON 이라 ' 가 거의 없음.
    // 안전한 추출: id 와 choices_json 만 정확히 잡으면 됨.
    const idM = line.match(/VALUES\s*\(\s*'([^']+)'/);
    const typeM = line.match(/'([^']+)',\s*'([^']*)',\s*(?:NULL|'(?:[^']|'')*'),\s*(NULL|'[A-E]'),\s*'\[/);
    // 보다 단순하게: question_type, correct_choice, choices_json 을 따로 정규식으로 잡기
    // question_type 은 4번째 단일따옴표 필드 ('객관식' 분류에 있을 수 있음 → '지문근거형','논리추론형','어휘단독형','서술형' 만)
    const qtypeM = line.match(/'(지문근거형|논리추론형|어휘단독형|구조형|개념적용형|배경지식형|함정형|선택지비교형|서술형)'/);
    const ccM = line.match(/,\s*(NULL|'([A-E])'),\s*'\[/);
    // choices_json: '[ ... ]' — JSON 안에는 ' 가 없을 가능성 높지만, 한국어 텍스트에 \' 가 들어갈 수 있음 → V0022 는 단순 문자열만
    // 가장 큰 [ ... ] 전체를 발라냄
    const cjMatch = line.match(/'(\[\{.*?\}\])'\s*,\s*(?:NULL|'[^']*')\s*,\s*(?:NULL|'[^']*')\s*,\s*(?:NULL|'[^']*')\s*,\s*\d+\);\s*$/);
    if (!idM || !qtypeM || !cjMatch) {
      // 서술형은 choices_json 이 '[]' 빈 배열 → 별도 매칭
      const emptyMatch = line.match(/'(\[\])'/);
      if (qtypeM && qtypeM[1] === "서술형" && emptyMatch && idM) {
        const pm2 = line.match(/VALUES\s*\(\s*'[^']+',\s*'([^']+)'/);
        const pid2 = pm2 ? pm2[1] : null;
        result.push({
          id: idM[1],
          passageId: pid2,
          genre: pid2 ? passageGenre[pid2] : null,
          questionType: "서술형",
          correctChoice: null,
          choicesJson: "[]",
          choices: [],
        });
      }
      continue;
    }
    const id = idM[1];
    const passageIdM = line.match(/VALUES\s*\(\s*'[^']+',\s*'([^']+)'/);
    const passageId = passageIdM ? passageIdM[1] : null;
    const genre = passageId ? passageGenre[passageId] : null;
    const questionType = qtypeM[1];
    const correctChoice = ccM ? ccM[2] : null;
    const choicesJsonStr = cjMatch[1];
    // MySQL extended escape 디코딩: \' → ' (작은따옴표 backslash escape)
    // 다른 escape (\\, \n, \t, \") 는 JSON 표준이므로 그대로 둠
    const decoded = choicesJsonStr.replace(/\\'/g, "'");
    let choices;
    try {
      choices = JSON.parse(decoded);
    } catch (e) {
      console.error("[parse-fail] choices_json", id, e.message, "@", decoded.slice(0, 60));
      continue;
    }
    result.push({ id, passageId, genre, questionType, correctChoice, choicesJson: choicesJsonStr, choices });
  }
  return result;
}

// ── V0065 변경분 적용 (덮어쓰기) ──
function applyV0065(v22Questions) {
  const map = new Map(v22Questions.map((q) => [q.id, q]));
  for (const q of v65Questions) {
    if (q._skip) continue;
    const existing = map.get(q.id);
    if (!existing) {
      // 신규 문항이면 추가 — V0065 데이터에서 기본 정보 추출
      console.warn(`[v65-new] ${q.id} — V0022 에 없음, 추가`);
      map.set(q.id, {
        id: q.id,
        questionType: existing?.questionType || "지문근거형",
        correctChoice: q.correct_choice ?? existing?.correctChoice ?? null,
        choices:
          q.choices?.map((c) => ({
            choice_id: c.id,
            text: c.text,
            vector: {},
            error_path: "",
          })) || [],
      });
      continue;
    }
    const updated = { ...existing };
    if (q.correct_choice !== undefined) updated.correctChoice = q.correct_choice;
    if (q.choices !== undefined) {
      // V0065 의 새 선지로 교체. error_path 는 정답이면 "정답", 오답이면 빈 문자열 (분류 못함)
      // 기존 V0022 의 error_path 를 가져올 수 있다면 가져옴 (선지 ID 매칭)
      const oldByChoice = new Map(
        (existing.choices || []).map((c) => [c.choice_id, c]),
      );
      updated.choices = q.choices.map((c) => {
        const old = oldByChoice.get(c.id);
        const isCorrect = c.id === updated.correctChoice;
        return {
          choice_id: c.id,
          text: c.text,
          vector: {}, // 어차피 새로 생성
          error_path: isCorrect ? "정답" : old?.error_path || "",
        };
      });
    }
    map.set(q.id, updated);
  }
  return Array.from(map.values());
}

// ── vector 자동 생성 ──
function generateVectors(questions) {
  const touchCount = Object.fromEntries(COMPETENCIES.map((c) => [c, 0]));

  for (const q of questions) {
    if (q.questionType === "서술형") continue;
    if (!q.choices || q.choices.length === 0) continue;
    for (const choice of q.choices) {
      const isCorrect = choice.choice_id === q.correctChoice;
      const vec = isCorrect
        ? vectorForCorrect(q.questionType, q.genre)
        : vectorForWrong(q.questionType, choice.error_path);
      choice.vector = vec;
      // 정답이면 error_path 도 '정답' 으로 통일
      if (isCorrect) choice.error_path = "정답";
      // 빈도 카운트 (touch_count는 학생이 그 선지를 골랐을 때 증가하는데,
      // 측정 빈도 = "그 역량이 얼마나 자주 vector 에 등장하는가" 의미로 카운트)
      for (const k of Object.keys(vec)) {
        if (k in touchCount) touchCount[k]++;
      }
    }
  }
  return touchCount;
}

// ── V0066 SQL 생성 ──
function buildSql(questions) {
  const lines = [];
  lines.push("-- V0066: 진단 문항 vector 자동 재생성 (2026-04-27)");
  lines.push("--   - V0022 의 모든 객관식 192 문항 + V0065 수정분 통합 후");
  lines.push("--   - question_type 기반 정답 vector + error_path 키워드 기반 오답 vector");
  lines.push("--   - 메타 역량 (문제 분석 / 선택지 분석) 자동 누적");
  lines.push("-- 본 마이그레이션은 V0065 와 함께 적용되어야 합니다.");
  lines.push("");

  for (const q of questions) {
    if (q.questionType === "서술형") continue;
    if (!q.choices || q.choices.length === 0) continue;
    const choicesJson = JSON.stringify(q.choices);
    const escaped = choicesJson.replace(/'/g, "''");
    lines.push(
      `UPDATE diag_questions SET choices_json = '${escaped}' WHERE id = '${q.id}';`,
    );
  }
  lines.push("");

  // test_questions 도 재시드 (vector 변경분 반영)
  lines.push("-- test_questions 의 choices_json 갱신 (V0048 재시드 패턴, vector 포함)");
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

  return lines.join("\n");
}

// ── 실행 ──
const v22 = parseV0022();
console.log(`✓ V0022 파싱: ${v22.length} 문항`);

const merged = applyV0065(v22);
console.log(`✓ V0065 병합 후: ${merged.length} 문항`);

const objQuestions = merged.filter((q) => q.questionType !== "서술형");
console.log(`  객관식: ${objQuestions.length}`);

const touchCount = generateVectors(merged);

// 빈도 리포트
console.log("\n── 역량 측정 빈도 (vector 등장 횟수) ──");
for (const c of COMPETENCIES) {
  const cnt = touchCount[c];
  const flag = cnt < 12 ? " ⚠️ 부족" : "";
  console.log(`  ${c}: ${cnt}${flag}`);
}

const sql = buildSql(merged);
fs.writeFileSync(OUT_SQL, sql, "utf8");
console.log(`\n✓ V0066 생성 완료`);
console.log(`  → ${OUT_SQL}`);
console.log(`  파일 크기: ${(sql.length / 1024).toFixed(1)} KB`);

fs.writeFileSync(
  OUT_REPORT,
  JSON.stringify({ touchCount, totalQuestions: objQuestions.length }, null, 2),
  "utf8",
);
console.log(`  → ${OUT_REPORT}`);
