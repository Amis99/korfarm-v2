#!/usr/bin/env node
// 비트겐슈타인2 Day 31~35 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION, 짝수 Day = LITERATURE
// 목표 글자수: 1500자 ±50 (1450~1550)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-wittgenstein2.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/wittgenstein2');

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

// ─── Day 31: 비문학 (NONFICTION) — 열역학 제2법칙과 엔트로피 ───
function buildDay31() {
  const paragraphs = [
    {
      id: "p1",
      text: "열역학 제2법칙은 자연 현상의 방향성을 규정하는 물리학의 근본 원리이다. 이 법칙에 따르면, 고립된 계에서 엔트로피는 항상 증가하거나 일정하게 유지될 뿐 자발적으로 감소하지 않는다. 엔트로피란 계의 무질서도 또는 미시 상태의 수를 나타내는 물리량으로, 루돌프 클라우지우스가 1865년에 처음 도입한 개념이다. 열은 항상 고온의 물체에서 저온의 물체로 이동하며, 이 과정을 외부의 일 없이 역전시키는 것은 불가능하다. 예컨대 뜨거운 커피가 저절로 식는 것은 자연스러운 과정이지만, 식은 커피가 스스로 다시 뜨거워지는 일은 결코 일어나지 않는다. 이러한 비가역성은 시간의 화살이라는 개념과 밀접하게 연결되어 있으며, 물리 법칙이 시간 대칭적임에도 불구하고 자연 현상이 특정한 방향으로만 진행되는 이유를 설명하는 핵심 원리이다."
    },
    {
      id: "p2",
      text: "엔트로피 개념은 루트비히 볼츠만에 의해 통계역학적 해석을 얻으면서 그 의미가 한층 깊어졌다. 볼츠만은 엔트로피를 거시 상태에 대응하는 미시 상태의 수에 대한 로그값으로 정의하였으며, 이를 수식으로 표현한 것이 유명한 볼츠만 공식이다. 이 해석에 따르면, 엔트로피의 증가란 계가 가능한 미시 상태 가운데 가장 확률이 높은 배열로 이행하는 것에 다름 아니다. 예컨대 방 한쪽에 모여 있던 기체 분자들이 방 전체로 퍼져나가는 현상은 분자들이 균일하게 분포된 상태가 압도적으로 더 많은 미시 상태에 대응하기 때문이다. 이처럼 볼츠만의 통계역학적 관점은 열역학 제2법칙을 확률의 법칙으로 재해석함으로써, 엔트로피 감소가 원리적으로 불가능한 것이 아니라 확률적으로 극히 희박한 사건임을 보여 주었다."
    },
    {
      id: "p3",
      text: "열역학 제2법칙은 물리학을 넘어 다양한 학문 분야에 영향을 미쳤다. 정보 이론에서 클로드 섀넌은 정보의 불확실성을 측정하는 척도로 정보 엔트로피 개념을 도입하였는데, 이는 열역학적 엔트로피와 수학적으로 동일한 구조를 지닌다. 생물학에서는 생명체가 국소적으로 엔트로피를 감소시키면서 고도로 질서화된 구조를 유지하는 존재라는 해석이 제시되었다. 에르빈 슈뢰딩거는 저서 「생명이란 무엇인가」에서 생명체가 환경으로부터 음의 엔트로피를 섭취하여 자체의 질서를 유지한다고 서술하였다. 이러한 관점에서 생명 현상은 열역학 제2법칙에 위배되는 것이 아니라, 외부 환경의 엔트로피를 증가시키는 대가로 국소적 질서를 유지하는 열린계의 현상으로 이해된다."
    },
    {
      id: "p4",
      text: "열역학 제2법칙은 우주의 궁극적 운명에 관한 논의와도 연결된다. 우주 전체를 하나의 고립계로 간주할 경우, 엔트로피는 지속적으로 증가하여 최종적으로 열적 평형 상태에 도달하게 되는데, 이를 열죽음 가설이라 한다. 열죽음 상태에서는 우주 전체의 온도가 균일해져 에너지의 흐름이 소멸하고, 따라서 어떠한 역학적 과정도 일어날 수 없게 된다. 이 가설은 19세기 후반 켈빈 경과 헬름홀츠에 의해 처음 제기되었으며, 우주의 종말에 관한 과학적 논의의 출발점이 되었다. 그러나 현대 우주론에서는 우주의 가속 팽창과 암흑 에너지의 존재가 열죽음 시나리오를 보다 복잡하게 만들고 있으며, 엔트로피의 궁극적 한계에 대한 논의는 여전히 진행 중이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "열역학 제2법칙이 규정하는 자연 현상의 핵심 특성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "고립된 계에서 엔트로피는 항상 증가하거나 일정하게 유지될 뿐 자발적으로 감소하지 않는다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "볼츠만의 통계역학적 해석에서 엔트로피 증가의 본질은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "계가 가능한 미시 상태 가운데 가장 확률이 높은 배열로 이행하는 것에 다름 아니다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "볼츠만의 관점이 열역학 제2법칙에 대해 보여준 새로운 이해는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "엔트로피 감소가 원리적으로 불가능한 것이 아니라 확률적으로 극히 희박한 사건임을 보여 주었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "슈뢰딩거가 제시한 생명체의 질서 유지 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "생명체가 환경으로부터 음의 엔트로피를 섭취하여 자체의 질서를 유지한다고 서술하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "열죽음 상태에서 우주에 일어나는 결과는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "우주 전체의 온도가 균일해져 에너지의 흐름이 소멸하고, 따라서 어떠한 역학적 과정도 일어날 수 없게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "현대 우주론에서 열죽음 시나리오를 복잡하게 만드는 요인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "우주의 가속 팽창과 암흑 에너지의 존재가 열죽음 시나리오를 보다 복잡하게 만들고 있으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(31, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 32: 문학 (LITERATURE) — 한국 현대시에서 서정주의 생명 시학 ───
function buildDay32() {
  const paragraphs = [
    {
      id: "p1",
      text: "서정주는 한국 현대시사에서 생명의 원초적 역동성을 시적 언어로 형상화한 대표적 시인으로 평가된다. 그의 초기 시집 「화사집」은 뱀과 같은 원시적 생명체의 이미지를 전면에 내세우면서, 인간 존재의 본능적 욕망과 생명 에너지를 거침없이 표현하였다. 서정주가 구사한 시적 언어는 당시 한국 시단에서 주류를 이루던 감상적 서정이나 이념적 목적시와는 뚜렷이 구별되는 것이었다. 그의 시에서 생명은 도덕적 가치 판단 이전의 원초적 힘으로 제시되며, 이러한 생명력의 긍정은 니체의 디오니소스적 세계관과의 유사성이 지적되기도 한다. 서정주는 생명의 어두운 충동과 밝은 활력을 동시에 포착하면서, 인간 존재의 근원적 조건에 대한 시적 탐구를 시도하였다."
    },
    {
      id: "p2",
      text: "서정주의 시적 전환점은 「귀촉도」를 거쳐 「신라초」에 이르는 과정에서 나타난다. 초기의 원시적 생명 충동은 점차 한국 전통 문화와 역사적 상상력으로 승화되면서, 신라라는 고대 왕국의 미학적 세계를 시적 공간으로 구축하기에 이르렀다. 서정주는 신라의 화랑 정신, 불교 문화, 토착적 자연 감각을 자신의 생명 시학과 결합하여, 한국적 미의식의 원형을 탐색하였다. 이 과정에서 그의 시어는 일상적 언어로부터 벗어나 고어와 한자어, 토속적 방언을 혼용하는 독특한 문체를 형성하였다. 이러한 언어적 실험은 한국어가 지닌 음악적 가능성을 극한까지 탐색한 것으로, 서정주의 시가 읽힐 때 발생하는 독특한 리듬과 음향 효과는 한국 현대시의 언어적 성취를 대표하는 것으로 평가된다."
    },
    {
      id: "p3",
      text: "「국화 옆에서」는 서정주의 생명 시학이 원숙한 경지에 도달한 작품으로 널리 알려져 있다. 이 시에서 국화가 피기까지의 과정은 소쩍새의 울음, 천둥, 무서리 등 자연의 고통스러운 시련을 거치는 것으로 묘사되며, 이는 아름다움의 완성이 고난의 축적 위에서만 가능하다는 인식을 형상화한 것이다. 국화의 개화는 단순한 자연 현상의 묘사가 아니라, 존재가 시련을 통해 자기 완성에 이르는 과정에 대한 비유로 읽힌다. 이 작품에서 서정주는 생명의 역동성을 긍정하되, 그것이 고통과 인내를 수반하는 과정임을 동시에 보여줌으로써 초기의 원시적 생명 충동과는 질적으로 다른 깊이를 획득하였다. 또한 이 시의 마지막 연에서 누나와 같은 친밀한 호칭으로 국화를 부르는 대목은 자연과 인간 사이의 정서적 교감을 암시하며, 서정주 특유의 따뜻한 서정적 어조를 잘 드러낸다."
    },
    {
      id: "p4",
      text: "서정주의 시 세계에 대한 평가는 한국 문학사에서 가장 첨예한 논쟁 가운데 하나를 형성하고 있다. 미학적 관점에서 그의 시는 한국어의 음악성과 서정적 가능성을 최고도로 구현한 성취로 인정받으며, 생명의 원초적 에너지에서 문화적 원형의 탐색에 이르는 시적 여정은 한국 현대시의 깊이를 한 차원 확장한 것으로 평가된다. 그러나 일제 강점기와 군사 정권 시기에 보여준 그의 정치적 행보는 예술적 성취와 윤리적 책임 사이의 관계에 대한 근본적 질문을 제기한다. 이 논쟁은 시인의 삶과 작품을 분리하여 평가할 수 있는가라는 문학 이론의 핵심적 쟁점과 연결되어 있으며, 서정주의 사례는 이 문제에 대한 단일한 해답이 존재하지 않음을 보여준다. 한국 문학사에서 서정주의 위상은 이러한 긴장 속에서 지속적으로 재평가되고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "서정주 초기 시에서 생명이 제시되는 방식은 어떠한가?",
      answerRanges: [findRange(paragraphs, "p1", "생명은 도덕적 가치 판단 이전의 원초적 힘으로 제시되며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "서정주가 신라를 시적 공간으로 구축하며 탐색한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "한국적 미의식의 원형을 탐색하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "서정주의 독특한 문체를 형성하는 언어적 특성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "고어와 한자어, 토속적 방언을 혼용하는 독특한 문체를 형성하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "「국화 옆에서」에서 국화의 개화가 비유하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "존재가 시련을 통해 자기 완성에 이르는 과정에 대한 비유로 읽힌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "서정주의 정치적 행보가 제기하는 문학 이론의 핵심 쟁점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "시인의 삶과 작품을 분리하여 평가할 수 있는가라는 문학 이론의 핵심적 쟁점과 연결되어 있으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "한국 문학사에서 서정주의 위상이 재평가되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "서정주의 사례는 이 문제에 대한 단일한 해답이 존재하지 않음을 보여준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(32, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 33: 비문학 (NONFICTION) — 롤스의 정의론과 무지의 베일 ───
function buildDay33() {
  const paragraphs = [
    {
      id: "p1",
      text: "존 롤스는 1971년 저서 「정의론」에서 공정으로서의 정의라는 개념을 체계적으로 제시하였다. 롤스의 정의론은 사회 계약론의 전통을 현대적으로 재구성한 것으로, 사회의 기본 구조를 규율하는 정의의 원칙이 어떤 조건 하에서 합의될 수 있는지를 탐구한다. 그가 제시한 핵심적 방법론적 장치는 원초적 입장과 무지의 베일이다. 원초적 입장이란 정의의 원칙을 선택하는 가상의 상황을 가리키며, 무지의 베일이란 이 상황에서 합의 참여자들이 자신의 사회적 지위, 재능, 성별, 인종 등 개인적 특성에 대한 정보를 전혀 알지 못하는 조건을 의미한다. 롤스는 이러한 무지의 상태에서 합리적 개인들이 선택하는 원칙이야말로 공정한 정의의 원칙이 될 수 있다고 주장하였다."
    },
    {
      id: "p2",
      text: "무지의 베일 아래에서 합리적 개인들이 선택하게 되는 정의의 원칙은 두 가지로 구성된다. 제1원칙은 모든 사람에게 기본적 자유가 평등하게 보장되어야 한다는 평등한 자유의 원칙이다. 여기서 기본적 자유란 사상과 양심의 자유, 정치적 참여의 자유, 신체의 자유 등을 포함한다. 제2원칙은 사회적·경제적 불평등이 허용되는 조건을 규정하는 것으로, 차등의 원칙과 공정한 기회 균등의 원칙으로 구성된다. 차등의 원칙은 사회적·경제적 불평등이 사회의 가장 불리한 처지에 있는 구성원에게 최대의 이익을 가져다주는 경우에만 정당화될 수 있다는 것이다. 이 원칙은 불평등 자체를 부정하는 것이 아니라, 불평등이 정당화되기 위한 도덕적 조건을 제시한다는 점에서 평등주의와 자유주의를 절충하는 독특한 위치를 차지한다."
    },
    {
      id: "p3",
      text: "롤스의 정의론에 대한 비판은 다양한 방향에서 제기되었다. 자유지상주의 진영에서 로버트 노직은 롤스의 차등 원칙이 개인의 정당한 소유권을 침해한다고 비판하였다. 노직에 따르면, 정당한 과정을 통해 획득한 재산에 대한 재분배는 개인의 자유에 대한 부당한 침해이며, 정의란 분배의 결과가 아니라 과정의 정당성에 의해 판단되어야 한다. 반면 공동체주의 진영에서 마이클 샌델은 무지의 베일이라는 장치 자체에 의문을 제기하였다. 샌델은 자신의 정체성을 구성하는 모든 특성으로부터 분리된 추상적 자아란 실제로 존재할 수 없으며, 정의의 원칙은 구체적인 공동체의 역사와 전통 속에서 형성되어야 한다고 주장하였다. 이러한 비판은 롤스의 보편주의적 접근이 개인과 공동체의 구체적 현실을 충분히 반영하지 못한다는 문제를 제기한다."
    },
    {
      id: "p4",
      text: "롤스의 정의론이 현대 정치철학에 미친 영향은 지대하다. 그의 이론은 복지 국가의 정당성을 철학적으로 뒷받침하는 논거로 활용되었으며, 사회적 약자에 대한 우선적 배려가 정의의 요구임을 논증하였다. 또한 롤스의 방법론은 법학, 경제학, 교육학 등 다양한 학문 분야에서 규범적 분석의 틀로 채택되었다. 그러나 롤스 자신도 「정치적 자유주의」에서 자신의 이론을 수정하여, 정의의 원칙이 포괄적인 형이상학적 교리가 아니라 합당한 다원주의 사회에서의 정치적 합의에 기반해야 한다는 입장으로 전환하였다. 이러한 이론적 발전은 정의의 원칙이 다양한 가치관이 공존하는 현대 민주주의 사회에서 어떻게 정당화될 수 있는가라는 질문에 대한 롤스의 심화된 응답이라 할 수 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "무지의 베일이란 구체적으로 어떤 조건을 의미하는가?",
      answerRanges: [findRange(paragraphs, "p1", "합의 참여자들이 자신의 사회적 지위, 재능, 성별, 인종 등 개인적 특성에 대한 정보를 전혀 알지 못하는 조건을 의미한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "차등의 원칙에서 사회적·경제적 불평등이 정당화되는 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "사회의 가장 불리한 처지에 있는 구성원에게 최대의 이익을 가져다주는 경우에만 정당화될 수 있다는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "노직이 롤스의 차등 원칙을 비판하는 핵심 근거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "정당한 과정을 통해 획득한 재산에 대한 재분배는 개인의 자유에 대한 부당한 침해이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "샌델이 무지의 베일에 대해 제기하는 비판의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "자신의 정체성을 구성하는 모든 특성으로부터 분리된 추상적 자아란 실제로 존재할 수 없으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "롤스가 「정치적 자유주의」에서 수정한 자신의 입장은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "정의의 원칙이 포괄적인 형이상학적 교리가 아니라 합당한 다원주의 사회에서의 정치적 합의에 기반해야 한다는 입장으로 전환하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "롤스의 이론이 복지 국가에 대해 논증한 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "사회적 약자에 대한 우선적 배려가 정의의 요구임을 논증하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(33, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 34: 문학 (LITERATURE) — 카프카의 「변신」에 나타난 소외 의식 ───
function buildDay34() {
  const paragraphs = [
    {
      id: "p1",
      text: "프란츠 카프카의 중편 소설 「변신」은 어느 날 아침 갑자기 거대한 벌레로 변해 버린 여행 세일즈맨 그레고르 잠자의 이야기를 다룬 작품이다. 이 소설은 1915년에 발표된 이후 20세기 문학의 가장 중요한 작품 가운데 하나로 평가받아 왔으며, 근대 사회에서 인간이 경험하는 소외의 문제를 극단적인 상황 설정을 통해 형상화한 것으로 해석된다. 카프카는 인간이 벌레로 변한다는 비현실적 사건을 아무런 설명 없이 소설의 첫 문장에서 제시하면서, 독자에게 이 변신의 원인이 아니라 그 결과가 가져오는 존재론적 의미에 주목할 것을 요구한다. 그레고르의 변신은 생물학적 사건이 아니라, 이미 소외되어 있던 인간의 상태가 물리적으로 가시화된 것이라는 점에서 알레고리적 성격을 지닌다."
    },
    {
      id: "p2",
      text: "그레고르의 소외는 무엇보다 노동과 가족 관계의 차원에서 드러난다. 변신 이전에도 그레고르는 가족의 빚을 갚기 위해 자신이 싫어하는 여행 세일즈맨 일을 계속하면서, 자신의 욕망과 감정을 억압한 채 경제적 기능만을 수행하는 존재로 살아왔다. 그는 가족을 위해 헌신하지만 그 헌신은 진정한 인간적 관계가 아니라 경제적 교환의 논리에 의해 매개되는 것이다. 변신 이후 경제적 기능을 상실한 그레고르에 대한 가족의 태도 변화는 이러한 관계의 본질을 노골적으로 드러낸다. 처음에는 당혹감과 동정을 보이던 가족은 점차 그레고르를 짐스러운 존재로 인식하기 시작하며, 결국 여동생 그레테마저 그를 더 이상 오빠로 인정하지 않겠다고 선언한다. 이 과정은 인간관계가 경제적 유용성에 의해 규정되는 근대 사회의 비인간적 구조를 적나라하게 폭로하는 것이다."
    },
    {
      id: "p3",
      text: "「변신」의 서술 기법은 소외의 주제를 강화하는 중요한 역할을 수행한다. 카프카는 이 극단적인 상황을 마치 일상적 사건을 기록하듯 건조하고 사무적인 문체로 서술한다. 그레고르가 벌레로 변한 아침, 그의 첫 번째 걱정은 자신의 존재론적 상태가 아니라 회사에 지각하게 되었다는 사실이다. 이러한 건조한 서술은 비정상적 상황과 정상적 반응 사이의 극적인 괴리를 만들어내며, 이 괴리 자체가 근대인의 소외된 의식을 형상화하는 장치로 기능한다. 또한 소설 전체가 그레고르의 내면적 시점에서 서술되면서도, 정작 그의 내면에 대한 깊이 있는 심리적 탐구는 이루어지지 않는데, 이는 소외된 존재가 자기 자신의 내면으로부터도 소외되어 있음을 암시하는 서술 전략으로 해석된다."
    },
    {
      id: "p4",
      text: "카프카의 「변신」이 문학사적으로 중요한 이유는 소외의 문제를 리얼리즘적 재현이 아니라 환상적 설정을 통해 형상화하였다는 데 있다. 소외를 사실적으로 묘사하는 것은 독자에게 소외의 현실을 인식하게 할 수 있지만, 그 현실에 대한 관성적 수용을 초래할 위험이 있다. 반면 인간이 벌레로 변한다는 극단적 환상은 일상화된 소외를 낯설게 만들어, 독자로 하여금 자신이 당연하게 여기던 삶의 조건들을 비판적으로 재검토하도록 유도한다. 이러한 낯설게 하기의 전략은 이후 부조리 문학의 핵심적 기법으로 계승되었으며, 카뮈, 사르트르, 이오네스코 등의 작가들에게 직간접적인 영향을 미쳤다. 카프카의 「변신」은 소외라는 주제와 환상적 형식의 결합을 통해 20세기 문학의 새로운 가능성을 열어젖힌 작품으로 평가받고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "그레고르의 변신이 지니는 알레고리적 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "이미 소외되어 있던 인간의 상태가 물리적으로 가시화된 것이라는 점에서 알레고리적 성격을 지닌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "변신 이전 그레고르의 가족에 대한 헌신의 본질은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "그 헌신은 진정한 인간적 관계가 아니라 경제적 교환의 논리에 의해 매개되는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "가족의 태도 변화가 폭로하는 근대 사회의 구조는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "인간관계가 경제적 유용성에 의해 규정되는 근대 사회의 비인간적 구조를 적나라하게 폭로하는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "카프카의 건조한 서술이 만들어내는 효과는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "비정상적 상황과 정상적 반응 사이의 극적인 괴리를 만들어내며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "환상적 설정을 통한 소외의 형상화가 독자에게 유도하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "독자로 하여금 자신이 당연하게 여기던 삶의 조건들을 비판적으로 재검토하도록 유도한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "카프카의 낯설게 하기 전략이 이후 문학에 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "부조리 문학의 핵심적 기법으로 계승되었으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(34, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 35: 비문학 (NONFICTION) — 유전자 편집 기술 CRISPR의 윤리적 쟁점 ───
function buildDay35() {
  const paragraphs = [
    {
      id: "p1",
      text: "CRISPR-Cas9은 특정 DNA 서열을 정밀하게 인식하고 절단하여 유전자를 편집할 수 있는 혁신적 기술이다. 이 기술은 원래 세균이 바이러스의 침입에 대응하기 위해 진화시킨 면역 체계에서 유래한 것으로, 2012년 제니퍼 다우드나와 에마뉘엘 샤르팡티에에 의해 유전자 편집 도구로서의 가능성이 입증되었다. CRISPR 시스템은 가이드 RNA가 표적 DNA 서열을 인식하면, Cas9 단백질이 해당 부위를 절단하는 원리로 작동한다. 절단된 DNA는 세포의 자연적 복구 과정에서 특정 유전자가 비활성화되거나, 연구자가 원하는 새로운 서열이 삽입될 수 있다. 이 기술은 이전의 유전자 편집 기술에 비해 정확도가 높고, 비용이 저렴하며, 적용 범위가 넓다는 장점 때문에 생명과학 연구에 혁명적 변화를 가져왔다."
    },
    {
      id: "p2",
      text: "CRISPR 기술의 의료적 적용은 크게 체세포 유전자 편집과 생식세포 유전자 편집으로 구분된다. 체세포 유전자 편집은 환자의 체세포에서 질병을 유발하는 돌연변이를 교정하는 것으로, 그 효과가 해당 개체에 한정되어 후세대에 전달되지 않는다. 겸상 적혈구 빈혈증이나 베타 지중해 빈혈증과 같은 유전 질환에 대한 CRISPR 기반 치료제가 이미 임상 승인을 받은 사례가 존재한다. 반면 생식세포 유전자 편집은 정자, 난자, 또는 초기 배아의 유전자를 변형하는 것으로, 그 변화가 모든 후속 세대에 영구적으로 전달된다. 2018년 중국의 과학자 허젠쿠이가 CRISPR로 배아를 편집하여 쌍둥이를 출산시킨 사건은 국제 과학계의 강력한 비난을 받았으며, 생식세포 편집의 윤리적 한계에 대한 전 세계적 논쟁을 촉발하였다."
    },
    {
      id: "p3",
      text: "CRISPR 기술의 윤리적 쟁점은 여러 차원에서 논의된다. 첫째, 안전성의 문제로서 표적 이탈 효과가 우려된다. 가이드 RNA가 의도하지 않은 유전체 부위를 절단하여 예측 불가능한 돌연변이를 유발할 가능성이 있으며, 생식세포 편집의 경우 이러한 오류가 세대 간에 누적될 위험이 있다. 둘째, 유전자 편집 기술의 접근성 불평등 문제가 제기된다. 고비용의 유전자 치료가 경제적 여유가 있는 계층에게만 제공될 경우, 유전적 불평등이라는 새로운 형태의 사회적 격차가 발생할 수 있다. 셋째, 치료와 향상의 경계에 관한 논쟁이 있다. 질병의 치료를 넘어 지능이나 체력 등을 인위적으로 향상시키는 데 유전자 편집이 사용될 경우, 이는 인간 본성에 대한 근본적 변형을 의미하며 심각한 윤리적 문제를 야기한다."
    },
    {
      id: "p4",
      text: "CRISPR 기술의 윤리적 거버넌스에 관한 국제적 논의는 현재 활발히 진행 중이다. 세계보건기구는 인간 유전체 편집에 관한 자문위원회를 구성하여 권고안을 발표하였으며, 대부분의 국가에서 생식세포 편집의 임상 적용은 법적으로 금지되거나 엄격히 규제되고 있다. 그러나 규제 수준은 국가마다 상이하여, 규제가 느슨한 지역에서의 무분별한 실험이 우려된다. 이 문제에 대한 바람직한 접근은 과학적 진보를 억압하지 않으면서도 인간의 존엄성과 세대 간 정의를 보호하는 균형점을 찾는 것이다. 이를 위해서는 과학자, 윤리학자, 법학자, 환자 단체, 일반 시민 등 다양한 이해관계자가 참여하는 포괄적 사회적 합의가 필수적이며, 윤리적 논의가 기술 발전에 맞추어 갱신되어야 한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "CRISPR 시스템이 유전자를 편집하는 작동 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "가이드 RNA가 표적 DNA 서열을 인식하면, Cas9 단백질이 해당 부위를 절단하는 원리로 작동한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "체세포 유전자 편집과 생식세포 유전자 편집의 핵심적 차이는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "그 변화가 모든 후속 세대에 영구적으로 전달된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "허젠쿠이 사건이 촉발한 논쟁의 주제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "생식세포 편집의 윤리적 한계에 대한 전 세계적 논쟁을 촉발하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "유전자 편집 기술의 접근성 불평등이 야기할 수 있는 사회적 문제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "유전적 불평등이라는 새로운 형태의 사회적 격차가 발생할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "유전자 편집의 윤리적 거버넌스에서 바람직한 접근 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "과학적 진보를 억압하지 않으면서도 인간의 존엄성과 세대 간 정의를 보호하는 균형점을 찾는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "포괄적 사회적 합의를 위해 참여해야 하는 주체는 누구인가?",
      answerRanges: [findRange(paragraphs, "p4", "과학자, 윤리학자, 법학자, 환자 단체, 일반 시민 등 다양한 이해관계자가 참여하는 포괄적 사회적 합의가 필수적이며")],
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
  const contentId = `dr-w2-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(비트겐슈타인 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "WITTGENSTEIN_2",
    schoolGradeRange: { min: 10, max: 11 },
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
    level_id: "WITTGENSTEIN_2",
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
  console.log("=== 비트겐슈타인2 Day 31~35 빌드 시작 ===\n");

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
    if (len < 1450 || len > 1550) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1450~1550)`);
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
