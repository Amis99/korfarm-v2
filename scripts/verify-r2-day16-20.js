// Day 16~20 검증 스크립트
const fs = require('fs');
const path = require('path');

const base = "C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/frontend/public/daily-reading/russell2";

const days = [16, 17, 18, 19, 20];
const expectedSubAreas = ["LITERATURE", "NONFICTION", "LITERATURE", "NONFICTION", "LITERATURE"];
let allOk = true;

for (let i = 0; i < days.length; i++) {
  const day = days[i];
  const file = path.join(base, String(day).padStart(3, '0') + '.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const errors = [];

  // 기본 메타
  if (data.contentId !== `dr-r2-${String(day).padStart(3, '0')}`) errors.push(`contentId 불일치: ${data.contentId}`);
  if (data.subArea !== expectedSubAreas[i]) errors.push(`subArea 불일치: ${data.subArea} != ${expectedSubAreas[i]}`);
  if (data.timeLimitSec !== 480) errors.push(`timeLimitSec: ${data.timeLimitSec}`);
  if (data.schoolGradeRange.min !== 8 || data.schoolGradeRange.max !== 9) errors.push(`gradeRange 불일치`);
  if (data.targetLevel !== "RUSSELL_2") errors.push(`targetLevel 불일치`);

  const payload = data.payload;
  const paragraphs = payload.passage.paragraphs;
  const totalLen = paragraphs.reduce((sum, p) => sum + p.text.length, 0);

  // 글자수 확인
  if (totalLen < 1150 || totalLen > 1550) errors.push(`글자수 범위 밖: ${totalLen}`);

  // 정독 하이라이트 ranges 검증
  const timeline = payload.intensive.timeline;
  for (const step of timeline) {
    for (const range of step.highlight.ranges) {
      const para = paragraphs.find(p => p.id === range.paragraphId);
      if (!para) { errors.push(`${step.stepId}: 문단 ${range.paragraphId} 없음`); continue; }
      if (range.start < 0 || range.end > para.text.length) {
        errors.push(`${step.stepId}: range [${range.start},${range.end}] 초과 (문단길이: ${para.text.length})`);
      }
      if (range.start >= range.end) {
        errors.push(`${step.stepId}: start >= end`);
      }
    }
    // 선택지 검증
    const q = step.question;
    if (!q.choices || q.choices.length < 3) errors.push(`${step.stepId}: 선택지 부족`);
    if (!q.choices.find(c => c.id === q.answerId)) errors.push(`${step.stepId}: answerId 불일치`);
  }

  // 복기 카드 검증
  const recall = payload.recall;
  if (recall.cards.length !== 8) errors.push(`복기 카드 수: ${recall.cards.length}`);
  if (recall.seedPenalty !== 1) errors.push(`seedPenalty: ${recall.seedPenalty}`);
  if (recall.correctOrder.length !== 8) errors.push(`correctOrder 길이: ${recall.correctOrder.length}`);

  // 확인 문항 검증
  const confirm = payload.confirm;
  if (confirm.questions.length < 5 || confirm.questions.length > 10) errors.push(`확인 문항 수: ${confirm.questions.length}`);
  for (const q of confirm.questions) {
    if (!q.revealOnWrong) errors.push(`${q.id}: revealOnWrong 누락`);
    for (const ar of q.answerRanges) {
      const para = paragraphs.find(p => p.id === ar.paragraphId);
      if (!para) { errors.push(`${q.id}: 문단 ${ar.paragraphId} 없음`); continue; }
      if (ar.start < 0 || ar.end > para.text.length) {
        errors.push(`${q.id}: answerRange [${ar.start},${ar.end}] 초과 (문단길이: ${para.text.length})`);
      }
    }
  }

  if (errors.length > 0) {
    console.log(`Day ${day}: ${errors.length}개 오류`);
    errors.forEach(e => console.log(`  - ${e}`));
    allOk = false;
  } else {
    const subAreaKo = data.subArea === "LITERATURE" ? "문학" : "비문학";
    console.log(`Day ${day} (${subAreaKo}): OK - ${totalLen}자, 정독 ${timeline.length}단계, 복기 ${recall.cards.length}카드, 확인 ${confirm.questions.length}문항`);
  }
}

if (allOk) {
  console.log("\n모든 Day 16~20 검증 통과!");
} else {
  console.log("\n일부 오류가 있습니다. 위 내용을 확인하세요.");
}
