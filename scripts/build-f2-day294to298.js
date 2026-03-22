#!/usr/bin/env node
// 프레게2 Day 294~298 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION(비문학), 짝수 Day = LITERATURE(문학)
// 목표 글자수: 900±50 (850~950자)

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
  return { contentId: `dr-f2-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(프레게 2) Day ${dayIndex} ${subAreaKo}`, description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_2", schoolGradeRange: { min: 6, max: 6 }, area: "READING", subArea,
    competencies: ["READING"], tags: ["daily"], access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 }, timeLimitSec: 480, assets: {},
    payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 }, confirm: { questions: confirmQuestions } }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return { content_type: "DAILY_READING", level_id: "FREGE_2", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// ─── Day 294: 문학 (LITERATURE) ─── 주제: 단편 소설 - 유리병 속 편지
function buildDay294() {
  const paragraphs = [
    { id: "p1", text: "해변 마을에 사는 열두 살 소녀 하은이는 매일 학교가 끝나면 바닷가로 달려갔다. 파도가 밀려올 때마다 조개껍데기 사이에서 보물을 찾는 것이 하은이의 취미였다. 어느 여름날, 하은이는 젖은 모래 위에 반쯤 묻힌 초록색 유리병 하나를 발견했다. 병 속에는 물기에 번진 편지 한 장이 돌돌 말려 들어 있었다. 하은이는 조심스럽게 코르크 마개를 빼고 편지를 꺼냈다." },
    { id: "p2", text: "편지에는 또래 아이의 글씨로 이렇게 적혀 있었다. 이 편지를 주운 사람에게, 나는 바다 건너 작은 섬에 사는 열한 살 소년입니다. 우리 섬에는 학교가 없어서 어머니가 글을 가르쳐 주십니다. 바다 너머에는 어떤 세상이 있는지 궁금합니다. 이 편지를 읽는다면 답장을 보내 주세요. 편지의 마지막에는 소년의 이름 대신 작은 별 모양이 그려져 있었다. 하은이는 가슴이 두근거렸다. 바다를 건너온 종이 위에 누군가의 외로움과 호기심이 담겨 있다는 사실이 놀라웠다." },
    { id: "p3", text: "하은이는 그날 밤 책상 앞에 앉아 답장을 쓰기 시작했다. 자기가 사는 마을의 모습, 학교에서 배우는 것들, 좋아하는 바다 색깔까지 꼼꼼히 적었다. 편지 끝에는 소년의 별 모양 옆에 작은 달 그림을 그려 넣었다. 다음 날 하은이는 유리병에 편지를 넣고 코르크를 끼운 뒤, 밀물이 시작되는 시각에 맞추어 바다에 띄워 보냈다. 유리병은 파도를 타고 점점 멀어져 갔고, 하은이는 오랫동안 서서 병이 사라지는 것을 지켜보았다." },
    { id: "p4", text: "몇 달이 지나도 답장은 오지 않았다. 하은이는 매일 해변을 걸으며 유리병을 찾았지만 헛수고였다. 겨울이 되어 바닷바람이 차가워졌을 무렵, 하은이는 파도에 밀려온 투명한 유리병 하나를 발견했다. 안에는 조그만 종이가 들어 있었고, 거기에는 별 모양과 달 모양이 나란히 그려져 있었다. 글씨는 한 줄뿐이었다. 당신의 편지가 도착했습니다, 고맙습니다. 하은이는 차가운 바람 속에서 환하게 웃었다. 바다는 두 아이의 마음을 잇는 우체부가 되어 주었다." }
  ];
  const cq = [
    makeConfirmQ("q1", "하은이가 해변에서 발견한 것은?", [findRange(paragraphs, "p1", "젖은 모래 위에 반쯤 묻힌 초록색 유리병 하나를 발견했다")]),
    makeConfirmQ("q2", "편지를 쓴 소년에 대한 정보는?", [findRange(paragraphs, "p2", "바다 건너 작은 섬에 사는 열한 살 소년입니다")]),
    makeConfirmQ("q3", "소년의 섬에서 누가 글을 가르쳐 주었나?", [findRange(paragraphs, "p2", "우리 섬에는 학교가 없어서 어머니가 글을 가르쳐 주십니다")]),
    makeConfirmQ("q4", "하은이가 답장 편지 끝에 그린 것은?", [findRange(paragraphs, "p3", "소년의 별 모양 옆에 작은 달 그림을 그려 넣었다")]),
    makeConfirmQ("q5", "하은이가 유리병을 바다에 띄운 시각은?", [findRange(paragraphs, "p3", "밀물이 시작되는 시각에 맞추어 바다에 띄워 보냈다")]),
    makeConfirmQ("q6", "몇 달 뒤 하은이가 발견한 답장의 내용은?", [findRange(paragraphs, "p4", "당신의 편지가 도착했습니다, 고맙습니다")])
  ];
  const content = assembleFull(294, "LITERATURE", "문학", paragraphs, cq);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 295: 비문학 (NONFICTION) ─── 주제: 화폐의 역사와 디지털 화폐
function buildDay295() {
  const paragraphs = [
    { id: "p1", text: "인류가 물물교환의 불편함을 해결하기 위해 처음 사용한 화폐는 조개껍데기, 소금, 곡물 같은 물품 화폐였다. 이러한 물품 화폐는 내구성이 낮고 운반이 어려운 단점이 있었기에, 점차 금속 화폐로 대체되었다. 기원전 칠 세기경 소아시아의 리디아 왕국에서 처음으로 금과 은의 합금인 일렉트럼으로 주화를 만들었으며, 이것이 오늘날 동전의 시초로 여겨진다. 금속 화폐는 균일한 무게와 순도를 보증할 수 있어 거래의 신뢰성을 크게 높였다." },
    { id: "p2", text: "종이 화폐는 중국 송나라 때 세계 최초로 등장했다. 상인들이 무거운 동전 대신 예치 증서를 거래에 사용하기 시작한 것이 그 기원이다. 이후 원나라를 거쳐 유럽으로 전파된 종이 화폐는 근대 은행 제도의 발전과 함께 각국의 공식 통화로 자리 잡았다. 종이 화폐의 가치는 금과의 교환 가능성에 기반한 금본위제로 유지되었으나, 이십 세기 중반 이후 대부분의 국가가 금본위제를 폐지하고 정부의 신용을 바탕으로 한 신용 화폐 체제로 전환했다." },
    { id: "p3", text: "이십일 세기에 접어들면서 화폐의 형태는 다시 한번 혁명적인 변화를 맞이하고 있다. 신용 카드와 전자 이체가 보편화되면서 실물 화폐의 사용 비중은 꾸준히 줄어들고 있으며, 스마트폰을 이용한 간편 결제 서비스가 일상화되었다. 나아가 블록체인 기술을 기반으로 한 암호 화폐가 등장하여 중앙 기관 없이도 거래를 검증할 수 있는 탈중앙화 금융의 가능성을 열었다. 비트코인을 필두로 수천 종의 암호 화폐가 만들어졌다." },
    { id: "p4", text: "최근에는 각국 중앙은행이 직접 발행하는 디지털 화폐, 즉 시비디시의 도입이 활발히 논의되고 있다. 시비디시는 암호 화폐와 달리 국가가 가치를 보증하며, 기존 금융 시스템과의 호환성을 유지하면서도 거래 비용을 줄이고 금융 포용성을 높일 수 있다는 장점이 있다. 그러나 개인의 금융 거래가 정부에 의해 추적될 수 있다는 사생활 침해 우려와, 기존 은행 시스템의 역할이 축소될 수 있다는 점은 해결해야 할 과제로 남아 있다." }
  ];
  const cq = [
    makeConfirmQ("q1", "최초의 주화를 만든 나라는?", [findRange(paragraphs, "p1", "소아시아의 리디아 왕국에서 처음으로 금과 은의 합금인 일렉트럼으로 주화를 만들었으며")]),
    makeConfirmQ("q2", "금속 화폐의 장점은?", [findRange(paragraphs, "p1", "균일한 무게와 순도를 보증할 수 있어 거래의 신뢰성을 크게 높였다")]),
    makeConfirmQ("q3", "종이 화폐가 세계 최초로 등장한 나라는?", [findRange(paragraphs, "p2", "종이 화폐는 중국 송나라 때 세계 최초로 등장했다")]),
    makeConfirmQ("q4", "금본위제 폐지 이후 화폐 가치의 기반은?", [findRange(paragraphs, "p2", "정부의 신용을 바탕으로 한 신용 화폐 체제로 전환했다")]),
    makeConfirmQ("q5", "암호 화폐의 기반 기술은?", [findRange(paragraphs, "p3", "블록체인 기술을 기반으로 한 암호 화폐가 등장하여")]),
    makeConfirmQ("q6", "시비디시의 장점은?", [findRange(paragraphs, "p4", "거래 비용을 줄이고 금융 포용성을 높일 수 있다는 장점이 있다")]),
    makeConfirmQ("q7", "시비디시 도입의 우려 사항은?", [findRange(paragraphs, "p4", "개인의 금융 거래가 정부에 의해 추적될 수 있다는 사생활 침해 우려")])
  ];
  const content = assembleFull(295, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 296: 문학 (LITERATURE) ─── 주제: 단편 소설 - 소리 없는 약속
function buildDay296() {
  const paragraphs = [
    { id: "p1", text: "준서와 민재는 같은 아파트 단지에 사는 육 학년 친구였다. 두 사람은 매일 함께 등하교를 하고, 방과 후에는 단지 뒤편의 작은 숲에서 놀았다. 그런데 오 학년 말, 민재가 갑자기 청력을 잃었다. 원인 불명의 감각 신경성 난청이라는 진단이었다. 민재는 하루아침에 소리 없는 세상에 놓이게 되었고, 한동안 학교에도 나오지 못했다. 준서는 매일 민재의 집 앞에 편지를 두고 왔지만, 답장은 돌아오지 않았다." },
    { id: "p2", text: "겨울 방학이 끝나고 새 학기가 시작되었을 때, 민재가 교실에 나타났다. 보청기를 낀 채 조용히 자리에 앉은 민재의 눈빛에는 불안이 가득했다. 아이들은 어떻게 대해야 할지 몰라 어색하게 웃기만 했다. 하지만 준서는 달랐다. 준서는 방학 동안 수어를 독학했던 것이다. 준서가 서툴게 두 손을 움직여 안녕, 보고 싶었어라고 수어로 말하자, 민재의 눈이 커졌다. 그리고 천천히 미소를 지으며 같은 수어로 나도라고 답했다." },
    { id: "p3", text: "그날 이후 준서는 매일 민재에게 수어를 써서 대화했다. 처음에는 서투른 동작에 오해가 생기기도 했지만, 둘은 웃으며 다시 시도했다. 점심시간에 준서가 수어로 농담을 하면 민재가 소리 없이 크게 웃었고, 다른 친구들도 하나둘 수어에 관심을 보이기 시작했다. 담임 선생님은 이 모습에 감동하여 주당 한 시간씩 수어 수업을 만들었다. 한 달 뒤에는 반 아이들 대부분이 간단한 인사와 감정 표현을 수어로 할 수 있게 되었다." },
    { id: "p4", text: "졸업식 날, 민재가 대표로 감사 인사를 전했다. 민재는 마이크 앞에 서서 떨리는 목소리로 말했다. 소리를 잃었을 때 세상이 끝난 줄 알았지만, 친구들이 내 세상으로 들어와 주었습니다. 그 순간 반 아이들이 일제히 일어나 수어로 축하해, 민재야라는 문장을 함께 표현했다. 강당에는 잠시 침묵이 흘렀고, 이내 학부모와 선생님들의 박수가 터져 나왔다. 준서는 무대 아래에서 손가락으로 별 모양을 만들어 보였고, 민재는 눈물을 글썽이며 같은 모양으로 답했다." }
  ];
  const cq = [
    makeConfirmQ("q1", "민재가 청력을 잃은 원인은?", [findRange(paragraphs, "p1", "원인 불명의 감각 신경성 난청이라는 진단이었다")]),
    makeConfirmQ("q2", "민재가 학교에 나오지 못하는 동안 준서가 한 일은?", [findRange(paragraphs, "p1", "매일 민재의 집 앞에 편지를 두고 왔지만")]),
    makeConfirmQ("q3", "준서가 방학 동안 한 일은?", [findRange(paragraphs, "p2", "준서는 방학 동안 수어를 독학했던 것이다")]),
    makeConfirmQ("q4", "준서의 행동에 영향을 받아 담임 선생님이 한 일은?", [findRange(paragraphs, "p3", "담임 선생님은 이 모습에 감동하여 주당 한 시간씩 수어 수업을 만들었다")]),
    makeConfirmQ("q5", "졸업식에서 민재가 한 말은?", [findRange(paragraphs, "p4", "소리를 잃었을 때 세상이 끝난 줄 알았지만, 친구들이 내 세상으로 들어와 주었습니다")]),
    makeConfirmQ("q6", "졸업식에서 반 아이들이 수어로 표현한 문장은?", [findRange(paragraphs, "p4", "수어로 축하해, 민재야라는 문장을 함께 표현했다")])
  ];
  const content = assembleFull(296, "LITERATURE", "문학", paragraphs, cq);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 297: 비문학 (NONFICTION) ─── 주제: 지진의 원리와 대비
function buildDay297() {
  const paragraphs = [
    { id: "p1", text: "지구의 표면은 하나의 단단한 껍질이 아니라 여러 개의 거대한 판으로 이루어져 있다. 이를 지각판이라 하며, 지각판은 그 아래에 있는 뜨거운 맨틀의 대류에 의해 느린 속도로 끊임없이 이동한다. 지각판이 서로 충돌하거나 어긋나면서 축적된 에너지가 갑작스럽게 방출될 때 지진이 발생한다. 지진이 시작되는 지하의 지점을 진원이라 하고, 진원의 바로 위 지표면의 지점을 진앙이라 한다." },
    { id: "p2", text: "지진의 세기를 나타내는 척도에는 규모와 진도가 있다. 규모는 지진 자체가 방출하는 에너지의 크기를 수치로 나타낸 것으로 전 세계 어디서나 같은 값을 갖는다. 반면 진도는 특정 장소에서 느끼는 흔들림의 정도를 등급으로 표현한 것이므로 관측 지점에 따라 달라진다. 일반적으로 진앙에 가까울수록 진도가 높고, 멀어질수록 낮아진다. 규모 오 이상의 지진은 건물에 피해를 줄 수 있으며, 규모 칠 이상이면 대규모 재난으로 이어질 수 있다." },
    { id: "p3", text: "지진은 직접적인 흔들림 외에도 다양한 이차 재해를 유발한다. 해저에서 강한 지진이 발생하면 바닷물이 크게 요동하여 쓰나미가 일어날 수 있다. 산간 지역에서는 산사태가 발생하며, 도시에서는 가스관 파열로 인한 화재가 뒤따르기도 한다. 또한 포화 상태의 느슨한 모래 지반이 지진의 진동으로 액체처럼 변하는 액상화 현상도 건물 붕괴의 주요 원인이다. 따라서 지진 대비는 흔들림뿐 아니라 연쇄적인 재해까지 고려해야 한다." },
    { id: "p4", text: "지진에 대비하기 위해서는 건축물의 내진 설계가 가장 기본적이다. 내진 설계란 건물이 일정 규모의 지진에도 무너지지 않도록 구조를 강화하는 것으로, 지진이 잦은 일본에서는 오래전부터 엄격한 기준이 적용되고 있다. 개인 차원에서는 지진 발생 시 튼튼한 탁자 아래로 들어가 머리를 보호하고, 흔들림이 멈춘 후 신속히 건물 밖으로 대피하는 행동 요령을 숙지해야 한다. 평소 비상용품을 갖춘 재난 가방을 준비하고, 가족 간 비상 연락 방법을 미리 정해 두는 것도 중요하다." }
  ];
  const cq = [
    makeConfirmQ("q1", "지각판이 이동하는 원인은?", [findRange(paragraphs, "p1", "뜨거운 맨틀의 대류에 의해 느린 속도로 끊임없이 이동한다")]),
    makeConfirmQ("q2", "진원과 진앙의 차이는?", [findRange(paragraphs, "p1", "지진이 시작되는 지하의 지점을 진원이라 하고, 진원의 바로 위 지표면의 지점을 진앙이라 한다")]),
    makeConfirmQ("q3", "규모와 진도의 차이는?", [findRange(paragraphs, "p2", "규모는 지진 자체가 방출하는 에너지의 크기를 수치로 나타낸 것으로 전 세계 어디서나 같은 값을 갖는다")]),
    makeConfirmQ("q4", "액상화 현상이란?", [findRange(paragraphs, "p3", "포화 상태의 느슨한 모래 지반이 지진의 진동으로 액체처럼 변하는 액상화 현상도 건물 붕괴의 주요 원인이다")]),
    makeConfirmQ("q5", "내진 설계란?", [findRange(paragraphs, "p4", "건물이 일정 규모의 지진에도 무너지지 않도록 구조를 강화하는 것")]),
    makeConfirmQ("q6", "지진 발생 시 개인의 행동 요령은?", [findRange(paragraphs, "p4", "튼튼한 탁자 아래로 들어가 머리를 보호하고, 흔들림이 멈춘 후 신속히 건물 밖으로 대피하는")]),
    makeConfirmQ("q7", "평소 지진 대비를 위해 해야 할 일은?", [findRange(paragraphs, "p4", "비상용품을 갖춘 재난 가방을 준비하고, 가족 간 비상 연락 방법을 미리 정해 두는 것도 중요하다")])
  ];
  const content = assembleFull(297, "NONFICTION", "비문학", paragraphs, cq);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 298: 문학 (LITERATURE) ─── 주제: 단편 소설 - 지붕 위의 정원
function buildDay298() {
  const paragraphs = [
    { id: "p1", text: "도시 한복판 낡은 건물의 옥상에는 아무도 모르는 작은 정원이 있었다. 그 정원을 가꾸는 사람은 칠 층에 혼자 사는 노인 윤 씨였다. 윤 씨는 매일 새벽 다섯 시에 일어나 녹슨 철문을 열고 옥상으로 올라갔다. 스티로폼 상자와 플라스틱 화분에 심은 상추, 고추, 방울토마토에 물을 주고, 잡초를 뽑고, 새순이 올라오는지 살폈다. 옥상 한쪽에는 사과 나무 한 그루가 시멘트 바닥 틈새에 뿌리를 내린 채 자라고 있었다." },
    { id: "p2", text: "건물에 새로 이사 온 중학생 지안이는 어느 날 우연히 옥상 문이 열려 있는 것을 보고 호기심에 올라갔다. 회색 콘크리트 사이로 펼쳐진 녹색 식물들을 보고 지안이는 눈을 의심했다. 이 높은 곳에 이런 곳이 있다니. 물을 주고 있던 윤 씨가 놀란 지안이를 보며 말했다. 구경만 하지 말고 이것 좀 들어 줄래. 그날부터 지안이는 방과 후마다 옥상에 올라가 윤 씨를 도왔다. 흙을 옮기고, 씨앗을 뿌리고, 지지대를 세우는 일은 생각보다 재미있었다." },
    { id: "p3", text: "여름이 되자 정원에는 탐스러운 열매가 달리기 시작했다. 윤 씨와 지안이는 수확한 채소를 이웃 주민들에게 나눠 주었다. 삼 층의 할머니는 상추를 받고 눈물을 글썽이며 고마워했고, 오 층의 젊은 부부는 고추를 받아 가며 김치를 담가 보겠다고 좋아했다. 이전에는 복도에서 마주쳐도 인사 한마디 나누지 않던 주민들이 옥상 정원을 매개로 서로의 이름을 부르기 시작했다. 윤 씨는 그런 모습을 보며 조용히 미소 지었다." },
    { id: "p4", text: "가을이 깊어지고 사과 나무에 열매가 달렸다. 작고 울퉁불퉁한 사과였지만 햇빛을 가득 품어 빛깔이 고왔다. 지안이는 그 사과를 따서 한 입 베어 물었다. 시큼하면서도 달았다. 지안이가 이 맛이에요, 옥상 정원의 맛이라고 말하자 윤 씨는 웃으며 대답했다. 높은 곳에서 자란 것들은 바람도 더 많이 맞고 비도 더 많이 맞지만, 그래서 더 단단해지는 법이란다. 지안이는 노인의 말이 사과 이야기만은 아니라는 것을 어렴풋이 느꼈다." }
  ];
  const cq = [
    makeConfirmQ("q1", "윤 씨가 옥상에서 기르는 식물은?", [findRange(paragraphs, "p1", "상추, 고추, 방울토마토에 물을 주고")]),
    makeConfirmQ("q2", "옥상에서 특이하게 자라는 나무는?", [findRange(paragraphs, "p1", "사과 나무 한 그루가 시멘트 바닥 틈새에 뿌리를 내린 채 자라고 있었다")]),
    makeConfirmQ("q3", "지안이가 옥상에 처음 올라간 계기는?", [findRange(paragraphs, "p2", "옥상 문이 열려 있는 것을 보고 호기심에 올라갔다")]),
    makeConfirmQ("q4", "옥상 정원이 건물 주민들에게 미친 변화는?", [findRange(paragraphs, "p3", "이전에는 복도에서 마주쳐도 인사 한마디 나누지 않던 주민들이 옥상 정원을 매개로 서로의 이름을 부르기 시작했다")]),
    makeConfirmQ("q5", "사과의 맛은?", [findRange(paragraphs, "p4", "시큼하면서도 달았다")]),
    makeConfirmQ("q6", "윤 씨가 사과 나무에 비유하여 전한 교훈은?", [findRange(paragraphs, "p4", "높은 곳에서 자란 것들은 바람도 더 많이 맞고 비도 더 많이 맞지만, 그래서 더 단단해지는 법이란다")])
  ];
  const content = assembleFull(298, "LITERATURE", "문학", paragraphs, cq);
  return { content, subArea: "LITERATURE" };
}

// ─── 실행부 ───
const results = [
  { dayIndex: 294, ...buildDay294() }, { dayIndex: 295, ...buildDay295() },
  { dayIndex: 296, ...buildDay296() }, { dayIndex: 297, ...buildDay297() },
  { dayIndex: 298, ...buildDay298() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];

results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

fs.writeFileSync(path.join(__dirname, '..', 'generated', 'new', 'batch-f2-294-298.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log('  ✅ generated/new/batch-f2-294-298.json');

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
