const fs = require('fs');
const path = require('path');

// === 유틸리티 함수 ===

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
  let stepNum = 0;
  const timeline = [];
  paragraphs.forEach((para) => {
    const sents = findSentences(para.text);
    sents.forEach((sent) => {
      stepNum++;
      timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] } });
    });
    stepNum++;
    timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] } });
  });
  return timeline;
}

function buildRecallCards(paragraphs) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
  }
  return cards;
}

function makeConfirmQ(id, prompt, ranges) {
  return { id, prompt, answerRanges: ranges, scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: "ANY" };
}

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs);
  const cards = buildRecallCards(paragraphs);
  const nn = String(dayIndex).padStart(3, '0');
  return {
    contentId: `dr-f2-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(프레게 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_2", schoolGradeRange: { min: 6, max: 6 },
    area: "READING", subArea, competencies: ["READING"], tags: ["daily"],
    access: { mode: "FREE" }, seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480, assets: {},
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 },
      confirm: { questions: confirmQuestions }
    }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return { content_type: "DAILY_READING", level_id: "FREGE_2", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// === Day 214 — 짝수 → LITERATURE(문학) ===
function buildDay214() {
  const paragraphs = [
    { id: "p1", text: "봄비가 내리는 날이면 소녀는 늘 창가에 앉아 빗소리를 듣곤 했다. 유리창에 부딪히는 빗방울이 작은 강을 이루며 흘러내리는 모습을 바라보면 마음이 편안해졌다. 빗줄기가 굵어질수록 소녀의 마음은 오히려 고요해졌다. 소녀의 어머니는 시골에서 논농사를 짓는 분이었는데, 봄비가 오면 올해 농사가 잘 되겠다며 환하게 웃으시곤 했다. 어머니의 그 웃음이 소녀에게는 봄비보다 더 따뜻한 것이었다." },
    { id: "p2", text: "중학교에 올라간 뒤 소녀는 도시의 이모 집에서 생활하게 되었다. 시골 학교가 폐교되면서 어쩔 수 없이 도시로 나와야 했다. 처음에는 모든 것이 낯설었다. 아파트 복도에 울리는 발자국 소리, 밤에도 꺼지지 않는 거리의 불빛, 그리고 바쁘게 오가는 사람들의 무표정한 얼굴이 소녀를 외롭게 만들었다. 이모는 친절하셨지만 어머니와는 달랐다. 특히 봄비가 내리는 날이면 소녀는 유독 고향의 논밭과 어머니의 웃는 얼굴이 떠올라 가슴 한쪽이 먹먹해졌다." },
    { id: "p3", text: "어느 봄날 오후, 학교 도서관에서 돌아오는 길에 갑자기 비가 쏟아졌다. 우산이 없던 소녀는 빌딩 처마 밑에서 비가 그치기를 기다렸다. 그때 옆집에 사는 할머니가 우산을 하나 건네주며 말했다. 비 맞으면 감기 걸린다, 이거 쓰고 가렴. 할머니의 손은 어머니의 손처럼 거칠었지만 따뜻했다. 소녀는 고맙습니다 하고 고개를 숙이면서 눈시울이 뜨거워지는 것을 느꼈다. 빗속을 걸으며 소녀는 할머니의 손끝에서 전해진 온기를 오래도록 간직했다." },
    { id: "p4", text: "그날 이후 소녀는 봄비가 내릴 때마다 할머니네 집 앞을 지나며 안부를 여쭈었다. 할머니는 소녀에게 따뜻한 보리차를 내어 주기도 하고, 고향 이야기를 들어 주기도 했다. 두 사람은 나이 차이를 넘어 서로를 의지하는 사이가 되었다. 소녀는 도시에서도 봄비가 더 이상 슬프지 않게 되었다. 누군가의 작은 친절이 낯선 곳에서의 외로움을 녹여 줄 수 있다는 것을 소녀는 그 봄에 배웠다." }
  ];
  console.log(`Day 214 글자 수: ${charLen(paragraphs)}`);

  const confirmQuestions = [
    makeConfirmQ("q1", "소녀가 봄비 오는 날 창가에서 하던 행동은 무엇인가요?", [findRange(paragraphs, "p1", "소녀는 늘 창가에 앉아 빗소리를 듣곤 했다")]),
    makeConfirmQ("q2", "소녀의 어머니는 봄비가 오면 어떤 반응을 보이셨나요?", [findRange(paragraphs, "p1", "봄비가 오면 올해 농사가 잘 되겠다며 환하게 웃으시곤 했다")]),
    makeConfirmQ("q3", "소녀가 도시로 나오게 된 이유는 무엇인가요?", [findRange(paragraphs, "p2", "시골 학교가 폐교되면서 어쩔 수 없이 도시로 나와야 했다")]),
    makeConfirmQ("q4", "소녀가 도시에서 외로움을 느낀 이유는 무엇인가요?", [findRange(paragraphs, "p2", "아파트 복도에 울리는 발자국 소리, 밤에도 꺼지지 않는 거리의 불빛, 그리고 바쁘게 오가는 사람들의 무표정한 얼굴이 소녀를 외롭게 만들었다")]),
    makeConfirmQ("q5", "비가 올 때 소녀에게 우산을 건네준 사람은 누구인가요?", [findRange(paragraphs, "p3", "옆집에 사는 할머니가 우산을 하나 건네주며")]),
    makeConfirmQ("q6", "소녀가 할머니의 손에서 느낀 것은 무엇인가요?", [findRange(paragraphs, "p3", "할머니의 손은 어머니의 손처럼 거칠었지만 따뜻했다")]),
    makeConfirmQ("q7", "소녀가 그 봄에 배운 것은 무엇인가요?", [findRange(paragraphs, "p4", "누군가의 작은 친절이 낯선 곳에서의 외로움을 녹여 줄 수 있다는 것을 소녀는 그 봄에 배웠다")])
  ];

  const content = assembleFull(214, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === Day 215 — 홀수 → NONFICTION(비문학) ===
function buildDay215() {
  const paragraphs = [
    { id: "p1", text: "우리가 매일 마시는 물은 지구상에서 끊임없이 순환하고 있다. 이러한 물의 순환을 수문 순환이라고 부른다. 바다나 호수의 물이 태양열에 의해 증발하면 수증기가 되어 하늘로 올라간다. 올라간 수증기는 높은 곳에서 차가운 공기를 만나 작은 물방울로 변하여 구름을 형성한다. 구름 속 물방울이 점점 커지면 무거워져서 비나 눈의 형태로 지표면에 떨어진다. 이 과정은 수십억 년 전부터 지금까지 한 번도 멈추지 않고 계속되어 왔다." },
    { id: "p2", text: "지표면에 떨어진 빗물의 일부는 땅속으로 스며들어 지하수가 되고, 나머지는 시냇물이나 강을 따라 흘러 결국 바다로 돌아간다. 땅속으로 스며든 물도 지하 암반 사이를 천천히 이동하면서 샘이나 우물을 통해 다시 지표로 나오기도 한다. 지하수가 지표로 나오기까지는 짧게는 수 년, 길게는 수천 년이 걸리기도 한다. 이러한 과정이 반복되면서 물은 바다에서 하늘로, 하늘에서 땅으로, 땅에서 다시 바다로 돌아가는 순환을 멈추지 않는다." },
    { id: "p3", text: "물의 순환은 지구의 기후를 조절하는 데에 중요한 역할을 한다. 바다에서 증발하는 물은 열에너지를 가지고 이동하기 때문에 적도 지방의 열을 극지방으로 운반하는 역할을 한다. 또한 비와 눈은 식물이 자라는 데 필요한 수분을 공급하고, 강과 호수는 수많은 생물에게 서식지를 제공한다. 물의 순환이 없다면 지구의 생태계는 유지될 수 없다." },
    { id: "p4", text: "최근 기후 변화로 인해 물의 순환에 변화가 나타나고 있다. 지구 기온이 상승하면서 일부 지역에서는 가뭄이 심해지고, 다른 지역에서는 폭우와 홍수가 빈번해지고 있다. 이는 물의 증발량이 늘어나면서 대기 중 수증기가 증가하기 때문이다. 수증기가 많아지면 한꺼번에 많은 비가 쏟아지는 집중 호우가 잦아진다. 과학자들은 이러한 물 순환의 변화가 인간의 생활과 자연 환경에 심각한 영향을 미칠 수 있다고 경고하고 있다." }
  ];
  console.log(`Day 215 글자 수: ${charLen(paragraphs)}`);

  const confirmQuestions = [
    makeConfirmQ("q1", "물의 순환을 다른 말로 무엇이라고 부르나요?", [findRange(paragraphs, "p1", "이러한 물의 순환을 수문 순환이라고 부른다")]),
    makeConfirmQ("q2", "구름은 어떻게 형성되나요?", [findRange(paragraphs, "p1", "올라간 수증기는 높은 곳에서 차가운 공기를 만나 작은 물방울로 변하여 구름을 형성한다")]),
    makeConfirmQ("q3", "지표면에 떨어진 빗물은 어떤 경로를 통해 바다로 돌아가나요?", [findRange(paragraphs, "p2", "나머지는 시냇물이나 강을 따라 흘러 결국 바다로 돌아간다")]),
    makeConfirmQ("q4", "지하수가 지표로 나오기까지 걸리는 시간은 얼마나 되나요?", [findRange(paragraphs, "p2", "지하수가 지표로 나오기까지는 짧게는 수 년, 길게는 수천 년이 걸리기도 한다")]),
    makeConfirmQ("q5", "물의 순환이 기후 조절에 기여하는 방식은 무엇인가요?", [findRange(paragraphs, "p3", "바다에서 증발하는 물은 열에너지를 가지고 이동하기 때문에 적도 지방의 열을 극지방으로 운반하는 역할을 한다")]),
    makeConfirmQ("q6", "기후 변화가 물의 순환에 미치는 영향은 무엇인가요?", [findRange(paragraphs, "p4", "일부 지역에서는 가뭄이 심해지고, 다른 지역에서는 폭우와 홍수가 빈번해지고 있다")]),
    makeConfirmQ("q7", "집중 호우가 잦아지는 원인은 무엇인가요?", [findRange(paragraphs, "p4", "수증기가 많아지면 한꺼번에 많은 비가 쏟아지는 집중 호우가 잦아진다")])
  ];

  const content = assembleFull(215, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === Day 216 — 짝수 → LITERATURE(문학) ===
function buildDay216() {
  const paragraphs = [
    { id: "p1", text: "여름방학 마지막 날, 준호는 할아버지 댁 뒷산에 올랐다. 키 큰 소나무 사이로 매미 소리가 쉴 새 없이 울려 퍼졌고, 풀 사이에서는 메뚜기가 폴짝폴짝 뛰어다녔다. 할아버지는 지팡이를 짚으며 천천히 앞서 걸으셨다. 준호야, 이 산길을 네 아버지도 어릴 적에 수없이 오르내렸단다. 할아버지의 목소리에는 먼 옛날을 그리워하는 듯한 따뜻한 울림이 담겨 있었다. 준호는 아버지의 어린 시절을 상상하며 할아버지의 뒤를 따랐다." },
    { id: "p2", text: "산 중턱의 너럭바위에 도착하자 할아버지가 잠시 쉬어 가자고 하셨다. 바위에 앉으니 마을 전체가 한눈에 내려다보였다. 논에는 벼가 푸르게 자라고 있었고, 저 멀리 실개천이 햇빛에 반짝이며 흘러가고 있었다. 마을 지붕 위로 피어오르는 밥 짓는 연기가 평화로운 풍경을 더해 주었다. 할아버지는 예전에는 저 논이 전부 우리 집 것이었지만 세월이 흐르면서 조금씩 팔게 되었다고 말씀하셨다. 준호는 할아버지의 표정에서 아쉬움과 담담함이 함께 묻어나는 것을 느꼈다." },
    { id: "p3", text: "산꼭대기에 다다르자 시원한 바람이 불어왔다. 할아버지는 주머니에서 낡은 사진 한 장을 꺼내셨다. 사진 속에는 젊은 시절의 할아버지와 할머니가 바로 이 자리에 서서 환하게 웃고 있었다. 사진의 가장자리는 세월 탓에 누렇게 바래 있었다. 할머니가 돌아가신 뒤로도 할아버지는 해마다 이 산에 오르셨다고 했다. 준호는 사진 속 할머니의 웃는 얼굴을 바라보며 한 번도 만나지 못한 할머니가 갑자기 가깝게 느껴졌다." },
    { id: "p4", text: "하산하는 길에 할아버지가 말씀하셨다. 사람은 떠나도 장소에는 기억이 남는 법이란다. 준호는 그 말의 뜻을 곰곰이 생각했다. 도시로 돌아가는 버스 안에서 창밖을 바라보며 준호는 내년 여름에도 꼭 할아버지와 함께 그 산에 오르겠다고 마음속으로 다짐했다. 차창 너머로 멀어지는 산의 능선이 마치 할아버지의 굽은 등처럼 보였다. 준호는 그 모습을 눈에 꼭 담아 두었다." }
  ];
  console.log(`Day 216 글자 수: ${charLen(paragraphs)}`);

  const confirmQuestions = [
    makeConfirmQ("q1", "준호가 할아버지 댁 뒷산에 오른 시기는 언제인가요?", [findRange(paragraphs, "p1", "여름방학 마지막 날, 준호는 할아버지 댁 뒷산에 올랐다")]),
    makeConfirmQ("q2", "할아버지가 산길에 대해 들려준 이야기는 무엇인가요?", [findRange(paragraphs, "p1", "이 산길을 네 아버지도 어릴 적에 수없이 오르내렸단다")]),
    makeConfirmQ("q3", "너럭바위에서 내려다본 마을의 모습은 어떠했나요?", [findRange(paragraphs, "p2", "논에는 벼가 푸르게 자라고 있었고, 저 멀리 실개천이 햇빛에 반짝이며 흘러가고 있었다")]),
    makeConfirmQ("q4", "할아버지가 논에 대해 말씀하신 내용은 무엇인가요?", [findRange(paragraphs, "p2", "예전에는 저 논이 전부 우리 집 것이었지만 세월이 흐르면서 조금씩 팔게 되었다고 말씀하셨다")]),
    makeConfirmQ("q5", "할아버지가 산꼭대기에서 꺼낸 것은 무엇인가요?", [findRange(paragraphs, "p3", "할아버지는 주머니에서 낡은 사진 한 장을 꺼내셨다")]),
    makeConfirmQ("q6", "할아버지가 해마다 산에 오르신 이유는 무엇인가요?", [findRange(paragraphs, "p3", "할머니가 돌아가신 뒤로도 할아버지는 해마다 이 산에 오르셨다고 했다")]),
    makeConfirmQ("q7", "할아버지가 하산하며 한 말의 의미는 무엇인가요?", [findRange(paragraphs, "p4", "사람은 떠나도 장소에는 기억이 남는 법이란다")])
  ];

  const content = assembleFull(216, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === Day 217 — 홀수 → NONFICTION(비문학) ===
function buildDay217() {
  const paragraphs = [
    { id: "p1", text: "식물은 뿌리를 통해 땅속의 물과 무기 양분을 흡수한다. 뿌리의 표면에는 뿌리털이라는 아주 가는 털 모양의 구조가 있어서 흙 속의 수분과 닿는 면적을 넓혀 준다. 하나의 식물에는 수십억 개의 뿌리털이 존재하여 효율적으로 수분을 흡수할 수 있다. 흡수된 물은 줄기 속의 물관이라는 관 모양의 통로를 따라 위쪽으로 올라간다. 이때 물이 위로 올라갈 수 있는 것은 잎에서 일어나는 증산 작용 덕분이다." },
    { id: "p2", text: "증산 작용이란 잎의 뒷면에 있는 기공이라는 작은 구멍을 통해 물이 수증기 형태로 빠져나가는 현상을 말한다. 잎에서 수증기가 빠져나가면 물관 속의 물이 빈자리를 채우기 위해 올라오고, 이 힘이 뿌리에서부터 물을 끌어올리는 역할을 한다. 이러한 원리는 빨대로 음료를 빨아올리는 것과 비슷하다고 할 수 있다. 키가 100미터에 달하는 큰 나무도 이 증산 작용을 통해 꼭대기까지 물을 공급받는다." },
    { id: "p3", text: "식물이 흡수한 물은 광합성에도 사용된다. 광합성은 잎의 엽록체에서 빛에너지를 이용하여 이산화 탄소와 물을 포도당과 산소로 변환하는 과정이다. 만들어진 포도당은 식물이 생장하고 활동하는 데 필요한 에너지원으로 쓰이며, 부산물로 발생하는 산소는 기공을 통해 대기 중으로 방출된다. 지구 대기의 산소 대부분은 이러한 식물의 광합성에 의해 만들어진 것이다. 특히 열대 우림은 지구 전체 산소 생산의 상당 부분을 담당하고 있다." },
    { id: "p4", text: "식물의 물 흡수와 광합성은 자연 생태계뿐만 아니라 인간 생활에도 깊은 관련이 있다. 농작물이 잘 자라기 위해서는 적절한 양의 물이 공급되어야 하며, 가뭄이 들면 증산 작용이 줄어들어 식물의 생장이 느려진다. 또한 도시의 가로수와 공원의 나무는 증산 작용을 통해 주변 기온을 낮추는 냉각 효과를 제공하여 여름철 도시의 열을 식혀 주는 역할을 한다. 이처럼 식물은 보이지 않는 곳에서 우리 생활에 큰 도움을 주고 있다." }
  ];
  console.log(`Day 217 글자 수: ${charLen(paragraphs)}`);

  const confirmQuestions = [
    makeConfirmQ("q1", "뿌리털의 역할은 무엇인가요?", [findRange(paragraphs, "p1", "뿌리의 표면에는 뿌리털이라는 아주 가는 털 모양의 구조가 있어서 흙 속의 수분과 닿는 면적을 넓혀 준다")]),
    makeConfirmQ("q2", "물이 뿌리에서 위쪽으로 올라갈 수 있는 원리는 무엇인가요?", [findRange(paragraphs, "p1", "물이 위로 올라갈 수 있는 것은 잎에서 일어나는 증산 작용 덕분이다")]),
    makeConfirmQ("q3", "증산 작용이 일어나는 곳은 어디인가요?", [findRange(paragraphs, "p2", "잎의 뒷면에 있는 기공이라는 작은 구멍을 통해 물이 수증기 형태로 빠져나가는 현상")]),
    makeConfirmQ("q4", "광합성에서 만들어지는 물질은 무엇인가요?", [findRange(paragraphs, "p3", "이산화 탄소와 물을 포도당과 산소로 변환하는 과정이다")]),
    makeConfirmQ("q5", "지구 대기의 산소는 주로 어디에서 만들어지나요?", [findRange(paragraphs, "p3", "지구 대기의 산소 대부분은 이러한 식물의 광합성에 의해 만들어진 것이다")]),
    makeConfirmQ("q6", "가뭄이 식물에 미치는 영향은 무엇인가요?", [findRange(paragraphs, "p4", "가뭄이 들면 증산 작용이 줄어들어 식물의 생장이 느려진다")]),
    makeConfirmQ("q7", "도시의 나무가 여름철에 하는 역할은 무엇인가요?", [findRange(paragraphs, "p4", "증산 작용을 통해 주변 기온을 낮추는 냉각 효과를 제공하여 여름철 도시의 열을 식혀 주는 역할을 한다")])
  ];

  const content = assembleFull(217, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === Day 218 — 짝수 → LITERATURE(문학) ===
function buildDay218() {
  const paragraphs = [
    { id: "p1", text: "수지는 전학 첫날 교실 문 앞에서 한참을 망설였다. 아버지의 직장 때문에 이사를 하게 되었고, 학기 중간에 낯선 학교로 옮겨야 했다. 새 학교, 새 교실, 모르는 아이들 틈에서 자기 자리를 찾아야 한다는 것이 두려웠다. 담임 선생님이 문을 열어 주시며 들어오라고 하셨을 때, 삼십여 명의 시선이 일제히 수지를 향했다. 수지는 얼굴이 붉어지는 것을 느끼며 작은 목소리로 인사를 했다." },
    { id: "p2", text: "쉬는 시간에도 수지에게 말을 거는 아이는 없었다. 아이들은 이미 짝을 이루거나 무리를 지어 이야기를 나누고 있었다. 수지는 책상에 엎드려 자는 척하면서 속으로 울고 싶은 마음을 참았다. 점심시간이 되어 급식실로 향할 때, 같은 반 여자아이 하나가 다가왔다. 나 은서야, 같이 밥 먹을래? 별것 아닌 한마디였지만 수지에게는 그 말이 어둠 속에서 켜진 작은 불빛 같았다." },
    { id: "p3", text: "은서는 수지에게 학교 이곳저곳을 알려 주었다. 도서관이 어디 있는지, 매점에서는 뭐가 맛있는지, 체육 시간에 어떤 선생님이 오시는지를 차근차근 설명해 주었다. 은서는 쉬는 시간마다 수지 옆에 와서 말동무가 되어 주기도 했다. 수지는 은서와 이야기를 나누면서 조금씩 긴장이 풀리는 것을 느꼈다. 은서도 작년에 전학을 왔었다는 말에 수지는 깜짝 놀랐다. 그래서 전학생 기분을 누구보다 잘 안다며 은서가 웃었다." },
    { id: "p4", text: "한 달이 지나자 수지는 반 아이들과 자연스럽게 어울릴 수 있게 되었다. 은서 덕분에 처음 며칠의 외로움을 견딜 수 있었고, 그 시간이 지나니 다른 아이들도 하나둘 수지에게 다가왔다. 수지는 이제 학교생활이 즐거워졌고, 은서와는 가장 친한 단짝이 되었다. 수지는 다음에 새 전학생이 오면 자기가 먼저 다가가겠다고 다짐했다. 누군가에게 먼저 손을 내미는 것이 얼마나 큰 용기이자 따뜻한 행동인지를 이제 알게 되었기 때문이다." }
  ];
  console.log(`Day 218 글자 수: ${charLen(paragraphs)}`);

  const confirmQuestions = [
    makeConfirmQ("q1", "수지가 전학을 오게 된 이유는 무엇인가요?", [findRange(paragraphs, "p1", "아버지의 직장 때문에 이사를 하게 되었고, 학기 중간에 낯선 학교로 옮겨야 했다")]),
    makeConfirmQ("q2", "수지가 전학 첫날 교실 앞에서 느낀 감정은 무엇인가요?", [findRange(paragraphs, "p1", "새 학교, 새 교실, 모르는 아이들 틈에서 자기 자리를 찾아야 한다는 것이 두려웠다")]),
    makeConfirmQ("q3", "쉬는 시간에 수지는 어떻게 행동했나요?", [findRange(paragraphs, "p2", "수지는 책상에 엎드려 자는 척하면서 속으로 울고 싶은 마음을 참았다")]),
    makeConfirmQ("q4", "은서가 수지에게 처음 건넨 말은 무엇인가요?", [findRange(paragraphs, "p2", "나 은서야, 같이 밥 먹을래?")]),
    makeConfirmQ("q5", "은서가 수지에게 알려 준 것들은 무엇인가요?", [findRange(paragraphs, "p3", "도서관이 어디 있는지, 매점에서는 뭐가 맛있는지, 체육 시간에 어떤 선생님이 오시는지를 차근차근 설명해 주었다")]),
    makeConfirmQ("q6", "은서가 전학생의 기분을 잘 아는 이유는 무엇인가요?", [findRange(paragraphs, "p3", "은서도 작년에 전학을 왔었다는 말에 수지는 깜짝 놀랐다")]),
    makeConfirmQ("q7", "수지가 다짐한 것은 무엇인가요?", [findRange(paragraphs, "p4", "다음에 새 전학생이 오면 자기가 먼저 다가가겠다고 다짐했다")])
  ];

  const content = assembleFull(218, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === 실행부 ===
const results = [
  { dayIndex: 214, ...buildDay214() },
  { dayIndex: 215, ...buildDay215() },
  { dayIndex: 216, ...buildDay216() },
  { dayIndex: 217, ...buildDay217() },
  { dayIndex: 218, ...buildDay218() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});
const tempBatchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-f2-214-218.json');
fs.writeFileSync(tempBatchPath, JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ 임시 배치: ${tempBatchPath}`);
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
