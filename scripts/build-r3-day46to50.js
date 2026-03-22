#!/usr/bin/env node
// 러셀3 Day 46~50 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE, 홀수 Day = NONFICTION
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

// ─── Day 46: 문학 (LITERATURE) ───
// 윤흥길의 「장마」에 나타난 이념 갈등과 화해 (문학평론)
function buildDay46() {
  const paragraphs = [
    {
      id: "p1",
      text: "윤흥길의 단편소설 「장마」는 한국전쟁이 한 가족 내부에 야기한 이념 갈등을 어린 화자의 시선으로 그려 낸 작품이다. 이 소설에서 친할머니와 외할머니는 각각 국군과 빨치산에 가담한 손자와 아들을 둔 인물로, 전쟁이라는 거시적 이념 대립이 가장 사적인 공간인 가정 안으로 침투하는 양상을 형상화한다. 두 할머니의 갈등은 단순한 성격 차이가 아니라 분단이 만들어 낸 구조적 적대의 축소판이며, 같은 밥상에 앉아서도 서로를 향해 저주와 기원을 동시에 쏟아 내는 이중적 태도는 이념이 혈연의 유대마저 분열시키는 현실을 극적으로 드러낸다. 이를 통해 작가는 전쟁의 폭력이 전선에서만 발생하는 것이 아니라 일상의 관계 속에서도 끊임없이 재생산됨을 보여 준다."
    },
    {
      id: "p2",
      text: "이 소설의 서사적 특징은 어린 화자의 제한된 시점을 활용한다는 점에 있다. 화자인 소년은 전쟁의 이념적 의미를 온전히 이해하지 못한 채 두 할머니 사이의 갈등을 관찰하고 보고한다. 이러한 서술 전략은 이념의 논리적 정당성을 판단하지 않으면서도 그것이 인간관계에 미치는 파괴적 영향을 감각적으로 전달하는 효과를 낳는다. 독자는 소년의 눈을 통해 이념이라는 추상적 개념이 구체적인 감정과 행동으로 전환되는 과정을 목격하게 되며, 이를 통해 전쟁의 비극성을 보다 직접적으로 체감하게 된다."
    },
    {
      id: "p3",
      text: "「장마」에서 가장 주목할 장면은 구렁이의 출현과 그에 대한 두 할머니의 반응이다. 외할머니는 구렁이를 전사한 아들의 혼령으로 인식하고, 친할머니 역시 이를 암묵적으로 수용한다. 이 장면에서 구렁이는 민속적 상상력과 결합하여 죽은 자와 산 자를 매개하는 상징물로 기능하며, 이념의 논리로는 해소할 수 없었던 갈등이 토속적 신앙의 영역에서 해소되는 과정을 보여 준다. 이는 합리적 이성의 한계를 초월하여 화해의 가능성을 모색하는 작가의 서사 전략으로, 분단 문학이 이념적 대립의 재현에 머물지 않고 그 극복의 방향을 제시할 수 있음을 시사한다."
    },
    {
      id: "p4",
      text: "「장마」의 문학사적 의의는 분단 현실을 가족이라는 미시적 단위를 통해 형상화하면서도 화해의 서사를 구축했다는 데 있다. 1970년대 분단 문학은 이념 대립의 비극성을 고발하는 데 주력하였으나, 윤흥길은 대립 너머의 공존 가능성을 탐색함으로써 분단 소설의 새로운 방향을 열었다. 작품의 제목인 장마는 전쟁이라는 재난이 언젠가는 그칠 수 있다는 희망의 은유이자, 동시에 그것이 지나간 후에도 남는 상흔에 대한 암시로 읽힌다. 또한 전쟁의 기억이 세대를 넘어 전승되는 방식에 주목함으로써, 분단이 단순한 역사적 사건이 아니라 현재적 삶을 규정하는 지속적 조건임을 환기시켰다. 이러한 성취는 이후 조정래, 전상국 등의 분단 소설에 영향을 미쳐 한국 문학의 분단 인식을 심화하는 데 기여하였다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "두 할머니의 갈등이 보여 주는 전쟁 폭력의 특성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "전쟁의 폭력이 전선에서만 발생하는 것이 아니라 일상의 관계 속에서도 끊임없이 재생산됨을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "어린 화자의 제한된 시점이 서사에서 발휘하는 효과는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "이념의 논리적 정당성을 판단하지 않으면서도 그것이 인간관계에 미치는 파괴적 영향을 감각적으로 전달하는 효과를 낳는다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "구렁이가 작품에서 수행하는 상징적 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "죽은 자와 산 자를 매개하는 상징물로 기능하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "구렁이를 통한 갈등 해소가 시사하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "분단 문학이 이념적 대립의 재현에 머물지 않고 그 극복의 방향을 제시할 수 있음을 시사한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "윤흥길이 1970년대 분단 소설에 새롭게 제시한 방향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "대립 너머의 공존 가능성을 탐색함으로써 분단 소설의 새로운 방향을 열었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "「장마」가 환기시키는 분단의 성격은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "분단이 단순한 역사적 사건이 아니라 현재적 삶을 규정하는 지속적 조건임을 환기시켰다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(46, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 47: 비문학 (NONFICTION) ───
// 행성 형성과 태양계의 구조 (천문학)
function buildDay47() {
  const paragraphs = [
    {
      id: "p1",
      text: "태양계는 약 46억 년 전 거대한 분자 구름의 중력 붕괴로부터 형성되었다. 이 분자 구름은 주로 수소와 헬륨으로 구성되어 있었으며, 초신성 폭발 등 외부 충격파에 의해 밀도가 불균일해지면서 중력 수축이 시작되었다. 수축하는 구름의 중심부에서는 물질이 집중적으로 모여 원시 태양이 형성되었고, 나머지 물질은 각운동량 보존 법칙에 따라 원반 형태로 회전하며 퍼져 나갔다. 이 원시 행성계 원반에서 먼지 입자들이 서로 충돌하고 합쳐지는 과정을 통해 점차 크기가 커져 미행성체로 성장하였으며, 이러한 미행성체들의 추가적인 합체를 통해 오늘날의 행성들이 만들어졌다."
    },
    {
      id: "p2",
      text: "태양계의 행성들은 구성 물질과 물리적 특성에 따라 크게 지구형 행성과 목성형 행성으로 구분된다. 수성, 금성, 지구, 화성으로 이루어진 지구형 행성은 태양에 가까운 내측 궤도에 위치하며, 규산염 암석과 금속으로 구성된 고체 표면을 가지고 있다. 이들이 암석질로 이루어진 이유는 원시 행성계 원반에서 태양에 가까운 영역의 높은 온도가 휘발성 물질의 응축을 방해하여, 녹는점이 높은 규산염과 금속 성분만이 고체 상태로 남아 행성의 재료가 되었기 때문이다. 반면 목성, 토성, 천왕성, 해왕성으로 구성된 목성형 행성은 태양으로부터 먼 외측 궤도에서 형성되었으며, 낮은 온도 덕분에 수소, 헬륨, 메탄, 암모니아 등 가벼운 기체와 얼음을 대량으로 포획할 수 있었다."
    },
    {
      id: "p3",
      text: "행성의 형성 과정에서 중요한 경계 개념이 설선이다. 설선은 원시 행성계 원반에서 물이 얼음으로 응축될 수 있는 온도 경계를 가리키며, 태양계에서는 현재 화성과 목성 궤도 사이에 위치하는 것으로 추정된다. 설선 바깥에서는 얼음이 고체 상태로 존재할 수 있으므로 행성 형성의 재료가 풍부해지고, 이에 따라 핵이 빠르게 성장하여 주변의 기체를 대량으로 끌어들이는 거대 가스 행성이 탄생할 수 있었다. 설선 안쪽에서는 고체 재료가 상대적으로 부족하여 행성의 크기가 작게 유지되었으며, 이것이 지구형 행성과 목성형 행성 사이의 크기 차이를 설명하는 핵심 요인이다."
    },
    {
      id: "p4",
      text: "현대 행성 과학은 행성들이 현재의 궤도에서 그대로 형성된 것이 아니라 형성 이후 궤도가 변화하였다는 행성 이동 이론을 제시한다. 니스 모형에 따르면 목성과 토성이 형성 초기에 궤도 공명 상태에 진입하면서 외측 행성들의 궤도를 크게 교란하였고, 이 과정에서 천왕성과 해왕성이 현재 위치로 밀려났다. 이 이론은 카이퍼 벨트의 구조와 후기 대폭격기라 불리는 소행성 충돌의 증거를 설명할 수 있어 널리 받아들여지고 있다. 행성 이동 이론의 발전은 태양계가 정적인 구조가 아니라 역동적 진화의 산물임을 보여 주며, 다른 항성계의 행성 배치를 이해하는 데에도 중요한 이론적 틀을 제공한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "원시 행성계 원반에서 미행성체가 형성된 과정은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "먼지 입자들이 서로 충돌하고 합쳐지는 과정을 통해 점차 크기가 커져 미행성체로 성장하였으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "지구형 행성이 암석질로 이루어진 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "태양에 가까운 영역의 높은 온도가 휘발성 물질의 응축을 방해하여, 녹는점이 높은 규산염과 금속 성분만이 고체 상태로 남아 행성의 재료가 되었기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "설선의 정의와 태양계에서의 위치는 어떠한가?",
      answerRanges: [findRange(paragraphs, "p3", "물이 얼음으로 응축될 수 있는 온도 경계를 가리키며, 태양계에서는 현재 화성과 목성 궤도 사이에 위치하는 것으로 추정된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "설선이 지구형 행성과 목성형 행성의 크기 차이를 설명하는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "설선 안쪽에서는 고체 재료가 상대적으로 부족하여 행성의 크기가 작게 유지되었으며, 이것이 지구형 행성과 목성형 행성 사이의 크기 차이를 설명하는 핵심 요인이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "니스 모형이 널리 받아들여지는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "카이퍼 벨트의 구조와 후기 대폭격기라 불리는 소행성 충돌의 증거를 설명할 수 있어 널리 받아들여지고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "행성 이동 이론이 보여 주는 태양계의 본질은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "태양계가 정적인 구조가 아니라 역동적 진화의 산물임을 보여 주며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(47, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 48: 문학 (LITERATURE) ───
// 한국 현대시에서 정지용의 감각적 이미지즘 (문학평론)
function buildDay48() {
  const paragraphs = [
    {
      id: "p1",
      text: "정지용은 한국 현대시사에서 감각적 이미지의 시학을 개척한 시인으로 평가된다. 그는 1920년대 후반부터 1930년대에 걸쳐 활동하면서, 당시 한국 시단을 지배하던 감상적 낭만주의와 관념적 추상의 경향을 극복하고 구체적인 감각 경험에 기반한 시적 언어를 탐구하였다. 정지용이 추구한 이미지즘은 사물의 외적 형상을 정밀하게 포착하여 언어로 재현하는 것으로, 시인의 감정을 직접 토로하기보다 객관적 사물의 이미지를 통해 정서를 환기하는 방법이었다. 이러한 시적 방법론은 영미 이미지즘 시운동의 영향과 함께, 한국어의 음성적 특질을 활용한 독자적 언어 감각의 결합에서 비롯된 것이었다. 정지용은 시의 언어가 의미 전달의 수단에 머물지 않고 그 자체로 감각적 대상이 되어야 한다고 보았다."
    },
    {
      id: "p2",
      text: "정지용의 대표작 「유리창」은 감각적 이미지즘의 성취를 보여 주는 작품이다. 이 시에서 유리에 차고 슬픈 것이 어른거린다는 표현은 시각과 촉각의 공감각적 결합을 통해 상실의 정서를 형상화한다. 시인은 유리창에 입김을 불어 서리를 녹이는 행위를 묘사하면서, 죽은 아이에 대한 그리움이라는 내면의 감정을 직접 진술하지 않고 물질적 행위의 묘사를 통해 간접적으로 전달한다. 이처럼 정지용은 감정의 직접적 표출을 억제하고 감각적 대상물에 정서를 투사하는 기법을 활용하였는데, 이는 T. S. 엘리엇이 말한 객관적 상관물의 원리와 상통하는 것이었다."
    },
    {
      id: "p3",
      text: "정지용 시의 또 다른 특징은 한국어의 음성적 자질을 극대화한 언어 운용에 있다. 그는 의성어와 의태어를 시적 언어로 적극 활용하였으며, 모음의 개폐와 자음의 강약을 조절하여 시행 자체가 대상의 움직임이나 질감을 재현하도록 하였다. 「바다」 연작에서 바다의 파도가 출렁이는 리듬은 문장의 호흡과 음절의 배치를 통해 구현되며, 독자는 시를 읽는 행위 자체에서 바다의 감각적 경험을 재구성하게 된다. 이러한 언어적 실험은 번역 불가능한 한국어 고유의 시적 가능성을 탐구한 것으로, 정지용이 단순한 서구 이미지즘의 수용자가 아니라 한국어 시학의 독자적 개척자였음을 입증한다."
    },
    {
      id: "p4",
      text: "정지용이 한국 현대시사에 미친 영향은 광범위하다. 그는 감각적 정밀성과 언어적 절제를 시의 핵심 덕목으로 확립함으로써, 이후 박목월, 조지훈, 박두진 등 청록파 시인들의 자연 서정시에 직접적인 영향을 주었다. 또한 시적 언어가 일상 언어와 구별되는 고유한 질서를 가져야 한다는 그의 시론은 김춘수의 무의미시 탐구에도 이론적 토대를 제공하였다. 그러나 정지용의 감각적 이미지즘은 사회적 현실의 모순에 대한 비판 의식이 부족하다는 점에서 현실 참여의 측면에서 한계가 있다는 비판도 제기되었으며, 이러한 긴장은 이후 한국 시에서 순수와 참여 사이의 논쟁으로 이어지게 되었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "정지용이 극복하고자 한 당시 한국 시단의 경향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "감상적 낭만주의와 관념적 추상의 경향을 극복하고 구체적인 감각 경험에 기반한 시적 언어를 탐구하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「유리창」에서 상실의 정서를 형상화하는 기법은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "시각과 촉각의 공감각적 결합을 통해 상실의 정서를 형상화한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "정지용의 감정 표현 기법이 상통하는 서양 문학 이론은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "T. S. 엘리엇이 말한 객관적 상관물의 원리와 상통하는 것이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "정지용의 언어적 실험이 입증하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "정지용이 단순한 서구 이미지즘의 수용자가 아니라 한국어 시학의 독자적 개척자였음을 입증한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "정지용의 시론이 김춘수에게 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "김춘수의 무의미시 탐구에도 이론적 토대를 제공하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "정지용의 감각적 이미지즘에 대해 제기된 비판은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "현실 참여의 측면에서 한계가 있다는 비판도 제기되었으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(48, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 49: 비문학 (NONFICTION) ───
// 공유지의 비극과 집단 행동 문제 (경제학/사회학)
function buildDay49() {
  const paragraphs = [
    {
      id: "p1",
      text: "공유지의 비극은 1968년 생태학자 개릿 하딘이 제시한 개념으로, 공동 소유의 자원이 개인의 이기적 이용에 의해 고갈되는 현상을 설명한다. 하딘은 공동 목초지를 예로 들어, 각 목축업자가 자신의 이익을 극대화하기 위해 가축 수를 늘리면 결국 목초지가 황폐화되어 모든 사용자가 손해를 입게 된다고 주장하였다. 이 모형에서 개인의 합리적 선택이 집단 전체에는 비합리적 결과를 초래하는 이유는, 자원 이용의 이익은 개인에게 귀속되는 반면 과잉 이용의 비용은 전체 구성원에게 분산되기 때문이다. 이러한 비용과 이익의 비대칭적 구조가 자원의 지속 가능한 관리를 어렵게 만드는 핵심 요인이다."
    },
    {
      id: "p2",
      text: "공유지의 비극은 경제학에서 집단 행동 문제라는 보다 넓은 범주에 속한다. 맨서 올슨은 집단 행동의 논리에서, 집단의 공동 이익을 위한 행동에 개인이 자발적으로 참여할 유인이 부족하다는 무임승차 문제를 분석하였다. 무임승차 문제란 공공재의 혜택이 비배제적이어서, 비용을 부담하지 않은 구성원도 동일한 혜택을 누릴 수 있기 때문에 자발적 기여를 회피하려는 경향이 발생하는 것을 말한다. 올슨은 집단의 규모가 커질수록 개인의 기여가 전체 결과에 미치는 영향이 작아지므로 무임승차의 유인이 강화되며, 따라서 대규모 집단에서 자발적 협력이 달성되기 더욱 어렵다고 논증하였다."
    },
    {
      id: "p3",
      text: "하딘은 공유지의 비극에 대한 해결책으로 사유화 또는 정부 규제를 제안하였으나, 엘리너 오스트롬은 이 이분법적 접근을 비판하며 제3의 대안을 제시하였다. 오스트롬은 세계 각지의 공유 자원 관리 사례를 연구하여, 이용자 공동체가 자율적으로 규칙을 수립하고 상호 감시를 통해 공유 자원을 지속 가능하게 관리할 수 있음을 입증하였다. 그녀가 제시한 성공적 공유 자원 관리의 조건에는 자원 경계의 명확한 설정, 이용 규칙에 대한 구성원의 참여적 결정, 위반에 대한 점진적 제재, 저비용의 분쟁 해결 기제 등이 포함된다. 이 연구는 국가와 시장이라는 전통적 이분법을 넘어 공동체적 자치의 가능성을 실증적으로 보여 주었다."
    },
    {
      id: "p4",
      text: "공유지의 비극과 집단 행동 문제는 오늘날 기후 변화, 해양 자원 남획, 대기 오염 등 전 지구적 환경 문제에서도 핵심적인 분석 틀로 활용된다. 지구의 대기와 해양은 사실상 국제적 공유 자원이며, 개별 국가의 이기적 이용이 전체 환경의 악화를 초래하는 구조는 하딘의 모형과 정확히 일치한다. 그러나 국제 사회에는 강제력을 지닌 상위 권위체가 존재하지 않으므로, 오스트롬이 제시한 자치적 관리 원칙을 국제 협력의 맥락에 적용하려는 시도가 활발히 진행되고 있다. 이처럼 공유지의 비극에 대한 이론적 논의는 단순한 경제학적 분석을 넘어 인류의 지속 가능한 공존을 위한 제도 설계의 근본적 과제와 연결되어 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "공유지의 비극에서 자원의 지속 가능한 관리를 어렵게 만드는 핵심 요인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "비용과 이익의 비대칭적 구조가 자원의 지속 가능한 관리를 어렵게 만드는 핵심 요인이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "무임승차 문제가 발생하는 근본적 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "공공재의 혜택이 비배제적이어서, 비용을 부담하지 않은 구성원도 동일한 혜택을 누릴 수 있기 때문에 자발적 기여를 회피하려는 경향이 발생하는 것을 말한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "올슨에 따르면 대규모 집단에서 자발적 협력이 더 어려운 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "집단의 규모가 커질수록 개인의 기여가 전체 결과에 미치는 영향이 작아지므로 무임승차의 유인이 강화되며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "오스트롬이 입증한 공유 자원 관리의 제3의 대안은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "이용자 공동체가 자율적으로 규칙을 수립하고 상호 감시를 통해 공유 자원을 지속 가능하게 관리할 수 있음을 입증하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "오스트롬의 연구가 전통적 이분법을 넘어 보여 준 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "국가와 시장이라는 전통적 이분법을 넘어 공동체적 자치의 가능성을 실증적으로 보여 주었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "공유지의 비극에 대한 이론적 논의가 궁극적으로 연결되는 과제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "인류의 지속 가능한 공존을 위한 제도 설계의 근본적 과제와 연결되어 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(49, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 50: 문학 (LITERATURE) ───
// 이문구의 농촌 소설에 나타난 언어적 특성 (문학평론)
function buildDay50() {
  const paragraphs = [
    {
      id: "p1",
      text: "이문구는 한국 현대 소설에서 농촌의 삶과 언어를 가장 충실하게 형상화한 작가로 평가된다. 그의 소설 세계는 충남 보령 지역을 중심으로 한 농촌 공동체의 해체 과정을 다루고 있으며, 이 과정에서 농민들이 사용하는 토속적 방언과 구어체를 문학적 언어로 격상시킨 것이 그의 가장 두드러진 성취이다. 이문구가 소설에 도입한 충청도 사투리는 단순한 지역색의 재현을 넘어, 농민들의 세계 인식 방식과 정서적 감수성을 담지하는 매체로 기능한다. 방언은 표준어로는 포착할 수 없는 삶의 결을 전달하며, 이를 통해 독자는 농촌 공동체의 내밀한 정서에 접근할 수 있게 된다."
    },
    {
      id: "p2",
      text: "이문구 소설의 언어적 특성은 구술성의 문자화라는 관점에서 이해할 수 있다. 그의 서술 방식은 마을 어른이 이야기를 들려주는 듯한 구연적 어조를 취하며, 문장의 리듬과 호흡이 실제 말하기의 패턴을 반영한다. 이러한 구술적 서술은 인쇄 매체를 통해 전달되면서도 구어의 현장감과 생동감을 유지하는 독특한 효과를 창출한다. 특히 그의 대표작 「관촌수필」 연작에서 화자는 고향 마을의 인물들과 사건들을 회상하면서, 마치 독자와 대면하여 이야기를 나누는 듯한 친밀한 서술 태도를 보여 준다. 이러한 구술적 서사 전략은 농촌 공동체가 지닌 이야기 문화의 전통을 소설 형식 안에 수용한 것으로 평가된다."
    },
    {
      id: "p3",
      text: "이문구의 소설에서 언어는 농촌 공동체의 해체를 증언하는 도구이기도 하다. 산업화와 도시화의 물결 속에서 전통적 농촌 공동체가 와해되는 과정은, 그 공동체의 언어가 사라져 가는 과정과 병행하여 서술된다. 젊은 세대가 도시로 떠나면서 마을의 고유한 언어와 관습이 단절되는 양상은, 물질적 빈곤 이상의 문화적 상실을 의미한다. 이문구는 이러한 언어적 소멸을 문학적으로 기록함으로써, 소설이 사라져 가는 삶의 양식을 보존하는 문화적 기억의 장으로 기능할 수 있음을 보여 주었다. 그의 소설은 근대화의 그늘에서 소외된 존재들의 목소리를 복원하는 행위이자, 잊혀져 가는 언어에 대한 문학적 애도의 성격을 지닌다."
    },
    {
      id: "p4",
      text: "이문구의 문학사적 의의는 농촌 소설의 미학적 가능성을 확장한 데 있다. 그 이전의 농촌 소설이 주로 농민의 경제적 궁핍이나 사회적 모순을 고발하는 데 치중하였다면, 이문구는 농촌의 언어와 문화 자체를 소설적 탐구의 대상으로 삼았다. 이를 통해 농촌 소설은 사회 비판의 도구에서 문화적 정체성의 탐구로 그 지평을 넓히게 되었다. 또한 그의 언어적 실험은 한국어의 표현 가능성을 확장하였으며, 이후 성석제, 김주영 등의 토속적 서사에 영향을 미쳤다. 이문구가 추구한 문학적 방언의 미학은 표준어 중심의 문학 언어에 대한 의미 있는 대안을 제시한 것으로 평가된다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "이문구 소설에서 방언이 수행하는 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "농민들의 세계 인식 방식과 정서적 감수성을 담지하는 매체로 기능한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "이문구의 구술적 서사 전략이 수용한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "농촌 공동체가 지닌 이야기 문화의 전통을 소설 형식 안에 수용한 것으로 평가된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "농촌 공동체의 언어가 사라져 가는 과정이 의미하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "물질적 빈곤 이상의 문화적 상실을 의미한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "이문구가 언어적 소멸을 문학적으로 기록함으로써 보여 준 소설의 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "소설이 사라져 가는 삶의 양식을 보존하는 문화적 기억의 장으로 기능할 수 있음을 보여 주었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이문구가 기존 농촌 소설과 달리 소설적 탐구의 대상으로 삼은 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "농촌의 언어와 문화 자체를 소설적 탐구의 대상으로 삼았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이문구의 문학적 방언의 미학이 제시한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "표준어 중심의 문학 언어에 대한 의미 있는 대안을 제시한 것으로 평가된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(50, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  // 정독 타임라인 자동 생성
  const timeline = buildTimeline(paragraphs);
  // 복기 카드 8장
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
  console.log("=== 러셀3 Day 46~50 빌드 시작 ===\n");

  const contents = [
    buildDay46(),
    buildDay47(),
    buildDay48(),
    buildDay49(),
    buildDay50()
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

  const dayIndices = [46, 47, 48, 49, 50];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1; // items[45]~items[49]
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
