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

// === Day 288 (짝수 -> 문학) ===
function buildDay288() {
  const paragraphs = [
    {
      id: "p1",
      text: "민수는 방학 동안 할아버지 댁에 놀러 갔다. 할아버지 댁은 시골 마을 끝자락에 있었고 집 뒤로는 넓은 밭이 펼쳐져 있었다. 할아버지는 매일 아침 일찍 일어나 밭에 나가 고추와 상추, 감자 등을 돌보셨다. 민수는 도시에서 자라서 밭일을 한 번도 해 본 적이 없었다. 할아버지는 민수에게 흙을 만져 보렴 이 흙에서 우리가 먹는 것들이 자란단다 하고 말씀하셨다. 민수는 맨손으로 흙을 만져 보았는데 축축하고 부드러운 느낌이 신기했다."
    },
    {
      id: "p2",
      text: "할아버지는 민수에게 감자를 캐는 법을 알려 주셨다. 호미로 줄기 옆 땅을 조심스럽게 파면 동글동글한 감자가 줄줄이 나왔다. 민수는 한 포기에서 감자 여섯 개가 나오는 것을 보고 와 이렇게 많이 열려요 하며 놀라워했다. 할아버지는 씨감자 하나를 심으면 이렇게 여러 개가 열린단다 자연의 힘이지 하고 웃으셨다. 오후에는 할머니가 갓 캔 감자로 감자전을 부쳐 주셨다. 갓 캐낸 감자로 만든 감자전은 민수가 먹어 본 것 중 가장 맛있었다."
    },
    {
      id: "p3",
      text: "방학이 끝나고 집으로 돌아온 민수는 베란다 화분에 씨감자를 심어 보기로 했다. 할아버지가 가르쳐 주신 대로 흙을 담고 감자를 묻은 뒤 물을 주었다. 매일 아침 물을 주고 관찰 일기를 썼는데 일주일 뒤 초록색 싹이 올라왔을 때 민수는 할아버지에게 바로 전화를 걸었다. 할아버지 싹이 났어요 하고 외치자 할아버지는 잘했다 꾸준히 돌보면 감자가 열릴 거란다 하고 칭찬해 주셨다. 민수는 작은 화분을 보며 할아버지의 밭이 떠올라 마음이 따뜻해졌다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "할아버지 댁 뒤에 무엇이 있었나요?", [findRange(paragraphs, "p1", "집 뒤로는 넓은 밭이 펼쳐져 있었다.")]),
    makeConfirmQ("q2", "할아버지가 민수에게 흙에 대해 한 말은?", [findRange(paragraphs, "p1", "흙을 만져 보렴 이 흙에서 우리가 먹는 것들이 자란단다 하고 말씀하셨다.")]),
    makeConfirmQ("q3", "한 포기에서 감자가 몇 개 나왔나요?", [findRange(paragraphs, "p2", "민수는 한 포기에서 감자 여섯 개가 나오는 것을 보고")]),
    makeConfirmQ("q4", "할머니가 감자로 만들어 주신 음식은?", [findRange(paragraphs, "p2", "오후에는 할머니가 갓 캔 감자로 감자전을 부쳐 주셨다.")]),
    makeConfirmQ("q5", "민수가 집에 돌아와 한 일은?", [findRange(paragraphs, "p3", "베란다 화분에 씨감자를 심어 보기로 했다.")]),
    makeConfirmQ("q6", "싹이 났을 때 민수가 한 행동은?", [findRange(paragraphs, "p3", "일주일 뒤 초록색 싹이 올라왔을 때 민수는 할아버지에게 바로 전화를 걸었다.")]),
    makeConfirmQ("q7", "민수가 화분을 보며 느낀 감정은?", [findRange(paragraphs, "p3", "민수는 작은 화분을 보며 할아버지의 밭이 떠올라 마음이 따뜻해졌다.")])
  ];

  return { content: assembleFull(288, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 289 (홀수 -> 비문학) ===
function buildDay289() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리 몸속에는 뼈가 모두 206개 있다. 뼈는 몸의 형태를 유지하고 내부의 중요한 장기를 보호하는 역할을 한다. 예를 들어 두개골은 뇌를 감싸서 보호하고 갈비뼈는 심장과 폐를 둘러싸서 충격으로부터 지켜 준다. 또한 뼈는 칼슘과 인 같은 광물질을 저장하는 창고 역할도 한다. 뼈의 안쪽에는 골수라는 부분이 있는데 이곳에서 혈액 세포가 만들어진다. 이처럼 뼈는 단순히 딱딱한 구조물이 아니라 살아 있는 조직이다."
    },
    {
      id: "p2",
      text: "어린이의 뼈는 어른보다 개수가 더 많다. 태어날 때는 약 270개의 뼈를 가지고 있지만 자라면서 여러 개의 뼈가 서로 붙어 하나가 되기 때문에 어른이 되면 206개로 줄어든다. 어린이의 뼈가 어른보다 더 잘 휘어지는 이유는 뼈에 연골 성분이 많기 때문이다. 연골은 부드럽고 탄력이 있어서 뼈가 자라는 것을 도와준다. 성장판이라 불리는 부분이 바로 이 연골로 이루어져 있으며 키가 크는 것은 성장판에서 뼈가 길어지기 때문이다."
    },
    {
      id: "p3",
      text: "뼈를 튼튼하게 유지하려면 칼슘이 풍부한 음식을 먹는 것이 중요하다. 우유, 치즈, 멸치, 두부 등에 칼슘이 많이 들어 있다. 칼슘 외에도 비타민 디가 있어야 칼슘이 뼈에 잘 흡수된다. 비타민 디는 햇볕을 쬐면 우리 몸에서 자연스럽게 만들어진다. 그래서 바깥에서 뛰어노는 것이 뼈 건강에 좋다. 운동을 꾸준히 하면 뼈에 적절한 자극이 가해져 뼈가 더욱 단단해진다. 건강한 뼈를 위해서는 균형 잡힌 식사와 규칙적인 운동이 함께 필요하다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "사람 몸속에 있는 뼈의 개수는?", [findRange(paragraphs, "p1", "우리 몸속에는 뼈가 모두 206개 있다.")]),
    makeConfirmQ("q2", "두개골의 역할은 무엇인가요?", [findRange(paragraphs, "p1", "두개골은 뇌를 감싸서 보호하고")]),
    makeConfirmQ("q3", "골수에서 만들어지는 것은?", [findRange(paragraphs, "p1", "뼈의 안쪽에는 골수라는 부분이 있는데 이곳에서 혈액 세포가 만들어진다.")]),
    makeConfirmQ("q4", "어린이의 뼈가 어른보다 잘 휘어지는 이유는?", [findRange(paragraphs, "p2", "어린이의 뼈가 어른보다 더 잘 휘어지는 이유는 뼈에 연골 성분이 많기 때문이다.")]),
    makeConfirmQ("q5", "키가 크는 원리는 무엇인가요?", [findRange(paragraphs, "p2", "키가 크는 것은 성장판에서 뼈가 길어지기 때문이다.")]),
    makeConfirmQ("q6", "비타민 디가 우리 몸에서 만들어지는 조건은?", [findRange(paragraphs, "p3", "비타민 디는 햇볕을 쬐면 우리 몸에서 자연스럽게 만들어진다.")]),
    makeConfirmQ("q7", "뼈 건강을 위해 필요한 것은?", [findRange(paragraphs, "p3", "건강한 뼈를 위해서는 균형 잡힌 식사와 규칙적인 운동이 함께 필요하다.")])
  ];

  return { content: assembleFull(289, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 290 (짝수 -> 문학) ===
function buildDay290() {
  const paragraphs = [
    {
      id: "p1",
      text: "유진이네 반에서는 학예회에서 연극을 하기로 했다. 선생님이 누가 주인공을 맡고 싶으냐고 물으셨을 때 아무도 손을 들지 않았다. 아이들은 서로 눈치만 보고 있었다. 유진이는 평소에 수줍음이 많아서 앞에 나서는 것을 꺼렸지만 이번에는 용기를 내 보기로 했다. 유진이가 조심스럽게 손을 들자 선생님은 활짝 웃으며 좋아 유진이가 주인공을 해 보자 하고 말씀하셨다. 교실에서 박수 소리가 터져 나왔지만 유진이는 갑자기 걱정이 되기 시작했다."
    },
    {
      id: "p2",
      text: "연극 연습이 시작되자 유진이는 대사를 외우는 것이 쉽지 않았다. 집에서 거울 앞에 서서 연습했지만 목소리가 너무 작았고 표정도 딱딱했다. 친구 서연이가 내가 도와줄게 같이 연습하자 하며 매일 점심시간에 함께 연습해 주었다. 서연이는 목소리를 크게 내는 법과 몸짓으로 감정을 표현하는 법을 알려 주었다. 며칠이 지나자 유진이의 연기가 눈에 띄게 좋아졌다. 선생님도 유진이 정말 많이 늘었구나 하며 칭찬해 주셨다."
    },
    {
      id: "p3",
      text: "학예회 당일이 되었다. 무대 뒤에서 유진이는 심장이 쿵쿵 뛰었다. 막이 올라가고 조명이 유진이를 비추었다. 관객석에 앉은 부모님과 친구들의 얼굴이 보였다. 유진이는 깊게 숨을 들이쉬고 첫 대사를 말했다. 놀랍게도 목소리가 또렷하게 강당을 울렸다. 연극이 끝나고 관객들의 박수가 쏟아졌다. 유진이는 무대 위에서 인사를 하며 눈물이 핑 돌았다. 서연이가 달려와 안아 주며 정말 멋졌어 하고 말했다. 유진이는 용기를 낸 자신이 자랑스러웠다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "학예회에서 무엇을 하기로 했나요?", [findRange(paragraphs, "p1", "유진이네 반에서는 학예회에서 연극을 하기로 했다.")]),
    makeConfirmQ("q2", "유진이가 손을 든 이유는?", [findRange(paragraphs, "p1", "유진이는 평소에 수줍음이 많아서 앞에 나서는 것을 꺼렸지만 이번에는 용기를 내 보기로 했다.")]),
    makeConfirmQ("q3", "서연이가 유진이를 도운 방법은?", [findRange(paragraphs, "p2", "서연이는 목소리를 크게 내는 법과 몸짓으로 감정을 표현하는 법을 알려 주었다.")]),
    makeConfirmQ("q4", "유진이가 연습하면서 겪은 어려움은?", [findRange(paragraphs, "p2", "대사를 외우는 것이 쉽지 않았다.")]),
    makeConfirmQ("q5", "무대 위에서 유진이의 목소리는 어땠나요?", [findRange(paragraphs, "p3", "놀랍게도 목소리가 또렷하게 강당을 울렸다.")]),
    makeConfirmQ("q6", "연극이 끝난 후 서연이가 한 말은?", [findRange(paragraphs, "p3", "서연이가 달려와 안아 주며 정말 멋졌어 하고 말했다.")]),
    makeConfirmQ("q7", "유진이가 마지막에 느낀 감정은?", [findRange(paragraphs, "p3", "유진이는 용기를 낸 자신이 자랑스러웠다.")])
  ];

  return { content: assembleFull(290, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === Day 291 (홀수 -> 비문학) ===
function buildDay291() {
  const paragraphs = [
    {
      id: "p1",
      text: "소금은 우리 생활에서 빠질 수 없는 중요한 물질이다. 소금의 화학 이름은 염화나트륨이며 바닷물이나 암염에서 얻을 수 있다. 우리나라에서는 주로 바닷물을 넓은 염전에 가두어 햇볕과 바람으로 물을 증발시켜 소금을 만든다. 이렇게 만든 소금을 천일염이라 하며 미네랄이 풍부하여 맛이 좋다. 소금은 음식의 간을 맞추는 데 쓰일 뿐 아니라 김치나 젓갈을 만들 때 재료가 상하지 않도록 보존하는 역할도 한다."
    },
    {
      id: "p2",
      text: "옛날에 소금은 매우 귀한 물질이었다. 로마 시대에는 군인들에게 급여 대신 소금을 지급한 적도 있었는데 영어로 급여를 뜻하는 샐러리라는 단어가 소금을 뜻하는 라틴어 살에서 유래했다고 한다. 우리나라에서도 조선 시대에 소금을 만들어 파는 일은 나라에서 관리했을 만큼 중요하게 여겼다. 바다가 없는 내륙 지역에서는 소금을 구하기가 어려워 소금 한 줌이 쌀 한 되와 맞바꿀 정도로 값이 비쌌다."
    },
    {
      id: "p3",
      text: "소금은 건강에도 큰 영향을 미친다. 우리 몸은 적절한 양의 나트륨이 있어야 신경과 근육이 제대로 작동한다. 그러나 소금을 너무 많이 먹으면 혈압이 올라가고 심장과 콩팥에 무리를 줄 수 있다. 세계보건기구에서는 하루에 소금을 5그램 이하로 먹을 것을 권장하고 있다. 싱겁게 먹는 습관을 들이면 건강을 오래 유지할 수 있다. 소금은 너무 적어도 안 되고 너무 많아도 안 되는 균형이 중요한 물질이다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "소금의 화학 이름은 무엇인가요?", [findRange(paragraphs, "p1", "소금의 화학 이름은 염화나트륨이며")]),
    makeConfirmQ("q2", "천일염을 만드는 방법은?", [findRange(paragraphs, "p1", "바닷물을 넓은 염전에 가두어 햇볕과 바람으로 물을 증발시켜 소금을 만든다.")]),
    makeConfirmQ("q3", "소금이 음식 보존에 쓰이는 예는?", [findRange(paragraphs, "p1", "김치나 젓갈을 만들 때 재료가 상하지 않도록 보존하는 역할도 한다.")]),
    makeConfirmQ("q4", "샐러리라는 단어의 유래는?", [findRange(paragraphs, "p2", "영어로 급여를 뜻하는 샐러리라는 단어가 소금을 뜻하는 라틴어 살에서 유래했다고 한다.")]),
    makeConfirmQ("q5", "내륙 지역에서 소금이 비싼 이유는?", [findRange(paragraphs, "p2", "바다가 없는 내륙 지역에서는 소금을 구하기가 어려워 소금 한 줌이 쌀 한 되와 맞바꿀 정도로 값이 비쌌다.")]),
    makeConfirmQ("q6", "소금을 너무 많이 먹으면 생기는 문제는?", [findRange(paragraphs, "p3", "소금을 너무 많이 먹으면 혈압이 올라가고 심장과 콩팥에 무리를 줄 수 있다.")]),
    makeConfirmQ("q7", "세계보건기구의 소금 권장량은?", [findRange(paragraphs, "p3", "세계보건기구에서는 하루에 소금을 5그램 이하로 먹을 것을 권장하고 있다.")])
  ];

  return { content: assembleFull(291, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// === Day 292 (짝수 -> 문학) ===
function buildDay292() {
  const paragraphs = [
    {
      id: "p1",
      text: "작은 마을에 은비라는 소녀가 살았다. 은비는 그림 그리기를 좋아했지만 미술 시간에 친구들 앞에서 그림을 보여 주는 것이 부끄러웠다. 어느 날 미술 선생님이 반 대표로 그림 대회에 나갈 사람을 뽑겠다고 했다. 선생님은 은비의 스케치북을 보시더니 은비야 네 그림은 따뜻한 느낌이 있어서 참 좋구나 대회에 나가 보지 않겠니 하고 말씀하셨다. 은비는 망설였지만 선생님의 기대에 부응하고 싶어 조심스럽게 고개를 끄덕였다."
    },
    {
      id: "p2",
      text: "대회 주제는 우리 마을의 가장 아름다운 순간이었다. 은비는 무엇을 그릴지 고민하다가 매일 저녁 해 질 녘에 할머니와 산책하던 마을 뒷산 길이 떠올랐다. 은비는 주황빛 노을 아래 할머니와 손잡고 걸어가는 뒷모습을 그리기 시작했다. 나뭇잎 사이로 비치는 햇살, 돌담 위에 앉아 있는 고양이, 밭에서 일하다 손을 흔드는 이웃 어르신까지 마을의 따뜻한 풍경을 하나하나 정성스럽게 담았다. 그림을 완성하는 데 꼬박 열흘이 걸렸다."
    },
    {
      id: "p3",
      text: "대회 날 은비의 그림은 전시장 벽면에 나란히 걸렸다. 심사위원들이 그림 앞에서 한참을 머물렀고 관람객들도 발걸음을 멈추고 바라보았다. 결과가 발표되었을 때 은비의 이름이 불렸다. 은비는 믿기지 않아 눈을 크게 떴다. 장려상이었다. 상장을 받아 든 은비에게 할머니가 말씀하셨다. 네가 우리 산책길을 이렇게 예쁘게 그려 주다니 정말 고맙구나. 은비는 앞으로도 자신이 사랑하는 것들을 그림으로 남기겠다고 마음속으로 다짐했다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "은비가 미술 시간에 부끄러워한 것은?", [findRange(paragraphs, "p1", "미술 시간에 친구들 앞에서 그림을 보여 주는 것이 부끄러웠다.")]),
    makeConfirmQ("q2", "선생님이 은비의 그림에 대해 한 말은?", [findRange(paragraphs, "p1", "은비야 네 그림은 따뜻한 느낌이 있어서 참 좋구나 대회에 나가 보지 않겠니 하고 말씀하셨다.")]),
    makeConfirmQ("q3", "대회 주제는 무엇이었나요?", [findRange(paragraphs, "p2", "대회 주제는 우리 마을의 가장 아름다운 순간이었다.")]),
    makeConfirmQ("q4", "은비가 그린 장면은 무엇인가요?", [findRange(paragraphs, "p2", "주황빛 노을 아래 할머니와 손잡고 걸어가는 뒷모습을 그리기 시작했다.")]),
    makeConfirmQ("q5", "그림을 완성하는 데 걸린 시간은?", [findRange(paragraphs, "p2", "그림을 완성하는 데 꼬박 열흘이 걸렸다.")]),
    makeConfirmQ("q6", "은비가 받은 상은 무엇인가요?", [findRange(paragraphs, "p3", "장려상이었다.")]),
    makeConfirmQ("q7", "은비가 마음속으로 다짐한 것은?", [findRange(paragraphs, "p3", "은비는 앞으로도 자신이 사랑하는 것들을 그림으로 남기겠다고 마음속으로 다짐했다.")])
  ];

  return { content: assembleFull(292, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// === 실행부 ===
const results = [
  { dayIndex: 288, ...buildDay288() },
  { dayIndex: 289, ...buildDay289() },
  { dayIndex: 290, ...buildDay290() },
  { dayIndex: 291, ...buildDay291() },
  { dayIndex: 292, ...buildDay292() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
if (!fs.existsSync(staticDir)) fs.mkdirSync(staticDir, { recursive: true });

const batchItems = [];

results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

const newDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
fs.writeFileSync(path.join(newDir, 'batch-s3-288-292.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ batch-s3-288-292.json 저장 완료`);

console.log('\n=== 검증 결과 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
