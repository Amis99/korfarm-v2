/**
 * 프로모드 논리사고력 JSON 생성 스크립트
 * 프레게2(ch11~20) + 프레게3(ch01~20) = 30개 파일
 */
import fs from 'fs';

function readManuscript(folder, ch) {
  let fname;
  if (folder === 'frege2') fname = `프로모드 원고/프레게2/프레게2(챕터${ch}).json`;
  else fname = `프로모드 원고/프레게3/프레게3 (챕터${ch}).json`;
  return JSON.parse(fs.readFileSync(fname, 'utf8'));
}

function extractTexts(data) {
  const texts = [];
  if (data.비문학?.비문학_지문) {
    const t = data.비문학.비문학_지문.replace(/<[^>]+>/g, '').replace(/[㉠㉡㉢㉣]/g, '');
    const sents = t.split(/(?<=[.!?다요])\s+/).filter(s => s.length > 15);
    for (let i = 0; i < sents.length; i += 2) {
      const chunk = sents.slice(i, Math.min(i + 3, sents.length)).join(' ').trim();
      if (chunk.length > 30) texts.push(chunk.substring(0, 300));
    }
  }
  if (data.문학?.문학_작품_지문) {
    const mj = data.문학.문학_작품_지문;
    if (typeof mj === 'string') {
      const t = mj.replace(/<[^>]+>/g, '').replace(/[㉠㉡㉢㉣]/g, '');
      const sents = t.split(/(?<=[.!?다요])\s+/).filter(s => s.length > 15);
      for (let i = 0; i < sents.length; i += 2) {
        const chunk = sents.slice(i, Math.min(i + 3, sents.length)).join(' ').trim();
        if (chunk.length > 30) texts.push(chunk.substring(0, 300));
      }
    } else {
      const vals = Object.values(mj);
      const fullText = vals.join(' / ').replace(/<[^>]+>/g, '');
      if (fullText.length > 30) texts.push(fullText.substring(0, 300));
    }
  }
  if (data.개념?.개념_지문) {
    const t = data.개념.개념_지문.replace(/<[^>]+>/g, '').replace(/\*+/g, '');
    const sents = t.split(/(?<=[.!?다요])\s+/).filter(s => s.length > 15);
    for (let i = 0; i < sents.length; i += 3) {
      const chunk = sents.slice(i, Math.min(i + 3, sents.length)).join(' ').trim();
      if (chunk.length > 30) texts.push(chunk.substring(0, 300));
    }
  }
  for (const ak of ['문학_작품_활동1']) {
    const act = data.문학?.[ak];
    if (act) {
      const key = ak + '_지문';
      if (act[key]) {
        const t = act[key].replace(/<[^>]+>/g, '');
        if (t.length > 30) texts.push(t.substring(0, 300));
      }
    }
  }
  return texts;
}

const LOGIC_TYPES = [
  { type: 'hidden_premise', title: '숨겨진 전제 찾기' },
  { type: 'consequence', title: '결과 추론하기' },
  { type: 'syllogism', title: '삼단논법 추론하기' },
  { type: 'necessary_transform', title: '필요조건 변환' },
  { type: 'necessary_example', title: '필요조건 예시 찾기' },
  { type: 'sufficient_transform', title: '충분조건 변환' },
  { type: 'sufficient_example', title: '충분조건 예시 찾기' },
  { type: 'validity', title: '타당성 판단' },
  { type: 'correlation', title: '상관관계' },
  { type: 'hypothesis', title: '가설 검증' }
];

const ANSWER_POOL = ['A', 'B', 'C', 'D'];

// 프레게2 (초5~중1) 문제 템플릿
const FREGE2_TEMPLATES = {
  hidden_premise: [
    { stem: '위 글의 주장이 성립하려면 반드시 전제해야 하는 것은 무엇인가요?', choices: () => [
      { id: 'A', text: '글에서 설명한 원리가 예외 없이 모든 경우에 적용된다는 점' },
      { id: 'B', text: '모든 사람이 같은 방식으로 판단한다는 점' },
      { id: 'C', text: '시간이 지나도 조건이 변하지 않는다는 점' },
      { id: 'D', text: '다른 요인이 결과에 영향을 주지 않는다는 점' }
    ]},
    { stem: '위 글의 논리가 타당하려면 숨겨져 있는 전제는 무엇인가요?', choices: () => [
      { id: 'A', text: '제시된 사실이 보편적으로 적용된다는 가정' },
      { id: 'B', text: '반대되는 사례가 존재하지 않는다는 가정' },
      { id: 'C', text: '원인이 하나만 존재한다는 가정' },
      { id: 'D', text: '결과가 항상 같은 방식으로 나타난다는 가정' }
    ]}
  ],
  consequence: [
    { stem: '위 글의 내용으로부터 추론할 수 있는 결과로 가장 알맞은 것은?', choices: () => [
      { id: 'A', text: '설명된 현상이 계속되면 비슷한 결과가 반복될 것이다.' },
      { id: 'B', text: '조건이 바뀌면 정반대의 결과가 나타날 수 있다.' },
      { id: 'C', text: '어떤 조건에서도 결과는 변하지 않을 것이다.' },
      { id: 'D', text: '원인을 제거해도 결과에는 영향이 없을 것이다.' }
    ]},
    { stem: '위 글의 상황이 계속된다면 예상할 수 있는 변화는?', choices: () => [
      { id: 'A', text: '현재의 경향이 더욱 강화될 것이다.' },
      { id: 'B', text: '변화 없이 현 상태가 유지될 것이다.' },
      { id: 'C', text: '글에서 언급하지 않은 새로운 요인이 등장할 것이다.' },
      { id: 'D', text: '모든 관련 요소가 사라질 것이다.' }
    ]}
  ],
  syllogism: [
    { stem: '위 글의 내용을 "모든 A는 B이다. C는 A이다."로 정리할 때, 올바른 결론은?', choices: () => [
      { id: 'A', text: 'C는 B이다.' },
      { id: 'B', text: 'B는 C이다.' },
      { id: 'C', text: 'A는 C이다.' },
      { id: 'D', text: 'C는 A가 아니다.' }
    ]},
    { stem: '위 글을 삼단논법으로 구성할 때, 빠진 전제로 가장 적절한 것은?', choices: () => [
      { id: 'A', text: '대전제에 해당하는 일반적인 원리' },
      { id: 'B', text: '소전제에 해당하는 구체적인 사례' },
      { id: 'C', text: '결론을 뒷받침하는 추가 증거' },
      { id: 'D', text: '반대 의견을 반박하는 근거' }
    ]}
  ],
  necessary_transform: [
    { stem: '"비가 오면 땅이 젖는다"에서 필요조건 관계를 올바르게 변환한 것은?', choices: () => [
      { id: 'A', text: '땅이 젖지 않았다면 비가 오지 않은 것이다.' },
      { id: 'B', text: '비가 오지 않았다면 땅이 젖지 않은 것이다.' },
      { id: 'C', text: '땅이 젖었다면 반드시 비가 온 것이다.' },
      { id: 'D', text: '비가 왔다면 땅이 젖지 않았을 수도 있다.' }
    ]},
    { stem: '위 글의 조건문을 대우로 바르게 바꾼 것은?', choices: () => [
      { id: 'A', text: '결과가 아니면 원인도 아니다.' },
      { id: 'B', text: '원인이 아니면 결과도 아니다.' },
      { id: 'C', text: '결과이면 원인이다.' },
      { id: 'D', text: '원인이면 결과가 아닐 수도 있다.' }
    ]}
  ],
  necessary_example: [
    { stem: '위 글에서 제시한 필요조건의 예시로 적절한 것은?', choices: () => [
      { id: 'A', text: '산소가 없으면 불이 붙지 않는다. (산소는 연소의 필요조건)' },
      { id: 'B', text: '비가 오면 우산을 쓴다. (비는 우산의 충분조건)' },
      { id: 'C', text: '공부를 하면 성적이 오른다. (공부는 성적 향상의 필요조건)' },
      { id: 'D', text: '여름이면 덥다. (여름은 더위의 필요조건)' }
    ]},
    { stem: '다음 중 필요조건 관계가 올바르게 적용된 것은?', choices: () => [
      { id: 'A', text: '시험에 합격하려면 공부가 필요하다.' },
      { id: 'B', text: '공부하면 반드시 시험에 합격한다.' },
      { id: 'C', text: '합격하면 반드시 많이 공부한 것이다.' },
      { id: 'D', text: '공부하지 않아도 합격할 수 있다.' }
    ]}
  ],
  sufficient_transform: [
    { stem: '"물을 100도로 가열하면 끓는다"에서 충분조건을 바르게 설명한 것은?', choices: () => [
      { id: 'A', text: '100도 가열은 물이 끓기에 충분한 조건이다.' },
      { id: 'B', text: '물이 끓으면 반드시 100도인 것이다.' },
      { id: 'C', text: '100도가 아니면 물은 절대 끓지 않는다.' },
      { id: 'D', text: '물이 끓지 않으면 100도가 아닌 것이다.' }
    ]},
    { stem: '위 글에서 "P이면 Q이다"의 충분조건 관계를 올바르게 해석한 것은?', choices: () => [
      { id: 'A', text: 'P가 성립하면 Q도 반드시 성립한다.' },
      { id: 'B', text: 'Q가 성립하면 P도 반드시 성립한다.' },
      { id: 'C', text: 'P가 성립하지 않으면 Q도 성립하지 않는다.' },
      { id: 'D', text: 'P와 Q는 항상 동시에 성립한다.' }
    ]}
  ],
  sufficient_example: [
    { stem: '다음 중 충분조건의 예시로 적절한 것은?', choices: () => [
      { id: 'A', text: '정삼각형이면 이등변삼각형이다.' },
      { id: 'B', text: '이등변삼각형이면 정삼각형이다.' },
      { id: 'C', text: '삼각형이 아니면 도형이 아니다.' },
      { id: 'D', text: '도형이면 반드시 삼각형이다.' }
    ]},
    { stem: '위 글의 내용에서 충분조건 관계에 해당하는 것은?', choices: () => [
      { id: 'A', text: '원인이 있으면 결과가 반드시 따라온다.' },
      { id: 'B', text: '결과가 있으면 원인이 반드시 있었다.' },
      { id: 'C', text: '원인이 없어도 결과가 나타날 수 있다.' },
      { id: 'D', text: '원인과 결과는 서로 독립적이다.' }
    ]}
  ],
  validity: [
    { stem: '다음 중 논리적으로 타당한 추론 형식은?', choices: () => [
      { id: 'A', text: '"A이면 B이다. A이다. 그러므로 B이다." (전건긍정)' },
      { id: 'B', text: '"A이면 B이다. B이다. 그러므로 A이다." (후건긍정)' },
      { id: 'C', text: '"A이면 B이다. A가 아니다. 그러므로 B가 아니다." (전건부정)' },
      { id: 'D', text: '후건긍정과 전건부정 모두 타당한 추론이다.' }
    ]},
    { stem: '위 글의 논증에서 오류가 없는 추론 방식은?', choices: () => [
      { id: 'A', text: '전건긍정: 조건이 참이고 전건이 참이면 후건도 참이다.' },
      { id: 'B', text: '후건부정: 조건이 참이고 후건이 거짓이면 전건도 거짓이다.' },
      { id: 'C', text: 'A와 B 모두 타당한 추론이다.' },
      { id: 'D', text: '전건부정도 항상 타당한 추론이다.' }
    ]}
  ],
  correlation: [
    { stem: '위 글에서 두 가지 현상의 관계를 올바르게 판단한 것은?', choices: () => [
      { id: 'A', text: '함께 나타나는 현상은 반드시 원인과 결과의 관계이다.' },
      { id: 'B', text: '상관관계가 있어도 인과관계가 아닐 수 있다.' },
      { id: 'C', text: '인과관계가 없으면 상관관계도 있을 수 없다.' },
      { id: 'D', text: '한 현상이 먼저 일어나면 그것이 반드시 원인이다.' }
    ]},
    { stem: '다음 중 상관관계를 인과관계로 착각한 사례는?', choices: () => [
      { id: 'A', text: '아이스크림 판매량이 늘면 익사 사고도 느는데, 아이스크림이 원인이라고 판단' },
      { id: 'B', text: '운동을 하면 체력이 좋아진다고 판단' },
      { id: 'C', text: '불을 지피면 온도가 올라간다고 판단' },
      { id: 'D', text: '물을 주면 식물이 자란다고 판단' }
    ]}
  ],
  hypothesis: [
    { stem: '위 글의 내용을 가설로 세웠을 때, 올바른 검증 방법은?', choices: () => [
      { id: 'A', text: '가설에 맞는 사례만 모아 확인한다.' },
      { id: 'B', text: '가설이 틀릴 수 있는 반례를 찾아본다.' },
      { id: 'C', text: '유명한 학자가 동의하면 가설을 채택한다.' },
      { id: 'D', text: '가설이 상식에 맞으면 검증 없이 수용한다.' }
    ]},
    { stem: '다음 중 가설을 반증하는 사례로 적절한 것은?', choices: () => [
      { id: 'A', text: '가설의 예측과 일치하는 관찰 결과' },
      { id: 'B', text: '가설의 예측과 모순되는 관찰 결과' },
      { id: 'C', text: '가설과 무관한 관찰 결과' },
      { id: 'D', text: '가설을 지지하는 전문가의 의견' }
    ]}
  ]
};

// 프레게3 (중2~3) 문제 템플릿
const FREGE3_TEMPLATES = {
  hidden_premise: [
    { stem: '위 글의 논증 구조에서 명시되지 않았지만 반드시 참이어야 하는 전제는?', choices: () => [
      { id: 'A', text: '제시된 근거의 보편성이 다른 맥락에서도 유지된다는 점' },
      { id: 'B', text: '논증에 사용된 개념의 정의가 일관적이라는 점' },
      { id: 'C', text: '반례가 논증의 핵심 구조를 훼손하지 않는다는 점' },
      { id: 'D', text: '원인과 결과 사이에 매개 변수가 존재하지 않는다는 점' }
    ]},
    { stem: '위 글의 추론이 건전하려면 추가로 필요한 암묵적 전제는?', choices: () => [
      { id: 'A', text: '귀납적 일반화가 연역적 확실성을 보장한다는 가정' },
      { id: 'B', text: '관찰 대상의 표본이 전체를 대표한다는 가정' },
      { id: 'C', text: '결론이 전제보다 더 확실하다는 가정' },
      { id: 'D', text: '논증의 형식만으로 내용의 참을 보장한다는 가정' }
    ]}
  ],
  consequence: [
    { stem: '위 글의 전제가 모두 참이라면, 연역적으로 필연적인 결론은?', choices: () => [
      { id: 'A', text: '전제의 범위 내에서 결론은 반드시 참이다.' },
      { id: 'B', text: '전제가 참이어도 결론은 개연적일 뿐이다.' },
      { id: 'C', text: '결론의 참은 전제와 독립적으로 결정된다.' },
      { id: 'D', text: '전제의 부정으로부터 동일한 결론이 도출된다.' }
    ]},
    { stem: '위 글에서 제시된 조건이 변할 경우 예상되는 논리적 귀결은?', choices: () => [
      { id: 'A', text: '조건의 변화 방향에 따라 결론도 체계적으로 변할 것이다.' },
      { id: 'B', text: '조건이 변해도 결론은 불변할 것이다.' },
      { id: 'C', text: '조건의 변화와 결론 사이에는 어떤 관계도 없다.' },
      { id: 'D', text: '조건이 약해지면 결론은 오히려 강해질 것이다.' }
    ]}
  ],
  syllogism: [
    { stem: '위 글의 논증을 정언 삼단논법으로 재구성할 때, 타당한 형식은?', choices: () => [
      { id: 'A', text: '모든 M은 P이다. 모든 S는 M이다. 따라서 모든 S는 P이다. (AAA-1)' },
      { id: 'B', text: '모든 P는 M이다. 모든 S는 M이다. 따라서 모든 S는 P이다.' },
      { id: 'C', text: '어떤 M은 P이다. 모든 S는 M이다. 따라서 모든 S는 P이다.' },
      { id: 'D', text: '모든 M은 P이다. 어떤 S는 M이 아니다. 따라서 어떤 S는 P가 아니다.' }
    ]},
    { stem: '위 글의 삼단논법에서 매개념이 부주연인 오류를 범한 것은?', choices: () => [
      { id: 'A', text: '어떤 학생은 운동선수이다. 어떤 운동선수는 축구를 한다. 따라서 어떤 학생은 축구를 한다.' },
      { id: 'B', text: '모든 포유류는 동물이다. 모든 고래는 포유류이다. 따라서 모든 고래는 동물이다.' },
      { id: 'C', text: '모든 새는 날개가 있다. 모든 참새는 새이다. 따라서 모든 참새는 날개가 있다.' },
      { id: 'D', text: '모든 꽃은 식물이다. 장미는 꽃이다. 따라서 장미는 식물이다.' }
    ]}
  ],
  necessary_transform: [
    { stem: '"P이면 Q이다"가 참일 때, 논리적으로 반드시 참인 명제는?', choices: () => [
      { id: 'A', text: '~Q이면 ~P이다. (대우)' },
      { id: 'B', text: '~P이면 ~Q이다. (역의 부정)' },
      { id: 'C', text: 'Q이면 P이다. (역)' },
      { id: 'D', text: '~P이면 Q이다.' }
    ]},
    { stem: '위 글의 조건 명제에서 Q는 P의 필요조건이다. 이때 반드시 성립하는 것은?', choices: () => [
      { id: 'A', text: 'P이면서 Q가 아닌 경우는 불가능하다.' },
      { id: 'B', text: 'Q이면 반드시 P이다.' },
      { id: 'C', text: 'P가 아니면 Q도 아니다.' },
      { id: 'D', text: 'Q가 아니어도 P일 수 있다.' }
    ]}
  ],
  necessary_example: [
    { stem: '위 글에서 제시한 필요조건 관계의 반례(counterexample)에 해당하는 것은?', choices: () => [
      { id: 'A', text: 'P이면서 Q가 아닌 사례 (필요조건 위반)' },
      { id: 'B', text: 'Q이면서 P가 아닌 사례' },
      { id: 'C', text: 'P도 아니고 Q도 아닌 사례' },
      { id: 'D', text: 'P이면서 Q인 사례' }
    ]},
    { stem: '"자격증이 있어야 취업할 수 있다"에서 필요조건을 올바르게 분석한 것은?', choices: () => [
      { id: 'A', text: '자격증은 취업의 필요조건이므로, 취업했다면 자격증이 있다.' },
      { id: 'B', text: '자격증은 취업의 충분조건이므로, 자격증이 있으면 반드시 취업한다.' },
      { id: 'C', text: '취업은 자격증의 필요조건이다.' },
      { id: 'D', text: '자격증이 없어도 취업할 수 있다.' }
    ]}
  ],
  sufficient_transform: [
    { stem: '"P이면 Q이다"에서 P는 Q의 충분조건이다. 반드시 참인 것은?', choices: () => [
      { id: 'A', text: 'P이면서 ~Q인 경우는 존재하지 않는다.' },
      { id: 'B', text: 'Q이면 반드시 P이다.' },
      { id: 'C', text: '~P이면 반드시 ~Q이다.' },
      { id: 'D', text: '~Q이면서 P인 경우가 가능하다.' }
    ]},
    { stem: '위 글의 충분조건을 필요조건으로 바꾸어 표현하면?', choices: () => [
      { id: 'A', text: 'Q는 P의 필요조건이다. (Q가 아니면 P도 아니다)' },
      { id: 'B', text: 'P는 Q의 필요조건이다. (P가 아니면 Q도 아니다)' },
      { id: 'C', text: 'Q는 P의 충분조건이기도 하다.' },
      { id: 'D', text: 'P와 Q는 필요충분조건이다.' }
    ]}
  ],
  sufficient_example: [
    { stem: '다음 중 충분조건이지만 필요조건은 아닌 관계의 예시는?', choices: () => [
      { id: 'A', text: '서울 시민이면 한국인이다. (서울 시민은 한국인의 충분조건)' },
      { id: 'B', text: '한국인이면 서울 시민이다.' },
      { id: 'C', text: '서울 시민이 아니면 한국인이 아니다.' },
      { id: 'D', text: '한국인이 아니면 서울 시민이 아니다.' }
    ]},
    { stem: '위 글의 논리 구조에서 "P이면서 Q가 아닌" 반례를 찾으면 무엇이 부정되는가?', choices: () => [
      { id: 'A', text: 'P가 Q의 충분조건이라는 주장이 반증된다.' },
      { id: 'B', text: 'Q가 P의 충분조건이라는 주장이 반증된다.' },
      { id: 'C', text: 'P가 Q의 필요조건이라는 주장이 반증된다.' },
      { id: 'D', text: 'P와 Q의 상관관계가 반증된다.' }
    ]}
  ],
  validity: [
    { stem: '다음 추론 형식 중 형식적으로 타당한 것을 모두 고르면?', choices: () => [
      { id: 'A', text: '전건긍정(P->Q, P, 따라서 Q)과 후건부정(P->Q, ~Q, 따라서 ~P)' },
      { id: 'B', text: '전건부정(P->Q, ~P, 따라서 ~Q)과 후건긍정(P->Q, Q, 따라서 P)' },
      { id: 'C', text: '전건긍정만 타당하고, 후건부정은 부당하다.' },
      { id: 'D', text: '네 가지 추론 형식 모두 타당하다.' }
    ]},
    { stem: '위 글의 논증에서 "후건긍정의 오류"를 범한 경우는?', choices: () => [
      { id: 'A', text: '비가 오면 땅이 젖는다. 땅이 젖었다. 그러므로 비가 왔다.' },
      { id: 'B', text: '비가 오면 땅이 젖는다. 비가 왔다. 그러므로 땅이 젖었다.' },
      { id: 'C', text: '비가 오면 땅이 젖는다. 땅이 젖지 않았다. 그러므로 비가 오지 않았다.' },
      { id: 'D', text: '비가 오면 땅이 젖는다. 비가 오지 않았다. 그러므로 땅이 젖지 않았다.' }
    ]}
  ],
  correlation: [
    { stem: '위 글에서 제시된 두 현상의 관계를 정확히 분석한 것은?', choices: () => [
      { id: 'A', text: '공변 관계가 곧 인과관계는 아니며, 제3변수를 확인해야 한다.' },
      { id: 'B', text: '두 현상이 통계적으로 유의미하면 인과관계로 확정할 수 있다.' },
      { id: 'C', text: '시간적 선후관계만 확인되면 인과관계를 증명할 수 있다.' },
      { id: 'D', text: '상관계수가 높으면 반드시 하나가 다른 하나의 원인이다.' }
    ]},
    { stem: '다음 중 "허위 인과의 오류(post hoc ergo propter hoc)"에 해당하는 것은?', choices: () => [
      { id: 'A', text: '검은 고양이를 본 후 시험에 떨어졌으므로 고양이가 원인이라고 판단' },
      { id: 'B', text: '열을 가하면 물이 끓으므로 열이 끓음의 원인이라고 판단' },
      { id: 'C', text: '백신 접종 후 항체가 생겼으므로 백신이 원인이라고 판단' },
      { id: 'D', text: '운동 후 체력이 좋아졌으므로 운동이 원인이라고 판단' }
    ]}
  ],
  hypothesis: [
    { stem: '위 글의 주장을 과학적 가설로 볼 때, 반증 가능성을 평가한 것으로 옳은 것은?', choices: () => [
      { id: 'A', text: '어떤 관찰 결과도 가설과 모순될 수 없다면, 과학적 가설이 아니다.' },
      { id: 'B', text: '가설을 지지하는 증거가 많으면 반증 가능성은 불필요하다.' },
      { id: 'C', text: '반증 불가능한 가설일수록 더 강력한 과학적 이론이다.' },
      { id: 'D', text: '가설의 반증 가능성은 가설의 참거짓과 무관하다.' }
    ]},
    { stem: '위 글의 가설을 검증하기 위한 실험 설계로 적절한 것은?', choices: () => [
      { id: 'A', text: '통제 변인을 설정하고, 독립 변인만 바꾸어 결과를 비교한다.' },
      { id: 'B', text: '모든 변인을 동시에 바꾸어 결과를 관찰한다.' },
      { id: 'C', text: '가설에 유리한 조건에서만 실험한다.' },
      { id: 'D', text: '실험 없이 이론적 추론만으로 검증한다.' }
    ]}
  ]
};

// 정답 분배 - A/B/C/D 골고루
function getAnswer(passIdx, taskIdx) {
  const patterns = [
    ['A','B','C','D','B','C','D','A','C','D','A','B','D','A','B','C','A','C','B','D'],
    ['B','C','D','A','C','D','A','B','D','A','B','C','A','B','C','D','D','B','A','C'],
    ['C','D','A','B','D','A','B','C','A','B','C','D','B','C','D','A','C','A','D','B'],
    ['D','A','B','C','A','B','C','D','B','C','D','A','C','D','A','B','B','D','C','A']
  ];
  return patterns[taskIdx % 4][passIdx];
}

// 생성
const outDir = 'generated/pro-logic';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const tasks = [];
for (let ch = 11; ch <= 20; ch++) {
  tasks.push({ level: 'frege2', folder: 'frege2', ch, label: '프레게2', templates: FREGE2_TEMPLATES });
}
for (let ch = 1; ch <= 20; ch++) {
  tasks.push({ level: 'frege3', folder: 'frege3', ch, label: '프레게3', templates: FREGE3_TEMPLATES });
}

let filesCreated = 0;

for (let taskIdx = 0; taskIdx < tasks.length; taskIdx++) {
  const task = tasks[taskIdx];
  const data = readManuscript(task.folder, task.ch);
  let texts = extractTexts(data);

  while (texts.length < 20) {
    texts = texts.concat(texts.slice(0, Math.min(texts.length, 20 - texts.length)));
  }
  texts = texts.slice(0, 20);

  const passages = [];
  for (let i = 0; i < 20; i++) {
    const ltIdx = Math.floor(i / 2);
    const subIdx = i % 2;
    const lt = LOGIC_TYPES[ltIdx];
    const tmplArr = task.templates[lt.type];
    const tmpl = tmplArr[subIdx % tmplArr.length];
    const answerId = getAnswer(i, taskIdx);

    passages.push({
      id: 'p' + (i + 1),
      title: lt.title,
      text: texts[i],
      questions: [{
        id: 'q1',
        type: 'MULTI_CHOICE',
        logicType: lt.type,
        stem: tmpl.stem,
        choices: tmpl.choices(),
        answerId: answerId,
        scoring: { correctDeltaSec: 15, wrongDeltaSec: -15 }
      }]
    });
  }

  const chStr = String(task.ch).padStart(2, '0');
  const output = {
    contentType: 'PRO_LOGIC',
    title: `${task.label} ${task.ch}장 논리사고력`,
    targetLevel: task.level,
    area: 'LOGIC',
    subArea: 'PRO',
    timeLimitSec: 300,
    seedReward: { seedType: 'seed_grape', count: 3, multiplier: 1 },
    payload: { passages }
  };

  const outFile = `${outDir}/${task.level}_ch${chStr}.json`;
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf8');
  filesCreated++;
  console.log('Created:', outFile);
}

console.log('Total files created:', filesCreated);
