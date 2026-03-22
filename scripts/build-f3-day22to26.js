#!/usr/bin/env node
// 프레게3 Day 22~26 일일독해 콘텐츠 빌더
const fs = require('fs');
const path = require('path');

function findSentences(text) {
  const sentences = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' || text[i] === '?' || text[i] === '!') {
      if (i === text.length - 1 || text[i + 1] === ' ' || text[i + 1] === '\n') {
        sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
        let next = i + 1;
        while (next < text.length && (text[next] === ' ' || text[next] === '\n')) next++;
        start = next;
      }
    }
  }
  if (start < text.length) sentences.push({ start, end: text.length, text: text.substring(start) });
  return sentences;
}

function findRange(paras, pid, s) {
  const p = paras.find(x => x.id === pid);
  const i = p.text.indexOf(s);
  if (i === -1) throw new Error(`"${s.substring(0,30)}" not found in ${pid}`);
  return { paragraphId: pid, start: i, end: i + s.length };
}

function mkStep(sid, ranges, prompt, choices, aid) {
  return { stepId: sid, highlight: { ranges: Array.isArray(ranges) ? ranges : [ranges] },
    question: { prompt, choices: choices.map((t,i) => ({id:String.fromCharCode(65+i),text:t})),
      answerId: aid, scoring: {correctDeltaSec:20,wrongDeltaSec:-40,eliminateWrongChoice:true}}};
}

function mkConfirm(id, prompt, paras, pid, s) {
  const r = findRange(paras, pid, s);
  return { id, prompt, answerRanges:[r], scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:"ANY" };
}

function splitCards(paras, n) {
  const full = paras.map(p=>p.text).join('\n');
  const sz = Math.ceil(full.length/n);
  return Array.from({length:n},(_,i) => ({id:`c${i+1}`,text:full.substring(i*sz,Math.min((i+1)*sz,full.length))}));
}

function buildTimeline(paras, qBank) {
  const tl = []; let sn=1, qi=0;
  for (const p of paras) {
    const sents = findSentences(p.text);
    for (const s of sents) {
      const q = qBank[qi++];
      if (!q) throw new Error(`문항 부족 s${sn} ${p.id}`);
      tl.push(mkStep(`s${sn}`,{paragraphId:p.id,start:s.start,end:s.end},q.prompt,q.choices,q.answerId));
      sn++;
    }
    const q = qBank[qi++];
    if (!q) throw new Error(`중심문항 부족 s${sn} ${p.id}`);
    tl.push(mkStep(`s${sn}`,{paragraphId:p.id,start:0,end:p.text.length},q.prompt,q.choices,q.answerId));
    sn++;
  }
  return tl;
}

function mkContent(day, sub, title, paras, tl, cards, cq) {
  const ds = String(day).padStart(3,'0');
  return { contentId:`dr-f3-${ds}`,contentType:"DAILY_READING",version:1,status:"PUBLISHED",
    title,description:"일일 독해 - 정독·복기·확인",targetLevel:"FREGE_3",
    schoolGradeRange:{min:6,max:7},area:"READING",subArea:sub,competencies:["READING"],
    tags:["daily"],access:{mode:"FREE"},seedReward:{seedType:"WHEAT",count:5,multiplier:1},
    timeLimitSec:480,assets:{},
    payload:{passage:{format:"TEXT",paragraphs:paras},intensive:{timeline:tl},
      recall:{cards,correctOrder:cards.map(c=>c.id),seedPenalty:1},confirm:{questions:cq}}};
}

function mkBatch(day, sub, content) {
  return { content_type:"DAILY_READING",level_id:"FREGE_3",area:"READING",sub_area:sub,
    day_index:day,module_key:"reading_training",schema_version:"1.0",content };
}

// 각 Day의 필요한 문항 수 계산 및 검증
function countNeeded(paras) {
  let total = 0;
  for (const p of paras) { total += findSentences(p.text).length + 1; }
  return total;
}

// ═══ Day 22 문학 ═══
function buildDay22() {
  const p1 = "어머니는 새벽마다 아직 어둑어둑한 부엌에서 작은 등잔불을 켜고 무쇠솥에 밥을 짓곤 하였다. 쌀이 귀하던 시절이라 보리와 콩을 넉넉히 섞어야 겨우 솥을 채울 수 있었는데, 어머니는 그 보리밥에도 한 톨 한 톨 정성을 기울여 김이 모락모락 피어오를 때까지 뜸을 들이곤 하였다. 나는 그 밥 짓는 소리에 잠이 깨다가도 스르르 다시 눈을 감곤 했다. 솥뚜껑이 딸각거리는 소리, 국자가 그릇에 가볍게 닿는 소리가 어둠 속에서 은은하게 들려오면 이상하게도 마음 한가운데가 따뜻해지며 편안해졌다. 그 소리는 곧 하루의 시작을 알리는 신호였고, 어머니가 여전히 우리 곁을 든든히 지키고 있다는 살아 있는 증거이기도 했다. 부엌에서 스며 나오는 구수한 밥 냄새가 방 안 가득 퍼지면 비로소 우리 집의 하루가 시작되었다.";
  const p2 = "학교에서 돌아오면 마루 끝에 깨끗이 접힌 물수건이 고이 놓여 있었다. 한여름의 찌는 듯한 무더위에는 차가운 우물물에 적셔 둔 수건이었고, 칼바람이 부는 한겨울에는 따뜻한 물에 정성스레 짜서 올려놓은 수건이었다. 어머니는 한마디 인사말조차 없이 그것을 챙겨 두고는 소리 없이 밭으로 나가 보이지 않았다. 나는 그 수건으로 땀에 젖은 얼굴을 닦으며 오늘도 어머니가 나를 기다렸구나 하고 가슴 한편이 따뜻해짐을 느꼈다. 말로 표현하지 않아도 물수건 하나에 촘촘히 담긴 마음은 세상 어떤 위로의 말보다도 깊고 진했다.";
  const p3 = "세월이 흘러 도시로 나온 뒤, 나는 편의점에서 사 먹는 밥이 일상처럼 익숙해져 버렸다. 어느 겨울 저녁, 야근을 마치고 돌아오는 퇴근길에 좁은 골목 어딘가에서 밥 짓는 구수한 냄새가 흘러왔다. 나는 문득 걸음을 멈추었다. 코끝을 간질이며 스미는 그 냄새가 오래전 어머니의 새벽 부엌에서 맡던 것과 너무도 똑같았기 때문이다. 그 순간, 새벽의 솥뚜껑 소리와 마루 끝에 가지런히 올려져 있던 물수건이 겹치듯 한꺼번에 떠올랐다. 그리운 것은 밥 그 자체가 아니라 밥을 지어 주던 사람, 바로 어머니의 존재 그 자체였다.";

  const paras = [{id:"p1",text:p1},{id:"p2",text:p2},{id:"p3",text:p3}];
  const len = p1.length+p2.length+p3.length;
  const needed = countNeeded(paras);

  // p1:6, p2:5, p3:6 => 6+1+5+1+6+1=20
  const qb = [
    {prompt:"어머니가 밥을 짓는 시간대로 알맞은 것은?",choices:["이른 새벽 무렵","한낮의 점심때","해가 질 무렵의 저녁","한밤중의 깊은 시각"],answerId:"A"},
    {prompt:"쌀 대신 보리와 콩을 섞어야 했던 까닭은?",choices:["쌀을 구하기 어려운 형편이었기 때문에","보리가 영양소 면에서 더 뛰어났기 때문에","어머니가 보리밥의 식감을 좋아했기 때문에","마을에서 보리만 재배할 수 있었기 때문에"],answerId:"A"},
    {prompt:"'나'가 밥 짓는 소리에 보인 반응으로 알맞은 것은?",choices:["잠에서 깨었다가 곧 다시 잠이 들었다","곧바로 일어나 부엌을 도우러 갔다","이불을 뒤집어쓰고 귀를 단단히 막았다","소리에 놀라 밖으로 뛰어나가 보았다"],answerId:"A"},
    {prompt:"'나'에게 편안함을 준 것으로 가장 적절한 것은?",choices:["부엌에서 은은하게 들려오는 소리들","새벽녘에 비치는 환한 달빛과 별빛","어머니가 불러 주시는 따뜻한 자장가","마을 어디선가 들려오는 새들의 지저귐"],answerId:"A"},
    {prompt:"부엌 소리가 '나'에게 지닌 의미로 적절한 것은?",choices:["하루가 시작되고 어머니가 곁에 있다는 표시","학교에 갈 시간이 되었다는 일종의 종소리","잠자리에 들 시간임을 알려 주는 신호","밖에 나가 놀아도 괜찮다는 허락의 표시"],answerId:"A"},
    {prompt:"밥 냄새가 방 안에 퍼질 때 일어나는 일은?",choices:["비로소 하루가 시작되었다","어머니가 아이들을 깨우러 왔다","이웃집에서 인사를 하러 찾아왔다","아버지가 먼저 일어나 밥상을 차렸다"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["새벽마다 밥을 짓는 어머니의 소리와 냄새가 주는 편안함","보리밥과 흰쌀밥의 맛 차이를 상세히 비교하는 내용","어린 시절 새벽에 일찍 일어나 공부하는 습관에 대한 회상","부엌에 있는 다양한 살림살이를 하나하나 묘사하는 내용"],answerId:"A"},
    {prompt:"학교에서 돌아오면 마루 끝에 놓여 있던 것은?",choices:["물수건 한 장","따뜻한 간식 접시","어머니의 손편지","새로 산 학용품"],answerId:"A"},
    {prompt:"여름에 수건을 준비하는 방법으로 알맞은 것은?",choices:["차가운 우물물에 적셔서 두었다","따뜻한 물에 짜서 올려 두었다","마른 상태로 개어서 두었다","향을 뿌려서 올려 두었다"],answerId:"A"},
    {prompt:"어머니는 수건을 준비한 뒤 어디로 갔는가?",choices:["밭으로 나가 보이지 않았다","이웃집에 심부름을 갔다","시장에 장을 보러 나갔다","안방에 들어가 주무셨다"],answerId:"A"},
    {prompt:"물수건을 통해 '나'가 느낀 것으로 적절한 것은?",choices:["어머니가 자신을 기다려 주었다는 사실","학교 숙제를 빨리 해야 한다는 부담감","수건의 촉감이 주는 시원하고 상쾌한 기분","밭일을 도와 드려야 한다는 미안한 마음"],answerId:"A"},
    {prompt:"물수건에 담긴 마음에 대한 설명으로 적절한 것은?",choices:["말없이 전해진 어머니의 사랑이 깊은 위로가 되었다","물수건은 그저 위생을 위한 평범한 생활용품이었다","어머니는 물수건 대신 직접 말로 사랑을 표현하셨다","물수건은 이웃 어른이 대신 준비해 놓은 것이었다"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["말없이 준비된 물수건에 담긴 어머니의 따뜻한 마음","학교생활의 어려움과 또래 친구 관계에 대한 고민","여름과 겨울의 계절 변화에 따른 생활의 차이점","마루를 깨끗하게 유지하기 위한 가족 구성원의 노력"],answerId:"A"},
    {prompt:"도시로 나온 뒤 '나'의 식사 방식으로 알맞은 것은?",choices:["편의점에서 사 먹는 것이 일상이 되었다","직접 요리하여 정성스레 한 끼를 챙겼다","매일 어머니가 보내 주시는 밥을 먹었다","구내 식당에서 규칙적으로 한식을 먹었다"],answerId:"A"},
    {prompt:"퇴근길에 '나'의 주의를 끈 것은 무엇인가?",choices:["골목에서 풍기는 밥 짓는 냄새","골목에 울려 퍼지는 피아노 소리","길바닥에 떨어진 오래된 손편지","창문 너머 보이는 새벽녘의 풍경"],answerId:"A"},
    {prompt:"'나'가 걸음을 멈춘 까닭으로 적절한 것은?",choices:["밥 냄새가 어머니의 기억을 불러왔기 때문에","길을 잘못 들어서 방향을 찾아야 했기 때문에","발을 다쳐서 더 이상 걷기가 어려웠기 때문에","앞에서 갑자기 큰 소리가 들려 놀랐기 때문에"],answerId:"A"},
    {prompt:"골목의 냄새와 어머니 부엌의 관계로 적절한 것은?",choices:["골목의 냄새가 어머니의 부엌 냄새와 같았다","어머니의 부엌이 바로 그 골목에 있었다","냄새 때문에 곧바로 어머니에게 전화를 걸었다","골목의 냄새는 어머니의 것과 전혀 달랐다"],answerId:"A"},
    {prompt:"그 순간 '나'에게 떠오른 것은 무엇인가?",choices:["솥뚜껑 소리와 마루 끝의 물수건 기억","학교 운동장에서 뛰놀던 어린 시절 모습","도시에 처음 올라왔을 때의 기대와 설렘","편의점에서 사 먹던 따뜻한 밥의 맛"],answerId:"A"},
    {prompt:"'나'가 진정으로 그리워한 대상으로 적절한 것은?",choices:["밥을 지어 주던 어머니라는 존재","어릴 때 먹던 맛있는 보리밥","편의점에서 파는 따뜻한 도시락","도시 생활의 편리함과 자유로움"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["밥 냄새를 통해 어머니를 떠올리며 그리워하는 감정","도시 생활의 편리함과 시골의 불편함을 비교한 내용","편의점 밥의 다양한 종류와 맛을 소개하는 이야기","퇴근길 골목의 풍경을 세밀하게 묘사한 수필 내용"],answerId:"A"}
  ];

  if (qb.length !== needed) throw new Error(`Day22: qb ${qb.length} != needed ${needed}`);
  const tl = buildTimeline(paras, qb);
  const cards = splitCards(paras, 8);
  const cq = [
    mkConfirm("q1","어머니가 새벽에 밥을 짓던 곳은 어디인가?",paras,"p1","부엌"),
    mkConfirm("q2","쌀과 함께 섞었던 곡식 두 가지는?",paras,"p1","보리와 콩"),
    mkConfirm("q3","마루 끝에 놓여 있던 물건은?",paras,"p2","물수건"),
    mkConfirm("q4","어머니는 수건을 준비한 뒤 어디로 나갔는가?",paras,"p2","밭으로"),
    mkConfirm("q5","도시에서 밥을 사 먹던 곳은?",paras,"p3","편의점"),
    mkConfirm("q6","골목에서 맡은 냄새는 무엇인가?",paras,"p3","밥 짓는"),
    mkConfirm("q7","'나'가 진정으로 그리워한 것은?",paras,"p3","밥을 지어 주던 사람")
  ];
  return {content:mkContent(22,"LITERATURE","일일 독해(프레게 3) Day 22 문학",paras,tl,cards,cq),totalLen:len,stepCount:tl.length,cardCount:8,confirmCount:cq.length};
}

// ═══ Day 23 비문학 ═══
function buildDay23() {
  const p1 = "우리가 매일 먹는 음식은 입에서부터 본격적인 소화가 시작된다. 음식물이 입안에 들어오면 위아래로 튼튼하게 자리 잡은 이빨이 잘게 부수고, 혀가 음식물을 이리저리 굴려 침과 골고루 섞어 주는 역할을 한다. 이때 귀 아래에 자리한 침샘에서 분비되는 침 속에는 아밀레이스라는 소화 효소가 들어 있어 녹말 성분을 엿당이라는 당분으로 분해하는 중요한 작용을 한다. 밥을 오래 꼭꼭 씹으면 단맛이 서서히 느껴지는 까닭이 바로 이 아밀레이스라는 효소의 화학적 작용 때문이다. 잘게 부서지고 침과 충분히 섞인 음식물 덩어리는 식도라는 길고 탄력 있는 근육 관을 거쳐 아래쪽에 있는 위장으로 내려간다.";
  const p2 = "위장에 도달한 음식물은 강한 산성을 띠는 위산과 만나 본격적인 분해 과정을 거치게 된다. 위산은 산성도가 매우 높은 물질로서, 단백질의 복잡하게 얽힌 입체 구조를 풀어 헤치는 중요한 역할을 한다. 위벽의 특수한 세포에서 분비되는 펩신이라는 소화 효소는 풀어진 단백질 사슬을 한층 더 작은 조각들로 잘라 낸다. 위장은 또한 두꺼운 근육의 규칙적이고 강력한 수축 운동으로 음식물을 반죽하듯이 뒤섞어 소화가 원활히 이루어지도록 돕는다. 이러한 일련의 과정을 마친 음식물은 걸쭉한 죽처럼 반액체 상태가 되어 소장으로 서서히 이동한다.";
  const p3 = "소장은 길이가 약 육 미터에 달하는 인체에서 가장 긴 소화 기관으로, 소화와 흡수가 동시에 이루어지는 핵심적인 장소이다. 간에서 만들어져 쓸개에 저장되었다가 필요할 때 분비되는 담즙은 지방을 작은 방울 형태로 쪼개어 효소가 작용하기 쉬운 상태로 바꾸어 준다. 이자에서 분비되는 여러 종류의 소화 효소는 탄수화물과 단백질과 지방을 우리 몸이 직접 사용할 수 있는 최종 영양소 단위로 분해한다. 소장 안쪽 벽면에 촘촘히 돋아 있는 융털이라는 미세한 돌기 구조는 벽면의 표면적을 크게 넓혀 영양소를 효율적으로 흡수한다. 이렇게 흡수된 영양소는 혈액의 흐름을 타고 온몸의 구석구석 세포로 운반되어 에너지원과 몸의 구성 성분으로 쓰인다.";

  const paras = [{id:"p1",text:p1},{id:"p2",text:p2},{id:"p3",text:p3}];
  const len = p1.length+p2.length+p3.length;
  const needed = countNeeded(paras);

  const qb = [
    {prompt:"음식의 소화가 처음 시작되는 곳으로 알맞은 것은?",choices:["입","위장","소장","간"],answerId:"A"},
    {prompt:"입안에서 음식물을 잘게 부수는 역할을 하는 것은?",choices:["이빨","혀","침샘","식도"],answerId:"A"},
    {prompt:"침 속 효소인 아밀레이스의 역할로 알맞은 것은?",choices:["녹말을 엿당으로 분해한다","단백질을 아미노산으로 바꾼다","지방을 작은 방울로 쪼갠다","비타민을 흡수 가능하게 바꾼다"],answerId:"A"},
    {prompt:"밥을 오래 씹으면 단맛이 나는 까닭으로 적절한 것은?",choices:["아밀레이스가 녹말을 당으로 바꾸기 때문에","혀가 단맛 세포를 직접 자극하기 때문에","침 속에 설탕 성분이 포함되어 있기 때문에","위산이 미리 올라와서 반응하기 때문에"],answerId:"A"},
    {prompt:"침과 섞인 음식물이 위장으로 가는 경로로 알맞은 것은?",choices:["식도라는 긴 관을 거친다","혈관을 통해 직접 운반된다","기도를 통해서 이동한다","피부를 통해 체외로 나간다"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["입안에서 이루어지는 소화의 시작 과정","위장에서 단백질이 분해되는 원리","소장에서 영양소가 흡수되는 과정","음식물이 대장에서 배출되는 과정"],answerId:"A"},
    {prompt:"위장에서 음식물이 만나는 물질로 알맞은 것은?",choices:["위산","담즙","아밀레이스","융털"],answerId:"A"},
    {prompt:"위산이 하는 역할로 적절한 것은?",choices:["단백질의 입체 구조를 풀어 헤친다","녹말을 엿당으로 분해하여 준다","지방을 작은 입자로 잘게 나눈다","영양소를 혈액으로 곧바로 운반한다"],answerId:"A"},
    {prompt:"펩신의 역할로 가장 알맞은 것은?",choices:["풀어진 단백질을 더 작은 조각으로 자른다","녹말을 당분으로 변환시키는 작용을 한다","위산의 강한 산성도를 중화시키는 역할이다","지방을 에너지로 전환시키는 기능을 한다"],answerId:"A"},
    {prompt:"위장의 근육 운동이 소화에 기여하는 방식은?",choices:["음식물을 반죽하듯이 뒤섞어 준다","영양소를 혈관으로 밀어 넣어 준다","음식물의 온도를 높여 살균해 준다","효소를 직접 만들어 분비해 준다"],answerId:"A"},
    {prompt:"위에서의 소화를 마친 음식물의 상태로 알맞은 것은?",choices:["걸쭉한 죽처럼 반액체 상태","딱딱한 고체 형태 그대로","맑은 액체 상태로 변함","기체처럼 가볍게 퍼짐"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["위장에서 위산과 효소로 음식물이 분해되는 과정","소장에서 영양소가 흡수되어 온몸에 전달되는 과정","입안에서 음식물이 잘게 부서져 침과 섞이는 과정","대장에서 수분이 흡수되고 찌꺼기가 배출되는 과정"],answerId:"A"},
    {prompt:"소장의 길이로 알맞은 것은?",choices:["약 육 미터","약 이 미터","약 십 미터","약 일 미터"],answerId:"A"},
    {prompt:"담즙의 역할로 적절한 것은?",choices:["지방을 작은 방울로 쪼개어 준다","단백질을 아미노산으로 분해한다","녹말을 당분으로 변환시켜 준다","세포에 산소를 공급하여 준다"],answerId:"A"},
    {prompt:"이자에서 분비되는 효소가 분해하는 것이 아닌 것은?",choices:["비타민","탄수화물","단백질","지방"],answerId:"A"},
    {prompt:"융털이 영양소 흡수에 유리한 까닭으로 적절한 것은?",choices:["표면적을 크게 넓혀 주기 때문에","강한 산성을 띠고 있기 때문에","효소를 직접 분비하기 때문에","음식물을 잘게 부수기 때문에"],answerId:"A"},
    {prompt:"흡수된 영양소가 세포로 운반되는 경로는?",choices:["혈액을 타고 이동한다","신경을 통해 전달된다","뼈를 따라 흘러간다","피부를 통해 흡수된다"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["소장에서 효소와 융털을 통해 영양소가 분해·흡수되는 과정","위장에서 음식물이 위산과 펩신에 의해 분해되는 과정","입안에서 이빨과 침이 음식물을 소화시키는 과정","간에서 독소가 해독되고 담즙이 저장되어 분비되는 과정"],answerId:"A"}
  ];

  if (qb.length !== needed) throw new Error(`Day23: qb ${qb.length} != needed ${needed}`);
  const tl = buildTimeline(paras, qb);
  const cards = splitCards(paras, 8);
  const cq = [
    mkConfirm("q1","입안에서 녹말을 분해하는 효소의 이름은?",paras,"p1","아밀레이스"),
    mkConfirm("q2","밥을 오래 씹으면 느껴지는 맛은?",paras,"p1","단맛"),
    mkConfirm("q3","위벽에서 분비되어 단백질을 자르는 효소는?",paras,"p2","펩신"),
    mkConfirm("q4","위에서 소화된 음식물이 이동하는 곳은?",paras,"p2","소장"),
    mkConfirm("q5","간에서 만들어져 지방을 쪼개는 물질은?",paras,"p3","담즙"),
    mkConfirm("q6","소장 벽면에서 표면적을 넓히는 구조는?",paras,"p3","융털"),
    mkConfirm("q7","흡수된 영양소를 세포로 운반하는 것은?",paras,"p3","혈액")
  ];
  return {content:mkContent(23,"NONFICTION","일일 독해(프레게 3) Day 23 비문학",paras,tl,cards,cq),totalLen:len,stepCount:tl.length,cardCount:8,confirmCount:cq.length};
}

// ═══ Day 24 문학 ═══
function buildDay24() {
  const p1 = "진수는 전학 첫날 아무에게도 눈길을 주지 못한 채 교실 뒤편 창가 자리에 조용히 앉았다. 아무도 먼저 말을 걸지 않았고, 쉬는 시간에도 혼자서 책상 위에 양팔을 괴고 고개를 묻은 채 엎드려 있었다. 교실 안에서는 웃음소리와 떠드는 소리가 끊이지 않았지만, 그 활기찬 소리들이 오히려 자신과 아이들 사이에 보이지 않는 두꺼운 벽이 있다는 느낌을 한층 크게 만들었다. 점심시간이 되자 급식판을 들고 빈자리를 찾아 이리저리 두리번거렸으나, 어느 무리를 봐도 자연스럽게 끼어들 수 있는 틈이 보이지 않았다. 결국 진수는 교실 한쪽 구석에 홀로 놓인 빈 책상 앞에 앉아 혼자서 조용히 밥을 먹었다.";
  const p2 = "며칠이 지나도 형편은 별반 달라지지 않았다. 그러던 어느 날, 미술 시간에 둘씩 짝을 지어 커다란 도화지에 함께 그림을 그리게 되었는데 학생 수가 홀수여서 한 명이 남게 되었다. 선생님이 진수의 이름을 다정하게 부르시며 앞자리에 앉은 지호와 함께 그림을 그리라고 하셨다. 지호는 진수 쪽으로 몸을 돌리며 살짝 미소를 지었고, 진수는 어색하게 고개를 한 번 끄덕이며 인사를 대신했다. 둘은 커다란 도화지를 책상 위에 나란히 펼치고 여름 바다의 풍경을 함께 그리기로 의견을 모았다. 지호가 파란 물감을 튜브에서 짜내면서 자연스럽게 진수에게 먼저 말을 건넸다.";
  const p3 = "\"너 바다 좋아해?\" 진수는 잠시 망설이다가 작은 목소리로 조심스럽게 대답했다. \"응, 원래 살던 고향이 바닷가 마을이었거든.\" 지호는 눈을 크게 뜨며 \"진짜? 나도 해마다 여름이면 가족이랑 꼭 바다에 놀러 가는데!\"라고 신나게 말했다. 그 한마디에 진수의 굳어 있던 표정이 한결 부드럽게 풀리기 시작했다. 둘은 도화지 위에 파도와 갈매기와 하얀 등대를 하나둘 그려 넣으며 이야기를 계속 이어 갔다. 수업이 끝날 무렵 지호가 붓을 내려놓으며 진수에게 말했다. \"우리 내일 점심 같이 먹자.\" 진수는 고개를 크게 끄덕이며 전학 온 뒤 처음으로 환하게 웃었다.";

  const paras = [{id:"p1",text:p1},{id:"p2",text:p2},{id:"p3",text:p3}];
  const len = p1.length+p2.length+p3.length;
  const needed = countNeeded(paras);

  const qb = [
    {prompt:"진수가 앉은 자리의 위치로 알맞은 것은?",choices:["교실 뒤편 창가 자리","교실 앞줄 가운데 자리","복도 쪽 첫 번째 자리","선생님 책상 바로 옆"],answerId:"A"},
    {prompt:"쉬는 시간에 진수가 한 행동으로 알맞은 것은?",choices:["혼자서 책상에 엎드려 있었다","친구들과 함께 운동장에 나갔다","도서관에 가서 책을 빌려 읽었다","선생님에게 궁금한 점을 질문했다"],answerId:"A"},
    {prompt:"교실 안 웃음소리가 진수에게 준 느낌으로 적절한 것은?",choices:["아이들과 사이에 벽이 있다고 느꼈다","교실 분위기가 밝아서 행복하였다","곧 친구가 생길 것 같아 기대되었다","소리가 시끄러워서 화가 치밀었다"],answerId:"A"},
    {prompt:"점심시간에 진수가 겪은 어려움으로 알맞은 것은?",choices:["어느 무리에도 끼어들 자리가 없었다","급식판을 받지 못해서 밥을 굶었다","급식이 입맛에 맞지 않아 먹지 못했다","배가 아파서 밥을 먹을 수가 없었다"],answerId:"A"},
    {prompt:"결국 진수가 점심을 먹은 장소로 적절한 것은?",choices:["교실 구석의 빈 책상 앞에서 먹었다","급식실 맨 앞줄에서 먼저 먹었다","운동장 벤치에서 친구와 함께 먹었다","선생님과 함께 교무실에서 먹었다"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["전학 온 진수가 교실에서 느끼는 외로움과 소외감","진수가 새 학교에서 친구를 빠르게 사귀는 과정","교실 안에서 아이들이 즐겁게 떠드는 분위기 묘사","학교 급식의 메뉴와 배식 방식에 대한 자세한 안내"],answerId:"A"},
    {prompt:"며칠이 지난 뒤에도 달라지지 않은 것은?",choices:["진수가 외로운 상황 자체","교실의 좌석 배치 순서","학교의 수업 시간표 구성","선생님의 수업 진행 방식"],answerId:"A"},
    {prompt:"미술 시간에 한 명이 남게 된 까닭은?",choices:["학생 수가 홀수였기 때문에","한 학생이 갑자기 결석했기 때문에","짝짓기를 거부한 학생이 있었기 때문에","선생님이 일부러 한 명을 빼셨기 때문에"],answerId:"A"},
    {prompt:"선생님이 진수에게 짝으로 정해 준 학생은?",choices:["앞자리에 앉은 지호","뒷자리에 앉은 민수","옆자리에 앉은 하나","같은 반의 반장 학생"],answerId:"A"},
    {prompt:"지호가 진수를 맞이한 태도로 적절한 것은?",choices:["몸을 돌리며 살짝 미소를 지었다","못마땅한 표정을 짓고 돌아앉았다","자리를 옮겨 진수를 피하였다","큰 소리로 반갑다고 인사하였다"],answerId:"A"},
    {prompt:"둘이 그리기로 한 그림의 주제는?",choices:["여름 바다의 풍경","가을 산속의 마을","우주 탐험의 장면","도시 야경의 모습"],answerId:"A"},
    {prompt:"지호가 물감을 짜면서 한 행동은?",choices:["진수에게 자연스럽게 말을 건넸다","도화지를 반으로 접어 버렸다","선생님을 불러서 도움을 청했다","자리에서 일어나 교실을 나갔다"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["미술 시간에 지호와 짝이 되며 생긴 변화 계기","미술 시간에 학생들이 다양한 작품을 만드는 활동","선생님이 학급 전체의 좌석을 새로 배치하는 장면","진수가 미술 실력으로 칭찬을 받게 되는 장면"],answerId:"A"},
    {prompt:"지호가 진수에게 처음 건넨 질문의 내용은?",choices:["바다를 좋아하는지 물었다","어디에서 전학 왔는지 물었다","좋아하는 과목이 무엇인지 물었다","점심은 먹었는지 물어보았다"],answerId:"A"},
    {prompt:"진수의 고향이 있던 곳으로 알맞은 것은?",choices:["바닷가 마을","깊은 산골 마을","번화한 도시 중심","넓은 평야 지역"],answerId:"A"},
    {prompt:"지호가 바다와 관련해 한 말로 알맞은 것은?",choices:["해마다 여름이면 가족과 바다에 간다고 했다","바다를 한 번도 본 적이 없다고 말했다","바다보다 산이 훨씬 좋다고 말했다","바다에 가면 무서워진다고 고백하였다"],answerId:"A"},
    {prompt:"지호의 말에 진수가 보인 변화로 적절한 것은?",choices:["굳어 있던 표정이 부드럽게 풀렸다","얼굴이 붉어지며 화를 냈다","고개를 숙이고 아무 말도 않았다","갑자기 눈물을 흘려 버렸다"],answerId:"A"},
    {prompt:"둘이 도화지에 그려 넣은 것이 아닌 것은?",choices:["고래","파도","갈매기","등대"],answerId:"A"},
    {prompt:"수업 끝 무렵 지호가 진수에게 한 말은?",choices:["내일 점심을 함께 먹자고 했다","방과 후에 같이 공부하자고 했다","주말에 바다에 놀러 가자고 했다","다음 미술 시간에도 짝하자고 했다"],answerId:"A"},
    {prompt:"진수가 전학 온 뒤 처음으로 한 것은?",choices:["환하게 웃었다","큰 소리로 웃었다","신나게 뛰어다녔다","친구들 앞에서 노래했다"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["지호와의 대화를 통해 진수가 마음을 열기 시작한 과정","바다를 주제로 한 미술 작품의 완성과 전시 이야기","진수가 고향 바닷가에서 보낸 어린 시절의 추억","교실에서 학생들이 단체로 바다 여행을 계획하는 장면"],answerId:"A"}
  ];

  if (qb.length !== needed) throw new Error(`Day24: qb ${qb.length} != needed ${needed}`);
  const tl = buildTimeline(paras, qb);
  const cards = splitCards(paras, 8);
  const cq = [
    mkConfirm("q1","진수가 전학 첫날 앉은 곳은 교실 어디인가?",paras,"p1","뒤편 창가"),
    mkConfirm("q2","진수가 점심을 혼자 먹은 장소는?",paras,"p1","교실 한쪽 구석"),
    mkConfirm("q3","미술 시간에 진수의 짝이 된 학생은?",paras,"p2","지호"),
    mkConfirm("q4","둘이 그리기로 한 주제는?",paras,"p2","바다"),
    mkConfirm("q5","진수의 고향은 어떤 곳이었는가?",paras,"p3","바닷가 마을"),
    mkConfirm("q6","수업 끝에 지호가 한 제안은?",paras,"p3","점심 같이 먹자"),
    mkConfirm("q7","진수가 처음으로 한 것은?",paras,"p3","웃었다")
  ];
  return {content:mkContent(24,"LITERATURE","일일 독해(프레게 3) Day 24 문학",paras,tl,cards,cq),totalLen:len,stepCount:tl.length,cardCount:8,confirmCount:cq.length};
}

// ═══ Day 25 비문학 ═══
function buildDay25() {
  const p1 = "지구의 표면은 여러 장의 거대한 판으로 이루어져 있는데, 이를 지각판이라 부른다. 지각판은 단단한 암석으로 구성되어 있으며, 그 아래에 있는 뜨겁고 유동적인 맨틀 위에 떠 있는 상태로 아주 느리게 움직인다. 이 판들은 일 년에 수 센티미터 정도의 느린 속도로 이동하기 때문에 우리가 직접 체감하기는 어렵지만, 수억 년의 긴 세월 동안 대륙의 위치와 바다의 형태를 크게 바꾸어 왔다. 판과 판이 서로 만나는 경계 지역에서는 화산 활동과 지진이 빈번하게 발생하므로, 이러한 위험 지역에 사는 사람들은 각별한 주의를 기울여야 한다.";
  const p2 = "지각판이 서로 정면으로 부딪치는 곳에서는 한쪽 판이 다른 판 아래로 밀려 들어가는 현상이 일어난다. 이 과정을 지질학에서는 섭입이라 부르며, 밀려 들어간 판은 맨틀의 높은 열에 의해 서서히 녹아 버린다. 녹은 암석은 뜨거운 마그마가 되어 지각의 틈새를 통해 지표면 위로 솟아오르면서 웅장한 화산을 만들어 낸다. 한편, 판과 판이 서로 멀어지는 곳에서는 맨틀의 마그마가 갈라진 틈을 따라 올라와 새로운 해저 지각을 형성한다. 이처럼 판이 벌어지면서 새로운 지각이 만들어지는 곳을 해령이라 부르며, 대서양 한가운데를 남북으로 길게 가로지르는 중앙 해령이 대표적인 사례로 꼽힌다.";
  const p3 = "지각판의 움직임은 지진이라는 자연재해와도 매우 밀접한 관련이 있다. 판과 판이 서로 어긋나며 미끄러지는 경계에서는 암석에 거대한 응력이 오랜 기간에 걸쳐 축적되다가 한순간에 방출되면서 강한 지진이 발생한다. 지진의 세기를 나타내는 단위로 리히터 규모가 널리 쓰이는데, 규모가 일 단계 올라갈 때마다 방출되는 에너지가 약 서른두 배씩 커진다. 규모 오 이상의 지진은 건물에 눈에 띄는 피해를 줄 수 있으며, 규모 칠 이상이면 도시 전체에 심각한 피해를 일으킬 수 있다. 따라서 판 경계에 위치한 나라들은 내진 설계 건축 기술과 체계적인 재난 대응 시스템을 갖추는 데에 막대한 노력과 비용을 투입하고 있다.";

  const paras = [{id:"p1",text:p1},{id:"p2",text:p2},{id:"p3",text:p3}];
  const len = p1.length+p2.length+p3.length;
  const needed = countNeeded(paras);

  const qb = [
    {prompt:"지구 표면을 이루는 거대한 판의 이름은?",choices:["지각판","해양판","빙하판","대기판"],answerId:"A"},
    {prompt:"지각판이 떠 있는 곳으로 알맞은 것은?",choices:["뜨거운 맨틀 위","차가운 바닷물 위","두꺼운 빙하 위","단단한 지표면 위"],answerId:"A"},
    {prompt:"지각판이 오랜 세월에 걸쳐 바꾸어 온 것은?",choices:["대륙의 위치와 바다의 형태","지구의 자전 속도와 방향","대기의 성분과 기온의 분포","태양과 지구 사이의 거리"],answerId:"A"},
    {prompt:"판과 판이 만나는 경계에서 일어나는 현상은?",choices:["화산 활동과 지진이 빈번하다","폭우와 홍수가 자주 일어난다","해일과 태풍이 동시에 발생한다","빙하가 빠르게 형성되고 녹는다"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["지각판의 구조와 느린 움직임이 지구에 미치는 영향","화산이 폭발하는 과정과 용암의 흐름 경로","바다의 깊이와 해저에 사는 생물의 분포에 대한 설명","지구 내핵과 외핵의 구성 성분에 관한 과학적 내용"],answerId:"A"},
    {prompt:"지각판이 부딪칠 때 한쪽 판에 일어나는 일은?",choices:["다른 판 아래로 밀려 들어간다","하늘 위로 높이 솟아오른다","옆으로 빠르게 미끄러진다","두 판이 합쳐져 하나가 된다"],answerId:"A"},
    {prompt:"밀려 들어간 판이 겪는 변화로 알맞은 것은?",choices:["맨틀의 높은 열에 녹아 버린다","차가운 물에 의해 굳어진다","지표면 위로 다시 솟아오른다","다른 판과 합쳐져 더 커진다"],answerId:"A"},
    {prompt:"녹은 암석이 지표면으로 솟아올라 만드는 것은?",choices:["화산","해령","빙하","사막"],answerId:"A"},
    {prompt:"판이 서로 멀어지는 곳에서 일어나는 현상은?",choices:["마그마가 올라와 새 해저 지각을 만든다","두 판이 충돌하여 높은 산맥이 솟는다","지각이 갈라져 대륙이 가라앉는다","빙하가 형성되어 해수면이 낮아진다"],answerId:"A"},
    {prompt:"대표적인 해령이 위치한 곳으로 알맞은 것은?",choices:["대서양 한가운데","태평양의 서쪽 끝","인도양의 남쪽 해안","북극해의 깊은 바닥"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["판이 부딪치거나 멀어지는 곳에서 일어나는 지질 현상","화산재가 대기 오염에 미치는 영향과 기후 변화의 관계","해저 생물이 마그마의 열을 이용하여 생존하는 방식","대서양과 태평양의 해저 지형 차이에 대한 비교 분석"],answerId:"A"},
    {prompt:"지각판의 움직임과 밀접한 관계가 있는 현상은?",choices:["지진","태풍","폭설","가뭄"],answerId:"A"},
    {prompt:"지진이 발생하는 원리로 적절한 것은?",choices:["쌓인 응력이 한순간에 방출되기 때문에","바닷물이 갑자기 증발하기 때문에","대기의 압력이 급격히 변하기 때문에","태양열이 지표를 강하게 달구기 때문에"],answerId:"A"},
    {prompt:"리히터 규모가 일 단계 올라갈 때 에너지 변화는?",choices:["약 서른두 배 커진다","약 열 배 정도 커진다","약 두 배 정도 커진다","약 백 배 정도 커진다"],answerId:"A"},
    {prompt:"규모 칠 이상의 지진이 일으킬 수 있는 피해 수준은?",choices:["도시 전체에 심각한 피해를 준다","창문이 약간 흔들리는 수준이다","건물 일부에 금이 가는 정도이다","사람이 느끼기 어려운 수준이다"],answerId:"A"},
    {prompt:"판 경계 나라들이 갖추려 노력하는 것은?",choices:["내진 설계 건축 기술과 재난 대응 시스템","해양 탐사 기술과 심해 잠수 장비 체계","우주 관측 기술과 인공위성 발사 체계","산림 보호 기술과 야생 동물 관리 체계"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["지각판 경계에서 발생하는 지진의 원리와 대비 노력","리히터 규모의 역사와 지진 측정 장비의 발전 과정","세계 각국의 건축 기술 수준을 비교한 조사 결과","화산 폭발이 기후 변화에 미치는 장기적인 영향 분석"],answerId:"A"}
  ];

  if (qb.length !== needed) throw new Error(`Day25: qb ${qb.length} != needed ${needed}`);
  const tl = buildTimeline(paras, qb);
  const cards = splitCards(paras, 8);
  const cq = [
    mkConfirm("q1","지구 표면을 이루는 판의 이름은?",paras,"p1","지각판"),
    mkConfirm("q2","지각판 아래에서 판을 떠받치는 층은?",paras,"p1","맨틀"),
    mkConfirm("q3","한쪽 판이 다른 판 아래로 밀려드는 과정은?",paras,"p2","섭입"),
    mkConfirm("q4","판이 벌어지며 새 지각이 만들어지는 곳은?",paras,"p2","해령"),
    mkConfirm("q5","지진의 세기를 나타내는 단위는?",paras,"p3","리히터 규모"),
    mkConfirm("q6","규모 일 올라갈 때 에너지는 약 몇 배인가?",paras,"p3","서른두 배"),
    mkConfirm("q7","판 경계 국가들이 갖추는 건축 기술은?",paras,"p3","내진 설계")
  ];
  return {content:mkContent(25,"NONFICTION","일일 독해(프레게 3) Day 25 비문학",paras,tl,cards,cq),totalLen:len,stepCount:tl.length,cardCount:8,confirmCount:cq.length};
}

// ═══ Day 26 문학 ═══
function buildDay26() {
  const p1 = "할아버지의 서재에는 오래된 괘종시계가 하나 걸려 있었다. 시계는 매 시각마다 묵직하고 깊은 울림의 종소리를 쳤는데, 어릴 적 나는 그 낮게 울리는 소리가 무서워서 서재에 들어가기를 몹시 꺼렸다. 할아버지는 그런 나를 품에 안아 무릎 위에 올려 앉히고 시계의 유리 덮개를 열어 안쪽을 보여 주셨다. 크고 작은 톱니바퀴가 서로 맞물려 쉬지 않고 돌아가는 모습을 손가락으로 천천히 가리키시며 \"이 바퀴들 하나하나가 힘을 합쳐 시간을 움직이는 거란다\"라고 다정한 목소리로 말씀하셨다. 그 뒤로 나는 시계가 전혀 무섭지 않게 되었고, 오히려 종소리가 울릴 때마다 시계 안쪽의 톱니바퀴를 떠올리며 신기해하곤 했다.";
  const p2 = "할아버지는 평생 시계를 고치는 일을 업으로 삼으셨다. 마을 사람들이 멈추거나 고장 난 시계를 들고 찾아오면, 할아버지는 작은 돋보기를 끼고 기계 안을 하나하나 꼼꼼히 살피셨다. 고장 난 부품을 정확히 찾아내시면 직접 손으로 깎아 맞추기도 하셨고, 어디에서도 구할 수 없는 부품은 쇠붙이를 녹여 새로 주조해 만드셨다. 시계가 다시 째깍째깍 소리를 내며 움직이기 시작하면 할아버지는 아무 말 없이 잔잔하고 깊은 미소를 지으셨다. 나는 할아버지의 그 조용한 미소가 세상에서 가장 깊은 만족과 보람을 담은 표정이라고 어린 마음에 늘 생각했다.";
  const p3 = "세월이 많이 흐른 어느 날, 할아버지께서 돌아가신 뒤 오래된 서재를 정리하다가 그 괘종시계를 다시 마주하게 되었다. 시계는 멈춰 있었고, 종도 더 이상 울리지 않았다. 나는 뒷면의 나무 덮개를 조심스럽게 열어 안을 들여다보았다. 작은 톱니바퀴 하나가 제자리에서 빠져 나와 바닥에 놓여 있었다. 어릴 적 할아버지의 손가락을 따라가며 바퀴들을 들여다보던 기억이 선명하게 떠올라, 나는 떨리는 손으로 조심스럽게 바퀴를 제자리에 끼워 넣었다. 잠시 뒤 시계가 째깍째깍 익숙한 소리를 내며 다시 움직이기 시작했다. 그 순간 종이 한 번 깊게 울렸고, 나는 마치 할아버지가 바로 곁에서 조용히 웃고 계신 것 같은 따뜻한 기분을 느꼈다.";

  const paras = [{id:"p1",text:p1},{id:"p2",text:p2},{id:"p3",text:p3}];
  const len = p1.length+p2.length+p3.length;
  const needed = countNeeded(paras);

  const qb = [
    {prompt:"할아버지의 서재에 걸려 있던 물건은?",choices:["오래된 괘종시계","낡은 축음기 한 대","커다란 벽걸이 거울","작은 나무 책꽂이"],answerId:"A"},
    {prompt:"어릴 적 '나'가 서재에 들어가기를 꺼린 까닭은?",choices:["시계 종소리가 무서웠기 때문에","서재가 너무 어두웠기 때문에","할아버지가 들어오지 말라 하셨기 때문에","책이 너무 많아 답답했기 때문에"],answerId:"A"},
    {prompt:"할아버지가 '나'를 올려 앉힌 곳은?",choices:["무릎 위","서재 의자","마루 바닥","침대 위"],answerId:"A"},
    {prompt:"할아버지가 시계에 대해 설명하신 내용은?",choices:["톱니바퀴들이 힘을 합쳐 시간을 움직인다 하셨다","시계를 절대 만지지 말라고 당부하셨다","시계를 곧 다른 사람에게 팔겠다고 하셨다","시계가 백 년이 넘었다고 말씀하셨다"],answerId:"A"},
    {prompt:"할아버지의 설명 뒤 '나'에게 생긴 변화는?",choices:["시계가 무섭지 않게 되고 신기해하게 되었다","시계 소리에 더욱 크게 놀라게 되었다","서재에 더 이상 가지 않게 되었다","시계를 분해해 보고 싶어졌다"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["할아버지 덕에 괘종시계 두려움이 호기심으로 바뀐 경험","서재에 있던 다양한 골동품에 대한 상세한 설명","괘종시계의 제작 과정과 역사에 대한 지식 전달","할아버지가 시계를 수집하게 된 동기와 배경 이야기"],answerId:"A"},
    {prompt:"할아버지가 평생 하신 일은?",choices:["시계를 고치는 일","가구를 만드는 일","책을 쓰는 일","그림을 그리는 일"],answerId:"A"},
    {prompt:"할아버지가 시계를 살필 때 사용한 도구는?",choices:["작은 돋보기","커다란 망원경","밝은 손전등","얇은 자석 막대"],answerId:"A"},
    {prompt:"구할 수 없는 부품을 만드신 방법은?",choices:["쇠붙이를 녹여 새로 주조해 만드셨다","다른 시계에서 부품을 빼 와 쓰셨다","부품 공장에 특별 주문을 넣으셨다","고치지 않고 그대로 돌려보내셨다"],answerId:"A"},
    {prompt:"시계가 다시 작동할 때 할아버지가 보인 반응은?",choices:["아무 말 없이 잔잔한 미소를 지으셨다","크게 소리를 질러 기뻐하셨다","곧바로 다음 시계를 고치기 시작하셨다","마을 사람들을 불러 모아 자랑하셨다"],answerId:"A"},
    {prompt:"할아버지의 미소에 대한 '나'의 생각은?",choices:["가장 깊은 만족과 보람을 담은 표정이라 여겼다","약간 슬퍼 보여서 걱정이 되었다","할아버지가 몹시 피곤하신 것 같았다","아무런 감흥 없이 그냥 지나쳤다"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["시계를 고치시는 할아버지의 장인 정신과 미소의 의미","마을 사람들이 할아버지를 찾아오는 다양한 이유","시계 수리에 필요한 도구와 재료 종류를 나열한 내용","할아버지가 사람들에게 수리를 가르치시는 장면"],answerId:"A"},
    {prompt:"할아버지 돌아가신 뒤 '나'가 한 일은?",choices:["서재를 정리하다 괘종시계를 마주하였다","서재를 허물고 새 방을 만들었다","괘종시계를 골동품 가게에 팔았다","할아버지의 일기장을 발견하였다"],answerId:"A"},
    {prompt:"다시 마주한 시계의 상태로 알맞은 것은?",choices:["멈춰 있었고 종도 울리지 않았다","정상적으로 잘 작동하고 있었다","종만 울리고 바늘은 멈춰 있었다","바늘이 거꾸로 돌아가고 있었다"],answerId:"A"},
    {prompt:"'나'가 시계 뒷면을 열어 한 행동은?",choices:["안을 들여다보았다","시계를 벽에서 내렸다","뒷판을 떼어 버렸다","나사를 모두 풀어냈다"],answerId:"A"},
    {prompt:"시계 안에서 발견한 것은?",choices:["톱니바퀴 하나가 빠져 있었다","부품이 모두 녹슬어 있었다","시계 안이 텅 비어 있었다","작은 쪽지가 들어 있었다"],answerId:"A"},
    {prompt:"어릴 적 기억을 떠올리며 '나'가 한 행동은?",choices:["빠진 바퀴를 제자리에 끼워 넣었다","시계를 그대로 두고 문을 닫았다","시계를 수리점에 가져갔다","부품을 모두 꺼내어 정리했다"],answerId:"A"},
    {prompt:"바퀴를 끼운 뒤 시계에 생긴 변화는?",choices:["째깍 소리를 내며 다시 움직였다","소리 없이 바늘만 천천히 돌았다","한 번 작동했다가 곧 멈추었다","종만 여러 번 울리고 멈추었다"],answerId:"A"},
    {prompt:"종이 울리는 순간 '나'가 느낀 것은?",choices:["할아버지가 곁에서 웃고 계신 것 같았다","시계가 곧 다시 고장 날까 걱정되었다","서재를 빨리 떠나야겠다는 생각이 들었다","종소리가 어릴 적처럼 무서웠다"],answerId:"A"},
    {prompt:"이 문단의 중심 내용으로 가장 적절한 것은?",choices:["멈춘 시계를 고치며 할아버지를 추억하고 그리워하는 마음","서재 정리를 하며 발견한 다양한 물건들에 대한 묘사","괘종시계의 수리 방법을 단계별로 설명하는 기술적 내용","할아버지가 생전에 남기신 유언의 내용을 밝히는 장면"],answerId:"A"}
  ];

  if (qb.length !== needed) throw new Error(`Day26: qb ${qb.length} != needed ${needed}`);
  const tl = buildTimeline(paras, qb);
  const cards = splitCards(paras, 8);
  const cq = [
    mkConfirm("q1","서재에 있던 시계의 종류는?",paras,"p1","괘종시계"),
    mkConfirm("q2","할아버지가 보여 주신 시계 속 부품은?",paras,"p1","톱니바퀴"),
    mkConfirm("q3","할아버지가 시계 살필 때 사용한 물건은?",paras,"p2","돋보기"),
    mkConfirm("q4","구할 수 없는 부품의 재료는?",paras,"p2","쇠붙이"),
    mkConfirm("q5","시계 안에서 빠져 있던 것은?",paras,"p3","톱니바퀴 하나가 제자리에서 빠져"),
    mkConfirm("q6","바퀴를 끼운 뒤 시계가 낸 소리는?",paras,"p3","째깍째깍"),
    mkConfirm("q7","종이 울리자 떠올린 사람은?",paras,"p3","할아버지")
  ];
  return {content:mkContent(26,"LITERATURE","일일 독해(프레게 3) Day 26 문학",paras,tl,cards,cq),totalLen:len,stepCount:tl.length,cardCount:8,confirmCount:cq.length};
}

// ═══ 메인 실행 ═══
function main() {
  const ROOT = path.join(__dirname, '..');
  const batchFile = path.join(ROOT, 'generated', 'daily-batch-reading-frege3.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'frege3');

  console.log('=== 프레게3 Day 22~26 일일독해 콘텐츠 빌더 ===\n');

  const builders = [buildDay22, buildDay23, buildDay24, buildDay25, buildDay26];
  const results = [];
  for (let i = 0; i < builders.length; i++) {
    try { results.push(builders[i]()); }
    catch (e) { console.error(`Day ${22+i} 빌드 실패: ${e.message}`); process.exit(1); }
  }

  let allOk = true;
  for (let i = 0; i < results.length; i++) {
    const r = results[i]; const d = 22+i; const ds = String(d).padStart(3,'0');
    console.log(`--- Day ${d} (${ds}.json) ---`);
    console.log(`  지문 길이: ${r.totalLen}자 (목표: 950~1050)`);
    console.log(`  정독 step: ${r.stepCount}개`);
    console.log(`  복기 카드: ${r.cardCount}장`);
    console.log(`  확인 문항: ${r.confirmCount}개`);
    const issues = [];
    if (Math.abs(r.totalLen-1000)>50) issues.push(`길이 초과: ${r.totalLen}자`);
    if (r.cardCount!==8) issues.push(`카드: ${r.cardCount}`);
    if (r.confirmCount<5||r.confirmCount>8) issues.push(`확인: ${r.confirmCount}`);
    if (issues.length>0) { allOk=false; console.log(`  [문제] ${issues.join(', ')}`); }
    else console.log('  [통과]');
    console.log('');
  }

  console.log('배치 파일 수정 중...');
  const batch = JSON.parse(fs.readFileSync(batchFile,'utf8'));
  for (let i=0;i<results.length;i++) {
    const d=22+i;
    batch.items[d-1] = mkBatch(d, results[i].content.subArea, results[i].content);
    console.log(`  items[${d-1}] (Day ${d}) 교체`);
  }
  fs.writeFileSync(batchFile, JSON.stringify(batch,null,2),'utf8');
  console.log('  배치 파일 저장 완료\n');

  console.log('static 파일 생성 중...');
  for (let i=0;i<results.length;i++) {
    const d=22+i; const ds=String(d).padStart(3,'0');
    const fp = path.join(staticDir,`${ds}.json`);
    fs.writeFileSync(fp, JSON.stringify(results[i].content,null,2),'utf8');
    console.log(`  ${ds}.json`);
  }

  console.log('\n=== 완료 ===');
  if (allOk) console.log('모든 Day가 검증을 통과했습니다.');
  else { console.log('일부 Day에 문제가 있습니다.'); process.exit(1); }
}

main();
