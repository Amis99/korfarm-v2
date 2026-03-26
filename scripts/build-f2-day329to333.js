#!/usr/bin/env node
// 프레게2 Day 329~333 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION(비문학), 짝수 Day = LITERATURE(문학)
// 목표 글자수: 900±50 (850~950)

const fs = require('fs');
const path = require('path');

// ─── 유틸리티 함수 ───
function findSentences(text) {
  const sentences = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1;
      while (next < text.length && (text[next] === ' ' || text[next] === '\n')) next++;
      start = next;
    }
  }
  if (start < text.length) sentences.push({ start, end: text.length, text: text.substring(start) });
  return sentences;
}

function findRange(paragraphs, pid, searchText) {
  const para = paragraphs.find(p => p.id === pid);
  if (!para) throw new Error(`문단 ${pid} 없음`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText.substring(0, 30)}..." ${pid}에서 찾을 수 없음`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

function buildTimeline(paragraphs) {
  let stepNum = 0;
  const timeline = [];
  paragraphs.forEach((para) => {
    const sents = findSentences(para.text);
    sents.forEach((sent) => {
      stepNum++;
      timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] } });
    });
    stepNum++;
    timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] } });
  });
  return timeline;
}

function buildRecallCards(paragraphs) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    const s = i * chunkSize;
    const e = Math.min(s + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(s, e) });
  }
  return cards;
}

function makeConfirmQ(id, prompt, ranges) {
  return {
    id, prompt, answerRanges: ranges,
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true, answerMatchMode: "ANY"
  };
}

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs);
  const cards = buildRecallCards(paragraphs);
  const nn = String(dayIndex).padStart(3, '0');
  return {
    contentId: `dr-f2-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(프레게 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_2", schoolGradeRange: { min: 6, max: 6 },
    area: "READING", subArea,
    competencies: ["READING"], tags: ["daily"], access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480, assets: {},
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 },
      confirm: { questions: confirmQuestions }
    }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return {
    content_type: "DAILY_READING", level_id: "FREGE_2", area: "READING",
    sub_area: subArea, day_index: dayIndex, module_key: "reading_training",
    schema_version: "1.0", content
  };
}

// ─── Day 329 (홀수 → 비문학) ───
function buildDay329() {
  const paragraphs = [
    {
      id: "p1",
      text: "바다의 깊은 곳에는 열수 분출공이라 불리는 특별한 지형이 존재한다. 열수 분출공은 해저 지각의 틈을 통해 뜨거운 물이 솟아오르는 곳으로, 수온이 섭씨 400도에 이르기도 한다. 이 뜨거운 물에는 황화수소, 메탄, 철, 망간 등 다양한 화학 물질이 녹아 있다. 분출공 주변에는 이러한 화학 물질이 차가운 바닷물과 만나면서 굴뚝 모양의 광물 구조물이 형성되는데, 이를 블랙 스모커라 부른다. 블랙 스모커에서 뿜어져 나오는 검은 연기처럼 보이는 것은 사실 금속 황화물 입자이다."
    },
    {
      id: "p2",
      text: "열수 분출공 주변에는 햇빛이 전혀 닿지 않음에도 불구하고 독특한 생태계가 번성하고 있다. 이곳의 먹이 사슬은 광합성 대신 화학 합성에 기반한다. 화학 합성 세균은 황화수소를 에너지원으로 삼아 유기물을 생산하며, 이 세균이 열수 생태계의 일차 생산자 역할을 한다. 관벌레라 불리는 거대한 튜브웜은 체내에 화학 합성 세균을 공생시켜 영양분을 얻는다. 이 밖에도 열수 분출공 근처에는 갑각류, 조개류, 해삼 등 다양한 심해 생물이 서식하며, 이들은 일반 해양 생물과는 구별되는 독자적인 진화 경로를 걸어왔다."
    },
    {
      id: "p3",
      text: "과학자들은 열수 분출공의 환경이 지구 초기 생명의 탄생 조건과 유사하다는 점에 주목하고 있다. 원시 지구의 바다에도 이와 비슷한 열수 환경이 존재했을 가능성이 높으며, 이곳에서 최초의 유기 분자가 합성되었을 수 있다. 이 가설은 생명의 기원에 대한 연구에 새로운 방향을 제시하고 있다. 또한 목성의 위성 유로파나 토성의 위성 엔셀라두스의 얼음 아래에도 열수 활동이 있을 것으로 추정되어, 외계 생명 탐사에도 중요한 단서를 제공한다. 심해 탐사 기술이 발전하면서 앞으로 더 많은 열수 분출공이 발견될 것으로 기대되며, 이는 생명의 기원과 우주 탐사에 새로운 가능성을 열어 줄 것이다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "열수 분출공에서 뿜어져 나오는 물의 수온은 최대 몇 도에 이르는가?", [findRange(paragraphs, "p1", "수온이 섭씨 400도에 이르기도 한다")]),
    makeConfirmQ("q2", "블랙 스모커에서 나오는 검은 연기의 정체는 무엇인가?", [findRange(paragraphs, "p1", "검은 연기처럼 보이는 것은 사실 금속 황화물 입자이다")]),
    makeConfirmQ("q3", "열수 분출공 생태계의 먹이 사슬은 무엇에 기반하는가?", [findRange(paragraphs, "p2", "화학 합성에 기반한다")]),
    makeConfirmQ("q4", "화학 합성 세균이 에너지원으로 사용하는 물질은?", [findRange(paragraphs, "p2", "황화수소를 에너지원으로 삼아 유기물을 생산하며")]),
    makeConfirmQ("q5", "관벌레가 영양분을 얻는 방법은 무엇인가?", [findRange(paragraphs, "p2", "관벌레라 불리는 거대한 튜브웜은 체내에 화학 합성 세균을 공생시켜 영양분을 얻는다")]),
    makeConfirmQ("q6", "열수 분출공 환경이 생명 기원 연구에 주목받는 이유는?", [findRange(paragraphs, "p3", "열수 분출공의 환경이 지구 초기 생명의 탄생 조건과 유사하다는 점에 주목하고 있다")]),
    makeConfirmQ("q7", "외계 생명 탐사에서 열수 활동이 추정되는 위성은?", [findRange(paragraphs, "p3", "목성의 위성 유로파나 토성의 위성 엔셀라두스의 얼음 아래에도 열수 활동이 있을 것으로 추정되어")])
  ];

  const content = assembleFull(329, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 330 (짝수 → 문학) ───
function buildDay330() {
  const paragraphs = [
    {
      id: "p1",
      text: "지호는 매일 새벽 다섯 시에 일어나 빵을 굽는 아버지의 뒷모습을 보며 자랐다. 작은 동네 빵집이었지만 아버지는 언제나 최고의 재료만을 고집했다. 밀가루는 국산 우리밀을, 버터는 신선한 것만 사용했다. 계절마다 제철 과일을 넣은 빵을 만드는 것이 아버지만의 특별한 비법이었다. 지호가 초등학교에 다닐 때 아버지는 새 메뉴를 개발하느라 밤늦게까지 주방에 서 있곤 했다. 어린 지호는 아버지 곁에 앉아 반죽이 부풀어 오르는 모습을 신기하게 바라보았다. 오븐에서 갓 나온 빵의 고소한 냄새는 집 안 전체를 따뜻하게 감쌌다."
    },
    {
      id: "p2",
      text: "중학교에 올라가면서 지호는 아버지의 빵집이 부끄러워지기 시작했다. 친구들의 부모님은 대부분 사무실에서 일했고, 자신만 밀가루 냄새가 나는 옷을 입고 학교에 갔다. 체육 시간에 땀을 흘리면 교복에서 빵 냄새가 더 강하게 났고, 그때마다 지호는 얼굴이 붉어졌다. 지호는 아버지에게 화를 내기도 했다. 왜 다른 일을 하지 않느냐고, 좀 더 번듯한 직업을 가질 수는 없느냐고 투덜거렸다. 아버지는 아무 말도 하지 않고 묵묵히 반죽을 치댔다. 그 침묵 속에서 지호는 오히려 마음이 더 무거워졌지만, 사춘기의 자존심이 먼저 사과하는 것을 허락하지 않았다."
    },
    {
      id: "p3",
      text: "고등학생이 된 어느 날, 지호는 학교 앞에서 아버지를 만났다. 아버지는 지호의 반 친구들에게 나눠 주라며 갓 구운 크루아상 한 상자를 들고 서 계셨다. 친구들은 빵을 한 입 물더니 감탄을 쏟아냈다. 이렇게 맛있는 빵은 처음이라며 어디서 산 거냐고 물었다. 그때 지호는 아버지의 손을 보았다. 화상 자국과 굳은살이 가득한 투박한 손이었다. 그 손이 새벽마다 반죽을 치대고, 뜨거운 오븐 앞에 섰다는 사실이 갑자기 가슴을 찔렀다. 지호는 집으로 돌아가는 길에 아버지의 팔짱을 끼고 처음으로 말했다. 아빠 빵이 세상에서 제일 맛있다고."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "지호의 아버지가 빵을 굽기 시작하는 시각은?", [findRange(paragraphs, "p1", "매일 새벽 다섯 시에 일어나 빵을 굽는")]),
    makeConfirmQ("q2", "아버지가 밀가루에 대해 고집한 것은 무엇인가?", [findRange(paragraphs, "p1", "밀가루는 국산 우리밀을")]),
    makeConfirmQ("q3", "중학교 시절 지호가 아버지의 빵집을 부끄러워한 이유는?", [findRange(paragraphs, "p2", "친구들의 부모님은 대부분 사무실에서 일했고, 자신만 밀가루 냄새가 나는 옷을 입고 학교에 갔다")]),
    makeConfirmQ("q4", "지호의 투덜거림에 아버지는 어떻게 반응했는가?", [findRange(paragraphs, "p2", "아버지는 아무 말도 하지 않고 묵묵히 반죽을 치댔다")]),
    makeConfirmQ("q5", "아버지가 학교 앞에 가져온 것은 무엇인가?", [findRange(paragraphs, "p3", "갓 구운 크루아상 한 상자를 들고 서 계셨다")]),
    makeConfirmQ("q6", "지호가 아버지의 손에서 본 것은?", [findRange(paragraphs, "p3", "화상 자국과 굳은살이 가득한 투박한 손이었다")]),
    makeConfirmQ("q7", "집으로 돌아가는 길에 지호가 처음으로 한 말은?", [findRange(paragraphs, "p3", "아빠 빵이 세상에서 제일 맛있다고")])
  ];

  const content = assembleFull(330, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 331 (홀수 → 비문학) ───
function buildDay331() {
  const paragraphs = [
    {
      id: "p1",
      text: "인공지능 기술이 빠르게 발전하면서 의료 분야에서도 혁신적인 변화가 일어나고 있다. 특히 영상 의학 분야에서 인공지능은 엑스레이, CT, MRI 등의 의료 영상을 분석하여 질병을 진단하는 데 활용되고 있다. 인공지능 진단 시스템은 수만 장의 의료 영상 데이터를 학습하여 미세한 병변까지 감지할 수 있다. 예를 들어 폐 영상에서 직경 수 밀리미터에 불과한 결절도 높은 정확도로 식별해 낸다. 연구에 따르면 일부 질환에서는 인공지능의 진단 정확도가 전문의 수준에 근접하거나 이를 능가하는 경우도 보고되고 있다. 이는 의료 자원이 부족한 지역에서 특히 큰 의미를 가진다."
    },
    {
      id: "p2",
      text: "신약 개발 과정에서도 인공지능의 역할이 커지고 있다. 전통적인 신약 개발은 후보 물질 탐색부터 임상 시험까지 평균 10년 이상의 시간과 수조 원의 비용이 소요된다. 인공지능은 방대한 화학 물질 데이터베이스에서 잠재적 약물 후보를 빠르게 선별하고, 분자 구조와 생체 반응을 시뮬레이션하여 개발 기간을 크게 단축할 수 있다. 실제로 인공지능을 활용하여 설계된 항생제 후보 물질이 기존 항생제에 내성을 가진 세균에 대해 효과를 보인 사례가 발표되어 학계의 주목을 받았다. 이는 전통적 방법으로는 수년이 걸릴 연구를 수개월 만에 달성한 것으로 평가된다."
    },
    {
      id: "p3",
      text: "그러나 의료 분야에서 인공지능을 활용하는 데는 여러 과제가 남아 있다. 학습 데이터의 편향이 진단 결과에 영향을 줄 수 있으며, 인공지능의 판단 과정이 불투명한 이른바 블랙박스 문제도 존재한다. 환자의 개인 정보 보호와 의료 데이터의 보안 문제 역시 중요한 쟁점이다. 인공지능이 오진을 했을 때 책임 소재를 어떻게 정할 것인지에 대한 법적, 윤리적 논의도 아직 충분히 이루어지지 않았다. 기술의 발전과 함께 이러한 문제들에 대한 사회적 합의가 선행되어야 인공지능 의료가 진정한 의미에서 환자에게 도움이 될 수 있을 것이다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "인공지능이 의료 영상 분석에 활용되는 영상 종류는?", [findRange(paragraphs, "p1", "엑스레이, CT, MRI 등의 의료 영상을 분석하여 질병을 진단하는 데 활용되고 있다")]),
    makeConfirmQ("q2", "인공지능 진단의 정확도는 어느 수준인가?", [findRange(paragraphs, "p1", "인공지능의 진단 정확도가 전문의 수준에 근접하거나 이를 능가하는 경우도 보고되고 있다")]),
    makeConfirmQ("q3", "전통적인 신약 개발에 소요되는 평균 기간은?", [findRange(paragraphs, "p2", "평균 10년 이상의 시간과 수조 원의 비용이 소요된다")]),
    makeConfirmQ("q4", "인공지능이 신약 개발 기간을 단축하는 방법은?", [findRange(paragraphs, "p2", "방대한 화학 물질 데이터베이스에서 잠재적 약물 후보를 빠르게 선별하고, 분자 구조와 생체 반응을 시뮬레이션하여 개발 기간을 크게 단축할 수 있다")]),
    makeConfirmQ("q5", "인공지능으로 설계된 항생제 후보 물질의 성과는?", [findRange(paragraphs, "p2", "기존 항생제에 내성을 가진 세균에 대해 효과를 보인 사례가 발표되어 학계의 주목을 받았다")]),
    makeConfirmQ("q6", "인공지능 의료의 블랙박스 문제란 무엇인가?", [findRange(paragraphs, "p3", "인공지능의 판단 과정이 불투명한 이른바 블랙박스 문제도 존재한다")]),
    makeConfirmQ("q7", "인공지능 의료가 환자에게 도움이 되려면 무엇이 선행되어야 하는가?", [findRange(paragraphs, "p3", "기술의 발전과 함께 이러한 문제들에 대한 사회적 합의가 선행되어야")])
  ];

  const content = assembleFull(331, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 332 (짝수 → 문학) ───
function buildDay332() {
  const paragraphs = [
    {
      id: "p1",
      text: "은서는 여름방학을 맞아 외할머니 댁이 있는 바닷가 마을을 찾았다. 기차에서 내리자 짭짤한 바람이 얼굴을 스쳤고, 역 앞에는 외할머니가 밀짚모자를 쓰고 서 계셨다. 외할머니의 집은 해안 도로에서 조금 들어간 언덕 위에 있었는데, 마당에 서면 넓은 바다가 한눈에 내려다보였다. 돌담 위로 분홍빛 해당화가 피어 있었고, 바람에 흔들리는 꽃잎이 작은 그림 같았다. 은서는 짐을 풀자마자 마당으로 뛰어나가 깊게 숨을 들이쉬었다. 갈매기 울음소리와 파도 소리가 어우러져 도시에서는 결코 들을 수 없는 자연의 합주가 펼쳐졌다. 외할머니는 시원한 수박 한 쪽을 건네주시며 천천히 쉬라고 말씀하셨다."
    },
    {
      id: "p2",
      text: "다음 날 아침 은서는 외할머니를 따라 해녀들이 작업하는 바닷가로 내려갔다. 해녀들은 검은 잠수복을 입고 망사리를 메고 바다로 들어갔다. 물 위로 올라올 때마다 내쉬는 거친 숨소리가 바람에 실려왔다. 외할머니도 한때는 해녀였다고 했다. 스무 살부터 오십 넘을 때까지 삼십 년 넘게 바다에서 일했다고 하셨다. 이제는 물질을 하지 않지만 바다를 보면 여전히 마음이 설렌다고 조용히 말씀하셨다. 은서는 해녀들이 건져 올린 전복과 성게를 구경하며 바다가 사람들에게 얼마나 많은 것을 베풀어 왔는지 느낄 수 있었다."
    },
    {
      id: "p3",
      text: "방학이 끝나갈 무렵, 은서는 외할머니와 함께 해질녘 바닷가를 걸었다. 수평선 너머로 붉은 해가 서서히 내려앉았고, 바다 위로 주황빛 길이 길게 펼쳐졌다. 외할머니는 이 풍경을 수십 년 동안 보아 왔지만 한 번도 질린 적이 없다고 하셨다. 은서는 모래사장에 조개껍데기 두 개를 주워 하나는 자기가 갖고 하나는 외할머니께 드렸다. 외할머니는 조개를 귀에 대시며 바다 소리가 담겨 있다고 미소 지으셨다. 서울로 돌아가는 기차 안에서 은서는 조개껍데기를 손에 쥐고 창밖을 바라보았다. 귀에는 아직도 파도 소리가 잔잔하게 울리고 있었다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "은서가 기차에서 내렸을 때 역 앞에 서 계신 분은?", [findRange(paragraphs, "p1", "역 앞에는 외할머니가 밀짚모자를 쓰고 서 계셨다")]),
    makeConfirmQ("q2", "외할머니 집 마당에서 볼 수 있는 풍경은?", [findRange(paragraphs, "p1", "마당에 서면 넓은 바다가 한눈에 내려다보였다")]),
    makeConfirmQ("q3", "해녀들이 물 위로 올라올 때 들리는 소리는?", [findRange(paragraphs, "p2", "물 위로 올라올 때마다 내쉬는 거친 숨소리가 바람에 실려왔다")]),
    makeConfirmQ("q4", "외할머니가 바다를 보면 느끼는 감정은?", [findRange(paragraphs, "p2", "바다를 보면 여전히 마음이 설렌다고 조용히 말씀하셨다")]),
    makeConfirmQ("q5", "해녀들이 바다에서 건져 올린 것은 무엇인가?", [findRange(paragraphs, "p2", "해녀들이 건져 올린 전복과 성게를 구경하며")]),
    makeConfirmQ("q6", "은서가 모래사장에서 주운 것은 무엇인가?", [findRange(paragraphs, "p3", "모래사장에 조개껍데기 두 개를 주워 하나는 자기가 갖고 하나는 외할머니께 드렸다")]),
    makeConfirmQ("q7", "서울로 돌아가는 기차에서 은서의 귀에 울리던 소리는?", [findRange(paragraphs, "p3", "귀에는 아직도 파도 소리가 잔잔하게 울리고 있었다")])
  ];

  const content = assembleFull(332, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 333 (홀수 → 비문학) ───
function buildDay333() {
  const paragraphs = [
    {
      id: "p1",
      text: "언어는 시간이 흐르면서 끊임없이 변화한다. 우리가 사용하는 한국어 역시 수백 년 전의 모습과 크게 달라져 있다. 훈민정음 창제 당시의 국어에는 지금은 사라진 글자인 아래아와 여린히읗 등이 존재했으며, 발음 체계도 현재와 상당히 달랐다. 또한 중세 국어에서는 성조가 있어서 같은 글자라도 높낮이에 따라 뜻이 구별되었다. 세종실록에 기록된 훈민정음 해례본을 보면 당시의 음운 체계를 자세히 파악할 수 있다. 이러한 언어의 변화는 자연스러운 현상으로, 사회 구조의 변동, 외래 문화와의 접촉, 세대 간의 소통 방식 차이 등이 복합적으로 작용한 결과이다."
    },
    {
      id: "p2",
      text: "어휘의 변화는 언어 변화 중 가장 눈에 띄는 부분이다. 새로운 사물이나 개념이 등장하면 이를 가리키는 새로운 단어가 만들어진다. 반대로 사라진 사물을 가리키던 단어는 점차 쓰이지 않게 된다. 예를 들어 조선 시대에 일상적으로 사용되던 벼슬 이름이나 의복 명칭 중 상당수는 현대인에게 낯선 단어가 되었다. 또한 기술의 발전으로 스마트폰이나 인터넷처럼 이전에는 존재하지 않던 사물을 가리키는 신조어가 빠르게 생겨나고 있다. 외래어의 유입도 어휘 변화의 중요한 요인이다. 한국어에는 한자어가 전체 어휘의 절반 이상을 차지하며, 근대 이후에는 영어를 비롯한 서양 언어에서 온 외래어가 빠르게 늘어나고 있다."
    },
    {
      id: "p3",
      text: "문법의 변화는 어휘 변화에 비해 느리지만 꾸준히 진행된다. 중세 국어에서 사용되던 주격 조사 이가 현대에 와서는 이와 가로 분화된 것이 대표적인 예이다. 높임법도 시대에 따라 체계가 달라져 왔다. 과거에는 더욱 세밀하게 구분되던 존대 등급이 현대에 와서 단순화되는 추세이다. 이처럼 언어의 변화를 연구하는 학문을 역사 언어학이라 한다. 역사 언어학은 과거의 문헌 자료를 분석하여 언어가 어떻게 변해 왔는지를 추적하며, 이를 통해 당시 사회와 문화의 모습을 간접적으로 이해할 수 있게 해 준다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "훈민정음 창제 당시에 존재했으나 지금은 사라진 글자의 예는?", [findRange(paragraphs, "p1", "아래아와 여린히읗 등이 존재했으며")]),
    makeConfirmQ("q2", "중세 국어에서 같은 글자의 뜻을 구별하던 방법은?", [findRange(paragraphs, "p1", "성조가 있어서 같은 글자라도 높낮이에 따라 뜻이 구별되었다")]),
    makeConfirmQ("q3", "언어 변화를 일으키는 복합적 요인에는 무엇이 있는가?", [findRange(paragraphs, "p1", "사회 구조의 변동, 외래 문화와의 접촉, 세대 간의 소통 방식 차이 등이 복합적으로 작용한 결과이다")]),
    makeConfirmQ("q4", "한국어에서 한자어가 차지하는 비율은?", [findRange(paragraphs, "p2", "한자어가 전체 어휘의 절반 이상을 차지하며")]),
    makeConfirmQ("q5", "중세 국어의 주격 조사가 현대에 와서 어떻게 변화했는가?", [findRange(paragraphs, "p3", "주격 조사 이가 현대에 와서는 이와 가로 분화된 것이 대표적인 예이다")]),
    makeConfirmQ("q6", "현대 높임법의 변화 추세는 어떠한가?", [findRange(paragraphs, "p3", "과거에는 더욱 세밀하게 구분되던 존대 등급이 현대에 와서 단순화되는 추세이다")]),
    makeConfirmQ("q7", "역사 언어학이 연구하는 내용은 무엇인가?", [findRange(paragraphs, "p3", "과거의 문헌 자료를 분석하여 언어가 어떻게 변해 왔는지를 추적하며, 이를 통해 당시 사회와 문화의 모습을 간접적으로 이해할 수 있게 해 준다")])
  ];

  const content = assembleFull(333, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── 실행부 ───
const results = [
  { dayIndex: 329, ...buildDay329() },
  { dayIndex: 330, ...buildDay330() },
  { dayIndex: 331, ...buildDay331() },
  { dayIndex: 332, ...buildDay332() },
  { dayIndex: 333, ...buildDay333() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];

results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

fs.writeFileSync(
  path.join(__dirname, '..', 'generated', 'new', 'batch-f2-329-333.json'),
  JSON.stringify(batchItems, null, 2), 'utf8'
);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
