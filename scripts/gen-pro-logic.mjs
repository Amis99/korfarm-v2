/**
 * 프로모드 논리사고력 JSON 생성 스크립트
 * 러셀2(ch11~20) + 러셀3(ch01~20) = 30개 파일
 * 각 파일당 20개 지문, 10가지 논리 유형 x 2개씩
 */
import fs from 'fs';
import path from 'path';

const BASE = 'C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지';
const RAW = JSON.parse(fs.readFileSync(path.join(BASE, 'generated/pro-logic/_raw_texts.json'), 'utf8'));
const OUT_DIR = path.join(BASE, 'generated/pro-logic');

const LOGIC_TYPES = [
  { logicType: 'hidden_premise', title: '숨겨진 전제 찾기' },
  { logicType: 'consequence', title: '결과 추론하기' },
  { logicType: 'syllogism', title: '삼단논법 추론하기' },
  { logicType: 'necessary_transform', title: '필요조건 변환' },
  { logicType: 'necessary_example', title: '필요조건 예시 찾기' },
  { logicType: 'sufficient_transform', title: '충분조건 변환' },
  { logicType: 'sufficient_example', title: '충분조건 예시 찾기' },
  { logicType: 'validity', title: '타당성 판단' },
  { logicType: 'correlation', title: '상관관계' },
  { logicType: 'hypothesis', title: '가설 검증' },
];

const ANSWERS = ['A', 'B', 'C', 'D'];

// ===== 유틸리티 함수들 =====

function splitSentences(text) {
  if (!text) return [];
  const clean = text.replace(/\u3000/g, ' ').replace(/\\n/g, ' ').replace(/\n/g, ' ').trim();
  return clean.split(/(?<=[.?!])\s+/).filter(s => s.length > 15);
}

function pickSentences(sentences, start, count) {
  if (sentences.length === 0) return '';
  const picked = [];
  for (let i = 0; i < count; i++) {
    picked.push(sentences[(start + i) % sentences.length]);
  }
  return picked.join(' ');
}

// 조사 제거 함수
function removeParticle(word) {
  const particles = [
    '에서는', '에서의', '에서도', '에서', '으로부터', '로부터',
    '에게서', '에게는', '에게도', '에게',
    '으로는', '으로도', '으로', '로는', '로도', '로서', '로써',
    '과는', '와는', '이란', '란',
    '에는', '에도', '에의', '에만',
    '까지는', '까지도', '까지',
    '마저', '조차', '부터',
    '이라는', '라는', '이라고', '라고', '이라', '이었다',
    '했다', '하는', '하여', '하고', '하면', '한다', '하며',
    '되는', '되어', '되고', '된다', '되면', '되었다',
    '있는', '없는', '있다', '없다',
    '이며', '이고', '이다', '이면', '이나', '이라면',
    '인', '은', '는', '이', '가', '을', '를', '의',
    '과', '와', '에', '도', '만', '로',
  ];
  for (const p of particles) {
    if (word.length > p.length + 1 && word.endsWith(p)) {
      return word.slice(0, -p.length);
    }
  }
  return word;
}

// 지문에서 핵심 명사 키워드 추출
function extractKeywords(text, count = 5) {
  const words = text
    .replace(/[^가-힣\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length >= 2)
    .map(removeParticle)
    .filter(w => w.length >= 2 && w.length <= 8);

  // 불용어 (대명사, 접속사, 부사, 일반 서술어 등)
  const stopwords = new Set([
    '것이', '이것', '그것', '때문', '하지', '않는', '위해', '대해', '통해',
    '이를', '그래서', '하지만', '그런데', '따라서', '그러나', '이처럼', '이러한',
    '또한', '특히', '즉', '곧', '바로', '이때', '이후', '이전', '이런',
    '같은', '다른', '모든', '어떤', '여러', '그는', '그녀', '우리', '나는',
    '것을', '수가', '수는', '있을', '없을', '것은', '것으로',
    '세기', '앞부분', '줄거리', '자신', '사람', '경우', '정도', '부분',
    '처럼', '만약', '그리고', '때문에', '대해서', '깊은', '곳에',
    '아래', '위에', '앞에', '뒤에', '사이', '속에', '안에', '밖에',
    '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열',
    '마음', '것을', '수를', '점에', '쪽에', '때에', '이후에', '그때',
    '말을', '수도', '그의', '이를', '이런', '저런', '그런',
    '차지', '나누', '비슷', '구별', '비롯', '관련', '해당',
  ]);

  const freq = {};
  for (const w of words) {
    if (stopwords.has(w)) continue;
    if (w.length < 2 || w.length > 6) continue;
    freq[w] = (freq[w] || 0) + 1;
  }

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0]);

  while (sorted.length < count) sorted.push('현상');
  return sorted.slice(0, count);
}

// 받침 유무 판별 (한글 마지막 글자 기준)
function hasBatchim(word) {
  if (!word || word.length === 0) return false;
  const lastChar = word.charCodeAt(word.length - 1);
  if (lastChar < 0xAC00 || lastChar > 0xD7A3) return false; // 한글 범위 밖
  return (lastChar - 0xAC00) % 28 !== 0;
}

// 자연스러운 조사 붙이기
function subj(w) { return w + (hasBatchim(w) ? '이' : '가'); }     // 주격
function obj(w) { return w + (hasBatchim(w) ? '을' : '를'); }      // 목적격
function topic(w) { return w + (hasBatchim(w) ? '은' : '는'); }    // 주제
function conj(w) { return w + (hasBatchim(w) ? '과' : '와'); }     // 접속

function makeChoices(answerId, texts) {
  const ids = ['A', 'B', 'C', 'D'];
  const ansIdx = ids.indexOf(answerId);
  const result = [];
  let wrongIdx = 1;
  for (let i = 0; i < 4; i++) {
    if (i === ansIdx) {
      result.push({ id: ids[i], text: texts[0] });
    } else {
      result.push({ id: ids[i], text: texts[wrongIdx] });
      wrongIdx++;
    }
  }
  return result;
}

// ===== 문제 템플릿 =====
// kws = [k0, k1, k2, k3, k4] 키워드 배열
// S=subj, O=obj, T=topic, C=conj 헬퍼 사용

const questionTemplates = {
  hidden_premise: [
    {
      stem: (kws, adv) => adv
        ? `위 지문의 논증에서 생략된 숨은 전제로 가장 적절한 것은?`
        : `위 문장에서 생략된 전제로 가장 적절한 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${topic(kws[0])} ${kws[1]}의 특성을 지닌다는 전제가 필요하다.`,
        `${subj(kws[1])} ${kws[2]}에 영향을 미치지 않는다는 전제가 필요하다.`,
        `${conj(kws[0])} ${topic(kws[2])} 서로 독립적이라는 전제가 필요하다.`,
        `${topic(kws[1])} 예외 없이 모든 경우에 동일하다는 전제가 필요하다.`,
      ]),
    },
    {
      stem: (kws, adv) => adv
        ? `위 논증이 타당하기 위해 반드시 참이어야 하는 전제는?`
        : `위 글의 주장이 성립하려면 반드시 전제해야 하는 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${kws[0]}에 관한 기존 이론이 올바르다는 전제`,
        `${subj(kws[1])} ${conj(kws[0])} 무관하다는 전제`,
        `${topic(kws[2])} 시간이 지나도 변하지 않는다는 전제`,
        `${conj(kws[0])} ${subj(kws[1])} 서로 다른 범주라는 전제`,
      ]),
    },
  ],

  consequence: [
    {
      stem: (kws, adv) => adv
        ? `위 지문의 상황이 계속될 때 논리적으로 추론할 수 있는 결과는?`
        : `위 상황에서 예상할 수 있는 결과로 가장 적절한 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${kws[0]}의 역할이 더욱 중요해질 것이다.`,
        `${subj(kws[1])} 약화되어 ${subj(kws[2])} 대체할 것이다.`,
        `${conj(kws[0])} ${kws[1]}의 관계가 역전될 것이다.`,
        `${kws[2]}에 대한 기존 설명이 완전히 부정될 것이다.`,
      ]),
    },
    {
      stem: (kws, adv) => adv
        ? `위 지문의 논리를 따를 때, 도출되는 결론으로 가장 적절한 것은?`
        : `위 내용을 바탕으로 추론할 수 있는 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${topic(kws[0])} ${kws[1]}의 변화에 따라 달라진다.`,
        `${kws[1]}의 변화는 ${conj(kws[2])} 무관하다.`,
        `${subj(kws[2])} 없어도 ${topic(kws[0])} 동일하게 유지된다.`,
        `${conj(kws[0])} ${topic(kws[2])} 항상 비례한다.`,
      ]),
    },
  ],

  syllogism: [
    {
      stem: (kws, adv) => adv
        ? `위 지문을 대전제와 소전제로 구성할 때, 타당한 결론은?`
        : `위 내용을 삼단논법으로 정리할 때, 올바른 결론은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `따라서 ${topic(kws[0])} ${kws[2]}에 해당한다.`,
        `따라서 ${topic(kws[1])} ${subj(kws[0])} 아니다.`,
        `따라서 모든 ${topic(kws[2])} ${kws[1]}에 속한다.`,
        `따라서 일부 ${kws[0]}만이 ${kws[1]}에 포함된다.`,
      ]),
    },
    {
      stem: (kws, adv) => adv
        ? `위 지문의 전제들로부터 논리적으로 도출되는 결론은?`
        : `위 문장들을 전제로 삼을 때, 반드시 참인 결론은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${topic(kws[0])} ${kws[1]}의 특성을 가진다.`,
        `${subj(kws[1])} 아닌 것은 ${kws[2]}도 아니다.`,
        `${topic(kws[2])} 항상 ${obj(kws[0])} 포함한다.`,
        `${conj(kws[0])} ${topic(kws[2])} 양립 불가능하다.`,
      ]),
    },
  ],

  necessary_transform: [
    {
      stem: (kws, adv) => adv
        ? `위 지문에서 '${subj(kws[1])} 아니면서 ${kws[0]}인 경우는 없다'와 논리적으로 동치인 것은?`
        : `위 내용에서 ${subj(kws[0])} 성립하기 위한 필요조건을 변환한 것으로 옳은 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${kws[0]}이면 반드시 ${kws[1]}이다.`,
        `${kws[1]}이면 반드시 ${kws[0]}이다.`,
        `${kws[0]}이 아니면 ${kws[1]}도 아니다.`,
        `${kws[1]}이 아니면 ${kws[0]}일 수도 있다.`,
      ]),
    },
    {
      stem: (kws, adv) => adv
        ? `위 지문의 내용을 필요조건 관계로 나타낼 때, 올바른 변환은?`
        : `위 글의 논리에서 필요조건 관계를 바르게 표현한 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${topic(kws[1])} ${kws[0]}의 필요조건이다.`,
        `${topic(kws[0])} ${kws[1]}의 필요조건이다.`,
        `${topic(kws[2])} ${kws[0]}의 충분조건이다.`,
        `${conj(kws[0])} ${topic(kws[1])} 동치 관계이다.`,
      ]),
    },
  ],

  necessary_example: [
    {
      stem: (kws, adv) => adv
        ? `위 지문의 논리에서 필요조건의 예시로 적절한 것은?`
        : `위 내용을 참고할 때, 필요조건 관계의 적절한 예시는?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${subj(kws[1])} 없으면 ${topic(kws[0])} 성립하지 않는다.`,
        `${subj(kws[0])} 있으면 ${topic(kws[1])} 반드시 존재한다.`,
        `${subj(kws[2])} 있어도 ${topic(kws[0])} 성립하지 않을 수 있다.`,
        `${conj(kws[0])} ${topic(kws[1])} 서로 무관하다.`,
      ]),
    },
    {
      stem: (kws, adv) => adv
        ? `위 지문에서 설명하는 관계의 필요조건 예시로 부적절한 것은?`
        : `위 글에서 필요조건의 예시로 적절하지 않은 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${subj(kws[0])} 있기만 하면 ${subj(kws[1])} 자동으로 성립한다.`,
        `${subj(kws[1])} 충족되지 않으면 ${topic(kws[0])} 불가능하다.`,
        `${kws[2]}의 부재는 ${kws[0]}의 실패를 의미할 수 있다.`,
        `${topic(kws[1])} ${obj(kws[0])} 위해 꼭 필요한 전제 조건이다.`,
      ]),
    },
  ],

  sufficient_transform: [
    {
      stem: (kws, adv) => adv
        ? `위 지문에서 '${kws[0]}이면서 ${subj(kws[1])} 아닌 경우는 없다'를 충분조건으로 변환하면?`
        : `위 내용에서 충분조건 관계를 바르게 변환한 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${topic(kws[0])} ${kws[1]}의 충분조건이다.`,
        `${topic(kws[1])} ${kws[0]}의 충분조건이다.`,
        `${topic(kws[0])} ${kws[2]}의 필요충분조건이다.`,
        `${topic(kws[2])} ${kws[1]}의 충분조건이다.`,
      ]),
    },
    {
      stem: (kws, adv) => adv
        ? `위 논증의 충분조건 구조를 올바르게 나타낸 것은?`
        : `위 글의 충분조건 관계를 정확히 표현한 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${kws[0]}이면 항상 ${kws[1]}이다.`,
        `${kws[1]}이면 항상 ${kws[0]}이다.`,
        `${kws[0]}이 아니면 ${kws[1]}도 아니다.`,
        `${kws[1]}이 아니면 ${kws[0]}도 아니다.`,
      ]),
    },
  ],

  sufficient_example: [
    {
      stem: (kws, adv) => adv
        ? `위 지문의 충분조건 관계에 해당하는 적절한 예시는?`
        : `위 내용을 바탕으로 충분조건의 예시로 적절한 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${subj(kws[0])} 확인되면 ${subj(kws[1])} 반드시 성립한다.`,
        `${subj(kws[1])} 확인되면 ${subj(kws[0])} 반드시 성립한다.`,
        `${subj(kws[0])} 없어도 ${subj(kws[1])} 성립할 수 있다.`,
        `${subj(kws[1])} 없어도 ${subj(kws[0])} 성립할 수 있다.`,
      ]),
    },
    {
      stem: (kws, adv) => adv
        ? `위 지문의 충분조건 예시로 부적절한 것은?`
        : `위 글에서 충분조건의 예시로 적절하지 않은 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${subj(kws[1])} 성립했으므로 ${subj(kws[0])} 원인이라고 단정하는 것`,
        `${subj(kws[0])} 성립하면 ${kws[1]}도 반드시 따라온다.`,
        `${kws[0]}의 존재만으로 ${obj(kws[1])} 보장할 수 있다.`,
        `${subj(kws[2])} 추가되면 ${kws[0]}의 효과가 강화된다.`,
      ]),
    },
  ],

  validity: [
    {
      stem: (kws, adv) => adv
        ? `위 지문의 추론 방식 중 논리적으로 타당한 추론 형식은?`
        : `위 내용의 추론에서 타당한 형식은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `'${kws[0]}이면 ${kws[1]}이다'에서 '${kws[0]}이다'이므로 '${kws[1]}이다' (전건 긍정)`,
        `'${kws[0]}이면 ${kws[1]}이다'에서 '${kws[1]}이다'이므로 '${kws[0]}이다' (후건 긍정의 오류)`,
        `'${kws[0]}이면 ${kws[1]}이다'에서 '${kws[0]}이 아니다'이므로 '${kws[1]}이 아니다' (전건 부정의 오류)`,
        `'${kws[0]}이면 ${kws[1]}이다'에서 '${kws[1]}일 수도 있다'이므로 '${kws[0]}이다' (개연적 추론의 오류)`,
      ]),
    },
    {
      stem: (kws, adv) => adv
        ? `위 지문의 논증 구조에서 부당한 추론 형식은?`
        : `위 글의 추론에서 논리적 오류에 해당하는 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${subj(kws[1])} 참이므로 ${subj(kws[0])} 원인이라고 결론짓는 것 (후건 긍정의 오류)`,
        `${subj(kws[0])} 참이므로 ${kws[1]}도 참이라고 결론짓는 것 (전건 긍정, 타당한 추론)`,
        `${subj(kws[1])} 거짓이므로 ${kws[0]}도 거짓이라고 결론짓는 것 (후건 부정, 타당한 추론)`,
        `${conj(kws[0])} ${subj(kws[1])} 모두 참이라고 가정하는 것`,
      ]),
    },
  ],

  correlation: [
    {
      stem: (kws, adv) => adv
        ? `위 지문에서 상관관계와 인과관계를 혼동한 진술은?`
        : `위 내용에서 인과관계로 보기 어려운 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${conj(kws[0])} ${subj(kws[1])} 함께 변하므로 ${subj(kws[0])} ${kws[1]}의 원인이다.`,
        `${subj(kws[0])} 변할 때 ${kws[1]}도 변하지만, 제3의 요인이 존재할 수 있다.`,
        `${kws[1]}의 증가가 반드시 ${kws[0]}의 영향이라고 단정할 수 없다.`,
        `${conj(kws[0])} ${kws[1]} 사이에 통계적 연관성이 관찰될 뿐이다.`,
      ]),
    },
    {
      stem: (kws, adv) => adv
        ? `위 지문의 내용에서 상관관계를 인과관계로 잘못 해석한 사례는?`
        : `위 글에서 상관관계와 인과관계를 올바르게 구분한 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${conj(kws[0])} ${kws[1]}의 연관성은 인과가 아닌 공변 관계일 수 있다.`,
        `${subj(kws[0])} 증가하면 ${kws[1]}도 증가하므로 인과관계가 확실하다.`,
        `${obj(kws[2])} 통제하지 않아도 ${subj(kws[0])} ${kws[1]}의 원인이 분명하다.`,
        `${kws[1]}의 변화는 전적으로 ${kws[0]}에 의해 결정된다.`,
      ]),
    },
  ],

  hypothesis: [
    {
      stem: (kws, adv) => adv
        ? `위 지문의 주장을 가설로 볼 때, 이를 반증하는 사례는?`
        : `위 내용의 가설을 검증할 수 있는 방법은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${subj(kws[0])} 존재하는데도 ${subj(kws[1])} 나타나지 않는 사례를 찾는다.`,
        `${conj(kws[0])} ${subj(kws[1])} 동시에 나타나는 사례를 수집한다.`,
        `${obj(kws[2])} 추가하여 ${kws[1]}의 변화를 관찰한다.`,
        `${kws[0]}의 정의를 더 넓게 확장하여 적용한다.`,
      ]),
    },
    {
      stem: (kws, adv) => adv
        ? `위 지문의 가설을 강화하는 증거로 가장 적절한 것은?`
        : `위 글의 주장을 뒷받침하는 근거로 적절한 것은?`,
      choices: (kws, ans) => makeChoices(ans, [
        `${subj(kws[0])} 적용된 다양한 상황에서 ${subj(kws[1])} 일관되게 나타난다.`,
        `${subj(kws[0])} 없는 상황에서도 ${subj(kws[1])} 나타나는 경우가 있다.`,
        `${kws[2]}만으로도 ${obj(kws[1])} 충분히 설명할 수 있다.`,
        `${kws[0]}에 대한 정의가 학자마다 다르게 사용된다.`,
      ]),
    },
  ],
};

// ===== 문제 생성 함수들 =====

function generateQuestion(logicInfo, text, answerId, pIdx, task) {
  const { logicType } = logicInfo;
  const isAdvanced = task.levelId === 'russell3';
  const kws = extractKeywords(text, 5);
  const templates = questionTemplates[logicType];
  const tIdx = pIdx % templates.length;
  const template = templates[tIdx];

  return {
    id: `q${(pIdx % 2) + 1}`,
    type: 'MULTI_CHOICE',
    logicType,
    stem: template.stem(kws, isAdvanced),
    choices: template.choices(kws, answerId),
    answerId,
    scoring: { correctDeltaSec: 15, wrongDeltaSec: -15 },
  };
}

// ===== 메인 로직 =====

const tasks = [];
for (let ch = 11; ch <= 20; ch++) tasks.push({ levelId: 'russell2', ch });
for (let ch = 1; ch <= 20; ch++) tasks.push({ levelId: 'russell3', ch });

for (const task of tasks) {
  const key = task.levelId + '_ch' + String(task.ch).padStart(2, '0');
  const d = RAW[key];
  if (!d) { console.error('Missing data for', key); continue; }

  const levelLabel = task.levelId === 'russell2' ? '러셀2' : '러셀3';
  const titlePrefix = `${levelLabel} ${task.ch}장 논리사고력`;

  const pools = {
    비문학: splitSentences(d.비문학),
    문학: splitSentences(d.문학),
    개념: splitSentences(d.개념),
    문법: splitSentences(d.문법),
  };

  const sourceOrder = ['비문학', '문학', '개념', '문법'];
  const passages = [];

  for (let pIdx = 0; pIdx < 20; pIdx++) {
    const logicInfo = LOGIC_TYPES[Math.floor(pIdx / 2)];
    const answerId = ANSWERS[pIdx % 4];

    // 소스 선택: 5개씩 순환하되, 문장 부족 시 대체
    let srcIdx = Math.floor(pIdx / 5) % 4;
    let src = sourceOrder[srcIdx];
    let pool = pools[src];

    if (pool.length < 2) {
      for (const alt of sourceOrder) {
        if (pools[alt].length >= 2) { src = alt; pool = pools[alt]; break; }
      }
    }

    const sentCount = (pIdx % 2 === 0) ? 2 : 3;
    const startIdx = (pIdx * 3) % pool.length;
    const passageText = pickSentences(pool, startIdx, sentCount);

    const question = generateQuestion(logicInfo, passageText, answerId, pIdx, task);

    passages.push({
      id: `p${pIdx + 1}`,
      title: logicInfo.title,
      text: passageText,
      questions: [question],
    });
  }

  const output = {
    contentType: 'PRO_LOGIC',
    title: titlePrefix,
    targetLevel: task.levelId,
    area: 'LOGIC',
    subArea: 'PRO',
    timeLimitSec: 300,
    seedReward: { seedType: 'seed_grape', count: 3, multiplier: 1 },
    payload: { passages },
  };

  const outPath = path.join(OUT_DIR, `${key}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log('Generated:', key + '.json');
}

console.log('Done! Generated', tasks.length, 'files.');
