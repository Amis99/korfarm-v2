const fs = require('fs');

function calcIndices(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  let ranges = [];
  let currentStart = 0;
  for (let s of sentences) {
    ranges.push({ start: currentStart, end: currentStart + s.length - 1 });
    currentStart += s.length;
  }
  return { ranges, full: { start: 0, end: text.length - 1 } };
}

function findWord(text, word) {
  const start = text.indexOf(word);
  if (start === -1) throw new Error("Word not found: " + word);
  return { start, end: start + word.length - 1 };
}

function generateJson(contentId, title, desc, p1Text, p2Text, p3Text, questionsData, recallData, confirmData) {
  const p1Idx = calcIndices(p1Text);
  const p2Idx = calcIndices(p2Text);
  const p3Idx = calcIndices(p3Text);
  
  const indices = [
    [p1Idx.ranges[0], p1Idx.ranges[1], p1Idx.ranges[2], p1Idx.full],
    [p2Idx.ranges[0], p2Idx.ranges[1], p2Idx.ranges[2], p2Idx.full],
    [p3Idx.ranges[0], p3Idx.ranges[1], p3Idx.ranges[2], p3Idx.full]
  ];
  
  const paragraphs = [p1Text, p2Text, p3Text];
  const paragraphIds = ["p1", "p2", "p3"];

  let timeline = [];
  let stepCounter = 1;
  for (let p = 0; p < 3; p++) {
    for (let s = 0; s < 4; s++) {
      const q = questionsData[p][s];
      timeline.push({
        stepId: "s" + stepCounter++,
        highlight: { ranges: [{ paragraphId: paragraphIds[p], start: indices[p][s].start, end: indices[p][s].end }] },
        question: {
          prompt: q.prompt,
          choices: q.choices,
          answerId: q.answerId,
          scoring: { correctDeltaSec: 5, wrongDeltaSec: -2, eliminateWrongChoice: true }
        }
      });
    }
  }

  const confirmQuestions = confirmData.map(c => {
    return {
      prompt: c.prompt,
      answerRanges: [{ paragraphId: c.pid, ...findWord(paragraphs[parseInt(c.pid[1])-1], c.word) }]
    };
  });

  return {
    contentId: contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: title,
    description: desc,
    targetLevel: "SAUSSURE_3",
    schoolGradeRange: { min: 1, max: 3 },
    area: "LITERATURE",
    subArea: "FAIRY_TALE",
    competencies: ["COMPREHENSION", "INFERENCE"],
    tags: ["동화", "문학", "모험"],
    access: { mode: "FREE" },
    seedReward: { seedType: "GOLDEN_SEED", count: 3, multiplier: 1 },
    timeLimitSec: 300,
    assets: {},
    payload: {
      passage: {
        format: "TEXT",
        paragraphs: [
          { id: "p1", text: p1Text },
          { id: "p2", text: p2Text },
          { id: "p3", text: p3Text }
        ]
      },
      intensive: { timeline },
      recall: {
        correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6"],
        seedPenalty: 1,
        cards: recallData.map((text, i) => ({ id: "c" + (i + 1), text }))
      },
      confirm: {
        questions: confirmQuestions
      }
    }
  };
}

// ==========================================
// STORY 1: 028.json (인어공주 1부)
// ==========================================
const s1_p1 = "깊은 바다 밑바닥에는 아름다운 인어공주가 살고 있었습니다. 인어공주는 바다 위 세상을 동경하며 언니들의 이야기를 귀담아들었습니다. 마침내 15살 생일이 되자 공주는 수면 위로 올라가 인간 세상을 구경할 수 있게 되었습니다.";
const s1_p2 = "수면 위로 올라간 인어공주는 큰 배에서 열리는 생일 파티를 보게 되었습니다. 그곳에는 잘생긴 왕자가 있었고, 공주는 한눈에 그에게 반하고 말았습니다. 갑작스러운 폭풍우로 배가 난파되자, 인어공주는 위험을 무릅쓰고 왕자를 구해 해변에 눕혔습니다.";
const s1_p3 = "왕자를 향한 사랑에 빠진 인어공주는 사람이 되기로 결심했습니다. 그녀는 무서운 마녀를 찾아가 자신의 목소리를 주고 사람의 다리를 얻었습니다. 하지만 왕자가 다른 사람과 결혼하면 공주는 물거품이 되어 사라진다는 무서운 조건이 있었습니다.";

const s1_questions = [
  [ // p1
    { prompt: "바다 밑바닥에는 누가 살고 있었나요?", answerId: "A", choices: [{id:"A",text:"아름다운 인어공주"}, {id:"B",text:"무서운 바다 괴물"}, {id:"C",text:"나이 든 마녀"}, {id:"D",text:"어부 할아버지"}] },
    { prompt: "공주는 무엇을 동경했나요?", answerId: "A", choices: [{id:"A",text:"바다 위 세상"}, {id:"B",text:"바다 밑 세상"}, {id:"C",text:"마녀의 동굴"}, {id:"D",text:"용궁의 보물"}] },
    { prompt: "몇 살 생일에 수면 위로 올라갔나요?", answerId: "A", choices: [{id:"A",text:"15살 생일"}, {id:"B",text:"10살 생일"}, {id:"C",text:"20살 생일"}, {id:"D",text:"수면 아래 생일"}] },
    { prompt: "첫 번째 문단의 핵심 내용은 무엇인가요?", answerId: "A", choices: [{id:"A",text:"육지를 동경하는 공주"}, {id:"B",text:"왕자와 결혼한 공주"}, {id:"C",text:"마녀에게 다리를 얻음"}, {id:"D",text:"폭풍우에 휩싸인 배"}] }
  ],
  [ // p2
    { prompt: "인어공주는 큰 배에서 무엇을 보았나요?", answerId: "A", choices: [{id:"A",text:"생일 파티"}, {id:"B",text:"바다 괴물"}, {id:"C",text:"폭풍우"}, {id:"D",text:"마녀의 오두막"}] },
    { prompt: "공주는 큰 배에서 누구에게 반했나요?", answerId: "A", choices: [{id:"A",text:"잘생긴 왕자"}, {id:"B",text:"못생긴 선장"}, {id:"C",text:"마을의 소년"}, {id:"D",text:"자신의 언니"}] },
    { prompt: "배가 난파되자 인어공주는 어떻게 했나요?", answerId: "A", choices: [{id:"A",text:"왕자를 구해 해변에 눕힘"}, {id:"B",text:"바다 깊은 곳으로 숨음"}, {id:"C",text:"언니들을 불러 도움 요청"}, {id:"D",text:"혼자 배를 타고 도망침"}] },
    { prompt: "두 번째 문단의 주요 사건은 무엇인가요?", answerId: "A", choices: [{id:"A",text:"난파된 배에서 왕자를 구함"}, {id:"B",text:"마녀와 끔찍한 거래를 함"}, {id:"C",text:"사람이 되어 육지를 걸음"}, {id:"D",text:"물거품이 되어 사라짐"}] }
  ],
  [ // p3
    { prompt: "사랑에 빠진 인어공주는 무엇이 되기로 했나요?", answerId: "A", choices: [{id:"A",text:"사람"}, {id:"B",text:"바다의 왕"}, {id:"C",text:"물거품"}, {id:"D",text:"바다 마녀"}] },
    { prompt: "다리를 얻기 위해 무엇을 주었나요?", answerId: "A", choices: [{id:"A",text:"자신의 목소리"}, {id:"B",text:"황금 왕관"}, {id:"C",text:"반짝이는 진주"}, {id:"D",text:"아름다운 머리"}] },
    { prompt: "왕자가 다른 이와 결혼하면 어떻게 되나요?", answerId: "A", choices: [{id:"A",text:"물거품이 되어 사라짐"}, {id:"B",text:"다시 인어로 돌아감"}, {id:"C",text:"왕궁의 시녀가 됨"}, {id:"D",text:"영원히 육지에 남음"}] },
    { prompt: "마지막 문단에서 공주가 한 행동은 무엇인가요?", answerId: "A", choices: [{id:"A",text:"마녀를 찾아가 다리를 얻음"}, {id:"B",text:"언니들과 함께 바다로 감"}, {id:"C",text:"왕자와 행복한 결혼을 함"}, {id:"D",text:"생일 파티에서 왕자를 만남"}] }
  ]
];
const s1_recall = ["깊은 바다 밑에 살던 인어공주", "15살 생일에 수면 위로 올라감", "큰 배에서 잘생긴 왕자를 봄", "폭풍우에 난파된 배에서 왕자를 구함", "목소리를 주고 사람의 다리를 얻음", "왕자가 결혼하면 물거품이 됨"];
const s1_confirm = [
  { prompt: "어떤 것을 간절히 바라며 생각하는 것을 무엇이라고 하나요?", pid: "p1", word: "동경" },
  { prompt: "위험을 참고 견디며 어떤 일을 하는 것을 뜻하는 말은 무엇인가요?", pid: "p2", word: "무릅쓰고" },
  { prompt: "배가 바다에서 부서지거나 뒤집히는 것을 뜻하는 말은 무엇인가요?", pid: "p2", word: "난파" }
];


// ==========================================
// STORY 2: 036.json (피터 팬 3부)
// ==========================================
const s2_p1 = "피터 팬은 네버랜드에 살고 있는 영원히 늙지 않는 소년입니다. 그는 요정 팅커벨과 함께 밤하늘을 날아다니며 신나는 모험을 즐겼습니다. 어느 날 밤, 피터 팬은 웬디와 그녀의 동생들을 네버랜드로 초대했습니다.";
const s2_p2 = "네버랜드에는 피터 팬의 앙숙인 해적 후크 선장이 있었습니다. 후크 선장은 피터 팬을 잡기 위해 호시탐탐 기회를 노렸지만, 번번이 실패했습니다. 피터 팬과 아이들은 숲속을 누비며 인디언들과 친구가 되기도 했습니다.";
const s2_p3 = "후크 선장은 웬디와 아이들을 납치하여 자신의 배에 가두었습니다. 소식을 들은 피터 팬은 용감하게 해적선으로 날아가 후크 선장과 결투를 벌였습니다. 결국 피터 팬은 아이들을 구출하고 무사히 집으로 돌려보냈습니다.";

const s2_questions = [
  [ // p1
    { prompt: "피터 팬은 어떤 소년인가요?", answerId: "A", choices: [{id:"A",text:"영원히 늙지 않는 소년"}, {id:"B",text:"빨리 어른이 되고 싶은 소년"}, {id:"C",text:"바다를 항해하는 해적"}, {id:"D",text:"마법을 부리는 마법사"}] },
    { prompt: "피터 팬은 누구와 함께 밤하늘을 날았나요?", answerId: "A", choices: [{id:"A",text:"요정 팅커벨"}, {id:"B",text:"해적 후크 선장"}, {id:"C",text:"마법사 멀린"}, {id:"D",text:"숲속의 요정들"}] },
    { prompt: "피터 팬은 웬디를 어디로 초대했나요?", answerId: "A", choices: [{id:"A",text:"네버랜드"}, {id:"B",text:"원더랜드"}, {id:"C",text:"초콜릿 공장"}, {id:"D",text:"마법 학교"}] },
    { prompt: "첫 번째 문단의 주된 내용은 무엇인가요?", answerId: "A", choices: [{id:"A",text:"네버랜드로 아이들을 초대함"}, {id:"B",text:"후크 선장과 싸우는 피터 팬"}, {id:"C",text:"집으로 무사히 돌아간 아이들"}, {id:"D",text:"숲속에서 길을 잃은 웬디"}] }
  ],
  [ // p2
    { prompt: "네버랜드에 있는 피터 팬의 앙숙은 누구인가요?", answerId: "A", choices: [{id:"A",text:"해적 후크 선장"}, {id:"B",text:"착한 인디언 추장"}, {id:"C",text:"거대한 악어"}, {id:"D",text:"친절한 마법사"}] },
    { prompt: "후크 선장은 무엇을 위해 기회를 노렸나요?", answerId: "A", choices: [{id:"A",text:"피터 팬을 잡기 위해"}, {id:"B",text:"팅커벨을 돕기 위해"}, {id:"C",text:"보물을 찾기 위해"}, {id:"D",text:"인디언과 싸우기 위해"}] },
    { prompt: "피터 팬과 아이들은 숲속에서 누구와 친구가 되었나요?", answerId: "A", choices: [{id:"A",text:"인디언들"}, {id:"B",text:"해적들"}, {id:"C",text:"악어들"}, {id:"D",text:"마법사들"}] },
    { prompt: "두 번째 문단의 중심 내용은 무엇인가요?", answerId: "A", choices: [{id:"A",text:"후크 선장과 인디언들"}, {id:"B",text:"해적선에 갇힌 웬디"}, {id:"C",text:"집으로 돌아가는 아이들"}, {id:"D",text:"요정 가루를 찾는 팅커벨"}] }
  ],
  [ // p3
    { prompt: "후크 선장은 누구를 납치했나요?", answerId: "A", choices: [{id:"A",text:"웬디와 아이들"}, {id:"B",text:"요정 팅커벨"}, {id:"C",text:"인디언 추장"}, {id:"D",text:"마법의 악어"}] },
    { prompt: "소식을 들은 피터 팬은 어디로 날아갔나요?", answerId: "A", choices: [{id:"A",text:"해적선"}, {id:"B",text:"인디언 마을"}, {id:"C",text:"요정의 숲"}, {id:"D",text:"웬디의 집"}] },
    { prompt: "피터 팬은 결국 어떻게 했나요?", answerId: "A", choices: [{id:"A",text:"아이들을 구출해 집으로 보냄"}, {id:"B",text:"해적선에 갇히고 맒"}, {id:"C",text:"후크 선장과 친구가 됨"}, {id:"D",text:"네버랜드를 떠나버림"}] },
    { prompt: "마지막 문단에서 일어난 핵심 사건은 무엇인가요?", answerId: "A", choices: [{id:"A",text:"아이들을 구출한 피터 팬"}, {id:"B",text:"웬디를 네버랜드로 초대함"}, {id:"C",text:"숲속에서 인디언을 만남"}, {id:"D",text:"영원히 늙지 않는 마법"}] }
  ]
];
const s2_recall = ["네버랜드에 사는 영원한 소년 피터 팬", "웬디와 동생들을 네버랜드로 초대함", "피터 팬을 잡으려 호시탐탐 노리는 후크 선장", "숲속을 누비며 인디언과 친구가 됨", "후크 선장이 웬디와 아이들을 납치함", "피터 팬이 아이들을 구출해 집으로 보냄"];
const s2_confirm = [
  { prompt: "어떤 일을 할 기회를 가만히 엿보는 모습을 무엇이라고 하나요?", pid: "p2", word: "호시탐탐" },
  { prompt: "매번, 매 차례마다라는 뜻을 가진 말은 무엇인가요?", pid: "p2", word: "번번이" },
  { prompt: "서로 원수처럼 미워하는 사람을 무엇이라고 하나요?", pid: "p2", word: "앙숙" }
];


// ==========================================
// STORY 3: 037.json (마법의 달빛 시계 5부)
// ==========================================
const s3_p1 = "달빛이 쏟아지는 밤마다 시간을 멈추는 신비한 시계가 있었습니다. 소년 지호는 할아버지의 오래된 서재에서 먼지 쌓인 달빛 시계를 발견했습니다. 시계의 태엽을 감자, 눈부신 은빛 가루가 흩날리며 지호의 방 안을 가득 채웠습니다.";
const s3_p2 = "지호가 시계의 바늘을 자정으로 돌리자 놀라운 일이 벌어졌습니다. 창밖의 빗방울은 공중에 멈추었고, 밤하늘을 날던 올빼미도 날개를 편 채 정지해 있었습니다. 지호는 멈춰버린 시간 속을 걸으며 신비로운 밤의 세상을 홀로 탐험했습니다.";
const s3_p3 = "하지만 달빛 시계를 사용할수록 지호의 그림자가 조금씩 옅어지기 시작했습니다. 할아버지의 일기장에는 시간의 마법을 남용하면 영원히 시간 속에 갇힌다는 경고가 적혀 있었습니다. 지호는 황급히 시계의 바늘을 원래대로 돌리고 평범한 일상으로 돌아왔습니다.";

const s3_questions = [
  [ // p1
    { prompt: "이 신비한 시계는 밤마다 무엇을 멈추었나요?", answerId: "A", choices: [{id:"A",text:"흐르는 시간"}, {id:"B",text:"쏟아지는 달빛"}, {id:"C",text:"할아버지의 서재"}, {id:"D",text:"은빛 가루"}] },
    { prompt: "지호는 어디에서 달빛 시계를 발견했나요?", answerId: "A", choices: [{id:"A",text:"할아버지의 서재"}, {id:"B",text:"깊은 숲속 동굴"}, {id:"C",text:"다락방의 상자"}, {id:"D",text:"어두운 지하실"}] },
    { prompt: "시계의 태엽을 감자 방 안에 무엇이 흩날렸나요?", answerId: "A", choices: [{id:"A",text:"눈부신 은빛 가루"}, {id:"B",text:"하얀 눈송이"}, {id:"C",text:"황금빛 별가루"}, {id:"D",text:"검은 먼지"}] },
    { prompt: "첫 번째 문단에서 지호가 한 일은 무엇인가요?", answerId: "A", choices: [{id:"A",text:"달빛 시계를 발견해 태엽을 감음"}, {id:"B",text:"시간 속에 영원히 갇힘"}, {id:"C",text:"멈춰버린 밤의 세상을 탐험함"}, {id:"D",text:"시계 바늘을 자정으로 돌림"}] }
  ],
  [ // p2
    { prompt: "지호가 시계의 바늘을 어디로 돌렸나요?", answerId: "A", choices: [{id:"A",text:"자정"}, {id:"B",text:"정오"}, {id:"C",text:"새벽"}, {id:"D",text:"아침"}] },
    { prompt: "바늘을 돌리자 창밖의 무엇이 공중에 멈추었나요?", answerId: "A", choices: [{id:"A",text:"빗방울"}, {id:"B",text:"눈송이"}, {id:"C",text:"나뭇잎"}, {id:"D",text:"새 깃털"}] },
    { prompt: "지호는 멈춰버린 시간 속에서 무엇을 했나요?", answerId: "A", choices: [{id:"A",text:"밤의 세상을 홀로 탐험함"}, {id:"B",text:"할아버지의 일기장을 읽음"}, {id:"C",text:"올빼미와 함께 하늘을 남"}, {id:"D",text:"방 안에서 잠을 잠"}] },
    { prompt: "두 번째 문단의 중심 사건은 무엇인가요?", answerId: "A", choices: [{id:"A",text:"멈춘 시간 속을 탐험하는 지호"}, {id:"B",text:"시계를 발견하는 지호"}, {id:"C",text:"시간 마법을 남용하여 갇힌 지호"}, {id:"D",text:"다시 원래 시간으로 돌아온 지호"}] }
  ],
  [ // p3
    { prompt: "시계를 사용할수록 지호의 무엇이 옅어졌나요?", answerId: "A", choices: [{id:"A",text:"그림자"}, {id:"B",text:"머리카락"}, {id:"C",text:"눈동자"}, {id:"D",text:"목소리"}] },
    { prompt: "할아버지의 일기장에는 어떤 경고가 적혀 있었나요?", answerId: "A", choices: [{id:"A",text:"시간 속에 갇힌다"}, {id:"B",text:"시계가 부서진다"}, {id:"C",text:"은빛 가루가 사라진다"}, {id:"D",text:"기억을 잃게 된다"}] },
    { prompt: "경고를 본 지호는 어떻게 했나요?", answerId: "A", choices: [{id:"A",text:"시계 바늘을 원래대로 돌림"}, {id:"B",text:"시계를 서재에 숨김"}, {id:"C",text:"올빼미를 잡아 집에 옴"}, {id:"D",text:"그림자를 되찾으러 떠남"}] },
    { prompt: "마지막 문단에서 지호가 내린 결정은 무엇인가요?", answerId: "A", choices: [{id:"A",text:"마법을 멈추고 일상으로 돌아옴"}, {id:"B",text:"계속 시간 속을 탐험하기로 함"}, {id:"C",text:"할아버지의 일기장을 불태움"}, {id:"D",text:"시간을 자정으로 다시 돌림"}] }
  ]
];
const s3_recall = ["시간을 멈추는 신비한 달빛 시계", "서재에서 시계를 발견한 지호", "시계의 바늘을 자정으로 돌리자 멈춘 시간", "멈춘 시간 속의 신비로운 밤 세상을 탐험함", "마법을 쓸수록 옅어지는 지호의 그림자", "경고를 읽고 원래의 평범한 일상으로 돌아옴"];
const s3_confirm = [
  { prompt: "일정한 한도를 넘어 함부로 지나치게 쓰는 것을 무엇이라고 하나요?", pid: "p3", word: "남용" },
  { prompt: "어둠 속에서도 눈이 밝아 밤에 주로 활동하는 새는 무엇인가요?", pid: "p2", word: "올빼미" },
  { prompt: "몹시 급하여 둥둥거리는 모습을 뜻하는 말은 무엇인가요?", pid: "p3", word: "황급히" }
];


// ==========================================
// STORY 4: 038.json (피노키오의 모험 1부)
// ==========================================
const s4_p1 = "제페토 할아버지는 말하는 나무토막을 깎아 신기한 인형을 만들었습니다. 인형이 완성되자 그는 장난꾸러기처럼 방 안을 뛰어다니며 할아버지를 놀라게 했습니다. 제페토 할아버지는 그 인형에게 피노키오라는 이름을 지어주고 친아들처럼 아꼈습니다.";
const s4_p2 = "피노키오는 학교에 가는 대신 유랑 극단의 인형극을 구경하러 갔습니다. 극단 주인은 피노키오의 재주를 보고 금화 다섯 닢을 주며 집으로 돌려보냈습니다. 하지만 집으로 가는 길에 피노키오는 못된 여우와 고양이에게 속아 금화를 모두 빼앗길 위기에 처했습니다.";
const s4_p3 = "거짓말을 할 때마다 피노키오의 코는 길쭉하게 늘어났습니다. 푸른 요정은 피노키오가 진실을 말할 때만 다시 원래 모습으로 돌아올 수 있다고 알려주었습니다. 피노키오는 많은 시련을 겪은 후, 착하고 정직한 소년이 되기로 굳게 다짐했습니다.";

const s4_questions = [
  [ // p1
    { prompt: "제페토 할아버지는 무엇을 깎아 인형을 만들었나요?", answerId: "A", choices: [{id:"A",text:"말하는 나무토막"}, {id:"B",text:"단단한 돌덩이"}, {id:"C",text:"반짝이는 황금"}, {id:"D",text:"오래된 가죽"}] },
    { prompt: "완성된 인형은 어떻게 방 안을 뛰어다녔나요?", answerId: "A", choices: [{id:"A",text:"장난꾸러기처럼"}, {id:"B",text:"얌전한 고양이처럼"}, {id:"C",text:"무서운 호랑이처럼"}, {id:"D",text:"느릿느릿한 거북이처럼"}] },
    { prompt: "할아버지는 인형에게 어떤 이름을 지어주었나요?", answerId: "A", choices: [{id:"A",text:"피노키오"}, {id:"B",text:"팅커벨"}, {id:"C",text:"마리오"}, {id:"D",text:"알라딘"}] },
    { prompt: "첫 번째 문단의 주된 내용은 무엇인가요?", answerId: "A", choices: [{id:"A",text:"피노키오가 탄생한 이야기"}, {id:"B",text:"학교에 가지 않은 피노키오"}, {id:"C",text:"코가 길어진 피노키오"}, {id:"D",text:"여우와 고양이에게 속은 일"}] }
  ],
  [ // p2
    { prompt: "피노키오는 학교 대신 어디를 구경하러 갔나요?", answerId: "A", choices: [{id:"A",text:"유랑 극단의 인형극"}, {id:"B",text:"동네의 작은 빵집"}, {id:"C",text:"마을의 큰 도서관"}, {id:"D",text:"어두운 마법의 숲"}] },
    { prompt: "극단 주인은 피노키오에게 무엇을 주었나요?", answerId: "A", choices: [{id:"A",text:"금화 다섯 닢"}, {id:"B",text:"새로운 책가방"}, {id:"C",text:"따뜻한 옷 한 벌"}, {id:"D",text:"맛있는 사과 두 개"}] },
    { prompt: "피노키오를 속여 금화를 빼앗으려 한 것은 누구인가요?", answerId: "A", choices: [{id:"A",text:"여우와 고양이"}, {id:"B",text:"늑대와 돼지"}, {id:"C",text:"사자와 호랑이"}, {id:"D",text:"마녀와 마법사"}] },
    { prompt: "두 번째 문단에서 피노키오가 겪은 위기는 무엇인가요?", answerId: "A", choices: [{id:"A",text:"여우와 고양이에게 금화를 빼앗길 뻔함"}, {id:"B",text:"코가 너무 길어져서 집에 못 감"}, {id:"C",text:"장난을 치다 할아버지에게 혼남"}, {id:"D",text:"거짓말을 해서 요정에게 벌을 받음"}] }
  ],
  [ // p3
    { prompt: "피노키오가 거짓말을 하면 어떻게 되었나요?", answerId: "A", choices: [{id:"A",text:"코가 길쭉하게 늘어남"}, {id:"B",text:"귀가 당나귀 귀로 변함"}, {id:"C",text:"다리가 짧아져 뛰지 못함"}, {id:"D",text:"몸이 돌처럼 굳어버림"}] },
    { prompt: "누가 피노키오에게 원래 모습으로 돌아올 방법을 알려주었나요?", answerId: "A", choices: [{id:"A",text:"푸른 요정"}, {id:"B",text:"극단 주인"}, {id:"C",text:"제페토 할아버지"}, {id:"D",text:"말하는 귀뚜라미"}] },
    { prompt: "피노키오는 시련을 겪은 후 어떤 소년이 되기로 했나요?", answerId: "A", choices: [{id:"A",text:"착하고 정직한 소년"}, {id:"B",text:"힘이 세고 용감한 소년"}, {id:"C",text:"돈을 많이 버는 부자"}, {id:"D",text:"인형극을 하는 마술사"}] },
    { prompt: "마지막 문단에서 피노키오가 깨달은 것은 무엇인가요?", answerId: "A", choices: [{id:"A",text:"정직한 소년이 되어야 한다는 것"}, {id:"B",text:"거짓말을 하면 칭찬을 받는다는 것"}, {id:"C",text:"여우와 고양이는 좋은 친구라는 것"}, {id:"D",text:"학교에 가지 않아도 괜찮다는 것"}] }
  ]
];
const s4_recall = ["제페토 할아버지가 만든 나무 인형 피노키오", "학교 대신 유랑 극단의 인형극을 구경 감", "극단 주인에게 금화 다섯 닢을 받음", "집으로 가다 못된 여우와 고양이에게 속음", "거짓말을 할 때마다 코가 길쭉하게 늘어남", "많은 시련 후 정직한 소년이 되기로 다짐함"];
const s4_confirm = [
  { prompt: "이리저리 떠돌아다니며 공연을 하는 사람들의 모임을 무엇이라고 하나요?", pid: "p2", word: "유랑 극단" },
  { prompt: "겪기 힘든 고난이나 어려움을 뜻하는 말은 무엇인가요?", pid: "p3", word: "시련" },
  { prompt: "마음에 거짓이 없고 바른 것을 뜻하는 말은 무엇인가요?", pid: "p3", word: "정직한" }
];


// Generate files
const dir = 'C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지-daily-reading/frontend/public/daily-reading/saussure3/';
fs.writeFileSync(dir + '028.json', JSON.stringify(generateJson('dr-saussure3-028', '[문학] 인어공주 1부', '인간 세상을 동경하던 인어공주 이야기', s1_p1, s1_p2, s1_p3, s1_questions, s1_recall, s1_confirm), null, 2), 'utf8');
fs.writeFileSync(dir + '036.json', JSON.stringify(generateJson('dr-saussure3-036', '[문학] 피터 팬 3부', '영원히 늙지 않는 소년 피터 팬 이야기', s2_p1, s2_p2, s2_p3, s2_questions, s2_recall, s2_confirm), null, 2), 'utf8');
fs.writeFileSync(dir + '037.json', JSON.stringify(generateJson('dr-saussure3-037', '[문학] 마법의 달빛 시계 5부', '시간을 멈추는 마법의 시계 이야기', s3_p1, s3_p2, s3_p3, s3_questions, s3_recall, s3_confirm), null, 2), 'utf8');
fs.writeFileSync(dir + '038.json', JSON.stringify(generateJson('dr-saussure3-038', '[문학] 피노키오의 모험 1부', '말하는 나무 인형 피노키오의 모험 이야기', s4_p1, s4_p2, s4_p3, s4_questions, s4_recall, s4_confirm), null, 2), 'utf8');

console.log('All files generated successfully.');
