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

// ─── Day 228 (짝수 → 문학) ───
function buildDay228() {
  const paragraphs = [
    {
      id: "p1",
      text: "하늘이는 방학 첫날 아침부터 눈이 번쩍 떠졌다. 오늘은 동네 뒷산에 있는 비밀 오두막을 찾아가기로 친구들과 약속한 날이었다. 하늘이는 서둘러 세수를 하고 밥을 먹었다. 배낭에 물통과 간식을 챙기고 신발 끈을 꽉 묶었다. 대문 앞에는 벌써 민수와 지은이가 와 있었다. 민수는 손에 지도를 들고 있었고 지은이는 돋보기를 목에 걸고 있었다. 아침 햇살이 셋의 얼굴을 환하게 비추었다. 셋은 씩씩하게 걸음을 옮기기 시작했다."
    },
    {
      id: "p2",
      text: "산길은 처음에는 넓고 평탄했지만 점점 좁아지고 가팔라졌다. 나뭇가지 사이로 새소리가 들려왔고 바람이 시원하게 불었다. 낙엽이 수북이 쌓인 길을 지나자 이끼 낀 바위가 나타났다. 민수가 지도를 펼치며 왼쪽 갈림길로 가야 한다고 말했다. 지은이가 돋보기로 바위 틈에 새겨진 화살표를 발견했다. 하늘이는 가슴이 두근두근 뛰었다. 정말로 오두막이 있을지 궁금했다. 셋은 화살표 방향을 따라 조심스럽게 나아갔다."
    },
    {
      id: "p3",
      text: "숲길을 빠져나오자 작은 빈터가 나타났다. 그곳에 나무판자로 만든 오두막이 서 있었다. 지붕에는 초록색 이끼가 잔뜩 끼어 있었고 창문은 투명한 비닐로 덮여 있었다. 하늘이는 문을 살짝 밀었다. 삐걱하는 소리와 함께 문이 열렸다. 안에는 작은 나무 탁자와 의자 세 개가 놓여 있었다. 탁자 위에는 누군가 남긴 낡은 공책 한 권이 놓여 있었다. 셋은 자리에 앉아 간식을 나눠 먹으며 오두막을 우리만의 비밀 아지트로 삼기로 했다. 방학 동안 이곳에서 보물찾기도 하고 일기도 쓰자고 약속했다."
    }
  ];
  console.log(`Day 228 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "하늘이가 방학 첫날 아침에 한 일은?", [findRange(paragraphs, "p1", "배낭에 물통과 간식을 챙기고 신발 끈을 꽉 묶었다")]),
    makeConfirmQ("q2", "민수가 손에 들고 있던 것은?", [findRange(paragraphs, "p1", "민수는 손에 지도를 들고 있었고")]),
    makeConfirmQ("q3", "지은이가 바위 틈에서 발견한 것은?", [findRange(paragraphs, "p2", "지은이가 돋보기로 바위 틈에 새겨진 화살표를 발견했다")]),
    makeConfirmQ("q4", "산길은 어떻게 변했나요?", [findRange(paragraphs, "p2", "산길은 처음에는 넓고 평탄했지만 점점 좁아지고 가팔라졌다")]),
    makeConfirmQ("q5", "오두막 지붕의 모습은?", [findRange(paragraphs, "p3", "지붕에는 초록색 이끼가 잔뜩 끼어 있었고")]),
    makeConfirmQ("q6", "오두막 안에 있던 것은?", [findRange(paragraphs, "p3", "안에는 작은 나무 탁자와 의자 세 개가 놓여 있었다")]),
    makeConfirmQ("q7", "셋은 방학 동안 오두막에서 무엇을 하기로 했나요?", [findRange(paragraphs, "p3", "방학 동안 이곳에서 보물찾기도 하고 일기도 쓰자고 약속했다")])
  ];

  return { content: assembleFull(228, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ─── Day 229 (홀수 → 비문학) ───
function buildDay229() {
  const paragraphs = [
    {
      id: "p1",
      text: "꿀벌은 꽃에서 꿀을 모으는 곤충으로 잘 알려져 있다. 그런데 꿀벌이 하는 일은 꿀을 모으는 것만이 아니다. 꿀벌은 꽃가루를 옮겨 주어 식물이 열매를 맺도록 돕는다. 이것을 꽃가루받이라고 한다. 사과나 딸기 같은 과일도 꿀벌 덕분에 열매를 맺을 수 있다. 배추나 오이 같은 채소도 꿀벌의 도움을 받아 자란다. 만약 꿀벌이 사라진다면 많은 과일과 채소를 먹기 어려워질 것이다. 그래서 꿀벌은 자연에서 매우 중요한 역할을 맡고 있다."
    },
    {
      id: "p2",
      text: "꿀벌은 벌집 안에서 여왕벌과 일벌과 수벌로 나뉘어 생활한다. 여왕벌은 알을 낳는 일을 담당하며 하루에 수천 개의 알을 낳을 수 있다. 일벌은 꿀을 모으고 벌집을 짓고 애벌레를 돌보는 등 다양한 일을 한다. 수벌은 여왕벌과 짝짓기를 하는 역할만 한다. 일벌은 벌집 안의 온도를 조절하기 위해 날개를 빠르게 흔들기도 한다. 먹이가 있는 곳을 알려 주려고 춤을 추기도 하는데 이것을 꿀벌의 춤이라고 부른다. 이처럼 꿀벌 사회는 역할을 철저하게 나누어 질서를 유지한다."
    },
    {
      id: "p3",
      text: "최근 전 세계적으로 꿀벌의 수가 줄어들고 있어 걱정이 크다. 농약 사용과 기후 변화 그리고 서식지 파괴가 주요 원인으로 꼽힌다. 꿀벌이 줄어들면 농작물 생산량도 함께 줄어들 수 있다. 이를 막기 위해 친환경 농업을 실천하고 꿀벌이 살 수 있는 꽃밭을 늘리는 노력이 필요하다. 학교나 집 근처에 꽃을 심는 것만으로도 꿀벌에게 큰 도움이 된다."
    }
  ];
  console.log(`Day 229 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "꿀벌이 꽃가루를 옮겨 주는 역할을 무엇이라고 하나요?", [findRange(paragraphs, "p1", "이것을 꽃가루받이라고 한다")]),
    makeConfirmQ("q2", "꿀벌이 사라지면 어떤 일이 생길 수 있나요?", [findRange(paragraphs, "p1", "만약 꿀벌이 사라진다면 많은 과일과 채소를 먹기 어려워질 것이다")]),
    makeConfirmQ("q3", "여왕벌이 하는 일은?", [findRange(paragraphs, "p2", "여왕벌은 알을 낳는 일을 담당하며 하루에 수천 개의 알을 낳을 수 있다")]),
    makeConfirmQ("q4", "일벌이 날개를 빠르게 흔드는 이유는?", [findRange(paragraphs, "p2", "일벌은 벌집 안의 온도를 조절하기 위해 날개를 빠르게 흔들기도 한다")]),
    makeConfirmQ("q5", "꿀벌의 춤이란 무엇인가요?", [findRange(paragraphs, "p2", "먹이가 있는 곳을 알려 주려고 춤을 추기도 하는데 이것을 꿀벌의 춤이라고 부른다")]),
    makeConfirmQ("q6", "꿀벌 수가 줄어드는 주요 원인은?", [findRange(paragraphs, "p3", "농약 사용과 기후 변화 그리고 서식지 파괴가 주요 원인으로 꼽힌다")]),
    makeConfirmQ("q7", "꿀벌을 돕기 위해 어떤 노력이 필요한가요?", [findRange(paragraphs, "p3", "친환경 농업을 실천하고 꿀벌이 살 수 있는 꽃밭을 늘리는 노력이 필요하다")])
  ];

  return { content: assembleFull(229, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ─── Day 230 (짝수 → 문학) ───
function buildDay230() {
  const paragraphs = [
    {
      id: "p1",
      text: "준서는 미술 시간에 그린 그림을 친구들 앞에서 발표해야 했다. 그림 속에는 넓은 바다 위로 하얀 돛단배 한 척이 떠 있었다. 하늘에는 갈매기 두 마리가 날고 있었고 수평선 너머로 노을빛이 번지고 있었다. 선생님이 준서의 이름을 부르자 심장이 쿵쿵 뛰었다. 준서는 천천히 자리에서 일어나 교실 앞으로 걸어갔다. 그림을 칠판 옆에 붙이고 나서 깊게 숨을 들이마셨다. 손이 떨려서 그림이 살짝 흔들렸다."
    },
    {
      id: "p2",
      text: "준서는 작은 목소리로 말하기 시작했다. 이 그림은 지난여름 가족과 함께 간 바다를 떠올리며 그렸다고 했다. 파란 물감을 여러 번 겹쳐 칠해서 깊은 바다 색을 표현했다고 설명했다. 하늘은 주황색과 보라색을 섞어서 석양의 느낌을 살렸다고 덧붙였다. 돛단배 위에 작게 그린 사람은 자기 자신이라고 말했다. 말을 하다 보니 점점 목소리가 커지고 자신감이 생겼다. 친구들이 고개를 끄덕이며 들어주는 것이 보였다."
    },
    {
      id: "p3",
      text: "발표가 끝나자 교실 안에 박수 소리가 울려 퍼졌다. 선생님이 색을 잘 표현했다고 칭찬해 주셨다. 특히 물결 표현이 자연스럽다고 말씀하셨다. 짝꿍 은지도 바다 색이 진짜 바다 같다고 말해 주었다. 준서는 얼굴이 빨갛게 달아올랐지만 기분이 좋았다. 다음에는 좀 더 큰 목소리로 발표해야겠다고 마음먹었다. 교실로 돌아가는 발걸음이 아까보다 훨씬 가벼웠다. 준서는 두려운 일도 해 보면 생각보다 괜찮다는 것을 알게 되었다."
    }
  ];
  console.log(`Day 230 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "준서가 그린 그림에 무엇이 있었나요?", [findRange(paragraphs, "p1", "그림 속에는 넓은 바다 위로 하얀 돛단배 한 척이 떠 있었다")]),
    makeConfirmQ("q2", "하늘에 그려진 것은?", [findRange(paragraphs, "p1", "하늘에는 갈매기 두 마리가 날고 있었고 수평선 너머로 노을빛이 번지고 있었다")]),
    makeConfirmQ("q3", "준서가 발표할 때 몸의 반응은?", [findRange(paragraphs, "p1", "손이 떨려서 그림이 살짝 흔들렸다")]),
    makeConfirmQ("q4", "파란 물감을 어떻게 사용했나요?", [findRange(paragraphs, "p2", "파란 물감을 여러 번 겹쳐 칠해서 깊은 바다 색을 표현했다고 설명했다")]),
    makeConfirmQ("q5", "석양의 느낌을 어떻게 살렸나요?", [findRange(paragraphs, "p2", "하늘은 주황색과 보라색을 섞어서 석양의 느낌을 살렸다고 덧붙였다")]),
    makeConfirmQ("q6", "선생님의 칭찬은 무엇이었나요?", [findRange(paragraphs, "p3", "선생님이 색을 잘 표현했다고 칭찬해 주셨다")]),
    makeConfirmQ("q7", "준서가 깨달은 것은?", [findRange(paragraphs, "p3", "준서는 두려운 일도 해 보면 생각보다 괜찮다는 것을 알게 되었다")])
  ];

  return { content: assembleFull(230, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ─── Day 231 (홀수 → 비문학) ───
function buildDay231() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리가 매일 쓰는 종이는 나무에서 만들어진다. 나무를 잘게 부수어 섬유질을 뽑아낸 뒤 물과 섞어서 얇게 펴면 종이가 된다. 이 과정을 펄프 공정이라고 부른다. 한 그루의 나무로 만들 수 있는 종이는 약 팔천 장 정도이다. 우리나라 초등학생 한 명이 일 년 동안 쓰는 종이의 양은 나무 여섯 그루에 해당한다고 한다. 교과서와 공책과 시험지를 모두 합치면 꽤 많은 양이 된다. 이렇게 보면 종이를 아껴 쓰는 것이 나무를 지키는 일과 같다."
    },
    {
      id: "p2",
      text: "종이를 재활용하면 나무를 덜 베어도 된다. 다 쓴 종이를 모아 공장에 보내면 다시 새로운 종이로 만들 수 있다. 재활용 종이를 한 톤 만들 때마다 나무 약 스무 그루를 살릴 수 있다. 또한 종이를 만들 때 쓰이는 물과 전기도 절약할 수 있다. 재활용 종이를 만들면 새 종이를 만들 때보다 에너지가 절반 정도만 든다. 하지만 기름이나 음식물이 묻은 종이는 재활용이 어렵다. 그래서 깨끗한 종이와 더러운 종이를 잘 분류하는 습관이 중요하다."
    },
    {
      id: "p3",
      text: "종이를 아끼는 방법은 생활 속에서 쉽게 실천할 수 있다. 노트의 양쪽 면을 모두 사용하면 종이를 절반으로 줄일 수 있다. 필요 없는 인쇄물을 줄이고 대신 컴퓨터나 태블릿을 활용하는 것도 좋은 방법이다. 선물 포장지 대신 보자기를 사용하면 쓰레기도 줄이고 멋도 낼 수 있다. 이런 작은 실천이 모이면 숲을 지키는 큰 힘이 된다. 나 한 사람의 노력이 지구를 건강하게 만드는 첫걸음이다."
    }
  ];
  console.log(`Day 231 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "종이가 만들어지는 과정은?", [findRange(paragraphs, "p1", "나무를 잘게 부수어 섬유질을 뽑아낸 뒤 물과 섞어서 얇게 펴면 종이가 된다")]),
    makeConfirmQ("q2", "이 과정을 무엇이라고 부르나요?", [findRange(paragraphs, "p1", "이 과정을 펄프 공정이라고 부른다")]),
    makeConfirmQ("q3", "한 그루의 나무로 만들 수 있는 종이의 양은?", [findRange(paragraphs, "p1", "한 그루의 나무로 만들 수 있는 종이는 약 팔천 장 정도이다")]),
    makeConfirmQ("q4", "재활용 종이 한 톤이 살리는 나무의 수는?", [findRange(paragraphs, "p2", "재활용 종이를 한 톤 만들 때마다 나무 약 스무 그루를 살릴 수 있다")]),
    makeConfirmQ("q5", "재활용이 어려운 종이는?", [findRange(paragraphs, "p2", "기름이나 음식물이 묻은 종이는 재활용이 어렵다")]),
    makeConfirmQ("q6", "노트를 아껴 쓰는 방법은?", [findRange(paragraphs, "p3", "노트의 양쪽 면을 모두 사용하면 종이를 절반으로 줄일 수 있다")]),
    makeConfirmQ("q7", "선물 포장지 대신 사용할 수 있는 것은?", [findRange(paragraphs, "p3", "선물 포장지 대신 보자기를 사용하면 쓰레기도 줄이고 멋도 낼 수 있다")])
  ];

  return { content: assembleFull(231, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ─── Day 232 (짝수 → 문학) ───
function buildDay232() {
  const paragraphs = [
    {
      id: "p1",
      text: "수아는 할머니 댁 마당에서 커다란 항아리 하나를 발견했다. 뚜껑이 단단히 닫혀 있었고 겉에는 파란 꽃무늬가 그려져 있었다. 항아리 옆에는 작은 항아리 두 개가 더 놓여 있었다. 수아는 궁금한 마음에 큰 항아리의 뚜껑을 살짝 열어 보았다. 항아리 안에서 달콤한 냄새가 솔솔 풍겨 나왔다. 할머니가 다가오시며 그것은 작년 가을에 담근 매실청이라고 알려 주셨다. 일 년 동안 천천히 익혀야 맛있어진다고 하셨다."
    },
    {
      id: "p2",
      text: "수아는 할머니와 함께 올해 매실청을 담그기로 했다. 먼저 싱싱한 매실을 깨끗이 씻어 물기를 말렸다. 꼭지를 하나하나 떼어 내는 작업도 함께 했다. 그런 다음 매실과 설탕을 번갈아 가며 항아리에 차곡차곡 넣었다. 할머니는 정성이 들어가야 맛이 좋다며 천천히 하라고 말씀하셨다. 수아는 매실 하나하나에 마음을 담아 조심스럽게 넣었다. 항아리가 가득 차자 뚜껑을 덮고 시원한 그늘에 두었다."
    },
    {
      id: "p3",
      text: "한 달 뒤 수아는 다시 할머니 댁을 찾았다. 항아리 속 매실은 설탕이 녹으면서 반짝이는 즙에 잠겨 있었다. 수아가 작은 국자로 즙을 떠서 맛보니 새콤달콤한 맛이 입안 가득 퍼졌다. 시원한 물에 타서 마시면 여름 음료로 딱이라고 할머니가 말씀하셨다. 할머니가 내년에 먹을 것도 미리 준비하자고 하셨다. 수아는 기다림이 만들어 내는 맛이 있다는 것을 처음으로 느꼈다. 할머니 댁을 떠나며 수아는 내년 여름이 벌써 기다려졌다."
    }
  ];
  console.log(`Day 232 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "수아가 발견한 항아리의 겉모습은?", [findRange(paragraphs, "p1", "겉에는 파란 꽃무늬가 그려져 있었다")]),
    makeConfirmQ("q2", "항아리 안에 무엇이 있었나요?", [findRange(paragraphs, "p1", "그것은 작년 가을에 담근 매실청이라고 알려 주셨다")]),
    makeConfirmQ("q3", "매실을 씻은 후에 한 작업은?", [findRange(paragraphs, "p2", "꼭지를 하나하나 떼어 내는 작업도 함께 했다")]),
    makeConfirmQ("q4", "매실과 설탕을 어떻게 넣었나요?", [findRange(paragraphs, "p2", "매실과 설탕을 번갈아 가며 항아리에 차곡차곡 넣었다")]),
    makeConfirmQ("q5", "한 달 뒤 항아리 속 매실의 모습은?", [findRange(paragraphs, "p3", "항아리 속 매실은 설탕이 녹으면서 반짝이는 즙에 잠겨 있었다")]),
    makeConfirmQ("q6", "매실청의 맛은 어땠나요?", [findRange(paragraphs, "p3", "새콤달콤한 맛이 입안 가득 퍼졌다")]),
    makeConfirmQ("q7", "수아가 느낀 점은?", [findRange(paragraphs, "p3", "수아는 기다림이 만들어 내는 맛이 있다는 것을 처음으로 느꼈다")])
  ];

  return { content: assembleFull(232, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ─── 실행부 ───
const results = [
  { dayIndex: 228, ...buildDay228() },
  { dayIndex: 229, ...buildDay229() },
  { dayIndex: 230, ...buildDay230() },
  { dayIndex: 231, ...buildDay231() },
  { dayIndex: 232, ...buildDay232() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});
const tempBatchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-s3-228-232.json');
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
