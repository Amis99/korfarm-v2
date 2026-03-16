/**
 * Regenerate daily-reading lessons for SAUSSURE_1.
 *
 * This is a content generator (not a bulk "auto-fix" patcher). It overwrites the
 * target day JSONs with a consistent schema and runs strict validation per file.
 *
 * Usage:
 *   node frontend/public/daily-reading/tools/regenerate_saussure1.js --from 10 --to 365
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const LENGTH_RANGES = {
  SAUSSURE_1: { min: 450, max: 550 },
};

function isHangulSyllable(ch) {
  const code = ch.codePointAt(0);
  return code >= 0xac00 && code <= 0xd7a3;
}

function hasBatchim(word) {
  if (!word) return false;
  const last = Array.from(word).at(-1);
  if (!last || !isHangulSyllable(last)) return false;
  const code = last.codePointAt(0) - 0xac00;
  return code % 28 !== 0;
}

function particleEulReul(word) {
  return hasBatchim(word) ? "을" : "를";
}

function particleIga(word) {
  return hasBatchim(word) ? "이" : "가";
}

function particleEunNeun(word) {
  return hasBatchim(word) ? "은" : "는";
}

function particleWaGwa(word) {
  return hasBatchim(word) ? "과" : "와";
}

function lcg(seed) {
  // Deterministic PRNG for reproducible output.
  let s = seed >>> 0;
  return function rand() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function pickOne(arr, rand) {
  return arr[Math.floor(rand() * arr.length)];
}

function pickSimilarLength(arr, rand, count, targetLen, excludeSet = new Set()) {
  const pool = arr
    .filter((x) => !excludeSet.has(x))
    .map((x) => ({ x, d: Math.abs(Array.from(String(x)).length - targetLen) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, Math.max(count * 8, count));

  const out = [];
  const used = new Set();
  while (out.length < count && pool.length > 0) {
    const idx = Math.floor(rand() * pool.length);
    const val = pool.splice(idx, 1)[0].x;
    if (used.has(val)) continue;
    used.add(val);
    out.push(val);
  }
  return out;
}

function ensureSentenceDot(text) {
  const t = String(text).trim();
  if (!t.endsWith(".")) {
    throw new Error(`Sentence must end with '.': ${t}`);
  }
  const dotCount = (t.match(/\./g) || []).length;
  if (dotCount !== 1) {
    throw new Error(`Sentence must contain exactly one '.': ${t}`);
  }
  if (/\r|\n/.test(t)) {
    throw new Error(`Sentence must not contain newline: ${t}`);
  }
  return t;
}

function joinParagraph(sentences) {
  return sentences.map(ensureSentenceDot).join(" ");
}

function computeSentenceRanges(sentences) {
  const ranges = [];
  let pos = 0;
  for (let i = 0; i < sentences.length; i++) {
    const s = ensureSentenceDot(sentences[i]);
    const start = pos;
    const end = pos + s.length;
    ranges.push({ start, end });
    pos = end;
    if (i !== sentences.length - 1) pos += 1;
  }
  return ranges;
}

function makeChoicesFromTexts(texts, answerIndex) {
  const ids = ["A", "B", "C", "D"];
  return {
    choices: texts.map((t, i) => ({ id: ids[i], text: t })),
    answerId: ids[answerIndex],
  };
}

function choiceLenRatio(choiceTexts) {
  const lens = choiceTexts.map((t) => Array.from(String(t)).length);
  const maxLen = Math.max(...lens);
  const minLen = Math.min(...lens);
  return (maxLen - minLen) / maxLen;
}

function findAllOccurrences(text, term) {
  const out = [];
  if (!term) return out;
  let idx = 0;
  while (true) {
    const found = text.indexOf(term, idx);
    if (found === -1) break;
    out.push({ start: found, end: found + term.length });
    idx = found + term.length;
  }
  return out;
}

function makeConfirmQuestion({ id, term, paragraphs }) {
  const ranges = [];
  for (const p of paragraphs) {
    const occ = findAllOccurrences(p.text, term);
    for (const r of occ) ranges.push({ paragraphId: p.id, start: r.start, end: r.end });
  }
  if (ranges.length < 2) {
    throw new Error(`Confirm term must appear at least twice: '${term}'`);
  }
  return {
    id,
    prompt: `지문에서 '${term}'${particleEulReul(term)} 찾아 눌러 보세요.`,
    answerRanges: ranges,
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -30 },
    revealOnWrong: true,
  };
}

function makeIntensiveStep({ stepId, paragraphId, range, question }) {
  return {
    stepId,
    highlight: { paragraphId, range },
    question: {
      ...question,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -20, eliminateWrongChoice: true },
    },
  };
}

function validateLessonJson({ json, day }) {
  const errs = [];
  function fail(msg) {
    errs.push(msg);
  }

  const level = "SAUSSURE_1";
  const lr = LENGTH_RANGES[level];
  const paras = json?.payload?.passage?.paragraphs || [];
  if (paras.length !== 2) fail(`passage.paragraphs must be 2 (got ${paras.length})`);
  for (const p of paras) {
    if (typeof p.text !== "string") fail(`paragraph text must be string (${p.id})`);
    if (/\r|\n/.test(p.text)) fail(`paragraph text must not include newline (${p.id})`);
  }
  const totalLen = paras.reduce((s, p) => s + Array.from(p.text).length, 0);
  if (totalLen < lr.min || totalLen > lr.max) {
    fail(`passage length out of range: ${totalLen} (expected ${lr.min}-${lr.max})`);
  }

  const timeline = json?.payload?.intensive?.timeline || [];
  if (timeline.length !== 20) fail(`timeline length must be 20 (got ${timeline.length})`);
  for (let i = 0; i < timeline.length; i++) {
    const step = timeline[i];
    const expectedId = `s${i + 1}`;
    if (step.stepId !== expectedId) fail(`stepId mismatch: expected ${expectedId}, got ${step.stepId}`);

    const pid = step?.highlight?.paragraphId;
    const pr = paras.find((p) => p.id === pid);
    if (!pr) fail(`highlight paragraphId not found: ${pid}`);

    const range = step?.highlight?.range;
    if (!range || typeof range.start !== "number" || typeof range.end !== "number") {
      fail(`invalid range at ${step.stepId}`);
      continue;
    }
    if (range.start < 0 || range.end > pr.text.length || range.start >= range.end) {
      fail(`range out of bounds at ${step.stepId}: [${range.start},${range.end})`);
      continue;
    }

    const hl = pr.text.slice(range.start, range.end);
    const isSummaryStep = step.stepId === "s10" || step.stepId === "s20";
    if (!isSummaryStep) {
      if (!hl.endsWith(".")) fail(`sentence highlight must end with '.' (${step.stepId})`);
      const dotCount = (hl.match(/\./g) || []).length;
      if (dotCount !== 1) fail(`sentence highlight must contain exactly one '.' (${step.stepId})`);
    } else {
      if (range.start !== 0 || range.end !== pr.text.length) {
        fail(`summary highlight must cover full paragraph (${step.stepId})`);
      }
    }

    const q = step.question;
    if (!q || typeof q.prompt !== "string") fail(`missing prompt (${step.stepId})`);
    const choices = q?.choices || [];
    if (choices.length !== 4) fail(`choices must be 4 (${step.stepId})`);
    const choiceTexts = choices.map((c) => (c ? String(c.text) : ""));
    const ratio = choiceLenRatio(choiceTexts);
    if (ratio > 0.15) {
      fail(`choice length ratio too high (${step.stepId}): ${ratio.toFixed(3)}`);
    }
  }

  const cards = json?.payload?.recall?.cards || [];
  if (cards.length !== 8) fail(`recall.cards must be 8 (got ${cards.length})`);
  const correctOrder = json?.payload?.recall?.correctOrder || [];
  if (correctOrder.length !== 8) fail(`recall.correctOrder must be 8 (got ${correctOrder.length})`);

  const confirmQs = json?.payload?.confirm?.questions || [];
  if (confirmQs.length !== 2) fail(`confirm.questions must be 2 (got ${confirmQs.length})`);
  for (const cq of confirmQs) {
    const m = typeof cq.prompt === "string" ? cq.prompt.match(/'([^']+)'/) : null;
    const term = m ? m[1] : null;
    if (!term) {
      fail(`confirm prompt must include quoted term (${cq.id})`);
      continue;
    }

    const expectedRanges = [];
    for (const p of paras) {
      for (const r of findAllOccurrences(p.text, term)) expectedRanges.push({ paragraphId: p.id, start: r.start, end: r.end });
    }
    const gotRanges = cq.answerRanges || [];
    const key = (r) => `${r.paragraphId}:${r.start}:${r.end}`;
    const gotSet = new Set(gotRanges.map(key));
    for (const r of expectedRanges) {
      if (!gotSet.has(key(r))) fail(`confirm missing range for '${term}': ${key(r)}`);
    }
    for (const r of gotRanges) {
      const exists = expectedRanges.some((er) => key(er) === key(r));
      if (!exists) fail(`confirm has extra/invalid range for '${term}': ${key(r)}`);
    }
  }

  if (errs.length > 0) {
    const prefix = `[SAUSSURE_1 day ${String(day).padStart(3, "0")}]`;
    const err = new Error(prefix + " " + errs[0]);
    err.all = errs;
    throw err;
  }
}

function makeBaseMeta({ day, subArea }) {
  const dayStr = String(day).padStart(3, "0");
  const title = subArea === "NONFICTION" ? `독해(비문학) Day ${day}` : `독해(문학) Day ${day}`;

  return {
    contentId: `dr-s1-${dayStr}`,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "SAUSSURE_1",
    schoolGradeRange: { min: 1, max: 1 },
    area: "READING",
    subArea,
    competencies: ["READING"],
    tags: ["daily"],
    access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 300,
    assets: {},
  };
}

const NAMES = ["민지", "준호", "서윤", "지우", "연우", "하준", "수아", "유진", "도윤", "나윤", "지민", "현우", "예린", "정우", "채원", "건우"];

const LIT_OBJECTS = ["색연필", "연필", "지우개", "구슬", "스티커", "사탕", "쪽지", "동전", "블록", "카드"];

const NF_TOPICS = [
  { keyword: "손씻기", place: "화장실", benefit: "건강", bad: "대충 씻으면", issue: "손이 깨끗하지 않아요" },
  { keyword: "양치질", place: "집", benefit: "치아", bad: "금방 끝내면", issue: "이가 깨끗하지 않아요" },
  { keyword: "정리정돈", place: "교실", benefit: "시간", bad: "아무 데나 두면", issue: "찾기 힘들어요" },
  { keyword: "줄서기", place: "급식실", benefit: "질서", bad: "새치기를 하면", issue: "친구가 속상해요" },
  { keyword: "물절약", place: "집", benefit: "환경", bad: "물을 오래 틀면", issue: "물이 아까워요" },
  { keyword: "독서습관", place: "도서관", benefit: "실력", bad: "대충 읽으면", issue: "내용이 남지 않아요" },
  { keyword: "인사하기", place: "학교", benefit: "기분", bad: "인사를 안 하면", issue: "서로 어색해요" },
  { keyword: "준비물", place: "학교", benefit: "수업", bad: "미리 안 챙기면", issue: "수업이 힘들어요" },
  { keyword: "교통안전", place: "길", benefit: "안전", bad: "주변을 안 보면", issue: "아주 위험해요" },
  { keyword: "분리수거", place: "학교", benefit: "환경", bad: "섞어 버리면", issue: "다시 나눠야 해요" },
];

const NF_SUPPORT = [
  {
    term: "메모",
    s4: "그래서 먼저 메모를 꺼내서 기준을 세워요.",
    s5: "메모에 해야 할 일을 한 줄씩 적어 둬요.",
    s6: "그 메모를 보면서 차근차근 하나씩 해요.",
    p2s6: "끝나면 메모를 다시 보고 잘했는지 확인해요.",
  },
  {
    term: "쪽지",
    s4: "그래서 먼저 쪽지를 꺼내서 기준을 세워요.",
    s5: "쪽지에 해야 할 일을 한 줄씩 적어 둬요.",
    s6: "그 쪽지를 보면서 차근차근 하나씩 해요.",
    p2s6: "끝나면 쪽지를 다시 보고 잘했는지 확인해요.",
  },
  {
    term: "체크표",
    s4: "그래서 먼저 체크표를 꺼내서 기준을 세워요.",
    s5: "체크표에 해야 할 일을 한 줄씩 적어 둬요.",
    s6: "그 체크표를 보면서 차근차근 하나씩 해요.",
    p2s6: "끝나면 체크표를 다시 보고 잘했는지 확인해요.",
  },
  {
    term: "순서표",
    s4: "그래서 먼저 순서표를 꺼내서 기준을 세워요.",
    s5: "순서표에 해야 할 일을 한 줄씩 적어 둬요.",
    s6: "그 순서표를 보면서 차근차근 하나씩 해요.",
    p2s6: "끝나면 순서표를 다시 보고 잘했는지 확인해요.",
  },
];

function buildNonfictionPlan({ day, rand }) {
  const topic = NF_TOPICS[day % NF_TOPICS.length];
  const support = NF_SUPPORT[(day + 1) % NF_SUPPORT.length];

  const kw = topic.keyword;
  const place = topic.place;
  const benefit = topic.benefit;

  const p1 = [
    `우리는 ${place}에서도 ${kw}${particleEulReul(kw)} 매일 조금씩 해요.`,
    `${kw}${particleEulReul(kw)} 하면 ${benefit}${particleEulReul(benefit)} 지킬 수 있고 마음도 편해요.`,
    `하지만 ${topic.bad} ${topic.issue} 그래서 더 조심해야 해요.`,
    support.s4,
    support.s5,
    support.s6,
    `그것이 어렵다면 처음에는 쉬운 것부터 천천히 해도 괜찮아요.`,
    `이렇게 하면 ${kw}${particleIga(kw)} 덜 헷갈려서 실수도 줄어요.`,
    `그래서 다음에도 ${kw}${particleEulReul(kw)} 더 잘 할 수 있어요.`,
  ];

  const p2 = [
    `또 중간에 잠깐 멈춰서 주변을 다시 확인해요.`,
    `예를 들어 한 번 더 눈으로 살펴보는 것도 좋아요.`,
    `다만 너무 급한 마음은 항상 조심해요.`,
    `왜냐하면 실수가 커져서 다시 해야 할 수도 있어요.`,
    `그래서 끝에 한 번 더 확인하면 도움이 돼요.`,
    support.p2s6,
    `만약 헷갈리면 친구나 어른에게 자세히 물어봐요.`,
    `이 습관이 쌓이면 ${benefit}${particleWaGwa(benefit)} 함께 자신감도 생겨요.`,
    `오늘부터 ${kw}${particleEulReul(kw)} 한 번 더 실천해 봐요.`,
  ];

  const confirmTerms = [kw, support.term];

  const allKeywords = NF_TOPICS.map((t) => t.keyword);
  const allBenefits = Array.from(new Set(NF_TOPICS.map((t) => t.benefit)));
  const allSupportTerms = NF_SUPPORT.map((s) => s.term);
  const allBadPhrases = NF_TOPICS.map((t) => t.bad);

  function qP1(i) {
    if (i === 0) {
      const otherKws = pickSimilarLength(allKeywords, rand, 3, Array.from(kw).length, new Set([kw]));
      const choices = [
        `${kw}${particleEulReul(kw)} 해요.`,
        `${otherKws[0]}${particleEulReul(otherKws[0])} 해요.`,
        `${otherKws[1]}${particleEulReul(otherKws[1])} 해요.`,
        `${otherKws[2]}${particleEulReul(otherKws[2])} 해요.`,
      ];
      return { prompt: `글에서 매일 한다고 한 것은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 1) {
      const otherBenefits = pickSimilarLength(allBenefits, rand, 3, Array.from(benefit).length, new Set([benefit]));
      const choices = [
        `${benefit}${particleEulReul(benefit)} 지킬 수 있어요.`,
        `${otherBenefits[0]}${particleEulReul(otherBenefits[0])} 지킬 수 있어요.`,
        `${otherBenefits[1]}${particleEulReul(otherBenefits[1])} 지킬 수 있어요.`,
        `${otherBenefits[2]}${particleEulReul(otherBenefits[2])} 지킬 수 있어요.`,
      ];
      return { prompt: `${kw}${particleEulReul(kw)} 하면 무엇을 지킬 수 있나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 2) {
      const otherBads = pickSimilarLength(allBadPhrases, rand, 3, Array.from(topic.bad).length, new Set([topic.bad]));
      const choices = [
        `${topic.bad} 조심해야 해요.`,
        `${otherBads[0]} 조심해야 해요.`,
        `${otherBads[1]} 조심해야 해요.`,
        `${otherBads[2]} 조심해야 해요.`,
      ];
      return { prompt: `글에서 더 조심해야 하는 때는 언제인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 3) {
      const otherTerms = pickSimilarLength(allSupportTerms, rand, 3, Array.from(support.term).length, new Set([support.term]));
      const choices = [
        `${support.term}${particleEulReul(support.term)} 꺼내요.`,
        `${otherTerms[0]}${particleEulReul(otherTerms[0])} 꺼내요.`,
        `${otherTerms[1]}${particleEulReul(otherTerms[1])} 꺼내요.`,
        `${otherTerms[2]}${particleEulReul(otherTerms[2])} 꺼내요.`,
      ];
      return { prompt: `글에서는 먼저 무엇을 꺼내나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 4) {
      const choices = [`${support.term}에 적어 둬요.`, `${support.term}에 숨겨 둬요.`, `${support.term}에 던져 둬요.`, `${support.term}에 잊어 둬요.`];
      return { prompt: `해야 할 일을 어디에 적어 두나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 5) {
      const choices = [
        `${support.term}${particleEulReul(support.term)} 보면서 해요.`,
        `${support.term}${particleEulReul(support.term)} 버리면서 해요.`,
        `${support.term}${particleEulReul(support.term)} 숨기면서 해요.`,
        `${support.term}${particleEulReul(support.term)} 잊으면서 해요.`,
      ];
      return { prompt: `무엇을 보면서 하나씩 하나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 6) {
      const choices = [
        `여기서 '그것'은 앞 문장의 방법을 말해요.`,
        `여기서 '그것'은 앞 문장의 장소를 말해요.`,
        `여기서 '그것'은 앞 문장의 이름을 말해요.`,
        `여기서 '그것'은 앞 문장의 날짜를 말해요.`,
      ];
      return { prompt: `문장 속 '그것'은 무엇을 말하나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 7) {
      const choices = [`${kw}${particleIga(kw)} 덜 헷갈려요.`, `${kw}${particleIga(kw)} 더 헷갈려요.`, `${kw}${particleIga(kw)} 더 시끄러워져요.`, `${kw}${particleIga(kw)} 더 무거워져요.`];
      return { prompt: `이렇게 하면 ${kw}${particleIga(kw)} 어떻게 된다고 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 8) {
      const otherKws = pickSimilarLength(allKeywords, rand, 3, Array.from(kw).length, new Set([kw]));
      const choices = [
        `${kw}${particleEulReul(kw)} 더 잘 할 수 있어요.`,
        `${otherKws[0]}${particleEulReul(otherKws[0])} 더 잘 할 수 있어요.`,
        `${otherKws[1]}${particleEulReul(otherKws[1])} 더 잘 할 수 있어요.`,
        `${otherKws[2]}${particleEulReul(otherKws[2])} 더 잘 할 수 있어요.`,
      ];
      return { prompt: `글에서 다음에도 더 잘 할 수 있다고 한 것은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    throw new Error(`unexpected nf p1 index ${i}`);
  }

  function qP2(i) {
    if (i === 0) {
      const choices = [`중간에 잠깐 멈춰요.`, `중간에 잠깐 쉬어요.`, `중간에 잠깐 웃어요.`, `중간에 잠깐 울어요.`];
      return { prompt: `중간에는 무엇을 하라고 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 1) {
      const choices = [`한 번 더 눈으로 살펴봐요.`, `한 번 더 눈으로 외면해요.`, `한 번 더 손으로 놓아 봐요.`, `한 번 더 발로 차 봐요.`];
      return { prompt: `예로 든 행동은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 2) {
      const choices = [`너무 급한 마음을 조심해요.`, `너무 쉬운 마음을 조심해요.`, `너무 조용한 마음을 조심해요.`, `너무 배고픈 마음을 조심해요.`];
      return { prompt: `무엇을 조심하라고 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 3) {
      const choices = [`실수가 커질 수 있어요.`, `실수가 사라질 수 있어요.`, `실수가 노래할 수 있어요.`, `실수가 잠잘 수 있어요.`];
      return { prompt: `조심해야 하는 이유로 든 것은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 4) {
      const choices = [`끝에 한 번 더 확인해요.`, `끝에 한 번 더 잊어버려요.`, `끝에 한 번 더 숨겨 버려요.`, `끝에 한 번 더 미뤄 버려요.`];
      return { prompt: `끝에는 무엇을 하면 도움이 된다고 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 5) {
      const choices = [
        `${support.term}${particleEulReul(support.term)} 다시 봐요.`,
        `${support.term}${particleEulReul(support.term)} 다시 숨겨요.`,
        `${support.term}${particleEulReul(support.term)} 다시 던져요.`,
        `${support.term}${particleEulReul(support.term)} 다시 잊어요.`,
      ];
      return { prompt: `끝나면 무엇을 다시 보나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 6) {
      const choices = [`친구나 어른에게 물어봐요.`, `친구나 어른에게 숨겨 봐요.`, `친구나 어른에게 던져 봐요.`, `친구나 어른에게 잊어 봐요.`];
      return { prompt: `헷갈릴 때는 어떻게 하라고 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 7) {
      const otherBenefits = pickSimilarLength(allBenefits, rand, 3, Array.from(benefit).length, new Set([benefit]));
      const choices = [
        `${benefit}${particleWaGwa(benefit)} 자신감이에요.`,
        `${otherBenefits[0]}${particleWaGwa(otherBenefits[0])} 자신감이에요.`,
        `${otherBenefits[1]}${particleWaGwa(otherBenefits[1])} 자신감이에요.`,
        `${otherBenefits[2]}${particleWaGwa(otherBenefits[2])} 자신감이에요.`,
      ];
      return { prompt: `습관이 쌓이면 무엇을 지키고 자신감도 생기나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 8) {
      const otherKws = pickSimilarLength(allKeywords, rand, 3, Array.from(kw).length, new Set([kw]));
      const choices = [
        `${kw}${particleEulReul(kw)} 실천해 봐요.`,
        `${otherKws[0]}${particleEulReul(otherKws[0])} 실천해 봐요.`,
        `${otherKws[1]}${particleEulReul(otherKws[1])} 실천해 봐요.`,
        `${otherKws[2]}${particleEulReul(otherKws[2])} 실천해 봐요.`,
      ];
      return { prompt: `마지막으로 무엇을 해 보라고 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    throw new Error(`unexpected nf p2 index ${i}`);
  }

  const p1SentenceObjs = p1.map((text, idx) => ({ text: ensureSentenceDot(text), q: qP1(idx) }));
  const p2SentenceObjs = p2.map((text, idx) => ({ text: ensureSentenceDot(text), q: qP2(idx) }));

  const p1SummaryChoices = [
    `첫 문단은 ${kw}${particleEulReul(kw)} 하는 방법을 알려 줘요.`,
    `첫 문단은 ${kw}${particleEulReul(kw)} 하지 말라고만 해요.`,
    `첫 문단은 ${kw}${particleEulReul(kw)} 숨기는 방법을 알려 줘요.`,
    `첫 문단은 ${kw}${particleEulReul(kw)} 잊는 방법을 알려 줘요.`,
  ];

  const p2SummaryChoices = [
    `둘째 문단은 다시 확인하는 방법을 알려 줘요.`,
    `둘째 문단은 자꾸 미루는 방법을 알려 줘요.`,
    `둘째 문단은 아무렇게나 하는 방법을 알려 줘요.`,
    `둘째 문단은 일부러 틀리는 방법을 알려 줘요.`,
  ];

  const p1Summary = { prompt: `첫 문단의 중심 내용으로 알맞은 것은?`, ...makeChoicesFromTexts(p1SummaryChoices, 0) };
  const p2Summary = { prompt: `둘째 문단의 중심 내용으로 알맞은 것은?`, ...makeChoicesFromTexts(p2SummaryChoices, 0) };

  const recallCards = [
    { id: "c1", text: `우리는 ${place}에서도 ${kw}${particleEulReul(kw)} 해요.` },
    { id: "c2", text: `${kw}${particleEulReul(kw)} 하면 ${benefit}${particleEulReul(benefit)} 지킬 수 있어요.` },
    { id: "c3", text: `${topic.bad} 더 조심해야 해요.` },
    { id: "c4", text: `먼저 ${support.term}${particleEulReul(support.term)} 꺼내요.` },
    { id: "c5", text: `${support.term}에 해야 할 일을 적어 둬요.` },
    { id: "c6", text: `그 ${support.term}${particleEulReul(support.term)} 보면서 하나씩 해요.` },
    { id: "c7", text: `끝나면 ${support.term}${particleEulReul(support.term)} 다시 보고 확인해요.` },
    { id: "c8", text: `오늘부터 ${kw}${particleEulReul(kw)} 실천해 봐요.` },
  ];

  return {
    paragraphs: [
      { id: "p1", sentences: p1SentenceObjs, summaryQ: p1Summary },
      { id: "p2", sentences: p2SentenceObjs, summaryQ: p2Summary },
    ],
    confirmTerms,
    recallCards,
  };
}

function buildLiteraturePlan({ day, rand }) {
  const name = pickOne(NAMES, rand);
  const friend = pickOne(NAMES.filter((n) => n !== name), rand);
  const object = pickOne(LIT_OBJECTS, rand);

  const room = "교실";

  const p1 = [
    `쉬는 시간에 ${name}${particleEunNeun(name)} ${room} 바닥을 쓸고 있었어요.`,
    `그때 ${friend}${particleIga(friend)} ${object} 상자를 떨어뜨렸어요.`,
    `${object}${particleIga(object)} 바닥에 쏟아져 여기저기 흩어졌어요.`,
    `친구들은 \"어?\" 하고 고개를 돌렸어요.`,
    `${friend}${particleEunNeun(friend)} 얼굴이 빨개져서 ${object}${particleEulReul(object)} 주우려 했어요.`,
    `${name}${particleEunNeun(name)} \"내가 같이 주워 줄게\"라고 말했어요.`,
    `그래서 두 사람은 책상 아래까지 손을 뻗었어요.`,
    `하지만 ${object} 한 개가 잘 보이지 않았어요.`,
    `${friend}${particleEunNeun(friend)} \"${object}${particleIga(object)} 없으면 엄마에게 혼날지도 몰라\" 하고 걱정했어요.`,
  ];

  const p2 = [
    `${name}${particleEunNeun(name)} 앞에서 흩어진 곳을 다시 바라봤어요.`,
    `그러자 창가 쪽 의자 다리 밑에 ${object}${particleIga(object)} 보였어요.`,
    `${name}${particleIga(name)} 문장 속 \"그것\"을 집어 들어 ${friend}에게 건넸어요.`,
    `${friend}${particleEunNeun(friend)} 숨을 크게 내쉬며 \"휴, 다행이다\"라고 했어요.`,
    `${friend}${particleEunNeun(friend)} \"고마워, ${name}야\" 하고 환하게 웃었어요.`,
    `${name}${particleEunNeun(name)} \"괜찮아, 우리 친구잖아\"라고 대답했어요.`,
    `그 말을 들은 ${friend}의 마음도 조금 가벼워졌어요.`,
    `이렇게 함께하면 작은 일도 금방 끝나요.`,
    `두 사람은 다시 빗자루를 들고 ${room}${particleEulReul(room)} 깨끗하게 만들었어요.`,
  ];

  const confirmTerms = [object, friend];

  const otherObjs = pickSimilarLength(LIT_OBJECTS, rand, 3, Array.from(object).length, new Set([object]));
  const otherNames = pickSimilarLength(NAMES, rand, 3, Array.from(friend).length, new Set([friend]));

  function qP1(i) {
    if (i === 0) {
      const choices = [`${room} 바닥이에요.`, `복도 바닥이에요.`, `운동장 바닥이에요.`, `현관 바닥이에요.`];
      return { prompt: `${name}는 무엇을 쓸고 있었어요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 1) {
      const choices = [
        `${object} 상자를 떨어뜨렸어요.`,
        `${otherObjs[0]} 상자를 떨어뜨렸어요.`,
        `${otherObjs[1]} 상자를 떨어뜨렸어요.`,
        `${otherObjs[2]} 상자를 떨어뜨렸어요.`,
      ];
      return { prompt: `${friend}가 무엇을 떨어뜨렸어요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 2) {
      const choices = [
        `${object}${particleIga(object)} 흩어졌어요.`,
        `${otherObjs[0]}${particleIga(otherObjs[0])} 흩어졌어요.`,
        `${otherObjs[1]}${particleIga(otherObjs[1])} 흩어졌어요.`,
        `${otherObjs[2]}${particleIga(otherObjs[2])} 흩어졌어요.`,
      ];
      return { prompt: `무엇이 여기저기 흩어졌어요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 3) {
      const choices = [`고개를 돌렸어요.`, `고개를 숙였어요.`, `고개를 흔들었어요.`, `고개를 들었어요.`];
      return { prompt: `친구들은 어떻게 했어요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 4) {
      const choices = [
        `${object}${particleEulReul(object)} 주우려고 했어요.`,
        `${object}${particleEulReul(object)} 던지려고 했어요.`,
        `${object}${particleEulReul(object)} 숨기려고 했어요.`,
        `${object}${particleEulReul(object)} 잊으려고 했어요.`,
      ];
      return { prompt: `${friend}는 무엇을 하려고 했어요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 5) {
      const choices = [`${name}예요.`, `${otherNames[0]}예요.`, `${otherNames[1]}예요.`, `${otherNames[2]}예요.`];
      return { prompt: `\"내가 같이 주워 줄게\"라고 말한 사람은 누구예요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 6) {
      const choices = [
        `${name}가 도와주겠다고 말했기 때문이에요.`,
        `${name}가 혼자 가겠다고 말했기 때문이에요.`,
        `${name}가 잠이 온다고 말했기 때문이에요.`,
        `${name}가 밥을 먹겠다고 말했기 때문이에요.`,
      ];
      return { prompt: `문장 속 '그래서'는 어떤 일 때문에 나오나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 7) {
      const otherObjs2 = pickSimilarLength(LIT_OBJECTS, rand, 3, Array.from(object).length, new Set([object]));
      const choices = [`${object} 한 개예요.`, `${otherObjs2[0]} 한 개예요.`, `${otherObjs2[1]} 한 개예요.`, `${otherObjs2[2]} 한 개예요.`];
      return { prompt: `무엇 한 개가 잘 보이지 않았어요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 8) {
      const choices = [`${friend}예요.`, `${otherNames[0]}예요.`, `${otherNames[1]}예요.`, `${otherNames[2]}예요.`];
      return { prompt: `걱정한 사람은 누구예요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    throw new Error(`unexpected lit p1 index ${i}`);
  }

  function qP2(i) {
    if (i === 0) {
      const choices = [`흩어진 곳을 다시 봤어요.`, `떨어진 곳을 다시 봤어요.`, `굴러간 곳을 다시 봤어요.`, `숨은 곳을 다시 봤어요.`];
      return { prompt: `${name}는 무엇을 다시 바라봤어요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 1) {
      const choices = [`의자 다리 밑에서요.`, `책상 다리 밑에서요.`, `의자 다리 옆에서요.`, `책상 다리 옆에서요.`];
      return { prompt: `${object}${particleEulReul(object)} 어디에서 봤나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 2) {
      const otherObjs2 = pickSimilarLength(LIT_OBJECTS, rand, 3, Array.from(object).length, new Set([object]));
      const choices = [
        `${object}${particleEulReul(object)} 말해요.`,
        `${otherObjs2[0]}${particleEulReul(otherObjs2[0])} 말해요.`,
        `${otherObjs2[1]}${particleEulReul(otherObjs2[1])} 말해요.`,
        `${otherObjs2[2]}${particleEulReul(otherObjs2[2])} 말해요.`,
      ];
      return { prompt: `문장 속 \"그것\"은 무엇을 말하나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 3) {
      const choices = [`${friend}에게 건넸어요.`, `${friend}에게 숨겼어요.`, `${friend}에게 던졌어요.`, `${friend}에게 잊었어요.`];
      return { prompt: `${name}는 ${object}${particleEulReul(object)} 어떻게 했어요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 4) {
      const choices = [`\"휴, 다행이다\"라고 했어요.`, `\"휴, 걱정이다\"라고 했어요.`, `\"휴, 신난다\"라고 했어요.`, `\"휴, 무섭다\"라고 했어요.`];
      return { prompt: `${friend}는 무엇이라고 했어요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 5) {
      const choices = [
        `\"괜찮아, 우리 친구잖아\"라고 했어요.`,
        `\"괜찮아, 우리 몰라\"라고 했어요.`,
        `\"괜찮아, 우리 싫어\"라고 했어요.`,
        `\"괜찮아, 우리 멀어\"라고 했어요.`,
      ];
      return { prompt: `${name}는 뭐라고 대답했어요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 6) {
      const choices = [`${friend}예요.`, `${otherNames[0]}예요.`, `${otherNames[1]}예요.`, `${otherNames[2]}예요.`];
      return { prompt: `마음이 가벼워진 사람은 누구예요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 7) {
      const choices = [`작은 일이요.`, `큰 일이요.`, `먼 일이요.`, `다른 일이요.`];
      return { prompt: `함께하면 무엇이 금방 끝난다고 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 8) {
      const choices = [`빗자루를 들었어요.`, `우산을 들었어요.`, `연필을 들었어요.`, `바나나를 들었어요.`];
      return { prompt: `두 사람은 무엇을 들었어요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    throw new Error(`unexpected lit p2 index ${i}`);
  }

  const p1SentenceObjs = p1.map((text, idx) => ({ text: ensureSentenceDot(text), q: qP1(idx) }));
  const p2SentenceObjs = p2.map((text, idx) => ({ text: ensureSentenceDot(text), q: qP2(idx) }));

  const p1SummaryChoices = [
    `${friend}가 ${object} 상자를 떨어뜨려서 같이 주운 내용이에요.`,
    `${friend}가 ${object} 상자를 열어 봐서 같이 본 내용이에요.`,
    `${friend}가 ${object} 상자를 숨겨서 같이 찾은 내용이에요.`,
    `${friend}가 ${object} 상자를 버려서 같이 울던 내용이에요.`,
  ];

  const p2SummaryChoices = [
    `${object}${particleEulReul(object)} 찾아서 안심한 내용이에요.`,
    `${object}${particleEulReul(object)} 잃어서 울먹인 내용이에요.`,
    `${object}${particleEulReul(object)} 숨겨서 혼난 내용이에요.`,
    `${object}${particleEulReul(object)} 버려서 속상한 내용이에요.`,
  ];

  const p1Summary = { prompt: `첫 문단의 중심 내용으로 알맞은 것은?`, ...makeChoicesFromTexts(p1SummaryChoices, 0) };
  const p2Summary = { prompt: `둘째 문단의 중심 내용으로 알맞은 것은?`, ...makeChoicesFromTexts(p2SummaryChoices, 0) };

  const recallCards = [
    { id: "c1", text: `쉬는 시간에 ${name}${particleEunNeun(name)} ${room}을 쓸고 있었어요.` },
    { id: "c2", text: `${friend}${particleIga(friend)} ${object} 상자를 떨어뜨렸어요.` },
    { id: "c3", text: `${object}${particleIga(object)} 흩어져서 둘이 같이 주웠어요.` },
    { id: "c4", text: `${object} 한 개가 안 보여서 ${friend}${particleIga(friend)} 걱정했어요.` },
    { id: "c5", text: `${name}${particleEunNeun(name)} 흩어진 곳을 다시 바라봤어요.` },
    { id: "c6", text: `의자 다리 밑에서 ${object}${particleEulReul(object)} 찾았어요.` },
    { id: "c7", text: `${name}${particleIga(name)} ${object}${particleEulReul(object)} ${friend}에게 건넸어요.` },
    { id: "c8", text: `두 사람은 다시 ${room}${particleEulReul(room)} 깨끗하게 했어요.` },
  ];

  return {
    paragraphs: [
      { id: "p1", sentences: p1SentenceObjs, summaryQ: p1Summary },
      { id: "p2", sentences: p2SentenceObjs, summaryQ: p2Summary },
    ],
    confirmTerms,
    recallCards,
  };
}

function buildLesson({ day }) {
  const subArea = day % 2 === 1 ? "NONFICTION" : "LITERATURE";
  const rand = lcg(day * 997 + 1 * 10007);

  const plan = subArea === "NONFICTION" ? buildNonfictionPlan({ day, rand }) : buildLiteraturePlan({ day, rand });

  const paragraphs = plan.paragraphs.map((p) => ({ id: p.id, text: joinParagraph(p.sentences.map((s) => s.text)) }));

  const timeline = [];

  const p1Ranges = computeSentenceRanges(plan.paragraphs[0].sentences.map((s) => s.text));
  for (let i = 0; i < 9; i++) {
    timeline.push(
      makeIntensiveStep({
        stepId: `s${i + 1}`,
        paragraphId: "p1",
        range: p1Ranges[i],
        question: plan.paragraphs[0].sentences[i].q,
      })
    );
  }
  timeline.push(
    makeIntensiveStep({
      stepId: "s10",
      paragraphId: "p1",
      range: { start: 0, end: paragraphs[0].text.length },
      question: plan.paragraphs[0].summaryQ,
    })
  );

  const p2Ranges = computeSentenceRanges(plan.paragraphs[1].sentences.map((s) => s.text));
  for (let i = 0; i < 9; i++) {
    timeline.push(
      makeIntensiveStep({
        stepId: `s${11 + i}`,
        paragraphId: "p2",
        range: p2Ranges[i],
        question: plan.paragraphs[1].sentences[i].q,
      })
    );
  }
  timeline.push(
    makeIntensiveStep({
      stepId: "s20",
      paragraphId: "p2",
      range: { start: 0, end: paragraphs[1].text.length },
      question: plan.paragraphs[1].summaryQ,
    })
  );

  const confirmQuestions = [
    makeConfirmQuestion({ id: "q1", term: plan.confirmTerms[0], paragraphs }),
    makeConfirmQuestion({ id: "q2", term: plan.confirmTerms[1], paragraphs }),
  ];

  const meta = makeBaseMeta({ day, subArea });

  const json = {
    ...meta,
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline },
      recall: {
        cards: plan.recallCards,
        correctOrder: plan.recallCards.map((c) => c.id),
        seedPenalty: 1,
      },
      confirm: { questions: confirmQuestions },
    },
  };

  validateLessonJson({ json, day });

  return json;
}

function parseArgs(argv) {
  const out = { from: 10, to: 365 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--from") out.from = Number(argv[++i]);
    else if (a === "--to") out.to = Number(argv[++i]);
  }
  if (!Number.isInteger(out.from) || !Number.isInteger(out.to) || out.from < 1 || out.to < out.from) {
    throw new Error(`Invalid args: --from ${out.from} --to ${out.to}`);
  }
  return out;
}

function writeJsonFile(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function main() {
  const args = parseArgs(process.argv);
  const dir = path.join(ROOT, "saussure1");

  for (let day = args.from; day <= args.to; day++) {
    const json = buildLesson({ day });
    const filePath = path.join(dir, `${String(day).padStart(3, "0")}.json`);
    writeJsonFile(filePath, json);
  }

  console.log(`Regenerated SAUSSURE_1 days ${args.from}-${args.to}.`);
}

if (require.main === module) {
  main();
}
