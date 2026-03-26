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

// === Day 293 (홀수 -> 비문학) ===
function buildDay293() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리 몸속에는 면역 체계라는 방어 시스템이 있다. 면역 체계는 세균이나 바이러스 같은 외부 침입자가 몸에 들어왔을 때 이를 찾아내어 없애는 역할을 한다. 면역 체계의 가장 기본적인 방어선은 피부와 점막이다. 피부는 세균이 몸 안으로 들어오지 못하도록 막아 주고 코와 입의 점막은 끈적한 액체로 이물질을 붙잡아 걸러 낸다. 이처럼 피부와 점막은 마치 성벽과 같은 역할을 하여 우리 몸을 1차적으로 보호한다."
    },
    {
      id: "p2",
      text: "피부와 점막을 뚫고 세균이 들어오면 백혈구가 나서서 싸운다. 백혈구는 혈액 속에 있는 세포로 몸 곳곳을 돌아다니며 침입한 세균을 잡아먹는다. 백혈구 중에서도 특히 대식세포는 세균을 통째로 삼켜서 소화시키는 능력이 뛰어나다. 또한 림프구라는 백혈구는 특정 세균을 기억하여 같은 세균이 다시 들어왔을 때 더 빠르게 대응할 수 있다. 예방 접종이 효과적인 이유가 바로 이 림프구의 기억 능력 덕분이다."
    },
    {
      id: "p3",
      text: "면역력을 높이기 위해서는 균형 잡힌 식사와 충분한 수면이 중요하다. 과일과 채소에 들어 있는 비타민은 면역 세포가 활발하게 활동하도록 도와준다. 또한 하루에 여덟 시간 이상 잠을 자면 몸이 피로를 회복하고 면역 체계가 튼튼해진다. 규칙적인 운동도 면역력을 강화하는 데 도움이 된다. 반대로 스트레스를 많이 받거나 잠이 부족하면 면역력이 떨어져 감기에 걸리기 쉽다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "면역 체계의 역할은 무엇인가요?", [findRange(paragraphs, "p1", "면역 체계는 세균이나 바이러스 같은 외부 침입자가 몸에 들어왔을 때 이를 찾아내어 없애는 역할을 한다.")]),
    makeConfirmQ("q2", "피부와 점막이 하는 일은?", [findRange(paragraphs, "p1", "피부는 세균이 몸 안으로 들어오지 못하도록 막아 주고 코와 입의 점막은 끈적한 액체로 이물질을 붙잡아 걸러 낸다.")]),
    makeConfirmQ("q3", "백혈구의 역할은 무엇인가요?", [findRange(paragraphs, "p2", "백혈구는 혈액 속에 있는 세포로 몸 곳곳을 돌아다니며 침입한 세균을 잡아먹는다.")]),
    makeConfirmQ("q4", "대식세포의 특별한 능력은?", [findRange(paragraphs, "p2", "대식세포는 세균을 통째로 삼켜서 소화시키는 능력이 뛰어나다.")]),
    makeConfirmQ("q5", "예방 접종이 효과적인 이유는?", [findRange(paragraphs, "p2", "예방 접종이 효과적인 이유가 바로 이 림프구의 기억 능력 덕분이다.")]),
    makeConfirmQ("q6", "면역력을 높이는 방법은?", [findRange(paragraphs, "p3", "면역력을 높이기 위해서는 균형 잡힌 식사와 충분한 수면이 중요하다.")]),
    makeConfirmQ("q7", "면역력이 떨어지는 원인은?", [findRange(paragraphs, "p3", "스트레스를 많이 받거나 잠이 부족하면 면역력이 떨어져 감기에 걸리기 쉽다.")])
  ];

  return { content: assembleFull(293, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 294 (짝수 -> 문학) ===
function buildDay294() {
  const paragraphs = [
    {
      id: "p1",
      text: "민재는 매일 아침 할머니네 텃밭에 가서 물을 주는 것이 일과였다. 할머니는 올해 봄에 토마토와 고추 그리고 상추를 심으셨다. 민재는 작은 물뿌리개를 들고 한 포기 한 포기 정성스럽게 물을 뿌렸다. 할머니는 식물도 사람처럼 정성을 주면 더 잘 자란단다 하고 말씀하셨다. 민재는 반신반의하면서도 매일 빠지지 않고 텃밭을 찾아갔다. 어느 날 토마토 줄기에 작은 노란 꽃이 피어 있는 것을 발견하고 민재는 가슴이 두근거렸다."
    },
    {
      id: "p2",
      text: "여름이 되자 텃밭은 푸른 잎으로 가득 찼다. 토마토는 초록색 열매를 맺기 시작했고 고추도 손가락만 한 크기로 자라고 있었다. 민재는 열매가 빨갛게 익기를 매일 기다렸다. 그런데 어느 날 밤 갑자기 소나기가 쏟아져 고추 몇 포기가 쓰러지고 말았다. 다음 날 아침 텃밭을 본 민재는 속상한 마음에 눈물이 글썽거렸다. 할머니가 괜찮다 다시 세워 주면 된단다 하며 함께 쓰러진 고추를 일으켜 세우고 지지대를 묶어 주셨다."
    },
    {
      id: "p3",
      text: "가을이 가까워지자 토마토는 빨갛게 익었고 고추도 윤기가 나는 붉은색으로 변했다. 민재는 할머니와 함께 잘 익은 토마토를 한 바구니 가득 땄다. 할머니는 이 토마토로 맛있는 소스를 만들어 줄게 하며 웃으셨다. 민재는 직접 키운 토마토를 한 입 베어 물었는데 달콤한 맛이 입안 가득 퍼졌다. 민재는 처음으로 무언가를 끈기 있게 해낸 자신이 뿌듯했다. 할머니에게 내년에는 수박도 심고 싶다고 말하자 할머니는 크게 웃으시며 그래 같이 해 보자꾸나 하셨다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "민재가 매일 아침 한 일은?", [findRange(paragraphs, "p1", "민재는 매일 아침 할머니네 텃밭에 가서 물을 주는 것이 일과였다.")]),
    makeConfirmQ("q2", "할머니가 심은 채소는?", [findRange(paragraphs, "p1", "할머니는 올해 봄에 토마토와 고추 그리고 상추를 심으셨다.")]),
    makeConfirmQ("q3", "민재가 가슴이 두근거린 이유는?", [findRange(paragraphs, "p1", "토마토 줄기에 작은 노란 꽃이 피어 있는 것을 발견하고 민재는 가슴이 두근거렸다.")]),
    makeConfirmQ("q4", "소나기로 인한 피해는?", [findRange(paragraphs, "p2", "소나기가 쏟아져 고추 몇 포기가 쓰러지고 말았다.")]),
    makeConfirmQ("q5", "할머니가 쓰러진 고추를 어떻게 했나요?", [findRange(paragraphs, "p2", "함께 쓰러진 고추를 일으켜 세우고 지지대를 묶어 주셨다.")]),
    makeConfirmQ("q6", "민재가 토마토를 먹었을 때 느낀 맛은?", [findRange(paragraphs, "p3", "민재는 직접 키운 토마토를 한 입 베어 물었는데 달콤한 맛이 입안 가득 퍼졌다.")]),
    makeConfirmQ("q7", "민재가 내년에 하고 싶다고 한 것은?", [findRange(paragraphs, "p3", "내년에는 수박도 심고 싶다고 말하자 할머니는 크게 웃으시며 그래 같이 해 보자꾸나 하셨다.")])
  ];

  return { content: assembleFull(294, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 295 (홀수 -> 비문학) ===
function buildDay295() {
  const paragraphs = [
    {
      id: "p1",
      text: "소리는 물체가 떨릴 때 만들어지는 파동이다. 기타 줄을 튕기면 줄이 빠르게 떨리면서 소리가 나고 북을 치면 북의 가죽이 떨리면서 둥둥 소리가 난다. 이렇게 물체가 떨려서 만들어진 진동은 공기를 타고 사방으로 퍼져 나간다. 공기 속의 작은 알갱이들이 서로 부딪치면서 진동을 전달하는 것이다. 이 진동이 우리 귀의 고막에 닿으면 뇌가 이를 소리로 인식하게 된다."
    },
    {
      id: "p2",
      text: "소리에는 높낮이와 크기와 음색이라는 세 가지 성질이 있다. 소리의 높낮이는 물체가 떨리는 빠르기에 따라 달라진다. 빠르게 떨리면 높은 소리가 나고 느리게 떨리면 낮은 소리가 난다. 소리의 크기는 물체가 떨리는 폭에 따라 결정된다. 크게 떨리면 큰 소리가 나고 작게 떨리면 작은 소리가 난다. 음색은 같은 높이의 소리라도 악기마다 느낌이 다르게 들리는 성질을 말하는데 바이올린과 피아노의 소리가 다르게 느껴지는 것이 바로 음색의 차이 때문이다."
    },
    {
      id: "p3",
      text: "소리는 공기뿐만 아니라 물이나 고체를 통해서도 전달된다. 수영장 속에서 물장구 소리가 들리는 것은 물이 소리를 전달하기 때문이다. 실전화기를 만들어 실을 팽팽하게 당기면 실을 통해 소리가 전달되는 것을 직접 경험할 수 있다. 다만 소리는 진공 상태에서는 전달되지 않는다. 우주 공간에서는 공기가 없기 때문에 아무리 큰 소리를 내어도 들을 수 없다. 이처럼 소리가 전달되려면 반드시 매질이라 불리는 물질이 있어야 한다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "소리는 어떻게 만들어지나요?", [findRange(paragraphs, "p1", "소리는 물체가 떨릴 때 만들어지는 파동이다.")]),
    makeConfirmQ("q2", "진동이 퍼져 나가는 과정은?", [findRange(paragraphs, "p1", "공기 속의 작은 알갱이들이 서로 부딪치면서 진동을 전달하는 것이다.")]),
    makeConfirmQ("q3", "소리의 세 가지 성질은?", [findRange(paragraphs, "p2", "소리에는 높낮이와 크기와 음색이라는 세 가지 성질이 있다.")]),
    makeConfirmQ("q4", "소리의 높낮이는 무엇에 따라 달라지나요?", [findRange(paragraphs, "p2", "소리의 높낮이는 물체가 떨리는 빠르기에 따라 달라진다.")]),
    makeConfirmQ("q5", "음색이란 무엇인가요?", [findRange(paragraphs, "p2", "음색은 같은 높이의 소리라도 악기마다 느낌이 다르게 들리는 성질을 말하는데")]),
    makeConfirmQ("q6", "소리가 전달되지 않는 곳은?", [findRange(paragraphs, "p3", "소리는 진공 상태에서는 전달되지 않는다.")]),
    makeConfirmQ("q7", "소리 전달에 필요한 것은?", [findRange(paragraphs, "p3", "소리가 전달되려면 반드시 매질이라 불리는 물질이 있어야 한다.")])
  ];

  return { content: assembleFull(295, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 296 (짝수 -> 문학) ===
function buildDay296() {
  const paragraphs = [
    {
      id: "p1",
      text: "서윤이네 반에서는 이번 주에 역할극 발표를 하기로 했다. 서윤이는 대본을 쓰는 역할을 맡았고 같은 모둠의 준호는 배경 그림을 그리기로 했다. 서윤이는 전래 동화 흥부와 놀부를 각색하여 대본을 완성했다. 모둠 친구들에게 대본을 나눠 주고 연습을 시작했는데 자꾸 대사가 엉키고 동선이 헷갈려서 처음에는 엉망이었다. 서윤이는 포기하고 싶은 마음이 살짝 들었지만 친구들과 약속한 발표를 망칠 수는 없다고 생각했다."
    },
    {
      id: "p2",
      text: "다음 날부터 모둠 친구들은 쉬는 시간마다 모여 연습을 했다. 준호가 만든 배경 그림은 초가집과 기와집이 나란히 그려져 있어 무대 분위기를 잘 살려 주었다. 서윤이는 대사를 외우기 어려워하는 친구를 위해 핵심 단어만 적은 쪽지를 만들어 주었다. 연습을 거듭하자 대사도 자연스러워지고 표정 연기도 나아졌다. 발표 전날 마지막 리허설에서 모둠원 모두가 실수 없이 연기를 마쳤을 때 서윤이는 우리가 해냈다며 주먹을 불끈 쥐었다."
    },
    {
      id: "p3",
      text: "드디어 발표 날이 되었다. 서윤이네 모둠이 무대 위에 올라서자 반 친구들의 시선이 집중되었다. 흥부가 제비 다리를 고쳐 주는 장면에서 관객석에서 웃음이 터져 나왔고 놀부가 혼나는 장면에서는 박수가 쏟아졌다. 발표가 끝나자 담임 선생님은 준비를 참 열심히 했구나 하며 칭찬해 주셨다. 서윤이는 혼자였으면 절대 못 했을 거라고 생각하며 모둠 친구들에게 고마움을 느꼈다. 집에 돌아온 서윤이는 일기장에 함께하면 어려운 일도 해낼 수 있다는 것을 배웠다고 적었다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "서윤이가 맡은 역할은?", [findRange(paragraphs, "p1", "서윤이는 대본을 쓰는 역할을 맡았고")]),
    makeConfirmQ("q2", "서윤이가 각색한 동화는?", [findRange(paragraphs, "p1", "서윤이는 전래 동화 흥부와 놀부를 각색하여 대본을 완성했다.")]),
    makeConfirmQ("q3", "준호가 그린 배경 그림은?", [findRange(paragraphs, "p2", "준호가 만든 배경 그림은 초가집과 기와집이 나란히 그려져 있어 무대 분위기를 잘 살려 주었다.")]),
    makeConfirmQ("q4", "서윤이가 친구를 도운 방법은?", [findRange(paragraphs, "p2", "서윤이는 대사를 외우기 어려워하는 친구를 위해 핵심 단어만 적은 쪽지를 만들어 주었다.")]),
    makeConfirmQ("q5", "관객석에서 웃음이 터진 장면은?", [findRange(paragraphs, "p3", "흥부가 제비 다리를 고쳐 주는 장면에서 관객석에서 웃음이 터져 나왔고")]),
    makeConfirmQ("q6", "담임 선생님의 반응은?", [findRange(paragraphs, "p3", "담임 선생님은 준비를 참 열심히 했구나 하며 칭찬해 주셨다.")]),
    makeConfirmQ("q7", "서윤이가 일기장에 적은 내용은?", [findRange(paragraphs, "p3", "함께하면 어려운 일도 해낼 수 있다는 것을 배웠다고 적었다.")])
  ];

  return { content: assembleFull(296, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 297 (홀수 -> 비문학) ===
function buildDay297() {
  const paragraphs = [
    {
      id: "p1",
      text: "지구의 표면은 여러 개의 거대한 판으로 이루어져 있는데 이를 지각판이라 부른다. 지각판은 지구 내부의 뜨거운 맨틀 위에 떠 있으며 아주 느린 속도로 끊임없이 움직이고 있다. 지각판이 서로 부딪치거나 벌어지면서 지진이나 화산 폭발 같은 자연현상이 일어난다. 지진은 지각판의 경계에서 주로 발생하며 땅이 갑자기 흔들리는 현상을 말한다. 한 해에 전 세계적으로 수만 건의 지진이 일어나지만 대부분은 사람이 느끼지 못할 정도로 약한 지진이다."
    },
    {
      id: "p2",
      text: "화산은 지구 내부의 뜨거운 마그마가 지표면 위로 분출하는 현상이다. 마그마는 지구 깊은 곳에서 암석이 녹아서 만들어진 것으로 엄청난 열과 압력을 가지고 있다. 마그마가 화산 구멍을 통해 밖으로 나오면 용암이라 부르고 이 용암이 식으면 새로운 땅이 만들어진다. 하와이 같은 섬은 바다 밑에서 용암이 계속 쌓여서 생긴 화산섬이다. 화산 폭발은 위험하지만 화산재가 쌓인 토양은 영양분이 풍부하여 농사짓기에 좋다."
    },
    {
      id: "p3",
      text: "지진과 화산에 대비하기 위해 과학자들은 다양한 관측 장비를 사용하고 있다. 지진계는 땅의 흔들림을 감지하여 지진의 세기와 발생 위치를 알려 주는 장치이다. 화산 관측소에서는 화산 주변의 온도 변화와 가스 방출량을 측정하여 분화 가능성을 예측한다. 우리나라에서도 기상청이 전국에 지진 관측소를 운영하며 지진 발생 시 국민에게 신속하게 경보를 보내고 있다. 평소에 지진 대비 훈련을 하고 비상용품을 준비해 두면 갑작스러운 지진에도 침착하게 대응할 수 있다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "지각판이란 무엇인가요?", [findRange(paragraphs, "p1", "지구의 표면은 여러 개의 거대한 판으로 이루어져 있는데 이를 지각판이라 부른다.")]),
    makeConfirmQ("q2", "지진이 발생하는 원인은?", [findRange(paragraphs, "p1", "지각판이 서로 부딪치거나 벌어지면서 지진이나 화산 폭발 같은 자연현상이 일어난다.")]),
    makeConfirmQ("q3", "마그마란 무엇인가요?", [findRange(paragraphs, "p2", "마그마는 지구 깊은 곳에서 암석이 녹아서 만들어진 것으로 엄청난 열과 압력을 가지고 있다.")]),
    makeConfirmQ("q4", "하와이 같은 섬이 만들어진 과정은?", [findRange(paragraphs, "p2", "하와이 같은 섬은 바다 밑에서 용암이 계속 쌓여서 생긴 화산섬이다.")]),
    makeConfirmQ("q5", "화산 폭발의 긍정적인 면은?", [findRange(paragraphs, "p2", "화산재가 쌓인 토양은 영양분이 풍부하여 농사짓기에 좋다.")]),
    makeConfirmQ("q6", "지진계의 역할은?", [findRange(paragraphs, "p3", "지진계는 땅의 흔들림을 감지하여 지진의 세기와 발생 위치를 알려 주는 장치이다.")]),
    makeConfirmQ("q7", "지진에 대비하는 방법은?", [findRange(paragraphs, "p3", "평소에 지진 대비 훈련을 하고 비상용품을 준비해 두면 갑작스러운 지진에도 침착하게 대응할 수 있다.")])
  ];

  return { content: assembleFull(297, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === 실행부 ===
const results = [
  { dayIndex: 293, ...buildDay293() },
  { dayIndex: 294, ...buildDay294() },
  { dayIndex: 295, ...buildDay295() },
  { dayIndex: 296, ...buildDay296() },
  { dayIndex: 297, ...buildDay297() }
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
fs.writeFileSync(path.join(newDir, 'batch-s3-293-297.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ batch-s3-293-297.json 저장 완료`);

console.log('\n=== 검증 결과 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
