// 러셀3 Day 16 문학 - 소설의 서술 시점 (재작성)
const fs = require('fs');
const path = require('path');

// ── 지문 (4문단, 목표 1300자 ±50) ── 주제: 소설의 서술 시점
const p1 = '소설에서 이야기를 전달하는 방식을 서술 시점이라 한다. 서술 시점은 누가, 어떤 위치에서 이야기를 들려주는가를 결정하며, 독자가 작품 세계를 인식하는 창의 역할을 한다. 서술자가 이야기 속 인물인지 아닌지에 따라 시점이 나뉘고, 서술자가 알 수 있는 정보의 범위에 따라 시점의 성격이 달라진다. 서술 시점의 선택은 작가의 창작 전략이자 독자의 몰입 방식을 좌우하는 핵심 요소로, 같은 사건이라도 시점에 따라 전혀 다른 이야기처럼 느껴질 수 있다.';
const p2 = '소설의 서술 시점은 크게 1인칭 시점과 3인칭 시점으로 나눌 수 있다. 1인칭 시점에서는 이야기 속 인물이 직접 서술자가 되어 자신의 경험과 감정을 전달한다. 이때 서술자는 자신이 직접 보고 느낀 것만 말할 수 있으므로 정보의 범위가 제한적이지만, 독자는 서술자의 내면에 깊이 공감할 수 있다. 1인칭 시점은 다시 주인공 시점과 관찰자 시점으로 나뉜다. 주인공 시점에서는 서술자 자신이 이야기의 중심인물이고, 관찰자 시점에서는 서술자가 다른 인물의 이야기를 곁에서 지켜보며 전달한다. 관찰자 시점은 주인공의 내면을 직접 알 수 없기 때문에 독자의 해석 여지가 넓어지는 효과가 있다.';
const p3 = '3인칭 시점에서는 이야기 밖의 서술자가 등장인물을 관찰하며 이야기를 전달한다. 3인칭 시점은 다시 전지적 작가 시점과 관찰자 시점으로 나뉜다. 전지적 작가 시점에서 서술자는 모든 인물의 생각과 감정을 알고 있으며, 과거와 미래의 사건까지 자유롭게 언급할 수 있다. 이 시점은 복잡한 인물 관계와 사건의 전모를 입체적으로 보여 줄 수 있다는 장점이 있다. 반면 3인칭 관찰자 시점에서 서술자는 인물의 행동과 대화만을 묘사하고, 인물의 내면을 직접 서술하지 않는다. 이 시점은 객관적이고 절제된 분위기를 만들며, 독자가 스스로 인물의 심리를 추론하도록 유도한다.';
const p4 = '서술 시점을 분석하면 작가가 독자에게 어떤 경험을 제공하려 했는지를 파악할 수 있다. 1인칭 시점을 선택했다면 독자를 특정 인물의 내면 깊숙이 끌어들이려는 의도가 있고, 전지적 작가 시점을 선택했다면 여러 인물의 복잡한 관계를 입체적으로 조명하려는 의도가 있다. 또한 하나의 소설 안에서 시점이 전환되는 경우도 있는데, 이때 시점의 변화는 서사적 긴장을 높이거나 새로운 정보를 제공하는 서사 전략으로 기능한다. 따라서 서술 시점은 단순한 기술적 장치가 아니라, 작가가 독자의 인식과 감정을 조율하는 핵심적인 문학적 수단이라 할 수 있다.';

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
  '소설에서 이야기를 전달하는 방식을 서술 시점이라 한다.',
  '서술 시점은 누가, 어떤 위치에서 이야기를 들려주는가를 결정하며, 독자가 작품 세계를 인식하는 창의 역할을 한다.',
  '서술자가 이야기 속 인물인지 아닌지에 따라 시점이 나뉘고, 서술자가 알 수 있는 정보의 범위에 따라 시점의 성격이 달라진다.',
  '서술 시점의 선택은 작가의 창작 전략이자 독자의 몰입 방식을 좌우하는 핵심 요소로, 같은 사건이라도 시점에 따라 전혀 다른 이야기처럼 느껴질 수 있다.'
]);
const p2s = sentenceRanges('p2', [
  '소설의 서술 시점은 크게 1인칭 시점과 3인칭 시점으로 나눌 수 있다.',
  '1인칭 시점에서는 이야기 속 인물이 직접 서술자가 되어 자신의 경험과 감정을 전달한다.',
  '이때 서술자는 자신이 직접 보고 느낀 것만 말할 수 있으므로 정보의 범위가 제한적이지만, 독자는 서술자의 내면에 깊이 공감할 수 있다.',
  '1인칭 시점은 다시 주인공 시점과 관찰자 시점으로 나뉜다.',
  '주인공 시점에서는 서술자 자신이 이야기의 중심인물이고, 관찰자 시점에서는 서술자가 다른 인물의 이야기를 곁에서 지켜보며 전달한다.',
  '관찰자 시점은 주인공의 내면을 직접 알 수 없기 때문에 독자의 해석 여지가 넓어지는 효과가 있다.'
]);
const p3s = sentenceRanges('p3', [
  '3인칭 시점에서는 이야기 밖의 서술자가 등장인물을 관찰하며 이야기를 전달한다.',
  '3인칭 시점은 다시 전지적 작가 시점과 관찰자 시점으로 나뉜다.',
  '전지적 작가 시점에서 서술자는 모든 인물의 생각과 감정을 알고 있으며, 과거와 미래의 사건까지 자유롭게 언급할 수 있다.',
  '이 시점은 복잡한 인물 관계와 사건의 전모를 입체적으로 보여 줄 수 있다는 장점이 있다.',
  '반면 3인칭 관찰자 시점에서 서술자는 인물의 행동과 대화만을 묘사하고, 인물의 내면을 직접 서술하지 않는다.',
  '이 시점은 객관적이고 절제된 분위기를 만들며, 독자가 스스로 인물의 심리를 추론하도록 유도한다.'
]);
const p4s = sentenceRanges('p4', [
  '서술 시점을 분석하면 작가가 독자에게 어떤 경험을 제공하려 했는지를 파악할 수 있다.',
  '1인칭 시점을 선택했다면 독자를 특정 인물의 내면 깊숙이 끌어들이려는 의도가 있고, 전지적 작가 시점을 선택했다면 여러 인물의 복잡한 관계를 입체적으로 조명하려는 의도가 있다.',
  '또한 하나의 소설 안에서 시점이 전환되는 경우도 있는데, 이때 시점의 변화는 서사적 긴장을 높이거나 새로운 정보를 제공하는 서사 전략으로 기능한다.',
  '따라서 서술 시점은 단순한 기술적 장치가 아니라, 작가가 독자의 인식과 감정을 조율하는 핵심적인 문학적 수단이라 할 수 있다.'
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
addStep('p1', p1s[0], '첫 문장이 정의하는 서술 시점의 의미로 알맞은 것은?', [
  '소설에서 이야기를 전달하는 방식이다.',
  '소설의 배경이 되는 시간과 장소이다.',
  '소설 속 인물이 행동하는 방식이다.',
  '소설을 출판하는 과정에서의 편집 전략이다.'
], 'A');
addStep('p1', p1s[1], '둘째 문장이 설명하는 서술 시점의 역할로 알맞은 것은?', [
  '누가 어떤 위치에서 이야기하는가를 결정하며 독자의 인식 창 역할을 한다.',
  '소설의 문장 길이와 어휘 수준을 결정한다.',
  '독자의 나이와 학력에 따라 자동으로 조절된다.',
  '소설의 결말을 미리 예고하는 기능을 한다.'
], 'A');
addStep('p1', p1s[2], '셋째 문장이 말하는 시점 구분의 기준으로 알맞은 것은?', [
  '서술자가 이야기 속 인물인지 여부와 알 수 있는 정보의 범위이다.',
  '소설이 쓰인 시대와 작가의 국적이다.',
  '독자의 독서 경험과 취향이다.',
  '소설의 분량과 장르이다.'
], 'A');
addStep('p1', p1s[3], '넷째 문장이 강조하는 서술 시점의 효과로 알맞은 것은?', [
  '같은 사건이라도 시점에 따라 전혀 다른 이야기처럼 느껴질 수 있다.',
  '어떤 시점을 사용해도 이야기의 인상은 동일하다.',
  '서술 시점은 작가의 의도와 무관한 기술적 형식이다.',
  '독자의 몰입 방식은 시점이 아니라 줄거리에 의해서만 결정된다.'
], 'A');
addStep('p1', { start: 0, end: p1.length }, '첫째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '서술 시점은 독자의 인식과 몰입을 좌우하는 핵심적인 창작 전략이다.',
  '서술 시점은 소설의 배경을 설명하는 부수적 요소이다.',
  '모든 소설은 동일한 서술 시점을 사용한다.',
  '서술 시점의 선택은 독자가 결정하는 감상 방법이다.'
], 'A');

// p2 정독
addStep('p2', p2s[0], '첫 문장이 밝히는 서술 시점의 두 분류로 알맞은 것은?', [
  '1인칭 시점과 3인칭 시점이다.',
  '현재 시점과 과거 시점이다.',
  '주관적 시점과 객관적 시점이다.',
  '고전 시점과 현대 시점이다.'
], 'A');
addStep('p2', p2s[1], '둘째 문장이 설명하는 1인칭 시점의 특징으로 알맞은 것은?', [
  '이야기 속 인물이 직접 서술자가 되어 자신의 경험과 감정을 전달한다.',
  '이야기 밖의 서술자가 모든 인물의 내면을 알려준다.',
  '서술자가 여러 인물의 시점을 번갈아 사용한다.',
  '작가가 직접 등장하여 독자에게 설명한다.'
], 'A');
addStep('p2', p2s[2], '셋째 문장이 말하는 1인칭 시점의 장단점으로 알맞은 것은?', [
  '정보의 범위가 제한적이지만 서술자의 내면에 깊이 공감할 수 있다.',
  '모든 인물의 생각을 알 수 있어 정보가 풍부하다.',
  '객관적 묘사에 유리하지만 감정 전달이 어렵다.',
  '정보의 범위가 무한하고 독자의 해석 여지가 좁다.'
], 'A');
addStep('p2', p2s[3], '넷째 문장이 밝히는 1인칭 시점의 하위 분류로 알맞은 것은?', [
  '주인공 시점과 관찰자 시점이다.',
  '전지적 시점과 제한적 시점이다.',
  '서술자 시점과 독자 시점이다.',
  '내면 시점과 외면 시점이다.'
], 'A');
addStep('p2', p2s[4], '다섯째 문장이 설명하는 두 하위 시점의 차이로 알맞은 것은?', [
  '주인공 시점은 서술자가 중심인물이고, 관찰자 시점은 다른 인물을 곁에서 지켜본다.',
  '주인공 시점은 다른 인물을 관찰하고, 관찰자 시점은 서술자가 주인공이다.',
  '두 시점 모두 서술자가 이야기 밖에 있다.',
  '두 시점은 동일한 방식으로 이야기를 전달한다.'
], 'A');
addStep('p2', p2s[5], '여섯째 문장이 말하는 관찰자 시점의 효과로 알맞은 것은?', [
  '주인공의 내면을 직접 알 수 없어 독자의 해석 여지가 넓어진다.',
  '주인공의 내면을 상세히 전달하여 독자의 공감을 극대화한다.',
  '모든 인물의 생각을 자유롭게 드러낸다.',
  '독자가 스스로 이야기를 만들어가도록 유도한다.'
], 'A');
addStep('p2', { start: 0, end: p2.length }, '둘째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '1인칭 시점은 서술자의 경험을 전달하며 주인공 시점과 관찰자 시점으로 세분된다.',
  '1인칭 시점은 모든 인물의 내면을 파악할 수 있는 전지적 시점이다.',
  '1인칭 시점과 3인칭 시점은 동일한 효과를 가진다.',
  '관찰자 시점은 주인공의 내면을 완벽하게 전달한다.'
], 'A');

// p3 정독
addStep('p3', p3s[0], '첫 문장이 설명하는 3인칭 시점의 특징으로 알맞은 것은?', [
  '이야기 밖의 서술자가 등장인물을 관찰하며 이야기를 전달한다.',
  '이야기 속 인물이 직접 서술자가 되어 자신의 이야기를 전달한다.',
  '서술자가 존재하지 않고 인물의 대화만으로 이야기가 전개된다.',
  '독자가 직접 서술자의 역할을 수행한다.'
], 'A');
addStep('p3', p3s[1], '둘째 문장이 밝히는 3인칭 시점의 하위 분류로 알맞은 것은?', [
  '전지적 작가 시점과 관찰자 시점이다.',
  '주인공 시점과 관찰자 시점이다.',
  '과거 시점과 현재 시점이다.',
  '서술 시점과 묘사 시점이다.'
], 'A');
addStep('p3', p3s[2], '셋째 문장이 설명하는 전지적 작가 시점의 능력으로 알맞은 것은?', [
  '모든 인물의 생각과 감정을 알며 과거와 미래까지 자유롭게 언급할 수 있다.',
  '한 인물의 내면만 알 수 있고 다른 인물은 관찰만 가능하다.',
  '인물의 행동만 묘사하고 내면은 전혀 서술하지 않는다.',
  '현재의 사건만 다루며 과거나 미래는 언급할 수 없다.'
], 'A');
addStep('p3', p3s[3], '넷째 문장이 말하는 전지적 작가 시점의 장점으로 알맞은 것은?', [
  '복잡한 인물 관계와 사건의 전모를 입체적으로 보여 줄 수 있다.',
  '서술자의 개인적 감정을 생생하게 전달할 수 있다.',
  '독자가 스스로 인물의 심리를 추론하도록 유도한다.',
  '객관적이고 절제된 분위기를 만들기에 유리하다.'
], 'A');
addStep('p3', p3s[4], '다섯째 문장이 설명하는 3인칭 관찰자 시점의 특징으로 알맞은 것은?', [
  '인물의 행동과 대화만 묘사하고 내면을 직접 서술하지 않는다.',
  '모든 인물의 생각과 감정을 상세하게 드러낸다.',
  '서술자 자신의 경험을 중심으로 이야기를 전개한다.',
  '과거와 미래의 사건을 자유롭게 오가며 서술한다.'
], 'A');
addStep('p3', p3s[5], '여섯째 문장이 말하는 3인칭 관찰자 시점의 효과로 알맞은 것은?', [
  '객관적이고 절제된 분위기를 만들며 독자가 심리를 추론하도록 유도한다.',
  '서술자의 강렬한 감정이 직접 전달되어 독자의 공감을 이끈다.',
  '인물의 내면을 가장 상세하게 전달하는 시점이다.',
  '여러 인물의 시점을 번갈아 보여 주는 효과가 있다.'
], 'A');
addStep('p3', { start: 0, end: p3.length }, '셋째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '3인칭 시점은 전지적 작가 시점과 관찰자 시점으로 나뉘며 각각 다른 효과를 지닌다.',
  '3인칭 시점에서 서술자는 항상 모든 인물의 내면을 알고 있다.',
  '3인칭 관찰자 시점은 전지적 작가 시점과 동일한 효과를 가진다.',
  '3인칭 시점에서는 서술자가 이야기 속 인물이어야 한다.'
], 'A');

// p4 정독
addStep('p4', p4s[0], '첫 문장이 말하는 시점 분석의 이점으로 알맞은 것은?', [
  '작가가 독자에게 어떤 경험을 제공하려 했는지 파악할 수 있다.',
  '소설의 출판 연도를 정확히 추정할 수 있다.',
  '작가의 개인적인 생활 방식을 알 수 있다.',
  '소설의 판매 부수를 예측할 수 있다.'
], 'A');
addStep('p4', p4s[1], '둘째 문장이 설명하는 시점 선택의 의도로 알맞은 것은?', [
  '1인칭은 내면에 끌어들이려는 의도, 전지적 시점은 복잡한 관계를 입체적으로 조명하려는 의도이다.',
  '1인칭은 객관적 묘사, 전지적 시점은 주관적 감정 전달이 목적이다.',
  '두 시점 모두 동일한 의도로 선택된다.',
  '시점 선택은 작가의 의도와 무관한 우연적 결정이다.'
], 'A');
addStep('p4', p4s[2], '셋째 문장이 설명하는 시점 전환의 기능으로 알맞은 것은?', [
  '서사적 긴장을 높이거나 새로운 정보를 제공하는 서사 전략이다.',
  '작가의 실수로 인한 일관성 부재이다.',
  '독자를 혼란스럽게 만들어 흥미를 떨어뜨린다.',
  '시점 전환은 현대 소설에서만 사용되는 기법이다.'
], 'A');
addStep('p4', p4s[3], '넷째 문장이 요약하는 서술 시점의 궁극적 의미로 알맞은 것은?', [
  '작가가 독자의 인식과 감정을 조율하는 핵심적인 문학적 수단이다.',
  '소설의 형식적 완성도만을 위한 기술적 장치이다.',
  '독자와 무관한 작가만의 창작 습관이다.',
  '소설의 내용보다 분량을 조절하는 수단이다.'
], 'A');
addStep('p4', { start: 0, end: p4.length }, '넷째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '서술 시점은 작가의 의도를 드러내며 독자의 인식과 감정을 조율하는 핵심 문학적 수단이다.',
  '서술 시점은 소설의 형식에만 관련된 부수적 요소이다.',
  '시점 전환은 작가의 실수이므로 피해야 한다.',
  '모든 소설은 반드시 하나의 시점만을 유지해야 한다.'
], 'A');

console.log(`정독 스텝 수: ${timeline.length}`);

// ── 복기 (recall) - 정확히 8카드 ──
const recall = {
  cards: [
    { id: 'c1', text: '서술 시점은 누가 어떤 위치에서 이야기를 전달하는가를 결정한다.' },
    { id: 'c2', text: '1인칭 시점은 이야기 속 인물이 서술자가 되어 경험과 감정을 직접 전달한다.' },
    { id: 'c3', text: '1인칭 주인공 시점은 서술자가 중심인물이고, 관찰자 시점은 곁에서 지켜본다.' },
    { id: 'c4', text: '전지적 작가 시점은 모든 인물의 내면과 사건의 전모를 알고 서술한다.' },
    { id: 'c5', text: '3인칭 관찰자 시점은 행동과 대화만 묘사하여 독자의 추론을 유도한다.' },
    { id: 'c6', text: '시점 선택은 작가가 독자에게 어떤 경험을 제공하려는지를 반영한다.' },
    { id: 'c7', text: '시점 전환은 서사적 긴장을 높이거나 새 정보를 제공하는 전략이다.' },
    { id: 'c8', text: '서술 시점은 독자의 인식과 감정을 조율하는 핵심 문학적 수단이다.' }
  ],
  correctOrder: ['c1','c2','c3','c4','c5','c6','c7','c8'],
  seedPenalty: 1
};

// ── 확인 (confirm) - 7문항 ──
const scoring_c = { correctDeltaSec: 30, wrongDeltaSec: -45 };
const confirm = { questions: [
  { id: 'q1', prompt: '소설에서 이야기를 전달하는 방식을 무엇이라 하는가?',
    answerText: '서술 시점', answerMatchMode: 'ANY',
    answerRanges: [...findAllRanges('p1', '서술 시점'), ...findAllRanges('p4', '서술 시점')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q2', prompt: '이야기 속 인물이 직접 서술자가 되는 시점을 무엇이라 하는가?',
    answerText: '1인칭 시점', answerMatchMode: 'ANY',
    answerRanges: [...findAllRanges('p2', '1인칭 시점'), ...findAllRanges('p4', '1인칭 시점')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q3', prompt: '서술자가 모든 인물의 생각과 감정을 알고 있는 시점을 무엇이라 하는가?',
    answerText: '전지적 작가 시점', answerMatchMode: 'ANY',
    answerRanges: [...findAllRanges('p3', '전지적 작가 시점'), ...findAllRanges('p4', '전지적 작가 시점')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q4', prompt: '3인칭 시점에서 인물의 행동과 대화만 묘사하는 시점을 무엇이라 하는가?',
    answerText: '3인칭 관찰자 시점', answerMatchMode: 'ANY',
    answerRanges: [findRange('p3', '3인칭 관찰자 시점')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q5', prompt: '1인칭 시점에서 서술자가 다른 인물의 이야기를 곁에서 지켜보는 시점을 무엇이라 하는가?',
    answerText: '관찰자 시점', answerMatchMode: 'ANY',
    answerRanges: findAllRanges('p2', '관찰자 시점'),
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q6', prompt: '하나의 소설 안에서 시점이 바뀔 때, 그것이 서사적 긴장을 높이는 역할을 하는 것을 무엇이라 하는가?',
    answerText: '서사 전략', answerMatchMode: 'ANY',
    answerRanges: [findRange('p4', '서사 전략')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q7', prompt: '서술 시점의 궁극적 의미를 한마디로 표현한다면 작가가 독자의 무엇을 조율하는 수단인가?',
    answerText: '인식과 감정', answerMatchMode: 'ANY',
    answerRanges: [findRange('p4', '인식과 감정')],
    scoring: scoring_c, revealOnWrong: true }
]};

console.log(`복기 카드 수: ${recall.cards.length}`);
console.log(`확인 문항 수: ${confirm.questions.length}`);

// ── content 객체 조립 ──
const content = {
  contentId: 'dr-r3-016',
  contentType: 'DAILY_READING',
  version: 1,
  status: 'PUBLISHED',
  title: '일일 독해(러셀 3) Day 16 문학',
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
  day_index: 16,
  module_key: 'reading_training',
  schema_version: '1.0',
  content
};

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell3');
fs.writeFileSync(path.join(staticDir, '016.json'), JSON.stringify(content, null, 2), 'utf8');
console.log('static 016.json 저장 완료');

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell3.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[15] = batchItem;
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log('배치 파일 day_index 16 업데이트 완료');
