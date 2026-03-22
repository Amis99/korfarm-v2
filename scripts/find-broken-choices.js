// "????" 등 깨진 선택지가 포함된 day를 찾는 스크립트
const fs = require('fs');
const path = require('path');

const GENERATED_DIR = path.join(__dirname, '..', 'generated');
const files = fs.readdirSync(GENERATED_DIR)
  .filter(f => f.startsWith('daily-batch-reading-') && f.endsWith('.json'));

const BROKEN_PATTERN = /\?{3,}/; // 물음표 3개 이상 연속

for (const file of files) {
  const filePath = path.join(GENERATED_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const levelKey = file.replace('daily-batch-reading-', '').replace('.json', '');

  const brokenDays = [];
  let totalBrokenChoices = 0;

  for (const item of data.items) {
    const timeline = item.content?.payload?.intensive?.timeline || [];
    const confirms = item.content?.payload?.confirm?.questions || [];
    let dayBroken = 0;

    for (const step of timeline) {
      const choices = step.question?.choices || [];
      for (const c of choices) {
        if (BROKEN_PATTERN.test(c.text)) {
          dayBroken++;
        }
      }
      // prompt도 확인
      if (step.question?.prompt && BROKEN_PATTERN.test(step.question.prompt)) {
        dayBroken++;
      }
    }

    for (const q of confirms) {
      if (q.prompt && BROKEN_PATTERN.test(q.prompt)) dayBroken++;
      if (q.answerText && BROKEN_PATTERN.test(q.answerText)) dayBroken++;
    }

    // 지문도 확인
    const paras = item.content?.payload?.passage?.paragraphs || [];
    for (const p of paras) {
      if (BROKEN_PATTERN.test(p.text)) dayBroken++;
    }

    // recall도 확인
    const cards = item.content?.payload?.recall?.cards || [];
    for (const c of cards) {
      if (BROKEN_PATTERN.test(c.text)) dayBroken++;
    }

    if (dayBroken > 0) {
      brokenDays.push({ day: item.day_index, count: dayBroken, subArea: item.sub_area });
      totalBrokenChoices += dayBroken;
    }
  }

  if (brokenDays.length > 0) {
    console.log(`\n=== ${levelKey} === (${brokenDays.length}일 불량, 총 ${totalBrokenChoices}건)`);
    // 연속 범위로 묶어서 출력
    let rangeStart = brokenDays[0].day;
    let rangeLast = brokenDays[0].day;
    const ranges = [];
    for (let i = 1; i < brokenDays.length; i++) {
      if (brokenDays[i].day === rangeLast + 1) {
        rangeLast = brokenDays[i].day;
      } else {
        ranges.push(rangeStart === rangeLast ? `${rangeStart}` : `${rangeStart}-${rangeLast}`);
        rangeStart = brokenDays[i].day;
        rangeLast = brokenDays[i].day;
      }
    }
    ranges.push(rangeStart === rangeLast ? `${rangeStart}` : `${rangeStart}-${rangeLast}`);
    console.log(`  불량 day: ${ranges.join(', ')}`);
    console.log(`  첫 10일: ${brokenDays.slice(0, 10).map(d => `Day${d.day}(${d.count}건)`).join(', ')}`);
  }
}
