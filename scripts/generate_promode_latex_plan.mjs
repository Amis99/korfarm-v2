import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import JSZip from "../frontend/node_modules/jszip/lib/index.js";

const documentsRoot = path.join("C:", "Users", "RENEWCOM PC", "Documents");
const manuscriptRoot = path.join(documentsRoot, "프로모드 원고");
const outMd = path.join(documentsRoot, "프로모드_12레벨_교재구성_LaTeX_코딩계획.md");
const outDocx = path.join(documentsRoot, "프로모드_12레벨_교재구성_LaTeX_코딩계획.docx");
const auditPath = path.join(manuscriptRoot, "작업_점검_보고서.json");

const normalLevels = [
  "소쉬르1",
  "소쉬르2",
  "소쉬르3",
  "프레게1",
  "프레게2",
  "프레게3",
  "러셀1",
  "러셀2",
  "러셀3",
];
const wittLevels = ["비트겐슈타인1", "비트겐슈타인2", "비트겐슈타인3"];
const allLevels = [...normalLevels, ...wittLevels];

const levelPlans = [
  {
    level: "소쉬르1",
    grade: "초1",
    series: "생키",
    role: "감각 어휘와 쉬운 배경 개념을 통해 글 읽기의 첫 골격을 만드는 단계",
    structure: "핵심 어휘, 개념 연결 활동, 배경 개념, 짧은 문학, 짧은 비문학, 쓰기, 실력확인",
    latex: "큰 글자, 넓은 행간, 완전 1단, 선 긋기와 쓰기 칸 중심",
    font: "14.5pt 전후",
    image: "사물, 감각, 장면을 직접 보여 주는 큰 삽화와 아이콘",
  },
  {
    level: "소쉬르2",
    grade: "초2",
    series: "생키",
    role: "어휘와 문장 단위 이해를 묶어 문학/비문학을 안정적으로 읽는 단계",
    structure: "어휘, 개념, 문학 객관식/서술형, 문학 쓰기, 비문학 객관식/서술형, 실력확인",
    latex: "1단 유지, 문항 간격은 소쉬르1보다 조금 줄이고 선택지는 큰 터치 영역처럼 배치",
    font: "14pt 전후",
    image: "이야기 장면, 생활 소재, 비교 그림",
  },
  {
    level: "소쉬르3",
    grade: "초3",
    series: "생키",
    role: "개념 훈련과 문법 감각을 넣어 프레게 단계로 넘어가는 다리",
    structure: "어휘, 개념 훈련, 문학/비문학, 문법 요소, 표 정리, 쓰기, 실력확인",
    latex: "1단 기본, 표와 빈칸 활동은 폭을 고정해 페이지 흔들림 방지",
    font: "13.2pt 전후",
    image: "개념 관계도, 순서도, 짧은 장면 삽화",
  },
  {
    level: "프레게1",
    grade: "초4",
    series: "생키",
    role: "어휘 문제 유형을 넓히고 문법 지시어와 기본 독해를 결합하는 단계",
    structure: "어휘 객관식/서술형/빈칸, 개념, 문학, 비문학, 문법 지시어, 실력확인",
    latex: "1단 중심, 문제 묶음은 얇은 박스와 번호 배지로 정리",
    font: "12.5pt 전후",
    image: "어휘 관계 카드, 문법 화살표, 짧은 도식",
  },
  {
    level: "프레게2",
    grade: "초5",
    series: "생키",
    role: "어휘 활동이 크게 늘고 개념/글쓰기까지 연결되는 확장 단계",
    structure: "어휘 서술형/빈칸/연결/초성, 개념 객관식/서술형/빈칸, 문학, 비문학, 실력확인",
    latex: "1단 유지하되 활동 단위는 더 조밀하게, 쓰기 칸과 보기 박스의 규격화 필요",
    font: "12pt 전후",
    image: "분류표, 연결선 활동 보조 이미지, 생활형 도식",
  },
  {
    level: "프레게3",
    grade: "초6",
    series: "생키",
    role: "초등에서 중등으로 넘어가는 전환 단계라 프레게1/2와 별도 설계가 필요",
    structure: "개념, 문법, 문학, 비문학이 객관식/단답형/서술형 세트로 조직",
    latex: "지문은 1단, 문제 묶음은 2단 전환 가능. 중등형 보기/조건 박스 도입",
    font: "11.3pt 전후",
    image: "핵심 개념 도식, 문법 구조표, 비교형 그래픽",
  },
  {
    level: "러셀1",
    grade: "중1",
    series: "맥(脈)",
    role: "중등 독해의 기본 문법, 개념, 문학, 비문학을 균형 있게 세우는 단계",
    structure: "개념, 문법, 문학, 비문학, 객관식/단답형/서술형 문항",
    latex: "지문 1단, 문제 2단, 근거 표시와 풀이 공간을 분리",
    font: "10.8~11pt",
    image: "논리 흐름도, 근거 표시용 도해, 갈래별 아이콘",
  },
  {
    level: "러셀2",
    grade: "중2",
    series: "맥(脈)",
    role: "문법과 비문학 비중을 높이고 문학 감상은 근거 중심으로 압축하는 단계",
    structure: "개념, 문법, 문학, 비문학, 서술형 중심의 분석 활동",
    latex: "2단 문제 영역을 적극 사용하고 표/조건 박스의 밀도를 높임",
    font: "10.5~10.8pt",
    image: "논증 구조, 문장 성분 도식, 자료 해석 그래픽",
  },
  {
    level: "러셀3",
    grade: "중3",
    series: "맥(脈)",
    role: "고등 진입 전 문법/독해/서술형을 시험형 사고로 정리하는 단계",
    structure: "개념, 문법, 문학, 비문학, 객관식/단답형/서술형 심화",
    latex: "문제 2단을 기본값에 가깝게 쓰되 지문과 긴 서술형은 1단으로 회귀",
    font: "10.3~10.5pt",
    image: "비교표, 추론 단계 도식, 시험형 근거 맵",
  },
  {
    level: "비트겐슈타인1",
    grade: "고1",
    series: "맥(脈)",
    role: "고등 국어의 철학/인문 비문학과 문학을 병렬로 훈련하는 단계",
    structure: "읽기 5세트, 문학 5세트, 문법, 패턴 워크북. 챕터 테스트는 사이트 시험지로 분리",
    latex: "색은 절제하고, 지문 1단/문항 2단, 긴 보기와 조건을 독립 박스로 처리",
    font: "10.2pt 전후",
    image: "인문 개념 지도, 시대/사상 흐름도, 문학 작품 맥락 이미지",
  },
  {
    level: "비트겐슈타인2",
    grade: "고2",
    series: "맥(脈)",
    role: "복합 지문, 고전/현대 문학, 논증형 독해를 더 정교하게 다루는 단계",
    structure: "읽기 5세트, 문학 5세트, 문법, 패턴 워크북. 테스트 파일은 교재 밖으로 분리",
    latex: "지문 주석, 출처/개념 박스, 긴 선택지 자동 줄바꿈을 안정화",
    font: "10pt 전후",
    image: "논증 흐름, 대립 개념, 고전 맥락을 설명하는 도식",
  },
  {
    level: "비트겐슈타인3",
    grade: "고3",
    series: "맥(脈)",
    role: "수능형 독해와 논술형 사고를 최종 압축하는 고밀도 단계",
    structure: "읽기 5세트, 문학 5세트, 문법, 패턴 워크북. 챕터 테스트는 사이트 전용",
    latex: "가장 조밀한 조판. 본문은 1단 가독성, 문제와 표는 2단/압축 규격",
    font: "9.6~9.8pt",
    image: "자료형 도표, 논리 구조, 작품 대비표 중심",
  },
];

const bookSlices = [
  ["1권", "챕터 1~4"],
  ["2권", "챕터 5~8"],
  ["3권", "챕터 9~12"],
  ["4권", "챕터 13~16"],
  ["5권", "챕터 17~20"],
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function inc(map, key) {
  const k = key || "(없음)";
  map.set(k, (map.get(k) || 0) + 1);
}

function sortChapterFiles(files) {
  return files.sort((a, b) => {
    const ax = Number(a.match(/챕터(\d+)/)?.[1] || a.match(/ch(\d+)/i)?.[1] || 0);
    const bx = Number(b.match(/챕터(\d+)/)?.[1] || b.match(/ch(\d+)/i)?.[1] || 0);
    return ax - bx || a.localeCompare(b, "ko");
  });
}

function top(map, n = 5) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .slice(0, n)
    .map(([k, v]) => `${k} ${v}`)
    .join(", ");
}

function cleanCell(value) {
  return String(value ?? "")
    .replaceAll("|", "/")
    .replace(/\s+/g, " ")
    .trim();
}

function walkValues(value, predicate) {
  let count = 0;
  if (Array.isArray(value)) {
    for (const item of value) count += walkValues(item, predicate);
    return count;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (predicate(key, child)) count += 1;
      count += walkValues(child, predicate);
    }
  }
  return count;
}

function summarizeNormalLevel(level) {
  const dir = path.join(manuscriptRoot, level);
  const files = sortChapterFiles(fs.readdirSync(dir).filter((name) => name.endsWith(".json")));
  const sectionTypes = new Map();
  const areas = new Map();
  const subtypes = new Map();
  let answerSections = 0;
  let pointFields = 0;
  const firstTitles = [];

  for (const file of files) {
    const data = readJson(path.join(dir, file));
    const sections = Array.isArray(data.sections) ? data.sections : [];
    for (const section of sections) {
      inc(sectionTypes, section.type);
      inc(areas, section.area);
      inc(subtypes, section.subtype);
      if (section.type === "answer_explain" || section.type === "model_answer") answerSections += 1;
      pointFields += walkValues(section, (key) => key.toLowerCase() === "points");
    }
    if (firstTitles.length === 0) {
      firstTitles.push(
        ...sections
          .filter((section) => !["answer_explain", "model_answer"].includes(section.type))
          .slice(0, 6)
          .map((section) => `${section.area || section.type}:${section.title || section.subtype || section.type}`)
      );
    }
  }

  return {
    chapterCount: files.length,
    sourceUnit: "챕터별 JSON",
    componentSummary: top(sectionTypes, 8),
    areaSummary: top(areas, 8),
    subtypeSummary: top(subtypes, 6),
    firstTitles: firstTitles.join(" -> "),
    answerSections,
    pointFields,
  };
}

function summarizeWittLevel(level) {
  const dir = path.join(manuscriptRoot, level);
  const chapterDirs = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^ch\d+$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));
  const componentTypes = new Map();
  let answerFields = 0;
  let explanationFields = 0;
  let pointFields = 0;
  const firstTitles = [];

  for (const chapterDir of chapterDirs) {
    const index = readJson(path.join(dir, chapterDir, "index.json"));
    const sections = Array.isArray(index.sections) ? index.sections : [];
    for (const section of sections) inc(componentTypes, section.type);
    if (firstTitles.length === 0) {
      firstTitles.push(
        ...sections
          .filter((section) => section.type !== "chapter_test")
          .slice(0, 8)
          .map((section) => `${section.type}:${section.title || section.file}`)
      );
    }
    for (const file of fs.readdirSync(path.join(dir, chapterDir)).filter((name) => name.endsWith(".json"))) {
      const data = readJson(path.join(dir, chapterDir, file));
      answerFields += walkValues(data, (key) => /answer/i.test(key));
      explanationFields += walkValues(data, (key) => /explanation|explain/i.test(key));
      pointFields += walkValues(data, (key) => key.toLowerCase() === "points");
    }
  }

  return {
    chapterCount: chapterDirs.length,
    sourceUnit: "챕터 폴더 + index.json",
    componentSummary: top(componentTypes, 8),
    areaSummary: "index 기준 reading/literature/grammar/pattern/test",
    subtypeSummary: "세트 파일 내부 문항 타입은 렌더러에서 2차 판별",
    firstTitles: firstTitles.join(" -> "),
    answerSections: answerFields + explanationFields,
    pointFields,
  };
}

function buildStats() {
  const stats = new Map();
  for (const level of normalLevels) stats.set(level, summarizeNormalLevel(level));
  for (const level of wittLevels) stats.set(level, summarizeWittLevel(level));
  return stats;
}

function table(headers, rows) {
  const head = `| ${headers.map(cleanCell).join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map(cleanCell).join(" | ")} |`).join("\n");
  return `${head}\n${sep}\n${body}`;
}

function levelDetail(plan, stat) {
  return [
    `## ${plan.level} (${plan.grade})`,
    "",
    `- 시리즈명: ${plan.series}`,
    `- 학습 역할: ${plan.role}`,
    `- 실제 원고 단위: ${stat.sourceUnit}, ${stat.chapterCount}챕터`,
    `- 교재 구성: ${plan.structure}`,
    `- 조판 방향: ${plan.latex}`,
    `- 권장 본문 크기: ${plan.font}`,
    `- 이미지 방향: ${plan.image}`,
    `- 실제 원고 구성 신호: ${stat.componentSummary}`,
    `- 영역 신호: ${stat.areaSummary}`,
    `- 주요 활동/문항 신호: ${stat.subtypeSummary}`,
    `- 1챕터 앞부분 흐름 예시: ${stat.firstTitles}`,
  ].join("\n");
}

function buildMarkdown(stats) {
  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const levelRows = levelPlans.map((plan) => {
    const stat = stats.get(plan.level);
    return [
      plan.level,
      plan.grade,
      plan.series,
      `${stat.chapterCount}챕터`,
      plan.structure,
      plan.latex,
    ];
  });

  const sourceRows = levelPlans.map((plan) => {
    const stat = stats.get(plan.level);
    return [
      plan.level,
      stat.sourceUnit,
      stat.componentSummary,
      stat.answerSections,
      stat.pointFields,
    ];
  });

  return [
    "# 프로모드 12레벨 교재 구성 및 LaTeX 코딩 계획",
    "",
    `작성일: ${now}`,
    "",
    "## 이번 문서의 확정 반영 사항",
    "",
    "- 소쉬르1~3, 프레게1~3의 교재 시리즈명은 `생키`를 기준으로 설계한다.",
    "- 러셀1~3, 비트겐슈타인1~3의 교재 시리즈명은 `맥(脈)`으로 설계한다.",
    "- 12레벨은 네 계열이 아니라 `소쉬르1`, `소쉬르2`, `소쉬르3`, `프레게1`, `프레게2`, `프레게3`, `러셀1`, `러셀2`, `러셀3`, `비트겐슈타인1`, `비트겐슈타인2`, `비트겐슈타인3`으로 각각 별도 설계한다.",
    "- 4개 챕터를 묶어 1권으로 만들며, 한 레벨당 5권, 전체 60권 체계로 설계한다.",
    "- 학생용 교재에는 정답, 해설, 모범답안, 채점 기준, 정답 표시, 배점을 넣지 않는다.",
    "- 챕터 테스트는 교재 본문에서 제외하고 사이트 제공 시험지 또는 별도 PDF 파이프라인으로 분리한다.",
    "",
    "## 내 추천 의견",
    "",
    "러셀과 비트겐슈타인에는 `맥(脈)`을 적용한다. 한글 `맥`은 짧고 강하며, 한자 `脈`은 글의 흐름, 사고의 줄기, 논리의 연결을 함께 떠올리게 한다. 중등/고등 단계에서 필요한 수능 국어형 독해, 근거 판단, 추론, 사고력의 느낌을 초등용 `생키`보다 단단하게 전달한다.",
    "",
    "표기 원칙은 `맥(脈)`으로 둔다. 표지와 본문 헤더에서는 같은 표기를 유지하되, 글자 크기와 위치만 조정한다. `맥`만 쓰면 너무 짧아 보일 수 있으므로, 출판물 제목에는 한자 병기를 고정하는 편이 낫다.",
    "",
    "판형은 최종 인쇄용으로 `210mm x 280mm` 변형 국배판을 추천한다. A4보다 책처럼 보이고, 188mm x 257mm 계열보다 지문과 문제를 덜 압축해도 된다. 다만 교정과 내부 검토는 A4 proof 모드를 같이 두는 것이 좋다. LaTeX에서는 trim size를 변수화해 `print`와 `proof`를 쉽게 바꾸도록 한다.",
    "",
    "## 60권 분권 규칙",
    "",
    table(["권차", "포함 챕터"], bookSlices),
    "",
    "모든 레벨에 같은 분권 규칙을 적용한다. 예를 들어 `소쉬르1-1권`은 소쉬르1 챕터 1~4, `비트겐슈타인3-5권`은 비트겐슈타인3 챕터 17~20을 담는다.",
    "",
    "## 표지 디자인 지침",
    "",
    "표지는 앞표지와 뒤표지를 모두 LaTeX 제작 대상에 포함한다. 실제 출력물에서는 `cover/front-cover.tex`, `cover/back-cover.tex`처럼 본문 템플릿과 분리해 관리한다.",
    "",
    "공통 필수 자산:",
    "",
    "- 로고: 사용자가 제공한 국어농장 로고 이미지 `[Image #1]`를 반드시 사용한다.",
    "- 로고 파일명 권장: `assets/brand/koreanfarm-logo.png`.",
    "- 로고는 앞표지와 뒤표지 모두에 들어간다.",
    "- 제목 외 문구는 넣지 않는다. 홍보 문장, 학습 효과 문장, 저자명, 차례 요약, 과장 문구를 표지 디자인에 넣지 않는다.",
    "- ISBN, 바코드, 가격, QR, 발행 정보는 아직 넣지 않는다.",
    "",
    "앞표지:",
    "",
    "- 허용 텍스트는 로고와 제목뿐이다.",
    "- 소쉬르/프레게 제목 표기 예: `생키 소쉬르 1-1`, `생키 프레게 3-5`.",
    "- 러셀/비트겐슈타인 제목 표기 예: `맥(脈) 러셀 1-1`, `맥(脈) 비트겐슈타인 3-5`.",
    "- `1-1`은 레벨 1의 1권이라는 뜻이다. 별도의 `중등`, `고등`, `수능`, `사고력` 문구는 표지에 넣지 않는다.",
    "- 디자인은 제목을 크게 두고, 배경은 실제 글자를 읽을 수 없는 추상적인 지문 흐름, 선, 면, 여백으로 구성한다.",
    "- 중고등 `맥(脈)` 표지는 수능 국어 느낌이 나도록 색을 절제하고, 선명한 대비와 질서 있는 그리드를 쓴다.",
    "- 초등 `생키` 표지는 더 밝고 친근하게 가되, 표지에 설명 문구를 추가하지 않는다.",
    "",
    "뒤표지:",
    "",
    "- 허용 텍스트는 로고와 `www.googerfarm.com`뿐이다.",
    "- `www.googerfarm.com`은 하단 중앙 또는 하단 우측에 작게 배치한다.",
    "- ISBN/바코드 영역은 비워 둔다. 회색 박스나 임시 문구도 넣지 않는다.",
    "- 뒷표지는 앞표지의 색감과 여백만 이어받고, 문장형 설명은 넣지 않는다.",
    "- 뒤표지에도 제공 로고 `[Image #1]`를 작게 넣어 브랜드만 남긴다.",
    "",
    "LaTeX 표지 매크로 제안:",
    "",
    "```tex",
    "\\KFCoverSetup{logo=assets/brand/koreanfarm-logo.png, series=맥(脈), level=러셀1, book=1}",
    "\\KFFrontCover",
    "\\KFBackCover{url=www.googerfarm.com}",
    "```",
    "",
    "## 12레벨 전체 지도",
    "",
    table(["레벨", "대상 학년", "시리즈", "원고량", "학생용 교재 구성", "조판 핵심"], levelRows),
    "",
    "## 실제 원고 진단 요약",
    "",
    table(["레벨", "원고 단위", "구성 신호", "정답/해설 계열 신호", "배점 필드 신호"], sourceRows),
    "",
    "배점 필드 신호는 원고에 남아 있을 수 있는 `points` 계열 필드 탐지 결과다. 최종 학생용 렌더러는 이 값을 읽더라도 출력하지 않는다.",
    "",
    ...levelPlans.flatMap((plan) => [levelDetail(plan, stats.get(plan.level)), ""]),
    "## 학생용 교재 출력 제외 규칙",
    "",
    "- 제외할 섹션 타입: `answer_explain`, `model_answer`.",
    "- 제외할 컴포넌트: 비트겐슈타인 계열의 `chapter_test`, `test.json`.",
    "- 숨길 필드: `answer`, `answers`, `correctAnswer`, `modelAnswer`, `explanation`, `explain`, `scoringCriteria`, `isCorrect`, `points`, `score`, `rubric`.",
    "- 유지할 요소: 지문, 작품, 개념 설명, 어휘 목록, 문제 발문, 보기, 조건, 빈칸, 초성 힌트, 쓰기 줄, 표의 항목명, 이미지 요청.",
    "- 초성/힌트 활동은 정답 텍스트가 아니라 학습 단서로 보아 유지한다. 다만 정답 자체가 노출된 필드는 삭제한다.",
    "- 실력확인/주간 확인은 교재 마무리 활동으로 유지할 수 있다. 단, 채점형 챕터 테스트와 배점은 사이트 시험지로 분리한다.",
    "",
    "## LaTeX 시스템 설계",
    "",
    "엔진은 LuaLaTeX로 고정한다. 한글 조판은 `luatexko`, 글꼴은 `fontspec`, 고어 또는 옛한글 가능성이 있는 러셀/비트겐슈타인 계열은 HarfBuzz 렌더링을 기본값으로 둔다.",
    "",
    "핵심 파일 구조 제안:",
    "",
    "- `latex/styles/koreanfarm-book.sty`: 공통 색상, 헤더/푸터, 박스, 문항, 선택지, 쓰기 칸, 이미지 슬롯 매크로.",
    "- `latex/templates/student-book.tex`: 학생용 4챕터 교재 템플릿.",
    "- `tools/promode/build-manifest.mjs`: 12레벨 원고를 스캔해 챕터/구성요소 manifest 생성.",
    "- `tools/promode/build-student-book-json.mjs`: 4챕터 단위로 학생용 JSON 생성. 정답/해설/배점/테스트 제거.",
    "- `tools/promode/render-latex.mjs`: 학생용 JSON을 LaTeX 본문으로 변환.",
    "- `assets/generated/{level}/{book}/`: 생성 이미지 저장 위치.",
    "- `assets/prompts/{level}/{book}.json`: 이미지 생성 프롬프트와 재생성 로그.",
    "",
    "주요 매크로 제안:",
    "",
    "```tex",
    "\\KFSetup{series=생키, level=소쉬르1, grade=초1, book=1, trim=print}",
    "\\KFChapter{1}{챕터 제목}",
    "\\KFDomain{어휘}",
    "\\KFVocabList{...}",
    "\\KFConceptBox{...}",
    "\\KFPassage{문학}{작품 제목}{...}",
    "\\KFQuestion{number=1,type=객관식}{발문}{보기와 선택지}",
    "\\KFWritingLines{height=35mm}",
    "\\KFImageSlot{16:9}{asset-key}{이미지 생성 프롬프트}",
    "```",
    "",
    "`\\KFSetup`은 12레벨별 글꼴, 글자 크기, 단수, 색상, 헤더 문구를 자동으로 바꾼다. `생키`와 `맥(脈)`은 본문 LaTeX를 다시 고치지 않도록 `series`와 `level` 변수로만 주입한다.",
    "",
    "## 레벨별 조판 정책",
    "",
    "- 소쉬르1~2: 완전 1단. 큰 글자, 넓은 줄간격, 쓰기 칸 중심.",
    "- 소쉬르3: 1단이 기본이나 표, 빈칸, 짧은 문법 활동은 고정 폭 박스로 안정화.",
    "- 프레게1~2: 1단이 기본. 활동량이 많으므로 박스 간격과 문항 번호 체계를 촘촘하게 설계.",
    "- 프레게3: 프레게1~2와 분리. 지문은 1단, 문항은 2단 전환. 중등형 문항 박스 도입.",
    "- 러셀1~3: 지문/개념은 1단, 문제는 2단. 문법 표와 서술형 공간의 규격화가 핵심.",
    "- 비트겐슈타인1~3: index.json 순서를 따르되 `chapter_test`는 제외. 읽기/문학 10세트와 문법/패턴 워크북을 한 권 안에서 안정적으로 연결.",
    "",
    "## 이미지 생성 계획",
    "",
    "- 원고 변환 단계에서 이미지가 필요한 위치를 직접 그림으로 넣지 않고 `KFImageSlot`으로 먼저 표시한다.",
    "- 각 슬롯은 `asset_key`, 권차, 챕터, 영역, 권장 비율, 프롬프트, 금지 요소를 가진다.",
    "- 소쉬르/프레게 이미지는 설명적 삽화와 아이콘 중심으로 간다.",
    "- 러셀/비트겐슈타인은 장식보다 논리 구조, 개념 지도, 작품 맥락, 자료형 도표를 우선한다.",
    "- 생성 이미지는 PNG로 고정하고, 재생성 가능하도록 프롬프트 JSON을 함께 저장한다.",
    "",
    "## 검증 기준",
    "",
    "- 12레벨 모두 20챕터가 감지되어야 한다.",
    "- 각 레벨은 5권으로 정확히 분할되어야 한다.",
    "- 학생용 JSON/LaTeX에는 정답/해설/모범답안/배점/챕터 테스트가 출력되지 않아야 한다.",
    "- 원고의 학습 요소는 누락 없이 보존되어야 한다. 단, 정답·해설 계열은 별도 답안/해설서 파이프라인으로 보낸다.",
    "- LuaLaTeX 컴파일 로그에서 missing character, overfull box, 이미지 누락 경고를 수집한다.",
    "- PDF 샘플은 소쉬르1, 프레게3, 러셀2, 비트겐슈타인3에서 먼저 뽑아 네 가지 조판 난이도를 검증한다.",
    "",
    "## 다음 확정 필요 사항",
    "",
    "1. 최종 인쇄 판형을 `210mm x 280mm`로 확정할지, A4를 그대로 쓸지 결정한다.",
    "2. 제공 로고 `[Image #1]`의 원본 이미지 파일명을 `assets/brand/koreanfarm-logo.png`로 확정할지 결정한다.",
    "3. 표지 대표 색상과 레벨별 색상 체계를 확정한다.",
    "4. 실력확인/주간 확인을 학생용 교재에 유지할지, 챕터 테스트처럼 사이트 시험지로 분리할지 최종 결정한다.",
  ].join("\n");
}

function ensureSources() {
  if (!fs.existsSync(manuscriptRoot)) {
    throw new Error(`원고 폴더가 없습니다: ${manuscriptRoot}`);
  }
  for (const level of allLevels) {
    const levelPath = path.join(manuscriptRoot, level);
    if (!fs.existsSync(levelPath)) throw new Error(`레벨 폴더가 없습니다: ${levelPath}`);
  }
}

async function validateDocx(file) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const required = ["word/document.xml", "[Content_Types].xml", "word/styles.xml"];
  const missing = required.filter((entry) => !zip.file(entry));
  if (missing.length) throw new Error(`DOCX 필수 항목 누락: ${missing.join(", ")}`);
}

function timestampKst() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().replace("Z", "+09:00");
}

function updateAudit(stats) {
  let audit = {
    report_name: "작업_점검_보고서",
    schema_version: "1.0",
    project_root: manuscriptRoot,
    entries: [],
  };
  if (fs.existsSync(auditPath)) {
    audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
    if (!Array.isArray(audit.entries)) audit.entries = [];
  }
  const timestamp = timestampKst();
  const date = timestamp.slice(0, 10);
  const existingIndex = audit.entries.findIndex(
    (entry) =>
      entry.task_summary === "프로모드 12레벨 교재 구성 및 LaTeX 코딩 계획 문서 작성" &&
      Array.isArray(entry.files_created) &&
      entry.files_created.includes(outMd) &&
      entry.files_created.includes(outDocx)
  );
  const countToday =
    audit.entries.filter((entry, index) => index !== existingIndex && String(entry.entry_id || "").startsWith(date)).length + 1;
  const entry = {
    entry_id: `${date}-${String(countToday).padStart(3, "0")}`,
    timestamp,
    task_summary: "프로모드 12레벨 교재 구성 및 LaTeX 코딩 계획 문서 작성",
    project_root: manuscriptRoot,
    related_projects: [process.cwd()],
    work_type: ["교재 구성 계획", "LaTeX 제작 계획", "원고 구조 점검", "문서 생성"],
    files_created: [outMd, outDocx],
    files_updated: [auditPath],
    files_checked: allLevels.map((level) => path.join(manuscriptRoot, level)),
    verification: {
      checks_performed: [
        "12레벨 폴더 존재 확인",
        "각 레벨 20챕터 감지 확인",
        "Markdown 문서 생성 확인",
        "DOCX 변환 및 ZIP/XML 필수 엔트리 확인",
        "정답/해설/배점/챕터 테스트 제외 규칙 문서 반영 확인",
      ],
      result_summary: `12레벨 모두 감지됨: ${allLevels
        .map((level) => `${level} ${stats.get(level).chapterCount}챕터`)
        .join(", ")}`,
      manual_review: true,
      json_validation: true,
    },
    status: "pass",
    remaining_risks: [
      "인쇄 판형과 로고/색상은 최종 확정 필요",
      "제공 로고 [Image #1]의 원본 이미지 파일 저장 경로 확정 필요",
      "실력확인/주간 확인의 교재 포함 여부는 추가 결정 가능",
    ],
    next_actions: [
      "판형과 로고 원본 파일 경로 확정 후 LaTeX 템플릿 구현",
      "학생용 JSON 필터러 구현",
      "대표 4레벨 샘플 PDF 생성 및 검수",
    ],
  };
  if (existingIndex >= 0) {
    audit.entries[existingIndex] = entry;
  } else {
    audit.entries.push(entry);
  }
  fs.writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
}

async function main() {
  ensureSources();
  const stats = buildStats();
  const missingChapters = allLevels.filter((level) => stats.get(level).chapterCount !== 20);
  if (missingChapters.length) {
    throw new Error(`20챕터가 아닌 레벨: ${missingChapters.join(", ")}`);
  }

  fs.writeFileSync(outMd, buildMarkdown(stats), "utf8");
  execFileSync(process.execPath, [path.join("scripts", "markdown_to_compact_docx.mjs"), outMd, outDocx], {
    cwd: process.cwd(),
    stdio: "inherit",
  });
  await validateDocx(outDocx);
  updateAudit(stats);
  console.log(`Markdown: ${outMd}`);
  console.log(`DOCX: ${outDocx}`);
  console.log(`Audit: ${auditPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
