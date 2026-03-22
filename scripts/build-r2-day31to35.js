#!/usr/bin/env node
// 러셀2 Day 31~35 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION (비문학), 짝수 Day = LITERATURE (문학)
// 목표 글자수: 1200자 ±50 (1150~1250)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-russell2.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/russell2');

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

// ─── Day 31: 비문학 (NONFICTION) — 면역 체계의 작동 원리 ───
function buildDay31() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리 몸은 외부에서 침입하는 세균, 바이러스, 곰팡이 등 다양한 병원체로부터 스스로를 보호하기 위한 정교한 방어 체계를 갖추고 있다. 이를 면역 체계라 하며, 크게 선천 면역과 적응 면역으로 나뉜다. 선천 면역은 태어날 때부터 갖추고 있는 방어 기제로, 피부와 점막이라는 물리적 장벽이 대표적이다. 피부는 여러 겹의 세포층으로 이루어져 외부 병원체가 몸속으로 들어오는 것을 효과적으로 차단하고, 코와 입 안의 점막은 점액을 분비하여 이물질을 포획한다. 또한 체내에 침입한 병원체를 잡아먹는 대식세포와 호중구 같은 면역 세포가 신속히 반응하여 감염 초기에 병원체의 확산을 막는다. 선천 면역은 특정 병원체를 구분하지 않고 광범위하게 작동하므로, 비특이적 면역이라고도 불린다."
    },
    {
      id: "p2",
      text: "선천 면역만으로 병원체를 완전히 제거하지 못할 경우, 적응 면역이 가동된다. 적응 면역은 특정 병원체의 항원을 정밀하게 인식하여 그에 맞는 맞춤형 방어를 수행하는 체계이다. 이 과정의 핵심에는 T세포와 B세포라는 두 종류의 림프구가 있다. B세포는 항원에 결합하는 항체를 생산하여 병원체를 무력화하거나 다른 면역 세포가 쉽게 인식할 수 있도록 표지한다. T세포는 감염된 세포를 직접 공격하여 파괴하는 역할을 담당한다. 적응 면역의 가장 중요한 특성은 면역 기억이다. 한 번 침입한 병원체의 정보를 기억 세포에 저장하여, 같은 병원체가 다시 침입했을 때 훨씬 빠르고 강력하게 대응할 수 있다. 예방 접종은 이러한 면역 기억의 원리를 활용하여 약화되거나 죽은 병원체를 미리 투여함으로써 실제 감염에 대비하는 방법이다."
    },
    {
      id: "p3",
      text: "면역 체계는 외부 병원체만이 아니라 체내에서 발생하는 비정상적 세포도 끊임없이 감시한다. 매일 우리 몸에서는 수천 개의 세포가 돌연변이를 일으키지만, 자연 살해 세포를 비롯한 면역 세포가 이를 탐지하여 제거하기 때문에 대부분 암으로 발전하지 않는다. 그러나 면역 체계가 과도하게 활성화되면 자가 면역 질환이 발생할 수 있다. 자가 면역 질환이란 면역 세포가 자기 자신의 정상 조직을 외부 침입자로 오인하여 공격하는 상태를 말한다. 류머티즘 관절염이나 루푸스가 대표적인 자가 면역 질환으로, 이러한 질환의 치료에는 면역 반응을 낮추는 면역 억제제가 사용된다. 결국 건강을 유지하기 위해서는 면역 반응이 너무 약하지도, 너무 강하지도 않은 적절한 균형 상태를 유지하는 것이 중요하다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "선천 면역이 비특이적 면역이라고 불리는 이유는 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p1", "특정 병원체를 구분하지 않고 광범위하게 작동하므로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "B세포가 병원체에 대응하는 방식은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p2", "항원에 결합하는 항체를 생산하여 병원체를 무력화하거나 다른 면역 세포가 쉽게 인식할 수 있도록 표지한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "적응 면역의 가장 중요한 특성은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p2", "한 번 침입한 병원체의 정보를 기억 세포에 저장하여, 같은 병원체가 다시 침입했을 때 훨씬 빠르고 강력하게 대응할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "예방 접종이 활용하는 원리는 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p2", "면역 기억의 원리를 활용하여 약화되거나 죽은 병원체를 미리 투여함으로써 실제 감염에 대비하는 방법이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "자가 면역 질환이란 어떤 상태를 말하나요?",
      answerRanges: [findRange(paragraphs, "p3", "면역 세포가 자기 자신의 정상 조직을 외부 침입자로 오인하여 공격하는 상태를 말한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "건강을 유지하기 위해 면역 체계에서 중요한 것은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p3", "면역 반응이 너무 약하지도, 너무 강하지도 않은 적절한 균형 상태를 유지하는 것이 중요하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(31, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 32: 문학 (LITERATURE) — 도서관에서 만난 낯선 노인 ───
function buildDay32() {
  const paragraphs = [
    {
      id: "p1",
      text: "여름방학이 시작되던 날, 나는 숙제를 하러 동네 도서관에 갔다. 에어컨 바람이 시원하게 불어오는 열람실 한구석에 자리를 잡고 앉았는데, 맞은편에 한 노인이 앉아 있었다. 허리가 굽고 흰 머리카락이 듬성듬성한 그 노인은 돋보기를 코끝에 걸치고 두꺼운 책을 읽고 있었다. 손가락으로 글자를 짚어 가며 한 글자 한 글자 소리 없이 읽는 모습이 무척 진지했다. 나는 왠지 그 모습에서 눈을 뗄 수가 없었다. 할아버지는 이따금 고개를 들어 창밖을 바라보았고, 그때마다 깊은 주름 사이로 잔잔한 미소가 번졌다. 나는 궁금함을 참지 못하고 슬쩍 책 제목을 훔쳐보았다. 낡고 빛바랜 표지에는 한글을 배우는 첫걸음이라는 글씨가 적혀 있었다. 순간 나는 놀라움과 함께 알 수 없는 뭉클함을 느꼈다."
    },
    {
      id: "p2",
      text: "며칠 후 나는 또 도서관에 갔고, 같은 자리에 그 노인이 앉아 있었다. 이번에는 공책에 무언가를 열심히 쓰고 있었다. 가까이서 보니 ㄱ, ㄴ, ㄷ을 반복해서 쓰고 있었는데, 글씨가 삐뚤빼뚤하지만 한 획 한 획 정성스러웠다. 나는 용기를 내어 말을 걸었다. 할아버지, 글씨 연습하세요. 노인은 놀란 듯 나를 바라보더니 수줍게 웃으며 대답했다. 어릴 때 집안 형편이 어려워 학교를 다니지 못해서 글을 못 배웠단다. 평생 이름도 못 쓰고 살았는데, 죽기 전에 손주한테 편지를 한 번 써 보고 싶어서 여기 오게 되었지. 그 말에 나는 가슴이 뭉클해졌다. 글을 읽고 쓰는 일이 내게는 아침마다 밥을 먹는 것처럼 너무 당연한 것이었는데, 누군가에게는 평생의 소원이 될 수 있다는 사실이 처음으로 실감되었다."
    },
    {
      id: "p3",
      text: "그날 이후 나는 매일 도서관에 가서 할아버지 옆에 앉았다. 숙제를 하다가도 할아버지가 어려워하는 글자가 있으면 조용히 알려 드렸고, 할아버지는 고맙다며 환하게 웃으셨다. 할아버지는 배우는 속도가 느렸지만 한 번도 포기하지 않으셨다. 어떤 글자는 수십 번을 반복해서 써야 겨우 모양이 갖춰졌지만, 할아버지는 한 번도 짜증을 내지 않으셨다. 방학이 끝날 무렵, 할아버지는 떨리는 손으로 편지 한 장을 완성하셨다. 할아버지의 편지에는 손주야, 할아버지가 너를 많이 사랑한다는 짧은 문장이 적혀 있었다. 글씨는 여전히 삐뚤빼뚤했지만, 그 한 줄에 담긴 마음은 세상 어떤 글보다 아름다워 보였다. 나는 그 여름 도서관에서 중요한 것을 배웠다. 배움에는 나이가 없다는 것, 그리고 누군가를 향한 마음이 가장 강한 배움의 동력이 된다는 것을."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "노인이 도서관에서 읽고 있던 책의 제목은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p1", "한글을 배우는 첫걸음이라는 글씨가 적혀 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "노인이 이 나이에 한글을 배우려는 이유는 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p2", "죽기 전에 손주한테 편지를 한 번 써 보고 싶어서")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "글을 읽고 쓰는 일에 대해 나는 어떤 깨달음을 얻었나요?",
      answerRanges: [findRange(paragraphs, "p2", "누군가에게는 평생의 소원이 될 수 있다는 사실이 처음으로 실감되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "할아버지가 완성한 편지에 적힌 내용은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p3", "손주야, 할아버지가 너를 많이 사랑한다는 짧은 문장이 적혀 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "나가 그 여름 도서관에서 배운 것은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p3", "배움에는 나이가 없다는 것, 그리고 누군가를 향한 마음이 가장 강한 배움의 동력이 된다는 것을")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "할아버지의 글씨 연습에 나타난 태도는 어떠했나요?",
      answerRanges: [findRange(paragraphs, "p3", "배우는 속도가 느렸지만 한 번도 포기하지 않으셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(32, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 33: 비문학 (NONFICTION) — 도시 계획과 공공 공간 ───
function buildDay33() {
  const paragraphs = [
    {
      id: "p1",
      text: "도시 계획이란 사람들이 살기 좋은 도시를 만들기 위해 토지의 용도, 건물의 배치, 도로와 교통, 녹지와 공원 등을 종합적이고 체계적으로 설계하는 과정이다. 좋은 도시 계획의 핵심에는 공공 공간이 있다. 공공 공간이란 누구나 자유롭게 이용할 수 있는 열린 장소로, 광장, 공원, 보행자 거리, 도서관 같은 시설이 여기에 해당한다. 이러한 공간은 단순히 비어 있는 땅이 아니라 시민들이 만나고 소통하며 공동체 의식을 형성하는 사회적 기반이다. 도시 연구자 제인 제이콥스는 활기 있는 도시의 조건으로 다양한 용도의 건물이 혼합된 짧은 블록과 여러 연령대가 어울리는 거리를 꼽았다. 그녀에 따르면 사람들의 발길이 자연스럽게 모이는 거리야말로 도시의 안전과 활력을 동시에 만들어 내는 핵심 요소이다."
    },
    {
      id: "p2",
      text: "잘 설계된 공공 공간은 시민의 삶의 질을 높이는 데 큰 역할을 한다. 도시 속 공원과 녹지는 나무와 식물이 이산화탄소를 흡수하고 산소를 내놓아 미세 먼지를 줄이고 여름철 도시 열섬 현상을 완화하는 환경적 기능을 수행한다. 또한 주민들이 산책하거나 운동할 수 있는 장소를 제공하여 신체 건강 증진에 기여하며, 이웃과 자연스럽게 교류할 수 있는 기회를 만들어 사회적 고립을 예방한다. 반면 공공 공간이 부족하거나 관리가 소홀한 도시에서는 범죄율이 높아지고 주민 간 갈등이 심화되는 경향이 나타난다. 이는 물리적 환경이 사람들의 행동과 심리에 직접적인 영향을 미친다는 환경 심리학의 연구 결과와도 일치한다. 따라서 도시 계획에서 공공 공간의 확보와 체계적 관리는 선택이 아닌 필수적 과제라 할 수 있다."
    },
    {
      id: "p3",
      text: "최근에는 시민이 직접 도시 계획에 참여하는 사례가 늘고 있다. 과거에는 전문가와 행정 기관이 일방적으로 주도하던 도시 계획이 이제는 주민 의견을 적극적으로 반영하는 참여형 방식으로 변화하고 있는 것이다. 서울의 경우 주민 참여 예산 제도를 통해 시민들이 자기 동네에 필요한 시설이나 공간을 직접 제안할 수 있다. 또한 일부 도시에서는 빈 건물이나 사용하지 않는 공터를 주민 커뮤니티 공간으로 전환하는 도시 재생 사업을 추진하고 있다. 이처럼 시민 참여형 도시 계획은 주민의 실제 필요를 반영하여 보다 살기 좋은 환경을 만들어 낼 수 있다는 장점이 있다. 다만 다양한 이해관계를 조율하는 과정에서 시간이 오래 걸리고 갈등이 발생할 수 있으므로, 효과적인 소통과 합의의 절차를 마련하는 것이 중요하다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "공공 공간이 단순한 빈 땅이 아닌 이유는 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p1", "시민들이 만나고 소통하며 공동체 의식을 형성하는 사회적 기반이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "제인 제이콥스가 말한 활기 있는 도시의 핵심 요소는 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p1", "사람들의 발길이 자연스럽게 모이는 거리야말로 도시의 안전과 활력을 동시에 만들어 내는 핵심 요소이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "도시 속 공원과 녹지가 수행하는 환경적 기능은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p2", "미세 먼지를 줄이고 여름철 도시 열섬 현상을 완화하는 환경적 기능을 수행한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "공공 공간이 부족한 도시에서 나타나는 문제는 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p2", "범죄율이 높아지고 주민 간 갈등이 심화되는 경향이 나타난다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "서울에서 시민이 도시 계획에 참여할 수 있는 제도는 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p3", "주민 참여 예산 제도를 통해 시민들이 자기 동네에 필요한 시설이나 공간을 직접 제안할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "시민 참여형 도시 계획에서 중요한 과제는 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p3", "효과적인 소통과 합의의 절차를 마련하는 것이 중요하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(33, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 34: 문학 (LITERATURE) — 시골 외갓집의 여름 방학 ───
function buildDay34() {
  const paragraphs = [
    {
      id: "p1",
      text: "초등학교 시절, 여름 방학이 시작되면 나는 어김없이 외갓집으로 향했다. 외갓집은 강원도 깊은 산골 마을에 있었는데, 서울에서 버스를 두 번 갈아타고 세 시간이 넘게 걸려야 도착할 수 있었다. 구불구불한 산길을 달리는 버스 안에서 나는 창밖의 푸른 산을 바라보며 설렘을 감추지 못했다. 버스에서 내려 흙길을 십여 분 걸으면 기와지붕 대신 슬레이트 지붕을 얹은 낡은 집이 나타났다. 마당에는 호박 넝쿨이 기어다니고, 장독대 위에는 빨간 고추가 널려 있었다. 외할머니는 항상 대문 앞에서 나를 기다리고 계셨다. 할머니의 두 팔에 안기면 된장과 볕 냄새가 났고, 그 품에서 긴 여행의 피로가 한꺼번에 녹아 내렸다. 마당 한 편의 감나무 아래에는 이미 평상이 깔려 있었고, 그 위에는 수박 한 통이 우물물에 담가져 있었다."
    },
    {
      id: "p2",
      text: "외갓집에서의 하루는 서울에서의 일상과 전혀 달랐다. 아침이면 닭 우는 소리에 눈을 떴고, 외할머니가 부엌에서 장작불을 피워 끓인 구수한 된장찌개로 아침을 먹었다. 오전에는 외삼촌을 따라 뒷산에 올라가 도라지와 더덕을 캤고, 점심 후에는 마을 앞 개울에서 멱을 감았다. 개울물은 발이 시릴 만큼 차가웠지만, 물속에서 가재를 잡고 매끈한 돌 위에서 미끄럼을 타며 놀다 보면 시간 가는 줄 몰랐다. 해가 기울면 할머니와 마루에 나란히 앉아 옥수수를 삶아 먹었다. 초록색 껍질을 벗기면 노란 알갱이가 촘촘히 박혀 있었고, 한 알 한 알 떼어 먹는 맛이 달콤하고 고소했다. 밤이 되면 마당에 돗자리를 깔고 누워 별을 세었다. 서울에서는 본 적 없는 은하수가 하늘을 가로지르고 있었다."
    },
    {
      id: "p3",
      text: "방학이 끝나갈 무렵이면 항상 마음이 무거웠다. 서울로 돌아가야 한다는 생각에 며칠 전부터 시무룩해졌고, 떠나는 날 아침에는 밥이 넘어가지 않았다. 외할머니는 내 가방에 삶은 달걀과 찐 감자를 넣어 주시며, 다음에 또 오너라 하고 말씀하셨다. 버스가 출발하고 뒤돌아보면 할머니가 골목 끝에서 작아질 때까지 손을 흔들고 계셨다. 차창에 이마를 대고 산과 논이 스쳐 지나가는 것을 바라보며, 나는 매년 이 길을 다시 올 수 있을 거라고 굳게 믿었다. 하지만 세월이 흐르고 외갓집은 헐렸고, 할머니도 돌아가셨다. 이제 그 여름의 기억은 바래진 사진 속 풍경처럼 멀어졌지만, 감나무 아래 평상에서 먹던 수박의 시원한 단맛과 할머니의 된장 냄새는 여전히 코끝에 생생하게 남아 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "외갓집에 도착했을 때 외할머니의 품에서 느낀 것은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p1", "된장과 볕 냄새가 났고, 그 품에서 긴 여행의 피로가 한꺼번에 녹아 내렸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "외갓집에서 오전 시간을 어떻게 보냈나요?",
      answerRanges: [findRange(paragraphs, "p2", "외삼촌을 따라 뒷산에 올라가 도라지와 더덕을 캤고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "서울에서 볼 수 없었던 밤하늘의 풍경은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p2", "서울에서는 본 적 없는 은하수가 하늘을 가로지르고 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "떠나는 날 외할머니가 해 주신 것은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p3", "내 가방에 삶은 달걀과 찐 감자를 넣어 주시며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "세월이 흐른 후 외갓집과 할머니는 어떻게 되었나요?",
      answerRanges: [findRange(paragraphs, "p3", "외갓집은 헐렸고, 할머니도 돌아가셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "그 여름의 기억 중 여전히 생생하게 남아 있는 것은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p3", "감나무 아래 평상에서 먹던 수박의 시원한 단맛과 할머니의 된장 냄새는 여전히 코끝에 생생하게 남아 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(34, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 35: 비문학 (NONFICTION) — 재생 에너지의 종류와 전망 ───
function buildDay35() {
  const paragraphs = [
    {
      id: "p1",
      text: "화석 연료인 석탄, 석유, 천연가스는 산업 혁명 이후 오랫동안 인류의 주요 에너지원이었다. 그러나 이들 연료의 사용은 이산화탄소를 비롯한 온실가스를 대량으로 배출하여 지구 온난화를 가속시키고, 매장량이 한정되어 있어 언젠가는 고갈될 수밖에 없다는 근본적 한계를 지닌다. 이에 따라 자연에서 지속적으로 반복하여 얻을 수 있으며 환경 오염이 적은 재생 에너지에 대한 관심이 전 세계적으로 높아지고 있다. 대표적인 재생 에너지로는 태양광, 풍력, 수력, 지열, 바이오매스 등이 있다. 태양광 에너지는 태양 전지판을 이용하여 햇빛을 전기로 변환하는 방식이며, 풍력 에너지는 바람의 힘으로 터빈을 돌려 전기를 생산한다. 이 두 에너지원은 현재 세계적으로 가장 빠르게 성장하고 있는 재생 에너지 분야이다."
    },
    {
      id: "p2",
      text: "재생 에너지는 환경적 이점 외에도 경제적 가치가 크다. 태양광 패널과 풍력 터빈의 제조 비용은 기술 발전에 힘입어 지난 십 년간 크게 감소하였으며, 이제 일부 지역에서는 화석 연료보다 재생 에너지로 전기를 생산하는 비용이 더 낮아졌다. 또한 재생 에너지 산업은 설치, 유지 보수, 연구 개발 등 다양한 분야에서 새로운 일자리를 창출하고 있다. 다만 재생 에너지에는 해결해야 할 과제도 있다. 태양광과 풍력은 날씨와 시간대에 따라 발전량이 달라지는 간헐성 문제를 안고 있다. 흐린 날이나 바람이 불지 않는 날에는 전기를 생산할 수 없기 때문에, 안정적인 전력 공급을 위해서는 대규모 에너지 저장 장치의 개발이 필수적이다."
    },
    {
      id: "p3",
      text: "이러한 한계를 극복하기 위해 세계 각국은 다양한 노력을 기울이고 있다. 배터리 기술의 발전으로 대용량 에너지 저장 시스템의 효율이 크게 향상되고 있으며, 수소 에너지를 활용한 장기 저장 방식도 활발히 연구되고 있다. 또한 여러 종류의 재생 에너지를 결합하여 서로의 단점을 보완하는 하이브리드 발전 시스템이 도입되고 있다. 우리나라도 탄소 중립을 목표로 재생 에너지 비중을 확대하는 정책을 추진하고 있으며, 해상 풍력과 태양광 발전 단지를 대규모로 건설하는 사업이 진행 중이다. 재생 에너지로의 전환은 단순히 기술의 문제가 아니라 사회 전체의 에너지 사용 습관과 산업 구조를 근본적으로 바꾸는 거대한 변화이다. 이 변화의 성공 여부는 기술 혁신과 함께 시민의 인식 변화와 정부의 지속적인 정책 지원에 달려 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "화석 연료가 지닌 근본적 한계는 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p1", "온실가스를 대량으로 배출하여 지구 온난화를 가속시키고, 매장량이 한정되어 있어 언젠가는 고갈될 수밖에 없다는 근본적 한계를 지닌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "태양광 에너지는 어떤 방식으로 전기를 생산하나요?",
      answerRanges: [findRange(paragraphs, "p1", "태양 전지판을 이용하여 햇빛을 전기로 변환하는 방식이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "재생 에너지가 경제적으로 가치 있는 이유는 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p2", "재생 에너지 산업은 설치, 유지 보수, 연구 개발 등 다양한 분야에서 새로운 일자리를 창출하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "태양광과 풍력 에너지의 간헐성 문제를 해결하기 위해 필요한 것은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p2", "대규모 에너지 저장 장치의 개발이 필수적이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "재생 에너지의 단점을 보완하기 위해 도입된 시스템은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p3", "여러 종류의 재생 에너지를 결합하여 서로의 단점을 보완하는 하이브리드 발전 시스템이 도입되고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "재생 에너지 전환의 성공 여부는 무엇에 달려 있나요?",
      answerRanges: [findRange(paragraphs, "p3", "기술 혁신과 함께 시민의 인식 변화와 정부의 지속적인 정책 지원에 달려 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(35, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs);
  const recall = buildRecallCards(paragraphs, 8);

  const dayStr = String(dayIndex).padStart(3, '0');
  const contentId = `dr-r2-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(러셀 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "RUSSELL_2",
    schoolGradeRange: { min: 8, max: 9 },
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

    // 문단 중심내용 문제
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

// 복기 카드 빌더 (8장)
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
    level_id: "RUSSELL_2",
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
  console.log("=== 러셀2 Day 31~35 빌드 시작 ===\n");

  const contents = [
    buildDay31(),
    buildDay32(),
    buildDay33(),
    buildDay34(),
    buildDay35()
  ];

  // 검증
  let allValid = true;
  for (const c of contents) {
    const len = c.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
    const dayNum = parseInt(c.contentId.split('-')[2]);
    if (len < 1150 || len > 1250) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1150~1250)`);
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

  const dayIndices = [31, 32, 33, 34, 35];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1;
    const subArea = contents[i].subArea;
    const batchItem = wrapBatchItem(contents[i], dayIdx, subArea);

    // 배열 확장 필요 시
    while (batchData.items.length <= batchIdx) {
      batchData.items.push(null);
    }

    if (batchData.items[batchIdx]) {
      console.log(`교체: items[${batchIdx}] (${batchData.items[batchIdx].content.contentId} → ${contents[i].contentId})`);
    } else {
      console.log(`추가: items[${batchIdx}] (${contents[i].contentId})`);
    }
    batchData.items[batchIdx] = batchItem;
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료`);

  console.log("\n=== 빌드 완료 ===");
}

main();
