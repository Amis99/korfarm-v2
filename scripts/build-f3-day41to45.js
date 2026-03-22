#!/usr/bin/env node
// 프레게3 Day 41~45 일일독해 콘텐츠 빌더
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

// ─── Day 41: 비문학 (NONFICTION) — 날씨와 기후의 차이 (지구과학) ───
function buildDay41() {
  const paragraphs = [
    {
      id: "p1",
      text: "날씨와 기후는 비슷해 보이지만 뜻이 서로 다르다. 날씨는 어느 특정한 날이나 며칠 사이에 나타나는 대기의 상태를 가리킨다. 오늘 아침 기온이 영하 3도이고 눈이 내린다면, 그것이 바로 오늘의 날씨이다. 반면 기후는 한 지역에서 오랜 세월 동안 반복되어 나타나는 대기의 평균적인 특징을 말한다. 예를 들어 서울의 여름은 덥고 습하며 겨울은 춥고 건조하다는 것은 수십 년간 관측한 자료를 바탕으로 정리한 기후 정보이다. 따라서 날씨는 매일 바뀔 수 있지만, 기후는 쉽게 달라지지 않는다. 날씨 예보가 내일의 비와 바람을 알려 주는 것이라면, 기후 보고서는 몇십 년 동안 쌓인 자료를 분석하여 한 지역의 기상 특성을 설명해 주는 것이다."
    },
    {
      id: "p2",
      text: "날씨가 만들어지는 과정을 이해하려면 대기의 움직임을 알아야 한다. 태양 에너지가 지표면을 고르지 않게 데우면 공기의 온도 차이가 생긴다. 따뜻한 공기는 가벼워져서 위로 올라가고, 차가운 공기는 아래로 내려오면서 바람이 생긴다. 이 과정에서 수증기가 높은 곳으로 올라가 차가워지면 구름이 되고, 구름 속 물방울이 커지면 비나 눈으로 땅에 떨어진다. 이렇게 공기의 이동과 수증기의 변화가 합쳐져서 맑음, 흐림, 비, 눈 같은 다양한 날씨 현상이 나타나는 것이다. 기상청에서는 인공위성과 기상 관측 장비를 이용하여 대기의 상태를 실시간으로 파악하고, 이를 바탕으로 앞으로의 날씨를 예측한다."
    },
    {
      id: "p3",
      text: "최근 들어 기후가 빠르게 변하고 있다는 이야기를 자주 듣는다. 공장이나 자동차에서 이산화 탄소와 같은 온실 가스가 많이 배출되면, 지구를 둘러싼 대기가 열을 가두는 힘이 강해진다. 그 결과 지구의 평균 기온이 조금씩 올라가는데, 이를 지구 온난화라고 한다. 지구 온난화가 진행되면 극지방의 빙하가 녹아 바닷물 높이가 올라가고, 폭염이나 집중 호우 같은 극단적인 날씨가 잦아진다. 이처럼 기후 변화는 단순히 기온이 오르는 것에 그치지 않고, 생태계와 사람들의 생활 전체에 큰 영향을 끼친다. 따라서 우리는 에너지를 절약하고 온실 가스 배출을 줄이는 노력을 해야 한다. 날씨와 기후의 차이를 이해하면 기후 변화 문제가 왜 중요한지 더 잘 알 수 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "날씨와 기후의 가장 큰 차이점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "날씨는 매일 바뀔 수 있지만, 기후는 쉽게 달라지지 않는다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "기후 정보는 어떤 자료를 바탕으로 정리되는가?",
      answerRanges: [findRange(paragraphs, "p1", "수십 년간 관측한 자료를 바탕으로 정리한 기후 정보이다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "바람이 생기는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "따뜻한 공기는 가벼워져서 위로 올라가고, 차가운 공기는 아래로 내려오면서 바람이 생긴다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "구름이 만들어지는 과정은 어떠한가?",
      answerRanges: [findRange(paragraphs, "p2", "수증기가 높은 곳으로 올라가 차가워지면 구름이 되고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "지구 온난화가 진행되면 어떤 현상이 일어나는가?",
      answerRanges: [findRange(paragraphs, "p3", "극지방의 빙하가 녹아 바닷물 높이가 올라가고, 폭염이나 집중 호우 같은 극단적인 날씨가 잦아진다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "기후 변화가 미치는 영향의 범위는 어디까지인가?",
      answerRanges: [findRange(paragraphs, "p3", "기후 변화는 단순히 기온이 오르는 것에 그치지 않고, 생태계와 사람들의 생활 전체에 큰 영향을 끼친다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(41, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 42: 문학 (LITERATURE) — 친구와 함께한 캠핑 모험 (생활문) ───
function buildDay42() {
  const paragraphs = [
    {
      id: "p1",
      text: "여름 방학이 시작되자마자 나는 민호와 함께 캠핑을 떠났다. 아빠의 차 뒷좌석에는 텐트와 침낭, 간식이 가득 실려 있었다. 창밖으로 초록빛 나무들이 빠르게 지나가는 동안 우리는 밤에 무엇을 할지 신나게 이야기했다. 캠핑장에 도착하자 시원한 바람이 불었고, 흙냄새와 풀냄새가 코끝을 간질였다. 우리는 서둘러 텐트를 세우기 시작했지만 처음 해 보는 일이라 기둥이 자꾸 쓰러졌다. 아빠가 웃으며 도와주셔서 겨우 텐트가 완성되었고, 우리는 환호하며 안으로 들어가 누워 보았다. 텐트 천 너머로 햇빛이 은은하게 비추었고, 여기가 우리만의 비밀 기지라는 생각이 들어 기분이 좋았다."
    },
    {
      id: "p2",
      text: "해가 저물자 캠핑장의 분위기가 완전히 달라졌다. 여기저기서 모닥불이 피어올랐고, 고기 굽는 냄새가 바람을 타고 흘러왔다. 우리도 아빠와 함께 숯불을 피우고 고구마와 소시지를 구워 먹었다. 갓 구운 고구마는 속이 노랗고 달콤했으며 손으로 까서 호호 불며 먹는 맛이 일품이었다. 식사를 마친 뒤 민호가 손전등을 가져와서 둘이서 캠핑장 뒤편의 작은 숲길을 탐험하기로 했다. 어두운 숲속에서 풀벌레 소리가 사방에서 들렸고, 나뭇잎 사이로 별빛이 살짝 보였다. 무섭기도 했지만 친구가 옆에 있으니 용기가 났다. 숲길 끝에서 본 개울물이 달빛에 반짝이는 모습은 오래도록 잊히지 않을 장면이었다."
    },
    {
      id: "p3",
      text: "텐트로 돌아와 침낭 속에 나란히 누우니 밤하늘의 별이 셀 수 없이 많았다. 도시에서는 볼 수 없었던 은하수가 하늘을 가로질러 흐르고 있었다. 민호가 별자리를 찾아 보겠다며 손가락으로 하늘을 가리켰고, 나도 따라서 북두칠성을 찾아보았다. 밤공기는 차가웠지만 침낭이 따뜻하여 기분 좋게 이야기를 나눌 수 있었다. 우리는 내년 여름에도 꼭 다시 오자고 약속했다. 잠이 들기 전 텐트 밖에서 부엉이 울음소리가 들렸고, 그 소리가 자장가처럼 포근하게 느껴졌다. 다음 날 아침 새소리에 눈을 떴을 때, 이번 캠핑이 내 생애 가장 행복한 여름 추억이 되었다는 것을 깨달았다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "캠핑장에 도착했을 때 느낀 자연의 감각은 무엇이었나?",
      answerRanges: [findRange(paragraphs, "p1", "시원한 바람이 불었고, 흙냄새와 풀냄새가 코끝을 간질였다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "텐트를 세울 때 어려움을 겪은 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "처음 해 보는 일이라 기둥이 자꾸 쓰러졌다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "어두운 숲속에서 용기를 낼 수 있었던 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "무섭기도 했지만 친구가 옆에 있으니 용기가 났다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "숲길 끝에서 본 인상 깊은 장면은 무엇이었나?",
      answerRanges: [findRange(paragraphs, "p2", "개울물이 달빛에 반짝이는 모습은 오래도록 잊히지 않을 장면이었다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "도시와 달리 캠핑장 밤하늘에서 볼 수 있었던 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "도시에서는 볼 수 없었던 은하수가 하늘을 가로질러 흐르고 있었다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 이번 캠핑에 대해 내린 결론은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "이번 캠핑이 내 생애 가장 행복한 여름 추억이 되었다는 것을 깨달았다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(42, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 43: 비문학 (NONFICTION) — 전기가 만들어지는 과정 (기술/과학) ───
function buildDay43() {
  const paragraphs = [
    {
      id: "p1",
      text: "우리가 매일 쓰는 전기는 발전소에서 만들어진다. 발전소에서 전기를 만드는 기본 원리는 자석과 구리 코일의 관계에 있다. 자석 가까이에서 구리 코일을 빠르게 돌리면 코일 속에 전류가 흐르는데, 이것을 전자기 유도라고 한다. 이 원리를 발견한 사람은 영국의 과학자 패러데이이다. 발전소는 이 원리를 크게 확대하여 거대한 발전기를 돌림으로써 많은 양의 전기를 생산한다. 문제는 발전기를 돌리는 힘을 어디서 얻느냐 하는 것이다. 석탄이나 천연가스를 태워 증기를 만들고, 그 증기의 힘으로 터빈을 돌려 발전기를 작동시키는 방식을 화력 발전이라고 한다. 원자력 발전도 원리는 비슷하지만, 핵분열 에너지로 증기를 만든다는 점이 다르다."
    },
    {
      id: "p2",
      text: "최근에는 환경 오염을 줄이기 위해 재생 에너지를 이용한 발전 방식이 주목받고 있다. 태양광 발전은 햇빛이 태양 전지판에 닿으면 전기가 직접 만들어지는 방식이다. 풍력 발전은 바람이 거대한 날개를 돌리고, 그 회전력으로 발전기를 작동시킨다. 수력 발전은 높은 곳에서 떨어지는 물의 힘으로 터빈을 돌려 전기를 얻는다. 이러한 재생 에너지는 연료를 태우지 않으므로 온실 가스가 거의 나오지 않는다는 장점이 있다. 하지만 태양광은 흐린 날이나 밤에는 전기를 만들 수 없고, 풍력은 바람이 불지 않으면 발전할 수 없다는 한계가 있다. 그래서 과학자들은 전기를 효율적으로 저장하는 배터리 기술을 함께 발전시키고 있다."
    },
    {
      id: "p3",
      text: "발전소에서 만들어진 전기는 송전탑과 전선을 통해 우리 집까지 전달된다. 이때 전기를 멀리 보내려면 전압을 아주 높여야 한다. 전압이 낮으면 전기가 이동하는 동안 열로 바뀌어 많은 양이 사라지기 때문이다. 그래서 발전소에서 나온 전기는 변전소에서 수십만 볼트로 전압을 높인 뒤 먼 거리를 이동한다. 우리 동네에 도착하면 또 다른 변전소에서 전압을 낮추어 가정에서 안전하게 쓸 수 있는 220볼트로 바꾸어 준다. 이처럼 전기가 발전소에서 콘센트까지 오는 길은 여러 단계를 거치며, 각 단계에서 전압을 적절히 조절하는 기술이 중요하다. 우리가 스위치 하나로 불을 켤 수 있는 것은 이 복잡한 과정이 눈에 보이지 않게 작동하고 있기 때문이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "전자기 유도란 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "자석 가까이에서 구리 코일을 빠르게 돌리면 코일 속에 전류가 흐르는데, 이것을 전자기 유도라고 한다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "화력 발전에서 발전기를 돌리는 과정은 어떠한가?",
      answerRanges: [findRange(paragraphs, "p1", "석탄이나 천연가스를 태워 증기를 만들고, 그 증기의 힘으로 터빈을 돌려 발전기를 작동시키는 방식을 화력 발전이라고 한다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "재생 에너지가 환경에 좋은 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "연료를 태우지 않으므로 온실 가스가 거의 나오지 않는다는 장점이 있다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "재생 에너지의 한계를 보완하기 위해 발전시키고 있는 기술은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "과학자들은 전기를 효율적으로 저장하는 배터리 기술을 함께 발전시키고 있다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "전기를 멀리 보낼 때 전압을 높여야 하는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "전압이 낮으면 전기가 이동하는 동안 열로 바뀌어 많은 양이 사라지기 때문이다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "전기가 발전소에서 가정까지 오는 과정에서 중요한 기술은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "각 단계에서 전압을 적절히 조절하는 기술이 중요하다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(43, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 44: 문학 (LITERATURE) — 눈 내리는 날의 기억 (수필) ───
function buildDay44() {
  const paragraphs = [
    {
      id: "p1",
      text: "겨울이 되면 나는 초등학교 시절 처음 눈을 맞았던 아침을 떠올린다. 그날 아침 커튼을 열자마자 온 세상이 하얗게 변해 있었다. 지붕 위에도, 골목길에도, 학교 운동장에도 눈이 소복하게 쌓여 있었다. 아직 아무도 밟지 않은 눈밭은 마치 커다란 하얀 도화지 같았다. 나는 서둘러 신발을 신고 뛰어나가 가장 먼저 발자국을 찍고 싶었다. 현관문을 열고 나서자 차가운 겨울 공기가 얼굴을 감쌌고, 발밑에서 뽀드득 소리가 났다. 그 감촉과 소리가 너무 신기해서 한참 동안 같은 자리를 왔다 갔다 했다. 하늘에서 천천히 내려오는 눈송이를 손바닥에 받아 보았는데, 눈 결정이 별 모양인 것을 처음 알았다."
    },
    {
      id: "p2",
      text: "학교에 가니 친구들도 모두 들뜬 표정이었다. 쉬는 시간이 되자 우리는 운동장으로 쏟아져 나가 눈싸움을 시작했다. 장갑이 금세 젖었지만 아무도 신경 쓰지 않았다. 민수가 던진 눈덩이가 내 등에 맞았을 때 차갑기는 했지만 웃음이 터져 나왔다. 눈사람도 하나 만들었는데, 코에는 당근 대신 나뭇가지를 꽂았고, 눈에는 작은 조약돌을 붙였다. 완성된 눈사람은 좀 삐뚤었지만 우리 모두의 작품이라 뿌듯했다. 선생님께서는 교실 창문 너머로 우리를 바라보시며 웃고 계셨다. 그 미소가 추운 날씨를 잊게 해 줄 만큼 따뜻하게 느껴졌다."
    },
    {
      id: "p3",
      text: "집에 돌아오니 어머니께서 따뜻한 팥죽을 끓여 놓으셨다. 차가워진 손을 그릇에 대고 있으면 손끝부터 천천히 온기가 퍼져 나왔다. 팥죽 한 숟갈을 입에 넣으니 달콤하고 구수한 맛이 온몸에 퍼졌다. 어머니께서는 내 빨개진 코를 보시며 감기 걸리겠다고 걱정하셨지만, 표정은 오히려 즐거워 보이셨다. 저녁에 창밖을 내다보니 가로등 아래에서 눈이 계속 내리고 있었다. 불빛에 비친 눈송이들이 마치 작은 별들이 내려오는 것 같았다. 그날 밤 이불 속에 누워서 나는 내일도 눈이 오면 좋겠다고 생각했다. 지금 돌이켜 보면, 그 겨울날의 기억이 따뜻하게 남아 있는 것은 함께했던 사람들 때문이라는 것을 알게 되었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "아직 아무도 밟지 않은 눈밭을 글쓴이는 무엇에 비유했나?",
      answerRanges: [findRange(paragraphs, "p1", "아직 아무도 밟지 않은 눈밭은 마치 커다란 하얀 도화지 같았다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "눈을 밟았을 때 글쓴이가 느낀 감각은 무엇이었나?",
      answerRanges: [findRange(paragraphs, "p1", "발밑에서 뽀드득 소리가 났다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "완성된 눈사람을 보고 뿌듯했던 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "좀 삐뚤었지만 우리 모두의 작품이라 뿌듯했다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "선생님의 미소가 글쓴이에게 어떤 느낌을 주었나?",
      answerRanges: [findRange(paragraphs, "p2", "추운 날씨를 잊게 해 줄 만큼 따뜻하게 느껴졌다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "가로등 아래 눈송이를 글쓴이는 무엇에 비유했나?",
      answerRanges: [findRange(paragraphs, "p3", "불빛에 비친 눈송이들이 마치 작은 별들이 내려오는 것 같았다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 겨울날의 기억이 따뜻하게 남아 있는 이유로 깨달은 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "그 겨울날의 기억이 따뜻하게 남아 있는 것은 함께했던 사람들 때문이라는 것을 알게 되었다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(44, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 45: 비문학 (NONFICTION) — 곤충의 변태 과정 (생물학) ───
function buildDay45() {
  const paragraphs = [
    {
      id: "p1",
      text: "곤충은 자라면서 몸의 모양이 크게 바뀌는데, 이러한 현상을 변태라고 한다. 변태는 크게 완전 변태와 불완전 변태로 나뉜다. 완전 변태는 알, 애벌레, 번데기, 어른벌레의 네 단계를 거치는 것이다. 나비와 장수풍뎅이, 벌, 개미 등이 완전 변태를 하는 대표적인 곤충이다. 애벌레 시절의 모습과 어른벌레의 모습이 완전히 다른 것이 특징이다. 예를 들어 나비의 애벌레인 배추흰나비 유충은 초록색 벌레 모양이지만, 번데기를 거쳐 나오면 날개가 달린 아름다운 나비로 변한다. 이렇게 몸 구조가 완전히 바뀌는 과정은 자연의 놀라운 비밀 가운데 하나이다."
    },
    {
      id: "p2",
      text: "반면 불완전 변태는 번데기 단계 없이 알에서 깨어난 애벌레가 조금씩 자라면서 어른벌레가 되는 과정이다. 메뚜기, 매미, 잠자리 등이 이에 해당한다. 메뚜기의 경우 알에서 나온 작은 메뚜기는 날개가 없지만, 허물을 여러 차례 벗으며 자라면서 점점 날개가 커진다. 이렇게 허물을 벗는 것을 탈피라고 하는데, 곤충의 몸을 감싸고 있는 딱딱한 껍질인 외골격은 늘어나지 않기 때문에 몸이 자라려면 껍질을 벗어야 한다. 탈피 직후의 곤충은 새 껍질이 아직 굳지 않아서 몸이 물렁물렁하고 약한 상태이다. 이 시기에 곤충은 천적에게 잡히기 쉬우므로 안전한 장소에 숨어서 껍질이 단단해지기를 기다린다."
    },
    {
      id: "p3",
      text: "곤충이 변태를 하는 이유는 생존에 유리하기 때문이다. 완전 변태를 하는 곤충은 애벌레 시절과 어른벌레 시절에 먹는 먹이가 다르다. 나비의 애벌레는 식물의 잎을 먹지만, 어른 나비는 꽃의 꿀을 빨아 먹는다. 이렇게 하면 같은 종이라도 서로 다른 먹이를 먹으므로 먹이 경쟁을 피할 수 있다. 또한 번데기 단계에서는 움직이지 않고 에너지를 아끼면서 몸 속 기관을 새롭게 만들기 때문에 효율적이다. 불완전 변태를 하는 곤충 역시 탈피를 통해 점점 커지면서 환경에 적응한다. 곤충의 변태는 한정된 자원 속에서 살아남기 위한 진화의 결과이며, 이 덕분에 곤충은 지구상에서 가장 종류가 다양한 동물 집단이 될 수 있었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "완전 변태의 네 단계는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "알, 애벌레, 번데기, 어른벌레의 네 단계를 거치는 것이다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "완전 변태를 하는 곤충의 특징은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "애벌레 시절의 모습과 어른벌레의 모습이 완전히 다른 것이 특징이다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "곤충이 허물을 벗어야 하는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "곤충의 몸을 감싸고 있는 딱딱한 껍질인 외골격은 늘어나지 않기 때문에 몸이 자라려면 껍질을 벗어야 한다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "탈피 직후 곤충이 숨는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "이 시기에 곤충은 천적에게 잡히기 쉬우므로 안전한 장소에 숨어서 껍질이 단단해지기를 기다린다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "완전 변태가 먹이 경쟁에 유리한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "같은 종이라도 서로 다른 먹이를 먹으므로 먹이 경쟁을 피할 수 있다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "곤충의 변태가 진화적으로 중요한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "곤충의 변태는 한정된 자원 속에서 살아남기 위한 진화의 결과이며, 이 덕분에 곤충은 지구상에서 가장 종류가 다양한 동물 집단이 될 수 있었다.")],
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
  console.log("=== 프레게3 Day 41~45 빌드 시작 ===\n");

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
