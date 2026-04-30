/**
 * 복사본 5폴더의 contentId + targetLevel을 폴더명에 맞게 수정
 * 러셀3: RUSSELL_2 → RUSSELL_3, 소쉬르2: SAUSSURE_3 → SAUSSURE_2
 * 비트겐슈타인2: WITTGENSTEIN_1 → WITTGENSTEIN_2
 * 비트겐슈타인3: WITTGENSTEIN_1 → WITTGENSTEIN_3
 * 프레게1: FREGE_2 → FREGE_1
 */
const fs = require('fs');
const path = require('path');

const QUIZ_DIR = path.join(__dirname, '..', 'frontend', 'public', 'daily-quiz');

const FOLDER_MAP = {
  '러셀3':        { oldLevel: 'RUSSELL_2',      newLevel: 'RUSSELL_3',      oldId: 'dq-RUSSELL_2-',      newId: 'dq-RUSSELL_3-' },
  '소쉬르2':      { oldLevel: 'SAUSSURE_3',     newLevel: 'SAUSSURE_2',     oldId: 'dq-SAUSSURE_3-',     newId: 'dq-SAUSSURE_2-' },
  '비트겐슈타인2': { oldLevel: 'WITTGENSTEIN_1', newLevel: 'WITTGENSTEIN_2', oldId: 'dq-WITTGENSTEIN_1-', newId: 'dq-WITTGENSTEIN_2-' },
  '비트겐슈타인3': { oldLevel: 'WITTGENSTEIN_1', newLevel: 'WITTGENSTEIN_3', oldId: 'dq-WITTGENSTEIN_1-', newId: 'dq-WITTGENSTEIN_3-' },
  '프레게1':      { oldLevel: 'FREGE_2',        newLevel: 'FREGE_1',        oldId: 'dq-FREGE_2-',        newId: 'dq-FREGE_1-' },
};

let totalFixed = 0;
let totalSkipped = 0;
let totalErrors = 0;

for (const [folder, { oldLevel, newLevel, oldId, newId }] of Object.entries(FOLDER_MAP)) {
  const dir = path.join(QUIZ_DIR, folder);
  if (!fs.existsSync(dir)) { console.log(`SKIP (없음): ${folder}`); continue; }

  const files = fs.readdirSync(dir).filter(n => /^\d{3}\.json$/.test(n));
  console.log(`\n${folder}: ${files.length}개 파일`);

  for (const fname of files) {
    const abs = path.join(dir, fname);
    let text;
    try { text = fs.readFileSync(abs, 'utf8'); } catch { totalErrors++; continue; }

    let doc;
    try { doc = JSON.parse(text); } catch (e) { console.log(`  ERR parse: ${fname} ${e.message.substring(0, 60)}`); totalErrors++; continue; }

    let changed = false;

    // contentId 수정
    if (doc.contentId && doc.contentId.startsWith(oldId)) {
      doc.contentId = doc.contentId.replace(oldId, newId);
      changed = true;
    } else if (doc.contentId && !doc.contentId.startsWith(newId)) {
      console.log(`  WARN: ${fname} contentId 예상값 아님: ${doc.contentId}`);
    }

    // targetLevel 수정
    if (doc.targetLevel === oldLevel) {
      doc.targetLevel = newLevel;
      changed = true;
    } else if (doc.targetLevel !== newLevel) {
      console.log(`  WARN: ${fname} targetLevel 예상값 아님: ${doc.targetLevel}`);
    }

    // payload.contentId 수정 (있는 경우)
    if (doc.payload?.contentId && doc.payload.contentId.startsWith(oldId)) {
      doc.payload.contentId = doc.payload.contentId.replace(oldId, newId);
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(abs, JSON.stringify(doc, null, 2), 'utf8');
      totalFixed++;
    } else {
      totalSkipped++;
    }
  }
}

console.log(`\n완료: 수정 ${totalFixed}건, 스킵 ${totalSkipped}건, 에러 ${totalErrors}건`);
