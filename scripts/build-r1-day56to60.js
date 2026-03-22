#!/usr/bin/env node
// 러셀1 Day 56~60 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE, 홀수 Day = NONFICTION (56~60 범위)
// Day 56: LITERATURE, Day 57: NONFICTION, Day 58: LITERATURE, Day 59: NONFICTION, Day 60: LITERATURE
// 목표 글자수: 1100자 ±50 (1050~1150)

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

// ─── Day 56: 문학 (LITERATURE) — 빗소리를 듣는 밤 (수필) ───
function buildDay56() {
  const paragraphs = [
    {
      id: "p1",
      text: "잠이 오지 않는 밤이면 나는 귀를 기울여 빗소리를 듣곤 했다. 처마 끝에서 떨어지는 빗방울은 양철 지붕을 두드리며 작은 북소리 같은 리듬을 만들었다. 그 리듬은 불규칙하면서도 묘하게 편안한 박자를 가지고 있었다. 어릴 때 외갓집은 오래된 기와집이었는데, 비가 오면 처마에서 빗줄기가 줄줄이 떨어져 마당에 작은 도랑을 만들었다. 나는 마루에 엎드려 그 빗줄기를 구경하며 시간이 가는 줄 몰랐다. 외할머니는 빗소리가 들리면 찬장에서 부침가루를 꺼내 셨다. 부침개를 부치는 기름 냄새가 빗소리와 섞여 집 안을 가득 채우면, 그것만으로 마음이 넉넉해지는 기분이 들었다. 비 오는 날의 외갓집은 세상에서 가장 아늑한 장소였다."
    },
    {
      id: "p2",
      text: "도시로 이사 온 뒤로는 빗소리를 듣기 어려워졌다. 아파트의 이중 유리창은 바깥 소리를 거의 차단했고, 비가 와도 에어컨 실외기 소리에 묻혀 빗방울 떨어지는 소리를 구분할 수 없었다. 대신 비가 오면 길이 막히고, 우산을 챙기지 못해 옷이 젖고, 빨래가 마르지 않아 짜증이 났다. 비는 더 이상 정겨운 풍경이 아니라 불편한 날씨가 되어 버렸다. 어느 날 퇴근길에 갑자기 소나기가 쏟아졌다. 우산이 없어서 가게 처마 밑에 서서 비가 그치기를 기다렸다. 그때 처마에서 떨어지는 빗방울 소리가 귀에 들어왔다. 또드득 또드득, 그 소리는 어릴 적 외갓집 마루에서 듣던 그 소리와 꼭 닮아 있었다. 순간 가슴 한 편이 따뜻해지며 어릴 적 기억이 물밀 듯 밀려왔다."
    },
    {
      id: "p3",
      text: "그날 이후 나는 비가 오면 일부러 창문을 조금 열어 놓는다. 빗소리가 희미하게라도 들리면 마음이 한결 편안해지기 때문이다. 어떤 소리는 단순한 물리적 현상을 넘어서 기억과 감정을 불러일으키는 힘이 있다. 심리학에서는 이를 감각 기억이라 부르며, 특정 감각이 과거의 경험을 생생하게 되살리는 현상이라 설명한다. 빗소리는 나에게 외할머니의 부침개 냄새를, 마루 위 낡은 이불의 감촉을, 기와지붕 아래의 안온한 시간을 떠올리게 한다. 사람들은 흔히 추억이 희미해진다고 말하지만, 나는 추억이 사라지는 것이 아니라 잠들어 있을 뿐이라고 생각한다. 적절한 감각이 자극되면 추억은 언제든 생생하게 깨어난다. 빗소리는 나의 잠든 추억을 깨우는 가장 다정한 알람이다. 그래서 나는 오늘도 빗소리를 기다린다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "글쓴이에게 외갓집의 비 오는 날은 어떤 의미였는가?",
      answerRanges: [findRange(paragraphs, "p1", "비 오는 날의 외갓집은 세상에서 가장 아늑한 장소였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "외할머니가 비가 올 때 하시던 행동은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "외할머니는 빗소리가 들리면 찬장에서 부침가루를 꺼내 셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "도시로 이사 온 뒤 비에 대한 글쓴이의 인식은 어떻게 달라졌는가?",
      answerRanges: [findRange(paragraphs, "p2", "비는 더 이상 정겨운 풍경이 아니라 불편한 날씨가 되어 버렸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "퇴근길에 처마 밑에서 글쓴이가 느낀 감정은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "순간 가슴 한 편이 따뜻해지며 어릴 적 기억이 물밀 듯 밀려왔다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "빗소리가 글쓴이에게 불러일으키는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "외할머니의 부침개 냄새를, 마루 위 낡은 이불의 감촉을, 기와지붕 아래의 안온한 시간을 떠올리게 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 추억에 대해 갖고 있는 생각은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "추억이 사라지는 것이 아니라 잠들어 있을 뿐이라고 생각한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(56, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 57: 비문학 (NONFICTION) — 빛의 성질과 무지개의 원리 (과학) ───
function buildDay57() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리 눈에 하얗게 보이는 햇빛은 사실 여러 색의 빛이 합쳐진 것이다. 이 사실을 처음 과학적으로 증명한 사람은 영국의 물리학자 아이작 뉴턴이다. 뉴턴은 1666년에 삼각형 모양의 유리 프리즘에 햇빛을 통과시키는 실험을 했다. 프리즘을 빠져나온 빛은 빨강, 주황, 노랑, 초록, 파랑, 남색, 보라의 일곱 가지 색으로 나뉘어 벽에 무지개 띠를 만들었다. 이처럼 하나의 빛이 여러 색으로 나뉘는 현상을 빛의 분산이라 한다. 빛이 프리즘을 통과할 때 색마다 꺾이는 정도가 다르기 때문에 분산이 일어난다. 빨간빛은 가장 적게 꺾이고, 보라빛은 가장 많이 꺾인다. 이 꺾이는 정도의 차이가 색을 펼쳐 놓는 효과를 만드는 것이다."
    },
    {
      id: "p2",
      text: "자연에서 볼 수 있는 가장 아름다운 빛의 분산 현상이 바로 무지개이다. 무지개는 비가 온 뒤 하늘에 남아 있는 수많은 물방울이 프리즘 역할을 하여 만들어진다. 햇빛이 물방울 속으로 들어가면 먼저 굴절이 일어나고, 물방울 안쪽 벽에서 반사된 뒤, 다시 물방울 밖으로 나오면서 한 번 더 굴절된다. 이 과정에서 색마다 다른 각도로 빛이 나오기 때문에 우리 눈에는 여러 색의 띠가 겹쳐진 반원 모양으로 보인다. 무지개를 보려면 태양을 등지고 서야 한다. 태양과 관찰자의 눈, 그리고 물방울이 만드는 각도가 약 42도일 때 무지개가 가장 선명하게 나타난다. 아침이나 늦은 오후에 태양이 낮게 떠 있을 때 무지개가 더 크고 뚜렷하게 보이는 이유도 이 각도와 관련이 있다."
    },
    {
      id: "p3",
      text: "무지개에는 우리가 흔히 보는 1차 무지개 외에 2차 무지개도 존재한다. 2차 무지개는 빛이 물방울 내부에서 두 번 반사되어 만들어지며, 1차 무지개 바깥쪽에 희미하게 나타난다. 2차 무지개는 색의 순서가 1차 무지개와 반대로 되어 있어서 바깥쪽이 보라색이고 안쪽이 빨간색이다. 반사가 한 번 더 일어나는 과정에서 빛 에너지가 손실되기 때문에 2차 무지개는 1차 무지개보다 훨씬 어둡다. 빛의 분산 원리는 무지개뿐 아니라 일상생활 여러 곳에서 활용된다. CD 표면에 빛을 비추면 무지개색이 보이는 것도 빛의 분산과 관련된 현상이다. 또한 분광기라는 장비를 이용하면 별빛을 분석하여 별의 온도와 성분까지 알아낼 수 있다. 빛의 성질을 이해하면 자연의 아름다움뿐 아니라 과학의 깊은 세계까지 들여다볼 수 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "뉴턴이 프리즘 실험으로 증명한 사실은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "하얗게 보이는 햇빛은 사실 여러 색의 빛이 합쳐진 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "빛의 분산이 일어나는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "빛이 프리즘을 통과할 때 색마다 꺾이는 정도가 다르기 때문에 분산이 일어난다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "무지개는 어떤 원리로 만들어지는가?",
      answerRanges: [findRange(paragraphs, "p2", "비가 온 뒤 하늘에 남아 있는 수많은 물방울이 프리즘 역할을 하여 만들어진다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "무지개를 보려면 태양과 어떤 위치 관계에 있어야 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "무지개를 보려면 태양을 등지고 서야 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "2차 무지개의 색 순서가 1차 무지개와 다른 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "2차 무지개는 빛이 물방울 내부에서 두 번 반사되어 만들어지며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "분광기를 이용하면 별에 대해 알 수 있는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "분광기라는 장비를 이용하면 별빛을 분석하여 별의 온도와 성분까지 알아낼 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(57, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 58: 문학 (LITERATURE) — 고장 난 시계 (소설) ───
function buildDay58() {
  const paragraphs = [
    {
      id: "p1",
      text: "거실 벽에 걸린 괘종시계가 멈춘 것은 지난 겨울이었다. 초침이 12시 방향에서 한 번 떨리더니 더 이상 움직이지 않았다. 어머니는 배터리를 교체하셨지만 소용이 없었다. 아버지는 수리비가 꽤 나올 테니 차라리 새것을 사자고 하셨다. 하지만 그 시계는 할아버지가 결혼 선물로 주신 것이었다. 어머니는 아무 말 없이 시계를 다시 벽에 걸었다. 멈춘 채로 걸려 있는 시계를 볼 때마다 나는 묘한 기분이 들었다."
    },
    {
      id: "p2",
      text: "할아버지는 3년 전에 돌아가셨다. 생전에 할아버지는 시간을 매우 중요하게 여기는 분이셨다. 약속 시간보다 반드시 10분 일찍 도착하셨고, 내가 학교에 늦을까 봐 아침마다 전화를 걸어 오시던 분이었다. 어머니는 초침 소리가 할아버지의 존재를 확인하는 것 같았다고 말씀하셨다. 그래서 새 시계를 사지 않고 멈춘 시계를 그대로 걸어 두신 것이었다. 어머니에게 그 시계는 여전히 할아버지와 연결된 유일한 끈이었다."
    },
    {
      id: "p3",
      text: "봄방학에 나는 인터넷에서 괘종시계 수리 방법을 찾아보았다. 톱니바퀴에 녹이 슬었을 가능성이 크다는 글을 읽고 뒷판을 열어 보니 작은 톱니바퀴에 붉은 녹이 끼어 있었다. 면봉에 식초를 묻혀 조심스럽게 녹을 닦아 내고 시계 기름을 한 방울 떨어뜨렸다. 배터리를 넣고 기다리자 초침이 한 번 떨리더니 또르르 돌기 시작했다. 거실에 다시 째깍째깍 소리가 울려 퍼졌다. 퇴근한 어머니가 시계 소리를 들으셨다. 어머니는 아무 말 없이 한동안 시계를 올려다보셨다. 멈추었던 시간이 다시 흐르기 시작한 것처럼 어머니의 표정이 환하게 풀렸다."
    },
    {
      id: "p4",
      text: "그날 저녁 어머니는 오랜만에 할아버지 이야기를 꺼내셨다. 할아버지가 그 시계를 고르시던 날, 시계 가게에서 한 시간이나 이것저것 비교하시며 고민하셨다는 이야기였다. 나는 처음 듣는 이야기에 웃음이 났다. 어머니도 함께 웃으셨다. 시계를 고친 것은 작은 일이었지만, 그것이 어머니에게는 멈추어 있던 슬픔을 풀어 주는 계기가 된 듯했다. 시계는 시간만 알려 주는 기계가 아니다. 그 안에는 누군가의 마음과 기억이 깃들어 있다. 째깍째깍 울리는 소리를 들으며 나는 생각했다. 할아버지가 주신 시간은 멈추지 않았다고, 그 시간은 우리 안에서 계속 흐르고 있다고."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "괘종시계가 멈춘 뒤 어머니가 새 시계를 사지 않은 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "어머니에게 그 시계는 여전히 할아버지와 연결된 유일한 끈이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "할아버지는 시간에 대해 어떤 태도를 가진 분이었는가?",
      answerRanges: [findRange(paragraphs, "p2", "할아버지는 시간을 매우 중요하게 여기는 분이셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "글쓴이가 시계를 수리한 방법은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "면봉에 식초를 묻혀 조심스럽게 녹을 닦아 내고 시계 기름을 한 방울 떨어뜨렸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "시계가 다시 움직이기 시작했을 때 어머니의 반응은 어떠했는가?",
      answerRanges: [findRange(paragraphs, "p3", "어머니는 아무 말 없이 한동안 시계를 올려다보셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "시계를 고친 일이 어머니에게 어떤 의미가 있었는가?",
      answerRanges: [findRange(paragraphs, "p4", "멈추어 있던 슬픔을 풀어 주는 계기가 된 듯했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 시계 소리를 들으며 한 생각은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "할아버지가 주신 시간은 멈추지 않았다고, 그 시간은 우리 안에서 계속 흐르고 있다고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(58, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 59: 비문학 (NONFICTION) — 화폐의 역사와 전자 화폐 (사회/경제) ───
function buildDay59() {
  const paragraphs = [
    {
      id: "p1",
      text: "오늘날 우리는 물건을 사고팔 때 당연하게 돈을 사용하지만, 화폐가 처음부터 존재했던 것은 아니다. 인류 초기에는 필요한 물건을 직접 교환하는 물물교환이 이루어졌다. 농부는 쌀을 주고 어부에게서 생선을 받았으며, 목수는 가구를 만들어 주고 옷감을 얻었다. 그러나 물물교환에는 심각한 문제가 있었다. 서로 원하는 물건이 일치해야만 거래가 성립되었기 때문이다. 이 불편을 해소하기 위해 사람들은 누구나 가치 있다고 인정하는 물건을 교환의 매개로 사용하기 시작했다. 조개껍데기, 소금, 곡물, 가축 등이 그 역할을 했다. 특히 소금은 보존 기간이 길고 운반이 편리하여 널리 사용되었다. 영어에서 월급을 뜻하는 'salary'가 소금을 뜻하는 라틴어 'salarium'에서 유래한 것도 이 때문이다."
    },
    {
      id: "p2",
      text: "이후 금속을 이용한 주화가 등장하면서 화폐의 모습이 크게 바뀌었다. 금과 은은 희귀하고 변하지 않으며 일정한 크기로 만들 수 있어서 화폐 재료로 적합했다. 기원전 7세기경 소아시아의 리디아 왕국에서 세계 최초의 주화가 만들어졌다. 주화에는 왕의 문양이 새겨져 가치를 보증했다. 그러나 금속 주화는 무겁고 대량으로 운반하기 불편했다. 이러한 단점을 극복하기 위해 종이 화폐가 발명되었다. 세계 최초의 지폐는 중국 송나라 시대에 등장한 교자라는 것이다. 지폐는 가볍고 보관이 쉬웠으며, 국가가 가치를 보증하므로 신뢰를 바탕으로 널리 유통되었다. 오늘날에도 대부분의 나라에서는 중앙은행이 발행하는 지폐와 동전을 법정 화폐로 사용하고 있다."
    },
    {
      id: "p3",
      text: "최근에는 실물 화폐를 넘어서 전자 화폐가 빠르게 확산되고 있다. 신용카드와 체크카드는 이미 오래전부터 현금을 대신하고 있으며, 스마트폰을 이용한 간편 결제도 일상이 되었다. 한국에서는 전체 결제 중 현금 사용 비율이 10퍼센트 이하로 떨어졌다. 전자 화폐는 거래 기록이 자동으로 남아 가계부를 따로 쓸 필요가 없고, 위조가 어려워 안전하다는 장점이 있다. 반면 시스템 장애나 해킹의 위험이 있고, 개인의 소비 내역이 기록되어 사생활 침해의 우려가 있다는 단점도 지적된다. 기술이 발전할수록 화폐의 형태는 계속 변화할 것이다. 그러나 화폐의 본질, 즉 사람들 사이의 신뢰를 바탕으로 가치를 교환하는 수단이라는 점은 물물교환 시대부터 변하지 않았다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "물물교환의 가장 큰 문제점은 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p1", "서로 원하는 물건이 일치해야만 거래가 성립되었기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "'salary'라는 영어 단어가 소금과 관련된 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "소금은 보존 기간이 길고 운반이 편리하여 널리 사용되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "금속 주화의 단점은 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p2", "금속 주화는 무겁고 대량으로 운반하기 불편했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "세계 최초의 지폐는 어디에서 만들어졌는가?",
      answerRanges: [findRange(paragraphs, "p2", "세계 최초의 지폐는 중국 송나라 시대에 등장한 교자라는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "전자 화폐의 장점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "거래 기록이 자동으로 남아 가계부를 따로 쓸 필요가 없고, 위조가 어려워 안전하다는 장점이 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "화폐의 형태가 변해도 변하지 않는 본질은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "사람들 사이의 신뢰를 바탕으로 가치를 교환하는 수단이라는 점은 물물교환 시대부터 변하지 않았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(59, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 60: 문학 (LITERATURE) — 나무 위의 비밀 기지 (소설) ───
function buildDay60() {
  const paragraphs = [
    {
      id: "p1",
      text: "동네 뒷산 중턱에 커다란 참나무가 한 그루 서 있었다. 줄기가 어른 두 명이 팔을 벌려야 겨우 안을 수 있을 만큼 굵었고, 가지는 사방으로 넓게 뻗어 있었다. 지호와 민서는 그 나무 위에 비밀 기지를 만들기로 했다. 아버지의 허락을 받아 창고에서 남은 판자와 못을 가져와 방과 후마다 조금씩 기지를 만들었다. 지호가 판자를 자르면 민서가 못을 박았다. 처음에는 못을 박다가 손가락을 찧기도 했지만 며칠 지나자 제법 능숙해졌다. 일주일이 걸려 나뭇가지 사이에 작은 바닥판이 완성되었다. 그 위에 올라서면 마을이 한눈에 내려다보였고, 바람이 나뭇잎을 스치며 지나가는 소리가 귓가에 맴돌았다."
    },
    {
      id: "p2",
      text: "기지가 완성되자 두 사람은 그곳에서 많은 시간을 보냈다. 학교에서 있었던 일을 이야기하고, 만화책을 읽고, 간식을 나누어 먹었다. 민서는 집에서 가져온 작은 상자에 보물 목록을 적어 넣었다. 특별한 돌멩이, 깃털, 병뚜껑 같은 것들이었지만 두 사람에게는 세상에서 가장 소중한 보물이었다. 비가 오는 날에는 기지 위에 비닐을 씌워 놓고 빗소리를 들으며 앉아 있었다. 나뭇잎 사이로 떨어지는 빗방울이 비닐을 두드리는 소리는 마치 작은 드럼 연주 같았다. 그 공간은 세상과 분리된 두 사람만의 세계였고, 어른들은 알지 못하는 비밀의 장소였다."
    },
    {
      id: "p3",
      text: "여름이 끝나고 가을이 오자 민서네 가족이 이사를 간다는 소식이 전해졌다. 민서의 아버지가 다른 도시로 발령을 받으셨기 때문이었다. 이사 가기 전날 두 사람은 마지막으로 기지에 올랐다. 민서는 보물 상자를 열어 물건들을 하나씩 꺼내 보더니 말했다. '이건 네가 가져. 내가 돌아올 때까지 보관해 줘.' 지호는 고개를 끄덕이며 상자를 받았다. 두 사람은 아무 말 없이 붉게 물드는 하늘을 바라보았다. 민서가 떠난 뒤에도 지호는 가끔 기지에 올라갔다. 혼자 앉아 있으면 옆자리가 비어 있는 것이 유난히 크게 느껴졌다. 겨울이 지나고 봄이 와서 참나무에 새 잎이 돋아날 무렵, 지호의 휴대전화에 메시지가 왔다. '나 이번 여름에 놀러 갈 수 있을 것 같아. 기지 아직 있어?' 지호는 웃으며 답장을 보냈다. '기다리고 있어. 기지는 내가 고쳐 놓을게.' 그 주말부터 지호는 다시 판자와 못을 들고 뒷산에 올라갔다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "지호와 민서가 비밀 기지를 만든 장소는 어디인가?",
      answerRanges: [findRange(paragraphs, "p1", "동네 뒷산 중턱에 커다란 참나무가 한 그루 서 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "민서가 보물 상자에 넣은 물건들은 어떤 것이었는가?",
      answerRanges: [findRange(paragraphs, "p2", "특별한 돌멩이, 깃털, 병뚜껑 같은 것들이었지만 두 사람에게는 세상에서 가장 소중한 보물이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "민서가 이사를 가게 된 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "민서의 아버지가 다른 도시로 발령을 받으셨기 때문이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "이사 가기 전날 민서가 지호에게 부탁한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "이건 네가 가져. 내가 돌아올 때까지 보관해 줘.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "민서가 떠난 뒤 지호가 기지에서 느낀 감정은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "혼자 앉아 있으면 옆자리가 비어 있는 것이 유난히 크게 느껴졌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "민서의 메시지를 받은 뒤 지호가 한 행동은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "그 주말부터 지호는 다시 판자와 못을 들고 뒷산에 올라갔다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(60, "LITERATURE", "문학", paragraphs, confirmQuestions);
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
  console.log("=== 러셀1 Day 56~60 빌드 시작 ===\n");

  const contents = [
    buildDay56(),
    buildDay57(),
    buildDay58(),
    buildDay59(),
    buildDay60()
  ];

  // 검증
  let allValid = true;
  for (const c of contents) {
    const len = c.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
    const dayNum = parseInt(c.contentId.split('-').pop());
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
    if (qCount < 5 || qCount > 8) {
      console.warn(`경고: Day ${dayNum} 확인 문항 ${qCount}개 (5~8개 필요)`);
      allValid = false;
    } else {
      console.log(`  확인 문항: ${qCount}개 (적합)`);
    }
  }

  // static 파일 생성
  console.log("\nstatic 파일 생성 중...");
  for (const c of contents) {
    const dayNum = parseInt(c.contentId.split('-').pop());
    const dayStr = String(dayNum).padStart(3, '0');
    const filePath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(filePath, JSON.stringify(c, null, 2), 'utf8');
    console.log(`생성: ${dayStr}.json`);
  }

  // 배치 파일 갱신 (items[55]~items[59])
  console.log("\n배치 파일 갱신 중...");
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`현재 배치 items 수: ${batchData.items.length}`);

  const dayIndices = [56, 57, 58, 59, 60];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1; // items[55]~items[59]
    const subArea = contents[i].subArea;
    const batchItem = wrapBatchItem(contents[i], dayIdx, subArea);

    if (batchData.items[batchIdx]) {
      console.log(`교체: items[${batchIdx}] (${batchData.items[batchIdx].content.contentId} → ${contents[i].contentId})`);
    } else {
      console.log(`추가: items[${batchIdx}] (${contents[i].contentId})`);
    }
    batchData.items[batchIdx] = batchItem;
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료 (총 ${batchData.items.length}개)`);

  console.log("\n=== 빌드 완료 ===");
}

main();
