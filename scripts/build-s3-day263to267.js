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

// ─── Day 263 (홀수 → 비문학) ───
function buildDay263() {
  const paragraphs = [
    {
      id: "p1",
      text: "바다에는 눈에 보이지 않을 만큼 작은 생물이 많이 살고 있다. 이 생물들을 플랑크톤이라고 부르며 식물성과 동물성으로 나눌 수 있다. 식물성 플랑크톤은 햇빛을 이용하여 영양분을 만들어 내는데 이 과정에서 산소를 생산한다. 지구 전체 산소의 약 절반 이상이 바다 속 식물성 플랑크톤에 의해 만들어진다. 동물성 플랑크톤은 식물성 플랑크톤을 먹이로 삼으며 물고기와 고래 같은 큰 바다 생물의 먹이가 된다. 이처럼 플랑크톤은 바다 생태계의 먹이 사슬에서 가장 중요한 역할을 한다."
    },
    {
      id: "p2",
      text: "플랑크톤의 수가 줄어들면 바다 생태계 전체가 위기에 빠질 수 있다. 바닷물의 온도가 올라가면 식물성 플랑크톤이 살기 어려워지고 수가 빠르게 감소한다. 플랑크톤이 줄면 작은 물고기도 줄어들고 결국 큰 물고기와 바다새까지 영향을 받는다. 또한 식물성 플랑크톤이 줄면 바다가 흡수하는 이산화탄소의 양도 줄어들어 온난화가 심해질 수 있다. 과학자들은 인공위성을 이용하여 바다 표면의 플랑크톤 분포를 관찰하고 변화를 추적하고 있다."
    },
    {
      id: "p3",
      text: "플랑크톤을 보호하려면 바다 환경을 깨끗하게 유지해야 한다. 공장과 농경지에서 흘러나오는 오염 물질이 바다로 들어가면 플랑크톤의 성장을 방해한다. 플라스틱 쓰레기도 잘게 부서져 미세 플라스틱이 되면 플랑크톤에게 해를 끼친다. 바다를 깨끗하게 지키려면 쓰레기를 줄이고 재활용을 실천해야 한다. 눈에 보이지 않는 작은 생물이지만 플랑크톤은 지구의 생명을 지탱하는 소중한 존재이다."
    }
  ];
  console.log(`Day 263 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "식물성 플랑크톤이 하는 일은 무엇인가요?", [findRange(paragraphs, "p1", "식물성 플랑크톤은 햇빛을 이용하여 영양분을 만들어 내는데 이 과정에서 산소를 생산한다")]),
    makeConfirmQ("q2", "지구 전체 산소의 약 절반 이상을 만드는 것은?", [findRange(paragraphs, "p1", "지구 전체 산소의 약 절반 이상이 바다 속 식물성 플랑크톤에 의해 만들어진다")]),
    makeConfirmQ("q3", "동물성 플랑크톤의 먹이는 무엇인가요?", [findRange(paragraphs, "p1", "동물성 플랑크톤은 식물성 플랑크톤을 먹이로 삼으며")]),
    makeConfirmQ("q4", "바닷물 온도가 올라가면 어떤 일이 생기나요?", [findRange(paragraphs, "p2", "바닷물의 온도가 올라가면 식물성 플랑크톤이 살기 어려워지고 수가 빠르게 감소한다")]),
    makeConfirmQ("q5", "과학자들이 플랑크톤을 관찰하는 방법은?", [findRange(paragraphs, "p2", "과학자들은 인공위성을 이용하여 바다 표면의 플랑크톤 분포를 관찰하고 변화를 추적하고 있다")]),
    makeConfirmQ("q6", "미세 플라스틱이 플랑크톤에게 미치는 영향은?", [findRange(paragraphs, "p3", "플라스틱 쓰레기도 잘게 부서져 미세 플라스틱이 되면 플랑크톤에게 해를 끼친다")]),
    makeConfirmQ("q7", "플랑크톤을 보호하기 위해 우리가 할 수 있는 일은?", [findRange(paragraphs, "p3", "바다를 깨끗하게 지키려면 쓰레기를 줄이고 재활용을 실천해야 한다")])
  ];

  return { content: assembleFull(263, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ─── Day 264 (짝수 → 문학) ───
function buildDay264() {
  const paragraphs = [
    {
      id: "p1",
      text: "하윤이는 방학 동안 시골 할머니 댁에서 지내게 되었다. 할머니 댁 마당에는 오래된 감나무 한 그루가 서 있었는데 가지가 넓게 퍼져 그늘을 만들어 주었다. 할머니는 이 감나무가 하윤이 아버지가 태어나던 해에 심은 것이라고 말씀하셨다. 하윤이는 나무 아래 평상에 앉아 할머니가 깎아 주신 수박을 먹으며 오후를 보냈다. 그런데 어느 날 아침 감나무 가지 하나가 바람에 부러져 떨어져 있었다. 할머니는 안타까운 표정으로 나무가 많이 늙었다고 중얼거리셨다."
    },
    {
      id: "p2",
      text: "하윤이는 부러진 가지를 보며 나무를 살릴 방법이 궁금해졌다. 동네 이장 할아버지를 찾아가 여쭤보니 부러진 곳을 정리하고 영양제를 주면 나무가 힘을 얻을 수 있다고 알려 주셨다. 하윤이는 할머니와 함께 부러진 가지를 톱으로 깔끔하게 잘라 내고 잘린 부분에 보호제를 발라 주었다. 나무 주변의 흙을 파서 거름도 넣어 주었다. 며칠이 지나자 잘린 부분 옆에서 작은 새싹이 돋아나기 시작했다. 하윤이는 새싹을 발견하고 할머니에게 달려가 알려 드렸다."
    },
    {
      id: "p3",
      text: "방학이 끝나고 돌아온 하윤이는 틈틈이 할머니에게 전화하여 감나무 소식을 물었다. 할머니는 새 가지가 자라고 있다며 사진을 보내 주셨다. 가을이 되자 할머니는 감나무에 작은 감이 몇 개 달렸다며 기쁜 소식을 전해 주셨다. 다음 방학에 할머니 댁을 다시 찾은 하윤이는 감나무가 더 푸르게 자란 모습을 보고 뿌듯했다. 할머니는 하윤이 덕분에 나무가 다시 살아났다며 안아 주셨다. 하윤이는 작은 정성이 생명을 살릴 수 있다는 것을 이 감나무를 통해 배웠다."
    }
  ];
  console.log(`Day 264 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "감나무는 언제 심은 것인가요?", [findRange(paragraphs, "p1", "할머니는 이 감나무가 하윤이 아버지가 태어나던 해에 심은 것이라고 말씀하셨다")]),
    makeConfirmQ("q2", "감나무에 어떤 일이 생겼나요?", [findRange(paragraphs, "p1", "감나무 가지 하나가 바람에 부러져 떨어져 있었다")]),
    makeConfirmQ("q3", "이장 할아버지가 알려 준 방법은?", [findRange(paragraphs, "p2", "부러진 곳을 정리하고 영양제를 주면 나무가 힘을 얻을 수 있다고 알려 주셨다")]),
    makeConfirmQ("q4", "하윤이가 나무를 위해 한 일은?", [findRange(paragraphs, "p2", "부러진 가지를 톱으로 깔끔하게 잘라 내고 잘린 부분에 보호제를 발라 주었다")]),
    makeConfirmQ("q5", "며칠 뒤 나무에 어떤 변화가 생겼나요?", [findRange(paragraphs, "p2", "며칠이 지나자 잘린 부분 옆에서 작은 새싹이 돋아나기 시작했다")]),
    makeConfirmQ("q6", "가을에 할머니가 전한 기쁜 소식은?", [findRange(paragraphs, "p3", "할머니는 감나무에 작은 감이 몇 개 달렸다며 기쁜 소식을 전해 주셨다")]),
    makeConfirmQ("q7", "하윤이가 감나무를 통해 배운 것은?", [findRange(paragraphs, "p3", "하윤이는 작은 정성이 생명을 살릴 수 있다는 것을 이 감나무를 통해 배웠다")])
  ];

  return { content: assembleFull(264, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ─── Day 265 (홀수 → 비문학) ───
function buildDay265() {
  const paragraphs = [
    {
      id: "p1",
      text: "별은 밤하늘에서 반짝이는 점처럼 보이지만 실제로는 태양과 같은 거대한 불덩어리이다. 별은 수소라는 가벼운 기체가 엄청난 압력과 온도에서 핵융합 반응을 일으키며 빛과 열을 내보내는 천체이다. 태양은 우리에게 가장 가까운 별로 지구에서 약 1억 5천만 킬로미터 떨어져 있다. 태양 다음으로 가까운 별은 프록시마 센타우리로 빛의 속도로 약 4년이 걸리는 거리에 있다. 별마다 크기와 밝기가 다른데 표면 온도가 높을수록 파란빛을 내고 낮을수록 붉은빛을 낸다."
    },
    {
      id: "p2",
      text: "별도 사람처럼 태어나고 늙고 죽는 일생이 있다. 우주 공간에 퍼져 있는 거대한 가스 구름이 중력에 의해 뭉쳐지면 새로운 별이 탄생한다. 태어난 별은 수소를 연료로 오랫동안 빛을 내며 타오른다. 연료가 다 떨어지면 별은 부풀어 올라 적색 거성이 된다. 태양 크기의 별은 바깥층을 우주로 내보내고 작고 뜨거운 백색 왜성이 되어 천천히 식어 간다. 태양보다 훨씬 무거운 별은 초신성이라는 폭발을 일으키며 생을 마감하고 남은 물질은 블랙홀이나 중성자별이 된다."
    },
    {
      id: "p3",
      text: "밤하늘의 별은 오래전부터 사람들에게 길잡이 역할을 해 왔다. 옛날 뱃사람들은 북극성의 위치를 보고 방향을 알아냈고 농부들은 별자리의 변화를 보며 계절을 예측했다. 오늘날에도 천문학자들은 별을 관측하여 우주의 구조와 역사를 연구하고 있다. 별빛이 지구에 도달하기까지 수백 년에서 수천 년이 걸리기 때문에 우리가 보는 별빛은 먼 과거의 빛이라고 할 수 있다. 밤하늘을 올려다볼 때 우리는 우주의 과거를 바라보고 있는 셈이다."
    }
  ];
  console.log(`Day 265 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "별이 빛을 내는 원리는 무엇인가요?", [findRange(paragraphs, "p1", "수소라는 가벼운 기체가 엄청난 압력과 온도에서 핵융합 반응을 일으키며 빛과 열을 내보내는 천체이다")]),
    makeConfirmQ("q2", "태양 다음으로 가까운 별은?", [findRange(paragraphs, "p1", "태양 다음으로 가까운 별은 프록시마 센타우리로 빛의 속도로 약 4년이 걸리는 거리에 있다")]),
    makeConfirmQ("q3", "별의 색깔은 무엇에 따라 달라지나요?", [findRange(paragraphs, "p1", "표면 온도가 높을수록 파란빛을 내고 낮을수록 붉은빛을 낸다")]),
    makeConfirmQ("q4", "새로운 별은 어떻게 탄생하나요?", [findRange(paragraphs, "p2", "우주 공간에 퍼져 있는 거대한 가스 구름이 중력에 의해 뭉쳐지면 새로운 별이 탄생한다")]),
    makeConfirmQ("q5", "태양 크기의 별이 죽으면 어떻게 되나요?", [findRange(paragraphs, "p2", "작고 뜨거운 백색 왜성이 되어 천천히 식어 간다")]),
    makeConfirmQ("q6", "옛날 뱃사람들이 방향을 알아낸 방법은?", [findRange(paragraphs, "p3", "옛날 뱃사람들은 북극성의 위치를 보고 방향을 알아냈고")]),
    makeConfirmQ("q7", "우리가 보는 별빛이 과거의 빛인 이유는?", [findRange(paragraphs, "p3", "별빛이 지구에 도달하기까지 수백 년에서 수천 년이 걸리기 때문에 우리가 보는 별빛은 먼 과거의 빛이라고 할 수 있다")])
  ];

  return { content: assembleFull(265, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ─── Day 266 (짝수 → 문학) ───
function buildDay266() {
  const paragraphs = [
    {
      id: "p1",
      text: "서준이는 전학을 온 첫날부터 혼자 점심을 먹었다. 새 학교의 아이들은 이미 친한 무리가 정해져 있었고 서준이에게 말을 건네는 사람은 없었다. 교실 구석에서 혼자 밥을 먹는 서준이를 쳐다본 아이는 같은 반의 지안이었다. 지안이도 조용한 성격이라 친구가 많지 않았지만 새로 온 서준이가 외로워 보여 마음이 쓰였다. 며칠 동안 망설이던 지안이는 용기를 내어 서준이에게 다가가 같이 점심 먹어도 되냐고 물었다."
    },
    {
      id: "p2",
      text: "서준이는 깜짝 놀랐지만 곧 고개를 끄덕이며 웃었다. 두 사람은 급식실에서 나란히 앉아 밥을 먹으며 취미에 대해 이야기를 나누었다. 서준이는 그림 그리기를 좋아했고 지안이는 이야기 쓰기를 좋아했다. 지안이가 자기가 쓴 짧은 이야기를 보여 주자 서준이는 그 이야기에 어울리는 그림을 그려 보겠다고 말했다. 다음 날 서준이는 작은 공책에 지안이의 이야기를 바탕으로 그린 삽화를 가져왔다. 지안이는 자신의 이야기가 그림이 되어 나타난 것을 보고 감동하여 눈시울이 붉어졌다."
    },
    {
      id: "p3",
      text: "두 사람은 함께 그림책을 만들기로 약속했다. 지안이가 이야기를 쓰고 서준이가 그림을 그리는 방식으로 방과 후마다 도서관에서 작업했다. 소식을 들은 다른 반 친구들도 관심을 보이며 합류하기 시작했다. 한 달 뒤 완성된 그림책은 학교 도서관에 전시되었고 많은 학생과 선생님들의 칭찬을 받았다. 서준이는 전학 온 첫날의 외로움이 까마득하게 느껴졌다. 작은 용기가 새로운 우정을 만들고 그 우정이 또 다른 만남으로 이어진다는 것을 서준이와 지안이 모두 깨달았다."
    }
  ];
  console.log(`Day 266 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "서준이가 전학 첫날 겪은 일은?", [findRange(paragraphs, "p1", "서준이는 전학을 온 첫날부터 혼자 점심을 먹었다")]),
    makeConfirmQ("q2", "지안이가 서준이에게 다가간 이유는?", [findRange(paragraphs, "p1", "새로 온 서준이가 외로워 보여 마음이 쓰였다")]),
    makeConfirmQ("q3", "서준이와 지안이의 취미는 각각 무엇인가요?", [findRange(paragraphs, "p2", "서준이는 그림 그리기를 좋아했고 지안이는 이야기 쓰기를 좋아했다")]),
    makeConfirmQ("q4", "서준이가 다음 날 가져온 것은?", [findRange(paragraphs, "p2", "서준이는 작은 공책에 지안이의 이야기를 바탕으로 그린 삽화를 가져왔다")]),
    makeConfirmQ("q5", "지안이가 삽화를 보고 어떤 반응을 했나요?", [findRange(paragraphs, "p2", "지안이는 자신의 이야기가 그림이 되어 나타난 것을 보고 감동하여 눈시울이 붉어졌다")]),
    makeConfirmQ("q6", "완성된 그림책은 어디에 전시되었나요?", [findRange(paragraphs, "p3", "완성된 그림책은 학교 도서관에 전시되었고 많은 학생과 선생님들의 칭찬을 받았다")]),
    makeConfirmQ("q7", "서준이와 지안이가 깨달은 것은?", [findRange(paragraphs, "p3", "작은 용기가 새로운 우정을 만들고 그 우정이 또 다른 만남으로 이어진다는 것을 서준이와 지안이 모두 깨달았다")])
  ];

  return { content: assembleFull(266, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ─── Day 267 (홀수 → 비문학) ───
function buildDay267() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리가 매일 사용하는 종이는 대부분 나무에서 만들어진다. 나무의 줄기를 잘게 쪼개어 물과 화학 약품으로 처리하면 섬유질만 남는데 이것을 펄프라고 부른다. 펄프를 물에 풀어 얇게 펴서 말리면 종이가 된다. 한 장의 종이를 만들기 위해 나무뿐만 아니라 많은 양의 물과 에너지가 필요하다. 종이 한 톤을 만들려면 나무 스무 그루 이상이 쓰인다고 하니 종이 사용이 숲에 미치는 영향은 결코 작지 않다."
    },
    {
      id: "p2",
      text: "종이를 재활용하면 나무를 베지 않고도 새 종이를 만들 수 있다. 사용한 종이를 모아서 물에 풀어 다시 펄프로 만든 뒤 불순물을 걸러 내고 표백하면 재생 종이가 완성된다. 재생 종이는 새 종이보다 에너지를 약 70퍼센트 적게 사용하고 물 소비량도 크게 줄일 수 있다. 또한 종이를 태우거나 매립하면 발생하는 온실 가스도 줄어든다. 전 세계적으로 종이 재활용률을 높이면 매년 수백만 그루의 나무를 살릴 수 있다고 전문가들은 말하고 있다."
    },
    {
      id: "p3",
      text: "종이 사용을 줄이기 위한 다양한 노력도 이루어지고 있다. 학교에서는 양면 인쇄를 권장하고 디지털 교과서를 도입하여 종이 교재의 사용을 줄여 나가고 있다. 기업에서는 전자 문서를 활용하여 불필요한 인쇄를 줄이려고 노력하고 있다. 개인적으로도 메모를 할 때 이면지를 활용하거나 불필요한 전단지를 거절하는 작은 실천이 도움이 된다. 나무 한 그루가 자라는 데는 수십 년이 걸리지만 종이 한 장을 아끼는 것은 지금 당장 할 수 있는 일이다. 작은 습관이 모이면 숲을 지키는 큰 힘이 될 수 있다."
    }
  ];
  console.log(`Day 267 지문 길이: ${charLen(paragraphs)}자`);

  const confirmQuestions = [
    makeConfirmQ("q1", "펄프란 무엇인가요?", [findRange(paragraphs, "p1", "나무의 줄기를 잘게 쪼개어 물과 화학 약품으로 처리하면 섬유질만 남는데 이것을 펄프라고 부른다")]),
    makeConfirmQ("q2", "종이 한 톤을 만드는 데 필요한 나무의 양은?", [findRange(paragraphs, "p1", "종이 한 톤을 만들려면 나무 스무 그루 이상이 쓰인다고 하니")]),
    makeConfirmQ("q3", "재생 종이를 만드는 과정은?", [findRange(paragraphs, "p2", "사용한 종이를 모아서 물에 풀어 다시 펄프로 만든 뒤 불순물을 걸러 내고 표백하면 재생 종이가 완성된다")]),
    makeConfirmQ("q4", "재생 종이의 에너지 절약 효과는?", [findRange(paragraphs, "p2", "재생 종이는 새 종이보다 에너지를 약 70퍼센트 적게 사용하고 물 소비량도 크게 줄일 수 있다")]),
    makeConfirmQ("q5", "종이 재활용률을 높이면 어떤 효과가 있나요?", [findRange(paragraphs, "p2", "전 세계적으로 종이 재활용률을 높이면 매년 수백만 그루의 나무를 살릴 수 있다고 전문가들은 말하고 있다")]),
    makeConfirmQ("q6", "학교에서 종이 사용을 줄이기 위한 노력은?", [findRange(paragraphs, "p3", "학교에서는 양면 인쇄를 권장하고 디지털 교과서를 도입하여 종이 교재의 사용을 줄여 나가고 있다")]),
    makeConfirmQ("q7", "개인이 할 수 있는 종이 절약 실천은?", [findRange(paragraphs, "p3", "메모를 할 때 이면지를 활용하거나 불필요한 전단지를 거절하는 작은 실천이 도움이 된다")])
  ];

  return { content: assembleFull(267, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ─── 실행부 ───
const results = [
  { dayIndex: 263, ...buildDay263() },
  { dayIndex: 264, ...buildDay264() },
  { dayIndex: 265, ...buildDay265() },
  { dayIndex: 266, ...buildDay266() },
  { dayIndex: 267, ...buildDay267() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});
const tempBatchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-s3-263-267.json');
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
