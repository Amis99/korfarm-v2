import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DAILY_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading');
const TMP_DIR = path.join(ROOT, 'tmp');

const WRITE_LOCAL = process.argv.includes('--write-local');
const APPLY_DB = process.argv.includes('--apply-db');
const LIMIT_ARG = process.argv.find((arg) => arg.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split('=')[1]) : null;

const BAD_TEXT = /\?{2,}|\uFFFD|占/u;
const SENTENCE_CLOSERS = new Set(['"', "'", '”', '’', '」', '』', ')', ']', '）']);

const sentenceSegmenter =
  typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter('ko', { granularity: 'sentence' })
    : null;

function extractConfigValue(source, key) {
  const match = source.match(new RegExp(`${key}:\\s*(?:['"]([^'"]+)['"]|(\\d+))`));
  if (!match) throw new Error(`DB config key not found: ${key}`);
  return match[1] ?? match[2];
}

function readDbConfig() {
  const source = fs.readFileSync(path.join(ROOT, 'scripts', 'import-pro-content.js'), 'utf8');
  const block = source.match(/const DB_CONFIG = \{([\s\S]*?)\};/);
  if (!block) throw new Error('DB_CONFIG block not found.');
  const configSource = block[1];
  return {
    host: extractConfigValue(configSource, 'host'),
    port: Number(extractConfigValue(configSource, 'port')) || 3306,
    user: extractConfigValue(configSource, 'user'),
    password: extractConfigValue(configSource, 'password'),
    database: extractConfigValue(configSource, 'database'),
  };
}

function createTunnel(dbConfig) {
  return new Promise((resolve, reject) => {
    const sshClient = new Client();
    const keyPath = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'korfarm-ec2.pem');
    sshClient.on('ready', () => {
      const server = net.createServer((sock) => {
        sshClient.forwardOut('127.0.0.1', 0, dbConfig.host, dbConfig.port, (err, stream) => {
          if (err) {
            sock.destroy(err);
            return;
          }
          sock.pipe(stream).pipe(sock);
        });
      });
      server.listen(0, '127.0.0.1', () => {
        resolve({ sshClient, server, localPort: server.address().port });
      });
    });
    sshClient.on('error', reject);
    sshClient.connect({
      host: '43.200.104.102',
      port: 22,
      username: 'ec2-user',
      privateKey: fs.readFileSync(keyPath),
    });
  });
}

async function closeTunnel(tunnel) {
  await new Promise((resolve) => tunnel.server.close(resolve));
  tunnel.sshClient.end();
}

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;
  return JSON.parse(value);
}

function payloadOf(doc) {
  return doc?.payload || doc || {};
}

function paragraphsOf(passage) {
  return (passage?.paragraphs || []).map((para, index) =>
    typeof para === 'string' ? { id: `p${index + 1}`, text: para } : para,
  );
}

function paragraphMap(passage) {
  return new Map(paragraphsOf(passage).map((para) => [para.id, para]));
}

function paragraphOrderMap(passage) {
  return new Map(paragraphsOf(passage).map((para, index) => [para.id, index]));
}

function trimRange(text, start, end) {
  let s = Math.max(0, Math.min(start, text.length));
  let e = Math.max(s, Math.min(end, text.length));
  while (s < e && /\s/u.test(text[s])) s += 1;
  while (e > s && /\s/u.test(text[e - 1])) e -= 1;
  return { start: s, end: e };
}

function includeTrailingSentenceClosers(text, end) {
  let nextEnd = end;
  while (nextEnd < text.length && SENTENCE_CLOSERS.has(text[nextEnd])) {
    const ch = text[nextEnd];
    const after = nextEnd + 1 < text.length ? text[nextEnd + 1] : '';
    if ((ch === '"' || ch === "'") && after && !/[\s,.;:!?)}\]」』]/u.test(after)) break;
    nextEnd += 1;
  }
  return nextEnd;
}

function fallbackSentenceSegments(text) {
  const segments = [];
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';
    const next = i + 1 < text.length ? text[i + 1] : '';
    const decimalDot = ch === '.' && /\d/.test(prev) && /\d/.test(next);
    const terminal = !decimalDot && /[.!?。！？…]/u.test(ch);
    if (terminal || ch === '\n') {
      const end = terminal ? includeTrailingSentenceClosers(text, i + 1) : i + 1;
      const trimmed = trimRange(text, start, end);
      if (trimmed.end > trimmed.start) segments.push(trimmed);
      start = end;
    }
  }
  const trimmed = trimRange(text, start, text.length);
  if (trimmed.end > trimmed.start) segments.push(trimmed);
  return segments;
}

function splitSentences(text) {
  if (!text) return [];
  if (!sentenceSegmenter) return fallbackSentenceSegments(text);
  const raw = Array.from(sentenceSegmenter.segment(text)).map((segment) => ({
    start: segment.index,
    end: segment.index + segment.segment.length,
  }));
  const segments = [];
  for (const range of raw) {
    const part = text.slice(range.start, range.end);
    const lineParts = part.includes('\n') ? fallbackSentenceSegments(part) : [trimRange(text, range.start, range.end)];
    for (const lineRange of lineParts) {
      const absolute =
        lineRange.start >= range.start
          ? lineRange
          : { start: range.start + lineRange.start, end: range.start + lineRange.end };
      const end = includeTrailingSentenceClosers(text, absolute.end);
      const trimmed = trimRange(text, absolute.start, end);
      if (trimmed.end > trimmed.start) segments.push(trimmed);
    }
  }
  if (!segments.length) {
    const trimmed = trimRange(text, 0, text.length);
    if (trimmed.end > trimmed.start) segments.push(trimmed);
  }
  return segments;
}

function passageSentences(passage) {
  const sentences = [];
  for (const para of paragraphsOf(passage)) {
    splitSentences(para.text || '').forEach((range, index) => {
      sentences.push({
        paragraphId: para.id,
        sentenceIndex: index + 1,
        start: range.start,
        end: range.end,
        text: para.text.slice(range.start, range.end),
      });
    });
  }
  return sentences;
}

function sentencesByParagraph(sentences) {
  const map = new Map();
  for (const sentence of sentences) {
    if (!map.has(sentence.paragraphId)) map.set(sentence.paragraphId, []);
    map.get(sentence.paragraphId).push(sentence);
  }
  return map;
}

function normalizeHighlightRanges(highlight, passage) {
  if (!highlight) return [];
  if (Array.isArray(highlight.ranges)) {
    return highlight.ranges.filter(Boolean).map((range) => ({
      paragraphId: range.paragraphId,
      start: Number(range.start),
      end: Number(range.end),
    }));
  }
  if (Array.isArray(highlight.paragraphIds)) {
    const pMap = paragraphMap(passage);
    return highlight.paragraphIds
      .map((paragraphId) => {
        const para = pMap.get(paragraphId);
        return para ? { paragraphId, start: 0, end: para.text.length } : null;
      })
      .filter(Boolean);
  }
  if (highlight.paragraphId && highlight.range) {
    return [
      {
        paragraphId: highlight.paragraphId,
        start: Number(highlight.range.start),
        end: Number(highlight.range.end),
      },
    ];
  }
  if (highlight.paragraphId && highlight.mode === 'PARAGRAPH') {
    const para = paragraphMap(passage).get(highlight.paragraphId);
    return para ? [{ paragraphId: highlight.paragraphId, start: 0, end: para.text.length }] : [];
  }
  return [];
}

function normalizeAnswerRanges(question) {
  if (!Array.isArray(question?.answerRanges)) return [];
  return question.answerRanges.filter(Boolean).map((range) => ({
    paragraphId: range.paragraphId,
    start: Number(range.start),
    end: Number(range.end),
  }));
}

function dedupeRanges(ranges) {
  const seen = new Set();
  const deduped = [];
  for (const range of ranges) {
    const key = `${range.paragraphId}:${range.start}:${range.end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(range);
  }
  return deduped;
}

function rangeText(range, passage) {
  const para = paragraphMap(passage).get(range.paragraphId);
  if (!para) return '';
  return para.text.slice(range.start, range.end);
}

function fullSentenceRangeFor(range, byParagraph) {
  const paraSentences = byParagraph.get(range.paragraphId) || [];
  if (!paraSentences.length) return null;
  const start = Number.isFinite(range.start) ? range.start : 0;
  const end = Number.isFinite(range.end) ? range.end : start;
  let touched = paraSentences.filter((sentence) => end > sentence.start && start < sentence.end);
  if (!touched.length) {
    touched = paraSentences.filter((sentence) => start >= sentence.start && start < sentence.end);
  }
  if (!touched.length) {
    let nearest = paraSentences[0];
    let best = Math.abs(start - nearest.start);
    for (const sentence of paraSentences) {
      const distance = Math.min(Math.abs(start - sentence.start), Math.abs(start - sentence.end));
      if (distance < best) {
        nearest = sentence;
        best = distance;
      }
    }
    touched = [nearest];
  }
  return {
    paragraphId: range.paragraphId,
    start: touched[0].start,
    end: touched[touched.length - 1].end,
  };
}

function sentenceCovered(sentence, ranges) {
  return ranges.some(
    (range) =>
      range.paragraphId === sentence.paragraphId &&
      range.start <= sentence.start &&
      range.end >= sentence.end,
  );
}

function firstRangeOrder(step, orderMap) {
  const range = step.highlight?.ranges?.[0];
  if (!range) return Number.MAX_SAFE_INTEGER;
  return (orderMap.get(range.paragraphId) ?? 9999) * 1_000_000 + range.start;
}

function makeSentenceQuestion(sentence) {
  const text = sentence.text.trim();
  return {
    prompt: '이 문장에서 알 수 있는 내용으로 알맞은 것은?',
    choices: [
      { id: 'A', text },
      { id: 'B', text: '이 문장은 글의 중심 내용과 관계없는 예외만 말한다.' },
      { id: 'C', text: '이 문장은 앞뒤 내용과 반대되는 결론만 제시한다.' },
      { id: 'D', text: '이 문장은 구체적인 의미 없이 제목만 반복한다.' },
    ],
    answerId: 'A',
    scoring: {
      correctDeltaSec: 20,
      wrongDeltaSec: -40,
      eliminateWrongChoice: true,
    },
  };
}

function repairIntensive(payload, passage, sentences, stats) {
  const intensive = payload.intensive || {};
  const timeline = Array.isArray(intensive.timeline)
    ? intensive.timeline
    : Array.isArray(payload.timeline)
      ? payload.timeline
      : [];
  const byParagraph = sentencesByParagraph(sentences);
  const orderMap = paragraphOrderMap(passage);
  const repaired = [];
  let changed = false;

  timeline.forEach((step, index) => {
    const originalRanges = normalizeHighlightRanges(step.highlight, passage);
    const fallbackSentence = sentences[Math.min(index, Math.max(sentences.length - 1, 0))];
    const rangesToRepair = originalRanges.length
      ? originalRanges
      : fallbackSentence
        ? [{ paragraphId: fallbackSentence.paragraphId, start: fallbackSentence.start, end: fallbackSentence.end }]
        : [];
    const ranges = dedupeRanges(
      rangesToRepair
        .map((range) => fullSentenceRangeFor(range, byParagraph))
        .filter(Boolean),
    );
    const nextStep = {
      ...step,
      highlight: { ranges },
      __originalOrder: index,
      __added: false,
    };
    if (JSON.stringify(originalRanges) !== JSON.stringify(ranges)) {
      changed = true;
      stats.intensiveRangesRepaired += 1;
    }
    repaired.push(nextStep);
  });

  const coveredRanges = repaired.flatMap((step) => step.highlight?.ranges || []);
  for (const sentence of sentences) {
    if (sentenceCovered(sentence, coveredRanges)) continue;
    repaired.push({
      stepId: `s${repaired.length + 1}`,
      type: 'MULTIPLE_CHOICE',
      condition: 'DETAIL',
      highlight: {
        ranges: [{ paragraphId: sentence.paragraphId, start: sentence.start, end: sentence.end }],
      },
      question: makeSentenceQuestion(sentence),
      __originalOrder: Number.MAX_SAFE_INTEGER,
      __added: true,
    });
    stats.intensiveStepsAdded += 1;
    changed = true;
  }

  repaired.sort((a, b) => {
    const orderDiff = firstRangeOrder(a, orderMap) - firstRangeOrder(b, orderMap);
    if (orderDiff) return orderDiff;
    return a.__originalOrder - b.__originalOrder;
  });

  repaired.forEach((step, index) => {
    if (step.stepId !== `s${index + 1}`) changed = true;
    step.stepId = `s${index + 1}`;
    delete step.__originalOrder;
    delete step.__added;
  });

  if (Array.isArray(intensive.timeline)) {
    intensive.timeline = repaired;
    payload.intensive = intensive;
  } else if (Array.isArray(payload.timeline)) {
    payload.timeline = repaired;
  } else {
    payload.intensive = { ...intensive, timeline: repaired };
    changed = true;
  }
  return changed;
}

function findAllOccurrences(passage, needle) {
  if (!needle || typeof needle !== 'string') return [];
  const ranges = [];
  for (const para of paragraphsOf(passage)) {
    const text = para.text || '';
    let start = 0;
    while (start <= text.length) {
      const index = text.indexOf(needle, start);
      if (index === -1) break;
      ranges.push({ paragraphId: para.id, start: index, end: index + needle.length });
      start = index + Math.max(needle.length, 1);
    }
  }
  return ranges;
}

function stripPromptTerm(term) {
  return term
    .replace(/^문맥상\s*/u, '')
    .replace(/[“”"'‘’「」『』]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function extractPromptTerm(prompt = '') {
  const quoted = prompt.match(/[“"'‘’「『]([^“”"'‘’」』]{1,40})[”"'‘’」』]/u);
  if (quoted) return stripPromptTerm(quoted[1]);
  const patterns = [
    /문맥상\s+(.{1,30}?)(?:은|는|이|가)\s+(?:무엇|무슨|어떤)\s*(?:을|를)?\s*뜻/u,
    /^(.{1,30}?)(?:은|는|이|가)\s+무슨\s+뜻/u,
    /^(.{1,30}?)(?:은|는|이|가)\s+무엇/u,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match) {
      const term = stripPromptTerm(match[1]);
      if (term && !/[?？.]/u.test(term)) return term;
    }
  }
  return '';
}

function uniformCurrentRangeText(question, passage) {
  const texts = normalizeAnswerRanges(question)
    .map((range) => rangeText(range, passage).trim())
    .filter(Boolean);
  if (!texts.length) return '';
  return texts.every((text) => text === texts[0]) ? texts[0] : '';
}

function sentenceContainingRange(range, sentences) {
  return sentences.find(
    (sentence) =>
      sentence.paragraphId === range.paragraphId &&
      range.start < sentence.end &&
      range.end > sentence.start,
  );
}

function sentenceContainingTerm(term, passage, sentences) {
  if (!term) return null;
  const occurrence = findAllOccurrences(passage, term)[0];
  if (!occurrence) return null;
  return sentenceContainingRange(occurrence, sentences);
}

function sentenceSpanForExistingRanges(question, sentences) {
  const ranges = normalizeAnswerRanges(question);
  if (!ranges.length) return null;
  const paragraphIds = new Set(ranges.map((range) => range.paragraphId));
  if (paragraphIds.size === 1) {
    const paragraphId = ranges[0].paragraphId;
    const touched = sentences.filter(
      (sentence) =>
        sentence.paragraphId === paragraphId &&
        ranges.some((range) => range.start < sentence.end && range.end > sentence.start),
    );
    if (touched.length) {
      return {
        paragraphId,
        start: Math.min(...touched.map((sentence) => sentence.start)),
        end: Math.max(...touched.map((sentence) => sentence.end)),
      };
    }
  }
  return sentenceContainingRange(ranges[0], sentences);
}

function choosePassageAnswer(question, passage, sentences, stats) {
  const existingAnswerText = typeof question.answerText === 'string' ? question.answerText.trim() : '';
  if (existingAnswerText && findAllOccurrences(passage, existingAnswerText).length) {
    return { text: existingAnswerText, mode: 'EXACT_ANSWER_TEXT' };
  }

  const promptTerm = extractPromptTerm(question.prompt || '');
  const currentText = uniformCurrentRangeText(question, passage);

  if (!existingAnswerText && promptTerm && findAllOccurrences(passage, promptTerm).length) {
    return { text: promptTerm, mode: 'PROMPT_TERM' };
  }
  if (!existingAnswerText && currentText && findAllOccurrences(passage, currentText).length) {
    return { text: currentText, mode: 'CURRENT_RANGE_TEXT' };
  }

  const targetSentence =
    sentenceSpanForExistingRanges(question, sentences) ||
    sentenceContainingTerm(promptTerm || currentText, passage, sentences) ||
    sentences[0];
  if (!targetSentence) return null;

  const para = paragraphMap(passage).get(targetSentence.paragraphId);
  if (!para) return null;
  const text = para.text.slice(targetSentence.start, targetSentence.end).trim();
  if (!text) return null;
  stats.confirmDefinitionStyleApplied += 1;
  return { text, mode: existingAnswerText ? 'DEFINITION_SPAN_FOR_MISSING_ANSWER_TEXT' : 'SPAN_FOR_UNVERIFIABLE_QUESTION' };
}

function repairConfirm(payload, passage, sentences, stats) {
  const confirm = payload.confirm || {};
  const questions = Array.isArray(confirm.questions) ? confirm.questions : [];
  let changed = false;

  questions.forEach((question) => {
    const chosen = choosePassageAnswer(question, passage, sentences, stats);
    if (!chosen) {
      stats.confirmUnresolved += 1;
      return;
    }
    const ranges = findAllOccurrences(passage, chosen.text);
    if (!ranges.length) {
      stats.confirmUnresolved += 1;
      return;
    }
    const nextRanges = dedupeRanges(ranges);
    const beforeText = question.answerText;
    const beforeRanges = normalizeAnswerRanges(question);
    question.answerText = chosen.text;
    question.answerRanges = nextRanges;
    if (!question.answerMatchMode) question.answerMatchMode = 'ANY';
    if (beforeText !== question.answerText || JSON.stringify(beforeRanges) !== JSON.stringify(nextRanges)) {
      changed = true;
      stats.confirmQuestionsRepaired += 1;
      stats.confirmRangesWritten += nextRanges.length;
    }
  });

  payload.confirm = confirm;
  return changed;
}

function validateDoc(doc) {
  const errors = [];
  const payload = payloadOf(doc);
  const passage = payload.passage || {};
  const paragraphs = paragraphsOf(passage);
  const pMap = paragraphMap(passage);
  const sentences = passageSentences(passage);
  const byParagraph = sentencesByParagraph(sentences);

  if (BAD_TEXT.test(JSON.stringify(doc))) errors.push('BROKEN_TEXT_REMAINS');

  const timeline = payload.intensive?.timeline || payload.timeline || [];
  const intensiveRanges = [];
  timeline.forEach((step, stepIndex) => {
    const ranges = normalizeHighlightRanges(step.highlight, passage);
    if (!step.question?.prompt) errors.push(`INTENSIVE_STEP_WITHOUT_QUESTION:${stepIndex + 1}`);
    ranges.forEach((range) => {
      const para = pMap.get(range.paragraphId);
      if (!para) {
        errors.push(`INTENSIVE_RANGE_MISSING_PARAGRAPH:${stepIndex + 1}`);
        return;
      }
      if (range.start < 0 || range.end > para.text.length || range.start >= range.end) {
        errors.push(`INTENSIVE_RANGE_OUT_OF_BOUNDS:${stepIndex + 1}`);
        return;
      }
      const trimmed = trimRange(para.text, range.start, range.end);
      const touched = (byParagraph.get(range.paragraphId) || []).filter(
        (sentence) => trimmed.end > sentence.start && trimmed.start < sentence.end,
      );
      if (!touched.length) {
        errors.push(`INTENSIVE_RANGE_NO_SENTENCE:${stepIndex + 1}`);
        return;
      }
      const expectedStart = touched[0].start;
      const expectedEnd = touched[touched.length - 1].end;
      if (trimmed.start !== expectedStart || trimmed.end !== expectedEnd) {
        errors.push(`INTENSIVE_RANGE_NOT_SENTENCE_BOUNDARY:${stepIndex + 1}`);
      }
      intensiveRanges.push(range);
    });
  });

  sentences.forEach((sentence) => {
    if (!sentenceCovered(sentence, intensiveRanges)) {
      errors.push(`INTENSIVE_SENTENCE_NOT_COVERED:${sentence.paragraphId}:${sentence.start}-${sentence.end}`);
    }
  });

  const questions = payload.confirm?.questions || [];
  questions.forEach((question, questionIndex) => {
    if (!question.answerText) {
      errors.push(`CONFIRM_MISSING_ANSWER_TEXT:${questionIndex + 1}`);
      return;
    }
    const expected = dedupeRanges(findAllOccurrences(passage, question.answerText));
    const actual = dedupeRanges(normalizeAnswerRanges(question));
    if (!expected.length) {
      errors.push(`CONFIRM_ANSWER_TEXT_NOT_FOUND:${questionIndex + 1}`);
      return;
    }
    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
      errors.push(`CONFIRM_RANGE_MISMATCH:${questionIndex + 1}`);
    }
  });

  paragraphs.forEach((para) => {
    if (typeof para.text !== 'string') errors.push(`PASSAGE_PARAGRAPH_TEXT_INVALID:${para.id}`);
  });

  return errors;
}

function repairDoc(doc, stats) {
  const fixed = structuredClone(doc);
  const payload = payloadOf(fixed);
  const passage = payload.passage || {};
  const sentences = passageSentences(passage);

  const before = JSON.stringify(fixed);
  repairIntensive(payload, passage, sentences, stats);
  repairConfirm(payload, passage, sentences, stats);
  const after = JSON.stringify(fixed);
  return { fixed, changed: before !== after, errors: validateDoc(fixed) };
}

function levelDir(levelId) {
  return String(levelId || '').toLowerCase().replace(/_/gu, '');
}

function localPathFor(row, doc) {
  const level = levelDir(row.level_id || doc.targetLevel);
  const day = String(row.day_index ?? doc.dayIndex ?? '').padStart(3, '0');
  return path.join(DAILY_DIR, level, `${day}.json`);
}

async function loadDbRows(conn) {
  const [rows] = await conn.query(
    `SELECT c.id, c.title, c.level_id, c.day_index, cv.content_json
     FROM contents c
     JOIN content_versions cv ON cv.content_id = c.id
     WHERE c.content_type = 'DAILY_READING'
     ORDER BY c.level_id, c.day_index, c.id`,
  );
  const selected = LIMIT ? rows.slice(0, LIMIT) : rows;
  return selected.map((row) => ({
    ...row,
    doc: parseMaybeJson(row.content_json),
  }));
}

function writeLocalDocs(items) {
  for (const item of items) {
    const filePath = localPathFor(item.row, item.fixed);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(item.fixed, null, 2)}\n`, 'utf8');
  }
}

async function updateDb(conn, changedItems) {
  await conn.beginTransaction();
  try {
    for (const item of changedItems) {
      await conn.execute(
        'UPDATE content_versions SET content_json = ?, updated_at = NOW() WHERE content_id = ?',
        [JSON.stringify(item.fixed), item.row.id],
      );
      await conn.execute(
        'UPDATE contents SET title = ?, updated_at = NOW() WHERE id = ?',
        [item.fixed.title || item.row.title, item.row.id],
      );
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  }
}

async function main() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dbConfig = readDbConfig();
  const tunnel = await createTunnel(dbConfig);
  let conn;
  try {
    conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: tunnel.localPort,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      charset: 'utf8mb4',
      multipleStatements: false,
    });

    const rows = await loadDbRows(conn);
    const backupPath = path.join(TMP_DIR, `daily-reading-range-repair-db-backup-${stamp}.json`);
    fs.writeFileSync(
      backupPath,
      `${JSON.stringify(rows.map((row) => ({
        id: row.id,
        title: row.title,
        level_id: row.level_id,
        day_index: row.day_index,
        content_json: row.doc,
      })), null, 2)}\n`,
      'utf8',
    );

    const stats = {
      total: rows.length,
      changed: 0,
      unchanged: 0,
      intensiveRangesRepaired: 0,
      intensiveStepsAdded: 0,
      confirmQuestionsRepaired: 0,
      confirmRangesWritten: 0,
      confirmDefinitionStyleApplied: 0,
      confirmUnresolved: 0,
      validationErrorContents: 0,
      validationErrors: 0,
    };

    const repairedItems = [];
    const validationSamples = [];
    for (const row of rows) {
      const { fixed, changed, errors } = repairDoc(row.doc, stats);
      if (changed) stats.changed += 1;
      else stats.unchanged += 1;
      if (errors.length) {
        stats.validationErrorContents += 1;
        stats.validationErrors += errors.length;
        validationSamples.push({ id: row.id, title: row.title, errors: errors.slice(0, 10) });
      }
      repairedItems.push({ row, fixed, changed, errors });
    }

    if (validationSamples.length) {
      const validationPath = path.join(TMP_DIR, `daily-reading-range-repair-validation-errors-${stamp}.json`);
      fs.writeFileSync(validationPath, `${JSON.stringify(validationSamples, null, 2)}\n`, 'utf8');
      throw new Error(`Validation failed for ${validationSamples.length} contents. See ${validationPath}`);
    }
    if (stats.confirmUnresolved) {
      throw new Error(`Unresolved confirm questions remain: ${stats.confirmUnresolved}`);
    }

    if (WRITE_LOCAL) writeLocalDocs(repairedItems);
    if (APPLY_DB) await updateDb(conn, repairedItems.filter((item) => item.changed));

    const report = {
      generatedAt: new Date().toISOString(),
      mode: { writeLocal: WRITE_LOCAL, applyDb: APPLY_DB, limit: LIMIT },
      backupPath,
      stats,
      changedSamples: repairedItems
        .filter((item) => item.changed)
        .slice(0, 20)
        .map((item) => ({
          id: item.row.id,
          title: item.fixed.title || item.row.title,
          levelId: item.row.level_id,
          dayIndex: item.row.day_index,
          localPath: path.relative(ROOT, localPathFor(item.row, item.fixed)).replace(/\\/gu, '/'),
        })),
    };
    const reportPath = path.join(TMP_DIR, `daily-reading-range-repair-report-${stamp}.json`);
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({ reportPath, ...report }, null, 2));
  } finally {
    if (conn) await conn.end();
    await closeTunnel(tunnel);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
