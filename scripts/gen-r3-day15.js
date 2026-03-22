// 러셀3 Day 15 비문학 - 면역 체계의 원리 (재작성)
const fs = require('fs');
const path = require('path');

// ── 지문 (4문단, 목표 1300자 ±50) ── 주제: 면역 체계의 원리
const p1 = '우리 몸은 외부에서 침입하는 세균, 바이러스 등의 병원체에 끊임없이 노출되어 있다. 이러한 병원체의 공격으로부터 몸을 보호하는 방어 시스템을 면역 체계라 한다. 면역 체계는 크게 선천 면역과 적응 면역의 두 가지로 나뉜다. 선천 면역은 태어날 때부터 갖추고 있는 방어 기제로, 병원체의 종류와 관계없이 즉각적으로 반응한다. 피부와 점막이라는 물리적 장벽이 선천 면역의 첫 번째 방어선이며, 이 장벽을 뚫고 들어온 병원체에 대해서는 대식세포와 같은 면역 세포가 즉시 작동하여 이들을 포식하고 분해한다.';
const p2 = '선천 면역이 병원체를 즉시 공격하는 비특이적 방어라면, 적응 면역은 특정 병원체를 정밀하게 인식하고 제거하는 특이적 방어이다. 적응 면역의 핵심 세포는 림프구인데, 이 중 B림프구는 항체를 생산하고 T림프구는 감염된 세포를 직접 파괴한다. 항체는 병원체 표면의 특정 물질인 항원에 결합하여 병원체의 활동을 차단하거나 다른 면역 세포가 이를 쉽게 제거할 수 있도록 돕는다. 적응 면역이 특이적 방어라 불리는 이유는 각각의 림프구가 오직 하나의 항원만을 인식하도록 설계되어 있기 때문이다. 이러한 정밀한 인식 능력은 면역 체계가 수십억 종에 달하는 다양한 병원체에 개별적으로 대응할 수 있게 해 준다.';
const p3 = '적응 면역의 가장 중요한 특성은 면역 기억이다. 특정 병원체에 처음 감염되면 적응 면역이 활성화되기까지 며칠이 걸리지만, 같은 병원체가 다시 침입하면 기억 세포 덕분에 훨씬 빠르고 강력한 면역 반응이 일어난다. 기억 세포는 첫 번째 감염 시 생성되어 체내에 오랫동안 남아 있으면서, 동일한 병원체의 재침입을 감시한다. 이 원리를 이용한 것이 바로 백신이다. 백신은 약화되거나 비활성화된 병원체 또는 그 일부를 체내에 주입하여, 실제 감염 없이도 면역 기억을 형성하게 한다. 이를 통해 나중에 해당 병원체에 노출되었을 때 신속하고 효과적인 방어가 가능해진다.';
const p4 = '선천 면역과 적응 면역은 독립적으로 작동하는 것이 아니라 서로 긴밀하게 협력한다. 선천 면역의 대식세포는 병원체를 분해한 뒤 그 조각을 T림프구에 전달하여 적응 면역을 활성화시킨다. 이 과정을 항원 제시라 하며, 이를 통해 선천 면역이 적응 면역의 방아쇠 역할을 수행한다. 또한 적응 면역에서 생산된 항체는 선천 면역의 세포들이 병원체를 더 효율적으로 제거할 수 있도록 돕는다. 이처럼 두 면역 시스템은 상호 보완적으로 작동하며, 이 협력이 무너지면 면역 결핍이나 자가 면역 질환과 같은 문제가 발생할 수 있다.';

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
  '우리 몸은 외부에서 침입하는 세균, 바이러스 등의 병원체에 끊임없이 노출되어 있다.',
  '이러한 병원체의 공격으로부터 몸을 보호하는 방어 시스템을 면역 체계라 한다.',
  '면역 체계는 크게 선천 면역과 적응 면역의 두 가지로 나뉜다.',
  '선천 면역은 태어날 때부터 갖추고 있는 방어 기제로, 병원체의 종류와 관계없이 즉각적으로 반응한다.',
  '피부와 점막이라는 물리적 장벽이 선천 면역의 첫 번째 방어선이며, 이 장벽을 뚫고 들어온 병원체에 대해서는 대식세포와 같은 면역 세포가 즉시 작동하여 이들을 포식하고 분해한다.'
]);
const p2s = sentenceRanges('p2', [
  '선천 면역이 병원체를 즉시 공격하는 비특이적 방어라면, 적응 면역은 특정 병원체를 정밀하게 인식하고 제거하는 특이적 방어이다.',
  '적응 면역의 핵심 세포는 림프구인데, 이 중 B림프구는 항체를 생산하고 T림프구는 감염된 세포를 직접 파괴한다.',
  '항체는 병원체 표면의 특정 물질인 항원에 결합하여 병원체의 활동을 차단하거나 다른 면역 세포가 이를 쉽게 제거할 수 있도록 돕는다.',
  '적응 면역이 특이적 방어라 불리는 이유는 각각의 림프구가 오직 하나의 항원만을 인식하도록 설계되어 있기 때문이다.',
  '이러한 정밀한 인식 능력은 면역 체계가 수십억 종에 달하는 다양한 병원체에 개별적으로 대응할 수 있게 해 준다.'
]);
const p3s = sentenceRanges('p3', [
  '적응 면역의 가장 중요한 특성은 면역 기억이다.',
  '특정 병원체에 처음 감염되면 적응 면역이 활성화되기까지 며칠이 걸리지만, 같은 병원체가 다시 침입하면 기억 세포 덕분에 훨씬 빠르고 강력한 면역 반응이 일어난다.',
  '기억 세포는 첫 번째 감염 시 생성되어 체내에 오랫동안 남아 있으면서, 동일한 병원체의 재침입을 감시한다.',
  '이 원리를 이용한 것이 바로 백신이다.',
  '백신은 약화되거나 비활성화된 병원체 또는 그 일부를 체내에 주입하여, 실제 감염 없이도 면역 기억을 형성하게 한다.',
  '이를 통해 나중에 해당 병원체에 노출되었을 때 신속하고 효과적인 방어가 가능해진다.'
]);
const p4s = sentenceRanges('p4', [
  '선천 면역과 적응 면역은 독립적으로 작동하는 것이 아니라 서로 긴밀하게 협력한다.',
  '선천 면역의 대식세포는 병원체를 분해한 뒤 그 조각을 T림프구에 전달하여 적응 면역을 활성화시킨다.',
  '이 과정을 항원 제시라 하며, 이를 통해 선천 면역이 적응 면역의 방아쇠 역할을 수행한다.',
  '또한 적응 면역에서 생산된 항체는 선천 면역의 세포들이 병원체를 더 효율적으로 제거할 수 있도록 돕는다.',
  '이처럼 두 면역 시스템은 상호 보완적으로 작동하며, 이 협력이 무너지면 면역 결핍이나 자가 면역 질환과 같은 문제가 발생할 수 있다.'
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
addStep('p1', p1s[0], '첫 문장이 말하는 우리 몸의 상황으로 알맞은 것은?', [
  '세균, 바이러스 등의 병원체에 끊임없이 노출되어 있다.',
  '외부의 물리적 충격에만 취약하다.',
  '체내에서 스스로 병원체를 생성한다.',
  '병원체의 침입을 완벽하게 차단하고 있다.'
], 'A');
addStep('p1', p1s[1], '둘째 문장이 정의하는 면역 체계의 의미로 알맞은 것은?', [
  '병원체의 공격으로부터 몸을 보호하는 방어 시스템이다.',
  '외부 물질을 흡수하여 에너지로 전환하는 체계이다.',
  '체내의 노폐물을 배출하는 순환 시스템이다.',
  '신경 신호를 전달하여 움직임을 조절하는 체계이다.'
], 'A');
addStep('p1', p1s[2], '셋째 문장이 밝히는 면역 체계의 두 종류로 알맞은 것은?', [
  '선천 면역과 적응 면역이다.',
  '자연 면역과 인공 면역이다.',
  '물리적 면역과 화학적 면역이다.',
  '세포 면역과 체액 면역이다.'
], 'A');
addStep('p1', p1s[3], '넷째 문장이 설명하는 선천 면역의 특징으로 알맞은 것은?', [
  '태어날 때부터 갖추고 있으며 병원체 종류와 관계없이 즉각적으로 반응한다.',
  '특정 병원체를 학습한 뒤에야 작동하기 시작한다.',
  '성인이 된 후에야 완성되는 후천적 방어 기제이다.',
  '한 번 작동한 후에는 다시는 활성화되지 않는다.'
], 'A');
addStep('p1', p1s[4], '다섯째 문장이 설명하는 선천 면역의 방어 과정으로 알맞은 것은?', [
  '피부와 점막이 첫 방어선이고, 뚫린 경우 대식세포가 포식·분해한다.',
  '림프구가 항체를 생산하여 병원체를 차단한다.',
  '기억 세포가 재침입하는 병원체를 감시한다.',
  '백신이 면역 기억을 형성하여 방어한다.'
], 'A');
addStep('p1', { start: 0, end: p1.length }, '첫째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '면역 체계 중 선천 면역은 물리적 장벽과 대식세포를 통해 비특이적으로 병원체에 즉각 대응한다.',
  '면역 체계는 오직 적응 면역만으로 구성되어 특정 병원체에만 반응한다.',
  '선천 면역은 특정 병원체를 학습해야만 작동하는 후천적 방어이다.',
  '피부와 점막은 면역 체계와 무관한 신체 구조이다.'
], 'A');

// p2 정독
addStep('p2', p2s[0], '첫 문장이 대비하는 두 면역의 차이로 알맞은 것은?', [
  '선천 면역은 비특이적 방어이고, 적응 면역은 특이적 방어이다.',
  '선천 면역은 느리고, 적응 면역은 즉각적이다.',
  '두 면역 모두 동일한 방식으로 병원체에 대응한다.',
  '선천 면역은 항체를 생산하고, 적응 면역은 물리적 장벽을 형성한다.'
], 'A');
addStep('p2', p2s[1], '둘째 문장이 설명하는 림프구의 두 종류와 기능으로 알맞은 것은?', [
  'B림프구는 항체를 생산하고 T림프구는 감염 세포를 직접 파괴한다.',
  'B림프구는 세포를 파괴하고 T림프구는 항체를 생산한다.',
  '두 림프구 모두 병원체를 포식하여 분해한다.',
  'B림프구는 선천 면역에, T림프구는 적응 면역에만 속한다.'
], 'A');
addStep('p2', p2s[2], '셋째 문장이 설명하는 항체의 작용으로 알맞은 것은?', [
  '항원에 결합하여 병원체 활동을 차단하거나 다른 면역 세포의 제거를 돕는다.',
  '병원체를 직접 분해하여 완전히 소멸시킨다.',
  '피부와 점막을 강화하여 물리적 장벽을 높인다.',
  '대식세포를 비활성화하여 과잉 면역 반응을 막는다.'
], 'A');
addStep('p2', p2s[3], '넷째 문장이 설명하는 적응 면역이 특이적 방어인 이유로 알맞은 것은?', [
  '각 림프구가 오직 하나의 항원만을 인식하도록 설계되어 있기 때문이다.',
  '모든 림프구가 모든 병원체를 동시에 인식할 수 있기 때문이다.',
  '항체가 병원체의 종류와 무관하게 작용하기 때문이다.',
  '적응 면역 세포가 선천 면역보다 수가 적기 때문이다.'
], 'A');
addStep('p2', p2s[4], '다섯째 문장이 말하는 정밀 인식의 이점으로 알맞은 것은?', [
  '수십억 종의 다양한 병원체에 개별적으로 대응할 수 있다.',
  '한 가지 병원체에만 집중하여 방어할 수 있다.',
  '면역 반응의 속도가 느려지는 대신 정확도가 높아진다.',
  '병원체의 종류를 구별하지 않고 일괄 처리할 수 있다.'
], 'A');
addStep('p2', { start: 0, end: p2.length }, '둘째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '적응 면역은 림프구를 통해 특정 항원을 정밀하게 인식하고 제거하는 특이적 방어이다.',
  '적응 면역은 선천 면역과 동일한 방식으로 작동한다.',
  '항체는 모든 병원체에 동일하게 작용하므로 비특이적 방어에 해당한다.',
  'B림프구와 T림프구는 동일한 기능을 수행한다.'
], 'A');

// p3 정독
addStep('p3', p3s[0], '첫 문장이 말하는 적응 면역의 가장 중요한 특성으로 알맞은 것은?', [
  '면역 기억이다.',
  '즉각적 반응이다.',
  '물리적 장벽이다.',
  '항체 생산이다.'
], 'A');
addStep('p3', p3s[1], '둘째 문장이 비교하는 첫 감염과 재감염의 차이로 알맞은 것은?', [
  '첫 감염 시 며칠이 걸리지만, 재감염 시 기억 세포로 빠르고 강력한 반응이 일어난다.',
  '첫 감염과 재감염에서 면역 반응의 속도는 동일하다.',
  '재감염 시에는 면역 반응이 전혀 일어나지 않는다.',
  '첫 감염 시가 재감염 시보다 면역 반응이 더 강력하다.'
], 'A');
addStep('p3', p3s[2], '셋째 문장이 설명하는 기억 세포의 역할로 알맞은 것은?', [
  '첫 감염 시 생성되어 오랫동안 남아 동일 병원체의 재침입을 감시한다.',
  '감염이 끝나면 즉시 소멸하여 더 이상 작동하지 않는다.',
  '모든 종류의 병원체를 동시에 감시하는 범용 세포이다.',
  '선천 면역에만 속하는 세포로 적응 면역과는 무관하다.'
], 'A');
addStep('p3', { start: p3s[3].start, end: p3s[4].end }, '넷째~다섯째 문장이 설명하는 백신의 원리로 알맞은 것은?', [
  '약화된 병원체를 주입하여 실제 감염 없이 면역 기억을 형성한다.',
  '강력한 항생제를 투여하여 병원체를 직접 죽인다.',
  '선천 면역의 물리적 장벽을 인위적으로 강화한다.',
  '면역 반응을 억제하여 알레르기를 예방한다.'
], 'A');
addStep('p3', p3s[5], '여섯째 문장이 말하는 백신의 효과로 알맞은 것은?', [
  '해당 병원체에 노출되었을 때 신속하고 효과적인 방어가 가능해진다.',
  '모든 종류의 질병을 영구적으로 예방할 수 있다.',
  '면역 체계를 완전히 대체하여 자연 면역이 불필요해진다.',
  '병원체를 체내에서 영구적으로 제거할 수 있다.'
], 'A');
addStep('p3', { start: 0, end: p3.length }, '셋째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '면역 기억은 재감염 시 빠른 대응을 가능하게 하며, 백신은 이 원리를 이용한 것이다.',
  '면역 기억은 선천 면역에만 존재하는 특성이다.',
  '백신은 면역 기억과 무관하게 작동하는 약물이다.',
  '기억 세포는 첫 감염 후 즉시 소멸하므로 재감염 방어에 기여하지 않는다.'
], 'A');

// p4 정독
addStep('p4', p4s[0], '첫 문장이 강조하는 두 면역 시스템의 관계로 알맞은 것은?', [
  '독립적이 아니라 서로 긴밀하게 협력한다.',
  '완전히 독립적으로 작동하여 서로 간섭하지 않는다.',
  '선천 면역만이 중요하고 적응 면역은 보조적이다.',
  '적응 면역만 작동하고 선천 면역은 불필요하다.'
], 'A');
addStep('p4', p4s[1], '둘째 문장이 설명하는 대식세포의 역할로 알맞은 것은?', [
  '병원체를 분해한 뒤 조각을 T림프구에 전달하여 적응 면역을 활성화시킨다.',
  '항체를 직접 생산하여 병원체를 차단한다.',
  '기억 세포를 생성하여 재감염에 대비한다.',
  '피부와 점막을 강화하여 물리적 장벽을 높인다.'
], 'A');
addStep('p4', p4s[2], '셋째 문장이 설명하는 항원 제시의 의미로 알맞은 것은?', [
  '선천 면역이 적응 면역의 방아쇠 역할을 수행하는 과정이다.',
  '적응 면역이 선천 면역을 비활성화하는 과정이다.',
  '병원체가 스스로 항원을 숨기는 회피 전략이다.',
  '림프구가 직접 피부 표면에 나타나 병원체를 맞서는 과정이다.'
], 'A');
addStep('p4', p4s[3], '넷째 문장이 설명하는 항체의 추가 역할로 알맞은 것은?', [
  '선천 면역의 세포들이 병원체를 더 효율적으로 제거하도록 돕는다.',
  '선천 면역의 작동을 억제하여 과잉 반응을 방지한다.',
  '병원체를 직접 소멸시켜 선천 면역의 개입을 불필요하게 만든다.',
  '물리적 장벽인 피부와 점막을 재생시킨다.'
], 'A');
addStep('p4', p4s[4], '다섯째 문장이 경고하는 협력 붕괴의 결과로 알맞은 것은?', [
  '면역 결핍이나 자가 면역 질환과 같은 문제가 발생할 수 있다.',
  '면역 체계가 더욱 강화되어 질병에 걸리지 않게 된다.',
  '선천 면역만으로도 모든 병원체를 완벽하게 방어할 수 있다.',
  '적응 면역이 자동으로 선천 면역의 기능을 대체한다.'
], 'A');
addStep('p4', { start: 0, end: p4.length }, '넷째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '선천 면역과 적응 면역은 항원 제시 등을 통해 상호 보완적으로 협력한다.',
  '선천 면역과 적응 면역은 완전히 독립적이므로 협력하지 않는다.',
  '항원 제시는 적응 면역에서 선천 면역으로 정보를 전달하는 과정이다.',
  '면역 결핍은 선천 면역의 과잉 작동이 원인이다.'
], 'A');

console.log(`정독 스텝 수: ${timeline.length}`);

// ── 복기 (recall) - 정확히 8카드 ──
const recall = {
  cards: [
    { id: 'c1', text: '면역 체계는 선천 면역과 적응 면역의 두 가지로 나뉜다.' },
    { id: 'c2', text: '선천 면역은 비특이적 방어로 대식세포가 병원체를 즉시 포식·분해한다.' },
    { id: 'c3', text: '적응 면역은 특이적 방어로 B림프구가 항체를, T림프구가 세포 파괴를 담당한다.' },
    { id: 'c4', text: '항체는 병원체의 항원에 결합하여 활동을 차단하거나 제거를 돕는다.' },
    { id: 'c5', text: '면역 기억으로 재감염 시 빠르고 강력한 면역 반응이 일어난다.' },
    { id: 'c6', text: '백신은 면역 기억을 이용하여 실제 감염 없이 방어 능력을 형성한다.' },
    { id: 'c7', text: '항원 제시를 통해 선천 면역이 적응 면역의 방아쇠 역할을 한다.' },
    { id: 'c8', text: '두 면역의 협력이 무너지면 면역 결핍이나 자가 면역 질환이 생길 수 있다.' }
  ],
  correctOrder: ['c1','c2','c3','c4','c5','c6','c7','c8'],
  seedPenalty: 1
};

// ── 확인 (confirm) - 7문항 ──
const scoring_c = { correctDeltaSec: 30, wrongDeltaSec: -45 };
const confirm = { questions: [
  { id: 'q1', prompt: '태어날 때부터 갖추고 있으며 병원체 종류와 관계없이 즉각 반응하는 면역을 무엇이라 하는가?',
    answerText: '선천 면역', answerMatchMode: 'ANY',
    answerRanges: [...findAllRanges('p1', '선천 면역'), ...findAllRanges('p4', '선천 면역')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q2', prompt: '특정 병원체를 정밀하게 인식하고 제거하는 면역을 무엇이라 하는가?',
    answerText: '적응 면역', answerMatchMode: 'ANY',
    answerRanges: [...findAllRanges('p1', '적응 면역'), ...findAllRanges('p2', '적응 면역'), ...findAllRanges('p3', '적응 면역'), ...findAllRanges('p4', '적응 면역')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q3', prompt: '병원체 표면의 특정 물질로 항체가 결합하는 대상을 무엇이라 하는가?',
    answerText: '항원', answerMatchMode: 'ANY',
    answerRanges: [...findAllRanges('p2', '항원'), ...findAllRanges('p4', '항원')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q4', prompt: '첫 감염 시 생성되어 동일 병원체의 재침입을 감시하는 세포를 무엇이라 하는가?',
    answerText: '기억 세포', answerMatchMode: 'ANY',
    answerRanges: [...findAllRanges('p3', '기억 세포')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q5', prompt: '면역 기억의 원리를 이용하여 실제 감염 없이 방어 능력을 형성하는 것은 무엇인가?',
    answerText: '백신', answerMatchMode: 'ANY',
    answerRanges: [...findAllRanges('p3', '백신')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q6', prompt: '대식세포가 병원체 조각을 T림프구에 전달하여 적응 면역을 활성화하는 과정을 무엇이라 하는가?',
    answerText: '항원 제시', answerMatchMode: 'ANY',
    answerRanges: [findRange('p4', '항원 제시')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q7', prompt: '두 면역 시스템의 협력이 무너지면 발생할 수 있는 질환 두 가지는 무엇인가?',
    answerText: '면역 결핍, 자가 면역 질환',
    answerMatchMode: 'ALL',
    answerRanges: [findRange('p4', '면역 결핍'), findRange('p4', '자가 면역 질환')],
    scoring: scoring_c, revealOnWrong: true }
]};

console.log(`복기 카드 수: ${recall.cards.length}`);
console.log(`확인 문항 수: ${confirm.questions.length}`);

// ── content 객체 조립 ──
const content = {
  contentId: 'dr-r3-015',
  contentType: 'DAILY_READING',
  version: 1,
  status: 'PUBLISHED',
  title: '일일 독해(러셀 3) Day 15 비문학',
  description: '일일 독해 - 정독·복기·확인',
  targetLevel: 'RUSSELL_3',
  schoolGradeRange: { min: 9, max: 10 },
  area: 'READING',
  subArea: 'NONFICTION',
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
  sub_area: 'NONFICTION',
  day_index: 15,
  module_key: 'reading_training',
  schema_version: '1.0',
  content
};

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell3');
fs.writeFileSync(path.join(staticDir, '015.json'), JSON.stringify(content, null, 2), 'utf8');
console.log('static 015.json 저장 완료');

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell3.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[14] = batchItem;
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log('배치 파일 day_index 15 업데이트 완료');
