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

// === Day 298 (짝수 → 문학) ===
function buildDay298() {
  const paragraphs = [
    { id: "p1", text: "하늘이는 방학 첫날 아침에 할머니 댁으로 가는 기차를 탔다. 창밖으로 논과 밭이 넓게 펼쳐지고, 초록색 산이 멀리서 손짓하는 것 같았다. 하늘이는 기차 안에서 할머니가 보내 준 편지를 꺼내 다시 읽었다. 편지에는 '감나무에 감이 많이 열렸단다'라고 적혀 있었다. 하늘이는 감나무 아래에서 할머니와 함께 감을 따던 작년 가을이 떠올랐다. 할머니는 잘 익은 감을 골라 하늘이 손에 쥐여 주시며 웃으셨다. 기차가 작은 역에 멈추자, 하늘이는 배낭을 메고 내렸다." },
    { id: "p2", text: "역 앞에는 할머니가 밀짚모자를 쓰고 서 계셨다. 하늘이는 달려가 할머니를 꼭 안았고, 할머니는 하늘이의 머리를 쓰다듬으며 많이 컸다고 말씀하셨다. 두 사람은 마을 길을 나란히 걸으며 여름 풍경을 감상했다. 길가에는 해바라기가 서 있었고, 논두렁에서는 개구리 소리가 들려왔다. 할머니 댁 마당에 도착하니, 감나무에 초록 열매가 주렁주렁 달려 있었다. 하늘이는 가을이 오면 감이 주황색으로 물들 거라고 생각하니 벌써 기대가 되었다. 할머니는 시원한 수박을 잘라 내오시며 방학 동안 재미있게 지내자고 하셨다." },
    { id: "p3", text: "저녁에 하늘이는 마당에 돗자리를 깔고 할머니와 나란히 누워 별을 바라보았다. 도시에서는 볼 수 없었던 수많은 별이 반짝이고 있었다. 할머니는 저 밝은 별이 북극성이라고 알려 주시며, 옛날에는 별을 보고 길을 찾았다는 이야기를 해 주셨다. 하늘이는 별을 세다가 스르르 잠이 들었고, 할머니는 살며시 이불을 덮어 주셨다. 이 여름밤의 기억은 하늘이에게 오래오래 남을 것이다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '할머니'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "할머니 댁"),
      findRange(paragraphs, "p1", "할머니가 보내"),
      findRange(paragraphs, "p1", "할머니와 함께"),
      findRange(paragraphs, "p1", "할머니는 잘"),
      findRange(paragraphs, "p2", "할머니가 밀짚모자"),
      findRange(paragraphs, "p2", "할머니는 하늘이의"),
      findRange(paragraphs, "p2", "할머니 댁 마당"),
      findRange(paragraphs, "p2", "할머니는 시원한"),
      findRange(paragraphs, "p3", "할머니와 나란히"),
      findRange(paragraphs, "p3", "할머니는 저"),
      findRange(paragraphs, "p3", "할머니는 살며시"),
    ]),
    makeConfirmQ("q2", "지문에서 '감나무'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "감나무에 감이"),
      findRange(paragraphs, "p1", "감나무 아래에서"),
      findRange(paragraphs, "p2", "감나무에 초록"),
    ]),
    makeConfirmQ("q3", "지문에서 '하늘이'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "하늘이는 방학"),
      findRange(paragraphs, "p1", "하늘이는 기차"),
      findRange(paragraphs, "p1", "하늘이는 감나무"),
      findRange(paragraphs, "p1", "하늘이 손에"),
      findRange(paragraphs, "p1", "하늘이는 배낭"),
      findRange(paragraphs, "p2", "하늘이는 달려가"),
      findRange(paragraphs, "p2", "하늘이의 머리"),
      findRange(paragraphs, "p2", "하늘이는 가을이"),
      findRange(paragraphs, "p3", "하늘이는 마당에"),
      findRange(paragraphs, "p3", "하늘이는 별을"),
      findRange(paragraphs, "p3", "하늘이에게 오래오래"),
    ]),
    makeConfirmQ("q4", "지문에서 '별'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p3", "별을 바라보았다"),
      findRange(paragraphs, "p3", "별이 반짝이고"),
      findRange(paragraphs, "p3", "별이 북극성"),
      findRange(paragraphs, "p3", "별을 보고"),
      findRange(paragraphs, "p3", "별을 세다가"),
    ]),
    makeConfirmQ("q5", "지문에서 '편지'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "편지를 꺼내"),
      findRange(paragraphs, "p1", "편지에는"),
    ]),
  ];
  return { content: assembleFull(298, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 299 (홀수 → 비문학) ===
function buildDay299() {
  const paragraphs = [
    { id: "p1", text: "우리가 매일 마시는 물은 자연 속에서 끊임없이 순환한다. 바다나 강, 호수의 물이 태양열에 의해 증발하면 수증기가 되어 하늘로 올라간다. 수증기는 높은 곳에서 차가운 공기를 만나 작은 물방울로 변하고, 이 물방울들이 모여 구름이 된다. 구름 속 물방울이 점점 무거워지면 비나 눈의 형태로 땅 위에 내려온다. 이렇게 내려온 물은 땅속으로 스며들거나 개울과 강을 따라 흘러 다시 바다로 돌아간다. 이 과정을 물의 순환이라고 부르며, 지구의 물은 이 순환을 수억 년 동안 반복해 왔다." },
    { id: "p2", text: "물의 순환은 우리 생활과 밀접한 관계가 있다. 비가 내려 땅속으로 스며든 물은 지하수가 되어 우물이나 수도관을 통해 가정으로 공급된다. 또한 강과 호수에 모인 물은 정수 과정을 거쳐 깨끗한 식수로 바뀐다. 농사를 짓는 데에도 빗물과 강물이 꼭 필요하며, 공장에서 물건을 만들 때에도 많은 양의 물이 사용된다. 만약 물의 순환이 멈추면 강이 마르고 농작물이 자라지 못해 큰 피해가 발생할 것이다." },
    { id: "p3", text: "따라서 우리는 물을 아끼고 깨끗하게 지켜야 한다. 사용한 물에 기름이나 쓰레기를 버리면 강과 바다가 오염되어 순환 과정에서 문제가 생긴다. 양치질할 때 컵을 사용하고, 설거지할 때 물을 받아 쓰는 작은 실천이 물을 절약하는 첫걸음이다. 깨끗한 물이 순환할 수 있도록 관심을 기울이는 것은 미래 세대를 위한 중요한 책임이기도 하다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '순환'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "순환한다"),
      findRange(paragraphs, "p1", "순환이라고"),
      findRange(paragraphs, "p1", "순환을 수억"),
      findRange(paragraphs, "p2", "순환은 우리"),
      findRange(paragraphs, "p2", "순환이 멈추면"),
      findRange(paragraphs, "p3", "순환 과정에서"),
      findRange(paragraphs, "p3", "순환할 수"),
    ]),
    makeConfirmQ("q2", "지문에서 '수증기'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "수증기가 되어"),
      findRange(paragraphs, "p1", "수증기는 높은"),
    ]),
    makeConfirmQ("q3", "지문에서 '구름'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "구름이 된다"),
      findRange(paragraphs, "p1", "구름 속"),
    ]),
    makeConfirmQ("q4", "지문에서 '지하수'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "지하수가"),
    ]),
    makeConfirmQ("q5", "지문에서 '절약'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p3", "절약하는"),
    ]),
    makeConfirmQ("q6", "지문에서 '오염'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p3", "오염되어"),
    ]),
  ];
  return { content: assembleFull(299, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 300 (짝수 → 문학) ===
function buildDay300() {
  const paragraphs = [
    { id: "p1", text: "은수는 학교 도서관에서 오래된 동화책 한 권을 발견했다. 표지에는 날개 달린 고양이가 그려져 있었고, 제목은 '구름 위의 마을'이었다. 은수는 호기심이 생겨 책을 빌려 교실 뒤편 창가 자리에 앉아 읽기 시작했다. 책 속의 주인공은 작은 고양이 나비였는데, 나비는 어느 날 갑자기 등에 날개가 돋아나 하늘을 날게 되었다. 나비는 구름 위에 있는 작은 마을을 발견하고, 그곳에서 다양한 동물 친구들을 만났다." },
    { id: "p2", text: "구름 마을에는 토끼 요리사, 다람쥐 우체부, 부엉이 선생님이 살고 있었다. 나비는 부엉이 선생님에게 이 마을이 왜 구름 위에 있는지 물었다. 부엉이 선생님은 옛날에 이 마을 동물들이 숲에서 살았는데, 서로 다투기만 하다가 마음이 지쳐 구름 위로 올라왔다고 설명했다. 구름 위에서 함께 힘을 합쳐 마을을 세우면서 비로소 서로를 이해하게 되었다고 했다. 나비는 이 이야기를 듣고 마음이 따뜻해졌다." },
    { id: "p3", text: "은수는 책을 다 읽고 나서 잠시 창밖을 바라보았다. 하늘에 떠 있는 뭉게구름이 정말로 작은 마을처럼 보였다. 은수는 내일 친구들에게 이 책을 추천해야겠다고 마음먹었다. 서로 다투지 않고 힘을 합치면 더 좋은 세상을 만들 수 있다는 책의 메시지가 마음에 깊이 남았기 때문이다. 은수는 책을 소중히 가방에 넣고 집으로 향하면서 오늘 읽은 이야기를 오래 기억하겠다고 다짐했다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '나비'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "나비였는데"),
      findRange(paragraphs, "p1", "나비는 어느"),
      findRange(paragraphs, "p1", "나비는 구름"),
      findRange(paragraphs, "p2", "나비는 부엉이"),
      findRange(paragraphs, "p2", "나비는 이"),
    ]),
    makeConfirmQ("q2", "지문에서 '구름'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "구름 위의"),
      findRange(paragraphs, "p1", "구름 위에 있는"),
      findRange(paragraphs, "p2", "구름 마을에는"),
      findRange(paragraphs, "p2", "구름 위에 있는지"),
      findRange(paragraphs, "p2", "구름 위로"),
      findRange(paragraphs, "p2", "구름 위에서"),
      findRange(paragraphs, "p3", "뭉게구름이"),
    ]),
    makeConfirmQ("q3", "지문에서 '은수'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "은수는 학교"),
      findRange(paragraphs, "p1", "은수는 호기심"),
      findRange(paragraphs, "p3", "은수는 책을"),
      findRange(paragraphs, "p3", "은수는 내일"),
      findRange(paragraphs, "p3", "은수는 책을 소중히"),
    ]),
    makeConfirmQ("q4", "지문에서 '부엉이 선생님'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "부엉이 선생님이"),
      findRange(paragraphs, "p2", "부엉이 선생님에게"),
      findRange(paragraphs, "p2", "부엉이 선생님은"),
    ]),
    makeConfirmQ("q5", "지문에서 '마을'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "마을'이었다"),
      findRange(paragraphs, "p1", "마을을 발견하고"),
      findRange(paragraphs, "p2", "마을에는"),
      findRange(paragraphs, "p2", "마을이 왜"),
      findRange(paragraphs, "p2", "마을 동물들이"),
      findRange(paragraphs, "p2", "마을을 세우면서"),
      findRange(paragraphs, "p3", "마을처럼"),
    ]),
  ];
  return { content: assembleFull(300, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 301 (홀수 → 비문학) ===
function buildDay301() {
  const paragraphs = [
    { id: "p1", text: "지진은 땅속 깊은 곳에서 암석이 갑자기 부서지거나 어긋나면서 발생하는 자연 현상이다. 지구의 표면은 여러 개의 커다란 판으로 이루어져 있는데, 이 판들은 아주 느린 속도로 끊임없이 움직인다. 판과 판이 서로 부딪치거나 어긋나는 경계 부분에서 힘이 쌓이다가 한꺼번에 풀리면 땅이 흔들리게 된다. 이때 발생하는 흔들림의 세기를 규모라고 하며, 규모가 클수록 피해가 커진다. 우리나라도 판의 경계와 완전히 멀지 않아서 크고 작은 지진이 발생하기도 한다." },
    { id: "p2", text: "지진이 발생하면 건물이 무너지거나 도로가 갈라지는 피해가 생길 수 있다. 또한 바닷속에서 지진이 일어나면 해일이라는 거대한 파도가 밀려와 해안가에 큰 피해를 줄 수 있다. 지진은 아직 정확한 시기를 예측하기 어려운 자연재해이기 때문에 평소에 대비하는 것이 매우 중요하다. 집 안의 무거운 가구는 벽에 고정하고, 비상용 가방에는 물과 손전등, 구급약을 미리 넣어 두어야 한다." },
    { id: "p3", text: "지진이 발생했을 때에는 먼저 튼튼한 탁자 아래로 들어가 머리를 보호해야 한다. 흔들림이 멈추면 계단을 이용해 건물 밖으로 신속하게 대피하고, 엘리베이터는 절대 사용하면 안 된다. 넓은 공터나 운동장처럼 건물에서 떨어진 안전한 장소로 이동하는 것이 좋다. 대피 후에는 라디오나 공공 안내 방송을 통해 정확한 정보를 확인하고, 여진에 대비하여 안전한 곳에 머물러야 한다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '지진'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "지진은 땅속"),
      findRange(paragraphs, "p1", "지진이 발생하기도"),
      findRange(paragraphs, "p2", "지진이 발생하면"),
      findRange(paragraphs, "p2", "지진이 일어나면"),
      findRange(paragraphs, "p2", "지진은 아직"),
      findRange(paragraphs, "p3", "지진이 발생했을"),
    ]),
    makeConfirmQ("q2", "지문에서 '판'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "판으로 이루어져"),
      findRange(paragraphs, "p1", "판들은 아주"),
      findRange(paragraphs, "p1", "판이 서로"),
      findRange(paragraphs, "p1", "판의 경계와"),
    ]),
    makeConfirmQ("q3", "지문에서 '대피'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p3", "대피하고"),
      findRange(paragraphs, "p3", "대피 후에는"),
    ]),
    makeConfirmQ("q4", "지문에서 '규모'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "규모라고"),
      findRange(paragraphs, "p1", "규모가 클수록"),
    ]),
    makeConfirmQ("q5", "지문에서 '해일'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "해일이라는"),
    ]),
    makeConfirmQ("q6", "지문에서 '여진'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p3", "여진에 대비하여"),
    ]),
    makeConfirmQ("q7", "지문에서 '피해'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "피해가 커진다"),
      findRange(paragraphs, "p2", "피해가 생길"),
      findRange(paragraphs, "p2", "피해를 줄"),
    ]),
  ];
  return { content: assembleFull(301, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 302 (짝수 → 문학) ===
function buildDay302() {
  const paragraphs = [
    { id: "p1", text: "예린이는 미술 시간에 자유 주제로 그림을 그리게 되었다. 다른 친구들은 벌써 크레파스와 물감을 꺼내 열심히 색칠하고 있었지만, 예린이는 무엇을 그릴지 떠오르지 않아 빈 도화지만 바라보았다. 선생님이 다가오셔서 떠오르지 않으면 가장 좋아하는 장소를 생각해 보라고 말씀하셨다. 예린이는 눈을 감고 생각해 보니 여름마다 가족과 함께 갔던 바닷가가 떠올랐다. 파란 바다와 하얀 모래사장, 그리고 갈매기들이 날아다니는 풍경이 머릿속에 선명하게 그려졌다." },
    { id: "p2", text: "예린이는 먼저 도화지 위쪽에 파란색 물감으로 넓은 하늘을 칠했다. 그 아래에는 진한 파란색과 연한 초록색을 섞어 출렁이는 바다를 표현했다. 모래사장은 노란색과 살구색을 번갈아 칠해 햇살에 반짝이는 느낌을 살렸다. 하늘 위에는 하얀 갈매기 세 마리를 그렸는데, 한 마리는 날개를 활짝 펴고 나머지 두 마리는 멀리 작게 날고 있는 모습으로 그렸다. 바닷가 한쪽에는 빨간 파라솔 아래에서 수박을 먹고 있는 가족의 모습도 작게 그려 넣었다." },
    { id: "p3", text: "그림이 완성되자 옆자리에 앉은 민호가 바다 그림이 진짜 예쁘다며 감탄했다. 예린이는 뿌듯한 마음으로 그림을 들어 올려 한 번 더 바라보았다. 그림 속 바닷가에서 웃고 있는 가족의 모습이 마치 사진처럼 생생하게 느껴졌다. 선생님도 색을 잘 섞어서 바다의 느낌이 잘 살아 있다고 칭찬해 주셨다. 예린이는 이 그림을 집에 가져가 거실 벽에 붙여 두겠다고 마음속으로 결심했다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '예린이'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "예린이는 미술"),
      findRange(paragraphs, "p1", "예린이는 무엇을"),
      findRange(paragraphs, "p1", "예린이는 눈을"),
      findRange(paragraphs, "p2", "예린이는 먼저"),
      findRange(paragraphs, "p3", "예린이는 뿌듯한"),
      findRange(paragraphs, "p3", "예린이는 이"),
    ]),
    makeConfirmQ("q2", "지문에서 '바다'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "바다와 하얀"),
      findRange(paragraphs, "p2", "바다를 표현했다"),
      findRange(paragraphs, "p2", "바닷가 한쪽에는"),
      findRange(paragraphs, "p3", "바다 그림이"),
      findRange(paragraphs, "p3", "바닷가에서 웃고"),
      findRange(paragraphs, "p3", "바다의 느낌이"),
    ]),
    makeConfirmQ("q3", "지문에서 '갈매기'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "갈매기들이"),
      findRange(paragraphs, "p2", "갈매기 세"),
    ]),
    makeConfirmQ("q4", "지문에서 '물감'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "물감을 꺼내"),
      findRange(paragraphs, "p2", "물감으로 넓은"),
    ]),
    makeConfirmQ("q5", "지문에서 '가족'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "가족과 함께"),
      findRange(paragraphs, "p2", "가족의 모습도"),
      findRange(paragraphs, "p3", "가족의 모습이"),
    ]),
    makeConfirmQ("q6", "지문에서 '선생님'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "선생님이 다가오셔서"),
      findRange(paragraphs, "p3", "선생님도 색을"),
    ]),
  ];
  return { content: assembleFull(302, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === 실행부 ===
const results = [
  { dayIndex: 298, ...buildDay298() }, { dayIndex: 299, ...buildDay299() },
  { dayIndex: 300, ...buildDay300() }, { dayIndex: 301, ...buildDay301() },
  { dayIndex: 302, ...buildDay302() }
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
fs.writeFileSync(path.join(newDir, 'batch-s3-298-302.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ generated/new/batch-s3-298-302.json`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
