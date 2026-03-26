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

// === Day 46 문학: 동생과 함께 만든 요리 (생활문) ===
// p1: 6문장, p2: 6문장, p3: 6문장, 총 950~1050자
function buildDay46() {
  const p1text = "토요일 아침, 엄마가 회사에 잠깐 다녀오신다고 하셔서 나와 동생 민호는 점심을 직접 해 먹기로 했다. 민호는 겨우 초등학교 이학년이라 칼을 쓸 줄 몰랐지만, 재료를 씻고 그릇을 꺼내는 일이라면 누가 시키지 않아도 척척 해냈다. 나는 인터넷에서 달걀볶음밥 레시피를 찾아 태블릿 화면에 띄워 놓고, 순서를 하나씩 읽어 보았다. 민호는 냉장고 앞에 서서 달걀 네 개와 당근 하나, 대파 한 줄기를 조심조심 꺼내며 으쓱한 표정을 지었다. 사실 나도 요리를 해 본 적이 거의 없어서 속으로 살짝 긴장하고 있었다. 그래도 동생 앞에서 떨리는 모습을 보여 줄 수 없었기에, 태연한 척 앞치마를 두르고 도마 위에 당근을 올려놓았다.";
  const p2text = "당근을 작은 네모 모양으로 썰려고 칼을 잡았는데, 생각보다 단단해서 식은땀이 흘렀다. 민호가 옆에서 걱정스러운 눈빛으로 바라보다가 누나, 천천히 하라고 외쳐서 정신이 번쩍 들었다. 나는 깊게 숨을 들이쉬고 천천히 다시 칼질을 시작했다. 대파를 송송 썰 때에는 눈이 따끔거렸지만, 민호가 물을 적신 키친타월을 건네주어 금방 괜찮아졌다. 프라이팬에 기름을 두르고 달걀을 깨 넣자, 지글지글 소리가 부엌 안을 가득 채웠다. 민호가 신이 나서 손뼉을 치며 맛있겠다를 연발하자, 나도 모르게 긴장이 풀리면서 요리가 조금씩 즐거워지기 시작했다.";
  const p3text = "완성된 달걀볶음밥을 두 접시에 나누어 담고, 민호가 직접 키친타월로 식탁을 깨끗이 닦았다. 첫 숟가락을 떠서 입에 넣었을 때 간이 좀 싱거웠지만, 우리는 엄지를 치켜세우며 환하게 웃었다. 민호는 엄마 밥보다 맛있다고 과장을 섞어 말했고, 나는 괜히 얼굴이 뜨거워지면서도 기분이 좋았다. 설거지를 할 때 민호가 접시를 받아 물기를 야무지게 닦아 주어서 속으로 감탄했다. 엄마가 돌아오셔서 깨끗한 부엌과 빈 접시를 보시고는 두 사람 다 대단하다며 크게 웃으셨다. 그날 나는 요리 자체보다 동생과 함께 힘을 합쳐 해냈다는 사실이 더 뿌듯하다는 것을 처음으로 느꼈다.";

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

  // p1 문장들 (6)
  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에서 나와 민호가 점심을 직접 만들기로 한 까닭은 무엇인가요?";
      choices = [["A","엄마가 회사에 잠깐 다녀오신다고 하셨기 때문이다"],["B","학교 숙제로 요리 체험을 해야 했기 때문이다"],["C","아빠가 요리 대결을 제안하셨기 때문이다"],["D","배달 음식을 시키기 싫었기 때문이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "이 문장에 따르면 민호가 할 수 있는 일은 무엇인가요?";
      choices = [["A","재료를 씻고 그릇을 꺼내는 일"],["B","칼로 채소를 잘게 써는 일"],["C","프라이팬에서 음식을 볶는 일"],["D","인터넷에서 레시피를 검색하는 일"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "이 문장에서 '나'가 태블릿으로 한 일은 무엇인가요?";
      choices = [["A","달걀볶음밥 레시피를 찾아 화면에 띄워 놓았다"],["B","요리 영상을 녹화하여 저장하였다"],["C","엄마에게 메시지를 보내어 레시피를 물었다"],["D","친구에게 영상 통화로 도움을 요청하였다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "민호가 냉장고에서 꺼낸 재료로 언급되지 않은 것은 무엇인가요?";
      choices = [["A","양파"],["B","달걀"],["C","당근"],["D","대파"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 문장에서 '나'의 속마음은 어떠했나요?";
      choices = [["A","요리를 해 본 적이 거의 없어 살짝 긴장하고 있었다"],["B","요리에 자신이 넘쳐 전혀 걱정이 없었다"],["C","민호 때문에 짜증이 나고 있었다"],["D","엄마가 빨리 오시기만 기다리고 있었다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 '나'가 태연한 척 한 행동은 무엇인가요?";
      choices = [["A","앞치마를 두르고 도마 위에 당근을 올려놓았다"],["B","민호에게 큰 소리로 지시를 내렸다"],["C","음악을 틀어 분위기를 바꾸었다"],["D","냉장고에서 완성된 반찬을 꺼냈다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","엄마가 외출하자 나와 민호는 달걀볶음밥을 만들기로 결심한다"],["B","민호는 칼을 잘 다루어 모든 재료를 혼자 준비한다"],["C","나는 요리에 자신이 있어 민호에게 자랑한다"],["D","엄마가 점심 재료를 미리 준비해 놓고 가셨다"]],
    "A"
  ));

  // p2 문장들 (6)
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에서 당근을 썰 때 어려웠던 이유는 무엇인가요?";
      choices = [["A","생각보다 단단해서 식은땀이 났기 때문이다"],["B","칼이 너무 날카로워 무서웠기 때문이다"],["C","당근이 너무 작아 잡기 어려웠기 때문이다"],["D","도마가 미끄러워 당근이 굴러갔기 때문이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "민호가 나에게 외친 말은 무엇인가요?";
      choices = [["A","누나, 천천히 하라고 외쳤다"],["B","누나, 빨리 하라고 소리쳤다"],["C","누나, 내가 할게라고 말했다"],["D","누나, 그만두자고 했다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "민호의 한마디를 듣고 '나'는 어떻게 했나요?";
      choices = [["A","깊게 숨을 들이쉬고 천천히 다시 칼질을 시작했다"],["B","칼을 내려놓고 민호에게 넘겨주었다"],["C","화가 나서 민호에게 나가라고 했다"],["D","요리를 포기하고 라면을 끓이기로 했다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "대파를 썰 때 '나'를 도와준 민호의 행동은 무엇인가요?";
      choices = [["A","물 적신 키친타월을 건네주었다"],["B","대파를 대신 썰어 주었다"],["C","선풍기를 가져와 바람을 쐬어 주었다"],["D","눈을 감고 있으라고 말했다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "프라이팬에 달걀을 넣었을 때 부엌에 퍼진 것은 무엇인가요?";
      choices = [["A","지글지글 소리"],["B","타는 냄새"],["C","연기"],["D","물 튀는 소리"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 '나'에게 일어난 변화는 무엇인가요?";
      choices = [["A","긴장이 풀리면서 요리가 즐거워지기 시작했다"],["B","요리가 실패할 것 같아 더 긴장하게 되었다"],["C","민호가 방해해서 짜증이 났다"],["D","요리를 그만두고 싶어졌다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","재료 손질이 어려웠지만 민호의 응원 덕분에 요리가 즐거워진다"],["B","나는 요리가 너무 어려워 결국 포기한다"],["C","민호가 모든 요리를 혼자 해냈다"],["D","프라이팬에 기름을 넣지 않아 달걀이 타 버렸다"]],
    "A"
  ));

  // p3 문장들 (6)
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "완성된 볶음밥을 담은 뒤 민호가 한 일은 무엇인가요?";
      choices = [["A","키친타월로 식탁을 깨끗이 닦았다"],["B","접시를 들고 거실로 달려갔다"],["C","엄마에게 전화를 걸었다"],["D","반찬을 더 꺼내 차렸다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "첫 숟가락을 먹었을 때 맛은 어떠했나요?";
      choices = [["A","간이 좀 싱거웠다"],["B","너무 짜서 먹기 힘들었다"],["C","매워서 물을 마셔야 했다"],["D","완벽하게 맛있었다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "민호가 볶음밥에 대해 한 말은 무엇인가요?";
      choices = [["A","엄마 밥보다 맛있다고 과장을 섞어 말했다"],["B","다음에는 다른 음식을 만들자고 제안했다"],["C","맛이 없다며 솔직하게 말했다"],["D","엄마에게 비밀로 하자고 속삭였다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "설거지할 때 민호의 모습은 어떠했나요?";
      choices = [["A","접시의 물기를 야무지게 닦아 주었다"],["B","물장난을 치며 설거지를 방해했다"],["C","졸려서 소파에 누워 버렸다"],["D","접시를 떨어뜨려 깨뜨렸다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "엄마가 돌아오셔서 보신 것은 무엇인가요?";
      choices = [["A","깨끗한 부엌과 빈 접시"],["B","어질러진 식탁과 남은 음식"],["C","잠들어 있는 두 아이"],["D","아직 요리 중인 부엌"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "그날 '나'가 처음 느낀 것은 무엇인가요?";
      choices = [["A","동생과 힘을 합쳐 해냈다는 사실이 더 뿌듯하다는 것"],["B","요리 실력이 프로 수준이라는 자신감"],["C","앞으로 요리를 절대 하지 않겠다는 다짐"],["D","동생 없이 혼자 하는 것이 더 편하다는 깨달음"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","함께 먹고 설거지까지 마치며 동생과의 협력이 가장 뿌듯했음을 깨닫는다"],["B","엄마가 돌아와 요리가 맛없다며 다시 만드셨다"],["C","민호가 설거지를 거부하여 나 혼자 뒷정리를 했다"],["D","나는 요리보다 공부가 더 재미있다고 생각하게 되었다"]],
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

  const confirmQs = [
    makeConfirmQ("q1", "나와 민호가 만들기로 한 음식은 무엇인가요?",
      [findRange(paragraphs, "p1", "달걀볶음밥")]),
    makeConfirmQ("q2", "민호가 칼질하던 나에게 외친 말은 무엇인가요?",
      [findRange(paragraphs, "p2", "천천히")]),
    makeConfirmQ("q3", "프라이팬에 달걀을 넣자 부엌에 퍼진 소리는 무엇인가요?",
      [findRange(paragraphs, "p2", "지글지글")]),
    makeConfirmQ("q4", "완성된 볶음밥의 간은 어떠했나요?",
      [findRange(paragraphs, "p3", "싱거웠지만")]),
    makeConfirmQ("q5", "엄마가 돌아와 보신 부엌의 상태는 어떠했나요?",
      [findRange(paragraphs, "p3", "깨끗한 부엌")]),
    makeConfirmQ("q6", "그날 나에게 가장 뿌듯했던 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "동생과 함께 힘을 합쳐 해냈다는 사실")])
  ];

  return makeContent(46, "LITERATURE", "일일 독해(프레게 3) Day 46 문학",
    paragraphs, timeline, cards, confirmQs);
}

// === Day 47 비문학: 화산이 만드는 지형 (지구과학) ===
// p1: 6문장, p2: 6문장, p3: 6문장, 총 950~1050자
function buildDay47() {
  const p1text = "화산은 지구 내부의 뜨거운 마그마가 지표면 위로 분출하는 현상이다. 지구 내부는 매우 높은 온도와 압력을 가지고 있어서 암석이 녹아 마그마가 되며, 이 마그마가 지각의 약한 틈을 따라 올라오면 화산 활동이 일어난다. 마그마가 지표 밖으로 나오면 용암이라 부르는데, 용암의 점성과 성질에 따라 화산의 모양이 크게 달라진다. 점성이 낮은 용암은 멀리까지 흘러가며 넓고 완만한 순상 화산을 만들고, 점성이 높은 용암은 퍼지지 못하고 가파른 종상 화산을 이룬다. 폭발력이 강한 화산은 용암과 화산재, 화산 가스를 한꺼번에 내뿜으며 주변 환경에 큰 영향을 미친다. 화산 활동은 때로 큰 피해를 주기도 하지만, 새로운 땅을 만들어 내는 지구의 역동적인 활동이기도 하다.";
  const p2text = "화산이 만드는 대표적인 지형 중 하나가 칼데라이다. 칼데라는 대규모 폭발 뒤 마그마가 빠져나간 자리가 함몰되어 생기는 커다란 움푹 파인 지형이다. 이 함몰 지형에 빗물이나 지하수가 고이면 칼데라호라 불리는 호수가 형성된다. 우리나라의 백두산 천지가 칼데라호의 대표적 사례이다. 점성이 낮은 용암이 반복적으로 분출하면 넓은 용암 대지가 만들어지며, 제주도는 해저 화산 활동으로 형성된 화산섬이다. 이처럼 화산은 파괴적 힘뿐 아니라 다양하고 독특한 지형을 만들어 내는 창조적 역할도 수행한다.";
  const p3text = "화산 활동이 남기는 물질은 토양과 생태계에도 깊은 영향을 준다. 화산재는 칼륨, 인, 마그네슘 같은 무기 양분을 풍부하게 포함하여 시간이 지나면 매우 비옥한 토양으로 변한다. 인도네시아의 자바섬이나 이탈리아의 나폴리 주변이 화산 덕분에 농사가 잘되는 지역으로 유명하다. 또한 아이슬란드처럼 화산 활동이 활발한 나라에서는 지열 발전으로 전기를 생산하고 온천수를 난방에 이용한다. 그러나 화산 폭발은 항공기 운항을 방해하고 대규모 분출은 전 지구적 기온 변화를 가져올 수도 있다. 따라서 화산은 이로운 자원을 제공하는 동시에 대비가 필요한 자연 현상이라 할 수 있다.";

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

  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에서 화산의 정의는 무엇인가요?";
      choices = [["A","지구 내부의 마그마가 지표면 위로 분출하는 현상이다"],["B","바닷물이 끓어올라 수증기를 만드는 현상이다"],["C","빙하가 녹아 큰 홍수를 일으키는 현상이다"],["D","바람이 모래를 높이 날려 보내는 현상이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "마그마가 만들어지는 이유는 무엇인가요?";
      choices = [["A","높은 온도와 압력으로 암석이 녹기 때문이다"],["B","바닷물이 지하로 스며들어 열을 받기 때문이다"],["C","태양열이 땅속까지 전달되기 때문이다"],["D","지하에서 화학 반응이 일어나기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "마그마가 지표 밖으로 나오면 무엇이라 부르나요?";
      choices = [["A","용암"],["B","화산재"],["C","지하수"],["D","온천수"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "점성이 낮은 용암이 만드는 화산의 형태는 무엇인가요?";
      choices = [["A","넓고 완만한 순상 화산"],["B","가파른 종상 화산"],["C","깊고 움푹 파인 칼데라"],["D","평평한 용암 동굴"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "폭발력이 강한 화산이 내뿜는 것으로 언급되지 않은 것은 무엇인가요?";
      choices = [["A","지하수"],["B","용암"],["C","화산재"],["D","화산 가스"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 화산 활동의 또 다른 면은 무엇인가요?";
      choices = [["A","새로운 땅을 만드는 역동적 활동이다"],["B","언제나 피해만 주는 재앙이다"],["C","인간이 만들어 낸 인공적 현상이다"],["D","지구의 자전을 멈추게 하는 현상이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","화산은 마그마의 분출로 일어나며 용암 성질에 따라 다양한 형태를 만든다"],["B","화산은 오직 파괴적인 현상이므로 피해만 준다"],["C","모든 화산은 같은 모양과 크기를 가진다"],["D","화산 활동은 지구 표면에서만 일어난다"]],
    "A"
  ));

  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "화산이 만드는 대표적 지형으로 이 문장에서 소개하는 것은 무엇인가요?";
      choices = [["A","칼데라"],["B","삼각주"],["C","해안 절벽"],["D","사막의 모래 언덕"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "칼데라가 만들어지는 과정은 무엇인가요?";
      choices = [["A","폭발 후 마그마가 빠져나간 자리가 함몰되어 생긴다"],["B","빗물이 오랜 세월 바위를 깎아 만들어진다"],["C","빙하가 녹으며 지반이 내려앉아 생긴다"],["D","바람이 모래를 쌓아 올려 만들어진다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "칼데라에 물이 고이면 무엇이 되나요?";
      choices = [["A","칼데라호"],["B","온천"],["C","지하 동굴"],["D","간헐천"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "칼데라호의 대표적 사례로 언급한 것은 무엇인가요?";
      choices = [["A","백두산 천지"],["B","한라산 백록담"],["C","설악산 대청봉"],["D","지리산 천왕봉"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 문장에서 제주도에 대해 설명하는 내용은 무엇인가요?";
      choices = [["A","해저 화산 활동으로 형성된 화산섬이다"],["B","대륙에서 분리되어 떠내려온 섬이다"],["C","산호초가 쌓여 만들어진 섬이다"],["D","인공적으로 매립하여 만든 섬이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 화산의 역할로 강조하는 것은 무엇인가요?";
      choices = [["A","다양하고 독특한 지형을 만드는 창조적 역할이다"],["B","오직 파괴적인 힘만 가지고 있다는 점이다"],["C","인간이 통제할 수 있는 자연 현상이라는 점이다"],["D","지형 변화와는 관계없다는 점이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","화산은 칼데라, 용암 대지 등 다양한 지형을 만드는 창조적 역할도 한다"],["B","칼데라는 빗물에 의해서만 만들어지는 지형이다"],["C","제주도는 화산과 관계없이 형성된 섬이다"],["D","화산 활동은 지형 변화를 일으키지 않는다"]],
    "A"
  ));

  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에 따르면 화산 활동이 영향을 미치는 대상은 무엇인가요?";
      choices = [["A","토양과 생태계"],["B","달의 궤도"],["C","바다의 염분 농도"],["D","대기의 산소 농도"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "화산재가 비옥한 토양으로 변할 수 있는 까닭은 무엇인가요?";
      choices = [["A","칼륨, 인, 마그네슘 같은 무기 양분을 풍부하게 포함하기 때문이다"],["B","화산재에 물이 많이 섞여 있기 때문이다"],["C","화산재가 햇빛을 잘 반사하기 때문이다"],["D","화산재가 바람에 의해 고르게 펴지기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "화산 주변에서 농사가 잘되는 대표적 지역이 아닌 곳은 어디인가요?";
      choices = [["A","노르웨이의 베르겐"],["B","인도네시아의 자바섬"],["C","이탈리아의 나폴리 주변"],["D","자바섬과 나폴리 모두 해당한다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "아이슬란드에서 지열 에너지를 활용하는 방법은 무엇인가요?";
      choices = [["A","지열 발전으로 전기를 생산하고 온천수를 난방에 이용한다"],["B","화산 가스를 모아 연료로 사용한다"],["C","용암의 열로 직접 요리를 한다"],["D","화산재를 태워 발전소를 가동한다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "화산 폭발이 가져올 수 있는 피해가 아닌 것은 무엇인가요?";
      choices = [["A","해수면 상승"],["B","항공기 운항 방해"],["C","전 지구적 기온 변화"],["D","두 가지 모두 언급되었다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 화산에 대한 결론은 무엇인가요?";
      choices = [["A","이로운 자원을 제공하면서도 대비가 필요한 자연 현상이다"],["B","인간이 완전히 통제할 수 있는 현상이다"],["C","해로움이 훨씬 크므로 피해야 한다"],["D","자연 현상이 아니라 인간이 만든 재해이다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","화산 물질은 비옥한 토양과 지열 에너지를 제공하지만 피해 대비도 필요하다"],["B","화산재는 토양에 아무런 도움이 되지 않는다"],["C","화산 지역에서는 농사를 지을 수 없다"],["D","지열 에너지는 화산과 관계없는 에너지원이다"]],
    "A"
  ));

  const fullText = p1text + "\n" + p2text + "\n" + p3text;
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
  }

  const confirmQs = [
    makeConfirmQ("q1", "마그마가 지표 밖으로 나오면 무엇이라 부르나요?",
      [findRange(paragraphs, "p1", "용암")]),
    makeConfirmQ("q2", "점성이 낮은 용암이 만드는 화산 형태는 무엇인가요?",
      [findRange(paragraphs, "p1", "순상 화산")]),
    makeConfirmQ("q3", "화산 폭발 후 함몰되어 생기는 지형을 무엇이라 하나요?",
      [findRange(paragraphs, "p2", "칼데라")]),
    makeConfirmQ("q4", "우리나라의 대표적인 칼데라호는 무엇인가요?",
      [findRange(paragraphs, "p2", "백두산 천지")]),
    makeConfirmQ("q5", "화산재가 포함하여 토양을 비옥하게 만드는 성분은 무엇인가요?",
      [findRange(paragraphs, "p3", "칼륨, 인, 마그네슘")]),
    makeConfirmQ("q6", "아이슬란드에서 화산 에너지로 전기를 생산하는 방법은 무엇인가요?",
      [findRange(paragraphs, "p3", "지열 발전")])
  ];

  return makeContent(47, "NONFICTION", "일일 독해(프레게 3) Day 47 비문학",
    paragraphs, timeline, cards, confirmQs);
}

// === Day 48 문학: 이사 가는 날의 마음 (수필) ===
// p1: 5문장, p2: 6문장, p3: 6문장, 총 950~1050자
function buildDay48() {
  const p1text = "이사 가는 날 아침, 텅 빈 방 안에 서니 낯선 느낌이 밀려왔다. 어젯밤까지 책꽂이와 책상이 자리를 지키던 벽에는 먼지 자국만 남아 있었고, 천장에 붙여 놓았던 야광 별 스티커 몇 개가 아직 떨어지지 않은 채 희미하게 빛나고 있었다. 나는 문득 이 방에서 보낸 시간이 한꺼번에 밀려오는 것을 느꼈다. 처음 이 방을 갖게 되어 이불 위에서 뛰어다녔던 날, 시험 전날 밤늦도록 교과서를 읽던 시간, 친구와 전화로 한참을 웃었던 저녁이 벽 안에 고스란히 담겨 있었다. 방은 네 개의 벽과 하나의 창문뿐이지만, 기억이 쌓이면 세상에 하나밖에 없는 특별한 장소가 된다는 것을 떠나는 순간에야 비로소 알게 되었다.";
  const p2text = "이삿짐 트럭이 도착하자 아버지와 어머니는 부지런히 짐을 옮기기 시작하셨다. 나는 마지막으로 베란다에 나가 보았다. 삼 층 베란다에서 내려다보이는 놀이터는 언제나 내 시선이 처음 닿는 풍경이었다. 모래밭에서 소꿉놀이를 하던 기억, 그네를 타며 하늘 끝까지 올라가고 싶다고 외쳤던 기억이 함께 스쳐 갔다. 놀이터 너머 작은 슈퍼마켓은 방과 후에 친구들과 아이스크림을 사 먹던 곳이었다. 그 모든 풍경이 기억 속에서만 존재하게 될 것이라 생각하니, 코끝이 찡하면서도 이 동네에서 보낸 시간이 따뜻했다는 고마운 마음이 올라왔다.";
  const p3text = "새 아파트에 도착하자 낯선 냄새와 넓어진 거실이 눈에 들어왔다. 내 방이 될 공간은 전보다 넓었지만 아직 아무 흔적도 없어서 차갑게 느껴졌다. 이삿짐을 풀면서 옛집 벽에 붙여 두었던 사진들을 꺼내어 새 벽에 하나씩 붙이기 시작했다. 수학여행 단체 사진, 바다를 배경으로 찍은 가족 사진, 반려견 콩이와 찍은 셀카를 벽에 채워 가자 방이 조금씩 내 냄새를 품기 시작했다. 창밖으로 처음 보는 거리가 펼쳐져 있었지만 두려움보다 설렘이 더 크게 다가왔다. 새 동네에서 만날 친구와 새 학교에서 겪을 일들이 빈 서랍처럼 채워지기를 기다리고 있다고 생각하니, 텅 빈 방이 가능성으로 가득 찬 공간처럼 느껴졌다.";

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

  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에서 '나'가 느낀 감정은 무엇인가요?";
      choices = [["A","텅 빈 방에 서니 낯선 느낌이 밀려왔다"],["B","새 집에 대한 기대로 가득 찼다"],["C","빨리 떠나고 싶어 조급해졌다"],["D","이사를 안 하기로 마음먹었다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "벽에 남아 있던 것은 무엇인가요?";
      choices = [["A","먼지 자국과 야광 별 스티커"],["B","책꽂이와 책상"],["C","새로 붙인 벽지"],["D","친구들이 그린 그림"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "이 문장에서 '나'에게 밀려온 것은 무엇인가요?";
      choices = [["A","이 방에서 보낸 시간의 기억"],["B","새 집에 대한 걱정"],["C","이사 준비에 대한 짜증"],["D","빨리 떠나고 싶은 마음"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "이 문장에서 '나'가 떠올린 기억이 아닌 것은 무엇인가요?";
      choices = [["A","베란다에서 놀이터를 내려다보던 시간"],["B","처음 방을 갖게 되어 기뻐하던 날"],["C","시험 전날 밤늦도록 공부하던 시간"],["D","친구와 전화로 웃던 저녁"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 문장에서 '나'가 떠나는 순간에야 알게 된 것은 무엇인가요?";
      choices = [["A","기억이 쌓이면 방이 특별한 장소가 된다는 것"],["B","방은 항상 똑같은 공간에 불과하다는 것"],["C","새 집이 훨씬 좋을 것이라는 확신"],["D","이사를 자주 하는 것이 좋다는 교훈"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","텅 빈 방에서 추억을 떠올리며 기억이 공간을 특별하게 만든다는 것을 깨닫는다"],["B","이사 날 방 청소를 깨끗이 마쳤다"],["C","방이 비어 있어 아무 감정도 느끼지 못했다"],["D","새 집으로 빨리 가고 싶어 서둘러 나왔다"]],
    "A"
  ));

  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이삿짐 트럭이 도착하자 부모님이 한 일은 무엇인가요?";
      choices = [["A","부지런히 짐을 옮기기 시작하셨다"],["B","트럭을 보고 이사를 취소하셨다"],["C","이웃에게 인사를 다니셨다"],["D","짐 정리를 내일로 미루셨다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "'나'가 마지막으로 간 장소는 어디인가요?";
      choices = [["A","베란다"],["B","놀이터"],["C","거실"],["D","현관"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "베란다에서 내려다보이는 풍경은 무엇이었나요?";
      choices = [["A","놀이터"],["B","학교 운동장"],["C","큰 공원"],["D","주차장"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "놀이터에서 떠올린 어린 시절의 기억은 무엇인가요?";
      choices = [["A","소꿉놀이와 그네를 타던 기억"],["B","축구를 하던 기억"],["C","강아지와 산책하던 기억"],["D","자전거를 타다 넘어진 기억"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "놀이터 너머 슈퍼마켓에서 했던 일은 무엇인가요?";
      choices = [["A","친구들과 아이스크림을 사 먹었다"],["B","학용품을 사러 갔다"],["C","엄마 심부름으로 우유를 사 왔다"],["D","슈퍼 아저씨와 이야기를 나누었다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 '나'의 마음은 어떠했나요?";
      choices = [["A","코끝이 찡하면서도 따뜻했다는 고마운 마음이 올라왔다"],["B","떠나게 되어 홀가분하고 후련했다"],["C","화가 나서 이사를 거부하고 싶었다"],["D","아무 감정 없이 담담했다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","베란다에서 놀이터와 동네를 바라보며 추억에 잠기고 감사의 마음을 느낀다"],["B","이삿짐을 옮기느라 추억을 떠올릴 여유가 없었다"],["C","놀이터가 싫어서 빨리 떠나고 싶었다"],["D","슈퍼에서 마지막으로 과자를 사 먹었다"]],
    "A"
  ));

  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "새 아파트에 도착했을 때 눈에 들어온 것은 무엇인가요?";
      choices = [["A","낯선 냄새와 넓어진 거실"],["B","예쁜 벽지와 따뜻한 바닥"],["C","이미 정리된 가구들"],["D","반갑게 맞이하는 이웃"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "새 방이 차갑게 느껴진 이유는 무엇인가요?";
      choices = [["A","아직 아무 흔적도 없었기 때문이다"],["B","난방이 되지 않았기 때문이다"],["C","창문이 열려 있었기 때문이다"],["D","방이 너무 작았기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "'나'가 새 벽에 붙이기 시작한 것은 무엇인가요?";
      choices = [["A","옛집 벽에 붙여 두었던 사진들"],["B","새로 산 포스터"],["C","야광 별 스티커"],["D","학교 시간표"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "벽에 붙인 사진으로 언급되지 않은 것은 무엇인가요?";
      choices = [["A","유치원 졸업 사진"],["B","수학여행 단체 사진"],["C","바다 배경 가족 사진"],["D","반려견 콩이와 찍은 셀카"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "처음 보는 거리를 보았을 때 '나'의 감정은 무엇이었나요?";
      choices = [["A","두려움보다 설렘이 더 크게 다가왔다"],["B","무서워서 커튼을 쳐 버렸다"],["C","아무 감정도 들지 않았다"],["D","옛 동네가 그리워 울었다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장에서 텅 빈 방을 어떻게 표현했나요?";
      choices = [["A","가능성으로 가득 찬 공간처럼 느껴졌다"],["B","채울 수 없는 쓸쓸한 곳이라 생각했다"],["C","다시 이사 가고 싶은 공간이라 여겼다"],["D","옛집보다 못한 곳이라 실망했다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","새 방에 사진을 붙이며 익숙함을 만들고 새 동네에 대한 설렘과 가능성을 느낀다"],["B","새 방이 마음에 들지 않아 옛집으로 돌아가고 싶었다"],["C","이삿짐을 정리하다 지쳐서 바로 잠이 들었다"],["D","새 동네 친구들이 바로 찾아와 인사했다"]],
    "A"
  ));

  const fullText = p1text + "\n" + p2text + "\n" + p3text;
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
  }

  const confirmQs = [
    makeConfirmQ("q1", "텅 빈 방의 천장에 아직 남아 있던 것은 무엇인가요?",
      [findRange(paragraphs, "p1", "야광 별 스티커")]),
    makeConfirmQ("q2", "'나'가 떠나는 순간에야 알게 된 것은 기억이 쌓이면 방이 어떻게 된다는 것인가요?",
      [findRange(paragraphs, "p1", "특별한 장소가 된다")]),
    makeConfirmQ("q3", "베란다에서 내려다보이는 곳은 어디인가요?",
      [findRange(paragraphs, "p2", "놀이터")]),
    makeConfirmQ("q4", "놀이터 너머 슈퍼마켓에서 친구들과 사 먹던 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "아이스크림")]),
    makeConfirmQ("q5", "새 방 벽에 붙인 사진 중 반려견의 이름은 무엇인가요?",
      [findRange(paragraphs, "p3", "콩이")]),
    makeConfirmQ("q6", "텅 빈 방을 '나'는 어떤 공간으로 느꼈나요?",
      [findRange(paragraphs, "p3", "가능성으로 가득 찬 공간")])
  ];

  return makeContent(48, "LITERATURE", "일일 독해(프레게 3) Day 48 문학",
    paragraphs, timeline, cards, confirmQs);
}

// === Day 49 비문학: 바람의 종류와 역할 (기상학) ===
// p1: 6문장, p2: 6문장, p3: 6문장, 총 950~1050자
function buildDay49() {
  const p1text = "바람은 공기가 기압이 높은 곳에서 낮은 곳으로 이동하는 현상이다. 태양이 지표면을 고르지 않게 가열하면, 뜨거워진 곳의 공기는 가벼워져 위로 올라가고 주변의 차가운 공기가 그 빈자리를 채우면서 바람이 생긴다. 바람의 세기와 방향은 기압 차이, 지구의 자전, 지형의 영향 등 여러 요인에 의해 결정된다. 기압 차이가 클수록 바람은 더 세게 불며, 지구의 자전은 바람의 방향을 비틀어 북반구에서는 오른쪽으로 휘게 만든다. 이처럼 바람은 단순히 공기가 움직이는 것이 아니라, 여러 요인이 복합적으로 작용하여 만들어지는 대기 현상이다. 바람은 빨래를 말려 주고 연을 날게 하는 친숙한 존재이지만, 그 뒤에는 기압과 온도라는 과학 원리가 숨어 있다.";
  const p2text = "바람은 발생하는 범위와 원인에 따라 여러 종류로 나뉜다. 해풍과 육풍은 바다와 육지의 온도 차이로 생기는 바람이다. 낮에는 육지가 바다보다 빨리 데워져서 바다 쪽에서 시원한 해풍이 불어오고, 밤에는 반대로 육지가 빨리 식기 때문에 육지에서 바다로 육풍이 분다. 산곡풍은 산과 골짜기 사이에서 생기는 바람으로, 낮에는 골짜기에서 산으로, 밤에는 산에서 골짜기로 분다. 지구 전체 규모로 보면 적도와 극지방의 온도 차이가 만드는 무역풍, 편서풍, 극동풍 같은 대규모 바람이 존재한다. 이러한 대규모 바람들은 전 세계의 날씨와 기후에 큰 영향을 미친다.";
  const p3text = "바람은 자연과 인간 생활 모두에 다양한 역할을 한다. 바람은 수증기를 운반하여 비와 눈을 내리게 하고, 식물의 꽃가루를 멀리 퍼뜨려 번식을 돕는다. 또한 대기 중의 오염 물질을 흩어 보내 공기를 정화하는 기능도 한다. 인간은 범선으로 먼 바다를 항해하고 풍차로 곡식을 빻는 등 오래전부터 바람의 힘을 이용해 왔다. 오늘날에는 풍력 발전기를 설치하여 바람 에너지를 전기로 바꾸는 기술이 친환경 에너지로 주목받고 있다. 그러나 태풍이나 토네이도처럼 지나치게 강한 바람은 건물을 무너뜨리고 인명 피해를 일으키기도 하므로, 바람에 대한 이해와 대비가 반드시 필요하다.";

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

  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에서 바람이 생기는 기본 원리는 무엇인가요?";
      choices = [["A","공기가 기압이 높은 곳에서 낮은 곳으로 이동하는 것이다"],["B","지구 자전이 공기를 한 방향으로 밀어내는 것이다"],["C","구름이 움직이면서 공기를 끌고 가는 것이다"],["D","나무가 흔들리면서 공기를 밀어내는 것이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "태양이 지표면을 고르지 않게 가열하면 어떤 일이 일어나나요?";
      choices = [["A","뜨거운 곳의 공기가 올라가고 차가운 공기가 빈자리를 채운다"],["B","모든 곳의 공기가 동시에 올라간다"],["C","차가운 공기가 먼저 올라간다"],["D","공기가 전혀 움직이지 않는다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "바람의 세기와 방향을 결정하는 요인이 아닌 것은 무엇인가요?";
      choices = [["A","바다의 염분 농도"],["B","기압 차이"],["C","지구 자전"],["D","지형"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "기압 차이가 클수록 바람은 어떠해지나요?";
      choices = [["A","더 세게 분다"],["B","더 약하게 분다"],["C","방향만 바뀐다"],["D","바람이 멈춘다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 문장에서 바람을 설명하는 핵심 내용은 무엇인가요?";
      choices = [["A","여러 요인이 복합적으로 작용하여 만들어지는 대기 현상이다"],["B","항상 같은 방향으로만 분다"],["C","오직 온도에 의해서만 결정된다"],["D","인간이 만들어 낼 수 있다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "바람 뒤에 숨어 있는 과학 원리는 무엇인가요?";
      choices = [["A","기압과 온도"],["B","중력과 자기장"],["C","습도와 강수량"],["D","일조량과 구름"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","바람은 기압 차이로 생기며 여러 요인이 방향과 세기를 결정한다"],["B","바람은 항상 일정한 세기로 불며 변하지 않는다"],["C","바람은 오직 지구 자전으로만 만들어진다"],["D","바람은 구름이 이동하면서 생긴다"]],
    "A"
  ));

  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "바람을 분류하는 기준으로 이 문장에서 언급한 것은 무엇인가요?";
      choices = [["A","발생 범위와 원인"],["B","바람의 색깔과 냄새"],["C","바람이 부는 계절"],["D","바람의 습도"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "해풍과 육풍이 생기는 원인은 무엇인가요?";
      choices = [["A","바다와 육지의 온도 차이"],["B","산과 골짜기의 높이 차이"],["C","적도와 극지방의 기압 차이"],["D","구름의 이동 방향"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "낮에 바다에서 육지로 부는 바람은 무엇인가요?";
      choices = [["A","해풍"],["B","육풍"],["C","산곡풍"],["D","편서풍"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "산곡풍에서 낮에 바람이 부는 방향은 어디인가요?";
      choices = [["A","골짜기에서 산으로"],["B","산에서 골짜기로"],["C","남쪽에서 북쪽으로"],["D","동쪽에서 서쪽으로"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "대규모 바람의 예시로 언급되지 않은 것은 무엇인가요?";
      choices = [["A","계절풍"],["B","무역풍"],["C","편서풍"],["D","극동풍"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "대규모 바람이 미치는 영향은 무엇인가요?";
      choices = [["A","전 세계의 날씨와 기후에 큰 영향을 미친다"],["B","한 지역에만 영향을 준다"],["C","날씨에는 영향이 없다"],["D","오직 바다 위에서만 영향을 미친다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","바람은 원인과 범위에 따라 해풍, 육풍, 산곡풍, 무역풍 등 다양하게 나뉜다"],["B","바람은 한 가지 종류만 존재한다"],["C","해풍과 육풍은 같은 방향으로 부는 바람이다"],["D","대규모 바람은 날씨에 영향을 주지 않는다"]],
    "A"
  ));

  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "바람이 역할을 하는 범위는 어디인가요?";
      choices = [["A","자연과 인간 생활"],["B","오직 바다 위에서만"],["C","산꼭대기에서만"],["D","사막 지역에서만"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "바람이 식물에게 하는 역할은 무엇인가요?";
      choices = [["A","꽃가루를 멀리 퍼뜨려 번식을 돕는다"],["B","잎을 모두 떨어뜨려 성장을 멈추게 한다"],["C","뿌리를 뽑아 다른 곳으로 옮긴다"],["D","씨앗을 한곳에 모아 놓는다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "바람이 대기에서 하는 정화 기능은 무엇인가요?";
      choices = [["A","오염 물질을 흩어 보내 공기를 정화한다"],["B","오염 물질을 한곳에 모아 제거한다"],["C","산소를 만들어 대기에 공급한다"],["D","이산화탄소를 분해하여 없앤다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "옛날 사람들이 바람을 이용한 방법이 아닌 것은 무엇인가요?";
      choices = [["A","바람으로 전기를 만들었다"],["B","범선으로 먼 바다를 항해하였다"],["C","풍차로 곡식을 빻았다"],["D","범선과 풍차 모두 이용하였다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "오늘날 풍력 발전이 주목받는 이유는 무엇인가요?";
      choices = [["A","화석 연료를 대체하는 친환경 에너지이기 때문이다"],["B","바람이 언제나 일정하게 불기 때문이다"],["C","설치 비용이 전혀 들지 않기 때문이다"],["D","모든 나라에서 의무적으로 사용하기 때문이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "강한 바람이 일으키는 문제는 무엇인가요?";
      choices = [["A","건물을 무너뜨리고 인명 피해를 일으킨다"],["B","공기를 너무 깨끗하게 만든다"],["C","바다의 수온을 낮춘다"],["D","식물이 너무 빨리 자라게 한다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","바람은 자연과 인간에게 다양한 이로움을 주지만 강한 바람에 대한 대비도 필요하다"],["B","바람은 인간에게 해로움만 주는 현상이다"],["C","풍력 발전은 아직 실용화되지 않았다"],["D","바람은 식물 성장에 전혀 도움이 되지 않는다"]],
    "A"
  ));

  const fullText = p1text + "\n" + p2text + "\n" + p3text;
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
  }

  const confirmQs = [
    makeConfirmQ("q1", "바람은 공기가 어떤 곳에서 어떤 곳으로 이동하는 현상인가요?",
      [findRange(paragraphs, "p1", "기압이 높은 곳에서 낮은 곳으로")]),
    makeConfirmQ("q2", "낮에 바다에서 육지로 부는 바람을 무엇이라 하나요?",
      [findRange(paragraphs, "p2", "해풍")]),
    makeConfirmQ("q3", "산곡풍에서 낮에 바람이 부는 방향은 어디에서 어디로인가요?",
      [findRange(paragraphs, "p2", "골짜기에서 산으로")]),
    makeConfirmQ("q4", "바람이 식물의 번식을 돕는 방법은 무엇인가요?",
      [findRange(paragraphs, "p3", "꽃가루를 멀리 퍼뜨려")]),
    makeConfirmQ("q5", "오늘날 바람 에너지를 전기로 바꾸는 장치는 무엇인가요?",
      [findRange(paragraphs, "p3", "풍력 발전기")]),
    makeConfirmQ("q6", "지나치게 강한 바람의 예로 언급된 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "태풍이나 토네이도")])
  ];

  return makeContent(49, "NONFICTION", "일일 독해(프레게 3) Day 49 비문학",
    paragraphs, timeline, cards, confirmQs);
}

// === Day 50 문학: 오래된 책방 주인 할아버지 (동화풍 소설) ===
// p1: 6문장, p2: 6문장, p3: 6문장, 총 950~1050자
function buildDay50() {
  const p1text = "골목 끝에 간판도 없는 작은 책방이 있었다. 나무 문을 밀고 들어서면 천장까지 닿을 듯 높이 쌓인 책들 사이로 종이와 먼지가 뒤섞인 독특한 냄새가 코를 감쌌다. 책방 안쪽 낡은 흔들의자에는 늘 백발의 할아버지가 앉아 돋보기를 코끝에 걸치고 두꺼운 양장본 책을 읽고 계셨다. 동네 아이들은 할아버지를 책 도깨비라고 불렀지만, 나는 왠지 그 별명이 마음에 들지 않았다. 할아버지는 손님이 오면 반갑다는 말 대신 조용히 고개를 끄덕이셨고, 가끔 빛바랜 양철 주전자에서 보리차를 따라 건네주셨다. 그 따뜻한 보리차 한 잔이 할아버지의 환영 인사였다.";
  const p2text = "어느 비 오는 날, 우산을 놓고 와서 비를 피하려고 책방으로 뛰어 들어갔다. 할아버지는 수건 한 장을 건네주셨고, 나는 젖은 머리를 닦으며 책장 사이를 둘러보다 손이 가는 대로 한 권을 꺼냈다. 할아버지가 처음으로 말을 거시며, 그 책은 젊었을 때 백 번도 넘게 읽은 책이라 하셨다. 첫 장을 펼치자 여백마다 연필로 빼곡하게 적힌 메모와 감탄 부호, 물음표가 가득했다. 할아버지는 좋은 책은 읽을 때마다 다른 이야기를 들려준다며 조용히 웃으셨다. 그때는 그 말을 완전히 이해하지 못했지만, 메모가 가득한 책을 들고 있으니 책이 살아 있는 것처럼 느껴졌다.";
  const p3text = "비가 그치고도 한참 동안 책을 읽다가 해가 기울어서야 책방을 나섰다. 돌아오는 길에 할아버지가 건네주신 종이봉투 안에는 얇은 동화책 한 권이 있었고, 표지에는 네가 읽을 차례라는 짧은 글이 적혀 있었다. 집에 돌아와 동화책을 펼치자 오래된 종이에서 책방의 냄새가 희미하게 풍겨 왔고, 나는 단번에 이야기 속으로 빠져들었다. 다 읽고 나서 나도 할아버지처럼 여백에 짧은 감상을 적어 보았다. 다음 날 동화책을 돌려드리자 할아버지는 내 메모를 천천히 읽으시더니 처음으로 활짝 웃으셨다. 그 환한 웃음을 보는 순간, 책을 읽고 생각을 나누는 일이 사람과 사람 사이를 이어 주는 다리가 될 수 있다는 것을 어렴풋이 알게 되었다.";

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

  s1.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p1", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "이 문장에서 책방의 특징은 무엇인가요?";
      choices = [["A","골목 끝에 간판도 없는 작은 책방이다"],["B","번화가에 큰 간판이 달린 서점이다"],["C","학교 안에 있는 도서관이다"],["D","온라인으로만 운영되는 서점이다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "책방에 들어서면 느낄 수 있는 것은 무엇인가요?";
      choices = [["A","종이와 먼지가 뒤섞인 독특한 냄새"],["B","꽃향기와 음악 소리"],["C","새 책의 잉크 냄새"],["D","커피와 빵 냄새"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "할아버지가 책을 읽을 때의 모습은 어떠했나요?";
      choices = [["A","돋보기를 코끝에 걸치고 양장본 책을 읽으셨다"],["B","안경 없이 작은 문고본을 읽으셨다"],["C","서서 신문을 읽으셨다"],["D","텔레비전을 보며 쉬고 계셨다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "동네 아이들이 할아버지를 부르는 별명은 무엇인가요?";
      choices = [["A","책 도깨비"],["B","책 박사"],["C","이야기 할아버지"],["D","골목 대장"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "할아버지가 손님을 맞이하는 방식은 무엇인가요?";
      choices = [["A","조용히 고개를 끄덕이고 보리차를 따라 주셨다"],["B","큰 소리로 환영 인사를 하셨다"],["C","문 앞까지 나가 맞이하셨다"],["D","추천 도서를 바로 건네셨다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "할아버지의 환영 인사 역할을 한 것은 무엇인가요?";
      choices = [["A","따뜻한 보리차 한 잔"],["B","새 책 한 권"],["C","사탕 한 개"],["D","따뜻한 악수"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","간판 없는 작은 책방에서 과묵하지만 따뜻한 할아버지가 보리차로 손님을 맞이한다"],["B","할아버지는 책을 팔기 위해 적극적으로 권유한다"],["C","아이들은 책방을 무서운 곳으로 여겨 가지 않는다"],["D","책방은 최근에 새로 문을 연 깨끗한 서점이다"]],
    "A"
  ));

  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "'나'가 책방으로 뛰어 들어간 이유는 무엇인가요?";
      choices = [["A","우산을 놓고 와서 비를 피하려고"],["B","할아버지를 만나 이야기를 나누려고"],["C","새로 나온 책을 사려고"],["D","친구와 약속이 있어서"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "젖은 머리를 닦은 뒤 '나'가 한 행동은 무엇인가요?";
      choices = [["A","책장 사이를 둘러보다 한 권을 꺼냈다"],["B","바로 집으로 돌아갔다"],["C","할아버지에게 말을 걸었다"],["D","보리차를 달라고 요청했다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "할아버지가 그 책에 대해 한 말은 무엇인가요?";
      choices = [["A","젊었을 때 백 번도 넘게 읽은 책이라고 하셨다"],["B","어제 처음 받은 새 책이라고 하셨다"],["C","빌려온 책이니 조심하라고 하셨다"],["D","팔려고 내놓은 책이라고 하셨다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "책의 여백에 가득한 것은 무엇이었나요?";
      choices = [["A","연필 메모와 감탄 부호, 물음표"],["B","다른 손님의 낙서"],["C","출판사의 인쇄 실수"],["D","색연필로 그린 그림"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "할아버지가 좋은 책에 대해 하신 말은 무엇인가요?";
      choices = [["A","읽을 때마다 다른 이야기를 들려준다"],["B","한 번만 읽으면 충분하다"],["C","어려운 책만이 좋은 책이다"],["D","많이 팔리는 책이 좋은 책이다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "메모가 가득한 책을 들고 있을 때 '나'의 느낌은 어떠했나요?";
      choices = [["A","책이 살아 있는 것처럼 느껴졌다"],["B","글씨가 지저분하여 읽기 불편했다"],["C","메모를 지우고 싶었다"],["D","할아버지가 이상한 사람 같았다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","비를 피해 들어간 책방에서 할아버지의 메모가 가득한 책을 통해 책 읽기의 깊이를 엿본다"],["B","비가 올 때마다 책방에서 보리차를 마신다"],["C","할아버지는 책을 빌려 주지 않고 반드시 사게 한다"],["D","책방의 모든 책에는 할아버지의 메모가 적혀 있다"]],
    "A"
  ));

  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "'나'가 책방을 나선 시간은 언제인가요?";
      choices = [["A","해가 기울어서야 나섰다"],["B","비가 그치자마자 나섰다"],["C","밤이 되어서야 나섰다"],["D","점심시간에 나섰다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "동화책 표지에 적힌 할아버지의 글은 무엇인가요?";
      choices = [["A","네가 읽을 차례"],["B","다시 가져와 주렴"],["C","이 책은 비매품이다"],["D","소중히 간직하렴"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "동화책을 펼쳤을 때 풍겨 온 것은 무엇인가요?";
      choices = [["A","책방의 냄새"],["B","꽃향기"],["C","새 종이 냄새"],["D","보리차 향"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "다 읽고 나서 '나'가 한 행동은 무엇인가요?";
      choices = [["A","할아버지처럼 여백에 짧은 감상을 적었다"],["B","책을 친구에게 빌려주었다"],["C","책방에 가지 않고 집에서 쉬었다"],["D","동화책을 서랍에 넣고 잊어버렸다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "할아버지가 '나'의 메모를 읽고 보인 반응은 무엇인가요?";
      choices = [["A","처음으로 활짝 웃으셨다"],["B","고개를 가로저으셨다"],["C","메모를 지우라고 하셨다"],["D","아무 반응도 보이지 않으셨다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "'나'가 어렴풋이 알게 된 것은 무엇인가요?";
      choices = [["A","책을 읽고 생각을 나누는 일이 사람 사이를 이어 주는 다리가 될 수 있다는 것"],["B","책방에서 책을 사는 것이 가장 중요하다는 것"],["C","할아버지가 유명한 작가라는 사실"],["D","동화책은 어린이만 읽어야 한다는 것"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","할아버지가 준 동화책에 감상을 적고 나누며 책이 사람을 이어 주는 다리가 됨을 깨닫는다"],["B","동화책을 돌려주지 않고 집에 보관하였다"],["C","할아버지는 나의 메모를 보고 화를 내셨다"],["D","책방은 다음 날부터 문을 닫았다"]],
    "A"
  ));

  const fullText = p1text + "\n" + p2text + "\n" + p3text;
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
  }

  const confirmQs = [
    makeConfirmQ("q1", "동네 아이들이 할아버지를 부르는 별명은 무엇인가요?",
      [findRange(paragraphs, "p1", "책 도깨비")]),
    makeConfirmQ("q2", "할아버지가 손님에게 따라 주시는 것은 무엇인가요?",
      [findRange(paragraphs, "p1", "보리차")]),
    makeConfirmQ("q3", "할아버지가 좋은 책에 대해 하신 말은 무엇인가요?",
      [findRange(paragraphs, "p2", "읽을 때마다 다른 이야기를 들려준다")]),
    makeConfirmQ("q4", "동화책 표지에 할아버지가 적어 놓은 문장은 무엇인가요?",
      [findRange(paragraphs, "p3", "네가 읽을 차례")]),
    makeConfirmQ("q5", "할아버지가 나의 메모를 읽고 보인 반응은 무엇인가요?",
      [findRange(paragraphs, "p3", "활짝 웃으셨다")]),
    makeConfirmQ("q6", "나가 알게 된 것은 책을 읽고 생각을 나누는 일이 무엇이 될 수 있다는 것인가요?",
      [findRange(paragraphs, "p3", "사람과 사람 사이를 이어 주는 다리")])
  ];

  return makeContent(50, "LITERATURE", "일일 독해(프레게 3) Day 50 문학",
    paragraphs, timeline, cards, confirmQs);
}

// === 메인 실행 ===
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const batchPath = path.join(ROOT, 'generated', 'daily-batch-reading-frege3.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'frege3');

  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

  const days = [
    { dayIndex: 46, builder: buildDay46 },
    { dayIndex: 47, builder: buildDay47 },
    { dayIndex: 48, builder: buildDay48 },
    { dayIndex: 49, builder: buildDay49 },
    { dayIndex: 50, builder: buildDay50 }
  ];

  const results = [];
  for (const { dayIndex, builder } of days) {
    const content = builder();
    const subArea = content.subArea;

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

    const batchIdx = dayIndex - 1;
    const batchItem = makeBatchItem(dayIndex, subArea, content);
    if (batchIdx < batch.items.length) {
      batch.items[batchIdx] = batchItem;
      console.log(`  배치 items[${batchIdx}] 교체 완료`);
    } else {
      batch.items.push(batchItem);
      console.log(`  배치 items에 추가 (인덱스: ${batch.items.length - 1})`);
    }

    const nn = String(dayIndex).padStart(3, '0');
    const staticPath = path.join(staticDir, `${nn}.json`);
    fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf-8');
    console.log(`  static 파일 작성: ${nn}.json`);

    results.push({ dayIndex, totalChars, cardCount, confirmCount, timelineCount });
  }

  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf-8');
  console.log('\n배치 파일 저장 완료:', batchPath);

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
