// Day 18~22 검증 스크립트
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell1');
const batchDir = path.join(__dirname, '..', 'generated', 'new');

const days = [
  { day: 18, file: '018.json', batch: 'day18-batch.json', subArea: 'LITERATURE', title: '일일 독해(러셀 1) Day 18 문학' },
  { day: 19, file: '019.json', batch: 'day19-batch.json', subArea: 'NONFICTION', title: '일일 독해(러셀 1) Day 19 비문학' },
  { day: 20, file: '020.json', batch: 'day20-batch.json', subArea: 'LITERATURE', title: '일일 독해(러셀 1) Day 20 문학' },
  { day: 21, file: '021.json', batch: 'day21-batch.json', subArea: 'NONFICTION', title: '일일 독해(러셀 1) Day 21 비문학' },
  { day: 22, file: '022.json', batch: 'day22-batch.json', subArea: 'LITERATURE', title: '일일 독해(러셀 1) Day 22 문학' },
];

let errors = [];
let ok = 0;

for (const d of days) {
  console.log(`\n=== Day ${d.day} ===`);

  // static 파일 로드
  const staticPath = path.join(baseDir, d.file);
  const json = JSON.parse(fs.readFileSync(staticPath, 'utf8'));

  // 배치 파일 로드
  const batchPath = path.join(batchDir, d.batch);
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

  // 1. 기본 메타
  if (json.contentId !== `dr-r1-${String(d.day).padStart(3,'0')}`) {
    errors.push(`Day ${d.day}: contentId 불일치 (${json.contentId})`);
  }
  if (json.title !== d.title) {
    errors.push(`Day ${d.day}: title 불일치 (${json.title})`);
  }
  if (json.subArea !== d.subArea) {
    errors.push(`Day ${d.day}: subArea 불일치 (${json.subArea})`);
  }
  if (json.timeLimitSec !== 480) {
    errors.push(`Day ${d.day}: timeLimitSec 불일치 (${json.timeLimitSec})`);
  }
  if (json.schoolGradeRange.min !== 7 || json.schoolGradeRange.max !== 8) {
    errors.push(`Day ${d.day}: schoolGradeRange 불일치`);
  }

  // 2. 지문 길이
  const paras = json.payload.passage.paragraphs;
  const totalLen = paras.reduce((s, p) => s + p.text.length, 0);
  console.log(`  지문 총 길이: ${totalLen}자`);
  if (totalLen < 1050 || totalLen > 1150) {
    errors.push(`Day ${d.day}: 지문 길이 범위 밖 (${totalLen})`);
  }

  // 3. 정독 타임라인
  const timeline = json.payload.intensive.timeline;
  console.log(`  정독 스텝 수: ${timeline.length}`);

  // 문단별 마지막 스텝이 전체 하이라이트(중심내용)인지 확인
  const paraMap = {};
  for (const p of paras) paraMap[p.id] = p.text;

  for (const step of timeline) {
    for (const range of step.highlight.ranges) {
      const pText = paraMap[range.paragraphId];
      if (!pText) {
        errors.push(`Day ${d.day}: step ${step.stepId} 존재하지 않는 paragraphId ${range.paragraphId}`);
        continue;
      }
      if (range.start < 0 || range.end > pText.length || range.start >= range.end) {
        errors.push(`Day ${d.day}: step ${step.stepId} 범위 오류 [${range.start},${range.end}] (문단 길이: ${pText.length})`);
      }
    }
    // 선택지 확인
    const q = step.question;
    if (!q.choices || q.choices.length !== 4) {
      errors.push(`Day ${d.day}: step ${step.stepId} 선택지 수 오류 (${q.choices?.length})`);
    }
    if (!q.choices.find(c => c.id === q.answerId)) {
      errors.push(`Day ${d.day}: step ${step.stepId} answerId 불일치`);
    }
  }

  // 4. 복기(recall) 카드
  const recall = json.payload.recall;
  console.log(`  복기 카드 수: ${recall.cards.length}`);
  if (recall.cards.length !== 8) {
    errors.push(`Day ${d.day}: 복기 카드 수 불일치 (${recall.cards.length})`);
  }
  if (recall.seedPenalty !== 1) {
    errors.push(`Day ${d.day}: seedPenalty 불일치`);
  }
  if (recall.correctOrder.length !== recall.cards.length) {
    errors.push(`Day ${d.day}: correctOrder 수 불일치`);
  }

  // 5. 확인(confirm) 문항
  const confirm = json.payload.confirm;
  console.log(`  확인 문항 수: ${confirm.questions.length}`);
  if (confirm.questions.length < 5 || confirm.questions.length > 10) {
    errors.push(`Day ${d.day}: 확인 문항 수 범위 밖 (${confirm.questions.length})`);
  }
  for (const q of confirm.questions) {
    if (q.revealOnWrong !== true) {
      errors.push(`Day ${d.day}: confirm ${q.id} revealOnWrong 미설정`);
    }
    for (const range of q.answerRanges) {
      const pText = paraMap[range.paragraphId];
      if (!pText) {
        errors.push(`Day ${d.day}: confirm ${q.id} 존재하지 않는 paragraphId ${range.paragraphId}`);
        continue;
      }
      if (range.start < 0 || range.end > pText.length || range.start >= range.end) {
        errors.push(`Day ${d.day}: confirm ${q.id} 범위 오류 [${range.start},${range.end}] (문단 길이: ${pText.length})`);
      }
      // 실제 텍스트와 대조
      const highlighted = pText.substring(range.start, range.end);
      if (!highlighted || highlighted.trim().length === 0) {
        errors.push(`Day ${d.day}: confirm ${q.id} 하이라이트 텍스트 비어 있음`);
      }
    }
  }

  // 6. 배치 파일 메타
  if (batch.day_index !== d.day) {
    errors.push(`Day ${d.day}: 배치 day_index 불일치 (${batch.day_index})`);
  }
  if (batch.sub_area !== d.subArea) {
    errors.push(`Day ${d.day}: 배치 sub_area 불일치 (${batch.sub_area})`);
  }
  if (batch.content.contentId !== json.contentId) {
    errors.push(`Day ${d.day}: 배치 content.contentId 불일치`);
  }

  ok++;
}

console.log('\n========== 결과 ==========');
if (errors.length === 0) {
  console.log(`${ok}일분 모두 검증 통과!`);
} else {
  console.log(`오류 ${errors.length}개:`);
  for (const e of errors) console.log(`  - ${e}`);
}
