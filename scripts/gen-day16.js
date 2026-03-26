// Day 16 - LITERATURE (문학) 생성 스크립트
const fs = require('fs');

const paragraphs = [
  {
    id: "p1",
    text: "봄비가 내리던 토요일 오후, 나는 아파트 현관 앞 화단 옆에서 작은 강아지 한 마리를 발견했다.젖은 털이 몸에 달라붙어 있었고, 비에 젖은 커다란 눈이 나를 올려다보고 있었다.강아지는 떨고 있었지만 꼬리를 살짝 흔들었고, 그 모습에 나는 차마 지나칠 수 없었다.수건으로 몸을 닦아 주자 털 아래 갈비뼈가 만져질 만큼 깡마른 몸이 드러났다.얼마나 오래 굶었는지 배가 등에 붙은 것 같았다.나는 집에서 우유를 따뜻하게 데워 작은 그릇에 담아 내려왔다.강아지는 허겁지겁 우유를 핥아 먹었고, 다 먹고 난 뒤 내 무릎 위에 고개를 얹었다.그 순간 가슴 한쪽이 뭉클해지면서, 이 아이를 돌봐 주고 싶다는 생각이 불쑥 들었다."
  },
  {
    id: "p2",
    text: "엄마는 처음에 강아지를 키우는 것을 단호하게 반대하셨다.아파트에서는 짖는 소리가 이웃에게 피해를 줄 수 있고, 매일 산책을 시켜야 하는데 네가 감당할 수 있겠느냐고 물으셨다.나는 꼭 책임지겠다고 약속했고, 강아지를 동물 병원에 데려가 건강 검진도 받게 하겠다고 말했다.그래도 엄마는 고개를 저으며 쉽게 허락하지 않으셨다.그때 강아지가 엄마의 발치에 살금살금 다가가 코를 비비며 꼬리를 흔들었다.엄마는 한참 강아지를 내려다보시더니 한숨을 쉬며 일주일만 지켜보자고 하셨다.나는 속으로 환호하면서도 꼭 잘하겠다고 다짐했다."
  },
  {
    id: "p3",
    text: "일주일이 지나고, 한 달이 지나고, 강아지는 어느새 우리 가족이 되었다.나는 강아지에게 봄비라는 이름을 지어 주었는데, 비 오는 날 만났으니 딱 어울리는 이름이었다.매일 아침 봄비와 함께 동네 한 바퀴를 산책하면 이웃들이 웃으며 인사를 건넸고, 예전에는 몰랐던 이웃의 이름도 하나씩 알게 되었다.봄비 덕분에 나는 매일 일찍 일어나는 습관이 생겼고, 책임감이라는 것이 무엇인지도 조금씩 깨달아 갔다.먹이를 주고 빗질을 하고 병원 예방 접종을 챙기면서 다른 생명을 보살피는 일이 결코 쉽지 않다는 것도 알았다.어느 날 엄마가 웃으시며 말씀하셨다.봄비를 돌보는 너를 보니 네가 한 뼘 더 자란 것 같다고.나는 오히려 봄비가 나를 키워 준 거라고 대답하며 웃었다."
  }
];

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log("총 지문 길이:", totalLen);

function findRange(pid, text) {
  const para = paragraphs.find(p => p.id === pid);
  const start = para.text.indexOf(text);
  if (start === -1) throw new Error(`"${text}" not found in ${pid}`);
  return { paragraphId: pid, start, end: start + text.length };
}

function fullRange(pid) {
  const para = paragraphs.find(p => p.id === pid);
  return { paragraphId: pid, start: 0, end: para.text.length };
}

const p1s = [
  "봄비가 내리던 토요일 오후, 나는 아파트 현관 앞 화단 옆에서 작은 강아지 한 마리를 발견했다.",
  "젖은 털이 몸에 달라붙어 있었고, 비에 젖은 커다란 눈이 나를 올려다보고 있었다.",
  "강아지는 떨고 있었지만 꼬리를 살짝 흔들었고, 그 모습에 나는 차마 지나칠 수 없었다.",
  "수건으로 몸을 닦아 주자 털 아래 갈비뼈가 만져질 만큼 깡마른 몸이 드러났다.",
  "얼마나 오래 굶었는지 배가 등에 붙은 것 같았다.",
  "나는 집에서 우유를 따뜻하게 데워 작은 그릇에 담아 내려왔다.",
  "강아지는 허겁지겁 우유를 핥아 먹었고, 다 먹고 난 뒤 내 무릎 위에 고개를 얹었다.",
  "그 순간 가슴 한쪽이 뭉클해지면서, 이 아이를 돌봐 주고 싶다는 생각이 불쑥 들었다."
];

const p2s = [
  "엄마는 처음에 강아지를 키우는 것을 단호하게 반대하셨다.",
  "아파트에서는 짖는 소리가 이웃에게 피해를 줄 수 있고, 매일 산책을 시켜야 하는데 네가 감당할 수 있겠느냐고 물으셨다.",
  "나는 꼭 책임지겠다고 약속했고, 강아지를 동물 병원에 데려가 건강 검진도 받게 하겠다고 말했다.",
  "그래도 엄마는 고개를 저으며 쉽게 허락하지 않으셨다.",
  "그때 강아지가 엄마의 발치에 살금살금 다가가 코를 비비며 꼬리를 흔들었다.",
  "엄마는 한참 강아지를 내려다보시더니 한숨을 쉬며 일주일만 지켜보자고 하셨다.",
  "나는 속으로 환호하면서도 꼭 잘하겠다고 다짐했다."
];

const p3s = [
  "일주일이 지나고, 한 달이 지나고, 강아지는 어느새 우리 가족이 되었다.",
  "나는 강아지에게 봄비라는 이름을 지어 주었는데, 비 오는 날 만났으니 딱 어울리는 이름이었다.",
  "매일 아침 봄비와 함께 동네 한 바퀴를 산책하면 이웃들이 웃으며 인사를 건넸고, 예전에는 몰랐던 이웃의 이름도 하나씩 알게 되었다.",
  "봄비 덕분에 나는 매일 일찍 일어나는 습관이 생겼고, 책임감이라는 것이 무엇인지도 조금씩 깨달아 갔다.",
  "먹이를 주고 빗질을 하고 병원 예방 접종을 챙기면서 다른 생명을 보살피는 일이 결코 쉽지 않다는 것도 알았다.",
  "어느 날 엄마가 웃으시며 말씀하셨다.",
  "봄비를 돌보는 너를 보니 네가 한 뼘 더 자란 것 같다고.",
  "나는 오히려 봄비가 나를 키워 준 거라고 대답하며 웃었다."
];

function verify(pid, sentences) {
  const para = paragraphs.find(p => p.id === pid);
  let pos = 0;
  for (const s of sentences) {
    const idx = para.text.indexOf(s, pos);
    if (idx !== pos) throw new Error(`${pid}: "${s.substring(0,20)}..." expected@${pos} found@${idx}`);
    pos += s.length;
  }
  if (pos !== para.text.length) throw new Error(`${pid}: end=${pos} len=${para.text.length}`);
  console.log(`${pid} 검증 통과 (${sentences.length}문장, ${para.text.length}자)`);
}

verify("p1", p1s);
verify("p2", p2s);
verify("p3", p3s);

const timeline = [];
let sn = 1;

function step(pid, sent, prompt, ch, ans) {
  timeline.push({
    stepId: `s${sn++}`,
    highlight: { ranges: [findRange(pid, sent)] },
    question: {
      prompt, choices: ch.map((t,i)=>({id:["A","B","C","D"][i],text:t})),
      answerId: ans, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

function summ(pid, prompt, ch, ans) {
  timeline.push({
    stepId: `s${sn++}`,
    highlight: { ranges: [fullRange(pid)] },
    question: {
      prompt, choices: ch.map((t,i)=>({id:["A","B","C","D"][i],text:t})),
      answerId: ans, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

// p1
step("p1", p1s[0],
  "첫 문장에서 글쓴이는 어디에서 강아지를 발견했나요?",
  ["아파트 현관 앞에서 발견했다","학교 운동장에서 발견했다","공원 벤치 아래에서 발견했다","마트 주차장에서 발견했다"], "A");

step("p1", p1s[1],
  "둘째 문장에서 강아지의 모습은 어떠했나요?",
  ["젖은 털이 달라붙어 있고 비에 젖은 눈이 올려다보고 있었다","깨끗하게 빗질된 털에 목줄을 하고 있었다","힘차게 뛰어다니며 짖고 있었다","따뜻한 담요 위에 편안히 누워 있었다"], "A");

step("p1", p1s[2],
  "셋째 문장에서 강아지가 떨면서도 한 행동은 무엇인가요?",
  ["꼬리를 살짝 흔들어서 글쓴이가 지나칠 수 없었다","크게 짖어서 글쓴이가 놀랐다","도망가서 글쓴이가 쫓아갔다","눈을 감고 잠들어서 깨워야 했다"], "A");

step("p1", p1s[3],
  "넷째 문장에서 수건으로 닦아 주자 드러난 것은 무엇인가요?",
  ["갈비뼈가 만져질 만큼 깡마른 몸이 드러났다","건강하고 통통한 몸이 드러났다","화려한 무늬의 털이 드러났다","상처 없는 깨끗한 피부가 드러났다"], "A");

step("p1", p1s[4],
  "다섯째 문장에서 강아지가 얼마나 굶었는지 어떻게 표현했나요?",
  ["배가 등에 붙은 것 같았다고 표현했다","배가 볼록하게 나와 있었다고 표현했다","금방 밥을 먹은 듯 건강해 보였다고 했다","몸이 통통해서 귀여웠다고 표현했다"], "A");

step("p1", p1s[5] + p1s[6],
  "여섯째·일곱째 문장에서 우유를 먹은 뒤 강아지는 어떻게 했나요?",
  ["글쓴이의 무릎 위에 고개를 얹었다","현관 밖으로 달려 나갔다","그릇을 발로 밀치고 울었다","구석으로 가서 웅크리고 잠들었다"], "A");

step("p1", p1s[7],
  "여덟째 문장에서 글쓴이에게 어떤 마음이 생겼나요?",
  ["이 아이를 돌봐 주고 싶다는 생각이 불쑥 들었다","빨리 집에 들어가고 싶다는 생각이 들었다","다른 사람에게 맡기자는 생각이 들었다","내일 다시 와 보자는 생각이 들었다"], "A");

summ("p1",
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["비에 젖은 작은 강아지를 만나 돌봐 주고 싶다는 마음이 생긴 글쓴이",
   "아파트 앞에서 잃어버린 물건을 찾아 주인에게 돌려준 이야기",
   "봄비가 오는 날 친구와 함께 산책을 나간 글쓴이의 하루",
   "길에서 다친 고양이를 동물 병원에 데려간 이야기"], "A");

// p2
step("p2", p2s[0],
  "둘째 문단 첫 문장에서 엄마의 반응은 어떠했나요?",
  ["강아지를 키우는 것을 단호하게 반대하셨다","기뻐하시며 바로 허락하셨다","직접 강아지 이름을 지어 주셨다","동물 병원에 곧장 가자고 하셨다"], "A");

step("p2", p2s[1],
  "둘째 문장에서 엄마가 걱정한 것은 무엇인가요?",
  ["짖는 소리가 이웃에게 피해를 주고 매일 산책을 감당할 수 있느냐는 것이다","강아지가 너무 커서 집이 좁아질 것이라는 점이다","강아지 밥값이 너무 비싸서 살 수 없다는 점이다","강아지가 가구를 물어뜯을 것이라는 점이다"], "A");

step("p2", p2s[2],
  "셋째 문장에서 글쓴이가 엄마에게 한 약속은 무엇인가요?",
  ["꼭 책임지겠다고 약속하고 동물 병원 검진도 받게 하겠다고 했다","친구에게 강아지를 맡기겠다고 했다","방과 후에만 돌보고 나머지는 엄마가 하시라고 했다","한 달만 키우고 다른 집에 보내겠다고 했다"], "A");

step("p2", p2s[3] + p2s[4],
  "넷째·다섯째 문장에서 엄마의 마음을 바꾸게 한 것은 무엇인가요?",
  ["강아지가 엄마 발치에 살금살금 다가가 코를 비비며 꼬리를 흔든 것이다","글쓴이가 울면서 매달린 것이다","아빠가 키우자고 엄마를 설득한 것이다","이웃이 강아지를 키우라고 권한 것이다"], "A");

step("p2", p2s[5],
  "여섯째 문장에서 엄마가 내린 결정은 무엇인가요?",
  ["한숨을 쉬며 일주일만 지켜보자고 하셨다","절대 안 된다고 단호하게 거절하셨다","바로 키우자며 이름부터 짓자고 하셨다","다음 달에 다시 생각해 보자고 하셨다"], "A");

step("p2", p2s[6],
  "일곱째 문장에서 글쓴이의 마음은 어떠했나요?",
  ["속으로 환호하면서도 꼭 잘하겠다고 다짐했다","아직 불안해서 다른 방법을 찾아보기로 했다","기대 없이 포기하려는 마음이 들었다","엄마께 화가 나서 말을 하지 않았다"], "A");

summ("p2",
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["엄마의 반대를 거쳐 일주일 시험 기간을 얻어 내는 과정",
   "강아지를 동물 병원에 데려가 치료받는 과정",
   "이웃들에게 강아지를 소개하고 허락을 받는 과정",
   "아빠와 함께 강아지 용품을 사러 가는 이야기"], "A");

// p3
step("p3", p3s[0],
  "셋째 문단 첫 문장에서 시간이 지나자 강아지는 어떻게 되었나요?",
  ["어느새 우리 가족이 되었다","다른 집으로 입양을 갔다","아프다가 다시 건강해졌다","원래 주인이 찾아와 돌아갔다"], "A");

step("p3", p3s[1],
  "둘째 문장에서 강아지 이름은 무엇이고 왜 그 이름을 지었나요?",
  ["봄비라는 이름이며 비 오는 날 만났기 때문이다","하늘이라는 이름이며 눈이 맑았기 때문이다","솜이라는 이름이며 털이 부드러웠기 때문이다","별이라는 이름이며 밤에 발견했기 때문이다"], "A");

step("p3", p3s[2],
  "셋째 문장에서 봄비와 산책하면서 생긴 변화는 무엇인가요?",
  ["이웃들이 인사를 건네고 이웃의 이름도 알게 되었다","매일 지각하게 되어 선생님께 혼났다","강아지가 다른 강아지와 싸워 문제가 생겼다","산책을 싫어하게 되어 그만두고 싶었다"], "A");

step("p3", p3s[3],
  "넷째 문장에서 봄비 덕분에 글쓴이에게 생긴 변화 두 가지는 무엇인가요?",
  ["일찍 일어나는 습관과 책임감을 깨달아 갔다","늦잠을 자는 버릇과 게으름이 생겼다","공부 성적이 오르고 키가 부쩍 자랐다","친구가 많아지고 용돈이 늘어났다"], "A");

step("p3", p3s[4],
  "다섯째 문장에서 글쓴이가 알게 된 것은 무엇인가요?",
  ["다른 생명을 보살피는 일이 결코 쉽지 않다는 것이다","강아지는 혼자서도 잘 자란다는 것이다","예방 접종은 필요 없다는 것이다","빗질은 일주일에 한 번이면 된다는 것이다"], "A");

step("p3", p3s[5] + p3s[6],
  "여섯째·일곱째 문장에서 엄마가 하신 말씀은 무엇인가요?",
  ["봄비를 돌보는 너를 보니 한 뼘 더 자란 것 같다고 하셨다","강아지를 더 큰 집으로 보내자고 하셨다","산책을 줄이고 공부를 더 하라고 하셨다","봄비에게 새 친구를 만들어 주자고 하셨다"], "A");

step("p3", p3s[7],
  "마지막 문장에서 글쓴이의 대답은 무엇인가요?",
  ["오히려 봄비가 나를 키워 준 거라고 대답했다","봄비 덕분에 공부를 잘하게 되었다고 했다","봄비보다 내가 더 잘 돌봤다고 했다","봄비가 없어도 잘 자랐을 거라고 했다"], "A");

summ("p3",
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["봄비를 돌보며 책임감과 성장을 경험한 글쓴이의 이야기",
   "봄비가 아파서 동물 병원에 자주 간 이야기",
   "이웃들이 봄비를 싫어해서 갈등이 생긴 이야기",
   "엄마가 봄비를 다른 집에 보내기로 결정한 이야기"], "A");

console.log("intensive steps:", timeline.length);

const recall = {
  cards: [
    { id: "c1", text: "봄비 오는 날 아파트 현관 앞에서 떨고 있는 작은 강아지를 발견했다." },
    { id: "c2", text: "우유를 먹인 뒤 강아지가 무릎에 고개를 얹자 돌봐 주고 싶은 마음이 들었다." },
    { id: "c3", text: "엄마는 반대했지만, 강아지가 발치에 다가가자 일주일 시험 기간을 주셨다." },
    { id: "c4", text: "글쓴이는 꼭 책임지겠다고 약속하며 다짐했다." },
    { id: "c5", text: "시간이 지나 강아지는 우리 가족이 되었고, 봄비라는 이름을 얻었다." },
    { id: "c6", text: "매일 산책하면서 이웃과 인사하게 되고 일찍 일어나는 습관이 생겼다." },
    { id: "c7", text: "엄마는 봄비를 돌보는 글쓴이를 보며 한 뼘 더 자란 것 같다고 말씀하셨다." },
    { id: "c8", text: "글쓴이는 오히려 봄비가 자신을 키워 준 것이라고 깨달았다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

const confirm = {
  questions: [
    {
      id: "q1", prompt: "글쓴이가 강아지를 발견한 때는 어떤 날씨였나요?",
      answerText: "봄비가 내리던 토요일 오후", answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "봄비가 내리던 토요일 오후")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q2", prompt: "강아지의 몸 상태는 어떠했나요?",
      answerText: "갈비뼈가 만져질 만큼 깡마른 몸", answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "갈비뼈가 만져질 만큼 깡마른 몸이 드러났다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q3", prompt: "엄마가 강아지를 키우는 것을 걱정한 이유 중 하나는 무엇인가요?",
      answerText: "짖는 소리가 이웃에게 피해를 줄 수 있다", answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "짖는 소리가 이웃에게 피해를 줄 수 있고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q4", prompt: "엄마가 결국 허락하게 된 계기는 무엇인가요?",
      answerText: "강아지가 엄마 발치에 다가가 코를 비빈 것",  answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "강아지가 엄마의 발치에 살금살금 다가가 코를 비비며 꼬리를 흔들었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q5", prompt: "글쓴이가 강아지에게 지어 준 이름은 무엇인가요?",
      answerText: "봄비", answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "봄비라는 이름을 지어 주었는데")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q6", prompt: "봄비와 산책하면서 글쓴이에게 생긴 습관은 무엇인가요?",
      answerText: "매일 일찍 일어나는 습관", answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "매일 일찍 일어나는 습관이 생겼고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q7", prompt: "글쓴이가 마지막에 한 대답의 핵심은 무엇인가요?",
      answerText: "봄비가 나를 키워 준 거라고", answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "봄비가 나를 키워 준 거라고 대답하며 웃었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    }
  ]
};

const content = {
  contentId: "dr-f3-016",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(프레게 3) Day 16 문학",
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

fs.writeFileSync('frontend/public/daily-reading/frege3/016.json', JSON.stringify(content, null, 2), 'utf-8');
console.log("016.json 저장 완료");

const batchFile = 'generated/daily-batch-reading-frege3.json';
const batch = JSON.parse(fs.readFileSync(batchFile, 'utf-8'));
batch.items[15] = {
  content_type: "DAILY_READING",
  level_id: "FREGE_3",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 16,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
fs.writeFileSync(batchFile, JSON.stringify(batch, null, 2), 'utf-8');
console.log("배치 파일 Day 16 업데이트 완료");
console.log("\n=== Day 16 생성 완료 ===");
