// Day 5: 비문학 (NONFICTION) - '식물이 빛을 이용하는 방법'
// 기출 '식물 광합성' 핵심 개념 차용, 중1~중2 수준 재구성, 1100자 ±50

const fs = require('fs');
const path = require('path');

const p1 = '식물은 스스로 양분을 만들어 살아가는 생물이다. 사람이나 동물은 음식을 먹어야 에너지를 얻지만, 식물은 햇빛을 이용하여 필요한 양분을 직접 만든다. 이처럼 빛의 에너지로 양분을 합성하는 과정을 광합성이라고 한다. 광합성은 식물의 잎에서 주로 일어나는데, 잎 속에는 엽록체라는 아주 작은 구조물이 들어 있다. 엽록체 안에는 엽록소라는 초록색 색소가 있어서 식물의 잎이 초록색으로 보이는 것이다. 엽록소는 햇빛 에너지를 흡수하여 광합성의 출발점이 되는 중요한 역할을 한다.';
const p2 = '광합성이 일어나려면 햇빛 외에도 물과 이산화 탄소가 필요하다. 식물은 뿌리를 통해 땅속의 물을 빨아들이고, 잎 뒷면에 있는 기공이라는 작은 구멍으로 공기 중의 이산화 탄소를 흡수한다. 엽록체는 햇빛 에너지를 이용하여 물과 이산화 탄소를 포도당으로 바꾸는데, 이 포도당이 식물의 성장에 필요한 양분이 된다. 이 과정에서 산소가 함께 만들어지며, 만들어진 산소는 기공을 통해 공기 중으로 내보내진다. 우리가 숨을 쉴 때 들이마시는 산소의 상당 부분이 식물의 광합성을 통해 만들어진 것이다.';
const p3 = '그런데 기공은 이산화 탄소를 들이마시는 동시에 식물 안의 수분도 밖으로 내보낸다. 날씨가 매우 덥거나 건조하면 수분이 지나치게 빠져나갈 위험이 있으므로 식물은 기공을 닫아 버린다. 기공이 닫히면 이산화 탄소를 흡수하지 못하게 되어 광합성이 원활하게 이루어지지 않는다. 이 때문에 너무 덥고 건조한 환경에서는 식물이 충분한 양분을 만들지 못해 잘 자라지 못하는 경우가 생긴다. 대표적인 식량 작물인 쌀이나 밀도 이런 이유로 고온 건조한 기후에서 수확량이 줄어들 수 있다.';
const p4 = '그러나 모든 식물이 이런 어려움을 겪는 것은 아니다. 옥수수나 사탕수수처럼 뜨거운 열대 지방에서도 잘 자라는 식물은 특별한 방법으로 광합성을 한다. 이 식물들은 잎 안에 이산화 탄소를 미리 저장해 두는 별도의 공간을 가지고 있다. 기공이 열려 있을 때 이산화 탄소를 최대한 모아 저장한 뒤, 기공이 닫혀도 저장해 둔 이산화 탄소를 이용하여 광합성을 계속할 수 있다. 덕분에 이 식물들은 같은 양의 빛을 받아도 일반 식물보다 훨씬 효율적으로 양분을 만들어 낸다. 과학자들은 이런 식물의 원리를 연구하여 미래 식량 문제를 해결하는 데 활용하고자 노력하고 있다.';

const totalLen = p1.length + p2.length + p3.length + p4.length;
console.log('총 길이:', totalLen);

function splitSentences(text) {
  const result = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i + 1 >= text.length || text[i+1] === ' ')) {
      result.push([start, i + 1]);
      start = i + 2;
    }
  }
  if (start < text.length) result.push([start, text.length]);
  return result;
}

const p1s = splitSentences(p1);
const p2s = splitSentences(p2);
const p3s = splitSentences(p3);
const p4s = splitSentences(p4);

console.log('p1 문장:', p1s.length, '길이:', p1.length);
console.log('p2 문장:', p2s.length, '길이:', p2.length);
console.log('p3 문장:', p3s.length, '길이:', p3.length);
console.log('p4 문장:', p4s.length, '길이:', p4.length);

const scoring = { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true };

// 정독 질문들
const questions = [
  // p1 (6문장 + 1중심 = 7)
  { prompt: "식물이 다른 생물과 다른 점으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "스스로 양분을 만들어 살아간다." },
      { id: "B", text: "다른 동물의 먹이를 빼앗아 살아간다." },
      { id: "C", text: "물속에서만 살 수 있다." },
      { id: "D", text: "밤에만 활동하며 낮에는 쉰다." }
    ], answerId: "A" },
  { prompt: "사람이나 동물과 비교한 식물의 에너지 획득 방법으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "햇빛을 이용하여 필요한 양분을 직접 만든다." },
      { id: "B", text: "다른 식물의 양분을 흡수하여 에너지를 얻는다." },
      { id: "C", text: "바람의 힘을 이용하여 양분을 만든다." },
      { id: "D", text: "동물처럼 음식을 먹어서 에너지를 얻는다." }
    ], answerId: "A" },
  { prompt: "광합성이 주로 일어나는 장소로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "식물의 잎에서 주로 일어난다." },
      { id: "B", text: "식물의 뿌리에서 주로 일어난다." },
      { id: "C", text: "식물의 줄기에서만 일어난다." },
      { id: "D", text: "식물의 꽃에서 주로 일어난다." }
    ], answerId: "A" },
  { prompt: "잎 속 엽록체에 대한 설명으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "잎 속에 들어 있는 아주 작은 구조물이다." },
      { id: "B", text: "잎의 바깥쪽을 감싸고 있는 껍질이다." },
      { id: "C", text: "뿌리에서 물을 올려보내는 통로이다." },
      { id: "D", text: "꽃가루를 만들어 내는 기관이다." }
    ], answerId: "A" },
  { prompt: "식물의 잎이 초록색으로 보이는 까닭으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "엽록체 안에 엽록소라는 초록색 색소가 있기 때문이다." },
      { id: "B", text: "잎이 항상 물에 젖어 있기 때문이다." },
      { id: "C", text: "햇빛이 잎을 통과하면서 초록빛으로 변하기 때문이다." },
      { id: "D", text: "잎 위에 초록색 먼지가 쌓이기 때문이다." }
    ], answerId: "A" },
  { prompt: "엽록소의 역할로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "햇빛 에너지를 흡수하여 광합성의 출발점이 된다." },
      { id: "B", text: "물을 뿌리로 내려보내는 역할을 한다." },
      { id: "C", text: "산소를 저장하는 역할을 한다." },
      { id: "D", text: "잎을 단단하게 보호하는 역할을 한다." }
    ], answerId: "A" },
  // p1 중심
  { prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "식물은 잎 속 엽록체의 엽록소를 통해 햇빛을 흡수하여 광합성을 한다." },
      { id: "B", text: "식물의 뿌리가 땅속에서 양분을 흡수하는 원리이다." },
      { id: "C", text: "사람과 동물이 음식을 먹는 이유를 설명한다." },
      { id: "D", text: "엽록체가 초록색인 이유만을 설명한다." }
    ], answerId: "A" },

  // p2 (5문장 + 1중심 = 6)
  { prompt: "광합성에 필요한 재료로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "햇빛 외에 물과 이산화 탄소가 필요하다." },
      { id: "B", text: "햇빛과 산소만 있으면 된다." },
      { id: "C", text: "물과 질소만 있으면 된다." },
      { id: "D", text: "흙과 비료가 필요하다." }
    ], answerId: "A" },
  { prompt: "식물이 물과 이산화 탄소를 얻는 방법으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "뿌리로 물을 빨아들이고 잎의 기공으로 이산화 탄소를 흡수한다." },
      { id: "B", text: "잎으로 물을 빨아들이고 뿌리로 이산화 탄소를 흡수한다." },
      { id: "C", text: "줄기를 통해 물과 이산화 탄소를 동시에 흡수한다." },
      { id: "D", text: "꽃잎을 통해 공기 중에서 물을 흡수한다." }
    ], answerId: "A" },
  { prompt: "광합성의 결과로 만들어지는 양분은 무엇인가요?",
    choices: [
      { id: "A", text: "포도당이 만들어지며 이것이 성장에 필요한 양분이 된다." },
      { id: "B", text: "단백질이 만들어져 식물의 근육을 형성한다." },
      { id: "C", text: "지방이 만들어져 열매 속에 저장된다." },
      { id: "D", text: "비타민이 만들어져 잎을 단단하게 한다." }
    ], answerId: "A" },
  { prompt: "광합성 과정에서 함께 만들어지는 기체는 무엇인가요?",
    choices: [
      { id: "A", text: "산소가 함께 만들어지며 기공을 통해 내보내진다." },
      { id: "B", text: "이산화 탄소가 만들어져 공기 중으로 배출된다." },
      { id: "C", text: "수소가 만들어져 잎 속에 저장된다." },
      { id: "D", text: "질소가 만들어져 뿌리로 내려간다." }
    ], answerId: "A" },
  { prompt: "우리가 들이마시는 산소에 대한 설명으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "상당 부분이 식물의 광합성을 통해 만들어진 것이다." },
      { id: "B", text: "바닷물이 증발하면서 만들어진 것이다." },
      { id: "C", text: "동물의 호흡을 통해 만들어진 것이다." },
      { id: "D", text: "화산 활동으로 땅속에서 나온 것이다." }
    ], answerId: "A" },
  // p2 중심
  { prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "물과 이산화 탄소를 재료로 포도당과 산소를 만드는 광합성의 과정이다." },
      { id: "B", text: "기공이 열리고 닫히는 원리를 설명하는 것이다." },
      { id: "C", text: "뿌리가 물을 흡수하는 구체적인 방법이다." },
      { id: "D", text: "산소가 공기 중에 퍼지는 과정이다." }
    ], answerId: "A" },

  // p3 (5문장 + 1중심 = 6)
  { prompt: "기공이 이산화 탄소를 들이마실 때 함께 일어나는 일로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "식물 안의 수분도 밖으로 내보내진다." },
      { id: "B", text: "식물이 양분을 뿌리로 내려보낸다." },
      { id: "C", text: "엽록소가 햇빛을 차단하게 된다." },
      { id: "D", text: "잎이 더 크게 자라난다." }
    ], answerId: "A" },
  { prompt: "날씨가 매우 덥거나 건조할 때 식물이 하는 행동으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "수분이 빠져나가지 않도록 기공을 닫아 버린다." },
      { id: "B", text: "기공을 더 크게 열어 바람을 들여보낸다." },
      { id: "C", text: "뿌리를 땅 위로 올려 수분을 모은다." },
      { id: "D", text: "잎을 떨어뜨려 무게를 줄인다." }
    ], answerId: "A" },
  { prompt: "기공이 닫히면 생기는 문제로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "이산화 탄소를 흡수하지 못해 광합성이 원활하지 않다." },
      { id: "B", text: "산소를 흡수하지 못해 뿌리가 썩는다." },
      { id: "C", text: "물이 넘쳐서 잎이 무거워진다." },
      { id: "D", text: "햇빛을 차단하여 잎이 노랗게 변한다." }
    ], answerId: "A" },
  { prompt: "너무 덥고 건조한 환경에서 식물에 나타나는 결과로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "충분한 양분을 만들지 못해 잘 자라지 못한다." },
      { id: "B", text: "오히려 더 빠르게 자라서 열매가 많이 열린다." },
      { id: "C", text: "잎이 더 크고 두꺼워져서 튼튼해진다." },
      { id: "D", text: "뿌리가 더 깊이 뻗어 물을 찾아낸다." }
    ], answerId: "A" },
  { prompt: "고온 건조한 기후에서 수확량이 줄어들 수 있는 작물의 예로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "대표적인 식량 작물인 쌀이나 밀이다." },
      { id: "B", text: "옥수수와 사탕수수이다." },
      { id: "C", text: "감자와 고구마이다." },
      { id: "D", text: "사과와 포도 같은 과일이다." }
    ], answerId: "A" },
  // p3 중심
  { prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "더운 날씨에 기공이 닫히면 광합성이 어려워져 식물의 성장이 방해된다." },
      { id: "B", text: "식물은 기공을 통해 항상 산소를 흡수하고 있다." },
      { id: "C", text: "기공은 날씨와 상관없이 항상 열려 있다." },
      { id: "D", text: "건조한 환경에서 식물은 오히려 잘 자란다." }
    ], answerId: "A" },

  // p4 (6문장 + 1중심 = 7)
  { prompt: "모든 식물이 더운 환경에서 어려움을 겪는지에 대한 설명으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "모든 식물이 겪는 것은 아니며 일부는 특별한 방법을 사용한다." },
      { id: "B", text: "모든 식물이 동일하게 더위에 약하다." },
      { id: "C", text: "열대 식물은 광합성을 하지 않으므로 영향이 없다." },
      { id: "D", text: "더운 환경에 사는 식물은 양분이 필요 없다." }
    ], answerId: "A" },
  { prompt: "옥수수나 사탕수수 같은 식물의 특징으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "특별한 방법으로 광합성을 하여 뜨거운 곳에서도 잘 자란다." },
      { id: "B", text: "광합성 대신 뿌리로 양분을 흡수하여 자란다." },
      { id: "C", text: "기공이 없어서 수분 손실이 전혀 없다." },
      { id: "D", text: "밤에만 광합성을 해서 더위를 피한다." }
    ], answerId: "A" },
  { prompt: "이 특별한 식물이 가진 구조적 특징으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "잎 안에 이산화 탄소를 미리 저장해 두는 별도의 공간이 있다." },
      { id: "B", text: "잎 대신 줄기에서 광합성을 한다." },
      { id: "C", text: "기공이 잎 앞면에만 있어서 수분 손실이 적다." },
      { id: "D", text: "뿌리가 공기 중으로 뻗어 이산화 탄소를 흡수한다." }
    ], answerId: "A" },
  { prompt: "이 식물이 기공이 닫혀도 광합성을 계속할 수 있는 비결로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "미리 저장해 둔 이산화 탄소를 이용하기 때문이다." },
      { id: "B", text: "산소를 이산화 탄소로 바꿀 수 있기 때문이다." },
      { id: "C", text: "물만으로도 광합성이 가능하기 때문이다." },
      { id: "D", text: "기공이 닫혀도 저절로 다시 열리기 때문이다." }
    ], answerId: "A" },
  { prompt: "이 식물의 광합성 효율에 대한 설명으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "같은 양의 빛으로 일반 식물보다 훨씬 효율적으로 양분을 만든다." },
      { id: "B", text: "일반 식물보다 양분을 적게 만들지만 오래 살 수 있다." },
      { id: "C", text: "빛이 없어도 양분을 만들 수 있다." },
      { id: "D", text: "일반 식물과 효율이 같다." }
    ], answerId: "A" },
  { prompt: "과학자들이 이 식물의 원리를 연구하는 목적으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "미래 식량 문제를 해결하는 데 활용하고자 한다." },
      { id: "B", text: "식물의 색깔을 바꾸는 방법을 개발하고자 한다." },
      { id: "C", text: "동물에게도 광합성 능력을 주고자 한다." },
      { id: "D", text: "열대 지방의 기온을 낮추고자 한다." }
    ], answerId: "A" },
  // p4 중심
  { prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "일부 식물은 이산화 탄소를 저장하는 특별한 구조로 더운 환경에서도 효율적으로 광합성한다." },
      { id: "B", text: "옥수수와 사탕수수는 광합성을 하지 않는 식물이다." },
      { id: "C", text: "과학자들이 식물 대신 인공 양분을 만드는 방법을 연구하고 있다." },
      { id: "D", text: "열대 지방에서는 모든 식물이 잘 자랄 수 있다." }
    ], answerId: "A" },
];

// 타임라인 빌드
const timelineFinal = [];
let stepNum = 1;

function buildTimeline(pId, sentences, text, startQIdx) {
  let qIdx = startQIdx;
  for (let i = 0; i < sentences.length; i++) {
    const [s, e] = sentences[i];
    timelineFinal.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: pId, start: s, end: e }] },
      question: { ...questions[qIdx++], scoring }
    });
  }
  // 중심내용
  timelineFinal.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: pId, start: 0, end: text.length }] },
    question: { ...questions[qIdx++], scoring }
  });
  return qIdx;
}

let qIdx = 0;
qIdx = buildTimeline('p1', p1s, p1, qIdx);
qIdx = buildTimeline('p2', p2s, p2, qIdx);
qIdx = buildTimeline('p3', p3s, p3, qIdx);
qIdx = buildTimeline('p4', p4s, p4, qIdx);

console.log('타임라인 스텝:', timelineFinal.length);
console.log('사용된 질문:', qIdx, '/ 준비된 질문:', questions.length);

// recall 8카드
const recall = {
  cards: [
    { id: "c1", text: "식물은 햇빛을 이용한 광합성으로 양분을 스스로 만드는 생물이다." },
    { id: "c2", text: "잎 속 엽록체의 엽록소가 햇빛 에너지를 흡수한다." },
    { id: "c3", text: "뿌리로 물을, 기공으로 이산화 탄소를 흡수하여 포도당과 산소를 만든다." },
    { id: "c4", text: "만들어진 산소는 기공을 통해 공기 중으로 내보내진다." },
    { id: "c5", text: "더운 날에는 수분 보호를 위해 기공을 닫아 광합성이 어려워진다." },
    { id: "c6", text: "기공이 닫히면 이산화 탄소 부족으로 양분을 만들지 못한다." },
    { id: "c7", text: "옥수수 등 열대 식물은 이산화 탄소를 저장하는 별도 공간이 있다." },
    { id: "c8", text: "과학자들은 이 원리를 연구하여 미래 식량 문제 해결에 활용하려 한다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// confirm 7문항
function findRange(pId, text, keyword) {
  const idx = text.indexOf(keyword);
  if (idx === -1) throw new Error(`keyword not found: "${keyword}" in ${pId}`);
  return { paragraphId: pId, start: idx, end: idx + keyword.length };
}

const confirmQuestions = [
  {
    id: "q1",
    prompt: "식물이 햇빛을 이용하여 양분을 만드는 과정을 가리키는 말은 무엇인가요?",
    answerText: "광합성",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p1", p1, "광합성")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q2",
    prompt: "잎 속에서 햇빛 에너지를 흡수하는 초록색 색소의 이름은 무엇인가요?",
    answerText: "엽록소",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p1", p1, "엽록소")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q3",
    prompt: "잎 뒷면에서 이산화 탄소를 흡수하는 작은 구멍의 이름은 무엇인가요?",
    answerText: "기공",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p2", p2, "기공")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q4",
    prompt: "광합성의 결과로 만들어지는 식물의 양분은 무엇인가요?",
    answerText: "포도당",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p2", p2, "포도당")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q5",
    prompt: "날씨가 매우 덥거나 건조할 때 식물이 지나치게 잃을 수 있는 것은 무엇인가요?",
    answerText: "수분",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p3", p3, "수분")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q6",
    prompt: "뜨거운 열대 지방에서도 잘 자라는 식물의 예로 나온 작물은 무엇인가요?",
    answerText: "옥수수",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p4", p4, "옥수수")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q7",
    prompt: "과학자들이 특별한 식물의 원리를 연구하여 해결하려는 문제는 무엇인가요?",
    answerText: "식량 문제",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p4", p4, "식량 문제")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  }
];

const content = {
  contentId: "dr-r1-005",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 1) Day 5 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_1",
  schoolGradeRange: { min: 7, max: 8 },
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
      paragraphs: [
        { id: "p1", text: p1 },
        { id: "p2", text: p2 },
        { id: "p3", text: p3 },
        { id: "p4", text: p4 }
      ]
    },
    intensive: { timeline: timelineFinal },
    recall,
    confirm: { questions: confirmQuestions }
  }
};

// 검증
console.log('\n=== 검증 ===');
console.log('지문 길이:', totalLen, totalLen >= 1050 && totalLen <= 1150 ? 'OK' : 'FAIL');
console.log('recall 카드:', recall.cards.length, recall.cards.length === 8 ? 'OK' : 'FAIL');
console.log('confirm 문항:', confirmQuestions.length, confirmQuestions.length >= 5 ? 'OK' : 'FAIL');
console.log('intensive 스텝:', timelineFinal.length);

// answerRanges 검증
const texts = { p1, p2, p3, p4 };
confirmQuestions.forEach(q => {
  q.answerRanges.forEach(r => {
    const text = texts[r.paragraphId];
    const found = text.substring(r.start, r.end);
    console.log(`  ${q.id}: "${found}" vs "${q.answerText}" ${found === q.answerText ? 'OK' : 'MISMATCH'}`);
  });
});

// JSON 출력
const outPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell1', '005.json');
fs.writeFileSync(outPath, JSON.stringify(content, null, 2), 'utf8');
console.log('\n파일 저장:', outPath);
