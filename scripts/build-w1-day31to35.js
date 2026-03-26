#!/usr/bin/env node
// 비트겐슈타인1 Day 31~35 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION, 짝수 Day = LITERATURE
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

// ─── Day 31: 비문학 (NONFICTION) — 양자역학의 불확정성 원리 ───
function buildDay31() {
  const paragraphs = [
    {
      id: "p1",
      text: "양자역학에서 불확정성 원리는 미시 세계의 근본적 한계를 규정하는 핵심 원리이다. 1927년 독일의 물리학자 베르너 하이젠베르크가 제안한 이 원리에 따르면, 입자의 위치와 운동량을 동시에 정확하게 측정하는 것은 원리적으로 불가능하다. 이는 측정 기술의 불완전함에서 비롯되는 문제가 아니라, 자연 자체가 지닌 본질적 성질이다. 고전 물리학에서는 대상의 위치와 속도를 동시에 정밀하게 측정할 수 있다고 전제하였으나, 양자 수준에서는 하나의 물리량을 정밀하게 측정할수록 다른 물리량의 불확정성이 커진다. 이러한 상보적 관계는 입자가 파동의 성질을 동시에 지닌다는 물질파 개념과 밀접하게 관련되어 있다."
    },
    {
      id: "p2",
      text: "불확정성 원리의 물리적 의미를 이해하기 위해서는 측정 과정 자체에 대한 성찰이 필요하다. 전자의 위치를 측정하려면 빛을 전자에 쏘아 그 반사광을 관측해야 한다. 그런데 빛 역시 광자라는 입자로 이루어져 있으므로, 광자가 전자에 부딪히는 순간 전자의 운동 상태가 변화하게 된다. 위치를 더 정밀하게 측정하기 위해 파장이 짧은 빛을 사용하면 광자의 에너지가 커져 전자에 더 큰 교란을 일으키고, 결과적으로 운동량의 불확정성은 더욱 증가한다. 반대로 운동량의 교란을 최소화하기 위해 파장이 긴 빛을 사용하면 위치의 측정 정밀도가 떨어진다. 이처럼 측정 행위 자체가 측정 대상에 영향을 미치는 것은 양자 세계의 고유한 특성이다."
    },
    {
      id: "p3",
      text: "불확정성 원리는 단순한 물리학적 발견을 넘어 과학 철학에도 심대한 영향을 미쳤다. 고전 물리학의 결정론적 세계관에서는 초기 조건을 정확히 알면 미래의 모든 상태를 예측할 수 있다고 보았다. 그러나 불확정성 원리는 초기 조건 자체를 완전히 파악하는 것이 원리적으로 불가능함을 보여 줌으로써, 라플라스적 결정론의 근본 전제를 붕괴시켰다. 이에 대해 아인슈타인은 양자역학이 불완전한 이론이며, 숨은 변수가 존재하여 결정론적 해석이 가능하다고 주장하였다. 반면 닐스 보어를 중심으로 한 코펜하겐 학파는 불확정성이 자연의 본질적 속성이며, 관측 이전의 물리량에 확정적 값을 부여하는 것 자체가 무의미하다고 반박하였다."
    },
    {
      id: "p4",
      text: "오늘날 불확정성 원리는 기술적 응용에서도 중요한 역할을 수행한다. 양자 암호 통신에서는 도청자가 양자 상태를 측정하면 필연적으로 상태가 변화한다는 원리를 이용하여 도청 여부를 탐지한다. 또한 주사 터널링 현미경은 전자가 고전적으로는 통과 불가능한 에너지 장벽을 확률적으로 투과하는 터널링 현상을 활용하며, 이 현상 역시 불확정성 원리에 기반한다. 양자 컴퓨터 역시 중첩과 얽힘이라는 양자적 현상을 연산에 활용하는 기술로서, 불확정성 원리가 규정하는 양자 세계의 법칙 위에서 작동한다. 이처럼 불확정성 원리는 미시 세계의 이해를 넘어 현대 기술 발전의 토대가 되고 있으며, 자연에 대한 인간의 인식 방식을 근본적으로 변화시킨 과학사의 전환점으로 평가된다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "불확정성 원리에서 위치와 운동량을 동시에 정확히 측정할 수 없는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "자연 자체가 지닌 본질적 성질이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "전자의 위치를 정밀하게 측정하기 위해 파장이 짧은 빛을 사용하면 어떤 문제가 발생하는가?",
      answerRanges: [findRange(paragraphs, "p2", "광자의 에너지가 커져 전자에 더 큰 교란을 일으키고, 결과적으로 운동량의 불확정성은 더욱 증가한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "불확정성 원리가 라플라스적 결정론에 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "초기 조건 자체를 완전히 파악하는 것이 원리적으로 불가능함을 보여 줌으로써, 라플라스적 결정론의 근본 전제를 붕괴시켰다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "코펜하겐 학파가 아인슈타인의 주장에 반박한 핵심 논거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "불확정성이 자연의 본질적 속성이며, 관측 이전의 물리량에 확정적 값을 부여하는 것 자체가 무의미하다고 반박하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "양자 암호 통신에서 도청 여부를 탐지하는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "도청자가 양자 상태를 측정하면 필연적으로 상태가 변화한다는 원리를 이용하여 도청 여부를 탐지한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "불확정성 원리가 과학사에서 갖는 의의는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "자연에 대한 인간의 인식 방식을 근본적으로 변화시킨 과학사의 전환점으로 평가된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(31, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 32: 문학 (LITERATURE) — 6·25 전쟁 피난민 가족의 이야기 ───
function buildDay32() {
  const paragraphs = [
    {
      id: "p1",
      text: "일구오공년 겨울, 아버지는 식구들을 이끌고 서울을 떠났다. 인민군이 다시 밀고 내려온다는 소문이 골목마다 퍼졌고, 사람들은 보따리를 짊어지고 남쪽으로 향하는 피난 행렬에 합류하였다. 어머니는 겨우 세 살 된 막내를 등에 업고 언니의 손을 꽉 쥐었으며, 나는 아버지의 등 뒤에서 짐 보따리 사이에 끼어 걸었다. 길 위에는 눈이 내려 질퍽하였고, 트럭과 수레와 사람들이 뒤엉켜 한 발짝도 나아가기 어려운 순간이 반복되었다. 다리를 건널 때면 어머니는 막내를 더 꽉 끌어안았고, 폭격기의 소리가 들릴 때마다 사람들은 길 옆의 도랑으로 몸을 숨겼다. 어디로 가는 것인지, 언제 돌아올 수 있는 것인지 아무도 알지 못하였으나, 아버지는 한 번도 뒤를 돌아보지 않았다."
    },
    {
      id: "p2",
      text: "부산에 도착한 것은 열흘이 지난 뒤였다. 낯선 도시의 판자촌에 자리를 잡았으나 방이라 부를 수 있는 것은 아니었다. 비닐과 양철판으로 지은 움막 안에 다섯 식구가 몸을 구겨 넣었고, 밤마다 바닷바람이 틈새로 밀려들어 온몸을 얼게 하였다. 비가 오는 날이면 양철 지붕 위로 빗방울이 쏟아져 잠을 이루기 어려웠다. 아버지는 부두에서 짐을 나르는 일을 하였고, 어머니는 미군 부대에서 흘러나오는 밀가루와 통조림으로 끼니를 마련하였다. 나는 학교에 가는 대신 판자촌 골목을 돌아다니며 빈 깡통과 골판지를 주워 모았다. 그것들을 모아 팔면 엿 하나를 살 수 있었고, 그 엿을 세 조각으로 나누어 언니와 막내에게 건네면 어머니가 고개를 돌려 눈물을 닦는 것이 보였다."
    },
    {
      id: "p3",
      text: "그해 봄, 막내가 아팠다. 열이 내리지 않았고 기침이 며칠째 계속되었으나 병원에 갈 형편이 되지 않았다. 어머니는 밤새 막내의 이마에 젖은 수건을 올려놓고 잠을 이루지 못하였다. 아버지는 부두에서 일감을 더 찾아 나섰으나 돌아올 때의 표정은 날마다 어두워졌다. 판자촌의 한 아주머니가 약을 나누어 주었고, 이웃집 할머니가 미역국을 끓여 가져다주었다. 모르는 사람들의 도움으로 막내는 보름 만에 열이 내렸으나, 그 보름 동안 어머니의 머리카락이 하얗게 세었다. 전쟁은 포탄이 떨어지는 곳에서만 일어나는 것이 아니었다. 아이의 열을 내릴 약 한 봉지를 구하지 못하는 일상이 곧 전쟁이었다."
    },
    {
      id: "p4",
      text: "휴전이 되고 서울로 돌아왔을 때, 우리가 살던 집은 반쯤 무너져 있었다. 아버지는 무너진 벽돌을 하나하나 쌓아 올렸고, 어머니는 깨진 유리창에 신문지를 붙이며 다시 살림을 시작하였다. 전쟁 전에 있던 가구와 그릇은 대부분 사라져 있었으나, 마루 밑에서 어머니의 혼수 그릇 하나가 온전한 채로 발견되었다. 어머니는 그 그릇을 두 손으로 감싸 쥐고 한참을 말없이 서 있었다. 그 모습을 바라보며 나는 처음으로 전쟁이 무엇을 앗아 갔는지를 알 것 같았다. 집과 물건이 아니라 평범하게 살아가던 시간, 그 시간을 채우던 작은 일상의 조각들이 흩어져 버린 것이었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "피난길에서 아버지가 보인 태도는 어떠하였는가?",
      answerRanges: [findRange(paragraphs, "p1", "아버지는 한 번도 뒤를 돌아보지 않았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "서술자가 엿을 세 조각으로 나누어 주었을 때 어머니의 반응은 어떠하였는가?",
      answerRanges: [findRange(paragraphs, "p2", "어머니가 고개를 돌려 눈물을 닦는 것이 보였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "막내가 아팠을 때 가족을 도와준 사람들은 누구인가?",
      answerRanges: [findRange(paragraphs, "p3", "판자촌의 한 아주머니가 약을 나누어 주었고, 이웃집 할머니가 미역국을 끓여 가져다주었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "서술자가 생각하는 진정한 전쟁의 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "아이의 열을 내릴 약 한 봉지를 구하지 못하는 일상이 곧 전쟁이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "서울로 돌아왔을 때 마루 밑에서 발견된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "어머니의 혼수 그릇 하나가 온전한 채로 발견되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "서술자가 깨달은, 전쟁이 앗아 간 것의 본질은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "평범하게 살아가던 시간, 그 시간을 채우던 작은 일상의 조각들이 흩어져 버린 것이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(32, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 33: 비문학 (NONFICTION) — 공리주의 윤리학의 쟁점 ───
function buildDay33() {
  const paragraphs = [
    {
      id: "p1",
      text: "공리주의는 행위의 도덕적 가치를 그 결과가 산출하는 행복의 총량으로 판단하는 윤리 이론이다. 18세기 후반 영국에서 체계화된 이 이론은 이후 법률과 정책 결정에 지대한 영향을 미쳤다. 제러미 벤담은 쾌락과 고통이라는 두 가지 감각이 인간 행위의 궁극적 동기라고 보았으며, 도덕적으로 올바른 행위란 최대 다수의 최대 행복을 실현하는 행위라고 정의하였다. 벤담은 쾌락의 양을 체계적으로 측정하기 위해 강도, 지속성, 확실성, 근접성, 다산성, 순수성, 범위라는 일곱 가지 기준을 제시하였다. 이 기준에 따라 모든 쾌락을 동일한 척도로 계산할 수 있다는 것이 벤담의 양적 공리주의의 핵심 주장이다. 그러나 이러한 양적 접근은 쾌락의 질적 차이를 무시한다는 비판에 직면하게 되었다."
    },
    {
      id: "p2",
      text: "존 스튜어트 밀은 벤담의 양적 공리주의를 계승하면서도, 쾌락 사이에 질적 차이가 존재한다고 주장함으로써 이론을 발전시켰다. 밀에 따르면 지적 쾌락과 도덕적 만족은 단순한 감각적 쾌락보다 본질적으로 우월하며, 두 종류의 쾌락을 모두 경험한 사람은 반드시 질적으로 높은 쾌락을 선호한다. 밀은 이를 만족한 돼지보다 불만족한 소크라테스가 낫다는 유명한 표현으로 압축하였다. 그러나 밀의 질적 공리주의에 대해서도 누가 쾌락의 질적 우열을 판단할 수 있는가라는 문제가 제기된다. 경험이 풍부한 판단자의 선호에 의존하는 밀의 해법은 결국 엘리트주의적 편향을 내포할 수 있다는 지적을 피하기 어렵다."
    },
    {
      id: "p3",
      text: "공리주의에 대한 가장 근본적인 비판 중 하나는 정의와 권리의 문제와 관련된다. 공리주의의 논리에 따르면, 다수의 행복 증가를 위해 소수의 권리를 침해하는 행위가 정당화될 수 있다. 예를 들어 한 명의 무고한 사람을 희생시킴으로써 다수의 생명을 구할 수 있는 상황에서, 공리주의는 그 희생을 도덕적으로 정당한 선택으로 평가할 수 있다. 존 롤스는 이러한 점을 비판하며, 공리주의가 개인의 권리를 사회 전체의 이익을 위한 수단으로 환원시킨다고 지적하였다. 롤스에 따르면 정의는 효용의 극대화보다 선행하는 가치이며, 각 개인은 전체의 복지를 위해서도 침해할 수 없는 불가침의 권리를 지닌다."
    },
    {
      id: "p4",
      text: "이러한 비판에 대응하여 규칙 공리주의라는 수정 이론이 등장하였다. 행위 공리주의가 개별 행위마다 효용을 계산하여 도덕적 판단을 내리는 반면, 규칙 공리주의는 사회 전체가 특정 규칙을 따를 때 산출되는 효용의 총합을 기준으로 도덕적 규칙을 설정한다. 예컨대 무고한 사람을 처벌하지 않는다는 규칙이 사회 전체적으로 더 큰 효용을 산출한다면, 개별 사안에서 그 규칙을 위반하는 것은 부도덕하다고 판단하는 것이다. 이를 통해 규칙 공리주의는 개인의 권리 보호와 효용의 극대화를 양립시키고자 한다. 그러나 규칙 공리주의 역시 규칙 간의 충돌 상황에서 어떤 규칙을 우선할 것인가라는 문제를 온전히 해결하지는 못한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "벤담이 쾌락을 측정하기 위해 제시한 기준은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "강도, 지속성, 확실성, 근접성, 다산성, 순수성, 범위라는 일곱 가지 기준을 제시하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "밀의 질적 공리주의에서 쾌락의 질적 우열을 판단하는 기준은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "두 종류의 쾌락을 모두 경험한 사람은 반드시 질적으로 높은 쾌락을 선호한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "밀의 질적 공리주의에 대해 제기되는 비판은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "엘리트주의적 편향을 내포할 수 있다는 지적을 피하기 어렵다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "존 롤스가 공리주의를 비판한 핵심 논거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "공리주의가 개인의 권리를 사회 전체의 이익을 위한 수단으로 환원시킨다고 지적하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "규칙 공리주의가 행위 공리주의와 다른 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "사회 전체가 특정 규칙을 따를 때 산출되는 효용의 총합을 기준으로 도덕적 규칙을 설정한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "규칙 공리주의가 해결하지 못한 문제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "규칙 간의 충돌 상황에서 어떤 규칙을 우선할 것인가라는 문제를 온전히 해결하지는 못한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(33, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 34: 문학 (LITERATURE) — 농촌 마을의 마지막 대장간 ───
function buildDay34() {
  const paragraphs = [
    {
      id: "p1",
      text: "마을 끝자락, 느티나무 아래에 대장간이 있었다. 김 대장은 아버지에게, 아버지는 할아버지에게 배운 솜씨로 쇠를 달구고 두드려 온갖 연장을 만들었다. 삼 대에 걸쳐 내려온 기술이었으므로, 그의 손끝에는 말로 설명할 수 없는 감각이 깃들어 있었다. 호미, 낫, 삽, 괭이, 쟁기의 날이며 부엌칼까지, 마을 사람들이 쓰는 연장은 대부분 이 대장간에서 나왔다. 아침이면 풀무에 불이 올라 검은 연기가 느티나무 사이로 피어올랐고, 쇠를 내려치는 망치 소리가 마을 전체에 울려 퍼졌다. 그 소리에 맞추어 하루가 시작되었으므로, 마을 사람들에게 대장간 망치 소리는 시계와 같았다."
    },
    {
      id: "p2",
      text: "공장에서 만든 연장이 들어오기 시작한 것은 이천 년대 초반이었다. 철물점에 가면 호미도 낫도 번쩍이는 새것이 가지런히 놓여 있었고, 값도 대장간에서 맞추는 것의 절반이 되지 않았다. 공장 연장은 모양이 일정하고 겉보기에 깔끔하였으나, 김 대장의 숙련된 눈에는 쇠의 결을 무시한 채 기계로 찍어 낸 것이 한눈에 보였다. 마을 사람들은 처음에는 미안한 표정으로, 나중에는 아무렇지 않게 공장 연장을 사들였다. 김 대장은 한마디 불평도 하지 않았으나, 풀무에 불을 올리는 시간이 조금씩 줄어들었다. 한때 아침부터 저녁까지 쉴 새 없이 달궈지던 화덕이 하루 한두 시간만 피워지다가, 나중에는 이틀에 한 번, 사흘에 한 번으로 뜸해졌다."
    },
    {
      id: "p3",
      text: "그래도 김 대장을 찾아오는 이들이 있었다. 할아버지 때부터 써 온 호미의 날을 갈아 달라는 노인, 아버지의 유품인 낫을 고쳐 달라는 이웃이 간간이 대장간 문턱을 넘었다. 김 대장은 그런 손님을 맞을 때면 유난히 정성을 들였다. 쇠를 달구는 온도, 망치를 내리치는 각도, 물에 담그는 시간까지 한 치의 소홀함도 없었다. 쇠가 벌겋게 달아오르면 집게로 집어 모루 위에 올리고, 망치를 일정한 박자로 내리쳐 형태를 잡은 뒤, 물통에 담가 식히는 과정을 여러 번 반복하였다. 수선이 끝나면 연장을 기름 먹인 깨끗한 천으로 정성스럽게 닦아 건네며 한마디를 덧붙이곤 하였다. 이 호미는 주인의 손때가 배어 있으니 공장 것보다 손에 잘 맞을 것이라고. 그 말에는 물건에 깃든 시간과 기억에 대한 존중이 담겨 있었다."
    },
    {
      id: "p4",
      text: "김 대장이 풀무질을 그만둔 것은 지난 가을이었다. 손목을 다쳐 무거운 망치를 들 수 없게 되었고, 뒤를 이을 사람도 없었다. 대장간 문을 닫던 날, 김 대장은 화덕의 재를 쓸어 모아 느티나무 아래에 뿌렸다. 수십 년 동안 쇠를 달구던 불의 마지막 흔적이 흙 위에 뿌려지는 것을 마을 사람 몇이 멀리서 바라보았으나, 다가와 말을 건네는 이는 없었다. 대장간이 사라진 뒤에도 마을의 일상은 달라진 것 없이 돌아갔다. 다만 아침마다 들려오던 망치 소리가 사라졌다는 것을, 한참이 지나서야 알아차린 사람이 하나둘 있었을 뿐이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "마을 사람들에게 대장간의 망치 소리가 지닌 의미는 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p1", "마을 사람들에게 대장간 망치 소리는 시계와 같았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "공장 연장이 들어온 뒤 대장간에 나타난 변화는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "풀무에 불을 올리는 시간이 조금씩 줄어들었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "김 대장이 수선한 연장을 건네며 덧붙인 말에 담긴 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "물건에 깃든 시간과 기억에 대한 존중이 담겨 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "김 대장이 풀무질을 그만둔 직접적인 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "손목을 다쳐 무거운 망치를 들 수 없게 되었고, 뒤를 이을 사람도 없었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "대장간 문을 닫던 날 김 대장이 한 마지막 행동은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "화덕의 재를 쓸어 모아 느티나무 아래에 뿌렸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "대장간이 사라진 뒤 마을 사람들이 뒤늦게 알아차린 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "아침마다 들려오던 망치 소리가 사라졌다는 것을, 한참이 지나서야 알아차린 사람이 하나둘 있었을 뿐이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(34, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 35: 비문학 (NONFICTION) — 인공지능의 편향성 문제 ───
function buildDay35() {
  const paragraphs = [
    {
      id: "p1",
      text: "인공지능 시스템이 사회 전반에 확산되면서, 알고리즘이 내리는 판단에 내재된 편향성 문제가 주요 쟁점으로 부상하고 있다. 인공지능의 편향성이란 학습 데이터나 알고리즘 설계 과정에서 특정 집단에 대한 차별적 결과가 체계적으로 나타나는 현상을 의미한다. 예컨대 채용 선발에 활용된 인공지능 시스템이 과거의 채용 데이터를 학습한 결과, 여성 지원자에게 불리한 평가를 내린 사례가 보고된 바 있다. 이는 과거의 채용 관행에 내재되어 있던 성별 편향이 학습 데이터를 통해 알고리즘에 그대로 반영되었기 때문이다. 이처럼 인공지능의 편향은 기술 자체의 결함이 아니라, 인간 사회에 존재하는 구조적 차별이 기술을 매개로 재생산되는 현상이라 할 수 있다."
    },
    {
      id: "p2",
      text: "인공지능 편향의 발생 원인은 크게 데이터 편향과 알고리즘 편향으로 구분할 수 있다. 데이터 편향은 학습에 사용되는 데이터가 현실을 균형 있게 반영하지 못할 때 발생한다. 특정 인종이나 성별의 데이터가 과소 대표되거나, 역사적으로 축적된 차별적 패턴이 데이터에 포함되어 있는 경우가 이에 해당한다. 알고리즘 편향은 모델의 설계 과정에서 개발자의 가치관이나 선택이 반영되면서 발생한다. 어떤 특성을 변수로 선택하고 어떤 목표를 최적화 대상으로 설정하느냐에 따라 결과의 공정성이 달라질 수 있기 때문이다. 더욱이 심층 학습 모델의 경우 내부 작동 과정이 투명하지 않아, 편향이 존재하더라도 그 원인을 파악하기 어려운 블랙박스 문제가 발생한다."
    },
    {
      id: "p3",
      text: "인공지능 편향의 사회적 위험은 알고리즘이 단순한 보조 도구를 넘어 의사 결정 권한을 갖게 될 때 더욱 심각해진다. 형사 사법 분야에서 재범 위험도를 예측하는 알고리즘이 특정 인종에 대해 체계적으로 높은 위험도를 산출한다면, 이는 사법 정의를 훼손하는 결과를 초래한다. 금융 분야에서 신용 평가 알고리즘이 특정 지역 거주자에게 불리한 판단을 내린다면, 기존의 경제적 불평등을 고착화시키는 도구가 된다. 이러한 사례들은 인공지능이 객관적이고 중립적인 판단을 내린다는 통념이 허구임을 보여 준다. 알고리즘의 판단에 권위를 부여할수록, 그 판단에 내재된 편향은 더욱 은폐되고 강화되는 역설이 발생하는 것이다."
    },
    {
      id: "p4",
      text: "인공지능 편향 문제에 대한 해결 방안은 기술적 차원과 제도적 차원에서 동시에 모색되어야 한다. 기술적으로는 학습 데이터의 대표성을 확보하고, 편향 탐지 도구를 활용하여 모델의 공정성을 정기적으로 검증하는 방법이 제안된다. 또한 설명 가능한 인공지능 기술을 개발하여 알고리즘의 판단 근거를 투명하게 공개하는 것이 중요하다. 제도적으로는 인공지능 시스템의 영향 평가를 의무화하고, 차별적 결과에 대한 법적 책임 소재를 명확히 하는 규제 체계의 마련이 필요하다. 궁극적으로 인공지능의 편향 문제는 기술의 문제인 동시에 사회의 문제이므로, 다양한 배경을 가진 구성원들이 기술 개발 과정에 참여하는 포용적 거버넌스 체계가 요구된다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "인공지능의 편향이 기술 자체의 결함이 아닌 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "인간 사회에 존재하는 구조적 차별이 기술을 매개로 재생산되는 현상이라 할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "심층 학습 모델에서 편향의 원인 파악이 어려운 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "내부 작동 과정이 투명하지 않아, 편향이 존재하더라도 그 원인을 파악하기 어려운 블랙박스 문제가 발생한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "알고리즘에 권위를 부여할수록 발생하는 역설은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "알고리즘의 판단에 권위를 부여할수록, 그 판단에 내재된 편향은 더욱 은폐되고 강화되는 역설이 발생하는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "인공지능 편향 문제의 기술적 해결 방안으로 제안되는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "학습 데이터의 대표성을 확보하고, 편향 탐지 도구를 활용하여 모델의 공정성을 정기적으로 검증하는 방법이 제안된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "제도적 차원에서 필요한 규제 체계는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "인공지능 시스템의 영향 평가를 의무화하고, 차별적 결과에 대한 법적 책임 소재를 명확히 하는 규제 체계의 마련이 필요하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "인공지능 편향 문제의 궁극적 해결을 위해 요구되는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "다양한 배경을 가진 구성원들이 기술 개발 과정에 참여하는 포용적 거버넌스 체계가 요구된다")],
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
  console.log("=== 비트겐슈타인1 Day 31~35 빌드 시작 ===\n");

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

    // 문장 마침표 검증
    for (const p of c.payload.passage.paragraphs) {
      const sents = findSentences(p.text);
      for (const s of sents) {
        if (!s.text.trim().endsWith('.')) {
          console.warn(`경고: Day ${dayNum} ${p.id} 문장이 마침표로 끝나지 않음: "${s.text.substring(0, 30)}..."`);
          allValid = false;
        }
      }
    }
  }

  if (!allValid) {
    console.error("\n검증 실패! 위의 경고를 확인하세요.");
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
