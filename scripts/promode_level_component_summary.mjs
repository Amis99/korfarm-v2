import fs from "node:fs";
import path from "node:path";

const root = path.join("C:", "Users", "RENEWCOM PC", "Documents", "프로모드 원고");
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

const skipTypes = new Set(["answer_explain", "model_answer"]);
const skipKeys = /정답|해설|모범_?답안|예상_?답안|answer(?!_format)|explanation|isCorrect|correctAnswer|distractors|evidence|scoringCriteria|points|score/i;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function inc(map, key, amount = 1) {
  const k = key || "(없음)";
  map.set(k, (map.get(k) || 0) + amount);
}

function top(map, n = 12) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")).slice(0, n);
}

function chapterNo(file) {
  return Number(file.match(/챕터(\d+)/)?.[1] || 0);
}

function normalFiles(level) {
  const dir = path.join(root, level);
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => ({ file: path.join(dir, file), chapter: chapterNo(file) }))
    .filter((item) => item.chapter >= 1 && item.chapter <= 20)
    .sort((a, b) => a.chapter - b.chapter);
}

function collectKeys(value, target, prefix = "") {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, target, prefix);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (skipKeys.test(key)) continue;
    const next = prefix ? `${prefix}.${key}` : key;
    target.add(next);
    collectKeys(child, target, next);
  }
}

function summarizeNormal(level) {
  const areaOrder = [];
  const areas = new Map();
  const sectionTypes = new Map();
  const subtypes = new Map();
  const areaDetails = new Map();
  const firstFlow = [];
  const files = normalFiles(level);

  for (const { file, chapter } of files) {
    const json = readJson(file);
    for (const section of json.sections || []) {
      if (skipTypes.has(section.type)) continue;
      const area = section.area || "기타";
      if (!areas.has(area)) areaOrder.push(area);
      inc(areas, area);
      inc(sectionTypes, section.type);
      inc(subtypes, section.subtype);

      if (!areaDetails.has(area)) {
        areaDetails.set(area, {
          types: new Map(),
          subtypes: new Map(),
          titles: new Map(),
          keys: new Set(),
        });
      }
      const detail = areaDetails.get(area);
      inc(detail.types, section.type);
      inc(detail.subtypes, section.subtype);
      inc(detail.titles, section.title || section.subtype || section.type);
      collectKeys(section.content, detail.keys);

      if (chapter === 1 && firstFlow.length < 18) {
        firstFlow.push(`${area}/${section.type}/${section.subtype || section.title || ""}`);
      }
    }
  }

  return {
    source: "챕터별 JSON 20개",
    areaOrder,
    areaCounts: Object.fromEntries(areas),
    sectionTypes: Object.fromEntries(top(sectionTypes, 20)),
    subtypes: Object.fromEntries(top(subtypes, 18)),
    firstFlow,
    areas: Object.fromEntries(
      [...areaDetails.entries()].map(([area, detail]) => [
        area,
        {
          types: Object.fromEntries(top(detail.types, 8)),
          subtypes: top(detail.subtypes, 12).map(([k]) => k),
          titles: top(detail.titles, 10).map(([k]) => k),
          keys: [...detail.keys].sort((a, b) => a.localeCompare(b, "ko")).slice(0, 40),
        },
      ])
    ),
  };
}

function summarizeWitt(level) {
  const dir = path.join(root, level);
  const chapterDirs = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^ch\d+$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));
  const indexTypes = new Map();
  const fileShapes = new Map();
  const setTitles = { reading: [], literature: [] };
  const fieldKeys = new Map();
  const questionShapes = new Map();

  for (const ch of chapterDirs) {
    const chDir = path.join(dir, ch);
    const index = readJson(path.join(chDir, "index.json"));
    for (const section of index.sections || []) {
      inc(indexTypes, section.type);
      if (section.type === "chapter_test") continue;
      if (section.type === "reading" && setTitles.reading.length < 8) setTitles.reading.push(section.title);
      if (section.type === "literature" && setTitles.literature.length < 8) setTitles.literature.push(section.title);
      const data = readJson(path.join(chDir, section.file));
      inc(fileShapes, data.type || section.type);
      if (!fieldKeys.has(section.type)) fieldKeys.set(section.type, new Set());
      collectKeys(data, fieldKeys.get(section.type));
      if (data.questions && typeof data.questions === "object") {
        for (const [key, value] of Object.entries(data.questions)) {
          if (!skipKeys.test(key)) inc(questionShapes, `${section.type}.${key}`, Array.isArray(value) ? value.length : 1);
        }
      } else if (Array.isArray(data.questions)) {
        inc(questionShapes, `${section.type}.questions[]`, data.questions.length);
      }
    }
  }

  return {
    source: "ch01~ch20 폴더 + index.json + 세트별 JSON",
    areaOrder: ["reading", "literature", "grammar", "pattern_workbook", "chapter_test(사이트 시험지로 분리)"],
    indexTypes: Object.fromEntries(top(indexTypes, 10)),
    fileShapes: Object.fromEntries(top(fileShapes, 10)),
    sampleReadingTitles: setTitles.reading,
    sampleLiteratureTitles: setTitles.literature,
    questionShapes: Object.fromEntries(top(questionShapes, 20)),
    components: Object.fromEntries(
      [...fieldKeys.entries()].map(([type, keys]) => [
        type,
        [...keys].sort((a, b) => a.localeCompare(b, "ko")).slice(0, 50),
      ])
    ),
  };
}

const result = {};
for (const level of levels) {
  result[level] = level.startsWith("비트겐슈타인") ? summarizeWitt(level) : summarizeNormal(level);
}

console.log(JSON.stringify(result, null, 2));
