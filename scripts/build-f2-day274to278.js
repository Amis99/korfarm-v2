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

// === Day 274 (짝수 → 문학) ===
function buildDay274() {
  const paragraphs = [
    { id: "p1", text: "할머니의 손은 거칠었다. 논밭에서 평생을 보낸 그 손에는 굳은살과 주름이 깊게 파여 있었고, 손톱 사이에는 흙이 끼어 있는 날이 많았다. 어린 시절 나는 그 손이 부끄러웠다. 친구들의 어머니는 하얗고 부드러운 손을 가졌는데, 할머니의 손은 마치 오래된 나무껍질 같았다. 학교 참관일에 할머니가 오시면 나는 슬며시 자리를 비켰다. 할머니는 그런 나를 보면서도 아무 말씀 없이 웃기만 하셨다." },
    { id: "p2", text: "중학교에 올라가자 할머니와의 거리는 더 벌어졌다. 도시로 전학을 간 나는 주말에도 할머니 댁에 가지 않았고, 전화도 뜸해졌다. 할머니는 가끔 택배로 깻잎이나 고구마를 보내셨는데, 나는 그것을 당연하게 받으면서도 감사하다는 말을 한 번도 하지 않았다. 어느 여름, 할머니가 쓰러지셨다는 소식을 들었을 때에야 나는 비로소 시골집으로 달려갔다. 병원 침대에 누운 할머니의 손을 잡았을 때, 그 손이 예전보다 훨씬 가늘고 약해져 있다는 사실에 가슴이 먹먹해졌다." },
    { id: "p3", text: "할머니는 퇴원 후에도 예전처럼 밭에 나가셨다. 아버지가 아무리 쉬라고 해도 할머니는 고집을 부리셨다. 흙을 만지지 않으면 오히려 몸이 아프다고 하셨다. 나는 그해 여름방학을 할머니 곁에서 보내기로 했다. 이른 새벽에 할머니를 따라 밭에 나가 고추를 따고 김을 매면서, 그 거친 손이 얼마나 많은 것을 일구어 왔는지를 조금씩 이해하게 되었다. 할머니의 손은 부끄러운 것이 아니라 자랑스러운 것이었다." },
    { id: "p4", text: "지금 나는 대학생이 되어 도시에서 살고 있다. 할머니는 여전히 시골에서 밭을 가꾸신다. 나는 이제 매주 할머니께 전화를 드리고, 방학마다 시골집을 찾는다. 할머니의 손을 잡을 때면 그 거칠고 따뜻한 감촉이 나에게 말한다. 사랑은 화려한 말이 아니라 묵묵한 손길 속에 담기는 것이라고. 나는 언젠가 할머니의 밭을 이어받아 흙을 만지며 살고 싶다는 생각을 하게 되었다." }
  ];
  console.log(`Day 274 글자 수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("q1", "어린 시절 화자가 할머니의 손에 대해 느낀 감정은 무엇이었나요?", [findRange(paragraphs, "p1", "어린 시절 나는 그 손이 부끄러웠다")]),
    makeConfirmQ("q2", "할머니의 손을 무엇에 비유하고 있나요?", [findRange(paragraphs, "p1", "할머니의 손은 마치 오래된 나무껍질 같았다")]),
    makeConfirmQ("q3", "화자가 시골집으로 달려간 계기는 무엇인가요?", [findRange(paragraphs, "p2", "할머니가 쓰러지셨다는 소식을 들었을 때에야 나는 비로소 시골집으로 달려갔다")]),
    makeConfirmQ("q4", "할머니가 퇴원 후에도 밭에 나간 이유는 무엇인가요?", [findRange(paragraphs, "p3", "흙을 만지지 않으면 오히려 몸이 아프다고 하셨다")]),
    makeConfirmQ("q5", "화자가 할머니의 손에 대해 최종적으로 내린 평가는 무엇인가요?", [findRange(paragraphs, "p3", "할머니의 손은 부끄러운 것이 아니라 자랑스러운 것이었다")]),
    makeConfirmQ("q6", "화자가 사랑에 대해 깨달은 내용은 무엇인가요?", [findRange(paragraphs, "p4", "사랑은 화려한 말이 아니라 묵묵한 손길 속에 담기는 것이라고")])
  ];
  return { content: assembleFull(274, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 275 (홀수 → 비문학) ===
function buildDay275() {
  const paragraphs = [
    { id: "p1", text: "인공위성은 지구의 중력에 의해 궤도를 따라 지구 주위를 도는 인공 물체이다. 1957년 소련이 발사한 스푸트니크 1호가 최초의 인공위성으로, 이후 수천 개의 인공위성이 발사되어 통신, 기상 관측, 항법, 과학 연구 등 다양한 목적에 활용되고 있다. 인공위성은 궤도의 높이에 따라 저궤도, 중궤도, 정지 궤도 위성으로 구분된다. 저궤도 위성은 지표면에서 약 200~2,000킬로미터 상공에서 빠르게 지구를 돌며, 정지 궤도 위성은 약 35,786킬로미터 상공에서 지구의 자전 속도와 같은 속도로 공전하여 지상에서 보면 항상 같은 위치에 머무는 것처럼 보인다." },
    { id: "p2", text: "인공위성이 궤도를 유지하는 원리는 뉴턴의 운동 법칙으로 설명할 수 있다. 위성이 지구 주위를 돌 때, 지구의 중력이 구심력으로 작용하여 위성을 궤도에 묶어 둔다. 만약 위성의 속도가 너무 느리면 중력에 의해 지표면으로 떨어지고, 너무 빠르면 지구의 중력을 벗어나 우주 공간으로 날아가 버린다. 따라서 위성이 특정 궤도를 안정적으로 유지하려면 해당 고도에 맞는 정확한 속도로 비행해야 한다. 저궤도 위성의 경우 초속 약 7.8킬로미터의 속도가 필요하며, 이는 시속 약 28,000킬로미터에 해당한다." },
    { id: "p3", text: "현재 지구 궤도에는 가동 중인 위성 외에도 수명이 다한 위성, 로켓 잔해, 충돌 파편 등 이른바 우주 쓰레기가 대량으로 떠돌고 있다. 미국 우주감시네트워크가 추적하는 10센티미터 이상의 우주 파편만 약 3만 개이며, 1센티미터 이하의 미세 파편까지 포함하면 수억 개에 이를 것으로 추정된다. 이러한 우주 쓰레기는 초속 7~8킬로미터로 이동하기 때문에 작은 파편이라도 위성이나 국제 우주 정거장에 심각한 손상을 입힐 수 있다. 우주 쓰레기 문제를 해결하기 위해 그물이나 작살로 파편을 수거하는 기술, 레이저로 궤도를 변경하는 기술 등이 연구되고 있다." }
  ];
  console.log(`Day 275 글자 수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("q1", "최초의 인공위성 이름과 발사 국가는 무엇인가요?", [findRange(paragraphs, "p1", "소련이 발사한 스푸트니크 1호가 최초의 인공위성")]),
    makeConfirmQ("q2", "정지 궤도 위성이 항상 같은 위치에 머무는 것처럼 보이는 이유는 무엇인가요?", [findRange(paragraphs, "p1", "지구의 자전 속도와 같은 속도로 공전하여 지상에서 보면 항상 같은 위치에 머무는 것처럼 보인다")]),
    makeConfirmQ("q3", "인공위성이 궤도를 유지하는 데 구심력 역할을 하는 것은 무엇인가요?", [findRange(paragraphs, "p2", "지구의 중력이 구심력으로 작용하여 위성을 궤도에 묶어 둔다")]),
    makeConfirmQ("q4", "저궤도 위성이 궤도를 유지하려면 어느 정도의 속도가 필요한가요?", [findRange(paragraphs, "p2", "초속 약 7.8킬로미터의 속도가 필요하며, 이는 시속 약 28,000킬로미터에 해당한다")]),
    makeConfirmQ("q5", "10센티미터 이상의 추적 가능한 우주 파편은 약 몇 개인가요?", [findRange(paragraphs, "p3", "10센티미터 이상의 우주 파편만 약 3만 개")]),
    makeConfirmQ("q6", "작은 우주 쓰레기도 위험한 이유는 무엇인가요?", [findRange(paragraphs, "p3", "초속 7~8킬로미터로 이동하기 때문에 작은 파편이라도 위성이나 국제 우주 정거장에 심각한 손상을 입힐 수 있다")]),
    makeConfirmQ("q7", "우주 쓰레기를 수거하기 위해 연구되는 기술에는 어떤 것이 있나요?", [findRange(paragraphs, "p3", "그물이나 작살로 파편을 수거하는 기술, 레이저로 궤도를 변경하는 기술 등이 연구되고 있다")])
  ];
  return { content: assembleFull(275, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 276 (짝수 → 문학) ===
function buildDay276() {
  const paragraphs = [
    { id: "p1", text: "마을 뒷산에는 오래된 느티나무 한 그루가 서 있었다. 마을 사람들은 그 나무의 나이를 정확히 아는 이가 없었지만, 할아버지의 할아버지 때부터 거기 있었다고 전해졌다. 나무의 줄기는 어른 세 명이 팔을 벌려야 겨우 감쌀 수 있을 만큼 굵었고, 여름이면 넓은 그늘을 드리워 마을의 쉼터가 되었다. 아이들은 느티나무 아래에서 놀았고, 어른들은 그늘에 모여 앉아 막걸리를 나누며 이야기꽃을 피웠다. 그 나무는 마을의 역사 그 자체였다." },
    { id: "p2", text: "그런데 어느 해 봄, 마을에 도로 확장 공사 계획이 발표되었다. 새 도로가 놓이는 자리에 느티나무가 걸린다는 것이었다. 군청에서 나온 공무원은 나무를 이식하겠다고 했지만, 수백 년 된 나무를 옮기면 살아남기 어렵다는 것을 마을 사람들은 잘 알고 있었다. 반대 목소리가 거세지자 군청은 주민 설명회를 열었고, 개발의 필요성과 보상금을 내세웠다. 젊은 사람들 중에는 도로가 생기면 마을이 발전할 것이라며 찬성하는 이도 있었다. 마을은 두 편으로 갈라졌다." },
    { id: "p3", text: "나무를 지키겠다고 나선 사람은 올해 일흔이 된 강 노인이었다. 그는 매일 아침 느티나무 아래에 앉아 1인 시위를 했다. 비가 오나 눈이 오나 자리를 지켰고, 그 모습이 지역 신문에 실리면서 외부의 관심이 모이기 시작했다. 환경 단체가 현장을 방문했고, 전문가들은 나무의 수령이 최소 400년 이상이라는 감정 결과를 발표했다. 여론이 나무 보존 쪽으로 기울자 군청은 도로 노선을 변경하여 나무를 우회하는 방안을 검토하기 시작했다." },
    { id: "p4", text: "결국 도로는 느티나무를 비켜 가는 것으로 확정되었다. 공사비가 추가로 들었지만, 마을 사람들은 기꺼이 그 부담을 받아들였다. 도로가 완공된 후 느티나무 주변은 작은 공원으로 조성되었고, 나무 아래에는 강 노인의 이야기를 새긴 표지판이 세워졌다. 나무는 예전처럼 넓은 그늘을 드리우며 마을을 지켰고, 이제는 외지에서 일부러 찾아오는 사람들도 생겨나면서 마을은 오히려 더 활기를 띠게 되었다." }
  ];
  console.log(`Day 276 글자 수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("q1", "느티나무의 줄기 굵기는 어떻게 묘사되고 있나요?", [findRange(paragraphs, "p1", "어른 세 명이 팔을 벌려야 겨우 감쌀 수 있을 만큼 굵었고")]),
    makeConfirmQ("q2", "느티나무가 위기에 처한 직접적인 원인은 무엇인가요?", [findRange(paragraphs, "p2", "도로 확장 공사 계획이 발표되었다")]),
    makeConfirmQ("q3", "마을이 두 편으로 갈라진 이유는 무엇인가요?", [findRange(paragraphs, "p2", "젊은 사람들 중에는 도로가 생기면 마을이 발전할 것이라며 찬성하는 이도 있었다")]),
    makeConfirmQ("q4", "강 노인이 나무를 지키기 위해 한 행동은 무엇인가요?", [findRange(paragraphs, "p3", "매일 아침 느티나무 아래에 앉아 1인 시위를 했다")]),
    makeConfirmQ("q5", "전문가 감정 결과 나무의 수령은 어느 정도로 밝혀졌나요?", [findRange(paragraphs, "p3", "나무의 수령이 최소 400년 이상이라는 감정 결과를 발표했다")]),
    makeConfirmQ("q6", "도로 노선은 최종적으로 어떻게 결정되었나요?", [findRange(paragraphs, "p4", "도로는 느티나무를 비켜 가는 것으로 확정되었다")])
  ];
  return { content: assembleFull(276, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 277 (홀수 → 비문학) ===
function buildDay277() {
  const paragraphs = [
    { id: "p1", text: "발효는 미생물이 유기물을 분해하여 에너지를 얻는 과정으로, 인류는 수천 년 전부터 이를 식품 보존과 맛 향상에 활용해 왔다. 고대 메소포타미아에서는 기원전 6000년경에 이미 맥주를 빚었다는 기록이 남아 있으며, 한국의 김치, 된장, 간장, 일본의 미소와 나토, 유럽의 치즈와 요구르트 등 세계 각지의 전통 발효 식품은 각 문화권의 기후와 식재료에 맞게 발전해 온 지혜의 산물이다. 발효 과정에서 미생물은 단백질을 아미노산으로, 전분을 당으로 분해하여 소화 흡수율을 높이고, 특유의 풍미를 만들어 낸다." },
    { id: "p2", text: "발효에 관여하는 미생물은 크게 세균, 효모, 곰팡이의 세 종류로 나눌 수 있다. 세균 중에서는 젖산균이 대표적인데, 젖산균은 당을 분해하여 젖산을 생성함으로써 식품의 산도를 높이고 유해균의 번식을 억제한다. 김치가 오랫동안 상하지 않는 이유도 젖산균의 이러한 작용 덕분이다. 효모는 당을 분해하여 알코올과 이산화탄소를 생산하며, 이 원리가 빵과 술의 제조에 이용된다. 곰팡이는 메주에서 된장이 만들어지는 과정에서 핵심적인 역할을 하며, 단백질 분해 효소를 분비하여 콩의 단백질을 아미노산으로 전환한다." },
    { id: "p3", text: "현대 과학은 발효 식품이 건강에 미치는 긍정적 효과를 속속 밝혀내고 있다. 발효 과정에서 생성되는 프로바이오틱스는 장내 유익균의 증식을 도와 소화 기능을 개선하고 면역력을 강화하는 것으로 알려져 있다. 또한 발효를 통해 비타민 B군과 비타민 K 등의 영양소가 새롭게 합성되기도 한다. 최근 연구에서는 장내 미생물 생태계가 뇌 건강과 정서에도 영향을 준다는 이른바 장-뇌 축 이론이 주목받고 있으며, 발효 식품의 꾸준한 섭취가 우울증과 불안 증상의 완화에 도움이 될 수 있다는 임상 결과도 보고되고 있다. 이처럼 발효는 단순한 식품 가공 기술을 넘어 인간의 건강과 문화를 풍요롭게 하는 소중한 유산이라 할 수 있다." }
  ];
  console.log(`Day 277 글자 수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("q1", "발효란 어떤 과정인가요?", [findRange(paragraphs, "p1", "미생물이 유기물을 분해하여 에너지를 얻는 과정")]),
    makeConfirmQ("q2", "발효 과정에서 미생물이 단백질과 전분을 각각 무엇으로 분해하나요?", [findRange(paragraphs, "p1", "단백질을 아미노산으로, 전분을 당으로 분해하여 소화 흡수율을 높이고")]),
    makeConfirmQ("q3", "젖산균이 유해균의 번식을 억제하는 원리는 무엇인가요?", [findRange(paragraphs, "p2", "당을 분해하여 젖산을 생성함으로써 식품의 산도를 높이고 유해균의 번식을 억제한다")]),
    makeConfirmQ("q4", "효모가 당을 분해하면 어떤 물질이 생산되나요?", [findRange(paragraphs, "p2", "효모는 당을 분해하여 알코올과 이산화탄소를 생산하며")]),
    makeConfirmQ("q5", "곰팡이가 된장 제조에서 하는 역할은 무엇인가요?", [findRange(paragraphs, "p2", "단백질 분해 효소를 분비하여 콩의 단백질을 아미노산으로 전환한다")]),
    makeConfirmQ("q6", "프로바이오틱스가 건강에 미치는 효과는 무엇인가요?", [findRange(paragraphs, "p3", "장내 유익균의 증식을 도와 소화 기능을 개선하고 면역력을 강화하는 것으로 알려져 있다")]),
    makeConfirmQ("q7", "장-뇌 축 이론과 관련하여 발효 식품이 도움이 될 수 있는 증상은 무엇인가요?", [findRange(paragraphs, "p3", "우울증과 불안 증상의 완화에 도움이 될 수 있다는 임상 결과도 보고되고 있다")])
  ];
  return { content: assembleFull(277, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 278 (짝수 → 문학) ===
function buildDay278() {
  const paragraphs = [
    { id: "p1", text: "소년은 매일 학교가 끝나면 동네 도서관에 갔다. 집에 돌아가면 좁은 단칸방에서 동생 둘이 텔레비전 앞에 붙어 있었고, 부엌에서는 어머니가 내일 팔 김밥을 만들고 계셨다. 소년에게는 조용히 책을 읽을 공간이 필요했고, 도서관만이 유일한 안식처였다. 사서 선생님은 늘 늦게까지 남아 있는 소년을 신경 써 주셨다. 가끔 따뜻한 코코아를 건네기도 했고, 소년의 수준에 맞는 책을 골라 추천해 주시기도 했다." },
    { id: "p2", text: "소년이 특히 좋아한 것은 과학 도감이었다. 우주의 별과 행성, 바다 밑 심해의 생물, 인체의 신비로운 구조를 보여 주는 그림과 사진에 소년은 시간 가는 줄 몰랐다. 세상에는 자기가 모르는 것이 이렇게 많다는 사실이 소년을 흥분시켰다. 언젠가 자기도 저 우주로 나가 보겠다는 꿈이 어렴풋이 싹텄다. 그러나 현실은 녹록지 않았다. 학원 한 번 다닌 적 없는 소년의 성적은 중위권을 맴돌았고, 담임 선생님은 꿈은 좋지만 현실적인 목표를 세우라고 조언했다." },
    { id: "p3", text: "고등학교에 진학한 소년은 도서관에서 독학으로 수학과 과학을 공부하기 시작했다. 모르는 문제가 나오면 인터넷 강의를 찾아보고, 그래도 이해가 안 되면 메모해 두었다가 과학 선생님께 질문했다. 선생님은 소년의 끈기에 감탄하며 방과 후에 따로 시간을 내어 가르쳐 주셨다. 소년의 성적은 조금씩 올랐고, 2학년이 되자 전교 상위권에 이름을 올렸다. 친구들은 갑자기 성적이 오른 소년을 신기하게 바라보았지만, 소년은 묵묵히 자기 길을 걸었다." },
    { id: "p4", text: "대학 입시를 앞둔 겨울, 소년은 항공우주공학과에 지원서를 냈다. 합격 통보를 받은 날, 소년은 가장 먼저 동네 도서관으로 달려갔다. 사서 선생님은 이미 은퇴하셨지만, 소년은 그 자리에 서서 오래도록 서가를 바라보았다. 이곳에서 읽은 과학 도감의 한 페이지 한 페이지가 자기를 여기까지 이끌어 주었다고 생각했다. 소년은 작은 메모지에 감사의 말을 적어 사서 선생님의 옛 자리 위에 놓아두고 도서관을 나섰다." }
  ];
  console.log(`Day 278 글자 수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("q1", "소년이 도서관을 유일한 안식처로 삼은 이유는 무엇인가요?", [findRange(paragraphs, "p1", "소년에게는 조용히 책을 읽을 공간이 필요했고, 도서관만이 유일한 안식처였다")]),
    makeConfirmQ("q2", "사서 선생님이 소년에게 해준 일은 무엇인가요?", [findRange(paragraphs, "p1", "따뜻한 코코아를 건네기도 했고, 소년의 수준에 맞는 책을 골라 추천해 주시기도 했다")]),
    makeConfirmQ("q3", "소년이 특히 좋아한 책의 종류는 무엇인가요?", [findRange(paragraphs, "p2", "소년이 특히 좋아한 것은 과학 도감이었다")]),
    makeConfirmQ("q4", "담임 선생님이 소년에게 한 조언은 무엇인가요?", [findRange(paragraphs, "p2", "꿈은 좋지만 현실적인 목표를 세우라고 조언했다")]),
    makeConfirmQ("q5", "소년이 독학으로 모르는 문제를 해결한 방법은 무엇인가요?", [findRange(paragraphs, "p3", "인터넷 강의를 찾아보고, 그래도 이해가 안 되면 메모해 두었다가 과학 선생님께 질문했다")]),
    makeConfirmQ("q6", "합격 통보를 받은 날 소년이 가장 먼저 간 곳은 어디인가요?", [findRange(paragraphs, "p4", "소년은 가장 먼저 동네 도서관으로 달려갔다")]),
    makeConfirmQ("q7", "소년이 도서관을 나서기 전에 마지막으로 한 행동은 무엇인가요?", [findRange(paragraphs, "p4", "작은 메모지에 감사의 말을 적어 사서 선생님의 옛 자리 위에 놓아두고 도서관을 나섰다")])
  ];
  return { content: assembleFull(278, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === 실행부 ===
const results = [
  { dayIndex: 274, ...buildDay274() }, { dayIndex: 275, ...buildDay275() },
  { dayIndex: 276, ...buildDay276() }, { dayIndex: 277, ...buildDay277() },
  { dayIndex: 278, ...buildDay278() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
if (!fs.existsSync(staticDir)) fs.mkdirSync(staticDir, { recursive: true });

const batchDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(batchDir)) fs.mkdirSync(batchDir, { recursive: true });

const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});
fs.writeFileSync(path.join(batchDir, 'batch-f2-274-278.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ batch-f2-274-278.json 생성 완료`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
