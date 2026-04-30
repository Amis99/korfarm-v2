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

if (!source.includes("function humanLabel")) {
  source = source.replace(
    `function command(name, ...args) {
  return \`\\\\\${name}{\${args.map(tex).join(\"}{\")}}\`;
}
`,
    `function command(name, ...args) {
  return \`\\\\\${name}{\${args.map(tex).join(\"}{\")}}\`;
}

function humanLabel(label) {
  const raw = String(label || "").trim();
  if (!raw) return "";
  const map = {
    answer_format: "답안 형식",
    prompt: "쓰기 과제",
    refId: "참조 번호",
    stem: "문항",
    box: "보기",
    choices: "선택지",
    choiceSet: "선택지",
    summaryTable: "정리표",
    patternName: "패턴",
    patternDescription: "패턴 설명",
  };
  if (map[raw]) return map[raw];
  return raw
    .replace(/_/g, " ")
    .replace(/\\bcontent\\b/gi, "내용")
    .replace(/\\bitems\\b/gi, "문항")
    .replace(/\\bexamples\\b/gi, "예시")
    .replace(/\\btitle\\b/gi, "제목")
    .replace(/\\binstruction\\b/gi, "지침")
    .replace(/\\btext\\b/gi, "본문")
    .trim();
}
`
  );
}

source = source.replaceAll('command("KFSmallTitle", label)', 'command("KFSmallTitle", humanLabel(label))');
source = source.replaceAll('command("KFSmallTitle", key)', 'command("KFSmallTitle", humanLabel(key))');
source = source.replaceAll('command("KFSmallTitle", value.title)', 'command("KFSmallTitle", value.title)');
source = source.replaceAll('`${key}: ${value}`', '`${humanLabel(key)}: ${value}`');
source = source.replaceAll('`${key}: ${renderInlineObject(value)}`', '`${humanLabel(key)}: ${renderInlineObject(value)}`');
source = source.replaceAll('`${key}: ${value.map((v) => (typeof v === "object" ? renderInlineObject(v) : String(v))).join(", ")}`', '`${humanLabel(key)}: ${value.map((v) => (typeof v === "object" ? renderInlineObject(v) : String(v))).join(", ")}`');
source = source.replaceAll('`${key}: ${renderInlineObject(cells[idx] ?? "")}`', '`${humanLabel(key)}: ${renderInlineObject(cells[idx] ?? "")}`');
source = source.replaceAll('command("KFSmallTitle", `${base || "문제"} ${spec.label}`)', 'command("KFSmallTitle", `${humanLabel(base || "문제")} ${spec.label}`)');
source = source.replaceAll('command("KFSmallTitle", `${base || "문제"} ${spec.label}`)', 'command("KFSmallTitle", `${humanLabel(base || "문제")} ${spec.label}`)');
source = source.replace(
  'output += command("KFSmallTitle", (base || "문제") + " " + spec.label) + "\\n";',
  'output += command("KFSmallTitle", humanLabel(base || "문제") + " " + spec.label) + "\\n";'
);

fs.writeFileSync(builderPath, source, "utf8");
console.log(builderPath);
