// ORG_ADMIN 전체 메뉴·핵심 시나리오 점검
// 출력: 페이지별 콘솔 에러 / 4xx·5xx 응답 / 깨진 셀렉터를 한꺼번에 보고
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "https://gf2.hak1ad.kr";
const ID = process.env.ORG_ID ?? "orgadmin";
const PW = process.env.ORG_PW ?? "admin1234";

const targets = [
  { name: "01-dashboard",         url: "/admin" },
  { name: "02-approvals",         url: "/admin/approvals" },
  { name: "03-classes",           url: "/admin/classes" },
  { name: "04-students",          url: "/admin/students" },
  { name: "05-parents",           url: "/admin/parents" },
  { name: "06-content",           url: "/admin/content" },
  { name: "07-study-content",     url: "/admin/study-content" },
  { name: "08-study-plans",       url: "/admin/study-plans" },
  { name: "09-tests",             url: "/admin/tests" },
  { name: "10-duel",              url: "/admin/duel" },
  { name: "11-shop",              url: "/admin/shop" },
  { name: "12-wisdom",            url: "/admin/wisdom" },
  { name: "13-grapefruit-wallet", url: "/admin/grapefruit-wallet" },
  { name: "14-billing",           url: "/admin/billing" },
  { name: "15-org-settings",      url: "/admin/org-settings" },
];

const HQ_ONLY = [
  // ORG_ADMIN 이 직접 URL 으로 접근하면 어떻게 되는지 (정지/리다이렉트/403)
  { name: "X-orgs",               url: "/admin/orgs" },
  { name: "X-grapefruit-pricing", url: "/admin/grapefruit-pricing" },
  { name: "X-all-billings",       url: "/admin/all-billings" },
  { name: "X-own-study-contents", url: "/admin/own-study-contents" },
  { name: "X-inquiry",            url: "/admin/inquiry" },
  { name: "X-reports",            url: "/admin/reports" },
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
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push({ url: page.url(), text: msg.text().slice(0, 250) });
});
page.on("response", (resp) => {
  const url = resp.url();
  if (url.includes("/v1/") && resp.status() >= 400) {
    httpErrors.push({ pageUrl: page.url(), api: url.replace(BASE, ""), status: resp.status() });
  }
});

console.log("로그인 시도:", ID);
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
try {
  await page.fill('input[placeholder="아이디를 입력하세요"]', ID);
  await page.fill('input[placeholder="비밀번호를 입력하세요"]', PW);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 15_000 });
} catch (e) {
  console.log("로그인 실패:", e.message);
  await browser.close();
  process.exit(1);
}
console.log("로그인 후:", page.url(), "\n");

const visit = async (t, label) => {
  const beforeC = consoleErrors.length;
  const beforeH = httpErrors.length;
  try {
    const resp = await page.goto(`${BASE}${t.url}`, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    await page.waitForTimeout(800);
    const status = resp?.status() ?? 0;
    const newC = consoleErrors.length - beforeC;
    const newH = httpErrors.length - beforeH;
    const finalUrl = page.url();
    const redirected = !finalUrl.includes(t.url);
    const flag = (newC === 0 && newH === 0 && status < 400 && !redirected) ? "✓" : "✗";
    console.log(`${flag} ${label} ${t.name.padEnd(28)} ${t.url.padEnd(35)} status=${status} console=${newC} http4xx5xx=${newH}${redirected ? " ↪ " + finalUrl.replace(BASE, "") : ""}`);
  } catch (e) {
    console.log(`✗ ${label} ${t.name.padEnd(28)} ${t.url.padEnd(35)} EXCEPTION ${e.message.split("\n")[0].slice(0, 80)}`);
  }
};

console.log("=== ORG_ADMIN 사이드바 메뉴 ===");
for (const t of targets) await visit(t, "[ORG]");

console.log("\n=== HQ 전용 URL 직접 접근 (차단되어야 정상) ===");
for (const t of HQ_ONLY) await visit(t, "[HQ ]");

console.log("\n=== 콘솔 에러 상세 ===");
consoleErrors.slice(0, 30).forEach((e, i) => console.log(`${i + 1}. [${e.url.replace(BASE, "")}] ${e.text}`));
if (consoleErrors.length > 30) console.log(`... (총 ${consoleErrors.length}건)`);

console.log("\n=== HTTP 4xx/5xx 상세 ===");
httpErrors.slice(0, 40).forEach((e, i) => console.log(`${i + 1}. [${e.pageUrl.replace(BASE, "")}] ${e.status} ${e.api}`));
if (httpErrors.length > 40) console.log(`... (총 ${httpErrors.length}건)`);

console.log(`\n총 콘솔 에러: ${consoleErrors.length} | 총 HTTP 에러: ${httpErrors.length}`);
await browser.close();
