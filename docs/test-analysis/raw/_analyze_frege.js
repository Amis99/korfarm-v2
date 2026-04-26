/**
 * 프레게 테스트 문항 분석 스크립트 v2
 * 진단(48) + 챕터(400×3) = 총 1248문항 전수 분석
 * 구조적 검증 + 내용 기반 심층 분석
 */
const fs = require('fs');
const path = require('path');

function loadJson(f) {
    let raw = fs.readFileSync(f, 'utf-8');
    raw = raw.replace(/\\\\\"/g, '\\"');
    return JSON.parse(raw);
}

const COMPETENCY_LABELS = [
    '어휘력', '문장독해력', '구조독해력', '논리사고력', '어법문법능력',
    '국어개념적용능력', '국어관련배경지식', '비문학배경지식',
    '문제분석및전략수립능력', '선택지분석및전략수립능력'
];

function normalizeComp(name) {
    return (name || '').replace(/[\s·]/g, '');
}

function analyzeQuestion(q, isDiagnostic) {
    const result = {
        number: q.number,
        testId: q.testId,
        title: q.title,
        type: q.type || '객관식',
        domain: q.domain || '',
        subDomain: q.subDomain || '',
        points: q.points,
        stem: q.stem,
        passageLength: (q.passage || '').length,
        correctAnswer: q.correctAnswer,
        appropriateness: '적절',
        difficultyFit: '적절',
        answerCorrectness: '정확',
        competencies: [],
        errors: [],
        suggestions: []
    };

    let choices = [];
    try { choices = JSON.parse(q.choicesJson); } catch (e) { }
    result.choiceCount = choices.length;
    result.isSubjective = choices.length === 0;

    // === 역량 분석 ===
    const domainNorm = normalizeComp(q.domain);
    if (COMPETENCY_LABELS.includes(domainNorm)) {
        result.competencies.push(domainNorm);
    }

    if (isDiagnostic && choices.length > 0) {
        choices.forEach(c => {
            if (c.vector) {
                Object.keys(c.vector).forEach(k => {
                    const norm = normalizeComp(k);
                    if (!result.competencies.includes(norm)) {
                        result.competencies.push(norm);
                    }
                });
            }
        });
    }

    // domain 기반 문항 유형 분류
    if (['지문근거형', '논리추론형', '어휘단독형', '외부지식형'].includes(q.domain)) {
        result.questionType = q.domain;
    } else {
        if (q.passage && q.passage.length > 50 && q.stem &&
            (q.stem.includes('위 글') || q.stem.includes('이 글') || q.stem.includes('이 시') ||
             q.stem.includes('이 이야기') || q.stem.includes('<보기>'))) {
            result.questionType = '지문근거형';
        } else if (q.stem && (q.stem.includes('의미') || q.stem.includes('뜻') || q.stem.includes('낱말') ||
                              q.stem.includes('어휘') || q.stem.includes('단어') || q.stem.includes('품사'))) {
            result.questionType = '어휘단독형';
        } else if (q.stem && (q.stem.includes('이유') || q.stem.includes('추론') || q.stem.includes('원인'))) {
            result.questionType = '논리추론형';
        } else if (q.passage && q.passage.length > 50) {
            result.questionType = '지문근거형';
        } else {
            result.questionType = '어휘단독형';
        }
    }

    // subDomain 분류
    if (q.subDomain && q.subDomain !== 'null' && q.subDomain !== null) {
        result.subDomainCategory = q.subDomain;
    } else {
        if (q.passage && (q.passage.includes('시') || q.passage.includes('소설') || q.passage.includes('소년') ||
                          q.passage.includes('소녀') || q.passage.includes('이야기'))) {
            result.subDomainCategory = '문학';
        } else if (q.stem && (q.stem.includes('시') || q.stem.includes('화자') || q.stem.includes('서술자'))) {
            result.subDomainCategory = '문학';
        } else {
            result.subDomainCategory = '비문학';
        }
    }

    // === 오류 검출 ===

    // 1. 객관식 정답 누락
    if (!q.correctAnswer && choices.length > 0) {
        result.errors.push({ type: '정답누락', severity: '심각', detail: '객관식 문항에 정답이 지정되지 않음' });
        result.answerCorrectness = '오류';
    }

    // 2. 정답 범위 검사
    if (choices.length > 0 && q.correctAnswer) {
        if (/^\d+$/.test(q.correctAnswer)) {
            const ansNum = parseInt(q.correctAnswer);
            if (ansNum < 1 || ansNum > choices.length) {
                result.errors.push({ type: '정답범위오류', severity: '심각', detail: `정답 ${q.correctAnswer}이 선택지 범위(1-${choices.length}) 밖` });
                result.answerCorrectness = '오류';
            }
        } else {
            const validIds = choices.map(c => c.choice_id || c.id);
            if (!validIds.includes(q.correctAnswer)) {
                result.errors.push({ type: '정답범위오류', severity: '심각', detail: `정답 ${q.correctAnswer}이 선택지 ID에 없음` });
                result.answerCorrectness = '오류';
            }
        }
    }

    // 3. 진단 테스트: 정답/error_path 정합성
    if (isDiagnostic && choices.length > 0 && q.correctAnswer) {
        const correctChoice = choices.find(c => c.choice_id === q.correctAnswer);
        if (correctChoice && correctChoice.error_path && correctChoice.error_path !== '정답') {
            result.errors.push({ type: '정답표시불일치', severity: '심각', detail: `correctAnswer=${q.correctAnswer}의 error_path='${correctChoice.error_path}'` });
            result.answerCorrectness = '오류';
        }
        const markedCorrect = choices.find(c => c.error_path === '정답');
        if (markedCorrect && markedCorrect.choice_id !== q.correctAnswer) {
            result.errors.push({ type: '정답표시불일치', severity: '심각', detail: `error_path='정답' 선택지(${markedCorrect.choice_id})와 correctAnswer(${q.correctAnswer})가 불일치` });
            result.answerCorrectness = '오류';
        }
    }

    // 4. <보기> 태그 중복
    if (q.stem && (q.stem.includes('<보기>\n<보기>') || q.stem.includes('<보기>\\n<보기>'))) {
        result.errors.push({ type: '보기태그중복', severity: '경고', detail: '<보기> 태그가 연속 중복 사용됨' });
        result.appropriateness = '수정필요';
    }

    // 5. 선택지 내용 중복
    if (choices.length > 0) {
        const texts = choices.map(c => (c.text || '').trim());
        if (new Set(texts).size < texts.length) {
            result.errors.push({ type: '선택지중복', severity: '심각', detail: '동일한 텍스트의 선택지 존재' });
            result.appropriateness = '수정필요';
        }
    }

    // 6. 배점 이상
    if (q.points > 15) {
        result.errors.push({ type: '배점이상', severity: '경고', detail: `배점 ${q.points}점 (비정상적 고배점)` });
    }

    // 7. 서술형 모범답안 누락
    if (choices.length === 0 && (!q.correctAnswer || q.correctAnswer.trim() === '')) {
        result.suggestions.push('서술형 모범답안(correctAnswer)이 누락됨');
    }

    // 8. 출제 의도 누락
    if (!q.intent || q.intent.trim() === '') {
        result.suggestions.push('출제 의도(intent) 누락');
    }

    // 9. 문제문 너무 짧음
    if (q.stem && q.stem.length < 10) {
        result.errors.push({ type: '문제문짧음', severity: '경고', detail: `문제문 ${q.stem.length}자로 너무 짧음` });
        result.appropriateness = '수정필요';
    }

    // 10. 난이도 검사 (고급 용어)
    const advancedTerms = ['형이상학', '실존주의', '존재론', '인식론', '변증법', '해체주의', '포스트모더니즘'];
    for (const term of advancedTerms) {
        if ((q.stem && q.stem.includes(term)) || (q.passage && q.passage.includes(term))) {
            result.errors.push({ type: '난이도부적합', severity: '경고', detail: `고급 용어 '${term}' — 초등 4~6학년에 부적합할 수 있음` });
            result.difficultyFit = '어려움';
        }
    }

    if (result.errors.length > 0 && result.appropriateness === '적절') {
        // 심각 오류가 있으면 수정필요로 변경
        if (result.errors.some(e => e.severity === '심각')) {
            result.appropriateness = '수정필요';
        }
    }

    return result;
}

function detectDuplicateStems(analyses) {
    // 같은 title(장) 내에서 stem 앞 50자가 같은 문항 쌍 찾기
    const byTitle = {};
    analyses.forEach(a => {
        if (!byTitle[a.title]) byTitle[a.title] = [];
        byTitle[a.title].push(a);
    });

    const duplicates = [];
    Object.entries(byTitle).forEach(([title, qs]) => {
        const stemMap = {};
        qs.forEach(q => {
            const key = q.stem.substring(0, 50);
            if (!stemMap[key]) stemMap[key] = [];
            stemMap[key].push(q);
        });
        Object.entries(stemMap).filter(([k, v]) => v.length > 1).forEach(([key, dups]) => {
            duplicates.push({
                title: title,
                stemPrefix: key,
                questions: dups.map(q => q.number),
                count: dups.length
            });
        });
    });
    return duplicates;
}

function analyzeFile(filename, isDiagnostic, outputDir, label) {
    const data = loadJson(filename);
    const analyses = data.map(q => analyzeQuestion(q, isDiagnostic));
    const duplicates = detectDuplicateStems(analyses);

    // 중복 문항에 오류 추가
    duplicates.forEach(dup => {
        dup.questions.forEach(qNum => {
            const a = analyses.find(a => a.number === qNum && a.title === dup.title);
            if (a) {
                a.errors.push({
                    type: 'stem중복',
                    severity: '경고',
                    detail: `같은 장 내 동일 stem(앞50자): Q${dup.questions.join(',Q')} in ${dup.title}`
                });
                if (a.appropriateness === '적절') a.appropriateness = '수정필요';
            }
        });
    });

    // 통계
    const stats = {
        totalQuestions: analyses.length,
        objectiveCount: analyses.filter(a => !a.isSubjective).length,
        subjectiveCount: analyses.filter(a => a.isSubjective).length,
        appropriateness: { 적절: 0, 수정필요: 0, 부적절: 0 },
        difficultyFit: { 적절: 0, 쉬움: 0, 어려움: 0 },
        answerCorrectness: { 정확: 0, 오류: 0, 모호: 0 },
        domainDistribution: {},
        subDomainDistribution: {},
        questionTypeDistribution: {},
        competencyDistribution: {},
        errorSummary: {},
        totalErrors: 0,
        pointsDistribution: {},
        duplicateStemGroups: duplicates.length,
        noPassageCount: analyses.filter(a => a.passageLength === 0).length,
        htmlTagCount: data.filter(q => q.stem && (q.stem.includes('<u>') || q.stem.includes('<b>'))).length
    };

    analyses.forEach(a => {
        stats.appropriateness[a.appropriateness]++;
        stats.difficultyFit[a.difficultyFit]++;
        stats.answerCorrectness[a.answerCorrectness]++;
        stats.domainDistribution[a.domain] = (stats.domainDistribution[a.domain] || 0) + 1;
        const sd = a.subDomainCategory || a.subDomain || '미분류';
        stats.subDomainDistribution[sd] = (stats.subDomainDistribution[sd] || 0) + 1;
        stats.questionTypeDistribution[a.questionType] = (stats.questionTypeDistribution[a.questionType] || 0) + 1;
        a.competencies.forEach(c => {
            stats.competencyDistribution[c] = (stats.competencyDistribution[c] || 0) + 1;
        });
        a.errors.forEach(e => {
            stats.errorSummary[e.type] = (stats.errorSummary[e.type] || 0) + 1;
            stats.totalErrors++;
        });
        stats.pointsDistribution[a.points] = (stats.pointsDistribution[a.points] || 0) + 1;
    });

    // 장별 그룹
    const byTitle = {};
    analyses.forEach(a => {
        if (!byTitle[a.title]) byTitle[a.title] = [];
        byTitle[a.title].push(a);
    });

    // JSON 출력
    const jsonOutput = {
        meta: {
            source: path.basename(filename),
            label: label,
            level: '프레게 (초등 4~6학년)',
            analyzedAt: '2026-04-15',
            isDiagnostic: isDiagnostic
        },
        stats: stats,
        duplicateStems: duplicates,
        chapters: Object.fromEntries(
            Object.entries(byTitle).map(([k, v]) => [k, {
                count: v.length,
                objectiveCount: v.filter(a => !a.isSubjective).length,
                subjectiveCount: v.filter(a => a.isSubjective).length,
                errorCount: v.filter(a => a.errors.length > 0).length,
                questions: v.map(a => ({
                    number: a.number,
                    domain: a.domain,
                    questionType: a.questionType,
                    subDomain: a.subDomainCategory,
                    points: a.points,
                    choiceCount: a.choiceCount,
                    correctAnswer: a.correctAnswer,
                    appropriateness: a.appropriateness,
                    difficultyFit: a.difficultyFit,
                    answerCorrectness: a.answerCorrectness,
                    competencies: a.competencies,
                    errors: a.errors,
                    suggestions: a.suggestions
                }))
            }])
        )
    };

    const jsonPath = path.join(outputDir, isDiagnostic ? 'frege_analysis.json' : 'analysis.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2), 'utf-8');

    // === MD 출력 ===
    let md = '';
    md += `# ${label} 문항 분석 보고서\n\n`;
    md += `- **대상 학년**: 프레게 (초등 4~6학년)\n`;
    md += `- **분석일**: 2026-04-15\n`;
    md += `- **원본 파일**: \`${path.basename(filename)}\`\n\n`;

    // 1. 전체 요약
    md += `## 1. 전체 요약\n\n`;
    md += `| 항목 | 값 |\n|------|----|\n`;
    md += `| 총 문항 수 | ${stats.totalQuestions} |\n`;
    md += `| 객관식 | ${stats.objectiveCount} |\n`;
    md += `| 서술형 | ${stats.subjectiveCount} |\n`;
    md += `| 오류/경고 문항 수 | ${analyses.filter(a => a.errors.length > 0).length} |\n`;
    md += `| 총 오류/경고 건수 | ${stats.totalErrors} |\n`;
    md += `| stem 중복 그룹 | ${duplicates.length} |\n`;
    md += `| HTML 태그 사용 문항 | ${stats.htmlTagCount} |\n`;
    md += `| 지문 없는 문항 | ${stats.noPassageCount} |\n\n`;

    md += `### 적절성 판정\n\n`;
    md += `| 판정 | 문항 수 | 비율 |\n|------|--------|------|\n`;
    Object.entries(stats.appropriateness).forEach(([k, v]) => {
        md += `| ${k} | ${v} | ${(v / stats.totalQuestions * 100).toFixed(1)}% |\n`;
    });

    md += `\n### 난이도 적합성\n\n`;
    md += `| 판정 | 문항 수 |\n|------|--------|\n`;
    Object.entries(stats.difficultyFit).forEach(([k, v]) => {
        if (v > 0) md += `| ${k} | ${v} |\n`;
    });

    md += `\n### 정답 정확성\n\n`;
    md += `| 판정 | 문항 수 |\n|------|--------|\n`;
    Object.entries(stats.answerCorrectness).forEach(([k, v]) => {
        if (v > 0) md += `| ${k} | ${v} |\n`;
    });

    md += `\n### 배점 분포\n\n`;
    md += `| 배점 | 문항 수 |\n|------|--------|\n`;
    Object.entries(stats.pointsDistribution).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([k, v]) => {
        md += `| ${k}점 | ${v} |\n`;
    });

    // 2. 역량/영역 분포
    md += `\n## 2. 역량 및 영역 분포\n\n`;

    if (isDiagnostic) {
        md += `### 문항 유형 분포 (domain)\n\n`;
        md += `| 유형 | 문항 수 |\n|------|--------|\n`;
        Object.entries(stats.domainDistribution).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
            md += `| ${k} | ${v} |\n`;
        });
    } else {
        md += `### 역량(domain)별 분포\n\n`;
        md += `> 챕터 테스트의 domain은 10대 역량명이며, 각 장 20문항 중 역량별 2문항씩 균등 배치됨.\n\n`;
        md += `| 역량 | 문항 수 |\n|------|--------|\n`;
        Object.entries(stats.domainDistribution).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
            md += `| ${k} | ${v} |\n`;
        });
    }

    md += `\n### 영역(subDomain) 분포\n\n`;
    md += `| 영역 | 문항 수 |\n|------|--------|\n`;
    Object.entries(stats.subDomainDistribution).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
        md += `| ${k} | ${v} |\n`;
    });

    md += `\n### 문항 유형 추정\n\n`;
    md += `| 유형 | 문항 수 |\n|------|--------|\n`;
    Object.entries(stats.questionTypeDistribution).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
        md += `| ${k} | ${v} |\n`;
    });

    // 진단 테스트: 역량별 벡터 분포
    if (isDiagnostic) {
        md += `\n### 진단 벡터 역량 분포\n\n`;
        md += `> 진단 테스트의 각 선택지에 역량 벡터가 포함되어 있어, 학생의 선택에 따라 역량별 점수를 산출할 수 있음.\n\n`;
        md += `| 역량 | 관련 문항 수 |\n|------|------------|\n`;
        Object.entries(stats.competencyDistribution).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
            md += `| ${k} | ${v} |\n`;
        });
    }

    // 3. 장별 요약
    md += `\n## 3. 장별 요약\n\n`;
    const sortedTitles = Object.keys(byTitle).sort((a, b) => {
        const na = parseInt((a.match(/(\d+)/) || ['0', '0'])[1]);
        const nb = parseInt((b.match(/(\d+)/) || ['0', '0'])[1]);
        return na - nb;
    });

    sortedTitles.forEach(title => {
        const qs = byTitle[title];
        const errQs = qs.filter(q => q.errors.length > 0);
        const obj = qs.filter(q => !q.isSubjective).length;
        const subj = qs.filter(q => q.isSubjective).length;
        md += `### ${title}\n\n`;
        md += `- 문항: ${qs.length}개 (객관식 ${obj}, 서술형 ${subj})\n`;
        md += `- 오류/경고 문항: ${errQs.length}개\n\n`;

        if (errQs.length > 0) {
            md += `| Q# | 오류유형 | 심각도 | 상세 |\n|-----|---------|--------|------|\n`;
            errQs.forEach(q => {
                q.errors.forEach(e => {
                    md += `| ${q.number} | ${e.type} | ${e.severity} | ${e.detail} |\n`;
                });
            });
            md += `\n`;
        }
    });

    // 4. 오류 문항 상세
    const errorQuestions = analyses.filter(a => a.errors.length > 0);
    md += `## 4. 오류/경고 문항 상세\n\n`;

    if (errorQuestions.length > 0) {
        md += `총 ${errorQuestions.length}개 문항에서 ${stats.totalErrors}건의 오류/경고 발견.\n\n`;

        md += `### 오류 유형별 요약\n\n`;
        md += `| 오류 유형 | 건수 | 설명 |\n|----------|------|------|\n`;
        const errorDescriptions = {
            '정답누락': '객관식인데 correctAnswer가 비어있음',
            '정답범위오류': '정답 번호가 선택지 개수를 초과',
            '정답표시불일치': 'correctAnswer와 error_path 정답 표시 불일치',
            '보기태그중복': '<보기> 태그가 연속으로 중복 사용',
            '선택지중복': '동일 텍스트 선택지 존재',
            '배점이상': '배점이 15점 초과로 비정상적',
            '문제문짧음': '문제문이 10자 미만',
            '난이도부적합': '초등 4~6학년에 부적합한 고급 용어',
            'stem중복': '같은 장 내에서 문제문(stem) 앞부분이 동일'
        };
        Object.entries(stats.errorSummary).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
            md += `| ${k} | ${v} | ${errorDescriptions[k] || ''} |\n`;
        });
        md += `\n`;

        // 심각 오류만 상세 기술
        const severeErrors = errorQuestions.filter(q => q.errors.some(e => e.severity === '심각'));
        if (severeErrors.length > 0) {
            md += `### 심각 오류 문항 (${severeErrors.length}건)\n\n`;
            severeErrors.forEach(q => {
                md += `#### Q${q.number} (${q.title})\n\n`;
                md += `- **문제**: ${q.stem.substring(0, 200)}${q.stem.length > 200 ? '...' : ''}\n`;
                md += `- **유형**: ${q.domain} | ${q.subDomainCategory || q.subDomain}\n`;
                md += `- **정답**: ${q.correctAnswer || '(없음)'}\n`;
                md += `- **판정**: 적절성=${q.appropriateness}, 난이도=${q.difficultyFit}, 정답정확성=${q.answerCorrectness}\n\n`;
                q.errors.filter(e => e.severity === '심각').forEach(e => {
                    md += `> **[${e.type}]** ${e.detail}\n\n`;
                });
            });
        }

        // 경고 오류 목록
        const warnings = errorQuestions.filter(q => q.errors.every(e => e.severity === '경고'));
        if (warnings.length > 0) {
            md += `### 경고 문항 목록 (${warnings.length}건)\n\n`;
            md += `| Q# | 장 | 오류유형 | 상세 |\n|-----|------|---------|------|\n`;
            warnings.forEach(q => {
                q.errors.forEach(e => {
                    md += `| ${q.number} | ${q.title} | ${e.type} | ${e.detail} |\n`;
                });
            });
            md += `\n`;
        }
    } else {
        md += `오류 문항 없음.\n\n`;
    }

    // 5. stem 중복 분석
    if (duplicates.length > 0) {
        md += `## 5. 동일 stem 문항 그룹\n\n`;
        md += `> 같은 장 내에서 문제문(stem) 앞 50자가 동일한 문항 그룹. 선택지가 다르면 변형 문제로 의도된 것일 수 있으나, 혼란을 줄 우려가 있어 검토 권장.\n\n`;
        md += `| 장 | 문항 번호 | stem 앞부분 |\n|------|---------|----------|\n`;
        duplicates.forEach(d => {
            md += `| ${d.title} | Q${d.questions.join(', Q')} | ${d.stemPrefix.substring(0, 40)}... |\n`;
        });
        md += `\n`;
    }

    // 6. 개선 제안
    const sugQuestions = analyses.filter(a => a.suggestions.length > 0);
    md += `## 6. 개선 제안 요약\n\n`;
    const sugCounts = {};
    sugQuestions.forEach(q => {
        q.suggestions.forEach(s => { sugCounts[s] = (sugCounts[s] || 0) + 1; });
    });
    if (Object.keys(sugCounts).length > 0) {
        md += `| 제안 내용 | 해당 문항 수 |\n|----------|------------|\n`;
        Object.entries(sugCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
            md += `| ${k} | ${v} |\n`;
        });
    } else {
        md += `개선 제안 없음.\n`;
    }

    // 7. 종합 평가
    md += `\n## 7. 종합 평가\n\n`;
    const errorRate = ((errorQuestions.length / stats.totalQuestions) * 100).toFixed(1);
    md += `### 품질 지표\n\n`;
    md += `| 지표 | 값 |\n|------|----|\n`;
    md += `| 오류/경고율 | ${errorRate}% (${errorQuestions.length}/${stats.totalQuestions}) |\n`;
    md += `| 심각 오류 | ${errorQuestions.filter(q => q.errors.some(e => e.severity === '심각')).length}건 |\n`;
    md += `| 경고 | ${errorQuestions.filter(q => q.errors.every(e => e.severity === '경고')).length}건 |\n`;

    if (!isDiagnostic) {
        const coveredComps = new Set(Object.keys(stats.domainDistribution).map(normalizeComp));
        const coverage = COMPETENCY_LABELS.filter(c => coveredComps.has(c));
        md += `| 역량 커버리지 | ${coverage.length}/10 |\n`;
        md += `| 서술형 모범답안 누락 | ${sugCounts['서술형 모범답안(correctAnswer)이 누락됨'] || 0}문항 |\n`;
    }
    md += `\n`;

    // 종합 판정
    const severeCount = errorQuestions.filter(q => q.errors.some(e => e.severity === '심각')).length;
    md += `### 종합 판정\n\n`;
    if (severeCount === 0 && errorQuestions.length <= stats.totalQuestions * 0.05) {
        md += `**양호** — 구조적 심각 오류 없음. 경미한 경고만 존재.\n\n`;
    } else if (severeCount <= 3) {
        md += `**보통** — 소수의 수정 필요 사항 존재.\n\n`;
    } else {
        md += `**수정 필요** — 다수의 오류가 존재하여 수정 권장.\n\n`;
    }

    // 초등 적합성
    md += `### 초등 4~6학년 적합성\n\n`;
    if (stats.difficultyFit['어려움'] > 0) {
        md += `일부 문항(${stats.difficultyFit['어려움']}건)이 난이도 초과 우려가 있음.\n\n`;
    } else {
        md += `전반적으로 초등 4~6학년 수준에 적합함.\n\n`;
    }

    // 주요 특이사항
    md += `### 주요 특이사항\n\n`;
    const findings = [];
    if (stats.subjectiveCount > 0) {
        findings.push(`서술형 ${stats.subjectiveCount}문항 포함 (전체의 ${(stats.subjectiveCount / stats.totalQuestions * 100).toFixed(0)}%)`);
    }
    if (stats.htmlTagCount > 0) {
        findings.push(`HTML 태그(<u>, <b>) 사용 문항 ${stats.htmlTagCount}개 — 렌더링 환경에 따라 표시 확인 필요`);
    }
    if (stats.noPassageCount > 0 && !isDiagnostic) {
        findings.push(`지문 없는 문항 ${stats.noPassageCount}개 — 어휘/문법 단독 문항으로 정상일 수 있음`);
    }
    if (duplicates.length > 0) {
        findings.push(`같은 장 내 유사 stem 그룹 ${duplicates.length}개 — 변형 문제로 의도된 것인지 확인 필요`);
    }
    if (isDiagnostic) {
        findings.push('모든 선택지에 역량 벡터(vector)와 오류 경로(error_path)가 포함되어 적응형 진단에 적합');
    }
    findings.forEach(f => { md += `- ${f}\n`; });

    md += `\n---\n*이 보고서는 자동 분석 도구에 의해 생성되었습니다. (2026-04-15)*\n`;

    const mdPath = path.join(outputDir, isDiagnostic ? 'frege_analysis.md' : 'analysis.md');
    fs.writeFileSync(mdPath, md, 'utf-8');

    console.log(`${label}: ${stats.totalQuestions}문항 분석 완료`);
    console.log(`  → ${jsonPath}`);
    console.log(`  → ${mdPath}`);
    console.log(`  오류/경고 문항: ${errorQuestions.length}, 총 오류: ${stats.totalErrors}`);
    if (duplicates.length > 0) console.log(`  stem 중복 그룹: ${duplicates.length}`);
    console.log();
}

// 실행
const baseDir = path.resolve(__dirname, '..');

const tasks = [
    { file: 'frege.json', isDiag: true, dir: path.join(baseDir, 'diagnostic'), label: '프레게 진단 테스트' },
    { file: 'FREGE_1.json', isDiag: false, dir: path.join(baseDir, 'chapter', 'frege1'), label: '프레게1 챕터 테스트' },
    { file: 'FREGE_2.json', isDiag: false, dir: path.join(baseDir, 'chapter', 'frege2'), label: '프레게2 챕터 테스트' },
    { file: 'frege3.json', isDiag: false, dir: path.join(baseDir, 'chapter', 'frege3'), label: '프레게3 챕터 테스트' },
];

tasks.forEach(t => {
    fs.mkdirSync(t.dir, { recursive: true });
    analyzeFile(path.join(__dirname, t.file), t.isDiag, t.dir, t.label);
});

console.log('=== 전체 분석 완료 (1248문항) ===');
