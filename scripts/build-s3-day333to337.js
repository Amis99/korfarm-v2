const fs = require('fs');
const path = require('path');

// === 유틸리티 함수 ===
function findSentences(text) {
  const sentences = []; let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1; while (next < text.length && (text[next] === ' ' || text[next] === '\n')) next++; start = next;
    }
  }
  if (start < text.length) sentences.push({ start, end: text.length, text: text.substring(start) });
  return sentences;
}

function findRange(paragraphs, pid, searchText) {
  const para = paragraphs.find(p => p.id === pid);
  if (!para) throw new Error(`문단 ${pid} 없음`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText.substring(0, 30)}..." ${pid}에서 찾을 수 없음`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charLen(paragraphs) { return paragraphs.reduce((sum, p) => sum + p.text.length, 0); }

function buildTimeline(paragraphs) {
  let stepNum = 0; const timeline = [];
  paragraphs.forEach((para) => {
    const sents = findSentences(para.text);
    sents.forEach((sent) => { stepNum++; timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] } }); });
    stepNum++; timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] } });
  });
  return timeline;
}

function buildRecallCards(paragraphs) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length; const chunkSize = Math.ceil(totalLen / 8); const cards = [];
  for (let i = 0; i < 8; i++) { const s = i * chunkSize; const e = Math.min(s + chunkSize, totalLen); cards.push({ id: `c${i+1}`, text: fullText.substring(s, e) }); }
  return cards;
}

function makeConfirmQ(id, prompt, ranges) {
  return { id, prompt, answerRanges: ranges, scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: "ANY" };
}

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs); const cards = buildRecallCards(paragraphs);
  const nn = String(dayIndex).padStart(3, '0');
  return { contentId: `dr-s3-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(소쉬르 3) Day ${dayIndex} ${subAreaKo}`, description: "일일 독해 - 정독·복기·확인",
    targetLevel: "SAUSSURE_3", schoolGradeRange: { min: 5, max: 5 }, area: "READING", subArea,
    competencies: ["READING"], tags: ["daily"], access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 }, timeLimitSec: 480, assets: {},
    payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 }, confirm: { questions: confirmQuestions } }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return { content_type: "DAILY_READING", level_id: "SAUSSURE_3", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// === Day 333 (홀수 → 비문학) ===
function buildDay333() {
  const paragraphs = [
    { id: "p1", text: "지구의 바다는 전체 표면의 약 71퍼센트를 차지하고 있으며, 지구에 사는 생물의 대부분이 바다에서 살아간다. 바다는 깊이에 따라 햇빛이 닿는 곳과 닿지 않는 곳으로 나뉘는데, 햇빛이 닿는 얕은 바다에서는 해조류와 산호가 자라고 작은 물고기들이 무리를 지어 모여든다. 이러한 얕은 바다를 해양 생태학에서는 유광층이라고 부르며, 유광층에는 식물성 플랑크톤이 광합성을 하여 바다 전체에 산소를 공급하는 역할도 한다. 반면 수심이 약 이백 미터 이상인 깊은 바다에는 빛이 거의 들어오지 않아 어둡고 차갑지만, 그곳에서도 심해 생물들이 독특한 방식으로 살아가고 있다. 예를 들어 아귀라는 물고기는 머리에 달린 작은 발광 기관을 이용하여 먹이를 유인하며, 대왕오징어는 접시만큼 커다란 눈으로 깜깜한 물속에서도 주위를 살핀다." },
    { id: "p2", text: "바다는 지구의 기후를 조절하는 데에도 매우 중요한 역할을 한다. 바닷물은 열을 흡수하고 저장하는 능력이 뛰어나서 여름에는 육지보다 시원하고 겨울에는 따뜻한 바람을 만들어 준다. 또한 바다에서 증발한 수증기가 구름이 되어 비를 내리게 하므로, 육지의 동식물에게 필요한 물을 공급하는 순환 과정에도 바다가 깊이 관여하고 있다. 그렇기 때문에 바다가 오염되면 기후 변화가 빨라지고 물의 순환에도 문제가 생길 수 있다. 이처럼 바다는 생물에게 서식지를 제공할 뿐 아니라 지구 전체의 환경을 유지하는 데 없어서는 안 될 소중한 존재이다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '바다'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "바다는 깊이에 따라"),
      findRange(paragraphs, "p2", "바다는 지구의 기후를 조절하는"),
    ]),
    makeConfirmQ("q2", "지문에서 '햇빛'이 포함된 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "햇빛이 닿는 곳과 닿지 않는 곳으로"),
      findRange(paragraphs, "p1", "햇빛이 닿는 얕은 바다에서는"),
    ]),
    makeConfirmQ("q3", "지문에서 '유광층'이 포함된 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "유광층이라고 부르며"),
      findRange(paragraphs, "p1", "유광층에는 식물성 플랑크톤이 광합성을 하여"),
    ]),
    makeConfirmQ("q4", "지문에서 심해 생물의 예시를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "아귀라는 물고기는 머리에 달린 작은 발광 기관을 이용하여 먹이를 유인하며"),
    ]),
    makeConfirmQ("q5", "지문에서 '수증기'가 포함된 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "바다에서 증발한 수증기가 구름이 되어 비를 내리게 하므로"),
    ]),
    makeConfirmQ("q6", "지문에서 바다의 역할을 종합하는 마지막 문장을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "바다는 생물에게 서식지를 제공할 뿐 아니라 지구 전체의 환경을 유지하는 데 없어서는 안 될 소중한 존재이다"),
    ]),
  ];
  const content = assembleFull(333, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === Day 334 (짝수 → 문학) ===
function buildDay334() {
  const paragraphs = [
    { id: "p1", text: "은서는 방학 동안 할머니 댁에서 지내게 되었다. 할머니 댁 뒤편에는 커다란 감나무가 한 그루 서 있었는데, 은서는 어릴 적 그 나무 아래에서 놀던 기억이 또렷했다. 늦가을이라 감나무에는 주황빛 감이 주렁주렁 매달려 있었고, 바람이 불 때마다 잎사귀가 살랑살랑 흔들렸다. 할머니는 은서가 도착하자마자 감나무 이야기를 꺼내셨다. 올해는 감이 유난히 많이 열렸는데, 꼭대기에 있는 감은 따지 말고 까치에게 남겨 두라는 것이었다. 은서는 까치밥이라는 말을 처음 들었지만, 할머니가 예전부터 그렇게 해 왔다는 이야기에 고개를 끄덕였다." },
    { id: "p2", text: "며칠 뒤 은서는 할머니와 함께 감을 땄다. 긴 장대로 아래쪽 감부터 조심스럽게 따서 대나무 바구니에 차곡차곡 담았다. 할머니는 잘 익은 감을 골라 은서의 손에 하나 쥐어 주시며 먹어 보라고 하셨다. 한 입 베어 물자 달콤한 즙이 입안 가득 퍼졌다. 은서가 꼭대기 감을 가리키며 저것도 딸 수 있겠다고 하자, 할머니는 웃으며 고개를 저으셨다. 겨울이 오면 먹을 것이 없어진 까치들이 저 감을 먹으러 찾아온다고 하셨다. 은서는 자연과 함께 나누는 할머니의 넉넉한 마음이 따뜻하게 느껴졌다." },
    { id: "p3", text: "집으로 돌아온 은서는 학교 일기장에 할머니와 감을 딴 이야기를 정성껏 적었다. 마지막 줄에 나도 까치처럼 누군가에게 나눌 줄 아는 사람이 되고 싶다고 쓰며 일기장을 덮었다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '감나무'가 포함된 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "커다란 감나무가 한 그루 서 있었는데"),
      findRange(paragraphs, "p1", "감나무 이야기를 꺼내셨다"),
    ]),
    makeConfirmQ("q2", "지문에서 '까치밥'이 포함된 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "까치밥이라는 말을 처음 들었지만"),
    ]),
    makeConfirmQ("q3", "지문에서 감나무의 모습이 묘사된 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "감나무에는 주황빛 감이 주렁주렁 매달려 있었고, 바람이 불 때마다 잎사귀가 살랑살랑 흔들렸다"),
    ]),
    makeConfirmQ("q4", "지문에서 은서가 감을 딴 장면을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "긴 장대로 아래쪽 감부터 조심스럽게 따서 대나무 바구니에 차곡차곡 담았다"),
    ]),
    makeConfirmQ("q5", "지문에서 할머니가 꼭대기 감을 남겨 두라고 한 이유를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "겨울이 오면 먹을 것이 없어진 까치들이 저 감을 먹으러 찾아온다고 하셨다"),
    ]),
    makeConfirmQ("q6", "지문에서 은서의 다짐이 나오는 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p3", "나도 까치처럼 누군가에게 나눌 줄 아는 사람이 되고 싶다고 쓰며"),
    ]),
  ];
  const content = assembleFull(334, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === Day 335 (홀수 → 비문학) ===
function buildDay335() {
  const paragraphs = [
    { id: "p1", text: "우리가 매일 사용하는 종이는 나무에서 만들어진다. 나무의 줄기를 잘게 부수어 펄프라는 물질을 만들고, 이 펄프를 물에 풀어 얇게 펴서 말리면 종이가 된다. 종이를 만드는 과정에서는 많은 양의 물과 전기가 사용되며, 펄프를 하얗게 만들기 위한 표백 과정에서 화학 약품이 쓰이기도 한다. 종이 한 장은 가볍고 얇지만, 우리나라에서 한 해 동안 사용하는 종이의 양은 수백만 톤에 이른다. 이렇게 많은 종이를 만들기 위해서는 엄청난 수의 나무가 필요하므로, 해마다 넓은 숲이 벌목되어 사라지는 문제가 생기기도 한다. 전 세계적으로 축구장 수만 개 넓이에 해당하는 숲이 종이 생산을 위해 매년 사라지고 있다고 한다." },
    { id: "p2", text: "숲이 줄어들면 공기 중의 이산화 탄소를 흡수할 나무가 부족해지고, 그 결과 지구 온난화가 더욱 심해질 수 있다. 나무가 줄어들수록 산소 발생량도 감소하여 공기의 질이 나빠진다. 또한 숲에 사는 동물과 식물의 서식지가 파괴되어 생태계의 균형이 무너질 위험도 커진다. 실제로 오랑우탄이나 호랑이 같은 야생 동물이 숲의 감소 때문에 살 곳을 잃고 멸종 위기에 놓인 사례가 있다. 이러한 문제를 줄이기 위해 우리는 종이를 아껴 쓰고, 이면지를 활용하며, 다 쓴 종이를 재활용 분리수거함에 넣는 습관을 길러야 한다. 작은 실천이라도 모이면 숲을 지키고 지구 환경을 보호하는 데 큰 도움이 된다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '펄프'가 포함된 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "펄프라는 물질을 만들고"),
      findRange(paragraphs, "p1", "펄프를 물에 풀어 얇게 펴서 말리면"),
      findRange(paragraphs, "p1", "펄프를 하얗게 만들기 위한"),
    ]),
    makeConfirmQ("q2", "지문에서 종이 사용량이 나오는 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "우리나라에서 한 해 동안 사용하는 종이의 양은 수백만 톤에 이른다"),
    ]),
    makeConfirmQ("q3", "지문에서 '이산화 탄소'가 포함된 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "이산화 탄소를 흡수할 나무가 부족해지고"),
    ]),
    makeConfirmQ("q4", "지문에서 멸종 위기 동물의 사례를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "오랑우탄이나 호랑이 같은 야생 동물이 숲의 감소 때문에 살 곳을 잃고 멸종 위기에 놓인 사례가 있다"),
    ]),
    makeConfirmQ("q5", "지문에서 종이를 아끼는 방법이 나오는 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "종이를 아껴 쓰고, 이면지를 활용하며, 다 쓴 종이를 재활용 분리수거함에 넣는 습관을 길러야 한다"),
    ]),
    makeConfirmQ("q6", "지문에서 글의 결론 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "작은 실천이라도 모이면 숲을 지키고 지구 환경을 보호하는 데 큰 도움이 된다"),
    ]),
  ];
  const content = assembleFull(335, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === Day 336 (짝수 → 문학) ===
function buildDay336() {
  const paragraphs = [
    { id: "p1", text: "준혁이는 학교 과학 시간에 모둠 발표를 맡게 되었다. 주제는 태양계 행성이었는데, 모둠원은 준혁이를 포함하여 네 명이었다. 준혁이는 인터넷에서 자료를 찾아 정리하는 일을, 수빈이는 행성 그림을 그리는 일을, 태민이는 발표 대본을 쓰는 일을, 지윤이는 교실 앞에 나가 발표를 하는 일을 각각 맡기로 했다. 처음에는 모두 의욕이 넘쳤지만, 준비 기간이 일주일밖에 남지 않자 서로 바쁘다며 미루기 시작했다. 특히 태민이는 학원 때문에 시간이 없다고 했고, 지윤이는 아직 대본이 없으니 연습을 할 수 없다며 불만을 드러냈다." },
    { id: "p2", text: "발표 이틀 전, 준혁이는 혼자 걱정이 되어 모둠원들에게 한 사람씩 메시지를 보냈다. 각자 맡은 부분을 내일까지 꼭 완성해 달라고 정중하게 부탁했다. 수빈이가 가장 먼저 태양계 행성의 크기를 비교하는 그림을 알록달록하게 완성해서 보내 주었고, 태민이도 학원이 끝난 뒤 밤늦게까지 대본을 정성껏 써서 보내왔다. 지윤이는 대본을 받자마자 거울 앞에서 손짓을 곁들여 가며 발표 연습을 시작했다. 발표 당일 아침, 네 명은 교실 한쪽에 모여 마지막으로 순서를 맞춰 보았다. 무대에 올라 서자 떨리는 마음이 들었지만, 서로의 노력에 깊은 고마움을 느끼며 자신감 있게 훌륭한 발표를 해냈다." },
    { id: "p3", text: "선생님은 모둠의 협동이 돋보인다며 반 전체 앞에서 칭찬해 주셨다. 준혁이는 혼자서는 할 수 없었던 일도 서로 믿고 함께하면 해낼 수 있다는 것을 깨달았다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 모둠 발표 주제가 나오는 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "주제는 태양계 행성이었는데"),
    ]),
    makeConfirmQ("q2", "지문에서 각자 역할 분담이 나오는 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "준혁이는 인터넷에서 자료를 찾아 정리하는 일을, 수빈이는 행성 그림을 그리는 일을, 태민이는 발표 대본을 쓰는 일을, 지윤이는 교실 앞에 나가 발표를 하는 일을 각각 맡기로 했다"),
    ]),
    makeConfirmQ("q3", "지문에서 모둠원들이 미룬 이유를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "태민이는 학원 때문에 시간이 없다고 했고"),
      findRange(paragraphs, "p1", "지윤이는 아직 대본이 없으니 연습을 할 수 없다며 불만을 드러냈다"),
    ]),
    makeConfirmQ("q4", "지문에서 준혁이가 모둠원에게 연락한 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "준혁이는 혼자 걱정이 되어 모둠원들에게 한 사람씩 메시지를 보냈다"),
    ]),
    makeConfirmQ("q5", "지문에서 수빈이가 완성한 그림 내용을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "태양계 행성의 크기를 비교하는 그림을 알록달록하게 완성해서 보내 주었고"),
    ]),
    makeConfirmQ("q6", "지문에서 준혁이가 깨달은 점을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p3", "혼자서는 할 수 없었던 일도 서로 믿고 함께하면 해낼 수 있다는 것을 깨달았다"),
    ]),
  ];
  const content = assembleFull(336, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === Day 337 (홀수 → 비문학) ===
function buildDay337() {
  const paragraphs = [
    { id: "p1", text: "곤충은 지구상에서 가장 종류가 많은 동물로, 지금까지 알려진 종만 해도 백만 종이 넘는다. 과학자들은 아직 발견되지 않은 곤충까지 합치면 실제로는 수백만 종에 이를 것으로 추정하고 있다. 곤충의 몸은 머리, 가슴, 배 세 부분으로 나뉘며, 가슴에는 세 쌍의 다리가 붙어 있다. 머리에는 한 쌍의 더듬이가 있어 냄새를 맡거나 주변 환경을 감지하는 데 사용한다. 대부분의 곤충은 날개를 가지고 있어 하늘을 날 수 있는데, 이것은 다른 무척추동물에서는 볼 수 없는 특별한 능력이다. 곤충은 크기가 작아서 적은 양의 먹이로도 살아갈 수 있으며, 어디서든 숨을 곳을 찾기 쉬워 사막, 열대 우림, 깊은 물속, 도시 한가운데 등 다양한 환경에 적응하여 살아간다." },
    { id: "p2", text: "곤충은 자연 생태계에서 매우 중요한 구실을 한다. 꿀벌과 나비는 꽃에서 꽃으로 이동하며 꽃가루를 옮겨 식물이 열매를 맺도록 도와주고, 개미와 딱정벌레는 죽은 동식물을 분해하여 땅을 기름지게 만든다. 또한 곤충은 새, 개구리, 도마뱀 같은 동물의 먹이가 되어 먹이 사슬의 중요한 고리 역할을 한다. 최근에는 농약 사용, 환경 오염, 서식지 파괴 등의 원인으로 곤충의 수가 급격히 줄어들고 있어 전 세계 과학자들이 우려하고 있다. 만약 곤충이 사라진다면 식물의 수분이 이루어지지 않고, 먹이 사슬이 끊어져 수많은 생물이 함께 위기에 처할 것이다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 곤충의 종류 수가 나오는 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "지금까지 알려진 종만 해도 백만 종이 넘는다"),
    ]),
    makeConfirmQ("q2", "지문에서 곤충의 몸 구조가 나오는 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "곤충의 몸은 머리, 가슴, 배 세 부분으로 나뉘며, 가슴에는 세 쌍의 다리가 붙어 있다"),
    ]),
    makeConfirmQ("q3", "지문에서 곤충이 적응하는 환경의 예시를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "사막, 열대 우림, 깊은 물속, 도시 한가운데 등 다양한 환경에 적응하여 살아간다"),
    ]),
    makeConfirmQ("q4", "지문에서 꿀벌과 나비의 역할이 나오는 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "꿀벌과 나비는 꽃에서 꽃으로 이동하며 꽃가루를 옮겨 식물이 열매를 맺도록 도와주고"),
    ]),
    makeConfirmQ("q5", "지문에서 곤충 수가 줄어드는 원인을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "농약 사용, 환경 오염, 서식지 파괴 등의 원인으로 곤충의 수가 급격히 줄어들고 있어"),
    ]),
    makeConfirmQ("q6", "지문에서 '먹이 사슬'이 포함된 부분을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "먹이 사슬의 중요한 고리 역할을 한다"),
      findRange(paragraphs, "p2", "먹이 사슬이 끊어져 수많은 생물이 함께 위기에 처할 것이다"),
    ]),
    makeConfirmQ("q7", "지문에서 곤충이 사라졌을 때 생기는 문제를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "곤충이 사라진다면 식물의 수분이 이루어지지 않고, 먹이 사슬이 끊어져 수많은 생물이 함께 위기에 처할 것이다"),
    ]),
  ];
  const content = assembleFull(337, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === 실행부 ===
const results = [
  { dayIndex: 333, ...buildDay333() }, { dayIndex: 334, ...buildDay334() },
  { dayIndex: 335, ...buildDay335() }, { dayIndex: 336, ...buildDay336() },
  { dayIndex: 337, ...buildDay337() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
if (!fs.existsSync(staticDir)) fs.mkdirSync(staticDir, { recursive: true });

const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

const newDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
fs.writeFileSync(path.join(newDir, 'batch-s3-333-337.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ batch-s3-333-337.json 생성 완료`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
