#!/usr/bin/env node
// 비트겐슈타인1 Day 46~50 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE, 홀수 Day = NONFICTION
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

// ─── Day 46: 문학 (LITERATURE) — 김춘수의 무의미시 ───
function buildDay46() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대시에서 김춘수는 의미의 세계로부터 벗어나고자 한 독특한 시적 실험을 수행한 시인으로 평가된다. 그의 시 세계는 초기의 존재론적 탐구에서 출발하여 점차 언어 자체의 순수성을 추구하는 방향으로 변모하였다. 초기작 「꽃」에서 김춘수는 이름 부르기라는 행위를 통해 존재의 의미가 생성되는 과정을 탐구하였으며, 이 작품은 존재와 언어의 관계에 대한 철학적 성찰을 담은 것으로 널리 알려져 있다. 그러나 김춘수의 시적 여정은 이러한 존재론적 관심에 머물지 않고, 의미를 해체하는 방향으로 나아갔다. 그는 시가 특정한 의미를 전달하는 도구가 아니라, 언어의 음악적 울림과 이미지의 자율적 운동으로 존재해야 한다는 인식에 도달하였다."
    },
    {
      id: "p2",
      text: "김춘수가 제시한 무의미시의 핵심은 시에서 관념과 서사를 제거하고 순수한 이미지만을 남기는 것이다. 그는 시가 사상이나 감정의 표현 수단이 되는 순간 언어의 고유한 생명력이 상실된다고 보았다. 무의미시에서 언어는 지시적 기능을 포기하고 그 자체의 소리와 리듬, 형태로서 독립적으로 존재하게 된다. 이러한 시적 방법론은 서양의 순수시 전통, 특히 스테판 말라르메의 절대시 개념과 일정한 유사성을 보인다. 말라르메가 언어를 통해 사물의 부재를 드러내고자 하였다면, 김춘수는 언어에서 의미의 그림자마저 걷어내어 이미지의 순수한 현전을 실현하고자 하였다. 그의 후기 시편들에서 나타나는 파편적 이미지의 나열과 비논리적 구문은 의도적으로 독자의 의미 구성을 방해하면서, 시를 읽는 것이 아니라 체험하게 하는 효과를 노린 것이었다."
    },
    {
      id: "p3",
      text: "무의미시에 대한 문학적 평가는 양분되어 있다. 긍정적 관점에서 보면, 김춘수의 무의미시는 시가 현실의 반영이나 메시지의 전달에 복무해야 한다는 기존의 통념을 근본적으로 해체한 것이다. 시를 의미의 굴레에서 해방시킴으로써 언어 예술로서의 시의 자율성을 극한까지 밀어붙인 실험으로 평가할 수 있다. 반면 비판적 관점에서는 의미를 완전히 배제한 시가 독자와의 소통 가능성을 스스로 차단하는 결과를 낳는다는 지적이 제기된다. 시가 현실과 독자로부터 유리될 때, 그것은 자폐적 언어 유희에 머물 위험이 있다는 것이다. 이러한 논쟁은 시의 본질이 무엇인가라는 근본적 물음과 연결되며, 한국 시단에서 지속적인 논의의 대상이 되어 왔다."
    },
    {
      id: "p4",
      text: "김춘수의 무의미시가 한국 시사에서 차지하는 위치는 독보적이다. 그는 참여시와 순수시의 대립이 첨예하던 시기에 어느 쪽에도 속하지 않는 제3의 길을 모색하였다. 참여시가 시의 사회적 기능을 강조하고 순수시가 서정적 아름다움을 추구하였다면, 김춘수는 시에서 의미 자체를 추방함으로써 두 진영의 전제를 동시에 거부하였다. 이러한 급진적 태도는 이후 한국 실험시의 흐름에 중요한 참조점이 되었으며, 황지우와 이성복 등 후세대 시인들의 해체적 시도에도 영향을 끼쳤다. 김춘수의 시적 유산은 시가 세계를 담는 그릇이 아니라 세계와 다른 방식으로 존재하는 독립적 언어 구조물이 될 수 있음을 보여 준 데에 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "김춘수의 시적 여정에서 초기 작품 「꽃」이 탐구한 주제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "이름 부르기라는 행위를 통해 존재의 의미가 생성되는 과정을 탐구하였으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "김춘수의 무의미시에서 언어가 수행하는 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "언어는 지시적 기능을 포기하고 그 자체의 소리와 리듬, 형태로서 독립적으로 존재하게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "김춘수의 후기 시편에서 파편적 이미지와 비논리적 구문이 노린 효과는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "시를 읽는 것이 아니라 체험하게 하는 효과를 노린 것이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "무의미시에 대한 비판적 관점에서 제기되는 핵심 문제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "의미를 완전히 배제한 시가 독자와의 소통 가능성을 스스로 차단하는 결과를 낳는다는 지적이 제기된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "김춘수가 참여시와 순수시 양쪽의 전제를 동시에 거부한 방법은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "시에서 의미 자체를 추방함으로써 두 진영의 전제를 동시에 거부하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "김춘수의 시적 유산이 보여 준 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "시가 세계를 담는 그릇이 아니라 세계와 다른 방식으로 존재하는 독립적 언어 구조물이 될 수 있음을 보여 준 데에 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(46, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 47: 비문학 (NONFICTION) — 엔트로피와 정보 이론 ───
function buildDay47() {
  const paragraphs = [
    {
      id: "p1",
      text: "엔트로피는 열역학에서 에너지의 비가역적 변환을 설명하기 위해 도입된 개념이다. 루돌프 클라우지우스는 열이 고온에서 저온으로만 흐르는 현상을 설명하면서, 유용한 일로 전환될 수 없는 에너지의 양을 엔트로피라 명명하였다. 열역학 제2법칙에 따르면 고립된 계의 엔트로피는 항상 증가하거나 일정하게 유지되며 결코 감소하지 않는다. 이는 자연 현상이 본질적으로 비가역적 방향성을 가진다는 것을 의미한다. 뜨거운 커피가 식어 실온에 도달하는 과정은 자발적으로 일어나지만, 식은 커피가 저절로 다시 뜨거워지는 현상은 관찰되지 않는다. 엔트로피는 이처럼 자연의 방향성과 시간의 비대칭성을 설명하는 핵심 도구이다."
    },
    {
      id: "p2",
      text: "통계역학의 발전과 함께 엔트로피는 미시적 관점에서 재해석되었다. 루트비히 볼츠만은 엔트로피를 특정 거시 상태를 실현할 수 있는 미시 상태의 수와 연결하였다. 즉 동일한 온도와 압력을 나타내는 거시 상태라 하더라도, 개별 분자들의 위치와 속도 조합은 무수히 많을 수 있으며, 가능한 미시 상태의 수가 많을수록 엔트로피가 높다는 것이다. 이러한 해석에 따르면 엔트로피의 증가는 계가 가장 확률이 높은 상태, 즉 무질서한 상태로 자연스럽게 이동하는 과정이다. 방 안에 뿌린 향수 분자가 시간이 지남에 따라 방 전체에 골고루 퍼지는 현상은 분자들이 특정 위치에 집중된 상태보다 골고루 분포된 상태의 미시 상태 수가 압도적으로 많기 때문에 일어나는 것이다."
    },
    {
      id: "p3",
      text: "1948년 클로드 섀넌은 엔트로피 개념을 정보 이론의 영역으로 확장하였다. 섀넌은 정보의 불확실성을 측정하는 양을 정보 엔트로피라 정의하였는데, 이는 어떤 메시지가 전달하는 정보량이 해당 메시지의 발생 확률에 반비례한다는 직관에 기초한 것이다. 확률이 낮은 사건이 발생하면 그만큼 많은 정보를 전달하고, 이미 예상된 사건은 적은 정보를 제공한다. 예를 들어 매일 비가 오는 지역에서 비가 온다는 소식은 정보량이 적지만, 사막에서 비가 온다는 소식은 정보량이 크다. 섀넌의 정보 엔트로피는 통신 시스템의 효율적 설계에 핵심적 토대를 제공하였으며, 데이터 압축과 오류 정정 부호의 이론적 한계를 규정하는 데 결정적 역할을 하였다."
    },
    {
      id: "p4",
      text: "열역학적 엔트로피와 정보 엔트로피 사이의 관계는 물리학과 정보학의 경계를 허무는 연구 주제이다. 맥스웰의 도깨비라는 사고 실험에서, 가상의 존재가 기체 분자를 관찰하고 분류하여 엔트로피를 감소시킬 수 있는 것처럼 보이는 역설이 제기되었다. 이 역설은 실라르드와 란다우어의 연구를 통해 해소되었는데, 도깨비가 분자를 관찰하고 기억을 저장하는 과정 자체가 에너지를 소모하고 엔트로피를 증가시킨다는 것이 밝혀졌다. 란다우어는 정보의 삭제가 필연적으로 열을 발생시킨다는 란다우어 원리를 제시하여, 정보 처리와 물리적 과정이 근본적으로 연결되어 있음을 입증하였다. 이러한 발견은 계산과 에너지 소비의 관계에 새로운 관점을 제공하며, 에너지 효율적 연산을 설계하는 이론적 기반이 되고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "열역학 제2법칙이 엔트로피에 대해 규정하는 내용은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "고립된 계의 엔트로피는 항상 증가하거나 일정하게 유지되며 결코 감소하지 않는다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "볼츠만의 해석에 따르면 엔트로피의 증가는 어떤 과정인가?",
      answerRanges: [findRange(paragraphs, "p2", "계가 가장 확률이 높은 상태, 즉 무질서한 상태로 자연스럽게 이동하는 과정이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "섀넌의 정보 엔트로피에서 메시지의 정보량은 무엇에 의해 결정되는가?",
      answerRanges: [findRange(paragraphs, "p3", "어떤 메시지가 전달하는 정보량이 해당 메시지의 발생 확률에 반비례한다는 직관에 기초한 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "섀넌의 정보 엔트로피가 통신 분야에 기여한 바는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "데이터 압축과 오류 정정 부호의 이론적 한계를 규정하는 데 결정적 역할을 하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "맥스웰의 도깨비 역설이 해소된 핵심 논거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "도깨비가 분자를 관찰하고 기억을 저장하는 과정 자체가 에너지를 소모하고 엔트로피를 증가시킨다는 것이 밝혀졌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "란다우어 원리가 입증하는 핵심 내용은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "정보 처리와 물리적 과정이 근본적으로 연결되어 있음을 입증하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(47, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 48: 문학 (LITERATURE) — 조세희의 「난장이가 쏘아올린 작은 공」 ───
function buildDay48() {
  const paragraphs = [
    {
      id: "p1",
      text: "조세희의 연작 소설 「난장이가 쏘아올린 작은 공」은 1970년대 산업화 과정에서 소외된 도시 빈민의 삶을 형상화한 작품이다. 이 작품은 경제 성장의 이면에 감추어진 계급 간 불평등과 구조적 폭력을 정면으로 다루면서, 한국 리얼리즘 소설의 중요한 성취로 평가받는다. 중심인물인 난장이는 키가 작다는 신체적 특징으로 인해 사회적 약자의 위치에 놓여 있으며, 이는 산업화 시대에 자본과 권력으로부터 배제된 노동자 계층을 상징적으로 대변한다. 조세희는 난장이를 통해 개인의 불행이 능력 부족이나 운명이 아니라, 사회 구조에 의해 체계적으로 생산되는 것임을 드러내고자 하였다."
    },
    {
      id: "p2",
      text: "이 작품의 서사적 특징 중 하나는 현실과 환상의 경계를 의도적으로 모호하게 처리하는 기법이다. 난장이가 달에 닿기 위해 작은 공을 쏘아 올리는 장면은 현실적으로 불가능한 행위이지만, 작품 내에서는 등장인물의 간절한 열망이 투영된 상징적 행위로 제시된다. 이러한 환상적 요소는 현실의 억압이 너무나 견고하여 현실적 수단으로는 탈출할 수 없다는 절망감을 역설적으로 드러낸다. 조세희는 사실적 묘사와 환상적 기법을 결합함으로써 단순한 사회 고발을 넘어 억압받는 자들의 내면적 진실을 포착하였다. 이러한 서사 전략은 당시 한국 소설에서 리얼리즘의 외연을 확장한 것으로 평가되며, 사실주의적 재현만으로는 포착할 수 없는 현실의 층위가 존재한다는 인식을 보여 준다."
    },
    {
      id: "p3",
      text: "작품에서 다루어지는 철거와 재개발의 문제는 1970년대 한국 사회의 구조적 모순을 구체적으로 형상화한다. 난장이 가족이 살던 집은 재개발 사업으로 인해 철거되며, 이들에게 주어진 아파트 입주권은 경제적 여건 때문에 실질적으로 활용할 수 없는 것이다. 이 과정에서 행정 권력과 자본은 법적 절차라는 외피를 씌워 폭력을 합법화하고, 빈민들은 삶의 터전을 잃으면서도 어떠한 효과적 저항 수단도 갖지 못한다. 조세희는 이러한 상황을 통해 법과 제도가 형식적으로는 평등하지만 실질적으로는 기득권의 이익을 보호하는 도구로 기능할 수 있음을 비판하였다. 재개발이 진보와 발전의 이름으로 정당화되는 구조 속에서, 소외된 이들의 고통은 사회적 관심 밖으로 밀려나게 되는 것이다."
    },
    {
      id: "p4",
      text: "「난장이가 쏘아올린 작은 공」이 한국 문학사에서 갖는 의의는 다층적이다. 이 작품은 노동 문학의 장르적 범주를 넘어 보편적 문학적 가치를 획득하였다는 점에서 주목된다. 계급 문제를 다루면서도 인물의 내면과 감정을 섬세하게 형상화함으로써, 사회적 메시지와 문학적 완성도를 동시에 성취하였다. 또한 연작 소설이라는 형식적 실험을 통해, 동일한 사건을 서로 다른 인물의 시각에서 조명함으로써 진실의 다면성을 구현하였다. 이 작품은 출간 이후 계급 문제에 대한 광범위한 논의를 촉발하였으며, 산업화의 그늘에 놓인 사람들에 대한 사회적 관심을 환기하였다. 오늘날에도 경제적 불평등과 사회적 정의의 문제를 사유하는 데 유효한 문학적 텍스트로 읽히고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "난장이라는 인물이 상징적으로 대변하는 대상은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "산업화 시대에 자본과 권력으로부터 배제된 노동자 계층을 상징적으로 대변한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "작품 속 환상적 요소가 역설적으로 드러내는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "현실의 억압이 너무나 견고하여 현실적 수단으로는 탈출할 수 없다는 절망감을 역설적으로 드러낸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "사실적 묘사와 환상적 기법의 결합이 보여 주는 인식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "사실주의적 재현만으로는 포착할 수 없는 현실의 층위가 존재한다는 인식을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "조세희가 철거와 재개발 과정을 통해 비판한 법과 제도의 문제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "법과 제도가 형식적으로는 평등하지만 실질적으로는 기득권의 이익을 보호하는 도구로 기능할 수 있음을 비판하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이 작품이 노동 문학의 범주를 넘어선 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "계급 문제를 다루면서도 인물의 내면과 감정을 섬세하게 형상화함으로써, 사회적 메시지와 문학적 완성도를 동시에 성취하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "연작 소설 형식이 구현한 문학적 효과는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "동일한 사건을 서로 다른 인물의 시각에서 조명함으로써 진실의 다면성을 구현하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(48, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 49: 비문학 (NONFICTION) — 사회적 딜레마와 협력의 진화 ───
function buildDay49() {
  const paragraphs = [
    {
      id: "p1",
      text: "사회적 딜레마는 개인의 합리적 선택이 집단 전체에는 비합리적인 결과를 낳는 상황을 가리킨다. 대표적인 모형은 죄수의 딜레마로, 두 용의자가 각각 독립적으로 자백 여부를 결정해야 하는 상황을 상정한다. 각 개인은 상대방의 선택과 관계없이 자백하는 것이 유리하지만, 두 사람 모두 자백하면 협력한 경우보다 나쁜 결과를 얻게 된다. 이 모형은 개인적 합리성과 집단적 합리성 사이의 괴리를 보여 주며, 환경 오염, 공유지의 비극, 무임승차 등 현실의 다양한 갈등 상황에 적용된다. 개인이 단기적 이익을 추구할 때 공동체의 자원이 고갈되거나 공공재가 충분히 공급되지 못하는 문제가 발생하는 것이다."
    },
    {
      id: "p2",
      text: "사회적 딜레마에서 협력이 어떻게 출현하고 유지되는가는 사회과학의 핵심 질문이다. 로버트 액설로드는 반복적 죄수의 딜레마 실험을 통해 통찰을 제시하였다. 그는 다양한 전략을 컴퓨터 대회에서 경쟁시킨 결과, 팃포탯이라는 단순한 전략이 가장 높은 성과를 거둔다는 사실을 발견하였다. 팃포탯 전략은 첫 만남에서 협력을 선택하고, 이후 상대방의 직전 행동을 따라 하는 방식이다. 이 전략의 성공 요인은 처음에 선의를 보이면서 상대의 배신에는 즉각 보복하되, 상대가 다시 협력하면 용서하는 특성에 있었다. 액설로드는 이를 통해 협력의 출현 조건으로 상호작용의 반복성, 배신에 대한 즉각적 대응, 보복 후 용서의 가능성을 제시하였다."
    },
    {
      id: "p3",
      text: "진화생물학에서는 호혜적 이타주의 이론을 통해 협력의 진화적 기반을 설명한다. 로버트 트리버스가 제안한 이 이론에 따르면, 개체가 즉각적인 비용을 감수하고 다른 개체를 돕는 행동은 장기적으로 상호 이익이 될 때 자연 선택에 의해 유지될 수 있다. 이러한 호혜적 이타주의가 작동하려면 개체들이 반복적으로 만날 가능성이 높고, 과거의 행동을 기억할 수 있으며, 배신자를 식별하고 처벌할 수 있어야 한다. 인간 사회에서 평판 체계와 사회적 규범은 이러한 조건을 충족시키는 문화적 장치로 기능한다. 좋은 평판을 가진 개인은 더 많은 협력의 기회를 얻고, 나쁜 평판을 가진 개인은 사회적 배제를 경험하게 되므로, 평판은 간접적 호혜성을 가능하게 하는 핵심 기제로 작용한다."
    },
    {
      id: "p4",
      text: "최근 연구는 처벌과 보상이 협력 유지에 미치는 역할에 주목한다. 이타적 처벌이란 자신에게 직접적 이익이 없음에도 비협력자를 처벌하는 행동으로, 실험에서 상당수의 사람들이 비용을 들여 무임승차자를 처벌하는 경향이 확인되었다. 이러한 처벌은 비협력의 유인을 감소시켜 집단 내 협력 수준을 높이는 효과를 가진다. 그러나 처벌이 지나치면 보복의 악순환을 초래할 수 있어, 적절한 제도적 장치가 중요하다. 한편 협력자에 대한 사회적 인정과 물질적 보상 역시 협력을 촉진하는 유효한 기제로 작용한다. 현대 사회에서 법률, 계약, 사회적 규범 등은 처벌과 보상의 기제를 체계화한 것으로, 대규모 익명 사회에서도 협력이 유지될 수 있는 기반을 제공한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "사회적 딜레마에서 개인적 합리성과 집단적 합리성의 관계는 어떠한가?",
      answerRanges: [findRange(paragraphs, "p1", "개인의 합리적 선택이 집단 전체에는 비합리적인 결과를 낳는 상황을 가리킨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "팃포탯 전략이 높은 성과를 거둔 핵심 요인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "처음에 선의를 보이면서 상대의 배신에는 즉각 보복하되, 상대가 다시 협력하면 용서하는 특성에 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "호혜적 이타주의가 자연 선택에 의해 유지되려면 어떤 조건이 필요한가?",
      answerRanges: [findRange(paragraphs, "p3", "개체들이 반복적으로 만날 가능성이 높고, 과거의 행동을 기억할 수 있으며, 배신자를 식별하고 처벌할 수 있어야 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "평판 체계가 협력 유지에 기여하는 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "평판은 간접적 호혜성을 가능하게 하는 핵심 기제로 작용한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이타적 처벌이 집단에 미치는 긍정적 효과는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "비협력의 유인을 감소시켜 집단 내 협력 수준을 높이는 효과를 가진다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "현대 사회의 법률, 계약, 사회적 규범이 수행하는 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "대규모 익명 사회에서도 협력이 유지될 수 있는 기반을 제공한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(49, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 50: 문학 (LITERATURE) — 김유정의 해학적 서사 ───
function buildDay50() {
  const paragraphs = [
    {
      id: "p1",
      text: "한국 현대 소설에서 김유정은 해학과 풍자를 통해 식민지 시대 농촌 현실을 독특하게 형상화한 작가이다. 그의 소설은 궁핍한 인물들의 이야기를 다루면서도 비극에 함몰되지 않고 웃음을 유발하는 특유의 서사 전략을 구사하였다. 김유정 소설의 해학은 인물들이 자신의 처지를 객관화하지 못한 채 벌이는 엉뚱한 행동에서 비롯되는 경우가 많다. 「봄봄」에서 데릴사위인 주인공이 장인의 착취를 당하면서도 부당함을 인식하지 못하고 어리둥절해하는 모습은, 독자에게 웃음을 선사하면서 동시에 농촌 사회의 불합리한 관행을 드러낸다. 이처럼 김유정의 해학은 단순한 오락적 기능을 넘어 사회적 현실에 대한 우회적 비판의 역할을 수행한다."
    },
    {
      id: "p2",
      text: "김유정 소설의 또 다른 특징은 토속적 언어의 적극적 활용이다. 그의 작품에는 강원도 방언과 일상적 구어체가 풍부하게 사용되어 있으며, 이러한 언어적 선택은 인물과 배경에 생동감을 부여하는 핵심 장치로 기능한다. 문어적이고 관념적인 서술 대신 인물이 실제로 사용할 법한 언어를 옮겨 놓음으로써, 독자는 인물의 생활 세계에 직접 참여하는 듯한 현장감을 느끼게 된다. 「동백꽃」에서 마름의 딸과 소작인의 아들 사이의 서투른 애정 표현은 토속적 언어를 통해 더욱 소박하고 진솔하게 전달되며, 이는 농촌 공동체의 정서적 풍경을 생생하게 재현하는 효과를 낳는다. 김유정의 이러한 언어적 실험은 당시 한국 소설이 추구하던 표준어 중심의 문학 언어에 대한 의미 있는 도전이었다."
    },
    {
      id: "p3",
      text: "김유정 소설에서 반복적으로 나타나는 주제 중 하나는 궁핍이 인간의 도덕적 판단을 어떻게 왜곡시키는가의 문제이다. 「만무방」에서 도둑질을 반복하는 인물이나 「금 따는 콩밭」에서 아내의 정조를 거래의 수단으로 삼는 남편의 행동은, 일차적으로는 도덕적 비난의 대상이 될 수 있다. 그러나 김유정은 이러한 인물들을 단순히 비도덕적 존재로 그리지 않고, 극심한 가난에 의해 윤리적 선택의 여지가 박탈된 존재로 형상화하였다. 작가는 웃음 뒤에 숨겨진 이들의 절박함을 포착함으로써, 개인의 도덕적 타락이 개인적 결함이 아니라 구조적 빈곤의 산물임을 암시하였다. 이러한 시각은 단순한 윤리적 판단을 유보하고 인물의 처지에 대한 공감적 이해를 요구한다는 점에서, 김유정 소설의 인문학적 깊이를 보여 준다."
    },
    {
      id: "p4",
      text: "김유정의 문학이 한국 소설사에서 차지하는 위치는 독특하다. 같은 시기 식민지 현실을 다룬 다른 작가들이 비장한 어조나 고발적 태도를 취한 것과 달리, 김유정은 웃음이라는 미학적 장치를 통해 비극적 현실을 간접적으로 조명하였다. 이러한 선택은 해학이 단순히 현실의 고통을 회피하는 수단이 아니라, 현실의 부조리를 더욱 날카롭게 드러내는 비판적 도구가 될 수 있음을 입증한다. 또한 김유정의 해학적 전통은 채만식의 풍자, 김승옥의 아이러니 등과 함께 한국 소설의 미학적 다양성을 구성하는 중요한 계보로 자리 잡았다. 김유정은 짧은 생애에도 불구하고 한국 문학에 웃음의 미학이라는 독자적 영역을 개척한 작가로 기억되고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "김유정 소설에서 해학이 발생하는 주된 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "인물들이 자신의 처지를 객관화하지 못한 채 벌이는 엉뚱한 행동에서 비롯되는 경우가 많다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "김유정의 토속적 언어 활용이 독자에게 주는 효과는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "독자는 인물의 생활 세계에 직접 참여하는 듯한 현장감을 느끼게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "김유정의 토속적 언어 실험이 당시 문학계에서 갖는 의의는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "당시 한국 소설이 추구하던 표준어 중심의 문학 언어에 대한 의미 있는 도전이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "김유정이 도덕적으로 문제적인 인물들을 형상화한 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "극심한 가난에 의해 윤리적 선택의 여지가 박탈된 존재로 형상화하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "김유정 소설에서 해학이 현실 비판의 도구가 될 수 있음을 입증하는 근거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "해학이 단순히 현실의 고통을 회피하는 수단이 아니라, 현실의 부조리를 더욱 날카롭게 드러내는 비판적 도구가 될 수 있음을 입증한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "김유정이 한국 문학사에서 기억되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "한국 문학에 웃음의 미학이라는 독자적 영역을 개척한 작가로 기억되고 있다")],
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
  console.log("=== 비트겐슈타인1 Day 46~50 빌드 시작 ===\n");

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
