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
// === Day 66 문학: 첫 눈 오던 날 (986자) ===
// =============================================
function buildDay66() {
  const p1text = "열한 살이 된 겨울, 민서는 새 학교에 전학을 온 지 한 달째였지만 여전히 교실에서 혼자였다. 쉬는 시간에도 친구들은 이미 짝이 정해져 있는 듯했고, 민서는 아무도 말을 걸어 주지 않아 창밖만 멍하니 바라보며 시간을 보냈다. 그런데 그날따라 회색빛 하늘에서 하얀 눈송이가 한 송이 두 송이 천천히 내려오기 시작했다. 운동장이 순식간에 솜이불을 덮은 듯 하얘지자 아이들은 환호성을 지르며 밖으로 뛰어나갔다. 민서도 망설이다가 복도 끝까지 걸어 나왔지만, 운동장에 들어서지 못하고 처마 밑에 서서 아이들이 눈을 뭉치는 모습을 혼자 지켜보았다. 그때 같은 반 지유가 웃으며 뛰어오더니 민서의 손에 동그란 눈뭉치를 하나 쥐여 주고는 밝게 인사했다.";
  const p2text = "지유는 같이 눈사람 만들자고 말하며 민서의 팔을 잡아끌었다. 민서는 어색했지만 거절하지 못한 채 운동장 한가운데로 따라갔다. 둘은 눈을 굴려 커다란 몸통을 만들고, 작은 눈덩이를 조심스럽게 올려 머리를 완성했다. 지유가 호주머니에서 당근 모양 과자를 꺼내 눈사람의 코에 꽂자 민서는 그만 웃음을 터뜨리고 말았다. 그 웃음을 시작으로 둘은 눈사람 옆에 나란히 앉아 김이 모락모락 나는 입김을 불며 서로의 이야기를 나누었다. 지유는 작년에 자기도 전학을 와서 한 학기 동안 혼자였다며 민서의 외로운 마음을 정확히 알겠다고 조용히 말했다.";
  const p3text = "종이 울려 교실로 돌아가는 길, 민서는 장갑 없이 빨갛게 언 손을 호호 불며 걸었다. 지유가 자기 장갑 한 짝을 빼서 민서에게 끼워 주었고, 둘은 서로 장갑 낀 손과 맨손을 번갈아 호주머니에 넣으며 까르르 웃었다. 교실에 돌아온 민서는 창밖에 그대로 서 있는 눈사람을 바라보며 입가에 미소가 번졌다. 당근 과자 코가 살짝 기울어진 그 눈사람이 마치 자기에게 장난스럽게 윙크하는 것처럼 보였다. 수업이 끝난 뒤 민서는 일기장을 펼치고 오늘 처음으로 이 학교가 좋아졌다라고 정성껏 적었다. 밖에서는 여전히 눈이 소복소복 내리고 있었고, 민서의 마음속에도 따뜻한 눈꽃이 소리 없이 쌓이고 있었다.";

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
      prompt = "민서의 현재 상황은 어떠한가요?";
      choices = [["A","전학을 온 지 한 달째이지만 여전히 혼자이다"],["B","전학을 와서 친구가 많다"],["C","전학을 오기 전 학교에 있다"],["D","여름 방학 중이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "쉬는 시간에 민서가 하는 행동은 무엇인가요?";
      choices = [["A","창밖만 멍하니 바라보며 시간을 보냈다"],["B","친구들과 놀았다"],["C","책을 읽었다"],["D","선생님과 이야기했다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "그날 하늘에서 내리기 시작한 것은 무엇인가요?";
      choices = [["A","하얀 눈송이"],["B","가랑비"],["C","우박"],["D","꽃잎"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "운동장이 하얘지자 아이들은 어떻게 했나요?";
      choices = [["A","환호성을 지르며 밖으로 뛰어나갔다"],["B","교실에 그대로 있었다"],["C","도서관으로 갔다"],["D","체육관에서 놀았다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "민서가 운동장에 들어서지 못한 이유를 짐작할 수 있는 것은 무엇인가요?";
      choices = [["A","친구가 없어 망설였기 때문이다"],["B","감기에 걸렸기 때문이다"],["C","눈이 싫었기 때문이다"],["D","선생님이 못 나가게 했기 때문이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "지유가 민서에게 한 행동은 무엇인가요?";
      choices = [["A","눈뭉치를 손에 쥐여 주고 밝게 인사했다"],["B","혼자 놀라고 말했다"],["C","교실로 돌아가자고 했다"],["D","우산을 건네주었다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","혼자였던 전학생 민서에게 눈 오는 날 지유가 다가온다"],["B","민서는 눈을 싫어한다"],["C","모든 아이들이 교실에 남아 있었다"],["D","민서는 전학 온 날부터 친구가 많았다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "지유가 민서에게 제안한 것은 무엇인가요?";
      choices = [["A","같이 눈사람을 만들자고 했다"],["B","같이 교실에 있자고 했다"],["C","같이 눈싸움을 하자고 했다"],["D","같이 집에 가자고 했다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "민서가 운동장 한가운데로 간 경위는 어떠한가요?";
      choices = [["A","어색했지만 거절하지 못하고 따라갔다"],["B","자발적으로 뛰어갔다"],["C","선생님이 보내셨다"],["D","다른 친구들이 불렀다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "둘이 만든 눈사람의 구조는 어떠한가요?";
      choices = [["A","눈을 굴려 몸통을 만들고 작은 눈덩이로 머리를 완성했다"],["B","네모난 눈 블록을 쌓았다"],["C","눈으로 동물 모양을 만들었다"],["D","눈으로 성을 쌓았다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "민서가 웃음을 터뜨린 이유는 무엇인가요?";
      choices = [["A","지유가 당근 모양 과자를 눈사람 코에 꽂았기 때문이다"],["B","눈사람이 넘어졌기 때문이다"],["C","다른 친구가 우스운 이야기를 했기 때문이다"],["D","선생님이 재미있는 말을 하셨기 때문이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "웃음 뒤에 둘이 한 행동은 무엇인가요?";
      choices = [["A","눈사람 옆에 앉아 입김을 불며 이야기를 나누었다"],["B","교실로 바로 돌아갔다"],["C","다른 친구들에게 갔다"],["D","눈사람을 부수었다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "지유가 민서의 마음을 알겠다고 말한 이유는 무엇인가요?";
      choices = [["A","자기도 작년에 전학 와서 한 학기 동안 혼자였기 때문이다"],["B","민서가 직접 이야기해 주었기 때문이다"],["C","선생님이 알려 주셨기 때문이다"],["D","민서의 일기장을 읽었기 때문이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","지유와 함께 눈사람을 만들며 민서는 처음으로 웃고 마음을 연다"],["B","민서는 눈사람 만들기를 거절한다"],["C","지유는 민서를 놀린다"],["D","눈사람이 금방 녹아 버렸다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "교실로 돌아가는 길에 민서의 손 상태는 어떠했나요?";
      choices = [["A","장갑 없이 빨갛게 얼어 있었다"],["B","장갑을 끼고 따뜻했다"],["C","주머니에 넣고 있었다"],["D","핫팩을 들고 있었다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "지유가 민서에게 해 준 행동은 무엇인가요?";
      choices = [["A","자기 장갑 한 짝을 빼서 끼워 주었다"],["B","따뜻한 음료를 건넸다"],["C","교실까지 뛰어가자고 했다"],["D","핫팩을 나눠 주었다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "교실에 돌아온 민서가 창밖을 보며 느낀 감정은 무엇인가요?";
      choices = [["A","입가에 미소가 번졌다"],["B","슬퍼졌다"],["C","화가 났다"],["D","무표정이었다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "눈사람의 당근 과자 코가 민서에게 어떻게 보였나요?";
      choices = [["A","자기에게 장난스럽게 윙크하는 것처럼 보였다"],["B","무섭게 보였다"],["C","슬프게 보였다"],["D","아무 느낌이 없었다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "민서가 일기장에 적은 내용은 무엇인가요?";
      choices = [["A","오늘 처음으로 이 학교가 좋아졌다"],["B","눈이 너무 많이 와서 힘들었다"],["C","전학을 다시 가고 싶다"],["D","숙제가 너무 많다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "마지막 문장에서 '따뜻한 눈꽃이 쌓이고 있었다'의 의미는 무엇인가요?";
      choices = [["A","따뜻한 감정과 우정이 민서의 마음에 쌓이고 있다는 뜻이다"],["B","실제로 마음속에 눈이 내린다는 뜻이다"],["C","민서가 추워지고 있다는 뜻이다"],["D","눈이 점점 더 세게 온다는 뜻이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","지유의 따뜻한 배려 덕분에 민서는 새 학교에서 행복을 느끼기 시작한다"],["B","민서는 여전히 학교가 싫다"],["C","눈사람이 녹아서 민서가 슬퍼한다"],["D","지유와 민서는 다투었다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "민서가 전학 온 지 얼마나 되었나요?",
      [findRange(paragraphs, "p1", "한 달째")]),
    makeConfirmQ("q2", "지유가 민서에게 처음 건넨 것은 무엇인가요?",
      [findRange(paragraphs, "p1", "눈뭉치")]),
    makeConfirmQ("q3", "눈사람 코에 꽂은 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "당근 모양 과자")]),
    makeConfirmQ("q4", "지유도 전학 와서 혼자였던 기간은 얼마인가요?",
      [findRange(paragraphs, "p2", "한 학기")]),
    makeConfirmQ("q5", "지유가 민서에게 나눠 준 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "장갑 한 짝")]),
    makeConfirmQ("q6", "민서가 일기장에 적은 핵심 문장은 무엇인가요?",
      [findRange(paragraphs, "p3", "이 학교가 좋아졌다")])
  ];

  return assembleFull(66, "LITERATURE", "문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 67 비문학: 지진의 원리와 대비 (1018자) ===
// =============================================
function buildDay67() {
  const p1text = "지구의 표면은 하나의 단단한 덩어리가 아니라 여러 조각으로 나뉘어 있는데, 이 조각을 판이라 부른다. 판 구조론에 따르면 지구의 겉을 이루는 암석권은 십여 개의 크고 작은 판으로 되어 있으며, 이 판들은 그 아래의 뜨거운 맨틀 위에서 아주 느린 속도로 움직인다. 판과 판이 만나는 경계에서는 서로 밀거나 부딪치거나 어긋나면서 엄청난 에너지가 쌓인다. 이렇게 쌓인 에너지가 한계에 이르면 갑자기 방출되는데, 이때 땅이 흔들리는 현상을 지진이라 한다. 지진은 주로 판의 경계 부근에서 많이 발생하며, 환태평양 지진대와 알프스-히말라야 지진대가 대표적이다. 우리나라도 이 지진대에서 완전히 벗어나 있지 않기 때문에 지진에 대한 관심과 대비가 필요하다.";
  const p2text = "지진의 세기를 측정하는 데에는 규모와 진도라는 두 가지 척도가 쓰인다. 규모는 지진이 방출한 에너지의 크기를 숫자로 나타낸 것으로, 세계 어디서 측정해도 같은 값이 나온다. 진도는 특정 장소에서 사람이 느끼는 흔들림의 정도로, 같은 지진이라도 진원지에서 가까울수록 진도가 높게 나타난다. 규모 삼 이하의 지진은 대부분 사람이 느끼지 못하며, 규모 오 이상이면 건물이 흔들리고 물건이 떨어질 수 있다. 규모 칠 이상의 대지진은 도시 전체를 파괴할 위력을 가지며, 해저에서 발생하면 쓰나미를 일으키기도 한다. 이러한 척도를 이해하면 지진 뉴스를 접했을 때 심각성을 올바르게 판단할 수 있다.";
  const p3text = "지진은 예측이 매우 어렵기 때문에 평소에 대비하는 자세가 중요하다. 먼저 집 안의 무거운 가구가 넘어지지 않도록 고정하고, 비상용 가방에 물과 손전등, 응급 약품을 넣어 현관 가까이에 두어야 한다. 지진이 발생하면 즉시 책상 아래로 들어가 머리와 몸을 보호하고, 흔들림이 멈춘 뒤에 출구를 확보하여 밖으로 대피한다. 야외에 있을 때는 건물이나 전봇대에서 떨어져 넓은 공터로 이동하는 것이 안전하다. 학교에서는 정기적으로 대피 훈련을 실시하여 긴급 상황에서 당황하지 않도록 몸에 익혀야 한다. 지진은 자연재해이므로 막을 수는 없지만, 올바른 지식과 준비를 갖추면 피해를 크게 줄일 수 있다.";

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
      prompt = "지구 표면의 조각을 무엇이라 부르나요?";
      choices = [["A","판"],["B","층"],["C","블록"],["D","덩어리"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "판들이 움직이는 원리는 무엇인가요?";
      choices = [["A","뜨거운 맨틀 위에서 아주 느린 속도로 움직인다"],["B","바람에 의해 빠르게 이동한다"],["C","바다 물결에 밀려 움직인다"],["D","지구 자전에 의해 튕겨 나간다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "판의 경계에서 일어나는 일은 무엇인가요?";
      choices = [["A","서로 밀거나 부딪치거나 어긋나면서 에너지가 쌓인다"],["B","판이 녹아서 사라진다"],["C","새로운 대륙이 매년 만들어진다"],["D","판끼리 합쳐져 하나가 된다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "지진이란 무엇인가요?";
      choices = [["A","쌓인 에너지가 갑자기 방출되어 땅이 흔들리는 현상"],["B","바람이 세게 부는 현상"],["C","화산이 폭발하는 현상"],["D","바닷물이 갑자기 빠지는 현상"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "대표적인 지진 다발 지역으로 언급된 곳은 어디인가요?";
      choices = [["A","환태평양 지진대와 알프스-히말라야 지진대"],["B","사하라 사막과 아마존 열대 우림"],["C","북극과 남극"],["D","대서양 한가운데"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "우리나라도 지진 대비가 필요한 이유는 무엇인가요?";
      choices = [["A","지진대에서 완전히 벗어나 있지 않기 때문이다"],["B","매년 대지진이 발생하기 때문이다"],["C","화산이 활발하기 때문이다"],["D","해안가에 위치하지 않기 때문이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","판 구조론에 따라 판의 경계에서 에너지가 방출되면 지진이 발생한다"],["B","지구 표면은 하나의 덩어리로 되어 있다"],["C","지진은 우리나라에서는 일어나지 않는다"],["D","맨틀은 차갑고 단단하다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "지진의 세기를 측정하는 두 가지 척도는 무엇인가요?";
      choices = [["A","규모와 진도"],["B","속도와 방향"],["C","높이와 깊이"],["D","온도와 습도"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "규모의 특징으로 올바른 것은 무엇인가요?";
      choices = [["A","세계 어디서 측정해도 같은 값이 나온다"],["B","장소마다 다르게 측정된다"],["C","사람의 느낌으로 결정된다"],["D","건물 높이에 따라 달라진다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "진도가 장소마다 다른 이유는 무엇인가요?";
      choices = [["A","진원지에서의 거리에 따라 흔들림의 정도가 다르기 때문이다"],["B","측정 장비가 다르기 때문이다"],["C","시간대에 따라 바뀌기 때문이다"],["D","날씨의 영향을 받기 때문이다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "규모 삼 이하의 지진은 어떤 특징이 있나요?";
      choices = [["A","대부분 사람이 느끼지 못한다"],["B","건물이 무너진다"],["C","쓰나미가 발생한다"],["D","땅이 갈라진다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "규모 칠 이상의 대지진이 해저에서 발생하면 무엇을 일으킬 수 있나요?";
      choices = [["A","쓰나미"],["B","화산 폭발"],["C","태풍"],["D","폭설"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "지진 척도를 이해하면 얻을 수 있는 장점은 무엇인가요?";
      choices = [["A","지진 뉴스의 심각성을 올바르게 판단할 수 있다"],["B","지진을 예방할 수 있다"],["C","지진을 멈출 수 있다"],["D","지진 발생 시각을 예측할 수 있다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","지진의 세기는 규모와 진도로 측정하며 각각의 의미와 쓰임이 다르다"],["B","모든 지진은 같은 세기로 발생한다"],["C","규모와 진도는 같은 의미이다"],["D","지진 척도는 날씨 예보에 쓰인다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "지진 대비가 중요한 이유는 무엇인가요?";
      choices = [["A","지진은 예측이 매우 어렵기 때문이다"],["B","지진은 항상 같은 장소에서 일어나기 때문이다"],["C","지진은 느리게 발생하기 때문이다"],["D","지진은 사전에 정확히 예측할 수 있기 때문이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "비상용 가방에 넣어야 하는 물품으로 언급된 것은 무엇인가요?";
      choices = [["A","물과 손전등, 응급 약품"],["B","교과서, 필기도구, 공책"],["C","옷, 신발, 모자"],["D","라디오, 텔레비전, 노트북"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "지진 발생 시 즉시 해야 하는 행동은 무엇인가요?";
      choices = [["A","책상 아래로 들어가 머리와 몸을 보호한다"],["B","밖으로 즉시 뛰어나간다"],["C","엘리베이터를 탄다"],["D","창문을 연다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "야외에 있을 때 안전한 대피 장소는 어디인가요?";
      choices = [["A","건물이나 전봇대에서 떨어진 넓은 공터"],["B","건물 벽 바로 옆"],["C","나무 아래"],["D","다리 위"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "학교에서 정기적으로 해야 하는 것은 무엇인가요?";
      choices = [["A","대피 훈련을 실시하여 긴급 상황에 대비한다"],["B","지진 실험을 한다"],["C","건물을 매년 새로 짓는다"],["D","학생들을 집으로 보낸다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "마지막 문장의 핵심 메시지는 무엇인가요?";
      choices = [["A","올바른 지식과 준비를 갖추면 피해를 크게 줄일 수 있다"],["B","지진은 완전히 막을 수 있다"],["C","지진에 대비하는 것은 소용없다"],["D","지진은 자연재해가 아니다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","지진은 예측이 어렵지만 올바른 대비와 훈련으로 피해를 줄일 수 있다"],["B","지진은 예측이 가능하므로 대비할 필요가 없다"],["C","지진 대비는 학교에서만 하면 된다"],["D","비상용 가방은 필요 없다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "지구 표면의 조각을 부르는 이름은 무엇인가요?",
      [findRange(paragraphs, "p1", "판")]),
    makeConfirmQ("q2", "대표적인 지진 다발 지역 중 하나는 어디인가요?",
      [findRange(paragraphs, "p1", "환태평양 지진대")]),
    makeConfirmQ("q3", "세계 어디서 측정해도 같은 값이 나오는 척도는 무엇인가요?",
      [findRange(paragraphs, "p2", "규모")]),
    makeConfirmQ("q4", "해저 대지진이 일으킬 수 있는 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "쓰나미")]),
    makeConfirmQ("q5", "지진 발생 시 즉시 들어가야 하는 곳은 어디인가요?",
      [findRange(paragraphs, "p3", "책상 아래")]),
    makeConfirmQ("q6", "비상용 가방에 넣어야 할 물품 중 빛을 비추는 도구는 무엇인가요?",
      [findRange(paragraphs, "p3", "손전등")])
  ];

  return assembleFull(67, "NONFICTION", "비문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 68 문학: 할아버지의 텃밭 (1024자) ===
// =============================================
function buildDay68() {
  const p1text = "준혁이네 아파트 옥상에는 작은 텃밭이 있었다. 할아버지가 은퇴하신 뒤 직접 흙을 날라 만든 텃밭이었는데, 상추와 고추, 방울토마토가 계절마다 싱싱하게 자라고 있었다. 준혁은 텃밭에 가는 것을 좋아하지 않았는데, 흙을 만지면 손톱 사이가 까매지고 모기에 물리는 것이 무척 싫었기 때문이다. 할아버지는 그런 준혁을 바라보시며 흙 속에서 무언가가 자라는 걸 보면 마음도 함께 자란단다라고 따뜻하게 말씀하셨지만, 준혁은 그 말을 귀담아듣지 않았다. 방학이 되어 매일 집에 있게 된 준혁은 할아버지가 옥상에 올라가시는 모습을 자주 보았지만 따라가지 않았다. 그러던 어느 봄날, 할아버지가 허리가 아프셔서 한동안 텃밭에 올라가지 못하시게 되었다.";
  const p2text = "할아버지가 텃밭에 가지 못하신 지 일주일이 지나자 상추가 시들고 고추 잎이 노랗게 변해 있었다. 준혁은 옥상에 올라가 텃밭의 모습을 보고 마음이 불편해졌다. 할아버지가 아끼셨던 식물들이 말라 가는 것을 그대로 두기 싫어 준혁은 호스로 물을 주기 시작했다. 처음에는 어색하고 지루했지만, 물을 준 다음 날 상추 잎이 다시 싱싱하게 고개를 드는 것을 보자 기분이 묘하게 좋아졌다. 그날부터 준혁은 매일 아침 학교 가기 전 십 분씩 텃밭에 올라가 물을 주고 잡초를 뽑았다. 이 주일쯤 지나자 시들었던 고추에 하얀 꽃이 피기 시작했고, 방울토마토에는 초록색 열매가 작게 맺혔다.";
  const p3text = "할아버지의 허리가 나아 다시 옥상에 올라오신 날, 텃밭은 예전보다 더 푸르고 건강하게 변해 있었다. 할아버지는 상추를 한 잎 따서 드시더니 눈을 동그랗게 뜨며 이거 누가 이렇게 잘 돌봤니 하고 놀라셨다. 준혁이 쑥스러운 듯 손등으로 코를 문지르자, 할아버지는 빙그레 웃으시며 준혁의 어깨를 다정하게 토닥여 주셨다. 그날 저녁 둘은 텃밭에서 직접 딴 상추로 삼겹살을 싸 먹었는데, 준혁은 그 상추가 마트에서 산 것보다 훨씬 달고 맛있게 느껴졌다. 할아버지가 말씀하신 것처럼 흙 속에서 무언가를 키우는 동안 준혁의 마음도 한 뼘쯤 자란 것 같았다. 준혁은 내년 봄에는 할아버지와 함께 수박도 심어 보겠다고 환하게 웃으며 약속했다.";

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
      prompt = "텃밭은 어디에 있었나요?";
      choices = [["A","아파트 옥상"],["B","집 앞 마당"],["C","학교 운동장"],["D","공원 한쪽"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "텃밭을 만든 사람은 누구인가요?";
      choices = [["A","할아버지가 은퇴 후 직접 만드셨다"],["B","준혁이 만들었다"],["C","아파트 관리인이 만들었다"],["D","이웃이 만들었다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "준혁이 텃밭에 가는 것을 좋아하지 않은 이유는 무엇인가요?";
      choices = [["A","흙에 손이 더러워지고 모기에 물리는 것이 싫었다"],["B","높은 곳이 무서웠다"],["C","식물에 관심이 없었다"],["D","할아버지와 사이가 나빴다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "할아버지가 준혁에게 하신 말씀의 핵심은 무엇인가요?";
      choices = [["A","무언가가 자라는 걸 보면 마음도 함께 자란다"],["B","흙을 만지면 건강해진다"],["C","텃밭 가꾸기는 돈을 벌 수 있다"],["D","식물은 말을 알아듣는다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "방학 동안 준혁은 할아버지를 따라 텃밭에 갔나요?";
      choices = [["A","따라가지 않았다"],["B","매일 함께 갔다"],["C","가끔 함께 갔다"],["D","혼자서 먼저 갔다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "할아버지가 텃밭에 올라가지 못하시게 된 이유는 무엇인가요?";
      choices = [["A","허리가 아프셨기 때문이다"],["B","날씨가 나빴기 때문이다"],["C","여행을 가셨기 때문이다"],["D","텃밭이 망가졌기 때문이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","텃밭을 싫어하던 준혁에게 할아버지의 허리 부상으로 변화의 계기가 찾아온다"],["B","준혁은 텃밭 가꾸기를 즐겨 한다"],["C","할아버지는 텃밭에 관심이 없다"],["D","텃밭의 식물이 모두 죽었다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "할아버지가 못 오신 일주일 뒤 텃밭의 상태는 어떠했나요?";
      choices = [["A","상추가 시들고 고추 잎이 노랗게 변했다"],["B","풍성하게 잘 자라고 있었다"],["C","모든 식물이 죽었다"],["D","잡초가 전혀 없었다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "준혁이 마음이 불편해진 이유는 무엇인가요?";
      choices = [["A","할아버지가 아끼셨던 식물들이 말라 가는 모습 때문이다"],["B","옥상이 더러워서"],["C","친구에게 혼나서"],["D","숙제를 못 해서"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "준혁이 처음으로 텃밭에서 한 일은 무엇인가요?";
      choices = [["A","호스로 물을 주기 시작했다"],["B","새로운 씨앗을 심었다"],["C","할아버지를 모시고 왔다"],["D","텃밭을 정리하고 버렸다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "물을 준 다음 날 준혁의 기분은 어떠했나요?";
      choices = [["A","상추가 다시 싱싱해진 것을 보고 묘하게 좋아졌다"],["B","여전히 지루했다"],["C","화가 났다"],["D","슬퍼졌다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "그날부터 준혁이 매일 한 일은 무엇인가요?";
      choices = [["A","아침 학교 가기 전 십 분씩 물을 주고 잡초를 뽑았다"],["B","저녁에만 텃밭을 돌보았다"],["C","일주일에 한 번 물을 주었다"],["D","친구와 함께 텃밭을 가꾸었다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 주일 뒤 텃밭에 나타난 변화는 무엇인가요?";
      choices = [["A","고추에 하얀 꽃이 피고 방울토마토에 초록 열매가 맺혔다"],["B","식물이 모두 시들었다"],["C","새로운 작물이 저절로 자랐다"],["D","잡초가 텃밭을 덮었다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","준혁이 텃밭을 돌보기 시작하면서 식물이 되살아나고 보람을 느끼게 된다"],["B","준혁은 텃밭을 포기한다"],["C","텃밭의 식물이 모두 죽는다"],["D","할아버지가 돌아와서 텃밭을 돌보신다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "할아버지가 다시 옥상에 올라오셨을 때 텃밭은 어떤 상태였나요?";
      choices = [["A","예전보다 더 푸르고 건강하게 변해 있었다"],["B","시들어 있었다"],["C","잡초로 덮여 있었다"],["D","비어 있었다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "할아버지가 상추를 드시며 놀라신 이유는 무엇인가요?";
      choices = [["A","누군가 텃밭을 잘 돌봐서 상추가 싱싱했기 때문이다"],["B","상추가 너무 맛없어서"],["C","상추가 모두 없어져서"],["D","상추에 벌레가 있어서"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "준혁의 반응은 어떠했나요?";
      choices = [["A","쑥스러운 듯 손등으로 코를 문질렀다"],["B","자랑스럽게 소리쳤다"],["C","모른 척했다"],["D","울었다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "저녁에 둘이 먹은 음식은 무엇인가요?";
      choices = [["A","텃밭에서 딴 상추로 삼겹살을 싸 먹었다"],["B","마트에서 산 채소로 비빔밥을 먹었다"],["C","라면을 끓여 먹었다"],["D","피자를 시켜 먹었다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "준혁이 느낀 성장의 핵심은 무엇인가요?";
      choices = [["A","무언가를 키우는 동안 마음도 한 뼘쯤 자란 것 같았다"],["B","키가 많이 컸다"],["C","공부를 잘하게 되었다"],["D","운동 실력이 늘었다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "준혁이 할아버지에게 한 약속은 무엇인가요?";
      choices = [["A","내년 봄에 함께 수박도 심어 보겠다고 했다"],["B","텃밭을 없애겠다고 했다"],["C","더 이상 텃밭에 가지 않겠다고 했다"],["D","혼자서 텃밭을 운영하겠다고 했다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","할아버지는 준혁의 성장에 감동하고 둘은 텃밭을 통해 유대를 깊게 한다"],["B","할아버지는 텃밭을 포기하신다"],["C","준혁은 텃밭 가꾸기가 여전히 싫다"],["D","둘은 텃밭에서 다투었다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "텃밭에서 기르고 있는 작물로 언급된 것 중 하나는 무엇인가요?",
      [findRange(paragraphs, "p1", "방울토마토")]),
    makeConfirmQ("q2", "할아버지가 텃밭에 못 가신 이유는 무엇인가요?",
      [findRange(paragraphs, "p1", "허리가 아프셔서")]),
    makeConfirmQ("q3", "일주일 뒤 고추 잎의 상태는 어떠했나요?",
      [findRange(paragraphs, "p2", "노랗게 변해")]),
    makeConfirmQ("q4", "이 주일 뒤 고추에 핀 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "하얀 꽃")]),
    makeConfirmQ("q5", "저녁에 상추와 함께 먹은 고기는 무엇인가요?",
      [findRange(paragraphs, "p3", "삼겹살")]),
    makeConfirmQ("q6", "준혁이 내년 봄에 심겠다고 약속한 작물은 무엇인가요?",
      [findRange(paragraphs, "p3", "수박")])
  ];

  return assembleFull(68, "LITERATURE", "문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 69 비문학: 한글의 과학적 원리 (1011자) ===
// =============================================
function buildDay69() {
  const p1text = "한글은 조선 세종 대왕이 백성들이 글을 쉽게 배울 수 있도록 천사백사십삼 년에 창제하고 천사백사십육 년에 반포한 문자이다. 당시에는 한자를 사용하고 있었는데, 글자 수가 수만 자에 달하고 구조가 복잡하여 일반 백성이 배우기 어려웠다. 세종은 누구나 자기 생각을 글로 표현할 수 있어야 한다고 생각하였고, 발음 기관의 모양을 관찰하여 자음을 만들었다. 자음의 기본 글자 다섯 개는 혀, 입술, 이, 목구멍, 잇몸의 발음 모양을 본뜬 것으로, 사람의 몸에서 소리가 나는 원리를 담고 있다. 모음은 하늘을 뜻하는 점, 땅을 뜻하는 가로 획, 사람을 뜻하는 세로 획의 천지인 원리를 조합하여 만들었다. 이처럼 한글은 발음의 과학적 원리를 글자 모양에 반영한 독창적인 문자이다.";
  const p2text = "한글의 큰 특징 중 하나는 자음과 모음을 조합하여 음절 단위로 모아쓰는 체계이다. 예를 들어 한이라는 글자는 자음 ㅎ, 모음 ㅏ, 받침 ㄴ을 네모 공간 안에 배치하여 만든다. 이러한 모아쓰기 방식은 글자를 한눈에 파악할 수 있게 하여 읽는 속도를 높여 준다. 또한 한글은 소리와 글자의 대응이 매우 규칙적이어서 표기법을 배우면 어떤 단어든 정확하게 소리 내어 읽을 수 있다. 영어처럼 같은 철자가 단어마다 다르게 발음되는 경우가 거의 없어 외국인도 한글 원리를 이해하면 빠르게 읽을 수 있다. 이 규칙성 덕분에 유네스코는 한글을 세계에서 가장 과학적인 문자 체계 중 하나로 평가하고 있다.";
  const p3text = "한글의 우수성은 디지털 시대에 더욱 빛을 발하고 있다. 자음과 모음의 조합 원리가 컴퓨터 자판과 잘 맞아 적은 수의 키만으로 수천 개의 음절을 빠르게 입력할 수 있다. 스마트폰의 천지인 자판은 한글 창제 원리를 활용하여 세 개의 기본 획만으로 모든 모음을 만들 수 있게 설계되었다. 반면 한자나 일본어 가나 문자는 글자 수가 많아 입력 속도가 한글보다 느린 편이다. 또한 한글은 시각 장애인을 위한 점자 변환이 비교적 단순하여 접근성이 뛰어나다는 평가를 받는다. 세종 대왕이 백성을 위해 만든 한글은 디지털 기술과 만나 그 가치가 더욱 높아지고 있다.";

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
      prompt = "한글이 반포된 시기는 언제인가요?";
      choices = [["A","천사백사십육 년"],["B","천사백사십삼 년"],["C","천오백 년"],["D","천삼백 년"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "한자가 일반 백성에게 어려웠던 이유는 무엇인가요?";
      choices = [["A","글자 수가 수만 자에 달하고 구조가 복잡했기 때문이다"],["B","종이가 비쌌기 때문이다"],["C","한자가 금지되었기 때문이다"],["D","한자를 가르치는 사람이 없었기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "세종이 자음을 만든 원리는 무엇인가요?";
      choices = [["A","발음 기관의 모양을 관찰하여 만들었다"],["B","한자를 간략화하여 만들었다"],["C","외국 문자를 참고하여 만들었다"],["D","자연의 동물 모양을 본떠 만들었다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "자음의 기본 글자가 본뜬 것은 무엇인가요?";
      choices = [["A","혀, 입술, 이, 목구멍, 잇몸의 발음 모양"],["B","동물의 발자국"],["C","나무와 산의 모양"],["D","별자리의 모양"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "모음을 만든 데 사용된 세 가지 원리는 무엇인가요?";
      choices = [["A","하늘(점), 땅(가로 획), 사람(세로 획)의 천지인 원리"],["B","해, 달, 별"],["C","물, 불, 바람"],["D","산, 강, 바다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 한글을 어떻게 평가하고 있나요?";
      choices = [["A","발음의 과학적 원리를 글자 모양에 반영한 독창적인 문자"],["B","가장 오래된 문자"],["C","가장 많은 글자를 가진 문자"],["D","가장 쓰기 어려운 문자"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","한글은 발음 기관과 천지인 원리를 바탕으로 과학적으로 창제된 독창적 문자이다"],["B","한글은 한자를 변형하여 만든 문자이다"],["C","세종은 한자를 더 많이 보급하려 했다"],["D","모음은 자음과 같은 원리로 만들어졌다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "한글의 큰 특징 중 하나는 무엇인가요?";
      choices = [["A","자음과 모음을 조합하여 음절 단위로 모아쓰는 체계"],["B","글자를 가로로만 쓰는 방식"],["C","한 글자에 하나의 뜻을 담는 방식"],["D","그림으로 의미를 전달하는 방식"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "한이라는 글자를 만드는 구성 요소는 무엇인가요?";
      choices = [["A","자음 ㅎ, 모음 ㅏ, 받침 ㄴ"],["B","자음 ㅎ과 모음 ㅏ만"],["C","자음 ㅎ과 받침 ㄴ만"],["D","모음 ㅏ와 받침 ㄴ만"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "모아쓰기 방식의 장점은 무엇인가요?";
      choices = [["A","글자를 한눈에 파악할 수 있어 읽는 속도를 높여 준다"],["B","글자를 더 크게 쓸 수 있다"],["C","종이를 적게 사용할 수 있다"],["D","글자를 더 아름답게 만든다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "한글의 소리와 글자 대응이 가지는 특성은 무엇인가요?";
      choices = [["A","매우 규칙적이어서 정확하게 소리 내어 읽을 수 있다"],["B","불규칙하여 외우기 어렵다"],["C","영어와 동일한 방식이다"],["D","뜻에 따라 발음이 바뀐다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "외국인도 한글을 비교적 빠르게 읽을 수 있는 이유는 무엇인가요?";
      choices = [["A","같은 철자가 다르게 발음되는 경우가 거의 없기 때문이다"],["B","글자 수가 매우 적기 때문이다"],["C","영어와 발음이 비슷하기 때문이다"],["D","그림 문자이기 때문이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "유네스코가 한글을 어떻게 평가하고 있나요?";
      choices = [["A","세계에서 가장 과학적인 문자 체계 중 하나"],["B","가장 오래된 문자 체계"],["C","가장 많이 사용되는 문자"],["D","가장 아름다운 문자"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","한글은 모아쓰기와 규칙적인 소리 대응으로 읽기 쉬운 과학적 문자이다"],["B","한글은 영어보다 어렵다"],["C","외국인은 한글을 배울 수 없다"],["D","유네스코는 한글에 관심이 없다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "한글의 우수성이 더욱 빛나는 시대는 언제인가요?";
      choices = [["A","디지털 시대"],["B","조선 시대"],["C","고려 시대"],["D","산업 혁명 시대"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "한글이 디지털 입력에 유리한 이유는 무엇인가요?";
      choices = [["A","적은 수의 키만으로 수천 개의 음절을 빠르게 입력할 수 있다"],["B","키보드 키가 많이 필요하다"],["C","타자 속도가 느리다"],["D","특수한 키보드가 필요하다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "천지인 자판의 설계 원리는 무엇인가요?";
      choices = [["A","한글 창제 원리를 활용하여 세 개의 기본 획으로 모든 모음을 만든다"],["B","모든 자음과 모음에 각각 키를 배정한다"],["C","영어 자판과 동일한 구조이다"],["D","자음만으로 글자를 입력한다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "한자나 일본어 문자가 입력 속도에서 불리한 이유는 무엇인가요?";
      choices = [["A","글자 수가 많아 입력 속도가 느리다"],["B","키보드가 작기 때문이다"],["C","디지털 기기와 호환되지 않기 때문이다"],["D","소리와 글자의 대응이 없기 때문이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "한글이 접근성 면에서 뛰어난 이유는 무엇인가요?";
      choices = [["A","시각 장애인을 위한 점자 변환이 비교적 단순하다"],["B","글자 크기를 무한히 키울 수 있다"],["C","음성 인식이 불가능하다"],["D","촉각으로 읽을 수 없다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "마지막 문장의 핵심 메시지는 무엇인가요?";
      choices = [["A","한글은 디지털 기술과 만나 그 가치가 더욱 높아지고 있다"],["B","한글은 디지털 시대에 사라질 위기에 있다"],["C","세종 대왕은 디지털 기술을 예측했다"],["D","한글보다 한자가 디지털에 더 적합하다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","한글의 조합 원리는 디지털 기기 입력과 접근성에서 큰 장점을 발휘하고 있다"],["B","한글은 디지털 입력에 적합하지 않다"],["C","천지인 자판은 외국에서 만들어졌다"],["D","한자가 한글보다 디지털 시대에 유리하다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "한글이 반포된 연도는 언제인가요?",
      [findRange(paragraphs, "p1", "천사백사십육 년")]),
    makeConfirmQ("q2", "모음을 만드는 데 사용된 세 요소를 통칭하는 원리는 무엇인가요?",
      [findRange(paragraphs, "p1", "천지인")]),
    makeConfirmQ("q3", "자음과 모음을 조합하여 쓰는 방식을 무엇이라 하나요?",
      [findRange(paragraphs, "p2", "모아쓰기")]),
    makeConfirmQ("q4", "한글을 세계에서 가장 과학적인 문자로 평가한 국제 기구는 어디인가요?",
      [findRange(paragraphs, "p2", "유네스코")]),
    makeConfirmQ("q5", "스마트폰에서 한글 창제 원리를 활용한 자판의 이름은 무엇인가요?",
      [findRange(paragraphs, "p3", "천지인 자판")]),
    makeConfirmQ("q6", "한글이 접근성 측면에서 뛰어나다고 평가받는 이유 중 하나는 무엇인가요?",
      [findRange(paragraphs, "p3", "점자 변환")])
  ];

  return assembleFull(69, "NONFICTION", "비문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 70 문학: 별을 품은 소녀 (1049자) ===
// =============================================
function buildDay70() {
  const p1text = "유라는 별을 좋아하는 초등학교 육학년 소녀로, 방 천장에는 야광 별 스티커가 빼곡히 붙어 있었고 책꽂이에는 별자리 도감이 세 권이나 꽂혀 있었다. 여름이 되면 아버지와 함께 시골 할머니 댁 마당에 돗자리를 펴고 누워 은하수를 바라보는 것이 유라의 가장 큰 행복이었다. 그런데 올해 여름, 아버지가 해외 출장으로 함께 갈 수 없게 되자 유라는 혼자 별을 보는 것이 겁이 나기도 하고 심심하기도 했다. 할머니는 유라에게 별은 혼자 봐도 외롭지 않단다, 하늘에 친구가 수천 개나 있으니까라고 말씀하셨다. 유라는 고개를 끄덕였지만 아버지와 함께 별을 보던 기억이 떠올라 마음 한쪽이 여전히 허전했다. 그래도 할머니 말씀에 힘을 얻어 유라는 그날 밤 혼자 마당에 나가 보기로 마음먹었다.";
  const p2text = "밤이 되어 유라가 돗자리를 깔고 누우니 머리 위로 깜짝 놀랄 만큼 많은 별이 쏟아져 내릴 듯 빛나고 있었다. 시내에서는 볼 수 없는 별들이 어두운 하늘을 수놓고 있자 유라는 저도 모르게 감탄사를 내뱉었다. 도감에서만 보던 백조자리가 눈앞에 선명하게 펼쳐지자 유라는 반가운 마음에 손가락으로 별을 하나하나 짚으며 데네브, 알비레오, 사드르 같은 이름을 소리 내어 불렀다. 별 이름을 부를수록 마치 오래된 친구를 만난 것처럼 외로움이 조금씩 녹아내렸다. 유라는 어느새 아버지 없이도 밤하늘을 즐기고 있는 자신을 발견하고 살짝 놀랐다. 하늘 가득 빛나는 별들이 정말로 수천 명의 친구처럼 유라를 내려다보고 있었다.";
  const p3text = "한 시간쯤 지났을 때 유라의 시야를 밝은 빛줄기가 스쳐 지나갔는데, 바로 별똥별이었다. 유라는 두 손을 모으고 눈을 꼭 감으며 아버지가 빨리 돌아오게 해 주세요라고 빌었다. 눈을 떠 보니 할머니가 따뜻한 보리차를 들고 뒤에 서 계셨다. 할머니는 보리차를 건네시며 옆에 앉으시더니 어릴 때 별을 보며 꿈을 꾸던 이야기를 들려주셨다. 유라는 보리차를 홀짝이며 할머니의 이야기에 빠져들었고, 밤하늘의 별빛과 할머니의 목소리가 어우러져 마음이 포근해졌다. 유라는 일기장에 별은 아버지가 안 계셔도 나를 외롭지 않게 해 주었고 할머니의 이야기는 별보다 더 따뜻했다라고 적으며 그 여름밤을 마무리했다.";

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
      prompt = "유라가 좋아하는 것과 방에 있는 물건은 무엇인가요?";
      choices = [["A","별을 좋아하며 야광 별 스티커와 별자리 도감이 있다"],["B","바다를 좋아하며 조개가 있다"],["C","꽃을 좋아하며 화분이 있다"],["D","음악을 좋아하며 악기가 있다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "유라의 가장 큰 행복은 무엇인가요?";
      choices = [["A","아버지와 할머니 댁 마당에서 은하수를 바라보는 것"],["B","학교에서 친구들과 노는 것"],["C","혼자 방에서 책을 읽는 것"],["D","도시에서 밤하늘을 보는 것"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "올해 여름에 생긴 문제는 무엇인가요?";
      choices = [["A","아버지가 해외 출장으로 함께 갈 수 없게 되었다"],["B","할머니 댁에 갈 수 없게 되었다"],["C","비가 계속 와서 별을 볼 수 없었다"],["D","별자리 도감을 잃어버렸다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "할머니가 유라에게 하신 말씀의 핵심은 무엇인가요?";
      choices = [["A","하늘에 친구가 수천 개나 있으니 혼자 봐도 외롭지 않다"],["B","별은 밤에만 볼 수 있다"],["C","별을 보면 소원이 이루어진다"],["D","아버지와 함께 봐야 재미있다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "할머니 말씀을 듣고 유라의 마음은 어떠했나요?";
      choices = [["A","고개를 끄덕였지만 마음 한쪽이 여전히 허전했다"],["B","완전히 기뻐졌다"],["C","화가 났다"],["D","무관심했다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "유라가 그날 밤 결심한 것은 무엇인가요?";
      choices = [["A","혼자 마당에 나가 보기로 마음먹었다"],["B","방에서 잠을 자기로 했다"],["C","아버지에게 전화하기로 했다"],["D","할머니와 텔레비전을 보기로 했다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","별을 좋아하는 유라가 아버지 없이 별을 보게 된 상황과 허전한 마음이 소개된다"],["B","유라는 별에 관심이 없다"],["C","아버지와 유라가 함께 별을 보았다"],["D","할머니는 별을 싫어하신다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "유라가 돗자리를 깔고 누웠을 때 본 풍경은 어떠했나요?";
      choices = [["A","많은 별이 쏟아져 내릴 듯 빛나고 있었다"],["B","구름이 가득하여 별이 보이지 않았다"],["C","달만 밝게 떠 있었다"],["D","안개가 낀 어두운 하늘이었다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "유라가 감탄사를 내뱉은 이유는 무엇인가요?";
      choices = [["A","시내에서는 볼 수 없는 별들이 하늘을 수놓고 있어 놀랐기 때문이다"],["B","무서운 소리가 들렸기 때문이다"],["C","곤충을 발견했기 때문이다"],["D","바람이 세게 불었기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "유라가 손가락으로 짚으며 이름을 부른 별자리는 무엇인가요?";
      choices = [["A","백조자리"],["B","오리온자리"],["C","큰곰자리"],["D","전갈자리"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "별 이름을 부를수록 유라에게 일어난 변화는 무엇인가요?";
      choices = [["A","외로움이 조금씩 녹아내렸다"],["B","더 외로워졌다"],["C","졸음이 왔다"],["D","무서워졌다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "유라가 살짝 놀란 이유는 무엇인가요?";
      choices = [["A","아버지 없이도 밤하늘을 즐기고 있는 자신을 발견했기 때문이다"],["B","별똥별을 보았기 때문이다"],["C","할머니가 갑자기 나타나셨기 때문이다"],["D","동물 소리가 들렸기 때문이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "마지막 문장에서 별들이 어떻게 묘사되었나요?";
      choices = [["A","수천 명의 친구처럼 유라를 내려다보고 있었다"],["B","점점 사라지고 있었다"],["C","무서운 존재로 느껴졌다"],["D","구름에 가려 보이지 않았다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","혼자 밤하늘을 바라보며 별 이름을 부르다 외로움을 극복하는 유라의 모습"],["B","유라는 밤하늘을 무서워한다"],["C","별이 하나도 보이지 않았다"],["D","아버지가 갑자기 돌아오셨다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "유라의 시야를 스쳐 지나간 것은 무엇인가요?";
      choices = [["A","별똥별"],["B","비행기"],["C","새"],["D","구름"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "유라가 별똥별에 빈 소원은 무엇인가요?";
      choices = [["A","아버지가 빨리 돌아오게 해 달라고 빌었다"],["B","새 별자리 도감을 사 달라고 빌었다"],["C","시험을 잘 보게 해 달라고 빌었다"],["D","비가 오지 않게 해 달라고 빌었다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "할머니가 가져오신 것은 무엇인가요?";
      choices = [["A","따뜻한 보리차"],["B","과자 한 봉지"],["C","담요"],["D","손전등"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "할머니가 유라에게 들려준 이야기는 어떤 내용인가요?";
      choices = [["A","어릴 때 별을 보며 꿈을 꾸던 이야기"],["B","무서운 귀신 이야기"],["C","아버지의 어린 시절 이야기"],["D","동물에 관한 이야기"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "유라의 마음이 포근해진 이유는 무엇인가요?";
      choices = [["A","밤하늘의 별빛과 할머니의 목소리가 어우러졌기 때문이다"],["B","아버지가 돌아왔기 때문이다"],["C","날씨가 따뜻했기 때문이다"],["D","친구가 놀러 왔기 때문이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "유라가 일기장에 적은 핵심 내용은 무엇인가요?";
      choices = [["A","별이 외롭지 않게 해 주었고 할머니의 이야기는 별보다 더 따뜻했다"],["B","별을 보는 것이 지루했다"],["C","혼자 별을 보는 것이 무서웠다"],["D","내년에는 별을 보지 않겠다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","별똥별과 할머니의 따뜻한 이야기를 통해 유라는 행복한 여름밤을 보낸다"],["B","유라는 별똥별을 보지 못했다"],["C","할머니는 유라를 혼자 두고 가셨다"],["D","유라는 일기장을 잃어버렸다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "유라의 방 천장에 붙어 있는 것은 무엇인가요?",
      [findRange(paragraphs, "p1", "야광 별 스티커")]),
    makeConfirmQ("q2", "아버지가 함께 못 간 이유는 무엇인가요?",
      [findRange(paragraphs, "p1", "해외 출장")]),
    makeConfirmQ("q3", "유라가 눈앞에서 확인한 별자리의 이름은 무엇인가요?",
      [findRange(paragraphs, "p2", "백조자리")]),
    makeConfirmQ("q4", "유라가 소리 내어 부른 별 이름 중 하나는 무엇인가요?",
      [findRange(paragraphs, "p2", "데네브")]),
    makeConfirmQ("q5", "유라가 별똥별에 빈 소원은 무엇인가요?",
      [findRange(paragraphs, "p3", "아버지가 빨리 돌아오게 해 주세요")]),
    makeConfirmQ("q6", "할머니가 유라에게 가져다주신 음료는 무엇인가요?",
      [findRange(paragraphs, "p3", "보리차")])
  ];

  return assembleFull(70, "LITERATURE", "문학", paragraphs, timeline, cards, confirmQs);
}

// === 메인 실행 ===
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const batchPath = path.join(ROOT, 'generated', 'daily-batch-reading-frege3.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'frege3');

  // 배치 파일 읽기
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

  // Day 66~70 콘텐츠 빌드
  const days = [
    { dayIndex: 66, builder: buildDay66 },
    { dayIndex: 67, builder: buildDay67 },
    { dayIndex: 68, builder: buildDay68 },
    { dayIndex: 69, builder: buildDay69 },
    { dayIndex: 70, builder: buildDay70 }
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
