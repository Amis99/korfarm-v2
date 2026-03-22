/**
 * 소쉬르1~소쉬르3 (60개 챕터) 테스트 데이터 재작성 스크립트
 * 원고 JSON에서 주간_실력_확인 섹션을 추출하여 generated/pro-tests/ 에 개별 JSON으로 저장
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

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

const LEVEL_NAMES = {
  saussure1: '소쉬르1',
  saussure2: '소쉬르2',
  saussure3: '소쉬르3'
};

// ────── 유틸 함수들 ──────

function readJsonFile(fpath) {
  let raw = fs.readFileSync(fpath, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw);
}

/** 원고 JSON에서 주간_실력_확인 섹션을 찾아 반환 (중첩 구조 포함) */
function findTestSection(data) {
  if (data['주간_실력_확인']) return data['주간_실력_확인'];
  for (const key of Object.keys(data)) {
    if (typeof data[key] === 'object' && data[key] !== null && data[key]['주간_실력_확인']) {
      return data[key]['주간_실력_확인'];
    }
  }
  return null;
}

/** 선택지 텍스트에서 번호 접두사 (①, ②, ...) 제거 */
function cleanChoiceText(text) {
  return text.replace(/^[①②③④⑤]\s*/, '').trim();
}

/** 정답 값 (①, ②, ③, ④ 또는 숫자)에서 번호 추출 */
function extractAnswerNumber(answer) {
  const map = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5' };
  const s = String(answer).trim();
  if (map[s]) return map[s];
  const m = s.match(/(\d)/);
  return m ? m[1] : s;
}

/** 해설에서 정답 번호를 역추출 */
function inferAnswerFromExplanation(explanation, choices, stem) {
  if (!explanation || !choices || choices.length === 0) return null;

  const circleMap = { '①': '1', '②': '2', '③': '3', '④': '4' };
  const circleToIdx = { '①': 0, '②': 1, '③': 2, '④': 3 };
  const isNegative = /아닌|아니라|않은|다른|다름/.test(stem);

  // 패턴 0: 해설에 '~은/는 ~입니다' 형태로 작은따옴표 안의 단어 언급 → 선택지 매칭
  const quotedMatch = explanation.match(/['']([^'']+)[''].*입니다/);
  if (quotedMatch) {
    const keyword = quotedMatch[1];
    for (let i = 0; i < choices.length; i++) {
      const ct = typeof choices[i] === 'string' ? cleanChoiceText(choices[i]) : choices[i].text || '';
      if (ct === keyword || ct.includes(keyword)) {
        return String(i + 1);
      }
    }
  }

  // 패턴 0b: "~번은 ~" 형태에서 '사실'이 아닌 것을 묻는 문제 → 해당 번호 추출
  // 예: "①, ②, ④번은 ~이지만, ③번은 ~의견입니다" → ③ 정답
  const butPattern = explanation.match(/([①②③④])[번]?은\s/g);
  if (butPattern && butPattern.length >= 1 && isNegative) {
    // 마지막 "X번은" 패턴이 정답일 가능성 높음 (대비되는 대상)
    const lastCircle = butPattern[butPattern.length - 1].match(/[①②③④]/)?.[0];
    if (lastCircle && circleMap[lastCircle]) {
      return circleMap[lastCircle];
    }
  }

  // 패턴 0c: 해설에서 따옴표로 감싼 텍스트가 특정 선택지의 핵심 구와 매칭
  const doubleQuoted = [...explanation.matchAll(/[""]([^""]+)[""]|"([^"]+)"/g)].map(m => m[1] || m[2]);
  if (doubleQuoted.length > 0 && !isNegative) {
    for (const quoted of doubleQuoted) {
      if (!quoted || quoted.length < 3) continue;
      for (let i = 0; i < choices.length; i++) {
        const ct = typeof choices[i] === 'string' ? cleanChoiceText(choices[i]) : choices[i].text || '';
        const cleanCt = ct.replace(/^[""\u201C\u201D]|[""\u201C\u201D]$/g, '').trim();
        // 짧은 공통 부분(5~7자)으로 매칭
        const matchLen = Math.min(7, quoted.length, cleanCt.length);
        if (matchLen >= 4 && (cleanCt.includes(quoted.substring(0, matchLen)) || quoted.includes(cleanCt.substring(0, matchLen)))) {
          return String(i + 1);
        }
      }
    }
  }

  // 패턴 1: "①, ②, ④번은 ~이지만, ③번은 ~" 형태 → 나머지가 아닌 것이 정답
  if (isNegative) {
    // "③번은 ~" 형태에서 해당 번호가 다른/의견/잘못 등으로 설명되면 정답
    for (const [circle, id] of Object.entries(circleMap)) {
      const patterns = [
        new RegExp(`${circle}[번]?은\\s`),
        new RegExp(`${circle}[번]?이\\s`)
      ];
      for (const pat of patterns) {
        if (pat.test(explanation)) {
          const idx = explanation.indexOf(circle);
          const afterText = explanation.substring(idx, idx + 80);
          if (/다르|틀|아니|잘못|거짓|의견|내용과 다|부끄러|사실과|글의 내용과/.test(afterText)) {
            return id;
          }
        }
      }
    }

    // 해설에서 "~라는 내용은 ~과 다릅니다" → 해당 선택지가 정답
    for (let i = 0; i < choices.length; i++) {
      const ct = typeof choices[i] === 'string' ? cleanChoiceText(choices[i]) : choices[i].text || '';
      // 선택지의 핵심 키워드가 해설에서 부정 문맥으로 등장
      const keywords = ct.split(/\s+/).filter(w => w.length >= 4).slice(0, 3);
      let negativeHit = false;
      for (const kw of keywords) {
        if (explanation.includes(kw) && /다릅니다|틀|아닙니다|잘못|사실과 다|내용과 다/.test(explanation)) {
          negativeHit = true;
          break;
        }
      }
      if (negativeHit) return String(i + 1);
    }
  }

  // 패턴 2: 해설에 "~은/는" 으로 인용된 선택지 텍스트 직접 매칭
  for (let i = 0; i < choices.length; i++) {
    const ct = typeof choices[i] === 'string' ? cleanChoiceText(choices[i]) : choices[i].text || '';
    // 따옴표로 감싼 텍스트가 선택지와 매칭
    const quoted = ct.replace(/^[""]|[""]$/g, '').trim();
    if (quoted.length > 5 && explanation.includes(quoted.substring(0, 15))) {
      // 부정 문맥이 아닌지 확인
      if (!isNegative || /다릅니다|틀|아닙니다/.test(explanation)) {
        return String(i + 1);
      }
    }
  }

  // 패턴 3: 해설의 핵심 키워드가 선택지와 매칭 (가중치 기반)
  const explWords = explanation
    .replace(/[.,!?()（）""'']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2);

  let bestMatch = -1;
  let bestScore = 0;
  for (let i = 0; i < choices.length; i++) {
    const ct = typeof choices[i] === 'string' ? cleanChoiceText(choices[i]) : choices[i].text || '';
    let score = 0;
    for (const word of explWords) {
      if (word.length >= 3 && ct.includes(word)) score += 2;
      else if (word.length >= 2 && ct.includes(word)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = i;
    }
  }
  if (bestMatch >= 0 && bestScore >= 3) {
    return String(bestMatch + 1);
  }

  return null;
}

/** 지문 맵에서 특정 문제 번호에 해당하는 지문 찾기 */
function findPassage(passageMap, num) {
  for (const [pNum, pData] of Object.entries(passageMap)) {
    const directive = pData['지침'] || '';
    const rangeMatch = directive.match(/\[(\d+)~(\d+)\]/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      if (parseInt(num) >= start && parseInt(num) <= end) {
        return pData['지문'] || null;
      }
    } else if (parseInt(pNum) === parseInt(num)) {
      return pData['지문'] || null;
    }
  }
  return null;
}

/** 문제 내용에 따라 적절한 domain을 결정하는 휴리스틱 */
function assignDomain(stem, passage, choices, questionIndex) {
  const choiceText = (choices || []).map(c => typeof c === 'object' ? (c.text || '') : c).join(' ');
  const text = (stem || '') + ' ' + (passage || '') + ' ' + choiceText;

  // 키워드 기반 domain 매핑 (우선순위 높은 것부터)
  if (/어법|문법|맞춤법|띄어쓰기|높임|존대|주어|서술어|목적어|부사|형용사|동사|조사|접미사|접두사|품사|호응|맞추다|맞히다|낫다|났다/.test(text)) return '어법·문법 능력';
  if (/어휘|뜻|의미|낱말|단어|사전|빈칸.*알맞은 말|빈칸.*낱말/.test(stem || '')) return '어휘력';
  if (/구조|문단|짜임|전개|순서|흐름|개요|글의 종류|갈래|중심 문장|뒷받침/.test(text)) return '구조 독해력';
  if (/까닭|이유|왜|원인|결과|추론|논리|근거|주장|반박|비웃|도전|태도/.test(text)) return '논리 사고력';
  if (/개념|정의|용어|~이란|비유|상징|운율|성찰|자아|사실.*의견/.test(text)) return '국어 개념 적용 능력';
  if (/속담|관용|고사성어|사자성어|격언|한자/.test(text)) return '국어 관련 배경지식';
  if (/과학|역사|사회|경제|기술|동물|식물|자연|환경|실험|감각|신체|건강|에너지|우주|지구/.test(text)) return '비문학 배경지식';
  if (/내용.*맞|내용.*틀|알 수 있|알 수 없|글.*내용|읽고.*물음|다음 글/.test(text)) return '문장 독해력';
  if (/문제.*분석|전략|풀이|접근|핵심|주제/.test(text)) return '문제 분석 및 전략 수립 능력';
  if (/선택지|보기.*분석|오답|소거|함정/.test(text)) return '선택지 분석 및 전략 수립 능력';

  // 지문 기반 추가 판별
  if (passage) {
    if (/동물|식물|과학|실험|자연|환경|역사|사회|경제|기술/.test(passage)) return '비문학 배경지식';
    if (/시\n|동시|노래|감정|마음|느낌|거울|사랑/.test(passage)) return '문장 독해력';
  }

  // 기본 배분
  return DOMAINS[questionIndex % DOMAINS.length];
}

/** 서술형/빈칸형 문제의 domain을 결정 */
function assignEssayDomain(stem, passage) {
  const text = (stem || '') + ' ' + (passage || '');
  if (/주어|서술어|문법|어법|호응|높임|맞춤법/.test(text)) return '어법·문법 능력';
  if (/까닭|이유|왜|근거|생각.*서술|의견/.test(text)) return '논리 사고력';
  if (/중심.*문장|구조|전개|짜임|요약/.test(text)) return '구조 독해력';
  if (/어휘|뜻|의미|낱말|빈칸/.test(text)) return '어휘력';
  if (/내용.*바탕|글.*내용|찾아 쓰/.test(text)) return '문장 독해력';
  if (/개념|정의|설명/.test(text)) return '국어 개념 적용 능력';
  return '논리 사고력';
}

/** 오답 해설 생성 — 문맥 인지, 레벨별 난이도 차별화 */
function generateChoiceExplanations(correctAnswerId, choices, explanation, stem, levelId) {
  const explanations = {};
  const correctChoice = choices.find(c => c.id === correctAnswerId);
  const correctText = correctChoice ? correctChoice.text : '';
  const isNegative = /아닌|않은|다른|어색한/.test(stem);

  for (const choice of choices) {
    if (choice.id === correctAnswerId) {
      explanations[choice.id] = `정답 해설: ${explanation}`;
    } else {
      const wrongText = choice.text;
      let wrongExpl;

      if (levelId === 'saussure1') {
        wrongExpl = genWrongEasy(wrongText, correctText, explanation, stem, isNegative);
      } else if (levelId === 'saussure2') {
        wrongExpl = genWrongMid(wrongText, correctText, explanation, stem, isNegative);
      } else {
        wrongExpl = genWrongAdv(wrongText, correctText, explanation, stem, isNegative);
      }
      explanations[choice.id] = `오답 조언: ${wrongExpl}`;
    }
  }
  return explanations;
}

function genWrongEasy(wrongText, correctText, explanation, stem, isNeg) {
  if (isNeg) {
    return `'${wrongText}'은(는) 문제에서 말하는 내용에 맞아요. 이 문제는 맞지 '않는' 것을 찾는 거예요. 다시 읽어 보세요.`;
  }
  if (/뜻|의미|낱말/.test(stem)) {
    return `'${wrongText}'은(는) 이 문제에서 묻는 뜻과 달라요. 정답은 '${correctText}'이에요.`;
  }
  if (/감각|신체|눈|코|귀|입|손|발/.test(stem + wrongText)) {
    return `'${wrongText}'은(는) 다른 역할을 해요. 정답은 '${correctText}'이에요. 각 감각 기관이 하는 일을 떠올려 보세요.`;
  }
  if (/이유|까닭|왜/.test(stem)) {
    return `'${wrongText}'은(는) 글에 나온 이유와 달라요. 글을 다시 읽고 정답을 찾아보세요.`;
  }
  return `이 보기는 정답이 아니에요. 정답은 '${correctText}'이에요. 왜 그런지 글을 다시 읽어 보세요.`;
}

function genWrongMid(wrongText, correctText, explanation, stem, isNeg) {
  if (isNeg) {
    return `'${wrongText}'은(는) 문제의 조건에 해당하는 내용이에요. 이 문제는 해당하지 '않는' 것을 골라야 합니다.`;
  }
  if (/뜻|의미|낱말|단어/.test(stem)) {
    return `'${wrongText}'은(는) 이 문제에서 묻는 뜻과 다릅니다. 정답인 '${correctText}'의 뜻을 다시 확인해 보세요.`;
  }
  if (/태도|방법/.test(stem)) {
    return `'${wrongText}'은(는) 올바른 태도가 아닙니다. 글에서 알려주는 바른 태도를 찾아보세요.`;
  }
  if (/이유|까닭|왜/.test(stem)) {
    return `'${wrongText}'은(는) 글에서 말하는 이유가 아닙니다. 글의 내용을 다시 확인해 보세요.`;
  }
  if (/생각|주제|교훈/.test(stem)) {
    return `'${wrongText}'은(는) 글의 주제와 거리가 있습니다. 글 전체의 내용을 생각하며 정답을 골라 보세요.`;
  }
  return `이 보기는 정답이 아닙니다. 정답은 '${correctText}'인데, 그 이유를 글에서 찾아보세요.`;
}

function genWrongAdv(wrongText, correctText, explanation, stem, isNeg) {
  if (isNeg) {
    return `'${wrongText}'은(는) 지문에서 확인할 수 있는 내용입니다. 이 문제는 해당하지 '않는' 것을 고르는 것이니, 각 선택지를 지문과 하나씩 대조해 보세요.`;
  }
  if (/의미|개념|정의/.test(stem)) {
    return `'${wrongText}'은(는) 이 문제에서 묻는 개념의 정확한 정의와 다릅니다. 핵심 개념을 다시 정리해 보세요.`;
  }
  if (/상징|비유/.test(stem)) {
    return `'${wrongText}'은(는) 이 작품에서 의도한 상징적 의미와 거리가 있습니다. 작품의 전체적인 맥락을 고려해 보세요.`;
  }
  if (/중심 문장|뒷받침|구조/.test(stem)) {
    return `이 선택지는 글의 구조 파악이 정확하지 않습니다. 중심 문장과 뒷받침 문장의 관계를 다시 생각해 보세요.`;
  }
  if (/이유|까닭|태도/.test(stem)) {
    return `'${wrongText}'은(는) 지문의 내용과 맞지 않습니다. 글의 핵심 내용을 근거로 다시 판단해 보세요.`;
  }
  if (/주제|교훈|글쓴이.*생각/.test(stem)) {
    return `'${wrongText}'은(는) 글의 핵심 주제와 거리가 있습니다. 글 전체를 아우르는 중심 내용이 무엇인지 생각해 보세요.`;
  }
  return `'${wrongText}'은(는) 정답이 아닙니다. 정답인 '${correctText}'이(가) 왜 맞는지 지문의 근거를 찾아 확인해 보세요.`;
}

/** 서술형 모범 답안에서 키워드 추출 */
function extractEssayKeywords(modelAnswer) {
  if (!modelAnswer) return [];
  const stopwords = /^(또한|그래서|따라서|그리고|하지만|그런데|예시|왜냐하면|때문에|입니다|합니다|것입니다|있습니다|없습니다|이다|하다|된다|한다|있다|없다|이에요|해요|돼요|거예요|이며|이고|으로|에서|부터|까지|이는|것은|것이|라는|라고|보다|같이|처럼|에게|에서|있으며|하며|아닌|위해|통해)$/;
  const words = modelAnswer
    .replace(/[()（）""''\[\].,!?~·:;\/\-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopwords.test(w));
  const unique = [...new Set(words)];
  return unique.slice(0, 5).map(kw => ({ keyword: kw, weight: 5 }));
}

/** 서술형 채점 기준 생성 */
function generateRubric(stem, modelAnswer, levelId) {
  const diff = levelId === 'saussure1' ? '쉬운 말로' : (levelId === 'saussure2' ? '적절한 수준으로' : '정확하게');
  return `핵심 내용을 ${diff} 포함하여 답변했는지 확인합니다. 모범 답안의 핵심 키워드가 포함되어 있으면 높은 점수를 부여합니다.`;
}

/** 10개 역량이 최대한 고루 배분되도록 조정 */
function ensureDomainCoverage(questions) {
  const usedDomains = new Set(questions.map(q => q.domain));
  const missingDomains = DOMAINS.filter(d => !usedDomains.has(d));
  if (missingDomains.length === 0) return;

  const domainCount = {};
  questions.forEach(q => {
    domainCount[q.domain] = (domainCount[q.domain] || 0) + 1;
  });

  for (const missingDomain of missingDomains) {
    let maxCount = 0;
    let targetIdx = -1;
    for (let i = 0; i < questions.length; i++) {
      const d = questions[i].domain;
      if (domainCount[d] > 1 && domainCount[d] > maxCount) {
        maxCount = domainCount[d];
        targetIdx = i;
      }
    }
    if (targetIdx >= 0) {
      const oldDomain = questions[targetIdx].domain;
      domainCount[oldDomain]--;
      questions[targetIdx].domain = missingDomain;
      domainCount[missingDomain] = 1;
    }
  }
}

// ────── 메인 로직 ──────

function processChapter(levelId, chapterNum) {
  const koreanName = LEVEL_NAMES[levelId];
  const manuscriptPath = path.join(ROOT, '프로모드 원고', koreanName, `${koreanName} (챕터${chapterNum}).json`);

  const data = readJsonFile(manuscriptPath);
  const testSection = findTestSection(data);

  if (!testSection) {
    console.error(`경고: ${levelId} ch${chapterNum}에 주간_실력_확인 섹션이 없습니다.`);
    return null;
  }

  const questions = [];
  let questionCounter = 0;

  const passageMap = testSection['실력_확인_문제_지문'] || {};
  const bogiMap = testSection['실력_확인_객관식_보기'] || {};

  // ── 1. 객관식 처리 ──
  const objQuestions = testSection['실력_확인_객관식_문제'] || [];
  const objChoices = testSection['실력_확인_객관식_선택지'] || {};
  const objAnswers = testSection['실력_확인_객관식_정답'] || {};
  const objExplanations = testSection['실력_확인_객관식_해설'] || {};

  for (const q of objQuestions) {
    const num = String(q['번호']);
    const stem = q['문제'];
    const choices = objChoices[num] || [];
    let correctRaw = objAnswers[num];
    const explanation = objExplanations[num] || '';

    // 정답이 없으면 해설에서 역추출 시도
    if (!correctRaw && explanation) {
      const inferred = inferAnswerFromExplanation(explanation, choices, stem);
      if (inferred) {
        correctRaw = inferred;
        // console.log(`    → 해설에서 정답 추론: 문제${num} = ${inferred}번`);
      }
    }

    if (!correctRaw) {
      console.warn(`  경고: ${levelId} ch${chapterNum} 문제${num} 정답 없음, 스킵`);
      continue;
    }

    const correctId = extractAnswerNumber(correctRaw);

    const parsedChoices = choices.map((c, i) => ({
      id: String(i + 1),
      text: cleanChoiceText(typeof c === 'string' ? c : c.text || c['선택지'] || '')
    }));

    const passage = findPassage(passageMap, num);

    const bogi = bogiMap[num];
    let fullStem = stem;
    if (bogi) {
      fullStem = `${stem}\n\n<보기>\n${bogi}`;
    }

    const domain = assignDomain(fullStem, passage, parsedChoices, questionCounter);
    const choiceExplanations = generateChoiceExplanations(correctId, parsedChoices, explanation, fullStem, levelId);

    questions.push({
      number: parseInt(num),
      type: '객관식',
      domain,
      points: 3,
      stem: fullStem,
      passage,
      correctAnswer: correctId,
      choices: parsedChoices,
      choiceExplanations
    });
    questionCounter++;
  }

  // ── 2. OX 문제 처리 (객관식 O/X로 변환) ──
  const oxQuestions = testSection['실력_확인_OX_문제'] || [];
  const oxBogi = testSection['실력_확인_OX_보기'] || {};
  const oxAnswers = testSection['실력_확인_OX_정답'] || {};
  const oxExplanations = testSection['실력_확인_OX_해설'] || {};

  for (const q of oxQuestions) {
    const num = String(q['번호']);
    const stem = q['문제'];
    const bogi = oxBogi[num] || '';
    const correctRaw = String(oxAnswers[num] || '').replace(/[()（）\s]/g, '');
    const explanation = oxExplanations[num] || '';

    if (!correctRaw) continue;

    const correctId = correctRaw === 'O' ? '1' : '2';
    let fullStem = stem;
    if (bogi) {
      fullStem = `${stem}\n\n${bogi}`;
    }

    const passage = findPassage(passageMap, num);

    const parsedChoices = [
      { id: '1', text: 'O (맞다)' },
      { id: '2', text: 'X (틀리다)' }
    ];

    const choiceExplanations = {};
    if (correctId === '1') {
      choiceExplanations['1'] = `정답 해설: ${explanation || '이 문장은 옳은 내용입니다.'}`;
      choiceExplanations['2'] = `오답 조언: 이 문장은 옳은 내용이에요. 글의 내용을 다시 확인해 보세요.`;
    } else {
      choiceExplanations['1'] = `오답 조언: 이 문장은 옳지 않은 내용이에요. 글을 다시 읽고 어디가 다른지 찾아보세요.`;
      choiceExplanations['2'] = `정답 해설: ${explanation || '이 문장은 옳지 않은 내용입니다.'}`;
    }

    questions.push({
      number: parseInt(num),
      type: '객관식',
      domain: assignDomain(fullStem, passage, parsedChoices, questionCounter),
      points: 3,
      stem: fullStem,
      passage,
      correctAnswer: correctId,
      choices: parsedChoices,
      choiceExplanations
    });
    questionCounter++;
  }

  // ── 3. 서술형 처리 ──
  const essayQuestions = testSection['실력_확인_서술형_문제'] || [];
  const essayBogi = testSection['실력_확인_서술형_보기'] || {};
  const essayAnswers = testSection['실력_확인_서술형_모범_답안'] || testSection['실력_확인_서술형_정답'] || {};

  for (const q of essayQuestions) {
    const num = String(q['번호']);
    const stem = q['문제'];
    const bogi = essayBogi[num];
    const modelAnswer = essayAnswers[num] || '';

    let fullStem = stem;
    if (bogi) {
      fullStem = `${stem}\n\n<보기>\n${bogi}`;
    }

    const passage = findPassage(passageMap, num);
    const domain = assignEssayDomain(fullStem, passage);
    const essayKeywords = extractEssayKeywords(modelAnswer);
    const essayRubric = generateRubric(fullStem, modelAnswer, levelId);

    questions.push({
      number: parseInt(num),
      type: '서술형',
      domain,
      points: 8,
      stem: fullStem,
      passage,
      correctAnswer: null,
      choiceExplanations: {},
      modelAnswer,
      essayKeywords,
      essayRubric
    });
  }

  // ── 4. 빈칸형 처리 (서술형으로 변환) ──
  const fillQuestions = testSection['실력_확인_빈칸형_문제'] || [];
  const fillBogi = testSection['실력_확인_빈칸형_보기'] || {};
  const fillAnswers = testSection['실력_확인_빈칸형_정답'] || {};

  for (const q of fillQuestions) {
    const num = String(q['번호']);
    const stem = q['문제'];
    const bogi = fillBogi[num];
    const modelAnswer = fillAnswers[num] || '';

    let fullStem = stem;
    if (bogi) {
      fullStem = `${stem}\n\n<보기>\n${bogi}`;
    }

    const passage = findPassage(passageMap, num);
    const domain = assignEssayDomain(fullStem, passage);
    const essayKeywords = extractEssayKeywords(modelAnswer);

    questions.push({
      number: parseInt(num),
      type: '서술형',
      domain,
      points: 5,
      stem: fullStem,
      passage,
      correctAnswer: null,
      choiceExplanations: {},
      modelAnswer,
      essayKeywords,
      essayRubric: '빈칸에 들어갈 정확한 내용을 작성했는지 확인합니다.'
    });
  }

  // ── 5. 괄호_선택형 처리 (서술형으로 변환) ──
  const bracketQuestions = testSection['실력_확인_괄호_선택형_문제'] || [];
  const bracketBogi = testSection['실력_확인_괄호_선택형_보기'] || {};
  const bracketAnswers = testSection['실력_확인_괄호_선택형_정답'] || {};
  const bracketExpl = testSection['실력_확인_괄호_선택형_해설'] || {};

  for (const q of bracketQuestions) {
    const num = String(q['번호']);
    const stem = q['문제'];
    const bogi = bracketBogi[num];
    const modelAnswer = bracketAnswers[num] || '';
    const expl = bracketExpl[num] || '';

    let fullStem = stem;
    if (bogi) {
      fullStem = `${stem}\n\n<보기>\n${bogi}`;
    }

    const passage = findPassage(passageMap, num);
    const domain = assignEssayDomain(fullStem, passage);
    const essayKeywords = extractEssayKeywords(modelAnswer);

    questions.push({
      number: parseInt(num),
      type: '서술형',
      domain,
      points: 5,
      stem: fullStem,
      passage,
      correctAnswer: null,
      choiceExplanations: {},
      modelAnswer,
      essayKeywords,
      essayRubric: expl || '괄호 안에 들어갈 올바른 표현을 선택했는지 확인합니다.'
    });
  }

  // 번호순 정렬
  questions.sort((a, b) => a.number - b.number);

  // domain 재배정: 10개 역량이 최대한 고루 배분
  ensureDomainCoverage(questions);

  return { questions };
}

// ────── 실행 ──────

function main() {
  const outDir = path.join(ROOT, 'generated', 'pro-tests');
  fs.mkdirSync(outDir, { recursive: true });

  let totalFiles = 0;
  let totalQuestions = 0;
  const issues = [];

  for (const levelId of ['saussure1', 'saussure2', 'saussure3']) {
    for (let ch = 1; ch <= 20; ch++) {
      const chStr = String(ch).padStart(2, '0');
      const outFile = path.join(outDir, `${levelId}_ch${chStr}.json`);

      try {
        const result = processChapter(levelId, ch);
        if (result) {
          fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');
          totalFiles++;
          totalQuestions += result.questions.length;

          const qCount = result.questions.length;
          const mark = qCount >= 10 ? '✓' : '⚠';
          console.log(`${mark} ${levelId}_ch${chStr}.json — ${qCount}문제`);
          if (qCount < 10) {
            issues.push(`${levelId}_ch${chStr}: ${qCount}문제 (10 미만)`);
          }
        }
      } catch (err) {
        console.error(`✗ ${levelId}_ch${chStr}: ${err.message}`);
        issues.push(`${levelId}_ch${chStr}: 오류 - ${err.message}`);
      }
    }
  }

  console.log(`\n완료: ${totalFiles}개 파일, 총 ${totalQuestions}문제 생성`);
  if (issues.length > 0) {
    console.log(`\n주의사항 (${issues.length}건):`);
    issues.forEach(i => console.log(`  - ${i}`));
  }
}

main();
