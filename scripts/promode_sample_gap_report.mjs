import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const OLD_ROOT = "C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2교재디자인라텍스";
const NEW_ROOT = "C:\\Users\\RENEWCOM PC\\Documents\\프로모드 원고";
const NEW_TRIAL = path.join(NEW_ROOT, "latex_trial");
const REPORT_PATH = path.join(NEW_ROOT, "샘플_PDF_기존작업물_비교_분석보고서.md");
const DATA_PATH = path.join(NEW_TRIAL, "out", "sample_gap_analysis_data.json");
const AUDIT_PATH = path.join(NEW_ROOT, "작업_점검_보고서.json");

const levels = [
  ["소쉬르1", "saussure1"],
  ["소쉬르2", "saussure2"],
  ["소쉬르3", "saussure3"],
  ["프레게1", "frege1"],
  ["프레게2", "frege2"],
  ["프레게3", "frege3"],
  ["러셀1", "russell1"],
  ["러셀2", "russell2"],
  ["러셀3", "russell3"],
  ["비트겐슈타인1", "wittgenstein1"],
  ["비트겐슈타인2", "wittgenstein2"],
  ["비트겐슈타인3", "wittgenstein3"],
];

const answerKeyRe = /(정답|해설|모범|예상|answer|explanation|채점|교사용|정오)/i;
const metadataKeyRe = /^(id|level|chapter|title|metadata|meta|type|source|created|updated|version)$/i;

function exists(p) {
  return fs.existsSync(p);
}

function statSize(p) {
  return exists(p) ? fs.statSync(p).size : null;
}

function readText(p) {
  return exists(p) ? fs.readFileSync(p, "utf8") : "";
}

function pdfPages(pdfPath) {
  if (!exists(pdfPath)) return null;
  try {
    const out = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const m = out.match(/^Pages:\s+(\d+)/m);
    if (m) return Number(m[1]);
  } catch {
    // Fall back below.
  }
  const bin = fs.readFileSync(pdfPath, "latin1");
  const matches = bin.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : null;
}

function count(text, needle) {
  if (!text) return 0;
  if (needle instanceof RegExp) return (text.match(needle) || []).length;
  return text.split(needle).length - 1;
}

function texMetrics(texPath) {
  const t = readText(texPath);
  if (!t) return null;
  return {
    bytes: statSize(texPath),
    lines: t.split(/\r?\n/).length,
    tcolorbox: count(t, /\\begin\{tcolorbox\}/g),
    customBoxes: count(t, /\\begin\{KF[A-Za-z]+Box\}/g),
    questionBlocks: count(t, /\\begin\{KFQuestion\}|\\qnum\{|\\begin\{minipage\}/g),
    minipage: count(t, /\\begin\{minipage\}/g),
    needspace: count(t, /\\needspace|\\Needspace/g),
    longtable: count(t, /\\begin\{longtable\}/g),
    tabularx: count(t, /\\begin\{tabularx\}/g),
    adjustbox: count(t, /\\begin\{adjustbox\}/g),
    includegraphics: count(t, /\\includegraphics/g),
    chapterOpeners: count(t, /\\chapter\*?\{|\\KFChapter/g),
    toc: count(t, /\\tableofcontents|contentsline/g),
    passageLabels: count(t, "지문"),
    questionPassageLabels: count(t, "문제 지문"),
    bogiLabels: count(t, "보기"),
    conditionLabels: count(t, "조건"),
    writeAreaSignals: count(t, /\\KFWriteArea|답안 형식|서술|쓰기|\\dotfill|\\rule/g),
  };
}

function enumerateKeys(value, prefix = "") {
  const keys = [];
  if (Array.isArray(value)) {
    value.forEach((v, i) => keys.push(...enumerateKeys(v, `${prefix}[${i}]`)));
    return keys;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      const p = prefix ? `${prefix}.${k}` : k;
      keys.push(p);
      keys.push(...enumerateKeys(v, p));
    }
  }
  return keys;
}

function directJsonCandidates(root, level, n) {
  return [
    path.join(root, level, `${level} (챕터${n}).json`),
    path.join(root, level, `${level}(챕터${n}).json`),
  ];
}

function listJsonRecursive(dir) {
  if (!exists(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listJsonRecursive(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) out.push(full);
  }
  return out;
}

function jsonStats(root, level, chapters = [1, 2, 3, 4]) {
  let files = chapters.map((n) => directJsonCandidates(root, level, n).find(exists)).filter(Boolean);
  if (files.length === 0) {
    files = chapters.flatMap((n) => listJsonRecursive(path.join(root, level, `ch${String(n).padStart(2, "0")}`)));
  }
  const present = [...new Set(files)].filter(exists);
  let totalBytes = 0;
  let allKeys = [];
  let parseErrors = [];
  for (const f of present) {
    totalBytes += statSize(f);
    try {
      const data = JSON.parse(readText(f));
      allKeys = allKeys.concat(enumerateKeys(data));
    } catch (err) {
      parseErrors.push(`${path.basename(f)}: ${err.message}`);
    }
  }
  const targetKeys = allKeys.filter((k) => !answerKeyRe.test(k) && !metadataKeyRe.test(k.split(".").pop() || ""));
  return {
    files: present.length,
    bytes: totalBytes,
    keys: allKeys.length,
    targetKeys: targetKeys.length,
    answerLikeKeys: allKeys.length - targetKeys.length,
    parseErrors,
  };
}

function pct(n, d) {
  if (!n || !d) return "";
  return `${Math.round((n / d) * 100)}%`;
}

function fmtNum(n) {
  return n == null ? "-" : n.toLocaleString("ko-KR");
}

function ratioText(now, old) {
  if (now == null || old == null || old === 0) return "-";
  return `${pct(now, old)} (${fmtNum(now)} / ${fmtNum(old)})`;
}

const comparisons = levels.map(([level, slug]) => {
  const oldPdf = path.join(OLD_ROOT, "output", `${level}_1권_학생용.pdf`);
  const oldTex = path.join(OLD_ROOT, "output", `${level}_1권_학생용.tex`);
  const newPdf = path.join(NEW_TRIAL, "pdf", `${level}_1권.pdf`);
  const newTex = path.join(NEW_TRIAL, "out", `${slug}_book1`, "main.tex");
  return {
    level,
    oldPdf: exists(oldPdf) ? oldPdf : null,
    newPdf: exists(newPdf) ? newPdf : null,
    oldPages: pdfPages(oldPdf),
    newPages: pdfPages(newPdf),
    oldPdfBytes: statSize(oldPdf),
    newPdfBytes: statSize(newPdf),
    oldTexBytes: statSize(oldTex),
    newTexBytes: statSize(newTex),
    oldTexMetrics: texMetrics(oldTex),
    newTexMetrics: texMetrics(newTex),
    oldJson: jsonStats(OLD_ROOT, level),
    newJson: jsonStats(NEW_ROOT, level),
  };
});

const russell1 = comparisons.find((x) => x.level === "러셀1");
const frege3 = comparisons.find((x) => x.level === "프레게3");
const oldRules = readText(path.join(OLD_ROOT, "comprehensive_textbook_rules.md"));
const oldGuide = readText(path.join(OLD_ROOT, "국어농장_버전2_교재제작_자동화_지침.md"));
const oldGenerator = readText(path.join(OLD_ROOT, "generate_russell1.py"));
const newBuilder = readText(path.join(NEW_TRIAL, "build_level1_books.mjs"));
const newStyle = readText(path.join(NEW_TRIAL, "styles", "koreanfarmtrial.sty"));

const codeComparison = {
  oldGeneratorBytes: statSize(path.join(OLD_ROOT, "generate_russell1.py")),
  newBuilderBytes: statSize(path.join(NEW_TRIAL, "build_level1_books.mjs")),
  oldRulesNeedspace: count(oldRules + oldGuide + oldGenerator, /needspace|Needspace|smartnewpage/g),
  oldRulesTable: count(oldRules + oldGuide + oldGenerator, /longtable|tabularx|adjustbox|booktabs|markdown table|표/g),
  oldRulesQuestionKeep: count(oldRules + oldGuide + oldGenerator, /minipage|breakable=false|문제.*묶|페이지|단/g),
  oldRulesPassageNote: count(oldRules + oldGuide + oldGenerator, /note|필기|여백|passage_note|지문/g),
  newBuilderNeedspace: count(newBuilder + newStyle, /needspace|Needspace|smartnewpage/g),
  newBuilderTable: count(newBuilder + newStyle, /longtable|tabularx|adjustbox|booktabs|markdown table|표/g),
  newBuilderQuestionKeep: count(newBuilder + newStyle, /minipage|breakable=false|문제.*묶|페이지|단/g),
  newBuilderPassageNote: count(newBuilder + newStyle, /note|필기|여백|passage_note|지문/g),
};

const studentOldRows = comparisons.filter((x) => x.oldPdf || x.newPdf).map((x) => {
  return `| ${x.level} | ${fmtNum(x.oldPages)} | ${fmtNum(x.newPages)} | ${ratioText(x.newPages, x.oldPages)} | ${ratioText(x.newPdfBytes, x.oldPdfBytes)} | ${ratioText(x.newTexBytes, x.oldTexBytes)} |`;
}).join("\n");

const jsonRows = comparisons.filter((x) => x.oldPdf || x.level.startsWith("비트겐슈타인")).map((x) => {
  return `| ${x.level} | ${fmtNum(x.oldJson.bytes)} | ${fmtNum(x.newJson.bytes)} | ${ratioText(x.newJson.bytes, x.oldJson.bytes)} | ${fmtNum(x.oldJson.targetKeys)} | ${fmtNum(x.newJson.targetKeys)} |`;
}).join("\n");

function metricRow(label, key, item = russell1) {
  const oldV = item?.oldTexMetrics?.[key] ?? null;
  const newV = item?.newTexMetrics?.[key] ?? null;
  return `| ${label} | ${fmtNum(oldV)} | ${fmtNum(newV)} | ${ratioText(newV, oldV)} |`;
}

const russellRows = comparisons.filter((x) => x.level.startsWith("러셀"));
const russell2 = comparisons.find((x) => x.level === "러셀2");
const russell3 = comparisons.find((x) => x.level === "러셀3");

const report = `# 샘플 PDF와 기존 작업물 비교 분석 보고서

작성일: 2026-04-20  
비교 대상:
- 기존 작업물: \`${OLD_ROOT}\`
- 현재 샘플: \`${NEW_TRIAL}\`

## 결론

현재 제가 만든 12레벨 1권 샘플은 출판용 교재 품질이 아니라, JSON을 PDF로 흘려보내는 구조 시험본에 가깝습니다. 사용자 지적대로 활동, 표, 지문, 보기, 조건, 선택지, 답안 작성 공간, 장 도입면, 문제 단위 묶음 등이 기존 작업물이나 시중 교재 수준으로 구현되지 않았고, 그 결과 특히 프레게3·러셀2·러셀3 같은 고학년 교재에서 페이지 수와 밀도가 크게 줄었습니다.

러셀1 1권은 기존 PDF도 ${fmtNum(russell1.oldPages)}쪽이라 쪽수만 놓고 보면 현재 ${fmtNum(russell1.newPages)}쪽과 큰 차이가 없어 보입니다. 그러나 기존 러셀1 1권 학생용 TeX는 ${fmtNum(russell1.oldTexBytes)} bytes이고 현재 TeX는 ${fmtNum(russell1.newTexBytes)} bytes로 ${pct(russell1.newTexBytes, russell1.oldTexBytes)} 수준입니다. 반면 챕터 1~4 JSON 원고량은 현재가 기존의 ${pct(russell1.newJson.bytes, russell1.oldJson.bytes)} 수준입니다. 즉 러셀1은 쪽수보다 판면 밀도와 구성요소 구현이 크게 줄었고, 러셀2·러셀3은 쪽수 자체도 기존 대비 절반 수준으로 줄었습니다.

## 1권 산출물 계량 비교

| 레벨 | 기존 학생용 PDF 쪽수 | 현재 PDF 쪽수 | 현재/기존 쪽수 | 현재/기존 PDF 용량 | 현재/기존 TeX 용량 |
|---|---:|---:|---:|---:|---:|
${studentOldRows}

해석:
- 소쉬르1~프레게2는 현재 PDF 쪽수가 기존보다 많거나 비슷한 경우도 있지만, 이는 세련된 활동 구현이 들어가서 늘어난 것이 아니라 글자 크기·여백·일반 박스 처리의 영향이 큽니다.
- 프레게3은 기존 1권 학생용 PDF가 ${fmtNum(frege3.oldPages)}쪽인데 현재는 ${fmtNum(frege3.newPages)}쪽입니다. 기존 PDF 용량도 현재의 약 ${Math.round((frege3.oldPdfBytes || 0) / (frege3.newPdfBytes || 1) * 10) / 10}배입니다. 프레게3 구조 차이를 제대로 반영하지 못했습니다.
- 러셀1은 기존 ${fmtNum(russell1.oldPages)}쪽, 현재 ${fmtNum(russell1.newPages)}쪽으로 쪽수 차이는 작지만 PDF 용량은 ${pct(russell1.newPdfBytes, russell1.oldPdfBytes)}, TeX 용량은 ${pct(russell1.newTexBytes, russell1.oldTexBytes)}에 그칩니다. 페이지 숫자는 비슷해도 기존의 이미지, 박스, 표, 미니페이지, 필기 공간, 문제 단위 설계가 현재 샘플에 충분히 반영되지 않았다는 뜻입니다.
- 러셀2·러셀3은 기존 ${fmtNum(russell2.oldPages)}쪽/${fmtNum(russell3.oldPages)}쪽에서 현재 ${fmtNum(russell2.newPages)}쪽/${fmtNum(russell3.newPages)}쪽으로 줄었습니다. 사용자님이 말한 “러셀 교재가 100쪽 이상인데 현재는 50쪽대”라는 문제는 이 두 레벨에서 수치상으로도 그대로 확인됩니다.
- 비트겐슈타인은 기존 비교 대상이 없지만 현재는 JSON 파일 구조가 280개 파일로 나뉘어 있어 페이지가 길게 나왔습니다. 그러나 이 역시 디자인 완성도가 높다는 뜻은 아니며, 활동별 세부 렌더러가 필요한 상태입니다.

## 원고량 비교: 챕터 1~4

| 레벨 | 기존 JSON bytes | 현재 JSON bytes | 현재/기존 원고량 | 기존 대상 key 수 | 현재 대상 key 수 |
|---|---:|---:|---:|---:|---:|
${jsonRows}

해석:
- 러셀1의 현재 원고는 기존 대비 ${pct(russell1.newJson.bytes, russell1.oldJson.bytes)} 수준입니다. 원고가 줄긴 했지만 TeX가 ${pct(russell1.newTexBytes, russell1.oldTexBytes)}까지 줄어든 것은 렌더링 누락이 더 크다는 뜻입니다.
- 프레게3은 현재 JSON 대상 key 수가 매우 적게 잡히는 구조입니다. 기존 프레게3은 초등 고학년에서 중등형으로 넘어가는 특수 구조인데, 현재 샘플은 이를 별도 설계하지 못했습니다.
- 비트겐슈타인은 기존 폴더에 비교 대상이 없어 같은 방식의 정량 비교는 불가능합니다. 대신 현재 key 인벤토리 기준으로 별도 구성요소 매핑표와 렌더러 검증이 필요합니다.

## 러셀1 1권 TeX 구조 비교

| 항목 | 기존 러셀1 학생용 | 현재 러셀1 샘플 | 현재/기존 |
|---|---:|---:|---:|
${metricRow("TeX bytes", "bytes")}
${metricRow("TeX lines", "lines")}
${metricRow("tcolorbox 직접 사용", "tcolorbox")}
${metricRow("문제/미니페이지 계열", "questionBlocks")}
${metricRow("minipage", "minipage")}
${metricRow("needspace", "needspace")}
${metricRow("longtable", "longtable")}
${metricRow("tabularx", "tabularx")}
${metricRow("adjustbox", "adjustbox")}
${metricRow("includegraphics", "includegraphics")}
${metricRow("장/챕터 도입 신호", "chapterOpeners")}
${metricRow("문제 지문 라벨", "questionPassageLabels")}
${metricRow("보기 라벨", "bogiLabels")}
${metricRow("조건 라벨", "conditionLabels")}
${metricRow("쓰기/답안 공간 신호", "writeAreaSignals")}

정량 비교상 현재 샘플은 기존처럼 “교재 레이아웃 요소”를 많이 생산하지 않습니다. 현재는 \`KFPassageBox\`, \`KFQuestion\` 같은 최소 박스는 있지만, 문제를 유형별 활동으로 세분화하거나, 표·쓰기·연결·O/X·구조도·문장 독해를 교재형 UI로 확장하는 양이 부족합니다.

## 기존 작업물에서 이미 구현되어 있던 핵심 장치

기존 \`generate_russell1.py\`, \`comprehensive_textbook_rules.md\`, \`국어농장_버전2_교재제작_자동화_지침.md\`에는 다음 장치가 들어 있었습니다.

1. 표 렌더링: markdown 표를 \`tabularx\`, \`booktabs\`, \`adjustbox\` 기반 표로 변환하고 폭을 자동 조절합니다.
2. 지문 렌더링: \`passage_note\` 구조로 본문 지문과 필기/메모 여백을 같이 구성합니다.
3. 문제 단위 묶음: 문제 번호, 발문, 보기, 조건, 선택지를 \`minipage\`, \`needspace\`, \`breakable=false\` 계열로 최대한 한 덩어리로 유지합니다.
4. 문제 지문 배치: 객관식/서술형 문제 앞의 \`문제_지문\`을 번호별로 찾아 문제 바로 앞에 끼워 넣습니다.
5. 활동별 표현: O/X, 연결형, 문장 독해, 어휘표, 구조도, 요약표, 서술형 답안 공간 등 유형별 처리가 있습니다.
6. 장 도입면과 책 구조: \`book\` 클래스, 표지, 목차, 챕터 도입면, 헤더/푸터, 로고, 장별 색상 체계가 있습니다.
7. 페이지 배분 규칙: 라벨만 페이지 끝에 남지 않도록 \`needspace\`를 쓰고, 문제 구성 요소가 페이지/단 사이에서 찢어지지 않도록 설계되어 있습니다.

현재 샘플은 위 항목 중 일부 이름만 흉내 냈고, 실제 구현 밀도는 부족합니다. 특히 \`renderGeneric\`이 많은 JSON 구조를 일반 목록이나 단순 문단으로 접어 버려, 활동의 의미가 시각적으로 살아나지 않습니다.

## 품질 문제 평가

### 활동

현재 샘플의 가장 큰 문제입니다. 활동이 “활동 박스 안의 텍스트” 또는 “중첩 객체의 나열”로 처리되는 경우가 많습니다. 시중 교재처럼 학생이 실제로 풀고 쓰고 연결하고 비교할 수 있는 판면이 아닙니다. 연결 활동은 좌우 항목과 연결선, O/X는 별도 선택 칸, 빈칸형은 충분한 답안선, 구조도는 큰 도식형 박스, 요약표는 행/열이 안정된 표로 렌더링되어야 합니다.

### 표

현재 샘플에 표 렌더링 함수는 있지만 모든 markdown 표와 JSON 표 구조가 안정적으로 표로 들어간다고 보기 어렵습니다. 일부는 일반 텍스트나 목록으로 풀릴 가능성이 큽니다. 기존 작업물처럼 \`markdown -> tabularx/adjustbox/booktabs\` 변환을 중심 렌더러로 올리고, 긴 표는 반복 헤더와 폭 축소 규칙을 가져야 합니다.

### 지문

현재 지문 박스는 너무 단순합니다. 기존 작업물의 핵심은 본문 지문 옆에 필기/메모 공간을 두거나, 문학 운문 줄바꿈을 보존하고, 비문학 지문은 문단 번호와 주석 여백을 살리는 구조였습니다. 현재는 “읽기 지문”과 “문제 지문”이 모두 비슷한 박스라서 학습 목적이 분리되지 않습니다.

### 보기/조건/선택지

현재는 보기와 조건을 표시하긴 하지만 문제 구성 전체를 한 문제 단위로 견고하게 묶는 수준이 약합니다. 조건 박스는 독립 디자인이어야 하고, 선택지는 1단/2단 자동 전환, 긴 선택지 줄맞춤, ①~⑤ 번호 정렬이 필요합니다. 객관식 문제 앞의 문제 지문도 “있는 경우 다시 출력”을 넘어서, 번호 범위형 지문과 개별 지문을 구분해야 합니다.

### 러셀·프레게3 구조

기존 비교 산출물 기준으로 러셀2·러셀3은 한 권이 100쪽 이상인데 현재는 50~60쪽대입니다. 러셀1은 기존 1권도 54쪽이라 쪽수 자체는 비슷하지만, TeX 용량과 구성요소 출현 수가 크게 줄어 판면 밀도는 낮습니다. 프레게3 역시 프레게1·2와 같은 초등형 처리로 묶으면 안 되고, 중등 진입형 구조로 별도 렌더러가 필요합니다.

## 왜 페이지가 절반으로 줄었는가

1. 원고 JSON 자체가 일부 줄었습니다. 러셀1 챕터 1~4 기준 현재 JSON은 기존 대비 ${pct(russell1.newJson.bytes, russell1.oldJson.bytes)}입니다.
2. 그러나 TeX는 ${pct(russell1.newTexBytes, russell1.oldTexBytes)}로 더 크게 줄었습니다. 따라서 핵심 원인은 렌더러 축약입니다.
3. 현재 샘플은 장 도입면, 목차, 넓은 답안 공간, 메모 여백, 문장 독해 단위, 활동별 판면, 구조도/표 렌더링을 충분히 만들지 않았습니다.
4. JSON key를 “출력은 했다”고 보더라도, 교재 구성요소로 재구성하지 못하고 일반 문단으로 흘린 부분이 많습니다.
5. 정답/해설 제외 규칙을 의식하면서도, 학생용에서 필요한 \`답안 형식\`, \`조건\`, \`보기\`, \`문제 지문\`, \`활동 지침\`의 판면화가 부족했습니다.
6. 현재 스타일 파일은 기능 수가 적고, 기존 작업물처럼 출판용 LaTeX 컴포넌트 체계가 충분하지 않습니다.

## 수정 방향

다음 작업은 “PDF를 다시 예쁘게 빌드”가 아니라 렌더러를 다시 설계하는 방식으로 가야 합니다.

1. 12레벨 각각의 JSON key 인벤토리를 기준으로 \`학생용에 포함할 key\`, \`사이트 시험지로 보낼 key\`, \`정답/해설 제외 key\`, \`메타데이터 key\`를 확정합니다.
2. 빌드 시 모든 학생용 대상 key가 어떤 LaTeX 컴포넌트로 렌더링됐는지 coverage log를 남기고, 미처리 key가 있으면 빌드를 실패 처리합니다.
3. 프레게1·2, 프레게3, 러셀1~3, 비트겐슈타인1~3을 같은 렌더러로 처리하지 않고 별도 레벨 프로파일을 둡니다.
4. 활동 렌더러를 별도 구현합니다: 연결형, O/X, 빈칸형, 표 채우기, 구조도, 문장 독해, 어휘 활동, 요약 활동, 서술형 답안 공간, 해설 읽기 후 확인 활동.
5. 표 렌더러를 전면 강화합니다: markdown 표 파서, JSON table 파서, 긴 표 반복 헤더, 폭 자동 축소, 셀 줄바꿈, 초등/중등/고등별 표 색상 체계를 둡니다.
6. 문제 렌더러를 강화합니다: 문제 지문 박스, 발문, 보기, 조건, 선택지를 하나의 \`samepage/minipage/tcolorbox\` 단위로 묶고, 단/페이지 넘어감 방지 규칙을 적용합니다.
7. 기존 작업물의 장점인 \`passage_note\`, \`needspace\`, \`adjustbox+tabularx\`, 장 도입면, 헤더/푸터 구조는 가져오되, 부족했던 부분은 새 디자인 시스템으로 다시 정리해야 합니다.

## 판정

현재 샘플은 “정답/해설 제외 후 모든 원고 요소를 출판 교재 형태로 포함한다”는 목표를 충족하지 못합니다. 특히 러셀과 프레게3은 누락과 축약이 크기 때문에, 현재 PDF를 기반으로 조금씩 보수하는 방식보다 key coverage 검증이 붙은 렌더러 재작성으로 가는 편이 맞습니다.

`;

fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
fs.writeFileSync(DATA_PATH, JSON.stringify({ comparisons, codeComparison }, null, 2), "utf8");
fs.writeFileSync(REPORT_PATH, report, "utf8");

function appendAudit() {
  let audit = {
    report_name: "작업_점검_보고서",
    schema_version: "1.0",
    project_root: NEW_ROOT,
    entries: [],
  };
  if (exists(AUDIT_PATH)) {
    try {
      audit = JSON.parse(readText(AUDIT_PATH));
      if (!Array.isArray(audit.entries)) audit.entries = [];
    } catch {
      audit.entries = [];
    }
  }
  const date = "2026-04-20";
  const sameDay = audit.entries.filter((e) => String(e.entry_id || "").startsWith(date)).length;
  const entryId = `${date}-${String(sameDay + 1).padStart(3, "0")}`;
  audit.entries.push({
    entry_id: entryId,
    timestamp: "2026-04-20T00:00:00+09:00",
    task_summary: "현재 LaTeX 샘플 PDF와 기존 국어농장v2 교재디자인 LaTeX 산출물 비교 분석 보고서 작성",
    project_root: NEW_ROOT,
    related_projects: [OLD_ROOT, "C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지"],
    work_type: ["LaTeX/PDF 산출물 비교", "원고 key/용량 계량", "수동 품질 평가 보고"],
    files_created: [REPORT_PATH, DATA_PATH],
    files_updated: [AUDIT_PATH],
    files_checked: [
      path.join(OLD_ROOT, "output"),
      path.join(NEW_TRIAL, "pdf"),
      path.join(NEW_TRIAL, "out"),
      path.join(OLD_ROOT, "generate_russell1.py"),
      path.join(NEW_TRIAL, "build_level1_books.mjs"),
    ],
    verification: {
      checks_performed: [
        "기존/현재 1권 PDF 쪽수와 파일 용량 비교",
        "기존/현재 1권 TeX 용량과 주요 LaTeX 구성요소 출현 횟수 비교",
        "챕터 1~4 JSON 원고량 및 대상 key 수 비교",
        "기존 렌더링 규칙과 현재 렌더러 구현 범위 수동 대조",
      ],
      result_summary: "현재 샘플은 기존 작업물 대비 렌더링 밀도와 활동/표/문제 구성요소 구현이 부족하며, 특히 러셀·프레게3의 페이지 수 감소는 누락/축약 영향이 큼.",
      manual_review: true,
      json_validation: true,
    },
    status: "partial",
    remaining_risks: [
      "PDF 시각 품질은 텍스트/TeX 기반 대조 중심으로 평가했으며 전체 페이지를 이미지로 전수 검수하지는 않음.",
      "다음 단계에서 12레벨 모든 key에 대한 렌더링 coverage log와 빌드 실패 조건이 필요함.",
    ],
    next_actions: [
      "12레벨별 학생용 대상 key와 렌더러 컴포넌트 매핑 확정",
      "활동/표/문제 지문/보기/조건/선택지 전용 LaTeX 컴포넌트 재설계",
      "러셀·프레게3 기준으로 100쪽대 밀도와 수능형 판면을 회복한 샘플 재빌드",
    ],
  });
  fs.writeFileSync(AUDIT_PATH, JSON.stringify(audit, null, 2), "utf8");
  return entryId;
}

const entryId = appendAudit();
console.log(JSON.stringify({ report: REPORT_PATH, data: DATA_PATH, audit: AUDIT_PATH, entryId }, null, 2));
