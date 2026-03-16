/**
 * 러셀1~3 VOCAB/BACKGROUND 콘텐츠 → 배치 임포트 JSON 생성
 * 출력: generated/russell-batch.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, '프로모드 콘텐츠');

const TYPE_CONFIG = {
  vocab:      { contentType: 'PRO_VOCAB',       area: 'VOCAB',      subArea: 'PRO', moduleKey: 'worksheet_quiz' },
  background: { contentType: 'PRO_BACKGROUND',  area: 'BACKGROUND', subArea: 'PRO', moduleKey: 'worksheet_quiz' },
};

const range = (s, e) => Array.from({ length: e - s + 1 }, (_, i) => s + i);

const defs = [
  { folder: '러셀1', levelId: 'RUSSELL_1', types: ['vocab', 'background'], chapters: range(1, 20) },
  { folder: '러셀2', levelId: 'RUSSELL_2', types: ['vocab', 'background'], chapters: range(1, 20) },
  { folder: '러셀3', levelId: 'RUSSELL_3', types: ['vocab', 'background'], chapters: range(1, 20) },
];

const items = [];
for (const def of defs) {
  for (const type of def.types) {
    const cfg = TYPE_CONFIG[type];
    for (const ch of def.chapters) {
      const chStr = String(ch).padStart(2, '0');
      const fp = path.join(CONTENT_DIR, def.folder, `ch${chStr}_${type}.json`);
      if (!fs.existsSync(fp)) {
        console.error('NOT FOUND:', fp);
        continue;
      }
      const content = JSON.parse(fs.readFileSync(fp, 'utf8'));
      items.push({
        content_type: cfg.contentType,
        level_id: def.levelId,
        area: cfg.area,
        sub_area: cfg.subArea,
        day_index: ch,
        module_key: cfg.moduleKey,
        schema_version: '1.0',
        content,
      });
    }
  }
}

const outPath = path.join(ROOT, 'generated', 'russell-batch.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ items }, null, 2), 'utf8');
console.log(`생성 완료: ${items.length}개 항목 → ${outPath}`);
