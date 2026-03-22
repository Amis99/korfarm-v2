// Day 7: 비문학 (NONFICTION) - 과학기술: 인공지능과 기계 학습
// 중1~중2 수준, 1100자 ±50

const fs = require('fs');
const path = require('path');

// ── 지문 ──
const p1 = `인공지능이란 인간의 사고 능력을 모방하여 스스로 학습하고 판단하는 컴퓨터 시스템을 말한다. 오늘날 인공지능은 스마트폰의 음성 비서, 검색 엔진, 자율 주행 자동차 등 일상 곳곳에서 활용되고 있다. 이러한 인공지능 기술의 핵심에는 기계 학습이라는 방법론이 자리하고 있다. 기계 학습이란 사람이 규칙을 정해 주지 않아도 컴퓨터가 대량의 데이터를 분석하여 스스로 규칙을 발견하는 기술을 뜻한다. 예를 들어, 수천 장의 고양이 사진과 개 사진을 컴퓨터에 학습시키면, 컴퓨터는 두 동물의 외형적 차이를 스스로 파악하여 새로운 사진이 고양이인지 개인지 구분할 수 있게 된다. 이처럼 기계 학습은 방대한 데이터 속에서 숨겨진 패턴과 규칙성을 찾아내는 과정이라 할 수 있다.`;

const p2 = `기계 학습에는 크게 지도 학습과 비지도 학습이라는 두 가지 방식이 있다. 지도 학습은 정답이 표시된 데이터를 컴퓨터에 제공하여 입력과 출력의 관계를 학습하도록 하는 방식이다. 우리가 매일 사용하는 이메일 서비스에서 스팸 메일을 자동으로 걸러 내는 기능이 지도 학습의 대표적인 활용 사례에 해당한다. 반면 비지도 학습은 정답 없이 컴퓨터가 데이터 자체의 구조와 유사성을 스스로 분석하여 의미 있는 집단으로 분류하는 방식이다. 온라인 쇼핑몰에서 구매 이력이 비슷한 고객들을 자동으로 묶어 맞춤형 상품을 추천하는 시스템이 비지도 학습을 활용한 대표적 사례이다.`;

const p3 = `최근 기계 학습 분야에서 가장 주목받는 기술은 딥러닝이다. 딥러닝은 인간 뇌의 신경 세포 연결 구조를 본뜬 인공 신경망을 여러 겹으로 깊게 쌓아 올려 복잡한 데이터를 처리하는 기술이다. 신경망의 층이 많아질수록 더 정교한 판단이 가능해지는데, 이 때문에 '깊다'는 뜻의 '딥'이라는 이름이 붙었다. 이 기술 덕분에 음성 인식, 자동 번역, 의료 영상 분석 등 다양한 분야에서 획기적인 성과가 나타나고 있다. 그러나 딥러닝에는 극복해야 할 과제도 남아 있다. 학습에 막대한 양의 데이터와 높은 컴퓨팅 성능이 요구되며, 컴퓨터가 특정 결론에 도달한 이유를 사람이 이해하기 어렵다는 점이 대표적인 한계로 꼽힌다. 이 때문에 인공지능의 판단 근거를 사람이 이해할 수 있도록 설명해 주는 설명 가능한 인공지능에 대한 연구가 활발하게 이루어지고 있다.`;

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
  if (s === -1) { console.error(`NOT FOUND: ${target.substring(0,50)}`); process.exit(1); }
  return { start: s, end: s + target.length };
}

const timeline = [];
let sc = 1;

function addStep(pId, pText, sent, prompt, choices) {
  const r = findRange(pText, sent);
  timeline.push({ stepId: `s${sc++}`, highlight: { ranges: [{ paragraphId: pId, ...r }] },
    question: { prompt, choices: choices.map((t,i)=>({id:["A","B","C","D"][i],text:t})),
      answerId:"A", scoring:{correctDeltaSec:20,wrongDeltaSec:-40,eliminateWrongChoice:true}}});
}
function addSummary(pId, pLen, prompt, choices) {
  timeline.push({ stepId: `s${sc++}`, highlight: { ranges: [{ paragraphId: pId, start:0, end:pLen }] },
    question: { prompt, choices: choices.map((t,i)=>({id:["A","B","C","D"][i],text:t})),
      answerId:"A", scoring:{correctDeltaSec:20,wrongDeltaSec:-40,eliminateWrongChoice:true}}});
}

// 문장 분리
const ps1 = splitSentences(p1), ps2 = splitSentences(p2), ps3 = splitSentences(p3);
console.log(`문장수: p1=${ps1.length} p2=${ps2.length} p3=${ps3.length}`);

// ── p1 ──
addStep("p1",p1,ps1[0], "하이라이트된 문장에서 설명하는 '인공지능'의 핵심 특성으로 가장 적절한 것은?",
  ["인간의 사고 능력을 본떠 독자적으로 학습하고 판단하는 컴퓨터 체계이다.",
   "인간이 직접 입력한 명령만을 정확하게 수행하는 단순 프로그램이다.",
   "데이터를 저장하는 데에만 특화된 대용량 저장 장치를 뜻한다.",
   "인간의 감정을 인식하여 대화를 나누는 로봇 기술만을 가리킨다."]);

addStep("p1",p1,ps1[1], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["인공지능은 음성 비서, 검색 엔진, 자율 주행 등 다양한 일상 영역에서 쓰이고 있다.",
   "인공지능은 아직 실험실 단계에 머물러 있어 일상에서는 활용되지 않는다.",
   "인공지능은 오직 공장 자동화에서만 사용되는 기술이다.",
   "인공지능 기술은 스마트폰에서는 전혀 활용할 수 없다."]);

addStep("p1",p1,ps1[2], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["인공지능 기술의 중심에는 기계 학습이라는 방법론이 있다.",
   "인공지능의 핵심은 데이터를 삭제하는 기술에 있다.",
   "기계 학습은 인공지능과 전혀 관련이 없는 별도의 기술이다.",
   "인공지능에서 기계 학습은 보조적인 역할에 불과하다."]);

addStep("p1",p1,ps1[3], "하이라이트된 문장에서 설명하는 기계 학습의 특징으로 가장 적절한 것은?",
  ["사람이 규칙을 지정하지 않아도 대량의 데이터에서 규칙을 자동으로 발견한다.",
   "반드시 사람이 모든 규칙을 미리 입력해야만 작동할 수 있다.",
   "데이터 없이도 스스로 규칙을 만들어 내는 것이 핵심 특징이다.",
   "오직 숫자 데이터만 처리할 수 있는 방법이다."]);

addStep("p1",p1,ps1[4], "하이라이트된 문장이 글에서 하는 역할로 가장 적절한 것은?",
  ["기계 학습의 원리를 구체적인 사례를 통해 쉽게 설명하고 있다.",
   "기계 학습의 한계를 지적하기 위한 반례를 제시하고 있다.",
   "인공지능의 역사적 발전 과정을 시간순으로 나열하고 있다.",
   "딥러닝 기술의 우수성을 강조하기 위해 비교하고 있다."]);

addStep("p1",p1,ps1[5], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["기계 학습은 대량의 데이터 속에서 숨겨진 규칙성을 찾아내는 과정이다.",
   "기계 학습은 소량의 데이터로도 완벽한 결과를 보장하는 기술이다.",
   "기계 학습은 데이터를 삭제하여 저장 공간을 확보하는 과정이다.",
   "기계 학습은 사람의 직관에만 의존하여 판단하는 방법이다."]);

addSummary("p1",p1.length, "이 문단의 중심 내용으로 가장 적절한 것은?",
  ["인공지능의 핵심인 기계 학습은 데이터에서 스스로 패턴을 발견하는 기술이다.",
   "고양이와 개를 구분하는 것은 인공지능의 유일한 활용 사례이다.",
   "인공지능 기술은 아직 실용화 단계에 이르지 못하고 있다.",
   "컴퓨터 프로그래밍은 반드시 사람이 직접 수행해야 한다."]);

// ── p2 ──
addStep("p2",p2,ps2[0], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["기계 학습의 대표적 방식으로 지도 학습과 비지도 학습이 있다.",
   "기계 학습에는 오직 한 가지 방식만 존재한다.",
   "지도 학습과 비지도 학습은 기계 학습과 무관한 개념이다.",
   "딥러닝이 기계 학습의 유일한 방식이다."]);

addStep("p2",p2,ps2[1], "하이라이트된 문장에서 설명하는 지도 학습의 특징으로 가장 적절한 것은?",
  ["정답이 표시된 데이터를 통해 입력과 출력의 관계를 학습하는 방식이다.",
   "정답 없이 데이터의 유사성만 스스로 파악하는 방식이다.",
   "컴퓨터가 자체적으로 데이터를 생성하여 학습하는 방식이다.",
   "인간의 뇌 구조를 본뜬 신경망을 활용하는 방식이다."]);

addStep("p2",p2,ps2[2], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["이메일의 스팸 자동 분류는 지도 학습을 활용한 대표적 사례이다.",
   "이메일의 스팸 분류는 비지도 학습의 대표적 사례이다.",
   "이메일의 스팸 분류는 딥러닝으로만 가능한 작업이다.",
   "이메일의 스팸 분류는 인공지능으로는 불가능한 작업이다."]);

addStep("p2",p2,ps2[3], "하이라이트된 문장에서 설명하는 비지도 학습의 특징으로 가장 적절한 것은?",
  ["정답 없이 데이터 자체의 구조와 유사성을 스스로 분석하는 방식이다.",
   "정답이 포함된 데이터를 통해 분류 규칙을 학습하는 방식이다.",
   "인간이 직접 데이터를 분류한 후 그 결과를 저장하는 방식이다.",
   "오직 텍스트 데이터에만 적용할 수 있는 제한적 방식이다."]);

addStep("p2",p2,ps2[4], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["온라인 쇼핑몰의 맞춤형 추천 시스템은 비지도 학습의 활용 사례이다.",
   "온라인 쇼핑몰의 추천 시스템은 지도 학습의 대표적 사례이다.",
   "온라인 쇼핑몰에서는 인공지능 기술을 전혀 사용하지 않고 있다.",
   "비슷한 취향의 고객을 묶는 것은 오직 사람만이 할 수 있다."]);

addSummary("p2",p2.length, "이 문단의 중심 내용으로 가장 적절한 것은?",
  ["기계 학습은 정답 제공 여부에 따라 지도 학습과 비지도 학습으로 구분된다.",
   "지도 학습은 비지도 학습보다 항상 더 우수한 결과를 낸다.",
   "온라인 쇼핑몰은 오직 지도 학습만을 활용하고 있다.",
   "이메일의 스팸 분류는 비지도 학습의 대표적 사례이다."]);

// ── p3 ──
addStep("p3",p3,ps3[0], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["딥러닝은 최근 기계 학습 분야에서 가장 큰 주목을 받는 기술이다.",
   "딥러닝은 기계 학습과 완전히 다른 별개의 기술 분야이다.",
   "딥러닝은 이미 오래전에 개발되어 현재는 관심이 사라진 기술이다.",
   "딥러닝은 지도 학습과 비지도 학습을 합친 것을 의미한다."]);

addStep("p3",p3,ps3[1], "하이라이트된 문장에서 설명하는 딥러닝의 구조적 특징으로 가장 적절한 것은?",
  ["인간 뇌의 신경 세포 연결을 모방한 인공 신경망을 여러 겹으로 쌓은 기술이다.",
   "하나의 단순한 계산 장치로만 구성된 기술이다.",
   "데이터를 저장하기 위한 대용량 저장소를 활용하는 기술이다.",
   "인간이 직접 판단 기준을 입력해야 하는 기술이다."]);

addStep("p3",p3,ps3[2], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["신경망의 층이 많을수록 더 세밀하고 정교한 판단이 가능해진다.",
   "신경망의 층이 많을수록 판단 능력이 오히려 크게 떨어진다.",
   "신경망의 층 수는 판단의 정확도에 아무런 영향을 주지 않는다.",
   "신경망은 반드시 단일 층으로만 구성되어야 효과적이다."]);

addStep("p3",p3,ps3[3], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["딥러닝 덕분에 음성 인식, 자동 번역, 의료 영상 분석 등에서 획기적 성과가 나타났다.",
   "딥러닝 기술은 자동 번역 분야에서만 활용되고 있다.",
   "음성 인식 기술은 딥러닝과 무관하게 발전하였다.",
   "의료 영상 분석은 아직 인공지능이 적용되지 않는 분야이다."]);

addStep("p3",p3,ps3[4], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["딥러닝에도 앞으로 극복해야 할 과제가 남아 있다.",
   "딥러닝은 완벽한 기술이므로 아무런 한계가 없다.",
   "딥러닝의 한계는 이미 모두 해결되었다.",
   "딥러닝은 다른 기술보다 항상 우수한 결과를 보장한다."]);

addStep("p3",p3,ps3[5], "하이라이트된 문장에서 언급하는 딥러닝의 구체적 한계로 가장 적절한 것은?",
  ["대량의 데이터와 높은 컴퓨팅 성능이 필요하고 판단 근거의 설명이 어렵다.",
   "학습 속도가 너무 빨라서 결과를 검증할 시간이 부족하다.",
   "데이터 없이도 학습이 가능하지만 정확도가 낮다는 것이다.",
   "오직 이미지 데이터만 처리할 수 있어 활용 범위가 매우 좁다."]);

addStep("p3",p3,ps3[6], "하이라이트된 문장의 내용으로 알맞은 것은?",
  ["딥러닝의 한계를 극복하기 위해 설명 가능한 인공지능 연구가 활발히 진행 중이다.",
   "딥러닝의 한계를 극복하려는 시도는 아직 시작조차 되지 않았다.",
   "설명 가능한 인공지능은 딥러닝과 전혀 관계가 없는 기술이다.",
   "인공지능 연구는 한계에 부딪혀 더 이상 진행되고 있지 않다."]);

addSummary("p3",p3.length, "이 문단의 중심 내용으로 가장 적절한 것은?",
  ["딥러닝은 다양한 분야에서 성과를 내고 있지만 한계도 있어 후속 연구가 이루어지고 있다.",
   "딥러닝은 한계 없이 완벽한 기술이므로 추가적인 연구가 필요하지 않다.",
   "음성 인식과 자동 번역은 딥러닝 없이도 충분히 구현 가능한 기술이다.",
   "인공 신경망의 층 수를 줄이는 것이 딥러닝 발전의 핵심적인 방향이다."]);

// ── 복기 카드 (8개) ──
const fullText = p1 + p2 + p3;
const cardLen = Math.ceil(fullText.length / 8);
const cards = [];
for (let i = 0; i < 8; i++) {
  cards.push({ id: `c${i+1}`, text: fullText.substring(i*cardLen, Math.min((i+1)*cardLen, fullText.length)) });
}
const recall = { cards, correctOrder: cards.map(c=>c.id), seedPenalty: 1 };

// ── 확인 문항 (7개) ──
const confirm = { questions: [] };
let qc = 1;
function addQ(pId, pText, target, prompt) {
  const r = findRange(pText, target);
  confirm.questions.push({ id:`q${qc++}`, prompt,
    answerRanges:[{paragraphId:pId,...r}],
    scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:"ANY" });
}

addQ("p1",p1,"인간의 사고 능력을 모방하여 스스로 학습하고 판단하는 컴퓨터 시스템",
  "인공지능이란 무엇을 모방하여 만든 시스템인가요?");
addQ("p1",p1,"사람이 규칙을 정해 주지 않아도 컴퓨터가 대량의 데이터를 분석하여 스스로 규칙을 발견하는 기술",
  "기계 학습의 핵심 원리는 무엇인가요?");
addQ("p2",p2,"정답이 표시된 데이터를 컴퓨터에 제공하여 입력과 출력의 관계를 학습하도록 하는 방식",
  "지도 학습은 어떤 방식으로 이루어지나요?");
addQ("p2",p2,"정답 없이 컴퓨터가 데이터 자체의 구조와 유사성을 스스로 분석하여 의미 있는 집단으로 분류하는 방식",
  "비지도 학습은 지도 학습과 어떤 점에서 다른가요?");
addQ("p3",p3,"인간 뇌의 신경 세포 연결 구조를 본뜬 인공 신경망을 여러 겹으로 깊게 쌓아 올려 복잡한 데이터를 처리하는 기술",
  "딥러닝은 어떤 구조를 활용하여 데이터를 처리하나요?");
addQ("p3",p3,"학습에 막대한 양의 데이터와 높은 컴퓨팅 성능이 요구되며, 컴퓨터가 특정 결론에 도달한 이유를 사람이 이해하기 어렵다는 점",
  "딥러닝의 대표적인 한계점은 무엇인가요?");
addQ("p3",p3,"인공지능의 판단 근거를 사람이 이해할 수 있도록 설명해 주는 설명 가능한 인공지능에 대한 연구가 활발하게 이루어지고 있다",
  "딥러닝의 한계를 극복하기 위해 어떤 연구가 진행되고 있나요?");

// ── 출력 ──
const content = {
  contentId:"dr-r1-007", contentType:"DAILY_READING", version:1, status:"PUBLISHED",
  title:"일일 독해(러셀 1) Day 7 비문학", description:"일일 독해 - 정독·복기·확인",
  targetLevel:"RUSSELL_1", schoolGradeRange:{min:7,max:8},
  area:"READING", subArea:"NONFICTION", competencies:["READING"], tags:["daily"],
  access:{mode:"FREE"}, seedReward:{seedType:"WHEAT",count:3,multiplier:1},
  timeLimitSec:300, assets:{},
  payload:{ passage:{format:"TEXT",paragraphs}, intensive:{timeline}, recall, confirm }
};

const batchItem = { content_type:"DAILY_READING", level_id:"RUSSELL_1", area:"READING",
  sub_area:"NONFICTION", day_index:7, module_key:"reading_training",
  schema_version:"1.0", content };

const staticPath = path.join(__dirname,'..','frontend','public','daily-reading','russell1','007.json');
fs.writeFileSync(staticPath, JSON.stringify(content,null,2), 'utf8');

const batchPath = path.join(__dirname,'..','generated','daily-batch-reading-russell1.json');
const batch = JSON.parse(fs.readFileSync(batchPath,'utf8'));
batch.items[6] = batchItem;
fs.writeFileSync(batchPath, JSON.stringify(batch,null,2), 'utf8');

console.log(`static: ${staticPath}`);
console.log(`batch: items[6] 업데이트`);
console.log(`타임라인:${timeline.length} 복기:${cards.length} 확인:${confirm.questions.length}`);
console.log(`=== Day 7 완료 ===`);
