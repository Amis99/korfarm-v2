#!/usr/bin/env node
/**
 * 12개 레벨 118일차 일일퀴즈 10번의 정적 파일 옛 데이터 dump → 작업용 JSON.
 * 출제자가 정독해서 새 CHOICE_COMPLEX_OX 데이터를 만드는 기초 자료.
 */
import fs from "node:fs";
import path from "node:path";

const PROJECT = path.resolve(import.meta.dirname, "..");
const TARGETS = [
  ["SAUSSURE_1", "소쉬르1"], ["SAUSSURE_2", "소쉬르2"], ["SAUSSURE_3", "소쉬르3"],
  ["FREGE_1", "프레게1"], ["FREGE_2", "프레게2"], ["FREGE_3", "프레게3"],
  ["RUSSELL_1", "러셀1"], ["RUSSELL_2", "러셀2"], ["RUSSELL_3", "러셀3"],
  ["WITTGENSTEIN_1", "비트겐슈타인1"], ["WITTGENSTEIN_2", "비트겐슈타인2"], ["WITTGENSTEIN_3", "비트겐슈타인3"],
];

const out = [];
for (const [lvl, folder] of TARGETS) {
  const p = path.join(PROJECT, "frontend/public/daily-quiz", folder, "118.json");
  if (!fs.existsSync(p)) {
    console.error(`[${lvl}] 정적 파일 없음`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  const payload = data.payload || data;
  const q10 = (payload.questions || [])[9];
  if (!q10) continue;
  out.push({
    level: lvl,
    folder,
    contentId: `dq-${lvl}-118`,
    stem: q10.stem,
    passage: q10.passage,
    choices: q10.choices,
    explanation: q10.explanation,
  });
}
fs.writeFileSync(path.join(PROJECT, "scripts/q10_authoring_source.json"), JSON.stringify(out, null, 2), "utf8");
console.log(`✓ ${out.length}건 dump → scripts/q10_authoring_source.json`);
