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
    id, prompt, answerRanges: ranges,
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true, answerMatchMode: "ANY"
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

// =====================================================
// Day 299 — 홀수 → 비문학 (NONFICTION)
// 주제: 인공위성의 궤도와 역할
// =====================================================
function buildDay299() {
  const paragraphs = [
    {
      id: "p1",
      text: "인공위성은 지구 주위를 도는 인공적인 물체로, 통신, 기상 관측, 항법, 과학 연구 등 다양한 분야에서 활용되고 있다. 최초의 인공위성은 1957년 소련이 발사한 스푸트니크 1호로, 이 성공은 우주 시대의 서막을 알렸다. 이후 전 세계 여러 나라가 경쟁적으로 인공위성을 개발하여 우주 공간에 수천 개의 위성이 운용되고 있으며, 현대인의 일상생활은 이 위성들이 제공하는 서비스에 크게 의존하고 있다."
    },
    {
      id: "p2",
      text: "인공위성의 궤도는 높이에 따라 저궤도, 중궤도, 정지궤도로 구분된다. 저궤도 위성은 지표면에서 약 200킬로미터에서 2000킬로미터 사이에 위치하며, 지구를 빠르게 돌기 때문에 정밀한 지표 관측에 적합하다. 정지궤도 위성은 약 3만 6천 킬로미터 상공에서 지구의 자전 속도와 같은 속도로 공전하여 항상 같은 지역을 바라보므로, 기상 관측이나 방송 중계에 주로 사용된다."
    },
    {
      id: "p3",
      text: "위성 항법 시스템은 여러 위성에서 보내는 신호의 도달 시간 차이를 계산하여 사용자의 위치를 정밀하게 파악하는 기술이다. 미국의 지피에스, 러시아의 글로나스, 유럽의 갈릴레오, 중국의 베이더우 등 각국이 독자적인 항법 시스템을 운용하고 있다. 이러한 시스템 덕분에 자동차 내비게이션부터 항공기 운항, 재난 구조까지 위치 정보가 필요한 거의 모든 활동이 가능해졌다."
    },
    {
      id: "p4",
      text: "그러나 우주에는 수명이 다하거나 고장 난 위성의 잔해인 우주 쓰레기가 급증하고 있어 심각한 문제가 되고 있다. 우주 쓰레기는 초속 수 킬로미터의 속도로 이동하기 때문에 작은 파편이라도 운용 중인 위성이나 우주 정거장에 치명적인 손상을 줄 수 있다. 이를 해결하기 위해 국제 사회는 우주 쓰레기 추적 시스템을 강화하고, 수명이 다한 위성을 안전하게 궤도에서 이탈시키는 기술을 개발하는 등 다양한 대책을 마련하고 있다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "최초의 인공위성을 발사한 나라와 위성 이름을 찾으세요.",
      [findRange(paragraphs, "p1", "최초의 인공위성은 1957년 소련이 발사한 스푸트니크 1호")]),
    makeConfirmQ("q2", "저궤도 위성이 위치하는 고도 범위를 찾으세요.",
      [findRange(paragraphs, "p2", "지표면에서 약 200킬로미터에서 2000킬로미터 사이에 위치")]),
    makeConfirmQ("q3", "정지궤도 위성이 방송 중계에 적합한 이유를 찾으세요.",
      [findRange(paragraphs, "p2", "지구의 자전 속도와 같은 속도로 공전하여 항상 같은 지역을 바라보므로")]),
    makeConfirmQ("q4", "위성 항법 시스템의 원리를 설명하는 부분을 찾으세요.",
      [findRange(paragraphs, "p3", "여러 위성에서 보내는 신호의 도달 시간 차이를 계산하여 사용자의 위치를 정밀하게 파악하는 기술")]),
    makeConfirmQ("q5", "우주 쓰레기가 위험한 이유를 찾으세요.",
      [findRange(paragraphs, "p4", "초속 수 킬로미터의 속도로 이동하기 때문에 작은 파편이라도 운용 중인 위성이나 우주 정거장에 치명적인 손상을 줄 수 있다")]),
    makeConfirmQ("q6", "우주 쓰레기 문제의 대책으로 언급된 기술을 찾으세요.",
      [findRange(paragraphs, "p4", "수명이 다한 위성을 안전하게 궤도에서 이탈시키는 기술을 개발하는")])
  ];

  const content = assembleFull(299, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// =====================================================
// Day 300 — 짝수 → 문학 (LITERATURE)
// 주제: 창작 수필 — 할머니의 장독대
// =====================================================
function buildDay300() {
  const paragraphs = [
    {
      id: "p1",
      text: "외할머니 댁 마당 한쪽에는 장독대가 있었다. 키 큰 장독 여섯 개가 나란히 줄을 서서 해를 받고 있었는데, 할머니는 아침마다 뚜껑을 열어 속을 들여다보며 혼잣말을 하셨다. 된장독에는 누런 된장이 깊고 묵직하게 가라앉아 있었고, 간장독에서는 짭조름한 향이 올라왔다. 고추장독은 유독 붉은빛이 진하여 뚜껑을 열 때면 매콤한 향이 코끝을 찔렀다. 어린 나는 장독대 옆에 쪼그려 앉아 할머니의 손놀림을 구경하는 것이 일과의 시작이었다."
    },
    {
      id: "p2",
      text: "할머니는 장을 담그는 일이 집안의 가장 큰 행사라고 늘 말씀하셨다. 해마다 늦가을이 되면 동네 아주머니들이 모여 콩을 삶고, 절구질을 하여 네모반듯한 메주 덩이를 빚었다. 메주가 처마 아래 볏짚에 묶여 매달린 채 찬바람에 마르는 모습은 겨울 풍경의 일부였다. 그리고 이른 봄, 할머니는 메주를 소금물에 담가 장독에 넣으셨는데, 그때마다 정성스럽게 붉은 고추와 숯 조각을 띄우며 잡귀를 쫓는다고 하셨다."
    },
    {
      id: "p3",
      text: "여름이면 장독대 주위에는 파란 나팔꽃이 덩굴을 틀었고, 잠자리가 장독 위를 맴돌았다. 할머니는 비가 오면 재빨리 뚜껑을 덮으러 마당으로 달려나가셨다. 빗물이 들어가면 장맛이 변한다며 호들갑을 떠시던 모습이 지금도 눈에 선하다. 반대로 햇살이 좋은 날에는 일부러 뚜껑을 한쪽으로 살짝 밀어 놓아 햇볕이 장 위를 고루 비추게 하셨다. 그 시절 장독대에서 풍기던 발효의 냄새는 지금도 여름이면 불현듯 떠오르곤 한다."
    },
    {
      id: "p4",
      text: "할머니가 돌아가신 뒤 그 집은 팔렸고, 장독대도 사라졌다. 마트에서 사 오는 된장과 간장은 맛은 그럭저럭 비슷해도 할머니의 손맛이 배어든 그 깊은 발효의 풍미에는 미치지 못한다. 무엇보다 장독대 곁에 쪼그려 앉아 올려다보던 할머니의 주름진 미소가 그립다. 장독대는 단순한 그릇이 아니라 세대를 잇는 기억의 그릇이었음을 이제야 깨닫는다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "장독대에 있던 장독의 수를 찾으세요.",
      [findRange(paragraphs, "p1", "키 큰 장독 여섯 개가 나란히 줄을 서서")]),
    makeConfirmQ("q2", "할머니가 아침마다 장독에 하시던 행동을 찾으세요.",
      [findRange(paragraphs, "p1", "아침마다 뚜껑을 열어 속을 들여다보며 혼잣말을 하셨다")]),
    makeConfirmQ("q3", "메주를 만들 때 이웃의 참여를 묘사하는 부분을 찾으세요.",
      [findRange(paragraphs, "p2", "동네 아주머니들이 모여 콩을 삶고, 절구질을 하여 네모반듯한 메주 덩이를 빚었다")]),
    makeConfirmQ("q7", "고추장독의 특징을 묘사하는 부분을 찾으세요.",
      [findRange(paragraphs, "p1", "고추장독은 유독 붉은빛이 진하여 뚜껑을 열 때면 매콤한 향이 코끝을 찔렀다")]),
    makeConfirmQ("q4", "할머니가 장독에 고추와 숯을 띄운 이유를 찾으세요.",
      [findRange(paragraphs, "p2", "정성스럽게 붉은 고추와 숯 조각을 띄우며 잡귀를 쫓는다고 하셨다")]),
    makeConfirmQ("q5", "비가 올 때 할머니의 행동과 그 이유를 찾으세요.",
      [findRange(paragraphs, "p3", "비가 오면 재빨리 뚜껑을 덮으러 마당으로 달려나가셨다. 빗물이 들어가면 장맛이 변한다며")]),
    makeConfirmQ("q6", "글쓴이가 장독대에 대해 내린 결론을 찾으세요.",
      [findRange(paragraphs, "p4", "장독대는 단순한 그릇이 아니라 세대를 잇는 기억의 그릇이었음을 이제야 깨닫는다")])
  ];

  const content = assembleFull(300, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// =====================================================
// Day 301 — 홀수 → 비문학 (NONFICTION)
// 주제: 미세 플라스틱의 환경 문제
// =====================================================
function buildDay301() {
  const paragraphs = [
    {
      id: "p1",
      text: "미세 플라스틱은 크기가 5밀리미터 이하인 아주 작은 플라스틱 조각을 말한다. 처음부터 작게 만들어진 1차 미세 플라스틱과, 큰 플라스틱 제품이 자외선이나 파도에 의해 잘게 부서져 생긴 2차 미세 플라스틱으로 나뉜다. 1차 미세 플라스틱에는 세안제나 치약에 들어가는 마이크로비즈, 합성 섬유에서 빠져나오는 미세 섬유 등이 포함된다. 이러한 입자들은 하수 처리 시설에서도 완전히 걸러지지 않아 강과 바다로 흘러든다."
    },
    {
      id: "p2",
      text: "바다에 유입된 미세 플라스틱은 해양 생태계에 심각한 영향을 미친다. 플랑크톤부터 고래에 이르기까지 다양한 해양 생물이 먹이로 착각하여 미세 플라스틱을 섭취하게 되며, 이 과정에서 소화 기관이 막히거나 영양 흡수가 방해를 받는다. 또한 미세 플라스틱 표면에는 바다에 녹아 있는 중금속이나 유해 화학 물질이 흡착되기 쉬워, 이를 섭취한 생물의 체내에 독성 물질이 축적되는 문제도 발생한다."
    },
    {
      id: "p3",
      text: "더 큰 우려는 미세 플라스틱이 먹이 사슬을 통해 결국 인간에게도 전달된다는 점이다. 생선이나 조개류를 섭취할 때 미세 플라스틱이 함께 체내로 들어올 수 있으며, 최근 연구에서는 수돗물, 생수, 소금, 꿀 등 일상적인 식품에서도 미세 플라스틱이 검출되었다. 인체에 축적된 미세 플라스틱이 장기적으로 어떤 건강 영향을 미치는지는 아직 연구가 진행 중이지만, 염증 반응이나 호르몬 교란 가능성이 보고되고 있다."
    },
    {
      id: "p4",
      text: "이 문제를 해결하기 위해 여러 나라에서 마이크로비즈 사용을 법으로 금지하고 있으며, 플라스틱 사용을 줄이기 위한 정책도 확대되고 있다. 개인 차원에서는 일회용 플라스틱 대신 재사용 가능한 용기를 쓰고, 합성 섬유 의류를 세탁할 때 미세 섬유 포집 필터를 사용하는 것이 도움이 된다. 근본적으로는 자연에서 분해되는 생분해성 소재의 개발과 보급이 미세 플라스틱 문제의 장기적 해법으로 주목받고 있다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "미세 플라스틱의 크기 기준을 찾으세요.",
      [findRange(paragraphs, "p1", "크기가 5밀리미터 이하인 아주 작은 플라스틱 조각")]),
    makeConfirmQ("q2", "1차 미세 플라스틱의 예시를 찾으세요.",
      [findRange(paragraphs, "p1", "세안제나 치약에 들어가는 마이크로비즈, 합성 섬유에서 빠져나오는 미세 섬유")]),
    makeConfirmQ("q3", "해양 생물이 미세 플라스틱을 섭취하면 어떤 문제가 생기는지 찾으세요.",
      [findRange(paragraphs, "p2", "소화 기관이 막히거나 영양 흡수가 방해를 받는다")]),
    makeConfirmQ("q4", "미세 플라스틱 표면에 흡착되는 물질을 찾으세요.",
      [findRange(paragraphs, "p2", "바다에 녹아 있는 중금속이나 유해 화학 물질이 흡착되기 쉬워")]),
    makeConfirmQ("q5", "일상 식품에서 미세 플라스틱이 검출된 예시를 찾으세요.",
      [findRange(paragraphs, "p3", "수돗물, 생수, 소금, 꿀 등 일상적인 식품에서도 미세 플라스틱이 검출되었다")]),
    makeConfirmQ("q6", "미세 플라스틱 문제의 장기적 해법으로 제시된 것을 찾으세요.",
      [findRange(paragraphs, "p4", "자연에서 분해되는 생분해성 소재의 개발과 보급")])
  ];

  const content = assembleFull(301, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// =====================================================
// Day 302 — 짝수 → 문학 (LITERATURE)
// 주제: 창작 소설 — 가을 우체통
// =====================================================
function buildDay302() {
  const paragraphs = [
    {
      id: "p1",
      text: "서준이는 학교가 끝나면 늘 도서관 옆 골목길로 돌아갔다. 그 길모퉁이에는 오래된 빨간 우체통이 하나 서 있었는데, 페인트가 군데군데 벗겨져 녹이 올라와 있었다. 주변에는 은행나무 두 그루가 서 있어 가을이면 노란 잎으로 바닥이 두텁게 덮였다. 아무도 이 우체통을 쓰지 않는다고 생각했지만, 어느 가을날 서준이는 우체통 투입구에 하얀 편지 봉투 한 장이 끼워져 있는 것을 발견했다. 봉투에는 받는 사람도 보내는 사람의 이름도 적혀 있지 않았다."
    },
    {
      id: "p2",
      text: "편지를 펼치자 깔끔하지만 낯선 필체가 눈에 들어왔다. 거기에는 이렇게 적혀 있었다. 이 편지를 읽는 사람에게, 오늘 하루도 수고했어요. 당신이 힘들 때 혼자라고 느끼지 않았으면 해서 이 짧은 글을 남깁니다. 세상에는 당신 편인 사람이 분명 있습니다. 서준이는 가슴이 뭉클해져서 한참 동안 그 자리에 서서 편지를 다시 읽었다. 마침 은행나무에서 노란 잎이 바람에 흩날렸다."
    },
    {
      id: "p3",
      text: "그날부터 서준이는 매일 학교 끝나고 우체통을 확인했다. 놀랍게도 이틀에 한 번꼴로 새 편지가 꽂혀 있었다. 어떤 편지에는 좋아하는 노래 가사가 적혀 있었고, 어떤 편지에는 수학 문제를 풀다 짜증날 때 심호흡을 세 번 하라는 조언이 담겨 있었다. 또 어떤 편지에는 예쁜 꽃 그림과 함께 오늘도 잘했다는 칭찬이 적혀 있어 서준이의 마음을 따뜻하게 했다. 편지마다 필체가 조금씩 달라서 서준이는 여러 사람이 쓰는 것인지, 한 사람이 기분에 따라 글씨가 바뀌는 것인지 궁금해졌다."
    },
    {
      id: "p4",
      text: "겨울이 다가오자 편지는 더 이상 오지 않았다. 서준이는 아쉬웠지만 이번에는 자신이 편지를 쓰기로 결심했다. 빈 공책을 찢어 짧은 응원의 글을 적은 뒤 우체통에 넣었다. 그 뒤로 며칠이 지나 다시 그 자리를 지나는데, 자신이 넣었던 편지가 사라져 있었다. 누군가 읽어 갔다는 생각에 서준이의 입가에 미소가 번졌다. 낡은 우체통은 여전히 그 자리에 서서, 사람과 사람 사이의 작은 다리가 되고 있었다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "서준이가 처음 편지를 발견한 계절을 찾으세요.",
      [findRange(paragraphs, "p1", "어느 가을날 서준이는 우체통 투입구에 하얀 편지 봉투 한 장이 끼워져 있는 것을 발견했다")]),
    makeConfirmQ("q2", "첫 번째 편지의 핵심 메시지를 찾으세요.",
      [findRange(paragraphs, "p2", "당신이 힘들 때 혼자라고 느끼지 않았으면 해서 이 짧은 글을 남깁니다")]),
    makeConfirmQ("q3", "편지가 꽂혀 있던 빈도를 찾으세요.",
      [findRange(paragraphs, "p3", "이틀에 한 번꼴로 새 편지가 꽂혀 있었다")]),
    makeConfirmQ("q4", "편지에 담겨 있던 조언의 내용을 찾으세요.",
      [findRange(paragraphs, "p3", "수학 문제를 풀다 짜증날 때 심호흡을 세 번 하라는 조언")]),
    makeConfirmQ("q5", "서준이가 직접 편지를 쓰기로 결심한 시점을 찾으세요.",
      [findRange(paragraphs, "p4", "겨울이 다가오자 편지는 더 이상 오지 않았다. 서준이는 아쉬웠지만 이번에는 자신이 편지를 쓰기로 결심했다")]),
    makeConfirmQ("q6", "글 마지막에서 우체통의 상징적 의미를 찾으세요.",
      [findRange(paragraphs, "p4", "낡은 우체통은 여전히 그 자리에 서서, 사람과 사람 사이의 작은 다리가 되고 있었다")]),
    makeConfirmQ("q7", "서준이가 자신의 편지가 읽혔음을 알게 된 정황을 찾으세요.",
      [findRange(paragraphs, "p4", "자신이 넣었던 편지가 사라져 있었다")])
  ];

  const content = assembleFull(302, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// =====================================================
// Day 303 — 홀수 → 비문학 (NONFICTION)
// 주제: 한글 창제의 과학적 원리
// =====================================================
function buildDay303() {
  const paragraphs = [
    {
      id: "p1",
      text: "한글은 1443년 세종대왕이 창제하여 1446년에 반포한 문자 체계로, 창제 원리가 명확히 기록된 세계에서 거의 유일한 문자이다. 세종은 백성이 문자를 몰라 자신의 뜻을 표현하지 못하는 현실을 안타깝게 여겨 누구나 쉽게 배울 수 있는 글자를 만들고자 하였다. 한글의 자음은 발음할 때 혀, 입술, 목구멍 등 발음 기관의 모양을 본떠 만들었으며, 모음은 하늘, 땅, 사람을 상징하는 세 가지 기본 요소의 조합으로 구성되었다."
    },
    {
      id: "p2",
      text: "자음의 기본 글자는 다섯 가지로, 각각의 발음 기관을 형상화하였다. 예를 들어 기역은 혀뿌리가 목구멍을 막는 모양을, 니은은 혀끝이 윗잇몸에 닿는 모양을 본뜬 것이다. 여기에 획을 하나씩 더하면 같은 발음 위치에서 소리가 더 세지는 글자가 만들어진다. 이처럼 한글은 소리와 글자 사이에 체계적인 대응 관계를 갖추고 있어 언어학적으로 매우 과학적인 문자로 평가받는다."
    },
    {
      id: "p3",
      text: "모음은 천지인 삼재의 원리에 따라 설계되었다. 하늘을 상징하는 둥근 점, 땅을 상징하는 가로 획, 사람을 상징하는 세로 획이 기본 요소이며, 이 세 요소의 결합으로 열한 개의 기본 모음이 탄생하였다. 또한 기본 모음을 합쳐 이중 모음까지 표현할 수 있어 적은 수의 글자로 다양한 소리를 나타낼 수 있다는 장점이 있다. 이러한 체계 덕분에 한글은 배우기 쉬우면서도 표현력이 뛰어난 문자로 인정받고 있다."
    },
    {
      id: "p4",
      text: "한글의 과학적 우수성은 디지털 시대에 더욱 빛을 발하고 있다. 자음과 모음을 조합하여 글자를 만드는 구조 덕분에 컴퓨터 자판에서 적은 수의 키만으로도 모든 글자를 입력할 수 있다. 또한 글자가 음소 단위로 분리되므로 음성 인식, 자연어 처리 등 인공지능 기술과의 결합에서도 유리하다. 세종의 창의적인 문자 설계가 수백 년 뒤의 정보 기술 환경에서까지 효용을 발휘하고 있다는 점은 참으로 놀라운 일이다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "한글이 세계에서 유일한 이유를 찾으세요.",
      [findRange(paragraphs, "p1", "창제 원리가 명확히 기록된 세계에서 거의 유일한 문자")]),
    makeConfirmQ("q2", "세종이 한글을 만들고자 한 동기를 찾으세요.",
      [findRange(paragraphs, "p1", "백성이 문자를 몰라 자신의 뜻을 표현하지 못하는 현실을 안타깝게 여겨")]),
    makeConfirmQ("q3", "'기역' 글자의 형상화 원리를 찾으세요.",
      [findRange(paragraphs, "p2", "기역은 혀뿌리가 목구멍을 막는 모양을")]),
    makeConfirmQ("q4", "획을 더하면 어떤 변화가 생기는지 찾으세요.",
      [findRange(paragraphs, "p2", "획을 하나씩 더하면 같은 발음 위치에서 소리가 더 세지는 글자가 만들어진다")]),
    makeConfirmQ("q5", "모음의 세 가지 기본 요소를 찾으세요.",
      [findRange(paragraphs, "p3", "하늘을 상징하는 둥근 점, 땅을 상징하는 가로 획, 사람을 상징하는 세로 획")]),
    makeConfirmQ("q6", "한글이 디지털 시대에 유리한 점을 찾으세요.",
      [findRange(paragraphs, "p4", "자음과 모음을 조합하여 글자를 만드는 구조 덕분에 컴퓨터 자판에서 적은 수의 키만으로도 모든 글자를 입력할 수 있다")])
  ];

  const content = assembleFull(303, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// =====================================================
// 실행
// =====================================================
const results = [
  { dayIndex: 299, ...buildDay299() },
  { dayIndex: 300, ...buildDay300() },
  { dayIndex: 301, ...buildDay301() },
  { dayIndex: 302, ...buildDay302() },
  { dayIndex: 303, ...buildDay303() }
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
  path.join(__dirname, '..', 'generated', 'new', 'batch-f2-299-303.json'),
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
