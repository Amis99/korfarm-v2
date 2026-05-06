// 임시 체크리스트 일괄 backfill — hqadmin 으로 로그인 후 POST /v1/admin/learning-corpus/pending/bulk-extract 호출
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "https://gf2.hak1ad.kr";
const ID = "hqadmin";
const PW = "admin1234";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "ko-KR",
  timezoneId: "Asia/Seoul",
});
const page = await ctx.newPage();

console.log("로그인 시도:", ID);
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[placeholder="아이디를 입력하세요"]', ID);
await page.fill('input[placeholder="비밀번호를 입력하세요"]', PW);
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 12_000 });
console.log("로그인 완료 →", page.url());

// localStorage 또는 쿠키에서 토큰 가져오기
const token = await page.evaluate(() => localStorage.getItem("token") || localStorage.getItem("accessToken") || "");
if (!token) {
  console.log("토큰 미발견 — localStorage 키 출력:");
  const keys = await page.evaluate(() => Object.keys(localStorage));
  console.log(keys);
  await browser.close();
  process.exit(1);
}
console.log("토큰 획득 (길이:", token.length, ")");

// fetch 로 호출 (브라우저 컨텍스트 — CORS 우회)
const result = await page.evaluate(async ({ base, token }) => {
  const r = await fetch(`${base}/v1/admin/learning-corpus/pending/bulk-extract`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const text = await r.text();
  return { status: r.status, body: text };
}, { base: BASE, token });

console.log("\n=== 응답 ===");
console.log("HTTP", result.status);
console.log(result.body);

// 통계도 같이
const stats = await page.evaluate(async ({ base, token }) => {
  const r = await fetch(`${base}/v1/admin/learning-corpus/pending/stats`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  return { status: r.status, body: await r.text() };
}, { base: BASE, token });
console.log("\n=== 통계 ===");
console.log("HTTP", stats.status);
console.log(stats.body);

await browser.close();
