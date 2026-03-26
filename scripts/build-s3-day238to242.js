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

// ─── Day 238 (짝수 → 문학) ───
function buildDay238() {
  const paragraphs = [
    {
      id: "p1",
      text: "지호는 토요일 아침마다 아버지와 함께 동네 뒷산에 오르는 것이 습관이었다. 그날도 해가 뜨기 전에 일어나 등산화 끈을 조이고 집을 나섰다. 새벽 공기가 코끝을 시원하게 적셔 주었다. 산 입구에 도착하니 안개가 옅게 깔려 있었다. 나뭇잎 사이로 이슬방울이 반짝이고 있었다. 아버지가 오늘은 정상까지 가 보자고 하셨다. 지호는 살짝 긴장했지만 아버지 손을 꼭 잡고 발걸음을 옮겼다."
    },
    {
      id: "p2",
      text: "산길은 처음에는 완만했지만 중턱을 지나자 돌멩이가 많아지고 경사가 가팔라졌다. 지호는 다리가 떨려서 잠깐 쉬자고 말했다. 아버지가 바위에 앉아 물통을 건네며 조금만 더 가면 전망대가 나온다고 격려하셨다. 지호는 물을 한 모금 마시고 다시 걸었다. 나무 계단을 오르자 갑자기 시야가 탁 트였다. 발아래로 동네 풍경이 작은 장난감처럼 펼쳐져 있었다. 지호는 자기도 모르게 와 하고 감탄사를 내뱉었다."
    },
    {
      id: "p3",
      text: "전망대에서 좀 더 올라가자 드디어 정상에 도착했다. 정상석 옆에서 아버지와 나란히 서서 사진을 찍었다. 멀리 보이는 강줄기가 은빛으로 빛나고 있었다. 바람이 불 때마다 땀이 식으면서 기분이 상쾌해졌다. 아버지가 힘들었지만 끝까지 올라와서 대단하다고 칭찬하셨다. 지호는 포기하지 않으면 멋진 풍경을 볼 수 있다는 것을 배웠다. 다음 주에는 친구도 데려와야겠다고 마음먹으며 환한 미소를 지으며 산을 내려왔다."
    }
  ];
  console.log(`Day 238 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "지호가 토요일 아침마다 하는 일은?", [findRange(paragraphs, "p1", "지호는 토요일 아침마다 아버지와 함께 동네 뒷산에 오르는 것이 습관이었다")]),
    makeConfirmQ("q2", "산 입구에 도착했을 때 모습은?", [findRange(paragraphs, "p1", "산 입구에 도착하니 안개가 옅게 깔려 있었다")]),
    makeConfirmQ("q3", "지호가 중턱에서 한 행동은?", [findRange(paragraphs, "p2", "지호는 다리가 떨려서 잠깐 쉬자고 말했다")]),
    makeConfirmQ("q4", "나무 계단을 오르자 어떤 모습이 보였나요?", [findRange(paragraphs, "p2", "발아래로 동네 풍경이 작은 장난감처럼 펼쳐져 있었다")]),
    makeConfirmQ("q5", "정상에서 멀리 보이는 것은?", [findRange(paragraphs, "p3", "멀리 보이는 강줄기가 은빛으로 빛나고 있었다")]),
    makeConfirmQ("q6", "아버지가 지호에게 한 칭찬은?", [findRange(paragraphs, "p3", "힘들었지만 끝까지 올라와서 대단하다고 칭찬하셨다")]),
    makeConfirmQ("q7", "지호가 등산에서 배운 것은?", [findRange(paragraphs, "p3", "지호는 포기하지 않으면 멋진 풍경을 볼 수 있다는 것을 배웠다")])
  ];

  return { content: assembleFull(238, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ─── Day 239 (홀수 → 비문학) ───
function buildDay239() {
  const paragraphs = [
    {
      id: "p1",
      text: "지구의 표면은 하나로 이어진 것이 아니라 여러 개의 커다란 판으로 나뉘어 있다. 이 판들을 지각판이라고 부르며 지금도 아주 느린 속도로 움직이고 있다. 지각판이 움직이는 속도는 일 년에 손톱이 자라는 정도인 약 이 센티미터에서 오 센티미터이다. 느린 것 같지만 수백만 년이 쌓이면 대륙의 위치가 크게 바뀌게 된다. 옛날에는 모든 대륙이 하나로 붙어 있었다는 학설이 있다. 이 거대한 대륙을 판게아라고 부른다. 판게아가 서서히 갈라지면서 오늘날의 여러 대륙이 만들어졌다."
    },
    {
      id: "p2",
      text: "지각판이 서로 부딪치는 곳에서는 큰 힘이 생긴다. 이 힘 때문에 땅이 솟아올라 산맥이 만들어지기도 한다. 히말라야산맥은 인도판과 유라시아판이 부딪쳐서 생긴 산맥이다. 또한 지각판이 어긋나면서 미끄러지면 지진이 발생한다. 지진은 땅이 갑자기 흔들리는 현상으로 건물이 무너지거나 도로가 갈라질 수 있다. 바다 밑에서 지진이 일어나면 큰 파도인 쓰나미가 생기기도 한다. 이처럼 지각판의 움직임은 지구 표면에 다양한 변화를 가져온다."
    },
    {
      id: "p3",
      text: "지각판이 벌어지는 곳에서는 또 다른 현상이 나타난다. 땅속 깊은 곳의 뜨거운 암석이 녹아서 마그마가 되어 틈 사이로 올라온다. 이 마그마가 지표면 위로 뿜어져 나오면 화산 폭발이 일어난다. 화산 활동은 새로운 섬을 만들어 내기도 한다. 하와이 섬은 바다 밑 화산이 분출하면서 만들어진 대표적인 화산섬이다. 과학자들은 지각판의 움직임을 관측하여 지진과 화산을 예측하려고 노력하고 있다."
    }
  ];
  console.log(`Day 239 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "지구 표면을 이루는 큰 판을 무엇이라고 부르나요?", [findRange(paragraphs, "p1", "이 판들을 지각판이라고 부르며 지금도 아주 느린 속도로 움직이고 있다")]),
    makeConfirmQ("q2", "옛날에 모든 대륙이 하나로 붙어 있던 것을 무엇이라고 하나요?", [findRange(paragraphs, "p1", "이 거대한 대륙을 판게아라고 부른다")]),
    makeConfirmQ("q3", "히말라야산맥은 어떻게 만들어졌나요?", [findRange(paragraphs, "p2", "히말라야산맥은 인도판과 유라시아판이 부딪쳐서 생긴 산맥이다")]),
    makeConfirmQ("q4", "지진은 어떤 현상인가요?", [findRange(paragraphs, "p2", "지진은 땅이 갑자기 흔들리는 현상으로 건물이 무너지거나 도로가 갈라질 수 있다")]),
    makeConfirmQ("q5", "바다 밑 지진이 일어나면 무엇이 생기나요?", [findRange(paragraphs, "p2", "바다 밑에서 지진이 일어나면 큰 파도인 쓰나미가 생기기도 한다")]),
    makeConfirmQ("q6", "하와이 섬은 어떻게 만들어졌나요?", [findRange(paragraphs, "p3", "하와이 섬은 바다 밑 화산이 분출하면서 만들어진 대표적인 화산섬이다")]),
    makeConfirmQ("q7", "과학자들은 지각판을 연구하여 무엇을 하려고 하나요?", [findRange(paragraphs, "p3", "과학자들은 지각판의 움직임을 관측하여 지진과 화산을 예측하려고 노력하고 있다")])
  ];

  return { content: assembleFull(239, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ─── Day 240 (짝수 → 문학) ───
function buildDay240() {
  const paragraphs = [
    {
      id: "p1",
      text: "은지는 학교 도서관에서 빌린 책을 읽다가 깜빡 잠이 들었다. 눈을 떠 보니 도서관이 아니라 낯선 숲속에 서 있었다. 나무들이 하늘 높이 솟아 있었고 이파리 사이로 황금빛 햇살이 쏟아졌다. 발밑에는 부드러운 이끼가 깔려 있었고 어디선가 맑은 물소리가 들려왔다. 은지는 물소리가 나는 쪽으로 천천히 걸어갔다. 작은 시냇물이 반짝이며 흐르고 있었다. 시냇가에 앉아 물을 한 움큼 떠 마시니 달콤한 맛이 났다."
    },
    {
      id: "p2",
      text: "그때 시냇물 건너편에서 하얀 토끼 한 마리가 나타났다. 토끼는 두 발로 서서 안경을 쓰고 있었고 손에는 작은 시계를 들고 있었다. 은지가 놀라서 바라보자 토끼가 말을 걸어왔다. 토끼는 이야기 숲에 온 것을 환영한다고 했다. 은지가 이야기 숲이 어떤 곳이냐고 묻자 토끼는 책 속 이야기들이 살아 숨 쉬는 곳이라고 대답했다. 이 숲에서는 어떤 이야기든 직접 들어가 볼 수 있다고 덧붙였다. 은지는 두근거리는 마음으로 토끼를 따라갔다."
    },
    {
      id: "p3",
      text: "토끼가 커다란 참나무 앞에서 멈추었다. 나무 기둥에 문 모양의 홈이 파여 있었다. 토끼가 시계 바늘을 돌리자 문이 스르르 열렸다. 문 너머로 푸른 바다가 펼쳐져 있었고 해적선 한 척이 떠 있었다. 은지가 탄성을 지르며 한 발을 내딛으려 하자 갑자기 종소리가 울렸다. 눈을 떠 보니 도서관 의자에 앉아 있었고 하교 종이 울리고 있었다. 은지는 방금 읽던 책을 꼭 안으며 다음에 다시 오겠다고 속삭였다. 도서관을 나서는 발걸음이 가볍고 설레었다."
    }
  ];
  console.log(`Day 240 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "은지가 잠들기 전에 하던 일은?", [findRange(paragraphs, "p1", "은지는 학교 도서관에서 빌린 책을 읽다가 깜빡 잠이 들었다")]),
    makeConfirmQ("q2", "은지가 눈을 떴을 때 발밑의 모습은?", [findRange(paragraphs, "p1", "발밑에는 부드러운 이끼가 깔려 있었고 어디선가 맑은 물소리가 들려왔다")]),
    makeConfirmQ("q3", "하얀 토끼의 생김새는?", [findRange(paragraphs, "p2", "토끼는 두 발로 서서 안경을 쓰고 있었고 손에는 작은 시계를 들고 있었다")]),
    makeConfirmQ("q4", "이야기 숲은 어떤 곳인가요?", [findRange(paragraphs, "p2", "책 속 이야기들이 살아 숨 쉬는 곳이라고 대답했다")]),
    makeConfirmQ("q5", "토끼가 시계 바늘을 돌리자 어떤 일이 생겼나요?", [findRange(paragraphs, "p3", "토끼가 시계 바늘을 돌리자 문이 스르르 열렸다")]),
    makeConfirmQ("q6", "문 너머로 보이는 것은?", [findRange(paragraphs, "p3", "문 너머로 푸른 바다가 펼쳐져 있었고 해적선 한 척이 떠 있었다")]),
    makeConfirmQ("q7", "은지가 잠에서 깬 이유는?", [findRange(paragraphs, "p3", "갑자기 종소리가 울렸다")])
  ];

  return { content: assembleFull(240, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ─── Day 241 (홀수 → 비문학) ───
function buildDay241() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리 몸에는 뼈가 약 이백여 개나 있다. 뼈는 몸을 지탱하고 내장 기관을 보호하는 중요한 역할을 한다. 머리뼈는 부드러운 뇌를 감싸서 보호해 주고 갈비뼈는 심장과 폐를 둘러싸 지켜 준다. 뼈 속에는 골수라는 부분이 있는데 이곳에서 혈액 세포가 만들어진다. 또한 뼈에는 칼슘이 많이 들어 있어서 필요한 칼슘을 저장하는 창고 역할도 한다. 뼈가 없다면 우리 몸은 형체를 유지할 수 없을 것이다."
    },
    {
      id: "p2",
      text: "어린이의 뼈는 어른보다 수가 많다는 사실이 놀랍다. 어린이는 약 삼백 개 정도의 뼈를 가지고 태어나지만 자라면서 작은 뼈들이 합쳐져서 이백여 개로 줄어든다. 뼈가 자라는 데에는 칼슘과 비타민 디가 꼭 필요하다. 칼슘은 우유와 멸치와 치즈 같은 유제품에 많이 들어 있다. 비타민 디는 햇빛을 쬐면 피부에서 자연스럽게 만들어진다. 하루에 이십 분 정도 밖에서 햇빛을 받으면 충분한 양의 비타민 디를 얻을 수 있다. 균형 잡힌 식사와 바깥 활동이 튼튼한 뼈를 만드는 비결이다."
    },
    {
      id: "p3",
      text: "뼈는 한 번 부러지면 절대 붙지 않을 것 같지만 사실 뼈에는 스스로 회복하는 능력이 있다. 부러진 부분에 새로운 뼈세포가 자라면서 다시 단단하게 이어진다. 보통 뼈가 완전히 붙는 데에는 약 여섯 주에서 여덟 주 정도 걸린다. 이 기간 동안 깁스를 하거나 부목을 대어 뼈가 움직이지 않도록 고정해야 한다. 칼슘이 풍부한 음식을 먹으면 뼈가 더 빨리 회복된다. 어릴 때부터 규칙적인 운동과 영양 관리를 실천하는 것이 중요하다."
    }
  ];
  console.log(`Day 241 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "머리뼈의 역할은 무엇인가요?", [findRange(paragraphs, "p1", "머리뼈는 부드러운 뇌를 감싸서 보호해 주고")]),
    makeConfirmQ("q2", "골수에서 만들어지는 것은?", [findRange(paragraphs, "p1", "뼈 속에는 골수라는 부분이 있는데 이곳에서 혈액 세포가 만들어진다")]),
    makeConfirmQ("q3", "어린이가 태어날 때 뼈의 수는?", [findRange(paragraphs, "p2", "어린이는 약 삼백 개 정도의 뼈를 가지고 태어나지만 자라면서 작은 뼈들이 합쳐져서 이백여 개로 줄어든다")]),
    makeConfirmQ("q4", "칼슘이 많이 들어 있는 음식은?", [findRange(paragraphs, "p2", "칼슘은 우유와 멸치와 치즈 같은 유제품에 많이 들어 있다")]),
    makeConfirmQ("q5", "비타민 디를 얻는 방법은?", [findRange(paragraphs, "p2", "비타민 디는 햇빛을 쬐면 피부에서 자연스럽게 만들어진다")]),
    makeConfirmQ("q6", "부러진 뼈가 붙는 데 걸리는 시간은?", [findRange(paragraphs, "p3", "보통 뼈가 완전히 붙는 데에는 약 여섯 주에서 여덟 주 정도 걸린다")]),
    makeConfirmQ("q7", "뼈가 회복되는 동안 해야 하는 것은?", [findRange(paragraphs, "p3", "이 기간 동안 깁스를 하거나 부목을 대어 뼈가 움직이지 않도록 고정해야 한다")])
  ];

  return { content: assembleFull(241, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ─── Day 242 (짝수 → 문학) ───
function buildDay242() {
  const paragraphs = [
    {
      id: "p1",
      text: "하윤이는 학교에서 돌아오자마자 마루에 쓰러지듯 누웠다. 오늘 체육 시간에 달리기 시합이 있었는데 꼴찌를 해서 속상했다. 친구들이 놀린 것은 아니었지만 스스로 부끄러운 기분이 들었다. 거실 창문 너머로 석양이 주황빛으로 물들고 있었다. 엄마가 다가와 무슨 일이냐고 물으셨다. 하윤이는 고개를 돌리며 괜찮다고 작게 대답했다. 하지만 엄마는 하윤이의 표정만 보고도 무슨 일이 있었는지 짐작하시는 것 같았다."
    },
    {
      id: "p2",
      text: "저녁 식사 후 엄마가 하윤이에게 운동화 한 켤레를 내밀었다. 새하얀 운동화였고 밑창에 쿠션이 도톰하게 들어 있었다. 엄마는 원래 생일 선물로 주려고 했는데 미리 주겠다고 말씀하셨다. 하윤이의 눈이 반짝 빛났다. 엄마가 달리기는 연습하면 누구나 빨라질 수 있다며 내일부터 함께 아침 운동을 하자고 제안하셨다. 하윤이는 고개를 크게 끄덕이며 활짝 웃었다. 새 운동화를 품에 안고 방으로 들어가 내일 입을 운동복을 꺼내 놓았다."
    },
    {
      id: "p3",
      text: "다음 날 아침 하윤이는 알람이 울리기도 전에 눈을 떴다. 새 운동화를 신고 엄마와 함께 집 앞 공원을 뛰었다. 처음에는 금방 숨이 찼지만 엄마가 옆에서 속도를 맞춰 주었다. 매일 아침 삼십 분씩 달리기를 이어 갔다. 일주일이 지나자 예전보다 숨이 덜 차는 것이 느껴졌다. 한 달 뒤 체육 시간에 다시 달리기 시합이 열렸다. 하윤이는 꼴찌가 아닌 중간 등수로 결승선을 통과했다. 가장 기뻤던 것은 끝까지 포기하지 않고 달린 자기 자신이 자랑스러웠다는 점이었다."
    }
  ];
  console.log(`Day 242 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "하윤이가 속상했던 이유는?", [findRange(paragraphs, "p1", "오늘 체육 시간에 달리기 시합이 있었는데 꼴찌를 해서 속상했다")]),
    makeConfirmQ("q2", "엄마가 하윤이에게 건넨 것은?", [findRange(paragraphs, "p2", "엄마가 하윤이에게 운동화 한 켤레를 내밀었다")]),
    makeConfirmQ("q3", "새 운동화의 특징은?", [findRange(paragraphs, "p2", "새하얀 운동화였고 밑창에 쿠션이 도톰하게 들어 있었다")]),
    makeConfirmQ("q4", "엄마가 제안한 것은?", [findRange(paragraphs, "p2", "내일부터 함께 아침 운동을 하자고 제안하셨다")]),
    makeConfirmQ("q5", "하윤이가 매일 아침 운동한 시간은?", [findRange(paragraphs, "p3", "매일 아침 삼십 분씩 달리기를 이어 갔다")]),
    makeConfirmQ("q6", "한 달 뒤 달리기 시합 결과는?", [findRange(paragraphs, "p3", "하윤이는 꼴찌가 아닌 중간 등수로 결승선을 통과했다")]),
    makeConfirmQ("q7", "하윤이가 가장 기뻤던 점은?", [findRange(paragraphs, "p3", "가장 기뻤던 것은 끝까지 포기하지 않고 달린 자기 자신이 자랑스러웠다는 점이었다")])
  ];

  return { content: assembleFull(242, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ─── 실행부 ───
const results = [
  { dayIndex: 238, ...buildDay238() },
  { dayIndex: 239, ...buildDay239() },
  { dayIndex: 240, ...buildDay240() },
  { dayIndex: 241, ...buildDay241() },
  { dayIndex: 242, ...buildDay242() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});
const tempBatchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-s3-238-242.json');
fs.writeFileSync(tempBatchPath, JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ 임시 배치: ${tempBatchPath}`);
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
