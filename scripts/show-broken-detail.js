// 깨진 텍스트가 있는 day의 상세 위치를 보여줌
const fs = require('fs');
const path = require('path');

const GENERATED_DIR = path.join(__dirname, '..', 'generated');
const BROKEN_PATTERN = /\?{3,}/;

const levelKey = process.argv[2] || 'saussure1';
const dayIndex = parseInt(process.argv[3]) || 10;

const filePath = path.join(GENERATED_DIR, `daily-batch-reading-${levelKey}.json`);
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const item = data.items[dayIndex - 1];

console.log(`\n=== ${levelKey} Day ${dayIndex} 깨진 텍스트 상세 ===\n`);

// 지문
const paras = item.content?.payload?.passage?.paragraphs || [];
for (const p of paras) {
  if (BROKEN_PATTERN.test(p.text)) {
    console.log(`[지문 ${p.id}] 깨진 텍스트: "${p.text.substring(0, 80)}..."`);
  }
}

// 정독
const timeline = item.content?.payload?.intensive?.timeline || [];
for (const step of timeline) {
  if (step.question?.prompt && BROKEN_PATTERN.test(step.question.prompt)) {
    console.log(`[정독 ${step.stepId} prompt] "${step.question.prompt}"`);
  }
  for (const c of (step.question?.choices || [])) {
    if (BROKEN_PATTERN.test(c.text)) {
      console.log(`[정독 ${step.stepId} 선택지${c.id}] "${c.text}"`);
    }
  }
}

// 복기
const cards = item.content?.payload?.recall?.cards || [];
for (const c of cards) {
  if (BROKEN_PATTERN.test(c.text)) {
    console.log(`[복기 ${c.id}] "${c.text}"`);
  }
}

// 확인학습
const confirms = item.content?.payload?.confirm?.questions || [];
for (const q of confirms) {
  if (q.prompt && BROKEN_PATTERN.test(q.prompt)) {
    console.log(`[확인 ${q.id} prompt] "${q.prompt}"`);
  }
  if (q.answerText && BROKEN_PATTERN.test(q.answerText)) {
    console.log(`[확인 ${q.id} answer] "${q.answerText}"`);
  }
}

if (!paras.some(p => BROKEN_PATTERN.test(p.text)) &&
    !timeline.some(s => BROKEN_PATTERN.test(s.question?.prompt || '') || (s.question?.choices || []).some(c => BROKEN_PATTERN.test(c.text))) &&
    !cards.some(c => BROKEN_PATTERN.test(c.text)) &&
    !confirms.some(q => BROKEN_PATTERN.test(q.prompt || '') || BROKEN_PATTERN.test(q.answerText || ''))) {
  console.log('깨진 텍스트 없음');
}
