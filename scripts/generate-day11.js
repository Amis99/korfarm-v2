// Day 11: 비문학 (NONFICTION) - 인문: 언어와 사고의 관계
// 중1~중2 수준, 1100자 ±50

const fs = require('fs');
const path = require('path');

// ── 지문 ──
const p1 = `사람은 생각을 할 때 대부분 머릿속으로 말을 한다. 수학 문제를 풀 때에도, 오늘 저녁에 무엇을 먹을지 고민할 때에도 우리는 속으로 스스로에게 말을 건네며 사고한다. 이처럼 언어와 사고는 매우 밀접한 관계를 맺고 있다. 그렇다면 우리가 사용하는 언어가 사고의 방식이나 범위에 영향을 미칠 수 있을까? 이 물음에 대해 언어학자들 사이에서는 오랫동안 활발하고 흥미로운 논쟁이 이어져 왔다. 미국의 언어학자 에드워드 사피어와 그의 제자 벤자민 리 워프는 언어가 사고를 결정한다는 이론을 제시하였다. 이 이론에 따르면, 사람은 자신이 사용하는 언어의 구조와 어휘가 만들어 내는 틀 안에서만 세계를 인식하고 이해할 수 있다.`;

const p2 = `사피어-워프 가설의 대표적인 근거로 자주 언급되는 것이 에스키모인의 눈에 관한 이야기이다. 에스키모어에는 눈을 가리키는 단어가 여러 개 있어서, 에스키모인들은 다양한 종류의 눈을 세밀하게 구별할 수 있다고 알려져 있다. 반면 눈에 관한 단어가 적은 언어를 사용하는 사람들은 눈의 종류를 구별하는 능력이 상대적으로 떨어진다는 것이다. 비슷한 예로, 특정 색을 가리키는 단어가 풍부한 언어를 사용하는 사람들은 그렇지 않은 언어 사용자들에 비해 색의 미세한 차이를 더 잘 인식한다는 연구 결과도 보고되었다. 이러한 사례들은 언어가 우리의 지각과 사고에 실제로 영향을 미칠 수 있음을 보여 준다.`;

const p3 = `그러나 사피어-워프 가설에 대한 반론도 만만치 않다. 비판론자들은 언어가 사고를 완전히 결정하는 것이 아니라, 사고가 먼저 존재하고 언어는 그것을 표현하는 도구에 불과하다고 주장한다. 예를 들어, 어떤 언어에 특정 개념을 나타내는 단어가 없다 하더라도 그 개념을 이해하거나 경험하는 것 자체가 불가능한 것은 아니다. 우리말에 영어의 '프라이버시'에 정확히 대응하는 단어가 없지만, 한국인이 사생활 보호의 개념을 이해하지 못하는 것은 아닌 것과 마찬가지이다. 오늘날 대부분의 학자들은 언어가 사고를 완전히 결정하지는 않지만 일정 부분 영향을 미친다는 약한 형태의 가설을 받아들이고 있다. 즉, 언어는 사고의 방향을 유도하는 길잡이 역할을 하되 사고의 모든 것을 좌우하지는 않는다는 것이다.`;

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

// ── p1 (7문장) ──
addStep("p1",p1,ps1[0], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["사람은 생각을 할 때 대부분 머릿속으로 말을 한다.",
   "사람은 생각을 할 때 언어를 전혀 사용하지 않는다.",
   "사람은 생각을 할 때 항상 소리 내어 말한다.",
   "사람은 생각할 때 그림으로만 사고한다."]);

addStep("p1",p1,ps1[1], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["수학 문제나 메뉴 선택 등 일상에서 속으로 말하며 사고한다.",
   "수학 문제를 풀 때에만 속으로 말을 한다.",
   "일상적인 결정에서는 언어를 사용하지 않는다.",
   "사고는 언어와 무관하게 이루어진다."]);

addStep("p1",p1,ps1[2], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["언어와 사고는 매우 밀접한 관계에 있다.",
   "언어와 사고는 전혀 관련이 없다.",
   "언어는 사고를 방해하는 요소이다.",
   "사고는 언어와 무관하게 독립적으로 작동한다."]);

addStep("p1",p1,ps1[3], "하이라이트된 문장이 글에서 하는 역할로 가장 적절한 것은?",
  ["독자에게 질문을 던져 언어와 사고의 관계에 대한 논의를 이끌어 내고 있다.",
   "사피어-워프 가설의 내용을 구체적으로 설명하고 있다.",
   "언어와 사고의 관계에 대한 최종 결론을 제시하고 있다.",
   "에스키모인의 언어 특성을 소개하고 있다."]);

addStep("p1",p1,ps1[4], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["이 질문에 대해 언어학자들 사이에서 오랜 논쟁이 이어져 왔다.",
   "이 질문에 대해 이미 확정된 답이 존재한다.",
   "언어학자들은 이 주제에 관심이 없다.",
   "이 질문은 최근에 처음으로 제기되었다."]);

addStep("p1",p1,ps1[5], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["사피어와 워프는 언어가 사고를 결정한다는 이론을 제시하였다.",
   "사피어와 워프는 사고가 언어를 결정한다고 주장하였다.",
   "사피어와 워프는 언어와 사고가 무관하다고 보았다.",
   "사피어와 워프는 언어학자가 아니라 심리학자였다."]);

addStep("p1",p1,ps1[6], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["이 이론에 따르면 사람은 자신의 언어 틀 안에서만 세계를 인식할 수 있다.",
   "이 이론에 따르면 언어와 세계 인식은 무관하다.",
   "이 이론에 따르면 모든 언어는 동일한 인식을 만들어 낸다.",
   "이 이론에 따르면 세계를 인식하는 데 언어는 필요하지 않다."]);

addSummary("p1",p1.length, "이 문단의 중심 내용으로 가장 적절한 것은?",
  ["언어와 사고의 밀접한 관계를 소개하고, 언어가 사고를 결정한다는 가설을 제시하고 있다.",
   "수학 문제를 풀 때 언어가 필요 없다는 주장을 펼치고 있다.",
   "사피어와 워프의 개인적 생애를 소개하고 있다.",
   "언어와 사고가 무관하다는 결론을 내리고 있다."]);

// ── p2 (5문장) ──
addStep("p2",p2,ps2[0], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["에스키모인의 눈에 관한 이야기가 사피어-워프 가설의 대표적 근거이다.",
   "에스키모인의 이야기는 사피어-워프 가설과 무관하다.",
   "에스키모인은 눈에 관한 단어가 하나뿐이다.",
   "이 가설의 근거로 에스키모인의 사례가 사용된 적이 없다."]);

addStep("p2",p2,ps2[1], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["에스키모어에는 눈을 가리키는 단어가 여러 개 있어 눈의 종류를 세밀하게 구별한다.",
   "에스키모어에는 눈을 가리키는 단어가 하나뿐이다.",
   "에스키모인들은 눈의 종류를 구별하지 못한다.",
   "에스키모어는 눈과 관련된 어휘가 매우 빈약하다."]);

addStep("p2",p2,ps2[2], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["눈에 관한 단어가 적은 언어의 사용자는 눈의 구별 능력이 떨어진다.",
   "눈에 관한 단어가 적어도 눈의 구별 능력은 동일하다.",
   "모든 언어 사용자는 눈을 동일하게 구별한다.",
   "단어 수와 구별 능력 사이에는 아무런 관계가 없다."]);

addStep("p2",p2,ps2[3], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["색을 가리키는 단어가 풍부한 언어의 사용자가 색의 차이를 더 잘 인식한다.",
   "색에 관한 단어 수와 색 인식 능력은 무관하다.",
   "모든 사람은 색을 동일하게 인식한다.",
   "색에 관한 단어가 적을수록 색 인식 능력이 더 뛰어나다."]);

addStep("p2",p2,ps2[4], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["이러한 사례들은 언어가 지각과 사고에 실제로 영향을 미칠 수 있음을 보여 준다.",
   "이러한 사례들은 언어와 사고가 무관함을 증명한다.",
   "이러한 사례들은 가설에 대한 반박 증거이다.",
   "이러한 사례들은 학계에서 인정받지 못하고 있다."]);

addSummary("p2",p2.length, "이 문단의 중심 내용으로 가장 적절한 것은?",
  ["에스키모인의 눈과 색 인식 연구 등 언어가 사고에 영향을 미치는 구체적 사례들을 제시하고 있다.",
   "에스키모인의 생활 방식을 상세히 소개하고 있다.",
   "언어가 사고에 영향을 미치지 않는다는 근거를 제시하고 있다.",
   "색에 관한 언어학 연구의 역사를 정리하고 있다."]);

// ── p3 (6문장) ──
addStep("p3",p3,ps3[0], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["사피어-워프 가설에 대한 반론도 상당히 많이 존재한다.",
   "사피어-워프 가설은 반론 없이 모두에게 받아들여졌다.",
   "사피어-워프 가설에 대한 반론은 거의 없다.",
   "사피어-워프 가설은 이미 완전히 폐기되었다."]);

addStep("p3",p3,ps3[1], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["비판론자들은 사고가 먼저 존재하고 언어는 표현 도구에 불과하다고 주장한다.",
   "비판론자들은 언어가 사고를 완전히 결정한다고 동의한다.",
   "비판론자들은 사고와 언어가 동시에 발생한다고 본다.",
   "비판론자들은 사고가 존재하지 않는다고 주장한다."]);

addStep("p3",p3,ps3[2], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["특정 개념의 단어가 없어도 그 개념을 이해하거나 경험할 수 있다.",
   "단어가 없으면 해당 개념을 절대 이해할 수 없다.",
   "모든 개념에는 반드시 대응하는 단어가 존재한다.",
   "단어가 없으면 새로운 경험 자체가 불가능하다."]);

addStep("p3",p3,ps3[3], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["우리말에 '프라이버시' 대응어가 없어도 그 개념은 이해할 수 있다.",
   "우리말에 '프라이버시'에 대응하는 단어가 정확히 있다.",
   "한국인은 사생활 보호 개념을 이해하지 못한다.",
   "'프라이버시'라는 단어는 모든 언어에 존재한다."]);

addStep("p3",p3,ps3[4], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["오늘날 학자들은 언어가 사고에 일정 부분 영향을 미친다는 약한 형태의 가설을 받아들인다.",
   "오늘날 학자들은 언어가 사고를 완전히 결정한다고 본다.",
   "오늘날 학자들은 언어와 사고가 전혀 무관하다고 본다.",
   "오늘날 학자들은 이 문제에 대해 관심을 잃었다."]);

addStep("p3",p3,ps3[5], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["언어는 사고의 방향을 안내하되 사고의 전부를 좌우하지는 않는다.",
   "언어가 사고의 모든 것을 결정한다.",
   "언어는 사고에 아무런 역할도 하지 않는다.",
   "사고는 언어 없이도 완전히 동일하게 이루어진다."]);

addSummary("p3",p3.length, "이 문단의 중심 내용으로 가장 적절한 것은?",
  ["사피어-워프 가설에 대한 반론과 오늘날 학자들의 절충적 입장을 설명하고 있다.",
   "사피어-워프 가설이 완전히 옳다는 것을 증명하고 있다.",
   "에스키모인의 눈 인식 능력에 대해 추가로 설명하고 있다.",
   "한국어의 어휘 특성에 대해 상세히 분석하고 있다."]);

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

addQ("p1",p1,"언어가 사고를 결정한다는 이론을 제시하였다",
  "사피어와 워프가 주장한 이론의 핵심 내용은 무엇인가요?");
addQ("p1",p1,"사람은 자신이 사용하는 언어의 구조와 어휘가 만들어 내는 틀 안에서만 세계를 인식하고 이해할 수 있다",
  "사피어-워프 가설에 따르면 세계 인식은 무엇에 의해 제한되나요?");
addQ("p2",p2,"에스키모어에는 눈을 가리키는 단어가 여러 개 있어서, 에스키모인들은 다양한 종류의 눈을 세밀하게 구별할 수 있다",
  "에스키모인의 사례가 사피어-워프 가설의 근거가 되는 이유는 무엇인가요?");
addQ("p2",p2,"특정 색을 가리키는 단어가 풍부한 언어를 사용하는 사람들은 그렇지 않은 언어 사용자들에 비해 색의 미세한 차이를 더 잘 인식한다",
  "색 인식과 관련하여 어떤 연구 결과가 보고되었나요?");
addQ("p3",p3,"사고가 먼저 존재하고 언어는 그것을 표현하는 도구에 불과하다고 주장한다",
  "비판론자들의 핵심 주장은 무엇인가요?");
addQ("p3",p3,"어떤 언어에 특정 개념을 나타내는 단어가 없다 하더라도 그 개념을 이해하거나 경험하는 것 자체가 불가능한 것은 아니다",
  "비판론자들이 제시한 반박의 핵심 논리는 무엇인가요?");
addQ("p3",p3,"언어는 사고의 방향을 유도하는 길잡이 역할을 하되 사고의 모든 것을 좌우하지는 않는다",
  "오늘날 학자들이 받아들이는 절충적 입장은 무엇인가요?");

// ── 출력 ──
const content = {
  contentId:"dr-r1-011", contentType:"DAILY_READING", version:1, status:"PUBLISHED",
  title:"일일 독해(러셀 1) Day 11 비문학", description:"일일 독해 - 정독·복기·확인",
  targetLevel:"RUSSELL_1", schoolGradeRange:{min:7,max:8},
  area:"READING", subArea:"NONFICTION", competencies:["READING"], tags:["daily"],
  access:{mode:"FREE"}, seedReward:{seedType:"WHEAT",count:3,multiplier:1},
  timeLimitSec:300, assets:{},
  payload:{ passage:{format:"TEXT",paragraphs}, intensive:{timeline}, recall, confirm }
};

const batchItem = { content_type:"DAILY_READING", level_id:"RUSSELL_1", area:"READING",
  sub_area:"NONFICTION", day_index:11, module_key:"reading_training",
  schema_version:"1.0", content };

const staticPath = path.join(__dirname,'..','frontend','public','daily-reading','russell1','011.json');
fs.writeFileSync(staticPath, JSON.stringify(content,null,2), 'utf8');

const batchPath = path.join(__dirname,'..','generated','daily-batch-reading-russell1.json');
const batch = JSON.parse(fs.readFileSync(batchPath,'utf8'));
batch.items[10] = batchItem;
fs.writeFileSync(batchPath, JSON.stringify(batch,null,2), 'utf8');

console.log(`\nstatic: ${staticPath}`);
console.log(`batch: items[10] 업데이트`);
console.log(`타임라인:${timeline.length} 복기:${cards.length} 확인:${confirm.questions.length}`);
console.log(`=== Day 11 완료 ===`);
