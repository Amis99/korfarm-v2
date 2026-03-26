#!/usr/bin/env node
// 프레게2 Day 289~293 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION(비문학), 짝수 Day = LITERATURE(문학)
// 목표 글자수: 900±50 (850~950자)

const fs = require('fs');
const path = require('path');

// ─── 유틸리티 함수 ───
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

// ─── Day 289: 비문학 (NONFICTION) ─── 주제: 식물의 광합성과 호흡
function buildDay289() {
  const paragraphs = [
    { id: "p1", text: "식물은 빛 에너지를 이용하여 이산화탄소와 물을 포도당으로 전환하는 광합성을 수행한다. 이 과정은 잎의 엽록체에서 일어나며, 엽록소라는 색소가 빛을 흡수하는 데 핵심적인 역할을 한다. 엽록소는 주로 붉은빛과 파란빛을 흡수하고 초록빛을 반사하기 때문에 우리 눈에 식물의 잎이 녹색으로 보이는 것이다. 광합성의 결과물인 포도당은 식물이 성장하고 생명 활동을 유지하는 데 필수적인 에너지원으로 사용된다." },
    { id: "p2", text: "광합성은 크게 명반응과 암반응의 두 단계로 나뉜다. 명반응은 빛이 있을 때 엽록체의 틸라코이드 막에서 진행되며, 물 분자가 분해되어 산소가 방출된다. 이 과정에서 에너지 운반체인 에이티피와 엔에이디피에이치가 생성된다. 암반응은 빛이 직접 필요하지 않으며 엽록체의 스트로마에서 일어나는데, 명반응에서 생성된 에너지를 사용하여 이산화탄소를 포도당으로 고정하는 캘빈 회로가 작동한다." },
    { id: "p3", text: "한편 식물도 동물과 마찬가지로 호흡을 한다. 호흡은 광합성과 반대로 포도당을 분해하여 에너지를 얻는 과정이며, 이때 산소를 소비하고 이산화탄소를 배출한다. 낮에는 광합성량이 호흡량보다 훨씬 많아 식물이 전체적으로 산소를 내놓지만, 밤에는 광합성이 멈추고 호흡만 계속되어 이산화탄소를 방출한다. 즉 식물의 기체 교환은 하루 중 시간대에 따라 달라진다." },
    { id: "p4", text: "광합성과 호흡의 균형은 식물의 생존뿐 아니라 지구 생태계 전체에 영향을 미친다. 전 세계 식물이 흡수하는 이산화탄소의 양은 대기 중 온실가스 농도를 조절하는 데 중요한 역할을 하며, 산림 파괴가 기후 변화를 가속화하는 이유도 여기에 있다. 최근에는 광합성 효율을 높이는 유전자 편집 기술이 연구되고 있어, 식량 생산 증대와 탄소 흡수 능력 강화라는 두 가지 목표를 동시에 달성할 수 있을지 주목되고 있다." }
  ];
  const cq = [
    makeConfirmQ("q1", "엽록소가 주로 흡수하는 빛의 색은?", [findRange(paragraphs, "p1", "붉은빛과 파란빛을 흡수하고")]),
    makeConfirmQ("q2", "광합성의 명반응에서 물 분자가 분해될 때 방출되는 것은?", [findRange(paragraphs, "p2", "물 분자가 분해되어 산소가 방출된다")]),
    makeConfirmQ("q3", "암반응이 일어나는 장소는?", [findRange(paragraphs, "p2", "엽록체의 스트로마에서 일어나는데")]),
    makeConfirmQ("q4", "밤에 식물이 이산화탄소를 방출하는 이유는?", [findRange(paragraphs, "p3", "광합성이 멈추고 호흡만 계속되어 이산화탄소를 방출한다")]),
    makeConfirmQ("q5", "산림 파괴가 기후 변화를 가속화하는 이유는?", [findRange(paragraphs, "p4", "전 세계 식물이 흡수하는 이산화탄소의 양은 대기 중 온실가스 농도를 조절하는 데 중요한 역할을 하며")]),
    makeConfirmQ("q6", "광합성 효율을 높이기 위해 연구되는 기술은?", [findRange(paragraphs, "p4", "광합성 효율을 높이는 유전자 편집 기술이 연구되고 있어")])
  ];
  const content = assembleFull(289, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 290: 문학 (LITERATURE) ─── 주제: 단편 소설 - 할아버지의 시계
function buildDay290() {
  const paragraphs = [
    { id: "p1", text: "다락방 구석에 놓인 낡은 괘종시계는 이미 오래전에 멈춰 있었다. 할아버지가 돌아가신 후로 아무도 태엽을 감아 주지 않았기 때문이다. 시계의 나무 틀에는 세월의 흔적이 깊이 새겨져 있었고, 금빛 추는 빛을 잃은 채 축 늘어져 있었다. 수진이는 방학마다 할머니 댁에 올 때면 그 시계를 물끄러미 바라보곤 했다. 시계 유리판 안쪽에는 아주 작은 글씨로 무언가 적혀 있었는데, 유리에 낀 먼지 때문에 도무지 읽을 수가 없었다." },
    { id: "p2", text: "그해 겨울, 할머니가 편찮으셔서 수진이네 가족은 예정보다 일찍 시골집을 찾았다. 마당에는 첫눈이 소복이 쌓여 있었고, 처마 끝에서 고드름이 길게 늘어져 있었다. 할머니는 침대에 누운 채 수진이의 손을 꼭 잡고 말씀하셨다. 다락방 시계 안에 네 할아버지가 남긴 것이 있단다. 수진이는 곧장 다락방으로 올라가 시계의 유리판을 조심스럽게 열었다. 유리 안쪽에 적힌 글씨는 할아버지의 필체로 쓴 짧은 문장이었다. 시간은 멈추어도 사랑은 멈추지 않는다." },
    { id: "p3", text: "수진이는 시계 뒷면의 작은 서랍을 발견했다. 서랍 안에는 빛바랜 편지 한 통과 오래된 사진 한 장이 들어 있었다. 편지에는 할아버지가 젊은 시절 할머니에게 보낸 사랑의 고백이 담겨 있었고, 사진에는 두 분이 나란히 서서 환하게 웃고 있었다. 사진 뒷면에는 천구백육십이년 봄이라는 날짜가 적혀 있었다. 수진이는 편지를 가슴에 안고 할머니에게로 내려갔다." },
    { id: "p4", text: "할머니는 사진을 보시더니 눈물을 글썽이며 미소를 지으셨다. 수진이는 할머니 옆에 앉아 편지를 소리 내어 읽어 드렸다. 할머니의 방에는 오랜만에 따뜻한 웃음이 퍼졌다. 그날 밤 수진이는 시계의 태엽을 감아 주었고, 오랫동안 침묵하던 괘종시계는 다시 규칙적인 소리를 내기 시작했다. 똑딱, 똑딱. 그 소리는 마치 할아버지가 여전히 이 집을 지키고 있다고 말하는 것 같았다." }
  ];
  const cq = [
    makeConfirmQ("q1", "괘종시계가 멈춰 있던 이유는?", [findRange(paragraphs, "p1", "할아버지가 돌아가신 후로 아무도 태엽을 감아 주지 않았기 때문이다")]),
    makeConfirmQ("q2", "시계 유리판 안쪽에 적힌 글씨를 읽을 수 없었던 이유는?", [findRange(paragraphs, "p1", "유리에 낀 먼지 때문에 도무지 읽을 수가 없었다")]),
    makeConfirmQ("q3", "할아버지가 유리판에 남긴 문장은?", [findRange(paragraphs, "p2", "시간은 멈추어도 사랑은 멈추지 않는다")]),
    makeConfirmQ("q4", "시계 뒷면 서랍에서 발견된 것은?", [findRange(paragraphs, "p3", "빛바랜 편지 한 통과 오래된 사진 한 장이 들어 있었다")]),
    makeConfirmQ("q5", "수진이가 편지를 읽어 드린 후 할머니의 반응은?", [findRange(paragraphs, "p4", "할머니의 방에는 오랜만에 따뜻한 웃음이 퍼졌다")]),
    makeConfirmQ("q6", "수진이가 시계 태엽을 감은 후 일어난 일은?", [findRange(paragraphs, "p4", "오랫동안 침묵하던 괘종시계는 다시 규칙적인 소리를 내기 시작했다")])
  ];
  const content = assembleFull(290, "LITERATURE", "문학", paragraphs, cq);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 291: 비문학 (NONFICTION) ─── 주제: 인공위성의 원리와 활용
function buildDay291() {
  const paragraphs = [
    { id: "p1", text: "인공위성은 지구의 중력과 위성 자체의 관성이 균형을 이루어 지구 주위를 계속 돌 수 있는 인공 천체이다. 뉴턴은 충분히 빠른 속도로 수평 방향으로 물체를 던지면, 물체가 떨어지는 곡선이 지구의 곡면과 일치하여 영원히 지구를 돌게 될 것이라고 설명했다. 이 원리에 따라 인공위성은 초속 약 칠 점 구 킬로미터의 속도로 지구 주위를 공전하며, 이를 제일 우주 속도라 한다." },
    { id: "p2", text: "인공위성은 궤도 높이에 따라 크게 세 가지로 분류된다. 저궤도 위성은 지표면에서 약 이백 킬로미터에서 이천 킬로미터 사이에 위치하며, 정밀한 지구 관측과 군사 정찰에 활용된다. 중궤도 위성은 이만 킬로미터 부근에서 운용되며 위성 항법 시스템의 핵심을 이룬다. 정지 궤도 위성은 약 삼만 오천 육백 킬로미터 높이에서 지구의 자전 속도와 동일한 속도로 공전하여 지상에서 볼 때 하늘의 한 점에 고정된 것처럼 보이며, 통신과 기상 관측에 주로 쓰인다." },
    { id: "p3", text: "인공위성의 활용 분야는 매우 다양하다. 기상 위성은 구름의 움직임과 대기 상태를 실시간으로 관측하여 일기 예보의 정확도를 높이는 데 기여한다. 통신 위성은 전파를 중계하여 먼 거리의 방송, 인터넷 서비스, 국제 전화를 가능하게 한다. 최근에는 수천 기의 소형 위성을 저궤도에 배치하여 전 세계 어디서나 고속 인터넷에 접속할 수 있게 하는 위성 인터넷 사업이 활발히 추진되고 있다." },
    { id: "p4", text: "그러나 인공위성의 수가 급증하면서 우주 쓰레기 문제가 심각해지고 있다. 현재 지구 궤도에는 수만 개의 파편이 떠돌고 있는 것으로 추정된다. 수명이 다한 위성이나 발사체의 잔해가 궤도에 남아 다른 위성과 충돌할 위험을 높이기 때문이다. 이를 해결하기 위해 우주 쓰레기를 포획하여 대기권으로 끌어들이는 기술이 개발되고 있으며, 국제적인 우주 교통 관리 체계의 필요성도 제기되고 있다." }
  ];
  const cq = [
    makeConfirmQ("q1", "인공위성이 지구 주위를 계속 도는 원리는?", [findRange(paragraphs, "p1", "지구의 중력과 위성 자체의 관성이 균형을 이루어")]),
    makeConfirmQ("q2", "인공위성의 공전 속도는?", [findRange(paragraphs, "p1", "초속 약 칠 점 구 킬로미터의 속도로 지구 주위를 공전하며")]),
    makeConfirmQ("q3", "정지 궤도 위성이 하늘에 고정된 것처럼 보이는 이유는?", [findRange(paragraphs, "p2", "지구의 자전 속도와 동일한 속도로 공전하여 지상에서 볼 때 하늘의 한 점에 고정된 것처럼 보이며")]),
    makeConfirmQ("q4", "기상 위성의 역할은?", [findRange(paragraphs, "p3", "구름의 움직임과 대기 상태를 실시간으로 관측하여 일기 예보의 정확도를 높이는 데 기여한다")]),
    makeConfirmQ("q5", "위성 인터넷 사업의 방식은?", [findRange(paragraphs, "p3", "수천 기의 소형 위성을 저궤도에 배치하여 전 세계 어디서나 고속 인터넷에 접속할 수 있게 하는")]),
    makeConfirmQ("q6", "우주 쓰레기 문제의 원인은?", [findRange(paragraphs, "p4", "수명이 다한 위성이나 발사체의 잔해가 궤도에 남아 다른 위성과 충돌할 위험을 높이기 때문이다")]),
    makeConfirmQ("q7", "우주 쓰레기를 해결하기 위한 기술은?", [findRange(paragraphs, "p4", "우주 쓰레기를 포획하여 대기권으로 끌어들이는 기술이 개발되고 있으며")])
  ];
  const content = assembleFull(291, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 292: 문학 (LITERATURE) ─── 주제: 시(詩) - 빗소리를 듣다
function buildDay292() {
  const paragraphs = [
    { id: "p1", text: "여름의 끝자락, 장마가 다시 찾아왔다. 진호는 방과 후 빈 교실에 혼자 남아 창밖을 바라보고 있었다. 유리창을 두드리는 빗소리가 규칙적으로 이어졌고, 운동장에는 빗물이 고여 작은 호수처럼 반짝이고 있었다. 교실 천장의 형광등이 희미하게 깜빡이며 빗소리와 어울려 묘한 리듬을 만들어 냈다. 진호는 가방에서 낡은 공책을 꺼냈다. 어머니가 학창 시절에 쓰셨다는 시 노트였다. 표지에는 어머니의 이름이 또박또박 적혀 있었다." },
    { id: "p2", text: "공책의 첫 페이지에는 비에 대한 짧은 시가 적혀 있었다. 빗방울은 하늘이 흘리는 눈물이 아니라, 대지에 보내는 편지라고 어머니는 썼다. 흙 냄새 속에 봄의 약속이 숨어 있고, 물웅덩이마다 세상을 비추는 거울이 된다는 구절도 있었다. 진호는 그 시를 소리 내어 읽다가 자신도 모르게 미소를 지었다. 어머니가 자기와 같은 나이에 이런 생각을 했다니 신기하기도 하고 가깝게 느껴지기도 했다." },
    { id: "p3", text: "진호는 공책의 빈 페이지를 펼치고 연필을 잡았다. 처음에는 무엇을 써야 할지 몰라 창밖만 바라보았다. 그러다 문득 빗물이 유리창을 타고 내려가며 만들어 내는 구불구불한 선이 글씨처럼 보였다. 진호는 천천히 자신만의 문장을 써 내려갔다. 비가 내리면 세상은 잠시 멈추고, 나는 그 고요 속에서 내가 누구인지 생각한다. 연필이 종이 위를 긁는 소리가 빗소리에 섞여 교실을 채웠다." },
    { id: "p4", text: "비가 그친 뒤 진호는 공책을 가방에 넣고 교실을 나섰다. 축축한 공기 속에서 풀 냄새가 올라왔고 하늘 한쪽에 무지개가 옅게 걸려 있었다. 진호는 걸으면서 생각했다. 어머니와 같은 교실에서 같은 비를 맞은 것은 아니지만, 같은 감정을 나눈 것 같다고. 오래된 공책은 시간을 뛰어넘는 다리가 되어 주었고, 진호는 오늘 처음으로 시를 쓰는 일이 좋다고 느꼈다. 집으로 돌아가는 길에 진호는 다음에 비가 오면 또 무엇을 쓸 수 있을지 벌써 기대가 되었다." }
  ];
  const cq = [
    makeConfirmQ("q1", "진호가 빈 교실에 혼자 남아 한 일은?", [findRange(paragraphs, "p1", "창밖을 바라보고 있었다")]),
    makeConfirmQ("q2", "진호가 꺼낸 공책은 누구의 것이었나?", [findRange(paragraphs, "p1", "어머니가 학창 시절에 쓰셨다는 시 노트였다")]),
    makeConfirmQ("q3", "어머니의 시에서 빗방울을 무엇에 비유했나?", [findRange(paragraphs, "p2", "빗방울은 하늘이 흘리는 눈물이 아니라, 대지에 보내는 편지라고")]),
    makeConfirmQ("q4", "진호가 쓴 문장의 내용은?", [findRange(paragraphs, "p3", "비가 내리면 세상은 잠시 멈추고, 나는 그 고요 속에서 내가 누구인지 생각한다")]),
    makeConfirmQ("q5", "비가 그친 뒤 하늘에 걸려 있던 것은?", [findRange(paragraphs, "p4", "하늘 한쪽에 무지개가 옅게 걸려 있었다")]),
    makeConfirmQ("q6", "오래된 공책이 진호에게 어떤 역할을 했나?", [findRange(paragraphs, "p4", "오래된 공책은 시간을 뛰어넘는 다리가 되어 주었고")])
  ];
  const content = assembleFull(292, "LITERATURE", "문학", paragraphs, cq);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 293: 비문학 (NONFICTION) ─── 주제: 미생물의 세계와 인간 생활
function buildDay293() {
  const paragraphs = [
    { id: "p1", text: "미생물은 맨눈으로 볼 수 없을 만큼 작은 생물을 통틀어 이르는 말로, 세균, 바이러스, 곰팡이, 효모 등이 이에 해당한다. 미생물은 지구상 거의 모든 환경에 존재하며, 심해의 열수구, 극지방의 얼음 속, 사람의 피부 위에서도 발견된다. 과학자들은 지구에 존재하는 미생물의 총 질량이 모든 식물의 질량에 버금갈 정도로 막대하다고 추정하며, 지구 생태계의 물질 순환에서 미생물은 없어서는 안 될 존재이다." },
    { id: "p2", text: "인간의 몸에는 약 삼십조 개의 세포가 있는데, 몸속에 사는 미생물의 수도 이와 비슷한 규모로 추정된다. 장내 미생물은 음식물의 소화를 돕고, 비타민을 합성하며, 면역 체계의 발달에 중요한 역할을 한다. 최근 연구에 따르면 장내 미생물 군집의 구성이 비만, 당뇨, 심지어 우울증과 같은 정신 건강에도 영향을 미칠 수 있다는 사실이 밝혀지고 있다. 이 때문에 장내 미생물을 제이의 장기라고 부르는 학자도 있다." },
    { id: "p3", text: "미생물은 산업 분야에서도 널리 활용된다. 효모는 빵을 부풀리고 맥주와 와인을 발효시키는 데 사용되며, 유산균은 요구르트와 김치 같은 발효 식품의 핵심이다. 세균을 이용하여 인슐린 같은 의약품을 대량 생산하는 생명공학 기술도 이미 수십 년 전부터 상용화되었다. 또한 플라스틱 분해 능력을 가진 미생물의 발견은 환경 오염 해결에 새로운 가능성을 열어 주고 있다." },
    { id: "p4", text: "물론 미생물 중에는 인간에게 해로운 것도 있다. 결핵균, 콜레라균 등의 병원성 세균은 인류 역사에서 수많은 생명을 앗아 갔고, 바이러스 역시 독감, 에이즈 등의 감염병을 일으킨다. 이에 대응하여 인류는 항생제와 백신을 개발하여 감염병의 위협을 크게 줄였지만, 항생제 내성균의 출현이라는 새로운 난제에 직면해 있다. 미생물과의 공존은 인류가 영원히 풀어 가야 할 과제이다." }
  ];
  const cq = [
    makeConfirmQ("q1", "미생물에 해당하는 것은?", [findRange(paragraphs, "p1", "세균, 바이러스, 곰팡이, 효모 등이 이에 해당한다")]),
    makeConfirmQ("q2", "미생물이 발견되는 극한 환경의 예는?", [findRange(paragraphs, "p1", "심해의 열수구, 극지방의 얼음 속, 사람의 피부 위에서도 발견된다")]),
    makeConfirmQ("q3", "장내 미생물의 역할은?", [findRange(paragraphs, "p2", "음식물의 소화를 돕고, 비타민을 합성하며, 면역 체계의 발달에 중요한 역할을 한다")]),
    makeConfirmQ("q4", "장내 미생물이 영향을 미칠 수 있는 정신 건강 문제는?", [findRange(paragraphs, "p2", "비만, 당뇨, 심지어 우울증과 같은 정신 건강에도 영향을 미칠 수 있다")]),
    makeConfirmQ("q5", "환경 오염 해결에 새로운 가능성을 열어 준 미생물은?", [findRange(paragraphs, "p3", "플라스틱 분해 능력을 가진 미생물의 발견은 환경 오염 해결에 새로운 가능성을 열어 주고 있다")]),
    makeConfirmQ("q6", "항생제 개발 이후 인류가 직면한 새로운 문제는?", [findRange(paragraphs, "p4", "항생제 내성균의 출현이라는 새로운 난제에 직면해 있다")])
  ];
  const content = assembleFull(293, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// ─── 실행부 ───
const results = [
  { dayIndex: 289, ...buildDay289() }, { dayIndex: 290, ...buildDay290() },
  { dayIndex: 291, ...buildDay291() }, { dayIndex: 292, ...buildDay292() },
  { dayIndex: 293, ...buildDay293() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];

results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

fs.writeFileSync(path.join(__dirname, '..', 'generated', 'new', 'batch-f2-289-293.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log('  ✅ generated/new/batch-f2-289-293.json');

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
