/**
 * 일일독해 배치 JSON 정규화 스크립트
 * 1. 제목 통일: "일일 독해(레벨명) Day N 영역"
 * 2. Scoring 통일: 정독 20/-40, 확인 30/-45
 * 3. 하이라이트 구조 통일: { paragraphId, range } → { ranges: [{ paragraphId, start, end }] }
 */
const fs = require("fs");
const path = require("path");

const LEVEL_LABELS = {
  saussure1: "소쉬르 1",
  saussure2: "소쉬르 2",
  saussure3: "소쉬르 3",
  frege1: "프레게 1",
  frege2: "프레게 2",
  frege3: "프레게 3",
  russell1: "러셀 1",
  russell2: "러셀 2",
  russell3: "러셀 3",
  wittgenstein1: "비트겐슈타인 1",
  wittgenstein2: "비트겐슈타인 2",
  wittgenstein3: "비트겐슈타인 3",
};

const SUB_AREA_LABELS = {
  NONFICTION: "비문학",
  LITERATURE: "문학",
  LIFE: "생활",
  USAGE: "어법",
  GRAMMAR: "문법",
  SPEECH: "연설",
  WRITING: "작문",
};

const INTENSIVE_SCORING = { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true };
const CONFIRM_SCORING = { correctDeltaSec: 30, wrongDeltaSec: -45 };

function normalizeHighlight(highlight) {
  if (!highlight) return { ranges: [] };
  if (Array.isArray(highlight.ranges)) return highlight;
  if (highlight.paragraphId && highlight.range) {
    return {
      ranges: [{
        paragraphId: highlight.paragraphId,
        start: highlight.range.start,
        end: highlight.range.end,
      }],
    };
  }
  return { ranges: [] };
}

function processFile(filename) {
  const levelKey = filename.replace("daily-batch-reading-", "").replace(".json", "");
  const levelLabel = LEVEL_LABELS[levelKey];
  if (!levelLabel) {
    console.error("알 수 없는 레벨:", levelKey);
    return;
  }

  const filePath = path.join(__dirname, "..", "generated", filename);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  let titleFixed = 0;
  let scoringFixed = 0;
  let highlightFixed = 0;

  data.items.forEach((item, idx) => {
    const c = item.content;
    if (!c) return;

    const dayIndex = item.day_index || idx + 1;
    const subArea = c.subArea || item.sub_area || "NONFICTION";
    const subAreaLabel = SUB_AREA_LABELS[subArea] || subArea;

    // 1. 제목 통일
    const newTitle = `일일 독해(${levelLabel}) Day ${dayIndex} ${subAreaLabel}`;
    if (c.title !== newTitle) {
      c.title = newTitle;
      titleFixed++;
    }

    // description 통일
    c.description = "일일 독해 - 정독·복기·확인";

    const payload = c.payload;
    if (!payload) return;

    // 2. 정독 scoring 통일
    const timeline = payload.intensive?.timeline || [];
    timeline.forEach((step) => {
      if (step.question?.scoring) {
        const sc = step.question.scoring;
        if (sc.correctDeltaSec !== INTENSIVE_SCORING.correctDeltaSec ||
            sc.wrongDeltaSec !== INTENSIVE_SCORING.wrongDeltaSec ||
            sc.eliminateWrongChoice !== INTENSIVE_SCORING.eliminateWrongChoice) {
          step.question.scoring = { ...INTENSIVE_SCORING };
          scoringFixed++;
        }
      } else if (step.question) {
        step.question.scoring = { ...INTENSIVE_SCORING };
        scoringFixed++;
      }

      // 3. 하이라이트 구조 통일
      if (step.highlight) {
        if (!Array.isArray(step.highlight.ranges)) {
          step.highlight = normalizeHighlight(step.highlight);
          highlightFixed++;
        }
      }
    });

    // 2b. 확인 scoring 통일
    const questions = payload.confirm?.questions || [];
    questions.forEach((q) => {
      if (q.scoring) {
        const sc = q.scoring;
        if (sc.correctDeltaSec !== CONFIRM_SCORING.correctDeltaSec ||
            sc.wrongDeltaSec !== CONFIRM_SCORING.wrongDeltaSec) {
          q.scoring = { ...CONFIRM_SCORING };
          scoringFixed++;
        }
      } else {
        q.scoring = { ...CONFIRM_SCORING };
        scoringFixed++;
      }

      // revealOnWrong 기본값
      if (q.revealOnWrong === undefined) {
        q.revealOnWrong = true;
      }

      // answerMatchMode 기본값
      if (!q.answerMatchMode) {
        q.answerMatchMode = "ANY";
      }
    });
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log(`${levelKey}: 제목 ${titleFixed}건, scoring ${scoringFixed}건, 하이라이트 ${highlightFixed}건 수정`);
}

// 모든 파일 처리
const files = fs.readdirSync(path.join(__dirname, "..", "generated"))
  .filter((f) => f.startsWith("daily-batch-reading-") && f.endsWith(".json"));

console.log(`\n=== 일일독해 배치 JSON 정규화 ===\n대상 파일: ${files.length}개\n`);

files.forEach(processFile);

console.log("\n완료!");
