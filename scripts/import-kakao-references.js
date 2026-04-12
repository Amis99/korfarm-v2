#!/usr/bin/env node
/**
 * 카카오톡 대화 파일에서 조창훈 선생님의 학습 관련 메시지를 추출하여
 * ai_chat_references 테이블에 INSERT하는 SQL을 생성합니다.
 *
 * 사용법: node scripts/import-kakao-references.js > scripts/kakao_import.sql
 * 그 후: mysql -u root -p korfarm < scripts/kakao_import.sql
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "docs", "커뮤니티 대화 모음");
const SPEAKER = "국어농장주/조창훈";

// 학습/프로그램 관련 키워드 (이 키워드가 포함된 메시지만 추출)
const KEYWORDS = [
  "국어", "문법", "어휘", "독해", "독서", "수능", "내신", "모평", "비문학", "문학",
  "학습", "공부", "시험", "풀이", "문제", "점수", "성적", "등급", "역량",
  "국어농장", "농장", "퀴즈", "프로모드", "대결", "레벨", "소쉬르", "프레게", "러셀", "비트겐슈타인",
  "진단", "역량", "일일", "씨앗", "작물",
  "맞춤법", "띄어쓰기", "문장", "단어", "품사", "음운", "형태소",
  "교육", "교과", "평가원", "출제", "커리큘럼",
  "초등", "중학", "고등", "학부모", "학원", "선생님",
  "노력", "방법", "습관", "연습", "훈련",
];

// 유머/드립 키워드 (조창훈 스타일 유머 추출)
const HUMOR_MARKERS = [
  "ㅎㅎㅎ", "헉", "어쿠", "어랏", "^^;;;", "아닙니다", "골골",
];

const LINE_PATTERN = /^(\d{4}년 \d{1,2}월 \d{1,2}일 [오전후]+ \d{1,2}:\d{2}), (.+?) : (.+)$/;

// \r 제거를 위한 전처리
function cleanLine(line) {
  return line.replace(/\r/g, "").trim();
}

function parseDate(dateStr) {
  // "2023년 6월 19일 오후 4:32" → "2023-06-19 16:32:00"
  const m = dateStr.match(/(\d{4})년 (\d{1,2})월 (\d{1,2})일 (오전|오후) (\d{1,2}):(\d{2})/);
  if (!m) return null;
  let [, y, mo, d, ampm, h, min] = m;
  h = parseInt(h);
  if (ampm === "오후" && h < 12) h += 12;
  if (ampm === "오전" && h === 12) h = 0;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(h).padStart(2, "0")}:${min}:00`;
}

function escapeSQL(str) {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

function isRelevant(content) {
  const lower = content.toLowerCase();
  return KEYWORDS.some((k) => lower.includes(k));
}

function isHumor(content) {
  return HUMOR_MARKERS.some((k) => content.includes(k)) && content.length > 10 && content.length < 200;
}

// 파일 파싱
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".txt") && !f.includes("metadata"));
const messages = [];

for (const file of files) {
  const text = fs.readFileSync(path.join(DIR, file), "utf-8");
  const lines = text.split("\n");
  let currentMsg = null;

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    const match = line.match(LINE_PATTERN);
    if (match) {
      if (currentMsg && currentMsg.speaker === SPEAKER) {
        messages.push(currentMsg);
      }
      currentMsg = {
        date: parseDate(match[1]),
        speaker: match[2].trim(),
        content: match[3].trim(),
      };
    } else if (currentMsg && line) {
      currentMsg.content += "\n" + line;
    }
  }
  if (currentMsg && currentMsg.speaker === SPEAKER) {
    messages.push(currentMsg);
  }
}

// 필터링: 학습 관련 + 유머 (너무 짧거나 시스템 메시지 제외)
const filtered = messages.filter((m) => {
  if (m.content.length < 5) return false;
  if (m.content.startsWith("사진")) return false;
  if (m.content.startsWith("삭제된")) return false;
  if (m.content.startsWith("http")) return false;
  return isRelevant(m.content) || isHumor(m.content);
});

// 중복 제거 (같은 내용)
const seen = new Set();
const unique = filtered.filter((m) => {
  const key = m.content.substring(0, 50);
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// SQL 생성
console.log("-- 카카오톡 대화에서 추출한 조창훈 선생님 발언 (" + unique.length + "건)");
console.log("-- 생성일: " + new Date().toISOString().split("T")[0]);
console.log("");

let idx = 0;
for (const m of unique) {
  idx++;
  const id = `ref_kakao_${String(idx).padStart(4, "0")}`;
  const source = isHumor(m.content) && !isRelevant(m.content) ? "kakao_humor" : "kakao_cho";
  const date = m.date ? `'${m.date}'` : "NULL";
  const content = escapeSQL(m.content.substring(0, 2000)); // 최대 2000자
  console.log(`INSERT IGNORE INTO ai_chat_references (id, source, speaker, content, spoken_at) VALUES ('${id}', '${source}', '${escapeSQL(SPEAKER)}', '${content}', ${date});`);
}

console.log("");
console.log("-- 총 " + unique.length + "건 INSERT 완료");
process.stderr.write(`추출 완료: ${messages.length}건 중 ${unique.length}건 선별\n`);
