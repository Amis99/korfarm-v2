#!/usr/bin/env node
/**
 * 카카오톡 대화 v2 임포트: 대화 맥락(Q&A 쌍) 보존 청킹.
 *
 * - 포맷 A: "YYYY년 M월 D일 오전/오후 H:MM, 닉네임 : 내용"
 * - 포맷 B: "[닉네임] [오전/오후 H:MM] 내용" + "--- YYYY년 M월 D일 ---"
 *
 * 사용법: node scripts/import-kakao-references-v2.js 2>/dev/null > scripts/kakao_import_v2.sql
 */
const fs = require("fs");

const FILES = [
  { path: "D:/AS2602200000035 조창훈/## DATA ##/Documents/국어농장 커뮤니티 1481 카카오톡 대화.txt", format: "A" },
  { path: "D:/AS2602200000035 조창훈/## DATA ##/Documents/국어농장커뮤니티0110.txt", format: "B" },
];

const CHO_NAMES = ["국어농장주/조창훈", "조창훈"];
const MIN_ANCHOR_LEN = 30;
const CONTEXT_BEFORE = 5;
const CONTEXT_AFTER = 3;
const MIN_CHUNK = 200;
const MAX_CHUNK = 1200;

// ─── 키워드 분류 ────────────────────────────────
const GRAMMAR_KW = ["문법", "맞춤법", "띄어쓰기", "품사", "음운", "형태소", "문장성분", "주술호응", "피동", "사동", "어미", "조사", "접사"];
const PROGRAM_KW = ["국어농장", "프로그램", "결제", "구독", "레벨", "소쉬르", "프레게", "러셀", "비트겐슈타인", "퀴즈", "독해", "프로모드", "농장모드", "씨앗", "대결"];
const PHILOSOPHY_KW = ["교육", "입시", "수능", "평가원", "모의고사", "내신", "교과", "커리큘럼", "킬러", "EBS", "교육과정"];
const HUMOR_MARKERS = ["ㅎㅎㅎ", "헉", "어쿠", "어랏", "^^;;;", "골골거리"];

function classify(content) {
  const c = content.toLowerCase();
  if (GRAMMAR_KW.some(k => c.includes(k))) return "kakao_grammar";
  if (PROGRAM_KW.some(k => c.includes(k))) return "kakao_program";
  if (PHILOSOPHY_KW.some(k => c.includes(k))) return "kakao_philosophy";
  const hasLearning = ["국어", "공부", "학습", "독서", "어휘", "독해", "문제", "시험", "점수", "풀이"].some(k => c.includes(k));
  if (hasLearning) return "kakao_advice";
  if (HUMOR_MARKERS.some(k => c.includes(k)) && content.length < 200) return "kakao_humor";
  return "kakao_advice";
}

function topicFromContent(content) {
  const c = content.toLowerCase();
  if (c.includes("음운") || c.includes("발음")) return "음운";
  if (c.includes("형태소") || c.includes("품사")) return "형태소/품사";
  if (c.includes("문법") || c.includes("맞춤법")) return "문법";
  if (c.includes("독해") || c.includes("비문학")) return "독해";
  if (c.includes("문학") || c.includes("소설") || c.includes("시")) return "문학";
  if (c.includes("수능") || c.includes("모의고사")) return "수능/입시";
  if (c.includes("내신")) return "내신";
  if (c.includes("어휘") || c.includes("단어")) return "어휘";
  if (c.includes("국어농장") || c.includes("프로그램")) return "프로그램안내";
  if (c.includes("초등")) return "초등학습";
  if (c.includes("중학") || c.includes("중등")) return "중등학습";
  if (c.includes("고등") || c.includes("고1") || c.includes("고2") || c.includes("고3")) return "고등학습";
  return null;
}

// ─── 파싱 ────────────────────────────────
const PATTERN_A = /^(\d{4}년 \d{1,2}월 \d{1,2}일 [오전후]+ \d{1,2}:\d{2}), (.+?) : (.+)$/;
const PATTERN_B = /^\[(.+?)\] \[([오전후]+\s*\d{1,2}:\d{2})\] (.+)$/;
const DATE_SEP_B = /^-+\s*(\d{4}년 \d{1,2}월 \d{1,2}일)\s*[^\n]*\s*-+$/;

function parseDate(dateStr) {
  const m = dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (!m) return null;
  return `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
}

function parseTime(dateStr) {
  const m = dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  let [, y, mo, d, ampm, h, min] = m;
  h = parseInt(h);
  if (ampm === "오후" && h < 12) h += 12;
  if (ampm === "오전" && h === 12) h = 0;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(h).padStart(2, "0")}:${min}:00`;
}

function parseTimeB(datePrefix, timeStr) {
  const m = timeStr.match(/(오전|오후)\s*(\d{1,2}):(\d{2})/);
  if (!m || !datePrefix) return null;
  let [, ampm, h, min] = m;
  h = parseInt(h);
  if (ampm === "오후" && h < 12) h += 12;
  if (ampm === "오전" && h === 12) h = 0;
  return `${datePrefix} ${String(h).padStart(2, "0")}:${min}:00`;
}

function parseFile(filePath, format) {
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/);
  const messages = [];
  let currentMsg = null;
  let currentDate = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (format === "A") {
      const match = line.match(PATTERN_A);
      if (match) {
        if (currentMsg) messages.push(currentMsg);
        currentMsg = {
          date: parseTime(match[1]),
          speaker: match[2].trim(),
          content: match[3].trim(),
        };
      } else if (currentMsg && !line.match(/^\d{4}년/)) {
        currentMsg.content += "\n" + line;
      }
    } else {
      // 포맷 B
      const dateSep = line.match(DATE_SEP_B);
      if (dateSep) {
        currentDate = parseDate(dateSep[1]);
        continue;
      }
      const match = line.match(PATTERN_B);
      if (match) {
        if (currentMsg) messages.push(currentMsg);
        currentMsg = {
          date: parseTimeB(currentDate, match[2].trim()),
          speaker: match[1].trim(),
          content: match[3].trim(),
        };
      } else if (currentMsg && !line.match(/님이 (들어왔|나갔)습니다/) && !line.match(/^-{3,}/)) {
        currentMsg.content += "\n" + line;
      }
    }
  }
  if (currentMsg) messages.push(currentMsg);
  return messages;
}

// ─── 청킹 ────────────────────────────────
function isChoSpeaker(speaker) {
  return CHO_NAMES.some(n => speaker.includes(n));
}

function isSystemMsg(content) {
  if (!content) return true;
  const c = content.trim();
  return c === "사진" || c.startsWith("삭제된 메시지") || c === "이모티콘"
    || c.match(/^https?:\/\//) || c.match(/님이 (들어왔|나갔)습니다/)
    || c.match(/채팅방 관리자가/) || c.length < 3;
}

function buildChunks(messages) {
  const chunks = [];
  const anchors = [];

  // 앵커 식별: 조창훈 발언 중 30자 이상, 시스템 메시지 아닌 것
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (isChoSpeaker(m.speaker) && m.content.length >= MIN_ANCHOR_LEN && !isSystemMsg(m.content)) {
      anchors.push(i);
    }
  }

  // 앵커 기준 윈도우 구성
  const used = new Set();
  let anchorIdx = 0;
  while (anchorIdx < anchors.length) {
    const startAnchor = anchors[anchorIdx];

    // 연속된 조창훈 메시지 합치기
    let endAnchor = startAnchor;
    while (anchorIdx + 1 < anchors.length && anchors[anchorIdx + 1] - endAnchor <= 2) {
      anchorIdx++;
      endAnchor = anchors[anchorIdx];
    }

    // 앞 맥락
    const contextStart = Math.max(0, startAnchor - CONTEXT_BEFORE);
    // 뒤 맥락
    const contextEnd = Math.min(messages.length - 1, endAnchor + CONTEXT_AFTER);

    const parts = [];
    for (let i = contextStart; i <= contextEnd; i++) {
      if (used.has(i)) continue;
      const m = messages[i];
      if (isSystemMsg(m.content)) continue;

      let label;
      if (isChoSpeaker(m.speaker)) {
        label = "[조쌤]";
      } else if (i < startAnchor) {
        label = "[질문]";
      } else {
        label = "[반응]";
      }
      const name = isChoSpeaker(m.speaker) ? "" : ` ${m.speaker.split("/")[0]}:`;
      parts.push(`${label}${name} ${m.content}`);
      used.add(i);
    }

    const chunkText = parts.join("\n");
    if (chunkText.length >= MIN_CHUNK / 2) {
      // 너무 길면 자르기
      const finalText = chunkText.length > MAX_CHUNK
        ? chunkText.substring(0, MAX_CHUNK)
        : chunkText;

      const source = classify(finalText);
      const topic = topicFromContent(finalText);
      const date = messages[startAnchor].date;
      chunks.push({ content: finalText, source, topic, date });
    }

    anchorIdx++;
  }

  return chunks;
}

// ─── 메인 ────────────────────────────────
function escapeSQL(str) {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

const allMessages = [];
for (const { path: p, format } of FILES) {
  if (!fs.existsSync(p)) {
    process.stderr.write(`파일 없음: ${p}\n`);
    continue;
  }
  const msgs = parseFile(p, format);
  process.stderr.write(`${format === "A" ? "1481" : "0110"}: ${msgs.length}건 파싱\n`);
  allMessages.push(...msgs);
}

process.stderr.write(`총 메시지: ${allMessages.length}건\n`);

const chunks = buildChunks(allMessages);
process.stderr.write(`생성된 청크: ${chunks.length}건\n`);

// 통계
const stats = {};
for (const c of chunks) {
  stats[c.source] = (stats[c.source] || 0) + 1;
}
process.stderr.write(`source별 분포:\n`);
for (const [k, v] of Object.entries(stats).sort()) {
  process.stderr.write(`  ${k}: ${v}건\n`);
}
const avgLen = Math.round(chunks.reduce((s, c) => s + c.content.length, 0) / chunks.length);
process.stderr.write(`평균 청크 길이: ${avgLen}자\n`);

// SQL 출력
console.log("-- 카카오톡 대화 v2 임포트 (맥락 보존 청킹)");
console.log("-- 생성일: " + new Date().toISOString().split("T")[0]);
console.log("DELETE FROM ai_chat_references WHERE source LIKE 'kakao_%';");
console.log("");

for (let i = 0; i < chunks.length; i++) {
  const c = chunks[i];
  const id = `ref_kakao_${String(i + 1).padStart(4, "0")}`;
  const date = c.date ? `'${c.date}'` : "NULL";
  const topic = c.topic ? `'${escapeSQL(c.topic)}'` : "NULL";
  const content = escapeSQL(c.content.substring(0, 3000));
  console.log(`INSERT INTO ai_chat_references (id, source, topic, speaker, content, spoken_at) VALUES ('${id}', '${c.source}', ${topic}, '국어농장주/조창훈', '${content}', ${date});`);
}

console.log("");
console.log(`-- 총 ${chunks.length}건`);
