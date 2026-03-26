#!/usr/bin/env node
// 프레게2 Day 359~363 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION, 짝수 Day = LITERATURE
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

// ─── Day 359: 홀수 → 비문학 (NONFICTION) — 음식물 쓰레기와 환경 ───
function buildDay359() {
  const paragraphs = [
    { id: "p1", text: "우리가 매일 먹고 남기는 음식물 쓰레기는 환경에 심각한 영향을 미친다. 한국에서 하루에 발생하는 음식물 쓰레기의 양은 약 일만 사천 톤에 이르며, 이 중 상당 부분이 가정에서 나온다. 음식물 쓰레기에는 수분이 약 팔십 퍼센트 이상 포함되어 있어 일반 쓰레기와 달리 처리 과정이 까다롭다. 매립할 경우 악취와 함께 침출수가 발생하여 토양과 지하수를 오염시키고, 소각할 경우에도 높은 수분 함량 때문에 효율이 떨어진다." },
    { id: "p2", text: "음식물 쓰레기가 분해되는 과정에서 메탄가스가 발생한다. 메탄은 이산화탄소보다 온실 효과가 약 스물다섯 배나 강한 기체로, 지구 온난화를 가속시키는 주요 원인 중 하나이다. 세계적으로 음식물 쓰레기에서 나오는 온실가스 배출량은 전체 배출량의 약 팔 퍼센트를 차지한다. 만약 음식물 쓰레기를 하나의 국가로 본다면, 중국과 미국에 이어 세 번째로 온실가스를 많이 배출하는 셈이 된다." },
    { id: "p3", text: "음식물 쓰레기를 줄이기 위한 다양한 노력이 이루어지고 있다. 가장 기본적인 방법은 필요한 만큼만 음식을 구매하고 조리하는 것이다. 유통 기한과 소비 기한을 정확히 구분하는 것도 중요하다. 유통 기한은 판매가 가능한 기간을 뜻하고, 소비 기한은 먹어도 안전한 기간을 뜻하므로 유통 기한이 지났다고 바로 버릴 필요는 없다. 또한 남은 음식을 활용한 새로운 요리법을 익히는 것도 효과적이다." },
    { id: "p4", text: "정부와 지방 자치 단체에서도 음식물 쓰레기 감량을 위한 정책을 시행하고 있다. 종량제 봉투를 통한 배출 비용 부과, 음식물 쓰레기 감량기 보급, 퇴비화 시설 확충 등이 대표적이다. 특히 음식물 쓰레기를 사료나 퇴비로 재활용하면 자원 순환에 기여할 수 있다. 개인의 실천과 사회적 시스템이 함께 작동할 때 음식물 쓰레기로 인한 환경 문제를 효과적으로 해결할 수 있다." }
  ];
  console.log(`Day 359 글자수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("cq1", "한국에서 하루에 발생하는 음식물 쓰레기의 양은 얼마나 되나요?", [findRange(paragraphs, "p1", "하루에 발생하는 음식물 쓰레기의 양은 약 일만 사천 톤에 이르며")]),
    makeConfirmQ("cq2", "음식물 쓰레기를 매립할 때 발생하는 환경 문제는 무엇인가요?", [findRange(paragraphs, "p1", "악취와 함께 침출수가 발생하여 토양과 지하수를 오염시키고")]),
    makeConfirmQ("cq3", "메탄가스의 온실 효과는 이산화탄소와 비교해 얼마나 강한가요?", [findRange(paragraphs, "p2", "메탄은 이산화탄소보다 온실 효과가 약 스물다섯 배나 강한 기체로")]),
    makeConfirmQ("cq4", "유통 기한과 소비 기한의 차이는 무엇인가요?", [findRange(paragraphs, "p3", "유통 기한은 판매가 가능한 기간을 뜻하고, 소비 기한은 먹어도 안전한 기간을 뜻하므로")]),
    makeConfirmQ("cq5", "음식물 쓰레기를 줄이기 위한 가장 기본적인 방법은 무엇인가요?", [findRange(paragraphs, "p3", "필요한 만큼만 음식을 구매하고 조리하는 것이다")]),
    makeConfirmQ("cq6", "정부에서 시행하는 음식물 쓰레기 감량 정책에는 어떤 것들이 있나요?", [findRange(paragraphs, "p4", "종량제 봉투를 통한 배출 비용 부과, 음식물 쓰레기 감량기 보급, 퇴비화 시설 확충 등이 대표적이다")]),
    makeConfirmQ("cq7", "음식물 쓰레기 재활용의 대표적인 방법은 무엇인가요?", [findRange(paragraphs, "p4", "음식물 쓰레기를 사료나 퇴비로 재활용하면 자원 순환에 기여할 수 있다")])
  ];
  const content = assembleFull(359, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 360: 짝수 → 문학 (LITERATURE) — 창작 단편: 비 오는 날의 도서관 ───
function buildDay360() {
  const paragraphs = [
    { id: "p1", text: "비가 쏟아지던 토요일 오후, 수아는 우산도 없이 동네 도서관으로 뛰어 들어갔다. 머리카락에서 빗물이 뚝뚝 떨어졌고, 운동화 속 양말은 축축하게 젖어 있었다. 도서관 안은 고요했다. 높은 천장 아래로 나무 책장들이 줄지어 서 있었고, 창문을 때리는 빗소리만이 낮게 울렸다. 수아는 젖은 머리를 손으로 쓸어 넘기며 가장 구석진 자리를 찾아 앉았다. 집에 있기 싫었다. 아까 엄마와 심하게 다투었기 때문이다." },
    { id: "p2", text: "책장 사이를 걷다가 낡은 동화책 한 권이 눈에 띄었다. 표지가 닳아 제목을 읽기 어려웠지만, 펼쳐 보니 어릴 적 엄마가 읽어 주던 이야기였다. 용감한 토끼가 숲속 친구들을 도와 겨울을 나는 이야기였다. 수아는 페이지를 넘기며 엄마의 목소리가 귓가에 울리는 듯한 착각에 빠졌다. 엄마는 항상 토끼 대사를 읽을 때 목소리를 높이며 우스꽝스러운 표정을 지었다. 그때마다 수아는 이불을 뒤집어쓰고 깔깔대며 웃었다." },
    { id: "p3", text: "책의 마지막 장을 넘기자 뒷면에 연필로 적힌 글씨가 보였다. '수아에게, 엄마도 처음이라 서툴러. 미안해. 사랑해.' 수아는 글씨를 두 번, 세 번 읽었다. 눈시울이 뜨거워지며 눈물이 책 위로 떨어졌다. 이 책은 엄마가 도서관에 기증한 것이 분명했다. 수아가 커서 동화책을 더 이상 읽지 않게 되었을 때, 엄마는 이 책을 이곳에 두고 갔을 것이다. 그 안에 작은 메시지를 남긴 채로." },
    { id: "p4", text: "수아는 책을 가슴에 안고 한참을 앉아 있었다. 창밖의 비는 조금씩 그치고 있었고, 회색빛 구름 사이로 옅은 햇살이 비쳐 들어왔다. 수아는 자리에서 일어나 책을 원래 자리에 꽂았다. 다른 누군가도 이 책을 발견하고 따뜻한 마음을 느끼기를 바라면서. 도서관을 나서며 수아는 엄마에게 전화를 걸었다. 신호음이 두 번 울리고 엄마가 받았을 때, 수아는 조용히 말했다. \"엄마, 나 지금 갈게.\"" }
  ];
  console.log(`Day 360 글자수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("cq1", "수아가 도서관에 온 진짜 이유는 무엇이었나요?", [findRange(paragraphs, "p1", "집에 있기 싫었다. 아까 엄마와 심하게 다투었기 때문이다")]),
    makeConfirmQ("cq2", "수아가 발견한 동화책은 어떤 내용이었나요?", [findRange(paragraphs, "p2", "용감한 토끼가 숲속 친구들을 도와 겨울을 나는 이야기였다")]),
    makeConfirmQ("cq3", "엄마가 동화책을 읽어 줄 때 어떤 특징이 있었나요?", [findRange(paragraphs, "p2", "토끼 대사를 읽을 때 목소리를 높이며 우스꽝스러운 표정을 지었다")]),
    makeConfirmQ("cq4", "책 뒷면에 적힌 엄마의 메시지는 무엇이었나요?", [findRange(paragraphs, "p3", "수아에게, 엄마도 처음이라 서툴러. 미안해. 사랑해.")]),
    makeConfirmQ("cq5", "수아는 왜 이 책이 엄마가 기증한 것이라고 생각했나요?", [findRange(paragraphs, "p3", "수아가 커서 동화책을 더 이상 읽지 않게 되었을 때, 엄마는 이 책을 이곳에 두고 갔을 것이다")]),
    makeConfirmQ("cq6", "수아가 책을 원래 자리에 꽂은 이유는 무엇이었나요?", [findRange(paragraphs, "p4", "다른 누군가도 이 책을 발견하고 따뜻한 마음을 느끼기를 바라면서")])
  ];
  const content = assembleFull(360, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 361: 홀수 → 비문학 (NONFICTION) — 인체의 면역 체계 ───
function buildDay361() {
  const paragraphs = [
    { id: "p1", text: "우리 몸은 매 순간 수많은 세균, 바이러스, 곰팡이 등 외부 침입자의 공격을 받고 있다. 이러한 위협으로부터 몸을 지키는 방어 시스템을 면역 체계라고 한다. 면역 체계는 크게 선천 면역과 적응 면역으로 나뉜다. 선천 면역은 태어날 때부터 갖추고 있는 방어 기능으로, 피부나 점막 같은 물리적 장벽과 염증 반응 등이 여기에 해당한다. 선천 면역은 침입자의 종류를 구분하지 않고 빠르게 반응하는 것이 특징이다." },
    { id: "p2", text: "적응 면역은 특정 침입자를 인식하고 기억하는 보다 정교한 방어 체계이다. 적응 면역의 핵심은 림프구인데, 크게 티 세포와 비 세포로 나뉜다. 티 세포는 감염된 세포를 직접 공격하거나 다른 면역 세포를 활성화하는 역할을 한다. 비 세포는 항체를 만들어 침입자에 달라붙게 함으로써 침입자를 무력화시킨다. 적응 면역의 가장 중요한 특성은 기억 능력이다. 한번 싸운 병원체의 정보를 기억해 두었다가 같은 침입자가 다시 들어오면 훨씬 빠르고 강하게 대응한다." },
    { id: "p3", text: "예방 접종은 이러한 적응 면역의 기억 능력을 활용한 의학적 방법이다. 백신에는 약화되거나 죽은 병원체 또는 그 일부가 포함되어 있다. 이것을 몸에 주입하면 면역 체계가 해당 병원체를 인식하고 항체를 만든다. 실제로 그 병원체에 감염되었을 때 면역 체계가 빠르게 반응하여 질병의 발생을 막거나 증상을 가볍게 해 준다. 천연두의 근절과 소아마비의 급격한 감소는 예방 접종의 대표적인 성과이다." },
    { id: "p4", text: "면역 체계가 항상 완벽하게 작동하는 것은 아니다. 면역 체계가 지나치게 활성화되면 알레르기나 자가 면역 질환이 발생할 수 있다. 알레르기는 꽃가루나 먼지 같은 무해한 물질에 면역 체계가 과잉 반응하는 것이고, 자가 면역 질환은 면역 체계가 자기 자신의 세포를 적으로 착각하여 공격하는 상태이다. 건강한 면역 체계를 유지하기 위해서는 균형 잡힌 식사, 충분한 수면, 규칙적인 운동이 필요하다." }
  ];
  console.log(`Day 361 글자수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("cq1", "면역 체계는 크게 어떤 두 가지로 나뉘나요?", [findRange(paragraphs, "p1", "면역 체계는 크게 선천 면역과 적응 면역으로 나뉜다")]),
    makeConfirmQ("cq2", "선천 면역의 특징은 무엇인가요?", [findRange(paragraphs, "p1", "침입자의 종류를 구분하지 않고 빠르게 반응하는 것이 특징이다")]),
    makeConfirmQ("cq3", "비 세포가 침입자를 무력화시키는 방법은 무엇인가요?", [findRange(paragraphs, "p2", "항체를 만들어 침입자에 달라붙게 함으로써 침입자를 무력화시킨다")]),
    makeConfirmQ("cq4", "적응 면역의 가장 중요한 특성은 무엇인가요?", [findRange(paragraphs, "p2", "한번 싸운 병원체의 정보를 기억해 두었다가 같은 침입자가 다시 들어오면 훨씬 빠르고 강하게 대응한다")]),
    makeConfirmQ("cq5", "백신에는 어떤 것이 포함되어 있나요?", [findRange(paragraphs, "p3", "약화되거나 죽은 병원체 또는 그 일부가 포함되어 있다")]),
    makeConfirmQ("cq6", "알레르기란 무엇인가요?", [findRange(paragraphs, "p4", "꽃가루나 먼지 같은 무해한 물질에 면역 체계가 과잉 반응하는 것이고")]),
    makeConfirmQ("cq7", "건강한 면역 체계를 유지하기 위해 필요한 것은 무엇인가요?", [findRange(paragraphs, "p4", "균형 잡힌 식사, 충분한 수면, 규칙적인 운동이 필요하다")])
  ];
  const content = assembleFull(361, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 362: 짝수 → 문학 (LITERATURE) — 창작 단편: 강아지와 소년 ───
function buildDay362() {
  const paragraphs = [
    { id: "p1", text: "준혁이가 처음 봄이를 만난 것은 초등학교 사 학년 여름이었다. 학교 뒤편 공터에 종이 상자 하나가 놓여 있었고, 그 안에 갈색 강아지 한 마리가 웅크리고 있었다. 강아지는 눈이 아직 제대로 뜨이지 않을 만큼 작았고, 몸을 가늘게 떨고 있었다. 준혁이는 강아지를 조심스럽게 들어 올렸다. 손바닥 위에 올려놓으니 강아지의 심장이 콩콩 뛰는 것이 느껴졌다. 준혁이는 그 순간 이 작은 생명을 꼭 지켜 주겠다고 마음먹었다." },
    { id: "p2", text: "엄마는 처음에 반대했다. 아파트에서 개를 키우면 냄새가 나고, 짖는 소리에 이웃에게 민폐가 된다는 이유였다. 준혁이는 매일 엄마에게 부탁했고, 자기가 책임지고 돌보겠다는 다짐을 수십 번 반복했다. 일주일 뒤 엄마는 결국 허락했지만 조건을 달았다. 산책은 반드시 준혁이가 시키고, 학교 성적이 떨어지면 다른 집에 보내겠다는 것이었다. 준혁이는 강아지에게 봄이라는 이름을 붙여 주었다. 봄날에 만났으니까, 라고 생각했지만 사실은 여름이었다." },
    { id: "p3", text: "봄이는 빠르게 자랐다. 반 년 만에 무릎까지 올 정도로 커졌고, 귀는 쫑긋 세워졌으며, 꼬리는 늘 바쁘게 흔들렸다. 준혁이가 학교에서 돌아오면 봄이는 현관문 앞에서 기다리다가 문이 열리는 순간 온몸으로 뛰어들었다. 준혁이가 슬플 때면 봄이는 무릎 위에 턱을 올리고 조용히 곁에 있어 주었다. 친구와 싸우고 울면서 들어온 날에도, 시험을 망치고 풀이 죽어 있는 날에도 봄이는 항상 같은 자리에서 기다렸다." },
    { id: "p4", text: "중학교에 올라가면서 준혁이는 바빠졌다. 산책을 빼먹는 날이 늘었고, 봄이와 노는 시간도 줄었다. 봄이의 눈가에 흰 털이 조금씩 늘어나는 것을 준혁이는 미처 알아채지 못했다. 어느 겨울 아침, 봄이가 현관문 앞에 없었다. 거실 구석 자기 방석 위에 조용히 누워 있었다. 준혁이가 다가가 이름을 불렀을 때, 봄이는 꼬리를 한 번 약하게 흔들었다. 그것이 봄이가 준혁이에게 보여 준 마지막 인사였다." }
  ];
  console.log(`Day 362 글자수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("cq1", "준혁이가 봄이를 처음 발견한 장소는 어디였나요?", [findRange(paragraphs, "p1", "학교 뒤편 공터에 종이 상자 하나가 놓여 있었고, 그 안에 갈색 강아지 한 마리가 웅크리고 있었다")]),
    makeConfirmQ("cq2", "엄마가 강아지를 키우는 것을 반대한 이유는 무엇이었나요?", [findRange(paragraphs, "p2", "아파트에서 개를 키우면 냄새가 나고, 짖는 소리에 이웃에게 민폐가 된다는 이유였다")]),
    makeConfirmQ("cq3", "엄마가 봄이를 키우도록 허락하면서 내건 조건은 무엇이었나요?", [findRange(paragraphs, "p2", "산책은 반드시 준혁이가 시키고, 학교 성적이 떨어지면 다른 집에 보내겠다는 것이었다")]),
    makeConfirmQ("cq4", "준혁이가 슬플 때 봄이는 어떻게 행동했나요?", [findRange(paragraphs, "p3", "봄이는 무릎 위에 턱을 올리고 조용히 곁에 있어 주었다")]),
    makeConfirmQ("cq5", "중학교에 올라간 뒤 준혁이의 달라진 행동은 무엇이었나요?", [findRange(paragraphs, "p4", "산책을 빼먹는 날이 늘었고, 봄이와 노는 시간도 줄었다")]),
    makeConfirmQ("cq6", "봄이가 준혁이에게 보여 준 마지막 인사는 어떤 것이었나요?", [findRange(paragraphs, "p4", "봄이는 꼬리를 한 번 약하게 흔들었다")])
  ];
  const content = assembleFull(362, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 363: 홀수 → 비문학 (NONFICTION) — 한글의 과학적 원리 ───
function buildDay363() {
  const paragraphs = [
    { id: "p1", text: "한글은 세종대왕이 일사사삼 년에 창제하여 일사사육 년에 반포한 문자이다. 한글이 다른 문자 체계와 구별되는 가장 큰 특징은 발음 기관의 모양을 본떠 자음을 만들었다는 점이다. 예를 들어 기역은 혀뿌리가 목구멍을 막는 모양을, 니은은 혀끝이 윗잇몸에 닿는 모양을, 미음은 입술 모양을 본뜬 것이다. 이처럼 소리가 나는 원리를 글자의 형태에 반영한 문자는 세계적으로 매우 드물다." },
    { id: "p2", text: "모음은 천지인 삼재의 원리에 따라 만들어졌다. 하늘을 상징하는 점, 땅을 상징하는 가로획, 사람을 상징하는 세로획을 조합하여 기본 모음을 구성했다. 아 소리는 세로획 오른쪽에 점을 찍어 해가 뜨는 동쪽을 나타내고, 어 소리는 왼쪽에 점을 찍어 해가 지는 서쪽을 나타냈다. 이와 같이 모음의 구성에도 자연의 이치와 방위의 개념이 담겨 있어, 한글은 단순한 기록 도구를 넘어 철학적 사유가 반영된 문자라 할 수 있다." },
    { id: "p3", text: "한글의 또 다른 과학적 특징은 글자의 조합 방식에 있다. 자음과 모음을 조합하여 음절 단위로 모아쓰는 방식은 읽기와 쓰기의 효율성을 높여 준다. 영어 알파벳처럼 글자를 나란히 늘어놓는 풀어쓰기와 달리, 한글은 초성, 중성, 종성을 하나의 네모 칸 안에 배치한다. 이 덕분에 시각적으로 음절의 경계를 빠르게 파악할 수 있으며, 적은 수의 기본 자모로도 만 천 개 이상의 음절 조합이 가능하다." },
    { id: "p4", text: "한글의 과학성은 현대 기술에서도 빛을 발한다. 자모의 체계적인 구조 덕분에 컴퓨터와 스마트폰에서의 입력이 효율적이다. 스물네 개의 기본 자모만으로 모든 한국어 소리를 표현할 수 있어 자판 배열이 간결하다. 유네스코는 세종대왕의 이름을 딴 세종대왕 문해상을 제정하여 문맹 퇴치에 기여한 개인과 단체를 매년 시상하고 있다. 이는 한글의 우수성이 국제적으로 인정받고 있다는 증거이다." }
  ];
  console.log(`Day 363 글자수: ${charLen(paragraphs)}`);
  const confirmQuestions = [
    makeConfirmQ("cq1", "한글의 자음은 어떤 원리로 만들어졌나요?", [findRange(paragraphs, "p1", "발음 기관의 모양을 본떠 자음을 만들었다는 점이다")]),
    makeConfirmQ("cq2", "기역, 니은, 미음은 각각 무엇의 모양을 본뜬 것인가요?", [findRange(paragraphs, "p1", "기역은 혀뿌리가 목구멍을 막는 모양을, 니은은 혀끝이 윗잇몸에 닿는 모양을, 미음은 입술 모양을 본뜬 것이다")]),
    makeConfirmQ("cq3", "모음을 만들 때 적용된 원리는 무엇인가요?", [findRange(paragraphs, "p2", "천지인 삼재의 원리에 따라 만들어졌다")]),
    makeConfirmQ("cq4", "한글의 모아쓰기 방식이 가진 장점은 무엇인가요?", [findRange(paragraphs, "p3", "시각적으로 음절의 경계를 빠르게 파악할 수 있으며, 적은 수의 기본 자모로도 만 천 개 이상의 음절 조합이 가능하다")]),
    makeConfirmQ("cq5", "한글이 컴퓨터와 스마트폰에서 입력이 효율적인 이유는 무엇인가요?", [findRange(paragraphs, "p4", "스물네 개의 기본 자모만으로 모든 한국어 소리를 표현할 수 있어 자판 배열이 간결하다")]),
    makeConfirmQ("cq6", "유네스코가 한글의 우수성을 인정하여 시행하는 것은 무엇인가요?", [findRange(paragraphs, "p4", "세종대왕의 이름을 딴 세종대왕 문해상을 제정하여 문맹 퇴치에 기여한 개인과 단체를 매년 시상하고 있다")])
  ];
  const content = assembleFull(363, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── 실행 ───
const results = [
  { dayIndex: 359, ...buildDay359() }, { dayIndex: 360, ...buildDay360() },
  { dayIndex: 361, ...buildDay361() }, { dayIndex: 362, ...buildDay362() },
  { dayIndex: 363, ...buildDay363() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
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
fs.writeFileSync(path.join(newDir, 'batch-f2-359-363.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ 배치 파일: generated/new/batch-f2-359-363.json`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
