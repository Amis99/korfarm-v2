const fs = require('fs');
const path = require('path');

const files = ['004.json', '005.json', '006.json'];
const dir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell1');

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const paras = data.payload.passage.paragraphs;
  const totalLen = paras.reduce((acc, p) => acc + p.text.length, 0);
  const recallCount = data.payload.recall.cards.length;
  const confirmCount = data.payload.confirm.questions.length;
  const stepsCount = data.payload.intensive.timeline.length;

  let rangeOk = true;
  data.payload.intensive.timeline.forEach(step => {
    step.highlight.ranges.forEach(r => {
      const para = paras.find(p => p.id === r.paragraphId);
      if (!para || r.start < 0 || r.end > para.text.length || r.start >= r.end) {
        rangeOk = false;
        console.log('  BAD RANGE:', file, step.stepId, r);
      }
    });
  });

  let confirmOk = true;
  data.payload.confirm.questions.forEach(q => {
    q.answerRanges.forEach(r => {
      const para = paras.find(p => p.id === r.paragraphId);
      if (!para) { confirmOk = false; return; }
      const found = para.text.substring(r.start, r.end);
      if (found !== q.answerText) {
        confirmOk = false;
        console.log('  BAD CONFIRM:', file, q.id, '"'+found+'" vs "'+q.answerText+'"');
      }
    });
  });

  const lenOk = totalLen >= 1050 && totalLen <= 1150;

  console.log(file + ':');
  console.log('  contentId:', data.contentId, '| subArea:', data.subArea);
  console.log('  길이:', totalLen, lenOk ? 'OK' : 'FAIL');
  console.log('  recall:', recallCount, recallCount === 8 ? 'OK' : 'FAIL');
  console.log('  confirm:', confirmCount, confirmCount >= 5 ? 'OK' : 'FAIL');
  console.log('  intensive:', stepsCount, '스텝');
  console.log('  ranges:', rangeOk ? 'OK' : 'FAIL');
  console.log('  confirmRanges:', confirmOk ? 'OK' : 'FAIL');
  console.log('');
}

// 배치 파일 검증
const batch = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell1.json'), 'utf8'));
for (let i = 3; i <= 5; i++) {
  const item = batch.items[i];
  console.log('배치 items[' + i + ']:', 'day=' + item.day_index, 'sub=' + item.sub_area, 'id=' + item.content.contentId);
}
