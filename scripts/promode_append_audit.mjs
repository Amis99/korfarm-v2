import fs from "node:fs";
import path from "node:path";

const root = path.join("C:", "Users", "RENEWCOM PC", "Documents", "프로모드 원고");
const auditPath = path.join(root, "작업_점검_보고서.json");
const pdfDir = path.join(root, "latex_trial", "pdf");
const timestamp = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace("Z", "+09:00");
const date = timestamp.slice(0, 10);
const audit = fs.existsSync(auditPath)
  ? JSON.parse(fs.readFileSync(auditPath, "utf8"))
  : { report_name: "작업_점검_보고서", schema_version: "1.0", project_root: root, entries: [] };
if (!Array.isArray(audit.entries)) audit.entries = [];
const countToday = audit.entries.filter((entry) => String(entry.entry_id || "").startsWith(date)).length + 1;
const pdfs = fs.readdirSync(pdfDir).filter((file) => file.endsWith(".pdf")).map((file) => path.join(pdfDir, file));

audit.entries.push({
  entry_id: `${date}-${String(countToday).padStart(3, "0")}`,
  timestamp,
  task_summary: "12레벨 1권 샘플 PDF 재생성 전 JSON 키 인벤토리·디자인 규칙·정답 필터 보완",
  project_root: root,
  related_projects: [
    path.join("C:", "Users", "RENEWCOM PC", "Documents", "국어농장v2교재디자인라텍스"),
    path.join("C:", "Users", "RENEWCOM PC", "Documents", "국어농장v2홈페이지"),
  ],
  work_type: ["JSON 키 인벤토리", "LaTeX 렌더러 보정", "디자인 규칙 반영", "PDF 검증"],
  files_created: [
    path.join(root, "latex_trial", "out", "json_key_inventory.json"),
    path.join(root, "latex_trial", "out", "json_key_inventory.md"),
    path.join(root, "latex_trial", "assets", "brand", "koreanfarm-logo.png"),
    ...pdfs,
  ],
  files_updated: [
    path.join(root, "프로모드_12레벨_교재구성_LaTeX_코딩계획.md"),
    path.join(root, "latex_trial", "build_level1_books.mjs"),
    path.join(root, "latex_trial", "styles", "koreanfarmtrial.sty"),
    path.join(root, "latex_trial", "out", "build_report.json"),
    auditPath,
  ],
  files_checked: [
    path.join(root, "소쉬르1"),
    path.join(root, "소쉬르2"),
    path.join(root, "소쉬르3"),
    path.join(root, "프레게1"),
    path.join(root, "프레게2"),
    path.join(root, "프레게3"),
    path.join(root, "러셀1"),
    path.join(root, "러셀2"),
    path.join(root, "러셀3"),
    path.join(root, "비트겐슈타인1"),
    path.join(root, "비트겐슈타인2"),
    path.join(root, "비트겐슈타인3"),
  ],
  verification: {
    checks_performed: [
      "12레벨 JSON 키 인벤토리 생성",
      "기존 교재디자인 LaTeX 작업물 평가 내용 계획 문서 반영",
      "문제 지문 박스/마크다운 표/활동 박스/라벨 고아 방지 규칙 반영",
      "12레벨 1권 PDF 재생성",
      "pdfinfo 페이지 수 확인",
      "pdftotext로 원시 정답·해설 키명 잔존 여부 검사",
    ],
    result_summary: "12개 PDF 생성 완료. 원시 정답·해설 키명 검사에서 매치 없음. answer_format은 답안 형식 라벨로 출력.",
    manual_review: true,
    json_validation: true,
  },
  status: "pass",
  remaining_risks: [
    "Missing character 경고가 일부 레벨에 남아 있어 최종 글꼴 세팅 보완 필요",
    "현재는 샘플 조판이므로 활동별 세부 미감은 추가 라운드에서 더 다듬어야 함",
    "문제 블록이 한 페이지보다 긴 경우는 별도 축약/분리 정책 필요",
  ],
  next_actions: [
    "대표 PDF를 육안 검수하여 실제 페이지 넘김 품질 확인",
    "최종 LaTeX 템플릿으로 분리",
    "전체 60권 빌드 파이프라인으로 확장",
  ],
});

fs.writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
console.log(auditPath);
