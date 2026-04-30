import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const reportPath = path.join(root, "docs", "프로젝트_전체_종합_보고서.md");
const rel = (p) => path.relative(root, p).replaceAll(path.sep, "/");
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const linesOf = (txt) => txt.length ? txt.split(/\r?\n/).length : 0;
const pageBreak = "\n<div style=\"page-break-after: always;\"></div>\n";
const skipDirNames = new Set([".git", "node_modules", ".gradle", "build", "dist", "__pycache__"]);

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirNames.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

function safeStat(p) {
  try { return fs.statSync(p); } catch { return null; }
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function mdTable(headers, rows) {
  const esc = (v) => String(v ?? "")
    .replaceAll("\n", "<br>")
    .replaceAll("|", "\\|");
  return [
    `| ${headers.map(esc).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.map(esc).join(" | ")} |`),
  ].join("\n");
}

function groupBy(arr, keyFn) {
  const m = new Map();
  for (const item of arr) {
    const k = keyFn(item);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

function extractRoutes() {
  const src = read(path.join(root, "frontend", "src", "App.jsx"));
  const rows = [];
  const importMap = new Map();
  for (const line of src.split(/\r?\n/)) {
    let m = line.match(/import\s+([A-Z][A-Za-z0-9_]*)\s+from\s+"([^"]+)"/);
    if (m) importMap.set(m[1], m[2]);
    m = line.match(/const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*lazy/);
    if (m) importMap.set(m[1], "lazy import");
  }
  src.split(/\r?\n/).forEach((line, idx) => {
    if (!line.includes("<Route")) return;
    const pathMatch = line.match(/path="([^"]+)"/);
    const elementMatch = line.match(/element=\{(.+?)\}\s*\/?>/);
    if (!pathMatch || !elementMatch) return;
    const routePath = pathMatch[1];
    const element = elementMatch[1].trim();
    let guard = "public";
    if (element.startsWith("P(")) guard = "login";
    if (element.startsWith("A(")) guard = "admin";
    if (element.includes("<Navigate")) guard = "redirect";
    const compMatch = element.match(/<([A-Z][A-Za-z0-9_]*)/);
    rows.push({
      path: routePath,
      element,
      guard,
      component: compMatch?.[1] ?? (element.includes("Navigate") ? "Navigate" : element),
      source: importMap.get(compMatch?.[1]) ?? "",
      line: idx + 1,
    });
  });
  return rows;
}

function extractPathArg(args) {
  const m = args.match(/"([^"]*)"/);
  return m ? m[1] : "";
}

function joinPaths(base, sub) {
  const b = base || "";
  const s = sub || "";
  if (!b) return s || "/";
  if (!s) return b;
  return `${b.replace(/\/$/, "")}/${s.replace(/^\//, "")}`;
}

function extractEndpoints() {
  const ktFiles = walk(path.join(root, "backend", "src", "main", "kotlin"))
    .filter((p) => p.endsWith(".kt"));
  const endpoints = [];
  const websocket = [];
  const mapName = {
    GetMapping: "GET",
    PostMapping: "POST",
    PutMapping: "PUT",
    PatchMapping: "PATCH",
    DeleteMapping: "DELETE",
    RequestMapping: "ANY",
  };
  for (const file of ktFiles) {
    const txt = read(file);
    if (!txt.includes("@RestController") && !txt.includes("@Controller")) continue;
    const ls = txt.split(/\r?\n/);
    const classLine = ls.findIndex((l) => /\bclass\s+\w+Controller\b/.test(l));
    const controller = txt.match(/\bclass\s+(\w+Controller)\b/)?.[1] ?? path.basename(file, ".kt");
    let basePath = "";
    if (classLine >= 0) {
      for (let i = Math.max(0, classLine - 8); i < classLine; i++) {
        const m = ls[i].match(/@RequestMapping\((.*)\)/);
        if (m) basePath = extractPathArg(m[1]);
      }
    }
    let pending = [];
    for (let i = Math.max(0, classLine + 1); i < ls.length; i++) {
      const line = ls[i];
      const mapping = line.match(/@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)\((.*)\)/);
      if (mapping) {
        pending.push({ ann: mapping[1], path: extractPathArg(mapping[2]), line: i + 1 });
      }
      const msg = line.match(/@MessageMapping\((.*)\)/);
      if (msg) {
        websocket.push({
          destination: extractPathArg(msg[1]),
          controller,
          file: rel(file),
          line: i + 1,
        });
      }
      const fun = line.match(/\bfun\s+(\w+)/);
      if (fun && pending.length) {
        for (const p of pending) {
          endpoints.push({
            method: mapName[p.ann] ?? p.ann,
            path: joinPaths(basePath, p.path),
            controller,
            handler: fun[1],
            file: rel(file),
            line: p.line,
          });
        }
        pending = [];
      }
    }
  }
  endpoints.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
  websocket.sort((a, b) => a.destination.localeCompare(b.destination));
  return { endpoints, websocket };
}

function extractEntities() {
  const ktFiles = walk(path.join(root, "backend", "src", "main", "kotlin"))
    .filter((p) => p.endsWith(".kt"));
  const entities = [];
  const repositories = [];
  const services = [];
  const controllers = [];
  for (const file of ktFiles) {
    const txt = read(file);
    const ls = txt.split(/\r?\n/);
    const tableRegex = /@Table\s*\(([\s\S]*?)\)\s*(?:\r?\n\s*)*(?:data\s+)?class\s+(\w+)/g;
    let m;
    while ((m = tableRegex.exec(txt))) {
      const table = m[1].match(/name\s*=\s*"([^"]+)"/)?.[1] ?? "";
      const line = txt.slice(0, m.index).split(/\r?\n/).length;
      entities.push({ table, entity: m[2], file: rel(file), line });
    }
    ls.forEach((line, idx) => {
      let r = line.match(/\binterface\s+(\w+(?:Repository|Repo))\s*:/);
      if (r) repositories.push({ name: r[1], file: rel(file), line: idx + 1 });
      r = line.match(/\bclass\s+(\w+Service)\b/);
      if (r) services.push({ name: r[1], file: rel(file), line: idx + 1 });
      r = line.match(/\bclass\s+(\w+Controller)\b/);
      if (r) controllers.push({ name: r[1], file: rel(file), line: idx + 1 });
    });
  }
  const byName = (a, b) => a.name?.localeCompare(b.name) ?? a.table?.localeCompare(b.table);
  entities.sort((a, b) => a.table.localeCompare(b.table));
  repositories.sort(byName);
  services.sort(byName);
  controllers.sort(byName);
  return { entities, repositories, services, controllers };
}

function extractDb() {
  const sqlFiles = walk(path.join(root, "backend", "src", "main", "resources"))
    .filter((p) => p.endsWith(".sql"))
    .concat(walk(path.join(root, "docs", "migrations")).filter((p) => p.endsWith(".sql")))
    .concat([path.join(root, "docs", "schema.sql")].filter((p) => fs.existsSync(p)));
  const creates = [];
  const alters = [];
  const inserts = [];
  const flags = new Set();
  for (const file of sqlFiles) {
    const txt = read(file);
    const ls = txt.split(/\r?\n/);
    ls.forEach((line, idx) => {
      let m = line.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([A-Za-z0-9_]+)`?/i);
      if (m) creates.push({ table: m[1], file: rel(file), line: idx + 1 });
      m = line.match(/ALTER\s+TABLE\s+`?([A-Za-z0-9_]+)`?/i);
      if (m) alters.push({ table: m[1], file: rel(file), line: idx + 1, stmt: line.trim() });
      m = line.match(/INSERT\s+INTO\s+`?([A-Za-z0-9_]+)`?/i);
      if (m) inserts.push({ table: m[1], file: rel(file), line: idx + 1 });
      for (const fm of line.matchAll(/'(feature\.[^']+|ops\.[^']+)'/g)) flags.add(fm[1]);
    });
  }
  const migrationsDir = path.join(root, "backend", "src", "main", "resources", "db", "migration");
  const migrations = fs.existsSync(migrationsDir)
    ? fs.readdirSync(migrationsDir).filter((n) => n.endsWith(".sql")).sort()
    : [];
  return { creates, alters, inserts, flags: [...flags].sort(), migrations };
}

function extractFrontendApiPaths() {
  const files = walk(path.join(root, "frontend", "src")).filter((p) => /\.(jsx?|tsx?)$/.test(p));
  const paths = new Map();
  const apiCallRows = [];
  for (const file of files) {
    const txt = read(file);
    const ls = txt.split(/\r?\n/);
    ls.forEach((line, idx) => {
      const matches = [...line.matchAll(/[`'"]((?:https?:\/\/[^`'"]+)?\/v1\/[^`'"]+)/g)];
      for (const m of matches) {
        const raw = m[1].replace(/\$\{[^}]+\}/g, "{expr}");
        paths.set(raw, (paths.get(raw) ?? 0) + 1);
        apiCallRows.push({ path: raw, file: rel(file), line: idx + 1 });
      }
    });
  }
  return {
    distinct: [...paths.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    calls: apiCallRows.sort((a, b) => a.path.localeCompare(b.path)),
  };
}

function folderJsonStats(baseRel) {
  const base = path.join(root, baseRel);
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const dir = path.join(base, e.name);
      const files = fs.readdirSync(dir).filter((n) => n.endsWith(".json")).sort();
      const days = files.map((n) => Number(n.match(/\d+/)?.[0])).filter(Number.isFinite);
      return {
        folder: `${baseRel}/${e.name}`,
        json: files.length,
        min: days.length ? Math.min(...days) : "",
        max: days.length ? Math.max(...days) : "",
        first: files[0] ?? "",
        last: files.at(-1) ?? "",
      };
    })
    .sort((a, b) => a.folder.localeCompare(b.folder));
}

function listDocs() {
  return walk(path.join(root, "docs"))
    .filter((p) => /\.(md|pdf|tex|sql|yaml|yml|png)$/i.test(p))
    .sort((a, b) => rel(a).localeCompare(rel(b)))
    .map((p) => {
      const st = safeStat(p);
      const isText = /\.(md|tex|sql|yaml|yml)$/i.test(p);
      return { file: rel(p), size: st ? humanSize(st.size) : "", lines: isText ? linesOf(read(p)) : "" };
    });
}

function scriptInventory() {
  const files = walk(root)
    .filter((p) => /(^|\/|\\)(scripts|backend\/scripts|tmp_qc)(\/|\\)/.test(rel(p)) || /(\.py|\.js|\.mjs|\.ps1|\.sql|\.jsonl|\.tsv)$/i.test(p))
    .filter((p) => !rel(p).startsWith("frontend/public/daily-reading/"))
    .filter((p) => !rel(p).startsWith("frontend/public/daily-quiz/"))
    .sort((a, b) => rel(a).localeCompare(rel(b)));
  return files.map((p) => {
    const st = safeStat(p);
    return { file: rel(p), ext: path.extname(p) || "(none)", size: st ? humanSize(st.size) : "", lines: /\.(py|js|mjs|ps1|sql|jsonl|tsv)$/i.test(p) ? linesOf(read(p)) : "" };
  });
}

function contentAssets() {
  const sections = [];
  const publicDir = path.join(root, "frontend", "public");
  const generatedDir = path.join(root, "generated");
  const proManuscript = path.join(root, "프로모드 원고");
  for (const base of [publicDir, generatedDir, proManuscript]) {
    if (!fs.existsSync(base)) continue;
    const files = walk(base);
    const ext = groupBy(files, (p) => path.extname(p).toLowerCase() || "(none)");
    const top = groupBy(files, (p) => rel(p).split("/").slice(0, 3).join("/"));
    sections.push({ base: rel(base), count: files.length, ext, top });
  }
  return sections;
}

function packageInfo() {
  const rootPkg = JSON.parse(read(path.join(root, "package.json")) || "{}");
  const fePkg = JSON.parse(read(path.join(root, "frontend", "package.json")) || "{}");
  return { rootPkg, fePkg };
}

function existingReportNotes() {
  const candidates = [
    "docs/프로젝트_현황_명세서.md",
    "docs/학생용-기능-명세서.md",
    "docs/학습모듈_구현현황_보고서.md",
    "docs/프로모드_기능명세.md",
    "docs/manual-student.md",
    "docs/manual-parent.md",
    "docs/manual-admin.md",
    "docs/콘텐츠_저장구조_분석_및_개선안.md",
  ];
  return candidates.filter((f) => fs.existsSync(path.join(root, f))).map((f) => ({
    file: f,
    lines: linesOf(read(path.join(root, f))),
    size: humanSize(fs.statSync(path.join(root, f)).size),
  }));
}

function featureDomains() {
  return [
    ["공개/마케팅", "랜딩, 소개, 가이드, 진단 안내, FAQ, 가격, 약관, 개인정보, 비회원 문의", "LandingPage/AboutPage/GuidePage/DiagnosticInfo/Faq/Pricing/Terms/Privacy/Inquiry + GuestInquiryController"],
    ["인증/계정", "회원가입, 아이디 중복 확인, 로그인/로그아웃, 내 정보, 비밀번호 초기화 요청, 프로필 수정, 학습 시작일 모드", "AuthController/AuthService, SecurityConfig, JwtService, RefreshTokenEntity"],
    ["가입 승인/기관", "기관 선택 가입, 대기 상태, 관리자 승인/거절, 기관/반/학생 관리, 기관 관리자 배정", "MembershipApprovalController, OrgController, AdminMembershipApprovalPage"],
    ["학생 홈", "프로필/레벨/시즌점수/오늘 학습/과제/유료 메뉴/최근 씨앗/랭킹/대결/커뮤니티/쇼핑 진입", "StartPage, EconomyController, SeasonController, AssignmentController"],
    ["일일 퀴즈", "레벨·일차별 정적 JSON 로딩, 학습 엔진 풀이, 제출, 씨앗 보상", "DailyQuizPage, DailyLearningPage, LearningController, frontend/public/daily-quiz"],
    ["일일 독해", "정독-복기-확인 구조, 레벨·일차별 정적 JSON, 시간/씨앗/정답 피드백", "DailyReadingPage, useDailyContent, ReadingTrainingModule, frontend/public/daily-reading"],
    ["농장별 학습", "9개 농장 카탈로그, 필터/정렬/페이지네이션, 정적/DB 콘텐츠 실행, 페이지 진도", "FarmModePage, FarmListPage, LearningRunnerPage, ContentCatalogController, FarmLearningController"],
    ["학습 엔진", "EngineShell, 결과 요약, 타이머, 씨앗, 인쇄, 13개 모듈 등록", "frontend/src/engine/core, frontend/src/engine/modules"],
    ["프로 모드", "레벨별 챕터, 학습 아이템, 잠금/진행, PDF 출력, 1시간 OMR, 통과/재응시, 정답지", "ProModePage/ProChapterPage/ProTestPage/ProAnswerKeyPage, ProController/AdminProPage"],
    ["시험/테스트 창고", "시험 목록, PDF, OMR, 제출, 성적표, 오답노트, 이력, 관리자 시험 CRUD", "TestController/AdminTestController, TestStorage/Detail/Omr/Report/WrongNote"],
    ["진단 테스트 v2", "단계 선택, 인쇄/응시, 세션, 결과 보고서, 관리자 데이터", "DiagnosticController/AdminDiagnosticController, DiagnosticV2/Test/Report/Print pages"],
    ["통합 성적표", "기간별 학습·시험·진단·씨앗 집계, 차트, 학생/학부모/관리자 조회", "UnifiedReportController/Service, UnifiedReportPage"],
    ["학습 계획", "계획/스코프/자산/셀/일정/달력/제출/첨부/관리자 매트릭스", "StudyPlanController/AdminStudyPlanController, StudyPlan pages"],
    ["과제", "과제 생성, 대상 지정, 목록, 진행률, 제출, 마감/재개, 관리자 개요", "AssignmentController/AdminAssignmentController, AssignmentsPage"],
    ["커뮤니티/게시판", "게시판 목록, 글/댓글/좋아요/신고, 관리자 자료 승인/반려, 게시판 관리", "BoardController/AdminBoardController/AdminBoardManageController/CommunityPage"],
    ["지식과 지혜", "레벨별 글쓰기, 첨부, 좋아요, 댓글, 관리자 피드백, AI 피드백, OCR", "WisdomController/AdminWisdomController/Wisdom pages"],
    ["커뮤니티 채팅", "방 메시지, 첨부, 좋아요, 이모티콘, 관리자 아카이브/뮤트/이모티콘 관리, AI 참고자료", "ChatController/ChatAdminController, chat components, AdminChatArchivesPage"],
    ["문제은행", "문제 JSON 가져오기, 레코드 목록/상세/수정/삭제/내보내기, 코드 그룹/값 관리, 검수 필드", "AdminQuestionBankController, AdminLearningDB/QB pages"],
    ["콘텐츠 관리", "콘텐츠 가져오기/일괄 가져오기/목록/미리보기/편집/삭제/수정 이력/원고", "AdminContentController/AdminContentService/AdminContent pages"],
    ["학습 자료 DB", "DB 기반 학습 콘텐츠 CRUD, 문제 일괄 등록, 학생 학습 세션/시도/진도", "StudyContentController/AdminStudyContentController/StudyLearningPage"],
    ["씨앗 경제", "씨앗/수확물/비료, 교환, 일괄 교환, 장부, 관리자 지급/차감", "EconomyController/AdminEconomyController, HarvestLedger/SeedLedger"],
    ["시즌/랭킹", "현재 시즌, 수확 랭킹, 대결 랭킹, 시상 스냅샷, 관리자 시즌 목록", "SeasonController/AdminSeasonController/RankingPage"],
    ["대결", "서버/로비/방/AI 참가/준비/시작/문제/결과/전적/관리자 문제·시즌·정산", "DuelController/AdminDuelController/Duel pages"],
    ["상점/주문", "상품 목록/상세, 주문, 내 주문, 관리자 상품/주문/배송 상태", "ShopController/AdminShopController/Shop pages"],
    ["구독/결제", "구독 상태, 해지, 토스 결제 승인/실패, 결제 내역, 관리자 결제", "SubscriptionController/PaymentController/AdminPaymentController"],
    ["학부모 연결", "부모-학생 연결 요청/승인/거절, 학부모 자녀 프로필·장부·성적·학습계획 조회", "ParentLinkController, ParentLinks/StudentLinkConfirm/ParentStudyPlan"],
    ["파일/출력", "파일 presign, 업로드, 다운로드, 원본명, 프린트 잡", "FileController/FileService, PrintController"],
    ["운영/플래그", "기능 플래그, 운영 스테이션, 관리자 대시보드, 문의/신고, 헬스체크", "AdminFlagController/OpsStation/AdminDashboardController/HealthController"],
    ["검색", "학습 콘텐츠 검색 화면과 API", "SearchResultsPage, ContentSearchController"],
  ];
}

function makeReport() {
  const allFiles = walk(root).filter((p) => rel(p) !== "docs/프로젝트_전체_종합_보고서.md");
  const sourceFiles = allFiles.filter((p) => /\.(kt|jsx?|css|sql|md|yaml|yml|json|mjs|py|ps1)$/i.test(p));
  const routes = extractRoutes();
  const { endpoints, websocket } = extractEndpoints();
  const { entities, repositories, services, controllers } = extractEntities();
  const db = extractDb();
  const feApi = extractFrontendApiPaths();
  const docs = listDocs();
  const scripts = scriptInventory();
  const assets = contentAssets();
  const { rootPkg, fePkg } = packageInfo();
  const dailyReading = folderJsonStats("frontend/public/daily-reading");
  const dailyQuiz = folderJsonStats("frontend/public/daily-quiz");
  const notes = existingReportNotes();
  const gitStatus = (() => {
    try { return execSync("git status --short", { cwd: root, encoding: "utf8", maxBuffer: 1024 * 1024 * 8 }).trim(); }
    catch (e) { return `git status 조회 실패: ${e.message}`; }
  })();

  const report = [];
  report.push("# 국어농장 v2 프로젝트 전체 종합 보고서");
  report.push("");
  report.push(`- 작성일: 2026-04-20`);
  report.push(`- 기준 경로: \`${root.replaceAll("\\", "/")}\``);
  report.push("- 작성 방식: 현재 워크스페이스의 코드, DB 마이그레이션, 정적 콘텐츠, 문서, 스크립트를 자동 추출하고 사람이 읽을 수 있는 기능 보고서로 재구성");
  report.push("- 범위 원칙: 애플리케이션 기능과 운영 산출물은 빠짐없이 인벤토리화했고, `.git`, `node_modules`, 빌드 출력물(`build`, `dist`, `.gradle`)은 기능 원천이 아니라서 집계 대상에서 제외");
  report.push("- 출력 참고: 이 Markdown은 표와 전체 인벤토리를 포함하므로 PDF/A4로 변환하면 수백 쪽 규모가 된다.");
  report.push("");
  report.push("## 0. 요약");
  report.push("");
  report.push(mdTable(
    ["항목", "수량/상태"],
    [
      ["전체 조사 파일", allFiles.length],
      ["소스/문서/설정성 파일", sourceFiles.length],
      ["프론트 라우트", routes.length],
      ["백엔드 HTTP 엔드포인트", endpoints.length],
      ["백엔드 컨트롤러", controllers.length],
      ["백엔드 서비스", services.length],
      ["백엔드 JPA 엔티티", entities.length],
      ["백엔드 Repository", repositories.length],
      ["DB 마이그레이션", db.migrations.length],
      ["DB CREATE TABLE 발견", db.creates.length],
      ["기능 플래그 키", db.flags.length],
      ["프론트 소스 내 /v1 API 호출 패턴", feApi.distinct.length],
      ["일일 독해 레벨 폴더", dailyReading.length],
      ["일일 퀴즈 레벨 폴더", dailyQuiz.length],
      ["문서/운영 산출물", docs.length],
    ]
  ));
  report.push("");
  report.push("이 프로젝트는 국어 학습 플랫폼, 학습 콘텐츠 제작 파이프라인, 운영 관리자 도구, 시험/진단/성적 리포트, 커뮤니티/채팅, 결제/상점, 학부모 연결, 프로모드 원고·문항 제작 자산이 한 저장소에 함께 들어 있는 대형 교육 서비스 코드베이스다.");
  report.push("");
  report.push("핵심 기술 스택은 React 19 + Vite 7 프론트엔드, Spring Boot 3.2 + Kotlin + JPA 백엔드, MySQL 8 계열 DB, Flyway 마이그레이션, 정적 JSON 기반 학습 콘텐츠, PDF/이미지/원고 산출물이다.");
  report.push(pageBreak);

  report.push("## 1. 프로젝트 구조");
  report.push("");
  report.push(mdTable(
    ["최상위 영역", "파일 수", "설명"],
    groupBy(allFiles, (p) => rel(p).split("/")[0]).map(([name, count]) => {
      const desc = {
        frontend: "React/Vite 앱, 페이지, 학습 엔진, 정적 콘텐츠",
        backend: "Spring Boot/Kotlin API, JPA 엔티티, DB 마이그레이션",
        docs: "기획서, 기능 명세, 운영 매뉴얼, 스키마, 회의자료",
        generated: "콘텐츠 import 산출물, 테스트 PDF, 재가져오기 데이터",
        scripts: "콘텐츠/문항/DB/검증/생성 자동화 스크립트",
        infra: "로컬 Docker/MySQL 인프라",
        shared: "공유 계약/계획 문서",
        design: "디자인 자산",
      }[name] ?? "원고, 임시 산출물, 참고자료, 보조 도구";
      return [name, count, desc];
    })
  ));
  report.push("");
  report.push("### 확장자별 분포");
  report.push("");
  report.push(mdTable(["확장자", "파일 수"], groupBy(allFiles, (p) => path.extname(p).toLowerCase() || "(none)").map(([k, v]) => [k, v])));
  report.push(pageBreak);

  report.push("## 2. 실행/환경/보안 설정");
  report.push("");
  report.push("- 프론트 개발 서버: `frontend/package.json`의 `npm run dev`, Vite 기본 포트 5173");
  report.push("- 프론트 빌드: `frontend/package.json`의 `npm run build`");
  report.push("- 백엔드 빌드/실행: `backend/gradlew`, Spring Boot Kotlin, Java 17 toolchain");
  report.push("- 로컬 DB: `infra/local/docker-compose.yml`의 MySQL 8.0, DB명 `korfarm`, root password `korfarm`");
  report.push("- API 기본값: 프론트 `VITE_API_BASE` 미설정 시 `http://localhost:8080`");
  report.push("- Vite 프록시: `/v1` → `http://localhost:8080`");
  report.push("- Jackson: snake_case 응답/요청 전략, 프론트 `utils/api.js`에서 camelCase 변환");
  report.push("- 보안: JWT 기반 stateless, `SecurityConfig`에서 `/v1/health`, `/v1/auth/**`, `/v1/learning/catalog/**`, `/v1/learning/content/**`, `/v1/public/**`, `/v1/files/*/download` 공개 허용");
  report.push("- 주의: `application.yml` 기준 Flyway는 `enabled: false`, JPA는 `ddl-auto: update` 상태다. 운영 전에는 마이그레이션 정합성 점검이 필요하다.");
  report.push("");
  report.push("### 의존성");
  report.push("");
  report.push(mdTable(
    ["영역", "dependency", "version"],
    [
      ...Object.entries(rootPkg.dependencies ?? {}).map(([k, v]) => ["root dependencies", k, v]),
      ...Object.entries(rootPkg.devDependencies ?? {}).map(([k, v]) => ["root devDependencies", k, v]),
      ...Object.entries(fePkg.dependencies ?? {}).map(([k, v]) => ["frontend dependencies", k, v]),
      ...Object.entries(fePkg.devDependencies ?? {}).map(([k, v]) => ["frontend devDependencies", k, v]),
    ]
  ));
  report.push(pageBreak);

  report.push("## 3. 기능 도메인 전체 목록");
  report.push("");
  report.push("아래 표는 라우트, 컨트롤러, 기존 문서, 파일 구조를 합쳐 재구성한 기능 도메인이다. 각 도메인의 세부 라우트와 API는 뒤의 부록에 전부 펼쳐 둔다.");
  report.push("");
  report.push(mdTable(["도메인", "포함 기능", "대표 코드/자산"], featureDomains()));
  report.push(pageBreak);

  report.push("## 4. 사용자별 기능 지도");
  report.push("");
  report.push("### 학생");
  report.push("");
  report.push("- 공개: 랜딩, 소개, 가이드, 진단 안내, FAQ, 가격, 약관/개인정보, 문의, 회원가입, 로그인, 비밀번호 초기화");
  report.push("- 무료 로그인: 홈, 일일 퀴즈, 일일 독해, 과제 바구니, 진단 테스트, 테스트 응시/기록, 통합 성적표, 랭킹, 씨앗 장부, 프로필, 학부모 연결 확인");
  report.push("- 구독 또는 프론트 가드: 프로 모드, 농장별 학습 시작/완료, 지식과 지혜 진입, 일부 커뮤니티 게시판, 테스트 창고 진입 카드");
  report.push("- 피처 플래그 영향: 대결, 쇼핑몰, 결제, 파일 업로드/다운로드, 시즌 시상/랭킹 등은 플래그로 차단 또는 개방될 수 있다.");
  report.push("");
  report.push("### 학부모");
  report.push("");
  report.push("- 자녀 연결 요청/조회, 자녀 프로필·인벤토리·장부·학습 이력·시험 성적·오답노트·진단 결과·학습계획 조회가 있다.");
  report.push("- 학부모용 라우트는 `/parents/links`, `/parents/children/:studentId/study-plan` 및 백엔드 `/v1/parents/children/{studentId}/...` 계열 API로 구성된다.");
  report.push("");
  report.push("### 관리자");
  report.push("");
  report.push("- 본부/기관/반/학생/회원승인/학부모 연결/콘텐츠/문제은행/학습자료/과제/프로모드/시험/진단/지식과 지혜/게시판/채팅/대결/상점/결제/신고/성적표/기능 플래그/운영 스테이션을 관리한다.");
  report.push("- 관리자 페이지는 `/admin` 하위에 집중되어 있고, `AdminRoute`가 프론트 진입을 감싼다.");
  report.push(pageBreak);

  report.push("## 5. 프론트엔드 라우팅 개요");
  report.push("");
  const guardCount = groupBy(routes, (r) => r.guard);
  report.push(mdTable(["가드", "라우트 수"], guardCount.map(([k, v]) => [k, v])));
  report.push("");
  report.push("프론트 라우트는 `App.jsx` 기준 총 " + routes.length + "개다. 상세 전체 목록은 부록 A에 있다.");
  report.push("");
  report.push("### 공개 라우트");
  report.push("");
  report.push(mdTable(["path", "component"], routes.filter((r) => r.guard === "public").map((r) => [r.path, r.component])));
  report.push("");
  report.push("### 로그인 필요 라우트");
  report.push("");
  report.push(mdTable(["path", "component"], routes.filter((r) => r.guard === "login").slice(0, 80).map((r) => [r.path, r.component])));
  report.push("");
  report.push("### 관리자 라우트");
  report.push("");
  report.push(mdTable(["path", "component"], routes.filter((r) => r.guard === "admin").map((r) => [r.path, r.component])));
  report.push(pageBreak);

  report.push("## 6. 백엔드 API 개요");
  report.push("");
  report.push("백엔드 HTTP API는 컨트롤러 어노테이션 기준 총 " + endpoints.length + "개가 추출되었다.");
  report.push("");
  report.push(mdTable(["HTTP method", "수"], groupBy(endpoints, (e) => e.method).map(([k, v]) => [k, v])));
  report.push("");
  report.push(mdTable(["상위 경로", "수"], groupBy(endpoints, (e) => e.path.split("/").slice(0, 4).join("/") || "/").map(([k, v]) => [k, v])));
  report.push("");
  report.push("관리자 API는 `/v1/admin` 하위에 집중되어 있고, 학생/학부모 API는 `/v1`, `/v1/parents`, `/v1/learning`, `/v1/pro`, `/v1/test-storage`로 분리되어 있다.");
  report.push(pageBreak);

  report.push("## 7. 데이터 모델/DB 개요");
  report.push("");
  report.push("- 백엔드 JPA 엔티티: " + entities.length + "개");
  report.push("- DB 마이그레이션: " + db.migrations.length + "개");
  report.push("- `docs/schema.sql`과 Flyway 마이그레이션이 병존한다.");
  report.push("- 주요 테이블군: 사용자/기관/반, 콘텐츠/학습, 시험/진단, 프로모드, 경제/시즌/대결, 게시판/채팅, 상점/결제, 학습계획, 문제은행, 파일, 기능 플래그");
  report.push("");
  report.push("### JPA 엔티티 요약");
  report.push("");
  report.push(mdTable(["table", "entity", "file"], entities.map((e) => [e.table, e.entity, e.file])));
  report.push(pageBreak);

  report.push("## 8. 학습 콘텐츠/정적 자산 현황");
  report.push("");
  report.push("### 일일 독해 JSON");
  report.push("");
  report.push(mdTable(["folder", "json files", "min day", "max day", "first", "last"], dailyReading.map((r) => [r.folder, r.json, r.min, r.max, r.first, r.last])));
  report.push("");
  report.push("### 일일 퀴즈 JSON");
  report.push("");
  report.push(mdTable(["folder", "json files", "min day", "max day", "first", "last"], dailyQuiz.map((r) => [r.folder, r.json, r.min, r.max, r.first, r.last])));
  report.push("");
  report.push("### 주요 콘텐츠 자산 묶음");
  report.push("");
  for (const section of assets) {
    report.push(`#### ${section.base}`);
    report.push("");
    report.push(`- 파일 수: ${section.count}`);
    report.push("");
    report.push(mdTable(["확장자", "파일 수"], section.ext.map(([k, v]) => [k, v])));
    report.push("");
    report.push(mdTable(["하위 묶음", "파일 수"], section.top.slice(0, 60).map(([k, v]) => [k, v])));
    report.push("");
  }
  report.push(pageBreak);

  report.push("## 9. 학습 엔진/모듈");
  report.push("");
  const moduleIndex = read(path.join(root, "frontend", "src", "engine", "modules", "index.js"));
  const moduleRows = [...moduleIndex.matchAll(/^\s*([a-z0-9_]+):\s*([A-Za-z0-9_]+)/gm)].map((m) => [m[1], m[2]]);
  report.push(mdTable(["module_key", "React component"], moduleRows));
  report.push("");
  report.push("- 공통 셸: `EngineShell`이 READY/RUNNING/PAUSED/FINISHED 상태, 시간바, 씨앗, 결과 요약, 인쇄, 서버 완료 로그를 담당한다.");
  report.push("- 문제 모달: `QuestionModal`이 선택형 문제의 위치, 셔플, 정오답 피드백을 담당한다.");
  report.push("- 토큰 지문: `TokenPassage`가 확인 클릭과 선택지 판별의 근거 찾기를 담당한다.");
  report.push("- PDF 학습: `StudyContentModule` 및 관련 PDF 컴포넌트가 페이지 기반 학습과 이어보기를 담당한다.");
  report.push(pageBreak);

  report.push("## 10. 운영 리스크와 남은 작업");
  report.push("");
  report.push(mdTable(
    ["우선순위", "항목", "근거/설명"],
    [
      ["높음", "Flyway 비활성 + ddl-auto update", "`application.yml`에서 운영형 스키마 관리가 꺼져 있어 운영 전 마이그레이션 기준 정리가 필요"],
      ["높음", "JWT_SECRET 기본값 없음", "로컬 실행 시 환경변수 누락 여부를 반드시 확인해야 함"],
      ["높음", "작업트리 변경 다수", "보고서 생성 전 `git status --short`가 이미 많은 수정/미추적 파일을 표시함. 기존 사용자 작업을 보존해야 함"],
      ["중간", "기존 문서 일부와 현재 코드 상태 불일치 가능", "예: 과거 프로모드 명세에는 스텁이라고 적혀 있으나 현재 라우트/컨트롤러/페이지는 구현 흔적이 있음"],
      ["중간", "정적 JSON 콘텐츠 검수", "콘텐츠 파일 수가 매우 많으므로 스키마/범위/정답 검증 자동화가 계속 필요"],
      ["중간", "피처 플래그 정책 정합성", "라우트는 존재하나 플래그로 비활성인 기능이 있어 운영 노출 상태를 별도 관리해야 함"],
      ["낮음", "문서 통합", "manual, 기능 명세, 작업 계획, 원고 검수 로그가 분산되어 있어 본 보고서를 기준 목차로 삼아 재정리 가능"],
    ]
  ));
  report.push(pageBreak);

  report.push("## 11. 기존 핵심 문서");
  report.push("");
  report.push("다음 문서들은 본 보고서 작성 시 교차 확인한 주요 문서다.");
  report.push("");
  report.push(mdTable(["문서", "라인 수", "크기"], notes.map((n) => [n.file, n.lines, n.size])));
  report.push(pageBreak);

  report.push("## 부록 A. 프론트엔드 전체 라우트");
  report.push("");
  report.push(mdTable(["path", "guard", "component", "source", "App.jsx line"], routes.map((r) => [r.path, r.guard, r.component, r.source, r.line])));
  report.push(pageBreak);

  report.push("## 부록 B. 백엔드 HTTP API 전체 목록");
  report.push("");
  report.push(mdTable(["method", "path", "controller", "handler", "file:line"], endpoints.map((e) => [e.method, e.path, e.controller, e.handler, `${e.file}:${e.line}`])));
  if (websocket.length) {
    report.push("");
    report.push("### WebSocket/MessageMapping");
    report.push("");
    report.push(mdTable(["destination", "controller", "file:line"], websocket.map((e) => [e.destination, e.controller, `${e.file}:${e.line}`])));
  }
  report.push(pageBreak);

  report.push("## 부록 C. 백엔드 구성요소 인벤토리");
  report.push("");
  report.push("### Controllers");
  report.push("");
  report.push(mdTable(["controller", "file:line"], controllers.map((c) => [c.name, `${c.file}:${c.line}`])));
  report.push("");
  report.push("### Services");
  report.push("");
  report.push(mdTable(["service", "file:line"], services.map((s) => [s.name, `${s.file}:${s.line}`])));
  report.push("");
  report.push("### Repositories");
  report.push("");
  report.push(mdTable(["repository", "file:line"], repositories.map((r) => [r.name, `${r.file}:${r.line}`])));
  report.push("");
  report.push("### Entities");
  report.push("");
  report.push(mdTable(["table", "entity", "file:line"], entities.map((e) => [e.table, e.entity, `${e.file}:${e.line}`])));
  report.push(pageBreak);

  report.push("## 부록 D. DB 마이그레이션/테이블/플래그");
  report.push("");
  report.push("### 마이그레이션 파일");
  report.push("");
  report.push(mdTable(["#", "file"], db.migrations.map((m, i) => [i + 1, m])));
  report.push("");
  report.push("### CREATE TABLE 발견 목록");
  report.push("");
  report.push(mdTable(["table", "file:line"], db.creates.map((c) => [c.table, `${c.file}:${c.line}`])));
  report.push("");
  report.push("### ALTER TABLE 발견 목록");
  report.push("");
  report.push(mdTable(["table", "statement", "file:line"], db.alters.slice(0, 400).map((a) => [a.table, a.stmt, `${a.file}:${a.line}`])));
  report.push("");
  report.push("### 기능 플래그 키");
  report.push("");
  report.push(mdTable(["flag key"], db.flags.map((f) => [f])));
  report.push(pageBreak);

  report.push("## 부록 E. 프론트엔드 /v1 API 호출 패턴");
  report.push("");
  report.push("### 고유 경로 패턴");
  report.push("");
  report.push(mdTable(["path pattern", "occurrences"], feApi.distinct.map(([p, n]) => [p, n])));
  report.push("");
  report.push("### 호출 위치 전체");
  report.push("");
  report.push(mdTable(["path pattern", "file:line"], feApi.calls.map((c) => [c.path, `${c.file}:${c.line}`])));
  report.push(pageBreak);

  report.push("## 부록 F. 문서/운영 산출물 인벤토리");
  report.push("");
  report.push(mdTable(["file", "size", "lines"], docs.map((d) => [d.file, d.size, d.lines])));
  report.push(pageBreak);

  report.push("## 부록 G. 스크립트/자동화 인벤토리");
  report.push("");
  report.push(mdTable(["file", "ext", "size", "lines"], scripts.map((s) => [s.file, s.ext, s.size, s.lines])));
  report.push(pageBreak);

  report.push("## 부록 H. 전체 파일 인벤토리");
  report.push("");
  report.push("아래 목록은 `.git`, `node_modules`, 빌드 출력 폴더를 제외한 전체 파일 인벤토리다. 기능 구현 원천, 정적 콘텐츠, 문서, 원고, 생성물의 위치를 빠짐없이 추적하기 위한 부록이다.");
  report.push("");
  report.push(mdTable(
    ["#", "file", "size"],
    allFiles
      .sort((a, b) => rel(a).localeCompare(rel(b)))
      .map((p, i) => {
        const st = safeStat(p);
        return [i + 1, rel(p), st ? humanSize(st.size) : ""];
      })
  ));
  report.push(pageBreak);

  report.push("## 부록 I. Git 작업트리 상태");
  report.push("");
  report.push("보고서 생성 시점의 작업트리 상태다. 이 보고서는 기존 변경을 되돌리지 않고 새 파일만 생성한다.");
  report.push("");
  report.push("```text");
  report.push(gitStatus || "(clean)");
  report.push("```");

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report.join("\n"), "utf8");
  return { reportPath, lineCount: report.length, routes: routes.length, endpoints: endpoints.length, files: allFiles.length };
}

const result = makeReport();
console.log(JSON.stringify(result, null, 2));
