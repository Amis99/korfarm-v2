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

// === Day 323 (홀수 → 비문학) ===
function buildDay323() {
  const paragraphs = [
    { id: "p1", text: "소리는 물체가 떨리면서 만들어지는 진동이 공기 중으로 전달되는 현상이다. 우리가 말을 할 때 목 안의 성대가 떨리면서 소리가 나고 기타를 칠 때도 줄이 떨려서 소리가 발생한다. 이런 진동은 공기를 타고 파동의 형태로 퍼져 나가며 우리 귀에 도달하면 고막이 떨리면서 소리를 느끼게 된다. 진동이 빠르면 높은 소리가 나고 느리면 낮은 소리가 난다. 이처럼 소리의 높낮이를 결정하는 진동의 빠르기를 진동수라고 부른다." },
    { id: "p2", text: "소리는 공기뿐만 아니라 물이나 고체를 통해서도 전달된다. 수영장에서 물속에 귀를 대면 밖에서 나는 소리가 들리는 것은 물이 소리를 전달하기 때문이다. 쇠로 만든 울타리의 한쪽 끝을 두드리면 반대쪽 끝에서 금방 소리가 들리는데 이는 고체가 공기보다 소리를 더 빠르게 전달하기 때문이다. 반면 우주 공간에는 공기가 없기 때문에 소리가 전달되지 않는다. 그래서 우주 비행사들은 서로 이야기할 때 무선 통신 장비를 사용해야 한다." },
    { id: "p3", text: "소리의 크기는 진동의 폭인 진폭에 의해 결정된다. 진폭이 크면 큰 소리가 나고 진폭이 작으면 작은 소리가 난다. 북을 세게 치면 북의 가죽이 크게 떨리면서 큰 소리가 나는 것이 좋은 예이다. 너무 큰 소리에 오랫동안 노출되면 귀가 손상될 수 있으므로 이어폰 사용 시 적절한 음량을 유지하는 것이 중요하다. 일상에서 소리의 원리를 이해하면 악기 연주나 음악 감상을 더욱 풍부하게 즐길 수 있다." }
  ];
  const cq = [
    makeConfirmQ("q1", "소리가 만들어지는 원리는?", [findRange(paragraphs, "p1", "소리는 물체가 떨리면서 만들어지는 진동이 공기 중으로 전달되는 현상이다.")]),
    makeConfirmQ("q2", "소리의 높낮이를 결정하는 것은?", [findRange(paragraphs, "p1", "소리의 높낮이를 결정하는 진동의 빠르기를 진동수라고 부른다.")]),
    makeConfirmQ("q3", "물속에서 소리가 들리는 이유는?", [findRange(paragraphs, "p2", "물이 소리를 전달하기 때문이다.")]),
    makeConfirmQ("q4", "고체가 공기보다 소리 전달이 빠르다는 예시는?", [findRange(paragraphs, "p2", "쇠로 만든 울타리의 한쪽 끝을 두드리면 반대쪽 끝에서 금방 소리가 들리는데 이는 고체가 공기보다 소리를 더 빠르게 전달하기 때문이다.")]),
    makeConfirmQ("q5", "우주에서 소리가 전달되지 않는 이유는?", [findRange(paragraphs, "p2", "우주 공간에는 공기가 없기 때문에 소리가 전달되지 않는다.")]),
    makeConfirmQ("q6", "소리의 크기를 결정하는 것은?", [findRange(paragraphs, "p3", "소리의 크기는 진동의 폭인 진폭에 의해 결정된다.")]),
    makeConfirmQ("q7", "이어폰 사용 시 주의할 점은?", [findRange(paragraphs, "p3", "너무 큰 소리에 오랫동안 노출되면 귀가 손상될 수 있으므로 이어폰 사용 시 적절한 음량을 유지하는 것이 중요하다.")])
  ];
  const content = assembleFull(323, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// === Day 324 (짝수 → 문학) ===
function buildDay324() {
  const paragraphs = [
    { id: "p1", text: "하준이는 방학을 맞아 시골 할아버지 댁에 놀러 갔다. 할아버지 집 마당에는 커다란 감나무 한 그루가 서 있었는데 여름이라 초록 잎이 무성하게 자라 있었다. 하준이는 도시에서 나무를 가까이에서 본 적이 별로 없어서 감나무가 신기했다. 할아버지는 가을이 되면 이 나무에 주황색 감이 주렁주렁 열린다고 알려 주셨다. 하준이는 가을에 다시 와서 감을 직접 따 보고 싶다고 말했다." },
    { id: "p2", text: "다음 날 아침 하준이는 할아버지를 따라 뒷산으로 산책을 나갔다. 산길에는 이름 모를 풀꽃이 피어 있었고 다람쥐 한 마리가 나무 사이를 재빠르게 뛰어다녔다. 하준이는 다람쥐를 따라가 보려 했지만 금세 풀숲 속으로 사라져 버렸다. 할아버지는 웃으시며 자연 속 동물은 사람보다 훨씬 빠르다고 말씀하셨다. 산 중턱에 있는 약수터에 도착하자 할아버지는 바가지로 물을 떠서 건네주셨다. 차갑고 시원한 물을 마시니 도시에서 마시는 물과는 맛이 다른 것 같아 하준이는 눈이 동그래졌다." },
    { id: "p3", text: "방학이 끝나갈 무렵 하준이는 할아버지에게 작별 인사를 했다. 할아버지는 하준이에게 작은 화분 하나를 선물로 주셨다. 화분에는 방울토마토 모종이 심겨 있었는데 할아버지는 도시에서도 이걸 키우면서 시골을 기억하라고 하셨다. 하준이는 집에 돌아와 베란다에 화분을 놓고 매일 물을 주었다. 한 달이 지나자 작은 노란 꽃이 피었고 이윽고 빨간 방울토마토가 열렸다. 하준이는 할아버지에게 전화하여 토마토가 열렸다고 기쁜 목소리로 알렸다." }
  ];
  const cq = [
    makeConfirmQ("q1", "할아버지 집 마당에 있는 나무는?", [findRange(paragraphs, "p1", "할아버지 집 마당에는 커다란 감나무 한 그루가 서 있었는데")]),
    makeConfirmQ("q2", "하준이가 가을에 하고 싶다고 한 것은?", [findRange(paragraphs, "p1", "가을에 다시 와서 감을 직접 따 보고 싶다고 말했다.")]),
    makeConfirmQ("q3", "산길에서 하준이가 본 동물은?", [findRange(paragraphs, "p2", "다람쥐 한 마리가 나무 사이를 재빠르게 뛰어다녔다.")]),
    makeConfirmQ("q4", "약수터 물을 마신 하준이의 반응은?", [findRange(paragraphs, "p2", "차갑고 시원한 물을 마시니 도시에서 마시는 물과는 맛이 다른 것 같아 하준이는 눈이 동그래졌다.")]),
    makeConfirmQ("q5", "할아버지가 선물로 준 것은?", [findRange(paragraphs, "p3", "할아버지는 하준이에게 작은 화분 하나를 선물로 주셨다.")]),
    makeConfirmQ("q6", "화분에 심겨 있던 식물은?", [findRange(paragraphs, "p3", "화분에는 방울토마토 모종이 심겨 있었는데")]),
    makeConfirmQ("q7", "하준이가 할아버지에게 전화한 이유는?", [findRange(paragraphs, "p3", "토마토가 열렸다고 기쁜 목소리로 알렸다.")])
  ];
  const content = assembleFull(324, "LITERATURE", "문학", paragraphs, cq);
  return { content, subArea: "LITERATURE" };
}

// === Day 325 (홀수 → 비문학) ===
function buildDay325() {
  const paragraphs = [
    { id: "p1", text: "식물은 햇빛을 이용하여 스스로 양분을 만드는 광합성이라는 과정을 거친다. 광합성은 식물의 잎에 있는 엽록체에서 일어나며 이 과정에서 물과 이산화탄소가 사용된다. 뿌리에서 흡수한 물은 줄기를 타고 잎까지 올라가고 공기 중의 이산화탄소는 잎의 작은 구멍인 기공을 통해 들어온다. 이 두 재료가 햇빛 에너지를 받아 포도당이라는 양분으로 바뀌면서 부산물로 산소가 만들어진다. 이렇게 만들어진 산소는 기공을 통해 밖으로 나가 사람과 동물이 숨 쉬는 데 쓰인다." },
    { id: "p2", text: "광합성이 활발하게 일어나려면 충분한 햇빛과 적당한 온도 그리고 물이 필요하다. 흐린 날이나 밤에는 햇빛이 부족하여 광합성이 잘 일어나지 않는다. 또한 사막처럼 물이 부족한 환경에서는 식물이 기공을 닫아 수분 손실을 막기 때문에 광합성 속도가 느려진다. 반대로 열대 우림처럼 빛과 물이 풍부한 곳에서는 식물이 빠르게 자라며 숲이 울창해진다. 이처럼 환경 조건에 따라 식물의 광합성 능력은 크게 달라진다." },
    { id: "p3", text: "광합성은 지구 생태계에서 매우 중요한 역할을 한다. 식물이 만들어 내는 산소 덕분에 지구의 대기에는 생물이 호흡할 수 있는 충분한 양의 산소가 유지된다. 또한 식물이 광합성을 통해 이산화탄소를 흡수하기 때문에 지구 온난화를 늦추는 데에도 도움이 된다. 그래서 숲을 보전하고 나무를 많이 심는 것이 환경 보호에 중요하다. 우리가 매일 먹는 쌀이나 과일 같은 식량도 모두 식물의 광합성으로 만들어진 양분에서 비롯된 것이다." }
  ];
  const cq = [
    makeConfirmQ("q1", "광합성이 일어나는 장소는?", [findRange(paragraphs, "p1", "광합성은 식물의 잎에 있는 엽록체에서 일어나며")]),
    makeConfirmQ("q2", "광합성에 사용되는 두 가지 재료는?", [findRange(paragraphs, "p1", "이 과정에서 물과 이산화탄소가 사용된다.")]),
    makeConfirmQ("q3", "광합성의 부산물로 만들어지는 것은?", [findRange(paragraphs, "p1", "부산물로 산소가 만들어진다.")]),
    makeConfirmQ("q4", "사막에서 광합성이 느려지는 이유는?", [findRange(paragraphs, "p2", "사막처럼 물이 부족한 환경에서는 식물이 기공을 닫아 수분 손실을 막기 때문에 광합성 속도가 느려진다.")]),
    makeConfirmQ("q5", "열대 우림에서 식물이 잘 자라는 이유는?", [findRange(paragraphs, "p2", "열대 우림처럼 빛과 물이 풍부한 곳에서는 식물이 빠르게 자라며 숲이 울창해진다.")]),
    makeConfirmQ("q6", "광합성이 지구 온난화에 미치는 영향은?", [findRange(paragraphs, "p3", "식물이 광합성을 통해 이산화탄소를 흡수하기 때문에 지구 온난화를 늦추는 데에도 도움이 된다.")]),
    makeConfirmQ("q7", "우리가 먹는 식량과 광합성의 관계는?", [findRange(paragraphs, "p3", "우리가 매일 먹는 쌀이나 과일 같은 식량도 모두 식물의 광합성으로 만들어진 양분에서 비롯된 것이다.")])
  ];
  const content = assembleFull(325, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// === Day 326 (짝수 → 문학) ===
function buildDay326() {
  const paragraphs = [
    { id: "p1", text: "수아는 피아노 학원에 다니기 시작한 지 한 달이 되었다. 처음에는 도레미파솔만 치면 되는 쉬운 곡이었는데 점점 양손으로 다른 음을 동시에 쳐야 하는 곡이 나오면서 어려워졌다. 오른손은 잘 움직이는데 왼손이 따라오지 않아서 자꾸 틀렸다. 수아는 연습할 때마다 짜증이 나서 피아노 앞에 앉기가 싫어졌다. 학원에서 돌아온 수아는 어머니에게 피아노를 그만두고 싶다고 말했다." },
    { id: "p2", text: "어머니는 수아에게 한 가지 이야기를 들려주셨다. 어머니도 어렸을 때 수영을 배웠는데 처음에는 물이 무서워서 몇 번이나 포기하려 했다고 하셨다. 그런데 선생님이 조금씩 천천히 해 보라고 격려해 주셔서 하루에 한 동작씩 연습했더니 어느새 수영장 끝까지 헤엄칠 수 있게 되었다는 것이다. 어머니는 피아노도 마찬가지로 처음부터 잘할 수는 없고 매일 조금씩 연습하면 반드시 실력이 는다고 말씀하셨다. 수아는 어머니의 이야기를 듣고 조금 더 해 보기로 마음을 고쳐먹었다." },
    { id: "p3", text: "수아는 그날부터 매일 저녁 삼십 분씩 왼손만 따로 연습하기 시작했다. 처음 며칠은 여전히 실수투성이였지만 일주일이 지나자 왼손이 조금씩 자연스럽게 움직이기 시작했다. 두 주가 지나자 양손으로 합을 맞춰 치는 것이 어렵게 느껴지지 않았다. 학원 발표회에서 수아는 양손으로 작은 별 변주곡을 틀리지 않고 끝까지 연주했다. 친구들과 부모님이 박수를 쳐 주었고 수아는 포기하지 않기를 잘했다는 생각에 가슴이 벅차올랐다." }
  ];
  const cq = [
    makeConfirmQ("q1", "수아가 피아노를 어려워한 이유는?", [findRange(paragraphs, "p1", "양손으로 다른 음을 동시에 쳐야 하는 곡이 나오면서 어려워졌다.")]),
    makeConfirmQ("q2", "수아가 어머니에게 한 말은?", [findRange(paragraphs, "p1", "피아노를 그만두고 싶다고 말했다.")]),
    makeConfirmQ("q3", "어머니가 어렸을 때 배운 것은?", [findRange(paragraphs, "p2", "어머니도 어렸을 때 수영을 배웠는데 처음에는 물이 무서워서 몇 번이나 포기하려 했다고 하셨다.")]),
    makeConfirmQ("q4", "어머니가 수영을 잘하게 된 비결은?", [findRange(paragraphs, "p2", "하루에 한 동작씩 연습했더니 어느새 수영장 끝까지 헤엄칠 수 있게 되었다는 것이다.")]),
    makeConfirmQ("q5", "수아의 연습 방법은?", [findRange(paragraphs, "p3", "매일 저녁 삼십 분씩 왼손만 따로 연습하기 시작했다.")]),
    makeConfirmQ("q6", "발표회에서 수아가 연주한 곡은?", [findRange(paragraphs, "p3", "양손으로 작은 별 변주곡을 틀리지 않고 끝까지 연주했다.")]),
    makeConfirmQ("q7", "발표회 후 수아의 느낌은?", [findRange(paragraphs, "p3", "포기하지 않기를 잘했다는 생각에 가슴이 벅차올랐다.")])
  ];
  const content = assembleFull(326, "LITERATURE", "문학", paragraphs, cq);
  return { content, subArea: "LITERATURE" };
}

// === Day 327 (홀수 → 비문학) ===
function buildDay327() {
  const paragraphs = [
    { id: "p1", text: "우리가 매일 사용하는 종이는 나무에서 얻은 섬유로 만들어진다. 나무의 줄기를 잘게 부수고 물에 넣어 풀어 주면 펄프라는 물질이 된다. 이 펄프를 얇고 고르게 펴서 말리면 종이가 완성된다. 종이는 약 이천 년 전 중국에서 처음 발명되었는데 당시에는 나무 대신 삼이나 헝겊 조각을 재료로 사용했다. 이후 종이 만드는 기술이 점차 발전하면서 오늘날처럼 부드럽고 하얀 종이를 대량으로 생산할 수 있게 되었다." },
    { id: "p2", text: "종이를 만들기 위해서는 많은 양의 나무가 필요하다. 한 그루의 큰 나무로 만들 수 있는 종이는 약 팔천 장 정도인데 우리가 일 년에 사용하는 종이의 양을 생각하면 어마어마한 수의 나무가 베어지는 셈이다. 나무를 지나치게 많이 베면 숲이 줄어들고 동식물의 서식지가 파괴되며 지구 온난화도 빨라진다. 그래서 종이를 아껴 쓰고 재활용하는 것이 매우 중요하다. 사용한 종이를 분리수거함에 넣으면 다시 새로운 종이로 만들 수 있어 나무를 덜 베어도 된다." },
    { id: "p3", text: "최근에는 환경을 생각하여 종이 대신 전자 기기를 사용하는 경우가 늘고 있다. 학교에서도 태블릿으로 교과서를 보거나 숙제를 제출하는 일이 많아졌다. 하지만 종이가 완전히 사라지기는 어렵다. 종이는 전기가 없어도 읽을 수 있고 눈의 피로가 적으며 직접 글씨를 쓰는 즐거움도 있기 때문이다. 앞으로는 종이와 전자 기기를 적절히 함께 사용하면서 환경도 보호하는 지혜로운 방법을 찾아야 할 것이다." }
  ];
  const cq = [
    makeConfirmQ("q1", "종이의 원료는 무엇인가?", [findRange(paragraphs, "p1", "종이는 나무에서 얻은 섬유로 만들어진다.")]),
    makeConfirmQ("q2", "펄프가 만들어지는 과정은?", [findRange(paragraphs, "p1", "나무의 줄기를 잘게 부수고 물에 넣어 풀어 주면 펄프라는 물질이 된다.")]),
    makeConfirmQ("q3", "종이가 처음 발명된 곳과 시기는?", [findRange(paragraphs, "p1", "종이는 약 이천 년 전 중국에서 처음 발명되었는데")]),
    makeConfirmQ("q4", "나무 한 그루로 만들 수 있는 종이 양은?", [findRange(paragraphs, "p2", "한 그루의 큰 나무로 만들 수 있는 종이는 약 팔천 장 정도인데")]),
    makeConfirmQ("q5", "나무를 많이 베면 생기는 문제는?", [findRange(paragraphs, "p2", "나무를 지나치게 많이 베면 숲이 줄어들고 동식물의 서식지가 파괴되며 지구 온난화도 빨라진다.")]),
    makeConfirmQ("q6", "종이 재활용의 장점은?", [findRange(paragraphs, "p2", "사용한 종이를 분리수거함에 넣으면 다시 새로운 종이로 만들 수 있어 나무를 덜 베어도 된다.")]),
    makeConfirmQ("q7", "종이가 전자 기기보다 좋은 점은?", [findRange(paragraphs, "p3", "종이는 전기가 없어도 읽을 수 있고 눈의 피로가 적으며 직접 글씨를 쓰는 즐거움도 있기 때문이다.")])
  ];
  const content = assembleFull(327, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// === 실행부 ===
const results = [
  { dayIndex: 323, ...buildDay323() }, { dayIndex: 324, ...buildDay324() },
  { dayIndex: 325, ...buildDay325() }, { dayIndex: 326, ...buildDay326() },
  { dayIndex: 327, ...buildDay327() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];

results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  \u2705 ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

const newDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
fs.writeFileSync(path.join(newDir, 'batch-s3-323-327.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log('  \u2705 generated/new/batch-s3-323-327.json');

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}\uC790 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
