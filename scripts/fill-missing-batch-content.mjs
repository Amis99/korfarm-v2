/**
 * 프로모드 콘텐츠 폴더에서 누락된 콘텐츠를 배치 임포트 파일에 추가하는 스크립트
 *
 * 누락 현황:
 * - FREGE_1: LOGIC 20개
 * - FREGE_2: LOGIC 20개, BACKGROUND 19개 (dayIndex=5 이미 존재)
 * - FREGE_3: VOCAB 20개, BACKGROUND 20개
 * - SAUSSURE_3: LOGIC 2개 (dayIndex=5,6)
 *
 * 사용법: node scripts/fill-missing-batch-content.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, '프로모드 콘텐츠');
const GENERATED_DIR = path.join(ROOT, 'generated');

// 콘텐츠 타입별 배치 임포트 래퍼 설정
const TYPE_CONFIG = {
  logic: {
    contentType: 'PRO_LOGIC',
    area: 'LOGIC',
    subArea: 'PRO',
    moduleKey: 'worksheet_quiz',
  },
  vocab: {
    contentType: 'PRO_VOCAB',
    area: 'VOCAB',
    subArea: 'PRO',
    moduleKey: 'worksheet_quiz',
  },
  background: {
    contentType: 'PRO_BACKGROUND',
    area: 'BACKGROUND',
    subArea: 'PRO',
    moduleKey: 'worksheet_quiz',
  },
};

// 레벨 매핑: 폴더명 → levelId
const LEVEL_MAP = {
  '소쉬르1': 'SAUSSURE_1',
  '소쉬르2': 'SAUSSURE_2',
  '소쉬르3': 'SAUSSURE_3',
  '프레게1': 'FREGE_1',
  '프레게2': 'FREGE_2',
  '프레게3': 'FREGE_3',
  '러셀1': 'RUSSELL_1',
  '러셀2': 'RUSSELL_2',
  '러셀3': 'RUSSELL_3',
};

// 역매핑: levelId → batch 파일명
const BATCH_FILE_MAP = {
  'SAUSSURE_1': 'batch-import-saussure_1.json',
  'SAUSSURE_2': 'batch-import-saussure_2.json',
  'SAUSSURE_3': 'batch-import-saussure_3.json',
  'FREGE_1': 'batch-import-frege_1.json',
  'FREGE_2': 'batch-import-frege_2.json',
  'FREGE_3': 'batch-import-frege_3.json',
  'RUSSELL_1': 'batch-import-russell_1.json',
  'RUSSELL_2': 'batch-import-russell_2.json',
  'RUSSELL_3': 'batch-import-russell_3.json',
};

// 추가할 콘텐츠 정의
const ADDITIONS = [
  // FREGE_1: LOGIC 전체 (20개)
  { folder: '프레게1', type: 'logic', chapters: range(1, 20) },
  // FREGE_2: LOGIC 전체 (20개)
  { folder: '프레게2', type: 'logic', chapters: range(1, 20) },
  // FREGE_2: BACKGROUND (dayIndex=5 제외, 19개)
  { folder: '프레게2', type: 'background', chapters: range(1, 20).filter(n => n !== 5) },
  // FREGE_3: VOCAB 전체 (20개)
  { folder: '프레게3', type: 'vocab', chapters: range(1, 20) },
  // FREGE_3: BACKGROUND 전체 (20개)
  { folder: '프레게3', type: 'background', chapters: range(1, 20) },
  // SAUSSURE_3: LOGIC dayIndex=5,6 (2개)
  { folder: '소쉬르3', type: 'logic', chapters: [5, 6] },
];

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function readContentFile(folder, type, chapter) {
  const chNum = String(chapter).padStart(2, '0');
  const filePath = path.join(CONTENT_DIR, folder, `ch${chNum}_${type}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ 파일 없음: ${filePath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function createBatchItem(content, levelId, type, dayIndex) {
  const config = TYPE_CONFIG[type];
  return {
    contentType: config.contentType,
    levelId: levelId,
    area: config.area,
    subArea: config.subArea,
    dayIndex: dayIndex,
    moduleKey: config.moduleKey,
    schemaVersion: '1.0',
    content: content,
  };
}

// 실행
console.log('=== 프로모드 누락 콘텐츠 배치 임포트 추가 스크립트 ===\n');

// 배치 파일별 추가 항목 수집
const batchAdditions = {}; // batchFile → items[]

let totalAdded = 0;

for (const addition of ADDITIONS) {
  const levelId = LEVEL_MAP[addition.folder];
  const batchFile = BATCH_FILE_MAP[levelId];
  console.log(`[${addition.folder}] ${addition.type.toUpperCase()} ${addition.chapters.length}개 추가 시도...`);

  if (!batchAdditions[batchFile]) {
    batchAdditions[batchFile] = [];
  }

  for (const ch of addition.chapters) {
    const content = readContentFile(addition.folder, addition.type, ch);
    if (!content) continue;
    const item = createBatchItem(content, levelId, addition.type, ch);
    batchAdditions[batchFile].push(item);
    totalAdded++;
  }
}

console.log(`\n총 ${totalAdded}개 항목 준비 완료\n`);

// 기존 배치 파일에 병합 후 저장
for (const [batchFile, newItems] of Object.entries(batchAdditions)) {
  const filePath = path.join(GENERATED_DIR, batchFile);
  const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const beforeCount = existing.items.length;

  // 중복 방지: (contentType, dayIndex) 조합 체크
  const existingKeys = new Set(
    existing.items.map(i => `${i.contentType}:${i.dayIndex}`)
  );

  let added = 0;
  for (const item of newItems) {
    const key = `${item.contentType}:${item.dayIndex}`;
    if (existingKeys.has(key)) {
      console.log(`  ⚠️ 이미 존재 (스킵): ${batchFile} - ${key}`);
      continue;
    }
    existing.items.push(item);
    existingKeys.add(key);
    added++;
  }

  // dayIndex 기준 정렬 (contentType → dayIndex 순)
  existing.items.sort((a, b) => {
    const typeOrder = ['PRO_READING', 'PRO_VOCAB', 'PRO_BACKGROUND', 'PRO_LOGIC', 'PRO_ANSWER'];
    const ta = typeOrder.indexOf(a.contentType);
    const tb = typeOrder.indexOf(b.contentType);
    if (ta !== tb) return ta - tb;
    return (a.dayIndex || 0) - (b.dayIndex || 0);
  });

  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf8');
  console.log(`✅ ${batchFile}: ${beforeCount} → ${existing.items.length} (${added}개 추가)`);
}

// 최종 결과 요약
console.log('\n=== 최종 결과 ===');
for (const batchFile of Object.keys(BATCH_FILE_MAP).map(k => BATCH_FILE_MAP[k])) {
  const filePath = path.join(GENERATED_DIR, batchFile);
  if (!fs.existsSync(filePath)) continue;
  const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const types = {};
  d.items.forEach(i => { types[i.contentType] = (types[i.contentType] || 0) + 1; });
  const summary = Object.entries(types).sort().map(([k, v]) => `${k}:${v}`).join(', ');
  console.log(`${batchFile} (${d.items.length}개): ${summary}`);
}
