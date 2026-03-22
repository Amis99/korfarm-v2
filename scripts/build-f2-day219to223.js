#!/usr/bin/env node
// 프레게2 Day 219~223 일일독해 콘텐츠 빌더
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

// ═══ Day 219 비문학 (NONFICTION) ═══
function buildDay219() {
  const p1 = "소리는 물체가 진동할 때 만들어지는 파동이다. 우리가 말을 할 때 성대가 떨리면서 공기를 진동시키고, 이 진동이 주변의 공기 분자를 차례로 밀어내며 퍼져 나간다. 소리의 파동은 공기뿐만 아니라 물이나 금속 같은 다양한 물질을 통해서도 전달된다. 다만 진공 상태에서는 진동을 전달할 물질이 없기 때문에 소리가 전혀 전달되지 않는다. 우주 공간이 고요한 것은 바로 이 때문이다.";
  const p2 = "소리는 높낮이, 크기, 음색이라는 세 가지 성질을 갖는다. 소리의 높낮이는 진동수에 의해 결정되는데, 1초 동안 진동하는 횟수가 많을수록 높은 소리가 난다. 진동수의 단위는 헤르츠라 하며, 사람의 귀는 대략 20헤르츠에서 2만 헤르츠 사이의 소리를 들을 수 있다. 소리의 크기는 진폭에 따라 달라지는데, 진폭이 클수록 큰 소리가 난다. 음색은 같은 높이와 크기의 소리라도 악기마다 다르게 들리는 이유를 설명해 주는 성질로, 소리 파동의 모양에 의해 결정된다.";
  const p3 = "일상생활에서 소리의 성질은 다양하게 활용된다. 병원에서 초음파 검사를 할 때에는 사람의 귀에 들리지 않는 높은 진동수의 소리를 몸 안에 보내고 반사되어 돌아오는 파동을 분석하여 내부 장기의 모습을 영상으로 확인한다. 선박에서는 수중 음파 탐지기를 이용하여 바다의 깊이를 측정하거나 물속에 있는 물고기 떼의 위치를 파악하기도 한다. 또한 콘서트홀을 설계할 때에는 소리의 반사와 흡수를 고려하여 관객석 어디에서든 음악이 고르게 들리도록 벽면의 재질과 형태를 정밀하게 계산한다.";
  const p4 = "소음 역시 소리의 일종이지만 사람에게 불쾌감을 주거나 건강에 해를 끼칠 수 있는 소리를 가리킨다. 지속적으로 큰 소음에 노출되면 청력이 손상될 수 있으며, 집중력 저하나 수면 장애를 일으키기도 한다. 이를 방지하기 위해 도로변에는 방음벽을 설치하고, 건물에는 방음 자재를 사용하며, 이어폰 사용 시에는 적절한 음량을 유지하는 것이 중요하다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "소리가 만들어지는 원리는 무엇인가?",
      [findRange(paragraphs, "p1", "물체가 진동할 때 만들어지는 파동이다")]),
    makeConfirmQ("q2", "진공 상태에서 소리가 전달되지 않는 이유는 무엇인가?",
      [findRange(paragraphs, "p1", "진동을 전달할 물질이 없기 때문에 소리가 전혀 전달되지 않는다")]),
    makeConfirmQ("q3", "사람의 귀가 들을 수 있는 소리의 범위는 어떻게 되는가?",
      [findRange(paragraphs, "p2", "대략 20헤르츠에서 2만 헤르츠 사이의 소리를 들을 수 있다")]),
    makeConfirmQ("q4", "음색이란 어떤 성질인가?",
      [findRange(paragraphs, "p2", "같은 높이와 크기의 소리라도 악기마다 다르게 들리는 이유를 설명해 주는 성질")]),
    makeConfirmQ("q5", "초음파 검사에서 소리의 성질이 어떻게 활용되는가?",
      [findRange(paragraphs, "p3", "사람의 귀에 들리지 않는 높은 진동수의 소리를 몸 안에 보내고 반사되어 돌아오는 파동을 분석하여 내부 장기의 모습을 영상으로 확인한다")]),
    makeConfirmQ("q6", "지속적인 소음 노출이 일으킬 수 있는 문제는 무엇인가?",
      [findRange(paragraphs, "p4", "청력이 손상될 수 있으며, 집중력 저하나 수면 장애를 일으키기도 한다")])
  ];

  const content = assembleFull(219, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ═══ Day 220 문학 (LITERATURE) ═══
function buildDay220() {
  const p1 = "마을 뒷산 꼭대기에는 아무도 찾지 않는 오래된 정자가 하나 있었다. 기둥의 붉은 칠은 벗겨져 나무 결이 드러나 있었고, 마루판 사이로 풀이 삐죽삐죽 자라나 있었다. 아이들은 그 정자를 귀신이 나온다며 무서워했지만, 유일하게 수진이만은 틈만 나면 그곳을 찾아갔다. 정자에 올라서면 마을 전체가 한눈에 내려다보였고, 저 멀리 논과 밭 너머로 은빛 강물이 햇살을 받아 반짝거리는 모습이 보였다. 수진이에게 그곳은 세상에서 가장 넓은 방이었다.";
  const p2 = "수진이가 정자를 좋아하게 된 것은 할머니 때문이었다. 할머니는 어릴 적부터 수진이를 데리고 그 정자에 올라가 옛이야기를 들려주곤 하셨다. 호랑이가 담배 피우던 시절 이야기부터 마을을 지켜 주는 산신령 이야기까지, 할머니의 이야기는 끝이 없었다. 할머니 목소리는 가을 햇살처럼 나른하고 따뜻해서 듣다 보면 스르르 잠이 들 것만 같았다. 수진이는 할머니의 무릎에 기대어 이야기를 들으며 정자를 자신만의 비밀 아지트로 여기게 되었다.";
  const p3 = "초등학교 6학년이 되던 봄, 할머니가 돌아가셨다. 수진이는 한동안 정자에 가지 못했다. 할머니 없는 정자는 너무 텅 비어 보일 것 같았기 때문이다. 그런데 어느 날 친구와 다투고 속상한 마음을 안고 무작정 걷다 보니 발걸음이 저절로 정자를 향하고 있었다. 삐걱거리는 마루에 걸터앉아 고개를 들자 할머니와 함께 보던 그 풍경이 그대로 펼쳐져 있었다. 강물은 여전히 반짝이고 있었고, 바람은 할머니의 목소리처럼 부드럽게 수진이의 머리카락을 어루만졌다.";
  const p4 = "그 순간 수진이는 할머니가 왜 이 정자를 좋아하셨는지 비로소 알 것 같았다. 높은 곳에서 넓게 바라보면 속상했던 일도 작아 보이고, 바람에 실려 오는 풀 냄새가 마음의 주름을 펴 주었다. 수진이는 주머니에서 작은 공책을 꺼내 그날 본 풍경과 할머니에 대한 그리움을 또박또박 적었다. 정자의 낡은 마루는 삐걱거렸지만 수진이의 마음만큼은 아무보다 단단해져 있었다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "정자에서 바라본 풍경은 어떠했는가?",
      [findRange(paragraphs, "p1", "마을 전체가 한눈에 내려다보였고, 저 멀리 논과 밭 너머로 은빛 강물이 햇살을 받아 반짝거리는 모습이 보였다")]),
    makeConfirmQ("q2", "수진이에게 정자는 어떤 의미였는가?",
      [findRange(paragraphs, "p1", "세상에서 가장 넓은 방이었다")]),
    makeConfirmQ("q3", "할머니의 목소리를 무엇에 비유하였는가?",
      [findRange(paragraphs, "p2", "가을 햇살처럼 나른하고 따뜻해서")]),
    makeConfirmQ("q4", "수진이가 할머니 돌아가신 뒤 정자에 가지 못한 이유는 무엇인가?",
      [findRange(paragraphs, "p3", "할머니 없는 정자는 너무 텅 비어 보일 것 같았기 때문이다")]),
    makeConfirmQ("q5", "바람을 어떤 것에 비유하고 있는가?",
      [findRange(paragraphs, "p3", "바람은 할머니의 목소리처럼 부드럽게 수진이의 머리카락을 어루만졌다")]),
    makeConfirmQ("q6", "높은 곳에서 넓게 바라보면 어떤 효과가 있었는가?",
      [findRange(paragraphs, "p4", "속상했던 일도 작아 보이고, 바람에 실려 오는 풀 냄새가 마음의 주름을 펴 주었다")]),
    makeConfirmQ("q7", "수진이가 정자에서 한 행동은 무엇인가?",
      [findRange(paragraphs, "p4", "작은 공책을 꺼내 그날 본 풍경과 할머니에 대한 그리움을 또박또박 적었다")])
  ];

  const content = assembleFull(220, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ═══ Day 221 비문학 (NONFICTION) ═══
function buildDay221() {
  const p1 = "지구의 대기는 여러 층으로 나뉘어 있으며 각 층마다 고유한 특성을 지닌다. 지표면에서 가장 가까운 대류권은 지상에서 약 12킬로미터 높이까지의 영역으로, 우리가 경험하는 날씨 현상이 모두 이 층에서 일어난다. 대류권에서는 높이 올라갈수록 기온이 낮아지는데, 약 100미터 올라갈 때마다 대략 0.65도씩 기온이 떨어진다. 구름이 만들어지고 비와 눈이 내리며 태풍이 발생하는 것도 모두 대류권의 일이다.";
  const p2 = "대류권 위에는 성층권이 자리 잡고 있다. 성층권은 지상 약 12킬로미터부터 50킬로미터 사이에 해당하며, 대류권과 달리 높이 올라갈수록 기온이 높아지는 특이한 성질을 보인다. 이는 성층권에 있는 오존층이 태양의 자외선을 흡수하여 열을 발생시키기 때문이다. 오존층은 해로운 자외선이 지표면에 도달하는 것을 막아 주어 지구상의 생명체를 보호하는 방패 역할을 한다. 비행기가 순항하는 고도가 성층권 아래쪽인 이유는 기류가 안정적이어서 흔들림이 적기 때문이다.";
  const p3 = "성층권 위에는 중간권과 열권이 차례로 이어진다. 중간권은 약 50킬로미터에서 80킬로미터 사이에 있으며, 대기 중 기온이 가장 낮은 구간이다. 밤하늘에서 볼 수 있는 유성, 즉 별똥별은 우주에서 날아온 작은 돌덩이가 중간권에 진입하면서 마찰열로 타 버리는 현상이다. 열권은 약 80킬로미터 이상의 영역으로, 태양 복사 에너지를 직접 흡수하기 때문에 온도가 매우 높아질 수 있다. 오로라라는 아름다운 빛의 현상이 나타나는 곳도 바로 열권이다.";
  const p4 = "대기의 각 층은 서로 다른 방식으로 지구 환경을 유지하는 데 기여한다. 대류권은 수분과 열을 순환시켜 생태계에 필수적인 기후를 만들고, 성층권의 오존층은 생명체를 자외선으로부터 보호한다. 중간권은 우주에서 날아오는 물체로부터 지구를 지키는 역할을 하며, 열권은 인공위성이 운행되는 공간이기도 하다. 이처럼 보이지 않는 대기의 각 층이 제 역할을 해 주기에 우리는 지구에서 안전하게 살아갈 수 있다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "대류권에서 높이 올라갈수록 기온은 어떻게 변하는가?",
      [findRange(paragraphs, "p1", "약 100미터 올라갈 때마다 대략 0.65도씩 기온이 떨어진다")]),
    makeConfirmQ("q2", "성층권에서 높이 올라갈수록 기온이 높아지는 이유는 무엇인가?",
      [findRange(paragraphs, "p2", "오존층이 태양의 자외선을 흡수하여 열을 발생시키기 때문이다")]),
    makeConfirmQ("q3", "오존층이 하는 역할은 무엇인가?",
      [findRange(paragraphs, "p2", "해로운 자외선이 지표면에 도달하는 것을 막아 주어 지구상의 생명체를 보호하는 방패 역할을 한다")]),
    makeConfirmQ("q4", "별똥별이 만들어지는 원리는 무엇인가?",
      [findRange(paragraphs, "p3", "우주에서 날아온 작은 돌덩이가 중간권에 진입하면서 마찰열로 타 버리는 현상이다")]),
    makeConfirmQ("q5", "오로라가 나타나는 대기층은 어디인가?",
      [findRange(paragraphs, "p3", "오로라라는 아름다운 빛의 현상이 나타나는 곳도 바로 열권이다")]),
    makeConfirmQ("q6", "중간권이 지구를 보호하는 방식은 무엇인가?",
      [findRange(paragraphs, "p4", "우주에서 날아오는 물체로부터 지구를 지키는 역할을 하며")])
  ];

  const content = assembleFull(221, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ═══ Day 222 문학 (LITERATURE) ═══
function buildDay222() {
  const p1 = "겨울 방학이 시작되던 날, 준호는 시골 외할머니 댁으로 향하는 기차에 올라탔다. 창밖으로 회색빛 도시의 건물들이 뒤로 물러나고 점차 하얀 눈이 쌓인 들판이 펼쳐졌다. 기차가 작은 간이역에 멈추자 플랫폼에 외할머니가 서 계셨다. 두꺼운 솜 점퍼를 입고 목도리를 단단히 두르신 외할머니는 준호를 보자 얼굴 가득 주름진 웃음을 지으셨다. 준호는 외할머니의 거친 손을 잡고 마을로 이어지는 좁은 길을 걸었다.";
  const p2 = "외할머니 댁 마당에는 커다란 감나무 한 그루가 서 있었다. 여름에는 넓은 잎이 그늘을 만들어 주었지만, 겨울에는 앙상한 가지만 남아 파란 하늘을 향해 뻗어 있었다. 감나무 아래에는 장독대가 줄지어 놓여 있었고, 뚜껑 위에 하얗게 눈이 쌓여 있었다. 외할머니는 장독 하나를 열어 김치를 꺼내시며 올해 특별히 잘 익었다고 자랑하셨다. 갓 꺼낸 김치에서 나는 시큼하면서도 감칠맛 나는 향이 차가운 겨울 공기 속에 퍼졌다.";
  const p3 = "저녁이 되자 외할머니는 커다란 가마솥에 소고기 무국을 끓이셨다. 아궁이에서 장작이 타닥타닥 소리를 내며 탔고, 주황빛 불꽃이 부엌 벽에 춤추듯 그림자를 만들었다. 구수한 국물 냄새가 집 안 가득 퍼지자 준호의 배에서 꼬르륵 소리가 났다. 뜨거운 국을 한 숟가락 떠서 입안에 넣자 온몸으로 따뜻함이 번져 나갔다. 밥 한 공기를 뚝딱 비운 준호에게 외할머니는 한 그릇 더 먹으라며 국을 듬뿍 퍼 주셨다.";
  const p4 = "밤이 깊어지자 외할머니는 안방에 솜이불을 두둑하게 펴 주셨다. 이불 속에 누우니 장작 때는 냄새와 함께 따끈한 온기가 온몸을 감쌌다. 창문 너머로 눈이 소리 없이 내리고 있었다. 외할머니는 준호의 등을 토닥이며 자장가를 불러 주셨다. 도시에서의 시험과 학원 걱정이 눈송이처럼 사르르 녹아 사라졌다. 준호는 외할머니의 따뜻한 손길 속에서 스르르 잠이 들며 이 겨울 방학이 끝나지 않기를 바랐다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "기차에서 내린 준호를 맞이한 외할머니의 모습은 어떠했는가?",
      [findRange(paragraphs, "p1", "두꺼운 솜 점퍼를 입고 목도리를 단단히 두르신 외할머니는 준호를 보자 얼굴 가득 주름진 웃음을 지으셨다")]),
    makeConfirmQ("q2", "겨울철 외할머니 댁 마당의 감나무 모습은 어떠했는가?",
      [findRange(paragraphs, "p2", "앙상한 가지만 남아 파란 하늘을 향해 뻗어 있었다")]),
    makeConfirmQ("q3", "외할머니가 장독에서 꺼낸 김치의 향은 어떠했는가?",
      [findRange(paragraphs, "p2", "시큼하면서도 감칠맛 나는 향이 차가운 겨울 공기 속에 퍼졌다")]),
    makeConfirmQ("q4", "아궁이의 불꽃이 만들어 낸 풍경은 어떠했는가?",
      [findRange(paragraphs, "p3", "주황빛 불꽃이 부엌 벽에 춤추듯 그림자를 만들었다")]),
    makeConfirmQ("q5", "준호의 도시에서의 걱정이 사라지는 모습을 무엇에 비유하였는가?",
      [findRange(paragraphs, "p4", "도시에서의 시험과 학원 걱정이 눈송이처럼 사르르 녹아 사라졌다")]),
    makeConfirmQ("q6", "준호가 잠들며 바란 것은 무엇인가?",
      [findRange(paragraphs, "p4", "이 겨울 방학이 끝나지 않기를 바랐다")])
  ];

  const content = assembleFull(222, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ═══ Day 223 비문학 (NONFICTION) ═══
function buildDay223() {
  const p1 = "발효는 미생물이 유기물을 분해하여 새로운 물질을 만들어 내는 과정이다. 인류는 수천 년 전부터 발효를 이용하여 식품을 만들어 왔다. 빵을 만들 때 반죽에 넣는 효모는 밀가루 속의 당분을 분해하면서 이산화탄소 기체를 발생시키는데, 이 기체가 반죽 안에 작은 구멍들을 만들어 빵이 부풀어 오르게 한다. 포도즙에 효모를 넣으면 당분이 알코올로 바뀌어 포도주가 되는 것도 발효의 대표적인 사례이다.";
  const p2 = "우리나라의 전통 음식에도 발효 기술이 광범위하게 적용되어 있다. 김치는 배추와 양념에 들어 있는 유산균이 당분을 분해하면서 젖산을 만들어 내는 유산 발효를 거쳐 완성된다. 젖산이 쌓이면 김치의 산도가 높아져 해로운 세균의 번식을 억제하기 때문에 김치는 오랫동안 상하지 않고 보관할 수 있다. 된장과 간장 역시 메주에 존재하는 곰팡이와 세균이 콩의 단백질을 분해하여 아미노산을 생성하는 발효 과정을 통해 깊은 감칠맛을 갖게 된다.";
  const p3 = "발효 식품은 영양학적으로도 큰 장점을 지닌다. 발효 과정에서 미생물이 영양소를 잘게 분해해 놓기 때문에 우리 몸이 이를 흡수하기가 더욱 쉬워진다. 또한 발효 과정에서 비타민과 같은 유익한 물질이 새롭게 생성되기도 한다. 특히 유산균이 풍부한 발효 식품은 장내 유익균의 수를 늘려 소화 기능을 돕고, 면역력을 높이는 데 기여한다고 알려져 있다. 이러한 이유로 발효 식품은 건강에 좋은 식품으로 세계적인 관심을 받고 있다.";
  const p4 = "현대 과학에서는 발효 기술을 식품 이외의 분야에도 활용하고 있다. 미생물을 이용하여 곡물이나 목재 찌꺼기에서 바이오 에탄올을 생산하는 것은 화석 연료를 대체할 수 있는 친환경 에너지원으로 주목받고 있다. 또한 제약 분야에서는 미생물의 발효를 이용하여 항생제나 비타민 등의 의약품을 대량으로 생산하기도 한다. 이처럼 오래전부터 인류와 함께해 온 발효 기술은 오늘날에도 다양한 분야에서 혁신적인 가치를 만들어 내고 있다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "빵이 부풀어 오르는 원리는 무엇인가?",
      [findRange(paragraphs, "p1", "이산화탄소 기체를 발생시키는데, 이 기체가 반죽 안에 작은 구멍들을 만들어 빵이 부풀어 오르게 한다")]),
    makeConfirmQ("q2", "김치가 오랫동안 상하지 않는 이유는 무엇인가?",
      [findRange(paragraphs, "p2", "젖산이 쌓이면 김치의 산도가 높아져 해로운 세균의 번식을 억제하기 때문에")]),
    makeConfirmQ("q3", "된장과 간장이 깊은 감칠맛을 갖게 되는 과정은 무엇인가?",
      [findRange(paragraphs, "p2", "곰팡이와 세균이 콩의 단백질을 분해하여 아미노산을 생성하는 발효 과정을 통해")]),
    makeConfirmQ("q4", "발효 식품이 영양 흡수에 유리한 이유는 무엇인가?",
      [findRange(paragraphs, "p3", "미생물이 영양소를 잘게 분해해 놓기 때문에 우리 몸이 이를 흡수하기가 더욱 쉬워진다")]),
    makeConfirmQ("q5", "유산균이 풍부한 발효 식품이 건강에 좋은 이유는 무엇인가?",
      [findRange(paragraphs, "p3", "장내 유익균의 수를 늘려 소화 기능을 돕고, 면역력을 높이는 데 기여한다")]),
    makeConfirmQ("q6", "발효 기술이 에너지 분야에서 활용되는 사례는 무엇인가?",
      [findRange(paragraphs, "p4", "미생물을 이용하여 곡물이나 목재 찌꺼기에서 바이오 에탄올을 생산하는 것")]),
    makeConfirmQ("q7", "제약 분야에서 발효를 어떻게 활용하는가?",
      [findRange(paragraphs, "p4", "미생물의 발효를 이용하여 항생제나 비타민 등의 의약품을 대량으로 생산하기도 한다")])
  ];

  const content = assembleFull(223, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ═══ 실행부 ═══
const results = [
  { dayIndex: 219, ...buildDay219() },
  { dayIndex: 220, ...buildDay220() },
  { dayIndex: 221, ...buildDay221() },
  { dayIndex: 222, ...buildDay222() },
  { dayIndex: 223, ...buildDay223() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});
const tempBatchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-f2-219-223.json');
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
