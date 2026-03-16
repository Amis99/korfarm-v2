/**
 * Regenerate daily-reading lessons for SAUSSURE_2 and SAUSSURE_3.
 *
 * This is a content generator (not a bulk "auto-fix" patcher). It overwrites the
 * target day JSONs with a consistent schema and runs strict validation per file.
 *
 * Usage:
 *   node frontend/public/daily-reading/tools/regenerate_saussure2_saussure3.js --from 10 --to 365
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const LENGTH_RANGES = {
  SAUSSURE_2: { min: 540, max: 660 },
  SAUSSURE_3: { min: 630, max: 770 },
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

function pickMany(arr, rand, count, excludeSet = new Set()) {
  const out = [];
  const pool = arr.filter((x) => !excludeSet.has(x));
  while (out.length < count && pool.length > 0) {
    const idx = Math.floor(rand() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function pickSimilarLength(arr, rand, count, targetLen, excludeSet = new Set()) {
  const pool = arr
    .filter((x) => !excludeSet.has(x))
    .map((x) => ({ x, d: Math.abs(x.length - targetLen) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, Math.max(count * 8, count)); // best-effort near matches
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
  // Returns ranges for the joined paragraph text (joined with single spaces).
  const ranges = [];
  let pos = 0;
  for (let i = 0; i < sentences.length; i++) {
    const s = ensureSentenceDot(sentences[i]);
    const start = pos;
    const end = pos + s.length;
    ranges.push({ start, end });
    pos = end;
    if (i !== sentences.length - 1) pos += 1; // space
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
  const lens = choiceTexts.map((t) => Array.from(t).length);
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

function validateLessonJson({ json, level, day }) {
  const errs = [];
  function fail(msg) {
    errs.push(msg);
  }

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
    // Ensure all occurrences are covered.
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
    const prefix = `[${level} day ${String(day).padStart(3, "0")}]`;
    const err = new Error(prefix + " " + errs[0]);
    err.all = errs;
    throw err;
  }
}

function makeBaseMeta({ level, day, subArea }) {
  const code = level === "SAUSSURE_2" ? "s2" : "s3";
  const dayStr = String(day).padStart(3, "0");
  const title = subArea === "NONFICTION" ? `독해(비문학) Day ${day}` : `독해(문학) Day ${day}`;
  const grade = level === "SAUSSURE_2" ? 2 : 3;

  return {
    contentId: `dr-${code}-${dayStr}`,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: level,
    schoolGradeRange: { min: grade, max: grade },
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

const NF_KEYWORDS = [
  { keyword: "물절약", place: "집", benefit: "환경", bad: "수도꼭지를 오래 틀어 두면", issue: "물이 낭비될 수 있어요" },
  { keyword: "분리수거", place: "학교", benefit: "환경", bad: "대충 섞어 버리면", issue: "재활용이 어려워질 수 있어요" },
  { keyword: "손씻기", place: "화장실", benefit: "건강", bad: "대충 닦고 나오면", issue: "세균이 남을 수 있어요" },
  { keyword: "양치질", place: "집", benefit: "치아", bad: "금방 끝내면", issue: "찌꺼기가 남을 수 있어요" },
  { keyword: "정리정돈", place: "교실", benefit: "시간", bad: "아무 데나 두면", issue: "찾느라 시간이 걸릴 수 있어요" },
  { keyword: "준비물", place: "학교", benefit: "시간", bad: "미리 챙기지 않으면", issue: "수업이 늦어질 수 있어요" },
  { keyword: "독서습관", place: "도서관", benefit: "실력", bad: "대충 훑어보면", issue: "내용이 남지 않을 수 있어요" },
  { keyword: "메모하기", place: "교실", benefit: "기억", bad: "그냥 지나치면", issue: "잊어버릴 수 있어요" },
  { keyword: "교통안전", place: "길", benefit: "안전", bad: "주변을 안 보면", issue: "사고가 날 수 있어요" },
  { keyword: "줄서기", place: "급식실", benefit: "질서", bad: "새치기를 하면", issue: "다툼이 생길 수 있어요" },
  { keyword: "도서관예절", place: "도서관", benefit: "배려", bad: "큰 소리로 말하면", issue: "다른 사람이 방해받을 수 있어요" },
  { keyword: "공원예절", place: "공원", benefit: "배려", bad: "쓰레기를 버리면", issue: "주변이 더러워질 수 있어요" },
];

const NF_SUPPORT = [
  {
    term: "메모",
    s4: "그래서 먼저 메모를 준비해서 기준을 세워요.",
    s5: "메모에 해야 할 일을 짧게 적어 두면 좋아요.",
    s6: "이때 메모를 한 번 더 읽어 보면 실수가 줄어요.",
    p2s6: "실천이 끝나면 메모를 다시 보고 잘했는지 확인해요.",
  },
  {
    term: "쪽지",
    s4: "그래서 먼저 쪽지를 준비해서 기준을 세워요.",
    s5: "쪽지에 해야 할 일을 짧게 적어 두면 좋아요.",
    s6: "이때 쪽지를 한 번 더 읽어 보면 실수가 줄어요.",
    p2s6: "실천이 끝나면 쪽지를 다시 보고 잘했는지 확인해요.",
  },
  {
    term: "체크표",
    s4: "그래서 먼저 체크표를 준비해서 기준을 세워요.",
    s5: "체크표에 해야 할 일을 한 줄씩 적어 두면 좋아요.",
    s6: "이때 체크표를 한 번 더 보면 실수가 줄어요.",
    p2s6: "실천이 끝나면 체크표를 다시 보고 잘했는지 확인해요.",
  },
  {
    term: "순서표",
    s4: "그래서 먼저 순서표를 준비해서 기준을 세워요.",
    s5: "순서표에 해야 할 일을 순서대로 적어 두면 좋아요.",
    s6: "이때 순서표를 한 번 더 읽어 보면 실수가 줄어요.",
    p2s6: "실천이 끝나면 순서표를 다시 보고 잘했는지 확인해요.",
  },
];

const NF_ACTIONS = [
  { a1: "하나씩 차근차근 해요", alt: "쉬운 것부터 해요", a2: "마무리 정리를 해요", example: "작은 체크를 하는 것", caution: "서두르는 것", reason: "실수가 커질", tip: "잠깐 멈춰서 숨을 고르면" },
  { a1: "필요한 것을 먼저 챙겨요", alt: "눈에 보이는 것부터 챙겨요", a2: "사용한 것을 제자리에 둬요", example: "가방을 한 번 더 보는 것", caution: "대충 넘기는 것", reason: "빠뜨릴", tip: "끝에 한 번 더 확인하면" },
  { a1: "기준을 정해서 나눠요", alt: "두 가지로만 먼저 나눠요", a2: "다시 한 번 확인해요", example: "비슷한 것을 모아 보는 것", caution: "섞어 두는 것", reason: "헷갈릴", tip: "표를 만들어 보면" },
];

function buildNonfictionPlan({ level, day, rand }) {
  const topic = NF_KEYWORDS[day % NF_KEYWORDS.length];
  const support = NF_SUPPORT[(day + 1) % NF_SUPPORT.length];

  const kw = topic.keyword;
  const place = topic.place;
  const benefit = topic.benefit;

  const l3 = level === "SAUSSURE_3";
  const placePhrase = l3 ? `${place}에서도` : `${place}에서`;

  const p1 = [
    `우리는 ${placePhrase} ${kw}${particleEulReul(kw)} ${l3 ? "매일 " : ""}조금씩 자주 실천해요.`,
    `${kw}${particleEulReul(kw)} 잘하면 ${benefit}${particleEulReul(benefit)} 지킬 수 있고 마음도${l3 ? " 더" : ""} 조금 편해져요${l3 ? " 그리고 다음이 더 쉬워져요" : ""}.`,
    `하지만 서두르거나 대충 하면 실수가${l3 ? " 더" : ""} 생기기 쉬워요${l3 ? " 그래서 더 조심해야 해요" : ""}.`,
    support.s4,
    support.s5,
    support.s6,
    `다음으로 ${support.term}에 적어 둔 기준을 떠올리며 하나씩 ${l3 ? "아주 " : ""}차근차근 실천해요.`,
    `그것이 어렵다면 처음에는 쉬운 것부터 한 가지씩 천천히 해도 괜찮아요.`,
    `이렇게 하면 ${kw}${particleIga(kw)} 훨씬 덜 헷갈려서 마음이 편해져요${l3 ? " 그리고 자신감도 생겨요" : ""}.`,
  ];

  const p2 = [
    `또 중간중간 잠깐 멈춰서 주변을 다시 확인해요${l3 ? " 눈으로 살펴봐요" : ""}.`,
    `예를 들어 물건을 제자리에 두는 것처럼 작은 정리를${l3 ? " 바로" : ""} 해요.`,
    `다만 너무 서두르는 마음은 항상 조심해야 해요${l3 ? " 마음속으로" : ""}.`,
    `왜냐하면 실수가 커져서 다시 해야 할 수 있기 때문이에요${l3 ? " 그래서 다시 확인해요" : ""}.`,
    `그래서 끝에 한 번 더 확인하는 습관이 도움이 돼요${l3 ? " 그리고 실수도 줄어요" : ""}.`,
    support.p2s6,
    `만약 헷갈리는 부분이 있다면 친구나 어른에게${l3 ? " 자세히" : ""} 물어봐요.`,
    `이 습관이 쌓이면 ${benefit}${particleWaGwa(benefit)} 함께 자신감도 조금씩 생겨요${l3 ? " 더 크게" : ""}.`,
    `오늘부터 ${kw}${particleEulReul(kw)} 한 번 더 실천해 봐요${l3 ? " 오늘도" : ""}.`,
  ];

  const confirmTerms = [kw, support.term];

  function qP1(i) {
    const s = p1[i];
    const otherKws = pickSimilarLength(NF_KEYWORDS.map((x) => x.keyword), rand, 3, kw.length, new Set([kw]));
    const otherBenefits = pickSimilarLength(["환경", "건강", "시간", "안전", "기억", "배려", "질서", "실력"], rand, 3, benefit.length, new Set([benefit]));

    if (i === 0) {
      const choices = [
        `${kw}${particleEulReul(kw)} 자주 실천해요.`,
        `${otherKws[0]}${particleEulReul(otherKws[0])} 자주 실천해요.`,
        `${otherKws[1]}${particleEulReul(otherKws[1])} 자주 실천해요.`,
        `${otherKws[2]}${particleEulReul(otherKws[2])} 자주 실천해요.`,
      ];
      return { prompt: `글에서 자주 실천한다고 한 것은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 1) {
      const choices = [
        `${kw}${particleEulReul(kw)} 잘하면 ${benefit}${particleEulReul(benefit)} 지킬 수 있어요.`,
        `${kw}${particleEulReul(kw)} 잘하면 ${otherBenefits[0]}${particleEulReul(otherBenefits[0])} 지킬 수 있어요.`,
        `${kw}${particleEulReul(kw)} 잘하면 ${otherBenefits[1]}${particleEulReul(otherBenefits[1])} 지킬 수 있어요.`,
        `${kw}${particleEulReul(kw)} 잘하면 ${otherBenefits[2]}${particleEulReul(otherBenefits[2])} 지킬 수 있어요.`,
      ];
      return { prompt: `글에서 말한 내용으로 알맞은 것은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 2) {
      const choices = [
        `서두르거나 대충 하면 실수가 생기기 쉬워요.`,
        `서두르거나 대충 하면 실수가 줄기 쉬워요.`,
        `서두르거나 대충 하면 기분이 좋아지기 쉬워요.`,
        `서두르거나 대충 하면 노래가 나오기 쉬워요.`,
      ];
      return { prompt: `조심해야 한다고 한 것은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 3) {
      const otherTerms = NF_SUPPORT.map((x) => x.term).filter((t) => t !== support.term);
      const choices = [
        `그래서 먼저 ${support.term}${particleEulReul(support.term)} 준비해서 기준을 세워요.`,
        `그래서 먼저 ${otherTerms[0]}${particleEulReul(otherTerms[0])} 준비해서 기준을 세워요.`,
        `그래서 먼저 ${otherTerms[1]}${particleEulReul(otherTerms[1])} 준비해서 기준을 세워요.`,
        `그래서 먼저 ${otherTerms[2]}${particleEulReul(otherTerms[2])} 준비해서 기준을 세워요.`,
      ];
      return { prompt: `글에서는 먼저 무엇을 준비하나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 4) {
      const choices = [
        s,
        s.replace("해야 할 일", "약속 시간"),
        s.replace("해야 할 일", "읽을 책"),
        s.replace("해야 할 일", "준비물"),
      ];
      return { prompt: `${support.term}${particleEulReul(support.term)} 할 때, 무엇을 적어 두면 좋다고 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 5) {
      const choices = [
        s,
        s.replace("실수가 줄어요", "실수가 늘어요"),
        s.replace("실수가 줄어요", "실수가 커져요"),
        s.replace("실수가 줄어요", "실수가 남아요"),
      ];
      return { prompt: `이때 ${support.term}${particleEulReul(support.term)} 다시 보면 어떤 점이 좋나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 6) {
      const choices = [
        s,
        s.replace("차근차근", "급하게"),
        s.replace("차근차근", "대충"),
        s.replace("차근차근", "아무렇게나"),
      ];
      return { prompt: `다음으로 어떻게 실천하라고 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 7) {
      const choices = [
        `여기서 '그것'은 앞 문장의 방법을 말해요.`,
        `여기서 '그것'은 앞 문장의 장소를 말해요.`,
        `여기서 '그것'은 앞 문장의 결론을 말해요.`,
        `여기서 '그것'은 앞 문장의 이름을 말해요.`,
      ];
      return { prompt: `문장 속 '그것'은 무엇을 말하나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 8) {
      const choices = [
        `${kw}${particleIga(kw)} 훨씬 덜 헷갈려요.`,
        `${kw}${particleIga(kw)} 훨씬 더 헷갈려요.`,
        `${kw}${particleIga(kw)} 훨씬 더 시끄러워져요.`,
        `${kw}${particleIga(kw)} 훨씬 더 무거워져요.`,
      ];
      return { prompt: `이렇게 하면 ${kw}${particleIga(kw)} 어떻게 된다고 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    throw new Error(`unexpected p1 index ${i}`);
  }

  function qP2(i) {
    const s = p2[i];

    if (i === 0) {
      const choices = [
        s,
        s.replace("다시", "계속"),
        s.replace("잠깐", "계속"),
        s.replace("확인해요", "미뤄요"),
      ];
      return { prompt: `둘째 문단에서 또 무엇을 하라고 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 1) {
      const choices = [
        s,
        s.replace("제자리에", "아무 데나"),
        s.replace("작은", "큰"),
        s.replace("정리", "장난"),
      ];
      return { prompt: `예시로 든 행동은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 2) {
      const choices = [
        s,
        s.replace("서두르는", "천천히 하는"),
        s.replace("조심해야", "잊어야"),
        s.replace("마음은", "몸은"),
      ];
      return { prompt: `조심해야 한다고 한 것은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 3) {
      const choices = [
        s,
        s.replace("실수가 커져서", "실수가 줄어서"),
        s.replace("다시 해야", "그만 해야"),
        s.replace("때문이에요", "아니에요"),
      ];
      return { prompt: `조심해야 하는 이유로 든 것은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 4) {
      const choices = [
        s,
        s.replace("한 번 더", "한 번도"),
        s.replace("도움이", "방해가"),
        s.replace("확인", "장난"),
      ];
      return { prompt: `도움이 되는 습관은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 5) {
      const choices = [
        s,
        s.replace("잘했는지", "모르는지"),
        s.replace("확인해요", "잊어버려요"),
        s.replace("다시 보고", "미루고"),
      ];
      return { prompt: `실천이 끝나면 무엇을 하나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 6) {
      const choices = [
        s,
        s.replace("친구나 어른에게", "혼자서만"),
        s.replace("물어봐요", "미뤄요"),
        s.replace("헷갈리는", "쉬운"),
      ];
      return { prompt: `헷갈릴 때는 어떻게 하라고 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 7) {
      const choices = [
        s,
        s.replace("자신감도", "걱정도"),
        s.replace("자신감도", "짜증도"),
        s.replace("자신감도", "피곤도"),
      ];
      return { prompt: `습관이 쌓이면 어떤 마음도 생긴다고 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    if (i === 8) {
      const choices = [
        s,
        s.replace("실천해 봐요", "미뤄 봐요"),
        s.replace("실천해 봐요", "잊어 봐요"),
        s.replace("실천해 봐요", "멈춰 봐요"),
      ];
      return { prompt: `마지막으로 무엇을 해 보라고 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }

    throw new Error(`unexpected p2 index ${i}`);
  }

  const p1SentenceObjs = p1.map((text, idx) => ({ text: ensureSentenceDot(text), q: qP1(idx) }));
  const p2SentenceObjs = p2.map((text, idx) => ({ text: ensureSentenceDot(text), q: qP2(idx) }));

  const p1SummaryChoices = [
    `첫 문단은 ${kw}${particleEulReul(kw)} 시작하는 방법을 설명해요.`,
    `첫 문단은 ${kw}${particleEulReul(kw)} 끝내는 방법을 설명해요.`,
    `첫 문단은 ${kw}${particleEulReul(kw)} 미루는 방법을 설명해요.`,
    `첫 문단은 ${kw}${particleEulReul(kw)} 숨기는 방법을 설명해요.`,
  ];

  const p2SummaryChoices = [
    `둘째 문단은 ${kw}${particleEulReul(kw)} 끝내는 방법을 설명해요.`,
    `둘째 문단은 ${kw}${particleEulReul(kw)} 시작하는 방법을 설명해요.`,
    `둘째 문단은 ${kw}${particleEulReul(kw)} 미루는 방법을 설명해요.`,
    `둘째 문단은 ${kw}${particleEulReul(kw)} 숨기는 방법을 설명해요.`,
  ];

  const p1Summary = { prompt: `첫 문단의 중심 내용으로 알맞은 것은?`, ...makeChoicesFromTexts(p1SummaryChoices, 0) };
  const p2Summary = { prompt: `둘째 문단의 중심 내용으로 알맞은 것은?`, ...makeChoicesFromTexts(p2SummaryChoices, 0) };

  const recallCards = [
    { id: "c1", text: `우리는 ${place}에서 ${kw}${particleEulReul(kw)} 실천해요.` },
    { id: "c2", text: `${kw}${particleEulReul(kw)} 잘하면 ${benefit}${particleEulReul(benefit)} 지킬 수 있어요.` },
    { id: "c3", text: `서두르면 실수가 생기기 쉬워요.` },
    { id: "c4", text: `먼저 ${support.term}${particleEulReul(support.term)} 준비해서 기준을 세워요.` },
    { id: "c5", text: `${support.term}에 적어 둔 기준을 떠올리며 실천해요.` },
    { id: "c6", text: `중간중간 멈춰서 다시 확인해요.` },
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

const NAMES = ["민지", "준호", "서윤", "지우", "연우", "하준", "수아", "유진", "도윤", "나윤", "지민", "현우", "예린", "정우", "채원", "건우"];
const PLACES = ["교실", "도서관", "운동장", "복도", "놀이터", "현관", "계단", "급식실"];
const OBJECTS = ["우산", "수첩", "책갈피", "연필", "지우개", "물병", "장갑", "열쇠", "쪽지"];
const FEELINGS = ["당황", "걱정", "아쉬움", "긴장", "설렘"];

function buildLiteraturePlan({ level, day, rand }) {
  const name = pickOne(NAMES, rand);
  const friend = pickOne(NAMES.filter((n) => n !== name), rand);
  const place = pickOne(PLACES, rand);
  const object = pickOne(OBJECTS, rand);
  const feeling = pickOne(FEELINGS, rand);
  const nextPlace = pickOne(PLACES.filter((p) => p !== place), rand);

  const l3 = level === "SAUSSURE_3";

  const p1 = [
    `${name}${particleEunNeun(name)} ${place}에서 ${object}${particleEulReul(object)} 한 손에 ${l3 ? "꽉 쥐고 " : ""}꼭 들고 있었어요.`,
    `${name}${particleEunNeun(name)} 비가 오기 전에 집에 가려고 발걸음을 더 빨리 ${l3 ? "옮기며 계속 서둘렀어요" : "했어요"}.`,
    `그런데 바람이 갑자기 ${l3 ? "아주 " : ""}세게 불어 ${object}${particleIga(object)} 손에서 미끄러졌어요.`,
    `${name}${particleEunNeun(name)} 순간 ${feeling}을 느끼고 마음이 ${l3 ? "더욱 조급해졌어요" : "아주 급해졌어요"}.`,
    `그래서 먼저 ${object}${particleIga(object)} 떨어진 곳 주변을 ${l3 ? "한 번 더 " : ""}자세히 돌아보았어요.`,
    `이때 앞에서 본 안내판이 떠올라 가까운 길과 주위도 함께 살폈어요.`,
    `${friend}${particleIga(friend)} 다가와 같이 찾아 보자고 조용히 ${l3 ? "말하며 안심시켰어요" : "말했어요"}.`,
    `${name}${particleEunNeun(name)} ${friend}${particleEulReul(friend)} 보고 숨을 천천히 ${l3 ? "크게 " : ""}고르기로 했어요.`,
    `두 사람은 ${nextPlace}로 서로 이야기를 나누며 ${l3 ? "조용히 " : ""}천천히 걸어갔어요.`,
  ];

  const p2 = [
    `${nextPlace}에서 바닥에 젖은 ${object} 자국을 ${l3 ? "아주 또렷하게 " : ""}발견했어요.`,
    `앞서 천천히 걸었던 것이 바닥을 ${l3 ? "아주 " : ""}더 꼼꼼히 보게 해 주었어요.`,
    `${name}${particleEunNeun(name)} 그 자국을 따라 ${object}${particleEulReul(object)} ${l3 ? "여러 번 " : ""}계속 찾아봤어요.`,
    `${name}${particleEunNeun(name)} 다음부터는 ${object}${particleEulReul(object)} 아무 데나 두지 않겠다고 ${l3 ? "마음속으로 다짐했어요" : "생각했어요"}.`,
    `하지만 비가 더 세게 내려 ${l3 ? "잠시 " : ""}그늘에 멈췄어요.`,
    `그래도 서로의 말을 ${l3 ? "차분히 " : ""}끝까지 듣고 순서를 떠올리며 움직였어요.`,
    `마침내 ${object}${particleEulReul(object)} 작은 벤치 옆에서 다시 찾았어요.`,
    `${friend}${particleEunNeun(friend)} 차분히 찾으면 길이 보인다고 ${l3 ? "한 번 더 " : ""}말했어요.`,
    `${name}${particleEunNeun(name)} 고마운 마음으로 ${object}${particleEulReul(object)} 꼭 쥐고 ${l3 ? "작게 살짝 " : ""}미소를 지었어요.`,
  ];

  const confirmTerms = [object, friend];

  function qP1(i) {
    const s = p1[i];
    const otherObjs = pickSimilarLength(OBJECTS, rand, 3, object.length, new Set([object]));
    const otherPlaces = pickSimilarLength(PLACES, rand, 3, place.length, new Set([place]));
    if (i === 0) {
      const choices = [
        `${object}${particleEulReul(object)} 들고 있었어요.`,
        `${otherObjs[0]}${particleEulReul(otherObjs[0])} 들고 있었어요.`,
        `${otherObjs[1]}${particleEulReul(otherObjs[1])} 들고 있었어요.`,
        `${otherObjs[2]}${particleEulReul(otherObjs[2])} 들고 있었어요.`,
      ];
      return { prompt: `${name}가 들고 있던 것은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 1) {
      const choices = [
        `집에 가려고 발걸음을 빨리 했어요.`,
        `친구를 기다리려고 발걸음을 빨리 했어요.`,
        `간식을 먹으려고 발걸음을 빨리 했어요.`,
        `운동을 하려고 발걸음을 빨리 했어요.`,
      ];
      return { prompt: `${name}는 왜 발걸음을 빨리 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 2) {
      const choices = [
        s,
        s.replace("세게", "조금"),
        s.replace("미끄러졌어요", "날아갔어요"),
        s.replace("바람", "친구"),
      ];
      return { prompt: `${object}${particleIga(object)} 어떻게 되었나요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 3) {
      const choices = [
        `${feeling}을 느꼈어요.`,
        `기쁨을 느꼈어요.`,
        `배고픔을 느꼈어요.`,
        `졸음을 느꼈어요.`,
      ];
      return { prompt: `${name}가 느낀 감정은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 4) {
      const choices = [
        s,
        s.replace("돌아보았어요", "뛰어갔어요"),
        s.replace("돌아보았어요", "잠들었어요"),
        s.replace(object, otherObjs[0]),
      ];
      return { prompt: `그래서 ${name}는 먼저 무엇을 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 5) {
      const choices = [
        s,
        s.replace("안내판", "소리"),
        s.replace("가까운", "먼"),
        s.replace("떠올라", "잊어버려"),
      ];
      return { prompt: `'이때' 떠올린 것은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 6) {
      const choices = [
        `${friend}${particleIga(friend)} 같이 찾자고 말했어요.`,
        `${friend}${particleIga(friend)} 같이 놀자고 말했어요.`,
        `${friend}${particleIga(friend)} 먼저 가자고 말했어요.`,
        `${friend}${particleIga(friend)} 잠깐 쉬자고 말했어요.`,
      ];
      return { prompt: `${friend}는 무엇을 말했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 7) {
      const otherFriends = pickSimilarLength(NAMES.filter((n) => n !== name && n !== friend), rand, 3, friend.length, new Set([friend]));
      const choices = [
        `${friend}${particleEulReul(friend)} 보고 숨을 고르기로 했어요.`,
        `${otherFriends[0]}${particleEulReul(otherFriends[0])} 보고 숨을 고르기로 했어요.`,
        `${otherFriends[1]}${particleEulReul(otherFriends[1])} 보고 숨을 고르기로 했어요.`,
        `${otherFriends[2]}${particleEulReul(otherFriends[2])} 보고 숨을 고르기로 했어요.`,
      ];
      return { prompt: `${name}는 누구를 보고 숨을 고르기로 했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 8) {
      const choices = [
        `${nextPlace}로 걸어갔어요.`,
        `${place}로 걸어갔어요.`,
        `${otherPlaces[0]}로 걸어갔어요.`,
        `${otherPlaces[1]}로 걸어갔어요.`,
      ];
      return { prompt: `두 사람은 어디로 걸어갔나요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    throw new Error(`unexpected lit p1 index ${i}`);
  }

  function qP2(i) {
    const s = p2[i];
    if (i === 0) {
      const choices = [
        `바닥에 젖은 ${object} 자국을 발견했어요.`,
        `바닥에 새로운 ${object} 자국을 발견했어요.`,
        `바닥에 깨끗한 ${object} 자국을 발견했어요.`,
        `바닥에 무거운 ${object} 자국을 발견했어요.`,
      ];
      return { prompt: `어떤 자국을 발견했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 1) {
      const choices = [
        s,
        s.replace("더 꼼꼼히", "대충"),
        s.replace("해 주었어요", "방해했어요"),
        s.replace("바닥", "하늘"),
      ];
      return { prompt: `천천히 걸었던 것이 어떤 도움이 되었나요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 2) {
      const choices = [
        s,
        s.replace("그 자국을", "친구를"),
        s.replace("따라", "피해"),
        s.replace("찾아봤어요", "버렸어요"),
      ];
      return { prompt: `${name}는 무엇을 따라 ${object}${particleEulReul(object)} 찾았나요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 3) {
      const endFrom = l3 ? "다짐했어요" : "생각했어요";
      const choices = [
        s,
        s.replace("아무 데나", "늘 손에"),
        s.replace("두지 않겠다고", "두겠다고"),
        s.replace(endFrom, "잊어버렸어요"),
      ];
      return { prompt: `${name}는 앞으로 어떻게 하겠다고 생각했나요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 4) {
      const choices = [
        s,
        s.replace("비가 더 세게", "바람이 더 세게"),
        s.replace("멈췄어요", "뛰었어요"),
        s.replace("그늘에", "교실에"),
      ];
      return { prompt: `잠깐 멈춘 이유는 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 5) {
      const choices = [
        s,
        s.replace("서로의 말을", "아무 말도"),
        s.replace("떠올리며", "잊어버리며"),
        s.replace("움직였어요", "가만히 있었어요"),
      ];
      return { prompt: `그래도 어떻게 움직였나요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 6) {
      const choices = [
        `작은 벤치 옆에서 찾았어요.`,
        `큰 나무 옆에서 찾았어요.`,
        `교실 문 앞에서 찾았어요.`,
        `계단 아래에서 찾았어요.`,
      ];
      return { prompt: `${object}${particleEulReul(object)} 어디에서 찾았나요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 7) {
      const choices = [
        `${friend}${particleEunNeun(friend)} 차분히 찾으면 길이 보인다고 말했어요.`,
        `${friend}${particleEunNeun(friend)} 천천히 찾으면 길이 보인다고 말했어요.`,
        `${friend}${particleEunNeun(friend)} 조용히 찾으면 길이 보인다고 말했어요.`,
        `${friend}${particleEunNeun(friend)} 서둘러 찾으면 길이 보인다고 말했어요.`,
      ];
      return { prompt: `${friend}가 말한 방법은 무엇인가요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    if (i === 8) {
      const otherObj = pickSimilarLength(OBJECTS, rand, 1, object.length, new Set([object]))[0];
      const choices = [
        s,
        s.replace("고마운", "화난"),
        s.replace("꼭", "대충"),
        s.replace(object, otherObj),
      ];
      return { prompt: `${name}는 어떤 마음으로 ${object}${particleEulReul(object)} 쥐었나요?`, ...makeChoicesFromTexts(choices, 0) };
    }
    throw new Error(`unexpected lit p2 index ${i}`);
  }

  const p1SentenceObjs = p1.map((text, idx) => ({ text: ensureSentenceDot(text), q: qP1(idx) }));
  const p2SentenceObjs = p2.map((text, idx) => ({ text: ensureSentenceDot(text), q: qP2(idx) }));

  const otherObj = pickSimilarLength(OBJECTS, rand, 1, object.length, new Set([object]))[0];
  const otherObj2 = pickSimilarLength(OBJECTS, rand, 1, object.length, new Set([object, otherObj]))[0];
  const otherObj3 = pickSimilarLength(OBJECTS, rand, 1, object.length, new Set([object, otherObj, otherObj2]))[0];

  const p1SummaryChoices = [
    `첫 장면은 ${name}가 ${object}${particleEulReul(object)} 잃어버려 당황하는 내용이에요.`,
    `첫 장면은 ${name}가 ${otherObj}${particleEulReul(otherObj)} 선물해 기뻐하는 내용이에요.`,
    `첫 장면은 ${name}가 ${otherObj2}${particleEulReul(otherObj2)} 만들어 뿌듯해하는 내용이에요.`,
    `첫 장면은 ${name}가 ${otherObj3}${particleEulReul(otherObj3)} 숨겨서 걱정하는 내용이에요.`,
  ];
  const p2SummaryChoices = [
    `둘째 장면은 ${name}가 ${object}${particleEulReul(object)} 찾아서 안심하는 내용이에요.`,
    `둘째 장면은 ${name}가 ${otherObj}${particleEulReul(otherObj)} 부숴서 울먹이는 내용이에요.`,
    `둘째 장면은 ${name}가 ${otherObj2}${particleEulReul(otherObj2)} 숨겨서 혼나는 내용이에요.`,
    `둘째 장면은 ${name}가 ${otherObj3}${particleEulReul(otherObj3)} 잊어서 다시 찾는 내용이에요.`,
  ];

  const p1Summary = { prompt: `첫 장면의 중심 내용으로 알맞은 것은?`, ...makeChoicesFromTexts(p1SummaryChoices, 0) };
  const p2Summary = { prompt: `둘째 장면의 중심 내용으로 알맞은 것은?`, ...makeChoicesFromTexts(p2SummaryChoices, 0) };

  const recallCards = [
    { id: "c1", text: `${name}${particleEunNeun(name)} ${place}에서 ${object}${particleEulReul(object)} 들고 있었어요.` },
    { id: "c2", text: `${name}${particleEunNeun(name)} 집에 가려다 ${object}${particleEulReul(object)} 잃어버렸어요.` },
    { id: "c3", text: `${name}${particleEunNeun(name)} 먼저 떨어진 곳을 돌아보았어요.` },
    { id: "c4", text: `${friend}${particleIga(friend)} 같이 찾자고 도와주었어요.` },
    { id: "c5", text: `두 사람은 ${nextPlace}로 가서 자국을 찾았어요.` },
    { id: "c6", text: `${name}${particleEunNeun(name)} 자국을 따라 ${object}${particleEulReul(object)} 찾았어요.` },
    { id: "c7", text: `마침내 ${object}${particleEulReul(object)} 벤치 옆에서 찾았어요.` },
    { id: "c8", text: `${name}${particleEunNeun(name)} 차분히 찾는 방법을 기억하기로 했어요.` },
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

function buildLesson({ level, day }) {
  const subArea = day % 2 === 1 ? "NONFICTION" : "LITERATURE";
  const rand = lcg(day * 997 + (level === "SAUSSURE_2" ? 2 : 3) * 10007);

  const plan = subArea === "NONFICTION" ? buildNonfictionPlan({ level, day, rand }) : buildLiteraturePlan({ level, day, rand });

  const paragraphs = plan.paragraphs.map((p) => ({
    id: p.id,
    text: joinParagraph(p.sentences.map((s) => s.text)),
  }));

  const timeline = [];
  // Paragraph 1 sentences
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

  // Paragraph 2 sentences
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

  const meta = makeBaseMeta({ level, day, subArea });

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

  validateLessonJson({ json, level, day });

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

  const levels = ["SAUSSURE_2", "SAUSSURE_3"];
  for (const level of levels) {
    const dir = path.join(ROOT, level === "SAUSSURE_2" ? "saussure2" : "saussure3");
    for (let day = args.from; day <= args.to; day++) {
      const json = buildLesson({ level, day });
      const filePath = path.join(dir, `${String(day).padStart(3, "0")}.json`);
      writeJsonFile(filePath, json);
    }
  }

  console.log(`Regenerated SAUSSURE_2/3 days ${args.from}-${args.to}.`);
}

if (require.main === module) {
  main();
}
