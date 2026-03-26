#!/usr/bin/env node
// 러셀3 Day 31~35 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION, 짝수 Day = LITERATURE
// 목표 글자수: 1300자 ±50 (1250~1350)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-russell3.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/russell3');

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

// ─── Day 31: 비문학 (NONFICTION) — 뇌의 가소성과 학습 ───
function buildDay31() {
  const paragraphs = [
    {
      id: "p1",
      text: "뇌의 가소성은 신경계가 경험과 환경에 반응하여 구조적·기능적으로 변화할 수 있는 능력을 말한다. 과거에는 뇌의 구조가 성인기에 접어들면 고정된다고 여겨졌으나, 현대 신경과학은 뇌가 평생에 걸쳐 변화할 수 있음을 밝혀냈다. 이러한 가소성의 핵심 기제는 시냅스 가소성으로, 뉴런 간 연결 강도가 반복적 자극에 의해 강화되거나 약화되는 현상이다. 캐나다의 신경심리학자 도널드 헵은 함께 발화하는 뉴런은 함께 연결된다는 원리를 제안하였으며, 이는 학습과 기억의 신경학적 기반을 설명하는 핵심 이론이 되었다."
    },
    {
      id: "p2",
      text: "학습 과정에서 뇌의 가소성은 구체적으로 어떻게 작동하는가. 새로운 지식이나 기술을 반복적으로 연습하면 해당 활동에 관여하는 신경 회로의 시냅스 연결이 강화되며, 이 과정을 장기 강화라 부른다. 런던 택시 운전사들을 대상으로 한 연구에서는 복잡한 도시 구조를 암기한 운전사들의 해마 후부가 일반인보다 유의미하게 더 큰 것으로 나타났다. 이는 공간 기억의 반복적 사용이 뇌의 해당 영역을 물리적으로 확장시킬 수 있음을 보여 주는 증거이다. 또한 음악가의 청각 피질과 운동 피질이 비음악가에 비해 더 발달해 있다는 연구 결과도 동일한 원리를 뒷받침한다. 이러한 발견들은 뇌가 수동적으로 정보를 수용하는 기관이 아니라, 사용 방식에 따라 능동적으로 재구성되는 역동적 기관임을 시사한다."
    },
    {
      id: "p3",
      text: "그러나 뇌의 가소성에는 중요한 제약이 존재한다. 결정적 시기라 불리는 특정 발달 단계에서 뇌는 특정 유형의 자극에 대해 최대의 가소성을 보이며, 이 시기가 지나면 해당 영역의 가소적 변화가 현저히 어려워진다. 예를 들어 언어 습득의 결정적 시기는 대체로 만 열두 살 이전으로 알려져 있으며, 이 시기를 놓치면 모국어 수준의 언어 능력을 갖추기가 매우 어렵다. 시각 발달 역시 생후 초기에 적절한 시각적 자극을 받지 못하면 정상적인 시력 형성이 불가능하다. 또한 부정적 경험도 뇌를 변화시킬 수 있는데, 만성적 스트레스는 편도체를 비대하게 만들고 전전두엽 피질의 기능을 저하시켜 감정 조절 능력에 부정적 영향을 미친다."
    },
    {
      id: "p4",
      text: "뇌 가소성에 대한 이해는 교육과 재활 분야에 실질적인 변화를 가져왔다. 뇌졸중으로 인해 특정 뇌 영역이 손상된 환자가 집중적인 재활 훈련을 통해 손상된 기능을 부분적으로 회복하는 것은 가소성의 대표적 임상 사례이다. 이때 손상되지 않은 인접 영역의 뉴런이 손상된 영역의 기능을 일부 대행하도록 재편되는 것이 회복의 핵심 원리이다. 교육 분야에서도 반복 학습과 분산 학습이 시냅스 연결을 강화한다는 근거에 기반하여 효과적인 학습 전략이 설계되고 있다. 다만 뇌 가소성 연구가 뇌 훈련 프로그램의 과장된 상업적 주장에 악용되는 사례도 있어, 과학적 근거에 기반한 비판적 수용이 필요하다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "시냅스 가소성이란 구체적으로 어떤 현상을 가리키는가?",
      answerRanges: [findRange(paragraphs, "p1", "뉴런 간 연결 강도가 반복적 자극에 의해 강화되거나 약화되는 현상이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "런던 택시 운전사 연구가 뇌 가소성에 대해 보여 주는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "공간 기억의 반복적 사용이 뇌의 해당 영역을 물리적으로 확장시킬 수 있음을 보여 주는 증거이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "결정적 시기가 지나면 뇌에 어떤 변화가 생기는가?",
      answerRanges: [findRange(paragraphs, "p3", "이 시기가 지나면 해당 영역의 가소적 변화가 현저히 어려워진다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "만성적 스트레스가 뇌에 미치는 부정적 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "편도체를 비대하게 만들고 전전두엽 피질의 기능을 저하시켜 감정 조절 능력에 부정적 영향을 미친다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "뇌 가소성이 교육 분야에서 활용되는 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "반복 학습과 분산 학습이 시냅스 연결을 강화한다는 근거에 기반하여 효과적인 학습 전략이 설계되고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "뇌 가소성 연구와 관련하여 경계해야 할 문제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "뇌 훈련 프로그램의 과장된 상업적 주장에 악용되는 사례도 있어, 과학적 근거에 기반한 비판적 수용이 필요하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(31, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 32: 문학 (LITERATURE) — 전쟁터에서 돌아온 형 ───
function buildDay32() {
  const paragraphs = [
    {
      id: "p1",
      text: "형이 돌아온 것은 매화가 피기 시작하던 이른 봄이었다. 삼 년 만의 귀환이었으나 형의 모습은 내가 기억하던 것과 너무 달라져 있었다. 한쪽 소매가 텅 빈 군복 차림의 형은 대문 앞에 서서 한참 동안 집 안을 들여다보았다. 나는 방 안에서 그 모습을 지켜보면서도 선뜻 나가지 못했다. 형의 얼굴에는 전에 없던 깊은 그늘이 드리워져 있었고, 한때 활기차던 눈빛은 어딘가 먼 곳을 응시하는 듯 공허해 보였다. 어머니가 먼저 뛰어나가 형을 껴안았을 때, 형은 아무 말 없이 고개를 숙일 뿐이었다. 동생인 나조차 알아보지 못하는 형의 눈길이 가슴을 서늘하게 만들었다."
    },
    {
      id: "p2",
      text: "형은 돌아왔으나 마음만은 아직 전쟁터에 머물러 있는 것 같았다. 밤마다 잠을 이루지 못하고 마당을 서성이는 소리가 들려왔고, 때로는 알아들을 수 없는 말을 중얼거리기도 했다. 식구들이 모여 밥을 먹을 때면 형은 숟가락을 든 채 먼 곳을 바라보다가 문득 정신을 차리곤 하였다. 어머니는 형이 좋아하던 음식을 정성껏 차렸지만, 형은 몇 숟갈 뜨다 말고 자리에서 일어나곤 했다. 아버지는 그런 형에게 아무 말도 하지 않았고, 다만 형이 나간 뒤 한숨만 길게 내쉬었다. 나는 형에게 말을 걸고 싶었으나, 무엇을 어떻게 물어야 할지 알 수 없었다. 형과 나 사이에는 전쟁이 만들어 놓은 보이지 않는 벽이 서 있었고, 그 벽을 허무는 방법을 아무도 몰랐다."
    },
    {
      id: "p3",
      text: "어느 날 나는 형이 뒷산에 올라 앉아 있는 것을 발견했다. 형은 산 아래로 펼쳐진 마을을 내려다보며 조용히 말했다. 거기서는 마을이란 게 없었어, 사람이 사는 곳이 전부 불타 버린 벌판뿐이었지. 나는 형의 옆에 말없이 앉았다. 산 아래에서는 논에 물을 대는 소리가 희미하게 들려왔고, 그 평화로운 풍경이 형의 말과 묘한 대조를 이루었다. 형은 한참 뒤에 다시 입을 열었다. 같이 갔던 동기 녀석이 내 옆에서 쓰러졌는데 나는 그 녀석 이름도 제대로 부르지 못했어. 형의 목소리는 담담했으나 떨리고 있었다. 나는 형의 남은 한 손을 잡았다. 형은 고개를 돌려 나를 바라보더니 처음으로 희미하게 웃었다."
    },
    {
      id: "p4",
      text: "봄이 깊어지면서 형은 조금씩 변해 갔다. 아버지의 밭일을 거들기 시작했고, 한 손으로 호미를 쥐는 법을 스스로 터득해 나갔다. 어머니가 건네주는 밥그릇을 더 이상 거부하지 않았으며, 가끔은 먼저 식탁에 앉아 있기도 했다. 어느 저녁 형은 마당에서 하늘을 올려다보며 말했다. 별이 이렇게 많은 줄 몰랐다, 거기서는 하늘을 올려다볼 여유가 없었으니까. 나는 그때 비로소 형이 돌아오고 있다는 것을 느꼈다. 전쟁이 형에게서 빼앗아 간 것들은 결코 되돌릴 수 없었지만, 형은 남은 것들로 다시 살아가는 법을 배우고 있었다. 그해 여름 형은 처음으로 웃으며 내 이름을 불렀고, 나는 그제야 진짜 형이 돌아왔다고 생각했다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "형이 돌아왔을 때 외모에서 가장 달라진 점은 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p1", "한쪽 소매가 텅 빈 군복 차림의 형은 대문 앞에 서서 한참 동안 집 안을 들여다보았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "형이 밤마다 잠을 이루지 못한 이유를 짐작할 수 있는 행동은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "마당을 서성이는 소리가 들려왔고, 때로는 알아들을 수 없는 말을 중얼거리기도 했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "뒷산에서 형이 전쟁터의 경험에 대해 말한 내용은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "같이 갔던 동기 녀석이 내 옆에서 쓰러졌는데 나는 그 녀석 이름도 제대로 부르지 못했어")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "형이 처음으로 희미하게 웃은 계기는 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p3", "나는 형의 남은 한 손을 잡았다. 형은 고개를 돌려 나를 바라보더니 처음으로 희미하게 웃었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "형이 일상으로 돌아오고 있음을 보여 주는 변화는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "아버지의 밭일을 거들기 시작했고, 한 손으로 호미를 쥐는 법을 스스로 터득해 나갔다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "서술자가 형이 돌아오고 있다고 느낀 순간은 언제인가?",
      answerRanges: [findRange(paragraphs, "p4", "별이 이렇게 많은 줄 몰랐다, 거기서는 하늘을 올려다볼 여유가 없었으니까. 나는 그때 비로소 형이 돌아오고 있다는 것을 느꼈다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(32, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 33: 비문학 (NONFICTION) — 사회 계약론의 전개 ───
function buildDay33() {
  const paragraphs = [
    {
      id: "p1",
      text: "사회 계약론은 국가의 정당성과 정치적 의무의 근거를 구성원 간의 합의에서 찾는 정치철학 이론이다. 이 이론의 출발점은 자연 상태에 대한 가정이다. 국가가 존재하기 이전의 인간 삶을 상정하고, 그러한 상태에서 벗어나기 위해 사람들이 자발적으로 계약을 맺어 정치 공동체를 구성한다는 것이 사회 계약론의 기본 구조이다. 토머스 홉스는 자연 상태를 만인의 만인에 대한 투쟁으로 규정하였다. 자기 보존을 위한 무제한적 자유가 오히려 모든 사람의 생명을 위협하기 때문에, 인간은 안전을 보장받기 위해 자신의 자유를 절대 권력에 양도한다는 것이 홉스의 논리이다. 홉스는 이렇게 형성된 절대적 주권자를 성서에 등장하는 거대한 괴물의 이름을 빌려 리바이어던이라 불렀다."
    },
    {
      id: "p2",
      text: "존 로크는 홉스와 달리 자연 상태를 비교적 평화로운 상태로 보았다. 로크에 따르면 인간은 자연 상태에서도 생명, 자유, 재산에 대한 자연권을 지니고 있으며, 사회 계약의 목적은 이러한 자연권을 보다 확실하게 보호하기 위한 것이다. 따라서 로크의 정부는 홉스의 절대 권력과 달리 시민의 권리를 침해할 경우 저항의 대상이 될 수 있다. 이러한 로크의 사상은 이후 미국 독립 선언과 프랑스 인권 선언에 직접적인 영향을 미쳤으며, 입헌주의와 권력 분립의 이론적 토대가 되었다. 로크가 강조한 동의에 기반한 통치라는 원칙은 근대 민주주의의 핵심적 전제로 자리 잡았다."
    },
    {
      id: "p3",
      text: "장자크 루소는 사회 계약론을 새로운 방향으로 전개하였다. 루소는 자연 상태의 인간을 선량한 존재로 보았으며, 사유 재산의 출현과 함께 불평등이 발생하였다고 주장하였다. 루소의 사회 계약은 개인의 자유를 보존하면서도 공동체의 이익을 추구하는 일반 의지에 기반한다. 일반 의지란 개별 구성원의 사적 이익이 아닌 공동체 전체의 공공선을 지향하는 집단적 의지를 뜻한다. 루소는 이 일반 의지에 따르는 것이 곧 자유라고 보았는데, 이는 개인의 자유를 공동체에 종속시킨다는 비판을 받기도 하였다. 그럼에도 루소의 사상은 프랑스 혁명의 사상적 원천이 되었으며, 인민 주권의 개념을 이론적으로 정립한 업적으로 평가된다."
    },
    {
      id: "p4",
      text: "현대 정치철학에서 사회 계약론은 존 롤스에 의해 재구성되었다. 롤스는 원초적 입장이라는 가상적 상황을 설정하여, 합리적 개인이 자신의 사회적 위치를 모르는 무지의 베일 뒤에서 어떤 정의의 원칙을 선택할 것인지를 묻는다. 이러한 조건에서 개인들은 최소 수혜자에게 가장 유리한 원칙을 선택하게 된다는 것이 롤스의 주장이며, 이를 통해 자유와 평등을 동시에 보장하는 정의의 원칙이 도출된다. 사회 계약론은 역사적 사실이라기보다 정치적 정당성의 규범적 근거를 제시하는 사유 실험으로서의 가치를 지닌다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "홉스가 자연 상태를 부정적으로 본 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "자기 보존을 위한 무제한적 자유가 오히려 모든 사람의 생명을 위협하기 때문에")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "로크의 사회 계약이 홉스와 근본적으로 다른 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "시민의 권리를 침해할 경우 저항의 대상이 될 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "로크의 사상이 후대에 미친 구체적인 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "미국 독립 선언과 프랑스 인권 선언에 직접적인 영향을 미쳤으며, 입헌주의와 권력 분립의 이론적 토대가 되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "루소가 말하는 일반 의지란 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "개별 구성원의 사적 이익이 아닌 공동체 전체의 공공선을 지향하는 집단적 의지를 뜻한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "롤스의 무지의 베일 뒤에서 개인들이 선택하게 되는 원칙은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "최소 수혜자에게 가장 유리한 원칙을 선택하게 된다는 것이 롤스의 주장이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "현대에서 사회 계약론이 지니는 가치는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "정치적 정당성의 규범적 근거를 제시하는 사유 실험으로서의 가치를 지닌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(33, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 34: 문학 (LITERATURE) — 폐교된 학교를 찾아가며 ───
function buildDay34() {
  const paragraphs = [
    {
      id: "p1",
      text: "오랜만에 고향에 돌아온 나는 어린 시절 다니던 초등학교를 찾아가 보기로 했다. 마을 어귀를 지나 비탈길을 오르니 학교 건물이 보였다. 운동장에는 잡초가 무성하게 자라 있었고, 한때 아이들의 함성으로 가득하던 그곳은 바람 소리만이 맴돌고 있었다. 건물 외벽의 페인트는 벗겨져 회색빛 콘크리트가 드러나 있었으며, 깨진 유리창 사이로 교실 안이 어렴풋이 들여다보였다. 교문 옆에는 녹슨 철봉이 비스듬히 기울어져 서 있었는데, 거기에 매달려 놀던 시절이 아득하게 떠올랐다. 철봉 아래에는 우리가 파 놓았던 모래밭의 흔적이 희미하게 남아 있었다."
    },
    {
      id: "p2",
      text: "교실 문을 열자 먼지 냄새가 코끝을 찔렀다. 칠판은 그대로였으나 글씨는 모두 지워져 있었고, 책상과 의자는 한쪽 구석에 어지럽게 쌓여 있었다. 나는 창가 자리에 서서 밖을 내다보았다. 그때 이 자리에서 수업 시간에 몰래 운동장을 바라보곤 했다. 봄이면 창문 너머로 벚꽃 잎이 날아들어 교과서 위에 떨어지기도 했다. 복도를 걸으니 삐걱거리는 마룻바닥 소리가 텅 빈 건물 안에 울려 퍼졌다. 교탁 서랍을 열어 보니 분필 한 자루가 남아 있었다. 나는 그 분필을 집어 칠판에 무언가를 쓰려다 멈추었다. 여기에 더 이상 쓸 수 있는 말이 남아 있지 않은 것 같았다."
    },
    {
      id: "p3",
      text: "학교 뒤편의 느티나무는 여전히 그 자리에 서 있었다. 줄기는 더 굵어졌고 가지는 더 넓게 뻗어 있었다. 그 나무 아래에서 우리는 도시락을 나눠 먹고, 구슬치기를 하고, 겨울이면 눈싸움을 했다. 비가 오는 날이면 나무 아래로 뛰어가 비를 피하면서 빗소리를 듣곤 했다. 나무는 그 모든 시간을 기억하고 있는 듯 묵묵히 서 있었다. 그때 함께 놀던 친구들은 이제 뿔뿔이 흩어져 각자의 삶을 살고 있다. 간혹 연락이 닿는 몇몇을 제외하면 대부분 소식을 알 수 없다. 나무 둥치에 누군가 칼로 새겨 놓은 글씨가 희미하게 남아 있었는데, 읽을 수 있는 것은 세 글자뿐이었다. 그 세 글자가 누구의 이름인지 짐작할 수 있었지만, 확신할 수는 없었다."
    },
    {
      id: "p4",
      text: "돌아오는 길에 나는 생각했다. 학교가 문을 닫은 것은 아이들이 줄었기 때문이다. 마을에서 젊은 사람들이 떠나고, 아이들의 웃음소리가 사라지면서 학교도 제 역할을 다한 것이다. 그러나 폐교된 건물 안에는 여전히 수많은 기억이 잠들어 있었다. 선생님의 분필 소리, 급식 시간의 소란, 방과 후 운동장의 먼지, 졸업식 날의 눈물. 이런 것들은 건물이 허물어진다 해도 사라지지 않을 것이다. 한 사람의 어린 시절이 온전히 담겨 있는 장소가 세상에서 지워진다는 것은 슬픈 일이었다. 나는 교문을 나서며 뒤를 돌아보았다. 기울어진 철봉 위로 석양빛이 내려앉고 있었고, 폐교는 마지막 수업을 마친 교실처럼 고요했다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "폐교된 학교 운동장의 현재 모습은 어떠한가?",
      answerRanges: [findRange(paragraphs, "p1", "운동장에는 잡초가 무성하게 자라 있었고, 한때 아이들의 함성으로 가득하던 그곳은 바람 소리만이 맴돌고 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "서술자가 칠판에 무언가를 쓰려다 멈춘 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "여기에 더 이상 쓸 수 있는 말이 남아 있지 않은 것 같았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "느티나무 아래에서의 추억으로 언급된 활동은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "도시락을 나눠 먹고, 구슬치기를 하고, 겨울이면 눈싸움을 했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "학교가 폐교된 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "마을에서 젊은 사람들이 떠나고, 아이들의 웃음소리가 사라지면서 학교도 제 역할을 다한 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "서술자가 건물이 허물어져도 사라지지 않을 것이라고 말한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "선생님의 분필 소리, 급식 시간의 소란, 방과 후 운동장의 먼지, 졸업식 날의 눈물")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글의 마지막 장면에서 폐교의 분위기를 비유한 표현은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "폐교는 마지막 수업을 마친 교실처럼 고요했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(34, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 35: 비문학 (NONFICTION) — 생태계 먹이 그물의 균형 ───
function buildDay35() {
  const paragraphs = [
    {
      id: "p1",
      text: "생태계에서 에너지와 영양분의 흐름은 먹이 그물이라는 복잡한 상호 관계망을 통해 이루어진다. 먹이 사슬이 단순한 일직선적 에너지 전달 경로를 나타내는 반면, 먹이 그물은 하나의 생물이 여러 종을 먹이로 삼거나 여러 포식자에게 먹히는 현실적인 관계를 반영한다. 이러한 복잡한 연결 구조는 생태계의 안정성과 밀접한 관련이 있다. 연결의 다양성이 높은 먹이 그물에서는 특정 종이 감소하더라도 다른 먹이원으로 전환할 수 있기 때문에, 전체 생태계가 급격하게 붕괴되는 것을 방지하는 완충 작용이 이루어진다."
    },
    {
      id: "p2",
      text: "먹이 그물의 균형을 유지하는 데 핵심적 역할을 하는 것이 핵심종이다. 핵심종은 개체 수나 생물량에 비해 생태계에 미치는 영향이 불균형적으로 큰 종을 가리킨다. 해달은 핵심종의 대표적 사례로, 해달이 성게의 개체 수를 조절함으로써 켈프 숲의 생태계가 유지된다. 해달이 사라지면 성게가 폭발적으로 증가하여 켈프를 과도하게 섭취하고, 그 결과 켈프 숲에 의존하는 수백 종의 해양 생물이 서식지를 잃게 된다. 이처럼 핵심종의 제거는 연쇄적인 생태계 변화를 일으키며, 이를 영양 단계 연쇄 효과라 한다."
    },
    {
      id: "p3",
      text: "먹이 그물의 균형이 교란되는 원인은 다양하다. 외래종의 침입은 기존 먹이 그물에 없던 새로운 포식자나 경쟁자를 도입하여 토착종의 생존을 위협한다. 호주에 도입된 두꺼비의 사례에서 볼 수 있듯이, 천적이 부재한 환경에서 외래종은 급격히 증가하여 토착 먹이 그물의 구조를 근본적으로 변형시킨다. 또한 기후 변화는 먹이 그물의 시간적 동기화를 교란하는 요인으로 작용한다. 봄의 시기가 앞당겨지면 식물의 개화 시기와 곤충의 출현 시기, 조류의 번식 시기 사이의 동기화가 깨지면서 먹이 공급과 수요의 불일치가 발생한다. 이러한 시간적 불일치는 특정 먹이에 대한 의존도가 높은 종에게 치명적인 결과를 초래하며, 장기적으로는 종 다양성의 감소로 이어질 수 있다."
    },
    {
      id: "p4",
      text: "먹이 그물의 균형 회복을 위한 생태학적 접근으로는 재야생화가 주목받고 있다. 재야생화는 훼손된 생태계에 핵심종을 재도입하여 먹이 그물의 자연적 조절 기능을 복원하는 전략이다. 미국 옐로스톤 국립공원에서 늑대를 재도입한 사례는 이 전략의 성공적 적용으로 평가된다. 늑대의 귀환은 엘크의 과도한 방목을 억제하여 강변 식생의 회복을 가져왔고, 이는 다시 비버의 서식지 확대와 어류 개체 수 증가로 이어지는 연쇄적 복원 효과를 낳았다. 이 사례는 상위 포식자의 존재가 생태계 전반의 건강에 얼마나 중대한 영향을 미치는지를 보여 준다. 다만 재야생화는 핵심종의 재도입이 인간의 생활권과 충돌할 수 있다는 문제를 수반하므로, 지역 주민의 안전과 경제적 이해를 함께 고려하는 통합적 접근이 요구된다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "먹이 그물의 복잡한 연결 구조가 생태계 안정성에 기여하는 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "특정 종이 감소하더라도 다른 먹이원으로 전환할 수 있기 때문에, 전체 생태계가 급격하게 붕괴되는 것을 방지하는 완충 작용이 이루어진다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "핵심종이란 어떤 종을 가리키는가?",
      answerRanges: [findRange(paragraphs, "p2", "개체 수나 생물량에 비해 생태계에 미치는 영향이 불균형적으로 큰 종을 가리킨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "해달이 사라지면 켈프 숲 생태계에 어떤 변화가 일어나는가?",
      answerRanges: [findRange(paragraphs, "p2", "성게가 폭발적으로 증가하여 켈프를 과도하게 섭취하고, 그 결과 켈프 숲에 의존하는 수백 종의 해양 생물이 서식지를 잃게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "기후 변화가 먹이 그물에 미치는 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "먹이 공급과 수요의 불일치가 발생한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "재야생화 전략의 핵심 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "훼손된 생태계에 핵심종을 재도입하여 먹이 그물의 자연적 조절 기능을 복원하는 전략이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "옐로스톤 늑대 재도입 사례가 보여 주는 생태학적 교훈은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "상위 포식자의 존재가 생태계 전반의 건강에 얼마나 중대한 영향을 미치는지를 보여 준다")],
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
  const contentId = `dr-r3-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(러셀 3) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "RUSSELL_3",
    schoolGradeRange: { min: 9, max: 10 },
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
    level_id: "RUSSELL_3",
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
  console.log("=== 러셀3 Day 31~35 빌드 시작 ===\n");

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
    if (len < 1250 || len > 1350) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1250~1350)`);
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

  if (!allValid) {
    console.error("\n검증 실패! 글자수를 조정해 주세요.");
    process.exit(1);
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
