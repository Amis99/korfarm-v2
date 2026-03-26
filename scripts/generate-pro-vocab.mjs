#!/usr/bin/env node
/**
 * 프로모드 어휘 학습 콘텐츠 전체 생성 스크립트 (v2 — 품질 개선)
 * 180챕터 × 어휘 기본 학습(A1~A3) + 사전 학습(B4~B5) 문제 생성
 *
 * v2 수정사항:
 * - 품사 감지 전면 개선 (형용사/관형사/부사/동사 정확 분류)
 * - 활용형 정규화 (헤아리는→헤아리다, 희미해졌다→희미하다 등)
 * - 조사 자동 선택 (받침 유무 기반 을/를, 이/가, 은/는)
 * - 예문 품질 개선 (변별력 있는 A3 fallback, 비문 제거)
 * - HTML 태그/개행/마크업 정리
 * - dictEntry example 자연스러운 예문
 *
 * 출력: generated/pro-vocab/{levelId}_ch{NN}.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const MANUSCRIPT_DIR = join(ROOT, '프로모드 원고');
const OUTPUT_DIR = join(ROOT, 'generated', 'pro-vocab');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── 레벨 설정 ───
const LEVELS = [
  { folder: '소쉬르1', levelId: 'saussure1', prefix: '소쉬르1', type: 'saussure', chapCount: 20 },
  { folder: '소쉬르2', levelId: 'saussure2', prefix: '소쉬르2', type: 'saussure', chapCount: 20 },
  { folder: '소쉬르3', levelId: 'saussure3', prefix: '소쉬르3', type: 'saussure', chapCount: 20 },
  { folder: '프레게1', levelId: 'frege1', prefix: '프레게1', type: 'frege', chapCount: 20 },
  { folder: '프레게2', levelId: 'frege2', prefix: '프레게2', type: 'frege', chapCount: 20 },
  { folder: '프레게3', levelId: 'frege3', prefix: '프레게3', type: 'russell', chapCount: 20 },
  { folder: '러셀1', levelId: 'russell1', prefix: '러셀1', type: 'russell', chapCount: 20 },
  { folder: '러셀2', levelId: 'russell2', prefix: '러셀2', type: 'russell', chapCount: 20 },
  { folder: '러셀3', levelId: 'russell3', prefix: '러셀3', type: 'russell', chapCount: 20 },
];

// ─── 원문자 ↔ 숫자 변환 ───
const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'.split('');
function circledToNum(s) {
  const cleaned = String(s).trim().replace(/\*+/g, '').trim();
  const idx = CIRCLED.indexOf(cleaned);
  return idx >= 0 ? String(idx + 1) : cleaned;
}

// ─── 한글 받침 검사 → 조사 선택 ───
function hasBatchim(word) {
  if (!word || word.length === 0) return false;
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xAC00 || last > 0xD7A3) return false; // 비한글 → 받침 없음 취급
  return (last - 0xAC00) % 28 !== 0;
}
function josa(word, type) {
  const b = hasBatchim(word);
  switch (type) {
    case '을를': return b ? '을' : '를';
    case '이가': return b ? '이' : '가';
    case '은는': return b ? '은' : '는';
    case '과와': return b ? '과' : '와';
    default: return '';
  }
}

// ─── 텍스트 정리 (HTML 태그, 마크업, 개행, 이중 마침표) ───
function cleanText(text) {
  if (!text) return '';
  return String(text)
    .replace(/<[^>]+>/g, '')           // HTML 태그 제거
    .replace(/㉠|㉡|㉢|㉣|㉤/g, '')    // 원문자 마크 제거
    .replace(/\n/g, ' ')              // 개행 → 공백
    .replace(/\s{2,}/g, ' ')          // 다중 공백 정리
    .replace(/\.{2,}/g, '.')          // 이중 마침표 제거
    .trim();
}

// ─── 활용형 정규화 (용언 활용형 → 기본형) ───
function normalizeWord(word) {
  let w = String(word).trim();
  // 마크다운 볼드 제거
  w = w.replace(/\*+/g, '').trim();

  // ~해졌다/~해지면 → ~하다 (희미해졌다→희미하다, 흔해지면→흔하다)
  if (/(.+)해졌다$/.test(w)) return w.replace(/해졌다$/, '하다');
  if (/(.+)해지면$/.test(w)) return w.replace(/해지면$/, '하다');
  if (/(.+)해져$/.test(w)) return w.replace(/해져$/, '하다');
  // ~하기 → ~하다 (감상하기→감상하다)
  if (/(.+)하기$/.test(w)) return w.replace(/하기$/, '하다');
  // ~하게 → ~하다 (과감하게→과감하다, 신성하게→신성하다)
  if (/(.+[가-힣])하게$/.test(w)) return w.replace(/하게$/, '하다');
  // ~기는/~기를 → ~다
  if (/(.+)기는$/.test(w)) return w.replace(/기는$/, '다');
  // 관형사형: ~리는/~치는/~기는 → ~리다/~치다/~기다 (헤아리는→헤아리다, 부추기는→부추기다)
  if (/(.+[리기치키피])는$/.test(w)) return w.replace(/는$/, '다');
  // ~하는 → ~하다 (도달하는→도달하다)
  if (/(.+)하는$/.test(w)) return w.replace(/하는$/, '다');
  // ~적으로 → ~적 (상대적으로→상대적)
  if (/(.+)적으로$/.test(w)) return w.replace(/적으로$/, '적');

  return w;
}

// ─── 원고 읽기 (BOM 처리) ───
function readMs(level, chapterNum) {
  const dir = join(MANUSCRIPT_DIR, level.folder);
  const patterns = [
    `${level.prefix} (챕터${chapterNum}).json`,
    `${level.prefix}(챕터${chapterNum}).json`,
    `${level.prefix} (챕터 ${chapterNum}).json`,
  ];
  for (const p of patterns) {
    const fp = join(dir, p);
    if (existsSync(fp)) {
      let raw = readFileSync(fp, 'utf-8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      try { return JSON.parse(raw); }
      catch (e) { console.warn(`  JSON 파싱 에러: ${fp} — ${e.message}`); return null; }
    }
  }
  console.warn(`  원고 없음: ${level.folder}/챕터${chapterNum}`);
  return null;
}

// ─── 어휘 추출 (레벨 타입별) ───
function extractVocab(ms, level) {
  if (!ms) return [];
  const words = [];

  if (level.type === 'saussure') {
    const concept = ms['개념'];
    if (concept) {
      const list = concept['개념_어휘_목록'] || [];
      for (const item of list) {
        if (typeof item === 'string') {
          const match = item.match(/^(.+?)[:：\-–]\s*(.+)$/);
          if (match) {
            words.push({ word: cleanText(match[1]), meaning: cleanText(match[2]) });
          }
        } else {
          const w = cleanText(item['어휘'] || item.어휘 || '');
          const m = cleanText(item['뜻'] || item.뜻 || '');
          if (w && m) words.push({ word: w, meaning: m });
        }
      }
    }
  } else if (level.type === 'frege') {
    const vocab = ms['어휘'];
    if (vocab) {
      const list = vocab['어휘_목록'] || [];
      for (const item of list) {
        let w = String(item['어휘'] || item.어휘 || '');
        w = w.replace(/\(.*?\)/g, '').replace(/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]\s*/, '').trim();
        w = cleanText(w);
        const m = cleanText(item['뜻'] || item.뜻 || '');
        if (w && m) words.push({ word: w, meaning: m });
      }
    }
  } else if (level.type === 'russell') {
    const nonfic = ms['비문학'];
    if (nonfic) {
      const list = nonfic['비문학_어휘'] || [];
      const rawAnswers = nonfic['비문학_어휘_정답'] || {};
      const parsedAnswers = {};
      for (const [key, val] of Object.entries(rawAnswers)) {
        const num = circledToNum(key);
        const valStr = String(val).trim();
        const combinedParts = valStr.split(/\s+(?=[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])/);
        if (combinedParts.length > 1) {
          parsedAnswers[num] = combinedParts[0].trim();
          for (let i = 1; i < combinedParts.length; i++) {
            const match = combinedParts[i].match(/^([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])\s*(.+)/);
            if (match) parsedAnswers[circledToNum(match[1])] = match[2].trim();
          }
        } else {
          parsedAnswers[num] = valStr;
        }
      }
      for (const item of list) {
        const num = circledToNum(item['번호'] || item.번호 || '');
        const m = cleanText(item['의미'] || item.의미 || '');
        let w = cleanText(parsedAnswers[num] || '');
        // 활용형 정규화
        w = normalizeWord(w);
        if (w && m) words.push({ word: w, meaning: m });
      }
    }
  }

  // 중복 제거
  const seen = new Set();
  return words.filter(item => {
    if (seen.has(item.word)) return false;
    seen.add(item.word);
    return true;
  });
}

// ─── 지문 텍스트 수집 (예문 검색용) ───
function collectPassageText(ms) {
  if (!ms) return '';
  const texts = [];
  for (const secName of ['개념', '비문학', '문학', '문법']) {
    const sec = ms[secName];
    if (!sec || typeof sec !== 'object') continue;
    for (const [k, v] of Object.entries(sec)) {
      if (k.includes('지문') && typeof v === 'string' && v.length > 30) {
        texts.push(cleanText(v));
      }
    }
  }
  return texts.join('\n\n');
}

// ─── 품사 추정 (v2 — 전면 개선) ───
// 형용사-하다 어근 (상태/성질 묘사)
const ADJ_HADA_ROOTS = new Set([
  '간절', '강렬', '건전', '경이', '고귀', '고요', '고적', '공정', '과감', '광활',
  '그윽', '긴요', '긴절', '까다', '난해', '냉정', '놀', '다양', '다정', '단순',
  '당당', '대담', '독특', '둔감', '따뜻', '막연', '명확', '무난', '무한', '민감',
  '불공평', '불완전', '비참', '사소', '산뜻', '생생', '서늘', '선명', '섬세', '소박',
  '소중', '솔직', '순수', '숭고', '시원', '신선', '신성', '신중', '심각', '심오',
  '쓸쓸', '아늑', '암울', '애매', '엄격', '엄숙', '여유', '열렬', '온화', '완만',
  '우아', '위대', '유능', '유사', '유용', '적절', '정교', '정밀', '정확', '조용',
  '중대', '중요', '지루', '진지', '참담', '처참', '청결', '충분', '치밀', '탁월',
  '투명', '특이', '편안', '평화', '풍부', '필요', '한가', '허무', '현명', '화목',
  '화려', '확실', '활발', '황당', '훌륭', '흔', '희미',
  // ~적하다 어근
  '합리', '비판', '기능', '적대', '독자', '인공', '기하학', '합헌', '탄력', '비탄력',
  '역동', '화학', '내재', '획일', '상대', '주체', '객관', '주관', '전기',
]);

function detectPos(word, meaning) {
  const w = word;
  const m = meaning;

  // 1. ~적(인/으로) → 관형사
  if (/적(인)?$/.test(w) && w.length >= 3) return '관형사';

  // 2. 명시적 부사 목록 및 패턴
  const ADVERBS = ['무심코', '골고루', '기꺼이', '스스로', '서로', '모두', '점점', '결코',
    '매우', '가장', '몹시', '겨우', '비로소', '마침내', '끝내', '도무지'];
  if (ADVERBS.includes(w)) return '부사';
  // ~이 부사 (살랑살랑→X, 무심코→O는 이미 위에서 처리)
  if (/^[가-힣]+이$/.test(w) && m.includes('마음으로')) return '부사';

  // 3. ~하다 용언: 형용사 vs 동사
  if (w.endsWith('하다') && w.length >= 3) {
    const root = w.slice(0, -2);
    if (ADJ_HADA_ROOTS.has(root)) return '형용사';
    // 의미 기반: 상태/성질 묘사이면 형용사
    if (/상태|성질|느낌|모습|모양|기분|정도|차분|고요|조용|한적/.test(m)) return '형용사';
    return '동사';
  }

  // 4. ~다 용언 (하다 아닌)
  if (w.endsWith('다') && w.length >= 2) {
    // 알려진 형용사
    const ADJ_DA = ['시리다', '우렁차다', '차다', '밝다', '넓다', '높다', '깊다', '짧다',
      '길다', '크다', '작다', '맑다', '춥다', '덥다', '곱다', '슬프다', '기쁘다',
      '무섭다', '아프다', '예쁘다'];
    if (ADJ_DA.includes(w)) return '형용사';
    // 기본: 동사
    return '동사';
  }

  // 5. ~한/~된 관형사형 → 형용사 취급 (유일한, 고유한, 독립된, 무난한, 불완전한, 정밀한, 애매한, 무한한)
  if (w.endsWith('한') || w.endsWith('된')) {
    if (w.length >= 3) return '형용사';
  }

  // 6. ~게 부사형 → 부사
  if (w.endsWith('하게') || w.endsWith('스럽게') || w.endsWith('적으로')) {
    return '부사';
  }

  // 7. 관용구 (귀를 기울이다 등)
  if (w.includes(' ') && (w.endsWith('다') || w.endsWith('이다'))) return '동사';

  // 8. 의태어/의성어 (파릇파릇, 살랑살랑, 울퉁불퉁 등 — ABAB/AABB 반복형만)
  if (/^(.{2})\1$/.test(w)) return '부사'; // 4글자 ABAB (살랑살랑)
  if (/^(.{3})\1$/.test(w)) return '부사'; // 6글자 ABCABC (알록달록은 아니지만 패턴)
  if (/^(.)\1(.)\2$/.test(w)) return '부사'; // AABB (깔깔, 졸졸 — 드뭄)

  // 9. 기본: 명사
  return '명사';
}

// ─── 사전 엔트리 생성 (v2 — 조사 자동 선택, 자연스러운 예문) ───
function buildDictEntry(word, meaning, pos) {
  let example;
  switch (pos) {
    case '동사':
      example = `${word.replace(/다$/, '')}는 것이 중요하다.`;
      break;
    case '형용사':
      example = `그 모습이 매우 ${word.endsWith('다') ? word.replace(/다$/, '') + (hasBatchim(word.replace(/다$/, '')) ? '' : '') : word}다.`;
      // 더 간단하게
      example = `매우 ${word.endsWith('한') ? word : word.endsWith('다') ? word.replace(/다$/, 'ㄴ') : word} 모습이다.`;
      // 활용이 복잡하니 단순 처리
      example = `${word} — 상태나 성질을 나타낸다.`;
      break;
    case '부사':
      example = `${word} — 정도나 양상을 나타내는 말.`;
      break;
    case '관형사':
      example = `${word} 태도가 필요하다.`;
      break;
    default: // 명사
      example = `${word}${josa(word, '을를')} 이해하다.`;
      break;
  }

  return {
    word,
    pos,
    defs: [{
      num: 1,
      definition: `[${pos}] ${meaning}.`,
      example
    }]
  };
}

// ─── 지문에서 예문 찾기 (v2 — 완전한 문장, 비본문 필터링) ───
function findExampleInPassage(word, passageText) {
  if (!passageText || word.length < 2) return null;
  const sentences = passageText.split(/[.?!。]\s*/).filter(s => s.length > 15 && s.length < 130);
  for (const s of sentences) {
    if (!s.includes(word)) continue;
    // 비본문 텍스트 필터 (목록/마커/예시 등)
    if (/[*•↔→←]|예시:|예:|참고:|출처:/.test(s)) continue;
    // 1글자 단어 → 부분 매칭 위험
    if (word.length <= 1) continue;
    const clean = s.trim();
    if (clean.length > 15 && clean.length < 120) {
      return clean + '.';
    }
  }
  return null;
}

// ─── 예문 생성 (v2 — 품사별 자연스러운 fallback) ───
function generateExample(word, pos, passageText) {
  // 지문에서 찾기
  const fromPassage = findExampleInPassage(word, passageText);
  if (fromPassage) return fromPassage;

  // 품사별 다양한 fallback 예문
  const w = word;
  const eul = josa(w, '을를');
  const i = josa(w, '이가');
  const eun = josa(w, '은는');

  switch (pos) {
    case '동사':
      return `우리는 함께 ${w.replace(/다$/, '')}기로 했다.`;
    case '형용사':
      if (w.endsWith('하다')) {
        return `이 작품은 매우 ${w.replace(/하다$/, '')}하다.`;
      } else if (w.endsWith('한')) {
        return `${w} 결과를 얻었다.`;
      } else if (w.endsWith('다')) {
        return `날씨가 ${w.replace(/다$/, '')}다.`;
      }
      return `그것은 정말 ${w}.`;
    case '부사':
      return `그는 ${w} 노력했다.`;
    case '관형사':
      return `${w}인 판단이 필요하다.`;
    default: // 명사
      // 다양한 패턴 (단어에 따라 달라지게)
      const hash = w.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const templates = [
        `${w}${eun} 중요한 개념이다.`,
        `이 글에서 ${w}${eul} 설명하고 있다.`,
        `${w}${i} 무엇인지 알아보자.`,
        `${w}에 대해 깊이 생각해 보았다.`,
      ];
      return templates[hash % templates.length];
  }
}

// ─── 셔플 (Fisher-Yates) ───
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── 선택지 생성 (정답 + 오답 셔플) ───
function makeChoices(correctText, distractorTexts) {
  const items = [
    { text: correctText, correct: true },
    ...distractorTexts.slice(0, 3).map(t => ({ text: t, correct: false }))
  ];
  const shuffled = shuffle(items);
  const ids = ['A', 'B', 'C', 'D'];
  return {
    choices: shuffled.map((item, i) => ({ id: ids[i], text: item.text })),
    answerId: ids[shuffled.findIndex(item => item.correct)]
  };
}

// ─── 오답 풀에서 N개 선택 ───
function pickDistractors(pool, correctValue, n = 3) {
  const filtered = pool.filter(v => v !== correctValue);
  const picked = shuffle(filtered).slice(0, n);
  const fallbacks = ['정보', '관계', '구조', '변화', '과정', '영향', '결과', '원인', '특징', '방법'];
  while (picked.length < n) {
    const fb = fallbacks.find(f => f !== correctValue && !picked.includes(f));
    if (fb) picked.push(fb);
    else break;
  }
  return picked;
}

// ─── 품사 오답 ───
function posDistractors(correctPos) {
  const all = ['명사', '동사', '형용사', '부사', '관형사', '감탄사'];
  return all.filter(p => p !== correctPos).slice(0, 3);
}

// ─── FILL_BLANKS 용 choice ID ───
function makeFillChoices(correctText, distractorTexts) {
  const items = [
    { text: correctText, correct: true },
    ...distractorTexts.slice(0, 3).map(t => ({ text: t, correct: false }))
  ];
  const shuffled = shuffle(items);
  return {
    choices: shuffled.map((item, i) => ({ id: `c${i + 1}`, text: item.text })),
    answerId: `c${shuffled.findIndex(item => item.correct) + 1}`
  };
}

// ═══════════════════════════════════════════════
// 문제 유형별 생성 함수
// ═══════════════════════════════════════════════

const SCORING = { correctDeltaSec: 10, wrongDeltaSec: -10 };

// A1: 낱말 → 뜻 (MULTI_CHOICE)
function genA1(wordItem, allWords, qIdx) {
  const meaningPool = allWords.map(w => w.meaning);
  const { choices, answerId } = makeChoices(
    wordItem.meaning,
    pickDistractors(meaningPool, wordItem.meaning)
  );
  return {
    id: `q${qIdx}`, type: 'MULTI_CHOICE', questionCategory: 'A1',
    stem: `'${wordItem.word}'의 뜻으로 알맞은 것은?`,
    choices, answerId, scoring: SCORING
  };
}

// A2: 뜻 → 낱말 (MULTI_CHOICE)
function genA2(wordItem, allWords, qIdx) {
  const wordPool = allWords.map(w => w.word);
  const { choices, answerId } = makeChoices(
    wordItem.word,
    pickDistractors(wordPool, wordItem.word)
  );
  return {
    id: `q${qIdx}`, type: 'MULTI_CHOICE', questionCategory: 'A2',
    stem: `'${wordItem.meaning}'${josa(wordItem.meaning, '을를')} 뜻하는 낱말은?`,
    choices, answerId, scoring: SCORING
  };
}

// A3: 용례 빈칸 (FILL_BLANKS) — v2: 변별력 있는 예문
function genA3(wordItem, allWords, qIdx, passageText) {
  const example = generateExample(wordItem.word, wordItem.pos, passageText);
  let template;
  if (example.includes(wordItem.word)) {
    template = example.replace(wordItem.word, '(    )');
  } else {
    // fallback: 단어 특화 예문 (품사별)
    const w = wordItem.word;
    const eul = josa(w, '을를');
    const eun = josa(w, '은는');
    switch (wordItem.pos) {
      case '동사':
        template = `우리는 함께 (    )기로 했다.`;
        break;
      case '형용사':
        template = `이 작품은 매우 (    ).`;
        break;
      case '부사':
        template = `그는 (    ) 노력했다.`;
        break;
      case '관형사':
        template = `(    )인 판단이 필요하다.`;
        break;
      default:
        template = `${wordItem.meaning}${josa(wordItem.meaning, '을를')} 뜻하는 단어는 (    )이다.`;
        break;
    }
  }

  const wordPool = allWords.map(w => w.word);
  const { choices, answerId } = makeFillChoices(
    wordItem.word,
    pickDistractors(wordPool, wordItem.word)
  );

  return {
    id: `q${qIdx}`, type: 'FILL_BLANKS', questionCategory: 'A3',
    template,
    blanks: [{ id: 'b1', answerId, choices }],
    scoring: SCORING
  };
}

// B4: 사전적 의미 → 낱말 (MULTI_CHOICE)
function genB4(wordItem, allWords, qIdx) {
  const dictDef = `[${wordItem.pos}] ${wordItem.meaning}.`;
  const wordPool = allWords.map(w => w.word);
  const { choices, answerId } = makeChoices(
    wordItem.word,
    pickDistractors(wordPool, wordItem.word)
  );
  return {
    id: `q${qIdx}`, type: 'MULTI_CHOICE', questionCategory: 'B4',
    stem: `${dictDef} — 이 뜻을 가진 낱말은?`,
    choices, answerId, scoring: SCORING
  };
}

// B5: 사전적 의미 완성 (FILL_BLANKS, 다중 빈칸)
function genB5(wordItem, allWords, qIdx) {
  const pos = wordItem.pos;
  const meaning = wordItem.meaning;
  const blanks = [];
  let blankIdx = 0;

  // 빈칸 1: 품사
  blankIdx++;
  const { choices: posChoices, answerId: posAns } = makeFillChoices(pos, posDistractors(pos));
  blanks.push({ id: `b${blankIdx}`, answerId: posAns, choices: posChoices });

  // 의미를 토큰으로 분리
  const tokens = meaning.split(/\s+/).filter(Boolean);
  const skipTokens = new Set(['것', '수', '일', '때', '등', '또는', '및', '그', '이', '저']);
  const candidates = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].length >= 2 && !skipTokens.has(tokens[i])) {
      candidates.push({ token: tokens[i], index: i });
    }
  }

  const toBlank = [];
  if (candidates.length >= 2) {
    toBlank.push(candidates[0]);
    if (candidates[candidates.length - 1].index !== candidates[0].index) {
      toBlank.push(candidates[candidates.length - 1]);
    }
  } else if (candidates.length === 1) {
    toBlank.push(candidates[0]);
  }

  const tokenPools = new Map();
  for (const bItem of toBlank) {
    const pool = [];
    for (const w of allWords) {
      if (w.word === wordItem.word) continue;
      const otherTokens = w.meaning.split(/\s+/).filter(t => t.length >= 2);
      pool.push(...otherTokens);
    }
    tokenPools.set(bItem.index, [...new Set(pool)]);
  }

  const templateTokens = [...tokens];
  for (const bItem of toBlank) {
    blankIdx++;
    const pool = tokenPools.get(bItem.index) || [];
    const { choices, answerId } = makeFillChoices(bItem.token, pickDistractors(pool, bItem.token));
    blanks.push({ id: `b${blankIdx}`, answerId, choices });
    templateTokens[bItem.index] = '___';
  }

  const template = `${wordItem.word} : [___] ${templateTokens.join(' ')}.`;

  return {
    id: `q${qIdx}`, type: 'FILL_BLANKS', questionCategory: 'B5',
    template, blanks, scoring: SCORING
  };
}

// ═══════════════════════════════════════════════
// 챕터 생성
// ═══════════════════════════════════════════════

function generateChapter(level, chapterNum) {
  const ms = readMs(level, chapterNum);
  if (!ms) return null;

  const rawWords = extractVocab(ms, level);
  if (rawWords.length === 0) {
    console.warn(`  어휘 없음: ${level.levelId} ch${chapterNum}`);
    return null;
  }
  if (rawWords.length < 4) {
    console.warn(`  어휘 부족 (${rawWords.length}개): ${level.levelId} ch${chapterNum} — 건너뜀`);
    return null;
  }

  const passageText = collectPassageText(ms);

  const wordList = rawWords.map(item => {
    const pos = detectPos(item.word, item.meaning);
    const example = generateExample(item.word, pos, passageText);
    return {
      word: item.word,
      meaning: item.meaning,
      pos,
      dictEntry: buildDictEntry(item.word, item.meaning, pos),
      examples: [example]
    };
  });

  const questions = [];
  let qIdx = 0;

  for (const wordItem of wordList) {
    qIdx++; questions.push(genA1(wordItem, wordList, qIdx));
    qIdx++; questions.push(genA2(wordItem, wordList, qIdx));
    qIdx++; questions.push(genA3(wordItem, wordList, qIdx, passageText));
    qIdx++; questions.push(genB4(wordItem, wordList, qIdx));
    qIdx++; questions.push(genB5(wordItem, wordList, qIdx));
  }

  return {
    contentType: 'PRO_VOCAB',
    title: `${level.prefix} ${chapterNum}장 어휘`,
    targetLevel: level.levelId,
    area: 'VOCAB',
    subArea: 'PRO',
    timeLimitSec: 300,
    seedReward: { seedType: 'seed_wheat', count: 3, multiplier: 1 },
    payload: {
      wordList: wordList.map(w => ({
        word: w.word, meaning: w.meaning,
        dictEntry: w.dictEntry, examples: w.examples
      })),
      questions
    }
  };
}

// ═══════════════════════════════════════════════
// 메인 실행
// ═══════════════════════════════════════════════

let totalFiles = 0, totalWords = 0, totalQuestions = 0;

for (const level of LEVELS) {
  console.log(`\n━━━ ${level.prefix} (${level.levelId}) ━━━`);
  for (let ch = 1; ch <= level.chapCount; ch++) {
    const data = generateChapter(level, ch);
    if (!data) continue;
    const fileName = `${level.levelId}_ch${String(ch).padStart(2, '0')}.json`;
    writeFileSync(join(OUTPUT_DIR, fileName), JSON.stringify(data, null, 2), 'utf-8');
    const wc = data.payload.wordList.length;
    const qc = data.payload.questions.length;
    totalWords += wc; totalQuestions += qc; totalFiles++;
    console.log(`  ✓ ${fileName} — ${wc}어휘, ${qc}문제`);
  }
}

console.log(`\n═══════════════════════════════════════════`);
console.log(`완료: ${totalFiles}파일, ${totalWords}어휘, ${totalQuestions}문제`);
console.log(`출력: ${OUTPUT_DIR}`);
