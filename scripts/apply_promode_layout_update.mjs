import fs from "node:fs";
import path from "node:path";

const root = path.join("C:", "Users", "RENEWCOM PC", "Documents", "프로모드 원고");
const mdPath = path.join(root, "프로모드_12레벨_교재구성_LaTeX_코딩계획.md");
const stylePath = path.join(root, "latex_trial", "styles", "koreanfarmtrial.sty");
const builderPath = path.join(root, "latex_trial", "build_level1_books.mjs");

function replaceOrThrow(source, from, to, label) {
  if (!source.includes(from)) {
    throw new Error(`${label} replacement target not found`);
  }
  return source.replace(from, to);
}

function updateMarkdown() {
  const section = [
    "## 페이지 배분 및 가독성 규칙",
    "",
    "LaTeX 조판에서 가장 중요한 원칙은 학습자가 눈으로 따라가는 단위를 중간에서 끊지 않는 것이다. 특히 라벨, 영역 제목, 문제 번호, 발문, 보기, 조건, 선택지가 서로 다른 페이지나 단으로 흩어지면 독해 흐름이 깨지므로 아래 규칙을 기본값으로 둔다.",
    "",
    "- 라벨 고아 방지: 영역명, 섹션명, 소제목, 문제 번호가 페이지 맨 아래에 혼자 남지 않도록 한다. 라벨 뒤에 최소 6~10행 이상 들어갈 공간이 없으면 라벨부터 다음 페이지로 넘긴다.",
    "- 문제 블록 원자화: 문제 번호, 발문, 보기, 조건, 선택지, 서술형 답안 공간은 하나의 `question block`으로 묶는다. 이 블록 내부에서는 페이지 나눔이나 단 나눔이 일어나지 않게 한다.",
    "- 지문과 문제의 분리 기준: 긴 공통 지문은 페이지를 넘어갈 수 있다. 그러나 지문이 끝난 뒤 이어지는 개별 문제 블록은 쪼개지지 않게 한다. 지문 일부와 문제 번호만 같은 페이지에 남는 배치는 피한다.",
    "- 보기/조건 보호: `<보기>`, `[조건]`, 예시문, 선택지 묶음은 발문과 함께 움직인다. 보기만 앞 페이지에 있고 선택지가 다음 페이지에 나오는 배치는 금지한다.",
    "- 선택지 보호: 객관식 선택지는 한 문제 안에서 함께 유지한다. 선택지가 많아 한 페이지에 들어가지 않으면 해당 문제 전체를 다음 페이지로 보내거나 글자 크기/간격을 조정한다.",
    "- 영역 시작 규칙: 새 챕터는 새 페이지에서 시작한다. 대영역은 남은 지면이 25~30% 미만이면 다음 페이지에서 시작한다. 소영역은 최소 6행 이상 여유가 있을 때만 현재 페이지에 둔다.",
    "- 표와 빈칸 활동: 표 제목과 첫 행이 분리되지 않게 하고, 표가 길면 행 단위로만 넘어가게 한다. 표 머리글은 필요하면 반복 출력한다.",
    "- 2단 조판 규칙: 프레게3 이후 문제 영역에 2단을 쓰더라도 문제 블록 하나가 단 사이에서 갈라지면 안 된다. `paracol` 또는 블록형 minipage를 써서 문제 단위를 보존한다.",
    "- 초등 저학년 규칙: 소쉬르1~2는 라벨과 활동이 떨어지면 학습자가 길을 잃기 쉬우므로 섹션 시작 기준을 더 보수적으로 잡는다.",
    "- 중고등 규칙: 러셀/비트겐슈타인은 지문은 길게 흐르더라도 문제 판단 단위는 끊지 않는다. 수능형 문제는 발문-보기-선택지를 한 화면처럼 읽게 만드는 것이 우선이다.",
    "",
    "시험 조판용 LaTeX 구현 기준:",
    "",
    "```tex",
    "\\newcommand{\\KFNeedSpace}[1]{남은 지면이 #1줄보다 적으면 \\newpage}",
    "\\newenvironment{KFQuestion}{문제 블록 시작: \\KFNeedSpace{14}, samepage 적용}{문제 블록 종료}",
    "\\newcommand{\\KFSection}[2]{섹션 라벨 시작 전 \\KFNeedSpace{8} 적용}",
    "```",
    "",
    "단, 하나의 문제 블록이 물리적으로 한 페이지보다 길면 강제로 한 페이지에 밀어 넣지 않는다. 이 경우는 디자인 문제로 보고 지문을 공통 지문 블록으로 분리하거나, 선택지 간격·글자 크기·답안 공간을 조정해 다시 조판한다.",
    "",
  ].join("\n");

  let md = fs.readFileSync(mdPath, "utf8");
  const start = "## 페이지 배분 및 가독성 규칙";
  const next = "## LaTeX 시스템 설계";
  if (md.includes(start)) {
    const startIdx = md.indexOf(start);
    const nextIdx = md.indexOf(next, startIdx);
    if (nextIdx < 0) throw new Error("Could not find next section after layout rules");
    md = `${md.slice(0, startIdx)}${section}${md.slice(nextIdx)}`;
  } else {
    md = md.replace(`${next}\n`, `${section}${next}\n`);
  }
  fs.writeFileSync(mdPath, md, "utf8");
}

function updateStyle() {
  let style = fs.readFileSync(stylePath, "utf8");
  if (!style.includes("\\newcommand{\\KFNeedSpace}")) {
    style = style.replace(
      "\\emergencystretch=2em\n\\tolerance=1200\n",
      "\\emergencystretch=2em\n\\tolerance=1200\n\n\\makeatletter\n\\newcommand{\\KFNeedSpace}[1]{%\n  \\par\n  \\begingroup\n  \\dimen@=#1\\baselineskip\n  \\ifdim\\dimexpr\\pagegoal-\\pagetotal\\relax<\\dimen@\n    \\newpage\n  \\fi\n  \\endgroup\n}\n\\makeatother\n"
    );
  }
  style = replaceOrThrow(
    style,
    "\\newcommand{\\KFSection}[2]{%\n  \\vspace{6pt}\n  \\noindent\n",
    "\\newcommand{\\KFSection}[2]{%\n  \\KFNeedSpace{8}%\n  \\vspace{6pt}\n  \\noindent\n",
    "KFSection"
  );
  style = replaceOrThrow(
    style,
    "\\newcommand{\\KFSmallTitle}[1]{%\n  \\vspace{4pt}\n",
    "\\newcommand{\\KFSmallTitle}[1]{%\n  \\KFNeedSpace{4}%\n  \\vspace{4pt}\n",
    "KFSmallTitle"
  );
  style = replaceOrThrow(
    style,
    "\\newcommand{\\KFInstruction}[1]{%\n  \\vspace{2pt}{\\small\\bfseries\\color{kfblue}#1}\\par\n}",
    "\\newcommand{\\KFInstruction}[1]{%\n  \\KFNeedSpace{3}%\n  \\vspace{2pt}{\\small\\bfseries\\color{kfblue}#1}\\par\n}",
    "KFInstruction"
  );
  style = replaceOrThrow(
    style,
    "\\newenvironment{KFPassage}{%\n  \\par\\smallskip\n",
    "\\newenvironment{KFPassage}{%\n  \\KFNeedSpace{7}%\n  \\par\\smallskip\n",
    "KFPassage"
  );
  style = replaceOrThrow(
    style,
    "\\newenvironment{KFQuestion}{%\n  \\par\\medskip\n  \\begingroup\n}{%\n  \\par\\endgroup\\medskip\n}",
    "\\newenvironment{KFQuestion}{%\n  \\KFNeedSpace{14}%\n  \\par\\medskip\n  \\begin{samepage}%\n  \\begingroup\n}{%\n  \\par\\endgroup\n  \\end{samepage}%\n  \\medskip\n}",
    "KFQuestion"
  );
  fs.writeFileSync(stylePath, style, "utf8");
}

function updateBuilder() {
  let builder = fs.readFileSync(builderPath, "utf8");
  builder = replaceOrThrow(
    builder,
    "  let out = \"\\\\begin{KFQuestion}\\n\";\n  out += `\\\\KFQuestionNo{${tex(item.number || fallbackNumber)}}\\n`;\n  if (item.domain || item.subDomain || item.patternName) {\n    out += renderMetaLine([item.domain, item.subDomain, item.patternName]);\n  }\n  if (item.patternDescription) out += `${command(\"KFInstruction\", item.patternDescription)}\\n`;\n  if (item.passage) out += renderPassage(item.passage, \"지문\");\n",
    "  let out = \"\";\n  if (item.passage) out += renderPassage(item.passage, \"지문\");\n  out += \"\\\\begin{KFQuestion}\\n\";\n  out += `\\\\KFQuestionNo{${tex(item.number || fallbackNumber)}}\\n`;\n  if (item.domain || item.subDomain || item.patternName) {\n    out += renderMetaLine([item.domain, item.subDomain, item.patternName]);\n  }\n  if (item.patternDescription) out += `${command(\"KFInstruction\", item.patternDescription)}\\n`;\n",
    "renderQuestionItem passage split"
  );
  fs.writeFileSync(builderPath, builder, "utf8");
}

updateMarkdown();
updateStyle();
updateBuilder();
console.log(JSON.stringify({ mdPath, stylePath, builderPath }, null, 2));
