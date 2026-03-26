#!/usr/bin/env node
// 러셀1 Day 41~45 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION, 짝수 Day = LITERATURE
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

// ─── Day 41: 비문학 (NONFICTION) — 소화 과정과 영양소의 역할 ───
function buildDay41() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리가 먹는 음식은 몸속에서 여러 단계를 거치며 잘게 분해되는데, 이 과정을 소화라고 한다. 소화는 입에서부터 시작된다. 음식을 씹으면 치아가 음식물을 작게 부수고, 침 속에 들어 있는 소화 효소가 녹말을 분해하기 시작한다. 이렇게 잘게 부서진 음식물은 식도를 통해 위장으로 이동한다. 식도는 약 25센티미터 길이의 근육으로 된 관으로, 음식물을 아래로 밀어내는 연동 운동을 통해 위장까지 전달한다. 위장에서는 강한 산성을 띠는 위액이 분비되어 단백질을 분해하는 역할을 한다. 위액 속 펩신이라는 효소가 단백질을 더 작은 조각으로 나누어 다음 단계의 소화를 준비한다. 위에서 충분히 섞인 음식물은 걸쭉한 상태가 되어 소장으로 내려간다. 이처럼 소화의 앞부분은 음식물을 물리적으로 부수고 화학적으로 분해하는 작업이 함께 이루어지는 과정이다."
    },
    {
      id: "p2",
      text: "소장은 소화와 흡수가 가장 활발하게 일어나는 장기이다. 소장의 길이는 약 6미터에 달하며, 안쪽 벽에는 융털이라 불리는 작은 돌기가 빽빽하게 나 있다. 융털은 소장의 표면적을 크게 넓혀 영양소를 효율적으로 흡수할 수 있게 해 준다. 소장에서는 췌장에서 분비되는 소화액과 담즙의 도움을 받아 탄수화물, 단백질, 지방이 모두 최종 산물로 분해된다. 탄수화물은 포도당으로, 단백질은 아미노산으로, 지방은 지방산과 글리세롤로 분해되어 융털을 통해 혈액 속으로 흡수된다. 흡수된 영양소는 혈관을 따라 온몸의 세포로 운반되어 생명 활동에 필요한 에너지를 만들거나 몸을 구성하는 재료로 쓰인다."
    },
    {
      id: "p3",
      text: "영양소는 크게 탄수화물, 단백질, 지방, 비타민, 무기질로 나뉘며, 각각 우리 몸에서 서로 다른 역할을 수행한다. 탄수화물은 몸을 움직이는 데 필요한 에너지를 가장 빠르게 공급하는 영양소이다. 단백질은 근육, 피부, 머리카락 등 몸의 조직을 만들고 수리하는 데 꼭 필요하다. 지방은 체온을 유지하고 장기를 보호하며, 에너지를 저장하는 역할을 한다. 비타민과 무기질은 아주 적은 양만 필요하지만 몸의 기능을 조절하는 데 매우 중요하다. 예를 들어 비타민 C는 감기에 대한 저항력을 높여 주고, 칼슘은 뼈와 치아를 튼튼하게 만들어 준다. 이처럼 다양한 영양소가 조화롭게 공급될 때 우리 몸은 건강하게 유지될 수 있으므로, 편식하지 않고 골고루 먹는 식습관이 중요하다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "입에서 침 속의 소화 효소가 분해하기 시작하는 영양소는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "침 속에 들어 있는 소화 효소가 녹말을 분해하기 시작한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "위액 속 펩신이라는 효소의 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "펩신이라는 효소가 단백질을 더 작은 조각으로 나누어 다음 단계의 소화를 준비한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "소장 안쪽 벽의 융털이 하는 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "융털은 소장의 표면적을 크게 넓혀 영양소를 효율적으로 흡수할 수 있게 해 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "흡수된 영양소가 온몸의 세포로 운반되어 하는 일은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "생명 활동에 필요한 에너지를 만들거나 몸을 구성하는 재료로 쓰인다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "지방이 우리 몸에서 수행하는 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "지방은 체온을 유지하고 장기를 보호하며, 에너지를 저장하는 역할을 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글에서 강조하는 올바른 식습관은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "편식하지 않고 골고루 먹는 식습관이 중요하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(41, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 42: 문학 (LITERATURE) — 방학 동안 할아버지 댁에서 보낸 일주일 ───
function buildDay42() {
  const paragraphs = [
    {
      id: "p1",
      text: "여름 방학이 시작되자마자 나는 시골에 있는 할아버지 댁으로 향했다. 도시를 벗어나니 차창 밖으로 초록색 논이 끝없이 펼쳐졌다. 버스에서 내리자 풀 냄새와 흙 냄새가 뒤섞인 바람이 얼굴을 간질였다. 마당에서 기다리고 계시던 할아버지는 내 가방을 덥석 받아 들며 환하게 웃으셨다. 할머니는 부엌에서 감자전을 부치고 계셨는데, 기름이 지글지글 끓는 소리가 담장 밖까지 들렸다. 첫날 저녁, 나는 감자전을 네 장이나 먹고 배가 너무 불러 마루에 누워 별을 올려다보았다. 도시에서는 볼 수 없었던 은하수가 길게 하늘을 가로질러 흐르고 있었다. 할아버지는 옆에 누워 별자리 이름을 하나하나 알려 주셨다. 그 순간 나는 이번 방학이 특별해질 것이라는 예감이 들었다."
    },
    {
      id: "p2",
      text: "다음 날부터 할아버지는 나를 텃밭으로 데려가셨다. 할아버지는 토마토에 물을 주는 법, 잡초를 구별하여 뽑는 법을 차근차근 알려 주셨다. 처음에는 잡초와 채소를 구분하지 못해 상추를 뽑아 버리는 실수를 하기도 했다. 할아버지는 웃으시며 실수해야 기억에 남는 법이라고 말씀하셨다. 사흘째 되는 날, 할아버지와 함께 개울에 가서 물고기를 잡았다. 맨손으로 미끄러운 물고기를 잡으려니 자꾸 놓쳐 버렸지만, 할아버지가 잡는 방법을 보여 주신 뒤에는 작은 붕어 두 마리를 잡을 수 있었다. 그날 저녁 할머니가 그 붕어로 매운탕을 끓여 주셨는데, 내가 직접 잡은 물고기로 만든 음식이라 그런지 세상에서 가장 맛있게 느껴졌다."
    },
    {
      id: "p3",
      text: "일주일이 눈 깜짝할 사이에 지나갔다. 마지막 날 아침, 할아버지는 텃밭에서 직접 기른 방울토마토를 한 바구니 가득 따서 내 가방에 넣어 주셨다. 할머니는 삶은 옥수수도 봉지에 담아 챙겨 주시며 차에서 먹으라고 하셨다. 버스를 타려고 걸어가는데 할아버지가 뒤에서 또 오너라 하고 말씀하시는 소리가 들렸다. 뒤돌아보니 할아버지는 손을 흔들고 계셨고, 그 옆에서 할머니도 하얀 수건으로 눈가를 닦고 계셨다. 버스에 올라 창밖을 내다보니 논과 밭이 넓게 펼쳐진 시골 풍경이 천천히 멀어졌다. 나는 할아버지가 알려 주신 것들을 떠올리며 작은 수첩에 그 일주일의 일들을 하나하나 적기 시작했다. 직접 겪지 않으면 절대 알 수 없는 것들이 있다는 사실을 나는 그 여름에 처음 배웠다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "글쓴이가 할아버지 댁에 도착한 첫날 밤에 본 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "도시에서는 볼 수 없었던 은하수가 길게 하늘을 가로질러 흐르고 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "글쓴이가 텃밭에서 저지른 실수는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "잡초와 채소를 구분하지 못해 상추를 뽑아 버리는 실수를 하기도 했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "할아버지가 실수에 대해 하신 말씀은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "실수해야 기억에 남는 법이라고 말씀하셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "글쓴이가 붕어 매운탕을 세상에서 가장 맛있게 느낀 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "내가 직접 잡은 물고기로 만든 음식이라 그런지 세상에서 가장 맛있게 느껴졌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "마지막 날 할아버지가 글쓴이에게 준 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "텃밭에서 직접 기른 방울토마토를 한 바구니 가득 따서 내 가방에 넣어 주셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 그 여름에 처음 배운 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "직접 겪지 않으면 절대 알 수 없는 것들이 있다는 사실을 나는 그 여름에 처음 배웠다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(42, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 43: 비문학 (NONFICTION) — 지진이 발생하는 원리 ───
function buildDay43() {
  const paragraphs = [
    {
      id: "p1",
      text: "지구의 표면은 하나로 이어진 딱딱한 껍질이 아니라 여러 개의 커다란 조각으로 나뉘어 있다. 이 조각들을 판이라고 부르며, 지구에는 약 열다섯 개의 크고 작은 판이 존재한다. 판들은 지구 내부의 맨틀 위에 떠 있는 상태로 매우 느리게 움직이고 있다. 맨틀은 암석이 높은 열과 압력을 받아 아주 천천히 흐르는 층으로, 판을 이동시키는 원동력이 된다. 판이 움직이는 속도는 1년에 손톱이 자라는 정도인 수 센티미터에 불과하지만, 수백만 년이 쌓이면 대륙의 위치가 크게 바뀔 만큼의 변화를 만들어 낸다. 이러한 판의 움직임을 설명하는 이론을 판 구조론이라 하며, 지진과 화산 활동을 이해하는 데 가장 기본이 되는 과학적 틀이다."
    },
    {
      id: "p2",
      text: "지진은 대부분 판과 판이 만나는 경계 지역에서 발생한다. 두 판이 서로 밀거나 어긋나게 움직일 때, 판의 경계에 있는 암석에는 거대한 힘이 쌓이게 된다. 이 힘이 암석이 견딜 수 있는 한계를 넘어서면 암석이 갑자기 끊어지거나 어긋나면서 쌓였던 에너지가 한꺼번에 방출된다. 이때 발생하는 진동이 바로 지진이다. 지진파는 진원이라 불리는 지점에서 사방으로 퍼져 나가며, 진원 바로 위의 지표면 지점을 진앙이라고 한다. 진앙에 가까울수록 진동이 크고 피해도 심하다. 지진의 세기를 나타내는 데는 규모와 진도가 쓰이는데, 규모는 지진 자체의 에너지 크기를, 진도는 특정 지점에서 느껴지는 흔들림의 정도를 나타낸다."
    },
    {
      id: "p3",
      text: "지진은 막을 수 없지만 피해를 줄이기 위한 노력은 꾸준히 이루어지고 있다. 과학자들은 지진계를 이용하여 지진파를 감지하고, 지진이 일어나면 즉시 경보를 발령하는 조기 경보 시스템을 운영한다. 이 시스템은 큰 피해를 주는 지진파가 도착하기 전에 미리 알림을 보내 사람들이 대피할 시간을 확보하도록 돕는다. 건축 분야에서는 내진 설계를 적용하여 건물이 흔들림을 견딜 수 있도록 만든다. 내진 설계란 건물의 기둥과 벽을 특수한 구조로 만들어 지진의 힘을 흡수하거나 분산시키는 기술이다. 일본처럼 지진이 자주 발생하는 나라에서는 어린 시절부터 지진 대피 훈련을 실시하여 실제 상황에서 당황하지 않고 행동할 수 있도록 대비한다. 이처럼 지진의 원리를 이해하고 미리 준비하는 것이 피해를 최소화하는 가장 확실한 방법이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "판을 이동시키는 원동력이 되는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "맨틀은 암석이 높은 열과 압력을 받아 아주 천천히 흐르는 층으로, 판을 이동시키는 원동력이 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "지진이 발생하는 직접적인 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "암석이 갑자기 끊어지거나 어긋나면서 쌓였던 에너지가 한꺼번에 방출된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "지진의 규모와 진도는 각각 무엇을 나타내는가?",
      answerRanges: [findRange(paragraphs, "p2", "규모는 지진 자체의 에너지 크기를, 진도는 특정 지점에서 느껴지는 흔들림의 정도를 나타낸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "조기 경보 시스템이 사람들에게 도움을 주는 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "큰 피해를 주는 지진파가 도착하기 전에 미리 알림을 보내 사람들이 대피할 시간을 확보하도록 돕는다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "내진 설계란 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "내진 설계란 건물의 기둥과 벽을 특수한 구조로 만들어 지진의 힘을 흡수하거나 분산시키는 기술이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글에서 지진 피해를 최소화하는 가장 확실한 방법으로 제시하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "지진의 원리를 이해하고 미리 준비하는 것이 피해를 최소화하는 가장 확실한 방법이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(43, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 44: 문학 (LITERATURE) — 전학 가기 전날의 편지 ───
function buildDay44() {
  const paragraphs = [
    {
      id: "p1",
      text: "수진아, 내일이면 나는 이 동네를 떠나. 아빠 회사 때문에 서울로 이사 간다는 이야기를 들었을 때 처음에는 별로 실감이 나지 않았어. 먼 훗날의 일처럼 느껴졌거든. 그런데 오늘 학교에서 짐을 싸면서 책상 서랍 안에 있던 네가 쓴 쪽지를 발견했거든. 작년 체육 대회 때 달리기에서 꼴찌를 해서 운동장 구석에서 울고 있는 나한테 네가 건넨 쪽지였어. 거기에는 꼴찌여도 끝까지 달린 게 대단한 거야라고 적혀 있었지. 그때 그 쪽지를 읽고 눈물이 멈추었던 기억이 아직도 생생해. 나는 그 쪽지를 서랍 깊숙이 넣어 두고 힘들 때마다 꺼내 보곤 했어. 오늘 다시 그 쪽지를 보자 갑자기 코끝이 찡해지면서 내일이 정말 오는구나 하는 생각이 들었어."
    },
    {
      id: "p2",
      text: "솔직히 말하면 새 학교에 가는 게 무섭기도 해. 친구가 한 명도 없는 곳에서 처음부터 다시 시작해야 한다고 생각하면 마음이 무거워져. 점심시간에 혼자 밥을 먹게 되면 어떡하지, 쉬는 시간에 교실 한구석에 혼자 앉아 있으면 어떡하지, 아이들이 나를 이상하게 생각하면 어떡하지 하는 걱정이 자꾸 머릿속을 맴돌아. 그런데 네가 예전에 해 준 말이 생각나. 너는 어디에서든 잘할 수 있는 사람이야라고 말했잖아. 그 말을 떠올리면 조금은 용기가 생겨. 새 학교에 가서도 네가 나한테 해 주었던 것처럼 누군가에게 먼저 다가가 보려고 해. 옆자리 친구한테 먼저 인사하고 이름을 물어보는 것부터 시작해 볼게. 그러면 나도 그곳에서 너 같은 좋은 친구를 만날 수 있을지도 모르잖아."
    },
    {
      id: "p3",
      text: "이 편지를 쓰면서 우리가 함께 보낸 시간들이 하나하나 떠오른다. 비 오는 날 우산 하나를 같이 쓰고 뛰어간 일, 학교 뒷산에서 도토리를 주워 모은 일, 시험 기간에 도서관에서 몰래 과자를 나눠 먹다가 선생님한테 들킬 뻔한 일까지 전부 다 소중한 기억이야. 그때는 별것 아닌 것 같았는데 지금 돌이켜 보면 하나하나가 다 빛나는 순간이었어. 앞으로 서울에서 새로운 생활을 시작하겠지만, 이 기억들은 절대 사라지지 않을 거야. 수진아, 우리 자주 전화하고 방학 때마다 꼭 만나자. 그리고 마지막으로 하고 싶은 말이 있어. 지금까지 내 옆에 있어 줘서 정말 고마워. 너는 내가 만난 가장 따뜻한 사람이야. 내일 이사 가는 아침에 이 편지를 네 우편함에 넣어 둘게."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "글쓴이가 책상 서랍에서 발견한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "책상 서랍 안에 있던 네가 쓴 쪽지를 발견했거든")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "수진이가 쪽지에 적었던 내용은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "꼴찌여도 끝까지 달린 게 대단한 거야")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "글쓴이가 새 학교에 대해 느끼는 감정은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "새 학교에 가는 게 무섭기도 해")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "글쓴이가 새 학교에서 하려고 다짐하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "누군가에게 먼저 다가가 보려고 해")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "글쓴이가 이 기억들에 대해 확신하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "이 기억들은 절대 사라지지 않을 거야")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 수진이에게 마지막으로 전하고 싶은 말은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "지금까지 내 옆에 있어 줘서 정말 고마워")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(44, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 45: 비문학 (NONFICTION) — 플라스틱이 환경에 미치는 영향 ───
function buildDay45() {
  const paragraphs = [
    {
      id: "p1",
      text: "플라스틱은 가볍고 튼튼하며 값이 싸다는 장점 때문에 현대 생활 곳곳에서 널리 사용되고 있다. 음료수 병, 포장 용기, 장난감, 가전 제품의 부품에 이르기까지 플라스틱이 쓰이지 않는 곳을 찾기 어려울 정도이다. 전 세계에서 해마다 생산되는 플라스틱의 양은 약 4억 톤에 달하며, 이 가운데 상당 부분이 한 번 사용한 뒤 곧바로 버려지는 일회용 제품이다. 문제는 플라스틱이 자연에서 분해되는 데 수백 년이 걸린다는 점이다. 땅에 묻어도 썩지 않고 오랜 세월 동안 그대로 남아 토양과 지하수를 오염시킨다. 바다로 흘러 들어간 플라스틱 쓰레기는 해류를 따라 이동하며 거대한 쓰레기 섬을 형성하기도 하는데, 태평양에 있는 쓰레기 섬의 면적은 한반도의 약 일곱 배에 이른다."
    },
    {
      id: "p2",
      text: "플라스틱이 환경에 미치는 가장 심각한 문제 중 하나는 미세 플라스틱의 발생이다. 큰 플라스틱 조각은 햇빛과 파도의 영향을 받아 점점 작은 조각으로 쪼개지는데, 크기가 5밀리미터 이하로 작아진 것을 미세 플라스틱이라고 한다. 미세 플라스틱은 눈에 잘 보이지 않을 만큼 작아서 걸러 내기가 매우 어렵다. 바다에 떠다니는 미세 플라스틱을 물고기와 조개 같은 해양 생물이 먹이로 착각하여 먹게 되고, 이 생물을 다시 사람이 먹으면 미세 플라스틱이 우리 몸속으로 들어올 수 있다. 최근 연구에 따르면 사람의 혈액과 폐 조직에서도 미세 플라스틱이 발견되었으며, 이것이 건강에 어떤 영향을 미치는지에 대한 연구가 활발히 진행되고 있다."
    },
    {
      id: "p3",
      text: "플라스틱 오염을 줄이기 위한 노력은 여러 방면에서 이루어지고 있다. 많은 나라에서 일회용 비닐봉지와 플라스틱 빨대의 사용을 법으로 금지하거나 제한하고 있다. 기업들은 옥수수 전분이나 해조류와 같은 천연 재료로 만든 생분해성 플라스틱을 개발하여 기존 플라스틱을 대체하려는 연구를 진행하고 있다. 또한 사용한 플라스틱을 새로운 제품의 원료로 재활용하는 기술도 발전하고 있다. 그러나 무엇보다 중요한 것은 우리 한 사람 한 사람의 실천이다. 장볼 때 장바구니를 가져가고, 텀블러를 사용하며, 분리배출을 올바르게 하는 작은 습관이 모이면 플라스틱 오염을 크게 줄일 수 있다. 환경 문제는 먼 미래의 이야기가 아니라 지금 우리의 선택에 달려 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "플라스틱이 널리 사용되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "플라스틱은 가볍고 튼튼하며 값이 싸다는 장점 때문에 현대 생활 곳곳에서 널리 사용되고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "플라스틱이 자연에서 분해되는 데 걸리는 시간은 얼마인가?",
      answerRanges: [findRange(paragraphs, "p1", "플라스틱이 자연에서 분해되는 데 수백 년이 걸린다는 점이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "미세 플라스틱이란 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "크기가 5밀리미터 이하로 작아진 것을 미세 플라스틱이라고 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "미세 플라스틱이 사람의 몸에 들어오는 경로는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "해양 생물이 먹이로 착각하여 먹게 되고, 이 생물을 다시 사람이 먹으면 미세 플라스틱이 우리 몸속으로 들어올 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "기업들이 기존 플라스틱을 대체하기 위해 개발하고 있는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "옥수수 전분이나 해조류와 같은 천연 재료로 만든 생분해성 플라스틱을 개발하여 기존 플라스틱을 대체하려는 연구를 진행하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글에서 환경 문제에 대해 강조하는 핵심 메시지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "환경 문제는 먼 미래의 이야기가 아니라 지금 우리의 선택에 달려 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(45, "NONFICTION", "비문학", paragraphs, confirmQuestions);
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
    timeLimitSec: 300,
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
  console.log("=== 러셀1 Day 41~45 빌드 시작 ===\n");

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

  const dayIndices = [41, 42, 43, 44, 45];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1; // items[40]~items[44]
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
