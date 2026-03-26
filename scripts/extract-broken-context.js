// 깨진 선택지의 전체 컨텍스트를 추출하여 수리용 JSON 생성
const fs = require('fs');
const path = require('path');

const GENERATED_DIR = path.join(__dirname, '..', 'generated');
const BROKEN_PATTERN = /\?{3,}/;

const levelKey = process.argv[2] || 'saussure1';
const filePath = path.join(GENERATED_DIR, `daily-batch-reading-${levelKey}.json`);
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const patches = [];

for (const item of data.items) {
  const dayIndex = item.day_index;
  const paras = item.content?.payload?.passage?.paragraphs || [];
  const timeline = item.content?.payload?.intensive?.timeline || [];

  for (const step of timeline) {
    const choices = step.question?.choices || [];
    const brokenChoices = choices.filter(c => BROKEN_PATTERN.test(c.text));
    if (brokenChoices.length === 0) continue;

    // 하이라이트된 지문 텍스트 추출
    const hl = step.highlight;
    let highlightText = '';
    if (hl) {
      const para = paras.find(p => p.id === hl.paragraphId);
      if (para && hl.range) {
        highlightText = para.text.substring(hl.range.start, hl.range.end);
      }
    }

    // 정상 선택지 텍스트와 길이
    const okChoices = choices.filter(c => !BROKEN_PATTERN.test(c.text));
    const avgLen = okChoices.length > 0 ? Math.round(okChoices.reduce((s, c) => s + c.text.length, 0) / okChoices.length) : 20;

    for (const bc of brokenChoices) {
      const isCorrect = bc.id === step.question.answerId;
      // 깨진 텍스트에서 글자수 추정 (? 하나 = 한글 1자, 공백 유지)
      const estimatedLen = bc.text.replace(/\s/g, '').length;

      patches.push({
        dayIndex,
        stepId: step.stepId,
        choiceId: bc.id,
        isCorrect,
        prompt: step.question.prompt,
        highlightText: highlightText.substring(0, 100),
        brokenText: bc.text,
        estimatedLen,
        targetLen: avgLen,
        okChoicesRef: okChoices.map(c => ({ id: c.id, text: c.text })),
        fix: ""  // 여기에 수정된 텍스트를 넣어야 함
      });
    }
  }
}

console.log(`${levelKey}: ${patches.length}개 깨진 선택지 발견 (${new Set(patches.map(p => p.dayIndex)).size}일)`);

// 파일 저장
const outPath = path.join(GENERATED_DIR, 'new', `broken-${levelKey}.json`);
fs.writeFileSync(outPath, JSON.stringify(patches, null, 2), 'utf8');
console.log(`컨텍스트 파일 저장: ${outPath}`);
