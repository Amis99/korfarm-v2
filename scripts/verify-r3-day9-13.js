// 러셀3 Day 9~13 검증 스크립트
const fs = require('fs');
const path = require('path');

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell3');
const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell3.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

const days = [
  { day: 9, file: '009.json', idx: 8, subArea: 'NONFICTION', title: '비문학' },
  { day: 10, file: '010.json', idx: 9, subArea: 'LITERATURE', title: '문학' },
  { day: 11, file: '011.json', idx: 10, subArea: 'NONFICTION', title: '비문학' },
  { day: 12, file: '012.json', idx: 11, subArea: 'LITERATURE', title: '문학' },
  { day: 13, file: '013.json', idx: 12, subArea: 'NONFICTION', title: '비문학' },
];

let errors = 0;

for (const d of days) {
  console.log(`\n=== Day ${d.day} (${d.title}) ===`);

  // static 파일 읽기
  const staticPath = path.join(staticDir, d.file);
  if (!fs.existsSync(staticPath)) {
    console.log(`  [에러] static 파일 없음: ${d.file}`);
    errors++;
    continue;
  }
  const content = JSON.parse(fs.readFileSync(staticPath, 'utf8'));

  // 배치 파일 확인
  const batchItem = batch.items[d.idx];
  if (!batchItem) {
    console.log(`  [에러] 배치 아이템 없음 (인덱스 ${d.idx})`);
    errors++;
    continue;
  }

  // 기본 메타데이터
  const checks = [];

  // contentId
  const expectedId = `dr-r3-${String(d.day).padStart(3, '0')}`;
  if (content.contentId !== expectedId) checks.push(`contentId: ${content.contentId} (기대: ${expectedId})`);

  // subArea
  if (content.subArea !== d.subArea) checks.push(`subArea: ${content.subArea} (기대: ${d.subArea})`);
  if (batchItem.sub_area !== d.subArea) checks.push(`batch sub_area: ${batchItem.sub_area} (기대: ${d.subArea})`);

  // day_index
  if (batchItem.day_index !== d.day) checks.push(`batch day_index: ${batchItem.day_index} (기대: ${d.day})`);

  // schoolGradeRange
  if (content.schoolGradeRange.min !== 9 || content.schoolGradeRange.max !== 10) {
    checks.push(`schoolGradeRange: {${content.schoolGradeRange.min}, ${content.schoolGradeRange.max}} (기대: {9, 10})`);
  }

  // timeLimitSec
  if (content.timeLimitSec !== 480) checks.push(`timeLimitSec: ${content.timeLimitSec} (기대: 480)`);

  // title
  const expectedTitle = `일일 독해(러셀 3) Day ${d.day} ${d.title}`;
  if (content.title !== expectedTitle) checks.push(`title: "${content.title}" (기대: "${expectedTitle}")`);

  // payload 구조
  const p = content.payload;
  if (!p) { checks.push('payload 누락'); } else {
    // passage
    if (!p.passage || !p.passage.paragraphs) {
      checks.push('passage.paragraphs 누락');
    } else {
      const totalLen = p.passage.paragraphs.reduce((s, pp) => s + pp.text.length, 0);
      console.log(`  지문 글자 수: ${totalLen}`);
      if (totalLen < 1250 || totalLen > 1350) {
        checks.push(`지문 길이 범위 벗어남: ${totalLen} (목표: 1250~1350)`);
      }
    }

    // intensive
    if (!p.intensive || !p.intensive.timeline) {
      checks.push('intensive.timeline 누락');
    } else {
      console.log(`  정독 문항 수: ${p.intensive.timeline.length}`);
      // 모든 문항 scoring 확인
      for (const step of p.intensive.timeline) {
        if (!step.question.scoring || step.question.scoring.correctDeltaSec !== 20 || step.question.scoring.wrongDeltaSec !== -40) {
          checks.push(`정독 ${step.stepId}: scoring 오류`);
          break;
        }
        if (!step.question.scoring.eliminateWrongChoice) {
          checks.push(`정독 ${step.stepId}: eliminateWrongChoice 누락`);
          break;
        }
        if (!step.highlight || !step.highlight.ranges || step.highlight.ranges.length === 0) {
          checks.push(`정독 ${step.stepId}: highlight.ranges 누락`);
          break;
        }
      }
    }

    // recall
    if (!p.recall || !p.recall.cards) {
      checks.push('recall.cards 누락');
    } else {
      console.log(`  복기 카드 수: ${p.recall.cards.length}`);
      if (p.recall.cards.length !== 8) {
        checks.push(`복기 카드 수: ${p.recall.cards.length} (기대: 8)`);
      }
      if (p.recall.seedPenalty !== 1) {
        checks.push(`seedPenalty: ${p.recall.seedPenalty} (기대: 1)`);
      }
    }

    // confirm
    if (!p.confirm || !p.confirm.questions) {
      checks.push('confirm.questions 누락');
    } else {
      const qCount = p.confirm.questions.length;
      console.log(`  확인 문항 수: ${qCount}`);
      if (qCount < 5 || qCount > 10) {
        checks.push(`확인 문항 수 범위 벗어남: ${qCount} (기대: 5~10)`);
      }
      // scoring 확인
      for (const q of p.confirm.questions) {
        if (!q.scoring || q.scoring.correctDeltaSec !== 30 || q.scoring.wrongDeltaSec !== -45) {
          checks.push(`확인 ${q.id}: scoring 오류`);
          break;
        }
        if (q.revealOnWrong !== true) {
          checks.push(`확인 ${q.id}: revealOnWrong 누락`);
          break;
        }
      }
    }
  }

  // 배치 vs static 일치 확인
  if (JSON.stringify(batchItem.content) !== JSON.stringify(content)) {
    checks.push('배치 content와 static 파일 내용 불일치');
  }

  if (checks.length === 0) {
    console.log('  [통과] 모든 검증 항목 통과');
  } else {
    errors += checks.length;
    for (const c of checks) {
      console.log(`  [에러] ${c}`);
    }
  }
}

console.log(`\n${'='.repeat(50)}`);
if (errors === 0) {
  console.log('전체 검증 완료: 에러 없음');
} else {
  console.log(`전체 검증 완료: 에러 ${errors}개 발견`);
}
