const fs = require('fs');
const path = require('path');

// === 유틸리티 함수 ===
function findSentences(text) {
  const sentences = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' || text[i] === '다' || text[i] === '다') {
      // 마침표 기반 문장 분리
      if (text[i] === '.') {
        const nextChar = text[i + 1];
        if (i === text.length - 1 || nextChar === ' ' || nextChar === '\n' || nextChar === '"' || nextChar === undefined) {
          let endPos = i + 1;
          // 마침표 뒤 따옴표까지 포함
          if (text[endPos] === '"') endPos++;
          sentences.push({ start, end: endPos, text: text.substring(start, endPos) });
          let next = endPos;
          while (next < text.length && (text[next] === ' ' || text[next] === '\n')) next++;
          start = next;
        }
      }
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

function hashIdx(dayIndex) {
  return dayIndex - 1;
}

function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen);
}

function shuffleChoices(choices) {
  return choices;
}

function buildTimeline(paragraphs, questionsPerParagraph) {
  let stepNum = 0;
  const timeline = [];
  paragraphs.forEach((para, pIdx) => {
    const sentences = findSentences(para.text);
    const questions = questionsPerParagraph[pIdx];
    sentences.forEach((sent, sIdx) => {
      stepNum++;
      const r = [{ paragraphId: para.id, start: sent.start, end: sent.end }];
      if (questions && questions[sIdx]) {
        const q = questions[sIdx];
        timeline.push(makeStep(`s${stepNum}`, r, q.prompt, q.choices, q.answerId));
      }
    });
    if (questions && questions.summary) {
      stepNum++;
      const pq = questions.summary;
      timeline.push(makeStep(`s${stepNum}`,
        [{ paragraphId: para.id, start: 0, end: para.text.length }],
        "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
        pq.choices, pq.answerId));
    }
  });
  return timeline;
}

function buildRecallCards(paragraphs) {
  const fullText = paragraphs.map(p => p.text).join("\n");
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({ id: `c${i + 1}`, text: fullText.substring(start, end) });
  }
  return cards;
}

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, timeline, cards, confirmQs) {
  const dayStr = String(dayIndex).padStart(3, '0');
  return {
    contentId: `dr-f3-${dayStr}`,
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

function makeConfirmQ(id, prompt, ranges) {
  return {
    id, prompt, answerRanges: ranges,
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true, answerMatchMode: "ANY"
  };
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

// === Day 76 문학: 할머니의 수첩 ===
function buildDay76() {
  const p1text = "서랍 깊숙한 곳에서 낡은 수첩 한 권이 나왔다. 표지는 연한 갈색으로 바래 있었고, 모서리가 둥글게 닳아 수십 년의 세월이 고스란히 묻어 있었다. 수첩을 조심스럽게 펼치자 할머니의 단정하고 또박또박한 글씨가 빼곡하게 적혀 있었다. 첫 페이지에는 해마다 김장을 담글 때 쓰는 재료의 양이 꼼꼼하게 기록되어 있었다. 배추 열두 포기, 무 여섯 개, 고춧가루 서 말, 젓갈 한 단지, 소금 두 되. 그 옆에는 '올해는 소금을 조금 덜 넣어 볼 것'이라는 작은 메모가 연필로 끼어 있었다. 수십 년 동안 해마다 김장을 담그면서도 할머니는 늘 더 나은 맛을 찾으려 끊임없이 궁리했던 것이다.";
  const p2text = "수첩의 중간 부분에는 가족들의 생일과 기념일이 달력처럼 정성스레 적혀 있었다. 아버지의 생일 옆에는 '국수를 좋아한다'는 메모가, 어머니의 결혼 기념일 옆에는 '장미꽃을 좋아하신다'는 메모가 보였다. 손자인 나의 생일 옆에는 '딸기 케이크, 초 일곱 개'라고 쓰여 있었는데, 대체 몇 년 전에 적은 것인지 알 수가 없었다. 이 짧은 기록 하나하나가 할머니가 가족 한 사람 한 사람을 얼마나 세심하게 챙겼는지를 소리 없이 말해 주고 있었다. 나는 수첩 속 글씨를 가만히 읽으며, 할머니가 설거지를 하시면서 콧노래를 흥얼거리던 따뜻한 부엌 풍경을 떠올렸다.";
  const p3text = "수첩의 마지막 페이지에는 오늘도 가족 모두 건강하니 감사하다는 짧은 문장 하나가 적혀 있었다. 마침표 뒤에 작은 하트 모양이 정성스럽게 그려져 있었다. 나는 그 문장을 소리 내어 읽다가 문득 목이 메어 한참 동안 말을 잇지 못했다. 할머니가 돌아가신 뒤에야 발견한 수첩이었기에, 글씨 하나하나가 더없이 소중하게 느껴졌다. 나는 수첩을 조심스럽게 닫아 책상 위에 올려놓고, 할머니가 매일 아침 마당에 나와 떠오르는 해를 바라보며 크게 기지개를 켜시던 모습을 떠올렸다. 그날 저녁, 나는 처음으로 일기장을 꺼내 오늘 하루에 감사한 일 세 가지를 적었다. 할머니의 수첩이 내게 작은 습관 하나를 물려준 셈이었다.";

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
      prompt = "이 문장에서 서랍 속에서 나온 물건은 무엇인가요?";
      choices = [["A","낡은 수첩 한 권"],["B","오래된 사진 한 장"],["C","할머니의 편지 봉투"],["D","빛바랜 손수건"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "수첩의 표지에서 세월을 느낄 수 있는 근거는 무엇인가요?";
      choices = [["A","연한 갈색으로 바래고 모서리가 둥글게 닳아 있었다"],["B","새로 산 것처럼 깨끗하고 빛이 났다"],["C","검은 가죽으로 단단하게 감싸여 있었다"],["D","비닐 커버가 씌워져 깨끗했다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "수첩을 펼쳤을 때 보인 것은 무엇인가요?";
      choices = [["A","할머니의 단정한 글씨"],["B","아이들이 그린 그림"],["C","인쇄된 요리 안내문"],["D","아버지의 메모"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "첫 페이지에 기록되어 있던 내용은 무엇인가요?";
      choices = [["A","김장 때 쓰는 재료의 양"],["B","가족의 전화번호"],["C","매일 먹은 식단"],["D","병원 진료 일정"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "이 문장에서 나열된 김장 재료가 아닌 것은 무엇인가요?";
      choices = [["A","마늘 다섯 접"],["B","배추 열두 포기"],["C","고춧가루 서 말"],["D","젓갈 한 단지"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "작은 메모에 적혀 있던 내용은 무엇인가요?";
      choices = [["A","올해는 소금을 조금 덜 넣어 볼 것"],["B","배추를 두 배로 늘릴 것"],["C","고춧가루 대신 고추를 쓸 것"],["D","젓갈을 빼고 담글 것"]];
      answerId = "A";
    } else if (i === 6) {
      prompt = "이 문장에서 알 수 있는 할머니의 태도는 무엇인가요?";
      choices = [["A","해마다 더 나은 맛을 찾으려 끊임없이 궁리했다"],["B","김장을 귀찮아하며 대충 담갔다"],["C","항상 같은 방법만 고집했다"],["D","다른 사람에게 김장을 맡겼다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","서랍에서 발견한 수첩에는 할머니의 정성 어린 김장 기록이 담겨 있었다"],["B","할머니는 김장을 하지 않고 사 먹는 것을 좋아했다"],["C","수첩에는 요리 레시피가 인쇄되어 있었다"],["D","서랍에서 나온 수첩은 아버지의 것이었다"]],
    "A"
  ));

  // p2 문장들
  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "수첩의 중간 부분에 적혀 있던 내용은 무엇인가요?";
      choices = [["A","가족들의 생일과 기념일"],["B","할머니의 일기"],["C","병원 처방전"],["D","동네 행사 일정"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "아버지의 생일 옆에 적힌 메모는 무엇인가요?";
      choices = [["A","국수를 좋아한다"],["B","떡을 좋아한다"],["C","고기를 좋아한다"],["D","생선을 좋아한다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "손자인 '나'의 생일 옆에 적힌 내용은 무엇인가요?";
      choices = [["A","딸기 케이크, 초 일곱 개"],["B","초콜릿 케이크, 초 열 개"],["C","크림빵과 우유"],["D","치킨과 콜라"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "짧은 기록들이 말해 주는 것은 무엇인가요?";
      choices = [["A","할머니가 가족을 세심하게 챙겼다는 것"],["B","할머니는 기록하는 습관이 없었다는 것"],["C","가족들이 할머니의 생일을 기억하고 있었다는 것"],["D","수첩은 가게의 장부로 쓰였다는 것"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "'나'가 수첩을 읽으며 떠올린 장면은 무엇인가요?";
      choices = [["A","할머니가 설거지를 하며 콧노래를 흥얼거리던 부엌 풍경"],["B","할머니가 마당에서 빨래를 널던 모습"],["C","할머니가 텔레비전을 보며 웃으시던 모습"],["D","할머니가 밭에서 일하시던 모습"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","수첩 속 기념일 기록은 가족을 세심하게 챙긴 할머니의 마음을 보여 준다"],["B","할머니는 기념일에 관심이 없어 기록을 남기지 않았다"],["C","나는 할머니의 수첩을 읽지 않고 다시 서랍에 넣었다"],["D","수첩에는 할머니의 여행 기록이 적혀 있었다"]],
    "A"
  ));

  // p3 문장들
  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "수첩의 마지막 페이지에 적힌 짧은 문장의 내용은 무엇인가요?";
      choices = [["A","가족 모두 건강하니 감사하다는 말"],["B","오늘 날씨가 좋으니 산책을 가자는 말"],["C","내일은 김장을 담가야 한다는 말"],["D","손자가 곧 방학이니 기쁘다는 말"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "마침표 뒤에 그려져 있던 것은 무엇인가요?";
      choices = [["A","작은 하트 모양"],["B","별 모양"],["C","꽃 그림"],["D","웃는 얼굴"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "'나'가 그 문장을 읽다가 어떻게 되었나요?";
      choices = [["A","목이 메어 한참 동안 말을 잇지 못했다"],["B","큰 소리로 웃었다"],["C","곧바로 잠이 들었다"],["D","화가 났다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "수첩이 더욱 소중하게 느껴진 까닭은 무엇인가요?";
      choices = [["A","할머니가 돌아가신 뒤에야 발견했기 때문이다"],["B","수첩의 가격이 매우 비쌌기 때문이다"],["C","유명한 작가가 쓴 책이었기 때문이다"],["D","친구에게 선물받은 것이기 때문이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "'나'가 떠올린 할머니의 모습은 무엇인가요?";
      choices = [["A","매일 아침 마당에서 해를 보며 기지개를 켜시던 모습"],["B","저녁마다 손자에게 동화를 읽어 주시던 모습"],["C","매주 시장에 나가 물건을 파시던 모습"],["D","밤마다 텔레비전 앞에 앉아 계시던 모습"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "그날 저녁 '나'가 처음으로 한 일은 무엇인가요?";
      choices = [["A","일기장에 감사한 일 세 가지를 적었다"],["B","할머니의 수첩을 버렸다"],["C","친구에게 편지를 썼다"],["D","가족에게 전화를 걸었다"]];
      answerId = "A";
    } else if (i === 6) {
      prompt = "할머니의 수첩이 '나'에게 물려준 것은 무엇인가요?";
      choices = [["A","작은 습관 하나"],["B","많은 돈"],["C","요리 실력"],["D","좋은 성적"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","할머니의 마지막 기록을 보고 나는 감사를 적는 습관을 시작하게 되었다"],["B","나는 수첩을 버리고 할머니를 잊기로 했다"],["C","할머니의 수첩에는 아무런 의미 있는 내용이 없었다"],["D","나는 수첩을 팔아 용돈을 마련했다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "서랍에서 발견한 수첩의 첫 페이지에 적힌 내용은 무엇에 관한 것인가요?",
      [findRange(paragraphs, "p1", "김장")]),
    makeConfirmQ("q2", "할머니가 올해 시도하려 했던 변화는 무엇인가요?",
      [findRange(paragraphs, "p1", "소금을 조금 덜 넣어 볼 것")]),
    makeConfirmQ("q3", "아버지의 생일 옆에 적힌 음식은 무엇인가요?",
      [findRange(paragraphs, "p2", "국수")]),
    makeConfirmQ("q4", "손자의 생일 옆에 적힌 케이크 종류는 무엇인가요?",
      [findRange(paragraphs, "p2", "딸기 케이크")]),
    makeConfirmQ("q5", "수첩 마지막 페이지의 마침표 뒤에 그려진 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "하트 모양")]),
    makeConfirmQ("q6", "그날 저녁 '나'가 일기장에 적은 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "감사한 일 세 가지")])
  ];

  return assembleFull(76, "LITERATURE", "문학", paragraphs, timeline, cards, confirmQs);
}

// === Day 77 비문학: 소리의 성질과 전달 ===
function buildDay77() {
  const p1text = "소리는 물체가 떨릴 때 주위의 공기 분자가 함께 진동하면서 만들어지는 파동이다. 기타의 줄을 튕기면 줄이 빠르게 떨리고, 그 떨림이 주변 공기를 밀었다가 당기면서 파동의 형태로 소리가 퍼져 나간다. 이때 공기 분자가 밀려서 빽빽해지는 부분을 밀한 부분, 벌어져 성긴 부분을 소한 부분이라 하며, 이 둘이 번갈아 나타나며 파동이 전달된다. 소리의 파동은 빛처럼 눈에 보이지 않지만, 공기 중에서 초속 약 삼백사십 미터의 속도로 이동한다. 온도가 높아지면 공기 분자의 운동이 활발해져서 소리의 속도 역시 빨라지게 된다. 따라서 같은 거리에서 여름에는 겨울보다 소리가 조금 더 빨리 도착하게 되는 것이다.";
  const p2text = "소리의 높낮이는 진동수에 의해 결정된다. 진동수란 일 초 동안 물체가 떨리는 횟수를 말하며, 단위로는 헤르츠를 사용한다. 진동수가 높으면 높은 소리가, 낮으면 낮은 소리가 난다. 예를 들어 바이올린의 가는 줄은 빠르게 떨려 높은 음을 내고, 첼로의 굵은 줄은 느리게 떨려서 낮은 음을 낸다. 사람의 귀가 들을 수 있는 소리의 범위는 약 이십 헤르츠에서 이만 헤르츠 사이인데, 이보다 낮은 소리를 초저주파, 높은 소리를 초음파라 부른다. 초음파는 의료 분야에서 몸속을 살피는 검사에 쓰이기도 하며, 박쥐는 초음파를 내보내고 되돌아오는 반향을 이용하여 어둠 속에서 먹이를 찾고 장애물을 피한다.";
  const p3text = "소리의 크기는 진폭에 따라 달라진다. 진폭이란 물체가 원래 위치에서 최대로 벌어지는 거리를 뜻하는데, 진폭이 클수록 큰 소리가 나고 작을수록 작은 소리가 난다. 북을 세게 치면 북의 가죽이 크게 떨려서 진폭이 커지므로 소리도 커지고, 살짝 치면 진폭이 작아 소리가 작다. 소리의 크기를 나타내는 단위로는 데시벨이 쓰이는데, 일상적인 대화는 약 육십 데시벨 정도이고 비행기의 이륙 소리는 백이십 데시벨에 이른다. 큰 소리에 오래 노출되면 청각 세포가 손상되어 소음성 난청이 생길 수 있으므로, 이어폰 사용 시간을 줄이고 주변 소음을 관리하는 것이 매우 중요하다.";

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
      prompt = "이 문장에서 소리가 만들어지는 원리는 무엇인가요?";
      choices = [["A","물체가 떨릴 때 공기 분자가 진동하여 파동이 생긴다"],["B","물체가 빛을 흡수하면서 소리가 발생한다"],["C","공기가 정지해 있을 때 소리가 만들어진다"],["D","물체가 회전하면서 소리가 발생한다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "기타 줄이 소리를 내는 과정은 어떠한가요?";
      choices = [["A","줄이 떨리며 주변 공기를 밀었다 당기면서 소리가 퍼진다"],["B","줄이 끊어지면서 소리가 난다"],["C","줄이 늘어나면서 열이 발생하여 소리가 난다"],["D","줄이 공기를 흡수하면서 소리가 생긴다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "공기 분자가 빽빽해지는 부분을 무엇이라 하나요?";
      choices = [["A","밀한 부분"],["B","소한 부분"],["C","진동 부분"],["D","파장 부분"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "소리가 공기 중에서 이동하는 속도는 약 얼마인가요?";
      choices = [["A","초속 약 삼백사십 미터"],["B","초속 약 백 미터"],["C","초속 약 천 미터"],["D","초속 약 오십 미터"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "온도가 높아지면 소리의 속도는 어떻게 변하나요?";
      choices = [["A","빨라진다"],["B","느려진다"],["C","변하지 않는다"],["D","들을 수 없게 된다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장이 말하는 핵심 내용은 무엇인가요?";
      choices = [["A","여름에는 겨울보다 소리가 더 빨리 도착한다"],["B","겨울에는 소리가 전혀 전달되지 않는다"],["C","소리의 속도는 계절과 관계가 없다"],["D","여름에는 소리가 들리지 않는다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","소리는 물체의 진동이 공기를 통해 파동으로 전달되며 온도에 따라 속도가 달라진다"],["B","소리는 빛과 같은 속도로 이동한다"],["C","소리는 진공에서 가장 빠르게 전달된다"],["D","소리는 물체의 색깔에 따라 달라진다"]],
    "A"
  ));

  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "소리의 높낮이를 결정하는 것은 무엇인가요?";
      choices = [["A","진동수"],["B","진폭"],["C","파장의 색깔"],["D","공기의 밀도"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "진동수의 단위는 무엇인가요?";
      choices = [["A","헤르츠"],["B","데시벨"],["C","미터"],["D","킬로그램"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "진동수가 높으면 어떤 소리가 나나요?";
      choices = [["A","높은 소리"],["B","낮은 소리"],["C","큰 소리"],["D","작은 소리"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "바이올린의 가는 줄이 높은 음을 내는 까닭은 무엇인가요?";
      choices = [["A","빠르게 떨려 진동수가 높기 때문이다"],["B","줄이 길어서 느리게 떨리기 때문이다"],["C","줄의 색깔이 밝기 때문이다"],["D","줄이 무거워 진폭이 크기 때문이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "사람의 귀가 들을 수 있는 소리의 범위는 얼마인가요?";
      choices = [["A","약 이십 헤르츠에서 이만 헤르츠 사이"],["B","약 백 헤르츠에서 천 헤르츠 사이"],["C","약 일 헤르츠에서 십 헤르츠 사이"],["D","약 십만 헤르츠 이상"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "초음파를 활용하는 예로 올바른 것은 무엇인가요?";
      choices = [["A","의료 분야에서 몸속을 살피는 데 쓰인다"],["B","음악을 연주하는 데 사용된다"],["C","건물을 짓는 데 활용된다"],["D","음식을 요리하는 데 쓰인다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","소리의 높낮이는 진동수에 의해 결정되며, 사람이 듣지 못하는 소리도 활용된다"],["B","모든 소리는 같은 높이로 들린다"],["C","진동수와 소리의 높낮이는 관계가 없다"],["D","초음파는 사람만 들을 수 있다"]],
    "A"
  ));

  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "소리의 크기를 결정하는 것은 무엇인가요?";
      choices = [["A","진폭"],["B","진동수"],["C","파장"],["D","속도"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "진폭이 클수록 소리는 어떻게 되나요?";
      choices = [["A","큰 소리가 난다"],["B","높은 소리가 난다"],["C","낮은 소리가 난다"],["D","소리가 사라진다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "북을 세게 치면 소리가 큰 까닭은 무엇인가요?";
      choices = [["A","가죽이 크게 떨려 진폭이 커지기 때문이다"],["B","북의 색깔이 진하기 때문이다"],["C","북의 무게가 가벼워지기 때문이다"],["D","북 안의 공기가 빠져나가기 때문이다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "소리의 크기를 나타내는 단위는 무엇인가요?";
      choices = [["A","데시벨"],["B","헤르츠"],["C","미터"],["D","킬로그램"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "큰 소리에 오래 노출되면 생길 수 있는 문제는 무엇인가요?";
      choices = [["A","소음성 난청"],["B","시력 저하"],["C","근육 경련"],["D","두통만 생긴다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","소리의 크기는 진폭에 따라 달라지며, 큰 소리에 오래 노출되면 청각이 손상될 수 있다"],["B","소리의 크기는 진동수에 의해 결정된다"],["C","모든 소리는 같은 크기로 들린다"],["D","이어폰을 사용하면 청각이 좋아진다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "소리가 공기 중에서 이동하는 속도는 약 얼마인가요?",
      [findRange(paragraphs, "p1", "초속 약 삼백사십 미터")]),
    makeConfirmQ("q2", "공기 분자가 밀려서 빽빽해지는 부분을 무엇이라 하나요?",
      [findRange(paragraphs, "p1", "밀한 부분")]),
    makeConfirmQ("q3", "진동수의 단위는 무엇인가요?",
      [findRange(paragraphs, "p2", "헤르츠")]),
    makeConfirmQ("q4", "사람이 들을 수 있는 소리보다 높은 소리를 무엇이라 부르나요?",
      [findRange(paragraphs, "p2", "초음파")]),
    makeConfirmQ("q5", "소리의 크기를 나타내는 단위는 무엇인가요?",
      [findRange(paragraphs, "p3", "데시벨")]),
    makeConfirmQ("q6", "큰 소리에 오래 노출되면 생길 수 있는 증상은 무엇인가요?",
      [findRange(paragraphs, "p3", "소음성 난청")])
  ];

  return assembleFull(77, "NONFICTION", "비문학", paragraphs, timeline, cards, confirmQs);
}

// === Day 78 문학: 빗소리와 피아노 ===
function buildDay78() {
  const p1text = "비가 오는 날이면 은서는 거실 창가에 턱을 괴고 빗소리에 귀를 기울였다. 처마 끝에서 떨어지는 빗방울이 마당의 넓은 돌판 위에 부딪히며 일정한 박자를 만들었고, 지붕 위로 쏟아지는 빗줄기는 먼 곳에서 울려오는 북소리처럼 낮게 퍼졌다. 은서에게 비는 하늘이 연주하는 아름다운 음악이었다. 어릴 때 피아노 학원을 다닌 적이 있었지만, 손가락이 건반에 닿는 순간마다 온몸이 긴장되어 끝내 몇 달 만에 그만두었다. 그 뒤로 은서는 악기를 전혀 만지지 않았지만, 음악을 듣는 것만큼은 여전히 마음 깊이 좋아했다. 특히 빗소리 속에서 숨은 리듬을 찾아내는 일이 은서만의 비밀스러운 작은 놀이였다.";
  const p2text = "어느 비 오는 토요일, 은서는 동네 도서관에 갔다가 복도 끝에 덩그러니 놓인 오래된 피아노를 발견했다. 뚜껑이 열려 있었고 건반 위에는 먼지가 살짝 쌓여 있었다. 주위에 아무도 없다는 것을 확인한 은서는 조심스럽게 의자를 당겨 앉았다. 왼손 검지로 건반 하나를 살짝 눌러 보았더니, 작고 맑은 소리가 조용한 복도를 따라 퍼져 나갔다. 그 소리가 창밖의 빗소리와 겹치는 순간, 은서의 가슴속에서 오래 잊고 있던 무언가가 따뜻하게 풀려 나왔다. 은서는 오른손을 올려 두 번째 건반을 눌렀고, 세 번째, 네 번째 건반으로 손가락이 저절로 옮겨 갔다. 어설프지만 그것은 틀림없이 멜로디였다.";
  const p3text = "은서가 건반을 하나씩 누르는 동안 창밖의 빗소리는 점점 잦아들었다. 마지막 건반을 누른 뒤 고개를 들자, 복도 반대편에서 도서관 사서 선생님이 조용히 미소 짓고 서 계셨다. 선생님은 박수를 치지 않으셨지만 고개를 끄덕이며 참 예쁜 소리였다고 말씀하셨다. 은서는 얼굴이 금세 붉어졌지만 입가에는 감출 수 없는 미소가 번져 나왔다. 도서관을 나서자 비는 이미 그쳐 있었고, 하늘 한쪽에 엷은 무지개가 걸려 있었다. 집으로 돌아오는 길에 은서는 다음 비 오는 날에도 꼭 와야지 하고 혼잣말로 중얼거렸다. 은서의 발걸음은 평소보다 한결 가볍고 경쾌했다.";

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
      prompt = "비가 오는 날 은서가 하는 행동은 무엇인가요?";
      choices = [["A","창가에 턱을 괴고 빗소리에 귀를 기울인다"],["B","밖으로 나가 우산을 쓰고 산책한다"],["C","방에서 책을 읽으며 시간을 보낸다"],["D","친구에게 전화를 걸어 수다를 떤다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "빗방울이 돌판 위에 부딪히며 만드는 것은 무엇인가요?";
      choices = [["A","일정한 박자"],["B","크고 무서운 소리"],["C","물웅덩이"],["D","돌판의 균열"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "은서에게 비는 어떤 존재인가요?";
      choices = [["A","하늘이 연주하는 아름다운 음악"],["B","귀찮고 불편한 날씨"],["C","공부를 방해하는 소음"],["D","잠을 부르는 자장가"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "은서가 피아노를 그만둔 까닭은 무엇인가요?";
      choices = [["A","건반에 손가락이 닿을 때마다 긴장이 되었기 때문이다"],["B","피아노 학원이 너무 멀었기 때문이다"],["C","부모님이 그만두라고 했기 때문이다"],["D","다른 악기를 배우고 싶었기 때문이다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "피아노를 그만둔 뒤에도 은서가 좋아한 것은 무엇인가요?";
      choices = [["A","음악을 듣는 것"],["B","그림을 그리는 것"],["C","운동을 하는 것"],["D","글을 쓰는 것"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "은서만의 작은 놀이는 무엇인가요?";
      choices = [["A","빗소리 속에서 숨은 리듬을 찾아내는 일"],["B","빗물을 모아 그림을 그리는 일"],["C","비 오는 날 친구와 전화하는 일"],["D","우산으로 빗소리를 막는 일"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","은서는 피아노를 그만두었지만 빗소리에서 음악을 찾으며 여전히 소리를 사랑한다"],["B","은서는 비가 오면 항상 밖으로 나가 뛰어 논다"],["C","은서는 피아노를 잘 쳐서 대회에 나갔다"],["D","은서는 음악에 전혀 관심이 없었다"]],
    "A"
  ));

  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "비 오는 토요일에 은서가 간 곳은 어디인가요?";
      choices = [["A","동네 도서관"],["B","피아노 학원"],["C","학교 음악실"],["D","친구네 집"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "복도 끝에서 은서가 발견한 것은 무엇인가요?";
      choices = [["A","오래된 피아노"],["B","새 기타"],["C","고장 난 라디오"],["D","낡은 축음기"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "은서가 의자에 앉기 전에 확인한 것은 무엇인가요?";
      choices = [["A","주위에 아무도 없다는 것"],["B","피아노의 조율 상태"],["C","도서관의 문 잠금 여부"],["D","건반의 먼지를 닦았는지"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "은서가 처음 건반을 누른 손가락은 어느 것인가요?";
      choices = [["A","왼손 검지"],["B","오른손 엄지"],["C","왼손 새끼손가락"],["D","오른손 검지"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "피아노 소리와 빗소리가 겹칠 때 은서에게 일어난 변화는 무엇인가요?";
      choices = [["A","잊고 있던 무언가가 따뜻하게 풀려 나왔다"],["B","갑자기 무서워져서 도망치고 싶었다"],["C","졸음이 쏟아져서 눈을 감았다"],["D","화가 나서 건반을 세게 눌렀다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "은서의 손가락이 건반을 옮겨 간 순서는 어떠한가요?";
      choices = [["A","두 번째, 세 번째, 네 번째 건반으로 이어졌다"],["B","한 건반만 계속 반복해서 눌렀다"],["C","건반을 누르지 않고 바라보기만 했다"],["D","거꾸로 높은 음에서 낮은 음으로 내려갔다"]];
      answerId = "A";
    } else if (i === 6) {
      prompt = "은서가 만들어 낸 소리를 가리키는 표현은 무엇인가요?";
      choices = [["A","어설프지만 틀림없이 멜로디였다"],["B","소음에 가까운 불쾌한 소리였다"],["C","전문 연주자의 완벽한 곡이었다"],["D","아무 의미 없는 단순한 소리였다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","도서관에서 오래된 피아노를 발견한 은서가 용기를 내어 건반을 누르며 멜로디를 만들어 낸다"],["B","은서는 도서관에서 피아노를 보고 무서워서 도망쳤다"],["C","도서관의 피아노는 망가져 소리가 나지 않았다"],["D","은서는 도서관에서 책만 읽고 돌아왔다"]],
    "A"
  ));

  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "은서가 건반을 누르는 동안 창밖의 빗소리는 어떻게 되었나요?";
      choices = [["A","점점 잦아들었다"],["B","더욱 세차게 내렸다"],["C","천둥소리로 바뀌었다"],["D","완전히 멈추고 바람이 불었다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "복도 반대편에서 은서를 지켜본 사람은 누구인가요?";
      choices = [["A","도서관 사서 선생님"],["B","은서의 어머니"],["C","피아노 선생님"],["D","같은 반 친구"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "선생님이 은서에게 전한 말의 내용은 무엇인가요?";
      choices = [["A","참 예쁜 소리였다고 말씀하셨다"],["B","여기서 피아노를 치면 안 된다고 하셨다"],["C","다음에는 더 연습해 오라고 하셨다"],["D","피아노를 닫아 놓으라고 하셨다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "선생님의 말을 들은 은서의 반응은 어떠했나요?";
      choices = [["A","얼굴이 붉어졌지만 미소가 번졌다"],["B","부끄러워서 울음을 터뜨렸다"],["C","기쁘다며 큰 소리로 웃었다"],["D","고개를 숙이고 말없이 떠났다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "도서관을 나서자 하늘에 보인 것은 무엇인가요?";
      choices = [["A","엷은 무지개"],["B","먹구름"],["C","밝은 별"],["D","비행기 구름"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "집으로 돌아오며 은서가 혼잣말로 한 다짐은 무엇인가요?";
      choices = [["A","다음 비 오는 날에도 꼭 와야지"],["B","이제 피아노는 그만둬야지"],["C","내일은 집에서 쉬어야지"],["D","친구에게 이 이야기를 해야지"]];
      answerId = "A";
    } else if (i === 6) {
      prompt = "집으로 돌아오는 은서의 발걸음은 어떠했나요?";
      choices = [["A","평소보다 한결 가볍고 경쾌했다"],["B","무겁고 힘들었다"],["C","뛰어서 위험했다"],["D","비틀거리며 느렸다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","선생님의 따뜻한 반응과 무지개를 보며 은서는 다시 피아노를 치러 오겠다고 다짐한다"],["B","선생님이 은서를 혼내서 은서는 다시 오지 않기로 했다"],["C","비가 그치지 않아 은서는 집에 돌아가지 못했다"],["D","은서는 피아노에 흥미를 잃고 다른 취미를 찾기로 했다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "은서가 피아노를 그만둔 까닭은 건반에 닿을 때마다 느낀 무엇 때문인가요?",
      [findRange(paragraphs, "p1", "긴장")]),
    makeConfirmQ("q2", "은서가 빗소리에서 찾아내는 것은 무엇인가요?",
      [findRange(paragraphs, "p1", "숨은 리듬")]),
    makeConfirmQ("q3", "은서가 도서관 복도 끝에서 발견한 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "오래된 피아노")]),
    makeConfirmQ("q4", "은서가 만들어 낸 소리를 가리키는 표현은 무엇인가요?",
      [findRange(paragraphs, "p2", "멜로디")]),
    makeConfirmQ("q5", "사서 선생님이 은서에게 전한 말의 내용은 무엇인가요?",
      [findRange(paragraphs, "p3", "참 예쁜 소리였다")]),
    makeConfirmQ("q6", "도서관을 나서자 하늘에 걸려 있던 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "무지개")])
  ];

  return assembleFull(78, "LITERATURE", "문학", paragraphs, timeline, cards, confirmQs);
}

// === Day 79 비문학: 지도와 축척 ===
function buildDay79() {
  const p1text = "지도는 넓은 땅의 모습을 종이나 화면 위에 일정한 비율로 줄여서 나타낸 그림이다. 실제 거리를 그대로 옮기면 종이가 끝없이 커져야 하므로, 정해진 비율로 줄이는 방법을 사용하게 된다. 이 비율을 축척이라 하며, 지도 위의 길이가 실제 거리의 몇 분의 일인지를 나타낸다. 예를 들어 축척이 일 대 오만이면, 지도 위의 일 센티미터가 실제로는 오만 센티미터, 곧 오백 미터에 해당한다. 축척이 클수록 좁은 범위를 자세하게 보여 주고, 작을수록 넓은 범위를 간략하게 보여 준다. 따라서 등산이나 마을 탐방처럼 좁은 지역을 살필 때에는 큰 축척의 지도를, 나라 전체의 모습을 한눈에 볼 때에는 작은 축척의 지도를 쓰는 것이 편리하다.";
  const p2text = "지도에는 축척 외에도 방위, 범례, 등고선 같은 다양한 요소가 함께 담겨 있다. 방위는 지도에서 동서남북의 방향을 알려 주며, 대부분의 지도에서 위쪽이 북쪽을 가리킨다. 범례는 지도에 쓰인 기호나 색깔이 무엇을 뜻하는지 설명하는 안내표이다. 예를 들어 파란색 선은 하천을, 초록색 영역은 숲을, 빨간색 점은 소방서를 나타내는 식이다. 등고선은 같은 높이의 지점을 이은 곡선인데, 등고선이 촘촘하면 경사가 급하고 넓으면 경사가 완만하다는 것을 뜻한다. 이러한 다양한 요소들을 함께 읽으면 실제로 가 보지 않고도 지형과 시설의 위치를 대략적으로 파악할 수 있게 된다.";
  const p3text = "오늘날에는 종이 지도 외에도 디지털 지도가 일상에서 널리 쓰이고 있다. 스마트폰의 지도 앱을 열면 현재 위치가 자동으로 화면에 표시되고, 손가락으로 화면을 확대하거나 축소하여 원하는 범위를 자유롭게 살펴볼 수 있다. 또한 인공위성이 촬영한 사진을 겹쳐 보여 주기 때문에, 건물의 모양이나 도로의 형태까지 생생하게 확인할 수 있다. 디지털 지도는 길 찾기 기능을 제공하여, 출발지와 도착지를 입력하면 가장 빠른 경로를 계산해서 안내해 준다. 그러나 배터리가 없거나 통신이 되지 않는 상황에서는 디지털 지도를 쓸 수 없으므로, 종이 지도를 읽는 능력도 여전히 중요하다. 결국 종이 지도와 디지털 지도는 각각의 장단점이 있어 상황에 맞게 골라 사용하는 것이 가장 현명한 방법이다.";

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
      prompt = "이 문장에서 지도를 정의하는 표현은 무엇인가요?";
      choices = [["A","넓은 땅의 모습을 줄여서 나타낸 그림"],["B","건물의 설계를 보여 주는 도면"],["C","하늘에서 본 위성 사진"],["D","길을 걸으며 그린 스케치"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "실제 거리를 그대로 옮기지 않는 까닭은 무엇인가요?";
      choices = [["A","종이가 끝없이 커져야 하기 때문이다"],["B","색깔을 칠할 수 없기 때문이다"],["C","글씨를 쓸 공간이 남지 않기 때문이다"],["D","지도의 무게가 너무 무거워지기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "축척이 뜻하는 것은 무엇인가요?";
      choices = [["A","지도 위의 길이가 실제 거리의 몇 분의 일인지 나타내는 비율"],["B","지도에 쓰인 색깔의 종류"],["C","지도가 만들어진 연도"],["D","지도의 종이 크기"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "축척이 일 대 오만일 때 지도 위 일 센티미터는 실제로 얼마인가요?";
      choices = [["A","오백 미터"],["B","오십 미터"],["C","오 킬로미터"],["D","오 미터"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "축척이 클수록 어떤 특징이 있나요?";
      choices = [["A","좁은 범위를 자세하게 보여 준다"],["B","넓은 범위를 간략하게 보여 준다"],["C","글씨가 더 작아진다"],["D","색깔이 더 선명해진다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "좁은 지역을 살필 때 적합한 지도는 무엇인가요?";
      choices = [["A","큰 축척의 지도"],["B","작은 축척의 지도"],["C","세계 전도"],["D","위성 사진만"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","지도는 축척을 이용하여 실제 거리를 줄여 나타내며, 축척에 따라 자세함이 달라진다"],["B","지도는 실제 크기와 같은 비율로 그린다"],["C","축척은 지도의 색깔을 결정한다"],["D","모든 지도는 같은 축척을 사용한다"]],
    "A"
  ));

  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "축척 외에 지도에 담겨 있는 요소로 언급된 것이 아닌 것은 무엇인가요?";
      choices = [["A","온도"],["B","방위"],["C","범례"],["D","등고선"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "대부분의 지도에서 위쪽이 가리키는 방향은 무엇인가요?";
      choices = [["A","북쪽"],["B","남쪽"],["C","동쪽"],["D","서쪽"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "범례의 역할은 무엇인가요?";
      choices = [["A","기호나 색깔이 무엇을 뜻하는지 설명한다"],["B","지도의 크기를 알려 준다"],["C","축척을 계산해 준다"],["D","지도의 제작 연도를 표시한다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "파란색 선이 나타내는 것은 무엇인가요?";
      choices = [["A","하천"],["B","도로"],["C","철도"],["D","등산로"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "등고선이 촘촘하면 경사는 어떠한가요?";
      choices = [["A","급하다"],["B","완만하다"],["C","평탄하다"],["D","알 수 없다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "지도의 여러 요소를 함께 읽으면 할 수 있는 일은 무엇인가요?";
      choices = [["A","가 보지 않고도 지형과 시설의 위치를 파악할 수 있다"],["B","실제 거리를 정확히 측정할 수 있다"],["C","날씨를 예측할 수 있다"],["D","건물의 내부 구조를 알 수 있다"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","방위, 범례, 등고선 등 다양한 요소를 읽으면 지형과 시설을 파악할 수 있다"],["B","지도에는 축척만 있으면 충분하다"],["C","등고선은 지도에서 사용하지 않는 요소이다"],["D","범례는 지도의 제목을 의미한다"]],
    "A"
  ));

  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "종이 지도 외에 오늘날 널리 쓰이는 것은 무엇인가요?";
      choices = [["A","디지털 지도"],["B","손으로 그린 약도"],["C","벽에 붙이는 포스터 지도"],["D","입체 모형 지도"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "스마트폰 지도 앱을 열면 자동으로 표시되는 것은 무엇인가요?";
      choices = [["A","현재 위치"],["B","날씨 정보"],["C","주변 맛집 목록"],["D","교통 사고 현황"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "인공위성 사진을 겹쳐 보여 줌으로써 확인할 수 있는 것은 무엇인가요?";
      choices = [["A","건물의 모양이나 도로의 형태"],["B","지하철 내부 구조"],["C","건물 안의 사람 수"],["D","실내 온도"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "디지털 지도의 길 찾기 기능이 제공하는 것은 무엇인가요?";
      choices = [["A","가장 빠른 경로를 계산하여 안내한다"],["B","주변 음식점의 메뉴를 보여 준다"],["C","실시간 날씨를 알려 준다"],["D","주변 사람들의 위치를 보여 준다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "디지털 지도를 쓸 수 없는 상황은 어떤 경우인가요?";
      choices = [["A","배터리가 없거나 통신이 되지 않을 때"],["B","날씨가 맑을 때"],["C","인터넷 속도가 빠를 때"],["D","화면이 너무 밝을 때"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "이 문장이 강조하는 가장 현명한 방법은 무엇인가요?";
      choices = [["A","종이 지도와 디지털 지도를 상황에 맞게 골라 사용하는 것"],["B","종이 지도만 사용하는 것"],["C","디지털 지도만 사용하는 것"],["D","지도를 사용하지 않는 것"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","디지털 지도와 종이 지도는 각각 장단점이 있어 상황에 맞게 골라 써야 한다"],["B","디지털 지도가 종이 지도를 완전히 대체했다"],["C","종이 지도는 더 이상 필요하지 않다"],["D","디지털 지도는 항상 정확하다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "지도 위의 길이와 실제 거리의 비율을 무엇이라 하나요?",
      [findRange(paragraphs, "p1", "축척")]),
    makeConfirmQ("q2", "축척이 일 대 오만일 때 지도 위 일 센티미터는 실제로 몇 미터인가요?",
      [findRange(paragraphs, "p1", "오백 미터")]),
    makeConfirmQ("q3", "지도에 쓰인 기호나 색깔의 뜻을 설명하는 안내표를 무엇이라 하나요?",
      [findRange(paragraphs, "p2", "범례")]),
    makeConfirmQ("q4", "같은 높이의 지점을 이은 곡선을 무엇이라 하나요?",
      [findRange(paragraphs, "p2", "등고선")]),
    makeConfirmQ("q5", "스마트폰 지도 앱을 열면 자동으로 표시되는 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "현재 위치")]),
    makeConfirmQ("q6", "디지털 지도를 쓸 수 없는 경우 여전히 중요한 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "종이 지도를 읽는 능력")])
  ];

  return assembleFull(79, "NONFICTION", "비문학", paragraphs, timeline, cards, confirmQs);
}

// === Day 80 문학: 작은 텃밭 ===
function buildDay80() {
  const p1text = "봄이 되자 아파트 옥상에 작은 텃밭이 만들어졌다. 관리소 아저씨가 나무 상자 열 개를 가지런히 늘어놓고 거름이 섞인 흙을 가득 채워 넣었고, 주민들은 저마다 한 상자씩 맡아 원하는 채소를 심기로 했다. 지우네 가족은 여러 후보 가운데 방울토마토를 골랐다. 아버지가 작은 모종 다섯 개를 흙에 정성스레 심고, 어머니가 물뿌리개로 물을 듬뿍 주었다. 지우는 바로 옆에 서서 모종이 따사로운 볕을 받으며 여린 줄기를 꼿꼿이 세우는 모습을 물끄러미 바라보았다. 아주 작은 초록 잎 두어 장이 따뜻한 봄바람에 살짝 흔들리는 것이 마치 새로 온 동네에 인사를 건네는 것 같았다.";
  const p2text = "모종을 심은 뒤부터 지우는 매일 아침 일찍 옥상에 올라가 물을 주었다. 처음에는 다소 귀찮기도 했지만, 잎이 하나 둘 늘어나고 줄기가 눈에 띄게 굵어지는 것을 볼 때마다 뿌듯하고 신기한 기분이 들었다. 며칠 뒤 작고 노란 꽃이 줄기 끝에 피어나자 지우는 학교에서 돌아오자마자 옥상으로 달려갔다. 꽃의 수가 하나씩 늘어날수록 지우의 발걸음도 점점 더 빨라졌다. 옆 상자에서 상추를 기르는 할머니가 지우에게 잎을 솎아 주는 방법과 물을 줄 적당한 시간을 친절하게 알려 주었고, 지우는 고개를 숙여 깊이 감사 인사를 했다. 텃밭은 채소뿐 아니라 이웃과의 따뜻한 대화도 함께 자라는 소중한 공간이 되어 가고 있었다.";
  const p3text = "여름이 오자 방울토마토가 탐스럽게 빨갛게 익기 시작했다. 지우는 잘 익은 토마토 열 개를 하나하나 조심스럽게 따서 작은 바구니에 가지런히 담았는데, 처음으로 맞이한 수확이라 마음이 설레었다. 아버지는 환하게 웃으며 토마토 하나를 입에 넣더니 역시 직접 기른 것이 맛이 다르다고 감탄했고, 어머니는 신선한 샐러드를 만들자고 했다. 지우는 옆 상자의 할머니에게 토마토 세 개를 건네며 그동안 알려 주신 덕분이라고 정중히 말했다. 할머니는 고맙다며 직접 기른 싱싱한 상추 한 봉지를 내밀었다. 그날 저녁 식탁에는 옥상에서 기른 토마토와 상추가 사이좋게 나란히 놓였다. 지우는 밥을 먹으며 내년 봄에는 고추도 심어 보겠다고 당차게 선언했고, 가족 모두 웃음을 터뜨렸다.";

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
      prompt = "봄이 되자 어디에 텃밭이 만들어졌나요?";
      choices = [["A","아파트 옥상"],["B","학교 운동장"],["C","마을 입구 공터"],["D","아파트 지하 주차장"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "관리소 아저씨가 한 일은 무엇인가요?";
      choices = [["A","나무 상자 열 개에 흙을 채워 놓았다"],["B","옥상에 잔디를 깔았다"],["C","화분 다섯 개를 사 왔다"],["D","텃밭 안내문을 붙였다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "지우네 가족이 고른 채소는 무엇인가요?";
      choices = [["A","방울토마토"],["B","오이"],["C","상추"],["D","고추"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "아버지가 심은 모종의 수는 몇 개인가요?";
      choices = [["A","다섯 개"],["B","세 개"],["C","열 개"],["D","일곱 개"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "지우가 바라본 모종의 모습은 어떠했나요?";
      choices = [["A","볕을 받으며 줄기를 꼿꼿이 세우고 있었다"],["B","시들어서 땅에 늘어져 있었다"],["C","벌레가 먹어 구멍이 나 있었다"],["D","너무 빨리 자라 상자 밖으로 넘쳤다"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "작은 초록 잎이 바람에 흔들리는 것을 지우는 무엇에 비유했나요?";
      choices = [["A","새로 온 동네에 인사를 건네는 것"],["B","춤을 추는 발레리나"],["C","바다 위를 나는 새"],["D","잠에서 깨어나는 아기"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p1", start: 0, end: p1text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","아파트 옥상에 텃밭이 만들어지고 지우네 가족은 방울토마토 모종을 심었다"],["B","지우네 가족은 텃밭에 관심이 없어 참여하지 않았다"],["C","관리소 아저씨가 혼자 모든 채소를 심었다"],["D","옥상 텃밭은 허락되지 않아 만들지 못했다"]],
    "A"
  ));

  s2.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p2", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "모종을 심은 뒤 지우가 매일 한 일은 무엇인가요?";
      choices = [["A","아침마다 옥상에 올라가 물을 주었다"],["B","저녁마다 옥상에 올라가 풀을 뽑았다"],["C","일주일에 한 번 비료를 주었다"],["D","매일 옥상에서 낮잠을 잤다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "지우가 뿌듯한 기분을 느낀 까닭은 무엇인가요?";
      choices = [["A","잎이 늘어나고 줄기가 굵어지는 것을 보았기 때문이다"],["B","친구들이 칭찬해 주었기 때문이다"],["C","선생님이 상을 주었기 때문이다"],["D","토마토를 먹었기 때문이다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "노란 꽃이 피었을 때 지우가 한 행동은 무엇인가요?";
      choices = [["A","학교에서 돌아오자마자 옥상으로 달려갔다"],["B","꽃을 꺾어 교실에 가져갔다"],["C","사진을 찍어 친구에게 보냈다"],["D","꽃이 피었다며 아버지에게 전화했다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "꽃이 늘어날수록 지우에게 나타난 변화는 무엇인가요?";
      choices = [["A","발걸음이 점점 빨라졌다"],["B","관심이 줄어들었다"],["C","귀찮아하며 가지 않았다"],["D","다른 채소로 바꾸고 싶어졌다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "할머니가 지우에게 알려 준 것은 무엇인가요?";
      choices = [["A","잎을 솎아 주는 방법과 물을 줄 적당한 시간"],["B","비료를 만드는 방법"],["C","토마토를 요리하는 법"],["D","씨앗을 보관하는 법"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "텃밭이 채소 외에 함께 자라게 한 것은 무엇인가요?";
      choices = [["A","이웃과의 따뜻한 대화"],["B","잡초"],["C","벌레"],["D","소음"]];
      answerId = "A";
    }
    timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p2", start: 0, end: p2text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","지우는 매일 물을 주며 성장을 지켜보았고 텃밭은 이웃과 소통하는 공간이 되었다"],["B","지우는 물 주는 것이 귀찮아 텃밭을 포기했다"],["C","할머니는 지우의 토마토를 뽑아 버렸다"],["D","텃밭의 채소는 모두 벌레에게 먹혔다"]],
    "A"
  ));

  s3.forEach((sent, i) => {
    stepNum++;
    const r = [{ paragraphId: "p3", start: sent.start, end: sent.end }];
    let prompt, choices, answerId;
    if (i === 0) {
      prompt = "여름이 오자 방울토마토에 나타난 변화는 무엇인가요?";
      choices = [["A","빨갛게 익기 시작했다"],["B","모두 시들어 버렸다"],["C","녹색으로 그대로 머물렀다"],["D","노란색으로 변했다"]];
      answerId = "A";
    } else if (i === 1) {
      prompt = "지우가 처음 수확한 토마토는 몇 개이며 기분은 어떠했나요?";
      choices = [["A","열 개를 따서 설레는 마음이었다"],["B","다섯 개를 따서 실망했다"],["C","스무 개를 따서 놀랐다"],["D","세 개를 따서 아쉬웠다"]];
      answerId = "A";
    } else if (i === 2) {
      prompt = "토마토를 먹은 아버지의 반응은 어떠했나요?";
      choices = [["A","직접 기른 것이 맛이 다르다고 감탄했다"],["B","다음에 먹겠다며 냉장고에 넣었다"],["C","맛이 없다며 고개를 저었다"],["D","사진을 찍어 친구에게 보냈다"]];
      answerId = "A";
    } else if (i === 3) {
      prompt = "지우가 할머니에게 토마토를 건네며 한 말은 무엇인가요?";
      choices = [["A","그동안 알려 주신 덕분이라고 했다"],["B","대신 돈을 달라고 했다"],["C","다음에는 더 많이 드리겠다고 했다"],["D","아무 말 없이 건네기만 했다"]];
      answerId = "A";
    } else if (i === 4) {
      prompt = "할머니가 지우에게 건넨 것은 무엇인가요?";
      choices = [["A","직접 기른 싱싱한 상추 한 봉지"],["B","새 모종 세 개"],["C","용돈 천 원"],["D","토마토 씨앗 한 봉지"]];
      answerId = "A";
    } else if (i === 5) {
      prompt = "그날 저녁 식탁에 나란히 놓인 것은 무엇인가요?";
      choices = [["A","옥상에서 기른 토마토와 상추"],["B","마트에서 산 고기와 밥"],["C","할머니가 만든 김치와 나물"],["D","아버지가 주문한 피자"]];
      answerId = "A";
    } else if (i === 6) {
      prompt = "지우가 내년 봄에 하겠다고 선언한 것은 무엇인가요?";
      choices = [["A","고추도 심어 보겠다"],["B","텃밭을 그만두겠다"],["C","꽃만 심겠다"],["D","더 큰 화분을 사겠다"]];
      answerId = "A";
    }
    if (prompt) timeline.push(makeStep(`s${stepNum}`, r, prompt, choices, answerId));
  });
  stepNum++;
  timeline.push(makeStep(`s${stepNum}`,
    [{ paragraphId: "p3", start: 0, end: p3text.length }],
    "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
    [["A","첫 수확의 기쁨을 가족과 이웃과 나누며 지우는 내년 계획까지 세우게 되었다"],["B","토마토가 익지 않아 지우는 실망했다"],["C","할머니는 토마토를 받지 않고 돌려보냈다"],["D","지우는 텃밭에 흥미를 잃고 다른 취미를 시작했다"]],
    "A"
  ));

  const cards = buildRecallCards(paragraphs);

  const confirmQs = [
    makeConfirmQ("q1", "지우네 가족이 텃밭에 심기로 고른 채소는 무엇인가요?",
      [findRange(paragraphs, "p1", "방울토마토")]),
    makeConfirmQ("q2", "모종이 바람에 흔들리는 모습을 지우는 무엇에 비유했나요?",
      [findRange(paragraphs, "p1", "인사를 건네는 것")]),
    makeConfirmQ("q3", "할머니가 지우에게 알려 준 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "잎을 솎아 주는 방법")]),
    makeConfirmQ("q4", "텃밭에서 채소 외에 함께 자란 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "이웃과의 따뜻한 대화")]),
    makeConfirmQ("q5", "할머니가 지우에게 건넨 것은 무엇인가요?",
      [findRange(paragraphs, "p3", "상추 한 봉지")]),
    makeConfirmQ("q6", "지우가 내년 봄에 심겠다고 선언한 채소는 무엇인가요?",
      [findRange(paragraphs, "p3", "고추")])
  ];

  return assembleFull(80, "LITERATURE", "문학", paragraphs, timeline, cards, confirmQs);
}

// === 메인 실행 ===
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const batchPath = path.join(ROOT, 'generated', 'daily-batch-reading-frege3.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'frege3');

  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

  const days = [
    { dayIndex: 76, builder: buildDay76 },
    { dayIndex: 77, builder: buildDay77 },
    { dayIndex: 78, builder: buildDay78 },
    { dayIndex: 79, builder: buildDay79 },
    { dayIndex: 80, builder: buildDay80 }
  ];

  const results = [];
  for (const { dayIndex, builder } of days) {
    const content = builder();
    const subArea = content.subArea;

    const paras = content.payload.passage.paragraphs;
    const totalChars = charLen(paras);
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

    const batchIdx = hashIdx(dayIndex);
    const batchItem = wrapBatchItem(dayIndex, subArea, content);
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
