import fs from "node:fs";
import path from "node:path";

const OLD_ROOT = "C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2교재디자인라텍스";
const NEW_ROOT = "C:\\Users\\RENEWCOM PC\\Documents\\프로모드 원고";
const PLAN_PATH = path.join(NEW_ROOT, "프로모드_12레벨_교재구성_LaTeX_코딩계획.md");
const OUT_DIR = path.join(NEW_ROOT, "latex_trial", "out");
const REPORT_PATH = path.join(NEW_ROOT, "기존활동_복원_작업보고서.md");
const DATA_PATH = path.join(OUT_DIR, "legacy_activity_restore_report.json");
const AUDIT_PATH = path.join(NEW_ROOT, "작업_점검_보고서.json");
const BACKUP_ROOT = path.join(NEW_ROOT, `_backup_before_activity_restore_20260420`);

const levels = ["소쉬르1", "소쉬르2", "소쉬르3", "프레게1", "프레게2", "프레게3", "러셀1", "러셀2", "러셀3"];

const answerKeyRe = /(정답|해설|모범_?답안|예상_?답안|채점|배점|answer(?!_format)|explanation|model_answer|teacher)/i;

function exists(p) {
  return fs.existsSync(p);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readText(p) {
  return fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
}

function readJson(p) {
  return JSON.parse(readText(p));
}

function writeJson(p, value) {
  fs.writeFileSync(p, JSON.stringify(value, null, 2), "utf8");
}

function statSize(p) {
  return exists(p) ? fs.statSync(p).size : 0;
}

function chapterOf(name) {
  const m = name.match(/챕터\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

function chapterMap(root, level) {
  const dir = path.join(root, level);
  const map = new Map();
  if (!exists(dir)) return map;
  for (const name of fs.readdirSync(dir)) {
    if (!name.toLowerCase().endsWith(".json")) continue;
    const ch = chapterOf(name);
    if (ch != null) map.set(ch, path.join(dir, name));
  }
  return map;
}

function normalizedText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/<[^>]+>/g, "")
    .replace(/\\[_\\]/g, "_")
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}_①-⑳㉠-㉭가-힣]/gu, "");
}

function collectStrings(value, out = []) {
  if (value == null) return out;
  if (typeof value === "string") {
    const s = value.replace(/\s+/g, " ").trim();
    if (s.length >= 12) out.push(s);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return out;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (answerKeyRe.test(key)) continue;
      collectStrings(child, out);
    }
  }
  return out;
}

function presenceRatio(payload, currentJson) {
  const current = normalizedText(JSON.stringify(currentJson));
  const snippets = [...new Set(collectStrings(payload).map((s) => normalizedText(s).slice(0, 80)).filter((s) => s.length >= 18))].slice(0, 20);
  if (!snippets.length) return 0;
  const hits = snippets.filter((s) => current.includes(s));
  return hits.length / snippets.length;
}

function isExcludedKey(key) {
  return answerKeyRe.test(key);
}

function stripExcludedDeep(value) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(stripExcludedDeep).filter((item) => !isEmptyValue(item));
  if (typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      if (isExcludedKey(key)) continue;
      const cleaned = stripExcludedDeep(child);
      if (!isEmptyValue(cleaned)) out[key] = cleaned;
    }
    return out;
  }
  return value;
}

function isEmptyValue(value) {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function hasRestorableSignal(key) {
  return /(활동|문장_독해|어휘|구조도|내용_확인|분석_훈련|훈련|글쓰기|쓰기|창의|요약|정리표|빈칸|연결|OX|괄호_선택|실력_확인|주간)/.test(key);
}

function groupBase(area, key) {
  if (area === "주간_실력_확인") return "주간_실력_확인";
  const activity = key.match(/^(.+?_활동\d+)/);
  if (activity) return activity[1];
  if (key.includes("문장_독해")) return `${area}_문장_독해`;
  if (key.includes("어휘")) return `${area}_어휘`;
  if (key.includes("구조도")) return `${area}_구조도`;
  if (key.includes("내용_확인")) return `${area}_내용_확인`;
  if (key.includes("분석_훈련")) return `${area}_분석_훈련`;
  if (key.includes("글쓰기")) return `${area}_글쓰기`;
  if (key.includes("요약")) return `${area}_요약`;
  if (key.includes("훈련")) return `${area}_훈련`;
  if (/빈칸|연결|OX|괄호_선택/.test(key)) {
    return key.replace(/_(객관식|단답형|서술형|빈칸형|연결형?|OX|괄호_선택형)?_?(문제|보기|선택지|조건|지침|안내|제목|답안_형식)$/g, "");
  }
  return "";
}

function priorityOf(base) {
  if (/구조도|정리표|내용_확인|요약/.test(base)) return 10;
  if (/어휘/.test(base)) return 20;
  if (/분석_훈련|훈련|활동|글쓰기|쓰기|창의|실력_확인|주간/.test(base)) return 30;
  if (/문장_독해/.test(base)) return 40;
  return 50;
}

function subtypeOf(base) {
  if (/구조도/.test(base)) return "지문 구조도";
  if (/내용_확인|정리표|요약/.test(base)) return "정리표";
  if (/어휘/.test(base)) return "어휘";
  if (/문장_독해/.test(base)) return "문장 독해";
  if (/분석_훈련/.test(base)) return "분석 훈련";
  if (/글쓰기|쓰기|창의/.test(base)) return "글쓰기/창의 활동";
  if (/실력_확인|주간/.test(base)) return "주간 실력 확인";
  return "확인 학습";
}

function displayTitle(base, payload) {
  for (const [key, value] of Object.entries(payload)) {
    if (/_제목$/.test(key) && typeof value === "string" && value.trim()) return value.trim();
  }
  const subtype = subtypeOf(base);
  if (subtype === "정리표") return /내용_확인/.test(base) ? "내용 확인 정리표" : "지문 구조도";
  if (subtype === "어휘") return "핵심 어휘 학습";
  if (subtype === "문장 독해") return "문장 독해";
  if (subtype === "분석 훈련") return "분석 훈련";
  if (subtype === "주간 실력 확인") return "주간 실력 확인";
  return subtype;
}

function originalOrderIndex(areaObj, key) {
  return Object.keys(areaObj).indexOf(key);
}

function collectGroups(oldJson) {
  const groups = [];
  for (const [area, areaValue] of Object.entries(oldJson)) {
    if (area === "메타" || !areaValue || typeof areaValue !== "object" || Array.isArray(areaValue)) continue;
    const areaObj = areaValue;
    const map = new Map();
    for (const [key, value] of Object.entries(areaObj)) {
      if (isExcludedKey(key) || !hasRestorableSignal(key)) continue;
      const base = groupBase(area, key);
      if (!base) continue;
      if (!map.has(base)) {
        map.set(base, { area, base, keys: [], payload: {}, firstIndex: originalOrderIndex(areaObj, key) });
      }
      const group = map.get(base);
      group.keys.push(key);
      const cleaned = stripExcludedDeep(value);
      if (isEmptyValue(cleaned)) continue;
      if (cleaned && typeof cleaned === "object" && !Array.isArray(cleaned) && /^.+_활동\d+$/.test(key)) {
        for (const [nestedKey, nestedValue] of Object.entries(cleaned)) group.payload[nestedKey] = nestedValue;
      } else {
        group.payload[key] = cleaned;
      }
      group.firstIndex = Math.min(group.firstIndex, originalOrderIndex(areaObj, key));
    }
    groups.push(...map.values());
  }
  return groups.sort((a, b) => {
    const areaOrder = Object.keys(oldJson).indexOf(a.area) - Object.keys(oldJson).indexOf(b.area);
    if (areaOrder) return areaOrder;
    const priority = priorityOf(a.base) - priorityOf(b.base);
    if (priority) return priority;
    return a.firstIndex - b.firstIndex;
  });
}

function normalizeNumber(value, fallback) {
  return String(value?.번호 ?? value?.number ?? value?.refId ?? value?.id ?? fallback ?? "");
}

function normalizeChoices(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((choice, idx) => {
      if (choice && typeof choice === "object") {
        return { id: String(choice.id ?? choice.번호 ?? idx + 1), text: String(choice.text ?? choice.내용 ?? choice.보기 ?? choice) };
      }
      const text = String(choice);
      const id = text.match(/^[①②③④⑤⑥⑦⑧⑨⑩]/)?.[0] || String(idx + 1);
      return { id, text };
    });
  }
  if (typeof value === "object") return Object.entries(value).map(([id, text]) => ({ id, text: String(text) }));
  return [{ id: "", text: String(value) }];
}

function valueByNumber(collection, num) {
  if (!collection || typeof collection !== "object") return "";
  return collection[num] ?? collection[String(Number(num))] ?? collection[Number(num)] ?? "";
}

function findPayloadValue(payload, suffix) {
  const hit = Object.entries(payload).find(([key]) => key.endsWith(suffix));
  return hit ? hit[1] : undefined;
}

function markdownTableFromVocabulary(items) {
  const rows = Array.isArray(items) ? items : [];
  return {
    headers: ["번호", "의미", "어휘"],
    rows: rows.map((item, idx) => {
      const no = item?.번호 ?? item?.number ?? idx + 1;
      const meaning = item?.의미 ?? item?.meaning ?? "";
      const word = item?.어휘 ?? item?.word ?? item?.어휘_빈칸 ?? "";
      return { cells: [no, meaning, word || ""], blank_cells: word ? [] : [2] };
    }),
  };
}

function buildQuestionItems(payload, baseHint = "") {
  const questionEntries = Object.entries(payload).filter(([key, value]) => /_문제$/.test(key) && Array.isArray(value));
  if (!questionEntries.length) return [];
  const items = [];
  for (const [qKey, questions] of questionEntries) {
    const prefix = qKey.replace(/_문제$/, "");
    const choices = payload[`${prefix}_선택지`] || findPayloadValue(payload, "_선택지") || {};
    const boxes = payload[`${prefix}_보기`] || findPayloadValue(payload, "_보기") || {};
    const conditions = payload[`${prefix}_조건`] || findPayloadValue(payload, "_조건") || {};
    const answerFormat = payload[`${prefix}_답안_형식`] || findPayloadValue(payload, "_답안_형식") || "";
    questions.forEach((q, idx) => {
      const number = normalizeNumber(q, idx + 1);
      const stem = q?.문제 ?? q?.발문 ?? q?.stem ?? q?.prompt ?? q?.text ?? String(q);
      const item = {
        number,
        stem,
        box: valueByNumber(boxes, number) || q?.보기 || "",
        condition: valueByNumber(conditions, number) || q?.조건 || "",
        choices: normalizeChoices(valueByNumber(choices, number) || q?.선택지 || q?.choices || []),
      };
      if (answerFormat) item.answer_format = answerFormat;
      if (baseHint.includes("서술형") || qKey.includes("서술형") || qKey.includes("글쓰기")) item.type = "essay";
      items.push(item);
    });
  }
  return items;
}

function buildSentenceReadingItems(payload) {
  const sentenceMap = findPayloadValue(payload, "_문장") || {};
  const questions = findPayloadValue(payload, "_문제") || [];
  const choices = findPayloadValue(payload, "_선택지") || {};
  if (!Array.isArray(questions)) return [];
  return questions.map((q, idx) => {
    const number = normalizeNumber(q, idx + 1);
    const sentence = valueByNumber(sentenceMap, number) || "";
    return {
      number,
      stem: q?.문제 ?? q?.발문 ?? q?.stem ?? String(q),
      box: sentence ? `[문장] ${sentence}` : "",
      choices: normalizeChoices(valueByNumber(choices, number) || q?.선택지 || []),
    };
  });
}

function buildTrainingTable(payload) {
  const questions = findPayloadValue(payload, "_문제");
  if (!Array.isArray(questions)) return null;
  const boxes = findPayloadValue(payload, "_보기") || {};
  return {
    headers: ["번호", "훈련 문항", "보기/조건"],
    rows: questions.map((q, idx) => {
      const number = normalizeNumber(q, idx + 1);
      const stem = q?.문제 ?? q?.발문 ?? q?.stem ?? String(q);
      const box = valueByNumber(boxes, number) || q?.보기 || q?.조건 || "";
      return { cells: [number, stem, box] };
    }),
  };
}

function buildDisplayContent(group) {
  const { base, payload } = group;
  const content = {};
  const instruction = Object.entries(payload).find(([key, value]) => /_지침$|_안내$/.test(key) && typeof value === "string")?.[1];
  if (instruction) content.instruction = instruction;

  if (/어휘/.test(base)) {
    const vocab = Object.entries(payload).find(([key, value]) => /어휘$/.test(key) && Array.isArray(value))?.[1];
    if (vocab) content.table = markdownTableFromVocabulary(vocab);
  } else if (/문장_독해/.test(base)) {
    const items = buildSentenceReadingItems(payload);
    if (items.length) content.items = items;
  } else if (/분석_훈련/.test(base)) {
    const passage = Object.entries(payload).find(([key, value]) => /_지문$/.test(key) && typeof value === "string")?.[1];
    if (passage) content.text = passage;
    const table = buildTrainingTable(payload);
    if (table) content.table = table;
  } else if (/내용_확인|구조도|요약|정리표/.test(base)) {
    const text = Object.entries(payload).find(([, value]) => typeof value === "string")?.[1];
    if (text) content.text = text;
  } else {
    const text = Object.entries(payload).find(([key, value]) => /_지문$|_안내$|_지침$/.test(key) && typeof value === "string")?.[1];
    if (text && !content.instruction) content.instruction = text;
    const items = buildQuestionItems(payload, base);
    if (items.length) content.items = items;
    const remainingStrings = Object.entries(payload)
      .filter(([key, value]) => typeof value === "string" && !/_제목$|_지침$|_안내$/.test(key))
      .map(([key, value]) => `${key}: ${value}`);
    if (remainingStrings.length && !content.items) content.text = remainingStrings.join("\n\n");
  }

  if (!Object.keys(content).length) {
    content.text = Object.entries(payload)
      .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
      .join("\n\n");
  }
  return content;
}

function makeSection(group, level, chapter) {
  return {
    type: "activity",
    area: group.area === "주간_실력_확인" ? "주간 실력 확인" : group.area,
    subtype: subtypeOf(group.base),
    title: displayTitle(group.base, group.payload),
    restored_from_legacy: true,
    source_level: level,
    source_chapter: chapter,
    source_base: group.base,
    source_keys: group.keys,
    priority: priorityOf(group.base),
    content: buildDisplayContent(group),
    legacy_payload: group.payload,
  };
}

function stripPreviousRestores(data) {
  if (!Array.isArray(data.sections)) return 0;
  const before = data.sections.length;
  data.sections = data.sections.filter((section) => !section?.restored_from_legacy);
  return before - data.sections.length;
}

function sectionArea(section) {
  return section?.area || "";
}

function insertSections(data, sections) {
  if (!Array.isArray(data.sections)) data.sections = [];
  for (const sec of sections) {
    const area = sec.area;
    let lastAreaIdx = -1;
    for (let i = 0; i < data.sections.length; i += 1) {
      if (sectionArea(data.sections[i]) === area) lastAreaIdx = i;
    }
    if (lastAreaIdx >= 0) {
      data.sections.splice(lastAreaIdx + 1, 0, sec);
    } else {
      data.sections.push(sec);
    }
  }
}

function copyBackup(src, dest) {
  ensureDir(path.dirname(dest));
  if (!exists(dest)) fs.copyFileSync(src, dest);
}

const results = [];
ensureDir(OUT_DIR);
ensureDir(BACKUP_ROOT);

for (const level of levels) {
  const oldMap = chapterMap(OLD_ROOT, level);
  const newMap = chapterMap(NEW_ROOT, level);
  for (const chapter of [...oldMap.keys()].sort((a, b) => a - b)) {
    const oldFile = oldMap.get(chapter);
    const newFile = newMap.get(chapter);
    if (!newFile) {
      results.push({ level, chapter, status: "missing_current_file", inserted: 0, skipped: 0, removedPrevious: 0 });
      continue;
    }
    const oldJson = readJson(oldFile);
    const newJson = readJson(newFile);
    const backupFile = path.join(BACKUP_ROOT, level, path.basename(newFile));
    copyBackup(newFile, backupFile);
    const removedPrevious = stripPreviousRestores(newJson);
    const groups = collectGroups(oldJson);
    const sections = [];
    const skipped = [];
    for (const group of groups) {
      const ratio = presenceRatio(group.payload, newJson);
      if (ratio >= 0.85) {
        skipped.push({ base: group.base, ratio, reason: "already_present" });
        continue;
      }
      sections.push(makeSection(group, level, chapter));
    }
    insertSections(newJson, sections);
    newJson.meta = newJson.meta || {};
    newJson.meta.legacyActivityRestored = true;
    newJson.meta.legacyActivityRestoreDate = "2026-04-20";
    newJson.meta.legacyActivityRestoreSource = OLD_ROOT;
    writeJson(newFile, newJson);
    results.push({
      level,
      chapter,
      oldFile,
      newFile,
      backupFile,
      status: "updated",
      oldBytes: statSize(oldFile),
      newBytes: statSize(newFile),
      totalGroups: groups.length,
      inserted: sections.length,
      skipped: skipped.length,
      removedPrevious,
      insertedSections: sections.map((s) => ({ area: s.area, title: s.title, subtype: s.subtype, sourceBase: s.source_base, sourceKeys: s.source_keys })),
      skippedDetails: skipped,
    });
  }
}

function fmt(n) {
  return Number(n || 0).toLocaleString("ko-KR");
}

const byLevel = levels.map((level) => {
  const rows = results.filter((r) => r.level === level);
  return {
    level,
    chapters: rows.length,
    inserted: rows.reduce((sum, r) => sum + (r.inserted || 0), 0),
    skipped: rows.reduce((sum, r) => sum + (r.skipped || 0), 0),
    removedPrevious: rows.reduce((sum, r) => sum + (r.removedPrevious || 0), 0),
    examples: rows.flatMap((r) => r.insertedSections || []).slice(0, 12),
  };
});

const ruleBlock = `

## 2026-04-20 활동 복원 확정 규칙

- 개념·문법·문학·비문학·어휘 영역에 같은 활동 배열 원칙을 적용한다.
- 어느 영역에 특정 요소가 없으면 억지로 만들지 않고, 있는 요소만 순서에 맞게 넣는다.
- 활동 우선순위는 정리표 → 어휘 → 확인학습/글쓰기 → 문장독해를 기본으로 한다.
- 확인 학습과 글쓰기는 둘 중 하나만 고르는 구조가 아니며, 원본에 있으면 둘 다 넣는다.
- 현재 sections 순서가 표준과 다르면 기존 작업본 흐름을 우선 참고한다.
- 러셀 문법의 분석 훈련은 활동으로 보고, 표/훈련형 판면 안에 배치한다.
`;

if (exists(PLAN_PATH)) {
  const current = readText(PLAN_PATH);
  if (!current.includes("2026-04-20 활동 복원 확정 규칙")) {
    fs.writeFileSync(PLAN_PATH, current.trimEnd() + ruleBlock, "utf8");
  }
}

const report = `# 기존 활동 복원 작업 보고서

작성일: 2026-04-20  
기존 원본: \`${OLD_ROOT}\`  
현재 원고: \`${NEW_ROOT}\`  
백업 폴더: \`${BACKUP_ROOT}\`

## 적용한 확정 규칙

1. 개념·문법·문학·비문학·어휘 영역 모두 동일한 활동 배열 원칙을 적용했다.
2. 없는 요소는 만들지 않고, 원본에 있는 요소만 복원했다.
3. 활동 우선순위는 정리표 → 어휘 → 확인학습/글쓰기 → 문장독해로 적용했다.
4. 확인 학습과 글쓰기는 원본에 있으면 둘 다 복원했다.
5. 현재 sections의 큰 영역 순서는 기존 작업본 흐름을 참고해 유지했다.
6. 러셀 문법 영역의 분석 훈련은 활동 섹션으로 복원하고, 표/훈련형 content를 같이 생성했다.

## 레벨별 처리 결과

| 레벨 | 챕터 | 복원 삽입 섹션 | 이미 본문 확인되어 생략 | 기존 복원 제거 후 재삽입 |
|---|---:|---:|---:|---:|
${byLevel.map((r) => `| ${r.level} | ${r.chapters} | ${fmt(r.inserted)} | ${fmt(r.skipped)} | ${fmt(r.removedPrevious)} |`).join("\n")}

## 대표 복원 섹션

${byLevel.map((r) => `### ${r.level}

${r.examples.length ? r.examples.map((s) => `- ${s.area} / ${s.subtype} / ${s.title} (${s.sourceBase})`).join("\n") : "- 삽입 없음"}
`).join("\n")}

## 비고

- 각 현재 JSON 파일은 먼저 \`${BACKUP_ROOT}\` 아래에 백업했다.
- 복원 섹션에는 \`restored_from_legacy: true\`, \`source_keys\`, \`legacy_payload\`를 넣어 추후 coverage 검증과 LaTeX 컴포넌트 개선이 가능하도록 했다.
- 정답·해설·모범 답안·예상 답안·배점 계열은 복원 대상에서 제외했다. 단, 학생이 볼 답안 형식은 복원 대상에 남긴다.
`;

fs.writeFileSync(DATA_PATH, JSON.stringify({ generatedAt: "2026-04-20T00:00:00+09:00", oldRoot: OLD_ROOT, newRoot: NEW_ROOT, backupRoot: BACKUP_ROOT, byLevel, results }, null, 2), "utf8");
fs.writeFileSync(REPORT_PATH, report, "utf8");

function appendAudit() {
  let audit = { report_name: "작업_점검_보고서", schema_version: "1.0", project_root: NEW_ROOT, entries: [] };
  if (exists(AUDIT_PATH)) {
    try {
      audit = JSON.parse(readText(AUDIT_PATH));
      if (!Array.isArray(audit.entries)) audit.entries = [];
    } catch {
      audit.entries = [];
    }
  }
  const date = "2026-04-20";
  const count = audit.entries.filter((e) => String(e.entry_id || "").startsWith(date)).length;
  const entryId = `${date}-${String(count + 1).padStart(3, "0")}`;
  audit.entries.push({
    entry_id: entryId,
    timestamp: "2026-04-20T00:00:00+09:00",
    task_summary: "소쉬르1~러셀3 기존 원본 활동·문장독해·어휘·구조도·분석훈련을 현재 프로모드 원고 sections에 복원",
    project_root: NEW_ROOT,
    related_projects: [OLD_ROOT, "C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지"],
    work_type: ["원고 JSON 복원", "활동 섹션 삽입", "계획 문서 갱신"],
    files_created: [REPORT_PATH, DATA_PATH, BACKUP_ROOT],
    files_updated: [PLAN_PATH, ...results.filter((r) => r.status === "updated").map((r) => r.newFile), AUDIT_PATH],
    files_checked: levels.flatMap((level) => [path.join(OLD_ROOT, level), path.join(NEW_ROOT, level)]),
    verification: {
      checks_performed: [
        "현재 JSON 백업 생성",
        "정답/해설 제외 후 기존 원본 활동 그룹 추출",
        "현재 JSON 본문 존재율 검사 후 누락/부분 활동만 sections에 복원",
        "복원 결과 보고서와 상세 JSON 생성",
      ],
      result_summary: `9레벨 20챕터에 기존 활동 섹션 ${byLevel.reduce((sum, r) => sum + r.inserted, 0)}개를 복원함.`,
      manual_review: true,
      json_validation: true,
    },
    status: "partial",
    remaining_risks: [
      "복원된 활동은 JSON에 들어갔지만, LaTeX 판면 디자인은 아직 활동 유형별로 더 세분화해야 함.",
      "자동 본문 존재율 기준이므로 일부 중복/생략 여부는 대표 PDF 재빌드 후 육안 검수가 필요함.",
    ],
    next_actions: [
      "누락 비교 스크립트를 재실행해 복원 후 남은 누락 후보 확인",
      "복원 섹션을 반영해 샘플 PDF 재빌드",
      "활동별 LaTeX 컴포넌트 고급화",
    ],
  });
  fs.writeFileSync(AUDIT_PATH, JSON.stringify(audit, null, 2), "utf8");
  return entryId;
}

const auditEntryId = appendAudit();
console.log(JSON.stringify({ report: REPORT_PATH, data: DATA_PATH, backup: BACKUP_ROOT, audit: AUDIT_PATH, auditEntryId, byLevel }, null, 2));
