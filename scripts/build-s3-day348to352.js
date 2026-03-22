#!/usr/bin/env node
// 소쉬르3 Day 348~352 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE (문학), 홀수 Day = NONFICTION (비문학)
// 목표 글자수: 700±50자 (650~750자), 초등 5학년 수준

const fs = require('fs');
const path = require('path');

// ─── 유틸리티 함수 ───
function findSentences(text) {
  const sentences = []; let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1; while (next < text.length && (text[next] === ' ' || text[next] === '\n')) next++; start = next;
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
  let stepNum = 0; const timeline = [];
  paragraphs.forEach((para) => {
    const sents = findSentences(para.text);
    sents.forEach((sent) => { stepNum++; timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] } }); });
    stepNum++; timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] } });
  });
  return timeline;
}

function buildRecallCards(paragraphs) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length; const chunkSize = Math.ceil(totalLen / 8); const cards = [];
  for (let i = 0; i < 8; i++) { const s = i * chunkSize; const e = Math.min(s + chunkSize, totalLen); cards.push({ id: `c${i+1}`, text: fullText.substring(s, e) }); }
  return cards;
}

function makeConfirmQ(id, prompt, ranges) {
  return { id, prompt, answerRanges: ranges, scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: "ANY" };
}

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs); const cards = buildRecallCards(paragraphs);
  const nn = String(dayIndex).padStart(3, '0');
  return { contentId: `dr-s3-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(소쉬르 3) Day ${dayIndex} ${subAreaKo}`, description: "일일 독해 - 정독·복기·확인",
    targetLevel: "SAUSSURE_3", schoolGradeRange: { min: 5, max: 5 }, area: "READING", subArea,
    competencies: ["READING"], tags: ["daily"], access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 }, timeLimitSec: 480, assets: {},
    payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 }, confirm: { questions: confirmQuestions } }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return { content_type: "DAILY_READING", level_id: "SAUSSURE_3", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// ─── Day 348: 문학 (LITERATURE) - 봄비 내리는 날 ───
function buildDay348() {
  const paragraphs = [
    {
      id: "p1",
      text: "아침부터 하늘에서 가느다란 봄비가 내리기 시작했다. 지윤이는 창문 너머로 빗방울이 흘러내리는 모습을 바라보며 한숨을 쉬었다. 오늘은 친구들과 운동장에서 피구를 하기로 약속한 날이었기 때문이다. 교실 안은 비 때문에 밖으로 나가지 못한 아이들로 가득했고, 여기저기서 아쉬운 목소리가 들려왔다. 지윤이는 책상에 턱을 괴고 빗소리에 귀를 기울였다. 빗방울이 유리창에 부딪히며 내는 소리가 마치 작은 북을 두드리는 것 같았다."
    },
    {
      id: "p2",
      text: "점심시간이 되자 비는 더욱 세차게 내렸다. 지윤이는 급식실로 가는 복도에서 1층 화단을 내려다보았다. 겨울 내내 말라 있던 흙이 빗물을 머금어 촉촉하게 젖어 있었다. 그 사이로 작은 새싹 하나가 머리를 내밀고 있는 것이 보였다. 지윤이는 눈을 크게 뜨고 다시 한번 자세히 들여다보았다. 연한 초록빛 새싹이 빗물을 맞으며 꿋꿋하게 서 있었다. 그 모습을 보자 지윤이의 마음속에 작은 기쁨이 피어올랐다. 비가 와서 속상했던 마음이 조금씩 풀리는 것 같았다."
    },
    {
      id: "p3",
      text: "오후가 되자 비가 점점 그치기 시작했다. 하늘 한쪽에서 구름 사이로 햇살이 비추자 운동장에 작은 물웅덩이들이 반짝반짝 빛났다. 쉬는 시간에 지윤이는 친구들과 함께 운동장으로 나갔다. 발로 물웅덩이를 첨벙첨벙 밟으니 물이 사방으로 튀었다. 친구들도 함께 웃으며 물장구를 쳤다. 지윤이는 비가 온 덕분에 더 재미있는 놀이를 하게 되었다고 생각했다. 집으로 돌아가는 길에 지윤이는 화단의 새싹을 다시 한번 살펴보았다. 새싹은 아까보다 조금 더 기운차게 서 있는 것 같았다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "지윤이가 아침에 한숨을 쉰 까닭은 무엇인가요?",
      [findRange(paragraphs, "p1", "오늘은 친구들과 운동장에서 피구를 하기로 약속한 날이었기 때문이다")]),
    makeConfirmQ("q2", "빗방울이 유리창에 부딪히는 소리를 무엇에 비유했나요?",
      [findRange(paragraphs, "p1", "빗방울이 유리창에 부딪히며 내는 소리가 마치 작은 북을 두드리는 것 같았다")]),
    makeConfirmQ("q3", "화단에서 지윤이가 발견한 것은 무엇인가요?",
      [findRange(paragraphs, "p2", "작은 새싹 하나가 머리를 내밀고 있는 것이 보였다")]),
    makeConfirmQ("q4", "새싹을 보고 지윤이의 마음은 어떻게 변했나요?",
      [findRange(paragraphs, "p2", "비가 와서 속상했던 마음이 조금씩 풀리는 것 같았다")]),
    makeConfirmQ("q5", "비가 그친 후 운동장에서 지윤이는 무엇을 했나요?",
      [findRange(paragraphs, "p3", "발로 물웅덩이를 첨벙첨벙 밟으니 물이 사방으로 튀었다")]),
    makeConfirmQ("q6", "집으로 가는 길에 새싹의 모습은 어떠했나요?",
      [findRange(paragraphs, "p3", "새싹은 아까보다 조금 더 기운차게 서 있는 것 같았다")])
  ];

  const content = assembleFull(348, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 349: 비문학 (NONFICTION) - 우리나라의 전통 놀이 ───
function buildDay349() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리나라에는 옛날부터 전해 내려오는 재미있는 전통 놀이가 많다. 그중에서도 윷놀이는 설날에 온 가족이 함께 즐기는 대표적인 놀이이다. 윷놀이는 네 개의 윷을 던져서 나오는 결과에 따라 말을 옮기는 게임이다. 도, 개, 걸, 윷, 모의 다섯 가지 결과가 있으며 각각 말이 한 칸에서 다섯 칸까지 이동한다. 윷놀이는 규칙이 간단해서 어린이부터 어른까지 누구나 쉽게 참여할 수 있다. 가족끼리 편을 나누어 경쟁하면 더욱 신이 난다."
    },
    {
      id: "p2",
      text: "제기차기도 우리나라의 오래된 놀이 가운데 하나이다. 제기는 엽전에 한지를 끼워 만든 것으로 발로 차서 떨어뜨리지 않고 오래 차는 놀이이다. 한 발로만 차는 것을 외발차기라 하고 양발을 번갈아 쓰는 것을 양발차기라 한다. 제기차기는 겨울철에 아이들이 추운 날씨를 이겨 내기 위해 즐겨 했던 놀이로 몸이 따뜻해지고 균형 감각도 길러 준다. 요즘에도 체육 시간이나 민속놀이 행사에서 제기차기를 하는 학교가 많다."
    },
    {
      id: "p3",
      text: "팽이치기는 겨울에 많이 하는 또 다른 전통 놀이이다. 나무를 깎아 만든 팽이를 채로 때려서 오래 돌리는 것이 목표이다. 팽이가 넘어지지 않게 하려면 적절한 힘으로 채를 쳐야 하기 때문에 집중력이 필요하다. 친구들과 누가 더 오래 팽이를 돌리는지 겨루기도 한다. 이 밖에도 연날리기, 공기놀이, 비석치기 등 다양한 전통 놀이가 있다. 이러한 전통 놀이는 단순히 재미만 주는 것이 아니라 친구나 가족과 함께하면서 서로의 사이를 더욱 가깝게 만들어 주는 소중한 문화유산이다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "윷놀이에서 나올 수 있는 다섯 가지 결과는 무엇인가요?",
      [findRange(paragraphs, "p1", "도, 개, 걸, 윷, 모의 다섯 가지 결과가 있으며")]),
    makeConfirmQ("q2", "윷놀이를 누구나 쉽게 할 수 있는 까닭은 무엇인가요?",
      [findRange(paragraphs, "p1", "윷놀이는 규칙이 간단해서 어린이부터 어른까지 누구나 쉽게 참여할 수 있다")]),
    makeConfirmQ("q3", "제기는 어떻게 만드나요?",
      [findRange(paragraphs, "p2", "제기는 엽전에 한지를 끼워 만든 것으로")]),
    makeConfirmQ("q4", "제기차기를 하면 좋은 점은 무엇인가요?",
      [findRange(paragraphs, "p2", "몸이 따뜻해지고 균형 감각도 길러 준다")]),
    makeConfirmQ("q5", "팽이치기를 할 때 집중력이 필요한 까닭은 무엇인가요?",
      [findRange(paragraphs, "p3", "팽이가 넘어지지 않게 하려면 적절한 힘으로 채를 쳐야 하기 때문에 집중력이 필요하다")]),
    makeConfirmQ("q6", "전통 놀이가 소중한 문화유산인 까닭은 무엇인가요?",
      [findRange(paragraphs, "p3", "친구나 가족과 함께하면서 서로의 사이를 더욱 가깝게 만들어 주는 소중한 문화유산이다")])
  ];

  const content = assembleFull(349, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 350: 문학 (LITERATURE) - 새 친구 ───
function buildDay350() {
  const paragraphs = [
    {
      id: "p1",
      text: "새 학기가 시작되는 날 준서의 반에 전학생이 왔다. 선생님이 소개해 주신 아이의 이름은 하은이였다. 하은이는 작은 목소리로 인사를 했고 선생님은 준서 옆자리에 하은이를 앉게 했다. 하은이는 쉬는 시간에도 자리에 조용히 앉아 있었고 아무에게도 먼저 말을 걸지 않았다. 준서는 하은이에게 말을 걸고 싶었지만 무슨 말을 해야 할지 몰라서 망설이기만 했다. 그날 하루가 끝날 때까지 준서는 하은이와 한마디도 나누지 못했다."
    },
    {
      id: "p2",
      text: "다음 날 미술 시간에 선생님이 짝꿍과 함께 그림을 그리라고 하셨다. 준서는 하은이와 눈이 마주치자 작게 미소를 지으며 도화지를 내밀었다. 하은이도 살짝 웃으며 색연필을 꺼냈다. 두 사람은 바다를 주제로 그림을 그리기로 했다. 준서가 파란 바다를 칠하는 동안 하은이는 물고기와 해파리를 그렸다. 그림을 그리면서 둘은 점점 이야기를 나누기 시작했다. 하은이가 전에 살던 동네에는 바다가 가까이 있었다는 이야기를 들으며 준서는 눈을 반짝였다."
    },
    {
      id: "p3",
      text: "미술 시간이 끝나자 준서와 하은이가 함께 그린 그림이 교실 뒤쪽 게시판에 붙었다. 선생님이 두 사람의 그림을 칭찬하시자 하은이의 얼굴에 환한 미소가 떠올랐다. 점심시간에 준서는 하은이에게 같이 밥을 먹자고 말했다. 급식실로 함께 걸어가면서 둘은 좋아하는 음식이나 만화에 대해 이야기했다. 준서는 처음에 말을 걸기가 어려웠지만 용기를 내길 잘했다고 생각했다. 집으로 가는 길에 하은이가 내일도 같이 놀자고 말했을 때 준서의 마음은 봄바람처럼 따뜻해졌다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "선생님은 하은이를 어디에 앉게 했나요?",
      [findRange(paragraphs, "p1", "선생님은 준서 옆자리에 하은이를 앉게 했다")]),
    makeConfirmQ("q2", "첫날 준서가 하은이에게 말을 걸지 못한 까닭은 무엇인가요?",
      [findRange(paragraphs, "p1", "무슨 말을 해야 할지 몰라서 망설이기만 했다")]),
    makeConfirmQ("q3", "미술 시간에 두 사람은 무엇을 주제로 그림을 그렸나요?",
      [findRange(paragraphs, "p2", "두 사람은 바다를 주제로 그림을 그리기로 했다")]),
    makeConfirmQ("q4", "하은이가 전에 살던 동네의 특징은 무엇인가요?",
      [findRange(paragraphs, "p2", "하은이가 전에 살던 동네에는 바다가 가까이 있었다는 이야기를 들으며")]),
    makeConfirmQ("q5", "선생님이 그림을 칭찬하시자 하은이는 어떤 반응을 보였나요?",
      [findRange(paragraphs, "p3", "하은이의 얼굴에 환한 미소가 떠올랐다")]),
    makeConfirmQ("q6", "하은이가 내일도 같이 놀자고 했을 때 준서의 마음은 어떠했나요?",
      [findRange(paragraphs, "p3", "준서의 마음은 봄바람처럼 따뜻해졌다")])
  ];

  const content = assembleFull(350, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── Day 351: 비문학 (NONFICTION) - 소금의 역사와 쓰임 ───
function buildDay351() {
  const paragraphs = [
    {
      id: "p1",
      text: "소금은 사람이 살아가는 데 꼭 필요한 물질이다. 우리 몸속의 세포가 제대로 일하려면 적당한 양의 소금이 있어야 한다. 옛날에는 소금이 매우 귀해서 돈 대신 사용하기도 했다. 영어에서 월급을 뜻하는 샐러리라는 말도 소금을 뜻하는 라틴어에서 나온 것이다. 로마 시대에 군인들에게 소금을 주어 급료를 대신한 것에서 비롯되었다고 전해진다. 이처럼 소금은 오래전부터 사람들의 생활에 없어서는 안 될 중요한 역할을 해 왔다."
    },
    {
      id: "p2",
      text: "소금을 얻는 방법에는 여러 가지가 있다. 바닷물을 넓은 염전에 가두어 놓고 햇볕과 바람으로 물을 증발시켜 소금을 얻는 방법이 가장 널리 알려져 있다. 이렇게 만든 소금을 천일염이라고 부른다. 또한 땅속에 있는 소금 광산에서 캐내는 암염이라는 소금도 있다. 우리나라에서는 서해안 지역에 염전이 많이 있으며 특히 전라남도 신안군은 질 좋은 천일염으로 유명하다. 좋은 소금을 만들려면 깨끗한 바닷물과 충분한 햇볕 그리고 시간이 필요하다."
    },
    {
      id: "p3",
      text: "소금은 음식의 맛을 내는 것 외에도 다양한 곳에 쓰인다. 김치나 젓갈 같은 발효 음식을 만들 때 소금은 음식이 쉽게 상하지 않도록 보존하는 역할을 한다. 겨울철에 도로가 얼면 소금을 뿌려 얼음을 녹이기도 한다. 이것은 소금이 물의 어는점을 낮추는 성질을 이용한 것이다. 또한 소금물로 양치를 하면 입안의 세균을 줄이는 데 도움이 된다. 이렇게 소금은 우리 생활 곳곳에서 다양한 방법으로 쓰이고 있어 아주 유용한 자원이라고 할 수 있다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "옛날에 소금이 돈 대신 쓰인 예시는 무엇인가요?",
      [findRange(paragraphs, "p1", "로마 시대에 군인들에게 소금을 주어 급료를 대신한 것에서 비롯되었다고 전해진다")]),
    makeConfirmQ("q2", "샐러리라는 말의 유래는 무엇인가요?",
      [findRange(paragraphs, "p1", "영어에서 월급을 뜻하는 샐러리라는 말도 소금을 뜻하는 라틴어에서 나온 것이다")]),
    makeConfirmQ("q3", "천일염은 어떻게 만드나요?",
      [findRange(paragraphs, "p2", "바닷물을 넓은 염전에 가두어 놓고 햇볕과 바람으로 물을 증발시켜 소금을 얻는 방법")]),
    makeConfirmQ("q4", "우리나라에서 천일염으로 유명한 지역은 어디인가요?",
      [findRange(paragraphs, "p2", "전라남도 신안군은 질 좋은 천일염으로 유명하다")]),
    makeConfirmQ("q5", "발효 음식을 만들 때 소금의 역할은 무엇인가요?",
      [findRange(paragraphs, "p3", "소금은 음식이 쉽게 상하지 않도록 보존하는 역할을 한다")]),
    makeConfirmQ("q6", "겨울철에 도로에 소금을 뿌리는 원리는 무엇인가요?",
      [findRange(paragraphs, "p3", "소금이 물의 어는점을 낮추는 성질을 이용한 것이다")])
  ];

  const content = assembleFull(351, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ─── Day 352: 문학 (LITERATURE) - 별을 보는 밤 ───
function buildDay352() {
  const paragraphs = [
    {
      id: "p1",
      text: "여름방학에 수아는 시골 할머니 댁에 놀러 갔다. 도시에서는 볼 수 없는 넓은 마당과 풀벌레 소리가 수아를 반겨 주었다. 할머니는 저녁을 먹고 나서 마당에 돗자리를 깔아 주셨다. 수아가 돗자리에 누워 하늘을 올려다보자 셀 수 없이 많은 별들이 반짝이고 있었다. 도시에서는 한 번도 이렇게 많은 별을 본 적이 없었다. 수아는 입이 벌어질 만큼 놀라며 할머니에게 왜 여기서는 별이 이렇게 많이 보이냐고 물었다."
    },
    {
      id: "p2",
      text: "할머니는 도시에는 불빛이 많아서 별이 잘 보이지 않지만 시골은 주위가 어두워서 별이 더 잘 보인다고 설명해 주셨다. 할머니는 하늘을 가리키며 북두칠성과 북극성을 찾는 방법도 알려 주셨다. 국자 모양으로 생긴 일곱 개의 별이 북두칠성이고 국자 끝에서 다섯 배 정도 떨어진 곳에 있는 밝은 별이 북극성이라고 하셨다. 수아는 할머니가 알려 주신 대로 하늘에서 별을 찾아보았다. 정말로 국자 모양의 별을 발견하자 수아는 기쁜 마음에 손뼉을 쳤다."
    },
    {
      id: "p3",
      text: "그날 밤 수아는 할머니와 나란히 누워 오랫동안 별을 바라보았다. 할머니는 어릴 때 친구들과 별을 세다가 잠이 든 이야기도 들려주셨다. 수아는 별을 하나하나 세기 시작했지만 너무 많아서 금방 포기하고 웃음을 터뜨렸다. 풀벌레 소리와 함께 별빛이 쏟아지는 밤은 세상에서 가장 아름다운 순간 같았다. 수아는 도시로 돌아가면 별을 보러 다시 올 거라고 할머니에게 약속했다. 할머니는 수아의 머리를 쓰다듬으며 언제든 놀러 오라고 대답하셨다."
    }
  ];

  const confirmQuestions = [
    makeConfirmQ("q1", "수아가 시골에서 놀란 까닭은 무엇인가요?",
      [findRange(paragraphs, "p1", "도시에서는 한 번도 이렇게 많은 별을 본 적이 없었다")]),
    makeConfirmQ("q2", "시골에서 별이 더 잘 보이는 까닭은 무엇인가요?",
      [findRange(paragraphs, "p2", "도시에는 불빛이 많아서 별이 잘 보이지 않지만 시골은 주위가 어두워서 별이 더 잘 보인다고 설명해 주셨다")]),
    makeConfirmQ("q3", "북두칠성은 어떤 모양인가요?",
      [findRange(paragraphs, "p2", "국자 모양으로 생긴 일곱 개의 별이 북두칠성이고")]),
    makeConfirmQ("q4", "수아가 별을 찾았을 때 어떤 반응을 보였나요?",
      [findRange(paragraphs, "p2", "정말로 국자 모양의 별을 발견하자 수아는 기쁜 마음에 손뼉을 쳤다")]),
    makeConfirmQ("q5", "수아가 별을 세다가 포기한 까닭은 무엇인가요?",
      [findRange(paragraphs, "p3", "수아는 별을 하나하나 세기 시작했지만 너무 많아서 금방 포기하고 웃음을 터뜨렸다")]),
    makeConfirmQ("q6", "수아가 할머니에게 한 약속은 무엇인가요?",
      [findRange(paragraphs, "p3", "수아는 도시로 돌아가면 별을 보러 다시 올 거라고 할머니에게 약속했다")])
  ];

  const content = assembleFull(352, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ─── 실행부 ───
const results = [
  { dayIndex: 348, ...buildDay348() },
  { dayIndex: 349, ...buildDay349() },
  { dayIndex: 350, ...buildDay350() },
  { dayIndex: 351, ...buildDay351() },
  { dayIndex: 352, ...buildDay352() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'saussure3');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

const batchDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(batchDir)) fs.mkdirSync(batchDir, { recursive: true });
fs.writeFileSync(
  path.join(batchDir, 'batch-s3-348-352.json'),
  JSON.stringify(batchItems, null, 2), 'utf8'
);
console.log(`  ✅ generated/new/batch-s3-348-352.json`);

console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 650 && len <= 750 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
