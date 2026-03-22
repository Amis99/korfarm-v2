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

// === Day 339 (홀수 → 비문학) ===
function buildDay339() {
  const paragraphs = [
    { id: "p1", text: "우리가 일상에서 사용하는 플라스틱은 대부분 석유에서 추출한 원료로 만들어진다. 석유 속에 포함된 나프타라는 물질을 높은 온도에서 분해하면 에틸렌, 프로필렌 같은 단위체가 생기고, 이 단위체들을 화학 반응으로 길게 이어 붙이면 고분자 물질인 플라스틱이 완성된다. 이러한 과정을 중합이라 부르며, 중합 방식에 따라 폴리에틸렌, 폴리프로필렌, 폴리염화비닐 등 다양한 종류의 플라스틱이 탄생한다. 각 플라스틱은 내열성, 투명도, 유연성 등의 물리적 성질이 서로 달라 용도에 맞게 선택하여 사용하게 된다." },
    { id: "p2", text: "플라스틱이 널리 사용되는 이유는 가볍고 단단하며 가공하기 쉬운 장점이 있기 때문이다. 같은 부피의 금속에 비해 무게가 훨씬 가벼워 운송비를 절감할 수 있고, 원하는 모양으로 쉽게 성형할 수 있어 생산 효율이 높다. 또한 전기가 통하지 않는 절연성과 물에 녹지 않는 내수성을 갖추고 있어 전자제품의 외장재나 식품 포장재로 폭넓게 활용된다. 그러나 바로 이 장점이 환경 문제의 원인이 되기도 한다. 자연에서 잘 분해되지 않는 특성 때문에 한번 버려진 플라스틱은 수백 년 동안 토양과 바다에 남아 생태계를 심각하게 위협하는 것이다." },
    { id: "p3", text: "최근 과학자들은 이 문제를 해결하기 위해 생분해성 플라스틱 연구에 힘을 쏟고 있다. 생분해성 플라스틱은 옥수수 전분이나 사탕수수 같은 식물성 원료에서 추출한 물질로 만들어져 미생물에 의해 자연 분해될 수 있다. 다만 기존 플라스틱보다 생산 비용이 높고 강도와 내열성이 떨어지는 단점이 있어 아직 모든 분야에서 대체하기는 어렵다. 과학자들은 나노 기술을 활용하여 생분해성 플라스틱의 강도를 높이는 연구를 진행 중이며, 머지않아 환경과 성능 두 가지를 모두 충족하는 차세대 소재가 등장하여 플라스틱 오염 문제를 근본적으로 해결할 수 있을 것으로 전망하고 있다." }
  ];
  const cq = [
    makeConfirmQ("q1", "플라스틱의 원료가 되는 물질은 석유 속 무엇인가?", [findRange(paragraphs, "p1", "나프타라는 물질")]),
    makeConfirmQ("q2", "단위체를 길게 이어 붙이는 화학 과정을 무엇이라 하는가?", [findRange(paragraphs, "p1", "이러한 과정을 중합이라 부르며")]),
    makeConfirmQ("q3", "플라스틱이 금속에 비해 유리한 점은?", [findRange(paragraphs, "p2", "같은 부피의 금속에 비해 무게가 훨씬 가벼워 운송비를 절감할 수 있고")]),
    makeConfirmQ("q4", "플라스틱의 장점이 환경 문제의 원인이 되는 이유는?", [findRange(paragraphs, "p2", "자연에서 잘 분해되지 않는 특성 때문에 한번 버려진 플라스틱은 수백 년 동안 토양과 바다에 남아 생태계를 심각하게 위협하는 것이다")]),
    makeConfirmQ("q5", "생분해성 플라스틱의 원료는 무엇인가?", [findRange(paragraphs, "p3", "옥수수 전분이나 사탕수수 같은 식물성 원료")]),
    makeConfirmQ("q6", "생분해성 플라스틱의 단점은?", [findRange(paragraphs, "p3", "기존 플라스틱보다 생산 비용이 높고 강도와 내열성이 떨어지는 단점")])
  ];
  const content = assembleFull(339, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// === Day 340 (짝수 → 문학) ===
function buildDay340() {
  const paragraphs = [
    { id: "p1", text: "소라는 여름방학이면 외할머니 댁에서 한 달 가까이 지냈다. 외할머니 집 마당에는 오래된 감나무가 한 그루 서 있었고, 그 아래에 아버지가 어린 시절 만들었다는 나무 그네가 매달려 있었다. 소라는 아침마다 그네를 타며 감나무 가지 사이로 비치는 햇살을 바라보았다. 바람이 불면 감잎들이 살랑살랑 흔들리며 초록빛 그림자를 땅 위에 드리웠다. 외할머니는 항상 마루에 앉아 부채질을 하시며 소라가 그네 타는 모습을 지켜보셨다. 그 시절 소라에게 여름이란 감나무 그늘과 외할머니의 웃음소리 그 자체였다." },
    { id: "p2", text: "중학교에 올라간 뒤부터 소라는 외할머니 댁에 가는 횟수가 부쩍 줄어들었다. 학원 일정과 시험 준비가 빡빡해지면서 방학이라 해도 마음 편히 쉴 수 없었기 때문이다. 외할머니는 가끔 전화로 소라야 올 수 있겠니 하고 물으셨지만 소라는 이번엔 좀 어려울 것 같아요 하고 대답하곤 했다. 전화를 끊고 나면 늘 마음 한쪽이 허전했지만 다음에 꼭 가겠다는 다짐으로 아쉬움을 달랬다. 그러는 사이 계절은 몇 번이나 바뀌었고, 감나무는 소라 없이도 해마다 묵묵히 감을 맺었다." },
    { id: "p3", text: "고등학교 2학년 가을, 소라는 외할머니가 편찮으시다는 급한 소식을 들었다. 급히 내려간 외할머니 집 마당에서 소라는 그네 줄이 끊어져 땅에 늘어져 있는 것을 발견했다. 감나무에는 주홍빛 감이 가득 달려 있었지만 따줄 사람이 없어 까치들만 쪼아 먹고 있었다. 소라는 할머니 병실로 들어가 손을 꼭 잡았다. 외할머니는 마른 손으로 소라의 볼을 어루만지시며 감이 많이 열렸을 텐데 하고 나직이 말씀하셨다. 소라는 눈물을 참으며 올해 감은 제가 꼭 따드릴게요 하고 대답했다. 병원을 나서며 소라는 끊어진 그네를 꼭 다시 매달고, 감도 직접 따서 외할머니께 가져다 드리겠다고 마음속으로 굳게 약속했다." }
  ];
  const cq = [
    makeConfirmQ("q1", "외할머니 집 마당에 있던 나무는?", [findRange(paragraphs, "p1", "오래된 감나무가 한 그루 서 있었고")]),
    makeConfirmQ("q2", "소라에게 여름이란 무엇이었는가?", [findRange(paragraphs, "p1", "감나무 그늘과 외할머니의 웃음소리 그 자체였다")]),
    makeConfirmQ("q3", "소라가 외할머니 댁에 자주 가지 못하게 된 이유는?", [findRange(paragraphs, "p2", "학원 일정과 시험 준비가 빡빡해지면서 방학이라 해도 마음 편히 쉴 수 없었기 때문이다")]),
    makeConfirmQ("q4", "소라가 전화를 끊고 나면 느끼는 감정은?", [findRange(paragraphs, "p2", "늘 마음 한쪽이 허전했지만")]),
    makeConfirmQ("q5", "소라가 외할머니 집 마당에서 발견한 것은?", [findRange(paragraphs, "p3", "그네 줄이 끊어져 땅에 늘어져 있는 것을 발견했다")]),
    makeConfirmQ("q6", "외할머니가 소라에게 나직이 한 말은?", [findRange(paragraphs, "p3", "감이 많이 열렸을 텐데")]),
    makeConfirmQ("q7", "소라가 병원을 나서며 마음속으로 한 약속은?", [findRange(paragraphs, "p3", "끊어진 그네를 꼭 다시 매달고, 감도 직접 따서 외할머니께 가져다 드리겠다고 마음속으로 굳게 약속했다")])
  ];
  const content = assembleFull(340, "LITERATURE", "문학", paragraphs, cq);
  return { content, subArea: "LITERATURE" };
}

// === Day 341 (홀수 → 비문학) ===
function buildDay341() {
  const paragraphs = [
    { id: "p1", text: "지구의 대기는 질소, 산소, 아르곤 등 여러 기체로 이루어져 있으며, 이 가운데 이산화탄소는 전체의 약 0.04퍼센트에 불과하다. 그러나 이 소량의 이산화탄소가 지구 표면의 평균 기온을 결정하는 데 핵심적인 역할을 한다. 태양에서 오는 빛은 대기를 통과하여 지표면을 데우고, 데워진 지표면은 적외선 형태의 열을 다시 우주로 방출한다. 이때 이산화탄소를 비롯한 온실 기체가 적외선의 일부를 흡수하여 대기 중에 열을 가두는데, 이 현상을 온실 효과라고 부른다. 온실 효과 덕분에 지구의 평균 기온은 생물이 살기에 적합한 약 15도를 유지할 수 있다." },
    { id: "p2", text: "문제는 산업 혁명 이후 화석 연료의 사용이 급증하면서 대기 중 이산화탄소 농도가 빠르게 높아졌다는 점이다. 18세기 중반 약 280피피엠이던 이산화탄소 농도는 현재 420피피엠을 넘어섰다. 농도가 높아지면 대기에 갇히는 열의 양이 늘어나 지구 평균 기온이 상승한다. 이를 지구 온난화라 하며, 빙하가 녹아 해수면이 오르고 폭염과 폭우 같은 극단적 기상 현상이 잦아지는 원인이 된다. 과학자들은 산업화 이전 대비 기온 상승을 1.5도 이내로 억제해야 심각한 생태적 피해를 막을 수 있다고 경고한다." },
    { id: "p3", text: "이러한 위기에 대응하기 위해 세계 각국은 탄소 배출량을 줄이는 정책을 시행하고 있다. 재생 에너지 확대, 전기차 보급, 탄소세 도입 등이 대표적인 방법이다. 또한 이산화탄소를 직접 포집하여 지하에 저장하는 탄소 포집 기술도 활발히 연구되고 있다. 개인 차원에서도 에너지 절약, 대중교통 이용, 일회용품 줄이기 등의 실천이 탄소 배출 감소에 기여한다. 기후 변화는 어느 한 국가나 개인의 노력만으로는 해결할 수 없으며, 전 지구적 협력과 각자의 실천이 함께 이루어질 때 비로소 의미 있는 변화를 이끌어 낼 수 있다." }
  ];
  const cq = [
    makeConfirmQ("q1", "대기 중 이산화탄소의 비율은 어느 정도인가?", [findRange(paragraphs, "p1", "전체의 약 0.04퍼센트에 불과하다")]),
    makeConfirmQ("q2", "온실 효과란 무엇인가?", [findRange(paragraphs, "p1", "이산화탄소를 비롯한 온실 기체가 적외선의 일부를 흡수하여 대기 중에 열을 가두는데, 이 현상을 온실 효과라고 부른다")]),
    makeConfirmQ("q3", "산업 혁명 이전 이산화탄소 농도는 얼마였는가?", [findRange(paragraphs, "p2", "18세기 중반 약 280피피엠이던 이산화탄소 농도")]),
    makeConfirmQ("q4", "지구 온난화로 인해 나타나는 현상들은?", [findRange(paragraphs, "p2", "빙하가 녹아 해수면이 오르고 폭염과 폭우 같은 극단적 기상 현상이 잦아지는")]),
    makeConfirmQ("q5", "기온 상승을 몇 도 이내로 억제해야 하는가?", [findRange(paragraphs, "p2", "산업화 이전 대비 기온 상승을 1.5도 이내로 억제해야")]),
    makeConfirmQ("q6", "탄소 포집 기술이란 무엇인가?", [findRange(paragraphs, "p3", "이산화탄소를 직접 포집하여 지하에 저장하는 탄소 포집 기술")])
  ];
  const content = assembleFull(341, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// === Day 342 (짝수 → 문학) ===
function buildDay342() {
  const paragraphs = [
    { id: "p1", text: "준혁이는 아버지와 함께 일요일마다 동네 뒷산에 올랐다. 산길 입구에 있는 작은 매점에서 삶은 달걀 두 개와 따뜻한 보리차 한 병을 사고, 등산로를 따라 천천히 걸었다. 아버지는 걸으면서 나무 이름을 하나씩 알려 주셨다. 이건 소나무, 저건 참나무, 잎이 넓은 건 단풍나무란다 하고 말씀하실 때마다 준혁이는 고개를 끄덕이며 따라 읽었다. 정상에 오르면 아버지와 나란히 앉아 삶은 달걀을 까먹으며 마을을 내려다보았다. 아버지는 여기서 보면 세상이 참 넓어 보이지 하고 웃으셨고, 준혁이는 그 말에 기분 좋게 끄덕이곤 했다." },
    { id: "p2", text: "아버지가 다른 도시로 발령을 받으신 뒤로 일요일 등산은 멈추었다. 준혁이는 혼자서도 산에 가보려 했지만 매점 앞에 서면 문득 아버지가 달걀을 고르시던 모습이 떠올라 발길이 돌아갔다. 아버지는 한 달에 한 번쯤 전화를 하셨는데 산에 가보았니 하고 꼭 물으셨다. 준혁이는 대답 대신 웃음으로 넘기며 화제를 바꾸곤 했다. 계절이 바뀌어 산에는 노란 단풍이 물들었지만 준혁이의 발걸음은 여전히 산 아래에 머물러 있었다. 아버지 없는 산길이 유독 길고 쓸쓸하게 느껴졌기 때문이다." },
    { id: "p3", text: "이듬해 봄, 아버지가 출장으로 잠시 돌아오신 날이었다. 아버지는 아침 일찍 준혁이를 깨워 오랜만에 산에 가자고 하셨다. 둘은 예전처럼 매점에서 삶은 달걀을 사고 등산로를 올랐다. 겨우내 앙상하던 나뭇가지마다 새잎이 돋아나 연두빛 터널을 이루고 있었다. 준혁이는 소나무, 참나무, 단풍나무를 차례로 가리키며 아버지에게 이름을 불러 드렸다. 아버지는 잠깐 걸음을 멈추고 다 기억하고 있었구나 하고 조용히 말씀하셨다. 정상에 올라 나란히 앉았을 때 준혁이는 여기서 보면 세상이 참 넓어 보인다고 먼저 말했고, 아버지는 아무 말 없이 환하게 웃으시며 아들의 어깨를 감싸 안으셨다." }
  ];
  const cq = [
    makeConfirmQ("q1", "준혁이와 아버지가 산길 입구 매점에서 사는 것은?", [findRange(paragraphs, "p1", "삶은 달걀 두 개와 따뜻한 보리차 한 병을 사고")]),
    makeConfirmQ("q2", "아버지가 정상에서 한 말은?", [findRange(paragraphs, "p1", "여기서 보면 세상이 참 넓어 보이지")]),
    makeConfirmQ("q3", "준혁이가 혼자 산에 가지 못한 이유는?", [findRange(paragraphs, "p2", "매점 앞에 서면 문득 아버지가 달걀을 고르시던 모습이 떠올라 발길이 돌아갔다")]),
    makeConfirmQ("q4", "아버지 없는 산길에서 준혁이가 느낀 감정은?", [findRange(paragraphs, "p2", "아버지 없는 산길이 유독 길고 쓸쓸하게 느껴졌기 때문이다")]),
    makeConfirmQ("q5", "이듬해 봄 산의 모습은 어떠했는가?", [findRange(paragraphs, "p3", "나뭇가지마다 새잎이 돋아나 연두빛 터널을 이루고 있었다")]),
    makeConfirmQ("q6", "아버지가 걸음을 멈추고 한 말은?", [findRange(paragraphs, "p3", "다 기억하고 있었구나")]),
    makeConfirmQ("q7", "정상에서 준혁이가 먼저 한 말은?", [findRange(paragraphs, "p3", "여기서 보면 세상이 참 넓어 보인다고 먼저 말했고")])
  ];
  const content = assembleFull(342, "LITERATURE", "문학", paragraphs, cq);
  return { content, subArea: "LITERATURE" };
}

// === Day 343 (홀수 → 비문학) ===
function buildDay343() {
  const paragraphs = [
    { id: "p1", text: "인간의 귀는 공기의 진동을 감지하여 소리로 인식하는 매우 정교한 감각 기관이다. 외이의 귓바퀴에서 모은 소리 파동은 고막을 진동시키고, 이 진동이 중이의 세 개의 작은 뼈인 추골, 침골, 등골을 거쳐 증폭된다. 증폭된 진동은 내이의 달팽이관으로 전달되며, 달팽이관 내부의 림프액이 흔들리면서 유모 세포를 자극한다. 유모 세포는 진동을 전기 신호로 변환하여 청각 신경을 통해 뇌로 보내고, 뇌의 청각 피질에서 이 신호를 정밀하게 분석하여 우리가 비로소 소리를 인식하게 된다." },
    { id: "p2", text: "소리에는 높낮이와 크기라는 두 가지 중요한 성질이 있다. 소리의 높낮이는 진동수, 즉 주파수로 결정되며 단위는 헤르츠이다. 진동수가 높을수록 높은 소리가 나고 낮을수록 낮은 소리가 난다. 인간의 귀는 보통 20헤르츠에서 2만 헤르츠 사이의 소리를 들을 수 있으며, 이 범위를 가청 주파수라 한다. 소리의 크기는 진폭으로 결정되는데 진폭이 클수록 소리가 크게 들리며 단위는 데시벨이다. 일상 대화는 약 60데시벨 수준이고 120데시벨 이상의 소리에 오래 노출되면 청력 손상이 발생할 수 있다." },
    { id: "p3", text: "현대 사회에서 소음 공해는 심각한 건강 문제로 대두되고 있다. 도로 교통, 공사장, 비행기 소음 등 지속적인 소음에 노출되면 수면 장애, 스트레스 증가, 심혈관 질환 위험 상승 등의 부작용이 나타난다. 세계보건기구는 야간 소음을 40데시벨 이하로 유지할 것을 권고하고 있다. 이에 따라 각국에서는 방음벽 설치, 저소음 포장 도로 건설, 비행 경로 조정 등 다양한 소음 저감 대책을 시행하고 있다. 개인 차원에서도 이어폰 사용 시 음량을 최대치의 60퍼센트 이하로 유지하고 한 시간에 10분씩 반드시 휴식을 취하는 습관이 소중한 청력을 보호하는 데 매우 효과적이다." }
  ];
  const cq = [
    makeConfirmQ("q1", "중이에 있는 세 개의 작은 뼈는 무엇인가?", [findRange(paragraphs, "p1", "추골, 침골, 등골")]),
    makeConfirmQ("q2", "유모 세포의 역할은 무엇인가?", [findRange(paragraphs, "p1", "유모 세포는 진동을 전기 신호로 변환하여 청각 신경을 통해 뇌로 보내고, 뇌의 청각 피질에서 이 신호를 정밀하게 분석하여")]),
    makeConfirmQ("q3", "소리의 높낮이를 결정하는 것은?", [findRange(paragraphs, "p2", "소리의 높낮이는 진동수, 즉 주파수로 결정되며 단위는 헤르츠이다")]),
    makeConfirmQ("q4", "인간의 가청 주파수 범위는?", [findRange(paragraphs, "p2", "20헤르츠에서 2만 헤르츠 사이의 소리를 들을 수 있으며, 이 범위를 가청 주파수라 한다")]),
    makeConfirmQ("q5", "청력 손상이 발생할 수 있는 소리 크기는?", [findRange(paragraphs, "p2", "120데시벨 이상의 소리에 오래 노출되면 청력 손상이 발생할 수 있다")]),
    makeConfirmQ("q6", "세계보건기구의 야간 소음 권고 기준은?", [findRange(paragraphs, "p3", "야간 소음을 40데시벨 이하로 유지할 것을 권고하고 있다")]),
    makeConfirmQ("q7", "개인 차원의 청력 보호 방법은?", [findRange(paragraphs, "p3", "이어폰 사용 시 음량을 최대치의 60퍼센트 이하로 유지하고 한 시간에 10분씩 반드시 휴식을 취하는 습관")])
  ];
  const content = assembleFull(343, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// === 실행부 ===
const results = [
  { dayIndex: 339, ...buildDay339() }, { dayIndex: 340, ...buildDay340() },
  { dayIndex: 341, ...buildDay341() }, { dayIndex: 342, ...buildDay342() },
  { dayIndex: 343, ...buildDay343() }
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
fs.writeFileSync(path.join(newDir, 'batch-f2-339-343.json'), JSON.stringify(batchItems, null, 2), 'utf8');

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
