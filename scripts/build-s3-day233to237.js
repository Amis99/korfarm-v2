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

// ─── Day 233 (홀수 → 비문학) ───
function buildDay233() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리 몸에는 뼈가 약 이백육 개 있다. 뼈는 몸을 지탱하고 장기를 보호하는 중요한 역할을 한다. 갈비뼈는 심장과 폐를 감싸고 있어서 외부 충격으로부터 보호해 준다. 두개골은 뇌를 단단하게 감싸서 머리를 부딪혀도 뇌가 다치지 않도록 한다. 척추뼈는 등 가운데에 기둥처럼 서서 몸이 똑바로 서 있을 수 있게 해 준다. 만약 뼈가 없다면 우리 몸은 물렁물렁해서 서 있을 수조차 없을 것이다."
    },
    {
      id: "p2",
      text: "뼈는 살아 있는 조직이다. 어릴 때의 뼈는 부드럽고 유연하지만 자라면서 점점 단단해진다. 뼈 안에는 골수라는 부분이 있는데 이곳에서 혈액 세포가 만들어진다. 뼈가 부러지더라도 시간이 지나면 스스로 붙어서 다시 튼튼해진다. 이것은 뼈 속에 있는 세포들이 계속 새로운 뼈를 만들어 내기 때문이다. 어린이의 뼈는 어른보다 빠르게 자라고 회복도 빠르다. 그래서 어릴 때 다친 뼈도 잘 치료하면 금방 낫는 경우가 많다."
    },
    {
      id: "p3",
      text: "뼈를 튼튼하게 유지하려면 칼슘이 풍부한 음식을 먹어야 한다. 우유와 치즈와 멸치에는 칼슘이 많이 들어 있다. 비타민 디도 뼈 건강에 꼭 필요한데 햇빛을 쬐면 몸에서 자연스럽게 만들어진다. 줄넘기나 달리기 같은 운동도 뼈를 강하게 해 준다. 반대로 탄산음료를 많이 마시면 칼슘이 빠져나갈 수 있으니 주의해야 한다. 어릴 때부터 좋은 습관을 들이면 평생 튼튼한 뼈를 가질 수 있다."
    }
  ];
  console.log(`Day 233 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "갈비뼈가 보호하는 장기는?", [findRange(paragraphs, "p1", "갈비뼈는 심장과 폐를 감싸고 있어서 외부 충격으로부터 보호해 준다")]),
    makeConfirmQ("q2", "척추뼈의 역할은?", [findRange(paragraphs, "p1", "척추뼈는 등 가운데에 기둥처럼 서서 몸이 똑바로 서 있을 수 있게 해 준다")]),
    makeConfirmQ("q3", "골수에서 만들어지는 것은?", [findRange(paragraphs, "p2", "뼈 안에는 골수라는 부분이 있는데 이곳에서 혈액 세포가 만들어진다")]),
    makeConfirmQ("q4", "부러진 뼈가 다시 붙는 이유는?", [findRange(paragraphs, "p2", "뼈 속에 있는 세포들이 계속 새로운 뼈를 만들어 내기 때문이다")]),
    makeConfirmQ("q5", "칼슘이 풍부한 음식에는 무엇이 있나요?", [findRange(paragraphs, "p3", "우유와 치즈와 멸치에는 칼슘이 많이 들어 있다")]),
    makeConfirmQ("q6", "비타민 디를 만드는 방법은?", [findRange(paragraphs, "p3", "햇빛을 쬐면 몸에서 자연스럽게 만들어진다")]),
    makeConfirmQ("q7", "뼈 건강에 주의해야 할 것은?", [findRange(paragraphs, "p3", "탄산음료를 많이 마시면 칼슘이 빠져나갈 수 있으니 주의해야 한다")])
  ];

  return { content: assembleFull(233, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ─── Day 234 (짝수 → 문학) ───
function buildDay234() {
  const paragraphs = [
    {
      id: "p1",
      text: "다은이는 전학 온 첫날 교실 문 앞에서 한참을 서 있었다. 안에서 웃음소리가 들려왔지만 문을 열 용기가 나지 않았다. 담임 선생님이 나와서 다은이의 손을 잡고 교실 안으로 데려가 주셨다. 선생님이 새 친구를 소개한다며 다은이를 앞에 세웠다. 다은이는 고개를 숙이고 작은 목소리로 안녕하세요라고 인사했다. 아이들이 박수를 쳐 주었지만 다은이는 얼굴이 빨개져서 빨리 자리에 앉고 싶었다. 선생님이 창가 쪽 빈자리를 가리키며 저기 앉으라고 말씀하셨다."
    },
    {
      id: "p2",
      text: "쉬는 시간이 되자 옆자리에 앉은 여자아이가 말을 걸어왔다. 그 아이는 이름이 소연이라고 하면서 어디에서 왔느냐고 물었다. 다은이가 부산에서 왔다고 대답하자 소연이는 눈을 동그랗게 뜨며 바다가 보이는 학교에 다녔냐고 물었다. 다은이는 고개를 끄덕이며 교실 창문으로 바다가 보였다고 말했다. 소연이는 부러워하며 나중에 바다 이야기를 더 들려달라고 했다. 다은이는 처음으로 웃음이 나왔다. 창밖으로 보이는 운동장이 부산 학교보다 넓어 보였다."
    },
    {
      id: "p3",
      text: "점심시간에 소연이가 다은이를 급식실로 데려갔다. 급식 메뉴는 카레라이스와 샐러드였다. 소연이가 여기 카레가 맛있다며 많이 먹으라고 했다. 같은 반 아이들 몇 명이 다가와서 어떤 과목을 좋아하느냐고 물었다. 다은이가 음악을 좋아한다고 하자 한 아이가 우리 반 합창 대회 연습 중인데 같이 하자고 말했다. 다은이는 아직 낯설었지만 조금씩 마음이 풀리는 것을 느꼈다. 집에 돌아가는 길에 다은이는 내일도 학교에 가고 싶다는 생각이 들었다."
    }
  ];
  console.log(`Day 234 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "다은이가 교실 문 앞에서 한 행동은?", [findRange(paragraphs, "p1", "다은이는 전학 온 첫날 교실 문 앞에서 한참을 서 있었다")]),
    makeConfirmQ("q2", "선생님이 다은이에게 안내한 자리는?", [findRange(paragraphs, "p1", "선생님이 창가 쪽 빈자리를 가리키며 저기 앉으라고 말씀하셨다")]),
    makeConfirmQ("q3", "소연이가 다은이에게 처음 물어본 것은?", [findRange(paragraphs, "p2", "그 아이는 이름이 소연이라고 하면서 어디에서 왔느냐고 물었다")]),
    makeConfirmQ("q4", "다은이의 부산 학교는 어땠나요?", [findRange(paragraphs, "p2", "교실 창문으로 바다가 보였다고 말했다")]),
    makeConfirmQ("q5", "점심 급식 메뉴는?", [findRange(paragraphs, "p3", "급식 메뉴는 카레라이스와 샐러드였다")]),
    makeConfirmQ("q6", "반 아이들이 다은이에게 제안한 것은?", [findRange(paragraphs, "p3", "우리 반 합창 대회 연습 중인데 같이 하자고 말했다")]),
    makeConfirmQ("q7", "다은이가 집에 가며 느낀 것은?", [findRange(paragraphs, "p3", "다은이는 내일도 학교에 가고 싶다는 생각이 들었다")])
  ];

  return { content: assembleFull(234, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ─── Day 235 (홀수 → 비문학) ───
function buildDay235() {
  const paragraphs = [
    {
      id: "p1",
      text: "한옥은 우리나라 전통 집이다. 한옥은 나무와 흙과 돌과 같은 자연 재료를 사용하여 짓는다. 지붕에는 기와를 얹거나 볏짚을 덮는데 기와를 얹은 집을 기와집이라 하고 볏짚을 덮은 집을 초가집이라고 한다. 한옥의 가장 큰 특징은 온돌과 마루가 함께 있다는 점이다. 온돌은 바닥 아래로 뜨거운 공기를 보내 방을 따뜻하게 만드는 난방 방식이다. 마루는 나무로 만든 시원한 바닥으로 여름에 바람이 잘 통해서 시원하게 지낼 수 있다."
    },
    {
      id: "p2",
      text: "한옥은 자연과 어울리도록 설계되었다. 남쪽을 향해 집을 지어서 햇빛이 잘 들어오도록 했다. 여름에는 처마가 햇빛을 막아 주어 실내가 시원하고 겨울에는 낮은 햇빛이 방 안까지 들어와 따뜻하다. 대청마루에 앉으면 앞마당과 뒷산의 풍경이 한눈에 들어온다. 한옥 마당에는 장독대를 놓아 된장과 간장과 고추장을 보관했다. 이렇게 한옥은 계절에 따라 자연의 변화를 잘 활용하는 지혜가 담긴 집이다."
    },
    {
      id: "p3",
      text: "오늘날에도 한옥을 짓고 사는 사람들이 있다. 전주 한옥마을이나 북촌 한옥마을은 한옥이 잘 보존된 대표적인 곳이다. 현대식 한옥은 전통 모습을 유지하면서도 화장실과 주방을 편리하게 개선했다. 한옥에서 하룻밤 묵는 한옥 체험도 인기가 많다. 나무와 흙으로 지은 공간에서 지내면 마음이 편안해진다고 한다. 한옥은 옛사람들의 지혜와 자연을 아끼는 마음이 담긴 소중한 문화유산이다."
    }
  ];
  console.log(`Day 235 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "한옥을 짓는 데 사용하는 재료는?", [findRange(paragraphs, "p1", "한옥은 나무와 흙과 돌과 같은 자연 재료를 사용하여 짓는다")]),
    makeConfirmQ("q2", "온돌이란 무엇인가요?", [findRange(paragraphs, "p1", "온돌은 바닥 아래로 뜨거운 공기를 보내 방을 따뜻하게 만드는 난방 방식이다")]),
    makeConfirmQ("q3", "마루가 여름에 시원한 이유는?", [findRange(paragraphs, "p1", "마루는 나무로 만든 시원한 바닥으로 여름에 바람이 잘 통해서 시원하게 지낼 수 있다")]),
    makeConfirmQ("q4", "여름에 처마의 역할은?", [findRange(paragraphs, "p2", "여름에는 처마가 햇빛을 막아 주어 실내가 시원하고")]),
    makeConfirmQ("q5", "한옥 마당의 장독대에 보관한 것은?", [findRange(paragraphs, "p2", "한옥 마당에는 장독대를 놓아 된장과 간장과 고추장을 보관했다")]),
    makeConfirmQ("q6", "한옥이 잘 보존된 대표적인 곳은?", [findRange(paragraphs, "p3", "전주 한옥마을이나 북촌 한옥마을은 한옥이 잘 보존된 대표적인 곳이다")]),
    makeConfirmQ("q7", "현대식 한옥의 특징은?", [findRange(paragraphs, "p3", "현대식 한옥은 전통 모습을 유지하면서도 화장실과 주방을 편리하게 개선했다")])
  ];

  return { content: assembleFull(235, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ─── Day 236 (짝수 → 문학) ───
function buildDay236() {
  const paragraphs = [
    {
      id: "p1",
      text: "지호는 할아버지와 함께 시골 논에 나갔다. 오월의 논에는 물이 가득 차 있었고 하늘이 거울처럼 비치고 있었다. 할아버지는 오늘 모내기를 할 거라고 말씀하셨다. 모내기란 모판에서 기른 어린 벼를 논에 옮겨 심는 일이다. 지호는 논에 들어가 보고 싶었지만 진흙탕이 무서웠다. 할아버지가 천천히 한 발씩 들어가면 괜찮다며 지호의 손을 잡아 주셨다. 지호는 조심스럽게 한 발을 논에 내디뎠다. 발이 푹 빠지면서 차가운 흙이 발가락 사이로 올라왔다."
    },
    {
      id: "p2",
      text: "할아버지는 모를 한 줌 쥐고 시범을 보여 주셨다. 세 뿌리씩 나누어 일정한 간격으로 흙에 꽂아야 한다고 하셨다. 너무 깊이 꽂으면 뿌리가 썩고 너무 얕으면 바람에 쓰러진다고 알려 주셨다. 지호는 할아버지를 따라 조심스럽게 모를 심었다. 처음에는 간격이 들쭉날쭉했지만 열 포기쯤 심으니 점점 익숙해졌다. 허리를 굽히고 일하니 등이 아파 왔다. 할아버지는 이렇게 힘들게 심어야 가을에 맛있는 밥을 먹을 수 있다고 말씀하셨다."
    },
    {
      id: "p3",
      text: "점심때가 되자 할머니가 논두렁으로 도시락을 가져오셨다. 김밥과 삶은 달걀과 시원한 보리차가 들어 있었다. 논 옆 그늘에 앉아 먹으니 밥맛이 평소보다 훨씬 좋았다. 개구리 한 마리가 풀숲에서 뛰어나와 지호 옆을 지나갔다. 할아버지는 개구리가 해충을 잡아먹어서 논에 이로운 동물이라고 알려 주셨다. 집으로 돌아오는 길에 지호는 밥 한 그릇이 얼마나 많은 정성으로 만들어지는지 알게 되었다. 앞으로는 밥을 남기지 않겠다고 마음속으로 다짐했다."
    }
  ];
  console.log(`Day 236 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "모내기란 무엇인가요?", [findRange(paragraphs, "p1", "모내기란 모판에서 기른 어린 벼를 논에 옮겨 심는 일이다")]),
    makeConfirmQ("q2", "지호가 논에 들어갈 때 느낀 것은?", [findRange(paragraphs, "p1", "발이 푹 빠지면서 차가운 흙이 발가락 사이로 올라왔다")]),
    makeConfirmQ("q3", "모를 심을 때 주의할 점은?", [findRange(paragraphs, "p2", "너무 깊이 꽂으면 뿌리가 썩고 너무 얕으면 바람에 쓰러진다고 알려 주셨다")]),
    makeConfirmQ("q4", "지호가 모를 심으며 겪은 변화는?", [findRange(paragraphs, "p2", "처음에는 간격이 들쭉날쭉했지만 열 포기쯤 심으니 점점 익숙해졌다")]),
    makeConfirmQ("q5", "도시락에 들어 있던 것은?", [findRange(paragraphs, "p3", "김밥과 삶은 달걀과 시원한 보리차가 들어 있었다")]),
    makeConfirmQ("q6", "개구리가 논에 이로운 이유는?", [findRange(paragraphs, "p3", "개구리가 해충을 잡아먹어서 논에 이로운 동물이라고 알려 주셨다")]),
    makeConfirmQ("q7", "지호가 깨달은 것은?", [findRange(paragraphs, "p3", "밥 한 그릇이 얼마나 많은 정성으로 만들어지는지 알게 되었다")])
  ];

  return { content: assembleFull(236, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ─── Day 237 (홀수 → 비문학) ───
function buildDay237() {
  const paragraphs = [
    {
      id: "p1",
      text: "태양계에는 여덟 개의 행성이 있다. 태양에서 가까운 순서대로 수성과 금성과 지구와 화성과 목성과 토성과 천왕성과 해왕성이다. 이 중에서 수성과 금성과 지구와 화성은 딱딱한 땅으로 이루어진 암석형 행성이다. 목성과 토성과 천왕성과 해왕성은 가스로 이루어진 거대한 행성이다. 지구는 태양에서 세 번째로 가까운 행성으로 생물이 살기에 알맞은 온도와 물과 공기를 가지고 있다. 지금까지 알려진 바로는 생물이 사는 행성은 지구뿐이다."
    },
    {
      id: "p2",
      text: "행성마다 특별한 특징이 있다. 수성은 태양에서 가장 가까워서 낮에는 매우 뜨겁고 밤에는 매우 춥다. 금성은 두꺼운 구름으로 둘러싸여 있어서 태양계에서 가장 뜨거운 행성이다. 화성은 표면이 붉은색이어서 붉은 행성이라는 별명이 있다. 목성은 태양계에서 가장 큰 행성으로 지구가 천 개 이상 들어갈 수 있는 크기이다. 토성은 아름다운 고리로 유명한데 이 고리는 얼음과 돌 조각으로 이루어져 있다."
    },
    {
      id: "p3",
      text: "사람들은 오래전부터 밤하늘을 올려다보며 행성을 관찰해 왔다. 맨눈으로 볼 수 있는 행성은 수성과 금성과 화성과 목성과 토성이다. 금성은 해 뜨기 전이나 해 진 후에 가장 밝게 빛나서 새벽별 또는 저녁별이라고 불린다. 오늘날에는 망원경과 탐사선을 이용하여 행성을 더 자세히 연구한다. 우리나라도 달 탐사선 다누리를 보낸 적이 있다. 앞으로 더 많은 탐사가 이루어지면 태양계의 비밀이 하나씩 밝혀질 것이다."
    }
  ];
  console.log(`Day 237 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "태양에서 세 번째로 가까운 행성은?", [findRange(paragraphs, "p1", "지구는 태양에서 세 번째로 가까운 행성으로 생물이 살기에 알맞은 온도와 물과 공기를 가지고 있다")]),
    makeConfirmQ("q2", "암석형 행성에는 어떤 것들이 있나요?", [findRange(paragraphs, "p1", "수성과 금성과 지구와 화성은 딱딱한 땅으로 이루어진 암석형 행성이다")]),
    makeConfirmQ("q3", "금성이 가장 뜨거운 이유는?", [findRange(paragraphs, "p2", "금성은 두꺼운 구름으로 둘러싸여 있어서 태양계에서 가장 뜨거운 행성이다")]),
    makeConfirmQ("q4", "화성의 별명은?", [findRange(paragraphs, "p2", "화성은 표면이 붉은색이어서 붉은 행성이라는 별명이 있다")]),
    makeConfirmQ("q5", "토성의 고리는 무엇으로 이루어져 있나요?", [findRange(paragraphs, "p2", "이 고리는 얼음과 돌 조각으로 이루어져 있다")]),
    makeConfirmQ("q6", "금성이 새벽별이라 불리는 이유는?", [findRange(paragraphs, "p3", "금성은 해 뜨기 전이나 해 진 후에 가장 밝게 빛나서 새벽별 또는 저녁별이라고 불린다")]),
    makeConfirmQ("q7", "우리나라가 보낸 탐사선의 이름은?", [findRange(paragraphs, "p3", "우리나라도 달 탐사선 다누리를 보낸 적이 있다")])
  ];

  return { content: assembleFull(237, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ─── 실행부 ───
const results = [
  { dayIndex: 233, ...buildDay233() },
  { dayIndex: 234, ...buildDay234() },
  { dayIndex: 235, ...buildDay235() },
  { dayIndex: 236, ...buildDay236() },
  { dayIndex: 237, ...buildDay237() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});
const tempBatchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-s3-233-237.json');
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
