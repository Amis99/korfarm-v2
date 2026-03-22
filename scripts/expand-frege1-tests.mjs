/**
 * 프레게1 테스트 데이터 확장 스크립트
 * - 기존 15문제 → 20문제로 확장
 * - domain 태그 추가 (10대 역량)
 * - 전체 선택지에 해설 추가
 * - 5문제 추가 (원고 섹션별)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

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

// 선택지 번호(①②③④) → id("1","2","3","4") 변환
function circledToId(s) {
  if (!s) return null;
  const map = { '①': '1', '②': '2', '③': '3', '④': '4' };
  const trimmed = s.toString().trim();
  if (map[trimmed]) return map[trimmed];
  // "② 분류" 형식
  for (const [k, v] of Object.entries(map)) {
    if (trimmed.startsWith(k)) return v;
  }
  return trimmed;
}

// 선택지 텍스트에서 번호 접두사 제거
function stripChoicePrefix(text) {
  return text.replace(/^[①②③④]\s*/, '').trim();
}

// BOM 제거 후 JSON 파싱
function readJsonFile(filePath) {
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw);
}

// 기존 문제에 domain 할당 (문제 특성 기반)
function assignDomain(question, index, totalExisting) {
  // 기존 15문제에 10개 역량을 2개씩 배분 (일부 역량은 1개)
  // 추가 5문제에서 나머지 채움
  const stemLower = (question.stem || '').toLowerCase();
  const stem = question.stem || '';

  // 어휘 문제 판별
  if (stem.includes('뜻으로') || stem.includes('빈칸에 들어갈') || stem.includes('낱말') ||
      stem.includes('반의어') || stem.includes('의미') || stem.includes('어휘')) {
    return '어휘력';
  }
  // 문법/어법 문제
  if (stem.includes('주어') || stem.includes('서술어') || stem.includes('쓰임이 바른') ||
      stem.includes('맞춤법') || stem.includes('띄어쓰기') || stem.includes('어법') ||
      stem.includes('문법') || stem.includes('가르치') || stem.includes('틀려') ||
      stem.includes('달라') || stem.includes('잊어') || stem.includes('잃어')) {
    return '어법·문법 능력';
  }
  // 구조 독해 문제
  if (stem.includes('중심 내용') || stem.includes('중심 문장') || stem.includes('중심 생각') ||
      stem.includes('뒷받침') || stem.includes('문단') || stem.includes('구조') ||
      stem.includes('글의 구성') || stem.includes('문단의 역할')) {
    return '구조 독해력';
  }
  // 문장 독해 문제
  if (stem.includes('이유는') || stem.includes('느낀 점') || stem.includes('무엇인가') ||
      stem.includes('사실') || stem.includes('내용 파악') || stem.includes('알맞은 것은')) {
    return '문장 독해력';
  }
  // 논리 사고
  if (stem.includes('적절한') || stem.includes('예시') || stem.includes('관계') ||
      stem.includes('알맞지') || stem.includes('않은') || stem.includes('추론')) {
    return '논리 사고력';
  }
  // 국어 개념
  if (stem.includes('범주화') || stem.includes('시각화') || stem.includes('우선순위') ||
      stem.includes('개념') || stem.includes('정의')) {
    return '국어 개념 적용 능력';
  }

  // 서술형은 다양한 역량으로 분배
  if (question.type === '서술형') {
    const essayDomains = ['논리 사고력', '문장 독해력', '국어 개념 적용 능력', '어휘력'];
    return essayDomains[index % essayDomains.length];
  }

  // 기본 할당 (인덱스 기반 순환)
  return DOMAINS[index % DOMAINS.length];
}

// 기존 문제의 choiceExplanations를 전체 선택지로 확장
function expandChoiceExplanations(question) {
  if (question.type !== '객관식' || !question.choices) return question;

  const existing = question.choiceExplanations || {};
  const correctId = question.correctAnswer;
  const newExplanations = {};

  for (const choice of question.choices) {
    if (existing[choice.id]) {
      // 기존 해설 유지, 정답이면 "정답 해설:" 접두사 확인
      let expl = existing[choice.id];
      if (choice.id === correctId && !expl.startsWith('정답 해설:')) {
        expl = '정답 해설: ' + expl;
      } else if (choice.id !== correctId && !expl.startsWith('오답 조언:')) {
        expl = '오답 조언: ' + expl;
      }
      newExplanations[choice.id] = expl;
    } else if (choice.id === correctId) {
      newExplanations[choice.id] = `정답 해설: '${choice.text}'이(가) 정답입니다.`;
    } else {
      // 오답 해설 생성
      newExplanations[choice.id] = generateWrongExplanation(question, choice);
    }
  }

  question.choiceExplanations = newExplanations;
  return question;
}

// 오답 해설 자동 생성
function generateWrongExplanation(question, wrongChoice) {
  const correctId = question.correctAnswer;
  const correctChoice = question.choices.find(c => c.id === correctId);
  const correctText = correctChoice ? correctChoice.text : '';

  return `오답 조언: '${wrongChoice.text}'은(는) 이 문제의 정답이 아닙니다. 정답은 '${correctText}'입니다.`;
}

// 원고에서 추가 문제 5개 생성
function generateAdditionalQuestions(manuscript, existingQuestions, chapterNum) {
  const additionalQuestions = [];
  let nextNumber = existingQuestions.length + 1;

  // 기존 문제에서 이미 사용된 domain 카운트
  const domainCount = {};
  DOMAINS.forEach(d => domainCount[d] = 0);
  existingQuestions.forEach(q => {
    if (domainCount[q.domain] !== undefined) {
      domainCount[q.domain]++;
    }
  });

  // 부족한 역량 파악 (2개 미만인 역량)
  const neededDomains = DOMAINS.filter(d => domainCount[d] < 2)
    .sort((a, b) => domainCount[a] - domainCount[b]);

  // 1. 어휘 섹션에서 객관식 1문제
  const vocabQ = generateVocabQuestion(manuscript, nextNumber, neededDomains, domainCount);
  if (vocabQ) {
    additionalQuestions.push(vocabQ);
    domainCount[vocabQ.domain]++;
    nextNumber++;
  }

  // 2. 비문학 섹션에서 객관식 1문제
  const nonFicQ = generateNonFictionQuestion(manuscript, nextNumber, neededDomains, domainCount);
  if (nonFicQ) {
    additionalQuestions.push(nonFicQ);
    domainCount[nonFicQ.domain]++;
    nextNumber++;
  }

  // 3. 문법 섹션에서 객관식 1문제
  const grammarQ = generateGrammarQuestion(manuscript, nextNumber, neededDomains, domainCount);
  if (grammarQ) {
    additionalQuestions.push(grammarQ);
    domainCount[grammarQ.domain]++;
    nextNumber++;
  }

  // 4. 문학 섹션에서 서술형 1문제
  const litEssayQ = generateLiteratureEssay(manuscript, nextNumber, neededDomains, domainCount);
  if (litEssayQ) {
    additionalQuestions.push(litEssayQ);
    domainCount[litEssayQ.domain]++;
    nextNumber++;
  }

  // 5. 개념 섹션에서 서술형 1문제
  const conceptEssayQ = generateConceptEssay(manuscript, nextNumber, neededDomains, domainCount);
  if (conceptEssayQ) {
    additionalQuestions.push(conceptEssayQ);
    domainCount[conceptEssayQ.domain]++;
    nextNumber++;
  }

  // 부족한 만큼 채우기 (5개 미만이면 추가 생성)
  while (additionalQuestions.length < 5) {
    const fallbackQ = generateFallbackQuestion(manuscript, nextNumber, neededDomains, domainCount, chapterNum, additionalQuestions.length);
    additionalQuestions.push(fallbackQ);
    domainCount[fallbackQ.domain]++;
    nextNumber++;
  }

  return additionalQuestions.slice(0, 5);
}

// 부족한 역량에서 다음 domain 선택
function pickDomain(neededDomains, domainCount) {
  // 2개 미만인 역량 중 가장 부족한 것
  const under2 = DOMAINS.filter(d => (domainCount[d] || 0) < 2);
  if (under2.length > 0) return under2[0];
  return DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
}

// 어휘 섹션에서 객관식 문제 생성
function generateVocabQuestion(ms, num, neededDomains, domainCount) {
  const vocab = ms['어휘'];
  if (!vocab) return null;

  const vocabList = vocab['어휘_목록'];
  if (!vocabList || vocabList.length < 4) return null;

  // 어휘 목록에서 문제 생성
  const targetIdx = num % vocabList.length;
  const target = vocabList[targetIdx];
  const otherVocabs = vocabList.filter((_, i) => i !== targetIdx);

  // 3개의 오답 선택
  const wrongChoices = [];
  const usedIndices = new Set();
  for (let i = 0; i < 3 && i < otherVocabs.length; i++) {
    let idx;
    do {
      idx = Math.floor(Math.random() * otherVocabs.length);
    } while (usedIndices.has(idx));
    usedIndices.add(idx);
    wrongChoices.push(otherVocabs[idx]);
  }

  // 정답 위치 무작위
  const correctPos = Math.floor(Math.random() * 4);
  const choices = [];
  let wrongIdx = 0;

  for (let i = 0; i < 4; i++) {
    if (i === correctPos) {
      choices.push({ id: String(i + 1), text: target['뜻'] });
    } else {
      if (wrongIdx < wrongChoices.length) {
        choices.push({ id: String(i + 1), text: wrongChoices[wrongIdx]['뜻'] });
        wrongIdx++;
      }
    }
  }

  const domain = pickDomain(neededDomains, domainCount);
  const explanations = {};
  for (const c of choices) {
    if (c.id === String(correctPos + 1)) {
      explanations[c.id] = `정답 해설: '${target['어휘']}'은(는) '${target['뜻']}'이라는 뜻입니다.`;
    } else {
      const matchVocab = vocabList.find(v => v['뜻'] === c.text);
      explanations[c.id] = `오답 조언: 이것은 '${matchVocab ? matchVocab['어휘'] : '다른 어휘'}'의 뜻입니다. '${target['어휘']}'의 뜻은 '${target['뜻']}'입니다.`;
    }
  }

  return {
    number: num,
    type: '객관식',
    domain: domain,
    points: 3,
    stem: `다음 중 '${target['어휘']}'의 뜻으로 알맞은 것은?`,
    passage: null,
    correctAnswer: String(correctPos + 1),
    choices: choices,
    choiceExplanations: explanations
  };
}

// 비문학 섹션에서 객관식 문제 생성
function generateNonFictionQuestion(ms, num, neededDomains, domainCount) {
  const nonFic = ms['비문학'];
  if (!nonFic) return null;

  const title = nonFic['비문학_제목'] || '';
  const passage = nonFic['비문학_지문'] || '';

  if (!passage) return null;

  // 지문의 핵심 내용 기반 문제 생성
  const domain = pickDomain(neededDomains, domainCount);

  // 지문의 마지막 문단 기반 추론 문제
  const paragraphs = passage.split('\n\n').filter(p => p.trim());
  const lastPara = paragraphs[paragraphs.length - 1] || '';

  // 활동2의 객관식 문제가 있으면 활용
  const act2 = nonFic['비문학_활동2'];
  if (act2 && act2['비문학_활동2_객관식_문제'] && act2['비문학_활동2_객관식_문제'].length > 0) {
    const qIdx = act2['비문학_활동2_객관식_문제'].length - 1;
    const qItem = act2['비문학_활동2_객관식_문제'][qIdx];
    const qNum = qItem['번호'];
    const choices_raw = act2['비문학_활동2_객관식_선택지'] && act2['비문학_활동2_객관식_선택지'][String(qNum)];
    const answer_raw = act2['비문학_활동2_객관식_정답'] && act2['비문학_활동2_객관식_정답'][String(qNum)];
    const explanation = act2['비문학_활동2_객관식_해설'] && act2['비문학_활동2_객관식_해설'][String(qNum)];

    if (choices_raw && answer_raw) {
      const correctId = circledToId(answer_raw);
      const choices = choices_raw.map((c, i) => ({
        id: String(i + 1),
        text: stripChoicePrefix(c)
      }));

      const explanations = {};
      for (const c of choices) {
        if (c.id === correctId) {
          explanations[c.id] = `정답 해설: ${explanation || '이 선택지가 정답입니다.'}`;
        } else {
          explanations[c.id] = `오답 조언: '${c.text}'은(는) 정답이 아닙니다. ${explanation ? '지문의 내용을 다시 확인해 보세요.' : ''}`;
        }
      }

      return {
        number: num,
        type: '객관식',
        domain: domain,
        points: 3,
        stem: qItem['문제'],
        passage: passage.length > 500 ? passage.substring(0, 500) + '...' : passage,
        correctAnswer: correctId,
        choices: choices,
        choiceExplanations: explanations
      };
    }
  }

  // 기본 fallback: 글의 목적 문제
  return {
    number: num,
    type: '객관식',
    domain: domain,
    points: 3,
    stem: `위 글 '${title}'의 글쓴이가 가장 전하고 싶은 내용은?`,
    passage: passage.length > 500 ? passage.substring(0, 500) + '...' : passage,
    correctAnswer: '1',
    choices: [
      { id: '1', text: '글의 주제를 이해하고 적용하는 것의 중요성' },
      { id: '2', text: '어려운 용어를 외우는 방법' },
      { id: '3', text: '시험에서 높은 점수를 받는 비결' },
      { id: '4', text: '친구와 함께 공부하는 방법' }
    ],
    choiceExplanations: {
      '1': '정답 해설: 글의 전체 내용을 종합하면 주제를 이해하고 실천하는 것을 강조하고 있습니다.',
      '2': '오답 조언: 이 글은 단순 암기가 아닌 이해와 적용을 강조합니다.',
      '3': '오답 조언: 시험 점수보다는 본질적인 이해를 다루고 있습니다.',
      '4': '오답 조언: 이 글에서는 함께 공부하는 방법을 직접적으로 다루지 않습니다.'
    }
  };
}

// 문법 섹션에서 객관식 문제 생성
function generateGrammarQuestion(ms, num, neededDomains, domainCount) {
  const grammar = ms['문법'];
  if (!grammar) return null;

  const domain = pickDomain(neededDomains, domainCount);

  // 어법 훈련 문제 활용
  const training = grammar['문법_어법_훈련_문제'];
  const answers = grammar['문법_어법_훈련_정답'];
  const explanations = grammar['문법_어법_훈련_해설'];

  if (training && training.length > 0 && answers) {
    const qItem = training[0];
    const qNum = String(qItem['번호']);
    const answer = answers[qNum];
    const expl = explanations && explanations[qNum];

    // 어법 문제를 객관식으로 변환
    const problemText = qItem['문제'];
    // "( A / B )" 패턴에서 선택지 추출
    const match = problemText.match(/\(\s*(.+?)\s*\/\s*(.+?)\s*\)/);
    if (match) {
      const optA = match[1].trim();
      const optB = match[2].trim();
      const correctOpt = answer;
      const wrongOpt = correctOpt === optA ? optB : optA;

      // 자연스러운 오답 선택지 생성
      const grammarDistractors = [
        '어울리지 않음', '해당 없음'
      ];

      return {
        number: num,
        type: '객관식',
        domain: domain,
        points: 3,
        stem: `다음 문장의 빈칸에 들어갈 알맞은 말은?`,
        passage: problemText.replace(/\(\s*.+?\s*\/\s*.+?\s*\)/, '(　　　)'),
        correctAnswer: '1',
        choices: [
          { id: '1', text: correctOpt },
          { id: '2', text: wrongOpt },
          { id: '3', text: `${correctOpt}고` },
          { id: '4', text: `${wrongOpt}서` }
        ],
        choiceExplanations: {
          '1': `정답 해설: ${expl || `이 문맥에서는 '${correctOpt}'이(가) 알맞습니다.`}`,
          '2': `오답 조언: '${wrongOpt}'은(는) 이 문맥에 맞지 않습니다. ${expl || ''}`,
          '3': `오답 조언: '${correctOpt}고'는 이 문장의 문맥에 어울리지 않습니다.`,
          '4': `오답 조언: '${wrongOpt}서'는 이 문장의 문맥에 어울리지 않습니다.`
        }
      };
    }
  }

  // 문법 개념 객관식 활용
  const conceptQ = grammar['문법_개념_객관식_문제'];
  const conceptChoices = grammar['문법_개념_객관식_선택지'];
  const conceptAnswers = grammar['문법_개념_객관식_정답'];
  const conceptExpl = grammar['문법_개념_객관식_해설'];
  const conceptHint = grammar['문법_개념_객관식_보기'];

  if (conceptQ && conceptQ.length > 0 && conceptChoices && conceptAnswers) {
    const qItem = conceptQ[conceptQ.length - 1];
    const qNum = String(qItem['번호']);
    const choices_raw = conceptChoices[qNum];
    const answer_raw = conceptAnswers[qNum];
    const expl = conceptExpl && conceptExpl[qNum];
    const hint = conceptHint && conceptHint[qNum];

    if (choices_raw && answer_raw) {
      const correctId = circledToId(answer_raw);
      const choices = choices_raw.map((c, i) => ({
        id: String(i + 1),
        text: stripChoicePrefix(c)
      }));

      const explanations = {};
      for (const c of choices) {
        if (c.id === correctId) {
          explanations[c.id] = `정답 해설: ${expl || '이 선택지가 정답입니다.'}`;
        } else {
          explanations[c.id] = `오답 조언: '${c.text}'은(는) 이 문제의 정답이 아닙니다.`;
        }
      }

      return {
        number: num,
        type: '객관식',
        domain: domain,
        points: 3,
        stem: qItem['문제'],
        passage: hint || null,
        correctAnswer: correctId,
        choices: choices,
        choiceExplanations: explanations
      };
    }
  }

  // fallback
  return null;
}

// 문학 섹션에서 서술형 생성
function generateLiteratureEssay(ms, num, neededDomains, domainCount) {
  const lit = ms['문학'];
  if (!lit) return null;

  const domain = pickDomain(neededDomains, domainCount);
  const title = lit['문학_작품명'] || '';
  const passage = lit['문학_작품_지문'] || '';

  // 활동2 서술형 활용
  const act2 = lit['문학_작품_활동2'];
  if (act2) {
    const essayQ = act2['문학_작품_활동2_서술형_문제'];
    const essayA = act2['문학_작품_활동2_서술형_정답'];
    if (essayQ && essayQ.length > 0 && essayA) {
      const qItem = essayQ[0];
      const answer = essayA[String(qItem['번호'])] || '';

      const keywords = answer.split(/[,、.，。\s]+/).filter(w => w.length >= 2).slice(0, 5);

      return {
        number: num,
        type: '서술형',
        domain: domain,
        points: 8,
        stem: `[${title}] ${qItem['문제']}`,
        passage: passage.length > 600 ? passage.substring(0, 600) + '...' : passage,
        correctAnswer: null,
        choiceExplanations: {},
        modelAnswer: answer,
        essayKeywords: keywords.map((kw, i) => ({ keyword: kw, weight: 5 - i })),
        essayRubric: `모범답안의 핵심 키워드(${keywords.join(', ')})가 포함되어야 합니다. ${num}번 문항은 8점 만점입니다.`
      };
    }
  }

  // 활동1 단답형 활용
  const act1 = lit['문학_작품_활동1'];
  if (act1) {
    const shortQ = act1['문학_작품_활동1_단답형_문제'];
    const shortA = act1['문학_작품_활동1_단답형_정답'];
    if (shortQ && shortQ.length > 0 && shortA) {
      const qItem = shortQ[0];
      const answer = shortA[String(qItem['번호'])] || '';
      const keywords = answer.split(/[,、.，。\s]+/).filter(w => w.length >= 2).slice(0, 5);

      return {
        number: num,
        type: '서술형',
        domain: domain,
        points: 8,
        stem: `[${title}] ${qItem['문제']}`,
        passage: passage.length > 600 ? passage.substring(0, 600) + '...' : passage,
        correctAnswer: null,
        choiceExplanations: {},
        modelAnswer: answer,
        essayKeywords: keywords.map((kw, i) => ({ keyword: kw, weight: 5 - i })),
        essayRubric: `모범답안의 핵심 키워드(${keywords.join(', ')})가 포함되어야 합니다. ${num}번 문항은 8점 만점입니다.`
      };
    }
  }

  // fallback
  return {
    number: num,
    type: '서술형',
    domain: domain,
    points: 8,
    stem: `'${title}'에서 주인공이 깨달은 점을 자신의 말로 정리하여 쓰세요.`,
    passage: passage.length > 600 ? passage.substring(0, 600) + '...' : passage,
    correctAnswer: null,
    choiceExplanations: {},
    modelAnswer: '주인공은 이야기를 통해 중요한 교훈을 깨달았습니다.',
    essayKeywords: [{ keyword: '깨달', weight: 5 }, { keyword: '교훈', weight: 4 }],
    essayRubric: `이야기의 핵심 교훈을 자신의 말로 정리했는지 평가합니다. ${num}번 문항은 8점 만점입니다.`
  };
}

// 개념 섹션에서 서술형 생성
function generateConceptEssay(ms, num, neededDomains, domainCount) {
  const concept = ms['개념'];
  if (!concept) return null;

  const domain = pickDomain(neededDomains, domainCount);
  const title = concept['개념_제목'] || '';
  const passage = concept['개념_지문'] || '';

  // OX 문제 해설을 활용하여 서술형 생성
  const oxQ = concept['개념_OX_문제'];
  const oxA = concept['개념_OX_정답'];
  const oxExpl = concept['개념_OX_해설'];

  if (oxQ && oxQ.length > 0 && oxExpl) {
    // 가장 깊이 있는 해설을 가진 문제 선택
    const bestIdx = oxQ.length - 1;
    const qItem = oxQ[bestIdx];
    const qNum = String(qItem['번호']);
    const expl = oxExpl[qNum] || '';
    const answer = oxA && oxA[qNum];

    return {
      number: num,
      type: '서술형',
      domain: domain,
      points: 8,
      stem: `다음 내용이 맞는지 틀린지 판단하고, 그 이유를 설명하세요.\n"${qItem['문제'].replace(/\s*\(.*?\)\s*$/, '')}"`,
      passage: passage.length > 500 ? passage.substring(0, 500) + '...' : passage,
      correctAnswer: null,
      choiceExplanations: {},
      modelAnswer: `${answer === 'O' ? '맞습니다.' : '틀립니다.'} ${expl}`,
      essayKeywords: expl.split(/[,、.，。\s]+/).filter(w => w.length >= 2).slice(0, 5).map((kw, i) => ({ keyword: kw, weight: 5 - i })),
      essayRubric: `맞는지 틀린지 정확히 판단하고, 그 이유를 논리적으로 설명했는지 평가합니다. ${num}번 문항은 8점 만점입니다.`
    };
  }

  return {
    number: num,
    type: '서술형',
    domain: domain,
    points: 8,
    stem: `'${title}'에 대해 배운 내용을 자신의 말로 요약하세요.`,
    passage: passage.length > 500 ? passage.substring(0, 500) + '...' : passage,
    correctAnswer: null,
    choiceExplanations: {},
    modelAnswer: `${title}에 대한 핵심 내용을 정리하면 다음과 같습니다.`,
    essayKeywords: [{ keyword: title.split(' ')[0], weight: 5 }],
    essayRubric: `핵심 개념을 정확히 이해하고 자신의 말로 요약했는지 평가합니다. ${num}번 문항은 8점 만점입니다.`
  };
}

// fallback 문제 생성
function generateFallbackQuestion(ms, num, neededDomains, domainCount, chapterNum, addedCount) {
  const domain = pickDomain(neededDomains, domainCount);

  // 어휘 빈칸 문제 변형
  const vocab = ms['어휘'];
  if (vocab && vocab['어휘_빈칸_문제'] && addedCount < 2) {
    const blanks = vocab['어휘_빈칸_문제'];
    const answers = vocab['어휘_빈칸_정답'];
    const vocabList = vocab['어휘_목록'] || [];

    if (blanks.length > 0 && answers) {
      const qItem = blanks[blanks.length - 1];
      const qNum = String(qItem['번호']);
      const answer = answers[qNum];

      if (answer) {
        // 오답 3개 생성
        const wrongWords = vocabList
          .map(v => v['어휘'].replace(/\(.*?\)/, '').trim())
          .filter(w => w !== answer)
          .slice(0, 3);

        while (wrongWords.length < 3) {
          wrongWords.push('해당 없음');
        }

        const correctPos = Math.floor(Math.random() * 4);
        const choices = [];
        let wIdx = 0;
        for (let i = 0; i < 4; i++) {
          if (i === correctPos) {
            choices.push({ id: String(i + 1), text: answer });
          } else {
            choices.push({ id: String(i + 1), text: wrongWords[wIdx] || '해당 없음' });
            wIdx++;
          }
        }

        const explanations = {};
        for (const c of choices) {
          if (c.id === String(correctPos + 1)) {
            explanations[c.id] = `정답 해설: 빈칸에 알맞은 어휘는 '${answer}'입니다.`;
          } else {
            explanations[c.id] = `오답 조언: '${c.text}'은(는) 이 문맥에 맞지 않습니다. 정답은 '${answer}'입니다.`;
          }
        }

        return {
          number: num,
          type: '객관식',
          domain: domain,
          points: 3,
          stem: `다음 빈칸에 들어갈 알맞은 어휘는?`,
          passage: qItem['문제'],
          correctAnswer: String(correctPos + 1),
          choices: choices,
          choiceExplanations: explanations
        };
      }
    }
  }

  // 비문학 활동1 객관식 활용
  const nonFic = ms['비문학'];
  if (nonFic && nonFic['비문학_활동1'] && addedCount < 3) {
    const act1 = nonFic['비문학_활동1'];
    const act1Q = act1['비문학_활동1_객관식_문제'];
    const act1Choices = act1['비문학_활동1_객관식_선택지'];
    const act1Answers = act1['비문학_활동1_객관식_정답'];
    const act1Expl = act1['비문학_활동1_객관식_해설'];

    if (act1Q && act1Q.length > 0 && act1Choices && act1Answers) {
      const qItem = act1Q[act1Q.length - 1];
      const qNum = String(qItem['번호']);
      const choices_raw = act1Choices[qNum];
      const answer_raw = act1Answers[qNum];
      const expl = act1Expl && act1Expl[qNum];

      if (choices_raw && answer_raw) {
        const correctId = circledToId(answer_raw);
        const choices = choices_raw.map((c, i) => ({
          id: String(i + 1),
          text: stripChoicePrefix(c)
        }));

        const explanations = {};
        for (const c of choices) {
          if (c.id === correctId) {
            explanations[c.id] = `정답 해설: ${expl || '정답입니다.'}`;
          } else {
            explanations[c.id] = `오답 조언: '${c.text}'은(는) 정답이 아닙니다.`;
          }
        }

        const passage = nonFic['비문학_지문'] || null;

        return {
          number: num,
          type: '객관식',
          domain: domain,
          points: 3,
          stem: qItem['문제'],
          passage: passage ? (passage.length > 500 ? passage.substring(0, 500) + '...' : passage) : null,
          correctAnswer: correctId,
          choices: choices,
          choiceExplanations: explanations
        };
      }
    }
  }

  // 서술형 fallback
  const concept = ms['개념'];
  const conceptTitle = concept ? concept['개념_제목'] || '' : `${chapterNum}장 핵심 개념`;

  return {
    number: num,
    type: '서술형',
    domain: domain,
    points: 8,
    stem: `이번 주에 배운 '${conceptTitle}'의 핵심 내용을 두 문장 이상으로 정리하세요.`,
    passage: null,
    correctAnswer: null,
    choiceExplanations: {},
    modelAnswer: `${conceptTitle}에서 가장 중요한 것은 핵심 원리를 이해하고 실생활에 적용하는 것입니다.`,
    essayKeywords: [
      { keyword: conceptTitle.split(' ')[0] || '핵심', weight: 5 },
      { keyword: '이해', weight: 4 },
      { keyword: '적용', weight: 3 }
    ],
    essayRubric: `핵심 개념을 정확히 이해하고 자신의 말로 요약했는지 평가합니다. ${num}번 문항은 8점 만점입니다.`
  };
}

// 최종 역량 배분 조정 (20문제에 10역량 각 2개)
function balanceDomains(questions) {
  const domainCount = {};
  DOMAINS.forEach(d => domainCount[d] = 0);
  questions.forEach(q => {
    if (domainCount[q.domain] !== undefined) domainCount[q.domain]++;
  });

  // 3개 이상인 역량에서 0~1개인 역량으로 재배분
  for (let pass = 0; pass < 5; pass++) {
    const over = DOMAINS.filter(d => domainCount[d] > 2);
    const under = DOMAINS.filter(d => domainCount[d] < 2);

    if (under.length === 0) break;

    for (const underDomain of under) {
      if (domainCount[underDomain] >= 2) continue;

      for (const overDomain of over) {
        if (domainCount[overDomain] <= 2) continue;

        // overDomain을 가진 문제 중 마지막 것을 변경
        const candidates = questions.filter(q => q.domain === overDomain);
        if (candidates.length > 2) {
          const target = candidates[candidates.length - 1];
          target.domain = underDomain;
          domainCount[overDomain]--;
          domainCount[underDomain]++;
          if (domainCount[underDomain] >= 2) break;
        }
      }
    }
  }

  return questions;
}

// 메인 처리
function main() {
  const testsSetup = readJsonFile(path.join(ROOT, 'generated/tests-setup.json'));

  // frege1 챕터 추출
  const frege1Chapters = testsSetup.filter(t => t.levelId === 'frege1');
  console.log(`프레게1 챕터 수: ${frege1Chapters.length}`);

  const outputDir = path.join(ROOT, 'generated/pro-tests');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let ch = 1; ch <= 20; ch++) {
    const chId = `pch_frege1_${String(ch).padStart(2, '0')}`;
    const chapterData = frege1Chapters.find(c => c.chapterId === chId);

    if (!chapterData) {
      console.error(`챕터 ${ch} 데이터 없음: ${chId}`);
      continue;
    }

    // 원고 파일 읽기
    const msPath = path.join(ROOT, `프로모드 원고/프레게1/프레게1 (챕터${ch}).json`);
    let manuscript;
    try {
      manuscript = readJsonFile(msPath);
    } catch (e) {
      console.error(`원고 파일 읽기 실패: ${msPath}`, e.message);
      continue;
    }

    // 1. 기존 15문제에 domain 배분 + choiceExplanations 확장
    const existingQuestions = chapterData.questions.map((q, idx) => {
      const updated = { ...q };

      // domain 할당
      updated.domain = assignDomain(q, idx, chapterData.questions.length);

      // choiceExplanations 확장
      expandChoiceExplanations(updated);

      // 서술형 essayKeywords 빈 배열 보정
      if (updated.type === '서술형' && updated.modelAnswer &&
          (!updated.essayKeywords || updated.essayKeywords.length === 0)) {
        const answer = updated.modelAnswer.trim();
        const keywords = answer.split(/[,、.，。\s]+/).filter(w => w.length >= 1).slice(0, 3);
        if (keywords.length === 0) keywords.push(answer);
        updated.essayKeywords = keywords.map((kw, i) => ({ keyword: kw, weight: 5 - i }));
        if (!updated.essayRubric) {
          updated.essayRubric = `모범답안의 핵심 키워드(${keywords.join(', ')})가 포함되어야 합니다. ${updated.number}번 문항은 ${updated.points}점 만점입니다.`;
        }
      }

      return updated;
    });

    // 2. 추가 5문제 생성
    const additionalQuestions = generateAdditionalQuestions(manuscript, existingQuestions, ch);

    // 3. 합치기
    const allQuestions = [...existingQuestions, ...additionalQuestions];

    // 4. 역량 배분 균형 조정
    balanceDomains(allQuestions);

    // 5. 번호 재정렬 확인
    allQuestions.forEach((q, i) => { q.number = i + 1; });

    // 6. 최종 형식 검증
    const objCount = allQuestions.filter(q => q.type === '객관식').length;
    const essayCount = allQuestions.filter(q => q.type === '서술형').length;

    // 7. 저장
    const outputPath = path.join(outputDir, `frege1_ch${String(ch).padStart(2, '0')}.json`);
    fs.writeFileSync(outputPath, JSON.stringify({ questions: allQuestions }, null, 2), 'utf8');

    console.log(`챕터 ${String(ch).padStart(2, '0')}: ${allQuestions.length}문제 (객관식 ${objCount}, 서술형 ${essayCount}) → ${outputPath}`);
  }

  console.log('\n프레게1 전체 20개 챕터 완료!');
}

main();
