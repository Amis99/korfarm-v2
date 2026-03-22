const fs = require('fs');
const path = require('path');

// -- 유틸리티 함수 --

function findSentences(text) {
  const sentences = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1;
      while (next < text.length && (text[next] === ' ' || text[next] === '\n')) next++;
      start = next;
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
  return {
    contentId: `dr-f2-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(프레게 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_2", schoolGradeRange: { min: 6, max: 6 },
    area: "READING", subArea, competencies: ["READING"], tags: ["daily"],
    access: { mode: "FREE" }, seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480, assets: {},
    payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline }, recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 }, confirm: { questions: confirmQuestions } }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return { content_type: "DAILY_READING", level_id: "FREGE_2", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// -- Day 264 (짝수 -> 문학) --
function buildDay264() {
  const paragraphs = [
    { id: "p1", text: "소연이는 여름방학 첫날, 외할머니가 사시는 시골 마을에 도착했다. 버스에서 내리자마자 풀 냄새와 흙 냄새가 코끝을 간질였고, 도시에서는 들을 수 없었던 매미 소리가 사방에서 울려 퍼지고 있었다. 외할머니 댁 마당에는 봉선화가 빨갛게 피어 있었고, 처마 밑에는 제비집에서 새끼 제비들이 고개를 내밀고 있었다. 소연이는 가방을 내려놓기도 전에 마당을 한 바퀴 돌며 달라진 풍경을 눈에 담았다." },
    { id: "p2", text: "외할머니는 소연이를 보자마자 주름진 얼굴에 환한 미소를 지으며 손을 꼭 잡아 주었다. 점심으로 텃밭에서 갓 딴 상추와 고추로 쌈밥을 차려 주셨는데, 아삭아삭한 식감과 싱그러운 맛이 도시의 어떤 음식과도 달랐다. 식사 후 외할머니는 뒷산 개울로 가자고 하셨다. 소연이는 운동화를 벗고 차가운 개울물에 발을 담갔는데, 투명한 물속에서 작은 물고기들이 발가락 사이를 지나가는 것이 간지러우면서도 신기했다." },
    { id: "p3", text: "해가 기울 무렵 외할머니는 소연이에게 반딧불이를 보여 주겠다고 하셨다. 어둠이 내려앉자 논두렁 사이에서 초록빛 점들이 하나둘 나타나기 시작했다. 반딧불이는 마치 땅에서 별이 피어오르는 것처럼 풀잎 사이를 떠다녔다. 소연이는 숨을 죽이고 손바닥을 펼쳤더니 반딧불이 한 마리가 손끝에 내려앉았다. 작은 빛이 손바닥 위에서 깜빡이는 모습을 보며 소연이는 마음속까지 환해지는 기분이 들었다." },
    { id: "p4", text: "잠자리에 누워 소연이는 오늘 하루를 떠올렸다. 도시에서는 늘 빼곡한 일정에 쫓기며 지냈는데, 이곳에서는 시간이 천천히 흐르는 것 같았다. 외할머니의 따뜻한 손, 개울물의 차가운 촉감, 반딧불이의 고요한 빛이 하나의 그림처럼 마음에 남았다. 소연이는 방학이 끝나기 전에 외할머니와 함께 보낼 날들이 아직 많이 남아 있다는 사실에 감사하며, 귀뚜라미 소리를 자장가 삼아 스르르 잠이 들었다." }
  ];
  console.log(`Day 264 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '풀 냄새와 흙 냄새가 코끝을 간질였고'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "풀 냄새와 흙 냄새가 코끝을 간질였고")]),
    makeConfirmQ("q2", "지문에서 '처마 밑에는 제비집에서 새끼 제비들이 고개를 내밀고 있었다'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "처마 밑에는 제비집에서 새끼 제비들이 고개를 내밀고 있었다")]),
    makeConfirmQ("q3", "지문에서 '아삭아삭한 식감과 싱그러운 맛이 도시의 어떤 음식과도 달랐다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "아삭아삭한 식감과 싱그러운 맛이 도시의 어떤 음식과도 달랐다")]),
    makeConfirmQ("q4", "지문에서 '투명한 물속에서 작은 물고기들이 발가락 사이를 지나가는 것이 간지러우면서도 신기했다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "투명한 물속에서 작은 물고기들이 발가락 사이를 지나가는 것이 간지러우면서도 신기했다")]),
    makeConfirmQ("q5", "지문에서 '반딧불이는 마치 땅에서 별이 피어오르는 것처럼 풀잎 사이를 떠다녔다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "반딧불이는 마치 땅에서 별이 피어오르는 것처럼 풀잎 사이를 떠다녔다")]),
    makeConfirmQ("q6", "지문에서 '작은 빛이 손바닥 위에서 깜빡이는 모습을 보며 소연이는 마음속까지 환해지는 기분이 들었다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "작은 빛이 손바닥 위에서 깜빡이는 모습을 보며 소연이는 마음속까지 환해지는 기분이 들었다")]),
    makeConfirmQ("q7", "지문에서 '귀뚜라미 소리를 자장가 삼아 스르르 잠이 들었다'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "귀뚜라미 소리를 자장가 삼아 스르르 잠이 들었다")])
  ];
  return { content: assembleFull(264, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// -- Day 265 (홀수 -> 비문학) --
function buildDay265() {
  const paragraphs = [
    { id: "p1", text: "해류는 바닷물이 일정한 방향으로 지속적으로 흐르는 현상으로, 지구의 기후와 생태계에 결정적인 영향을 미친다. 해류가 발생하는 원인은 크게 바람, 수온 차이, 염분 차이의 세 가지로 나눌 수 있다. 바람에 의한 해류는 무역풍이나 편서풍 같은 대기 순환에 의해 해수면 가까이에서 형성되며, 전 세계 해류 순환의 상층부를 구성한다. 수온과 염분의 차이에 의해 발생하는 심층 해류는 바다 깊은 곳에서 천천히 흐르며, 전 지구적 열 순환을 담당한다." },
    { id: "p2", text: "해류는 온도에 따라 난류와 한류로 구분된다. 난류는 적도 부근의 따뜻한 바닷물이 고위도 지역으로 이동하는 흐름으로, 대표적으로 멕시코 만류가 있다. 멕시코 만류는 대서양을 가로질러 유럽 서부 해안까지 따뜻한 물을 운반하기 때문에, 같은 위도의 다른 지역보다 서유럽의 겨울이 온화한 편이다. 반대로 한류는 극지방의 차가운 바닷물이 저위도로 흘러가는 것으로, 페루 해안의 훔볼트 해류가 대표적이며 이 지역에 풍부한 어장을 형성하는 원인이 된다." },
    { id: "p3", text: "해류는 해양 생태계에도 깊은 영향을 미친다. 한류와 난류가 만나는 조경 수역에서는 영양 염류가 풍부하게 공급되어 플랑크톤이 대량으로 번식하고, 이를 먹이로 하는 물고기가 모여들어 세계적인 어장이 형성된다. 우리나라 동해에서 북한 한류와 쿠로시오 난류의 지류가 만나는 해역이 바로 이러한 조경 수역에 해당하며, 오징어, 명태, 고등어 등이 풍부하게 잡히는 이유가 된다." },
    { id: "p4", text: "기후 변화로 인해 해류의 흐름이 변하고 있다는 연구 결과가 잇따르고 있다. 북극의 빙하가 녹으면서 대량의 담수가 바다로 유입되면 해수의 염분 농도가 낮아져 심층 해류의 순환이 약해질 수 있다. 이는 유럽의 기온을 급격히 떨어뜨리거나 열대 지역의 강수 패턴을 바꾸는 등 전 지구적인 기후 변동을 일으킬 수 있다. 과학자들은 해류 변화를 지속적으로 관측하며, 기후 예측 모델의 정확도를 높이기 위해 노력하고 있다." }
  ];
  console.log(`Day 265 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '해류가 발생하는 원인은 크게 바람, 수온 차이, 염분 차이의 세 가지로 나눌 수 있다'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "해류가 발생하는 원인은 크게 바람, 수온 차이, 염분 차이의 세 가지로 나눌 수 있다")]),
    makeConfirmQ("q2", "지문에서 '수온과 염분의 차이에 의해 발생하는 심층 해류는 바다 깊은 곳에서 천천히 흐르며'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "수온과 염분의 차이에 의해 발생하는 심층 해류는 바다 깊은 곳에서 천천히 흐르며")]),
    makeConfirmQ("q3", "지문에서 '같은 위도의 다른 지역보다 서유럽의 겨울이 온화한 편이다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "같은 위도의 다른 지역보다 서유럽의 겨울이 온화한 편이다")]),
    makeConfirmQ("q4", "지문에서 '페루 해안의 훔볼트 해류가 대표적이며 이 지역에 풍부한 어장을 형성하는 원인이 된다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "페루 해안의 훔볼트 해류가 대표적이며 이 지역에 풍부한 어장을 형성하는 원인이 된다")]),
    makeConfirmQ("q5", "지문에서 '영양 염류가 풍부하게 공급되어 플랑크톤이 대량으로 번식하고'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "영양 염류가 풍부하게 공급되어 플랑크톤이 대량으로 번식하고")]),
    makeConfirmQ("q6", "지문에서 '오징어, 명태, 고등어 등이 풍부하게 잡히는 이유가 된다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "오징어, 명태, 고등어 등이 풍부하게 잡히는 이유가 된다")]),
    makeConfirmQ("q7", "지문에서 '유럽의 기온을 급격히 떨어뜨리거나 열대 지역의 강수 패턴을 바꾸는 등 전 지구적인 기후 변동을 일으킬 수 있다'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "유럽의 기온을 급격히 떨어뜨리거나 열대 지역의 강수 패턴을 바꾸는 등 전 지구적인 기후 변동을 일으킬 수 있다")])
  ];
  return { content: assembleFull(265, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// -- Day 266 (짝수 -> 문학) --
function buildDay266() {
  const paragraphs = [
    { id: "p1", text: "태민이는 새 학기가 시작되던 날, 전학 온 같은 반 아이 지호를 처음 만났다. 지호는 교실 뒤쪽 구석 자리에 앉아 아무에게도 말을 걸지 않았고, 쉬는 시간에도 혼자 창밖만 바라보고 있었다. 아이들은 처음 며칠간 지호에게 관심을 보였지만, 지호가 말수가 적자 곧 무관심하게 대하기 시작했다. 태민이도 처음에는 지호에게 다가가기가 어색했지만, 지호의 책상 위에 놓인 두꺼운 천문학 책이 눈에 들어오면서 호기심이 생겼다." },
    { id: "p2", text: "어느 날 과학 시간에 선생님이 태양계에 관한 발표를 시켰는데, 지호가 손을 들고 토성의 고리가 얼음 입자와 암석 조각으로 이루어져 있다는 것을 상세히 설명하자 교실이 조용해졌다. 태민이는 수업이 끝나고 지호에게 다가가 어떻게 그렇게 잘 아느냐고 물었다. 지호는 처음으로 수줍게 웃으며, 이전 학교에서 천문 동아리 활동을 했었다고 대답했다. 태민이가 별 관측을 한 번도 해 본 적이 없다고 하자, 지호의 눈이 반짝이며 자기가 알려 주겠다고 했다." },
    { id: "p3", text: "그 주 토요일 밤, 태민이와 지호는 학교 뒷산 언덕에 올라 별을 관측했다. 지호는 가져온 소형 망원경을 세팅하며 겨울철 대삼각형을 이루는 베텔게우스, 시리우스, 프로키온의 위치를 하나하나 짚어 주었다. 태민이는 맨눈으로는 그저 반짝이는 점에 불과했던 별들이 각각 다른 색과 밝기를 가지고 있다는 사실에 놀랐다. 망원경으로 목성을 관측했을 때, 줄무늬와 함께 갈릴레이 위성 네 개가 작은 점으로 보이자 태민이는 감탄을 터뜨렸다." },
    { id: "p4", text: "그날 이후 태민이와 지호는 단짝이 되었다. 매주 토요일마다 함께 별을 보러 다녔고, 교실에서도 나란히 앉아 우주에 관한 이야기를 나누었다. 지호는 점점 다른 친구들에게도 마음을 열기 시작했고, 태민이는 밤하늘을 올려다보는 새로운 취미가 생겼다. 태민이는 지호 덕분에 하늘을 올려다보는 법을 배웠고, 지호는 태민이 덕분에 사람에게 다가가는 법을 배웠다는 것을 둘 다 알고 있었다." }
  ];
  console.log(`Day 266 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '지호의 책상 위에 놓인 두꺼운 천문학 책이 눈에 들어오면서 호기심이 생겼다'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "지호의 책상 위에 놓인 두꺼운 천문학 책이 눈에 들어오면서 호기심이 생겼다")]),
    makeConfirmQ("q2", "지문에서 '토성의 고리가 얼음 입자와 암석 조각으로 이루어져 있다는 것을 상세히 설명하자'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "토성의 고리가 얼음 입자와 암석 조각으로 이루어져 있다는 것을 상세히 설명하자")]),
    makeConfirmQ("q3", "지문에서 '이전 학교에서 천문 동아리 활동을 했었다고 대답했다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "이전 학교에서 천문 동아리 활동을 했었다고 대답했다")]),
    makeConfirmQ("q4", "지문에서 '겨울철 대삼각형을 이루는 베텔게우스, 시리우스, 프로키온의 위치를 하나하나 짚어 주었다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "겨울철 대삼각형을 이루는 베텔게우스, 시리우스, 프로키온의 위치를 하나하나 짚어 주었다")]),
    makeConfirmQ("q5", "지문에서 '맨눈으로는 그저 반짝이는 점에 불과했던 별들이 각각 다른 색과 밝기를 가지고 있다는 사실에 놀랐다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "맨눈으로는 그저 반짝이는 점에 불과했던 별들이 각각 다른 색과 밝기를 가지고 있다는 사실에 놀랐다")]),
    makeConfirmQ("q6", "지문에서 '줄무늬와 함께 갈릴레이 위성 네 개가 작은 점으로 보이자 태민이는 감탄을 터뜨렸다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "줄무늬와 함께 갈릴레이 위성 네 개가 작은 점으로 보이자 태민이는 감탄을 터뜨렸다")]),
    makeConfirmQ("q7", "지문에서 '지호는 태민이 덕분에 사람에게 다가가는 법을 배웠다는 것을 둘 다 알고 있었다'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "지호는 태민이 덕분에 사람에게 다가가는 법을 배웠다는 것을 둘 다 알고 있었다")])
  ];
  return { content: assembleFull(266, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// -- Day 267 (홀수 -> 비문학) --
function buildDay267() {
  const paragraphs = [
    { id: "p1", text: "종이는 인류 문명의 발전에 가장 큰 기여를 한 발명품 중 하나이다. 종이가 발명되기 전에는 점토판, 파피루스, 양피지 등이 기록 매체로 사용되었지만, 무겁고 제작 비용이 비싸 보급에 한계가 있었다. 기원전 105년경 중국 후한의 채륜이 나무껍질, 삼, 헌 천 등을 물에 풀어 얇게 펴서 건조하는 제지 기술을 개량하면서 종이의 대량 생산이 가능해졌다. 이 기술은 비단길을 통해 서역으로 전파되었고, 이슬람 세계를 거쳐 유럽까지 전해졌다." },
    { id: "p2", text: "오늘날 종이의 주원료는 목재 펄프이다. 나무를 잘게 부수고 화학 약품으로 처리하여 셀룰로스 섬유를 분리한 뒤, 이 섬유를 물에 풀어 얇은 막 형태로 만들고 압착하여 건조하면 종이가 완성된다. 종이의 두께, 표면 질감, 강도는 섬유의 종류와 처리 방식에 따라 달라진다. 인쇄용 종이는 표면이 매끈하게 코팅되고, 포장용 종이는 강도를 높이기 위해 골판지 형태로 가공되기도 한다." },
    { id: "p3", text: "종이 산업은 환경 문제와 밀접한 관련이 있다. 전 세계 종이 생산량은 연간 약 4억 톤에 달하며, 이를 위해 매년 광대한 면적의 산림이 벌채되고 있다. 종이 제조 과정에서 대량의 물과 에너지가 소비되고, 표백 과정에서 유해 화학 물질이 배출되기도 한다. 이러한 문제를 줄이기 위해 재생 종이의 사용이 권장되고 있으며, 폐지를 수거하여 다시 펄프로 만드는 재활용 비율도 점차 높아지고 있다." },
    { id: "p4", text: "디지털 시대가 도래하면서 종이의 수요가 줄어들 것이라는 전망이 있었지만, 실제로는 택배 포장재 수요의 급증으로 포장용 종이의 생산량은 오히려 증가하고 있다. 또한 종이는 플라스틱의 대체 소재로 주목받고 있어, 종이 빨대나 종이 용기 같은 친환경 제품의 개발이 활발하다. 종이는 자연에서 분해되는 친환경 소재이자 재활용이 용이한 자원으로서, 지속 가능한 미래 사회에서도 중요한 역할을 계속할 것으로 기대된다." }
  ];
  console.log(`Day 267 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '무겁고 제작 비용이 비싸 보급에 한계가 있었다'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "무겁고 제작 비용이 비싸 보급에 한계가 있었다")]),
    makeConfirmQ("q2", "지문에서 '나무껍질, 삼, 헌 천 등을 물에 풀어 얇게 펴서 건조하는 제지 기술을 개량하면서'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "나무껍질, 삼, 헌 천 등을 물에 풀어 얇게 펴서 건조하는 제지 기술을 개량하면서")]),
    makeConfirmQ("q3", "지문에서 '셀룰로스 섬유를 분리한 뒤, 이 섬유를 물에 풀어 얇은 막 형태로 만들고'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "셀룰로스 섬유를 분리한 뒤, 이 섬유를 물에 풀어 얇은 막 형태로 만들고")]),
    makeConfirmQ("q4", "지문에서 '포장용 종이는 강도를 높이기 위해 골판지 형태로 가공되기도 한다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "포장용 종이는 강도를 높이기 위해 골판지 형태로 가공되기도 한다")]),
    makeConfirmQ("q5", "지문에서 '표백 과정에서 유해 화학 물질이 배출되기도 한다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "표백 과정에서 유해 화학 물질이 배출되기도 한다")]),
    makeConfirmQ("q6", "지문에서 '폐지를 수거하여 다시 펄프로 만드는 재활용 비율도 점차 높아지고 있다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "폐지를 수거하여 다시 펄프로 만드는 재활용 비율도 점차 높아지고 있다")]),
    makeConfirmQ("q7", "지문에서 '종이는 자연에서 분해되는 친환경 소재이자 재활용이 용이한 자원으로서'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "종이는 자연에서 분해되는 친환경 소재이자 재활용이 용이한 자원으로서")])
  ];
  return { content: assembleFull(267, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// -- Day 268 (짝수 -> 문학) --
function buildDay268() {
  const paragraphs = [
    { id: "p1", text: "하은이는 피아노 학원을 그만둔 지 일 년이 넘었지만, 가끔 손가락이 건반 위를 움직이는 꿈을 꾸곤 했다. 학원을 그만둔 이유는 단순했다. 매일 같은 곡을 반복하는 연습이 지루했고, 콩쿠르에서 입상해야 한다는 압박감이 음악을 즐기기보다 고통스럽게 만들었기 때문이다. 부모님은 아쉬워하셨지만 하은이의 결정을 존중해 주셨고, 거실 한쪽에 놓인 피아노에는 먼지가 쌓여 갔다." },
    { id: "p2", text: "어느 비 오는 일요일 오후, 하은이는 할 일 없이 거실을 서성이다가 피아노 덮개를 열었다. 아무 생각 없이 건반을 하나 눌렀는데, 맑은 소리가 조용한 거실에 울려 퍼졌다. 하은이는 무심코 옛날에 좋아했던 곡을 치기 시작했다. 손가락이 기억하고 있었다. 한 음 한 음이 비 오는 창밖 풍경과 어울리며 마치 빗방울이 건반 위에 떨어지는 듯한 느낌이 들었다. 틀리는 부분이 있었지만 신경 쓰이지 않았고, 오히려 그 불완전함이 편안하게 느껴졌다." },
    { id: "p3", text: "그날 이후 하은이는 가끔 피아노 앞에 앉았다. 예전처럼 정해진 교재를 따르지 않았고, 그날의 기분에 따라 치고 싶은 곡을 골라 연주했다. 어떤 날은 밝고 경쾌한 곡을, 어떤 날은 느리고 잔잔한 곡을 쳤다. 누구에게 들려주기 위한 연주가 아니라 오롯이 자신을 위한 시간이었다. 손끝에서 흘러나오는 음악이 하루의 피로를 씻어 주는 것 같았고, 피아노와 다시 친구가 된 기분이 들었다." },
    { id: "p4", text: "몇 달이 지난 어느 저녁, 엄마가 부엌에서 저녁을 준비하다가 하은이의 연주를 듣고 거실로 나왔다. 엄마는 아무 말 없이 소파에 앉아 눈을 감고 음악에 귀를 기울였다. 곡이 끝나자 엄마가 조용히 말했다. 전에는 틀리지 않으려고 긴장하며 치는 느낌이었는데 지금은 음악을 정말 즐기고 있는 것 같다고. 하은이는 살짝 웃으며 고개를 끄덕였다. 피아노를 잠시 떠나 있었던 시간이 오히려 음악의 진짜 의미를 깨닫게 해 주었다는 것을 하은이는 알고 있었다." }
  ];
  console.log(`Day 268 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '콩쿠르에서 입상해야 한다는 압박감이 음악을 즐기기보다 고통스럽게 만들었기 때문이다'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "콩쿠르에서 입상해야 한다는 압박감이 음악을 즐기기보다 고통스럽게 만들었기 때문이다")]),
    makeConfirmQ("q2", "지문에서 '거실 한쪽에 놓인 피아노에는 먼지가 쌓여 갔다'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "거실 한쪽에 놓인 피아노에는 먼지가 쌓여 갔다")]),
    makeConfirmQ("q3", "지문에서 '한 음 한 음이 비 오는 창밖 풍경과 어울리며 마치 빗방울이 건반 위에 떨어지는 듯한 느낌이 들었다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "한 음 한 음이 비 오는 창밖 풍경과 어울리며 마치 빗방울이 건반 위에 떨어지는 듯한 느낌이 들었다")]),
    makeConfirmQ("q4", "지문에서 '오히려 그 불완전함이 편안하게 느껴졌다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "오히려 그 불완전함이 편안하게 느껴졌다")]),
    makeConfirmQ("q5", "지문에서 '누구에게 들려주기 위한 연주가 아니라 오롯이 자신을 위한 시간이었다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "누구에게 들려주기 위한 연주가 아니라 오롯이 자신을 위한 시간이었다")]),
    makeConfirmQ("q6", "지문에서 '손끝에서 흘러나오는 음악이 하루의 피로를 씻어 주는 것 같았고'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "손끝에서 흘러나오는 음악이 하루의 피로를 씻어 주는 것 같았고")]),
    makeConfirmQ("q7", "지문에서 '피아노를 잠시 떠나 있었던 시간이 오히려 음악의 진짜 의미를 깨닫게 해 주었다는 것을'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "피아노를 잠시 떠나 있었던 시간이 오히려 음악의 진짜 의미를 깨닫게 해 주었다는 것을")])
  ];
  return { content: assembleFull(268, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// -- 실행부 --
const results = [
  { dayIndex: 264, ...buildDay264() },
  { dayIndex: 265, ...buildDay265() },
  { dayIndex: 266, ...buildDay266() },
  { dayIndex: 267, ...buildDay267() },
  { dayIndex: 268, ...buildDay268() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

fs.writeFileSync(
  path.join(__dirname, '..', 'generated', 'new', 'batch-f2-264-268.json'),
  JSON.stringify(batchItems, null, 2), 'utf8'
);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
