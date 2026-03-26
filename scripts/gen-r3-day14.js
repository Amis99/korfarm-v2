// 러셀3 Day 14 문학 - 현대시의 화자와 어조 (재작성)
const fs = require('fs');
const path = require('path');

// ── 지문 (4문단, 목표 1300자 ±50) ── 주제: 현대시의 화자와 어조
const p1 = '시를 읽을 때 우리가 만나는 목소리는 시인 자신의 목소리가 아니라 시인이 창조한 화자의 목소리이다. 화자란 시 속에서 말하는 주체를 가리키며, 소설의 서술자에 해당하는 존재이다. 시인은 자신의 감정이나 생각을 직접 드러내기보다 화자라는 매개를 통해 작품의 정서를 전달한다. 화자는 시인과 동일한 인물일 수도 있고 전혀 다른 인물일 수도 있다. 예를 들어 어린아이의 눈으로 세상을 바라보는 시에서 화자는 어린아이이지만, 그 시를 쓴 시인은 성인이다. 이처럼 화자를 설정하는 행위는 시인이 특정한 시각과 태도를 선택하는 창작 전략이라 할 수 있다.';
const p2 = '화자의 목소리에 담긴 태도나 감정의 색채를 어조라 한다. 어조는 시의 분위기를 결정짓는 핵심 요소로, 같은 주제라도 어조에 따라 전혀 다른 인상을 줄 수 있다. 예를 들어 이별을 노래하는 시에서 담담한 어조를 사용하면 체념과 성찰의 분위기가 형성되고, 격정적인 어조를 사용하면 슬픔과 분노의 분위기가 형성된다. 어조는 시어의 선택, 문장의 길이와 리듬, 종결 표현의 형태 등 다양한 언어적 장치를 통해 만들어진다. 따라서 시의 어조를 파악하기 위해서는 개별 단어의 의미뿐 아니라 문장 전체의 흐름과 톤을 함께 살펴야 한다.';
const p3 = '화자의 유형은 크게 세 가지로 나눌 수 있다. 첫째, 시인 자신의 경험이나 감정을 토대로 한 서정적 자아로서의 화자가 있다. 이 유형에서는 화자와 시인의 거리가 가까워 시인의 내면이 비교적 직접적으로 드러난다. 둘째, 시인이 아닌 제삼자를 화자로 내세우는 극적 화자가 있다. 이때 시인은 특정 인물의 관점을 빌려 독자에게 새로운 시각을 제공하며, 역할극처럼 목소리를 연기하는 효과를 만든다. 셋째, 관찰자적 화자가 있는데, 이 화자는 대상이나 사건을 감정 없이 객관적으로 묘사한다. 관찰자적 화자는 감정을 절제함으로써 오히려 독자의 상상과 해석의 여지를 넓혀 준다.';
const p4 = '화자와 어조를 파악하는 능력은 시를 깊이 이해하는 데 필수적이다. 시를 읽을 때 누가 말하고 있는지, 그 말에 어떤 감정이 담겨 있는지를 먼저 파악하면 시의 주제와 정서에 한결 가까이 다가갈 수 있다. 또한 화자와 시인을 구별하는 습관은 작품을 객관적으로 분석하는 태도를 길러 준다. 시인의 전기적 사실에만 의존하여 시를 해석하면 작품 자체의 의미를 놓칠 수 있기 때문이다. 나아가 화자의 위치와 어조의 변화를 추적하면 시 전체의 구성과 의미 전개를 입체적으로 이해할 수 있어, 보다 풍부한 문학적 감상이 가능해진다.';

const paragraphs = [
  { id: 'p1', text: p1 },
  { id: 'p2', text: p2 },
  { id: 'p3', text: p3 },
  { id: 'p4', text: p4 }
];

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log('=== 문단별 글자 수 ===');
paragraphs.forEach(p => console.log(`${p.id}: ${p.text.length}자`));
console.log(`총 글자 수: ${totalLen}자`);

// 유틸
function findRange(pid, keyword) {
  const pText = paragraphs.find(p => p.id === pid).text;
  const start = pText.indexOf(keyword);
  if (start === -1) throw new Error(`"${keyword}" not found in ${pid}`);
  return { paragraphId: pid, start, end: start + keyword.length };
}
function findAllRanges(pid, keyword) {
  const pText = paragraphs.find(p => p.id === pid).text;
  const ranges = [];
  let idx = 0;
  while (true) {
    const found = pText.indexOf(keyword, idx);
    if (found === -1) break;
    ranges.push({ paragraphId: pid, start: found, end: found + keyword.length });
    idx = found + 1;
  }
  return ranges;
}
function sentenceRanges(pid, sentences) {
  const pText = paragraphs.find(p => p.id === pid).text;
  const result = [];
  let cursor = 0;
  for (const s of sentences) {
    const start = pText.indexOf(s, cursor);
    if (start === -1) throw new Error(`문장 못 찾음 in ${pid}: ${s.substring(0, 30)}`);
    result.push({ start, end: start + s.length });
    cursor = start + s.length;
  }
  return result;
}
function r(pid, s, e) { return { paragraphId: pid, start: s, end: e }; }

const p1s = sentenceRanges('p1', [
  '시를 읽을 때 우리가 만나는 목소리는 시인 자신의 목소리가 아니라 시인이 창조한 화자의 목소리이다.',
  '화자란 시 속에서 말하는 주체를 가리키며, 소설의 서술자에 해당하는 존재이다.',
  '시인은 자신의 감정이나 생각을 직접 드러내기보다 화자라는 매개를 통해 작품의 정서를 전달한다.',
  '화자는 시인과 동일한 인물일 수도 있고 전혀 다른 인물일 수도 있다.',
  '예를 들어 어린아이의 눈으로 세상을 바라보는 시에서 화자는 어린아이이지만, 그 시를 쓴 시인은 성인이다.',
  '이처럼 화자를 설정하는 행위는 시인이 특정한 시각과 태도를 선택하는 창작 전략이라 할 수 있다.'
]);
const p2s = sentenceRanges('p2', [
  '화자의 목소리에 담긴 태도나 감정의 색채를 어조라 한다.',
  '어조는 시의 분위기를 결정짓는 핵심 요소로, 같은 주제라도 어조에 따라 전혀 다른 인상을 줄 수 있다.',
  '예를 들어 이별을 노래하는 시에서 담담한 어조를 사용하면 체념과 성찰의 분위기가 형성되고, 격정적인 어조를 사용하면 슬픔과 분노의 분위기가 형성된다.',
  '어조는 시어의 선택, 문장의 길이와 리듬, 종결 표현의 형태 등 다양한 언어적 장치를 통해 만들어진다.',
  '따라서 시의 어조를 파악하기 위해서는 개별 단어의 의미뿐 아니라 문장 전체의 흐름과 톤을 함께 살펴야 한다.'
]);
const p3s = sentenceRanges('p3', [
  '화자의 유형은 크게 세 가지로 나눌 수 있다.',
  '첫째, 시인 자신의 경험이나 감정을 토대로 한 서정적 자아로서의 화자가 있다.',
  '이 유형에서는 화자와 시인의 거리가 가까워 시인의 내면이 비교적 직접적으로 드러난다.',
  '둘째, 시인이 아닌 제삼자를 화자로 내세우는 극적 화자가 있다.',
  '이때 시인은 특정 인물의 관점을 빌려 독자에게 새로운 시각을 제공하며, 역할극처럼 목소리를 연기하는 효과를 만든다.',
  '셋째, 관찰자적 화자가 있는데, 이 화자는 대상이나 사건을 감정 없이 객관적으로 묘사한다.',
  '관찰자적 화자는 감정을 절제함으로써 오히려 독자의 상상과 해석의 여지를 넓혀 준다.'
]);
const p4s = sentenceRanges('p4', [
  '화자와 어조를 파악하는 능력은 시를 깊이 이해하는 데 필수적이다.',
  '시를 읽을 때 누가 말하고 있는지, 그 말에 어떤 감정이 담겨 있는지를 먼저 파악하면 시의 주제와 정서에 한결 가까이 다가갈 수 있다.',
  '또한 화자와 시인을 구별하는 습관은 작품을 객관적으로 분석하는 태도를 길러 준다.',
  '시인의 전기적 사실에만 의존하여 시를 해석하면 작품 자체의 의미를 놓칠 수 있기 때문이다.',
  '나아가 화자의 위치와 어조의 변화를 추적하면 시 전체의 구성과 의미 전개를 입체적으로 이해할 수 있어, 보다 풍부한 문학적 감상이 가능해진다.'
]);

const scoring_i = { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true };
const timeline = [];
let stepNum = 1;
function addStep(pid, range, prompt, choices, answerId) {
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [r(pid, range.start, range.end)] },
    question: {
      prompt,
      choices: choices.map((t, i) => ({ id: String.fromCharCode(65 + i), text: t })),
      answerId,
      scoring: scoring_i
    }
  });
}

// p1 정독
addStep('p1', p1s[0], '첫 문장이 강조하는 시 속 목소리의 성격으로 알맞은 것은?', [
  '시인이 창조한 화자의 목소리이다.',
  '시인 자신의 일상적 대화이다.',
  '독자가 상상으로 만들어 낸 목소리이다.',
  '비평가가 분석하여 재구성한 목소리이다.'
], 'A');
addStep('p1', p1s[1], '둘째 문장이 정의하는 화자의 의미로 알맞은 것은?', [
  '시 속에서 말하는 주체로 소설의 서술자에 해당한다.',
  '시를 비평하는 전문가를 가리키는 용어이다.',
  '시를 낭독하는 사람을 가리키는 말이다.',
  '시의 배경이 되는 장소를 의미한다.'
], 'A');
addStep('p1', p1s[2], '셋째 문장이 설명하는 시인의 표현 방식으로 알맞은 것은?', [
  '화자라는 매개를 통해 작품의 정서를 전달한다.',
  '자신의 감정을 직접적으로 독자에게 전달한다.',
  '비유와 상징 없이 사실만을 기록한다.',
  '독자의 반응을 예측하여 내용을 수정한다.'
], 'A');
addStep('p1', p1s[3], '넷째 문장이 말하는 화자와 시인의 관계로 알맞은 것은?', [
  '화자는 시인과 동일하거나 전혀 다른 인물일 수 있다.',
  '화자는 반드시 시인과 동일한 인물이어야 한다.',
  '화자는 항상 시인과 다른 인물이어야 한다.',
  '화자와 시인의 관계는 시의 내용과 무관하다.'
], 'A');
addStep('p1', p1s[4], '다섯째 문장이 드는 예시의 내용으로 알맞은 것은?', [
  '어린아이 시점의 시에서 화자는 어린아이이고 시인은 성인이다.',
  '성인이 쓴 시에서는 화자도 반드시 성인이어야 한다.',
  '어린아이가 직접 쓴 시에서만 어린아이 화자가 가능하다.',
  '시인과 화자의 나이는 항상 일치해야 한다.'
], 'A');
addStep('p1', p1s[5], '여섯째 문장이 요약하는 화자 설정의 의미로 알맞은 것은?', [
  '시인이 특정한 시각과 태도를 선택하는 창작 전략이다.',
  '독자가 자유롭게 화자를 정하는 감상 방법이다.',
  '시인의 실제 경험만을 반영하는 기록 행위이다.',
  '시의 형식적 완성도와 무관한 부수적 요소이다.'
], 'A');
addStep('p1', { start: 0, end: p1.length }, '첫째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '시의 화자는 시인이 창조한 존재로, 시인이 특정 시각과 태도를 선택하는 창작 전략이다.',
  '시의 화자와 시인은 항상 동일한 인물이므로 구별할 필요가 없다.',
  '화자는 독자가 임의로 설정하는 것이므로 시인의 의도와 무관하다.',
  '시를 읽을 때 화자의 존재는 중요하지 않으며 주제만 파악하면 된다.'
], 'A');

// p2 정독
addStep('p2', p2s[0], '첫 문장이 정의하는 어조의 의미로 알맞은 것은?', [
  '화자의 목소리에 담긴 태도나 감정의 색채이다.',
  '시의 주제를 한 문장으로 요약한 것이다.',
  '시에서 사용된 비유적 표현의 종류이다.',
  '시의 행과 연을 구분하는 형식적 기준이다.'
], 'A');
addStep('p2', p2s[1], '둘째 문장이 설명하는 어조의 역할로 알맞은 것은?', [
  '시의 분위기를 결정짓는 핵심 요소로, 같은 주제도 다른 인상을 줄 수 있다.',
  '시의 길이를 결정하는 형식적 요소이다.',
  '시의 주제를 바꾸는 내용적 요소이다.',
  '시의 출판 여부를 판단하는 기준이다.'
], 'A');
addStep('p2', p2s[2], '셋째 문장이 드는 이별 시의 어조 비교로 알맞은 것은?', [
  '담담한 어조는 체념과 성찰을, 격정적인 어조는 슬픔과 분노의 분위기를 형성한다.',
  '담담한 어조는 기쁨을, 격정적인 어조는 평화의 분위기를 형성한다.',
  '어떤 어조를 사용하든 이별 시의 분위기는 동일하다.',
  '담담한 어조와 격정적인 어조는 같은 의미이다.'
], 'A');
addStep('p2', p2s[3], '넷째 문장이 말하는 어조를 만드는 언어적 장치로 알맞은 것은?', [
  '시어의 선택, 문장의 길이와 리듬, 종결 표현의 형태 등이다.',
  '시인의 학력과 경력이 어조를 결정한다.',
  '독자의 나이와 성별에 따라 어조가 달라진다.',
  '시가 발표된 시대와 장소만이 어조를 결정한다.'
], 'A');
addStep('p2', p2s[4], '다섯째 문장이 강조하는 어조 파악 방법으로 알맞은 것은?', [
  '개별 단어의 의미뿐 아니라 문장 전체의 흐름과 톤을 함께 살펴야 한다.',
  '사전에서 단어의 뜻만 정확히 찾으면 충분하다.',
  '시인의 전기적 사실만 참고하면 어조를 알 수 있다.',
  '시의 제목만 읽어도 어조를 파악할 수 있다.'
], 'A');
addStep('p2', { start: 0, end: p2.length }, '둘째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '어조는 화자의 태도와 감정을 담아 시의 분위기를 결정하며 다양한 언어적 장치로 형성된다.',
  '어조는 시의 형식과 무관한 부수적 요소이므로 분석할 필요가 없다.',
  '어조는 시인의 생애를 알아야만 파악할 수 있다.',
  '어조는 모든 시에서 동일하므로 구별할 필요가 없다.'
], 'A');

// p3 정독
addStep('p3', p3s[0], '첫 문장이 밝히는 화자의 유형 수로 알맞은 것은?', [
  '크게 세 가지이다.',
  '크게 두 가지이다.',
  '크게 네 가지이다.',
  '하나의 유형만 존재한다.'
], 'A');
addStep('p3', p3s[1], '둘째 문장이 소개하는 첫 번째 화자 유형으로 알맞은 것은?', [
  '시인의 경험이나 감정을 토대로 한 서정적 자아이다.',
  '시인과 전혀 관계없는 허구의 인물이다.',
  '사건을 감정 없이 관찰하는 관찰자이다.',
  '특정 역사 인물의 관점을 빌린 화자이다.'
], 'A');
addStep('p3', p3s[2], '셋째 문장이 말하는 서정적 자아의 특징으로 알맞은 것은?', [
  '화자와 시인의 거리가 가까워 시인의 내면이 비교적 직접적으로 드러난다.',
  '화자와 시인의 거리가 멀어 시인의 내면이 전혀 드러나지 않는다.',
  '화자가 감정을 절제하여 객관적 묘사에 집중한다.',
  '화자가 제삼자의 관점을 빌려 역할극을 수행한다.'
], 'A');
addStep('p3', p3s[3], '넷째 문장이 소개하는 두 번째 화자 유형으로 알맞은 것은?', [
  '시인이 아닌 제삼자를 내세우는 극적 화자이다.',
  '시인 자신의 감정을 직접 표현하는 서정적 자아이다.',
  '대상을 감정 없이 묘사하는 관찰자적 화자이다.',
  '독자에게 질문을 던지는 대화적 화자이다.'
], 'A');
addStep('p3', p3s[4], '다섯째 문장이 설명하는 극적 화자의 효과로 알맞은 것은?', [
  '특정 인물의 관점을 빌려 새로운 시각을 제공하고 역할극 같은 효과를 만든다.',
  '시인의 내면을 가장 직접적으로 전달한다.',
  '감정을 절제하여 독자의 해석 여지를 넓힌다.',
  '시의 형식적 아름다움만을 추구한다.'
], 'A');
addStep('p3', { start: p3s[5].start, end: p3s[6].end }, '셋째 유형인 관찰자적 화자의 특징과 효과로 알맞은 것은?', [
  '감정 없이 객관적으로 묘사하되, 감정 절제로 독자의 상상과 해석 여지를 넓힌다.',
  '강렬한 감정을 표출하여 독자의 공감을 이끌어 낸다.',
  '시인의 개인적 경험을 생생하게 전달한다.',
  '특정 인물의 목소리를 연기하여 극적 효과를 만든다.'
], 'A');
addStep('p3', { start: 0, end: p3.length }, '셋째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '화자는 서정적 자아, 극적 화자, 관찰자적 화자의 세 유형으로 나뉘며 각각 다른 효과를 낸다.',
  '화자의 유형은 하나뿐이며 모든 시에서 동일한 방식으로 작동한다.',
  '극적 화자만이 시에서 의미 있는 유형이고 나머지는 부수적이다.',
  '관찰자적 화자는 감정을 과도하게 표출하여 독자를 압도한다.'
], 'A');

// p4 정독
addStep('p4', p4s[0], '첫 문장이 강조하는 화자와 어조 파악의 중요성으로 알맞은 것은?', [
  '시를 깊이 이해하는 데 필수적이다.',
  '시의 형식적 아름다움을 판단하는 데만 필요하다.',
  '시인의 전기적 사실을 파악하는 데 유용하다.',
  '시의 길이와 구조를 분석하는 데만 쓰인다.'
], 'A');
addStep('p4', p4s[1], '둘째 문장이 말하는 시 읽기의 출발점으로 알맞은 것은?', [
  '누가 말하고 있는지, 어떤 감정이 담겨 있는지를 먼저 파악하는 것이다.',
  '시의 출판 연도와 시인의 경력을 먼저 확인하는 것이다.',
  '시의 행수와 연수를 정확히 세는 것이다.',
  '시에 사용된 비유의 종류를 분류하는 것이다.'
], 'A');
addStep('p4', p4s[2], '셋째 문장이 말하는 화자와 시인 구별의 이점으로 알맞은 것은?', [
  '작품을 객관적으로 분석하는 태도를 길러 준다.',
  '시인의 사생활을 더 잘 이해할 수 있게 해 준다.',
  '시의 형식적 오류를 찾아내는 데 도움을 준다.',
  '시를 암기하는 데 효과적인 방법이 된다.'
], 'A');
addStep('p4', p4s[3], '넷째 문장이 경고하는 해석 태도로 알맞은 것은?', [
  '시인의 전기적 사실에만 의존하면 작품 자체의 의미를 놓칠 수 있다.',
  '시인의 전기적 사실은 시 해석에 전혀 참고할 수 없다.',
  '작품의 의미는 시인의 생애에 의해서만 결정된다.',
  '시인에 대한 정보 없이는 어떤 시도 이해할 수 없다.'
], 'A');
addStep('p4', p4s[4], '다섯째 문장이 말하는 화자 위치와 어조 변화 추적의 효과로 알맞은 것은?', [
  '시 전체의 구성과 의미를 입체적으로 이해하여 풍부한 감상이 가능해진다.',
  '시의 문법적 오류를 정확하게 지적할 수 있다.',
  '시인의 다음 작품을 예측할 수 있다.',
  '시를 빠르게 읽는 속독 능력이 향상된다.'
], 'A');
addStep('p4', { start: 0, end: p4.length }, '넷째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '화자와 어조 파악은 시의 주제와 정서를 깊이 이해하고 객관적으로 분석하는 데 필수적이다.',
  '시를 이해하려면 시인의 전기적 사실만 알면 충분하다.',
  '화자와 어조는 시 감상에 부수적인 요소이므로 무시해도 된다.',
  '시의 구성과 의미 전개는 화자와 무관하게 결정된다.'
], 'A');

console.log(`정독 스텝 수: ${timeline.length}`);

// ── 복기 (recall) - 정확히 8카드 ──
const recall = {
  cards: [
    { id: 'c1', text: '시 속 목소리는 시인이 아니라 시인이 창조한 화자의 목소리이다.' },
    { id: 'c2', text: '어조는 화자의 태도와 감정의 색채로 시의 분위기를 결정짓는다.' },
    { id: 'c3', text: '서정적 자아는 시인의 내면이 비교적 직접적으로 드러나는 화자 유형이다.' },
    { id: 'c4', text: '극적 화자는 제삼자의 관점을 빌려 새로운 시각을 제공한다.' },
    { id: 'c5', text: '관찰자적 화자는 감정을 절제하여 독자의 해석 여지를 넓힌다.' },
    { id: 'c6', text: '화자와 시인을 구별하면 작품을 객관적으로 분석하는 태도를 기를 수 있다.' },
    { id: 'c7', text: '시인의 전기적 사실에만 의존하면 작품의 의미를 놓칠 수 있다.' },
    { id: 'c8', text: '화자의 위치와 어조의 변화를 추적하면 시를 입체적으로 이해할 수 있다.' }
  ],
  correctOrder: ['c1','c2','c3','c4','c5','c6','c7','c8'],
  seedPenalty: 1
};

// ── 확인 (confirm) - 7문항 ──
const scoring_c = { correctDeltaSec: 30, wrongDeltaSec: -45 };
const confirm = { questions: [
  { id: 'q1', prompt: '시 속에서 말하는 주체를 가리키는 용어는 무엇인가?',
    answerText: '화자', answerMatchMode: 'ANY',
    answerRanges: [...findAllRanges('p1', '화자'), ...findAllRanges('p3', '화자'), ...findAllRanges('p4', '화자')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q2', prompt: '화자의 목소리에 담긴 태도나 감정의 색채를 무엇이라 하는가?',
    answerText: '어조', answerMatchMode: 'ANY',
    answerRanges: [...findAllRanges('p2', '어조'), ...findAllRanges('p4', '어조')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q3', prompt: '시인 자신의 경험이나 감정을 토대로 한 화자 유형을 무엇이라 하는가?',
    answerText: '서정적 자아', answerMatchMode: 'ANY',
    answerRanges: [findRange('p3', '서정적 자아')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q4', prompt: '시인이 아닌 제삼자를 화자로 내세우는 유형을 무엇이라 하는가?',
    answerText: '극적 화자', answerMatchMode: 'ANY',
    answerRanges: [findRange('p3', '극적 화자')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q5', prompt: '대상이나 사건을 감정 없이 객관적으로 묘사하는 화자 유형을 무엇이라 하는가?',
    answerText: '관찰자적 화자', answerMatchMode: 'ANY',
    answerRanges: [...findAllRanges('p3', '관찰자적 화자')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q6', prompt: '어조를 만드는 언어적 장치에 해당하는 것 세 가지는 무엇인가?',
    answerText: '시어의 선택, 문장의 길이와 리듬, 종결 표현의 형태',
    answerMatchMode: 'ALL',
    answerRanges: [findRange('p2', '시어의 선택, 문장의 길이와 리듬, 종결 표현의 형태')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q7', prompt: '시인의 전기적 사실에만 의존하여 시를 해석하면 놓칠 수 있는 것은 무엇인가?',
    answerText: '작품 자체의 의미',
    answerMatchMode: 'ANY',
    answerRanges: [findRange('p4', '작품 자체의 의미')],
    scoring: scoring_c, revealOnWrong: true }
]};

console.log(`복기 카드 수: ${recall.cards.length}`);
console.log(`확인 문항 수: ${confirm.questions.length}`);

// ── content 객체 조립 ──
const content = {
  contentId: 'dr-r3-014',
  contentType: 'DAILY_READING',
  version: 1,
  status: 'PUBLISHED',
  title: '일일 독해(러셀 3) Day 14 문학',
  description: '일일 독해 - 정독·복기·확인',
  targetLevel: 'RUSSELL_3',
  schoolGradeRange: { min: 9, max: 10 },
  area: 'READING',
  subArea: 'LITERATURE',
  competencies: ['READING'],
  tags: ['daily'],
  access: { mode: 'FREE' },
  seedReward: { seedType: 'WHEAT', count: 3, multiplier: 1 },
  timeLimitSec: 480,
  assets: {},
  payload: {
    passage: { format: 'TEXT', paragraphs },
    intensive: { timeline },
    recall,
    confirm
  }
};

const batchItem = {
  content_type: 'DAILY_READING',
  level_id: 'RUSSELL_3',
  area: 'READING',
  sub_area: 'LITERATURE',
  day_index: 14,
  module_key: 'reading_training',
  schema_version: '1.0',
  content
};

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell3');
fs.writeFileSync(path.join(staticDir, '014.json'), JSON.stringify(content, null, 2), 'utf8');
console.log('static 014.json 저장 완료');

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell3.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[13] = batchItem;
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log('배치 파일 day_index 14 업데이트 완료');
