// 기관 관리자(ORG_ADMIN) 매뉴얼용 화면 자동 캡처
// 사용: node scripts/capture.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const IMAGES = resolve(ROOT, "images");

const BASE = process.env.BASE_URL ?? "https://gf2.hak1ad.kr";
const ID = process.env.ORG_ID ?? "orgadmin";
const PW = process.env.ORG_PW ?? "admin1234";

mkdirSync(IMAGES, { recursive: true });

// 14 chapter + overview = 매뉴얼에서 참조하는 캡처 파일명과 1:1 매핑
const targets = [
  { name: "00-overview-sidebar",       url: "/admin",                            wait: ".admin-side, h1" },
  { name: "01-dashboard",              url: "/admin",                            wait: "h1, .admin-card" },
  { name: "02-approvals",              url: "/admin/approvals",                  wait: "h1" },
  { name: "03-classes",                url: "/admin/classes",                    wait: "h1" },
  { name: "04-students",               url: "/admin/students",                   wait: "h1, table" },
  { name: "05-parents",                url: "/admin/parents",                    wait: "h1" },
  { name: "06-content",                url: "/admin/content",                    wait: "h1" },
  { name: "07-study-content",          url: "/admin/study-content",              wait: "h1" },
  { name: "08-study-plans",            url: "/admin/study-plans",                wait: "h1" },
  { name: "09-tests",                  url: "/admin/tests",                      wait: "h1" },
  { name: "10-duel",                   url: "/admin/duel",                       wait: "h1" },
  { name: "11-wisdom",                 url: "/admin/wisdom",                     wait: "h1" },
  { name: "12-grapefruit-wallet",      url: "/admin/grapefruit-wallet",          wait: "h1" },
  { name: "13-billing",                url: "/admin/billing",                    wait: "h1" },
  { name: "14-org-settings",           url: "/admin/org-settings",               wait: "h1" },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "ko-KR",
  timezoneId: "Asia/Seoul",
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

console.log("로그인:", ID);
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[placeholder="아이디를 입력하세요"]', ID);
await page.fill('input[placeholder="비밀번호를 입력하세요"]', PW);
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 15_000 });
console.log("로그인 후:", page.url(), "\n");

let ok = 0, fail = 0;
for (const t of targets) {
  try {
    await page.goto(`${BASE}${t.url}`, { waitUntil: "domcontentloaded", timeout: 15_000 });
    if (t.wait) await page.waitForSelector(t.wait, { timeout: 10_000 }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    await page.waitForTimeout(800);
    const path = resolve(IMAGES, `${t.name}.png`);
    await page.screenshot({ path, fullPage: true });
    console.log(`✓ ${t.name.padEnd(30)} ${t.url}`);
    ok++;
  } catch (e) {
    console.log(`✗ ${t.name.padEnd(30)} ${e.message.split("\n")[0].slice(0, 100)}`);
    fail++;
  }
}

await browser.close();
console.log(`\n완료: 성공 ${ok} / 실패 ${fail}`);
