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

// === Day 324 (짝수 → 문학) ===
function buildDay324() {
  const paragraphs = [
    { id: "p1", text: "할머니의 다락방에는 언제나 먼지 냄새와 오래된 나무 향이 뒤섞여 있었다. 나는 비가 오는 날이면 슬그머니 삐걱거리는 계단을 올라가 그 작고 아늑한 공간에 숨어들곤 했다. 다락방 한쪽 구석에는 빛바랜 가죽 가방이 놓여 있었는데, 할머니는 절대 그것을 열어 보지 말라고 단단히 당부했다. 호기심은 금지된 것일수록 더 커지는 법이어서, 나는 그 가방 속에 무엇이 들어 있을지 끊임없이 상상했다. 어쩌면 먼 나라에서 가져온 진귀한 보물일 수도 있고, 아니면 할머니가 젊었을 때 주고받은 비밀스러운 편지 묶음일 수도 있었다." },
    { id: "p2", text: "어느 장마철 오후, 빗소리가 지붕을 두드리는 가운데 나는 마침내 용기를 내어 가방의 낡은 잠금쇠를 조심스럽게 열었다. 안에는 보물도 편지도 아닌, 수십 장의 흑백 사진이 차곡차곡 들어 있었다. 사진 속에는 젊은 여자가 다양한 풍경 앞에서 환하게 웃고 있었다. 바다가 보이는 높은 절벽 위, 벚꽃이 흐드러진 시골길, 눈 덮인 산골 마을의 작은 역 앞. 사진 뒷면에는 가느다란 글씨로 날짜와 장소가 정성스럽게 적혀 있었다. 그제야 나는 그 젊은 여자가 할머니라는 것을 깨달았다. 할머니에게는 내가 전혀 알지 못하는 긴 시간이 있었고, 그 시간 속에서 할머니는 세상 어디든 자유롭게 걸어 다녔던 것이다." },
    { id: "p3", text: "나는 사진 한 장을 꺼내 오랫동안 들여다보았다. 할머니가 바닷바람에 머리카락을 날리며 활짝 웃고 있는 사진이었다. 문득 아래층에서 할머니가 나를 부르는 소리가 들렸다. 나는 서둘러 사진을 제자리에 넣고 가방을 닫았다. 계단을 내려가자 할머니가 따뜻한 호박죽을 내밀었다. 나는 호박죽을 먹으며 할머니의 주름진 얼굴을 바라보았다. 사진 속의 환한 미소와 지금의 잔잔한 미소가 겹쳐 보였다. 그날 이후로 나는 할머니의 이야기를 더 많이 듣고 싶어졌고, 할머니도 가끔씩 옛이야기를 꺼내 주셨다. 다락방의 가죽 가방은 더 이상 금지된 비밀이 아니라, 할머니와 나를 이어 주는 다리가 되었다." }
  ];
  console.log(`Day 324 글자 수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("q1", "화자가 비 오는 날 찾아가던 장소는 어디인가요?", [findRange(paragraphs, "p1", "할머니의 다락방")]),
    makeConfirmQ("q2", "할머니가 열어 보지 말라고 한 물건은 무엇인가요?", [findRange(paragraphs, "p1", "빛바랜 가죽 가방")]),
    makeConfirmQ("q3", "가방 속에 들어 있던 것은 무엇이었나요?", [findRange(paragraphs, "p2", "수십 장의 흑백 사진")]),
    makeConfirmQ("q4", "사진 뒷면에 적혀 있던 내용은 무엇인가요?", [findRange(paragraphs, "p2", "날짜와 장소")]),
    makeConfirmQ("q5", "화자가 오랫동안 들여다본 사진 속 할머니의 모습은 어떠했나요?", [findRange(paragraphs, "p3", "바닷바람에 머리카락을 날리며 활짝 웃고 있는")]),
    makeConfirmQ("q6", "계단을 내려간 화자에게 할머니가 내민 음식은 무엇인가요?", [findRange(paragraphs, "p3", "따뜻한 호박죽")])
  ];
  const content = assembleFull(324, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === Day 325 (홀수 → 비문학) ===
function buildDay325() {
  const paragraphs = [
    { id: "p1", text: "인간의 뇌는 약 860억 개의 신경 세포, 즉 뉴런으로 구성되어 있다. 각각의 뉴런은 수천 개의 시냅스를 통해 다른 뉴런과 연결되며, 이러한 연결망의 총 수는 수백 조에 달한다. 뇌의 무게는 체중의 약 2퍼센트에 불과하지만, 전체 에너지 소비량의 20퍼센트를 차지할 정도로 활발하게 활동한다. 뇌는 크게 대뇌, 소뇌, 뇌간으로 나뉘며, 각 영역이 서로 다른 고유한 기능을 담당한다. 대뇌 피질은 사고, 판단, 언어와 같은 고차원적 정신 활동을 관장하고, 소뇌는 균형 감각과 정밀한 운동 조절을 맡으며, 뇌간은 호흡과 심장 박동 같은 생명 유지 기능을 제어한다." },
    { id: "p2", text: "뇌의 가장 놀라운 특성 중 하나는 가소성이다. 뇌 가소성이란 경험과 학습에 따라 뇌의 구조와 기능이 변화하는 능력을 뜻한다. 어린 시절의 뇌는 가소성이 특히 높아서, 새로운 언어를 배우거나 악기를 익히는 데 매우 유리하다. 그러나 성인의 뇌도 꾸준한 반복 훈련을 통해 새로운 신경 회로를 형성할 수 있다. 런던 택시 기사들을 대상으로 한 유명한 연구에서는, 복잡한 도시 도로를 오랜 기간 외우고 다닌 기사들의 해마가 일반인보다 크다는 사실이 밝혀졌다. 이는 특정 활동의 반복이 뇌의 물리적 구조를 실제로 변화시킬 수 있음을 보여 주는 대표적인 사례이다." },
    { id: "p3", text: "최근 뇌 과학의 비약적 발전은 인공 지능 기술에도 큰 영향을 미치고 있다. 인공 신경망은 인간 뇌의 뉴런 연결 방식을 모방하여 설계되었으며, 이미지 인식과 자연어 처리 등 다양한 분야에서 눈에 띄는 성과를 거두고 있다. 하지만 현재의 인공 지능은 인간 뇌의 유연성과 창의성을 완전히 재현하지는 못한다. 인간의 뇌는 불완전한 정보로부터 의미를 추론하고, 전혀 다른 영역의 지식을 자유롭게 융합하여 독창적인 아이디어를 만들어 낸다. 뇌 과학의 궁극적 목표는 이러한 뇌의 복잡한 작동 원리를 완전히 이해하는 것이며, 이를 통해 정신 질환의 치료와 교육 방법의 혁신이 가능해질 것으로 기대된다." }
  ];
  console.log(`Day 325 글자 수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("q1", "인간의 뇌를 구성하는 신경 세포의 수는 약 얼마인가요?", [findRange(paragraphs, "p1", "약 860억 개")]),
    makeConfirmQ("q2", "뇌가 전체 에너지 소비량에서 차지하는 비율은 얼마인가요?", [findRange(paragraphs, "p1", "20퍼센트")]),
    makeConfirmQ("q3", "뇌 가소성이란 무엇을 뜻하나요?", [findRange(paragraphs, "p2", "경험과 학습에 따라 뇌의 구조와 기능이 변화하는 능력")]),
    makeConfirmQ("q4", "런던 택시 기사 연구에서 밝혀진 사실은 무엇인가요?", [findRange(paragraphs, "p2", "복잡한 도시 도로를 오랜 기간 외우고 다닌 기사들의 해마가 일반인보다 크다는 사실")]),
    makeConfirmQ("q5", "인공 신경망은 무엇을 모방하여 설계되었나요?", [findRange(paragraphs, "p3", "인간 뇌의 뉴런 연결 방식")]),
    makeConfirmQ("q6", "현재 인공 지능이 재현하지 못하는 인간 뇌의 특성은 무엇인가요?", [findRange(paragraphs, "p3", "유연성과 창의성")])
  ];
  const content = assembleFull(325, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === Day 326 (짝수 → 문학) ===
function buildDay326() {
  const paragraphs = [
    { id: "p1", text: "소년은 매일 학교가 끝나면 마을 뒷산의 참나무 숲으로 향했다. 숲 깊은 곳에는 그가 혼자만 아는 비밀 장소가 있었다. 오래된 참나무 두 그루가 서로 기대어 자라면서 자연스럽게 만들어진 아늑한 작은 공간이었다. 그곳에 앉으면 바람이 나뭇잎 사이를 지나는 소리가 마치 누군가 귓가에 속삭이는 것처럼 부드럽게 들렸다. 소년은 그 소리를 나무의 말이라고 불렀고, 비밀 장소에 앉아 나무의 말을 듣는 것이 하루 중 가장 평화로운 시간이었다. 교실에서의 시끄러운 소음과 시험 걱정이 모두 사라지는 순간이었다." },
    { id: "p2", text: "어느 날, 숲에 도착한 소년은 참나무 아래에 낯선 소녀가 앉아 있는 것을 발견했다. 소녀는 무릎 위에 스케치북을 펼쳐 놓고 무언가를 열심히 그리고 있었다. 소년은 당황하여 발걸음을 멈추었다. 자신만의 소중한 장소에 다른 사람이 있다는 사실이 못마땅하기도 했지만, 그림에 깊이 집중하는 소녀의 모습이 궁금하기도 했다. 소년이 조심스럽게 가까이 다가가자 소녀가 고개를 들었다. 소녀의 스케치북에는 참나무 가지 위에 앉은 작은 새 한 마리가 깃털 하나까지 섬세하게 그려져 있었다. 소년은 자신도 모르게 감탄의 말을 내뱉었다." },
    { id: "p3", text: "그날 이후 소년과 소녀는 같은 시간에 참나무 아래에서 만났다. 소년은 나무의 말을 듣고, 소녀는 숲의 풍경을 그렸다. 처음에는 서로 말없이 각자의 일에 빠져 있었지만, 어느 순간부터 자연스럽게 대화가 시작되었다. 소녀는 자신이 최근에 이 마을로 이사 왔으며, 아직 친구가 없어 혼자 숲을 돌아다닌다고 했다. 소년은 이 참나무 숲이 자신에게 특별한 이유를 조심스럽게 이야기했다. 소녀는 고개를 끄덕이며 말했다. 나도 여기서 나무가 말하는 소리를 들은 것 같아. 그 말을 듣는 순간, 소년은 비밀 장소를 함께 나눌 수 있는 사람을 만났다는 사실에 가슴이 따뜻해졌다." }
  ];
  console.log(`Day 326 글자 수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("q1", "소년이 매일 학교가 끝나면 향하는 곳은 어디인가요?", [findRange(paragraphs, "p1", "마을 뒷산의 참나무 숲")]),
    makeConfirmQ("q2", "소년이 바람 소리를 무엇이라고 불렀나요?", [findRange(paragraphs, "p1", "나무의 말")]),
    makeConfirmQ("q3", "소녀가 참나무 아래에서 하고 있던 일은 무엇인가요?", [findRange(paragraphs, "p2", "스케치북을 펼쳐 놓고 무언가를 열심히 그리고 있었다")]),
    makeConfirmQ("q4", "소녀의 스케치북에 그려진 것은 무엇이었나요?", [findRange(paragraphs, "p2", "참나무 가지 위에 앉은 작은 새 한 마리")]),
    makeConfirmQ("q5", "소녀가 이 마을에 온 이유는 무엇인가요?", [findRange(paragraphs, "p3", "최근에 이 마을로 이사 왔으며")]),
    makeConfirmQ("q6", "소녀가 소년에게 한 말은 무엇인가요?", [findRange(paragraphs, "p3", "나도 여기서 나무가 말하는 소리를 들은 것 같아")]),
    makeConfirmQ("q7", "소년이 마지막에 느낀 감정은 어떠했나요?", [findRange(paragraphs, "p3", "가슴이 따뜻해졌다")])
  ];
  const content = assembleFull(326, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === Day 327 (홀수 → 비문학) ===
function buildDay327() {
  const paragraphs = [
    { id: "p1", text: "지구의 대기는 여러 층으로 나뉘어 있으며, 각 층은 고유한 특성과 역할을 지닌다. 지표면에서 가장 가까운 대류권은 높이 약 10에서 15킬로미터까지 뻗어 있으며, 구름의 형성과 비, 바람 등 기상 현상의 대부분이 이 층에서 발생한다. 대류권 위에는 성층권이 있는데, 이곳에는 자외선을 흡수하는 오존층이 존재한다. 오존층은 태양에서 오는 유해한 자외선을 차단하여 지구상의 생물을 보호하는 중요한 역할을 한다. 만약 오존층이 없다면 강한 자외선이 지표면에 직접 도달하여 피부암 발생률이 급격히 높아지고, 식물의 광합성에도 심각한 장애가 생길 것이다." },
    { id: "p2", text: "20세기 후반, 과학자들은 남극 상공의 오존층이 급격히 얇아지고 있다는 충격적인 사실을 발견했다. 이른바 오존 구멍이라 불리는 이 현상의 주요 원인은 염화불화탄소, 즉 프레온 가스였다. 프레온 가스는 냉장고와 에어컨의 냉매, 스프레이 분사제 등에 널리 사용되던 화학 물질이었다. 이 가스가 대기 중으로 방출되면 성층권까지 천천히 올라가 오존 분자를 분해한다. 하나의 프레온 분자가 수만 개의 오존 분자를 파괴할 수 있어, 극히 소량의 배출로도 오존층에 막대한 피해를 줄 수 있었다." },
    { id: "p3", text: "1987년, 국제 사회는 몬트리올 의정서를 채택하여 프레온 가스를 포함한 오존층 파괴 물질의 생산과 사용을 단계적으로 금지하기로 합의했다. 이 협약은 전 세계 거의 모든 국가가 참여한 가장 성공적인 환경 협약으로 널리 평가받고 있다. 의정서 시행 이후 대기 중 프레온 가스 농도는 서서히 감소하고 있으며, 과학자들은 오존층이 21세기 중반까지 산업화 이전 수준으로 회복될 것으로 전망하고 있다. 몬트리올 의정서의 성공은 환경 문제에 대한 국제적 협력이 실질적인 성과를 거둘 수 있음을 보여 주는 중요한 사례이며, 오늘날 기후 변화 대응에도 귀중한 교훈을 제공하고 있다." }
  ];
  console.log(`Day 327 글자 수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("q1", "대류권의 높이는 약 얼마까지 뻗어 있나요?", [findRange(paragraphs, "p1", "약 10에서 15킬로미터")]),
    makeConfirmQ("q2", "오존층이 존재하는 대기 층은 어디인가요?", [findRange(paragraphs, "p1", "성층권")]),
    makeConfirmQ("q3", "오존 구멍의 주요 원인 물질은 무엇인가요?", [findRange(paragraphs, "p2", "염화불화탄소, 즉 프레온 가스")]),
    makeConfirmQ("q4", "프레온 가스는 주로 어디에 사용되었나요?", [findRange(paragraphs, "p2", "냉장고와 에어컨의 냉매, 스프레이 분사제")]),
    makeConfirmQ("q5", "하나의 프레온 분자가 파괴할 수 있는 오존 분자의 수는 얼마인가요?", [findRange(paragraphs, "p2", "수만 개의 오존 분자")]),
    makeConfirmQ("q6", "몬트리올 의정서가 채택된 연도는 언제인가요?", [findRange(paragraphs, "p3", "1987년")]),
    makeConfirmQ("q7", "과학자들은 오존층이 언제까지 회복될 것으로 전망하나요?", [findRange(paragraphs, "p3", "21세기 중반")])
  ];
  const content = assembleFull(327, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === Day 328 (짝수 → 문학) ===
function buildDay328() {
  const paragraphs = [
    { id: "p1", text: "겨울이 깊어지면 할아버지는 마당 한쪽에 작은 화톳불을 피우곤 하셨다. 불길이 타오르면 주변의 짙은 어둠이 한 발짝씩 물러났고, 차가운 밤공기 속에서 따스한 열기가 얼굴을 감싸 안았다. 나와 동생은 화톳불 앞에 담요를 깔고 나란히 앉아 군고구마가 익기를 기다렸다. 할아버지는 불 속에서 고구마를 나뭇가지로 뒤집으며 느긋하게 옛이야기를 들려주셨다. 이야기의 내용은 매번 조금씩 달랐지만, 언제나 용감한 소년이 등장하여 갖은 어려움을 이겨 내는 이야기였다. 그 이야기를 들으면 나도 용감해질 수 있을 것 같은 기분이 들었다." },
    { id: "p2", text: "그해 겨울은 유난히 추웠다. 눈이 쉬지 않고 내렸고, 마을 어귀의 개울은 꽁꽁 얼어붙었다. 어느 날 저녁, 할아버지가 화톳불 앞에서 평소와 다른 이야기를 꺼내셨다. 옛날에 이 마을에 큰 홍수가 났을 때, 마을 사람들이 힘을 합쳐 둑을 쌓았다는 이야기였다. 할아버지는 당시 열두 살이었고, 어른들 틈에서 무거운 돌을 나르며 밤새 일했다고 하셨다. 비가 그치고 둑이 마침내 완성되었을 때 마을 사람들은 모두 손을 맞잡고 기뻐했다. 할아버지의 목소리에는 그때의 벅찬 감동이 수십 년이 지난 지금까지도 고스란히 남아 있는 듯했다." },
    { id: "p3", text: "군고구마가 다 익자 할아버지가 재 속에서 까맣게 탄 껍질의 고구마를 꺼내 주셨다. 껍질을 벗기니 속은 노란 황금빛이었고, 김이 모락모락 피어올랐다. 한 입 베어 물면 달콤한 맛이 입안 가득 퍼졌다. 나는 고구마를 먹으며 할아버지에게 물었다. 할아버지도 그때 무서웠어요? 할아버지는 빙긋 웃으시며 대답하셨다. 무섭지 않은 사람은 없었단다, 하지만 옆에 함께하는 사람이 있으면 무서움은 반으로 줄어드는 법이야. 화톳불이 점점 작아지고 있었지만, 할아버지의 말씀은 불씨처럼 오래도록 마음속에 남았다. 동생이 잠이 들자 할아버지가 동생을 안아 올리셨고, 나는 조용히 뒤를 따라 집 안으로 들어갔다." }
  ];
  console.log(`Day 328 글자 수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("q1", "할아버지가 겨울에 마당에서 하시던 일은 무엇인가요?", [findRange(paragraphs, "p1", "작은 화톳불을 피우곤 하셨다")]),
    makeConfirmQ("q2", "화톳불 앞에서 화자와 동생이 기다린 것은 무엇인가요?", [findRange(paragraphs, "p1", "군고구마가 익기를")]),
    makeConfirmQ("q3", "할아버지가 평소와 다르게 꺼낸 이야기의 내용은 무엇인가요?", [findRange(paragraphs, "p2", "이 마을에 큰 홍수가 났을 때, 마을 사람들이 힘을 합쳐 둑을 쌓았다는 이야기")]),
    makeConfirmQ("q4", "홍수 당시 할아버지의 나이는 몇 살이었나요?", [findRange(paragraphs, "p2", "열두 살")]),
    makeConfirmQ("q5", "고구마 속의 색깔은 어떠했나요?", [findRange(paragraphs, "p3", "노란 황금빛")]),
    makeConfirmQ("q6", "화자가 할아버지에게 한 질문은 무엇인가요?", [findRange(paragraphs, "p3", "할아버지도 그때 무서웠어요?")]),
    makeConfirmQ("q7", "할아버지가 무서움에 대해 한 말씀은 무엇인가요?", [findRange(paragraphs, "p3", "옆에 함께하는 사람이 있으면 무서움은 반으로 줄어드는 법이야")])
  ];
  const content = assembleFull(328, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === 실행부 ===
const results = [
  { dayIndex: 324, ...buildDay324() }, { dayIndex: 325, ...buildDay325() },
  { dayIndex: 326, ...buildDay326() }, { dayIndex: 327, ...buildDay327() },
  { dayIndex: 328, ...buildDay328() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

const newDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
fs.writeFileSync(path.join(newDir, 'batch-f2-324-328.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ batch-f2-324-328.json`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
