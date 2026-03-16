// Fix recurring Q9 (표현력) pattern bugs in SAUSSURE_2 daily quizzes.
//
// This is intentionally conservative: it only edits files when the exact
// broken templates/answers are detected.
//
// Run:
//   node frontend/public/daily-quiz/_tools/fix_saussure2_q9_patterns.js

const fs = require("fs");
const path = require("path");

const DIR = path.join(
  __dirname,
  "..",
  "saussure2",
);

function choiceText(blank) {
  if (!blank || !Array.isArray(blank.choices)) return "";
  const c = blank.choices.find((x) => x.id === blank.answerId);
  return c ? String(c.text) : "";
}

function ensureLfNewline(str) {
  const s = String(str).replace(/\r\n/g, "\n");
  return s.endsWith("\n") ? s : s + "\n";
}

let changedFiles = 0;
let fixedSlow = 0;
let fixedPeriod = 0;

for (const name of fs.readdirSync(DIR)) {
  if (!name.endsWith(".json")) continue;
  const p = path.join(DIR, name);
  const raw = fs.readFileSync(p, "utf8");

  let j;
  try {
    j = JSON.parse(raw);
  } catch {
    // Leave broken JSON untouched; it should be handled elsewhere.
    continue;
  }

  const q9 = j?.payload?.questions?.[8];
  if (!q9 || q9.type !== "FILL_BLANKS") continue;

  let changed = false;

  // Pattern A: "느린 부분은 ____ ____ 부른다." is missing "고르고".
  if (
    q9.template === "느린 부분은 ____ ____ 부른다." &&
    Array.isArray(q9.blanks) &&
    q9.blanks.length === 2
  ) {
    const [b1, b2] = q9.blanks;
    const a1 = choiceText(b1);
    const a2 = choiceText(b2);
    const lines = String(q9.passage || "").split("\n");

    if (
      a1 === "숨을" &&
      a2 === "천천히" &&
      lines.length >= 2 &&
      lines[1].includes("숨을 고르고") &&
      lines[1].includes("천천히")
    ) {
      // Make it inference-based (don't expose the exact answer phrase).
      lines[1] = "느린 부분에서는 잠깐 쉬면서 속도를 줄여 불렀다.";
      q9.passage = lines.join("\n");

      q9.template = "느린 부분은 ____ ____ ____ 부른다.";

      // Rename existing blank-2 to blank-3 and insert blank-2 for "고르고".
      const oldId = String(b2.id || "");
      b2.id = oldId.endsWith("-blank-2")
        ? oldId.replace(/-blank-2$/, "-blank-3")
        : oldId + "-3";

      const newBlank2Id = oldId || `${j.contentId || "dq-s2"}-9-blank-2`;
      const blank2 = {
        id: newBlank2Id,
        choices: [
          { id: "A", text: "고르고" },
          { id: "B", text: "치고" },
          { id: "C", text: "접고" },
          { id: "D", text: "닦고" },
        ],
        answerId: "A",
      };

      q9.blanks = [b1, blank2, b2];

      fixedSlow++;
      changed = true;
    }
  }

  // Pattern B: "문장 끝에는 ____ ____ 찍는다." duplicates "끝에는".
  if (
    q9.template === "문장 끝에는 ____ ____ 찍는다." &&
    Array.isArray(q9.blanks) &&
    q9.blanks.length === 2
  ) {
    const [b1] = q9.blanks;
    const a1 = choiceText(b1);

    if (a1 === "끝에는") {
      const lines = String(q9.passage || "").split("\n");
      if (lines.length >= 2) {
        // Keep the subject name, but fix the remainder.
        lines[0] = lines[0]
          .replace(
            "문장을 쓸 때 끝을 살펴보았다.",
            "문장을 다 쓰고 나서 마지막을 살펴보았다.",
          )
          .replace(
            "문장을 쓰고 나서 문장 끝을 살펴보았다.",
            "문장을 다 쓰고 나서 마지막을 살펴보았다.",
          );
        lines[1] = "글이 끝나면 작은 점을 찍어야 한다.";
        q9.passage = lines.join("\n");
      } else {
        q9.passage =
          "문장을 다 쓰고 나서 마지막을 살펴보았다.\n글이 끝나면 작은 점을 찍어야 한다.";
      }

      q9.template = "문장 ____ ____ 찍는다.";

      fixedPeriod++;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(p, ensureLfNewline(JSON.stringify(j, null, 2)), "utf8");
    changedFiles++;
  }
}

console.log(
  JSON.stringify({ changedFiles, fixedSlow, fixedPeriod }, null, 2),
);

