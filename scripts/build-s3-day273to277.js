const fs = require('fs');
const path = require('path');

// === 공통 유틸 ===
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
      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] }
      });
    });
    stepNum++;
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] }
    });
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
    contentId: `dr-s3-${nn}`,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(소쉬르 3) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "SAUSSURE_3",
    schoolGradeRange: { min: 5, max: 5 },
    area: "READING",
    subArea,
    competencies: ["READING"],
    tags: ["daily"],
    access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480,
    assets: {},
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
    content_type: "DAILY_READING",
    level_id: "SAUSSURE_3",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content
  };
}

// === Day 273 (홀수 -> 비문학) ===
function buildDay273() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리가 먹는 음식물은 입에서 시작하여 식도, 위, 소장, 대장을 거쳐 몸 밖으로 나간다. 이 과정을 소화라고 한다. 소화는 음식물을 잘게 부수고 영양소를 흡수할 수 있는 형태로 바꾸는 일이다. 입에서는 이로 음식을 씹어 잘게 부수고 침 속의 소화 효소가 녹말을 분해하기 시작한다. 씹은 음식물은 식도를 통해 위로 내려가는데 식도는 근육이 물결치듯 움직여 음식물을 아래로 밀어 보내 준다. 이처럼 소화는 여러 기관이 차례로 역할을 나누어 하는 과정이다."
    },
    {
      id: "p2",
      text: "위에서는 위액이 나와 음식물을 더 잘게 분해한다. 위액에는 강한 산성 물질이 들어 있어 세균을 죽이고 단백질을 녹이는 역할을 한다. 위에서 잘 섞인 음식물은 걸쭉한 죽처럼 변하여 소장으로 이동한다. 소장은 약 6미터나 되는 긴 관으로 이곳에서 영양소의 대부분이 흡수된다. 소장 안쪽 벽에는 융털이라는 작은 돌기가 빽빽하게 나 있어 표면적을 넓혀 영양소를 효율적으로 흡수한다."
    },
    {
      id: "p3",
      text: "소장에서 영양소가 흡수되고 남은 찌꺼기는 대장으로 간다. 대장에서는 수분을 흡수하여 찌꺼기를 점점 딱딱하게 만든다. 이렇게 만들어진 것이 대변이며 항문을 통해 몸 밖으로 배출된다. 음식물이 입에서 항문까지 이동하는 데에는 보통 하루에서 이틀 정도 걸린다. 우리 몸의 소화 기관은 서로 긴밀하게 협력하여 음식물에서 필요한 영양소를 빠짐없이 흡수하고 쓸모없는 것은 밖으로 내보내는 놀라운 일을 해낸다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "소화란 무엇인가요?", [findRange(paragraphs, "p1", "소화는 음식물을 잘게 부수고 영양소를 흡수할 수 있는 형태로 바꾸는 일이다.")]),
    makeConfirmQ("q2", "입에서 일어나는 소화 과정은?", [findRange(paragraphs, "p1", "입에서는 이로 음식을 씹어 잘게 부수고 침 속의 소화 효소가 녹말을 분해하기 시작한다.")]),
    makeConfirmQ("q3", "위액의 역할은 무엇인가요?", [findRange(paragraphs, "p2", "위액에는 강한 산성 물질이 들어 있어 세균을 죽이고 단백질을 녹이는 역할을 한다.")]),
    makeConfirmQ("q4", "소장의 길이는 얼마인가요?", [findRange(paragraphs, "p2", "소장은 약 6미터나 되는 긴 관으로 이곳에서 영양소의 대부분이 흡수된다.")]),
    makeConfirmQ("q5", "융털의 역할은 무엇인가요?", [findRange(paragraphs, "p2", "소장 안쪽 벽에는 융털이라는 작은 돌기가 빽빽하게 나 있어 표면적을 넓혀 영양소를 효율적으로 흡수한다.")]),
    makeConfirmQ("q6", "대장에서 일어나는 일은?", [findRange(paragraphs, "p3", "대장에서는 수분을 흡수하여 찌꺼기를 점점 딱딱하게 만든다.")]),
    makeConfirmQ("q7", "음식물이 소화되는 데 걸리는 시간은?", [findRange(paragraphs, "p3", "음식물이 입에서 항문까지 이동하는 데에는 보통 하루에서 이틀 정도 걸린다.")])
  ];

  return { content: assembleFull(273, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 274 (짝수 -> 문학) ===
function buildDay274() {
  const paragraphs = [
    {
      id: "p1",
      text: "준서는 여름 방학이 되자 시골 할머니 댁으로 갔다. 할머니 집 뒤쪽에는 작은 텃밭이 있었고 할머니는 매일 이른 아침 텃밭에 나가 채소를 정성껏 돌보셨다. 준서는 도시에서 자랐기 때문에 흙을 만지는 것이 낯설고 벌레가 무서웠다. 할머니가 고추 모종을 함께 심자고 하셨을 때 준서는 마지못해 따라 나섰다. 장갑을 끼고 삽으로 흙을 파는데 손에 힘이 들어가지 않았다. 할머니는 웃으시며 천천히 하면 된다고 격려해 주셨다."
    },
    {
      id: "p2",
      text: "며칠이 지나자 준서는 텃밭에 나가는 것이 조금씩 즐거워졌다. 아침에 일어나면 먼저 고추 모종이 얼마나 자랐는지 살펴보았다. 작은 새싹이 초록색 잎을 틔우고 있었고 그 모습이 신기했다. 준서는 물뿌리개로 물을 주고 잡초도 뽑았다. 어느 날 고추 모종에서 하얀 꽃이 피었다. 준서는 기쁜 마음에 할머니를 불러 함께 구경했다. 할머니는 네가 정성껏 돌본 덕분이란다 하고 말씀하셨다."
    },
    {
      id: "p3",
      text: "방학이 끝나갈 무렵 드디어 고추가 빨갛게 익었다. 준서가 직접 정성을 다해 기른 고추였다. 할머니는 그 고추로 고추장을 담그셨고 준서는 뿌듯한 마음으로 한 병을 서울 집으로 가져왔다. 엄마가 그 고추장으로 비빔밥을 해 주셨는데 세상에서 가장 맛있었다. 준서는 일기장에 적었다. 처음에는 벌레가 무서웠는데 이제는 흙냄새가 좋다고. 다음 방학에도 할머니 댁에 가서 이번에는 빨간 토마토를 길러 보겠다고 마음먹었다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "준서가 처음에 텃밭을 싫어한 이유는?", [findRange(paragraphs, "p1", "준서는 도시에서 자랐기 때문에 흙을 만지는 것이 낯설고 벌레가 무서웠다.")]),
    makeConfirmQ("q2", "할머니가 준서에게 하자고 한 일은?", [findRange(paragraphs, "p1", "할머니가 고추 모종을 함께 심자고 하셨을 때 준서는 마지못해 따라 나섰다.")]),
    makeConfirmQ("q3", "준서가 아침에 일어나면 먼저 한 일은?", [findRange(paragraphs, "p2", "아침에 일어나면 먼저 고추 모종이 얼마나 자랐는지 살펴보았다.")]),
    makeConfirmQ("q4", "고추 모종에 어떤 변화가 일어났나요?", [findRange(paragraphs, "p2", "어느 날 고추 모종에서 하얀 꽃이 피었다.")]),
    makeConfirmQ("q5", "할머니가 익은 고추로 한 일은?", [findRange(paragraphs, "p3", "할머니는 그 고추로 고추장을 담그셨고 준서는 뿌듯한 마음으로 한 병을 서울 집으로 가져왔다.")]),
    makeConfirmQ("q6", "준서가 일기장에 적은 내용은?", [findRange(paragraphs, "p3", "처음에는 벌레가 무서웠는데 이제는 흙냄새가 좋다고.")]),
    makeConfirmQ("q7", "준서가 다음 방학에 하려는 일은?", [findRange(paragraphs, "p3", "다음 방학에도 할머니 댁에 가서 이번에는 빨간 토마토를 길러 보겠다고 마음먹었다.")])
  ];

  return { content: assembleFull(274, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 275 (홀수 -> 비문학) ===
function buildDay275() {
  const paragraphs = [
    {
      id: "p1",
      text: "지진은 땅속의 암석이 갑자기 부서지거나 어긋나면서 생기는 현상이다. 지구의 표면은 여러 개의 거대한 판으로 이루어져 있는데 이 판들이 서로 부딪치거나 어긋날 때 지진이 발생한다. 지진이 일어나면 땅이 흔들리고 건물이 무너지기도 하며 산사태가 일어나기도 한다. 지진의 세기는 규모라는 단위로 나타내는데 규모가 클수록 더 강한 지진을 뜻한다. 규모 5 이상의 지진은 건물에 피해를 줄 수 있고 규모 7 이상이면 도시 전체가 파괴될 수 있다."
    },
    {
      id: "p2",
      text: "지진이 바다 밑에서 일어나면 해일이 발생할 수 있다. 해일은 바닷물이 거대한 파도가 되어 해안가를 덮치는 현상이다. 해일의 파도 높이는 10미터를 넘기도 하여 큰 피해를 준다. 지진이 자주 발생하는 나라에서는 내진 설계를 통해 건물이 흔들림에 잘 버틸 수 있도록 만든다. 일본은 세계에서 지진이 가장 많이 발생하는 나라 중 하나로 건물의 내진 설계 기술이 매우 발달해 있다."
    },
    {
      id: "p3",
      text: "우리나라에서도 지진이 발생하고 있다. 2016년 경주에서 규모 5.8의 지진이 일어나 많은 사람들이 놀랐고 2017년에는 포항에서 규모 5.4의 지진이 발생했다. 이처럼 우리나라도 지진의 안전지대가 아니므로 평소에 지진 대비 훈련을 하는 것이 중요하다. 지진이 발생하면 튼튼한 책상 아래로 들어가 머리를 보호하고 흔들림이 멈추면 밖으로 대피해야 한다. 엘리베이터는 타지 말고 계단을 이용하는 것이 안전하다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "지진이 발생하는 원인은?", [findRange(paragraphs, "p1", "지구의 표면은 여러 개의 거대한 판으로 이루어져 있는데 이 판들이 서로 부딪치거나 어긋날 때 지진이 발생한다.")]),
    makeConfirmQ("q2", "지진의 세기를 나타내는 단위는?", [findRange(paragraphs, "p1", "지진의 세기는 규모라는 단위로 나타내는데 규모가 클수록 더 강한 지진을 뜻한다.")]),
    makeConfirmQ("q3", "해일이란 무엇인가요?", [findRange(paragraphs, "p2", "해일은 바닷물이 거대한 파도가 되어 해안가를 덮치는 현상이다.")]),
    makeConfirmQ("q4", "내진 설계란 무엇인가요?", [findRange(paragraphs, "p2", "내진 설계를 통해 건물이 흔들림에 잘 버틸 수 있도록 만든다.")]),
    makeConfirmQ("q5", "2016년 경주 지진의 규모는?", [findRange(paragraphs, "p3", "2016년 경주에서 규모 5.8의 지진이 일어나 많은 사람들이 놀랐고")]),
    makeConfirmQ("q6", "지진이 발생하면 가장 먼저 해야 할 일은?", [findRange(paragraphs, "p3", "지진이 발생하면 튼튼한 책상 아래로 들어가 머리를 보호하고 흔들림이 멈추면 밖으로 대피해야 한다.")]),
    makeConfirmQ("q7", "지진 시 이용하면 안 되는 것은?", [findRange(paragraphs, "p3", "엘리베이터는 타지 말고 계단을 이용하는 것이 안전하다.")])
  ];

  return { content: assembleFull(275, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 276 (짝수 -> 문학) ===
function buildDay276() {
  const paragraphs = [
    {
      id: "p1",
      text: "민지는 학교에서 열리는 그림 그리기 대회에 나가기로 했다. 그림을 잘 그리는 편은 아니었지만 미술 시간에 선생님이 네 그림에는 따뜻한 마음이 담겨 있다고 칭찬해 주신 것이 용기가 되었다. 민지는 무엇을 그릴지 며칠 동안 고민하다가 매일 학교 앞에서 교통 안전을 도와주시는 할아버지를 그리기로 했다. 할아버지는 비가 오나 눈이 오나 한결같이 아이들의 안전을 지켜 주셨다."
    },
    {
      id: "p2",
      text: "민지는 스케치북을 펼치고 할아버지의 모습을 그리기 시작했다. 노란 조끼를 입고 깃발을 든 할아버지 옆으로 아이들이 즐겁게 횡단보도를 건너는 장면이었다. 배경에는 학교 건물과 노란 은행나무를 넣었다. 색칠을 하면서 민지는 할아버지의 주름진 손과 따뜻한 미소를 정성껏 표현했다. 완성된 그림을 보니 꽤 마음에 들었다. 하지만 다른 친구들의 그림도 하나같이 멋져서 과연 상을 받을 수 있을지 살짝 걱정이 되었다."
    },
    {
      id: "p3",
      text: "드디어 대회 결과가 발표되는 날이 왔고 민지의 그림이 장려상을 받았다. 일등은 아니었지만 민지는 무척 기뻤다. 심사평에는 일상 속 고마운 분을 떠올리며 그린 따뜻한 마음이 느껴진다고 적혀 있었다. 민지는 상장을 들고 학교 앞으로 달려가 할아버지께 보여 드렸다. 할아버지는 환하게 웃으시며 우리 민지가 이런 멋진 그림을 그려 줬구나 하고 고마워하셨다. 민지는 할아버지의 웃는 얼굴을 보며 상보다 더 큰 보람을 느꼈다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "민지가 대회에 나간 계기는?", [findRange(paragraphs, "p1", "미술 시간에 선생님이 네 그림에는 따뜻한 마음이 담겨 있다고 칭찬해 주신 것이 용기가 되었다.")]),
    makeConfirmQ("q2", "민지가 그리기로 한 대상은?", [findRange(paragraphs, "p1", "매일 학교 앞에서 교통 안전을 도와주시는 할아버지를 그리기로 했다.")]),
    makeConfirmQ("q3", "민지가 그린 그림의 장면은?", [findRange(paragraphs, "p2", "노란 조끼를 입고 깃발을 든 할아버지 옆으로 아이들이 즐겁게 횡단보도를 건너는 장면이었다.")]),
    makeConfirmQ("q4", "민지가 그림에서 정성껏 표현한 부분은?", [findRange(paragraphs, "p2", "민지는 할아버지의 주름진 손과 따뜻한 미소를 정성껏 표현했다.")]),
    makeConfirmQ("q5", "민지가 받은 상의 이름은?", [findRange(paragraphs, "p3", "드디어 대회 결과가 발표되는 날이 왔고 민지의 그림이 장려상을 받았다.")]),
    makeConfirmQ("q6", "심사평에 적힌 내용은?", [findRange(paragraphs, "p3", "일상 속 고마운 분을 떠올리며 그린 따뜻한 마음이 느껴진다고 적혀 있었다.")]),
    makeConfirmQ("q7", "민지가 상보다 더 크게 느낀 것은?", [findRange(paragraphs, "p3", "민지는 할아버지의 웃는 얼굴을 보며 상보다 더 큰 보람을 느꼈다.")])
  ];

  return { content: assembleFull(276, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 277 (홀수 -> 비문학) ===
function buildDay277() {
  const paragraphs = [
    {
      id: "p1",
      text: "꿀벌은 꽃에서 꿀을 모으는 곤충으로 우리 생활에 매우 중요한 역할을 한다. 꿀벌이 꽃에 앉아 꿀을 빨 때 몸에 꽃가루가 묻는데 이 꽃가루가 다른 꽃으로 옮겨지면서 수분이 이루어진다. 수분은 식물이 열매를 맺기 위해 반드시 필요한 과정이다. 우리가 먹는 사과, 배, 수박 같은 과일의 대부분은 꿀벌의 도움 없이는 열매를 맺기 어렵다. 꿀벌은 꿀과 밀랍도 만들어 내어 오래전부터 사람과 함께 살아온 곤충이다."
    },
    {
      id: "p2",
      text: "꿀벌은 사회적인 곤충으로 한 벌집에 수만 마리가 함께 산다. 벌집 안에는 여왕벌, 일벌, 수벌이 각자 맡은 역할이 있다. 여왕벌은 알을 낳아 벌의 수를 유지하고 수벌은 여왕벌과 짝짓기를 한다. 일벌은 꿀을 모으고 벌집을 짓고 새끼를 돌보는 등 가장 많은 일을 한다. 일벌은 춤을 추어 동료에게 꽃이 있는 위치와 거리를 알려 주기도 하는데 이것을 벌의 춤이라고 부른다."
    },
    {
      id: "p3",
      text: "최근 전 세계적으로 꿀벌의 수가 급격히 줄어들고 있어 큰 걱정을 낳고 있다. 농약 사용과 환경 오염이 꿀벌이 사라지는 주요 원인으로 꼽힌다. 꿀벌이 사라지면 식물의 수분이 이루어지지 않아 농작물 생산량이 크게 줄어들 수 있다. 과학자들은 꿀벌 없이는 인류의 식량 공급에 심각한 문제가 생길 수 있다고 경고한다. 꿀벌을 보호하기 위해 농약 사용을 줄이고 꿀벌이 살 수 있는 환경을 만들어 주는 노력이 필요하다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "수분이란 무엇인가요?", [findRange(paragraphs, "p1", "수분은 식물이 열매를 맺기 위해 반드시 필요한 과정이다.")]),
    makeConfirmQ("q2", "꿀벌의 도움이 필요한 과일의 예는?", [findRange(paragraphs, "p1", "우리가 먹는 사과, 배, 수박 같은 과일의 대부분은 꿀벌의 도움 없이는 열매를 맺기 어렵다.")]),
    makeConfirmQ("q3", "벌집 안에서 일벌이 하는 일은?", [findRange(paragraphs, "p2", "일벌은 꿀을 모으고 벌집을 짓고 새끼를 돌보는 등 가장 많은 일을 한다.")]),
    makeConfirmQ("q4", "벌의 춤은 무엇을 알려 주나요?", [findRange(paragraphs, "p2", "일벌은 춤을 추어 동료에게 꽃이 있는 위치와 거리를 알려 주기도 하는데 이것을 벌의 춤이라고 부른다.")]),
    makeConfirmQ("q5", "꿀벌이 사라지는 주요 원인은?", [findRange(paragraphs, "p3", "농약 사용과 환경 오염이 꿀벌이 사라지는 주요 원인으로 꼽힌다.")]),
    makeConfirmQ("q6", "꿀벌이 사라지면 어떤 문제가 생기나요?", [findRange(paragraphs, "p3", "꿀벌이 사라지면 식물의 수분이 이루어지지 않아 농작물 생산량이 크게 줄어들 수 있다.")]),
    makeConfirmQ("q7", "꿀벌을 보호하기 위한 노력은?", [findRange(paragraphs, "p3", "꿀벌을 보호하기 위해 농약 사용을 줄이고 꿀벌이 살 수 있는 환경을 만들어 주는 노력이 필요하다.")])
  ];

  return { content: assembleFull(277, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === 실행부 ===
const results = [
  { dayIndex: 273, ...buildDay273() },
  { dayIndex: 274, ...buildDay274() },
  { dayIndex: 275, ...buildDay275() },
  { dayIndex: 276, ...buildDay276() },
  { dayIndex: 277, ...buildDay277() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];

results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

const newDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
fs.writeFileSync(path.join(newDir, 'batch-s3-273-277.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ batch-s3-273-277.json 저장 완료`);

console.log('\n=== 검증 결과 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
