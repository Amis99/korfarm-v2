#!/usr/bin/env node
// 러셀2 Day 46~50 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE(문학), 홀수 Day = NONFICTION(비문학)
// 목표 글자수: 1200자 ±50 (1150~1250)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-russell2.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/russell2');

// ─── 유틸리티 함수 ───
function findSentences(text) {
  const sentences = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1;
      while (next < text.length && text[next] === ' ') next++;
      start = next;
    }
  }
  if (start < text.length) sentences.push({ start, end: text.length, text: text.substring(start) });
  return sentences;
}

function findRange(paragraphs, pid, searchText) {
  const para = paragraphs.find(p => p.id === pid);
  if (!para) throw new Error(`문단 ${pid}를 찾을 수 없습니다.`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}" not found in ${pid}`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

function hashIdx(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// ─── Day 46: 문학 (LITERATURE) — 아버지와 함께한 자전거 여행 (수필) ───
function buildDay46() {
  const paragraphs = [
    {
      id: "p1",
      text: "아버지와 자전거 여행을 떠난 것은 중학교 2학년 여름이었다. 아버지는 평소에 말이 적은 분이셨는데, 어느 날 저녁 식탁에서 느닷없이 자전거 타고 바다까지 가 보지 않겠냐고 물으셨다. 나는 얼떨결에 좋다고 대답했다. 솔직히 말하면 아버지와 단둘이 며칠을 보낸다는 생각에 어색함이 먼저 밀려왔다. 그래도 거절할 수 없었던 것은, 아버지의 눈빛이 평소와 달리 설렘으로 반짝이고 있었기 때문이다. 어머니는 걱정스러운 표정으로 물과 간식을 챙겨 주셨고, 동생은 부럽다며 자기도 데려가 달라고 졸랐다. 출발 전날 밤 아버지는 거실에서 지도를 펼치고 경로를 표시하셨다. 형광펜으로 굵게 그어진 노란 선을 따라가면 우리 집에서 동해 바다까지 이백 킬로미터 남짓이라고 하셨다. 나는 그 노란 선이 아버지와 나를 연결하는 끈처럼 느껴졌다."
    },
    {
      id: "p2",
      text: "첫째 날은 순탄했다. 이른 새벽에 출발하여 국도 옆 자전거 도로를 따라 달렸다. 아버지는 앞에서, 나는 뒤에서 페달을 밟았다. 바람이 귀를 스치고 들판의 풀 냄새가 코끝에 닿았다. 논 사이로 난 길에서는 개구리 울음소리가 자전거 바퀴 소리와 섞여 들렸다. 한참을 달리다 보니 허벅지가 뻐근해졌고, 입술이 바짝 말랐다. 쉬고 싶다는 말이 입 안에서 맴돌았지만, 꿋꿋이 페달을 돌리는 아버지의 등을 보며 참았다. 점심때 작은 마을 가게 앞에서 멈추어 라면을 끓여 먹었다. 아버지는 내 그릇에 계란을 하나 더 넣어 주시며 잘하고 있다고 말씀하셨다. 그 한마디에 피로가 씻겨 나가는 것 같았다. 오후에는 오르막길이 계속되었지만, 고개를 넘을 때마다 멀리 보이는 산등성이가 조금씩 달라지는 것이 신기했다."
    },
    {
      id: "p3",
      text: "둘째 날 오후, 갑작스러운 소나기가 쏟아졌다. 비를 피할 곳을 찾지 못해 우리는 커다란 느티나무 아래에 자전거를 세웠다. 빗줄기는 점점 거세졌고, 옷은 금세 젖어 버렸다. 아버지는 배낭에서 비닐 우비를 꺼내 내 어깨 위에 덮어 주셨다. 자기 것은 없느냐고 물었더니 아버지는 괜찮다며 빗속을 바라보셨다. 나는 그때 아버지의 젖은 셔츠 너머로 비치는 마른 어깨를 보았다. 예전에 나를 번쩍 들어 올리던 그 넓은 어깨가 언제 저렇게 좁아졌을까 싶었다. 가슴이 먹먹해졌다. 비가 그치고 해가 비칠 때, 아버지는 자전거에 올라타며 거의 다 왔다고 웃으셨다. 그 웃음이 빗물에 씻긴 하늘처럼 맑았다. 저녁 무렵 마침내 바다가 보였고, 짠 바람이 얼굴을 감쌌다. 아버지와 나는 모래사장에 나란히 앉아 석양을 바라보았다. 아무 말이 없었지만, 그 침묵이 어떤 대화보다 따뜻하게 느껴졌다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "아버지의 자전거 여행 제안에 '나'가 거절하지 못한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "아버지의 눈빛이 평소와 달리 설렘으로 반짝이고 있었기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "지도 위의 노란 선을 '나'는 어떤 것에 비유하였는가?",
      answerRanges: [findRange(paragraphs, "p1", "그 노란 선이 아버지와 나를 연결하는 끈처럼 느껴졌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "첫째 날 '나'가 힘들어도 참을 수 있었던 계기는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "꿋꿋이 페달을 돌리는 아버지의 등을 보며 참았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "아버지가 점심 식사 때 건넨 한마디가 '나'에게 준 효과는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "그 한마디에 피로가 씻겨 나가는 것 같았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "소나기 속에서 아버지의 마른 어깨를 본 '나'의 심정은 어떠하였는가?",
      answerRanges: [findRange(paragraphs, "p3", "가슴이 먹먹해졌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "비가 그친 뒤 아버지의 웃음을 '나'는 어떻게 표현하였는가?",
      answerRanges: [findRange(paragraphs, "p3", "그 웃음이 빗물에 씻긴 하늘처럼 맑았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(46, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 47: 비문학 (NONFICTION) — 혈액형과 수혈의 과학 (생물학/의학) ───
function buildDay47() {
  const paragraphs = [
    {
      id: "p1",
      text: "사람의 혈액형은 적혈구 표면에 있는 항원의 종류에 따라 분류된다. 가장 널리 사용되는 ABO 혈액형 체계에서는 A형, B형, AB형, O형의 네 가지로 나뉜다. A형 혈액의 적혈구에는 A항원이, B형에는 B항원이, AB형에는 A항원과 B항원이 모두 존재하며, O형에는 어떤 항원도 없다. 항원은 세포 표면에 돌출된 당단백질로, 면역 체계가 자기 세포와 외부 물질을 구별하는 표지 역할을 한다. 이 분류 체계를 처음 발견한 사람은 오스트리아의 의학자 카를 란트슈타이너로, 그는 1901년 혈액 응집 실험을 통해 혈액형의 존재를 밝혀냈다. 한편 혈장에는 자신이 갖지 않은 항원에 대응하는 항체가 존재한다. A형 혈장에는 B항원에 반응하는 항B 항체가, B형 혈장에는 항A 항체가 들어 있다. AB형은 항체가 없고, O형은 항A 항체와 항B 항체를 모두 가지고 있다."
    },
    {
      id: "p2",
      text: "수혈이란 다른 사람의 혈액을 환자의 혈관에 넣어 주는 의료 행위이다. 수혈에서 가장 중요한 원칙은 환자의 항체가 공여자의 적혈구 항원과 반응해서는 안 된다는 것이다. 만약 B형 혈액을 A형 환자에게 수혈하면, A형 환자의 혈장에 있는 항B 항체가 수혈된 B형 적혈구의 B항원과 결합한다. 이 결합은 적혈구를 뭉치게 만드는 응집 반응을 일으키며, 심한 경우 적혈구가 파괴되어 생명을 위협하는 용혈 반응으로 이어진다. 이러한 사고를 막기 위해 병원에서는 수혈 전에 반드시 교차 시험을 실시하여 공여자와 환자의 혈액이 서로 응집하지 않는지 확인한다. 따라서 같은 혈액형끼리 수혈하는 것이 가장 안전하다. 과거에는 O형을 만능 공여자, AB형을 만능 수혜자라고 불렀으나, 실제로는 소량 수혈에서만 제한적으로 적용되며 원칙적으로 동형 수혈이 권장된다."
    },
    {
      id: "p3",
      text: "ABO 혈액형 외에도 Rh 혈액형 체계가 수혈에서 중요하게 고려된다. Rh 체계에서는 적혈구 표면에 D항원이 있으면 Rh 양성, 없으면 Rh 음성으로 분류한다. 한국인의 약 99.9퍼센트가 Rh 양성이어서 Rh 음성인 사람은 수혈 시 적합한 혈액을 구하기 어려운 경우가 생긴다. Rh 음성인 사람이 Rh 양성 혈액을 수혈받으면, 처음에는 큰 문제가 없지만 면역 체계가 D항원에 대한 항체를 만들기 시작한다. 이후 다시 Rh 양성 혈액을 수혈받으면 이 항체가 수혈된 적혈구를 공격하여 심각한 부작용이 발생할 수 있다. 특히 Rh 음성인 임산부가 Rh 양성 태아를 임신할 때 태아의 적혈구가 어머니의 항체에 의해 파괴되는 신생아 용혈성 질환이 나타날 수 있어 주의가 필요하다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "적혈구 표면의 항원이 면역 체계에서 수행하는 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "면역 체계가 자기 세포와 외부 물질을 구별하는 표지 역할을 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "O형 혈장에 존재하는 항체의 종류는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "O형은 항A 항체와 항B 항체를 모두 가지고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "부적합한 혈액형의 수혈이 위험한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "적혈구를 뭉치게 만드는 응집 반응을 일으키며, 심한 경우 적혈구가 파괴되어 생명을 위협하는 용혈 반응으로 이어진다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "O형이 만능 공여자라는 인식에 대한 현재의 의학적 입장은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "소량 수혈에서만 제한적으로 적용되며 원칙적으로 동형 수혈이 권장된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "Rh 음성인 사람이 Rh 양성 혈액을 두 번째로 수혈받을 때 문제가 생기는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "이 항체가 수혈된 적혈구를 공격하여 심각한 부작용이 발생할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "Rh 음성 임산부에게 주의가 필요한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "태아의 적혈구가 어머니의 항체에 의해 파괴되는 신생아 용혈성 질환이 나타날 수 있어 주의가 필요하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(47, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 48: 문학 (LITERATURE) — 시골 마을 빈집에 찾아온 손님 (단편소설) ───
function buildDay48() {
  const paragraphs = [
    {
      id: "p1",
      text: "마을 어귀에 빈집이 하나 있었다. 지붕 기와가 곳곳에서 빠지고 마당에는 잡초가 무릎까지 자라 있었다. 담장 밑에는 이끼가 두껍게 끼어 있었고, 나무 대문은 한쪽 경첩이 빠져 비스듬히 기울어져 있었다. 이 집에 마지막으로 살았던 사람은 혼자 사시던 박 할머니였다. 할머니가 돌아가신 뒤 자식들이 한 번도 찾아오지 않아 집은 금세 허물어졌다. 마을 사람들은 그 집 앞을 지날 때마다 혀를 끌끌 찼지만, 누구도 손대려 하지 않았다. 어느 가을날, 마을 이장이 그 집 굴뚝에서 연기가 피어오르는 것을 보았다. 처음에는 눈을 의심했으나 분명 회색빛 연기가 가늘게 하늘로 올라가고 있었다. 이장은 지팡이를 짚고 비탈길을 올라가 나무 대문을 두드렸다. 문이 열렸고, 낯선 젊은 남자가 인사를 건넸다."
    },
    {
      id: "p2",
      text: "남자의 이름은 준호였다. 서울에서 오래 직장 생활을 하다가 그만두고 조용한 곳을 찾아 이곳까지 왔다고 했다. 왜 하필 이 빈집이냐고 이장이 묻자, 준호는 빈집을 다시 살릴 수 있을 것 같았다고 대답했다. 처음에 마을 사람들은 수군거렸다. 서울 사람이 시골에서 뭘 하겠느냐, 한두 달 지나면 돌아갈 거라고 말하는 사람도 있었다. 그러나 준호는 매일 아침 일찍 일어나 마당의 잡초를 뽑고 깨진 기와를 하나하나 갈았다. 담장 틈에 시멘트를 메우고 부엌 바닥을 새로 깔았다. 주말마다 면 소재지 철물점에 다녀오는 그의 트럭에는 목재와 못이 가득 실려 있었다. 한 달쯤 지나자 빈집은 제법 사람 사는 집의 모습을 갖추었다. 마을 할머니 한 분이 된장 한 사발을 들고 찾아온 날, 준호는 고개를 깊이 숙여 감사 인사를 했다."
    },
    {
      id: "p3",
      text: "준호가 마을에 자리를 잡으면서 변한 것은 집만이 아니었다. 그는 텃밭을 일구어 배추와 무를 심었고, 마을 경로당 처마에 빗물이 새는 것을 보고는 직접 올라가 수리해 주었다. 처음에 거리를 두던 사람들이 하나둘 말을 걸기 시작했고, 저녁이면 이장 댁 마루에 모여 함께 막걸리를 나누는 날도 생겼다. 마을에서 가장 나이 많은 김 할아버지는 준호에게 이 마을이 예전에는 스무 가구가 넘었는데 지금은 다섯 가구밖에 안 남았다고 말씀하셨다. 젊은 사람들이 모두 도시로 나가 버려 마을이 해마다 조금씩 줄어들고 있다는 이야기였다. 준호는 조용히 고개를 끄덕이며 그 이야기를 들었다. 이듬해 봄, 빈집 마당에 심은 벚나무에서 꽃이 피었다. 분홍빛 꽃잎이 바람에 날려 마을 길 위에 흩어졌고, 지나가는 사람들이 걸음을 멈추고 올려다보았다. 빈집은 더 이상 빈집이 아니었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "빈집이 허물어지게 된 직접적인 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "할머니가 돌아가신 뒤 자식들이 한 번도 찾아오지 않아 집은 금세 허물어졌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "이장이 빈집에 관심을 갖게 된 계기는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "마을 이장이 그 집 굴뚝에서 연기가 피어오르는 것을 보았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "준호가 이 빈집을 택한 이유는 무엇이라고 말했는가?",
      answerRanges: [findRange(paragraphs, "p2", "빈집을 다시 살릴 수 있을 것 같았다고 대답했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "마을 사람들이 처음에 준호에 대해 보인 반응은 어떠하였는가?",
      answerRanges: [findRange(paragraphs, "p2", "서울 사람이 시골에서 뭘 하겠느냐, 한두 달 지나면 돌아갈 거라고 말하는 사람도 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "김 할아버지가 준호에게 전한 마을의 현실은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "이 마을이 예전에는 스무 가구가 넘었는데 지금은 다섯 가구밖에 안 남았다고 말씀하셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이듬해 봄 벚나무 꽃이 핀 장면이 상징하는 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "빈집은 더 이상 빈집이 아니었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(48, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 49: 비문학 (NONFICTION) — 기후 변화와 해수면 상승 (환경과학) ───
function buildDay49() {
  const paragraphs = [
    {
      id: "p1",
      text: "지구의 기후는 산업 혁명 이후 빠르게 변화하고 있으며, 그 가운데 해수면 상승은 인류가 직면한 가장 심각한 위협 중 하나이다. 해수면이 올라가는 원인은 크게 두 가지로 나뉜다. 첫째, 지구 온난화로 인해 바닷물의 온도가 올라가면 물이 팽창하는 열팽창 현상이 일어난다. 물은 온도가 높아지면 부피가 커지는 성질을 가지고 있으므로, 바다 전체의 수온이 조금만 올라가도 해수면은 상당히 높아질 수 있다. 둘째, 극지방과 고산 지대의 빙하가 녹아 바다로 흘러들어가면서 해수의 총량 자체가 증가한다. 특히 그린란드와 남극 대륙의 빙상은 지구에서 가장 거대한 얼음 덩어리로, 이것이 완전히 녹을 경우 해수면이 수십 미터까지 상승할 수 있다고 경고된다. 과학자들의 관측에 따르면, 지난 백여 년 동안 전 세계 해수면은 약 이십 센티미터가량 상승하였으며, 최근 수십 년 사이에 상승 속도가 눈에 띄게 빨라지고 있다."
    },
    {
      id: "p2",
      text: "해수면 상승은 연안 지역에 사는 사람들의 삶에 직접적인 영향을 미친다. 해안선이 점차 내륙 쪽으로 밀려오면서 저지대 마을이 침수되거나, 해일과 폭풍 때 피해 규모가 이전보다 훨씬 커지고 있다. 태평양의 작은 섬나라인 투발루와 키리바시는 해수면 상승으로 국토 자체가 물에 잠길 위기에 처해 있어, 주민들이 다른 나라로 이주하는 방안을 논의하고 있다. 또한 해수가 내륙으로 스며들면 농경지의 토양에 소금기가 배어 작물 재배가 어려워지는 염류화 현상이 발생한다. 지하수에도 바닷물이 유입되면 식수와 농업용수의 확보가 어려워져 지역 주민의 생존 기반이 흔들린다. 이처럼 해수면 상승은 단순히 물이 차오르는 문제를 넘어 식량, 주거, 경제 전반에 걸쳐 복합적인 위기를 초래한다."
    },
    {
      id: "p3",
      text: "해수면 상승에 대응하기 위해 국제 사회는 다양한 노력을 기울이고 있다. 가장 근본적인 대책은 온실 가스 배출을 줄여 지구 온난화의 속도를 늦추는 것이다. 파리 기후 협정에서 각국은 산업화 이전 대비 지구 평균 기온 상승 폭을 섭씨 이 도 이내로 제한하기로 합의하였다. 이를 위해 화석 연료 대신 태양광, 풍력 등 재생 에너지의 비중을 높이고, 산업과 교통 분야에서 탄소 배출을 감축하는 정책이 추진되고 있다. 한편 이미 진행 중인 해수면 상승에 적응하기 위한 방안도 병행되고 있다. 네덜란드는 수백 년에 걸쳐 쌓아 온 제방 기술을 바탕으로 첨단 방조제 시스템을 운영하고 있으며, 방글라데시는 해안 지역에 맹그로브 숲을 조성하여 자연적 방파제 역할을 하게 하고 있다. 이러한 대응은 감축과 적응이 함께 이루어져야 효과를 발휘한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "해수면이 상승하는 두 가지 주요 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "바닷물의 온도가 올라가면 물이 팽창하는 열팽창 현상이 일어난다"), findRange(paragraphs, "p1", "극지방과 고산 지대의 빙하가 녹아 바다로 흘러들어가면서 해수의 총량 자체가 증가한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "지난 백여 년간 전 세계 해수면은 얼마나 상승하였는가?",
      answerRanges: [findRange(paragraphs, "p1", "전 세계 해수면은 약 이십 센티미터가량 상승하였으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "해수면 상승으로 인한 염류화 현상이란 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "해수가 내륙으로 스며들면 농경지의 토양에 소금기가 배어 작물 재배가 어려워지는 염류화 현상이 발생한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "투발루와 키리바시가 처한 위기의 구체적 내용은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "해수면 상승으로 국토 자체가 물에 잠길 위기에 처해 있어, 주민들이 다른 나라로 이주하는 방안을 논의하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "파리 기후 협정에서 각국이 합의한 핵심 목표는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "산업화 이전 대비 지구 평균 기온 상승 폭을 섭씨 이 도 이내로 제한하기로 합의하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "해수면 상승에 대한 대응이 효과를 발휘하기 위한 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "감축과 적응이 함께 이루어져야 효과를 발휘한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(49, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 50: 문학 (LITERATURE) — 방학 마지막 날의 일기 (생활문) ───
function buildDay50() {
  const paragraphs = [
    {
      id: "p1",
      text: "8월 31일, 맑음. 방학이 오늘로 끝난다. 아침에 눈을 떴을 때 달력을 보고 한숨부터 나왔다. 방학 시작 날에는 사십여 일이 영원처럼 느껴졌는데, 돌아보니 눈 깜짝할 사이에 지나가 버렸다. 방학 첫 주에 세운 계획표가 아직도 책상 앞에 붙어 있다. 매일 아침 여섯 시에 일어나기, 수학 문제집 하루 다섯 쪽씩 풀기, 영어 단어 삼십 개씩 외우기. 종이 위의 글씨만큼은 반듯하고 야무지다. 색연필로 요일마다 다른 색을 칠해 놓아서 보기에도 그럴듯하다. 하지만 그 계획 중에서 끝까지 지킨 것은 하나도 없다. 첫째 주까지는 그런대로 따라갔지만, 둘째 주부터 느슨해졌고, 셋째 주에는 계획표의 존재 자체를 잊어버렸다. 그러고 보면 계획을 세우는 일과 실천하는 일 사이에는 생각보다 깊은 골짜기가 있다."
    },
    {
      id: "p2",
      text: "그래도 이번 방학이 아무 의미 없이 흘러간 것은 아니다. 팔월 초에 외갓집에 가서 외할머니와 일주일을 보낸 것은 기억에 오래 남을 것이다. 외할머니 댁 뒷산에 올라가 매미 소리를 들으며 수박을 먹은 일, 마당에서 외할머니가 말려 놓은 고추를 함께 뒤집은 일, 밤에 평상에 누워 별을 세다 잠든 일. 새벽에 할머니를 따라 텃밭에 나가 토마토를 딴 일도 새로운 경험이었다. 계획표에는 없었던 시간이지만, 오히려 그런 시간이 방학의 진짜 보물인지도 모른다. 외할머니는 헤어질 때 내 손을 꼭 잡고 공부도 중요하지만 잘 놀 줄도 알아야 한다고 말씀하셨다. 돌아오는 버스 안에서 창밖의 논밭을 바라보며 외할머니의 주름진 손을 떠올렸다. 그 말이 귓가에 맴돈다."
    },
    {
      id: "p3",
      text: "오후에 밀린 방학 숙제를 하느라 정신이 없었다. 독서 감상문 두 편을 쓰고, 과학 탐구 보고서를 마무리했다. 솔직히 대충 쓴 감이 있어 마음이 찜찜하다. 다음 방학에는 미리미리 해야지 하고 매번 다짐하지만, 매번 마지막 날에야 허둥지둥하는 것이 나의 패턴인 것 같다. 엄마는 옆에서 그것 봐라, 진작 하라고 했잖아 하고 한마디 하셨지만, 혼내는 말투가 아니라 웃음이 섞여 있었다. 저녁을 먹고 나서 가방에 교과서와 준비물을 챙겼다. 가방이 묵직해지니 비로소 개학이 실감이 났다. 창밖으로 해가 천천히 지고 있었다. 하늘이 주황빛에서 보라빛으로 변해 가는 것을 한참 바라보았다. 내일이면 교실에서 친구들을 만나겠지. 떨리기도 하고 반갑기도 한 묘한 기분이다. 방학 마지막 날의 저녁놀은 유독 아름답고도 아쉬웠다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "'나'가 방학 첫날과 마지막 날에 느낀 시간의 차이는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "방학 시작 날에는 사십여 일이 영원처럼 느껴졌는데, 돌아보니 눈 깜짝할 사이에 지나가 버렸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "'나'가 계획 실천에 대해 깨달은 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "계획을 세우는 일과 실천하는 일 사이에는 생각보다 깊은 골짜기가 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "'나'가 방학의 진짜 보물이라고 생각한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "계획표에는 없었던 시간이지만, 오히려 그런 시간이 방학의 진짜 보물인지도 모른다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "외할머니가 헤어질 때 '나'에게 한 말씀은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "공부도 중요하지만 잘 놀 줄도 알아야 한다고 말씀하셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "'나'가 방학 숙제에 대해 반복하는 패턴은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "매번 마지막 날에야 허둥지둥하는 것이 나의 패턴인 것 같다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "개학 전날 밤 '나'가 느끼는 감정은 어떠한가?",
      answerRanges: [findRange(paragraphs, "p3", "떨리기도 하고 반갑기도 한 묘한 기분이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(50, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  // 정독 타임라인 자동 생성
  const timeline = buildTimeline(paragraphs);
  // 복기 카드 8장
  const recall = buildRecallCards(paragraphs, 8);

  const dayStr = String(dayIndex).padStart(3, '0');
  const contentId = `dr-r2-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(러셀 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "RUSSELL_2",
    schoolGradeRange: { min: 8, max: 9 },
    area: "READING",
    subArea,
    competencies: ["READING"],
    tags: ["daily"],
    access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 360,
    assets: {},
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline },
      recall,
      confirm: { questions: confirmQuestions }
    }
  };
}

function buildTimeline(paragraphs) {
  const timeline = [];
  let stepNum = 1;

  // 각 문단에서 문장 추출
  const paraSentMap = {};
  for (const p of paragraphs) {
    paraSentMap[p.id] = findSentences(p.text);
  }

  for (const para of paragraphs) {
    const sentences = paraSentMap[para.id];

    // 문장별 하이라이트 + 4지선다
    for (let si = 0; si < sentences.length; si++) {
      const sent = sentences[si];
      const correctText = truncate(sent.text, 80);

      // 오답: 다른 문단에서 문장 선택
      const wrongTexts = [];
      const otherParas = paragraphs.filter(p => p.id !== para.id);
      for (let oi = 0; oi < otherParas.length && wrongTexts.length < 3; oi++) {
        const opSents = paraSentMap[otherParas[oi].id];
        const idx = (si + oi) % opSents.length;
        wrongTexts.push(truncate(opSents[idx].text, 80));
      }

      const choices = shuffleChoices(correctText, wrongTexts, `s${stepNum}`);

      timeline.push({
        stepId: `s${stepNum++}`,
        highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] },
        question: {
          prompt: "하이라이트된 문장의 내용으로 알맞은 것은?",
          choices: choices.list,
          answerId: choices.answerId,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }

    // 문단 중심내용 문제
    const firstSent = sentences[0];
    const centralCorrect = truncate(firstSent.text, 80);
    const centralWrongs = [];
    const otherParas = paragraphs.filter(p => p.id !== para.id);
    for (const op of otherParas) {
      const opSents = paraSentMap[op.id];
      centralWrongs.push(truncate(opSents[0].text, 80));
    }
    const centralChoices = shuffleChoices(centralCorrect, centralWrongs, para.id + "_central");

    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        choices: centralChoices.list,
        answerId: centralChoices.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }

  return timeline;
}

function truncate(text, maxLen) {
  return text.length > maxLen ? text.substring(0, maxLen) : text;
}

function shuffleChoices(correct, wrongs, seed) {
  const items = [correct, ...wrongs.slice(0, 3)];
  // 정답 위치 결정
  const pos = hashIdx(seed) % 4;
  // 정답을 pos 위치로 이동
  if (pos !== 0) {
    const temp = items[0];
    items[0] = items[pos];
    items[pos] = temp;
  }
  const ids = ["A", "B", "C", "D"];
  const list = items.map((text, i) => ({ id: ids[i], text }));
  const answerId = ids[items.indexOf(correct)];
  return { list, answerId };
}

// 복기 카드 빌더 (8장)
function buildRecallCards(paragraphs, cardCount) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / cardCount);

  const cards = [];
  const correctOrder = [];

  for (let i = 0; i < cardCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    const cardText = fullText.substring(start, end);
    const cardId = `c${i + 1}`;
    cards.push({ id: cardId, text: cardText });
    correctOrder.push(cardId);
  }

  return { cards, correctOrder, seedPenalty: 1 };
}

// ─── 배치 아이템 래퍼 ───
function wrapBatchItem(content, dayIndex, subArea) {
  return {
    content_type: "DAILY_READING",
    level_id: "RUSSELL_2",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content
  };
}

// ─── 메인 실행 ───
function main() {
  console.log("=== 러셀2 Day 46~50 빌드 시작 ===\n");

  const contents = [
    buildDay46(),
    buildDay47(),
    buildDay48(),
    buildDay49(),
    buildDay50()
  ];

  // 검증
  let allValid = true;
  for (const c of contents) {
    const len = c.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
    const dayNum = parseInt(c.contentId.split('-')[2]);
    if (len < 1150 || len > 1250) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1150~1250)`);
      allValid = false;
    } else {
      console.log(`Day ${dayNum}: ${len}자 (적합)`);
    }

    if (c.payload.recall.cards.length !== 8) {
      console.warn(`경고: Day ${dayNum} 복기 카드 ${c.payload.recall.cards.length}장 (8장 필요)`);
      allValid = false;
    }

    const qCount = c.payload.confirm.questions.length;
    if (qCount < 5 || qCount > 8) {
      console.warn(`경고: Day ${dayNum} 확인 문항 ${qCount}개 (5~8개 필요)`);
      allValid = false;
    }
  }

  // static 파일 생성
  for (const c of contents) {
    const dayNum = parseInt(c.contentId.split('-')[2]);
    const dayStr = String(dayNum).padStart(3, '0');
    const filePath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(filePath, JSON.stringify(c, null, 2), 'utf8');
    console.log(`생성: ${dayStr}.json`);
  }

  // 배치 파일 갱신 (items[45]~items[49])
  console.log("\n배치 파일 갱신 중...");
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`현재 배치 items 수: ${batchData.items.length}`);

  const dayIndices = [46, 47, 48, 49, 50];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1; // items[45]~items[49]
    const subArea = contents[i].subArea;
    const batchItem = wrapBatchItem(contents[i], dayIdx, subArea);

    if (batchData.items[batchIdx]) {
      console.log(`교체: items[${batchIdx}] (${batchData.items[batchIdx].content.contentId} → ${contents[i].contentId})`);
    }
    batchData.items[batchIdx] = batchItem;
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료`);

  console.log("\n=== 빌드 완료 ===");
}

main();
