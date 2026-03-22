// Day 9: NONFICTION (비문학 - 과학기술: 인공지능과 머신러닝)
const fs = require('fs');
const path = require('path');

const paragraphs = [
  { id: "p1", text: "인공지능이란 인간의 학습, 추론, 판단 등과 같은 지적 능력을 컴퓨터 프로그램으로 구현한 기술을 말한다. 인공지능에 관한 연구는 1950년대에 본격적으로 시작되었으나, 당시에는 컴퓨터의 연산 능력이 크게 부족하여 실용적인 성과를 거두기 어려웠다. 이후 반도체 기술의 발전으로 컴퓨터 성능이 비약적으로 향상되고 인터넷을 통해 방대한 양의 데이터를 수집할 수 있게 되면서 인공지능 기술은 급격한 전환점을 맞이하였다. 특히 2010년대 이후 딥러닝이라 불리는 기술이 등장하면서 인공지능은 이미지 인식, 자연어 처리, 자율 주행 등 다양한 분야에서 인간에 버금가는 놀라운 성능을 보여 주기 시작했다." },
  { id: "p2", text: "인공지능의 핵심 기술 가운데 하나가 머신러닝, 즉 기계 학습이다. 기계 학습이란 컴퓨터가 명시적인 프로그래밍 없이 데이터를 통해 스스로 학습하고 성능을 개선해 나가는 방법을 뜻한다. 전통적인 프로그래밍에서는 개발자가 모든 규칙을 일일이 코드로 작성해야 했지만, 기계 학습에서는 대량의 데이터를 입력하면 컴퓨터가 스스로 패턴을 찾아내어 규칙을 도출한다. 예를 들어 수천 장의 고양이 사진과 개 사진을 학습한 기계 학습 모델은 새로운 사진을 보고 그것이 고양이인지 개인지를 스스로 판별할 수 있게 된다." },
  { id: "p3", text: "기계 학습의 방법은 크게 지도 학습, 비지도 학습, 강화 학습의 세 가지로 나뉜다. 지도 학습은 정답이 표시된 데이터를 활용하여 입력값과 출력값 사이의 관계를 학습하는 방식이다. 비지도 학습은 정답 없이 데이터 자체의 구조나 패턴을 스스로 파악하는 방식으로, 고객의 구매 패턴을 유형별로 분류하는 작업 등에 활용된다. 강화 학습은 시행착오를 반복하며 최적의 행동 전략을 스스로 찾아가는 방식인데, 바둑 인공지능인 알파고가 대표적인 사례에 해당한다." },
  { id: "p4", text: "인공지능 기술은 의료, 교육, 교통, 금융 등 사회 전반에 걸쳐 혁신적인 변화를 이끌고 있다. 의료 분야에서는 엑스레이나 CT 영상을 분석하여 질병을 조기에 발견하는 데 인공지능이 활용되고 있으며, 교육 분야에서는 학생 개개인의 학습 수준에 맞춘 맞춤형 교육 콘텐츠를 제공하는 데 쓰이고 있다. 그러나 인공지능의 발전은 일자리 감소, 개인 정보 침해, 알고리즘의 편향성 등 여러 사회적 문제도 함께 야기하고 있다. 따라서 인공지능 기술의 혜택을 최대화하면서도 부작용을 최소화할 수 있는 사회적 합의와 제도적 장치를 마련하는 것이 무엇보다 중요한 과제로 떠오르고 있다." }
];

const totalLen = paragraphs.reduce((s,p)=>s+p.text.length, 0);
console.log("총 글자수:", totalLen);

function splitSentences(text) {
  const results = []; let cur = "";
  for (let i = 0; i < text.length; i++) {
    cur += text[i];
    if ((text[i]==='.'||text[i]==='!'||text[i]==='?') && (i===text.length-1||text[i+1]===' '||text[i+1]==='\n')) { results.push(cur.trim()); cur=""; }
  }
  if (cur.trim()) results.push(cur.trim());
  return results;
}
function findRange(t,s){const st=t.indexOf(s);if(st===-1){console.error("NOT FOUND:",s.substring(0,40));process.exit(1);}return{start:st,end:st+s.length-1};}

const allS={};for(const p of paragraphs){allS[p.id]=splitSentences(p.text);console.log(`${p.id}: ${allS[p.id].length}문장`);}

const qMap = {
  p1: [
    { prompt: "인공지능의 정의로 알맞은 것은?", A: "인간의 학습, 추론, 판단 등의 지적 능력을 컴퓨터로 구현한 기술이다", B: "인간의 감정을 인식하는 센서 기술이다", C: "컴퓨터 하드웨어를 소형화하는 기술이다", D: "인터넷 통신 속도를 높이는 기술이다" },
    { prompt: "1950년대 인공지능 연구의 한계로 알맞은 것은?", A: "컴퓨터의 연산 능력이 크게 부족하여 실용적 성과를 거두기 어려웠다", B: "연구자의 수가 너무 적어 진행이 불가능했다", C: "정부의 규제로 연구가 금지되었다", D: "인공지능 개념 자체가 아직 정립되지 않았다" },
    { prompt: "인공지능 기술이 전환점을 맞이하게 된 배경으로 알맞은 것은?", A: "반도체 기술 발전과 인터넷을 통한 방대한 데이터 수집이 가능해졌다", B: "정부가 대규모 투자를 시작했다", C: "인간 두뇌의 구조가 완전히 밝혀졌다", D: "양자 컴퓨터가 상용화되었다" },
    { prompt: "2010년대 이후 인공지능의 발전에 대한 설명으로 알맞은 것은?", A: "딥러닝이 등장하면서 이미지 인식 등에서 인간에 버금가는 놀라운 성능을 보였다", B: "인공지능이 인간을 완전히 대체하기 시작했다", C: "인공지능 연구가 사실상 중단되었다", D: "딥러닝이 실패하여 다른 기술로 전환되었다" },
  ],
  p2: [
    { prompt: "머신러닝의 다른 이름으로 알맞은 것은?", A: "기계 학습이다", B: "자동 프로그래밍이다", C: "데이터 마이닝이다", D: "클라우드 컴퓨팅이다" },
    { prompt: "기계 학습의 정의로 알맞은 것은?", A: "명시적 프로그래밍 없이 데이터를 통해 스스로 학습하고 성능을 개선하는 방법이다", B: "개발자가 모든 규칙을 코드로 작성하는 방법이다", C: "컴퓨터의 하드웨어를 자동으로 업그레이드하는 기술이다", D: "인간의 두뇌를 컴퓨터에 직접 연결하는 기술이다" },
    { prompt: "전통적 프로그래밍과 기계 학습의 차이로 알맞은 것은?", A: "전통적 프로그래밍은 규칙을 일일이 코드로 작성하고 기계 학습은 데이터에서 패턴을 찾는다", B: "전통적 프로그래밍이 더 정확하고 기계 학습은 항상 오류가 많다", C: "둘 사이에 본질적인 차이는 없다", D: "기계 학습은 데이터 없이 작동하고 전통적 프로그래밍은 데이터가 필요하다" },
    { prompt: "고양이와 개 사진 예시가 설명하는 내용으로 알맞은 것은?", A: "대량의 데이터를 학습하면 새로운 사진을 스스로 판별할 수 있게 된다", B: "컴퓨터가 사진을 촬영하는 방법을 배운다", C: "사진의 해상도를 높이는 기술을 학습한다", D: "고양이와 개의 생물학적 차이를 분석한다" },
  ],
  p3: [
    { prompt: "기계 학습의 세 가지 방법으로 알맞은 것은?", A: "지도 학습, 비지도 학습, 강화 학습이다", B: "기초 학습, 심화 학습, 응용 학습이다", C: "정적 학습, 동적 학습, 반복 학습이다", D: "개별 학습, 협동 학습, 자율 학습이다" },
    { prompt: "지도 학습의 특징으로 알맞은 것은?", A: "정답이 표시된 데이터를 활용하여 입력값과 출력값 사이의 관계를 학습한다", B: "정답 없이 데이터의 구조를 파악한다", C: "시행착오를 통해 최적의 전략을 찾는다", D: "인간의 감독 없이 완전히 자율적으로 학습한다" },
    { prompt: "비지도 학습의 활용 예시로 알맞은 것은?", A: "고객의 구매 패턴을 유형별로 분류하는 작업 등에 활용된다", B: "정답이 있는 시험 문제를 채점하는 데 활용된다", C: "자율 주행 자동차의 경로를 결정하는 데 쓰인다", D: "바둑 대국에서 최적의 수를 찾는 데 활용된다" },
    { prompt: "강화 학습의 대표적 사례로 알맞은 것은?", A: "바둑 인공지능인 알파고가 대표적인 사례이다", B: "고객 구매 패턴 분류가 대표적 사례이다", C: "이미지 인식 프로그램이 대표적 사례이다", D: "번역 프로그램이 대표적 사례이다" },
  ],
  p4: [
    { prompt: "인공지능이 변화를 이끌고 있는 분야로 알맞은 것은?", A: "의료, 교육, 교통, 금융 등 사회 전반이다", B: "오직 제조업 분야에서만 활용된다", C: "예술과 문학 분야에서만 쓰인다", D: "군사 분야에서만 적용되고 있다" },
    { prompt: "의료 분야에서의 인공지능 활용으로 알맞은 것은?", A: "엑스레이나 CT 영상을 분석하여 질병을 조기에 발견하는 데 활용된다", B: "환자의 감정을 읽어 심리 상담을 진행한다", C: "수술 전 과정을 인공지능이 혼자 수행한다", D: "의사 면허 시험을 인공지능이 대신 본다" },
    { prompt: "인공지능 발전이 야기하는 사회적 문제로 알맞은 것은?", A: "일자리 감소, 개인 정보 침해, 알고리즘의 편향성 등이다", B: "전력 소비 감소로 인한 에너지 산업 위축이다", C: "인간 관계의 질적 향상에 따른 갈등 해소이다", D: "교육 수준이 지나치게 높아지는 문제이다" },
    { prompt: "인공지능 기술의 과제로 제시된 것은?", A: "혜택을 최대화하면서 부작용을 최소화할 사회적 합의와 제도적 장치 마련이다", B: "인공지능 연구를 전면 중단하는 것이다", C: "인공지능을 특정 분야에만 제한하여 사용하는 것이다", D: "인공지능 기술을 일부 국가에서만 개발하도록 하는 것이다" },
  ]
};

const centralQ = {
  p1: { prompt: "[문단 1] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "인공지능의 정의와 발전 과정, 딥러닝 등장 이후의 성과", B: "반도체 기술의 역사와 발전 과정 설명", C: "1950년대 컴퓨터 과학의 주요 업적 소개", D: "자율 주행 자동차의 작동 원리 설명" },
  p2: { prompt: "[문단 2] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "기계 학습의 정의와 전통적 프로그래밍과의 차이점", B: "컴퓨터 프로그래밍 언어의 종류와 특징", C: "고양이와 개의 생물학적 분류 체계", D: "데이터 수집 방법과 저장 기술의 발전" },
  p3: { prompt: "[문단 3] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "기계 학습의 세 가지 유형과 각각의 특징 및 사례", B: "알파고의 개발 과정과 바둑 대국 결과", C: "데이터 분석의 통계적 방법론 소개", D: "인공지능의 윤리적 문제점 논의" },
  p4: { prompt: "[문단 4] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "인공지능의 다양한 활용 분야와 사회적 문제 및 해결 과제", B: "의료 기술의 발전 역사와 미래 전망", C: "교육 분야에서의 디지털 전환 사례 나열", D: "개인 정보 보호법의 주요 내용과 적용 범위" },
};

const timeline=[];let sn=1;
for(const p of paragraphs){
  const sents=allS[p.id],qs=qMap[p.id];
  if(sents.length!==qs.length){console.error(`${p.id}: 문장(${sents.length}) != 문항(${qs.length})`);sents.forEach((s,i)=>console.log(`  [${i}] ${s}`));process.exit(1);}
  for(let i=0;i<sents.length;i++){const r=findRange(p.text,sents[i]);timeline.push({stepId:`s${sn++}`,highlight:{ranges:[{paragraphId:p.id,start:r.start,end:r.end}]},question:{prompt:qs[i].prompt,choices:[{id:"A",text:qs[i].A},{id:"B",text:qs[i].B},{id:"C",text:qs[i].C},{id:"D",text:qs[i].D}],answerId:"A",scoring:{correctDeltaSec:20,wrongDeltaSec:-40,eliminateWrongChoice:true}}});}
  const cq=centralQ[p.id];timeline.push({stepId:`s${sn++}`,highlight:{ranges:[{paragraphId:p.id,start:0,end:p.text.length-1}]},question:{prompt:cq.prompt,choices:[{id:"A",text:cq.A},{id:"B",text:cq.B},{id:"C",text:cq.C},{id:"D",text:cq.D}],answerId:"A",scoring:{correctDeltaSec:20,wrongDeltaSec:-40,eliminateWrongChoice:true}}});
}

const recallCards=[
  {id:"c1",front:"인공지능 연구가 시작된 시기는?",back:"1950년대"},
  {id:"c2",front:"2010년대 이후 등장한 핵심 기술은?",back:"딥러닝"},
  {id:"c3",front:"머신러닝의 한국어 명칭은?",back:"기계 학습"},
  {id:"c4",front:"전통적 프로그래밍과 기계 학습의 차이는?",back:"기계 학습은 데이터에서 스스로 패턴을 찾아낸다"},
  {id:"c5",front:"기계 학습의 세 가지 유형은?",back:"지도 학습, 비지도 학습, 강화 학습"},
  {id:"c6",front:"강화 학습의 대표적 사례는?",back:"알파고"},
  {id:"c7",front:"인공지능이 야기하는 사회적 문제는?",back:"일자리 감소, 개인 정보 침해, 알고리즘 편향성"},
  {id:"c8",front:"인공지능의 중요한 과제는?",back:"혜택 최대화와 부작용 최소화를 위한 사회적 합의와 제도적 장치"},
];

const confirmQs=[
  {qId:"q1",prompt:"인공지능의 정의는?",acceptedAnswer:["인간의 학습, 추론, 판단 등 지적 능력을 컴퓨터로 구현한 기술","지적 능력을 컴퓨터로 구현"]},
  {qId:"q2",prompt:"2010년대 이후 등장한 핵심 기술은?",acceptedAnswer:["딥러닝"]},
  {qId:"q3",prompt:"기계 학습이란?",acceptedAnswer:["데이터를 통해 스스로 학습하고 성능을 개선하는 방법","명시적 프로그래밍 없이 학습"]},
  {qId:"q4",prompt:"기계 학습의 세 가지 유형은?",acceptedAnswer:["지도 학습, 비지도 학습, 강화 학습"]},
  {qId:"q5",prompt:"강화 학습의 대표적 사례는?",acceptedAnswer:["알파고"]},
  {qId:"q6",prompt:"인공지능이 야기하는 사회적 문제는?",acceptedAnswer:["일자리 감소","개인 정보 침해","알고리즘 편향성"]},
  {qId:"q7",prompt:"인공지능 기술의 중요한 과제는?",acceptedAnswer:["사회적 합의와 제도적 장치 마련","혜택 최대화와 부작용 최소화"]},
];

const sc={
  contentId:"dr-r2-009",contentType:"DAILY_READING",version:1,status:"PUBLISHED",
  title:"일일 독해(러셀 2) Day 9 비문학",description:"일일 독해 - 정독·복기·확인",
  targetLevel:"RUSSELL_2",schoolGradeRange:{min:8,max:9},
  area:"READING",subArea:"NONFICTION",competencies:["READING"],tags:["daily"],
  access:{mode:"FREE"},seedReward:{seedType:"WHEAT",count:3,multiplier:1},
  timeLimitSec:300,assets:{},
  payload:{
    passage:{format:"TEXT",paragraphs},
    intensive:{timeline},
    recall:{cards:recallCards,correctOrder:recallCards.map(c=>c.id),seedPenalty:1},
    confirm:{questions:confirmQs.map(q=>({qId:q.qId,prompt:q.prompt,acceptedAnswer:q.acceptedAnswer,answerMatchMode:"ANY",revealOnWrong:true,scoring:{correctDeltaSec:30,wrongDeltaSec:-45}}))}
  }
};

const bi={content_type:"DAILY_READING",level_id:"RUSSELL_2",area:"READING",sub_area:"NONFICTION",day_index:9,module_key:"reading_training",schema_version:"1.0",content:sc};

fs.writeFileSync(path.join(__dirname,'..','frontend','public','daily-reading','russell2','009.json'),JSON.stringify(sc,null,2),'utf8');
console.log("009.json 저장 완료");
const bp=path.join(__dirname,'..','generated','daily-batch-reading-russell2.json');
const batch=JSON.parse(fs.readFileSync(bp,'utf8'));
batch.items[8]=bi;
fs.writeFileSync(bp,JSON.stringify(batch,null,2),'utf8');
console.log("배치 items[8] 교체 완료");

console.log("\n=== Day 9 검증 ===");
console.log("총 글자수:",totalLen,totalLen>=1150&&totalLen<=1250?"OK":"WARN");
console.log("타임라인:",timeline.length);console.log("복기:",recallCards.length);console.log("확인:",confirmQs.length);
let err=0;
for(const st of timeline){for(const r of st.highlight.ranges){const po=paragraphs.find(p=>p.id===r.paragraphId);if(r.start<0||r.end>=po.text.length||r.start>r.end){console.error(`범위오류 ${st.stepId}`);err++;}}if(st.question.answerId!=="A"){console.error(`answerId오류 ${st.stepId}`);err++;}}
console.log(err===0?"모든 검증 통과!":`오류 ${err}건`);
