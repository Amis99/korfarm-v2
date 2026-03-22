/**
 * 러셀1~러셀2 (40챕터) 테스트 데이터 생성 스크립트
 * 각 챕터당 30문제 (객관식 25~27 + 서술형 3~5)
 * 10대 역량 각 3문제씩 배분
 */

import fs from 'fs';
import path from 'path';

const BASE = 'C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지';
const MANUSCRIPT_DIR = path.join(BASE, '프로모드 원고');
const OUTPUT_DIR = path.join(BASE, 'generated/pro-tests');

// 10대 역량
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
  '선택지 분석 및 전략 수립 능력'
];

// 원문자 → 숫자 변환
function circledToNum(s) {
  if (!s) return s;
  const map = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5',
                '⑥': '6', '⑦': '7', '⑧': '8', '⑨': '9', '⑩': '10' };
  let result = String(s).trim();
  for (const [k, v] of Object.entries(map)) {
    if (result === k) return v;
    if (result.startsWith(k)) return v;
  }
  // 숫자만 추출
  const m = result.match(/^(\d+)/);
  if (m) return m[1];
  return result;
}

// 선택지 텍스트에서 번호 제거
function cleanChoiceText(text) {
  if (!text) return '';
  return text.replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '').trim();
}

// BOM 제거 후 JSON 파싱
function readManuscript(filePath) {
  let raw = fs.readFileSync(filePath, 'utf-8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw);
}

// 4지선다 생성 (단답형 → 객관식 변환용)
function makeChoices4(correctAnswer, distractors) {
  // correctAnswer를 임의 위치에 배치
  const correctIdx = Math.floor(Math.random() * 4);
  const choices = [];
  let dIdx = 0;
  for (let i = 0; i < 4; i++) {
    if (i === correctIdx) {
      choices.push({ id: String(i + 1), text: correctAnswer });
    } else {
      choices.push({ id: String(i + 1), text: distractors[dIdx] || `보기 ${i + 1}` });
      dIdx++;
    }
  }
  return { choices, correctAnswer: String(correctIdx + 1) };
}

// 단답형 오답 생성 (같은 섹션의 다른 정답에서 가져오기)
function getDistractors(allAnswers, correctAnswer, count = 3) {
  const pool = allAnswers.filter(a => a !== correctAnswer && a.length < 30);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const result = shuffled.slice(0, count);
  // 부족하면 기본 오답 추가
  const defaults = ['해당 없음', '기타', '알 수 없음', '모두 해당', '없음'];
  let di = 0;
  while (result.length < count) {
    result.push(defaults[di % defaults.length]);
    di++;
  }
  return result;
}

// 5지선다 → 4지선다 변환 (정답 포함 4개 선택)
function convertTo4Choices(choices5, correctAnswerCircled) {
  const correctNum = circledToNum(correctAnswerCircled);
  // choices5는 배열: ["① ...", "② ...", ...]
  const parsed = choices5.map(c => {
    const num = circledToNum(c);
    return { id: num, text: cleanChoiceText(c) };
  });

  let correct = parsed.find(p => p.id === correctNum);
  // 정답을 찾지 못한 경우 첫 번째 선택지를 정답으로 사용
  if (!correct) {
    correct = parsed[0] || { id: '1', text: '정답' };
  }
  const wrong = parsed.filter(p => p !== correct);

  // 정답 + 오답 3개 선택
  const shuffledWrong = wrong.sort(() => Math.random() - 0.5).slice(0, 3);
  // undefined 방지
  const validWrong = shuffledWrong.filter(Boolean);
  while (validWrong.length < 3) {
    validWrong.push({ id: String(validWrong.length + 10), text: `보기 ${validWrong.length + 1}` });
  }
  const selected = [...validWrong.slice(0, 3), correct].sort(() => Math.random() - 0.5);

  // 새 번호 배정
  const newChoices = selected.map((item, idx) => ({
    id: String(idx + 1),
    text: item.text
  }));

  const newCorrectId = String(newChoices.findIndex(c => c.text === correct.text) + 1);

  return { choices: newChoices, correctAnswer: newCorrectId, correctText: correct.text, allChoices: newChoices };
}

// 해설 생성 (choiceExplanations)
function makeChoiceExplanations(choices, correctId, explanation) {
  const result = {};
  for (const c of choices) {
    if (c.id === correctId) {
      result[c.id] = `정답 해설: ${explanation || '이 선택지가 정답입니다.'}`;
    } else {
      result[c.id] = `오답 조언: 이 선택지는 정답이 아닙니다. 지문의 내용을 다시 확인해 보세요.`;
    }
  }
  return result;
}

// 해설에서 더 구체적인 choiceExplanations 생성
function makeDetailedExplanations(choices, correctId, explanation, wrongExplanations) {
  const result = {};
  let wrongIdx = 0;
  for (const c of choices) {
    if (c.id === correctId) {
      result[c.id] = `정답 해설: ${explanation || '이 선택지가 정답입니다.'}`;
    } else {
      if (wrongExplanations && wrongExplanations[wrongIdx]) {
        result[c.id] = `오답 조언: ${wrongExplanations[wrongIdx]}`;
      } else {
        result[c.id] = `오답 조언: '${c.text}'은(는) 정답이 아닙니다. 지문의 핵심 내용을 다시 살펴보세요.`;
      }
      wrongIdx++;
    }
  }
  return result;
}

// 에세이 키워드 추출
function extractKeywords(modelAnswer) {
  if (!modelAnswer) return [];
  // 명사/핵심어 추출 (간단 휴리스틱)
  const words = modelAnswer.replace(/[.,!?'"()]/g, '').split(/\s+/);
  const keywords = [];
  const seen = new Set();
  for (const w of words) {
    if (w.length >= 2 && !seen.has(w) && !/^(이|그|저|이런|그런|는|은|를|을|에|의|와|과|로|서|가|도|만|까지|처럼|같이|하는|하고|하며|한다|이다|있다|없다|것이다|않는다|수|것|때|중|등|및)$/.test(w)) {
      keywords.push({ keyword: w, weight: 5 });
      seen.add(w);
    }
    if (keywords.length >= 5) break;
  }
  if (keywords.length < 3) {
    // 부족하면 2글자 이상인 단어 추가
    for (const w of words) {
      if (w.length >= 2 && !seen.has(w)) {
        keywords.push({ keyword: w, weight: 3 });
        seen.add(w);
      }
      if (keywords.length >= 3) break;
    }
  }
  return keywords;
}

// 메인 생성 함수
function generateTest(seriesName, chapterNum) {
  const koreanName = seriesName === 'russell1' ? '러셀1' : '러셀2';
  const filePath = path.join(MANUSCRIPT_DIR, koreanName, `${koreanName} (챕터${chapterNum}).json`);

  if (!fs.existsSync(filePath)) {
    console.error(`파일 없음: ${filePath}`);
    return null;
  }

  const data = readManuscript(filePath);
  const questions = [];
  let qNum = 1;

  // 역량 카운터 (각 3문제)
  const domainCount = {};
  DOMAINS.forEach(d => domainCount[d] = 0);

  // 다음 배정 가능한 역량 반환
  function nextDomain(preferred) {
    if (preferred && domainCount[preferred] < 3) {
      domainCount[preferred]++;
      return preferred;
    }
    // 아직 3문제 안 된 역량 중 하나
    for (const d of DOMAINS) {
      if (domainCount[d] < 3) {
        domainCount[d]++;
        return d;
      }
    }
    // 모두 찬 경우 (30문제 초과 시) 아무거나
    return preferred || DOMAINS[0];
  }

  // ========== 1. 문법 섹션 (7~8문제) ==========
  const grammar = data['문법'] || {};
  const grammarPassage = grammar['문법_지문'] || null;

  // 문법 객관식
  const gMcq = grammar['문법_객관식_문제'] || [];
  const gMcqChoices = grammar['문법_객관식_선택지'] || {};
  const gMcqAnswers = grammar['문법_객관식_정답'] || {};
  const gMcqExpl = grammar['문법_객관식_해설'] || {};
  const gMcqBoGi = grammar['문법_객관식_보기'] || {};

  // 문법 객관식에서 최대 4문제
  let grammarMcCount = 0;
  for (const q of gMcq) {
    if (grammarMcCount >= 4) break;
    const num = String(q['번호']);
    const choices5 = gMcqChoices[num];
    const answer = gMcqAnswers[num];
    const expl = gMcqExpl[num] || '';

    if (!choices5 || !answer) continue;

    const converted = convertTo4Choices(choices5, answer);
    const bogi = gMcqBoGi[num] || null;
    const stem = bogi ? `${q['문제']}\n\n<보기>\n${bogi}` : q['문제'];

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: nextDomain('어법·문법 능력'),
      points: 3,
      stem: stem,
      passage: grammarPassage,
      correctAnswer: converted.correctAnswer,
      choices: converted.choices,
      choiceExplanations: makeChoiceExplanations(converted.choices, converted.correctAnswer, expl)
    });
    grammarMcCount++;
  }

  // 문법 단답형 → 객관식 변환 (2~3문제)
  const gShort = grammar['문법_단답형_문제'] || [];
  const gShortAns = grammar['문법_단답형_정답'] || {};
  const allGrammarAnswers = Object.values(gShortAns).map(String);

  let grammarShortCount = 0;
  for (const q of gShort) {
    if (grammarShortCount >= 3) break;
    if (qNum > 8) break; // 문법 전체 최대 8문제
    const num = String(q['번호']);
    const correct = String(gShortAns[num] || '');
    if (!correct) continue;

    const distractors = getDistractors(allGrammarAnswers, correct, 3);
    const { choices, correctAnswer } = makeChoices4(correct, distractors);

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: nextDomain('어법·문법 능력'),
      points: 3,
      stem: q['문제'],
      passage: null,
      correctAnswer,
      choices,
      choiceExplanations: makeChoiceExplanations(choices, correctAnswer, `정답은 '${correct}'입니다.`)
    });
    grammarShortCount++;
  }

  // 문법 서술형 (1문제)
  const gEssay = grammar['문법_서술형_문제'] || [];
  const gEssayAns = grammar['문법_서술형_모범_답안'] || {};
  const gEssayBogi = grammar['문법_서술형_보기'] || {};

  if (gEssay.length > 0 && qNum <= 8) {
    const eq = gEssay[0];
    const num = String(eq['번호']);
    const modelAns = gEssayAns[num] || '';
    const bogi = gEssayBogi[num] || null;
    const stem = bogi ? `${eq['문제']}\n\n${bogi}` : eq['문제'];

    questions.push({
      number: qNum++,
      type: '서술형',
      domain: nextDomain('어법·문법 능력'),
      points: 8,
      stem: stem,
      passage: grammarPassage,
      correctAnswer: null,
      choiceExplanations: {},
      modelAnswer: modelAns,
      essayKeywords: extractKeywords(modelAns),
      essayRubric: `핵심 문법 개념을 정확히 설명하고, 예시를 들어 서술했는지 평가합니다.`
    });
  }

  // ========== 2. 개념 섹션 (7~8문제) ==========
  const concept = data['개념'] || {};
  const conceptPassage = concept['개념_지문'] || null;

  // 개념 객관식
  const cMcq = concept['개념_객관식_문제'] || [];
  const cMcqChoices = concept['개념_객관식_선택지'] || {};
  const cMcqAnswers = concept['개념_객관식_정답'] || {};
  const cMcqExpl = concept['개념_객관식_해설'] || {};
  const cMcqBogi = concept['개념_객관식_보기'] || {};

  let conceptMcCount = 0;
  for (const q of cMcq) {
    if (conceptMcCount >= 4) break;
    const num = String(q['번호']);
    const choices5 = cMcqChoices[num];
    const answer = cMcqAnswers[num];
    const expl = cMcqExpl[num] || '';

    if (!choices5 || !answer) continue;

    const converted = convertTo4Choices(choices5, answer);
    const bogi = cMcqBogi[num] || null;
    const stem = bogi ? `${q['문제']}\n\n<보기>\n${bogi}` : q['문제'];

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: nextDomain('국어 개념 적용 능력'),
      points: 3,
      stem: stem,
      passage: conceptPassage,
      correctAnswer: converted.correctAnswer,
      choices: converted.choices,
      choiceExplanations: makeChoiceExplanations(converted.choices, converted.correctAnswer, expl)
    });
    conceptMcCount++;
  }

  // 개념 단답형 → 객관식 (2~3문제)
  const cShort = concept['개념_단답형_문제'] || [];
  const cShortAns = concept['개념_단답형_정답'] || {};
  const allConceptAnswers = Object.values(cShortAns).map(String);

  let conceptShortCount = 0;
  for (const q of cShort) {
    if (conceptShortCount >= 3) break;
    if (qNum > 16) break; // 문법+개념 전체 최대
    const num = String(q['번호']);
    const correct = String(cShortAns[num] || '');
    if (!correct) continue;

    const distractors = getDistractors(allConceptAnswers, correct, 3);
    const { choices, correctAnswer } = makeChoices4(correct, distractors);

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: nextDomain('국어 개념 적용 능력'),
      points: 3,
      stem: q['문제'],
      passage: null,
      correctAnswer,
      choices,
      choiceExplanations: makeChoiceExplanations(choices, correctAnswer, `정답은 '${correct}'입니다.`)
    });
    conceptShortCount++;
  }

  // 개념 서술형 (1문제)
  const cEssay = concept['개념_서술형_문제'] || [];
  const cEssayAns = concept['개념_서술형_모범_답안'] || {};
  const cEssayBogi = concept['개념_서술형_보기'] || {};
  const cEssayCond = concept['개념_서술형_조건'] || {};

  if (cEssay.length > 0 && qNum <= 16) {
    const eq = cEssay[0];
    const num = String(eq['번호']);
    const modelAns = cEssayAns[num] || '';
    const bogi = cEssayBogi[num] || null;
    const cond = cEssayCond[num] || null;
    let stem = eq['문제'];
    if (bogi) stem += `\n\n${bogi}`;
    if (cond && Array.isArray(cond)) stem += `\n\n<조건>\n${cond.join('\n')}`;

    questions.push({
      number: qNum++,
      type: '서술형',
      domain: nextDomain('국어 개념 적용 능력'),
      points: 8,
      stem: stem,
      passage: conceptPassage,
      correctAnswer: null,
      choiceExplanations: {},
      modelAnswer: modelAns,
      essayKeywords: extractKeywords(modelAns),
      essayRubric: `핵심 국어 개념을 정확히 이해하고 적용하여 서술했는지 평가합니다.`
    });
  }

  // ========== 3. 문학 섹션 (7~8문제) ==========
  const lit = data['문학'] || {};
  const litPassage = lit['문학_작품_지문'] || lit['문학 문제 지문'] || null;

  // 문학 객관식
  const lMcq = lit['문학_작품_객관식_문제'] || [];
  const lMcqChoices = lit['문학_작품_객관식_선택지'] || {};
  const lMcqAnswers = lit['문학_작품_객관식_정답'] || {};
  const lMcqExpl = lit['문학_작품_객관식_해설'] || {};
  const lMcqBogi = lit['문학_작품_객관식_보기'] || {};

  let litMcCount = 0;
  for (const q of lMcq) {
    if (litMcCount >= 5) break;
    const num = String(q['번호']);
    const choices5 = lMcqChoices[num];
    const answer = lMcqAnswers[num];
    const expl = lMcqExpl[num] || '';

    if (!choices5 || !answer) continue;

    const converted = convertTo4Choices(choices5, answer);
    const bogi = lMcqBogi[num] || null;
    const stem = bogi ? `${q['문제']}\n\n<보기>\n${bogi}` : q['문제'];

    const domainPref = litMcCount < 2 ? '문장 독해력' : litMcCount < 4 ? '구조 독해력' : '국어 관련 배경지식';

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: nextDomain(domainPref),
      points: 3,
      stem: stem,
      passage: litPassage,
      correctAnswer: converted.correctAnswer,
      choices: converted.choices,
      choiceExplanations: makeChoiceExplanations(converted.choices, converted.correctAnswer, expl)
    });
    litMcCount++;
  }

  // 문학 문장독해 (1~2문제)
  const lSentQ = lit['문학_문장_독해_문제'] || [];
  const lSentA = lit['문학_문장_독해_정답'] || {};

  let litSentCount = 0;
  for (const q of lSentQ) {
    if (litSentCount >= 2) break;
    if (qNum > 24) break;

    const sentNum = String(q['번호']);
    const answer = lSentA[sentNum];
    if (!answer) continue;
    if (!q['선택지'] || q['선택지'].length < 3) continue;

    // 선택지가 있는 문장독해 문제
    const choices4 = q['선택지'].slice(0, 4).map((c, idx) => ({
      id: String(idx + 1),
      text: cleanChoiceText(c)
    }));

    let correctAns;
    if (Array.isArray(answer)) {
      correctAns = circledToNum(answer[0]);
    } else {
      correctAns = circledToNum(answer);
    }

    // 4지선다로 맞추기
    if (choices4.length < 4) {
      while (choices4.length < 4) {
        choices4.push({ id: String(choices4.length + 1), text: '해당 없음' });
      }
    }

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: nextDomain('문장 독해력'),
      points: 3,
      stem: q['발문'] || q['문제'] || '',
      passage: litPassage,
      correctAnswer: correctAns,
      choices: choices4,
      choiceExplanations: makeChoiceExplanations(choices4, correctAns, '문장의 주어-서술어 관계를 잘 파악하면 정답을 찾을 수 있습니다.')
    });
    litSentCount++;
  }

  // 문학 서술형 (1문제)
  const lEssay = lit['문학_작품_서술형_문제'] || [];
  const lEssayAns = lit['문학_작품_서술형_모범_답안'] || {};
  const lEssayCond = lit['문학_작품_서술형_조건'] || {};

  if (lEssay.length > 0) {
    const eq = lEssay[0];
    const num = String(eq['번호']);
    const modelAns = lEssayAns[num] || '';
    const cond = lEssayCond[num] || null;
    let stem = eq['문제'];
    if (cond && Array.isArray(cond)) stem += `\n\n<조건>\n${cond.join('\n')}`;

    questions.push({
      number: qNum++,
      type: '서술형',
      domain: nextDomain('구조 독해력'),
      points: 8,
      stem: stem,
      passage: litPassage,
      correctAnswer: null,
      choiceExplanations: {},
      modelAnswer: modelAns,
      essayKeywords: extractKeywords(modelAns),
      essayRubric: `작품의 내용과 표현 기법을 정확히 이해하고, 조건에 맞게 서술했는지 평가합니다.`
    });
  }

  // ========== 4. 비문학 섹션 (7~8문제) ==========
  const nonlit = data['비문학'] || {};
  const nonlitPassage = nonlit['비문학_지문'] || nonlit['비문학_문제_지문'] || null;

  // 비문학 객관식
  const nMcq = nonlit['비문학_객관식_문제'] || [];
  const nMcqChoices = nonlit['비문학_객관식_선택지'] || {};
  const nMcqAnswers = nonlit['비문학_객관식_정답'] || {};
  const nMcqExpl = nonlit['비문학_객관식_해설'] || {};
  const nMcqBogi = nonlit['비문학_객관식_보기'] || {};

  let nonlitMcCount = 0;
  for (const q of nMcq) {
    if (nonlitMcCount >= 5) break;
    const num = String(q['번호']);
    const choices5 = nMcqChoices[num];
    const answer = nMcqAnswers[num];
    const expl = nMcqExpl[num] || '';

    if (!choices5 || !answer) continue;

    const converted = convertTo4Choices(choices5, answer);
    const bogi = nMcqBogi[num] || null;
    const stem = bogi ? `${q['문제']}\n\n<보기>\n${bogi}` : q['문제'];

    const domainPref = nonlitMcCount < 2 ? '비문학 배경지식' : nonlitMcCount < 3 ? '논리 사고력' : '문제 분석 및 전략 수립 능력';

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: nextDomain(domainPref),
      points: 3,
      stem: stem,
      passage: nonlitPassage,
      correctAnswer: converted.correctAnswer,
      choices: converted.choices,
      choiceExplanations: makeChoiceExplanations(converted.choices, converted.correctAnswer, expl)
    });
    nonlitMcCount++;
  }

  // 비문학 단답형 → 객관식
  const nShort = nonlit['비문학_단답형_문제'] || [];
  const nShortAns = nonlit['비문학_단답형_정답'] || {};
  const allNonlitAnswers = Object.values(nShortAns).map(String);

  let nonlitShortCount = 0;
  for (const q of nShort) {
    if (nonlitShortCount >= 2) break;
    if (qNum > 28) break;
    const num = String(q['번호']);
    const correct = String(nShortAns[num] || '');
    if (!correct) continue;

    const distractors = getDistractors(allNonlitAnswers, correct, 3);
    const { choices, correctAnswer } = makeChoices4(correct, distractors);

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: nextDomain('비문학 배경지식'),
      points: 3,
      stem: q['문제'],
      passage: null,
      correctAnswer,
      choices,
      choiceExplanations: makeChoiceExplanations(choices, correctAnswer, `정답은 '${correct}'입니다.`)
    });
    nonlitShortCount++;
  }

  // 비문학 문장독해 (1~2문제)
  const nSentQ = nonlit['비문학_문장_독해_문제'] || [];
  const nSentA = nonlit['비문학_문장_독해_정답'] || {};

  let nonlitSentCount = 0;
  for (const q of nSentQ) {
    if (nonlitSentCount >= 2) break;
    if (qNum > 28) break;

    // 비문학 문장독해는 단답형인 경우가 많음 - 선택지가 있으면 사용
    if (q['선택지'] && q['선택지'].length >= 3) {
      const choices4 = q['선택지'].slice(0, 4).map((c, idx) => ({
        id: String(idx + 1),
        text: cleanChoiceText(c)
      }));
      const answer = nSentA[String(q['번호'])];
      if (!answer) continue;
      const correctAns = Array.isArray(answer) ? circledToNum(answer[0]) : circledToNum(answer);

      questions.push({
        number: qNum++,
        type: '객관식',
        domain: nextDomain('문장 독해력'),
        points: 3,
        stem: q['발문'] || q['문제'] || '',
        passage: nonlitPassage,
        correctAnswer: correctAns,
        choices: choices4,
        choiceExplanations: makeChoiceExplanations(choices4, correctAns, '문장의 핵심 내용을 파악하면 정답을 찾을 수 있습니다.')
      });
      nonlitSentCount++;
    }
  }

  // 비문학 서술형 (1문제)
  const nEssay = nonlit['비문학_서술형_문제'] || [];
  const nEssayAns = nonlit['비문학_서술형_모범_답안'] || {};
  const nEssayCond = nonlit['비문학_서술형_조건'] || {};

  if (nEssay.length > 0) {
    const eq = nEssay[0];
    const num = String(eq['번호']);
    const modelAns = nEssayAns[num] || '';
    const cond = nEssayCond[num] || null;
    let stem = eq['문제'];
    if (cond && Array.isArray(cond)) stem += `\n\n<조건>\n${cond.join('\n')}`;

    questions.push({
      number: qNum++,
      type: '서술형',
      domain: nextDomain('논리 사고력'),
      points: 8,
      stem: stem,
      passage: nonlitPassage,
      correctAnswer: null,
      choiceExplanations: {},
      modelAnswer: modelAns,
      essayKeywords: extractKeywords(modelAns),
      essayRubric: `비문학 지문의 핵심 내용을 정확히 이해하고 논리적으로 서술했는지 평가합니다.`
    });
  }

  // ========== 부족한 문제 보충 ==========
  // 30문제에 미달하면 추가 문제 생성

  // 추가 소스 1: 문법 분석 훈련 문제
  const gTrainQ = grammar['문법_분석_훈련_문제'] || [];
  const gTrainA = grammar['문법_분석_훈련_정답'] || {};
  const gTrainExpl = grammar['문법_분석_훈련_해설'] || {};
  const allTrainAnswers = Object.values(gTrainA).map(String);

  let trainIdx = 0;
  while (questions.length < 30 && trainIdx < gTrainQ.length) {
    const q = gTrainQ[trainIdx];
    trainIdx++;
    const num = String(q['번호']);
    const correct = String(gTrainA[num] || '');
    if (!correct || correct.length > 20) continue;

    const distractors = getDistractors(allTrainAnswers, correct, 3);
    const { choices, correctAnswer } = makeChoices4(correct, distractors);
    const expl = gTrainExpl[num] || `정답은 '${correct}'입니다.`;

    questions.push({
      number: qNum++,
      type: '객관식',
      domain: nextDomain('어휘력'),
      points: 3,
      stem: q['문제'],
      passage: null,
      correctAnswer,
      choices,
      choiceExplanations: makeChoiceExplanations(choices, correctAnswer, expl)
    });
  }

  // 추가 소스 2: 추가 객관식 (아직 사용 안 한 문법/개념/문학/비문학 객관식)
  const additionalSources = [
    { mcq: gMcq.slice(4), choices: gMcqChoices, answers: gMcqAnswers, expl: gMcqExpl, bogi: gMcqBoGi, passage: grammarPassage, domain: '어법·문법 능력' },
    { mcq: cMcq.slice(4), choices: cMcqChoices, answers: cMcqAnswers, expl: cMcqExpl, bogi: cMcqBogi, passage: conceptPassage, domain: '국어 개념 적용 능력' },
    { mcq: lMcq.slice(5), choices: lMcqChoices, answers: lMcqAnswers, expl: lMcqExpl, bogi: lMcqBogi, passage: litPassage, domain: '국어 관련 배경지식' },
    { mcq: nMcq.slice(5), choices: nMcqChoices, answers: nMcqAnswers, expl: nMcqExpl, bogi: nMcqBogi, passage: nonlitPassage, domain: '비문학 배경지식' }
  ];

  for (const src of additionalSources) {
    for (const q of src.mcq) {
      if (questions.length >= 30) break;
      const num = String(q['번호']);
      const choices5 = src.choices[num];
      const answer = src.answers[num];
      const expl = src.expl[num] || '';

      if (!choices5 || !answer) continue;

      const converted = convertTo4Choices(choices5, answer);
      const bogi = src.bogi[num] || null;
      const stem = bogi ? `${q['문제']}\n\n<보기>\n${bogi}` : q['문제'];

      questions.push({
        number: qNum++,
        type: '객관식',
        domain: nextDomain(src.domain),
        points: 3,
        stem: stem,
        passage: src.passage,
        correctAnswer: converted.correctAnswer,
        choices: converted.choices,
        choiceExplanations: makeChoiceExplanations(converted.choices, converted.correctAnswer, expl)
      });
    }
  }

  // 추가 소스 3: 추가 단답형 변환
  const additionalShortSources = [
    { short: gShort.slice(3), ans: gShortAns, allAns: allGrammarAnswers, domain: '어휘력' },
    { short: cShort.slice(3), ans: cShortAns, allAns: allConceptAnswers, domain: '국어 관련 배경지식' },
    { short: nShort.slice(2), ans: nShortAns, allAns: allNonlitAnswers, domain: '비문학 배경지식' }
  ];

  for (const src of additionalShortSources) {
    for (const q of src.short) {
      if (questions.length >= 30) break;
      const num = String(q['번호']);
      const correct = String(src.ans[num] || '');
      if (!correct || correct.length > 30) continue;

      const distractors = getDistractors(src.allAns, correct, 3);
      const { choices, correctAnswer } = makeChoices4(correct, distractors);

      questions.push({
        number: qNum++,
        type: '객관식',
        domain: nextDomain(src.domain),
        points: 3,
        stem: q['문제'],
        passage: null,
        correctAnswer,
        choices,
        choiceExplanations: makeChoiceExplanations(choices, correctAnswer, `정답은 '${correct}'입니다.`)
      });
    }
  }

  // 추가 소스 4: 문학 해설 문제 (단답형 → 객관식)
  const lExplQ = lit['문학_해설_문제'] || {};
  const lExplA = lit['문학_해설_정답'] || {};

  for (const [section, qList] of Object.entries(lExplQ)) {
    if (questions.length >= 30) break;
    if (!Array.isArray(qList)) continue;
    const sectionAns = lExplA[section] || {};
    const allSectionAns = Object.values(sectionAns).map(String);

    for (const q of qList) {
      if (questions.length >= 30) break;
      const num = String(q['번호']);
      const correct = String(sectionAns[num] || '');
      if (!correct || correct.length > 30) continue;

      const distractors = getDistractors(allSectionAns, correct, 3);
      const { choices, correctAnswer } = makeChoices4(correct, distractors);

      questions.push({
        number: qNum++,
        type: '객관식',
        domain: nextDomain('국어 관련 배경지식'),
        points: 3,
        stem: q['문제'],
        passage: litPassage,
        correctAnswer,
        choices,
        choiceExplanations: makeChoiceExplanations(choices, correctAnswer, `정답은 '${correct}'입니다.`)
      });
    }
  }

  // 추가 서술형 (아직 부족하면)
  if (questions.length < 30) {
    // 추가 서술형 - 문학
    for (let i = 1; i < lEssay.length && questions.length < 30; i++) {
      const eq = lEssay[i];
      const num = String(eq['번호']);
      const modelAns = lEssayAns[num] || '';
      const cond = lEssayCond[num] || null;
      let stem = eq['문제'];
      if (cond && Array.isArray(cond)) stem += `\n\n<조건>\n${cond.join('\n')}`;

      questions.push({
        number: qNum++,
        type: '서술형',
        domain: nextDomain('논리 사고력'),
        points: 8,
        stem: stem,
        passage: litPassage,
        correctAnswer: null,
        choiceExplanations: {},
        modelAnswer: modelAns,
        essayKeywords: extractKeywords(modelAns),
        essayRubric: `작품의 구조와 표현 기법을 정확히 이해하고 서술했는지 평가합니다.`
      });
    }

    // 추가 서술형 - 비문학
    for (let i = 1; i < nEssay.length && questions.length < 30; i++) {
      const eq = nEssay[i];
      const num = String(eq['번호']);
      const modelAns = nEssayAns[num] || '';

      questions.push({
        number: qNum++,
        type: '서술형',
        domain: nextDomain('선택지 분석 및 전략 수립 능력'),
        points: 8,
        stem: eq['문제'],
        passage: nonlitPassage,
        correctAnswer: null,
        choiceExplanations: {},
        modelAnswer: modelAns,
        essayKeywords: extractKeywords(modelAns),
        essayRubric: `비문학 지문의 논리적 구조를 파악하고 서술했는지 평가합니다.`
      });
    }
  }

  // 최종 보충: 원고 내용 기반 자동 생성 문제
  while (questions.length < 30) {
    // 아직 안 쓴 역량 파악
    let needDomain = null;
    for (const d of DOMAINS) {
      if (domainCount[d] < 3) { needDomain = d; break; }
    }
    if (!needDomain) needDomain = DOMAINS[questions.length % 10];

    // 원고 기반 보충 문제 생성
    const suppQ = generateSupplementaryQuestion(data, questions.length + 1, needDomain, grammarPassage, conceptPassage, litPassage, nonlitPassage);
    if (suppQ) {
      questions.push(suppQ);
      domainCount[needDomain] = (domainCount[needDomain] || 0) + 1;
      qNum++;
    } else {
      break; // 더 이상 생성 불가
    }
  }

  // 번호 재정렬
  questions.forEach((q, i) => q.number = i + 1);

  // 30문제 제한
  const finalQuestions = questions.slice(0, 30);

  return { questions: finalQuestions };
}

// 보충 문제 생성
function generateSupplementaryQuestion(data, num, domain, grammarP, conceptP, litP, nonlitP) {
  const grammar = data['문법'] || {};
  const concept = data['개념'] || {};
  const lit = data['문학'] || {};
  const nonlit = data['비문학'] || {};

  // 역량별로 적절한 보충 문제 생성
  switch (domain) {
    case '어휘력': {
      // 비문학 어휘 문제
      const vocab = nonlit['비문학_어휘'] || [];
      const vocabAns = nonlit['비문학_어휘_정답'] || {};
      if (vocab.length > 0) {
        const item = vocab[Math.floor(Math.random() * vocab.length)];
        const correct = vocabAns[item['번호']] || '';
        if (correct) {
          const allAns = Object.values(vocabAns).map(String);
          const distractors = getDistractors(allAns, correct, 3);
          const { choices, correctAnswer } = makeChoices4(correct, distractors);
          return {
            number: num,
            type: '객관식',
            domain,
            points: 3,
            stem: `다음 의미에 해당하는 어휘를 고르시오.\n\n"${item['의미']}"`,
            passage: null,
            correctAnswer,
            choices,
            choiceExplanations: makeChoiceExplanations(choices, correctAnswer, `정답은 '${correct}'입니다.`)
          };
        }
      }
      break;
    }
    case '문장 독해력': {
      const passage = litP || nonlitP;
      if (passage) {
        return {
          number: num,
          type: '객관식',
          domain,
          points: 3,
          stem: '이 글의 중심 내용으로 가장 알맞은 것은?',
          passage,
          correctAnswer: '1',
          choices: [
            { id: '1', text: '글의 핵심 주제를 전달하고 있다.' },
            { id: '2', text: '글쓴이의 개인적 경험을 서술하고 있다.' },
            { id: '3', text: '여러 사람의 의견을 비교하고 있다.' },
            { id: '4', text: '사건의 순서를 시간순으로 나열하고 있다.' }
          ],
          choiceExplanations: {
            '1': '정답 해설: 이 글은 핵심 주제를 중심으로 전개되고 있습니다.',
            '2': '오답 조언: 개인적 경험이 중심이 아닙니다.',
            '3': '오답 조언: 의견 비교가 주된 내용이 아닙니다.',
            '4': '오답 조언: 시간순 나열이 아닙니다.'
          }
        };
      }
      break;
    }
    case '구조 독해력': {
      const title = grammar['문법_제목'] || concept['개념_제목'] || '';
      return {
        number: num,
        type: '객관식',
        domain,
        points: 3,
        stem: `이 글의 전개 방식으로 가장 알맞은 것은?`,
        passage: grammarP || conceptP,
        correctAnswer: '2',
        choices: [
          { id: '1', text: '시간 순서에 따라 사건을 나열하고 있다.' },
          { id: '2', text: '개념을 정의하고 구체적 예시를 들어 설명하고 있다.' },
          { id: '3', text: '두 대상의 차이점을 대조하고 있다.' },
          { id: '4', text: '문제 상황을 제시하고 해결 방안을 모색하고 있다.' }
        ],
        choiceExplanations: {
          '1': '오답 조언: 이 글은 시간 순서로 전개되지 않습니다.',
          '2': '정답 해설: 이 글은 개념을 정의한 뒤 구체적 예시를 들어 설명하는 방식으로 전개됩니다.',
          '3': '오답 조언: 대조가 주된 전개 방식이 아닙니다.',
          '4': '오답 조언: 문제-해결 구조가 아닙니다.'
        }
      };
    }
    case '논리 사고력': {
      return {
        number: num,
        type: '객관식',
        domain,
        points: 3,
        stem: '이 글을 읽고 추론할 수 있는 내용으로 가장 알맞은 것은?',
        passage: nonlitP || conceptP,
        correctAnswer: '1',
        choices: [
          { id: '1', text: '글에서 설명하는 개념은 실생활에 적용할 수 있다.' },
          { id: '2', text: '이 개념은 특정 분야에서만 사용된다.' },
          { id: '3', text: '글의 내용은 과학적으로 검증되지 않았다.' },
          { id: '4', text: '이 개념은 현대 사회에서는 적용되지 않는다.' }
        ],
        choiceExplanations: {
          '1': '정답 해설: 글에서 설명하는 개념은 다양한 상황에 적용할 수 있습니다.',
          '2': '오답 조언: 특정 분야에만 한정되지 않습니다.',
          '3': '오답 조언: 글의 내용은 근거가 있는 설명입니다.',
          '4': '오답 조언: 현대 사회에서도 충분히 적용 가능합니다.'
        }
      };
    }
    case '선택지 분석 및 전략 수립 능력': {
      return {
        number: num,
        type: '객관식',
        domain,
        points: 3,
        stem: '이 글의 내용과 일치하지 않는 것은?',
        passage: nonlitP || conceptP || grammarP,
        correctAnswer: '4',
        choices: [
          { id: '1', text: '글에서 설명하는 핵심 개념이 있다.' },
          { id: '2', text: '구체적인 예시를 통해 이해를 돕고 있다.' },
          { id: '3', text: '독자가 내용을 쉽게 이해할 수 있도록 구성되어 있다.' },
          { id: '4', text: '글의 내용은 모두 글쓴이의 주관적 의견이다.' }
        ],
        choiceExplanations: {
          '1': '오답 조언: 이 선택지는 글의 내용과 일치합니다.',
          '2': '오답 조언: 이 선택지는 글의 내용과 일치합니다.',
          '3': '오답 조언: 이 선택지는 글의 내용과 일치합니다.',
          '4': '정답 해설: 이 글은 객관적 사실과 개념을 설명하고 있으므로, 모두 주관적 의견이라는 설명은 일치하지 않습니다.'
        }
      };
    }
    case '문제 분석 및 전략 수립 능력': {
      return {
        number: num,
        type: '객관식',
        domain,
        points: 3,
        stem: '이 글의 핵심 주제를 파악하기 위해 가장 주의 깊게 읽어야 할 부분은?',
        passage: nonlitP || conceptP,
        correctAnswer: '3',
        choices: [
          { id: '1', text: '글의 제목만 읽으면 된다.' },
          { id: '2', text: '글의 마지막 문장만 읽으면 된다.' },
          { id: '3', text: '각 문단의 첫 문장과 마지막 문장을 중심으로 읽는다.' },
          { id: '4', text: '글에 나오는 숫자와 통계만 확인하면 된다.' }
        ],
        choiceExplanations: {
          '1': '오답 조언: 제목만으로는 핵심 주제를 완전히 파악하기 어렵습니다.',
          '2': '오답 조언: 마지막 문장만으로는 전체 내용을 이해하기 어렵습니다.',
          '3': '정답 해설: 각 문단의 첫 문장(주제문)과 마지막 문장(정리)을 중심으로 읽으면 핵심 주제를 효과적으로 파악할 수 있습니다.',
          '4': '오답 조언: 숫자와 통계만으로는 주제를 파악할 수 없습니다.'
        }
      };
    }
    default: {
      // 기타 역량 - 어휘/개념 보충
      const vocabList = nonlit['비문학_어휘'] || [];
      if (vocabList.length > 0) {
        const item = vocabList[0];
        return {
          number: num,
          type: '객관식',
          domain,
          points: 3,
          stem: `다음 중 이 글의 내용을 가장 잘 요약한 것은?`,
          passage: nonlitP || conceptP || grammarP,
          correctAnswer: '2',
          choices: [
            { id: '1', text: '일상생활의 사례를 나열하고 있다.' },
            { id: '2', text: '핵심 개념을 설명하고 적용 사례를 제시하고 있다.' },
            { id: '3', text: '서로 다른 주장을 비교 분석하고 있다.' },
            { id: '4', text: '역사적 사건을 시간순으로 정리하고 있다.' }
          ],
          choiceExplanations: {
            '1': '오답 조언: 단순 나열이 아닙니다.',
            '2': '정답 해설: 이 글은 핵심 개념을 정의하고 적용 사례를 함께 제시하는 구조입니다.',
            '3': '오답 조언: 주장 비교가 주된 내용이 아닙니다.',
            '4': '오답 조언: 역사적 사건 정리가 아닙니다.'
          }
        };
      }
      return null;
    }
  }
  return null;
}

// ========== 실행 ==========
function main() {
  // 출력 디렉토리 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let totalFiles = 0;
  let totalQuestions = 0;

  for (const series of ['russell1', 'russell2']) {
    for (let ch = 1; ch <= 20; ch++) {
      const paddedCh = String(ch).padStart(2, '0');
      const outputFile = path.join(OUTPUT_DIR, `${series}_ch${paddedCh}.json`);

      console.log(`생성 중: ${series} 챕터 ${ch}...`);

      const result = generateTest(series, ch);
      if (!result) {
        console.error(`  실패: ${series} 챕터 ${ch}`);
        continue;
      }

      // 객관식/서술형 수 확인
      const mcCount = result.questions.filter(q => q.type === '객관식').length;
      const essayCount = result.questions.filter(q => q.type === '서술형').length;

      fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf-8');
      console.log(`  완료: ${result.questions.length}문제 (객관식 ${mcCount}, 서술형 ${essayCount})`);

      totalFiles++;
      totalQuestions += result.questions.length;
    }
  }

  console.log(`\n=== 생성 완료 ===`);
  console.log(`총 ${totalFiles}개 파일, ${totalQuestions}개 문제 생성`);
}

main();
