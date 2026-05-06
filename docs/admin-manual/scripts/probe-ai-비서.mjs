// AI 비서 라이브 시나리오 자동 점검
// hqadmin 으로 로그인 → 시나리오마다 채팅 → 응답·도구 호출 결과 캡처
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "https://gf2.hak1ad.kr";
const ID = "hqadmin";
const PW = "admin1234";

const SCENARIOS = [
  { cat: "수강생-조회", text: "박지강 학생 정보 알려줘" },
  { cat: "수강생-변경", text: "박지강 학생 정보를 보여만 줘. 변경은 하지 마." },
  { cat: "수강생-일괄", text: "비활성 학생들 목록 보여줘" },
  { cat: "수강반-조회", text: "수강반 목록 보여줘" },
  { cat: "수강반-생성", text: "수강반 목록 보여만 줘. 새로 만들지는 마." },
  { cat: "학습계획표-조회", text: "박지강 학습 계획표 보여줘" },
  { cat: "학습계획표-단건", text: "박지강 학습 계획표 국어농장 셀에 소쉬르1 독해 1편 내일까지 배정. 진행 전 확인 안 받고 진행해" },
  { cat: "학습계획표-일괄", text: "초1 학생들에게 동일 학습 일괄 배정 후보 만들어 (실제 배정은 하지 마)" },
  { cat: "글쓰기-조회", text: "최근 글쓰기 게시물 5개 보여줘" },
  { cat: "글쓰기-AI", text: "최근 글쓰기 게시물 1개에 AI 첨삭 요청해줘 (확인 후 진행)" },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "ko-KR",
  timezoneId: "Asia/Seoul",
});
const page = await ctx.newPage();

const consoleErrors = [];
const httpErrors = [];
page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 180)); });
page.on("response", r => {
  const url = r.url();
  if (url.includes("/v1/") && r.status() >= 400) httpErrors.push(`[${r.status()}] ${url.replace(BASE, "")}`);
});

console.log("로그인 중...");
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[placeholder="아이디를 입력하세요"]', ID);
await page.fill('input[placeholder="비밀번호를 입력하세요"]', PW);
await page.click('button[type="submit"]');
await page.waitForURL(u => !u.toString().includes("/login"), { timeout: 12_000 });
console.log("로그인 완료\n");

// /admin AI 비서 화면 진입 + 새 대화 시작
await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);

// 토큰 획득
const token = await page.evaluate(() => sessionStorage.getItem("korfarm_token"));

const results = [];

async function callTurn(message, sessionId = null) {
  const resp = await page.evaluate(async ({ base, token, sessionId, message }) => {
    const r = await fetch(`${base}/v1/admin/agent/turns`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, message }),
    });
    const text = await r.text();
    return { status: r.status, body: text };
  }, { base: BASE, token, sessionId, message });
  return resp;
}

for (const [i, s] of SCENARIOS.entries()) {
  console.log(`\n=== ${i + 1}. [${s.cat}] ${s.text} ===`);
  const t0 = Date.now();
  try {
    const r = await callTurn(s.text);
    const dur = Date.now() - t0;
    if (r.status >= 400) {
      console.log(`HTTP ${r.status} (${dur}ms)`);
      console.log(r.body.slice(0, 400));
      results.push({ ...s, ok: false, status: r.status, error: r.body.slice(0, 200) });
      continue;
    }
    const json = JSON.parse(r.body);
    const data = json.data || {};
    const text = data.assistant_text || data.assistantText || "";
    const toolCalls = data.tool_calls_executed || data.toolCallsExecuted || 0;
    console.log(`OK (${dur}ms) tools=${toolCalls}`);
    console.log("응답:", text.slice(0, 250).replace(/\n/g, " "));
    results.push({
      ...s, ok: true, durMs: dur, tools: toolCalls,
      response: text.slice(0, 200),
    });
  } catch (e) {
    console.log("ERROR:", e.message);
    results.push({ ...s, ok: false, error: e.message });
  }
  await page.waitForTimeout(800);
}

console.log("\n\n========== 요약 ==========");
let ok = 0, fail = 0;
for (const r of results) {
  const tag = r.ok ? "✓" : "✗";
  console.log(`${tag} [${r.cat}] tools=${r.tools ?? "-"} dur=${r.durMs ?? "-"}ms`);
  if (r.ok) ok++; else fail++;
}
console.log(`\n총 ${results.length}개: 성공 ${ok}, 실패 ${fail}`);

if (consoleErrors.length > 0) {
  console.log(`\n콘솔 에러 ${consoleErrors.length}건 (최대 5):`);
  consoleErrors.slice(0, 5).forEach(e => console.log("  " + e));
}
if (httpErrors.length > 0) {
  console.log(`\nAPI 4xx/5xx ${httpErrors.length}건 (최대 8):`);
  httpErrors.slice(0, 8).forEach(e => console.log("  " + e));
}

await browser.close();
