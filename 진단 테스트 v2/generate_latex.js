#!/usr/bin/env node
/**
 * 국어농장 진단 테스트 LaTeX 시험지 생성기
 * JSON 데이터를 읽어 XeLaTeX 소스 파일을 자동 생성한다.
 */

const fs = require("fs");
const path = require("path");

const BASE_DIR = __dirname;

// 레벨별 설정
const LEVEL_CONFIG = {
  sohssure: {
    korean_name: "소쉬르",
    target: "초등 저학년 (1~3학년)",
    body_size: "12pt",
    passage_size: "11.5pt",
    line_spread: "1.5",
    num_choices: 3,
  },
  frege: {
    korean_name: "프레게",
    target: "초등 고학년 (4~6학년)",
    body_size: "11pt",
    passage_size: "10.5pt",
    line_spread: "1.45",
    num_choices: 5,
  },
  russell: {
    korean_name: "러셀",
    target: "중학생 (7~9학년)",
    body_size: "10pt",
    passage_size: "9.5pt",
    line_spread: "1.4",
    num_choices: 5,
  },
  wittgenstein: {
    korean_name: "비트겐슈타인",
    target: "고등학생 (10~12학년)",
    body_size: "9.5pt",
    passage_size: "9pt",
    line_spread: "1.35",
    num_choices: 5,
  },
};

const CHOICE_CIRCLES = { A: "①", B: "②", C: "③", D: "④", E: "⑤" };

function escapeLatex(text) {
  if (!text) return "";
  text = text.replace(/\\/g, "\\textbackslash{}");
  for (const ch of ["&", "%", "$", "#", "_", "{", "}"]) {
    text = text.split(ch).join("\\" + ch);
  }
  text = text.split("~").join("\\textasciitilde{}");
  text = text.split("^").join("\\textasciicircum{}");
  return text;
}

function processText(text) {
  if (!text) return "";
  // 괄호 빈칸 ( ), (  ), (   ) 등 → 플레이스홀더로 치환 (escapeLatex 회피)
  const BLANK_PH = "\x00BLANK\x00";
  text = text.replace(/\(\s+\)/g, BLANK_PH);
  const parts = text.split(/(\*\*.+?\*\*)/g);
  const result = [];
  for (const part of parts) {
    const m = part.match(/^\*\*(.+?)\*\*$/);
    if (m) {
      result.push("\\textbf{" + escapeLatex(m[1]) + "}");
    } else {
      result.push(escapeLatex(part));
    }
  }
  return result.join("").split(BLANK_PH).join("\\underline{\\hspace{3cm}}");
}

function processPassageText(text) {
  const lines = text.trim().split("\n");
  const processed = lines.map((line) => {
    const trimmed = line.trimEnd();
    return trimmed === "" ? "" : processText(trimmed);
  });

  const resultLines = [];
  for (let i = 0; i < processed.length; i++) {
    if (processed[i] === "") {
      resultLines.push("\\\\[0.5em]");
    } else {
      if (i < processed.length - 1 && processed[i + 1] !== "") {
        resultLines.push(processed[i] + " \\\\");
      } else {
        resultLines.push(processed[i]);
      }
    }
  }
  return resultLines.join("\n");
}

function loadConfig() {
  return JSON.parse(
    fs.readFileSync(path.join(BASE_DIR, "config.json"), "utf-8")
  );
}

function loadPassageData(passageDir) {
  const fullPath = path.join(BASE_DIR, passageDir);
  const metadata = JSON.parse(
    fs.readFileSync(path.join(fullPath, "metadata.json"), "utf-8")
  );
  const passageText = fs.readFileSync(
    path.join(fullPath, "passage.md"),
    "utf-8"
  );

  const qDir = path.join(fullPath, "questions");
  const qFiles = fs
    .readdirSync(qDir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const questions = qFiles.map((f) =>
    JSON.parse(fs.readFileSync(path.join(qDir, f), "utf-8"))
  );

  return { metadata, passageText, questions };
}

function loadAllPassages(testInfo) {
  return testInfo.passages.map((pDir) => loadPassageData(pDir));
}

function generatePreamble(testName) {
  const cfg = LEVEL_CONFIG[testName];
  const docSize = cfg.body_size;
  const docClassSize = ["10pt", "11pt", "12pt"].includes(docSize)
    ? docSize
    : "10pt";

  const bodyPt = parseFloat(cfg.body_size);
  const passagePt = parseFloat(cfg.passage_size);
  const ls = parseFloat(cfg.line_spread);
  const bodyLeading = (bodyPt * ls).toFixed(1);
  const passageLeading = (passagePt * ls).toFixed(1);

  return `\\documentclass[${docClassSize}, a4paper]{article}

% === 인코딩 & 폰트 ===
\\usepackage{fontspec}

% Noto Sans KR Variable Font
\\setmainfont{Noto Sans KR}[
  Script=Hangul,
  Renderer=HarfBuzz
]
\\setsansfont{Noto Sans KR}[
  Script=Hangul,
  Renderer=HarfBuzz
]

% === 레이아웃 ===
\\usepackage[top=20mm, bottom=20mm, left=15mm, right=15mm]{geometry}
\\usepackage{multicol}
\\setlength{\\columnsep}{8mm}
\\setlength{\\columnseprule}{0.4pt}

% === 색상 ===
\\usepackage[dvipsnames]{xcolor}
\\definecolor{accentbrown}{HTML}{8B6914}
\\definecolor{passagebg}{gray}{0.95}

% === 그래픽 ===
\\usepackage{graphicx}
\\usepackage{tikz}

% === 기타 패키지 ===
\\usepackage{enumitem}
\\usepackage{tcolorbox}
\\tcbuselibrary{breakable, skins}
\\usepackage{tabularx}
\\usepackage{booktabs}
\\usepackage{fancyhdr}
\\usepackage{lastpage}
\\usepackage{setspace}

% === 폰트 크기 재설정 (레벨별) ===
\\makeatletter
\\renewcommand{\\normalsize}{\\@setfontsize\\normalsize{${bodyPt}pt}{${bodyLeading}pt}}
\\makeatother
\\normalsize

% === 행간 ===
\\linespread{${cfg.line_spread}}

% === 지문 폰트 크기 ===
\\newcommand{\\passagefontsize}{\\fontsize{${passagePt}pt}{${passageLeading}pt}\\selectfont}

% === 지문 박스 스타일 ===
\\newtcolorbox{passagebox}[1][]{
  enhanced,
  breakable,
  colback=passagebg,
  colframe=black!30,
  boxrule=0.3pt,
  left=4mm,
  right=3mm,
  top=2mm,
  bottom=2mm,
  borderline west={2pt}{0pt}{accentbrown},
  fontupper=\\passagefontsize,
  before upper={\\setstretch{${cfg.line_spread}}},
  #1
}

% === 보기 박스 스타일 ===
\\newtcolorbox{boxibox}[1][]{
  enhanced,
  colback=white,
  colframe=accentbrown!60,
  coltitle=white,
  fonttitle=\\small\\bfseries,
  title={보기},
  boxrule=0.5pt,
  attach boxed title to top left={xshift=4mm, yshift=-\\tcboxedtitleheight/2},
  boxed title style={colback=accentbrown, colframe=accentbrown, boxrule=0.5pt, sharp corners},
  left=3mm, right=3mm, top=3mm, bottom=1.5mm,
  #1
}

% === 페이지 번호 ===
\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\fancyfoot[C]{\\small \\thepage~/~\\pageref{LastPage}}

% === 하이픈 방지 ===
\\tolerance=1
\\emergencystretch=\\maxdimen
\\hyphenpenalty=10000
\\hbadness=10000

\\begin{document}
`;
}

function generateHeader(testName) {
  const cfg = LEVEL_CONFIG[testName];
  return `
% === 헤더 ===
\\noindent%
\\begin{minipage}[c]{0.12\\textwidth}
\\includegraphics[width=\\linewidth, keepaspectratio]{korfarm-logo.png}
\\end{minipage}%
\\hfill%
\\begin{minipage}[c]{0.50\\textwidth}
\\centering
{\\fontsize{13pt}{16pt}\\selectfont\\bfseries 국어농장 시작하기}\\\\[4pt]
{\\fontsize{26pt}{30pt}\\selectfont\\bfseries ${cfg.korean_name}}
\\end{minipage}%
\\hfill%
\\begin{minipage}[c]{0.30\\textwidth}
\\raggedleft
{\\small \\underline{\\hspace{1.8cm}} 학교\\enspace \\underline{\\hspace{0.8cm}} 학년}\\\\[2pt]
{\\small 이름 \\underline{\\hspace{2.5cm}}}
\\end{minipage}

\\vspace{4pt}
\\noindent\\rule{\\textwidth}{1pt}
\\vspace{-\\baselineskip}
\\vspace{-\\parskip}

\\begin{multicols}{2}
`;
}

function formatPassage(passageData, idx, qStart, qEnd) {
  const { passageText } = passageData;
  const processed = processPassageText(passageText);

  const range = qStart === qEnd ? `[${qStart}]` : `[${qStart}~${qEnd}]`;

  return `
\\vspace{1mm}
\\noindent{\\small\\bfseries ◆ 다음 글을 읽고 물음에 답하시오. ${range}}
\\vspace{0.5mm}

\\begin{passagebox}
\\noindent{}${processed}
\\end{passagebox}
\\vspace{1mm}
`;
}

function isShortChoices(choices) {
  // 선택지 총 글자수 (원문자+공백 포함)를 기준으로 판단
  // 2단 컬럼 폭 ~약 40자 기준
  const totalLen = choices.reduce((s, c) => s + c.text.length + 3, 0); // +3: 원문자+공백
  return totalLen <= 38;
}

function formatQuestion(qJson, qNumber, testName) {
  const q = qJson.question;
  const stem = processText(q.stem);
  const isDescriptive = q.type === "서술형";

  const parts = [];
  parts.push("\\noindent\\begin{minipage}{\\columnwidth}");
  parts.push("\\vspace{2mm}");
  parts.push(`{\\hangindent=1.5em \\hangafter=1 \\noindent{\\bfseries ${qNumber}.}~${stem}\\par}`);
  parts.push("");

  // 보기 박스
  if (q.box) {
    const boxLines = q.box.split("\n");
    parts.push("\\vspace{1mm}");
    parts.push("\\begin{boxibox}");
    for (const bl of boxLines) {
      const trimmed = bl.trim();
      if (trimmed && trimmed !== "<보기>") {
        parts.push(processText(trimmed) + " \\\\");
      }
    }
    parts.push("\\end{boxibox}");
    parts.push("\\vspace{1mm}");
    parts.push("");
  }

  if (isDescriptive) {
    parts.push("\\vspace{3mm}");
    for (let i = 0; i < 5; i++) {
      parts.push("\\noindent\\hrulefill");
      parts.push("\\vspace{2.5mm}");
    }
    parts.push("\\vspace{1mm}");
  } else {
    const choices = qJson.choices || [];
    const short = isShortChoices(choices);

    if (short && choices.length <= 5) {
      // 가로 배열 — mbox로 원문자+텍스트 줄바꿈 방지
      parts.push("\\vspace{0.5mm}");
      parts.push("\\noindent");
      const choiceStrs = choices.map((c) => {
        const circle = CHOICE_CIRCLES[c.choice_id] || c.choice_id;
        return `\\mbox{${circle}~${processText(c.text)}}`;
      });
      parts.push(choiceStrs.join("\\hspace{1em}"));
      parts.push("");
    } else {
      // 세로 배열 — hangindent로 원문자 좌측 고정 + 둘째줄 들여쓰기
      parts.push("\\vspace{0.5mm}");
      for (const c of choices) {
        const circle = CHOICE_CIRCLES[c.choice_id] || c.choice_id;
        parts.push(`{\\hangindent=1.3em \\hangafter=1 \\noindent\\hspace{0.3em}${circle}~${processText(c.text)}\\par}`);
      }
    }
  }

  parts.push("\\vspace{4mm}");
  parts.push("\\end{minipage}");
  parts.push("\\par");
  parts.push("");

  return parts.join("\n");
}

function formatAnswerKey(passages, testName) {
  const parts = [];
  parts.push("\\end{multicols}");
  parts.push("\\newpage");
  parts.push("");
  parts.push("\\noindent{\\Large\\bfseries 정답표}");
  parts.push("\\vspace{3mm}");
  parts.push("\\noindent\\rule{\\textwidth}{0.8pt}");
  parts.push("\\vspace{3mm}");
  parts.push("");

  let qGlobal = 0;
  let hasDescriptive = false;
  const descriptiveAnswers = [];

  parts.push("\\noindent{\\bfseries 객관식 정답}");
  parts.push("\\vspace{2mm}");
  parts.push("");

  // 실제 데이터에서 최대 선택지 수 결정
  let numChoices = 0;
  for (const pdata of passages) {
    for (const q of pdata.questions) {
      if (q.choices) numChoices = Math.max(numChoices, q.choices.length);
    }
  }
  if (numChoices === 0) numChoices = 5;
  const choiceHeaders = Array.from({ length: numChoices }, (_, i) =>
    CHOICE_CIRCLES[String.fromCharCode(65 + i)]
  ).join(" & ");
  const colSpec =
    "c|c|" + Array.from({ length: numChoices }, () => "c").join("|");

  parts.push(`\\begin{tabularx}{\\textwidth}{|${colSpec}|}`);
  parts.push("\\hline");
  parts.push(`\\textbf{지문} & \\textbf{번호} & ${choiceHeaders} \\\\`);
  parts.push("\\hline");

  for (let pIdx = 0; pIdx < passages.length; pIdx++) {
    const pdata = passages[pIdx];
    const genreShort = pdata.metadata.genre === "문학" ? "문" : "비";

    for (const q of pdata.questions) {
      qGlobal++;
      const qType = q.question.type || "";

      if (qType === "서술형") {
        hasDescriptive = true;
        descriptiveAnswers.push({
          number: qGlobal,
          passage: pIdx + 1,
          model_answer: q.model_answer || "",
        });
        const emptyCells = Array(numChoices).fill("--").join(" & ");
        parts.push(
          `[${pIdx + 1}]${genreShort} & ${qGlobal} & ${emptyCells} \\\\`
        );
      } else {
        const correct = q.correct_choice || "";
        const cells = Array.from({ length: numChoices }, (_, i) => {
          const letter = String.fromCharCode(65 + i);
          return letter === correct ? "\\textbf{O}" : "";
        });
        parts.push(
          `[${pIdx + 1}]${genreShort} & ${qGlobal} & ${cells.join(" & ")} \\\\`
        );
      }
      parts.push("\\hline");
    }
  }

  parts.push("\\end{tabularx}");
  parts.push("\\vspace{5mm}");
  parts.push("");

  if (hasDescriptive) {
    parts.push("\\noindent{\\bfseries 서술형 모범답안}");
    parts.push("\\vspace{2mm}");
    parts.push("");
    parts.push(
      "\\begin{enumerate}[label={}, leftmargin=0em, itemsep=2pt]"
    );
    for (const da of descriptiveAnswers) {
      const answer = processText(da.model_answer);
      parts.push(
        `\\item \\textbf{${da.number}번} (지문 [${da.passage}]): ${answer}`
      );
    }
    parts.push("\\end{enumerate}");
  }

  return parts.join("\n");
}

function generateLatex(testName, testInfo, passages) {
  const parts = [];
  parts.push(generatePreamble(testName));
  parts.push(generateHeader(testName));

  let qGlobal = 0;
  for (let pIdx = 0; pIdx < passages.length; pIdx++) {
    const qStart = qGlobal + 1;
    const qEnd = qGlobal + passages[pIdx].questions.length;
    parts.push(formatPassage(passages[pIdx], pIdx + 1, qStart, qEnd));
    for (const q of passages[pIdx].questions) {
      qGlobal++;
      parts.push(formatQuestion(q, qGlobal, testName));
    }
  }

  parts.push(formatAnswerKey(passages, testName));
  parts.push("");
  parts.push("\\end{document}");
  parts.push("");

  return parts.join("\n");
}

function writeFile(filepath, content) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, content, "utf-8");
  console.log(`  생성 완료: ${filepath}`);
}

function main() {
  const config = loadConfig();
  console.log("=== 국어농장 진단 테스트 LaTeX 시험지 생성 ===\n");

  for (const testName of config.test_order) {
    const testInfo = config.tests[testName];
    console.log(`[${testName}] 데이터 로드 중...`);
    const passages = loadAllPassages(testInfo);

    const totalQ = passages.reduce((s, p) => s + p.questions.length, 0);
    console.log(`  지문 ${passages.length}개, 문항 ${totalQ}개 로드됨`);

    console.log(`  LaTeX 생성 중...`);
    const latexSrc = generateLatex(testName, testInfo, passages);

    const outPath = path.join(BASE_DIR, "output", "papers", `${testName}.tex`);
    writeFile(outPath, latexSrc);
  }

  console.log("\n완료! output/papers/ 디렉토리에 4개 .tex 파일 생성됨");
}

main();
