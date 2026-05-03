#!/usr/bin/env node
/**
 * 일일퀴즈 10번 문제 backfill 스크립트.
 *
 * 데이터 소스: ../국어농장v2_q10_codex/drafts/dayN/dq-{LEVEL}-{day}.json
 * 페어 매핑: 6 standard level → 12 levels (fallback 도 같은 데이터)
 *   SAUSSURE_1 = SAUSSURE_2
 *   SAUSSURE_3 = FREGE_1
 *   FREGE_2    = FREGE_3
 *   RUSSELL_1  = RUSSELL_2
 *   RUSSELL_3  = WITTGENSTEIN_1
 *   WITTGENSTEIN_2 = WITTGENSTEIN_3
 *
 * 사용법:
 *   export KORFARM_API=https://gf2.hak1ad.kr
 *   export KORFARM_ADMIN_TOKEN=<sessionStorage 의 korfarm_token>
 *   node scripts/seed-q10.js                  # 본 실행 (4140 호출)
 *   node scripts/seed-q10.js --dry-run        # 변환만 출력 (API 호출 X)
 *   node scripts/seed-q10.js --start 100      # 인덱스 100 부터
 *   node scripts/seed-q10.js --limit 5        # 5건만
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const API_BASE = process.env.KORFARM_API || "https://gf2.hak1ad.kr";
// 1) KORFARM_ADMIN_TOKEN 직접 사용 또는 2) KORFARM_JWT_SECRET 으로 즉석 발급
const JWT_SECRET = process.env.KORFARM_JWT_SECRET;
const JWT_ISSUER = process.env.KORFARM_JWT_ISSUER || "korfarm";
const TOKEN = process.env.KORFARM_ADMIN_TOKEN || (JWT_SECRET ? mintAdminToken(JWT_SECRET) : null);

function base64url(buf) {
  return Buffer.from(buf).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function mintAdminToken(secret) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const subject = process.env.KORFARM_ADMIN_USER_ID || "u_hq_admin";
  const payload = {
    iss: JWT_ISSUER,
    sub: subject,
    roles: ["HQ_ADMIN"],
    iat: now,
    exp: now + 3600, // 1시간
  };
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(`${h}.${p}`).digest();
  return `${h}.${p}.${base64url(sig)}`;
}

const DRAFTS_DIR = path.resolve(
  __dirname,
  "..",
  "..",
  "국어농장v2_q10_codex",
  "drafts",
);

const PAIRS = [
  ["SAUSSURE_1", "SAUSSURE_2"],
  ["SAUSSURE_3", "FREGE_1"],
  ["FREGE_2", "FREGE_3"],
  ["RUSSELL_1", "RUSSELL_2"],
  ["RUSSELL_3", "WITTGENSTEIN_1"],
  ["WITTGENSTEIN_2", "WITTGENSTEIN_3"],
];

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    start: parseInt(getOpt(args, "--start") || "0", 10),
    limit: parseInt(getOpt(args, "--limit") || "0", 10),
    onlyFailures: args.includes("--only-failures"),
  };
}
function getOpt(args, name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}

/** codex JSON → DB Q10 형식으로 변환 */
function transform(codex, contentId) {
  const expectedQId = `${contentId}-10`;
  return {
    id: expectedQId,
    type: "CHOICE_COMPLEX_OX",
    questionKind: "CHOICE_ANALYSIS",
    competency: codex.competencyKeyword || "",
    stem: codex.stem,
    passage: codex.passage,
    choices: (codex.choices || []).map((c) => ({
      choiceId: c.choiceId,
      text: c.text,
      ...(c.wrongVector ? { wrongVector: c.wrongVector } : {}),
      propositions: c.propositions || [],
    })),
    explanation: codex.explanation || "",
    competencyVector: codex.competencyVector || {},
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40 },
  };
}

/** drafts/dayN/ 파일들을 평탄화 — { contentId, q10 } 배열 */
function buildJobs() {
  if (!fs.existsSync(DRAFTS_DIR)) {
    throw new Error(`drafts 폴더 없음: ${DRAFTS_DIR}`);
  }
  const dayDirs = fs.readdirSync(DRAFTS_DIR)
    .filter((d) => /^day\d{3}$/.test(d))
    .sort();
  const jobs = [];
  // contentId 의 day 부분 패딩 규칙 — WITTGENSTEIN 만 0 padding 없이, 다른 레벨은 3자리
  const dayPart = (level, dayNum) =>
    level.startsWith("WITTGENSTEIN") ? String(dayNum) : String(dayNum).padStart(3, "0");

  for (const dayDir of dayDirs) {
    const dayNum = parseInt(dayDir.slice(3), 10);
    const dirPath = path.join(DRAFTS_DIR, dayDir);
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const m = file.match(/^dq-([A-Z_0-9]+)-(\d+)\.json$/);
      if (!m) {
        console.warn(`  파일명 패턴 불일치 — 스킵: ${file}`);
        continue;
      }
      const standardLevel = m[1];
      const filePath = path.join(dirPath, file);
      const codex = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // standard contentId (level 별 패딩 규칙 적용)
      const standardContentId = `dq-${standardLevel}-${dayPart(standardLevel, dayNum)}`;
      const standardQ10 = transform(codex, standardContentId);
      jobs.push({ contentId: standardContentId, q10: standardQ10, source: file });

      // fallback level (페어)
      const pair = PAIRS.find((p) => p[0] === standardLevel || p[1] === standardLevel);
      if (pair) {
        const fallbackLevel = pair[0] === standardLevel ? pair[1] : pair[0];
        const fallbackContentId = `dq-${fallbackLevel}-${dayPart(fallbackLevel, dayNum)}`;
        const fallbackQ10 = transform(codex, fallbackContentId);
        jobs.push({ contentId: fallbackContentId, q10: fallbackQ10, source: file + " (페어)" });
      }
    }
  }
  return jobs;
}

async function callApi(contentId, q10) {
  const res = await fetch(`${API_BASE}/v1/admin/dailyquiz/q10-backfill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ contentId, q10 }),
  });
  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }
  return JSON.parse(txt);
}

async function main() {
  const { dryRun, start, limit, onlyFailures } = parseArgs();
  if (!dryRun && !TOKEN) {
    console.error("KORFARM_ADMIN_TOKEN 또는 KORFARM_JWT_SECRET 환경변수 중 하나가 필요합니다.");
    process.exit(1);
  }

  console.log("[seed-q10] drafts 폴더 스캔 중...");
  let jobs = buildJobs();
  console.log(`[seed-q10] 총 ${jobs.length} jobs 준비 완료`);

  if (onlyFailures) {
    const logPath = path.join(__dirname, "seed-q10-failures.log");
    if (!fs.existsSync(logPath)) {
      console.error(`failures.log 가 없습니다: ${logPath}`);
      process.exit(1);
    }
    const failed = JSON.parse(fs.readFileSync(logPath, "utf8"));
    // 옛 스크립트는 WITTGENSTEIN 도 3자리 padding 으로 contentId 만들었음 → 새 형식(padding 없음)으로 정규화
    const normalize = (cid) => {
      const m = cid.match(/^(dq-WITTGENSTEIN_[123])-0*(\d+)$/);
      return m ? `${m[1]}-${m[2]}` : cid;
    };
    const failSet = new Set(failed.map((f) => normalize(f.contentId)));
    const before = jobs.length;
    jobs = jobs.filter((j) => failSet.has(j.contentId));
    console.log(`[seed-q10] --only-failures: ${before} → ${jobs.length} (failures.log ${failed.length}건 중 매칭)`);
  }

  const slice = jobs.slice(start, limit > 0 ? start + limit : undefined);
  console.log(`[seed-q10] 처리 범위: ${start} ~ ${start + slice.length - 1}`);

  if (dryRun) {
    console.log("\n=== DRY RUN — 처음 3건 변환 결과 ===");
    slice.slice(0, 3).forEach((job, i) => {
      console.log(`\n[${i}] ${job.contentId} (from ${job.source})`);
      console.log(JSON.stringify(job.q10, null, 2).slice(0, 800) + "...");
    });
    console.log(`\n[seed-q10] dry-run 완료. 본 실행: API ${slice.length} 호출 예정`);
    return;
  }

  let ok = 0, fail = 0;
  const failures = [];
  const t0 = Date.now();
  for (let i = 0; i < slice.length; i++) {
    const job = slice[i];
    try {
      const res = await callApi(job.contentId, job.q10);
      ok++;
      if ((i + 1) % 50 === 0 || i === slice.length - 1) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`  [${i + 1}/${slice.length}] OK=${ok} FAIL=${fail} (${elapsed}s)`);
      }
    } catch (e) {
      fail++;
      failures.push({ contentId: job.contentId, source: job.source, error: e.message });
      console.error(`  [${i + 1}/${slice.length}] ❌ ${job.contentId}: ${e.message}`);
    }
  }
  console.log(`\n[seed-q10] 완료. OK=${ok} FAIL=${fail} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  if (failures.length > 0) {
    const logPath = path.join(__dirname, "seed-q10-failures.log");
    fs.writeFileSync(logPath, JSON.stringify(failures, null, 2));
    console.log(`실패 로그: ${logPath}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
