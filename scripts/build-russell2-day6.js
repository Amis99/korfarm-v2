// Day 6: LITERATURE (문학 - 창작 소설)
const fs = require('fs');
const path = require('path');

// ── 지문 ──
const paragraphs = [
  { id: "p1", text: "여름방학이 시작되던 날, 나는 외할머니 댁으로 향하는 시외버스에 올랐다. 도시의 회색 빌딩이 차창 너머로 물러나고, 이내 초록빛 논밭이 끝없이 펼쳐졌다. 외할머니는 시골 마을 가장 안쪽에 자리한 낡은 기와집에서 홀로 살고 계셨다. 어릴 적에는 해마다 여름이면 그 집에서 한 달씩 지냈지만, 중학생이 되고부터는 학원 일정에 밀려 좀처럼 내려가지 못했다. 올해는 어머니의 거듭된 권유 덕분에 겨우 일주일이라는 짧은 시간을 마련할 수 있었다." },
  { id: "p2", text: "외할머니 댁 마당 한가운데에는 오래된 감나무가 우뚝 서 있었다. 나는 어릴 때 그 나무의 굵은 가지에 올라갔다가 미끄러져 무릎을 깊이 다친 적이 있다. 그때 외할머니는 상처에 약을 정성껏 발라 주시며 \"나무가 너를 안아 준 거야, 원망하면 쓰나.\"라고 말씀하셨다. 당시 어린 나로서는 그 말뜻을 도무지 알 수 없었다. 감나무 그늘 아래에는 낡은 평상이 놓여 있었고, 외할머니는 거기에 앉아 부채질을 하시며 나를 기다리고 계셨다. 깊어진 주름 사이로 환하게 번지는 미소를 보자 괜스레 코끝이 찡해졌다." },
  { id: "p3", text: "일주일 동안 나는 외할머니와 함께 텃밭에 물을 주고, 마을 뒷산 계곡에서 차가운 물에 발을 담그고, 저녁이면 마루에 나란히 앉아 밤하늘의 별을 헤아렸다. 외할머니는 유난히 밝은 별 하나를 가리키며 옛이야기를 들려주셨다. 옛날에 하늘의 별들은 본래 땅에 살던 사람들이 마음속 깊이 품은 소원이었다고 한다. 사람들이 진심으로 간절히 빈 소원은 하늘로 올라가 별이 되고, 마침내 그 소원이 이루어지는 순간 별똥별이 되어 다시 땅으로 내려온다고 했다. 나는 \"할머니 소원은 뭐예요?\"라고 여쭤 보았고, 외할머니는 아무 대답 없이 한참을 조용히 웃기만 하셨다." },
  { id: "p4", text: "떠나는 날 이른 아침, 외할머니는 대문 밖 현관까지 따라 나오셨다. 감나무에는 아직 작은 초록 감들이 옹기종기 매달려 있었다. 외할머니는 감을 올려다보며 \"이것들이 빨갛게 익을 때쯤 다시 오렴.\"이라고 말씀하셨다. 버스에 오르고 나서 뒤를 돌아보니 외할머니가 대문 앞에 서서 작은 손을 힘껏 흔들고 계셨다. 나는 그제야 어릴 적 그 말씀이 무슨 뜻이었는지 어렴풋이 깨닫게 되었다. 감나무에서 떨어져 다친 것은 물론 아팠지만, 바로 그 나무 아래에서 외할머니와 나눈 수많은 여름날의 기억이 있었다. 아픔마저 기꺼이 품어 안는 것, 그것이 사랑이라는 뜻이었을 것이다. 버스가 출발하자 마을 풍경이 조금씩 작아졌고, 나는 감이 익는 가을에 반드시 다시 오겠다고 마음속으로 단단히 약속했다." }
];

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log("총 글자수:", totalLen);

// ── 문장 분리 ──
function splitSentences(text) {
  const results = [];
  let current = "";
  for (let i = 0; i < text.length; i++) {
    current += text[i];
    if (text[i] === '.' || text[i] === '!' || text[i] === '?') {
      if (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n') {
        results.push(current.trim());
        current = "";
      }
    }
  }
  if (current.trim().length > 0) results.push(current.trim());
  return results;
}

function findRange(pText, sentence) {
  const start = pText.indexOf(sentence);
  if (start === -1) { console.error("NOT FOUND:", sentence.substring(0, 40)); process.exit(1); }
  return { start, end: start + sentence.length - 1 };
}

// 문장 분리 & 카운트
const allSentences = {};
for (const p of paragraphs) {
  allSentences[p.id] = splitSentences(p.text);
  console.log(`${p.id}: ${allSentences[p.id].length}문장`);
}

// ── 각 문장에 대한 문항 ──
// p1: 5문장, p2: 6문장, p3: 5문장, p4: 8문장
const qMap = {
  p1: [
    { prompt: "화자가 시외버스에 오른 이유로 가장 알맞은 것은?", A: "여름방학을 맞아 외할머니 댁에 가기 위해서", B: "학원 수업을 받으러 시골로 내려가기 위해서", C: "가족 여행을 떠나기 위해서", D: "시골 친척 결혼식에 참석하기 위해서" },
    { prompt: "창밖 풍경의 변화로 알맞은 것은?", A: "도시의 회색 빌딩이 물러나고 초록빛 논밭이 펼쳐졌다", B: "비가 내려 아무것도 보이지 않았다", C: "도시의 고층 건물이 점점 늘어났다", D: "바다가 보이기 시작했다" },
    { prompt: "외할머니의 생활 환경으로 알맞은 것은?", A: "시골 마을 가장 안쪽의 낡은 기와집에서 홀로 살고 계셨다", B: "마을 입구의 새로 지은 양옥집에서 살고 계셨다", C: "도시 아파트에서 이웃과 함께 살고 계셨다", D: "요양원에서 지내고 계셨다" },
    { prompt: "화자가 외할머니 댁에 자주 가지 못한 이유로 알맞은 것은?", A: "중학생이 되고부터 학원 일정에 밀려 못 갔다", B: "외할머니가 방문을 원하지 않으셨다", C: "교통편이 없어서 갈 수 없었다", D: "화자가 시골을 싫어하게 되었다" },
    { prompt: "올해 방문이 가능해진 경위로 알맞은 것은?", A: "어머니의 거듭된 권유 덕분에 일주일을 마련했다", B: "화자가 스스로 방학 계획을 세웠다", C: "외할머니가 직접 전화로 초대하셨다", D: "학원이 한 달간 휴원을 했다" },
  ],
  p2: [
    { prompt: "외할머니 댁 마당의 특징으로 알맞은 것은?", A: "마당 한가운데에 오래된 감나무가 우뚝 서 있었다", B: "커다란 소나무가 여러 그루 자라고 있었다", C: "마당에 연못이 있었다", D: "마당이 콘크리트로 포장되어 있었다" },
    { prompt: "화자가 감나무에서 겪은 일로 알맞은 것은?", A: "굵은 가지에 올라갔다가 미끄러져 무릎을 깊이 다쳤다", B: "감을 따다가 팔을 다쳤다", C: "가지가 부러져서 머리를 다쳤다", D: "나무 밑에서 넘어져 발목을 다쳤다" },
    { prompt: "외할머니가 다친 화자에게 한 말로 알맞은 것은?", A: "나무가 너를 안아 준 거야, 원망하면 쓴다고 하셨다", B: "다음부터 조심하라고 엄하게 꾸짖으셨다", C: "나무에 다시 올라가 보라고 격려하셨다", D: "아버지에게 이르겠다고 말씀하셨다" },
    { prompt: "당시 어린 화자의 반응으로 알맞은 것은?", A: "그 말뜻을 도무지 알 수 없었다", B: "외할머니의 말에 감동을 받았다", C: "화가 나서 감나무를 원망했다", D: "고개를 끄덕이며 이해했다" },
    { prompt: "외할머니가 화자를 기다린 모습으로 알맞은 것은?", A: "감나무 그늘 아래 낡은 평상에 앉아 부채질을 하며 기다리셨다", B: "마을 정자에서 다른 어르신들과 기다리셨다", C: "거실 안에서 텔레비전을 보며 기다리셨다", D: "버스 정류장까지 나와 기다리셨다" },
    { prompt: "외할머니의 미소를 보고 화자가 느낀 감정으로 알맞은 것은?", A: "괜스레 코끝이 찡해졌다", B: "기쁨에 큰 소리로 웃었다", C: "미안한 마음에 눈물을 흘렸다", D: "어색함을 느껴 고개를 돌렸다" },
  ],
  p3: [
    { prompt: "화자가 일주일 동안 한 일로 알맞은 것은?", A: "텃밭에 물을 주고 계곡에서 발을 담그고 별을 헤아렸다", B: "매일 산에 올라가 운동을 했다", C: "마을 친구들과 물놀이만 했다", D: "집에서 독서만 하며 지냈다" },
    { prompt: "외할머니가 옛이야기를 들려준 계기로 알맞은 것은?", A: "유난히 밝은 별 하나를 가리키며 이야기를 시작하셨다", B: "화자가 옛이야기를 해 달라고 부탁했다", C: "마을의 다른 어르신이 먼저 이야기를 꺼내셨다", D: "텔레비전에서 별에 대한 프로그램을 본 후 말씀하셨다" },
    { prompt: "외할머니 이야기에서 하늘의 별이 원래 무엇이었는지 알맞은 것은?", A: "땅에 살던 사람들이 마음속 깊이 품은 소원이었다", B: "옛날 신들이 만든 장신구였다", C: "세상을 밝히기 위해 하늘이 만든 등불이었다", D: "죽은 영웅들의 혼이 변한 것이었다" },
    { prompt: "소원이 이루어지면 별은 어떻게 된다고 했는가?", A: "별똥별이 되어 다시 땅으로 내려온다고 했다", B: "더 크고 밝은 별이 된다고 했다", C: "달 뒤로 숨는다고 했다", D: "여러 개로 나뉘어 흩어진다고 했다" },
    { prompt: "외할머니의 소원을 물었을 때 반응으로 알맞은 것은?", A: "아무 대답 없이 한참을 조용히 웃기만 하셨다", B: "건강하게 오래 사는 것이라고 말씀하셨다", C: "화자가 공부를 잘하는 것이라고 답하셨다", D: "대답을 피하며 다른 이야기를 하셨다" },
  ],
  p4: [
    { prompt: "떠나는 날 아침 외할머니의 행동으로 알맞은 것은?", A: "대문 밖 현관까지 따라 나오셨다", B: "아침밥을 차려 놓고 방에 계셨다", C: "마을 어귀까지 함께 걸어가셨다", D: "버스 터미널까지 배웅하셨다" },
    { prompt: "감나무의 상태에 대한 설명으로 알맞은 것은?", A: "아직 작은 초록 감들이 옹기종기 매달려 있었다", B: "빨갛게 익은 감이 가득했다", C: "잎이 모두 떨어져 앙상했다", D: "꽃이 활짝 피어 있었다" },
    { prompt: "외할머니가 마지막으로 한 말로 알맞은 것은?", A: "감이 빨갛게 익을 때쯤 다시 오라고 하셨다", B: "방학이 끝나기 전에 다시 오라고 하셨다", C: "내년 여름에 꼭 오라고 하셨다", D: "주말마다 와도 된다고 하셨다" },
    { prompt: "뒤를 돌아본 화자가 본 장면으로 알맞은 것은?", A: "외할머니가 대문 앞에서 작은 손을 힘껏 흔들고 계셨다", B: "외할머니가 마당에서 빨래를 널고 계셨다", C: "대문이 이미 닫혀 있었다", D: "마을 사람들이 함께 손을 흔들고 있었다" },
    { prompt: "화자가 어릴 적 말씀의 뜻을 깨닫게 된 시점으로 알맞은 것은?", A: "버스에 오른 뒤 그제야 어렴풋이 깨달았다", B: "외할머니가 직접 설명해 주셨을 때 알았다", C: "감나무를 올려다보는 순간 깨달았다", D: "일주일간 머무르는 동안 서서히 깨달았다" },
    { prompt: "화자가 아픔의 의미를 이해한 근거로 알맞은 것은?", A: "그 나무 아래에서 외할머니와 나눈 수많은 여름날의 기억이 있었기 때문이다", B: "다친 무릎이 완전히 나았기 때문이다", C: "외할머니가 직접 설명해 주셨기 때문이다", D: "친구가 같은 경험을 했다고 말해 주었기 때문이다" },
    { prompt: "화자가 깨달은 사랑의 의미로 알맞은 것은?", A: "아픔마저 기꺼이 품어 안는 것이 사랑이라는 뜻이었다", B: "나무는 위험하니 조심해야 한다는 뜻이었다", C: "자연과 함께하면 행복해진다는 뜻이었다", D: "어린이는 높은 곳에 올라가면 안 된다는 뜻이었다" },
    { prompt: "버스 출발 후 화자가 한 다짐으로 알맞은 것은?", A: "감이 익는 가을에 반드시 다시 오겠다고 마음속으로 약속했다", B: "다음 여름방학에 한 달간 머물겠다고 다짐했다", C: "외할머니를 도시로 모셔 오겠다고 결심했다", D: "매주 전화를 드리겠다고 다짐했다" },
  ]
};

// 문단 중심 문항
const centralQ = {
  p1: { prompt: "[문단 1] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "여름방학을 맞아 화자가 오랜만에 외할머니 댁을 방문하게 된 배경", B: "화자가 시골 생활에 적응하지 못하는 모습", C: "외할머니 댁의 자세한 건축 양식과 구조", D: "화자와 어머니 사이의 갈등과 화해 과정" },
  p2: { prompt: "[문단 2] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "감나무에 얽힌 어린 시절 추억과 외할머니와의 따뜻한 재회", B: "감나무의 생태와 성장 과정에 대한 과학적 설명", C: "화자가 감나무에 올라가 노는 장면의 생생한 묘사", D: "외할머니 댁 마당의 정원 구조와 배치 소개" },
  p3: { prompt: "[문단 3] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "외할머니와 함께한 평화로운 시골 일상과 별에 관한 따뜻한 이야기", B: "화자가 천문학에 관심을 갖게 된 계기", C: "외할머니의 건강 악화를 걱정하는 화자의 불안감", D: "마을 뒷산 계곡의 아름다운 자연 풍경 묘사" },
  p4: { prompt: "[문단 4] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "이별의 순간에 외할머니 말씀의 참뜻을 깨닫고 재방문을 약속하는 화자", B: "화자가 외할머니 댁에서 더 오래 머물기로 결정하는 이야기", C: "감나무의 감을 수확하며 보낸 마지막 하루의 풍경", D: "외할머니가 화자에게 특별한 선물을 건네는 장면" },
};

// ── 타임라인 생성 ──
const timeline = [];
let stepNum = 1;

for (const p of paragraphs) {
  const sents = allSentences[p.id];
  const qs = qMap[p.id];
  if (sents.length !== qs.length) {
    console.error(`${p.id}: 문장(${sents.length}) != 문항(${qs.length})`);
    sents.forEach((s,i) => console.log(`  [${i}] ${s}`));
    process.exit(1);
  }
  for (let i = 0; i < sents.length; i++) {
    const r = findRange(p.text, sents[i]);
    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: p.id, start: r.start, end: r.end }] },
      question: {
        prompt: qs[i].prompt,
        choices: [{ id: "A", text: qs[i].A }, { id: "B", text: qs[i].B }, { id: "C", text: qs[i].C }, { id: "D", text: qs[i].D }],
        answerId: "A",
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }
  // 문단 전체
  const cq = centralQ[p.id];
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: p.id, start: 0, end: p.text.length - 1 }] },
    question: {
      prompt: cq.prompt,
      choices: [{ id: "A", text: cq.A }, { id: "B", text: cq.B }, { id: "C", text: cq.C }, { id: "D", text: cq.D }],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

// ── 복기 카드 (8장) ──
const recallCards = [
  { id: "c1", front: "화자가 외할머니 댁으로 향한 계절은?", back: "여름방학이 시작된 여름" },
  { id: "c2", front: "외할머니 댁 마당에 있던 나무는?", back: "오래된 감나무" },
  { id: "c3", front: "화자가 감나무에서 다친 부위는?", back: "무릎" },
  { id: "c4", front: "외할머니가 다친 화자에게 한 말은?", back: "나무가 너를 안아 준 거야, 원망하면 쓰나" },
  { id: "c5", front: "저녁에 마루에서 한 일은?", back: "밤하늘의 별을 헤아렸다" },
  { id: "c6", front: "소원이 이루어지면 별은 어떻게 되는가?", back: "별똥별이 되어 다시 땅으로 내려온다" },
  { id: "c7", front: "떠나는 날 감나무의 모습은?", back: "작은 초록 감들이 옹기종기 매달려 있었다" },
  { id: "c8", front: "화자가 깨달은 사랑의 의미는?", back: "아픔마저 기꺼이 품어 안는 것이 사랑" },
];

// ── 확인 문항 (7문항) ──
const confirmQs = [
  { qId: "q1", prompt: "화자가 외할머니 댁에 가게 된 계기는?", acceptedAnswer: ["어머니의 거듭된 권유", "어머니의 권유"] },
  { qId: "q2", prompt: "외할머니 댁은 어디에 있었는가?", acceptedAnswer: ["시골 마을 가장 안쪽", "낡은 기와집"] },
  { qId: "q3", prompt: "감나무에서 떨어져 다친 부위는?", acceptedAnswer: ["무릎"] },
  { qId: "q4", prompt: "외할머니 이야기에서 하늘의 별은 원래 무엇이었는가?", acceptedAnswer: ["사람들의 소원", "소원"] },
  { qId: "q5", prompt: "소원이 이루어지면 별은 어떻게 된다고 했는가?", acceptedAnswer: ["별똥별이 되어 땅으로 내려온다", "별똥별"] },
  { qId: "q6", prompt: "외할머니가 떠나는 화자에게 마지막으로 한 말은?", acceptedAnswer: ["감이 빨갛게 익을 때쯤 다시 오렴", "다시 오렴"] },
  { qId: "q7", prompt: "화자가 깨달은 사랑의 의미는?", acceptedAnswer: ["아픔마저 기꺼이 품어 안는 것", "아픔까지 품어 안는 것이 사랑"] },
];

// ── JSON 조립 ──
const staticContent = {
  contentId: "dr-r2-006", contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
  title: "일일 독해(러셀 2) Day 6 문학", description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_2", schoolGradeRange: { min: 8, max: 9 },
  area: "READING", subArea: "LITERATURE", competencies: ["READING"], tags: ["daily"],
  access: { mode: "FREE" }, seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300, assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: { cards: recallCards, correctOrder: recallCards.map(c => c.id), seedPenalty: 1 },
    confirm: { questions: confirmQs.map(q => ({ qId: q.qId, prompt: q.prompt, acceptedAnswer: q.acceptedAnswer, answerMatchMode: "ANY", revealOnWrong: true, scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 } })) }
  }
};

const batchItem = {
  content_type: "DAILY_READING", level_id: "RUSSELL_2", area: "READING", sub_area: "LITERATURE",
  day_index: 6, module_key: "reading_training", schema_version: "1.0", content: staticContent
};

// 파일 저장
const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell2', '006.json');
fs.writeFileSync(staticPath, JSON.stringify(staticContent, null, 2), 'utf8');
console.log("006.json 저장 완료");

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell2.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[5] = batchItem;
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log("배치 items[5] 교체 완료");

// 검증
console.log("\n=== Day 6 검증 ===");
console.log("총 글자수:", totalLen, totalLen >= 1150 && totalLen <= 1250 ? "OK" : "WARN");
console.log("타임라인:", timeline.length, "스텝");
console.log("복기 카드:", recallCards.length);
console.log("확인 문항:", confirmQs.length);
let errors = 0;
for (const step of timeline) {
  for (const r of step.highlight.ranges) {
    const pObj = paragraphs.find(p => p.id === r.paragraphId);
    if (r.start < 0 || r.end >= pObj.text.length || r.start > r.end) { console.error(`범위 오류 ${step.stepId}`); errors++; }
  }
  if (step.question.answerId !== "A") { console.error(`answerId 오류 ${step.stepId}`); errors++; }
}
console.log(errors === 0 ? "모든 검증 통과!" : `오류 ${errors}건`);
