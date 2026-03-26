const fs = require('fs');
const path = require('path');

// ── 공통 유틸 ──
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
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] }
      });
    });
    stepNum++;
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] }
    });
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
    contentId: `dr-s3-${nn}`,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(소쉬르 3) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "SAUSSURE_3",
    schoolGradeRange: { min: 5, max: 5 },
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
    level_id: "SAUSSURE_3",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content
  };
}

// ── Day 268 (짝수 → 문학) ──
function buildDay268() {
  const paragraphs = [
    {
      id: "p1",
      text: "할아버지의 서재에는 오래된 벽시계가 하나 있었다. 나무로 만들어진 그 시계는 세월의 흔적이 고스란히 남아 있었지만 여전히 정확하게 시간을 알려 주었다. 시계는 매 시간마다 종을 울렸고 그 소리는 집 안 구석구석까지 퍼져 나갔다. 어린 시절 나는 그 종소리가 무서워서 귀를 막곤 했다. 하지만 할아버지는 늘 웃으시며 말씀하셨다. 시간이 지나고 있다는 것은 우리가 살아 있다는 뜻이란다. 그때는 그 말의 의미를 알지 못했다."
    },
    {
      id: "p2",
      text: "할아버지가 돌아가신 뒤 빈 서재에 홀로 들어갔다. 먼지가 쌓인 책상과 낡은 의자 사이에서 벽시계만이 여전히 똑딱거리고 있었다. 나는 시계 앞에 서서 한참을 바라보았다. 문득 할아버지의 목소리가 들리는 것 같았다. 시계 바늘이 가리키는 숫자 하나하나가 할아버지와 함께했던 시간처럼 느껴졌다. 서재를 가득 채우던 책 냄새와 할아버지의 따뜻한 미소가 떠올랐다. 창문 사이로 들어오는 햇살이 시계 위에 내려앉아 금빛으로 빛나고 있었다."
    },
    {
      id: "p3",
      text: "나는 벽시계를 내 방으로 가져왔다. 밤마다 종소리가 울릴 때면 할아버지가 곁에 계신 것처럼 마음이 편안해졌다. 어린 시절 무섭다고 귀를 막았던 소리가 이제는 가장 그리운 소리가 되었다. 시간은 멈추지 않고 흐르지만 추억은 마음속에 영원히 남는다는 것을 깨달았다. 벽시계의 종소리는 할아버지가 내게 남겨 주신 마지막 선물이었다. 나는 그 소리를 들으며 할아버지와 보냈던 따뜻한 날들을 하나하나 떠올려 보았다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "할아버지의 서재에는 어떤 물건이 있었나요?", [findRange(paragraphs, "p1", "할아버지의 서재에는 오래된 벽시계가 하나 있었다.")]),
    makeConfirmQ("q2", "어린 시절 '나'는 종소리에 어떤 반응을 보였나요?", [findRange(paragraphs, "p1", "어린 시절 나는 그 종소리가 무서워서 귀를 막곤 했다.")]),
    makeConfirmQ("q3", "할아버지가 시계의 종소리에 대해 하신 말씀은?", [findRange(paragraphs, "p1", "시간이 지나고 있다는 것은 우리가 살아 있다는 뜻이란다.")]),
    makeConfirmQ("q4", "빈 서재에서 여전히 작동하고 있던 것은?", [findRange(paragraphs, "p2", "벽시계만이 여전히 똑딱거리고 있었다.")]),
    makeConfirmQ("q5", "시계 바늘을 보며 무엇이 떠올랐나요?", [findRange(paragraphs, "p2", "시계 바늘이 가리키는 숫자 하나하나가 할아버지와 함께했던 시간처럼 느껴졌다.")]),
    makeConfirmQ("q6", "벽시계를 가져온 뒤 종소리를 들으면 어떤 기분이 들었나요?", [findRange(paragraphs, "p3", "밤마다 종소리가 울릴 때면 할아버지가 곁에 계신 것처럼 마음이 편안해졌다.")]),
    makeConfirmQ("q7", "'나'가 깨달은 것은 무엇인가요?", [findRange(paragraphs, "p3", "시간은 멈추지 않고 흐르지만 추억은 마음속에 영원히 남는다는 것을 깨달았다.")])
  ];

  return { content: assembleFull(268, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ── Day 269 (홀수 → 비문학) ──
function buildDay269() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리 몸의 뼈는 단순히 몸을 지탱하는 역할만 하는 것이 아니다. 뼈는 칼슘과 인 같은 중요한 무기질을 저장하는 창고 역할도 한다. 또한 뼈의 안쪽에 있는 골수에서는 혈액을 만드는 일이 이루어진다. 적혈구와 백혈구 같은 혈액 세포가 모두 골수에서 만들어지기 때문에 뼈는 생명 유지에 매우 중요한 기관이다. 사람의 몸에는 약 206개의 뼈가 있으며 이 뼈들이 서로 연결되어 우리 몸의 기본 틀을 이루고 있다."
    },
    {
      id: "p2",
      text: "뼈는 살아 있는 조직이기 때문에 끊임없이 변화한다. 오래된 뼈 조직은 파골세포에 의해 분해되고 새로운 뼈 조직은 조골세포에 의해 만들어진다. 이 과정을 골 재형성이라고 부르는데 약 10년에 걸쳐 우리 몸의 뼈가 완전히 새것으로 바뀐다고 한다. 어린이와 청소년기에는 뼈가 만들어지는 속도가 분해되는 속도보다 빨라서 뼈가 점점 단단해지고 길어진다. 하지만 나이가 들면 분해 속도가 빨라져 뼈가 약해질 수 있다."
    },
    {
      id: "p3",
      text: "뼈를 건강하게 유지하려면 칼슘이 풍부한 음식을 먹는 것이 중요하다. 우유와 치즈 같은 유제품은 물론이고 멸치나 시금치에도 칼슘이 많이 들어 있다. 또한 비타민 D는 칼슘이 뼈에 흡수되는 것을 도와주므로 햇볕을 적절히 쬐는 것도 좋은 방법이다. 규칙적인 운동은 뼈에 자극을 주어 뼈를 더 단단하게 만들어 준다. 어린 시절부터 뼈 건강에 관심을 가지면 나이가 들어서도 튼튼한 몸을 유지할 수 있다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "뼈가 저장하는 중요한 무기질에는 무엇이 있나요?", [findRange(paragraphs, "p1", "뼈는 칼슘과 인 같은 중요한 무기질을 저장하는 창고 역할도 한다.")]),
    makeConfirmQ("q2", "골수에서 이루어지는 일은 무엇인가요?", [findRange(paragraphs, "p1", "뼈의 안쪽에 있는 골수에서는 혈액을 만드는 일이 이루어진다.")]),
    makeConfirmQ("q3", "사람의 몸에는 뼈가 몇 개 있나요?", [findRange(paragraphs, "p1", "사람의 몸에는 약 206개의 뼈가 있으며")]),
    makeConfirmQ("q4", "골 재형성이란 무엇인가요?", [findRange(paragraphs, "p2", "오래된 뼈 조직은 파골세포에 의해 분해되고 새로운 뼈 조직은 조골세포에 의해 만들어진다.")]),
    makeConfirmQ("q5", "어린이와 청소년기에 뼈가 단단해지는 이유는?", [findRange(paragraphs, "p2", "어린이와 청소년기에는 뼈가 만들어지는 속도가 분해되는 속도보다 빨라서 뼈가 점점 단단해지고 길어진다.")]),
    makeConfirmQ("q6", "비타민 D의 역할은 무엇인가요?", [findRange(paragraphs, "p3", "비타민 D는 칼슘이 뼈에 흡수되는 것을 도와주므로 햇볕을 적절히 쬐는 것도 좋은 방법이다.")]),
    makeConfirmQ("q7", "규칙적인 운동이 뼈에 미치는 영향은?", [findRange(paragraphs, "p3", "규칙적인 운동은 뼈에 자극을 주어 뼈를 더 단단하게 만들어 준다.")])
  ];

  return { content: assembleFull(269, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ── Day 270 (짝수 → 문학) ──
function buildDay270() {
  const paragraphs = [
    {
      id: "p1",
      text: "마을 뒷산 꼭대기에는 커다란 느티나무 한 그루가 서 있었다. 마을 사람들은 그 나무를 할머니 나무라고 불렀다. 수백 년 전부터 그 자리를 지켜 온 나무는 굵은 줄기와 넓게 펼쳐진 가지로 마을 어디에서나 눈에 들어왔다. 여름이면 짙은 그늘을 만들어 쉼터가 되어 주었고 가을이면 노란 잎을 하나씩 떨구며 계절이 바뀌었음을 알려 주었다. 마을 아이들은 나무 아래에서 뛰어놀며 즐거운 시간을 보내곤 했다."
    },
    {
      id: "p2",
      text: "어느 겨울 밤 거센 바람이 불더니 할머니 나무의 큰 가지 하나가 부러져 떨어졌다. 아침이 되어 소식을 들은 마을 사람들은 하나둘 산에 올라갔다. 부러진 가지를 바라보며 어르신들은 걱정스러운 표정을 지었다. 하지만 나무의 줄기는 여전히 단단했고 남은 가지들은 하늘을 향해 곧게 뻗어 있었다. 봄이 오면 다시 새 가지가 돋아날 것이라고 마을 이장님이 말씀하셨다. 마을 사람들은 부러진 가지를 정리하고 나무 둘레에 보호 울타리를 세워 주었다."
    },
    {
      id: "p3",
      text: "정말로 봄이 되자 부러진 자리 옆에서 새 가지가 돋아나기 시작했다. 연초록 잎이 하나둘 펼쳐지자 마을 사람들은 모두 환하게 웃었다. 아이들은 나무 아래 모여 새로 돋아난 잎의 수를 세기도 했다. 할머니 나무는 상처를 입었지만 포기하지 않고 다시 자라났다. 마을 사람들은 그 모습에서 어려운 일이 생겨도 다시 일어설 수 있다는 희망을 보았다. 할머니 나무는 오늘도 마을을 내려다보며 묵묵히 서 있다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "마을 사람들이 느티나무를 부르던 이름은?", [findRange(paragraphs, "p1", "마을 사람들은 그 나무를 할머니 나무라고 불렀다.")]),
    makeConfirmQ("q2", "느티나무가 여름에 해주는 역할은?", [findRange(paragraphs, "p1", "여름이면 짙은 그늘을 만들어 쉼터가 되어 주었고")]),
    makeConfirmQ("q3", "겨울 밤에 할머니 나무에 무슨 일이 일어났나요?", [findRange(paragraphs, "p2", "거센 바람이 불더니 할머니 나무의 큰 가지 하나가 부러져 떨어졌다.")]),
    makeConfirmQ("q4", "부러진 가지를 보고 나무의 상태는 어떠했나요?", [findRange(paragraphs, "p2", "나무의 줄기는 여전히 단단했고 남은 가지들은 하늘을 향해 곧게 뻗어 있었다.")]),
    makeConfirmQ("q5", "봄이 되자 부러진 자리에서 무슨 변화가 생겼나요?", [findRange(paragraphs, "p3", "부러진 자리 옆에서 새 가지가 돋아나기 시작했다.")]),
    makeConfirmQ("q6", "아이들은 나무 아래에서 무엇을 했나요?", [findRange(paragraphs, "p3", "아이들은 나무 아래 모여 새로 돋아난 잎의 수를 세기도 했다.")]),
    makeConfirmQ("q7", "마을 사람들이 할머니 나무에서 본 것은?", [findRange(paragraphs, "p3", "어려운 일이 생겨도 다시 일어설 수 있다는 희망을 보았다.")])
  ];

  return { content: assembleFull(270, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ── Day 271 (홀수 → 비문학) ──
function buildDay271() {
  const paragraphs = [
    {
      id: "p1",
      text: "지구의 바다는 전체 지구 표면의 약 71퍼센트를 차지하고 있다. 바다는 크게 태평양, 대서양, 인도양, 북극해, 남극해의 다섯 개로 나뉜다. 이 중 가장 넓은 바다는 태평양으로 지구 전체 바다 면적의 약 절반을 차지한다. 바다의 평균 깊이는 약 3천7백 미터이며 가장 깊은 곳은 태평양의 마리아나 해구로 약 1만1천 미터에 이른다. 바다는 지구의 기후를 조절하고 수많은 생물의 터전이 되는 중요한 공간이다."
    },
    {
      id: "p2",
      text: "바닷물에는 다양한 물질이 녹아 있는데 그중 가장 많은 것이 소금이다. 바닷물 1리터에는 약 35그램의 소금이 녹아 있으며 이를 염분이라고 부른다. 바다의 염분은 지역마다 다르다. 비가 많이 내리는 적도 부근에서는 염분이 낮고 증발이 활발한 아열대 지역에서는 염분이 높다. 바다에 사는 물고기와 해양 생물들은 이러한 염분에 적응하여 살아가고 있다. 민물에 사는 물고기를 바닷물에 넣으면 살 수 없는 것은 이 때문이다."
    },
    {
      id: "p3",
      text: "바다는 지구 온난화를 막는 중요한 역할을 한다. 바다는 대기 중의 이산화 탄소를 흡수하여 온실 효과를 줄여 주고 태양열을 저장했다가 서서히 내보내면서 기온 변화를 완만하게 만든다. 또한 바다에서 증발한 수증기가 구름이 되어 비를 내리게 하므로 지구의 물 순환에도 핵심적인 역할을 담당한다. 하지만 최근 해양 오염과 수온 상승으로 바다 생태계가 위협받고 있어 바다를 보호하기 위한 노력이 필요하다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "바다가 지구 표면에서 차지하는 비율은?", [findRange(paragraphs, "p1", "지구의 바다는 전체 지구 표면의 약 71퍼센트를 차지하고 있다.")]),
    makeConfirmQ("q2", "가장 넓은 바다와 그 비율은?", [findRange(paragraphs, "p1", "가장 넓은 바다는 태평양으로 지구 전체 바다 면적의 약 절반을 차지한다.")]),
    makeConfirmQ("q3", "가장 깊은 바다는 어디인가요?", [findRange(paragraphs, "p1", "가장 깊은 곳은 태평양의 마리아나 해구로 약 1만1천 미터에 이른다.")]),
    makeConfirmQ("q4", "바닷물 1리터에 녹아 있는 소금의 양은?", [findRange(paragraphs, "p2", "바닷물 1리터에는 약 35그램의 소금이 녹아 있으며 이를 염분이라고 부른다.")]),
    makeConfirmQ("q5", "염분이 높은 지역과 낮은 지역의 차이는?", [findRange(paragraphs, "p2", "비가 많이 내리는 적도 부근에서는 염분이 낮고 증발이 활발한 아열대 지역에서는 염분이 높다.")]),
    makeConfirmQ("q6", "바다가 온실 효과를 줄이는 방법은?", [findRange(paragraphs, "p3", "바다는 대기 중의 이산화 탄소를 흡수하여 온실 효과를 줄여 주고")]),
    makeConfirmQ("q7", "바다 생태계가 위협받는 원인은?", [findRange(paragraphs, "p3", "해양 오염과 수온 상승으로 바다 생태계가 위협받고 있어")])
  ];

  return { content: assembleFull(271, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ── Day 272 (짝수 → 문학) ──
function buildDay272() {
  const paragraphs = [
    {
      id: "p1",
      text: "소녀는 매일 아침 학교 가는 길에 작은 빵집 앞을 지나갔다. 유리창 너머로 갓 구운 빵들이 가지런히 놓여 있었고 고소한 냄새가 바람을 타고 흘러나왔다. 소녀는 빵집 할아버지가 반죽을 치대고 오븐에 빵을 넣는 모습을 구경하는 것을 좋아했다. 할아버지는 소녀를 볼 때마다 손을 흔들어 주셨고 가끔은 작은 쿠키 하나를 건네주시곤 했다. 빵집에서 흘러나오는 따뜻한 냄새는 소녀에게 하루를 시작하는 행복한 인사와도 같았다."
    },
    {
      id: "p2",
      text: "어느 날 빵집 문에 곧 문을 닫습니다라는 안내문이 붙었다. 소녀는 그 글씨를 보고 한참 동안 서 있었다. 할아버지가 이제 힘이 들어서 빵을 만들기 어렵다고 하셨다. 소녀는 집에 돌아와 엄마에게 이 소식을 전했다. 엄마는 할아버지께서 오랫동안 마을 사람들에게 맛있는 빵을 만들어 주셨으니 이제 쉬셔야 한다고 말씀하셨다. 소녀는 고개를 끄덕이면서도 마음 한구석이 허전했다."
    },
    {
      id: "p3",
      text: "빵집이 문을 닫는 마지막 날 소녀는 편지를 한 통 썼다. 할아버지 덕분에 매일 아침이 행복했습니다라고 적었다. 할아버지는 편지를 읽고 눈시울을 붉히셨다. 그리고는 소녀에게 자신이 가장 아끼는 빵 만드는 비법이 적힌 작은 수첩을 건네주셨다. 나중에 네가 맛있는 빵을 만들어 사람들에게 행복을 전해 주렴 하고 웃으셨다. 소녀는 수첩을 가슴에 꼭 안았다. 빵집은 문을 닫았지만 할아버지의 따뜻한 마음은 소녀의 가슴속에 남아 오래도록 향기를 풍겼다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "소녀가 빵집에서 좋아했던 것은?", [findRange(paragraphs, "p1", "소녀는 빵집 할아버지가 반죽을 치대고 오븐에 빵을 넣는 모습을 구경하는 것을 좋아했다.")]),
    makeConfirmQ("q2", "할아버지가 소녀에게 가끔 해주시던 것은?", [findRange(paragraphs, "p1", "할아버지는 소녀를 볼 때마다 손을 흔들어 주셨고 가끔은 작은 쿠키 하나를 건네주시곤 했다.")]),
    makeConfirmQ("q3", "빵집 문에 붙은 안내문의 내용은?", [findRange(paragraphs, "p2", "곧 문을 닫습니다라는 안내문이 붙었다.")]),
    makeConfirmQ("q4", "할아버지가 빵집을 닫는 이유는?", [findRange(paragraphs, "p2", "할아버지가 이제 힘이 들어서 빵을 만들기 어렵다고 하셨다.")]),
    makeConfirmQ("q5", "소녀가 마지막 날 할아버지에게 한 일은?", [findRange(paragraphs, "p3", "소녀는 편지를 한 통 썼다.")]),
    makeConfirmQ("q6", "할아버지가 소녀에게 건네준 것은?", [findRange(paragraphs, "p3", "자신이 가장 아끼는 빵 만드는 비법이 적힌 작은 수첩을 건네주셨다.")]),
    makeConfirmQ("q7", "빵집이 문을 닫은 뒤에도 남은 것은?", [findRange(paragraphs, "p3", "할아버지의 따뜻한 마음은 소녀의 가슴속에 남아 오래도록 향기를 풍겼다.")])
  ];

  return { content: assembleFull(272, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ── 실행부 ──
const results = [
  { dayIndex: 268, ...buildDay268() },
  { dayIndex: 269, ...buildDay269() },
  { dayIndex: 270, ...buildDay270() },
  { dayIndex: 271, ...buildDay271() },
  { dayIndex: 272, ...buildDay272() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
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
fs.writeFileSync(path.join(newDir, 'batch-s3-268-272.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log('  ✅ generated/new/batch-s3-268-272.json');

console.log('\n── 검증 ──');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
