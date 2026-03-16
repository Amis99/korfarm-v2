import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, '프로모드 콘텐츠');

const TYPE_CONFIG = {
  logic:      { contentType: 'PRO_LOGIC',      area: 'LOGIC',      subArea: 'PRO', moduleKey: 'worksheet_quiz' },
  vocab:      { contentType: 'PRO_VOCAB',       area: 'VOCAB',      subArea: 'PRO', moduleKey: 'worksheet_quiz' },
  background: { contentType: 'PRO_BACKGROUND',  area: 'BACKGROUND', subArea: 'PRO', moduleKey: 'worksheet_quiz' },
};

const range = (s, e) => Array.from({ length: e - s + 1 }, (_, i) => s + i);

const defs = [
  { folder: '프레게1', levelId: 'FREGE_1', type: 'logic', chapters: range(1, 20) },
  { folder: '프레게2', levelId: 'FREGE_2', type: 'logic', chapters: range(1, 20) },
  { folder: '프레게2', levelId: 'FREGE_2', type: 'background', chapters: range(1, 20).filter(n => n !== 5) },
  { folder: '프레게3', levelId: 'FREGE_3', type: 'vocab', chapters: range(1, 20) },
  { folder: '프레게3', levelId: 'FREGE_3', type: 'background', chapters: range(1, 20) },
  { folder: '소쉬르3', levelId: 'SAUSSURE_3', type: 'logic', chapters: [5, 6] },
];

const items = [];
for (const def of defs) {
  const cfg = TYPE_CONFIG[def.type];
  for (const ch of def.chapters) {
    const chStr = String(ch).padStart(2, '0');
    const fp = path.join(CONTENT_DIR, def.folder, `ch${chStr}_${def.type}.json`);
    if (!fs.existsSync(fp)) { console.error('NOT FOUND:', fp); continue; }
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

const outPath = path.join(ROOT, 'generated', 'new-pro-items.json');
fs.writeFileSync(outPath, JSON.stringify({ items }, null, 2), 'utf8');
console.log(`생성 완료: ${items.length}개 항목 → ${outPath}`);
