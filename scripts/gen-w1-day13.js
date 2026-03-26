const fs = require('fs');
const path = require('path');

// Day 13: NONFICTION (비문학)
// 고1~2 수준 비문학 지문: 온실 효과와 기후 변화

const p1 = `지구는 태양으로부터 에너지를 받아 생명체가 살기에 적절한 온도를 유지하고 있다. 태양에서 오는 빛 에너지는 대기를 통과하여 지표면에 도달한 뒤, 지표면은 이를 흡수하고 다시 적외선 형태의 열에너지를 우주 공간으로 방출한다. 이때 대기 중에 존재하는 이산화 탄소, 메테인, 수증기 같은 특정 기체가 이 적외선의 일부를 흡수하여 다시 지표 쪽으로 되돌려 보낸다. 이렇게 대기가 열을 붙잡아 지구의 평균 온도를 약 15도로 유지하는 현상을 온실 효과라 한다. 이 이름은 유리 벽이 열을 가두는 온실의 원리와 비슷하다는 데서 붙여진 것이다. 만약 온실 효과가 전혀 없다면 지구의 평균 온도는 영하 18도까지 떨어져 생명체가 살기 어려운 환경이 되었을 것이다.`;

const p2 = `온실 효과 자체는 지구에 필수적인 자연 현상이지만, 문제는 인간 활동으로 인해 대기 중 온실 기체의 농도가 급격히 높아지고 있다는 점이다. 산업 혁명 이후 화석 연료의 대량 사용, 대규모 삼림 벌채, 농축산업 확대 등으로 인해 이산화 탄소와 메테인의 배출량이 크게 증가하였다. 이러한 온실 기체의 증가는 대기가 가두는 열의 총량을 점점 늘려 지구 평균 온도를 상승시키는데, 이러한 현상을 지구 온난화라 부른다. 지구 온난화는 단순히 기온만 올리는 것이 아니라 해수면 상승, 극단적 기상 현상의 빈발, 생태계 교란 등 다양한 문제를 연쇄적으로 일으키기 때문에 그 영향이 심각하다.`;

const p3 = `지구 온난화로 인한 기후 변화는 이미 전 세계적으로 관측되고 있다. 북극의 해빙 면적은 지난 수십 년간 꾸준히 감소하고 있으며, 이로 인해 북극곰 등 극지 생물의 서식지가 줄어들고 있다. 또한 해수 온도의 상승은 산호초의 백화 현상을 촉진하여 해양 생태계의 기반을 약화시킨다. 육지에서는 가뭄과 폭우, 폭염이 이전보다 빈번하고 강해지면서 농업 생산성에 직접적인 타격을 주고 있다. 일부 저지대 섬나라와 해안 도시는 해수면 상승으로 침수 위험에 처해 있어 주민들의 이주가 불가피한 상황이 되어 가고 있다. 이처럼 기후 변화의 영향은 자연환경에 그치지 않고 인간 사회의 안전과 경제에도 직결된다.`;

const p4 = `기후 변화에 대응하기 위해 국제 사회는 다양한 노력을 기울이고 있다. 2015년에 채택된 파리 협정은 지구 평균 온도 상승 폭을 산업화 이전 대비 2도 이내로 억제하고, 나아가 1.5도 이내를 목표로 하는 국제적 합의이다. 각국은 이 목표를 달성하기 위해 재생 에너지 확대, 탄소 배출권 거래제 도입, 전기차 보급 촉진 등의 정책을 시행하고 있다. 개인 차원에서도 에너지 절약, 대중교통 이용, 일회용품 줄이기 같은 작은 실천이 모이면 사회 전체적으로 의미 있는 변화를 만들 수 있다. 결국 기후 변화 문제는 과학적 이해를 바탕으로 국제적 협력과 개인적 실천이 함께 이루어져야 해결에 다가갈 수 있는 인류 공동의 과제이다.`;

const passage = {
  format: "TEXT",
  paragraphs: [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ]
};

const totalLen = p1.length + p2.length + p3.length + p4.length;
console.log(`총 글자 수: ${totalLen} (목표: 1400 ±50)`);
console.log(`p1: ${p1.length}, p2: ${p2.length}, p3: ${p3.length}, p4: ${p4.length}`);

const timeline = [
  // p1
  {
    stepId: "s1",
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: 28 }] },
    question: {
      prompt: "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "지구는 태양으로부터 에너지를 받아 적절한 온도를 유지하고 있다." },
        { id: "B", text: "지구는 태양과 관계없이 스스로 열을 생산한다." },
        { id: "C", text: "지구의 온도는 항상 일정하여 변화가 없다." },
        { id: "D", text: "태양은 지구에 에너지를 보내지 않는다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s2",
    highlight: { ranges: [{ paragraphId: "p1", start: 29, end: 91 }] },
    question: {
      prompt: "둘째 문장에서 지표면이 방출하는 에너지의 형태로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "적외선 형태의 열에너지를 우주 공간으로 방출한다." },
        { id: "B", text: "가시광선 형태의 빛을 대기 중으로 방출한다." },
        { id: "C", text: "자외선 형태의 에너지를 지하로 방출한다." },
        { id: "D", text: "에너지를 방출하지 않고 모두 흡수한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s3",
    highlight: { ranges: [{ paragraphId: "p1", start: 92, end: 157 }] },
    question: {
      prompt: "셋째 문장에서 적외선을 흡수하는 기체의 예로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "이산화 탄소, 메테인, 수증기 등이 적외선의 일부를 흡수하여 지표로 되돌려 보낸다." },
        { id: "B", text: "산소와 질소가 적외선을 흡수하여 우주로 방출한다." },
        { id: "C", text: "수소와 헬륨이 적외선을 차단한다." },
        { id: "D", text: "대기 중에 적외선을 흡수하는 기체는 존재하지 않는다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s4",
    highlight: { ranges: [{ paragraphId: "p1", start: 158, end: 215 }] },
    question: {
      prompt: "넷째 문장에서 온실 효과의 정의로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "대기가 열을 붙잡아 지구의 평균 온도를 약 15도로 유지하는 현상이다." },
        { id: "B", text: "지구가 태양 에너지를 모두 반사하는 현상이다." },
        { id: "C", text: "대기가 열을 모두 우주로 방출하는 현상이다." },
        { id: "D", text: "지구의 온도가 계속 하강하는 현상이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s5",
    highlight: { ranges: [{ paragraphId: "p1", start: 216, end: p1.length }] },
    question: {
      prompt: "마지막 문장에서 온실 효과가 없을 경우 예상되는 상황으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "평균 온도가 영하 18도까지 떨어져 생명체가 살기 어려운 환경이 된다." },
        { id: "B", text: "평균 온도가 50도 이상 올라 사막이 된다." },
        { id: "C", text: "온도에 변화가 없어 현재와 같은 환경이 유지된다." },
        { id: "D", text: "바다가 모두 증발하여 물이 사라진다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s6",
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: p1.length }] },
    question: {
      prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "온실 효과는 대기가 열을 붙잡아 지구의 적절한 온도를 유지하는 필수적 현상이다." },
        { id: "B", text: "온실 효과는 지구에 해로운 현상으로 반드시 제거해야 한다." },
        { id: "C", text: "태양 에너지는 지구에 도달하지 못하고 대기에서 모두 반사된다." },
        { id: "D", text: "지구의 평균 온도는 온실 효과와 무관하게 결정된다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p2
  {
    stepId: "s7",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: 57 }] },
    question: {
      prompt: "첫 문장에서 지적하는 문제로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "인간 활동으로 인해 대기 중 온실 기체의 농도가 급격히 높아지고 있다." },
        { id: "B", text: "온실 효과가 자연적으로 약해지고 있다." },
        { id: "C", text: "인간 활동이 온실 기체를 줄이고 있다." },
        { id: "D", text: "대기 중 온실 기체가 사라지고 있다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s8",
    highlight: { ranges: [{ paragraphId: "p2", start: 58, end: 126 }] },
    question: {
      prompt: "둘째 문장에서 온실 기체 증가의 원인으로 언급된 것은 무엇인가요?",
      choices: [
        { id: "A", text: "화석 연료의 대량 사용, 대규모 삼림 벌채, 농축산업 확대 등이다." },
        { id: "B", text: "재생 에너지의 확대와 삼림 조성이다." },
        { id: "C", text: "자연적인 화산 폭발만이 원인이다." },
        { id: "D", text: "인간 활동과는 무관한 천문학적 요인이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s9",
    highlight: { ranges: [{ paragraphId: "p2", start: 127, end: 194 }] },
    question: {
      prompt: "셋째 문장에서 지구 온난화의 정의로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "온실 기체 증가로 대기가 가두는 열이 늘어 지구 평균 온도가 상승하는 현상이다." },
        { id: "B", text: "지구의 평균 온도가 하강하는 현상이다." },
        { id: "C", text: "대기 중 온실 기체가 감소하여 온도가 변하지 않는 현상이다." },
        { id: "D", text: "태양 활동이 약해져 온도가 올라가는 현상이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s10",
    highlight: { ranges: [{ paragraphId: "p2", start: 195, end: p2.length }] },
    question: {
      prompt: "마지막 문장에서 지구 온난화가 일으키는 문제로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "해수면 상승, 극단적 기상 현상의 빈발, 생태계 교란 등 다양한 문제를 연쇄적으로 일으킨다." },
        { id: "B", text: "기온만 올리고 다른 영향은 없다." },
        { id: "C", text: "해수면이 낮아지고 기상이 안정된다." },
        { id: "D", text: "생태계가 더욱 풍부해지고 다양해진다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s11",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: p2.length }] },
    question: {
      prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "인간 활동으로 온실 기체가 급증하여 지구 온난화가 일어나고, 이는 다양한 문제를 연쇄적으로 일으킨다." },
        { id: "B", text: "온실 기체는 인간 활동과 무관하게 자연적으로만 변화한다." },
        { id: "C", text: "지구 온난화는 기온만 올리므로 큰 문제가 아니다." },
        { id: "D", text: "화석 연료 사용은 온실 기체와 관련이 없다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p3
  {
    stepId: "s12",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: 35 }] },
    question: {
      prompt: "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "지구 온난화로 인한 기후 변화가 이미 전 세계적으로 관측되고 있다." },
        { id: "B", text: "기후 변화는 아직 시작되지 않았다." },
        { id: "C", text: "기후 변화는 일부 지역에서만 나타난다." },
        { id: "D", text: "기후 변화는 과학적으로 확인되지 않았다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s13",
    highlight: { ranges: [{ paragraphId: "p3", start: 36, end: 94 }] },
    question: {
      prompt: "둘째 문장에서 북극 해빙 감소의 결과로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "북극곰 등 극지 생물의 서식지가 줄어들고 있다." },
        { id: "B", text: "북극곰의 개체 수가 증가하고 있다." },
        { id: "C", text: "북극의 얼음이 오히려 늘어나고 있다." },
        { id: "D", text: "해빙 변화는 생물에 영향을 미치지 않는다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s14",
    highlight: { ranges: [{ paragraphId: "p3", start: 95, end: 144 }] },
    question: {
      prompt: "셋째 문장에서 해수 온도 상승이 촉진하는 현상으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "산호초의 백화 현상을 촉진하여 해양 생태계의 기반을 약화시킨다." },
        { id: "B", text: "산호초가 더 활발하게 성장한다." },
        { id: "C", text: "해양 생태계가 더욱 풍요로워진다." },
        { id: "D", text: "해수 온도 상승은 해양에 영향이 없다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s15",
    highlight: { ranges: [{ paragraphId: "p3", start: 145, end: 202 }] },
    question: {
      prompt: "넷째 문장에서 기후 변화가 농업에 미치는 영향으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "가뭄, 폭우, 폭염이 빈번해지면서 농업 생산성에 직접적 타격을 주고 있다." },
        { id: "B", text: "농업 생산성이 크게 향상되고 있다." },
        { id: "C", text: "기후 변화는 농업과 관련이 없다." },
        { id: "D", text: "가뭄과 폭우가 줄어들어 농업에 유리해지고 있다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s16",
    highlight: { ranges: [{ paragraphId: "p3", start: 203, end: 264 }] },
    question: {
      prompt: "다섯째 문장에서 해수면 상승의 위험에 처한 곳으로 언급된 것은 무엇인가요?",
      choices: [
        { id: "A", text: "저지대 섬나라와 해안 도시가 침수 위험에 처해 주민 이주가 불가피해지고 있다." },
        { id: "B", text: "고지대 산악 도시가 침수 위험에 처해 있다." },
        { id: "C", text: "내륙 도시만 해수면 상승의 영향을 받고 있다." },
        { id: "D", text: "해수면 상승으로 인한 실제 피해는 아직 없다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s17",
    highlight: { ranges: [{ paragraphId: "p3", start: 265, end: p3.length }] },
    question: {
      prompt: "마지막 문장이 전달하는 핵심으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "기후 변화의 영향은 자연환경에 그치지 않고 인간 사회의 안전과 경제에도 직결된다." },
        { id: "B", text: "기후 변화는 자연환경에만 영향을 미치고 인간 사회에는 무관하다." },
        { id: "C", text: "인간 사회의 경제만 영향을 받고 안전에는 문제가 없다." },
        { id: "D", text: "기후 변화의 영향은 매우 제한적이어서 걱정할 필요가 없다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s18",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: p3.length }] },
    question: {
      prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "기후 변화는 극지 생물, 해양 생태계, 농업, 해안 도시 등 광범위한 영향을 미치며 인간 사회에도 직결된다." },
        { id: "B", text: "기후 변화는 북극에만 영향을 미치고 다른 지역에는 무관하다." },
        { id: "C", text: "기후 변화로 인한 피해는 아직 관측되지 않았다." },
        { id: "D", text: "산호초 백화 현상은 기후 변화와 관련이 없다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p4
  {
    stepId: "s19",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: 33 }] },
    question: {
      prompt: "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "기후 변화에 대응하기 위해 국제 사회가 다양한 노력을 기울이고 있다." },
        { id: "B", text: "국제 사회는 기후 변화에 대해 아무런 대응을 하지 않고 있다." },
        { id: "C", text: "기후 변화 대응은 개인의 몫일 뿐 국제적 노력은 불필요하다." },
        { id: "D", text: "기후 변화에 대응할 방법은 아직 발견되지 않았다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s20",
    highlight: { ranges: [{ paragraphId: "p4", start: 34, end: 106 }] },
    question: {
      prompt: "둘째 문장에서 파리 협정의 목표로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "온도 상승 폭을 산업화 이전 대비 2도 이내, 나아가 1.5도 이내로 억제하는 것이다." },
        { id: "B", text: "온도 상승 폭에 제한을 두지 않는 것이다." },
        { id: "C", text: "온실 기체를 완전히 제거하는 것이다." },
        { id: "D", text: "지구 온도를 산업화 이전보다 더 낮추는 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s21",
    highlight: { ranges: [{ paragraphId: "p4", start: 107, end: 172 }] },
    question: {
      prompt: "셋째 문장에서 각국이 시행하는 정책으로 언급된 것은 무엇인가요?",
      choices: [
        { id: "A", text: "재생 에너지 확대, 탄소 배출권 거래제, 전기차 보급 촉진 등이다." },
        { id: "B", text: "화석 연료 사용 확대와 삼림 벌채 촉진이다." },
        { id: "C", text: "국제적 합의를 무시하고 자국 이익만 추구하는 것이다." },
        { id: "D", text: "아무런 정책 없이 자연에 맡기는 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s22",
    highlight: { ranges: [{ paragraphId: "p4", start: 173, end: 233 }] },
    question: {
      prompt: "넷째 문장에서 개인 차원의 실천으로 언급된 것은 무엇인가요?",
      choices: [
        { id: "A", text: "에너지 절약, 대중교통 이용, 일회용품 줄이기 같은 실천이다." },
        { id: "B", text: "개인적 실천은 아무런 효과가 없으므로 하지 않아도 된다." },
        { id: "C", text: "자가용 이용을 늘리고 에너지를 많이 사용하는 것이다." },
        { id: "D", text: "일회용품 사용을 늘려 편의를 극대화하는 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s23",
    highlight: { ranges: [{ paragraphId: "p4", start: 234, end: p4.length }] },
    question: {
      prompt: "마지막 문장이 전달하는 결론으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "기후 변화는 과학적 이해, 국제 협력, 개인 실천이 함께 이루어져야 하는 인류 공동의 과제이다." },
        { id: "B", text: "기후 변화는 과학자들만의 문제이며 일반인은 관여할 필요가 없다." },
        { id: "C", text: "국제 협력 없이 개인 실천만으로 기후 변화를 해결할 수 있다." },
        { id: "D", text: "기후 변화 문제는 이미 완전히 해결되었다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s24",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: p4.length }] },
    question: {
      prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "파리 협정을 비롯한 국제적 노력과 개인적 실천이 함께 이루어져야 기후 변화에 대응할 수 있다." },
        { id: "B", text: "파리 협정만으로 기후 변화가 완전히 해결될 수 있다." },
        { id: "C", text: "개인적 실천은 불필요하며 정부 정책만이 효과적이다." },
        { id: "D", text: "기후 변화 대응 노력은 아직 시작되지 않았다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  }
];

const recall = {
  cards: [
    { id: "c1", text: "온실 효과는 대기가 열을 붙잡아 지구 평균 온도를 약 15도로 유지하는 필수적 자연 현상이다." },
    { id: "c2", text: "이산화 탄소, 메테인, 수증기 등의 온실 기체가 적외선을 흡수하여 지표로 되돌려 보낸다." },
    { id: "c3", text: "인간 활동으로 온실 기체가 급증하여 지구 온난화가 발생하고 있다." },
    { id: "c4", text: "지구 온난화는 해수면 상승, 극단적 기상 현상, 생태계 교란 등을 연쇄적으로 일으킨다." },
    { id: "c5", text: "북극 해빙 감소, 산호초 백화, 가뭄과 폭우 증가 등 기후 변화의 영향이 이미 관측되고 있다." },
    { id: "c6", text: "저지대 섬나라와 해안 도시는 해수면 상승으로 침수 위험에 처해 있다." },
    { id: "c7", text: "2015년 파리 협정은 온도 상승을 2도 이내로 억제하는 국제적 합의이다." },
    { id: "c8", text: "기후 변화 대응은 국제 협력과 개인 실천이 함께 이루어져야 하는 인류 공동의 과제이다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "대기가 열을 붙잡아 지구의 평균 온도를 유지하는 현상을 무엇이라 하나요?",
      answerText: "온실 효과",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p1", start: 202, end: 207 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "온실 효과가 없다면 지구의 평균 온도는 약 몇 도까지 떨어지나요?",
      answerText: "영하 18도",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p1", start: 236, end: 242 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "온실 기체 증가의 원인으로 언급된 세 가지 중 첫 번째는 무엇인가요?",
      answerText: "화석 연료의 대량 사용",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p2", start: 67, end: 79 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "온실 기체 증가로 지구 평균 온도가 상승하는 현상을 무엇이라 하나요?",
      answerText: "지구 온난화",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p2", start: 181, end: 187 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "해수 온도 상승이 촉진하는 산호초의 현상을 무엇이라 하나요?",
      answerText: "백화 현상",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p3", start: 115, end: 120 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "2015년에 채택된 기후 변화 대응 국제 협정의 이름은 무엇인가요?",
      answerText: "파리 협정",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p4", start: 47, end: 52 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "파리 협정에서 온도 상승 억제의 최종 목표는 산업화 이전 대비 몇 도 이내인가요?",
      answerText: "1.5도",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p4", start: 90, end: 95 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q8",
      prompt: "기후 변화 문제 해결을 위해 과학적 이해와 함께 필요한 두 가지는 무엇인가요?",
      answerText: "국제적 협력과 개인적 실천",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p4", start: 264, end: 278 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

const content = {
  contentId: "dr-w1-013",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 13 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "WITTGENSTEIN_1",
  schoolGradeRange: { min: 9, max: 10 },
  area: "READING",
  subArea: "NONFICTION",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 600,
  assets: {},
  payload: {
    passage,
    intensive: { timeline },
    recall,
    confirm
  }
};

const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1', '013.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`static 파일 작성 완료: ${staticPath}`);

const batchItem = {
  content_type: "DAILY_READING",
  level_id: "WITTGENSTEIN_1",
  area: "READING",
  sub_area: "NONFICTION",
  day_index: 13,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};

const batchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-w1-day13.json');
fs.writeFileSync(batchPath, JSON.stringify(batchItem, null, 2), 'utf8');
console.log(`배치 파일 작성 완료: ${batchPath}`);
