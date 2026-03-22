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

// === Day 328 (짝수 → 문학) ===
function buildDay328() {
  const paragraphs = [
    { id: "p1", text: "은서는 할머니 댁 뒤편에 있는 오래된 감나무를 어릴 때부터 늘 좋아했다. 가을이면 주황색 감이 주렁주렁 달려서 마치 작은 등불을 나뭇가지마다 매달아 놓은 것처럼 보였다. 하지만 올해는 감이 예전보다 훨씬 적게 열렸고, 가지 끝에 겨우 몇 개만 매달려 있었다. 할머니는 올봄에 비가 너무 많이 와서 꽃이 일찍 떨어졌기 때문이라고 자세히 설명해 주셨다. 은서는 나무 아래에 서서 가지 끝에 매달린 감 몇 개를 한참 동안 올려다보았다. 바람이 불 때마다 감이 천천히 흔들리며 오후 햇빛을 받아 반짝거렸다. 은서는 저 감이 잘 익을 때까지 매일 빠짐없이 지켜보겠다고 마음속으로 조용히 약속했다." },
    { id: "p2", text: "다음 날부터 은서는 아침마다 감나무 곁에 가서 감의 색깔이 어떻게 변하는지 꼼꼼히 살펴보았다. 처음에는 아직 초록빛이 남아 있었는데, 며칠이 지나자 점차 노란색으로 바뀌기 시작했다. 할머니는 감이 빨갛게 물들면 까치가 먼저 날아와 쪼아 먹으러 온다고 알려 주셨다. 은서는 까치에게도 한두 개쯤은 나눠 줘야 한다고 넉넉한 마음으로 생각했다. 어느 선선한 아침 드디어 감이 깊은 주황빛으로 곱게 물들어 있었다. 은서는 조심스럽게 잘 익은 감을 따서 할머니께 두 손으로 공손히 드렸다. 할머니는 환하게 웃으시며 은서와 함께 마루에 앉아 감을 깎아 먹자고 다정하게 말씀하셨다. 은서는 달콤한 감을 한 입 베어 물며 오랫동안 기다린 보람을 온몸으로 느꼈다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '감나무'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "감나무"),
      findRange(paragraphs, "p2", "감나무")
    ]),
    makeConfirmQ("q2", "지문에서 '할머니'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "할머니 댁"),
      findRange(paragraphs, "p1", "할머니는 올봄에"),
      findRange(paragraphs, "p2", "할머니는 감이"),
      findRange(paragraphs, "p2", "할머니께 두"),
      findRange(paragraphs, "p2", "할머니는 환하게")
    ]),
    makeConfirmQ("q3", "지문에서 '은서'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "은서는 할머니"),
      findRange(paragraphs, "p1", "은서는 나무"),
      findRange(paragraphs, "p1", "은서는 저"),
      findRange(paragraphs, "p2", "은서는 아침마다"),
      findRange(paragraphs, "p2", "은서는 까치에게도"),
      findRange(paragraphs, "p2", "은서는 조심스럽게"),
      findRange(paragraphs, "p2", "은서와 함께"),
      findRange(paragraphs, "p2", "은서는 달콤한")
    ]),
    makeConfirmQ("q4", "지문에서 '까치'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "까치가"),
      findRange(paragraphs, "p2", "까치에게도")
    ]),
    makeConfirmQ("q5", "지문에서 '주황'이 들어간 표현을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "주황색"),
      findRange(paragraphs, "p2", "주황빛")
    ]),
    makeConfirmQ("q6", "지문에서 감을 따서 드린 문장을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "은서는 조심스럽게 잘 익은 감을 따서 할머니께 두 손으로 공손히 드렸다.")
    ])
  ];
  return { content: assembleFull(328, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 329 (홀수 → 비문학) ===
function buildDay329() {
  const paragraphs = [
    { id: "p1", text: "지도는 넓은 땅의 모습을 종이 위에 일정한 비율로 줄여서 그린 그림이다. 사람들은 아주 오래전부터 길을 찾거나 새로운 곳으로 여행을 떠날 때 지도를 만들어 사용해 왔다. 옛날 지도는 산과 강의 위치를 대략적으로 그린 것이어서 정확하지 않은 부분이 많았다. 하지만 오늘날에는 인공위성으로 촬영한 사진을 바탕으로 매우 정밀한 지도를 만들 수 있게 되었다. 지도에는 방위표가 있어서 동서남북의 방향을 정확히 알 수 있고, 축척이 표시되어 있어서 지도 위의 거리와 실제 거리를 비교할 수 있다. 또한 지도에는 다양한 기호가 사용되는데, 산은 삼각형 모양으로 나타내고 학교나 관공서는 각각 정해진 문자 기호로 표시한다. 이런 기호를 읽는 방법을 잘 알면 지도에서 필요한 정보를 누구나 빠르게 찾을 수 있다." },
    { id: "p2", text: "요즘에는 종이로 만든 지도 대신 전자 지도를 사용하는 경우가 훨씬 많아졌다. 스마트폰이나 컴퓨터에서 전자 지도를 열면 원하는 장소를 검색어만 입력해서 쉽게 찾을 수 있다. 전자 지도에는 길 안내 기능이 포함되어 있어서 출발지에서 목적지까지 가는 가장 빠른 길을 친절하게 알려 준다. 또한 교통 상황을 실시간으로 보여 주기 때문에 막히는 도로를 미리 피할 수도 있다. 하지만 전자 기기가 없거나 배터리가 모두 닳았을 때에는 종이 지도가 여전히 매우 유용하다. 그래서 지도를 읽는 기본적인 방법을 미리 익혀 두면 어떤 상황에서든 당황하지 않고 길을 찾는 데 큰 도움이 된다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '전자 지도'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "전자 지도를 사용하는"),
      findRange(paragraphs, "p2", "전자 지도를 열면"),
      findRange(paragraphs, "p2", "전자 지도에는")
    ]),
    makeConfirmQ("q2", "지문에서 '축척'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "축척")
    ]),
    makeConfirmQ("q3", "지문에서 '방위표'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "방위표")
    ]),
    makeConfirmQ("q4", "지문에서 '기호'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "기호가 사용되는데"),
      findRange(paragraphs, "p1", "기호로 표시한다"),
      findRange(paragraphs, "p1", "기호를 읽는")
    ]),
    makeConfirmQ("q5", "지문에서 '인공위성'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "인공위성")
    ]),
    makeConfirmQ("q6", "지문에서 '배터리'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "배터리")
    ])
  ];
  return { content: assembleFull(329, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 330 (짝수 → 문학) ===
function buildDay330() {
  const paragraphs = [
    { id: "p1", text: "준혁이는 여름 방학 첫날 아버지와 함께 동해 바닷가로 낚시를 하러 떠났다. 이른 새벽에 출발했기 때문에 차 안에서 꾸벅꾸벅 졸다가 창문 너머로 들려오는 파도 소리에 잠이 깼다. 바닷가에 도착하니 파란 하늘 아래 끝없이 넓은 바다가 눈앞에 시원하게 펼쳐져 있었다. 아버지는 낚시 도구를 하나씩 차분하게 꺼내면서 오늘은 꼭 큰 물고기를 잡아 보자고 힘차게 말씀하셨다. 준혁이는 신이 나서 미끼를 낚싯바늘에 조심스럽게 끼우고 낚싯줄을 바다 쪽으로 멀리 힘껏 던졌다. 그런데 한참을 기다려도 물고기가 전혀 잡히지 않아 점점 지루해지기 시작했다. 아버지는 낚시에서 가장 중요한 것은 끈기와 인내심이라고 조용한 목소리로 차분하게 말씀하셨다." },
    { id: "p2", text: "준혁이는 아버지 말씀대로 참을성 있게 조금 더 기다려 보기로 단단히 마음먹었다. 바다를 바라보며 갈매기가 자유롭게 날아다니는 모습을 한참 동안 구경하고, 파도 소리에 귀를 기울이며 마음을 차분하게 가라앉혔다. 그러던 중 갑자기 낚싯대가 크게 휘어지면서 줄이 팽팽하게 당겨졌다. 준혁이는 두 손으로 낚싯대를 꽉 잡고 온 힘을 다해 끌어올렸다. 물 위로 은빛 비늘이 반짝반짝 빛나는 커다란 물고기 한 마리가 펄떡이며 올라왔다. 아버지는 참 잘했다며 준혁이의 어깨를 힘차게 두드려 주셨다. 준혁이는 기다림의 끝에 반드시 보람이 있다는 소중한 교훈을 이날 처음으로 깨달았다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '준혁'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "준혁이는 여름"),
      findRange(paragraphs, "p1", "준혁이는 신이"),
      findRange(paragraphs, "p2", "준혁이는 아버지"),
      findRange(paragraphs, "p2", "준혁이는 두"),
      findRange(paragraphs, "p2", "준혁이의 어깨를"),
      findRange(paragraphs, "p2", "준혁이는 기다림의")
    ]),
    makeConfirmQ("q2", "지문에서 '아버지'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "아버지와 함께"),
      findRange(paragraphs, "p1", "아버지는 낚시 도구를"),
      findRange(paragraphs, "p1", "아버지는 낚시에서"),
      findRange(paragraphs, "p2", "아버지 말씀대로"),
      findRange(paragraphs, "p2", "아버지는 참")
    ]),
    makeConfirmQ("q3", "지문에서 '낚시'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "낚시를 하러"),
      findRange(paragraphs, "p1", "낚시 도구를"),
      findRange(paragraphs, "p1", "낚시에서 가장")
    ]),
    makeConfirmQ("q4", "지문에서 '물고기'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "물고기를 잡아"),
      findRange(paragraphs, "p1", "물고기가 전혀"),
      findRange(paragraphs, "p2", "물고기 한 마리가")
    ]),
    makeConfirmQ("q5", "지문에서 '인내심'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "인내심")
    ]),
    makeConfirmQ("q6", "지문에서 '갈매기'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "갈매기")
    ]),
    makeConfirmQ("q7", "지문에서 '낚싯대'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "낚싯대가 크게"),
      findRange(paragraphs, "p2", "낚싯대를 꽉")
    ])
  ];
  return { content: assembleFull(330, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 331 (홀수 → 비문학) ===
function buildDay331() {
  const paragraphs = [
    { id: "p1", text: "우리 몸의 뼈는 몸 전체를 단단하게 지탱하고 심장이나 폐 같은 내부 장기를 안전하게 보호하는 매우 중요한 역할을 한다. 어린이의 몸에는 약 270개의 뼈가 있지만, 성장하면서 일부 뼈가 서로 합쳐지기 때문에 어른이 되면 약 206개로 줄어든다. 뼈는 칼슘이라는 성분 덕분에 단단하지만, 동시에 약간의 탄력도 가지고 있어서 외부 충격을 어느 정도 흡수할 수 있다. 뼈의 안쪽에는 골수라고 불리는 부드러운 부분이 있는데, 이곳에서 새로운 적혈구와 백혈구 같은 피가 끊임없이 만들어진다. 뼈가 건강하려면 칼슘이 풍부한 음식을 충분히 먹는 것이 무엇보다 중요하다. 우유나 치즈 같은 유제품과 멸치, 시금치 등에 칼슘이 특히 많이 들어 있으니 골고루 먹는 습관을 들이는 것이 좋다." },
    { id: "p2", text: "뼈를 더욱 튼튼하게 유지하려면 좋은 음식뿐만 아니라 꾸준한 운동도 반드시 필요하다. 걷기나 달리기, 줄넘기처럼 몸에 적당한 자극을 주는 운동을 규칙적으로 하면 뼈가 한층 더 단단해진다. 또한 햇빛을 적당히 쬐면 몸속에서 비타민 디가 자연스럽게 만들어져서 칼슘이 뼈에 잘 흡수되도록 도와준다. 반대로 탄산음료를 너무 많이 마시거나 편식을 심하게 하면 뼈가 약해질 수 있으므로 주의해야 한다. 한창 성장기에 있는 어린이들은 특히 뼈 건강에 각별히 신경을 써야 한다. 지금부터 건강한 생활 습관을 꾸준히 들이면 나이가 들어서도 튼튼한 뼈를 오래도록 유지할 수 있기 때문이다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '뼈'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "뼈는 몸 전체를"),
      findRange(paragraphs, "p1", "뼈가 있지만"),
      findRange(paragraphs, "p1", "뼈가 서로"),
      findRange(paragraphs, "p1", "뼈는 칼슘이라는"),
      findRange(paragraphs, "p1", "뼈의 안쪽에는"),
      findRange(paragraphs, "p1", "뼈가 건강하려면"),
      findRange(paragraphs, "p2", "뼈를 더욱"),
      findRange(paragraphs, "p2", "뼈가 한층"),
      findRange(paragraphs, "p2", "뼈에 잘"),
      findRange(paragraphs, "p2", "뼈가 약해질"),
      findRange(paragraphs, "p2", "뼈 건강에"),
      findRange(paragraphs, "p2", "뼈를 오래도록")
    ]),
    makeConfirmQ("q2", "지문에서 '칼슘'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "칼슘이라는"),
      findRange(paragraphs, "p1", "칼슘이 풍부한"),
      findRange(paragraphs, "p1", "칼슘이 특히"),
      findRange(paragraphs, "p2", "칼슘이 뼈에")
    ]),
    makeConfirmQ("q3", "지문에서 '골수'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "골수")
    ]),
    makeConfirmQ("q4", "지문에서 '비타민 디'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "비타민 디")
    ]),
    makeConfirmQ("q5", "지문에서 '운동'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "운동도 반드시"),
      findRange(paragraphs, "p2", "운동을 규칙적으로")
    ]),
    makeConfirmQ("q6", "지문에서 '탄산음료'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "탄산음료")
    ]),
    makeConfirmQ("q7", "지문에서 '유제품'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "유제품")
    ])
  ];
  return { content: assembleFull(331, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 332 (짝수 → 문학) ===
function buildDay332() {
  const paragraphs = [
    { id: "p1", text: "하윤이는 이번 학기에 다른 도시로 전학을 와서 아직 친구가 한 명도 없었다. 쉬는 시간마다 혼자 창밖을 멍하니 바라보며 이전 학교에서 함께 놀던 친구들이 몹시 그리웠다. 짝꿍인 서아는 매일 조용히 앉아 있는 하윤이를 가만히 지켜보다가 어느 날 쉬는 시간에 종이 한 장을 살짝 건네주었다. 종이에는 반 친구들의 이름과 각자 좋아하는 것이 깔끔하게 정리되어 있었다. 서아는 여기 적힌 걸 보면 친구에게 먼저 말을 걸기 훨씬 쉬울 거라고 작은 목소리로 조용히 말했다. 하윤이는 서아의 다정하고 세심한 마음에 코끝이 찡해지면서 눈시울이 살짝 붉어졌다." },
    { id: "p2", text: "다음 날 하윤이는 용기를 내어 종이에서 축구를 좋아한다고 적혀 있던 민준이에게 먼저 다가갔다. 하윤이가 축구 이야기를 꺼내자 민준이는 눈을 반짝이며 자기 팀에 같이 들어와서 함께 하자고 신나게 말했다. 점심시간에 운동장에서 함께 신나게 공을 차니 처음 만났을 때의 어색함이 금방 눈 녹듯 사라졌다. 교실로 돌아온 하윤이는 서아에게 진심으로 고마운 마음을 전하며 환하게 밝게 웃었다. 서아도 따라 웃으며 앞으로도 궁금하거나 모르는 게 있으면 언제든지 편하게 물어보라고 했다. 하윤이는 새로운 학교에서도 마음을 열면 좋은 친구를 충분히 만들 수 있다는 것을 이날 분명히 깨달았다." },
    { id: "p3", text: "그날 저녁 하윤이는 책상 앞에 앉아 일기장에 오늘 있었던 일을 꼼꼼히 적었다. 마지막 줄에 작은 글씨로 서아야 정말 고마워라고 쓰고 나서 만족스럽게 일기장을 소리 없이 조용히 덮었다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '하윤'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "하윤이는 이번"),
      findRange(paragraphs, "p1", "하윤이를 가만히"),
      findRange(paragraphs, "p1", "하윤이는 서아의"),
      findRange(paragraphs, "p2", "하윤이는 용기를"),
      findRange(paragraphs, "p2", "하윤이가 축구"),
      findRange(paragraphs, "p2", "하윤이는 서아에게"),
      findRange(paragraphs, "p2", "하윤이는 새로운"),
      findRange(paragraphs, "p3", "하윤이는 책상")
    ]),
    makeConfirmQ("q2", "지문에서 '서아'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p1", "서아는 매일"),
      findRange(paragraphs, "p1", "서아는 여기"),
      findRange(paragraphs, "p1", "서아의 다정하고"),
      findRange(paragraphs, "p2", "서아에게 진심으로"),
      findRange(paragraphs, "p2", "서아도 따라"),
      findRange(paragraphs, "p3", "서아야 정말")
    ]),
    makeConfirmQ("q3", "지문에서 '민준'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "민준이에게 먼저"),
      findRange(paragraphs, "p2", "민준이는 눈을")
    ]),
    makeConfirmQ("q4", "지문에서 '축구'를 찾아 눌러 보세요.", [
      findRange(paragraphs, "p2", "축구를 좋아한다고"),
      findRange(paragraphs, "p2", "축구 이야기를")
    ]),
    makeConfirmQ("q5", "지문에서 '일기장'을 찾아 눌러 보세요.", [
      findRange(paragraphs, "p3", "일기장에 오늘"),
      findRange(paragraphs, "p3", "일기장을 소리")
    ])
  ];
  return { content: assembleFull(332, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === 실행부 ===
const results = [
  { dayIndex: 328, ...buildDay328() }, { dayIndex: 329, ...buildDay329() },
  { dayIndex: 330, ...buildDay330() }, { dayIndex: 331, ...buildDay331() },
  { dayIndex: 332, ...buildDay332() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];

results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  \u2705 ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

fs.writeFileSync(path.join(__dirname, '..', 'generated', 'new', 'batch-s3-328-332.json'), JSON.stringify(batchItems, null, 2), 'utf8');

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}\uC790 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
