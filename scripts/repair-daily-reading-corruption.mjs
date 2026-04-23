import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DAILY_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading');
const REPORT_PATH = path.join(ROOT, 'tmp', 'daily-reading-corruption-repair-report.json');

const WRITE = process.argv.includes('--write');
const REFRESH_FREGE2_CHOICES = process.argv.includes('--refresh-frege2-choices');
const BAD = /\?{2,}|�/;
const LEVELS = [
  'saussure1',
  'saussure2',
  'saussure3',
  'frege1',
  'frege2',
  'frege3',
  'russell1',
  'russell2',
  'russell3',
  'wittgenstein1',
  'wittgenstein2',
  'wittgenstein3',
];

const stopTerms = new Set([
  '것',
  '수',
  '등',
  '때',
  '점',
  '이때',
  '경우',
  '내용',
  '문단',
  '글',
  '설명',
  '부분',
  '방식',
  '관점',
  '중심',
  '핵심',
  '주요',
  '특징',
  '대상',
  '학생',
  '사람',
  '오늘',
  '내일',
  '활동',
  '문제',
  '자료',
  '자신들',
  '처음',
  '어떻게',
  '어디',
  '누구',
  '무엇',
  '모든',
  '아무',
  '어떤',
  '어느',
  '이러한',
  '그러한',
  '사실',
  '모습',
  '생각',
  '시간',
  '시간이',
]);

const fallbackDistractors = [
  '다른 사례',
  '주변 설명',
  '반대 관점',
  '부수 내용',
  '외부 조건',
  '단순 결과',
  '비슷한 예',
  '세부 절차',
];

const confirmPrompts = [
  '중심 대상은 무엇인가요?',
  '핵심 개념은 무엇인가요?',
  '주요 소재는 무엇인가요?',
  '중요한 기준은 무엇인가요?',
  '글에서 설명한 것은 무엇인가요?',
  '문단의 초점은 무엇인가요?',
];

const stats = {
  scannedFiles: 0,
  affectedFiles: 0,
  changedFiles: 0,
  history: {
    metadata: 0,
    passage: 0,
    intensive: 0,
    recall: 0,
    confirm: 0,
  },
  generated: {
    intensiveChoices: 0,
    recall: 0,
    confirmPrompts: 0,
    refreshedFrege2Choices: 0,
  },
  normalizedPassages: 0,
  adjustedRanges: 0,
  validation: {},
  files: [],
};

const historyCache = new Map();
const frege2RefreshDays = new Set([
  ...Array.from({ length: 86 }, (_, index) => index + 35),
  ...Array.from({ length: 24 }, (_, index) => index + 122),
]);

const frege2ChoiceOverrides = new Map([
  ['038:8', '돼지들의 인간화'],
  ['040:7', '건강 간식의 필요성'],
  ['052:8', '화성과 리듬 구조'],
  ['052:10', '연주자의 상호 반응'],
  ['057:1', '종이비행기 접기'],
  ['057:21', '멀리 날 수 있다는 기대'],
  ['059:13', '투명한 공개 방식'],
  ['069:13', '급식 품질과 재정'],
  ['077:12', '장발장의 삶'],
  ['080:5', '서로의 입장 존중'],
  ['082:8', '전쟁의 참혹함 고발'],
  ['086:20', '서로를 향한 의미'],
  ['087:8', '홀로 피는 꽃'],
  ['088:1', '끝에서도 시작되는 길'],
  ['088:3', '끝에서도 이어지는 길'],
  ['088:4', '새롭게 생기는 길'],
  ['088:21', '길을 만드는 사람'],
  ['095:15', '전용 서체의 효과'],
  ['107:7', '점순이의 복잡한 태도'],
  ['107:9', '엇갈린 마음 읽기'],
  ['120:19', '예스키즈존 합의'],
  ['124:4', '전쟁의 피해'],
  ['140:20', '소비자 부담 비판'],
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function hasBad(value) {
  if (value == null) return false;
  return BAD.test(typeof value === 'string' ? value : JSON.stringify(value));
}

function isContentFile(fileName) {
  return /^\d{3}\.json$/.test(fileName);
}

function listContentFiles() {
  const files = [];
  for (const level of LEVELS) {
    const dir = path.join(DAILY_DIR, level);
    if (!fs.existsSync(dir)) continue;
    for (const fileName of fs.readdirSync(dir).filter(isContentFile).sort()) {
      files.push(path.join(dir, fileName));
    }
  }
  return files;
}

function relFromAbs(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function paraList(doc) {
  const paragraphs = doc.payload?.passage?.paragraphs || [];
  return paragraphs.map((para, index) =>
    typeof para === 'string'
      ? { id: `p${index + 1}`, text: para }
      : para
  );
}

function paraById(doc, paragraphId) {
  return paraList(doc).find((para) => para.id === paragraphId);
}

function passageText(doc) {
  return paraList(doc).map((para) => para.text || '').join('\n');
}

function samePassage(a, b) {
  const ap = paraList(a);
  const bp = paraList(b);
  return ap.length === bp.length && ap.every((para, index) => para.id === bp[index].id && para.text === bp[index].text);
}

function normalizedPassage(passage) {
  const paragraphs = passage?.paragraphs || [];
  return {
    ...(passage || { format: 'TEXT' }),
    paragraphs: paragraphs.map((para, index) =>
      typeof para === 'string'
        ? { id: `p${index + 1}`, text: para }
        : para
    ),
  };
}

function normalizePassageShape(doc, notes) {
  const paragraphs = doc.payload?.passage?.paragraphs || [];
  if (!paragraphs.some((para) => typeof para === 'string')) return false;
  doc.payload.passage = normalizedPassage(doc.payload.passage);
  stats.normalizedPassages += 1;
  notes.push('normalized passage schema');
  return true;
}

function cleanText(text) {
  return String(text || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function stripParticle(text) {
  let output = cleanText(text).replace(/^[,.:;!?'"「」『』()\[\]\s]+|[,.:;!?'"「」『』()\[\]\s]+$/g, '');
  output = output.replace(/\s+(은|는|이|가|을|를|와|과|의|도|만|에|에서|으로|로|처럼|보다|부터|까지)$/u, '');
  output = output.replace(/(은|는|이|가|을|를|와|과|의|도|만|에|에서|으로|로|처럼|보다|부터|까지)$/u, '');
  return cleanText(output);
}

function shorten(text, max = 20) {
  let output = stripParticle(text);
  if (output.length <= max) return output;
  const cut = output.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace >= 4) output = cut.slice(0, lastSpace);
  else output = output.slice(0, max);
  return stripParticle(output);
}

function isUsefulTerm(term) {
  const value = stripParticle(term);
  if (!value || hasBad(value)) return false;
  if (value.length < 2 || value.length > 30) return false;
  if (!/[가-힣A-Za-z0-9ᄀ-ᇂ]/u.test(value)) return false;
  if (stopTerms.has(value)) return false;
  if (/^(다른|여러|같은|이런|그런|저런|먼저|결국|따라서)$/u.test(value)) return false;
  if (/^\d+$/.test(value)) return false;
  return true;
}

function pushCandidate(list, value) {
  const term = stripParticle(value);
  if (!isUsefulTerm(term)) return;
  if (list.some((item) => item === term || item.includes(term) || term.includes(item))) return;
  list.push(term);
}

function titleCandidates(title) {
  const candidates = [];
  const cleaned = cleanText(title)
    .replace(/일일 독해\([^)]*\)/g, '')
    .replace(/Day\s*\d+/gi, '')
    .replace(/\d+일차/g, '')
    .replace(/문법|비문학|문학|화법|작문|독서/g, ' ');
  for (const part of cleaned.split(/[-:·|]/)) {
    pushCandidate(candidates, part);
  }
  return candidates;
}

function extractCandidates(text, title = '') {
  const source = cleanText(text);
  const candidates = [];

  for (const term of titleCandidates(title)) {
    if (!source || source.includes(term)) pushCandidate(candidates, term);
  }

  const quotePattern = /['"「『]([^'"」』]{2,30})['"」』]/g;
  let match;
  while ((match = quotePattern.exec(source))) {
    pushCandidate(candidates, match[1]);
  }

  const relationPattern = /([가-힣A-Za-z0-9ᄀ-ᇂ][가-힣A-Za-z0-9ᄀ-ᇂ\s·\-]{1,28}?)(?:은|는|이|가|을|를|에는|에서는|이란|란|라고|이라고|으로|로)\b/gu;
  while ((match = relationPattern.exec(source))) {
    pushCandidate(candidates, match[1]);
  }

  const nounPattern = /[가-힣A-Za-z0-9ᄀ-ᇂ][가-힣A-Za-z0-9ᄀ-ᇂ·\-]{1,12}(?:\s+[가-힣A-Za-z0-9ᄀ-ᇂ][가-힣A-Za-z0-9ᄀ-ᇂ·\-]{1,12}){0,2}/gu;
  const frequency = new Map();
  while ((match = nounPattern.exec(source))) {
    const term = stripParticle(match[0]);
    if (!isUsefulTerm(term)) continue;
    frequency.set(term, (frequency.get(term) || 0) + 1);
  }
  for (const [term] of [...frequency.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)) {
    pushCandidate(candidates, term);
  }

  return candidates;
}

function rangeText(doc, range) {
  const para = paraById(doc, range.paragraphId);
  if (!para) return '';
  const start = Math.max(0, Math.min(range.start ?? 0, para.text.length));
  const end = Math.max(start, Math.min(range.end ?? start, para.text.length));
  return para.text.slice(start, end);
}

function highlightText(doc, step) {
  return (step.highlight?.ranges || []).map((range) => rangeText(doc, range)).join(' ');
}

function firstSentence(text) {
  return cleanText(text).split(/(?<=[.!?。]|[다요]\.)\s+/u)[0] || cleanText(text);
}

function answerFromHighlight(doc, step) {
  const highlighted = highlightText(doc, step);
  const candidates = extractCandidates(highlighted, doc.title);
  if (candidates.length) return shorten(candidates[0], 20);

  const sentence = firstSentence(highlighted);
  const clause = sentence.split(/[,.，:;]|(?:지만)|(?:이고)|(?:이며)|(?:는데)/u)[0];
  const fallback = shorten(clause, 20);
  return isUsefulTerm(fallback) ? fallback : '핵심 내용';
}

function allDocumentCandidates(doc) {
  const candidates = [];
  for (const para of paraList(doc)) {
    for (const term of extractCandidates(para.text, doc.title)) {
      pushCandidate(candidates, shorten(term, 20));
    }
  }
  for (const term of titleCandidates(doc.title)) {
    pushCandidate(candidates, shorten(term, 20));
  }
  return candidates;
}

function tooSimilar(a, b) {
  return a === b || a.includes(b) || b.includes(a);
}

function makeDistractors(doc, correct) {
  const distractors = [];
  for (const term of allDocumentCandidates(doc)) {
    const short = shorten(term, 20);
    if (!short || tooSimilar(short, correct) || distractors.some((item) => tooSimilar(item, short))) continue;
    distractors.push(short);
    if (distractors.length === 3) return distractors;
  }
  for (const fallback of fallbackDistractors) {
    if (!tooSimilar(fallback, correct) && !distractors.includes(fallback)) distractors.push(fallback);
    if (distractors.length === 3) return distractors;
  }
  return distractors;
}

function frege2DayFromRel(rel) {
  const match = rel.match(/frontend\/public\/daily-reading\/frege2\/(\d{3})\.json$/);
  return match ? Number(match[1]) : null;
}

function quotedTerms(text) {
  const terms = [];
  const pattern = /['"「『]([^'"」』]{2,24})['"」』]/g;
  let match;
  while ((match = pattern.exec(text))) {
    const term = stripParticle(match[1]);
    if (isUsefulTerm(term)) terms.push(term);
  }
  return terms;
}

function titleFocuses(title) {
  const focuses = [];
  for (const term of titleCandidates(title)) {
    for (const piece of term.split(/의|\s+/u)) pushCandidate(focuses, piece);
    pushCandidate(focuses, term);
  }
  return focuses.filter((term) => term.length <= 12);
}

function simpleFocus(text, title) {
  const source = cleanText(text);
  if (/구비\s*전승/u.test(source)) return '구비 전승';
  if (/확장적\s*묘사/u.test(source)) return '확장적 묘사';
  if (/적층적\s*구성/u.test(source)) return '적층적 구성';
  if (/이중적\s*언어/u.test(source)) return '이중적 언어';
  if (/문학적\s*텍스트/u.test(source)) return '문학적 텍스트';
  const quoted = quotedTerms(source);
  if (quoted.length) return shorten(quoted[0], 12);

  for (const term of titleFocuses(title)) {
    if (source.includes(term)) return shorten(term, 12);
  }

  const startMatch = source.match(/^([가-힣A-Za-z0-9ᄀ-ᇂ·\-\s]{2,24}?)(?:은|는|이|가|을|를|에는|에서는|의)\b/u);
  if (startMatch && isUsefulTerm(startMatch[1])) return shorten(startMatch[1], 12);

  const candidates = extractCandidates(source, title).filter((term) => term.length <= 14);
  return shorten(candidates[0] || '핵심 내용', 12);
}

function sanitizeFocus(focus, source, title) {
  let output = stripParticle(focus);
  const internalParticle = output.match(/^(.{2,}?)(?:을|를|은|는|이|가)\s+(.{2,})$/u);
  if (internalParticle && isUsefulTerm(internalParticle[2])) {
    output = stripParticle(internalParticle[2]);
  }
  if (output.length > 12 || !isUsefulTerm(output)) {
    const titleFocus = titleFocuses(title).find((term) => source.includes(term));
    if (titleFocus) output = titleFocus;
  }
  return shorten(output, 12);
}

function normalizedTerm(term) {
  let output = stripParticle(term)
    .replace(/^(가장|매우|아주|너무|다시|이미|아직|바로)\s+/u, '')
    .replace(/(했다|한다|된다|되었다|이었다|이다|있다|없다|하며|하고|되어|되는|하던|했던|면서)$/u, '')
    .trim();
  const internalParticle = output.match(/^(.{2,}?)(?:은|는|이|가|을|를)\s+(.{2,})$/u);
  if (internalParticle && isUsefulTerm(internalParticle[2])) output = stripParticle(internalParticle[2]);
  return output;
}

function keywordTerms(text, title) {
  const source = cleanText(text);
  const terms = [];

  const paired = source.match(/[가-힣]{2,}(?:와|과)\s*[가-힣]{2,}/gu) || [];
  for (const term of paired) pushCandidate(terms, normalizedTerm(term));

  const compounds = source.match(/[가-힣]{2,}\s+[가-힣]{2,}(?=(?:은|는|이|가|을|를|의|에|에서|으로|와|과|,|\.|\s))/gu) || [];
  for (const term of compounds) pushCandidate(terms, normalizedTerm(term));

  for (const term of quotedTerms(source)) {
    if (/열심히|옳다/u.test(term) && /복서/u.test(source)) pushCandidate(terms, '복서의 신념');
    else pushCandidate(terms, normalizedTerm(term));
  }

  for (const term of titleFocuses(title)) {
    if (source.includes(term)) pushCandidate(terms, normalizedTerm(term));
  }

  const words = source.match(/[가-힣A-Za-z0-9ᄀ-ᇂ]{2,}/gu) || [];
  for (const word of words) {
    const term = normalizedTerm(word);
    if (/[다요며고서]$/u.test(term)) continue;
    pushCandidate(terms, term);
  }

  return terms.filter((term) => {
    if (!isUsefulTerm(term)) return false;
    if (/^(처음|어떻게|무엇|어디|자신|자신들이|누구|모든|어떤|사실|모습)$/u.test(term)) return false;
    return true;
  });
}

function keywordChoiceText(doc, step) {
  const text = highlightText(doc, step);
  if (/공포 정치/u.test(text) && /침묵/u.test(text)) return '공포 정치와 침묵';
  if (/자유와 평등/u.test(text) && /사라|의문/u.test(text)) return '자유와 평등의 상실';
  if (/복서/u.test(text) && /열심히|옳다|충성/u.test(text)) return '복서의 충성';
  if (/권력/u.test(text) && /성실/u.test(text)) return '권력의 이용';
  if (/인간과의 교역/u.test(text)) return '인간과의 교역';
  if (/칠계명|계명/u.test(text) && /바뀌|변질|정당화/u.test(text)) return '계명의 변질';
  if (/언어의 변질|기억의 왜곡/u.test(text)) return '언어와 기억의 왜곡';
  if (/도살장|도살업자|복서/u.test(text) && /끌려|최후|비참/u.test(text)) return '복서의 비극';
  if (/거짓 보고|술잔치/u.test(text)) return '돼지들의 거짓';
  if (/돼지/u.test(text) && /인간/u.test(text) && /분간/u.test(text)) return '돼지와 인간의 동일화';
  if (/권력/u.test(text) && /타락/u.test(text)) return '권력의 타락';

  const terms = keywordTerms(text, doc.title);
  const suffix = labelForHighlight(text);
  const first = terms[0];
  const second = terms.find((term) => !tooSimilar(term, first));
  if (first && second && `${first}와 ${second}`.length <= 20) return `${first}와 ${second}`;
  if (first) return shorten(`${first}${suffix}`, 20);
  return '핵심 내용 정리';
}

function labelForHighlight(text) {
  const source = cleanText(text);
  if (/이라고|부르|뜻|의미|정의/u.test(source)) return '의 의미';
  if (/특징|성격|핵심|중심/u.test(source)) return '의 특징';
  if (/기능|역할|작용/u.test(source)) return '의 역할';
  if (/이유|까닭|때문|덕분/u.test(source)) return '의 이유';
  if (/예를 들어|예시|사례/u.test(source)) return '의 예시';
  if (/과정|통해|전승|변화|이어/u.test(source)) return '의 과정';
  if (/효과|결과|유도|보여/u.test(source)) return '의 효과';
  if (/차이|비교|공존|구별/u.test(source)) return '의 차이';
  if (/오늘날|현대|재해석|장르|영감/u.test(source)) return '의 활용';
  if (/결국|따라서|즉|정리/u.test(source)) return '의 정리';
  return '의 핵심';
}

function summaryChoiceText(doc, step, overrideKey = null) {
  if (overrideKey && frege2ChoiceOverrides.has(overrideKey)) {
    return frege2ChoiceOverrides.get(overrideKey);
  }
  const keyword = keywordChoiceText(doc, step);
  if (keyword && keyword !== '핵심 내용 정리') return keyword;
  const text = highlightText(doc, step);
  const focus = sanitizeFocus(simpleFocus(text, doc.title), text, doc.title);
  const suffix = labelForHighlight(text);
  if (focus === '핵심 내용') return '핵심 내용 정리';
  const combined = `${focus}${suffix}`;
  return shorten(combined, 20);
}

function buildSummaryChoicePool(doc, day = null) {
  const pool = [];
  for (const [index, step] of (doc.payload?.intensive?.timeline || []).entries()) {
    const key = day ? `${String(day).padStart(3, '0')}:${index + 1}` : null;
    pushCandidate(pool, summaryChoiceText(doc, step, key));
  }
  for (const term of titleFocuses(doc.title)) {
    pushCandidate(pool, shorten(`${term}의 핵심`, 20));
  }
  for (const para of paraList(doc)) {
    for (const term of keywordTerms(para.text, doc.title).slice(0, 4)) {
      pushCandidate(pool, shorten(`${shorten(term, 12)}의 핵심`, 20));
    }
  }
  for (const fallback of fallbackDistractors) pushCandidate(pool, fallback);
  return pool;
}

function isAwkwardChoice(text) {
  const value = cleanText(text);
  if (!value || value.length > 20) return true;
  if (/면서|들은\s|들은와|하는와|되어와|있다와/u.test(value)) return true;
  if (/[가-힣]+(?:은|는|이|가|을|를)\s+[가-힣]+(?:의|와)/u.test(value)) return true;
  return false;
}

function refreshFrege2Choices(doc, notes, rel) {
  const timeline = doc.payload?.intensive?.timeline || [];
  if (!timeline.length) return;
  const day = frege2DayFromRel(rel);
  const pool = buildSummaryChoicePool(doc, day);
  let count = 0;
  for (const [index, step] of timeline.entries()) {
    const question = step.question;
    if (!question?.choices?.length) continue;
    const correct = summaryChoiceText(doc, step, `${String(day).padStart(3, '0')}:${index + 1}`);
    const distractors = [];
    for (const candidate of pool) {
      if (isAwkwardChoice(candidate)) continue;
      if (tooSimilar(candidate, correct) || distractors.some((item) => tooSimilar(item, candidate))) continue;
      distractors.push(candidate);
      if (distractors.length === 3) break;
    }
    while (distractors.length < 3) {
      const fallback = fallbackDistractors[distractors.length] || '부수 내용';
      if (!tooSimilar(fallback, correct)) distractors.push(fallback);
      else distractors.push(`다른 내용 ${distractors.length + 1}`);
    }
    const answerId = ['A', 'B', 'C', 'D'].includes(question.answerId) ? question.answerId : 'A';
    let distractorIndex = 0;
    question.choices = ['A', 'B', 'C', 'D'].map((id) => ({
      id,
      text: id === answerId ? correct : distractors[distractorIndex++],
    }));
    question.answerId = answerId;
    question.scoring = {
      correctDeltaSec: 20,
      wrongDeltaSec: -40,
      eliminateWrongChoice: true,
    };
    count += 1;
  }
  if (count) {
    stats.generated.refreshedFrege2Choices += count;
    notes.push(`refreshed frege2 choices:${count}`);
  }
}

function repairBrokenChoices(doc, notes) {
  const timeline = doc.payload?.intensive?.timeline || [];
  let count = 0;
  for (const step of timeline) {
    const question = step.question;
    if (!question || !hasBad(question.choices)) continue;

    const answerId = ['A', 'B', 'C', 'D'].includes(question.answerId) ? question.answerId : 'A';
    const correct = answerFromHighlight(doc, step);
    const distractors = makeDistractors(doc, correct);
    const ids = ['A', 'B', 'C', 'D'];
    let distractorIndex = 0;
    question.choices = ids.map((id) => ({
      id,
      text: id === answerId ? correct : distractors[distractorIndex++] || fallbackDistractors[distractorIndex] || '부수 내용',
    }));
    question.answerId = answerId;
    if (hasBad(question.prompt)) question.prompt = '핵심 내용은 무엇인가요?';
    question.scoring = {
      correctDeltaSec: 20,
      wrongDeltaSec: -40,
      eliminateWrongChoice: true,
    };
    count += 1;
  }
  if (count) {
    stats.generated.intensiveChoices += count;
    notes.push(`generated intensive choices:${count}`);
  }
}

function rangeSubstrings(question, doc) {
  return (question.answerRanges || [])
    .map((range) => rangeText(doc, range))
    .map(stripParticle)
    .filter(Boolean);
}

function expandTermAt(doc, range, term) {
  const para = paraById(doc, range.paragraphId);
  if (!para || !term || term.length >= 5) return term;
  const text = para.text;
  let start = range.start ?? 0;
  let end = range.end ?? start;

  while (start > 0 && /[가-힣A-Za-z0-9ᄀ-ᇂ·\-\s]/u.test(text[start - 1]) && text[start - 1] !== '.') start -= 1;
  while (end < text.length && /[가-힣A-Za-z0-9ᄀ-ᇂ·\-\s]/u.test(text[end]) && text[end] !== '.') end += 1;

  const phrase = stripParticle(text.slice(start, end));
  if (phrase.length > term.length && phrase.length <= 12 && phrase.includes(term) && isUsefulTerm(phrase)) return phrase;
  return term;
}

function findRangesForTerm(doc, term, preferredParagraphId = null) {
  const ranges = [];
  if (!term) return ranges;
  for (const para of paraList(doc)) {
    if (preferredParagraphId && para.id !== preferredParagraphId) continue;
    let start = 0;
    while (start < para.text.length) {
      const index = para.text.indexOf(term, start);
      if (index < 0) break;
      ranges.push({ paragraphId: para.id, start: index, end: index + term.length });
      start = index + Math.max(1, term.length);
    }
  }
  if (!ranges.length && preferredParagraphId) return findRangesForTerm(doc, term, null);
  return ranges;
}

function makeContextPrompt(term, context, index) {
  const clean = cleanText(context);
  const sentence = clean
    .split(/(?<=[.!?])\s+/u)
    .find((part) => part.includes(term));
  if (sentence) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hidden = cleanText(sentence.replace(new RegExp(escaped, 'g'), '무엇'));
    if (hidden.includes('무엇') && hidden.length >= 8 && hidden.length <= 54) {
      if (/[.?]$/.test(hidden)) return hidden.replace(/[.]$/u, '?');
      return `${hidden}?`;
    }
  }
  return confirmPrompts[index % confirmPrompts.length];
}

function cleanQuotedPrompt(prompt) {
  const matches = [...String(prompt || '').matchAll(/['"“”‘’]([^'"“”‘’]{6,90})['"“”‘’]/g)];
  for (const match of matches) {
    const quote = cleanText(match[1]);
    if (!hasBad(quote) && /[가-힣]/u.test(quote)) {
      return `"${quote}"에 해당하는 부분은 어디인가요?`;
    }
  }
  return null;
}

function chooseConfirmTerm(doc, question, index) {
  const substrings = rangeSubstrings(question, doc).filter(isUsefulTerm);
  if (substrings.length) {
    const firstRange = question.answerRanges?.[0];
    const first = expandTermAt(doc, firstRange || {}, shorten(substrings[0], 18));
    return shorten(first, 18);
  }

  const paragraphId = question.answerRanges?.[0]?.paragraphId || paraList(doc)[index % Math.max(1, paraList(doc).length)]?.id;
  const para = paragraphId ? paraById(doc, paragraphId) : null;
  const candidates = extractCandidates(para?.text || passageText(doc), doc.title);
  return shorten(candidates[0] || titleCandidates(doc.title)[0] || '핵심 내용', 18);
}

function repairBrokenConfirm(doc, notes) {
  const questions = doc.payload?.confirm?.questions || [];
  let count = 0;
  for (const [index, question] of questions.entries()) {
    if (!hasBad(question.prompt)) continue;
    const quotedPrompt = cleanQuotedPrompt(question.prompt);
    if (quotedPrompt) {
      question.prompt = quotedPrompt;
      question.scoring = {
        correctDeltaSec: 30,
        wrongDeltaSec: -45,
      };
      question.revealOnWrong = true;
      question.answerMatchMode = question.answerMatchMode || 'ANY';
      count += 1;
      continue;
    }
    const firstRange = question.answerRanges?.[0];
    const paragraphId = firstRange?.paragraphId || paraList(doc)[index % Math.max(1, paraList(doc).length)]?.id;
    const para = paragraphId ? paraById(doc, paragraphId) : null;
    const term = chooseConfirmTerm(doc, question, index);
    const ranges = findRangesForTerm(doc, term, paragraphId);
    question.prompt = makeContextPrompt(term, para?.text || passageText(doc), index);
    question.answerText = term;
    question.answerRanges = ranges.length ? ranges : [{ paragraphId: paragraphId || 'p1', start: 0, end: Math.min(term.length, para?.text?.length || 1) }];
    question.answerMatchMode = 'ANY';
    question.scoring = {
      correctDeltaSec: 30,
      wrongDeltaSec: -45,
    };
    question.revealOnWrong = true;
    count += 1;
  }
  if (count) {
    stats.generated.confirmPrompts += count;
    notes.push(`generated confirm prompts:${count}`);
  }
}

function recallCardText(term, paraText, index) {
  const text = cleanText(paraText);
  const basis = shorten(term, 16);
  if (/차이|구별|비교/u.test(text)) return shorten(`${basis}의 차이`, 30);
  if (/원인|까닭|때문/u.test(text)) return shorten(`${basis}의 원인`, 30);
  if (/구조|형태|체계/u.test(text)) return shorten(`${basis}의 구조`, 30);
  if (/역할|기능/u.test(text)) return shorten(`${basis}의 기능`, 30);
  if (/과정|절차|단계/u.test(text)) return shorten(`${basis}의 과정`, 30);
  if (/중요|핵심/u.test(text)) return shorten(`${basis}의 중요성`, 30);
  return shorten(`${basis}의 핵심`, 30);
}

function buildRecallCards(doc, targetCount = 8) {
  const cards = [];
  const used = new Set();
  for (const [index, para] of paraList(doc).entries()) {
    const candidates = extractCandidates(para.text, doc.title);
    for (const candidate of candidates) {
      const text = recallCardText(candidate, para.text, index);
      if (!isUsefulTerm(text) || used.has(text)) continue;
      used.add(text);
      cards.push({ id: `c${cards.length + 1}`, text });
      break;
    }
  }
  for (const candidate of allDocumentCandidates(doc)) {
    if (cards.length >= targetCount) break;
    const text = shorten(`${candidate} 정리`, 30);
    if (!isUsefulTerm(text) || used.has(text)) continue;
    used.add(text);
    cards.push({ id: `c${cards.length + 1}`, text });
  }
  while (cards.length < targetCount) {
    const id = cards.length + 1;
    cards.push({ id: `c${id}`, text: `핵심 내용 ${id}` });
  }
  return cards.slice(0, targetCount);
}

function repairBrokenRecall(doc, notes) {
  const recall = doc.payload?.recall;
  if (!recall || !hasBad(recall.cards)) return;
  const targetCount = Math.max(8, recall.cards?.length || 0);
  const cards = buildRecallCards(doc, targetCount);
  recall.cards = cards;
  recall.correctOrder = cards.map((card) => card.id);
  recall.seedPenalty = recall.seedPenalty ?? 1;
  stats.generated.recall += 1;
  notes.push(`generated recall cards:${cards.length}`);
}

function getHistory(rel) {
  if (historyCache.has(rel)) return historyCache.get(rel);
  const commits = execFileSync('git', ['log', '--format=%H', '--', rel], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  const docs = [];
  for (const commit of commits) {
    try {
      const raw = execFileSync('git', ['show', `${commit}:${rel}`], {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024,
      });
      const doc = JSON.parse(raw);
      docs.push({ commit, doc });
    } catch {
      // Ignore deleted or non-JSON historical versions.
    }
  }
  historyCache.set(rel, docs);
  return docs;
}

function copyIfClean(target, key, source, statKey, notes) {
  if (source[key] == null || hasBad(source[key])) return false;
  if (target[key] === source[key]) return false;
  target[key] = source[key];
  stats.history[statKey] += 1;
  notes.push(`history ${key}`);
  return true;
}

function repairFromHistory(doc, rel, notes) {
  const history = getHistory(rel);
  let changed = false;

  if (hasBad(doc.title) || hasBad(doc.description) || hasBad(doc.payload?.passage)) {
    const candidate = history.find(({ doc: cand }) => {
      return cand.contentId === doc.contentId && !hasBad(cand.title) && !hasBad(cand.description) && !hasBad(cand.payload?.passage);
    });
    if (candidate) {
      const cand = candidate.doc;
      if (hasBad(doc.title)) changed = copyIfClean(doc, 'title', cand, 'metadata', notes) || changed;
      if (hasBad(doc.description) || hasBad(doc.payload?.passage)) changed = copyIfClean(doc, 'description', cand, 'metadata', notes) || changed;
      if (hasBad(doc.payload?.passage)) {
        doc.payload.passage = JSON.parse(JSON.stringify(normalizedPassage(cand.payload.passage)));
        stats.history.passage += 1;
        notes.push(`history passage:${candidate.commit.slice(0, 8)}`);
        changed = true;
      }
      if (cand.payload?.intensive?.timeline?.length && !hasBad(cand.payload.intensive)) {
        doc.payload.intensive = JSON.parse(JSON.stringify(cand.payload.intensive));
        stats.history.intensive += 1;
        notes.push('history intensive after passage');
        changed = true;
      }
      if (cand.payload?.recall?.cards?.length && !hasBad(cand.payload.recall)) {
        doc.payload.recall = JSON.parse(JSON.stringify(cand.payload.recall));
        stats.history.recall += 1;
        notes.push('history recall after passage');
        changed = true;
      }
      if (cand.payload?.confirm?.questions?.length && !hasBad(cand.payload.confirm)) {
        doc.payload.confirm = JSON.parse(JSON.stringify(cand.payload.confirm));
        stats.history.confirm += 1;
        notes.push('history confirm after passage');
        changed = true;
      }
    }
  }

  const cleanSamePassage = () =>
    history.filter(({ doc: cand }) => cand.contentId === doc.contentId && samePassage(doc, cand) && !hasBad(cand.payload?.passage));

  if (hasBad(doc.payload?.confirm)) {
    const candidate = cleanSamePassage().find(({ doc: cand }) => cand.payload?.confirm?.questions?.length && !hasBad(cand.payload.confirm));
    if (candidate) {
      doc.payload.confirm = JSON.parse(JSON.stringify(candidate.doc.payload.confirm));
      stats.history.confirm += 1;
      notes.push(`history confirm:${candidate.commit.slice(0, 8)}`);
      changed = true;
    }
  }

  if (hasBad(doc.payload?.recall)) {
    const candidate = cleanSamePassage().find(({ doc: cand }) => cand.payload?.recall?.cards?.length && !hasBad(cand.payload.recall));
    if (candidate) {
      doc.payload.recall = JSON.parse(JSON.stringify(candidate.doc.payload.recall));
      stats.history.recall += 1;
      notes.push(`history recall:${candidate.commit.slice(0, 8)}`);
      changed = true;
    }
  }

  if (hasBad(doc.payload?.intensive)) {
    const candidate = cleanSamePassage().find(({ doc: cand }) => cand.payload?.intensive?.timeline?.length && !hasBad(cand.payload.intensive));
    if (candidate) {
      doc.payload.intensive = JSON.parse(JSON.stringify(candidate.doc.payload.intensive));
      stats.history.intensive += 1;
      notes.push(`history intensive:${candidate.commit.slice(0, 8)}`);
      changed = true;
    }
  }

  return changed;
}

function adjustRanges(doc, notes) {
  let count = 0;
  for (const step of doc.payload?.intensive?.timeline || []) {
    for (const range of step.highlight?.ranges || []) {
      const para = paraById(doc, range.paragraphId);
      if (!para) continue;
      const originalStart = range.start;
      const originalEnd = range.end;
      range.start = Math.max(0, Math.min(range.start ?? 0, Math.max(0, para.text.length - 1)));
      range.end = Math.max(range.start + 1, Math.min(range.end ?? para.text.length, para.text.length));
      if (range.start !== originalStart || range.end !== originalEnd) count += 1;
    }
  }
  for (const question of doc.payload?.confirm?.questions || []) {
    for (const range of question.answerRanges || []) {
      const para = paraById(doc, range.paragraphId);
      if (!para) continue;
      const originalStart = range.start;
      const originalEnd = range.end;
      range.start = Math.max(0, Math.min(range.start ?? 0, Math.max(0, para.text.length - 1)));
      range.end = Math.max(range.start + 1, Math.min(range.end ?? para.text.length, para.text.length));
      if (range.start !== originalStart || range.end !== originalEnd) count += 1;
    }
  }
  if (count) {
    stats.adjustedRanges += count;
    notes.push(`adjusted ranges:${count}`);
  }
}

function repairFile(filePath) {
  const rel = relFromAbs(filePath);
  const original = fs.readFileSync(filePath, 'utf8');
  const doc = JSON.parse(original);
  stats.scannedFiles += 1;
  const notes = [];
  const shapeChanged = normalizePassageShape(doc, notes);
  const refreshFrege2 = REFRESH_FREGE2_CHOICES && frege2RefreshDays.has(frege2DayFromRel(rel));
  if (!hasBad(doc) && !shapeChanged && !refreshFrege2) return;

  if (hasBad(doc)) stats.affectedFiles += 1;

  if (hasBad(doc)) {
    repairFromHistory(doc, rel, notes);
    repairBrokenChoices(doc, notes);
    repairBrokenRecall(doc, notes);
    repairBrokenConfirm(doc, notes);
  }
  if (refreshFrege2) refreshFrege2Choices(doc, notes, rel);
  adjustRanges(doc, notes);

  const next = `${JSON.stringify(doc, null, 2)}\n`;
  if (next !== original) {
    stats.changedFiles += 1;
    stats.files.push({ rel, notes });
    if (WRITE) fs.writeFileSync(filePath, next, 'utf8');
  }
}

function validate() {
  const issues = [];
  let badFiles = 0;
  let invalidRanges = 0;
  let invalidChoices = 0;
  let recallIssues = 0;
  const files = listContentFiles();

  for (const filePath of files) {
    let doc;
    try {
      doc = readJson(filePath);
    } catch (error) {
      issues.push(`${relFromAbs(filePath)} parse error: ${error.message}`);
      continue;
    }
    if (hasBad(doc)) {
      badFiles += 1;
      if (issues.length < 30) issues.push(`${relFromAbs(filePath)} still has broken text`);
    }

    for (const [index, step] of (doc.payload?.intensive?.timeline || []).entries()) {
      const question = step.question || {};
      const choices = question.choices || [];
      if (choices.length !== 4 || !choices.some((choice) => choice.id === question.answerId) || choices.some((choice) => !choice.text || hasBad(choice.text))) {
        invalidChoices += 1;
        if (issues.length < 30) issues.push(`${relFromAbs(filePath)} intensive ${index + 1} invalid choices`);
      }
      for (const range of step.highlight?.ranges || []) {
        const para = paraById(doc, range.paragraphId);
        if (!para || range.start < 0 || range.end <= range.start || range.end > para.text.length) {
          invalidRanges += 1;
          if (issues.length < 30) issues.push(`${relFromAbs(filePath)} intensive ${index + 1} invalid range`);
        }
      }
    }

    const recall = doc.payload?.recall;
    if (recall?.cards?.some((card) => !card.text || hasBad(card.text))) {
      recallIssues += 1;
      if (issues.length < 30) issues.push(`${relFromAbs(filePath)} invalid recall`);
    }

    for (const [index, question] of (doc.payload?.confirm?.questions || []).entries()) {
      if (!question.prompt || hasBad(question.prompt)) {
        badFiles += 1;
        if (issues.length < 30) issues.push(`${relFromAbs(filePath)} confirm ${index + 1} broken prompt`);
      }
      if (!question.answerRanges?.length && !question.answerText) {
        invalidRanges += 1;
        if (issues.length < 30) issues.push(`${relFromAbs(filePath)} confirm ${index + 1} missing answer`);
      }
      for (const range of question.answerRanges || []) {
        const para = paraById(doc, range.paragraphId);
        if (!para || range.start < 0 || range.end <= range.start || range.end > para.text.length) {
          invalidRanges += 1;
          if (issues.length < 30) issues.push(`${relFromAbs(filePath)} confirm ${index + 1} invalid range`);
        }
      }
    }
  }

  stats.validation = {
    expectedFiles: files.length,
    brokenFiles: badFiles,
    invalidRanges,
    invalidChoices,
    recallIssues,
    issueSamples: issues,
  };
}

for (const filePath of listContentFiles()) {
  repairFile(filePath);
}

validate();

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, `${JSON.stringify(stats, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  mode: WRITE ? 'write' : 'dry-run',
  scannedFiles: stats.scannedFiles,
  affectedFiles: stats.affectedFiles,
  changedFiles: stats.changedFiles,
  history: stats.history,
  generated: stats.generated,
  adjustedRanges: stats.adjustedRanges,
  validation: stats.validation,
  reportPath: REPORT_PATH,
}, null, 2));

if (stats.validation.brokenFiles || stats.validation.invalidRanges || stats.validation.invalidChoices || stats.validation.recallIssues) {
  process.exitCode = 2;
}
