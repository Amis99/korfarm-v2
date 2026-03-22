const fs = require('fs');
const path = require('path');

// ─── 1. 지문 정의 (문학 - 소설) ───
const paragraphs = [
  {
    id: "p1",
    text: "가을 햇살이 교실 창문을 통해 비스듬히 들어오던 날, 수아는 미술 시간에 그린 자기 그림을 물끄러미 바라보고 있었다.종이 위에는 노란 은행나무 한 그루가 서 있었는데, 나뭇잎을 칠하다 물감이 번져 울퉁불퉁한 얼룩이 되어 버렸다.수아는 한숨을 쉬며 그림을 구기려 했지만, 옆자리의 지호가 '잠깐만' 하고 말렸다.지호는 수아의 그림을 가만히 들여다보더니, 번진 물감이 마치 바람에 흩날리는 낙엽 같다고 말했다.수아는 고개를 갸웃하며 다시 그림을 보았고, 정말 그렇게 보이기 시작하자 얼굴에 작은 미소가 번졌다.그때 미술 선생님이 다가와 두 사람의 이야기를 듣고는, 실수에서 아름다움을 찾는 눈이 훌륭하다며 칭찬해 주셨다."
  },
  {
    id: "p2",
    text: "다음 주, 학교 복도에 미술 작품 전시회가 열렸다.수아는 자기 그림이 걸릴 줄 몰랐는데, 선생님이 수아의 은행나무 그림을 전시작으로 골라 주셨던 것이다.쉬는 시간마다 복도를 지나는 아이들이 그림 앞에서 발걸음을 멈추었다.한 친구는 노란 얼룩이 햇빛에 반짝이는 강물 같다고 했고, 다른 친구는 가을바람이 느껴진다고 했다.수아는 같은 그림인데도 보는 사람마다 다른 이야기를 떠올린다는 사실이 신기했다.전시회 마지막 날, 수아는 그림 옆에 작은 메모를 붙였다."
  },
  {
    id: "p3",
    text: "메모에는 이렇게 적혀 있었다. '이 그림은 실수로 번진 물감에서 시작되었습니다.처음에는 망쳤다고 생각했지만, 친구가 다른 눈으로 봐 주었고, 저도 그림 속에서 새로운 모습을 발견했습니다.완벽하지 않아도 괜찮다는 것을 이 그림이 알려 주었습니다.'메모를 읽은 아이들은 고개를 끄덕이며 저마다 자기도 비슷한 경험이 있다고 이야기했다.지호는 수아의 메모를 읽고 나서, 자기도 다음에는 실수를 두려워하지 않겠다고 웃으며 말했다.교실로 돌아가는 길에 수아는 창밖의 은행나무를 올려다보았는데, 노란 잎이 바람에 흩날리는 모습이 자기 그림과 꼭 닮아 있었다."
  }
];

// ─── 2. 유틸리티 ───
function findRange(pid, search) {
  const p = paragraphs.find(x => x.id === pid);
  if (!p) throw new Error(`Paragraph ${pid} not found`);
  const s = p.text.indexOf(search);
  if (s === -1) throw new Error(`"${search}" not found in ${pid}`);
  return { paragraphId: pid, start: s, end: s + search.length };
}

function sentenceRanges(pid) {
  const p = paragraphs.find(x => x.id === pid);
  const text = p.text;
  const ranges = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && i + 1 <= text.length) {
      ranges.push({ paragraphId: pid, start, end: i + 1 });
      start = i + 1;
    }
  }
  if (start < text.length) {
    ranges.push({ paragraphId: pid, start, end: text.length });
  }
  return ranges;
}

// ─── 3. intensive timeline ───
const timeline = [];
let stepNum = 1;

// p1
const p1Sentences = sentenceRanges("p1");
const p1Questions = [
  {
    prompt: "첫 문장에서 수아는 어떤 상황에 있나요?",
    choices: [
      { id: "A", text: "미술 시간에 그린 자기 그림을 바라보고 있었다" },
      { id: "B", text: "국어 시간에 작문을 하고 있었다" },
      { id: "C", text: "운동장에서 달리기를 하고 있었다" },
      { id: "D", text: "도서관에서 책을 읽고 있었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 그림에 생긴 문제는 무엇인가요?",
    choices: [
      { id: "A", text: "물감이 번져 울퉁불퉁한 얼룩이 되어 버렸다" },
      { id: "B", text: "종이가 찢어져 그림이 반으로 나뉘었다" },
      { id: "C", text: "다른 친구가 그림 위에 낙서를 했다" },
      { id: "D", text: "물감이 모자라 색을 칠하지 못했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 지호가 수아를 말린 이유는 무엇인가요?",
    choices: [
      { id: "A", text: "수아가 그림을 구기려 하자 '잠깐만' 하고 말렸다" },
      { id: "B", text: "수아가 교실에서 나가려 하자 말렸다" },
      { id: "C", text: "수아가 울려고 하자 말렸다" },
      { id: "D", text: "수아가 물감을 더 칠하려 하자 말렸다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 지호는 번진 물감을 무엇에 비유했나요?",
    choices: [
      { id: "A", text: "바람에 흩날리는 낙엽 같다고 했다" },
      { id: "B", text: "비 오는 날의 구름 같다고 했다" },
      { id: "C", text: "깨진 유리 조각 같다고 했다" },
      { id: "D", text: "쏟아진 우유 같다고 했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 수아의 반응은 어떠했나요?",
    choices: [
      { id: "A", text: "다시 그림을 보고 그렇게 보이기 시작하자 미소가 번졌다" },
      { id: "B", text: "여전히 마음에 들지 않아 그림을 찢었다" },
      { id: "C", text: "지호의 말에 화를 냈다" },
      { id: "D", text: "그림을 처음부터 다시 그리기 시작했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 미술 선생님이 칭찬한 것은 무엇인가요?",
    choices: [
      { id: "A", text: "실수에서 아름다움을 찾는 눈이 훌륭하다고 칭찬했다" },
      { id: "B", text: "물감을 아끼지 않고 많이 쓴 점을 칭찬했다" },
      { id: "C", text: "그림을 빨리 완성한 점을 칭찬했다" },
      { id: "D", text: "색을 정확하게 칠한 점을 칭찬했다" }
    ],
    answerId: "A"
  }
];

p1Sentences.forEach((range, i) => {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [range] },
    question: {
      prompt: p1Questions[i].prompt,
      choices: p1Questions[i].choices,
      answerId: p1Questions[i].answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
});

// p1 중심내용
timeline.push({
  stepId: `s${stepNum}`,
  highlight: { ranges: [{ paragraphId: "p1", start: 0, end: paragraphs[0].text.length }] },
  question: {
    prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "물감이 번진 실수를 지호의 시선으로 새롭게 바라보게 된 수아의 이야기이다" },
      { id: "B", text: "수아가 완벽한 그림을 그려 상을 받는 이야기이다" },
      { id: "C", text: "지호가 수아의 그림을 대신 고쳐 주는 이야기이다" },
      { id: "D", text: "미술 선생님이 수아에게 다시 그리라고 한 이야기이다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});
stepNum++;

// p2
const p2Sentences = sentenceRanges("p2");
const p2Questions = [
  {
    prompt: "첫 문장에서 학교에 어떤 행사가 열렸나요?",
    choices: [
      { id: "A", text: "학교 복도에 미술 작품 전시회가 열렸다" },
      { id: "B", text: "운동장에서 체육 대회가 열렸다" },
      { id: "C", text: "강당에서 음악 발표회가 열렸다" },
      { id: "D", text: "교실에서 독서 감상문 대회가 열렸다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 수아의 그림이 전시된 까닭은 무엇인가요?",
    choices: [
      { id: "A", text: "선생님이 수아의 은행나무 그림을 전시작으로 골라 주셨다" },
      { id: "B", text: "수아가 스스로 신청하여 전시하게 되었다" },
      { id: "C", text: "반 친구들이 투표로 뽑아 주었다" },
      { id: "D", text: "지호가 선생님 모르게 걸어 두었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 아이들의 반응은 어떠했나요?",
    choices: [
      { id: "A", text: "쉬는 시간마다 그림 앞에서 발걸음을 멈추었다" },
      { id: "B", text: "아무도 관심을 갖지 않고 지나갔다" },
      { id: "C", text: "그림을 보고 웃으며 놀렸다" },
      { id: "D", text: "그림이 무섭다며 피했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 친구들이 그림을 보고 떠올린 것은 각각 무엇인가요?",
    choices: [
      { id: "A", text: "햇빛에 반짝이는 강물과 가을바람을 떠올렸다" },
      { id: "B", text: "봄꽃과 여름 바다를 떠올렸다" },
      { id: "C", text: "겨울 눈과 크리스마스를 떠올렸다" },
      { id: "D", text: "아무것도 떠올리지 못하고 고개를 저었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 수아가 신기하게 느낀 것은 무엇인가요?",
    choices: [
      { id: "A", text: "같은 그림인데 보는 사람마다 다른 이야기를 떠올린다는 사실이다" },
      { id: "B", text: "그림의 물감이 저절로 마르지 않는다는 사실이다" },
      { id: "C", text: "아무도 그림의 실수를 알아차리지 못한다는 사실이다" },
      { id: "D", text: "자기 그림이 전시된다는 사실 자체만 신기했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 수아가 한 일은 무엇인가요?",
    choices: [
      { id: "A", text: "전시회 마지막 날 그림 옆에 작은 메모를 붙였다" },
      { id: "B", text: "전시회 마지막 날 그림을 떼어 갔다" },
      { id: "C", text: "그림 위에 새로운 색을 덧칠했다" },
      { id: "D", text: "다른 친구의 그림 옆으로 옮겼다" }
    ],
    answerId: "A"
  }
];

p2Sentences.forEach((range, i) => {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [range] },
    question: {
      prompt: p2Questions[i].prompt,
      choices: p2Questions[i].choices,
      answerId: p2Questions[i].answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
});

// p2 중심내용
timeline.push({
  stepId: `s${stepNum}`,
  highlight: { ranges: [{ paragraphId: "p2", start: 0, end: paragraphs[1].text.length }] },
  question: {
    prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "전시된 그림을 보며 각자 다른 이야기를 떠올리는 친구들과 수아의 감동이다" },
      { id: "B", text: "수아가 전시회에서 상금을 받는 이야기이다" },
      { id: "C", text: "선생님이 다른 학생의 그림으로 교체하는 이야기이다" },
      { id: "D", text: "전시회가 취소되어 수아가 슬퍼하는 이야기이다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});
stepNum++;

// p3
const p3Sentences = sentenceRanges("p3");
const p3Questions = [
  {
    prompt: "첫 문장은 메모에 무엇이 적혀 있었다고 하나요?",
    choices: [
      { id: "A", text: "메모에 이렇게 적혀 있었다고 소개한다" },
      { id: "B", text: "메모에 아무 내용도 없었다고 한다" },
      { id: "C", text: "메모에 그림 제목만 적혀 있었다고 한다" },
      { id: "D", text: "메모에 가격이 적혀 있었다고 한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 수아가 처음에 그림을 어떻게 생각했다고 적었나요?",
    choices: [
      { id: "A", text: "실수로 번진 물감에서 시작되어 처음에는 망쳤다고 생각했다" },
      { id: "B", text: "처음부터 마음에 들어 완벽하다고 생각했다" },
      { id: "C", text: "일부러 번지게 했다고 적었다" },
      { id: "D", text: "다른 사람의 그림을 따라 그렸다고 적었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 수아가 발견한 것은 무엇인가요?",
    choices: [
      { id: "A", text: "친구가 다른 눈으로 봐 주어 그림 속에서 새로운 모습을 발견했다" },
      { id: "B", text: "그림을 고쳐 원래 의도대로 완성했다" },
      { id: "C", text: "그림이 저절로 색이 변했다" },
      { id: "D", text: "선생님이 대신 고쳐 주셨다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 수아가 그림을 통해 깨달은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "완벽하지 않아도 괜찮다는 것을 깨달았다" },
      { id: "B", text: "다음에는 절대 실수하지 말아야 한다는 것을 깨달았다" },
      { id: "C", text: "미술을 그만두어야 한다는 것을 깨달았다" },
      { id: "D", text: "그림은 항상 계획대로 그려야 한다는 것을 깨달았다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 메모를 읽은 아이들의 반응은 어떠했나요?",
    choices: [
      { id: "A", text: "고개를 끄덕이며 자기도 비슷한 경험이 있다고 이야기했다" },
      { id: "B", text: "메모를 읽지 않고 그냥 지나갔다" },
      { id: "C", text: "메모가 이상하다며 웃었다" },
      { id: "D", text: "메모를 떼어 버렸다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 지호가 한 말은 무엇인가요?",
    choices: [
      { id: "A", text: "자기도 다음에는 실수를 두려워하지 않겠다고 말했다" },
      { id: "B", text: "수아에게 그림을 달라고 말했다" },
      { id: "C", text: "자기가 더 잘 그릴 수 있다고 말했다" },
      { id: "D", text: "메모를 쓸 필요가 없었다고 말했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "마지막 문장에서 수아가 창밖에서 본 것은 무엇인가요?",
    choices: [
      { id: "A", text: "노란 잎이 바람에 흩날리는 은행나무가 자기 그림과 닮아 있었다" },
      { id: "B", text: "비가 내리고 있어 은행나무가 보이지 않았다" },
      { id: "C", text: "은행나무 잎이 모두 져서 가지만 남아 있었다" },
      { id: "D", text: "소나무가 푸르게 서 있었다" }
    ],
    answerId: "A"
  }
];

p3Sentences.forEach((range, i) => {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [range] },
    question: {
      prompt: p3Questions[i].prompt,
      choices: p3Questions[i].choices,
      answerId: p3Questions[i].answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
});

// p3 중심내용
timeline.push({
  stepId: `s${stepNum}`,
  highlight: { ranges: [{ paragraphId: "p3", start: 0, end: paragraphs[2].text.length }] },
  question: {
    prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "실수에서 출발한 그림이 완벽하지 않아도 괜찮다는 깨달음을 나누어 준다" },
      { id: "B", text: "수아가 미술 대회에서 우승하여 상을 받는다" },
      { id: "C", text: "지호가 수아 대신 메모를 써서 붙인다" },
      { id: "D", text: "전시회가 끝난 뒤 그림을 모두 버린다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});

// ─── 4. recall (8카드) ───
const recall = {
  cards: [
    { id: "c1", text: "수아는 미술 시간에 은행나무를 그렸으나 물감이 번져 얼룩이 되었다." },
    { id: "c2", text: "지호는 번진 물감이 바람에 흩날리는 낙엽 같다고 말해 수아에게 미소를 찾아 주었다." },
    { id: "c3", text: "미술 선생님은 실수에서 아름다움을 찾는 눈이 훌륭하다고 칭찬하셨다." },
    { id: "c4", text: "선생님이 수아의 그림을 전시작으로 골라 학교 복도에 전시했다." },
    { id: "c5", text: "친구들은 같은 그림에서 강물, 가을바람 등 각자 다른 이야기를 떠올렸다." },
    { id: "c6", text: "수아는 메모에 실수로 시작된 그림이 완벽하지 않아도 괜찮다는 깨달음을 적었다." },
    { id: "c7", text: "지호는 메모를 읽고 자기도 실수를 두려워하지 않겠다고 말했다." },
    { id: "c8", text: "수아는 창밖의 은행나무가 자기 그림과 닮아 있는 것을 발견했다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// ─── 5. confirm (7개) ───
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "수아가 미술 시간에 그린 나무는 무슨 나무인가요?",
      answerText: "은행나무",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "노란 은행나무 한 그루가 서 있었는데")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "지호는 번진 물감을 무엇에 비유했나요?",
      answerText: "바람에 흩날리는 낙엽",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "바람에 흩날리는 낙엽 같다고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "미술 선생님이 훌륭하다고 칭찬한 것은 무엇인가요?",
      answerText: "실수에서 아름다움을 찾는 눈",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "실수에서 아름다움을 찾는 눈이 훌륭하다며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "한 친구가 노란 얼룩을 보고 떠올린 것은 무엇인가요?",
      answerText: "햇빛에 반짝이는 강물",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "햇빛에 반짝이는 강물 같다고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "수아가 메모에 적은 깨달음은 무엇인가요?",
      answerText: "완벽하지 않아도 괜찮다",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "완벽하지 않아도 괜찮다는 것을")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "지호가 메모를 읽고 한 다짐은 무엇인가요?",
      answerText: "실수를 두려워하지 않겠다",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "실수를 두려워하지 않겠다고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "수아가 창밖에서 본 은행나무의 모습은 어떠했나요?",
      answerText: "노란 잎이 바람에 흩날렸다",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "노란 잎이 바람에 흩날리는 모습이 자기 그림과 꼭 닮아 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

// ─── 6. 콘텐츠 조립 ───
const content = {
  contentId: "dr-f3-016",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(프레게 3) Day 16 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "FREGE_3",
  schoolGradeRange: { min: 6, max: 7 },
  area: "READING",
  subArea: "LITERATURE",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 5, multiplier: 1 },
  timeLimitSec: 480,
  assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall,
    confirm
  }
};

// ─── 7. 배치 파일 업데이트 ───
const batchPath = path.join('C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지\\generated\\daily-batch-reading-frege3.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[15] = {
  content_type: "DAILY_READING",
  level_id: "FREGE_3",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 16,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');

// ─── 8. static 파일 ───
const staticPath = path.join('C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지\\frontend\\public\\daily-reading\\frege3', '016.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log('Day 16 완료! 지문 길이:', totalLen, '자');
console.log('intensive steps:', timeline.length);
console.log('recall cards:', recall.cards.length);
console.log('confirm questions:', confirm.questions.length);
