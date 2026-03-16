/**
 * Validate a single daily-reading JSON file without modifying it.
 *
 * Usage:
 *   node frontend/public/daily-reading/tools/validate_daily_reading_one.js --file frontend/public/daily-reading/saussure1/010.json
 */

const fs = require("fs");
const path = require("path");

const LENGTH_RANGES = {
  SAUSSURE_1: { min: 450, max: 550 },
  SAUSSURE_2: { min: 540, max: 660 },
  SAUSSURE_3: { min: 630, max: 770 },
  FREGE_1: { min: 720, max: 880 },
  FREGE_2: { min: 810, max: 990 },
  FREGE_3: { min: 900, max: 1100 },
  RUSSELL_1: { min: 990, max: 1210 },
  RUSSELL_2: { min: 1080, max: 1320 },
  RUSSELL_3: { min: 1170, max: 1430 },
  WITTGENSTEIN_1: { min: 1260, max: 1540 },
  WITTGENSTEIN_2: { min: 1350, max: 1650 },
  WITTGENSTEIN_3: { min: 1440, max: 1760 },
};

function parseArgs(argv) {
  const out = { file: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--file") out.file = argv[++i];
  }
  if (!out.file) throw new Error("Missing --file");
  return out;
}

function choiceLenRatio(choiceTexts) {
  const lens = choiceTexts.map((text) => Array.from(String(text)).length);
  const maxLen = Math.max(...lens);
  const minLen = Math.min(...lens);
  return maxLen === 0 ? 0 : (maxLen - minLen) / maxLen;
}

function findAllOccurrences(text, term) {
  const out = [];
  if (!term) return out;
  let cursor = 0;
  while (true) {
    const found = text.indexOf(term, cursor);
    if (found === -1) break;
    out.push({ start: found, end: found + term.length });
    cursor = found + term.length;
  }
  return out;
}

function normalizeConfirmMatchMode(mode) {
  return String(mode || "ALL").toUpperCase() === "ANY" ? "ANY" : "ALL";
}

function extractQuotedTerms(prompt) {
  if (typeof prompt !== "string") return [];
  return Array.from(prompt.matchAll(/'([^']+)'/g)).map((match) => match[1]);
}

function normalizeLooseText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeComparableText(text) {
  return String(text || "")
    .replace(/[\p{P}\p{S}\s]+/gu, "")
    .trim();
}

function looksLikeDirectFindPrompt(prompt) {
  const normalized = normalizeLooseText(prompt);
  if (!normalized) return false;
  if (/^(지문|본문)(에서|속에서)/.test(normalized)) return true;
  if (/^(지문|본문).*(찾아|찾고|클릭|눌러|고르)/.test(normalized)) return true;
  const firstQuoteIndex = normalized.search(/'[^']+'/);
  const questionIndex = normalized.indexOf("?");
  return firstQuoteIndex !== -1 && (questionIndex === -1 || firstQuoteIndex < questionIndex);
}

function isQuestionStylePrompt(prompt) {
  const normalized = normalizeLooseText(prompt);
  if (!normalized) return false;
  const questionIndex = normalized.indexOf("?");
  if (questionIndex === -1) return false;
  const head = normalized.slice(0, questionIndex + 1);
  return /(무엇|무슨|어떤|어디|어느|누구|왜|어떻게|어찌|몇|얼마|까닭|이유)/.test(head);
}

function copiesHighlightedTextVerbatim(choiceText, highlightedText) {
  const normalizedChoice = normalizeComparableText(choiceText);
  const normalizedHighlight = normalizeComparableText(highlightedText);
  if (!normalizedChoice || !normalizedHighlight) return false;
  if (normalizedChoice === normalizedHighlight) return true;
  return normalizedChoice.length >= 10 && normalizedHighlight.includes(normalizedChoice);
}

function extractSentenceRanges(text) {
  const ranges = [];
  const regex = /[^.]+\./g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
    });
  }
  return ranges;
}

function validateLessonJson({ json }) {
  const errs = [];
  const fail = (msg) => errs.push(msg);

  const level = json?.targetLevel;
  const lengthRange = LENGTH_RANGES[level];
  if (!lengthRange) fail(`unknown or unsupported targetLevel: ${String(level)}`);

  const paragraphs = json?.payload?.passage?.paragraphs || [];
  if (paragraphs.length !== 2) fail(`passage.paragraphs must be 2 (got ${paragraphs.length})`);
  for (const paragraph of paragraphs) {
    if (!paragraph || typeof paragraph.id !== "string") fail("paragraph id must be string");
    if (!paragraph || typeof paragraph.text !== "string") fail(`paragraph text must be string (${paragraph?.id})`);
    if (typeof paragraph?.text === "string" && /\r|\n/.test(paragraph.text)) {
      fail(`paragraph text must not include newline (${paragraph.id})`);
    }
  }

  if (lengthRange && paragraphs.length === 2) {
    const totalLen = paragraphs.reduce((sum, paragraph) => sum + Array.from(paragraph.text).length, 0);
    if (totalLen < lengthRange.min || totalLen > lengthRange.max) {
      fail(`passage length out of range: ${totalLen} (expected ${lengthRange.min}-${lengthRange.max})`);
    }
  }

  const sentenceRangesByParagraph = new Map();
  for (const paragraph of paragraphs) {
    const sentenceRanges = extractSentenceRanges(paragraph.text);
    sentenceRangesByParagraph.set(paragraph.id, sentenceRanges);
    const reconstructed = sentenceRanges.map((range) => range.text).join("");
    if (reconstructed !== paragraph.text) {
      fail(`paragraph sentences must be full-stop delimited without leftover text (${paragraph.id})`);
    }
  }

  const timeline = json?.payload?.intensive?.timeline || [];
  const expectedTimelineLength = paragraphs.reduce((sum, paragraph) => {
    const sentenceRanges = sentenceRangesByParagraph.get(paragraph.id) || [];
    return sum + sentenceRanges.length + 1;
  }, 0);
  if (timeline.length !== expectedTimelineLength) {
    fail(`timeline length mismatch: ${timeline.length} (expected ${expectedTimelineLength})`);
  }

  let timelineIndex = 0;
  for (const paragraph of paragraphs) {
    const sentenceRanges = sentenceRangesByParagraph.get(paragraph.id) || [];
    for (const sentenceRange of sentenceRanges) {
      const step = timeline[timelineIndex];
      const expectedId = `s${timelineIndex + 1}`;
      if (step?.stepId !== expectedId) fail(`stepId mismatch: expected ${expectedId}, got ${step?.stepId}`);
      if (step?.highlight?.paragraphId !== paragraph.id) fail(`sentence step paragraph mismatch at ${expectedId}`);

      const range = step?.highlight?.range;
      if (!range || typeof range.start !== "number" || typeof range.end !== "number") {
        fail(`invalid range at ${expectedId}`);
      } else if (range.start !== sentenceRange.start || range.end !== sentenceRange.end) {
        fail(`sentence highlight must match exact sentence at ${expectedId}: expected [${sentenceRange.start},${sentenceRange.end}), got [${range.start},${range.end})`);
      }

      const question = step?.question;
      if (!question || typeof question.prompt !== "string") fail(`missing prompt (${expectedId})`);
      const choices = question?.choices || [];
      if (choices.length !== 4) fail(`choices must be 4 (${expectedId})`);
      const choiceTexts = choices.map((choice) => (choice ? String(choice.text) : ""));
      const ratio = choiceLenRatio(choiceTexts);
      if (ratio > 0.15) fail(`choice length ratio too high (${expectedId}): ${ratio.toFixed(3)}`);
      for (const choiceText of choiceTexts) {
        if (copiesHighlightedTextVerbatim(choiceText, sentenceRange.text)) {
          fail(`choice text must not copy highlighted sentence verbatim (${expectedId})`);
        }
      }

      timelineIndex += 1;
    }

    const summaryStep = timeline[timelineIndex];
    const expectedSummaryId = `s${timelineIndex + 1}`;
    if (summaryStep?.stepId !== expectedSummaryId) fail(`stepId mismatch: expected ${expectedSummaryId}, got ${summaryStep?.stepId}`);
    if (summaryStep?.highlight?.paragraphId !== paragraph.id) fail(`summary step paragraph mismatch at ${expectedSummaryId}`);

    const summaryRange = summaryStep?.highlight?.range;
    if (!summaryRange || typeof summaryRange.start !== "number" || typeof summaryRange.end !== "number") {
      fail(`invalid range at ${expectedSummaryId}`);
    } else if (summaryRange.start !== 0 || summaryRange.end !== paragraph.text.length) {
      fail(`summary highlight must cover full paragraph (${expectedSummaryId})`);
    }

    const summaryQuestion = summaryStep?.question;
    if (!summaryQuestion || typeof summaryQuestion.prompt !== "string") fail(`missing prompt (${expectedSummaryId})`);
    const summaryChoices = summaryQuestion?.choices || [];
    if (summaryChoices.length !== 4) fail(`choices must be 4 (${expectedSummaryId})`);
    const summaryChoiceTexts = summaryChoices.map((choice) => (choice ? String(choice.text) : ""));
    const summaryRatio = choiceLenRatio(summaryChoiceTexts);
    if (summaryRatio > 0.15) fail(`choice length ratio too high (${expectedSummaryId}): ${summaryRatio.toFixed(3)}`);
    for (const choiceText of summaryChoiceTexts) {
      if (copiesHighlightedTextVerbatim(choiceText, paragraph.text)) {
        fail(`choice text must not copy highlighted paragraph verbatim (${expectedSummaryId})`);
      }
    }

    timelineIndex += 1;
  }

  const cards = json?.payload?.recall?.cards || [];
  if (cards.length !== 8) fail(`recall.cards must be 8 (got ${cards.length})`);
  const correctOrder = json?.payload?.recall?.correctOrder || [];
  if (correctOrder.length !== cards.length) fail(`recall.correctOrder length mismatch (cards=${cards.length}, order=${correctOrder.length})`);

  const confirmQuestions = json?.payload?.confirm?.questions || [];
  if (confirmQuestions.length < 5 || confirmQuestions.length > 10) {
    fail(`confirm.questions must be 5-10 (got ${confirmQuestions.length})`);
  }
  for (const question of confirmQuestions) {
    const prompt = typeof question?.prompt === "string" ? question.prompt.trim() : "";
    if (!prompt) {
      fail(`confirm prompt missing (${question?.id})`);
      continue;
    }
    if (!isQuestionStylePrompt(prompt)) {
      fail(`confirm prompt must be question form (${question?.id})`);
    }
    if (looksLikeDirectFindPrompt(prompt)) {
      fail(`confirm prompt must not start with direct find instruction (${question?.id})`);
    }

    const matchMode = normalizeConfirmMatchMode(question?.answerMatchMode || question?.answerMode);
    const answerTerms = Array.isArray(question?.answerTexts)
      ? question.answerTexts.map((term) => String(term).trim()).filter(Boolean)
      : typeof question?.answerText === "string" && question.answerText.trim()
      ? [question.answerText.trim()]
      : extractQuotedTerms(prompt);
    const answerRanges = question?.answerRanges || [];
    if (answerTerms.length === 0 && answerRanges.length === 0) {
      fail(`confirm question must provide answerText(s), quoted term, or answerRanges (${question?.id})`);
      continue;
    }
    if (answerRanges.length === 0) {
      fail(`confirm answerRanges required (${question?.id})`);
      continue;
    }

    const expectedRanges = [];
    for (const term of answerTerms) {
      for (const paragraph of paragraphs) {
        for (const found of findAllOccurrences(paragraph.text, term)) {
          expectedRanges.push({ paragraphId: paragraph.id, start: found.start, end: found.end });
        }
      }
    }
    if (answerTerms.length > 0 && expectedRanges.length === 0) {
      fail(`confirm answerText not found in passage (${question?.id}): ${answerTerms.map((term) => `'${term}'`).join(", ")}`);
      continue;
    }

    const toKey = (range) => `${range.paragraphId}:${range.start}:${range.end}`;
    const answerRangeKeys = new Set(answerRanges.map(toKey));
    if (answerTerms.length > 0) {
      for (const range of answerRanges) {
        const exists = expectedRanges.some((expectedRange) => toKey(expectedRange) === toKey(range));
        if (!exists) {
          fail(`confirm has extra/invalid range for ${answerTerms.map((term) => `'${term}'`).join(", ")}: ${toKey(range)}`);
        }
      }
    }

    if (answerRanges.length === 0) continue;
    if (answerTerms.length === 0) {
      if (matchMode === "ALL" && answerRanges.length < 2) {
        fail(`confirm ALL question must include at least two ranges when only answerRanges are provided (${question?.id})`);
      }
      if (matchMode === "ANY" && answerRanges.length < 1) {
        fail(`confirm ANY question must include at least one range (${question?.id})`);
      }
      continue;
    }

    if (matchMode === "ALL") {
      if (expectedRanges.length < 2) {
        fail(`confirm ALL question must map to at least two valid ranges (${question?.id})`);
      }
      for (const range of expectedRanges) {
        if (!answerRangeKeys.has(toKey(range))) {
          fail(`confirm missing range for ${answerTerms.map((term) => `'${term}'`).join(", ")}: ${toKey(range)}`);
        }
      }
    } else if (answerRanges.length < 1) {
      fail(`confirm ANY question must include at least one valid range when answerRanges is provided (${question?.id})`);
    }
  }

  if (errs.length > 0) {
    const err = new Error(errs[0]);
    err.all = errs;
    throw err;
  }
}

function main() {
  const args = parseArgs(process.argv);
  const filePath = path.resolve(process.cwd(), args.file);
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const json = JSON.parse(raw);

  validateLessonJson({ json });
  console.log(`PASS ${args.file}`);
}

if (require.main === module) {
  main();
}
