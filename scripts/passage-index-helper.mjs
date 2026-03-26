#!/usr/bin/env node
/**
 * 지문 인덱스 계산 헬퍼
 * 사용법: node scripts/passage-index-helper.mjs <원고파일경로> <섹션:개념|문학|비문학|문법>
 *
 * 출력: 각 문단별 문장 목록과 character 인덱스 (start, end)
 */

import { readFileSync } from 'fs';

const fp = process.argv[2];
const section = process.argv[3] || '개념';

if (!fp) { console.error('사용법: node passage-index-helper.mjs <원고.json> <섹션>'); process.exit(1); }

let raw = readFileSync(fp, 'utf-8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const ms = JSON.parse(raw);

// 지문 추출
function deepGet(sec, ...keys) {
  if (!sec) return undefined;
  for (const k of keys) { if (sec[k] !== undefined) return sec[k]; }
  for (const v of Object.values(sec)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const k of keys) { if (v[k] !== undefined) return v[k]; }
    }
  }
  return undefined;
}

let text, title;
if (section === '개념') {
  const s = ms['개념'];
  text = deepGet(s, '개념_배경지식_지문', '개념_지문');
  title = deepGet(s, '개념_배경지식_제목', '개념_제목') || '개념';
} else if (section === '문학') {
  const s = ms['문학'];
  text = deepGet(s, '문학_작품_지문');
  title = deepGet(s, '문학_작품명') || '문학';
} else if (section === '비문학') {
  const s = ms['비문학'];
  text = deepGet(s, '비문학_지문');
  title = deepGet(s, '비문학_제목') || '비문학';
} else if (section === '문법') {
  const s = ms['문법'];
  text = deepGet(s, '문법_지문');
  title = deepGet(s, '문법_제목') || '문법';
}

if (!text) { console.error(`"${section}" 지문을 찾을 수 없습니다.`); process.exit(1); }

text = String(text).trim();

// 문단 분할
const paragraphs = text.split(/\n\n+/).filter(t => t.trim().length > 0).map((t, i) => ({
  id: `p${i + 1}`,
  text: t.trim()
}));

// 문장 분할 (문단 내)
function splitSentences(paraText) {
  const results = [];
  const lines = paraText.split('\n');

  if (lines.length > 1) {
    let pos = 0;
    for (const line of lines) {
      if (line.trim().length > 1) {
        const sents = splitBySentenceEnd(line);
        let off = 0;
        for (const s of sents) {
          const tr = s.trim();
          if (tr.length < 2) { off += s.length; continue; }
          const st = line.indexOf(tr, off);
          if (st >= 0) {
            results.push({ start: pos + st, end: pos + st + tr.length, text: tr });
            off = st + tr.length;
          }
        }
      }
      pos += line.length + 1;
    }
  } else {
    const sents = splitBySentenceEnd(paraText);
    let off = 0;
    for (const s of sents) {
      const tr = s.trim();
      if (tr.length < 2) { off += s.length; continue; }
      const st = paraText.indexOf(tr, off);
      if (st >= 0) {
        results.push({ start: st, end: st + tr.length, text: tr });
        off = st + tr.length;
      }
    }
  }

  if (results.length === 0) {
    const tr = paraText.trim();
    const st = paraText.indexOf(tr);
    results.push({ start: st >= 0 ? st : 0, end: (st >= 0 ? st : 0) + tr.length, text: tr });
  }

  return results;
}

function splitBySentenceEnd(text) {
  const results = [];
  let current = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') inQ = !inQ;
    else if (ch === '\u201C' || ch === '「') inQ = true;
    else if (ch === '\u201D' || ch === '」') inQ = false;
    current += ch;
    if (!inQ && (ch === '.' || ch === '?' || ch === '!')) {
      const nx = text[i + 1] || '';
      if (nx === '' || nx === ' ' || nx === '\n') {
        results.push(current);
        current = '';
      }
    }
  }
  if (current.trim()) results.push(current);
  return results;
}

// 출력
console.log(`\n=== ${title} ===`);
console.log(`총 글자: ${text.length}자, 문단: ${paragraphs.length}개\n`);

for (const para of paragraphs) {
  console.log(`── ${para.id} (${para.text.length}자) ──`);
  const sents = splitSentences(para.text);
  for (let i = 0; i < sents.length; i++) {
    const s = sents[i];
    console.log(`  문장${i + 1}: [${s.start}, ${s.end}] "${s.text.slice(0, 60)}${s.text.length > 60 ? '...' : ''}"`);
  }
  console.log(`  [전체 하이라이트: 0~${para.text.length}]`);
  console.log();
}

// JSON 사용 가능한 paragraphs 배열
console.log('── paragraphs JSON ──');
console.log(JSON.stringify(paragraphs, null, 2));
