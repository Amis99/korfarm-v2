// 4380 items → SQL 생성
// 출력: dr-replace.sql (트랜잭션, 기존 DAILY_READING 삭제 + 신규 INSERT)
const fs = require('fs');

const ITEMS = JSON.parse(fs.readFileSync(__dirname + '/dr-items.json', 'utf8'));
const OUT = __dirname + '/dr-replace.sql';

// MySQL 문자열 이스케이프 (UTF-8 안전)
function esc(s) {
  if (s === null || s === undefined) return 'NULL';
  return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\u0000/g, '') + "'";
}
function escJson(obj) {
  // mysql LONGTEXT에 들어가는 JSON. 단일 따옴표만 이스케이프.
  return "'" + JSON.stringify(obj).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
}

const NOW = '2026-04-18 12:00:00'; // 작업 일자

let sql = '';
sql += '-- 일일독해 4380건 일괄 교체\n';
sql += `-- 생성일: ${new Date().toISOString()}\n`;
sql += '-- 사용법: mysql ... < dr-replace.sql (트랜잭션 보호)\n\n';
sql += 'SET NAMES utf8mb4;\n';
sql += 'SET SESSION foreign_key_checks = 0;\n';
sql += 'START TRANSACTION;\n\n';

sql += '-- 1) 기존 DAILY_READING 삭제 (content_versions/edit_logs는 ON DELETE CASCADE 미설정 가정 → 명시 삭제)\n';
sql += `DELETE cv FROM content_versions cv INNER JOIN contents c ON cv.content_id = c.id WHERE c.content_type = 'DAILY_READING';\n`;
sql += `DELETE cel FROM content_edit_logs cel INNER JOIN contents c ON cel.content_id = c.id WHERE c.content_type = 'DAILY_READING';\n`;
sql += `DELETE FROM contents WHERE content_type = 'DAILY_READING';\n\n`;

// 2) contents 일괄 INSERT (배치 1000개씩)
const BATCH = 1000;
for (let i = 0; i < ITEMS.length; i += BATCH) {
  const slice = ITEMS.slice(i, i + BATCH);
  sql += '-- contents batch ' + (i / BATCH + 1) + '\n';
  sql += 'INSERT INTO contents (id, content_type, categories, level_id, chapter_id, title, status, area, sub_area, day_index, module_key, video_url, created_at, updated_at) VALUES\n';
  sql += slice.map((it) => {
    return `(${esc(it.contentId)}, 'DAILY_READING', '["DAILY_READING","READING"]', ${esc(it.levelId)}, NULL, ${esc(it.title)}, 'active', ${esc(it.area)}, ${esc(it.subArea)}, ${it.dayIndex}, 'daily_reading', NULL, '${NOW}', '${NOW}')`;
  }).join(',\n');
  sql += ';\n\n';
}

// 3) content_versions 일괄 INSERT (배치 200개씩, payload가 커서 작게)
const VBATCH = 200;
for (let i = 0; i < ITEMS.length; i += VBATCH) {
  const slice = ITEMS.slice(i, i + VBATCH);
  sql += '-- content_versions batch ' + (i / VBATCH + 1) + '\n';
  sql += 'INSERT INTO content_versions (id, content_id, schema_version, content_json, uploaded_by, approved_by, approved_at, created_at, updated_at) VALUES\n';
  sql += slice.map((it) => {
    // version id는 contentId-v1 형태로 결정적
    const vid = `cv-${it.contentId}-v1`;
    return `(${esc(vid)}, ${esc(it.contentId)}, '1.0', ${escJson(it.content)}, 'admin-batch', 'admin-batch', '${NOW}', '${NOW}', '${NOW}')`;
  }).join(',\n');
  sql += ';\n\n';
}

sql += '-- 검증\n';
sql += `SELECT COUNT(*) AS contents_count FROM contents WHERE content_type = 'DAILY_READING';\n`;
sql += `SELECT COUNT(*) AS versions_count FROM content_versions cv INNER JOIN contents c ON cv.content_id = c.id WHERE c.content_type = 'DAILY_READING';\n`;
sql += `SELECT level_id, COUNT(*) AS cnt FROM contents WHERE content_type = 'DAILY_READING' GROUP BY level_id ORDER BY level_id;\n\n`;

sql += 'COMMIT;\n';
sql += 'SET SESSION foreign_key_checks = 1;\n';

fs.writeFileSync(OUT, sql, 'utf8');
const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1);
console.log(`SQL 생성: ${OUT} (${sizeMB}MB)`);
console.log(`총 ${ITEMS.length} 건 INSERT (contents + content_versions)`);
