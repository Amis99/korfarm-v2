#!/usr/bin/env node
// 비트겐슈타인3 Day 76~80 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE, 홀수 Day = NONFICTION
// 목표 글자수: 1600자 ±50 (1550~1650)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-wittgenstein3.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/wittgenstein3');

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

// ─── Day 76: 문학 (LITERATURE) ───
function buildDay76() {
  const paragraphs = [
    {
      id: "p1",
      text: "이청준의 소설 세계는 언어와 진실의 관계에 대한 끈질긴 탐구로 특징지어진다. 그는 언어가 현실을 투명하게 재현할 수 있다는 순진한 믿음을 의심하면서, 언어를 통해 진실에 도달하려는 시도가 필연적으로 직면하게 되는 한계와 역설을 소설의 핵심 주제로 삼았다. 이청준의 초기 작품인 「병신과 머저리」는 이러한 문제의식을 선명하게 드러낸다. 이 작품에서 글을 쓰는 형과 그림을 그리는 동생은 각각 언어적 재현과 시각적 재현이라는 서로 다른 매체를 통해 현실을 포착하려 하지만, 두 가지 방식 모두 현실의 총체적 진실을 온전히 담아내지 못한다. 형은 자신의 전쟁 경험을 글로 옮기려 하지만 언어의 한계에 좌절하고, 동생은 전쟁의 상흔을 화폭에 담으려 하지만 시각적 형상화 역시 체험의 본질을 왜곡한다. 이청준은 이 작품을 통해 예술적 재현이 본질적으로 현실과의 간극을 내포하고 있으며, 이 간극에 대한 자각이야말로 예술의 출발점이 됨을 암시하였다."
    },
    {
      id: "p2",
      text: "이청준의 서사 전략에서 가장 두드러지는 특징은 액자 구조의 활용이다. 그의 소설은 이야기 안에 또 다른 이야기가 중첩되는 구성을 취하면서, 서술 행위 자체를 소설의 주제로 전면화한다. 「이어도」에서 허생원이 전하는 전설적 섬 이어도의 이야기는 현실과 환상의 경계를 넘나들며, 이야기를 듣는 기자의 시선을 통해 다시 한번 굴절된다. 이러한 다층적 서사 구조는 하나의 사건에 대한 단일한 해석이 불가능함을 보여 주며, 진실이란 서로 다른 시각들이 교차하는 가운데 비로소 그 윤곽을 드러내는 것임을 시사한다. 이청준의 액자 구조는 단순한 서사적 기교가 아니라, 진실의 다층성과 해석의 불확정성이라는 인식론적 주제를 형식적으로 구현한 것이다."
    },
    {
      id: "p3",
      text: "「당신들의 천국」은 이청준의 장편 소설 가운데 권력과 소통의 문제를 가장 깊이 있게 다룬 작품이다. 소록도를 배경으로 한 이 소설에서 새로 부임한 원장 조백헌은 한센병 환자들을 위한 낙원을 건설하겠다는 이상을 품고 다양한 개혁 사업을 추진한다. 그러나 그의 선의는 환자들의 자발적 동의 없이 일방적으로 추진됨으로써 또 다른 형태의 억압으로 변질된다. 이 소설은 선의에 기반한 권력이라 하더라도 소통의 부재 속에서는 폭력이 될 수 있음을 날카롭게 포착한다. 특히 원장의 개혁이 환자들의 실질적 필요보다 자신의 이상 실현에 치중하는 양상은, 권력자의 자기 확신이 어떻게 타자의 목소리를 침묵시키는지를 보여 준다. 이청준은 당신들의 천국이라는 제목 자체를 통해, 타자를 위한다는 명목 아래 이루어지는 일방적 기획이 결국 그것을 기획하는 자의 천국일 뿐이라는 역설을 드러내었다."
    },
    {
      id: "p4",
      text: "이청준 소설의 문학사적 의의는 한국 현대 소설에 메타소설적 자의식을 본격적으로 도입하였다는 데에 있다. 그는 소설을 쓰는 행위, 이야기를 전하는 행위, 진실을 추적하는 행위를 소설 내부의 주제로 삼음으로써, 소설이라는 장르가 자신의 존재 조건을 반성적으로 성찰하는 경지를 열어 놓았다. 이러한 자기 반영적 서사는 1970년대 한국 소설의 미학적 지평을 확장하였으며, 이후 최수철, 이인성 등 모더니즘 계열 작가들에게 중요한 영향을 미쳤다. 동시에 이청준은 메타소설적 실험에 머물지 않고, 권력과 소통, 개인과 공동체의 관계라는 사회적 주제를 지속적으로 탐구하였다는 점에서 한국 소설의 미학적 실험과 현실 인식의 결합을 실천한 작가로 평가된다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "이청준이 「병신과 머저리」를 통해 보여 준 예술적 재현의 본질적 특성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "예술적 재현이 본질적으로 현실과의 간극을 내포하고 있으며, 이 간극에 대한 자각이야말로 예술의 출발점이 됨을 암시하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "이청준의 액자 구조가 형식적으로 구현하고자 한 인식론적 주제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "진실의 다층성과 해석의 불확정성이라는 인식론적 주제를 형식적으로 구현한 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「당신들의 천국」에서 조백헌의 선의가 억압으로 변질된 근본 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "환자들의 자발적 동의 없이 일방적으로 추진됨으로써 또 다른 형태의 억압으로 변질된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "「당신들의 천국」이라는 제목이 드러내는 역설은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "타자를 위한다는 명목 아래 이루어지는 일방적 기획이 결국 그것을 기획하는 자의 천국일 뿐이라는 역설을 드러내었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이청준의 메타소설적 자의식이 한국 소설에 열어 놓은 경지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "소설이라는 장르가 자신의 존재 조건을 반성적으로 성찰하는 경지를 열어 놓았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이청준이 한국 소설사에서 평가받는 핵심적 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "한국 소설의 미학적 실험과 현실 인식의 결합을 실천한 작가로 평가된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(76, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 77: 비문학 (NONFICTION) ───
function buildDay77() {
  const paragraphs = [
    {
      id: "p1",
      text: "인지 편향은 인간의 판단과 의사 결정 과정에서 체계적으로 나타나는 비합리적 사고 패턴을 가리키며, 행동경제학과 인지심리학의 핵심 연구 주제이다. 카너먼과 트버스키는 1970년대부터 수행한 일련의 실험을 통해 인간이 합리적 경제인이라는 전통 경제학의 가정에 근본적 의문을 제기하였다. 이들의 연구에 따르면, 인간은 복잡한 정보를 처리할 때 체계적 분석보다는 직관적 판단에 의존하는 경향이 있으며, 이러한 직관적 판단은 특정한 상황에서 예측 가능한 오류를 초래한다. 카너먼은 이를 시스템 1과 시스템 2라는 이중 과정 이론으로 설명하였는데, 시스템 1은 빠르고 자동적이며 감정적인 사고 과정이고, 시스템 2는 느리고 숙고적이며 논리적인 사고 과정이다. 대부분의 인지 편향은 시스템 1의 과잉 활성화에서 비롯되며, 시스템 2의 적절한 개입이 부재할 때 판단 오류가 발생한다."
    },
    {
      id: "p2",
      text: "확증 편향은 인지 편향 가운데 가장 보편적이면서 사회적 영향력이 큰 것으로 꼽힌다. 이는 자신이 이미 가지고 있는 신념을 확인해 주는 정보만을 선택적으로 수용하고, 이에 반하는 증거는 무시하거나 과소평가하는 경향을 말한다. 확증 편향은 개인의 의사 결정뿐만 아니라 집단적 의견 형성 과정에서도 강력하게 작동한다. 소셜 미디어 알고리즘이 사용자의 기존 관심사에 부합하는 콘텐츠를 우선적으로 노출하는 필터 버블 현상은 확증 편향을 기술적으로 강화하는 장치로 기능하며, 이는 사회적 양극화를 심화시키는 구조적 요인이 되고 있다. 확증 편향의 극복을 위해서는 자신의 신념에 반하는 증거를 의도적으로 탐색하는 습관과 함께, 정보 환경 자체의 다양성을 보장하는 제도적 장치가 필요하다."
    },
    {
      id: "p3",
      text: "가용성 휴리스틱은 사건의 발생 빈도나 확률을 판단할 때, 관련 사례가 쉽게 떠오르는지에 의존하여 판단하는 인지적 지름길이다. 언론에서 비행기 사고를 집중 보도하면 사람들은 비행기 사고의 발생 확률을 실제보다 높게 추정하게 되는데, 이는 사고의 극적인 이미지가 기억에 강렬하게 각인되어 인출이 용이하기 때문이다. 가용성 휴리스틱은 일상적 판단에서 대체로 유용하게 기능하지만, 미디어 보도의 편향성이나 개인 경험의 제한성으로 인해 심각한 판단 오류를 낳을 수 있다. 특히 위험 평가의 영역에서 가용성 휴리스틱은 실제 위험의 크기와 대중이 인식하는 위험의 크기 사이에 괴리를 만들어 내며, 이러한 괴리는 정책적 자원 배분의 왜곡으로 이어질 수 있다는 점에서 사회적으로 중요한 함의를 지닌다."
    },
    {
      id: "p4",
      text: "앵커링 효과는 초기에 제시된 정보가 이후의 판단에 기준점으로 작용하여, 최종 판단이 그 기준점 주변에 편향되는 현상을 말한다. 협상이나 가격 책정 과정에서 처음 제시되는 수치가 이후의 교섭 범위를 결정적으로 제한하는 것이 대표적인 사례이다. 앵커링 효과는 제시된 기준점이 판단 대상과 무관한 경우에도 작동한다는 점에서 그 영향력이 광범위하다. 트버스키와 카너먼의 실험에서 무작위로 생성된 숫자를 보여 준 후 특정 질문에 답하게 하였을 때, 참가자들의 답변은 무작위 숫자에 체계적으로 영향을 받았다. 이러한 인지 편향에 대한 이해는 단순히 개인의 판단 능력을 향상시키는 데 그치지 않고, 사회 제도의 설계에도 중요한 시사점을 제공한다. 넛지 이론으로 대표되는 자유주의적 개입주의는 인지 편향에 대한 학문적 이해를 바탕으로, 선택 설계를 통해 개인이 보다 나은 의사 결정을 할 수 있도록 유도하는 정책적 접근법이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "카너먼의 이중 과정 이론에서 대부분의 인지 편향이 발생하는 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "시스템 1의 과잉 활성화에서 비롯되며, 시스템 2의 적절한 개입이 부재할 때 판단 오류가 발생한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "필터 버블 현상이 확증 편향과 관련하여 수행하는 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "확증 편향을 기술적으로 강화하는 장치로 기능하며, 이는 사회적 양극화를 심화시키는 구조적 요인이 되고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "확증 편향을 극복하기 위해 필요한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "자신의 신념에 반하는 증거를 의도적으로 탐색하는 습관과 함께, 정보 환경 자체의 다양성을 보장하는 제도적 장치가 필요하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "가용성 휴리스틱이 위험 평가 영역에서 초래하는 사회적 문제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "괴리는 정책적 자원 배분의 왜곡으로 이어질 수 있다는 점에서 사회적으로 중요한 함의를 지닌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "앵커링 효과의 영향력이 광범위한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "제시된 기준점이 판단 대상과 무관한 경우에도 작동한다는 점에서 그 영향력이 광범위하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "넛지 이론이 인지 편향 연구를 활용하는 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "선택 설계를 통해 개인이 보다 나은 의사 결정을 할 수 있도록 유도하는 정책적 접근법이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(77, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 78: 문학 (LITERATURE) ───
function buildDay78() {
  const paragraphs = [
    {
      id: "p1",
      text: "박경리의 「토지」는 한국 현대 장편 소설의 기념비적 성취로 평가되는 작품이다. 1969년부터 1994년까지 26년에 걸쳐 집필된 이 소설은 구한말에서 해방에 이르는 격동의 한국 근현대사를 배경으로, 최참판댁 일가와 그들을 둘러싼 수백 명의 인물들이 엮어 내는 장대한 서사를 전개한다. 전체 5부, 16권에 달하는 「토지」의 서사적 규모는 단순한 양적 방대함을 넘어, 한 민족의 역사적 경험을 총체적으로 형상화하려는 작가적 기획의 산물이다. 박경리는 특정한 이념적 관점에서 역사를 재단하는 대신, 다양한 계층과 직업, 성별과 세대의 인물들이 각자의 삶을 영위하면서 역사적 격변에 대응하는 양상을 풍부하게 그려냄으로써, 역사의 구체적 질감을 살려 내는 데 성공하였다."
    },
    {
      id: "p2",
      text: "「토지」의 핵심적 서사 원리는 토지로 상징되는 생명적 가치와 금력으로 대표되는 근대적 자본의 대립에 있다. 최참판댁의 토지를 둘러싼 갈등은 단순한 재산 분쟁이 아니라, 공동체적 삶의 양식과 근대적 소유 관념 사이의 문명사적 충돌을 상징한다. 박경리에게 토지는 경제적 가치로 환원될 수 없는 생명의 근원이자 공동체의 존립 기반이며, 토지로부터의 소외는 곧 존재론적 뿌리의 상실을 의미한다. 조준구와 같은 인물이 토지를 탈취하는 과정은 근대적 합리성이 공동체의 전통적 유대를 해체하는 과정과 겹쳐지며, 이러한 서사적 대립을 통해 박경리는 근대화가 가져온 인간 소외의 문제를 깊이 있게 형상화하였다."
    },
    {
      id: "p3",
      text: "「토지」에서 여성 인물의 형상화는 한국 소설사에서 독보적인 성취이다. 주인공 서희는 가문의 몰락과 회복이라는 서사적 과제를 주체적으로 수행하는 인물로, 전통적인 여성상의 틀을 넘어서는 능동적 행위자로 그려진다. 서희의 토지 환수 과정은 빼앗긴 것을 되찾는 단순한 복수극이 아니라, 근대적 주체로서의 각성과 전통적 가치의 수호라는 이중적 과제의 수행으로 해석된다. 서희가 법률적 지식과 경제적 능력을 갖추어 가면서도 공동체에 대한 책임 의식을 잃지 않는 모습은, 근대적 개인주의와 전통적 공동체 의식이 조화를 이룰 수 있는 가능성을 보여 준다. 또한 봉순이, 월선이, 임이네 등 다양한 계층의 여성 인물들은 각자의 위치에서 삶의 고통과 기쁨을 체험하며, 이들의 이야기는 공식 역사에서 배제되었던 여성의 경험을 복원하는 역할을 한다. 박경리는 이러한 여성 인물군을 통해 역사를 움직이는 힘이 영웅적 개인이 아니라 일상을 살아가는 평범한 사람들의 생명력에 있음을 보여 주었다."
    },
    {
      id: "p4",
      text: "「토지」가 한국 문학사에서 차지하는 위상은 복합적이다. 우선 이 작품은 대하소설이라는 서사 양식을 한국 소설의 주요 형식으로 정착시킨 기념비적 작품이다. 조정래의 「태백산맥」, 황석영의 「장길산」 등 이후의 대하소설들이 「토지」가 개척한 서사적 지평 위에서 자신의 고유한 역사적 탐구를 전개하였다는 점에서, 이 작품의 선구적 역할은 분명하다. 또한 「토지」는 민족사의 총체적 형상화라는 과제를 수행하면서도 개인의 구체적인 삶의 질감을 놓치지 않았다는 점에서, 거대 서사와 미시 서사의 균형이라는 대하소설의 본질적 과제에 대한 모범적 해결을 보여 주었다. 나아가 이 소설은 생명 사상이라는 박경리 고유의 철학적 비전을 서사적으로 구현하였으며, 이는 근대성에 대한 비판적 성찰이라는 차원에서 오늘날에도 유효한 문제의식을 담고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "박경리가 「토지」에서 역사의 구체적 질감을 살려 내기 위해 사용한 방법은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "다양한 계층과 직업, 성별과 세대의 인물들이 각자의 삶을 영위하면서 역사적 격변에 대응하는 양상을 풍부하게 그려냄으로써")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「토지」에서 토지가 상징하는 의미와 토지 소외가 의미하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "토지는 경제적 가치로 환원될 수 없는 생명의 근원이자 공동체의 존립 기반이며, 토지로부터의 소외는 곧 존재론적 뿌리의 상실을 의미한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "서희의 토지 환수 과정이 갖는 이중적 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "근대적 주체로서의 각성과 전통적 가치의 수호라는 이중적 과제의 수행으로 해석된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "박경리가 다양한 여성 인물군을 통해 보여 주고자 한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "역사를 움직이는 힘이 영웅적 개인이 아니라 일상을 살아가는 평범한 사람들의 생명력에 있음을 보여 주었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "「토지」가 대하소설의 본질적 과제에 대해 보여 준 해결 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "거대 서사와 미시 서사의 균형이라는 대하소설의 본질적 과제에 대한 모범적 해결을 보여 주었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "「토지」가 오늘날에도 유효한 문제의식을 담고 있다고 평가되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "생명 사상이라는 박경리 고유의 철학적 비전을 서사적으로 구현하였으며, 이는 근대성에 대한 비판적 성찰이라는 차원에서 오늘날에도 유효한 문제의식을 담고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(78, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 79: 비문학 (NONFICTION) ───
function buildDay79() {
  const paragraphs = [
    {
      id: "p1",
      text: "사회 계약론은 국가 권력의 정당성을 시민 간의 합의에서 찾는 정치철학적 이론으로, 근대 정치 사상의 토대를 형성하였다. 홉스는 사회 계약론의 선구적 이론가로, 그의 저서 「리바이어던」에서 자연 상태의 인간은 만인에 대한 만인의 투쟁 속에 있다고 보았다. 자연 상태에서 개인은 자기 보존을 위해 무제한적 자유를 행사할 수 있지만, 이러한 무제한적 자유는 역설적으로 모든 사람의 생명을 위협하는 전쟁 상태를 초래한다. 홉스에 따르면 이성적 개인들은 이 비참한 상태에서 벗어나기 위해 자신의 자연적 권리를 절대 주권자에게 양도하는 사회 계약을 체결하며, 이를 통해 평화와 질서가 확보된다. 홉스의 이론에서 주권자의 권력은 계약 당사자들의 자발적 동의에 기초하지만, 일단 양도된 권력은 절대적이며 저항의 대상이 될 수 없다는 점에서 절대주의적 성격을 띤다."
    },
    {
      id: "p2",
      text: "로크는 홉스와 동일한 사회 계약론의 틀을 공유하면서도, 그 내용과 결론에서 근본적으로 다른 입장을 제시하였다. 로크에게 자연 상태는 홉스가 묘사한 것과 같은 전쟁 상태가 아니라, 자연법에 의해 규율되는 자유와 평등의 상태이다. 자연 상태의 인간은 생명, 자유, 재산에 대한 자연적 권리를 가지며, 이 권리는 국가 이전에 존재하는 것으로서 어떠한 정치 권력도 이를 침해할 수 없다. 로크에 따르면 사회 계약의 목적은 이러한 자연권을 보다 효과적으로 보호하기 위한 것이며, 정부가 시민의 자연권을 침해할 경우 시민은 정부에 저항하고 이를 교체할 정당한 권리를 가진다. 이러한 로크의 저항권 사상은 이후 미국 독립 선언과 프랑스 인권 선언의 사상적 토대가 되었으며, 근대 입헌주의와 자유주의 정치 사상의 기초를 마련하였다."
    },
    {
      id: "p3",
      text: "루소는 사회 계약론의 전통을 계승하면서도 이를 급진적으로 재구성한 사상가이다. 루소에게 자연 상태의 인간은 선량하고 자족적 존재였으나, 사유 재산의 출현과 함께 불평등이 발생하고 본래적 자유가 상실되었다. 루소의 사회 계약은 이 상실된 자유를 새로운 형태로 회복하기 위한 기획이다. 그가 제시한 일반 의지 개념은 개별 시민의 사적 이익의 총합이 아니라, 공동체 전체의 공공선을 지향하는 집합적 의지를 의미한다. 루소에 따르면 각 개인이 자신의 모든 권리를 공동체 전체에 양도하고, 일반 의지에 따라 통치되는 공화국에서만 참된 자유가 실현될 수 있다. 이러한 루소의 사상은 직접 민주주의와 인민 주권론의 이론적 기초를 제공하였으나, 일반 의지의 이름으로 개인의 자유가 억압될 수 있다는 비판에도 직면하게 되었다."
    },
    {
      id: "p4",
      text: "현대 정치철학에서 사회 계약론의 전통은 롤스에 의해 새로운 형태로 부활하였다. 롤스는 정의의 원칙을 도출하기 위한 사고 실험으로서 원초적 입장이라는 개념을 제안하였다. 원초적 입장에서 개인들은 무지의 베일 뒤에서 자신의 지위, 능력, 가치관을 모른 채 정의의 원칙을 선택하게 되며, 이러한 조건에서 합리적 개인들은 기본적 자유의 평등한 보장과 최소 수혜자의 이익 극대화라는 두 가지 정의 원칙에 합의할 것이라고 롤스는 논증하였다. 롤스의 이론은 자유주의적 정의관을 체계적으로 정초하면서도, 분배적 정의에 대한 관심을 통해 복지 국가의 이론적 정당성을 제공하였다. 그러나 롤스의 이론에 대해서는 공동체주의 진영에서 원자적 개인관을 전제하고 있다는 비판이, 자유지상주의 진영에서는 재분배가 소유권을 침해한다는 비판이 각각 제기되어 현대 정치철학의 핵심 논쟁을 형성하고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "홉스의 사회 계약론에서 주권자의 권력이 절대주의적 성격을 띠는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "일단 양도된 권력은 절대적이며 저항의 대상이 될 수 없다는 점에서 절대주의적 성격을 띤다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "로크의 사회 계약론에서 사회 계약의 목적은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "사회 계약의 목적은 이러한 자연권을 보다 효과적으로 보호하기 위한 것이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "로크의 저항권 사상이 미친 역사적 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "미국 독립 선언과 프랑스 인권 선언의 사상적 토대가 되었으며, 근대 입헌주의와 자유주의 정치 사상의 기초를 마련하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "루소의 일반 의지 개념이 의미하는 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "개별 시민의 사적 이익의 총합이 아니라, 공동체 전체의 공공선을 지향하는 집합적 의지를 의미한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "롤스의 원초적 입장에서 개인들이 합의할 두 가지 정의 원칙은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "기본적 자유의 평등한 보장과 최소 수혜자의 이익 극대화라는 두 가지 정의 원칙에 합의할 것이라고 롤스는 논증하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "롤스의 이론에 대한 공동체주의 진영의 비판의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "원자적 개인관을 전제하고 있다는 비판이")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(79, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 80: 문학 (LITERATURE) ───
function buildDay80() {
  const paragraphs = [
    {
      id: "p1",
      text: "윤동주의 시 세계는 식민지 시대 지식인의 내면적 갈등과 윤리적 자기 성찰을 가장 순수한 형태로 형상화한 것으로 평가된다. 그의 시에서 반복적으로 나타나는 부끄러움과 자기 성찰의 모티프는, 암울한 시대를 살아가는 지식인이 자신의 무력감과 타협적 삶에 대해 느끼는 도덕적 고통을 표현한 것이다. 「서시」에서 죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를 바라는 화자의 소망은, 단순한 도덕적 결의를 넘어 존재론적 차원의 윤리적 각성을 드러낸다. 윤동주에게 시를 쓴다는 것은 식민지 현실에 대한 직접적 저항이라기보다, 그 현실 속에서 자신의 존재를 윤리적으로 정립하려는 내면적 투쟁이었다. 이러한 내면적 저항의 방식은 직접적 행동주의와는 다른 차원의 윤리적 힘을 지니며, 이는 윤동주의 시가 시대를 초월하여 독자들에게 울림을 주는 근본적 이유이기도 하다."
    },
    {
      id: "p2",
      text: "윤동주의 시에서 밤과 별의 이미지는 핵심적인 상징 체계를 형성한다. 밤은 식민지라는 어두운 현실을 상징하는 동시에 자기 성찰이 이루어지는 시적 공간을 의미하며, 별은 그 어둠 속에서도 포기할 수 없는 이상과 양심의 상징으로 기능한다. 「별 헤는 밤」에서 화자는 밤하늘의 별들에 아름다운 이름들을 하나씩 부여하며, 어머니, 벗, 소녀 등 사랑하는 존재들의 이름을 부른다. 이 행위는 식민 권력이 강요한 창씨개명이라는 폭력적 현실에 대한 무언의 저항으로 읽히기도 한다. 이름을 부르는 행위를 통해 존재의 고유성을 회복하려는 시적 시도는, 식민지 현실이 말살하고자 한 개인의 정체성과 공동체적 유대를 언어를 통해 지켜내고자 하는 윤동주 시학의 핵심을 보여 준다."
    },
    {
      id: "p3",
      text: "「십자가」와 「쉽게 씌어진 시」에서 윤동주는 시인으로서의 자기 존재에 대한 근본적 물음을 제기한다. 「십자가」에서 화자는 십자가가 허락된다면 모가지를 드리우고 꽃처럼 피어나는 피를 조용히 흘리겠다고 말하는데, 이는 희생을 통한 구원이라는 기독교적 모티프를 식민지 지식인의 윤리적 각오와 결합시킨 것이다. 한편 「쉽게 씌어진 시」에서 화자는 자신의 시가 너무 쉽게 씌어지는 것에 대해 부끄러움을 느끼며, 이 시대에 시를 쓴다는 것의 의미를 자문한다. 이는 예술의 자율성과 시대적 책임 사이에서 고뇌하는 시인의 모습을 보여 주는 것으로, 식민지라는 극한적 상황에서 문학이 수행해야 할 역할에 대한 근원적 성찰을 담고 있다. 윤동주는 이러한 자기 반성적 태도를 통해 시 쓰기 자체를 하나의 윤리적 행위로 승화시켰다."
    },
    {
      id: "p4",
      text: "윤동주가 한국 시사에서 차지하는 위상은 단순한 문학적 성취만으로는 설명되지 않는다. 그의 시는 문학 작품인 동시에 한 시대의 양심을 증언하는 역사적 문서로서의 성격을 지니며, 이러한 이중적 성격이 윤동주를 한국인에게 가장 사랑받는 시인의 반열에 올려놓았다. 그러나 윤동주에 대한 과도한 민족주의적 독해는 그의 시가 지닌 보편적 가치를 축소시킬 위험이 있다. 윤동주의 시는 특정 민족이나 시대의 경험을 넘어, 억압적 현실 속에서 인간이 윤리적 존재로 살아가고자 하는 보편적 열망을 담고 있기 때문이다. 부끄러움을 아는 존재, 자기 성찰을 멈추지 않는 존재로서의 인간상은 시대와 국경을 초월하는 윤리적 이상이며, 이것이야말로 윤동주의 시가 오늘날 한국을 넘어 동아시아와 세계 문학의 맥락에서도 주목받고 있는 이유이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "윤동주에게 시를 쓴다는 것의 본질적 의미는 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p1", "식민지 현실에 대한 직접적 저항이라기보다, 그 현실 속에서 자신의 존재를 윤리적으로 정립하려는 내면적 투쟁이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「별 헤는 밤」에서 이름을 부르는 행위가 갖는 시학적 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "식민지 현실이 말살하고자 한 개인의 정체성과 공동체적 유대를 언어를 통해 지켜내고자 하는 윤동주 시학의 핵심을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「쉽게 씌어진 시」에서 화자가 부끄러움을 느끼는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "자신의 시가 너무 쉽게 씌어지는 것에 대해 부끄러움을 느끼며, 이 시대에 시를 쓴다는 것의 의미를 자문한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "윤동주가 자기 반성적 태도를 통해 이룩한 시적 성취는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "시 쓰기 자체를 하나의 윤리적 행위로 승화시켰다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "윤동주에 대한 과도한 민족주의적 독해의 위험성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "그의 시가 지닌 보편적 가치를 축소시킬 위험이 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "윤동주의 시가 세계 문학의 맥락에서 주목받는 근본적 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "부끄러움을 아는 존재, 자기 성찰을 멈추지 않는 존재로서의 인간상은 시대와 국경을 초월하는 윤리적 이상이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(80, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───
function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs);
  const recall = buildRecallCards(paragraphs, 8);

  const dayStr = String(dayIndex).padStart(3, '0');
  const contentId = `dr-w3-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(비트겐슈타인 3) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "WITTGENSTEIN_3",
    schoolGradeRange: { min: 11, max: 12 },
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
    level_id: "WITTGENSTEIN_3",
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
  console.log("=== 비트겐슈타인3 Day 76~80 빌드 시작 ===\n");

  const contents = [
    buildDay76(),
    buildDay77(),
    buildDay78(),
    buildDay79(),
    buildDay80()
  ];

  // 검증
  let allValid = true;
  for (const c of contents) {
    const len = c.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
    const dayNum = parseInt(c.contentId.split('-')[2]);
    if (len < 1550 || len > 1650) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1550~1650)`);
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
  if (!fs.existsSync(STATIC_DIR)) {
    fs.mkdirSync(STATIC_DIR, { recursive: true });
  }

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

  const dayIndices = [76, 77, 78, 79, 80];
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
