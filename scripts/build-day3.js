// Day 3 비문학 - 공리주의와 의무론 JSON 생성 스크립트
const fs = require('fs');

const p1 = '우리는 일상에서 무엇이 옳고 무엇이 그른지를 판단해야 하는 상황에 자주 놓인다. 이때 도덕적 판단의 기준을 어디에 두느냐에 따라 윤리학의 입장이 나뉘는데, 대표적인 것이 공리주의와 의무론이다. 공리주의는 어떤 행위가 가져오는 결과에 주목하여, 최대 다수의 최대 행복을 실현하는 행위를 도덕적으로 옳다고 본다. 반면 의무론은 행위의 결과가 아니라 행위 자체의 성격에 주목하여, 보편적인 도덕 법칙에 부합하는 행위를 옳다고 판단한다. 이처럼 두 이론은 같은 상황에서 서로 다른 결론을 내릴 수 있기 때문에, 오랫동안 철학적 논쟁의 중심에 서 왔다.';

const p2 = '공리주의를 체계적으로 정립한 대표적인 사상가는 벤담과 밀이다. 벤담은 쾌락과 고통이라는 두 가지 감정이 인간 행위의 근본 원리라고 보았다. 그는 쾌락의 강도, 지속 시간, 확실성 등을 수치로 계산할 수 있다고 주장하며, 행위의 도덕성을 쾌락의 총량으로 평가하는 양적 공리주의를 제시하였다. 이에 비해 밀은 쾌락에도 질적 차이가 있다고 보았다. 밀은 육체적 쾌락보다 지적이고 정신적인 쾌락이 더 높은 가치를 지닌다고 주장하면서, 단순히 양만으로 쾌락을 비교하는 것은 인간의 존엄성을 간과하는 것이라고 비판하였다. 밀의 이러한 관점은 질적 공리주의라 불리며, 인간다운 삶의 가치를 강조했다는 점에서 큰 의미가 있다.';

const p3 = '의무론의 대표적인 사상가인 칸트는 행위의 결과와 무관하게, 오직 도덕 법칙을 따르려는 선의지에서 비롯된 행위만이 진정한 도덕적 가치를 지닌다고 주장하였다. 칸트는 이를 정언 명령이라는 개념으로 설명하였는데, 정언 명령이란 어떠한 조건이나 목적 없이 그 자체로 따라야 하는 무조건적인 도덕 명령을 뜻한다. 예를 들어, 거짓말을 하지 말라는 명령은 거짓말이 나쁜 결과를 가져오기 때문이 아니라, 거짓말 자체가 보편적 법칙이 될 수 없기 때문에 지켜야 한다는 것이다. 또한 칸트는 인간을 언제나 수단이 아닌 목적으로 대우해야 한다고 역설하면서, 인간의 존엄성을 도덕의 가장 핵심적인 원리로 삼았다.';

const p4 = '공리주의와 의무론은 각각 장점과 한계를 지닌다. 공리주의는 도덕적 판단에 구체적이고 실용적인 기준을 제공한다는 장점이 있으나, 소수의 권리를 다수의 행복을 위해 희생시킬 수 있다는 비판을 받는다. 예컨대, 한 사람의 희생으로 다섯 사람을 구할 수 있는 상황에서 공리주의는 그 희생을 정당화할 수 있지만, 이는 개인의 권리를 심각하게 침해하는 것이라는 반론이 제기된다. 반면 의무론은 개인의 권리와 존엄성을 확고하게 보호한다는 강점이 있으나, 현실의 복잡한 상황에서 구체적인 행동 지침을 제시하기 어렵다는 한계가 있다. 이처럼 두 이론은 서로의 약점을 보완하는 관계에 있으므로, 도덕적 문제를 해결하기 위해서는 어느 한쪽에 치우치지 않고 양쪽의 관점을 균형 있게 고려하는 태도가 필요하다.';

console.log('p1:', p1.length, 'p2:', p2.length, 'p3:', p3.length, 'p4:', p4.length);
console.log('총:', p1.length + p2.length + p3.length + p4.length);

// 문장 경계 함수
function findSentences(text, pId) {
  const results = [];
  // 마침표(.) 뒤 공백 또는 끝으로 분할
  const re = /[^.]+\./g;
  let m;
  while ((m = re.exec(text)) !== null) {
    let start = m.index;
    let s = m[0];
    // 앞쪽 공백 제거
    const trimmed = s.replace(/^ /, '');
    if (trimmed !== s) start += 1;
    results.push({ pId, start, end: m.index + s.length, text: trimmed });
  }
  return results;
}

const s1 = findSentences(p1, 'p1');
const s2 = findSentences(p2, 'p2');
const s3 = findSentences(p3, 'p3');
const s4 = findSentences(p4, 'p4');

console.log('\n--- p1 sentences ---');
s1.forEach((s, i) => console.log(`  ${i}: [${s.start}, ${s.end}] "${s.text.substring(0, 30)}..."`));
console.log('\n--- p2 sentences ---');
s2.forEach((s, i) => console.log(`  ${i}: [${s.start}, ${s.end}] "${s.text.substring(0, 30)}..."`));
console.log('\n--- p3 sentences ---');
s3.forEach((s, i) => console.log(`  ${i}: [${s.start}, ${s.end}] "${s.text.substring(0, 30)}..."`));
console.log('\n--- p4 sentences ---');
s4.forEach((s, i) => console.log(`  ${i}: [${s.start}, ${s.end}] "${s.text.substring(0, 30)}..."`));

// 검증: 단어 위치 찾기
function findTerm(text, term) {
  const idx = text.indexOf(term);
  return { start: idx, end: idx + term.length };
}

console.log('\n--- answer term positions ---');
console.log('p1 공리주의와 의무론:', findTerm(p1, '공리주의와 의무론'));
console.log('p1 최대 다수의 최대 행복:', findTerm(p1, '최대 다수의 최대 행복'));
console.log('p2 양적 공리주의:', findTerm(p2, '양적 공리주의'));
console.log('p2 질적 공리주의:', findTerm(p2, '질적 공리주의'));
console.log('p3 정언 명령:', findTerm(p3, '정언 명령'));
console.log('p3 선의지:', findTerm(p3, '선의지'));
console.log('p4 소수의 권리:', findTerm(p4, '소수의 권리'));
console.log('p4 균형 있게 고려:', findTerm(p4, '균형 있게 고려'));
console.log('p2 벤담과 밀:', findTerm(p2, '벤담과 밀'));
console.log('p3 수단이 아닌 목적:', findTerm(p3, '수단이 아닌 목적'));
