#!/usr/bin/env node
// 소쉬르3 Day 358~362 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE (문학), 홀수 Day = NONFICTION (비문학)
// 목표 글자수: 700±50자 (650~750자), 초등 5학년 수준

const fs = require('fs');
const path = require('path');

// ─── 유틸리티 함수 ───
function findSentences(text) {
  const sentences = []; let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1; while (next < text.length && (text[next] === ' ' || text[next] === '\n')) next++; start = next;
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
  let stepNum = 0; const timeline = [];
  paragraphs.forEach((para) => {
    const sents = findSentences(para.text);
    sents.forEach((sent) => { stepNum++; timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] } }); });
    stepNum++; timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] } });
  });
  return timeline;
}

function buildRecallCards(paragraphs) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length; const chunkSize = Math.ceil(totalLen / 8); const cards = [];
  for (let i = 0; i < 8; i++) { const s = i * chunkSize; const e = Math.min(s + chunkSize, totalLen); cards.push({ id: `c${i+1}`, text: fullText.substring(s, e) }); }
  return cards;
}

function makeConfirmQ(id, prompt, ranges) {
  return { id, prompt, answerRanges: ranges, scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: "ANY" };
}

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs); const cards = buildRecallCards(paragraphs);
  const nn = String(dayIndex).padStart(3, '0');
  return { contentId: `dr-s3-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(소쉬르 3) Day ${dayIndex} ${subAreaKo}`, description: "일일 독해 - 정독·복기·확인",
    targetLevel: "SAUSSURE_3", schoolGradeRange: { min: 5, max: 5 }, area: "READING", subArea,
    competencies: ["READING"], tags: ["daily"], access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 }, timeLimitSec: 480, assets: {},
    payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 }, confirm: { questions: confirmQuestions } }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return { content_type: "DAILY_READING", level_id: "SAUSSURE_3", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// ─── Day 358: 문학 (LITERATURE) - 창작 단편: 강아지를 돌보는 아이 ───
function buildDay358() {
  const paragraphs = [
    {
      id: "p1",
      text: "비 오는 토요일 오후, 민재는 학교에서 돌아오는 길에 골목에 웅크리고 있는 작은 강아지를 발견했다. 강아지는 온몸이 빗물에 젖어 있었고 가늘게 떨고 있었다. 민재는 가방에서 우산을 꺼내 강아지 위로 씌워 주었다. 강아지는 처음에는 겁먹은 눈으로 민재를 올려다보았지만 곧 꼬리를 살짝 흔들었다. 민재는 강아지를 품에 안고 집으로 향했다. 젖은 강아지의 체온이 팔에 전해지자 민재의 마음이 아려 왔다."
    },
    {
      id: "p2",
      text: "집에 도착한 민재는 마른 수건으로 강아지의 몸을 닦아 주었다. 강아지는 수건에 감싸이자 떨림이 조금씩 멈추었다. 민재는 따뜻한 우유를 작은 그릇에 담아 강아지 앞에 놓아 주었다. 강아지는 조심스럽게 우유를 핥기 시작했고 그릇이 금방 비워졌다. 어머니가 퇴근하고 돌아오시자 민재는 사정을 설명하며 강아지를 돌봐도 되냐고 여쭈었다. 어머니는 잠시 생각하시더니 주인을 찾을 때까지만 돌보자고 허락해 주셨다. 민재는 기쁜 마음으로 강아지에게 뭉치라는 이름을 지어 주었다."
    },
    {
      id: "p3",
      text: "그날부터 민재는 매일 아침 일찍 일어나 뭉치에게 밥을 주고 함께 산책을 나갔다. 뭉치는 민재를 따르며 꼬리를 힘차게 흔들었고 민재가 부르면 달려왔다. 일주일이 지나자 뭉치의 주인을 찾았다는 연락이 왔다. 민재는 뭉치와 헤어져야 한다는 사실이 슬펐지만 뭉치의 진짜 가족이 기다리고 있다고 생각하니 보내 주는 것이 옳다는 걸 알았다. 뭉치를 돌려보내는 날 민재는 뭉치의 머리를 쓰다듬으며 잘 지내라고 인사했다. 뭉치는 민재의 손을 핥으며 마치 고맙다고 말하는 것 같았다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "민재가 골목에서 강아지를 발견했을 때 강아지의 상태는 어떠했나요?",
      [findRange(paragraphs, "p1", "강아지는 온몸이 빗물에 젖어 있었고 가늘게 떨고 있었다")]),
    makeConfirmQ("q2", "민재가 강아지에게 가장 먼저 해 준 일은 무엇인가요?",
      [findRange(paragraphs, "p1", "민재는 가방에서 우산을 꺼내 강아지 위로 씌워 주었다")]),
    makeConfirmQ("q3", "민재가 집에서 강아지에게 먹인 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "민재는 따뜻한 우유를 작은 그릇에 담아 강아지 앞에 놓아 주었다")]),
    makeConfirmQ("q4", "어머니는 강아지를 어떤 조건으로 돌보게 허락하셨나요?",
      [findRange(paragraphs, "p2", "주인을 찾을 때까지만 돌보자고 허락해 주셨다")]),
    makeConfirmQ("q5", "민재가 강아지에게 지어 준 이름은 무엇인가요?",
      [findRange(paragraphs, "p2", "민재는 기쁜 마음으로 강아지에게 뭉치라는 이름을 지어 주었다")]),
    makeConfirmQ("q6", "뭉치를 돌려보낼 때 뭉치는 어떤 행동을 했나요?",
      [findRange(paragraphs, "p3", "뭉치는 민재의 손을 핥으며 마치 고맙다고 말하는 것 같았다")])
  ];

  const content = assembleFull(358, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 359: 비문학 (NONFICTION) - 태양계의 행성들 ───
function buildDay359() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리가 살고 있는 지구는 태양 주위를 돌고 있는 여덟 개의 행성 가운데 하나이다. 태양에서 가장 가까운 행성은 수성이고 그다음은 금성, 지구, 화성 순서로 이어진다. 수성은 태양계에서 가장 작은 행성이며 낮에는 매우 뜨겁고 밤에는 매우 춥다. 금성은 크기가 지구와 비슷하지만 두꺼운 구름에 둘러싸여 있어서 태양계에서 가장 뜨거운 행성이다. 지구는 물이 있고 공기가 알맞아 생물이 살 수 있는 유일한 행성으로 알려져 있다. 화성은 붉은색을 띠고 있어 빨간 행성이라고도 불린다."
    },
    {
      id: "p2",
      text: "화성 너머에는 목성, 토성, 천왕성, 해왕성이 있다. 목성은 태양계에서 가장 큰 행성으로 지구보다 천 배 이상 크다. 목성의 표면에는 거대한 소용돌이 무늬가 있는데 이것을 대적점이라고 부른다. 토성은 아름다운 고리가 있는 것으로 유명하다. 이 고리는 얼음 조각과 작은 돌로 이루어져 있다. 천왕성은 옆으로 누워서 도는 독특한 행성이며 해왕성은 태양에서 가장 멀리 떨어져 있어 매우 차갑고 강한 바람이 분다."
    },
    {
      id: "p3",
      text: "태양계의 행성들은 크기에 따라 두 종류로 나눌 수 있다. 수성, 금성, 지구, 화성은 단단한 땅으로 이루어진 작은 행성이어서 지구형 행성이라고 부른다. 반면에 목성, 토성, 천왕성, 해왕성은 주로 기체로 이루어진 큰 행성이어서 목성형 행성이라고 한다. 과학자들은 태양계 밖에서도 수많은 행성을 발견하고 있으며 그 가운데 생물이 살 수 있는 행성이 있는지 연구하고 있다. 우주에는 아직 밝혀지지 않은 비밀이 셀 수 없이 많기 때문에 앞으로의 탐사가 더욱 기대된다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "태양에서 가장 가까운 행성은 무엇인가요?",
      [findRange(paragraphs, "p1", "태양에서 가장 가까운 행성은 수성이고")]),
    makeConfirmQ("q2", "금성이 태양계에서 가장 뜨거운 까닭은 무엇인가요?",
      [findRange(paragraphs, "p1", "두꺼운 구름에 둘러싸여 있어서 태양계에서 가장 뜨거운 행성이다")]),
    makeConfirmQ("q3", "목성 표면의 거대한 소용돌이 무늬를 무엇이라고 부르나요?",
      [findRange(paragraphs, "p2", "이것을 대적점이라고 부른다")]),
    makeConfirmQ("q4", "토성의 고리는 무엇으로 이루어져 있나요?",
      [findRange(paragraphs, "p2", "이 고리는 얼음 조각과 작은 돌로 이루어져 있다")]),
    makeConfirmQ("q5", "지구형 행성에 해당하는 행성들은 무엇인가요?",
      [findRange(paragraphs, "p3", "수성, 금성, 지구, 화성은 단단한 땅으로 이루어진 작은 행성이어서 지구형 행성이라고 부른다")]),
    makeConfirmQ("q6", "과학자들이 태양계 밖에서 연구하고 있는 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "그 가운데 생물이 살 수 있는 행성이 있는지 연구하고 있다")])
  ];

  const content = assembleFull(359, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 360: 문학 (LITERATURE) - 창작 단편: 운동회 날 ───
function buildDay360() {
  const paragraphs = [
    {
      id: "p1",
      text: "가을 운동회 날이 밝았다. 하늘은 구름 한 점 없이 맑았고 운동장에는 형형색색의 깃발이 바람에 나부꼈다. 서연이는 이번 운동회에서 이어달리기 세 번째 주자로 뛰기로 되어 있었다. 서연이는 달리기에 자신이 없었기 때문에 며칠 전부터 걱정이 많았다. 혹시 바통을 떨어뜨리거나 넘어지면 어쩌나 하는 생각에 밤에 잠도 잘 오지 않았다. 아침에 운동장에 모인 친구들의 들뜬 모습을 보자 서연이의 긴장감은 더욱 커졌다."
    },
    {
      id: "p2",
      text: "오전 경기가 끝나고 드디어 이어달리기 시간이 되었다. 서연이는 세 번째 구간에서 바통을 기다리며 심장이 콩닥콩닥 뛰는 것을 느꼈다. 두 번째 주자인 민호가 힘껏 달려오며 바통을 내밀었다. 서연이는 떨리는 손으로 바통을 잡았고 그 순간 온 힘을 다해 달리기 시작했다. 바람이 귀를 스치고 운동장의 함성이 울려 퍼졌다. 서연이는 앞만 보고 있는 힘을 다해 뛰었다. 네 번째 주자인 하영이에게 바통을 넘길 때까지 서연이는 한 번도 속도를 줄이지 않았다."
    },
    {
      id: "p3",
      text: "결과는 아쉽게도 이 등이었지만 서연이의 마음은 뿌듯함으로 가득 찼다. 바통을 떨어뜨리지 않고 끝까지 달린 자신이 자랑스러웠기 때문이다. 친구들도 서연이에게 잘 뛰었다며 등을 두드려 주었다. 담임 선생님은 순위보다 함께 힘을 합한 과정이 더 중요하다고 말씀하셨다. 서연이는 그 말이 마음에 깊이 와닿았다. 집으로 돌아가는 길에 서연이는 다음 운동회에는 더 열심히 연습해서 일 등을 해 보겠다고 작은 목표를 세웠다. 걱정만 했던 운동회가 서연이에게 가장 좋은 추억이 되었다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "서연이가 운동회에서 맡은 역할은 무엇인가요?",
      [findRange(paragraphs, "p1", "서연이는 이번 운동회에서 이어달리기 세 번째 주자로 뛰기로 되어 있었다")]),
    makeConfirmQ("q2", "서연이가 운동회 전에 걱정한 내용은 무엇인가요?",
      [findRange(paragraphs, "p1", "혹시 바통을 떨어뜨리거나 넘어지면 어쩌나 하는 생각에 밤에 잠도 잘 오지 않았다")]),
    makeConfirmQ("q3", "서연이에게 바통을 넘겨 준 친구는 누구인가요?",
      [findRange(paragraphs, "p2", "두 번째 주자인 민호가 힘껏 달려오며 바통을 내밀었다")]),
    makeConfirmQ("q4", "서연이가 달리는 동안 어떻게 뛰었나요?",
      [findRange(paragraphs, "p2", "서연이는 앞만 보고 있는 힘을 다해 뛰었다")]),
    makeConfirmQ("q5", "담임 선생님이 말씀하신 내용은 무엇인가요?",
      [findRange(paragraphs, "p3", "순위보다 함께 힘을 합한 과정이 더 중요하다고 말씀하셨다")]),
    makeConfirmQ("q6", "서연이가 집으로 돌아가며 세운 목표는 무엇인가요?",
      [findRange(paragraphs, "p3", "다음 운동회에는 더 열심히 연습해서 일 등을 해 보겠다고 작은 목표를 세웠다")])
  ];

  const content = assembleFull(360, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 361: 비문학 (NONFICTION) - 공기의 성질과 역할 ───
function buildDay361() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리 주변에는 눈에 보이지 않지만 항상 공기가 있다. 공기는 질소, 산소, 이산화 탄소 등 여러 가지 기체가 섞여 있는 혼합물이다. 이 가운데 질소가 약 78퍼센트로 가장 많고 산소가 약 21퍼센트를 차지한다. 나머지 1퍼센트에는 이산화 탄소와 그 밖의 기체들이 포함되어 있다. 산소는 사람과 동물이 숨을 쉬는 데 꼭 필요한 기체이다. 만약 공기 중에 산소가 없다면 우리는 단 몇 분도 살아갈 수 없을 것이다."
    },
    {
      id: "p2",
      text: "공기는 무게가 있고 공간을 차지하는 성질이 있다. 빈 페트병의 뚜껑을 닫고 누르면 쉽게 찌그러지지 않는 것은 병 안에 공기가 있기 때문이다. 또한 공기는 따뜻해지면 위로 올라가고 차가워지면 아래로 내려오는 성질이 있다. 이러한 성질을 이용한 것이 바로 열기구이다. 열기구는 안쪽의 공기를 불로 데워서 가벼워진 공기의 힘으로 하늘 높이 떠오르게 된다. 바람도 공기의 움직임으로 생기는데 온도 차이가 있는 곳에서 공기가 이동하면 바람이 불게 된다."
    },
    {
      id: "p3",
      text: "공기는 생물에게 없어서는 안 될 소중한 존재이다. 식물은 공기 중의 이산화 탄소를 흡수하고 산소를 내보내면서 살아간다. 이 과정을 광합성이라고 하며 덕분에 공기 중의 산소가 유지될 수 있다. 또한 공기는 지구의 온도를 적당하게 유지하는 역할도 한다. 공기가 없다면 낮에는 너무 뜨겁고 밤에는 너무 추워서 생물이 살기 어려울 것이다. 그뿐만 아니라 공기는 해로운 우주 방사선으로부터 지구를 보호하는 방패 역할도 하고 있다. 깨끗한 공기를 지키는 일은 모든 생물의 건강을 위해 매우 중요하다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "공기 중에서 가장 많은 비율을 차지하는 기체는 무엇인가요?",
      [findRange(paragraphs, "p1", "질소가 약 78퍼센트로 가장 많고")]),
    makeConfirmQ("q2", "산소가 중요한 까닭은 무엇인가요?",
      [findRange(paragraphs, "p1", "산소는 사람과 동물이 숨을 쉬는 데 꼭 필요한 기체이다")]),
    makeConfirmQ("q3", "열기구가 하늘에 뜨는 원리는 무엇인가요?",
      [findRange(paragraphs, "p2", "열기구는 안쪽의 공기를 불로 데워서 가벼워진 공기의 힘으로 하늘 높이 떠오르게 된다")]),
    makeConfirmQ("q4", "바람은 어떻게 생기나요?",
      [findRange(paragraphs, "p2", "온도 차이가 있는 곳에서 공기가 이동하면 바람이 불게 된다")]),
    makeConfirmQ("q5", "광합성이란 무엇인가요?",
      [findRange(paragraphs, "p3", "식물은 공기 중의 이산화 탄소를 흡수하고 산소를 내보내면서 살아간다")]),
    makeConfirmQ("q6", "공기가 없다면 지구의 온도는 어떻게 되나요?",
      [findRange(paragraphs, "p3", "공기가 없다면 낮에는 너무 뜨겁고 밤에는 너무 추워서 생물이 살기 어려울 것이다")])
  ];

  const content = assembleFull(361, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 362: 문학 (LITERATURE) - 창작 단편: 할아버지의 시계 ───
function buildDay362() {
  const paragraphs = [
    {
      id: "p1",
      text: "유진이의 방 책상 위에는 오래된 탁상시계가 하나 놓여 있다. 이 시계는 돌아가신 할아버지가 유진이에게 남겨 주신 것이다. 시계는 나무로 만들어져 있었고 뒷면에는 작은 글씨로 할아버지의 이름이 새겨져 있었다. 유진이는 매일 아침 이 시계를 보며 하루를 시작했다. 시계의 초침이 째깍째깍 움직이는 소리는 마치 할아버지가 옆에서 말을 걸어 주는 것 같았다. 비록 할아버지는 계시지 않지만 이 시계 덕분에 유진이는 할아버지를 가까이 느낄 수 있었다."
    },
    {
      id: "p2",
      text: "어느 날 유진이가 학교에서 돌아와 보니 시계가 멈춰 있었다. 유진이는 깜짝 놀라 시계를 들어 올리고 이리저리 살펴보았지만 다시 움직이지 않았다. 유진이는 아버지에게 시계를 고칠 수 있는지 물어보았다. 아버지는 시계를 가지고 동네의 오래된 시계 수리점을 찾아가셨다. 수리점 아저씨는 시계를 조심스럽게 열어 보시더니 안에 있는 작은 부품이 닳아서 멈춘 것이라고 말씀하셨다. 부품을 갈아 끼우면 다시 움직일 수 있다고 하셔서 유진이는 한시름 놓았다."
    },
    {
      id: "p3",
      text: "며칠 뒤 수리가 끝난 시계를 돌려받은 유진이는 시계를 책상 위에 다시 올려놓았다. 째깍째깍 소리가 다시 들리자 유진이의 얼굴에 미소가 번졌다. 아버지는 할아버지가 이 시계를 얼마나 아끼셨는지 이야기해 주셨다. 할아버지는 젊은 시절에 이 시계를 사서 수십 년 동안 곁에 두셨다고 한다. 유진이는 할아버지처럼 이 시계를 소중히 간직하겠다고 다짐했다. 오래된 물건 속에는 그것을 아끼던 사람의 마음이 담겨 있다는 것을 유진이는 이날 깨달았다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "유진이의 탁상시계는 원래 누구의 것이었나요?",
      [findRange(paragraphs, "p1", "이 시계는 돌아가신 할아버지가 유진이에게 남겨 주신 것이다")]),
    makeConfirmQ("q2", "시계의 째깍째깍 소리를 유진이는 어떻게 느꼈나요?",
      [findRange(paragraphs, "p1", "시계의 초침이 째깍째깍 움직이는 소리는 마치 할아버지가 옆에서 말을 걸어 주는 것 같았다")]),
    makeConfirmQ("q3", "시계가 멈춘 원인은 무엇이었나요?",
      [findRange(paragraphs, "p2", "안에 있는 작은 부품이 닳아서 멈춘 것이라고 말씀하셨다")]),
    makeConfirmQ("q4", "시계를 고치기 위해 아버지는 어디를 찾아가셨나요?",
      [findRange(paragraphs, "p2", "아버지는 시계를 가지고 동네의 오래된 시계 수리점을 찾아가셨다")]),
    makeConfirmQ("q5", "할아버지는 이 시계를 얼마나 오래 곁에 두셨나요?",
      [findRange(paragraphs, "p3", "할아버지는 젊은 시절에 이 시계를 사서 수십 년 동안 곁에 두셨다고 한다")]),
    makeConfirmQ("q6", "유진이가 이날 깨달은 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "오래된 물건 속에는 그것을 아끼던 사람의 마음이 담겨 있다는 것을 유진이는 이날 깨달았다")])
  ];

  const content = assembleFull(362, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── 실행부 ───
const results = [
  { dayIndex: 358, ...buildDay358() },
  { dayIndex: 359, ...buildDay359() },
  { dayIndex: 360, ...buildDay360() },
  { dayIndex: 361, ...buildDay361() },
  { dayIndex: 362, ...buildDay362() }
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

const batchDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(batchDir)) fs.mkdirSync(batchDir, { recursive: true });
fs.writeFileSync(
  path.join(batchDir, 'batch-s3-358-362.json'),
  JSON.stringify(batchItems, null, 2), 'utf8'
);
console.log(`  ✅ generated/new/batch-s3-358-362.json`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
