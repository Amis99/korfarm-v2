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

// === Day 283 (홀수 -> 비문학) ===
function buildDay283() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리가 사용하는 종이는 나무에서 만들어진다. 나무의 줄기 속에는 셀룰로스라는 섬유질이 들어 있는데 이 셀룰로스를 잘게 풀어서 납작하게 펴면 종이가 된다. 종이를 만들기 위해서는 먼저 나무를 잘게 부수어 펄프라는 물질을 만든다. 펄프를 물에 풀어 얇게 펼친 뒤 압착하고 건조하면 우리가 아는 종이가 완성된다. 종이의 발명은 인류 역사에서 매우 중요한 사건으로 지식을 기록하고 전달하는 방식을 완전히 바꾸어 놓았다."
    },
    {
      id: "p2",
      text: "종이는 기원전 2세기경 중국에서 처음 만들어졌다. 후한 시대의 채륜이라는 관리가 나무껍질과 삼 조각, 헌 천 등을 이용하여 질 좋은 종이를 만드는 방법을 발전시켰다. 그 이전에는 대나무 조각이나 비단에 글을 썼는데 대나무는 무겁고 비단은 값이 비싸서 불편했다. 채륜의 종이 제조법은 아라비아를 거쳐 유럽으로 전해졌고 이후 전 세계로 퍼져 나갔다. 종이 덕분에 책을 대량으로 만들 수 있게 되었고 많은 사람이 지식을 공유할 수 있었다."
    },
    {
      id: "p3",
      text: "오늘날에는 종이를 만들기 위해 많은 나무가 베어지고 있어 환경 문제가 되고 있다. 종이 한 톤을 만들려면 약 스무 그루의 나무가 필요하다고 한다. 이 때문에 다 쓴 종이를 재활용하는 것이 중요하다. 재활용 종이를 사용하면 나무를 덜 베어도 되고 쓰레기도 줄일 수 있다. 또한 전자 기기의 발달로 종이 대신 디지털 문서를 사용하는 경우가 늘어나고 있다. 그러나 종이만이 가진 따뜻한 질감과 편리함 때문에 종이가 완전히 사라지지는 않을 것이다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "종이의 원료가 되는 섬유질의 이름은?", [findRange(paragraphs, "p1", "나무의 줄기 속에는 셀룰로스라는 섬유질이 들어 있는데 이 셀룰로스를 잘게 풀어서 납작하게 펴면 종이가 된다.")]),
    makeConfirmQ("q2", "펄프란 무엇인가요?", [findRange(paragraphs, "p1", "종이를 만들기 위해서는 먼저 나무를 잘게 부수어 펄프라는 물질을 만든다.")]),
    makeConfirmQ("q3", "종이 발명 이전에 글을 쓴 재료는?", [findRange(paragraphs, "p2", "그 이전에는 대나무 조각이나 비단에 글을 썼는데 대나무는 무겁고 비단은 값이 비싸서 불편했다.")]),
    makeConfirmQ("q4", "채륜이 종이를 만든 방법은?", [findRange(paragraphs, "p2", "채륜이라는 관리가 나무껍질과 삼 조각, 헌 천 등을 이용하여 질 좋은 종이를 만드는 방법을 발전시켰다.")]),
    makeConfirmQ("q5", "종이 한 톤을 만드는 데 필요한 나무의 수는?", [findRange(paragraphs, "p3", "종이 한 톤을 만들려면 약 스무 그루의 나무가 필요하다고 한다.")]),
    makeConfirmQ("q6", "종이 재활용의 장점은?", [findRange(paragraphs, "p3", "재활용 종이를 사용하면 나무를 덜 베어도 되고 쓰레기도 줄일 수 있다.")]),
    makeConfirmQ("q7", "종이가 완전히 사라지지 않을 이유는?", [findRange(paragraphs, "p3", "종이만이 가진 따뜻한 질감과 편리함 때문에 종이가 완전히 사라지지는 않을 것이다.")])
  ];

  return { content: assembleFull(283, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 284 (짝수 -> 문학) ===
function buildDay284() {
  const paragraphs = [
    {
      id: "p1",
      text: "하늘이는 전학 온 첫날 교실 문 앞에서 한참을 망설였다. 새로운 반 아이들이 자기를 어떻게 볼지 걱정되었기 때문이다. 담임 선생님이 다가와 괜찮아 함께 들어가자 하고 말씀하시며 하늘이의 등을 살짝 밀어 주셨다. 교실에 들어서자 서른 명 가까운 아이들의 시선이 한꺼번에 쏟아졌다. 하늘이는 떨리는 목소리로 안녕하세요 저는 이하늘입니다 잘 부탁드립니다 하고 인사를 했다. 몇몇 아이들이 반갑다고 박수를 쳐 주었지만 하늘이는 여전히 긴장이 풀리지 않았다."
    },
    {
      id: "p2",
      text: "쉬는 시간이 되자 아이들은 삼삼오오 모여 이야기를 나누었고 하늘이는 혼자 자리에 앉아 있었다. 그때 옆자리의 수민이가 다가왔다. 수민이는 우리 같이 놀래 하고 물으며 손을 내밀었다. 하늘이는 조심스럽게 수민이의 손을 잡고 운동장으로 나갔다. 수민이는 친구들을 하나하나 소개해 주었고 아이들은 하늘이에게 전에 어디 살았는지 뭘 좋아하는지 물어보았다. 하늘이는 강아지를 좋아한다고 했더니 나도 나도 하며 공감해 주는 아이들이 많았다."
    },
    {
      id: "p3",
      text: "일주일이 지나자 하늘이는 학교가 즐거워지기 시작했다. 수민이와는 단짝이 되었고 점심시간마다 함께 도서관에 가서 좋아하는 동물 책을 읽었다. 어느 날 하늘이는 엄마에게 말했다. 처음에는 전학이 너무 싫었는데 좋은 친구를 만나서 이제는 이 학교가 좋다고. 엄마는 하늘이의 머리를 쓰다듬으며 네가 먼저 마음을 열었기 때문이란다 하고 말씀하셨다. 하늘이는 수민이에게 고마운 마음을 담아 편지를 쓰기로 했다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "하늘이가 교실 앞에서 망설인 이유는?", [findRange(paragraphs, "p1", "새로운 반 아이들이 자기를 어떻게 볼지 걱정되었기 때문이다.")]),
    makeConfirmQ("q2", "하늘이가 교실에 들어가도록 도운 사람은?", [findRange(paragraphs, "p1", "담임 선생님이 다가와 괜찮아 함께 들어가자 하고 말씀하시며 하늘이의 등을 살짝 밀어 주셨다.")]),
    makeConfirmQ("q3", "수민이가 하늘이에게 한 행동은?", [findRange(paragraphs, "p2", "수민이는 우리 같이 놀래 하고 물으며 손을 내밀었다.")]),
    makeConfirmQ("q4", "하늘이가 좋아한다고 말한 것은?", [findRange(paragraphs, "p2", "하늘이는 강아지를 좋아한다고 했더니 나도 나도 하며 공감해 주는 아이들이 많았다.")]),
    makeConfirmQ("q5", "하늘이와 수민이가 점심시간에 한 일은?", [findRange(paragraphs, "p3", "수민이와는 단짝이 되었고 점심시간마다 함께 도서관에 가서 좋아하는 동물 책을 읽었다.")]),
    makeConfirmQ("q6", "엄마가 하늘이에게 한 말은?", [findRange(paragraphs, "p3", "네가 먼저 마음을 열었기 때문이란다 하고 말씀하셨다.")]),
    makeConfirmQ("q7", "하늘이가 수민이에게 하기로 한 일은?", [findRange(paragraphs, "p3", "하늘이는 수민이에게 고마운 마음을 담아 편지를 쓰기로 했다.")])
  ];

  return { content: assembleFull(284, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 285 (홀수 -> 비문학) ===
function buildDay285() {
  const paragraphs = [
    {
      id: "p1",
      text: "태양계에는 여덟 개의 행성이 있다. 태양에서 가까운 순서대로 수성, 금성, 지구, 화성, 목성, 토성, 천왕성, 해왕성이다. 이 가운데 수성부터 화성까지를 지구형 행성이라 하고 목성부터 해왕성까지를 목성형 행성이라 한다. 지구형 행성은 크기가 작고 단단한 암석으로 이루어져 있다. 반면 목성형 행성은 크기가 매우 크고 주로 가스로 이루어져 있어 표면이 단단하지 않다. 태양계의 행성들은 각각 고유한 특징을 가지고 있어서 과학자들의 연구 대상이 되고 있다."
    },
    {
      id: "p2",
      text: "목성은 태양계에서 가장 큰 행성으로 지구보다 약 1300배나 큰 부피를 가지고 있다. 목성의 표면에는 대적점이라 불리는 거대한 폭풍이 수백 년째 계속되고 있는데 이 폭풍의 크기는 지구 두세 개가 들어갈 정도이다. 토성은 아름다운 고리로 유명한데 이 고리는 얼음과 먼지 알갱이로 이루어져 있다. 토성의 고리는 망원경으로도 관찰할 수 있어서 천체 관측을 시작하는 사람들에게 인기가 높다."
    },
    {
      id: "p3",
      text: "화성은 붉은색을 띠는 행성으로 지구와 환경이 비교적 비슷하여 생명체 존재 가능성이 꾸준히 연구되고 있다. 화성에는 태양계에서 가장 높은 산인 올림포스산이 있는데 높이가 약 22킬로미터로 에베레스트산의 약 세 배에 이른다. 현재 여러 나라에서 화성 탐사 로봇을 보내 토양과 대기를 분석하고 있다. 미래에는 사람이 화성에서 살 수 있도록 기지를 건설하려는 계획도 진행되고 있다. 태양계 탐사는 우주에 대한 인류의 호기심을 채워 주는 중요한 과학 활동이다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "지구형 행성에 해당하는 행성은?", [findRange(paragraphs, "p1", "수성부터 화성까지를 지구형 행성이라 하고")]),
    makeConfirmQ("q2", "목성형 행성의 특징은?", [findRange(paragraphs, "p1", "목성형 행성은 크기가 매우 크고 주로 가스로 이루어져 있어 표면이 단단하지 않다.")]),
    makeConfirmQ("q3", "목성의 대적점이란 무엇인가요?", [findRange(paragraphs, "p2", "목성의 표면에는 대적점이라 불리는 거대한 폭풍이 수백 년째 계속되고 있는데 이 폭풍의 크기는 지구 두세 개가 들어갈 정도이다.")]),
    makeConfirmQ("q4", "토성의 고리는 무엇으로 이루어져 있나요?", [findRange(paragraphs, "p2", "이 고리는 얼음과 먼지 알갱이로 이루어져 있다.")]),
    makeConfirmQ("q5", "화성에서 생명체를 연구하는 이유는?", [findRange(paragraphs, "p3", "화성은 붉은색을 띠는 행성으로 지구와 환경이 비교적 비슷하여 생명체 존재 가능성이 꾸준히 연구되고 있다.")]),
    makeConfirmQ("q6", "올림포스산의 높이는 얼마인가요?", [findRange(paragraphs, "p3", "높이가 약 22킬로미터로 에베레스트산의 약 세 배에 이른다.")]),
    makeConfirmQ("q7", "화성에 대한 미래 계획은?", [findRange(paragraphs, "p3", "미래에는 사람이 화성에서 살 수 있도록 기지를 건설하려는 계획도 진행되고 있다.")])
  ];

  return { content: assembleFull(285, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 286 (짝수 -> 문학) ===
function buildDay286() {
  const paragraphs = [
    {
      id: "p1",
      text: "깊은 숲속에 나이 든 참나무 한 그루가 서 있었다. 참나무는 숲에서 가장 키가 크고 가지가 넓게 퍼져 있어서 많은 동물들에게 그늘과 쉼터를 주었다. 다람쥐는 참나무의 도토리를 모아 겨울 양식으로 저장했고 딱따구리는 줄기에 구멍을 파서 보금자리를 만들었다. 봄이면 작은 새들이 가지 위에 둥지를 틀고 알을 낳았다. 참나무는 자신이 숲에서 큰 역할을 하고 있다는 것을 알지 못한 채 묵묵히 자리를 지키고 있었다."
    },
    {
      id: "p2",
      text: "어느 해 여름 몹시 심한 태풍이 숲을 덮쳤다. 거센 바람에 작은 나무들이 뿌리째 뽑히고 가지가 부러져 여기저기 나뒹굴었다. 참나무도 온몸으로 바람을 맞으며 크게 흔들렸다. 굵은 가지 하나가 부러져 나갔고 잎사귀들이 비바람에 쏟아져 내렸다. 하지만 참나무는 깊이 뻗은 뿌리 덕분에 쓰러지지 않았다. 태풍이 지나간 뒤 숲은 엉망이 되었지만 참나무는 꿋꿋이 서 있었다."
    },
    {
      id: "p3",
      text: "태풍이 지나고 가을이 되자 참나무에서 다시 도토리가 열렸다. 부러진 가지 자리에서는 새로운 가지가 조금씩 자라나기 시작했다. 다람쥐들이 돌아와 도토리를 모았고 딱따구리도 다시 참나무를 두드렸다. 겨울이 오기 전 작은 새 한 마리가 참나무의 빈 가지에 앉아 노래를 불렀다. 참나무는 바람에 잎을 살랑이며 그 노래를 들었다. 오랜 세월 같은 자리에서 비바람을 견디며 뿌리를 더 깊이 내린 참나무는 숲의 든든한 기둥이었다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "참나무가 동물들에게 해 준 것은?", [findRange(paragraphs, "p1", "참나무는 숲에서 가장 키가 크고 가지가 넓게 퍼져 있어서 많은 동물들에게 그늘과 쉼터를 주었다.")]),
    makeConfirmQ("q2", "다람쥐가 도토리로 한 일은?", [findRange(paragraphs, "p1", "다람쥐는 참나무의 도토리를 모아 겨울 양식으로 저장했고")]),
    makeConfirmQ("q3", "태풍이 숲에 끼친 피해는?", [findRange(paragraphs, "p2", "거센 바람에 작은 나무들이 뿌리째 뽑히고 가지가 부러져 여기저기 나뒹굴었다.")]),
    makeConfirmQ("q4", "참나무가 쓰러지지 않은 이유는?", [findRange(paragraphs, "p2", "참나무는 깊이 뻗은 뿌리 덕분에 쓰러지지 않았다.")]),
    makeConfirmQ("q5", "태풍 후 참나무에 생긴 변화는?", [findRange(paragraphs, "p3", "부러진 가지 자리에서는 새로운 가지가 조금씩 자라나기 시작했다.")]),
    makeConfirmQ("q6", "겨울이 오기 전 참나무에 온 동물은?", [findRange(paragraphs, "p3", "겨울이 오기 전 작은 새 한 마리가 참나무의 빈 가지에 앉아 노래를 불렀다.")]),
    makeConfirmQ("q7", "참나무가 숲에서 어떤 존재였나요?", [findRange(paragraphs, "p3", "오랜 세월 같은 자리에서 비바람을 견디며 뿌리를 더 깊이 내린 참나무는 숲의 든든한 기둥이었다.")])
  ];

  return { content: assembleFull(286, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 287 (홀수 -> 비문학) ===
function buildDay287() {
  const paragraphs = [
    {
      id: "p1",
      text: "지도는 지구 표면의 모습을 종이나 화면 위에 줄여서 나타낸 그림이다. 지도에는 방향, 축척, 기호 등의 요소가 포함되어 있다. 방향은 보통 지도의 위쪽이 북쪽을 가리키도록 그린다. 축척은 실제 거리를 지도 위에서 얼마나 줄였는지를 나타내는 비율이다. 예를 들어 축척이 1대 50000이면 지도에서 1센티미터가 실제로는 500미터에 해당한다. 기호는 건물이나 도로, 산, 강 등을 간단한 그림이나 색으로 표현한 것이다."
    },
    {
      id: "p2",
      text: "옛날에는 지도를 만드는 일이 매우 어려웠다. 탐험가들이 직접 걸어 다니며 거리를 재고 높은 곳에 올라가 지형을 살펴보아야 했다. 우리나라에서는 조선 시대 김정호가 전국을 걸어 다니며 대동여지도를 만들었다. 대동여지도는 산과 강, 도로가 매우 정확하게 그려져 있어 당시 가장 뛰어난 지도로 평가받는다. 김정호는 이 지도를 만들기 위해 수십 년 동안 전국을 여러 번 답사했다고 전해진다."
    },
    {
      id: "p3",
      text: "오늘날에는 인공위성과 항공 사진 기술이 발달하여 매우 정밀한 지도를 만들 수 있다. 인공위성이 지구 위에서 촬영한 사진을 컴퓨터로 분석하면 건물 하나하나까지 정확히 표시할 수 있다. 스마트폰의 지도 앱을 이용하면 현재 위치를 실시간으로 확인하고 목적지까지 가는 길을 안내받을 수 있다. 또한 가상 현실 기술을 활용하여 지도 위에서 실제처럼 거리를 걸어 볼 수도 있다. 기술이 발전하면서 지도는 단순한 그림을 넘어 우리 생활에 꼭 필요한 도구가 되었다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "지도에 포함된 요소는 무엇인가요?", [findRange(paragraphs, "p1", "지도에는 방향, 축척, 기호 등의 요소가 포함되어 있다.")]),
    makeConfirmQ("q2", "축척이란 무엇인가요?", [findRange(paragraphs, "p1", "축척은 실제 거리를 지도 위에서 얼마나 줄였는지를 나타내는 비율이다.")]),
    makeConfirmQ("q3", "기호의 역할은 무엇인가요?", [findRange(paragraphs, "p1", "기호는 건물이나 도로, 산, 강 등을 간단한 그림이나 색으로 표현한 것이다.")]),
    makeConfirmQ("q4", "김정호가 만든 지도의 이름은?", [findRange(paragraphs, "p2", "조선 시대 김정호가 전국을 걸어 다니며 대동여지도를 만들었다.")]),
    makeConfirmQ("q5", "대동여지도의 특징은?", [findRange(paragraphs, "p2", "대동여지도는 산과 강, 도로가 매우 정확하게 그려져 있어 당시 가장 뛰어난 지도로 평가받는다.")]),
    makeConfirmQ("q6", "오늘날 정밀한 지도를 만드는 기술은?", [findRange(paragraphs, "p3", "인공위성이 지구 위에서 촬영한 사진을 컴퓨터로 분석하면 건물 하나하나까지 정확히 표시할 수 있다.")]),
    makeConfirmQ("q7", "스마트폰 지도 앱의 기능은?", [findRange(paragraphs, "p3", "스마트폰의 지도 앱을 이용하면 현재 위치를 실시간으로 확인하고 목적지까지 가는 길을 안내받을 수 있다.")])
  ];

  return { content: assembleFull(287, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === 실행부 ===
const results = [
  { dayIndex: 283, ...buildDay283() },
  { dayIndex: 284, ...buildDay284() },
  { dayIndex: 285, ...buildDay285() },
  { dayIndex: 286, ...buildDay286() },
  { dayIndex: 287, ...buildDay287() }
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
fs.writeFileSync(path.join(newDir, 'batch-s3-283-287.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ batch-s3-283-287.json 저장 완료`);

console.log('\n=== 검증 결과 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
