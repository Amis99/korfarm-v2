#!/usr/bin/env node
// 프레게2 Day 334~338 일일독해 콘텐츠 빌더
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

// ─── Day 334 (짝수 → 문학) ───
function buildDay334() {
  const paragraphs = [
    {
      id: "p1",
      text: "겨울방학이 시작되던 날, 수아는 복도에서 전학생 하윤이를 만났다. 하윤이는 전학 온 지 한 달이 넘었지만 여전히 혼자 도시락을 먹고 쉬는 시간에도 자리에 앉아 책만 읽었다. 수아도 한때 전학생이었기에 그 외로움을 잘 알았다. 3학년 때 처음 이 학교로 왔을 때 아무도 말을 걸어주지 않아 매일 혼자 운동장 구석에 서 있던 기억이 떠올랐다. 수아는 하윤이에게 다가가 방학 동안 같이 도서관에 가지 않겠느냐고 물었다. 하윤이는 놀란 표정으로 수아를 올려다보더니 작은 목소리로 좋다고 대답했다. 그날부터 두 사람은 매일 오전 동네 도서관에서 만나기로 약속했다."
    },
    {
      id: "p2",
      text: "도서관에서 수아는 과학 도서를 좋아했고 하윤이는 시집을 즐겨 읽었다. 서로 관심 분야가 달랐지만 점심시간이면 나란히 앉아 김밥을 먹으며 읽은 책 이야기를 나누었다. 하윤이가 들려주는 시 구절은 수아에게 낯설지만 따뜻하게 다가왔고, 수아가 설명하는 별자리 이야기에 하윤이는 눈을 반짝이며 귀를 기울였다. 어느 날 하윤이가 직접 쓴 짧은 시를 수아에게 보여주었다. 하늘에서 별이 내려와 도서관 창턱에 앉았다는 내용이었는데, 수아는 그 시가 자신을 가리키는 것 같아 얼굴이 붉어졌다. 둘은 서로의 세계를 조금씩 나누며 방학이 끝나지 않기를 바랐다."
    },
    {
      id: "p3",
      text: "방학이 끝나고 새 학기가 시작되자 하윤이의 얼굴에는 더 이상 긴장의 빛이 없었다. 교실에 들어서면 수아 옆자리에 가방을 내려놓고 환하게 웃었다. 반 아이들도 하윤이에게 먼저 말을 걸기 시작했고, 점심시간에는 여러 명이 함께 모여 이야기꽃을 피웠다. 수아는 방학 동안 함께 보낸 시간이 하윤이에게 작은 용기가 되었음을 느꼈다. 봄이 되어 도서관 앞 벚꽃이 필 무렵 하윤이가 수아에게 편지 한 통을 건넸다. 편지에는 네 덕분에 이 학교가 좋아졌다는 한 줄과 함께 벚꽃잎 하나가 끼워져 있었다. 수아는 편지를 읽고 또 읽으며 미소를 지었다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "하윤이가 전학 온 후 쉬는 시간에 주로 한 일은?", [findRange(paragraphs, "p1", "자리에 앉아 책만 읽었다")]),
    makeConfirmQ("q2", "수아가 하윤이에게 처음 제안한 것은 무엇인가?", [findRange(paragraphs, "p1", "방학 동안 같이 도서관에 가지 않겠느냐고 물었다")]),
    makeConfirmQ("q3", "도서관에서 수아가 좋아한 책의 분야는?", [findRange(paragraphs, "p2", "수아는 과학 도서를 좋아했고")]),
    makeConfirmQ("q4", "하윤이가 직접 쓴 시의 내용은 무엇이었는가?", [findRange(paragraphs, "p2", "하늘에서 별이 내려와 도서관 창턱에 앉았다는 내용이었는데")]),
    makeConfirmQ("q5", "새 학기에 하윤이의 달라진 모습은?", [findRange(paragraphs, "p3", "교실에 들어서면 수아 옆자리에 가방을 내려놓고 환하게 웃었다")]),
    makeConfirmQ("q6", "하윤이가 수아에게 편지를 건넨 시기는?", [findRange(paragraphs, "p3", "봄이 되어 도서관 앞 벚꽃이 필 무렵")]),
    makeConfirmQ("q7", "편지에 적힌 한 줄과 함께 끼워져 있던 것은?", [findRange(paragraphs, "p3", "네 덕분에 이 학교가 좋아졌다는 한 줄과 함께 벚꽃잎 하나가 끼워져 있었다")])
  ];

  const content = assembleFull(334, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 335 (홀수 → 비문학) ───
function buildDay335() {
  const paragraphs = [
    {
      id: "p1",
      text: "화산은 지구 내부의 마그마가 지표면으로 분출되는 현상으로, 지구의 지질 활동을 이해하는 핵심 단서이다. 지구의 내부는 핵, 맨틀, 지각의 세 층으로 나뉘며, 맨틀 상부의 높은 온도와 압력 조건에서 암석이 부분적으로 녹아 마그마가 생성된다. 이 마그마는 주변 암석보다 밀도가 낮아 상승하게 되고, 지각의 약한 부분을 뚫고 올라와 화산 폭발을 일으킨다. 화산 폭발의 유형은 마그마의 점성과 가스 함량에 따라 크게 달라진다. 점성이 낮고 가스가 적은 마그마는 조용히 흘러내리는 용암류를 형성하지만, 점성이 높고 가스가 많은 마그마는 폭발적으로 분출되어 화산재와 화쇄류를 만들어 낸다."
    },
    {
      id: "p2",
      text: "전 세계 화산의 대부분은 판의 경계에 분포한다. 태평양을 둘러싼 환태평양 화산대는 불의 고리라 불리며, 전 세계 활화산의 약 75퍼센트가 이 지역에 집중되어 있다. 판이 충돌하여 한쪽이 다른 쪽 아래로 섭입되는 곳에서는 섭입하는 판에서 방출된 물이 맨틀의 녹는점을 낮춰 마그마 생성을 촉진한다. 한편 하와이 제도처럼 판의 내부에 위치한 화산도 있는데, 이는 맨틀 깊은 곳에서 올라오는 열점 위에 자리한 것이다. 열점은 고정되어 있지만 그 위의 판이 이동하기 때문에 화산섬이 줄지어 형성되는 독특한 지형이 나타난다."
    },
    {
      id: "p3",
      text: "화산 활동은 파괴적인 측면만 있는 것이 아니다. 화산재는 칼륨과 인 등의 무기질이 풍부하여 주변 토양을 비옥하게 만든다. 이탈리아의 나폴리 지역이나 인도네시아의 자바섬이 인구 밀도가 높은 이유도 화산 토양의 높은 생산성과 관련이 있다. 또한 화산 지역에서는 지열 에너지를 활용할 수 있어 아이슬란드에서는 전력의 상당 부분을 지열 발전으로 충당하고 있다. 화산이 분출하면서 생성된 광물 자원은 금, 은, 구리 등 경제적으로 중요한 금속을 포함하기도 한다. 이처럼 화산은 위험과 혜택을 동시에 안겨 주는 자연 현상이다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "마그마는 지구 내부 어디에서 생성되는가?", [findRange(paragraphs, "p1", "맨틀 상부의 높은 온도와 압력 조건에서 암석이 부분적으로 녹아 마그마가 생성된다")]),
    makeConfirmQ("q2", "마그마가 상승하는 이유는 무엇인가?", [findRange(paragraphs, "p1", "마그마는 주변 암석보다 밀도가 낮아 상승하게 되고")]),
    makeConfirmQ("q3", "점성이 높고 가스가 많은 마그마의 분출 결과는?", [findRange(paragraphs, "p1", "폭발적으로 분출되어 화산재와 화쇄류를 만들어 낸다")]),
    makeConfirmQ("q4", "환태평양 화산대에 전 세계 활화산의 몇 퍼센트가 집중되어 있는가?", [findRange(paragraphs, "p2", "전 세계 활화산의 약 75퍼센트가 이 지역에 집중되어 있다")]),
    makeConfirmQ("q5", "하와이 제도의 화산이 판 내부에 위치한 이유는?", [findRange(paragraphs, "p2", "맨틀 깊은 곳에서 올라오는 열점 위에 자리한 것이다")]),
    makeConfirmQ("q6", "화산재가 토양을 비옥하게 만드는 이유는?", [findRange(paragraphs, "p3", "화산재는 칼륨과 인 등의 무기질이 풍부하여 주변 토양을 비옥하게 만든다")]),
    makeConfirmQ("q7", "아이슬란드에서 지열 에너지를 어떻게 활용하고 있는가?", [findRange(paragraphs, "p3", "아이슬란드에서는 전력의 상당 부분을 지열 발전으로 충당하고 있다")])
  ];

  const content = assembleFull(335, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 336 (짝수 → 문학) ───
function buildDay336() {
  const paragraphs = [
    {
      id: "p1",
      text: "민재는 졸업식 날 운동장 한구석에 서서 학교 건물을 올려다보았다. 6년 동안 다닌 학교를 떠난다는 것이 실감나지 않았다. 1학년 때 처음 교문을 들어서던 날이 어제 같았다. 울먹이는 민재의 손을 잡고 교실까지 데려다주신 어머니의 온기가 아직도 손바닥에 남아 있는 듯했다. 운동장 구석의 플라타너스 나무는 민재가 입학했을 때보다 훨씬 크게 자라 있었다. 여름이면 넓은 잎사귀가 시원한 그늘을 만들어 주어 아이들이 그 아래에 모여 앉곤 했다. 나무 밑동에는 2학년 때 친구들과 함께 묻었던 타임캡슐이 잠들어 있었다."
    },
    {
      id: "p2",
      text: "졸업식이 끝나고 교실로 돌아오니 담임 선생님이 칠판에 한마디를 적어 두셨다. 여기서 배운 것을 잊지 말고 더 넓은 세상으로 나아가라는 글이었다. 아이들은 하나둘 칠판 앞에 서서 자신의 이름 옆에 짧은 다짐을 써넣었다. 민재는 늘 꿈꾸는 사람이 되겠다고 썼다. 창밖으로 봄바람이 불어와 커튼이 부드럽게 흔들렸다. 선생님은 아이들에게 마지막 선물로 손수 접은 종이학을 한 마리씩 나누어 주시며 각자의 소원을 담아 날려 보내라고 말씀하셨다. 민재는 종이학을 손바닥 위에 올려놓고 한참을 바라보다가 주머니에 소중히 넣었다."
    },
    {
      id: "p3",
      text: "교문을 나서는 길에 민재는 같은 반이었던 서진이와 마주쳤다. 서진이는 다른 지역 중학교로 가기 때문에 당분간 만나기 어려울 터였다. 두 사람은 한동안 말없이 서 있다가 서진이가 먼저 입을 열었다. 네가 3학년 때 운동회에서 넘어졌을 때 등에 업고 보건실까지 뛰어갔던 것을 아직도 기억한다고 했다. 민재는 웃으며 대답했다. 그때 서진이가 울면서 고맙다고 했던 것도 기억한다고. 두 사람은 서로의 주먹을 가볍게 부딪히고 각자의 방향으로 걸어갔다. 교문 앞 벚나무에서 꽃잎이 바람에 날려 민재의 어깨 위에 내려앉았다. 민재는 뒤돌아보지 않았지만, 눈가가 촉촉해져 있었다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "민재가 졸업식 날 운동장에서 한 일은?", [findRange(paragraphs, "p1", "운동장 한구석에 서서 학교 건물을 올려다보았다")]),
    makeConfirmQ("q2", "1학년 때 민재를 교실까지 데려다준 사람은?", [findRange(paragraphs, "p1", "울먹이는 민재의 손을 잡고 교실까지 데려다주신 어머니")]),
    makeConfirmQ("q3", "나무 밑동에 묻어 둔 것은 무엇인가?", [findRange(paragraphs, "p1", "2학년 때 친구들과 함께 묻었던 타임캡슐이 잠들어 있었다")]),
    makeConfirmQ("q4", "민재가 칠판에 적은 다짐은 무엇인가?", [findRange(paragraphs, "p2", "늘 꿈꾸는 사람이 되겠다고 썼다")]),
    makeConfirmQ("q5", "선생님이 아이들에게 준 마지막 선물은?", [findRange(paragraphs, "p2", "손수 접은 종이학을 한 마리씩 나누어 주시며")]),
    makeConfirmQ("q6", "서진이가 기억하고 있던 민재의 행동은?", [findRange(paragraphs, "p3", "운동회에서 넘어졌을 때 등에 업고 보건실까지 뛰어갔던 것을 아직도 기억한다고 했다")]),
    makeConfirmQ("q7", "두 사람이 작별할 때 한 행동은?", [findRange(paragraphs, "p3", "서로의 주먹을 가볍게 부딪히고 각자의 방향으로 걸어갔다")])
  ];

  const content = assembleFull(336, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 337 (홀수 → 비문학) ───
function buildDay337() {
  const paragraphs = [
    {
      id: "p1",
      text: "지도는 인류가 공간 정보를 기록하고 전달하기 위해 발명한 가장 오래된 도구 중 하나이다. 고대 바빌로니아에서는 점토판 위에 도시와 강의 위치를 새겨 넣었고, 고대 그리스의 지리학자 에라토스테네스는 지구의 둘레를 최초로 계산하여 보다 정확한 지도 제작의 기초를 놓았다. 중세 유럽에서는 종교적 세계관이 반영된 마파문디가 제작되었으나, 이는 실용적 목적보다는 신학적 상징에 가까웠다. 대항해 시대에 이르러 항해술의 발달과 함께 정밀한 해도가 필요해졌고, 메르카토르는 항해에 적합한 원통 도법을 개발하여 지도 제작에 혁명을 가져왔다."
    },
    {
      id: "p2",
      text: "근대 이후 측량 기술의 발전은 지도의 정확도를 비약적으로 높였다. 삼각 측량법의 도입으로 넓은 지역의 지형을 체계적으로 기록할 수 있게 되었고, 항공 사진 측량은 접근하기 어려운 지역까지 정밀하게 지도화할 수 있는 길을 열었다. 20세기 후반에는 인공위성을 이용한 원격 탐사 기술이 등장하여 지구 전체의 모습을 실시간으로 관측하는 것이 가능해졌다. 특히 미국의 랜드샛 위성은 1972년 발사 이후 수십 년간 지구 표면의 변화를 기록하며 환경 연구에도 크게 기여했다. 이러한 기술의 축적 위에 현대의 디지털 지도와 지리 정보 시스템이 탄생하게 되었다."
    },
    {
      id: "p3",
      text: "오늘날 지도는 종이에서 화면으로 옮겨가며 우리 일상에 깊이 자리 잡았다. 스마트폰의 지도 앱은 실시간 교통 정보와 경로 안내를 제공하고, 위성 항법 장치는 자동차와 항공기의 운항을 돕는다. 지리 정보 시스템은 도시 계획, 재난 관리, 환경 모니터링 등 다양한 분야에서 핵심 도구로 활용되고 있다. 최근에는 3차원 지도와 증강 현실 기술이 결합되어 건물 내부까지 안내하는 실내 지도 서비스도 등장했다. 지도는 단순히 위치를 알려주는 것을 넘어 공간 데이터를 분석하고 의사 결정을 지원하는 종합 정보 플랫폼으로 진화하고 있다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "고대 바빌로니아에서 지도를 기록한 재료는 무엇인가?", [findRange(paragraphs, "p1", "점토판 위에 도시와 강의 위치를 새겨 넣었고")]),
    makeConfirmQ("q2", "에라토스테네스가 지도 제작에 기여한 업적은?", [findRange(paragraphs, "p1", "지구의 둘레를 최초로 계산하여 보다 정확한 지도 제작의 기초를 놓았다")]),
    makeConfirmQ("q3", "메르카토르가 개발한 것은 무엇인가?", [findRange(paragraphs, "p1", "메르카토르는 항해에 적합한 원통 도법을 개발하여 지도 제작에 혁명을 가져왔다")]),
    makeConfirmQ("q4", "삼각 측량법의 도입으로 가능해진 것은?", [findRange(paragraphs, "p2", "넓은 지역의 지형을 체계적으로 기록할 수 있게 되었고")]),
    makeConfirmQ("q5", "인공위성을 이용한 원격 탐사 기술이 가능하게 한 것은?", [findRange(paragraphs, "p2", "지구 전체의 모습을 실시간으로 관측하는 것이 가능해졌다")]),
    makeConfirmQ("q6", "지리 정보 시스템이 활용되는 분야에는 무엇이 있는가?", [findRange(paragraphs, "p3", "도시 계획, 재난 관리, 환경 모니터링 등 다양한 분야에서 핵심 도구로 활용되고 있다")]),
    makeConfirmQ("q7", "현대 지도가 진화하고 있는 방향은?", [findRange(paragraphs, "p3", "공간 데이터를 분석하고 의사 결정을 지원하는 종합 정보 플랫폼으로 진화하고 있다")])
  ];

  const content = assembleFull(337, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 338 (짝수 → 문학) ───
function buildDay338() {
  const paragraphs = [
    {
      id: "p1",
      text: "유진이는 할아버지의 시계 수리점을 좋아했다. 가게에 들어서면 벽 가득 걸린 시계들이 제각기 다른 소리로 째깍거렸다. 어떤 시계는 묵직하게, 어떤 시계는 경쾌하게 소리를 내어 가게 전체가 하나의 오케스트라처럼 들리곤 했다. 할아버지는 확대경을 눈에 붙이고 조그만 나사를 돌리며 하루 종일 시계 앞에 앉아 계셨다. 유진이가 심심하다고 투정을 부리면 할아버지는 고장 난 시계 하나를 꺼내 들고 이 시계가 왜 멈췄는지 한번 들어 보라고 하셨다. 유진이는 시계를 귀에 대고 가만히 소리를 들었다. 아무 소리도 나지 않는 시계가 왠지 슬프게 느껴졌다."
    },
    {
      id: "p2",
      text: "초등학교 5학년이 되던 해, 할아버지가 병원에 입원하셨다. 시계 수리점은 문을 닫았고 가게 안의 시계들은 하나둘 멈추기 시작했다. 유진이는 병문안을 갈 때마다 할아버지의 손을 잡고 가게 이야기를 들려드렸다. 할아버지는 눈을 감고 듣다가 시계가 멈춘다고 시간이 멈추는 건 아니란다 하고 조용히 말씀하셨다. 유진이는 그 말이 무슨 뜻인지 바로 이해하지 못했지만 가슴 한쪽이 먹먹해졌다. 병실 창밖으로 노을이 물들고 있었고, 벽에 걸린 둥근 시계만이 조용히 째깍거리고 있었다. 할아버지는 유진이의 머리를 쓰다듬으시며 네가 고치면 된다고 미소를 지으셨다."
    },
    {
      id: "p3",
      text: "할아버지가 퇴원하신 뒤 유진이는 시계 수리를 배우기 시작했다. 처음에는 나사를 잘못 풀어 부품이 튀어 나가기도 했고, 태엽을 잘못 감아 시계가 오히려 더 빨리 돌아가기도 했다. 하지만 할아버지의 인내심 있는 가르침 덕분에 석 달 만에 벽시계 하나를 스스로 고칠 수 있게 되었다. 유진이가 고친 시계의 초침이 다시 움직이기 시작했을 때 할아버지는 가만히 그 소리를 듣고 계시다가 눈가에 주름을 잡으며 웃으셨다. 그 미소 속에는 자신의 기술이 다음 세대로 이어지는 것에 대한 깊은 안도감이 담겨 있었다. 가게 벽에는 유진이가 처음 고친 시계가 오늘도 변함없이 시간을 새기고 있다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "할아버지의 시계 수리점에 들어서면 느껴지는 것은?", [findRange(paragraphs, "p1", "벽 가득 걸린 시계들이 제각기 다른 소리로 째깍거렸다")]),
    makeConfirmQ("q2", "유진이가 심심할 때 할아버지가 한 행동은?", [findRange(paragraphs, "p1", "고장 난 시계 하나를 꺼내 들고 이 시계가 왜 멈췄는지 한번 들어 보라고 하셨다")]),
    makeConfirmQ("q3", "할아버지가 입원한 뒤 가게에서 일어난 일은?", [findRange(paragraphs, "p2", "시계 수리점은 문을 닫았고 가게 안의 시계들은 하나둘 멈추기 시작했다")]),
    makeConfirmQ("q4", "할아버지가 유진이에게 한 말의 의미는?", [findRange(paragraphs, "p2", "시계가 멈춘다고 시간이 멈추는 건 아니란다")]),
    makeConfirmQ("q5", "할아버지가 유진이에게 마지막으로 한 말은?", [findRange(paragraphs, "p2", "네가 고치면 된다고 미소를 지으셨다")]),
    makeConfirmQ("q6", "유진이가 시계를 스스로 고칠 수 있기까지 걸린 기간은?", [findRange(paragraphs, "p3", "석 달 만에 벽시계 하나를 스스로 고칠 수 있게 되었다")]),
    makeConfirmQ("q7", "유진이가 처음 고친 시계는 현재 어디에 있는가?", [findRange(paragraphs, "p3", "가게 벽에는 유진이가 처음 고친 시계가 오늘도 변함없이 시간을 새기고 있다")])
  ];

  const content = assembleFull(338, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── 실행부 ───
const results = [
  { dayIndex: 334, ...buildDay334() },
  { dayIndex: 335, ...buildDay335() },
  { dayIndex: 336, ...buildDay336() },
  { dayIndex: 337, ...buildDay337() },
  { dayIndex: 338, ...buildDay338() }
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
  path.join(__dirname, '..', 'generated', 'new', 'batch-f2-334-338.json'),
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
