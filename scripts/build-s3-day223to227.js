const fs = require('fs');
const path = require('path');

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
    contentId: `dr-s3-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(소쉬르 3) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "SAUSSURE_3", schoolGradeRange: { min: 5, max: 5 },
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
  return { content_type: "DAILY_READING", level_id: "SAUSSURE_3", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// ── Day 223 (홀수 → 비문학) ──────────────────────────────────
function buildDay223() {
  const paragraphs = [
    { id: "p1", text: "우리가 매일 먹는 밥은 쌀로 지은 것입니다. 쌀은 벼라는 식물의 열매 속에 들어 있는 하얀 알갱이입니다. 벼는 따뜻한 봄에 논에 모를 심으면 여름 내내 뜨거운 햇빛과 넉넉한 물을 받아들이며 쑥쑥 자랍니다. 벼가 자라는 동안 줄기 끝에 이삭이 나오고 이삭 속에 작은 꽃이 피어 열매를 맺기 시작합니다. 꽃이 진 자리에 낟알이 하나씩 생기며 가을이 되면 낟알 속에 하얀 쌀알이 꽉 차올라 이삭이 무겁게 고개를 숙입니다. 논 전체가 노랗게 물들면 그 모습이 마치 금빛 물결처럼 아름답게 보입니다. 농부는 이삭이 충분히 익으면 낫이나 콤바인이라는 기계로 벼를 베어 거둡니다. 거둔 벼는 도정기를 거쳐 단단한 껍질을 벗기면 비로소 우리가 밥을 지어 먹는 하얀 쌀이 됩니다." },
    { id: "p2", text: "쌀에는 우리 몸에 필요한 여러 가지 영양소가 골고루 들어 있습니다. 가장 많은 것은 탄수화물로 밥을 먹으면 몸속에서 에너지로 바뀌어 힘을 내게 해 줍니다. 또 쌀에는 단백질과 비타민 그리고 식이 섬유도 조금씩 들어 있어 건강에 도움을 줍니다. 그래서 밥을 꼬박꼬박 잘 먹으면 하루 종일 활기차게 생활할 수 있습니다. 우리 조상들은 오래전부터 벼농사를 지으며 쌀을 주식으로 삼아 왔습니다. 떡과 한과 그리고 식혜 등 쌀로 만든 다양한 음식도 함께 발전해 왔습니다. 쌀은 단순한 식량이 아니라 한국 문화와 역사를 담고 있는 소중한 곡식이라고 할 수 있습니다." }
  ];
  const cq = [
    makeConfirmQ("q1", "벼는 어느 계절에 논에 모를 심습니까?", [findRange(paragraphs, "p1", "따뜻한 봄에 논에 모를 심으면")]),
    makeConfirmQ("q2", "벼의 줄기 끝에 나오는 것은 무엇입니까?", [findRange(paragraphs, "p1", "줄기 끝에 이삭이 나오고")]),
    makeConfirmQ("q3", "가을에 낟알 속에 무엇이 꽉 차올라 이삭이 고개를 숙입니까?", [findRange(paragraphs, "p1", "하얀 쌀알이 꽉 차올라")]),
    makeConfirmQ("q4", "거둔 벼의 껍질을 벗기는 기계를 무엇이라 합니까?", [findRange(paragraphs, "p1", "도정기를 거쳐 단단한 껍질을 벗기면")]),
    makeConfirmQ("q5", "쌀에 가장 많이 들어 있는 영양소는 무엇입니까?", [findRange(paragraphs, "p2", "가장 많은 것은 탄수화물로")]),
    makeConfirmQ("q6", "쌀로 만든 다양한 음식에는 어떤 것이 있습니까?", [findRange(paragraphs, "p2", "떡과 한과 그리고 식혜 등")])
  ];
  return { content: assembleFull(223, "NONFICTION", "비문학", paragraphs, cq), subArea: "NONFICTION" };
}

// ── Day 224 (짝수 → 문학) ──────────────────────────────────
function buildDay224() {
  const paragraphs = [
    { id: "p1", text: "토요일 아침 지호는 아빠와 함께 동네 뒷산에 올라갔습니다. 요즘 학교 숙제가 많아서 한동안 산에 가지 못했기 때문에 지호는 무척 신이 났습니다. 산길 입구에서부터 키 큰 나무들이 양쪽으로 서 있었고 나뭇잎 사이로 아침 햇살이 반짝거렸습니다. 지호가 한 발 한 발 오르다 보니 길가에 작은 도토리가 여기저기 굴러다니는 것이 눈에 들어왔습니다. 아빠가 말씀하셨습니다. 이 도토리는 다람쥐가 겨울을 나기 위해 모아 두는 양식이란다. 지호는 도토리를 하나 주워 손바닥에 올려놓고 동글동글한 모양을 가만히 살펴보았습니다." },
    { id: "p2", text: "산 중턱에 오르자 커다란 바위가 하나 있었고 그 위에 앉으면 마을이 한눈에 내려다보였습니다. 지호와 아빠는 바위에 나란히 앉아 가져온 보리차를 마시며 잠시 쉬었습니다. 바람이 살랑살랑 불어 와서 땀이 금방 식었고 기분이 상쾌해졌습니다. 아빠는 지호에게 저 아래 보이는 길이 네가 매일 걸어서 학교에 가는 길이야 하고 알려 주셨습니다. 높은 곳에서 내려다보니 익숙한 길도 새롭게 보여서 지호는 깜짝 놀랐습니다. 지호는 아빠 손을 잡고 다음에도 꼭 다시 오자고 약속했습니다. 산을 내려오는 길에 지호는 콧노래를 흥얼거리며 가벼운 발걸음으로 걸었습니다." },
    { id: "p3", text: "집에 돌아온 지호는 일기장을 꺼내서 오늘의 산행을 글로 적었습니다. 도토리를 주워 본 일과 바위에 앉아 마을을 내려다본 일이 마치 작은 모험 같았습니다. 지호는 마지막 줄에 자연은 언제나 새로운 것을 보여 주는 멋진 선생님이다 하고 써넣었습니다." }
  ];
  const cq = [
    makeConfirmQ("q1", "지호는 누구와 함께 뒷산에 올라갔습니까?", [findRange(paragraphs, "p1", "아빠와 함께 동네 뒷산에 올라갔습니다")]),
    makeConfirmQ("q2", "길가에 굴러다니던 것은 무엇입니까?", [findRange(paragraphs, "p1", "작은 도토리가 여기저기 굴러다니는")]),
    makeConfirmQ("q3", "도토리는 어떤 동물의 겨울 양식입니까?", [findRange(paragraphs, "p1", "다람쥐가 겨울을 나기 위해 모아 두는 양식")]),
    makeConfirmQ("q4", "산 중턱 바위에 앉으면 무엇이 내려다보였습니까?", [findRange(paragraphs, "p2", "마을이 한눈에 내려다보였습니다")]),
    makeConfirmQ("q5", "지호와 아빠가 바위에서 마신 것은 무엇입니까?", [findRange(paragraphs, "p2", "보리차를 마시며")]),
    makeConfirmQ("q6", "지호가 일기장 마지막에 적은 내용은 무엇입니까?", [findRange(paragraphs, "p3", "자연은 언제나 새로운 것을 보여 주는 멋진 선생님이다")])
  ];
  return { content: assembleFull(224, "LITERATURE", "문학", paragraphs, cq), subArea: "LITERATURE" };
}

// ── Day 225 (홀수 → 비문학) ──────────────────────────────────
function buildDay225() {
  const paragraphs = [
    { id: "p1", text: "거미는 곤충이 아니라 거미류에 속하는 동물입니다. 곤충은 다리가 여섯 개이지만 거미는 다리가 여덟 개라는 점에서 서로 다릅니다. 또 곤충은 머리와 가슴과 배 세 부분으로 나뉘지만 거미는 머리와 가슴이 하나로 붙어 있어 두 부분으로만 나뉩니다. 거미의 눈도 독특한데 대부분의 거미는 눈이 여덟 개나 있어서 여러 방향을 한꺼번에 살필 수 있습니다. 거미의 가장 큰 특징은 몸속에 있는 방적 돌기라는 기관에서 가느다란 실을 만들어 거미줄을 칠 수 있다는 것입니다. 거미줄은 매우 가늘지만 같은 굵기의 강철보다 더 질기고 탄력이 있어서 쉽게 끊어지지 않습니다. 거미는 이 놀라운 거미줄을 이용해 먹이를 잡고 알집을 감싸 보호하며 바람을 타고 먼 곳까지 이동하기도 합니다." },
    { id: "p2", text: "거미줄에는 끈끈한 점액이 묻어 있어서 작은 곤충이 줄에 닿으면 들러붙어 빠져나오지 못합니다. 그런데 거미 자신은 왜 자기가 친 줄에 붙지 않는 걸까요. 그것은 거미의 발끝에 기름기가 있어서 점액에 달라붙지 않기 때문입니다. 또 거미는 줄 위를 걸을 때 끈끈하지 않은 줄만 골라서 밟는 방법도 함께 사용합니다. 거미줄은 보기에는 무척 약해 보이지만 과학자들은 거미줄의 뛰어난 구조를 연구하여 튼튼한 실이나 의료용 봉합사를 만드는 데 활용하고 있습니다. 이처럼 작고 보잘것없어 보이는 거미가 만들어 내는 놀라운 실은 자연뿐 아니라 사람에게도 큰 도움을 주고 있습니다." }
  ];
  const cq = [
    makeConfirmQ("q1", "거미는 곤충이 아니라 어떤 동물에 속합니까?", [findRange(paragraphs, "p1", "거미류에 속하는 동물입니다")]),
    makeConfirmQ("q2", "거미의 다리는 몇 개입니까?", [findRange(paragraphs, "p1", "거미는 다리가 여덟 개")]),
    makeConfirmQ("q3", "거미줄은 같은 굵기의 어떤 물질보다 질기다고 했습니까?", [findRange(paragraphs, "p1", "같은 굵기의 강철보다 더 질기고")]),
    makeConfirmQ("q4", "거미줄에 곤충이 붙는 까닭은 무엇입니까?", [findRange(paragraphs, "p2", "끈끈한 점액이 묻어 있어서")]),
    makeConfirmQ("q5", "거미 자신이 줄에 붙지 않는 까닭은 무엇입니까?", [findRange(paragraphs, "p2", "거미의 발끝에 기름기가 있어서 점액에 달라붙지 않기")]),
    makeConfirmQ("q6", "과학자들은 거미줄 구조를 연구하여 무엇을 만드는 데 활용합니까?", [findRange(paragraphs, "p2", "튼튼한 실이나 의료용 봉합사를 만드는 데 활용")])
  ];
  return { content: assembleFull(225, "NONFICTION", "비문학", paragraphs, cq), subArea: "NONFICTION" };
}

// ── Day 226 (짝수 → 문학) ──────────────────────────────────
function buildDay226() {
  const paragraphs = [
    { id: "p1", text: "은서는 전학 온 지 일주일밖에 되지 않아서 교실에서 늘 혼자였습니다. 쉬는 시간에 다른 아이들이 삼삼오오 모여 이야기할 때 은서는 자리에 앉아 창밖만 바라보았습니다. 어느 날 미술 시간에 짝이 없는 은서 옆에 같은 반 수빈이가 다가와 앉았습니다. 수빈이는 해맑게 웃으며 우리 같이 그리자 하고 말했습니다. 은서는 조금 놀랐지만 작은 목소리로 고맙다고 대답했습니다. 두 사람은 나란히 앉아 봄 풍경을 그리기 시작했고 은서는 연둣빛 풀밭을 수빈이는 분홍빛 벚꽃을 그렸습니다." },
    { id: "p2", text: "완성된 그림을 나란히 놓자 풀밭 위에 벚꽃이 흩날리는 아름다운 한 폭의 그림이 되었습니다. 선생님께서 두 사람의 그림을 보시고 서로 잘 어울린다고 칭찬해 주셨습니다. 그날 이후 수빈이는 쉬는 시간마다 은서에게 다가와 같이 놀자고 손을 내밀었습니다. 은서도 점점 마음의 문을 열고 조금씩 웃음을 되찾기 시작했습니다. 한 달이 지나자 은서는 다른 친구들과도 자연스럽게 이야기를 나눌 수 있게 되었습니다. 은서는 수빈이의 작은 한마디가 자신에게 얼마나 큰 용기가 되었는지 마음속으로 늘 고마워하고 있었습니다." },
    { id: "p3", text: "학기 말 은서는 수빈이에게 직접 만든 편지를 건넸습니다. 편지에는 네 덕분에 학교가 즐거워졌어 정말 고마워라는 말이 적혀 있었습니다. 수빈이는 편지를 읽고 눈시울이 살짝 붉어지며 활짝 웃었습니다." }
  ];
  const cq = [
    makeConfirmQ("q1", "은서가 교실에서 혼자였던 까닭은 무엇입니까?", [findRange(paragraphs, "p1", "전학 온 지 일주일밖에 되지 않아서")]),
    makeConfirmQ("q2", "미술 시간에 은서 옆에 다가와 앉은 아이는 누구입니까?", [findRange(paragraphs, "p1", "수빈이가 다가와 앉았습니다")]),
    makeConfirmQ("q3", "은서는 어떤 그림을 그렸습니까?", [findRange(paragraphs, "p1", "은서는 연둣빛 풀밭을")]),
    makeConfirmQ("q4", "선생님은 두 사람의 그림을 보고 뭐라고 하셨습니까?", [findRange(paragraphs, "p2", "서로 잘 어울린다고 칭찬해 주셨습니다")]),
    makeConfirmQ("q5", "한 달이 지나자 은서에게 어떤 변화가 생겼습니까?", [findRange(paragraphs, "p2", "다른 친구들과도 자연스럽게 이야기를 나눌 수 있게")]),
    makeConfirmQ("q6", "학기 말에 은서가 수빈이에게 건넨 것은 무엇입니까?", [findRange(paragraphs, "p3", "직접 만든 편지를 건넸습니다")])
  ];
  return { content: assembleFull(226, "LITERATURE", "문학", paragraphs, cq), subArea: "LITERATURE" };
}

// ── Day 227 (홀수 → 비문학) ──────────────────────────────────
function buildDay227() {
  const paragraphs = [
    { id: "p1", text: "우리가 하늘에서 보는 무지개는 빛과 물방울이 만나서 만들어지는 아름다운 자연 현상입니다. 햇빛은 하얗게 보이지만 사실 빨강 주황 노랑 초록 파랑 남색 보라 일곱 가지 색깔이 섞여 있습니다. 이것을 빛의 스펙트럼이라고 부르며 각 색깔은 파장이 서로 다릅니다. 비가 그친 뒤 하늘에 남아 있는 작은 물방울 속으로 햇빛이 들어가면 빛이 꺾이면서 여러 색깔로 나뉘게 됩니다. 이렇게 나뉜 빛이 물방울 안에서 한 번 더 반사되어 나오면서 우리 눈에 아름다운 무지개로 보이는 것입니다. 무지개를 보려면 해를 등지고 서서 비가 내린 쪽 하늘을 바라보아야 합니다. 그래야 물방울에서 갈라져 나온 색깔 빛이 우리 눈으로 정확히 들어올 수 있기 때문입니다." },
    { id: "p2", text: "무지개는 반원 모양으로 보이지만 사실 완전한 원 모양입니다. 높은 비행기에서 아래쪽을 내려다보면 둥근 원 모양의 무지개를 직접 볼 수 있습니다. 우리가 땅 위에 서 있으면 아래쪽 반은 땅에 가려지기 때문에 반원으로만 보이는 것입니다. 또 무지개 바깥쪽에 더 흐릿한 무지개가 하나 더 나타나는 경우도 있는데 이것을 쌍무지개라고 부릅니다. 쌍무지개에서 바깥쪽 무지개는 색깔 순서가 안쪽 무지개와 반대로 되어 있어 보라색이 바깥에 빨간색이 안쪽에 놓입니다. 무지개는 잠깐 나타났다가 금세 사라지지만 빛과 물이 어우러져 만들어 내는 자연의 아름다운 선물이라고 할 수 있습니다." }
  ];
  const cq = [
    makeConfirmQ("q1", "햇빛 속에는 몇 가지 색깔이 섞여 있습니까?", [findRange(paragraphs, "p1", "일곱 가지 색깔이 섞여 있습니다")]),
    makeConfirmQ("q2", "빛이 물방울 속에 들어가면 어떻게 됩니까?", [findRange(paragraphs, "p1", "빛이 꺾이면서 여러 색깔로 나뉘게")]),
    makeConfirmQ("q3", "무지개를 보려면 어떻게 서야 합니까?", [findRange(paragraphs, "p1", "해를 등지고 서서 비가 내린 쪽 하늘을 바라보아야")]),
    makeConfirmQ("q4", "무지개의 실제 모양은 무엇입니까?", [findRange(paragraphs, "p2", "사실 완전한 원 모양입니다")]),
    makeConfirmQ("q5", "땅 위에서 무지개가 반원으로 보이는 까닭은 무엇입니까?", [findRange(paragraphs, "p2", "아래쪽 반은 땅에 가려지기 때문에")]),
    makeConfirmQ("q6", "쌍무지개에서 바깥쪽 무지개의 색깔 순서는 어떻습니까?", [findRange(paragraphs, "p2", "보라색이 바깥에 빨간색이 안쪽에 놓입니다")]),
    makeConfirmQ("q7", "쌍무지개란 무엇입니까?", [findRange(paragraphs, "p2", "무지개 바깥쪽에 더 흐릿한 무지개가 하나 더 나타나는")])
  ];
  return { content: assembleFull(227, "NONFICTION", "비문학", paragraphs, cq), subArea: "NONFICTION" };
}

// ── 실행 ──────────────────────────────────────────────────
const results = [
  { dayIndex: 223, ...buildDay223() },
  { dayIndex: 224, ...buildDay224() },
  { dayIndex: 225, ...buildDay225() },
  { dayIndex: 226, ...buildDay226() },
  { dayIndex: 227, ...buildDay227() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});
const tempBatchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-s3-223-227.json');
fs.writeFileSync(tempBatchPath, JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ 임시 배치: ${tempBatchPath}`);
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
