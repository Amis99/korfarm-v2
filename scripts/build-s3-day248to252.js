const fs = require('fs');
const path = require('path');

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
    const s = i * chunkSize;
    const e = Math.min(s + chunkSize, totalLen);
    cards.push({ id: `c${i+1}`, text: fullText.substring(s, e) });
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
    contentId: `dr-s3-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(소쉬르 3) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "SAUSSURE_3", schoolGradeRange: { min: 5, max: 5 },
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
  return { content_type: "DAILY_READING", level_id: "SAUSSURE_3", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// ─── Day 248 (짝수 → 문학) ───
function buildDay248() {
  const paragraphs = [
    {
      id: "p1",
      text: "준서는 방학 동안 시골 할머니 댁에서 지내게 되었다. 도시에서만 자란 준서에게 시골은 낯설고 심심한 곳이었다. 할머니 댁 마당에는 커다란 감나무가 한 그루 서 있었다. 할머니는 이 나무가 준서 아버지가 어렸을 때 심은 것이라고 말씀하셨다. 준서는 아버지도 어린 시절이 있었다는 사실이 신기했다. 감나무 아래에는 나무 의자가 놓여 있었고 그 옆에 고양이 한 마리가 웅크리고 자고 있었다. 준서는 고양이 옆에 살며시 앉아 하늘을 올려다보았다."
    },
    {
      id: "p2",
      text: "다음 날 아침 할머니가 텃밭에 가자고 하셨다. 텃밭에는 상추와 고추와 토마토가 줄지어 자라고 있었다. 할머니는 빨갛게 익은 토마토를 하나 따서 준서에게 건네주셨다. 준서가 한 입 베어 물자 달콤한 즙이 입안 가득 퍼졌다. 마트에서 사 먹던 토마토와는 비교할 수 없을 만큼 맛있었다. 할머니는 준서에게 물 주는 법과 잡초 뽑는 법을 가르쳐 주셨다. 준서는 처음에는 귀찮았지만 점점 재미를 느끼기 시작했다."
    },
    {
      id: "p3",
      text: "방학이 끝나갈 무렵 준서가 정성껏 돌본 상추가 싱싱하게 자라 있었다. 할머니가 준서의 상추로 쌈밥을 해 주셨다. 자기가 직접 키운 채소로 만든 밥을 먹으니 뿌듯한 마음이 가득 차올랐다. 준서는 서울로 돌아갈 때 감나무 아래에서 한참 동안 서 있었다. 처음에는 심심하기만 했던 시골이 이제는 따뜻하고 소중한 곳으로 느껴졌다. 준서는 다음 방학에도 꼭 오겠다고 할머니와 약속하며 손을 꼭 잡았다. 기차에 올라타면서 창밖으로 멀어지는 시골 풍경을 오래도록 바라보았다."
    }
  ];
  console.log(`Day 248 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "준서가 방학 동안 지내게 된 곳은?", [findRange(paragraphs, "p1", "준서는 방학 동안 시골 할머니 댁에서 지내게 되었다")]),
    makeConfirmQ("q2", "할머니 댁 마당의 감나무를 심은 사람은?", [findRange(paragraphs, "p1", "이 나무가 준서 아버지가 어렸을 때 심은 것이라고 말씀하셨다")]),
    makeConfirmQ("q3", "텃밭에서 자라고 있는 것은?", [findRange(paragraphs, "p2", "텃밭에는 상추와 고추와 토마토가 줄지어 자라고 있었다")]),
    makeConfirmQ("q4", "준서가 토마토를 먹었을 때의 느낌은?", [findRange(paragraphs, "p2", "한 입 베어 물자 달콤한 즙이 입안 가득 퍼졌다")]),
    makeConfirmQ("q5", "할머니가 준서에게 가르쳐 준 것은?", [findRange(paragraphs, "p2", "할머니는 준서에게 물 주는 법과 잡초 뽑는 법을 가르쳐 주셨다")]),
    makeConfirmQ("q6", "할머니가 준서의 상추로 만들어 준 음식은?", [findRange(paragraphs, "p3", "할머니가 준서의 상추로 쌈밥을 해 주셨다")]),
    makeConfirmQ("q7", "방학이 끝날 때 준서에게 시골은 어떤 곳이 되었나요?", [findRange(paragraphs, "p3", "처음에는 심심하기만 했던 시골이 이제는 따뜻하고 소중한 곳으로 느껴졌다")])
  ];

  return { content: assembleFull(248, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ─── Day 249 (홀수 → 비문학) ───
function buildDay249() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리가 매일 사용하는 종이는 나무에서 만들어진다. 나무의 줄기를 잘게 부수어 펄프라는 물질을 만들고 이것을 얇게 펴서 말리면 종이가 된다. 종이가 발명되기 전에는 돌이나 나무껍질 또는 동물 가죽에 글을 쓰기도 했다. 종이를 처음 발명한 것은 약 이천 년 전 중국의 채륜이라는 사람이다. 채륜은 나무껍질과 삼베 조각과 헝겊 등을 물에 풀어 얇게 만든 뒤 말리는 방법을 생각해 냈다. 이 발명 덕분에 사람들은 훨씬 쉽게 글을 쓰고 지식을 전달할 수 있게 되었다."
    },
    {
      id: "p2",
      text: "종이를 만드는 데에는 많은 나무가 필요하다. 한 톤의 종이를 만들려면 약 스무 그루의 나무가 필요하다고 한다. 전 세계에서 매년 엄청난 양의 종이를 사용하기 때문에 그만큼 숲이 줄어들고 있다. 숲이 줄어들면 공기 중의 이산화탄소를 흡수할 나무가 부족해져서 지구 온난화가 빨라질 수 있다. 또한 동물들이 살 곳을 잃게 된다. 이러한 문제를 줄이기 위해 폐지를 재활용하는 것이 매우 중요하다. 폐지를 다시 펄프로 만들면 새 나무를 베지 않아도 종이를 만들 수 있기 때문이다."
    },
    {
      id: "p3",
      text: "우리가 일상에서 종이를 아끼는 방법은 여러 가지가 있다. 먼저 양면 인쇄를 하거나 이면지를 활용하면 종이 사용량을 절반으로 줄일 수 있다. 또한 다 쓴 공책이나 신문지를 분리수거함에 넣으면 재활용 과정을 거쳐 다시 종이로 태어난다. 디지털 기기를 활용하여 종이 대신 전자 문서를 이용하는 것도 좋은 방법이다. 작은 실천이 모이면 숲을 지키고 환경을 보호하는 큰 힘이 된다."
    }
  ];
  console.log(`Day 249 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "종이는 무엇에서 만들어지나요?", [findRange(paragraphs, "p1", "우리가 매일 사용하는 종이는 나무에서 만들어진다")]),
    makeConfirmQ("q2", "종이를 처음 발명한 사람은 누구인가요?", [findRange(paragraphs, "p1", "종이를 처음 발명한 것은 약 이천 년 전 중국의 채륜이라는 사람이다")]),
    makeConfirmQ("q3", "한 톤의 종이를 만들려면 나무가 얼마나 필요한가요?", [findRange(paragraphs, "p2", "한 톤의 종이를 만들려면 약 스무 그루의 나무가 필요하다고 한다")]),
    makeConfirmQ("q4", "숲이 줄어들면 어떤 문제가 생기나요?", [findRange(paragraphs, "p2", "숲이 줄어들면 공기 중의 이산화탄소를 흡수할 나무가 부족해져서 지구 온난화가 빨라질 수 있다")]),
    makeConfirmQ("q5", "폐지 재활용이 중요한 이유는?", [findRange(paragraphs, "p2", "폐지를 다시 펄프로 만들면 새 나무를 베지 않아도 종이를 만들 수 있기 때문이다")]),
    makeConfirmQ("q6", "양면 인쇄를 하면 어떤 효과가 있나요?", [findRange(paragraphs, "p3", "양면 인쇄를 하거나 이면지를 활용하면 종이 사용량을 절반으로 줄일 수 있다")]),
    makeConfirmQ("q7", "종이 대신 활용할 수 있는 것은?", [findRange(paragraphs, "p3", "디지털 기기를 활용하여 종이 대신 전자 문서를 이용하는 것도 좋은 방법이다")])
  ];

  return { content: assembleFull(249, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ─── Day 250 (짝수 → 문학) ───
function buildDay250() {
  const paragraphs = [
    {
      id: "p1",
      text: "소윤이는 학교 미술 시간에 그림 그리기를 좋아했다. 어느 날 미술 선생님이 우리 마을의 아름다운 장소를 그려 오라는 숙제를 내셨다. 소윤이는 고민하다가 집 근처에 있는 작은 연못을 떠올렸다. 방과 후에 스케치북과 색연필을 들고 연못으로 향했다. 연못가에 도착하니 버드나무 가지가 바람에 살랑살랑 흔들리고 있었다. 물 위에는 수련 잎이 둥둥 떠 있었고 그 사이로 잉어 몇 마리가 헤엄치고 있었다. 소윤이는 잔디밭에 앉아 스케치를 시작했다."
    },
    {
      id: "p2",
      text: "그림을 그리다 보니 평소에 지나치던 것들이 눈에 들어왔다. 연못 주변에 핀 들꽃이 보라색과 노란색으로 어우러져 무척 아름다웠다. 나뭇잎에 앉은 잠자리의 투명한 날개가 햇빛에 반짝였다. 소윤이는 이런 작은 아름다움을 전에는 왜 몰랐을까 하고 생각했다. 하늘에 떠 있는 뭉게구름을 배경으로 넣고 연못에 비친 하늘의 반영도 그려 넣었다. 색연필로 잔물결까지 세밀하게 표현하니 그림이 살아 있는 것처럼 보였다. 소윤이는 만족스러운 미소를 지었다."
    },
    {
      id: "p3",
      text: "다음 날 미술 시간에 소윤이가 그림을 제출하자 선생님의 눈이 커지셨다. 선생님은 연못의 분위기를 잘 살렸다고 칭찬해 주셨다. 반 친구들도 그림을 보며 이 연못이 어디에 있냐고 물어보았다. 소윤이는 자신의 그림이 친구들에게 관심을 끌었다는 사실에 뿌듯해졌다. 그날 이후로 소윤이는 틈이 날 때마다 연못에 가서 계절마다 달라지는 풍경을 그렸다. 그림을 그릴수록 주변의 아름다움이 더 잘 보이게 되었다. 소윤이는 관찰하는 눈이야말로 화가에게 가장 중요한 능력이라고 느꼈다."
    }
  ];
  console.log(`Day 250 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "미술 선생님이 낸 숙제는?", [findRange(paragraphs, "p1", "미술 선생님이 우리 마을의 아름다운 장소를 그려 오라는 숙제를 내셨다")]),
    makeConfirmQ("q2", "소윤이가 그리기로 한 장소는?", [findRange(paragraphs, "p1", "소윤이는 고민하다가 집 근처에 있는 작은 연못을 떠올렸다")]),
    makeConfirmQ("q3", "연못가에서 본 모습은?", [findRange(paragraphs, "p1", "물 위에는 수련 잎이 둥둥 떠 있었고 그 사이로 잉어 몇 마리가 헤엄치고 있었다")]),
    makeConfirmQ("q4", "소윤이가 그림을 그리면서 깨달은 것은?", [findRange(paragraphs, "p2", "소윤이는 이런 작은 아름다움을 전에는 왜 몰랐을까 하고 생각했다")]),
    makeConfirmQ("q5", "소윤이가 그림에 추가로 그려 넣은 것은?", [findRange(paragraphs, "p2", "하늘에 떠 있는 뭉게구름을 배경으로 넣고 연못에 비친 하늘의 반영도 그려 넣었다")]),
    makeConfirmQ("q6", "선생님의 반응은 어떠했나요?", [findRange(paragraphs, "p3", "선생님은 연못의 분위기를 잘 살렸다고 칭찬해 주셨다")]),
    makeConfirmQ("q7", "소윤이가 화가에게 가장 중요하다고 느낀 것은?", [findRange(paragraphs, "p3", "소윤이는 관찰하는 눈이야말로 화가에게 가장 중요한 능력이라고 느꼈다")])
  ];

  return { content: assembleFull(250, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ─── Day 251 (홀수 → 비문학) ───
function buildDay251() {
  const paragraphs = [
    {
      id: "p1",
      text: "꿀벌은 꽃에서 꿀을 모으는 곤충으로 잘 알려져 있지만 사실 그보다 훨씬 중요한 역할을 한다. 꿀벌이 꽃에 앉아 꿀을 빨아들일 때 몸에 꽃가루가 묻는다. 이 꽃가루를 다른 꽃으로 옮기는 것을 수분이라고 한다. 수분이 이루어져야 식물이 열매를 맺고 씨앗을 만들 수 있다. 우리가 먹는 과일과 채소의 약 삼분의 일은 꿀벌의 수분 덕분에 열리는 것이다. 사과와 딸기와 수박 등 맛있는 과일도 꿀벌이 없으면 생산이 어려워진다."
    },
    {
      id: "p2",
      text: "그런데 최근 전 세계적으로 꿀벌의 수가 크게 줄어들고 있어 과학자들이 걱정하고 있다. 꿀벌이 줄어드는 원인은 여러 가지가 있다. 먼저 농약 사용이 꿀벌에게 해를 끼치고 있다. 농약이 뿌려진 꽃의 꿀을 먹으면 꿀벌의 신경 체계가 손상되어 집으로 돌아오는 길을 잃어버리기도 한다. 또한 기후 변화로 꽃이 피는 시기가 달라지면서 꿀벌이 먹이를 구하기 어려워지고 있다. 벌집에 기생하는 응애라는 작은 벌레도 꿀벌을 병들게 하는 원인 중 하나이다."
    },
    {
      id: "p3",
      text: "꿀벌을 보호하기 위해 우리가 할 수 있는 일이 있다. 베란다나 화단에 꿀벌이 좋아하는 꽃을 심으면 꿀벌에게 먹이를 제공할 수 있다. 라벤더와 해바라기와 코스모스 같은 꽃이 꿀벌이 특히 좋아하는 꽃이다. 또한 친환경 농산물을 선택하면 농약 사용을 줄이는 데 도움이 된다. 꿀벌이 사라지면 식량 생산에 큰 위기가 올 수 있으므로 작은 관심이 큰 변화를 만들어 낸다. 작은 곤충이지만 꿀벌은 지구 생태계를 지탱하는 소중한 존재이다."
    }
  ];
  console.log(`Day 251 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "꿀벌이 꽃가루를 옮기는 것을 무엇이라고 하나요?", [findRange(paragraphs, "p1", "이 꽃가루를 다른 꽃으로 옮기는 것을 수분이라고 한다")]),
    makeConfirmQ("q2", "수분이 이루어지면 식물에 어떤 일이 생기나요?", [findRange(paragraphs, "p1", "수분이 이루어져야 식물이 열매를 맺고 씨앗을 만들 수 있다")]),
    makeConfirmQ("q3", "농약이 꿀벌에게 미치는 영향은?", [findRange(paragraphs, "p2", "농약이 뿌려진 꽃의 꿀을 먹으면 꿀벌의 신경 체계가 손상되어 집으로 돌아오는 길을 잃어버리기도 한다")]),
    makeConfirmQ("q4", "기후 변화가 꿀벌에게 미치는 영향은?", [findRange(paragraphs, "p2", "기후 변화로 꽃이 피는 시기가 달라지면서 꿀벌이 먹이를 구하기 어려워지고 있다")]),
    makeConfirmQ("q5", "꿀벌을 병들게 하는 작은 벌레는?", [findRange(paragraphs, "p2", "벌집에 기생하는 응애라는 작은 벌레도 꿀벌을 병들게 하는 원인 중 하나이다")]),
    makeConfirmQ("q6", "꿀벌이 좋아하는 꽃은?", [findRange(paragraphs, "p3", "라벤더와 해바라기와 코스모스 같은 꽃이 꿀벌이 특히 좋아하는 꽃이다")]),
    makeConfirmQ("q7", "꿀벌이 사라지면 어떤 문제가 생기나요?", [findRange(paragraphs, "p3", "꿀벌이 사라지면 식량 생산에 큰 위기가 올 수 있으므로 작은 관심이 큰 변화를 만들어 낸다")])
  ];

  return { content: assembleFull(251, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ─── Day 252 (짝수 → 문학) ───
function buildDay252() {
  const paragraphs = [
    {
      id: "p1",
      text: "민재는 전학 온 첫날 교실 문 앞에서 망설이고 있었다. 새로운 학교에서 친구를 사귈 수 있을지 걱정이 되었다. 담임 선생님이 민재의 어깨를 가볍게 두드리며 교실 안으로 안내하셨다. 선생님이 반 친구들에게 민재를 소개하자 아이들이 호기심 어린 눈으로 바라보았다. 민재는 떨리는 목소리로 인사를 했다. 창가 옆 빈자리에 앉았는데 옆자리 아이가 먼저 말을 걸어왔다. 옆자리 아이는 이름이 태민이라고 하며 환하게 웃어 주었다."
    },
    {
      id: "p2",
      text: "쉬는 시간에 태민이가 민재에게 학교를 구경시켜 주겠다고 했다. 태민이는 운동장과 도서관과 과학실을 차례로 보여 주었다. 도서관에 들어갔을 때 민재의 눈이 빛났다. 민재는 책 읽기를 좋아했기 때문이었다. 태민이도 독서를 즐긴다고 하면서 요즘 읽고 있는 모험 소설을 추천해 주었다. 두 사람은 좋아하는 책 이야기를 하면서 금세 친해졌다. 교실로 돌아오는 길에 태민이가 점심시간에 같이 밥 먹자고 했고 민재는 기쁘게 고개를 끄덕였다."
    },
    {
      id: "p3",
      text: "점심시간에 태민이가 자기 친구들을 소개시켜 주었다. 축구를 좋아하는 현우와 그림을 잘 그리는 수아도 민재에게 친절하게 대해 주었다. 함께 밥을 먹으며 이야기를 나누다 보니 전학 온 긴장감이 스르르 녹아내렸다. 오후 수업이 끝나고 현우가 내일 축구하자며 민재를 초대했다. 민재는 집으로 돌아오는 길에 발걸음이 가벼웠다. 아침에 걱정하던 마음이 무색할 만큼 행복한 하루였다. 민재는 내일도 학교에 가는 것이 기대된다고 일기장에 적으며 하루를 마무리했다."
    }
  ];
  console.log(`Day 252 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "민재가 교실 앞에서 망설인 이유는?", [findRange(paragraphs, "p1", "새로운 학교에서 친구를 사귈 수 있을지 걱정이 되었다")]),
    makeConfirmQ("q2", "민재에게 먼저 말을 건 아이는?", [findRange(paragraphs, "p1", "옆자리 아이는 이름이 태민이라고 하며 환하게 웃어 주었다")]),
    makeConfirmQ("q3", "태민이가 학교에서 보여 준 장소는?", [findRange(paragraphs, "p2", "태민이는 운동장과 도서관과 과학실을 차례로 보여 주었다")]),
    makeConfirmQ("q4", "민재가 도서관에서 눈이 빛난 이유는?", [findRange(paragraphs, "p2", "민재는 책 읽기를 좋아했기 때문이었다")]),
    makeConfirmQ("q5", "태민이가 민재에게 추천한 것은?", [findRange(paragraphs, "p2", "요즘 읽고 있는 모험 소설을 추천해 주었다")]),
    makeConfirmQ("q6", "태민이 친구들의 특징은?", [findRange(paragraphs, "p3", "축구를 좋아하는 현우와 그림을 잘 그리는 수아도 민재에게 친절하게 대해 주었다")]),
    makeConfirmQ("q7", "민재가 일기장에 적은 내용은?", [findRange(paragraphs, "p3", "내일도 학교에 가는 것이 기대된다고 일기장에 적으며 하루를 마무리했다")])
  ];

  return { content: assembleFull(252, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ─── 실행부 ───
const results = [
  { dayIndex: 248, ...buildDay248() },
  { dayIndex: 249, ...buildDay249() },
  { dayIndex: 250, ...buildDay250() },
  { dayIndex: 251, ...buildDay251() },
  { dayIndex: 252, ...buildDay252() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});
const tempBatchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-s3-248-252.json');
fs.writeFileSync(tempBatchPath, JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  ✅ 임시 배치: ${tempBatchPath}`);
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
