#!/usr/bin/env node
// 비트겐슈타인1 Day 36~40 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE (문학), 홀수 Day = NONFICTION (비문학)
// 목표 글자수: 1400자 ±50 (1350~1450)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-wittgenstein1.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/wittgenstein1');

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

// ─── Day 36: 문학 (LITERATURE) ───
// 주제: 한국 현대시에서 윤동주의 자기 성찰 시학 (문학평론)
function buildDay36() {
  const paragraphs = [
    {
      id: "p1",
      text: "윤동주는 한국 현대시사에서 자기 성찰의 시학을 가장 깊이 있게 구현한 시인으로 평가된다. 그의 시 세계는 식민지 시대라는 암울한 현실 속에서 외부 세계에 대한 직접적 저항보다는 자신의 내면을 끊임없이 응시하는 방식으로 전개되었다. 이러한 내면 탐구는 단순한 자기 연민에 머무는 것이 아니라, 시대의 부조리 앞에서 양심적 개인이 겪는 윤리적 고뇌를 깊이 있게 형상화한 것이다. 대표작 「서시」에서 죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를 바라는 화자의 태도는 외부의 시선이 아닌 자기 내면의 도덕적 기준에 비추어 스스로를 판단하겠다는 엄격한 윤리 의식의 표현이다. 이 시에서 잎새에 이는 바람에도 괴로워하는 화자의 감수성은 시대적 고통에 대한 섬세한 자각을 보여 준다."
    },
    {
      id: "p2",
      text: "윤동주 시의 핵심적 모티프는 부끄러움이다. 그에게 부끄러움이란 도덕적 이상과 현실적 자아 사이의 간극에서 발생하는 감정으로, 자기 자신에 대한 끊임없는 반성의 계기로 작용한다. 「참회록」에서 화자는 거울 속에 비친 자기 모습을 응시하며 밤이면 밤마다 나의 거울을 손바닥으로 발바닥으로 닦아 보았다고 고백한다. 여기서 거울은 자아를 비추는 성찰의 도구이며, 닦는 행위는 부끄러운 자아를 정화하려는 의지를 상징한다. 이처럼 윤동주는 시적 화자를 통해 자아의 불완전함을 직시하면서도, 그 불완전함 너머에 있는 순수한 존재를 향한 열망을 포기하지 않는 태도를 보여 준다."
    },
    {
      id: "p3",
      text: "윤동주 시에서 자연물은 자기 성찰의 매개로 기능한다. 「별 헤는 밤」에서 화자는 밤하늘의 별을 헤아리면서 어머니, 벗, 이웃 사람 등 소중한 관계를 떠올린다. 여기서 별은 화자가 지향하는 가치의 상징이며, 별을 헤아리는 행위는 자신이 지켜야 할 것들을 하나하나 확인하는 성찰의 과정이다. 바람과 별빛에 스치우는 화자의 모습에서 드러나는 것은 세계의 아름다움에 대한 감수성과, 그 아름다움을 온전히 누리지 못하는 현실에 대한 안타까움이다. 이러한 자연물을 통한 자아 성찰은 동양적 자연관과 근대적 개인 의식이 만나는 지점을 형성하며, 윤동주 시의 독특한 서정적 깊이를 만들어 낸다."
    },
    {
      id: "p4",
      text: "윤동주의 자기 성찰 시학이 한국 문학사에서 지니는 가치는 저항의 방식에 대한 새로운 관점을 제시했다는 점에 있다. 식민지 시대의 저항시가 대체로 외부 세계에 대한 직접적 분노와 투쟁의 의지를 표현하는 데 집중하였다면, 윤동주는 자기 내면의 성찰을 통해 식민 권력이 훼손할 수 없는 개인의 도덕적 자율성을 지키고자 하였다. 이는 양심의 자유라는 가장 내밀한 영역에서의 저항이며, 어떤 외압으로도 빼앗을 수 없는 인간 존엄의 최후 보루를 확인하는 행위였다. 그의 시는 소리 높여 외치지 않으면서도 독자의 마음속에 깊은 울림을 남기는 조용한 저항의 미학을 실현하였다. 이러한 윤동주의 시적 유산은 이후 한국 문학에서 내면적 성찰과 사회적 참여가 대립하는 것이 아님을 보여 주는 중요한 선례가 되었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "윤동주 시의 내면 탐구가 단순한 자기 연민과 구별되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "시대의 부조리 앞에서 양심적 개인이 겪는 윤리적 고뇌를 깊이 있게 형상화한 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「참회록」에서 거울을 닦는 행위가 상징하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "부끄러운 자아를 정화하려는 의지를 상징한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "윤동주가 자아의 불완전함을 직시하면서도 포기하지 않는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "순수한 존재를 향한 열망을 포기하지 않는 태도를 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "「별 헤는 밤」에서 별을 헤아리는 행위의 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "자신이 지켜야 할 것들을 하나하나 확인하는 성찰의 과정이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "윤동주의 자기 성찰이 식민지 저항과 관련하여 의미하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "식민 권력이 훼손할 수 없는 개인의 도덕적 자율성을 지키고자 하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "윤동주의 시적 유산이 이후 한국 문학에 보여 준 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "내면적 성찰과 사회적 참여가 대립하는 것이 아님을 보여 주는 중요한 선례가 되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(36, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 37: 비문학 (NONFICTION) ───
// 주제: 행동경제학과 인지 편향 (경제학/심리학)
function buildDay37() {
  const paragraphs = [
    {
      id: "p1",
      text: "행동경제학은 인간이 합리적으로 판단한다는 전통 경제학의 가정에 의문을 제기하며 등장한 학문 분야이다. 전통 경제학은 개인이 주어진 정보를 완전하게 처리하여 자신의 이익을 극대화하는 선택을 한다고 전제하였다. 그러나 행동경제학의 선구자인 대니얼 카너먼과 아모스 트버스키는 실험 연구를 통해 인간의 판단이 체계적인 오류 패턴을 보인다는 사실을 입증하였다. 이들은 인간이 복잡한 의사 결정 상황에서 간편한 사고 방식인 휴리스틱에 의존하며, 이 과정에서 인지 편향이라는 예측 가능한 오류가 발생한다고 설명하였다. 이러한 발견은 경제학과 심리학의 경계를 넘나드는 새로운 학문적 흐름을 형성하였다."
    },
    {
      id: "p2",
      text: "대표적인 인지 편향으로 손실 회피 편향을 들 수 있다. 이는 같은 크기의 이득과 손실이 주어졌을 때, 손실에서 느끼는 심리적 고통이 이득에서 느끼는 만족감보다 약 두 배 크게 작용하는 현상이다. 예컨대 만 원을 잃었을 때의 불쾌감은 만 원을 얻었을 때의 기쁨보다 훨씬 크다. 이러한 손실 회피 성향은 투자자들이 손실이 난 주식을 지나치게 오래 보유하는 현상을 설명하는 데 활용된다. 또한 기업이 할인 행사를 종료할 때 소비자가 느끼는 박탈감도 이 편향으로 해석할 수 있다. 손실 회피 편향은 인간의 의사 결정이 순수한 경제적 계산이 아니라 심리적 기제에 의해 좌우됨을 보여 주는 핵심적 사례이다."
    },
    {
      id: "p3",
      text: "확증 편향은 자신이 이미 믿고 있는 정보를 선택적으로 수집하고 해석하는 경향을 뜻한다. 사람들은 자기 신념에 부합하는 증거에는 높은 가치를 부여하면서, 그와 반대되는 증거는 무시하거나 과소평가하는 경향이 있다. 이 편향은 온라인 환경에서 더욱 강화되는데, 검색 알고리즘이 이용자의 기존 관심사에 맞는 정보를 우선적으로 보여 주기 때문이다. 그 결과 개인은 자신의 신념을 반복적으로 확인하는 정보 거품 속에 갇히게 되며, 이는 사회적 차원에서 집단 간 인식의 격차를 심화시키는 요인으로 작용한다. 정치적 쟁점에 대한 여론이 극단적으로 양극화되는 현상에도 확증 편향이 작용하고 있다. 따라서 확증 편향을 극복하기 위해서는 자기 신념에 반대되는 정보를 의도적으로 탐색하는 비판적 사고 습관이 필요하다."
    },
    {
      id: "p4",
      text: "행동경제학의 연구 성과는 공공 정책의 설계에도 중요한 시사점을 제공한다. 리처드 탈러가 제안한 넛지 이론은 사람들의 선택 환경을 미세하게 조정함으로써 강제 없이 바람직한 행동을 유도할 수 있다는 개념이다. 예를 들어 구내식당에서 건강한 음식을 눈높이에 배치하면 건강식의 선택 비율이 자연스럽게 높아진다. 퇴직 연금의 자동 가입 제도 역시 넛지의 대표적 사례로, 기본 설정을 가입으로 바꾸는 것만으로 가입률이 크게 상승하였다. 그러나 넛지에 대해서는 개인의 자율적 판단을 교묘하게 조작할 수 있다는 윤리적 비판도 제기되므로, 투명성과 선택의 자유가 보장되는 범위 내에서 적용되어야 한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "카너먼과 트버스키가 입증한 인간 판단의 특성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "인간의 판단이 체계적인 오류 패턴을 보인다는 사실을 입증하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "손실 회피 편향에서 손실과 이득의 심리적 크기 차이는 어떠한가?",
      answerRanges: [findRange(paragraphs, "p2", "손실에서 느끼는 심리적 고통이 이득에서 느끼는 만족감보다 약 두 배 크게 작용하는 현상이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "확증 편향이 온라인 환경에서 더욱 강화되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "검색 알고리즘이 이용자의 기존 관심사에 맞는 정보를 우선적으로 보여 주기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "확증 편향이 사회적 차원에서 미치는 부정적 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "사회적 차원에서 집단 간 인식의 격차를 심화시키는 요인으로 작용한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "넛지 이론의 핵심 개념은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "사람들의 선택 환경을 미세하게 조정함으로써 강제 없이 바람직한 행동을 유도할 수 있다는 개념이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "넛지에 대해 제기되는 윤리적 비판은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "개인의 자율적 판단을 교묘하게 조작할 수 있다는 윤리적 비판도 제기되므로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(37, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 38: 문학 (LITERATURE) ───
// 주제: 산골 마을 우체부의 마지막 배달 (단편소설)
function buildDay38() {
  const paragraphs = [
    {
      id: "p1",
      text: "강원도 깊은 산골 마을에서 삼십 년째 우편물을 배달하는 박종만 씨는 오늘이 마지막 근무일이었다. 우체국 본부에서 이 마을의 배달 업무를 민간 택배 업체에 위탁하기로 결정했기 때문이다. 새벽부터 내리던 눈이 무릎까지 쌓인 산길을 걸으며, 그는 배낭 속에 든 마지막 우편물들을 하나씩 확인하였다. 연금 통지서, 병원 안내문, 그리고 낡은 봉투에 담긴 손편지 한 통. 이 마을에 사는 여든 가구 대부분이 노인 세대였고, 종만 씨는 그들 각자의 이름과 얼굴을 모두 기억하고 있었다. 누가 어떤 약을 먹는지, 누구의 자녀가 어디에 사는지까지 훤히 알고 있는 사이였다. 산 아래 면 소재지까지 버스가 하루 두 번밖에 다니지 않는 이 마을에서 우체부는 단순한 배달원 이상의 존재였다."
    },
    {
      id: "p2",
      text: "첫 번째로 들른 집은 고개 너머 홀로 사는 김순임 할머니의 집이었다. 할머니는 대문 앞에 나와 서 있다가 종만 씨를 보자 반가운 표정을 지었다. 종만 씨가 연금 통지서를 건네자, 할머니는 통지서보다 그의 손을 먼저 잡았다. 이 겨울에 또 혼자 고생이여, 하고 말하는 할머니의 목소리가 떨렸다. 종만 씨는 내일부터는 택배 기사분이 오실 겁니다, 하고 말하려다가 입을 다물었다. 할머니에게 배달원이 바뀐다는 사실이 어떤 의미인지 그는 알고 있었다. 매주 한 번 찾아와 안부를 묻는 유일한 외부인이 사라진다는 뜻이었기 때문이다."
    },
    {
      id: "p3",
      text: "마을 한가운데 있는 마을회관 앞을 지날 때, 이장이 종만 씨를 불러 세웠다. 오늘이 마지막이라며, 하고 이장은 말을 잇지 못하였다. 종만 씨는 고개를 끄덕이며 배낭에서 마지막 편지 한 통을 꺼냈다. 서울에 사는 이장의 아들이 보낸 편지였다. 요즘 누가 편지를 쓰나 싶었지만, 그 아들은 해마다 아버지 생신에 손편지를 보내는 사람이었다. 이장은 편지를 받아 들고 잠시 말없이 봉투를 바라보았다. 종만 씨는 그 침묵 속에서 우편이라는 것이 단순히 종이를 전달하는 일이 아니라, 사람과 사람 사이의 마음을 잇는 일이었음을 새삼 깨달았다."
    },
    {
      id: "p4",
      text: "마지막 배달을 마치고 산길을 내려오는 종만 씨의 등 뒤로 해가 기울고 있었다. 빈 배낭은 가벼웠지만 발걸음은 무거웠다. 삼십 년 동안 이 길을 걸으며 그는 마을 사람들의 기쁨과 슬픔을 함께 나누었다. 출생 신고서를 배달하며 웃었고, 사망 통지서를 전하며 함께 울었다. 혹독한 겨울 폭설에 길이 끊겨도 빠뜨린 적 없는 배달이 그의 자부심이었다. 택배 업체에서 온 담당자는 지난주 인사차 마을을 다녀갔는데, 그가 가장 먼저 물은 것은 배달 건수와 효율이었다. 종만 씨는 그 말을 들으며 씁쓸한 미소를 지었다. 효율이라는 말로는 측정할 수 없는 것이 이 산길 위에 있다는 것을 설명할 방법이 없었기 때문이다. 눈 쌓인 산길 위에 찍힌 그의 발자국은 곧 새 눈에 덮일 것이었지만, 마을 사람들의 기억 속에는 오래도록 남을 것이었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "이 마을에서 우체부가 단순한 배달원 이상의 존재였던 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "산 아래 면 소재지까지 버스가 하루 두 번밖에 다니지 않는 이 마을에서 우체부는 단순한 배달원 이상의 존재였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "할머니에게 배달원이 바뀐다는 사실이 의미하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "매주 한 번 찾아와 안부를 묻는 유일한 외부인이 사라진다는 뜻이었기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "종만 씨가 이장에게 편지를 전하며 깨달은 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "우편이라는 것이 단순히 종이를 전달하는 일이 아니라, 사람과 사람 사이의 마음을 잇는 일이었음을 새삼 깨달았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "택배 업체 담당자가 마을에 와서 가장 먼저 물은 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "그가 가장 먼저 물은 것은 배달 건수와 효율이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "종만 씨가 효율이라는 말에 씁쓸함을 느낀 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "효율이라는 말로는 측정할 수 없는 것이 이 산길 위에 있다는 것을 설명할 방법이 없었기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "마지막 문장에서 발자국과 기억이 대비되는 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "마을 사람들의 기억 속에는 오래도록 남을 것이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(38, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 39: 비문학 (NONFICTION) ───
// 주제: 플라톤의 이데아론과 동굴의 비유 (철학)
function buildDay39() {
  const paragraphs = [
    {
      id: "p1",
      text: "플라톤의 이데아론은 서양 철학사에서 가장 영향력 있는 형이상학적 체계 중 하나이다. 플라톤은 우리가 감각으로 경험하는 현실 세계와 별도로, 영원불변하는 본질의 세계가 존재한다고 주장하였다. 이 본질의 세계를 구성하는 것이 이데아이며, 현실 세계의 사물들은 이데아를 불완전하게 모방한 것에 불과하다. 예를 들어 현실에서 우리가 보는 수많은 삼각형은 저마다 크기와 모양이 다르지만, 삼각형의 이데아는 모든 삼각형에 공통되는 완전한 본질로서 변함없이 존재한다. 마찬가지로 정의로운 행위들은 여러 가지가 있을 수 있지만, 정의 자체의 이데아는 하나이다. 이처럼 플라톤에게 참된 앎이란 변화하는 감각 세계가 아니라, 불변하는 이데아의 세계를 인식하는 것이다."
    },
    {
      id: "p2",
      text: "플라톤은 이데아론을 보다 생생하게 전달하기 위해 동굴의 비유를 제시하였다. 이 비유에서 사람들은 태어날 때부터 동굴 안에 묶여 벽만 바라보며 살아간다. 동굴 뒤편에서 불빛이 사물을 비추면 벽에 그림자가 생기는데, 묶여 있는 사람들은 이 그림자를 실재라고 믿는다. 만약 한 사람이 사슬에서 풀려나 동굴 밖으로 나간다면, 처음에는 밝은 햇빛에 눈이 부셔 아무것도 볼 수 없을 것이다. 그러나 점차 눈이 적응하면 동굴 밖의 사물들이 그림자보다 훨씬 선명하고 참된 것임을 깨닫게 된다. 이 비유에서 그림자는 감각 세계의 불완전한 현상을, 동굴 밖의 세계는 이데아의 참된 실재를 상징한다."
    },
    {
      id: "p3",
      text: "동굴의 비유에서 특히 주목할 부분은 동굴 밖을 경험한 사람이 다시 동굴로 돌아왔을 때의 상황이다. 밖의 빛에 적응한 그의 눈은 다시 어둠 속에서 제대로 볼 수 없게 되고, 동굴 안의 사람들은 그를 비웃으며 그가 밖에 나갔다 와서 오히려 눈이 나빠졌다고 조롱한다. 심지어 그들은 누구든 동굴 밖으로 데려가려는 자가 있다면 그를 죽이겠다고까지 위협한다. 플라톤은 이 장면을 통해 진리를 깨달은 철학자가 대중 사이에서 겪는 소외와 위험을 묘사하였다. 이는 소크라테스가 아테네 시민들로부터 받은 재판과 죽음을 우회적으로 반영한 것이기도 하다. 참된 앎을 전달하려는 자가 오히려 무지한 다수에 의해 배척당하는 이 역설은, 지식과 권력의 관계에 대한 깊은 성찰을 담고 있다."
    },
    {
      id: "p4",
      text: "플라톤의 이데아론과 동굴의 비유는 오늘날에도 여전히 유효한 철학적 물음을 제기한다. 우리가 진리라고 믿는 것이 과연 실재의 모습인지, 아니면 한정된 관점에서 바라본 그림자에 불과한 것인지 성찰하게 만드는 것이다. 현대 사회에서 미디어와 소셜 네트워크를 통해 접하는 정보들이 현실의 완전한 모습이 아닐 수 있다는 점에서, 동굴의 비유는 미디어 리터러시의 관점에서도 의미 있게 해석된다. 편향된 정보만 접하는 사람은 마치 동굴 속 그림자만 보는 것과 다르지 않기 때문이다. 그러나 이데아론에 대한 비판도 존재하는데, 감각 세계를 불완전한 것으로 격하하는 이원론적 세계관이 현실의 구체적 경험을 경시하는 결과를 낳을 수 있다는 지적이 대표적이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "플라톤에게 참된 앎이란 무엇을 인식하는 것인가?",
      answerRanges: [findRange(paragraphs, "p1", "불변하는 이데아의 세계를 인식하는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "동굴의 비유에서 그림자와 동굴 밖 세계가 각각 상징하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "그림자는 감각 세계의 불완전한 현상을, 동굴 밖의 세계는 이데아의 참된 실재를 상징한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "동굴 밖을 경험한 사람이 돌아왔을 때 동굴 안 사람들의 반응은 어떠한가?",
      answerRanges: [findRange(paragraphs, "p3", "동굴 안의 사람들은 그를 비웃으며 그가 밖에 나갔다 와서 오히려 눈이 나빠졌다고 조롱한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "플라톤이 동굴 귀환 장면을 통해 묘사하고자 한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "진리를 깨달은 철학자가 대중 사이에서 겪는 소외와 위험을 묘사하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "동굴의 비유가 현대 사회에서 의미 있게 해석될 수 있는 관점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "동굴의 비유는 미디어 리터러시의 관점에서도 의미 있게 해석된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이데아론에 대해 제기되는 대표적 비판은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "감각 세계를 불완전한 것으로 격하하는 이원론적 세계관이 현실의 구체적 경험을 경시하는 결과를 낳을 수 있다는 지적이 대표적이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(39, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 40: 문학 (LITERATURE) ───
// 주제: 해방기 문학의 이념 갈등 (문학사)
function buildDay40() {
  const paragraphs = [
    {
      id: "p1",
      text: "1945년 해방은 한국 문학에 새로운 가능성과 함께 심각한 이념적 분열을 가져왔다. 식민지 시대에 억눌려 있던 문학적 에너지가 한꺼번에 분출하였으나, 해방 공간의 좌우 이념 대립은 문학계에도 그대로 반영되었다. 좌익 문학 진영은 조선문학가동맹을 결성하여 계급 해방과 민족 해방의 과제를 문학의 사명으로 내세웠다. 이들은 문학이 사회 변혁의 도구가 되어야 한다고 주장하며, 노동자와 농민의 현실을 형상화하는 리얼리즘 창작 방법론을 강조하였다. 이 진영의 대표적 작가인 이태준과 임화는 문학의 사회적 기능을 중시하면서 예술적 자율성보다 정치적 실천을 우선시하는 경향을 보였다. 이들에게 문학은 민중 계몽의 수단이자 새로운 사회 건설을 위한 실천적 행위였다."
    },
    {
      id: "p2",
      text: "우익 문학 진영은 조선청년문학가협회를 중심으로 결집하였다. 이들은 문학의 자율성과 순수성을 옹호하며, 문학이 특정 이념의 선전 도구로 전락해서는 안 된다고 주장하였다. 김동리는 이 진영의 핵심적 이론가로서 순수 문학론을 전개하였는데, 그에 의하면 문학의 본질은 인간 존재의 근원적 문제를 탐구하는 데 있으며, 계급이나 이념은 문학적 주제가 될 수 있을지언정 문학의 목적이 되어서는 안 된다. 김동리는 구체적으로 자신의 소설에서 토속적 세계와 인간의 운명이라는 주제를 다루면서, 정치적 함의보다는 인간 실존의 보편적 조건을 탐구하고자 하였다."
    },
    {
      id: "p3",
      text: "해방기 좌우 문학 논쟁에서 가장 쟁점이 되었던 문제는 문학의 자율성과 현실 참여의 관계였다. 좌익 진영은 순수 문학이 현실을 회피하는 도피적 태도라고 비판하였고, 우익 진영은 목적 문학이 예술의 본질을 왜곡한다고 반박하였다. 이 논쟁은 단순한 문학적 의견 차이가 아니라 해방 공간의 정치적 대립이 문학 장에 투사된 것이었다. 그 결과 문학인들은 각자의 이념적 입장에 따라 작품의 주제와 방법론을 선택해야 하는 압박에 놓이게 되었으며, 이념과 무관하게 예술적 실험을 추구하려는 작가들은 양측으로부터 모두 비판을 받는 곤란한 처지에 빠지기도 하였다."
    },
    {
      id: "p4",
      text: "해방기 문학의 이념 갈등은 1948년 남북 분단과 1950년 한국전쟁을 거치면서 비극적 결말을 맞이하였다. 월북한 작가들의 작품은 남한에서 금기시되었고, 잔류한 좌익 성향 작가들은 전향을 강요받았다. 이 과정에서 임화, 이태준 등 뛰어난 역량을 지닌 작가들이 문학사에서 오랫동안 배제되는 결과가 초래되었다. 이들의 작품이 공식적으로 연구 대상에 포함된 것은 1988년 해금 조치 이후의 일이었다. 해방기 문학 논쟁이 남긴 과제는 문학과 정치의 관계에 대한 본질적 물음이다. 문학은 정치적 현실에서 완전히 자유로울 수 있는가, 혹은 문학의 사회적 책임은 어디까지인가라는 질문은 오늘날에도 여전히 유효하며, 해방기의 경험은 이 물음에 답하기 위한 중요한 역사적 사례로 남아 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "좌익 문학 진영이 강조한 창작 방법론은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "노동자와 농민의 현실을 형상화하는 리얼리즘 창작 방법론을 강조하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "김동리가 주장한 문학의 본질은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "문학의 본질은 인간 존재의 근원적 문제를 탐구하는 데 있으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "해방기 좌우 문학 논쟁의 핵심 쟁점은 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p3", "문학의 자율성과 현실 참여의 관계였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "이념과 무관한 예술적 실험을 추구하려던 작가들이 처한 곤란은 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p3", "이념과 무관하게 예술적 실험을 추구하려는 작가들은 양측으로부터 모두 비판을 받는 곤란한 처지에 빠지기도 하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "분단과 전쟁 이후 좌익 성향 작가들에게 일어난 일은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "잔류한 좌익 성향 작가들은 전향을 강요받았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "해방기 문학 논쟁이 남긴 본질적 물음은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "문학은 정치적 현실에서 완전히 자유로울 수 있는가, 혹은 문학의 사회적 책임은 어디까지인가라는 질문은 오늘날에도 여전히 유효하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(40, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  // 정독 타임라인 자동 생성
  const timeline = buildTimeline(paragraphs);
  // 복기 카드 8장
  const recall = buildRecallCards(paragraphs, 8);

  const dayStr = String(dayIndex).padStart(3, '0');
  const contentId = `dr-w1-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(비트겐슈타인 1) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "WITTGENSTEIN_1",
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
    level_id: "WITTGENSTEIN_1",
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
  console.log("=== 비트겐슈타인1 Day 36~40 빌드 시작 ===\n");

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
    if (len < 1350 || len > 1450) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1350~1450)`);
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
