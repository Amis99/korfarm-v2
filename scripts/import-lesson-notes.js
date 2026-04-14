#!/usr/bin/env node
/**
 * 수업 노트 임포트: 마크다운 ## 헤더 기준 섹션 분할 → ai_chat_references 테이블.
 * 사용법: node scripts/import-lesson-notes.js 2>/dev/null > scripts/lesson_import.sql
 */
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "docs", "수업노트_모음.txt");

function escapeSQL(str) {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

const raw = fs.readFileSync(FILE, "utf-8").replace(/^\uFEFF/, "");
const lines = raw.split(/\r?\n/);

// ## 헤더 기준 섹션 분할
const sections = [];
let current = null;

for (const line of lines) {
  if (line.match(/^##\s+/)) {
    if (current && current.content.trim()) sections.push(current);
    const title = line.replace(/^#+\s*/, "").trim();
    current = { title, content: "" };
  } else if (line.match(/^#\s+/) && !current) {
    // 최상위 # 제목은 전체 제목 → 섹션으로 시작
    const title = line.replace(/^#+\s*/, "").trim();
    current = { title, content: "" };
  } else if (current) {
    current.content += line + "\n";
  }
}
if (current && current.content.trim()) sections.push(current);

process.stderr.write(`섹션 ${sections.length}개 추출\n`);

// SQL 출력
console.log("-- 수업 노트 임포트");
console.log("-- 생성일: " + new Date().toISOString().split("T")[0]);
console.log("DELETE FROM ai_chat_references WHERE source = 'lesson_note';");
console.log("");

for (let i = 0; i < sections.length; i++) {
  const s = sections[i];
  const id = `ref_lesson_${String(i + 1).padStart(3, "0")}`;
  const topic = escapeSQL(s.title.substring(0, 100));
  const content = escapeSQL(s.content.trim().substring(0, 5000));
  console.log(`INSERT INTO ai_chat_references (id, source, topic, speaker, content) VALUES ('${id}', 'lesson_note', '${topic}', '조창훈', '${content}');`);
}

console.log("");
console.log(`-- 총 ${sections.length}건`);

const avgLen = Math.round(sections.reduce((s, c) => s + c.content.length, 0) / sections.length);
process.stderr.write(`평균 섹션 길이: ${avgLen}자\n`);
