const fs = require('fs');
const path = require('path');

// === 유틸리티 함수 ===
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
      const r = [{ paragraphId: para.id, start: sent.start, end: sent.end }];
      timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: r } });
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
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
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
    contentId: `dr-f2-${nn}`,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(프레게 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_2",
    schoolGradeRange: { min: 6, max: 6 },
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
    level_id: "FREGE_2",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content
  };
}

// === Day 199 (홀수 → 비문학: 과학 - 빛의 굴절) ===
// 목표: 850~950자
function buildDay199() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리가 물속에 있는 물체를 볼 때 실제보다 위쪽에 있는 것처럼 보이는 현상은 빛의 굴절 때문이다. 빛은 공기 중에서 물속으로 들어갈 때 속도가 느려지면서 진행 방향이 꺾이는데, 이 현상을 굴절이라고 한다. 굴절이 일어나는 까닭은 빛이 밀도가 서로 다른 매질을 지날 때 속도가 달라지기 때문이다. 공기보다 밀도가 높은 물이나 유리에서는 빛이 느려지며, 이러한 속도 차이가 빛의 경로를 휘게 만든다."
    },
    {
      id: "p2",
      text: "빛의 굴절은 일상에서 쉽게 관찰할 수 있다. 수영장에 들어가 보면 바닥이 실제보다 얕아 보이는 경험을 할 수 있는데, 이것은 물속에서 반사된 빛이 공기 중으로 나오면서 굴절되어 눈에 도달하기 때문이다. 유리컵에 물을 넣고 빨대를 꽂으면 빨대가 꺾여 보이는 것도 같은 원리이다. 물가에서 물고기를 잡을 때 눈에 보이는 위치보다 약간 아래를 겨냥해야 하는 까닭도 빛의 굴절 때문이다."
    },
    {
      id: "p3",
      text: "자연 현상에서도 빛의 굴절은 중요한 역할을 한다. 무지개는 햇빛이 빗방울 속으로 들어가면서 굴절되고 안쪽 면에서 반사된 뒤 다시 밖으로 나오며 한 번 더 굴절되어 생긴다. 이 과정에서 빛은 파장에 따라 서로 다른 각도로 꺾여 빨강부터 보라까지 일곱 가지 색으로 나뉜다. 사막이나 뜨거운 도로 위에서 보이는 신기루도 굴절로 설명할 수 있다. 지표면 가까이의 뜨거운 공기와 위쪽의 차가운 공기 사이에 밀도 차이가 생겨 빛이 점점 휘어지면서 먼 곳의 풍경이 지면 위에 비치는 것처럼 보이는 것이다."
    },
    {
      id: "p4",
      text: "빛의 굴절 원리는 과학 기술에도 널리 쓰인다. 안경이나 현미경, 망원경 같은 광학 기기는 유리 렌즈의 굴절을 이용하여 빛을 모으거나 퍼뜨린다. 볼록 렌즈는 빛을 모아 물체를 크게 보여 주고, 오목 렌즈는 빛을 퍼뜨려 먼 곳을 선명하게 볼 수 있게 한다. 광섬유 통신에서도 굴절과 전반사를 이용하여 정보를 먼 거리까지 빠르게 보낸다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "빛의 굴절이 일어나는 근본적인 원인은 무엇인가?", [
      findRange(paragraphs, "p1", "빛이 밀도가 서로 다른 매질을 지날 때 속도가 달라지기 때문이다.")
    ]),
    makeConfirmQ("q2", "수영장 바닥이 실제보다 얕아 보이는 이유는?", [
      findRange(paragraphs, "p2", "물속에서 반사된 빛이 공기 중으로 나오면서 굴절되어 눈에 도달하기 때문이다.")
    ]),
    makeConfirmQ("q3", "물가에서 물고기를 잡을 때 어디를 겨냥해야 하는가?", [
      findRange(paragraphs, "p2", "눈에 보이는 위치보다 약간 아래를 겨냥해야 하는 까닭도 빛의 굴절 때문이다.")
    ]),
    makeConfirmQ("q4", "무지개가 일곱 가지 색으로 나뉘는 까닭은?", [
      findRange(paragraphs, "p3", "빛은 파장에 따라 서로 다른 각도로 꺾여 빨강부터 보라까지 일곱 가지 색으로 나뉜다.")
    ]),
    makeConfirmQ("q5", "신기루가 나타나는 원리는?", [
      findRange(paragraphs, "p3", "지표면 가까이의 뜨거운 공기와 위쪽의 차가운 공기 사이에 밀도 차이가 생겨 빛이 점점 휘어지면서 먼 곳의 풍경이 지면 위에 비치는 것처럼 보이는 것이다.")
    ]),
    makeConfirmQ("q6", "볼록 렌즈와 오목 렌즈의 역할은?", [
      findRange(paragraphs, "p4", "볼록 렌즈는 빛을 모아 물체를 크게 보여 주고, 오목 렌즈는 빛을 퍼뜨려 먼 곳을 선명하게 볼 수 있게 한다.")
    ])
  ];

  const content = assembleFull(199, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === Day 200 (짝수 → 문학: 단편 이야기 - 할머니의 부채) ===
// 목표: 850~950자
function buildDay200() {
  const paragraphs = [
    {
      id: "p1",
      text: "여름방학이 시작되자 지호는 시골 할머니 댁으로 내려갔다. 도시에서는 에어컨 없이 버틸 수 없었지만, 할머니 댁에는 에어컨이 없었다. 대신 할머니는 오래된 부채를 꺼내 건넸다. 부채는 대나무 살이 군데군데 벌어져 있었고, 한지 위에 그려진 산수화도 빛이 바래 있었다. 지호는 시큰둥하게 받아 들었다. 할머니는 그것이 할아버지가 직접 깎아 만드신 거라고 말씀하셨다."
    },
    {
      id: "p2",
      text: "그날 저녁 마당에서 수박을 먹는데 모기가 덤벼들었다. 지호가 손으로 팔을 때리며 짜증을 내자, 할머니는 부채를 들어 지호 쪽을 부쳐 주었다. 부드러운 바람에 모기가 물러가고, 축축했던 이마가 서늘해졌다. 지호는 부채 바람이 에어컨 바람과는 다른 종류의 시원함을 가지고 있다는 것을 처음으로 느꼈다. 에어컨 바람은 차갑게 내리꽂히지만, 부채 바람은 살결 위를 가만히 쓸어 주는 것 같았다. 할머니는 바람은 세기가 아니라 정성이라고 조용히 말씀하셨다."
    },
    {
      id: "p3",
      text: "며칠 뒤 지호는 뒷마루에 앉아 부채를 유심히 살펴보았다. 대나무 살 사이에 가느다란 실이 감겨 있었고, 벌어진 부분을 풀로 정성스럽게 붙인 흔적이 보였다. 할머니는 할아버지가 돌아가시기 전 마지막으로 손보신 것이 그 부채라고 하셨다. 할아버지는 손재주가 좋아 집 안 물건을 직접 고치곤 했는데, 마지막까지 부채를 놓지 않으셨다. 지호는 벌어진 살 사이를 손끝으로 조심스럽게 쓸어 보았다. 그 틈새에 할아버지의 온기가 아직 남아 있는 것 같았다."
    },
    {
      id: "p4",
      text: "방학이 끝나고 돌아가는 날, 지호는 할머니께 부채를 가져가도 되느냐고 조심스럽게 물었다. 할머니는 놀란 표정을 짓더니 이내 환하게 웃으시며 가져가라고 하셨다. 지호는 부서지지 않게 가방 양쪽에 옷가지를 촘촘히 채워 넣었다. 기차에서 에어컨이 나오는데도 부채를 꺼내 한 번 부쳐 보았다. 할머니 마당의 수박 향기와 풀벌레 소리가 함께 불어오는 것 같았다. 지호는 부채를 가슴에 안으며, 시원한 건 바람이 아니라 사람이라는 생각을 했다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "할머니가 건넨 부채는 어떤 상태였는가?", [
      findRange(paragraphs, "p1", "대나무 살이 군데군데 벌어져 있었고, 한지 위에 그려진 산수화도 빛이 바래 있었다.")
    ]),
    makeConfirmQ("q2", "부채 바람과 에어컨 바람의 차이는?", [
      findRange(paragraphs, "p2", "에어컨 바람은 차갑게 내리꽂히지만, 부채 바람은 살결 위를 가만히 쓸어 주는 것 같았다.")
    ]),
    makeConfirmQ("q3", "할머니가 바람에 대해 한 말은?", [
      findRange(paragraphs, "p2", "바람은 세기가 아니라 정성이라고 조용히 말씀하셨다.")
    ]),
    makeConfirmQ("q4", "할아버지가 마지막으로 손보신 것은?", [
      findRange(paragraphs, "p3", "할아버지가 돌아가시기 전 마지막으로 손보신 것이 그 부채라고 하셨다.")
    ]),
    makeConfirmQ("q5", "지호가 부채 틈새에서 느낀 것은?", [
      findRange(paragraphs, "p3", "그 틈새에 할아버지의 온기가 아직 남아 있는 것 같았다.")
    ]),
    makeConfirmQ("q6", "기차에서 부채를 부쳤을 때 느낀 것은?", [
      findRange(paragraphs, "p4", "할머니 마당의 수박 향기와 풀벌레 소리가 함께 불어오는 것 같았다.")
    ]),
    makeConfirmQ("q7", "지호가 마지막에 깨달은 것은?", [
      findRange(paragraphs, "p4", "시원한 건 바람이 아니라 사람이라는 생각을 했다.")
    ])
  ];

  const content = assembleFull(200, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === Day 201 (홀수 → 비문학: 사회 - 공정 무역) ===
// 목표: 850~950자
function buildDay201() {
  const paragraphs = [
    {
      id: "p1",
      text: "커피 한 잔의 가격 중에서 실제로 원두를 재배한 농부에게 돌아가는 몫은 매우 적다. 전체 가격의 약 1퍼센트에서 3퍼센트 정도만이 생산 농가의 수입이 되고, 나머지는 가공과 유통, 판매 과정에서 분배된다. 이런 불균형한 구조 속에서 개발도상국의 소규모 농가들은 생산 비용조차 건지지 못하는 경우가 많다. 커피뿐 아니라 카카오, 면화, 바나나 같은 농산물에서도 비슷한 문제가 반복되고 있다."
    },
    {
      id: "p2",
      text: "이런 문제를 해결하기 위해 등장한 것이 공정 무역이다. 공정 무역은 생산자에게 정당한 대가를 지급하고, 안정적인 거래 관계를 유지하며, 아동 노동을 금지하는 것을 원칙으로 삼는다. 공정 무역 인증 제품에는 최저 보장 가격이 정해져 있어 국제 시세가 크게 떨어져도 농부들이 일정 수준의 수입을 얻을 수 있다. 또한 공정 무역 단체는 생산지 공동체에 교육과 의료 지원 프로그램을 운영하여 삶의 질을 높이는 데 기여하기도 한다."
    },
    {
      id: "p3",
      text: "그러나 공정 무역에 대한 비판도 존재한다. 인증 비용이 높아서 가장 가난한 농가는 오히려 참여하기 어렵다는 지적이 있다. 소비자 가격이 올라도 그 인상분이 모두 농부에게 돌아가지 않는 경우도 있다. 일부 연구자는 공정 무역이 근본적 빈곤 문제를 해결하기보다 소비자의 윤리적 만족감을 충족하는 데 그친다고 본다. 따라서 효과를 높이려면 투명한 가격 공개와 함께 생산 농가의 자립 역량을 강화하는 방향으로 제도가 발전해야 한다."
    },
    {
      id: "p4",
      text: "최근에는 공정 무역의 범위가 식품을 넘어 의류와 화장품, 수공예품 분야까지 확대되고 있다. 소비자들 사이에서도 값이 싼 제품보다 윤리적으로 생산된 제품을 선택하려는 움직임이 커지고 있다. 한 잔의 커피를 고를 때 그 뒤에 있는 사람들의 노동과 삶을 떠올리는 것이 공정 무역의 출발점이다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "커피 가격 중 생산 농가에 돌아가는 비율은?", [
      findRange(paragraphs, "p1", "전체 가격의 약 1퍼센트에서 3퍼센트 정도만이 생산 농가의 수입이 되고")
    ]),
    makeConfirmQ("q2", "공정 무역의 핵심 원칙은?", [
      findRange(paragraphs, "p2", "생산자에게 정당한 대가를 지급하고, 안정적인 거래 관계를 유지하며, 아동 노동을 금지하는 것을 원칙으로 삼는다.")
    ]),
    makeConfirmQ("q3", "최저 보장 가격이 농부에게 주는 이점은?", [
      findRange(paragraphs, "p2", "국제 시세가 크게 떨어져도 농부들이 일정 수준의 수입을 얻을 수 있다.")
    ]),
    makeConfirmQ("q4", "인증 비용과 관련한 비판은?", [
      findRange(paragraphs, "p3", "인증 비용이 높아서 가장 가난한 농가는 오히려 참여하기 어렵다는 지적이 있다.")
    ]),
    makeConfirmQ("q5", "공정 무역의 효과를 높이기 위해 필요한 것은?", [
      findRange(paragraphs, "p3", "투명한 가격 공개와 함께 생산 농가의 자립 역량을 강화하는 방향으로 제도가 발전해야 한다.")
    ]),
    makeConfirmQ("q6", "공정 무역의 출발점이란?", [
      findRange(paragraphs, "p4", "한 잔의 커피를 고를 때 그 뒤에 있는 사람들의 노동과 삶을 떠올리는 것이 공정 무역의 출발점이다.")
    ])
  ];

  const content = assembleFull(201, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === Day 202 (짝수 → 문학: 단편 이야기 - 도서관의 낡은 의자) ===
// 목표: 850~950자
function buildDay202() {
  const paragraphs = [
    {
      id: "p1",
      text: "학교 도서관 구석에 등받이가 삐걱거리는 낡은 나무 의자 하나가 있었다. 다른 의자들은 모두 파란 플라스틱이었지만 그것만 나무로 되어 있었고, 앉으면 삐걱 소리가 났다. 아이들은 소리가 나면 주변에서 쳐다보기 때문에 그 자리를 피했다. 덕분에 늘 비어 있었고, 거기 앉으면 아무한테도 방해받지 않고 책을 읽을 수 있었다. 유진이가 그 의자를 자기 자리로 삼기 시작한 건 5학년 봄이었다."
    },
    {
      id: "p2",
      text: "유진이는 쉬는 시간마다 도서관으로 달려가 그 의자에 앉았다. 처음에는 삐걱거리는 소리가 부끄러웠지만, 책에 빠져들면 소리가 더는 신경 쓰이지 않았다. 어느 날 같은 반 수아가 옆 책장에서 책을 고르다 그 의자 불편하지 않느냐고 물었다. 유진이는 좀 시끄럽지만 아무도 안 앉으니까 항상 자리가 있다고 답했다. 수아는 나도 옆에 앉아도 되냐고 했지만, 옆에 나무 의자는 없었다. 유진이가 방석이라도 놓을까 하자, 수아는 괜찮다며 파란 의자를 끌고 와서 나란히 앉았다."
    },
    {
      id: "p3",
      text: "그날부터 둘은 매일 도서관에서 나란히 책을 읽었다. 유진이가 자세를 고치면 삐걱 소리가 나고 수아가 킥킥 웃었다. 그러던 어느 날 사서 선생님이 낡은 의자를 새것으로 바꾸겠다는 공지를 붙였다. 유진이는 공지를 보고 한참 가만히 서 있었다. 수아가 새 의자가 오면 편하겠다고 했지만, 유진이는 대답하지 않았다. 점심시간에 유진이는 사서 선생님을 찾아가 그 의자를 버리지 말고 자기에게 달라고 부탁했다."
    },
    {
      id: "p4",
      text: "선생님은 의아한 표정을 지었지만, 유진이의 진지한 눈빛을 보고 그러마 하고 끄덕이셨다. 새 의자가 온 날 유진이는 낡은 나무 의자를 교실 뒤편에 가져다 놓았다. 수아가 왜 가져왔느냐고 물었다. 유진이는 잠시 생각하다가 이 의자가 삐걱거려서 아무도 안 앉았고, 아무도 안 앉아서 내가 앉을 수 있었고, 내가 거기 앉아 있어서 네가 옆에 왔다고 말했다. 수아는 아무 말 없이 등받이를 가만히 눌렀다. 삐걱, 하고 작은 소리가 났다. 둘은 동시에 웃었다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "아이들이 낡은 의자를 피한 이유는?", [
      findRange(paragraphs, "p1", "소리가 나면 주변에서 쳐다보기 때문에 그 자리를 피했다.")
    ]),
    makeConfirmQ("q2", "유진이가 그 의자를 자기 자리로 삼은 시기는?", [
      findRange(paragraphs, "p1", "유진이가 그 의자를 자기 자리로 삼기 시작한 건 5학년 봄이었다.")
    ]),
    makeConfirmQ("q3", "유진이가 그 자리를 좋아한 이유는?", [
      findRange(paragraphs, "p2", "좀 시끄럽지만 아무도 안 앉으니까 항상 자리가 있다고 답했다.")
    ]),
    makeConfirmQ("q4", "사서 선생님의 공지 내용은?", [
      findRange(paragraphs, "p3", "사서 선생님이 낡은 의자를 새것으로 바꾸겠다는 공지를 붙였다.")
    ]),
    makeConfirmQ("q5", "유진이가 선생님에게 부탁한 것은?", [
      findRange(paragraphs, "p3", "그 의자를 버리지 말고 자기에게 달라고 부탁했다.")
    ]),
    makeConfirmQ("q6", "유진이가 의자를 가져온 이유는?", [
      findRange(paragraphs, "p4", "이 의자가 삐걱거려서 아무도 안 앉았고, 아무도 안 앉아서 내가 앉을 수 있었고, 내가 거기 앉아 있어서 네가 옆에 왔다고 말했다.")
    ])
  ];

  const content = assembleFull(202, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// === Day 203 (홀수 → 비문학: 환경 - 미세 플라스틱) ===
// 목표: 850~950자
function buildDay203() {
  const paragraphs = [
    {
      id: "p1",
      text: "미세 플라스틱이란 크기가 5밀리미터 이하인 아주 작은 플라스틱 조각을 말한다. 미세 플라스틱은 크게 두 종류로 나뉜다. 처음부터 작게 만들어진 1차 미세 플라스틱과, 큰 플라스틱 제품이 자외선이나 파도에 의해 잘게 부서져 생긴 2차 미세 플라스틱이 있다. 1차에 해당하는 것은 치약이나 세안제에 포함된 미세 알갱이, 합성 섬유 의류에서 세탁 중 빠져나오는 극세사 등이다. 2차는 바다에 버려진 페트병이나 비닐이 오랜 시간 동안 잘게 쪼개져 만들어진다."
    },
    {
      id: "p2",
      text: "미세 플라스틱의 가장 큰 문제는 한번 환경에 유입되면 자연적으로 분해되지 않는다는 점이다. 플라스틱은 수백 년이 지나도 사라지지 않고 크기만 줄어든다. 작아진 조각은 하수 처리 필터도 통과하여 강과 바다로 흘러든다. 바다에 도달한 미세 플라스틱은 플랑크톤이나 물고기가 먹이로 착각하여 먹게 된다. 먹이 사슬을 따라 점점 큰 동물에 축적되며, 결국 인간의 식탁에도 올라올 수 있다."
    },
    {
      id: "p3",
      text: "최근 연구에 따르면 사람의 혈액과 폐 조직에서도 미세 플라스틱이 검출되었다. 생수병이나 일회용 컵을 통해 섭취하거나, 공기 중에 떠도는 극미세 입자를 호흡으로 들이마시는 경로가 밝혀졌다. 인체에 미치는 장기적 영향은 아직 정확히 밝혀지지 않았으나, 세포 손상과 염증 반응을 유발할 수 있다는 보고가 있다. 플라스틱에 흡착된 유해 화학 물질이 체내에서 방출될 우려도 제기된다."
    },
    {
      id: "p4",
      text: "미세 플라스틱 문제를 줄이기 위해서는 여러 차원의 노력이 필요하다. 개인은 일회용 플라스틱 사용을 줄이고 합성 섬유 세탁 시 미세 플라스틱 필터를 사용하면 도움이 된다. 기업은 생분해성 포장재를 개발하고 설계 단계부터 플라스틱 사용을 최소화해야 한다. 정부는 배출 기준을 강화하고 하수 처리 기술을 개선해야 한다. 이 문제는 한 나라만의 노력으로 해결되지 않으므로 국제적 협력이 반드시 뒷받침되어야 한다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "미세 플라스틱의 정의는?", [
      findRange(paragraphs, "p1", "크기가 5밀리미터 이하인 아주 작은 플라스틱 조각을 말한다.")
    ]),
    makeConfirmQ("q2", "1차 미세 플라스틱의 예는?", [
      findRange(paragraphs, "p1", "치약이나 세안제에 포함된 미세 알갱이, 합성 섬유 의류에서 세탁 중 빠져나오는 극세사 등이다.")
    ]),
    makeConfirmQ("q3", "미세 플라스틱이 문제가 되는 핵심 이유는?", [
      findRange(paragraphs, "p2", "한번 환경에 유입되면 자연적으로 분해되지 않는다는 점이다.")
    ]),
    makeConfirmQ("q4", "미세 플라스틱이 인간 식탁에 오는 경로는?", [
      findRange(paragraphs, "p2", "먹이 사슬을 따라 점점 큰 동물에 축적되며, 결국 인간의 식탁에도 올라올 수 있다.")
    ]),
    makeConfirmQ("q5", "인체에서 미세 플라스틱이 발견된 곳은?", [
      findRange(paragraphs, "p3", "사람의 혈액과 폐 조직에서도 미세 플라스틱이 검출되었다.")
    ]),
    makeConfirmQ("q6", "개인이 할 수 있는 노력은?", [
      findRange(paragraphs, "p4", "일회용 플라스틱 사용을 줄이고 합성 섬유 세탁 시 미세 플라스틱 필터를 사용하면 도움이 된다.")
    ]),
    makeConfirmQ("q7", "국제 협력이 필요한 이유는?", [
      findRange(paragraphs, "p4", "이 문제는 한 나라만의 노력으로 해결되지 않으므로 국제적 협력이 반드시 뒷받침되어야 한다.")
    ])
  ];

  const content = assembleFull(203, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// === 실행부 ===
const results = [
  { dayIndex: 199, ...buildDay199() },
  { dayIndex: 200, ...buildDay200() },
  { dayIndex: 201, ...buildDay201() },
  { dayIndex: 202, ...buildDay202() },
  { dayIndex: 203, ...buildDay203() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];

results.forEach(({ dayIndex, content, subArea }) => {
  // static JSON 파일 저장
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);

  // 배치 아이템 수집
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

// 임시 배치 파일에 저장
const newDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
const tempBatchPath = path.join(newDir, 'batch-f2-199-203.json');
fs.writeFileSync(tempBatchPath, JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ 임시 배치: ${tempBatchPath}`);

// 검증
console.log('\n=== 검증 결과 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
