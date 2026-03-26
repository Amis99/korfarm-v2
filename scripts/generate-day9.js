// Day 9: 비문학 (NONFICTION) - 사회: 공정 무역
// 중1~중2 수준, 1100자 ±50

const fs = require('fs');
const path = require('path');

// ── 지문 ──
const p1 = `우리가 마트에서 초콜릿이나 커피를 살 때, 그 상품이 어디에서 어떤 과정을 거쳐 만들어졌는지 생각해 본 적이 있는가? 초콜릿의 원료인 카카오는 주로 아프리카와 남아메리카의 개발도상국에서 재배된다. 그런데 이 카카오를 재배하는 농민들은 대부분 매우 적은 임금을 받으며 하루 종일 땀을 흘리고 있다. 한 잔에 수천 원씩 하는 커피가 소비자에게 전달되는 과정에서 정작 원두를 재배한 농민에게 돌아가는 몫은 전체 가격의 극히 일부에 불과한 경우가 대부분이다. 국제 시장에서 카카오나 커피의 가격이 떨어지면 농민들의 수입은 더욱 줄어들어 기본적인 생활조차 유지하기 어려워진다. 이처럼 생산자와 소비자 사이에 존재하는 불공정한 무역 구조를 개선하기 위해 등장한 것이 바로 공정 무역이다.`;

const p2 = `공정 무역이란 개발도상국의 생산자에게 정당한 대가를 지급하고, 지속 가능한 발전을 지원하는 무역 방식을 말한다. 일반적인 무역에서는 수출업자, 가공업자, 유통업자 등 중간 상인이 여러 단계를 거치면서 생산자가 받는 몫이 크게 줄어드는 문제가 발생한다. 공정 무역은 이러한 중간 단계를 최소화하여 생산자가 적정한 가격을 보장받을 수 있도록 한다. 또한 공정 무역 인증을 받은 제품에는 아동 노동이 금지되며, 환경을 보호하는 방식으로 생산해야 한다는 조건이 붙는다. 이를 통해 생산자의 노동 환경이 개선되고, 자녀를 학교에 보낼 수 있는 여건이 마련되는 등 지역 사회 전체가 실질적인 혜택을 누리게 된다.`;

const p3 = `그러나 공정 무역에 대한 비판적 시각도 존재한다. 우선 공정 무역 제품은 일반 제품보다 가격이 높은 경우가 많아서, 소비자의 경제적 부담이 커질 수 있다는 문제가 있다. 또한 공정 무역 인증을 받기 위해서는 일정한 비용과 복잡한 절차가 필요하기 때문에, 규모가 작은 영세 농가는 인증 과정 자체에 참여하기 어렵다는 한계도 지적된다. 아울러 공정 무역이 커피나 카카오 같은 특정 품목이나 일부 지역에 집중되어 있어서, 혜택을 받지 못하는 생산자가 여전히 많다는 비판도 있다. 이러한 한계에도 불구하고 공정 무역은 소비자가 자신의 소비를 통해 세계의 불평등 문제에 관심을 갖고 변화에 동참할 수 있는 의미 있는 실천 방안으로 높이 평가받고 있다.`;

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

// ── p1 (6문장) ──
addStep("p1",p1,ps1[0], "하이라이트된 문장이 글에서 하는 역할로 가장 적절한 것은?",
  ["독자에게 질문을 던져 일상 속 무역 문제에 관심을 유도하고 있다.",
   "공정 무역의 정확한 정의를 제시하고 있다.",
   "카카오 재배 방법을 구체적으로 설명하고 있다.",
   "개발도상국의 지리적 위치를 소개하고 있다."]);

addStep("p1",p1,ps1[1], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["카카오는 주로 아프리카와 남아메리카의 개발도상국에서 재배된다.",
   "카카오는 유럽의 선진국에서 대부분 재배된다.",
   "카카오는 한국에서 주로 재배되는 농산물이다.",
   "카카오의 재배 지역은 아직 알려지지 않았다."]);

addStep("p1",p1,ps1[2], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["카카오를 재배하는 농민들은 매우 적은 보수를 받으며 일하고 있다.",
   "카카오 농민들은 선진국 노동자보다 더 높은 임금을 받고 있다.",
   "카카오 농민들의 임금 수준은 매우 안정적이다.",
   "카카오 재배에는 많은 노동력이 필요하지 않다."]);

addStep("p1",p1,ps1[3], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["커피 가격에서 농민에게 돌아가는 몫은 극히 일부에 불과하다.",
   "커피 가격 전체가 농민에게 돌아간다.",
   "커피 원두 재배 농민은 높은 이익을 보장받고 있다.",
   "소비자 가격과 농민의 수입은 동일하다."]);

addStep("p1",p1,ps1[4], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["국제 시장에서 가격이 하락하면 농민들의 생활이 더욱 어려워진다.",
   "카카오 가격이 떨어져도 농민들의 수입에는 변화가 없다.",
   "카카오 가격이 떨어지면 농민들의 수입이 오히려 증가한다.",
   "국제 시장의 가격 변동은 농민들에게 아무런 영향을 미치지 않는다."]);

addStep("p1",p1,ps1[5], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["불공정한 무역 구조를 개선하기 위해 공정 무역이 등장하였다.",
   "공정 무역은 선진국의 이익을 극대화하기 위해 만들어졌다.",
   "공정 무역은 소비자의 부담을 늘리기 위해 도입되었다.",
   "공정 무역은 중간 상인의 이익을 보호하는 제도이다."]);

addSummary("p1",p1.length, "이 문단의 중심 내용으로 가장 적절한 것은?",
  ["카카오 생산자들이 겪는 불공정한 무역 현실에서 공정 무역이 등장하게 되었다.",
   "초콜릿은 세계에서 가장 인기 있는 간식이다.",
   "카카오 가격은 항상 안정적으로 유지된다.",
   "개발도상국 농민들의 생활은 점점 더 나아지고 있다."]);

// ── p2 (5문장) ──
addStep("p2",p2,ps2[0], "하이라이트된 문장에서 설명하는 공정 무역의 핵심으로 가장 적절한 것은?",
  ["개발도상국 생산자에게 정당한 대가를 지급하고 지속 가능한 발전을 지원한다.",
   "선진국 기업의 이윤을 극대화하는 무역 방식이다.",
   "모든 무역에서 중간 상인을 완전히 없애는 것이다.",
   "개발도상국 제품의 수입을 전면적으로 금지하는 것이다."]);

addStep("p2",p2,ps2[1], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["일반 무역에서는 여러 중간 상인 단계를 거치며 생산자의 몫이 줄어든다.",
   "일반 무역에서는 생산자가 가장 큰 이익을 가져간다.",
   "일반 무역에는 중간 상인이 전혀 존재하지 않는다.",
   "중간 상인이 많을수록 생산자의 이익이 증가한다."]);

addStep("p2",p2,ps2[2], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["공정 무역은 중간 단계를 줄여 생산자가 적정한 가격을 보장받도록 한다.",
   "공정 무역은 중간 상인의 수를 오히려 늘리는 방식이다.",
   "공정 무역에서도 생산자의 가격 보장은 이루어지지 않는다.",
   "공정 무역은 소비자의 가격만 낮추는 것을 목표로 한다."]);

addStep("p2",p2,ps2[3], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["공정 무역 인증 제품은 아동 노동 금지와 환경 보호가 조건으로 붙는다.",
   "공정 무역 인증에는 아무런 조건이 없다.",
   "공정 무역 인증은 환경 파괴를 허용하는 제도이다.",
   "공정 무역 인증 제품에서 아동 노동은 허용된다."]);

addStep("p2",p2,ps2[4], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["생산자의 노동 환경이 개선되고 지역 사회 전체가 실질적 혜택을 누리게 된다.",
   "공정 무역의 혜택은 오직 소비자에게만 돌아간다.",
   "공정 무역은 생산자의 노동 환경에 아무런 영향을 미치지 않는다.",
   "지역 사회는 공정 무역으로 인해 오히려 피해를 입는다."]);

addSummary("p2",p2.length, "이 문단의 중심 내용으로 가장 적절한 것은?",
  ["공정 무역은 생산자에게 정당한 대가를 보장하여 지역 사회 발전에 기여한다.",
   "공정 무역은 중간 상인의 이익을 보호하기 위한 제도이다.",
   "공정 무역은 소비자의 부담만 가중시키는 제도이다.",
   "공정 무역 인증에는 아무런 기준이 없다."]);

// ── p3 (5문장) ──
addStep("p3",p3,ps3[0], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["공정 무역에 대한 비판적 시각도 존재한다.",
   "공정 무역은 아무런 문제가 없는 완벽한 제도이다.",
   "공정 무역에 대해 비판하는 사람은 전혀 없다.",
   "공정 무역은 모든 사회 문제를 해결할 수 있다."]);

addStep("p3",p3,ps3[1], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["공정 무역 제품이 일반 제품보다 비싸 소비자의 경제적 부담이 커질 수 있다.",
   "공정 무역 제품은 일반 제품보다 항상 저렴하다.",
   "공정 무역 제품과 일반 제품의 가격 차이는 전혀 없다.",
   "공정 무역 제품의 가격은 소비자에게 아무런 부담이 되지 않는다."]);

addStep("p3",p3,ps3[2], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["영세 농가는 인증 비용과 복잡한 절차 때문에 참여가 어렵다.",
   "인증 비용이 전혀 들지 않아 누구나 쉽게 참여할 수 있다.",
   "규모가 큰 농가만 공정 무역에 참여할 수 없다.",
   "공정 무역 인증 절차는 매우 간단하여 모두 참여 가능하다."]);

addStep("p3",p3,ps3[3], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["공정 무역이 특정 품목이나 지역에 집중되어 혜택을 받지 못하는 생산자가 많다.",
   "공정 무역은 모든 품목과 모든 지역에 골고루 적용되고 있다.",
   "공정 무역의 혜택을 받지 못하는 생산자는 전혀 없다.",
   "공정 무역은 가장 부유한 지역의 생산자를 우선 지원한다."]);

addStep("p3",p3,ps3[4], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["공정 무역은 한계가 있지만 소비를 통해 불평등 해소에 동참하는 의미 있는 실천이다.",
   "공정 무역은 한계가 크므로 폐지되어야 한다.",
   "공정 무역은 소비자와 아무런 관련이 없는 제도이다.",
   "공정 무역은 이미 모든 문제가 해결되어 추가 노력이 필요 없다."]);

addSummary("p3",p3.length, "이 문단의 중심 내용으로 가장 적절한 것은?",
  ["공정 무역에는 한계가 있지만 의미 있는 소비 실천 방안으로 평가받고 있다.",
   "공정 무역은 아무런 한계 없이 완벽하게 작동하고 있다.",
   "공정 무역 제품은 일반 제품보다 항상 품질이 낮다.",
   "공정 무역은 생산자보다 소비자에게만 유리한 제도이다."]);

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

addQ("p1",p1,"카카오는 주로 아프리카와 남아메리카의 개발도상국에서 재배된다",
  "카카오는 주로 어디에서 재배되나요?");
addQ("p1",p1,"생산자와 소비자 사이에 존재하는 불공정한 무역 구조를 개선하기 위해 등장한 것이 바로 공정 무역이다",
  "공정 무역이 등장하게 된 이유는 무엇인가요?");
addQ("p2",p2,"개발도상국의 생산자에게 정당한 대가를 지급하고, 지속 가능한 발전을 지원하는 무역 방식",
  "공정 무역이란 어떤 무역 방식인가요?");
addQ("p2",p2,"이러한 중간 단계를 최소화하여 생산자가 적정한 가격을 보장받을 수 있도록 한다",
  "공정 무역에서 생산자의 가격 보장은 어떻게 이루어지나요?");
addQ("p2",p2,"아동 노동이 금지되며, 환경을 보호하는 방식으로 생산해야 한다는 조건이 붙는다",
  "공정 무역 인증 제품에는 어떤 조건이 붙나요?");
addQ("p3",p3,"공정 무역 제품은 일반 제품보다 가격이 높은 경우가 많아서, 소비자의 경제적 부담이 커질 수 있다는 문제가 있다",
  "공정 무역 제품의 가격과 관련된 문제점은 무엇인가요?");
addQ("p3",p3,"소비자가 자신의 소비를 통해 세계의 불평등 문제에 관심을 갖고 변화에 동참할 수 있는 의미 있는 실천 방안으로 높이 평가받고 있다",
  "공정 무역이 긍정적으로 평가받는 이유는 무엇인가요?");

// ── 출력 ──
const content = {
  contentId:"dr-r1-009", contentType:"DAILY_READING", version:1, status:"PUBLISHED",
  title:"일일 독해(러셀 1) Day 9 비문학", description:"일일 독해 - 정독·복기·확인",
  targetLevel:"RUSSELL_1", schoolGradeRange:{min:7,max:8},
  area:"READING", subArea:"NONFICTION", competencies:["READING"], tags:["daily"],
  access:{mode:"FREE"}, seedReward:{seedType:"WHEAT",count:3,multiplier:1},
  timeLimitSec:300, assets:{},
  payload:{ passage:{format:"TEXT",paragraphs}, intensive:{timeline}, recall, confirm }
};

const batchItem = { content_type:"DAILY_READING", level_id:"RUSSELL_1", area:"READING",
  sub_area:"NONFICTION", day_index:9, module_key:"reading_training",
  schema_version:"1.0", content };

const staticPath = path.join(__dirname,'..','frontend','public','daily-reading','russell1','009.json');
fs.writeFileSync(staticPath, JSON.stringify(content,null,2), 'utf8');

const batchPath = path.join(__dirname,'..','generated','daily-batch-reading-russell1.json');
const batch = JSON.parse(fs.readFileSync(batchPath,'utf8'));
batch.items[8] = batchItem;
fs.writeFileSync(batchPath, JSON.stringify(batch,null,2), 'utf8');

console.log(`\nstatic: ${staticPath}`);
console.log(`batch: items[8] 업데이트`);
console.log(`타임라인:${timeline.length} 복기:${cards.length} 확인:${confirm.questions.length}`);
console.log(`=== Day 9 완료 ===`);
