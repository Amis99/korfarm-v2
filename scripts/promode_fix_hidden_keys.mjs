import fs from "node:fs";
import path from "node:path";

const builderPath = path.join(
  "C:",
  "Users",
  "RENEWCOM PC",
  "Documents",
  "프로모드 원고",
  "latex_trial",
  "build_level1_books.mjs"
);

let source = fs.readFileSync(builderPath, "utf8");
const from = `function skipHidden(key) {
  return hiddenKeys.has(key);
}
`;
const to = `function skipHidden(key) {
  const raw = String(key || "");
  if (/answer_format|답안_?형식/i.test(raw)) return false;
  if (hiddenKeys.has(raw)) return true;
  if (/정답|해설|모범_?답안|예상_?답안/.test(raw)) return true;
  if (/^(answer|answers|answerText|answer_text|correctAnswer|correct_answer|explanation|explain|distractors|evidence|scoringCriteria|rubric|points|score|isCorrect|label)$/i.test(raw)) return true;
  return false;
}
`;

if (!source.includes(from)) {
  throw new Error("skipHidden target not found");
}
source = source.replace(from, to);
fs.writeFileSync(builderPath, source, "utf8");
console.log(builderPath);
