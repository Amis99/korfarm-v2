#!/usr/bin/env node
/**
 * batch-import 파일의 PRO_READING 콘텐츠를
 * 프로모드 콘텐츠/ 폴더의 수작업 독해 콘텐츠로 교체하는 스크립트
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const CONTENT_DIR = join(ROOT, '프로모드 콘텐츠');
const GEN_DIR = join(ROOT, 'generated');

const LEVEL_MAP = [
  { folder: '소쉬르1', file: 'saussure_1', levelId: 'SAUSSURE_1' },
  { folder: '소쉬르2', file: 'saussure_2', levelId: 'SAUSSURE_2' },
  { folder: '소쉬르3', file: 'saussure_3', levelId: 'SAUSSURE_3' },
  { folder: '프레게1', file: 'frege_1', levelId: 'FREGE_1' },
  { folder: '프레게2', file: 'frege_2', levelId: 'FREGE_2' },
  { folder: '프레게3', file: 'frege_3', levelId: 'FREGE_3' },
  { folder: '러셀1', file: 'russell_1', levelId: 'RUSSELL_1' },
];

// subArea 매핑: 수작업 콘텐츠 → batch-import 형식
const SUB_AREA_MAP = {
  'LITERATURE': '문학',
  'NONFICTION': '비문학',
};

let totalReplaced = 0;
let totalAdded = 0;

for (const level of LEVEL_MAP) {
  const batchPath = join(GEN_DIR, `batch-import-${level.file}.json`);
  if (!existsSync(batchPath)) {
    console.log(`스킵: ${batchPath} 없음`);
    continue;
  }

  const batch = JSON.parse(readFileSync(batchPath, 'utf8'));
  let replaced = 0;
  let added = 0;

  for (let ch = 1; ch <= 20; ch++) {
    const chStr = String(ch).padStart(2, '0');

    for (const [type, suffix] of [['literature', 'LITERATURE'], ['nonfiction', 'NONFICTION']]) {
      const contentPath = join(CONTENT_DIR, level.folder, `ch${chStr}_reading_${type}.json`);
      if (!existsSync(contentPath)) continue;

      let raw = readFileSync(contentPath, 'utf8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      const content = JSON.parse(raw);

      // batch-import에서 매칭되는 아이템 찾기
      const batchSubArea = SUB_AREA_MAP[suffix];
      const idx = batch.items.findIndex(item =>
        item.contentType === 'PRO_READING' &&
        item.dayIndex === ch &&
        (item.subArea === batchSubArea || item.subArea === suffix)
      );

      // batch-import 아이템 형식으로 변환
      // subArea는 반드시 한글(문학/비문학)을 사용해야 chapters-setup.json의
      // generatedId(pro_read_*_문학/비문학)와 일치함
      const batchItem = {
        contentType: 'PRO_READING',
        levelId: level.levelId,
        area: 'READING',
        subArea: batchSubArea,
        dayIndex: ch,
        moduleKey: 'reading_training',
        schemaVersion: '1.0',
        content: content,
      };

      if (idx >= 0) {
        batch.items[idx] = batchItem;
        replaced++;
      } else {
        // 기존에 없으면 추가
        batch.items.push(batchItem);
        added++;
      }
    }
  }

  writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
  console.log(`${level.folder}: ${replaced}개 교체, ${added}개 추가`);
  totalReplaced += replaced;
  totalAdded += added;
}

console.log(`\n완료: 총 ${totalReplaced}개 교체, ${totalAdded}개 추가`);
