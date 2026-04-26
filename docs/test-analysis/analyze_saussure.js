/**
 * 소쉬르(초1~3) 테스트 문항 분석 스크립트
 * 모든 문항을 읽고 평가하여 JSON + MD 보고서를 생성합니다.
 */
const fs = require('fs');
const path = require('path');

// ── 유틸리티 ──
function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const fixed = raw.split('\\\\"').join('\\"');
  return JSON.parse(fixed);
}

function parseChoices(choicesJson) {
  try {
    return JSON.parse(choicesJson);
  } catch (e) {
    return [];
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── 10대 역량 목록 ──
const TEN_COMPETENCIES = [
  '어휘력', '문장 독해력', '구조 독해력', '논리 사고력',
  '어법·문법 능력', '국어 개념 적용 능력', '국어 관련 배경지식',
  '비문학 배경지식', '문제 분석 및 전략 수립 능력', '선택지 분석 및 전략 수립 능력'
];

// ── 분석 함수 ──
function analyzeQuestion(q, isDiagnostic) {
  const choices = parseChoices(q.choicesJson);
  const errors = [];
  const suggestions = [];

  // 기본 정보
  const isObjective = q.type === '객관식';
  const isEssay = q.type === '서술형';
  const stem = q.stem || '';
  const passage = q.passage || '';
  const correctAnswer = q.correctAnswer || '';
  const domain = q.domain || '';
  const subDomain = q.subDomain || null;

  // ── 1. 정답 정확성 검증 ──
  let answerCorrectness = '정확';

  if (isObjective) {
    if (!correctAnswer) {
      answerCorrectness = '오류';
      errors.push('객관식 문항인데 correctAnswer가 비어 있음');
    } else {
      // correctAnswer가 choices의 id/choice_id 중 하나인지 확인
      const validIds = choices.map(c => c.id || c.choice_id);
      const ansStr = String(correctAnswer);
      if (validIds.length > 0 && !validIds.includes(ansStr)) {
        // A,B,C,D,E 형식과 1,2,3,4 형식 모두 확인
        const idx = parseInt(ansStr);
        if (isNaN(idx) || idx < 1 || idx > validIds.length) {
          // A-E 매핑 시도
          const letterIdx = 'ABCDE'.indexOf(ansStr);
          if (letterIdx === -1 || letterIdx >= validIds.length) {
            answerCorrectness = '오류';
            errors.push(`correctAnswer "${correctAnswer}"가 선택지 ID에 매칭되지 않음 (선택지: ${validIds.join(',')})`);
          }
        }
      }
    }

    // 문항 내용 기반 정답 검증 (특정 패턴)
    if (stem.includes('않은') || stem.includes('않는') || stem.includes('아닌') || stem.includes('다른')) {
      // 부정형 문항 - 정답이 맞는지 내용 분석 필요 (기본 통과)
    }
  }

  if (isEssay) {
    if (!q.modelAnswer && !correctAnswer) {
      // 서술형에 모범답안이 없는 건 문제는 아니지만 참고 사항
    }
  }

  // ── 2. 난이도 적합성 (초1~3 대상) ──
  let difficultyFit = '적절';

  const stemAndPassage = stem + passage;

  // 어려운 한자어/추상적 개념 검출
  const hardTerms = [
    '추론', '함축', '서사', '반어', '역설', '명제', '논증', '귀납', '연역',
    '메타포', '형이상학', '인과율', '서술자의 시점', '갈등 구조',
    '주민등록번호', '보이스 피싱', '사이버 따돌림', '로그아웃',
    '출판사', '원고', 'J.K. 롤링'
  ];

  // 초1~3에 약간 어려울 수 있는 용어 (경고만)
  const mediumTerms = [
    '자아 성찰', '인과 관계', '회오리바람', '지평선', '비유적 표현',
    '사생활', '유출', '뇌물', '소송', '관아', '판결'
  ];
  mediumTerms.forEach(term => {
    if (stemAndPassage.includes(term)) {
      suggestions.push(`초등 저학년에 다소 어려울 수 있는 용어: "${term}"`);
    }
  });

  hardTerms.forEach(term => {
    if (stemAndPassage.includes(term)) {
      difficultyFit = '어려움';
      errors.push(`초1~3에 부적합한 용어 사용: "${term}"`);
    }
  });

  // 선택지 길이/복잡도 검사
  if (isObjective && choices.length > 0) {
    const avgChoiceLen = choices.reduce((s, c) => s + (c.text || '').length, 0) / choices.length;
    if (avgChoiceLen > 40) {
      // 선택지가 매우 긴 경우 (초등 저학년에 부담)
      if (avgChoiceLen > 60) {
        suggestions.push('선택지가 길어 초1~3 학생에게 읽기 부담이 될 수 있음');
      }
    }
  }

  // 지문 길이 검사
  if (passage.length > 800) {
    suggestions.push('지문이 800자 이상으로 긴 편. 초1~3에 적합한 분량인지 검토 필요');
  }

  // ── 3. 적절성 평가 ──
  let appropriateness = '적절';

  // choiceExplanationsJson에서 템플릿 오류 감지
  if (q.choiceExplanationsJson && q.choiceExplanationsJson !== '{}') {
    const expl = typeof q.choiceExplanationsJson === 'string' ? q.choiceExplanationsJson : JSON.stringify(q.choiceExplanationsJson);

    // 지문이 없는데 해설에서 지문/글 참조하는 경우
    const passageRefPatterns = [
      '지문에서 확인할 수 있는',
      '지문의 내용과 맞지',
      '글의 핵심 내용을 근거로',
      '이 문제는 해당하지',
      '지문의 근거를 찾아'
    ];
    if (!passage) {
      passageRefPatterns.forEach(pattern => {
        if (expl.includes(pattern)) {
          if (!errors.some(e => e.includes('지문 없는데 해설에서'))) {
            errors.push(`지문 없는 문항인데 해설에서 지문/글 참조 ("${pattern}")`);
            appropriateness = '수정필요';
          }
        }
      });
    }
  }

  // HTML 태그 검증 (<u>, <보기> 등)
  if (stem.includes('<U>') || stem.includes('</U>')) {
    errors.push('HTML 태그 대소문자 불일치: </U> → </u>로 수정 필요');
    appropriateness = '수정필요';
  }

  // 지문 내 맞춤법 오류 검출
  const typoChecks = [
    ['빼앗으', '빼앗으 → 빼앗으(빼앗다 확인 필요: 빼앗다/빼앗다)'],
    ['됩시다', '됩시다 → 됩시다(맞춤법 확인: 됩시다/됩니다)'],
  ];
  const allText = stem + passage;
  typoChecks.forEach(([pattern, msg]) => {
    if (allText.includes(pattern)) {
      errors.push(`맞춤법 오류: ${msg}`);
      appropriateness = '수정필요';
    }
  });

  // 선택지 내 띄어쓰기/맞춤법 오류
  choices.forEach(c => {
    if (c.text && c.text.includes('방법수천')) {
      errors.push('선택지 띄어쓰기 오류: "방법수천" → "방법 수천"');
      appropriateness = '수정필요';
    }
  });

  // 선택지 중복 체크
  if (choices.length > 1) {
    for (let i = 0; i < choices.length; i++) {
      for (let j = i + 1; j < choices.length; j++) {
        if (choices[i].text && choices[j].text && choices[i].text === choices[j].text) {
          errors.push(`선택지 중복: ${(choices[i].id || choices[i].choice_id)}번과 ${(choices[j].id || choices[j].choice_id)}번 동일`);
          appropriateness = '수정필요';
        }
      }
    }
  }

  // 서술형인데 선택지가 있거나, 객관식인데 선택지가 없는 경우
  if (isObjective && choices.length === 0) {
    errors.push('객관식 문항인데 선택지가 없음');
    appropriateness = '부적절';
  }

  if (isEssay && choices.length > 0) {
    errors.push('서술형 문항인데 선택지가 존재함');
    appropriateness = '수정필요';
  }

  // ── 4. 역량 매핑 ──
  let competencies = [];
  if (isDiagnostic && choices.length > 0) {
    // 진단 테스트: vector에서 역량 추출
    const compSet = new Set();
    choices.forEach(c => {
      if (c.vector) {
        Object.keys(c.vector).forEach(k => compSet.add(k));
      }
    });
    competencies = Array.from(compSet).filter(c => TEN_COMPETENCIES.includes(c));
  } else {
    // 챕터 테스트: domain 필드에서 매핑
    if (TEN_COMPETENCIES.includes(domain)) {
      competencies.push(domain);
    } else {
      // 도메인명으로 역량 매핑 시도
      const domainMap = {
        '지문근거형': ['문장 독해력'],
        '논리추론형': ['논리 사고력'],
        '어휘단독형': ['어휘력'],
        '외부지식형': ['비문학 배경지식']
      };
      if (domainMap[domain]) {
        competencies = domainMap[domain];
      }
    }
  }

  // 추가 역량 추론 (stem 기반)
  if (stem.includes('낱말') || stem.includes('뜻풀이') || stem.includes('뜻으로')) {
    if (!competencies.includes('어휘력')) competencies.push('어휘력');
  }
  if (stem.includes('표기') || stem.includes('맞춤법') || stem.includes('빈칸에 들어갈')) {
    if (!competencies.includes('어법·문법 능력') && (stem.includes('표기') || stem.includes('맞춤법'))) {
      competencies.push('어법·문법 능력');
    }
  }
  if (stem.includes('순서') || stem.includes('차례')) {
    if (!competencies.includes('구조 독해력')) competencies.push('구조 독해력');
  }
  if (stem.includes('이유') || stem.includes('까닭') || stem.includes('원인')) {
    if (!competencies.includes('논리 사고력')) competencies.push('논리 사고력');
  }

  // ── 5. 영역/세부영역 재분류 ──
  let analyzedDomain = domain;
  let analyzedSubDomain = subDomain;

  // 진단 테스트는 이미 domain이 유형별(지문근거형 등)로 분류되어 있음
  // 챕터 테스트는 domain이 역량명으로 되어 있으므로 재분류
  if (!isDiagnostic) {
    // stem과 passage 기반 유형 분류
    if (passage && stem.match(/글|내용|지문/)) {
      analyzedDomain = '지문근거형';
    } else if (stem.includes('이유') || stem.includes('까닭') || stem.includes('추론') || stem.includes('결과')) {
      analyzedDomain = '논리추론형';
    } else if (stem.includes('낱말') || stem.includes('뜻') || stem.includes('표기') || stem.includes('단어')) {
      analyzedDomain = '어휘단독형';
    } else if (!passage && (stem.includes('설명') || stem.includes('지식'))) {
      analyzedDomain = '외부지식형';
    } else if (passage) {
      analyzedDomain = '지문근거형';
    } else {
      analyzedDomain = '어휘단독형';
    }

    // subDomain 분류
    if (passage) {
      if (passage.includes('동시') || passage.includes('시') && passage.includes('연')) {
        analyzedSubDomain = '문학';
      } else if (passage.match(/옛날|이야기|동화|전래|동물들이/)) {
        analyzedSubDomain = '문학';
      } else if (passage.match(/과학|실험|나비|물|구름|동물|식물|지구/)) {
        analyzedSubDomain = '비문학-과학';
      } else if (passage.match(/역사|사회|문화|마을|환경|직업/)) {
        analyzedSubDomain = '비문학-사회';
      } else {
        analyzedSubDomain = '비문학';
      }
    } else {
      if (stem.match(/낱말|단어|뜻|표기|맞춤법/)) {
        analyzedSubDomain = '어휘';
      } else if (stem.match(/문법|문장|주어|서술어|높임말|호응/)) {
        analyzedSubDomain = '문법';
      } else {
        analyzedSubDomain = '기타';
      }
    }
  }

  // ── 6. 추가 오류 검출 ──

  // 동일 stem에서 Q17, Q20처럼 거의 같은 문제가 있는지 (외부에서 체크)

  // 선택지 수 불균형 체크
  if (isObjective && choices.length !== 4 && choices.length !== 5 && choices.length !== 3) {
    suggestions.push(`선택지 수가 ${choices.length}개 (보통 3~5개)`);
  }

  // 배점 체크
  if (q.points && q.points > 20) {
    suggestions.push(`배점이 ${q.points}점으로 높음`);
  }

  return {
    number: q.number,
    type: q.type,
    stem: stem,
    passage: passage ? passage.substring(0, 200) + (passage.length > 200 ? '...' : '') : '',
    choices: choices.map(c => ({
      id: c.id || c.choice_id || '',
      text: c.text || ''
    })),
    correctAnswer: correctAnswer,
    points: q.points,
    analysis: {
      appropriateness,
      difficultyFit,
      answerCorrectness,
      competencies,
      domain: analyzedDomain,
      subDomain: analyzedSubDomain || subDomain,
      errors,
      suggestions: suggestions.join('; ')
    }
  };
}

// ── 시험지 단위 요약 ──
function createTestSummary(questions) {
  const totalQuestions = questions.length;
  const errorCount = questions.reduce((s, q) => s + q.analysis.errors.length, 0);

  // 역량 분포
  const compDist = {};
  TEN_COMPETENCIES.forEach(c => { compDist[c] = 0; });
  questions.forEach(q => {
    q.analysis.competencies.forEach(c => {
      if (compDist[c] !== undefined) compDist[c]++;
    });
  });

  // 영역 분포
  const domainDist = {};
  questions.forEach(q => {
    const d = q.analysis.domain;
    domainDist[d] = (domainDist[d] || 0) + 1;
  });

  // 세부영역 분포
  const subDomainDist = {};
  questions.forEach(q => {
    const sd = q.analysis.subDomain || '미분류';
    subDomainDist[sd] = (subDomainDist[sd] || 0) + 1;
  });

  // 난이도 분포
  const diffDist = { '적절': 0, '쉬움': 0, '어려움': 0 };
  questions.forEach(q => {
    diffDist[q.analysis.difficultyFit] = (diffDist[q.analysis.difficultyFit] || 0) + 1;
  });

  // 전체 등급
  let overallRating = '양호';
  if (errorCount > totalQuestions * 0.2) overallRating = '수정필요';
  else if (errorCount > totalQuestions * 0.4) overallRating = '대폭수정필요';
  if (errorCount === 0) overallRating = '우수';

  return {
    totalQuestions,
    objectiveCount: questions.filter(q => q.type === '객관식').length,
    essayCount: questions.filter(q => q.type === '서술형').length,
    errorCount,
    appropriatenessDistribution: {
      '적절': questions.filter(q => q.analysis.appropriateness === '적절').length,
      '수정필요': questions.filter(q => q.analysis.appropriateness === '수정필요').length,
      '부적절': questions.filter(q => q.analysis.appropriateness === '부적절').length
    },
    difficultyDistribution: diffDist,
    competencyDistribution: compDist,
    domainDistribution: domainDist,
    subDomainDistribution: subDomainDist,
    overallRating
  };
}

// ── MD 보고서 생성 ──
function generateMD(testGroups, level, targetGrade, isDiagnostic) {
  let md = '';
  const levelLabel = isDiagnostic ? '소쉬르 진단 테스트' : level.replace('saussure', '소쉬르');

  md += `# ${levelLabel} 문항 분석 보고서\n\n`;
  md += `- **대상**: ${targetGrade}\n`;
  md += `- **분석 일시**: ${new Date().toISOString().slice(0, 10)}\n`;
  md += `- **총 시험지 수**: ${testGroups.length}\n`;

  const totalQ = testGroups.reduce((s, g) => s + g.questions.length, 0);
  const totalErrors = testGroups.reduce((s, g) => s + g.summary.errorCount, 0);
  md += `- **총 문항 수**: ${totalQ}\n`;
  md += `- **총 오류 수**: ${totalErrors}\n\n`;

  // 전체 요약
  md += `## 전체 요약\n\n`;

  // 전체 역량 분포
  const totalCompDist = {};
  TEN_COMPETENCIES.forEach(c => { totalCompDist[c] = 0; });
  testGroups.forEach(g => {
    g.questions.forEach(q => {
      q.analysis.competencies.forEach(c => {
        if (totalCompDist[c] !== undefined) totalCompDist[c]++;
      });
    });
  });

  md += `### 역량 분포\n\n`;
  md += `| 역량 | 문항 수 | 비율 |\n`;
  md += `|------|--------|------|\n`;
  TEN_COMPETENCIES.forEach(c => {
    const cnt = totalCompDist[c];
    const pct = totalQ > 0 ? (cnt / totalQ * 100).toFixed(1) : '0.0';
    md += `| ${c} | ${cnt} | ${pct}% |\n`;
  });
  md += '\n';

  // 전체 영역 분포
  const totalDomDist = {};
  testGroups.forEach(g => {
    Object.entries(g.summary.domainDistribution).forEach(([k, v]) => {
      totalDomDist[k] = (totalDomDist[k] || 0) + v;
    });
  });
  md += `### 영역 분포\n\n`;
  md += `| 영역 | 문항 수 |\n`;
  md += `|------|--------|\n`;
  Object.entries(totalDomDist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    md += `| ${k} | ${v} |\n`;
  });
  md += '\n';

  // 난이도 분포
  const totalDiffDist = { '적절': 0, '쉬움': 0, '어려움': 0 };
  testGroups.forEach(g => {
    g.questions.forEach(q => {
      totalDiffDist[q.analysis.difficultyFit]++;
    });
  });
  md += `### 난이도 적합성\n\n`;
  md += `| 판정 | 문항 수 |\n`;
  md += `|------|--------|\n`;
  Object.entries(totalDiffDist).forEach(([k, v]) => {
    md += `| ${k} | ${v} |\n`;
  });
  md += '\n';

  // 오류 있는 문항 상세
  const errorQuestions = [];
  testGroups.forEach(g => {
    g.questions.forEach(q => {
      if (q.analysis.errors.length > 0) {
        errorQuestions.push({ testTitle: g.testTitle, ...q });
      }
    });
  });

  if (errorQuestions.length > 0) {
    md += `## 오류 발견 문항 상세 (${errorQuestions.length}건)\n\n`;
    errorQuestions.forEach(q => {
      md += `### ${q.testTitle} - ${q.number}번\n\n`;
      md += `- **문제**: ${q.stem.substring(0, 100)}${q.stem.length > 100 ? '...' : ''}\n`;
      md += `- **유형**: ${q.type}\n`;
      md += `- **정답**: ${q.correctAnswer}\n`;
      md += `- **적절성**: ${q.analysis.appropriateness}\n`;
      md += `- **오류 내용**:\n`;
      q.analysis.errors.forEach(e => {
        md += `  - ${e}\n`;
      });
      if (q.choices.length > 0) {
        md += `- **선택지**:\n`;
        q.choices.forEach(c => {
          md += `  - ${c.id}: ${c.text}\n`;
        });
      }
      md += '\n';
    });
  }

  // 시험지별 요약
  md += `## 시험지별 요약\n\n`;
  testGroups.forEach(g => {
    md += `### ${g.testTitle}\n\n`;
    md += `- testId: \`${g.testId}\`\n`;
    md += `- 문항 수: ${g.summary.totalQuestions} (객관식 ${g.summary.objectiveCount}, 서술형 ${g.summary.essayCount})\n`;
    md += `- 오류: ${g.summary.errorCount}건\n`;
    md += `- 종합 등급: **${g.summary.overallRating}**\n\n`;

    // 문항별 요약 테이블
    md += `| 번호 | 유형 | 역량 | 적절성 | 난이도 | 정답 | 비고 |\n`;
    md += `|------|------|------|--------|--------|------|------|\n`;
    g.questions.forEach(q => {
      const comp = q.analysis.competencies.slice(0, 2).join(', ') || '-';
      const note = q.analysis.errors.length > 0 ? q.analysis.errors[0].substring(0, 30) : (q.analysis.suggestions ? q.analysis.suggestions.substring(0, 30) : '');
      md += `| ${q.number} | ${q.type} | ${comp} | ${q.analysis.appropriateness} | ${q.analysis.difficultyFit} | ${q.correctAnswer || '서술형'} | ${note} |\n`;
    });
    md += '\n';
  });

  // 개선 제안 요약
  const allSuggestions = [];
  testGroups.forEach(g => {
    g.questions.forEach(q => {
      if (q.analysis.suggestions) {
        allSuggestions.push({ test: g.testTitle, num: q.number, suggestion: q.analysis.suggestions });
      }
    });
  });

  if (allSuggestions.length > 0) {
    md += `## 개선 제안 목록\n\n`;
    allSuggestions.forEach(s => {
      md += `- **${s.test} Q${s.num}**: ${s.suggestion}\n`;
    });
    md += '\n';
  }

  return md;
}

// ── 메인 처리 ──
function processData(data, level, isDiagnostic) {

  // testId별 그룹화
  const groups = {};
  data.forEach(q => {
    const tid = q.testId;
    if (!groups[tid]) {
      groups[tid] = { testId: tid, title: q.title, items: [] };
    }
    groups[tid].items.push(q);
  });

  // 시험지별 분석
  const testGroups = [];
  Object.values(groups).forEach(g => {
    g.items.sort((a, b) => a.number - b.number);

    const questions = g.items.map(q => analyzeQuestion(q, isDiagnostic));

    // 추가 분석: 동일 시험지 내 중복 문항 체크
    const stems = questions.map(q => q.stem.replace(/\s+/g, ''));
    for (let i = 0; i < stems.length; i++) {
      for (let j = i + 1; j < stems.length; j++) {
        if (stems[i] === stems[j]) {
          questions[j].analysis.errors.push(`Q${questions[i].number}와 문제가 동일함`);
          questions[j].analysis.appropriateness = '부적절';
        }
        // 유사도 체크 (80% 이상 겹치면)
        const shorter = Math.min(stems[i].length, stems[j].length);
        if (shorter > 20) {
          let match = 0;
          for (let k = 0; k < shorter; k++) {
            if (stems[i][k] === stems[j][k]) match++;
          }
          if (match / shorter > 0.8 && stems[i] !== stems[j]) {
            questions[j].analysis.suggestions += (questions[j].analysis.suggestions ? '; ' : '') + `Q${questions[i].number}과 매우 유사한 문항`;
          }
        }
      }
    }

    const summary = createTestSummary(questions);

    // title에서 장 번호 추출하여 정렬용
    const chapterMatch = g.title.match(/(\d+)장/);
    const chapterNum = chapterMatch ? parseInt(chapterMatch[1]) : 0;

    testGroups.push({
      testId: g.testId,
      testTitle: g.title,
      level: level,
      targetGrade: '초1~3',
      chapterNum,
      questions,
      summary
    });
  });

  // 장 번호순 정렬
  testGroups.sort((a, b) => a.chapterNum - b.chapterNum);

  return testGroups;
}

function processFile(filePath, level, isDiagnostic) {
  const data = readJson(filePath);
  return processData(data, level, isDiagnostic);
}

// ── 실행 ──
const BASE = path.resolve(__dirname);
const RAW = path.join(BASE, 'raw');

console.log('=== 소쉬르 테스트 문항 분석 시작 ===\n');

// 1. 진단 테스트
console.log('1. 진단 테스트 분석...');
const diagGroups = processFile(path.join(RAW, 'sohssure.json'), 'sohssure', true);
const diagOutDir = path.join(BASE, 'diagnostic');
ensureDir(diagOutDir);

const diagJson = diagGroups;
fs.writeFileSync(path.join(diagOutDir, 'sohssure_analysis.json'), JSON.stringify(diagJson, null, 2), 'utf8');
const diagMd = generateMD(diagGroups, 'sohssure', '초1~3', true);
fs.writeFileSync(path.join(diagOutDir, 'sohssure_analysis.md'), diagMd, 'utf8');
console.log(`  → ${diagGroups.length}개 시험지, ${diagGroups.reduce((s, g) => s + g.questions.length, 0)}문항 분석 완료`);

// 2. 챕터 테스트 소쉬르1
console.log('2. 소쉬르1 챕터 테스트 분석...');
const s1Groups = processFile(path.join(RAW, 'SAUSSURE_1.json'), 'saussure1', false);
const s1OutDir = path.join(BASE, 'chapter', 'saussure1');
ensureDir(s1OutDir);
fs.writeFileSync(path.join(s1OutDir, 'analysis.json'), JSON.stringify(s1Groups, null, 2), 'utf8');
fs.writeFileSync(path.join(s1OutDir, 'analysis.md'), generateMD(s1Groups, 'saussure1', '초1~3', false), 'utf8');
console.log(`  → ${s1Groups.length}개 시험지, ${s1Groups.reduce((s, g) => s + g.questions.length, 0)}문항 분석 완료`);

// 3. 챕터 테스트 소쉬르2
console.log('3. 소쉬르2 챕터 테스트 분석...');
const s2Groups = processFile(path.join(RAW, 'SAUSSURE_2.json'), 'saussure2', false);
const s2OutDir = path.join(BASE, 'chapter', 'saussure2');
ensureDir(s2OutDir);
fs.writeFileSync(path.join(s2OutDir, 'analysis.json'), JSON.stringify(s2Groups, null, 2), 'utf8');
fs.writeFileSync(path.join(s2OutDir, 'analysis.md'), generateMD(s2Groups, 'saussure2', '초1~3', false), 'utf8');
console.log(`  → ${s2Groups.length}개 시험지, ${s2Groups.reduce((s, g) => s + g.questions.length, 0)}문항 분석 완료`);

// 4. 챕터 테스트 소쉬르3 (SAUSSURE_3.json + saussure3.json 합침)
console.log('4. 소쉬르3 챕터 테스트 분석...');
const s3aData = readJson(path.join(RAW, 'SAUSSURE_3.json'));
const s3bData = readJson(path.join(RAW, 'saussure3.json'));
// 합치되, saussure3.json의 문항이 SAUSSURE_3에 이미 있으면 제외
const s3aTestIds = new Set(s3aData.map(q => q.testId + '_' + q.number));
const s3bNew = s3bData.filter(q => !s3aTestIds.has(q.testId + '_' + q.number));
const s3Combined = [...s3aData, ...s3bNew];

// 합친 데이터를 직접 processData에 전달
const s3Groups = processData(s3Combined, 'saussure3', false);

const s3OutDir = path.join(BASE, 'chapter', 'saussure3');
ensureDir(s3OutDir);
fs.writeFileSync(path.join(s3OutDir, 'analysis.json'), JSON.stringify(s3Groups, null, 2), 'utf8');
fs.writeFileSync(path.join(s3OutDir, 'analysis.md'), generateMD(s3Groups, 'saussure3', '초1~3', false), 'utf8');
console.log(`  → ${s3Groups.length}개 시험지, ${s3Groups.reduce((s, g) => s + g.questions.length, 0)}문항 분석 완료`);

console.log('\n=== 분석 완료 ===');
console.log('출력 파일:');
console.log('  docs/test-analysis/diagnostic/sohssure_analysis.json');
console.log('  docs/test-analysis/diagnostic/sohssure_analysis.md');
console.log('  docs/test-analysis/chapter/saussure1/analysis.json');
console.log('  docs/test-analysis/chapter/saussure1/analysis.md');
console.log('  docs/test-analysis/chapter/saussure2/analysis.json');
console.log('  docs/test-analysis/chapter/saussure2/analysis.md');
console.log('  docs/test-analysis/chapter/saussure3/analysis.json');
console.log('  docs/test-analysis/chapter/saussure3/analysis.md');
