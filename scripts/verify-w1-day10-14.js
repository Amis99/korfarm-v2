const fs = require('fs');
const path = require('path');

const days = [10, 11, 12, 13, 14];
const expectedSubAreas = ['LITERATURE', 'NONFICTION', 'LITERATURE', 'NONFICTION', 'LITERATURE'];
let allPassed = true;

for (let i = 0; i < days.length; i++) {
  const day = days[i];
  const expectedSubArea = expectedSubAreas[i];
  const file = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1', String(day).padStart(3, '0') + '.json');

  console.log(`\n=== Day ${day} 검증 ===`);

  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.log(`  [FAIL] 파일 읽기 실패: ${e.message}`);
    allPassed = false;
    continue;
  }

  // 1. 기본 메타데이터
  const checks = [
    ['contentId', data.contentId === `dr-w1-${String(day).padStart(3, '0')}`],
    ['contentType', data.contentType === 'DAILY_READING'],
    ['status', data.status === 'PUBLISHED'],
    ['targetLevel', data.targetLevel === 'WITTGENSTEIN_1'],
    ['schoolGradeRange.min', data.schoolGradeRange?.min === 9],
    ['schoolGradeRange.max', data.schoolGradeRange?.max === 10],
    ['timeLimitSec', data.timeLimitSec === 600],
    ['subArea', data.subArea === expectedSubArea],
    ['area', data.area === 'READING'],
    ['seedReward.seedType', data.seedReward?.seedType === 'WHEAT'],
    ['seedReward.count', data.seedReward?.count === 3],
  ];

  for (const [name, ok] of checks) {
    if (!ok) {
      console.log(`  [FAIL] ${name}: ${JSON.stringify(data[name] || 'missing')}`);
      allPassed = false;
    }
  }

  // 2. 지문 글자 수
  const paragraphs = data.payload?.passage?.paragraphs || [];
  const totalLen = paragraphs.reduce((sum, p) => sum + p.text.length, 0);
  const lenOk = totalLen >= 1350 && totalLen <= 1450;
  console.log(`  지문 글자 수: ${totalLen} ${lenOk ? '[OK]' : '[WARN] 범위 밖'}`);

  // 3. 정독 타임라인
  const timeline = data.payload?.intensive?.timeline || [];
  console.log(`  정독 step 수: ${timeline.length}`);

  // 정독 scoring 확인
  let intensiveOk = true;
  for (const step of timeline) {
    const s = step.question?.scoring;
    if (!s || s.correctDeltaSec !== 20 || s.wrongDeltaSec !== -40 || s.eliminateWrongChoice !== true) {
      console.log(`  [FAIL] 정독 scoring 오류: ${step.stepId}`);
      intensiveOk = false;
      allPassed = false;
    }
    // highlight ranges 확인
    if (!step.highlight?.ranges?.length) {
      console.log(`  [FAIL] highlight.ranges 누락: ${step.stepId}`);
      intensiveOk = false;
      allPassed = false;
    }
    // 4지선다 확인
    if (step.question?.choices?.length !== 4) {
      console.log(`  [FAIL] 선택지 수 != 4: ${step.stepId}`);
      intensiveOk = false;
      allPassed = false;
    }
  }
  if (intensiveOk) console.log(`  정독 scoring: [OK]`);

  // 4. 복기 카드
  const recall = data.payload?.recall;
  const cardCount = recall?.cards?.length || 0;
  const orderCount = recall?.correctOrder?.length || 0;
  const seedPenalty = recall?.seedPenalty;
  console.log(`  복기 카드 수: ${cardCount} ${cardCount === 8 ? '[OK]' : '[FAIL]'}`);
  console.log(`  복기 correctOrder: ${orderCount} ${orderCount === 8 ? '[OK]' : '[FAIL]'}`);
  console.log(`  복기 seedPenalty: ${seedPenalty} ${seedPenalty === 1 ? '[OK]' : '[FAIL]'}`);
  if (cardCount !== 8 || orderCount !== 8 || seedPenalty !== 1) allPassed = false;

  // 5. 확인 문항
  const confirm = data.payload?.confirm;
  const qCount = confirm?.questions?.length || 0;
  console.log(`  확인 문항 수: ${qCount} ${qCount >= 5 && qCount <= 10 ? '[OK]' : '[FAIL]'}`);
  if (qCount < 5 || qCount > 10) allPassed = false;

  let confirmOk = true;
  for (const q of (confirm?.questions || [])) {
    const s = q.scoring;
    if (!s || s.correctDeltaSec !== 30 || s.wrongDeltaSec !== -45) {
      console.log(`  [FAIL] 확인 scoring 오류: ${q.id}`);
      confirmOk = false;
      allPassed = false;
    }
    if (q.revealOnWrong !== true) {
      console.log(`  [FAIL] revealOnWrong 누락: ${q.id}`);
      confirmOk = false;
      allPassed = false;
    }
    if (!q.answerText) {
      console.log(`  [FAIL] answerText 누락: ${q.id}`);
      confirmOk = false;
      allPassed = false;
    }
    if (!q.answerRanges?.length) {
      console.log(`  [FAIL] answerRanges 누락: ${q.id}`);
      confirmOk = false;
      allPassed = false;
    }
  }
  if (confirmOk) console.log(`  확인 scoring/속성: [OK]`);

  // 6. 제목 확인
  const titleType = expectedSubArea === 'LITERATURE' ? '문학' : '비문학';
  const expectedTitle = `일일 독해(비트겐슈타인 1) Day ${day} ${titleType}`;
  console.log(`  제목: "${data.title}" ${data.title === expectedTitle ? '[OK]' : '[FAIL] expected: ' + expectedTitle}`);
  if (data.title !== expectedTitle) allPassed = false;
}

// 배치 파일 검증
console.log(`\n=== 배치 파일 검증 ===`);
for (let i = 0; i < days.length; i++) {
  const day = days[i];
  const batchFile = path.join(__dirname, '..', 'generated', 'new', `batch-w1-day${day}.json`);
  try {
    const batch = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
    const ok = batch.day_index === day &&
               batch.level_id === 'WITTGENSTEIN_1' &&
               batch.content_type === 'DAILY_READING' &&
               batch.sub_area === expectedSubAreas[i] &&
               batch.content?.contentId === `dr-w1-${String(day).padStart(3, '0')}`;
    console.log(`  Day ${day} 배치: ${ok ? '[OK]' : '[FAIL]'}`);
    if (!ok) allPassed = false;
  } catch (e) {
    console.log(`  Day ${day} 배치: [FAIL] ${e.message}`);
    allPassed = false;
  }
}

console.log(`\n${'='.repeat(40)}`);
console.log(allPassed ? '모든 검증 통과!' : '일부 검증 실패! 위 로그를 확인하세요.');
