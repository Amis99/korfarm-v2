#!/usr/bin/env node
// 프레게2 Day 319~323 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION(비문학), 짝수 Day = LITERATURE(문학)
// 목표 글자수: 900±50 (850~950)

const fs = require('fs');
const path = require('path');

// ─── 유틸리티 함수 ───
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
    contentId: `dr-f2-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(프레게 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_2", schoolGradeRange: { min: 6, max: 6 },
    area: "READING", subArea,
    competencies: ["READING"], tags: ["daily"], access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
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
  return {
    content_type: "DAILY_READING", level_id: "FREGE_2", area: "READING",
    sub_area: subArea, day_index: dayIndex, module_key: "reading_training",
    schema_version: "1.0", content
  };
}

// ─── Day 319 (홀수 → 비문학) ───
function buildDay319() {
  const paragraphs = [
    {
      id: "p1",
      text: "지구의 대기는 여러 층으로 나뉘며, 각 층은 고유한 특성과 역할을 지닌다. 가장 낮은 층인 대류권은 지표면에서 약 12킬로미터 높이까지 뻗어 있으며, 우리가 경험하는 날씨 현상이 이곳에서 발생한다. 대류권에서는 공기가 수직으로 활발하게 순환하면서 구름이 만들어지고 비나 눈이 내린다. 높이 올라갈수록 기온이 낮아지는 것이 대류권의 대표적인 특징이며, 약 100미터 상승할 때마다 기온이 섭씨 0.65도씩 떨어진다. 이 층 위에는 성층권이 자리 잡고 있는데, 성층권에는 오존층이 존재하여 태양의 자외선을 흡수하는 중요한 기능을 수행한다. 오존층 덕분에 지표면의 생물들은 해로운 자외선으로부터 보호받을 수 있다."
    },
    {
      id: "p2",
      text: "성층권 위로는 중간권과 열권이 차례로 이어진다. 중간권은 약 50킬로미터에서 80킬로미터 사이에 위치하며, 대기 중에서 기온이 가장 낮은 구간으로 영하 90도 이하까지 내려가기도 한다. 유성이 대기와 마찰하여 빛을 내며 타는 현상이 주로 중간권에서 일어난다. 열권은 80킬로미터 이상의 높이에 존재하며, 태양 에너지를 직접 흡수하기 때문에 온도가 매우 높다. 그러나 공기 밀도가 극도로 낮아서 실제로 뜨겁다고 느끼기는 어렵다. 국제 우주 정거장이 약 400킬로미터 높이의 열권에서 운행되고 있다는 사실은 이 층의 특수한 환경을 잘 보여준다."
    },
    {
      id: "p3",
      text: "최근 과학자들은 대기층 사이의 상호 작용에 주목하고 있다. 대류권에서 발생한 강력한 폭풍은 성층권까지 에너지를 전달하여 오존 농도에 영향을 미칠 수 있다. 또한 열권의 변화는 인공위성의 궤도에 직접적인 영향을 준다. 태양 활동이 활발해지면 열권이 팽창하여 위성의 공기 저항이 증가하고, 이로 인해 궤도가 낮아질 수 있다. 이러한 현상은 통신 위성이나 기상 관측 위성의 수명과 성능에 영향을 미치므로 면밀한 감시가 필요하다. 대기층에 대한 연구는 기후 변화 예측뿐만 아니라 우주 기술의 발전에도 중요한 기초 자료를 제공한다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "대류권의 높이는 지표면에서 약 몇 킬로미터까지인가?", [findRange(paragraphs, "p1", "약 12킬로미터")]),
    makeConfirmQ("q2", "성층권에 존재하며 자외선을 흡수하는 층은?", [findRange(paragraphs, "p1", "오존층이 존재하여 태양의 자외선을 흡수하는 중요한 기능을 수행한다")]),
    makeConfirmQ("q3", "유성이 빛을 내며 타는 현상이 주로 발생하는 대기층은?", [findRange(paragraphs, "p2", "유성이 대기와 마찰하여 빛을 내며 타는 현상이 주로 중간권에서 일어난다")]),
    makeConfirmQ("q4", "열권의 온도가 높은 이유는 무엇인가?", [findRange(paragraphs, "p2", "태양 에너지를 직접 흡수하기 때문에 온도가 매우 높다")]),
    makeConfirmQ("q5", "국제 우주 정거장은 어느 대기층에서 운행되는가?", [findRange(paragraphs, "p2", "국제 우주 정거장이 약 400킬로미터 높이의 열권에서 운행되고 있다")]),
    makeConfirmQ("q6", "대류권의 강력한 폭풍이 성층권에 미치는 영향은?", [findRange(paragraphs, "p3", "대류권에서 발생한 강력한 폭풍은 성층권까지 에너지를 전달하여 오존 농도에 영향을 미칠 수 있다")]),
    makeConfirmQ("q7", "태양 활동이 활발해지면 열권에 어떤 변화가 생기는가?", [findRange(paragraphs, "p3", "태양 활동이 활발해지면 열권이 팽창하여 위성의 공기 저항이 증가하고, 이로 인해 궤도가 낮아질 수 있다")])
  ];

  const content = assembleFull(319, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 320 (짝수 → 문학) ───
function buildDay320() {
  const paragraphs = [
    {
      id: "p1",
      text: "수연이는 할머니 댁 뒤편의 오래된 감나무를 좋아했다. 가을이면 주황빛 감이 주렁주렁 매달려 마을 전체를 물들이는 것 같았다. 할머니는 긴 장대로 감을 따서 마당에 가지런히 널어놓곤 했다. 감을 따는 날이면 이웃집 할아버지도 오셔서 함께 일을 도왔는데, 할아버지는 높은 가지에 달린 감을 솜씨 좋게 따내셨다. 마당 한쪽에는 곶감을 만들기 위해 껍질을 벗긴 감이 줄줄이 매달려 있었다. 수연이는 할머니가 깎아 주신 감을 한 입 베어 물면서 이 순간이 영원했으면 좋겠다고 생각했다. 달콤한 과즙이 입안에 퍼지면 할머니의 따뜻한 손길까지 함께 느껴지는 듯했다."
    },
    {
      id: "p2",
      text: "그해 겨울, 할머니가 갑자기 편찮으셔서 병원에 입원하셨다. 수연이는 주말마다 어머니와 함께 병원을 찾았지만, 할머니는 점점 기력을 잃어가셨다. 병실 창밖으로 앙상한 나뭇가지가 보였고, 수연이는 문득 감나무가 떠올랐다. 할머니께 감나무 이야기를 꺼내자 할머니는 희미하게 미소를 지으셨다. 그 미소 속에는 수십 년간 감나무를 돌보던 추억과 가족에 대한 사랑이 담겨 있었다. 수연이는 병실에 올 때마다 곶감을 가져왔고, 할머니는 그것을 보며 조금씩 기운을 차리시는 듯했다."
    },
    {
      id: "p3",
      text: "봄이 왔을 때 할머니는 다시 댁으로 돌아오셨다. 수연이가 뒤뜰로 달려가 보니 감나무에 연초록 새잎이 돋아나고 있었다. 할머니는 지팡이를 짚고 천천히 나무 아래에 서서 새잎을 올려다보셨다. 수연이는 할머니의 손을 잡고 나란히 서서 봄바람을 맞았다. 나무는 해마다 잎을 떨구고 다시 새잎을 틔우듯, 할머니와 수연이의 일상도 작은 시련을 딛고 새롭게 시작되고 있었다. 감나무 가지 끝에 맺힌 이슬이 햇살에 반짝이며 두 사람의 얼굴을 비추었다. 수연이는 올가을에도 할머니와 함께 감을 따겠다고 조용히 다짐했다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "수연이가 좋아한 할머니 댁의 나무는 무엇인가?", [findRange(paragraphs, "p1", "오래된 감나무를 좋아했다")]),
    makeConfirmQ("q2", "할머니는 감을 딸 때 어떤 도구를 사용했는가?", [findRange(paragraphs, "p1", "긴 장대로 감을 따서")]),
    makeConfirmQ("q3", "마당 한쪽에 매달려 있던 것은 무엇인가?", [findRange(paragraphs, "p1", "곶감을 만들기 위해 껍질을 벗긴 감이 줄줄이 매달려 있었다")]),
    makeConfirmQ("q4", "할머니가 병원에 입원한 계절은 언제인가?", [findRange(paragraphs, "p2", "그해 겨울, 할머니가 갑자기 편찮으셔서 병원에 입원하셨다")]),
    makeConfirmQ("q5", "수연이가 할머니께 감나무 이야기를 꺼내자 할머니의 반응은?", [findRange(paragraphs, "p2", "할머니는 희미하게 미소를 지으셨다")]),
    makeConfirmQ("q6", "할머니가 다시 댁으로 돌아온 계절은?", [findRange(paragraphs, "p3", "봄이 왔을 때 할머니는 다시 댁으로 돌아오셨다")]),
    makeConfirmQ("q7", "나무와 할머니의 일상을 비유한 공통점은?", [findRange(paragraphs, "p3", "나무는 해마다 잎을 떨구고 다시 새잎을 틔우듯, 할머니와 수연이의 일상도 작은 시련을 딛고 새롭게 시작되고 있었다")])
  ];

  const content = assembleFull(320, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 321 (홀수 → 비문학) ───
function buildDay321() {
  const paragraphs = [
    {
      id: "p1",
      text: "인류가 사용하는 에너지원은 시대에 따라 크게 변화해 왔다. 산업 혁명 이전에는 나무와 숯이 주요 연료였으며, 이후 석탄이 증기 기관의 동력으로 사용되면서 대규모 산업화를 이끌었다. 19세기 영국에서 시작된 석탄 기반 산업은 유럽 전역과 북미로 빠르게 확산되었다. 20세기에 들어서자 석유와 천연가스가 에너지 시장의 중심에 자리 잡았다. 석유는 운송과 화학 산업의 핵심 자원이 되었고, 천연가스는 발전과 난방에 널리 활용되었다. 그러나 화석 연료에 대한 과도한 의존은 대기 오염과 기후 변화라는 심각한 문제를 낳았다."
    },
    {
      id: "p2",
      text: "이러한 문제를 해결하기 위해 재생 에너지에 대한 관심이 급격히 높아지고 있다. 태양광 발전은 햇빛을 전기로 변환하는 기술로, 설치 비용이 빠르게 낮아지면서 전 세계적으로 보급이 확대되고 있다. 풍력 발전은 바람의 운동 에너지를 이용하여 터빈을 돌리는 방식이다. 해상 풍력 발전소는 육지보다 강하고 안정적인 바람을 활용할 수 있어 효율이 높다. 수력 발전은 물의 위치 에너지를 이용하는 오래된 방식이지만, 여전히 세계 재생 에너지 생산량의 상당 부분을 차지하고 있다. 이들 재생 에너지는 탄소를 배출하지 않아 환경 보전에 기여한다는 공통점이 있다."
    },
    {
      id: "p3",
      text: "최근에는 수소 에너지와 핵융합 기술이 차세대 에너지원으로 주목받고 있다. 수소는 연소 시 물만 배출하여 청정 연료로 평가되지만, 대량 생산과 저장 기술이 아직 해결해야 할 과제로 남아 있다. 현재 수소의 대부분은 천연가스에서 추출되므로, 재생 에너지를 이용한 그린 수소 생산 기술이 활발히 연구되고 있다. 핵융합은 태양이 에너지를 만드는 원리를 지구에서 재현하려는 시도로, 성공할 경우 사실상 무한한 에너지를 얻을 수 있다. 에너지 전환은 단순한 기술 문제가 아니라 경제, 정치, 사회 전반에 걸친 변화를 수반하며, 미래 세대의 삶을 결정짓는 핵심 과제이다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "산업 혁명 이후 증기 기관의 동력으로 사용된 연료는?", [findRange(paragraphs, "p1", "석탄이 증기 기관의 동력으로 사용되면서")]),
    makeConfirmQ("q2", "20세기 에너지 시장의 중심에 자리 잡은 에너지원 두 가지는?", [findRange(paragraphs, "p1", "석유와 천연가스가 에너지 시장의 중심에 자리 잡았다")]),
    makeConfirmQ("q3", "태양광 발전의 보급이 확대되는 이유는?", [findRange(paragraphs, "p2", "설치 비용이 빠르게 낮아지면서 전 세계적으로 보급이 확대되고 있다")]),
    makeConfirmQ("q4", "해상 풍력 발전소의 장점은 무엇인가?", [findRange(paragraphs, "p2", "육지보다 강하고 안정적인 바람을 활용할 수 있어 효율이 높다")]),
    makeConfirmQ("q5", "수소 에너지의 장점과 과제는 각각 무엇인가?", [findRange(paragraphs, "p3", "수소는 연소 시 물만 배출하여 청정 연료로 평가되지만, 대량 생산과 저장 기술이 아직 해결해야 할 과제로 남아 있다")]),
    makeConfirmQ("q6", "그린 수소 생산 기술이 연구되는 이유는?", [findRange(paragraphs, "p3", "현재 수소의 대부분은 천연가스에서 추출되므로, 재생 에너지를 이용한 그린 수소 생산 기술이 활발히 연구되고 있다")]),
    makeConfirmQ("q7", "핵융합 기술이 주목받는 이유는?", [findRange(paragraphs, "p3", "성공할 경우 사실상 무한한 에너지를 얻을 수 있다")])
  ];

  const content = assembleFull(321, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 322 (짝수 → 문학) ───
function buildDay322() {
  const paragraphs = [
    {
      id: "p1",
      text: "준혁이는 전학 온 첫날부터 교실 창가 자리에 앉게 되었다. 낯선 교실에서 아무에게도 말을 걸지 못하고 쉬는 시간마다 창밖만 바라보았다. 운동장에서 축구를 하는 아이들의 웃음소리가 들렸지만, 그 소리는 오히려 외로움을 더 크게 만들었다. 준혁이는 전에 다니던 학교 친구들이 그리웠고, 함께 뛰어놀던 놀이터와 등하굣길의 풍경이 자꾸 떠올랐다. 점심시간에도 혼자 급식을 먹으며 빈자리만 쳐다보았다. 급식판 위의 음식은 전에 다니던 학교와 비슷했지만, 함께 먹는 사람이 없으니 맛이 나지 않았다."
    },
    {
      id: "p2",
      text: "며칠이 지난 어느 날, 같은 반 민지가 준혁이에게 다가왔다. 민지는 준혁이의 필통에 그려진 로봇 그림을 보고 자기도 로봇을 좋아한다고 말했다. 준혁이는 처음에 어색하게 웃기만 했지만, 민지가 방과 후 과학실에서 로봇을 만들고 있다는 이야기를 하자 눈이 반짝였다. 전에 다니던 학교에서도 로봇 조립을 좋아했던 준혁이는 순간 반가운 마음이 들었다. 다음 날 준혁이는 용기를 내어 과학실을 찾아갔다. 그곳에는 민지를 포함한 네 명의 학생이 작은 로봇을 조립하고 있었고, 책상 위에는 각종 부품과 공구가 가지런히 놓여 있었다."
    },
    {
      id: "p3",
      text: "준혁이는 로봇 동아리에 합류하면서 조금씩 학교생활에 적응하기 시작했다. 부품을 조립하고 프로그램을 짜면서 친구들과 자연스럽게 대화하게 되었다. 한 달 뒤 동아리는 지역 로봇 대회에 출전했고, 비록 입상하지는 못했지만 함께 힘을 합쳐 도전한 경험은 준혁이에게 큰 의미가 있었다. 대회가 끝난 뒤 운동장 벤치에 나란히 앉은 다섯 명의 아이들은 웃으며 아이스크림을 나눠 먹었다. 석양이 운동장을 붉게 물들이고, 아이들의 웃음소리가 따뜻하게 퍼져 나갔다. 준혁이는 이제 창밖을 바라보는 대신 친구들의 얼굴을 바라보고 있었다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "준혁이가 전학 온 첫날 앉은 자리는 어디인가?", [findRange(paragraphs, "p1", "교실 창가 자리에 앉게 되었다")]),
    makeConfirmQ("q2", "쉬는 시간에 준혁이는 무엇을 했는가?", [findRange(paragraphs, "p1", "쉬는 시간마다 창밖만 바라보았다")]),
    makeConfirmQ("q3", "점심시간에 음식의 맛이 나지 않았던 이유는?", [findRange(paragraphs, "p1", "함께 먹는 사람이 없으니 맛이 나지 않았다")]),
    makeConfirmQ("q4", "민지가 준혁이에게 다가간 계기는 무엇인가?", [findRange(paragraphs, "p2", "준혁이의 필통에 그려진 로봇 그림을 보고 자기도 로봇을 좋아한다고 말했다")]),
    makeConfirmQ("q5", "과학실에서 로봇을 만들고 있던 학생은 몇 명인가?", [findRange(paragraphs, "p2", "민지를 포함한 네 명의 학생이 작은 로봇을 조립하고 있었고")]),
    makeConfirmQ("q6", "동아리가 출전한 대회의 결과는?", [findRange(paragraphs, "p3", "비록 입상하지는 못했지만 함께 힘을 합쳐 도전한 경험은 준혁이에게 큰 의미가 있었다")]),
    makeConfirmQ("q7", "대회가 끝난 뒤 아이들은 무엇을 했는가?", [findRange(paragraphs, "p3", "운동장 벤치에 나란히 앉은 다섯 명의 아이들은 웃으며 아이스크림을 나눠 먹었다")])
  ];

  const content = assembleFull(322, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 323 (홀수 → 비문학) ───
function buildDay323() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리가 매일 사용하는 종이는 수천 년의 역사를 가지고 있다. 고대 이집트에서는 파피루스라는 식물의 줄기를 얇게 잘라 겹쳐 붙여서 기록 재료로 사용했다. 그러나 파피루스는 습기에 약하고 깨지기 쉬워 오래 보존하기 어려웠다. 진정한 의미의 종이는 기원후 105년경 중국의 채륜이 발명한 것으로 알려져 있다. 채륜은 나무껍질, 삼베, 낡은 천 등을 물에 풀어 섬유질을 분리하고 이를 얇게 펴서 말리는 방법을 고안했다. 이 기술은 중국 내에서 빠르게 퍼졌으며, 이후 실크로드를 통해 서아시아와 유럽으로 전파되었다."
    },
    {
      id: "p2",
      text: "종이 제조 기술이 유럽에 전해진 것은 12세기 무렵이다. 스페인과 이탈리아에서 최초의 제지 공장이 설립되었고, 15세기 구텐베르크의 인쇄술 발명과 맞물려 종이 수요가 폭발적으로 증가했다. 인쇄술과 종이의 결합은 지식의 대중화를 이끌었으며, 종교 개혁과 과학 혁명의 기반이 되었다. 구텐베르크 이전에는 필사본 한 권을 만드는 데 수개월이 걸렸지만, 인쇄기의 등장으로 동일한 책을 수백 권씩 빠르게 찍어낼 수 있게 되었다. 18세기 이후에는 나무를 원료로 한 기계식 제지법이 개발되어 종이의 대량 생산이 가능해졌다. 이로써 신문과 서적이 일반 시민들에게까지 보급될 수 있었다."
    },
    {
      id: "p3",
      text: "오늘날 디지털 기술의 발달로 종이의 사용량이 줄어들 것이라는 예측이 있었지만, 실제로 전 세계 종이 소비량은 여전히 상당하다. 포장재와 위생용품 등에서의 수요가 꾸준히 늘고 있기 때문이다. 다만 환경 문제로 인해 재활용 종이와 친환경 제지 기술에 대한 관심이 높아지고 있다. 나무 대신 대나무나 농업 부산물을 원료로 활용하는 연구도 진행 중이다. 특히 벼짚이나 사탕수수 찌꺼기 같은 농업 폐기물을 이용하면 삼림 벌채를 줄이면서도 양질의 종이를 생산할 수 있다. 종이는 단순한 기록 매체를 넘어 인류 문명의 발전을 이끈 핵심 발명품으로서 그 가치가 재조명되고 있다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "고대 이집트에서 기록 재료로 사용한 식물은?", [findRange(paragraphs, "p1", "파피루스라는 식물의 줄기를 얇게 잘라 겹쳐 붙여서 기록 재료로 사용했다")]),
    makeConfirmQ("q2", "파피루스의 단점은 무엇인가?", [findRange(paragraphs, "p1", "파피루스는 습기에 약하고 깨지기 쉬워 오래 보존하기 어려웠다")]),
    makeConfirmQ("q3", "채륜이 종이를 발명한 시기는 언제인가?", [findRange(paragraphs, "p1", "기원후 105년경 중국의 채륜이 발명한 것으로 알려져 있다")]),
    makeConfirmQ("q4", "유럽에서 종이 수요가 폭발적으로 증가한 계기는?", [findRange(paragraphs, "p2", "구텐베르크의 인쇄술 발명과 맞물려 종이 수요가 폭발적으로 증가했다")]),
    makeConfirmQ("q5", "인쇄술과 종이의 결합이 이끈 결과는 무엇인가?", [findRange(paragraphs, "p2", "지식의 대중화를 이끌었으며, 종교 개혁과 과학 혁명의 기반이 되었다")]),
    makeConfirmQ("q6", "디지털 시대에도 종이 소비량이 여전히 상당한 이유는?", [findRange(paragraphs, "p3", "포장재와 위생용품 등에서의 수요가 꾸준히 늘고 있기 때문이다")]),
    makeConfirmQ("q7", "나무 대신 종이 원료로 연구 중인 소재는?", [findRange(paragraphs, "p3", "대나무나 농업 부산물을 원료로 활용하는 연구도 진행 중이다")])
  ];

  const content = assembleFull(323, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── 실행부 ───
const results = [
  { dayIndex: 319, ...buildDay319() },
  { dayIndex: 320, ...buildDay320() },
  { dayIndex: 321, ...buildDay321() },
  { dayIndex: 322, ...buildDay322() },
  { dayIndex: 323, ...buildDay323() }
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
  path.join(__dirname, '..', 'generated', 'new', 'batch-f2-319-323.json'),
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
