import fs from "node:fs";
import path from "node:path";

const sourceDesign = path.join("C:", "Users", "RENEWCOM PC", "Documents", "국어농장v2교재디자인라텍스");
const root = path.join("C:", "Users", "RENEWCOM PC", "Documents", "프로모드 원고");
const mdPath = path.join(root, "프로모드_12레벨_교재구성_LaTeX_코딩계획.md");
const stylePath = path.join(root, "latex_trial", "styles", "koreanfarmtrial.sty");
const builderPath = path.join(root, "latex_trial", "build_level1_books.mjs");
const logoSource = path.join(sourceDesign, "국어농장 로고.png");
const logoTarget = path.join(root, "latex_trial", "assets", "brand", "koreanfarm-logo.png");

function betweenReplace(text, startNeedle, endNeedle, replacement, label) {
  const start = text.indexOf(startNeedle);
  if (start < 0) throw new Error(`${label}: start not found`);
  const end = text.indexOf(endNeedle, start);
  if (end < 0) throw new Error(`${label}: end not found`);
  return `${text.slice(0, start)}${replacement}${text.slice(end)}`;
}

function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`${label}: target not found`);
  return text.replace(from, to);
}

function updatePlanDoc() {
  const section = [
    "## 기존 교재디자인 LaTeX 작업물 평가 및 반영",
    "",
    "참고 폴더: `C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2교재디자인라텍스`",
    "",
    "반영할 장점:",
    "",
    "- `tcolorbox`를 활용한 지문, 보기, 조건, 활동 박스 디자인은 유지 가치가 높다.",
    "- 문제 번호 배지, 문제 블록 `minipage`/`samepage`, `needspace` 기반 고아 라벨 방지 아이디어는 현 샘플에도 적용한다.",
    "- 마크다운 표를 LaTeX 표로 변환하고 `adjustbox`/`tabularx`로 폭을 제어하는 방식은 유지한다.",
    "- 객관식 문제 앞에 해당 문제용 지문을 다시 박스로 출력하는 규칙을 현 렌더러에도 넣는다.",
    "- 동적 키 이름을 패턴으로 읽는 방식은 필요하다. 특히 `*_객관식_문제`, `*_객관식_보기`, `*_객관식_선택지`, `*_문제_지문`처럼 분리된 키를 한 문제 단위로 다시 결합해야 한다.",
    "",
    "그대로 쓰면 안 되는 점:",
    "",
    "- 예전 작업물은 현재 원고의 `sections[]` 구조와 비트겐슈타인 `chNN/index.json` 구조를 전제로 하지 않는다.",
    "- 일부 레벨과 키가 하드코딩되어 있어 새 원고의 동적 키를 놓칠 수 있다.",
    "- 표지에는 제목 외 문구를 넣지 않는 현재 규칙과 맞지 않는 요소가 있다.",
    "- 비트겐슈타인 계열의 `reading`, `literature`, `grammar`, `pattern_workbook`, `chapter_test` 분리 구조가 반영되어 있지 않다.",
    "",
    "현 샘플 빌더에 적용할 방식:",
    "",
    "- 각 레벨 전체 JSON 키 인벤토리를 먼저 생성한다.",
    "- 정답·해설·모범답안·배점·채점 근거는 제외한다.",
    "- `answer_format`과 `답안_형식`은 정답이 아니라 학생이 쓸 형식이므로 출력 대상에 포함한다.",
    "- `chapter_test`와 `test.json`은 사용자의 이전 지시에 따라 사이트 시험지 파이프라인으로 분리한다.",
    "- 기계용 메타데이터는 PDF 본문에 억지로 노출하지 않되, 키 인벤토리와 빌드 보고서에서 추적한다.",
    "- 문제 지문, 보기, 조건, 선택지는 문제 번호 기준으로 다시 결합해 한 문제 블록으로 출력한다.",
    "",
  ].join("\n");

  let md = fs.readFileSync(mdPath, "utf8");
  const start = "## 기존 교재디자인 LaTeX 작업물 평가 및 반영";
  const next = "## 페이지 배분 및 가독성 규칙";
  if (md.includes(start)) {
    const s = md.indexOf(start);
    const e = md.indexOf(next, s);
    if (e < 0) throw new Error("Could not find layout rules section");
    md = `${md.slice(0, s)}${section}${md.slice(e)}`;
  } else {
    md = md.replace(`${next}\n`, `${section}${next}\n`);
  }
  fs.writeFileSync(mdPath, md, "utf8");
}

function updateStyle() {
  let style = fs.readFileSync(stylePath, "utf8");
  if (!style.includes("\\RequirePackage[most, breakable]{tcolorbox}")) {
    style = style.replace(
      "\\RequirePackage{multicol}\n\\RequirePackage{titlesec}\n",
      "\\RequirePackage{multicol}\n\\RequirePackage{titlesec}\n\\RequirePackage[most, breakable]{tcolorbox}\n\\RequirePackage{booktabs}\n\\RequirePackage{tabularx}\n\\RequirePackage{adjustbox}\n"
    );
  }

  const newLogo = String.raw`\newcommand{\KFLogo}[1][1]{%
  \IfFileExists{../../assets/brand/koreanfarm-logo.png}{%
    \scalebox{#1}{\includegraphics[width=58mm]{../../assets/brand/koreanfarm-logo.png}}%
  }{%
    \begin{tikzpicture}[x=1mm,y=1mm,scale=#1,transform shape,baseline=-7mm]
      \node[anchor=west,font=\bfseries\fontsize{24}{24}\selectfont,text=kfgray] at (0,0) {국어농장};
      \fill[kforange] (28,2.8) circle (4.0);
      \fill[kforange] (48,2.4) circle (3.4);
      \fill[kforange] (16,-2.0) circle (5.8);
      \fill[kfgreen!85!black] (13.2,3.1) ellipse (2.0 and .9);
      \fill[kfgreen!85!black] (45.5,6.0) ellipse (1.3 and .6);
      \fill[kfgreen!85!black] (31.0,6.2) ellipse (1.0 and .6);
    \end{tikzpicture}%
  }%
}

`;
  style = betweenReplace(style, "\\newcommand{\\KFLogo}", "\\pagestyle{fancy}", newLogo, "logo macro");

  if (!style.includes("KFQuestionPassageBox")) {
    const boxes = String.raw`
\newtcolorbox{KFPassageBox}[1]{%
  enhanced, breakable, colback=kflightgray, colframe=kfline,
  boxrule=.5pt, arc=2pt, left=7pt, right=7pt, top=6pt, bottom=6pt,
  title={#1}, fonttitle=\bfseries\color{kfdark}, coltitle=kfdark,
  attach boxed title to top left={xshift=6pt,yshift=-2mm},
  boxed title style={colback=white,colframe=kfline,boxrule=.4pt,arc=2pt}
}

\newtcolorbox{KFQuestionPassageBox}[1]{%
  enhanced, breakable, colback=white, colframe=kfblue!55,
  boxrule=.7pt, arc=2pt, left=7pt, right=7pt, top=6pt, bottom=6pt,
  title={#1}, fonttitle=\bfseries\color{kfblue}, coltitle=kfblue,
  borderline west={2pt}{0pt}{kfblue!70}
}

\newtcolorbox{KFActivityBox}[1]{%
  enhanced, breakable, colback=white, colframe=kfgreen!45,
  boxrule=.6pt, arc=2pt, left=7pt, right=7pt, top=6pt, bottom=6pt,
  title={#1}, fonttitle=\bfseries\color{kfgreen!55!black}, coltitle=kfgreen!55!black,
  borderline west={2pt}{0pt}{kfgreen!65}
}

\newtcolorbox{KFConditionBox}{%
  enhanced, breakable, colback=kforange!6, colframe=kforange!45,
  boxrule=.5pt, arc=2pt, left=7pt, right=7pt, top=5pt, bottom=5pt
}

`;
    style = style.replace("\\newcommand{\\KFBookHeading}[1]{%", `${boxes}\n\\newcommand{\\KFBookHeading}[1]{%`);
  }

  fs.mkdirSync(path.dirname(logoTarget), { recursive: true });
  if (fs.existsSync(logoSource)) fs.copyFileSync(logoSource, logoTarget);
  fs.writeFileSync(stylePath, style, "utf8");
}

function updateBuilder() {
  let b = fs.readFileSync(builderPath, "utf8");

  b = replaceOnce(
    b,
    `function para(value) {
  const text = stripHtml(value).replace(/\\r\\n/g, "\\n").replace(/\\r/g, "\\n").trim();
  if (!text) return "";
  return text
    .split(/\\n{2,}/)
    .map((block) => \`\${tex(block).replace(/\\n/g, "\\\\\\\\{}\\n")}\\n\\n\`)
    .join("");
}
`,
    `function para(value) {
  const text = stripHtml(value).replace(/\\r\\n/g, "\\n").replace(/\\r/g, "\\n").trim();
  if (!text) return "";
  return renderMarkdownAwareText(text);
}

function isMarkdownTableStart(lines, idx) {
  return idx + 1 < lines.length && /^\\s*\\|/.test(lines[idx]) && /^\\s*\\|?\\s*:?-{3,}/.test(lines[idx + 1]);
}

function splitMarkdownRow(line) {
  let s = String(line).trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  const cells = [];
  let current = "";
  for (let idx = 0; idx < s.length; idx += 1) {
    if (s[idx] === "\\\\" && s[idx + 1] === "|") {
      current += "|";
      idx += 1;
    } else if (s[idx] === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += s[idx];
    }
  }
  cells.push(current.trim());
  return cells;
}

function renderMarkdownTable(lines) {
  const rows = lines.filter((line, idx) => idx !== 1).map(splitMarkdownRow);
  const colCount = Math.max(...rows.map((row) => row.length), 1);
  const spec = Array.from({ length: colCount }, () => "X").join("");
  const out = ["\\\\begin{center}", "{\\\\small", "\\\\renewcommand{\\\\arraystretch}{1.24}", "\\\\begin{adjustbox}{max width=\\\\linewidth}", "\\\\begin{tabularx}{\\\\linewidth}{" + spec + "}", "\\\\toprule"];
  rows.forEach((row, idx) => {
    const padded = Array.from({ length: colCount }, (_, cidx) => tex(row[cidx] || ""));
    out.push(padded.join(" & ") + " \\\\\\\\");
    if (idx === 0) out.push("\\\\midrule");
  });
  out.push("\\\\bottomrule", "\\\\end{tabularx}", "\\\\end{adjustbox}", "}", "\\\\end{center}", "");
  return out.join("\\n");
}

function renderMarkdownAwareText(text) {
  const lines = String(text).split("\\n");
  const out = [];
  let buffer = [];
  const flush = () => {
    const chunk = buffer.join("\\n").trim();
    if (chunk) {
      out.push(
        chunk
          .split(/\\n{2,}/)
          .map((block) => tex(block).replace(/\\n/g, "\\\\\\\\{}\\n") + "\\n\\n")
          .join("")
      );
    }
    buffer = [];
  };
  for (let idx = 0; idx < lines.length; idx += 1) {
    if (isMarkdownTableStart(lines, idx)) {
      flush();
      const tableLines = [lines[idx], lines[idx + 1]];
      idx += 2;
      while (idx < lines.length && /^\\s*\\|/.test(lines[idx])) {
        tableLines.push(lines[idx]);
        idx += 1;
      }
      idx -= 1;
      out.push(renderMarkdownTable(tableLines));
    } else {
      buffer.push(lines[idx]);
    }
  }
  flush();
  return out.join("\\n");
}
`,
    "markdown-aware para"
  );

  if (!b.includes("function renderQuestionPassage")) {
    b = b.replace(
      `function renderPassage(content, title = "") {
  if (!content) return "";
  const text = typeof content === "string" ? content : content.text || content.body || "";
  const source = typeof content === "object" ? content.source : "";
  const figures = Array.isArray(content?.figures) ? content.figures : [];
  let out = "";
  if (title) out += \`\${command("KFSmallTitle", title)}\\n\`;
  out += "\\\\begin{KFPassage}\\n";
  out += para(text);
  out += "\\\\end{KFPassage}\\n";
  if (source) out += \`\${command("KFMeta", \`출처: \${source}\`)}\\n\`;
  for (const figure of figures) {
    out += \`\\\\KFImageSlot{\${tex(figure.id || "figure")}}{\${tex(figure.prompt || "")}}\\n\`;
  }
  return out;
}
`,
      `function renderPassage(content, title = "") {
  if (!content) return "";
  const text = typeof content === "string" ? content : content.text || content.body || "";
  const source = typeof content === "object" ? content.source : "";
  const figures = Array.isArray(content?.figures) ? content.figures : [];
  let out = \`\\\\begin{KFPassageBox}{\${tex(title || "지문")}}\\n\`;
  out += para(text);
  out += "\\\\end{KFPassageBox}\\n";
  if (source) out += \`\${command("KFMeta", \`출처: \${source}\`)}\\n\`;
  for (const figure of figures) {
    out += \`\\\\KFImageSlot{\${tex(figure.id || "figure")}}{\${tex(figure.prompt || "")}}\\n\`;
  }
  return out;
}

function renderQuestionPassage(content, title = "문제 지문") {
  if (!content) return "";
  const text = typeof content === "string" ? content : content.text || content.지문 || content.body || "";
  const instruction = typeof content === "object" ? content.instruction || content.지침 || "" : "";
  let out = \`\\\\begin{KFQuestionPassageBox}{\${tex(title)}}\\n\`;
  if (instruction) out += \`\${command("KFInstruction", instruction)}\\n\`;
  out += para(text);
  out += "\\\\end{KFQuestionPassageBox}\\n";
  return out;
}
`
    );
  }

  b = b.replace(
    `  if (item.passage) out += renderPassage(item.passage, "지문");`,
    `  if (item.passage) out += renderQuestionPassage(item.passage, "문제 지문");`
  );

  if (!b.includes("item.condition")) {
    b = b.replace(
      `  if (item.box) {
    out += "\\\\begin{KFNoteBox}\\n";
    out += para(item.box);
    out += "\\\\end{KFNoteBox}\\n";
  }
  out += renderChoices(item);
`,
      `  if (item.box) {
    out += "\\\\begin{KFNoteBox}\\n";
    out += para(item.box);
    out += "\\\\end{KFNoteBox}\\n";
  }
  if (item.condition) {
    out += "\\\\begin{KFConditionBox}\\n";
    out += para("[조건]\\n" + item.condition);
    out += "\\\\end{KFConditionBox}\\n";
  }
  out += renderChoices(item);
`
    );
  }

  if (!b.includes("function renderDynamicQuestionGroups")) {
    const dynamic = String.raw`
const dynamicQuestionTypes = [
  { suffix: "_객관식_문제", label: "객관식", choices: "_객관식_선택지", box: "_객관식_보기", condition: "_객관식_조건", objective: true },
  { suffix: "_단답형_문제", label: "단답형", choices: "_단답형_선택지", box: "_단답형_보기", condition: "_단답형_조건", objective: false },
  { suffix: "_서술형_문제", label: "서술형", choices: "_서술형_선택지", box: "_서술형_보기", condition: "_서술형_조건", objective: false },
  { suffix: "_빈칸형_문제", label: "빈칸형", choices: "_빈칸형_선택지", box: "_빈칸형_보기", condition: "_빈칸형_조건", objective: false },
  { suffix: "_괄호_선택형_문제", label: "괄호 선택형", choices: "_괄호_선택형_선택지", box: "_괄호_선택형_보기", condition: "_괄호_선택형_조건", objective: true },
  { suffix: "_연결_문제", label: "연결형", choices: "_연결_선택지", box: "_연결_보기", condition: "_연결_조건", objective: false },
  { suffix: "_연결형_문제", label: "연결형", choices: "_연결형_선택지", box: "_연결형_보기", condition: "_연결형_조건", objective: false },
  { suffix: "_OX_문제", label: "O/X", choices: "_OX_선택지", box: "_OX_보기", condition: "_OX_조건", objective: true },
  { suffix: "_글쓰기_문제", label: "글쓰기", choices: "_글쓰기_선택지", box: "_글쓰기_보기", condition: "_글쓰기_조건", objective: false },
];

function numberOfProblem(item, idx) {
  return String(item?.번호 || item?.number || item?.refId || item?.id || idx + 1);
}

function valueByNumber(collection, num) {
  if (!collection || typeof collection !== "object") return "";
  return collection[num] ?? collection[String(Number(num))] ?? collection[Number(num)] ?? "";
}

function passageForNumber(passages, num) {
  if (!passages || typeof passages !== "object") return null;
  const exact = valueByNumber(passages, num);
  if (exact) return exact;
  const n = Number(num);
  const starts = Object.keys(passages).map(Number).filter((v) => Number.isFinite(v) && v <= n).sort((a, b) => b - a);
  return starts.length ? passages[String(starts[0])] : null;
}

function normalizeChoices(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((choice, idx) => {
      if (choice && typeof choice === "object") return choice;
      const text = String(choice);
      const id = text.match(/^[①②③④⑤⑥⑦⑧⑨⑩]/)?.[0] || String(idx + 1);
      return { id, text };
    });
  }
  if (typeof value === "object") {
    return Object.entries(value).map(([id, text]) => ({ id, text: String(text) }));
  }
  return [{ id: "", text: String(value) }];
}

function renderDynamicQuestionGroups(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return { output: "", consumed: new Set() };
  let output = "";
  const consumed = new Set();
  const problemPassages = obj["문제_지문"] || obj["문제 지문"] || obj["실력_확인_문제_지문"];

  for (const spec of dynamicQuestionTypes) {
    for (const [key, problems] of Object.entries(obj)) {
      if (!key.endsWith(spec.suffix) || !Array.isArray(problems)) continue;
      const base = key.slice(0, -spec.suffix.length);
      const choiceMap = obj[base + spec.choices] || {};
      const boxMap = obj[base + spec.box] || {};
      const conditionMap = obj[base + spec.condition] || {};
      consumed.add(key);
      consumed.add(base + spec.choices);
      consumed.add(base + spec.box);
      consumed.add(base + spec.condition);
      if (problemPassages) consumed.add("문제_지문"), consumed.add("문제 지문"), consumed.add("실력_확인_문제_지문");
      output += command("KFSmallTitle", (base || "문제") + " " + spec.label) + "\n";
      problems.forEach((problem, idx) => {
        const num = numberOfProblem(problem, idx);
        const stem = problem?.문제 || problem?.stem || problem?.prompt || problem?.text || renderInlineObject(problem);
        const q = {
          number: num,
          stem,
          choices: normalizeChoices(valueByNumber(choiceMap, num) || problem?.choices || problem?.선택지),
          box: valueByNumber(boxMap, num) || problem?.보기 || problem?.box || "",
          condition: valueByNumber(conditionMap, num) || problem?.조건 || "",
        };
        if (spec.objective) {
          const psg = passageForNumber(problemPassages, num);
          if (psg) q.passage = psg;
        }
        output += renderQuestionItem(q, idx + 1);
      });
    }
  }
  return { output, consumed };
}

`;
    b = b.replace("function renderGeneric(value, label = \"\") {", `${dynamic}\nfunction renderGeneric(value, label = "") {`);
  }

  b = b.replace(
    `  if (value.title) out += \`\${command("KFSmallTitle", value.title)}\\n\`;
  if (value.instruction) out += \`\${command("KFInstruction", value.instruction)}\\n\`;
`,
    `  if (value.title) out += \`\${command("KFSmallTitle", value.title)}\\n\`;
  if (value.instruction) out += \`\${command("KFInstruction", value.instruction)}\\n\`;
  const dynamicGroups = renderDynamicQuestionGroups(value);
  out += dynamicGroups.output;
`
  );

  b = b.replace(
    `  const consumed = new Set([
    "title",
    "instruction",
    "text",
    "passage",
    "table",
    "summaryTable",
    "questions",
    "items",
    "examples",
  ]);
`,
    `  const consumed = new Set([
    "title",
    "instruction",
    "text",
    "passage",
    "table",
    "summaryTable",
    "questions",
    "items",
    "examples",
  ]);
  for (const key of dynamicGroups.consumed) consumed.add(key);
`
  );

  b = b.replace(
    `  else if (section.type === "question") out += renderQuestionCollection(section.content);
  else if (section.type === "summary_table") out += renderSummaryTable(section.content);
  else out += renderGeneric(section.content);
`,
    `  else if (section.type === "question") out += renderQuestionCollection(section.content);
  else if (section.type === "summary_table") out += renderSummaryTable(section.content);
  else if (["activity", "writing", "writing_set", "section_group"].includes(section.type)) {
    out += \`\\\\begin{KFActivityBox}{\${tex(section.subtype || section.title || "활동")}}\\n\`;
    out += renderGeneric(section.content);
    out += "\\\\end{KFActivityBox}\\n";
  } else out += renderGeneric(section.content);
`
  );

  fs.writeFileSync(builderPath, b, "utf8");
}

updatePlanDoc();
updateStyle();
updateBuilder();
console.log(JSON.stringify({ mdPath, stylePath, builderPath, logoTarget }, null, 2));
