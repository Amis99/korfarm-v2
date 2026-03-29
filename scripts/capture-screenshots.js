#!/usr/bin/env node
/**
 * 국어농장 화면 스크린샷 전수 캡처 스크립트
 * - Phase A: 더미 데이터 생성 (시험+문항+답안+계획표)
 * - Phase B: 동적 ID 수집 (DOM에서 학생/콘텐츠/챕터 등)
 * - Phase C: 전체 캡처 (기존 46개 + 추가 39개 = 85개)
 * - Phase D: 더미 데이터 정리
 *
 * puppeteer 요청 인터셉션으로 localhost:8080 → EC2 리다이렉트
 */
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:5174/korfarm-v2";
const EC2_API = "http://43.200.104.102:8080";
const SCREENSHOT_DIR = path.join(__dirname, "..", "docs", "screenshots");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const ACCOUNTS = {
  admin: { login_id: "hqadmin", password: "admin1234" },
  student: { login_id: "paidstudent", password: "admin1234" },
  parent: { login_id: "testparent", password: "admin1234" },
};

// ─── 기존 페이지 목록 (46개) ───

const ADMIN_PAGES = [
  { name: "admin-dashboard", path: "/admin", wait: 2500 },
  { name: "admin-approvals", path: "/admin/approvals", wait: 1500 },
  { name: "admin-orgs", path: "/admin/orgs", wait: 1500 },
  { name: "admin-classes", path: "/admin/classes", wait: 1500 },
  { name: "admin-students", path: "/admin/students", wait: 1500 },
  { name: "admin-parents", path: "/admin/parents", wait: 1500 },
  { name: "admin-content", path: "/admin/content", wait: 1500 },
  { name: "admin-assignments", path: "/admin/assignments", wait: 1500 },
  { name: "admin-tests", path: "/admin/tests", wait: 1500 },
  { name: "admin-study-plans", path: "/admin/study-plans", wait: 1500 },
  { name: "admin-pro", path: "/admin/pro", wait: 1500 },
  { name: "admin-learning-db", path: "/admin/learning-db", wait: 1500 },
  { name: "admin-duel", path: "/admin/duel", wait: 1500 },
  { name: "admin-shop", path: "/admin/shop", wait: 1500 },
  { name: "admin-inquiry", path: "/admin/inquiry", wait: 1500 },
  { name: "admin-wisdom", path: "/admin/wisdom", wait: 1500 },
  { name: "admin-edit-history", path: "/admin/edit-history", wait: 1500 },
  { name: "admin-reports", path: "/admin/reports", wait: 1500 },
];

const STUDENT_PAGES = [
  { name: "student-start", path: "/start", wait: 2500 },
  { name: "student-daily-learning", path: "/daily", wait: 2000 },
  { name: "student-daily-quiz", path: "/daily-quiz", wait: 2000 },
  { name: "student-daily-reading", path: "/daily-reading", wait: 2000 },
  { name: "student-duel", path: "/duel", wait: 1500 },
  { name: "student-diagnostic", path: "/diagnostic/v2", wait: 1500 },
  { name: "student-farm-mode", path: "/farm-mode", wait: 1500 },
  { name: "student-pro-mode", path: "/pro-mode", wait: 1500 },
  { name: "student-tests", path: "/tests", wait: 1500 },
  { name: "student-writing", path: "/writing", wait: 1500 },
  { name: "student-assignments", path: "/assignments", wait: 1500 },
  { name: "student-study-plan", path: "/study-plan", wait: 1500 },
  { name: "student-harvest-ledger", path: "/harvest-ledger", wait: 1500 },
  { name: "student-seed-log", path: "/seed-log", wait: 1500 },
  { name: "student-shop", path: "/shop", wait: 1500 },
  { name: "student-ranking", path: "/ranking", wait: 1500 },
  { name: "student-community", path: "/community", wait: 1500 },
  { name: "student-report", path: "/report", wait: 1500 },
  { name: "student-subscription", path: "/subscription", wait: 1500 },
  { name: "student-profile", path: "/profile", wait: 1500 },
];

const PARENT_PAGES = [
  { name: "parent-start", path: "/start", wait: 2500 },
  { name: "parent-links", path: "/parents/links", wait: 1500 },
  { name: "parent-ranking", path: "/ranking", wait: 1500 },
  { name: "parent-community", path: "/community", wait: 1500 },
  { name: "parent-shop", path: "/shop", wait: 1500 },
  { name: "parent-profile", path: "/profile", wait: 1500 },
];

const PUBLIC_PAGES = [
  { name: "landing", path: "/", wait: 2000 },
  { name: "login", path: "/login", wait: 1000 },
  { name: "signup", path: "/signup", wait: 1000 },
];

// ─── API 헬퍼 ───

async function apiCall(method, endpoint, token, body) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const resp = await fetch(`${EC2_API}${endpoint}`, opts);
  const data = await resp.json();
  return data;
}

async function loginAndGetToken(account) {
  const data = await apiCall("POST", "/v1/auth/login", null, account);
  return data?.data?.access_token || data?.data?.accessToken || null;
}

async function loginAndGetUser(account) {
  const data = await apiCall("POST", "/v1/auth/login", null, account);
  return {
    token: data?.data?.access_token || data?.data?.accessToken || null,
    user: data?.data?.user || null,
  };
}

// ─── Phase A: 더미 데이터 생성 ───

async function setupDummyData(adminToken, studentUserId) {
  console.log("\n[Phase A] 더미 데이터 생성...");
  const ids = {};

  try {
    // 1) 시험 생성 (camelCase 필드명)
    const testResp = await apiCall("POST", "/v1/admin/test-papers", adminToken, {
      title: "[매뉴얼 캡처용] 러셀1 모의시험",
      levelId: "russell1",
      totalQuestions: 10,
      totalPoints: 100,
      series: "일반",
      examDate: "2026-03-29",
      timeLimitMinutes: 60,
      description: "매뉴얼 스크린샷 캡처용 더미 시험입니다. 캡처 완료 후 자동 삭제됩니다.",
    });
    ids.testId = testResp?.data?.testId || testResp?.data?.id;
    if (ids.testId) {
      console.log(`  시험 생성 OK: ${ids.testId}`);

      // 2) 문항 등록 (객관식 8 + 서술형 2)
      const questions = [];
      for (let i = 1; i <= 8; i++) {
        questions.push({
          number: i,
          type: "객관식",
          domain: "독해",
          subDomain: "비문학",
          points: 10,
          correctAnswer: String(((i - 1) % 5) + 1),
        });
      }
      for (let i = 9; i <= 10; i++) {
        questions.push({
          number: i,
          type: "서술형",
          domain: "어휘",
          subDomain: "기본",
          points: 10,
          modelAnswer: "모범 답안 예시",
        });
      }
      const qResp = await apiCall("POST", `/v1/admin/test-papers/${ids.testId}/questions`, adminToken, { questions });
      console.log(`  문항 등록 OK (${qResp?.data?.count || 10}문항)`);

      // 3) 학생 대리 답안 제출
      const submitResp = await apiCall("POST", `/v1/admin/test-papers/${ids.testId}/submit-for-student`, adminToken, {
        userId: studentUserId,
        answers: {
          "1": "1", "2": "2", "3": "3", "4": "4", "5": "5",
          "6": "1", "7": "2", "8": "3", "9": "서술형 답안 예시", "10": "서술형 답안 예시",
        },
      });
      ids.submissionId = submitResp?.data?.submissionId || submitResp?.data?.id;
      console.log(`  답안 제출 OK: ${ids.submissionId || "(ID 미반환)"}`);
    } else {
      console.error(`  시험 생성 실패 — 기존 시험 검색 중...`);
      // fallback: 기존 시험 중 제출이 있는 것 사용
      const listResp = await apiCall("GET", "/v1/admin/test-papers", adminToken);
      const allTests = listResp?.data || [];
      const submitted = allTests.find((t) => t.submission_count > 0);
      if (submitted) {
        ids.testId = submitted.test_id || submitted.testId;
        ids.testIsExisting = true; // 기존 시험이므로 삭제하지 않음
        console.log(`  기존 시험 사용: ${ids.testId} (${submitted.title})`);
      } else {
        // 아무 시험이라도 사용
        if (allTests.length > 0) {
          ids.testId = allTests[0].test_id || allTests[0].testId;
          ids.testIsExisting = true;
          console.log(`  기존 시험 사용 (제출 없음): ${ids.testId}`);
        }
      }
    }

    // 4) 학습계획표 생성
    const planResp = await apiCall("POST", "/v1/admin/study-plans", adminToken, {
      title: "[매뉴얼 캡처용] 학습 계획표",
      start_date: "2026-03-29",
      end_date: "2026-04-30",
      description: "매뉴얼 스크린샷 캡처용 더미 계획표입니다.",
    });
    ids.planId = planResp?.data?.planId || planResp?.data?.id;
    if (ids.planId) {
      console.log(`  학습계획표 생성 OK: ${ids.planId}`);
    }
  } catch (err) {
    console.error(`  더미 데이터 생성 실패: ${err.message}`);
  }

  return ids;
}

// ─── Phase B: 동적 ID 수집 ───

async function collectDynamicIds(browser, tokens, dummyIds, userInfo) {
  console.log("\n[Phase B] 동적 ID 수집...");
  const ids = { ...dummyIds };

  // 로그인 응답에서 바로 추출 가능한 ID
  ids.studentUserId = userInfo.student?.id || "u_paid_student";
  ids.levelId = userInfo.student?.level_id || "saussure1";
  ids.parentStudentId = ids.studentUserId; // 학부모 자녀 연결이 없을 수 있으므로 fallback
  console.log(`  studentUserId (로그인): ${ids.studentUserId}`);
  console.log(`  levelId (로그인): ${ids.levelId}`);

  // 관리자 세션으로 수집
  const adminPage = await browser.newPage();
  await adminPage.setViewport({ width: 1440, height: 900 });
  await setupApiRedirect(adminPage);
  await adminPage.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 15000 });
  await adminPage.evaluate((t) => sessionStorage.setItem("korfarm_token", t), tokens.admin);
  await delay(500);

  try {
    // contentId: /admin/content 페이지에서 첫 콘텐츠 편집 링크
    await adminPage.goto(`${BASE}/admin/content`, { waitUntil: "networkidle2", timeout: 20000 });
    await delay(2000);
    ids.contentId = await adminPage.evaluate(() => {
      // 제목 클릭 → 비주얼 에디터 링크에서 ID 추출
      const links = document.querySelectorAll("a");
      for (const a of links) {
        const href = a.getAttribute("href") || "";
        if (href.includes("/admin/content/edit")) {
          const m = href.match(/[?&]id=([^&]+)/);
          if (m) return m[1];
        }
      }
      // 테이블 제목 셀 클릭 시 data 속성
      const titleCell = document.querySelector("table tbody tr td:first-child a, table tbody tr td:first-child span[style*='cursor']");
      return titleCell?.getAttribute("data-id") || null;
    });
    console.log(`  contentId: ${ids.contentId || "미수집"}`);
  } catch (err) {
    console.error(`  관리자 ID 수집 실패: ${err.message.slice(0, 100)}`);
  }
  await adminPage.close();

  // 학생 세션으로 수집
  const studentPage = await browser.newPage();
  await studentPage.setViewport({ width: 1440, height: 900 });
  await setupApiRedirect(studentPage);
  await studentPage.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 15000 });
  await studentPage.evaluate((t) => sessionStorage.setItem("korfarm_token", t), tokens.student);
  await delay(500);

  try {
    // chapterId: /pro-mode 에서 "진행중" 행 클릭 → URL에서 추출
    await studentPage.goto(`${BASE}/pro-mode`, { waitUntil: "networkidle2", timeout: 20000 });
    await delay(2000);
    // 진행중 행을 클릭
    const clickedPro = await studentPage.evaluate(() => {
      const rows = document.querySelectorAll("table tbody tr");
      for (const row of rows) {
        if (row.textContent.includes("진행중") && getComputedStyle(row).cursor === "pointer") {
          row.click();
          return true;
        }
      }
      return false;
    });
    if (clickedPro) {
      await delay(2500);
      const proUrl = studentPage.url();
      const proMatch = proUrl.match(/\/pro-mode\/chapter\/([^/?]+)/);
      ids.chapterId = proMatch ? proMatch[1] : null;
    }
    console.log(`  chapterId: ${ids.chapterId || "미수집"}`);

    // farmId: /farm-mode 에서 첫 농장 카드 링크의 전체 경로
    await studentPage.goto(`${BASE}/farm-mode`, { waitUntil: "networkidle2", timeout: 20000 });
    await delay(2000);
    ids.farmId = await studentPage.evaluate((base) => {
      const link = document.querySelector("a[href*='/farm-mode/']");
      if (link) {
        let href = link.getAttribute("href");
        // BASE 접두사 제거하여 /farm-mode/ 이후만 추출
        const idx = href.indexOf("/farm-mode/");
        if (idx >= 0) return href.substring(idx + "/farm-mode/".length);
      }
      return null;
    }, BASE);
    console.log(`  farmId: ${ids.farmId || "미수집"}`);

    // sessionId: /diagnostic/v2 에서 완료된 진단 세션
    await studentPage.goto(`${BASE}/diagnostic/v2`, { waitUntil: "networkidle2", timeout: 20000 });
    await delay(2000);
    ids.sessionId = await studentPage.evaluate(() => {
      // 링크에서 추출
      const links = document.querySelectorAll("a");
      for (const a of links) {
        const href = a.getAttribute("href") || "";
        const m = href.match(/\/diagnostic\/v2\/report\/([^/?]+)/);
        if (m) return m[1];
      }
      // 버튼 텍스트로 찾기 → 클릭 후 추출이 필요하므로 null 반환
      return null;
    });
    console.log(`  sessionId: ${ids.sessionId || "미수집"}`);

    // postId: /community 에서 첫 게시글 (게시글이 있는 게시판 탭 시도)
    await studentPage.goto(`${BASE}/community`, { waitUntil: "networkidle2", timeout: 20000 });
    await delay(2000);
    // "커뮤니티 게시판" 탭 클릭 (무료 게시판)
    await studentPage.evaluate(() => {
      const tabs = document.querySelectorAll("button, a, [role='tab']");
      for (const t of tabs) {
        if (t.textContent.includes("커뮤니티")) { t.click(); break; }
      }
    });
    await delay(1500);
    ids.postId = await studentPage.evaluate(() => {
      const rows = document.querySelectorAll("table tbody tr");
      for (const row of rows) {
        if (!row.querySelector(".comm-empty") && row.querySelector("td")) {
          // 행 클릭 시 게시글 상세로 이동
          const a = row.querySelector("a[href*='/community/post/']");
          if (a) {
            const m = a.getAttribute("href").match(/\/community\/post\/([^/?]+)/);
            return m ? m[1] : null;
          }
        }
      }
      return null;
    });
    console.log(`  postId: ${ids.postId || "미수집 (게시글 없음)"}`);

    // wisdomPostId: /writing/{levelId} 에서 첫 글
    await studentPage.goto(`${BASE}/writing/${ids.levelId}`, { waitUntil: "networkidle2", timeout: 20000 });
    await delay(2000);
    ids.wisdomPostId = await studentPage.evaluate(() => {
      const rows = document.querySelectorAll("table tbody tr");
      for (const row of rows) {
        const a = row.querySelector("a[href*='/writing/post/']");
        if (a) {
          const m = a.getAttribute("href").match(/\/writing\/post\/([^/?]+)/);
          return m ? m[1] : null;
        }
      }
      return null;
    });
    console.log(`  wisdomPostId: ${ids.wisdomPostId || "미수집 (글 없음)"}`);

    // learningId: /farm-mode/{farmId} 에서 첫 콘텐츠 행 클릭 → URL에서 추출
    if (ids.farmId) {
      await studentPage.goto(`${BASE}/farm-mode/${ids.farmId}`, { waitUntil: "networkidle2", timeout: 20000 });
      await delay(2000);
      const clickedLearning = await studentPage.evaluate(() => {
        const rows = document.querySelectorAll("table tbody tr");
        if (rows.length > 0 && !rows[0].querySelector("[colspan]")) {
          rows[0].click();
          return true;
        }
        return false;
      });
      if (clickedLearning) {
        await delay(2500);
        const learningUrl = studentPage.url();
        const learningMatch = learningUrl.match(/\/learning\/([^/?]+)/);
        ids.learningId = learningMatch ? learningMatch[1] : null;
      }
      console.log(`  learningId: ${ids.learningId || "미수집"}`);
    }
  } catch (err) {
    console.error(`  학생 ID 수집 실패: ${err.message.slice(0, 100)}`);
  }
  await studentPage.close();

  return ids;
}

// ─── 페이지 인터셉션 설정 ───

async function setupApiRedirect(page) {
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("localhost:8080")) {
      req.continue({ url: url.replace("http://localhost:8080", EC2_API) });
    } else if (url.includes("localhost:8081")) {
      req.continue({ url: url.replace("localhost:8081", "43.200.104.102:8081") });
    } else {
      req.continue();
    }
  });
}

// ─── 캡처 헬퍼 함수 ───

/** 기본 페이지 캡처 */
async function capturePage(page, p, label) {
  const filePath = path.join(SCREENSHOT_DIR, `${p.name}.png`);
  try {
    await page.goto(`${BASE}${p.path}`, { waitUntil: "networkidle2", timeout: 25000 });
    await delay(p.wait);
    await page.screenshot({ path: filePath, fullPage: true, type: "png" });
    console.log(`  [${label}] ${p.name} OK`);
    return true;
  } catch (err) {
    console.error(`  [${label}] ${p.name} 실패: ${err.message.slice(0, 100)}`);
    try { await page.screenshot({ path: filePath, type: "png" }); } catch {}
    return false;
  }
}

/** 텍스트로 버튼/탭 찾아 클릭 */
async function clickButtonByText(page, text) {
  const clicked = await page.evaluate((t) => {
    const elems = [...document.querySelectorAll("button, a, [role='tab'], [role='button'], .tab-item, .tab-btn")];
    for (const el of elems) {
      if (el.textContent.trim().includes(t) && el.offsetParent !== null) {
        el.click();
        return true;
      }
    }
    return false;
  }, text);
  if (clicked) await delay(1500);
  return clicked;
}

/** 탭 전환 */
async function clickTabByText(page, tabText) {
  return clickButtonByText(page, tabText);
}

/** 서브페이지 캡처 (탭 전환 포함) */
async function captureSubpage(page, config, label) {
  const filePath = path.join(SCREENSHOT_DIR, `${config.name}.png`);
  try {
    await page.goto(`${BASE}${config.path}`, { waitUntil: "networkidle2", timeout: 25000 });
    await delay(config.wait || 2000);

    if (config.tab) {
      await clickTabByText(page, config.tab);
      await delay(1000);
    }

    if (config.clickText) {
      await clickButtonByText(page, config.clickText);
      await delay(1000);
    }

    await page.screenshot({ path: filePath, fullPage: true, type: "png" });
    console.log(`  [${label}] ${config.name} OK`);
    return true;
  } catch (err) {
    console.error(`  [${label}] ${config.name} 실패: ${err.message.slice(0, 100)}`);
    try { await page.screenshot({ path: filePath, type: "png" }); } catch {}
    return false;
  }
}

/** 모달 캡처 (버튼 클릭 → 모달 대기 → 스크린샷) */
async function captureModal(page, config, label) {
  const filePath = path.join(SCREENSHOT_DIR, `${config.name}.png`);
  try {
    await page.goto(`${BASE}${config.basePath}`, { waitUntil: "networkidle2", timeout: 25000 });
    await delay(config.wait || 2000);

    // 탭 전환이 필요한 경우
    if (config.tab) {
      await clickTabByText(page, config.tab);
      await delay(1000);
    }

    // 모달 트리거 버튼 클릭
    let triggered = false;
    if (config.triggerSelector) {
      // 셀렉터로 클릭
      try {
        await page.waitForSelector(config.triggerSelector, { visible: true, timeout: 5000 });
        await page.click(config.triggerSelector);
        triggered = true;
      } catch {}
    }
    if (!triggered && config.triggerText) {
      triggered = await clickButtonByText(page, config.triggerText);
    }
    if (!triggered && config.triggerRowAction) {
      // 첫 행의 특정 버튼 클릭
      triggered = await page.evaluate((actionText) => {
        const rows = document.querySelectorAll("table tbody tr");
        if (rows.length > 0) {
          const btns = rows[0].querySelectorAll("button, a");
          for (const btn of btns) {
            if (btn.textContent.trim().includes(actionText)) {
              btn.click();
              return true;
            }
          }
        }
        return false;
      }, config.triggerRowAction);
      if (triggered) await delay(1500);
    }

    if (!triggered) {
      console.error(`  [${label}] ${config.name} 트리거 실패`);
      return false;
    }

    // 모달 대기
    try {
      await page.waitForSelector(
        ".admin-modal-overlay, .asp-modal-overlay, [class*='modal-overlay'], [class*='Modal']",
        { visible: true, timeout: 5000 }
      );
    } catch {
      // 모달이 나타나지 않아도 현재 화면 캡처
    }
    await delay(1000);

    await page.screenshot({ path: filePath, fullPage: true, type: "png" });
    console.log(`  [${label}] ${config.name} OK`);

    // 모달 닫기 (ESC 키)
    try { await page.keyboard.press("Escape"); } catch {}
    await delay(500);

    return true;
  } catch (err) {
    console.error(`  [${label}] ${config.name} 실패: ${err.message.slice(0, 100)}`);
    try { await page.screenshot({ path: filePath, type: "png" }); } catch {}
    return false;
  }
}

/** 첫 행 클릭 후 서브뷰 캡처 */
async function captureFirstRowClick(page, config, label) {
  const filePath = path.join(SCREENSHOT_DIR, `${config.name}.png`);
  try {
    await page.goto(`${BASE}${config.basePath}`, { waitUntil: "networkidle2", timeout: 25000 });
    await delay(config.wait || 2000);

    if (config.tab) {
      await clickTabByText(page, config.tab);
      await delay(1000);
    }

    // 첫 행 클릭
    const clicked = await page.evaluate(() => {
      const row = document.querySelector("table tbody tr");
      if (row) { row.click(); return true; }
      return false;
    });

    if (clicked) {
      await delay(2000);
      // 페이지 이동이 발생했는지 확인
      await page.waitForNetworkIdle({ idleTime: 500, timeout: 5000 }).catch(() => {});
    }

    await page.screenshot({ path: filePath, fullPage: true, type: "png" });
    console.log(`  [${label}] ${config.name} OK`);
    return true;
  } catch (err) {
    console.error(`  [${label}] ${config.name} 실패: ${err.message.slice(0, 100)}`);
    try { await page.screenshot({ path: filePath, type: "png" }); } catch {}
    return false;
  }
}

// ─── Phase C: 전체 캡처 ───

async function captureWithSession(browser, token, pages, label) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await setupApiRedirect(page);
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 15000 });
  await page.evaluate((t) => sessionStorage.setItem("korfarm_token", t), token);
  await delay(500);

  let ok = 0;
  for (const p of pages) {
    if (await capturePage(page, p, label)) ok++;
  }
  await page.close();
  return ok;
}

async function captureAdminSubpages(browser, token, ids) {
  console.log("\n[관리자 서브페이지/모달]");
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await setupApiRedirect(page);
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 15000 });
  await page.evaluate((t) => sessionStorage.setItem("korfarm_token", t), token);
  await delay(500);

  let ok = 0;

  // ── 서브페이지 ──

  // 학생 상세 (기본정보 탭)
  if (ids.studentUserId) {
    if (await captureSubpage(page, {
      name: "admin-student-detail",
      path: `/admin/students/${ids.studentUserId}`,
      wait: 2500,
    }, "관리자")) ok++;

    // 학생 상세 - 테스트성적 탭
    if (await captureSubpage(page, {
      name: "admin-student-detail-tests",
      path: `/admin/students/${ids.studentUserId}`,
      wait: 2500,
      tab: "테스트 성적",
    }, "관리자")) ok++;
  }

  // 콘텐츠 업로드
  if (await captureSubpage(page, {
    name: "admin-content-upload",
    path: "/admin/content/upload",
    wait: 2000,
  }, "관리자")) ok++;

  // 콘텐츠 비주얼 에디터
  if (ids.contentId) {
    if (await captureSubpage(page, {
      name: "admin-content-editor",
      path: `/admin/content/edit?id=${ids.contentId}`,
      wait: 2500,
    }, "관리자")) ok++;
  }

  // 시험 상세 (기본정보 탭)
  if (ids.testId) {
    if (await captureSubpage(page, {
      name: "admin-test-detail",
      path: `/admin/tests/${ids.testId}`,
      wait: 2500,
    }, "관리자")) ok++;

    // 시험 상세 - 문항관리 탭
    if (await captureSubpage(page, {
      name: "admin-test-detail-questions",
      path: `/admin/tests/${ids.testId}`,
      wait: 2500,
      tab: "문항 관리",
    }, "관리자")) ok++;

    // 시험 상세 - OMR 탭
    if (await captureSubpage(page, {
      name: "admin-test-detail-omr",
      path: `/admin/tests/${ids.testId}`,
      wait: 2500,
      tab: "답안 입력",
    }, "관리자")) ok++;
  }

  // 학습계획표 상세
  if (ids.planId) {
    if (await captureSubpage(page, {
      name: "admin-study-plan-detail",
      path: `/admin/study-plans/${ids.planId}`,
      wait: 2500,
    }, "관리자")) ok++;
  }

  // 문의 상세 (첫 행 클릭)
  if (await captureFirstRowClick(page, {
    name: "admin-inquiry-detail",
    basePath: "/admin/inquiry",
    wait: 2000,
  }, "관리자")) ok++;

  // 프로 모드 챕터 상세 (첫 행 클릭)
  if (await captureFirstRowClick(page, {
    name: "admin-pro-chapter",
    basePath: "/admin/pro",
    wait: 2000,
  }, "관리자")) ok++;

  // ── 모달 ──

  // 신규 기관 등록 모달
  if (await captureModal(page, {
    name: "admin-org-create-modal",
    basePath: "/admin/orgs",
    wait: 2000,
    triggerText: "신규 기관 등록",
  }, "관리자")) ok++;

  // 기관 수정 모달 (첫 행 "수정" 버튼)
  if (await captureModal(page, {
    name: "admin-org-edit-modal",
    basePath: "/admin/orgs",
    wait: 2000,
    triggerRowAction: "수정",
  }, "관리자")) ok++;

  // 반 생성 모달
  if (await captureModal(page, {
    name: "admin-class-create-modal",
    basePath: "/admin/classes",
    wait: 2000,
    triggerText: "반 생성",
  }, "관리자")) ok++;

  // 학생 수정 모달 (첫 행 "수정" 버튼)
  if (await captureModal(page, {
    name: "admin-student-edit-modal",
    basePath: "/admin/students",
    wait: 2000,
    triggerRowAction: "수정",
  }, "관리자")) ok++;

  // 인벤토리 모달 (첫 행 "인벤토리" 버튼)
  if (await captureModal(page, {
    name: "admin-student-inventory-modal",
    basePath: "/admin/students",
    wait: 2000,
    triggerRowAction: "인벤토리",
  }, "관리자")) ok++;

  // 과제 생성 모달
  if (await captureModal(page, {
    name: "admin-assignment-create-modal",
    basePath: "/admin/assignments",
    wait: 2000,
    triggerText: "과제 생성",
  }, "관리자")) ok++;

  // 피드백 작성 모달
  if (await captureModal(page, {
    name: "admin-feedback-modal",
    basePath: "/admin/assignments",
    wait: 2000,
    tab: "피드백",
    triggerRowAction: "피드백 작성",
  }, "관리자")) ok++;

  // 상품 등록 모달
  if (await captureModal(page, {
    name: "admin-product-create-modal",
    basePath: "/admin/shop",
    wait: 2000,
    triggerText: "상품 등록",
  }, "관리자")) ok++;

  await page.close();
  return ok;
}

async function captureStudentSubpages(browser, token, ids) {
  console.log("\n[학생 서브페이지]");
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await setupApiRedirect(page);
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 15000 });
  await page.evaluate((t) => sessionStorage.setItem("korfarm_token", t), token);
  await delay(500);

  let ok = 0;
  const subpages = [];

  // 대결 로비
  subpages.push({ name: "student-duel-lobby", path: "/duel/lobby/russell", wait: 2000 });

  // 농장 콘텐츠 목록
  if (ids.farmId) {
    subpages.push({ name: "student-farm-list", path: `/farm-mode/${ids.farmId}`, wait: 2000 });
  }

  // 학습 엔진
  if (ids.learningId) {
    subpages.push({ name: "student-learning-engine", path: `/learning/${ids.learningId}`, wait: 3000 });
  }

  // 프로 챕터 학습
  if (ids.chapterId) {
    subpages.push({ name: "student-pro-chapter", path: `/pro-mode/chapter/${ids.chapterId}`, wait: 2000 });
    subpages.push({ name: "student-pro-test", path: `/pro-mode/chapter/${ids.chapterId}/test`, wait: 2000 });
    subpages.push({ name: "student-pro-answer-key", path: `/pro-mode/chapter/${ids.chapterId}/answer-key`, wait: 2000 });
  }

  // 시험 관련
  if (ids.testId) {
    subpages.push({ name: "student-test-detail", path: `/tests/${ids.testId}`, wait: 2500 });
    subpages.push({ name: "student-test-report", path: `/tests/${ids.testId}/report`, wait: 2500 });
    subpages.push({ name: "student-test-wrong-note", path: `/tests/${ids.testId}/wrong-note`, wait: 2500 });
  }

  // 지혜 게시판
  if (ids.levelId) {
    subpages.push({ name: "student-wisdom-board", path: `/writing/${ids.levelId}`, wait: 2000 });
    subpages.push({ name: "student-wisdom-write", path: `/writing/${ids.levelId}/new`, wait: 2000 });
  }

  // 글 상세
  if (ids.wisdomPostId) {
    subpages.push({ name: "student-wisdom-post", path: `/writing/post/${ids.wisdomPostId}`, wait: 2000 });
  }

  // 진단 리포트
  if (ids.sessionId) {
    subpages.push({ name: "student-diagnostic-report", path: `/diagnostic/v2/report/${ids.sessionId}`, wait: 3000 });
  }

  // 커뮤니티 게시물 상세
  if (ids.postId) {
    subpages.push({ name: "student-community-post", path: `/community/post/${ids.postId}`, wait: 2000 });
  }

  for (const p of subpages) {
    if (await capturePage(page, p, "학생")) ok++;
  }

  await page.close();
  return ok;
}

async function captureParentSubpages(browser, token, ids) {
  console.log("\n[학부모 서브페이지]");
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await setupApiRedirect(page);
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 15000 });
  await page.evaluate((t) => sessionStorage.setItem("korfarm_token", t), token);
  await delay(500);

  let ok = 0;
  const subpages = [];
  const sid = ids.parentStudentId;

  if (sid) {
    subpages.push({ name: "parent-tests", path: `/tests?studentId=${sid}`, wait: 2000 });

    if (ids.testId) {
      subpages.push({ name: "parent-test-report", path: `/tests/${ids.testId}/report?studentId=${sid}`, wait: 2500 });
    }

    subpages.push({ name: "parent-harvest-ledger", path: `/harvest-ledger?studentId=${sid}`, wait: 2000 });
    subpages.push({ name: "parent-diagnostic", path: `/diagnostic/v2?studentId=${sid}`, wait: 2000 });

    if (ids.sessionId) {
      subpages.push({ name: "parent-diagnostic-report", path: `/diagnostic/v2/report/${ids.sessionId}?studentId=${sid}`, wait: 3000 });
    }

    subpages.push({ name: "parent-report", path: `/report?studentId=${sid}`, wait: 2500 });
    subpages.push({ name: "parent-study-plan", path: `/parents/children/${sid}/study-plan`, wait: 2000 });
  }

  for (const p of subpages) {
    if (await capturePage(page, p, "학부모")) ok++;
  }

  await page.close();
  return ok;
}

// ─── Phase D: 더미 데이터 정리 ───

async function cleanupDummyData(adminToken, ids) {
  console.log("\n[Phase D] 더미 데이터 정리...");
  try {
    if (ids.testId && !ids.testIsExisting) {
      await apiCall("DELETE", `/v1/admin/test-papers/${ids.testId}`, adminToken);
      console.log(`  시험 삭제 OK: ${ids.testId}`);
    } else if (ids.testIsExisting) {
      console.log(`  기존 시험 유지: ${ids.testId}`);
    }
    if (ids.planId) {
      await apiCall("DELETE", `/v1/admin/study-plans/${ids.planId}`, adminToken);
      console.log(`  학습계획표 삭제 OK: ${ids.planId}`);
    }
  } catch (err) {
    console.error(`  정리 실패: ${err.message}`);
  }
}

// ─── 메인 실행 ───

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  console.log("═══════════════════════════════════════");
  console.log("  국어농장 매뉴얼 스크린샷 전수 캡처");
  console.log("═══════════════════════════════════════\n");

  // 토큰 획득
  console.log("[로그인]");
  const tokens = {};
  const userInfo = {};

  const adminLogin = await loginAndGetUser(ACCOUNTS.admin);
  tokens.admin = adminLogin.token;
  userInfo.admin = adminLogin.user;
  console.log(`  관리자: ${tokens.admin ? "OK" : "실패"}`);

  const studentLogin = await loginAndGetUser(ACCOUNTS.student);
  tokens.student = studentLogin.token;
  userInfo.student = studentLogin.user;
  console.log(`  학생: ${tokens.student ? "OK" : "실패"} (${userInfo.student?.id || "?"})`);

  const parentLogin = await loginAndGetUser(ACCOUNTS.parent);
  tokens.parent = parentLogin.token;
  userInfo.parent = parentLogin.user;
  console.log(`  학부모: ${tokens.parent ? "OK" : "실패"}`);

  if (!tokens.admin) {
    console.error("관리자 로그인 실패 — 중단");
    process.exit(1);
  }

  // Phase A: 더미 데이터 생성
  const studentUserId = userInfo.student?.id || "u_paid_student";
  const dummyIds = await setupDummyData(tokens.admin, studentUserId);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let total = 0;

  try {
    // Phase B: 동적 ID 수집
    const allIds = await collectDynamicIds(browser, tokens, dummyIds, userInfo);
    console.log("\n[수집된 ID 요약]");
    for (const [k, v] of Object.entries(allIds)) {
      if (v) console.log(`  ${k}: ${v}`);
    }

    // Phase C: 캡처
    console.log("\n[Phase C] 스크린샷 캡처 시작...");

    // 공개 페이지
    console.log("\n[공개 페이지]");
    const pubPage = await browser.newPage();
    await pubPage.setViewport({ width: 1440, height: 900 });
    for (const p of PUBLIC_PAGES) {
      if (await capturePage(pubPage, p, "공개")) total++;
    }
    await pubPage.close();

    // 관리자 기본 페이지
    console.log("\n[관리자 기본 페이지]");
    if (tokens.admin) {
      total += await captureWithSession(browser, tokens.admin, ADMIN_PAGES, "관리자");
    }

    // 관리자 서브페이지/모달
    if (tokens.admin) {
      total += await captureAdminSubpages(browser, tokens.admin, allIds);
    }

    // 학생 기본 페이지
    console.log("\n[학생 기본 페이지]");
    if (tokens.student) {
      total += await captureWithSession(browser, tokens.student, STUDENT_PAGES, "학생");
    }

    // 학생 서브페이지
    if (tokens.student) {
      total += await captureStudentSubpages(browser, tokens.student, allIds);
    }

    // 학부모 기본 페이지
    console.log("\n[학부모 기본 페이지]");
    if (tokens.parent) {
      total += await captureWithSession(browser, tokens.parent, PARENT_PAGES, "학부모");
    }

    // 학부모 서브페이지
    if (tokens.parent) {
      total += await captureParentSubpages(browser, tokens.parent, allIds);
    }
  } finally {
    await browser.close();
  }

  // Phase D: 더미 데이터 정리
  await cleanupDummyData(tokens.admin, dummyIds);

  console.log("\n═══════════════════════════════════════");
  console.log(`  완료! 총 ${total}개 스크린샷 → ${SCREENSHOT_DIR}`);
  console.log("═══════════════════════════════════════");
}

main().catch((err) => {
  console.error("치명적 오류:", err);
  process.exit(1);
});
