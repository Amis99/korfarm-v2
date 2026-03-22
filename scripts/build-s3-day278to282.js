const fs = require('fs');
const path = require('path');

// === 공통 유틸 ===
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
    contentId: `dr-s3-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(소쉬르 3) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "SAUSSURE_3", schoolGradeRange: { min: 5, max: 5 },
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
  return { content_type: "DAILY_READING", level_id: "SAUSSURE_3", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// === Day 278 (짝수 -> 문학) ===
function buildDay278() {
  const paragraphs = [
    {
      id: "p1",
      text: "하윤이는 학교 도서관 구석 선반에서 오래된 동화책 한 권을 발견했다. 표지가 낡고 누렇게 변색되어 있었지만 제목이 눈에 들어왔다. '달빛 정원의 비밀'이라는 제목이었다. 하윤이는 호기심에 이끌려 조심스럽게 책을 펼쳤다. 첫 장에는 작은 소녀가 밤마다 은은한 달빛이 비치는 정원에서 꽃들과 이야기를 나눈다는 신비로운 내용이 적혀 있었다. 하윤이는 그 이야기에 금세 빠져들었다."
    },
    {
      id: "p2",
      text: "책 속의 소녀 이름은 별이였다. 별이는 외로운 아이였지만 달빛 정원에 들어서면 모든 꽃들이 반갑게 인사를 해 주었다. 장미는 용기를 북돋아 주는 이야기를 들려주었고 해바라기는 늘 밝은 표정으로 웃음을 선물했다. 어느 날 정원에 찬바람이 불어와 꽃들이 시들기 시작했다. 별이는 꽃들을 살리기 위해 따뜻한 노래를 불렀고 별이의 진심 어린 노래에 정원은 다시 생기를 되찾았다. 하윤이는 별이의 용기가 대단하다고 생각했다."
    },
    {
      id: "p3",
      text: "책의 마지막 장을 덮었을 때 하윤이는 가슴이 따뜻해지는 것을 느꼈다. 하윤이도 별이처럼 주변 사람들에게 따뜻한 말 한마디를 건네고 싶어졌다. 다음 날 하윤이는 평소 혼자 밥을 먹던 같은 반 친구 지수에게 다가가 함께 밥을 먹자고 말했다. 지수는 처음에 놀랐지만 곧 환하게 웃으며 정말 고맙다고 했다. 그 뒤로 둘은 매일 함께 밥을 먹는 사이가 되었다. 하윤이는 작은 용기 하나가 누군가의 하루를 바꿀 수 있다는 것을 깨달았다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "하윤이가 도서관에서 발견한 책의 제목은?", [findRange(paragraphs, "p1", "'달빛 정원의 비밀'이라는 제목이었다.")]),
    makeConfirmQ("q2", "책 속 소녀의 이름은?", [findRange(paragraphs, "p2", "책 속의 소녀 이름은 별이였다.")]),
    makeConfirmQ("q3", "장미가 별이에게 해 준 것은?", [findRange(paragraphs, "p2", "장미는 용기를 북돋아 주는 이야기를 들려주었고")]),
    makeConfirmQ("q4", "정원에 어떤 위기가 찾아왔나요?", [findRange(paragraphs, "p2", "어느 날 정원에 찬바람이 불어와 꽃들이 시들기 시작했다.")]),
    makeConfirmQ("q5", "별이가 꽃들을 살리기 위해 한 일은?", [findRange(paragraphs, "p2", "별이는 꽃들을 살리기 위해 따뜻한 노래를 불렀고 별이의 진심 어린 노래에 정원은 다시 생기를 되찾았다.")]),
    makeConfirmQ("q6", "하윤이가 지수에게 한 행동은?", [findRange(paragraphs, "p3", "하윤이는 평소 혼자 밥을 먹던 같은 반 친구 지수에게 다가가 함께 밥을 먹자고 말했다.")]),
    makeConfirmQ("q7", "하윤이가 깨달은 것은?", [findRange(paragraphs, "p3", "하윤이는 작은 용기 하나가 누군가의 하루를 바꿀 수 있다는 것을 깨달았다.")])
  ];

  return { content: assembleFull(278, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 279 (홀수 -> 비문학) ===
function buildDay279() {
  const paragraphs = [
    {
      id: "p1",
      text: "빛은 우리가 세상을 볼 수 있게 해 주는 에너지이다. 빛은 직진하는 성질을 가지고 있어서 장애물이 없으면 곧바로 나아간다. 하지만 빛이 거울이나 물 표면처럼 매끈한 면에 부딪치면 방향이 바뀌는데 이것을 반사라고 한다. 거울을 보면 자기 얼굴이 보이는 것은 빛이 얼굴에서 거울로 갔다가 다시 눈으로 돌아오기 때문이다. 반사의 원리를 이용하면 빛의 방향을 원하는 곳으로 바꿀 수 있어서 여러 가지 도구에 활용된다."
    },
    {
      id: "p2",
      text: "빛이 공기에서 물속으로 들어갈 때는 속도가 느려지면서 방향이 꺾이는데 이것을 굴절이라고 한다. 물컵에 빨대를 넣으면 빨대가 꺾여 보이는 것이 굴절 때문이다. 렌즈는 이러한 굴절의 원리를 이용한 것이다. 볼록 렌즈는 빛을 한 점으로 모아 주어 돋보기에 사용되고 오목 렌즈는 빛을 퍼지게 하여 근시용 안경에 사용된다. 카메라와 망원경도 렌즈를 이용하여 빛을 조절하는 도구이다."
    },
    {
      id: "p3",
      text: "빛은 여러 가지 색이 섞여 있는데 이것을 가시광선이라고 한다. 비가 온 뒤 하늘에 나타나는 무지개는 햇빛이 빗방울을 통과하면서 여러 색으로 나뉘어 보이는 것이다. 빨간색부터 보라색까지 일곱 가지 색이 무지개를 이루며 이 순서는 빛의 파장 길이에 따라 결정된다. 파장이 긴 빨간색이 바깥쪽에 짧은 보라색이 안쪽에 위치한다. 빛의 성질을 이해하면 우리 생활 속 다양한 현상을 과학적으로 설명할 수 있게 된다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "빛의 직진 성질이란?", [findRange(paragraphs, "p1", "빛은 직진하는 성질을 가지고 있어서 장애물이 없으면 곧바로 나아간다.")]),
    makeConfirmQ("q2", "반사란 무엇인가요?", [findRange(paragraphs, "p1", "빛이 거울이나 물 표면처럼 매끈한 면에 부딪치면 방향이 바뀌는데 이것을 반사라고 한다.")]),
    makeConfirmQ("q3", "거울에서 얼굴이 보이는 원리는?", [findRange(paragraphs, "p1", "거울을 보면 자기 얼굴이 보이는 것은 빛이 얼굴에서 거울로 갔다가 다시 눈으로 돌아오기 때문이다.")]),
    makeConfirmQ("q4", "굴절이란 무엇인가요?", [findRange(paragraphs, "p2", "빛이 공기에서 물속으로 들어갈 때는 속도가 느려지면서 방향이 꺾이는데 이것을 굴절이라고 한다.")]),
    makeConfirmQ("q5", "볼록 렌즈의 용도는?", [findRange(paragraphs, "p2", "볼록 렌즈는 빛을 한 점으로 모아 주어 돋보기에 사용되고")]),
    makeConfirmQ("q6", "무지개가 생기는 원리는?", [findRange(paragraphs, "p3", "비가 온 뒤 하늘에 나타나는 무지개는 햇빛이 빗방울을 통과하면서 여러 색으로 나뉘어 보이는 것이다.")]),
    makeConfirmQ("q7", "무지개 색의 순서를 결정하는 것은?", [findRange(paragraphs, "p3", "이 순서는 빛의 파장 길이에 따라 결정된다.")])
  ];

  return { content: assembleFull(279, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 280 (짝수 -> 문학) ===
function buildDay280() {
  const paragraphs = [
    {
      id: "p1",
      text: "태민이네 반에 전학생이 왔다. 이름은 서진이였고 다른 도시에서 왔다고 했다. 서진이는 첫날부터 말수가 적었고 쉬는 시간에도 자리에 혼자 앉아 책만 읽었다. 아이들은 서진이가 차가운 아이라고 수군거렸다. 태민이도 처음에는 서진이에게 말을 걸기가 어려웠다. 하지만 체육 시간에 짝이 되면서 서진이와 조금씩 가까워지게 되었다."
    },
    {
      id: "p2",
      text: "체육 시간에 피구를 하는데 서진이는 공을 잘 던지지 못해 아이들에게 놀림을 받았다. 태민이는 괜찮아 다음에 잘하면 된다고 서진이를 위로했다. 서진이는 고개를 숙인 채 고맙다고 작은 목소리로 말했다. 그 뒤로 서진이는 태민이에게 조금씩 마음을 열기 시작했다. 점심시간에 함께 밥을 먹고 좋아하는 책 이야기를 나누었다. 서진이가 좋아하는 책은 우주에 관한 과학책이었고 별과 행성에 대해 놀랍도록 많은 것을 알고 있었다."
    },
    {
      id: "p3",
      text: "어느 날 과학 수업에서 태양계에 대한 발표를 하게 되었다. 아이들이 어려워하는 가운데 서진이가 손을 들고 나가 막힘없이 설명했다. 토성의 고리는 얼음과 돌 조각으로 이루어져 있다는 이야기에 반 아이들 모두 놀라며 박수를 쳤다. 그날 이후 아이들은 서진이에게 먼저 말을 걸기 시작했다. 태민이는 사람을 겉모습이나 첫인상으로 판단하면 안 된다는 것을 알게 되었다. 서진이는 말이 적었을 뿐 마음속에는 넓은 우주만큼 많은 이야기를 품고 있었다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "서진이가 전학 첫날 보인 모습은?", [findRange(paragraphs, "p1", "서진이는 첫날부터 말수가 적었고 쉬는 시간에도 자리에 혼자 앉아 책만 읽었다.")]),
    makeConfirmQ("q2", "태민이와 서진이가 가까워진 계기는?", [findRange(paragraphs, "p1", "체육 시간에 짝이 되면서 서진이와 조금씩 가까워지게 되었다.")]),
    makeConfirmQ("q3", "체육 시간에 서진이에게 일어난 일은?", [findRange(paragraphs, "p2", "체육 시간에 피구를 하는데 서진이는 공을 잘 던지지 못해 아이들에게 놀림을 받았다.")]),
    makeConfirmQ("q4", "서진이가 좋아하는 책의 종류는?", [findRange(paragraphs, "p2", "서진이가 좋아하는 책은 우주에 관한 과학책이었고 별과 행성에 대해 놀랍도록 많은 것을 알고 있었다.")]),
    makeConfirmQ("q5", "서진이가 발표한 내용은?", [findRange(paragraphs, "p3", "토성의 고리는 얼음과 돌 조각으로 이루어져 있다는 이야기에 반 아이들 모두 놀라며 박수를 쳤다.")]),
    makeConfirmQ("q6", "발표 이후 아이들의 변화는?", [findRange(paragraphs, "p3", "그날 이후 아이들은 서진이에게 먼저 말을 걸기 시작했다.")]),
    makeConfirmQ("q7", "태민이가 깨달은 점은?", [findRange(paragraphs, "p3", "태민이는 사람을 겉모습이나 첫인상으로 판단하면 안 된다는 것을 알게 되었다.")])
  ];

  return { content: assembleFull(280, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 281 (홀수 -> 비문학) ===
function buildDay281() {
  const paragraphs = [
    {
      id: "p1",
      text: "종이는 우리 생활에서 매우 중요한 재료이다. 종이가 발명되기 전에는 대나무 조각이나 비단 천에 글을 썼는데 대나무는 무겁고 비단은 비쌌다. 기원전 105년경 중국의 채륜이라는 사람이 나무껍질과 헝겊 조각을 물에 풀어 얇게 펴서 말리는 방법으로 종이를 만들었다. 이 발명 덕분에 글을 쓰고 기록을 남기는 일이 훨씬 쉬워졌다. 종이의 발명은 인류 문명 발전에 큰 영향을 준 중요한 사건이다."
    },
    {
      id: "p2",
      text: "오늘날 종이는 주로 나무에서 얻은 펄프로 만든다. 나무를 잘게 부수고 물과 섞어 죽처럼 만든 것이 펄프이다. 이 펄프를 얇게 펴서 압착하고 건조하면 종이가 완성된다. 종이는 책과 신문뿐만 아니라 포장지, 화장지, 종이컵 등 다양한 형태로 사용된다. 하지만 종이를 만들기 위해 많은 나무가 베어지고 있어 환경 문제가 발생하고 있다. 나무 한 그루로 만들 수 있는 종이의 양은 약 팔천 장 정도이다."
    },
    {
      id: "p3",
      text: "종이를 아껴 쓰고 재활용하는 것은 환경을 보호하는 중요한 방법이다. 다 쓴 종이를 모아 재활용하면 새 종이를 만드는 것보다 나무와 물, 에너지를 크게 줄일 수 있다. 종이 한 톤을 재활용하면 나무 약 스무 그루를 살릴 수 있다고 한다. 또한 이면지를 활용하거나 디지털 기기를 이용해 종이 사용량을 줄이는 노력도 필요하다. 작은 실천이 모이면 숲을 지키고 지구 환경을 보전하는 큰 힘이 될 수 있다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "종이가 발명되기 전에 글을 쓰던 재료는?", [findRange(paragraphs, "p1", "종이가 발명되기 전에는 대나무 조각이나 비단 천에 글을 썼는데 대나무는 무겁고 비단은 비쌌다.")]),
    makeConfirmQ("q2", "종이를 발명한 사람은 누구인가요?", [findRange(paragraphs, "p1", "기원전 105년경 중국의 채륜이라는 사람이 나무껍질과 헝겊 조각을 물에 풀어 얇게 펴서 말리는 방법으로 종이를 만들었다.")]),
    makeConfirmQ("q3", "펄프란 무엇인가요?", [findRange(paragraphs, "p2", "나무를 잘게 부수고 물과 섞어 죽처럼 만든 것이 펄프이다.")]),
    makeConfirmQ("q4", "종이 생산으로 인한 환경 문제는?", [findRange(paragraphs, "p2", "종이를 만들기 위해 많은 나무가 베어지고 있어 환경 문제가 발생하고 있다.")]),
    makeConfirmQ("q5", "나무 한 그루로 만들 수 있는 종이의 양은?", [findRange(paragraphs, "p2", "나무 한 그루로 만들 수 있는 종이의 양은 약 팔천 장 정도이다.")]),
    makeConfirmQ("q6", "종이 재활용의 효과는?", [findRange(paragraphs, "p3", "종이 한 톤을 재활용하면 나무 약 스무 그루를 살릴 수 있다고 한다.")]),
    makeConfirmQ("q7", "종이 사용을 줄이는 방법은?", [findRange(paragraphs, "p3", "이면지를 활용하거나 디지털 기기를 이용해 종이 사용량을 줄이는 노력도 필요하다.")])
  ];

  return { content: assembleFull(281, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 282 (짝수 -> 문학) ===
function buildDay282() {
  const paragraphs = [
    {
      id: "p1",
      text: "수아는 피아노 학원을 그만두고 싶었다. 매일 같은 곡을 반복해서 치는 것이 지겹고 손가락도 아팠다. 특히 다음 달에 있는 발표회가 부담스러웠다. 수아는 엄마에게 피아노를 그만두겠다고 말했다. 엄마는 잠시 생각하시더니 발표회까지만 해 보고 그때 가서 다시 결정하자고 하셨다. 수아는 마지못해 알겠다고 대답했지만 마음은 여전히 무거웠다."
    },
    {
      id: "p2",
      text: "발표회까지 한 달이 남았다. 수아는 억지로 연습을 하다가 어느 날 선생님이 들려주신 곡에 마음이 끌렸다. 그 곡은 쇼팽의 왈츠였는데 가볍고 경쾌한 멜로디가 봄바람처럼 느껴졌다. 선생님은 수아에게 그 곡을 발표회에서 연주해 보겠느냐고 물으셨다. 수아는 망설이다가 해 보겠다고 대답했다. 좋아하는 곡을 치니 연습이 조금씩 즐거워졌다. 틀리는 부분이 있어도 다시 치고 싶은 마음이 들었다."
    },
    {
      id: "p3",
      text: "드디어 발표회 날이 왔다. 수아는 무대 위에서 떨리는 손가락으로 조심스럽게 첫 음을 눌렀다. 처음 몇 마디는 긴장해서 살짝 실수했지만 곧 곡에 빠져들었다. 경쾌한 멜로디가 공연장을 가득 채우자 관객들이 고개를 끄덕이며 들어 주었다. 연주가 끝나고 우레와 같은 박수 소리가 터져 나왔을 때 수아는 눈물이 핑 돌았다. 무대를 내려온 수아는 엄마에게 말했다. 피아노를 조금 더 배워 보고 싶다고. 좋아하는 곡을 찾으니 음악이 완전히 다르게 느껴진다고 웃으며 말했다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "수아가 피아노를 그만두고 싶었던 이유는?", [findRange(paragraphs, "p1", "매일 같은 곡을 반복해서 치는 것이 지겹고 손가락도 아팠다.")]),
    makeConfirmQ("q2", "엄마가 수아에게 제안한 것은?", [findRange(paragraphs, "p1", "엄마는 잠시 생각하시더니 발표회까지만 해 보고 그때 가서 다시 결정하자고 하셨다.")]),
    makeConfirmQ("q3", "수아의 마음을 끈 곡은?", [findRange(paragraphs, "p2", "그 곡은 쇼팽의 왈츠였는데 가볍고 경쾌한 멜로디가 봄바람처럼 느껴졌다.")]),
    makeConfirmQ("q4", "좋아하는 곡을 치면서 달라진 점은?", [findRange(paragraphs, "p2", "좋아하는 곡을 치니 연습이 조금씩 즐거워졌다.")]),
    makeConfirmQ("q5", "발표회에서 수아의 연주 모습은?", [findRange(paragraphs, "p3", "처음 몇 마디는 긴장해서 살짝 실수했지만 곧 곡에 빠져들었다.")]),
    makeConfirmQ("q6", "연주가 끝난 뒤 수아의 반응은?", [findRange(paragraphs, "p3", "연주가 끝나고 우레와 같은 박수 소리가 터져 나왔을 때 수아는 눈물이 핑 돌았다.")]),
    makeConfirmQ("q7", "수아가 엄마에게 한 말은?", [findRange(paragraphs, "p3", "피아노를 조금 더 배워 보고 싶다고.")])
  ];

  return { content: assembleFull(282, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === 실행부 ===
const results = [
  { dayIndex: 278, ...buildDay278() },
  { dayIndex: 279, ...buildDay279() },
  { dayIndex: 280, ...buildDay280() },
  { dayIndex: 281, ...buildDay281() },
  { dayIndex: 282, ...buildDay282() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

const newDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
fs.writeFileSync(
  path.join(newDir, 'batch-s3-278-282.json'),
  JSON.stringify(batchItems, null, 2), 'utf8'
);
console.log(`  ✅ batch-s3-278-282.json 저장 완료`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
