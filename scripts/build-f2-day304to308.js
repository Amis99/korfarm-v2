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
  return { contentId: `dr-f2-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(프레게 2) Day ${dayIndex} ${subAreaKo}`, description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_2", schoolGradeRange: { min: 6, max: 6 }, area: "READING", subArea,
    competencies: ["READING"], tags: ["daily"], access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 }, timeLimitSec: 480, assets: {},
    payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 }, confirm: { questions: confirmQuestions } }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return { content_type: "DAILY_READING", level_id: "FREGE_2", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// === Day 304 (짝수 → 문학) ===
function buildDay304() {
  const paragraphs = [
    { id: "p1", text: "할머니의 손은 언제나 따뜻했다. 겨울이면 그 손으로 내 볼을 감싸 주셨고, 여름이면 부채질을 해 주시며 시원한 바람을 만들어 주셨다. 할머니는 말씀이 적으셨지만, 손끝에 담긴 정성만큼은 어떤 말보다 깊었다. 봄에는 마당에 나가 흙을 만지시며 꽃씨를 심으셨고, 가을에는 감나무 아래에서 잘 익은 감을 따 주셨다. 어린 시절 나는 할머니 곁에 앉아 그 손을 가만히 바라보곤 했다. 주름진 손등 위로 흐르는 핏줄이 마치 오래된 나무의 뿌리처럼 보였다. 그 손이 만들어 낸 음식은 세상에서 가장 맛있었고, 그 손이 쓸어 준 머리카락 위에는 언제나 잠이 찾아왔다." },
    { id: "p2", text: "초등학교 육 학년이 되던 해, 할머니는 갑자기 편찮으셨다. 병원에 입원하신 할머니의 손은 예전과 달리 차가웠다. 나는 그 손을 꼭 잡고 울었다. 할머니는 힘겹게 미소를 지으시며 말씀하셨다. \"울지 마라, 할머니 손이 차가워도 마음은 따뜻하단다.\" 그 말을 듣고 나는 더 크게 울고 말았다. 할머니의 손을 놓지 않으려고 온 힘을 다해 붙잡았지만, 시간은 멈추지 않았다. 병실 창문 너머로 가을 나뭇잎이 하나둘 떨어지고 있었다. 할머니는 떨리는 손으로 내 머리를 한 번 쓰다듬어 주셨는데, 그 느낌이 아직도 생생하게 남아 있다." },
    { id: "p3", text: "할머니가 돌아가신 뒤, 나는 오랫동안 할머니의 손을 떠올렸다. 추운 겨울날 장갑 없이 걸을 때면 할머니 손이 그리웠고, 맛있는 음식을 먹을 때면 할머니가 해 주신 밥이 생각났다. 시간이 흘러 어른이 된 지금, 나는 내 아이의 볼을 감싸며 할머니를 떠올린다. 내 손이 아이에게 할머니의 손처럼 따뜻하게 느껴지기를 바란다. 할머니의 사랑은 손을 통해 전해졌고, 그 온기는 세대를 넘어 이어지고 있다. 나는 오늘도 아이의 손을 꼭 잡고 걸으며 할머니가 남긴 따뜻함을 전한다. 언젠가 내 아이도 자신의 아이에게 이 온기를 전해 주리라 믿는다." }
  ];
  console.log(`  Day 304 지문 길이: ${charLen(paragraphs)}자`);
  const questions = [
    makeConfirmQ("q1", "할머니의 손은 계절마다 어떤 역할을 했나요?", [findRange(paragraphs, "p1", "겨울이면 그 손으로 내 볼을 감싸 주셨고, 여름이면 부채질을 해 주시며 시원한 바람을 만들어 주셨다.")]),
    makeConfirmQ("q2", "어린 시절 화자는 할머니의 손등을 무엇에 비유했나요?", [findRange(paragraphs, "p1", "주름진 손등 위로 흐르는 핏줄이 마치 오래된 나무의 뿌리처럼 보였다.")]),
    makeConfirmQ("q3", "할머니가 병원에 입원하셨을 때 손은 어떻게 변했나요?", [findRange(paragraphs, "p2", "병원에 입원하신 할머니의 손은 예전과 달리 차가웠다.")]),
    makeConfirmQ("q4", "할머니는 우는 화자에게 어떤 말씀을 하셨나요?", [findRange(paragraphs, "p2", "울지 마라, 할머니 손이 차가워도 마음은 따뜻하단다.")]),
    makeConfirmQ("q5", "화자는 어른이 된 지금 무엇을 하며 할머니를 떠올리나요?", [findRange(paragraphs, "p3", "내 아이의 볼을 감싸며 할머니를 떠올린다.")]),
    makeConfirmQ("q6", "할머니의 사랑이 전해진 방식은 무엇인가요?", [findRange(paragraphs, "p3", "할머니의 사랑은 손을 통해 전해졌고, 그 온기는 세대를 넘어 이어지고 있다.")])
  ];
  return { content: assembleFull(304, "LITERATURE", "문학", paragraphs, questions), subArea: "LITERATURE" };
}

// === Day 305 (홀수 → 비문학) ===
function buildDay305() {
  const paragraphs = [
    { id: "p1", text: "화산은 지구 내부의 마그마가 지표면으로 분출하는 현상이다. 지구의 내부는 매우 뜨거운 상태로, 지각 아래에는 암석이 녹은 마그마가 존재한다. 이 마그마가 지각의 약한 부분을 뚫고 올라오면 화산 폭발이 일어난다. 화산 활동은 주로 판의 경계에서 발생하며, 환태평양 조산대가 대표적인 화산 활동 지역이다. 이 지역은 태평양을 둘러싸고 있어 '불의 고리'라고도 불린다. 화산이 폭발하면 용암, 화산재, 가스 등이 분출되는데, 이러한 물질은 주변 환경에 큰 영향을 미친다. 특히 화산재는 대기 중에 퍼져 기후 변화를 일으킬 수 있으며, 항공기 운항에도 심각한 지장을 줄 수 있다." },
    { id: "p2", text: "화산 활동에는 여러 종류가 있다. 조용히 용암이 흘러내리는 순상 화산이 있고, 격렬하게 폭발하는 성층 화산도 있다. 하와이의 킬라우에아 화산은 순상 화산의 대표적인 예로, 점성이 낮은 용암이 넓게 퍼지며 완만한 경사면을 만든다. 반면 일본의 후지산이나 필리핀의 피나투보 화산은 성층 화산에 해당하며, 폭발적인 분화와 함께 높은 원뿔 모양을 형성한다. 1991년 피나투보 화산의 대규모 분화는 전 세계 평균 기온을 일시적으로 낮출 만큼 강력했다. 화산의 분출 형태는 마그마의 점성과 가스 함량에 따라 달라진다." },
    { id: "p3", text: "화산은 파괴적인 면도 있지만, 인간에게 이로운 점도 많다. 화산 활동으로 생긴 토양은 광물질이 풍부하여 농사에 적합하다. 제주도의 비옥한 화산 토양이 대표적인 사례이다. 또한 화산 지역에서는 지열 에너지를 활용할 수 있어 친환경 에너지원으로 주목받고 있다. 아이슬란드는 지열 에너지를 난방과 발전에 적극 활용하는 대표적인 나라이다. 화산 온천 역시 관광 자원으로 큰 가치를 지닌다. 이처럼 화산은 위험과 혜택을 동시에 지닌 자연 현상으로, 인간은 화산 활동을 연구하고 예측하여 피해를 최소화하면서도 그 혜택을 누리기 위해 노력하고 있다." }
  ];
  console.log(`  Day 305 지문 길이: ${charLen(paragraphs)}자`);
  const questions = [
    makeConfirmQ("q1", "화산 폭발이 일어나는 원리는 무엇인가요?", [findRange(paragraphs, "p1", "마그마가 지각의 약한 부분을 뚫고 올라오면 화산 폭발이 일어난다.")]),
    makeConfirmQ("q2", "환태평양 조산대가 '불의 고리'라고 불리는 이유는 무엇인가요?", [findRange(paragraphs, "p1", "이 지역은 태평양을 둘러싸고 있어 '불의 고리'라고도 불린다.")]),
    makeConfirmQ("q3", "화산재가 미치는 영향에는 무엇이 있나요?", [findRange(paragraphs, "p1", "화산재는 대기 중에 퍼져 기후 변화를 일으킬 수 있으며, 항공기 운항에도 심각한 지장을 줄 수 있다.")]),
    makeConfirmQ("q4", "순상 화산의 대표적인 예는 무엇인가요?", [findRange(paragraphs, "p2", "하와이의 킬라우에아 화산은 순상 화산의 대표적인 예로, 점성이 낮은 용암이 넓게 퍼지며 완만한 경사면을 만든다.")]),
    makeConfirmQ("q5", "화산의 분출 형태를 결정하는 요인은 무엇인가요?", [findRange(paragraphs, "p2", "화산의 분출 형태는 마그마의 점성과 가스 함량에 따라 달라진다.")]),
    makeConfirmQ("q6", "화산 활동이 인간에게 이로운 점은 무엇인가요?", [findRange(paragraphs, "p3", "화산 활동으로 생긴 토양은 광물질이 풍부하여 농사에 적합하다.")]),
    makeConfirmQ("q7", "지열 에너지를 적극 활용하는 나라는 어디인가요?", [findRange(paragraphs, "p3", "아이슬란드는 지열 에너지를 난방과 발전에 적극 활용하는 대표적인 나라이다.")])
  ];
  return { content: assembleFull(305, "NONFICTION", "비문학", paragraphs, questions), subArea: "NONFICTION" };
}

// === Day 306 (짝수 → 문학) ===
function buildDay306() {
  const paragraphs = [
    { id: "p1", text: "비가 내리던 토요일 오후, 민서는 창가에 앉아 빗소리를 듣고 있었다. 유리창에 부딪히는 빗방울이 작은 강줄기를 만들며 흘러내렸다. 민서는 오늘 약속된 축구 경기가 취소되어 무척 실망한 상태였다. 일주일 내내 기다려 온 경기였는데, 아침부터 쏟아지는 비 때문에 운동장이 물에 잠겨 버린 것이다. 같은 반 친구들과 오래전부터 준비해 온 시합이라 기대가 컸기에 아쉬움은 더 크게 느껴졌다. 민서는 한숨을 쉬며 소파에 몸을 기댔다. 거실에서는 어머니가 무언가를 만들고 계셨는데, 달콤한 냄새가 집 안 가득 퍼지고 있었다." },
    { id: "p2", text: "\"민서야, 이리 와 봐.\" 어머니의 부름에 민서는 마지못해 부엌으로 갔다. 테이블 위에는 밀가루 반죽과 여러 가지 재료가 놓여 있었다. 버터, 설탕, 달걀, 그리고 초콜릿 칩까지 가지런히 준비되어 있었다. \"비 오는 날에는 함께 빵을 만드는 게 최고란다.\" 어머니가 웃으며 말씀하셨다. 민서는 처음에는 별로 내키지 않았지만, 반죽을 주물러 보니 손에 닿는 촉감이 재미있었다. 부드러운 반죽이 손가락 사이로 빠져나가고, 다시 모아서 누르고 접는 과정이 반복되었다. 어느새 민서의 얼굴에서 실망의 기색이 사라지고 미소가 번지기 시작했다." },
    { id: "p3", text: "오븐에서 빵이 구워지는 동안 민서와 어머니는 따뜻한 코코아를 마시며 창밖의 비를 함께 바라보았다. 빗소리가 이제는 불쾌하게 느껴지지 않았다. 오히려 차분하고 편안한 음악처럼 들렸다. 빵이 다 구워지자 집 안은 고소한 향기로 가득 찼다. 민서는 갓 구운 빵 한 조각을 입에 넣었다. 바삭한 겉면과 부드러운 속이 어우러진 맛이 일품이었다. 초콜릿 칩이 녹아 달콤한 맛이 입안에 퍼졌다. 민서는 생각했다. 축구를 못 한 것은 아쉽지만, 어머니와 함께한 이 시간이 더 소중하다고. 비 오는 토요일이 새로운 추억을 선물해 준 것이다. 민서는 어머니에게 고맙다고 말하며 환하게 웃었다." }
  ];
  console.log(`  Day 306 지문 길이: ${charLen(paragraphs)}자`);
  const questions = [
    makeConfirmQ("q1", "민서가 실망한 이유는 무엇인가요?", [findRange(paragraphs, "p1", "오늘 약속된 축구 경기가 취소되어 무척 실망한 상태였다.")]),
    makeConfirmQ("q2", "축구 경기가 취소된 원인은 무엇인가요?", [findRange(paragraphs, "p1", "아침부터 쏟아지는 비 때문에 운동장이 물에 잠겨 버린 것이다.")]),
    makeConfirmQ("q3", "어머니는 비 오는 날에 무엇을 하자고 제안하셨나요?", [findRange(paragraphs, "p2", "비 오는 날에는 함께 빵을 만드는 게 최고란다.")]),
    makeConfirmQ("q4", "반죽을 만지며 민서에게 어떤 변화가 일어났나요?", [findRange(paragraphs, "p2", "어느새 민서의 얼굴에서 실망의 기색이 사라지고 미소가 번지기 시작했다.")]),
    makeConfirmQ("q5", "빗소리에 대한 민서의 감정은 어떻게 변했나요?", [findRange(paragraphs, "p3", "빗소리가 이제는 불쾌하게 느껴지지 않았다. 오히려 차분하고 편안한 음악처럼 들렸다.")]),
    makeConfirmQ("q6", "민서가 깨달은 것은 무엇인가요?", [findRange(paragraphs, "p3", "축구를 못 한 것은 아쉽지만, 어머니와 함께한 이 시간이 더 소중하다고.")])
  ];
  return { content: assembleFull(306, "LITERATURE", "문학", paragraphs, questions), subArea: "LITERATURE" };
}

// === Day 307 (홀수 → 비문학) ===
function buildDay307() {
  const paragraphs = [
    { id: "p1", text: "인공위성은 지구 둘레를 돌며 다양한 임무를 수행하는 장치이다. 인공위성이 지구 주위를 떠돌 수 있는 이유는 중력과 원심력의 균형 때문이다. 지구의 중력이 위성을 끌어당기는 힘과 위성이 빠르게 이동하며 바깥으로 나가려는 원심력이 서로 균형을 이루면, 위성은 일정한 궤도를 따라 계속 돌 수 있다. 이를 '궤도 운동'이라고 하며, 위성의 속도와 고도에 따라 궤도의 형태가 결정된다. 최초의 인공위성은 1957년 소련이 발사한 스푸트니크 1호이다. 이 작은 금속 구체가 우주로 올라간 이후, 인류의 우주 탐사는 비약적으로 발전하였다." },
    { id: "p2", text: "인공위성은 용도에 따라 여러 종류로 나뉜다. 통신 위성은 전화, 인터넷, 방송 신호를 전달하는 역할을 한다. 기상 위성은 구름의 움직임과 기온 변화를 관측하여 날씨 예보에 활용된다. 항법 위성은 우리가 일상적으로 사용하는 내비게이션의 핵심 기술로, 위치 정보를 정밀하게 제공한다. 대표적인 항법 위성 시스템으로는 미국의 GPS와 유럽의 갈릴레오가 있다. 이 밖에도 지구 관측 위성은 산림 변화, 해양 오염, 도시 확장 등을 감시하며 환경 보호에 기여한다. 군사 위성은 정찰과 통신 보안에 활용되어 국가 안보에 중요한 역할을 담당한다." },
    { id: "p3", text: "그러나 인공위성이 늘어나면서 우주 쓰레기 문제도 심각해지고 있다. 수명이 다한 위성이나 로켓 잔해가 지구 궤도에 남아 다른 위성과 충돌할 위험이 있다. 현재 지구 궤도에는 수천 개의 작동 중인 위성과 수백만 개의 우주 쓰레기 조각이 떠돌고 있다. 작은 파편이라도 초속 수 킬로미터의 속도로 움직이기 때문에 충돌 시 엄청난 파괴력을 지닌다. 이를 해결하기 위해 과학자들은 우주 쓰레기를 수거하는 기술을 개발하고 있으며, 위성의 수명이 다하면 스스로 궤도를 벗어나 대기권에서 소멸하도록 설계하는 방안도 연구 중이다. 우주 환경을 깨끗하게 유지하는 것은 미래 우주 활동의 안전을 위해 반드시 필요한 과제이다." }
  ];
  console.log(`  Day 307 지문 길이: ${charLen(paragraphs)}자`);
  const questions = [
    makeConfirmQ("q1", "인공위성이 지구 주위를 도는 원리는 무엇인가요?", [findRange(paragraphs, "p1", "지구의 중력이 위성을 끌어당기는 힘과 위성이 빠르게 이동하며 바깥으로 나가려는 원심력이 서로 균형을 이루면, 위성은 일정한 궤도를 따라 계속 돌 수 있다.")]),
    makeConfirmQ("q2", "최초의 인공위성은 무엇인가요?", [findRange(paragraphs, "p1", "최초의 인공위성은 1957년 소련이 발사한 스푸트니크 1호이다.")]),
    makeConfirmQ("q3", "기상 위성은 어떤 역할을 하나요?", [findRange(paragraphs, "p2", "기상 위성은 구름의 움직임과 기온 변화를 관측하여 날씨 예보에 활용된다.")]),
    makeConfirmQ("q4", "항법 위성이 제공하는 기능은 무엇인가요?", [findRange(paragraphs, "p2", "항법 위성은 우리가 일상적으로 사용하는 내비게이션의 핵심 기술로, 위치 정보를 정밀하게 제공한다.")]),
    makeConfirmQ("q5", "우주 쓰레기 문제가 심각해진 이유는 무엇인가요?", [findRange(paragraphs, "p3", "수명이 다한 위성이나 로켓 잔해가 지구 궤도에 남아 다른 위성과 충돌할 위험이 있다.")]),
    makeConfirmQ("q6", "작은 우주 쓰레기 파편이 위험한 이유는 무엇인가요?", [findRange(paragraphs, "p3", "작은 파편이라도 초속 수 킬로미터의 속도로 움직이기 때문에 충돌 시 엄청난 파괴력을 지닌다.")]),
    makeConfirmQ("q7", "우주 쓰레기를 해결하기 위한 방안은 무엇인가요?", [findRange(paragraphs, "p3", "위성의 수명이 다하면 스스로 궤도를 벗어나 대기권에서 소멸하도록 설계하는 방안도 연구 중이다.")])
  ];
  return { content: assembleFull(307, "NONFICTION", "비문학", paragraphs, questions), subArea: "NONFICTION" };
}

// === Day 308 (짝수 → 문학) ===
function buildDay308() {
  const paragraphs = [
    { id: "p1", text: "수진이는 전학 온 첫날부터 교실 한구석에 혼자 앉아 있었다. 새로운 학교, 새로운 친구들 사이에서 수진이는 마치 투명 인간이 된 것 같았다. 쉬는 시간에도 아무도 말을 걸지 않았고, 점심시간에는 혼자 급식을 먹었다. 수진이는 이전 학교에서의 친구들이 그리웠다. 매일 함께 웃고 떠들던 그 시절이 꿈처럼 느껴졌다. 특히 가장 친했던 예나와 헤어진 것이 가장 마음 아팠다. 하지만 아버지의 직장 때문에 이사를 왔으니 어쩔 수 없는 일이었다. 수진이는 책상 위에 놓인 공책에 아무 의미 없는 그림을 그리며 시간을 보냈다." },
    { id: "p2", text: "그러던 어느 날, 옆자리의 하은이가 수진이의 공책을 슬쩍 들여다보았다. \"그림 정말 잘 그린다!\" 하은이가 눈을 반짝이며 말했다. 수진이는 깜짝 놀라 공책을 덮으려 했지만, 하은이의 진심 어린 표정에 멈칫했다. 하은이는 미술부에서 활동하고 있었고, 수진이에게 함께 미술부에 들어오지 않겠냐고 제안했다. 수진이는 망설였다. 새로운 사람들 앞에 나서는 것이 두려웠기 때문이다. 하지만 하은이의 따뜻한 미소가 용기를 주었다. 하은이는 \"걱정하지 마, 우리 부원들 다 착해\"라며 수진이의 손을 잡아 주었다. 수진이는 조심스럽게 고개를 끄덕였다." },
    { id: "p3", text: "미술부에 들어간 수진이는 조금씩 변하기 시작했다. 붓을 들고 캔버스 앞에 서면 말로 표현하지 못했던 감정들이 색채로 흘러나왔다. 외로움은 파란색으로, 그리움은 보라색으로, 새로운 시작에 대한 설렘은 노란색으로 표현되었다. 미술부 친구들은 수진이의 그림을 보며 감탄했고, 수진이는 처음으로 이 학교에서 자신의 자리를 찾은 기분이 들었다. 방과 후 미술실에서 함께 작업하며 웃고 이야기하는 시간이 점점 소중해졌다. 학기 말 미술 전시회에서 수진이의 작품은 최우수상을 받았다. 하은이가 달려와 안아 주며 축하해 주었을 때, 수진이는 전학 온 그날의 외로움이 이제는 아득한 과거가 되었음을 깨달았다." }
  ];
  console.log(`  Day 308 지문 길이: ${charLen(paragraphs)}자`);
  const questions = [
    makeConfirmQ("q1", "수진이가 전학 온 첫날 어떤 기분이었나요?", [findRange(paragraphs, "p1", "새로운 학교, 새로운 친구들 사이에서 수진이는 마치 투명 인간이 된 것 같았다.")]),
    makeConfirmQ("q2", "수진이가 전학을 오게 된 이유는 무엇인가요?", [findRange(paragraphs, "p1", "아버지의 직장 때문에 이사를 왔으니 어쩔 수 없는 일이었다.")]),
    makeConfirmQ("q3", "하은이가 수진이에게 처음 말을 건 계기는 무엇인가요?", [findRange(paragraphs, "p2", "옆자리의 하은이가 수진이의 공책을 슬쩍 들여다보았다. \"그림 정말 잘 그린다!\"")]),
    makeConfirmQ("q4", "하은이는 수진이에게 어떤 제안을 했나요?", [findRange(paragraphs, "p2", "수진이에게 함께 미술부에 들어오지 않겠냐고 제안했다.")]),
    makeConfirmQ("q5", "수진이는 미술부에서 감정을 어떻게 표현했나요?", [findRange(paragraphs, "p3", "외로움은 파란색으로, 그리움은 보라색으로, 새로운 시작에 대한 설렘은 노란색으로 표현되었다.")]),
    makeConfirmQ("q6", "학기 말 미술 전시회에서 수진이의 성과는 무엇이었나요?", [findRange(paragraphs, "p3", "학기 말 미술 전시회에서 수진이의 작품은 최우수상을 받았다.")]),
    makeConfirmQ("q7", "수진이가 마지막에 깨달은 것은 무엇인가요?", [findRange(paragraphs, "p3", "전학 온 그날의 외로움이 이제는 아득한 과거가 되었음을 깨달았다.")])
  ];
  return { content: assembleFull(308, "LITERATURE", "문학", paragraphs, questions), subArea: "LITERATURE" };
}

// === 실행부 ===
const results = [
  { dayIndex: 304, ...buildDay304() }, { dayIndex: 305, ...buildDay305() },
  { dayIndex: 306, ...buildDay306() }, { dayIndex: 307, ...buildDay307() },
  { dayIndex: 308, ...buildDay308() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
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
fs.writeFileSync(path.join(newDir, 'batch-f2-304-308.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ batch-f2-304-308.json 생성 완료`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
