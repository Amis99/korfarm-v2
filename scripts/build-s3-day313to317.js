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

// === Day 313 (홀수 → 비문학) ===
function buildDay313() {
  const paragraphs = [
    { id: "p1", text: "우리가 학교에서 공부할 때나 일상에서 자주 사용하는 종이는 나무에서 만들어진다. 나무의 줄기를 잘게 부수면 가느다란 섬유질이 나오는데 이 섬유질을 물에 풀어서 얇고 넓게 펴면 종이가 된다. 종이를 처음 발명한 나라는 중국이며 약 이천 년 전 채륜이라는 관리가 나무껍질과 헝겊 조각을 이용하여 종이를 만들었다고 전해진다. 이 획기적인 발명품은 실크로드를 따라 아랍 지역으로 전해졌고 이후 유럽까지 퍼져 나가면서 전 세계의 학문과 문화 발전에 큰 기여를 했다. 종이가 만들어지기 전에 사람들은 양가죽이나 대나무 조각 위에 글을 썼는데 이 방법은 무겁고 다루기가 매우 불편하여 많은 양의 기록을 남기기 어려웠다." },
    { id: "p2", text: "오늘날에는 나무 대신 재활용 종이를 이용하여 새로운 종이를 만들기도 한다. 헌 종이를 모아서 잘게 자르고 물에 불려서 다시 섬유질로 만든 뒤 새 종이로 재탄생시키는 것이다. 이렇게 하면 나무를 덜 베어도 되기 때문에 소중한 숲을 보호하는 데 큰 도움이 된다. 또한 종이를 만드는 과정에서 사용하는 물과 에너지도 크게 줄일 수 있어서 자원을 아끼는 효과도 있다. 환경을 생각하는 마음으로 종이를 아껴 쓰고 다 쓴 종이는 분리수거함에 넣는 습관이 중요하다. 이러한 작은 실천이 하나하나 모이면 울창한 숲을 지키고 깨끗한 지구를 만드는 데 큰 힘이 될 수 있다." }
  ];
  const cq = [
    makeConfirmQ("q1", "종이의 원료는 무엇인가?", [findRange(paragraphs, "p1", "나무의 줄기를 잘게 부수면 가느다란 섬유질이 나오는데 이 섬유질을 물에 풀어서 얇고 넓게 펴면 종이가 된다.")]),
    makeConfirmQ("q2", "종이를 처음 발명한 사람은?", [findRange(paragraphs, "p1", "약 이천 년 전 채륜이라는 관리가 나무껍질과 헝겊 조각을 이용하여 종이를 만들었다고 전해진다.")]),
    makeConfirmQ("q3", "종이가 발명되기 전 글을 쓰는 방법은?", [findRange(paragraphs, "p1", "양가죽이나 대나무 조각 위에 글을 썼는데 이 방법은 무겁고 다루기가 매우 불편하여 많은 양의 기록을 남기기 어려웠다.")]),
    makeConfirmQ("q4", "종이가 중국에서 유럽까지 전해진 경로는?", [findRange(paragraphs, "p1", "실크로드를 따라 아랍 지역으로 전해졌고 이후 유럽까지 퍼져 나가면서")]),
    makeConfirmQ("q5", "재활용 종이를 만드는 과정은?", [findRange(paragraphs, "p2", "헌 종이를 모아서 잘게 자르고 물에 불려서 다시 섬유질로 만든 뒤 새 종이로 재탄생시키는 것이다.")]),
    makeConfirmQ("q6", "종이 재활용이 환경에 좋은 이유는?", [findRange(paragraphs, "p2", "나무를 덜 베어도 되기 때문에 소중한 숲을 보호하는 데 큰 도움이 된다.")]),
    makeConfirmQ("q7", "종이를 아끼기 위한 습관은?", [findRange(paragraphs, "p2", "종이를 아껴 쓰고 다 쓴 종이는 분리수거함에 넣는 습관이 중요하다.")])
  ];
  const content = assembleFull(313, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// === Day 314 (짝수 → 문학) ===
function buildDay314() {
  const paragraphs = [
    { id: "p1", text: "지호는 여름 방학 동안 시골 할아버지 댁에서 한 달을 지내게 되었다. 도시에서만 자란 지호에게 시골은 모든 것이 낯설고 불편했다. 아침이면 닭 우는 소리에 일찍 눈을 떴고 창문 너머로 끝없이 펼쳐진 초록빛 논이 보였다. 할아버지는 매일 새벽같이 일어나 논에 나가셨는데 지호는 처음 며칠은 늦잠만 자며 심심해했다. 텔레비전도 없고 인터넷도 느려서 할 일이 없다고 투덜거리며 빨리 도시로 돌아가고 싶다고 엄마에게 전화했다." },
    { id: "p2", text: "그러던 어느 날 할아버지가 지호의 손을 잡고 논으로 데려가셨다. 논둑 사이로 개구리가 뛰어다니고 형형색색의 잠자리가 낮게 날아다니는 모습에 지호는 신기한 눈으로 한참을 바라보았다. 할아버지는 벼 한 포기를 가리키며 이 작은 싹이 여름 햇볕과 비를 맞으며 자라서 가을이 되면 우리가 먹는 밥이 된다고 알려 주셨다. 지호는 밥 한 그릇이 이렇게 오랜 시간과 정성으로 만들어진다는 사실에 깜짝 놀랐다." },
    { id: "p3", text: "그날 이후 지호는 매일 아침 할아버지를 따라 논에 나갔다. 잡풀을 뽑고 물길을 살피며 벼가 조금씩 자라는 모습을 정성껏 지켜보았다. 방학이 끝나고 도시로 돌아온 지호는 밥을 먹을 때마다 할아버지의 푸른 논이 떠올랐다. 밥 한 톨도 남기지 않겠다고 다짐하며 숟가락으로 그릇을 깨끗이 비웠다. 지호의 마음속에는 할아버지의 구부러진 등과 따뜻한 웃음이 오래도록 남아 있었다." }
  ];
  const cq = [
    makeConfirmQ("q1", "지호가 시골에서 처음 느낀 감정은?", [findRange(paragraphs, "p1", "도시에서만 자란 지호에게 시골은 모든 것이 낯설고 불편했다.")]),
    makeConfirmQ("q2", "지호가 시골에서 심심해한 이유는?", [findRange(paragraphs, "p1", "텔레비전도 없고 인터넷도 느려서 할 일이 없다고 투덜거리며 빨리 도시로 돌아가고 싶다고 엄마에게 전화했다.")]),
    makeConfirmQ("q3", "논에서 지호가 본 생물은?", [findRange(paragraphs, "p2", "논둑 사이로 개구리가 뛰어다니고 형형색색의 잠자리가 낮게 날아다니는 모습에 지호는 신기한 눈으로 한참을 바라보았다.")]),
    makeConfirmQ("q4", "할아버지가 벼에 대해 알려 준 내용은?", [findRange(paragraphs, "p2", "이 작은 싹이 여름 햇볕과 비를 맞으며 자라서 가을이 되면 우리가 먹는 밥이 된다고 알려 주셨다.")]),
    makeConfirmQ("q5", "지호가 놀란 이유는?", [findRange(paragraphs, "p2", "밥 한 그릇이 이렇게 오랜 시간과 정성으로 만들어진다는 사실에 깜짝 놀랐다.")]),
    makeConfirmQ("q6", "지호가 논에서 한 일은?", [findRange(paragraphs, "p3", "잡풀을 뽑고 물길을 살피며 벼가 조금씩 자라는 모습을 정성껏 지켜보았다.")]),
    makeConfirmQ("q7", "도시로 돌아온 지호의 다짐은?", [findRange(paragraphs, "p3", "밥 한 톨도 남기지 않겠다고 다짐하며 숟가락으로 그릇을 깨끗이 비웠다.")])
  ];
  const content = assembleFull(314, "LITERATURE", "문학", paragraphs, cq);
  return { content, subArea: "LITERATURE" };
}

// === Day 315 (홀수 → 비문학) ===
function buildDay315() {
  const paragraphs = [
    { id: "p1", text: "지구에는 다양한 기후가 존재하며 지역마다 날씨와 환경이 크게 다르다. 적도 근처는 일 년 내내 덥고 비가 많이 내려서 울창한 열대 우림이 형성된다. 반면 북극과 남극에 가까운 극지방은 매우 춥고 넓은 땅이 눈과 얼음으로 뒤덮여 있다. 이러한 기후 차이가 생기는 가장 큰 이유는 태양 빛이 지구에 닿는 각도가 지역마다 다르기 때문이다. 적도 근처는 태양 빛이 거의 수직으로 내리쬐어 많은 열을 받지만 극지방은 빛이 비스듬하게 닿아 같은 면적이라도 열을 적게 받는다." },
    { id: "p2", text: "기후는 그곳에 사는 동식물에도 큰 영향을 미친다. 열대 지역에는 키가 매우 큰 나무와 화려한 깃털을 가진 앵무새 같은 새들이 살고 사막에는 물 없이도 오래 견디는 선인장과 낙타가 있다. 극지방에는 두꺼운 지방층을 가진 북극곰과 펭귄이 혹독한 추위를 이겨 낸다. 이처럼 각 지역의 동식물은 수만 년에 걸쳐 자신이 사는 환경에 맞게 몸과 습성을 바꾸며 적응해 왔다." },
    { id: "p3", text: "최근에는 지구 온난화로 인해 전 세계의 기후가 빠르게 변하고 있어 많은 학자들이 우려하고 있다. 공장과 자동차에서 나오는 이산화 탄소가 지구의 평균 온도를 높이면서 극지방의 얼음이 녹고 해수면이 올라가고 있다. 이 때문에 기존에 살던 지역에서 더 이상 살기 어려워진 동물들도 늘어나고 있다. 기후 변화를 막기 위해서는 에너지를 절약하고 나무를 심으며 대중교통을 이용하는 등 일상 속 작은 실천이 필요하다." }
  ];
  const cq = [
    makeConfirmQ("q1", "적도 근처의 기후 특징은?", [findRange(paragraphs, "p1", "적도 근처는 일 년 내내 덥고 비가 많이 내려서 울창한 열대 우림이 형성된다.")]),
    makeConfirmQ("q2", "기후 차이가 생기는 가장 큰 이유는?", [findRange(paragraphs, "p1", "태양 빛이 지구에 닿는 각도가 지역마다 다르기 때문이다.")]),
    makeConfirmQ("q3", "극지방이 추운 이유는?", [findRange(paragraphs, "p1", "극지방은 빛이 비스듬하게 닿아 같은 면적이라도 열을 적게 받는다.")]),
    makeConfirmQ("q4", "사막에 사는 동식물의 특징은?", [findRange(paragraphs, "p2", "사막에는 물 없이도 오래 견디는 선인장과 낙타가 있다.")]),
    makeConfirmQ("q5", "극지방 동물이 추위를 견디는 방법은?", [findRange(paragraphs, "p2", "두꺼운 지방층을 가진 북극곰과 펭귄이 혹독한 추위를 이겨 낸다.")]),
    makeConfirmQ("q6", "지구 온난화의 원인은?", [findRange(paragraphs, "p3", "공장과 자동차에서 나오는 이산화 탄소가 지구의 평균 온도를 높이면서")]),
    makeConfirmQ("q7", "기후 변화를 막기 위한 실천 방법은?", [findRange(paragraphs, "p3", "에너지를 절약하고 나무를 심으며 대중교통을 이용하는 등 일상 속 작은 실천이 필요하다.")])
  ];
  const content = assembleFull(315, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// === Day 316 (짝수 → 문학) ===
function buildDay316() {
  const paragraphs = [
    { id: "p1", text: "수빈이는 아빠의 직장 때문에 다른 도시로 전학을 오게 되었다. 전학 온 첫날부터 교실 한구석에 혼자 앉아 있었는데 낯선 교실과 처음 보는 아이들 사이에서 누구에게 먼저 말을 걸어야 할지 몰라 고개를 숙이고 있었다. 쉬는 시간에도 복도에 나가지 못하고 자리에 앉아 창밖의 운동장만 바라보았다. 그때 옆자리의 하은이가 다가와 같이 급식 먹으러 가자며 밝은 목소리로 말을 걸었다. 수빈이는 조금 놀랐지만 고맙다는 말과 함께 고개를 끄덕이며 자리에서 일어났다." },
    { id: "p2", text: "하은이는 급식실로 가는 길에 학교 곳곳을 친절하게 알려 주었다. 도서관은 이층 복도 끝에 있고 체육관은 운동장 옆 큰 건물이라고 하나하나 설명해 주었다. 급식을 먹으며 하은이는 수빈이에게 좋아하는 과목이 뭐냐고 물었다. 수빈이가 미술 시간을 가장 좋아한다고 하자 하은이는 눈을 반짝이며 자기도 그림 그리는 것을 무척 좋아한다고 했다. 두 아이는 서로 좋아하는 화가와 그림에 대해 이야기하며 금세 웃음꽃을 피웠다." },
    { id: "p3", text: "그날 방과 후 수빈이는 하은이와 함께 미술실에서 나란히 앉아 그림을 그렸다. 수빈이는 노을 지는 바다 위에 떠 있는 돛단배를 그렸고 하은이는 꽃밭에서 뛰노는 강아지를 그렸다. 서로의 그림을 보며 솜씨가 대단하다고 칭찬을 주고받았다. 집으로 돌아가는 길에 수빈이는 내일 학교 오는 것이 기다려진다고 말했다. 하은이는 내일은 더 재미있을 거라며 활짝 웃었다. 수빈이의 마음속에 자리 잡고 있던 외로움이 따뜻하게 녹아내리는 것 같았다." }
  ];
  const cq = [
    makeConfirmQ("q1", "수빈이가 전학 오게 된 이유는?", [findRange(paragraphs, "p1", "아빠의 직장 때문에 다른 도시로 전학을 오게 되었다.")]),
    makeConfirmQ("q2", "쉬는 시간에 수빈이는 무엇을 했나?", [findRange(paragraphs, "p1", "복도에 나가지 못하고 자리에 앉아 창밖의 운동장만 바라보았다.")]),
    makeConfirmQ("q3", "하은이가 수빈이에게 처음 건넨 말은?", [findRange(paragraphs, "p1", "같이 급식 먹으러 가자며 밝은 목소리로 말을 걸었다.")]),
    makeConfirmQ("q4", "하은이가 급식실 가는 길에 한 일은?", [findRange(paragraphs, "p2", "학교 곳곳을 친절하게 알려 주었다.")]),
    makeConfirmQ("q5", "두 아이의 공통 관심사는?", [findRange(paragraphs, "p2", "자기도 그림 그리는 것을 무척 좋아한다고 했다.")]),
    makeConfirmQ("q6", "수빈이가 미술실에서 그린 그림은?", [findRange(paragraphs, "p3", "노을 지는 바다 위에 떠 있는 돛단배를 그렸고")]),
    makeConfirmQ("q7", "집으로 돌아가며 수빈이가 한 말은?", [findRange(paragraphs, "p3", "내일 학교 오는 것이 기다려진다고 말했다.")])
  ];
  const content = assembleFull(316, "LITERATURE", "문학", paragraphs, cq);
  return { content, subArea: "LITERATURE" };
}

// === Day 317 (홀수 → 비문학) ===
function buildDay317() {
  const paragraphs = [
    { id: "p1", text: "꿀벌은 자연 생태계에서 매우 중요한 역할을 하는 작은 곤충이다. 꿀벌은 꽃에서 달콤한 꿀을 모으면서 동시에 꽃가루를 다른 꽃으로 옮겨 주는데 이것을 수분이라고 한다. 수분이 이루어져야 식물이 열매를 맺을 수 있기 때문에 꿀벌 없이는 사과나 딸기 같은 맛있는 과일을 먹기 어려워진다. 전 세계 식량 작물의 약 삼분의 일이 꿀벌의 도움으로 열매를 맺는다고 알려져 있어 꿀벌의 중요성은 아무리 강조해도 지나치지 않는다." },
    { id: "p2", text: "꿀벌은 벌집 안에서 철저한 역할 분담을 통해 질서 있게 생활한다. 여왕벌은 하루에 수천 개의 알을 낳고 일벌은 꿀을 모으며 벌집을 짓고 청소하는 등 다양한 일을 맡는다. 수벌은 여왕벌과 짝짓기를 하는 역할을 한다. 일벌은 꽃이 많은 곳을 발견하면 벌집으로 돌아와 특별한 춤을 추어 동료들에게 꽃의 방향과 거리를 정확히 알려 준다. 이 춤을 팔자춤이라고 부르며 이는 꿀벌만의 독특하고 놀라운 의사소통 방법이다." },
    { id: "p3", text: "그런데 최근 전 세계적으로 꿀벌의 수가 급격히 줄어들고 있어 많은 나라가 걱정하고 있다. 농약 사용과 환경 오염 그리고 기후 변화가 꿀벌이 살기 어려운 환경을 만들고 있기 때문이다. 꿀벌이 사라지면 농작물 생산에 큰 문제가 생기고 결국 사람의 식탁에도 심각한 영향을 미치게 된다. 꿀벌을 보호하기 위해 농약 사용을 줄이고 도시에도 꿀벌이 쉴 수 있는 꽃밭을 가꾸는 등의 노력이 꼭 필요하다." }
  ];
  const cq = [
    makeConfirmQ("q1", "꿀벌이 꽃에서 하는 중요한 역할은?", [findRange(paragraphs, "p1", "꽃가루를 다른 꽃으로 옮겨 주는데 이것을 수분이라고 한다.")]),
    makeConfirmQ("q2", "꿀벌이 없으면 어떤 문제가 생기나?", [findRange(paragraphs, "p1", "꿀벌 없이는 사과나 딸기 같은 맛있는 과일을 먹기 어려워진다.")]),
    makeConfirmQ("q3", "벌집 안에서 일벌이 하는 일은?", [findRange(paragraphs, "p2", "일벌은 꿀을 모으며 벌집을 짓고 청소하는 등 다양한 일을 맡는다.")]),
    makeConfirmQ("q4", "일벌이 꽃 위치를 알려 주는 방법은?", [findRange(paragraphs, "p2", "특별한 춤을 추어 동료들에게 꽃의 방향과 거리를 정확히 알려 준다.")]),
    makeConfirmQ("q5", "팔자춤의 역할은?", [findRange(paragraphs, "p2", "이 춤을 팔자춤이라고 부르며 이는 꿀벌만의 독특하고 놀라운 의사소통 방법이다.")]),
    makeConfirmQ("q6", "꿀벌 수가 줄어드는 원인은?", [findRange(paragraphs, "p3", "농약 사용과 환경 오염 그리고 기후 변화가 꿀벌이 살기 어려운 환경을 만들고 있기 때문이다.")]),
    makeConfirmQ("q7", "꿀벌을 보호하기 위한 방법은?", [findRange(paragraphs, "p3", "농약 사용을 줄이고 도시에도 꿀벌이 쉴 수 있는 꽃밭을 가꾸는 등의 노력이 꼭 필요하다.")])
  ];
  const content = assembleFull(317, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// === 실행부 ===
const results = [
  { dayIndex: 313, ...buildDay313() }, { dayIndex: 314, ...buildDay314() },
  { dayIndex: 315, ...buildDay315() }, { dayIndex: 316, ...buildDay316() },
  { dayIndex: 317, ...buildDay317() }
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
fs.writeFileSync(path.join(newDir, 'batch-s3-313-317.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log('  \u2705 generated/new/batch-s3-313-317.json');

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}\uC790 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
