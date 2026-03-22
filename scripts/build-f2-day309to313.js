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

// === Day 309 (홀수 → 비문학) ===
function buildDay309() {
  const paragraphs = [
    { id: "p1", text: "소금은 인류 역사에서 매우 중요한 역할을 해 온 물질이다. 화학적으로 염화나트륨이라 불리는 소금은 음식의 간을 맞추는 조미료일 뿐만 아니라, 식품을 보존하는 데에도 필수적인 재료였다. 냉장 기술이 없던 시대에 소금은 고기와 생선을 절여 오래 보관할 수 있게 해 주었다. 이 때문에 소금은 화폐처럼 쓰이기도 했으며, 로마 시대에는 군인들에게 소금으로 급여를 지급한 것에서 영어 단어 샐러리가 유래했다고 전해진다. 소금을 둘러싼 전쟁과 교역이 세계 곳곳에서 벌어졌을 만큼, 소금은 단순한 양념 이상의 전략적 자원으로서 높은 가치를 지녔다." },
    { id: "p2", text: "소금은 인체에도 중요한 기능을 한다. 나트륨은 체내 수분 균형을 조절하고, 신경 신호를 전달하며, 근육의 수축과 이완에 관여한다. 적절한 양의 소금 섭취는 건강 유지에 필수적이다. 그러나 과도한 소금 섭취는 고혈압, 심장 질환, 신장 질환 등의 위험을 높인다. 세계보건기구는 성인의 하루 소금 섭취 권장량을 오 그램 이하로 제시하고 있으나, 한국인의 평균 섭취량은 이를 크게 초과하는 것으로 알려져 있다. 특히 김치, 된장, 간장 등 전통 발효 식품에 소금이 많이 들어가기 때문에 평소 식습관에서 의식적인 관리가 필요하다." },
    { id: "p3", text: "현대 사회에서 소금의 쓰임새는 더욱 다양해졌다. 겨울철 도로의 얼음을 녹이는 제설제로 사용되고, 화학 공업에서는 염소와 수산화나트륨을 만드는 원료로 활용된다. 또한 수영장의 물을 소독하거나, 비누와 세제를 제조하는 데에도 소금이 쓰인다. 최근에는 소금을 활용한 에너지 저장 기술도 연구되고 있다. 태양열을 용융 소금에 저장했다가 필요할 때 전기로 변환하는 집광형 태양열 발전 방식이 주목받고 있는 것이다. 이처럼 소금은 고대부터 현대까지 인류의 삶과 뗄 수 없는 밀접한 관계를 맺어 왔다." }
  ];
  console.log(`  Day 309 지문 길이: ${charLen(paragraphs)}자`);
  const questions = [
    makeConfirmQ("q1", "냉장 기술이 없던 시대에 소금은 어떤 용도로 쓰였나요?", [findRange(paragraphs, "p1", "소금은 고기와 생선을 절여 오래 보관할 수 있게 해 주었다.")]),
    makeConfirmQ("q2", "영어 단어 샐러리의 유래는 무엇인가요?", [findRange(paragraphs, "p1", "로마 시대에는 군인들에게 소금으로 급여를 지급한 것에서 영어 단어 샐러리가 유래했다고 전해진다.")]),
    makeConfirmQ("q3", "나트륨이 인체에서 하는 기능은 무엇인가요?", [findRange(paragraphs, "p2", "나트륨은 체내 수분 균형을 조절하고, 신경 신호를 전달하며, 근육의 수축과 이완에 관여한다.")]),
    makeConfirmQ("q4", "세계보건기구가 제시한 하루 소금 섭취 권장량은 얼마인가요?", [findRange(paragraphs, "p2", "세계보건기구는 성인의 하루 소금 섭취 권장량을 오 그램 이하로 제시하고 있으나")]),
    makeConfirmQ("q5", "한국인의 소금 섭취가 많은 이유는 무엇인가요?", [findRange(paragraphs, "p2", "김치, 된장, 간장 등 전통 발효 식품에 소금이 많이 들어가기 때문에 평소 식습관에서 의식적인 관리가 필요하다.")]),
    makeConfirmQ("q6", "소금을 활용한 에너지 저장 기술은 어떤 방식인가요?", [findRange(paragraphs, "p3", "태양열을 용융 소금에 저장했다가 필요할 때 전기로 변환하는 집광형 태양열 발전 방식이 주목받고 있는 것이다.")])
  ];
  return { content: assembleFull(309, "NONFICTION", "비문학", paragraphs, questions), subArea: "NONFICTION" };
}

// === Day 310 (짝수 → 문학) ===
function buildDay310() {
  const paragraphs = [
    { id: "p1", text: "새벽 다섯 시, 아버지의 자전거 바퀴 소리가 골목을 가르며 멀어져 갔다. 수연이는 이불 속에서 그 소리를 들으며 잠을 청했지만, 좀처럼 잠이 오지 않았다. 아버지는 새벽마다 수산 시장에 가서 싱싱한 생선을 받아 오셨다. 작은 트럭을 살 형편이 되지 않아 자전거 뒤에 커다란 스티로폼 상자를 싣고 다니셨다. 수연이는 그 모습이 늘 안쓰러웠다. 친구들의 아버지처럼 승용차를 타고 회사에 출근하는 모습을 한 번도 본 적이 없었기 때문이다. 하지만 아버지는 단 한 번도 힘들다는 말씀을 하지 않으셨다." },
    { id: "p2", text: "어느 비 오는 날, 수연이는 학교에서 돌아오다가 시장 골목에서 아버지를 보았다. 아버지는 비에 젖은 채 좌판 앞에 서서 손님을 기다리고 계셨다. 수연이는 발걸음을 멈추고 먼 곳에서 한참 동안 아버지를 바라보았다. 아버지의 고무장갑 낀 손이 능숙하게 생선의 비늘을 벗기고 있었다. 손님이 오면 허리를 깊이 숙여 인사하시고, 깍듯하게 물건을 건네셨다. 수연이의 눈에 뜨거운 것이 차올랐다. 아버지의 그 굽은 등이, 비에 젖은 어깨가, 쉬지 않고 움직이는 손이 모두 오로지 자신을 위한 것임을 알았기 때문이다." },
    { id: "p3", text: "그날 저녁, 수연이는 아버지 앞에 공책을 펼쳐 놓았다. 전교 삼 등이 적힌 성적표였다. 아버지는 말없이 성적표를 들여다보시더니 수연이의 머리를 살며시 쓰다듬으셨다. \"잘했다, 우리 수연이.\" 그 짧은 한마디에 수연이는 그동안 참았던 눈물을 쏟았다. 수연이는 마음속으로 굳게 다짐했다. 아버지가 비를 맞으며 생선을 파는 그 시간 동안, 자신은 반드시 책상 앞에서 최선을 다하겠다고. 아버지의 사랑은 말이 아닌 행동으로 전해졌고, 수연이는 그 무게를 온전히 느끼고 있었다. 창밖에서 들려오는 빗소리가 아버지의 자전거 바퀴 소리와 겹쳐 들렸다." }
  ];
  console.log(`  Day 310 지문 길이: ${charLen(paragraphs)}자`);
  const questions = [
    makeConfirmQ("q1", "아버지는 새벽마다 어디에 가셨나요?", [findRange(paragraphs, "p1", "아버지는 새벽마다 수산 시장에 가서 싱싱한 생선을 받아 오셨다.")]),
    makeConfirmQ("q2", "아버지가 자전거를 타고 다니신 이유는 무엇인가요?", [findRange(paragraphs, "p1", "작은 트럭을 살 형편이 되지 않아 자전거 뒤에 커다란 스티로폼 상자를 싣고 다니셨다.")]),
    makeConfirmQ("q3", "비 오는 날 수연이가 시장에서 본 아버지의 모습은 어떠했나요?", [findRange(paragraphs, "p2", "아버지는 비에 젖은 채 좌판 앞에 서서 손님을 기다리고 계셨다.")]),
    makeConfirmQ("q4", "수연이의 눈에 뜨거운 것이 차오른 이유는 무엇인가요?", [findRange(paragraphs, "p2", "아버지의 그 굽은 등이, 비에 젖은 어깨가, 쉬지 않고 움직이는 손이 모두 오로지 자신을 위한 것임을 알았기 때문이다.")]),
    makeConfirmQ("q5", "수연이가 아버지에게 보여 드린 것은 무엇인가요?", [findRange(paragraphs, "p3", "전교 삼 등이 적힌 성적표였다.")]),
    makeConfirmQ("q6", "아버지는 성적표를 보고 어떻게 반응하셨나요?", [findRange(paragraphs, "p3", "아버지는 말없이 성적표를 들여다보시더니 수연이의 머리를 살며시 쓰다듬으셨다.")]),
    makeConfirmQ("q7", "수연이가 마음속으로 다짐한 것은 무엇인가요?", [findRange(paragraphs, "p3", "아버지가 비를 맞으며 생선을 파는 그 시간 동안, 자신은 반드시 책상 앞에서 최선을 다하겠다고.")])
  ];
  return { content: assembleFull(310, "LITERATURE", "문학", paragraphs, questions), subArea: "LITERATURE" };
}

// === Day 311 (홀수 → 비문학) ===
function buildDay311() {
  const paragraphs = [
    { id: "p1", text: "빛은 우리가 세상을 인식하는 가장 기본적인 수단이다. 물리학에서 빛은 전자기파의 일종으로, 파동과 입자의 이중적 성질을 가지고 있다. 빛의 속도는 초당 약 삼십만 킬로미터로 자연계에서 가장 빠른 속도이다. 이 속도를 처음 정밀하게 측정한 사람은 덴마크의 천문학자 올레 뢰머로, 그는 목성의 위성 이오의 식 현상을 관찰하여 빛의 속도가 유한하다는 것을 증명했다. 빛은 진공 속에서 직진하지만, 다른 매질을 만나면 굴절되거나 반사된다. 이러한 성질을 이용하여 렌즈, 거울, 프리즘 등 다양한 광학 기기가 만들어졌다." },
    { id: "p2", text: "빛의 굴절은 일상생활에서 쉽게 관찰할 수 있는 현상이다. 물컵에 빨대를 넣으면 빨대가 꺾여 보이는 것이 대표적인 예이다. 이는 빛이 공기에서 물로 들어갈 때 속도가 변하면서 진행 방향이 바뀌기 때문이다. 무지개 역시 빛의 굴절과 관련된 대표적인 현상으로, 태양 빛이 빗방울 속에서 굴절되고 반사되며 분산되어 일곱 가지 색으로 나뉘어 보이는 것이다. 빛의 분산은 백색광이 파장에 따라 서로 다른 각도로 굴절되는 현상을 말한다. 파장이 짧은 보라색 빛은 많이 굴절되고, 파장이 긴 빨간색 빛은 적게 굴절되어 아름다운 색의 띠가 형성된다." },
    { id: "p3", text: "현대 기술에서 빛은 핵심적인 역할을 하고 있다. 광섬유는 빛의 전반사 원리를 이용하여 대량의 정보를 빠르게 전달하는 통신 수단이다. 가느다란 유리 섬유 속에서 빛이 전반사를 반복하며 먼 거리까지 정보를 전송한다. 레이저는 동일한 파장의 빛을 한 방향으로 집중시킨 것으로, 의료 수술, 산업 절단, 광통신 등 다양한 분야에서 활용되고 있다. 최근에는 빛을 이용한 컴퓨팅 기술인 광컴퓨터 연구도 활발하게 진행되고 있다. 전기 신호 대신 빛 신호를 사용하면 처리 속도를 획기적으로 높일 수 있기 때문이다." }
  ];
  console.log(`  Day 311 지문 길이: ${charLen(paragraphs)}자`);
  const questions = [
    makeConfirmQ("q1", "빛의 속도를 처음 정밀하게 측정한 사람은 누구인가요?", [findRange(paragraphs, "p1", "이 속도를 처음 정밀하게 측정한 사람은 덴마크의 천문학자 올레 뢰머로")]),
    makeConfirmQ("q2", "빛이 다른 매질을 만나면 어떤 일이 일어나나요?", [findRange(paragraphs, "p1", "빛은 진공 속에서 직진하지만, 다른 매질을 만나면 굴절되거나 반사된다.")]),
    makeConfirmQ("q3", "물컵에 빨대가 꺾여 보이는 이유는 무엇인가요?", [findRange(paragraphs, "p2", "빛이 공기에서 물로 들어갈 때 속도가 변하면서 진행 방향이 바뀌기 때문이다.")]),
    makeConfirmQ("q4", "무지개가 만들어지는 원리는 무엇인가요?", [findRange(paragraphs, "p2", "태양 빛이 빗방울 속에서 굴절되고 반사되며 분산되어 일곱 가지 색으로 나뉘어 보이는 것이다.")]),
    makeConfirmQ("q5", "파장이 짧은 빛과 긴 빛의 굴절 차이는 무엇인가요?", [findRange(paragraphs, "p2", "파장이 짧은 보라색 빛은 많이 굴절되고, 파장이 긴 빨간색 빛은 적게 굴절되어 아름다운 색의 띠가 형성된다.")]),
    makeConfirmQ("q6", "광섬유의 작동 원리는 무엇인가요?", [findRange(paragraphs, "p3", "가느다란 유리 섬유 속에서 빛이 전반사를 반복하며 먼 거리까지 정보를 전송한다.")]),
    makeConfirmQ("q7", "광컴퓨터가 주목받는 이유는 무엇인가요?", [findRange(paragraphs, "p3", "전기 신호 대신 빛 신호를 사용하면 처리 속도를 획기적으로 높일 수 있기 때문이다.")])
  ];
  return { content: assembleFull(311, "NONFICTION", "비문학", paragraphs, questions), subArea: "NONFICTION" };
}

// === Day 312 (짝수 → 문학) ===
function buildDay312() {
  const paragraphs = [
    { id: "p1", text: "진우는 전학 온 첫날부터 교실 맨 뒷자리에 혼자 앉았다. 낯선 아이들의 호기심 어린 시선이 부담스러웠고, 누군가 말을 걸어올까 봐 일부러 고개를 숙이고 있었다. 전에 다니던 학교에서는 친구가 많았는데, 아버지의 직장 때문에 갑자기 먼 도시로 이사를 오게 된 것이다. 점심시간이 되자 아이들은 삼삼오오 무리를 지어 급식실로 향했지만, 진우는 홀로 교실에 남아 도시락을 꺼냈다. 찬밥에 김치를 올려 먹으며 창밖을 내다보았다. 운동장에서 뛰어노는 아이들의 웃음소리가 유리창 너머로 아련하게 들려왔다." },
    { id: "p2", text: "그렇게 외로운 일주일이 지났을 때, 옆 자리의 소희가 조용히 쪽지를 건넸다. \"혹시 도서관 같이 갈래?\" 진우는 어리둥절했지만, 고개를 끄덕였다. 도서관으로 가는 복도에서 소희는 자신도 작년에 전학 왔다고 말해 주었다. 처음에는 너무 외로워서 매일 울었는데, 도서관에서 책을 읽으며 마음을 달랬다고 했다. 진우는 소희의 말에 깊은 위로를 받았다. 같은 경험을 한 사람이 바로 옆 자리에 있었다는 사실이 놀라우면서도 고마웠다. 도서관에 도착하자 소희는 자신이 가장 좋아하는 창가 자리로 진우를 안내했다." },
    { id: "p3", text: "그날 이후 진우와 소희는 매일 점심시간에 도서관에서 만났다. 각자 좋아하는 책을 읽다가, 재미있는 대목을 발견하면 서로에게 보여 주며 이야기를 나누었다. 한 달이 지나자 진우의 표정이 한결 밝아지기 시작했다. 소희 덕분에 반 아이들과도 자연스럽게 어울리게 되었다. 진우는 깨달았다. 새로운 곳에서의 시작이 반드시 외로운 것만은 아니라는 것을. 누군가의 작은 관심 한 마디가 두려움으로 가득 찬 마음에 용기를 심어 줄 수 있다는 것을 비로소 알게 되었다. 진우는 나중에 또 다른 전학생이 오면 자신이 먼저 따뜻한 쪽지를 건네겠다고 마음먹었다." }
  ];
  console.log(`  Day 312 지문 길이: ${charLen(paragraphs)}자`);
  const questions = [
    makeConfirmQ("q1", "진우가 교실 맨 뒷자리에 혼자 앉은 이유는 무엇인가요?", [findRange(paragraphs, "p1", "낯선 아이들의 호기심 어린 시선이 부담스러웠고, 누군가 말을 걸어올까 봐 일부러 고개를 숙이고 있었다.")]),
    makeConfirmQ("q2", "진우가 전학 오게 된 이유는 무엇인가요?", [findRange(paragraphs, "p1", "아버지의 직장 때문에 갑자기 먼 도시로 이사를 오게 된 것이다.")]),
    makeConfirmQ("q3", "소희가 진우에게 건넨 쪽지에는 무엇이 적혀 있었나요?", [findRange(paragraphs, "p2", "혹시 도서관 같이 갈래?")]),
    makeConfirmQ("q4", "소희는 전학 왔을 때 어떻게 외로움을 달랬나요?", [findRange(paragraphs, "p2", "도서관에서 책을 읽으며 마음을 달랬다고 했다.")]),
    makeConfirmQ("q5", "진우와 소희는 매일 점심시간에 어디에서 만났나요?", [findRange(paragraphs, "p3", "진우와 소희는 매일 점심시간에 도서관에서 만났다.")]),
    makeConfirmQ("q6", "진우가 깨달은 것은 무엇인가요?", [findRange(paragraphs, "p3", "새로운 곳에서의 시작이 반드시 외로운 것만은 아니라는 것을.")]),
    makeConfirmQ("q7", "진우는 나중에 무엇을 하겠다고 마음먹었나요?", [findRange(paragraphs, "p3", "또 다른 전학생이 오면 자신이 먼저 따뜻한 쪽지를 건네겠다고 마음먹었다.")])
  ];
  return { content: assembleFull(312, "LITERATURE", "문학", paragraphs, questions), subArea: "LITERATURE" };
}

// === Day 313 (홀수 → 비문학) ===
function buildDay313() {
  const paragraphs = [
    { id: "p1", text: "지도는 인류가 공간을 이해하고 기록하기 위해 만든 가장 오래된 도구 중 하나이다. 고대 바빌로니아인들은 점토판에 강과 도시의 위치를 새겨 넣었고, 고대 그리스의 에라토스테네스는 지구의 둘레를 계산하여 최초의 과학적 세계 지도를 제작했다. 중세 유럽에서는 종교적 세계관을 반영한 티오 지도가 사용되었는데, 이 지도는 예루살렘을 세계의 중심에 놓고 세 대륙을 티자와 오자 형태로 배치한 것이 특징이다. 동아시아에서는 조선 시대의 김정호가 대동여지도를 제작하여 한반도의 지리 정보를 상세하게 기록했다. 이처럼 지도는 각 시대와 문화의 세계 인식을 반영하는 중요한 문화유산이기도 하다." },
    { id: "p2", text: "근대에 들어 지도 제작 기술은 비약적으로 발전했다. 삼각 측량법의 도입으로 거리와 위치를 정확하게 측정할 수 있게 되었고, 항공 사진 기술이 개발되면서 넓은 지역을 한눈에 파악하는 것이 가능해졌다. 이십 세기 후반에는 인공위성을 이용한 원격 탐사 기술이 등장하여 지구 표면의 변화를 실시간으로 관측할 수 있게 되었다. 위성 항법 시스템은 지구 궤도를 도는 여러 개의 위성에서 보내는 신호를 수신하여 사용자의 위치를 수 미터 이내의 정확도로 알려 준다. 이 기술은 자동차 내비게이션, 스마트폰 지도, 드론 운용 등 일상생활 전반에 활용되고 있다." },
    { id: "p3", text: "디지털 시대의 지도는 단순한 위치 정보를 넘어 다양한 데이터와 결합되고 있다. 지리 정보 시스템은 지도 위에 인구, 교통량, 기후, 토지 이용 현황 등의 정보를 겹쳐 표시하여 복잡한 현상을 시각적으로 분석할 수 있게 해 준다. 재난 발생 시에는 피해 지역을 신속히 파악하고 구조 활동을 계획하는 데 활용되며, 도시 계획에서는 최적의 건물 배치와 도로망을 설계하는 데 사용된다. 지도는 더 이상 종이 위의 그림이 아니라, 살아 움직이는 정보 플랫폼으로 진화하고 있다." }
  ];
  console.log(`  Day 313 지문 길이: ${charLen(paragraphs)}자`);
  const questions = [
    makeConfirmQ("q1", "고대 그리스의 에라토스테네스는 어떤 업적을 남겼나요?", [findRange(paragraphs, "p1", "에라토스테네스는 지구의 둘레를 계산하여 최초의 과학적 세계 지도를 제작했다.")]),
    makeConfirmQ("q2", "중세 유럽의 티오 지도의 특징은 무엇인가요?", [findRange(paragraphs, "p1", "이 지도는 예루살렘을 세계의 중심에 놓고 세 대륙을 티자와 오자 형태로 배치한 것이 특징이다.")]),
    makeConfirmQ("q3", "김정호가 제작한 지도는 무엇인가요?", [findRange(paragraphs, "p1", "조선 시대의 김정호가 대동여지도를 제작하여 한반도의 지리 정보를 상세하게 기록했다.")]),
    makeConfirmQ("q4", "위성 항법 시스템의 작동 원리는 무엇인가요?", [findRange(paragraphs, "p2", "위성 항법 시스템은 지구 궤도를 도는 여러 개의 위성에서 보내는 신호를 수신하여 사용자의 위치를 수 미터 이내의 정확도로 알려 준다.")]),
    makeConfirmQ("q5", "위성 항법 시스템이 활용되는 분야는 무엇인가요?", [findRange(paragraphs, "p2", "자동차 내비게이션, 스마트폰 지도, 드론 운용 등 일상생활 전반에 활용되고 있다.")]),
    makeConfirmQ("q6", "지리 정보 시스템은 어떤 역할을 하나요?", [findRange(paragraphs, "p3", "지리 정보 시스템은 지도 위에 인구, 교통량, 기후, 토지 이용 현황 등의 정보를 겹쳐 표시하여 복잡한 현상을 시각적으로 분석할 수 있게 해 준다.")])
  ];
  return { content: assembleFull(313, "NONFICTION", "비문학", paragraphs, questions), subArea: "NONFICTION" };
}

// === 실행부 ===
const results = [
  { dayIndex: 309, ...buildDay309() }, { dayIndex: 310, ...buildDay310() },
  { dayIndex: 311, ...buildDay311() }, { dayIndex: 312, ...buildDay312() },
  { dayIndex: 313, ...buildDay313() }
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
fs.writeFileSync(path.join(newDir, 'batch-f2-309-313.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log('  ✅ generated/new/batch-f2-309-313.json');

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
