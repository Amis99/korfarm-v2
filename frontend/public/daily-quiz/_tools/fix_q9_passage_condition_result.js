// Fix the stock Q9(SENTENCE_BUILDING) passage that violates the spec:
// The passage must not contain the final template sentence verbatim.
//
// This script replaces the problematic passage only when it contains the
// specific phrase "조건과 결과의 관계를 설명했다" in Q9.
//
// Run from repo root:
//   node frontend/public/daily-quiz/_tools/fix_q9_passage_condition_result.js

const fs = require("fs");
const path = require("path");

const dailyQuizDir = path.resolve(__dirname, "..");
const levels = [
  "frege3",
  "russell1",
  "russell2",
  "russell3",
  "wittgenstein1",
  "wittgenstein2",
];

const targetPhrase = "조건과 결과의 관계를 설명했다";

// Keep it inference-based: do not include the final template sentence verbatim.
const newPassage = [
  "한 학생이 같은 실험을 여러 번 했는데, 매번 한 가지만 바꿔 보았다.",
  "그러자 관찰한 결과가 전과 달라졌다.",
  "학생은 무엇을 바꿨는지와 달라진 점을 함께 기록했다.",
].join("\n");

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`JSON parse failed: ${filePath}: ${e.message}`);
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

let total = 0;

for (const lv of levels) {
  let lvCount = 0;
  for (let day = 1; day <= 365; day++) {
    const filePath = path.join(dailyQuizDir, lv, `${String(day).padStart(3, "0")}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing file: ${filePath}`);
    }

    const data = readJson(filePath);
    const qs = data?.payload?.questions;
    if (!Array.isArray(qs) || qs.length !== 10) {
      throw new Error(`Unexpected payload.questions in ${filePath}`);
    }

    const q9 = qs.find((q) => q?.questionKind === "SENTENCE_BUILDING");
    if (!q9 || typeof q9.passage !== "string") {
      throw new Error(`Missing SENTENCE_BUILDING passage in ${filePath}`);
    }

    if (q9.passage.includes(targetPhrase)) {
      q9.passage = newPassage;
      writeJson(filePath, data);
      lvCount++;
      total++;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`${lv}: ${lvCount}`);
}

// eslint-disable-next-line no-console
console.log(`TOTAL: ${total}`);

