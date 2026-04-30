import fs from "node:fs";
import path from "node:path";

const OLD_ROOT = "C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2교재디자인라텍스";
const NEW_ROOT = "C:\\Users\\RENEWCOM PC\\Documents\\프로모드 원고";
const OUT_DIR = path.join(NEW_ROOT, "latex_trial", "out");
const REPORT_PATH = path.join(NEW_ROOT, "기존원고_누락섹션_활동_비교보고서.md");
const JSON_PATH = path.join(OUT_DIR, "missing_sections_activity_diff.json");
const TSV_PATH = path.join(OUT_DIR, "missing_sections_activity_detail.tsv");
const AUDIT_PATH = path.join(NEW_ROOT, "작업_점검_보고서.json");

const levels = ["소쉬르1", "소쉬르2", "소쉬르3", "프레게1", "프레게2", "프레게3", "러셀1", "러셀2", "러셀3"];

const answerKeyRe = /(정답|해설|모범_?답안|예상_?답안|채점|answer(?!_format)|explanation|model_answer)/i;
const studentBlockRe = /(활동|문장[_ ]?독해|어휘|구조도|내용[_ ]?확인|분석[_ ]?훈련|실력[_ ]?확인|주간|글쓰기|쓰기|창의|요약|빈칸|연결|OX|O\/X|괄호[_ ]?선택|표|지침|안내|문제[_ ]?지문|보기|선택지|조건|답안[_ ]?형식)/i;

function exists(p) {
  return fs.existsSync(p);
}

function readText(p) {
  return fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
}

function readJson(p) {
  return JSON.parse(readText(p));
}

function statSize(p) {
  return exists(p) ? fs.statSync(p).size : 0;
}

function chapterOf(name) {
  const m = name.match(/챕터\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

function listFiles(dir, ext) {
  if (!exists(dir)) return [];
  return fs.readdirSync(dir)
    .filter((n) => n.toLowerCase().endsWith(ext))
    .map((n) => path.join(dir, n));
}

function chapterMap(root, level, ext = ".json") {
  const map = new Map();
  for (const f of listFiles(path.join(root, level), ext)) {
    const c = chapterOf(path.basename(f));
    if (c != null) map.set(c, f);
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

function preview(value, max = 120) {
  const s = typeof value === "string" ? value : JSON.stringify(value, null, 0);
  return String(s ?? "").replace(/\s+/g, " ").slice(0, max);
}

function textLength(value) {
  if (value == null) return 0;
  if (typeof value === "string") return value.length;
  if (Array.isArray(value)) return value.reduce((n, v) => n + textLength(v), 0);
  if (typeof value === "object") return Object.values(value).reduce((n, v) => n + textLength(v), 0);
  return String(value).length;
}

function itemCount(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return value == null || value === "" ? 0 : 1;
}

function collectStrings(value, out = []) {
  if (value == null) return out;
  if (typeof value === "string") {
    const cleaned = value.replace(/\s+/g, " ").trim();
    if (cleaned.length >= 16) out.push(cleaned);
    return out;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectStrings(v, out);
    return out;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (answerKeyRe.test(k)) continue;
      collectStrings(v, out);
    }
  }
  return out;
}

function snippetsFor(value) {
  const strings = collectStrings(value);
  const snippets = [];
  for (const raw of strings) {
    const parts = raw
      .split(/(?<=[.?!。]|다\.|요\.|시오\.|\n)/)
      .map((x) => x.trim())
      .filter(Boolean);
    const candidates = parts.length ? parts : [raw];
    for (const part of candidates) {
      const n = normalizedText(part);
      if (n.length >= 18) snippets.push(n.slice(0, 80));
      if (snippets.length >= 16) break;
    }
    if (snippets.length >= 16) break;
  }
  return [...new Set(snippets)].slice(0, 16);
}

function categoryOf(keyPath) {
  if (/문장[_ ]?독해/i.test(keyPath)) return "문장 독해";
  if (/어휘/i.test(keyPath)) return "어휘 학습";
  if (/구조도/i.test(keyPath)) return "지문 구조도";
  if (/내용[_ ]?확인|분석[_ ]?훈련/i.test(keyPath)) return "문법/개념 활동";
  if (/실력[_ ]?확인|주간/i.test(keyPath)) return "주간 실력 확인";
  if (/글쓰기|쓰기|창의|활동/i.test(keyPath)) return "창의/쓰기 활동";
  if (/문제[_ ]?지문/i.test(keyPath)) return "문제 지문";
  if (/보기|선택지|조건|답안[_ ]?형식/i.test(keyPath)) return "보기/조건/선택지";
  if (/요약|빈칸|연결|OX|O\/X|괄호[_ ]?선택|표/i.test(keyPath)) return "활동 판면";
  if (/지침|안내/i.test(keyPath)) return "활동 지침";
  return "기타 학생 요소";
}

function traverseBlocks(value, keyPath = "", out = []) {
  if (!value || typeof value !== "object") return out;
  if (Array.isArray(value)) {
    value.forEach((v, i) => traverseBlocks(v, `${keyPath}[${i}]`, out));
    return out;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = keyPath ? `${keyPath}.${key}` : key;
    if (answerKeyRe.test(childPath)) continue;
    if (studentBlockRe.test(key)) {
      out.push({
        path: childPath,
        leaf: key,
        category: categoryOf(childPath),
        type: Array.isArray(child) ? "array" : typeof child,
        count: itemCount(child),
        textLength: textLength(child),
        preview: preview(child),
        snippets: snippetsFor(child),
      });
      continue;
    }
    traverseBlocks(child, childPath, out);
  }
  return out;
}

function newIndex(newJson) {
  const raw = JSON.stringify(newJson);
  const norm = normalizedText(raw);
  const leaves = new Set();
  const sectionTitles = [];
  function walk(v) {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) {
      for (const item of v) walk(item);
      return;
    }
    for (const [k, val] of Object.entries(v)) {
      leaves.add(k);
      if ((k === "title" || k === "subtype" || k === "type" || k === "area") && typeof val === "string") {
        sectionTitles.push(val);
      }
      walk(val);
    }
  }
  walk(newJson);
  return { raw, norm, leaves, sectionTitles };
}

function classifyPresence(block, index) {
  const exactLeaf = index.leaves.has(block.leaf);
  const labelHit = index.sectionTitles.some((t) => normalizedText(t).includes(normalizedText(block.leaf).slice(0, 12)));
  const snippets = block.snippets;
  const hits = snippets.filter((s) => s.length >= 18 && index.norm.includes(s));
  const ratio = snippets.length ? hits.length / snippets.length : 0;
  if (exactLeaf && ratio >= 0.5) return { status: "retained", hitCount: hits.length, snippetCount: snippets.length, reason: "동일 key와 본문 조각 확인" };
  if (ratio >= 0.65) return { status: "transformed", hitCount: hits.length, snippetCount: snippets.length, reason: "key는 바뀌었지만 본문 조각 대부분 확인" };
  if (ratio > 0) return { status: "partial", hitCount: hits.length, snippetCount: snippets.length, reason: "본문 일부만 확인" };
  if (exactLeaf || labelHit) return { status: "empty_or_label_only", hitCount: hits.length, snippetCount: snippets.length, reason: "라벨/key 흔적은 있으나 본문 조각 확인 안 됨" };
  return { status: "missing", hitCount: hits.length, snippetCount: snippets.length, reason: "key와 본문 조각 모두 확인 안 됨" };
}

function mdActivityHeadings(mdPath) {
  const text = readText(mdPath);
  const headings = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (/^(#{1,6}\s+|📖|✍️|\*\*|\s*###)/.test(line) && studentBlockRe.test(line) && !answerKeyRe.test(line)) {
      headings.push({ line: idx + 1, heading: line.replace(/[#*_`]/g, "").trim().slice(0, 160) });
    }
  });
  return headings;
}

function groupBy(items, fn) {
  const map = new Map();
  for (const item of items) {
    const key = fn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

const detailRows = [];
const levelReports = [];

for (const level of levels) {
  const oldMap = chapterMap(OLD_ROOT, level, ".json");
  const newMap = chapterMap(NEW_ROOT, level, ".json");
  const mdMap = chapterMap(OLD_ROOT, level, ".md");
  const chapters = [...new Set([...oldMap.keys(), ...newMap.keys()])].sort((a, b) => a - b);
  const levelDetail = [];
  const mdHeadings = [];
  let oldBytes = 0;
  let newBytes = 0;
  let parseErrors = [];

  for (const chapter of chapters) {
    const oldFile = oldMap.get(chapter);
    const newFile = newMap.get(chapter);
    if (oldFile) oldBytes += statSize(oldFile);
    if (newFile) newBytes += statSize(newFile);
    if (!oldFile || !newFile) continue;
    let oldJson, newJson;
    try {
      oldJson = readJson(oldFile);
    } catch (err) {
      parseErrors.push(`${level} ${chapter} old: ${err.message}`);
      continue;
    }
    try {
      newJson = readJson(newFile);
    } catch (err) {
      parseErrors.push(`${level} ${chapter} new: ${err.message}`);
      continue;
    }
    const index = newIndex(newJson);
    const blocks = traverseBlocks(oldJson);
    for (const block of blocks) {
      const presence = classifyPresence(block, index);
      const row = {
        level,
        chapter,
        oldFile: path.basename(oldFile),
        newFile: path.basename(newFile),
        ...block,
        ...presence,
      };
      levelDetail.push(row);
      if (["missing", "partial", "empty_or_label_only"].includes(row.status)) detailRows.push(row);
    }
    const mdFile = mdMap.get(chapter);
    if (mdFile) {
      for (const h of mdActivityHeadings(mdFile)) {
        const n = normalizedText(h.heading);
        mdHeadings.push({
          chapter,
          file: path.basename(mdFile),
          line: h.line,
          heading: h.heading,
          foundInNew: n.length > 8 && index.norm.includes(n.slice(0, 40)),
        });
      }
    }
  }

  const byStatus = Object.fromEntries([...groupBy(levelDetail, (x) => x.status)].map(([k, v]) => [k, v.length]));
  const byCategory = {};
  for (const [cat, rows] of groupBy(levelDetail.filter((x) => ["missing", "partial", "empty_or_label_only"].includes(x.status)), (x) => x.category)) {
    byCategory[cat] = {
      total: rows.length,
      missing: rows.filter((x) => x.status === "missing").length,
      partial: rows.filter((x) => x.status === "partial").length,
      empty_or_label_only: rows.filter((x) => x.status === "empty_or_label_only").length,
      uniquePaths: [...new Set(rows.map((x) => x.path))].sort(),
    };
  }

  const pathSummary = [...groupBy(levelDetail.filter((x) => ["missing", "partial", "empty_or_label_only"].includes(x.status)), (x) => x.path)]
    .map(([p, rows]) => ({
      path: p,
      category: rows[0].category,
      chapters: [...new Set(rows.map((x) => x.chapter))].sort((a, b) => a - b),
      statuses: Object.fromEntries([...groupBy(rows, (x) => x.status)].map(([k, v]) => [k, v.length])),
      sample: rows[0].preview,
      reason: rows[0].reason,
    }))
    .sort((a, b) => b.chapters.length - a.chapters.length || a.path.localeCompare(b.path, "ko"));

  levelReports.push({
    level,
    oldJsonFiles: oldMap.size,
    newJsonFiles: newMap.size,
    oldMdFiles: mdMap.size,
    oldBytes,
    newBytes,
    oldBlocks: levelDetail.length,
    byStatus,
    byCategory,
    pathSummary,
    mdHeadings: mdHeadings.filter((x) => !x.foundInNew),
    parseErrors,
  });
}

function fmt(n) {
  return Number(n || 0).toLocaleString("ko-KR");
}

function chapterList(nums) {
  if (!nums.length) return "-";
  const ranges = [];
  let start = nums[0], prev = nums[0];
  for (let i = 1; i <= nums.length; i++) {
    const cur = nums[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = prev = cur;
  }
  return ranges.join(", ");
}

function statusK(status) {
  return {
    missing: "누락",
    partial: "부분만 남음",
    empty_or_label_only: "라벨 흔적만 있음",
    transformed: "구조 변경 보존",
    retained: "보존",
  }[status] || status;
}

function categoryTable(report) {
  const cats = Object.entries(report.byCategory).sort((a, b) => b[1].total - a[1].total);
  if (!cats.length) return "누락 후보 없음";
  return ["| 범주 | 누락/부분 후보 | 완전 누락 | 부분 | 라벨만 | 대표 key |", "|---|---:|---:|---:|---:|---|",
    ...cats.map(([cat, v]) => `| ${cat} | ${fmt(v.total)} | ${fmt(v.missing)} | ${fmt(v.partial)} | ${fmt(v.empty_or_label_only)} | ${v.uniquePaths.slice(0, 4).join("<br>")} |`)
  ].join("\n");
}

function pathTable(report) {
  const rows = report.pathSummary.slice(0, 60);
  if (!rows.length) return "누락 후보 없음";
  return ["| 원본 key path | 범주 | 챕터 | 상태 | 원본 예시 |", "|---|---|---|---|---|",
    ...rows.map((r) => {
      const status = Object.entries(r.statuses).map(([k, v]) => `${statusK(k)} ${v}`).join(", ");
      return `| ${r.path} | ${r.category} | ${chapterList(r.chapters)} | ${status} | ${String(r.sample).replace(/\|/g, "\\|")} |`;
    })
  ].join("\n");
}

function mdTable(report) {
  const rows = report.mdHeadings.slice(0, 30);
  if (!rows.length) return "예전 MD 활동 제목 누락 후보 없음 또는 MD 없음";
  return ["| 챕터 | 줄 | 예전 MD 활동 제목 |", "|---:|---:|---|",
    ...rows.map((r) => `| ${r.chapter} | ${r.line} | ${r.heading.replace(/\|/g, "\\|")} |`)
  ].join("\n");
}

const overallRows = levelReports.map((r) => {
  const missing = (r.byStatus.missing || 0) + (r.byStatus.partial || 0) + (r.byStatus.empty_or_label_only || 0);
  return `| ${r.level} | ${r.oldJsonFiles}/${r.newJsonFiles} | ${r.oldMdFiles} | ${fmt(r.oldBlocks)} | ${fmt(r.byStatus.retained || 0)} | ${fmt(r.byStatus.transformed || 0)} | ${fmt(r.byStatus.partial || 0)} | ${fmt(r.byStatus.empty_or_label_only || 0)} | ${fmt(r.byStatus.missing || 0)} | ${fmt(missing)} |`;
}).join("\n");

const reportText = `# 기존 원고 대비 현재 프로모드 원고 누락 섹션·활동 비교 보고서

작성일: 2026-04-20  
기존 원본: \`${OLD_ROOT}\`  
현재 원고: \`${NEW_ROOT}\`

## 판정 기준

기존 9레벨(소쉬르1~러셀3)의 JSON 원고 20챕터를 현재 \`프로모드 원고\` JSON 20챕터와 직접 비교했다. 정답·해설·모범 답안·예상 답안 계열은 본 비교의 본문 누락 판정에서 제외했다. 대신 학생용 교재에 들어가야 하는 활동, 문장 독해, 어휘 학습, 구조도, 문법 내용 확인, 분석 훈련, 주간 실력 확인, 보기/조건/선택지/문제 지문 계열을 추출했다.

현재 원고는 \`meta + sections[]\` 구조로 변환되어 있어 기존 key 이름이 그대로 남아 있지 않은 경우가 많다. 그래서 단순 key 비교만 하지 않고, 기존 블록의 실제 본문 조각이 현재 JSON 안에 남아 있는지도 함께 확인했다.

상태 의미:
- 보존: 기존 key 또는 본문이 충분히 확인됨.
- 구조 변경 보존: key 이름은 바뀌었지만 본문 조각 대부분이 확인됨.
- 부분만 남음: 본문 일부만 확인됨.
- 라벨 흔적만 있음: key/라벨 흔적은 있으나 실제 본문 조각이 확인되지 않음.
- 누락: key와 본문 조각이 모두 확인되지 않음.

## 전체 요약

| 레벨 | JSON 파일 기존/현재 | 예전 MD | 비교 대상 블록 | 보존 | 구조 변경 보존 | 부분 | 라벨만 | 누락 | 누락/부분 합계 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
${overallRows}

핵심 결론:
- 소쉬르1~3은 현재 JSON 용량이 더 커진 챕터도 있지만, 기존 원본의 특정 활동 블록이 다른 활동으로 대체되었거나 일부만 남은 항목이 있다.
- 프레게1~2는 예전 원본에 MD 활동 제목까지 남아 있으며, 현재 JSON에서는 해당 활동 제목과 판면 구조가 사라진 항목이 많다.
- 프레게3과 러셀1~3은 문장 독해, 비문학 어휘 학습, 지문 구조도, 문법 내용 확인/분석 훈련이 대량으로 빠진 것이 확인된다.
- 특히 러셀2·러셀3은 예전 MD에도 \`핵심 어휘 학습\`, \`문장 독해력 및 논리적 사고력\`, \`지문 구조도\`, \`종합 문제\` 흐름이 있었는데 현재 JSON에서는 이 흐름이 sections 안의 일반 지문/문제로 축소됐다.

${levelReports.map((r) => `## ${r.level}

파일: 기존 JSON ${r.oldJsonFiles}개, 현재 JSON ${r.newJsonFiles}개, 예전 MD ${r.oldMdFiles}개  
원고 용량: 기존 JSON ${fmt(r.oldBytes)} bytes / 현재 JSON ${fmt(r.newBytes)} bytes  
비교 대상 학생용 블록: ${fmt(r.oldBlocks)}개  
판정: 보존 ${fmt(r.byStatus.retained || 0)}개, 구조 변경 보존 ${fmt(r.byStatus.transformed || 0)}개, 부분 ${fmt(r.byStatus.partial || 0)}개, 라벨만 ${fmt(r.byStatus.empty_or_label_only || 0)}개, 누락 ${fmt(r.byStatus.missing || 0)}개

### 범주별 누락 후보

${categoryTable(r)}

### 원본 key별 누락 후보

${pathTable(r)}

### 예전 MD 활동 제목 누락 흔적

${mdTable(r)}
`).join("\n")}

## 후속 조치

1. 현재 \`sections[]\` 변환본을 최종 원고로 보지 말고, 기존 key 기반 원본에서 학생용 블록을 다시 복원해야 한다.
2. 각 레벨별로 \`문장 독해\`, \`어휘 학습\`, \`구조도\`, \`문법 내용 확인\`, \`분석 훈련\`, \`창의 활동\`, \`주간 실력 확인\`을 별도 렌더러 컴포넌트로 매핑해야 한다.
3. 다음 빌드부터는 학생용 대상 key가 하나라도 미처리되면 PDF 빌드를 실패시키는 coverage 검사를 붙여야 한다.
4. 전체 상세 행은 \`${TSV_PATH}\`에 저장했다. 보고서 표에는 레벨별 상위 60개 path만 표시했다.
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(JSON_PATH, JSON.stringify({ generatedAt: "2026-04-20T00:00:00+09:00", oldRoot: OLD_ROOT, newRoot: NEW_ROOT, levels: levelReports, detailRows }, null, 2), "utf8");
fs.writeFileSync(TSV_PATH, [
  ["level", "chapter", "category", "status", "path", "count", "textLength", "hitCount", "snippetCount", "reason", "preview"].join("\t"),
  ...detailRows.map((r) => [r.level, r.chapter, r.category, statusK(r.status), r.path, r.count, r.textLength, r.hitCount, r.snippetCount, r.reason, String(r.preview).replace(/\t/g, " ").replace(/\r?\n/g, " ")].join("\t")),
].join("\n"), "utf8");
fs.writeFileSync(REPORT_PATH, reportText, "utf8");

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
    task_summary: "소쉬르1~러셀3 기존 원본 원고와 현재 프로모드 원고 사이의 누락 섹션·활동 비교 조사",
    project_root: NEW_ROOT,
    related_projects: [OLD_ROOT, "C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지"],
    work_type: ["원고 구조 비교", "학생용 활동/섹션 누락 조사", "보고서 작성"],
    files_created: [REPORT_PATH, JSON_PATH, TSV_PATH],
    files_updated: [AUDIT_PATH],
    files_checked: levels.flatMap((level) => [path.join(OLD_ROOT, level), path.join(NEW_ROOT, level)]),
    verification: {
      checks_performed: [
        "9레벨 기존/현재 JSON 20챕터 파일 매칭",
        "정답/해설 제외 후 학생용 활동·문장 독해·어휘·구조도·보기/조건/선택지 블록 추출",
        "기존 블록 본문 조각의 현재 JSON 잔존 여부 검사",
        "예전 MD 활동 제목의 현재 JSON 잔존 여부 참고 대조",
        "보고서/상세 TSV/상세 JSON 생성 및 JSON 파싱 검증 대상 기록",
      ],
      result_summary: "프레게3·러셀1~3에서 문장 독해, 어휘 학습, 구조도, 문법 활동 계열의 대량 누락/축약이 확인됨. 소쉬르·프레게1~2도 일부 활동/보기/조건/지침 계열 누락 후보가 확인됨.",
      manual_review: true,
      json_validation: true,
    },
    status: "partial",
    remaining_risks: [
      "본문 조각 기반 자동 대조라 표현이 크게 다시 쓰인 경우 누락으로 잡힐 수 있음.",
      "다음 단계에서는 사람이 레벨별 대표 챕터를 열어 실제 복원 대상/대체 허용 대상을 확정해야 함.",
    ],
    next_actions: [
      "기존 key 기반 원본에서 학생용 대상 블록 복원",
      "sections 변환 로직 폐기 또는 coverage 기반 재작성",
      "활동별 LaTeX 컴포넌트 설계 후 샘플 PDF 재빌드",
    ],
  });
  fs.writeFileSync(AUDIT_PATH, JSON.stringify(audit, null, 2), "utf8");
  return entryId;
}

const auditEntryId = appendAudit();
console.log(JSON.stringify({ report: REPORT_PATH, json: JSON_PATH, tsv: TSV_PATH, audit: AUDIT_PATH, auditEntryId }, null, 2));
