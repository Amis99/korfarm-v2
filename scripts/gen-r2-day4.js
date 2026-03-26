// Day 4: 문학 - 현대 단편 소설 (직접 창작, 중2~3 수준)
// Day 2가 분꽃 수필이므로, 다른 주제/장르: 빗소리를 소재로 한 우정/성장 소설

const passage = {
  p1: "장마가 시작된 첫날, 준호는 교실 창가에 턱을 괴고 회색빛 빗줄기를 바라보았다. 운동장에 빗물이 고여 얕은 웅덩이를 만들고, 그 위로 빗방울이 떨어질 때마다 동그란 물결이 퍼져 나갔다. 준호는 그 물결 무늬가 좋았다. 무언가 소리 없이 시작되어 조용히 사라지는 느낌이 마음에 들었기 때문이다. 실은 요즘 준호에게는 말 못 할 고민이 하나 있었다. 반에서 가장 친한 친구였던 태민이가 며칠째 말을 걸어도 대답하지 않고 고개를 돌려 버리는 것이었다. 이유를 물어보고 싶었지만, 혹시 싫은 소리를 들을까 봐 선뜻 입이 열리지 않았다.",
  p2: "방과 후, 준호는 파란 우산을 쓰고 빗길을 걸으며 집으로 향했다. 골목 어귀에서 비를 피하고 있는 태민을 발견한 것은 전혀 뜻밖이었다. 태민은 우산도 없이 처마 밑에 웅크리고 앉아 젖은 운동화 끈을 매만지고 있었다. 준호는 한참을 망설이다가 태민 옆으로 다가가 조용히 우산을 내밀었다. 태민은 잠깐 올려다보더니 고개를 끄덕이고 자리에서 일어났다. 좁은 우산 아래 두 사람의 어깨가 나란히 닿았고, 빗소리만이 그 사이를 메워 주었다. 몇 발자국을 걷는 동안 아무 말이 없었지만, 준호는 이상하게도 마음이 조금 가벼워지는 것을 느꼈다.",
  p3: "태민의 집 앞에 도착했을 때 태민이 먼저 입을 열었다. 사실 자기가 전학을 간다는 것이었다. 부모님이 일 때문에 다른 도시로 이사하셔야 해서 이번 달 안에 떠나야 한다고 했다. 태민의 떨리는 목소리는 빗소리에 반쯤 묻혀 겨우 들렸다. 준호는 그제야 태민이 며칠째 자신을 피한 까닭을 알 것 같았다. 이별을 미리 말하는 것이 두려워서 차마 눈을 마주치지 못했던 것이리라. 준호는 아무 말 없이 우산을 태민 쪽으로 조금 더 기울여 주었다. 태민의 어깨에 떨어지던 빗방울이 멈추자 태민의 눈가가 살짝 붉어졌다.",
  p4: "그날 밤 준호는 방의 창문을 열어 놓은 채 비 오는 소리를 들었다. 처마를 때리는 빗소리가 아까 태민과 나눈 짧은 대화처럼 가슴 한쪽을 적셨다. 준호는 책상 서랍에서 빈 엽서를 꺼내 멀리 가더라도 계속 친구로 남자는 말을 또박또박 적었다. 글씨가 조금 삐뚤어졌지만 지우지 않았다. 창밖의 빗소리가 조금씩 잦아들었다. 준호는 내일 아침 태민의 사물함에 이 엽서를 넣어 두어야겠다고 생각하며 조용히 눈을 감았다. 이별은 슬프지만, 그래도 마음을 전하면 그 슬픔이 조금은 가벼워질 거라고 준호는 믿었다."
};

const totalLen = Object.values(passage).reduce((sum, t) => sum + t.length, 0);
console.log("총 글자 수:", totalLen);

// 수동 문장 경계 지정 (마침표 기준, 대화문 없이 깔끔하게)
function sentenceBounds(text) {
  const result = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i + 1 >= text.length || text[i+1] === ' ')) {
      const end = (i + 1 < text.length && text[i+1] === ' ') ? i + 2 : i + 1;
      result.push({ start, end });
      start = end;
    }
  }
  if (start < text.length) {
    result.push({ start, end: text.length });
  }
  return result;
}

const paragraphs = ["p1","p2","p3","p4"];
const allSentences = {};
for (const pid of paragraphs) {
  allSentences[pid] = sentenceBounds(passage[pid]);
  console.log(`${pid}: ${allSentences[pid].length}문장`);
  for (const s of allSentences[pid]) {
    const t = passage[pid].substring(s.start, s.end);
    console.log(`  [${s.start},${s.end}] "${t.substring(0,40)}..."`);
  }
}

// intensive 질문
const intensiveData = {
  p1: [
    { prompt: "첫 문장에서 이야기의 배경으로 알맞은 것은?",
      choices: [
        { id: "A", text: "장마가 시작된 날 준호가 교실 창가에서 빗줄기를 바라보고 있다." },
        { id: "B", text: "눈이 내리는 겨울날 준호가 운동장에서 뛰어놀고 있다." },
        { id: "C", text: "맑은 봄날 준호가 도서관에서 책을 읽고 있다." },
        { id: "D", text: "가을 소풍 날 준호가 산에 올라가 있다." }
      ], answerId: "A" },
    { prompt: "둘째·셋째 문장에서 준호가 좋아한 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "빗방울이 웅덩이에 만드는 동그란 물결 무늬를 좋아했다." },
        { id: "B", text: "운동장에서 친구들과 뛰어노는 것을 좋아했다." },
        { id: "C", text: "빗물로 그림을 그리는 것을 좋아했다." },
        { id: "D", text: "비를 맞으며 걷는 것을 좋아했다." }
      ], answerId: "A", mergeNext: true },
    { prompt: "준호의 고민으로 알맞은 것은?",
      choices: [
        { id: "A", text: "친한 친구 태민이가 며칠째 대답 없이 고개를 돌려 버리는 것이다." },
        { id: "B", text: "시험 성적이 떨어져 부모님께 혼날까 걱정하는 것이다." },
        { id: "C", text: "새 학교에 적응하지 못하는 것이다." },
        { id: "D", text: "장마 때문에 운동회가 취소될까 걱정하는 것이다." }
      ], answerId: "A", mergeNext: true },
    { prompt: "마지막 문장에서 준호가 이유를 묻지 못한 까닭으로 알맞은 것은?",
      choices: [
        { id: "A", text: "싫은 소리를 들을까 봐 선뜻 입이 열리지 않았기 때문이다." },
        { id: "B", text: "태민이 다른 친구와 함께 있어 말을 걸 수 없었기 때문이다." },
        { id: "C", text: "준호 자신이 태민에게 화가 나 있었기 때문이다." },
        { id: "D", text: "선생님이 대화를 금지했기 때문이다." }
      ], answerId: "A" }
  ],
  p2: [
    { prompt: "방과 후 준호가 골목에서 발견한 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "우산 없이 처마 밑에 웅크린 태민을 뜻밖에 발견했다." },
        { id: "B", text: "새로운 친구가 서점에서 책을 고르고 있었다." },
        { id: "C", text: "길 잃은 강아지가 비를 맞고 있었다." },
        { id: "D", text: "선생님이 골목에서 준호를 기다리고 있었다." }
      ], answerId: "A", mergeNext: true },
    { prompt: "준호가 태민에게 보인 행동으로 알맞은 것은?",
      choices: [
        { id: "A", text: "망설이다가 태민 옆으로 다가가 우산을 내밀었다." },
        { id: "B", text: "태민에게 큰 소리로 이유를 물었다." },
        { id: "C", text: "모른 척하고 빠르게 지나갔다." },
        { id: "D", text: "태민의 우산을 대신 사러 편의점에 갔다." }
      ], answerId: "A", mergeNext: true },
    { prompt: "우산 아래에서 두 사람 사이를 메운 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "빗소리만이 두 사람 사이를 메워 주었다." },
        { id: "B", text: "두 사람은 신나게 이야기를 나누었다." },
        { id: "C", text: "음악 소리가 두 사람 사이를 채웠다." },
        { id: "D", text: "바람 소리가 대화를 대신했다." }
      ], answerId: "A" },
    { prompt: "마지막 문장에서 준호의 감정 변화로 알맞은 것은?",
      choices: [
        { id: "A", text: "말은 없었지만 마음이 조금 가벼워지는 것을 느꼈다." },
        { id: "B", text: "태민을 만나 오히려 더 불안해졌다." },
        { id: "C", text: "화가 나서 우산을 접어 버렸다." },
        { id: "D", text: "아무 감정 변화 없이 집에 도착했다." }
      ], answerId: "A" }
  ],
  p3: [
    { prompt: "태민이 먼저 꺼낸 소식으로 알맞은 것은?",
      choices: [
        { id: "A", text: "자기가 전학을 간다고 말했다." },
        { id: "B", text: "준호에게 화가 났다고 말했다." },
        { id: "C", text: "시험 성적이 떨어졌다고 말했다." },
        { id: "D", text: "새 취미를 시작한다고 말했다." }
      ], answerId: "A", mergeNext: true },
    { prompt: "전학의 이유로 알맞은 것은?",
      choices: [
        { id: "A", text: "부모님이 일 때문에 다른 도시로 이사해야 한다." },
        { id: "B", text: "태민이 더 좋은 학교를 찾았다." },
        { id: "C", text: "선생님과의 갈등으로 학교를 떠난다." },
        { id: "D", text: "건강 문제로 시골에 요양을 간다." }
      ], answerId: "A" },
    { prompt: "준호가 깨달은, 태민이 자신을 피한 까닭으로 알맞은 것은?",
      choices: [
        { id: "A", text: "이별을 미리 말하는 것이 두려워 눈을 마주치지 못한 것이다." },
        { id: "B", text: "준호에게 화가 나 있었기 때문이다." },
        { id: "C", text: "다른 친구와 더 친해졌기 때문이다." },
        { id: "D", text: "공부에 집중하느라 여유가 없었기 때문이다." }
      ], answerId: "A", mergeNext: true },
    { prompt: "준호가 태민에게 보인 행동과 그에 대한 태민의 반응으로 알맞은 것은?",
      choices: [
        { id: "A", text: "우산을 태민 쪽으로 기울여 주자 태민의 눈가가 붉어졌다." },
        { id: "B", text: "태민에게 전학 가지 말라고 소리치자 태민이 화를 냈다." },
        { id: "C", text: "우산을 접고 비를 함께 맞자 태민이 웃었다." },
        { id: "D", text: "등을 돌리고 집으로 가자 태민이 울었다." }
      ], answerId: "A", mergeNext: true }
  ],
  p4: [
    { prompt: "그날 밤 준호의 행동으로 알맞은 것은?",
      choices: [
        { id: "A", text: "창문을 열어 놓고 비 오는 소리를 들었다." },
        { id: "B", text: "창문을 닫고 음악을 크게 틀었다." },
        { id: "C", text: "밖으로 나가 비를 맞으며 걸었다." },
        { id: "D", text: "텔레비전을 보며 태민 생각을 잊으려 했다." }
      ], answerId: "A" },
    { prompt: "준호가 엽서에 적은 내용의 핵심으로 알맞은 것은?",
      choices: [
        { id: "A", text: "멀리 가더라도 계속 친구로 남자는 마음을 적었다." },
        { id: "B", text: "전학 가지 말아 달라고 부탁했다." },
        { id: "C", text: "새 학교에서 잘 지내라고 격려했다." },
        { id: "D", text: "자신의 일상을 자세히 기록했다." }
      ], answerId: "A", mergeNext: true },
    { prompt: "준호가 엽서를 넣어 두려는 곳과 그때의 결심으로 알맞은 것은?",
      choices: [
        { id: "A", text: "내일 아침 태민의 사물함에 넣어 두겠다고 결심했다." },
        { id: "B", text: "태민의 집 우편함에 넣겠다고 결심했다." },
        { id: "C", text: "엽서를 쓰다가 버리기로 결심했다." },
        { id: "D", text: "선생님께 대신 전해 달라고 부탁하기로 했다." }
      ], answerId: "A", mergeNext: true },
    { prompt: "마지막 문장에서 준호가 믿는 바로 알맞은 것은?",
      choices: [
        { id: "A", text: "마음을 전하면 이별의 슬픔이 조금은 가벼워질 거라고 믿었다." },
        { id: "B", text: "엽서를 쓰면 태민이 전학을 취소할 거라고 믿었다." },
        { id: "C", text: "비가 그치면 모든 슬픔이 사라질 거라고 믿었다." },
        { id: "D", text: "시간이 지나면 태민을 완전히 잊을 거라고 믿었다." }
      ], answerId: "A" }
  ]
};

const paragraphSummaries = {
  p1: {
    choices: [
      { id: "A", text: "장마가 시작된 날, 준호는 친구 태민이 자신을 피하는 이유를 몰라 고민하고 있다." },
      { id: "B", text: "준호는 비 오는 날 운동장에서 혼자 놀며 즐거운 시간을 보내고 있다." },
      { id: "C", text: "준호는 새 학교에 전학 와서 친구를 사귀지 못해 외로워하고 있다." },
      { id: "D", text: "준호는 장마 때문에 집에만 있어 답답해하고 있다." }
    ], answerId: "A"
  },
  p2: {
    choices: [
      { id: "A", text: "비를 피하던 태민에게 우산을 함께 쓰자고 다가가며 준호의 마음이 가벼워진다." },
      { id: "B", text: "준호와 태민이 비를 맞으며 신나게 대화를 나눈다." },
      { id: "C", text: "태민이 준호에게 사과하며 오해가 풀린다." },
      { id: "D", text: "준호가 태민을 무시하고 혼자 집으로 간다." }
    ], answerId: "A"
  },
  p3: {
    choices: [
      { id: "A", text: "태민이 전학 소식을 알리고, 준호는 우산을 기울여 주며 말없이 마음을 전한다." },
      { id: "B", text: "태민이 준호에게 화가 난 이유를 설명하고 사과한다." },
      { id: "C", text: "준호가 태민에게 전학 가지 말라고 설득한다." },
      { id: "D", text: "태민이 준호의 우산을 빌려 혼자 집에 간다." }
    ], answerId: "A"
  },
  p4: {
    choices: [
      { id: "A", text: "준호는 엽서에 마음을 담아 적으며, 전해야 슬픔도 가벼워진다고 믿는다." },
      { id: "B", text: "준호는 밤새 울며 태민과의 추억을 떠올린다." },
      { id: "C", text: "준호는 태민에게 화가 나서 엽서를 찢어 버린다." },
      { id: "D", text: "준호는 비가 그치자 태민 생각을 완전히 잊어버린다." }
    ], answerId: "A"
  }
};

// timeline 생성
const timeline = [];
let stepNum = 1;

for (const pid of paragraphs) {
  const sentences = allSentences[pid];
  const questions = intensiveData[pid];

  let sentIdx = 0;
  for (let qIdx = 0; qIdx < questions.length; qIdx++) {
    const q = questions[qIdx];
    if (sentIdx >= sentences.length) break;

    let startPos = sentences[sentIdx].start;
    let endPos = sentences[sentIdx].end;

    // mergeNext: 다음 문장도 함께 하이라이트
    if (q.mergeNext && sentIdx + 1 < sentences.length) {
      sentIdx++;
      endPos = sentences[sentIdx].end;
    }

    timeline.push({
      stepId: `s${stepNum}`,
      highlight: {
        ranges: [{ paragraphId: pid, start: startPos, end: endPos }]
      },
      question: {
        prompt: q.prompt,
        choices: q.choices,
        answerId: q.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
    stepNum++;
    sentIdx++;
  }

  // 문단 중심내용
  const ps = paragraphSummaries[pid];
  const summaryPrompts = {p1: "첫째 문단의 중심 내용으로 가장 알맞은 것은?", p2: "둘째 문단의 중심 내용으로 가장 알맞은 것은?", p3: "셋째 문단의 중심 내용으로 가장 알맞은 것은?", p4: "넷째 문단의 중심 내용으로 가장 알맞은 것은?"};
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: {
      ranges: [{ paragraphId: pid, start: 0, end: passage[pid].length }]
    },
    question: {
      prompt: summaryPrompts[pid],
      choices: ps.choices,
      answerId: ps.answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
}

console.log("총 intensive steps:", timeline.length);

// recall 8카드
const recall = {
  cards: [
    { id: "c1", text: "장마가 시작된 날, 준호는 친구 태민이 자신을 피하는 이유를 몰라 고민한다." },
    { id: "c2", text: "방과 후 비를 피하던 태민에게 준호가 우산을 함께 쓰자고 다가간다." },
    { id: "c3", text: "말없이 함께 걷는 동안 빗소리만이 두 사람 사이를 채운다." },
    { id: "c4", text: "태민이 부모님 일 때문에 전학을 간다는 사실을 알린다." },
    { id: "c5", text: "준호는 태민이 이별이 두려워 자신을 피했음을 깨닫는다." },
    { id: "c6", text: "준호가 우산을 태민 쪽으로 기울여 주며 말없이 마음을 전한다." },
    { id: "c7", text: "그날 밤 준호는 엽서에 계속 친구 하자는 마음을 적는다." },
    { id: "c8", text: "이별은 슬프지만 마음을 전하면 슬픔이 가벼워진다고 믿는다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// confirm 질문
const confirmQuestions = [
  { id: "q1", prompt: "준호가 교실에서 바라본, 빗방울이 웅덩이 위에서 만드는 모양은 무엇인가요?",
    answerText: "동그란 물결", pid: "p1", searchText: "동그란 물결" },
  { id: "q2", prompt: "준호의 가장 친한 친구의 이름은 무엇인가요?",
    answerText: "태민", pid: "p1", searchText: "태민" },
  { id: "q3", prompt: "태민이 처마 밑에서 매만지고 있었던 것은 무엇인가요?",
    answerText: "운동화 끈", pid: "p2", searchText: "운동화 끈" },
  { id: "q4", prompt: "좁은 우산 아래에서 두 사람의 침묵을 대신 채운 것은 무엇인가요?",
    answerText: "빗소리", pid: "p2", searchText: "빗소리" },
  { id: "q5", prompt: "태민이 전학 가게 된 이유로 부모님의 무엇 때문이라고 했나요?",
    answerText: "일", pid: "p3", searchText: "일 때문에" },
  { id: "q6", prompt: "준호는 태민이 자신을 피한 까닭이 무엇을 미리 말하기 두려웠기 때문이라고 깨달았나요?",
    answerText: "이별", pid: "p3", searchText: "이별" },
  { id: "q7", prompt: "준호가 그날 밤 서랍에서 꺼내 마음을 적은 것은 무엇인가요?",
    answerText: "엽서", pid: "p4", searchText: "엽서" },
  { id: "q8", prompt: "준호가 내일 아침 엽서를 넣어 두려는 곳은 어디인가요?",
    answerText: "사물함", pid: "p4", searchText: "사물함" }
];

const confirmWithRanges = confirmQuestions.map(q => {
  const text = passage[q.pid];
  const idx = text.indexOf(q.searchText);
  if (idx === -1) {
    console.error(`ERROR: "${q.searchText}" not found in ${q.pid}`);
    process.exit(1);
  }
  return {
    id: q.id,
    prompt: q.prompt,
    answerText: q.answerText,
    answerMatchMode: "ANY",
    answerRanges: [{
      paragraphId: q.pid,
      start: idx,
      end: idx + q.searchText.length
    }],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  };
});

const content = {
  contentId: "dr-r2-004",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 2) Day 4 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_2",
  schoolGradeRange: { min: 8, max: 9 },
  area: "READING",
  subArea: "LITERATURE",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300,
  assets: {},
  payload: {
    passage: {
      format: "TEXT",
      paragraphs: paragraphs.map(pid => ({ id: pid, text: passage[pid] }))
    },
    intensive: { timeline },
    recall,
    confirm: { questions: confirmWithRanges }
  }
};

// 검증
console.log("\n=== 검증 ===");
console.log("지문 글자 수:", totalLen, totalLen >= 1150 && totalLen <= 1250 ? "OK" : "FAIL");
console.log("recall 카드:", recall.cards.length, recall.cards.length === 8 ? "OK" : "FAIL");
console.log("confirm 문항:", confirmWithRanges.length, confirmWithRanges.length >= 5 ? "OK" : "FAIL");
console.log("intensive steps:", timeline.length);

let rangeOk = true;
for (const step of timeline) {
  for (const r of step.highlight.ranges) {
    const pText = passage[r.paragraphId];
    if (r.start < 0 || r.end > pText.length || r.start >= r.end) {
      console.error(`INVALID range in ${step.stepId}: [${r.start},${r.end}] for ${r.paragraphId} (len=${pText.length})`);
      rangeOk = false;
    }
  }
}
for (const q of confirmWithRanges) {
  for (const r of q.answerRanges) {
    const pText = passage[r.paragraphId];
    if (r.start < 0 || r.end > pText.length || r.start >= r.end) {
      console.error(`INVALID confirm range in ${q.id}: [${r.start},${r.end}]`);
      rangeOk = false;
    }
    const found = pText.substring(r.start, r.end);
    if (!found.includes(q.answerText)) {
      console.error(`MISMATCH in ${q.id}: expected "${q.answerText}" in "${found}"`);
      rangeOk = false;
    }
  }
}
console.log("ranges 유효:", rangeOk ? "OK" : "FAIL");

const fs = require('fs');
fs.writeFileSync('./frontend/public/daily-reading/russell2/004.json', JSON.stringify(content, null, 2), 'utf8');
console.log("파일 저장: 004.json");

const batchItem = {
  content_type: "DAILY_READING",
  level_id: "RUSSELL_2",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 4,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
fs.writeFileSync('./scripts/day4-batch-item.json', JSON.stringify(batchItem, null, 2), 'utf8');
console.log("배치 아이템 저장: day4-batch-item.json");
