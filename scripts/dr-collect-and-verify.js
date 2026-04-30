// 일일독해 4380건 수집·검증 스크립트
// 출력: 검증 결과 + items.json (SQL 생성에 사용)
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지-codex-audit/frontend/public/daily-reading';
const OUT = 'C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/scripts/dr-items.json';

const DIRS = [
  { folder: 'saussure1',     pattern: /^(\d{3})\.json$/ },
  { folder: 'saussure2',     pattern: /^s2_(\d{3})\.json$/ },
  { folder: 'saussure3',     pattern: /^(\d{3})\.json$/ },
  { folder: 'frege1',        pattern: /^(\d{3})\.json$/ },
  { folder: 'frege2',        pattern: /^(\d{3})\.json$/ },
  { folder: 'frege3',        pattern: /^(\d{3})\.json$/ },
  { folder: 'russell1',      pattern: /^(\d{3})\.json$/ },
  { folder: 'russell2',      pattern: /^(\d{3})\.json$/ },
  { folder: 'russell3',      pattern: /^(\d{3})\.json$/ },
  { folder: 'wittgenstein1', pattern: /^(\d{3})\.json$/ },
  { folder: 'wittgenstein2', pattern: /^(\d{3})\.json$/ },
  { folder: 'wittgenstein3', pattern: /^(\d{3})\.json$/ },
];

const items = [];
const ids = new Set();
const errors = [];
const folderCounts = {};

DIRS.forEach(({ folder, pattern }) => {
  const dir = path.join(ROOT, folder);
  if (!fs.existsSync(dir)) {
    errors.push(`폴더 없음: ${folder}`);
    return;
  }
  let count = 0;
  fs.readdirSync(dir).forEach((f) => {
    const m = f.match(pattern);
    if (!m) return;
    const day = parseInt(m[1], 10);
    if (day < 1 || day > 365) return; // 366 무시
    let j;
    try {
      j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    } catch (e) {
      errors.push(`JSON 파싱 실패 ${folder}/${f}: ${e.message}`);
      return;
    }
    // 메타 누락 시 폴더·파일명에서 자동 보충 (예: russell1/293.json → dr-r1-293, RUSSELL_1)
    const idPrefixMap = {
      saussure1: 'dr-saussure1', saussure2: 'dr-s2', saussure3: 'dr-saussure3',
      frege1: 'dr-frege1', frege2: 'dr-frege2', frege3: 'dr-frege3',
      russell1: 'dr-r1', russell2: 'dr-r2', russell3: 'dr-r3',
      wittgenstein1: 'dr-w1', wittgenstein2: 'dr-w2', wittgenstein3: 'dr-w3',
    };
    const levelMap = {
      saussure1: 'SAUSSURE_1', saussure2: 'SAUSSURE_2', saussure3: 'SAUSSURE_3',
      frege1: 'FREGE_1', frege2: 'FREGE_2', frege3: 'FREGE_3',
      russell1: 'RUSSELL_1', russell2: 'RUSSELL_2', russell3: 'RUSSELL_3',
      wittgenstein1: 'WITTGENSTEIN_1', wittgenstein2: 'WITTGENSTEIN_2', wittgenstein3: 'WITTGENSTEIN_3',
    };
    const dayStr = m[1];
    if (!j.contentId) {
      j.contentId = `${idPrefixMap[folder]}-${dayStr}`;
      console.warn(`[보충] ${folder}/${f} contentId → ${j.contentId}`);
    }
    if (!j.targetLevel) {
      j.targetLevel = levelMap[folder];
      console.warn(`[보충] ${folder}/${f} targetLevel → ${j.targetLevel}`);
    }
    if (!j.contentType) {
      j.contentType = 'DAILY_READING';
      console.warn(`[보충] ${folder}/${f} contentType → DAILY_READING`);
    }
    if (!j.payload) { errors.push(`payload 없음 ${folder}/${f}`); return; }
    if (ids.has(j.contentId)) {
      errors.push(`contentId 중복 ${j.contentId} (${folder}/${f})`);
      return;
    }
    ids.add(j.contentId);
    items.push({
      contentId: j.contentId,
      title: j.title || '',
      area: j.area || null,
      subArea: j.subArea || null,
      levelId: j.targetLevel,
      dayIndex: day,
      folder,
      file: f,
      // payload만 DB에 저장. 전체 j도 저장 가능하지만 필요 필드만 정리.
      content: j,
    });
    count++;
  });
  folderCounts[folder] = count;
});

console.log('=== 폴더별 수집 ===');
Object.entries(folderCounts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
console.log(`총 ${items.length}건 (목표 4380)`);
console.log(`에러 ${errors.length}건`);
errors.slice(0, 30).forEach((e) => console.log('  -', e));

// payload 크기 통계
const sizes = items.map((it) => JSON.stringify(it.content).length);
sizes.sort((a, b) => a - b);
const sum = sizes.reduce((a, b) => a + b, 0);
console.log(`payload 크기: 평균 ${Math.round(sum/sizes.length)}B, 최대 ${sizes[sizes.length-1]}B, 합계 ${(sum/1024/1024).toFixed(1)}MB`);

fs.writeFileSync(OUT, JSON.stringify(items));
console.log(`출력: ${OUT}`);
