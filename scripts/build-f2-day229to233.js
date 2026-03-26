#!/usr/bin/env node
// 프레게2 Day 229~233 일일독해 콘텐츠 빌더
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

// ═══ Day 229 비문학 (NONFICTION) ═══
function buildDay229() {
  const p1 = "플라스틱은 20세기 초에 발명된 이후 인류의 생활을 획기적으로 변화시킨 물질이다. 가볍고 튼튼하며 원하는 형태로 쉽게 가공할 수 있다는 장점 덕분에 플라스틱은 포장재, 건축 자재, 의료 기기, 전자 제품 등 거의 모든 산업 분야에서 사용되고 있다. 특히 일회용 포장재로서의 활용도가 높아 전 세계에서 매년 약 3억 톤 이상의 플라스틱이 생산되고 있으며, 이 양은 해마다 증가하는 추세이다.";
  const p2 = "그러나 플라스틱의 가장 큰 문제는 자연 분해가 거의 되지 않는다는 점이다. 일반적으로 플라스틱이 자연에서 완전히 분해되기까지는 수백 년이 걸리는 것으로 알려져 있다. 버려진 플라스틱은 바람과 물에 의해 바다로 흘러 들어가 해양 생태계를 심각하게 위협한다. 바다에 떠다니는 플라스틱 조각을 먹이로 착각하여 삼킨 해양 동물들이 소화 장애나 질식으로 죽는 사례가 꾸준히 보고되고 있다. 또한 플라스틱이 잘게 부서져 만들어진 미세 플라스틱은 물고기의 몸속에 축적되어 먹이 사슬을 통해 결국 사람의 식탁에까지 올라온다.";
  const p3 = "이러한 문제를 해결하기 위해 다양한 노력이 이루어지고 있다. 먼저 플라스틱 사용 자체를 줄이려는 움직임이 있다. 많은 나라에서 일회용 비닐봉지 사용을 금지하거나 유료화하였고, 카페에서는 종이 빨대나 다회용 컵의 사용을 권장하고 있다. 한편 과학자들은 옥수수 전분이나 해조류 등 자연에서 분해될 수 있는 소재로 만든 생분해성 플라스틱을 개발하여 기존 플라스틱을 대체하려는 연구를 활발히 진행하고 있다.";
  const p4 = "플라스틱 문제의 근본적인 해결을 위해서는 개인의 실천과 사회적 제도가 함께 작동해야 한다. 물건을 살 때 과대 포장된 제품을 피하고, 재활용 분리배출을 올바르게 실천하며, 장바구니를 사용하는 작은 습관이 모이면 큰 변화를 이끌어 낼 수 있다. 동시에 플라스틱을 생산하는 기업에 환경 부담금을 부과하고, 재활용 기술에 투자하는 정책적 지원도 필수적이다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "플라스틱이 다양한 산업 분야에서 사용되는 이유는 무엇인가?",
      [findRange(paragraphs, "p1", "가볍고 튼튼하며 원하는 형태로 쉽게 가공할 수 있다는 장점")]),
    makeConfirmQ("q2", "플라스틱의 가장 큰 문제점은 무엇인가?",
      [findRange(paragraphs, "p2", "자연 분해가 거의 되지 않는다는 점이다")]),
    makeConfirmQ("q3", "미세 플라스틱이 사람에게까지 영향을 미치는 경로는 무엇인가?",
      [findRange(paragraphs, "p2", "물고기의 몸속에 축적되어 먹이 사슬을 통해 결국 사람의 식탁에까지 올라온다")]),
    makeConfirmQ("q4", "플라스틱 사용을 줄이기 위한 사회적 움직임에는 무엇이 있는가?",
      [findRange(paragraphs, "p3", "일회용 비닐봉지 사용을 금지하거나 유료화하였고, 카페에서는 종이 빨대나 다회용 컵의 사용을 권장하고 있다")]),
    makeConfirmQ("q5", "생분해성 플라스틱은 어떤 소재로 만들어지는가?",
      [findRange(paragraphs, "p3", "옥수수 전분이나 해조류 등 자연에서 분해될 수 있는 소재")]),
    makeConfirmQ("q6", "개인이 실천할 수 있는 플라스틱 줄이기 방법은 무엇인가?",
      [findRange(paragraphs, "p4", "과대 포장된 제품을 피하고, 재활용 분리배출을 올바르게 실천하며, 장바구니를 사용하는 작은 습관")])
  ];

  const content = assembleFull(229, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ═══ Day 230 문학 (LITERATURE) ═══
function buildDay230() {
  const p1 = "민지는 전학 온 첫날부터 교실 한쪽 구석에 혼자 앉았다. 아이들은 이미 서로 친한 무리를 이루고 있었고, 민지에게 말을 거는 사람은 아무도 없었다. 점심시간이 되자 다른 아이들은 삼삼오오 짝을 지어 급식실로 향했지만, 민지는 빈 교실에 남아 가져온 도시락을 혼자 먹었다. 밥알 하나하나가 목에 걸리는 것 같았다. 창밖으로 운동장에서 뛰어노는 아이들의 웃음소리가 들려왔고, 민지는 이전 학교 친구들이 몹시 그리웠다.";
  const p2 = "며칠이 지나도 상황은 달라지지 않았다. 민지는 쉬는 시간마다 책을 펴 놓고 글자를 읽는 척했지만 사실 한 줄도 눈에 들어오지 않았다. 그러던 어느 날 미술 시간에 선생님이 짝을 지어 공동 작품을 만들라고 하셨다. 민지의 짝은 서연이라는 아이였는데, 서연이는 민지에게 다가와 밝은 목소리로 인사를 건넸다. 서연이는 민지가 그린 하늘 그림을 보더니 색감이 정말 예쁘다고 진심으로 칭찬해 주었다. 민지는 얼굴이 붉어졌지만 마음 한쪽에서 따뜻한 기운이 피어오르는 것을 느꼈다.";
  const p3 = "그날 이후 서연이는 점심시간마다 민지 옆에 와서 함께 밥을 먹자고 했다. 처음에는 서연이 앞에서도 말이 잘 나오지 않았지만, 서연이가 자기 이야기를 먼저 꺼내며 웃어 주니 민지도 조금씩 입을 열게 되었다. 둘은 같은 동화책을 좋아한다는 것을 알게 되었고, 도서관에서 함께 책을 빌려 읽으며 서로의 감상을 나누었다. 민지의 표정이 밝아지자 다른 아이들도 하나둘 민지에게 다가오기 시작했다.";
  const p4 = "학기가 끝날 무렵, 민지는 반 친구들 앞에서 자신이 쓴 짧은 동화를 낭독하는 발표를 하게 되었다. 떨리는 목소리로 첫 문장을 읽기 시작했을 때 서연이가 맨 앞줄에서 고개를 끄덕이며 응원해 주었다. 이야기가 끝나자 교실 안에 박수 소리가 가득 찼다. 민지는 눈시울이 뜨거워지는 것을 느끼며 고개를 숙여 인사했다. 혼자였던 교실이 어느새 자신을 응원해 주는 따뜻한 공간으로 변해 있었다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "전학 첫날 민지가 점심을 혼자 먹은 이유는 무엇인가?",
      [findRange(paragraphs, "p1", "아이들은 이미 서로 친한 무리를 이루고 있었고, 민지에게 말을 거는 사람은 아무도 없었다")]),
    makeConfirmQ("q2", "민지가 쉬는 시간에 책을 읽는 척한 이유는 무엇인가?",
      [findRange(paragraphs, "p2", "책을 펴 놓고 글자를 읽는 척했지만 사실 한 줄도 눈에 들어오지 않았다")]),
    makeConfirmQ("q3", "서연이가 민지에게 처음 다가간 계기는 무엇인가?",
      [findRange(paragraphs, "p2", "미술 시간에 선생님이 짝을 지어 공동 작품을 만들라고 하셨다")]),
    makeConfirmQ("q4", "서연이가 민지를 칭찬한 내용은 무엇인가?",
      [findRange(paragraphs, "p2", "민지가 그린 하늘 그림을 보더니 색감이 정말 예쁘다고 진심으로 칭찬해 주었다")]),
    makeConfirmQ("q5", "민지와 서연이의 공통 관심사는 무엇이었는가?",
      [findRange(paragraphs, "p3", "같은 동화책을 좋아한다는 것을 알게 되었고")]),
    makeConfirmQ("q6", "학기 말에 민지가 발표한 내용은 무엇인가?",
      [findRange(paragraphs, "p4", "자신이 쓴 짧은 동화를 낭독하는 발표를 하게 되었다")]),
    makeConfirmQ("q7", "발표를 마친 민지가 느낀 변화는 무엇인가?",
      [findRange(paragraphs, "p4", "혼자였던 교실이 어느새 자신을 응원해 주는 따뜻한 공간으로 변해 있었다")])
  ];

  const content = assembleFull(230, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ═══ Day 231 비문학 (NONFICTION) ═══
function buildDay231() {
  const p1 = "지도는 지구 표면의 모습을 일정한 비율로 줄여서 평면 위에 나타낸 그림이다. 인류는 오래전부터 자신이 사는 지역의 모습을 기록하기 위해 지도를 만들어 왔다. 고대 바빌로니아에서는 점토판에 도시와 강의 위치를 새겨 넣은 지도가 발견되었으며, 고대 그리스의 학자 에라토스테네스는 지구의 둘레를 계산한 뒤 이를 바탕으로 세계 지도를 그리기도 하였다. 이처럼 지도는 단순한 그림이 아니라 당시 사람들의 지리적 지식과 세계관을 담고 있는 중요한 기록물이다.";
  const p2 = "지도를 읽기 위해서는 축척, 방위, 기호라는 세 가지 요소를 이해해야 한다. 축척은 실제 거리를 지도 위에 얼마나 줄여서 표현했는지를 나타내는 비율이다. 예를 들어 축척이 1대 50000인 지도에서 1센티미터는 실제 거리 500미터에 해당한다. 방위는 지도에서 동서남북의 방향을 알려 주며, 보통 지도의 위쪽이 북쪽을 가리킨다. 기호는 산, 강, 도로, 건물 등을 간단한 그림이나 색으로 표시한 것으로, 지도 아래에 있는 범례를 통해 각 기호의 의미를 확인할 수 있다.";
  const p3 = "오늘날에는 인공위성과 컴퓨터 기술의 발달로 디지털 지도가 널리 사용되고 있다. 위성 항법 장치를 이용한 내비게이션은 실시간으로 현재 위치를 파악하고 목적지까지의 최적 경로를 안내해 준다. 또한 항공 사진과 위성 영상을 결합하여 만든 온라인 지도 서비스에서는 거리 모습을 직접 확인할 수 있는 기능까지 제공하고 있다. 이러한 디지털 지도는 교통, 물류, 재난 대응 등 다양한 분야에서 핵심적인 도구로 활용되고 있다.";
  const p4 = "지도는 단순히 길을 찾는 도구를 넘어 사회와 역사를 이해하는 데에도 중요한 역할을 한다. 역사 지도를 통해 나라의 영토가 시대에 따라 어떻게 변화했는지를 한눈에 파악할 수 있고, 인구 밀도 지도를 보면 사람들이 어디에 모여 사는지를 알 수 있다. 환경 지도는 산림 파괴나 사막화의 진행 상황을 시각적으로 보여 주어 환경 문제에 대한 경각심을 높이는 데 기여한다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "지도란 무엇인가?",
      [findRange(paragraphs, "p1", "지구 표면의 모습을 일정한 비율로 줄여서 평면 위에 나타낸 그림이다")]),
    makeConfirmQ("q2", "지도가 단순한 그림이 아닌 이유는 무엇인가?",
      [findRange(paragraphs, "p1", "당시 사람들의 지리적 지식과 세계관을 담고 있는 중요한 기록물이다")]),
    makeConfirmQ("q3", "축척 1대 50000인 지도에서 1센티미터는 실제 거리로 얼마인가?",
      [findRange(paragraphs, "p2", "1센티미터는 실제 거리 500미터에 해당한다")]),
    makeConfirmQ("q4", "지도의 기호가 뜻하는 바를 어떻게 확인할 수 있는가?",
      [findRange(paragraphs, "p2", "지도 아래에 있는 범례를 통해 각 기호의 의미를 확인할 수 있다")]),
    makeConfirmQ("q5", "내비게이션이 제공하는 기능은 무엇인가?",
      [findRange(paragraphs, "p3", "실시간으로 현재 위치를 파악하고 목적지까지의 최적 경로를 안내해 준다")]),
    makeConfirmQ("q6", "환경 지도가 사회에 기여하는 바는 무엇인가?",
      [findRange(paragraphs, "p4", "산림 파괴나 사막화의 진행 상황을 시각적으로 보여 주어 환경 문제에 대한 경각심을 높이는 데 기여한다")])
  ];

  const content = assembleFull(231, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ═══ Day 232 문학 (LITERATURE) ═══
function buildDay232() {
  const p1 = "태호는 매일 아침 할아버지와 함께 동네 뒷산을 산책하는 것이 일과였다. 할아버지는 지팡이를 짚으며 천천히 걸으셨지만, 산에 대해서는 모르는 것이 없었다. 나뭇잎 모양만 보고도 나무 이름을 맞히셨고, 새소리만 듣고도 어떤 새인지 알려 주셨다. 태호는 할아버지의 설명을 들으며 숲속의 모든 것이 살아 숨 쉬는 하나의 세계라는 것을 느끼곤 했다.";
  const p2 = "어느 봄날 아침, 할아버지는 산길 옆 축축한 땅을 가리키며 여기에 도토리를 심어 보자고 하셨다. 태호는 주머니에서 지난가을에 주워 둔 도토리 몇 알을 꺼내 흙을 파고 조심스럽게 묻었다. 할아버지는 나무 한 그루가 자라려면 수십 년이 걸리지만 그만큼 오랫동안 많은 생명에게 보금자리를 내어 준다고 말씀하셨다. 태호는 작은 도토리가 커다란 참나무가 되는 모습을 상상하며 입가에 미소를 지었다.";
  const p3 = "여름이 되자 태호는 도토리를 심은 자리에서 연두색 새싹이 돋아난 것을 발견했다. 흙을 뚫고 올라온 여린 줄기가 햇빛을 향해 고개를 들고 있었다. 태호는 가뭄이 들 때마다 물통을 들고 산에 올라가 새싹에게 물을 주었고, 잡초가 자라면 조심스럽게 뽑아 주었다. 할아버지는 그런 태호를 바라보며 나무를 돌보는 사람은 결국 자기 마음도 함께 가꾸는 것이라고 말씀하셨다. 태호는 할아버지 말씀의 뜻을 완전히 이해하지는 못했지만, 새싹이 자라는 것을 볼 때마다 가슴이 뿌듯해지는 것만은 분명히 느꼈다.";
  const p4 = "가을이 깊어지던 어느 날, 할아버지께서 갑자기 몸이 편찮으셔서 입원을 하셨다. 태호는 혼자서도 매일 산에 올라 어린나무를 돌보았다. 낙엽이 쌓인 산길을 걸으며 할아버지와 함께 걷던 때를 떠올렸다. 어린나무는 이제 태호의 무릎 높이까지 자라 있었다. 태호는 나뭇가지를 쓰다듬으며 할아버지가 빨리 나으시면 함께 이 나무를 보러 오자고 속으로 약속했다. 바람이 불자 어린나무의 잎사귀가 살랑살랑 흔들렸고, 마치 알겠다고 대답하는 것처럼 보였다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "할아버지의 산에 대한 지식은 어느 정도였는가?",
      [findRange(paragraphs, "p1", "나뭇잎 모양만 보고도 나무 이름을 맞히셨고, 새소리만 듣고도 어떤 새인지 알려 주셨다")]),
    makeConfirmQ("q2", "할아버지가 나무에 대해 설명한 내용은 무엇인가?",
      [findRange(paragraphs, "p2", "나무 한 그루가 자라려면 수십 년이 걸리지만 그만큼 오랫동안 많은 생명에게 보금자리를 내어 준다")]),
    makeConfirmQ("q3", "태호가 새싹을 돌본 방법은 무엇인가?",
      [findRange(paragraphs, "p3", "물통을 들고 산에 올라가 새싹에게 물을 주었고, 잡초가 자라면 조심스럽게 뽑아 주었다")]),
    makeConfirmQ("q4", "할아버지가 나무를 돌보는 일에 대해 한 말씀은 무엇인가?",
      [findRange(paragraphs, "p3", "나무를 돌보는 사람은 결국 자기 마음도 함께 가꾸는 것이라고")]),
    makeConfirmQ("q5", "할아버지가 입원하신 뒤 태호는 어떻게 했는가?",
      [findRange(paragraphs, "p4", "혼자서도 매일 산에 올라 어린나무를 돌보았다")]),
    makeConfirmQ("q6", "태호가 어린나무에게 속으로 한 약속은 무엇인가?",
      [findRange(paragraphs, "p4", "할아버지가 빨리 나으시면 함께 이 나무를 보러 오자고 속으로 약속했다")])
  ];

  const content = assembleFull(232, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ═══ Day 233 비문학 (NONFICTION) ═══
function buildDay233() {
  const p1 = "인간의 뇌는 약 1.4킬로그램에 불과하지만 우리 몸에서 가장 복잡한 기관이다. 뇌에는 약 1000억 개의 신경 세포, 즉 뉴런이 존재하며, 각 뉴런은 수천 개의 다른 뉴런과 연결되어 거대한 네트워크를 이루고 있다. 이 신경 네트워크를 통해 생각하고, 감정을 느끼고, 몸을 움직이는 모든 활동이 이루어진다. 뇌는 몸 전체 에너지의 약 20퍼센트를 소비할 만큼 끊임없이 활동하고 있으며, 잠을 자는 동안에도 쉬지 않는다.";
  const p2 = "뇌는 크게 대뇌, 소뇌, 뇌간이라는 세 부분으로 나뉜다. 대뇌는 뇌의 가장 큰 부분을 차지하며, 사고, 언어, 기억, 감각 처리 등 고등 정신 활동을 담당한다. 대뇌의 표면에는 수많은 주름이 잡혀 있는데, 이 주름 덕분에 좁은 두개골 안에서도 넓은 표면적을 확보할 수 있다. 소뇌는 뇌의 뒤쪽 아래에 위치하며 몸의 균형을 잡고 근육 운동을 조절하는 역할을 한다. 뇌간은 호흡, 심장 박동, 체온 조절 등 생명 유지에 필수적인 기능을 관장한다.";
  const p3 = "뇌의 놀라운 특성 중 하나는 가소성이다. 뇌의 가소성이란 경험이나 학습에 따라 신경 세포 사이의 연결이 강화되거나 새로운 연결이 만들어지는 성질을 말한다. 예를 들어 악기 연주를 꾸준히 연습하면 손가락 움직임을 담당하는 뇌 영역의 신경 연결이 더욱 촘촘해진다. 외국어를 학습할 때에도 처음에는 어렵게 느껴지지만 반복하면 관련 신경 회로가 발달하여 점차 자연스럽게 사용할 수 있게 된다. 이처럼 뇌는 고정된 기관이 아니라 사용할수록 변화하고 발전하는 유연한 기관이다.";
  const p4 = "뇌 건강을 유지하기 위해서는 올바른 생활 습관이 중요하다. 충분한 수면은 뇌가 낮 동안 받아들인 정보를 정리하고 기억으로 저장하는 데 필수적이다. 규칙적인 운동은 뇌에 혈류를 원활하게 공급하여 집중력과 기억력을 향상시킨다. 또한 독서나 퍼즐 같은 두뇌 활동과 균형 잡힌 영양 섭취도 뇌의 기능을 오래도록 건강하게 유지하는 데 도움이 된다.";

  const paragraphs = [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "뇌가 소비하는 에너지의 비율은 얼마인가?",
      [findRange(paragraphs, "p1", "몸 전체 에너지의 약 20퍼센트를 소비할 만큼 끊임없이 활동하고 있으며")]),
    makeConfirmQ("q2", "대뇌 표면에 주름이 잡혀 있는 이유는 무엇인가?",
      [findRange(paragraphs, "p2", "좁은 두개골 안에서도 넓은 표면적을 확보할 수 있다")]),
    makeConfirmQ("q3", "소뇌가 담당하는 역할은 무엇인가?",
      [findRange(paragraphs, "p2", "몸의 균형을 잡고 근육 운동을 조절하는 역할을 한다")]),
    makeConfirmQ("q4", "뇌의 가소성이란 무엇인가?",
      [findRange(paragraphs, "p3", "경험이나 학습에 따라 신경 세포 사이의 연결이 강화되거나 새로운 연결이 만들어지는 성질을 말한다")]),
    makeConfirmQ("q5", "악기 연주를 꾸준히 연습하면 뇌에 어떤 변화가 일어나는가?",
      [findRange(paragraphs, "p3", "손가락 움직임을 담당하는 뇌 영역의 신경 연결이 더욱 촘촘해진다")]),
    makeConfirmQ("q6", "충분한 수면이 뇌에 중요한 이유는 무엇인가?",
      [findRange(paragraphs, "p4", "낮 동안 받아들인 정보를 정리하고 기억으로 저장하는 데 필수적이다")]),
    makeConfirmQ("q7", "규칙적인 운동이 뇌에 미치는 효과는 무엇인가?",
      [findRange(paragraphs, "p4", "뇌에 혈류를 원활하게 공급하여 집중력과 기억력을 향상시킨다")])
  ];

  const content = assembleFull(233, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ═══ 실행부 ═══
const results = [
  { dayIndex: 229, ...buildDay229() },
  { dayIndex: 230, ...buildDay230() },
  { dayIndex: 231, ...buildDay231() },
  { dayIndex: 232, ...buildDay232() },
  { dayIndex: 233, ...buildDay233() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});
const tempBatchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-f2-229-233.json');
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
