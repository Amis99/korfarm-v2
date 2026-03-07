/**
 * 프로 모드 독해 학습 콘텐츠 전수 점검 스크립트
 *
 * 점검1: 원고 지문 일치 확인 (passage vs 문학_작품_지문/비문학_지문)
 * 점검2: 전체 문장 하이라이트 커버리지 (모든 paragraph가 intensive에서 커버되는지)
 * 점검3: 원문 그대로 고르기 문제 탐지 (정답 선택지가 원문 문장과 동일/유사한지)
 */

import fs from "fs";
import path from "path";

const BASE = path.resolve(".");
const CONTENT_DIR = path.join(BASE, "프로모드 콘텐츠");
const MANUSCRIPT_DIR = path.join(BASE, "프로모드 원고");

// ── 레벨 설정 ──
const LEVELS = [
  "소쉬르1", "소쉬르2", "소쉬르3",
  "프레게1", "프레게2", "프레게3",
  "러셀1",
];

// ── 유틸 ──

/** BOM 제거 후 JSON 파싱 */
function safeJsonParse(filePath) {
  let text = fs.readFileSync(filePath, "utf-8");
  // BOM 제거
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  return JSON.parse(text);
}

/** 공백/줄바꿈 정규화: 연속 공백 → 단일 공백, 연속 줄바꿈 → 단일 줄바꿈, 앞뒤 trim */
function normalize(str) {
  return str
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n+/g, "\n")  // 연속 줄바꿈 → 단일 줄바꿈 (빈 줄 제거)
    .trim();
}

/** 콘텐츠 파일에서 챕터 번호와 유형 추출 */
function parseContentFilename(filename) {
  // ch05_reading_literature.json → { ch: 5, type: "literature" }
  const m = filename.match(/^ch(\d+)_reading_(literature|nonfiction)\.json$/);
  if (!m) return null;
  return { ch: parseInt(m[1], 10), type: m[2] };
}

/** 원고 JSON 파일 경로 반환 */
function getManuscriptPath(level, ch) {
  // 프레게2는 공백 없는 파일명: 프레게2(챕터1).json
  if (level === "프레게2") {
    return path.join(MANUSCRIPT_DIR, level, `${level}(챕터${ch}).json`);
  }
  // 나머지: 소쉬르1 (챕터1).json
  return path.join(MANUSCRIPT_DIR, level, `${level} (챕터${ch}).json`);
}

/** 원고에서 지문 추출 */
function getManuscriptPassage(manuscript, type) {
  if (type === "literature") {
    return manuscript?.["문학"]?.["문학_작품_지문"] ?? null;
  }
  return manuscript?.["비문학"]?.["비문학_지문"] ?? null;
}

/** 두 문자열의 diff 위치 반환 (처음 다른 지점 + 주변 문맥) */
function findDiffLocation(a, b) {
  const maxLen = Math.max(a.length, b.length);
  let diffStart = -1;
  for (let i = 0; i < maxLen; i++) {
    if (a[i] !== b[i]) { diffStart = i; break; }
  }
  if (diffStart === -1) return null;

  const ctxStart = Math.max(0, diffStart - 20);
  const ctxEnd = Math.min(maxLen, diffStart + 40);
  return {
    position: diffStart,
    contentSnippet: `...${a.slice(ctxStart, ctxEnd)}...`,
    manuscriptSnippet: `...${b.slice(ctxStart, ctxEnd)}...`,
  };
}

// ── 점검 함수 ──

/** 따옴표 정규화: 유니코드 따옴표 → ASCII 따옴표 */
function normalizeQuotes(str) {
  return str
    .replace(/[\u2018\u2019\u201A\u2039\u203A]/g, "'")  // 유니코드 작은따옴표 → '
    .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"');  // 유니코드 큰따옴표 → "
}

/** 원고 마크업 제거: <u>, </u>, ㉠~㉩, [앞부분 줄거리]..., ###, 이스케이프 문자 */
function stripManuscriptMarkup(str) {
  return str
    .replace(/<\/?u>/g, "")                      // <u> </u> 제거
    .replace(/[㉠-㉩]/g, "")                      // 원문 번호 마커 제거
    .replace(/\[앞부분 줄거리\][^.]*\.\s*/g, "")  // [앞부분 줄거리] 문장 제거
    .replace(/^###\s*/gm, "")                     // ### 헤딩 마크다운 제거
    .replace(/^#\s*/gm, "")                       // # 헤딩 마크다운 제거
    .replace(/^\*\s*읽기 전에[^!]*!\s*/gm, "")    // * 읽기 전에... 제거
    .replace(/\\\!/g, "!")                         // \! → !
    .replace(/\\~/g, "~")                          // \~ → ~
    .replace(/\\-/g, "-")                          // \- → -
    .replace(/\\</g, "<")                          // \< → <
    .replace(/\\>/g, ">")                          // \> → >
    .replace(/---\s*$/gm, "")                      // --- 구분선 제거
    .replace(/### \[상황 설정\][^\n]*\n?/g, "")    // ### [상황 설정] 라인 제거
    .replace(/\\n/g, "\n");                        // 리터럴 \n → 실제 줄바꿈
}

/** 줄바꿈 무시 정규화: 모든 줄바꿈/공백을 단일 공백으로 치환 → 순수 텍스트 비교용 */
function flatNormalize(str) {
  return normalizeQuotes(stripManuscriptMarkup(str)).replace(/\r\n/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}

/** 점검1: 원고 지문 일치 */
function checkPassageMatch(content, manuscript, type) {
  const paragraphs = content?.payload?.passage?.paragraphs;
  if (!paragraphs || !Array.isArray(paragraphs)) {
    return { pass: false, error: "콘텐츠에 passage.paragraphs 없음" };
  }

  // 줄바꿈 보존 비교 (원본)
  const contentText = normalize(paragraphs.map(p => p.text).join("\n"));
  const msText = getManuscriptPassage(manuscript, type);
  if (!msText) {
    return { pass: false, error: `원고에 ${type === "literature" ? "문학_작품_지문" : "비문학_지문"} 없음` };
  }

  const normalizedMs = normalize(msText);
  if (contentText === normalizedMs) {
    return { pass: true };
  }

  // 줄바꿈 무시 비교 (순수 텍스트)
  const contentFlat = flatNormalize(paragraphs.map(p => p.text).join(" "));
  const msFlat = flatNormalize(msText);
  if (contentFlat === msFlat) {
    return { pass: true, note: "줄바꿈 차이만 있음 (텍스트 동일)" };
  }

  const diff = findDiffLocation(contentFlat, msFlat);
  return {
    pass: false,
    error: "지문 불일치",
    diff,
    contentLength: contentFlat.length,
    manuscriptLength: msFlat.length,
  };
}

/** 점검2: 하이라이트 커버리지 */
function checkHighlightCoverage(content) {
  const paragraphs = content?.payload?.passage?.paragraphs;
  const timeline = content?.payload?.intensive?.timeline;
  if (!paragraphs || !timeline) {
    return { pass: false, error: "passage 또는 intensive.timeline 없음" };
  }

  const allParaIds = new Set(paragraphs.map(p => p.id));
  const highlightedParaIds = new Set();

  for (const step of timeline) {
    const ranges = step?.highlight?.ranges;
    if (ranges) {
      for (const r of ranges) {
        highlightedParaIds.add(r.paragraphId);
      }
    }
  }

  const uncoveredIds = [...allParaIds].filter(id => !highlightedParaIds.has(id));
  if (uncoveredIds.length === 0) {
    return { pass: true };
  }

  return {
    pass: false,
    error: "미커버 paragraph 발견",
    uncoveredIds,
    totalParagraphs: allParaIds.size,
    coveredParagraphs: highlightedParaIds.size,
  };
}

/** 점검3: 정답 선택지 원문 일치 검사 */
function checkAnswerVerbatim(content) {
  const paragraphs = content?.payload?.passage?.paragraphs;
  const timeline = content?.payload?.intensive?.timeline;
  if (!paragraphs || !timeline) {
    return { pass: true, violations: [] };
  }

  const paraTexts = paragraphs.map(p => normalize(p.text));
  const violations = [];

  for (const step of timeline) {
    const q = step?.question;
    if (!q || !q.choices || !q.answerId) continue;

    const answerChoice = q.choices.find(c => c.id === q.answerId);
    if (!answerChoice) continue;

    const answerText = normalize(answerChoice.text);
    if (answerText.length < 5) continue; // 너무 짧은 선택지는 제외 (단어 수준)

    for (const paraText of paraTexts) {
      // 완전 일치
      if (answerText === paraText) {
        violations.push({
          stepId: step.stepId,
          severity: "완전일치",
          answerText: answerChoice.text,
          matchedParagraph: paraText.slice(0, 60) + "...",
        });
        break;
      }

      // 고비율 포함: 선택지 텍스트가 원문에 80% 이상 포함
      if (answerText.length >= 10) {
        // 선택지가 원문의 부분문자열인지
        if (paraText.includes(answerText)) {
          const ratio = answerText.length / paraText.length;
          if (ratio >= 0.8) {
            violations.push({
              stepId: step.stepId,
              severity: "고비율포함",
              ratio: Math.round(ratio * 100) + "%",
              answerText: answerChoice.text,
              matchedParagraph: paraText.slice(0, 60) + "...",
            });
            break;
          }
        }
        // 원문이 선택지의 부분문자열인지 (원문 문장이 선택지에 그대로)
        if (answerText.includes(paraText)) {
          const ratio = paraText.length / answerText.length;
          if (ratio >= 0.8) {
            violations.push({
              stepId: step.stepId,
              severity: "고비율포함",
              ratio: Math.round(ratio * 100) + "%",
              answerText: answerChoice.text,
              matchedParagraph: paraText.slice(0, 60) + "...",
            });
            break;
          }
        }
      }
    }
  }

  return {
    pass: violations.length === 0,
    violations,
  };
}

// ── 메인 ──

function main() {
  const report = {
    summary: { total: 0, check1_fail: 0, check2_fail: 0, check3_fail: 0 },
    details: [],
  };

  for (const level of LEVELS) {
    const contentDir = path.join(CONTENT_DIR, level);
    if (!fs.existsSync(contentDir)) {
      console.log(`[건너뜀] 콘텐츠 폴더 없음: ${level}`);
      continue;
    }

    const files = fs.readdirSync(contentDir).filter(f => f.includes("reading") && f.endsWith(".json"));

    for (const file of files) {
      const parsed = parseContentFilename(file);
      if (!parsed) continue;

      report.summary.total++;
      const contentPath = path.join(contentDir, file);
      const content = safeJsonParse(contentPath);

      const entry = {
        level,
        file,
        chapter: parsed.ch,
        type: parsed.type,
        check1: null,
        check2: null,
        check3: null,
      };

      // 원고 파일 찾기
      const msPath = getManuscriptPath(level, parsed.ch);
      let manuscript = null;
      if (fs.existsSync(msPath)) {
        manuscript = safeJsonParse(msPath);
      }

      // 점검1: 원고 지문 일치
      if (manuscript) {
        entry.check1 = checkPassageMatch(content, manuscript, parsed.type);
      } else {
        entry.check1 = { pass: false, error: `원고 파일 없음: ${msPath}` };
      }
      if (!entry.check1.pass) report.summary.check1_fail++;

      // 점검2: 하이라이트 커버리지
      entry.check2 = checkHighlightCoverage(content);
      if (!entry.check2.pass) report.summary.check2_fail++;

      // 점검3: 정답 선택지 원문 일치
      entry.check3 = checkAnswerVerbatim(content);
      if (!entry.check3.pass) report.summary.check3_fail++;

      // 실패 항목만 상세 기록
      if (!entry.check1.pass || !entry.check2.pass || !entry.check3.pass) {
        report.details.push(entry);
      }
    }
  }

  // ── 결과 출력 ──
  console.log("\n" + "=".repeat(70));
  console.log("  프로 모드 독해 콘텐츠 전수 점검 결과");
  console.log("=".repeat(70));
  console.log(`  총 점검 파일: ${report.summary.total}개`);
  console.log(`  점검1 (지문 일치) 실패: ${report.summary.check1_fail}건`);
  console.log(`  점검2 (하이라이트 커버리지) 실패: ${report.summary.check2_fail}건`);
  console.log(`  점검3 (원문 일치 선택지) 실패: ${report.summary.check3_fail}건`);
  console.log(`  위반 파일 수: ${report.details.length}개`);
  console.log("=".repeat(70));

  if (report.details.length > 0) {
    console.log("\n── 위반 상세 ──\n");
    for (const d of report.details) {
      console.log(`▶ ${d.level}/${d.file} (챕터${d.chapter}, ${d.type})`);

      if (!d.check1.pass) {
        console.log(`  [점검1 실패] ${d.check1.error}`);
        if (d.check1.diff) {
          console.log(`    위치: ${d.check1.diff.position}번째 문자`);
          console.log(`    콘텐츠: ${d.check1.diff.contentSnippet}`);
          console.log(`    원고:   ${d.check1.diff.manuscriptSnippet}`);
        }
        if (d.check1.contentLength !== undefined) {
          console.log(`    콘텐츠 길이: ${d.check1.contentLength}, 원고 길이: ${d.check1.manuscriptLength}`);
        }
      }

      if (!d.check2.pass) {
        console.log(`  [점검2 실패] ${d.check2.error}`);
        if (d.check2.uncoveredIds) {
          console.log(`    미커버: ${d.check2.uncoveredIds.join(", ")} (${d.check2.coveredParagraphs}/${d.check2.totalParagraphs} 커버)`);
        }
      }

      if (!d.check3.pass) {
        console.log(`  [점검3 실패] 원문 일치 선택지 ${d.check3.violations.length}건`);
        for (const v of d.check3.violations) {
          console.log(`    ${v.stepId}: [${v.severity}${v.ratio ? " " + v.ratio : ""}] "${v.answerText}"`);
        }
      }

      console.log();
    }
  } else {
    console.log("\n모든 점검 통과!\n");
  }

  // JSON 리포트 저장
  const reportPath = path.join(BASE, "scripts", "verify_pro_reading_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`상세 리포트 저장: ${reportPath}`);
}

main();
