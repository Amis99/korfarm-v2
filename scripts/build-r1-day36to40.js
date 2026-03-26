#!/usr/bin/env node
// 러셀1 Day 36~40 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE(문학), 홀수 Day = NONFICTION(비문학)
// 목표 글자수: 1100자 ±50 (1050~1150)
// 대상: 중1~중2

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-russell1.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/russell1');

// ─── 유틸리티 함수 ───
function findSentences(text) {
  const sentences = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1;
      while (next < text.length && text[next] === ' ') next++;
      start = next;
    }
  }
  if (start < text.length) sentences.push({ start, end: text.length, text: text.substring(start) });
  return sentences;
}

function findRange(paragraphs, pid, searchText) {
  const para = paragraphs.find(p => p.id === pid);
  if (!para) throw new Error(`문단 ${pid}를 찾을 수 없습니다.`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}" not found in ${pid}`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

function hashIdx(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// ─── Day 36: 문학 (LITERATURE) — 도시에서 온 전학생과 시골 아이의 우정 (소설) ───
function buildDay36() {
  const paragraphs = [
    {
      id: "p1",
      text: "서울에서 전학 온 민재가 교실 문을 열고 들어왔을 때, 아이들의 시선이 일제히 쏠렸다. 새하얀 운동화에 깔끔한 교복 차림은 흙먼지가 묻은 아이들 사이에서 유독 눈에 띄었다. 담임 선생님이 자기소개를 시키자, 민재는 작은 목소리로 이름과 전학 온 이유를 말했다. 아버지의 직장 문제로 시골 외할머니 댁으로 내려오게 되었다는 것이었다. 아이들은 고개를 끄덕였지만 선뜻 다가가는 아이는 없었다. 쉬는 시간에도 민재는 자리에 혼자 앉아 창밖만 바라보았다. 점심시간에 혼자 앉아 도시락을 먹는 민재를 본 것은 준호였다. 준호는 아무 말 없이 옆자리에 앉아서 자기 반찬을 내밀었다. 민재는 처음엔 당황했지만, 준호의 환한 웃음에 조심스럽게 젓가락을 뻗었다."
    },
    {
      id: "p2",
      text: "준호는 마을에서 자란 토박이 아이였다. 방과 후에는 뒷산에 올라 매미를 잡거나 개울에서 물고기를 쫓는 것이 일상이었다. 민재에게 그런 놀이는 낯설기만 했다. 도시에서는 학원과 학원 사이를 버스로 오가는 것이 전부였기 때문이다. 준호가 개울로 가자고 손을 잡아끌자, 민재는 발이 젖을까 걱정하며 머뭇거렸다. 준호는 신발을 벗어 들고 첨벙 물속으로 뛰어들었다. 투명한 물살 아래로 작은 물고기들이 쏜살같이 도망치는 모습에 민재의 눈이 동그래졌다. 결국 민재도 양말을 벗고 조심스럽게 물에 발을 담갔다. 차가운 물이 발가락 사이로 스며드는 느낌이 기묘하게 즐거웠다."
    },
    {
      id: "p3",
      text: "한 달이 지나면서 민재는 조금씩 변해 갔다. 하얗던 운동화에는 흙이 묻었고, 무릎에는 넘어진 흔적이 생겼다. 반 아이들과도 스스럼없이 이야기를 나누게 되었지만, 준호와의 사이가 가장 가까웠다. 어느 날 준호가 뒷산 꼭대기에 비밀 장소가 있다며 민재를 데려갔다. 커다란 바위 위에 올라서자 마을 전체가 한눈에 내려다보였다. 논밭 사이로 난 좁은 길, 지붕 위에서 연기를 피워 올리는 집들, 멀리 반짝이는 저수지까지 모든 것이 그림처럼 펼쳐져 있었다. 민재는 이 풍경이 자기가 살던 도시의 높은 빌딩 숲보다 훨씬 아름답다고 느꼈다. 준호는 웃으며 말했다. 여기가 내가 제일 좋아하는 곳이야, 이제 네 것이기도 해. 민재는 고개를 끄덕이며 처음으로 이곳이 진짜 자기 집 같다고 생각했다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "민재가 시골 학교에 전학 오게 된 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "아버지의 직장 문제로 시골 외할머니 댁으로 내려오게 되었다는 것이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "준호가 민재에게 처음으로 다가간 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "아무 말 없이 옆자리에 앉아서 자기 반찬을 내밀었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "민재의 도시 생활과 준호의 시골 생활은 어떻게 달랐는가?",
      answerRanges: [findRange(paragraphs, "p2", "도시에서는 학원과 학원 사이를 버스로 오가는 것이 전부였기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "개울에서 민재가 느낀 감정은 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p2", "차가운 물이 발가락 사이로 스며드는 느낌이 기묘하게 즐거웠다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "한 달이 지난 뒤 민재에게 나타난 변화는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "하얗던 운동화에는 흙이 묻었고, 무릎에는 넘어진 흔적이 생겼다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "준호의 비밀 장소에서 민재가 깨달은 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "처음으로 이곳이 진짜 자기 집 같다고 생각했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(36, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 37: 비문학 (NONFICTION) — 바이러스와 세균의 차이 (생물학) ───
function buildDay37() {
  const paragraphs = [
    {
      id: "p1",
      text: "감기에 걸렸을 때 사람들은 흔히 세균 때문이라고 말하지만, 사실 대부분의 감기는 바이러스에 의해 발생한다. 세균과 바이러스는 모두 질병을 일으킬 수 있다는 공통점이 있지만, 그 구조와 특성은 완전히 다르다. 세균은 하나의 세포로 이루어진 아주 작은 생물이다. 세포막과 세포벽을 가지고 있으며, 스스로 영양분을 섭취하고 에너지를 만들어 살아갈 수 있다. 세균은 적절한 환경이 주어지면 둘로 쪼개지는 방식으로 빠르게 번식한다. 이에 비해 바이러스는 세균보다 훨씬 작으며, 세포로 이루어져 있지 않다. 바이러스는 유전 물질인 DNA나 RNA를 단백질 껍질이 감싸고 있는 단순한 구조를 가지고 있다."
    },
    {
      id: "p2",
      text: "바이러스와 세균의 가장 큰 차이는 스스로 살아갈 수 있는지의 여부이다. 세균은 물이나 흙, 음식물 등 다양한 환경에서 독립적으로 생존하고 번식할 수 있다. 반면 바이러스는 혼자서는 살아갈 수 없으며, 반드시 다른 생물의 세포 안에 들어가야만 번식할 수 있다. 바이러스가 살아 있는 세포에 달라붙으면, 자신의 유전 물질을 세포 안으로 집어넣는다. 그러면 감염된 세포는 바이러스의 명령에 따라 새로운 바이러스를 대량으로 만들어 낸다. 이 과정에서 감염된 세포는 결국 파괴되며, 새로 만들어진 바이러스가 주변의 다른 세포를 다시 감염시키면서 병이 퍼져 나간다. 이 때문에 과학자들 사이에서는 바이러스를 생물과 무생물의 경계에 있는 존재로 보는 시각이 널리 퍼져 있다."
    },
    {
      id: "p3",
      text: "세균과 바이러스의 차이는 치료 방법에서도 뚜렷하게 나타난다. 세균에 의한 감염은 항생제로 치료할 수 있다. 항생제는 세균의 세포벽을 파괴하거나 세균이 번식하는 과정을 방해하여 세균을 죽이는 약이다. 그러나 항생제는 바이러스에는 효과가 없다. 바이러스는 세포 구조를 가지고 있지 않기 때문에 항생제가 공격할 대상이 없기 때문이다. 바이러스 감염에는 항바이러스제라는 별도의 약을 사용하거나, 백신을 통해 미리 예방하는 방법이 주로 쓰인다. 백신은 약해진 바이러스나 바이러스의 일부 조각을 몸에 넣어 면역 체계가 바이러스를 기억하도록 만드는 원리를 이용한다. 이처럼 병의 원인이 세균인지 바이러스인지를 정확히 구별하는 것은 올바른 치료 방법을 선택하는 데 매우 중요한 출발점이 된다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "세균과 바이러스의 구조적 차이는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "세균은 하나의 세포로 이루어진 아주 작은 생물이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "바이러스가 세균보다 단순한 구조를 가지고 있다고 할 수 있는 근거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "바이러스는 유전 물질인 DNA나 RNA를 단백질 껍질이 감싸고 있는 단순한 구조를 가지고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "바이러스가 번식하기 위해 반드시 필요한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "반드시 다른 생물의 세포 안에 들어가야만 번식할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "바이러스를 생물과 무생물의 경계에 있는 존재로 보는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "바이러스가 살아 있는 세포에 달라붙으면, 자신의 유전 물질을 세포 안으로 집어넣는다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "항생제가 바이러스에 효과가 없는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "바이러스는 세포 구조를 가지고 있지 않기 때문에 항생제가 공격할 대상이 없기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "백신이 바이러스 감염을 예방하는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "약해진 바이러스나 바이러스의 일부 조각을 몸에 넣어 면역 체계가 바이러스를 기억하도록 만드는 원리를 이용한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(37, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 38: 문학 (LITERATURE) — 할아버지의 낚시 (수필) ───
function buildDay38() {
  const paragraphs = [
    {
      id: "p1",
      text: "어린 시절 여름방학이면 나는 어김없이 시골 할아버지 댁에 갔다. 할아버지는 새벽이면 낡은 낚싯대 두 개를 챙겨 저수지로 향하셨다. 나도 따라가겠다고 졸랐지만 할아버지는 늘 고개를 저으셨다. 새벽에 일어나지 못하면 자격이 없다는 것이었다. 초등학교 사 학년이 되던 해 여름, 나는 결심했다. 전날 밤 자명종을 새벽 네 시에 맞추어 놓고 일찍 잠자리에 들었다. 이불 속에서 심장이 두근거려 잠이 오지 않았지만, 어느 순간 깜빡 잠이 들었다. 요란한 자명종 소리에 눈을 떴을 때 아직 밖은 캄캄했다. 부엌에서 주전자 물 끓는 소리가 들렸다. 할아버지가 이미 일어나 계셨던 것이다. 나는 부랴부랴 옷을 입고 부엌으로 내려갔다. 할아버지는 웃지 않으셨지만 말없이 낚싯대 하나를 내 손에 쥐여 주셨다."
    },
    {
      id: "p2",
      text: "저수지까지는 논두렁을 따라 이십 분쯤 걸어야 했다. 풀잎에 맺힌 이슬이 운동화를 적셨지만 개의치 않았다. 저수지에 도착하자 할아버지는 자리를 잡고 미끼를 꿰는 법을 차근차근 가르쳐 주셨다. 지렁이를 바늘에 꿰는 일이 징그러웠지만 할아버지 앞에서 싫은 내색을 할 수 없었다. 찌를 물에 띄우고 나자 할아버지가 조용히 말씀하셨다. 물고기는 조급한 사람에게 오지 않는다, 기다릴 줄 알아야 한다고. 그 뒤로 긴 침묵이 이어졌다. 새들이 울고 물 위로 안개가 천천히 걷히는 동안 나는 찌만 바라보았다. 한 시간이 지나도 찌는 꿈쩍도 하지 않았다. 지루해서 옆을 보니 할아버지는 미동도 없이 물 위를 바라보고 계셨다. 그 모습이 마치 물속의 물고기보다 더 고요한 존재 같았다."
    },
    {
      id: "p3",
      text: "마침내 찌가 흔들렸을 때 나는 벌떡 일어나 낚싯대를 힘껏 당겼다. 그러나 줄에는 아무것도 걸려 있지 않았다. 할아버지가 조용히 웃으시며 말씀하셨다. 너무 빨리 당기면 물고기가 놀라 도망간다고. 다시 미끼를 달고 기다렸다. 두 번째로 찌가 움직였을 때 나는 참을성 있게 기다렸다가 천천히 낚싯대를 들어 올렸다. 손바닥만 한 붕어 한 마리가 은빛 비늘을 번뜩이며 물 위로 올라왔다. 그때의 짜릿한 기쁨은 지금도 잊을 수가 없다. 할아버지는 비로소 환하게 웃으시며 내 머리를 쓰다듬어 주셨다. 지금 생각하면 할아버지가 가르쳐 주신 것은 낚시가 아니라 기다림의 자세였다. 조급하지 않게 때를 기다리되 기회가 오면 놓치지 않는 것, 그것이 할아버지가 물가에서 내게 남겨 주신 가르침이었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "할아버지가 낚시에 따라오려면 갖춰야 할 자격으로 말씀하신 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "새벽에 일어나지 못하면 자격이 없다는 것이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "할아버지가 낚싯대를 건네 주신 상황에서 보여 준 태도는 어떠했는가?",
      answerRanges: [findRange(paragraphs, "p1", "웃지 않으셨지만 말없이 낚싯대 하나를 내 손에 쥐여 주셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "할아버지가 낚시에서 중요하다고 가르쳐 주신 덕목은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "물고기는 조급한 사람에게 오지 않는다, 기다릴 줄 알아야 한다고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "첫 번째 시도에서 물고기를 놓친 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "너무 빨리 당기면 물고기가 놀라 도망간다고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "두 번째 시도에서 글쓴이가 달리 행동한 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "참을성 있게 기다렸다가 천천히 낚싯대를 들어 올렸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 할아버지에게서 진정으로 배운 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "조급하지 않게 때를 기다리되 기회가 오면 놓치지 않는 것, 그것이 할아버지가 물가에서 내게 남겨 주신 가르침이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(38, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 39: 비문학 (NONFICTION) — 재활용의 과학적 과정 (환경과학) ───
function buildDay39() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리가 분리수거함에 넣는 페트병이 다시 쓸 수 있는 물건으로 바뀌기까지는 여러 단계의 과학적 과정을 거친다. 먼저 수거된 페트병은 재활용 공장으로 운반되어 색깔과 종류에 따라 분류된다. 투명한 페트병과 색이 있는 페트병은 재활용 가치가 다르기 때문에 반드시 나누어야 한다. 분류가 끝난 페트병은 잘게 부수는 과정을 거치는데, 이를 파쇄라고 한다. 파쇄된 조각은 물에 넣어 세척하는데, 이때 라벨이나 뚜껑에 사용된 다른 종류의 플라스틱은 물에 뜨는 성질을 이용하여 분리해 낸다. 페트 조각은 물보다 무겁기 때문에 가라앉고, 뚜껑 재질인 폴리에틸렌은 물보다 가벼워서 뜨게 되는 원리이다. 이렇게 깨끗하게 분리된 페트 조각을 플레이크라고 부른다."
    },
    {
      id: "p2",
      text: "플레이크는 높은 온도로 녹여서 작은 알갱이 형태로 만드는 과정을 거치는데, 이 알갱이를 펠릿이라고 한다. 펠릿은 새로운 플라스틱 제품을 만드는 원료가 된다. 놀라운 점은 페트병에서 만든 펠릿으로 옷의 원료가 되는 섬유를 뽑아낼 수 있다는 것이다. 펠릿을 녹여 가느다란 실처럼 뽑아내면 폴리에스터 섬유가 되며, 이것으로 티셔츠나 운동복을 만들 수 있다. 페트병 약 열두 개 정도면 티셔츠 한 벌을 만들 수 있다고 하니, 페트병 재활용이 얼마나 효율적인지 알 수 있다. 이 밖에도 펠릿은 식품 용기, 장난감, 자동차 내장재 등 다양한 제품으로 재탄생한다. 이처럼 폐플라스틱이 새 제품의 원료로 다시 사용되는 과정을 물질 재활용이라고 한다."
    },
    {
      id: "p3",
      text: "재활용의 효과는 자원 절약에만 그치지 않는다. 플라스틱의 원료인 석유를 절약할 수 있을 뿐 아니라, 새로운 플라스틱을 만들 때보다 이산화탄소 배출량이 크게 줄어든다는 점도 중요하다. 연구에 따르면 페트병을 재활용하면 새로 만드는 경우에 비해 에너지 소비가 약 칠십 퍼센트 줄어든다. 다만 재활용에도 한계는 있다. 플라스틱은 재활용할 때마다 분자 구조가 조금씩 손상되어 품질이 떨어지기 때문에, 무한히 반복해서 재활용할 수는 없다. 보통 페트병은 두세 번 정도 재활용이 가능한 것으로 알려져 있다. 따라서 재활용도 중요하지만, 애초에 플라스틱 사용 자체를 줄이는 것이 환경 보호를 위한 가장 근본적인 방법이라 할 수 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "수거된 페트병을 색깔에 따라 분류하는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "투명한 페트병과 색이 있는 페트병은 재활용 가치가 다르기 때문에 반드시 나누어야 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "파쇄된 페트 조각에서 뚜껑 재질을 분리하는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "페트 조각은 물보다 무겁기 때문에 가라앉고, 뚜껑 재질인 폴리에틸렌은 물보다 가벼워서 뜨게 되는 원리이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "펠릿으로 폴리에스터 섬유를 만드는 과정은 어떠한가?",
      answerRanges: [findRange(paragraphs, "p2", "펠릿을 녹여 가느다란 실처럼 뽑아내면 폴리에스터 섬유가 되며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "폐플라스틱이 새 제품의 원료로 다시 사용되는 과정을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "폐플라스틱이 새 제품의 원료로 다시 사용되는 과정을 물질 재활용이라고 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "플라스틱을 무한히 재활용할 수 없는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "플라스틱은 재활용할 때마다 분자 구조가 조금씩 손상되어 품질이 떨어지기 때문에, 무한히 반복해서 재활용할 수는 없다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "환경 보호를 위한 가장 근본적인 방법으로 제시된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "애초에 플라스틱 사용 자체를 줄이는 것이 환경 보호를 위한 가장 근본적인 방법이라 할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(39, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 40: 문학 (LITERATURE) — 겨울방학 시골집 이야기 (생활문) ───
function buildDay40() {
  const paragraphs = [
    {
      id: "p1",
      text: "겨울방학이 시작되자마자 우리 가족은 외할머니 댁으로 향했다. 차를 타고 두 시간 넘게 달려서 시골집 마당에 도착하니 외할머니께서 대문 앞에서 기다리고 계셨다. 두 팔을 벌려 나를 안아 주시는 외할머니의 품에서 된장 냄새가 났다. 장독대에서 막 된장을 퍼 오셨나 보다. 방 안에는 군불이 지펴져 있어서 들어가자마자 온몸이 따뜻해졌다. 외할머니는 방학 동안 잘 먹어야 한다며 벌써 부엌에서 무엇인가를 준비하고 계셨다. 잠시 뒤 밥상에는 갓 지은 쌀밥과 김이 모락모락 나는 된장찌개가 올라왔다. 도시에서 먹는 음식과 재료가 크게 다르지 않은데도, 외할머니가 해 주시는 밥은 언제나 특별한 맛이 났다. 아마 정성이 맛의 비밀이었을 것이다."
    },
    {
      id: "p2",
      text: "다음 날 아침 눈을 떠 보니 세상이 하얗게 변해 있었다. 밤사이 눈이 내린 것이다. 마당에는 발자국 하나 없는 깨끗한 눈이 무릎까지 쌓여 있었다. 나는 패딩 점퍼를 입고 장화를 신은 채 마당으로 뛰어나갔다. 눈을 뭉쳐서 눈사람을 만들기 시작했다. 동네 아이 몇 명이 모여들어 함께 커다란 눈사람을 완성했다. 외삼촌이 헌 모자와 목도리를 가져다주셔서 눈사람에게 씌워 주니 마치 살아 있는 사람 같았다. 한참을 놀다 보니 손이 꽁꽁 얼었다. 집으로 돌아오자 외할머니가 뜨거운 팥죽 한 그릇을 내밀어 주셨다. 새알심이 들어 있는 팥죽을 한 숟갈 떠먹자 차가웠던 몸속까지 따뜻해지는 것 같았다."
    },
    {
      id: "p3",
      text: "방학의 마지막 날 밤, 외할머니와 마루에 나란히 앉아 하늘을 올려다보았다. 도시에서는 볼 수 없었던 수많은 별이 까만 하늘 가득 빛나고 있었다. 외할머니는 저기 보이는 세 개의 별이 오리온자리라고 알려 주셨다. 겨울에만 선명하게 보이는 별자리란다. 찬 바람이 불었지만 외할머니가 덮어 주신 담요 덕분에 춥지 않았다. 나는 외할머니 곁에 바짝 붙어 앉아 하늘을 바라보며, 이 순간이 영원히 계속되었으면 좋겠다고 생각했다. 내일이면 다시 도시로 돌아가야 한다는 사실이 마음에 걸렸지만, 외할머니는 방학이 끝나도 별은 언제나 같은 자리에 있다고 말씀하셨다. 그 말이 마치 우리 사이의 마음도 늘 같은 자리에 있을 것이라는 뜻처럼 들렸다. 나는 외할머니 손을 꼭 잡으며 다음 방학에 꼭 다시 오겠다고 약속했다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "외할머니 댁에 도착했을 때 글쓴이가 느낀 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "외할머니의 품에서 된장 냄새가 났다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "외할머니 밥이 특별한 맛이 나는 비밀은 무엇이라고 글쓴이는 생각하는가?",
      answerRanges: [findRange(paragraphs, "p1", "아마 정성이 맛의 비밀이었을 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "눈이 온 다음 날 글쓴이가 한 일은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "눈을 뭉쳐서 눈사람을 만들기 시작했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "눈놀이 후 외할머니가 해 주신 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "외할머니가 뜨거운 팥죽 한 그릇을 내밀어 주셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "외할머니가 방학이 끝나도 별은 같은 자리에 있다고 한 말의 숨은 뜻은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "그 말이 마치 우리 사이의 마음도 늘 같은 자리에 있을 것이라는 뜻처럼 들렸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 외할머니에게 마지막으로 한 약속은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "다음 방학에 꼭 다시 오겠다고 약속했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(40, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───
function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs);
  const recall = buildRecallCards(paragraphs, 8);

  const dayStr = String(dayIndex).padStart(3, '0');
  const contentId = `dr-r1-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(러셀 1) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "RUSSELL_1",
    schoolGradeRange: { min: 7, max: 8 },
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
      recall,
      confirm: { questions: confirmQuestions }
    }
  };
}

function buildTimeline(paragraphs) {
  const timeline = [];
  let stepNum = 1;

  const paraSentMap = {};
  for (const p of paragraphs) {
    paraSentMap[p.id] = findSentences(p.text);
  }

  for (const para of paragraphs) {
    const sentences = paraSentMap[para.id];

    for (let si = 0; si < sentences.length; si++) {
      const sent = sentences[si];
      const correctText = truncate(sent.text, 80);

      const wrongTexts = [];
      const otherParas = paragraphs.filter(p => p.id !== para.id);
      for (let oi = 0; oi < otherParas.length && wrongTexts.length < 3; oi++) {
        const opSents = paraSentMap[otherParas[oi].id];
        const idx = (si + oi) % opSents.length;
        wrongTexts.push(truncate(opSents[idx].text, 80));
      }

      const choices = shuffleChoices(correctText, wrongTexts, `s${stepNum}`);

      timeline.push({
        stepId: `s${stepNum++}`,
        highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] },
        question: {
          prompt: "하이라이트된 문장의 내용으로 알맞은 것은?",
          choices: choices.list,
          answerId: choices.answerId,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }

    const firstSent = sentences[0];
    const centralCorrect = truncate(firstSent.text, 80);
    const centralWrongs = [];
    const otherParas = paragraphs.filter(p => p.id !== para.id);
    for (const op of otherParas) {
      const opSents = paraSentMap[op.id];
      centralWrongs.push(truncate(opSents[0].text, 80));
    }
    const centralChoices = shuffleChoices(centralCorrect, centralWrongs, para.id + "_central");

    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        choices: centralChoices.list,
        answerId: centralChoices.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }

  return timeline;
}

function truncate(text, maxLen) {
  return text.length > maxLen ? text.substring(0, maxLen) : text;
}

function shuffleChoices(correct, wrongs, seed) {
  const items = [correct, ...wrongs.slice(0, 3)];
  const pos = hashIdx(seed) % 4;
  if (pos !== 0) {
    const temp = items[0];
    items[0] = items[pos];
    items[pos] = temp;
  }
  const ids = ["A", "B", "C", "D"];
  const list = items.map((text, i) => ({ id: ids[i], text }));
  const answerId = ids[items.indexOf(correct)];
  return { list, answerId };
}

function buildRecallCards(paragraphs, cardCount) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / cardCount);

  const cards = [];
  const correctOrder = [];

  for (let i = 0; i < cardCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    const cardText = fullText.substring(start, end);
    const cardId = `c${i + 1}`;
    cards.push({ id: cardId, text: cardText });
    correctOrder.push(cardId);
  }

  return { cards, correctOrder, seedPenalty: 1 };
}

// ─── 배치 아이템 래퍼 ───
function wrapBatchItem(content, dayIndex, subArea) {
  return {
    content_type: "DAILY_READING",
    level_id: "RUSSELL_1",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content
  };
}

// ─── 메인 실행 ───
function main() {
  console.log("=== 러셀1 Day 36~40 빌드 시작 ===\n");

  const contents = [
    buildDay36(),
    buildDay37(),
    buildDay38(),
    buildDay39(),
    buildDay40()
  ];

  // 검증
  let allValid = true;
  for (const c of contents) {
    const len = c.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
    const dayNum = parseInt(c.contentId.split('-')[2]);
    if (len < 1050 || len > 1150) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1050~1150)`);
      allValid = false;
    } else {
      console.log(`Day ${dayNum}: ${len}자 (적합)`);
    }

    if (c.payload.recall.cards.length !== 8) {
      console.warn(`경고: Day ${dayNum} 복기 카드 ${c.payload.recall.cards.length}장 (8장 필요)`);
      allValid = false;
    }

    const qCount = c.payload.confirm.questions.length;
    if (qCount !== 6) {
      console.warn(`경고: Day ${dayNum} 확인 문항 ${qCount}개 (6개 필요)`);
      allValid = false;
    }
  }

  // static 파일 생성
  for (const c of contents) {
    const dayNum = parseInt(c.contentId.split('-')[2]);
    const dayStr = String(dayNum).padStart(3, '0');
    const filePath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(filePath, JSON.stringify(c, null, 2), 'utf8');
    console.log(`생성: ${dayStr}.json`);
  }

  // 배치 파일 갱신
  console.log("\n배치 파일 갱신 중...");
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`현재 배치 items 수: ${batchData.items.length}`);

  const dayIndices = [36, 37, 38, 39, 40];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1;
    const subArea = contents[i].subArea;
    const batchItem = wrapBatchItem(contents[i], dayIdx, subArea);

    if (batchData.items[batchIdx]) {
      console.log(`교체: items[${batchIdx}] (${batchData.items[batchIdx].content.contentId} → ${contents[i].contentId})`);
    }
    batchData.items[batchIdx] = batchItem;
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료`);

  console.log("\n=== 빌드 완료 ===");
}

main();
