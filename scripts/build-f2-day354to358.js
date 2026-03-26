#!/usr/bin/env node
// 프레게2 Day 354~358 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE(문학), 홀수 Day = NONFICTION(비문학)
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

// ═══════════════════════════════════════════════════════════
// Day 354 — 문학 (LITERATURE): 창작 단편 - 첫 자전거
// ═══════════════════════════════════════════════════════════
function buildDay354() {
  const paragraphs = [
    { id: "p1", text: "열 살 생일날, 아버지가 마당 한구석에 세워 둔 자전거를 처음 보았을 때 나는 심장이 멎는 줄 알았다. 파란색 몸체에 은색 핸들이 달린 그 자전거는 햇빛을 받아 눈이 부실 만큼 반짝이고 있었다. 한 달 전부터 친구 민수가 자전거를 타고 학교에 오는 모습을 부러운 눈으로 바라보기만 했던 터라, 나만의 자전거가 생겼다는 사실이 꿈만 같았다. 아버지는 웃으며 헬멧을 건네주셨고, 나는 떨리는 손으로 헬멧을 쓴 뒤 자전거 안장에 올라앉았다. 안장은 생각보다 높았고, 발끝이 겨우 땅에 닿을 정도여서 괜히 긴장이 되었다." },
    { id: "p2", text: "처음에는 페달을 밟자마자 중심을 잃고 옆으로 넘어졌다. 무릎에서 피가 났지만 아프기보다 창피한 마음이 더 컸다. 아버지가 뒤에서 안장을 잡아 주셨고, 나는 두 발로 힘껏 페달을 돌리며 앞으로 나아갔다. 바람이 얼굴을 스칠 때의 시원한 감촉이 아직도 생생하다. 열 번쯤 넘어지고 일어서기를 반복하자 어느 순간 아버지의 손이 안장에서 떨어져 있다는 것을 깨달았다. 혼자 힘으로 달리고 있었던 것이다. 나는 소리를 질렀고, 아버지는 저 뒤에서 두 손을 흔들며 환하게 웃고 계셨다. 그날 저녁 어머니에게 자전거를 혼자 탔다고 자랑하자 어머니는 대견하다는 표정으로 머리를 쓰다듬어 주셨다." },
    { id: "p3", text: "그 뒤로 나는 매일 저녁 자전거를 타러 나갔다. 동네 골목을 누비고, 냇가를 따라 이어진 자전거 도로를 달렸다. 페달을 밟을 때마다 세상이 넓어지는 기분이 들었고, 바람과 함께 달리는 자유로움에 온몸이 짜릿했다. 한 달쯤 지나자 학교까지 자전거로 통학할 수 있게 되었고, 민수와 나란히 달리며 누가 더 빠른지 시합하기도 했다. 비가 오는 날에도 자전거 생각에 창밖만 바라보곤 했다. 어른이 된 지금도 자전거를 탈 때면 아버지가 안장을 잡아 주시던 그 따뜻한 손길이 등 뒤에서 느껴지는 것만 같다." }
  ];
  console.log(`  Day 354 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "화자가 자전거를 처음 보았을 때의 감정을 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "나는 심장이 멎는 줄 알았다.")]),
    makeConfirmQ("q2", "자전거의 외형을 묘사한 부분을 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "파란색 몸체에 은색 핸들이 달린 그 자전거는 햇빛을 받아 눈이 부실 만큼 반짝이고 있었다.")]),
    makeConfirmQ("q3", "화자가 처음 넘어졌을 때의 심정을 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "무릎에서 피가 났지만 아프기보다 창피한 마음이 더 컸다.")]),
    makeConfirmQ("q4", "화자가 혼자 달리고 있음을 깨달은 순간을 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "어느 순간 아버지의 손이 안장에서 떨어져 있다는 것을 깨달았다.")]),
    makeConfirmQ("q5", "자전거를 탈 때 화자가 느낀 감정을 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "페달을 밟을 때마다 세상이 넓어지는 기분이 들었고, 바람과 함께 달리는 자유로움에 온몸이 짜릿했다.")]),
    makeConfirmQ("q6", "어른이 된 화자가 자전거를 탈 때 떠올리는 기억을 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "어른이 된 지금도 자전거를 탈 때면 아버지가 안장을 잡아 주시던 그 따뜻한 손길이 등 뒤에서 느껴지는 것만 같다.")])
  ];

  const content = assembleFull(354, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ═══════════════════════════════════════════════════════════
// Day 355 — 비문학 (NONFICTION): 화산과 지진의 원리
// ═══════════════════════════════════════════════════════════
function buildDay355() {
  const paragraphs = [
    { id: "p1", text: "지구의 표면은 하나의 단단한 껍데기가 아니라 여러 개의 거대한 판으로 나뉘어 있다. 이 판들을 지각판이라 하며, 현재까지 알려진 주요 지각판은 약 열다섯 개에 이른다. 지각판은 그 아래에 있는 뜨거운 맨틀 위를 매우 느린 속도로 이동한다. 맨틀은 높은 온도와 압력으로 인해 마치 끈적한 액체처럼 천천히 대류하고 있으며, 이 대류가 지각판을 움직이는 원동력이 된다. 지각판의 경계에서는 판들이 서로 충돌하거나 벌어지거나 스쳐 지나가는 현상이 일어나며, 이러한 지각판의 상호 작용이 화산 활동과 지진을 일으키는 근본 원인이다." },
    { id: "p2", text: "화산은 지각판이 충돌하여 한쪽 판이 다른 판 아래로 밀려 들어갈 때 주로 발생한다. 밀려 들어간 판은 지하 깊은 곳에서 높은 열에 의해 녹으면서 마그마를 형성한다. 이 마그마가 지표면의 약한 틈을 통해 분출되면 화산 폭발이 일어나는 것이다. 화산이 분출할 때는 용암뿐만 아니라 화산재, 화산 가스, 화산탄 등이 함께 뿜어져 나오며, 대규모 화산 폭발은 기후 변화에까지 영향을 미칠 수 있다. 역사적으로 인도네시아 탐보라 화산의 대폭발은 이듬해 전 세계적인 기온 하락을 초래하여 여름 없는 해로 기록되었다." },
    { id: "p3", text: "지진은 지각판의 경계에서 축적된 에너지가 갑자기 방출될 때 발생한다. 판과 판이 맞닿은 곳에서는 마찰로 인해 응력이 서서히 쌓이며, 이 응력이 암석의 강도를 초과하는 순간 단층이 어긋나면서 지진파가 사방으로 퍼져 나간다. 지진의 규모는 리히터 규모나 모멘트 규모로 측정되며, 규모가 클수록 파괴력이 기하급수적으로 증가한다. 해저에서 강력한 지진이 발생하면 쓰나미가 일어나 해안 지역에 엄청난 피해를 줄 수 있다. 따라서 지진 다발 지역에서는 내진 설계와 조기 경보 시스템의 구축이 인명 보호에 필수적이며, 평소 대비 훈련을 통해 피해를 최소화해야 한다." }
  ];
  console.log(`  Day 355 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "지각판을 움직이는 원동력을 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "이 대류가 지각판을 움직이는 원동력이 된다.")]),
    makeConfirmQ("q2", "지각판 경계에서 일어나는 현상을 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "지각판의 경계에서는 판들이 서로 충돌하거나 벌어지거나 스쳐 지나가는 현상이 일어나며")]),
    makeConfirmQ("q3", "마그마가 형성되는 과정을 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "밀려 들어간 판은 지하 깊은 곳에서 높은 열에 의해 녹으면서 마그마를 형성한다.")]),
    makeConfirmQ("q4", "화산 폭발 시 분출되는 물질들을 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "화산이 분출할 때는 용암뿐만 아니라 화산재, 화산 가스, 화산탄 등이 함께 뿜어져 나오며")]),
    makeConfirmQ("q5", "탐보라 화산 대폭발의 결과를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "인도네시아 탐보라 화산의 대폭발은 이듬해 전 세계적인 기온 하락을 초래하여 여름 없는 해로 기록되었다.")]),
    makeConfirmQ("q6", "지진이 발생하는 원리를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "이 응력이 암석의 강도를 초과하는 순간 단층이 어긋나면서 지진파가 사방으로 퍼져 나간다.")]),
    makeConfirmQ("q7", "지진 다발 지역에서 필수적인 대비책을 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "지진 다발 지역에서는 내진 설계와 조기 경보 시스템의 구축이 인명 보호에 필수적이며, 평소 대비 훈련을 통해 피해를 최소화해야 한다.")])
  ];

  const content = assembleFull(355, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ═══════════════════════════════════════════════════════════
// Day 356 — 문학 (LITERATURE): 창작 단편 - 겨울밤 이야기
// ═══════════════════════════════════════════════════════════
function buildDay356() {
  const paragraphs = [
    { id: "p1", text: "겨울방학이 시작되던 날, 갑작스러운 폭설로 온 동네가 하얗게 뒤덮였다. 하교길에 무릎까지 빠지는 눈을 헤치며 걸어오는 동안 양말이 흠뻑 젖었지만, 세상이 온통 하얀 솜으로 덮인 풍경에 마음만은 들떠 있었다. 집에 도착하니 어머니가 따끈한 단팥죽을 끓여 놓으셨다. 나는 젖은 양말을 벗어 보일러 위에 올려놓고 방바닥에 드러누워 김이 모락모락 나는 단팥죽을 한 숟갈 떠 입에 넣었다. 달콤한 팥 맛이 혀끝에서 퍼지며 차가웠던 온몸이 스르르 녹는 것 같았다. 창밖으로는 눈이 여전히 쏟아져 내리고 있었고, 전봇대 위에 쌓인 눈이 바람에 흩날리며 작은 눈보라를 만들었다." },
    { id: "p2", text: "저녁이 되자 정전이 일어났다. 폭설로 전선에 문제가 생긴 모양이었다. 갑자기 깜깜해진 집 안에서 동생이 울음을 터뜨렸고, 어머니는 서랍에서 양초 두 자루를 꺼내 불을 붙이셨다. 촛불이 일렁이며 벽에 긴 그림자를 드리우자, 어머니는 우리를 이불 속으로 불러 모으셨다. 아버지는 손전등을 턱 밑에 비추며 유령 이야기를 시작하셨고, 동생은 무섭다면서도 이불을 꼭 움켜쥔 채 눈을 떼지 못했다. 나는 오히려 텔레비전 없는 밤이 이렇게 재미있을 수 있다는 사실에 놀랐다." },
    { id: "p3", text: "아버지의 이야기가 끝난 뒤 어머니가 노래를 불러 주셨다. 조용한 겨울밤에 어머니의 맑은 목소리가 방 안 가득 울려 퍼졌고, 촛불은 노래에 맞추어 흔들리는 듯했다. 바깥에서는 바람 소리가 간간이 들려왔지만, 이불 속의 우리 가족에게는 아무런 두려움도 닿지 않았다. 동생은 어느새 어머니 품에 안겨 잠이 들었고, 나도 따뜻한 이불 속에서 스르르 눈이 감겼다. 한밤중에 잠깐 눈을 떴을 때 전기가 돌아와 있었지만, 정전 속의 그 시간이 오히려 더 환하고 따뜻하게 느껴졌다. 그날 밤은 가족이 가장 가까이 모여 있던 밤으로 오랫동안 기억 속에 남았다." }
  ];
  console.log(`  Day 356 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "폭설이 내린 날 화자의 기분을 묘사한 부분을 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "세상이 온통 하얀 솜으로 덮인 풍경에 마음만은 들떠 있었다.")]),
    makeConfirmQ("q2", "단팥죽을 먹었을 때의 감각적 표현을 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "달콤한 팥 맛이 혀끝에서 퍼지며 차가웠던 온몸이 스르르 녹는 것 같았다.")]),
    makeConfirmQ("q3", "정전이 일어난 원인을 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "폭설로 전선에 문제가 생긴 모양이었다.")]),
    makeConfirmQ("q4", "아버지가 유령 이야기를 할 때 동생의 반응을 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "동생은 무섭다면서도 이불을 꼭 움켜쥔 채 눈을 떼지 못했다.")]),
    makeConfirmQ("q5", "화자가 텔레비전 없는 밤에 대해 느낀 점을 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "나는 오히려 텔레비전 없는 밤이 이렇게 재미있을 수 있다는 사실에 놀랐다.")]),
    makeConfirmQ("q6", "정전 속 시간에 대한 화자의 평가를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "정전 속의 그 시간이 오히려 더 환하고 따뜻하게 느껴졌다.")]),
    makeConfirmQ("q7", "그날 밤이 화자에게 남긴 의미를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "그날 밤은 가족이 가장 가까이 모여 있던 밤으로 오랫동안 기억 속에 남았다.")])
  ];

  const content = assembleFull(356, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ═══════════════════════════════════════════════════════════
// Day 357 — 비문학 (NONFICTION): 우주 탐사의 역사
// ═══════════════════════════════════════════════════════════
function buildDay357() {
  const paragraphs = [
    { id: "p1", text: "인류의 우주 탐사는 1957년 소련이 인공위성 스푸트니크 1호를 발사하면서 본격적으로 시작되었다. 스푸트니크는 지구 궤도를 돌며 전파 신호를 보냈고, 이 신호는 전 세계 사람들에게 우주 시대의 개막을 알렸다. 당시 미국과 소련은 냉전이라는 정치적 대립 속에서 과학 기술의 우위를 증명하기 위해 치열한 우주 경쟁을 벌이고 있었다. 스푸트니크의 성공에 충격을 받은 미국은 항공우주국 나사를 설립하고 대규모 우주 개발 계획에 착수하였다. 1961년에는 소련의 유리 가가린이 보스토크 1호를 타고 지구 궤도를 돈 최초의 우주인이 되었으며, 이는 인류 역사에서 가장 획기적인 사건 중 하나로 기록되었다." },
    { id: "p2", text: "우주 경쟁의 정점은 1969년 아폴로 11호의 달 착륙이었다. 미국의 우주 비행사 닐 암스트롱은 달 표면에 첫발을 디디며 이것은 한 인간에게는 작은 한 걸음이지만 인류에게는 위대한 도약이라는 유명한 말을 남겼다. 아폴로 계획은 총 여섯 차례의 유인 달 착륙을 성공시키며 달의 토양과 암석 시료를 가져왔고, 이를 통해 달의 기원과 구성에 대한 과학적 이해가 크게 확장되었다. 그러나 막대한 비용과 정치적 관심의 변화로 인해 1972년 아폴로 17호를 마지막으로 유인 달 탐사는 중단되었다." },
    { id: "p3", text: "냉전 이후 우주 탐사는 국제 협력의 시대로 접어들었다. 미국, 러시아, 유럽, 일본, 캐나다 등이 공동으로 건설한 국제 우주 정거장은 다양한 과학 실험과 기술 검증의 장이 되고 있다. 한편 화성 탐사 로봇 큐리오시티와 퍼서비어런스는 화성 표면의 지질을 조사하고 과거 생명체 존재의 흔적을 탐색하고 있다. 최근에는 민간 우주 기업들의 참여가 활발해지면서 우주여행의 상업화와 달 기지 건설 등 새로운 도전이 이어지고 있다. 인류의 우주 탐사는 이제 생존과 번영을 위한 필수적 과제로 자리매김하고 있다." }
  ];
  console.log(`  Day 357 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "인류의 우주 탐사가 시작된 계기를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "1957년 소련이 인공위성 스푸트니크 1호를 발사하면서 본격적으로 시작되었다.")]),
    makeConfirmQ("q2", "미국이 우주 개발에 착수한 배경을 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "스푸트니크의 성공에 충격을 받은 미국은 항공우주국 나사를 설립하고 대규모 우주 개발 계획에 착수하였다.")]),
    makeConfirmQ("q3", "최초의 우주인에 대한 정보를 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "소련의 유리 가가린이 보스토크 1호를 타고 지구 궤도를 돈 최초의 우주인이 되었으며")]),
    makeConfirmQ("q4", "아폴로 계획의 과학적 성과를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "아폴로 계획은 총 여섯 차례의 유인 달 착륙을 성공시키며 달의 토양과 암석 시료를 가져왔고, 이를 통해 달의 기원과 구성에 대한 과학적 이해가 크게 확장되었다.")]),
    makeConfirmQ("q5", "유인 달 탐사가 중단된 이유를 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "막대한 비용과 정치적 관심의 변화로 인해 1972년 아폴로 17호를 마지막으로 유인 달 탐사는 중단되었다.")]),
    makeConfirmQ("q6", "화성 탐사 로봇의 임무를 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "화성 탐사 로봇 큐리오시티와 퍼서비어런스는 화성 표면의 지질을 조사하고 과거 생명체 존재의 흔적을 탐색하고 있다.")]),
    makeConfirmQ("q7", "우주 탐사의 현재 위상을 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "인류의 우주 탐사는 이제 생존과 번영을 위한 필수적 과제로 자리매김하고 있다.")])
  ];

  const content = assembleFull(357, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ═══════════════════════════════════════════════════════════
// Day 358 — 문학 (LITERATURE): 창작 단편 - 할머니의 텃밭
// ═══════════════════════════════════════════════════════════
function buildDay358() {
  const paragraphs = [
    { id: "p1", text: "할머니 집 뒤편에는 작은 텃밭이 있었다. 고추, 상추, 토마토, 호박 같은 채소들이 줄지어 자라는 그 텃밭은 할머니의 자랑이자 놀이터 같은 곳이었다. 텃밭 한쪽에는 할머니가 손수 세운 허수아비가 서 있었는데, 낡은 밀짚모자를 쓰고 있는 모습이 꽤 정겨웠다. 여름방학마다 시골에 내려가면 할머니는 새벽부터 텃밭에 나가 김을 매고 물을 주셨다. 나는 잠이 덜 깬 눈을 비비며 할머니를 따라 나서곤 했는데, 이슬에 젖은 풀잎 사이로 비치는 아침 햇살이 유독 따스하게 느껴졌다. 할머니는 쪼그리고 앉아 풀을 뽑으시며 식물도 사람처럼 정성을 들여야 잘 자란다고 말씀하셨다." },
    { id: "p2", text: "내가 가장 좋아했던 일은 빨갛게 익은 토마토를 따는 것이었다. 할머니가 가리키시는 대로 줄기에서 조심스럽게 토마토를 따면, 손바닥 위에 올려놓은 토마토에서 햇볕에 달궈진 온기가 전해졌다. 우물가에서 씻어 한 입 베어 물면 달콤하고 시큼한 즙이 입안 가득 퍼지며 가게에서 사 먹는 것과는 차원이 다른 맛이었다. 할머니는 직접 키운 것이라 더 맛있는 거란다 하며 빙그레 웃으셨다. 바구니 가득 채소를 담아 돌아오는 길에 할머니의 등이 조금 굽어 있다는 것을 그때 처음 알아차렸다." },
    { id: "p3", text: "어느 해 겨울, 할머니가 편찮으셔서 텃밭을 돌보지 못하게 되었다. 봄이 되어 시골에 내려가 보니 텃밭은 잡초로 뒤덮여 있었다. 나는 할머니에게 배운 대로 호미를 들고 잡초를 뽑고 땅을 고른 뒤 상추와 토마토 모종을 심었다. 할머니는 창문 너머로 내가 일하는 모습을 바라보시며 기특하다고 눈시울을 붉히셨다. 여름이 되자 텃밭에는 다시 푸른 잎들이 무성하게 자라났고, 나는 빨갛게 익은 토마토를 따서 할머니 방으로 가져갔다. 할머니는 그 토마토를 한 입 베어 무시며 네가 키운 거라 더 맛있구나 하고 웃으셨다." }
  ];
  console.log(`  Day 358 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "할머니의 텃밭에 자라는 채소들을 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "고추, 상추, 토마토, 호박 같은 채소들이 줄지어 자라는 그 텃밭은 할머니의 자랑이자 놀이터 같은 곳이었다.")]),
    makeConfirmQ("q2", "할머니가 식물에 대해 하신 말씀을 찾아 클릭하세요.",
      [findRange(paragraphs, "p1", "식물도 사람처럼 정성을 들여야 잘 자란다고 말씀하셨다.")]),
    makeConfirmQ("q3", "토마토를 따서 먹었을 때의 맛을 묘사한 부분을 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "달콤하고 시큼한 즙이 입안 가득 퍼지며 가게에서 사 먹는 것과는 차원이 다른 맛이었다.")]),
    makeConfirmQ("q4", "화자가 할머니의 등에 대해 깨달은 부분을 찾아 클릭하세요.",
      [findRange(paragraphs, "p2", "바구니 가득 채소를 담아 돌아오는 길에 할머니의 등이 조금 굽어 있다는 것을 그때 처음 알아차렸다.")]),
    makeConfirmQ("q5", "화자가 텃밭을 되살리기 위해 한 일을 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "나는 할머니에게 배운 대로 호미를 들고 잡초를 뽑고 땅을 고른 뒤 상추와 토마토 모종을 심었다.")]),
    makeConfirmQ("q6", "할머니가 화자의 토마토를 먹으며 하신 말씀을 찾아 클릭하세요.",
      [findRange(paragraphs, "p3", "네가 키운 거라 더 맛있구나 하고 웃으셨다.")])
  ];

  const content = assembleFull(358, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ═══════════════════════════════════════════════════════════
// 실행부
// ═══════════════════════════════════════════════════════════
const results = [
  { dayIndex: 354, ...buildDay354() },
  { dayIndex: 355, ...buildDay355() },
  { dayIndex: 356, ...buildDay356() },
  { dayIndex: 357, ...buildDay357() },
  { dayIndex: 358, ...buildDay358() }
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
fs.writeFileSync(path.join(newDir, 'batch-f2-354-358.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ generated/new/batch-f2-354-358.json`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
