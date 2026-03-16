/**
 * 일일퀴즈/독해 → 배치 임포트 JSON 생성
 * 레벨별로 분할 파일 생성 (파일 크기 관리)
 *
 * 출력: generated/daily-batch-{type}-{level}.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'generated');

const LEVELS = [
  'saussure1', 'saussure2', 'saussure3',
  'frege1', 'frege2', 'frege3',
  'russell1', 'russell2', 'russell3',
  'wittgenstein1', 'wittgenstein2', 'wittgenstein3',
];

function folderToLevelId(folder) {
  const m = folder.match(/^([a-z]+)(\d+)$/);
  return m ? `${m[1].toUpperCase()}_${m[2]}` : folder;
}

const TYPES = [
  {
    folder: 'daily-quiz',
    contentType: 'DAILY_QUIZ',
    moduleKey: 'worksheet_quiz',
    prefix: 'quiz',
  },
  {
    folder: 'daily-reading',
    contentType: 'DAILY_READING',
    moduleKey: 'reading_training',
    prefix: 'reading',
  },
];

let totalFiles = 0;

for (const type of TYPES) {
  const baseDir = path.join(ROOT, 'frontend', 'public', type.folder);

  for (const level of LEVELS) {
    const levelDir = path.join(baseDir, level);
    if (!fs.existsSync(levelDir)) continue;

    const levelId = folderToLevelId(level);
    const files = fs.readdirSync(levelDir)
      .filter(f => /^\d{3}\.json$/.test(f))
      .sort();

    if (files.length === 0) continue;

    const items = [];
    for (const file of files) {
      const dayIndex = parseInt(file.replace('.json', ''), 10);
      let raw = fs.readFileSync(path.join(levelDir, file), 'utf8');
      // BOM 제거
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      let content;
      try {
        content = JSON.parse(raw);
      } catch (e) {
        console.error(`  ⚠️ JSON 파싱 실패: ${type.folder}/${level}/${file} — ${e.message}`);
        continue;
      }

      items.push({
        content_type: type.contentType,
        level_id: levelId,
        area: content.area || 'GENERAL',
        sub_area: content.subArea || 'DAILY',
        day_index: dayIndex,
        module_key: type.moduleKey,
        schema_version: '1.0',
        content,
      });
    }

    const outFile = path.join(OUT, `daily-batch-${type.prefix}-${level}.json`);
    fs.writeFileSync(outFile, JSON.stringify({ items }, null, 2), 'utf8');
    console.log(`${type.prefix}/${level}: ${items.length}개 → ${path.basename(outFile)}`);
    totalFiles += items.length;
  }
}

console.log(`\n총 ${totalFiles}개 항목, ${TYPES.length * LEVELS.length}개 배치 파일 생성`);
