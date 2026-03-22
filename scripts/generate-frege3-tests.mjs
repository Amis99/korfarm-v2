/**
 * 프레게3 (20챕터) 테스트 데이터 생성 스크립트
 * 각 챕터의 원고 JSON에서 문법/개념/문학/비문학 섹션의 문제를 추출하여
 * 챕터당 20문제(객관식 17~18 + 서술형 2~3)로 구성
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANUSCRIPT_DIR = path.join(ROOT, '프로모드 원고', '프레게3');
const OUTPUT_DIR = path.join(ROOT, 'generated', 'pro-tests');

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

// 원문자 → 숫자 매핑
const CIRCLE_MAP = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5', '⑥': '6', '⑦': '7', '⑧': '8', '⑨': '9', '⑩': '10' };

function circleToNum(str) {
  if (!str) return str;
  const s = String(str).trim();
  if (CIRCLE_MAP[s]) return CIRCLE_MAP[s];
  // "③" 같은 경우
  for (const [circle, num] of Object.entries(CIRCLE_MAP)) {
    if (s === circle) return num;
  }
  return s.replace(/[①②③④⑤⑥⑦⑧⑨⑩]/g, m => CIRCLE_MAP[m] || m);
}

function stripCirclePrefix(text) {
  if (!text) return text;
  return String(text).replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '').trim();
}

function readManuscript(chapterNum) {
  const filename = `프레게3 (챕터${chapterNum}).json`;
  const filepath = path.join(MANUSCRIPT_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.error(`파일 없음: ${filepath}`);
    return null;
  }
  let raw = fs.readFileSync(filepath, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw);
}

/**
 * 객관식 문제 추출 (문법 또는 개념 섹션)
 */
function extractGrammarOrConceptMC(section, prefix) {
  const questions = [];
  const mcProblems = section[`${prefix}_객관식_문제`];
  const mcAnswers = section[`${prefix}_객관식_정답`];
  const mcChoices = section[`${prefix}_객관식_선택지`];
  const mcExplanations = section[`${prefix}_객관식_해설`];
  const mcBogi = section[`${prefix}_객관식_보기`];
  const passage = section[`${prefix}_지문`] || null;

  if (!mcProblems || !Array.isArray(mcProblems)) return questions;

  for (const prob of mcProblems) {
    const num = prob['번호'] || prob['number'];
    const stem = prob['문제'] || prob['problem'] || prob['stem'];
    if (!stem) continue;

    const answerRaw = mcAnswers ? mcAnswers[String(num)] : null;
    const correctAnswer = circleToNum(answerRaw);

    // 선택지 파싱
    const choicesRaw = mcChoices ? mcChoices[String(num)] : null;
    let choices = [];
    if (Array.isArray(choicesRaw)) {
      choices = choicesRaw.map((c, idx) => ({
        id: String(idx + 1),
        text: stripCirclePrefix(c)
      }));
    }

    // 해설
    const explanation = mcExplanations ? mcExplanations[String(num)] : null;

    // 보기 (지문 대체)
    const bogi = mcBogi ? mcBogi[String(num)] : null;

    const choiceExplanations = {};
    if (explanation) {
      // 정답 해설을 정답에 배치
      if (correctAnswer) {
        choiceExplanations[correctAnswer] = `정답 해설: ${explanation}`;
      }
      // 오답 조언은 간략하게
      for (const ch of choices) {
        if (ch.id !== correctAnswer) {
          choiceExplanations[ch.id] = `오답 조언: 이 선택지는 정답이 아닙니다. ${explanation}`;
        }
      }
    }

    questions.push({
      type: '객관식',
      stem,
      passage: bogi || null,
      correctAnswer: correctAnswer || '1',
      choices,
      choiceExplanations,
      source: prefix
    });
  }

  return questions;
}

/**
 * 서술형 문제 추출 (문법 또는 개념 섹션)
 */
function extractGrammarOrConceptEssay(section, prefix) {
  const questions = [];
  const essayProblems = section[`${prefix}_서술형_문제`];
  const essayAnswers = section[`${prefix}_서술형_모범_답안`];
  const essayBogi = section[`${prefix}_서술형_보기`];
  const essayConditions = section[`${prefix}_서술형_조건`];

  if (!essayProblems || !Array.isArray(essayProblems)) return questions;

  for (const prob of essayProblems) {
    const num = prob['번호'] || prob['number'];
    const stem = prob['문제'] || prob['problem'] || prob['stem'];
    if (!stem) continue;

    const modelAnswer = essayAnswers ? essayAnswers[String(num)] : '';
    const bogi = essayBogi ? essayBogi[String(num)] : null;
    const conditions = essayConditions ? essayConditions[String(num)] : null;

    // 조건이 있으면 stem에 추가
    let fullStem = stem;
    if (conditions && Array.isArray(conditions) && conditions.length > 0) {
      fullStem += '\n[조건]\n' + conditions.join('\n');
    }

    // 키워드 추출
    const keywords = extractKeywords(String(modelAnswer));

    // 채점 기준
    let rubric = '모범답안의 핵심 내용을 포함하여 논리적으로 서술했는지 평가합니다.';
    if (conditions && Array.isArray(conditions) && conditions.length > 0) {
      rubric = conditions.join(' / ');
    }

    questions.push({
      type: '서술형',
      stem: fullStem,
      passage: bogi || null,
      correctAnswer: null,
      choiceExplanations: {},
      modelAnswer: String(modelAnswer).replace(/\n\*\s*해설:.*$/s, '').trim(),
      essayKeywords: keywords,
      essayRubric: rubric,
      source: prefix
    });
  }

  return questions;
}

/**
 * 문학 객관식 추출
 */
function extractLitMC(section) {
  const questions = [];
  const mcProblems = section['문학_작품_객관식_문제'];
  const mcAnswers = section['문학_작품_객관식_정답'];
  const mcChoices = section['문학_작품_객관식_선택지'];
  const mcExplanations = section['문학_작품_객관식_해설'];
  const mcBogi = section['문학_작품_객관식_보기'];
  const litPassage = section['문학_작품_지문'] || null;

  if (!mcProblems || !Array.isArray(mcProblems)) return questions;

  for (const prob of mcProblems) {
    const num = prob['번호'];
    const stem = prob['문제'];
    if (!stem) continue;

    const answerRaw = mcAnswers ? mcAnswers[String(num)] : null;
    const correctAnswer = circleToNum(answerRaw);

    const choicesRaw = mcChoices ? mcChoices[String(num)] : null;
    let choices = [];
    if (Array.isArray(choicesRaw)) {
      choices = choicesRaw.map((c, idx) => ({
        id: String(idx + 1),
        text: stripCirclePrefix(c)
      }));
    }

    const explanation = mcExplanations ? mcExplanations[String(num)] : null;
    const bogi = mcBogi ? mcBogi[String(num)] : null;

    const choiceExplanations = {};
    if (explanation) {
      if (correctAnswer) {
        choiceExplanations[correctAnswer] = `정답 해설: ${explanation}`;
      }
      for (const ch of choices) {
        if (ch.id !== correctAnswer) {
          choiceExplanations[ch.id] = `오답 조언: 이 선택지는 정답이 아닙니다. ${explanation}`;
        }
      }
    }

    questions.push({
      type: '객관식',
      stem,
      passage: bogi || litPassage,
      correctAnswer: correctAnswer || '1',
      choices,
      choiceExplanations,
      source: '문학'
    });
  }

  return questions;
}

/**
 * 문학 서술형 추출
 */
function extractLitEssay(section) {
  const questions = [];
  const essayProblems = section['문학_작품_서술형_문제'] || section['문학_서술형_문제'];
  const essayAnswers = section['문학_작품_서술형_모범_답안'] || section['문학_서술형_모범_답안'];
  const essayBogi = section['문학_작품_서술형_보기'] || section['문학_서술형_보기'];
  const essayConditions = section['문학_작품_서술형_조건'] || section['문학_서술형_조건'];

  if (!essayProblems || !Array.isArray(essayProblems)) return questions;

  for (const prob of essayProblems) {
    const num = prob['번호'];
    const stem = prob['문제'];
    if (!stem) continue;

    const modelAnswer = essayAnswers ? essayAnswers[String(num)] : '';
    const bogi = essayBogi ? essayBogi[String(num)] : null;
    const conditions = essayConditions ? essayConditions[String(num)] : null;

    let fullStem = stem;
    if (conditions && Array.isArray(conditions) && conditions.length > 0) {
      fullStem += '\n[조건]\n' + conditions.join('\n');
    }

    const keywords = extractKeywords(String(modelAnswer));
    let rubric = '모범답안의 핵심 내용을 포함하여 논리적으로 서술했는지 평가합니다.';
    if (conditions && Array.isArray(conditions) && conditions.length > 0) {
      rubric = conditions.join(' / ');
    }

    questions.push({
      type: '서술형',
      stem: fullStem,
      passage: bogi || null,
      correctAnswer: null,
      choiceExplanations: {},
      modelAnswer: String(modelAnswer).replace(/\n\*\s*해설:.*$/s, '').trim(),
      essayKeywords: keywords,
      essayRubric: rubric,
      source: '문학'
    });
  }

  return questions;
}

/**
 * 비문학 객관식 추출
 */
function extractNonLitMC(section) {
  const questions = [];
  const mcProblems = section['비문학_객관식_문제'];
  const mcAnswers = section['비문학_객관식_정답'];
  const mcChoices = section['비문학_객관식_선택지'];
  const mcExplanations = section['비문학_객관식_해설'];
  const mcBogi = section['비문학_객관식_보기'];
  const nlPassage = section['비문학_지문'] || null;

  if (!mcProblems || !Array.isArray(mcProblems)) return questions;

  for (const prob of mcProblems) {
    const num = prob['번호'];
    const stem = prob['문제'];
    if (!stem) continue;

    const answerRaw = mcAnswers ? mcAnswers[String(num)] : null;
    const correctAnswer = circleToNum(answerRaw);

    const choicesRaw = mcChoices ? mcChoices[String(num)] : null;
    let choices = [];
    if (Array.isArray(choicesRaw)) {
      choices = choicesRaw.map((c, idx) => ({
        id: String(idx + 1),
        text: stripCirclePrefix(c)
      }));
    }

    const explanation = mcExplanations ? mcExplanations[String(num)] : null;
    const bogi = mcBogi ? mcBogi[String(num)] : null;

    const choiceExplanations = {};
    if (explanation) {
      if (correctAnswer) {
        choiceExplanations[correctAnswer] = `정답 해설: ${explanation}`;
      }
      for (const ch of choices) {
        if (ch.id !== correctAnswer) {
          choiceExplanations[ch.id] = `오답 조언: 이 선택지는 정답이 아닙니다. ${explanation}`;
        }
      }
    }

    questions.push({
      type: '객관식',
      stem,
      passage: bogi || nlPassage,
      correctAnswer: correctAnswer || '1',
      choices,
      choiceExplanations,
      source: '비문학'
    });
  }

  return questions;
}

/**
 * 비문학 서술형 추출
 */
function extractNonLitEssay(section) {
  const questions = [];
  const essayProblems = section['비문학_서술형_문제'];
  const essayAnswers = section['비문학_서술형_모범_답안'];
  const essayBogi = section['비문학_서술형_보기'];
  const essayConditions = section['비문학_서술형_조건'];

  if (!essayProblems || !Array.isArray(essayProblems)) return questions;

  for (const prob of essayProblems) {
    const num = prob['번호'];
    const stem = prob['문제'];
    if (!stem) continue;

    const modelAnswer = essayAnswers ? essayAnswers[String(num)] : '';
    const bogi = essayBogi ? essayBogi[String(num)] : null;
    const conditions = essayConditions ? essayConditions[String(num)] : null;

    let fullStem = stem;
    if (conditions && Array.isArray(conditions) && conditions.length > 0) {
      fullStem += '\n[조건]\n' + conditions.join('\n');
    }

    const keywords = extractKeywords(String(modelAnswer));
    let rubric = '모범답안의 핵심 내용을 포함하여 논리적으로 서술했는지 평가합니다.';
    if (conditions && Array.isArray(conditions) && conditions.length > 0) {
      rubric = conditions.join(' / ');
    }

    questions.push({
      type: '서술형',
      stem: fullStem,
      passage: bogi || null,
      correctAnswer: null,
      choiceExplanations: {},
      modelAnswer: String(modelAnswer).replace(/\n\*\s*해설:.*$/s, '').trim(),
      essayKeywords: keywords,
      essayRubric: rubric,
      source: '비문학'
    });
  }

  return questions;
}

/**
 * 모범답안에서 키워드 추출 (3~5개)
 */
function extractKeywords(text) {
  if (!text) return [{ keyword: '핵심', weight: 5 }];

  // 한글 명사/개념어 추출 (2글자 이상)
  const cleaned = text
    .replace(/\n\*\s*해설:.*$/s, '')
    .replace(/[.,!?'"()（）\[\]{}·…\-_=+<>\/\\:;]/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/).filter(w => w.length >= 2 && /^[가-힣]+$/.test(w));

  // 불용어 제거
  const stopwords = new Set(['그래서', '하지만', '때문에', '그러나', '또한', '이것은', '것이다', '있다', '없다', '한다', '된다', '이다', '대한', '통해', '위해', '같은', '다른', '모든', '아닌', '있는', '없는', '하는', '되는', '이런', '저런', '그런', '어떤', '이러한', '그러한', '따라서', '그리고', '그러므로']);

  const filtered = words.filter(w => !stopwords.has(w));

  // 빈도순 정렬
  const freq = {};
  for (const w of filtered) {
    freq[w] = (freq[w] || 0) + 1;
  }

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([keyword], idx) => ({
      keyword,
      weight: 5 - idx
    }));

  return sorted.length > 0 ? sorted : [{ keyword: '핵심개념', weight: 5 }];
}

/**
 * 20문제를 역량 배분하여 구성
 * 10개 역량 × 2문제 = 20문제
 */
function assignDomains(allMC, allEssay) {
  const result = [];

  // 목표: 객관식 17~18, 서술형 2~3
  // 서술형은 최대 3개까지
  const essayCount = Math.min(allEssay.length, 3);
  const mcCount = 20 - essayCount;

  // 객관식에서 선택
  const selectedMC = [];

  // 각 소스별로 균등 배분
  const sources = ['문법', '개념', '문학', '비문학'];
  const mcBySource = {};
  for (const s of sources) {
    mcBySource[s] = allMC.filter(q => q.source === s);
  }

  // 문법 또는 개념 (둘 중 하나만 있음) 에서 최대 5문제
  const gramOrConcept = mcBySource['문법'].length > 0 ? mcBySource['문법'] : mcBySource['개념'];
  const litMC = mcBySource['문학'];
  const nlMC = mcBySource['비문학'];

  // 배분: 문법/개념 5~6, 문학 5~6, 비문학 5~6 (총 mcCount)
  const gcCount = Math.min(gramOrConcept.length, Math.ceil(mcCount / 3));
  const litCount = Math.min(litMC.length, Math.ceil(mcCount / 3));
  const nlCount = Math.min(nlMC.length, mcCount - gcCount - litCount);

  // 실제 선택
  for (let i = 0; i < gcCount && i < gramOrConcept.length; i++) selectedMC.push(gramOrConcept[i]);
  for (let i = 0; i < litCount && i < litMC.length; i++) selectedMC.push(litMC[i]);
  for (let i = 0; i < nlCount && i < nlMC.length; i++) selectedMC.push(nlMC[i]);

  // 부족하면 남은 문제에서 추가
  if (selectedMC.length < mcCount) {
    const used = new Set(selectedMC);
    for (const q of allMC) {
      if (!used.has(q) && selectedMC.length < mcCount) {
        selectedMC.push(q);
        used.add(q);
      }
    }
  }

  // 서술형 선택
  const selectedEssay = allEssay.slice(0, essayCount);

  // 역량 할당: 10개 역량 × 2문제
  const domainAssignment = [];
  for (let i = 0; i < DOMAINS.length; i++) {
    domainAssignment.push(DOMAINS[i]);
    domainAssignment.push(DOMAINS[i]);
  }

  // 소스에 따른 역량 우선 매핑
  const sourceDomainMap = {
    '문법': ['어법·문법 능력', '문장 독해력', '어휘력', '국어 개념 적용 능력'],
    '개념': ['국어 개념 적용 능력', '국어 관련 배경지식', '어휘력', '어법·문법 능력'],
    '문학': ['문장 독해력', '구조 독해력', '어휘력', '국어 관련 배경지식', '문제 분석 및 전략 수립 능력'],
    '비문학': ['비문학 배경지식', '구조 독해력', '논리 사고력', '선택지 분석 및 전략 수립 능력', '문제 분석 및 전략 수립 능력']
  };

  // 합치기
  const allSelected = [...selectedMC, ...selectedEssay];

  // 역량 할당 (Round-robin 방식)
  const domainPool = [...domainAssignment];

  for (let i = 0; i < allSelected.length && i < 20; i++) {
    const q = allSelected[i];
    const src = q.source;
    const preferred = sourceDomainMap[src] || DOMAINS;

    // 우선 매핑에서 아직 남아있는 역량 찾기
    let assignedDomain = null;
    for (const d of preferred) {
      const idx = domainPool.indexOf(d);
      if (idx !== -1) {
        assignedDomain = d;
        domainPool.splice(idx, 1);
        break;
      }
    }
    // 못 찾으면 아무거나
    if (!assignedDomain && domainPool.length > 0) {
      assignedDomain = domainPool.shift();
    }
    if (!assignedDomain) {
      assignedDomain = DOMAINS[i % DOMAINS.length];
    }

    q.domain = assignedDomain;
  }

  // 번호 매기고 최종 형식으로 변환
  const finalQuestions = [];
  let qNum = 1;

  for (let i = 0; i < Math.min(allSelected.length, 20); i++) {
    const q = allSelected[i];

    if (q.type === '객관식') {
      finalQuestions.push({
        number: qNum,
        type: '객관식',
        domain: q.domain,
        points: 3,
        stem: q.stem,
        passage: q.passage,
        correctAnswer: q.correctAnswer,
        choices: q.choices.length > 0 ? q.choices : [
          { id: '1', text: '선택지 1' },
          { id: '2', text: '선택지 2' },
          { id: '3', text: '선택지 3' },
          { id: '4', text: '선택지 4' }
        ],
        choiceExplanations: q.choiceExplanations
      });
    } else {
      finalQuestions.push({
        number: qNum,
        type: '서술형',
        domain: q.domain,
        points: 8,
        stem: q.stem,
        passage: q.passage,
        correctAnswer: null,
        choiceExplanations: {},
        modelAnswer: q.modelAnswer || '',
        essayKeywords: q.essayKeywords || [{ keyword: '핵심', weight: 5 }],
        essayRubric: q.essayRubric || '모범답안의 핵심 내용을 포함하여 논리적으로 서술했는지 평가합니다.'
      });
    }
    qNum++;
  }

  return finalQuestions;
}

/**
 * 메인 처리
 */
function main() {
  // 출력 디렉토리 확인
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let totalGenerated = 0;

  for (let ch = 1; ch <= 20; ch++) {
    console.log(`\n=== 챕터 ${ch} 처리 중 ===`);

    const data = readManuscript(ch);
    if (!data) {
      console.error(`챕터 ${ch} 원고를 읽을 수 없습니다.`);
      continue;
    }

    const allMC = [];
    const allEssay = [];

    // 문법 섹션 (있는 경우)
    const grammar = data['문법'] || {};
    if (Object.keys(grammar).length > 0) {
      const gramMC = extractGrammarOrConceptMC(grammar, '문법');
      const gramEssay = extractGrammarOrConceptEssay(grammar, '문법');
      console.log(`  문법: 객관식 ${gramMC.length}, 서술형 ${gramEssay.length}`);
      allMC.push(...gramMC);
      allEssay.push(...gramEssay);
    }

    // 개념 섹션 (있는 경우)
    const concept = data['개념'] || {};
    if (Object.keys(concept).length > 0 && (concept['개념_객관식_문제'] || concept['개념_서술형_문제'])) {
      const conMC = extractGrammarOrConceptMC(concept, '개념');
      const conEssay = extractGrammarOrConceptEssay(concept, '개념');
      console.log(`  개념: 객관식 ${conMC.length}, 서술형 ${conEssay.length}`);
      allMC.push(...conMC);
      allEssay.push(...conEssay);
    }

    // 문학 섹션
    const lit = data['문학'] || {};
    const litMC = extractLitMC(lit);
    const litEssay = extractLitEssay(lit);
    console.log(`  문학: 객관식 ${litMC.length}, 서술형 ${litEssay.length}`);
    allMC.push(...litMC);
    allEssay.push(...litEssay);

    // 비문학 섹션
    const nonLit = data['비문학'] || {};
    const nlMC = extractNonLitMC(nonLit);
    const nlEssay = extractNonLitEssay(nonLit);
    console.log(`  비문학: 객관식 ${nlMC.length}, 서술형 ${nlEssay.length}`);
    allMC.push(...nlMC);
    allEssay.push(...nlEssay);

    console.log(`  총 추출: 객관식 ${allMC.length}, 서술형 ${allEssay.length}`);

    // 20문제 구성
    const questions = assignDomains(allMC, allEssay);

    // 출력
    const chStr = String(ch).padStart(2, '0');
    const outputPath = path.join(OUTPUT_DIR, `frege3_ch${chStr}.json`);
    const output = { questions };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

    const mcFinal = questions.filter(q => q.type === '객관식').length;
    const essayFinal = questions.filter(q => q.type === '서술형').length;
    console.log(`  => ${outputPath}`);
    console.log(`  => 총 ${questions.length}문제 (객관식 ${mcFinal}, 서술형 ${essayFinal})`);

    // 역량 배분 확인
    const domainCounts = {};
    for (const q of questions) {
      domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
    }
    const domainSummary = Object.entries(domainCounts).map(([d, c]) => `${d}:${c}`).join(', ');
    console.log(`  역량: ${domainSummary}`);

    totalGenerated++;
  }

  console.log(`\n=== 완료: ${totalGenerated}개 챕터 테스트 생성 ===`);
}

main();
