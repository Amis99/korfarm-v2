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

// === Day 51 비문학: 꿀벌의 의사소통 방법과 8자 춤 ===
function buildDay51() {
  const p1text = "꿀벌은 집단생활을 하는 대표적인 사회성 곤충으로, 벌집 안에서 여왕벌, 일벌, 수벌이 각각 맡은 역할을 충실히 수행하며 살아간다. 수만 마리의 일벌은 꽃가루와 꿀을 모으기 위해 하루에도 수십 차례 벌집을 드나들며, 좋은 먹이를 발견하면 동료에게 그 장소를 정확히 알려 주어야 한다. 그런데 꿀벌은 인간처럼 말이나 글을 사용할 수 없기 때문에, 몸짓이라는 독특한 방법으로 정보를 전달한다. 이 몸짓을 벌의 춤이라고 부르며, 특히 먹이가 먼 곳에 있을 때 추는 '8자 춤'이 가장 잘 알려져 있다. 먹이가 비교적 가까운 곳에 있으면 원을 그리며 도는 '원형 춤'을 추기도 한다.";
  const p2text = "8자 춤은 꿀벌이 벌집의 수직 벌집판 위에서 숫자 8을 그리듯 반복적으로 움직이는 행동이다. 이 춤의 핵심은 가운데 직선 구간에 있는데, 벌은 이 구간을 지나며 배를 좌우로 활발하게 흔들어 진동을 만든다. 직선 구간의 방향은 태양과 먹이가 이루는 각도를 나타내며, 벌집판에서 위쪽을 태양 방향으로 삼는다. 예를 들어 직선 구간이 오른쪽으로 삼십 도 기울어져 있으면, 먹이는 태양 오른쪽 삼십 도 방향에 있다는 뜻이다. 또한 직선 구간을 지나는 시간이 길수록 먹이까지의 거리가 멀다는 것을 의미한다. 이처럼 8자 춤은 방향과 거리라는 두 가지 정보를 동시에 담고 있어서, 동료 벌들은 춤을 주의 깊게 관찰한 뒤 곧바로 정확한 장소로 날아갈 수 있다.";
  const p3text = "꿀벌의 춤 언어를 처음 체계적으로 연구한 사람은 오스트리아의 동물학자 카를 폰 프리슈이다. 그는 수십 년에 걸친 관찰과 실험을 통해 꿀벌이 춤으로 의사소통한다는 사실을 과학적으로 증명하였고, 이 업적으로 노벨 생리의학상을 받았다. 이후 연구자들은 꿀벌이 춤 외에도 페로몬이라는 화학 물질을 분비하여 위험을 알리거나 동료를 모으기도 한다는 것을 밝혀냈다. 이러한 발견은 곤충의 지능이 예상보다 훨씬 정교하다는 것을 보여 주었으며, 오늘날에는 꿀벌의 의사소통 원리를 드론 기술이나 로봇 공학에 응용하려는 연구도 세계 여러 나라에서 활발히 진행되고 있다.";

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

  // --- p1 문장들 ---
  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에서 꿀벌이 속하는 곤충 유형은 무엇인가요?";
      choices = [["A","집단생활을 하는 사회성 곤충"],["B","혼자 생활하는 단독성 곤충"],["C","물속에 사는 수서 곤충"],["D","야행성 비행 곤충"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "이 문장에 따르면 일벌이 동료에게 알려야 하는 정보는 무엇인가요?";
      choices = [["A","먹이가 있는 장소"],["B","벌집의 온도"],["C","여왕벌의 위치"],["D","비가 올 시간"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "꿀벌이 정보를 전달하기 위해 사용하는 방법은 무엇인가요?";
      choices = [["A","몸짓이라는 독특한 방법"],["B","소리를 내어 노래하는 방법"],["C","냄새만으로 알려 주는 방법"],["D","더듬이를 접촉하는 방법만 사용"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "먹이가 먼 곳에 있을 때 꿀벌이 추는 춤은 무엇인가요?";
      choices = [["A","8자 춤"],["B","원형 춤"],["C","직선 춤"],["D","나선형 춤"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "먹이가 비교적 가까이 있을 때 꿀벌이 추는 춤은 무엇인가요?";
      choices = [["A","원을 그리며 도는 원형 춤"],["B","8자를 그리는 8자 춤"],["C","직선으로 왕복하는 직선 춤"],["D","삼각형을 그리는 삼각 춤"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","꿀벌은 사회성 곤충으로, 몸짓인 춤을 통해 먹이 정보를 전달한다"],["B","꿀벌은 혼자 먹이를 구해 벌집으로 돌아온다"],["C","여왕벌이 직접 먹이를 찾아 나선다"],["D","꿀벌은 소리로 의사소통한다"]],
    "A"
  ));

  // --- p2 문장들 ---
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "8자 춤에서 꿀벌이 그리는 모양은 무엇인가요?";
      choices = [["A","숫자 8을 그리듯 반복적으로 움직인다"],["B","원을 한 바퀴 돈다"],["C","직선으로 왕복한다"],["D","삼각형 모양으로 이동한다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "8자 춤의 핵심은 어디에 있나요?";
      choices = [["A","가운데 직선 구간에서 배를 좌우로 흔드는 것이다"],["B","양쪽 원형 부분에서 회전하는 것이다"],["C","춤의 시작 지점에서 멈추는 것이다"],["D","춤의 속도를 점점 빠르게 하는 것이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "직선 구간의 방향이 나타내는 정보는 무엇인가요?";
      choices = [["A","태양과 먹이가 이루는 각도"],["B","벌집에서 꽃밭까지의 거리"],["C","먹이의 양이 얼마나 많은지"],["D","바람이 부는 방향"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "직선 구간이 오른쪽으로 삼십 도 기울어져 있으면 먹이는 어디에 있나요?";
      choices = [["A","태양 오른쪽 삼십 도 방향에 있다"],["B","태양 왼쪽 삼십 도 방향에 있다"],["C","태양 바로 아래에 있다"],["D","벌집 바로 뒤편에 있다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "직선 구간을 지나는 시간이 길수록 의미하는 것은 무엇인가요?";
      choices = [["A","먹이까지의 거리가 멀다"],["B","먹이의 양이 적다"],["C","먹이의 맛이 좋다"],["D","먹이가 가까이 있다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장의 핵심 내용은 무엇인가요?";
      choices = [["A","8자 춤은 방향과 거리 두 가지 정보를 동시에 담고 있다"],["B","꿀벌은 춤을 추지 않아도 먹이를 찾을 수 있다"],["C","8자 춤은 거리 정보만 전달한다"],["D","동료 벌은 춤을 보지 않고 냄새로만 이동한다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","8자 춤의 직선 구간은 방향과 거리를 동시에 나타내어 먹이 위치를 알려 준다"],["B","8자 춤은 벌집 바깥에서만 추는 춤이다"],["C","꿀벌은 소리로 먹이 위치를 알린다"],["D","8자 춤은 오직 거리 정보만 담고 있다"]],
    "A"
  ));

  // --- p3 문장들 ---
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "꿀벌의 춤 언어를 처음 체계적으로 연구한 사람은 누구인가요?";
      choices = [["A","오스트리아의 동물학자 카를 폰 프리슈"],["B","영국의 생물학자 찰스 다윈"],["C","프랑스의 곤충학자 장앙리 파브르"],["D","독일의 물리학자 알베르트 아인슈타인"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "카를 폰 프리슈가 받은 상은 무엇인가요?";
      choices = [["A","노벨 생리의학상"],["B","노벨 물리학상"],["C","노벨 화학상"],["D","노벨 문학상"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "꿀벌이 춤 외에 의사소통에 사용하는 수단은 무엇인가요?";
      choices = [["A","페로몬이라는 화학 물질"],["B","초음파 신호"],["C","날개의 색깔 변화"],["D","더듬이 접촉만 사용"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "이러한 연구 결과가 보여 주는 것은 무엇인가요?";
      choices = [["A","곤충의 지능이 예상보다 훨씬 정교하다는 것이다"],["B","곤충은 지능이 전혀 없다는 것이다"],["C","꿀벌만 유일하게 춤을 출 수 있다는 것이다"],["D","곤충의 행동은 모두 본능에 불과하다는 것이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","카를 폰 프리슈의 연구로 꿀벌의 춤 언어가 밝혀졌고 현대 기술에도 응용되고 있다"],["B","꿀벌의 춤은 아직 과학적으로 증명되지 않았다"],["C","페로몬은 꿀벌에게 아무런 역할을 하지 않는다"],["D","꿀벌의 의사소통 연구는 중단되었다"]],
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
    makeConfirmQ("q1", "꿀벌 사회에서 꿀과 꽃가루를 모으는 역할을 하는 벌은 무엇인가요?",
      [findRange(paragraphs, "p1", "일벌")]),
    makeConfirmQ("q2", "먹이가 먼 곳에 있을 때 꿀벌이 추는 춤의 이름은 무엇인가요?",
      [findRange(paragraphs, "p1", "8자 춤")]),
    makeConfirmQ("q3", "8자 춤에서 먹이의 방향을 알려 주는 부분은 어디인가요?",
      [findRange(paragraphs, "p2", "직선 구간")]),
    makeConfirmQ("q4", "직선 구간을 지나는 시간이 길수록 의미하는 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "거리가 멀다")]),
    makeConfirmQ("q5", "꿀벌의 춤 언어를 처음 체계적으로 연구한 학자는 누구인가요?",
      [findRange(paragraphs, "p3", "카를 폰 프리슈")]),
    makeConfirmQ("q6", "꿀벌이 위험을 알리거나 동료를 모을 때 분비하는 화학 물질은 무엇인가요?",
      [findRange(paragraphs, "p3", "페로몬")])
  ];

  return makeContent(51, "NONFICTION", "일일 독해(프레게 3) Day 51 비문학",
    paragraphs, timeline, cards, confirmQs);
}

// === Day 52 문학: 피노키오의 성장 ===
function buildDay52() {
  const p1text = "옛날 어느 작은 마을에 제페토라는 이름의 나이 든 목수가 홀로 살고 있었다. 그는 평생 혼자 지내며 나무를 깎아 장난감을 만드는 일로 하루를 보냈다. 어느 날 제페토는 통나무 한 토막으로 소년 모양의 인형을 만들기 시작했다. 코를 깎고, 눈을 그리고, 입을 새기자 인형이 갑자기 눈을 깜박이며 움직였다. 제페토는 놀라면서도 기뻐하며 인형을 꼭 안아 주고 피노키오라는 이름을 지어 주었다. 그날부터 제페토는 피노키오를 자기 아들처럼 여기며 낡은 외투를 팔아 교과서를 사 주었다.";
  const p2text = "피노키오는 학교에 가는 대신 거리를 헤매며 온갖 유혹에 빠져들었다. 인형극단에 끌려가 무대에 서기도 하고, 여우와 고양이에게 속아 금화를 잃기도 했다. 거짓말을 할 때마다 코가 길게 늘어나는 벌을 받았지만 같은 실수를 되풀이했다. 놀이의 나라로 떠났다가 당나귀로 변하는 끔찍한 일을 겪은 뒤에야 잘못을 깊이 뉘우쳤다. 제페토를 찾아 바다로 나간 피노키오는 거대한 상어에게 삼켜졌는데, 상어 배 속에서 뜻밖에도 자신을 찾아 헤매다 같은 상어에게 삼켜진 제페토를 만났다. 피노키오는 지혜를 짜내어 제페토와 함께 상어의 입을 빠져나왔고, 지친 제페토를 업고 밤새 헤엄쳐 해안에 도착했다.";
  const p3text = "해안에 도착한 뒤 피노키오는 매일 일을 하여 아픈 제페토를 정성껏 돌보았고, 이웃을 도울 때에도 아낌없이 손을 내밀었다. 마침내 요정이 나타나 진심으로 착한 아이가 된 피노키오를 진짜 소년으로 바꾸어 주었고, 피노키오는 기쁨의 눈물을 흘리며 제페토를 안았다. 이 이야기는 외모가 아니라 마음이 사람을 진짜로 만든다는 교훈을 전한다. 처음에 나무 인형에 불과했던 피노키오는 잘못을 뉘우치고 다른 사람을 위해 희생하면서 비로소 진정한 사람이 되었다. 또한 유혹에 넘어가더라도 진심으로 뉘우치면 바른길로 돌아갈 수 있다는 희망의 메시지를 담고 있다. 제페토의 한결같은 사랑과 피노키오의 성장은 가족의 소중함과 책임감이 무엇인지를 깊이 생각하게 해 준다.";

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
      prompt = "이 문장에서 제페토의 직업은 무엇인가요?";
      choices = [["A","나무를 깎아 장난감을 만드는 목수"],["B","빵을 굽는 제빵사"],["C","옷을 짓는 재봉사"],["D","그림을 그리는 화가"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "제페토가 평생 어떻게 지내왔는지 알맞은 것은 무엇인가요?";
      choices = [["A","혼자 지내며 장난감을 만들었다"],["B","가족과 함께 농사를 지었다"],["C","친구들과 여행을 다녔다"],["D","마을 학교에서 아이들을 가르쳤다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "제페토가 인형을 만들기 시작한 재료는 무엇인가요?";
      choices = [["A","통나무 한 토막"],["B","숲에서 주운 돌멩이"],["C","이웃에게 빌린 천 조각"],["D","강가에서 건진 쇠 막대"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "인형이 움직이기 시작한 시점은 언제인가요?";
      choices = [["A","코, 눈, 입을 만들자 갑자기 눈을 깜박이며 움직였다"],["B","제페토가 주문을 외우자 움직였다"],["C","요정이 마법을 걸어 주었을 때 움직였다"],["D","다음 날 아침에 저절로 깨어났다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "제페토가 인형에게 지어 준 이름은 무엇인가요?";
      choices = [["A","피노키오"],["B","게페토"],["C","마르코"],["D","안토니오"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "제페토가 교과서를 사기 위해 한 일은 무엇인가요?";
      choices = [["A","낡은 외투를 팔았다"],["B","장난감을 팔았다"],["C","이웃에게 돈을 빌렸다"],["D","시장에서 일을 했다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","목수 제페토가 통나무로 피노키오를 만들고 아들처럼 돌보기 시작한다"],["B","피노키오는 태어나자마자 학교에 갔다"],["C","제페토는 피노키오를 팔아 돈을 벌었다"],["D","마을 사람들이 함께 인형을 만들었다"]],
    "A"
  ));

  // p2 문장들
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "피노키오가 학교 대신 한 일은 무엇인가요?";
      choices = [["A","거리를 헤매며 유혹에 빠져들었다"],["B","집에서 책을 읽으며 공부했다"],["C","친구들과 함께 놀이터에서 놀았다"],["D","제페토의 가게에서 장난감을 만들었다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "피노키오를 속인 인물들은 누구인가요?";
      choices = [["A","여우와 고양이"],["B","마을의 선생님과 경찰관"],["C","인형극단의 관객들"],["D","바다 위의 선원들"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "피노키오가 거짓말을 하면 어떤 벌을 받았나요?";
      choices = [["A","코가 길게 늘어났다"],["B","손이 나무로 변했다"],["C","발이 땅에 붙었다"],["D","목소리가 사라졌다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "놀이의 나라에서 피노키오에게 일어난 일은 무엇인가요?";
      choices = [["A","당나귀로 변하는 끔찍한 일을 겪었다"],["B","왕으로 뽑혀 궁전에 살게 되었다"],["C","마법 지팡이를 얻어 힘이 세졌다"],["D","날개가 생겨 하늘을 날았다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "상어 배 속에서 피노키오가 뜻밖에 만난 사람은 누구인가요?";
      choices = [["A","제페토"],["B","요정"],["C","여우"],["D","마을 이장"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "피노키오가 제페토와 해안에 도착한 방법은 무엇인가요?";
      choices = [["A","지친 제페토를 업고 밤새 헤엄쳤다"],["B","배를 타고 해안에 도착했다"],["C","요정이 마법으로 옮겨 주었다"],["D","다른 물고기가 데려다 주었다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","유혹에 빠져 고난을 겪은 피노키오가 상어 속에서 제페토를 구출한다"],["B","피노키오는 학교에서 우등생이 되었다"],["C","여우와 고양이가 피노키오를 도와주었다"],["D","놀이의 나라에서 피노키오는 행복하게 살았다"]],
    "A"
  ));

  // p3 문장들
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "해안 도착 뒤 피노키오가 한 일은 무엇인가요?";
      choices = [["A","매일 일을 하며 아픈 제페토를 정성껏 돌보았다"],["B","다시 놀이의 나라로 떠났다"],["C","마을을 떠나 혼자 살기 시작했다"],["D","인형극단에 다시 들어갔다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "요정이 피노키오에게 해 준 일은 무엇인가요?";
      choices = [["A","진짜 소년으로 바꾸어 주었다"],["B","마법 지팡이를 선물했다"],["C","다른 나라로 보내 주었다"],["D","다시 나무 인형으로 되돌렸다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "이 이야기가 전하는 교훈은 무엇인가요?";
      choices = [["A","외모가 아니라 마음이 사람을 진짜로 만든다"],["B","외모가 가장 중요하다"],["C","나무 인형은 절대 사람이 될 수 없다"],["D","모험을 많이 하면 행복해진다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "피노키오가 진정한 사람이 될 수 있었던 까닭은 무엇인가요?";
      choices = [["A","잘못을 뉘우치고 다른 사람을 위해 희생했기 때문이다"],["B","요정에게 비싼 선물을 바쳤기 때문이다"],["C","거짓말을 계속했기 때문이다"],["D","놀이의 나라에서 돌아왔기 때문이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 이야기에 담긴 희망의 메시지는 무엇인가요?";
      choices = [["A","진심으로 뉘우치면 바른길로 돌아갈 수 있다는 것이다"],["B","한 번 잘못하면 돌이킬 수 없다는 것이다"],["C","유혹을 한 번도 받지 않아야 한다는 것이다"],["D","실수를 숨기면 문제가 사라진다는 것이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장이 강조하는 가치는 무엇인가요?";
      choices = [["A","가족의 소중함과 책임감"],["B","돈과 재물의 중요성"],["C","혼자 사는 것의 자유로움"],["D","모험심과 용기만이 필요하다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","피노키오는 헌신적으로 제페토를 돌보며 진짜 소년이 되었고 이야기는 마음의 성장을 강조한다"],["B","피노키오는 결국 나무 인형으로 남았다"],["C","제페토는 피노키오를 포기했다"],["D","이 이야기에는 특별한 교훈이 없다"]],
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
    makeConfirmQ("q1", "인형을 만든 목수의 이름은 무엇인가요?",
      [findRange(paragraphs, "p1", "제페토")]),
    makeConfirmQ("q2", "피노키오가 거짓말을 하면 길어지는 신체 부위는 어디인가요?",
      [findRange(paragraphs, "p2", "코가 길게 늘어나는")]),
    makeConfirmQ("q3", "놀이의 나라에서 피노키오가 변한 동물은 무엇인가요?",
      [findRange(paragraphs, "p2", "당나귀")]),
    makeConfirmQ("q4", "바다에서 피노키오와 제페토를 삼킨 동물은 무엇인가요?",
      [findRange(paragraphs, "p2", "상어")]),
    makeConfirmQ("q5", "요정이 피노키오를 바꿔 준 모습은 무엇인가요?",
      [findRange(paragraphs, "p3", "진짜 소년")]),
    makeConfirmQ("q6", "이 이야기가 전하는 핵심 교훈에서, 사람을 진짜로 만드는 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "마음")])
  ];

  return makeContent(52, "LITERATURE", "일일 독해(프레게 3) Day 52 문학",
    paragraphs, timeline, cards, confirmQs);
}

// === Day 53 비문학: 화산과 지진이 일어나는 원리 ===
function buildDay53() {
  const p1text = "지구의 표면은 하나로 이어진 딱딱한 껍질이 아니라, 여러 개의 커다란 판으로 나뉘어 있다. 이 판을 지각판이라 부르며, 판들은 그 아래에 있는 뜨거운 맨틀 위에 떠 있는 상태로 매우 느리게 움직인다. 맨틀은 높은 온도와 압력 때문에 천천히 흐르는 성질을 가지고 있어서, 이 흐름이 위의 지각판을 밀거나 끌어당기는 힘으로 작용한다. 지각판들이 서로 만나거나 멀어지거나 엇갈리는 곳을 판의 경계라 하며, 이 경계에서 화산과 지진이 집중적으로 발생한다. 태평양을 둘러싼 지역에 화산과 지진이 유독 많은 것은 이 일대에 여러 판의 경계가 모여 있기 때문으로, 이 지역을 불의 고리라고 부른다.";
  const p2text = "화산은 지각판이 충돌하거나 벌어지는 경계에서 지하의 마그마가 지표로 분출하는 현상이다. 두 판이 부딪히면 무거운 판이 가벼운 판 아래로 가라앉는데, 이때 높은 열과 압력으로 암석이 녹아 마그마가 만들어진다. 마그마는 주변 암석보다 가벼워 틈을 따라 위로 올라오고, 지표에 도달하면 용암, 화산재, 화산 가스를 내뿜으며 폭발한다. 화산이 분출하면 주변 지역에 큰 피해를 줄 수 있지만, 반대로 화산재가 쌓여 만들어진 토양은 영양분이 풍부하여 농사에 유리하다. 또한 지열을 이용한 발전으로 깨끗한 에너지를 얻을 수 있어, 화산은 파괴와 혜택이라는 두 가지 얼굴을 함께 지니고 있다.";
  const p3text = "지진은 지각판이 서로 밀거나 어긋나면서 쌓인 힘이 한꺼번에 풀릴 때 발생하는 땅의 흔들림이다. 판의 경계에서 암석이 오랫동안 힘을 받아 변형되다가 한계에 이르면 갑자기 부러지거나 미끄러지며 강한 진동이 사방으로 퍼져 나간다. 이 진동의 세기를 나타내는 단위로 규모를 사용하며, 규모가 일 증가하면 에너지는 약 서른두 배 커진다. 지진이 바다 밑에서 일어나면 해저 지형이 급격히 변하면서 거대한 파도인 지진 해일, 즉 쓰나미가 발생할 수 있다. 지진을 미리 막을 수는 없지만, 건물의 내진 설계를 강화하고 대피 훈련을 반복하면 피해를 크게 줄일 수 있다. 평소에 지진 대비 요령을 익혀 두는 것이 무엇보다 중요하다.";

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
      prompt = "이 문장에서 지구 표면의 특징으로 올바른 것은 무엇인가요?";
      choices = [["A","여러 개의 커다란 판으로 나뉘어 있다"],["B","하나의 단단한 껍질로 이루어져 있다"],["C","물로 가득 차 있다"],["D","우주의 먼지로 덮여 있다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "지각판이 떠 있는 곳은 어디인가요?";
      choices = [["A","뜨거운 맨틀 위"],["B","차가운 바닷물 위"],["C","단단한 금속 판 위"],["D","지구의 핵 바로 위"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "맨틀의 흐름이 지각판에 미치는 영향은 무엇인가요?";
      choices = [["A","지각판을 밀거나 끌어당기는 힘으로 작용한다"],["B","지각판을 녹여 없앤다"],["C","지각판의 온도만 높인다"],["D","지각판을 위로 튕겨 올린다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "화산과 지진이 집중적으로 발생하는 장소는 어디인가요?";
      choices = [["A","판의 경계"],["B","판의 한가운데"],["C","바다 한복판"],["D","사막 지역"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "태평양 주변에 화산과 지진이 많은 지역을 무엇이라 부르나요?",
      choices = [["A","불의 고리"],["B","얼음의 띠"],["C","바람의 길"],["D","물의 벽"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","지구 표면은 여러 지각판으로 나뉘며, 판의 경계에서 화산과 지진이 발생한다"],["B","지구 표면은 하나의 판으로 되어 있다"],["C","맨틀은 고체여서 움직이지 않는다"],["D","화산과 지진은 판의 경계와 관계없이 무작위로 발생한다"]],
    "A"
  ));

  // p2 문장들
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "화산이 발생하는 근본 원인은 무엇인가요?";
      choices = [["A","지각판의 충돌이나 벌어짐으로 마그마가 분출하는 것이다"],["B","바람이 너무 강하게 부는 것이다"],["C","바닷물이 땅속으로 스며드는 것이다"],["D","운석이 지표에 충돌하는 것이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "두 판이 부딪힐 때 일어나는 일은 무엇인가요?";
      choices = [["A","무거운 판이 아래로 가라앉으며 암석이 녹아 마그마가 생긴다"],["B","두 판이 위로 솟아올라 산이 만들어진다"],["C","판이 합쳐져 하나가 된다"],["D","두 판 사이에 바닷물이 차 올라온다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "마그마가 위로 올라오는 까닭은 무엇인가요?";
      choices = [["A","주변 암석보다 가벼워 틈을 따라 상승하기 때문이다"],["B","외부 폭발의 힘에 밀려 올라오기 때문이다"],["C","바람이 마그마를 밀어 올리기 때문이다"],["D","지표의 구멍이 마그마를 빨아들이기 때문이다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "화산재가 쌓인 토양의 장점은 무엇인가요?";
      choices = [["A","영양분이 풍부하여 농사에 유리하다"],["B","물을 흡수하지 않아 건조하다"],["C","식물이 자라지 못해 사막이 된다"],["D","돌처럼 딱딱하여 건물 짓기에 좋다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 문장에서 화산이 가진 두 가지 얼굴이란 무엇인가요?";
      choices = [["A","파괴와 혜택"],["B","아름다움과 추함"],["C","빛과 어둠"],["D","소리와 침묵"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","화산은 마그마 분출로 피해를 주지만 비옥한 토양과 지열 에너지라는 혜택도 준다"],["B","화산은 항상 인간에게 피해만 준다"],["C","마그마는 지표에 도달하지 못한다"],["D","화산재는 농사에 전혀 도움이 되지 않는다"]],
    "A"
  ));

  // p3 문장들
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "지진이 발생하는 원리는 무엇인가요?";
      choices = [["A","지각판이 밀거나 어긋나면서 쌓인 힘이 한꺼번에 풀리는 것이다"],["B","바람이 땅을 흔드는 것이다"],["C","비가 많이 내려 땅이 무거워지는 것이다"],["D","지구의 자전이 갑자기 빨라지는 것이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "암석이 한계에 이르렀을 때 일어나는 현상은 무엇인가요?";
      choices = [["A","갑자기 부러지거나 미끄러지며 강한 진동이 퍼진다"],["B","천천히 녹아 마그마가 된다"],["C","부풀어 올라 산이 만들어진다"],["D","스스로 원래 모양으로 돌아간다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "지진의 세기를 나타내는 단위는 무엇이며, 규모가 일 증가하면 에너지는 어떻게 되나요?";
      choices = [["A","규모를 사용하며, 에너지가 약 서른두 배 커진다"],["B","데시벨을 사용하며, 에너지가 두 배 커진다"],["C","미터를 사용하며, 에너지가 열 배 커진다"],["D","헤르츠를 사용하며, 에너지가 백 배 커진다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "바다 밑에서 지진이 일어날 때 발생할 수 있는 것은 무엇인가요?";
      choices = [["A","거대한 파도인 쓰나미가 발생할 수 있다"],["B","바닷물이 모두 증발한다"],["C","해저에 새로운 대륙이 생긴다"],["D","바다 생물이 하늘로 올라간다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "지진 피해를 줄이기 위한 방법으로 올바른 것은 무엇인가요?";
      choices = [["A","내진 설계를 강화하고 대피 훈련을 반복하는 것이다"],["B","지진이 일어나면 밖으로 빠르게 달려 나가는 것이다"],["C","건물을 가능한 높게 짓는 것이다"],["D","지진을 미리 막는 기술을 개발하는 것이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장의 핵심 주장은 무엇인가요?";
      choices = [["A","평소에 지진 대비 요령을 익혀 두는 것이 중요하다"],["B","지진은 대비할 필요가 없다"],["C","지진은 반드시 예측할 수 있다"],["D","건물만 튼튼하면 지진은 무해하다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","지진은 판의 힘이 풀릴 때 발생하며, 내진 설계와 대피 훈련으로 피해를 줄일 수 있다"],["B","지진은 예측이 가능하므로 걱정할 필요가 없다"],["C","쓰나미는 지진과 관계없이 발생한다"],["D","지진의 규모가 커져도 피해는 동일하다"]],
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

  // 확인 문항 7개
  const confirmQs = [
    makeConfirmQ("q1", "지구의 표면을 이루는 여러 개의 커다란 판을 무엇이라 부르나요?",
      [findRange(paragraphs, "p1", "지각판")]),
    makeConfirmQ("q2", "태평양 주변의 화산·지진 밀집 지역을 부르는 이름은 무엇인가요?",
      [findRange(paragraphs, "p1", "불의 고리")]),
    makeConfirmQ("q3", "지하에서 암석이 녹아 만들어진 물질을 무엇이라 하나요?",
      [findRange(paragraphs, "p2", "마그마")]),
    makeConfirmQ("q4", "화산재가 쌓인 토양이 농사에 유리한 까닭은 무엇인가요?",
      [findRange(paragraphs, "p2", "영양분이 풍부")]),
    makeConfirmQ("q5", "지진의 세기를 나타내는 단위는 무엇인가요?",
      [findRange(paragraphs, "p3", "규모")]),
    makeConfirmQ("q6", "바다 밑 지진으로 발생하는 거대한 파도를 무엇이라 하나요?",
      [findRange(paragraphs, "p3", "쓰나미")]),
    makeConfirmQ("q7", "지진 피해를 줄이기 위한 건물 설계 방식을 무엇이라 하나요?",
      [findRange(paragraphs, "p3", "내진 설계")])
  ];

  return makeContent(53, "NONFICTION", "일일 독해(프레게 3) Day 53 비문학",
    paragraphs, timeline, cards, confirmQs);
}

// === Day 54 문학: 흥부전의 교훈 ===
function buildDay54() {
  const p1text = "옛날 한 마을에 형 놀부와 아우 흥부가 살고 있었다. 부모가 돌아가시자 놀부는 모든 재산을 혼자 차지하고 흥부 가족을 집에서 내쫓았다. 흥부는 아내와 여러 자녀를 데리고 허름한 오두막에서 겨우 살아가야 했지만, 누구도 원망하지 않고 이웃을 도우며 성실하게 살았다. 이웃에게 일손을 빌려주고, 배고픈 나그네에게 마지막 남은 밥을 나누어 주기도 했다. 사람들은 마음씨 착한 흥부를 칭찬하면서도, 형 놀부의 매정함을 안타깝게 여겼다.";
  const p2text = "어느 봄날, 다리가 부러진 제비 한 마리가 흥부네 마당에 떨어졌다. 흥부는 정성껏 제비의 다리를 치료해 주고, 먹이를 챙겨 주며 건강을 돌보았다. 가을이 되어 남쪽 나라로 떠난 제비는 이듬해 봄에 돌아와 흥부에게 박씨 한 알을 물어다 주었다. 흥부가 박씨를 심어 기르자 커다란 박이 열렸고, 박을 타자 그 안에서 금은보화와 쌀이 쏟아져 나왔다. 순식간에 흥부 가족은 넉넉한 생활을 누리게 되었으며, 흥부는 이웃과 재물을 나누며 더욱 너그럽게 살았다.";
  const p3text = "흥부가 부자가 되었다는 소문을 들은 놀부는 욕심이 생겨 일부러 제비의 다리를 부러뜨린 뒤 치료하는 척했다. 이듬해 봄 제비가 물어다 준 박씨를 심었더니 커다란 박이 열렸지만, 놀부가 박을 타자 안에서 도깨비와 벌레가 나와 재산을 모두 앗아 갔다. 집도 잃고 거리에 나앉게 된 놀부는 그제야 자신의 잘못을 깨닫고 흥부를 찾아가 용서를 빌었다. 흥부는 형의 잘못을 꾸짖지 않고 따뜻하게 맞아들여 함께 살자고 했다. 놀부는 깊이 뉘우치고 그날부터 진심으로 이웃을 돌보기 시작했다.";
  const p4text = "흥부전은 착한 마음으로 베풀며 사는 삶이 결국 복을 가져온다는 교훈을 담고 있다. 흥부는 어려운 처지에서도 남을 탓하지 않고 나눔을 실천했기에 보상을 받았고, 놀부는 욕심과 시기 때문에 모든 것을 잃었다. 또한 놀부가 잘못을 뉘우친 뒤 흥부가 용서하고 함께 살아가는 결말은, 가족 간의 화해와 공동체의 회복이 가능하다는 희망을 보여 준다. 이 이야기는 오늘날에도 더불어 사는 삶의 가치를 일깨워 주는 소중한 고전이다.";

  const paragraphs = [
    { id: "p1", text: p1text },
    { id: "p2", text: p2text },
    { id: "p3", text: p3text },
    { id: "p4", text: p4text }
  ];

  const s1 = findSentences(p1text);
  const s2 = findSentences(p2text);
  const s3 = findSentences(p3text);
  const s4 = findSentences(p4text);

  let stepNum = 0;
  const timeline = [];

  // p1
  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 이야기에 등장하는 두 형제는 누구인가요?";
      choices = [["A","형 놀부와 아우 흥부"],["B","형 흥부와 아우 놀부"],["C","형 심학규와 아우 심봉사"],["D","형 춘향과 아우 몽룡"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "놀부가 부모가 돌아가신 뒤 한 일은 무엇인가요?";
      choices = [["A","모든 재산을 혼자 차지하고 흥부를 내쫓았다"],["B","재산을 공평하게 나누었다"],["C","흥부에게 더 많은 재산을 주었다"],["D","재산을 마을에 기부했다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "흥부가 어려운 처지에서도 보인 태도는 무엇인가요?";
      choices = [["A","누구도 원망하지 않고 이웃을 도우며 성실하게 살았다"],["B","놀부에게 복수할 계획을 세웠다"],["C","매일 한탄하며 울기만 했다"],["D","마을을 떠나 도시로 이사했다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "흥부가 나그네에게 한 일은 무엇인가요?";
      choices = [["A","마지막 남은 밥을 나누어 주었다"],["B","돈을 빌려 주었다"],["C","집에서 하룻밤 재워 주었다"],["D","길을 알려 주었다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "마을 사람들이 놀부에 대해 느끼는 감정은 무엇인가요?";
      choices = [["A","매정함을 안타깝게 여겼다"],["B","부러워하며 본받고 싶어 했다"],["C","무서워하며 피해 다녔다"],["D","전혀 관심이 없었다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","욕심 많은 놀부에게 쫓겨난 흥부가 어려운 속에서도 선하게 살아간다"],["B","놀부가 재산을 공평하게 나누었다"],["C","흥부가 놀부에게 복수했다"],["D","마을 사람들이 놀부를 존경했다"]],
    "A"
  ));

  // p2
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "흥부네 마당에 떨어진 제비에게 일어난 일은 무엇인가요?";
      choices = [["A","다리가 부러져 있었다"],["B","날개가 꺾여 있었다"],["C","깃털이 모두 빠져 있었다"],["D","눈이 보이지 않았다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "흥부가 제비에게 한 행동은 무엇인가요?";
      choices = [["A","다리를 치료하고 먹이를 챙겨 주었다"],["B","새장에 가두어 키웠다"],["C","이웃에게 제비를 넘겨주었다"],["D","제비를 그냥 놓아 주었다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "이듬해 봄에 제비가 가져다 준 것은 무엇인가요?";
      choices = [["A","박씨 한 알"],["B","금반지"],["C","편지 한 장"],["D","꽃씨 한 묶음"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "박을 타자 그 안에서 나온 것은 무엇인가요?";
      choices = [["A","금은보화와 쌀"],["B","도깨비와 벌레"],["C","옷감과 그릇"],["D","씨앗과 농기구"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "부자가 된 뒤 흥부가 한 일은 무엇인가요?";
      choices = [["A","이웃과 재물을 나누며 너그럽게 살았다"],["B","높은 담을 쌓고 혼자 살았다"],["C","놀부에게 복수하려 찾아갔다"],["D","마을을 떠나 도시로 이사했다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","흥부가 제비를 정성껏 돌보자 박씨로 보답을 받아 부자가 되었다"],["B","제비가 흥부에게 해를 끼쳤다"],["C","흥부는 박씨를 심지 않고 버렸다"],["D","부자가 된 흥부는 인색해졌다"]],
    "A"
  ));

  // p3
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "놀부가 제비에게 한 일은 무엇인가요?";
      choices = [["A","일부러 제비의 다리를 부러뜨린 뒤 치료하는 척했다"],["B","자연스럽게 다친 제비를 진심으로 돌보았다"],["C","제비를 잡아 시장에 팔았다"],["D","제비를 무시하고 내버려 두었다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "놀부가 탄 박에서 나온 것은 무엇인가요?";
      choices = [["A","도깨비와 벌레가 나와 재산을 앗아 갔다"],["B","금은보화가 쏟아졌다"],["C","맛있는 음식이 나왔다"],["D","아무것도 나오지 않았다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "놀부가 흥부를 찾아간 까닭은 무엇인가요?";
      choices = [["A","잘못을 깨닫고 용서를 빌기 위해서이다"],["B","돈을 빌리기 위해서이다"],["C","다시 싸우기 위해서이다"],["D","제비를 돌려달라고 하기 위해서이다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "흥부가 놀부에게 보인 태도는 무엇인가요?";
      choices = [["A","꾸짖지 않고 따뜻하게 맞아들여 함께 살자고 했다"],["B","문을 닫고 만나 주지 않았다"],["C","조건을 내걸고 용서했다"],["D","마을 사람들 앞에서 놀부를 꾸짖었다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "놀부가 변화한 뒤 한 일은 무엇인가요?";
      choices = [["A","진심으로 이웃을 돌보기 시작했다"],["B","다시 욕심을 부리기 시작했다"],["C","마을을 떠나 다른 곳으로 갔다"],["D","흥부의 재산을 빼앗으려 했다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","욕심 때문에 벌을 받은 놀부가 잘못을 뉘우치고 흥부의 용서를 받는다"],["B","놀부도 제비 덕분에 부자가 되었다"],["C","흥부가 놀부를 용서하지 않았다"],["D","놀부는 끝까지 잘못을 인정하지 않았다"]],
    "A"
  ));

  // p4
  s4.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p4", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "흥부전이 담고 있는 핵심 교훈은 무엇인가요?";
      choices = [["A","착한 마음으로 베풀며 사는 삶이 복을 가져온다"],["B","부자가 되려면 남을 속여야 한다"],["C","재산이 많으면 행복하다"],["D","혼자 사는 것이 가장 편하다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "흥부가 보상을 받을 수 있었던 까닭은 무엇인가요?";
      choices = [["A","남을 탓하지 않고 나눔을 실천했기 때문이다"],["B","운이 좋았기 때문이다"],["C","마법사의 도움을 받았기 때문이다"],["D","놀부에게 복수했기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "이야기의 결말이 보여 주는 희망은 무엇인가요?";
      choices = [["A","가족 간 화해와 공동체 회복이 가능하다는 것이다"],["B","잘못한 사람은 절대 용서받지 못한다는 것이다"],["C","형제는 반드시 갈라서야 한다는 것이다"],["D","부자만이 행복할 수 있다는 것이다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "이 이야기가 오늘날에도 가치 있는 까닭은 무엇인가요?";
      choices = [["A","더불어 사는 삶의 가치를 일깨워 주기 때문이다"],["B","옛날이야기이므로 현대와 관련이 없다"],["C","재미만 있을 뿐 교훈은 없다"],["D","오직 어린이만을 위한 이야기이기 때문이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p4", start: 0, end: p4text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","흥부전은 나눔, 용서, 더불어 사는 삶의 소중함을 일깨워 주는 고전이다"],["B","흥부전에는 특별한 교훈이 없다"],["C","놀부만이 이 이야기의 주인공이다"],["D","흥부전은 복수의 중요성을 가르친다"]],
    "A"
  ));

  // 복기 카드 8장
  const fullText = p1text + "\n" + p2text + "\n" + p3text + "\n" + p4text;
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
    makeConfirmQ("q1", "부모 사후 재산을 독차지한 형의 이름은 무엇인가요?",
      [findRange(paragraphs, "p1", "놀부")]),
    makeConfirmQ("q2", "흥부네 마당에 떨어진 제비의 어느 부위가 다쳤나요?",
      [findRange(paragraphs, "p2", "다리가 부러진")]),
    makeConfirmQ("q3", "제비가 흥부에게 보답으로 가져다 준 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "박씨")]),
    makeConfirmQ("q4", "놀부의 박에서 나와 재산을 앗아간 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "도깨비")]),
    makeConfirmQ("q5", "흥부가 놀부를 대한 태도를 가장 잘 나타내는 말은 무엇인가요?",
      [findRange(paragraphs, "p3", "따뜻하게 맞아들여")]),
    makeConfirmQ("q6", "흥부전이 일깨워 주는 삶의 가치는 무엇인가요?",
      [findRange(paragraphs, "p4", "더불어 사는 삶")])
  ];

  return makeContent(54, "LITERATURE", "일일 독해(프레게 3) Day 54 문학",
    paragraphs, timeline, cards, confirmQs);
}

// === Day 55 비문학: 재활용과 환경 보호 ===
function buildDay55() {
  const p1text = "우리가 매일 사용하고 버리는 물건의 상당수는 매립지에 묻히거나 소각장에서 태워지는데, 이 과정에서 토양 오염과 대기 오염이 발생한다. 매립지에 묻힌 쓰레기 가운데 플라스틱은 분해되는 데 수백 년 이상 걸리며, 그 사이에 미세 플라스틱으로 쪼개져 토양과 지하수를 오염시킨다. 특히 미세 플라스틱은 눈에 보이지 않을 만큼 작아서 물고기와 같은 해양 생물의 몸속에도 들어가 먹이 사슬을 통해 사람에게까지 영향을 미칠 수 있다. 소각 과정에서는 유해 가스와 미세 먼지가 배출되어 호흡기 질환을 유발할 수 있다. 쓰레기의 양이 늘어날수록 이러한 환경 문제는 심각해지므로, 쓰레기를 줄이고 자원을 다시 활용하는 재활용이 반드시 필요하다.";
  const p2text = "재활용이란 사용한 물건이나 자원을 가공하여 새로운 제품의 원료로 다시 쓰는 것을 말한다. 종이를 재활용하면 나무를 베지 않아도 되므로 산림을 보호할 수 있고, 알루미늄 캔을 녹여 다시 만들면 원래 광석에서 추출할 때보다 에너지를 약 구십오 퍼센트 절약할 수 있다. 유리병은 깨끗이 씻어 분리배출하면 다시 녹여 새 유리 제품으로 만들 수 있으며, 플라스틱 역시 종류에 따라 분류하면 의류 섬유나 건축 자재로 재탄생할 수 있다. 이처럼 재활용은 자원의 낭비를 줄이고 제조 과정에서 발생하는 온실가스도 감소시킨다.";
  const p3text = "재활용의 효과를 높이려면 올바른 분리배출이 무엇보다 중요하다. 음식물이 묻은 용기는 반드시 헹군 뒤 배출해야 하며, 종이와 플라스틱, 캔, 유리 등을 섞지 않고 각각 지정된 수거함에 넣어야 한다. 페트병은 라벨을 떼고 납작하게 눌러서 배출하고, 비닐은 이물질을 제거한 뒤 따로 모아야 한다. 이러한 노력이 모여야 수거된 자원이 실제로 재활용 공정에 들어갈 수 있다. 개인의 작은 실천이 모이면 매립지와 소각장으로 가는 쓰레기의 양을 크게 줄일 수 있으며, 이는 곧 깨끗한 환경을 지키는 가장 확실한 방법이 된다. 더 나아가 불필요한 소비를 줄이고 다회용 제품을 사용하는 생활 습관도 환경 보호에 큰 도움이 된다.";

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
      prompt = "버려진 물건이 처리되는 과정에서 발생하는 문제는 무엇인가요?";
      choices = [["A","토양 오염과 대기 오염이 발생한다"],["B","물건이 저절로 분해된다"],["C","에너지가 생산된다"],["D","새로운 자원이 만들어진다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "플라스틱이 매립지에서 문제가 되는 까닭은 무엇인가요?";
      choices = [["A","분해에 수백 년 이상 걸리며 미세 플라스틱으로 쪼개져 오염을 일으킨다"],["B","빠르게 분해되어 토양을 비옥하게 한다"],["C","물에 녹아 지하수를 깨끗하게 만든다"],["D","땅속에서 에너지원으로 변환된다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "미세 플라스틱이 사람에게까지 영향을 미치는 경로는 무엇인가요?";
      choices = [["A","해양 생물의 몸속에 들어가 먹이 사슬을 통해 전달된다"],["B","공기 중에 떠다니다가 직접 흡입된다"],["C","피부를 통해 흡수된다"],["D","식수를 끓이면 자연히 없어진다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "소각 과정에서 배출되는 것은 무엇인가요?";
      choices = [["A","유해 가스와 미세 먼지"],["B","깨끗한 수증기"],["C","영양분이 풍부한 재"],["D","산소와 수소"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 문장에서 재활용이 필요한 이유는 무엇인가요?";
      choices = [["A","쓰레기가 늘수록 환경 문제가 심각해지기 때문이다"],["B","재활용이 재미있기 때문이다"],["C","쓰레기가 저절로 사라지기 때문이다"],["D","매립지에 공간이 남아 있기 때문이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","쓰레기 매립과 소각이 환경 문제를 일으키므로 재활용이 필요하다"],["B","쓰레기는 환경에 아무런 영향을 주지 않는다"],["C","플라스틱은 빠르게 분해된다"],["D","소각은 환경 문제를 해결하는 가장 좋은 방법이다"]],
    "A"
  ));

  // p2
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "재활용의 정의로 알맞은 것은 무엇인가요?";
      choices = [["A","사용한 물건을 가공하여 새 제품의 원료로 다시 쓰는 것이다"],["B","물건을 버리지 않고 집에 쌓아 두는 것이다"],["C","쓰레기를 바다에 버리는 것이다"],["D","물건을 태워서 열을 얻는 것이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "종이를 재활용하면 보호할 수 있는 것은 무엇인가요?";
      choices = [["A","산림을 보호할 수 있다"],["B","바다를 깨끗하게 만든다"],["C","공기를 따뜻하게 만든다"],["D","토양을 건조하게 유지한다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "유리병 재활용을 위해 해야 할 일은 무엇인가요?";
      choices = [["A","깨끗이 씻어 분리배출한다"],["B","일반 쓰레기와 함께 버린다"],["C","깨뜨려서 매립지에 묻는다"],["D","그냥 재사용하면 된다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "이 문장의 핵심 내용은 무엇인가요?";
      choices = [["A","재활용은 자원 낭비를 줄이고 온실가스도 감소시킨다"],["B","재활용은 오히려 환경을 더 오염시킨다"],["C","재활용보다 소각이 더 효과적이다"],["D","재활용은 비용이 너무 많이 들어 비효율적이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","재활용은 자원을 절약하고 온실가스 배출을 줄이는 효과적인 방법이다"],["B","재활용은 종이에만 적용 가능하다"],["C","알루미늄은 재활용할 수 없다"],["D","재활용은 에너지를 더 많이 소비한다"]],
    "A"
  ));

  // p3
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "재활용의 효과를 높이기 위해 가장 중요한 것은 무엇인가요?";
      choices = [["A","올바른 분리배출"],["B","쓰레기를 많이 모으는 것"],["C","모든 것을 소각하는 것"],["D","쓰레기를 바다에 버리는 것"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "음식물이 묻은 용기를 배출할 때 해야 할 일은 무엇인가요?";
      choices = [["A","반드시 헹군 뒤 배출해야 한다"],["B","그대로 분리수거함에 넣으면 된다"],["C","일반 쓰레기로 버려야 한다"],["D","음식물과 함께 버려야 한다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "페트병 배출 시 올바른 방법은 무엇인가요?";
      choices = [["A","라벨을 떼고 납작하게 눌러서 배출한다"],["B","뚜껑을 닫은 채 그대로 버린다"],["C","물을 가득 채워서 배출한다"],["D","일반 쓰레기봉투에 넣는다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "수거된 자원이 실제로 재활용되려면 무엇이 필요한가요?";
      choices = [["A","올바른 분리배출 노력이 모여야 한다"],["B","특별한 기술 없이도 자동으로 된다"],["C","모든 쓰레기를 한곳에 모으면 된다"],["D","정부만 노력하면 충분하다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "개인의 분리배출 실천이 가져오는 효과는 무엇인가요?";
      choices = [["A","매립지와 소각장으로 가는 쓰레기를 크게 줄일 수 있다"],["B","쓰레기의 양에는 영향을 주지 못한다"],["C","환경 보호와 관련이 없다"],["D","오히려 쓰레기가 늘어난다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 환경 보호를 위해 추가로 권장하는 것은 무엇인가요?";
      choices = [["A","불필요한 소비를 줄이고 다회용 제품을 사용하는 것이다"],["B","일회용품을 더 많이 사용하는 것이다"],["C","분리배출을 하지 않는 것이다"],["D","물건을 가능한 많이 사는 것이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","올바른 분리배출과 소비 줄이기가 환경 보호의 확실한 방법이다"],["B","분리배출은 환경 보호에 도움이 되지 않는다"],["C","재활용은 기업만의 책임이다"],["D","다회용 제품은 환경에 해롭다"]],
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
    makeConfirmQ("q1", "플라스틱이 분해되면서 토양과 지하수를 오염시키는 작은 조각을 무엇이라 하나요?",
      [findRange(paragraphs, "p1", "미세 플라스틱")]),
    makeConfirmQ("q2", "알루미늄 캔을 재활용하면 절약할 수 있는 에너지 비율은 약 얼마인가요?",
      [findRange(paragraphs, "p2", "구십오 퍼센트")]),
    makeConfirmQ("q3", "재활용이 제조 과정에서 줄여 주는 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "온실가스")]),
    makeConfirmQ("q4", "페트병을 배출할 때 떼어야 하는 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "라벨")]),
    makeConfirmQ("q5", "개인의 실천이 줄일 수 있는 시설 두 곳은 어디인가요?",
      [findRange(paragraphs, "p3", "매립지와 소각장")]),
    makeConfirmQ("q6", "환경 보호를 위해 일회용 대신 사용이 권장되는 제품은 무엇인가요?",
      [findRange(paragraphs, "p3", "다회용 제품")])
  ];

  return makeContent(55, "NONFICTION", "일일 독해(프레게 3) Day 55 비문학",
    paragraphs, timeline, cards, confirmQs);
}

// === 메인 실행 ===
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const batchPath = path.join(ROOT, 'generated', 'daily-batch-reading-frege3.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'frege3');

  // 배치 파일 읽기
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

  // Day 51~55 콘텐츠 빌드
  const days = [
    { dayIndex: 51, builder: buildDay51 },
    { dayIndex: 52, builder: buildDay52 },
    { dayIndex: 53, builder: buildDay53 },
    { dayIndex: 54, builder: buildDay54 },
    { dayIndex: 55, builder: buildDay55 }
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
