#!/usr/bin/env node
// 러셀2 Day 41~45 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION, 짝수 Day = LITERATURE
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

// ─── Day 41: 비문학 (NONFICTION) — 뉴턴의 운동 법칙과 일상의 힘 ───
function buildDay41() {
  const paragraphs = [
    {
      id: "p1",
      text: "뉴턴의 운동 법칙은 물체의 움직임을 설명하는 물리학의 기본 원리로, 17세기에 아이작 뉴턴이 정립한 세 가지 법칙으로 구성된다. 제1법칙은 관성의 법칙이라고 불리며, 외부 힘이 작용하지 않으면 정지한 물체는 계속 정지해 있고, 움직이는 물체는 같은 속도로 직선 운동을 계속한다는 내용이다. 버스가 갑자기 멈추었을 때 승객의 몸이 앞으로 쏠리는 현상이 바로 관성의 대표적인 예이다. 이는 승객의 몸이 버스가 달리던 방향으로 계속 움직이려는 성질을 가지고 있기 때문이다. 관성의 크기는 물체의 질량에 비례하므로, 무거운 물체일수록 운동 상태를 바꾸기 어렵다. 이 원리는 안전벨트의 필요성을 설명해 주기도 하는데, 급정거 시 몸이 앞으로 튕겨 나가는 것을 방지하기 위해 반드시 안전벨트를 착용해야 하는 것이다."
    },
    {
      id: "p2",
      text: "제2법칙은 힘과 가속도의 관계를 수식으로 나타낸 것으로, 물체에 작용하는 알짜힘은 질량과 가속도의 곱과 같다는 법칙이다. 이 관계를 식으로 표현하면 힘은 질량 곱하기 가속도이다. 같은 크기의 힘을 가하더라도 질량이 작은 물체는 가속도가 크고, 질량이 큰 물체는 가속도가 작다. 예를 들어 축구공과 볼링공을 같은 힘으로 찼을 때, 축구공이 훨씬 빠르게 날아가는 이유는 축구공의 질량이 볼링공보다 훨씬 가볍기 때문이다. 이 법칙은 자동차 엔진의 출력과 차량 무게의 관계에서도 확인할 수 있는데, 같은 엔진을 장착하더라도 차가 가벼울수록 더 빠르게 가속할 수 있다. 반대로 무거운 화물 트럭은 승용차와 같은 힘을 받아도 천천히 속도가 올라가므로, 고속도로 진입 시 더 긴 가속 구간이 필요하다."
    },
    {
      id: "p3",
      text: "제3법칙은 작용과 반작용의 법칙으로, 한 물체가 다른 물체에 힘을 가하면 동시에 같은 크기의 힘이 반대 방향으로 작용한다는 원리이다. 로켓이 하늘로 올라가는 원리가 이 법칙의 대표적인 사례인데, 로켓 엔진이 연료를 태워 가스를 아래쪽으로 내뿜으면 그 반작용으로 로켓은 위쪽으로 솟아오른다. 수영할 때 물을 뒤로 밀면 몸이 앞으로 나아가는 것도 같은 원리이다. 작용과 반작용은 항상 서로 다른 물체에 작용하기 때문에 두 힘이 상쇄되지 않으며, 이 점이 하나의 물체에 작용하는 두 힘이 서로 균형을 이루는 경우와 다르다. 이처럼 뉴턴의 세 가지 운동 법칙은 놀이공원의 놀이 기구에서 우주선의 발사에 이르기까지, 우리 생활 곳곳에서 물체의 움직임을 이해하는 데 필수적인 기초가 된다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "버스가 갑자기 멈출 때 승객의 몸이 앞으로 쏠리는 까닭은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "승객의 몸이 버스가 달리던 방향으로 계속 움직이려는 성질을 가지고 있기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "관성의 크기를 결정하는 요인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "관성의 크기는 물체의 질량에 비례하므로, 무거운 물체일수록 운동 상태를 바꾸기 어렵다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "축구공이 볼링공보다 같은 힘에 더 빠르게 날아가는 이유는?",
      answerRanges: [findRange(paragraphs, "p2", "축구공의 질량이 볼링공보다 훨씬 가볍기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "무거운 화물 트럭이 고속도로 진입 시 긴 가속 구간이 필요한 이유는?",
      answerRanges: [findRange(paragraphs, "p2", "무거운 화물 트럭은 승용차와 같은 힘을 받아도 천천히 속도가 올라가므로, 고속도로 진입 시 더 긴 가속 구간이 필요하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "로켓이 하늘로 솟아오르는 원리를 설명하시오.",
      answerRanges: [findRange(paragraphs, "p3", "로켓 엔진이 연료를 태워 가스를 아래쪽으로 내뿜으면 그 반작용으로 로켓은 위쪽으로 솟아오른다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "작용과 반작용이 서로 상쇄되지 않는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "작용과 반작용은 항상 서로 다른 물체에 작용하기 때문에 두 힘이 상쇄되지 않으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(41, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 42: 문학 (LITERATURE) — 옛 시장 골목의 추억 ───
function buildDay42() {
  const paragraphs = [
    {
      id: "p1",
      text: "어릴 적 외할머니 댁에 가려면 시외버스를 타고 한참을 달린 뒤 읍내 시장 앞에서 내려야 했다. 버스에서 내리면 가장 먼저 코끝을 간질이는 것은 어묵 국물과 호떡 기름의 냄새였다. 시장 입구에는 언제나 붕어빵 아저씨가 노란 반죽을 틀에 부으며 자리를 지키고 계셨고, 아저씨의 화덕에서 올라오는 연기가 찬 겨울 공기 속으로 하얗게 피어올랐다. 나는 붕어빵을 사 달라고 엄마의 손을 잡아끌곤 했는데, 갓 구워져 뜨거운 붕어빵을 호호 불어 가며 먹는 맛은 세상 어디에서도 느낄 수 없는 행복이었다. 외할머니는 버스 정류장까지 마중을 나오신 적이 한 번도 없었지만, 시장을 통과해 언덕길을 오르면 대문 앞에 서서 허리를 굽히고 기다리셨다. 그 뒷모습이 점점 가까워질 때마다 나는 무거운 가방 끈을 잡은 손에 저도 모르게 힘이 빠지는 것을 느꼈다."
    },
    {
      id: "p2",
      text: "시장 골목은 항상 사람들로 북적였다. 좁은 통로 양쪽으로 채소 가게, 생선 가게, 반찬 가게가 빼곡히 늘어서 있었고, 상인들은 저마다 목청을 높여 손님을 불렀다. 바닥에는 생선 비늘이 반짝이고, 어디선가 참기름 볶는 고소한 냄새가 흘러나왔다. 외할머니는 나를 데리고 시장 한 바퀴를 꼭 돌으셨는데, 그때마다 단골 상인들이 반갑게 인사를 건네며 사과 한 알, 떡 한 조각을 손에 쥐어 주곤 하셨다. 외할머니는 그런 인심을 당연하다는 듯 받으셨지만, 돌아올 때면 반드시 된장이나 고춧가루를 그 가게에서 사셨다. 지금 생각하면 그것은 돈으로 따질 수 없는 신뢰의 교환이었다. 서로의 마음을 물건이 아닌 정으로 주고받는 그 모습이, 어린 내 눈에는 어른들만의 신비로운 약속처럼 보였다."
    },
    {
      id: "p3",
      text: "세월이 흘러 읍내에 대형 마트가 들어서면서 시장의 풍경은 크게 달라졌다. 붕어빵 아저씨의 자리는 주차장으로 바뀌었고, 채소 가게 할머니의 좌판 위에는 '폐업'이라고 적힌 종이가 바람에 펄럭이고 있었다. 한때 활기로 가득하던 골목에는 인적이 드물어 쓸쓸한 바람만 불었다. 외할머니마저 돌아가신 뒤로는 그 시장을 찾을 이유가 사라졌다. 그런데 얼마 전 우연히 지나친 서울의 한 재래시장에서 어묵 국물 냄새를 맡는 순간, 외할머니의 굽은 허리와 따뜻한 손이 선명하게 떠올랐다. 냄새 하나가 수십 년 전의 기억을 고스란히 되살려 놓는 것이 신기하기도 하고 가슴이 뭉클하기도 했다. 시장은 단순히 물건을 사고파는 장소가 아니라, 사람과 사람 사이의 정이 오가던 공간이었다는 것을 그제야 비로소 깨달았다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "시장 입구에서 필자가 가장 먼저 느끼는 감각적 경험은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "가장 먼저 코끝을 간질이는 것은 어묵 국물과 호떡 기름의 냄새였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "외할머니가 기다리시는 모습을 보았을 때 필자에게 나타난 반응은?",
      answerRanges: [findRange(paragraphs, "p1", "무거운 가방 끈을 잡은 손에 저도 모르게 힘이 빠지는 것을 느꼈다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "외할머니와 단골 상인들 사이의 관계를 필자는 어떻게 표현하였는가?",
      answerRanges: [findRange(paragraphs, "p2", "서로의 마음을 물건이 아닌 정으로 주고받는 그 모습이, 어린 내 눈에는 어른들만의 신비로운 약속처럼 보였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "시장의 풍경이 크게 달라진 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "읍내에 대형 마트가 들어서면서 시장의 풍경은 크게 달라졌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "필자가 외할머니를 떠올리게 된 계기는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "서울의 한 재래시장에서 어묵 국물 냄새를 맡는 순간, 외할머니의 굽은 허리와 따뜻한 손이 선명하게 떠올랐다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "필자가 시장에 대해 새롭게 깨달은 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "시장은 단순히 물건을 사고파는 장소가 아니라, 사람과 사람 사이의 정이 오가던 공간이었다는 것을 그제야 비로소 깨달았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(42, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 43: 비문학 (NONFICTION) — 세포 분열과 생명의 성장 ───
function buildDay43() {
  const paragraphs = [
    {
      id: "p1",
      text: "생물의 몸은 수없이 많은 세포로 이루어져 있으며, 이 세포들은 분열을 통해 수를 늘려 간다. 인간의 몸은 약 37조 개의 세포로 구성되어 있는데, 이 모든 세포는 하나의 수정란에서 시작된 것이다. 세포 분열이란 하나의 세포가 둘로 나뉘는 과정을 말하며, 생물의 성장과 손상 복구에 핵심적인 역할을 한다. 예를 들어 피부에 상처가 나면 주변 세포들이 활발하게 분열하여 새로운 세포를 만들어 냄으로써 상처가 아물게 된다. 세포 분열은 크게 체세포 분열과 감수 분열 두 가지로 나뉜다. 체세포 분열은 피부, 뼈, 근육 등 몸을 구성하는 일반 세포가 분열하는 과정이며, 감수 분열은 생식 세포를 만들기 위한 특수한 분열이다. 체세포 분열에서는 원래 세포와 동일한 유전 정보를 가진 두 딸세포가 생성되므로, 우리 몸의 모든 체세포는 기본적으로 같은 유전 정보를 공유한다."
    },
    {
      id: "p2",
      text: "체세포 분열은 여러 단계를 거쳐 정교하게 진행된다. 먼저 간기에 세포는 분열을 준비하며 DNA를 정확하게 복제한다. 이어서 전기에 접어들면 염색체가 응축되어 뚜렷한 모양을 나타내고, 중기에는 염색체가 세포의 가운데에 일렬로 배열된다. 후기에 이르면 복제된 염색체가 방추사에 의해 양쪽으로 끌려가며, 말기에 세포질이 나뉘어 두 개의 딸세포가 완성된다. 이 과정은 매우 정밀하게 조절되는데, 세포 내부에는 분열의 각 단계를 점검하는 검문 지점이 존재하여 이상이 발견되면 분열을 중단시킨다. 그러나 만약 이러한 조절 기제마저 제대로 작동하지 않아 오류가 발생하면 유전 정보가 잘못 전달될 수 있다. 이러한 오류가 축적되면 세포가 비정상적으로 증식하게 되고, 이것이 암과 같은 질병으로 이어질 수 있다."
    },
    {
      id: "p3",
      text: "감수 분열은 체세포 분열과 달리 두 번의 연속 분열을 거쳐 염색체 수가 절반으로 줄어든 생식 세포를 만든다. 인간의 체세포가 46개의 염색체를 가지는 반면, 정자와 난자 같은 생식 세포는 23개의 염색체만 가진다. 정자와 난자가 결합하는 수정 과정에서 23개씩 합쳐져 다시 46개가 되므로, 세대를 거쳐도 염색체 수가 일정하게 유지될 수 있다. 또한 감수 분열 과정에서는 교차라는 현상이 일어나, 부모로부터 물려받은 유전 정보가 뒤섞여 다양한 조합의 생식 세포가 만들어진다. 이러한 유전적 다양성은 환경 변화에 적응하는 종의 생존 능력을 높이는 데 중요한 역할을 한다. 결국 세포 분열은 개체의 성장과 유지뿐 아니라 종 전체의 진화와 적응에도 깊이 관여하는 생명의 핵심 과정이라 할 수 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "체세포 분열과 감수 분열의 차이를 구분하시오.",
      answerRanges: [findRange(paragraphs, "p1", "체세포 분열은 피부, 뼈, 근육 등 몸을 구성하는 일반 세포가 분열하는 과정이며, 감수 분열은 생식 세포를 만들기 위한 특수한 분열이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "우리 몸의 모든 체세포가 같은 유전 정보를 공유하는 이유는?",
      answerRanges: [findRange(paragraphs, "p1", "체세포 분열에서는 원래 세포와 동일한 유전 정보를 가진 두 딸세포가 생성되므로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "체세포 분열의 중기에 일어나는 현상은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "중기에는 염색체가 세포의 가운데에 일렬로 배열된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "세포 분열의 오류가 축적되면 어떤 결과로 이어질 수 있는가?",
      answerRanges: [findRange(paragraphs, "p2", "세포가 비정상적으로 증식하게 되고, 이것이 암과 같은 질병으로 이어질 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "세대를 거쳐도 염색체 수가 일정하게 유지되는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "정자와 난자가 결합하는 수정 과정에서 23개씩 합쳐져 다시 46개가 되므로, 세대를 거쳐도 염색체 수가 일정하게 유지될 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "감수 분열에서 교차 현상이 중요한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "유전적 다양성은 환경 변화에 적응하는 종의 생존 능력을 높이는 데 중요한 역할을 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(43, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 44: 문학 (LITERATURE) — 비 오는 날 우산을 빌려준 이야기 ───
function buildDay44() {
  const paragraphs = [
    {
      id: "p1",
      text: "중학교 2학년 가을, 6교시 수업이 끝나자마자 갑작스럽게 비가 쏟아지기 시작했다. 교실 창문 너머로 운동장이 순식간에 물바다로 변하는 모습이 보였고, 빗줄기가 유리창을 세차게 두드리는 소리가 교실 안까지 울려 퍼졌다. 아침에는 구름 한 점 없이 맑은 하늘이었기에 일기 예보를 확인하지도 않았던 것이 후회스러웠다. 복도에서는 집에 전화해서 우산을 갖다 달라고 부탁하는 아이들의 목소리가 여기저기서 들려왔다. 우산을 챙기지 못한 학생들이 현관 앞에 옹기종기 모여 하늘을 올려다보며 비가 그치기만을 기다렸다. 나도 그 무리 속에 끼어 서 있었는데, 옆반의 지호가 뒤에서 내 어깨를 톡 치더니 말없이 접힌 우산 하나를 내밀었다. 우리는 같은 학년이었지만 반이 달라서 인사를 나눈 적도 없었기에, 나는 당황한 표정으로 괜찮다며 손사래를 쳤다."
    },
    {
      id: "p2",
      text: "지호는 내 거절에 아랑곳하지 않고 우산을 내 손에 꾹 쥐어 주었다. 자기는 학원이 바로 옆 건물이라 뛰어가면 된다고 했지만, 교복 안주머니에 우산을 하나 더 넣고 다닐 리 만무했으므로 그것이 유일한 우산이라는 것은 분명했다. 나는 머뭇거리다가 결국 고맙다는 말 한마디를 겨우 내뱉고 우산을 폈다. 우산 위로 후두둑 떨어지는 빗방울 소리가 마치 작은 북을 두드리는 것 같았다. 빗소리를 들으며 학교 정문을 빠져나오는데, 뒤를 돌아보니 지호가 가방을 머리 위로 들고 빗속을 전력으로 뛰어가고 있었다. 금세 교복이 젖어 어깨에 달라붙는 모습이 보였고, 그 뒷모습을 보는 순간 가슴 한쪽이 뜨끔하면서도 알 수 없는 따뜻함이 번졌다."
    },
    {
      id: "p3",
      text: "다음 날 아침 일찍 교실에 도착한 나는 우산을 깨끗이 말려 비닐에 싼 뒤 지호의 반으로 돌려주러 갔다. 지호는 별일 아니라는 듯 환하게 웃으며 우산을 받아 들었고, 어제 많이 젖지 않았느냐고 오히려 내 걱정을 해 주었다. 알고 보니 지호는 집까지 이십 분 넘게 걸어가야 하는 거리였는데, 온몸이 비에 흠뻑 젖은 채로 귀가했다고 했다. 우리는 그때부터 자연스럽게 이름을 불러 가며 인사를 나누게 되었고, 점심시간에 함께 급식을 먹는 사이로 발전하였다. 사소한 우산 하나가 낯선 사이에 다리를 놓아 준 셈이었다. 돌이켜 보면, 그날 지호가 건넨 것은 우산이 아니라 누군가를 향한 무조건적인 호의 그 자체였다. 아무 대가 없이 먼저 손을 내미는 것, 그것이 진정한 친절의 시작이라는 사실을 나는 비 오는 가을날의 작은 사건을 통해 처음으로 배웠다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "비가 오기 시작했을 때 우산이 없는 학생들의 모습을 묘사한 부분은?",
      answerRanges: [findRange(paragraphs, "p1", "우산을 챙기지 못한 학생들이 현관 앞에 옹기종기 모여 하늘을 올려다보며 비가 그치기만을 기다렸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "필자가 지호의 우산을 처음에 거절한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "같은 학년이었지만 반이 달라서 인사를 나눈 적도 없었기에, 나는 당황한 표정으로 괜찮다며 손사래를 쳤다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "지호가 건넨 우산이 그의 유일한 것이라고 판단할 수 있는 근거는?",
      answerRanges: [findRange(paragraphs, "p2", "교복 안주머니에 우산을 하나 더 넣고 다닐 리 만무했으므로 그것이 유일한 우산이라는 것은 분명했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "지호가 빗속을 뛰어가는 모습을 보고 필자가 느낀 감정은?",
      answerRanges: [findRange(paragraphs, "p2", "가슴 한쪽이 뜨끔하면서도 알 수 없는 따뜻함이 번졌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "우산을 돌려준 이후 필자와 지호의 관계는 어떻게 변하였는가?",
      answerRanges: [findRange(paragraphs, "p3", "자연스럽게 이름을 불러 가며 인사를 나누게 되었고, 점심시간에 함께 급식을 먹는 사이로 발전하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이 이야기를 통해 필자가 깨달은 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "아무 대가 없이 먼저 손을 내미는 것, 그것이 진정한 친절의 시작이라는 사실을 나는 비 오는 가을날의 작은 사건을 통해 처음으로 배웠다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(44, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 45: 비문학 (NONFICTION) — 민주주의에서 선거의 의미 ───
function buildDay45() {
  const paragraphs = [
    {
      id: "p1",
      text: "민주주의 사회에서 선거는 국민이 자신의 대표를 직접 선출하는 가장 기본적이면서도 중요한 정치 참여 방식이다. 선거를 통해 국민은 국가 운영에 관한 자신의 의사를 표현할 수 있으며, 선출된 대표는 국민의 뜻에 따라 정책을 수립하고 집행할 책임을 진다. 선거가 제대로 기능하려면 보통 선거, 평등 선거, 직접 선거, 비밀 선거라는 네 가지 원칙이 지켜져야 한다. 보통 선거는 일정 나이 이상의 모든 국민에게 재산이나 성별에 관계없이 선거권을 부여하는 원칙이며, 평등 선거는 한 사람에게 한 표의 동등한 가치를 보장하는 것이다. 직접 선거는 유권자가 대표를 중간 선거인 없이 직접 뽑는 방식을 뜻하고, 비밀 선거는 투표 내용이 다른 사람에게 알려지지 않도록 보장하는 원칙이다."
    },
    {
      id: "p2",
      text: "선거는 단순히 대표를 뽑는 행위를 넘어 정치 권력에 정당성을 부여하는 기능을 수행한다. 국민의 선택을 받은 대표만이 국가를 통치할 정당한 자격을 갖추었다고 인정받기 때문이다. 또한 선거는 정치 지도자들이 국민의 요구에 귀를 기울이도록 만드는 견제 장치이기도 하다. 대표가 국민의 기대에 부응하지 못하면 다음 선거에서 다른 후보에게 지지를 보낼 수 있으므로, 선거는 권력의 평화로운 교체를 가능하게 하는 제도적 장치가 된다. 역사적으로 선거를 통한 정권 교체는 폭력적 혁명이나 쿠데타 없이도 국민의 의사를 반영할 수 있음을 보여 주었다. 이처럼 선거를 통한 주기적인 권력 교체의 가능성이야말로 민주주의를 독재와 구별 짓는 핵심 요소이며, 이것이 바로 많은 나라가 선거 제도를 민주주의의 근간으로 삼는 이유이다."
    },
    {
      id: "p3",
      text: "그러나 선거 제도가 있다고 해서 민주주의가 저절로 실현되는 것은 아니다. 유권자가 후보자의 공약과 자질을 꼼꼼히 따져 보지 않고 무관심하게 투표에 참여하지 않는다면, 선거의 본래 기능은 약화된다. 특히 낮은 투표율은 소수의 의견만이 정치에 반영되는 결과를 초래할 수 있어 민주주의의 대표성을 훼손하는 요인이 된다. 또한 거짓 정보나 감정적 선동에 휘둘려 투표하는 것 역시 선거의 질을 떨어뜨리는 문제가 된다. 따라서 민주 시민으로서 선거에 적극적으로 참여하고, 후보자의 정책을 비판적으로 분석하는 능력을 기르는 것이 중요하다. 선거는 권리이자 동시에 책임이며, 한 표 한 표가 모여 사회의 방향을 결정한다는 점에서 모든 유권자의 참여가 민주주의의 건강한 작동을 위해 필수적이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "선거의 네 가지 원칙 중 평등 선거가 뜻하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "평등 선거는 한 사람에게 한 표의 동등한 가치를 보장하는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "비밀 선거 원칙의 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "비밀 선거는 투표 내용이 다른 사람에게 알려지지 않도록 보장하는 원칙이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "선거가 정치 권력에 정당성을 부여하는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "국민의 선택을 받은 대표만이 국가를 통치할 정당한 자격을 갖추었다고 인정받기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "민주주의를 독재와 구별 짓는 핵심 요소는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "선거를 통한 주기적인 권력 교체의 가능성이야말로 민주주의를 독재와 구별 짓는 핵심 요소이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "낮은 투표율이 민주주의에 미치는 부정적 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "낮은 투표율은 소수의 의견만이 정치에 반영되는 결과를 초래할 수 있어 민주주의의 대표성을 훼손하는 요인이 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 민주 시민에게 강조하는 선거 참여 태도는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "선거에 적극적으로 참여하고, 후보자의 정책을 비판적으로 분석하는 능력을 기르는 것이 중요하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(45, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  // 정독 타임라인 자동 생성
  const timeline = buildTimeline(paragraphs);
  // 복기 카드 8장
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
    timeLimitSec: 360,
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

  // 각 문단에서 문장 추출
  const paraSentMap = {};
  for (const p of paragraphs) {
    paraSentMap[p.id] = findSentences(p.text);
  }

  for (const para of paragraphs) {
    const sentences = paraSentMap[para.id];

    // 문장별 하이라이트 + 4지선다
    for (let si = 0; si < sentences.length; si++) {
      const sent = sentences[si];
      const correctText = truncate(sent.text, 80);

      // 오답: 다른 문단에서 문장 선택
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

function truncate(text, maxLen) {
  return text.length > maxLen ? text.substring(0, maxLen) : text;
}

function shuffleChoices(correct, wrongs, seed) {
  const items = [correct, ...wrongs.slice(0, 3)];
  // 정답 위치 결정
  const pos = hashIdx(seed) % 4;
  // 정답을 pos 위치로 이동
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
  console.log("=== 러셀2 Day 41~45 빌드 시작 ===\n");

  const contents = [
    buildDay41(),
    buildDay42(),
    buildDay43(),
    buildDay44(),
    buildDay45()
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
    if (qCount !== 6) {
      console.warn(`경고: Day ${dayNum} 확인 문항 ${qCount}개 (6개 필요)`);
      allValid = false;
    }
  }

  // static 파일 생성
  if (!fs.existsSync(STATIC_DIR)) {
    fs.mkdirSync(STATIC_DIR, { recursive: true });
  }
  for (const c of contents) {
    const dayNum = parseInt(c.contentId.split('-')[2]);
    const dayStr = String(dayNum).padStart(3, '0');
    const filePath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(filePath, JSON.stringify(c, null, 2), 'utf8');
    console.log(`생성: ${dayStr}.json`);
  }

  // 배치 파일 갱신 (items[40]~items[44] 교체)
  console.log("\n배치 파일 갱신 중...");
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`현재 배치 items 수: ${batchData.items.length}`);

  const dayIndices = [41, 42, 43, 44, 45];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1; // items[40]~items[44]
    const subArea = contents[i].subArea;
    const batchItem = wrapBatchItem(contents[i], dayIdx, subArea);

    if (batchData.items[batchIdx]) {
      console.log(`교체: items[${batchIdx}] (${batchData.items[batchIdx].content.contentId} -> ${contents[i].contentId})`);
    } else {
      console.log(`추가: items[${batchIdx}] (${contents[i].contentId})`);
    }
    batchData.items[batchIdx] = batchItem;
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료`);

  if (!allValid) {
    console.log("\n경고: 일부 Day의 글자수가 범위를 벗어났습니다. 파일은 생성되었으나 확인이 필요합니다.");
  }

  console.log("\n=== 빌드 완료 ===");
}

main();
