#!/usr/bin/env node
// 러셀1 Day 51~55 일일독해 콘텐츠 빌더
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

// ─── Day 51: 비문학 (NONFICTION) — 지진의 원리와 대비 (지구과학) ───
function buildDay51() {
  const paragraphs = [
    {
      id: "p1",
      text: "지구의 표면은 하나로 이어진 단단한 껍데기가 아니라 여러 개의 판으로 나뉘어 있다. 이 판들을 지각판이라고 부르며, 지각판은 그 아래에 있는 뜨거운 맨틀 위에 떠서 매우 느리게 움직인다. 판과 판이 서로 밀거나 어긋나는 경계 지역에서는 엄청난 힘이 쌓인다. 이 힘이 한계를 넘으면 암석이 갑자기 부서지거나 미끄러지면서 에너지가 사방으로 퍼져 나가는데, 이것이 바로 지진이다. 지진이 처음 발생한 지점을 진원이라 하고, 진원 바로 위의 지표면 지점을 진앙이라 한다. 진앙에서 가까울수록 흔들림이 크고, 멀어질수록 점차 약해진다. 지진의 세기는 규모와 진도라는 두 가지 기준으로 나타낸다. 규모는 지진 자체가 방출한 에너지의 크기를 뜻하고, 진도는 특정 장소에서 사람이 실제로 느끼는 흔들림의 정도를 말한다."
    },
    {
      id: "p2",
      text: "지진이 발생하면 땅속에서 두 종류의 파동이 만들어진다. 먼저 도착하는 것은 P파라고 불리는 종파로, 물질을 앞뒤로 밀고 당기며 빠르게 전달된다. 이어서 도착하는 S파는 횡파로, 물질을 위아래 또는 좌우로 흔들며 P파보다 느리지만 흔들림이 더 크다. 지진 관측소에서는 P파와 S파의 도착 시간 차이를 이용하여 진앙의 위치와 거리를 계산한다. 최소 세 곳 이상의 관측소 자료를 종합하면 진앙을 정확히 파악할 수 있다. 이 원리를 삼각 측량법이라 한다. 현재 우리나라에는 전국에 약 300개가 넘는 지진 관측소가 운영되고 있어서 규모 2.0 이상의 지진은 거의 놓치지 않고 감지할 수 있다."
    },
    {
      id: "p3",
      text: "지진은 예측이 어렵기 때문에 평소에 대비 방법을 잘 알아 두는 것이 중요하다. 실내에서 지진이 발생하면 우선 튼튼한 탁자 아래로 들어가 머리와 몸을 보호해야 한다. 흔들림이 멈추면 가스 밸브를 잠그고 전기 차단기를 내린 뒤 건물 밖으로 대피한다. 엘리베이터는 절대 사용하지 말고 계단을 이용해야 한다. 야외에 있을 때에는 건물이나 담장에서 떨어져 넓은 공터로 이동한다. 평소 가정에서는 무거운 가구를 벽에 고정하고, 비상 배낭에 물과 손전등과 구급약품을 넣어 준비해 두는 것이 바람직하다. 학교에서도 정기적으로 지진 대피 훈련을 실시하여 실제 상황에서 당황하지 않도록 연습하는 것이 필요하다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "지진이 발생하는 근본적인 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "판과 판이 서로 밀거나 어긋나는 경계 지역에서는 엄청난 힘이 쌓인다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "규모와 진도의 차이점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "규모는 지진 자체가 방출한 에너지의 크기를 뜻하고, 진도는 특정 장소에서 사람이 실제로 느끼는 흔들림의 정도를 말한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "P파와 S파의 도착 시간 차이를 이용하여 알 수 있는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "P파와 S파의 도착 시간 차이를 이용하여 진앙의 위치와 거리를 계산한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "삼각 측량법이란 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "최소 세 곳 이상의 관측소 자료를 종합하면 진앙을 정확히 파악할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "실내에서 지진이 발생했을 때 가장 먼저 해야 할 행동은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "튼튼한 탁자 아래로 들어가 머리와 몸을 보호해야 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "평소 가정에서 지진에 대비하여 준비해 두어야 할 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "무거운 가구를 벽에 고정하고, 비상 배낭에 물과 손전등과 구급약품을 넣어 준비해 두는 것이 바람직하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(51, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 52: 문학 (LITERATURE) — 할아버지의 낡은 자전거 (수필) ───
function buildDay52() {
  const paragraphs = [
    {
      id: "p1",
      text: "할아버지의 자전거는 녹이 슬어 페달을 밟을 때마다 삐걱거리는 소리를 냈다. 앞바퀴 흙받이는 한쪽이 찌그러져 있었고, 안장의 가죽은 여기저기 갈라져 스펀지가 삐져나와 있었다. 마을 사람들은 새 자전거를 사시라고 말씀드렸지만 할아버지는 늘 고개를 저으셨다. 이 자전거가 젊은 시절부터 함께한 동반자라고 하셨다. 할아버지는 이 자전거를 타고 매일 아침 논과 밭을 돌아보셨다. 봄에는 묘판에 물을 댈 시기를 살피러, 여름에는 잡초가 자라지 않았는지 확인하러 논둑길을 달리셨다. 가을 수확철에는 작은 수레를 자전거 뒤에 매달아 곡식을 나르셨다. 할아버지에게 그 자전거는 교통수단이자 농사의 도구였으며, 평생을 함께한 벗이었다."
    },
    {
      id: "p2",
      text: "할아버지는 일요일마다 마당에 신문지를 펴 놓고 자전거를 손질하셨다. 체인에 기름을 치고, 브레이크 줄의 팽팽함을 확인하고, 타이어에 바람을 넣으셨다. 그 모습이 마치 오래된 친구의 안부를 살피는 것 같았다. 손질이 끝나면 할아버지는 마당 한 바퀴를 돌며 제대로 달리는지 점검하셨다. 어린 나는 할아버지 뒤에 서서 자전거가 도는 모습을 구경하는 것이 좋았다. 한번은 내가 자전거를 타 보고 싶다고 졸랐더니 할아버지는 안장 위에 나를 올려 주시고 뒤에서 잡아 주셨다. 넘어질까 무서워 핸들을 꽉 쥐었더니 할아버지가 '힘을 빼야 잘 탄다'고 웃으시며 말씀하셨다. 그날 마당에서 비틀거리며 페달을 밟던 기억이 지금도 선명하다."
    },
    {
      id: "p3",
      text: "할아버지가 돌아가신 뒤 자전거는 헛간 구석에 놓여 있었다. 아버지는 고물상에 넘기려 하셨지만 나는 사정을 해서 남겨 두었다. 몇 년 뒤 대학생이 된 나는 방학 때 고향에 내려가 그 자전거를 꺼냈다. 녹을 벗기고 체인을 갈고 타이어를 새것으로 교체하니 다시 달릴 수 있게 되었다. 할아버지가 달리시던 논둑길을 따라 페달을 밟으니 바람이 얼굴을 스쳤다. 삐걱거리는 소리는 여전했지만 그 소리가 오히려 반가웠다. 할아버지가 내 뒤에서 잡아 주시던 그 손길이 느껴지는 듯했다. 나는 그때 깨달았다. 물건에는 사람의 손때가 스며든다는 것을, 그리고 그 손때야말로 어떤 새것으로도 대신할 수 없는 가치라는 것을. 자전거는 여전히 삐걱거리며 달렸고, 그 소리는 할아버지의 목소리처럼 정겨웠다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "마을 사람들의 권유에도 할아버지가 자전거를 바꾸지 않은 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "이 자전거가 젊은 시절부터 함께한 동반자라고 하셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "할아버지에게 자전거가 지닌 역할은 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p1", "교통수단이자 농사의 도구였으며, 평생을 함께한 벗이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "할아버지가 자전거를 손질하는 모습은 무엇에 비유되었는가?",
      answerRanges: [findRange(paragraphs, "p2", "오래된 친구의 안부를 살피는 것 같았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "글쓴이가 자전거를 처음 탔을 때 할아버지가 해 주신 조언은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "힘을 빼야 잘 탄다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "글쓴이가 자전거를 수리한 뒤 삐걱거리는 소리에 대해 느낀 감정은 어떠했는가?",
      answerRanges: [findRange(paragraphs, "p3", "삐걱거리는 소리는 여전했지만 그 소리가 오히려 반가웠다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 자전거를 통해 깨달은 가치는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "물건에는 사람의 손때가 스며든다는 것을, 그리고 그 손때야말로 어떤 새것으로도 대신할 수 없는 가치라는 것을")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(52, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 53: 비문학 (NONFICTION) — 플라스틱 재활용의 과학 (환경/기술) ───
function buildDay53() {
  const paragraphs = [
    {
      id: "p1",
      text: "플라스틱은 가볍고 튼튼하며 값이 싸서 포장재, 가전제품, 건축 자재 등 거의 모든 분야에서 쓰인다. 그러나 편리함의 이면에는 심각한 환경 문제가 숨어 있다. 플라스틱은 자연 상태에서 분해되는 데 수백 년이 걸린다. 매립지에 묻혀도 썩지 않고, 바다로 흘러 들어가면 잘게 부서져 미세 플라스틱이 되어 해양 생물의 몸속으로 들어간다. 이 미세 플라스틱은 먹이 사슬을 따라 이동하여 결국 인간의 식탁 위에도 올라올 수 있다. 세계적으로 매년 약 3억 톤의 플라스틱이 생산되지만 재활용되는 양은 전체의 10퍼센트에 미치지 못한다. 나머지는 매립되거나 소각되거나 바다와 땅으로 버려진다. 이러한 현실은 플라스틱 재활용 기술의 발전이 얼마나 시급한지를 잘 보여 준다."
    },
    {
      id: "p2",
      text: "플라스틱 재활용에는 크게 기계적 재활용과 화학적 재활용 두 가지 방법이 있다. 기계적 재활용은 사용한 플라스틱을 잘게 분쇄하여 세척한 뒤 녹여서 새로운 제품으로 만드는 방식이다. 이 방법은 비용이 적게 들지만, 재활용을 반복할수록 플라스틱의 강도와 투명도가 떨어지는 단점이 있다. 따라서 음료수 병이 다시 음료수 병으로 재활용되기보다는 화분이나 벤치 같은 등급이 낮은 제품으로 바뀌는 경우가 많다. 화학적 재활용은 플라스틱을 원래의 단량체나 기름 상태로 되돌리는 기술이다. 열분해 방식이 대표적인데, 산소가 없는 환경에서 플라스틱을 고온으로 가열하면 분자 결합이 끊어지면서 석유와 비슷한 액체 연료가 만들어진다. 이 연료를 다시 정제하면 새 플라스틱의 원료로 사용할 수 있어서 이론적으로는 무한 재활용이 가능하다."
    },
    {
      id: "p3",
      text: "그러나 재활용 기술만으로는 플라스틱 문제를 완전히 해결하기 어렵다. 재활용의 첫 단계는 정확한 분리배출이다. 플라스틱에는 종류를 나타내는 삼각형 표시와 숫자가 있는데, 이를 확인하여 같은 종류끼리 분리해야 재활용 효율이 높아진다. 음식물이 묻은 채로 버리면 세척 비용이 증가하고 재활용률이 떨어진다. 무엇보다 중요한 것은 플라스틱 사용량 자체를 줄이는 것이다. 장바구니를 사용하여 일회용 비닐봉지를 줄이고, 텀블러를 가지고 다니며 일회용 컵 사용을 자제하는 작은 실천이 모이면 큰 변화를 만들 수 있다. 과학 기술의 발전과 함께 개인의 실천이 뒷받침될 때 비로소 플라스틱 문제의 해결에 한 걸음 다가갈 수 있을 것이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "미세 플라스틱이 인간에게 영향을 미치는 경로는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "미세 플라스틱은 먹이 사슬을 따라 이동하여 결국 인간의 식탁 위에도 올라올 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "전 세계 플라스틱 재활용률은 어느 정도인가?",
      answerRanges: [findRange(paragraphs, "p1", "재활용되는 양은 전체의 10퍼센트에 미치지 못한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "기계적 재활용의 한계는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "재활용을 반복할수록 플라스틱의 강도와 투명도가 떨어지는 단점이 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "화학적 재활용의 열분해 방식은 어떻게 작동하는가?",
      answerRanges: [findRange(paragraphs, "p2", "산소가 없는 환경에서 플라스틱을 고온으로 가열하면 분자 결합이 끊어지면서 석유와 비슷한 액체 연료가 만들어진다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "플라스틱 분리배출 시 주의할 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "음식물이 묻은 채로 버리면 세척 비용이 증가하고 재활용률이 떨어진다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "플라스틱 문제 해결을 위해 가장 중요한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "과학 기술의 발전과 함께 개인의 실천이 뒷받침될 때 비로소 플라스틱 문제의 해결에 한 걸음 다가갈 수 있을 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(53, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 54: 문학 (LITERATURE) — 전학 온 날의 우정 (소설) ───
function buildDay54() {
  const paragraphs = [
    {
      id: "p1",
      text: "새 학기 첫날, 수빈이는 교실 문 앞에서 한참을 서 있었다. 전학생이라는 딱지가 붙으면 모두가 자기를 쳐다본다는 것을 경험으로 알고 있었다. 지난 학교에서도 그랬고, 그전 학교에서도 그랬다. 아버지의 잦은 전근 때문에 수빈이는 초등학교 때부터 네 번이나 학교를 옮겼다. 새로운 교실에 들어갈 때마다 낯선 얼굴들 사이에서 자리를 찾아 앉는 일이 제일 두려웠다. 담임 선생님이 수빈이를 교탁 앞에 세우고 자기소개를 시켰다. 수빈이는 떨리는 목소리로 이름과 전학 온 이유를 말했다. 교실은 조용했고, 서른 명의 시선이 수빈이의 얼굴에 꽂혔다. 선생님이 지정해 준 자리는 창가 맨 뒷줄이었다. 옆자리는 비어 있었다."
    },
    {
      id: "p2",
      text: "쉬는 시간에도 아무도 말을 걸지 않았다. 수빈이는 교과서를 펴 놓고 읽는 척하며 시간을 보냈다. 점심시간이 되자 아이들은 삼삼오오 무리를 지어 급식실로 갔다. 수빈이는 혼자 식판을 들고 빈 자리를 찾았다. 그때 뒤에서 누군가 식판을 옆에 놓으며 말했다. '같이 먹어도 돼?' 돌아보니 같은 반 남학생이 서 있었다. 이름은 정우라고 했다. 정우는 밥을 먹으며 반 아이들의 특징을 하나하나 알려 주었다. 누가 축구를 좋아하고, 누가 공부를 잘하며, 누구를 조심해야 하는지 웃으며 이야기했다. 수빈이는 처음으로 긴장이 풀리며 웃음이 나왔다. 정우가 건네준 그 한마디가 낯선 교실을 조금 덜 무섭게 만들어 주었다."
    },
    {
      id: "p3",
      text: "며칠이 지나자 수빈이와 정우는 함께 다니기 시작했다. 정우는 수빈이에게 학교 곳곳을 안내해 주었고, 도서관에서 좋아하는 만화책을 추천해 주기도 했다. 수빈이는 수학을 잘했기 때문에 정우의 수학 숙제를 도와주었다. 서로 잘하는 것이 달랐기에 둘은 자연스럽게 서로를 돕게 되었다. 한 달이 지날 무렵 정우가 수빈이에게 말했다. '너 왜 처음에 그렇게 긴장했어? 나도 3학년 때 전학 왔거든. 그때 아무도 말 안 걸어 줘서 일주일 내내 혼자 밥 먹었어.' 수빈이는 그제야 정우가 먼저 다가와 준 이유를 이해했다. 자기가 겪었던 외로움을 알기 때문에 정우는 새로운 전학생에게 손을 내밀어 준 것이었다. 수빈이는 마음속으로 다짐했다. 다음에 또 새로운 친구가 오면 자기가 먼저 다가가겠다고."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "수빈이가 새 학교에 가는 것을 두려워한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "낯선 얼굴들 사이에서 자리를 찾아 앉는 일이 제일 두려웠다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "수빈이가 여러 번 전학을 다니게 된 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "아버지의 잦은 전근 때문에")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "정우가 수빈이에게 처음 건넨 말은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "같이 먹어도 돼?")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "정우의 한마디가 수빈이에게 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "정우가 건네준 그 한마디가 낯선 교실을 조금 덜 무섭게 만들어 주었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "정우가 수빈이에게 먼저 다가간 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "자기가 겪었던 외로움을 알기 때문에 정우는 새로운 전학생에게 손을 내밀어 준 것이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "수빈이가 마음속으로 다짐한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "다음에 또 새로운 친구가 오면 자기가 먼저 다가가겠다고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(54, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 55: 비문학 (NONFICTION) — 한글의 과학적 원리 (국어/역사) ───
function buildDay55() {
  const paragraphs = [
    {
      id: "p1",
      text: "한글은 1443년 세종대왕이 창제하고 1446년에 반포한 문자이다. 한글이 만들어지기 전에는 한자를 빌려 사용했는데, 한자는 수천 개의 글자를 외워야 해서 배우기 어려웠다. 백성 대다수가 글을 읽고 쓸 수 없는 현실이 세종대왕의 마음을 아프게 했다. 세종대왕은 누구나 쉽게 배울 수 있는 문자를 만들고자 했으며, 그 결과 탄생한 것이 훈민정음이다. 훈민정음은 '백성을 가르치는 바른 소리'라는 뜻이다. 한글의 가장 큰 특징은 소리를 내는 원리에 따라 글자의 모양을 설계했다는 점이다. 발음할 때 혀와 입술과 목구멍의 모양을 본떠 자음 글자를 만들었다. 'ㄱ'은 혀뿌리가 목구멍을 막는 모양을, 'ㄴ'은 혀끝이 윗잇몸에 닿는 모양을 형상화한 것이다."
    },
    {
      id: "p2",
      text: "한글의 자음은 기본 다섯 글자에서 획을 더하는 체계적 방식으로 만들어졌다. 'ㄱ'에 획을 더하면 'ㅋ'이 되고, 'ㄴ'에 획을 더하면 'ㄷ'이 되며, 'ㄷ'에 다시 획을 더하면 'ㅌ'이 된다. 획이 추가될수록 소리가 세지는 규칙이 적용되어 있어서, 모양만 봐도 소리의 세기를 짐작할 수 있다. 모음은 하늘을 상징하는 점, 땅을 상징하는 가로획, 사람을 상징하는 세로획을 조합하여 만들었다. 'ㅏ'는 세로획 오른쪽에 점을 찍은 것이고, 'ㅓ'는 세로획 왼쪽에 점을 찍은 것이다. 이 간결한 원리 덕분에 한글은 열네 개의 자음과 열 개의 모음만으로 거의 모든 한국어 소리를 표현할 수 있다. 외국 학자들도 한글의 체계적 구조를 높이 평가하여 세계에서 가장 과학적인 문자 중 하나로 꼽고 있다."
    },
    {
      id: "p3",
      text: "한글의 또 다른 뛰어난 점은 글자의 조합 방식에 있다. 한글은 자음과 모음을 가로로 나열하지 않고 모아쓰기를 한다. '한'이라는 글자는 자음 'ㅎ', 모음 'ㅏ', 받침 'ㄴ'을 하나의 네모꼴 안에 모아서 쓴다. 이 모아쓰기 덕분에 글자 하나가 하나의 음절을 나타내어 읽기 속도가 빨라진다. 알파벳처럼 글자를 일렬로 나열하면 한눈에 파악하기 어렵지만, 한글은 음절 단위로 묶여 있어 시각적으로 단어를 빠르게 인식할 수 있다. 오늘날 한글은 정보화 시대에도 유용한 문자로 인정받고 있다. 자음과 모음의 조합 규칙이 명확하기 때문에 컴퓨터와 스마트폰에서의 입력이 효율적이다. 세종대왕이 약 580년 전에 설계한 문자가 디지털 환경에서도 뛰어난 경쟁력을 발휘한다는 사실은 그 설계 원리가 얼마나 훌륭한지를 보여 준다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "세종대왕이 한글을 만들게 된 동기는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "백성 대다수가 글을 읽고 쓸 수 없는 현실이 세종대왕의 마음을 아프게 했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "한글 자음 글자의 모양은 무엇을 본떠 만들었는가?",
      answerRanges: [findRange(paragraphs, "p1", "발음할 때 혀와 입술과 목구멍의 모양을 본떠 자음 글자를 만들었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "자음에 획이 추가될 때 적용되는 규칙은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "획이 추가될수록 소리가 세지는 규칙이 적용되어 있어서")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "한글 모음을 구성하는 세 가지 요소는 무엇을 상징하는가?",
      answerRanges: [findRange(paragraphs, "p2", "하늘을 상징하는 점, 땅을 상징하는 가로획, 사람을 상징하는 세로획")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "한글의 모아쓰기 방식이 갖는 장점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "음절 단위로 묶여 있어 시각적으로 단어를 빠르게 인식할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "한글이 정보화 시대에도 유용한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "자음과 모음의 조합 규칙이 명확하기 때문에 컴퓨터와 스마트폰에서의 입력이 효율적이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(55, "NONFICTION", "비문학", paragraphs, confirmQuestions);
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
  console.log("=== 러셀1 Day 51~55 빌드 시작 ===\n");

  const contents = [
    buildDay51(),
    buildDay52(),
    buildDay53(),
    buildDay54(),
    buildDay55()
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

  // 배치 파일 갱신 (items[50]~items[54])
  console.log("\n배치 파일 갱신 중...");
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`현재 배치 items 수: ${batchData.items.length}`);

  const dayIndices = [51, 52, 53, 54, 55];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1; // items[50]~items[54]
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
