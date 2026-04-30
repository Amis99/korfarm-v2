// confirm 섹션만 원본 dump 에서 fixed 로 복원 (한국어 텍스트 변경 X — 단순 복사).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

const ids = [
  'dr-saussure1-119',
  'dr-s2-119',
  'dr-saussure3-119',
  'dr-frege1-119',
  'dr-frege2-119',
];

for (const id of ids) {
  const dumpPath = path.join(ROOT, 'scripts', '_dr_119_dump', `${id}.json`);
  const fixedPath = path.join(ROOT, 'scripts', '_dr_119_fixed', `${id}.json`);
  const orig = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
  const fixed = JSON.parse(fs.readFileSync(fixedPath, 'utf8'));
  fixed.payload.payload.confirm = orig.payload.payload.confirm;
  fs.writeFileSync(fixedPath, JSON.stringify(fixed, null, 2), 'utf8');
  console.log(`✓ ${id} confirm 복원`);
}
