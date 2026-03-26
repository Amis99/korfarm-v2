// 러셀3 Day 1 - 비문학 (사회/법: 법률행위의 무효와 취소)
// 중3 수준으로 재구성, 1300자 ±50

const fs = require('fs');

// ────────────── 지문 (3~4문단) ──────────────
const p1 = "일상에서 우리는 물건을 사거나 약속을 하는 등 다양한 법률행위를 한다. 법률행위란 법적으로 의미 있는 효과를 만들어 내는 행위를 가리키며, 매매 계약이나 유언 등이 대표적인 예이다. 이러한 법률행위가 제대로 효력을 발생시키려면 성립요건과 효력요건을 모두 갖추어야 한다. 성립요건은 법률행위가 존재하기 위한 기본 조건이고, 효력요건은 이미 성립한 법률행위가 실제로 법적 효력을 얻는 데 필요한 조건이다. 예를 들어 계약서에 당사자의 서명이 빠져 있으면 성립요건을 갖추지 못한 것이고, 서명은 있지만 미성년자가 보호자 동의 없이 체결한 계약이라면 효력요건이 문제가 된다. 성립요건을 갖추지 못하면 법률행위 자체가 존재하지 않는 것으로 보고, 효력요건이 불충분하면 성립은 되었으나 효력이 부정되는 상태가 된다.";

const p2 = "효력요건의 결함으로 효력이 부정되는 대표적인 경우가 바로 '무효'와 '취소'이다. 무효란 법률행위가 처음부터 아무런 효력도 갖지 못하는 상태를 말한다. 무효는 별도로 누군가 주장하지 않아도 저절로 효력이 없으며, 아무리 시간이 지나도 유효로 바뀌지 않는다. 반면 취소는 일단 유효하게 성립한 법률행위의 효력을 나중에 소멸시키는 것이다. 취소는 취소권을 가진 사람이 직접 주장해야만 효력이 없어진다는 점에서 무효와 구별된다. 또한 취소권에는 행사 기한이 있어 일정 기간이 지나면 취소할 수 없게 되고, 그 법률행위는 결국 유효한 것으로 확정된다.";

const p3 = "무효인 법률행위는 법적으로 아무것도 존재하지 않는 것과 같으므로, 소급하여 유효로 만들 대상 자체가 없다. 그래서 법은 무효 행위를 다른 종류의 법률행위로 '전환'하거나, 부족했던 효력요건을 나중에 보충하는 '추인'이라는 방법을 허용한다. 전환이란 무효인 법률행위가 다른 법률행위의 효력요건을 갖추고 있을 때 그 다른 법률행위로서 효력을 인정하는 것이다. 예컨대 해고 처분이 무효가 되었더라도 휴직 처분의 요건은 갖추고 있다면 휴직으로 전환할 수 있다. 추인은 무효 원인이 사라진 상태에서 당사자가 무효임을 알면서도 다시 인정하는 절차로, 추인한 시점부터 새로운 법률행위로서 효력이 발생한다.";

const p4 = "법률행위가 무효가 되면 그에 따른 법적 효과도 함께 소멸하므로, 상대방은 채무 이행을 요구할 수 없다. 만약 이미 이행된 채무가 있다면 이를 받은 사람은 부당이득으로서 돌려주어야 한다. 예를 들어 무효인 매매 계약에 따라 대금을 받은 판매자는 그 대금을 구매자에게 반환해야 한다. 다만 부당이득의 반환을 청구할 권리에도 소멸시효가 있으므로 언제까지나 반환을 요구할 수 있는 것은 아니다. 이처럼 법률행위의 무효와 취소는 일상의 법적 분쟁을 해결하는 핵심 개념으로, 어떤 상황에서 효력이 부정되는지, 어떻게 구제받을 수 있는지를 이해하는 것이 법적 사고의 출발점이 된다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
  { id: "p4", text: p4 }
];

// 총 글자수 확인
const totalLen = paragraphs.reduce((sum, p) => sum + p.text.length, 0);
console.log("총 글자수:", totalLen);
if (totalLen < 1250 || totalLen > 1350) {
  console.error("!!! 글자수 범위 이탈:", totalLen);
}

// ────────────── 문장 경계 계산 ──────────────
function splitSentences(text) {
  const sentences = [];
  let pos = 0;
  // 한국어 문장 종결: .다, .이다 등 → ". " 또는 끝까지
  const regex = /[^.]*?\./g;
  let match;
  // 수동으로 '. ' 기준 또는 '다.' 기준 분리
  const parts = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && i + 1 <= text.length) {
      // 문장 끝
      if (i + 1 < text.length && text[i+1] === ' ') {
        parts.push({ start, end: i + 1 }); // '. '의 '.'까지 포함, 공백 전까지
        start = i + 2; // 공백 다음부터
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

// 각 문단의 문장 경계 계산
const allSentences = [];
for (const p of paragraphs) {
  const sents = splitSentences(p.text);
  console.log(`\n${p.id} (${p.text.length}자, ${sents.length}문장):`);
  for (const s of sents) {
    const fragment = p.text.substring(s.start, s.end);
    console.log(`  [${s.start}, ${s.end}] "${fragment.substring(0, 40)}..."`);
    allSentences.push({ pid: p.id, ...s });
  }
}

// ────────────── intensive 생성 ──────────────
const timeline = [];
let stepNum = 1;

// 문단별 문장 하이라이트 step + 문단 끝 중심내용 step
const questions_by_paragraph = {
  p1: [
    // 문장 1: 일상에서 우리는 물건을 사거나 약속을 하는 등 다양한 법률행위를 한다.
    {
      prompt: "첫 문장에서 말하는 '법률행위'의 예시로 알맞은 것은?",
      choices: [
        { id: "A", text: "물건을 사거나 약속을 하는 행위를 가리킨다." },
        { id: "B", text: "경찰이 범인을 체포하여 조사하는 행위를 말한다." },
        { id: "C", text: "교실에서 친구와 대화하는 일상적 행위를 말한다." },
        { id: "D", text: "운동장에서 달리기 시합을 하는 행위를 가리킨다." }
      ],
      answerId: "A"
    },
    // 문장 2: 법률행위란 법적으로 의미 있는 효과를 만들어 내는 행위를 가리키며, 매매 계약이나 유언 등이 대표적인 예이다.
    {
      prompt: "둘째 문장이 제시하는 법률행위의 대표적인 예로 알맞은 것은?",
      choices: [
        { id: "A", text: "매매 계약이나 유언 같은 법적 효과를 만드는 행위이다." },
        { id: "B", text: "일기장에 감정을 적는 개인적 기록 행위를 말한다." },
        { id: "C", text: "공원에서 산책을 하며 건강을 관리하는 행위를 말한다." },
        { id: "D", text: "학교 숙제를 완성하여 선생님께 제출하는 행위를 말한다." }
      ],
      answerId: "A"
    },
    // 문장 3: 이러한 법률행위가 제대로 효력을 발생시키려면 성립요건과 효력요건을 모두 갖추어야 한다.
    {
      prompt: "셋째 문장이 말하는 조건으로 알맞은 것은?",
      choices: [
        { id: "A", text: "법률행위가 효력을 가지려면 성립요건과 효력요건이 모두 필요하다." },
        { id: "B", text: "법률행위가 효력을 가지려면 당사자의 나이만 확인하면 충분하다." },
        { id: "C", text: "법률행위가 효력을 가지려면 증인 한 명의 서명만 있으면 된다." },
        { id: "D", text: "법률행위가 효력을 가지려면 법원의 사전 허가만 받으면 충분하다." }
      ],
      answerId: "A"
    },
    // 문장 4: 성립요건은 법률행위가 존재하기 위한 기본 조건이고, 효력요건은 이미 성립한 법률행위가 실제로 법적 효력을 얻는 데 필요한 조건이다.
    {
      prompt: "넷째 문장이 구별하는 두 가지 요건에 대한 설명으로 알맞은 것은?",
      choices: [
        { id: "A", text: "성립요건은 존재 조건, 효력요건은 법적 효력을 얻기 위한 조건이다." },
        { id: "B", text: "성립요건은 취소 조건, 효력요건은 무효를 막기 위한 조건이다." },
        { id: "C", text: "두 요건 모두 법률행위가 무효가 된 뒤에야 판단할 수 있는 조건이다." },
        { id: "D", text: "성립요건과 효력요건은 같은 의미로 혼용되는 법률 용어이다." }
      ],
      answerId: "A"
    },
    // 문장 5: 예를 들어 계약서에 당사자의 서명이 빠져 있으면 성립요건을 갖추지 못한 것이고, 서명은 있지만 미성년자가 보호자 동의 없이 체결한 계약이라면 효력요건이 문제가 된다.
    {
      prompt: "다섯째 문장이 드는 예시의 설명으로 알맞은 것은?",
      choices: [
        { id: "A", text: "서명 누락은 성립요건 미비이고, 미성년자의 동의 없는 계약은 효력요건 문제이다." },
        { id: "B", text: "서명이 있으면 미성년자 계약도 모두 유효하게 성립한다." },
        { id: "C", text: "미성년자의 동의 없는 계약은 성립요건 문제이고 서명 누락은 효력요건 문제이다." },
        { id: "D", text: "서명 누락과 미성년자 계약은 모두 효력요건에만 해당하는 문제이다." }
      ],
      answerId: "A"
    },
    // 문장 6: 성립요건을 갖추지 못하면 법률행위 자체가 존재하지 않는 것으로 보고, 효력요건이 불충분하면 성립은 되었으나 효력이 부정되는 상태가 된다.
    {
      prompt: "여섯째 문장이 설명하는 결과로 알맞은 것은?",
      choices: [
        { id: "A", text: "성립요건 미비 시 행위 자체가 없고, 효력요건 미비 시 성립은 되나 효력이 부정된다." },
        { id: "B", text: "성립요건을 갖추지 못해도 효력요건만 있으면 법률행위가 유효해진다." },
        { id: "C", text: "효력요건을 갖추지 못하면 성립요건도 함께 소멸하여 아무것도 남지 않는다." },
        { id: "D", text: "두 요건 중 하나만 있어도 법률행위는 완전한 효력을 발생시킨다." }
      ],
      answerId: "A"
    }
    // 문단 중심내용 step은 아래에서 별도 추가
  ],
  p2: [
    // 문장 1: 효력요건의 결함으로 효력이 부정되는 대표적인 경우가 바로 '무효'와 '취소'이다.
    {
      prompt: "첫 문장이 소개하는 두 가지 경우로 알맞은 것은?",
      choices: [
        { id: "A", text: "효력요건에 결함이 있을 때 나타나는 '무효'와 '취소'이다." },
        { id: "B", text: "성립요건에 결함이 있을 때 나타나는 '설립'과 '해산'이다." },
        { id: "C", text: "법률행위가 성공할 때 나타나는 '승인'과 '확인'이다." },
        { id: "D", text: "법적 분쟁이 끝날 때 나타나는 '합의'와 '조정'이다." }
      ],
      answerId: "A"
    },
    // 문장 2: 무효란 법률행위가 처음부터 아무런 효력도 갖지 못하는 상태를 말한다.
    {
      prompt: "둘째 문장이 정의하는 '무효'의 의미로 알맞은 것은?",
      choices: [
        { id: "A", text: "법률행위가 처음부터 전혀 효력이 없는 상태를 말한다." },
        { id: "B", text: "법률행위가 일단 유효했다가 나중에 소멸되는 상태를 말한다." },
        { id: "C", text: "법률행위의 효력이 일시적으로 멈추었다가 다시 살아나는 상태를 말한다." },
        { id: "D", text: "법률행위가 당사자 합의에 의해 변경되는 상태를 말한다." }
      ],
      answerId: "A"
    },
    // 문장 3: 무효는 별도로 누군가 주장하지 않아도 저절로 효력이 없으며, 아무리 시간이 지나도 유효로 바뀌지 않는다.
    {
      prompt: "셋째 문장이 말하는 무효의 특성으로 알맞은 것은?",
      choices: [
        { id: "A", text: "별도의 주장이 없어도 저절로 효력이 없고 시간이 지나도 변하지 않는다." },
        { id: "B", text: "반드시 법원의 판결을 거쳐야만 효력이 없는 것으로 확정된다." },
        { id: "C", text: "일정 기간이 지나면 자동으로 유효한 것으로 전환된다." },
        { id: "D", text: "당사자가 주장하지 않으면 유효한 상태로 유지된다." }
      ],
      answerId: "A"
    },
    // 문장 4: 반면 취소는 일단 유효하게 성립한 법률행위의 효력을 나중에 소멸시키는 것이다.
    {
      prompt: "넷째 문장이 설명하는 '취소'의 뜻으로 알맞은 것은?",
      choices: [
        { id: "A", text: "일단 유효하게 성립한 법률행위를 나중에 효력 없게 만드는 것이다." },
        { id: "B", text: "처음부터 효력이 없던 법률행위를 다시 확인하는 절차를 말한다." },
        { id: "C", text: "법률행위의 성립요건을 보완하여 새로 만드는 것을 말한다." },
        { id: "D", text: "법률행위를 당사자 동의 없이 일방적으로 변경하는 것을 말한다." }
      ],
      answerId: "A"
    },
    // 문장 5: 취소는 취소권을 가진 사람이 직접 주장해야만 효력이 없어진다는 점에서 무효와 구별된다.
    {
      prompt: "다섯째 문장이 말하는 취소와 무효의 차이로 알맞은 것은?",
      choices: [
        { id: "A", text: "취소는 취소권자가 직접 주장해야 효력이 없어지지만 무효는 그렇지 않다." },
        { id: "B", text: "무효는 취소권자의 주장이 필요하고 취소는 자동으로 효력이 사라진다." },
        { id: "C", text: "취소와 무효 모두 당사자 주장 없이 저절로 효력이 없어진다." },
        { id: "D", text: "취소와 무효는 구별되지 않으며 동일한 법적 효과를 가진다." }
      ],
      answerId: "A"
    },
    // 문장 6: 또한 취소권에는 행사 기한이 있어 일정 기간이 지나면 취소할 수 없게 되고, 그 법률행위는 결국 유효한 것으로 확정된다.
    {
      prompt: "여섯째 문장이 설명하는 취소권의 특징으로 알맞은 것은?",
      choices: [
        { id: "A", text: "행사 기한이 있어 기간이 지나면 취소가 불가능해지고 유효로 확정된다." },
        { id: "B", text: "행사 기한이 없어 언제든지 자유롭게 취소할 수 있다." },
        { id: "C", text: "기한이 지나면 취소권이 더욱 강해져 무효로 전환된다." },
        { id: "D", text: "기한과 관계없이 법원의 직권으로만 행사할 수 있다." }
      ],
      answerId: "A"
    }
  ],
  p3: [
    // 문장 1: 무효인 법률행위는 법적으로 아무것도 존재하지 않는 것과 같으므로, 소급하여 유효로 만들 대상 자체가 없다.
    {
      prompt: "첫 문장이 설명하는 무효 행위의 법적 성격으로 알맞은 것은?",
      choices: [
        { id: "A", text: "법적으로 존재하지 않는 것과 같아서 소급하여 유효로 만들 대상이 없다." },
        { id: "B", text: "법적으로 존재는 하지만 시간이 지나면 자동으로 유효가 된다." },
        { id: "C", text: "법적으로 존재하므로 언제든지 소급하여 유효로 전환할 수 있다." },
        { id: "D", text: "법적으로 부분적 효력이 남아 있어 일부 권리가 유지된다." }
      ],
      answerId: "A"
    },
    // 문장 2: 그래서 법은 무효 행위를 다른 종류의 법률행위로 '전환'하거나, 부족했던 효력요건을 나중에 보충하는 '추인'이라는 방법을 허용한다.
    {
      prompt: "둘째 문장이 소개하는 두 가지 구제 방법으로 알맞은 것은?",
      choices: [
        { id: "A", text: "무효 행위를 다른 행위로 바꾸는 '전환'과 요건을 보충하는 '추인'이다." },
        { id: "B", text: "무효 행위를 삭제하는 '폐기'와 새로 시작하는 '재성립'이다." },
        { id: "C", text: "무효 행위를 연장하는 '갱신'과 기간을 늘리는 '연장'이다." },
        { id: "D", text: "무효 행위를 숨기는 '은폐'와 책임을 미루는 '전가'이다." }
      ],
      answerId: "A"
    },
    // 문장 3: 전환이란 무효인 법률행위가 다른 법률행위의 효력요건을 갖추고 있을 때 그 다른 법률행위로서 효력을 인정하는 것이다.
    {
      prompt: "셋째 문장이 정의하는 '전환'의 의미로 알맞은 것은?",
      choices: [
        { id: "A", text: "무효 행위가 다른 행위의 요건을 갖추고 있을 때 그 행위로 효력을 인정한다." },
        { id: "B", text: "유효한 행위를 더 강력한 효력을 가진 다른 행위로 격상시키는 것이다." },
        { id: "C", text: "취소된 행위를 원래 상태로 되돌려 다시 유효하게 만드는 것이다." },
        { id: "D", text: "성립요건이 부족한 행위에 새로운 요건을 추가하는 것이다." }
      ],
      answerId: "A"
    },
    // 문장 4: 예컨대 해고 처분이 무효가 되었더라도 휴직 처분의 요건은 갖추고 있다면 휴직으로 전환할 수 있다.
    {
      prompt: "넷째 문장이 드는 전환의 예시로 알맞은 것은?",
      choices: [
        { id: "A", text: "해고가 무효여도 휴직 요건을 갖추었다면 휴직으로 전환할 수 있다." },
        { id: "B", text: "해고가 무효이면 반드시 복직만 가능하고 다른 전환은 불가능하다." },
        { id: "C", text: "휴직이 무효이면 자동으로 해고로 전환되는 것이 원칙이다." },
        { id: "D", text: "해고와 휴직은 같은 법률행위이므로 전환이라고 볼 수 없다." }
      ],
      answerId: "A"
    },
    // 문장 5: 추인은 무효 원인이 사라진 상태에서 당사자가 무효임을 알면서도 다시 인정하는 절차로, 추인한 시점부터 새로운 법률행위로서 효력이 발생한다.
    {
      prompt: "다섯째 문장이 설명하는 '추인'의 효력 발생 시점으로 알맞은 것은?",
      choices: [
        { id: "A", text: "추인한 시점부터 새로운 법률행위로서 효력이 발생한다." },
        { id: "B", text: "원래 법률행위가 성립한 시점으로 소급하여 효력이 발생한다." },
        { id: "C", text: "무효 원인이 발생한 시점부터 효력이 소급 적용된다." },
        { id: "D", text: "법원이 판결을 내린 시점부터 효력이 발생한다." }
      ],
      answerId: "A"
    }
  ],
  p4: [
    // 문장 1: 법률행위가 무효가 되면 그에 따른 법적 효과도 함께 소멸하므로, 상대방은 채무 이행을 요구할 수 없다.
    {
      prompt: "첫 문장이 말하는 무효의 법적 결과로 알맞은 것은?",
      choices: [
        { id: "A", text: "무효가 되면 법적 효과도 소멸하여 채무 이행을 요구할 수 없다." },
        { id: "B", text: "무효가 되더라도 채무 이행은 별도로 계속 요구할 수 있다." },
        { id: "C", text: "무효가 되면 법적 효과는 남지만 채무만 소멸한다." },
        { id: "D", text: "무효가 되면 상대방에게 새로운 채무가 자동으로 발생한다." }
      ],
      answerId: "A"
    },
    // 문장 2: 만약 이미 이행된 채무가 있다면 이를 받은 사람은 부당이득으로서 돌려주어야 한다.
    {
      prompt: "둘째 문장이 설명하는 의무로 알맞은 것은?",
      choices: [
        { id: "A", text: "이미 이행된 채무가 있으면 받은 사람이 부당이득으로 돌려주어야 한다." },
        { id: "B", text: "이미 이행된 채무는 무효와 관계없이 돌려줄 필요가 없다." },
        { id: "C", text: "이행된 채무는 국가가 대신 반환해 주므로 개인은 신경 쓸 필요가 없다." },
        { id: "D", text: "이행된 채무가 있어도 당사자가 합의하면 반환 의무가 사라진다." }
      ],
      answerId: "A"
    },
    // 문장 3: 예를 들어 무효인 매매 계약에 따라 대금을 받은 판매자는 그 대금을 구매자에게 반환해야 한다.
    {
      prompt: "셋째 문장이 드는 예시로 알맞은 것은?",
      choices: [
        { id: "A", text: "무효인 매매 계약의 대금을 받은 판매자가 구매자에게 반환해야 한다." },
        { id: "B", text: "유효한 매매 계약이라도 판매자는 대금을 항상 돌려줘야 한다." },
        { id: "C", text: "무효인 계약이라도 대금은 판매자가 보관할 수 있다." },
        { id: "D", text: "구매자가 계약을 취소하면 판매자는 물건만 돌려주면 된다." }
      ],
      answerId: "A"
    },
    // 문장 4: 다만 부당이득의 반환을 청구할 권리에도 소멸시효가 있으므로 언제까지나 반환을 요구할 수 있는 것은 아니다.
    {
      prompt: "넷째 문장이 말하는 부당이득 반환 청구의 한계로 알맞은 것은?",
      choices: [
        { id: "A", text: "소멸시효가 있어 무한정 반환을 요구할 수 있는 것은 아니다." },
        { id: "B", text: "소멸시효가 없으므로 언제까지나 반환을 요구할 수 있다." },
        { id: "C", text: "부당이득은 반환 대상이 아니므로 청구 자체가 불가능하다." },
        { id: "D", text: "부당이득 반환은 당사자 동의 없이는 시작할 수 없다." }
      ],
      answerId: "A"
    },
    // 문장 5: 이처럼 법률행위의 무효와 취소는 일상의 법적 분쟁을 해결하는 핵심 개념으로, 어떤 상황에서 효력이 부정되는지, 어떻게 구제받을 수 있는지를 이해하는 것이 법적 사고의 출발점이 된다.
    {
      prompt: "다섯째 문장이 강조하는 핵심 요지로 알맞은 것은?",
      choices: [
        { id: "A", text: "무효와 취소 개념을 이해하는 것이 법적 사고의 출발점이 된다." },
        { id: "B", text: "법적 분쟁은 무효와 취소만으로 모두 해결할 수 있다." },
        { id: "C", text: "법적 사고의 출발점은 소멸시효를 정확히 계산하는 데 있다." },
        { id: "D", text: "일상의 법적 분쟁은 전문가 없이도 누구나 쉽게 해결할 수 있다." }
      ],
      answerId: "A"
    }
  ]
};

// 중심내용 질문
const centralQuestions = {
  p1: {
    prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "법률행위가 효력을 갖추려면 성립요건과 효력요건을 모두 충족해야 한다." },
      { id: "B", text: "법률행위는 오직 매매 계약에서만 성립요건이 문제가 된다." },
      { id: "C", text: "성립요건과 효력요건은 동일한 개념으로 구별할 필요가 없다." },
      { id: "D", text: "법률행위의 효력은 당사자의 의지와 관계없이 자동으로 결정된다." }
    ],
    answerId: "A"
  },
  p2: {
    prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "무효는 처음부터 효력이 없고, 취소는 유효한 행위를 나중에 소멸시킨다는 점에서 구별된다." },
      { id: "B", text: "무효와 취소는 동일한 개념이며 법적으로 같은 효과를 낸다." },
      { id: "C", text: "취소는 시간이 지나도 언제든 가능하므로 무효보다 강력한 효과를 가진다." },
      { id: "D", text: "무효인 법률행위만이 취소권자의 주장을 통해 효력을 잃을 수 있다." }
    ],
    answerId: "A"
  },
  p3: {
    prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "무효 행위는 전환이나 추인을 통해 다른 법률행위로서 효력을 얻을 수 있다." },
      { id: "B", text: "무효 행위는 어떤 방법으로도 구제할 수 없으므로 새로 행위를 해야 한다." },
      { id: "C", text: "전환과 추인은 유효한 법률행위에만 적용할 수 있는 방법이다." },
      { id: "D", text: "추인을 하면 원래 법률행위가 성립한 시점부터 소급하여 유효가 된다." }
    ],
    answerId: "A"
  },
  p4: {
    prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "무효 시 법적 효과가 소멸하며, 이행된 채무는 부당이득으로 반환해야 한다." },
      { id: "B", text: "무효가 되어도 기존 채무는 그대로 유지되어 이행을 계속해야 한다." },
      { id: "C", text: "부당이득 반환 청구는 소멸시효가 없으므로 영구적으로 가능하다." },
      { id: "D", text: "법률행위의 무효와 취소는 일상생활과 무관한 전문 분야의 개념이다." }
    ],
    answerId: "A"
  }
};

// intensive timeline 생성
for (const p of paragraphs) {
  const sents = splitSentences(p.text);
  const qs = questions_by_paragraph[p.id];

  // 각 문장별 step
  for (let i = 0; i < sents.length; i++) {
    const step = {
      stepId: `s${stepNum}`,
      highlight: {
        ranges: [{ paragraphId: p.id, start: sents[i].start, end: sents[i].end }]
      },
      question: {
        prompt: qs[i].prompt,
        choices: qs[i].choices,
        answerId: qs[i].answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    };
    timeline.push(step);
    stepNum++;
  }

  // 문단 중심내용 step
  const centralQ = centralQuestions[p.id];
  const centralStep = {
    stepId: `s${stepNum}`,
    highlight: {
      ranges: [{ paragraphId: p.id, start: 0, end: p.text.length }]
    },
    question: {
      prompt: centralQ.prompt,
      choices: centralQ.choices,
      answerId: centralQ.answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  };
  timeline.push(centralStep);
  stepNum++;
}

// ────────────── recall 8카드 ──────────────
const recall = {
  cards: [
    { id: "c1", text: "법률행위란 매매 계약이나 유언처럼 법적 효과를 만들어 내는 행위이다." },
    { id: "c2", text: "법률행위의 효력 발생에는 성립요건과 효력요건이 모두 필요하다." },
    { id: "c3", text: "무효는 처음부터 효력이 없고, 주장 없이도 저절로 효력이 부정된다." },
    { id: "c4", text: "취소는 유효한 행위를 취소권자가 주장하여 나중에 효력을 소멸시킨다." },
    { id: "c5", text: "취소권에는 기한이 있어 일정 기간이 지나면 유효로 확정된다." },
    { id: "c6", text: "무효 행위는 전환이나 추인을 통해 다른 법률행위로 효력을 얻을 수 있다." },
    { id: "c7", text: "추인은 무효임을 알면서 다시 인정하는 것으로, 추인 시점부터 효력이 생긴다." },
    { id: "c8", text: "무효 시 이행된 채무는 부당이득으로 반환해야 하나 소멸시효가 존재한다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// ────────────── confirm 질문 (5~10문항) ──────────────
// answerText를 본문에서 indexOf로 찾아 answerRanges 계산

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
    prompt: "법률행위가 효력을 발생시키기 위해 갖추어야 하는 두 가지 요건은 무엇인가?",
    answerText: "성립요건과 효력요건",
    answerMatchMode: "ALL"
  },
  {
    id: "q2",
    prompt: "별도의 주장 없이도 처음부터 효력이 없는 법률행위의 상태를 무엇이라 하는가?",
    answerText: "무효",
    answerMatchMode: "ANY"
  },
  {
    id: "q3",
    prompt: "유효한 법률행위를 나중에 효력 없게 만드는 권리를 가진 사람이 행사하는 것을 무엇이라 하는가?",
    answerText: "취소",
    answerMatchMode: "ANY"
  },
  {
    id: "q4",
    prompt: "무효인 법률행위가 다른 법률행위의 요건을 갖추었을 때 그 행위로 효력을 인정하는 방법을 무엇이라 하는가?",
    answerText: "전환",
    answerMatchMode: "ANY"
  },
  {
    id: "q5",
    prompt: "무효 원인이 사라진 뒤 당사자가 다시 인정하여 새로운 효력을 발생시키는 절차를 무엇이라 하는가?",
    answerText: "추인",
    answerMatchMode: "ANY"
  },
  {
    id: "q6",
    prompt: "법률행위가 무효가 된 뒤 이미 이행된 채무를 받은 사람이 돌려주어야 하는 것을 무엇이라 하는가?",
    answerText: "부당이득",
    answerMatchMode: "ANY"
  },
  {
    id: "q7",
    prompt: "부당이득의 반환을 청구할 권리가 일정 기간 후 소멸하는 제도를 무엇이라 하는가?",
    answerText: "소멸시효",
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
  contentId: "dr-r3-001",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 3) Day 1 비문학",
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
    passage: {
      format: "TEXT",
      paragraphs
    },
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

// ranges 유효성 검증
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
const outPath = 'frontend/public/daily-reading/russell3/001.json';
fs.writeFileSync(outPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\n파일 저장: ${outPath}`);

// 배치 파일 업데이트
const batchPath = 'generated/daily-batch-reading-russell3.json';
if (fs.existsSync(batchPath)) {
  const data = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  data.items[0] = {
    content_type: "DAILY_READING",
    level_id: "RUSSELL_3",
    area: "READING",
    sub_area: "NONFICTION",
    day_index: 1,
    module_key: "reading_training",
    schema_version: "1.0",
    content: content
  };
  fs.writeFileSync(batchPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`배치 파일 업데이트: ${batchPath}`);
} else {
  console.log("배치 파일 없음, 건너뜀");
}
