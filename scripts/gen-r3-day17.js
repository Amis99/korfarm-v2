// 러셀3 Day 17 비문학 - 빛의 이중성과 양자역학의 탄생 (재작성)
const fs = require('fs');
const path = require('path');

// ── 지문 (4문단, 목표 1300자 ±50) ── 주제: 빛의 이중성과 양자역학의 탄생
const p1 = '빛은 오래전부터 과학자들의 호기심을 자극해 온 연구 대상이다. 17세기에 뉴턴은 빛이 작은 입자의 흐름이라는 입자설을 주장하였고, 같은 시기에 하위헌스는 빛이 파동처럼 퍼져 나간다는 파동설을 내세웠다. 19세기에 영의 이중 슬릿 실험이 빛의 간섭 현상을 뚜렷하게 보여 주면서 파동설이 주류로 자리 잡았다. 간섭이란 두 파동이 만나 서로 강해지거나 약해지는 현상으로, 이는 입자가 아닌 파동만이 보여 줄 수 있는 특성이다. 이후 맥스웰이 빛을 전자기파의 일종으로 설명하면서 파동설은 더욱 견고해졌다. 당시 과학자들은 빛의 본질이 파동이라는 데 의문을 품지 않았다.';
const p2 = '그러나 20세기 초, 기존의 파동설로는 설명할 수 없는 현상이 발견되었다. 금속 표면에 빛을 비추면 전자가 튀어나오는 광전 효과가 그것이다. 파동설에 따르면 빛의 세기가 강할수록 전자가 더 큰 에너지를 가지고 튀어나와야 하지만, 실제로는 빛의 세기와 무관하게 빛의 진동수가 특정 값 이상이어야만 전자가 방출되었다. 아인슈타인은 이 현상을 설명하기 위해 빛이 광자라는 에너지 덩어리로 이루어져 있다는 가설을 제시하였다. 각 광자의 에너지는 빛의 진동수에 비례하며, 진동수가 낮은 빛은 아무리 많은 양을 비추어도 전자를 방출시킬 수 없다는 것이다. 이 설명은 빛이 파동이면서 동시에 입자의 성질도 가진다는 빛의 이중성 개념을 탄생시켰다.';
const p3 = '빛의 이중성은 물질 세계에도 확장되었다. 프랑스 물리학자 드브로이는 빛뿐만 아니라 전자와 같은 물질 입자도 파동의 성질을 가진다는 물질파 가설을 제안하였다. 이 가설에 따르면 운동량이 작은 입자일수록 파장이 길어지며, 이는 곧 일상적인 크기의 물체에서는 파동 성질이 감지되지 않지만 전자처럼 극히 작은 입자에서는 파동 현상이 관측될 수 있음을 뜻한다. 실제로 데이비슨과 거머의 전자 회절 실험은 전자가 파동처럼 간섭과 회절을 일으킨다는 사실을 실험적으로 입증하였다. 이로써 입자와 파동의 경계가 무너지고, 미시 세계를 설명하는 새로운 물리학의 기틀이 마련되었다.';
const p4 = '빛의 이중성과 물질파 개념은 양자역학이라는 새로운 학문의 토대가 되었다. 양자역학에서는 입자의 위치와 운동량을 동시에 정확하게 측정할 수 없다는 불확정성 원리가 핵심을 이룬다. 이 원리에 따르면 미시 세계의 입자는 확정된 궤도를 따르는 것이 아니라 확률적으로 분포하며, 관측 행위 자체가 입자의 상태에 영향을 미친다. 양자역학은 고전 물리학의 결정론적 세계관을 뒤흔들고 확률과 불확정성에 기반한 새로운 자연관을 제시하였다. 오늘날 반도체, 레이저, 의료 영상 등 현대 기술의 상당 부분이 양자역학의 원리에 기초하고 있으며, 이는 빛의 본질에 대한 탐구가 과학과 기술 모두에 혁명적 변화를 가져왔음을 보여 준다.';

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
  '빛은 오래전부터 과학자들의 호기심을 자극해 온 연구 대상이다.',
  '17세기에 뉴턴은 빛이 작은 입자의 흐름이라는 입자설을 주장하였고, 같은 시기에 하위헌스는 빛이 파동처럼 퍼져 나간다는 파동설을 내세웠다.',
  '19세기에 영의 이중 슬릿 실험이 빛의 간섭 현상을 뚜렷하게 보여 주면서 파동설이 주류로 자리 잡았다.',
  '간섭이란 두 파동이 만나 서로 강해지거나 약해지는 현상으로, 이는 입자가 아닌 파동만이 보여 줄 수 있는 특성이다.',
  '이후 맥스웰이 빛을 전자기파의 일종으로 설명하면서 파동설은 더욱 견고해졌다.',
  '당시 과학자들은 빛의 본질이 파동이라는 데 의문을 품지 않았다.'
]);
const p2s = sentenceRanges('p2', [
  '그러나 20세기 초, 기존의 파동설로는 설명할 수 없는 현상이 발견되었다.',
  '금속 표면에 빛을 비추면 전자가 튀어나오는 광전 효과가 그것이다.',
  '파동설에 따르면 빛의 세기가 강할수록 전자가 더 큰 에너지를 가지고 튀어나와야 하지만, 실제로는 빛의 세기와 무관하게 빛의 진동수가 특정 값 이상이어야만 전자가 방출되었다.',
  '아인슈타인은 이 현상을 설명하기 위해 빛이 광자라는 에너지 덩어리로 이루어져 있다는 가설을 제시하였다.',
  '각 광자의 에너지는 빛의 진동수에 비례하며, 진동수가 낮은 빛은 아무리 많은 양을 비추어도 전자를 방출시킬 수 없다는 것이다.',
  '이 설명은 빛이 파동이면서 동시에 입자의 성질도 가진다는 빛의 이중성 개념을 탄생시켰다.'
]);
const p3s = sentenceRanges('p3', [
  '빛의 이중성은 물질 세계에도 확장되었다.',
  '프랑스 물리학자 드브로이는 빛뿐만 아니라 전자와 같은 물질 입자도 파동의 성질을 가진다는 물질파 가설을 제안하였다.',
  '이 가설에 따르면 운동량이 작은 입자일수록 파장이 길어지며, 이는 곧 일상적인 크기의 물체에서는 파동 성질이 감지되지 않지만 전자처럼 극히 작은 입자에서는 파동 현상이 관측될 수 있음을 뜻한다.',
  '실제로 데이비슨과 거머의 전자 회절 실험은 전자가 파동처럼 간섭과 회절을 일으킨다는 사실을 실험적으로 입증하였다.',
  '이로써 입자와 파동의 경계가 무너지고, 미시 세계를 설명하는 새로운 물리학의 기틀이 마련되었다.'
]);
const p4s = sentenceRanges('p4', [
  '빛의 이중성과 물질파 개념은 양자역학이라는 새로운 학문의 토대가 되었다.',
  '양자역학에서는 입자의 위치와 운동량을 동시에 정확하게 측정할 수 없다는 불확정성 원리가 핵심을 이룬다.',
  '이 원리에 따르면 미시 세계의 입자는 확정된 궤도를 따르는 것이 아니라 확률적으로 분포하며, 관측 행위 자체가 입자의 상태에 영향을 미친다.',
  '양자역학은 고전 물리학의 결정론적 세계관을 뒤흔들고 확률과 불확정성에 기반한 새로운 자연관을 제시하였다.',
  '오늘날 반도체, 레이저, 의료 영상 등 현대 기술의 상당 부분이 양자역학의 원리에 기초하고 있으며, 이는 빛의 본질에 대한 탐구가 과학과 기술 모두에 혁명적 변화를 가져왔음을 보여 준다.'
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
addStep('p1', p1s[0], '첫 문장에서 빛이 소개되는 맥락으로 알맞은 것은?', [
  '오래전부터 과학자들의 호기심을 자극해 온 연구 대상이다.',
  '최근에야 연구가 시작된 새로운 현상이다.',
  '일상생활에서만 관찰되는 단순한 현상이다.',
  '과학적 탐구의 대상이 아닌 철학적 주제이다.'
], 'A');
addStep('p1', p1s[1], '둘째 문장이 소개하는 17세기의 두 학설로 알맞은 것은?', [
  '뉴턴의 입자설과 하위헌스의 파동설이다.',
  '뉴턴의 파동설과 하위헌스의 입자설이다.',
  '갈릴레이의 중력설과 케플러의 궤도설이다.',
  '뉴턴의 만유인력설과 하위헌스의 진자설이다.'
], 'A');
addStep('p1', p1s[2], '셋째 문장이 말하는 파동설이 주류가 된 계기로 알맞은 것은?', [
  '영의 이중 슬릿 실험이 빛의 간섭 현상을 보여 주었기 때문이다.',
  '뉴턴이 입자설을 철회하였기 때문이다.',
  '망원경의 발명으로 빛의 입자를 관찰할 수 있게 되었기 때문이다.',
  '파동설을 지지하는 종교적 근거가 발견되었기 때문이다.'
], 'A');
addStep('p1', p1s[3], '넷째 문장이 정의하는 간섭의 의미로 알맞은 것은?', [
  '두 파동이 만나 서로 강해지거나 약해지는 현상이다.',
  '두 입자가 충돌하여 합쳐지는 현상이다.',
  '빛이 물체에 반사되어 색이 변하는 현상이다.',
  '소리가 벽에 부딪혀 메아리가 되는 현상이다.'
], 'A');
addStep('p1', { start: p1s[4].start, end: p1s[5].end }, '다섯째~여섯째 문장이 말하는 파동설의 확립 과정으로 알맞은 것은?', [
  '맥스웰이 빛을 전자기파로 설명하면서 파동설이 더욱 견고해졌다.',
  '뉴턴이 입자설을 수정하여 파동설에 동의하였다.',
  '새로운 실험이 입자설을 지지하는 증거를 제공하였다.',
  '파동설과 입자설이 동시에 부정되었다.'
], 'A');
addStep('p1', { start: 0, end: p1.length }, '첫째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '빛에 대해 입자설과 파동설이 경쟁하다가 간섭 현상의 발견으로 파동설이 주류가 되었다.',
  '빛은 처음부터 입자로만 인식되어 왔으며 파동설은 등장하지 않았다.',
  '뉴턴과 하위헌스는 동일한 학설을 주장하였다.',
  '빛의 간섭은 입자설을 지지하는 결정적 증거였다.'
], 'A');

// p2 정독
addStep('p2', p2s[0], '첫 문장이 밝히는 20세기 초의 문제 상황으로 알맞은 것은?', [
  '파동설로는 설명할 수 없는 현상이 발견되었다.',
  '파동설이 모든 현상을 완벽하게 설명하였다.',
  '입자설이 다시 주류로 복귀하였다.',
  '빛에 대한 연구가 중단되었다.'
], 'A');
addStep('p2', p2s[1], '둘째 문장이 소개하는 현상으로 알맞은 것은?', [
  '금속 표면에 빛을 비추면 전자가 튀어나오는 광전 효과이다.',
  '빛이 물체를 통과할 때 굴절되는 굴절 현상이다.',
  '빛이 프리즘을 통과하면 무지개색으로 나뉘는 분산 현상이다.',
  '빛이 거울에 반사되는 반사 현상이다.'
], 'A');
addStep('p2', p2s[2], '셋째 문장이 말하는 광전 효과의 핵심 관찰 결과로 알맞은 것은?', [
  '빛의 세기와 무관하게 진동수가 특정 값 이상이어야 전자가 방출되었다.',
  '빛의 세기가 강할수록 전자가 더 큰 에너지로 튀어나왔다.',
  '어떤 빛이든 비추면 전자가 반드시 방출되었다.',
  '진동수가 낮은 빛일수록 전자가 더 많이 방출되었다.'
], 'A');
addStep('p2', p2s[3], '넷째 문장이 소개하는 아인슈타인의 가설로 알맞은 것은?', [
  '빛이 광자라는 에너지 덩어리로 이루어져 있다는 가설이다.',
  '빛이 순수한 파동으로만 이루어져 있다는 가설이다.',
  '빛이 전자기파와 무관하다는 가설이다.',
  '빛의 속도가 관측자에 따라 달라진다는 가설이다.'
], 'A');
addStep('p2', p2s[4], '다섯째 문장이 설명하는 광자 에너지의 특성으로 알맞은 것은?', [
  '광자의 에너지는 진동수에 비례하며, 진동수가 낮으면 전자를 방출시킬 수 없다.',
  '광자의 에너지는 빛의 세기에 비례한다.',
  '모든 광자는 동일한 에너지를 가진다.',
  '광자의 에너지는 빛의 색깔과 무관하다.'
], 'A');
addStep('p2', p2s[5], '여섯째 문장이 말하는 빛의 이중성의 의미로 알맞은 것은?', [
  '빛이 파동이면서 동시에 입자의 성질도 가진다는 개념이다.',
  '빛이 오직 파동으로만 존재한다는 확인이다.',
  '빛이 오직 입자로만 존재한다는 결론이다.',
  '빛의 성질이 관측자의 의지에 따라 바뀐다는 주장이다.'
], 'A');
addStep('p2', { start: 0, end: p2.length }, '둘째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '광전 효과를 설명하기 위해 아인슈타인이 광자 가설을 제시하며 빛의 이중성이 탄생하였다.',
  '광전 효과는 파동설로 완벽하게 설명되었다.',
  '아인슈타인은 빛이 순수한 파동임을 증명하였다.',
  '빛의 이중성은 뉴턴이 처음 제안한 개념이다.'
], 'A');

// p3 정독
addStep('p3', p3s[0], '첫 문장이 말하는 빛의 이중성의 확장으로 알맞은 것은?', [
  '물질 세계에도 확장되었다.',
  '소리의 영역으로 확장되었다.',
  '거시 세계의 모든 물체에 적용되었다.',
  '파동설이 완전히 부정되었다.'
], 'A');
addStep('p3', p3s[1], '둘째 문장이 소개하는 드브로이의 가설로 알맞은 것은?', [
  '물질 입자도 파동의 성질을 가진다는 물질파 가설이다.',
  '빛만이 파동의 성질을 가진다는 광파 가설이다.',
  '물질은 입자로만 존재한다는 순수 입자 가설이다.',
  '전자는 파동 성질이 없다는 가설이다.'
], 'A');
addStep('p3', p3s[2], '셋째 문장이 설명하는 물질파의 특성으로 알맞은 것은?', [
  '운동량이 작은 입자일수록 파장이 길어지며 극히 작은 입자에서 파동이 관측된다.',
  '운동량이 큰 물체일수록 파동 현상이 뚜렷하게 나타난다.',
  '모든 물체에서 동일한 파장의 파동이 관측된다.',
  '일상적 크기의 물체에서도 파동 성질이 쉽게 감지된다.'
], 'A');
addStep('p3', p3s[3], '넷째 문장이 말하는 전자 회절 실험의 의미로 알맞은 것은?', [
  '전자가 파동처럼 간섭과 회절을 일으킨다는 사실을 실험적으로 입증하였다.',
  '전자가 순수한 입자임을 최종 확인하였다.',
  '빛의 파동설이 틀렸음을 증명하였다.',
  '거시 물체도 회절 현상을 보인다는 것을 확인하였다.'
], 'A');
addStep('p3', p3s[4], '다섯째 문장이 강조하는 결과로 알맞은 것은?', [
  '입자와 파동의 경계가 무너지고 미시 세계를 설명하는 새로운 물리학의 기틀이 마련되었다.',
  '입자와 파동의 경계가 더욱 뚜렷해졌다.',
  '고전 물리학이 미시 세계까지 완벽하게 설명할 수 있게 되었다.',
  '파동 현상은 빛에서만 관찰될 수 있음이 확인되었다.'
], 'A');
addStep('p3', { start: 0, end: p3.length }, '셋째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '드브로이의 물질파 가설과 전자 회절 실험으로 입자와 파동의 경계가 무너졌다.',
  '물질파 가설은 실험적으로 부정되었다.',
  '전자 회절 실험은 전자가 입자임을 최종 확인한 것이다.',
  '빛의 이중성은 물질에는 적용되지 않는다.'
], 'A');

// p4 정독
addStep('p4', p4s[0], '첫 문장이 말하는 빛의 이중성과 물질파의 학문적 결과로 알맞은 것은?', [
  '양자역학이라는 새로운 학문의 토대가 되었다.',
  '고전 물리학이 완성되는 계기가 되었다.',
  '천문학의 새로운 분야가 탄생하였다.',
  '화학 반응의 원리가 밝혀지게 되었다.'
], 'A');
addStep('p4', p4s[1], '둘째 문장이 소개하는 양자역학의 핵심 원리로 알맞은 것은?', [
  '입자의 위치와 운동량을 동시에 정확하게 측정할 수 없다는 불확정성 원리이다.',
  '모든 입자의 위치와 속도를 정확하게 예측할 수 있다는 결정론적 원리이다.',
  '에너지가 연속적으로 변한다는 연속성 원리이다.',
  '미시 세계에서는 물리 법칙이 적용되지 않는다는 원리이다.'
], 'A');
addStep('p4', p4s[2], '셋째 문장이 설명하는 미시 세계 입자의 특성으로 알맞은 것은?', [
  '확률적으로 분포하며 관측 행위 자체가 상태에 영향을 미친다.',
  '확정된 궤도를 따라 정확하게 움직인다.',
  '관측과 무관하게 항상 동일한 상태를 유지한다.',
  '거시 물체와 동일한 물리 법칙을 따른다.'
], 'A');
addStep('p4', p4s[3], '넷째 문장이 말하는 양자역학의 세계관 변화로 알맞은 것은?', [
  '결정론적 세계관을 뒤흔들고 확률과 불확정성에 기반한 자연관을 제시하였다.',
  '결정론적 세계관을 더욱 강화하고 확인하였다.',
  '자연 현상이 모두 예측 가능함을 증명하였다.',
  '고전 물리학과 양자역학이 동일한 세계관을 공유함을 보였다.'
], 'A');
addStep('p4', p4s[4], '다섯째 문장이 예로 든 양자역학 기반 현대 기술로 알맞은 것은?', [
  '반도체, 레이저, 의료 영상 등이다.',
  '증기 기관, 방직기, 인쇄기 등이다.',
  '나침반, 망원경, 시계 등이다.',
  '종이, 화약, 활자 등이다.'
], 'A');
addStep('p4', { start: 0, end: p4.length }, '넷째 문단의 중심 내용으로 가장 알맞은 것은?', [
  '양자역학은 불확정성 원리에 기초하며 현대 기술의 토대가 된 혁명적 학문이다.',
  '양자역학은 고전 물리학의 일부로 별다른 새로움이 없다.',
  '불확정성 원리는 거시 세계에서만 적용된다.',
  '양자역학은 이론에 그칠 뿐 현대 기술과 무관하다.'
], 'A');

console.log(`정독 스텝 수: ${timeline.length}`);

// ── 복기 (recall) - 정확히 8카드 ──
const recall = {
  cards: [
    { id: 'c1', text: '뉴턴의 입자설과 하위헌스의 파동설이 경쟁하다 간섭 현상으로 파동설이 주류가 되었다.' },
    { id: 'c2', text: '광전 효과는 파동설로 설명할 수 없어 아인슈타인이 광자 가설을 제시하였다.' },
    { id: 'c3', text: '빛의 이중성은 빛이 파동이면서 동시에 입자의 성질을 가진다는 개념이다.' },
    { id: 'c4', text: '드브로이는 물질 입자도 파동의 성질을 가진다는 물질파 가설을 제안하였다.' },
    { id: 'c5', text: '전자 회절 실험은 전자가 파동처럼 간섭과 회절을 일으킴을 입증하였다.' },
    { id: 'c6', text: '양자역학의 핵심은 위치와 운동량을 동시에 정확히 측정할 수 없다는 불확정성 원리이다.' },
    { id: 'c7', text: '양자역학은 결정론적 세계관을 뒤흔들고 확률적 자연관을 제시하였다.' },
    { id: 'c8', text: '반도체, 레이저, 의료 영상 등 현대 기술이 양자역학에 기초하고 있다.' }
  ],
  correctOrder: ['c1','c2','c3','c4','c5','c6','c7','c8'],
  seedPenalty: 1
};

// ── 확인 (confirm) - 7문항 ──
const scoring_c = { correctDeltaSec: 30, wrongDeltaSec: -45 };
const confirm = { questions: [
  { id: 'q1', prompt: '금속 표면에 빛을 비추면 전자가 튀어나오는 현상을 무엇이라 하는가?',
    answerText: '광전 효과', answerMatchMode: 'ANY',
    answerRanges: [findRange('p2', '광전 효과')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q2', prompt: '아인슈타인이 빛을 구성한다고 제시한 에너지 덩어리를 무엇이라 하는가?',
    answerText: '광자', answerMatchMode: 'ANY',
    answerRanges: [...findAllRanges('p2', '광자')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q3', prompt: '빛이 파동이면서 동시에 입자의 성질도 가진다는 개념을 무엇이라 하는가?',
    answerText: '빛의 이중성', answerMatchMode: 'ANY',
    answerRanges: [...findAllRanges('p2', '빛의 이중성'), ...findAllRanges('p3', '빛의 이중성'), ...findAllRanges('p4', '빛의 이중성')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q4', prompt: '드브로이가 물질 입자도 파동의 성질을 가진다고 제안한 가설을 무엇이라 하는가?',
    answerText: '물질파 가설', answerMatchMode: 'ANY',
    answerRanges: [findRange('p3', '물질파 가설')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q5', prompt: '양자역학에서 입자의 위치와 운동량을 동시에 정확히 측정할 수 없다는 원리를 무엇이라 하는가?',
    answerText: '불확정성 원리', answerMatchMode: 'ANY',
    answerRanges: [findRange('p4', '불확정성 원리')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q6', prompt: '두 파동이 만나 서로 강해지거나 약해지는 현상을 무엇이라 하는가?',
    answerText: '간섭', answerMatchMode: 'ANY',
    answerRanges: [...findAllRanges('p1', '간섭'), ...findAllRanges('p3', '간섭')],
    scoring: scoring_c, revealOnWrong: true },
  { id: 'q7', prompt: '양자역학이 뒤흔든 고전 물리학의 세계관을 무엇이라 하는가?',
    answerText: '결정론적 세계관', answerMatchMode: 'ANY',
    answerRanges: [findRange('p4', '결정론적 세계관')],
    scoring: scoring_c, revealOnWrong: true }
]};

console.log(`복기 카드 수: ${recall.cards.length}`);
console.log(`확인 문항 수: ${confirm.questions.length}`);

// ── content 객체 조립 ──
const content = {
  contentId: 'dr-r3-017',
  contentType: 'DAILY_READING',
  version: 1,
  status: 'PUBLISHED',
  title: '일일 독해(러셀 3) Day 17 비문학',
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
  day_index: 17,
  module_key: 'reading_training',
  schema_version: '1.0',
  content
};

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell3');
fs.writeFileSync(path.join(staticDir, '017.json'), JSON.stringify(content, null, 2), 'utf8');
console.log('static 017.json 저장 완료');

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell3.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[16] = batchItem;
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log('배치 파일 day_index 17 업데이트 완료');
