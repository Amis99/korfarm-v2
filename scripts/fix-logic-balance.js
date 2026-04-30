/**
 * 논리 사고력 콘텐츠 검증 및 수정 스크립트
 * - 선택지 길이 불균형 수정 (정답 대비 오답이 2배 이상 길거나 1/3 이하로 짧은 경우)
 * - 정답은 절대 수정하지 않음
 * - 오답 3개의 텍스트만 수정
 */
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'frontend', 'public', 'farm', 'logic');
const dirs = ['frege1', 'frege2', 'frege3'];
const prefixes = { frege1: 'logic_f1_', frege2: 'logic_f2_', frege3: 'logic_f3_' };

let totalFixed = 0;
let fixLog = [];

/**
 * 오답 텍스트를 정답 길이에 맞춰 수정하되, 내용은 여전히 틀리게 유지
 * 이 함수는 컨텍스트 기반으로 적절한 수정을 제안
 */
function balanceChoiceLengths(question, passage) {
  const answerId = question.answerId;
  const answerChoice = question.choices.find(c => c.id === answerId);
  if (!answerChoice) return false;

  const ansLen = answerChoice.text.length;
  let modified = false;

  for (const choice of question.choices) {
    if (choice.id === answerId) continue; // 정답은 스킵

    const wrongLen = choice.text.length;
    const ratio = Math.max(ansLen / wrongLen, wrongLen / ansLen);

    if (ratio < 2) continue; // 2배 미만이면 OK

    // 수정이 필요한 케이스
    modified = true;
  }

  return modified;
}

// 1단계: 모든 파일 읽기 및 길이 불균형 문제 식별
let allIssues = [];
for (const dir of dirs) {
  const prefix = prefixes[dir];
  for (let i = 1; i <= 20; i++) {
    const num = String(i).padStart(2, '0');
    const filePath = path.join(baseDir, dir, prefix + num + '.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const passage of data.payload.passages) {
      for (const q of passage.questions) {
        const answerChoice = q.choices.find(c => c.id === q.answerId);
        if (!answerChoice) {
          allIssues.push({
            file: filePath,
            dir, num,
            qid: q.id,
            type: 'MISSING_ANSWER',
            detail: `answerId ${q.answerId}가 선택지에 없음`
          });
          continue;
        }

        const ansLen = answerChoice.text.length;
        const wrongChoices = q.choices.filter(c => c.id !== q.answerId);

        for (const wc of wrongChoices) {
          const ratio = Math.max(ansLen / wc.text.length, wc.text.length / ansLen);
          if (ratio >= 2) {
            allIssues.push({
              file: filePath,
              dir, num,
              qid: q.id,
              type: 'LENGTH_IMBALANCE',
              ansId: q.answerId,
              ansText: answerChoice.text,
              ansLen,
              wrongId: wc.id,
              wrongText: wc.text,
              wrongLen: wc.text.length,
              ratio: ratio.toFixed(2),
              direction: ansLen > wc.text.length ? 'answer_longer' : 'wrong_longer',
              passage: passage.text,
              stem: q.stem,
              allChoices: q.choices
            });
          }
        }
      }
    }
  }
}

console.log(`총 불균형 건수: ${allIssues.length}`);
console.log(`고유 문제 수: ${new Set(allIssues.map(i => i.qid)).size}`);

// 이슈를 JSON으로 저장 (수동 검토용)
fs.writeFileSync(
  path.join(__dirname, 'logic-balance-issues.json'),
  JSON.stringify(allIssues, null, 2),
  'utf8'
);

console.log('이슈 목록 저장 완료: scripts/logic-balance-issues.json');
