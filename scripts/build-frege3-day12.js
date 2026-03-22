const fs = require('fs');

// === 프레게3 Day 12 (LITERATURE, 1000자 ±50) ===
const DAY = 12;
const LEVEL = 'frege3';
const LEVEL_ID = 'FREGE_3';
const CONTENT_ID = `dr-f3-${String(DAY).padStart(3,'0')}`;
const SUB_AREA = 'LITERATURE';
const AREA_KR = '문학';
const TITLE = `일일 독해(프레게 3) Day ${DAY} ${AREA_KR}`;

const paragraphs = [
  {
    id: "p1",
    text: "할머니의 장독대 앞에는 낡은 나무 의자가 하나 놓여 있었다. 페인트가 벗겨져 맨살이 드러난 그 의자는 비바람에도 꿋꿋이 제자리를 지켰다. 어린 시절 나는 그 의자에 앉아 할머니가 된장을 젓는 모습을 지켜보곤 했다. 할머니의 팔은 나무 주걱과 하나가 된 듯 느리고 일정하게 원을 그렸다. 할머니는 장을 저을 때마다 혼잣말처럼 중얼거렸는데, 그것은 장맛이 좋아지라는 기원이기도 했고 돌아가신 할아버지에게 보내는 안부이기도 했다. 나는 그 중얼거림이 무서워서 가끔 귀를 막았지만, 할머니의 손이 내 머리를 쓰다듬으면 금세 안심이 되었다."
  },
  {
    id: "p2",
    text: "어느 여름, 갑작스러운 폭우로 장독 하나가 깨졌다. 새벽부터 쏟아진 비가 마당을 온통 물바다로 만들었고, 독에서 흘러나온 간장이 빗물과 뒤섞여 흙빛 강을 이루었다. 할머니는 쏟아진 간장을 아무 말 없이 바라보더니 조용히 깨진 조각을 주워 담았다. 그날 저녁 할머니는 평소보다 오래 부엌에 서 계셨다. 나는 할머니의 눈가가 젖어 있는 것을 보았지만 모른 척했다. 다음 날 아침, 할머니는 새 독에 소금물을 붓고 다시 장을 담그기 시작했다. 할머니는 잃어버린 것을 슬퍼하되 오래 머무르지 않는 사람이었다."
  },
  {
    id: "p3",
    text: "지금 나는 도시의 아파트에서 마트에서 산 된장을 먹는다. 편리하지만 어딘가 허전한 맛이다. 할머니의 된장에는 시간과 정성, 그리고 기다림이 들어 있었다. 계절이 바뀔 때마다 독을 열어 살피고, 햇살 좋은 날에는 뚜껑을 열어 바람을 쐬어 주던 그 과정 자체가 맛의 일부였다. 그렇게 일 년 넘게 익힌 된장에서는 볕 냄새와 바람 냄새가 은은하게 배어 나왔다. 나는 문득 할머니의 나무 의자가 아직 그 자리에 있을지 궁금해진다. 돌아갈 수 없는 시간 속에서 장독대의 기억만이 짠하게 남아 있다."
  }
];

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log('지문 길이:', totalLen);

function findRange(pid, search) {
  const p = paragraphs.find(x => x.id === pid);
  const s = p.text.indexOf(search);
  if (s === -1) throw new Error(`"${search}" not found in ${pid}: "${p.text}"`);
  return { paragraphId: pid, start: s, end: s + search.length };
}

function paraRange(pid) {
  const p = paragraphs.find(x => x.id === pid);
  return { paragraphId: pid, start: 0, end: p.text.length };
}

// === 정독 타임라인 ===
const timeline = [];
let stepN = 1;

// p1 문장별
const p1sents = [
  "할머니의 장독대 앞에는 낡은 나무 의자가 하나 놓여 있었다.",
  "페인트가 벗겨져 맨살이 드러난 그 의자는 비바람에도 꿋꿋이 제자리를 지켰다.",
  "어린 시절 나는 그 의자에 앉아 할머니가 된장을 젓는 모습을 지켜보곤 했다.",
  "할머니의 팔은 나무 주걱과 하나가 된 듯 느리고 일정하게 원을 그렸다.",
  "할머니는 장을 저을 때마다 혼잣말처럼 중얼거렸는데, 그것은 장맛이 좋아지라는 기원이기도 했고 돌아가신 할아버지에게 보내는 안부이기도 했다.",
  "나는 그 중얼거림이 무서워서 가끔 귀를 막았지만, 할머니의 손이 내 머리를 쓰다듬으면 금세 안심이 되었다."
];

const p1questions = [
  {
    prompt: "장독대 앞에 놓인 물건은 무엇의 역할을 했나요?",
    choices: [
      { id: "A", text: "글쓴이가 할머니를 관찰하는 자리였다" },
      { id: "B", text: "할머니가 장독을 운반하는 도구였다" },
      { id: "C", text: "비바람을 막아 주는 지붕 구실을 했다" },
      { id: "D", text: "할아버지가 생전에 쉬던 정원 벤치였다" }
    ],
    answerId: "A"
  },
  {
    prompt: "나무 의자의 외관 묘사에서 알 수 있는 것은?",
    choices: [
      { id: "A", text: "오랜 세월을 견뎌 온 물건이라는 점" },
      { id: "B", text: "최근에 새로 구입한 가구라는 점" },
      { id: "C", text: "할머니가 직접 깎아 만든 것이라는 점" },
      { id: "D", text: "실내에서만 사용하던 것이라는 점" }
    ],
    answerId: "A"
  },
  {
    prompt: "글쓴이는 의자에 앉아 주로 무엇을 했나요?",
    choices: [
      { id: "A", text: "할머니가 된장 젓는 모습을 지켜보았다" },
      { id: "B", text: "숙제를 하며 시간을 보냈다" },
      { id: "C", text: "할아버지와 이야기를 나누었다" },
      { id: "D", text: "동네 친구들과 놀이를 했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "할머니가 장을 젓는 동작의 특징은?",
    choices: [
      { id: "A", text: "느리고 일정한 원을 그리는 동작이었다" },
      { id: "B", text: "빠르고 힘차게 휘젓는 모습이었다" },
      { id: "C", text: "멈추었다 시작하기를 반복했다" },
      { id: "D", text: "양손을 번갈아 쓰며 저었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "할머니가 장을 저으며 중얼거린 내용은 어떤 성격이었나요?",
    choices: [
      { id: "A", text: "이웃에게 전할 안부 인사를 연습한 것이다" },
      { id: "B", text: "장맛이 잘 들기를 바라는 마음과 고인에 대한 그리움이 섞인 것이다" },
      { id: "C", text: "된장 담그는 방법을 자식에게 가르치는 것이다" },
      { id: "D", text: "혼자 사는 외로움을 이웃에게 하소연하는 것이다" }
    ],
    answerId: "B"
  },
  {
    prompt: "글쓴이는 할머니의 중얼거림에 어떤 반응을 보였나요?",
    choices: [
      { id: "A", text: "호기심이 생겨 뜻을 물어보았다" },
      { id: "B", text: "무섭게 느꼈지만 할머니의 손길에 안심했다" },
      { id: "C", text: "함께 따라 하며 즐거워했다" },
      { id: "D", text: "이해할 수 없어 다른 곳으로 떠났다" }
    ],
    answerId: "B"
  }
];

// p1 문장별 하이라이트 + 질문
p1sents.forEach((sent, i) => {
  timeline.push({
    stepId: `s${stepN++}`,
    highlight: { ranges: [findRange("p1", sent)] },
    question: {
      prompt: p1questions[i]?.prompt || `이 문장에서 알 수 있는 내용은 무엇인가요?`,
      choices: p1questions[i]?.choices || [
        { id: "A", text: "할머니와의 추억이 담긴 장면이다" },
        { id: "B", text: "장독대에서 일하는 이웃의 모습이다" },
        { id: "C", text: "도시 생활의 편리함을 말하고 있다" },
        { id: "D", text: "새로운 요리법을 설명하고 있다" }
      ],
      answerId: p1questions[i]?.answerId || "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
});

// p1 문단 전체 중심내용
timeline.push({
  stepId: `s${stepN++}`,
  highlight: { ranges: [paraRange("p1")] },
  question: {
    prompt: "첫째 문단의 중심 내용으로 가장 적절한 것은?",
    choices: [
      { id: "A", text: "장독대 앞 의자에서 할머니의 장 담그기를 지켜보던 어린 날의 기억" },
      { id: "B", text: "할머니가 된장 사업으로 성공한 과정을 회고하는 장면" },
      { id: "C", text: "장독대를 새로 만드는 기술을 자세히 설명하는 내용" },
      { id: "D", text: "할아버지와 할머니의 갈등이 드러나는 대목" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});

// p2 문장별
const p2sents = [
  "어느 여름, 갑작스러운 폭우로 장독 하나가 깨졌다.",
  "새벽부터 쏟아진 비가 마당을 온통 물바다로 만들었고, 독에서 흘러나온 간장이 빗물과 뒤섞여 흙빛 강을 이루었다.",
  "할머니는 쏟아진 간장을 아무 말 없이 바라보더니 조용히 깨진 조각을 주워 담았다.",
  "그날 저녁 할머니는 평소보다 오래 부엌에 서 계셨다.",
  "나는 할머니의 눈가가 젖어 있는 것을 보았지만 모른 척했다.",
  "다음 날 아침, 할머니는 새 독에 소금물을 붓고 다시 장을 담그기 시작했다.",
  "할머니는 잃어버린 것을 슬퍼하되 오래 머무르지 않는 사람이었다."
];

const p2questions = [
  {
    prompt: "폭우로 인해 장독대에 어떤 일이 벌어졌나요?",
    choices: [
      { id: "A", text: "장독 하나가 깨져 간장이 쏟아졌다" },
      { id: "B", text: "빗물이 들어가 장맛이 변했다" },
      { id: "C", text: "장독대 지붕이 무너져 독이 묻혔다" },
      { id: "D", text: "할머니가 비를 맞아 아프게 되었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "쏟아진 간장과 빗물이 만들어 낸 장면은 어떤 분위기를 주나요?",
    choices: [
      { id: "A", text: "오랜 정성이 한순간에 사라지는 안타까운 분위기" },
      { id: "B", text: "비 오는 날의 낭만적이고 평화로운 분위기" },
      { id: "C", text: "마당에 물놀이를 할 수 있는 즐거운 분위기" },
      { id: "D", text: "자연재해에 대한 공포와 긴장의 분위기" }
    ],
    answerId: "A"
  },
  {
    prompt: "쏟아진 간장 앞에서 할머니의 태도는 어떠했나요?",
    choices: [
      { id: "A", text: "크게 화를 내며 누군가를 탓했다" },
      { id: "B", text: "말없이 깨진 조각을 조용히 수습했다" },
      { id: "C", text: "즉시 이웃을 불러 도움을 요청했다" },
      { id: "D", text: "간장을 다시 독에 부으려 시도했다" }
    ],
    answerId: "B"
  },
  {
    prompt: "그날 저녁 할머니가 부엌에 오래 있었다는 것은 무엇을 짐작하게 하나요?",
    choices: [
      { id: "A", text: "새로운 요리를 개발하고 있었다는 것" },
      { id: "B", text: "잃어버린 장에 대한 아쉬움과 슬픔을 삼키고 있었다는 것" },
      { id: "C", text: "가족 모임을 위한 음식을 준비하고 있었다는 것" },
      { id: "D", text: "부엌 청소를 철저히 하고 있었다는 것" }
    ],
    answerId: "B"
  },
  {
    prompt: "글쓴이가 할머니의 젖은 눈가를 보고 모른 척한 이유로 적절한 것은?",
    choices: [
      { id: "A", text: "할머니의 감정을 건드리고 싶지 않은 어린아이의 배려심" },
      { id: "B", text: "글쓴이가 슬픔에 관심이 전혀 없었기 때문" },
      { id: "C", text: "할머니가 울지 말라고 미리 당부했기 때문" },
      { id: "D", text: "다른 일에 정신이 팔려 무심코 지나친 것" }
    ],
    answerId: "A"
  },
  {
    prompt: "다음 날 할머니의 행동에서 드러나는 성격은?",
    choices: [
      { id: "A", text: "슬픔에 오래 머물지 않고 다시 일어서는 회복력" },
      { id: "B", text: "과거를 완전히 잊고 새 출발만 강조하는 무심함" },
      { id: "C", text: "손실을 만회하려는 경쟁적인 성격" },
      { id: "D", text: "주변의 도움 없이는 움직이지 못하는 의존성" }
    ],
    answerId: "A"
  },
  {
    prompt: "마지막 문장이 문단에서 하는 역할은?",
    choices: [
      { id: "A", text: "할머니의 성품을 한 문장으로 요약하여 정리한다" },
      { id: "B", text: "다음 문단의 사건을 미리 알려 준다" },
      { id: "C", text: "글쓴이의 의견에 반대되는 근거를 제시한다" },
      { id: "D", text: "장독 깨짐의 원인을 과학적으로 분석한다" }
    ],
    answerId: "A"
  }
];

p2sents.forEach((sent, i) => {
  timeline.push({
    stepId: `s${stepN++}`,
    highlight: { ranges: [findRange("p2", sent)] },
    question: {
      prompt: p2questions[i]?.prompt || `이 문장이 전달하는 내용은?`,
      choices: p2questions[i]?.choices || [
        { id: "A", text: "할머니의 단단한 내면을 보여 준다" },
        { id: "B", text: "비 오는 날의 풍경을 묘사한다" },
        { id: "C", text: "장독대의 역사적 가치를 설명한다" },
        { id: "D", text: "글쓴이의 학교생활을 소개한다" }
      ],
      answerId: p2questions[i]?.answerId || "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
});

// p2 문단 전체
timeline.push({
  stepId: `s${stepN++}`,
  highlight: { ranges: [paraRange("p2")] },
  question: {
    prompt: "둘째 문단의 중심 내용으로 가장 적절한 것은?",
    choices: [
      { id: "A", text: "폭우로 장독이 깨졌으나 할머니가 슬픔을 딛고 다시 장을 담그는 모습" },
      { id: "B", text: "여름 폭우 피해를 줄이기 위한 장독 관리 방법 안내" },
      { id: "C", text: "할머니가 이웃과 함께 장독대를 복구하는 협력 이야기" },
      { id: "D", text: "깨진 장독을 수리하는 전통 기술에 대한 설명" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});

// p3 문장별
const p3sents = [
  "지금 나는 도시의 아파트에서 마트에서 산 된장을 먹는다.",
  "편리하지만 어딘가 허전한 맛이다.",
  "할머니의 된장에는 시간과 정성, 그리고 기다림이 들어 있었다.",
  "계절이 바뀔 때마다 독을 열어 살피고, 햇살 좋은 날에는 뚜껑을 열어 바람을 쐬어 주던 그 과정 자체가 맛의 일부였다.",
  "그렇게 일 년 넘게 익힌 된장에서는 볕 냄새와 바람 냄새가 은은하게 배어 나왔다.",
  "나는 문득 할머니의 나무 의자가 아직 그 자리에 있을지 궁금해진다.",
  "돌아갈 수 없는 시간 속에서 장독대의 기억만이 짠하게 남아 있다."
];

const p3questions = [
  {
    prompt: "현재 글쓴이의 생활은 과거와 어떻게 다른가요?",
    choices: [
      { id: "A", text: "직접 만든 된장 대신 마트에서 사 먹는 도시 생활을 한다" },
      { id: "B", text: "할머니와 함께 아파트에서 된장을 담근다" },
      { id: "C", text: "시골에서 전통 방식으로 장을 담그고 있다" },
      { id: "D", text: "된장을 전혀 먹지 않는 식생활로 바뀌었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "마트 된장의 맛이 '허전하다'는 것은 무엇이 빠졌다는 뜻인가요?",
    choices: [
      { id: "A", text: "직접 담그는 과정에 깃든 시간과 정성의 가치" },
      { id: "B", text: "비싼 재료로 만든 고급 맛" },
      { id: "C", text: "화학 첨가물의 강한 감칠맛" },
      { id: "D", text: "대량 생산으로 얻은 균일한 품질" }
    ],
    answerId: "A"
  },
  {
    prompt: "할머니의 된장 맛을 특별하게 만든 요인은 무엇인가요?",
    choices: [
      { id: "A", text: "계절마다 살피고 바람 쐬어 주는 정성 어린 과정" },
      { id: "B", text: "특별한 비법 재료를 넣은 것" },
      { id: "C", text: "오래된 독의 희귀한 재질" },
      { id: "D", text: "이웃들이 함께 만드는 공동 작업" }
    ],
    answerId: "A"
  },
  {
    prompt: "된장에서 배어 나온 냄새는 무엇을 상징하나요?",
    choices: [
      { id: "A", text: "자연 속에서 오랜 시간 정성을 들인 숙성 과정" },
      { id: "B", text: "공장에서 인공 향료를 첨가한 결과" },
      { id: "C", text: "시골 마을의 대기 오염 상태" },
      { id: "D", text: "오래되어 상한 음식의 냄새" }
    ],
    answerId: "A"
  },
  {
    prompt: "글쓴이가 나무 의자를 떠올리는 까닭은?",
    choices: [
      { id: "A", text: "할머니와의 추억이 깃든 상징적 대상이기 때문이다" },
      { id: "B", text: "그 의자가 골동품으로 값어치가 있기 때문이다" },
      { id: "C", text: "의자를 직접 만들고 싶은 취미가 있기 때문이다" },
      { id: "D", text: "이사할 때 가져오지 못한 것이 아쉽기 때문이다" }
    ],
    answerId: "A"
  },
  {
    prompt: "마지막 문장에서 느껴지는 정서는?",
    choices: [
      { id: "A", text: "돌아갈 수 없는 과거에 대한 그리움과 아련함" },
      { id: "B", text: "미래에 대한 두려움과 불안감" },
      { id: "C", text: "도시 생활에 대한 강한 불만과 분노" },
      { id: "D", text: "시골로 돌아가겠다는 굳은 결심" }
    ],
    answerId: "A"
  }
];

p3sents.forEach((sent, i) => {
  timeline.push({
    stepId: `s${stepN++}`,
    highlight: { ranges: [findRange("p3", sent)] },
    question: {
      prompt: p3questions[i]?.prompt || `이 문장의 의미는?`,
      choices: p3questions[i]?.choices || [
        { id: "A", text: "과거를 그리워하는 감정이 드러난다" },
        { id: "B", text: "현재 생활의 만족감을 표현한다" },
        { id: "C", text: "음식의 영양 성분을 분석한다" },
        { id: "D", text: "새로운 취미를 시작하려는 의지가 보인다" }
      ],
      answerId: p3questions[i]?.answerId || "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
});

// p3 문단 전체
timeline.push({
  stepId: `s${stepN++}`,
  highlight: { ranges: [paraRange("p3")] },
  question: {
    prompt: "셋째 문단의 중심 내용으로 가장 적절한 것은?",
    choices: [
      { id: "A", text: "도시 생활의 편리함 속에서 할머니의 정성 어린 된장과 추억을 그리워하는 마음" },
      { id: "B", text: "마트에서 파는 된장의 품질을 비판하는 소비자 의견" },
      { id: "C", text: "시골 생활로 돌아가겠다는 구체적 계획" },
      { id: "D", text: "전통 된장 제조법을 후대에 전수하는 교육 내용" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});

// === 복기 카드 (8장) ===
const recall = {
  cards: [
    { id: "c1", text: "장독대 앞 나무 의자에서 글쓴이는 할머니가 된장을 젓는 모습을 지켜보곤 했다." },
    { id: "c2", text: "할머니는 장을 저으며 장맛을 비는 기원과 돌아가신 할아버지를 향한 안부를 중얼거렸다." },
    { id: "c3", text: "어느 여름 폭우에 장독이 깨져 간장이 쏟아졌지만, 할머니는 조용히 깨진 조각을 수습했다." },
    { id: "c4", text: "그날 저녁 할머니의 눈가가 젖어 있었으나 글쓴이는 모른 척했다." },
    { id: "c5", text: "다음 날 할머니는 새 독에 다시 장을 담그며 슬픔에 오래 머물지 않는 모습을 보였다." },
    { id: "c6", text: "현재 글쓴이는 도시에서 마트 된장을 먹지만 할머니의 된장만큼 깊은 맛은 느끼지 못한다." },
    { id: "c7", text: "할머니의 된장에는 계절마다 살피고 바람을 쐬어 주던 정성과 기다림이 담겨 있었다." },
    { id: "c8", text: "돌아갈 수 없는 시간 속에서 장독대의 기억만이 짠하게 남아 글쓴이를 그립게 한다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// === 확인 문항 (6문항) ===
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "글쓴이가 어린 시절 할머니를 관찰하던 장소는 어디인가요?",
      answerText: "장독대 앞 나무 의자",
      answerMatchMode: "ANY",
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "할머니가 장을 저으며 중얼거린 내용에는 어떤 두 가지 의미가 있었나요?",
      answerText: "장맛을 비는 기원과 돌아가신 할아버지에 대한 안부",
      answerMatchMode: "ANY",
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "폭우로 장독이 깨진 뒤 할머니는 어떤 태도를 보였나요?",
      answerText: "말없이 깨진 조각을 주워 담고, 다음 날 다시 장을 담그기 시작했다",
      answerMatchMode: "ANY",
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "현재 글쓴이가 먹는 된장은 할머니의 된장과 비교해 어떤 차이가 있나요?",
      answerText: "편리하지만 시간과 정성이 빠져 허전한 맛이다",
      answerMatchMode: "ANY",
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "할머니의 된장 맛을 특별하게 만든 과정은 무엇이었나요?",
      answerText: "계절마다 독을 열어 살피고 햇살 좋은 날 바람을 쐬어 주는 것",
      answerMatchMode: "ANY",
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "이 글 전체에 흐르는 글쓴이의 감정은 무엇인가요?",
      answerText: "할머니와의 추억에 대한 그리움",
      answerMatchMode: "ANY",
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

// === content 조립 ===
const content = {
  contentId: CONTENT_ID,
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: TITLE,
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: LEVEL_ID,
  schoolGradeRange: { min: 6, max: 7 },
  area: "READING",
  subArea: SUB_AREA,
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 480,
  assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall,
    confirm
  }
};

// === 배치 파일 업데이트 ===
const batchPath = 'C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지\\generated\\daily-batch-reading-frege3.json';
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const itemWrapper = {
  content_type: "DAILY_READING",
  level_id: LEVEL_ID,
  area: "READING",
  sub_area: SUB_AREA,
  day_index: DAY,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
batch.items[DAY - 1] = itemWrapper;
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');

// === static 파일 ===
const staticDir = `C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지\\frontend\\public\\daily-reading\\frege3`;
const staticPath = `${staticDir}\\${String(DAY).padStart(3,'0')}.json`;
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');

console.log(`Day ${DAY} 완료: 길이=${totalLen}, steps=${timeline.length}, recall=${recall.cards.length}, confirm=${confirm.questions.length}`);
