// Day 1 dump 을 콘텐츠별 개별 파일로 분리
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', '_day001_full_dump.json'), 'utf8'));
const dir = path.join(ROOT, 'scripts', '_day001_per_content');
fs.mkdirSync(dir, { recursive: true });
for (const c of data) {
  fs.writeFileSync(path.join(dir, `${c.contentId}.json`), JSON.stringify(c, null, 2), 'utf8');
  console.log(`  ${c.contentId}.json`);
}
console.log('done');
