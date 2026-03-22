const fs = require('fs');
const path = require('path');

const batch = JSON.parse(fs.readFileSync(path.join('C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지\\generated\\daily-batch-reading-frege3.json'), 'utf8'));

const days = [12, 13, 14, 15, 16];
let allOk = true;

days.forEach(d => {
  const item = batch.items[d - 1];
  const c = item.content;
  const p = c.payload;
  const totalLen = p.passage.paragraphs.reduce((s, pp) => s + pp.text.length, 0);
  const recallCount = p.recall.cards.length;
  const confirmCount = p.confirm.questions.length;
  const stepsCount = p.intensive.timeline.length;
  const errors = [];

  // 기본 검증
  if (recallCount !== 8) errors.push('recall=' + recallCount);
  if (confirmCount < 5 || confirmCount > 10) errors.push('confirm=' + confirmCount);
  if (totalLen < 850 || totalLen > 1100) errors.push('len=' + totalLen + ' (범위밖)');
  if (item.day_index !== d) errors.push('day_index=' + item.day_index);
  if (c.contentId !== 'dr-f3-' + String(d).padStart(3, '0')) errors.push('contentId=' + c.contentId);

  // confirm answerRanges 검증
  p.confirm.questions.forEach((q, qi) => {
    if (!q.answerRanges || q.answerRanges.length === 0) {
      errors.push('q' + (qi + 1) + ' answerRanges 없음');
    } else {
      q.answerRanges.forEach(ar => {
        const para = p.passage.paragraphs.find(pp => pp.id === ar.paragraphId);
        if (!para) errors.push('q' + (qi + 1) + ' pid=' + ar.paragraphId + ' 없음');
        else {
          const slice = para.text.substring(ar.start, ar.end);
          if (!slice || slice.length === 0) errors.push('q' + (qi + 1) + ' 빈범위');
        }
      });
    }
  });

  // intensive highlight 범위 검증
  p.intensive.timeline.forEach(step => {
    step.highlight.ranges.forEach(r => {
      const para = p.passage.paragraphs.find(pp => pp.id === r.paragraphId);
      if (!para) errors.push(step.stepId + ' pid없음');
      else if (r.start < 0 || r.end > para.text.length || r.start >= r.end)
        errors.push(step.stepId + ' 범위오류');
    });
  });

  // sub_area
  const expectedSub = (d % 2 === 0) ? 'LITERATURE' : 'NONFICTION';
  if (item.sub_area !== expectedSub) errors.push('sub_area=' + item.sub_area);

  // static 파일
  const staticPath = path.join('C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지\\frontend\\public\\daily-reading\\frege3', String(d).padStart(3, '0') + '.json');
  if (!fs.existsSync(staticPath)) {
    errors.push('static 파일 없음');
  } else {
    const sc = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
    if (sc.contentId !== c.contentId) errors.push('static contentId 불일치');
    const sLen = sc.payload.passage.paragraphs.reduce((s, pp) => s + pp.text.length, 0);
    if (sLen !== totalLen) errors.push('static 길이 불일치: ' + sLen);
  }

  if (errors.length > 0) allOk = false;
  const tag = errors.length === 0 ? 'OK' : 'ERR';
  console.log('Day ' + d + ' [' + tag + '] len=' + totalLen + ' steps=' + stepsCount + ' recall=' + recallCount + ' confirm=' + confirmCount + ' sub=' + item.sub_area + (errors.length > 0 ? ' | ' + errors.join(', ') : ''));
});

console.log('');
console.log(allOk ? '=== 전체 검증 통과 ===' : '=== 오류 있음 - 위 내용 확인 ===');
