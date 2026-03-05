#!/usr/bin/env node
/**
 * 진단 테스트 v2 JSON 데이터 → Flyway 시드 SQL 생성 스크립트.
 *
 * 사용법: node generate_diagnostic_seed_sql.mjs
 * 출력: backend/src/main/resources/db/migration/V0022__seed_diagnostic_v2_data.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(PROJECT_ROOT, '진단 테스트 v2', 'data');
const OUTPUT_PATH = path.join(
  __dirname, '..', 'src', 'main', 'resources', 'db', 'migration',
  'V0022__seed_diagnostic_v2_data.sql'
);

const TIER_DIRS = ['sohssure', 'frege', 'russell', 'wittgenstein'];

function sqlEscape(s) {
  if (s === null || s === undefined) return 'NULL';
  s = String(s);
  s = s.replace(/\\/g, '\\\\');
  s = s.replace(/'/g, "\\'");
  s = s.replace(/\r/g, '');
  s = s.replace(/\n/g, '\\n');
  return `'${s}'`;
}

function jsonSql(obj) {
  if (obj === null || obj === undefined) return 'NULL';
  return sqlEscape(JSON.stringify(obj));
}

function main() {
  const lines = [];
  lines.push('-- 진단 테스트 v2 시드 데이터: 26개 지문 + 260개 문항');
  lines.push('-- 자동 생성됨 (generate_diagnostic_seed_sql.mjs)');
  lines.push('');
  lines.push('-- 지문 INSERT');

  let passageCount = 0;
  let questionCount = 0;

  // 모든 지문 디렉토리 수집
  const passageDirs = [];
  for (const tier of TIER_DIRS) {
    const tierDir = path.join(DATA_DIR, tier);
    if (!fs.existsSync(tierDir)) continue;
    const dirs = fs.readdirSync(tierDir).sort();
    for (const pdir of dirs) {
      const ppath = path.join(tierDir, pdir);
      if (fs.statSync(ppath).isDirectory() && fs.existsSync(path.join(ppath, 'metadata.json'))) {
        passageDirs.push({ tier, pdir, ppath });
      }
    }
  }

  // 지문 INSERT
  for (const { tier, ppath } of passageDirs) {
    const meta = JSON.parse(fs.readFileSync(path.join(ppath, 'metadata.json'), 'utf-8'));
    const textMd = fs.readFileSync(path.join(ppath, 'passage.md'), 'utf-8').trim();

    lines.push(
      `INSERT INTO diag_passages (id, tier, level, genre, text_md) VALUES ` +
      `(${sqlEscape(meta.passage_id)}, ${sqlEscape(tier)}, ${meta.level}, ${sqlEscape(meta.genre)}, ${sqlEscape(textMd)});`
    );
    passageCount++;
  }

  lines.push('');
  lines.push('-- 문항 INSERT');

  // 문항 INSERT
  for (const { tier, ppath } of passageDirs) {
    const meta = JSON.parse(fs.readFileSync(path.join(ppath, 'metadata.json'), 'utf-8'));
    const passageId = meta.passage_id;
    const questionsDir = path.join(ppath, 'questions');

    if (!fs.existsSync(questionsDir)) continue;

    const qFiles = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json')).sort();
    for (let idx = 0; idx < qFiles.length; idx++) {
      const q = JSON.parse(fs.readFileSync(path.join(questionsDir, qFiles[idx]), 'utf-8'));

      const qid = q.question_id;
      const qtype = q.question.type;
      const stem = q.question.stem;
      const box = q.question.box || null;
      const correct = q.correct_choice || null;
      const choices = q.choices || [];
      const modelAnswer = q.model_answer || null;
      const grading = q.grading_criteria || null;
      const pairId = q.pair_id || null;
      const orderInPassage = idx + 1;

      lines.push(
        `INSERT INTO diag_questions ` +
        `(id, passage_id, tier, question_type, stem, box_content, correct_choice, ` +
        `choices_json, model_answer, grading_criteria_json, pair_id, order_in_passage) VALUES ` +
        `(${sqlEscape(qid)}, ${sqlEscape(passageId)}, ${sqlEscape(tier)}, ` +
        `${sqlEscape(qtype)}, ${sqlEscape(stem)}, ${box !== null ? sqlEscape(box) : 'NULL'}, ` +
        `${correct !== null ? sqlEscape(correct) : 'NULL'}, ` +
        `${jsonSql(choices)}, ` +
        `${modelAnswer !== null ? sqlEscape(modelAnswer) : 'NULL'}, ` +
        `${grading !== null ? jsonSql(grading) : 'NULL'}, ` +
        `${pairId !== null ? sqlEscape(pairId) : 'NULL'}, ` +
        `${orderInPassage});`
      );
      questionCount++;
    }
  }

  // 파일 쓰기
  const outputPath = path.resolve(OUTPUT_PATH);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf-8');

  console.log(`생성 완료: ${outputPath}`);
  console.log(`  지문: ${passageCount}개`);
  console.log(`  문항: ${questionCount}개`);
}

main();
