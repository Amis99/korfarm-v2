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

// === Day 343 (홀수 → 비문학) ===
function buildDay343() {
  const paragraphs = [
    { id: "p1", text: "우리가 매일 사용하는 종이는 나무에서 만들어진다. 나무의 줄기 속에는 셀룰로스라는 섬유질이 들어 있는데, 이 섬유질을 뽑아내어 얇게 펴면 종이가 된다. 종이를 만드는 과정은 먼저 나무를 잘게 부수어 나무 조각을 만드는 것에서 시작된다. 이 나무 조각을 물과 함께 삶으면 섬유질만 남게 되는데, 이것을 펄프라고 부른다. 펄프에 표백제를 넣어 하얗게 만든 뒤 물에 풀어 넓게 펴고 말리면 우리가 아는 종이가 완성된다." },
    { id: "p2", text: "종이는 처음 중국에서 발명되었다. 약 이천 년 전 한나라 시대에 채륜이라는 관리가 나무껍질과 헝겊 조각 등을 이용하여 종이를 만들었다고 알려져 있다. 이전에는 대나무 조각이나 비단에 글을 썼는데, 대나무는 너무 무겁고 비단은 너무 비쌌기 때문에 가볍고 값싼 종이의 등장은 매우 획기적인 일이었다. 종이의 발명 덕분에 책을 더 많이 만들 수 있게 되었고, 지식과 문화가 동아시아를 넘어 전 세계로 널리 퍼질 수 있었다." },
    { id: "p3", text: "오늘날에는 나무를 보호하기 위해 재활용 종이를 만드는 기술이 발달하고 있다. 쓰고 버린 종이를 다시 물에 풀어 새로운 펄프로 만들면 나무를 베지 않고도 종이를 생산할 수 있다. 또한 대나무나 갈대처럼 빨리 자라는 식물로 종이를 만드는 연구도 진행되고 있다. 종이 한 톤을 재활용하면 나무 약 스무 그루를 살릴 수 있다고 하니, 우리가 종이를 아껴 쓰고 분리수거에 참여하는 것이 숲을 지키고 환경을 보호하는 데 큰 도움이 된다." }
  ];
  const cq = [
    makeConfirmQ("q1", "종이의 원료가 되는 나무 속 섬유질의 이름은 무엇인가요?", [findRange(paragraphs, "p1", "셀룰로스")]),
    makeConfirmQ("q2", "나무 조각을 물과 함께 삶아서 얻는 것을 무엇이라 부르나요?", [findRange(paragraphs, "p1", "펄프")]),
    makeConfirmQ("q3", "종이를 처음 발명한 나라는 어디인가요?", [findRange(paragraphs, "p2", "중국")]),
    makeConfirmQ("q4", "채륜이 종이를 만들 때 사용한 재료는 무엇인가요?", [findRange(paragraphs, "p2", "나무껍질과 헝겊 조각")]),
    makeConfirmQ("q5", "종이가 발명되기 전에 글을 쓰던 재료 두 가지는 무엇인가요?", [findRange(paragraphs, "p2", "대나무 조각이나 비단")]),
    makeConfirmQ("q6", "종이 한 톤을 재활용하면 나무 약 몇 그루를 살릴 수 있나요?", [findRange(paragraphs, "p3", "스무 그루")]),
    makeConfirmQ("q7", "재활용 종이는 어떻게 만드나요?", [findRange(paragraphs, "p3", "쓰고 버린 종이를 다시 물에 풀어 새로운 펄프로 만들면")])
  ];
  console.log(`  Day 343 지문 길이: ${charLen(paragraphs)}자`);
  return { content: assembleFull(343, "NONFICTION", "비문학", paragraphs, cq), subArea: "NONFICTION" };
}

// === Day 344 (짝수 → 문학) ===
function buildDay344() {
  const paragraphs = [
    { id: "p1", text: "준호는 가을 방학을 맞아 아버지와 함께 시골 할머니 댁을 찾아갔다. 도시에서 태어나 자란 준호에게 시골은 낯선 곳이었다. 차에서 내리니 논과 밭이 끝없이 펼쳐져 있었고, 공기에서는 풀 냄새가 났다. 할머니는 마당에서 준호를 반갑게 맞아 주시며 직접 만드신 송편을 내어 주셨다. 할머니 댁 마당에는 감나무가 한 그루 서 있었는데, 가지마다 주황색 감이 탐스럽게 달려 있었다. 준호는 도시에서 보지 못했던 풍경에 눈이 휘둥그레졌다." },
    { id: "p2", text: "다음 날 아침, 할머니는 준호를 데리고 뒷산에 올라갔다. 산길을 따라 걸으니 다람쥐가 도토리를 입에 물고 재빠르게 나무 위로 올라갔다. 할머니는 길가에 핀 들꽃 이름을 하나하나 알려 주셨다. 쑥부쟁이, 코스모스, 구절초라는 이름이 모두 처음 들어 보는 것들이었다. 산꼭대기에 오르니 마을 전체가 한눈에 내려다보였고, 멀리 강이 햇빛을 받아 반짝거렸다. 시원한 바람이 불어와 땀을 식혀 주었고, 준호는 이렇게 아름다운 곳에 할머니가 사시는 것이 부러웠다." },
    { id: "p3", text: "집으로 돌아가는 차 안에서 준호는 창밖을 바라보며 생각했다. 시골에서 보낸 이틀은 마치 다른 세계를 여행한 것 같았다. 감나무 아래서 먹었던 감의 달콤한 맛, 산길에서 만난 다람쥐의 재빠른 모습, 할머니의 따뜻한 손길이 하나하나 떠올랐다. 준호는 다음 방학에도 꼭 할머니 댁에 오겠다고 마음속으로 굳게 약속했다." }
  ];
  const cq = [
    makeConfirmQ("q1", "준호가 할머니 댁을 찾아간 곳은 어디인가요?", [findRange(paragraphs, "p1", "시골")]),
    makeConfirmQ("q2", "할머니가 준호에게 내어 주신 음식은 무엇인가요?", [findRange(paragraphs, "p1", "송편")]),
    makeConfirmQ("q3", "할머니 댁 마당에 있던 나무는 무엇인가요?", [findRange(paragraphs, "p1", "감나무")]),
    makeConfirmQ("q4", "뒷산에서 다람쥐가 입에 물고 있던 것은 무엇인가요?", [findRange(paragraphs, "p2", "도토리")]),
    makeConfirmQ("q5", "할머니가 알려 주신 들꽃 이름 세 가지는 무엇인가요?", [findRange(paragraphs, "p2", "쑥부쟁이, 코스모스, 구절초")]),
    makeConfirmQ("q6", "산꼭대기에서 멀리 보인 것은 무엇인가요?", [findRange(paragraphs, "p2", "강이 햇빛을 받아 반짝거렸다")]),
    makeConfirmQ("q7", "준호는 시골에서 며칠을 보냈나요?", [findRange(paragraphs, "p3", "이틀")])
  ];
  console.log(`  Day 344 지문 길이: ${charLen(paragraphs)}자`);
  return { content: assembleFull(344, "LITERATURE", "문학", paragraphs, cq), subArea: "LITERATURE" };
}

// === Day 345 (홀수 → 비문학) ===
function buildDay345() {
  const paragraphs = [
    { id: "p1", text: "꿀벌은 꽃에서 꿀을 모으는 곤충으로 잘 알려져 있지만, 사실 꿀벌이 하는 가장 중요한 일은 꽃가루받이이다. 꽃가루받이란 꽃의 수술에 있는 꽃가루가 암술머리에 옮겨지는 것을 말한다. 꿀벌이 꽃 위에 앉으면 몸에 꽃가루가 묻고, 다른 꽃으로 이동할 때 그 꽃가루가 전달된다. 이 과정을 통해 식물은 열매와 씨앗을 맺을 수 있게 된다. 만약 꿀벌이 사라진다면 많은 식물이 열매를 맺지 못하게 되어 우리가 먹는 과일과 채소의 생산량이 크게 줄어들 것이다." },
    { id: "p2", text: "꿀벌은 매우 체계적인 사회를 이루며 살아간다. 한 벌집에는 여왕벌 한 마리, 수천 마리의 수벌, 그리고 수만 마리의 일벌이 함께 산다. 여왕벌은 알을 낳는 역할을 하고, 일벌은 꿀을 모으고 벌집을 짓고 애벌레를 돌보는 등 다양한 일을 맡는다. 특히 일벌은 먹이가 있는 장소를 동료에게 알리기 위해 춤을 추는데, 이것을 꿀벌의 춤 언어라고 부른다. 원을 그리며 도는 춤은 가까운 곳에 먹이가 있다는 뜻이고, 8자 모양으로 추는 춤은 먼 곳에 먹이가 있다는 뜻이다." },
    { id: "p3", text: "최근 전 세계적으로 꿀벌의 수가 줄어들고 있어 과학자들이 걱정하고 있다. 농약 사용, 기후 변화, 서식지 파괴 등이 꿀벌 감소의 주요 원인으로 꼽힌다. 꿀벌을 보호하기 위해 여러 나라에서 농약 사용을 줄이고 꿀벌이 살 수 있는 환경을 만드는 노력을 기울이고 있다." }
  ];
  const cq = [
    makeConfirmQ("q1", "꿀벌이 하는 가장 중요한 일은 무엇인가요?", [findRange(paragraphs, "p1", "꽃가루받이")]),
    makeConfirmQ("q2", "꽃가루받이가 일어나면 식물은 무엇을 할 수 있나요?", [findRange(paragraphs, "p1", "열매와 씨앗을 맺을 수 있게 된다")]),
    makeConfirmQ("q3", "벌집에서 알을 낳는 역할을 하는 벌은 무엇인가요?", [findRange(paragraphs, "p2", "여왕벌")]),
    makeConfirmQ("q4", "일벌이 먹이 장소를 알리기 위해 하는 행동은 무엇인가요?", [findRange(paragraphs, "p2", "춤을 추는데, 이것을 꿀벌의 춤 언어라고 부른다")]),
    makeConfirmQ("q5", "8자 모양의 춤은 무엇을 의미하나요?", [findRange(paragraphs, "p2", "먼 곳에 먹이가 있다는 뜻")]),
    makeConfirmQ("q6", "꿀벌 감소의 주요 원인 세 가지는 무엇인가요?", [findRange(paragraphs, "p3", "농약 사용, 기후 변화, 서식지 파괴")])
  ];
  console.log(`  Day 345 지문 길이: ${charLen(paragraphs)}자`);
  return { content: assembleFull(345, "NONFICTION", "비문학", paragraphs, cq), subArea: "NONFICTION" };
}

// === Day 346 (짝수 → 문학) ===
function buildDay346() {
  const paragraphs = [
    { id: "p1", text: "서연이는 피아노 학원에 다닌 지 벌써 삼 년이 되었다. 처음에는 피아노 소리가 좋아서 신나게 다녔지만, 점점 어려운 곡을 배우게 되면서 연습이 힘들어졌다. 손가락이 자꾸 엉뚱한 건반을 누르고, 같은 부분에서 반복해서 틀리면 짜증이 났다. 친구들은 밖에서 뛰어노는데 자신만 피아노 앞에 앉아 있어야 한다는 생각이 들면 더욱 속이 상했다. 서연이는 피아노를 그만두고 싶다고 엄마에게 말했다. 엄마는 잠시 생각하시더니 \"발표회까지만 해 보고 그때 다시 생각해 보자.\"라고 하셨다." },
    { id: "p2", text: "발표회 날이 다가오자 서연이는 매일 두 시간씩 연습했다. 처음에는 손가락이 아프고 지루했지만, 어느 순간부터 틀리던 부분이 자연스럽게 넘어가기 시작했다. 곡 전체를 막힘없이 연주할 수 있게 되자 뿌듯한 마음이 들었다. 드디어 발표회 당일, 무대 위에 올라간 서연이는 밝은 조명을 받으며 건반 위에 손을 올렸다. 심장이 빠르게 뛰었지만 음악이 시작되자 긴장이 사라졌다. 손끝에서 흘러나오는 멜로디가 객석 가득 퍼져 나갔고, 서연이는 음악 속에 완전히 빠져들었다." },
    { id: "p3", text: "연주가 끝나자 객석에서 박수가 쏟아졌다. 서연이는 눈물이 날 것 같았다. 힘들었던 연습 시간이 모두 보람 있게 느껴졌고, 포기하지 않은 자신이 자랑스러웠다. 무대에서 내려온 서연이는 엄마에게 달려가 \"나 피아노 계속 칠래요.\"라고 말했다. 엄마는 환하게 웃으시며 서연이를 꼭 안아 주셨다." }
  ];
  const cq = [
    makeConfirmQ("q1", "서연이가 피아노를 그만두고 싶었던 이유는 무엇인가요?", [findRange(paragraphs, "p1", "어려운 곡을 배우게 되면서 연습이 힘들어졌다")]),
    makeConfirmQ("q2", "엄마가 서연이에게 제안한 것은 무엇인가요?", [findRange(paragraphs, "p1", "발표회까지만 해 보고 그때 다시 생각해 보자")]),
    makeConfirmQ("q3", "발표회가 다가오자 서연이는 매일 얼마나 연습했나요?", [findRange(paragraphs, "p2", "매일 두 시간씩")]),
    makeConfirmQ("q4", "곡 전체를 막힘없이 연주하게 되자 서연이는 어떤 기분이 들었나요?", [findRange(paragraphs, "p2", "뿌듯한 마음이 들었다")]),
    makeConfirmQ("q5", "무대 위에서 음악이 시작되자 서연이에게 어떤 변화가 있었나요?", [findRange(paragraphs, "p2", "긴장이 사라졌다")]),
    makeConfirmQ("q6", "연주가 끝난 후 객석에서는 어떤 반응이 있었나요?", [findRange(paragraphs, "p3", "박수가 쏟아졌다")]),
    makeConfirmQ("q7", "서연이가 무대에서 내려와 엄마에게 한 말은 무엇인가요?", [findRange(paragraphs, "p3", "나 피아노 계속 칠래요")])
  ];
  console.log(`  Day 346 지문 길이: ${charLen(paragraphs)}자`);
  return { content: assembleFull(346, "LITERATURE", "문학", paragraphs, cq), subArea: "LITERATURE" };
}

// === Day 347 (홀수 → 비문학) ===
function buildDay347() {
  const paragraphs = [
    { id: "p1", text: "지도는 땅의 모습을 줄여서 종이나 화면 위에 나타낸 것이다. 사람들은 아주 오래전부터 지도를 만들어 사용해 왔다. 고대 바빌로니아에서는 점토판에 마을과 강의 위치를 새겨 넣었고, 고대 그리스에서는 지구가 둥글다는 사실을 바탕으로 세계 지도를 그리려고 노력했다. 우리나라에서도 조선 시대에 김정호가 대동여지도라는 매우 정밀한 지도를 만들었다. 김정호는 전국을 직접 돌아다니며 산과 강, 도로의 위치를 꼼꼼하게 조사하여 지도에 담았다고 전해진다." },
    { id: "p2", text: "지도에는 여러 가지 약속된 기호가 사용된다. 산은 삼각형 모양으로, 학교는 한자로 된 기호로, 절은 만자 모양으로 나타내는 것이 대표적이다. 이러한 기호 덕분에 좁은 지도 위에도 많은 정보를 담을 수 있다. 또한 지도에는 축척이라는 것이 있는데, 이것은 실제 거리를 지도 위에서 얼마나 줄였는지를 나타내는 비율이다. 예를 들어 축척이 일 대 오만이라면 지도 위의 일 센티미터가 실제로는 오백 미터라는 뜻이다. 축척을 이해하면 지도를 보고 실제 거리를 계산할 수 있어 여행이나 탐험에서 매우 유용하다." },
    { id: "p3", text: "요즘에는 종이 지도 대신 전자 지도를 많이 사용한다. 스마트폰이나 컴퓨터에서 볼 수 있는 전자 지도는 위성에서 보내 주는 정보를 바탕으로 만들어진다. 전자 지도는 손가락으로 확대하거나 축소할 수 있고, 현재 내 위치를 실시간으로 보여 주기도 한다. 또한 목적지까지 가는 길을 자동으로 안내해 주어 낯선 곳을 찾아갈 때 매우 편리하다." }
  ];
  const cq = [
    makeConfirmQ("q1", "지도란 무엇인가요?", [findRange(paragraphs, "p1", "땅의 모습을 줄여서 종이나 화면 위에 나타낸 것")]),
    makeConfirmQ("q2", "조선 시대에 대동여지도를 만든 사람은 누구인가요?", [findRange(paragraphs, "p1", "김정호")]),
    makeConfirmQ("q3", "지도에서 산을 나타내는 기호 모양은 무엇인가요?", [findRange(paragraphs, "p2", "삼각형 모양")]),
    makeConfirmQ("q4", "축척이란 무엇인가요?", [findRange(paragraphs, "p2", "실제 거리를 지도 위에서 얼마나 줄였는지를 나타내는 비율")]),
    makeConfirmQ("q5", "전자 지도는 어디에서 보내 주는 정보를 바탕으로 만들어지나요?", [findRange(paragraphs, "p3", "위성")]),
    makeConfirmQ("q6", "전자 지도가 편리한 이유 중 하나는 무엇인가요?", [findRange(paragraphs, "p3", "목적지까지 가는 길을 자동으로 안내해 주어")])
  ];
  console.log(`  Day 347 지문 길이: ${charLen(paragraphs)}자`);
  return { content: assembleFull(347, "NONFICTION", "비문학", paragraphs, cq), subArea: "NONFICTION" };
}

// === 실행부 ===
const results = [
  { dayIndex: 343, ...buildDay343() }, { dayIndex: 344, ...buildDay344() },
  { dayIndex: 345, ...buildDay345() }, { dayIndex: 346, ...buildDay346() },
  { dayIndex: 347, ...buildDay347() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];

results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

fs.writeFileSync(path.join(__dirname, '..', 'generated', 'new', 'batch-s3-343-347.json'), JSON.stringify(batchItems, null, 2), 'utf8');

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
