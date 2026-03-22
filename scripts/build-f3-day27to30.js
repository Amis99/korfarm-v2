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

function makeConfirmQ(id, prompt, ranges) {
  return {
    id, prompt, answerRanges: ranges,
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true, answerMatchMode: "ANY"
  };
}

function makeContent(dayIndex, subArea, title, paragraphs, timeline, cards, confirmQs) {
  const nn = String(dayIndex).padStart(3, '0');
  return {
    contentId: `dr-f3-${nn}`,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title,
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

function makeBatchItem(dayIndex, subArea, content) {
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

// === Day 27 비문학: 생태계의 에너지 흐름 ===
function buildDay27() {
  const p1text = "생태계에서 에너지는 햇빛으로부터 시작하여 먹이 사슬을 따라 한 방향으로 흐른다. 식물은 광합성을 통해 태양 에너지를 화학 에너지로 바꾸어 저장하므로, 생태계에서 에너지를 처음 만들어 내는 생산자 역할을 한다. 이렇게 저장된 에너지는 식물을 먹는 초식 동물에게 전달되고, 초식 동물을 먹는 육식 동물에게 다시 옮겨 간다. 이 과정에서 각 단계의 생물은 먹이로 얻은 에너지의 일부를 호흡에 사용하여 열로 내보내며, 나머지만 다음 단계로 넘긴다. 따라서 먹이 사슬의 단계가 높아질수록 이용할 수 있는 에너지의 양은 크게 줄어든다. 이를 숫자로 나타내면 한 단계에서 다음 단계로 넘어갈 때 에너지의 약 십 퍼센트만 전달되는 것으로 알려져 있다.";
  const p2text = "에너지가 단계마다 줄어드는 현상은 생태계의 구조에 직접적인 영향을 끼친다. 생산자인 식물의 총 에너지가 가장 크고, 초식 동물과 육식 동물로 갈수록 에너지 총량이 작아지기 때문에, 각 단계에 속한 생물의 수나 생물량도 아래에서 위로 줄어드는 피라미드 모양을 이룬다. 이것을 생태 피라미드라 부르며, 에너지 피라미드 외에도 개체 수 피라미드와 생물량 피라미드가 있다. 만약 중간 단계의 생물이 갑자기 사라지면 그 위 단계는 먹이를 잃어 개체 수가 줄고, 아래 단계는 천적이 줄어들어 개체 수가 늘어난다. 이러한 변화는 시간이 지나면서 점차 원래 상태에 가깝게 되돌아가는데, 이를 생태계의 자기 조절 능력이라 한다.";
  const p3text = "그러나 생태계의 자기 조절 능력에도 한계가 있다. 외래종이 유입되어 토착 생물의 먹이를 빼앗거나, 환경 오염으로 생산자인 식물이 크게 줄어들면, 에너지 흐름 자체가 흔들려 피라미드 구조가 무너질 수 있다. 특히 최상위 포식자가 사라지면 중간 소비자가 폭발적으로 늘어나 생산자를 지나치게 소비하는 연쇄 반응이 일어나기도 한다. 이처럼 에너지 흐름의 균형이 깨지면 복원에 매우 오랜 시간이 필요하거나 아예 되돌릴 수 없는 상태에 이를 수 있다. 그러므로 생태계를 보전하려면 먹이 사슬의 각 단계를 고루 지켜야 하며, 한 종만 보호하는 것으로는 충분하지 않다.";

  const paragraphs = [
    { id: "p1", text: p1text },
    { id: "p2", text: p2text },
    { id: "p3", text: p3text }
  ];

  const s1p1 = findSentences(p1text);
  const s2p2 = findSentences(p2text);
  const s3p3 = findSentences(p3text);

  // 정독 timeline: 각 문장 순차 하이라이트 + 4지선다 + 문단 마지막에 문단 전체 + 중심내용
  let stepNum = 0;
  const timeline = [];

  // --- p1 문장들 ---
  s1p1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에서 생태계 에너지의 출발점으로 언급된 것은 무엇인가요?";
      choices = [["A","태양에서 오는 햇빛"],["B","바람이 만드는 운동 에너지"],["C","땅속 깊은 곳의 지열"],["D","바닷물의 조류 에너지"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "이 문장에서 식물이 생산자로 불리는 까닭은 무엇인가요?";
      choices = [["A","광합성으로 태양 에너지를 화학 에너지로 전환하기 때문이다"],["B","토양 속 무기물을 분해하여 영양분을 만들기 때문이다"],["C","다른 동물에게 서식지를 제공하기 때문이다"],["D","물을 정화하여 깨끗한 환경을 유지하기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "이 문장이 설명하는 에너지 전달 경로로 올바른 것은 무엇인가요?";
      choices = [["A","식물에서 초식 동물로, 다시 육식 동물로 이동한다"],["B","육식 동물에서 초식 동물로 역류하여 전달된다"],["C","모든 생물이 햇빛에서 직접 에너지를 얻는다"],["D","에너지는 분해자에서 생산자로 되돌아간다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "이 문장에 따르면 각 단계의 생물은 에너지를 어떻게 사용하나요?";
      choices = [["A","일부를 호흡으로 열에너지로 방출하고 나머지를 전달한다"],["B","전부를 다음 단계로 온전히 넘긴다"],["C","호흡 없이 에너지를 모두 축적한다"],["D","에너지를 빛의 형태로 다시 방출한다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 문장의 핵심 내용은 무엇인가요?";
      choices = [["A","먹이 사슬의 단계가 올라갈수록 이용 가능한 에너지가 줄어든다"],["B","단계가 높아질수록 생물의 크기가 반드시 커진다"],["C","상위 포식자는 에너지를 가장 많이 보유한다"],["D","에너지 양은 모든 단계에서 동일하다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 언급하는 에너지 전달 비율은 약 얼마인가요?";
      choices = [["A","한 단계에서 다음 단계로 약 십 퍼센트가 전달된다"],["B","전체 에너지의 절반이 다음 단계로 넘어간다"],["C","에너지의 구십 퍼센트가 그대로 전달된다"],["D","전달 비율은 단계마다 달라 일정하지 않다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  // p1 전체 하이라이트 + 중심내용
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","생태계에서 에너지는 먹이 사슬을 따라 한 방향으로 흐르며 단계마다 줄어든다"],["B","식물은 광합성 없이도 에너지를 만들 수 있다"],["C","육식 동물은 생산자보다 에너지를 더 많이 가진다"],["D","먹이 사슬은 순환 구조를 이루어 에너지가 돌아온다"]],
    "A"
  ));

  // --- p2 문장들 ---
  s2p2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에 따르면 에너지 감소 현상이 영향을 미치는 대상은 무엇인가요?";
      choices = [["A","생태계의 구조"],["B","지구의 자전 속도"],["C","대기 중 이산화탄소 농도"],["D","해양의 염분 농도"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "이 문장에서 설명하는 피라미드 모양이 만들어지는 까닭은 무엇인가요?";
      choices = [["A","높은 단계로 갈수록 에너지 총량이 작아지기 때문이다"],["B","생산자가 가장 적은 에너지를 보유하기 때문이다"],["C","모든 단계의 생물량이 동일하기 때문이다"],["D","육식 동물이 가장 많은 개체 수를 차지하기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "이 문장에서 소개하는 생태 피라미드의 종류가 아닌 것은 무엇인가요?";
      choices = [["A","속도 피라미드"],["B","에너지 피라미드"],["C","개체 수 피라미드"],["D","생물량 피라미드"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "이 문장에 따르면 중간 단계 생물이 사라졌을 때 일어나는 현상은 무엇인가요?";
      choices = [["A","위 단계는 먹이를 잃고 아래 단계는 천적이 줄어 수가 늘어난다"],["B","위 단계와 아래 단계 모두 개체 수가 감소한다"],["C","생태계 전체가 즉시 안정 상태로 전환된다"],["D","모든 단계의 생물이 동시에 멸종한다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 문장에서 설명하는 '자기 조절 능력'의 의미는 무엇인가요?";
      choices = [["A","변화가 시간이 지나면서 원래 상태에 가깝게 되돌아가는 것이다"],["B","생태계가 외부 도움 없이 새로운 종을 만들어 내는 것이다"],["C","인간이 개입하여 생태계를 인위적으로 복원하는 것이다"],["D","한 종이 다른 종을 완전히 대체하는 것이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  // p2 전체 + 중심내용
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","에너지 감소로 인해 생태계는 피라미드 구조를 이루며 자기 조절 능력을 가진다"],["B","생태 피라미드는 오직 개체 수만으로 측정할 수 있다"],["C","중간 단계의 생물이 사라져도 생태계에는 아무 영향이 없다"],["D","자기 조절 능력이란 생태계가 영원히 변하지 않는 것을 뜻한다"]],
    "A"
  ));

  // --- p3 문장들 ---
  s3p3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장이 말하는 핵심 정보는 무엇인가요?";
      choices = [["A","생태계의 자기 조절 능력에는 한계가 있다"],["B","자기 조절 능력은 언제나 완벽하게 작동한다"],["C","외부 변화는 생태계에 아무런 영향을 주지 않는다"],["D","조절 능력이 강한 생태계일수록 종이 적다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "이 문장에 따르면 피라미드 구조가 무너질 수 있는 원인은 무엇인가요?";
      choices = [["A","외래종 유입이나 환경 오염으로 에너지 흐름이 흔들리는 것이다"],["B","생산자가 지나치게 많아져서 경쟁이 심해지는 것이다"],["C","육식 동물이 자발적으로 이동하는 것이다"],["D","먹이 사슬이 단순해지면서 안정화되는 것이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "이 문장에서 최상위 포식자가 사라졌을 때 나타나는 현상은 무엇인가요?";
      choices = [["A","중간 소비자가 폭발적으로 늘어나 생산자를 지나치게 소비한다"],["B","생산자가 사라지고 중간 소비자도 함께 줄어든다"],["C","먹이 사슬이 단축되어 생태계가 안정된다"],["D","최하위 소비자만 남아 새로운 먹이 사슬이 형성된다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "이 문장에서 에너지 흐름의 균형이 깨지면 어떤 결과가 올 수 있나요?";
      choices = [["A","복원에 오랜 시간이 필요하거나 되돌릴 수 없는 상태에 이를 수 있다"],["B","생태계는 자동으로 즉시 원상 복구된다"],["C","에너지 흐름이 반대 방향으로 전환된다"],["D","새로운 최상위 포식자가 자연 발생한다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 문장의 주장으로 가장 적절한 것은 무엇인가요?";
      choices = [["A","먹이 사슬의 각 단계를 고루 보전해야 한다"],["B","한 종만 집중 보호하면 전체 생태계가 회복된다"],["C","인간의 개입 없이 생태계는 저절로 되살아난다"],["D","최상위 포식자만 보호하면 충분하다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  // p3 전체 + 중심내용
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","자기 조절 능력의 한계 때문에 먹이 사슬 전체를 보전해야 한다"],["B","외래종은 항상 생태계에 유익한 역할을 한다"],["C","환경 오염은 생산자에게만 영향을 미친다"],["D","최상위 포식자가 사라져도 생태계는 안정적이다"]],
    "A"
  ));

  // 복기 카드 8장
  const fullText = p1text + "\n" + p2text + "\n" + p3text;
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
  }

  // 확인 문항 6개 (질문형)
  const confirmQs = [
    makeConfirmQ("q1", "생태계에서 에너지를 처음 만들어 내는 존재를 가리키는 말은 무엇인가요?",
      [findRange(paragraphs, "p1", "생산자")]),
    makeConfirmQ("q2", "한 단계에서 다음 단계로 넘어갈 때 전달되는 에너지 비율은 약 얼마인가요?",
      [findRange(paragraphs, "p1", "약 십 퍼센트")]),
    makeConfirmQ("q3", "각 단계의 에너지 총량이 줄어드는 모양을 나타내는 용어는 무엇인가요?",
      [findRange(paragraphs, "p2", "생태 피라미드")]),
    makeConfirmQ("q4", "시간이 지나며 원래 상태에 가깝게 돌아가는 능력을 무엇이라 하나요?",
      [findRange(paragraphs, "p2", "자기 조절 능력")]),
    makeConfirmQ("q5", "토착 생물의 먹이를 빼앗아 생태계를 위협하는 존재는 무엇인가요?",
      [findRange(paragraphs, "p3", "외래종")]),
    makeConfirmQ("q6", "최상위 포식자가 사라지면 폭발적으로 늘어나는 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "중간 소비자")])
  ];

  return makeContent(27, "NONFICTION", "일일 독해(프레게 3) Day 27 비문학",
    paragraphs, timeline, cards, confirmQs);
}

// === Day 28 문학: 소년과 나무 ===
function buildDay28() {
  const p1text = "마을 끝 언덕에 오래된 느티나무 한 그루가 서 있었다. 소년은 학교가 끝나면 늘 그 나무 아래로 달려가 등을 기대고 앉아 하늘을 올려다보았다. 나뭇잎 사이로 쏟아지는 햇살이 얼굴 위에서 춤추면 소년은 눈을 가늘게 뜨고 웃었다. 바람이 불 때마다 잎들이 서로 부딪혀 내는 소리가 누군가 작은 목소리로 이야기를 들려주는 것 같아서, 소년은 그 소리를 가만히 듣기를 좋아했다. 할머니는 이따금 마당에서 소년을 부르며 간식을 내밀었지만, 소년은 손을 흔들어 괜찮다는 뜻을 전하고는 다시 나무를 올려다보았다. 느티나무는 말이 없었지만 소년에게는 세상에서 가장 든든한 친구처럼 느껴졌다.";
  const p2text = "여름이 깊어질수록 느티나무의 잎은 한층 짙어졌고, 그늘도 넓어졌다. 소년은 두꺼운 뿌리 위에 걸터앉아 공책을 꺼내 그림을 그리곤 했다. 나뭇가지를 따라 기어오르는 개미, 줄기에 붙어 울어 대는 매미, 가끔 가지 위로 올라앉는 참새까지 모두 소년의 그림 속으로 들어왔다. 그러던 어느 날, 갑자기 먹구름이 몰려오더니 세찬 비바람이 느티나무를 흔들어 댔다. 소년은 우산도 없이 나무 줄기를 끌어안고 비가 그치기를 기다렸다. 빗줄기가 멈추고 햇살이 다시 나뭇잎을 비추자, 소년은 젖은 옷도 잊은 채 환하게 웃으며 나무에게 말했다. \"우리 같이 버텨 냈어.\"";
  const p3text = "가을이 오자 느티나무의 잎은 노랗게 물들었다. 바람이 한 번 불 때마다 잎사귀 몇 장이 소년의 무릎 위로 살포시 내려앉았다. 소년은 그 잎들을 모아 공책 사이에 끼워 두며, 봄이 되면 다시 초록빛 잎을 볼 수 있으리라 생각했다. 이듬해 봄, 앙상하던 가지마다 연둣빛 새싹이 돋아나는 것을 보고 소년은 달려가 나무를 꼭 안았다. 느티나무는 그때도 말이 없었지만, 두꺼워진 줄기와 더 넓어진 가지는 소년에게 조용한 인사를 건네는 것 같았다. 소년은 어느새 한 뼘 더 자라 있었고, 나무도 또 한 해만큼 단단해져 있었다. 둘은 말없이 함께 계절을 견디며 서로의 성장을 지켜보는 사이가 되어 가고 있었다.";

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

  // p1 문장들
  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에서 소년이 늘 찾아가는 장소는 어디인가요?";
      choices = [["A","마을 끝 언덕의 오래된 느티나무 아래"],["B","학교 운동장 한가운데"],["C","마을 입구의 정자 안"],["D","개울가의 넓은 바위 위"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "이 문장에서 소년이 나무 아래에서 하는 행동은 무엇인가요?";
      choices = [["A","등을 기대고 앉아 하늘을 올려다본다"],["B","책을 펴 놓고 큰 소리로 읽는다"],["C","친구들과 함께 놀이를 한다"],["D","낮잠을 자며 시간을 보낸다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "이 문장에서 소년이 웃는 까닭은 무엇인가요?";
      choices = [["A","나뭇잎 사이로 쏟아지는 햇살이 얼굴 위에서 춤추기 때문이다"],["B","친구들이 재미있는 이야기를 해 주기 때문이다"],["C","할머니가 맛있는 간식을 가져다주기 때문이다"],["D","나무에서 열매가 떨어지기 때문이다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "이 문장에서 소년이 가만히 듣기를 좋아한 것은 무엇인가요?";
      choices = [["A","잎들이 서로 부딪혀 내는 소리"],["B","새들이 노래하는 소리"],["C","할머니가 부르는 소리"],["D","바람이 지붕을 스치는 소리"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 문장에서 소년이 할머니의 간식을 거절한 뒤에 한 행동은 무엇인가요?";
      choices = [["A","손을 흔들고 다시 나무를 올려다보았다"],["B","할머니에게 달려가 간식을 받았다"],["C","집 안으로 들어가 책을 읽었다"],["D","마당에서 할머니와 이야기를 나누었다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 느티나무가 소년에게 어떤 존재로 느껴졌나요?";
      choices = [["A","세상에서 가장 든든한 친구"],["B","무서운 숲속의 거인"],["C","귀찮고 시끄러운 이웃"],["D","쓸모없는 오래된 물건"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","소년은 느티나무 아래에서 편안함을 느끼며 나무를 친구처럼 여긴다"],["B","소년은 학교에서 돌아오면 항상 집에서 쉰다"],["C","할머니는 소년에게 나무에 가지 말라고 한다"],["D","느티나무는 마을 사람들 모두의 놀이터이다"]],
    "A"
  ));

  // p2 문장들
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에서 여름이 깊어지면서 느티나무에 나타난 변화는 무엇인가요?";
      choices = [["A","잎이 짙어지고 그늘이 넓어졌다"],["B","잎이 모두 떨어지고 가지만 남았다"],["C","줄기가 가늘어지고 키가 줄었다"],["D","열매가 맺히고 꽃이 피었다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "이 문장에서 소년이 뿌리 위에 앉아 한 일은 무엇인가요?";
      choices = [["A","공책을 꺼내 그림을 그렸다"],["B","친구에게 편지를 썼다"],["C","숙제를 하며 공부했다"],["D","나무 열매를 따서 모았다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "이 문장에서 소년의 그림 속으로 들어온 것이 아닌 것은 무엇인가요?";
      choices = [["A","나비"],["B","개미"],["C","매미"],["D","참새"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "이 문장에서 갑자기 벌어진 사건은 무엇인가요?";
      choices = [["A","먹구름이 몰려와 세찬 비바람이 느티나무를 흔들었다"],["B","소년이 나무에서 떨어져 다쳤다"],["C","할머니가 달려와 소년을 데려갔다"],["D","벼락이 떨어져 나무가 부러졌다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "비가 올 때 소년이 한 행동은 무엇인가요?";
      choices = [["A","우산도 없이 나무 줄기를 끌어안고 기다렸다"],["B","재빨리 집으로 뛰어 들어갔다"],["C","우산을 펴고 나무 아래 서 있었다"],["D","나무 위로 올라가 비를 피했다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "비가 그친 뒤 소년의 반응으로 알맞은 것은 무엇인가요?";
      choices = [["A","젖은 옷도 잊고 환하게 웃었다"],["B","춥다며 곧바로 집으로 돌아갔다"],["C","나무가 부러졌을까 걱정하며 울었다"],["D","할머니에게 달려가 도움을 요청했다"]];
      answerId = "A";
    } else if (i === 6) {
      prompt = "소년이 나무에게 한 말은 무엇인가요?";
      choices = [["A","우리 같이 버텨 냈어"],["B","이제 그만 집에 갈게"],["C","다음에 또 비가 오면 안 올 거야"],["D","나무야 고마워, 잘 자"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","소년은 여름 동안 나무와 함께 시간을 보내며 비바람도 함께 이겨 낸다"],["B","느티나무는 여름에 모든 잎을 잃고 가을을 맞이한다"],["C","소년은 비가 오면 항상 집으로 돌아간다"],["D","여름에 소년은 나무 대신 개울가에서 놀기를 좋아한다"]],
    "A"
  ));

  // p3 문장들
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에서 가을이 오자 느티나무에 나타난 변화는 무엇인가요?";
      choices = [["A","잎이 노랗게 물들었다"],["B","새로운 가지가 돋아났다"],["C","열매가 주렁주렁 달렸다"],["D","줄기가 하얗게 변했다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "이 문장에서 바람이 불 때 일어난 일은 무엇인가요?";
      choices = [["A","잎사귀가 소년의 무릎 위로 내려앉았다"],["B","나뭇가지가 부러져 떨어졌다"],["C","소년의 모자가 날아갔다"],["D","새들이 놀라서 날아갔다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "소년이 떨어진 잎을 공책 사이에 끼워 둔 까닭은 무엇인가요?";
      choices = [["A","봄이 되면 다시 초록빛 잎을 볼 수 있으리라 생각했기 때문이다"],["B","잎을 팔아 용돈을 벌려고 했기 때문이다"],["C","선생님이 숙제로 낙엽을 모으라고 했기 때문이다"],["D","할머니에게 선물하려고 했기 때문이다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "이듬해 봄에 소년이 한 행동은 무엇인가요?";
      choices = [["A","새싹이 돋아나는 것을 보고 나무를 꼭 안았다"],["B","새싹을 꺾어 화분에 옮겨 심었다"],["C","나무 아래서 친구들과 잔치를 열었다"],["D","가지에 리본을 매어 장식했다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 문장에서 느티나무가 소년에게 인사를 건네는 것 같았던 근거는 무엇인가요?";
      choices = [["A","두꺼워진 줄기와 더 넓어진 가지"],["B","나무에서 나는 달콤한 향기"],["C","바람에 흔들리는 열매 소리"],["D","나뭇잎에 맺힌 아침 이슬"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 드러나는 소년의 변화는 무엇인가요?";
      choices = [["A","한 뼘 더 자라 있었다"],["B","학교를 졸업하고 떠났다"],["C","나무에 대한 관심을 잃었다"],["D","새로운 친구를 사귀었다"]];
      answerId = "A";
    } else if (i === 6) {
      prompt = "이 문장이 전달하는 소년과 나무의 관계는 어떤 것인가요?";
      choices = [["A","말없이 계절을 견디며 서로의 성장을 지켜보는 사이이다"],["B","소년이 나무를 일방적으로 돌보는 관계이다"],["C","나무가 소년에게 말을 걸어 대화하는 사이이다"],["D","소년은 나무를 떠나 새로운 곳으로 이사한다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","소년과 나무는 계절의 변화 속에서 함께 성장해 가고 있다"],["B","가을이 오면 소년은 나무를 더 이상 찾지 않는다"],["C","느티나무는 봄에 꽃을 피우지 못해 시들어 간다"],["D","소년은 겨울 동안 다른 나무를 친구로 삼는다"]],
    "A"
  ));

  // 복기 카드 8장
  const fullText = p1text + "\n" + p2text + "\n" + p3text;
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
  }

  // 확인 문항 6개 (질문형)
  const confirmQs = [
    makeConfirmQ("q1", "소년이 학교가 끝난 뒤 늘 찾아가는 나무의 이름은 무엇인가요?",
      [findRange(paragraphs, "p1", "느티나무")]),
    makeConfirmQ("q2", "소년이 나무 아래에서 듣기를 좋아한 것은 잎들이 만드는 무슨 소리인가요?",
      [findRange(paragraphs, "p1", "부딪혀 내는 소리")]),
    makeConfirmQ("q3", "소년이 뿌리 위에 앉아 공책에 한 일은 무엇인가요?",
      [findRange(paragraphs, "p2", "그림을 그리곤 했다")]),
    makeConfirmQ("q4", "비바람을 함께 견딘 뒤 소년이 나무에게 한 말은 무엇인가요?",
      [findRange(paragraphs, "p2", "우리 같이 버텨 냈어")]),
    makeConfirmQ("q5", "소년이 떨어진 잎을 끼워 둔 곳은 어디인가요?",
      [findRange(paragraphs, "p3", "공책 사이")]),
    makeConfirmQ("q6", "이듬해 봄 가지마다 돋아난 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "연둣빛 새싹")])
  ];

  return makeContent(28, "LITERATURE", "일일 독해(프레게 3) Day 28 문학",
    paragraphs, timeline, cards, confirmQs);
}

// === Day 29 비문학: 빛의 굴절과 렌즈 ===
function buildDay29() {
  const p1text = "빛은 하나의 매질에서 다른 매질로 나아갈 때 진행 방향이 꺾이는데, 이 현상을 굴절이라 한다. 예를 들어 공기 중에서 나아가던 빛이 물속으로 들어가면, 속도가 느려지면서 경계면의 법선 쪽으로 꺾여 들어간다. 반대로 물에서 공기로 나올 때에는 속도가 빨라지며 법선에서 멀어지는 쪽으로 꺾인다. 굴절의 정도는 두 매질의 굴절률 차이에 따라 달라지며, 굴절률이 클수록 빛이 더 많이 꺾인다. 이러한 굴절 원리는 물속에 잠긴 젓가락이 꺾여 보이는 현상이나, 아지랑이처럼 먼 곳의 풍경이 흔들려 보이는 현상을 설명해 준다. 즉, 우리가 일상에서 쉽게 관찰할 수 있는 여러 시각 현상의 바탕에 빛의 굴절이 자리하고 있다.";
  const p2text = "렌즈는 빛의 굴절 원리를 이용하여 빛을 모으거나 퍼뜨리는 투명한 광학 도구이다. 렌즈는 가운데가 두꺼운 볼록 렌즈와 가장자리가 두꺼운 오목 렌즈로 나뉜다. 볼록 렌즈는 평행하게 들어온 빛을 한 점으로 모으는데, 이 점을 초점이라 한다. 초점보다 먼 곳에 놓인 물체의 상은 렌즈 반대쪽에 거꾸로 맺히며, 이를 도립 실상이라 부른다. 반면 오목 렌즈는 빛을 바깥쪽으로 퍼뜨려서, 실제 상이 맺히지 않고 렌즈 같은 쪽에 줄어든 허상이 보이게 한다. 이처럼 렌즈의 모양에 따라 빛의 경로와 상의 특성이 달라지므로, 용도에 맞는 렌즈를 골라 써야 한다.";
  const p3text = "렌즈의 성질은 일상생활의 다양한 도구에 활용된다. 돋보기는 볼록 렌즈를 사용하여 가까운 물체를 크게 확대해 보여 주며, 카메라 렌즈는 여러 장의 볼록 렌즈와 오목 렌즈를 조합하여 선명한 사진을 만들어 낸다. 근시를 교정하는 안경에는 오목 렌즈가, 원시를 교정하는 안경에는 볼록 렌즈가 쓰인다. 망원경은 대물 렌즈로 먼 곳의 빛을 모은 뒤, 접안 렌즈로 상을 확대하여 멀리 있는 물체를 가까이 있는 것처럼 보여 준다. 이처럼 굴절과 렌즈의 원리를 이해하면, 우리 주변에서 빛이 어떻게 쓰이고 있는지를 보다 깊이 파악할 수 있다. 과학 기술이 발전하면서 렌즈는 현미경이나 내시경 같은 정밀 장비에도 널리 쓰이고 있다.";

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

  // p1 문장들
  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에서 설명하는 '굴절'이란 무엇인가요?";
      choices = [["A","빛이 다른 매질로 나아갈 때 진행 방향이 꺾이는 현상이다"],["B","빛이 거울에 부딪혀 되돌아오는 현상이다"],["C","빛이 직진하면서 그림자를 만드는 현상이다"],["D","빛이 장애물 뒤로 돌아가는 현상이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "이 문장에 따르면 빛이 공기에서 물속으로 들어갈 때 어떻게 되나요?";
      choices = [["A","속도가 느려지면서 법선 쪽으로 꺾인다"],["B","속도가 빨라지면서 법선에서 멀어진다"],["C","속도 변화 없이 직진한다"],["D","빛이 완전히 반사되어 돌아온다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "물에서 공기로 나올 때 빛은 어떻게 되나요?";
      choices = [["A","속도가 빨라지며 법선에서 멀어지는 쪽으로 꺾인다"],["B","속도가 느려지며 법선 쪽으로 꺾인다"],["C","방향이 바뀌지 않고 그대로 진행한다"],["D","빛이 사라져 보이지 않게 된다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "이 문장에서 굴절의 정도를 결정하는 요인은 무엇인가요?";
      choices = [["A","두 매질의 굴절률 차이"],["B","빛의 밝기"],["C","매질의 온도"],["D","빛이 지나가는 거리"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 문장에서 굴절 원리로 설명되는 현상이 아닌 것은 무엇인가요?";
      choices = [["A","거울에 얼굴이 비치는 현상"],["B","물속 젓가락이 꺾여 보이는 현상"],["C","아지랑이처럼 풍경이 흔들리는 현상"],["D","두 현상 모두 굴절로 설명된다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장의 핵심 내용은 무엇인가요?";
      choices = [["A","일상의 여러 시각 현상의 바탕에 빛의 굴절이 자리한다"],["B","빛의 굴절은 실험실에서만 관찰된다"],["C","시각 현상은 모두 빛의 반사로 설명된다"],["D","굴절은 일상생활과 관련이 없다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","빛은 매질이 바뀔 때 굴절하며, 이것이 일상의 시각 현상을 설명한다"],["B","빛은 모든 매질에서 같은 속도로 이동한다"],["C","굴절은 오직 물에서만 일어나는 현상이다"],["D","아지랑이는 빛의 반사로 생기는 현상이다"]],
    "A"
  ));

  // p2 문장들
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에서 렌즈의 정의로 알맞은 것은 무엇인가요?";
      choices = [["A","빛의 굴절을 이용하여 빛을 모으거나 퍼뜨리는 투명한 광학 도구이다"],["B","빛을 완전히 차단하는 불투명한 판이다"],["C","소리를 모아 크게 해 주는 장치이다"],["D","전기 에너지를 빛 에너지로 바꾸는 도구이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "이 문장에서 렌즈를 나누는 기준은 무엇인가요?";
      choices = [["A","가운데와 가장자리 중 어디가 더 두꺼운지에 따라 나뉜다"],["B","렌즈의 색깔에 따라 나뉜다"],["C","렌즈의 재질이 유리인지 플라스틱인지에 따라 나뉜다"],["D","크기가 큰지 작은지에 따라 나뉜다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "볼록 렌즈가 빛을 한 점으로 모을 때 그 점을 무엇이라 하나요?";
      choices = [["A","초점"],["B","법선"],["C","꼭짓점"],["D","원점"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "도립 실상이란 어떤 상인가요?";
      choices = [["A","초점보다 먼 곳의 물체가 렌즈 반대쪽에 거꾸로 맺히는 상이다"],["B","렌즈 같은 쪽에 바로 선 채로 보이는 상이다"],["C","허상의 일종으로 실제로 맺히지 않는 상이다"],["D","오목 렌즈에서만 나타나는 상이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "오목 렌즈는 빛을 어떻게 하나요?";
      choices = [["A","바깥쪽으로 퍼뜨려 줄어든 허상이 보이게 한다"],["B","한 점으로 모아 도립 실상을 만든다"],["C","빛을 완전히 차단한다"],["D","빛의 색깔을 바꿔 무지개를 만든다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장의 핵심 내용은 무엇인가요?";
      choices = [["A","렌즈의 모양에 따라 빛의 경로와 상이 달라지므로 용도에 맞게 골라야 한다"],["B","모든 렌즈는 같은 방식으로 빛을 굴절시킨다"],["C","볼록 렌즈와 오목 렌즈는 기능이 동일하다"],["D","렌즈의 두께는 빛의 경로에 영향을 주지 않는다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","렌즈는 볼록과 오목으로 나뉘며, 모양에 따라 빛을 모으거나 퍼뜨린다"],["B","렌즈는 오직 볼록 렌즈 한 종류만 있다"],["C","오목 렌즈는 빛을 한 점으로 모을 수 있다"],["D","렌즈의 모양은 상의 특성에 영향을 미치지 않는다"]],
    "A"
  ));

  // p3 문장들
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장이 말하는 렌즈 성질의 활용 범위는 어디인가요?";
      choices = [["A","일상생활의 다양한 도구에 활용된다"],["B","우주 탐사에만 한정되어 쓰인다"],["C","오직 의학 분야에서만 쓰인다"],["D","렌즈는 아직 실용화되지 않았다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "이 문장에 따르면 카메라 렌즈의 특징은 무엇인가요?";
      choices = [["A","볼록 렌즈와 오목 렌즈를 조합하여 선명한 사진을 만든다"],["B","오직 오목 렌즈 한 장만 사용한다"],["C","렌즈 없이 거울만으로 작동한다"],["D","볼록 렌즈 한 장으로만 사진을 찍는다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "근시 교정 안경에 사용되는 렌즈는 무엇인가요?";
      choices = [["A","오목 렌즈"],["B","볼록 렌즈"],["C","평면 렌즈"],["D","프리즘"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "이 문장에서 망원경이 먼 물체를 가까이 보여 주는 원리는 무엇인가요?";
      choices = [["A","대물 렌즈로 빛을 모은 뒤 접안 렌즈로 상을 확대한다"],["B","빛을 반사시켜 되돌리는 거울만 사용한다"],["C","소리 신호를 빛으로 변환한다"],["D","전자기파를 이용하여 영상을 합성한다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 문장의 핵심 내용은 무엇인가요?";
      choices = [["A","굴절과 렌즈의 원리를 이해하면 빛의 활용을 더 깊이 파악할 수 있다"],["B","렌즈의 원리는 너무 어려워 일반인이 이해할 수 없다"],["C","빛은 일상에서 활용되지 않는다"],["D","굴절 원리는 렌즈와 관계없이 독립적이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 렌즈가 널리 쓰이는 정밀 장비의 예시가 아닌 것은 무엇인가요?";
      choices = [["A","체온계"],["B","현미경"],["C","내시경"],["D","현미경과 내시경 모두 해당된다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","렌즈는 돋보기, 카메라, 안경, 망원경 등 다양한 도구에 활용된다"],["B","렌즈는 돋보기에만 사용된다"],["C","안경에는 렌즈가 사용되지 않는다"],["D","망원경은 렌즈 없이 작동한다"]],
    "A"
  ));

  // 복기 카드 8장
  const fullText = p1text + "\n" + p2text + "\n" + p3text;
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
  }

  // 확인 문항 6개
  const confirmQs = [
    makeConfirmQ("q1", "빛이 다른 매질로 나아갈 때 진행 방향이 꺾이는 현상을 무엇이라 하나요?",
      [findRange(paragraphs, "p1", "굴절")]),
    makeConfirmQ("q2", "굴절의 정도를 결정하는 것은 두 매질의 무엇 차이인가요?",
      [findRange(paragraphs, "p1", "굴절률")]),
    makeConfirmQ("q3", "볼록 렌즈가 평행한 빛을 모으는 한 점을 무엇이라 하나요?",
      [findRange(paragraphs, "p2", "초점")]),
    makeConfirmQ("q4", "오목 렌즈에서 보이는, 실제로 맺히지 않는 상을 무엇이라 하나요?",
      [findRange(paragraphs, "p2", "허상")]),
    makeConfirmQ("q5", "근시를 교정하는 안경에 쓰이는 렌즈 종류는 무엇인가요?",
      [findRange(paragraphs, "p3", "오목 렌즈")]),
    makeConfirmQ("q6", "망원경에서 먼 곳의 빛을 모으는 렌즈를 무엇이라 하나요?",
      [findRange(paragraphs, "p3", "대물 렌즈")])
  ];

  return makeContent(29, "NONFICTION", "일일 독해(프레게 3) Day 29 비문학",
    paragraphs, timeline, cards, confirmQs);
}

// === Day 30 문학: 할아버지의 시계 ===
function buildDay30() {
  const p1text = "거실 한쪽 벽에 오래된 괘종시계가 걸려 있었다. 나무 틀에 금빛 추가 달린 그 시계는 할아버지가 젊은 시절에 처음 월급을 타서 직접 골라 사 온 것이라 했다. 매일 저녁 여덟 시가 되면 시계는 느릿느릿 여덟 번 종을 울렸고, 그 소리는 집 안 구석구석까지 낮게 퍼져 나갔다. 할아버지는 그 종소리가 울릴 때마다 하던 일을 멈추고 시계를 바라보며 고개를 살짝 끄덕이곤 했다. 어린 나는 그 모습이 무척 궁금하여 시계가 왜 그렇게 소중하냐고 여쭤본 적이 있다. 할아버지는 잠시 웃더니, 이 시계는 할아버지의 젊은 날을 기억해 주는 유일한 친구라고 조용히 대답하셨다.";
  const p2text = "할아버지가 돌아가시고 몇 달이 지나자, 괘종시계의 추가 조용히 멈추어 버렸다. 아버지는 시계를 고치러 동네 수리점에 가져갔지만, 오래된 부품을 구하기가 매우 어렵다는 말만 듣고 돌아왔다. 시계가 멈춘 거실은 이상하리만큼 고요했고, 나는 그제야 종소리가 집 안에 생기를 불어넣어 주었다는 것을 비로소 깨달았다. 한동안 거실에 들어갈 때마다 벽을 올려다보며 저절로 종소리를 떠올리곤 했다. 어머니는 시계를 치우자고 했지만, 아버지는 고개를 저으며 그 자리에 그대로 두자고 하셨다. 아버지의 눈에는 할아버지를 그리워하는 마음이 고스란히 담겨 있었다.";
  const p3text = "몇 해가 흐른 뒤, 나는 인터넷을 뒤져 오래된 시계 부품을 전문적으로 다루는 장인을 겨우 찾아냈다. 장인은 먼지가 가득 낀 시계를 조심스럽게 분해하고, 녹슨 톱니바퀴를 하나하나 정성껏 닦아 새 기름을 발랐다. 수리가 끝나고 추를 다시 흔들자, 시계는 예전처럼 또각또각 소리를 내기 시작했다. 그날 저녁 여덟 시, 오랫동안 잠들어 있던 종이 다시 여덟 번 울렸을 때, 아버지는 소파에 앉은 채 한참 동안 말이 없으셨다. 나는 아버지의 눈가에 번지는 얇은 눈물을 보았지만, 모른 척 옆에 앉아 함께 종소리를 들었다. 할아버지의 시계는 다시 움직이기 시작했고, 그 소리 속에는 할아버지의 웃음과 따뜻한 저녁 식탁의 기억이 살아 숨 쉬는 듯했다.";

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

  // p1
  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에서 묘사되는 물건은 무엇인가요?";
      choices = [["A","거실 벽에 걸린 오래된 괘종시계"],["B","안방에 놓인 탁상시계"],["C","부엌 선반 위의 알람시계"],["D","마당 한가운데 세워진 해시계"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "할아버지가 이 시계를 구입한 계기는 무엇인가요?";
      choices = [["A","젊은 시절 처음 월급을 받고 사 온 것이다"],["B","결혼 기념일에 선물로 받은 것이다"],["C","외국 여행 중에 우연히 발견한 것이다"],["D","이웃에게 빌려 쓰다가 물려받은 것이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "매일 저녁 여덟 시에 시계가 하는 일은 무엇인가요?";
      choices = [["A","느릿느릿 여덟 번 종을 울린다"],["B","빠르게 열두 번 종을 친다"],["C","조용히 불빛을 깜빡인다"],["D","음악을 틀어 알림을 준다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "종소리가 울릴 때 할아버지의 행동은 무엇인가요?";
      choices = [["A","하던 일을 멈추고 시계를 바라보며 고개를 끄덕인다"],["B","시계의 볼륨을 줄이고 텔레비전을 켠다"],["C","곧바로 자리에 누워 잠을 잔다"],["D","시계를 등지고 창밖을 내다본다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "어린 '나'가 궁금했던 것은 무엇인가요?";
      choices = [["A","시계가 왜 그렇게 소중한지"],["B","시계가 왜 종을 치지 않는지"],["C","할아버지가 왜 시계를 팔지 않는지"],["D","시계가 언제 만들어졌는지"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "할아버지가 시계를 소중히 여기는 까닭은 무엇인가요?";
      choices = [["A","젊은 날을 기억해 주는 유일한 친구이기 때문이다"],["B","아주 비싼 골동품이기 때문이다"],["C","외국에서 가져온 희귀한 물건이기 때문이다"],["D","시계가 행운을 가져다준다고 믿기 때문이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","할아버지에게 괘종시계는 젊은 날의 추억을 간직한 소중한 존재이다"],["B","소년은 시계의 종소리가 시끄러워 싫어한다"],["C","할아버지는 매일 시계를 수리하며 시간을 보낸다"],["D","괘종시계는 최근에 새로 구입한 것이다"]],
    "A"
  ));

  // p2
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "할아버지가 돌아가신 뒤 몇 달이 지나자 어떤 일이 일어났나요?";
      choices = [["A","괘종시계의 추가 멈추어 버렸다"],["B","시계가 저절로 벽에서 떨어졌다"],["C","시계의 종소리가 두 배로 커졌다"],["D","시계의 유리가 깨져 버렸다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "아버지가 수리점에서 돌아온 까닭은 무엇인가요?";
      choices = [["A","오래된 부품을 구하기 어렵다는 말을 들었기 때문이다"],["B","수리 비용이 너무 비쌌기 때문이다"],["C","시계가 이미 수리가 완료되었기 때문이다"],["D","수리점이 문을 닫았기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "시계가 멈춘 뒤 거실의 분위기는 어떠했나요?";
      choices = [["A","이상하리만큼 고요했다"],["B","전보다 더 활기차졌다"],["C","음악 소리로 가득 찼다"],["D","가족들의 웃음소리가 넘쳤다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "'나'가 그제야 깨달은 것은 무엇인가요?";
      choices = [["A","종소리가 집 안에 생기를 불어넣어 주었다는 것이다"],["B","시계는 단지 시간을 알려 주는 도구일 뿐이라는 것이다"],["C","거실에 시계가 없어도 아무 차이가 없다는 것이다"],["D","할아버지가 시계를 싫어했다는 것이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "어머니가 한 제안은 무엇인가요?";
      choices = [["A","시계를 치우자고 했다"],["B","시계를 다른 방으로 옮기자고 했다"],["C","새 시계를 사자고 했다"],["D","시계를 박물관에 기증하자고 했다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "아버지의 눈에 담겨 있던 것은 무엇인가요?";
      choices = [["A","할아버지를 그리워하는 마음"],["B","시계를 빨리 고치고 싶은 조급함"],["C","어머니의 제안에 대한 화남"],["D","새로운 시계를 사고 싶은 기대"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","시계가 멈추자 가족은 종소리의 소중함과 할아버지에 대한 그리움을 느낀다"],["B","시계가 멈추어도 가족의 일상에는 아무 변화가 없다"],["C","아버지는 시계를 즉시 버리기로 결심한다"],["D","어머니가 시계를 직접 수리하여 다시 작동시킨다"]],
    "A"
  ));

  // p3
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "'나'가 인터넷을 뒤져 찾아낸 것은 무엇인가요?";
      choices = [["A","오래된 시계 부품을 다루는 장인"],["B","괘종시계를 비싸게 사 줄 수집가"],["C","새 괘종시계를 파는 온라인 상점"],["D","시계 역사를 소개하는 블로그"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "장인이 시계를 수리한 방법으로 옳은 것은 무엇인가요?";
      choices = [["A","분해한 뒤 녹슨 톱니바퀴를 닦고 새 기름을 발랐다"],["B","시계를 통째로 새것으로 교체했다"],["C","추만 새것으로 바꾸고 나머지는 그대로 두었다"],["D","시계를 물에 담가 녹을 제거했다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "수리가 끝난 뒤 시계가 낸 소리는 무엇인가요?";
      choices = [["A","예전처럼 또각또각 소리를 냈다"],["B","이전과 전혀 다른 전자음이 났다"],["C","소리 없이 조용히 움직였다"],["D","종소리 대신 음악을 틀었다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "그날 저녁 여덟 시에 일어난 일은 무엇인가요?";
      choices = [["A","오랫동안 잠들어 있던 종이 다시 여덟 번 울렸다"],["B","시계가 다시 멈추어 버렸다"],["C","아버지가 시계를 벽에서 내렸다"],["D","가족 모두가 외출하여 종소리를 듣지 못했다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "종소리를 들은 아버지의 반응은 어떠했나요?";
      choices = [["A","소파에 앉은 채 한참 동안 말이 없으셨다"],["B","기뻐하며 큰 소리로 웃으셨다"],["C","시계를 향해 걸어가 추를 멈추셨다"],["D","곧바로 방으로 들어가 주무셨다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "'나'가 아버지의 눈가에서 본 것은 무엇인가요?";
      choices = [["A","얇은 눈물"],["B","분노의 표정"],["C","졸린 듯한 눈"],["D","기쁜 미소"]];
      answerId = "A";
    } else if (i === 6) {
      prompt = "다시 움직이기 시작한 시계의 소리 속에 담긴 것은 무엇인가요?";
      choices = [["A","할아버지의 웃음과 따뜻한 저녁 식탁의 기억"],["B","새로운 가족 구성원의 목소리"],["C","이웃 마을에서 들려오는 노랫소리"],["D","시계 장인이 남긴 인사말"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","시계가 다시 움직이면서 할아버지에 대한 기억이 되살아난다"],["B","장인은 시계를 수리하지 못하고 돌려보냈다"],["C","아버지는 시계의 종소리를 듣고 화를 냈다"],["D","나는 시계를 팔아 새것을 구입하기로 했다"]],
    "A"
  ));

  // 복기 카드 8장
  const fullText = p1text + "\n" + p2text + "\n" + p3text;
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
  }

  // 확인 문항 6개
  const confirmQs = [
    makeConfirmQ("q1", "할아버지가 처음 월급을 받고 사 온 물건은 무엇인가요?",
      [findRange(paragraphs, "p1", "괘종시계")]),
    makeConfirmQ("q2", "할아버지는 시계를 무엇이라고 표현하셨나요?",
      [findRange(paragraphs, "p1", "유일한 친구")]),
    makeConfirmQ("q3", "아버지가 시계를 고치지 못하고 돌아온 곳은 어디인가요?",
      [findRange(paragraphs, "p2", "수리점")]),
    makeConfirmQ("q4", "시계가 멈춘 뒤 '나'가 깨달은 것은 종소리가 집 안에 무엇을 불어넣어 주었다는 것인가요?",
      [findRange(paragraphs, "p2", "생기")]),
    makeConfirmQ("q5", "장인이 시계를 수리할 때 닦아 낸 부품은 무엇인가요?",
      [findRange(paragraphs, "p3", "톱니바퀴")]),
    makeConfirmQ("q6", "'나'가 아버지의 눈가에서 본 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "눈물")])
  ];

  return makeContent(30, "LITERATURE", "일일 독해(프레게 3) Day 30 문학",
    paragraphs, timeline, cards, confirmQs);
}

// === 메인 실행 ===
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const batchPath = path.join(ROOT, 'generated', 'daily-batch-reading-frege3.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'frege3');

  // 배치 파일 읽기
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

  // Day 27~30 콘텐츠 빌드
  const days = [
    { dayIndex: 27, builder: buildDay27 },
    { dayIndex: 28, builder: buildDay28 },
    { dayIndex: 29, builder: buildDay29 },
    { dayIndex: 30, builder: buildDay30 }
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
    const batchItem = makeBatchItem(dayIndex, subArea, content);
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
