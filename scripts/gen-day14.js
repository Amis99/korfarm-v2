// Day 14 - LITERATURE (문학) 생성 스크립트
const fs = require('fs');

const paragraphs = [
  {
    id: "p1",
    text: "여름 방학이 시작되던 날, 나는 시골 외할아버지 댁으로 향했다.기차에서 내리자 풀 냄새 섞인 바람이 온몸을 감쌌고, 좁은 논두렁길 양쪽으로 초록빛 벼가 허리까지 자라 있었다.외할아버지는 마을 어귀에서 밀짚모자를 쓴 채 나를 기다리고 계셨다.그분의 얼굴에 깊게 파인 주름은 볕에 그을린 나무껍질처럼 거칠었지만, 눈가에는 늘 따뜻한 웃음이 머물러 있었다.댁에 도착하자 마루에 수박 한 통이 놓여 있었고, 외할아버지는 칼을 들어 시원하게 쪼개 주셨다.붉은 속살에서 달콤한 즙이 흘러내렸고, 나는 한 조각을 받아 들고 마루 끝에 걸터앉아 마당을 내려다보았다.바람에 대나무가 서걱서걱 소리를 내는 그 풍경이 그림 같았다."
  },
  {
    id: "p2",
    text: "다음 날 새벽, 외할아버지는 나를 깨워 개울가로 데려가셨다.아직 해가 뜨지 않아 안개가 물 위를 뒤덮고 있었고, 물소리만 졸졸 울리고 있었다.외할아버지는 낚싯대를 드리우며 물고기가 아니라 마음을 낚는 거라고 말씀하셨다.나는 그 말뜻을 잘 몰랐지만, 물 위에 떠 있는 찌를 바라보며 멍하니 앉아 있으니 머릿속이 맑아지는 느낌이었다.한참 뒤 찌가 흔들려 줄을 당기자 은빛 붕어 한 마리가 올라왔다.외할아버지는 붕어를 물에 다시 놓아 주시며 잡은 것만으로 충분하다고 웃으셨다.그 순간 나는 이해했다.잡아서 갖는 것보다 고요한 시간을 누린 것이 진짜 소득이라는 뜻이었다."
  },
  {
    id: "p3",
    text: "방학이 끝나고 도시로 돌아온 뒤에도 그 새벽 개울가의 장면은 오래 남았다.학교에서 시험 걱정에 머리가 복잡할 때면 나는 눈을 감고 외할아버지와 나란히 앉아 있던 개울가를 떠올렸다.물소리가 귀에 되살아나고, 안개 속 공기의 차가운 감촉이 피부에 번지는 것 같았다.그러면 조급했던 마음이 천천히 가라앉으며 숨 쉴 틈이 생겼다.외할아버지는 그해 겨울에 돌아가셨지만, 그분이 알려 주신 마음을 낚는 법은 내 안에 남아 있다.시끄러운 세상 한가운데서도 잠시 멈추어 고요를 들을 줄 아는 것, 그것이 외할아버지가 내게 물려주신 가장 큰 선물이었다."
  }
];

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log("총 지문 길이:", totalLen);

function findRange(paragraphId, searchText) {
  const para = paragraphs.find(p => p.id === paragraphId);
  if (!para) throw new Error(`Paragraph ${paragraphId} not found`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}" not found in ${paragraphId}`);
  return { paragraphId, start, end: start + searchText.length };
}

function fullParagraphRange(paragraphId) {
  const para = paragraphs.find(p => p.id === paragraphId);
  return { paragraphId, start: 0, end: para.text.length };
}

const p1_sentences = [
  "여름 방학이 시작되던 날, 나는 시골 외할아버지 댁으로 향했다.",
  "기차에서 내리자 풀 냄새 섞인 바람이 온몸을 감쌌고, 좁은 논두렁길 양쪽으로 초록빛 벼가 허리까지 자라 있었다.",
  "외할아버지는 마을 어귀에서 밀짚모자를 쓴 채 나를 기다리고 계셨다.",
  "그분의 얼굴에 깊게 파인 주름은 볕에 그을린 나무껍질처럼 거칠었지만, 눈가에는 늘 따뜻한 웃음이 머물러 있었다.",
  "댁에 도착하자 마루에 수박 한 통이 놓여 있었고, 외할아버지는 칼을 들어 시원하게 쪼개 주셨다.",
  "붉은 속살에서 달콤한 즙이 흘러내렸고, 나는 한 조각을 받아 들고 마루 끝에 걸터앉아 마당을 내려다보았다.",
  "바람에 대나무가 서걱서걱 소리를 내는 그 풍경이 그림 같았다."
];

const p2_sentences = [
  "다음 날 새벽, 외할아버지는 나를 깨워 개울가로 데려가셨다.",
  "아직 해가 뜨지 않아 안개가 물 위를 뒤덮고 있었고, 물소리만 졸졸 울리고 있었다.",
  "외할아버지는 낚싯대를 드리우며 물고기가 아니라 마음을 낚는 거라고 말씀하셨다.",
  "나는 그 말뜻을 잘 몰랐지만, 물 위에 떠 있는 찌를 바라보며 멍하니 앉아 있으니 머릿속이 맑아지는 느낌이었다.",
  "한참 뒤 찌가 흔들려 줄을 당기자 은빛 붕어 한 마리가 올라왔다.",
  "외할아버지는 붕어를 물에 다시 놓아 주시며 잡은 것만으로 충분하다고 웃으셨다.",
  "그 순간 나는 이해했다.",
  "잡아서 갖는 것보다 고요한 시간을 누린 것이 진짜 소득이라는 뜻이었다."
];

const p3_sentences = [
  "방학이 끝나고 도시로 돌아온 뒤에도 그 새벽 개울가의 장면은 오래 남았다.",
  "학교에서 시험 걱정에 머리가 복잡할 때면 나는 눈을 감고 외할아버지와 나란히 앉아 있던 개울가를 떠올렸다.",
  "물소리가 귀에 되살아나고, 안개 속 공기의 차가운 감촉이 피부에 번지는 것 같았다.",
  "그러면 조급했던 마음이 천천히 가라앉으며 숨 쉴 틈이 생겼다.",
  "외할아버지는 그해 겨울에 돌아가셨지만, 그분이 알려 주신 마음을 낚는 법은 내 안에 남아 있다.",
  "시끄러운 세상 한가운데서도 잠시 멈추어 고요를 들을 줄 아는 것, 그것이 외할아버지가 내게 물려주신 가장 큰 선물이었다."
];

function verifySentences(paraId, sentences) {
  const para = paragraphs.find(p => p.id === paraId);
  let pos = 0;
  for (const s of sentences) {
    const idx = para.text.indexOf(s, pos);
    if (idx === -1) throw new Error(`"${s}" not found in ${paraId} from pos ${pos}`);
    if (idx !== pos) throw new Error(`"${s}" expected at ${pos} but found at ${idx} in ${paraId}`);
    pos = idx + s.length;
  }
  if (pos !== para.text.length) throw new Error(`${paraId}: end=${pos} len=${para.text.length}`);
  console.log(`${paraId} 검증 통과 (${sentences.length}문장, ${para.text.length}자)`);
}

verifySentences("p1", p1_sentences);
verifySentences("p2", p2_sentences);
verifySentences("p3", p3_sentences);

const timeline = [];
let stepNum = 1;

function addStep(paraId, sentence, prompt, choices, answerId) {
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paraId, sentence)] },
    question: {
      prompt, choices: choices.map((t,i) => ({id:["A","B","C","D"][i], text:t})),
      answerId, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

function addSummary(paraId, prompt, choices, answerId) {
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [fullParagraphRange(paraId)] },
    question: {
      prompt, choices: choices.map((t,i) => ({id:["A","B","C","D"][i], text:t})),
      answerId, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

// p1
addStep("p1", p1_sentences[0],
  "첫 문장에서 글쓴이는 어디로 향했나요?",
  ["시골 외할아버지 댁으로 향했다","바닷가 펜션으로 여행을 떠났다","산속 캠핑장으로 출발했다","도시 아파트에 있는 친구 집으로 갔다"], "A");

addStep("p1", p1_sentences[1],
  "둘째 문장에서 기차에서 내렸을 때 글쓴이가 느낀 감각은 무엇인가요?",
  ["풀 냄새 섞인 바람이 온몸을 감쌌다","매캐한 연기 냄새가 코를 찔렀다","차가운 눈바람이 얼굴에 닿았다","짠 바다 내음이 코끝에 퍼졌다"], "A");

addStep("p1", p1_sentences[2],
  "셋째 문장에서 외할아버지는 어디에서 무엇을 하고 계셨나요?",
  ["마을 어귀에서 밀짚모자를 쓰고 기다리고 계셨다","집 마루에서 낮잠을 주무시고 계셨다","논에서 모를 심고 계셨다","시장에서 장을 보고 계셨다"], "A");

addStep("p1", p1_sentences[3],
  "넷째 문장에서 외할아버지의 주름을 무엇에 비유했나요?",
  ["볕에 그을린 나무껍질처럼 거칠었다고 비유했다","바위에 새긴 글씨처럼 깊었다고 비유했다","종이를 접은 자국처럼 가늘었다고 비유했다","모래밭에 그은 줄처럼 얕았다고 비유했다"], "A");

addStep("p1", p1_sentences[4] + p1_sentences[5],
  "다섯째·여섯째 문장에서 수박을 먹는 장면이 어떻게 그려졌나요?",
  ["붉은 속살에서 달콤한 즙이 흘러내리며 마루에 걸터앉아 먹었다","부엌에서 조각을 접시에 담아 식탁에서 먹었다","마당 잔디 위에 자리를 펴고 누워서 먹었다","대나무 숲 그늘 아래 의자에 앉아 먹었다"], "A");

addStep("p1", p1_sentences[6],
  "일곱째 문장에서 어떤 풍경을 그림 같다고 했나요?",
  ["바람에 대나무가 서걱서걱 소리를 내는 풍경이다","논에서 개구리가 울어 대는 풍경이다","마당에 빗줄기가 쏟아지는 풍경이다","지붕 위에 까치가 앉아 있는 풍경이다"], "A");

addSummary("p1",
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["여름 방학에 외할아버지 댁에 도착하며 느낀 시골의 따뜻한 풍경",
   "기차를 타고 먼 도시로 여행을 떠나는 설렘과 기대",
   "외할아버지가 수박 농사를 짓는 과정에 대한 설명",
   "시골 마을의 역사와 이웃들의 생활 모습에 대한 소개"], "A");

// p2
addStep("p2", p2_sentences[0],
  "둘째 문단 첫 문장에서 외할아버지는 글쓴이를 어디로 데려가셨나요?",
  ["새벽에 개울가로 데려가셨다","점심때 산꼭대기로 데려가셨다","저녁에 마을 장터로 데려가셨다","오후에 바다 낚시터로 데려가셨다"], "A");

addStep("p2", p2_sentences[1],
  "둘째 문장에서 새벽 개울가의 분위기는 어떠했나요?",
  ["안개가 물 위를 뒤덮고 물소리만 졸졸 울렸다","햇빛이 쨍쨍 비추고 물이 반짝였다","비가 내려 물이 거세게 흘렀다","바람이 세차게 불어 나무가 흔들렸다"], "A");

addStep("p2", p2_sentences[2],
  "셋째 문장에서 외할아버지는 무엇을 낚는 거라고 하셨나요?",
  ["물고기가 아니라 마음을 낚는 거라고 하셨다","가장 큰 물고기를 낚아야 한다고 하셨다","낚시는 인내심을 기르는 운동이라고 하셨다","물고기를 많이 잡아 파는 거라고 하셨다"], "A");

addStep("p2", p2_sentences[3],
  "넷째 문장에서 찌를 바라보며 앉아 있을 때 글쓴이에게 어떤 변화가 생겼나요?",
  ["멍하니 앉아 있으니 머릿속이 맑아지는 느낌이었다","지루해서 빨리 집에 가고 싶은 마음이 들었다","졸려서 그 자리에서 잠이 들어 버렸다","물고기를 빨리 잡고 싶어 마음이 조급해졌다"], "A");

addStep("p2", p2_sentences[4] + p2_sentences[5],
  "다섯째·여섯째 문장에서 잡은 붕어를 외할아버지는 어떻게 하셨나요?",
  ["물에 다시 놓아 주시며 잡은 것만으로 충분하다고 하셨다","바구니에 넣어 집으로 가져가셨다","글쓴이에게 직접 들어 보라고 건네셨다","이웃에게 나눠 주기 위해 보관하셨다"], "A");

addStep("p2", p2_sentences[6] + p2_sentences[7],
  "마지막 두 문장에서 글쓴이가 이해한 뜻은 무엇인가요?",
  ["잡아서 갖는 것보다 고요한 시간을 누린 것이 진짜 소득이다","물고기를 잡으면 반드시 놓아 주어야 한다는 규칙이다","낚시는 아침에만 해야 효과가 있다는 뜻이다","물고기가 많을수록 개울이 건강하다는 뜻이다"], "A");

addSummary("p2",
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["새벽 개울가 낚시를 통해 고요한 시간의 소중함을 깨닫는 과정",
   "외할아버지와 함께 물고기를 많이 잡아 요리를 해 먹는 이야기",
   "개울가에서 위험한 상황을 겪고 무사히 돌아온 모험 이야기",
   "새벽에 일어나 운동하는 것이 건강에 좋다는 내용의 설명"], "A");

// p3
addStep("p3", p3_sentences[0],
  "셋째 문단 첫 문장에서 도시로 돌아온 뒤에도 오래 남은 것은 무엇인가요?",
  ["새벽 개울가의 장면이 오래 남았다","수박의 달콤한 맛이 오래 남았다","기차에서 본 논밭 풍경이 오래 남았다","마을 장터의 시끌벅적한 소리가 남았다"], "A");

addStep("p3", p3_sentences[1] + p3_sentences[2],
  "둘째·셋째 문장에서 시험 걱정이 될 때 글쓴이가 떠올리는 감각은 무엇인가요?",
  ["물소리와 안개 속 차가운 공기의 감촉을 떠올린다","수박을 먹던 달콤한 맛을 떠올린다","기차의 흔들림과 바퀴 소리를 떠올린다","마루에서 바라본 대나무 소리를 떠올린다"], "A");

addStep("p3", p3_sentences[3],
  "넷째 문장에서 개울가를 떠올리면 글쓴이에게 어떤 변화가 생기나요?",
  ["조급했던 마음이 가라앉으며 숨 쉴 틈이 생겼다","시험 점수가 저절로 올라갔다","잠이 와서 곧바로 잠들었다","걱정이 더 커져서 울고 싶어졌다"], "A");

addStep("p3", p3_sentences[4],
  "다섯째 문장에서 외할아버지는 언제 돌아가셨나요?",
  ["그해 겨울에 돌아가셨다","이듬해 여름에 돌아가셨다","글쓴이가 어른이 된 뒤에 돌아가셨다","방학이 끝나기 전에 돌아가셨다"], "A");

addStep("p3", p3_sentences[5],
  "마지막 문장에서 외할아버지가 물려주신 가장 큰 선물은 무엇인가요?",
  ["잠시 멈추어 고요를 들을 줄 아는 것이다","물고기를 잘 잡는 기술이다","시골 집과 넓은 땅이다","맛있는 수박을 고르는 방법이다"], "A");

addSummary("p3",
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["외할아버지와의 추억이 삶 속에서 고요와 평온을 주는 선물로 남았다",
   "글쓴이가 도시에서 낚시 동아리를 만들어 활동하게 된 이야기",
   "외할아버지가 돌아가신 뒤 시골 집을 팔게 된 슬픈 사연",
   "시험 걱정을 없애려면 운동을 해야 한다는 건강 관련 조언"], "A");

console.log("intensive steps:", timeline.length);

// recall (8카드)
const recall = {
  cards: [
    { id: "c1", text: "여름 방학에 시골 외할아버지 댁에 도착하자 풀 냄새와 초록빛 논이 맞이했다." },
    { id: "c2", text: "외할아버지의 거친 주름 속에는 따뜻한 웃음이 있었고, 수박을 쪼개 주셨다." },
    { id: "c3", text: "새벽 개울가에서 외할아버지는 마음을 낚는 거라며 낚싯대를 드리우셨다." },
    { id: "c4", text: "찌를 바라보며 가만히 앉아 있자 머릿속이 맑아지는 느낌이 들었다." },
    { id: "c5", text: "잡은 붕어를 놓아 주시며 고요한 시간을 누린 것이 진짜 소득이라 하셨다." },
    { id: "c6", text: "도시로 돌아온 뒤에도 시험 걱정이 될 때면 개울가의 물소리를 떠올렸다." },
    { id: "c7", text: "외할아버지는 그해 겨울에 돌아가셨지만, 마음을 낚는 법은 내 안에 남았다." },
    { id: "c8", text: "잠시 멈추어 고요를 들을 줄 아는 것이 외할아버지가 남긴 가장 큰 선물이다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// confirm (7개)
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "외할아버지가 글쓴이를 기다리고 계시던 곳은 어디인가요?",
      answerText: "마을 어귀",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "마을 어귀에서 밀짚모자를 쓴 채 나를 기다리고 계셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "외할아버지가 낚시하며 하신 말씀은 무엇인가요?",
      answerText: "물고기가 아니라 마음을 낚는 거라고",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "물고기가 아니라 마음을 낚는 거라고 말씀하셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "잡은 붕어를 외할아버지는 어떻게 하셨나요?",
      answerText: "물에 다시 놓아 주셨다",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "붕어를 물에 다시 놓아 주시며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "글쓴이가 깨달은 '진짜 소득'이란 무엇인가요?",
      answerText: "고요한 시간을 누린 것",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "고요한 시간을 누린 것이 진짜 소득이라는 뜻이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "도시에서 시험 걱정이 될 때 글쓴이가 떠올리는 것은 무엇인가요?",
      answerText: "외할아버지와 앉아 있던 개울가",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "외할아버지와 나란히 앉아 있던 개울가를 떠올렸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "외할아버지는 언제 돌아가셨나요?",
      answerText: "그해 겨울",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "그해 겨울에 돌아가셨지만")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "외할아버지가 글쓴이에게 물려주신 가장 큰 선물은 무엇인가요?",
      answerText: "잠시 멈추어 고요를 들을 줄 아는 것",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "잠시 멈추어 고요를 들을 줄 아는 것, 그것이 외할아버지가 내게 물려주신 가장 큰 선물이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

const content = {
  contentId: "dr-f3-014",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(프레게 3) Day 14 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "FREGE_3",
  schoolGradeRange: { min: 6, max: 7 },
  area: "READING",
  subArea: "LITERATURE",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 480,
  assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall,
    confirm
  }
};

console.log("recall:", content.payload.recall.cards.length);
console.log("confirm:", content.payload.confirm.questions.length);

fs.writeFileSync('frontend/public/daily-reading/frege3/014.json', JSON.stringify(content, null, 2), 'utf-8');
console.log("014.json 저장 완료");

const batchFile = 'generated/daily-batch-reading-frege3.json';
const batch = JSON.parse(fs.readFileSync(batchFile, 'utf-8'));
batch.items[13] = {
  content_type: "DAILY_READING",
  level_id: "FREGE_3",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 14,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
fs.writeFileSync(batchFile, JSON.stringify(batch, null, 2), 'utf-8');
console.log("배치 파일 Day 14 업데이트 완료");
console.log("\n=== Day 14 생성 완료 ===");
