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
const SOURCE = (process.argv.find((arg) => arg.startsWith('--source=')) || '--source=db').split('=')[1];
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

async function loadDbItems() {
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
    });
    const [rows] = await conn.query(
      `SELECT c.id, c.title, c.level_id, c.day_index, cv.content_json
       FROM contents c
       JOIN content_versions cv ON cv.content_id = c.id
       WHERE c.content_type = 'DAILY_READING'
       ORDER BY c.level_id, c.day_index, c.id`,
    );
    return rows.map((row) => ({
      source: 'db',
      rel: null,
      contentId: row.id,
      dbTitle: row.title,
      levelId: row.level_id,
      dayIndex: row.day_index,
      doc: parseMaybeJson(row.content_json),
    }));
  } finally {
    if (conn) await conn.end();
    await closeTunnel(tunnel);
  }
}

function loadLocalItems() {
  const items = [];
  for (const level of LEVELS) {
    const dir = path.join(DAILY_DIR, level);
    if (!fs.existsSync(dir)) continue;
    for (const fileName of fs.readdirSync(dir).filter((name) => /^\d{3}\.json$/.test(name)).sort()) {
      const rel = path.relative(ROOT, path.join(dir, fileName)).replace(/\\/g, '/');
      const doc = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
      items.push({
        source: 'local',
        rel,
        contentId: doc.contentId,
        dbTitle: null,
        levelId: doc.targetLevel,
        dayIndex: Number(fileName.slice(0, 3)),
        doc,
      });
    }
  }
  return items;
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

function trimRange(text, start, end) {
  let s = Math.max(0, Math.min(start, text.length));
  let e = Math.max(s, Math.min(end, text.length));
  while (s < e && /\s/u.test(text[s])) s += 1;
  while (e > s && /\s/u.test(text[e - 1])) e -= 1;
  return { start: s, end: e };
}

function fallbackSentenceSegments(text) {
  const segments = [];
  let start = 0;
  let i = 0;
  const closers = new Set(['"', "'", '”', '’', '」', '』', ')', ']', '〉', '》']);
  while (i < text.length) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';
    const next = i + 1 < text.length ? text[i + 1] : '';
    const decimalDot = ch === '.' && /\d/.test(prev) && /\d/.test(next);
    const terminal = !decimalDot && /[.!?。？！…]/u.test(ch);
    if (terminal || ch === '\n') {
      let end = i + 1;
      while (end < text.length && closers.has(text[end])) end += 1;
      const trimmed = trimRange(text, start, end);
      if (trimmed.end > trimmed.start) segments.push(trimmed);
      start = end;
      i = end;
      continue;
    }
    i += 1;
  }
  const trimmed = trimRange(text, start, text.length);
  if (trimmed.end > trimmed.start) segments.push(trimmed);
  return segments;
}

function splitSentences(text) {
  if (!text) return [];
  let raw = [];
  if (sentenceSegmenter) {
    raw = Array.from(sentenceSegmenter.segment(text)).map((segment) => ({
      start: segment.index,
      end: segment.index + segment.segment.length,
    }));
  } else {
    raw = fallbackSentenceSegments(text);
  }
  const segments = [];
  for (const range of raw) {
    const part = text.slice(range.start, range.end);
    const lineParts = part.includes('\n') ? fallbackSentenceSegments(part) : [trimRange(text, range.start, range.end)];
    for (const lineRange of lineParts) {
      const absolute =
        lineRange.start >= range.start
          ? lineRange
          : { start: range.start + lineRange.start, end: range.start + lineRange.end };
      const trimmed = trimRange(text, absolute.start, absolute.end);
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
    const text = para.text || '';
    splitSentences(text).forEach((range, index) => {
      sentences.push({
        paragraphId: para.id,
        sentenceIndex: index + 1,
        start: range.start,
        end: range.end,
        text: text.slice(range.start, range.end),
      });
    });
  }
  return sentences;
}

function normalizeHighlightRanges(highlight, passage) {
  if (!highlight) return [];
  if (Array.isArray(highlight.ranges)) {
    return highlight.ranges.filter(Boolean).map((range) => ({
      paragraphId: range.paragraphId,
      start: range.start,
      end: range.end,
    }));
  }
  if (Array.isArray(highlight.paragraphIds)) {
    const pMap = paragraphMap(passage);
    return highlight.paragraphIds
      .map((paragraphId) => {
        const para = pMap.get(paragraphId);
        return para ? { paragraphId, start: 0, end: (para.text || '').length } : null;
      })
      .filter(Boolean);
  }
  if (highlight.paragraphId && highlight.range) {
    return [{ paragraphId: highlight.paragraphId, start: highlight.range.start, end: highlight.range.end }];
  }
  if (highlight.paragraphId && highlight.mode === 'PARAGRAPH') {
    const para = paragraphMap(passage).get(highlight.paragraphId);
    return para ? [{ paragraphId: highlight.paragraphId, start: 0, end: (para.text || '').length }] : [];
  }
  return [];
}

function excerpt(text, start = 0, end = text.length, limit = 120) {
  const value = String(text || '').slice(Math.max(0, start), Math.max(start, end)).replace(/\s+/g, ' ').trim();
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1)}…`;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

function rangeKey(range) {
  return `${range.paragraphId}:${range.start}-${range.end}`;
}

function auditIntensive(item, payload, passage, sentences, contentResult) {
  const pMap = paragraphMap(passage);
  const byParagraph = new Map();
  for (const sentence of sentences) {
    if (!byParagraph.has(sentence.paragraphId)) byParagraph.set(sentence.paragraphId, []);
    byParagraph.get(sentence.paragraphId).push(sentence);
  }

  const steps = payload.intensive?.timeline || payload.timeline || [];
  const sentenceCoverage = new Map(sentences.map((sentence) => [rangeKey(sentence), new Set()]));

  steps.forEach((step, stepIndex) => {
    if (!step?.question) {
      contentResult.intensive.stepMissingQuestion.push({
        stepIndex: stepIndex + 1,
        stepId: step?.stepId || null,
      });
      return;
    }

    const ranges = normalizeHighlightRanges(step.highlight, passage);
    if (!ranges.length) {
      contentResult.intensive.badHighlightRanges.push({
        type: 'MISSING_HIGHLIGHT_RANGE',
        stepIndex: stepIndex + 1,
        stepId: step.stepId || null,
      });
      return;
    }

    ranges.forEach((range, rangeIndex) => {
      const para = pMap.get(range.paragraphId);
      const rawIssue = {
        stepIndex: stepIndex + 1,
        stepId: step.stepId || null,
        rangeIndex: rangeIndex + 1,
        paragraphId: range.paragraphId,
        start: range.start,
        end: range.end,
      };
      if (!para || typeof para.text !== 'string') {
        contentResult.intensive.badHighlightRanges.push({
          type: 'UNKNOWN_PARAGRAPH',
          ...rawIssue,
        });
        return;
      }
      if (!Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start < 0 || range.end <= range.start || range.end > para.text.length) {
        contentResult.intensive.badHighlightRanges.push({
          type: 'OUT_OF_BOUNDS_OR_EMPTY',
          ...rawIssue,
          paragraphLength: para.text.length,
          rangeText: Number.isInteger(range.start) && Number.isInteger(range.end) ? excerpt(para.text, range.start, range.end) : '',
        });
        return;
      }

      const trimmed = trimRange(para.text, range.start, range.end);
      const paraSentences = byParagraph.get(range.paragraphId) || [];
      const touched = paraSentences.filter((sentence) => overlaps(trimmed.start, trimmed.end, sentence.start, sentence.end));
      if (!touched.length) {
        contentResult.intensive.badHighlightRanges.push({
          type: 'NO_SENTENCE_MATCH',
          ...rawIssue,
          rangeText: excerpt(para.text, range.start, range.end),
        });
        return;
      }

      for (const sentence of touched) {
        const key = rangeKey(sentence);
        const coverage = sentenceCoverage.get(key);
        if (!coverage) continue;
        const coverStart = Math.max(sentence.start, trimmed.start);
        const coverEnd = Math.min(sentence.end, trimmed.end);
        for (let index = coverStart; index < coverEnd; index += 1) {
          if (!/\s/u.test(para.text[index])) coverage.add(index);
        }
      }

      const expectedStart = touched[0].start;
      const expectedEnd = touched[touched.length - 1].end;
      const sentenceAligned = trimmed.start === expectedStart && trimmed.end === expectedEnd;
      if (!sentenceAligned) {
        contentResult.intensive.badHighlightRanges.push({
          type: 'NOT_ALIGNED_TO_SENTENCE_BOUNDARY',
          ...rawIssue,
          trimmedStart: trimmed.start,
          trimmedEnd: trimmed.end,
          rangeText: excerpt(para.text, range.start, range.end),
          expectedStart,
          expectedEnd,
          expectedText: excerpt(para.text, expectedStart, expectedEnd),
        });
      }
    });
  });

  for (const sentence of sentences) {
    const para = pMap.get(sentence.paragraphId);
    if (!para) continue;
    const coverage = sentenceCoverage.get(rangeKey(sentence)) || new Set();
    let semanticChars = 0;
    let covered = 0;
    for (let index = sentence.start; index < sentence.end; index += 1) {
      if (!/[\p{L}\p{N}]/u.test(para.text[index])) continue;
      semanticChars += 1;
      if (coverage.has(index)) covered += 1;
    }
    if (semanticChars > 0 && covered < semanticChars) {
      contentResult.intensive.missingSentences.push({
        paragraphId: sentence.paragraphId,
        sentenceIndex: sentence.sentenceIndex,
        start: sentence.start,
        end: sentence.end,
        coveredChars: covered,
        totalChars: semanticChars,
        text: excerpt(sentence.text),
      });
    }
  }
}

function findAllOccurrences(passage, answerText) {
  const ranges = [];
  if (!answerText) return ranges;
  for (const para of paragraphsOf(passage)) {
    const text = para.text || '';
    let cursor = text.indexOf(answerText);
    while (cursor >= 0) {
      ranges.push({
        paragraphId: para.id,
        start: cursor,
        end: cursor + answerText.length,
      });
      cursor = text.indexOf(answerText, cursor + Math.max(1, answerText.length));
    }
  }
  return ranges;
}

function quoteCandidates(text) {
  const candidates = [];
  const pattern = /["'“”‘’「『]([^"'“”‘’」』]{2,160})["'“”‘’」』]/g;
  let match;
  while ((match = pattern.exec(text || ''))) {
    candidates.push(match[1].trim());
  }
  return candidates;
}

function promptTermCandidates(text) {
  const prompt = String(text || '').trim();
  const candidates = [];
  const patterns = [
    /['"“”‘’「『]?([^'"“”‘’「『」』?]{1,40}?)['"“”‘’」』]?\s*(?:은|는|이|가|을|를)?\s*(?:무슨 뜻|무엇을 뜻|어떤 뜻|어떤 의미)/u,
    /문맥상\s+([^'"“”‘’「『」』?]{1,40}?)(?:은|는|이|가|을|를)?\s*(?:무엇|어떤 뜻|어떤 의미)/u,
    /['"“”‘’「『]([^'"“”‘’「『」』?]{1,40})['"“”‘’」』]\s*(?:은|는|이|가|을|를)?/u,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (!match) continue;
    const term = match[1].trim().replace(/^(첫째|둘째|셋째|넷째|다섯째|여섯째|첫|둘째|셋째)\s*문단\s*/u, '');
    if (term && !/문단|핵심|부분|어디|무엇/u.test(term)) candidates.push(term);
  }
  return [...new Set(candidates)];
}

function inferAnswerText(question, passage, ranges, pMap) {
  if (typeof question.answerText === 'string' && question.answerText.trim()) {
    return { text: question.answerText.trim(), source: 'answerText' };
  }
  for (const quote of quoteCandidates(question.prompt)) {
    if (findAllOccurrences(passage, quote).length) return { text: quote, source: 'promptQuote' };
  }
  for (const term of promptTermCandidates(question.prompt)) {
    if (findAllOccurrences(passage, term).length) return { text: term, source: 'promptTerm' };
  }
  const substrings = [];
  for (const range of ranges) {
    const para = pMap.get(range.paragraphId);
    if (!para || typeof para.text !== 'string') continue;
    if (!Number.isInteger(range.start) || !Number.isInteger(range.end)) continue;
    if (range.start < 0 || range.end <= range.start || range.end > para.text.length) continue;
    substrings.push(para.text.slice(range.start, range.end).trim());
  }
  const unique = [...new Set(substrings.filter(Boolean))];
  if (unique.length === 1 && unique[0].length <= 160) return { text: unique[0], source: 'uniformAnswerRange' };
  if (unique.length === 1) return { text: unique[0], source: 'uniformLongAnswerRange' };
  return { text: null, source: 'unavailable' };
}

function auditConfirm(item, payload, passage, contentResult) {
  const confirm = payload.confirm || {};
  const confirmPassage = confirm.passage || passage;
  const pMap = paragraphMap(confirmPassage);
  const questions = confirm.questions || [];

  questions.forEach((question, questionIndex) => {
    const ranges = Array.isArray(question.answerRanges) ? question.answerRanges : [];
    const rangeCounts = new Map();
    for (const range of ranges) {
      rangeCounts.set(rangeKey(range), (rangeCounts.get(rangeKey(range)) || 0) + 1);
    }

    ranges.forEach((range, rangeIndex) => {
      const para = pMap.get(range.paragraphId);
      const base = {
        questionIndex: questionIndex + 1,
        questionId: question.id || null,
        prompt: question.prompt || '',
        rangeIndex: rangeIndex + 1,
        paragraphId: range.paragraphId,
        start: range.start,
        end: range.end,
      };
      if (!para || typeof para.text !== 'string') {
        contentResult.confirm.badAnswerRanges.push({ type: 'UNKNOWN_PARAGRAPH', ...base });
        return;
      }
      if (!Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start < 0 || range.end <= range.start || range.end > para.text.length) {
        contentResult.confirm.badAnswerRanges.push({
          type: 'OUT_OF_BOUNDS_OR_EMPTY',
          ...base,
          paragraphLength: para.text.length,
          rangeText: Number.isInteger(range.start) && Number.isInteger(range.end) ? excerpt(para.text, range.start, range.end) : '',
        });
        return;
      }
      if (rangeCounts.get(rangeKey(range)) > 1) {
        contentResult.confirm.badAnswerRanges.push({
          type: 'DUPLICATE_RANGE',
          ...base,
          rangeText: excerpt(para.text, range.start, range.end),
        });
      }
    });

    const comparable = inferAnswerText(question, confirmPassage, ranges, pMap);
    if (!comparable.text) {
      contentResult.confirm.unverifiableQuestions.push({
        questionIndex: questionIndex + 1,
        questionId: question.id || null,
        prompt: question.prompt || '',
        reason: 'NO_ANSWER_TEXT_OR_SINGLE_EXACT_RANGE_TEXT',
        answerRangeCount: ranges.length,
      });
      return;
    }

    const expected = findAllOccurrences(confirmPassage, comparable.text);
    const expectedKeys = new Set(expected.map(rangeKey));
    const actualKeys = new Set(ranges.map(rangeKey));

    if (!expected.length) {
      contentResult.confirm.badAnswerRanges.push({
        type: 'ANSWER_TEXT_NOT_FOUND_IN_PASSAGE',
        questionIndex: questionIndex + 1,
        questionId: question.id || null,
        prompt: question.prompt || '',
        answerText: comparable.text,
        answerTextSource: comparable.source,
      });
      return;
    }

    for (const expectedRange of expected) {
      if (!actualKeys.has(rangeKey(expectedRange))) {
        const para = pMap.get(expectedRange.paragraphId);
        contentResult.confirm.missingOccurrences.push({
          questionIndex: questionIndex + 1,
          questionId: question.id || null,
          prompt: question.prompt || '',
          answerText: comparable.text,
          answerTextSource: comparable.source,
          paragraphId: expectedRange.paragraphId,
          start: expectedRange.start,
          end: expectedRange.end,
          text: excerpt(para?.text || '', expectedRange.start, expectedRange.end),
        });
      }
    }

    for (const range of ranges) {
      const para = pMap.get(range.paragraphId);
      if (!para || !Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start < 0 || range.end <= range.start || range.end > para.text.length) continue;
      const key = rangeKey(range);
      const actualText = para.text.slice(range.start, range.end);
      if (!expectedKeys.has(key)) {
        contentResult.confirm.extraOrMismatchedRanges.push({
          questionIndex: questionIndex + 1,
          questionId: question.id || null,
          prompt: question.prompt || '',
          answerText: comparable.text,
          answerTextSource: comparable.source,
          paragraphId: range.paragraphId,
          start: range.start,
          end: range.end,
          rangeText: excerpt(actualText),
        });
      }
    }
  });
}

function createContentResult(item, doc, payload, sentences) {
  return {
    contentId: item.contentId || doc.contentId,
    rel: item.rel,
    levelId: item.levelId || doc.targetLevel || null,
    dayIndex: item.dayIndex ?? null,
    title: doc.title || item.dbTitle || '',
    sentenceCount: sentences.length,
    intensive: {
      missingSentences: [],
      badHighlightRanges: [],
      stepMissingQuestion: [],
    },
    confirm: {
      badAnswerRanges: [],
      missingOccurrences: [],
      extraOrMismatchedRanges: [],
      unverifiableQuestions: [],
    },
    structural: [],
  };
}

function hasIssues(result) {
  return (
    result.intensive.missingSentences.length ||
    result.intensive.badHighlightRanges.length ||
    result.intensive.stepMissingQuestion.length ||
    result.confirm.badAnswerRanges.length ||
    result.confirm.missingOccurrences.length ||
    result.confirm.extraOrMismatchedRanges.length ||
    result.confirm.unverifiableQuestions.length ||
    result.structural.length
  );
}

function countContents(results, selector) {
  return results.filter(selector).length;
}

function itemLevelId(item) {
  return item.levelId || item.doc?.targetLevel || payloadOf(item.doc)?.targetLevel || 'UNKNOWN';
}

function makeLevelSummary() {
  return {
    totalContents: 0,
    issueContents: 0,
    intensive: {
      missingSentenceContents: 0,
      missingSentences: 0,
      badHighlightRangeContents: 0,
      badHighlightRanges: 0,
      stepMissingQuestionContents: 0,
      stepMissingQuestions: 0,
    },
    confirm: {
      badAnswerRangeContents: 0,
      badAnswerRanges: 0,
      missingOccurrenceContents: 0,
      missingOccurrences: 0,
      extraOrMismatchedRangeContents: 0,
      extraOrMismatchedRanges: 0,
      unverifiableQuestionContents: 0,
      unverifiableQuestions: 0,
    },
    structuralContents: 0,
    structuralIssues: 0,
  };
}

function addResultToLevelSummary(target, result) {
  target.issueContents += 1;
  if (result.intensive.missingSentences.length) target.intensive.missingSentenceContents += 1;
  target.intensive.missingSentences += result.intensive.missingSentences.length;
  if (result.intensive.badHighlightRanges.length) target.intensive.badHighlightRangeContents += 1;
  target.intensive.badHighlightRanges += result.intensive.badHighlightRanges.length;
  if (result.intensive.stepMissingQuestion.length) target.intensive.stepMissingQuestionContents += 1;
  target.intensive.stepMissingQuestions += result.intensive.stepMissingQuestion.length;
  if (result.confirm.badAnswerRanges.length) target.confirm.badAnswerRangeContents += 1;
  target.confirm.badAnswerRanges += result.confirm.badAnswerRanges.length;
  if (result.confirm.missingOccurrences.length) target.confirm.missingOccurrenceContents += 1;
  target.confirm.missingOccurrences += result.confirm.missingOccurrences.length;
  if (result.confirm.extraOrMismatchedRanges.length) target.confirm.extraOrMismatchedRangeContents += 1;
  target.confirm.extraOrMismatchedRanges += result.confirm.extraOrMismatchedRanges.length;
  if (result.confirm.unverifiableQuestions.length) target.confirm.unverifiableQuestionContents += 1;
  target.confirm.unverifiableQuestions += result.confirm.unverifiableQuestions.length;
  if (result.structural.length) target.structuralContents += 1;
  target.structuralIssues += result.structural.length;
}

function summarize(results, items) {
  const byLevel = {};
  for (const item of items) {
    const levelId = itemLevelId(item);
    byLevel[levelId] ||= makeLevelSummary();
    byLevel[levelId].totalContents += 1;
  }
  for (const result of results) {
    const levelId = result.levelId || 'UNKNOWN';
    byLevel[levelId] ||= makeLevelSummary();
    addResultToLevelSummary(byLevel[levelId], result);
  }

  const sum = {
    source: SOURCE,
    totalContents: items.length,
    issueContents: results.length,
    intensive: {
      missingSentenceContents: countContents(results, (r) => r.intensive.missingSentences.length > 0),
      missingSentences: results.reduce((acc, r) => acc + r.intensive.missingSentences.length, 0),
      badHighlightRangeContents: countContents(results, (r) => r.intensive.badHighlightRanges.length > 0),
      badHighlightRanges: results.reduce((acc, r) => acc + r.intensive.badHighlightRanges.length, 0),
      stepMissingQuestionContents: countContents(results, (r) => r.intensive.stepMissingQuestion.length > 0),
      stepMissingQuestions: results.reduce((acc, r) => acc + r.intensive.stepMissingQuestion.length, 0),
    },
    confirm: {
      badAnswerRangeContents: countContents(results, (r) => r.confirm.badAnswerRanges.length > 0),
      badAnswerRanges: results.reduce((acc, r) => acc + r.confirm.badAnswerRanges.length, 0),
      missingOccurrenceContents: countContents(results, (r) => r.confirm.missingOccurrences.length > 0),
      missingOccurrences: results.reduce((acc, r) => acc + r.confirm.missingOccurrences.length, 0),
      extraOrMismatchedRangeContents: countContents(results, (r) => r.confirm.extraOrMismatchedRanges.length > 0),
      extraOrMismatchedRanges: results.reduce((acc, r) => acc + r.confirm.extraOrMismatchedRanges.length, 0),
      unverifiableQuestionContents: countContents(results, (r) => r.confirm.unverifiableQuestions.length > 0),
      unverifiableQuestions: results.reduce((acc, r) => acc + r.confirm.unverifiableQuestions.length, 0),
    },
    structuralContents: countContents(results, (r) => r.structural.length > 0),
    structuralIssues: results.reduce((acc, r) => acc + r.structural.length, 0),
    byLevel: Object.fromEntries(Object.entries(byLevel).sort(([a], [b]) => a.localeCompare(b))),
  };
  return sum;
}

async function main() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const items = SOURCE === 'local' ? loadLocalItems() : await loadDbItems();
  const issueResults = [];

  for (const item of items) {
    const doc = item.doc;
    const payload = payloadOf(doc);
    const passage = payload.passage || {};
    const sentences = passageSentences(passage);
    const result = createContentResult(item, doc, payload, sentences);

    if (BAD.test(JSON.stringify(doc))) result.structural.push({ type: 'BROKEN_TEXT_REMAINS' });
    if (!paragraphsOf(passage).length) result.structural.push({ type: 'MISSING_PASSAGE' });
    if (!sentences.length) result.structural.push({ type: 'NO_SENTENCES_DETECTED' });

    auditIntensive(item, payload, passage, sentences, result);
    auditConfirm(item, payload, passage, result);

    if (hasIssues(result)) issueResults.push(result);
  }

  const summary = summarize(issueResults, items);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const report = {
    generatedAt: new Date().toISOString(),
    criteria: {
      intensiveCoverage: 'Every detected passage sentence must be fully covered by at least one intensive step that has a question.',
      intensiveRange: 'Each intensive highlight range, after trimming surrounding whitespace, must align exactly to one or more full sentence boundaries.',
      confirmRange: 'If answerText or a single exact answer range text can be determined, every exact occurrence in the passage must be present in answerRanges, and stored ranges must match exact occurrences.',
    },
    summary,
    results: issueResults,
  };
  const reportPath = path.join(TMP_DIR, `daily-reading-range-audit-${SOURCE}-${stamp}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ reportPath, summary }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
