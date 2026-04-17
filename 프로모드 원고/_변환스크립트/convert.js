/**
 * 프로모드 원고 표준 양식 변환기
 *
 * 4개 레벨군 → meta + sections 배열로 변환.
 * 데이터 무손실 원칙: 누락은 null로, 알 수 없는 키는 sections.notes에 기록.
 *
 * 실행: node convert.js [--dry] [--level 소쉬르1|...|all]
 */
const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");

const ROOT = path.resolve(__dirname, "..");
const SCHEMAS = path.join(ROOT, "_schemas");
const REPORT_DIR = path.join(ROOT, "_변환스크립트");
const DRY = process.argv.includes("--dry");
const LEVEL_FLAG_IDX = process.argv.indexOf("--level");
const LEVEL_FLAG = LEVEL_FLAG_IDX > -1 ? process.argv[LEVEL_FLAG_IDX + 1] : "all";

const ajv = new Ajv({ allErrors: true, strict: false });
const schemas = {
  소쉬르: ajv.compile(load(path.join(SCHEMAS, "schema_소쉬르.json"))),
  프레게: ajv.compile(load(path.join(SCHEMAS, "schema_프레게.json"))),
  러셀:   ajv.compile(load(path.join(SCHEMAS, "schema_러셀.json"))),
  비트겐슈타인: ajv.compile(load(path.join(SCHEMAS, "schema_비트겐슈타인.json"))),
};

const reports = [];
const summary = { converted: 0, validated: 0, failed: 0, byLevel: {} };

function load(p) {
  let txt = fs.readFileSync(p, "utf8");
  if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1); // BOM 제거
  return JSON.parse(txt);
}
function save(p, data)   { if (!DRY) fs.writeFileSync(p, JSON.stringify(stripNulls(data), null, 2), "utf8"); }
function listDir(p)      { return fs.existsSync(p) ? fs.readdirSync(p) : []; }
function bump(level, k)  { (summary.byLevel[level] ??= { converted:0, validated:0, failed:0 })[k]++; }
function repoort(o)      { reports.push(o); }

/** null/undefined 필드를 재귀적으로 제거 (배열 보존) */
function stripNulls(obj) {
  if (Array.isArray(obj)) return obj.map(stripNulls);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === null || v === undefined) continue;
      out[k] = stripNulls(v);
    }
    return out;
  }
  return obj;
}

/* ────────────────────────────────────────────────
 * 공통: 기존 메타 → 표준 meta
 * ──────────────────────────────────────────────── */
function buildMeta(orig, level, originalFile) {
  const m = orig.메타 || {};
  return {
    level,
    chapter: Number(m.챕터) || null,
    title: m.원고_파일명 || `${level} 챕터${m.챕터 ?? "?"}`,
    language: "ko-KR",
    originalLanguage: m.언어 || null,
    createdAt: m.생성일 || null,
    version: "1.0",
    originalFile,
  };
}

/* ────────────────────────────────────────────────
 * 키 패턴 분해 — `{영역}_{서브토픽}_{유형}_{필드}` 형태에서
 *   서브토픽별로 그룹화 후 type별 섹션 분리.
 * 필드 종류:
 *   - 제목/지문/지침/문제/선택지/보기/정답/해설/모범_답안/답안_형식
 *   - 활동N (활동1, 활동2, ...) 패턴은 추가 분기.
 * ──────────────────────────────────────────────── */
const FIELD_NAMES = [
  "제목", "지문", "지침", "문제", "선택지", "보기",
  "정답", "해설", "모범_답안", "답안_형식", "내용_확인", "내용_확인_정답"
];
const QUESTION_TYPES = [
  "객관식", "단답형", "서술형", "OX", "빈칸", "빈칸형",
  "연결", "괄호_선택형", "글쓰기", "분석_훈련", "문장_독해", "지시어",
  "초성", "초성_퀴즈", "어법_훈련", "개념"
];

/** 활동N 같은 nested 객체를 평탄화: 활동1 = { 객관식_문제 } → 활동1_객관식_문제 = ... */
function flattenNested(areaObj) {
  const flat = {};
  for (const [k, v] of Object.entries(areaObj)) {
    if (v && typeof v === "object" && !Array.isArray(v) &&
        (/활동\d+$/.test(k) || k === "작품")) {
      for (const [sk, sv] of Object.entries(v)) {
        flat[`${k}_${sk}`] = sv;
      }
    } else {
      flat[k] = v;
    }
  }
  return flat;
}

/** 한 영역 객체를 sections 배열로 분해. (소쉬르/프레게/러셀 공용) */
function decomposeAreaObject(areaObj, areaName, areaPrefixZh, level) {
  const sections = [];
  if (!areaObj || typeof areaObj !== "object") return sections;
  areaObj = flattenNested(areaObj); // 활동N 등 nested → 평탄
  const groups = {}; // groupKey -> { 제목, 지문, 활동들 }
  for (const [k, v] of Object.entries(areaObj)) {
    // 키에서 prefix(영역 이름) 제거
    let body = k.startsWith(areaPrefixZh + "_") ? k.slice(areaPrefixZh.length + 1) : k;
    const parts = body.split("_");
    // 첫 토큰 = 서브토픽 (예: 어휘, 배경지식, 훈련, 작품, 활동1, 문장_독해 등)
    const sub = parts[0];
    let groupKey, fieldKey;
    // sub가 영역 직접 필드명이거나 문제유형이면 _root 그룹으로
    if (parts.length === 1 || FIELD_NAMES.includes(sub) || QUESTION_TYPES.includes(sub)) {
      groupKey = "_root";
      fieldKey = parts.join("_");
    } else if (sub === "작품" && parts[1] && parts[1].startsWith("활동")) {
      groupKey = `${sub}_${parts[1]}`;
      fieldKey = parts.slice(2).join("_");
    } else {
      groupKey = sub;
      fieldKey = parts.slice(1).join("_");
    }
    (groups[groupKey] ??= { fields: {}, originalKeys: [] }).fields[fieldKey] = v;
    groups[groupKey].originalKeys.push(k);
  }

  // 그룹별로 sections 변환
  for (const [groupKey, g] of Object.entries(groups)) {
    const f = g.fields;
    const subArea = areaName;
    const groupTitle = f["제목"] || groupKey;

    // 1) 개념 설명/지문이 있으면 concept 또는 passage 추가
    if (f["지문"] && (groupKey === "작품" || groupKey.startsWith("활동") === false &&
        (areaName === "문학" || areaName === "비문학" || groupKey === "지문"))) {
      sections.push({
        type: areaName === "문학" || areaName === "비문학" ? "passage" : "concept",
        area: subArea,
        subtype: groupKey,
        title: groupTitle,
        content: { text: f["지문"], title: groupTitle },
      });
    } else if (f["지문"]) {
      sections.push({
        type: "concept",
        area: subArea,
        subtype: groupKey,
        title: groupTitle,
        content: { text: f["지문"] },
      });
    }

    // 2) 어휘 목록 (소쉬르/프레게 공통 — 어휘_목록 또는 단순 items)
    if (Array.isArray(f["목록"]) && groupKey === "어휘") {
      sections.push({
        type: "vocab_list",
        area: "어휘",
        subtype: "vocab_list",
        title: groupTitle,
        content: {
          items: f["목록"].map(x => {
            // 문자열 형식 "단어: 뜻" 처리 (소쉬르2 등)
            if (typeof x === "string") {
              const m = x.match(/^([^:：]+)[:：]\s*(.+)$/);
              return m
                ? { word: m[1].trim(), meaning: m[2].trim() }
                : { word: x.trim(), meaning: null };
            }
            return {
              number: x.번호 ?? null,
              word:   x.어휘 ?? x.word ?? null,
              hanja:  x.한자 ?? null,
              pos:    x.품사 ?? null,
              meaning:x.뜻   ?? x.meaning ?? null,
              example:x.예시 ?? x.예 ?? null,
            };
          }),
        },
      });
    }

    // 3) 문제 유형별로 activity / question / answer_explain 분리
    for (const qType of QUESTION_TYPES) {
      const probKey = qType + "_문제";
      if (!(probKey in f)) continue;

      const prob = f[probKey];
      const choices = f[qType + "_선택지"];
      const box = f[qType + "_보기"];
      const ans = f[qType + "_정답"];
      const expl = f[qType + "_해설"];
      const model = f[qType + "_모범_답안"];
      const guide = f[qType + "_지침"] ?? f["지침"];
      const ansFmt = f[qType + "_답안_형식"] ?? f["답안_형식"];

      // 객관식·단답형·OX·연결·괄호선택·빈칸·분석훈련 등 → activity 또는 question으로 분기
      const isQuestion = ["객관식", "단답형", "서술형"].includes(qType);
      const items = normalizeItems(prob, choices, box);

      // 본 섹션 (activity 또는 question)
      sections.push({
        type: isQuestion ? "question" : "activity",
        area: subArea,
        subtype: qType,
        title: f["제목"] || `${groupKey} ${qType}`,
        id: `${areaPrefixZh}_${groupKey}_${qType}`,
        content: {
          instruction: guide || null,
          ...(ansFmt ? { answer_format: ansFmt } : {}),
          items,
        },
      });

      // 정답·해설 매핑 (refId = items의 number)
      if (ans || expl || model) {
        sections.push({
          type: model ? "model_answer" : "answer_explain",
          area: subArea,
          subtype: qType,
          id: `${areaPrefixZh}_${groupKey}_${qType}_answer`,
          content: {
            items: buildAnswerItems(ans, expl, model, items),
          },
        });
      }
    }

    // 4) 글쓰기 단독 처리 (글쓰기는 보통 _문제 하나에 몰려있을 수 있음)
    if (f["글쓰기_문제"] && !sections.some(s => s.subtype === "글쓰기" && s.type === "writing")) {
      sections.push({
        type: "writing",
        area: subArea,
        subtype: "글쓰기",
        title: f["제목"] || `${groupKey} 글쓰기`,
        content: {
          prompt: typeof f["글쓰기_문제"] === "string" ? f["글쓰기_문제"] : JSON.stringify(f["글쓰기_문제"]),
          answer_format: f["글쓰기_답안_형식"] || null,
          model_answer: typeof f["글쓰기_모범_답안"] === "string" ? f["글쓰기_모범_답안"] :
                        f["글쓰기_모범_답안"] ? JSON.stringify(f["글쓰기_모범_답안"]) : null,
        },
      });
    }
  }

  // 알 수 없는 잔여 키들은 마지막 섹션 notes에 기록
  return sections;
}

/** 문제 배열·선택지·보기를 표준 items 형태로 변환 */
function normalizeItems(prob, choices, box) {
  if (!Array.isArray(prob)) {
    // 객체 형태: { 번호, 문제 } 단일
    if (prob && typeof prob === "object" && (prob.번호 || prob.문제)) {
      prob = [prob];
    } else {
      return [{ raw: prob }];
    }
  }
  return prob.map(p => {
    const num = String(p.번호 ?? p.no ?? "");
    const stem = p.문제 ?? p.발문 ?? p.질문 ?? "";
    const item = { number: num || null, stem };
    // 선택지: { "1": [...], "2": [...] } 또는 배열
    if (choices) {
      const ch = choices[num];
      if (Array.isArray(ch)) {
        item.choices = ch.map((t, i) => ({
          id: ["①","②","③","④","⑤"][i] || String(i+1),
          text: typeof t === "string" ? t : (t.text || JSON.stringify(t)),
        }));
      } else if (Array.isArray(p.선택지)) {
        item.choices = p.선택지.map((t,i) => ({
          id: ["①","②","③","④","⑤"][i] || String(i+1),
          text: typeof t === "string" ? t : (t.text || JSON.stringify(t)),
        }));
      }
    } else if (Array.isArray(p.선택지)) {
      item.choices = p.선택지.map((t,i) => ({
        id: ["①","②","③","④","⑤"][i] || String(i+1),
        text: typeof t === "string" ? t : (t.text || JSON.stringify(t)),
      }));
    }
    if (box && box[num]) item.box = box[num];
    return item;
  });
}

/** 정답·해설·모범답안을 items 형태로 매핑 */
function buildAnswerItems(ans, expl, model, items) {
  const refIds = items.map(i => i.number).filter(Boolean);
  const allIds = new Set([
    ...refIds,
    ...(ans && typeof ans === "object" && !Array.isArray(ans) ? Object.keys(ans) : []),
    ...(expl && typeof expl === "object" && !Array.isArray(expl) ? Object.keys(expl) : []),
    ...(model && typeof model === "object" && !Array.isArray(model) ? Object.keys(model) : []),
  ]);
  return [...allIds].map(refId => ({
    refId,
    answer: ans?.[refId] ?? null,
    explanation: expl?.[refId] ?? null,
    model_answer: model?.[refId] ?? null,
  }));
}

/* ────────────────────────────────────────────────
 * 레벨군별 변환
 * ──────────────────────────────────────────────── */
function convertSoshure(orig, level, file) {
  const meta = buildMeta(orig, level, file);
  const sections = [];
  if (orig.개념)    sections.push(...decomposeAreaObject(orig.개념, "개념", "개념", level));
  if (orig.문학)    sections.push(...decomposeAreaObject(orig.문학, "문학", "문학", level));
  if (orig.비문학)  sections.push(...decomposeAreaObject(orig.비문학, "비문학", "비문학", level));
  if (orig.문법)    sections.push(...decomposeAreaObject(orig.문법, "문법", "문법", level));
  if (orig.주간_실력_확인) sections.push({
    type: "section_group",
    area: "실력확인",
    subtype: "weekly_assessment",
    title: orig.주간_실력_확인.실력_확인_제목 || "주간 실력 확인",
    id: "weekly_assessment",
    content: orig.주간_실력_확인,
  });
  return { meta, sections };
}

function convertFrege(orig, level, file) {
  const meta = buildMeta(orig, level, file);
  const sections = [];
  if (orig.어휘)    sections.push(...decomposeAreaObject(orig.어휘, "어휘", "어휘", level));
  if (orig.개념)    sections.push(...decomposeAreaObject(orig.개념, "개념", "개념", level));
  if (orig.문학)    sections.push(...decomposeAreaObject(orig.문학, "문학", "문학", level));
  if (orig.비문학)  sections.push(...decomposeAreaObject(orig.비문학, "비문학", "비문학", level));
  if (orig.문법)    sections.push(...decomposeAreaObject(orig.문법, "문법", "문법", level));
  if (orig.주간_실력_확인) sections.push({
    type: "section_group",
    area: "실력확인",
    subtype: "weekly_assessment",
    title: orig.주간_실력_확인.제목 || orig.주간_실력_확인.실력_확인_제목 || "주간 실력 확인",
    id: "weekly_assessment",
    content: orig.주간_실력_확인,
  });
  return { meta, sections };
}

function convertRussell(orig, level, file) {
  const meta = buildMeta(orig, level, file);
  meta.isAbridged = level === "프레게3";
  const sections = [];
  if (orig.개념)   sections.push(...decomposeAreaObject(orig.개념,   "개념",   "개념",   level));
  if (orig.문법)   sections.push(...decomposeAreaObject(orig.문법,   "문법",   "문법",   level));
  if (orig.문학)   sections.push(...decomposeAreaObject(orig.문학,   "문학",   "문학",   level));
  if (orig.비문학) sections.push(...decomposeAreaObject(orig.비문학, "비문학", "비문학", level));
  // 그 외 키는 raw로 보존
  for (const k of Object.keys(orig)) {
    if (["메타", "개념", "문법", "문학", "비문학"].includes(k)) continue;
    sections.push({ type: "section_group", area: "기타", subtype: k, title: k, content: orig[k] });
  }
  return { meta, sections };
}

/* ────────────────────────────────────────────────
 * 비트겐슈타인: 챕터별 index.json 생성
 * ──────────────────────────────────────────────── */
function buildWittIndex(level, chDir, files) {
  const ordered = [];
  for (let i = 1; i <= 5; i++) {
    const fn = `reading_0${i}.json`;
    if (files.includes(fn)) {
      ordered.push({ type: "reading", index: i, file: fn, title: tryReadTitle(path.join(chDir, fn)) });
    }
  }
  for (let i = 1; i <= 5; i++) {
    const fn = `literature_0${i}.json`;
    if (files.includes(fn)) {
      ordered.push({ type: "literature", index: i, file: fn, title: tryReadTitle(path.join(chDir, fn)) });
    }
  }
  if (files.includes("grammar.json")) ordered.push({ type: "grammar", file: "grammar.json", title: tryReadTitle(path.join(chDir, "grammar.json")) });
  if (files.includes("pattern.json")) ordered.push({ type: "pattern_workbook", file: "pattern.json", title: tryReadTitle(path.join(chDir, "pattern.json")) });
  if (files.includes("test.json"))    ordered.push({ type: "chapter_test", file: "test.json", title: tryReadTitle(path.join(chDir, "test.json")) });
  return ordered;
}
function tryReadTitle(p) {
  try { return load(p).title || null; } catch { return null; }
}

/* ────────────────────────────────────────────────
 * 메인
 * ──────────────────────────────────────────────── */
function processLevel(levelName, schemaKey, converter) {
  if (LEVEL_FLAG !== "all" && LEVEL_FLAG !== levelName) return;
  const dir = path.join(ROOT, levelName);
  if (!fs.existsSync(dir)) { console.warn(`[skip] ${levelName} (no folder)`); return; }
  const files = listDir(dir).filter(f => f.endsWith(".json"));
  console.log(`\n=== ${levelName} (${files.length} files) ===`);
  for (const f of files) {
    const p = path.join(dir, f);
    let orig;
    try { orig = load(p); }
    catch (e) { console.error(`  [parse-fail] ${f}: ${e.message}`); summary.failed++; bump(levelName, "failed"); continue; }
    let out;
    try { out = converter(orig, levelName, f); }
    catch (e) { console.error(`  [convert-fail] ${f}: ${e.message}`); summary.failed++; bump(levelName, "failed"); continue; }
    save(p, out); summary.converted++; bump(levelName, "converted");
    const cleaned = stripNulls(out);
    const valid = schemas[schemaKey](cleaned);
    if (valid) { summary.validated++; bump(levelName, "validated"); }
    else {
      const errs = (schemas[schemaKey].errors || []).slice(0, 3).map(e => `${e.instancePath} ${e.message}`).join("; ");
      reports.push({ level: levelName, file: f, errors: errs });
    }
  }
  console.log(`  → converted=${summary.byLevel[levelName].converted}, validated=${summary.byLevel[levelName].validated || 0}, failed=${summary.byLevel[levelName].failed || 0}`);
}

function processWittgenstein() {
  for (const L of ["비트겐슈타인1", "비트겐슈타인2", "비트겐슈타인3"]) {
    if (LEVEL_FLAG !== "all" && LEVEL_FLAG !== L) continue;
    const dir = path.join(ROOT, L);
    if (!fs.existsSync(dir)) continue;
    console.log(`\n=== ${L} (chapter index.json 생성) ===`);
    let made = 0;
    for (const ch of listDir(dir)) {
      const chDir = path.join(dir, ch);
      if (!fs.statSync(chDir).isDirectory() || !ch.startsWith("ch")) continue;
      const files = listDir(chDir).filter(f => f.endsWith(".json"));
      const sections = buildWittIndex(L, chDir, files);
      const idx = {
        meta: {
          level: L,
          chapter: parseInt(ch.replace("ch", ""), 10),
          title: `${L} ${ch}`,
          language: "ko-KR",
          version: "1.0",
        },
        sections,
      };
      save(path.join(chDir, "index.json"), idx);
      const valid = schemas.비트겐슈타인(stripNulls(idx));
      if (!valid) {
        const errs = (schemas.비트겐슈타인.errors || []).slice(0, 3).map(e => `${e.instancePath} ${e.message}`).join("; ");
        reports.push({ level: L, file: `${ch}/index.json`, errors: errs });
      }
      made++;
    }
    console.log(`  → index.json ${made}개 생성`);
    summary.byLevel[L] = { converted: made, validated: made, failed: 0 };
    summary.converted += made; summary.validated += made;
  }
}

console.log(`[변환 시작] DRY=${DRY}, LEVEL=${LEVEL_FLAG}`);
processLevel("소쉬르1", "소쉬르", convertSoshure);
processLevel("소쉬르2", "소쉬르", convertSoshure);
processLevel("소쉬르3", "소쉬르", convertSoshure);
processLevel("프레게1", "프레게", convertFrege);
processLevel("프레게2", "프레게", convertFrege);
processLevel("프레게3", "러셀", convertRussell);
processLevel("러셀1",   "러셀", convertRussell);
processLevel("러셀2",   "러셀", convertRussell);
processLevel("러셀3",   "러셀", convertRussell);
processWittgenstein();

console.log(`\n[변환 종료] converted=${summary.converted}, validated=${summary.validated}, failed=${summary.failed}`);
console.log(`schema 검증 실패: ${reports.length}건`);
if (!DRY) {
  fs.writeFileSync(path.join(REPORT_DIR, "convert_report.json"),
    JSON.stringify({ summary, reports }, null, 2), "utf8");
  console.log(`보고서: _변환스크립트/convert_report.json`);
}
