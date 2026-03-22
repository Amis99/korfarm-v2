#!/usr/bin/env node
// 러셀2 Day 36~40 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE, 홀수 Day = NONFICTION
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

// ─── Day 36: 문학 (LITERATURE) — 오래된 사진관을 운영하는 아버지 이야기 ───
function buildDay36() {
  const paragraphs = [
    {
      id: "p1",
      text: "골목 안쪽에 자리한 아버지의 사진관은 벌써 삼십 년이 넘도록 같은 자리를 지키고 있었다. 건물 외벽의 페인트는 군데군데 벗겨져 있었고, 간판 글씨도 햇볕에 바래 겨우 읽을 수 있는 정도였다. 그러나 유리문을 밀고 들어서면 암실에서 풍기는 현상액 냄새와 오래된 목재 선반 위에 가지런히 놓인 렌즈들이 세월의 무게를 고스란히 전해 주었다. 벽면에는 아버지가 직접 찍은 흑백사진들이 액자에 담겨 걸려 있었는데, 사진 속 인물들의 표정에는 하나같이 자연스러운 미소가 묻어 있었다. 아버지는 늘 카메라 앞에 서는 사람보다 카메라 뒤에 서는 사람이 더 많은 것을 본다고 말씀하셨다. 나는 어릴 적 그 말의 의미를 제대로 이해하지 못했지만, 아버지가 손님의 표정을 읽으며 셔터를 누르던 진지한 눈빛만큼은 또렷이 기억하고 있다."
    },
    {
      id: "p2",
      text: "디지털 카메라와 스마트폰이 보급되면서 동네 사진관을 찾는 사람은 눈에 띄게 줄어들었다. 한때 졸업 사진과 가족사진으로 예약이 밀리던 시절이 있었지만, 이제 그런 손님은 일 년에 손에 꼽을 정도였다. 누구나 주머니 속 전화기로 사진을 찍을 수 있는 시대가 되자, 일부러 사진관을 찾아와 조명 아래 앉는 일은 번거롭게 여겨지기 시작한 것이다. 어머니는 사진관을 접고 다른 일을 알아보자고 몇 번이나 권하셨지만, 아버지는 묵묵히 카메라를 닦으며 대답을 미루곤 하셨다. 아버지에게 사진관은 단순한 생업의 공간이 아니라 사람들의 순간을 기록해 온 삶의 현장이었기 때문이다. 선반 위에 빼곡하게 쌓인 앨범들은 마을 사람들의 크고 작은 역사를 담고 있었고, 아버지는 그것을 지키는 일이 자신의 소명이라고 여기는 듯했다."
    },
    {
      id: "p3",
      text: "어느 늦은 오후, 한 노인이 사진관 문을 열고 들어왔다. 낡은 사진 한 장을 조심스럽게 꺼내 보이며 같은 배경에서 다시 한 번 찍어 달라고 부탁하였다. 사진 속에는 젊은 부부가 환하게 웃고 서 있었는데, 노인은 그 사진이 오십 년 전 아버지가 찍어 준 것이라고 했다. 아버지는 한참 동안 사진을 들여다보다가 고개를 끄덕이셨다. 두 사람은 나란히 카메라 앞에 섰고, 아버지는 평소보다 더 오래 앵글을 맞추었다. 노인의 눈가에 주름이 깊이 패여 있었지만, 오십 년 전과 똑같이 환하게 웃는 모습에 아버지도 잠시 눈시울을 붉히셨다. 셔터 소리가 울린 뒤 아버지는 처음으로 내가 이 일을 계속해 온 이유를 알겠느냐고 물으셨다. 나는 대답 대신 고개를 끄덕였고, 그날의 사진은 선반 위 앨범의 맨 마지막 페이지에 끼워졌다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "아버지가 카메라 뒤에 서는 사람이 더 많은 것을 본다고 말한 까닭은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "아버지가 손님의 표정을 읽으며 셔터를 누르던 진지한 눈빛만큼은 또렷이 기억하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "어머니의 권유에도 아버지가 사진관을 계속 지킨 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "아버지에게 사진관은 단순한 생업의 공간이 아니라 사람들의 순간을 기록해 온 삶의 현장이었기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "선반 위에 쌓인 앨범들이 아버지에게 지니는 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "마을 사람들의 크고 작은 역사를 담고 있었고, 아버지는 그것을 지키는 일이 자신의 소명이라고 여기는 듯했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "노인이 사진관을 찾아온 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "같은 배경에서 다시 한 번 찍어 달라고 부탁하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "아버지가 평소보다 더 오래 앵글을 맞춘 행동에서 드러나는 심리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "아버지는 평소보다 더 오래 앵글을 맞추었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 아버지의 질문에 대답 대신 고개를 끄덕인 이유는 무엇이라 짐작할 수 있는가?",
      answerRanges: [findRange(paragraphs, "p3", "그날의 사진은 선반 위 앨범의 맨 마지막 페이지에 끼워졌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(36, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 37: 비문학 (NONFICTION) — 인류의 우주 탐사 역사 ───
function buildDay37() {
  const paragraphs = [
    {
      id: "p1",
      text: "인류가 지구 밖 세계에 관심을 기울이기 시작한 것은 오래전 일이지만, 본격적인 우주 탐사가 가능해진 것은 20세기 중반에 이르러서였다. 1957년 소련이 세계 최초의 인공위성 스푸트니크 1호를 발사하면서 이른바 우주 시대가 열렸다. 이 사건은 과학 기술의 성취인 동시에 냉전이라는 정치적 경쟁의 산물이기도 했다. 당시 세계는 미국과 소련을 중심으로 두 진영으로 나뉘어 있었다. 미국과 소련은 서로의 기술적 우위를 증명하기 위해 치열한 우주 경쟁을 벌였고, 이 과정에서 로켓 공학과 통신 기술이 비약적으로 발전하였다. 1961년 소련의 유리 가가린이 최초로 지구 궤도 비행에 성공하자 미국은 달 착륙이라는 더 큰 목표를 세우고 아폴로 계획을 추진하였다. 케네디 대통령은 10년 안에 달에 사람을 보내겠다고 선언하였고, 이 약속은 미국 전체의 과학 역량을 한 방향으로 집중시키는 원동력이 되었다."
    },
    {
      id: "p2",
      text: "1969년 아폴로 11호의 달 착륙은 인류 역사에서 가장 상징적인 사건 가운데 하나로 기록되었다. 닐 암스트롱이 달 표면에 첫발을 내딛으며 남긴 말은 전 세계에 생중계되었고, 수억 명의 시청자가 그 장면을 지켜보았다. 달 표면에서 채취한 암석 시료는 지구로 가져와 분석되었으며, 이를 통해 달의 생성 과정과 태양계 초기의 환경에 대한 귀중한 정보를 얻을 수 있었다. 그러나 달 착륙 이후 우주 탐사의 방향은 크게 바뀌었다. 막대한 비용이 드는 유인 탐사 대신, 무인 탐사선을 활용한 태양계 탐사가 중심이 되었다. 보이저 1호와 2호는 목성과 토성을 지나며 상세한 사진과 데이터를 지구로 전송하였고, 이후 천왕성과 해왕성까지 도달하여 태양계 외곽의 모습을 처음으로 인류에게 보여 주었다."
    },
    {
      id: "p3",
      text: "21세기에 들어서면서 우주 탐사는 국가 주도에서 민간 기업의 참여로 확대되는 새로운 국면을 맞이하였다. 스페이스엑스와 같은 민간 기업이 재사용 가능한 로켓을 개발하면서 발사 비용이 크게 낮아졌고, 이는 우주 탐사의 접근성을 획기적으로 높이는 계기가 되었다. 또한 화성 유인 탐사와 달 기지 건설이라는 새로운 목표가 구체화되고 있으며, 여러 나라가 협력하여 국제 우주 정거장을 운영하는 등 협력적 탐사의 시대가 열리고 있다. 우주 탐사 기술은 위성 통신, 기상 관측, 위치 측정 등 일상생활에도 깊이 스며들어 현대 문명의 필수적인 기반이 되었다. 우주 탐사는 이제 경쟁의 도구가 아니라 인류 공동의 미래를 준비하는 과정으로 자리매김하고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "본격적인 우주 시대가 열린 계기는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "1957년 소련이 세계 최초의 인공위성 스푸트니크 1호를 발사하면서 이른바 우주 시대가 열렸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "미국이 아폴로 계획을 추진하게 된 직접적인 배경은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "1961년 소련의 유리 가가린이 최초로 지구 궤도 비행에 성공하자 미국은 달 착륙이라는 더 큰 목표를 세우고 아폴로 계획을 추진하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "달 착륙 이후 우주 탐사의 방향은 어떻게 바뀌었는가?",
      answerRanges: [findRange(paragraphs, "p2", "막대한 비용이 드는 유인 탐사 대신, 무인 탐사선을 활용한 태양계 탐사가 중심이 되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "보이저 탐사선이 인류에게 처음 보여 준 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "천왕성과 해왕성까지 도달하여 태양계 외곽의 모습을 처음으로 인류에게 보여 주었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "민간 기업의 참여가 우주 탐사에 가져온 변화는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "재사용 가능한 로켓을 개발하면서 발사 비용이 크게 낮아졌고, 이는 우주 탐사의 접근성을 획기적으로 높이는 계기가 되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "오늘날 우주 탐사의 성격은 과거와 비교하여 어떻게 달라졌는가?",
      answerRanges: [findRange(paragraphs, "p3", "우주 탐사는 이제 경쟁의 도구가 아니라 인류 공동의 미래를 준비하는 과정으로 자리매김하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(37, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 38: 문학 (LITERATURE) — 장마철 시골 마을의 풍경 ───
function buildDay38() {
  const paragraphs = [
    {
      id: "p1",
      text: "장마가 시작되면 마을의 풍경은 하루아침에 달라졌다. 논둑 사이로 흐르던 가느다란 개울은 어느새 흙빛 물살로 부풀어 올랐고, 마당 한켠에 쌓아 둔 장작더미 위로도 빗물이 쉴 새 없이 떨어졌다. 지붕 위를 타고 흐르는 빗물이 처마 끝에서 굵은 줄기가 되어 떨어지면 마당에는 작은 물웅덩이가 여기저기 만들어졌고, 닭들은 처마 아래로 바짝 붙어 앉아 움직이지 않았다. 할머니는 처마 밑에 앉아 빗줄기를 바라보시며 올해도 어김없이 왔구나 하고 중얼거리셨다. 장마는 마을 사람들에게 걱정이자 기다림이었다. 논에 물이 넉넉히 차야 벼가 잘 자라지만, 비가 지나치면 밭작물이 물에 잠겨 한 해 농사를 망칠 수도 있었다. 그래서 어른들은 하늘을 올려다보며 적당히 오다 그치기를 바랐고, 아이들은 빗속에서 뛰어놀 궁리만 하고 있었다."
    },
    {
      id: "p2",
      text: "비가 며칠째 이어지자 마을 앞 냇물이 불어나기 시작했다. 평소에는 징검다리를 건너 학교에 다니던 아이들도 물살이 세져 돌아가는 길을 택해야 했다. 할아버지는 비가 그치면 징검다리 돌을 다시 놓아야 한다며 마루에 앉아 담배를 피우셨다. 장마철의 마을은 고요하면서도 어딘지 긴장감이 감돌았다. 밤이면 산기슭에서 내려오는 물소리가 유난히 크게 들려왔고, 혹시 산사태가 나지는 않을까 걱정하는 어른들의 목소리가 낮게 오갔다. 빗소리가 지붕을 두드리는 사이로 개구리 울음소리가 끊이지 않았고, 축축한 공기 속에서 풀과 흙의 냄새가 진하게 퍼졌다. 저녁이면 온 가족이 안방에 모여 앉아 빗소리를 들으며 고구마를 쪄 먹었는데, 그 시간만큼은 장마가 오히려 반가운 손님처럼 느껴지기도 했다."
    },
    {
      id: "p3",
      text: "일주일쯤 지나자 빗줄기가 가늘어지더니 마침내 구름 사이로 햇살이 비쳤다. 마을 사람들은 일제히 밖으로 나와 논밭의 상태를 살폈다. 다행히 큰 피해는 없었고, 논에는 물이 알맞게 차 있어 벼 포기가 한층 푸르게 자라 있었다. 아이들은 물이 빠진 개울에서 물고기를 잡으며 환호하였고, 어른들은 서로의 밭을 돌아보며 수확 걱정을 덜었다. 할머니는 장마가 잘 끝났으니 올 가을은 풍년이겠다며 밝게 웃으셨다. 오랜만에 나타난 햇볕 아래 빨랫줄에는 이불과 옷가지가 가지런히 널렸고, 마을 곳곳에서 빨래를 터는 소리가 정겹게 울렸다. 장마가 지나간 마을에는 축축한 땅 위로 새로운 생명의 기운이 돋아나고 있었고, 여름의 한가운데를 지나는 마을 사람들의 얼굴에도 안도의 빛이 어려 있었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "장마가 마을 사람들에게 걱정이자 기다림이었던 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "논에 물이 넉넉히 차야 벼가 잘 자라지만, 비가 지나치면 밭작물이 물에 잠겨 한 해 농사를 망칠 수도 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "장마철에 아이들이 학교에 갈 때 겪은 어려움은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "물살이 세져 돌아가는 길을 택해야 했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "장마가 오히려 반가운 손님처럼 느껴진 순간은 언제인가?",
      answerRanges: [findRange(paragraphs, "p2", "저녁이면 온 가족이 안방에 모여 앉아 빗소리를 들으며 고구마를 쪄 먹었는데, 그 시간만큼은 장마가 오히려 반가운 손님처럼 느껴지기도 했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "장마가 끝난 뒤 논밭의 상태는 어떠했는가?",
      answerRanges: [findRange(paragraphs, "p3", "큰 피해는 없었고, 논에는 물이 알맞게 차 있어 벼 포기가 한층 푸르게 자라 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "할머니가 올 가을은 풍년이겠다고 말한 근거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "장마가 잘 끝났으니 올 가을은 풍년이겠다며 밝게 웃으셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "장마가 지나간 뒤 마을의 전체적인 분위기는 어떠한가?",
      answerRanges: [findRange(paragraphs, "p3", "축축한 땅 위로 새로운 생명의 기운이 돋아나고 있었고, 여름의 한가운데를 지나는 마을 사람들의 얼굴에도 안도의 빛이 어려 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(38, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 39: 비문학 (NONFICTION) — 인쇄술의 발명과 지식의 확산 ───
function buildDay39() {
  const paragraphs = [
    {
      id: "p1",
      text: "인쇄술이 발명되기 이전, 책은 사람의 손으로 한 글자씩 베껴 쓰는 방식으로 만들어졌다. 필사본은 제작에 막대한 시간과 노동력이 필요하였기 때문에 책의 가격이 매우 비쌌고, 그 결과 지식은 성직자나 귀족 등 소수 특권층의 전유물이었다. 한 권의 책을 필사하는 데 몇 달이 걸리는 일도 드물지 않았으며, 그만큼 책은 귀하고 소중하게 다루어졌다. 수도원의 필사실에서 수도사들이 하루 종일 앉아 글자를 베끼는 것이 당시 책을 만드는 유일한 방법이었다. 일반 백성이 책을 접할 기회는 극히 드물었으며, 교육의 기회 역시 제한적이었다. 이러한 상황은 동아시아에서 목판 인쇄술이 등장하면서 서서히 변화하기 시작하였다. 목판 인쇄는 나무판에 글자를 새겨 먹을 묻힌 뒤 종이에 찍어 내는 방식으로, 한 번 판을 새기면 동일한 내용을 여러 부 찍어 낼 수 있었다. 이를 통해 책의 생산 속도가 빨라지고 비용이 낮아지기 시작하였다."
    },
    {
      id: "p2",
      text: "인쇄 기술의 획기적인 전환점은 금속 활자의 발명에서 찾을 수 있다. 고려 시대에 세계 최초의 금속 활자가 만들어졌으며, 이를 통해 인쇄된 현존하는 가장 오래된 금속 활자본이 바로 직지심체요절이다. 금속 활자는 목판과 달리 글자를 하나씩 조립할 수 있어 다양한 내용의 책을 더 효율적으로 생산할 수 있었다. 또한 금속은 나무보다 내구성이 뛰어나 한 번 만든 활자를 오랫동안 반복하여 사용할 수 있다는 장점도 있었다. 15세기 중반 유럽에서는 구텐베르크가 인쇄기를 개량하여 대량 인쇄를 실현하였다. 구텐베르크의 인쇄 혁명은 성경을 비롯한 종교 서적의 대량 보급을 가능하게 하였고, 이는 종교 개혁의 확산에도 결정적인 역할을 하였다."
    },
    {
      id: "p3",
      text: "인쇄술의 발전은 지식의 생산과 유통 방식을 근본적으로 바꾸어 놓았다. 책의 가격이 낮아지면서 더 많은 사람들이 책을 읽을 수 있게 되었고, 이는 문해율의 향상과 교육의 확대로 이어졌다. 또한 학자들이 자신의 연구 결과를 널리 공유할 수 있게 되면서 과학과 철학의 발전이 가속화되었다. 서로 다른 지역의 학자들이 같은 책을 읽고 토론할 수 있게 된 것은 학문 공동체의 형성에 크게 기여하였다. 인쇄술은 단순한 기술적 발명을 넘어 사회 전체의 구조를 변화시킨 혁신이었다. 지식이 소수의 손에서 벗어나 대중에게 퍼져 나가면서, 사람들은 스스로 생각하고 판단할 수 있는 힘을 갖추게 되었다. 이러한 변화는 근대 민주주의의 형성에도 중요한 밑거름이 되었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "인쇄술 발명 이전에 지식이 소수의 전유물이었던 까닭은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "필사본은 제작에 막대한 시간과 노동력이 필요하였기 때문에 책의 가격이 매우 비쌌고, 그 결과 지식은 성직자나 귀족 등 소수 특권층의 전유물이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "목판 인쇄술이 기존 필사 방식에 비해 가진 장점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "한 번 판을 새기면 동일한 내용을 여러 부 찍어 낼 수 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "금속 활자가 목판 인쇄에 비해 효율적인 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "금속 활자는 목판과 달리 글자를 하나씩 조립할 수 있어 다양한 내용의 책을 더 효율적으로 생산할 수 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "구텐베르크의 인쇄 혁명이 종교 분야에 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "종교 서적의 대량 보급을 가능하게 하였고, 이는 종교 개혁의 확산에도 결정적인 역할을 하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "인쇄술의 발전이 과학과 철학에 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "학자들이 자신의 연구 결과를 널리 공유할 수 있게 되면서 과학과 철학의 발전이 가속화되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "인쇄술에 의한 지식의 확산이 사회적으로 가져온 궁극적 변화는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "이러한 변화는 근대 민주주의의 형성에도 중요한 밑거름이 되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(39, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 40: 문학 (LITERATURE) — 피아노 학원을 그만둔 날 ───
function buildDay40() {
  const paragraphs = [
    {
      id: "p1",
      text: "피아노 학원을 그만두겠다고 말한 것은 중학교 2학년 여름이었다. 어머니는 잠시 멈칫하셨지만 이내 네가 결정한 거라면 존중한다고 말씀하셨다. 초등학교 3학년부터 다섯 해 동안 빠지지 않고 다녔으니 짧은 시간은 아니었다. 처음에는 건반 위에서 소리가 나는 것 자체가 신기하고 재미있었다. 간단한 동요를 양손으로 칠 수 있게 되었을 때의 뿌듯함은 지금도 생생하다. 발표회에서 무대에 올라 연주를 마치고 박수를 받았던 기억도 가슴 한켠에 남아 있다. 그러나 학년이 올라가면서 학원은 점점 의무처럼 느껴지기 시작했다. 매주 같은 곡을 반복하고, 선생님의 지적에 맞추어 손가락을 교정하는 시간이 즐거움보다는 부담으로 다가왔다. 친구들이 운동장에서 뛰어노는 소리를 들으며 연습실에 앉아 있으면, 피아노가 나를 가두는 울타리처럼 느껴질 때도 있었다."
    },
    {
      id: "p2",
      text: "학원을 그만둔 뒤 처음 며칠은 해방감에 들떠 있었다. 방과 후에 친구들과 마음껏 놀 수 있었고, 주말에도 학원 갈 준비를 하지 않아도 되었다. 그런데 일주일쯤 지나자 묘한 허전함이 밀려왔다. 저녁 시간에 무엇을 해야 할지 몰라 멍하니 앉아 있는 날이 많아졌다. 습관처럼 손가락을 책상 위에서 움직이고 있는 자신을 발견할 때면 마음이 복잡해졌다. 어느 날 텔레비전에서 누군가가 쇼팽의 녹턴을 연주하는 장면을 보았는데, 손가락이 건반 위를 미끄러지는 모습에 괜히 마음이 뭉클해졌다. 나도 저 곡을 칠 수 있었을까 하는 생각이 문득 스쳤다. 그때 비로소 내가 피아노를 그만둔 것이 피아노가 싫어서가 아니라, 피아노를 좋아하는 방법을 몰랐기 때문이라는 것을 어렴풋이 깨달았다."
    },
    {
      id: "p3",
      text: "고등학교에 올라간 뒤 음악 시간에 교실 한쪽에 놓인 피아노를 보았다. 쉬는 시간에 뚜껑을 열고 건반을 눌러 보았더니 손가락이 제 기억을 더듬듯 움직였다. 완벽하지는 않았지만, 어린 시절 외웠던 소나티네의 첫 마디가 교실에 울려 퍼졌다. 옆에 있던 친구가 잘 치는데 왜 그만두었냐고 물었고, 나는 웃으며 대답을 얼버무렸다. 그 순간 나는 피아노가 나를 가두는 울타리가 아니라 내 안의 감정을 밖으로 꺼내 주는 창이었다는 것을 알게 되었다. 집으로 돌아와 어머니께 다시 피아노를 배우고 싶다고 말씀드렸을 때, 어머니는 환하게 웃으시며 이번에는 네가 치고 싶은 곡부터 시작하자고 하셨다. 그날 이후 나는 누가 시켜서가 아니라 내가 원해서 건반 앞에 앉게 되었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "글쓴이가 피아노 학원을 부담으로 느끼게 된 구체적인 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "매주 같은 곡을 반복하고, 선생님의 지적에 맞추어 손가락을 교정하는 시간이 즐거움보다는 부담으로 다가왔다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "피아노가 나를 가두는 울타리처럼 느껴진 상황은 어떤 때인가?",
      answerRanges: [findRange(paragraphs, "p1", "친구들이 운동장에서 뛰어노는 소리를 들으며 연습실에 앉아 있으면, 피아노가 나를 가두는 울타리처럼 느껴질 때도 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "글쓴이가 학원을 그만둔 뒤 허전함을 느끼게 된 계기는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "저녁 시간에 무엇을 해야 할지 몰라 멍하니 앉아 있는 날이 많아졌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "글쓴이가 피아노를 그만둔 진짜 이유로 깨달은 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "피아노를 좋아하는 방법을 몰랐기 때문이라는 것을 어렴풋이 깨달았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "고등학교에서 피아노를 다시 쳤을 때 글쓴이가 깨달은 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "피아노가 나를 가두는 울타리가 아니라 내 안의 감정을 밖으로 꺼내 주는 창이었다는 것을 알게 되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 다시 피아노를 시작하면서 달라진 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "누가 시켜서가 아니라 내가 원해서 건반 앞에 앉게 되었다")],
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
  console.log("=== 러셀2 Day 36~40 빌드 시작 ===\n");

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
      console.log(`교체: items[${batchIdx}] (${batchData.items[batchIdx].content.contentId} -> ${contents[i].contentId})`);
    }
    batchData.items[batchIdx] = batchItem;
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료`);

  console.log("\n=== 빌드 완료 ===");
}

main();
