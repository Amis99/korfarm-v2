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
// === Day 56 문학: 빗소리와 편지 (1021자) ===
// =============================================
function buildDay56() {
  const p1text = "여름 방학이 시작되던 날, 민서는 시골 할머니 댁에 도착하자마자 마루에 걸터앉아 마당을 바라보았다. 도시에서는 듣기 어려운 매미 소리가 귀를 가득 채웠고, 텃밭의 상추와 고추는 싱싱한 초록빛을 뿜어내고 있었다. 할머니는 부엌에서 수박을 썰며 민서를 불렀지만, 민서는 대답도 하지 않은 채 멍하니 하늘만 올려다보았다. 사실 민서의 마음속에는 학기 말에 전학 간 단짝 친구 지은이에 대한 그리움이 가득 차 있었다. 지은이와 매일 쉬는 시간마다 운동장 한쪽 벤치에 앉아 이야기를 나누던 기억이 자꾸만 떠올랐다. 민서는 작은 한숨을 내쉬며 가방 속에 넣어 온 분홍색 편지지를 꺼내 무릎 위에 가만히 올려놓았다.";
  const p2text = "오후가 되자 하늘에 먹구름이 잔뜩 끼더니 굵은 빗방울이 기왓장을 두드리기 시작했다. 처마 끝에서 떨어지는 빗줄기가 마당 흙 위에 작은 물웅덩이를 만들었고, 민서는 그 소리가 마치 누군가 손가락으로 문을 톡톡 두드리는 것 같다고 생각했다. 빗소리를 듣고 있자니 지은이와 비 오는 날 교실 창가에 나란히 앉아 빗방울의 수를 세던 일이 떠올랐다. 민서는 편지지를 조심스럽게 펼치고 천천히 연필을 움직이기 시작했다. 지은아, 오늘 할머니 댁에 비가 내려, 우리가 함께 세던 빗방울이 여기서도 떨어지고 있어, 하고 한 글자 한 글자 또박또박 적어 나갔다. 글을 쓸수록 마음이 점점 따뜻해지는 것을 느끼며 민서는 한 줄 한 줄 정성을 가득 담았다.";
  const p3text = "편지를 다 쓰고 나자 어느새 비가 그쳐 있었다. 마당 한쪽에 작은 무지개가 살짝 떠올랐고, 공기는 촉촉하면서도 상쾌했다. 민서는 편지 봉투에 지은이의 새 주소를 또박또박 적고 우체통에 넣으러 가겠다며 할머니에게 말씀드렸다. 할머니는 빙그레 웃으시며 마을 입구 빨간 우체통이 아직 잘 있다고 알려 주셨다. 풀 냄새가 물씬 풍기는 시골길을 걸으며 민서는 편지를 받을 지은이의 환한 표정을 떠올렸다. 아마 지은이도 웃으며 곧바로 답장을 쓸 것이라는 생각에 민서의 발걸음은 점점 더 가벼워졌다. 우체통 앞에 선 민서는 편지를 넣기 전 한 번 더 꾹 껴안은 뒤, 조심스럽게 투입구에 밀어 넣었다.";

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
      prompt = "이 문장에서 민서가 도착한 곳은 어디인가요?";
      choices = [["A","시골 할머니 댁"],["B","바닷가 펜션"],["C","도시의 친구 집"],["D","학교 기숙사"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "이 문장에서 도시와 다른 시골의 특징으로 언급된 것은 무엇인가요?";
      choices = [["A","매미 소리가 귀를 가득 채운다"],["B","자동차 경적이 끊임없이 울린다"],["C","높은 건물이 하늘을 가린다"],["D","사람들이 빠르게 오가며 걷는다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "민서가 할머니의 부름에 대답하지 않은 까닭은 무엇인가요?";
      choices = [["A","멍하니 하늘만 바라보고 있었기 때문이다"],["B","수박을 좋아하지 않기 때문이다"],["C","할머니의 소리를 듣지 못했기 때문이다"],["D","이미 간식을 먹었기 때문이다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "민서의 마음속을 가득 채운 감정은 무엇인가요?";
      choices = [["A","전학 간 친구 지은이에 대한 그리움"],["B","시험에 대한 불안감"],["C","새로운 학교에 대한 기대"],["D","할머니에 대한 서운함"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "민서와 지은이가 함께 했던 활동은 무엇인가요?";
      choices = [["A","운동장 한쪽 벤치에 앉아 이야기를 나누었다"],["B","방과 후에 도서관에서 공부했다"],["C","점심시간에 함께 노래를 불렀다"],["D","주말마다 영화를 보러 갔다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "민서가 가방에서 꺼낸 것은 무엇인가요?";
      choices = [["A","분홍색 편지지"],["B","일기장"],["C","색연필 세트"],["D","지은이의 사진"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","민서는 시골 할머니 댁에서 전학 간 친구 지은이를 그리워하며 편지를 준비한다"],["B","민서는 할머니 댁에서 수박을 먹으며 즐거운 시간을 보낸다"],["C","민서는 시골의 자연 풍경에 감동하여 그림을 그린다"],["D","민서는 할머니와 함께 텃밭 일을 돕기로 한다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "오후에 일어난 날씨 변화는 무엇인가요?";
      choices = [["A","먹구름이 끼고 굵은 빗방울이 내렸다"],["B","강한 바람이 불어 나무가 흔들렸다"],["C","갑자기 우박이 쏟아졌다"],["D","햇살이 더욱 뜨거워졌다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "처마 끝에서 떨어진 빗줄기가 만든 것은 무엇인가요?";
      choices = [["A","마당 흙 위에 작은 물웅덩이"],["B","지붕 위에 고인 물"],["C","마루 아래로 흐르는 개울"],["D","텃밭을 적시는 냇물"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "빗소리를 듣고 민서가 떠올린 추억은 무엇인가요?";
      choices = [["A","지은이와 교실 창가에서 빗방울의 수를 세던 일"],["B","지은이와 비 오는 날 우산을 함께 쓰던 일"],["C","혼자 비를 맞으며 집에 걸어가던 일"],["D","할머니 댁에서 비를 구경하던 일"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "민서가 편지지를 펼치고 한 행동은 무엇인가요?";
      choices = [["A","천천히 연필을 움직이기 시작했다"],["B","편지지를 접어 종이비행기를 만들었다"],["C","편지지에 그림을 그리기 시작했다"],["D","편지지를 할머니에게 보여 드렸다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "민서가 편지에 쓴 첫 내용의 핵심은 무엇인가요?";
      choices = [["A","할머니 댁에 비가 내리고 함께 세던 빗방울이 여기서도 떨어진다는 것"],["B","시골 음식이 맛있다는 것"],["C","매미 소리가 시끄럽다는 것"],["D","할머니가 건강하시다는 것"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "글을 쓰면서 민서가 느낀 감정의 변화는 무엇인가요?";
      choices = [["A","마음이 점점 따뜻해졌다"],["B","점점 슬픔이 깊어졌다"],["C","지루함을 느꼈다"],["D","화가 나기 시작했다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","빗소리가 불러온 추억을 떠올리며 민서는 지은이에게 정성껏 편지를 쓴다"],["B","민서는 비가 와서 밖에 나가지 못해 심심해한다"],["C","할머니가 민서에게 편지 쓰는 법을 가르쳐 준다"],["D","민서는 비 때문에 우울해져서 낮잠을 잔다"]],
    "A"
  ));

  // p3 (7문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "편지를 다 쓴 뒤 달라진 날씨는 어떠한가요?";
      choices = [["A","비가 그쳐 있었다"],["B","눈이 내리기 시작했다"],["C","바람이 더 세졌다"],["D","다시 비가 쏟아졌다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "마당에 나타난 자연 현상은 무엇인가요?";
      choices = [["A","작은 무지개가 떠올랐다"],["B","안개가 자욱하게 끼었다"],["C","큰 물줄기가 흘렀다"],["D","서리가 내렸다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "민서가 할머니에게 한 말의 내용은 무엇인가요?";
      choices = [["A","우체통에 편지를 넣으러 가겠다"],["B","친구를 만나러 마을에 가겠다"],["C","텃밭에 물을 주겠다"],["D","산책을 하고 오겠다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "할머니가 알려 준 정보는 무엇인가요?";
      choices = [["A","마을 입구 빨간 우체통이 아직 있다는 것"],["B","우체국이 오후에 문을 닫는다는 것"],["C","편지는 이틀이면 도착한다는 것"],["D","마을에 새 우체통이 생겼다는 것"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "시골길을 걸으며 민서가 떠올린 것은 무엇인가요?";
      choices = [["A","편지를 받을 지은이의 환한 표정"],["B","학교에서 있었던 시험 결과"],["C","다음 학기의 시간표"],["D","할머니 댁의 저녁 메뉴"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "민서의 발걸음이 가벼워진 까닭은 무엇인가요?";
      choices = [["A","지은이가 웃으며 답장을 쓸 것이라는 생각이 들었기 때문이다"],["B","비가 그쳐서 기분이 좋아졌기 때문이다"],["C","할머니가 간식을 준비해 두었기 때문이다"],["D","산책이 즐거웠기 때문이다"]];
      answerId = "A";
    } else if (i === 6) {
      prompt = "우체통 앞에서 민서가 한 행동은 무엇인가요?";
      choices = [["A","편지를 한 번 더 꾹 껴안은 뒤 투입구에 넣었다"],["B","편지를 다시 열어 내용을 고쳤다"],["C","우체통 옆에 앉아 쉬었다"],["D","할머니를 기다렸다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","비가 그친 뒤 민서는 편지를 우체통에 넣으며 지은이와의 우정을 이어 간다"],["B","민서는 무지개를 보고 감탄하며 그림을 그린다"],["C","할머니는 민서에게 마을 구경을 시켜 준다"],["D","민서는 우체통을 찾지 못해 편지를 보내지 못한다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "민서가 여름 방학에 도착한 곳은 어디인가요?",
      [findRange(paragraphs, "p1", "할머니 댁")]),
    makeConfirmQ("q2", "민서가 그리워한 친구의 이름은 누구인가요?",
      [findRange(paragraphs, "p1", "지은이")]),
    makeConfirmQ("q3", "빗소리를 듣고 민서가 떠올린 활동은 무엇인가요?",
      [findRange(paragraphs, "p2", "빗방울의 수를 세던")]),
    makeConfirmQ("q4", "편지를 쓰면서 민서의 마음은 어떻게 변했나요?",
      [findRange(paragraphs, "p2", "따뜻해지는")]),
    makeConfirmQ("q5", "비가 그친 뒤 마당에 나타난 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "무지개")]),
    makeConfirmQ("q6", "할머니가 알려 준 우체통의 색깔은 무엇인가요?",
      [findRange(paragraphs, "p3", "빨간")])
  ];

  return assembleFull(56, "LITERATURE", "문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 57 비문학: 소리의 전달 원리 (1001자) ===
// =============================================
function buildDay57() {
  const p1text = "소리는 물체가 떨릴 때 주변의 공기를 밀어내면서 생겨나는 파동이다. 기타 줄을 튕기면 줄이 빠르게 진동하여 주위 공기 분자를 압축하고, 이 압축된 부분이 옆으로 퍼져 나가는 과정이 반복되면서 소리가 전달된다. 이처럼 소리는 공기를 통해 전달되므로 공기가 없는 우주 공간에서는 아무리 큰 폭발이 일어나도 소리를 들을 수 없다. 소리가 이동하는 빠르기를 음속이라 하며, 섭씨 이십 도의 공기 속에서 음속은 초당 약 삼백사십 미터이다. 온도가 올라가면 공기 분자의 움직임이 활발해져 음속이 빨라지고, 반대로 온도가 내려가면 음속이 느려진다. 이러한 원리 때문에 같은 거리에 있는 천둥소리도 여름과 겨울에 도달하는 시간이 미세하게 다를 수 있다.";
  const p2text = "소리는 공기뿐 아니라 물이나 고체를 통해서도 전달된다. 물속에서 소리의 빠르기는 초당 약 천오백 미터로, 공기 속보다 네 배 이상 빠르다. 고체인 철 속에서는 초당 약 오천 미터까지 빨라져서, 옛날 서부 영화에서 인물이 철로에 귀를 대고 먼 곳의 기차 소리를 먼저 듣는 장면은 과학적으로도 타당하다. 이렇게 매질의 종류에 따라 음속이 달라지는 까닭은 분자 사이의 간격과 탄성력이 다르기 때문이다. 분자가 촘촘하고 탄성이 큰 매질일수록 진동이 더 빠르게 옆으로 전해지므로 음속이 높아진다. 따라서 일반적으로 기체보다 액체, 액체보다 고체에서 소리가 더 빠르게 이동한다.";
  const p3text = "우리가 일상에서 듣는 소리에는 높낮이와 세기라는 두 가지 중요한 성질이 있다. 소리의 높낮이는 진동수, 즉 일 초 동안 공기가 몇 번 압축과 팽창을 반복하는지에 따라 결정된다. 진동수가 크면 높은 소리, 작으면 낮은 소리가 나며, 진동수의 단위는 헤르츠이다. 한편 소리의 세기는 진폭, 곧 공기 분자가 밀리는 정도에 의해 정해진다. 같은 높이의 소리라도 세게 치면 진폭이 커져 큰 소리가 나고, 약하게 치면 진폭이 작아져 작은 소리가 난다. 사람의 귀가 들을 수 있는 진동수 범위는 대략 이십 헤르츠에서 이만 헤르츠까지이며, 이 범위를 벗어나는 소리를 각각 초저주파와 초음파라 부른다.";

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
      prompt = "이 문장에 따르면 소리가 생기는 원리는 무엇인가요?";
      choices = [["A","물체가 떨려 공기를 밀어내면서 파동이 생긴다"],["B","빛이 공기 중에서 반사되면서 발생한다"],["C","전기가 흘러 자기장이 변화하면서 만들어진다"],["D","열이 공기를 팽창시키면서 저절로 나타난다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "기타 줄을 튕기면 어떤 과정이 일어나나요?";
      choices = [["A","줄이 진동하여 공기 분자를 압축하고 그것이 퍼져 나간다"],["B","줄에서 빛이 나와 소리로 변환된다"],["C","줄이 끊어지면서 충격파가 발생한다"],["D","줄의 색깔이 변하면서 진동이 보인다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "우주 공간에서 소리를 들을 수 없는 까닭은 무엇인가요?";
      choices = [["A","공기가 없어 소리를 전달할 매질이 없기 때문이다"],["B","우주의 온도가 너무 높기 때문이다"],["C","우주에서는 물체가 떨리지 않기 때문이다"],["D","중력이 없어 파동이 위로 올라가기 때문이다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "섭씨 이십 도의 공기에서 음속은 얼마인가요?";
      choices = [["A","초당 약 삼백사십 미터"],["B","초당 약 천오백 미터"],["C","초당 약 오천 미터"],["D","초당 약 백 미터"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "온도가 올라가면 음속은 어떻게 변하나요?";
      choices = [["A","공기 분자의 움직임이 활발해져 빨라진다"],["B","공기 분자가 느려져서 음속도 느려진다"],["C","음속에는 변화가 없다"],["D","소리가 전달되지 않게 된다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "같은 거리의 천둥소리가 계절에 따라 도달 시간이 다른 까닭은 무엇인가요?";
      choices = [["A","여름과 겨울의 온도 차이가 음속에 영향을 주기 때문이다"],["B","여름에는 구름이 더 낮아 소리가 가까이서 발생하기 때문이다"],["C","겨울에는 바람이 소리를 차단하기 때문이다"],["D","계절마다 번개의 세기가 달라지기 때문이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","소리는 물체의 진동으로 생기는 파동이며 공기 속에서의 음속은 온도에 따라 변한다"],["B","소리는 우주 어디서나 동일한 속도로 전달된다"],["C","기타 줄은 진동 없이도 소리를 낼 수 있다"],["D","음속은 온도와 무관하게 항상 일정하다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "소리가 전달될 수 있는 매질로 언급된 것은 무엇인가요?";
      choices = [["A","공기, 물, 고체"],["B","빛, 열, 전기"],["C","진공, 공기, 빛"],["D","자기장, 중력, 공기"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "물속에서 소리의 빠르기는 공기 속과 비교해 어떠한가요?";
      choices = [["A","네 배 이상 빠르다"],["B","두 배 정도 빠르다"],["C","거의 같다"],["D","절반으로 느리다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "서부 영화에서 철로에 귀를 대는 장면이 과학적으로 타당한 까닭은 무엇인가요?";
      choices = [["A","철 속에서 소리가 공기보다 훨씬 빠르게 전달되기 때문이다"],["B","철로가 소리를 증폭시키는 장치이기 때문이다"],["C","기차가 철로를 진동시키지 않기 때문이다"],["D","철은 소리를 차단하는 성질이 있기 때문이다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "매질에 따라 음속이 달라지는 근본적인 이유는 무엇인가요?";
      choices = [["A","분자 사이의 간격과 탄성력이 다르기 때문이다"],["B","매질의 색깔이 다르기 때문이다"],["C","매질의 온도가 항상 다르기 때문이다"],["D","매질의 무게가 달라지기 때문이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "분자가 촘촘하고 탄성이 큰 매질에서는 어떤 일이 일어나나요?";
      choices = [["A","진동이 더 빠르게 전해져 음속이 높아진다"],["B","진동이 흡수되어 소리가 사라진다"],["C","소리가 반사되어 메아리만 들린다"],["D","음속이 느려져 소리가 왜곡된다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "기체, 액체, 고체 중 소리가 가장 빠른 매질은 무엇인가요?";
      choices = [["A","고체"],["B","액체"],["C","기체"],["D","세 가지 모두 같다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","소리는 매질의 종류에 따라 다른 속도로 전달되며 일반적으로 고체에서 가장 빠르다"],["B","소리는 오직 공기 속에서만 전달될 수 있다"],["C","물속에서는 소리가 전혀 전달되지 않는다"],["D","고체에서 소리가 가장 느리게 이동한다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "소리의 두 가지 중요한 성질로 언급된 것은 무엇인가요?";
      choices = [["A","높낮이와 세기"],["B","색깔과 무게"],["C","온도와 습도"],["D","방향과 거리"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "소리의 높낮이를 결정하는 요인은 무엇인가요?";
      choices = [["A","진동수, 즉 일 초 동안 압축과 팽창이 반복되는 횟수"],["B","공기의 온도와 습도"],["C","소리가 전달되는 매질의 무게"],["D","소리가 발생한 장소의 넓이"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "진동수가 크면 어떤 소리가 나나요?";
      choices = [["A","높은 소리"],["B","낮은 소리"],["C","큰 소리"],["D","작은 소리"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "소리의 세기를 결정하는 요인은 무엇인가요?";
      choices = [["A","진폭, 곧 공기 분자가 밀리는 정도"],["B","진동수의 크기"],["C","매질의 종류"],["D","소리의 높낮이"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "같은 높이의 소리를 세게 치면 어떤 변화가 생기나요?";
      choices = [["A","진폭이 커져 큰 소리가 난다"],["B","진동수가 높아져 높은 소리가 난다"],["C","음속이 빨라져 빠른 소리가 난다"],["D","소리의 높낮이가 바뀐다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "사람의 귀가 들을 수 있는 진동수 범위는 얼마인가요?";
      choices = [["A","대략 이십 헤르츠에서 이만 헤르츠"],["B","대략 백 헤르츠에서 오만 헤르츠"],["C","대략 오 헤르츠에서 천 헤르츠"],["D","대략 만 헤르츠에서 십만 헤르츠"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","소리의 높낮이는 진동수, 세기는 진폭에 의해 결정되며 사람의 가청 범위가 정해져 있다"],["B","소리에는 높낮이만 있고 세기는 측정할 수 없다"],["C","진동수가 클수록 소리의 세기도 함께 커진다"],["D","사람은 모든 범위의 소리를 들을 수 있다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "소리가 생기는 원리를 설명하는 핵심 개념은 무엇인가요?",
      [findRange(paragraphs, "p1", "파동")]),
    makeConfirmQ("q2", "섭씨 이십 도의 공기 속에서 음속은 초당 약 얼마인가요?",
      [findRange(paragraphs, "p1", "삼백사십 미터")]),
    makeConfirmQ("q3", "물속에서 소리의 빠르기는 초당 약 얼마인가요?",
      [findRange(paragraphs, "p2", "천오백 미터")]),
    makeConfirmQ("q4", "매질에 따라 음속이 달라지는 이유와 관련된 두 가지 요인은 무엇인가요?",
      [findRange(paragraphs, "p2", "간격과 탄성력")]),
    makeConfirmQ("q5", "소리의 높낮이를 결정하는 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "진동수")]),
    makeConfirmQ("q6", "가청 범위를 벗어나는 높은 소리를 무엇이라 부르나요?",
      [findRange(paragraphs, "p3", "초음파")])
  ];

  return assembleFull(57, "NONFICTION", "비문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 58 문학: 달빛 아래 약속 (967자) ===
// =============================================
function buildDay58() {
  const p1text = "유진이는 밤마다 베란다에 나가 하늘을 올려다보는 버릇이 있었다. 특히 보름달이 환하게 빛나는 날이면 두 눈이 별처럼 반짝거렸다. 둥글고 환한 달을 바라보고 있으면 어릴 적 동네 뒷산에서 아버지와 나란히 앉아 별을 세던 기억이 떠올랐기 때문이다. 아버지는 해외에서 일하고 계셔서 일 년에 한두 번밖에 만날 수 없었지만, 유진이는 같은 달을 보고 있으면 서로의 마음이 가까워지는 것 같았다. 아버지가 떠나시기 전 마지막으로 건넨 말이 늘 귓가에 맴돌았다. '보름달이 뜨면 아빠도 같은 달을 꼭 보고 있을 거야'라는 그 말을 떠올릴 때마다 유진이는 입가에 작은 미소를 지었다.";
  const p2text = "어느 겨울밤, 유진이는 두꺼운 외투를 단단히 걸치고 베란다로 나갔다. 숨을 내쉬면 하얀 입김이 피어올랐고 손끝은 금세 차갑게 얼어들었지만, 유진이는 아랑곳하지 않았다. 마침 그날 밤하늘에는 크고 밝은 보름달이 구름 한 점 없이 환하게 떠 있었다. 유진이는 주머니에서 작은 수첩을 꺼내 오늘 날짜 옆에 동그란 달 그림을 정성껏 그렸다. 아버지에게 전화를 걸고 싶었지만 시차 때문에 지금쯤 아버지는 먼 나라에서 한창 일하고 있을 시간이었다. 유진이는 대신 수첩에 '오늘도 보름달이 떴어요, 아빠도 보고 계시죠'라고 정성스럽게 적고 나서 고개를 들어 다시 달을 바라보았다.";
  const p3text = "다음 날 아침, 유진이의 휴대전화에 아버지가 보낸 사진 한 장이 도착해 있었다. 사진 속에는 이국적인 건물들 사이로 떠오른 커다란 보름달이 선명하게 담겨 있었고, 그 아래에 '유진아, 아빠도 봤단다'라는 짧은 글이 적혀 있었다. 유진이는 그 한 줄의 문장을 읽고 또 읽으며 눈시울이 뜨거워졌다. 서로 수천 킬로미터나 떨어져 있어도 같은 달을 올려다보았다는 사실이 마법처럼 느껴졌기 때문이다. 유진이는 아버지의 사진을 수첩 첫 페이지에 소중히 붙이고, 다음 보름달이 뜨는 밤을 기다리기로 마음먹었다. 달은 매달 차고 기울기를 반복했지만, 부녀 사이의 그 약속만큼은 언제나 변하지 않을 것이었다.";

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
      prompt = "유진이가 밤마다 하는 행동은 무엇인가요?";
      choices = [["A","베란다에 나가 하늘을 올려다본다"],["B","방에서 책을 읽는다"],["C","마당에 나가 산책을 한다"],["D","거실에서 텔레비전을 본다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "보름달이 뜨는 날 유진이의 반응은 어떠한가요?";
      choices = [["A","두 눈이 별처럼 반짝거린다"],["B","일찍 잠자리에 든다"],["C","무서워서 커튼을 닫는다"],["D","친구에게 전화를 건다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "달을 보면 유진이가 떠올리는 기억은 무엇인가요?";
      choices = [["A","동네 뒷산에서 아버지와 별을 세던 기억"],["B","학교에서 친구들과 놀던 기억"],["C","어머니와 시장에 가던 기억"],["D","할머니 댁에서 보름달을 보던 기억"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "아버지를 일 년에 한두 번밖에 만나지 못하는 이유는 무엇인가요?";
      choices = [["A","아버지가 해외에서 일하고 계시기 때문이다"],["B","아버지가 다른 도시에 출장이 많기 때문이다"],["C","유진이가 기숙사에서 생활하기 때문이다"],["D","집에서 학교까지 거리가 멀기 때문이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "아버지가 떠나기 전 마지막으로 한 말의 핵심은 무엇인가요?";
      choices = [["A","보름달이 뜨면 아빠도 같은 달을 보고 있을 것이다"],["B","매주 전화를 하겠다"],["C","곧 돌아오겠다"],["D","선물을 보내 주겠다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "유진이가 그 말을 떠올릴 때마다 짓는 것은 무엇인가요?";
      choices = [["A","입가에 작은 미소"],["B","눈물을 흘린다"],["C","한숨을 쉰다"],["D","고개를 숙인다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","유진이는 보름달을 보며 해외에 계신 아버지와의 약속을 떠올리고 위안을 얻는다"],["B","유진이는 별을 관찰하는 과학 과제를 수행한다"],["C","아버지는 유진이와 함께 별을 세러 뒷산에 올라간다"],["D","유진이는 보름달을 싫어하여 커튼을 닫는다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "겨울밤 유진이가 베란다로 나갈 때 걸친 것은 무엇인가요?";
      choices = [["A","두꺼운 외투"],["B","얇은 잠옷"],["C","비옷"],["D","담요"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "숨을 내쉬었을 때 나타난 현상과 유진이의 태도는 어떠한가요?";
      choices = [["A","하얀 입김이 피어올랐지만 아랑곳하지 않았다"],["B","따뜻한 바람이 불어 기분이 좋았다"],["C","눈이 내려서 곧바로 들어갔다"],["D","추위에 바로 방으로 돌아갔다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "그날 밤 하늘에 떠 있던 것은 무엇인가요?";
      choices = [["A","구름 한 점 없이 크고 밝은 보름달"],["B","수많은 별"],["C","구름에 가린 반달"],["D","밝은 유성"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "유진이가 수첩에 그린 것은 무엇인가요?";
      choices = [["A","오늘 날짜 옆에 동그란 달 그림"],["B","아버지의 얼굴"],["C","집 앞의 나무"],["D","자신의 손 모양"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "유진이가 아버지에게 전화를 걸지 못한 까닭은 무엇인가요?";
      choices = [["A","시차 때문에 아버지가 일하고 있을 시간이었기 때문이다"],["B","전화기가 고장 났기 때문이다"],["C","전화 요금이 비쌌기 때문이다"],["D","아버지가 전화를 받지 않기 때문이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "유진이가 수첩에 적은 뒤에 한 행동은 무엇인가요?";
      choices = [["A","고개를 들어 다시 달을 바라보았다"],["B","곧바로 잠자리에 들었다"],["C","어머니에게 수첩을 보여 드렸다"],["D","수첩을 덮고 방으로 들어갔다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","겨울밤 보름달을 보며 유진이는 수첩에 아버지에게 보내는 마음을 기록한다"],["B","유진이는 추운 날씨 때문에 베란다에 오래 있지 못한다"],["C","유진이는 아버지에게 전화를 걸어 오래 대화를 나눈다"],["D","유진이는 겨울이 싫어서 봄을 기다린다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "다음 날 아침 유진이의 휴대전화에 도착한 것은 무엇인가요?";
      choices = [["A","아버지가 보낸 사진 한 장"],["B","어머니의 음성 메시지"],["C","친구의 문자"],["D","학교의 알림"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "사진과 함께 적혀 있던 아버지의 글은 무엇인가요?";
      choices = [["A","유진아, 아빠도 봤단다"],["B","유진아, 빨리 자렴"],["C","유진아, 곧 갈게"],["D","유진아, 공부 열심히 해"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "유진이가 문장을 읽으며 느낀 감정은 무엇인가요?";
      choices = [["A","눈시울이 뜨거워졌다"],["B","화가 나서 휴대전화를 내려놓았다"],["C","무관심하게 지나쳤다"],["D","놀라서 소리를 질렀다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "같은 달을 보았다는 사실이 유진이에게 어떻게 느껴졌나요?";
      choices = [["A","마법처럼 느껴졌다"],["B","당연하게 여겨졌다"],["C","슬프게 느껴졌다"],["D","무섭게 느껴졌다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "유진이가 수첩 첫 페이지에 붙인 것은 무엇인가요?";
      choices = [["A","아버지의 사진"],["B","보름달 그림"],["C","자신이 쓴 편지"],["D","달력"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "마지막 문장에서 변하지 않을 것이라 한 것은 무엇인가요?";
      choices = [["A","부녀 사이의 보름달 약속"],["B","매달 전화를 하겠다는 약속"],["C","방학 때 만나겠다는 약속"],["D","수첩을 매일 쓰겠다는 약속"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","아버지가 보낸 보름달 사진을 통해 유진이는 약속이 지켜지고 있음을 확인하며 감동받는다"],["B","유진이는 아버지의 사진을 보고 실망한다"],["C","아버지는 유진이에게 선물을 보내기로 한다"],["D","유진이는 더 이상 보름달에 관심을 두지 않는다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "유진이가 보름달을 보며 떠올리는 추억의 장소는 어디인가요?",
      [findRange(paragraphs, "p1", "뒷산")]),
    makeConfirmQ("q2", "아버지가 떠나기 전 한 약속의 핵심 소재는 무엇인가요?",
      [findRange(paragraphs, "p1", "보름달")]),
    makeConfirmQ("q3", "유진이가 아버지에게 전화를 걸지 못한 이유는 무엇인가요?",
      [findRange(paragraphs, "p2", "시차")]),
    makeConfirmQ("q4", "유진이가 수첩의 날짜 옆에 그린 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "달 그림")]),
    makeConfirmQ("q5", "아버지가 보낸 사진 아래에 적힌 핵심 내용은 무엇인가요?",
      [findRange(paragraphs, "p3", "아빠도 봤단다")]),
    makeConfirmQ("q6", "유진이가 아버지의 사진을 붙인 곳은 수첩의 어디인가요?",
      [findRange(paragraphs, "p3", "첫 페이지")])
  ];

  return assembleFull(58, "LITERATURE", "문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 59 비문학: 지도의 역사와 발전 (956자) ===
// =============================================
function buildDay59() {
  const p1text = "인류가 지도를 만들기 시작한 것은 문자를 사용하기 이전으로 거슬러 올라간다. 고대인들은 동굴 벽이나 점토판에 자신이 사는 지역의 강과 산, 사냥터를 간단한 그림으로 표시했다. 초기 지도에는 정확한 축척이나 방위 표시가 없었지만, 주변 환경을 기억하고 타인에게 정보를 전달하는 데 유용했다. 기원전 이백 년경 고대 그리스의 에라토스테네스는 지구의 둘레를 최초로 계산하고, 위도와 경도 개념을 도입하여 체계적인 지도의 기틀을 마련했다. 로마 시대에는 도로망을 나타낸 실용적인 지도가 만들어졌고, 중세에는 종교적 세계관을 반영한 지도가 유행했다. 이처럼 지도는 시대마다 사람들이 세계를 이해하는 방식을 고스란히 담아 왔다.";
  const p2text = "대항해 시대가 열리면서 지도 제작 기술은 크게 발전했다. 탐험가들이 새로운 대륙과 항로를 발견할 때마다 지도에는 이전에 없던 땅과 바다가 추가되었다. 십육 세기 메르카토르는 지구의 곡면을 평면에 펼치는 도법을 고안하여 항해사들이 직선 경로를 쉽게 설정할 수 있게 했다. 이 도법은 오늘날에도 항해 지도의 기본 틀로 쓰인다. 한편 조선에서는 김정호가 오랜 답사 끝에 대동여지도를 완성하였는데, 산맥과 하천을 체계적으로 표현한 뛰어난 작품으로 평가받는다. 동서양 모두 당시의 기술과 지식을 총동원하여 정확한 지도를 만들기 위해 노력했다.";
  const p3text = "현대에 들어와 지도는 종이에서 디지털로 전환되었다. 인공위성 사진과 항공 측량 기술 덕분에 지구 표면을 센티미터 단위까지 기록할 수 있게 되었다. 휴대전화의 지도 앱은 현재 위치를 실시간으로 표시하고, 최적 경로를 안내하며, 교통 상황을 반영한 도착 예상 시간까지 알려준다. 가상 현실 기술과 결합된 삼차원 지도는 산악 지형의 높낮이를 생생하게 체험하게 해 준다. 하지만 기술이 아무리 발전해도 지도의 본질은 변하지 않았다. 지도란 사람이 자신의 위치를 파악하고 세계를 이해하기 위한 도구이며, 이 목적은 동굴 벽에 그림을 그리던 시절이나 오늘날이나 동일하다.";

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
      prompt = "인류가 지도를 만들기 시작한 시기는 언제쯤인가요?";
      choices = [["A","문자를 사용하기 이전"],["B","산업 혁명 이후"],["C","중세 유럽 시대"],["D","현대 디지털 시대"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "고대인들이 지도를 그린 재료로 언급된 것은 무엇인가요?";
      choices = [["A","동굴 벽이나 점토판"],["B","종이와 붓"],["C","나무 껍질과 열매 즙"],["D","천과 염료"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "초기 지도의 한계는 무엇인가요?";
      choices = [["A","정확한 축척이나 방위 표시가 없었다"],["B","너무 정밀하여 제작이 어려웠다"],["C","한 사람만 볼 수 있었다"],["D","글자로만 표현되어 이해가 어려웠다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "에라토스테네스가 최초로 한 업적은 무엇인가요?";
      choices = [["A","지구의 둘레를 계산하고 위도와 경도 개념을 도입했다"],["B","최초의 항해 지도를 제작했다"],["C","인쇄 기술을 이용하여 지도를 복제했다"],["D","대륙의 정확한 면적을 측정했다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "로마 시대와 중세의 지도 특징으로 올바르게 짝지은 것은 무엇인가요?";
      choices = [["A","로마는 도로망 표시, 중세는 종교적 세계관 반영"],["B","로마는 항해용, 중세는 군사용"],["C","로마는 천체 지도, 중세는 농경 지도"],["D","로마와 중세 모두 동일한 형식을 사용했다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장의 핵심 주장은 무엇인가요?";
      choices = [["A","지도는 시대마다 세계를 이해하는 방식을 담아 왔다"],["B","지도는 항상 같은 형태로 만들어졌다"],["C","지도는 오직 학자들만 사용했다"],["D","지도는 과학 발전과 무관하다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","지도는 고대부터 시작되어 시대에 따라 세계를 이해하는 방식을 반영하며 발전해 왔다"],["B","에라토스테네스 이전에는 지도가 존재하지 않았다"],["C","고대 지도는 현대 지도보다 더 정확했다"],["D","중세의 지도는 과학적으로 가장 뛰어났다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "대항해 시대에 지도 제작 기술이 크게 발전한 계기는 무엇인가요?";
      choices = [["A","대항해 시대가 열리면서 탐험이 활발해졌기 때문이다"],["B","종이 제조 기술이 발명되었기 때문이다"],["C","인공위성이 발사되었기 때문이다"],["D","인쇄술이 발달했기 때문이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "탐험가들의 발견이 지도에 미친 영향은 무엇인가요?";
      choices = [["A","이전에 없던 땅과 바다가 추가되었다"],["B","기존 지도의 내용이 삭제되었다"],["C","지도의 크기가 줄어들었다"],["D","지도의 색상만 변경되었다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "메르카토르가 고안한 것은 무엇인가요?";
      choices = [["A","지구의 곡면을 평면에 펼치는 도법"],["B","지도에 색을 입히는 기술"],["C","해저 지형을 그리는 방법"],["D","별자리를 지도에 표시하는 기법"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "메르카토르 도법이 오늘날에도 쓰이는 분야는 무엇인가요?";
      choices = [["A","항해 지도"],["B","기상 예보 지도"],["C","천체 관측 지도"],["D","건축 설계 도면"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "김정호가 완성한 지도의 이름은 무엇인가요?";
      choices = [["A","대동여지도"],["B","천하도"],["C","혼일강리역대국도지도"],["D","동국지도"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장의 핵심 내용은 무엇인가요?";
      choices = [["A","동서양 모두 정확한 지도를 만들기 위해 노력했다"],["B","동양의 지도는 서양보다 항상 뛰어났다"],["C","지도 제작은 오직 서양에서만 발전했다"],["D","대항해 시대 이후 지도 제작이 중단되었다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","대항해 시대에 동서양 모두 기술을 동원하여 정확한 지도를 만들기 위해 노력했다"],["B","메르카토르의 도법은 현대에는 쓰이지 않는다"],["C","김정호의 대동여지도는 서양 기술을 그대로 모방했다"],["D","대항해 시대에는 지도보다 나침반이 더 중요했다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "현대에 지도가 겪은 가장 큰 변화는 무엇인가요?";
      choices = [["A","종이에서 디지털로 전환되었다"],["B","색깔이 더 다양해졌다"],["C","크기가 매우 작아졌다"],["D","외국어로만 표기되기 시작했다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "인공위성과 항공 측량 기술 덕분에 가능해진 것은 무엇인가요?";
      choices = [["A","지구 표면을 센티미터 단위까지 기록할 수 있게 되었다"],["B","바다 밑의 생물을 관찰할 수 있게 되었다"],["C","날씨를 정확히 예측할 수 있게 되었다"],["D","우주 행성의 지도를 만들 수 있게 되었다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "휴대전화의 지도 앱이 제공하는 기능이 아닌 것은 무엇인가요?";
      choices = [["A","주변 음식점의 메뉴를 추천한다"],["B","현재 위치를 실시간으로 표시한다"],["C","최적 경로를 안내한다"],["D","교통 상황을 반영하여 도착 시간을 알려준다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "삼차원 지도를 가능하게 한 기술은 무엇인가요?";
      choices = [["A","가상 현실 기술"],["B","인쇄 기술"],["C","사진 필름 기술"],["D","목판 인쇄 기술"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "기술이 발전해도 변하지 않은 지도의 본질은 무엇인가요?";
      choices = [["A","위치를 파악하고 세계를 이해하기 위한 도구이다"],["B","예술 작품으로서의 가치를 지니는 것이다"],["C","국가 간 경계를 정하기 위한 문서이다"],["D","군사적 목적으로만 사용되는 것이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "지도의 목적이 동굴 벽 시절과 동일하다는 말이 의미하는 것은 무엇인가요?";
      choices = [["A","시대가 바뀌어도 지도의 본질적 목적은 같다"],["B","현대 지도는 고대와 같은 방식으로 만든다"],["C","동굴 벽 지도가 현대 지도보다 우수하다"],["D","지도 기술의 발전이 불필요하다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","디지털 기술로 지도는 크게 발전했지만, 위치 파악과 세계 이해라는 본질은 변하지 않았다"],["B","현대 지도는 너무 복잡해서 사용하기 어렵다"],["C","종이 지도가 디지털 지도보다 더 정확하다"],["D","삼차원 지도가 개발되면서 종이 지도는 완전히 사라졌다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "지구의 둘레를 최초로 계산한 고대 그리스 학자는 누구인가요?",
      [findRange(paragraphs, "p1", "에라토스테네스")]),
    makeConfirmQ("q2", "에라토스테네스가 도입한 개념 두 가지는 무엇인가요?",
      [findRange(paragraphs, "p1", "위도와 경도")]),
    makeConfirmQ("q3", "지구의 곡면을 평면에 펼치는 도법을 고안한 사람은 누구인가요?",
      [findRange(paragraphs, "p2", "메르카토르")]),
    makeConfirmQ("q4", "김정호가 완성한 유명한 지도의 이름은 무엇인가요?",
      [findRange(paragraphs, "p2", "대동여지도")]),
    makeConfirmQ("q5", "현대 지도의 정밀한 기록을 가능하게 한 기술은 무엇인가요?",
      [findRange(paragraphs, "p3", "인공위성")]),
    makeConfirmQ("q6", "삼차원 지도를 가능하게 한 기술은 무엇인가요?",
      [findRange(paragraphs, "p3", "가상 현실")])
  ];

  return assembleFull(59, "NONFICTION", "비문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 60 문학: 겨울 정원의 씨앗 (971자) ===
// =============================================
function buildDay60() {
  const p1text = "겨울이 깊어지자 수아네 집 뒤뜰의 화단은 잿빛으로 변해 버렸다. 여름 내내 활짝 피어 있던 해바라기와 코스모스는 이미 말라 비틀어졌고, 흙은 단단하게 얼어 있었다. 수아는 창문 너머로 텅 빈 화단을 바라보며 깊은 한숨을 쉬었다. 할아버지가 꽃 돌보는 법을 가르쳐 주시며 봄마다 정성껏 심어 둔 씨앗들이 모두 사라진 것처럼 보였다. 할아버지는 지난가을에 편찮으셔서 더 이상 화단을 가꾸지 못하셨고, 수아 혼자 힘으로는 어떻게 해야 할지 알 수가 없었다. 수아는 무심코 장갑을 낀 손으로 창틀을 짚으며, 봄이 와도 꽃이 다시 피지 않을 것 같다는 생각에 마음이 무거웠다.";
  const p2text = "어느 날 수아는 다락방을 정리하다가 구석에 놓인 낡은 서랍에서 할아버지의 씨앗 상자를 발견했다. 나무 상자 위에는 할아버지의 정갈한 글씨로 '봄을 기다리는 보물'이라고 적혀 있었다. 뚜껑을 조심스럽게 열자 작은 봉지 여러 개가 가지런히 놓여 있었고, 각 봉지에는 해바라기, 봉선화, 채송화 같은 꽃 이름표가 붙어 있었다. 수아는 할아버지가 매년 가을이면 다 핀 꽃에서 씨앗을 골라 모아 두었다는 사실을 그제야 알게 되었다. 봉지 하나를 살며시 열어 보니 깨알처럼 작은 씨앗 수십 개가 손바닥 위로 쏟아져 나왔다. 수아는 이 작은 알갱이 속에 꽃 한 송이의 생명이 고스란히 숨어 있다는 것이 신기하기만 했다.";
  const p3text = "수아는 겨울 동안 씨앗 상자를 소중히 품고 봄을 기다렸다. 눈이 녹고 땅이 부드러워지자, 수아는 호미와 물뿌리개를 들고 화단으로 나갔다. 할아버지가 하시던 대로 흙을 고르게 갈고, 적당한 간격으로 작은 구멍을 판 뒤에 한 알 한 알 정성스럽게 씨앗을 넣었다. 물을 주며 수아는 할아버지가 늘 하시던 '씨앗은 기다릴 줄 아는 사람에게만 꽃을 보여 준단다'라는 말을 떠올렸다. 며칠이 지나자 흙 사이로 연둣빛 떡잎이 삐죽 고개를 내밀었다. 수아는 그 작은 싹을 보며 환하게 웃었고, 할아버지의 씨앗 상자 속 보물이 마침내 세상 밖으로 나오기 시작했다는 것을 깨달았다.";

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
      prompt = "겨울이 깊어지자 화단의 모습은 어떻게 변했나요?";
      choices = [["A","잿빛으로 변해 버렸다"],["B","화려한 꽃이 더 많이 피었다"],["C","초록색 풀이 자라기 시작했다"],["D","하얀 눈으로 덮여 아름다웠다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "여름에 피어 있던 꽃으로 언급된 것은 무엇인가요?";
      choices = [["A","해바라기와 코스모스"],["B","장미와 백합"],["C","국화와 튤립"],["D","봉선화와 채송화"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "수아가 화단을 보며 한 행동은 무엇인가요?";
      choices = [["A","깊은 한숨을 쉬었다"],["B","웃으며 뛰어나갔다"],["C","할아버지를 불렀다"],["D","사진을 찍었다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "수아가 잃어버렸다고 느낀 것은 무엇인가요?";
      choices = [["A","할아버지가 심어 둔 씨앗들"],["B","자신의 장난감"],["C","학교 숙제"],["D","친구에게 받은 선물"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "할아버지가 화단을 가꾸지 못하게 된 까닭은 무엇인가요?";
      choices = [["A","편찮으셔서 더 이상 할 수 없었다"],["B","다른 지역으로 이사를 가셨다"],["C","화단에 관심을 잃으셨다"],["D","날씨가 너무 더웠기 때문이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "수아가 마음이 무거웠던 까닭은 무엇인가요?";
      choices = [["A","봄이 와도 꽃이 다시 피지 않을 것 같아서"],["B","학교 시험이 곧 있어서"],["C","친구와 다투었기 때문에"],["D","겨울 방학이 끝나가서"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","겨울에 화단이 황폐해지자 수아는 할아버지의 부재로 꽃이 다시 필지 걱정한다"],["B","수아는 겨울에도 화단에 꽃을 심어 성공적으로 키운다"],["C","할아버지는 겨울에도 매일 화단을 돌본다"],["D","수아는 화단에 관심이 없어 돌보지 않는다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "수아가 다락방에서 발견한 것은 무엇인가요?";
      choices = [["A","할아버지의 씨앗 상자"],["B","할아버지의 사진 앨범"],["C","오래된 일기장"],["D","낡은 화분"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "나무 상자 위에 적힌 글은 무엇인가요?";
      choices = [["A","봄을 기다리는 보물"],["B","할아버지의 추억"],["C","소중한 기억"],["D","비밀 상자"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "상자 안에 들어 있던 것은 무엇인가요?";
      choices = [["A","이름표가 붙은 작은 봉지 여러 개"],["B","마른 꽃다발"],["C","할아버지의 편지"],["D","정원 도구"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "수아가 그제야 알게 된 사실은 무엇인가요?";
      choices = [["A","할아버지가 매년 가을 꽃씨를 모아 두었다는 것"],["B","화단에 이미 새 꽃이 피었다는 것"],["C","다락방에 보물이 숨겨져 있었다는 것"],["D","할아버지가 꽃을 좋아하지 않으셨다는 것"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "봉지 하나를 열었을 때 나온 것은 무엇인가요?";
      choices = [["A","깨알처럼 작은 씨앗 수십 개"],["B","마른 꽃잎 몇 장"],["C","흙과 모래"],["D","작은 구슬"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "수아가 신기하게 느낀 것은 무엇인가요?";
      choices = [["A","작은 알갱이 속에 꽃 한 송이의 생명이 숨어 있다는 것"],["B","상자가 오래되었는데도 깨끗하다는 것"],["C","다락방에 먼지가 없다는 것"],["D","씨앗의 색깔이 모두 같다는 것"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","수아는 다락방에서 할아버지가 모아 둔 씨앗 상자를 발견하고 희망을 느낀다"],["B","수아는 다락방에서 할아버지의 오래된 사진을 발견한다"],["C","할아버지는 수아에게 씨앗 상자를 직접 전해 준다"],["D","수아는 다락방을 정리하다가 지루해한다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "수아가 겨울 동안 한 일은 무엇인가요?";
      choices = [["A","씨앗 상자를 소중히 품고 봄을 기다렸다"],["B","화단에 씨앗을 바로 심었다"],["C","할아버지에게 전화를 걸었다"],["D","다른 꽃을 사러 갔다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "봄이 오자 수아가 들고 나간 도구는 무엇인가요?";
      choices = [["A","호미와 물뿌리개"],["B","삽과 갈퀴"],["C","장갑과 가위"],["D","망치와 못"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "수아가 씨앗을 심은 방법으로 올바른 것은 무엇인가요?";
      choices = [["A","흙을 갈고 구멍을 판 뒤 한 알 한 알 넣었다"],["B","씨앗을 한꺼번에 뿌렸다"],["C","화분에 나누어 심었다"],["D","씨앗을 물에 담가 두었다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "할아버지가 늘 하시던 말의 핵심은 무엇인가요?";
      choices = [["A","씨앗은 기다릴 줄 아는 사람에게만 꽃을 보여 준다"],["B","꽃은 비가 와야만 핀다"],["C","화단은 매일 돌봐야 한다"],["D","씨앗은 깊이 심을수록 좋다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "며칠 뒤 흙 사이로 나타난 것은 무엇인가요?";
      choices = [["A","연둣빛 떡잎"],["B","커다란 꽃봉오리"],["C","잡초"],["D","벌레"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "수아가 깨달은 것은 무엇인가요?";
      choices = [["A","할아버지의 씨앗 상자 속 보물이 세상 밖으로 나오기 시작했다"],["B","화단에 꽃을 심는 것은 어렵다"],["C","씨앗은 겨울에만 심어야 한다"],["D","할아버지의 상자에는 씨앗이 없었다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","수아는 봄에 할아버지의 씨앗을 정성껏 심고 싹이 트는 것을 보며 기뻐한다"],["B","수아는 씨앗을 심었지만 꽃이 피지 않아 실망한다"],["C","할아버지가 직접 나와 화단을 가꾸신다"],["D","수아는 화단을 포기하고 다른 취미를 찾는다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "겨울에 화단의 흙 상태는 어떠했나요?",
      [findRange(paragraphs, "p1", "얼어")]),
    makeConfirmQ("q2", "할아버지의 씨앗 상자 위에 적힌 글은 무엇인가요?",
      [findRange(paragraphs, "p2", "봄을 기다리는 보물")]),
    makeConfirmQ("q3", "씨앗 봉지에 붙어 있던 이름표에 적힌 꽃 이름 중 하나는 무엇인가요?",
      [findRange(paragraphs, "p2", "해바라기")]),
    makeConfirmQ("q4", "수아가 봄에 화단으로 나갈 때 들고 간 도구는 무엇인가요?",
      [findRange(paragraphs, "p3", "호미")]),
    makeConfirmQ("q5", "할아버지의 말씀에 따르면 씨앗이 꽃을 보여 주는 대상은 누구인가요?",
      [findRange(paragraphs, "p3", "기다릴 줄 아는 사람")]),
    makeConfirmQ("q6", "흙 사이로 고개를 내민 것의 색깔은 무엇인가요?",
      [findRange(paragraphs, "p3", "연둣빛")])
  ];

  return assembleFull(60, "LITERATURE", "문학", paragraphs, timeline, cards, confirmQs);
}

// === 메인 실행 ===
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const batchPath = path.join(ROOT, 'generated', 'daily-batch-reading-frege3.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'frege3');

  // 배치 파일 읽기
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

  // Day 56~60 콘텐츠 빌드
  const days = [
    { dayIndex: 56, builder: buildDay56 },
    { dayIndex: 57, builder: buildDay57 },
    { dayIndex: 58, builder: buildDay58 },
    { dayIndex: 59, builder: buildDay59 },
    { dayIndex: 60, builder: buildDay60 }
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
