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

function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

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
    const s = i * chunkSize;
    const e = Math.min(s + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(s, e) });
  }
  return cards;
}

function makeConfirmQ(id, prompt, ranges) {
  return {
    id, prompt,
    answerRanges: ranges,
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true,
    answerMatchMode: "ANY"
  };
}

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs);
  const cards = buildRecallCards(paragraphs);
  const nn = String(dayIndex).padStart(3, '0');
  return {
    contentId: `dr-f2-${nn}`,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(프레게 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_2",
    schoolGradeRange: { min: 6, max: 6 },
    area: "READING",
    subArea,
    competencies: ["READING"],
    tags: ["daily"],
    access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480,
    assets: {},
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 },
      confirm: { questions: confirmQuestions }
    }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return {
    content_type: "DAILY_READING",
    level_id: "FREGE_2",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content
  };
}

// === Day 249 (홀수 → 비문학) - 인공지능과 윤리 ===
function buildDay249() {
  const paragraphs = [
    { id: "p1", text: "인공지능 기술이 빠르게 발전하면서 우리 사회 곳곳에서 인공지능이 다양한 방식으로 활용되고 있다. 의료 분야에서는 인공지능이 환자의 증상과 검사 결과를 종합적으로 분석하여 질병을 조기에 진단하고, 법률 분야에서는 수십만 건에 달하는 방대한 판례를 빠르게 검토하여 변호사의 업무를 효율적으로 보조한다. 자율주행 자동차는 도로 위의 복잡한 상황을 실시간으로 판단하며 운전자의 개입 없이 스스로 안전하게 운행할 수 있다. 이처럼 인공지능은 인간의 편의를 크게 향상시키고 있지만, 동시에 심각한 윤리적인 문제를 제기하고 있어 이에 대한 사회 전체의 깊은 성찰이 요구된다." },
    { id: "p2", text: "인공지능이 제기하는 윤리적 문제 중 가장 대표적인 것은 편향성의 문제이다. 인공지능은 방대한 학습 데이터를 기반으로 판단을 내리기 때문에 데이터 자체에 편견이 포함되어 있으면 그 결과에도 편향이 고스란히 반영된다. 예를 들어, 채용 과정에서 활용되는 인공지능이 과거의 성별이나 인종에 따른 차별적 데이터를 학습했다면 특정 집단에 불리한 결과를 산출할 수 있다. 이러한 편향은 사회적 불평등을 더욱 심화시킬 위험이 있으므로 학습 데이터의 공정성을 확보하는 것이 매우 중요하다." },
    { id: "p3", text: "또 다른 핵심 쟁점은 인공지능의 판단에 대한 책임 소재의 문제이다. 자율주행 자동차가 교통사고를 냈을 때 그 법적 책임이 차량 제조사에 있는지, 소프트웨어 개발자에 있는지, 아니면 탑승자 본인에게 있는지를 명확히 판단하기가 매우 어렵다. 인공지능의 결정 과정이 지나치게 복잡하여 왜 그런 판단을 내렸는지 설명하기 힘든 경우도 많은데 이를 블랙박스 문제라고 부르기도 한다. 인공지능 기술의 건전한 발전을 위해서는 기술적 진보와 함께 윤리적 기준과 법적 제도의 정비가 반드시 병행되어야 할 것이다." }
  ];
  const len = charLen(paragraphs);
  console.log(`  Day 249 지문 길이: ${len}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '환자의 증상과 검사 결과를 종합적으로 분석하여'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "환자의 증상과 검사 결과를 종합적으로 분석하여")]),
    makeConfirmQ("q2", "지문에서 '인간의 편의를 크게 향상시키고 있지만'을 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "인간의 편의를 크게 향상시키고 있지만")]),
    makeConfirmQ("q3", "지문에서 '데이터 자체에 편견이 포함되어 있으면'을 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "데이터 자체에 편견이 포함되어 있으면")]),
    makeConfirmQ("q4", "지문에서 '특정 집단에 불리한 결과를 산출할 수 있다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "특정 집단에 불리한 결과를 산출할 수 있다")]),
    makeConfirmQ("q5", "지문에서 '학습 데이터의 공정성을 확보하는 것이 매우 중요하다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "학습 데이터의 공정성을 확보하는 것이 매우 중요하다")]),
    makeConfirmQ("q6", "지문에서 '인공지능의 판단에 대한 책임 소재의 문제'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "인공지능의 판단에 대한 책임 소재의 문제")]),
    makeConfirmQ("q7", "지문에서 '이를 블랙박스 문제라고 부르기도 한다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "이를 블랙박스 문제라고 부르기도 한다")])
  ];

  const content = assembleFull(249, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === Day 250 (짝수 → 문학) - 소나기가 지나간 뒤 ===
function buildDay250() {
  const paragraphs = [
    { id: "p1", text: "민호는 학교가 끝나자마자 논둑길을 따라 터벅터벅 집으로 향했다. 하늘에는 잿빛 먹구름이 빠르게 몰려오고 있었고, 바람이 벼 이삭을 한꺼번에 눕히듯 세차게 불어왔다. 민호는 주머니에서 구겨진 시험지를 꺼내 다시 한번 펼쳐 들여다보았다. 빨간 글씨로 적힌 점수가 빗물에 젖은 잉크처럼 흐릿하게 번져 보였다. 어머니의 실망스러운 표정이 먼저 떠올라 발걸음이 자꾸만 느려졌다." },
    { id: "p2", text: "개울가에 이르렀을 때 굵은 빗방울이 하나 둘 떨어지기 시작했다. 민호는 다리 아래로 뛰어 들어가 비를 피했다. 좁고 어두운 다리 밑에는 커다란 개구리 한 마리가 먼저 자리를 잡고 앉아 있었는데, 민호를 보고도 도망가지 않고 가만히 눈만 깜빡였다. 빗소리가 점점 거세지자 민호는 무릎을 끌어안고 쪼그려 앉았다. 흙냄새가 진하게 올라오는 비 냄새 속에서 민호는 어쩐지 마음이 한결 차분해지는 것을 느꼈다." },
    { id: "p3", text: "소나기는 금세 그쳤다. 다리 밑에서 기어 나온 민호의 눈앞에 선명한 무지개가 한 폭의 그림처럼 하늘에 걸려 있었다. 논둑의 풀잎마다 투명한 물방울이 맺혀 오후 햇살에 보석처럼 반짝이고 있었고, 개구리는 어느새 개울로 풍덩 뛰어들어 첨벙 소리를 냈다. 민호는 주머니 속 시험지를 꾸깃꾸깃 다시 접어 넣으며 혼잣말을 했다. 다음에는 더 열심히 하면 되지 뭐." },
    { id: "p4", text: "집 앞에 도착했을 때 어머니가 마당에서 젖은 빨래를 서둘러 걷고 계셨다. 어머니는 비에 살짝 젖은 민호를 보며 어서 들어와 옷부터 갈아입으라고 다정하게 말했다. 민호는 현관에 신발을 가지런히 벗어 놓고 방으로 들어가 책상 앞에 조용히 앉았다. 시험지를 펼쳐 틀린 문제를 처음부터 차근차근 다시 풀어 보기 시작했다. 창밖으로 무지개가 서서히 흐려지고 있었지만 민호의 마음속에는 오히려 선명한 무언가가 단단히 자리 잡고 있었다." }
  ];
  const len = charLen(paragraphs);
  console.log(`  Day 250 지문 길이: ${len}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '바람이 벼 이삭을 한꺼번에 눕히듯 세차게 불어왔다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "바람이 벼 이삭을 한꺼번에 눕히듯 세차게 불어왔다")]),
    makeConfirmQ("q2", "지문에서 '어머니의 실망스러운 표정이 먼저 떠올라'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "어머니의 실망스러운 표정이 먼저 떠올라")]),
    makeConfirmQ("q3", "지문에서 '민호를 보고도 도망가지 않고 가만히 눈만 깜빡였다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "민호를 보고도 도망가지 않고 가만히 눈만 깜빡였다")]),
    makeConfirmQ("q4", "지문에서 '흙냄새가 진하게 올라오는 비 냄새 속에서'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "흙냄새가 진하게 올라오는 비 냄새 속에서")]),
    makeConfirmQ("q5", "지문에서 '선명한 무지개가 한 폭의 그림처럼 하늘에 걸려 있었다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "선명한 무지개가 한 폭의 그림처럼 하늘에 걸려 있었다")]),
    makeConfirmQ("q6", "지문에서 '다음에는 더 열심히 하면 되지 뭐'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "다음에는 더 열심히 하면 되지 뭐")]),
    makeConfirmQ("q7", "지문에서 '민호의 마음속에는 오히려 선명한 무언가가 단단히 자리 잡고 있었다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p4", "민호의 마음속에는 오히려 선명한 무언가가 단단히 자리 잡고 있었다")])
  ];

  const content = assembleFull(250, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === Day 251 (홀수 → 비문학) - 해양 생태계와 산호초 ===
function buildDay251() {
  const paragraphs = [
    { id: "p1", text: "산호초는 따뜻한 열대 바다의 얕은 곳에서 발견되는 거대하고 복잡한 해양 생태계이다. 산호는 동물에 속하지만 식물처럼 한자리에 단단히 고착하여 평생을 살아가며, 체내에 공생하는 미세 조류인 주산셀라로부터 필요한 영양분의 상당 부분을 공급받는다. 산호초는 전체 바다 면적의 약 1퍼센트에 불과하지만 해양 생물 종의 약 25퍼센트가 이곳에 서식하고 있어 바다의 열대우림이라는 별명을 가지고 있다. 이러한 산호초는 다양한 물고기의 산란지이자 안전한 은신처 역할을 하며 해안선을 거센 파도로부터 보호하는 천연 방파제 기능도 수행한다." },
    { id: "p2", text: "최근 전 세계적으로 산호초의 백화 현상이 심각하게 진행되고 있어 해양 과학자들의 깊은 우려를 사고 있다. 백화 현상이란 해수 온도의 상승 등 급격한 환경 변화로 인해 산호 체내의 공생 조류가 빠져나가면서 산호가 하얗게 변하는 현상을 말한다. 공생 조류를 잃은 산호는 주요 에너지 공급원을 상실하여 결국 죽음에 이르게 된다. 지구 온난화에 따른 해수면 온도 상승이 백화 현상의 주요 원인으로 지목되고 있으며, 해양 오염과 과도한 어업 활동 역시 산호초의 건강을 위협하는 심각한 요인이다." },
    { id: "p3", text: "산호초를 보전하기 위한 국제적인 노력이 다방면에서 활발하게 이루어지고 있다. 여러 나라에서는 산호초가 분포하는 해역을 해양 보호 구역으로 지정하여 인간의 활동을 엄격히 제한하고 있으며, 과학자들은 고온에 강한 산호 종을 연구하여 대규모 복원 사업에 적극 활용하고 있다. 개인 차원에서도 자외선 차단제의 성분을 꼼꼼히 확인하여 산호에 해로운 화학 물질이 포함된 제품의 사용을 자제하는 실천적 노력이 필요하다. 산호초의 보전은 단순히 해양 환경만의 문제가 아니라 인류의 식량 자원과 경제 활동에도 직결되는 중요한 과제이다." }
  ];
  const len = charLen(paragraphs);
  console.log(`  Day 251 지문 길이: ${len}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '체내에 공생하는 미세 조류인 주산셀라'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "체내에 공생하는 미세 조류인 주산셀라")]),
    makeConfirmQ("q2", "지문에서 '바다의 열대우림이라는 별명을 가지고 있다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "바다의 열대우림이라는 별명을 가지고 있다")]),
    makeConfirmQ("q3", "지문에서 '거센 파도로부터 보호하는 천연 방파제 기능'을 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "거센 파도로부터 보호하는 천연 방파제 기능")]),
    makeConfirmQ("q4", "지문에서 '공생 조류가 빠져나가면서 산호가 하얗게 변하는 현상'을 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "공생 조류가 빠져나가면서 산호가 하얗게 변하는 현상")]),
    makeConfirmQ("q5", "지문에서 '에너지 공급원을 상실하여 결국 죽음에 이르게 된다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "에너지 공급원을 상실하여 결국 죽음에 이르게 된다")]),
    makeConfirmQ("q6", "지문에서 '고온에 강한 산호 종을 연구하여 대규모 복원 사업에'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "고온에 강한 산호 종을 연구하여 대규모 복원 사업에")]),
    makeConfirmQ("q7", "지문에서 '인류의 식량 자원과 경제 활동에도 직결되는'을 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "인류의 식량 자원과 경제 활동에도 직결되는")])
  ];

  const content = assembleFull(251, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === Day 252 (짝수 → 문학) - 할아버지의 낚시 ===
function buildDay252() {
  const paragraphs = [
    { id: "p1", text: "수빈이는 여름 방학을 맞아 시골 할아버지 댁에 내려왔다. 할아버지는 동이 트기도 전에 일어나 낚싯대를 챙기며 수빈이에게 함께 가자고 손짓했다. 아직 잠이 덜 깬 수빈이는 투덜거리며 할아버지를 따라 나섰다. 마을 뒤편의 저수지까지 가는 좁은 오솔길에는 이슬을 머금은 풀잎들이 발목을 간질였고, 멀리서 수탉의 우렁찬 울음소리가 고요한 새벽의 정적을 깨우고 있었다." },
    { id: "p2", text: "저수지에 도착하자 할아버지는 천천히 낚싯줄을 풀고 작은 지렁이를 미끼로 꿰어 물 위로 멀리 던졌다. 수빈이에게도 작은 낚싯대를 건네주며 고기가 올 때까지 조용히 기다려야 한다고 일러주었다. 수빈이는 처음에 지루해서 물속의 송사리를 구경하거나 돌멩이를 개울에 던지려 했지만, 할아버지가 조용히 눈짓으로 말리셨다. 물 위에 동그랗게 놓인 찌를 가만히 바라보며 한참을 앉아 있으니 처음에는 들리지 않던 새소리와 바람 소리가 하나둘 또렷하게 귀에 들어오기 시작했다." },
    { id: "p3", text: "한 시간쯤 지났을까, 수빈이의 찌가 갑자기 물속으로 쑥 빨려 들어갔다. 할아버지가 재빨리 다가와 낚싯대를 잡는 법을 차근히 알려주었고, 수빈이는 온 힘을 다해 힘껏 끌어 올렸다. 손바닥만 한 붕어 한 마리가 아침 햇살을 받으며 은빛으로 눈부시게 빛났다. 수빈이는 난생처음 느끼는 손맛에 눈이 반짝였고, 할아버지는 잘했다며 너털웃음을 지으시고 수빈이의 머리를 쓰다듬어 주었다." },
    { id: "p4", text: "돌아오는 길에 할아버지는 잡은 붕어를 다시 저수지에 조심스럽게 놓아 주셨다. 수빈이가 왜 놓아 주느냐고 의아한 표정으로 묻자 할아버지는 빙그레 웃으며 말했다. 낚시는 물고기를 잡는 게 아니라 기다림을 배우는 거란다. 수빈이는 할아버지의 말을 완전히 이해하지는 못했지만 오늘 아침 저수지에서 보낸 시간이 어쩐지 특별하게 느껴졌다. 집에 돌아온 수빈이는 일기장을 펴고 오늘의 일을 또박또박 정성껏 적어 내려갔다." }
  ];
  const len = charLen(paragraphs);
  console.log(`  Day 252 지문 길이: ${len}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '이슬을 머금은 풀잎들이 발목을 간질였고'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "이슬을 머금은 풀잎들이 발목을 간질였고")]),
    makeConfirmQ("q2", "지문에서 '조용히 기다려야 한다고 일러주었다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "조용히 기다려야 한다고 일러주었다")]),
    makeConfirmQ("q3", "지문에서 '처음에는 들리지 않던 새소리와 바람 소리가'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "처음에는 들리지 않던 새소리와 바람 소리가")]),
    makeConfirmQ("q4", "지문에서 '손바닥만 한 붕어 한 마리가 아침 햇살을 받으며 은빛으로'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "손바닥만 한 붕어 한 마리가 아침 햇살을 받으며 은빛으로")]),
    makeConfirmQ("q5", "지문에서 '난생처음 느끼는 손맛에 눈이 반짝였고'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "난생처음 느끼는 손맛에 눈이 반짝였고")]),
    makeConfirmQ("q6", "지문에서 '낚시는 물고기를 잡는 게 아니라 기다림을 배우는 거란다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p4", "낚시는 물고기를 잡는 게 아니라 기다림을 배우는 거란다")]),
    makeConfirmQ("q7", "지문에서 '일기장을 펴고 오늘의 일을 또박또박 정성껏 적어 내려갔다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p4", "일기장을 펴고 오늘의 일을 또박또박 정성껏 적어 내려갔다")])
  ];

  const content = assembleFull(252, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === Day 253 (홀수 → 비문학) - 도시 열섬 현상 ===
function buildDay253() {
  const paragraphs = [
    { id: "p1", text: "도시 열섬 현상이란 도시 중심부의 기온이 주변 교외 지역이나 농촌보다 뚜렷하게 높게 나타나는 현상을 말한다. 콘크리트와 아스팔트로 빽빽하게 뒤덮인 도시는 낮 동안 태양 에너지를 대량으로 흡수한 뒤 밤에도 축적된 열을 서서히 방출하기 때문에 자연 지형보다 기온이 높게 유지된다. 또한 고층 건물과 넓은 도로가 밀집한 도시의 구조는 바람의 자연스러운 흐름을 방해하여 열이 쉽게 빠져나가지 못하게 만든다. 이러한 열섬 현상은 여름철 폭염의 피해를 가중시키고 에어컨 사용량의 급증으로 인한 전력 소비 증가를 야기하는 악순환을 초래한다." },
    { id: "p2", text: "도시 열섬 현상의 원인은 크게 세 가지로 나눌 수 있다. 첫째, 도시 지표면의 재질 변화이다. 자연 토양이나 초목은 수분을 증발시키며 주변의 열을 식혀 주지만, 아스팔트와 콘크리트는 열 흡수율이 높고 수분 증발이 거의 일어나지 않아 열이 계속 축적된다. 둘째, 자동차와 공장, 대형 냉난방 시설 등에서 배출되는 인공 폐열이 도시 전체의 평균 기온을 끌어올린다. 셋째, 고층 건물들이 밀집하여 형성된 도시 협곡 구조가 복사열의 반사와 재흡수를 반복시켜 열이 외부로 빠져나가는 것을 효과적으로 차단한다." },
    { id: "p3", text: "도시 열섬 현상을 완화하기 위한 다양한 대책이 세계 여러 도시에서 적극적으로 시행되고 있다. 도시 내에 공원과 녹지를 확충하면 식물의 증산 작용에 의해 주변 온도를 효과적으로 낮출 수 있으며, 건물의 옥상이나 벽면에 식물을 심는 녹색 건축 기법도 뛰어난 효과를 내고 있다. 도로와 주차장 표면에 열 반사율이 높은 소재를 사용하거나 투수성 포장을 도입하여 빗물이 지면으로 스며들도록 하는 방법도 주목받고 있다. 이러한 노력은 도시 주민의 건강과 삶의 질을 높이는 데 기여할 뿐 아니라 탄소 배출 저감에도 긍정적인 영향을 미친다." }
  ];
  const len = charLen(paragraphs);
  console.log(`  Day 253 지문 길이: ${len}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '태양 에너지를 대량으로 흡수한 뒤 밤에도 축적된 열을 서서히 방출하기 때문에'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "태양 에너지를 대량으로 흡수한 뒤 밤에도 축적된 열을 서서히 방출하기 때문에")]),
    makeConfirmQ("q2", "지문에서 '에어컨 사용량의 급증으로 인한 전력 소비 증가'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "에어컨 사용량의 급증으로 인한 전력 소비 증가")]),
    makeConfirmQ("q3", "지문에서 '아스팔트와 콘크리트는 열 흡수율이 높고'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "아스팔트와 콘크리트는 열 흡수율이 높고")]),
    makeConfirmQ("q4", "지문에서 '인공 폐열이 도시 전체의 평균 기온을 끌어올린다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "인공 폐열이 도시 전체의 평균 기온을 끌어올린다")]),
    makeConfirmQ("q5", "지문에서 '복사열의 반사와 재흡수를 반복시켜'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "복사열의 반사와 재흡수를 반복시켜")]),
    makeConfirmQ("q6", "지문에서 '식물의 증산 작용에 의해 주변 온도를 효과적으로 낮출 수 있으며'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "식물의 증산 작용에 의해 주변 온도를 효과적으로 낮출 수 있으며")]),
    makeConfirmQ("q7", "지문에서 '탄소 배출 저감에도 긍정적인 영향을 미친다'를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "탄소 배출 저감에도 긍정적인 영향을 미친다")])
  ];

  const content = assembleFull(253, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === 실행부 ===
const results = [
  { dayIndex: 249, ...buildDay249() },
  { dayIndex: 250, ...buildDay250() },
  { dayIndex: 251, ...buildDay251() },
  { dayIndex: 252, ...buildDay252() },
  { dayIndex: 253, ...buildDay253() }
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
  path.join(__dirname, '..', 'generated', 'new', 'batch-f2-249-253.json'),
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
