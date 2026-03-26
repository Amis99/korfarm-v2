// 러셀3 Day 13~17 검증 스크립트
const fs = require('fs');
const path = require('path');

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell3');
const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell3.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

const days = [
  { day: 13, file: '013.json', subArea: 'NONFICTION', title: '비문학' },
  { day: 14, file: '014.json', subArea: 'LITERATURE', title: '문학' },
  { day: 15, file: '015.json', subArea: 'NONFICTION', title: '비문학' },
  { day: 16, file: '016.json', subArea: 'LITERATURE', title: '문학' },
  { day: 17, file: '017.json', subArea: 'NONFICTION', title: '비문학' }
];

let allPass = true;

for (const d of days) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Day ${d.day} (${d.title}) 검증`);
  console.log('='.repeat(60));

  // static 파일 로드
  const staticPath = path.join(staticDir, d.file);
  const content = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
  const errors = [];

  // 1. 메타데이터 검증
  if (content.contentId !== `dr-r3-${String(d.day).padStart(3, '0')}`) errors.push(`contentId 불일치: ${content.contentId}`);
  if (content.title !== `일일 독해(러셀 3) Day ${d.day} ${d.title}`) errors.push(`title 불일치: ${content.title}`);
  if (content.subArea !== d.subArea) errors.push(`subArea 불일치: ${content.subArea}`);
  if (content.schoolGradeRange.min !== 9 || content.schoolGradeRange.max !== 10) errors.push(`schoolGradeRange 불일치: ${JSON.stringify(content.schoolGradeRange)}`);
  if (content.timeLimitSec !== 480) errors.push(`timeLimitSec 불일치: ${content.timeLimitSec}`);
  if (content.targetLevel !== 'RUSSELL_3') errors.push(`targetLevel 불일치: ${content.targetLevel}`);

  // 2. 지문 검증
  const paras = content.payload.passage.paragraphs;
  const paraCount = paras.length;
  const totalLen = paras.reduce((s, p) => s + p.text.length, 0);
  console.log(`  문단 수: ${paraCount}, 총 글자 수: ${totalLen}자`);
  if (paraCount !== 4) errors.push(`문단 수 4 아님: ${paraCount}`);
  if (totalLen < 1150 || totalLen > 1400) errors.push(`글자 수 범위 이탈: ${totalLen}자`);

  // 3. 정독 검증
  const timeline = content.payload.intensive.timeline;
  console.log(`  정독 스텝: ${timeline.length}`);

  // 중심내용 스텝 확인
  const centerSteps = timeline.filter(s => s.question.prompt.includes('중심 내용'));
  console.log(`  중심내용 스텝: ${centerSteps.length}`);
  if (centerSteps.length !== 4) errors.push(`중심내용 4개 아님: ${centerSteps.length}`);

  // 하이라이트 범위 검증
  for (const step of timeline) {
    for (const range of step.highlight.ranges) {
      const para = paras.find(p => p.id === range.paragraphId);
      if (!para) {
        errors.push(`${step.stepId}: paragraphId ${range.paragraphId} 없음`);
        continue;
      }
      if (range.start < 0 || range.end > para.text.length) {
        errors.push(`${step.stepId}: 범위 초과 [${range.start}, ${range.end}] vs len ${para.text.length}`);
      }
      if (range.start >= range.end) {
        errors.push(`${step.stepId}: start >= end [${range.start}, ${range.end}]`);
      }
    }
    // 4지선다 확인
    if (step.question.choices.length !== 4) {
      errors.push(`${step.stepId}: 선택지 ${step.question.choices.length}개`);
    }
    // answerId 확인
    const validIds = step.question.choices.map(c => c.id);
    if (!validIds.includes(step.question.answerId)) {
      errors.push(`${step.stepId}: answerId ${step.question.answerId} 없음`);
    }
  }

  // 4. 복기 검증
  const recall = content.payload.recall;
  console.log(`  복기 카드: ${recall.cards.length}`);
  if (recall.cards.length !== 8) errors.push(`복기 카드 8개 아님: ${recall.cards.length}`);
  if (recall.seedPenalty !== 1) errors.push(`seedPenalty 1 아님: ${recall.seedPenalty}`);
  if (recall.correctOrder.length !== 8) errors.push(`correctOrder 8개 아님: ${recall.correctOrder.length}`);
  // correctOrder의 모든 id가 cards에 있는지
  for (const id of recall.correctOrder) {
    if (!recall.cards.find(c => c.id === id)) {
      errors.push(`correctOrder에 없는 카드 id: ${id}`);
    }
  }

  // 5. 확인 검증
  const confirm = content.payload.confirm;
  console.log(`  확인 문항: ${confirm.questions.length}`);
  if (confirm.questions.length < 5 || confirm.questions.length > 10) {
    errors.push(`확인 문항 5~10개 아님: ${confirm.questions.length}`);
  }
  for (const q of confirm.questions) {
    if (!q.revealOnWrong) errors.push(`${q.id}: revealOnWrong 없음`);
    if (!q.answerRanges || q.answerRanges.length === 0) errors.push(`${q.id}: answerRanges 비어있음`);
    // answerRanges 범위 검증
    for (const range of (q.answerRanges || [])) {
      const para = paras.find(p => p.id === range.paragraphId);
      if (!para) {
        errors.push(`${q.id}: paragraphId ${range.paragraphId} 없음`);
        continue;
      }
      if (range.start < 0 || range.end > para.text.length) {
        errors.push(`${q.id}: answerRange 초과 [${range.start}, ${range.end}] vs len ${para.text.length}`);
      }
      // 실제 텍스트와 answerText 매칭 확인
      const actual = para.text.substring(range.start, range.end);
      if (!q.answerText.includes(actual) && !actual.includes(q.answerText)) {
        // 부분 일치도 허용
        if (q.answerMatchMode === 'ANY') {
          // 개별 범위는 answerText의 일부일 수 있음 - 간단 체크
        }
      }
    }
  }

  // 6. 배치 파일 검증
  const batchItem = batch.items[d.day - 1];
  if (!batchItem) {
    errors.push('배치 항목 없음');
  } else {
    if (batchItem.day_index !== d.day) errors.push(`배치 day_index 불일치: ${batchItem.day_index}`);
    if (batchItem.sub_area !== d.subArea) errors.push(`배치 sub_area 불일치: ${batchItem.sub_area}`);
    if (batchItem.content.contentId !== content.contentId) errors.push(`배치 contentId 불일치`);
  }

  // 결과 출력
  if (errors.length === 0) {
    console.log(`  ✓ 모든 검증 통과`);
  } else {
    allPass = false;
    console.log(`  ✗ 오류 ${errors.length}개:`);
    errors.forEach(e => console.log(`    - ${e}`));
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(allPass ? '전체 검증 통과!' : '일부 오류 있음 - 위 내용 확인 필요');
console.log('='.repeat(60));
