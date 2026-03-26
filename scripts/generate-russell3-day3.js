// 러셀3 Day 3 - 비문학 (인문/철학: 도덕적 판단과 행동의 관계)
// 중3 수준으로 재구성, 1300자 ±50

const fs = require('fs');

// ────────────── 지문 (4문단) ──────────────
const p1 = "우리는 일상에서 무엇이 옳고 그른지를 판단하는 경험을 자주 한다. 시험 중에 친구의 답을 보면 안 된다는 것을 알면서도 유혹을 느끼거나, 길에서 주운 지갑을 돌려주어야 한다고 생각하면서도 망설이는 경우가 그 예이다. 도덕 심리학에서는 이처럼 도덕적으로 옳은 것을 아는 것과 실제로 그것을 행동으로 옮기는 것 사이의 간극을 중요한 문제로 다루어 왔다. 콜버그는 인지 발달 이론을 통해, 사람은 옳고 그름에 대한 인지 능력이 발달하면 자연스럽게 도덕적 행동을 하게 된다고 보았다. 그러나 현실에서는 옳은 행동이 무엇인지 알면서도 실천하지 못하는 사람이 적지 않으므로, 이 이론만으로는 도덕적 행동을 충분히 설명하기 어렵다는 비판이 제기되었다.";

const p2 = "이러한 한계를 극복하고자 블라지는 도덕적 이해가 행동으로 이어지려면 자아와의 통합이 필요하다는 '도덕적 자아 모델'을 제안하였다. 이 모델의 핵심은 도덕적 이해가 단순한 지식에 머무르지 않고 자신의 정체성 일부가 되어야 한다는 것이다. 블라지에 따르면 자아는 고정된 것이 아니라, 개인이 어떤 가치를 중심에 놓느냐에 따라 다르게 구성된다. 예를 들어 어떤 사람이 정직을 자아의 핵심 가치로 삼으면, 거짓말을 하는 것이 자아와 충돌하여 심리적 불편함을 느끼게 된다. 이처럼 도덕성이 자아의 중심에 자리 잡을수록, 도덕적 이해가 실제 행동으로 나타날 가능성이 높아진다.";

const p3 = "블라지의 모델에서는 도덕적 행동을 이끄는 세 가지 심리적 요소를 제시한다. 첫째, 도덕적 정체성은 도덕성을 자아의 중심에 두는 것으로, 해야 할 행동의 방향을 알려 준다. 둘째, 도덕적 책임감은 옳은 행동을 해야 할 의무가 자신에게 있다는 내적 자각이다. 이것은 외부의 강요가 아니라 자기 자신이 스스로에게 부과하는 엄격한 의무라는 점에서 다른 동기와 구별된다. 셋째, 자아 일관성은 자신의 도덕적 이상과 실제 행위를 일치시키려는 경향이다. 자아 일관성은 단순히 본능이나 자기 충족의 욕구에서 비롯되는 것이 아니라, 도덕적 정체성에 기반하여 판단과 행동 사이의 일관성을 유지하려는 노력이다.";

const p4 = "블라지의 도덕적 자아 모델이 주는 시사점은 분명하다. 도덕적 행동은 단지 옳고 그름을 아는 것만으로 보장되지 않으며, 도덕성이 자아의 중심에 놓여야 비로소 실천으로 이어진다. 이는 도덕 교육이 지식의 전달에 그치지 않고, 학생 스스로가 도덕적 가치를 자기 삶의 핵심으로 받아들이도록 돕는 방향으로 나아가야 함을 의미한다. 결국 도덕적 행동의 출발점은 무엇이 옳은지를 아는 머리가 아니라, 그 앎을 자신의 것으로 만드는 자아의 힘에 있다고 할 수 있다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
  { id: "p4", text: p4 }
];

const totalLen = paragraphs.reduce((sum, p) => sum + p.text.length, 0);
console.log("총 글자수:", totalLen);
if (totalLen < 1250 || totalLen > 1350) {
  console.error("!!! 글자수 범위 이탈:", totalLen);
}

// ────────────── 문장 경계 계산 ──────────────
function splitSentences(text) {
  const parts = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && i + 1 <= text.length) {
      if (i + 1 < text.length && text[i+1] === ' ') {
        parts.push({ start, end: i + 1 });
        start = i + 2;
      } else if (i + 1 === text.length) {
        parts.push({ start, end: i + 1 });
        start = i + 1;
      }
    }
  }
  if (start < text.length) {
    parts.push({ start, end: text.length });
  }
  return parts;
}

for (const p of paragraphs) {
  const sents = splitSentences(p.text);
  console.log(`\n${p.id} (${p.text.length}자, ${sents.length}문장):`);
  for (const s of sents) {
    const fragment = p.text.substring(s.start, s.end);
    console.log(`  [${s.start}, ${s.end}] "${fragment.substring(0, 50)}..."`);
  }
}

// ────────────── intensive 질문 ──────────────
const questions_by_paragraph = {
  p1: [
    // 문장 1: 우리는 일상에서 무엇이 옳고 그른지를 판단하는 경험을 자주 한다.
    {
      prompt: "첫 문장이 제시하는 일상적 경험으로 알맞은 것은?",
      choices: [
        { id: "A", text: "무엇이 옳고 그른지를 판단하는 경험을 자주 한다." },
        { id: "B", text: "매일 새로운 기술을 배워 실력을 키우는 경험을 한다." },
        { id: "C", text: "친구들과 어울려 놀면서 사회성을 기르는 경험을 한다." },
        { id: "D", text: "어려운 수학 문제를 풀면서 논리적 사고를 기르는 경험을 한다." }
      ],
      answerId: "A"
    },
    // 문장 2: 시험 중에 친구의 답을 보면 안 된다는 것을 알면서도 유혹을 느끼거나...
    {
      prompt: "둘째 문장이 드는 예시로 알맞은 것은?",
      choices: [
        { id: "A", text: "시험 중 컨닝의 유혹이나 주운 지갑 반환의 망설임이다." },
        { id: "B", text: "운동 경기에서 심판의 판정에 항의하는 경우이다." },
        { id: "C", text: "수업 시간에 선생님의 질문에 대답하지 못하는 경우이다." },
        { id: "D", text: "친구와 의견이 달라 토론하며 결론에 이르는 경우이다." }
      ],
      answerId: "A"
    },
    // 문장 3: 도덕 심리학에서는 이처럼 도덕적으로 옳은 것을 아는 것과 실제로 그것을 행동으로 옮기는 것 사이의 간극을...
    {
      prompt: "셋째 문장이 말하는 도덕 심리학의 핵심 문제로 알맞은 것은?",
      choices: [
        { id: "A", text: "도덕적 앎과 실제 행동 사이의 간극을 다루어 왔다." },
        { id: "B", text: "인간의 감정이 행동에 미치는 긍정적 영향을 연구해 왔다." },
        { id: "C", text: "법률과 도덕의 차이를 규명하는 것이 주된 관심사였다." },
        { id: "D", text: "도덕적 행동을 하지 않는 사람에 대한 처벌 방안을 연구해 왔다." }
      ],
      answerId: "A"
    },
    // 문장 4: 콜버그는 인지 발달 이론을 통해...
    {
      prompt: "넷째 문장에서 콜버그가 주장한 내용으로 알맞은 것은?",
      choices: [
        { id: "A", text: "인지 능력이 발달하면 자연스럽게 도덕적 행동을 하게 된다." },
        { id: "B", text: "도덕적 행동은 사회적 압력에 의해서만 나타난다." },
        { id: "C", text: "도덕적 인지와 도덕적 행동은 서로 관련이 없다." },
        { id: "D", text: "감정적 발달이 인지적 발달보다 도덕적 행동에 더 중요하다." }
      ],
      answerId: "A"
    },
    // 문장 5: 그러나 현실에서는 옳은 행동이 무엇인지 알면서도 실천하지 못하는 사람이 적지 않으므로...
    {
      prompt: "다섯째 문장이 제기하는 비판으로 알맞은 것은?",
      choices: [
        { id: "A", text: "알면서도 실천하지 못하는 경우가 많아 콜버그의 이론만으로는 부족하다." },
        { id: "B", text: "콜버그의 이론이 현실에서 완벽하게 작동한다는 것이 입증되었다." },
        { id: "C", text: "도덕적 행동은 인지가 아니라 체력에 의해 결정된다." },
        { id: "D", text: "도덕적 판단 능력은 나이와 전혀 관계가 없다." }
      ],
      answerId: "A"
    }
  ],
  p2: [
    // 문장 1: 이러한 한계를 극복하고자 블라지는...
    {
      prompt: "첫 문장에서 블라지가 제안한 모델로 알맞은 것은?",
      choices: [
        { id: "A", text: "도덕적 이해가 자아와 통합되어야 행동으로 이어진다는 '도덕적 자아 모델'이다." },
        { id: "B", text: "도덕적 이해가 감정에 의해 자동으로 행동이 되는 '감정 반응 모델'이다." },
        { id: "C", text: "사회적 보상이 있을 때만 도덕적 행동이 나타난다는 '보상 모델'이다." },
        { id: "D", text: "도덕적 행동은 유전에 의해 결정된다는 '생물학적 결정론'이다." }
      ],
      answerId: "A"
    },
    // 문장 2: 이 모델의 핵심은...
    {
      prompt: "둘째 문장이 말하는 모델의 핵심으로 알맞은 것은?",
      choices: [
        { id: "A", text: "도덕적 이해가 지식에 머물지 않고 정체성의 일부가 되어야 한다." },
        { id: "B", text: "도덕적 이해를 가능한 한 많이 암기해야 한다." },
        { id: "C", text: "도덕적 행동은 외부의 규칙을 엄격히 따르는 것이다." },
        { id: "D", text: "도덕적 지식은 시험 성적으로만 평가할 수 있다." }
      ],
      answerId: "A"
    },
    // 문장 3: 블라지에 따르면 자아는 고정된 것이 아니라...
    {
      prompt: "셋째 문장에서 블라지가 말하는 자아의 특성으로 알맞은 것은?",
      choices: [
        { id: "A", text: "자아는 고정되지 않으며, 어떤 가치를 중심에 놓느냐에 따라 달라진다." },
        { id: "B", text: "자아는 태어날 때 결정되며 평생 변하지 않는다." },
        { id: "C", text: "자아는 외부 환경에 의해서만 형성되고 개인의 의지와 무관하다." },
        { id: "D", text: "자아는 모든 사람에게 동일한 구조를 가지고 있다." }
      ],
      answerId: "A"
    },
    // 문장 4: 예를 들어 어떤 사람이 정직을 자아의 핵심 가치로 삼으면...
    {
      prompt: "넷째 문장이 드는 예시로 알맞은 것은?",
      choices: [
        { id: "A", text: "정직을 핵심 가치로 삼으면 거짓말이 자아와 충돌하여 불편함을 느낀다." },
        { id: "B", text: "정직을 핵심 가치로 삼으면 거짓말을 해도 아무 감정이 들지 않는다." },
        { id: "C", text: "정직을 핵심 가치로 삼으면 다른 사람의 거짓말도 허용하게 된다." },
        { id: "D", text: "정직을 핵심 가치로 삼더라도 자아와는 아무 관련이 없다." }
      ],
      answerId: "A"
    },
    // 문장 5: 이처럼 도덕성이 자아의 중심에 자리 잡을수록...
    {
      prompt: "다섯째 문장이 말하는 도덕성과 행동의 관계로 알맞은 것은?",
      choices: [
        { id: "A", text: "도덕성이 자아의 중심에 자리 잡을수록 행동으로 나타날 가능성이 높다." },
        { id: "B", text: "도덕성이 자아의 중심에 있어도 행동과는 관련이 없다." },
        { id: "C", text: "도덕성이 자아의 주변에 있을수록 행동으로 나타나기 쉽다." },
        { id: "D", text: "도덕성과 자아의 위치는 행동에 영향을 미치지 않는다." }
      ],
      answerId: "A"
    }
  ],
  p3: [
    // 문장 1: 블라지의 모델에서는 도덕적 행동을 이끄는 세 가지 심리적 요소를 제시한다.
    {
      prompt: "첫 문장이 소개하는 내용으로 알맞은 것은?",
      choices: [
        { id: "A", text: "도덕적 행동을 이끄는 세 가지 심리적 요소를 제시한다." },
        { id: "B", text: "도덕적 판단의 역사적 변천 과정을 시대순으로 설명한다." },
        { id: "C", text: "콜버그의 인지 발달 이론의 장점을 세 가지로 정리한다." },
        { id: "D", text: "도덕적 행동이 불필요한 세 가지 상황을 설명한다." }
      ],
      answerId: "A"
    },
    // 문장 2: 첫째, 도덕적 정체성은 도덕성을 자아의 중심에 두는 것으로...
    {
      prompt: "둘째 문장이 설명하는 '도덕적 정체성'의 역할로 알맞은 것은?",
      choices: [
        { id: "A", text: "도덕성을 자아의 중심에 두어 해야 할 행동의 방향을 알려 준다." },
        { id: "B", text: "도덕성을 자아에서 분리하여 객관적 판단을 돕는다." },
        { id: "C", text: "도덕적 행동을 억제하고 이성적 판단만 하게 한다." },
        { id: "D", text: "자아의 모든 가치를 동등한 위치에 놓아 균형을 맞춘다." }
      ],
      answerId: "A"
    },
    // 문장 3: 둘째, 도덕적 책임감은 옳은 행동을 해야 할 의무가 자신에게 있다는 내적 자각이다.
    {
      prompt: "셋째 문장이 정의하는 '도덕적 책임감'으로 알맞은 것은?",
      choices: [
        { id: "A", text: "옳은 행동을 해야 할 의무가 자신에게 있다는 내적 자각이다." },
        { id: "B", text: "다른 사람이 시키는 대로 행동해야 한다는 외적 의무이다." },
        { id: "C", text: "잘못된 행동에 대해 법적 처벌을 받아야 한다는 두려움이다." },
        { id: "D", text: "보상을 기대하며 올바른 행동을 선택하려는 계산이다." }
      ],
      answerId: "A"
    },
    // 문장 4: 이것은 외부의 강요가 아니라 자기 자신이 스스로에게 부과하는 엄격한 의무라는 점에서...
    {
      prompt: "넷째 문장이 강조하는 도덕적 책임감의 특징으로 알맞은 것은?",
      choices: [
        { id: "A", text: "외부의 강요가 아니라 자기 자신이 부과하는 내적 의무라는 점이다." },
        { id: "B", text: "부모나 교사의 지시에 따르는 것이 핵심이라는 점이다." },
        { id: "C", text: "사회적 평판을 유지하기 위한 전략이라는 점이다." },
        { id: "D", text: "법적 규정을 준수하려는 의무와 동일하다는 점이다." }
      ],
      answerId: "A"
    },
    // 문장 5: 셋째, 자아 일관성은 자신의 도덕적 이상과 실제 행위를 일치시키려는 경향이다.
    {
      prompt: "다섯째 문장이 정의하는 '자아 일관성'으로 알맞은 것은?",
      choices: [
        { id: "A", text: "자신의 도덕적 이상과 실제 행위를 일치시키려는 경향이다." },
        { id: "B", text: "자신의 감정을 억누르고 이성적으로만 판단하려는 태도이다." },
        { id: "C", text: "다른 사람과 항상 같은 의견을 유지하려는 성향이다." },
        { id: "D", text: "과거의 행동 방식을 변경하지 않으려는 고집이다." }
      ],
      answerId: "A"
    },
    // 문장 6: 자아 일관성은 단순히 본능이나 자기 충족의 욕구에서 비롯되는 것이 아니라...
    {
      prompt: "여섯째 문장이 설명하는 자아 일관성의 기반으로 알맞은 것은?",
      choices: [
        { id: "A", text: "도덕적 정체성에 기반하여 판단과 행동의 일관성을 유지하려는 노력이다." },
        { id: "B", text: "본능적 욕구를 충족시키기 위한 자연스러운 반응이다." },
        { id: "C", text: "사회적 보상을 얻기 위해 남에게 좋은 모습을 보이려는 노력이다." },
        { id: "D", text: "자기 충족의 욕구에서 비롯되는 이기적 동기이다." }
      ],
      answerId: "A"
    }
  ],
  p4: [
    // 문장 1: 블라지의 도덕적 자아 모델이 주는 시사점은 분명하다.
    {
      prompt: "첫 문장이 전하는 내용으로 알맞은 것은?",
      choices: [
        { id: "A", text: "블라지의 도덕적 자아 모델이 주는 시사점이 분명하다고 말한다." },
        { id: "B", text: "블라지의 이론이 현실에서 적용하기 어렵다고 비판한다." },
        { id: "C", text: "콜버그의 이론이 블라지보다 더 우수하다고 주장한다." },
        { id: "D", text: "도덕적 자아 모델은 아직 검증이 필요하다고 경고한다." }
      ],
      answerId: "A"
    },
    // 문장 2: 도덕적 행동은 단지 옳고 그름을 아는 것만으로 보장되지 않으며...
    {
      prompt: "둘째 문장이 강조하는 요점으로 알맞은 것은?",
      choices: [
        { id: "A", text: "앎만으로는 부족하고, 도덕성이 자아의 중심에 놓여야 실천으로 이어진다." },
        { id: "B", text: "도덕적 행동은 지식만 있으면 누구나 자동으로 할 수 있다." },
        { id: "C", text: "도덕성은 자아와 분리되어야 객관적 판단이 가능하다." },
        { id: "D", text: "옳고 그름을 아는 것 자체가 도덕적 행동을 완전히 보장한다." }
      ],
      answerId: "A"
    },
    // 문장 3: 이는 도덕 교육이 지식의 전달에 그치지 않고...
    {
      prompt: "셋째 문장이 주장하는 도덕 교육의 방향으로 알맞은 것은?",
      choices: [
        { id: "A", text: "학생이 도덕적 가치를 자기 삶의 핵심으로 받아들이도록 도와야 한다." },
        { id: "B", text: "도덕적 지식을 최대한 많이 암기시키는 데 집중해야 한다." },
        { id: "C", text: "도덕 교육은 시험 성적 향상에만 초점을 맞추어야 한다." },
        { id: "D", text: "도덕적 가치는 학생이 스스로 찾을 수 없으므로 강제해야 한다." }
      ],
      answerId: "A"
    },
    // 문장 4: 결국 도덕적 행동의 출발점은 무엇이 옳은지를 아는 머리가 아니라...
    {
      prompt: "넷째 문장이 결론으로 제시하는 도덕적 행동의 출발점으로 알맞은 것은?",
      choices: [
        { id: "A", text: "앎을 자신의 것으로 만드는 자아의 힘에 있다." },
        { id: "B", text: "옳고 그름을 판단하는 두뇌의 인지 능력에 있다." },
        { id: "C", text: "법과 규칙을 철저히 지키는 사회적 시스템에 있다." },
        { id: "D", text: "주변 사람들의 칭찬과 격려에 있다." }
      ],
      answerId: "A"
    }
  ]
};

const centralQuestions = {
  p1: {
    prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "도덕적 앎과 행동 사이의 간극 문제를 소개하고 콜버그 이론의 한계를 지적한다." },
      { id: "B", text: "콜버그의 인지 발달 이론이 모든 도덕적 행동을 완벽히 설명한다." },
      { id: "C", text: "도덕적 판단 능력은 누구에게나 동일하게 발달한다." },
      { id: "D", text: "시험 부정행위의 원인과 처벌 방안을 구체적으로 제시한다." }
    ],
    answerId: "A"
  },
  p2: {
    prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "블라지의 도덕적 자아 모델은 도덕적 이해가 자아와 통합되어야 행동으로 이어진다고 본다." },
      { id: "B", text: "블라지는 도덕적 이해가 지식 수준에만 머물러야 한다고 주장한다." },
      { id: "C", text: "자아는 변하지 않는 고정된 구조이므로 가치 선택이 불가능하다." },
      { id: "D", text: "정직은 자아의 핵심 가치가 될 수 없다." }
    ],
    answerId: "A"
  },
  p3: {
    prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "도덕적 정체성, 도덕적 책임감, 자아 일관성이 도덕적 행동을 이끄는 세 요소이다." },
      { id: "B", text: "도덕적 행동은 하나의 심리적 요소만으로도 충분히 설명된다." },
      { id: "C", text: "자아 일관성은 본능적 욕구에서 비롯되는 자연스러운 반응이다." },
      { id: "D", text: "도덕적 책임감은 외부의 강요에 의해 생기는 의무이다." }
    ],
    answerId: "A"
  },
  p4: {
    prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "도덕적 행동의 출발점은 앎이 아니라 그 앎을 자기 것으로 만드는 자아의 힘에 있다." },
      { id: "B", text: "도덕 교육은 지식 전달에만 집중하면 충분하다." },
      { id: "C", text: "도덕적 행동은 개인의 노력보다 사회적 환경에 의해 결정된다." },
      { id: "D", text: "블라지의 모델은 실제 교육에 적용할 수 없다." }
    ],
    answerId: "A"
  }
};

// ────────────── intensive timeline 생성 ──────────────
const timeline = [];
let stepNum = 1;

for (const p of paragraphs) {
  const sents = splitSentences(p.text);
  const qs = questions_by_paragraph[p.id];

  if (sents.length !== qs.length) {
    console.error(`!!! ${p.id}: 문장 수(${sents.length}) != 질문 수(${qs.length})`);
  }

  for (let i = 0; i < sents.length; i++) {
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [{ paragraphId: p.id, start: sents[i].start, end: sents[i].end }] },
      question: {
        prompt: qs[i].prompt,
        choices: qs[i].choices,
        answerId: qs[i].answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
    stepNum++;
  }

  const cq = centralQuestions[p.id];
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [{ paragraphId: p.id, start: 0, end: p.text.length }] },
    question: {
      prompt: cq.prompt,
      choices: cq.choices,
      answerId: cq.answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
}

// ────────────── recall 8카드 ──────────────
const recall = {
  cards: [
    { id: "c1", text: "도덕 심리학에서는 도덕적 앎과 행동 사이의 간극을 중요한 문제로 다룬다." },
    { id: "c2", text: "콜버그는 인지가 발달하면 도덕적 행동이 따른다고 보았으나 한계가 있다." },
    { id: "c3", text: "블라지는 도덕적 이해가 자아와 통합되어야 행동으로 이어진다고 보았다." },
    { id: "c4", text: "도덕적 정체성은 도덕성을 자아의 중심에 두어 행동 방향을 알려 준다." },
    { id: "c5", text: "도덕적 책임감은 외부 강요가 아닌 자기 자신이 부과하는 내적 의무이다." },
    { id: "c6", text: "자아 일관성은 도덕적 이상과 행위를 일치시키려는 경향이다." },
    { id: "c7", text: "도덕 교육은 지식 전달을 넘어 가치를 삶의 핵심으로 받아들이게 도와야 한다." },
    { id: "c8", text: "도덕적 행동의 출발점은 앎을 자신의 것으로 만드는 자아의 힘에 있다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// ────────────── confirm 질문 ──────────────
function findAnswerRanges(answerText, paragraphs) {
  const ranges = [];
  for (const p of paragraphs) {
    let idx = p.text.indexOf(answerText);
    while (idx !== -1) {
      ranges.push({ paragraphId: p.id, start: idx, end: idx + answerText.length });
      idx = p.text.indexOf(answerText, idx + 1);
    }
  }
  return ranges;
}

const confirmQuestionsRaw = [
  {
    id: "q1",
    prompt: "인지 발달 이론을 통해 도덕적 행동을 설명한 학자는 누구인가?",
    answerText: "콜버그",
    answerMatchMode: "ANY"
  },
  {
    id: "q2",
    prompt: "도덕적 이해가 자아와 통합되어야 행동으로 이어진다고 주장한 학자는 누구인가?",
    answerText: "블라지",
    answerMatchMode: "ANY"
  },
  {
    id: "q3",
    prompt: "도덕성을 자아의 중심에 두어 행동의 방향을 알려 주는 심리적 요소는 무엇인가?",
    answerText: "도덕적 정체성",
    answerMatchMode: "ANY"
  },
  {
    id: "q4",
    prompt: "옳은 행동을 해야 할 의무가 자신에게 있다는 내적 자각을 무엇이라 하는가?",
    answerText: "도덕적 책임감",
    answerMatchMode: "ANY"
  },
  {
    id: "q5",
    prompt: "자신의 도덕적 이상과 실제 행위를 일치시키려는 경향을 무엇이라 하는가?",
    answerText: "자아 일관성",
    answerMatchMode: "ANY"
  },
  {
    id: "q6",
    prompt: "블라지의 모델에 따르면, 도덕적 이해가 단순한 지식이 아니라 무엇의 일부가 되어야 하는가?",
    answerText: "정체성",
    answerMatchMode: "ANY"
  },
  {
    id: "q7",
    prompt: "글의 결론에서 도덕적 행동의 출발점이라고 말하는 것은 무엇의 힘인가?",
    answerText: "자아",
    answerMatchMode: "ANY"
  }
];

const confirmQuestions = confirmQuestionsRaw.map(q => {
  const ranges = findAnswerRanges(q.answerText, paragraphs);
  if (ranges.length === 0) {
    console.error(`!!! answerText "${q.answerText}" 를 본문에서 찾을 수 없음!`);
  } else {
    console.log(`confirm ${q.id}: "${q.answerText}" → ${JSON.stringify(ranges)}`);
  }
  return {
    id: q.id,
    prompt: q.prompt,
    answerText: q.answerText,
    answerMatchMode: q.answerMatchMode,
    answerRanges: ranges,
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  };
});

// ────────────── JSON 조합 ──────────────
const content = {
  contentId: "dr-r3-003",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 3) Day 3 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_3",
  schoolGradeRange: { min: 9, max: 9 },
  area: "READING",
  subArea: "NONFICTION",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300,
  assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall,
    confirm: { questions: confirmQuestions }
  }
};

// 검증
console.log("\n===== 검증 =====");
console.log("총 글자수:", totalLen, totalLen >= 1250 && totalLen <= 1350 ? "OK" : "FAIL");
console.log("recall 카드 수:", recall.cards.length, recall.cards.length === 8 ? "OK" : "FAIL");
console.log("confirm 문항 수:", confirmQuestions.length, confirmQuestions.length >= 5 ? "OK" : "FAIL");
console.log("intensive step 수:", timeline.length);

let rangeOk = true;
for (const step of timeline) {
  for (const r of step.highlight.ranges) {
    const p = paragraphs.find(pp => pp.id === r.paragraphId);
    if (!p) { console.error(`!!! 문단 ${r.paragraphId} 없음`); rangeOk = false; continue; }
    if (r.start < 0 || r.end > p.text.length || r.start >= r.end) {
      console.error(`!!! ${step.stepId} 범위 오류: [${r.start}, ${r.end}] (문단길이: ${p.text.length})`);
      rangeOk = false;
    }
  }
}
for (const q of confirmQuestions) {
  for (const r of q.answerRanges) {
    const p = paragraphs.find(pp => pp.id === r.paragraphId);
    if (!p) { console.error(`!!! 문단 ${r.paragraphId} 없음`); rangeOk = false; continue; }
    const found = p.text.substring(r.start, r.end);
    if (found !== q.answerText) {
      console.error(`!!! ${q.id} answerRange 불일치: "${found}" !== "${q.answerText}"`);
      rangeOk = false;
    }
  }
}
console.log("ranges 검증:", rangeOk ? "OK" : "FAIL");

// 파일 출력
const outPath = 'frontend/public/daily-reading/russell3/003.json';
fs.writeFileSync(outPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\n파일 저장: ${outPath}`);

// 배치 파일 업데이트
const batchPath = 'generated/daily-batch-reading-russell3.json';
if (fs.existsSync(batchPath)) {
  const data = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  data.items[2] = {
    content_type: "DAILY_READING",
    level_id: "RUSSELL_3",
    area: "READING",
    sub_area: "NONFICTION",
    day_index: 3,
    module_key: "reading_training",
    schema_version: "1.0",
    content: content
  };
  fs.writeFileSync(batchPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`배치 파일 업데이트: ${batchPath}`);
}
