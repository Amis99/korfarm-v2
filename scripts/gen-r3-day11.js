// 러셀3 Day 11 비문학 - 일일독해 콘텐츠 생성
const fs = require('fs');
const path = require('path');

// ── 지문 (4문단, 목표 1300자 ±50) ── 주제: 면역 체계
const paragraphs = [
  {
    id: "p1",
    text: "인간의 몸은 끊임없이 외부 병원체의 침입에 노출되어 있으며, 이에 대항하는 방어 체계를 면역이라 한다. 면역은 크게 선천 면역과 적응 면역으로 나뉜다. 선천 면역은 태어날 때부터 갖추어진 방어 기제로, 피부와 점막 같은 물리적 장벽, 위산이나 침 같은 화학적 방어, 그리고 백혈구의 일종인 대식세포와 자연살해세포 등이 이에 해당한다. 선천 면역은 침입한 병원체의 종류를 가리지 않고 즉각 반응한다는 점에서 비특이적 방어라고 불린다. 그러나 이 반응만으로는 모든 병원체를 효과적으로 제거하기 어렵기 때문에 보다 정교한 적응 면역이 필요하다."
  },
  {
    id: "p2",
    text: "적응 면역은 특정 병원체를 인식하고 기억하는 능력을 지닌 방어 체계이다. 적응 면역의 핵심 세포인 T세포와 B세포는 각각 다른 방식으로 병원체에 대응한다. T세포는 감염된 세포를 직접 파괴하거나 다른 면역 세포의 활동을 조절하는 역할을 하며, B세포는 항체라는 단백질을 생산하여 병원체를 무력화한다. 항체는 병원체 표면의 특정 구조인 항원에 결합하여 병원체의 활동을 억제하거나 다른 면역 세포가 병원체를 더 쉽게 인식하도록 표지를 붙이는 기능을 한다. 적응 면역이 한 번 활성화되면 기억 세포가 형성되어, 같은 병원체가 다시 침입할 때 더 빠르고 강하게 반응할 수 있다."
  },
  {
    id: "p3",
    text: "백신은 이 적응 면역의 기억 기능을 인위적으로 활용하는 대표적인 의료 기술이다. 백신에는 약독화된 병원체, 병원체의 일부 단백질, 또는 병원체의 유전 정보를 담은 mRNA 등이 포함될 수 있다. 이러한 물질이 체내에 들어오면 실제 감염 없이도 면역 반응이 유도되어 항체와 기억 세포가 만들어진다. 이후 실제 병원체에 노출되었을 때 면역 체계는 이미 준비된 상태이므로 신속하게 대응하여 질병의 발생을 예방하거나 증상을 가볍게 할 수 있다. 집단 내 충분한 수의 사람이 백신 접종을 받으면 병원체의 전파 경로가 차단되는 집단 면역이 형성되어 접종하지 못한 사람도 간접적으로 보호받을 수 있다."
  },
  {
    id: "p4",
    text: "면역 체계가 정상적으로 기능하지 못하면 다양한 질환이 발생한다. 면역 결핍은 면역 세포나 항체가 부족하여 감염에 취약해지는 상태이고, 반대로 면역 체계가 자기 자신의 조직을 공격하는 자가면역 질환도 있다. 류머티즘 관절염이나 루푸스 등이 대표적인 자가면역 질환에 해당한다. 또한 면역 체계가 해롭지 않은 외부 물질에 과도하게 반응하는 것을 알레르기라 하며, 꽃가루나 특정 음식에 대한 반응이 그 예이다. 이처럼 면역은 외부 위협으로부터 몸을 보호하는 필수적인 체계이지만, 그 균형이 무너지면 오히려 건강을 해치는 원인이 될 수 있으므로 면역 체계의 균형 유지가 매우 중요하다."
  }
];

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log(`지문 총 글자 수: ${totalLen}`);

function r(pid, s, e) { return { paragraphId: pid, start: s, end: e }; }
const scoring_i = { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true };

const intensive = { timeline: [
  // p1
  { stepId: "s1", highlight: { ranges: [r("p1", 0, 63)] },
    question: { prompt: "첫 문장이 정의하는 '면역'이란 무엇인가?",
      choices: [
        { id: "A", text: "외부 병원체의 침입에 대항하는 방어 체계이다." },
        { id: "B", text: "질병에 걸린 후 자연적으로 회복되는 치유 과정이다." },
        { id: "C", text: "약을 복용하여 병원체를 제거하는 치료 방법이다." },
        { id: "D", text: "건강한 식습관을 통해 체력을 유지하는 생활 방식이다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s2", highlight: { ranges: [r("p1", 64, 96)] },
    question: { prompt: "둘째 문장이 제시하는 면역의 두 가지 종류로 알맞은 것은?",
      choices: [
        { id: "A", text: "선천 면역과 적응 면역이다." },
        { id: "B", text: "물리적 면역과 화학적 면역이다." },
        { id: "C", text: "세포 면역과 체액 면역이다." },
        { id: "D", text: "자연 면역과 인공 면역이다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s3", highlight: { ranges: [r("p1", 97, 220)] },
    question: { prompt: "셋째 문장이 설명하는 선천 면역의 구성 요소로 알맞은 것은?",
      choices: [
        { id: "A", text: "피부와 점막, 위산과 침, 대식세포와 자연살해세포 등이다." },
        { id: "B", text: "항체, T세포, B세포 등의 특이적 면역 세포이다." },
        { id: "C", text: "백신 접종으로 만들어지는 기억 세포이다." },
        { id: "D", text: "병원체의 유전 정보를 분석하는 면역 효소이다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s4", highlight: { ranges: [r("p1", 221, 275)] },
    question: { prompt: "넷째 문장이 말하는 선천 면역의 특징으로 알맞은 것은?",
      choices: [
        { id: "A", text: "병원체의 종류를 가리지 않고 즉각 반응하는 비특이적 방어이다." },
        { id: "B", text: "특정 병원체만 선택적으로 제거하는 정밀한 방어이다." },
        { id: "C", text: "기억 세포를 형성하여 재감염 시 빠르게 대응하는 방어이다." },
        { id: "D", text: "항체를 생산하여 병원체를 무력화하는 체액성 방어이다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s5", highlight: { ranges: [r("p1", 276, 326)] },
    question: { prompt: "다섯째 문장이 설명하는 적응 면역이 필요한 이유로 알맞은 것은?",
      choices: [
        { id: "A", text: "선천 면역만으로는 모든 병원체를 효과적으로 제거하기 어렵기 때문이다." },
        { id: "B", text: "선천 면역은 태어난 지 얼마 되지 않아 사라지기 때문이다." },
        { id: "C", text: "적응 면역이 선천 면역보다 비용이 적게 들기 때문이다." },
        { id: "D", text: "선천 면역 세포가 적응 면역 세포로 전환되기 때문이다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s6", highlight: { ranges: [r("p1", 0, 326)] },
    question: { prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "면역은 선천 면역과 적응 면역으로 나뉘며, 선천 면역은 비특이적으로 즉각 반응한다." },
        { id: "B", text: "선천 면역만으로 모든 병원체를 제거할 수 있어 적응 면역은 불필요하다." },
        { id: "C", text: "면역 체계는 백신 접종을 통해서만 활성화되는 방어 시스템이다." },
        { id: "D", text: "대식세포와 자연살해세포는 적응 면역에 속하는 특이적 면역 세포이다." }
      ], answerId: "A", scoring: scoring_i } },

  // p2
  { stepId: "s7", highlight: { ranges: [r("p2", 0, 44)] },
    question: { prompt: "첫 문장이 말하는 적응 면역의 핵심 능력으로 알맞은 것은?",
      choices: [
        { id: "A", text: "특정 병원체를 인식하고 기억하는 능력이다." },
        { id: "B", text: "모든 종류의 병원체에 동시에 반응하는 능력이다." },
        { id: "C", text: "병원체를 물리적으로 차단하는 장벽을 형성하는 능력이다." },
        { id: "D", text: "화학 물질을 분비하여 체온을 높이는 능력이다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s8", highlight: { ranges: [r("p2", 45, 92)] },
    question: { prompt: "둘째 문장이 소개하는 적응 면역의 핵심 세포로 알맞은 것은?",
      choices: [
        { id: "A", text: "T세포와 B세포이다." },
        { id: "B", text: "대식세포와 자연살해세포이다." },
        { id: "C", text: "적혈구와 혈소판이다." },
        { id: "D", text: "호중구와 호산구이다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s9", highlight: { ranges: [r("p2", 93, 172)] },
    question: { prompt: "셋째 문장이 설명하는 T세포와 B세포의 역할로 알맞은 것은?",
      choices: [
        { id: "A", text: "T세포는 감염 세포를 파괴하거나 면역 조절을 하고, B세포는 항체를 생산한다." },
        { id: "B", text: "T세포가 항체를 생산하고, B세포가 감염 세포를 직접 파괴한다." },
        { id: "C", text: "T세포와 B세포 모두 항체를 생산하여 병원체를 무력화한다." },
        { id: "D", text: "T세포는 병원체를 흡수하고, B세포는 물리적 장벽을 형성한다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s10", highlight: { ranges: [r("p2", 173, 272)] },
    question: { prompt: "넷째 문장이 설명하는 항체의 기능으로 알맞은 것은?",
      choices: [
        { id: "A", text: "항원에 결합하여 병원체를 억제하거나 다른 면역 세포의 인식을 돕는다." },
        { id: "B", text: "항체는 병원체를 직접 분해하여 체내에서 완전히 제거한다." },
        { id: "C", text: "항체는 감염된 세포의 유전자를 수정하여 정상으로 되돌린다." },
        { id: "D", text: "항체는 병원체의 DNA를 복제하여 면역 기억에 저장한다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s11", highlight: { ranges: [r("p2", 273, 343)] },
    question: { prompt: "다섯째 문장이 말하는 기억 세포의 역할로 알맞은 것은?",
      choices: [
        { id: "A", text: "같은 병원체가 다시 침입할 때 더 빠르고 강하게 반응할 수 있게 한다." },
        { id: "B", text: "한 번 활성화된 면역 세포를 영구적으로 비활성화한다." },
        { id: "C", text: "새로운 종류의 병원체를 미리 예측하여 대응 준비를 한다." },
        { id: "D", text: "면역 반응의 속도를 늦추어 과도한 반응을 방지한다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s12", highlight: { ranges: [r("p2", 0, 343)] },
    question: { prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "적응 면역은 T세포와 B세포를 통해 특정 병원체에 대응하고 기억 세포를 형성한다." },
        { id: "B", text: "B세포만이 적응 면역의 핵심이며 T세포는 보조적 역할에 그친다." },
        { id: "C", text: "적응 면역은 선천 면역과 동일한 방식으로 비특이적 반응을 한다." },
        { id: "D", text: "항체는 병원체 내부에 들어가 유전자를 직접 변형시킨다." }
      ], answerId: "A", scoring: scoring_i } },

  // p3
  { stepId: "s13", highlight: { ranges: [r("p3", 0, 49)] },
    question: { prompt: "첫 문장이 말하는 백신의 원리로 알맞은 것은?",
      choices: [
        { id: "A", text: "적응 면역의 기억 기능을 인위적으로 활용하는 기술이다." },
        { id: "B", text: "선천 면역의 물리적 장벽을 인공적으로 강화하는 기술이다." },
        { id: "C", text: "병원체를 직접 투입하여 실제 감염을 일으키는 치료법이다." },
        { id: "D", text: "면역 세포를 제거하여 과민 반응을 억제하는 방법이다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s14", highlight: { ranges: [r("p3", 50, 117)] },
    question: { prompt: "둘째 문장이 나열하는 백신에 포함될 수 있는 물질로 알맞은 것은?",
      choices: [
        { id: "A", text: "약독화된 병원체, 병원체의 일부 단백질, 또는 mRNA 등이다." },
        { id: "B", text: "항생제, 소염제, 진통제 등의 화학 약물이다." },
        { id: "C", text: "적혈구, 혈소판, 혈장 등의 혈액 성분이다." },
        { id: "D", text: "비타민, 미네랄, 아미노산 등의 영양 보충제이다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s15", highlight: { ranges: [r("p3", 118, 180)] },
    question: { prompt: "셋째 문장이 설명하는 백신 투여 후 체내 반응으로 알맞은 것은?",
      choices: [
        { id: "A", text: "실제 감염 없이 면역 반응이 유도되어 항체와 기억 세포가 만들어진다." },
        { id: "B", text: "병원체가 체내에서 증식하여 가벼운 감염이 발생한다." },
        { id: "C", text: "선천 면역 세포만 활성화되고 적응 면역은 작동하지 않는다." },
        { id: "D", text: "면역 세포가 일시적으로 비활성화되어 휴식 상태에 들어간다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s16", highlight: { ranges: [r("p3", 181, 254)] },
    question: { prompt: "넷째 문장이 설명하는 백신의 효과로 알맞은 것은?",
      choices: [
        { id: "A", text: "실제 병원체에 노출 시 신속하게 대응하여 질병을 예방하거나 증상을 가볍게 한다." },
        { id: "B", text: "백신 접종 즉시 모든 질병에 대한 완전한 면역이 형성된다." },
        { id: "C", text: "병원체를 완전히 제거하여 다시는 감염되지 않는다." },
        { id: "D", text: "면역 세포의 수를 줄여 알레르기 반응을 방지한다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s17", highlight: { ranges: [r("p3", 255, 338)] },
    question: { prompt: "다섯째 문장이 설명하는 '집단 면역'의 의미로 알맞은 것은?",
      choices: [
        { id: "A", text: "충분한 수의 접종으로 전파 경로가 차단되어 미접종자도 보호받는 것이다." },
        { id: "B", text: "집단 전체가 동시에 같은 질병에 걸려 자연 면역이 형성되는 것이다." },
        { id: "C", text: "면역력이 강한 사람들만 모여 사는 지역을 만드는 것이다." },
        { id: "D", text: "모든 사람이 반드시 백신을 접종해야 하는 법적 의무를 말한다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s18", highlight: { ranges: [r("p3", 0, 338)] },
    question: { prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "백신은 적응 면역의 기억 기능을 이용하여 질병을 예방하고 집단 면역을 형성한다." },
        { id: "B", text: "백신은 선천 면역만 자극하며 적응 면역에는 영향을 주지 않는다." },
        { id: "C", text: "백신 접종은 개인에게만 효과가 있고 집단 차원의 보호 효과는 없다." },
        { id: "D", text: "mRNA 백신은 기존 백신과 원리가 완전히 달라 면역 기억이 형성되지 않는다." }
      ], answerId: "A", scoring: scoring_i } },

  // p4
  { stepId: "s19", highlight: { ranges: [r("p4", 0, 37)] },
    question: { prompt: "첫 문장이 말하는 상황으로 알맞은 것은?",
      choices: [
        { id: "A", text: "면역 체계가 정상적으로 기능하지 못하면 다양한 질환이 발생한다." },
        { id: "B", text: "면역 체계가 과도하게 활성화되면 체력이 크게 향상된다." },
        { id: "C", text: "면역 체계는 노화와 관계없이 항상 일정하게 작동한다." },
        { id: "D", text: "면역 질환은 선천 면역에서만 발생하고 적응 면역에는 없다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s20", highlight: { ranges: [r("p4", 38, 117)] },
    question: { prompt: "면역 결핍과 자가면역 질환에 대한 설명으로 알맞은 것은?",
      choices: [
        { id: "A", text: "면역 결핍은 면역이 부족한 상태이고, 자가면역은 자기 조직을 공격하는 것이다." },
        { id: "B", text: "면역 결핍은 면역이 과잉인 상태이고, 자가면역은 면역이 약한 상태이다." },
        { id: "C", text: "면역 결핍과 자가면역은 같은 질환의 다른 이름이다." },
        { id: "D", text: "면역 결핍은 외부 물질에 과민 반응하고, 자가면역은 병원체에 무반응이다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s21", highlight: { ranges: [r("p4", 118, 167)] },
    question: { prompt: "자가면역 질환의 예로 언급된 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "류머티즘 관절염이나 루푸스이다." },
        { id: "B", text: "독감이나 폐렴이다." },
        { id: "C", text: "당뇨병이나 고혈압이다." },
        { id: "D", text: "골다공증이나 관절 연골 손상이다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s22", highlight: { ranges: [r("p4", 168, 242)] },
    question: { prompt: "알레르기에 대한 설명으로 알맞은 것은?",
      choices: [
        { id: "A", text: "해롭지 않은 외부 물질에 면역 체계가 과도하게 반응하는 것이다." },
        { id: "B", text: "면역 세포가 부족하여 외부 물질을 인식하지 못하는 것이다." },
        { id: "C", text: "자기 조직을 외부 물질로 착각하여 공격하는 자가면역이다." },
        { id: "D", text: "백신 접종 후 나타나는 정상적인 면역 반응이다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s23", highlight: { ranges: [r("p4", 243, 340)] },
    question: { prompt: "마지막 문장이 강조하는 핵심 메시지로 알맞은 것은?",
      choices: [
        { id: "A", text: "면역은 필수적이지만 균형이 무너지면 오히려 해로우므로 균형 유지가 중요하다." },
        { id: "B", text: "면역 체계는 항상 강하게 유지해야 하며 약해지면 안 된다." },
        { id: "C", text: "면역 체계의 균형은 약물로만 조절할 수 있다." },
        { id: "D", text: "면역이 강할수록 건강하므로 면역 강화가 최선이다." }
      ], answerId: "A", scoring: scoring_i } },
  { stepId: "s24", highlight: { ranges: [r("p4", 0, 340)] },
    question: { prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "면역 체계의 이상은 면역 결핍, 자가면역, 알레르기 등 다양한 질환을 일으킨다." },
        { id: "B", text: "면역 질환은 선천적으로만 발생하며 후천적 요인은 없다." },
        { id: "C", text: "알레르기는 면역과 무관한 피부 반응에 불과하다." },
        { id: "D", text: "자가면역 질환은 면역이 약해서 생기는 것이므로 면역 강화가 답이다." }
      ], answerId: "A", scoring: scoring_i } },
]};

// ── 복기 (recall) - 정확히 8카드 ──
const recall = {
  cards: [
    { id: "c1", text: "면역은 선천 면역과 적응 면역으로 나뉘며, 선천 면역은 비특이적으로 즉각 반응한다." },
    { id: "c2", text: "적응 면역의 T세포는 감염 세포를 파괴하고, B세포는 항체를 생산한다." },
    { id: "c3", text: "항체는 항원에 결합하여 병원체를 억제하거나 면역 세포의 인식을 돕는다." },
    { id: "c4", text: "기억 세포가 형성되면 같은 병원체 재침입 시 더 빠르고 강하게 반응한다." },
    { id: "c5", text: "백신은 적응 면역의 기억 기능을 인위적으로 활용하는 의료 기술이다." },
    { id: "c6", text: "충분한 백신 접종으로 집단 면역이 형성되어 미접종자도 보호받는다." },
    { id: "c7", text: "면역 결핍, 자가면역, 알레르기는 면역 체계 이상으로 발생하는 질환이다." },
    { id: "c8", text: "면역은 필수적이지만 균형이 무너지면 오히려 건강을 해칠 수 있다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// ── 확인 (confirm) - 7문항 ──
const scoring_c = { correctDeltaSec: 30, wrongDeltaSec: -45 };
const confirm = { questions: [
  { id: "q1", prompt: "선천 면역이 병원체 종류를 가리지 않고 반응한다는 특성을 무엇이라 하는가?",
    answerText: "비특이적 방어",
    answerMatchMode: "ANY",
    answerRanges: [r("p1", 262, 269)],
    scoring: scoring_c, revealOnWrong: true },
  { id: "q2", prompt: "적응 면역에서 항체를 생산하는 면역 세포는 무엇인가?",
    answerText: "B세포",
    answerMatchMode: "ANY",
    answerRanges: [r("p2", 70, 74), r("p2", 136, 140)],
    scoring: scoring_c, revealOnWrong: true },
  { id: "q3", prompt: "항체가 결합하는 병원체 표면의 특정 구조를 무엇이라 하는가?",
    answerText: "항원",
    answerMatchMode: "ANY",
    answerRanges: [r("p2", 200, 202)],
    scoring: scoring_c, revealOnWrong: true },
  { id: "q4", prompt: "적응 면역 활성화 후 재감염에 빠르게 대응할 수 있게 하는 세포는 무엇인가?",
    answerText: "기억 세포",
    answerMatchMode: "ANY",
    answerRanges: [r("p2", 282, 286), r("p3", 169, 173)],
    scoring: scoring_c, revealOnWrong: true },
  { id: "q5", prompt: "충분한 백신 접종으로 병원체 전파가 차단되어 미접종자도 보호받는 현상을 무엇이라 하는가?",
    answerText: "집단 면역",
    answerMatchMode: "ANY",
    answerRanges: [r("p3", 309, 313)],
    scoring: scoring_c, revealOnWrong: true },
  { id: "q6", prompt: "면역 체계가 자기 자신의 조직을 공격하는 질환을 무엇이라 하는가?",
    answerText: "자가면역 질환",
    answerMatchMode: "ANY",
    answerRanges: [r("p4", 95, 102), r("p4", 155, 162)],
    scoring: scoring_c, revealOnWrong: true },
  { id: "q7", prompt: "해롭지 않은 외부 물질에 면역 체계가 과도하게 반응하는 현상을 무엇이라 하는가?",
    answerText: "알레르기",
    answerMatchMode: "ANY",
    answerRanges: [r("p4", 213, 217)],
    scoring: scoring_c, revealOnWrong: true },
]};

// ── content 객체 조립 ──
const content = {
  contentId: "dr-r3-011",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 3) Day 11 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_3",
  schoolGradeRange: { min: 9, max: 10 },
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
    intensive,
    recall,
    confirm
  }
};

const batchItem = {
  content_type: "DAILY_READING",
  level_id: "RUSSELL_3",
  area: "READING",
  sub_area: "NONFICTION",
  day_index: 11,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell3');
fs.writeFileSync(path.join(staticDir, '011.json'), JSON.stringify(content, null, 2), 'utf8');
console.log('static 011.json 저장 완료');

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell3.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[10] = batchItem;
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log('배치 파일 day_index 11 업데이트 완료');
