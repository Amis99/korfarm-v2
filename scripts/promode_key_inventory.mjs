import fs from "node:fs";
import path from "node:path";

const root = path.join("C:", "Users", "RENEWCOM PC", "Documents", "프로모드 원고");
const outDir = path.join(root, "latex_trial", "out");
const levels = [
  "소쉬르1",
  "소쉬르2",
  "소쉬르3",
  "프레게1",
  "프레게2",
  "프레게3",
  "러셀1",
  "러셀2",
  "러셀3",
  "비트겐슈타인1",
  "비트겐슈타인2",
  "비트겐슈타인3",
];

const answerLike = [
  /(^|[._\[\]])answer(s|Text)?($|[._\[\]])/i,
  /correctAnswer|correct_answer|isCorrect/i,
  /explanation|explain|distractors|evidence|scoringCriteria|rubric/i,
  /points|score/i,
  /정답|해설|모범_?답안|예상_?답안/,
];

const testLike = [/chapter_test/, /test\.json$/i];
const metaLike = [/qualityCheck/i, /createdAt|version|language|originalLanguage|originalFile/i];

function chapterNumber(file) {
  return Number(file.match(/챕터(\d+)/)?.[1] || 0);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function classify(pathName, file) {
  if (testLike.some((rule) => rule.test(pathName) || rule.test(file))) return "site_test_only";
  if (/answer_format|답안_?형식/i.test(pathName)) return "student_render_target";
  if (answerLike.some((rule) => rule.test(pathName))) return "excluded_answer_explanation";
  if (metaLike.some((rule) => rule.test(pathName))) return "tracked_metadata";
  return "student_render_target";
}

function normalizePath(parent, key) {
  if (parent === "") return key;
  return `${parent}.${key}`;
}

function sampleValue(value) {
  if (value == null) return String(value);
  if (Array.isArray(value)) return `array(${value.length})`;
  if (typeof value === "object") return `object(${Object.keys(value).slice(0, 6).join(",")})`;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
}

function walk(value, parent, file, acc) {
  if (Array.isArray(value)) {
    const pathName = `${parent}[]`;
    add(acc, pathName, value, file);
    value.forEach((item) => walk(item, pathName, file, acc));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const pathName = normalizePath(parent, key);
      add(acc, pathName, child, file);
      walk(child, pathName, file, acc);
    }
  }
}

function add(acc, pathName, value, file) {
  if (!pathName) return;
  const current = acc.get(pathName) || {
    path: pathName,
    count: 0,
    files: new Set(),
    category: classify(pathName, file),
    samples: [],
  };
  current.count += 1;
  current.files.add(path.relative(root, file));
  if (current.samples.length < 3) current.samples.push(sampleValue(value));
  acc.set(pathName, current);
}

function normalFiles(level) {
  const dir = path.join(root, level);
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => ({ file: path.join(dir, file), chapter: chapterNumber(file) }))
    .filter((item) => item.chapter >= 1 && item.chapter <= 20)
    .sort((a, b) => a.chapter - b.chapter)
    .map((item) => item.file);
}

function wittFiles(level) {
  const dir = path.join(root, level);
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^ch\d+$/i.test(entry.name)) continue;
    const chDir = path.join(dir, entry.name);
    for (const file of fs.readdirSync(chDir).filter((name) => name.endsWith(".json"))) {
      files.push(path.join(chDir, file));
    }
  }
  return files.sort((a, b) => a.localeCompare(b, "ko"));
}

function filesFor(level) {
  return level.startsWith("비트겐슈타인") ? wittFiles(level) : normalFiles(level);
}

function toSerializable(entry) {
  return {
    path: entry.path,
    count: entry.count,
    fileCount: entry.files.size,
    category: entry.category,
    samples: entry.samples,
  };
}

function table(rows) {
  return [
    "| 키 경로 | 분류 | 등장 수 | 파일 수 | 샘플 |",
    "| --- | --- | ---: | ---: | --- |",
    ...rows.map((row) => {
      const sample = row.samples.join(" / ").replaceAll("|", "/");
      return `| \`${row.path}\` | ${row.category} | ${row.count} | ${row.fileCount} | ${sample} |`;
    }),
  ].join("\n");
}

fs.mkdirSync(outDir, { recursive: true });
const inventory = {};
const md = ["# 프로모드 12레벨 JSON 키 인벤토리", ""];
for (const level of levels) {
  const acc = new Map();
  const files = filesFor(level);
  for (const file of files) walk(readJson(file), "", file, acc);
  const rows = [...acc.values()].map(toSerializable).sort((a, b) => a.path.localeCompare(b.path, "ko"));
  inventory[level] = { fileCount: files.length, keyCount: rows.length, keys: rows };
  const grouped = rows.reduce((map, row) => {
    map[row.category] = (map[row.category] || 0) + 1;
    return map;
  }, {});
  md.push(`## ${level}`);
  md.push("");
  md.push(`- 파일 수: ${files.length}`);
  md.push(`- 고유 키 경로 수: ${rows.length}`);
  md.push(`- 분류: ${Object.entries(grouped).map(([key, count]) => `${key} ${count}`).join(", ")}`);
  md.push("");
  md.push(table(rows));
  md.push("");
}

const jsonPath = path.join(outDir, "json_key_inventory.json");
const mdPath = path.join(outDir, "json_key_inventory.md");
fs.writeFileSync(jsonPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
fs.writeFileSync(mdPath, md.join("\n"), "utf8");
console.log(JSON.stringify({ jsonPath, mdPath }, null, 2));
