// 소쉬르3 Day 303~307 일일독해 빌더
const fs = require('fs');
const path = require('path');

// ─── 유틸리티 ───
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

// ─── Day 303 (홀수 → 비문학) ───
function buildDay303() {
  const paragraphs = [
    { id: "p1", text: "우리가 매일 사용하는 전기는 다양한 방법으로 만들어진다. 가장 흔한 방법은 화력 발전으로 석탄이나 천연가스 같은 화석 연료를 태워서 물을 끓이고 그 증기로 터빈을 돌려 전기를 생산하는 것이다. 화력 발전은 많은 양의 전기를 안정적으로 만들 수 있다는 장점이 있지만 연료를 태울 때 이산화 탄소가 발생하여 지구 온난화를 일으키는 단점이 있다. 이 때문에 전 세계적으로 화석 연료의 사용을 줄이고 대체 에너지를 개발하려는 노력이 계속되고 있다." },
    { id: "p2", text: "이러한 문제를 해결하기 위해 재생 에너지에 대한 관심이 점점 높아지고 있다. 재생 에너지란 태양광, 풍력, 수력처럼 자연에서 무한히 얻을 수 있는 에너지를 말한다. 태양광 발전은 태양 빛을 전기로 바꾸는 방식이고 풍력 발전은 바람의 힘으로 커다란 날개를 돌려 전기를 만든다. 수력 발전은 높은 곳에서 떨어지는 물의 힘을 이용한다. 이런 에너지원은 환경 오염 물질을 거의 배출하지 않기 때문에 깨끗한 에너지라고 불린다." },
    { id: "p3", text: "우리나라에서도 재생 에너지 비율을 점차 늘려 가고 있다. 제주도에는 대규모 풍력 발전 단지가 조성되어 있고 전국 곳곳에 태양광 패널이 설치되고 있다. 학교 건물 옥상에 태양광 패널을 설치하여 교실에서 사용하는 전기를 직접 만드는 곳도 늘어나고 있다. 앞으로 기술이 더 발전하면 재생 에너지로 우리가 필요한 전기의 대부분을 안정적으로 충당할 수 있을 것으로 기대된다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "화력 발전이란 무엇인가요?", [findRange(paragraphs, "p1", "석탄이나 천연가스 같은 화석 연료를 태워서 물을 끓이고 그 증기로 터빈을 돌려 전기를 생산하는 것이다.")]),
    makeConfirmQ("q2", "화력 발전의 단점은 무엇인가요?", [findRange(paragraphs, "p1", "연료를 태울 때 이산화 탄소가 발생하여 지구 온난화를 일으키는 단점이 있다.")]),
    makeConfirmQ("q3", "재생 에너지란 무엇인가요?", [findRange(paragraphs, "p2", "태양광, 풍력, 수력처럼 자연에서 무한히 얻을 수 있는 에너지를 말한다.")]),
    makeConfirmQ("q4", "풍력 발전은 어떻게 전기를 만드나요?", [findRange(paragraphs, "p2", "풍력 발전은 바람의 힘으로 커다란 날개를 돌려 전기를 만든다.")]),
    makeConfirmQ("q5", "재생 에너지가 깨끗한 에너지로 불리는 이유는?", [findRange(paragraphs, "p2", "환경 오염 물질을 거의 배출하지 않기 때문에 깨끗한 에너지라고 불린다.")]),
    makeConfirmQ("q6", "제주도에 있는 재생 에너지 시설은?", [findRange(paragraphs, "p3", "제주도에는 대규모 풍력 발전 단지가 조성되어 있고 전국 곳곳에 태양광 패널이 설치되고 있다.")])
  ];
  const content = assembleFull(303, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 304 (짝수 → 문학) ───
function buildDay304() {
  const paragraphs = [
    { id: "p1", text: "봄이 되자 마을 뒷산에는 연분홍 진달래꽃이 한가득 피어났다. 수아는 할머니 손을 꼭 잡고 산길을 천천히 올라가며 꽃구경을 했다. 할머니는 걸음이 느렸지만 꽃을 볼 때마다 눈이 반짝였다. 할머니가 진달래 한 송이를 따서 수아의 머리에 꽂아 주셨다. 수아는 거울이 없어도 예쁘다는 것을 알 수 있었다. 할머니의 주름진 손이 머리카락을 쓸어 넘겨 주실 때 수아의 마음은 따뜻한 봄바람처럼 포근해졌다." },
    { id: "p2", text: "산 중턱에 도착하자 할머니가 잠시 쉬어 가자고 하셨다. 바위에 앉아 마을을 내려다보니 작은 집들이 장난감처럼 보였고 논밭 사이로 개울물이 반짝이며 흘러가고 있었다. 할머니는 수아에게 옛날이야기를 들려주셨다. 할머니도 어릴 때 이 산에서 진달래를 따 먹으며 친구들과 뛰어놀았다는 이야기였다. 수아는 할머니가 자기처럼 어린아이였던 때가 있었다는 사실이 신기했다. 할머니가 웃으며 말씀하셨다. 세월이 흘러도 이 산의 진달래는 변하지 않는다고." },
    { id: "p3", text: "하산하는 길에 수아는 진달래 몇 송이를 조심스럽게 꺾어 작은 꽃다발을 만들었다. 꽃잎에서는 달콤한 향기가 은은하게 풍겨왔다. 집에 돌아와 유리컵에 물을 담고 꽃을 꽂아 할머니 방 창가에 놓아 드렸다. 할머니는 수아를 꼭 안아 주시며 올해 본 꽃 중에서 가장 예쁜 꽃다발이라고 말씀하셨다. 수아는 내년 봄에도 꼭 할머니와 함께 진달래 산에 오겠다고 마음속으로 약속했다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "수아와 할머니는 어디에서 꽃구경을 했나요?", [findRange(paragraphs, "p1", "수아는 할머니 손을 꼭 잡고 산길을 천천히 올라가며 꽃구경을 했다.")]),
    makeConfirmQ("q2", "할머니가 수아에게 해 준 행동은?", [findRange(paragraphs, "p1", "할머니가 진달래 한 송이를 따서 수아의 머리에 꽂아 주셨다.")]),
    makeConfirmQ("q3", "산 중턱에서 마을은 어떻게 보였나요?", [findRange(paragraphs, "p2", "바위에 앉아 마을을 내려다보니 작은 집들이 장난감처럼 보였고 논밭 사이로 개울물이 반짝이며 흘러가고 있었다.")]),
    makeConfirmQ("q4", "할머니가 들려준 옛날이야기의 내용은?", [findRange(paragraphs, "p2", "할머니도 어릴 때 이 산에서 진달래를 따 먹으며 친구들과 뛰어놀았다는 이야기였다.")]),
    makeConfirmQ("q5", "할머니가 변하지 않는다고 한 것은?", [findRange(paragraphs, "p2", "세월이 흘러도 이 산의 진달래는 변하지 않는다고.")]),
    makeConfirmQ("q6", "수아가 집에 돌아와 한 일은?", [findRange(paragraphs, "p3", "집에 돌아와 유리컵에 물을 담고 꽃을 꽂아 할머니 방 창가에 놓아 드렸다.")]),
    makeConfirmQ("q7", "수아가 마음속으로 한 약속은?", [findRange(paragraphs, "p3", "내년 봄에도 꼭 할머니와 함께 진달래 산에 오겠다고 마음속으로 약속했다.")])
  ];
  const content = assembleFull(304, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 305 (홀수 → 비문학) ───
function buildDay305() {
  const paragraphs = [
    { id: "p1", text: "바다에는 눈에 보이지 않는 아주 작은 생물들이 살고 있는데 이를 플랑크톤이라고 부른다. 플랑크톤은 현미경으로만 관찰할 수 있을 정도로 작으며 스스로 헤엄치는 힘이 약해서 물결에 따라 떠다니며 살아간다. 플랑크톤에는 식물 플랑크톤과 동물 플랑크톤 두 가지 종류가 있다. 식물 플랑크톤은 햇빛을 받아 광합성을 하여 산소를 만들어 내는데 지구 전체 산소의 절반 이상이 바다의 식물 플랑크톤에서 나온다. 이처럼 플랑크톤은 크기는 작지만 지구 환경에 매우 중요한 역할을 하고 있다." },
    { id: "p2", text: "플랑크톤은 바다 생태계의 먹이 사슬에서 가장 밑바닥을 차지하고 있다. 작은 물고기와 새우 같은 동물들이 플랑크톤을 먹고 그 작은 동물들을 더 큰 물고기가 먹는 방식으로 먹이 사슬이 이어진다. 만약 플랑크톤이 사라지면 작은 물고기가 먹을 것이 없어지고 결국 큰 물고기와 고래까지 먹이를 구하지 못하게 된다. 그래서 과학자들은 플랑크톤을 바다 생태계의 가장 중요한 기초라고 부른다." },
    { id: "p3", text: "최근 지구 온난화로 인해 바다 온도가 올라가면서 플랑크톤의 분포에 큰 변화가 생기고 있다. 따뜻한 물에서는 플랑크톤의 종류와 양이 달라져서 물고기들의 이동 경로에도 영향을 미친다. 과학자들은 인공위성을 이용하여 바다 표면의 플랑크톤 분포를 관찰하고 있다. 플랑크톤의 변화를 미리 파악하면 어업 계획을 세우거나 바다 환경 변화를 예측하는 데 큰 도움이 된다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "플랑크톤이란 무엇인가요?", [findRange(paragraphs, "p1", "바다에는 눈에 보이지 않는 아주 작은 생물들이 살고 있는데 이를 플랑크톤이라고 부른다. 플랑크톤은 현미경으로만 관찰할 수 있을 정도로 작으며 스스로 헤엄치는 힘이 약해서 물결에 따라 떠다니며 살아간다.")]),
    makeConfirmQ("q2", "식물 플랑크톤의 역할은?", [findRange(paragraphs, "p1", "식물 플랑크톤은 햇빛을 받아 광합성을 하여 산소를 만들어 내는데 지구 전체 산소의 절반 이상이 바다의 식물 플랑크톤에서 나온다.")]),
    makeConfirmQ("q3", "플랑크톤은 먹이 사슬에서 어떤 위치인가요?", [findRange(paragraphs, "p2", "플랑크톤은 바다 생태계의 먹이 사슬에서 가장 밑바닥을 차지하고 있다.")]),
    makeConfirmQ("q4", "플랑크톤이 사라지면 어떤 일이 일어나나요?", [findRange(paragraphs, "p2", "플랑크톤이 사라지면 작은 물고기가 먹을 것이 없어지고 결국 큰 물고기와 고래까지 먹이를 구하지 못하게 된다.")]),
    makeConfirmQ("q5", "바다 온도 상승이 플랑크톤에 미치는 영향은?", [findRange(paragraphs, "p3", "따뜻한 물에서는 플랑크톤의 종류와 양이 달라져서 물고기들의 이동 경로에도 영향을 미친다.")]),
    makeConfirmQ("q6", "과학자들이 플랑크톤을 관찰하는 방법은?", [findRange(paragraphs, "p3", "과학자들은 인공위성을 이용하여 바다 표면의 플랑크톤 분포를 관찰하고 있다.")])
  ];
  const content = assembleFull(305, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 306 (짝수 → 문학) ───
function buildDay306() {
  const paragraphs = [
    { id: "p1", text: "지호는 전학 온 첫날부터 교실 구석에 혼자 앉아 있었다. 아이들은 서로 짝을 지어 이야기하느라 바빴고 아무도 지호에게 먼저 말을 걸지 않았다. 점심시간이 되었지만 함께 밥을 먹자고 하는 친구가 없어서 지호는 혼자 급식판을 들고 빈자리를 찾아 앉았다. 밥이 목구멍으로 넘어가지 않았다. 창밖을 바라보니 운동장에서 아이들이 축구를 하고 있었는데 그 모습이 마치 다른 세상의 풍경처럼 멀게 느껴졌다. 지호는 책상 위에 엎드려 오후 수업이 끝나기만을 기다렸다." },
    { id: "p2", text: "다음 날 미술 시간에 모둠 활동이 있었다. 선생님이 모둠을 정해 주셨는데 지호와 같은 모둠이 된 민재가 먼저 인사를 건넸다. 민재는 지호에게 어디에서 왔는지 물어보더니 자기도 이학년 때 전학을 왔었다며 처음에는 무척 외로웠다고 말했다. 지호는 자신의 마음을 알아주는 사람이 있다는 것만으로도 한결 마음이 가벼워졌다. 둘은 함께 커다란 벽화를 그리며 점점 이야기꽃을 피워 나갔다." },
    { id: "p3", text: "한 달이 지나자 지호의 학교생활은 완전히 달라졌다. 민재를 통해 다른 친구들과도 자연스럽게 어울리게 되었고 쉬는 시간마다 운동장에서 함께 뛰어놀았다. 지호는 처음 전학 왔을 때의 외로움을 떠올리며 혹시 새로 전학 오는 친구가 있으면 자기가 먼저 다가가겠다고 다짐했다. 작은 관심과 따뜻한 한마디가 누군가의 하루를 완전히 바꿀 수 있다는 것을 지호는 몸소 깨달았다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지호가 전학 첫날 겪은 어려움은?", [findRange(paragraphs, "p1", "아이들은 서로 짝을 지어 이야기하느라 바빴고 아무도 지호에게 먼저 말을 걸지 않았다.")]),
    makeConfirmQ("q2", "점심시간에 지호의 마음은 어땠나요?", [findRange(paragraphs, "p1", "밥이 목구멍으로 넘어가지 않았다.")]),
    makeConfirmQ("q3", "민재가 지호에게 먼저 한 행동은?", [findRange(paragraphs, "p2", "민재가 먼저 인사를 건넸다.")]),
    makeConfirmQ("q4", "민재의 이야기를 듣고 지호가 느낀 점은?", [findRange(paragraphs, "p2", "자신의 마음을 알아주는 사람이 있다는 것만으로도 한결 마음이 가벼워졌다.")]),
    makeConfirmQ("q5", "한 달 후 지호의 학교생활은 어떻게 변했나요?", [findRange(paragraphs, "p3", "민재를 통해 다른 친구들과도 자연스럽게 어울리게 되었고 쉬는 시간마다 운동장에서 함께 뛰어놀았다.")]),
    makeConfirmQ("q6", "지호가 다짐한 내용은?", [findRange(paragraphs, "p3", "새로 전학 오는 친구가 있으면 자기가 먼저 다가가겠다고 다짐했다.")]),
    makeConfirmQ("q7", "지호가 깨달은 것은?", [findRange(paragraphs, "p3", "작은 관심과 따뜻한 한마디가 누군가의 하루를 완전히 바꿀 수 있다는 것을 지호는 몸소 깨달았다.")])
  ];
  const content = assembleFull(306, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 307 (홀수 → 비문학) ───
function buildDay307() {
  const paragraphs = [
    { id: "p1", text: "우리 몸속에는 뼈가 약 이백육 개 있으며 이 뼈들이 서로 연결되어 몸의 형태를 유지해 준다. 뼈는 단단한 칼슘 성분으로 이루어져 있어서 외부 충격으로부터 심장이나 뇌 같은 중요한 장기를 보호하는 역할을 한다. 또한 뼈 안쪽에 있는 골수에서는 혈액 세포가 만들어진다. 뼈는 단순히 딱딱한 구조물이 아니라 살아 있는 조직으로서 끊임없이 새로운 세포가 만들어지고 오래된 세포는 분해된다." },
    { id: "p2", text: "뼈와 뼈가 만나는 부분을 관절이라고 하는데 관절 덕분에 우리는 팔을 구부리거나 다리를 움직일 수 있다. 관절에는 연골이라는 부드러운 조직이 있어서 뼈끼리 부딪칠 때 충격을 줄여 준다. 무릎 관절은 우리 몸에서 가장 큰 관절로 걷거나 뛸 때 체중을 지탱하는 중요한 역할을 한다. 관절을 건강하게 유지하려면 적당한 운동과 함께 칼슘이 풍부한 우유나 치즈 같은 음식을 꾸준히 먹는 것이 좋다." },
    { id: "p3", text: "어린이의 뼈는 어른에 비해 더 많은데 성장하면서 여러 개의 뼈가 하나로 합쳐지기 때문이다. 특히 성장판이라는 부분이 뼈의 양 끝에 있어서 이곳에서 뼈가 길어지며 키가 자란다. 성장판은 보통 열다섯 세에서 열여덟 세 사이에 닫히게 되므로 그 전까지 충분한 영양 섭취와 규칙적인 운동이 중요하다. 잠을 충분히 자는 것도 뼈의 성장에 도움이 되는데 잠자는 동안 성장 호르몬이 활발하게 분비되기 때문이다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "뼈의 주요 역할은 무엇인가요?", [findRange(paragraphs, "p1", "외부 충격으로부터 심장이나 뇌 같은 중요한 장기를 보호하는 역할을 한다.")]),
    makeConfirmQ("q2", "골수에서 만들어지는 것은?", [findRange(paragraphs, "p1", "뼈 안쪽에 있는 골수에서는 혈액 세포가 만들어진다.")]),
    makeConfirmQ("q3", "관절이란 무엇인가요?", [findRange(paragraphs, "p2", "뼈와 뼈가 만나는 부분을 관절이라고 하는데 관절 덕분에 우리는 팔을 구부리거나 다리를 움직일 수 있다.")]),
    makeConfirmQ("q4", "연골의 역할은?", [findRange(paragraphs, "p2", "연골이라는 부드러운 조직이 있어서 뼈끼리 부딪칠 때 충격을 줄여 준다.")]),
    makeConfirmQ("q5", "관절을 건강하게 유지하는 방법은?", [findRange(paragraphs, "p2", "적당한 운동과 함께 칼슘이 풍부한 우유나 치즈 같은 음식을 꾸준히 먹는 것이 좋다.")]),
    makeConfirmQ("q6", "성장판이란 무엇인가요?", [findRange(paragraphs, "p3", "성장판이라는 부분이 뼈의 양 끝에 있어서 이곳에서 뼈가 길어지며 키가 자란다.")]),
    makeConfirmQ("q7", "잠이 뼈 성장에 도움이 되는 이유는?", [findRange(paragraphs, "p3", "잠자는 동안 성장 호르몬이 활발하게 분비되기 때문이다.")])
  ];
  const content = assembleFull(307, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── 실행 ───
const results = [
  { dayIndex: 303, ...buildDay303() }, { dayIndex: 304, ...buildDay304() },
  { dayIndex: 305, ...buildDay305() }, { dayIndex: 306, ...buildDay306() },
  { dayIndex: 307, ...buildDay307() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];

results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

const newDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
fs.writeFileSync(path.join(newDir, 'batch-s3-303-307.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ generated/new/batch-s3-303-307.json`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
