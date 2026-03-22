const fs = require('fs');
const path = require('path');

// ─── 지문: 과학 - 면역 체계 (비문학, 고1~2 수준, ~1400자) ───
const paragraphs = [
  {
    id: "p1",
    text: "우리 몸은 외부에서 침입하는 세균이나 바이러스 같은 병원체에 대항하기 위해 면역 체계를 갖추고 있다. 면역 체계는 크게 선천 면역과 적응 면역으로 나뉜다. 선천 면역은 태어날 때부터 가지고 있는 방어 기제로, 병원체의 종류와 관계없이 비특이적으로 신속하게 반응한다는 특징이 있다. 피부와 점막은 병원체의 침입을 차단하는 물리적 장벽 역할을 하며, 이 장벽을 뚫고 체내로 들어온 병원체는 대식세포나 호중구 같은 면역 세포가 잡아먹는 식세포 작용을 통해 제거된다. 이처럼 선천 면역은 빠르게 작동하여 감염 초기에 중요한 역할을 하지만, 특정 병원체를 구별하여 맞춤형으로 대응하는 능력은 제한적이다."
  },
  {
    id: "p2",
    text: "적응 면역은 특정 병원체를 정확히 인식하고 기억하는 정교한 방어 체계로, 선천 면역에 비해 반응 속도는 느리지만 표적에 대한 정밀도가 높다. 적응 면역의 핵심에는 림프구가 있으며, 림프구는 크게 B 림프구와 T 림프구로 나뉜다. B 림프구는 항체라는 단백질을 생산하여 혈액 속의 병원체를 무력화하는 체액성 면역을 담당한다. 항체는 병원체 표면의 항원이라는 특정 분자 구조에 결합하여 병원체가 세포에 침투하지 못하도록 막거나, 대식세포가 병원체를 더 쉽게 인식하고 제거할 수 있도록 표지를 붙이는 역할을 한다. 한편 T 림프구는 바이러스에 감염된 세포를 직접 파괴하는 세포성 면역을 수행하며, 다른 면역 세포의 활동을 조절하는 역할도 한다."
  },
  {
    id: "p3",
    text: "적응 면역에서 특히 중요한 것은 면역 기억이라는 특성이다. 처음 병원체에 감염되면 적응 면역 반응이 일어나기까지 수일이 걸리는데, 이를 일차 면역 반응이라 한다. 이 과정에서 병원체에 반응한 일부 림프구는 기억 세포로 분화하여 체내에 수년에서 수십 년까지 오랫동안 남아 있게 된다. 이후 같은 병원체가 다시 침입하면, 기억 세포가 빠르게 활성화되어 훨씬 강력하고 신속한 이차 면역 반응을 일으킨다. 이 원리를 이용한 것이 바로 백신이다. 백신은 약화되거나 불활성화된 병원체 또는 그 일부를 체내에 주입하여 기억 세포를 미리 만들어 둠으로써, 실제 감염이 발생했을 때 빠르게 대응할 수 있도록 면역 체계를 준비시키는 예방 의학적 방법이다."
  },
  {
    id: "p4",
    text: "그러나 면역 체계가 항상 올바르게 작동하는 것은 아니다. 면역 체계가 자기 몸의 정상 세포를 병원체로 잘못 인식하여 공격하면 자가 면역 질환이 발생하는데, 류머티즘 관절염이나 루푸스 같은 질환이 대표적인 예이다. 반대로 면역 반응이 지나치게 강하게 일어나는 경우도 있으며, 이를 과민 반응 또는 알레르기라 한다. 꽃가루나 특정 음식처럼 본래 해롭지 않은 물질에 대해 면역 체계가 과도하게 반응하면 재채기, 두드러기, 심한 경우 호흡 곤란 같은 증상이 나타난다. 이처럼 면역 체계는 우리 몸을 보호하는 핵심적인 기능을 수행하지만, 그 균형이 깨지면 오히려 건강을 해치는 원인이 될 수 있으므로 면역 체계의 적절한 조절이 중요하다."
  }
];

// 글자 수 확인
const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log("총 글자 수:", totalLen);
if (totalLen < 1350 || totalLen > 1450) {
  console.warn("경고: 글자 수가 1400±50 범위 밖입니다!");
}

function findRange(pid, search) {
  const p = paragraphs.find(x => x.id === pid);
  if (!p) throw new Error("문단 " + pid + " 없음");
  const s = p.text.indexOf(search);
  if (s === -1) throw new Error(`"${search}" not found in ${pid}`);
  return { paragraphId: pid, start: s, end: s + search.length };
}

// ─── 정독 (intensive) ───
const timeline = [];
let stepNum = 1;

function addStep(pid, sentence, question) {
  const r = findRange(pid, sentence);
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [r] },
    question: {
      ...question,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
}

function addParagraphSummary(pid, question) {
  const p = paragraphs.find(x => x.id === pid);
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [{ paragraphId: pid, start: 0, end: p.text.length }] },
    question: {
      ...question,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
}

// p1 문장들
const p1s1 = "우리 몸은 외부에서 침입하는 세균이나 바이러스 같은 병원체에 대항하기 위해 면역 체계를 갖추고 있다.";
const p1s2 = "면역 체계는 크게 선천 면역과 적응 면역으로 나뉜다.";
const p1s3 = "선천 면역은 태어날 때부터 가지고 있는 방어 기제로, 병원체의 종류와 관계없이 비특이적으로 신속하게 반응한다는 특징이 있다.";
const p1s4 = "피부와 점막은 병원체의 침입을 차단하는 물리적 장벽 역할을 하며, 이 장벽을 뚫고 체내로 들어온 병원체는 대식세포나 호중구 같은 면역 세포가 잡아먹는 식세포 작용을 통해 제거된다.";
const p1s5 = "이처럼 선천 면역은 빠르게 작동하여 감염 초기에 중요한 역할을 하지만, 특정 병원체를 구별하여 맞춤형으로 대응하는 능력은 제한적이다.";

addStep("p1", p1s1, {
  prompt: "첫 문장이 설명하는 내용으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "우리 몸이 병원체에 대항하기 위해 면역 체계를 갖추고 있다는 것이다." },
    { id: "B", text: "세균과 바이러스는 면역 체계의 일부라는 것이다." },
    { id: "C", text: "병원체는 우리 몸에 도움을 주는 존재라는 것이다." },
    { id: "D", text: "면역 체계는 외부의 도움 없이는 작동하지 않는다는 것이다." }
  ],
  answerId: "A"
});
addStep("p1", p1s2, {
  prompt: "둘째 문장에서 면역 체계의 구분으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "면역 체계는 선천 면역과 적응 면역으로 나뉜다." },
    { id: "B", text: "면역 체계는 공격 면역과 방어 면역으로 나뉜다." },
    { id: "C", text: "면역 체계는 물리 면역과 화학 면역으로 나뉜다." },
    { id: "D", text: "면역 체계는 내부 면역과 외부 면역으로 나뉜다." }
  ],
  answerId: "A"
});
addStep("p1", p1s3, {
  prompt: "셋째 문장에서 선천 면역의 특징으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "태어날 때부터 가지고 있으며 병원체 종류와 관계없이 비특이적으로 반응한다." },
    { id: "B", text: "후천적으로 학습하여 특정 병원체만 골라서 대응한다." },
    { id: "C", text: "성장 과정에서 서서히 형성되며 반응 속도가 느리다." },
    { id: "D", text: "항체를 생산하여 병원체를 무력화하는 것이 핵심이다." }
  ],
  answerId: "A"
});
addStep("p1", p1s4, {
  prompt: "넷째 문장이 설명하는 선천 면역의 구체적 작용으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "피부와 점막이 물리적 장벽이 되고, 대식세포 등이 식세포 작용으로 병원체를 제거한다." },
    { id: "B", text: "항체가 병원체에 결합하여 무력화시킨다." },
    { id: "C", text: "기억 세포가 병원체를 인식하여 신속하게 제거한다." },
    { id: "D", text: "T 림프구가 감염된 세포를 직접 파괴한다." }
  ],
  answerId: "A"
});
addStep("p1", p1s5, {
  prompt: "다섯째 문장이 말하는 선천 면역의 한계로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "빠르게 작동하지만 특정 병원체를 구별하여 맞춤형 대응하는 능력이 제한적이다." },
    { id: "B", text: "특정 병원체를 정확히 구별하지만 반응 속도가 느리다." },
    { id: "C", text: "모든 병원체를 완벽하게 제거할 수 있어 한계가 없다." },
    { id: "D", text: "감염 초기에는 작동하지 않고 후기에만 반응한다." }
  ],
  answerId: "A"
});
addParagraphSummary("p1", {
  prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "면역 체계는 선천 면역과 적응 면역으로 나뉘며, 선천 면역은 신속하지만 병원체 구별 능력이 제한적이다." },
    { id: "B", text: "선천 면역은 특정 병원체만을 표적으로 삼아 정밀하게 공격하는 방어 체계이다." },
    { id: "C", text: "면역 체계는 오직 피부와 점막에 의해서만 작동한다." },
    { id: "D", text: "적응 면역이 선천 면역보다 먼저 작동하여 병원체를 제거한다." }
  ],
  answerId: "A"
});

// p2 문장들
const p2s1 = "적응 면역은 특정 병원체를 정확히 인식하고 기억하는 정교한 방어 체계로, 선천 면역에 비해 반응 속도는 느리지만 표적에 대한 정밀도가 높다.";
const p2s2 = "적응 면역의 핵심에는 림프구가 있으며, 림프구는 크게 B 림프구와 T 림프구로 나뉜다.";
const p2s3 = "B 림프구는 항체라는 단백질을 생산하여 혈액 속의 병원체를 무력화하는 체액성 면역을 담당한다.";
const p2s4 = "항체는 병원체 표면의 항원이라는 특정 분자 구조에 결합하여 병원체가 세포에 침투하지 못하도록 막거나, 대식세포가 병원체를 더 쉽게 인식하고 제거할 수 있도록 표지를 붙이는 역할을 한다.";
const p2s5 = "한편 T 림프구는 바이러스에 감염된 세포를 직접 파괴하는 세포성 면역을 수행하며, 다른 면역 세포의 활동을 조절하는 역할도 한다.";

addStep("p2", p2s1, {
  prompt: "첫 문장이 말하는 적응 면역의 특징으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "특정 병원체를 정확히 인식하고 기억하며, 반응 속도는 느리지만 정밀도가 높다." },
    { id: "B", text: "병원체의 종류와 관계없이 동일하게 반응하는 단순한 체계이다." },
    { id: "C", text: "태어날 때부터 가지고 있어 즉시 작동하는 체계이다." },
    { id: "D", text: "피부와 점막으로만 구성된 물리적 장벽이다." }
  ],
  answerId: "A"
});
addStep("p2", p2s2, {
  prompt: "둘째 문장에서 림프구의 종류로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "림프구는 B 림프구와 T 림프구로 나뉜다." },
    { id: "B", text: "림프구는 대식세포와 호중구로 나뉜다." },
    { id: "C", text: "림프구는 항체와 항원으로 나뉜다." },
    { id: "D", text: "림프구는 적혈구와 백혈구로 나뉜다." }
  ],
  answerId: "A"
});
addStep("p2", p2s3, {
  prompt: "셋째 문장에서 B 림프구의 역할로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "항체를 생산하여 혈액 속의 병원체를 무력화하는 체액성 면역을 담당한다." },
    { id: "B", text: "바이러스에 감염된 세포를 직접 파괴하는 세포성 면역을 수행한다." },
    { id: "C", text: "병원체를 잡아먹는 식세포 작용을 통해 제거한다." },
    { id: "D", text: "피부와 점막의 물리적 장벽을 강화한다." }
  ],
  answerId: "A"
});
addStep("p2", p2s4, {
  prompt: "넷째 문장이 설명하는 항체의 역할로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "항원에 결합하여 병원체의 세포 침투를 막거나, 대식세포가 제거하기 쉽도록 표지를 붙인다." },
    { id: "B", text: "병원체를 직접 파괴하여 체내에서 완전히 소멸시킨다." },
    { id: "C", text: "감염된 세포를 인식하여 세포 자체를 제거한다." },
    { id: "D", text: "새로운 병원체를 만들어 면역 체계를 훈련시킨다." }
  ],
  answerId: "A"
});
addStep("p2", p2s5, {
  prompt: "다섯째 문장에서 T 림프구의 역할로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "감염된 세포를 직접 파괴하는 세포성 면역을 수행하며 다른 면역 세포를 조절한다." },
    { id: "B", text: "항체를 생산하여 병원체를 무력화한다." },
    { id: "C", text: "기억 세포로 분화하여 이차 면역 반응을 일으킨다." },
    { id: "D", text: "피부와 점막을 보수하여 물리적 장벽을 유지한다." }
  ],
  answerId: "A"
});
addParagraphSummary("p2", {
  prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "적응 면역은 B 림프구의 체액성 면역과 T 림프구의 세포성 면역으로 특정 병원체에 정교하게 대응한다." },
    { id: "B", text: "B 림프구와 T 림프구는 동일한 역할을 수행하며 차이가 없다." },
    { id: "C", text: "적응 면역은 선천 면역보다 반응 속도가 빠르다." },
    { id: "D", text: "림프구는 면역 반응에 관여하지 않는 혈액 세포이다." }
  ],
  answerId: "A"
});

// p3 문장들
const p3s1 = "적응 면역에서 특히 중요한 것은 면역 기억이라는 특성이다.";
const p3s2 = "처음 병원체에 감염되면 적응 면역 반응이 일어나기까지 수일이 걸리는데, 이를 일차 면역 반응이라 한다.";
const p3s3 = "이 과정에서 병원체에 반응한 일부 림프구는 기억 세포로 분화하여 체내에 수년에서 수십 년까지 오랫동안 남아 있게 된다.";
const p3s4 = "이후 같은 병원체가 다시 침입하면, 기억 세포가 빠르게 활성화되어 훨씬 강력하고 신속한 이차 면역 반응을 일으킨다.";
const p3s5 = "이 원리를 이용한 것이 바로 백신이다.";
const p3s6 = "백신은 약화되거나 불활성화된 병원체 또는 그 일부를 체내에 주입하여 기억 세포를 미리 만들어 둠으로써, 실제 감염이 발생했을 때 빠르게 대응할 수 있도록 면역 체계를 준비시키는 예방 의학적 방법이다.";

addStep("p3", p3s1, {
  prompt: "첫 문장이 강조하는 적응 면역의 중요한 특성으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "면역 기억이 적응 면역에서 특히 중요하다." },
    { id: "B", text: "면역 반응의 속도가 적응 면역에서 가장 중요하다." },
    { id: "C", text: "항체 생산량이 적응 면역의 핵심이다." },
    { id: "D", text: "식세포 작용이 적응 면역의 핵심 기능이다." }
  ],
  answerId: "A"
});
addStep("p3", p3s2, {
  prompt: "둘째 문장에서 일차 면역 반응의 특징으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "처음 감염 시 적응 면역 반응이 일어나기까지 수일이 걸린다." },
    { id: "B", text: "처음 감염 시에도 면역 반응이 즉시 일어난다." },
    { id: "C", text: "일차 면역 반응은 이차 면역 반응보다 더 강력하다." },
    { id: "D", text: "일차 면역 반응에서는 기억 세포가 곧바로 활성화된다." }
  ],
  answerId: "A"
});
addStep("p3", p3s3, {
  prompt: "셋째 문장이 설명하는 기억 세포의 형성 과정으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "병원체에 반응한 일부 림프구가 기억 세포로 분화하여 수년에서 수십 년까지 남는다." },
    { id: "B", text: "모든 림프구가 기억 세포로 전환되어 체내에서 곧 사라진다." },
    { id: "C", text: "기억 세포는 태어날 때부터 존재하여 별도의 형성 과정이 없다." },
    { id: "D", text: "기억 세포는 항체에 의해 만들어져 혈액 속에서만 존재한다." }
  ],
  answerId: "A"
});
addStep("p3", p3s4, {
  prompt: "넷째 문장이 말하는 이차 면역 반응의 특징으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "같은 병원체 재침입 시 기억 세포가 빠르게 활성화되어 강력하고 신속하게 반응한다." },
    { id: "B", text: "다른 종류의 병원체에도 동일하게 반응한다." },
    { id: "C", text: "병원체가 재침입해도 반응하지 않고 대기 상태를 유지한다." },
    { id: "D", text: "일차 면역 반응과 동일한 속도와 강도로 반응한다." }
  ],
  answerId: "A"
});
addStep("p3", p3s5, {
  prompt: "다섯째 문장이 말하는 이차 면역 반응의 활용으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "이차 면역 반응의 원리를 이용한 것이 백신이다." },
    { id: "B", text: "이차 면역 반응은 약물 치료의 원리이다." },
    { id: "C", text: "이차 면역 반응은 선천 면역의 일종이다." },
    { id: "D", text: "이차 면역 반응은 면역 체계를 약화시킨다." }
  ],
  answerId: "A"
});
addStep("p3", p3s6, {
  prompt: "여섯째 문장이 설명하는 백신의 원리로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "약화된 병원체를 주입하여 기억 세포를 미리 만들어 실제 감염에 대비하는 예방법이다." },
    { id: "B", text: "강력한 병원체를 주입하여 면역 체계를 직접 자극한다." },
    { id: "C", text: "항체를 직접 주입하여 병원체를 즉시 제거한다." },
    { id: "D", text: "면역 세포를 제거하여 과민 반응을 방지한다." }
  ],
  answerId: "A"
});
addParagraphSummary("p3", {
  prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "면역 기억을 통해 이차 면역 반응이 빠르고 강력하게 일어나며, 백신은 이 원리를 활용한 예방법이다." },
    { id: "B", text: "일차 면역 반응이 이차 면역 반응보다 더 효과적이다." },
    { id: "C", text: "백신은 면역 체계와 관계없이 병원체를 직접 죽이는 약물이다." },
    { id: "D", text: "기억 세포는 한 번 사용되면 소멸하여 재사용이 불가능하다." }
  ],
  answerId: "A"
});

// p4 문장들
const p4s1 = "그러나 면역 체계가 항상 올바르게 작동하는 것은 아니다.";
const p4s2 = "면역 체계가 자기 몸의 정상 세포를 병원체로 잘못 인식하여 공격하면 자가 면역 질환이 발생하는데, 류머티즘 관절염이나 루푸스 같은 질환이 대표적인 예이다.";
const p4s3 = "반대로 면역 반응이 지나치게 강하게 일어나는 경우도 있으며, 이를 과민 반응 또는 알레르기라 한다.";
const p4s4 = "꽃가루나 특정 음식처럼 본래 해롭지 않은 물질에 대해 면역 체계가 과도하게 반응하면 재채기, 두드러기, 심한 경우 호흡 곤란 같은 증상이 나타난다.";
const p4s5 = "이처럼 면역 체계는 우리 몸을 보호하는 핵심적인 기능을 수행하지만, 그 균형이 깨지면 오히려 건강을 해치는 원인이 될 수 있으므로 면역 체계의 적절한 조절이 중요하다.";

addStep("p4", p4s1, {
  prompt: "첫 문장이 제기하는 내용으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "면역 체계가 항상 올바르게 작동하는 것은 아니라는 것이다." },
    { id: "B", text: "면역 체계는 언제나 완벽하게 작동한다는 것이다." },
    { id: "C", text: "면역 체계는 외부 도움이 있어야만 작동한다는 것이다." },
    { id: "D", text: "면역 체계의 오작동은 매우 드문 현상이라는 것이다." }
  ],
  answerId: "A"
});
addStep("p4", p4s2, {
  prompt: "둘째 문장이 설명하는 자가 면역 질환의 원인과 예로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "정상 세포를 병원체로 잘못 인식하여 공격하며, 류머티즘 관절염과 루푸스가 대표적이다." },
    { id: "B", text: "병원체가 면역 세포를 파괴하며, 감기와 독감이 대표적이다." },
    { id: "C", text: "면역 반응이 약해져 감염에 취약해지며, 암이 대표적이다." },
    { id: "D", text: "해롭지 않은 물질에 과도하게 반응하며, 알레르기가 대표적이다." }
  ],
  answerId: "A"
});
addStep("p4", p4s3, {
  prompt: "셋째 문장이 설명하는 과민 반응의 의미로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "면역 반응이 지나치게 강하게 일어나는 현상으로 알레르기라고도 한다." },
    { id: "B", text: "면역 반응이 너무 약해서 병원체를 막지 못하는 현상이다." },
    { id: "C", text: "면역 체계가 자기 세포를 공격하는 현상이다." },
    { id: "D", text: "면역 체계가 완전히 정지하는 현상이다." }
  ],
  answerId: "A"
});
addStep("p4", p4s4, {
  prompt: "넷째 문장이 설명하는 알레르기의 구체적 증상으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "해롭지 않은 물질에 과도하게 반응하여 재채기, 두드러기, 호흡 곤란 등이 나타난다." },
    { id: "B", text: "세균에 감염되어 고열과 근육통이 나타난다." },
    { id: "C", text: "면역 세포가 부족해져 감염에 취약해진다." },
    { id: "D", text: "자기 세포를 공격하여 관절에 통증이 생긴다." }
  ],
  answerId: "A"
});
addStep("p4", p4s5, {
  prompt: "마지막 문장이 전달하는 핵심 내용으로 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "면역 체계는 보호 기능을 수행하지만, 균형이 깨지면 건강을 해칠 수 있으므로 적절한 조절이 중요하다." },
    { id: "B", text: "면역 체계는 어떤 경우에도 건강에 해가 되지 않는다." },
    { id: "C", text: "면역 체계의 균형은 자동으로 유지되므로 걱정할 필요가 없다." },
    { id: "D", text: "면역 체계가 약해지면 보호 기능만 강화된다." }
  ],
  answerId: "A"
});
addParagraphSummary("p4", {
  prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  choices: [
    { id: "A", text: "면역 체계가 오작동하면 자가 면역 질환이나 알레르기가 발생할 수 있어 균형 유지가 중요하다." },
    { id: "B", text: "자가 면역 질환과 알레르기는 완전히 동일한 원인으로 발생한다." },
    { id: "C", text: "면역 체계의 오작동은 현대 의학으로 완전히 해결되었다." },
    { id: "D", text: "알레르기는 면역 체계가 약해서 발생하는 질환이다." }
  ],
  answerId: "A"
});

// ─── 복기 (recall): 정확히 8카드 ───
const recall = {
  cards: [
    { id: "c1", text: "우리 몸은 병원체에 대항하기 위해 면역 체계를 갖추고 있으며, 이는 선천 면역과 적응 면역으로 나뉜다." },
    { id: "c2", text: "선천 면역은 태어날 때부터 갖고 있는 비특이적 방어 기제로, 피부·점막의 장벽과 식세포 작용으로 병원체를 제거하지만 구별 능력이 제한적이다." },
    { id: "c3", text: "적응 면역은 특정 병원체를 인식하고 기억하는 정교한 체계이며, B 림프구와 T 림프구가 핵심이다." },
    { id: "c4", text: "B 림프구는 항체로 병원체를 무력화하는 체액성 면역, T 림프구는 감염 세포를 파괴하는 세포성 면역을 담당한다." },
    { id: "c5", text: "처음 감염 시 수일이 걸리는 일차 면역 반응 과정에서 기억 세포가 형성되어 오랫동안 체내에 남는다." },
    { id: "c6", text: "같은 병원체 재침입 시 기억 세포가 빠르게 활성화되는 이차 면역 반응이 일어나며, 백신은 이 원리를 활용한다." },
    { id: "c7", text: "면역 체계가 자기 세포를 공격하면 자가 면역 질환, 해롭지 않은 물질에 과도하게 반응하면 알레르기가 발생한다." },
    { id: "c8", text: "면역 체계는 보호 기능을 수행하지만, 균형이 깨지면 오히려 건강을 해칠 수 있으므로 적절한 조절이 중요하다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// ─── 확인 (confirm): 8문항 ───
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "면역 체계는 크게 어떤 두 가지로 나뉘나요?",
      answerText: "선천 면역과 적응 면역",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "선천 면역과 적응 면역")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "체내로 들어온 병원체를 면역 세포가 잡아먹는 작용을 무엇이라 하나요?",
      answerText: "식세포 작용",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "식세포 작용")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "B 림프구가 담당하는 면역의 종류를 무엇이라 하나요?",
      answerText: "체액성 면역",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "체액성 면역")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "T 림프구가 수행하는 면역의 종류를 무엇이라 하나요?",
      answerText: "세포성 면역",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "세포성 면역")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "처음 병원체에 감염되었을 때 일어나는 면역 반응을 무엇이라 하나요?",
      answerText: "일차 면역 반응",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "일차 면역 반응")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "이차 면역 반응의 원리를 이용한 예방 의학적 방법은 무엇인가요?",
      answerText: "백신",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "바로 백신")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "면역 체계가 자기 몸의 정상 세포를 공격할 때 발생하는 질환을 무엇이라 하나요?",
      answerText: "자가 면역 질환",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "자가 면역 질환")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q8",
      prompt: "면역 반응이 지나치게 강하게 일어나는 것을 무엇이라 하나요?",
      answerText: "과민 반응 또는 알레르기",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "과민 반응 또는 알레르기")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

// ─── 콘텐츠 조립 ───
const content = {
  contentId: "dr-w1-005",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 5 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "WITTGENSTEIN_1",
  schoolGradeRange: { min: 9, max: 10 },
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
    confirm
  }
};

// static 파일 저장
const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1');
fs.mkdirSync(staticDir, { recursive: true });
fs.writeFileSync(path.join(staticDir, '005.json'), JSON.stringify(content, null, 2), 'utf8');
console.log("005.json 저장 완료");

// 배치 파일 업데이트
const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-wittgenstein1.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const idx = batch.items.findIndex(i => i.day_index === 5 && i.level_id === "WITTGENSTEIN_1");
const batchItem = {
  content_type: "DAILY_READING",
  level_id: "WITTGENSTEIN_1",
  area: "READING",
  sub_area: "NONFICTION",
  day_index: 5,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
if (idx >= 0) {
  batch.items[idx] = batchItem;
} else {
  batch.items.push(batchItem);
}
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log("배치 파일 Day 5 업데이트 완료");
console.log("intensive steps:", timeline.length);
console.log("recall cards:", recall.cards.length);
console.log("confirm questions:", confirm.questions.length);
