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
// === Day 61 비문학: 화폐의 탄생과 발전 ===
// =============================================
function buildDay61() {
  const p1text = "오늘날 우리는 물건을 살 때 당연하듯이 돈을 사용하지만, 인류가 처음부터 돈을 갖고 있었던 것은 아니다. 고대 사회에서는 상대방이 원하는 물건과 직접 교환하는 물물교환을 했다. 그런데 물물교환에는 불편한 점이 많았다. 예를 들어 쌀을 가진 농부가 옷을 원하더라도, 옷을 가진 사람이 쌀을 원하지 않으면 거래가 성사되지 않았다. 이처럼 서로의 필요가 일치해야만 교환이 이루어지는 한계 때문에 사람들은 누구나 가치 있다고 인정하는 물건을 중간 매개로 사용하기 시작했다. 조개껍데기, 소금, 곡식 같은 물품이 초기 화폐의 역할을 한 대표적인 예이다.";
  const p2text = "시간이 흐르면서 사람들은 더 편리하고 오래 보관할 수 있는 화폐를 찾게 되었고, 그 결과 금속 화폐가 등장했다. 금이나 은은 쉽게 부식되지 않고 작은 양으로도 높은 가치를 지녀 화폐 재료로 적합했다. 기원전 칠 세기경 소아시아의 리디아 왕국에서 세계 최초의 주화가 만들어졌는데, 일정한 무게를 갖춘 금속에 왕의 문양을 새긴 것이었다. 주화 덕분에 거래할 때마다 금속의 무게를 재지 않아도 되어 상업이 훨씬 빠르고 정확해졌다. 이후 중국에서는 엽전이, 고려와 조선에서는 해동통보와 상평통보 같은 화폐가 사용되었다. 이렇게 금속 화폐는 전 세계 경제 발전의 토대가 되었다.";
  const p3text = "금속 화폐를 많이 가지고 다니는 것은 무겁고 불편했기 때문에 사람들은 종이로 만든 지폐를 고안했다. 세계 최초의 지폐는 중국 송나라 시대의 교자로, 상인들 사이에서 금속 화폐를 대신하여 쓰였다. 지폐가 널리 쓰이려면 발행 기관에 대한 신뢰가 뒷받침되어야 했기에 국가가 화폐 발행을 관리하는 제도가 자리 잡았다. 오늘날에는 신용 카드, 전자 이체, 모바일 결제 같은 디지털 화폐까지 등장하여 화폐 형태가 계속 변하고 있다. 하지만 물건의 가치를 수치로 나타내고 교환을 원활하게 하는 화폐의 본질적 기능은 달라지지 않았다. 화폐의 역사를 보면 인류가 더 편리한 삶을 위해 끊임없이 새로운 방법을 고안해 왔음을 알 수 있다.";

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
      prompt = "이 문장에서 알 수 있는 사실은 무엇인가요?";
      choices = [["A","인류가 처음부터 돈을 가지고 있었던 것은 아니다"],["B","고대 사회에서도 동전이 사용되었다"],["C","물건을 사는 행위는 최근에 생겨났다"],["D","돈은 자연에서 발견되는 물질이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "고대 사회의 거래 방식은 무엇이었나요?";
      choices = [["A","물물교환을 통해 서로 원하는 물건을 직접 교환했다"],["B","은행에 맡긴 돈으로 물건을 샀다"],["C","지폐를 사용하여 거래했다"],["D","왕이 물건을 분배해 주었다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "물물교환의 문제점으로 언급된 것은 무엇인가요?";
      choices = [["A","불편한 점이 많았다"],["B","물건이 부족했다"],["C","거래 속도가 너무 빨랐다"],["D","모든 물건의 가치가 동일했다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "쌀을 가진 농부의 예에서 거래가 성사되지 않은 이유는 무엇인가요?";
      choices = [["A","옷을 가진 사람이 쌀을 원하지 않았기 때문이다"],["B","농부가 옷을 원하지 않았기 때문이다"],["C","쌀의 양이 부족했기 때문이다"],["D","옷의 품질이 좋지 않았기 때문이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "물물교환의 한계를 극복하기 위해 사람들이 한 일은 무엇인가요?";
      choices = [["A","누구나 가치 있다고 인정하는 물건을 중간 매개로 사용했다"],["B","거래를 중단하고 자급자족했다"],["C","왕에게 물건 분배를 요청했다"],["D","더 많은 물건을 만들어 냈다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "초기 화폐 역할을 한 물품의 예로 언급된 것은 무엇인가요?";
      choices = [["A","조개껍데기, 소금, 곡식"],["B","금, 은, 구리"],["C","종이, 천, 가죽"],["D","보석, 진주, 산호"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","물물교환의 불편함을 해결하기 위해 초기 화폐가 등장했다"],["B","고대 사회에서는 물건이 매우 풍부했다"],["C","농부들은 항상 원하는 물건을 쉽게 얻을 수 있었다"],["D","조개껍데기는 현대에도 화폐로 사용된다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "금속 화폐가 등장한 이유는 무엇인가요?";
      choices = [["A","더 편리하고 오래 보관할 수 있는 화폐가 필요했기 때문이다"],["B","조개껍데기가 멸종했기 때문이다"],["C","왕이 금속 사용을 명령했기 때문이다"],["D","농사를 짓지 못하게 되었기 때문이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "금이나 은이 화폐 재료로 적합한 까닭은 무엇인가요?";
      choices = [["A","쉽게 부식되지 않고 작은 양으로도 높은 가치를 지녔기 때문이다"],["B","어디에서나 쉽게 구할 수 있었기 때문이다"],["C","색깔이 아름다웠기 때문이다"],["D","무게가 매우 가벼웠기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "세계 최초의 주화가 만들어진 곳은 어디인가요?";
      choices = [["A","소아시아의 리디아 왕국"],["B","고대 이집트"],["C","중국 한나라"],["D","로마 제국"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "주화의 발명이 가져온 편리함은 무엇인가요?";
      choices = [["A","거래할 때마다 금속의 무게를 재지 않아도 되었다"],["B","금속을 녹여 새로 만들 필요가 없었다"],["C","누구나 주화를 직접 만들 수 있었다"],["D","주화 하나로 모든 물건을 살 수 있었다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "고려와 조선에서 사용된 화폐의 예는 무엇인가요?";
      choices = [["A","해동통보와 상평통보"],["B","교자와 보초"],["C","엽전과 원보"],["D","달러와 파운드"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장의 핵심 내용은 무엇인가요?";
      choices = [["A","금속 화폐가 전 세계적으로 경제 발전의 토대가 되었다"],["B","금속 화폐는 한 나라에서만 사용되었다"],["C","금속 화폐는 곧 사라졌다"],["D","금속 화폐보다 물물교환이 더 편리했다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","금속 화폐의 등장으로 거래가 편리해지고 경제가 발전했다"],["B","금속 화폐는 중국에서만 사용되었다"],["C","리디아 왕국은 화폐를 사용하지 않았다"],["D","금속 화폐는 만들기 쉬워서 누구나 제작했다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "지폐가 만들어진 이유는 무엇인가요?";
      choices = [["A","금속 화폐를 많이 가지고 다니는 것이 무겁고 불편했기 때문이다"],["B","금속이 부족해졌기 때문이다"],["C","종이가 금보다 비쌌기 때문이다"],["D","왕이 종이 사용을 명령했기 때문이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "세계 최초의 지폐는 무엇인가요?";
      choices = [["A","중국 송나라 시대의 교자"],["B","고려의 해동통보"],["C","유럽의 파운드 지폐"],["D","일본의 엔화"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "지폐가 널리 쓰이기 위해 필요한 것은 무엇인가요?";
      choices = [["A","발행 기관에 대한 신뢰"],["B","종이 자체의 높은 가치"],["C","금속과 동일한 무게"],["D","특별한 인쇄 기술"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "오늘날 등장한 새로운 화폐 형태의 예로 언급된 것은 무엇인가요?";
      choices = [["A","신용 카드, 전자 이체, 모바일 결제"],["B","금화와 은화"],["C","조개껍데기와 소금"],["D","수표와 어음"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "화폐의 본질적 기능이란 무엇인가요?";
      choices = [["A","물건의 가치를 수치로 나타내고 교환을 원활하게 하는 것"],["B","물건을 보관하는 것"],["C","사람들의 신분을 나타내는 것"],["D","예술 작품을 감상하는 것"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "화폐의 역사를 통해 알 수 있는 점은 무엇인가요?";
      choices = [["A","인류가 더 편리한 삶을 위해 끊임없이 새로운 방법을 고안해 왔다"],["B","화폐의 형태는 한 번도 변하지 않았다"],["C","디지털 화폐는 실패할 것이다"],["D","물물교환이 가장 효율적인 방법이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","지폐에서 디지털 화폐까지 형태는 변해 왔지만 화폐의 본질적 기능은 변하지 않았다"],["B","지폐는 금속 화폐보다 가치가 낮다"],["C","디지털 화폐가 등장하면서 화폐의 기능이 사라졌다"],["D","종이 화폐는 중국에서만 사용되었다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "물물교환에서 거래가 성사되려면 반드시 필요한 조건은 무엇인가요?",
      [findRange(paragraphs, "p1", "서로의 필요가 일치")]),
    makeConfirmQ("q2", "초기 화폐 역할을 한 물품으로 언급된 것 중 하나는 무엇인가요?",
      [findRange(paragraphs, "p1", "조개껍데기")]),
    makeConfirmQ("q3", "세계 최초의 주화가 만들어진 나라는 어디인가요?",
      [findRange(paragraphs, "p2", "리디아 왕국")]),
    makeConfirmQ("q4", "조선에서 사용된 화폐의 이름은 무엇인가요?",
      [findRange(paragraphs, "p2", "상평통보")]),
    makeConfirmQ("q5", "세계 최초의 지폐는 어느 나라 시대에 등장했나요?",
      [findRange(paragraphs, "p3", "송나라")]),
    makeConfirmQ("q6", "지폐가 널리 쓰이기 위해 뒷받침되어야 하는 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "신뢰")])
  ];

  return assembleFull(61, "NONFICTION", "비문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 62 문학: 할머니의 부채 (1008자) ===
// =============================================
function buildDay62() {
  const p1text = "한여름 오후, 수지는 외갓집 툇마루에 앉아 부채를 부치고 있었다. 그 부채는 할머니가 직접 대나무를 쪼개어 살을 만들고 한지를 한 겹 한 겹 풀칠하여 완성한 것이었다. 부채 위에는 할머니가 손수 그린 매화 그림이 담겨 있어 부칠 때마다 은은한 먹 향기가 퍼지는 듯했다. 수지는 어릴 적부터 이 부채를 구경하는 것을 좋아했지만, 올해 처음으로 할머니에게서 선물로 받았다. 할머니는 부채를 건네시며 '바람은 보이지 않지만 느낄 수 있단다, 사랑도 그렇지'라고 조용히 말씀하셨다. 수지는 그 말의 뜻을 완전히 이해하지 못한 채 고개만 끄덕이고는 부채를 가슴에 꼭 안았다.";
  const p2text = "어느 날 수지가 학교에서 돌아오니 할머니가 거실 소파에 누워 기침을 하고 계셨다. 평소 건강하셨던 할머니가 갑자기 아프신 모습에 수지는 가슴이 철렁했다. 어머니가 할머니를 병원에 모시고 가신 동안 수지는 할머니 방을 정리하며 부채를 들고 조용히 바람을 보내 드리기로 마음먹었다. 병원에서 돌아온 할머니는 베개에 머리를 누이셨고, 수지는 할머니 곁에 앉아 천천히 부채를 부쳤다. 살랑살랑 불어오는 바람에 할머니의 이마 위 땀이 조금씩 마르자, 할머니는 눈을 감으시며 편안한 미소를 지으셨다. 수지는 그때서야 할머니가 말씀하신 '보이지 않지만 느낄 수 있는 것'의 의미를 어렴풋이 알 것 같았다.";
  const p3text = "가을이 지나고 겨울이 올 무렵 할머니는 건강을 되찾으셨고, 수지는 부채를 책상 서랍에 소중히 넣어 두었다. 부채를 꺼낼 때마다 여름날 할머니의 편안한 미소가 떠올랐고, 대나무 살 사이로 스며드는 한지의 부드러운 느낌이 할머니의 손길처럼 느껴졌다. 겨울 방학에 다시 외갓집을 찾은 수지는 할머니에게 손 편지를 건넸다. 편지에는 '할머니, 부채로 바람을 보내 드리면서 사랑은 눈에 보이지 않아도 느낄 수 있다는 걸 알았어요'라고 적혀 있었다. 할머니는 편지를 천천히 읽으시더니 수지를 꼭 끌어안으시며 눈가에 맺힌 눈물을 손등으로 가만히 닦으셨다. 그 순간 수지는 보이지 않는 바람처럼 할머니의 사랑이 자신을 가득 감싸고 있음을 온몸으로 느꼈다.";

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
      prompt = "수지가 부채를 부치고 있던 장소는 어디인가요?";
      choices = [["A","외갓집 툇마루"],["B","학교 교실"],["C","집 거실"],["D","공원 벤치"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "부채를 만든 사람은 누구인가요?";
      choices = [["A","할머니가 직접 만들었다"],["B","수지가 만들었다"],["C","가게에서 구입한 것이다"],["D","어머니가 만들었다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "부채 위에 그려진 그림은 무엇인가요?";
      choices = [["A","매화 그림"],["B","대나무 그림"],["C","소나무 그림"],["D","해바라기 그림"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "수지가 올해 처음으로 한 일은 무엇인가요?";
      choices = [["A","할머니에게서 부채를 선물로 받았다"],["B","부채를 직접 만들었다"],["C","부채에 그림을 그렸다"],["D","부채를 친구에게 주었다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "할머니가 부채를 건네며 하신 말씀의 핵심은 무엇인가요?";
      choices = [["A","바람처럼 사랑도 보이지 않지만 느낄 수 있다"],["B","부채는 소중히 다루어야 한다"],["C","여름에만 부채를 사용해야 한다"],["D","바람은 건강에 좋다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "수지가 할머니의 말을 듣고 한 행동은 무엇인가요?";
      choices = [["A","뜻을 완전히 이해하지 못한 채 고개를 끄덕이고 부채를 안았다"],["B","할머니에게 질문을 하였다"],["C","부채를 되돌려 드렸다"],["D","기뻐하며 뛰어다녔다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","수지는 할머니가 정성껏 만든 부채를 선물로 받으며 사랑에 대한 말씀을 듣는다"],["B","수지는 부채 만드는 법을 배운다"],["C","할머니는 부채를 팔기 위해 만들었다"],["D","수지는 부채를 싫어하지만 받았다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "수지가 학교에서 돌아왔을 때 할머니는 어떤 상태였나요?";
      choices = [["A","거실 소파에 누워 기침을 하고 계셨다"],["B","부엌에서 요리를 하고 계셨다"],["C","마당에서 산책을 하고 계셨다"],["D","방에서 책을 읽고 계셨다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "수지가 가슴이 철렁한 이유는 무엇인가요?";
      choices = [["A","평소 건강하셨던 할머니가 갑자기 아프신 모습 때문이다"],["B","시험 성적이 나빴기 때문이다"],["C","친구와 다투었기 때문이다"],["D","할머니가 화를 내셨기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "어머니가 병원에 가신 동안 수지가 결심한 일은 무엇인가요?";
      choices = [["A","부채를 들고 할머니에게 바람을 보내 드리기로 했다"],["B","할머니 방을 청소하기로 했다"],["C","병원에 따라가기로 했다"],["D","저녁을 준비하기로 했다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "병원에서 돌아온 할머니의 모습은 어떠했나요?";
      choices = [["A","베개에 머리를 누이셨다"],["B","곧바로 부엌으로 가셨다"],["C","마당에서 운동을 하셨다"],["D","수지에게 이야기를 들려주셨다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "부채 바람이 일으킨 변화는 무엇인가요?";
      choices = [["A","할머니의 이마 위 땀이 조금씩 마르고 편안한 미소를 지으셨다"],["B","방 안의 온도가 크게 내려갔다"],["C","할머니가 잠에서 깨셨다"],["D","부채가 부러졌다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "수지가 어렴풋이 알게 된 것은 무엇인가요?";
      choices = [["A","보이지 않지만 느낄 수 있는 것의 의미"],["B","부채를 부치는 올바른 방법"],["C","할머니의 병명"],["D","매화 그림의 의미"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","아픈 할머니에게 부채로 바람을 보내 드리며 수지는 사랑의 의미를 깨닫기 시작한다"],["B","수지는 할머니를 병원에 모시고 간다"],["C","할머니는 부채를 돌려달라고 하신다"],["D","수지는 할머니가 아프신 것을 모른다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "겨울이 올 무렵 할머니의 건강 상태는 어떻게 되었나요?";
      choices = [["A","건강을 되찾으셨다"],["B","더 아프셨다"],["C","변화가 없었다"],["D","입원하셨다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "부채를 꺼낼 때마다 수지가 떠올린 것은 무엇인가요?";
      choices = [["A","여름날 할머니의 편안한 미소"],["B","학교에서 있었던 일"],["C","친구와 놀던 기억"],["D","부채를 만드는 과정"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "겨울 방학에 수지가 할머니에게 건넨 것은 무엇인가요?";
      choices = [["A","손 편지"],["B","새 부채"],["C","그림"],["D","선물 상자"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "편지에 적힌 수지의 깨달음은 무엇인가요?";
      choices = [["A","사랑은 눈에 보이지 않아도 느낄 수 있다는 것"],["B","부채를 잘 만드는 방법"],["C","여름이 가장 좋은 계절이라는 것"],["D","할머니 댁이 멀다는 것"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "편지를 읽은 할머니의 반응은 어떠했나요?";
      choices = [["A","수지를 꼭 끌어안으시며 눈가의 눈물을 닦으셨다"],["B","웃으시며 간식을 주셨다"],["C","편지를 돌려주셨다"],["D","아무 반응 없이 고개만 끄덕이셨다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "마지막 문장에서 수지가 느낀 것은 무엇인가요?";
      choices = [["A","보이지 않는 바람처럼 할머니의 사랑이 자신을 감싸고 있음"],["B","겨울 바람이 차갑다는 것"],["C","할머니 댁이 따뜻하다는 것"],["D","부채가 더 이상 필요 없다는 것"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","수지는 편지를 통해 할머니에게 사랑의 깨달음을 전하고 서로의 사랑을 확인한다"],["B","수지는 부채를 잃어버려 슬퍼한다"],["C","할머니는 수지의 편지에 화를 내신다"],["D","수지는 겨울 방학에 외갓집에 가지 않는다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "할머니가 부채를 만든 재료 중 살에 사용된 것은 무엇인가요?",
      [findRange(paragraphs, "p1", "대나무")]),
    makeConfirmQ("q2", "할머니가 부채를 건네며 비유한 것 두 가지는 무엇인가요?",
      [findRange(paragraphs, "p1", "바람"), findRange(paragraphs, "p1", "사랑")]),
    makeConfirmQ("q3", "수지가 할머니에게 부채로 바람을 보내 드린 뒤 할머니의 표정은 어떠했나요?",
      [findRange(paragraphs, "p2", "편안한 미소")]),
    makeConfirmQ("q4", "수지가 부채를 보관한 장소는 어디인가요?",
      [findRange(paragraphs, "p3", "책상 서랍")]),
    makeConfirmQ("q5", "수지가 겨울 방학에 할머니에게 건넨 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "손 편지")]),
    makeConfirmQ("q6", "편지를 읽은 할머니가 눈가를 닦은 도구는 무엇인가요?",
      [findRange(paragraphs, "p3", "손등")])
  ];

  return assembleFull(62, "LITERATURE", "문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 63 비문학: 태양계와 행성의 특징 ===
// =============================================
function buildDay63() {
  const p1text = "태양계는 태양을 중심으로 여덟 개의 행성과 소행성, 혜성, 위성이 공전하는 천체 체계이다. 태양에서 가까운 순서대로 수성, 금성, 지구, 화성을 내행성이라 부르며, 이들은 비교적 작고 딱딱한 암석으로 이루어져 있다. 수성은 태양에 가장 가까워 낮 온도가 사백삼십 도에 이르지만, 대기가 거의 없어 밤에는 영하 백팔십 도까지 떨어진다. 금성은 두꺼운 이산화 탄소 대기로 온실 효과가 극심하여 표면 온도가 사백육십 도를 넘는 가장 뜨거운 행성이다. 지구는 액체 상태의 물과 적절한 대기를 가진 유일한 행성으로 생명체가 살기에 알맞다. 화성은 표면의 산화철 때문에 붉게 보여 빨간 행성이라 불리며, 과거 물이 흘렀던 흔적이 발견되고 있다.";
  const p2text = "목성, 토성, 천왕성, 해왕성은 외행성으로 분류되며 주로 가스와 얼음으로 구성되어 있다. 목성은 태양계에서 가장 큰 행성으로, 대적점이라 불리는 거대한 폭풍이 삼백 년 넘게 지속되고 있다. 토성은 얼음과 암석 조각으로 이루어진 화려한 고리로 유명하며, 작은 망원경으로도 관찰할 수 있다. 천왕성은 자전축이 거의 눕혀져 있어 옆으로 구르듯 공전하며, 메탄 가스 때문에 청록색으로 보인다. 해왕성은 태양에서 가장 먼 행성으로 초속 이천 킬로미터의 강력한 바람이 불어 태양계에서 바람이 가장 센 곳이다. 이처럼 여덟 행성은 저마다 독특한 특징을 가지고 있어 과학자들의 탐구 대상이 되고 있다.";
  const p3text = "태양계 탐사는 이십 세기 중반부터 본격적으로 시작되었다. 보이저 탐사선은 천구백칠십칠 년에 발사되어 목성, 토성, 천왕성, 해왕성을 차례로 지나가며 귀중한 데이터를 전송했다. 화성에는 여러 대의 로버가 보내져 토양을 분석하고 있으며, 과거 물의 흔적과 유기물이 발견되어 주목받았다. 최근에는 민간 우주 기업까지 화성 유인 탐사 계획을 발표하여 탐사 범위가 넓어지고 있다. 태양계 밖의 외계 행성을 관측하는 기술도 발전하여 지구와 비슷한 환경의 행성을 찾으려는 노력이 계속되고 있다. 태양계는 인류가 우주를 이해하는 출발점이자 끝없는 호기심의 대상이다.";

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
      prompt = "태양계를 구성하는 요소로 언급된 것은 무엇인가요?";
      choices = [["A","태양, 여덟 개의 행성, 소행성, 혜성, 위성"],["B","태양과 달 두 가지뿐이다"],["C","별과 은하수"],["D","태양과 지구만 해당된다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "내행성의 공통된 특징은 무엇인가요?";
      choices = [["A","비교적 작고 딱딱한 암석으로 이루어져 있다"],["B","가스로 구성되어 있다"],["C","모두 고리를 가지고 있다"],["D","크기가 매우 크다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "수성의 낮과 밤 온도 차이가 큰 까닭은 무엇인가요?";
      choices = [["A","대기가 거의 없기 때문이다"],["B","태양에서 너무 멀기 때문이다"],["C","물이 많아 온도가 변하기 때문이다"],["D","자전 속도가 빠르기 때문이다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "금성이 태양계에서 가장 뜨거운 행성인 이유는 무엇인가요?";
      choices = [["A","두꺼운 이산화 탄소 대기로 온실 효과가 극심하기 때문이다"],["B","태양에서 가장 가깝기 때문이다"],["C","화산 활동이 활발하기 때문이다"],["D","대기가 없기 때문이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "지구가 생명체가 살기에 알맞은 까닭은 무엇인가요?";
      choices = [["A","액체 상태의 물과 적절한 대기를 가지고 있기 때문이다"],["B","태양에서 가장 가깝기 때문이다"],["C","고리가 있어 보호받기 때문이다"],["D","크기가 가장 크기 때문이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "화성이 빨간 행성이라 불리는 이유는 무엇인가요?";
      choices = [["A","표면의 산화철 때문에 붉게 보이기 때문이다"],["B","화산이 많아서 붉은 빛이 나기 때문이다"],["C","대기의 색깔이 붉기 때문이다"],["D","태양빛을 많이 반사하기 때문이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","태양계의 내행성 네 개는 각각 독특한 환경적 특징을 가지고 있다"],["B","내행성은 모두 동일한 환경을 가지고 있다"],["C","지구만이 태양계의 유일한 행성이다"],["D","화성에는 현재 생명체가 살고 있다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "외행성의 주된 구성 물질은 무엇인가요?";
      choices = [["A","가스와 얼음"],["B","암석과 금속"],["C","물과 모래"],["D","흙과 점토"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "목성에서 삼백 년 넘게 지속되고 있는 것은 무엇인가요?";
      choices = [["A","대적점이라 불리는 거대한 폭풍"],["B","행성 전체를 감싸는 고리"],["C","거대한 화산 폭발"],["D","끊임없는 지진"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "토성의 고리를 구성하는 물질은 무엇인가요?";
      choices = [["A","얼음과 암석 조각"],["B","가스와 먼지"],["C","물과 금속"],["D","화산재와 용암"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "천왕성이 청록색으로 보이는 이유는 무엇인가요?";
      choices = [["A","메탄 가스 때문이다"],["B","물이 많기 때문이다"],["C","이산화 탄소 때문이다"],["D","산소가 풍부하기 때문이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "해왕성의 특징으로 올바른 것은 무엇인가요?";
      choices = [["A","태양계에서 바람이 가장 센 곳이다"],["B","태양에서 가장 가까운 행성이다"],["C","고리가 가장 화려한 행성이다"],["D","크기가 가장 작은 행성이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "여덟 행성이 과학자들의 탐구 대상이 되는 이유는 무엇인가요?";
      choices = [["A","저마다 독특한 특징을 가지고 있기 때문이다"],["B","모두 같은 환경이기 때문이다"],["C","탐사가 불가능하기 때문이다"],["D","크기가 모두 동일하기 때문이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","외행성 네 개는 가스와 얼음으로 이루어져 있으며 각각 독특한 특징을 지니고 있다"],["B","외행성은 모두 암석으로 이루어져 있다"],["C","목성만이 유일한 외행성이다"],["D","외행성에는 특별한 특징이 없다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "태양계 탐사가 본격적으로 시작된 시기는 언제인가요?";
      choices = [["A","이십 세기 중반"],["B","십팔 세기"],["C","이십일 세기 초"],["D","십오 세기"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "보이저 탐사선이 지나간 행성들의 순서는 어떠한가요?";
      choices = [["A","목성, 토성, 천왕성, 해왕성"],["B","수성, 금성, 지구, 화성"],["C","화성, 목성, 토성만 지나갔다"],["D","해왕성에서 출발하여 목성으로 갔다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "화성 로버가 발견하여 큰 주목을 받은 것은 무엇인가요?";
      choices = [["A","과거 물의 흔적과 유기물"],["B","현재 살아 있는 생명체"],["C","금속 자원"],["D","얼음으로 된 호수"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "최근 우주 탐사 분야의 새로운 변화는 무엇인가요?";
      choices = [["A","민간 우주 기업이 화성 유인 탐사 계획을 발표했다"],["B","모든 나라가 우주 탐사를 중단했다"],["C","달 탐사만 집중하고 있다"],["D","로봇 탐사가 완전히 사라졌다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "태양계 밖에서 찾으려는 것은 무엇인가요?";
      choices = [["A","지구와 비슷한 환경의 행성"],["B","새로운 태양"],["C","금이 풍부한 소행성"],["D","우주의 끝"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 태양계를 어떻게 표현하고 있나요?";
      choices = [["A","인류가 우주를 이해하는 출발점이자 끝없는 호기심의 대상"],["B","이미 완전히 탐사가 끝난 영역"],["C","인류와 무관한 먼 공간"],["D","위험하여 접근해서는 안 되는 곳"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","태양계 탐사는 보이저호에서 시작하여 화성 로버, 민간 기업까지 범위가 넓어지고 있다"],["B","태양계 탐사는 보이저호 이후 중단되었다"],["C","화성에서는 아무런 발견도 없었다"],["D","민간 기업은 우주 탐사에 관심이 없다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "태양계에서 가장 뜨거운 행성은 어디인가요?",
      [findRange(paragraphs, "p1", "금성")]),
    makeConfirmQ("q2", "화성이 붉게 보이는 원인 물질은 무엇인가요?",
      [findRange(paragraphs, "p1", "산화철")]),
    makeConfirmQ("q3", "목성에서 오래 지속되고 있는 거대한 폭풍의 이름은 무엇인가요?",
      [findRange(paragraphs, "p2", "대적점")]),
    makeConfirmQ("q4", "천왕성이 청록색으로 보이게 하는 기체는 무엇인가요?",
      [findRange(paragraphs, "p2", "메탄")]),
    makeConfirmQ("q5", "보이저 탐사선이 발사된 연도는 언제인가요?",
      [findRange(paragraphs, "p3", "천구백칠십칠 년")]),
    makeConfirmQ("q6", "화성 로버가 발견하여 주목받은 것 중 하나는 무엇인가요?",
      [findRange(paragraphs, "p3", "유기물")])
  ];

  return assembleFull(63, "NONFICTION", "비문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 64 문학: 도서관의 비밀 (997자) ===
// =============================================
function buildDay64() {
  const p1text = "지호는 매주 토요일 오전이면 동네 도서관에 갔다. 책을 빌리러 가는 것이 주된 이유였지만, 사실 지호에게는 또 다른 즐거움이 있었다. 도서관 가장 안쪽에 커다란 창이 있는 열람실이 있는데, 그 창 너머로 보이는 작은 정원에 매번 계절마다 다른 꽃이 피었기 때문이다. 봄에는 벚꽃이 하얗게 흩날렸고 여름에는 수국이 파란 얼굴을 내밀었다. 지호는 그 정원을 바라보며 책을 읽으면 마치 이야기 속 배경이 눈앞에 펼쳐지는 것 같아 좋았다. 그러던 어느 가을 토요일, 지호는 열람실 창가 자리에 앉다가 의자 아래에서 낡은 가죽 수첩 하나를 발견했다.";
  const p2text = "수첩을 조심스레 열어 보니 안에는 빼곡한 손글씨와 누르스름해진 누군가의 사진이 끼워져 있었다. 첫 쪽에는 '도서관 정원 관찰 일지'라는 제목 아래 날짜와 함께 정원에 핀 꽃 이름, 찾아온 새의 종류, 계절에 따라 변하는 나무의 모습이 세밀하게 기록되어 있었다. 글씨체는 또박또박하면서도 따뜻한 느낌이 들었고, 꽃을 설명하는 문장에는 감탄사와 함께 작은 하트 표시가 그려져 있었다. 지호는 페이지를 넘기며 마치 누군가와 함께 정원을 산책하는 기분을 느꼈다. 마지막 쪽에는 '이 수첩을 주운 사람에게: 이 정원을 사랑해 주세요'라는 짧은 문장이 적혀 있었다. 지호는 가슴이 따뜻해지며 수첩의 주인이 어떤 사람일지 궁금해졌다.";
  const p3text = "다음 토요일, 지호는 새 노트를 한 권 사서 도서관에 갔다. 열람실 창가에 앉아 정원을 바라보니 단풍나무의 잎이 빨갛고 노랗게 물들어 있었고, 작은 참새 두 마리가 가지 위에서 나란히 앉아 지저귀고 있었다. 지호는 노트를 펼치고 날짜를 적은 뒤 눈에 보이는 풍경을 하나하나 정성껏 기록하기 시작했다. 가죽 수첩의 주인처럼 꽃 이름 옆에 작은 표시도 그렸다. 사서 선생님이 지나가다 지호의 노트를 보시더니 빙그레 웃으시며 '정원 관찰 일지를 쓰는 아이가 또 한 명 생겼구나'라고 말씀하셨다. 지호는 고개를 들어 환하게 웃으며 자신도 이 정원을 오래오래 기록하겠다고 마음속으로 다짐했다.";

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
      prompt = "지호가 도서관에 가는 시기는 언제인가요?";
      choices = [["A","매주 토요일 오전"],["B","매일 방과 후"],["C","매주 일요일 오후"],["D","방학 때만"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "지호가 도서관에 가는 주된 이유 외에 또 다른 즐거움은 무엇인가요?";
      choices = [["A","아직 명시되지 않았으나 다른 즐거움이 있었다"],["B","친구를 만나는 것이다"],["C","만화를 읽는 것이다"],["D","간식을 사 먹는 것이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "도서관 열람실 창 너머에 있는 것은 무엇인가요?";
      choices = [["A","계절마다 다른 꽃이 피는 작은 정원"],["B","넓은 운동장"],["C","큰 연못"],["D","놀이터"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "봄과 여름에 정원에서 볼 수 있는 꽃으로 언급된 것은 무엇인가요?";
      choices = [["A","벚꽃과 수국"],["B","장미와 튤립"],["C","해바라기와 코스모스"],["D","진달래와 개나리"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "정원을 바라보며 책을 읽을 때 지호가 느끼는 것은 무엇인가요?";
      choices = [["A","이야기 속 배경이 눈앞에 펼쳐지는 것 같다"],["B","졸음이 몰려온다"],["C","책에 집중할 수 없다"],["D","정원이 지루하게 느껴진다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "가을 토요일에 지호가 의자 아래에서 발견한 것은 무엇인가요?";
      choices = [["A","낡은 가죽 수첩"],["B","잃어버린 도서관 카드"],["C","오래된 편지"],["D","동전 한 닢"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","도서관 정원을 좋아하는 지호가 어느 가을날 의자 아래에서 낡은 수첩을 발견한다"],["B","지호는 도서관에 가는 것을 싫어한다"],["C","도서관 정원에는 꽃이 피지 않는다"],["D","지호는 친구와 함께 도서관에 간다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "수첩을 열었을 때 안에 있던 것은 무엇인가요?";
      choices = [["A","빼곡한 손글씨와 누르스름해진 사진"],["B","빈 종이와 스티커"],["C","그림과 색연필 자국"],["D","도서관 대출 목록"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "수첩의 제목은 무엇인가요?";
      choices = [["A","도서관 정원 관찰 일지"],["B","나의 독서 목록"],["C","계절별 날씨 기록"],["D","꽃 이름 사전"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "수첩의 글씨체에서 느껴지는 분위기는 어떠한가요?";
      choices = [["A","또박또박하면서도 따뜻한 느낌"],["B","어지럽고 급하게 쓴 느낌"],["C","영어로 적혀 있어 외국인의 느낌"],["D","컴퓨터로 인쇄한 듯한 느낌"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "지호가 페이지를 넘기며 느낀 기분은 무엇인가요?";
      choices = [["A","누군가와 함께 정원을 산책하는 기분"],["B","무서운 이야기를 읽는 기분"],["C","시험 공부를 하는 기분"],["D","비 오는 날 집에 있는 기분"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "수첩 마지막 쪽에 적힌 문장은 무엇인가요?";
      choices = [["A","이 정원을 사랑해 주세요"],["B","이 수첩을 돌려주세요"],["C","다시는 오지 마세요"],["D","도서관을 조용히 이용하세요"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "수첩의 마지막 문장을 읽은 지호의 감정은 어떠했나요?";
      choices = [["A","가슴이 따뜻해지며 수첩 주인이 궁금해졌다"],["B","실망하여 수첩을 내려놓았다"],["C","무섭다는 느낌이 들었다"],["D","아무런 감흥이 없었다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","수첩에는 정원 관찰 기록과 정원을 사랑해 달라는 메시지가 담겨 있어 지호를 감동시킨다"],["B","수첩에는 아무 내용도 적혀 있지 않다"],["C","지호는 수첩을 읽지 않고 반납한다"],["D","수첩의 주인이 직접 찾아와 가져간다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "다음 토요일 지호가 도서관에 가져간 것은 무엇인가요?";
      choices = [["A","새 노트 한 권"],["B","가죽 수첩"],["C","카메라"],["D","색연필 세트"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "정원에서 지호가 본 가을 풍경은 어떠했나요?";
      choices = [["A","단풍나무 잎이 빨갛고 노랗게 물들고 참새 두 마리가 앉아 있었다"],["B","벚꽃이 만개하고 있었다"],["C","수국이 파랗게 피어 있었다"],["D","눈이 내리고 있었다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "지호가 노트에 하기 시작한 일은 무엇인가요?";
      choices = [["A","눈에 보이는 풍경을 정성껏 기록하기 시작했다"],["B","그림만 그렸다"],["C","독서 감상문을 썼다"],["D","수학 숙제를 했다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "지호가 꽃 이름 옆에 따라 한 것은 무엇인가요?";
      choices = [["A","가죽 수첩의 주인처럼 작은 표시를 그렸다"],["B","가격을 적었다"],["C","영어 이름을 함께 적었다"],["D","사진을 붙였다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "사서 선생님이 지호에게 한 말은 무엇인가요?";
      choices = [["A","정원 관찰 일지를 쓰는 아이가 또 한 명 생겼구나"],["B","도서관에서 떠들지 말아라"],["C","그 노트는 도서관 것이다"],["D","정원에 들어가면 안 된다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "지호가 마음속으로 한 다짐은 무엇인가요?";
      choices = [["A","이 정원을 오래오래 기록하겠다"],["B","도서관에 더 이상 오지 않겠다"],["C","수첩의 주인을 반드시 찾겠다"],["D","정원에 새로운 꽃을 심겠다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","지호는 수첩 주인의 마음을 이어받아 자신만의 정원 관찰 일지를 쓰기 시작한다"],["B","지호는 정원에 관심을 잃고 책만 읽는다"],["C","사서 선생님이 지호를 혼낸다"],["D","지호는 가죽 수첩을 분실한다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "도서관 열람실 창 너머에 있는 공간의 이름은 무엇인가요?",
      [findRange(paragraphs, "p1", "정원")]),
    makeConfirmQ("q2", "지호가 의자 아래에서 발견한 물건은 무엇인가요?",
      [findRange(paragraphs, "p1", "가죽 수첩")]),
    makeConfirmQ("q3", "수첩 첫 쪽에 적힌 제목은 무엇인가요?",
      [findRange(paragraphs, "p2", "도서관 정원 관찰 일지")]),
    makeConfirmQ("q4", "수첩 마지막 쪽에 적힌 부탁의 핵심은 무엇인가요?",
      [findRange(paragraphs, "p2", "사랑해 주세요")]),
    makeConfirmQ("q5", "사서 선생님이 알아본 지호의 활동은 무엇인가요?",
      [findRange(paragraphs, "p3", "정원 관찰 일지")]),
    makeConfirmQ("q6", "가을 정원에서 지호가 본 나무는 무엇인가요?",
      [findRange(paragraphs, "p3", "단풍나무")])
  ];

  return assembleFull(64, "LITERATURE", "문학", paragraphs, timeline, cards, confirmQs);
}

// =============================================
// === Day 65 비문학: 미생물의 세계 ===
// =============================================
function buildDay65() {
  const p1text = "우리 눈에 보이지 않는 아주 작은 생물을 미생물이라 부른다. 미생물에는 세균, 바이러스, 곰팡이, 원생생물 등이 있으며 지구의 거의 모든 환경에서 살아간다. 세균은 단세포 생물로 흙, 물, 공기는 물론 사람의 피부와 장 속에도 수없이 많이 존재한다. 바이러스는 세균보다 훨씬 작아서 전자 현미경으로만 관찰할 수 있으며, 스스로 증식하지 못해 반드시 숙주 세포에 기생하여 번식한다. 곰팡이는 실처럼 가느다란 균사를 뻗으며 자라며, 축축한 환경에서 빵이나 과일 위에 번식하는 모습을 쉽게 볼 수 있다. 이처럼 다양한 미생물들은 크기는 작지만 생태계에서 큰 역할을 담당한다.";
  const p2text = "미생물이라고 하면 질병을 일으키는 나쁜 존재로만 떠올리기 쉽지만 대부분의 미생물은 이로운 역할을 한다. 토양 속 세균은 죽은 동식물을 분해하여 영양분으로 되돌리는 분해자 역할을 하며, 이 과정 없이는 생물의 사체가 끝없이 쌓일 것이다. 장내 세균은 음식물의 소화를 돕고 비타민을 합성하며 유해균의 침입을 막아 건강을 지킨다. 발효 미생물은 김치, 된장, 요구르트 같은 발효 식품을 만드는 데 필수적이며 인류는 오래전부터 미생물의 힘을 이용해 왔다. 또한 일부 미생물은 폐수를 정화하거나 플라스틱을 분해하는 능력이 있어 환경 문제 해결의 열쇠로 주목받고 있다. 이처럼 미생물은 보이지 않는 곳에서 지구의 순환과 인간 생활을 뒷받침하고 있다.";
  const p3text = "미생물 연구는 현대 과학과 산업에서 점점 더 중요해지고 있다. 의학에서는 항생제를 만들거나 백신을 개발할 때 미생물에 대한 깊은 이해가 필수적이다. 농업에서는 질소 고정 세균을 이용하여 화학 비료 없이 토양의 영양분을 높이는 연구가 진행되고 있다. 생명 공학에서는 미생물 유전자를 변형하여 의약품 원료나 바이오 연료를 생산하는 기술이 발전하고 있다. 최근에는 장내 미생물 구성이 비만, 우울증 등 다양한 질환과 관련이 있다는 연구가 발표되어 장내 미생물 관리가 중요해지고 있다. 눈에 보이지 않는 작은 존재가 인류의 건강과 미래를 좌우할 수 있다는 사실은 과학의 놀라운 발견이다.";

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
      prompt = "미생물의 정의는 무엇인가요?";
      choices = [["A","우리 눈에 보이지 않는 아주 작은 생물"],["B","바다에서만 사는 큰 생물"],["C","식물의 한 종류"],["D","눈에 보이는 곤충"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "미생물의 종류로 언급된 것은 무엇인가요?";
      choices = [["A","세균, 바이러스, 곰팡이, 원생생물"],["B","식물, 동물, 광물"],["C","어류, 조류, 포유류"],["D","나무, 풀, 이끼"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "세균이 존재하는 곳으로 언급된 예는 무엇인가요?";
      choices = [["A","흙, 물, 공기, 사람의 피부와 장 속"],["B","우주 공간에서만 존재한다"],["C","물속에서만 산다"],["D","바위 표면에서만 발견된다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "바이러스가 증식하기 위해 반드시 필요한 것은 무엇인가요?";
      choices = [["A","숙주 세포에 기생해야 한다"],["B","충분한 햇빛이 필요하다"],["C","물속에서만 증식할 수 있다"],["D","다른 바이러스의 도움이 필요하다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "곰팡이가 자라는 환경은 어떠한가요?";
      choices = [["A","축축한 환경에서 잘 번식한다"],["B","건조한 사막에서만 자란다"],["C","극도로 추운 곳에서만 자란다"],["D","빛이 없는 곳에서는 자라지 못한다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 미생물의 특성으로 강조한 것은 무엇인가요?";
      choices = [["A","크기는 매우 작지만 생태계에서 큰 역할을 한다"],["B","미생물은 아무 역할도 하지 않는다"],["C","미생물은 점점 사라지고 있다"],["D","미생물은 크기가 매우 크다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","미생물은 세균, 바이러스, 곰팡이 등 다양한 종류가 있으며 생태계에서 큰 역할을 한다"],["B","미생물은 세균 한 종류만 존재한다"],["C","미생물은 눈에 보이는 큰 생물이다"],["D","미생물은 지구에서 살 수 없다"]],
    "A"
  ));

  // p2 (6문장)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "미생물에 대한 일반적인 오해는 무엇인가요?";
      choices = [["A","질병을 일으키는 나쁜 존재로만 생각하는 것"],["B","미생물이 매우 크다고 생각하는 것"],["C","미생물이 식물이라고 생각하는 것"],["D","미생물이 존재하지 않는다고 생각하는 것"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "토양 속 세균이 하는 역할은 무엇인가요?";
      choices = [["A","죽은 동식물을 분해하여 영양분으로 되돌리는 분해자 역할"],["B","흙의 색깔을 바꾸는 역할"],["C","돌을 부수는 역할"],["D","지하수를 오염시키는 역할"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "장내 세균이 하는 일로 언급된 것은 무엇인가요?";
      choices = [["A","소화를 돕고 비타민을 합성하며 유해균의 침입을 막는다"],["B","음식물을 더 딱딱하게 만든다"],["C","체온을 낮추는 역할을 한다"],["D","뼈를 튼튼하게 하는 역할을 한다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "발효 미생물이 만드는 식품의 예는 무엇인가요?";
      choices = [["A","김치, 된장, 요구르트"],["B","빵, 쿠키, 케이크"],["C","사탕, 초콜릿, 젤리"],["D","밥, 국, 찌개"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "환경 오염 해결에서 미생물이 주목받는 이유는 무엇인가요?";
      choices = [["A","폐수를 정화하거나 플라스틱을 분해하는 능력이 있기 때문이다"],["B","미생물이 쓰레기를 태울 수 있기 때문이다"],["C","미생물이 오염된 공기를 마시기 때문이다"],["D","미생물이 쓰레기를 먹고 사라지기 때문이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장이 전달하는 핵심 메시지는 무엇인가요?";
      choices = [["A","미생물은 보이지 않는 곳에서 지구의 순환과 인간의 생활을 뒷받침한다"],["B","미생물은 지구에 해로운 존재이다"],["C","미생물의 역할은 매우 제한적이다"],["D","미생물은 인간 생활과 무관하다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","대부분의 미생물은 분해, 소화, 발효, 환경 정화 등 인간과 자연에 이로운 역할을 한다"],["B","미생물은 모두 질병을 일으키는 해로운 존재이다"],["C","미생물은 발효 식품에만 관여한다"],["D","토양 속 세균은 아무런 역할을 하지 않는다"]],
    "A"
  ));

  // p3 (6문장)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "미생물 연구가 점점 중요해지는 분야는 어디인가요?";
      choices = [["A","현대 과학과 산업"],["B","예술과 음악"],["C","체육과 무용"],["D","건축과 토목"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "의학 분야에서 미생물 이해가 필수적인 이유는 무엇인가요?";
      choices = [["A","항생제를 만들거나 백신을 개발할 때 필요하기 때문이다"],["B","수술 도구를 만들 때 필요하기 때문이다"],["C","병원 건물을 설계할 때 필요하기 때문이다"],["D","의사의 면허를 취득할 때 필요하기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "농업에서 질소 고정 세균을 이용하려는 목적은 무엇인가요?";
      choices = [["A","화학 비료 없이 토양의 영양분을 높이기 위해서이다"],["B","해충을 퇴치하기 위해서이다"],["C","농작물의 색깔을 바꾸기 위해서이다"],["D","토양의 수분을 제거하기 위해서이다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "생명 공학에서 미생물 유전자를 변형하여 생산하는 것은 무엇인가요?";
      choices = [["A","의약품 원료나 바이오 연료"],["B","보석과 금속"],["C","전자 기기 부품"],["D","섬유와 옷감"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "장내 미생물 구성과 관련이 있다고 밝혀진 질환의 예는 무엇인가요?";
      choices = [["A","비만과 우울증"],["B","골절과 탈모"],["C","근시와 난시"],["D","충치와 잇몸병"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "마지막 문장에서 과학의 놀라운 발견으로 언급한 사실은 무엇인가요?";
      choices = [["A","눈에 보이지 않는 작은 존재가 인류의 건강과 미래를 좌우할 수 있다는 것"],["B","미생물은 크기가 점점 커지고 있다는 것"],["C","미생물은 곧 사라질 것이라는 것"],["D","미생물은 우주에서 온 것이라는 것"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","미생물 연구는 의학, 농업, 생명 공학 등에서 점점 중요해지고 있으며 인류의 미래에 큰 영향을 미친다"],["B","미생물 연구는 이미 모두 완료되었다"],["C","미생물은 농업에서만 활용된다"],["D","장내 미생물은 건강과 무관하다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "바이러스를 관찰할 수 있는 도구는 무엇인가요?",
      [findRange(paragraphs, "p1", "전자 현미경")]),
    makeConfirmQ("q2", "곰팡이가 자라는 형태를 무엇이라 하나요?",
      [findRange(paragraphs, "p1", "균사")]),
    makeConfirmQ("q3", "토양 속 세균의 역할을 한 단어로 표현한 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "분해자")]),
    makeConfirmQ("q4", "미생물의 힘을 이용한 식품의 예로 언급된 한 가지는 무엇인가요?",
      [findRange(paragraphs, "p2", "김치")]),
    makeConfirmQ("q5", "화학 비료 대신 이용하려는 세균은 무엇인가요?",
      [findRange(paragraphs, "p3", "질소 고정 세균")]),
    makeConfirmQ("q6", "장내 미생물과 관련이 있다고 밝혀진 질환 중 하나는 무엇인가요?",
      [findRange(paragraphs, "p3", "비만")])
  ];

  return assembleFull(65, "NONFICTION", "비문학", paragraphs, timeline, cards, confirmQs);
}

// === 메인 실행 ===
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const batchPath = path.join(ROOT, 'generated', 'daily-batch-reading-frege3.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'frege3');

  // 배치 파일 읽기
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

  // Day 61~65 콘텐츠 빌드
  const days = [
    { dayIndex: 61, builder: buildDay61 },
    { dayIndex: 62, builder: buildDay62 },
    { dayIndex: 63, builder: buildDay63 },
    { dayIndex: 64, builder: buildDay64 },
    { dayIndex: 65, builder: buildDay65 }
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
