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
    const s = i * chunkSize;
    const e = Math.min(s + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(s, e) });
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

// -- Day 269 (홀수 -> 비문학) --
function buildDay269() {
  const paragraphs = [
    { id: "p1", text: "소리는 물체의 진동이 공기와 같은 매질을 통해 전달되는 파동 현상이다. 진동하는 물체가 주변 공기를 밀고 당기면서 만들어 내는 압력의 변화가 귓속 고막을 떨리게 하여 뇌에서 소리로 인식된다. 소리의 주요 성질은 높낮이, 크기, 음색인데, 높낮이는 진동수에 의해 결정되고 크기는 진폭에, 음색은 파형의 복잡성에 의해 결정된다." },
    { id: "p2", text: "소리의 높낮이를 결정하는 진동수는 1초 동안 매질이 진동하는 횟수로, 단위는 헤르츠이다. 사람이 들을 수 있는 범위는 약 20헤르츠에서 2만 헤르츠 사이이며, 이보다 낮은 소리를 초저주파, 높은 소리를 초음파라고 부른다. 피아노 건반의 가운데 '도'는 약 262헤르츠이고 한 옥타브 위의 '도'는 두 배인 524헤르츠이다. 악기마다 같은 높이의 음을 내더라도 서로 다르게 들리는 것은 기본 진동수 위에 겹쳐지는 배음의 구성이 다르기 때문이다." },
    { id: "p3", text: "소리의 크기는 데시벨이라는 단위로 측정한다. 조용한 도서관은 약 30데시벨, 일상 대화는 약 60데시벨, 자동차 경적은 약 110데시벨이다. 데시벨은 로그 척도를 사용하므로 수치가 10 올라갈 때마다 실제 음압은 약 세 배로 커진다. 85데시벨 이상의 소음에 장시간 노출되면 청력 손상이 발생할 수 있으며, 120데시벨 이상은 순간적으로도 내이의 유모 세포를 손상시킬 수 있다." },
    { id: "p4", text: "현대 사회에서 소음 공해는 건강을 위협하는 심각한 환경 문제로 대두되고 있다. 지속적인 소음 노출은 청력 손실뿐 아니라 수면 장애, 집중력 저하, 심혈관 질환의 위험을 높이는 것으로 밝혀졌다. 이에 따라 도로와 공항 주변에 방음벽을 설치하고 건축물의 차음 기준을 강화하는 정책이 시행되고 있다. 능동형 소음 제거 기술은 소음과 반대 위상의 소리를 발생시켜 원래 소음을 상쇄하는 방식으로 이어폰 등에 적용되고 있다." }
  ];
  console.log(`Day 269 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '진동하는 물체가 주변 공기를 밀고 당기면서 만들어 내는 압력의 변화'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "진동하는 물체가 주변 공기를 밀고 당기면서 만들어 내는 압력의 변화")]),
    makeConfirmQ("q2", "지문에서 '높낮이는 진동수에 의해 결정되고 크기는 진폭에, 음색은 파형의 복잡성에 의해 결정된다'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "높낮이는 진동수에 의해 결정되고 크기는 진폭에, 음색은 파형의 복잡성에 의해 결정된다")]),
    makeConfirmQ("q3", "지문에서 '이보다 낮은 소리를 초저주파, 높은 소리를 초음파라고 부른다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "이보다 낮은 소리를 초저주파, 높은 소리를 초음파라고 부른다")]),
    makeConfirmQ("q4", "지문에서 '기본 진동수 위에 겹쳐지는 배음의 구성이 다르기 때문이다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "기본 진동수 위에 겹쳐지는 배음의 구성이 다르기 때문이다")]),
    makeConfirmQ("q5", "지문에서 '데시벨은 로그 척도를 사용하므로 수치가 10 올라갈 때마다 실제 음압은 약 세 배로 커진다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "데시벨은 로그 척도를 사용하므로 수치가 10 올라갈 때마다 실제 음압은 약 세 배로 커진다")]),
    makeConfirmQ("q6", "지문에서 '수면 장애, 집중력 저하, 심혈관 질환의 위험을 높이는 것으로 밝혀졌다'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "수면 장애, 집중력 저하, 심혈관 질환의 위험을 높이는 것으로 밝혀졌다")]),
    makeConfirmQ("q7", "지문에서 '소음과 반대 위상의 소리를 발생시켜 원래 소음을 상쇄하는 방식'을 찾아 클릭하세요.", [findRange(paragraphs, "p4", "소음과 반대 위상의 소리를 발생시켜 원래 소음을 상쇄하는 방식")])
  ];
  return { content: assembleFull(269, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// -- Day 270 (짝수 -> 문학) --
function buildDay270() {
  const paragraphs = [
    { id: "p1", text: "서연이는 여름방학 첫날부터 할머니 댁에 내려갔다. 시골 마을은 논과 밭이 끝없이 펼쳐져 있었고, 집 앞 감나무에는 덜 익은 초록 감이 주렁주렁 달려 있었다. 할머니는 서연이를 보자마자 활짝 웃으며 손을 잡았고, 부엌에서는 감자전 냄새가 풍겨 나왔다. 서연이는 도시에서는 느낄 수 없는 흙냄새와 풀벌레 소리가 반가우면서도 스마트폰이 잘 터지지 않는다는 사실에 살짝 불안해졌다." },
    { id: "p2", text: "다음 날 아침, 할머니는 서연이를 데리고 뒷산 계곡으로 올라갔다. 좁은 산길 양쪽으로 참나무와 소나무가 빽빽하게 들어서 있었고 발밑에서는 마른 솔잎이 바스락거렸다. 계곡에 도착하자 맑은 물이 바위 사이로 졸졸 흘러내렸다. 서연이가 발을 담그자 차가운 물이 발목을 감싸며 도시의 더위를 단숨에 씻어 주었다. 할머니는 바위에 걸터앉아 어린 시절 이 계곡에서 미역을 감던 이야기를 들려주셨고, 서연이는 그 모습을 상상하며 웃었다." },
    { id: "p3", text: "일주일이 지나자 서연이는 마을 아이들과 친해졌다. 낮에는 함께 올챙이를 잡고 뜰에서 배드민턴을 치며 놀았고, 저녁에는 마당에 돗자리를 깔고 누워 별을 세었다. 도시에서는 보이지 않던 은하수가 시골 밤하늘에는 선명하게 걸쳐 있었다. 할머니가 가리키는 대로 북두칠성을 찾아내었을 때 가슴이 벅찬 기분이 들었다. 스마트폰 없이 보내는 시간이 처음에는 지루할 것 같았지만, 어느 순간 화면보다 훨씬 넓은 세상이 눈앞에 펼쳐져 있다는 것을 깨달았다." },
    { id: "p4", text: "방학이 끝나 서울로 돌아가는 날, 서연이는 할머니 손을 꼭 잡고 울먹였다. 할머니는 잘 말린 감을 봉지에 담아 쥐여 주시며 '다음 방학에도 꼭 오너라'라고 말씀하셨다. 버스에 올라 창밖을 바라보자 들판 위로 석양이 물들고 있었고, 감나무 열매는 초록에서 살짝 노란빛으로 변해 있었다. 서연이는 돌아가면 친구들에게 별 이야기를 들려주어야겠다고 생각하며 감 봉지를 품에 안았다." }
  ];
  console.log(`Day 270 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '도시에서는 느낄 수 없는 흙냄새와 풀벌레 소리가 반가우면서도'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "도시에서는 느낄 수 없는 흙냄새와 풀벌레 소리가 반가우면서도")]),
    makeConfirmQ("q2", "지문에서 '차가운 물이 발목을 감싸며 도시의 더위를 단숨에 씻어 주었다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "차가운 물이 발목을 감싸며 도시의 더위를 단숨에 씻어 주었다")]),
    makeConfirmQ("q3", "지문에서 '할머니는 바위에 걸터앉아 어린 시절 이 계곡에서 미역을 감던 이야기를 들려주셨고'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "할머니는 바위에 걸터앉아 어린 시절 이 계곡에서 미역을 감던 이야기를 들려주셨고")]),
    makeConfirmQ("q4", "지문에서 '도시에서는 보이지 않던 은하수가 시골 밤하늘에는 선명하게 걸쳐 있었다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "도시에서는 보이지 않던 은하수가 시골 밤하늘에는 선명하게 걸쳐 있었다")]),
    makeConfirmQ("q5", "지문에서 '화면보다 훨씬 넓은 세상이 눈앞에 펼쳐져 있다는 것을 깨달았다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "화면보다 훨씬 넓은 세상이 눈앞에 펼쳐져 있다는 것을 깨달았다")]),
    makeConfirmQ("q6", "지문에서 '잘 말린 감을 봉지에 담아 쥐여 주시며'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "잘 말린 감을 봉지에 담아 쥐여 주시며")]),
    makeConfirmQ("q7", "지문에서 '돌아가면 친구들에게 별 이야기를 들려주어야겠다고 생각하며'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "돌아가면 친구들에게 별 이야기를 들려주어야겠다고 생각하며")])
  ];
  return { content: assembleFull(270, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// -- Day 271 (홀수 -> 비문학) --
function buildDay271() {
  const paragraphs = [
    { id: "p1", text: "화폐는 물건을 사고팔 때 교환의 매개 수단으로 사용되는 것으로, 인류 역사에서 오랜 시간에 걸쳐 발전해 왔다. 화폐가 등장하기 전에는 물물 교환이 이루어졌지만, 내가 원하는 물건을 가진 사람이 반드시 내 물건을 원하지는 않는다는 문제가 있었다. 이를 해소하기 위해 누구나 가치를 인정하는 특정 물품을 교환의 기준으로 삼기 시작했으며, 이것이 물품 화폐의 시작이었다." },
    { id: "p2", text: "초기 물품 화폐로는 소금, 조개껍데기, 가축 등이 사용되었다. 고대 중국에서는 조개껍데기가 화폐로 쓰여 돈과 관련된 한자에 조개 패 자가 들어가는 경우가 많다. 이후 금, 은, 구리 같은 금속 화폐가 등장하였는데, 금속은 쉽게 변질되지 않고 일정한 크기와 무게로 나눌 수 있어 교환 수단으로 적합했다. 기원전 7세기경 리디아 왕국에서는 일정한 무게의 금속에 왕실 문양을 찍어 가치를 보증하는 주화가 처음 만들어졌으며, 이것이 오늘날 동전의 원형이 되었다." },
    { id: "p3", text: "종이 화폐는 중국 송나라 시대에 처음 등장하였다. 무거운 금속 화폐를 운반하기 어렵다는 점을 해결하기 위해 상인들이 금속 화폐를 맡기고 증서를 주고받았는데, 이 증서가 화폐처럼 유통되기 시작한 것이다. 유럽에서는 17세기 스웨덴에서 최초의 지폐가 발행되었으며, 이후 중앙은행이 설립되면서 국가가 가치를 보증하는 법정 화폐 제도가 확립되었다. 오늘날 지폐에는 위조를 방지하기 위한 특수 잉크, 은선, 홀로그램 등 보안 기술이 적용되어 있다." },
    { id: "p4", text: "최근에는 신용 카드와 모바일 결제 확산으로 물리적 화폐의 사용이 줄고 있다. 스웨덴이나 중국에서는 현금 없이 생활하는 것이 일상이 되어 가고 있으며, 디지털 화폐에 대한 관심도 높아지고 있다. 각국 중앙은행은 디지털 화폐를 연구하고 있는데, 이는 국가가 발행하고 가치를 보증하는 전자적 형태의 법정 화폐이다. 화폐의 형태는 조개껍데기에서 디지털 코드로 변해 왔지만, 사회적 신뢰를 바탕으로 교환을 매개한다는 본질적 기능은 변하지 않고 있다." }
  ];
  console.log(`Day 271 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '내가 원하는 물건을 가진 사람이 반드시 내 물건을 원하지는 않는다는 문제가 있었다'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "내가 원하는 물건을 가진 사람이 반드시 내 물건을 원하지는 않는다는 문제가 있었다")]),
    makeConfirmQ("q2", "지문에서 '누구나 가치를 인정하는 특정 물품을 교환의 기준으로 삼기 시작했으며'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "누구나 가치를 인정하는 특정 물품을 교환의 기준으로 삼기 시작했으며")]),
    makeConfirmQ("q3", "지문에서 '금속은 쉽게 변질되지 않고 일정한 크기와 무게로 나눌 수 있어 교환 수단으로 적합했다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "금속은 쉽게 변질되지 않고 일정한 크기와 무게로 나눌 수 있어 교환 수단으로 적합했다")]),
    makeConfirmQ("q4", "지문에서 '일정한 무게의 금속에 왕실 문양을 찍어 가치를 보증하는 주화가 처음 만들어졌으며'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "일정한 무게의 금속에 왕실 문양을 찍어 가치를 보증하는 주화가 처음 만들어졌으며")]),
    makeConfirmQ("q5", "지문에서 '무거운 금속 화폐를 운반하기 어렵다는 점을 해결하기 위해'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "무거운 금속 화폐를 운반하기 어렵다는 점을 해결하기 위해")]),
    makeConfirmQ("q6", "지문에서 '위조를 방지하기 위한 특수 잉크, 은선, 홀로그램 등 보안 기술이 적용되어 있다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "위조를 방지하기 위한 특수 잉크, 은선, 홀로그램 등 보안 기술이 적용되어 있다")]),
    makeConfirmQ("q7", "지문에서 '사회적 신뢰를 바탕으로 교환을 매개한다는 본질적 기능은 변하지 않고 있다'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "사회적 신뢰를 바탕으로 교환을 매개한다는 본질적 기능은 변하지 않고 있다")])
  ];
  return { content: assembleFull(271, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// -- Day 272 (짝수 -> 문학) --
function buildDay272() {
  const paragraphs = [
    { id: "p1", text: "지훈이는 학교 축제에서 연극반의 주인공을 맡게 되었다. 평소 말수가 적고 낯을 가리는 성격이라 친구들은 놀랐지만, 담임 선생님은 지훈이의 조용한 눈빛 속에 깊은 감정을 표현할 수 있는 힘이 있다며 추천하셨다. 지훈이는 무대에 서는 것이 두려웠지만 선생님의 기대를 저버릴 수 없어 어렵게 승낙했다. 대본을 처음 받아 든 날 밤, 이불 속에서 대사를 중얼거리다 잠이 들었다." },
    { id: "p2", text: "연습이 시작되자 지훈이의 목소리는 강당 뒤편까지 닿지 못했다. 연출을 맡은 수빈이는 '관객석 맨 뒷줄에 앉은 사람에게 이야기한다고 생각해 봐'라고 조언해 주었고, 지훈이는 매일 방과 후 빈 교실에서 혼자 발성 연습을 했다. 처음에는 자기 목소리가 울리는 것이 부끄러웠지만, 반복할수록 목소리에 힘이 실리기 시작했다. 일주일쯤 지나자 감정을 담아 말하는 단계에 이르렀고, 연극반 친구들은 지훈이의 변화에 감탄하며 박수를 보냈다." },
    { id: "p3", text: "축제 당일, 무대 뒤에서 지훈이의 심장은 북소리처럼 빠르게 뛰었다. 막이 오르고 조명이 켜지자 객석의 얼굴들이 어둠 속에 사라졌고, 무대 위에 혼자 선 듯한 느낌이 들었다. 첫 대사를 내뱉는 순간 목소리가 떨릴까 걱정했지만, 입을 열자 예상 외로 또렷한 소리가 강당을 채웠다. 수빈이의 조언대로 맨 뒷줄을 향해 이야기하니 목소리가 자연스럽게 커졌고, 대사 하나하나에 연습 때 다져 온 감정이 실려 나왔다." },
    { id: "p4", text: "연극이 끝나고 객석에서 박수가 터져 나왔다. 지훈이는 함께 무대에 선 친구들과 손을 잡고 인사를 하면서 눈시울이 뜨거워졌다. 무대 아래로 내려오자 선생님이 다가와 '네 안에 이런 힘이 있는 줄 알고 있었단다'라며 어깨를 토닥여 주셨다. 지훈이는 낯을 가리는 성격이 바뀐 것은 아니지만, 두려움을 넘어서 본 세상이 훨씬 넓다는 것을 깨달았다. 교실로 돌아가는 복도에서 지훈이의 발걸음은 어느 때보다 가벼웠다." }
  ];
  console.log(`Day 272 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '조용한 눈빛 속에 깊은 감정을 표현할 수 있는 힘이 있다며 추천하셨다'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "조용한 눈빛 속에 깊은 감정을 표현할 수 있는 힘이 있다며 추천하셨다")]),
    makeConfirmQ("q2", "지문에서 '관객석 맨 뒷줄에 앉은 사람에게 이야기한다고 생각해 봐'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "관객석 맨 뒷줄에 앉은 사람에게 이야기한다고 생각해 봐")]),
    makeConfirmQ("q3", "지문에서 '반복할수록 목소리에 힘이 실리기 시작했다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "반복할수록 목소리에 힘이 실리기 시작했다")]),
    makeConfirmQ("q4", "지문에서 '연극반 친구들은 지훈이의 변화에 감탄하며 박수를 보냈다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "연극반 친구들은 지훈이의 변화에 감탄하며 박수를 보냈다")]),
    makeConfirmQ("q5", "지문에서 '입을 열자 예상 외로 또렷한 소리가 강당을 채웠다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "입을 열자 예상 외로 또렷한 소리가 강당을 채웠다")]),
    makeConfirmQ("q6", "지문에서 '네 안에 이런 힘이 있는 줄 알고 있었단다'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "네 안에 이런 힘이 있는 줄 알고 있었단다")]),
    makeConfirmQ("q7", "지문에서 '두려움을 넘어서 본 세상이 훨씬 넓다는 것을 깨달았다'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "두려움을 넘어서 본 세상이 훨씬 넓다는 것을 깨달았다")])
  ];
  return { content: assembleFull(272, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// -- Day 273 (홀수 -> 비문학) --
function buildDay273() {
  const paragraphs = [
    { id: "p1", text: "토양은 암석이 풍화 작용을 받아 잘게 부서지고, 동식물의 유기물이 축적되면서 오랜 세월에 걸쳐 형성된 지표면의 얇은 층이다. 토양이 만들어지는 속도는 매우 느려서 1센티미터가 형성되기까지 약 100년에서 1,000년이 걸린다. 토양은 모래, 미사, 점토의 세 가지 입자로 구성되며, 각 입자의 비율에 따라 성질이 달라진다. 모래가 많은 사질토는 배수가 잘 되지만 수분 보유력이 낮고, 점토가 많은 토양은 물을 잘 머금지만 통기성이 떨어진다." },
    { id: "p2", text: "토양은 식물이 뿌리를 내리고 양분을 흡수하는 기반이므로 농업에서 가장 중요한 자원 중 하나이다. 토양 속에는 질소, 인, 칼륨 등 식물 생장에 필수적인 무기 양분이 포함되어 있으며, 토양 미생물은 유기물을 분해하여 양분을 식물이 흡수할 수 있는 형태로 전환한다. 건강한 토양 1그램에는 수십억 마리의 미생물이 살고 있으며, 지렁이와 같은 토양 동물은 흙을 뒤집고 유기물을 섞어 토양의 구조를 개선한다." },
    { id: "p3", text: "그러나 오늘날 전 세계적으로 토양 황폐화가 심각한 문제가 되고 있다. 과도한 경작과 화학 비료의 남용은 토양의 유기물 함량을 감소시키고 미생물 다양성을 떨어뜨린다. 삼림 벌채로 나무뿌리가 사라지면 빗물에 의한 토양 침식이 가속화되며, 해마다 수십억 톤의 표토가 유실되고 있다. 표토는 양분이 가장 풍부한 층이므로 유실되면 농지의 생산성이 급격히 떨어지고 식량 안보에도 위협이 된다." },
    { id: "p4", text: "토양을 보전하기 위한 다양한 노력이 이루어지고 있다. 윤작은 같은 땅에 해마다 다른 작물을 돌려 심는 방법으로 양분 고갈을 막고 병충해를 줄인다. 부초 덮기는 빈 땅을 짚이나 낙엽으로 덮어 수분 증발과 토양 침식을 줄이는 기술이다. 또한 경사지에 계단식 논밭을 조성하여 빗물의 유속을 낮추고 토양 유실을 방지하는 방법도 오래전부터 활용되어 왔다. 토양은 한번 파괴되면 복원에 수백 년이 걸리기 때문에 예방적 관리가 무엇보다 중요하다." }
  ];
  console.log(`Day 273 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '1센티미터가 형성되기까지 약 100년에서 1,000년이 걸린다'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "1센티미터가 형성되기까지 약 100년에서 1,000년이 걸린다")]),
    makeConfirmQ("q2", "지문에서 '모래가 많은 사질토는 배수가 잘 되지만 수분 보유력이 낮고'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "모래가 많은 사질토는 배수가 잘 되지만 수분 보유력이 낮고")]),
    makeConfirmQ("q3", "지문에서 '토양 미생물은 유기물을 분해하여 양분을 식물이 흡수할 수 있는 형태로 전환한다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "토양 미생물은 유기물을 분해하여 양분을 식물이 흡수할 수 있는 형태로 전환한다")]),
    makeConfirmQ("q4", "지문에서 '지렁이와 같은 토양 동물은 흙을 뒤집고 유기물을 섞어 토양의 구조를 개선한다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "지렁이와 같은 토양 동물은 흙을 뒤집고 유기물을 섞어 토양의 구조를 개선한다")]),
    makeConfirmQ("q5", "지문에서 '삼림 벌채로 나무뿌리가 사라지면 빗물에 의한 토양 침식이 가속화되며'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "삼림 벌채로 나무뿌리가 사라지면 빗물에 의한 토양 침식이 가속화되며")]),
    makeConfirmQ("q6", "지문에서 '윤작은 같은 땅에 해마다 다른 작물을 돌려 심는 방법으로'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "윤작은 같은 땅에 해마다 다른 작물을 돌려 심는 방법으로")]),
    makeConfirmQ("q7", "지문에서 '토양은 한번 파괴되면 복원에 수백 년이 걸리기 때문에 예방적 관리가 무엇보다 중요하다'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "토양은 한번 파괴되면 복원에 수백 년이 걸리기 때문에 예방적 관리가 무엇보다 중요하다")])
  ];
  return { content: assembleFull(273, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// -- 실행부 --
const results = [
  { dayIndex: 269, ...buildDay269() },
  { dayIndex: 270, ...buildDay270() },
  { dayIndex: 271, ...buildDay271() },
  { dayIndex: 272, ...buildDay272() },
  { dayIndex: 273, ...buildDay273() }
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
  path.join(__dirname, '..', 'generated', 'new', 'batch-f2-269-273.json'),
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
