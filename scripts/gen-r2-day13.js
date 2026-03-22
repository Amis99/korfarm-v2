// 러셀2 Day 13 비문학 - 일일독해 콘텐츠 생성
const fs = require('fs');
const path = require('path');

// ── 지문 (비문학: 기후 변화와 탄소 순환) ──
const p1 = "지구의 대기에는 이산화 탄소, 메테인, 수증기 등 온실 가스가 존재한다. 온실 가스는 태양 복사 에너지가 지표면에 닿아 열로 바뀐 뒤 다시 우주로 빠져나가는 것을 일부 차단하여, 지구의 평균 기온을 생물이 살기에 적합한 수준으로 유지시킨다. 이 현상을 온실 효과라 한다. 온실 효과가 없다면 지구의 평균 기온은 현재보다 약 33도 낮은 영하 18도 정도여서 대부분의 생물이 살아남기 어려울 것이다. 그러나 산업 혁명 이후 화석 연료의 대량 사용과 삼림 벌채 등으로 대기 중 이산화 탄소 농도가 급격히 높아지면서, 온실 효과가 과도하게 강화되는 문제가 발생하였다.";
const p2 = "탄소 순환은 탄소가 대기·바다·토양·생물 사이를 이동하는 자연적 과정을 말한다. 식물은 광합성을 통해 대기 중 이산화 탄소를 흡수하고, 동물은 호흡을 통해 이산화 탄소를 다시 대기로 내보낸다. 바다 역시 대기의 이산화 탄소를 녹여 흡수하며, 화산 폭발이나 토양 속 미생물의 분해 과정에서도 이산화 탄소가 방출된다. 이처럼 탄소는 다양한 경로를 통해 끊임없이 순환하고 있으며, 자연 상태에서는 흡수량과 방출량이 대체로 균형을 이루어 대기 중 이산화 탄소 농도가 안정적으로 유지되어 왔다.";
const p3 = "문제는 인간 활동이 이 균형을 무너뜨렸다는 데 있다. 석탄, 석유, 천연가스 같은 화석 연료를 태우면 수억 년 동안 땅속에 갇혀 있던 탄소가 한꺼번에 대기로 방출된다. 여기에 삼림 벌채까지 더해져, 이산화 탄소를 흡수해 주던 숲의 면적이 줄어들고 있다. 그 결과 대기 중 이산화 탄소 농도는 산업 혁명 이전의 약 280ppm에서 현재 420ppm을 넘어섰으며, 지구 평균 기온도 약 1.1도 상승하였다. 이에 따라 극지방의 빙하가 녹고, 해수면이 상승하며, 폭염·홍수·가뭄 같은 극단적 기상 현상이 잦아지는 등 기후 변화의 영향이 갈수록 뚜렷해지고 있다.";
const p4 = "기후 변화에 대응하기 위한 노력은 크게 두 방향으로 진행된다. 하나는 온실 가스 배출을 줄이는 완화 전략이다. 재생 에너지 확대, 에너지 효율 향상, 대중교통 이용 촉진 등이 여기에 해당하며, 개인 차원에서도 일상 속 에너지 절약이 중요하다. 다른 하나는 이미 진행 중인 기후 변화에 적응하는 전략이다. 해안가의 방파제를 높이거나, 가뭄에 강한 품종을 개발하거나, 조기 경보 시스템을 갖추는 것이 그 예이다. 두 전략은 서로 보완적이어서, 배출을 줄이되 동시에 변화에 대비하는 것이 가장 효과적인 대응이라 할 수 있다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
  { id: "p4", text: p4 }
];

const totalLen = p1.length + p2.length + p3.length + p4.length;
console.log(`지문 총 글자 수: ${totalLen}`);
console.log(`p1: ${p1.length}, p2: ${p2.length}, p3: ${p3.length}, p4: ${p4.length}`);

function fi(text, keyword) {
  const i = text.indexOf(keyword);
  if (i === -1) throw new Error(`"${keyword}" not found`);
  return { start: i, end: i + keyword.length };
}

// ── 정독 타임라인 ──
const timeline = [
  {
    stepId: "s1",
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: fi(p1, "존재한다.").end }] },
    question: {
      prompt: "첫 문장에서 지구 대기에 존재한다고 한 물질로 알맞은 것은?",
      choices: [
        { id: "A", text: "이산화 탄소, 메테인, 수증기 등 온실 가스이다." },
        { id: "B", text: "산소, 질소, 헬륨 등 비활성 가스이다." },
        { id: "C", text: "오존, 네온, 아르곤 등 희귀 가스이다." },
        { id: "D", text: "수소, 암모니아, 황 등 유독 가스이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s2",
    highlight: { ranges: [{ paragraphId: "p1", start: fi(p1, "온실 가스는").start, end: fi(p1, "유지시킨다.").end }] },
    question: {
      prompt: "온실 가스가 지구 기온을 유지시키는 원리로 알맞은 것은?",
      choices: [
        { id: "A", text: "지표면 열이 우주로 빠져나가는 것을 일부 차단한다." },
        { id: "B", text: "태양 복사 에너지가 지표면에 닿지 못하게 막는다." },
        { id: "C", text: "대기 중 산소를 열로 변환하여 기온을 높인다." },
        { id: "D", text: "지구 내부 마그마의 열을 대기로 전달한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s3",
    highlight: { ranges: [{ paragraphId: "p1", start: fi(p1, "온실 효과가 없다면").start, end: fi(p1, "것이다.").end }] },
    question: {
      prompt: "온실 효과가 없을 때 지구 평균 기온으로 제시된 값은?",
      choices: [
        { id: "A", text: "현재보다 약 33도 낮은 영하 18도 정도이다." },
        { id: "B", text: "현재보다 약 10도 높은 영상 25도 정도이다." },
        { id: "C", text: "현재와 같은 약 15도이다." },
        { id: "D", text: "현재보다 약 50도 낮은 영하 35도 정도이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s4",
    highlight: { ranges: [{ paragraphId: "p1", start: fi(p1, "그러나 산업 혁명").start, end: fi(p1, "발생하였다.").end }] },
    question: {
      prompt: "산업 혁명 이후 온실 효과가 과도해진 원인으로 알맞은 것은?",
      choices: [
        { id: "A", text: "화석 연료의 대량 사용과 삼림 벌채 등이다." },
        { id: "B", text: "화산 폭발과 지진이 급증한 것이다." },
        { id: "C", text: "바다가 이산화 탄소를 과다 흡수한 것이다." },
        { id: "D", text: "식물의 광합성이 지나치게 활발해진 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s5",
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: p1.length }] },
    question: {
      prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "온실 효과는 지구 기온 유지에 필수적이나, 인간 활동으로 과도해지고 있다." },
        { id: "B", text: "온실 효과는 해로울 뿐이므로 완전히 없애야 한다." },
        { id: "C", text: "온실 가스는 대기에 존재하지 않으며 인위적으로만 만들어진다." },
        { id: "D", text: "산업 혁명은 온실 가스 감소에 기여하였다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s6",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: fi(p2, "말한다.").end }] },
    question: {
      prompt: "탄소 순환의 정의로 알맞은 것은?",
      choices: [
        { id: "A", text: "탄소가 대기·바다·토양·생물 사이를 이동하는 자연적 과정이다." },
        { id: "B", text: "탄소가 대기에만 머무르며 다른 곳으로 이동하지 않는 현상이다." },
        { id: "C", text: "인간이 화석 연료를 태워 탄소를 생산하는 과정이다." },
        { id: "D", text: "식물이 탄소를 영구적으로 저장하는 과정이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s7",
    highlight: { ranges: [{ paragraphId: "p2", start: fi(p2, "식물은 광합성을").start, end: fi(p2, "내보낸다.").end }] },
    question: {
      prompt: "식물과 동물의 탄소 이동 방식으로 알맞은 것은?",
      choices: [
        { id: "A", text: "식물은 광합성으로 흡수하고, 동물은 호흡으로 방출한다." },
        { id: "B", text: "식물과 동물 모두 호흡으로 탄소를 흡수한다." },
        { id: "C", text: "식물은 탄소를 방출하고, 동물은 광합성으로 흡수한다." },
        { id: "D", text: "식물과 동물 모두 탄소와 무관하다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s8",
    highlight: { ranges: [{ paragraphId: "p2", start: fi(p2, "바다 역시").start, end: fi(p2, "방출된다.").end }] },
    question: {
      prompt: "바다와 화산 등이 탄소 순환에서 하는 역할로 알맞은 것은?",
      choices: [
        { id: "A", text: "바다는 이산화 탄소를 흡수하고, 화산·미생물은 이산화 탄소를 방출한다." },
        { id: "B", text: "바다와 화산 모두 이산화 탄소를 흡수만 한다." },
        { id: "C", text: "바다는 이산화 탄소를 방출하고, 화산은 흡수한다." },
        { id: "D", text: "바다와 화산은 탄소 순환에 관여하지 않는다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s9",
    highlight: { ranges: [{ paragraphId: "p2", start: fi(p2, "이처럼 탄소는").start, end: fi(p2, "왔다.").end }] },
    question: {
      prompt: "자연 상태에서 탄소 순환의 특징으로 알맞은 것은?",
      choices: [
        { id: "A", text: "흡수량과 방출량이 대체로 균형을 이루어 농도가 안정적이었다." },
        { id: "B", text: "방출량이 항상 흡수량보다 많아 농도가 꾸준히 높아졌다." },
        { id: "C", text: "흡수량이 항상 방출량보다 많아 이산화 탄소가 사라져 갔다." },
        { id: "D", text: "탄소 순환은 일정한 패턴 없이 무작위로 이루어졌다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s10",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: p2.length }] },
    question: {
      prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "탄소는 대기·바다·토양·생물 사이를 순환하며, 자연 상태에서는 균형이 유지된다." },
        { id: "B", text: "탄소 순환은 인간이 만든 인위적 과정이다." },
        { id: "C", text: "탄소는 한 번 방출되면 다시 흡수되지 않는다." },
        { id: "D", text: "바다는 탄소 순환에 전혀 관여하지 않는다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s11",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: fi(p3, "방출된다.").end }] },
    question: {
      prompt: "화석 연료를 태울 때 탄소가 방출되는 원리로 알맞은 것은?",
      choices: [
        { id: "A", text: "수억 년 동안 땅속에 갇혀 있던 탄소가 한꺼번에 대기로 방출된다." },
        { id: "B", text: "대기 중 탄소가 땅속으로 흡수된다." },
        { id: "C", text: "화석 연료가 탄소를 분해하여 산소로 바꾼다." },
        { id: "D", text: "화석 연료를 태우면 탄소가 사라진다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s12",
    highlight: { ranges: [{ paragraphId: "p3", start: fi(p3, "그 결과").start, end: fi(p3, "상승하였다.").end }] },
    question: {
      prompt: "산업 혁명 전후 이산화 탄소 농도와 기온 변화로 알맞은 것은?",
      choices: [
        { id: "A", text: "약 280ppm에서 420ppm 이상으로 높아졌고, 기온은 약 1.1도 상승했다." },
        { id: "B", text: "약 420ppm에서 280ppm으로 낮아졌고, 기온은 약 1.1도 하강했다." },
        { id: "C", text: "농도와 기온 모두 변하지 않았다." },
        { id: "D", text: "약 100ppm에서 150ppm으로 소폭 올랐고, 기온은 변화 없다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s13",
    highlight: { ranges: [{ paragraphId: "p3", start: fi(p3, "이에 따라").start, end: fi(p3, "있다.").end }] },
    question: {
      prompt: "기후 변화로 나타나는 구체적 현상으로 알맞은 것은?",
      choices: [
        { id: "A", text: "빙하 녹음, 해수면 상승, 폭염·홍수·가뭄 등 극단적 기상 현상 증가이다." },
        { id: "B", text: "기온이 낮아져 빙하가 늘어나고 해수면이 하강하고 있다." },
        { id: "C", text: "기후가 안정되어 자연재해가 거의 사라지고 있다." },
        { id: "D", text: "대기 중 이산화 탄소가 줄어들어 광합성이 감소하고 있다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s14",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: p3.length }] },
    question: {
      prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "인간 활동이 탄소 순환의 균형을 깨뜨려 기후 변화를 일으키고 있다." },
        { id: "B", text: "자연적 탄소 순환이 강화되어 기후가 안정되고 있다." },
        { id: "C", text: "삼림 벌채가 이산화 탄소 농도를 낮추는 데 기여한다." },
        { id: "D", text: "화석 연료 사용은 탄소 순환에 아무 영향을 주지 않는다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s15",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: fi(p4, "완화 전략이다.").end }] },
    question: {
      prompt: "기후 변화 대응의 첫 번째 방향으로 제시된 것은?",
      choices: [
        { id: "A", text: "온실 가스 배출을 줄이는 완화 전략이다." },
        { id: "B", text: "기후 변화를 무시하고 현 상태를 유지하는 것이다." },
        { id: "C", text: "화석 연료 사용을 더 늘리는 것이다." },
        { id: "D", text: "온실 가스를 인위적으로 증가시키는 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s16",
    highlight: { ranges: [{ paragraphId: "p4", start: fi(p4, "재생 에너지").start, end: fi(p4, "중요하다.").end }] },
    question: {
      prompt: "완화 전략의 구체적 예로 알맞은 것은?",
      choices: [
        { id: "A", text: "재생 에너지 확대, 에너지 효율 향상, 대중교통 이용 촉진이다." },
        { id: "B", text: "방파제 건설, 가뭄 품종 개발, 조기 경보 시스템이다." },
        { id: "C", text: "화석 연료 사용 확대와 삼림 벌채이다." },
        { id: "D", text: "이산화 탄소를 인위적으로 대기에 주입하는 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s17",
    highlight: { ranges: [{ paragraphId: "p4", start: fi(p4, "다른 하나는").start, end: fi(p4, "예이다.").end }] },
    question: {
      prompt: "적응 전략의 구체적 예로 알맞은 것은?",
      choices: [
        { id: "A", text: "방파제 높이기, 가뭄에 강한 품종 개발, 조기 경보 시스템 구축이다." },
        { id: "B", text: "재생 에너지 확대와 대중교통 이용 촉진이다." },
        { id: "C", text: "삼림 벌채를 늘리는 것이다." },
        { id: "D", text: "화석 연료 사용량을 늘리는 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s18",
    highlight: { ranges: [{ paragraphId: "p4", start: fi(p4, "두 전략은").start, end: fi(p4, "있다.").end }] },
    question: {
      prompt: "두 전략의 관계에 대해 글쓴이가 제시하는 견해로 알맞은 것은?",
      choices: [
        { id: "A", text: "서로 보완적이어서 배출을 줄이면서 동시에 변화에 대비하는 것이 가장 효과적이다." },
        { id: "B", text: "두 전략은 서로 모순되어 하나만 선택해야 한다." },
        { id: "C", text: "완화 전략만으로 충분하므로 적응 전략은 불필요하다." },
        { id: "D", text: "적응 전략만으로 충분하므로 완화 전략은 불필요하다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s19",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: p4.length }] },
    question: {
      prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "기후 변화 대응은 완화와 적응 두 방향으로 진행되며, 둘은 서로 보완적이다." },
        { id: "B", text: "기후 변화 대응은 오직 완화 전략 한 가지만 존재한다." },
        { id: "C", text: "기후 변화에 대응할 방법은 현재 존재하지 않는다." },
        { id: "D", text: "적응 전략은 완화 전략을 완전히 대체할 수 있다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  }
];

// ── 복기 카드 (8장) ──
const recall = {
  cards: [
    { id: "c1", text: "온실 가스는 지표면 열이 우주로 빠져나가는 것을 차단하여 지구 기온을 유지한다." },
    { id: "c2", text: "산업 혁명 이후 화석 연료 사용과 삼림 벌채로 온실 효과가 과도해졌다." },
    { id: "c3", text: "탄소 순환은 탄소가 대기·바다·토양·생물 사이를 이동하는 자연적 과정이다." },
    { id: "c4", text: "자연 상태에서는 흡수량과 방출량이 균형을 이루어 농도가 안정적이었다." },
    { id: "c5", text: "인간 활동이 균형을 깨뜨려 이산화 탄소 농도가 280ppm에서 420ppm 이상으로 올랐다." },
    { id: "c6", text: "빙하 녹음, 해수면 상승, 극단적 기상 현상 등 기후 변화가 뚜렷해지고 있다." },
    { id: "c7", text: "완화 전략은 재생 에너지·효율 향상 등으로 배출을 줄이는 것이다." },
    { id: "c8", text: "적응 전략은 방파제·가뭄 품종·경보 시스템 등으로 변화에 대비하는 것이다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// ── 확인 문항 (7문항) ──
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "지문에서 '온실 효과'라는 표현을 첫째 문단에서 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p1", ...fi(p1, "온실 효과라") , end: fi(p1, "온실 효과라").start + 5 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "지문에서 '탄소 순환'이라는 표현을 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p2", start: fi(p2, "탄소 순환은").start, end: fi(p2, "탄소 순환은").start + 5 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "지문에서 '화석 연료'라는 표현을 셋째 문단에서 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p3", start: fi(p3, "화석 연료를").start, end: fi(p3, "화석 연료를").start + 5 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "지문에서 산업 혁명 이전 이산화 탄소 농도인 '280ppm'을 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p3", ...fi(p3, "280ppm") }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "지문에서 '완화 전략'이라는 표현을 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p4", ...fi(p4, "완화 전략") }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "지문에서 '재생 에너지'라는 표현을 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p4", ...fi(p4, "재생 에너지") }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "지문에서 '조기 경보 시스템'이라는 표현을 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p4", ...fi(p4, "조기 경보 시스템") }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ]
};

const content = {
  contentId: "dr-r2-013",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 2) Day 13 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_2",
  schoolGradeRange: { min: 8, max: 9 },
  area: "READING",
  subArea: "NONFICTION",
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

// 검증
function verifyRanges(content) {
  const pMap = {};
  for (const p of content.payload.passage.paragraphs) pMap[p.id] = p.text;
  let errors = 0;
  for (const q of content.payload.confirm.questions) {
    for (const r of q.answerRanges) {
      const text = pMap[r.paragraphId];
      if (!text) { console.error(`없는 문단: ${r.paragraphId}`); errors++; continue; }
      const slice = text.substring(r.start, r.end);
      console.log(`[확인 ${q.id}] [${r.start}:${r.end}] = "${slice}"`);
    }
  }
  for (const step of content.payload.intensive.timeline) {
    for (const r of step.highlight.ranges) {
      const text = pMap[r.paragraphId];
      if (r.end > text.length) { console.error(`[정독 ${step.stepId}] 범위 초과: ${r.end} > ${text.length}`); errors++; }
    }
  }
  if (errors === 0) console.log('\n모든 범위 검증 통과');
  else console.error(`\n${errors}개 오류`);
  return errors;
}

const errs = verifyRanges(content);

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell2');
fs.writeFileSync(path.join(staticDir, '013.json'), JSON.stringify(content, null, 2), 'utf8');
console.log('static 파일 생성: 013.json');

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell2.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const batchItem = {
  content_type: "DAILY_READING", level_id: "RUSSELL_2", area: "READING",
  sub_area: "NONFICTION", day_index: 13, module_key: "reading_training",
  schema_version: "1.0", content
};
const idx = batch.items.findIndex(i => i.day_index === 13 && i.level_id === "RUSSELL_2");
if (idx >= 0) { batch.items[idx] = batchItem; console.log('배치 Day 13 교체'); }
else { batch.items.push(batchItem); console.log('배치 Day 13 추가'); }
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log('배치 파일 갱신');

if (errs > 0) process.exit(1);
