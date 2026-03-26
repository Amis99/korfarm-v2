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

function hashIdx(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
  return h;
}

function truncate(text, maxLen) {
  return text.length <= maxLen ? text : text.substring(0, maxLen) + '…';
}

function shuffleChoices(choices, seed) {
  const arr = [...choices];
  let h = typeof seed === 'number' ? seed : hashIdx(String(seed));
  for (let i = arr.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeStep(stepId, ranges, prompt, choices, answerId) {
  return {
    stepId,
    highlight: { ranges },
    question: {
      prompt,
      choices: choices.map(([id, text]) => ({ id, text })),
      answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  };
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

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, timeline, cards, confirmQs) {
  const nn = String(dayIndex).padStart(3, '0');
  return {
    contentId: `dr-f3-${nn}`,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(프레게 3) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_3",
    schoolGradeRange: { min: 6, max: 7 },
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
      confirm: { questions: confirmQs }
    }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return {
    content_type: "DAILY_READING",
    level_id: "FREGE_3",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content
  };
}

// =============================================
// === Day 71 비문학: 소리의 전달과 반사 (1002자) ===
// =============================================
function buildDay71() {
  const p1text = "소리는 물체가 진동할 때 발생하며, 공기와 같은 매질을 통해 사방으로 퍼져 나간다. 기타 줄을 튕기면 줄이 빠르게 떨리면서 주변 공기 분자를 밀어내고, 이 밀림이 연쇄적으로 전해져 우리의 귀에 도달하면 비로소 소리를 듣게 된다. 소리의 빠르기를 음속이라 하는데, 공기 중에서 음속은 초당 약 삼백사십 미터이며 온도가 높을수록 공기 분자의 운동이 활발해져 조금 더 빨라진다. 물속에서는 분자 간 거리가 가까워 공기보다 약 네 배 빠르게 전달되고, 쇠와 같은 고체에서는 더욱 빠르다. 반대로 진공 상태에서는 진동을 전달해 줄 매질이 없기 때문에 소리가 전혀 전달되지 않는다. 우주 공간이 아무리 큰 폭발이 일어나도 고요한 이유가 바로 진공이기 때문이다.";
  const p2text = "소리는 단단한 장애물을 만나면 되돌아오는 성질이 있는데, 이를 반사라 한다. 산에서 크게 외치면 잠시 뒤 메아리가 들려오는 것이 소리 반사의 대표적인 예이다. 메아리가 되돌아오는 데 걸리는 시간을 정밀하게 측정하면 자신과 절벽 사이의 거리를 정확히 계산할 수 있다. 음속에 시간의 절반을 곱하면 되는데, 절반을 곱하는 이유는 소리가 갔다가 되돌아오는 왕복 거리이기 때문이다. 이 원리는 어선이 바다에서 사용하는 어군 탐지기와 병원의 의료용 초음파 검사에도 그대로 적용된다. 어군 탐지기는 초음파를 바닷속 깊이 쏘아 물고기 떼에 부딪혀 돌아오는 시간으로 물고기의 위치와 깊이를 파악한다.";
  const p3text = "소리의 반사를 잘 활용하면 우리 생활이 편리해지지만, 원하지 않는 반사가 일어나면 불쾌한 소음이 되기도 한다. 콘서트 홀을 설계할 때는 벽면의 재질과 각도를 세밀하게 조절하여 무대 위의 소리가 객석 전체에 고르게 퍼지도록 한다. 반대로 녹음실이나 영화관에서는 벽과 천장에 흡음재를 붙여 불필요한 반사를 최대한 줄인다. 도로변 방음벽은 자동차와 오토바이 소리가 인근 주거 지역으로 넘어오지 못하도록 소리를 차단하거나 흡수하는 중요한 역할을 한다. 이처럼 소리의 성질을 정확히 이해하면 좋은 소리는 살리고 불필요한 소리는 효과적으로 줄이는 데 활용할 수 있다. 과학 시간에 배우는 음파 단원이 우리 실생활 곳곳에서 쓰이고 있는 셈이다.";

  const paragraphs = [
    { id: "p1", text: p1text },
    { id: "p2", text: p2text },
    { id: "p3", text: p3text }
  ];

  const s1 = findSentences(p1text);
  const s2 = findSentences(p2text);
  const s3 = findSentences(p3text);

  let stepNum = 0;
  const timeline = [];

  // p1 (6문장)
  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "소리가 발생하는 원리는 무엇인가요?";
      choices = [["A","물체가 진동할 때 발생한다"],["B","빛이 반사될 때 발생한다"],["C","열이 전달될 때 발생한다"],["D","바람이 불 때만 발생한다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "기타 줄의 소리가 귀에 전달되는 과정은 어떠한가요?";
      choices = [["A","줄의 떨림이 공기 분자를 밀어내고 연쇄적으로 전해진다"],["B","줄에서 바로 귀로 날아온다"],["C","줄의 색깔이 변하면서 전달된다"],["D","줄이 공기를 흡수하면서 전달된다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "공기 중 음속은 대략 얼마인가요?";
      choices = [["A","초당 약 삼백사십 미터"],["B","초당 약 십 미터"],["C","초당 약 천 미터"],["D","초당 약 백 미터"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "물속에서의 소리 전달 속도는 공기 중과 비교하면 어떠한가요?";
      choices = [["A","약 네 배 빠르다"],["B","거의 같다"],["C","절반 정도이다"],["D","전혀 전달되지 않는다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "진공 상태에서 소리가 전달되지 않는 이유는 무엇인가요?";
      choices = [["A","매질이 없기 때문이다"],["B","온도가 너무 높기 때문이다"],["C","빛이 없기 때문이다"],["D","중력이 없기 때문이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "우주 공간이 고요한 이유는 무엇인가요?";
      choices = [["A","진공이기 때문이다"],["B","소리가 너무 커서 들리지 않기 때문이다"],["C","우주에는 물체가 없기 때문이다"],["D","귀가 작동하지 않기 때문이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","소리는 진동으로 발생하며 매질에 따라 전달 속도가 다르다"],["B","소리는 진공에서 가장 빠르다"],["C","음속은 항상 일정하다"],["D","소리는 빛보다 빠르다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "소리가 장애물을 만나면 어떤 현상이 일어나나요?";
      choices = [["A","되돌아오는 반사가 일어난다"],["B","소리가 사라진다"],["C","소리가 더 커진다"],["D","소리의 높낮이가 변한다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "메아리는 어떤 현상의 대표적인 예인가요?";
      choices = [["A","소리 반사"],["B","소리 흡수"],["C","소리 굴절"],["D","소리 소멸"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "메아리를 이용해 알 수 있는 것은 무엇인가요?";
      choices = [["A","자신과 절벽 사이의 거리"],["B","절벽의 높이"],["C","바람의 세기"],["D","기온의 변화"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "거리 계산 시 시간의 절반을 곱하는 이유는 무엇인가요?";
      choices = [["A","소리가 왕복했기 때문이다"],["B","음속이 절반으로 줄기 때문이다"],["C","메아리가 두 번 들리기 때문이다"],["D","공기가 절반만 진동하기 때문이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "소리 반사 원리가 적용되는 분야로 언급된 것은 무엇인가요?";
      choices = [["A","어군 탐지기와 의료용 초음파 검사"],["B","라디오 방송과 텔레비전"],["C","인터넷 통신과 위성"],["D","자동차 엔진과 브레이크"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "어군 탐지기가 물고기 위치를 파악하는 방법은 무엇인가요?";
      choices = [["A","초음파를 쏘아 돌아오는 시간으로 파악한다"],["B","물고기의 색깔을 감지한다"],["C","수온 변화를 측정한다"],["D","해류의 방향을 분석한다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","소리의 반사 원리를 이용해 거리를 측정하거나 탐지 장비에 활용한다"],["B","메아리는 산에서만 일어난다"],["C","초음파는 의료에만 쓰인다"],["D","소리는 반사되지 않는다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "원하지 않는 소리 반사가 일어나면 어떻게 되나요?";
      choices = [["A","소음이 된다"],["B","음악이 된다"],["C","소리가 사라진다"],["D","소리가 작아진다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "콘서트 홀에서 벽면을 세밀하게 조절하는 이유는 무엇인가요?";
      choices = [["A","소리가 고르게 퍼지도록 하기 위해서이다"],["B","벽을 아름답게 꾸미기 위해서이다"],["C","소리를 완전히 차단하기 위해서이다"],["D","관객석을 넓히기 위해서이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "녹음실이나 영화관에서 흡음재를 사용하는 목적은 무엇인가요?";
      choices = [["A","반사를 최대한 줄이기 위해서이다"],["B","소리를 더 크게 하기 위해서이다"],["C","벽의 온도를 유지하기 위해서이다"],["D","벽을 보호하기 위해서이다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "도로변 방음벽의 역할은 무엇인가요?";
      choices = [["A","자동차 소리가 주거 지역으로 넘어오지 못하도록 차단하거나 흡수한다"],["B","도로를 아름답게 꾸민다"],["C","바람을 막아 준다"],["D","빗물을 모아 준다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "소리의 성질을 이해하면 어떤 것이 가능한가요?";
      choices = [["A","좋은 소리는 살리고 불필요한 소리는 줄일 수 있다"],["B","소리를 완전히 없앨 수 있다"],["C","모든 소리를 같은 크기로 만들 수 있다"],["D","소리의 색깔을 바꿀 수 있다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "마지막 문장의 핵심 메시지는 무엇인가요?";
      choices = [["A","음파 단원이 실생활 곳곳에서 쓰이고 있다"],["B","음파는 과학 시간에만 중요하다"],["C","소리는 우리 생활과 관련이 없다"],["D","음파는 아직 연구 중인 분야이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","소리의 반사 성질을 활용하거나 제어하여 생활을 편리하게 만든다"],["B","소음은 줄일 수 없다"],["C","콘서트 홀에서는 소리를 차단한다"],["D","방음벽은 소리를 크게 한다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "소리의 빠르기를 부르는 용어는 무엇인가요?",
      [findRange(paragraphs, "p1", "음속")]),
    makeConfirmQ("q2", "진공 상태에서 소리가 전달되지 않는 이유가 되는 것은 무엇인가요?",
      [findRange(paragraphs, "p1", "매질이 없기 때문")]),
    makeConfirmQ("q3", "소리가 장애물을 만나 되돌아오는 성질을 무엇이라 하나요?",
      [findRange(paragraphs, "p2", "반사")]),
    makeConfirmQ("q4", "어선이 물고기 떼를 찾을 때 사용하는 장비는 무엇인가요?",
      [findRange(paragraphs, "p2", "어군 탐지기")]),
    makeConfirmQ("q5", "녹음실에서 벽에 붙이는 재질은 무엇인가요?",
      [findRange(paragraphs, "p3", "흡음재")]),
    makeConfirmQ("q6", "도로변에서 소리를 차단하는 구조물은 무엇인가요?",
      [findRange(paragraphs, "p3", "방음벽")])
  ];

  return assembleFull(71, "NONFICTION", "비문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 72 문학: 편지를 쓰는 아이 (1008자) ===
// =============================================
function buildDay72() {
  const p1text = "열두 살 소희는 한 달 전 시골 할머니 댁에서 돌아온 뒤로 마음이 허전했다. 방학 동안 할머니와 마당에서 수박을 먹고, 개울에서 올챙이를 잡고, 밤에는 마루에 누워 별을 세던 날들이 자꾸 떠올랐다. 엄마에게 할머니 보고 싶다고 말하자, 엄마는 편지를 써 보면 어떻겠니라고 다정하게 제안하셨다. 소희는 요즘 누가 편지를 쓰느냐며 투덜거렸지만, 책상 서랍에서 편지지와 봉투를 발견하고는 자리에 앉았다. 무엇을 써야 할지 한참 고민하다가 할머니 저는 소희예요라는 첫 문장을 또박또박 적기 시작했다. 글씨를 쓰자 가슴이 뭉클해져서 이 편지에 보고 싶은 마음을 모두 담아야겠다고 결심했다.";
  const p2text = "소희는 할머니와 보냈던 여름 기억을 하나씩 떠올리며 편지를 이어 갔다. 마당 감나무 아래에서 먹던 얼음 팥빙수가 세상에서 제일 맛있었다고 썼고, 개울에서 잡은 올챙이가 개구리로 변했는지 궁금하다고 적었다. 할머니가 부채질을 해 주셔서 모기 한 마리 물리지 않고 잠들었던 밤이 가장 행복했다는 문장도 빼놓지 않았다. 편지지 한 장으로 부족해 두 번째 장까지 꺼내 쓰는 동안 소희의 눈가가 살짝 젖어 왔다. 마지막으로 다음 방학에는 꼭 더 오래 있을게요라고 약속을 쓰고 소희 올림으로 편지를 마무리했다. 봉투에 편지를 넣고 할머니 주소를 적은 뒤 우표를 붙이자 보물을 완성한 듯한 뿌듯함이 밀려왔다.";
  const p3text = "일주일 뒤 학교에서 돌아온 소희에게 엄마가 할머니한테서 편지가 왔단다라며 하얀 봉투를 건네주셨다. 소희는 심장이 두근거리며 조심스럽게 봉투를 열었다. 할머니의 둥글둥글한 글씨가 빼곡히 적혀 있었는데, 첫 줄에 우리 소희가 편지를 다 쓰다니 할머니가 얼마나 감동했는지 모른다라고 쓰여 있었다. 할머니는 감나무에 올해 감이 많이 열렸으니 가을에 곶감을 만들어 보내 주시겠다고 쓰셨고, 올챙이는 이미 개구리가 되어 떠났다고 알려 주셨다. 편지를 다 읽은 소희는 할머니의 글씨를 손가락으로 살며시 따라 쓰며 웃었다. 전화나 영상 통화와는 달리 손으로 쓴 편지에는 쓰는 사람의 온기가 종이에 스며든다는 것을 소희는 그날 처음 알게 되었다.";

  const paragraphs = [
    { id: "p1", text: p1text },
    { id: "p2", text: p2text },
    { id: "p3", text: p3text }
  ];

  const s1 = findSentences(p1text);
  const s2 = findSentences(p2text);
  const s3 = findSentences(p3text);

  let stepNum = 0;
  const timeline = [];

  // p1 (6문장)
  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "소희가 마음이 허전했던 이유는 무엇인가요?";
      choices = [["A","시골 할머니 댁에서 돌아온 뒤로 그리움이 생겨서"],["B","새 학교에 전학을 와서"],["C","친구와 다퉈서"],["D","시험을 잘 못 봐서"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "방학 동안 소희와 할머니가 한 활동이 아닌 것은 무엇인가요?";
      choices = [["A","산에서 등산을 했다"],["B","마당에서 수박을 먹었다"],["C","개울에서 올챙이를 잡았다"],["D","마루에서 별을 세었다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "엄마가 소희에게 제안한 것은 무엇인가요?";
      choices = [["A","편지를 써 보라고 했다"],["B","전화를 걸어 보라고 했다"],["C","영상 통화를 하라고 했다"],["D","그림을 그려 보라고 했다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "소희가 처음에 편지 쓰기에 대해 보인 반응은 어떠했나요?";
      choices = [["A","요즘 누가 편지를 쓰느냐며 투덜거렸다"],["B","기뻐하며 바로 썼다"],["C","할머니에게 전화를 걸었다"],["D","일기장에 대신 적었다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "소희가 적은 첫 문장은 무엇이었나요?";
      choices = [["A","할머니 저는 소희예요"],["B","할머니 보고 싶어요"],["C","할머니 안녕하세요"],["D","할머니 건강하세요"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "글씨를 쓰며 소희가 느낀 감정은 무엇인가요?";
      choices = [["A","가슴이 뭉클해졌다"],["B","지루해졌다"],["C","화가 났다"],["D","졸렸다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","할머니가 그리운 소희가 엄마의 제안으로 편지를 쓰기 시작한다"],["B","소희는 편지 쓰기를 끝까지 거부한다"],["C","소희가 할머니 댁으로 다시 간다"],["D","엄마가 할머니에게 전화를 건다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "소희가 편지에 쓴 첫 번째 추억은 무엇인가요?";
      choices = [["A","여름의 기억을 하나씩 떠올리며 편지를 이어 갔다"],["B","겨울 눈사람 만든 일"],["C","학교에서 있었던 일"],["D","친구와 놀았던 일"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "소희가 세상에서 제일 맛있었다고 쓴 음식은 무엇인가요?";
      choices = [["A","감나무 아래에서 먹던 얼음 팥빙수"],["B","할머니가 해 주신 떡볶이"],["C","마트에서 산 아이스크림"],["D","직접 만든 빵"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "소희가 가장 행복했다고 쓴 밤의 이유는 무엇인가요?";
      choices = [["A","할머니가 부채질을 해 주셔서 모기에 물리지 않고 잠들었기 때문이다"],["B","별이 많이 보였기 때문이다"],["C","수박을 먹었기 때문이다"],["D","친구가 놀러 왔기 때문이다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "편지를 쓰면서 소희의 눈가는 어떻게 되었나요?";
      choices = [["A","살짝 젖어 왔다"],["B","반짝반짝 빛났다"],["C","감겨 왔다"],["D","붉어졌다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "소희가 편지 마지막에 쓴 약속은 무엇인가요?";
      choices = [["A","다음 방학에는 꼭 더 오래 있겠다"],["B","매달 편지를 쓰겠다"],["C","여름에 다시 올챙이를 잡겠다"],["D","감나무를 심겠다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "봉투에 편지를 넣고 난 뒤 소희가 느낀 감정은 무엇인가요?";
      choices = [["A","한 편의 보물을 완성한 듯한 뿌듯함"],["B","아쉬움"],["C","걱정"],["D","무관심"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","소희가 할머니와의 추억을 담아 정성껏 편지를 완성한다"],["B","소희는 편지를 쓰다가 포기한다"],["C","편지를 보내지 않기로 한다"],["D","엄마가 대신 편지를 써 준다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "일주일 뒤 소희에게 온 것은 무엇인가요?";
      choices = [["A","할머니한테서 편지가 왔다"],["B","할머니가 직접 오셨다"],["C","소포가 왔다"],["D","전화가 왔다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "봉투를 열 때 소희의 상태는 어떠했나요?";
      choices = [["A","심장이 두근거리며 조심스럽게 열었다"],["B","별 관심 없이 열었다"],["C","화가 나서 급하게 열었다"],["D","엄마가 대신 열어 주었다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "할머니가 편지 첫 줄에 쓴 내용은 무엇인가요?";
      choices = [["A","소희가 편지를 쓴 것에 크게 감동했다는 내용"],["B","건강하게 지내라는 인사"],["C","감을 보내겠다는 내용"],["D","개구리 이야기"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "할머니가 가을에 만들어 보내 주시겠다고 한 것은 무엇인가요?";
      choices = [["A","곶감"],["B","팥빙수"],["C","떡"],["D","감자"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "편지를 다 읽은 소희가 한 행동은 무엇인가요?";
      choices = [["A","할머니의 글씨를 손가락으로 살며시 따라 쓰며 웃었다"],["B","바로 답장을 썼다"],["C","엄마에게 편지를 보여 주었다"],["D","편지를 서랍에 넣었다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "소희가 그날 처음 알게 된 것은 무엇인가요?";
      choices = [["A","손으로 쓴 편지에는 쓰는 사람의 온기가 스며든다는 것"],["B","편지가 빨리 도착한다는 것"],["C","할머니가 글씨를 잘 쓰신다는 것"],["D","우표가 비싸다는 것"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","할머니의 답장을 받고 소희는 손 편지만의 따뜻한 가치를 깨닫는다"],["B","할머니가 편지를 보내지 않으셨다"],["C","소희는 편지를 읽지 않았다"],["D","편지보다 전화가 더 좋다고 느꼈다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "소희가 방학 동안 할머니와 먹은 과일은 무엇인가요?",
      [findRange(paragraphs, "p1", "수박")]),
    makeConfirmQ("q2", "엄마가 소희에게 제안한 것은 무엇인가요?",
      [findRange(paragraphs, "p1", "편지를 써 보면 어떻겠니")]),
    makeConfirmQ("q3", "소희가 세상에서 제일 맛있었다고 쓴 음식은 무엇인가요?",
      [findRange(paragraphs, "p2", "팥빙수")]),
    makeConfirmQ("q4", "소희가 편지 마지막에 쓴 인사말은 무엇인가요?",
      [findRange(paragraphs, "p2", "소희 올림")]),
    makeConfirmQ("q5", "할머니가 가을에 보내 주시겠다고 한 음식은 무엇인가요?",
      [findRange(paragraphs, "p3", "곶감")]),
    makeConfirmQ("q6", "올챙이는 어떻게 되었나요?",
      [findRange(paragraphs, "p3", "개구리가 되어")])
  ];

  return assembleFull(72, "LITERATURE", "문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 73 비문학: 한글의 과학적 원리 (1010자) ===
// =============================================
function buildDay73() {
  const p1text = "한글은 조선 시대 세종대왕이 백성들이 쉽게 읽고 쓸 수 있는 문자를 만들겠다는 뜻을 품고 창제한 글자이다. 이전에 사용하던 한자는 수천 개의 글자를 외워야 해서 일반 백성이 배우기 어려웠다. 세종대왕은 발음 기관의 모양을 관찰하여 자음의 기본 글자를 설계하였는데, 예를 들어 기역은 혀뿌리가 목구멍을 막는 모습에서, 니은은 혀가 윗잇몸에 닿는 모습에서 따왔다. 모음은 하늘을 뜻하는 점, 땅을 뜻하는 가로 획, 사람을 뜻하는 세로 획이라는 세 가지 기본 요소의 조합으로 만들었다. 이렇게 발음 원리와 철학적 의미를 결합하여 체계적으로 설계했다는 점이 한글의 독보적 특징이다. 세계 언어학자들도 한글의 과학적 설계 원리에 높은 평가를 내리고 있다.";
  const p2text = "한글이 과학적이라 불리는 또 다른 이유는 적은 수의 글자로 매우 다양한 소리를 표현할 수 있다는 점이다. 자음 열네 개와 모음 열 개, 총 스물네 개의 기본 글자만 알면 거의 모든 한국어 발음을 적을 수 있다. 자음과 모음을 초성, 중성, 종성의 자리에 배치하여 음절 단위로 모아쓰기를 하면 하나의 글자 칸이 완성된다. 예를 들어 한이라는 글자는 초성 히읗, 중성 아, 종성 니은을 한 칸에 합쳐 쓴 것이다. 모아쓰기 방식 덕분에 글자가 시각적으로 뭉쳐 보여 단어를 빠르게 인식할 수 있다. 이 점은 알파벳처럼 글자를 나란히 늘어놓는 방식과 비교했을 때 읽기 속도 면에서 장점이 된다.";
  const p3text = "한글의 과학적 원리는 현대에도 여러 방면에서 빛을 발하고 있다. 스마트폰 자판에서 한글은 모아쓰기 구조 덕분에 적은 버튼으로도 빠르게 입력할 수 있어 문자 메시지 속도 대회에서 좋은 성적을 거두기도 했다. 유네스코는 세종대왕의 업적을 기려 문맹 퇴치에 기여한 개인이나 단체에 수여하는 세종대왕 문해상을 제정하였다. 또한 문자가 없는 소수 민족에게 한글을 보급하는 사례도 있었는데, 인도네시아 찌아찌아족이 한글을 자신들의 언어 표기에 시범 사용한 것이 대표적이다. 이처럼 한글은 배우기 쉽고 표현력이 뛰어나 전 세계에서 주목받는 문자가 되었다. 우리가 매일 사용하는 글자 속에 이토록 깊은 과학과 철학이 담겨 있다는 사실은 참으로 자랑스러운 일이다.";

  const paragraphs = [
    { id: "p1", text: p1text },
    { id: "p2", text: p2text },
    { id: "p3", text: p3text }
  ];

  const s1 = findSentences(p1text);
  const s2 = findSentences(p2text);
  const s3 = findSentences(p3text);

  let stepNum = 0;
  const timeline = [];

  // p1 (6문장)
  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "한글을 창제한 사람은 누구인가요?";
      choices = [["A","세종대왕"],["B","정조"],["C","이순신"],["D","퇴계 이황"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "한자가 일반 백성에게 어려웠던 이유는 무엇인가요?";
      choices = [["A","수천 개의 글자를 외워야 했기 때문이다"],["B","글자가 너무 작았기 때문이다"],["C","종이가 비쌌기 때문이다"],["D","글자 모양이 비슷했기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "자음 기본 글자 설계에 활용한 것은 무엇인가요?";
      choices = [["A","발음 기관의 모양"],["B","동물의 발자국"],["C","자연의 풍경"],["D","별자리 모양"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "모음의 세 가지 기본 요소가 뜻하는 것은 무엇인가요?";
      choices = [["A","하늘, 땅, 사람"],["B","해, 달, 별"],["C","산, 강, 바다"],["D","봄, 여름, 가을"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "한글의 독보적 특징으로 언급된 것은 무엇인가요?";
      choices = [["A","발음 원리와 철학적 의미를 결합하여 체계적으로 설계했다"],["B","글자 수가 가장 많다"],["C","그림 문자에서 발전했다"],["D","다른 나라 문자를 모방했다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "세계 언어학자들의 한글에 대한 평가는 어떠한가요?";
      choices = [["A","과학적 설계 원리에 높은 평가를 내리고 있다"],["B","관심이 없다"],["C","배우기 어렵다고 평가한다"],["D","개선이 필요하다고 본다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","세종대왕이 발음 원리와 철학에 근거하여 한글을 과학적으로 창제했다"],["B","한자가 한글보다 우수하다"],["C","한글은 우연히 만들어졌다"],["D","모음은 자음에서 파생되었다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "한글이 과학적이라 불리는 또 다른 이유는 무엇인가요?";
      choices = [["A","적은 수의 글자로 다양한 소리를 표현할 수 있다"],["B","글자 수가 매우 많다"],["C","소리와 관계없이 만들어졌다"],["D","그림으로 이루어져 있다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "한글의 기본 글자 수는 총 몇 개인가요?";
      choices = [["A","스물네 개"],["B","열 개"],["C","서른 개"],["D","마흔 개"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "한글의 모아쓰기에서 자음과 모음을 배치하는 자리는 어떻게 나뉘나요?";
      choices = [["A","초성, 중성, 종성"],["B","앞, 뒤, 옆"],["C","위, 아래만"],["D","왼쪽, 오른쪽만"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "'한'이라는 글자의 구성은 어떠한가요?";
      choices = [["A","초성 히읗, 중성 아, 종성 니은"],["B","초성 니은, 중성 아, 종성 히읗"],["C","초성 아, 중성 히읗, 종성 니은"],["D","초성 기역, 중성 이, 종성 리을"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "모아쓰기 방식의 장점은 무엇인가요?";
      choices = [["A","글자가 시각적으로 뭉쳐 보여 단어를 빠르게 인식할 수 있다"],["B","글자를 크게 쓸 수 있다"],["C","글자 수가 줄어든다"],["D","외국어를 쉽게 표기할 수 있다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "알파벳 방식과 비교했을 때 모아쓰기의 장점은 무엇인가요?";
      choices = [["A","읽기 속도 면에서 장점이 있다"],["B","쓰기가 더 느리다"],["C","글자가 더 복잡하다"],["D","발음이 어렵다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","한글은 적은 글자로 다양한 소리를 표현하며 모아쓰기로 읽기 속도가 빠르다"],["B","한글은 알파벳과 동일한 구조이다"],["C","한글의 글자 수가 너무 많아 배우기 어렵다"],["D","모아쓰기는 한글에만 존재하지 않는다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "한글의 과학적 원리가 현대에서도 중요한 이유는 무엇인가요?";
      choices = [["A","여러 방면에서 빛을 발하고 있기 때문이다"],["B","옛날에만 사용되기 때문이다"],["C","현대에는 쓰이지 않기 때문이다"],["D","외국에서만 인정받기 때문이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "스마트폰에서 한글의 장점은 무엇인가요?";
      choices = [["A","적은 버튼으로도 빠르게 입력할 수 있다"],["B","자판이 크다"],["C","음성 인식만 가능하다"],["D","외국어 입력에 유리하다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "유네스코가 세종대왕의 업적을 기려 제정한 상은 무엇인가요?";
      choices = [["A","세종대왕 문해상"],["B","노벨 문학상"],["C","한글 창제상"],["D","세계 문자상"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "한글을 시범 사용한 소수 민족은 어느 나라에 있나요?";
      choices = [["A","인도네시아"],["B","일본"],["C","중국"],["D","태국"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "한글이 전 세계에서 주목받는 이유는 무엇인가요?";
      choices = [["A","배우기 쉽고 표현력이 뛰어나기 때문이다"],["B","글자 수가 가장 많기 때문이다"],["C","역사가 가장 오래되었기 때문이다"],["D","모든 언어를 표기할 수 있기 때문이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "마지막 문장이 전하는 메시지는 무엇인가요?";
      choices = [["A","매일 쓰는 한글 속에 깊은 과학과 철학이 담겨 있어 자랑스럽다"],["B","한글을 더 많이 공부해야 한다"],["C","한글이 다른 문자보다 오래되었다"],["D","한글은 앞으로 바뀌어야 한다"]],
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","한글의 과학적 원리는 현대 기술과 국제 사회에서도 큰 가치를 인정받고 있다"],["B","한글은 현대에 더 이상 쓰이지 않는다"],["C","유네스코는 한글에 관심이 없다"],["D","한글은 소수 민족에게 적합하지 않다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "기역 글자의 모양은 무엇을 본뜬 것인가요?",
      [findRange(paragraphs, "p1", "혀뿌리가 목구멍을 막는 모습")]),
    makeConfirmQ("q2", "모음의 세 가지 기본 요소는 무엇을 뜻하나요?",
      [findRange(paragraphs, "p1", "하늘을 뜻하는 점, 땅을 뜻하는 가로 획, 사람을 뜻하는 세로 획")]),
    makeConfirmQ("q3", "한글 기본 글자의 총 수는 몇 개인가요?",
      [findRange(paragraphs, "p2", "스물네 개")]),
    makeConfirmQ("q4", "음절 단위로 글자를 합쳐 쓰는 방식을 무엇이라 하나요?",
      [findRange(paragraphs, "p2", "모아쓰기")]),
    makeConfirmQ("q5", "한글을 시범 사용한 인도네시아 소수 민족의 이름은 무엇인가요?",
      [findRange(paragraphs, "p3", "찌아찌아족")]),
    makeConfirmQ("q6", "유네스코가 제정한 상의 이름은 무엇인가요?",
      [findRange(paragraphs, "p3", "세종대왕 문해상")])
  ];

  return assembleFull(73, "NONFICTION", "비문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 74 문학: 비 오는 날의 도서관 (1006자) ===
// =============================================
function buildDay74() {
  const p1text = "토요일 오후, 하윤이는 친구들과 공원에서 배드민턴을 치기로 약속했다. 그런데 아침부터 빗줄기가 굵어지더니 창밖이 온통 회색빛으로 변했다. 친구들이 단체 채팅방에 오늘은 비가 너무 많이 와서 다음에 하자라는 메시지를 보내자 하윤이는 크게 실망했다. 할 일 없이 소파에 누워 뒹굴거리던 하윤이에게 아빠가 도서관에 같이 가 보지 않겠냐고 물으셨다. 하윤이는 책 읽기를 그다지 좋아하지 않았지만 집에 있는 것보다는 낫겠다 싶어 투덜대며 우산을 챙겼다. 빗속을 걸어 도착한 도서관은 오래된 나무 냄새와 종이 냄새가 뒤섞여 낯설지만 묘하게 편안한 공간이었다.";
  const p2text = "하윤이는 아빠와 헤어져 어린이 열람실에 들어갔다. 서가를 훑어보던 중 표지에 커다란 용이 그려진 책 한 권이 눈에 들어왔다. 제목은 용을 만난 소녀였는데, 첫 장을 펼치자마자 주인공이 숲속에서 아기 용을 발견하는 장면에 빠져들었다. 주인공은 마을 사람들 몰래 용을 돌보며 우정을 키워 나갔고, 마침내 용이 날 수 있게 되었을 때 떠나보내는 결말이 가슴 찡하게 다가왔다. 하윤이는 어느새 의자에 웅크리고 앉아 한 시간 넘게 책을 읽고 있었다. 마지막 페이지를 덮었을 때 하윤이의 눈에는 글썽이는 눈물이 맺혀 있었고, 이렇게 재미있는 책이 있을 줄 몰랐다며 혼잣말을 중얼거렸다.";
  const p3text = "아빠를 찾으러 일반 열람실로 가자 아빠는 두꺼운 소설책에 코를 파묻고 계셨다. 하윤이가 아빠 나 이 책 진짜 재미있었어라고 흥분해서 말하자 아빠는 안경 너머로 빙긋 웃으셨다. 둘은 도서관을 나오며 각자 책 두 권씩을 빌렸는데, 하윤이는 용을 만난 소녀의 후속편과 비슷한 모험 이야기를 골랐다. 밖에는 여전히 비가 내리고 있었지만 하윤이의 발걸음은 아침과는 전혀 달랐다. 빗방울이 우산 위를 통통 두드리는 소리마저 마치 모험의 배경 음악처럼 경쾌하게 들렸다. 집에 돌아온 하윤이는 빌려 온 책을 책상 위에 소중히 올려놓고, 비 오는 날이 이렇게 좋은 날이 될 줄은 정말 몰랐다고 일기장에 적었다.";

  const paragraphs = [
    { id: "p1", text: p1text },
    { id: "p2", text: p2text },
    { id: "p3", text: p3text }
  ];

  const s1 = findSentences(p1text);
  const s2 = findSentences(p2text);
  const s3 = findSentences(p3text);

  let stepNum = 0;
  const timeline = [];

  // p1 (6문장)
  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "하윤이가 원래 친구들과 하기로 한 것은 무엇인가요?";
      choices = [["A","공원에서 배드민턴을 치기로 했다"],["B","도서관에서 공부하기로 했다"],["C","영화를 보기로 했다"],["D","수영장에 가기로 했다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "약속이 취소된 이유는 무엇인가요?";
      choices = [["A","비가 너무 많이 와서"],["B","친구가 아파서"],["C","공원이 문을 닫아서"],["D","부모님이 안 된다고 하셔서"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "메시지를 받은 하윤이의 기분은 어떠했나요?";
      choices = [["A","크게 실망했다"],["B","기뻐했다"],["C","아무 느낌이 없었다"],["D","화를 냈다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "아빠가 하윤이에게 제안한 것은 무엇인가요?";
      choices = [["A","도서관에 같이 가자고 하셨다"],["B","영화를 보자고 하셨다"],["C","요리를 하자고 하셨다"],["D","게임을 하자고 하셨다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "하윤이가 도서관에 간 이유는 무엇인가요?";
      choices = [["A","집에 있는 것보다 낫겠다고 생각했기 때문이다"],["B","책이 너무 읽고 싶어서"],["C","친구를 만나기로 해서"],["D","숙제를 해야 해서"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "도서관에 도착했을 때 느낀 분위기는 어떠했나요?";
      choices = [["A","낯설지만 묘하게 편안한 공간이었다"],["B","시끄럽고 복잡했다"],["C","어둡고 무서웠다"],["D","아무런 느낌이 없었다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","비 때문에 약속이 취소된 하윤이가 아빠와 함께 도서관에 가게 된다"],["B","하윤이는 비를 좋아한다"],["C","친구들과 배드민턴을 쳤다"],["D","아빠가 하윤이를 집에 두었다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "하윤이가 처음 간 곳은 어디인가요?";
      choices = [["A","어린이 열람실"],["B","일반 열람실"],["C","만화방"],["D","카페"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "하윤이의 눈에 들어온 책의 표지에는 무엇이 그려져 있었나요?";
      choices = [["A","커다란 용"],["B","공주"],["C","우주선"],["D","고양이"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "책의 첫 장면은 어떤 내용인가요?";
      choices = [["A","주인공이 숲속에서 아기 용을 발견한다"],["B","주인공이 마을을 떠난다"],["C","용이 마을을 공격한다"],["D","주인공이 학교에 간다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "책의 결말이 가슴 찡한 이유는 무엇인가요?";
      choices = [["A","용이 날 수 있게 되자 떠나보내야 했기 때문이다"],["B","용이 죽었기 때문이다"],["C","주인공이 다쳤기 때문이다"],["D","마을이 사라졌기 때문이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "하윤이가 책을 읽은 시간은 대략 얼마인가요?";
      choices = [["A","한 시간 넘게"],["B","십 분 정도"],["C","삼십 분"],["D","두 시간 이상"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "책을 다 읽은 하윤이의 반응은 어떠했나요?";
      choices = [["A","눈에 눈물이 맺히고 재미있었다며 혼잣말을 했다"],["B","지루했다고 투덜거렸다"],["C","바로 다른 책을 읽기 시작했다"],["D","아빠에게 달려갔다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","우연히 발견한 책에 빠져들며 하윤이는 독서의 감동을 처음 경험한다"],["B","하윤이는 책을 읽지 않고 돌아다녔다"],["C","책이 재미없어서 금방 덮었다"],["D","아빠가 책을 골라 주었다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "아빠를 찾으러 갔을 때 아빠는 무엇을 하고 계셨나요?";
      choices = [["A","두꺼운 소설책에 코를 파묻고 계셨다"],["B","잠을 자고 계셨다"],["C","핸드폰을 보고 계셨다"],["D","신문을 읽고 계셨다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "하윤이가 아빠에게 한 말은 무엇인가요?";
      choices = [["A","이 책 진짜 재미있었다고 흥분해서 말했다"],["B","빨리 집에 가자고 했다"],["C","배가 고프다고 했다"],["D","더 있고 싶다고 했다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "하윤이가 빌린 책은 어떤 종류인가요?";
      choices = [["A","용을 만난 소녀의 후속편과 비슷한 모험 이야기"],["B","과학책과 역사책"],["C","만화책 두 권"],["D","요리책과 동화책"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "도서관을 나올 때 하윤이의 기분은 아침과 비교하여 어떠했나요?";
      choices = [["A","아침과는 전혀 다르게 가벼웠다"],["B","여전히 우울했다"],["C","화가 났다"],["D","아무 변화가 없었다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "빗방울 소리를 하윤이는 무엇처럼 느꼈나요?";
      choices = [["A","모험의 배경 음악처럼 경쾌하게 느꼈다"],["B","시끄러운 소음처럼 느꼈다"],["C","자장가처럼 졸리게 느꼈다"],["D","무서운 소리처럼 느꼈다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "하윤이가 일기장에 적은 내용은 무엇인가요?";
      choices = [["A","비 오는 날이 이렇게 좋은 날이 될 줄 몰랐다"],["B","비가 싫었다"],["C","도서관이 지루했다"],["D","친구들과 노는 것이 더 좋다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","독서의 즐거움을 알게 된 하윤이는 비 오는 날도 특별한 날로 기억한다"],["B","하윤이는 도서관을 다시는 가지 않기로 했다"],["C","아빠는 책을 빌리지 않았다"],["D","비가 그쳐서 배드민턴을 쳤다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "하윤이가 원래 친구들과 하기로 한 운동은 무엇인가요?",
      [findRange(paragraphs, "p1", "배드민턴")]),
    makeConfirmQ("q2", "도서관에서 나무와 어떤 냄새가 뒤섞여 있었나요?",
      [findRange(paragraphs, "p1", "종이 냄새")]),
    makeConfirmQ("q3", "하윤이가 읽은 책의 제목은 무엇인가요?",
      [findRange(paragraphs, "p2", "용을 만난 소녀")]),
    makeConfirmQ("q4", "주인공이 숲속에서 발견한 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "아기 용")]),
    makeConfirmQ("q5", "하윤이와 아빠가 각각 빌린 책의 수는 몇 권인가요?",
      [findRange(paragraphs, "p3", "두 권씩")]),
    makeConfirmQ("q6", "빗방울 소리를 하윤이는 무엇에 비유했나요?",
      [findRange(paragraphs, "p3", "모험의 배경 음악")])
  ];

  return assembleFull(74, "LITERATURE", "문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 75 비문학: 재활용과 자원 순환 (1014자) ===
// =============================================
function buildDay75() {
  const p1text = "우리가 매일 사용하고 버리는 물건 중 상당수는 적절한 과정을 거치면 다시 쓸 수 있는 자원이 된다. 이렇게 폐기물을 원료나 에너지로 되살려 사용하는 과정을 재활용이라 하며, 넓은 의미에서는 자원 순환이라고도 부른다. 플라스틱 병을 깨끗이 씻어 분리 배출하면 잘게 부수어 섬유나 새 용기의 원료로 재탄생할 수 있다. 종이 역시 수거된 뒤 물에 풀어 섬유질을 분리하고 재가공하면 재생 종이로 만들어진다. 유리병은 색깔별로 모아 녹인 뒤 새 유리 제품으로 다시 태어난다. 이러한 과정을 통해 매립이나 소각으로 처리되는 쓰레기양을 줄이고 자연에서 새로운 자원을 캐내는 양도 줄일 수 있다.";
  const p2text = "재활용을 효과적으로 하려면 분리 배출을 올바르게 하는 것이 가장 중요하다. 먼저 음식물이 묻은 용기는 물로 헹구어 이물질을 제거한 뒤 배출해야 한다. 페트병은 라벨을 벗기고 납작하게 눌러서 내놓으면 수거와 재활용 효율이 크게 높아진다. 비닐과 스티로폼도 이물질을 털어 내고 종류별로 분리하면 재활용률이 올라간다. 반면에 음식물이 잔뜩 묻어 있거나 다른 재질이 섞인 채 배출되면 재활용이 불가능해져 결국 쓰레기로 처리된다. 올바른 분리 배출은 귀찮더라도 습관을 들이면 어렵지 않으며, 한 사람의 실천이 모이면 커다란 변화를 만들어 낸다.";
  const p3text = "자원 순환은 환경 보호뿐 아니라 경제적으로도 큰 의미가 있다. 새로운 원료를 채굴하거나 수입하는 비용을 아낄 수 있고, 재활용 산업 자체가 새로운 일자리를 창출한다. 우리나라의 재활용률은 세계적으로 높은 편이지만 여전히 개선할 여지가 있다. 최근에는 아예 쓰레기를 만들지 않는 제로 웨이스트 운동이 주목받고 있는데, 개인 텀블러 사용, 장바구니 지참, 리필 매장 이용 등이 실천 방법이다. 기업들도 포장재를 줄이거나 재활용이 쉬운 소재로 전환하는 노력을 기울이고 있다. 환경 문제는 한 사람의 작은 습관에서 시작되며, 분리 배출과 자원 절약을 꾸준히 실천하는 것이 지구를 지키는 가장 확실한 방법이다.";

  const paragraphs = [
    { id: "p1", text: p1text },
    { id: "p2", text: p2text },
    { id: "p3", text: p3text }
  ];

  const s1 = findSentences(p1text);
  const s2 = findSentences(p2text);
  const s3 = findSentences(p3text);

  let stepNum = 0;
  const timeline = [];

  // p1 (6문장)
  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "매일 버리는 물건 중 상당수가 어떤 것이 될 수 있나요?";
      choices = [["A","다시 쓸 수 있는 자원"],["B","에너지가 사라지는 물질"],["C","자연에서 분해되지 않는 쓰레기"],["D","새로운 음식"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "폐기물을 원료나 에너지로 되살려 사용하는 과정을 무엇이라 하나요?";
      choices = [["A","재활용"],["B","소각"],["C","매립"],["D","분해"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "플라스틱 병이 재활용되면 무엇이 될 수 있나요?";
      choices = [["A","섬유나 새 용기의 원료"],["B","유리 제품"],["C","금속 부품"],["D","종이"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "종이가 재활용되는 과정은 어떠한가요?";
      choices = [["A","물에 풀어 섬유질을 분리하고 재가공한다"],["B","불에 태워 에너지로 바꾼다"],["C","화학 약품으로 녹인다"],["D","그대로 다시 사용한다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "유리병은 어떻게 재활용되나요?";
      choices = [["A","색깔별로 모아 녹인 뒤 새 유리 제품으로 만든다"],["B","깨뜨려서 도로 포장에 사용한다"],["C","세척 후 그대로 다시 사용한다"],["D","분쇄하여 비료로 만든다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "재활용을 통해 줄일 수 있는 것은 무엇인가요?";
      choices = [["A","매립과 소각 쓰레기양, 새 자원 채취량"],["B","인구수"],["C","공기 중 산소"],["D","도시의 면적"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","폐기물을 재활용하면 쓰레기와 자원 소비를 줄일 수 있다"],["B","모든 쓰레기는 재활용이 불가능하다"],["C","유리만 재활용할 수 있다"],["D","재활용은 경제에 도움이 되지 않는다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "재활용을 효과적으로 하기 위해 가장 중요한 것은 무엇인가요?";
      choices = [["A","분리 배출을 올바르게 하는 것"],["B","쓰레기를 많이 만드는 것"],["C","모든 것을 한꺼번에 버리는 것"],["D","소각장에 보내는 것"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "음식물이 묻은 용기는 어떻게 해야 하나요?";
      choices = [["A","물로 헹구어 이물질을 제거한 뒤 배출한다"],["B","그대로 버린다"],["C","일반 쓰레기에 넣는다"],["D","음식물 쓰레기와 함께 넣는다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "페트병을 배출할 때 해야 하는 두 가지는 무엇인가요?";
      choices = [["A","라벨을 벗기고 납작하게 눌러서 내놓는다"],["B","물을 채워서 내놓는다"],["C","뚜껑을 닫고 그대로 둔다"],["D","색깔별로 분류한다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "비닐과 스티로폼의 재활용률을 높이려면 어떻게 해야 하나요?";
      choices = [["A","이물질을 털어 내고 종류별로 분리한다"],["B","한꺼번에 모아서 버린다"],["C","물에 담가 둔다"],["D","불에 태운다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "재활용이 불가능해지는 경우는 어떤 때인가요?";
      choices = [["A","음식물이 묻어 있거나 다른 재질이 섞인 채 배출될 때"],["B","깨끗하게 씻어서 낼 때"],["C","종류별로 분리할 때"],["D","라벨을 제거했을 때"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "마지막 문장의 핵심 메시지는 무엇인가요?";
      choices = [["A","한 사람의 실천이 모이면 커다란 변화를 만들어 낸다"],["B","분리 배출은 너무 어렵다"],["C","재활용은 전문가만 할 수 있다"],["D","습관을 바꾸는 것은 불가능하다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","올바른 분리 배출 습관이 재활용의 핵심이다"],["B","분리 배출은 필요 없다"],["C","모든 쓰레기를 한꺼번에 버려야 한다"],["D","페트병만 재활용할 수 있다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "자원 순환이 환경 보호 외에 가지는 또 다른 의미는 무엇인가요?";
      choices = [["A","경제적으로 큰 의미가 있다"],["B","정치적으로 중요하다"],["C","문화적으로 가치가 있다"],["D","교육적으로만 의미가 있다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "재활용 산업이 가져다주는 경제적 효과는 무엇인가요?";
      choices = [["A","새로운 일자리를 창출한다"],["B","세금이 줄어든다"],["C","수출이 감소한다"],["D","물가가 올라간다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "우리나라의 재활용률에 대한 설명으로 올바른 것은 무엇인가요?";
      choices = [["A","세계적으로 높은 편이지만 개선할 여지가 있다"],["B","세계에서 가장 낮다"],["C","더 이상 개선할 것이 없다"],["D","재활용을 하지 않는다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "제로 웨이스트 운동의 실천 방법으로 언급된 것이 아닌 것은 무엇인가요?";
      choices = [["A","일회용 컵 사용"],["B","개인 텀블러 사용"],["C","장바구니 지참"],["D","리필 매장 이용"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "기업들이 하고 있는 환경 관련 노력은 무엇인가요?";
      choices = [["A","포장재를 줄이거나 재활용이 쉬운 소재로 전환한다"],["B","포장을 더 화려하게 한다"],["C","일회용품을 더 많이 생산한다"],["D","재활용을 중단한다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "지구를 지키는 가장 확실한 방법으로 제시된 것은 무엇인가요?";
      choices = [["A","분리 배출과 자원 절약을 꾸준히 실천하는 것"],["B","쓰레기를 줍는 봉사활동만 하는 것"],["C","기업에게만 맡기는 것"],["D","새로운 자원을 더 많이 캐내는 것"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","자원 순환은 경제적 가치도 있으며 개인과 기업 모두의 실천이 중요하다"],["B","재활용은 경제에 해롭다"],["C","제로 웨이스트는 실현 불가능하다"],["D","기업의 노력은 효과가 없다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "폐기물을 되살려 사용하는 과정을 넓은 의미로 무엇이라 부르나요?",
      [findRange(paragraphs, "p1", "자원 순환")]),
    makeConfirmQ("q2", "플라스틱 병이 재활용되어 만들어질 수 있는 것은 무엇인가요?",
      [findRange(paragraphs, "p1", "섬유나 새 용기의 원료")]),
    makeConfirmQ("q3", "페트병 배출 시 벗겨야 하는 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "라벨")]),
    makeConfirmQ("q4", "재활용이 불가능해지는 원인 중 하나는 무엇인가요?",
      [findRange(paragraphs, "p2", "다른 재질이 섞인 채 배출")]),
    makeConfirmQ("q5", "쓰레기를 만들지 않는 운동의 이름은 무엇인가요?",
      [findRange(paragraphs, "p3", "제로 웨이스트")]),
    makeConfirmQ("q6", "기업이 환경을 위해 전환하고 있는 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "재활용이 쉬운 소재")])
  ];

  return assembleFull(75, "NONFICTION", "비문학", paragraphs, timeline, cards, confirmQs);
}

// === 메인 실행 ===
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const batchPath = path.join(ROOT, 'generated', 'daily-batch-reading-frege3.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'frege3');

  // 배치 파일 읽기
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

  // Day 71~75 콘텐츠 빌드
  const days = [
    { dayIndex: 71, builder: buildDay71 },
    { dayIndex: 72, builder: buildDay72 },
    { dayIndex: 73, builder: buildDay73 },
    { dayIndex: 74, builder: buildDay74 },
    { dayIndex: 75, builder: buildDay75 }
  ];

  const results = [];
  for (const { dayIndex, builder } of days) {
    const content = builder();
    const subArea = content.subArea;

    // 검증
    const paras = content.payload.passage.paragraphs;
    const totalChars = paras.reduce((sum, p) => sum + p.text.length, 0);
    const cardCount = content.payload.recall.cards.length;
    const confirmCount = content.payload.confirm.questions.length;
    const timelineCount = content.payload.intensive.timeline.length;

    console.log(`\n=== Day ${dayIndex} (${subArea}) ===`);
    console.log(`  제목: ${content.title}`);
    console.log(`  문단 수: ${paras.length}`);
    console.log(`  총 글자 수: ${totalChars} ${totalChars >= 950 && totalChars <= 1050 ? '(OK)' : '(경고: 범위 밖!)'}`);
    paras.forEach(p => console.log(`    ${p.id}: ${p.text.length}자`));
    console.log(`  정독 스텝: ${timelineCount}`);
    console.log(`  복기 카드: ${cardCount}장 ${cardCount === 8 ? '(OK)' : '(경고: 8장이 아님!)'}`);
    console.log(`  확인 문항: ${confirmCount}개 ${confirmCount >= 5 && confirmCount <= 8 ? '(OK)' : '(경고: 범위 밖!)'}`);
    console.log(`  schoolGradeRange: min=${content.schoolGradeRange.min}, max=${content.schoolGradeRange.max}`);
    console.log(`  timeLimitSec: ${content.timeLimitSec}`);
    console.log(`  seedReward: count=${content.seedReward.count}`);

    // 배치 아이템 교체 (items[dayIndex-1])
    const batchIdx = dayIndex - 1;
    const batchItem = wrapBatchItem(dayIndex, subArea, content);
    if (batchIdx < batch.items.length) {
      batch.items[batchIdx] = batchItem;
      console.log(`  배치 items[${batchIdx}] 교체 완료`);
    } else {
      batch.items.push(batchItem);
      console.log(`  배치 items에 추가 (인덱스: ${batch.items.length - 1})`);
    }

    // static 파일 쓰기
    const nn = String(dayIndex).padStart(3, '0');
    const staticPath = path.join(staticDir, `${nn}.json`);
    fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf-8');
    console.log(`  static 파일 작성: ${nn}.json`);

    results.push({ dayIndex, totalChars, cardCount, confirmCount, timelineCount });
  }

  // 배치 파일 저장
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf-8');
  console.log('\n배치 파일 저장 완료:', batchPath);

  // 최종 검증 요약
  console.log('\n=== 최종 검증 요약 ===');
  let allOk = true;
  for (const r of results) {
    const charOk = r.totalChars >= 950 && r.totalChars <= 1050;
    const cardOk = r.cardCount === 8;
    const confirmOk = r.confirmCount >= 5 && r.confirmCount <= 8;
    const ok = charOk && cardOk && confirmOk;
    if (!ok) allOk = false;
    console.log(`Day ${r.dayIndex}: ${r.totalChars}자, ${r.cardCount}카드, ${r.confirmCount}확인문항, ${r.timelineCount}스텝 => ${ok ? 'PASS' : 'FAIL'}`);
  }
  console.log(allOk ? '\n모든 Day 검증 통과!' : '\n일부 Day에 문제가 있습니다. 위 로그를 확인하세요.');
}

main();
