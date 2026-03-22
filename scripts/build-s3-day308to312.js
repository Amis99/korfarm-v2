// 소쉬르3 Day 308~312 일일독해 빌더
const fs = require('fs');
const path = require('path');

// ─── 유틸리티 ───
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

// ─── Day 308 (짝수 → 문학) ───
function buildDay308() {
  const paragraphs = [
    { id: "p1", text: "은지는 여름방학 첫날 시골 할아버지 댁으로 향했다. 기차를 타고 세 시간을 달려 작은 간이역에 내리자 할아버지가 밀짚모자를 쓴 채 환한 웃음으로 맞아 주셨다. 할아버지 집 마당에는 커다란 감나무가 서 있었고 그 아래에 낡은 그네가 매달려 있었다. 은지는 가방을 내려놓자마자 그네로 달려가 힘껏 발을 굴렀다. 바람이 얼굴을 스치며 하늘이 가까워지는 느낌이 들었고 초록빛 잎사귀들이 머리 위에서 살랑살랑 흔들렸다." },
    { id: "p2", text: "다음 날 아침 할아버지는 은지를 데리고 뒷산 개울로 올라갔다. 산길 양옆으로 이름 모를 들꽃들이 피어 있었고 새소리가 숲속 가득 울려 퍼졌다. 맑은 물속에서 작은 물고기들이 돌 사이를 빠르게 헤엄치고 있었다. 은지는 양말을 벗고 개울에 발을 담갔는데 물이 너무 차가워서 깜짝 놀랐다. 할아버지가 나뭇잎으로 작은 배를 만들어 물에 띄워 주셨다. 나뭇잎 배는 물살을 타고 돌부리를 지나 저 멀리까지 흘러갔다. 은지는 그 모습을 지켜보며 나도 저 배처럼 먼 곳까지 여행하고 싶다고 생각했다." },
    { id: "p3", text: "방학이 끝나고 집으로 돌아가는 기차 안에서 은지는 창밖으로 점점 멀어지는 산들을 바라보았다. 할아버지가 싸 주신 옥수수와 찐 감자가 가방 안에서 고소한 냄새를 풍겼다. 은지는 할아버지와 함께한 시간이 참 빠르게 지나갔다고 느꼈다. 개울에서 놀고 밤하늘에 별을 세던 순간들이 마치 꿈처럼 아득하게 느껴졌다. 내년 여름에도 꼭 다시 오겠다고 기차역에서 약속했던 할아버지의 따뜻한 손이 오래도록 기억에 남았다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "은지가 할아버지 댁에 도착하는 방법은?", [findRange(paragraphs, "p1", "기차를 타고 세 시간을 달려 작은 간이역에 내리자 할아버지가 밀짚모자를 쓴 채 환한 웃음으로 맞아 주셨다.")]),
    makeConfirmQ("q2", "할아버지 집 마당에는 무엇이 있었나요?", [findRange(paragraphs, "p1", "할아버지 집 마당에는 커다란 감나무가 서 있었고 그 아래에 낡은 그네가 매달려 있었다.")]),
    makeConfirmQ("q3", "은지가 개울에서 놀란 이유는?", [findRange(paragraphs, "p2", "은지는 양말을 벗고 개울에 발을 담갔는데 물이 너무 차가워서 깜짝 놀랐다.")]),
    makeConfirmQ("q4", "할아버지가 만들어 주신 것은?", [findRange(paragraphs, "p2", "할아버지가 나뭇잎으로 작은 배를 만들어 물에 띄워 주셨다.")]),
    makeConfirmQ("q5", "나뭇잎 배를 보며 은지가 한 생각은?", [findRange(paragraphs, "p2", "나도 저 배처럼 먼 곳까지 여행하고 싶다고 생각했다.")]),
    makeConfirmQ("q6", "은지 가방에서 고소한 냄새가 난 이유는?", [findRange(paragraphs, "p3", "할아버지가 싸 주신 옥수수와 찐 감자가 가방 안에서 고소한 냄새를 풍겼다.")]),
    makeConfirmQ("q7", "은지에게 오래 기억에 남은 것은?", [findRange(paragraphs, "p3", "내년 여름에도 꼭 다시 오겠다고 기차역에서 약속했던 할아버지의 따뜻한 손이 오래도록 기억에 남았다.")])
  ];
  const content = assembleFull(308, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 309 (홀수 → 비문학) ───
function buildDay309() {
  const paragraphs = [
    { id: "p1", text: "지구의 표면은 여러 개의 거대한 판으로 나뉘어져 있는데 이것을 지각판이라고 부른다. 지각판은 매우 느린 속도로 끊임없이 움직이고 있으며 일 년에 몇 센티미터 정도씩 이동한다. 이 판들이 서로 부딪치거나 벌어지면서 지진이나 화산 폭발 같은 자연 현상이 발생한다. 지각판의 움직임은 아주 오랜 세월에 걸쳐 대륙의 모양을 바꾸어 왔으며 약 이억 년 전에는 모든 대륙이 하나로 붙어 있었다고 과학자들은 추정하고 있다." },
    { id: "p2", text: "지진은 지각판이 서로 밀거나 스치면서 쌓인 힘이 한꺼번에 풀릴 때 발생한다. 지진이 일어나면 땅이 심하게 흔들리면서 건물이 무너지거나 도로에 금이 가는 피해가 생길 수 있다. 바다 밑에서 지진이 일어나면 거대한 해일이 발생하여 해안 지역에 큰 피해를 주기도 한다. 우리나라는 지진이 자주 일어나는 나라는 아니지만 최근 들어 규모가 큰 지진이 발생한 사례가 있어 대비가 필요하다. 특히 경주와 포항에서 발생한 지진은 많은 사람들에게 지진 안전의 중요성을 일깨워 주었다." },
    { id: "p3", text: "지진에 대비하려면 평소에 안전 수칙을 잘 알아 두어야 한다. 지진이 발생하면 책상 아래로 들어가 머리를 보호하고 흔들림이 멈추면 빠르게 건물 밖으로 대피해야 한다. 엘리베이터는 멈출 위험이 있으므로 이용하지 말고 반드시 계단을 사용해야 한다. 학교에서는 정기적으로 지진 대피 훈련을 실시하여 실제 상황에서 당황하지 않도록 준비하는 것이 중요하다. 가정에서도 손전등과 식수 같은 비상용품을 미리 준비해 두면 큰 도움이 된다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "지각판이란 무엇인가요?", [findRange(paragraphs, "p1", "지구의 표면은 여러 개의 거대한 판으로 나뉘어져 있는데 이것을 지각판이라고 부른다.")]),
    makeConfirmQ("q2", "지각판은 얼마나 빠르게 움직이나요?", [findRange(paragraphs, "p1", "일 년에 몇 센티미터 정도씩 이동한다.")]),
    makeConfirmQ("q3", "지진이 발생하는 원리는?", [findRange(paragraphs, "p2", "지각판이 서로 밀거나 스치면서 쌓인 힘이 한꺼번에 풀릴 때 발생한다.")]),
    makeConfirmQ("q4", "바다 밑에서 지진이 일어나면 어떤 일이 생기나요?", [findRange(paragraphs, "p2", "바다 밑에서 지진이 일어나면 거대한 해일이 발생하여 해안 지역에 큰 피해를 주기도 한다.")]),
    makeConfirmQ("q5", "지진이 발생했을 때 가장 먼저 해야 할 일은?", [findRange(paragraphs, "p3", "지진이 발생하면 책상 아래로 들어가 머리를 보호하고 흔들림이 멈추면 빠르게 건물 밖으로 대피해야 한다.")]),
    makeConfirmQ("q6", "지진 시 엘리베이터를 사용하면 안 되는 이유는?", [findRange(paragraphs, "p3", "엘리베이터는 멈출 위험이 있으므로 이용하지 말고 반드시 계단을 사용해야 한다.")])
  ];
  const content = assembleFull(309, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 310 (짝수 → 문학) ───
function buildDay310() {
  const paragraphs = [
    { id: "p1", text: "하준이는 학교 도서관 구석 선반에서 우연히 오래된 동화책 한 권을 발견했다. 표지가 낡아서 제목도 잘 보이지 않았고 책등이 갈라져 있었지만 호기심에 조심스럽게 책을 펼쳤다. 첫 페이지에 누군가 연필로 쓴 메모가 있었다. 이 책을 읽는 너에게 이 이야기가 용기를 줄 거야라는 짧은 글이었다. 하준이는 도대체 누가 이 글을 썼을까 궁금해하며 두근거리는 마음으로 다음 장을 넘겼다." },
    { id: "p2", text: "책 속 이야기는 깊은 숲에 사는 작은 토끼에 관한 것이었다. 토끼는 숲 밖으로 나가 본 적이 없었는데 어느 날 길을 잃은 아기 새를 발견하고 새의 집을 찾아 주기 위해 처음으로 숲을 떠나기로 결심한다. 토끼는 넓은 들판을 건너고 깊은 강을 헤엄쳐 지나며 두려움을 이겨 나갔다. 거센 비바람이 몰아치는 밤에도 토끼는 등에 업은 아기 새를 지키며 묵묵히 걸었다. 마침내 높은 절벽 위에 있는 새의 둥지를 찾아 아기 새를 돌려보내 주었다. 토끼는 자기가 이렇게 용감할 수 있다는 사실에 스스로 놀라워했다." },
    { id: "p3", text: "책을 다 읽은 하준이는 한동안 자리에서 일어나지 못했다. 다음 주에 있는 말하기 대회가 두려워서 참가를 포기하려던 참이었는데 토끼의 이야기가 마음을 움직였다. 하준이는 책 마지막 페이지에 자신도 연필로 짧은 메모를 남겼다. 이 책 덕분에 용기를 얻었어요 감사합니다라고 또박또박 적었다. 하준이는 책을 원래 자리에 소중히 꽂아 두며 다음에 이 책을 읽을 누군가도 분명 용기를 얻게 될 거라고 믿었다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "하준이가 도서관에서 발견한 것은?", [findRange(paragraphs, "p1", "하준이는 학교 도서관 구석 선반에서 우연히 오래된 동화책 한 권을 발견했다.")]),
    makeConfirmQ("q2", "첫 페이지에 있던 메모의 내용은?", [findRange(paragraphs, "p1", "이 책을 읽는 너에게 이 이야기가 용기를 줄 거야라는 짧은 글이었다.")]),
    makeConfirmQ("q3", "토끼가 숲을 떠나기로 결심한 이유는?", [findRange(paragraphs, "p2", "길을 잃은 아기 새를 발견하고 새의 집을 찾아 주기 위해 처음으로 숲을 떠나기로 결심한다.")]),
    makeConfirmQ("q4", "토끼가 여정에서 겪은 어려움은?", [findRange(paragraphs, "p2", "토끼는 넓은 들판을 건너고 깊은 강을 헤엄쳐 지나며 두려움을 이겨 나갔다.")]),
    makeConfirmQ("q5", "비바람이 몰아치는 밤에 토끼는 무엇을 했나요?", [findRange(paragraphs, "p2", "거센 비바람이 몰아치는 밤에도 토끼는 등에 업은 아기 새를 지키며 묵묵히 걸었다.")]),
    makeConfirmQ("q6", "하준이가 참가를 포기하려던 것은?", [findRange(paragraphs, "p3", "다음 주에 있는 말하기 대회가 두려워서 참가를 포기하려던 참이었는데 토끼의 이야기가 마음을 움직였다.")]),
    makeConfirmQ("q7", "하준이가 책에 남긴 메모의 내용은?", [findRange(paragraphs, "p3", "이 책 덕분에 용기를 얻었어요 감사합니다라고 또박또박 적었다.")])
  ];
  const content = assembleFull(310, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 311 (홀수 → 비문학) ───
function buildDay311() {
  const paragraphs = [
    { id: "p1", text: "종이는 우리 생활에서 빠질 수 없는 중요한 물건이다. 종이는 약 이천 년 전 중국의 채륜이라는 사람이 나무껍질과 헌 헝겊을 물에 풀어 얇게 펴서 말리는 방법으로 처음 만들었다고 알려져 있다. 이 발명 덕분에 사람들은 무거운 대나무나 비싼 비단 대신 가볍고 저렴한 종이에 글을 쓸 수 있게 되었다. 종이의 발명은 지식과 문화를 널리 퍼뜨리는 데 큰 역할을 했으며 인쇄술의 발전에도 결정적인 기여를 했다." },
    { id: "p2", text: "오늘날 종이는 나무에서 얻은 펄프를 이용하여 만든다. 나무를 잘게 부수고 화학 약품으로 처리하여 섬유질만 남긴 뒤 이것을 물에 풀어 얇게 펴고 건조시키면 종이가 완성된다. 이 과정에서 표백 처리를 거쳐 하얀 종이가 만들어지기도 한다. 종이 한 장을 만드는 데에도 많은 물과 에너지가 필요하며 나무를 베어야 하기 때문에 환경 문제가 발생할 수 있다. 전 세계적으로 매년 수십억 그루의 나무가 종이 생산을 위해 벌목되고 있어서 종이를 아껴 쓰고 다 쓴 종이는 재활용하는 것이 중요하다." },
    { id: "p3", text: "종이 재활용은 환경 보호에 큰 도움이 된다. 재활용 종이를 만들면 새 종이를 만들 때보다 나무 사용량을 크게 줄일 수 있고 물과 에너지도 절약할 수 있다. 우리가 분리수거함에 종이를 올바르게 넣으면 수거된 종이가 공장에서 새로운 종이로 다시 태어난다. 다만 종이를 재활용할 때 테이프나 스티커가 붙어 있으면 품질이 떨어지므로 깨끗하게 분리하는 것이 좋다. 일상에서 이면지를 사용하거나 불필요한 인쇄를 줄이는 작은 습관도 숲을 지키는 데 큰 힘이 된다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "종이를 처음 만든 사람은 누구인가요?", [findRange(paragraphs, "p1", "종이는 약 이천 년 전 중국의 채륜이라는 사람이 나무껍질과 헌 헝겊을 물에 풀어 얇게 펴서 말리는 방법으로 처음 만들었다고 알려져 있다.")]),
    makeConfirmQ("q2", "종이 발명 전에 사용하던 것은?", [findRange(paragraphs, "p1", "무거운 대나무나 비싼 비단 대신 가볍고 저렴한 종이에 글을 쓸 수 있게 되었다.")]),
    makeConfirmQ("q3", "오늘날 종이를 만드는 과정은?", [findRange(paragraphs, "p2", "나무를 잘게 부수고 화학 약품으로 처리하여 섬유질만 남긴 뒤 이것을 물에 풀어 얇게 펴고 건조시키면 종이가 완성된다.")]),
    makeConfirmQ("q4", "종이 생산이 환경 문제를 일으키는 이유는?", [findRange(paragraphs, "p2", "종이 한 장을 만드는 데에도 많은 물과 에너지가 필요하며 나무를 베어야 하기 때문에 환경 문제가 발생할 수 있다.")]),
    makeConfirmQ("q5", "종이 재활용의 장점은?", [findRange(paragraphs, "p3", "재활용 종이를 만들면 새 종이를 만들 때보다 나무 사용량을 크게 줄일 수 있고 물과 에너지도 절약할 수 있다.")]),
    makeConfirmQ("q6", "종이 재활용 시 주의할 점은?", [findRange(paragraphs, "p3", "종이를 재활용할 때 테이프나 스티커가 붙어 있으면 품질이 떨어지므로 깨끗하게 분리하는 것이 좋다.")]),
    makeConfirmQ("q7", "숲을 지키기 위한 일상 속 습관은?", [findRange(paragraphs, "p3", "이면지를 사용하거나 불필요한 인쇄를 줄이는 작은 습관도 숲을 지키는 데 큰 힘이 된다.")])
  ];
  const content = assembleFull(311, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 312 (짝수 → 문학) ───
function buildDay312() {
  const paragraphs = [
    { id: "p1", text: "유나는 학교 앞 작은 꽃가게에서 매일 아침 화분에 물을 주는 할머니를 보았다. 할머니는 꽃 한 송이 한 송이에 이름을 붙여 부르며 마치 손자손녀에게 말하듯 다정하게 이야기했다. 유나는 처음에 그 모습이 조금 이상하다고 생각했지만 매일 지나다니며 할머니를 보다 보니 어느새 그 꽃가게 앞에서 걸음을 멈추는 것이 습관이 되었다. 가게 앞에는 알록달록한 화분들이 줄지어 놓여 있었고 늘 은은한 꽃향기가 코끝을 간질였다." },
    { id: "p2", text: "어느 비 오는 날 유나가 우산 없이 학교를 나서자 할머니가 가게 안으로 들어오라며 손짓했다. 할머니는 따뜻한 보리차를 한 잔 건네며 비가 그칠 때까지 꽃 이야기를 들려주셨다. 할머니가 가장 좋아하는 꽃은 해바라기였는데 해바라기는 아무리 비가 와도 해가 뜨면 고개를 들어 하늘을 바라본다며 그 모습이 참 대단하다고 말씀하셨다. 유나는 해바라기처럼 힘든 일이 있어도 다시 고개를 드는 사람이 되고 싶다고 생각했다. 비가 그치자 창문 너머로 무지개가 살짝 모습을 드러냈고 할머니와 유나는 함께 무지개를 바라보며 웃었다." },
    { id: "p3", text: "그 뒤로 유나는 매주 토요일마다 꽃가게에 들러 할머니를 도왔다. 화분에 물을 주고 시든 잎을 떼어 내고 새로 들어온 꽃의 이름을 배웠다. 할머니는 유나에게 작은 해바라기 화분 하나를 선물로 주시며 이 꽃이 자라는 것을 보면 네 마음도 함께 자랄 거라고 말씀하셨다. 유나는 그 화분을 책상 위에 놓고 매일 아침 물을 주며 할머니의 따뜻한 말씀을 떠올렸다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "꽃가게 할머니의 특별한 습관은?", [findRange(paragraphs, "p1", "할머니는 꽃 한 송이 한 송이에 이름을 붙여 부르며 마치 손자손녀에게 말하듯 다정하게 이야기했다.")]),
    makeConfirmQ("q2", "유나에게 생긴 습관은?", [findRange(paragraphs, "p1", "매일 지나다니며 할머니를 보다 보니 어느새 그 꽃가게 앞에서 걸음을 멈추는 것이 습관이 되었다.")]),
    makeConfirmQ("q3", "비 오는 날 할머니가 유나에게 한 행동은?", [findRange(paragraphs, "p2", "할머니가 가게 안으로 들어오라며 손짓했다.")]),
    makeConfirmQ("q4", "할머니가 해바라기를 좋아하는 이유는?", [findRange(paragraphs, "p2", "해바라기는 아무리 비가 와도 해가 뜨면 고개를 들어 하늘을 바라본다며 그 모습이 참 대단하다고 말씀하셨다.")]),
    makeConfirmQ("q5", "유나가 해바라기를 보며 한 다짐은?", [findRange(paragraphs, "p2", "해바라기처럼 힘든 일이 있어도 다시 고개를 드는 사람이 되고 싶다고 생각했다.")]),
    makeConfirmQ("q6", "유나가 토요일마다 꽃가게에서 한 일은?", [findRange(paragraphs, "p3", "화분에 물을 주고 시든 잎을 떼어 내고 새로 들어온 꽃의 이름을 배웠다.")]),
    makeConfirmQ("q7", "할머니가 화분을 선물하며 한 말씀은?", [findRange(paragraphs, "p3", "이 꽃이 자라는 것을 보면 네 마음도 함께 자랄 거라고 말씀하셨다.")])
  ];
  const content = assembleFull(312, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── 실행 ───
const results = [
  { dayIndex: 308, ...buildDay308() }, { dayIndex: 309, ...buildDay309() },
  { dayIndex: 310, ...buildDay310() }, { dayIndex: 311, ...buildDay311() },
  { dayIndex: 312, ...buildDay312() }
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
fs.writeFileSync(path.join(newDir, 'batch-s3-308-312.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ generated/new/batch-s3-308-312.json`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
