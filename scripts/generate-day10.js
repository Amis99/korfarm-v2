// Day 10: 문학 (LITERATURE) - 수필: 오래된 운동화
// 중1~중2 수준, 1100자 ±50

const fs = require('fs');
const path = require('path');

// ── 지문 ──
const p1 = `신발장 깊숙한 구석에 낡은 운동화 한 켤레가 조용히 놓여 있다. 한때 하얀색이었던 바닥은 누렇게 변색되었고, 옆면에는 풀밭을 뛰어다닌 흔적인 초록색 얼룩이 아무리 세탁해도 지워지지 않은 채 남아 있다. 끈은 한쪽이 끊어져 매듭으로 이어 붙였고, 뒤꿈치 부분은 수없이 많은 발걸음에 닳고 닳아 밑창이 거의 드러나 있다. 누군가에게는 당장 버려야 마땅한 낡은 신발에 불과하겠지만, 나에게는 결코 그렇지 않다. 이 운동화를 볼 때마다 나는 중학교 시절의 기억 속으로 빨려 들어간다. 체육 시간에 운동장을 전력으로 질주하던 짜릿한 느낌, 방과 후 친구들과 축구공을 차며 웃던 황금빛 오후, 비 오는 날 물웅덩이를 뛰어넘다 미끄러져 넘어졌던 순간까지 모두 이 낡은 운동화 안에 고스란히 담겨 있는 것만 같다.`;

const p2 = `어머니는 여러 번 이 운동화를 버리라고 하셨다. "신지도 않는 운동화를 왜 자꾸 붙잡고 있니?" 어머니의 말씀은 지극히 합리적이었다. 새 운동화가 이미 두 켤레나 있었고, 이 낡은 운동화를 다시 신을 일은 사실상 없었다. 하지만 나는 매번 "조금만 더요"라고 말하며 운동화를 다시 신발장 구석에 밀어 넣곤 하였다. 그것은 단순히 물건을 버리기 아까운 마음 때문이 아니었다. 이 운동화에는 나의 중학교 시절이, 땀 냄새와 흙먼지와 함께 웃고 울었던 그 시간들이 고스란히 배어 있었다. 운동화를 버리면 그 기억까지 함께 사라질 것만 같은 막연한 두려움이 나를 붙잡고 있었던 것이다.`;

const p3 = `시간이 흐르고 나는 어느덧 고등학생이 되었다. 어느 날 방 구석구석을 정리하다가 다시 그 운동화를 발견하였다. 손에 들어 보니 이전보다 훨씬 가벼운 느낌이었다. 코끝에 가져다 대자 오래된 가죽과 먼지 냄새가 희미하게 풍겨 왔다. 나는 한참 동안 운동화를 바라보다가 조용히 웃었다. 문득 깨달은 것이 있었기 때문이다. 내가 진짜 간직하고 싶었던 것은 이 낡은 신발이 아니라, 그 시절 친구들과 함께 나누었던 웃음과 우정이었다. 그리고 그것은 운동화를 버린다고 해서 사라지는 것이 아니었다. 추억은 물건이 아니라 마음속에 살아 있는 것이니까. 나는 운동화를 조심스럽게 봉투에 넣으며 속으로 작별 인사를 건넸다. 안녕, 그동안 고마웠어.`;

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 }
];

const totalLen = p1.length + p2.length + p3.length;
console.log(`총 글자 수: ${totalLen} (p1:${p1.length} p2:${p2.length} p3:${p3.length})`);
if (totalLen < 1050 || totalLen > 1150) console.warn(`경고: 1050~1150 범위 밖`);

// ── 유틸 ──
function splitSentences(text) {
  const r = []; let m, re = /[^.!?]*[.!?]/g;
  while ((m = re.exec(text)) !== null) { const s = m[0].trim(); if (s) r.push(s); }
  return r;
}
function findRange(pText, target) {
  const s = pText.indexOf(target);
  if (s === -1) { console.error(`NOT FOUND: "${target.substring(0,60)}"`); process.exit(1); }
  return { start: s, end: s + target.length };
}

const timeline = [];
let sc = 1;
function addStep(pId, pText, sent, prompt, choices) {
  const r = findRange(pText, sent);
  timeline.push({ stepId:`s${sc++}`, highlight:{ranges:[{paragraphId:pId,...r}]},
    question:{prompt, choices:choices.map((t,i)=>({id:["A","B","C","D"][i],text:t})),
      answerId:"A", scoring:{correctDeltaSec:20,wrongDeltaSec:-40,eliminateWrongChoice:true}}});
}
function addSummary(pId, pLen, prompt, choices) {
  timeline.push({ stepId:`s${sc++}`, highlight:{ranges:[{paragraphId:pId,start:0,end:pLen}]},
    question:{prompt, choices:choices.map((t,i)=>({id:["A","B","C","D"][i],text:t})),
      answerId:"A", scoring:{correctDeltaSec:20,wrongDeltaSec:-40,eliminateWrongChoice:true}}});
}

const ps1 = splitSentences(p1), ps2 = splitSentences(p2), ps3 = splitSentences(p3);
console.log(`문장수: p1=${ps1.length} p2=${ps2.length} p3=${ps3.length}`);

// ── p1 ──
addStep("p1",p1,ps1[0], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["신발장 구석에 오래되고 낡은 운동화가 놓여 있다.",
   "신발장에 새 운동화가 깔끔하게 진열되어 있다.",
   "운동화가 현관 앞에 깨끗하게 놓여 있다.",
   "신발장에 다양한 종류의 새 신발이 가득하다."]);

addStep("p1",p1,ps1[1], "하이라이트된 문장에서 운동화의 상태로 적절한 것은?",
  ["바닥이 변색되고 옆면에 풀밭 얼룩이 남아 있다.",
   "운동화가 새것처럼 깨끗한 상태이다.",
   "운동화 바닥만 깨끗하고 윗부분이 찢어져 있다.",
   "운동화에 물감 얼룩만 묻어 있다."]);

addStep("p1",p1,ps1[2], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["끈이 끊어져 매듭으로 이었고 뒤꿈치가 닳아 밑창이 드러나 있다.",
   "끈이 새것으로 교체되어 있고 밑창도 튼튼하다.",
   "운동화의 끈과 밑창 모두 완벽한 상태이다.",
   "뒤꿈치만 약간 닳았을 뿐 전체적으로 깨끗하다."]);

addStep("p1",p1,ps1[3], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["남들에게는 버릴 신발이지만 화자에게는 특별한 의미가 있다.",
   "화자도 이 운동화를 하찮게 여기고 있다.",
   "모든 사람이 이 운동화를 소중히 여길 것이다.",
   "화자는 운동화의 경제적 가치를 높이 평가하고 있다."]);

addStep("p1",p1,ps1[4], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["운동화를 볼 때마다 중학교 시절의 기억이 떠오른다.",
   "운동화를 보면 초등학교 시절의 기억이 떠오른다.",
   "운동화를 볼 때마다 미래에 대한 기대감이 든다.",
   "화자는 운동화를 보아도 아무런 감정을 느끼지 않는다."]);

addStep("p1",p1,ps1[5], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["체육, 축구, 비 오는 날의 추억이 운동화 안에 담겨 있는 듯하다.",
   "운동화에는 아무런 추억도 담겨 있지 않다.",
   "화자는 체육 시간을 싫어하여 운동화를 신지 않았다.",
   "비 오는 날에는 절대로 밖에 나가지 않았다."]);

addSummary("p1",p1.length, "이 문단의 중심 내용으로 가장 적절한 것은?",
  ["낡은 운동화에는 화자의 중학교 시절 소중한 추억이 담겨 있다.",
   "화자는 깨끗한 새 운동화를 매우 좋아한다.",
   "운동화의 관리 방법을 자세히 설명하고 있다.",
   "화자는 중학교 시절의 기억을 모두 잊고 싶어 한다."]);

// ── p2 ──
addStep("p2",p2,ps2[0], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["어머니는 여러 번 낡은 운동화를 버리라고 하셨다.",
   "어머니는 운동화를 소중하게 보관하라고 하셨다.",
   "어머니는 운동화에 대해 아무 말씀도 하지 않으셨다.",
   "어머니는 운동화를 수선해 주겠다고 하셨다."]);

addStep("p2",p2,ps2[1], "하이라이트된 문장에서 어머니의 태도로 가장 적절한 것은?",
  ["신지 않는 운동화를 왜 보관하는지 이해하지 못하고 계신다.",
   "운동화를 자식의 소중한 추억으로 인정하고 계신다.",
   "운동화를 다른 사람에게 주라고 권유하고 계신다.",
   "운동화를 수리해서 다시 신으라고 하고 계신다."]);

addStep("p2",p2,ps2[2], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["어머니의 말씀은 합리적이었다.",
   "어머니의 말씀이 비합리적이었다.",
   "화자는 어머니의 말씀에 동의하였다.",
   "어머니는 아무런 말씀도 하지 않으셨다."]);

addStep("p2",p2,ps2[3], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["새 운동화가 이미 두 켤레가 있어 낡은 것을 다시 신을 일은 없었다.",
   "새 운동화가 없어서 낡은 운동화를 계속 신어야 했다.",
   "화자에게는 운동화가 하나도 없었다.",
   "낡은 운동화가 새것보다 더 편안하여 계속 신고 있었다."]);

addStep("p2",p2,ps2[4], "하이라이트된 문장에서 화자의 행동으로 적절한 것은?",
  ["매번 버리지 않고 운동화를 다시 신발장에 넣었다.",
   "어머니의 말씀에 따라 바로 운동화를 버렸다.",
   "운동화를 친구에게 선물하였다.",
   "운동화를 수선하여 다시 신기 시작하였다."]);

addStep("p2",p2,ps2[5], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["운동화를 버리지 못한 것은 물건 자체가 아쉬워서가 아니었다.",
   "물건이 비싸서 버리기 아까웠다.",
   "운동화를 다시 신을 계획이 있었다.",
   "어머니가 허락하지 않아 버리지 못했다."]);

addStep("p2",p2,ps2[6], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["운동화에는 중학교 시절 함께 웃고 울었던 시간이 배어 있었다.",
   "운동화에는 아무런 감정적 가치가 없었다.",
   "화자는 중학교 시절이 즐겁지 않았다.",
   "운동화에 남아 있는 것은 오직 땀 냄새뿐이었다."]);

addStep("p2",p2,ps2[7], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["운동화를 버리면 기억까지 사라질 것 같은 두려움이 화자를 붙잡았다.",
   "화자는 기억이 사라지는 것에 대해 아무런 걱정이 없었다.",
   "운동화를 버리면 새 운동화를 받을 수 있어서 기대하였다.",
   "화자는 기억보다 물건의 경제적 가치를 더 중요하게 여겼다."]);

addSummary("p2",p2.length, "이 문단의 중심 내용으로 가장 적절한 것은?",
  ["화자는 추억이 사라질까 두려워 낡은 운동화를 버리지 못하였다.",
   "어머니는 화자의 마음을 완벽하게 이해하고 계셨다.",
   "화자는 새 운동화가 없어 어쩔 수 없이 낡은 것을 신었다.",
   "화자는 물건에 대한 집착이 전혀 없는 사람이었다."]);

// ── p3 ──
addStep("p3",p3,ps3[0], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["시간이 흘러 화자는 고등학생이 되었다.",
   "시간이 흘러 화자는 대학생이 되었다.",
   "화자는 여전히 중학생이다.",
   "시간이 흘러 화자는 초등학생이 되었다."]);

addStep("p3",p3,ps3[1], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["방을 정리하다가 다시 그 운동화를 발견하였다.",
   "새 운동화를 사러 가다가 옛 운동화를 떠올렸다.",
   "친구가 그 운동화를 가져다주었다.",
   "어머니가 운동화를 버리지 않고 보관해 두셨다."]);

addStep("p3",p3,ps3[2], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["운동화를 들어 보니 이전보다 훨씬 가벼웠다.",
   "운동화가 이전보다 더 무거워져 있었다.",
   "운동화의 무게는 전혀 변하지 않았다.",
   "화자는 운동화를 들어 보지 않았다."]);

addStep("p3",p3,ps3[3], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["코끝에 대니 오래된 가죽과 먼지 냄새가 희미하게 났다.",
   "운동화에서 새 신발 냄새가 강하게 풍겨 왔다.",
   "운동화에서 아무런 냄새도 나지 않았다.",
   "운동화에서 향수 냄새가 진하게 났다."]);

addStep("p3",p3,ps3[4], "하이라이트된 문장에서 화자의 태도로 적절한 것은?",
  ["운동화를 한참 바라보다가 조용히 미소를 지었다.",
   "운동화를 보고 크게 울었다.",
   "운동화를 곧바로 쓰레기통에 버렸다.",
   "운동화를 보고 화를 냈다."]);

addStep("p3",p3,ps3[5], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["화자가 문득 깨달은 것이 있었다.",
   "화자는 아무것도 깨달은 것이 없었다.",
   "화자는 이미 오래전에 모든 것을 깨달아 있었다.",
   "화자는 운동화에 대해 아무런 생각이 없었다."]);

addStep("p3",p3,ps3[6], "하이라이트된 문장에서 화자가 깨달은 것으로 가장 적절한 것은?",
  ["간직하고 싶었던 것은 신발이 아니라 친구들과의 웃음과 우정이었다.",
   "물건 자체를 간직하는 것이 가장 중요하다는 것이었다.",
   "운동화를 버려서는 절대 안 된다는 확신이었다.",
   "새 운동화를 사는 것이 최선이라는 것이었다."]);

addStep("p3",p3,ps3[7], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["우정과 추억은 운동화를 버린다고 해서 사라지는 것이 아니었다.",
   "운동화를 버리면 모든 기억이 함께 사라진다.",
   "물건을 간직해야만 기억을 보존할 수 있다.",
   "기억은 물건에만 담겨 있다."]);

addStep("p3",p3,ps3[8], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["추억은 물건이 아니라 마음속에 살아 있는 것이다.",
   "추억은 물건 속에만 존재하는 것이다.",
   "마음속의 기억은 시간이 지나면 모두 사라진다.",
   "물건을 보관해야만 추억이 살아남을 수 있다."]);

addStep("p3",p3,ps3[9], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["화자는 운동화를 조심스럽게 봉투에 넣으며 속으로 작별하였다.",
   "화자는 운동화를 거칠게 던져 버렸다.",
   "화자는 운동화를 다시 신발장에 넣었다.",
   "화자는 운동화를 친구에게 선물하였다."]);

addStep("p3",p3,ps3[10], "하이라이트된 문장에서 느껴지는 화자의 감정으로 가장 적절한 것은?",
  ["운동화에 대한 감사와 따뜻한 이별의 마음이 담겨 있다.",
   "운동화를 버리는 것에 대한 분노가 느껴진다.",
   "운동화에 대한 무관심한 태도가 드러난다.",
   "운동화를 잃어버린 것에 대한 당혹감이 느껴진다."]);

addSummary("p3",p3.length, "이 문단의 중심 내용으로 가장 적절한 것은?",
  ["화자는 소중한 것은 물건이 아닌 추억임을 깨닫고 운동화와 작별하였다.",
   "화자는 끝내 운동화를 버리지 못하고 다시 보관하였다.",
   "화자는 운동화에 대한 미련 없이 바로 버렸다.",
   "화자는 고등학생이 되어서도 운동화를 계속 신고 다녔다."]);

// ── 복기 카드 (8개) ──
const fullText = p1 + p2 + p3;
const cardLen = Math.ceil(fullText.length / 8);
const cards = [];
for (let i = 0; i < 8; i++) {
  cards.push({ id:`c${i+1}`, text:fullText.substring(i*cardLen, Math.min((i+1)*cardLen, fullText.length)) });
}
const recall = { cards, correctOrder:cards.map(c=>c.id), seedPenalty:1 };

// ── 확인 문항 (7개) ──
const confirm = { questions:[] };
let qc = 1;
function addQ(pId, pText, target, prompt) {
  const r = findRange(pText, target);
  confirm.questions.push({ id:`q${qc++}`, prompt,
    answerRanges:[{paragraphId:pId,...r}],
    scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:"ANY" });
}

addQ("p1",p1,"한때 하얀색이었던 바닥은 누렇게 변색되었고, 옆면에는 풀밭을 뛰어다닌 흔적인 초록색 얼룩이 아무리 세탁해도 지워지지 않은 채 남아 있다",
  "운동화의 외형적 상태는 어떠하였나요?");
addQ("p1",p1,"체육 시간에 운동장을 전력으로 질주하던 짜릿한 느낌, 방과 후 친구들과 축구공을 차며 웃던 황금빛 오후, 비 오는 날 물웅덩이를 뛰어넘다 미끄러져 넘어졌던 순간",
  "화자가 운동화를 보며 떠올리는 구체적인 추억은 무엇인가요?");
addQ("p2",p2,"이 운동화에는 나의 중학교 시절이, 땀 냄새와 흙먼지와 함께 웃고 울었던 그 시간들이 고스란히 배어 있었다",
  "화자가 운동화를 버리지 못한 진짜 이유는 무엇인가요?");
addQ("p2",p2,"운동화를 버리면 그 기억까지 함께 사라질 것만 같은 막연한 두려움",
  "화자를 붙잡고 있던 감정은 무엇이었나요?");
addQ("p3",p3,"내가 진짜 간직하고 싶었던 것은 이 낡은 신발이 아니라, 그 시절 친구들과 함께 나누었던 웃음과 우정이었다",
  "화자가 깨달은 핵심적인 내용은 무엇인가요?");
addQ("p3",p3,"그것은 운동화를 버린다고 해서 사라지는 것이 아니었다",
  "우정과 추억에 대해 화자가 깨달은 것은 무엇인가요?");
addQ("p3",p3,"운동화를 조심스럽게 봉투에 넣으며 속으로 작별 인사를 건넸다",
  "화자는 운동화와 어떻게 이별하였나요?");

// ── 출력 ──
const content = {
  contentId:"dr-r1-010", contentType:"DAILY_READING", version:1, status:"PUBLISHED",
  title:"일일 독해(러셀 1) Day 10 문학", description:"일일 독해 - 정독·복기·확인",
  targetLevel:"RUSSELL_1", schoolGradeRange:{min:7,max:8},
  area:"READING", subArea:"LITERATURE", competencies:["READING"], tags:["daily"],
  access:{mode:"FREE"}, seedReward:{seedType:"WHEAT",count:3,multiplier:1},
  timeLimitSec:300, assets:{},
  payload:{ passage:{format:"TEXT",paragraphs}, intensive:{timeline}, recall, confirm }
};

const batchItem = { content_type:"DAILY_READING", level_id:"RUSSELL_1", area:"READING",
  sub_area:"LITERATURE", day_index:10, module_key:"reading_training",
  schema_version:"1.0", content };

const staticPath = path.join(__dirname,'..','frontend','public','daily-reading','russell1','010.json');
fs.writeFileSync(staticPath, JSON.stringify(content,null,2), 'utf8');

const batchPath = path.join(__dirname,'..','generated','daily-batch-reading-russell1.json');
const batch = JSON.parse(fs.readFileSync(batchPath,'utf8'));
batch.items[9] = batchItem;
fs.writeFileSync(batchPath, JSON.stringify(batch,null,2), 'utf8');

console.log(`\nstatic: ${staticPath}`);
console.log(`batch: items[9] 업데이트`);
console.log(`타임라인:${timeline.length} 복기:${cards.length} 확인:${confirm.questions.length}`);
console.log(`=== Day 10 완료 ===`);
