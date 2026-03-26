const fs = require('fs');
const path = require('path');

// ── 유틸리티 함수 ──

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

function charLen(paragraphs) { return paragraphs.reduce((sum, p) => sum + p.text.length, 0); }

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
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
  }
  return cards;
}

function makeConfirmQ(id, prompt, ranges) {
  return { id, prompt, answerRanges: ranges, scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: "ANY" };
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
    area: "READING", subArea, competencies: ["READING"], tags: ["daily"],
    access: { mode: "FREE" }, seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
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
  return { content_type: "DAILY_READING", level_id: "FREGE_2", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// ── Day 224: 짝수 → LITERATURE(문학) ──
function buildDay224() {
  const paragraphs = [
    {
      id: "p1",
      text: "할머니의 부엌에는 언제나 따뜻한 김이 피어올랐다. 새벽같이 일어나 아궁이에 불을 지피고, 커다란 가마솥에 쌀을 안치는 것이 할머니의 하루를 시작하는 의식이었다. 쌀이 익어 가는 동안 할머니는 마당에 나가 장독대의 뚜껑을 하나씩 열어 보며 된장과 간장의 상태를 살폈다. 그 장독대에는 할머니의 어머니, 그리고 그 어머니의 어머니에게서 이어져 내려온 손맛이 깃들어 있었다."
    },
    {
      id: "p2",
      text: "나는 방학 때마다 할머니 집에 놀러 갔다. 도시에서는 맡을 수 없는 나무 타는 냄새와 밥 짓는 냄새가 뒤섞인 그 공기가 좋았다. 할머니는 갓 지은 밥 위에 노릇하게 구운 달걀 프라이를 올려 주곤 했는데, 그 단순한 한 그릇이 세상 어떤 음식보다 맛있게 느껴졌다. 식사가 끝나면 할머니는 늘 부엌 한쪽에 앉아 무엇인가를 다듬거나 씻으며 내일 식사를 준비했다. 그 모습을 바라보는 것만으로도 마음이 편안해지곤 했다."
    },
    {
      id: "p3",
      text: "어느 해 겨울, 할머니가 편찮으셔서 부엌에 서지 못하게 되었다. 이모와 어머니가 대신 밥을 지었지만 같은 쌀, 같은 가마솥인데도 맛이 달랐다. 나는 그때 처음으로 음식의 맛이 재료나 도구만으로 결정되는 것이 아니라는 사실을 어렴풋이 깨달았다. 매일 같은 시간에 일어나 불을 살피고, 뜸을 들이는 그 시간의 두께가 밥맛을 만들어 내는 것이었다. 할머니가 누워 계시는 방에서는 기침 소리가 간간이 들려왔고, 나는 빈 부엌 앞에 서서 괜히 눈시울이 뜨거워졌다."
    },
    {
      id: "p4",
      text: "할머니는 이듬해 봄에 다시 건강을 되찾으셨다. 부엌으로 돌아온 할머니의 첫 번째 밥은 역시나 눈물이 날 만큼 맛있었다. 나는 그날 할머니의 주름진 손을 가만히 잡으며 생각했다. 이 손이 수십 년 동안 지어 온 밥의 무게를, 그리고 그 밥에 담긴 사랑의 깊이를 나는 아직 다 헤아리지 못한다고. 부엌에서 피어오르는 하얀 김은 여전히 따뜻했고, 그 따뜻함 속에서 나는 할머니와 함께하는 시간이 영원하기를 바랐다."
    }
  ];

  console.log(`Day 224 지문 글자수: ${charLen(paragraphs)}`);

  const confirmQuestions = [
    makeConfirmQ("q1", "할머니가 하루를 시작하는 의식은 무엇이었나?", [
      findRange(paragraphs, "p1", "새벽같이 일어나 아궁이에 불을 지피고, 커다란 가마솥에 쌀을 안치는 것이 할머니의 하루를 시작하는 의식이었다.")
    ]),
    makeConfirmQ("q2", "장독대에 깃들어 있는 것은 무엇인가?", [
      findRange(paragraphs, "p1", "할머니의 어머니, 그리고 그 어머니의 어머니에게서 이어져 내려온 손맛이 깃들어 있었다.")
    ]),
    makeConfirmQ("q3", "할머니가 갓 지은 밥 위에 올려 주던 것은 무엇인가?", [
      findRange(paragraphs, "p2", "노릇하게 구운 달걀 프라이를 올려 주곤 했는데")
    ]),
    makeConfirmQ("q4", "같은 쌀과 가마솥인데도 맛이 달랐던 이유는 무엇인가?", [
      findRange(paragraphs, "p3", "매일 같은 시간에 일어나 불을 살피고, 뜸을 들이는 그 시간의 두께가 밥맛을 만들어 내는 것이었다.")
    ]),
    makeConfirmQ("q5", "할머니가 건강을 되찾은 것은 언제인가?", [
      findRange(paragraphs, "p4", "할머니는 이듬해 봄에 다시 건강을 되찾으셨다.")
    ]),
    makeConfirmQ("q6", "화자가 할머니의 손을 잡으며 생각한 것은 무엇인가?", [
      findRange(paragraphs, "p4", "이 손이 수십 년 동안 지어 온 밥의 무게를, 그리고 그 밥에 담긴 사랑의 깊이를 나는 아직 다 헤아리지 못한다고.")
    ])
  ];

  return { content: assembleFull(224, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ── Day 225: 홀수 → NONFICTION(비문학) ──
function buildDay225() {
  const paragraphs = [
    {
      id: "p1",
      text: "지구의 대기는 여러 층으로 나뉘어 있으며, 각 층은 고유한 특성을 지닌다. 지표면에서 가장 가까운 대류권은 높이 약 십이 킬로미터까지 이어지며, 우리가 경험하는 날씨 현상은 대부분 이 층에서 발생한다. 대류권에서는 높이 올라갈수록 기온이 낮아지는데, 약 육 점 오 킬로미터 상승할 때마다 기온이 대략 일 도씩 내려간다. 이러한 기온 차이가 공기의 상승과 하강 운동을 일으켜 구름과 비, 바람 등의 기상 현상을 만들어 낸다."
    },
    {
      id: "p2",
      text: "대류권 위에는 성층권이 자리 잡고 있다. 성층권은 높이 약 오십 킬로미터까지 뻗어 있으며, 이 층의 가장 큰 특징은 오존층이 존재한다는 것이다. 오존층은 태양에서 오는 자외선을 흡수하여 지표면에 도달하는 유해한 자외선의 양을 크게 줄여 준다. 오존이 자외선을 흡수하는 과정에서 열이 발생하기 때문에 성층권에서는 높이 올라갈수록 오히려 기온이 상승하는 독특한 현상이 나타난다."
    },
    {
      id: "p3",
      text: "성층권 위의 중간권은 높이 약 팔십 킬로미터까지 이어지며, 다시 높이 올라갈수록 기온이 떨어져 대기 중 가장 낮은 온도를 기록하는 구간이다. 유성이 대기로 진입할 때 주로 이 층에서 마찰열에 의해 타면서 빛을 내는데, 우리가 밤하늘에서 보는 별똥별이 바로 이 현상이다. 중간권 위에는 열권이 있어 높이 올라갈수록 기온이 급격히 상승하며, 인공위성의 대부분이 이 영역에서 지구를 돌고 있다."
    },
    {
      id: "p4",
      text: "이처럼 대기의 각 층은 기온 변화 양상과 역할이 서로 다르다. 대류권은 생명체가 살아가는 데 필요한 날씨를 만들어 내고, 성층권의 오존층은 유해 자외선으로부터 생명체를 보호한다. 중간권은 우주에서 날아오는 작은 천체들을 태워 지표를 보호하며, 열권은 우주와 맞닿아 인류의 우주 활동이 이루어지는 공간을 제공한다. 대기의 이 같은 다층 구조가 없었다면 지구에서 생명이 유지되기는 매우 어려웠을 것이다."
    }
  ];

  console.log(`Day 225 지문 글자수: ${charLen(paragraphs)}`);

  const confirmQuestions = [
    makeConfirmQ("q1", "대류권에서 날씨 현상이 발생하는 원리는 무엇인가?", [
      findRange(paragraphs, "p1", "기온 차이가 공기의 상승과 하강 운동을 일으켜 구름과 비, 바람 등의 기상 현상을 만들어 낸다.")
    ]),
    makeConfirmQ("q2", "오존층의 역할은 무엇인가?", [
      findRange(paragraphs, "p2", "오존층은 태양에서 오는 자외선을 흡수하여 지표면에 도달하는 유해한 자외선의 양을 크게 줄여 준다.")
    ]),
    makeConfirmQ("q3", "성층권에서 높이 올라갈수록 기온이 상승하는 이유는 무엇인가?", [
      findRange(paragraphs, "p2", "오존이 자외선을 흡수하는 과정에서 열이 발생하기 때문에")
    ]),
    makeConfirmQ("q4", "별똥별은 어떻게 만들어지는가?", [
      findRange(paragraphs, "p3", "유성이 대기로 진입할 때 주로 이 층에서 마찰열에 의해 타면서 빛을 내는데")
    ]),
    makeConfirmQ("q5", "중간권의 보호 역할은 무엇인가?", [
      findRange(paragraphs, "p4", "중간권은 우주에서 날아오는 작은 천체들을 태워 지표를 보호하며")
    ]),
    makeConfirmQ("q6", "열권에서 이루어지는 활동은 무엇인가?", [
      findRange(paragraphs, "p4", "열권은 우주와 맞닿아 인류의 우주 활동이 이루어지는 공간을 제공한다.")
    ]),
    makeConfirmQ("q7", "대기의 다층 구조가 없었다면 어떤 결과가 예상되는가?", [
      findRange(paragraphs, "p4", "대기의 이 같은 다층 구조가 없었다면 지구에서 생명이 유지되기는 매우 어려웠을 것이다.")
    ])
  ];

  return { content: assembleFull(225, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ── Day 226: 짝수 → LITERATURE(문학) ──
function buildDay226() {
  const paragraphs = [
    {
      id: "p1",
      text: "여름방학이 시작되던 날, 나는 전학을 앞두고 마지막으로 학교 운동장을 찾았다. 텅 빈 운동장 한쪽에는 우리 반이 심었던 해바라기가 키를 훌쩍 넘겨 노란 꽃을 피우고 있었다. 봄에 씨앗을 뿌릴 때만 해도 아이들은 시큰둥했지만, 작은 싹이 올라오자 서로 물을 주겠다고 아침마다 달려왔던 기억이 떠올랐다. 나는 가장 크게 자란 해바라기 앞에 멈춰 서서 한참을 올려다보았다. 해바라기는 한여름 태양을 향해 고개를 곧추세우고 당당하게 서 있었다."
    },
    {
      id: "p2",
      text: "짝꿍이었던 민호가 자전거를 타고 운동장에 나타났다. 민호는 내가 전학 간다는 소식을 듣고 달려온 것이었다. 우리는 철봉 아래 그늘에 나란히 앉아 말없이 해바라기를 바라보았다. 한참 만에 민호가 입을 열었다. 저 해바라기 씨 좀 따 가라, 새 학교에 심으면 우리가 같이 키운 거라고 생각할 수 있으니까. 나는 고개를 끄덕이며 괜히 코끝이 찡해졌다."
    },
    {
      id: "p3",
      text: "민호와 나는 해바라기 씨를 서너 개씩 따서 종이에 싸서 나누어 가졌다. 민호는 자기도 집 앞 화분에 심어 볼 거라며 활짝 웃었다. 그 웃음이 해바라기를 닮아서, 나는 아무리 멀리 가더라도 이 친구를 잊지 못할 것 같다는 생각이 들었다. 운동장 위로 불어오는 여름바람에 해바라기들이 살랑살랑 고개를 흔들었다. 마치 우리에게 작별 인사를 건네는 것 같았다."
    },
    {
      id: "p4",
      text: "새 학교에서 첫 수업이 끝난 날 오후, 나는 교실 앞 작은 화단에 해바라기 씨앗을 심었다. 흙을 덮고 물을 주면서 민호와 함께 뛰놀던 운동장이 눈앞에 선명하게 떠올랐다. 씨앗이 싹을 틔우고 꽃을 피울 무렵이면 민호에게 사진을 보내야겠다고 마음먹었다. 서로 다른 곳에서 같은 해바라기가 자라고 있다는 사실이 왠지 든든하게 느껴졌다. 흙 위에 놓인 작은 씨앗 하나가 두 친구의 우정을 이어 주는 다리처럼 느껴졌다."
    }
  ];

  console.log(`Day 226 지문 글자수: ${charLen(paragraphs)}`);

  const confirmQuestions = [
    makeConfirmQ("q1", "화자가 마지막으로 학교 운동장을 찾은 이유는 무엇인가?", [
      findRange(paragraphs, "p1", "나는 전학을 앞두고 마지막으로 학교 운동장을 찾았다.")
    ]),
    makeConfirmQ("q2", "아이들이 아침마다 달려왔던 이유는 무엇인가?", [
      findRange(paragraphs, "p1", "작은 싹이 올라오자 서로 물을 주겠다고 아침마다 달려왔던 기억이 떠올랐다.")
    ]),
    makeConfirmQ("q3", "민호가 운동장에 나타난 이유는 무엇인가?", [
      findRange(paragraphs, "p2", "민호는 내가 전학 간다는 소식을 듣고 달려온 것이었다.")
    ]),
    makeConfirmQ("q4", "민호가 해바라기 씨를 따 가라고 한 이유는 무엇인가?", [
      findRange(paragraphs, "p2", "새 학교에 심으면 우리가 같이 키운 거라고 생각할 수 있으니까.")
    ]),
    makeConfirmQ("q5", "민호의 웃음이 화자에게 어떤 생각을 불러일으켰나?", [
      findRange(paragraphs, "p3", "그 웃음이 해바라기를 닮아서, 나는 아무리 멀리 가더라도 이 친구를 잊지 못할 것 같다는 생각이 들었다.")
    ]),
    makeConfirmQ("q6", "화자가 새 학교에서 해바라기 씨앗을 심으며 느낀 것은 무엇인가?", [
      findRange(paragraphs, "p4", "흙 위에 놓인 작은 씨앗 하나가 두 친구의 우정을 이어 주는 다리처럼 느껴졌다.")
    ])
  ];

  return { content: assembleFull(226, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ── Day 227: 홀수 → NONFICTION(비문학) ──
function buildDay227() {
  const paragraphs = [
    {
      id: "p1",
      text: "소리는 물체의 진동이 공기와 같은 매질을 통해 전달되는 파동이다. 물체가 진동하면 주변의 공기 분자가 밀리고 당겨지면서 밀한 부분과 소한 부분이 번갈아 나타나는 종파가 만들어진다. 이 파동이 사람의 귓속에 있는 고막을 진동시키면 우리는 소리를 듣게 된다. 소리의 빠르기는 매질의 종류와 온도에 따라 달라지는데, 섭씨 영 도의 공기 중에서 소리는 초속 약 삼백삼십일 미터의 속도로 이동한다."
    },
    {
      id: "p2",
      text: "소리에는 높낮이, 세기, 음색이라는 세 가지 성질이 있다. 소리의 높낮이는 진동수에 의해 결정되며, 진동수가 많을수록 높은 소리가 난다. 바이올린의 가는 줄은 빠르게 진동하여 높은 소리를 내고, 첼로의 굵은 줄은 느리게 진동하여 낮은 소리를 낸다. 소리의 세기는 진폭에 비례하여, 진폭이 클수록 큰 소리가 난다. 음색은 같은 높이의 소리라도 악기마다 다르게 들리는 이유를 설명해 주는 성질이다."
    },
    {
      id: "p3",
      text: "소리의 성질을 이용한 기술은 우리 생활 곳곳에 적용되어 있다. 초음파는 사람이 들을 수 없는 높은 진동수의 소리인데, 이를 이용하면 물체 내부를 들여다볼 수 있다. 병원에서 태아의 상태를 확인하는 초음파 검사나, 금속 내부의 결함을 찾아내는 비파괴 검사가 대표적이다. 또한 소나라는 장치는 소리를 바닷속으로 보낸 뒤 되돌아오는 시간을 측정하여 바다의 깊이나 물고기 떼의 위치를 파악하는 데 사용된다."
    },
    {
      id: "p4",
      text: "방음과 흡음 기술 역시 소리의 성질에 기반한다. 방음벽은 소리가 전달되는 경로를 차단하여 소음을 줄이는 구조물이며, 공연장의 벽면에 설치된 흡음재는 소리를 흡수하여 울림을 적절히 조절한다. 최근에는 소음과 정반대의 파형을 가진 소리를 발생시켜 소음을 상쇄하는 능동 소음 제거 기술도 널리 쓰이고 있다. 이처럼 소리에 대한 과학적 이해는 더 쾌적하고 안전한 생활환경을 만드는 데 기여하고 있다."
    }
  ];

  console.log(`Day 227 지문 글자수: ${charLen(paragraphs)}`);

  const confirmQuestions = [
    makeConfirmQ("q1", "소리가 전달되는 원리는 무엇인가?", [
      findRange(paragraphs, "p1", "물체가 진동하면 주변의 공기 분자가 밀리고 당겨지면서 밀한 부분과 소한 부분이 번갈아 나타나는 종파가 만들어진다.")
    ]),
    makeConfirmQ("q2", "소리의 높낮이를 결정하는 요소는 무엇인가?", [
      findRange(paragraphs, "p2", "소리의 높낮이는 진동수에 의해 결정되며, 진동수가 많을수록 높은 소리가 난다.")
    ]),
    makeConfirmQ("q3", "같은 높이의 소리가 악기마다 다르게 들리는 이유는 무엇인가?", [
      findRange(paragraphs, "p2", "음색은 같은 높이의 소리라도 악기마다 다르게 들리는 이유를 설명해 주는 성질이다.")
    ]),
    makeConfirmQ("q4", "초음파를 이용한 대표적인 사례는 무엇인가?", [
      findRange(paragraphs, "p3", "병원에서 태아의 상태를 확인하는 초음파 검사나, 금속 내부의 결함을 찾아내는 비파괴 검사가 대표적이다.")
    ]),
    makeConfirmQ("q5", "소나는 어떤 원리로 작동하는가?", [
      findRange(paragraphs, "p3", "소나라는 장치는 소리를 바닷속으로 보낸 뒤 되돌아오는 시간을 측정하여 바다의 깊이나 물고기 떼의 위치를 파악하는 데 사용된다.")
    ]),
    makeConfirmQ("q6", "능동 소음 제거 기술의 원리는 무엇인가?", [
      findRange(paragraphs, "p4", "소음과 정반대의 파형을 가진 소리를 발생시켜 소음을 상쇄하는 능동 소음 제거 기술도 널리 쓰이고 있다.")
    ])
  ];

  return { content: assembleFull(227, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ── Day 228: 짝수 → LITERATURE(문학) ──
function buildDay228() {
  const paragraphs = [
    {
      id: "p1",
      text: "동생이 태어나던 날, 아버지는 마당에 감나무 한 그루를 심었다. 갓 태어난 아기처럼 가늘고 여린 묘목이었지만 아버지는 이 나무가 크면 온 가족이 감을 따 먹을 수 있을 거라며 흐뭇하게 웃었다. 어린 나는 나무보다 동생에게 쏠리는 관심이 얄미워서 감나무에 관심을 두지 않았다. 그저 마당 한쪽에 가느다란 막대기 하나가 서 있는 것처럼 느껴질 뿐이었다."
    },
    {
      id: "p2",
      text: "세월이 흐르며 동생은 자라고, 감나무도 함께 자랐다. 동생이 초등학교에 입학하던 해에 감나무는 처음으로 주황빛 열매를 맺었다. 아버지는 온 가족을 불러 모아 첫 번째 감을 따며 기뻐했다. 어머니는 잘 익은 감으로 홍시를 만들어 이웃에게 나누어 주기도 했다. 동생은 감을 한 입 베어 물고는 달다며 환하게 웃었고, 나도 모르게 따라 웃었다. 그때 처음으로 감나무가 우리 가족의 일부라는 느낌이 들었다."
    },
    {
      id: "p3",
      text: "고등학생이 되어 입시 공부에 지칠 때면 나는 마당의 감나무 아래에 앉아 쉬곤 했다. 여름에는 넓은 잎사귀가 시원한 그늘을 만들어 주었고, 가을에는 주렁주렁 매달린 감이 풍성한 위안을 주었다. 동생도 가끔 옆에 와 앉아 함께 하늘을 올려다보았다. 어릴 때는 귀찮기만 하던 동생이 어느새 든든한 존재가 되어 있었다. 우리는 나무 아래에서 별다른 말 없이도 서로의 마음을 알 수 있는 사이가 되어 있었다."
    },
    {
      id: "p4",
      text: "대학에 합격하고 집을 떠나는 날 아침, 아버지는 감나무에서 딴 곶감 한 봉지를 가방에 넣어 주었다. 공부하다 힘들면 하나씩 먹으라는 말씀에 목이 메었다. 기차에 올라 창밖을 보니 멀어지는 집 마당에 감나무가 서 있었다. 이제 어른이 된 나처럼 그 나무도 우람하게 자라 있었다. 나는 그제야 아버지가 감나무를 심은 진짜 뜻을 알 것 같았다. 나무처럼 뿌리 깊이 이어지는 가족의 사랑을 심고 싶었던 것이라고."
    }
  ];

  console.log(`Day 228 지문 글자수: ${charLen(paragraphs)}`);

  const confirmQuestions = [
    makeConfirmQ("q1", "아버지가 감나무를 심은 때는 언제인가?", [
      findRange(paragraphs, "p1", "동생이 태어나던 날, 아버지는 마당에 감나무 한 그루를 심었다.")
    ]),
    makeConfirmQ("q2", "어린 화자가 감나무에 관심을 두지 않았던 이유는 무엇인가?", [
      findRange(paragraphs, "p1", "나무보다 동생에게 쏠리는 관심이 얄미워서 감나무에 관심을 두지 않았다.")
    ]),
    makeConfirmQ("q3", "감나무가 처음 열매를 맺은 것은 언제인가?", [
      findRange(paragraphs, "p2", "동생이 초등학교에 입학하던 해에 감나무는 처음으로 주황빛 열매를 맺었다.")
    ]),
    makeConfirmQ("q4", "감나무가 가족의 일부라는 느낌이 든 계기는 무엇인가?", [
      findRange(paragraphs, "p2", "동생은 감을 한 입 베어 물고는 달다며 환하게 웃었고, 나도 모르게 따라 웃었다.")
    ]),
    makeConfirmQ("q5", "화자가 입시 공부에 지칠 때 감나무 아래에서 얻은 것은 무엇인가?", [
      findRange(paragraphs, "p3", "여름에는 넓은 잎사귀가 시원한 그늘을 만들어 주었고, 가을에는 주렁주렁 매달린 감이 풍성한 위안을 주었다.")
    ]),
    makeConfirmQ("q6", "화자가 깨달은 아버지가 감나무를 심은 진짜 뜻은 무엇인가?", [
      findRange(paragraphs, "p4", "나무처럼 뿌리 깊이 이어지는 가족의 사랑을 심고 싶었던 것이라고.")
    ])
  ];

  return { content: assembleFull(228, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ── 실행부 ──
const results = [
  { dayIndex: 224, ...buildDay224() },
  { dayIndex: 225, ...buildDay225() },
  { dayIndex: 226, ...buildDay226() },
  { dayIndex: 227, ...buildDay227() },
  { dayIndex: 228, ...buildDay228() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});
const tempBatchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-f2-224-228.json');
fs.writeFileSync(tempBatchPath, JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ 임시 배치: ${tempBatchPath}`);
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
