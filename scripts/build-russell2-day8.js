// Day 8: LITERATURE (문학 - 창작 수필)
const fs = require('fs');
const path = require('path');

const paragraphs = [
  { id: "p1", text: "봄이 오면 어김없이 떠오르는 기억이 하나 있다. 초등학교 삼 학년 때, 학교 뒤편 화단에서 반 아이들과 함께 봉선화 씨앗을 심었던 봄날이다. 담임 선생님은 작은 화분을 하나씩 나누어 주시며 \"씨앗 하나에도 소중한 생명이 담겨 있으니 정성껏 돌보렴.\"이라고 말씀하셨다. 나는 화분에 내 이름을 또박또박 적고 해가 잘 드는 교실 창가에 조심스럽게 놓아두었다. 그때부터 매일 아침 등교하자마자 물을 주며 싹이 트기를 기다리는 것이 나의 가장 큰 즐거움이 되었다." },
  { id: "p2", text: "일주일쯤 지나자 검은 흙 사이로 연두색 떡잎이 작게 고개를 내밀었다. 그 여린 새싹을 발견했을 때의 가슴 벅찬 설렘은 지금도 생생하다. 나는 쉬는 시간마다 화분 앞에 쪼그려 앉아 새싹이 자라는 모습을 관찰했다. 줄기가 천천히 위를 향해 뻗어 나가고, 이파리가 하나둘 펼쳐지는 과정이 마치 작은 기적을 목격하는 것만 같았다. 옆자리 친구 민수는 물을 너무 많이 줘서 화분 속 흙이 질척해졌고, 결국 그의 봉선화는 뿌리가 썩어 시들고 말았다. 민수가 풀이 죽어 고개를 숙이고 있자 나는 내 화분에서 가장 튼튼한 줄기 하나를 꺾어 민수의 화분에 옮겨 심어 주었다." },
  { id: "p3", text: "여름이 되자 봉선화는 빨갛고 분홍빛이 감도는 꽃을 활짝 피워 냈다. 선생님은 우리에게 꽃잎으로 손톱에 물을 들이는 방법을 자세히 알려 주셨고, 여자아이들은 저마다 손톱에 봉선화 물을 곱게 들이며 즐거워했다. 나도 엄마에게 자랑하고 싶어서 꽃잎 몇 장을 비닐봉지에 소중히 담아 집으로 가져갔다. 엄마는 꽃잎을 한참 들여다보시더니 어린 시절 본인도 친구들과 똑같이 봉선화 물을 들였다며 반갑게 환하게 웃으셨다. 그날 저녁, 엄마와 마루에 나란히 앉아 함께 손톱에 봉선화 물을 들이던 시간은 어린 내게 세상에서 가장 따뜻한 순간이었다." },
  { id: "p4", text: "가을이 되어 봉선화가 시들자 선생님은 씨앗을 거두어 내년 봄에 다시 심자고 하셨다. 마른 꼬투리를 살짝 건드리니 까만 씨앗들이 톡톡 소리를 내며 튀어 나왔다. 나는 그 씨앗을 작은 봉투에 담아 필통 속 깊숙한 곳에 넣어 두었다. 하지만 그해 겨울 이사와 전학이 갑작스레 이어지면서 그 봉투는 어느새 사라지고 말았다. 지금 생각해 보면 씨앗은 사라졌어도 그때의 기억만큼은 내 마음속에 단단히 뿌리를 내리고 있다. 봄마다 화단에 활짝 핀 봉선화를 볼 때면 민수에게 줄기를 나누어 주던 날, 엄마와 나란히 손톱에 물을 들이던 저녁이 바로 어제 일처럼 떠오른다. 작은 씨앗 하나가 내게 남긴 것은 꽃이 아니라 사람과 사람 사이를 잇는 따스한 온기였던 것이다." }
];

const totalLen = paragraphs.reduce((s,p)=>s+p.text.length, 0);
console.log("총 글자수:", totalLen);

function splitSentences(text) {
  const results = []; let cur = "";
  for (let i = 0; i < text.length; i++) {
    cur += text[i];
    if ((text[i]==='.'||text[i]==='!'||text[i]==='?') && (i===text.length-1||text[i+1]===' '||text[i+1]==='\n')) { results.push(cur.trim()); cur = ""; }
  }
  if (cur.trim()) results.push(cur.trim());
  return results;
}
function findRange(t,s) { const st=t.indexOf(s); if(st===-1){console.error("NOT FOUND:",s.substring(0,40));process.exit(1);} return {start:st,end:st+s.length-1}; }

const allS = {}; for (const p of paragraphs) { allS[p.id] = splitSentences(p.text); console.log(`${p.id}: ${allS[p.id].length}문장`); }

const qMap = {
  p1: [
    { prompt: "봄이 오면 화자가 떠올리는 기억의 시기로 알맞은 것은?", A: "초등학교 삼 학년 때이다", B: "중학교 입학 무렵이다", C: "유치원 졸업 직후이다", D: "고등학교 시절이다" },
    { prompt: "반 아이들이 화단에서 한 일로 알맞은 것은?", A: "봉선화 씨앗을 함께 심었다", B: "나무를 심고 이름표를 달았다", C: "잔디를 깔고 물을 주었다", D: "꽃을 꺾어 교실에 장식했다" },
    { prompt: "담임 선생님이 화분을 나눠 주며 한 말의 내용으로 알맞은 것은?", A: "씨앗 하나에도 생명이 담겨 있으니 소중히 돌보라고 하셨다", B: "화분을 집에 가져가 부모님께 보여 드리라고 하셨다", C: "씨앗이 싹트면 점수를 주겠다고 하셨다", D: "반에서 가장 잘 키운 사람에게 상을 주겠다고 하셨다" },
    { prompt: "화자가 화분을 놓아둔 장소로 알맞은 것은?", A: "해가 잘 드는 창가에 놓아두었다", B: "교실 뒤쪽 선반에 놓아두었다", C: "집 베란다에 가져가 놓았다", D: "학교 운동장 옆에 놓아두었다" },
    { prompt: "당시 화자의 가장 큰 즐거움으로 알맞은 것은?", A: "매일 아침 물을 주며 싹이 트기를 기다리는 것이었다", B: "친구들과 화분의 크기를 비교하는 것이었다", C: "선생님께 칭찬을 받는 것이었다", D: "엄마에게 화분 이야기를 하는 것이었다" },
  ],
  p2: [
    { prompt: "일주일 후 화분에서 나타난 변화로 알맞은 것은?", A: "검은 흙 사이로 연두색 떡잎이 고개를 내밀었다", B: "꽃봉오리가 맺히기 시작했다", C: "흙이 갈라지며 뿌리가 보였다", D: "잡초가 함께 자라나기 시작했다" },
    { prompt: "새싹을 발견했을 때 화자의 감정으로 알맞은 것은?", A: "설렘이 지금도 생생하다", B: "별다른 감흥이 없었다", C: "실망스러웠다", D: "불안감을 느꼈다" },
    { prompt: "화자가 쉬는 시간마다 한 행동으로 알맞은 것은?", A: "화분 앞에 쪼그려 앉아 새싹이 자라는 모습을 관찰했다", B: "운동장에서 축구를 했다", C: "도서관에서 식물 도감을 읽었다", D: "친구들에게 식물 키우는 법을 가르쳤다" },
    { prompt: "식물이 자라는 과정에 대한 화자의 느낌으로 알맞은 것은?", A: "작은 기적을 목격하는 것만 같았다", B: "지루하고 답답하게 느꼈다", C: "과학적 호기심이 생겼다", D: "걱정과 불안을 느꼈다" },
    { prompt: "민수의 봉선화에 무슨 일이 생겼는가?", A: "물을 너무 많이 줘서 뿌리가 썩어 시들었다", B: "벌레가 먹어서 잎이 모두 떨어졌다", C: "화분이 깨져서 흙이 쏟아졌다", D: "물을 주지 않아 말라 죽었다" },
    { prompt: "화자가 민수에게 한 행동으로 알맞은 것은?", A: "자기 화분에서 튼튼한 줄기를 꺾어 민수 화분에 옮겨 심어 주었다", B: "선생님께 새 씨앗을 달라고 부탁했다", C: "자기 화분을 통째로 민수에게 주었다", D: "민수에게 물 주는 방법을 알려 주었다" },
  ],
  p3: [
    { prompt: "여름이 되자 봉선화에 나타난 변화로 알맞은 것은?", A: "빨갛고 분홍빛인 꽃을 활짝 피워 냈다", B: "잎이 노랗게 변하기 시작했다", C: "줄기만 길어지고 꽃은 피지 않았다", D: "열매가 맺히기 시작했다" },
    { prompt: "선생님이 알려 준 것으로 알맞은 것은?", A: "꽃물을 들이는 방법을 알려 주셨다", B: "꽃을 말려 표본을 만드는 법을 알려 주셨다", C: "꽃을 이용한 요리법을 알려 주셨다", D: "꽃의 학명과 분류를 가르쳐 주셨다" },
    { prompt: "화자가 꽃잎을 집에 가져간 이유로 알맞은 것은?", A: "엄마에게 자랑하고 싶어서 가져갔다", B: "숙제로 가져가야 했다", C: "꽃잎으로 그림을 그리려고 가져갔다", D: "꽃이 시들어서 버리려고 가져갔다" },
    { prompt: "엄마가 꽃잎을 보고 보인 반응으로 알맞은 것은?", A: "어린 시절 본인도 봉선화 물을 들였다며 환하게 웃으셨다", B: "꽃잎이 지저분하다며 버리라고 하셨다", C: "꽃을 화병에 꽂아 두자고 하셨다", D: "내일 학교에 돌려보내라고 하셨다" },
    { prompt: "그날 저녁의 경험에 대한 화자의 느낌으로 알맞은 것은?", A: "세상에서 가장 따뜻한 순간이었다", B: "지루하고 재미없는 시간이었다", C: "엄마와 다투게 된 계기였다", D: "빨리 끝내고 싶은 시간이었다" },
  ],
  p4: [
    { prompt: "가을에 선생님이 제안한 일로 알맞은 것은?", A: "씨앗을 거두어 내년에 다시 심자고 하셨다", B: "화분을 집에 가져가 계속 키우자고 하셨다", C: "시든 봉선화를 뽑아 버리자고 하셨다", D: "다른 꽃을 새로 심자고 하셨다" },
    { prompt: "마른 꼬투리를 건드렸을 때 일어난 일로 알맞은 것은?", A: "까만 씨앗들이 톡톡 튀어 나왔다", B: "꽃잎이 바람에 날려 갔다", C: "벌레가 기어 나왔다", D: "흙가루가 떨어졌다" },
    { prompt: "화자가 씨앗을 보관한 곳으로 알맞은 것은?", A: "작은 봉투에 담아 필통 속에 넣어 두었다", B: "책상 서랍 안에 넣어 두었다", C: "교실 사물함에 보관했다", D: "집 냉장고에 넣어 두었다" },
    { prompt: "씨앗 봉투가 사라진 이유로 알맞은 것은?", A: "이사와 전학이 이어지면서 사라졌다", B: "실수로 쓰레기통에 버렸다", C: "친구에게 빌려주고 돌려받지 못했다", D: "물에 젖어 못 쓰게 되었다" },
    { prompt: "씨앗이 사라진 것에 대한 화자의 성찰로 알맞은 것은?", A: "씨앗은 사라져도 기억은 마음속에 단단히 뿌리를 내리고 있다", B: "씨앗을 잃어버려 큰 후회가 남아 있다", C: "씨앗이 사라진 것은 별로 아쉽지 않다", D: "새로운 씨앗을 구하러 다시 학교를 찾아갔다" },
    { prompt: "봄마다 화자가 떠올리는 장면으로 알맞은 것은?", A: "민수에게 줄기를 나누어 주던 날과 엄마와 물을 들이던 저녁이다", B: "선생님이 씨앗을 나눠 주시던 장면이다", C: "봉선화가 시드는 가을 풍경이다", D: "씨앗을 거두던 순간이다" },
    { prompt: "화자가 씨앗에서 얻은 것으로 알맞은 것은?", A: "꽃이 아니라 사람과 사람 사이의 온기였다", B: "식물학에 대한 전문 지식이었다", C: "학교에서 받은 상장이었다", D: "원예를 직업으로 삼겠다는 꿈이었다" },
  ]
};

const centralQ = {
  p1: { prompt: "[문단 1] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "초등학교 시절 봉선화 씨앗을 심게 된 배경과 기대감", B: "담임 선생님의 교육 철학과 수업 방식 소개", C: "화분을 관리하는 과학적 방법 설명", D: "화자가 식물에 흥미를 잃게 된 계기" },
  p2: { prompt: "[문단 2] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "봉선화가 자라나는 과정의 감동과 친구에게 나눔을 실천한 경험", B: "올바른 식물 재배법과 물 주기의 중요성 설명", C: "교실에서 식물 키우기 대회를 진행한 이야기", D: "민수와의 우정이 깨진 계기" },
  p3: { prompt: "[문단 3] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "봉선화 꽃이 피어 엄마와 함께 물을 들이며 느낀 따뜻한 행복", B: "봉선화의 색소 성분과 염색 원리 설명", C: "여자아이들만의 놀이 문화 소개", D: "엄마의 어린 시절 이야기 전반" },
  p4: { prompt: "[문단 4] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "씨앗은 사라져도 그때의 기억과 사람 사이의 온기는 남아 있다는 깨달음", B: "이사와 전학으로 인한 화자의 슬픔과 적응 과정", C: "봉선화 재배의 연간 일정과 관리 요령", D: "화자가 원예가로 성장하게 된 계기" },
};

const timeline = []; let sn = 1;
for (const p of paragraphs) {
  const sents = allS[p.id], qs = qMap[p.id];
  if (sents.length !== qs.length) { console.error(`${p.id}: 문장(${sents.length}) != 문항(${qs.length})`); sents.forEach((s,i)=>console.log(`  [${i}] ${s}`)); process.exit(1); }
  for (let i = 0; i < sents.length; i++) { const r=findRange(p.text,sents[i]); timeline.push({ stepId:`s${sn++}`, highlight:{ranges:[{paragraphId:p.id,start:r.start,end:r.end}]}, question:{prompt:qs[i].prompt,choices:[{id:"A",text:qs[i].A},{id:"B",text:qs[i].B},{id:"C",text:qs[i].C},{id:"D",text:qs[i].D}],answerId:"A",scoring:{correctDeltaSec:20,wrongDeltaSec:-40,eliminateWrongChoice:true}} }); }
  const cq=centralQ[p.id]; timeline.push({ stepId:`s${sn++}`, highlight:{ranges:[{paragraphId:p.id,start:0,end:p.text.length-1}]}, question:{prompt:cq.prompt,choices:[{id:"A",text:cq.A},{id:"B",text:cq.B},{id:"C",text:cq.C},{id:"D",text:cq.D}],answerId:"A",scoring:{correctDeltaSec:20,wrongDeltaSec:-40,eliminateWrongChoice:true}} });
}

const recallCards = [
  { id:"c1", front:"화자가 봉선화를 심은 시기는?", back:"초등학교 삼 학년 때" },
  { id:"c2", front:"선생님이 씨앗에 대해 한 말은?", back:"씨앗 하나에도 생명이 담겨 있으니 소중히 돌보렴" },
  { id:"c3", front:"새싹이 나온 시기는?", back:"일주일쯤 후" },
  { id:"c4", front:"민수의 봉선화가 시든 이유는?", back:"물을 너무 많이 줘서 뿌리가 썩었다" },
  { id:"c5", front:"여름에 봉선화 꽃의 색깔은?", back:"빨갛고 분홍빛" },
  { id:"c6", front:"엄마와 함께 한 일은?", back:"손톱에 봉선화 물을 들였다" },
  { id:"c7", front:"씨앗을 보관한 곳은?", back:"작은 봉투에 담아 필통 속" },
  { id:"c8", front:"씨앗이 화자에게 남긴 것은?", back:"사람과 사람 사이의 온기" },
];

const confirmQs = [
  { qId:"q1", prompt:"봉선화를 심은 장소는?", acceptedAnswer:["학교 화단","화단"] },
  { qId:"q2", prompt:"민수의 봉선화가 시든 이유는?", acceptedAnswer:["물을 너무 많이 줘서","뿌리가 썩어서"] },
  { qId:"q3", prompt:"화자가 민수에게 해 준 것은?", acceptedAnswer:["튼튼한 줄기를 꺾어 옮겨 심어 줌","줄기를 나누어 줌"] },
  { qId:"q4", prompt:"엄마와 함께 한 일은?", acceptedAnswer:["손톱에 봉선화 물을 들임","봉선화 물들이기"] },
  { qId:"q5", prompt:"마른 꼬투리를 건드리면 무엇이 나왔는가?", acceptedAnswer:["까만 씨앗","씨앗"] },
  { qId:"q6", prompt:"씨앗 봉투가 사라진 이유는?", acceptedAnswer:["이사와 전학이 이어지면서","이사"] },
  { qId:"q7", prompt:"작은 씨앗이 화자에게 남긴 것은?", acceptedAnswer:["사람과 사람 사이의 온기","온기"] },
];

const sc = {
  contentId:"dr-r2-008", contentType:"DAILY_READING", version:1, status:"PUBLISHED",
  title:"일일 독해(러셀 2) Day 8 문학", description:"일일 독해 - 정독·복기·확인",
  targetLevel:"RUSSELL_2", schoolGradeRange:{min:8,max:9},
  area:"READING", subArea:"LITERATURE", competencies:["READING"], tags:["daily"],
  access:{mode:"FREE"}, seedReward:{seedType:"WHEAT",count:3,multiplier:1},
  timeLimitSec:300, assets:{},
  payload:{
    passage:{format:"TEXT",paragraphs},
    intensive:{timeline},
    recall:{cards:recallCards,correctOrder:recallCards.map(c=>c.id),seedPenalty:1},
    confirm:{questions:confirmQs.map(q=>({qId:q.qId,prompt:q.prompt,acceptedAnswer:q.acceptedAnswer,answerMatchMode:"ANY",revealOnWrong:true,scoring:{correctDeltaSec:30,wrongDeltaSec:-45}}))}
  }
};

const bi={content_type:"DAILY_READING",level_id:"RUSSELL_2",area:"READING",sub_area:"LITERATURE",day_index:8,module_key:"reading_training",schema_version:"1.0",content:sc};

fs.writeFileSync(path.join(__dirname,'..','frontend','public','daily-reading','russell2','008.json'), JSON.stringify(sc,null,2), 'utf8');
console.log("008.json 저장 완료");
const bp=path.join(__dirname,'..','generated','daily-batch-reading-russell2.json');
const batch=JSON.parse(fs.readFileSync(bp,'utf8'));
batch.items[7]=bi;
fs.writeFileSync(bp, JSON.stringify(batch,null,2), 'utf8');
console.log("배치 items[7] 교체 완료");

console.log("\n=== Day 8 검증 ===");
console.log("총 글자수:", totalLen, totalLen>=1150&&totalLen<=1250?"OK":"WARN");
console.log("타임라인:", timeline.length); console.log("복기:", recallCards.length); console.log("확인:", confirmQs.length);
let err=0;
for(const st of timeline){for(const r of st.highlight.ranges){const po=paragraphs.find(p=>p.id===r.paragraphId);if(r.start<0||r.end>=po.text.length||r.start>r.end){console.error(`범위오류 ${st.stepId}`);err++;}}if(st.question.answerId!=="A"){console.error(`answerId오류 ${st.stepId}`);err++;}}
console.log(err===0?"모든 검증 통과!":`오류 ${err}건`);
