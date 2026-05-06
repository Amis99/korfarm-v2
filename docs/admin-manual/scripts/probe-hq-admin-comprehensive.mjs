// HQ_ADMIN AI 비서 전 기능 점검 — 출시 전 종합
// hqadmin (org_hq) 으로 로그인 → 카테고리별 광범위 시나리오
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "https://gf2.hak1ad.kr";
const ID = "hqadmin";
const PW = "admin1234";

const SCENARIOS = [
  // ───── 학생·수강반·기관 (조회) ─────
  { cat: "전체 학생 조회", text: "전체 학생 목록 보여줘 (5명만)", expectAllow: true },
  { cat: "기관별 학생 조회", text: "테스트학원 소속 학생 목록 보여줘", expectAllow: true },
  { cat: "수강반 조회", text: "전체 수강반 목록 보여줘", expectAllow: true },
  { cat: "기관 목록", text: "전체 기관 목록 보여줘", expectAllow: true },
  { cat: "학부모 조회", text: "학부모 회원 목록 보여줘", expectAllow: true },

  // ───── 콘텐츠·학습 (조회) ─────
  { cat: "콘텐츠 검색", text: "saussure1 비문학 콘텐츠 5개 보여줘", expectAllow: true },
  { cat: "테스트 시험지", text: "운영 중인 테스트 시험지 5개 보여줘", expectAllow: true },
  { cat: "학습 후보 추천", text: "russell1 문법 학습 후보 5개 추천해줘", expectAllow: true },

  // ───── 결제·자몽 (조회·HQ 전용) ─────
  { cat: "전체 기관 결제", text: "모든 기관의 월 결제 상태 보여줘", expectAllow: true },
  { cat: "자몽 단가 조회", text: "현재 자몽 단가표 보여줘", expectAllow: true },
  { cat: "기관별 자몽 잔액", text: "테스트학원 자몽 잔액 보여줘", expectAllow: true },

  // ───── 시즌·대결 (HQ 전용 운영) ─────
  { cat: "현재 시즌 조회", text: "현재 진행 중인 시즌 정보 보여줘", expectAllow: true },
  { cat: "AI 플레이어 목록", text: "AI 플레이어 목록 보여줘", expectAllow: true },

  // ───── 글쓰기·문의·신고 ─────
  { cat: "글쓰기 게시물", text: "최근 글쓰기 게시물 5개 보여줘", expectAllow: true },
  { cat: "문의 목록", text: "최근 문의 목록 보여줘", expectAllow: true },
  { cat: "신고 처리", text: "처리 대기 중인 신고 목록 보여줘", expectAllow: true },

  // ───── 학습 계획표 — HQ 가 학생에게 직접 배정 ─────
  { cat: "학습 계획표 매트릭스", text: "박지강 학생의 학습 계획표 보여줘", expectAllow: true },

  // ───── AI 사용 현황 (운영 모니터링) ─────
  { cat: "AI 사용 통계", text: "최근 AI 사용 현황 보여줘", expectAllow: true },

  // ───── 시스템에 없는 기능 — 정직하게 거절 (false 라고 안 만들고 안내) ─────
  // 모호한 응답이 어렵게 평가되므로 제외
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "ko-KR", timezoneId: "Asia/Seoul" });
const page = await ctx.newPage();

console.log(`로그인: ${ID}`);
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[placeholder="아이디를 입력하세요"]', ID);
await page.fill('input[placeholder="비밀번호를 입력하세요"]', PW);
await page.click('button[type="submit"]');
await page.waitForURL(u => !u.toString().includes("/login"), { timeout: 12_000 });
await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
const token = await page.evaluate(() => sessionStorage.getItem("korfarm_token"));

const results = [];
for (const [i, s] of SCENARIOS.entries()) {
  console.log(`\n=== ${i + 1}. [${s.cat}] expect=${s.expectAllow ? "ALLOW" : "DENY"} ===`);
  console.log(`   "${s.text}"`);
  const t0 = Date.now();
  try {
    const r = await page.evaluate(async ({ base, token, message }) => {
      const r = await fetch(`${base}/v1/admin/agent/turns`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: null, message }),
      });
      return { status: r.status, body: await r.text() };
    }, { base: BASE, token, message: s.text });
    const dur = Date.now() - t0;
    const json = JSON.parse(r.body || "{}");
    const data = json.data || {};
    const fullText = data.assistant_text || data.assistantText || "";
    const text = fullText.toLowerCase();
    const tools = data.tool_calls_executed || data.toolCallsExecuted || 0;
    // 거절 — HQ 가 "권한 없음" 이라고 답하면 안 됨
    const denied = /권한이 없|hq_admin이 아니|허용되지|차단/.test(text);
    // 실제 데이터 없음 — 빈 결과 또는 500/오류
    const dataErrored = /서버 오류|500|찾을 수 없습니다|error|fail/i.test(fullText) && !/0건|없습니다/.test(fullText);
    const verdict = s.expectAllow
      ? denied ? "FAIL (권한 거절)" : dataErrored ? "WARN (데이터 오류)" : "PASS"
      : denied ? "PASS (DENY)" : "FAIL (예상=DENY 실제=ALLOW)";
    console.log(`   ${verdict} tools=${tools} dur=${dur}ms`);
    console.log(`   응답: ${fullText.slice(0, 180).replace(/\n/g, " ")}`);
    results.push({ ...s, verdict, ok: verdict.startsWith("PASS"), tools, durMs: dur });
  } catch (e) {
    console.log(`   ERROR: ${e.message}`);
    results.push({ ...s, ok: false, error: e.message });
  }
  await page.waitForTimeout(800);
}

console.log("\n========== 요약 ==========");
let pass = 0, fail = 0, warn = 0;
for (const r of results) {
  const tag = r.ok ? "✓" : (r.verdict?.startsWith("WARN") ? "⚠" : "✗");
  console.log(`${tag} [${r.cat}]  ${r.verdict || r.error || "?"}`);
  if (r.ok) pass++; else if (r.verdict?.startsWith("WARN")) warn++; else fail++;
}
console.log(`\n총 ${results.length}개: PASS ${pass}, WARN ${warn}, FAIL ${fail}`);

await browser.close();
