#!/usr/bin/env node
/**
 * 논리 사고력 소쉬르1~3 콘텐츠 검증 스크립트
 * 1) 선택지 길이 균형 검사 (정답 대비 오답 길이)
 * 2) 구조/형식 검증
 *
 * 출력: 문제별 이슈 리포트
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'frontend', 'public', 'farm', 'logic');
const DIRS = ['saussure1', 'saussure2', 'saussure3'];
const PREFIXES = ['logic_s1_', 'logic_s2_', 'logic_s3_'];

const issues = [];
let totalQuestions = 0;
let lengthIssues = 0;

for (let di = 0; di < DIRS.length; di++) {
  const dir = DIRS[di];
  const prefix = PREFIXES[di];

  for (let fi = 1; fi <= 20; fi++) {
    const fname = `${prefix}${String(fi).padStart(2, '0')}.json`;
    const fpath = path.join(BASE, dir, fname);

    let data;
    try {
      data = JSON.parse(fs.readFileSync(fpath, 'utf8'));
    } catch (e) {
      issues.push({ file: fname, error: `JSON 파싱 오류: ${e.message}` });
      continue;
    }

    if (!data.payload || !data.payload.passages) {
      issues.push({ file: fname, error: 'payload.passages 없음' });
      continue;
    }

    for (let pi = 0; pi < data.payload.passages.length; pi++) {
      const passage = data.payload.passages[pi];

      if (!passage.questions || !Array.isArray(passage.questions)) {
        issues.push({ file: fname, passage: pi, error: 'questions 배열 없음' });
        continue;
      }

      for (let qi = 0; qi < passage.questions.length; qi++) {
        const q = passage.questions[qi];
        totalQuestions++;

        // 기본 구조 검증
        if (!q.answerId) {
          issues.push({ file: fname, qid: q.id, error: 'answerId 없음' });
          continue;
        }

        if (!q.choices || q.choices.length !== 4) {
          issues.push({ file: fname, qid: q.id, error: `선택지 수: ${q.choices?.length}` });
          continue;
        }

        // 정답 선택지 찾기
        const answerChoice = q.choices.find(c => c.id === q.answerId);
        if (!answerChoice) {
          issues.push({ file: fname, qid: q.id, error: `answerId "${q.answerId}"에 해당하는 선택지 없음` });
          continue;
        }

        const answerLen = answerChoice.text.length;
        const wrongChoices = q.choices.filter(c => c.id !== q.answerId);

        for (const wc of wrongChoices) {
          const ratio = wc.text.length / answerLen;

          if (ratio < 0.333) {  // 오답이 정답의 1/3 미만
            lengthIssues++;
            issues.push({
              file: fname,
              qid: q.id,
              type: 'LENGTH_SHORT',
              answerId: q.answerId,
              answerText: answerChoice.text,
              answerLen,
              wrongId: wc.id,
              wrongText: wc.text,
              wrongLen: wc.text.length,
              ratio: ratio.toFixed(2)
            });
          } else if (ratio > 2.0) {  // 오답이 정답의 2배 초과
            lengthIssues++;
            issues.push({
              file: fname,
              qid: q.id,
              type: 'LENGTH_LONG',
              answerId: q.answerId,
              answerText: answerChoice.text,
              answerLen,
              wrongId: wc.id,
              wrongText: wc.text,
              wrongLen: wc.text.length,
              ratio: ratio.toFixed(2)
            });
          }
        }
      }
    }
  }
}

console.log(`=== 검증 결과 ===`);
console.log(`총 문제 수: ${totalQuestions}`);
console.log(`길이 불균형 건수: ${lengthIssues}`);
console.log(`기타 이슈 건수: ${issues.filter(i => !i.type).length}`);
console.log();

// 길이 불균형 이슈
const lengthIssueList = issues.filter(i => i.type);
if (lengthIssueList.length > 0) {
  console.log(`\n=== 길이 불균형 이슈 (${lengthIssueList.length}건) ===`);
  for (const iss of lengthIssueList) {
    console.log(`${iss.file} | ${iss.qid} | ${iss.type}`);
    console.log(`  정답(${iss.answerId}): "${iss.answerText}" (${iss.answerLen}자)`);
    console.log(`  오답(${iss.wrongId}): "${iss.wrongText}" (${iss.wrongLen}자) → 비율 ${iss.ratio}`);
  }
}

// 기타 이슈
const otherIssues = issues.filter(i => !i.type);
if (otherIssues.length > 0) {
  console.log(`\n=== 기타 이슈 ===`);
  for (const iss of otherIssues) {
    console.log(JSON.stringify(iss));
  }
}
