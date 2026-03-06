#!/usr/bin/env node
// 프로 모드 콘텐츠 결손 보완 — 메인 실행 스크립트
// 306개 콘텐츠 + 81 테스트 세트 생성

const fs = require('fs');
const path = require('path');
const config = require('./gen-config');
const topics = require('./gen-topics');
const gen = require('./gen-generators');

const ROOT = path.resolve(__dirname, '..');
const GEN_DIR = path.join(ROOT, 'generated');

// ===== Step 1: 누락 콘텐츠 생성 =====
console.log('===== Step 1: 누락 콘텐츠 생성 =====\n');

let totalCreated = 0;

// --- A. PRO_READING 누락 ---
console.log('--- A. PRO_READING 생성 ---');
for (const [levelId, spec] of Object.entries(config.MISSING_READING)) {
  const filePath = path.join(GEN_DIR, `batch-import-${config.LEVEL_FILE[levelId]}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let topicPool;
  if (spec.subArea === '문법') {
    topicPool = levelId === 'SAUSSURE_3'
      ? topics.GRAMMAR_TOPICS_SAUSSURE3
      : topics.GRAMMAR_TOPICS_FREGE1;
  } else { // 개념
    topicPool = levelId.startsWith('FREGE')
      ? topics.CONCEPT_TOPICS_FREGE3
      : topics.CONCEPT_TOPICS_RUSSELL;
  }

  let created = 0;
  for (const ch of spec.chapters) {
    // 이미 존재하는지 확인
    const exists = data.items.some(
      i => i.contentType === 'PRO_READING' && i.subArea === spec.subArea && i.dayIndex === ch
    );
    if (exists) {
      console.log(`  [건너뜀] ${config.LEVEL_KR[levelId]} ch${ch} ${spec.subArea} READING (이미 존재)`);
      continue;
    }

    const topicIdx = (ch - 1) % topicPool.length;
    const topic = topicPool[topicIdx];
    const item = gen.generateReading(levelId, ch, spec.subArea, topic);
    data.items.push(item);
    created++;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ${config.LEVEL_KR[levelId]} ${spec.subArea} READING: ${created}개 생성`);
  totalCreated += created;
}

// --- B. PRO_LOGIC 누락 ---
console.log('\n--- B. PRO_LOGIC 생성 ---');
for (const [levelId, chapters] of Object.entries(config.MISSING_LOGIC)) {
  const filePath = path.join(GEN_DIR, `batch-import-${config.LEVEL_FILE[levelId]}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let created = 0;
  for (const ch of chapters) {
    const exists = data.items.some(
      i => i.contentType === 'PRO_LOGIC' && i.dayIndex === ch
    );
    if (exists) {
      console.log(`  [건너뜀] ${config.LEVEL_KR[levelId]} ch${ch} LOGIC (이미 존재)`);
      continue;
    }

    const item = levelId.startsWith('SAUSSURE')
      ? gen.generateLogicSaussure(levelId, ch)
      : gen.generateLogicFrege(levelId, ch);
    data.items.push(item);
    created++;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ${config.LEVEL_KR[levelId]} LOGIC: ${created}개 생성`);
  totalCreated += created;
}

// --- C. PRO_VOCAB 누락 ---
console.log('\n--- C. PRO_VOCAB 생성 ---');
for (const [levelId, chapters] of Object.entries(config.MISSING_VOCAB)) {
  const filePath = path.join(GEN_DIR, `batch-import-${config.LEVEL_FILE[levelId]}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let created = 0;
  for (const ch of chapters) {
    const exists = data.items.some(
      i => i.contentType === 'PRO_VOCAB' && i.dayIndex === ch
    );
    if (exists) {
      console.log(`  [건너뜀] ${config.LEVEL_KR[levelId]} ch${ch} VOCAB (이미 존재)`);
      continue;
    }

    const item = gen.generateVocab(levelId, ch);
    data.items.push(item);
    created++;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ${config.LEVEL_KR[levelId]} VOCAB: ${created}개 생성`);
  totalCreated += created;
}

// --- D. PRO_BACKGROUND 누락 ---
console.log('\n--- D. PRO_BACKGROUND 생성 ---');
for (const [levelId, chapters] of Object.entries(config.MISSING_BACKGROUND)) {
  const filePath = path.join(GEN_DIR, `batch-import-${config.LEVEL_FILE[levelId]}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let created = 0;
  for (const ch of chapters) {
    const exists = data.items.some(
      i => i.contentType === 'PRO_BACKGROUND' && i.dayIndex === ch
    );
    if (exists) {
      console.log(`  [건너뜀] ${config.LEVEL_KR[levelId]} ch${ch} BACKGROUND (이미 존재)`);
      continue;
    }

    const item = gen.generateBackground(levelId, ch);
    data.items.push(item);
    created++;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ${config.LEVEL_KR[levelId]} BACKGROUND: ${created}개 생성`);
  totalCreated += created;
}

console.log(`\n총 콘텐츠 생성: ${totalCreated}개`);

// ===== Step 2: 테스트 생성 =====
console.log('\n===== Step 2: 테스트 생성 =====\n');

const testsPath = path.join(GEN_DIR, 'tests-setup.json');
const testsData = JSON.parse(fs.readFileSync(testsPath, 'utf8'));
let testsCreated = 0;

for (const [levelId, chapters] of Object.entries(config.MISSING_TESTS)) {
  for (const ch of chapters) {
    const chId = config.chapterId(levelId, ch);
    const exists = testsData.some(t => t.chapterId === chId);
    if (exists) {
      console.log(`  [건너뜀] ${config.LEVEL_KR[levelId]} ch${ch} 테스트 (이미 존재)`);
      continue;
    }

    const test = gen.generateTest(levelId, ch);
    testsData.push(test);
    testsCreated++;
  }
  console.log(`  ${config.LEVEL_KR[levelId]} 테스트: ${chapters.length}개 처리`);
}

fs.writeFileSync(testsPath, JSON.stringify(testsData, null, 2), 'utf8');
console.log(`총 테스트 생성: ${testsCreated}세트`);

// ===== Step 3: chapters-setup.json 업데이트 =====
console.log('\n===== Step 3: chapters-setup.json 업데이트 =====\n');

const chaptersPath = path.join(GEN_DIR, 'chapters-setup.json');
const chaptersData = JSON.parse(fs.readFileSync(chaptersPath, 'utf8'));

let chaptersUpdated = 0;
for (const chapter of chaptersData) {
  const levelId = chapter.levelId;
  const ch = chapter.chapterNumber;

  // 해당 챕터에 필요한 reading 영역 결정
  const areas = config.getReadingAreas(levelId, ch);

  // 기존 reading 항목 제거 후 새로 구성
  const nonReadingItems = chapter.items.filter(i => i.type !== 'reading');
  const readingItems = areas.map((area, idx) => ({
    type: 'reading',
    contentId: config.readingContentId(levelId, ch, area),
    order: idx + 1,
    label: `독해 — ${area}`,
  }));

  let nextOrder = readingItems.length + 1;

  // vocab
  const vocabItem = { type: 'vocab', contentId: config.vocabContentId(levelId, ch), order: nextOrder++ };
  // background
  const bgItem = { type: 'background', contentId: config.bgContentId(levelId, ch), order: nextOrder++ };
  // logic
  const logicItem = { type: 'logic', contentId: config.logicContentId(levelId, ch), order: nextOrder++ };
  // answer
  const answerItem = { type: 'answer', contentId: config.answerContentId(levelId, ch), order: nextOrder++ };
  // test
  const testItem = { type: 'test', contentId: null, order: nextOrder++ };

  chapter.items = [...readingItems, vocabItem, bgItem, logicItem, answerItem, testItem];
  chaptersUpdated++;
}

fs.writeFileSync(chaptersPath, JSON.stringify(chaptersData, null, 2), 'utf8');
console.log(`chapters-setup.json: ${chaptersUpdated}개 챕터 업데이트`);

// ===== Step 4: id-mapping.json 업데이트 =====
console.log('\n===== Step 4: id-mapping.json 업데이트 =====\n');

const mappingPath = path.join(GEN_DIR, 'id-mapping.json');
const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
const existingIds = new Set(mappingData.map(m => m.generatedId));

let mappingsAdded = 0;

// 모든 배치 파일 순회하여 매핑 확인
const allLevels = Object.keys(config.LEVEL_FILE);
for (const levelId of allLevels) {
  const filePath = path.join(GEN_DIR, `batch-import-${config.LEVEL_FILE[levelId]}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const item of data.items) {
    let genId;
    if (item.contentType === 'PRO_READING') {
      genId = config.readingContentId(levelId, item.dayIndex, item.subArea);
    } else if (item.contentType === 'PRO_VOCAB') {
      genId = config.vocabContentId(levelId, item.dayIndex);
    } else if (item.contentType === 'PRO_BACKGROUND') {
      genId = config.bgContentId(levelId, item.dayIndex);
    } else if (item.contentType === 'PRO_LOGIC') {
      genId = config.logicContentId(levelId, item.dayIndex);
    } else if (item.contentType === 'PRO_ANSWER') {
      genId = config.answerContentId(levelId, item.dayIndex);
    } else {
      continue;
    }

    if (!existingIds.has(genId)) {
      mappingData.push({
        generatedId: genId,
        contentType: item.contentType,
        levelId,
        dayIndex: item.dayIndex,
      });
      existingIds.add(genId);
      mappingsAdded++;
    }
  }
}

fs.writeFileSync(mappingPath, JSON.stringify(mappingData, null, 2), 'utf8');
console.log(`id-mapping.json: ${mappingsAdded}개 매핑 추가 (총 ${mappingData.length}개)`);

// ===== 검증 =====
console.log('\n===== 검증 =====\n');

let errors = 0;
for (const levelId of allLevels) {
  const filePath = path.join(GEN_DIR, `batch-import-${config.LEVEL_FILE[levelId]}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (let ch = 1; ch <= 20; ch++) {
    const areas = config.getReadingAreas(levelId, ch);
    for (const area of areas) {
      const has = data.items.some(
        i => i.contentType === 'PRO_READING' && i.subArea === area && i.dayIndex === ch
      );
      if (!has) {
        console.log(`  [오류] ${config.LEVEL_KR[levelId]} ch${ch} ${area} READING 누락`);
        errors++;
      }
    }

    // VOCAB 확인
    const hasVocab = data.items.some(i => i.contentType === 'PRO_VOCAB' && i.dayIndex === ch);
    if (!hasVocab) {
      console.log(`  [오류] ${config.LEVEL_KR[levelId]} ch${ch} VOCAB 누락`);
      errors++;
    }

    // BACKGROUND 확인
    const hasBg = data.items.some(i => i.contentType === 'PRO_BACKGROUND' && i.dayIndex === ch);
    if (!hasBg) {
      console.log(`  [오류] ${config.LEVEL_KR[levelId]} ch${ch} BACKGROUND 누락`);
      errors++;
    }

    // LOGIC 확인
    const hasLogic = data.items.some(i => i.contentType === 'PRO_LOGIC' && i.dayIndex === ch);
    if (!hasLogic) {
      console.log(`  [오류] ${config.LEVEL_KR[levelId]} ch${ch} LOGIC 누락`);
      errors++;
    }

    // ANSWER 확인
    const hasAnswer = data.items.some(i => i.contentType === 'PRO_ANSWER' && i.dayIndex === ch);
    if (!hasAnswer) {
      console.log(`  [오류] ${config.LEVEL_KR[levelId]} ch${ch} ANSWER 누락`);
      errors++;
    }
  }
}

// 테스트 검증
const finalTests = JSON.parse(fs.readFileSync(testsPath, 'utf8'));
for (const levelId of allLevels) {
  for (let ch = 1; ch <= 20; ch++) {
    const chId = config.chapterId(levelId, ch);
    const hasTest = finalTests.some(t => t.chapterId === chId);
    if (!hasTest) {
      console.log(`  [오류] ${config.LEVEL_KR[levelId]} ch${ch} 테스트 누락`);
      errors++;
    }
  }
}

// chapters-setup 검증
const finalChapters = JSON.parse(fs.readFileSync(chaptersPath, 'utf8'));
for (const chapter of finalChapters) {
  const readings = chapter.items.filter(i => i.type === 'reading');
  const expectedAreas = config.getReadingAreas(chapter.levelId, chapter.chapterNumber);
  if (readings.length !== expectedAreas.length) {
    console.log(`  [오류] ${chapter.chapterId}: reading ${readings.length}개 (기대: ${expectedAreas.length}개)`);
    errors++;
  }
}

if (errors === 0) {
  console.log('  모든 검증 통과!');
} else {
  console.log(`\n  ${errors}개 오류 발견`);
}

console.log('\n===== 완료 =====');
console.log(`콘텐츠: ${totalCreated}개, 테스트: ${testsCreated}세트, 챕터: ${chaptersUpdated}개 업데이트, 매핑: ${mappingsAdded}개 추가`);
