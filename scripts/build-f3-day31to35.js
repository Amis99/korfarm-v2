#!/usr/bin/env node
// 프레게3 Day 31~35 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION (비문학), 짝수 Day = LITERATURE (문학)
// 목표 글자수: 1000자 ±50 (950~1050)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-frege3.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/frege3');

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

// ─── Day 31: 비문학 (NONFICTION) — 빛의 성질 ───
function buildDay31() {
  const paragraphs = [
    {
      id: "p1",
      text: "빛은 우리 눈에 보이는 세계를 만들어 주는 에너지의 한 형태이다. 빛은 태양이나 전구처럼 스스로 빛을 내는 광원에서 출발하여 사방으로 퍼져 나간다. 빛이 나아가는 속도는 매우 빨라서 일 초에 약 삼십만 킬로미터를 이동하는데, 이것은 지구를 일 초에 일곱 바퀴 반이나 돌 수 있는 엄청난 빠르기이다. 빛은 아무것도 가로막지 않으면 직선으로 곧장 나아가는 성질이 있는데, 이를 빛의 직진이라고 부른다. 그래서 손전등을 켜면 빛이 한 방향으로 곧게 뻗어 나가는 모습을 볼 수 있고, 나무 그늘이 생기는 것도 빛이 나무를 뚫고 지나가지 못하고 직진하기 때문에 나무 뒤에 어두운 부분이 만들어지는 것이다."
    },
    {
      id: "p2",
      text: "빛이 물체의 표면에 부딪히면 여러 가지 현상이 나타난다. 먼저 거울처럼 매끈한 표면에 빛이 닿으면 빛은 반사되어 다시 되돌아 나온다. 이때 빛이 들어오는 각도와 반사되어 나가는 각도는 항상 같은데, 이것을 반사의 법칙이라고 한다. 거울에 우리 모습이 비치는 것은 바로 이 반사의 법칙 덕분이다. 반면에 물이나 유리처럼 투명한 물질을 만나면 빛은 그 안으로 들어가면서 방향이 꺾이는데, 이 현상을 빛의 굴절이라고 부른다. 물컵에 빨대를 넣으면 빨대가 꺾여 보이는 것은 물 밖에서 들어온 빛과 물속에서 나아가는 빛의 속도가 달라지면서 방향이 바뀌기 때문이다. 무지개가 하늘에 나타나는 것도 비가 온 뒤 공기 중의 작은 물방울이 햇빛을 굴절시켜 여러 가지 색으로 분리해 내기 때문이다."
    },
    {
      id: "p3",
      text: "빛은 또한 색깔과 깊은 관련이 있다. 햇빛은 눈으로 보기에 하얀색처럼 보이지만, 사실은 빨강, 주황, 노랑, 초록, 파랑, 남색, 보라 등 여러 색의 빛이 합쳐진 것이다. 프리즘이라는 삼각형 유리에 햇빛을 통과시키면 빛이 굴절되면서 무지개처럼 여러 색으로 나뉘어 보이는데, 이를 빛의 분산이라고 한다. 우리가 사과를 빨갛게 보는 까닭은 사과 표면이 빨간색 빛만 반사하고 나머지 색의 빛은 흡수하기 때문이다. 이처럼 빛의 직진, 반사, 굴절, 분산은 우리 일상 곳곳에서 다양한 모습으로 나타나며, 빛의 성질을 이해하면 주변에서 일어나는 여러 자연 현상을 과학적으로 설명할 수 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "빛이 일 초에 이동하는 거리는 약 얼마인가요?",
      answerRanges: [findRange(paragraphs, "p1", "약 삼십만 킬로미터")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "빛이 아무것도 가로막지 않으면 곧장 나아가는 성질을 무엇이라고 부르나요?",
      answerRanges: [findRange(paragraphs, "p1", "빛의 직진")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "빛이 들어오는 각도와 반사되어 나가는 각도가 항상 같은 것을 무엇이라고 하나요?",
      answerRanges: [findRange(paragraphs, "p2", "반사의 법칙")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "빛이 투명한 물질을 만나 방향이 꺾이는 현상을 무엇이라고 부르나요?",
      answerRanges: [findRange(paragraphs, "p2", "빛의 굴절")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "프리즘에 햇빛을 통과시키면 여러 색으로 나뉘는 현상을 무엇이라고 하나요?",
      answerRanges: [findRange(paragraphs, "p3", "빛의 분산")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "우리가 사과를 빨갛게 보는 까닭은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p3", "사과 표면이 빨간색 빛만 반사하고 나머지 색의 빛은 흡수하기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(31, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 32: 문학 (LITERATURE) — 산골 마을 소년의 이야기 ───
function buildDay32() {
  const paragraphs = [
    {
      id: "p1",
      text: "산골 마을에 사는 준이는 매일 아침 새소리에 눈을 떴다. 준이네 집은 마을에서 가장 높은 곳에 있어서, 마당에 서면 아래쪽 논밭과 멀리 굽이치는 개울이 한눈에 들어왔다. 봄이 오면 뒷산 곳곳에 진달래가 피어 온 산이 분홍빛으로 물들었고, 가을이면 감나무에 주황색 감이 주렁주렁 달렸다. 준이는 학교에 가려면 산길을 삼십 분쯤 걸어야 했지만, 그 길이 싫지 않았다. 길가에 피어 있는 이름 모를 들꽃을 구경하고, 다람쥐가 나뭇가지를 타고 뛰어다니는 모습을 보면 걸음이 저절로 즐거워졌다. 어머니는 늘 집에서 만든 주먹밥을 도시락통에 넣어 주셨고, 준이는 점심시간마다 친구들과 운동장 느티나무 아래에서 나누어 먹었다."
    },
    {
      id: "p2",
      text: "어느 여름날, 준이는 학교에서 돌아오다 개울가에서 다리를 다친 강아지 한 마리를 발견했다. 강아지는 앞다리를 절뚝이며 축 처진 눈으로 준이를 올려다보았다. 준이는 가방에서 수건을 꺼내 강아지의 다리를 조심스럽게 감싸 주고, 품에 안아 집으로 데려왔다. 어머니는 처음에 걱정스러운 표정을 지으셨지만, 강아지의 가엾은 눈을 보고는 이내 따뜻한 우유를 데워 주셨다. 준이는 강아지에게 구름이라는 이름을 지어 주었다. 하얀 털이 마치 하늘에 떠 있는 뭉게구름 같았기 때문이다. 그날부터 준이는 매일 아침 학교에 가기 전에 구름이의 다리에 약을 발라 주고, 밥을 챙겨 주었다."
    },
    {
      id: "p3",
      text: "보름쯤 지나자 구름이의 다리는 거의 다 나았다. 구름이는 이제 마당을 힘차게 뛰어다니며 꼬리를 흔들었고, 준이가 학교에서 돌아오면 언제나 대문 앞까지 달려 나와 반겨 주었다. 준이는 구름이와 함께 개울가에 가서 물장구를 치고, 산길을 나란히 걸었다. 어느 날 준이 어머니가 말씀하셨다. 구름이가 온 뒤로 네 표정이 훨씬 밝아졌구나. 준이는 빙그레 웃으며 대답했다. 구름이는 제 가장 좋은 친구예요. 준이는 작은 생명을 돌보면서 책임감과 따뜻한 마음이 자라났고, 구름이는 외딴 산골에서 준이의 가장 든든한 벗이 되어 주었다. 산골 마을의 하루하루는 조용했지만, 준이와 구름이의 우정 덕분에 빛나고 풍요로운 나날이었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "준이네 집에서 마당에 서면 무엇이 보이나요?",
      answerRanges: [findRange(paragraphs, "p1", "아래쪽 논밭과 멀리 굽이치는 개울이 한눈에 들어왔다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "준이는 학교에 가려면 얼마나 걸어야 했나요?",
      answerRanges: [findRange(paragraphs, "p1", "삼십 분쯤")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "준이가 개울가에서 발견한 강아지는 어디를 다쳤나요?",
      answerRanges: [findRange(paragraphs, "p2", "앞다리를 절뚝이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "준이가 강아지에게 지어 준 이름은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p2", "구름이")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "구름이의 다리가 나은 뒤 준이가 학교에서 돌아오면 구름이는 어떻게 했나요?",
      answerRanges: [findRange(paragraphs, "p3", "대문 앞까지 달려 나와 반겨 주었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "준이가 작은 생명을 돌보면서 자라난 것은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p3", "책임감과 따뜻한 마음이 자라났고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(32, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 33: 비문학 (NONFICTION) — 지도의 역사 ───
function buildDay33() {
  const paragraphs = [
    {
      id: "p1",
      text: "지도는 땅의 모습을 종이나 화면 위에 줄여서 그린 것으로, 인류가 만든 가장 오래된 기록 가운데 하나이다. 약 사천 년 전 고대 바빌로니아 사람들은 점토판 위에 강과 산의 위치를 새겨 넣었는데, 이것이 현재까지 발견된 가장 오래된 지도로 알려져 있다. 고대 그리스 사람들은 지구가 둥글다는 사실을 깨닫고, 위도와 경도의 개념을 도입하여 더 정확한 지도를 만들고자 노력하였다. 특히 프톨레마이오스라는 학자는 수학적 방법을 활용하여 세계 지도를 만들었는데, 이 지도는 비록 정확하지는 않았지만 이후 천 년 넘게 유럽의 지도 제작에 큰 영향을 주었다. 이처럼 옛사람들은 주변 세계를 이해하기 위해 끊임없이 지도를 만들고 발전시켜 왔다."
    },
    {
      id: "p2",
      text: "대항해 시대에 접어들면서 지도는 더욱 정밀하게 발전하였다. 십오 세기부터 유럽의 탐험가들이 아프리카, 아메리카, 아시아 등 미지의 대륙으로 항해를 시작하면서, 새로 발견된 땅의 모습이 지도에 추가되었다. 이 시기에 메르카토르라는 지도 제작자는 둥근 지구를 평평한 종이 위에 펼치는 새로운 방법을 고안하였는데, 이를 메르카토르 도법이라고 부른다. 메르카토르 도법으로 만든 지도에서는 방향이 정확하게 표시되어 항해사들이 바다 위에서 길을 찾기 편리했다. 다만 이 도법은 적도에서 멀어질수록 땅의 크기가 실제보다 크게 표시되는 단점이 있어서, 오늘날에도 여러 가지 다른 도법이 함께 사용되고 있다."
    },
    {
      id: "p3",
      text: "오늘날 지도 기술은 인공위성과 컴퓨터 덕분에 크게 발전하였다. 인공위성이 우주에서 지구를 촬영하여 보내 주는 영상을 바탕으로 아주 정밀한 지도를 만들 수 있게 되었으며, 컴퓨터를 이용하면 원하는 지역을 자유롭게 확대하거나 축소하여 볼 수 있다. 휴대 전화의 지도 앱을 열면 현재 내가 어디에 있는지 바로 확인할 수 있고, 목적지까지 가는 길을 실시간으로 안내받을 수도 있다. 이러한 디지털 지도 서비스를 가능하게 하는 핵심 기술이 바로 위성 위치 확인 시스템, 즉 GPS이다. 이처럼 지도는 점토판의 간단한 그림에서 출발하여 인공위성과 디지털 기술이 결합된 첨단 도구로 진화하였으며, 우리 일상에서 빠질 수 없는 중요한 역할을 하고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "현재까지 발견된 가장 오래된 지도 가운데 하나를 만든 사람들은 누구인가요?",
      answerRanges: [findRange(paragraphs, "p1", "고대 바빌로니아 사람들")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "고대 그리스 사람들이 더 정확한 지도를 만들기 위해 도입한 것은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p1", "위도와 경도의 개념")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "메르카토르 도법으로 만든 지도의 장점은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p2", "방향이 정확하게 표시되어 항해사들이 바다 위에서 길을 찾기 편리했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "메르카토르 도법의 단점은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p2", "적도에서 멀어질수록 땅의 크기가 실제보다 크게 표시되는 단점")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "디지털 지도 서비스를 가능하게 하는 핵심 기술은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p3", "위성 위치 확인 시스템, 즉 GPS")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "오늘날 인공위성은 지도 제작에 어떤 역할을 하나요?",
      answerRanges: [findRange(paragraphs, "p3", "인공위성이 우주에서 지구를 촬영하여 보내 주는 영상을 바탕으로 아주 정밀한 지도를 만들 수 있게 되었으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(33, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 34: 문학 (LITERATURE) — 바다와 어부 할아버지 ───
function buildDay34() {
  const paragraphs = [
    {
      id: "p1",
      text: "바닷가 작은 마을에 혼자 사는 할아버지가 계셨다. 할아버지는 젊은 시절부터 오십 년 넘게 고기를 잡아 오신 어부로, 마을 사람들은 할아버지를 바다 할아버지라고 불렀다. 할아버지의 하루는 동이 트기도 전에 시작되었다. 새벽 어둠 속에서 작은 나무배에 올라 노를 저으며 먼 바다로 나가셨고, 그물을 던져 고기를 건져 올리시는 모습은 마치 바다와 오랜 대화를 나누는 것 같았다. 할아버지는 늘 그날 잡은 고기 가운데 가장 좋은 것을 이웃에게 나누어 주셨는데, 고기를 받는 사람들은 모두 환한 얼굴로 고마워하였다. 할아버지는 바다가 베풀어 준 것을 함께 나누는 게 당연하다며 넉넉하게 웃으셨다."
    },
    {
      id: "p2",
      text: "어느 해 겨울, 며칠 동안 거센 바람이 불어 바다가 몹시 거칠어졌다. 마을의 젊은 어부들은 모두 배를 항구에 묶어 두었지만, 할아버지는 날씨가 조금 잠잠해지자 혼자 배를 타고 나가셨다. 가족도 이웃도 걱정하며 말렸지만, 할아버지는 고개를 저으며 물고기들도 추운 겨울을 나야 하듯, 어부도 바다를 피할 수는 없다고 말씀하셨다. 그날 할아버지는 파도와 싸우며 한참을 바다 위에서 보내신 끝에 꽤 큰 도미 몇 마리를 잡아 돌아오셨다. 항구에서 기다리고 있던 사람들이 달려와 할아버지를 맞이했고, 할아버지는 지친 몸을 이끌고도 도미를 나누어 주며 웃음을 잃지 않으셨다."
    },
    {
      id: "p3",
      text: "봄이 돌아오자, 할아버지는 마을 아이들을 배에 태우고 가까운 바다로 나가셨다. 아이들은 처음 타는 배에 겁을 내면서도 파란 바다 위에 둥실 떠 있는 느낌에 신이 나서 소리를 질렀다. 할아버지는 그물 던지는 법과 바람의 방향을 읽는 법을 천천히 알려 주셨다. 바다는 두려운 곳이 아니라 우리에게 먹을 것을 주는 고마운 곳이란다, 하고 할아버지는 아이들에게 말씀하셨다. 한 아이가 할아버지는 바다가 무섭지 않으세요 하고 물었다. 할아버지는 잠시 먼 수평선을 바라보시더니, 무섭기도 하지만 바다를 사랑하면 바다도 나를 지켜 준단다 하고 조용히 대답하셨다. 돌아오는 길, 석양에 물든 바다 위로 할아버지의 낡은 배가 천천히 항구를 향해 나아갔다. 아이들의 웃음소리가 잔잔한 파도 위에 길게 퍼져 나갔다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "마을 사람들이 할아버지를 부르는 별명은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p1", "바다 할아버지")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "할아버지는 잡은 고기를 어떻게 하셨나요?",
      answerRanges: [findRange(paragraphs, "p1", "가장 좋은 것을 이웃에게 나누어 주셨는데")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "겨울에 거센 바람이 불었을 때 젊은 어부들은 어떻게 했나요?",
      answerRanges: [findRange(paragraphs, "p2", "모두 배를 항구에 묶어 두었지만")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "할아버지가 겨울 바다에서 잡아 온 물고기는 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p2", "꽤 큰 도미 몇 마리")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "봄에 할아버지가 아이들에게 알려 주신 것은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p3", "그물 던지는 법과 바람의 방향을 읽는 법")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "할아버지는 바다가 무섭지 않느냐는 질문에 어떻게 대답하셨나요?",
      answerRanges: [findRange(paragraphs, "p3", "무섭기도 하지만 바다를 사랑하면 바다도 나를 지켜 준단다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(34, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 35: 비문학 (NONFICTION) — 소리의 전달 ───
function buildDay35() {
  const paragraphs = [
    {
      id: "p1",
      text: "소리는 물체가 떨릴 때 만들어지는 파동이다. 기타 줄을 튕기면 줄이 빠르게 떨리면서 주변 공기를 밀어내고, 그 공기가 다시 옆의 공기를 밀어내는 식으로 떨림이 퍼져 나간다. 이렇게 공기를 타고 전달되는 떨림이 우리 귀의 고막에 닿으면 우리는 소리를 듣게 된다. 소리는 공기뿐 아니라 물이나 나무, 철 같은 물질을 통해서도 전달될 수 있다. 재미있는 것은 소리가 전달되는 빠르기가 물질에 따라 다르다는 점이다. 공기 중에서 소리는 일 초에 약 삼백사십 미터를 나아가지만, 물속에서는 약 천오백 미터, 철 안에서는 약 오천 미터나 나아간다. 단단한 물질일수록 소리가 더 빨리 전달되는 까닭은 물질을 이루는 작은 알갱이들이 서로 가까이 붙어 있어서 떨림을 빠르게 전달하기 때문이다."
    },
    {
      id: "p2",
      text: "소리에는 높낮이와 크기라는 두 가지 중요한 특성이 있다. 소리의 높낮이는 물체가 일 초에 몇 번 떨리느냐에 따라 결정되는데, 이 떨림의 횟수를 진동수라고 부르며 단위는 헤르츠이다. 진동수가 클수록 높은 소리가 나고, 진동수가 작을수록 낮은 소리가 난다. 바이올린의 가는 줄은 빠르게 떨려서 높은 소리를 내고, 첼로의 굵은 줄은 느리게 떨려서 낮은 소리를 낸다. 소리의 크기는 물체가 떨리는 폭에 의해 결정된다. 북을 세게 치면 북 가죽이 크게 떨려서 큰 소리가 나고, 살짝 치면 작게 떨려서 작은 소리가 나는 것이다. 이처럼 소리의 높낮이와 크기는 모두 물체의 떨림과 밀접하게 연관되어 있다."
    },
    {
      id: "p3",
      text: "소리는 우리 생활 곳곳에서 다양하게 활용되고 있다. 병원에서는 초음파라는 특별한 소리를 이용하여 몸속의 모습을 화면으로 살펴본다. 초음파는 사람의 귀에 들리지 않을 만큼 높은 진동수를 가진 소리로, 몸속 장기에 부딪혀 되돌아오는 신호를 분석하여 영상을 만들어 낸다. 배나 잠수함에서는 수중 음파 탐지기를 이용하여 바다의 깊이를 측정하거나 물고기 떼를 찾기도 한다. 또한 콘서트 홀이나 극장을 설계할 때에는 소리가 벽에 부딪혀 되돌아오는 현상인 반향을 적절히 조절하여 관객이 좋은 소리를 들을 수 있도록 한다. 이처럼 소리의 성질을 잘 이해하면 의료, 항해, 건축 등 여러 분야에서 유용하게 활용할 수 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "소리가 만들어지는 원리는 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p1", "물체가 떨릴 때 만들어지는 파동이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "공기 중에서 소리는 일 초에 약 얼마나 나아가나요?",
      answerRanges: [findRange(paragraphs, "p1", "약 삼백사십 미터")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "소리의 높낮이를 결정하는 것은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p2", "물체가 일 초에 몇 번 떨리느냐에 따라 결정되는데")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "소리의 크기는 무엇에 의해 결정되나요?",
      answerRanges: [findRange(paragraphs, "p2", "물체가 떨리는 폭에 의해 결정된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "초음파는 어떤 특징을 가진 소리인가요?",
      answerRanges: [findRange(paragraphs, "p3", "사람의 귀에 들리지 않을 만큼 높은 진동수를 가진 소리")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "콘서트 홀 설계에서 적절히 조절해야 하는 소리 현상은 무엇인가요?",
      answerRanges: [findRange(paragraphs, "p3", "소리가 벽에 부딪혀 되돌아오는 현상인 반향")],
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
  const contentId = `dr-f3-${dayStr}`;

  return {
    contentId,
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
      recall,
      confirm: { questions: confirmQuestions }
    }
  };
}

// ─── 배치 아이템 래퍼 ───
function wrapBatchItem(content, dayIndex, subArea) {
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

// ─── 메인 실행 ───
function main() {
  console.log("=== 프레게3 Day 31~35 빌드 시작 ===\n");

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
    if (len < 950 || len > 1050) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 950~1050)`);
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

  if (!allValid) {
    console.error("\n검증 실패! 글자수를 조정하세요.");
    process.exit(1);
  }

  console.log("\n모든 검증 통과!\n");

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
