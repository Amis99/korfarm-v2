/**
 * 러셀3 테스트 데이터 생성 스크립트
 * 원고 JSON에서 문법/개념/문학/비문학 문제를 추출하여 챕터당 30문제 테스트 생성
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SRC_DIR = path.join(ROOT, '프로모드 원고', '러셀3');
const OUT_DIR = path.join(ROOT, 'generated', 'pro-tests');

// 10대 역량 — 30문제에 각 3문제씩
const DOMAINS = [
  '어휘력',
  '문장 독해력',
  '구조 독해력',
  '논리 사고력',
  '어법·문법 능력',
  '국어 개념 적용 능력',
  '국어 관련 배경지식',
  '비문학 배경지식',
  '문제 분석 및 전략 수립 능력',
  '선택지 분석 및 전략 수립 능력',
];

// 섹션별 역량 매핑
const GRAMMAR_DOMAINS = ['어법·문법 능력', '어휘력', '문장 독해력', '논리 사고력', '문제 분석 및 전략 수립 능력'];
const CONCEPT_DOMAINS = ['국어 개념 적용 능력', '국어 관련 배경지식', '어휘력', '논리 사고력', '구조 독해력'];
const LIT_DOMAINS = ['문장 독해력', '구조 독해력', '국어 관련 배경지식', '논리 사고력', '선택지 분석 및 전략 수립 능력'];
const NONLIT_DOMAINS = ['비문학 배경지식', '구조 독해력', '문장 독해력', '문제 분석 및 전략 수립 능력', '선택지 분석 및 전략 수립 능력'];

// 원문자 → 숫자 변환
function circledToNum(s) {
  if (!s) return s;
  const map = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5' };
  let r = String(s);
  for (const [k, v] of Object.entries(map)) {
    r = r.replace(new RegExp(k, 'g'), v);
  }
  return r.trim();
}

// 선택지 텍스트에서 앞 번호(①②...) 제거
function stripChoicePrefix(text) {
  return String(text).replace(/^[①②③④⑤]\s*/, '').trim();
}

// 원문자 정답을 숫자로
function answerToNum(ans) {
  const map = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5' };
  const s = String(ans).trim();
  if (map[s]) return map[s];
  // 이미 숫자면
  if (/^[1-5]$/.test(s)) return s;
  return s;
}

// 5지선다 → 4지선다 변환 (정답 포함, 오답 1개 제거)
function to4Choices(choices5, correctIdx) {
  // choices5: [{id, text}, ...] (5개)
  // correctIdx: "1"~"5" 문자열
  const cNum = parseInt(correctIdx);
  // 정답이 아닌 선택지 중 하나를 제거
  const wrongIndices = [];
  for (let i = 1; i <= 5; i++) {
    if (i !== cNum) wrongIndices.push(i);
  }
  // 마지막 오답 제거
  const removeIdx = wrongIndices[wrongIndices.length - 1];

  const newChoices = [];
  let newCorrect = null;
  let newId = 1;
  for (let i = 0; i < choices5.length; i++) {
    if (i + 1 === removeIdx) continue;
    const c = { id: String(newId), text: choices5[i].text };
    if (i + 1 === cNum) newCorrect = String(newId);
    newId++;
  }

  // 만약 newChoices가 아직 비어있으면 다시 빌드
  newId = 1;
  const result = [];
  for (let i = 0; i < choices5.length; i++) {
    if (i + 1 === removeIdx) continue;
    result.push({ id: String(newId), text: choices5[i].text });
    if (i + 1 === cNum) newCorrect = String(newId);
    newId++;
  }

  return { choices: result, correctAnswer: newCorrect || '1' };
}

// 단답형 → 객관식 변환
function shortAnswerToMC(stem, correctText, distractors) {
  // distractors: 오답 텍스트 배열 (3개)
  const choices = [];
  // 정답 위치 랜덤 (1~4)
  const correctPos = Math.floor(Math.random() * 4);
  let distIdx = 0;
  for (let i = 0; i < 4; i++) {
    if (i === correctPos) {
      choices.push({ id: String(i + 1), text: correctText });
    } else {
      choices.push({ id: String(i + 1), text: distractors[distIdx] || `오답 ${distIdx + 1}` });
      distIdx++;
    }
  }
  return { choices, correctAnswer: String(correctPos + 1) };
}

// 해설 생성 (객관식)
function buildExplanations(choices, correctAnswer, correctExpl, wrongExpl) {
  const expl = {};
  for (const c of choices) {
    if (c.id === correctAnswer) {
      expl[c.id] = correctExpl || `정답 해설: ${c.text}`;
    } else {
      expl[c.id] = wrongExpl || `오답 조언: 이 선택지는 정답이 아닙니다.`;
    }
  }
  return expl;
}

// essayKeywords 추출
function extractKeywords(modelAnswer) {
  if (!modelAnswer) return [];
  // 한글 명사/개념어를 간단히 추출 (2글자 이상 단어)
  const words = modelAnswer.match(/[가-힣]{2,}/g) || [];
  // 빈도 높은 것 / 중복 제거
  const seen = new Set();
  const result = [];
  for (const w of words) {
    if (!seen.has(w) && w.length >= 2) {
      seen.add(w);
      result.push(w);
    }
    if (result.length >= 5) break;
  }
  return result.map((kw, i) => ({ keyword: kw, weight: 5 - i }));
}

function loadChapter(n) {
  const filePath = path.join(SRC_DIR, `러셀3 (챕터${n}).json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw);
}

function generateTest(chapterNum) {
  const data = loadChapter(chapterNum);
  const gram = data['문법'] || {};
  const conc = data['개념'] || {};
  const lit = data['문학'] || {};
  const nonlit = data['비문학'] || {};

  const questions = [];
  let qNum = 1;

  // 역량 카운터
  const domainCount = {};
  for (const d of DOMAINS) domainCount[d] = 0;

  function pickDomain(domainList) {
    // 가장 적게 배분된 역량 우선
    let best = domainList[0];
    let bestCount = domainCount[best] || 0;
    for (const d of domainList) {
      const c = domainCount[d] || 0;
      if (c < bestCount) {
        best = d;
        bestCount = c;
      }
    }
    // 전체적으로 3개 이하만
    if (bestCount >= 3) {
      // 전체에서 가장 적은 것 사용
      let globalBest = DOMAINS[0];
      let globalMin = domainCount[globalBest] || 0;
      for (const d of DOMAINS) {
        if ((domainCount[d] || 0) < globalMin) {
          globalBest = d;
          globalMin = domainCount[d] || 0;
        }
      }
      best = globalBest;
    }
    domainCount[best] = (domainCount[best] || 0) + 1;
    return best;
  }

  // ==================== 문법 섹션 (7~8문제) ====================
  const gramMCProblems = gram['문법_객관식_문제'] || [];
  const gramMCChoices = gram['문법_객관식_선택지'] || {};
  const gramMCAnswers = gram['문법_객관식_정답'] || {};
  const gramMCExpl = gram['문법_객관식_해설'] || {};
  const gramMCBogi = gram['문법_객관식_보기'] || {};
  const gramPassage = gram['문법_지문'] || null;

  // 객관식 (최대 5개)
  const gramMCLimit = Math.min(gramMCProblems.length, 5);
  for (let i = 0; i < gramMCLimit; i++) {
    const p = gramMCProblems[i];
    const num = String(p['번호']);
    const rawChoices = gramMCChoices[num] || [];
    const rawAnswer = gramMCAnswers[num] || '';
    const expl = gramMCExpl[num] || '';
    const bogi = gramMCBogi[num] || null;

    // 5지선다 → 4지선다
    const choices5 = rawChoices.map((c, idx) => ({
      id: String(idx + 1),
      text: stripChoicePrefix(c)
    }));

    const ansNum = answerToNum(rawAnswer);

    let finalChoices, finalAnswer;
    if (choices5.length === 5) {
      const converted = to4Choices(choices5, ansNum);
      finalChoices = converted.choices;
      finalAnswer = converted.correctAnswer;
    } else if (choices5.length === 4) {
      finalChoices = choices5;
      finalAnswer = ansNum;
    } else {
      // 4개 미만이면 패딩
      finalChoices = choices5;
      while (finalChoices.length < 4) {
        finalChoices.push({ id: String(finalChoices.length + 1), text: '해당 없음' });
      }
      finalAnswer = ansNum;
    }

    let stem = p['문제'] || '';
    if (bogi) {
      stem = stem + '\n\n' + bogi;
    }

    const choiceExplanations = {};
    for (const c of finalChoices) {
      if (c.id === finalAnswer) {
        choiceExplanations[c.id] = `정답 해설: ${expl || c.text}`;
      } else {
        choiceExplanations[c.id] = `오답 조언: 이 선택지는 정답과 다릅니다. ${expl ? '지문을 다시 확인해 보세요.' : ''}`;
      }
    }

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: pickDomain(GRAMMAR_DOMAINS),
      points: 3,
      stem,
      passage: gramPassage,
      correctAnswer: finalAnswer,
      choices: finalChoices,
      choiceExplanations
    });
  }

  // 단답형 → 객관식 (2개)
  const gramSAProblems = gram['문법_단답형_문제'] || [];
  const gramSAAnswers = gram['문법_단답형_정답'] || {};
  const gramSALimit = Math.min(gramSAProblems.length, 2);
  for (let i = 0; i < gramSALimit; i++) {
    const p = gramSAProblems[i];
    const num = String(p['번호']);
    const correctText = gramSAAnswers[num] || '';

    // 같은 섹션에서 다른 정답을 오답으로 활용
    const otherAnswers = Object.entries(gramSAAnswers)
      .filter(([k]) => k !== num)
      .map(([, v]) => v);
    const distractors = otherAnswers.slice(0, 3);
    while (distractors.length < 3) distractors.push('해당 없음');

    const { choices, correctAnswer } = shortAnswerToMC(p['문제'], correctText, distractors);

    const choiceExplanations = {};
    for (const c of choices) {
      if (c.id === correctAnswer) {
        choiceExplanations[c.id] = `정답 해설: 정답은 '${correctText}'입니다.`;
      } else {
        choiceExplanations[c.id] = `오답 조언: '${c.text}'은(는) 이 문제의 정답이 아닙니다.`;
      }
    }

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: pickDomain(GRAMMAR_DOMAINS),
      points: 3,
      stem: p['문제'],
      passage: gramPassage,
      correctAnswer,
      choices,
      choiceExplanations
    });
  }

  // 서술형 (1개)
  const gramEssay = gram['문법_서술형_문제'] || [];
  const gramEssayAnswers = gram['문법_서술형_모범_답안'] || gram['문법_서술형_정답'] || {};
  if (gramEssay.length > 0) {
    const p = gramEssay[0];
    const num = String(p['번호']);
    const modelAns = gramEssayAnswers[num] || '';
    questions.push({
      number: qNum++,
      type: '서술형',
      domain: pickDomain(GRAMMAR_DOMAINS),
      points: 8,
      stem: p['문제'],
      passage: gramPassage,
      correctAnswer: null,
      choices: [],
      choiceExplanations: {},
      modelAnswer: modelAns,
      essayKeywords: extractKeywords(modelAns),
      essayRubric: '핵심 개념을 정확히 서술하고, 구체적인 예시나 근거를 포함하여 논리적으로 설명했는지 평가합니다.'
    });
  }

  // ==================== 개념 섹션 (7~8문제) ====================
  const concMCProblems = conc['개념_객관식_문제'] || [];
  const concMCChoices = conc['개념_객관식_선택지'] || {};
  const concMCAnswers = conc['개념_객관식_정답'] || {};
  const concMCExpl = conc['개념_객관식_해설'] || {};
  const concMCBogi = conc['개념_객관식_보기'] || {};
  const concPassage = conc['개념_지문'] || null;

  // 객관식 (최대 5개)
  const concMCLimit = Math.min(concMCProblems.length, 5);
  for (let i = 0; i < concMCLimit; i++) {
    const p = concMCProblems[i];
    const num = String(p['번호']);
    const rawChoices = concMCChoices[num] || [];
    const rawAnswer = concMCAnswers[num] || '';
    const expl = concMCExpl[num] || '';
    const bogi = concMCBogi[num] || null;

    const choices5 = rawChoices.map((c, idx) => ({
      id: String(idx + 1),
      text: stripChoicePrefix(c)
    }));
    const ansNum = answerToNum(rawAnswer);

    let finalChoices, finalAnswer;
    if (choices5.length === 5) {
      const converted = to4Choices(choices5, ansNum);
      finalChoices = converted.choices;
      finalAnswer = converted.correctAnswer;
    } else {
      finalChoices = choices5;
      while (finalChoices.length < 4) finalChoices.push({ id: String(finalChoices.length + 1), text: '해당 없음' });
      finalAnswer = ansNum;
    }

    let stem = p['문제'] || '';
    if (bogi) stem = stem + '\n\n' + bogi;

    const choiceExplanations = {};
    for (const c of finalChoices) {
      if (c.id === finalAnswer) {
        choiceExplanations[c.id] = `정답 해설: ${expl || c.text}`;
      } else {
        choiceExplanations[c.id] = `오답 조언: 이 선택지는 정답과 다릅니다.`;
      }
    }

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: pickDomain(CONCEPT_DOMAINS),
      points: 3,
      stem,
      passage: concPassage,
      correctAnswer: finalAnswer,
      choices: finalChoices,
      choiceExplanations
    });
  }

  // 단답형 → 객관식 (2개)
  const concSAProblems = conc['개념_단답형_문제'] || [];
  const concSAAnswers = conc['개념_단답형_정답'] || {};
  const concSALimit = Math.min(concSAProblems.length, 2);
  for (let i = 0; i < concSALimit; i++) {
    const p = concSAProblems[i];
    const num = String(p['번호']);
    const correctText = concSAAnswers[num] || '';

    const otherAnswers = Object.entries(concSAAnswers)
      .filter(([k]) => k !== num)
      .map(([, v]) => v);
    const distractors = otherAnswers.slice(0, 3);
    while (distractors.length < 3) distractors.push('해당 없음');

    const { choices, correctAnswer } = shortAnswerToMC(p['문제'], correctText, distractors);

    const choiceExplanations = {};
    for (const c of choices) {
      if (c.id === correctAnswer) {
        choiceExplanations[c.id] = `정답 해설: 정답은 '${correctText}'입니다.`;
      } else {
        choiceExplanations[c.id] = `오답 조언: '${c.text}'은(는) 이 문제의 정답이 아닙니다.`;
      }
    }

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: pickDomain(CONCEPT_DOMAINS),
      points: 3,
      stem: p['문제'],
      passage: concPassage,
      correctAnswer,
      choices,
      choiceExplanations
    });
  }

  // 서술형 (1개)
  const concEssay = conc['개념_서술형_문제'] || [];
  const concEssayAnswers = conc['개념_서술형_모범_답안'] || conc['개념_서술형_정답'] || {};
  if (concEssay.length > 0) {
    const p = concEssay[0];
    const num = String(p['번호']);
    const modelAns = concEssayAnswers[num] || '';
    questions.push({
      number: qNum++,
      type: '서술형',
      domain: pickDomain(CONCEPT_DOMAINS),
      points: 8,
      stem: p['문제'],
      passage: concPassage,
      correctAnswer: null,
      choices: [],
      choiceExplanations: {},
      modelAnswer: modelAns,
      essayKeywords: extractKeywords(modelAns),
      essayRubric: '핵심 개념을 정확히 서술하고, 지문의 내용을 근거로 논리적으로 설명했는지 평가합니다.'
    });
  }

  // ==================== 문학 섹션 (7~8문제) ====================
  const litPassage = lit['문학_작품_지문'] || null;
  const litMCProblems = lit['문학_작품_객관식_문제'] || [];
  const litMCChoices = lit['문학_작품_객관식_선택지'] || {};
  const litMCAnswers = lit['문학_작품_객관식_정답'] || {};
  const litMCExpl = lit['문학_작품_객관식_해설'] || {};
  const litMCBogi = lit['문학_작품_객관식_보기'] || {};

  // 객관식 (최대 4개)
  const litMCLimit = Math.min(litMCProblems.length, 4);
  for (let i = 0; i < litMCLimit; i++) {
    const p = litMCProblems[i];
    const num = String(p['번호']);
    const rawChoices = litMCChoices[num] || [];
    const rawAnswer = litMCAnswers[num] || '';
    const expl = litMCExpl[num] || '';
    const bogi = litMCBogi[num] || null;

    const choices5 = rawChoices.map((c, idx) => ({
      id: String(idx + 1),
      text: stripChoicePrefix(c)
    }));
    const ansNum = answerToNum(rawAnswer);

    let finalChoices, finalAnswer;
    if (choices5.length === 5) {
      const converted = to4Choices(choices5, ansNum);
      finalChoices = converted.choices;
      finalAnswer = converted.correctAnswer;
    } else {
      finalChoices = choices5;
      while (finalChoices.length < 4) finalChoices.push({ id: String(finalChoices.length + 1), text: '해당 없음' });
      finalAnswer = ansNum;
    }

    let stem = p['문제'] || '';
    if (bogi) stem = stem + '\n\n' + bogi;

    const choiceExplanations = {};
    for (const c of finalChoices) {
      if (c.id === finalAnswer) {
        choiceExplanations[c.id] = `정답 해설: ${expl || c.text}`;
      } else {
        choiceExplanations[c.id] = `오답 조언: 작품의 내용을 다시 확인해 보세요.`;
      }
    }

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: pickDomain(LIT_DOMAINS),
      points: 3,
      stem,
      passage: litPassage,
      correctAnswer: finalAnswer,
      choices: finalChoices,
      choiceExplanations
    });
  }

  // 문장 독해 문제 (최대 2개)
  const litSentProblems = lit['문학_문장_독해_문제'] || [];
  const litSentChoices = lit['문학_문장_독해_선택지'] || {};
  const litSentAnswers = lit['문학_문장_독해_정답'] || {};
  const litSentLimit = Math.min(litSentProblems.length, 2);
  for (let i = 0; i < litSentLimit; i++) {
    const p = litSentProblems[i];
    const num = String(p['번호']);
    const rawChoices = litSentChoices[num] || [];
    const rawAnswer = litSentAnswers[num] || '';

    const choices4 = rawChoices.map((c, idx) => ({
      id: String(idx + 1),
      text: stripChoicePrefix(c)
    }));
    const ansNum = answerToNum(rawAnswer);

    const choiceExplanations = {};
    for (const c of choices4) {
      if (c.id === ansNum) {
        choiceExplanations[c.id] = `정답 해설: 문맥을 통해 이것이 정답임을 알 수 있습니다.`;
      } else {
        choiceExplanations[c.id] = `오답 조언: 문장의 문맥을 다시 살펴보세요.`;
      }
    }

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: pickDomain(LIT_DOMAINS),
      points: 3,
      stem: p['문제'],
      passage: litPassage,
      correctAnswer: ansNum,
      choices: choices4,
      choiceExplanations
    });
  }

  // 서술형 (1개)
  const litEssay = lit['문학_작품_서술형_문제'] || [];
  const litEssayAnswers = lit['문학_작품_서술형_모범_답안'] || {};
  if (litEssay.length > 0) {
    const p = litEssay[0];
    const num = String(p['번호']);
    const modelAns = litEssayAnswers[num] || '';
    questions.push({
      number: qNum++,
      type: '서술형',
      domain: pickDomain(LIT_DOMAINS),
      points: 8,
      stem: p['문제'],
      passage: litPassage,
      correctAnswer: null,
      choices: [],
      choiceExplanations: {},
      modelAnswer: modelAns,
      essayKeywords: extractKeywords(modelAns),
      essayRubric: '작품의 내용을 정확히 파악하고, 핵심 개념과 근거를 포함하여 논리적으로 서술했는지 평가합니다.'
    });
  }

  // ==================== 비문학 섹션 (7~8문제) ====================
  const nonlitPassage = nonlit['비문학_지문'] || nonlit['비문학_문제_지문'] || null;
  const nonlitMCProblems = nonlit['비문학_객관식_문제'] || [];
  const nonlitMCChoices = nonlit['비문학_객관식_선택지'] || {};
  const nonlitMCAnswers = nonlit['비문학_객관식_정답'] || {};
  const nonlitMCExpl = nonlit['비문학_객관식_해설'] || {};
  const nonlitMCBogi = nonlit['비문학_객관식_보기'] || {};

  // 객관식 (최대 3개)
  const nonlitMCLimit = Math.min(nonlitMCProblems.length, 3);
  for (let i = 0; i < nonlitMCLimit; i++) {
    const p = nonlitMCProblems[i];
    const num = String(p['번호']);
    const rawChoices = nonlitMCChoices[num] || [];
    const rawAnswer = nonlitMCAnswers[num] || '';
    const expl = nonlitMCExpl[num] || '';
    const bogi = nonlitMCBogi[num] || null;

    const choices5 = rawChoices.map((c, idx) => ({
      id: String(idx + 1),
      text: stripChoicePrefix(c)
    }));
    const ansNum = answerToNum(rawAnswer);

    let finalChoices, finalAnswer;
    if (choices5.length === 5) {
      const converted = to4Choices(choices5, ansNum);
      finalChoices = converted.choices;
      finalAnswer = converted.correctAnswer;
    } else {
      finalChoices = choices5;
      while (finalChoices.length < 4) finalChoices.push({ id: String(finalChoices.length + 1), text: '해당 없음' });
      finalAnswer = ansNum;
    }

    let stem = p['문제'] || '';
    if (bogi) stem = stem + '\n\n' + bogi;

    const choiceExplanations = {};
    for (const c of finalChoices) {
      if (c.id === finalAnswer) {
        choiceExplanations[c.id] = `정답 해설: ${expl || c.text}`;
      } else {
        choiceExplanations[c.id] = `오답 조언: 지문의 내용을 다시 확인해 보세요.`;
      }
    }

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: pickDomain(NONLIT_DOMAINS),
      points: 3,
      stem,
      passage: nonlitPassage,
      correctAnswer: finalAnswer,
      choices: finalChoices,
      choiceExplanations
    });
  }

  // 문장 독해 (최대 2개)
  const nonlitSentProblems = nonlit['비문학_문장_독해_문제'] || [];
  const nonlitSentChoices = nonlit['비문학_문장_독해_선택지'] || {};
  const nonlitSentAnswers = nonlit['비문학_문장_독해_정답'] || {};
  const nonlitSentLimit = Math.min(nonlitSentProblems.length, 2);
  for (let i = 0; i < nonlitSentLimit; i++) {
    const p = nonlitSentProblems[i];
    const num = String(p['번호']);
    const rawChoices = nonlitSentChoices[num] || [];
    const rawAnswer = nonlitSentAnswers[num] || '';

    const choices4 = rawChoices.map((c, idx) => ({
      id: String(idx + 1),
      text: stripChoicePrefix(c)
    }));
    const ansNum = answerToNum(rawAnswer);

    const choiceExplanations = {};
    for (const c of choices4) {
      if (c.id === ansNum) {
        choiceExplanations[c.id] = `정답 해설: 지문의 내용을 바탕으로 이것이 정답입니다.`;
      } else {
        choiceExplanations[c.id] = `오답 조언: 지문의 해당 부분을 다시 읽어보세요.`;
      }
    }

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: pickDomain(NONLIT_DOMAINS),
      points: 3,
      stem: p['문제'],
      passage: nonlitPassage,
      correctAnswer: ansNum,
      choices: choices4,
      choiceExplanations
    });
  }

  // 단답형 → 객관식 (2개)
  const nonlitSAProblems = nonlit['비문학_단답형_문제'] || [];
  const nonlitSAAnswers = nonlit['비문학_단답형_정답'] || {};
  const nonlitSALimit = Math.min(nonlitSAProblems.length, 2);
  for (let i = 0; i < nonlitSALimit; i++) {
    const p = nonlitSAProblems[i];
    const num = String(p['번호']);
    const correctText = nonlitSAAnswers[num] || '';

    const otherAnswers = Object.entries(nonlitSAAnswers)
      .filter(([k]) => k !== num)
      .map(([, v]) => v);
    const distractors = otherAnswers.slice(0, 3);
    while (distractors.length < 3) distractors.push('해당 없음');

    const { choices, correctAnswer } = shortAnswerToMC(p['문제'], correctText, distractors);

    const choiceExplanations = {};
    for (const c of choices) {
      if (c.id === correctAnswer) {
        choiceExplanations[c.id] = `정답 해설: 정답은 '${correctText}'입니다.`;
      } else {
        choiceExplanations[c.id] = `오답 조언: '${c.text}'은(는) 이 문제의 정답이 아닙니다.`;
      }
    }

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: pickDomain(NONLIT_DOMAINS),
      points: 3,
      stem: p['문제'],
      passage: nonlitPassage,
      correctAnswer,
      choices,
      choiceExplanations
    });
  }

  // 서술형 (1개)
  const nonlitEssay = nonlit['비문학_서술형_문제'] || [];
  const nonlitEssayAnswers = nonlit['비문학_서술형_모범_답안'] || {};
  if (nonlitEssay.length > 0) {
    const p = nonlitEssay[0];
    const num = String(p['번호']);
    const modelAns = nonlitEssayAnswers[num] || '';
    questions.push({
      number: qNum++,
      type: '서술형',
      domain: pickDomain(NONLIT_DOMAINS),
      points: 8,
      stem: p['문제'],
      passage: nonlitPassage,
      correctAnswer: null,
      choices: [],
      choiceExplanations: {},
      modelAnswer: modelAns,
      essayKeywords: extractKeywords(modelAns),
      essayRubric: '지문의 핵심 내용을 정확히 파악하고, 구체적인 근거를 포함하여 논리적으로 서술했는지 평가합니다.'
    });
  }

  // ==================== 30문제 맞추기 ====================
  // 현재 문제 수 확인
  const currentCount = questions.length;
  const targetCount = 30;

  if (currentCount < targetCount) {
    // 부족한 만큼 추가 문제 생성
    // 추가 출처: 문법 객관식 잔여, 개념 객관식 잔여, 문학 객관식 잔여, 비문학 문장독해 잔여

    // 문법 추가 객관식
    for (let i = gramMCLimit; i < gramMCProblems.length && questions.length < targetCount; i++) {
      const p = gramMCProblems[i];
      const num = String(p['번호']);
      const rawChoices = gramMCChoices[num] || [];
      const rawAnswer = gramMCAnswers[num] || '';
      const expl = gramMCExpl[num] || '';
      const bogi = gramMCBogi[num] || null;

      const choices5 = rawChoices.map((c, idx) => ({
        id: String(idx + 1),
        text: stripChoicePrefix(c)
      }));
      const ansNum = answerToNum(rawAnswer);

      let finalChoices, finalAnswer;
      if (choices5.length === 5) {
        const converted = to4Choices(choices5, ansNum);
        finalChoices = converted.choices;
        finalAnswer = converted.correctAnswer;
      } else {
        finalChoices = choices5;
        while (finalChoices.length < 4) finalChoices.push({ id: String(finalChoices.length + 1), text: '해당 없음' });
        finalAnswer = ansNum;
      }

      let stem = p['문제'] || '';
      if (bogi) stem = stem + '\n\n' + bogi;

      const choiceExplanations = {};
      for (const c of finalChoices) {
        if (c.id === finalAnswer) {
          choiceExplanations[c.id] = `정답 해설: ${expl || c.text}`;
        } else {
          choiceExplanations[c.id] = `오답 조언: 이 선택지는 정답과 다릅니다.`;
        }
      }

      questions.push({
        number: qNum++,
        type: '객관식',
        domain: pickDomain(GRAMMAR_DOMAINS),
        points: 3,
        stem,
        passage: gramPassage,
        correctAnswer: finalAnswer,
        choices: finalChoices,
        choiceExplanations
      });
    }

    // 개념 추가 객관식
    for (let i = concMCLimit; i < concMCProblems.length && questions.length < targetCount; i++) {
      const p = concMCProblems[i];
      const num = String(p['번호']);
      const rawChoices = concMCChoices[num] || [];
      const rawAnswer = concMCAnswers[num] || '';
      const expl = concMCExpl[num] || '';
      const bogi = concMCBogi[num] || null;

      const choices5 = rawChoices.map((c, idx) => ({
        id: String(idx + 1),
        text: stripChoicePrefix(c)
      }));
      const ansNum = answerToNum(rawAnswer);

      let finalChoices, finalAnswer;
      if (choices5.length === 5) {
        const converted = to4Choices(choices5, ansNum);
        finalChoices = converted.choices;
        finalAnswer = converted.correctAnswer;
      } else {
        finalChoices = choices5;
        while (finalChoices.length < 4) finalChoices.push({ id: String(finalChoices.length + 1), text: '해당 없음' });
        finalAnswer = ansNum;
      }

      let stem = p['문제'] || '';
      if (bogi) stem = stem + '\n\n' + bogi;

      const choiceExplanations = {};
      for (const c of finalChoices) {
        if (c.id === finalAnswer) {
          choiceExplanations[c.id] = `정답 해설: ${expl || c.text}`;
        } else {
          choiceExplanations[c.id] = `오답 조언: 이 선택지는 정답과 다릅니다.`;
        }
      }

      questions.push({
        number: qNum++,
        type: '객관식',
        domain: pickDomain(CONCEPT_DOMAINS),
        points: 3,
        stem,
        passage: concPassage,
        correctAnswer: finalAnswer,
        choices: finalChoices,
        choiceExplanations
      });
    }

    // 문학 추가 객관식
    for (let i = litMCLimit; i < litMCProblems.length && questions.length < targetCount; i++) {
      const p = litMCProblems[i];
      const num = String(p['번호']);
      const rawChoices = litMCChoices[num] || [];
      const rawAnswer = litMCAnswers[num] || '';
      const expl = litMCExpl[num] || '';
      const bogi = litMCBogi[num] || null;

      const choices5 = rawChoices.map((c, idx) => ({
        id: String(idx + 1),
        text: stripChoicePrefix(c)
      }));
      const ansNum = answerToNum(rawAnswer);

      let finalChoices, finalAnswer;
      if (choices5.length === 5) {
        const converted = to4Choices(choices5, ansNum);
        finalChoices = converted.choices;
        finalAnswer = converted.correctAnswer;
      } else {
        finalChoices = choices5;
        while (finalChoices.length < 4) finalChoices.push({ id: String(finalChoices.length + 1), text: '해당 없음' });
        finalAnswer = ansNum;
      }

      let stem = p['문제'] || '';
      if (bogi) stem = stem + '\n\n' + bogi;

      const choiceExplanations = {};
      for (const c of finalChoices) {
        if (c.id === finalAnswer) {
          choiceExplanations[c.id] = `정답 해설: ${expl || c.text}`;
        } else {
          choiceExplanations[c.id] = `오답 조언: 작품의 내용을 다시 확인해 보세요.`;
        }
      }

      questions.push({
        number: qNum++,
        type: '객관식',
        domain: pickDomain(LIT_DOMAINS),
        points: 3,
        stem,
        passage: litPassage,
        correctAnswer: finalAnswer,
        choices: finalChoices,
        choiceExplanations
      });
    }

    // 비문학 추가 문장독해
    for (let i = nonlitSentLimit; i < nonlitSentProblems.length && questions.length < targetCount; i++) {
      const p = nonlitSentProblems[i];
      const num = String(p['번호']);
      const rawChoices = nonlitSentChoices[num] || [];
      const rawAnswer = nonlitSentAnswers[num] || '';

      const choices4 = rawChoices.map((c, idx) => ({
        id: String(idx + 1),
        text: stripChoicePrefix(c)
      }));
      const ansNum = answerToNum(rawAnswer);

      const choiceExplanations = {};
      for (const c of choices4) {
        if (c.id === ansNum) {
          choiceExplanations[c.id] = `정답 해설: 지문의 내용을 바탕으로 이것이 정답입니다.`;
        } else {
          choiceExplanations[c.id] = `오답 조언: 지문의 해당 부분을 다시 읽어보세요.`;
        }
      }

      questions.push({
        number: qNum++,
        type: '객관식',
        domain: pickDomain(NONLIT_DOMAINS),
        points: 3,
        stem: p['문제'],
        passage: nonlitPassage,
        correctAnswer: ansNum,
        choices: choices4,
        choiceExplanations
      });
    }

    // 문법 추가 단답형 → 객관식
    for (let i = gramSALimit; i < gramSAProblems.length && questions.length < targetCount; i++) {
      const p = gramSAProblems[i];
      const num = String(p['번호']);
      const correctText = gramSAAnswers[num] || '';
      const otherAnswers = Object.entries(gramSAAnswers)
        .filter(([k]) => k !== num)
        .map(([, v]) => v);
      const distractors = otherAnswers.slice(0, 3);
      while (distractors.length < 3) distractors.push('해당 없음');
      const { choices, correctAnswer } = shortAnswerToMC(p['문제'], correctText, distractors);
      const choiceExplanations = {};
      for (const c of choices) {
        if (c.id === correctAnswer) {
          choiceExplanations[c.id] = `정답 해설: 정답은 '${correctText}'입니다.`;
        } else {
          choiceExplanations[c.id] = `오답 조언: '${c.text}'은(는) 이 문제의 정답이 아닙니다.`;
        }
      }
      questions.push({
        number: qNum++,
        type: '객관식',
        domain: pickDomain(GRAMMAR_DOMAINS),
        points: 3,
        stem: p['문제'],
        passage: gramPassage,
        correctAnswer,
        choices,
        choiceExplanations
      });
    }

    // 개념 추가 단답형 → 객관식
    for (let i = concSALimit; i < concSAProblems.length && questions.length < targetCount; i++) {
      const p = concSAProblems[i];
      const num = String(p['번호']);
      const correctText = concSAAnswers[num] || '';
      const otherAnswers = Object.entries(concSAAnswers)
        .filter(([k]) => k !== num)
        .map(([, v]) => v);
      const distractors = otherAnswers.slice(0, 3);
      while (distractors.length < 3) distractors.push('해당 없음');
      const { choices, correctAnswer } = shortAnswerToMC(p['문제'], correctText, distractors);
      const choiceExplanations = {};
      for (const c of choices) {
        if (c.id === correctAnswer) {
          choiceExplanations[c.id] = `정답 해설: 정답은 '${correctText}'입니다.`;
        } else {
          choiceExplanations[c.id] = `오답 조언: '${c.text}'은(는) 이 문제의 정답이 아닙니다.`;
        }
      }
      questions.push({
        number: qNum++,
        type: '객관식',
        domain: pickDomain(CONCEPT_DOMAINS),
        points: 3,
        stem: p['문제'],
        passage: concPassage,
        correctAnswer,
        choices,
        choiceExplanations
      });
    }

    // 비문학 추가 단답형 → 객관식
    for (let i = nonlitSALimit; i < nonlitSAProblems.length && questions.length < targetCount; i++) {
      const p = nonlitSAProblems[i];
      const num = String(p['번호']);
      const correctText = nonlitSAAnswers[num] || '';
      const otherAnswers = Object.entries(nonlitSAAnswers)
        .filter(([k]) => k !== num)
        .map(([, v]) => v);
      const distractors = otherAnswers.slice(0, 3);
      while (distractors.length < 3) distractors.push('해당 없음');
      const { choices, correctAnswer } = shortAnswerToMC(p['문제'], correctText, distractors);
      const choiceExplanations = {};
      for (const c of choices) {
        if (c.id === correctAnswer) {
          choiceExplanations[c.id] = `정답 해설: 정답은 '${correctText}'입니다.`;
        } else {
          choiceExplanations[c.id] = `오답 조언: '${c.text}'은(는) 이 문제의 정답이 아닙니다.`;
        }
      }
      questions.push({
        number: qNum++,
        type: '객관식',
        domain: pickDomain(NONLIT_DOMAINS),
        points: 3,
        stem: p['문제'],
        passage: nonlitPassage,
        correctAnswer,
        choices,
        choiceExplanations
      });
    }

    // 문학 추가 문장독해
    for (let i = litSentLimit; i < litSentProblems.length && questions.length < targetCount; i++) {
      const p = litSentProblems[i];
      const num = String(p['번호']);
      const rawChoices = litSentChoices[num] || [];
      const rawAnswer = litSentAnswers[num] || '';

      const choices4 = rawChoices.map((c, idx) => ({
        id: String(idx + 1),
        text: stripChoicePrefix(c)
      }));
      const ansNum = answerToNum(rawAnswer);

      const choiceExplanations = {};
      for (const c of choices4) {
        if (c.id === ansNum) {
          choiceExplanations[c.id] = `정답 해설: 문맥을 통해 이것이 정답임을 알 수 있습니다.`;
        } else {
          choiceExplanations[c.id] = `오답 조언: 문장의 문맥을 다시 살펴보세요.`;
        }
      }

      questions.push({
        number: qNum++,
        type: '객관식',
        domain: pickDomain(LIT_DOMAINS),
        points: 3,
        stem: p['문제'],
        passage: litPassage,
        correctAnswer: ansNum,
        choices: choices4,
        choiceExplanations
      });
    }

    // 추가 서술형 (2번째 문학 서술형)
    if (litEssay.length > 1 && questions.length < targetCount) {
      const p = litEssay[1];
      const num = String(p['번호']);
      const modelAns = litEssayAnswers[num] || '';
      questions.push({
        number: qNum++,
        type: '서술형',
        domain: pickDomain(LIT_DOMAINS),
        points: 8,
        stem: p['문제'],
        passage: litPassage,
        correctAnswer: null,
        choices: [],
        choiceExplanations: {},
        modelAnswer: modelAns,
        essayKeywords: extractKeywords(modelAns),
        essayRubric: '작품의 내용을 정확히 파악하고, 핵심 개념과 근거를 포함하여 논리적으로 서술했는지 평가합니다.'
      });
    }
  }

  // 30문제 초과 시 자르기
  while (questions.length > targetCount) {
    questions.pop();
    qNum--;
  }

  // 문제 번호 재정렬
  questions.forEach((q, i) => { q.number = i + 1; });

  // 최종 통계 출력
  const mcCount = questions.filter(q => q.type === '객관식').length;
  const essayCount = questions.filter(q => q.type === '서술형').length;
  const domainStats = {};
  for (const q of questions) {
    domainStats[q.domain] = (domainStats[q.domain] || 0) + 1;
  }

  return { questions, stats: { total: questions.length, mc: mcCount, essay: essayCount, domainStats } };
}

// ==================== 메인 실행 ====================
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

console.log('러셀3 테스트 데이터 생성 시작...\n');

for (let ch = 1; ch <= 20; ch++) {
  try {
    const { questions, stats } = generateTest(ch);
    const fileName = `russell3_ch${String(ch).padStart(2, '0')}.json`;
    const outPath = path.join(OUT_DIR, fileName);

    fs.writeFileSync(outPath, JSON.stringify({ questions }, null, 2), 'utf8');

    console.log(`[챕터 ${String(ch).padStart(2, '0')}] ${fileName} — 총 ${stats.total}문제 (객관식 ${stats.mc}, 서술형 ${stats.essay})`);
    // 역량 분포
    const domainStr = Object.entries(stats.domainStats).map(([k, v]) => `${k}:${v}`).join(', ');
    console.log(`  역량 분포: ${domainStr}`);
  } catch (err) {
    console.error(`[챕터 ${ch}] 오류:`, err.message);
  }
}

console.log('\n완료!');
