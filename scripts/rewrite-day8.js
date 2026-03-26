const fs = require('fs');
const path = require('path');

// ─── 지문: 환경 - 탄소 순환과 기후 변화 (비문학, 고1~2 수준, ~1400자) ───
const paragraphs = [
  {
    id: "p1",
    text: "탄소는 지구상의 모든 생명체를 구성하는 핵심 원소이며, 대기, 해양, 토양, 생물권 사이를 끊임없이 이동한다. 이러한 탄소의 이동 과정을 탄소 순환이라 하며, 이는 지구 환경의 안정성을 유지하는 데 매우 중요한 역할을 한다. 식물은 광합성을 통해 대기 중의 이산화 탄소를 흡수하고 유기물을 합성하며, 동물은 식물을 먹어 탄소를 체내에 저장한다. 생물이 호흡할 때와 사체 등 유기물이 미생물에 의해 분해될 때 탄소는 이산화 탄소의 형태로 다시 대기 중으로 방출된다. 이처럼 자연 상태에서 탄소 순환은 흡수와 방출이 대체로 균형을 이루며 대기 중 이산화 탄소의 농도를 일정하게 유지하는 역할을 해 왔다."
  },
  {
    id: "p2",
    text: "그런데 산업 혁명 이후 인간 활동이 이 균형을 깨뜨리기 시작했다. 석탄, 석유, 천연가스 같은 화석 연료는 수억 년 전 생물의 유해가 지하에 매몰되어 형성된 것인데, 이를 발전소와 공장, 자동차 등에서 대규모로 연소하면서 지하에 오랫동안 묻혀 있던 탄소가 이산화 탄소로 대기 중에 급격히 방출되었다. 이와 함께 산림을 벌채하여 농경지나 도시로 전환하는 행위도 탄소 방출을 가속화하였다. 나무는 광합성으로 이산화 탄소를 흡수하는 탄소 흡수원인데, 산림이 줄어들면 이 흡수 기능이 약화되기 때문이다. 그 결과 대기 중 이산화 탄소의 농도가 산업 혁명 이전에 비해 약 50퍼센트 이상 증가하였다."
  },
  {
    id: "p3",
    text: "대기 중 이산화 탄소 농도의 증가는 온실 효과를 강화하여 지구 평균 기온을 상승시킨다. 온실 효과란 대기 중의 이산화 탄소와 메탄 등 온실 가스가 지표에서 방출되는 적외선 복사열을 흡수한 뒤 일부를 다시 지표로 되돌려 보내어 지구의 온도를 일정 수준으로 유지하는 현상이다. 적정 수준의 온실 효과는 지구가 생물이 살 수 있는 온도를 유지하는 데 필수적이지만, 온실 가스의 농도가 지나치게 높아지면 열이 과도하게 갇혀 기온이 비정상적으로 상승하게 된다. 이러한 지구 온난화는 극지방의 빙하를 녹이고 해수면을 상승시키며, 가뭄, 폭염, 홍수 같은 극단적 기상 현상의 빈도와 강도를 높이는 원인이 된다."
  },
  {
    id: "p4",
    text: "기후 변화에 대응하기 위해 국제 사회는 탄소 배출을 줄이기 위한 다양한 노력을 기울이고 있다. 가장 근본적인 방법은 화석 연료의 사용 비중을 줄이고 태양광이나 풍력 같은 재생 에너지의 비중을 점진적으로 확대하여 에너지 체계를 전환하는 것이다. 또한 기존 산림을 보전하고 새로운 나무를 심어 탄소 흡수원을 확대하는 것도 중요한 전략에 해당한다. 이와 더불어 탄소 포집 및 저장 기술이라는 새로운 기술도 활발히 개발되고 있는데, 이는 산업 시설에서 발생하는 이산화 탄소를 포집하여 지하의 안정된 지층에 저장함으로써 대기 중으로의 방출을 방지하는 기술이다. 이처럼 탄소 순환의 균형을 회복하기 위해서는 에너지 전환, 산림 보전, 기술 개발 등 다방면의 노력이 종합적으로 이루어져야 한다."
  }
];

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log("총 글자 수:", totalLen);
if (totalLen < 1350 || totalLen > 1450) console.warn("경고: 1400±50 범위 밖!");

function findRange(pid, search) {
  const p = paragraphs.find(x => x.id === pid);
  const s = p.text.indexOf(search);
  if (s === -1) throw new Error(`"${search}" not found in ${pid}`);
  return { paragraphId: pid, start: s, end: s + search.length };
}

const timeline = [];
let stepNum = 1;
function addStep(pid, sentence, q) { const r = findRange(pid, sentence); timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [r] }, question: { ...q, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true } } }); stepNum++; }
function addPS(pid, q) { const p = paragraphs.find(x => x.id === pid); timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: pid, start: 0, end: p.text.length }] }, question: { ...q, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true } } }); stepNum++; }

// p1
addStep("p1", "탄소는 지구상의 모든 생명체를 구성하는 핵심 원소이며, 대기, 해양, 토양, 생물권 사이를 끊임없이 이동한다.", { prompt: "첫 문장이 설명하는 탄소의 특성으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "생명체의 핵심 원소로서 대기, 해양, 토양, 생물권 사이를 끊임없이 이동한다." }, { id: "B", text: "오직 대기 중에만 존재하는 원소이다." }, { id: "C", text: "생명체와 무관한 무기물에만 포함된 원소이다." }, { id: "D", text: "한곳에 고정되어 이동하지 않는 원소이다." }], answerId: "A" });
addStep("p1", "이러한 탄소의 이동 과정을 탄소 순환이라 하며, 이는 지구 환경의 안정성을 유지하는 데 매우 중요한 역할을 한다.", { prompt: "둘째 문장이 정의하는 개념으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "탄소의 이동 과정을 탄소 순환이라 하며 지구 환경의 안정성 유지에 중요하다." }, { id: "B", text: "탄소가 한 곳에 축적되는 과정을 탄소 순환이라 한다." }, { id: "C", text: "이산화 탄소가 분해되는 과정을 탄소 순환이라 한다." }, { id: "D", text: "탄소가 소멸하는 과정을 탄소 순환이라 한다." }], answerId: "A" });
addStep("p1", "식물은 광합성을 통해 대기 중의 이산화 탄소를 흡수하고 유기물을 합성하며, 동물은 식물을 먹어 탄소를 체내에 저장한다.", { prompt: "셋째 문장이 설명하는 탄소 흡수 과정으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "식물이 광합성으로 이산화 탄소를 흡수하고, 동물이 식물을 먹어 탄소를 저장한다." }, { id: "B", text: "동물이 광합성을 통해 탄소를 흡수한다." }, { id: "C", text: "식물이 호흡으로 탄소를 흡수한다." }, { id: "D", text: "탄소는 해양에서만 흡수된다." }], answerId: "A" });
addStep("p1", "생물이 호흡할 때와 사체 등 유기물이 미생물에 의해 분해될 때 탄소는 이산화 탄소의 형태로 다시 대기 중으로 방출된다.", { prompt: "넷째 문장이 설명하는 탄소 방출 과정으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "호흡과 미생물에 의한 유기물 분해를 통해 이산화 탄소로 대기에 방출된다." }, { id: "B", text: "광합성을 통해 산소 형태로 대기에 방출된다." }, { id: "C", text: "탄소는 방출되지 않고 영구히 저장된다." }, { id: "D", text: "해양에서만 탄소가 방출된다." }], answerId: "A" });
addStep("p1", "이처럼 자연 상태에서 탄소 순환은 흡수와 방출이 대체로 균형을 이루며 대기 중 이산화 탄소의 농도를 일정하게 유지하는 역할을 해 왔다.", { prompt: "다섯째 문장이 강조하는 자연 탄소 순환의 특징으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "흡수와 방출이 균형을 이루어 이산화 탄소 농도를 일정하게 유지한다." }, { id: "B", text: "방출이 항상 흡수보다 많다." }, { id: "C", text: "흡수가 항상 방출보다 많다." }, { id: "D", text: "이산화 탄소 농도와 무관하다." }], answerId: "A" });
addPS("p1", { prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "탄소는 생태계 내에서 순환하며, 자연 상태에서는 흡수와 방출의 균형이 유지된다." }, { id: "B", text: "탄소 순환은 인간 활동에 의해서만 이루어진다." }, { id: "C", text: "탄소는 이동하지 않고 한곳에 고정되어 있다." }, { id: "D", text: "자연 상태에서도 탄소의 흡수와 방출은 항상 불균형하다." }], answerId: "A" });

// p2
addStep("p2", "그런데 산업 혁명 이후 인간 활동이 이 균형을 깨뜨리기 시작했다.", { prompt: "첫 문장이 제기하는 문제로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "산업 혁명 이후 인간 활동이 탄소 순환의 균형을 깨뜨렸다." }, { id: "B", text: "산업 혁명으로 탄소 순환이 더욱 안정되었다." }, { id: "C", text: "인간 활동은 탄소 순환에 영향을 주지 않는다." }, { id: "D", text: "산업 혁명 이전에 이미 균형이 깨져 있었다." }], answerId: "A" });
addStep("p2", "석탄, 석유, 천연가스 같은 화석 연료는 수억 년 전 생물의 유해가 지하에 매몰되어 형성된 것인데, 이를 발전소와 공장, 자동차 등에서 대규모로 연소하면서 지하에 오랫동안 묻혀 있던 탄소가 이산화 탄소로 대기 중에 급격히 방출되었다.", { prompt: "둘째 문장이 설명하는 이산화 탄소 급증의 원인으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "지하에 묻힌 화석 연료를 대규모로 연소하여 탄소가 대기에 급격히 방출되었다." }, { id: "B", text: "자연적인 화산 폭발로 탄소가 방출되었다." }, { id: "C", text: "식물의 광합성이 줄어들어 탄소가 방출되었다." }, { id: "D", text: "해양에서 탄소가 대량으로 방출되었다." }], answerId: "A" });
addStep("p2", "이와 함께 산림을 벌채하여 농경지나 도시로 전환하는 행위도 탄소 방출을 가속화하였다.", { prompt: "셋째 문장이 지적하는 추가적 탄소 방출 원인으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "산림을 벌채하여 농경지나 도시로 전환한 것이다." }, { id: "B", text: "해양 생물이 증가한 것이다." }, { id: "C", text: "새로운 산림을 조성한 것이다." }, { id: "D", text: "재생 에너지 사용이 늘어난 것이다." }], answerId: "A" });
addStep("p2", "나무는 광합성으로 이산화 탄소를 흡수하는 탄소 흡수원인데, 산림이 줄어들면 이 흡수 기능이 약화되기 때문이다.", { prompt: "넷째 문장이 설명하는 산림 벌채의 문제로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "탄소 흡수원인 산림이 줄어 이산화 탄소 흡수 기능이 약화된다." }, { id: "B", text: "산림이 줄어들면 탄소 방출이 줄어든다." }, { id: "C", text: "나무는 탄소를 방출하므로 벌채하면 탄소가 줄어든다." }, { id: "D", text: "산림 벌채는 이산화 탄소 농도에 영향을 주지 않는다." }], answerId: "A" });
addStep("p2", "그 결과 대기 중 이산화 탄소의 농도가 산업 혁명 이전에 비해 약 50퍼센트 이상 증가하였다.", { prompt: "다섯째 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "대기 중 이산화 탄소 농도가 산업 혁명 이전보다 약 50퍼센트 이상 증가했다." }, { id: "B", text: "이산화 탄소 농도가 줄어들었다." }, { id: "C", text: "이산화 탄소 농도는 변함이 없다." }, { id: "D", text: "이산화 탄소 농도가 약 10퍼센트 감소했다." }], answerId: "A" });
addPS("p2", { prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "화석 연료 연소와 산림 벌채로 탄소 순환의 균형이 깨져 이산화 탄소 농도가 급증했다." }, { id: "B", text: "산업 혁명 이후 탄소 순환이 더욱 안정되었다." }, { id: "C", text: "산림 벌채만이 이산화 탄소 증가의 유일한 원인이다." }, { id: "D", text: "화석 연료는 탄소 순환과 무관하다." }], answerId: "A" });

// p3
addStep("p3", "대기 중 이산화 탄소 농도의 증가는 온실 효과를 강화하여 지구 평균 기온을 상승시킨다.", { prompt: "첫 문장이 말하는 이산화 탄소 증가의 결과로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "온실 효과가 강화되어 지구 평균 기온이 상승한다." }, { id: "B", text: "온실 효과가 약화되어 기온이 하락한다." }, { id: "C", text: "이산화 탄소는 기온에 영향을 미치지 않는다." }, { id: "D", text: "기온이 상승하면 이산화 탄소가 줄어든다." }], answerId: "A" });
addStep("p3", "온실 효과란 대기 중의 이산화 탄소와 메탄 등 온실 가스가 지표에서 방출되는 적외선 복사열을 흡수한 뒤 일부를 다시 지표로 되돌려 보내어 지구의 온도를 일정 수준으로 유지하는 현상이다.", { prompt: "둘째 문장이 정의하는 온실 효과의 의미로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "온실 가스가 지표의 복사열을 흡수하고 일부를 되돌려 보내 지구 온도를 유지하는 현상이다." }, { id: "B", text: "온실 가스가 열을 방출하여 지구를 냉각하는 현상이다." }, { id: "C", text: "지구가 태양열을 완전히 차단하는 현상이다." }, { id: "D", text: "대기가 없어도 발생하는 자연 현상이다." }], answerId: "A" });
addStep("p3", "적정 수준의 온실 효과는 지구가 생물이 살 수 있는 온도를 유지하는 데 필수적이지만, 온실 가스의 농도가 지나치게 높아지면 열이 과도하게 갇혀 기온이 비정상적으로 상승하게 된다.", { prompt: "셋째 문장이 설명하는 온실 효과의 이중적 측면으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "적정 수준은 필수적이나 농도가 과도하면 비정상적 기온 상승을 초래한다." }, { id: "B", text: "온실 효과는 항상 해로운 현상이다." }, { id: "C", text: "온실 효과는 항상 유익한 현상이다." }, { id: "D", text: "온실 가스 농도와 기온은 무관하다." }], answerId: "A" });
addStep("p3", "이러한 지구 온난화는 극지방의 빙하를 녹이고 해수면을 상승시키며, 가뭄, 폭염, 홍수 같은 극단적 기상 현상의 빈도와 강도를 높이는 원인이 된다.", { prompt: "넷째 문장이 열거하는 지구 온난화의 영향으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "빙하 융해, 해수면 상승, 가뭄·폭염·홍수 등 극단적 기상 현상 증가이다." }, { id: "B", text: "빙하가 확대되고 해수면이 하강한다." }, { id: "C", text: "극단적 기상 현상이 줄어든다." }, { id: "D", text: "기온 상승과 기상 현상은 무관하다." }], answerId: "A" });
addPS("p3", { prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "이산화 탄소 증가로 온실 효과가 강화되어 지구 온난화와 극단적 기상 현상이 발생한다." }, { id: "B", text: "온실 효과는 항상 지구에 유익하다." }, { id: "C", text: "지구 온난화는 자연적인 현상으로 인간과 무관하다." }, { id: "D", text: "온실 가스가 증가하면 기온이 오히려 하락한다." }], answerId: "A" });

// p4
addStep("p4", "기후 변화에 대응하기 위해 국제 사회는 탄소 배출을 줄이기 위한 다양한 노력을 기울이고 있다.", { prompt: "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "국제 사회가 탄소 배출을 줄이기 위한 다양한 노력을 하고 있다." }, { id: "B", text: "기후 변화 대응은 개인의 몫이다." }, { id: "C", text: "국제 사회는 기후 변화에 관심이 없다." }, { id: "D", text: "탄소 배출을 줄일 방법은 존재하지 않는다." }], answerId: "A" });
addStep("p4", "가장 근본적인 방법은 화석 연료의 사용 비중을 줄이고 태양광이나 풍력 같은 재생 에너지의 비중을 점진적으로 확대하여 에너지 체계를 전환하는 것이다.", { prompt: "둘째 문장에서 가장 근본적인 대응 방법으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "화석 연료 비중을 줄이고 재생 에너지 비중을 확대하여 에너지 체계를 전환하는 것이다." }, { id: "B", text: "화석 연료 사용을 늘리는 것이다." }, { id: "C", text: "원자력 발전소를 모두 폐쇄하는 것이다." }, { id: "D", text: "에너지 사용 자체를 중단하는 것이다." }], answerId: "A" });
addStep("p4", "또한 기존 산림을 보전하고 새로운 나무를 심어 탄소 흡수원을 확대하는 것도 중요한 전략에 해당한다.", { prompt: "셋째 문장이 소개하는 추가 전략으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "기존 산림 보전과 나무 심기로 탄소 흡수원을 확대하는 것이다." }, { id: "B", text: "산림을 더 많이 벌채하는 것이다." }, { id: "C", text: "탄소 흡수원을 축소하는 것이다." }, { id: "D", text: "해양 오염을 방치하는 것이다." }], answerId: "A" });
addStep("p4", "이와 더불어 탄소 포집 및 저장 기술이라는 새로운 기술도 활발히 개발되고 있는데, 이는 산업 시설에서 발생하는 이산화 탄소를 포집하여 지하의 안정된 지층에 저장함으로써 대기 중으로의 방출을 방지하는 기술이다.", { prompt: "넷째 문장이 소개하는 새로운 기술로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "이산화 탄소를 포집하여 지하의 안정된 지층에 저장하는 탄소 포집 및 저장 기술이다." }, { id: "B", text: "이산화 탄소를 대기 중에 더 많이 방출하는 기술이다." }, { id: "C", text: "화석 연료의 생산량을 늘리는 기술이다." }, { id: "D", text: "온실 가스를 우주로 보내는 기술이다." }], answerId: "A" });
addStep("p4", "이처럼 탄소 순환의 균형을 회복하기 위해서는 에너지 전환, 산림 보전, 기술 개발 등 다방면의 노력이 종합적으로 이루어져야 한다.", { prompt: "마지막 문장이 주장하는 내용으로 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "에너지 전환, 산림 보전, 기술 개발 등 다방면의 종합적 노력이 필요하다." }, { id: "B", text: "한 가지 방법만으로 탄소 문제를 해결할 수 있다." }, { id: "C", text: "탄소 순환의 균형 회복은 불가능하다." }, { id: "D", text: "기술 개발만이 유일한 해결책이다." }], answerId: "A" });
addPS("p4", { prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?", choices: [{ id: "A", text: "에너지 전환, 산림 보전, 탄소 포집 기술 등 다방면의 노력으로 탄소 순환의 균형을 회복해야 한다." }, { id: "B", text: "기후 변화 대응은 불필요하다." }, { id: "C", text: "화석 연료 사용을 계속 늘려야 한다." }, { id: "D", text: "산림 벌채를 확대해야 한다." }], answerId: "A" });

const recall = {
  cards: [
    { id: "c1", text: "탄소는 대기, 해양, 토양, 생물권 사이를 순환하며, 자연 상태에서는 흡수와 방출이 균형을 이룬다." },
    { id: "c2", text: "산업 혁명 이후 화석 연료 연소와 산림 벌채로 이 균형이 깨져 이산화 탄소 농도가 급증했다." },
    { id: "c3", text: "화석 연료는 지하에 묻힌 탄소를 대기로 방출하고, 산림 벌채는 탄소 흡수원을 줄인다." },
    { id: "c4", text: "이산화 탄소 증가는 온실 효과를 강화하여 지구 평균 기온을 상승시킨다." },
    { id: "c5", text: "지구 온난화는 빙하 융해, 해수면 상승, 극단적 기상 현상의 빈도와 강도를 높인다." },
    { id: "c6", text: "기후 변화 대응의 근본적 방법은 화석 연료를 줄이고 재생 에너지로 전환하는 것이다." },
    { id: "c7", text: "산림 보전과 탄소 포집 및 저장 기술도 중요한 탄소 감축 전략이다." },
    { id: "c8", text: "탄소 순환의 균형 회복을 위해 에너지 전환, 산림 보전, 기술 개발 등 종합적 노력이 필요하다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

const confirm = {
  questions: [
    { id: "q1", prompt: "탄소가 대기, 해양, 토양, 생물권 사이를 이동하는 과정을 무엇이라 하나요?", answerText: "탄소 순환", answerMatchMode: "ANY", answerRanges: [findRange("p1", "탄소 순환")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q2", prompt: "수억 년 전 생물의 유해가 지하에서 형성된 연료를 통칭하여 무엇이라 하나요?", answerText: "화석 연료", answerMatchMode: "ANY", answerRanges: [findRange("p2", "화석 연료")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q3", prompt: "광합성으로 이산화 탄소를 흡수하는 나무를 무엇이라 부르나요?", answerText: "탄소 흡수원", answerMatchMode: "ANY", answerRanges: [findRange("p2", "탄소 흡수원")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q4", prompt: "온실 가스가 지표의 열을 흡수하여 지구 온도를 유지하는 현상을 무엇이라 하나요?", answerText: "온실 효과", answerMatchMode: "ANY", answerRanges: [findRange("p3", "온실 효과")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q5", prompt: "온실 가스 농도가 과도하게 높아져 기온이 상승하는 현상을 무엇이라 하나요?", answerText: "지구 온난화", answerMatchMode: "ANY", answerRanges: [findRange("p3", "지구 온난화")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q6", prompt: "화석 연료 대신 사용하려는 태양광·풍력 같은 에너지를 무엇이라 하나요?", answerText: "재생 에너지", answerMatchMode: "ANY", answerRanges: [findRange("p4", "재생 에너지")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q7", prompt: "산업 시설의 이산화 탄소를 포집하여 지하에 저장하는 기술을 무엇이라 하나요?", answerText: "탄소 포집 및 저장 기술", answerMatchMode: "ANY", answerRanges: [findRange("p4", "탄소 포집 및 저장 기술")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true },
    { id: "q8", prompt: "탄소 순환의 균형 회복을 위해 필요한 세 가지 노력은 무엇인가요?", answerText: "에너지 전환, 산림 보전, 기술 개발", answerMatchMode: "ANY", answerRanges: [findRange("p4", "에너지 전환, 산림 보전, 기술 개발")], scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true }
  ]
};

const content = {
  contentId: "dr-w1-008", contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 8 비문학", description: "일일 독해 - 정독·복기·확인",
  targetLevel: "WITTGENSTEIN_1", schoolGradeRange: { min: 9, max: 10 },
  area: "READING", subArea: "NONFICTION", competencies: ["READING"], tags: ["daily"],
  access: { mode: "FREE" }, seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300, assets: {},
  payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline }, recall, confirm }
};

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1');
fs.mkdirSync(staticDir, { recursive: true });
fs.writeFileSync(path.join(staticDir, '008.json'), JSON.stringify(content, null, 2), 'utf8');
console.log("008.json 저장 완료");

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-wittgenstein1.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const idx = batch.items.findIndex(i => i.day_index === 8 && i.level_id === "WITTGENSTEIN_1");
const batchItem = { content_type: "DAILY_READING", level_id: "WITTGENSTEIN_1", area: "READING", sub_area: "NONFICTION", day_index: 8, module_key: "reading_training", schema_version: "1.0", content };
if (idx >= 0) batch.items[idx] = batchItem; else batch.items.push(batchItem);
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log("배치 파일 Day 8 업데이트 완료");
console.log("intensive steps:", timeline.length, "| recall:", recall.cards.length, "| confirm:", confirm.questions.length);
