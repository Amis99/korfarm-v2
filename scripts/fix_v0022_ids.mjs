// V0022 SQL 문항 ID 중복 수정 스크립트
// P1 문항은 기존 ID 유지, P2~P5 문항은 passage 포함 유니크 ID로 변경

import { readFileSync, writeFileSync } from 'fs';

const sqlPath = 'backend/src/main/resources/db/migration/V0022__seed_diagnostic_v2_data.sql';
const sql = readFileSync(sqlPath, 'utf-8');

const lines = sql.split('\n');
const output = [];

// passage_id에서 passage 번호 추출 (예: S1_LIT_P2 → P2)
function getPassageNum(passageId) {
  const match = passageId.match(/_P(\d+)$/);
  return match ? match[1] : null;
}

// 각 tier+genre 그룹별로 첫 passage가 무엇인지 추적
const firstPassagePerGroup = {};

// 먼저 passage INSERT로부터 각 그룹의 첫 passage 파악
for (const line of lines) {
  if (line.startsWith("INSERT INTO diag_passages")) {
    const match = line.match(/VALUES \('([^']+)'/);
    if (match) {
      const passageId = match[1]; // 예: S1_LIT_P1
      // 그룹 키: passage 번호 제거 (예: S1_LIT)
      const group = passageId.replace(/_P\d+$/, '');
      if (!firstPassagePerGroup[group]) {
        firstPassagePerGroup[group] = passageId;
      }
    }
  }
}

console.log('각 그룹별 첫 passage:', firstPassagePerGroup);

let totalQuestions = 0;
let renamedCount = 0;
let keptCount = 0;

for (const line of lines) {
  if (line.startsWith("INSERT INTO diag_questions")) {
    totalQuestions++;

    // 문항 ID와 passage_id 추출
    const valuesMatch = line.match(/VALUES \('([^']+)', '([^']+)'/);
    if (!valuesMatch) {
      output.push(line);
      continue;
    }

    const questionId = valuesMatch[1]; // 예: S1_LIT_Q01
    const passageId = valuesMatch[2];  // 예: S1_LIT_P2

    // 그룹 키
    const group = passageId.replace(/_P\d+$/, '');
    const passageNum = getPassageNum(passageId);

    // 첫 passage인지 확인
    if (firstPassagePerGroup[group] === passageId) {
      // 첫 passage → ID 유지
      output.push(line);
      keptCount++;
    } else {
      // 이후 passage → ID에 passage 번호 포함
      // S1_LIT_Q01 → S1_LIT_P2_Q01
      const qNum = questionId.match(/Q(\d+)$/)[1];
      const newId = `${group}_P${passageNum}_Q${qNum}`;

      // SQL에서 ID 교체 (첫 번째 VALUES 안의 ID만)
      const newLine = line.replace(
        `VALUES ('${questionId}',`,
        `VALUES ('${newId}',`
      );
      output.push(newLine);
      renamedCount++;
    }
  } else {
    output.push(line);
  }
}

console.log(`총 문항: ${totalQuestions}`);
console.log(`ID 유지: ${keptCount}`);
console.log(`ID 변경: ${renamedCount}`);
console.log(`유니크 ID 수: ${keptCount + renamedCount}`);

writeFileSync(sqlPath, output.join('\n'), 'utf-8');
console.log('SQL 파일 수정 완료.');

// 검증: 중복 ID 확인
const newSql = readFileSync(sqlPath, 'utf-8');
const idSet = new Set();
const duplicates = [];
for (const line of newSql.split('\n')) {
  if (line.startsWith("INSERT INTO diag_questions")) {
    const match = line.match(/VALUES \('([^']+)'/);
    if (match) {
      if (idSet.has(match[1])) {
        duplicates.push(match[1]);
      }
      idSet.add(match[1]);
    }
  }
}

if (duplicates.length > 0) {
  console.error('중복 ID 발견:', duplicates);
  process.exit(1);
} else {
  console.log(`검증 완료: ${idSet.size}개 모두 유니크`);
}
