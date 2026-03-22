// Day 10: LITERATURE (문학 - 창작 소설)
const fs = require('fs');
const path = require('path');

const paragraphs = [
  { id: "p1", text: "겨울 방학의 마지막 날, 도윤이는 새 학기를 앞두고 책상 서랍을 정리하다가 낡은 엽서 한 장을 발견했다. 엽서의 앞면에는 푸른 바다가 보이는 하얀 등대 그림이 정갈하게 그려져 있었다. 뒷면에는 또박또박한 글씨로 짧은 문장이 적혀 있었는데, 그 내용은 이러했다. \"도윤아, 파도가 아무리 거세도 등대는 제자리를 지킨단다.\" 그것은 작년 여름에 돌아가신 할아버지가 보내 주신 마지막 엽서였다. 도윤이는 엽서를 가슴에 꼭 안은 채 한참 동안 창밖에 내리는 눈을 조용히 바라보았다." },
  { id: "p2", text: "할아버지는 동해안의 작은 어촌 마을에서 평생을 사신 분이었다. 젊은 시절에는 어부로 매일 새벽마다 거친 바다에 나가셨고, 나이가 드신 뒤에는 마을 등대를 관리하는 일을 자원하여 맡으셨다. 도윤이는 방학이 시작될 때마다 할아버지를 찾아가 함께 등대의 가파른 계단을 오르곤 했다. 등대 꼭대기에서 내려다보는 바다는 날마다 색깔이 달랐는데, 할아버지는 그것을 \"바다의 기분\"이라고 다정하게 부르셨다. 파도가 잔잔하고 수면이 옥빛으로 반짝이는 날이면 할아버지는 \"오늘 바다는 기분이 참 좋구나.\"라고 말씀하시며 환하게 웃으셨다." },
  { id: "p3", text: "어느 여름날 오후, 갑자기 시커먼 먹구름이 몰려오더니 바다가 사나워지기 시작했다. 할아버지는 서둘러 등대의 불을 켜고 캄캄한 어둠 속에서 묵묵히 바다를 지켜보셨다. 도윤이가 무서워서 할아버지의 팔을 꽉 잡자 할아버지는 등대의 불빛을 가리키며 불빛 하나가 바다에 나간 사람들을 무사히 집으로 돌아오게 해 준다고 조용히 말씀하셨다. 그날 밤 거센 파도 속에서도 등대는 한순간도 쉬지 않고 힘차게 빛을 보냈고, 이튿날 아침 마을 어부들은 모두 무사히 돌아올 수 있었다. 도윤이는 그때 처음으로 작은 불빛 하나가 얼마나 큰 힘을 가질 수 있는지를 가슴 깊이 느꼈다." },
  { id: "p4", text: "할아버지가 돌아가신 뒤 등대는 자동화 시스템으로 바뀌었고, 더 이상 사람이 직접 관리하지 않게 되었다. 그래도 도윤이는 등대가 여전히 매일 밤 어김없이 불을 밝히고 있다는 사실이 위안이 되었다. 엽서를 다시 한번 들여다보니 할아버지의 글씨가 조금 흐려져 있었지만 한 글자 한 글자가 여전히 선명하게 읽혔다. 도윤이는 새 학기가 시작되면 어떤 어려움이 와도 흔들리지 않는 사람이 되겠다고 마음속으로 단단히 결심했다. 등대가 폭풍 속에서도 끝내 꺼지지 않았던 것처럼, 자신도 누군가에게 빛이 되어 줄 수 있는 사람이 되고 싶었다. 도윤이는 엽서를 책상 위 가장 잘 보이는 자리에 세워 두고 조용히 미소를 지었다." }
];

const totalLen = paragraphs.reduce((s,p)=>s+p.text.length, 0);
console.log("총 글자수:", totalLen);

function splitSentences(text) {
  const results=[]; let cur="";
  for(let i=0;i<text.length;i++){
    cur+=text[i];
    if((text[i]==='.'||text[i]==='!'||text[i]==='?')&&(i===text.length-1||text[i+1]===' '||text[i+1]==='\n')){results.push(cur.trim());cur="";}
  }
  if(cur.trim())results.push(cur.trim());
  return results;
}
function findRange(t,s){const st=t.indexOf(s);if(st===-1){console.error("NOT FOUND:",s.substring(0,40));process.exit(1);}return{start:st,end:st+s.length-1};}

const allS={};for(const p of paragraphs){allS[p.id]=splitSentences(p.text);console.log(`${p.id}: ${allS[p.id].length}문장`);}

const qMap = {
  p1: [
    { prompt: "도윤이가 낡은 엽서를 발견한 상황으로 알맞은 것은?", A: "겨울 방학 마지막 날 책상 서랍을 정리하다가 발견했다", B: "학교 사물함을 정리하다가 발견했다", C: "이사 짐을 풀다가 발견했다", D: "도서관에서 책 사이에 끼워진 것을 발견했다" },
    { prompt: "엽서의 앞면에 그려진 그림으로 알맞은 것은?", A: "푸른 바다가 보이는 하얀 등대 그림이 정갈하게 그려져 있었다", B: "산과 숲이 그려져 있었다", C: "도시의 야경이 그려져 있었다", D: "꽃밭이 그려져 있었다" },
    { prompt: "엽서 뒷면에 적힌 글의 내용으로 알맞은 것은?", A: "파도가 아무리 거세도 등대는 제자리를 지킨다는 내용이었다", B: "바다에서 고기를 많이 잡으라는 내용이었다", C: "공부를 열심히 하라는 내용이었다", D: "건강을 챙기라는 내용이었다" },
    { prompt: "엽서를 보낸 사람에 대한 설명으로 알맞은 것은?", A: "작년 여름에 돌아가신 할아버지가 보내 주신 마지막 엽서였다", B: "먼 곳에 사는 친구가 보내 준 생일 카드였다", C: "아버지가 출장지에서 보내 온 엽서였다", D: "선생님이 방학 숙제로 보내 주신 엽서였다" },
    { prompt: "엽서를 발견한 뒤 도윤이의 행동으로 알맞은 것은?", A: "엽서를 가슴에 꼭 안은 채 한참 동안 창밖에 내리는 눈을 바라보았다", B: "엽서를 읽고 바로 서랍에 다시 넣었다", C: "엄마에게 달려가 엽서를 보여 드렸다", D: "엽서의 내용을 일기장에 옮겨 적었다" },
  ],
  p2: [
    { prompt: "할아버지가 평생 살아온 곳으로 알맞은 것은?", A: "동해안의 작은 어촌 마을에서 평생을 사셨다", B: "서울 도심의 아파트에서 살으셨다", C: "내륙 산간 마을에서 살으셨다", D: "남해안의 큰 도시에서 살으셨다" },
    { prompt: "할아버지가 나이 든 뒤에 하신 일로 알맞은 것은?", A: "마을 등대를 관리하는 일을 자원하셨다", B: "어부 일을 계속하셨다", C: "마을 이장을 맡으셨다", D: "바다 관련 책을 쓰셨다" },
    { prompt: "도윤이가 방학 때마다 한 일로 알맞은 것은?", A: "할아버지를 찾아가 함께 등대에 오르곤 했다", B: "할아버지 댁에서 낚시를 배웠다", C: "바다에서 수영을 배웠다", D: "할아버지와 함께 여행을 다녔다" },
    { prompt: "할아버지가 바다의 색을 뭐라고 부르셨는가?", A: "바다의 기분이라고 부르셨다", B: "바다의 나이라고 부르셨다", C: "바다의 노래라고 부르셨다", D: "바다의 비밀이라고 부르셨다" },
    { prompt: "바다의 기분이 좋은 날의 특징으로 알맞은 것은?", A: "파도가 잔잔하고 수면이 옥빛으로 반짝이는 날이었다", B: "큰 파도가 치며 흰 거품이 이는 날이었다", C: "안개가 짙게 끼어 앞이 보이지 않는 날이었다", D: "바람이 강하게 불어 모래가 날리는 날이었다" },
  ],
  p3: [
    { prompt: "어느 여름날 바다에 일어난 변화로 알맞은 것은?", A: "갑자기 먹구름이 몰려오더니 바다가 사나워지기 시작했다", B: "갑자기 해가 뜨며 무지개가 나타났다", C: "갑자기 물이 빠져 갯벌이 드러났다", D: "갑자기 안개가 걷히며 맑아졌다" },
    { prompt: "할아버지가 서둘러 한 일로 알맞은 것은?", A: "등대의 불을 켜고 어둠 속에서 묵묵히 바다를 지켜보셨다", B: "배를 타고 바다로 나가셨다", C: "마을 사람들에게 대피 명령을 내리셨다", D: "집으로 돌아가 문을 잠그셨다" },
    { prompt: "할아버지가 등대 불빛을 가리키며 한 말로 알맞은 것은?", A: "불빛 하나가 바다에 나간 사람들을 무사히 집으로 돌아오게 해 준다고 하셨다", B: "등대는 관광객을 위한 시설이라고 하셨다", C: "등대 불빛은 물고기를 모으는 역할을 한다고 하셨다", D: "등대는 오래되어 곧 철거될 것이라고 하셨다" },
    { prompt: "그날 밤과 이튿날의 결과로 알맞은 것은?", A: "등대는 쉬지 않고 빛을 보냈고 어부들은 모두 무사히 돌아왔다", B: "폭풍에 등대 불이 꺼져 어부들이 길을 잃었다", C: "등대 불빛이 약해져 큰 사고가 발생했다", D: "어부들이 바다에 나가지 않아 등대가 필요하지 않았다" },
    { prompt: "도윤이가 그때 처음으로 느낀 것으로 알맞은 것은?", A: "작은 불빛 하나가 얼마나 큰 힘을 가질 수 있는지를 느꼈다", B: "바다가 무서운 곳이라는 것을 느꼈다", C: "어부가 위험한 직업이라는 것을 느꼈다", D: "등대지기가 되고 싶다는 꿈을 갖게 되었다" },
  ],
  p4: [
    { prompt: "할아버지 사후 등대에 일어난 변화로 알맞은 것은?", A: "자동화 시스템으로 바뀌어 사람이 직접 관리하지 않게 되었다", B: "등대가 철거되고 새 건물이 들어섰다", C: "다른 마을 사람이 등대지기를 이어받았다", D: "등대 불빛이 영구적으로 꺼졌다" },
    { prompt: "등대에 대한 사실이 도윤이에게 준 감정으로 알맞은 것은?", A: "등대가 여전히 매일 밤 불을 밝힌다는 사실이 위안이 되었다", B: "등대가 자동화되어 실망했다", C: "등대를 더 이상 볼 수 없어 슬펐다", D: "등대에 대한 관심이 완전히 사라졌다" },
    { prompt: "엽서를 다시 들여다본 도윤이가 느낀 것으로 알맞은 것은?", A: "글씨가 조금 흐려졌지만 한 글자 한 글자가 선명하게 읽혔다", B: "글씨가 완전히 지워져 읽을 수 없었다", C: "새로운 문장이 추가로 적혀 있었다", D: "엽서가 너무 낡아 만지면 부서질 것 같았다" },
    { prompt: "도윤이가 새 학기를 앞두고 한 결심으로 알맞은 것은?", A: "어떤 어려움이 와도 흔들리지 않는 사람이 되겠다고 결심했다", B: "할아버지처럼 등대지기가 되겠다고 결심했다", C: "바다 근처로 이사 가겠다고 결심했다", D: "매일 할아버지 묘소를 찾아가겠다고 결심했다" },
    { prompt: "도윤이가 되고 싶은 사람의 모습으로 알맞은 것은?", A: "누군가에게 빛이 되어 줄 수 있는 사람이 되고 싶었다", B: "유명한 과학자가 되고 싶었다", C: "세계를 여행하는 사람이 되고 싶었다", D: "돈을 많이 버는 사업가가 되고 싶었다" },
    { prompt: "도윤이가 엽서를 놓아둔 곳으로 알맞은 것은?", A: "책상 위 가장 잘 보이는 곳에 세워 두었다", B: "서랍 깊숙한 곳에 다시 넣어 두었다", C: "액자에 넣어 벽에 걸어 두었다", D: "엄마에게 드려서 보관하게 했다" },
  ]
};

const centralQ = {
  p1: { prompt: "[문단 1] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "겨울 방학에 할아버지의 마지막 엽서를 발견한 도윤이의 그리움", B: "도윤이의 책상 정리 방법과 습관 소개", C: "겨울 풍경의 아름다움에 대한 묘사", D: "엽서를 보내는 문화와 역사 설명" },
  p2: { prompt: "[문단 2] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "할아버지의 삶과 등대에서 함께한 추억", B: "동해안 어촌 마을의 지리적 특성", C: "등대의 구조와 관리 방법 설명", D: "도윤이의 방학 일정과 학교생활" },
  p3: { prompt: "[문단 3] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "폭풍 속에서 등대의 불빛이 보여 준 힘과 도윤이가 받은 감동", B: "해양 기상 변화의 원인과 예보 방법", C: "어부들의 고된 일상과 경제적 어려움", D: "등대의 건축 양식과 조명 기술" },
  p4: { prompt: "[문단 4] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "할아버지의 가르침을 되새기며 흔들리지 않겠다는 도윤이의 다짐", B: "등대 자동화 시스템의 기술적 원리", C: "도윤이가 등대지기가 되기 위한 준비 과정", D: "엽서 수집이라는 새로운 취미를 시작한 이야기" },
};

const timeline=[];let sn=1;
for(const p of paragraphs){
  const sents=allS[p.id],qs=qMap[p.id];
  if(sents.length!==qs.length){console.error(`${p.id}: 문장(${sents.length}) != 문항(${qs.length})`);sents.forEach((s,i)=>console.log(`  [${i}] ${s}`));process.exit(1);}
  for(let i=0;i<sents.length;i++){const r=findRange(p.text,sents[i]);timeline.push({stepId:`s${sn++}`,highlight:{ranges:[{paragraphId:p.id,start:r.start,end:r.end}]},question:{prompt:qs[i].prompt,choices:[{id:"A",text:qs[i].A},{id:"B",text:qs[i].B},{id:"C",text:qs[i].C},{id:"D",text:qs[i].D}],answerId:"A",scoring:{correctDeltaSec:20,wrongDeltaSec:-40,eliminateWrongChoice:true}}});}
  const cq=centralQ[p.id];timeline.push({stepId:`s${sn++}`,highlight:{ranges:[{paragraphId:p.id,start:0,end:p.text.length-1}]},question:{prompt:cq.prompt,choices:[{id:"A",text:cq.A},{id:"B",text:cq.B},{id:"C",text:cq.C},{id:"D",text:cq.D}],answerId:"A",scoring:{correctDeltaSec:20,wrongDeltaSec:-40,eliminateWrongChoice:true}}});
}

const recallCards=[
  {id:"c1",front:"도윤이가 엽서를 발견한 시기는?",back:"겨울 방학의 마지막 날"},
  {id:"c2",front:"엽서에 그려진 그림은?",back:"바다가 보이는 등대 그림"},
  {id:"c3",front:"할아버지가 나이 든 뒤에 한 일은?",back:"마을 등대를 관리하는 일을 자원하셨다"},
  {id:"c4",front:"할아버지가 바다의 색을 뭐라고 불렀는가?",back:"바다의 기분"},
  {id:"c5",front:"폭풍 속에서 등대는 어떻게 했는가?",back:"한순간도 쉬지 않고 빛을 보냈다"},
  {id:"c6",front:"할아버지 사후 등대의 변화는?",back:"자동화 시스템으로 바뀌었다"},
  {id:"c7",front:"도윤이의 결심은?",back:"어떤 어려움이 와도 흔들리지 않는 사람이 되겠다"},
  {id:"c8",front:"도윤이가 엽서를 놓아둔 곳은?",back:"책상 위 가장 잘 보이는 곳"},
];

const confirmQs=[
  {qId:"q1",prompt:"엽서에 적힌 문장의 핵심 내용은?",acceptedAnswer:["파도가 거세도 등대는 제자리를 지킨다","등대는 제자리를 지킨다"]},
  {qId:"q2",prompt:"할아버지의 직업 변화 과정은?",acceptedAnswer:["어부에서 등대 관리","어부에서 등대지기"]},
  {qId:"q3",prompt:"할아버지가 바다의 색을 뭐라고 불렀는가?",acceptedAnswer:["바다의 기분"]},
  {qId:"q4",prompt:"폭풍 속에서 등대 불빛의 역할은?",acceptedAnswer:["바다에 나간 사람들을 집으로 돌아오게 해 줌","집으로 돌아오게 해 줌"]},
  {qId:"q5",prompt:"할아버지 사후 등대의 변화는?",acceptedAnswer:["자동화 시스템으로 바뀜","자동화"]},
  {qId:"q6",prompt:"도윤이가 새 학기를 앞두고 한 결심은?",acceptedAnswer:["흔들리지 않는 사람이 되겠다","누군가에게 빛이 되어 줄 수 있는 사람"]},
  {qId:"q7",prompt:"도윤이가 엽서를 놓아둔 곳은?",acceptedAnswer:["책상 위 가장 잘 보이는 곳","책상 위"]},
];

const sc={
  contentId:"dr-r2-010",contentType:"DAILY_READING",version:1,status:"PUBLISHED",
  title:"일일 독해(러셀 2) Day 10 문학",description:"일일 독해 - 정독·복기·확인",
  targetLevel:"RUSSELL_2",schoolGradeRange:{min:8,max:9},
  area:"READING",subArea:"LITERATURE",competencies:["READING"],tags:["daily"],
  access:{mode:"FREE"},seedReward:{seedType:"WHEAT",count:3,multiplier:1},
  timeLimitSec:300,assets:{},
  payload:{
    passage:{format:"TEXT",paragraphs},
    intensive:{timeline},
    recall:{cards:recallCards,correctOrder:recallCards.map(c=>c.id),seedPenalty:1},
    confirm:{questions:confirmQs.map(q=>({qId:q.qId,prompt:q.prompt,acceptedAnswer:q.acceptedAnswer,answerMatchMode:"ANY",revealOnWrong:true,scoring:{correctDeltaSec:30,wrongDeltaSec:-45}}))}
  }
};

const bi={content_type:"DAILY_READING",level_id:"RUSSELL_2",area:"READING",sub_area:"LITERATURE",day_index:10,module_key:"reading_training",schema_version:"1.0",content:sc};

fs.writeFileSync(path.join(__dirname,'..','frontend','public','daily-reading','russell2','010.json'),JSON.stringify(sc,null,2),'utf8');
console.log("010.json 저장 완료");
const bp=path.join(__dirname,'..','generated','daily-batch-reading-russell2.json');
const batch=JSON.parse(fs.readFileSync(bp,'utf8'));
batch.items[9]=bi;
fs.writeFileSync(bp,JSON.stringify(batch,null,2),'utf8');
console.log("배치 items[9] 교체 완료");

console.log("\n=== Day 10 검증 ===");
console.log("총 글자수:",totalLen,totalLen>=1150&&totalLen<=1250?"OK":"WARN");
console.log("타임라인:",timeline.length);console.log("복기:",recallCards.length);console.log("확인:",confirmQs.length);
let err=0;
for(const st of timeline){for(const r of st.highlight.ranges){const po=paragraphs.find(p=>p.id===r.paragraphId);if(r.start<0||r.end>=po.text.length||r.start>r.end){console.error(`범위오류 ${st.stepId}`);err++;}}if(st.question.answerId!=="A"){console.error(`answerId오류 ${st.stepId}`);err++;}}
console.log(err===0?"모든 검증 통과!":`오류 ${err}건`);
