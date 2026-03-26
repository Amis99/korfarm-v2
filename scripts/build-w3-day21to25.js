const fs = require('fs');
const path = require('path');

// ── 유틸리티 함수 ──
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
  if (!para) throw new Error(`단락 ${pid} 없음`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}" not found in ${pid}`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

// ── Day 21 비문학: 행동경제학과 전망 이론 ──
function buildDay21() {
  const paragraphs = [
    {
      id: "p1",
      text: "전통 경제학에서는 인간을 합리적 존재로 가정하여 효용을 극대화하는 방향으로 의사 결정을 내린다고 보았다. 이 관점에 따르면 소비자는 주어진 정보를 완벽하게 처리하고, 자신에게 최선인 대안을 선택하며, 미래의 결과를 합리적으로 예측한다. 그러나 행동경제학은 실제 인간의 의사 결정이 체계적으로 합리성에서 벗어난다는 점에 주목한다. 대니얼 카너먼과 아모스 트버스키가 1979년에 발표한 전망 이론은 이러한 비합리적 행동의 패턴을 체계적으로 설명한 대표적 이론이다. 전망 이론에 따르면 사람들은 절대적인 부의 수준이 아니라 특정 기준점으로부터의 변화량에 의해 가치를 판단한다. 이때 기준점은 현재의 상태나 기대 수준에 의해 결정되며, 동일한 결과라도 기준점이 달라지면 가치 판단이 완전히 바뀔 수 있다. 이 이론은 카너먼에게 2002년 노벨 경제학상을 안겨 주며 학문적 권위를 인정받았다."
    },
    {
      id: "p2",
      text: "전망 이론의 핵심 개념 중 하나는 손실 회피 현상이다. 사람들은 동일한 크기의 이득과 손실에 대해 비대칭적으로 반응하는데, 일반적으로 손실에서 느끼는 고통이 이득에서 느끼는 기쁨보다 약 두 배 이상 크다고 알려져 있다. 예컨대 10만 원을 잃었을 때의 심리적 타격은 10만 원을 얻었을 때의 만족감보다 훨씬 크기에, 사람들은 확실한 이득보다 손실을 피하려는 동기에 더 강하게 반응한다. 이러한 손실 회피 성향은 가치 함수의 형태로 도식화되는데, 이 함수는 기준점을 중심으로 이득 영역에서는 오목한 곡선을, 손실 영역에서는 볼록한 곡선을 그린다. 오목한 곡선은 이득이 증가할수록 추가적인 만족감이 체감한다는 의미이고, 볼록한 곡선은 손실이 증가할수록 추가적인 고통이 체감한다는 의미이다."
    },
    {
      id: "p3",
      text: "전망 이론은 또한 확률 가중 함수의 개념을 도입하여 인간의 확률 인식을 설명한다. 사람들은 객관적 확률을 있는 그대로 받아들이지 않고 주관적으로 변환하여 의사 결정에 반영한다. 구체적으로 매우 낮은 확률은 실제보다 과대평가하고, 중간 이상의 확률은 실제보다 과소평가하는 경향이 있다. 복권 구매 행동이 이를 잘 보여 주는 사례인데, 당첨 확률이 극히 낮음에도 사람들이 복권을 구매하는 것은 낮은 확률을 과대평가하기 때문이다. 반대로 발생 확률이 높은 위험에 대해서는 충분한 대비를 하지 않는 경우가 많은데, 이는 높은 확률을 과소평가하는 심리적 편향에서 비롯된다. 이러한 확률 왜곡은 보험 가입이나 투자 행위에서도 비합리적 선택으로 이어질 수 있다."
    },
    {
      id: "p4",
      text: "전망 이론은 경제학뿐 아니라 공공 정책, 의료, 마케팅 등 다양한 분야에서 활용되고 있다. 정부는 국민의 저축률을 높이기 위해 손실 회피 심리를 이용한 자동 가입 방식의 연금 제도를 설계하기도 한다. 의료 분야에서는 수술의 성공률을 강조할 때와 실패율을 강조할 때 환자의 동의 여부가 달라지는 프레이밍 효과가 확인되었다. 마케팅에서는 한정 판매 전략이나 할인 기한 설정이 소비자의 손실 회피 심리를 자극하여 구매를 촉진한다. 나아가 행동경제학적 통찰은 넛지 이론으로 발전하여 개인의 자유를 침해하지 않으면서도 바람직한 선택을 유도하는 정책 설계의 기반이 되었다. 이처럼 전망 이론은 인간의 의사 결정 과정에 내재된 심리적 편향을 과학적으로 규명함으로써 개인의 선택뿐 아니라 사회 전반의 제도 설계에도 깊은 영향을 미치고 있다."
    }
  ];

  const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
  console.log(`Day 21 지문 길이: ${totalLen}자`);

  const allSentences = {};
  paragraphs.forEach(p => { allSentences[p.id] = findSentences(p.text); });

  // 정독 타임라인
  const timeline = [];
  let stepNum = 1;

  // p1 문장들
  const p1s = allSentences.p1;
  // s1: 문장 성분 질문
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p1", "합리적 존재")] },
    question: {
      prompt: "하이라이트된 말의 문장 성분으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "목적어" },
        { id: "B", text: "주어" },
        { id: "C", text: "보어" },
        { id: "D", text: "부사어" }
      ],
      answerId: "C",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p1 문장별 하이라이트
  p1s.forEach(s => {
    const otherSentences = [];
    paragraphs.forEach(p => {
      findSentences(p.text).forEach(os => {
        if (os.text !== s.text && os.text.length > 15) otherSentences.push(os.text);
      });
    });
    const shuffled = otherSentences.sort(() => Math.random() - 0.5);
    const wrongChoices = shuffled.slice(0, 3).map((t, i) => ({
      id: ["A","B","C","D"][i], text: t.length > 60 ? t.substring(0, 57) + "..." : t
    }));
    // 정답 위치 랜덤
    const answerPos = Math.floor(Math.random() * 4);
    const choices = [...wrongChoices];
    const answerText = s.text.length > 60 ? s.text.substring(0, 57) + "..." : s.text;
    choices.splice(answerPos, 0, { id: ["A","B","C","D"][answerPos], text: answerText });
    // id 재배정
    choices.forEach((c, i) => { c.id = ["A","B","C","D"][i]; });

    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: "p1", start: s.start, end: s.end }] },
      question: {
        prompt: "하이라이트된 문장의 내용으로 알맞은 것은?",
        choices,
        answerId: ["A","B","C","D"][answerPos],
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  });

  // p1 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: paragraphs[0].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "전망 이론은 기준점으로부터의 변화량에 의해 가치를 판단한다고 설명한다." },
        { id: "B", text: "손실 회피 현상은 가치 함수의 형태로 도식화된다." },
        { id: "C", text: "확률 가중 함수는 객관적 확률과 주관적 확률의 괴리를 보여 준다." },
        { id: "D", text: "행동경제학은 공공 정책과 마케팅 분야에 널리 활용된다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // p2, p3, p4도 같은 패턴
  for (const pid of ["p2", "p3", "p4"]) {
    const para = paragraphs.find(p => p.id === pid);
    const sents = allSentences[pid];

    sents.forEach(s => {
      const otherSentences = [];
      paragraphs.forEach(p => {
        findSentences(p.text).forEach(os => {
          if (os.text !== s.text && os.text.length > 15) otherSentences.push(os.text);
        });
      });
      const shuffled = otherSentences.sort(() => Math.random() - 0.5);
      const wrongChoices = shuffled.slice(0, 3).map((t, i) => ({
        id: ["A","B","C","D"][i], text: t.length > 60 ? t.substring(0, 57) + "..." : t
      }));
      const answerPos = Math.floor(Math.random() * 4);
      const choices = [...wrongChoices];
      const answerText = s.text.length > 60 ? s.text.substring(0, 57) + "..." : s.text;
      choices.splice(answerPos, 0, { id: ["A","B","C","D"][answerPos], text: answerText });
      choices.forEach((c, i) => { c.id = ["A","B","C","D"][i]; });

      timeline.push({
        stepId: `s${stepNum++}`,
        highlight: { ranges: [{ paragraphId: pid, start: s.start, end: s.end }] },
        question: {
          prompt: "하이라이트된 문장의 내용으로 알맞은 것은?",
          choices,
          answerId: ["A","B","C","D"][answerPos],
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    // 중심내용
    const centralMap = {
      p2: { answer: "A", choices: [
        { id: "A", text: "손실 회피 현상은 이득보다 손실에 더 민감하게 반응하는 비대칭적 심리이다." },
        { id: "B", text: "전망 이론은 기준점 변화에 따라 가치 판단이 달라진다고 본다." },
        { id: "C", text: "복권 구매는 낮은 확률을 과대평가하는 심리적 편향에서 비롯된다." },
        { id: "D", text: "전망 이론은 공공 정책 설계에 깊은 영향을 미치고 있다." }
      ]},
      p3: { answer: "B", choices: [
        { id: "A", text: "가치 함수는 기준점을 중심으로 비대칭적 곡선을 그린다." },
        { id: "B", text: "사람들은 확률을 주관적으로 변환하여 의사 결정에 반영한다." },
        { id: "C", text: "전망 이론은 의료 분야에서 프레이밍 효과로 활용된다." },
        { id: "D", text: "인간은 절대적 부의 수준이 아니라 변화량으로 가치를 판단한다." }
      ]},
      p4: { answer: "C", choices: [
        { id: "A", text: "손실 회피 심리는 가치 함수를 통해 도식화할 수 있다." },
        { id: "B", text: "확률 가중 함수는 낮은 확률을 과대평가하는 경향을 보여 준다." },
        { id: "C", text: "전망 이론은 다양한 분야의 제도 설계에 영향을 미친다." },
        { id: "D", text: "합리적 인간 가정은 행동경제학에 의해 비판받고 있다." }
      ]}
    };
    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: pid, start: 0, end: para.text.length }] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        ...centralMap[pid],
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }

  // 복기 카드 8장
  const fullText = paragraphs.map(p => p.text).join('\n');
  const chunkSize = Math.ceil(fullText.length / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    cards.push({
      id: `c${i+1}`,
      text: fullText.substring(i * chunkSize, (i+1) * chunkSize)
    });
  }

  // 확인 문항 6개 (질문형, answerMatchMode: "ANY")
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "전통 경제학에서 가정한 인간 의사 결정의 특징을 나타내는 표현은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "효용을 극대화하는")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "전망 이론에서 사람들이 가치를 판단하는 기준이 되는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "기준점으로부터의 변화량")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "손실에서 느끼는 고통이 이득에서 느끼는 기쁨보다 대략 몇 배 크다고 알려져 있는가?",
      answerRanges: [findRange(paragraphs, "p2", "약 두 배 이상")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "낮은 확률의 과대평가를 보여 주는 대표적인 사례로 제시된 행동은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "복권 구매 행동")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "손실 회피 심리를 이용하여 저축률을 높이기 위해 설계된 제도는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "자동 가입 방식의 연금 제도")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "수술의 성공률과 실패율 강조에 따라 환자 동의가 달라지는 현상의 명칭은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "프레이밍 효과")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return {
    contentId: "dr-w3-021",
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: "일일 독해(비트겐슈타인 3) Day 21 비문학",
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "WITTGENSTEIN_3",
    schoolGradeRange: { min: 11, max: 12 },
    area: "READING",
    subArea: "NONFICTION",
    competencies: ["READING"],
    tags: ["daily"],
    access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480,
    assets: {},
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline },
      recall: {
        cards,
        correctOrder: cards.map(c => c.id),
        seedPenalty: 1
      },
      confirm: { questions: confirmQuestions }
    }
  };
}

// ── Day 22 문학: 이육사 「광야」 + 해설 ──
function buildDay22() {
  const paragraphs = [
    {
      id: "p1",
      text: "까마득한 날에 / 하늘이 처음 열리고 / 어데 닭 우는 소리 들렸으랴. // 모든 산맥들이 / 바다를 연모해 휘달릴 때도 / 차마 이곳을 범하던 못하였으리라. // 끊임없는 광음(光陰)을 / 부지런한 계절이 피어선 지고 / 큰 강물이 비로소 길을 열었다. // 지금 눈 내리고 / 매화 향기 홀로 아득하니 / 내 여기 가난한 노래의 씨를 뿌려라. // 다시 천고(千古)의 뒤에 / 백마 타고 오는 초인이 있어 / 이 광야에서 목놓아 부르게 하리라. — 이육사, 「광야」(1946년 유고 발표)"
    },
    {
      id: "p2",
      text: "이육사의 「광야」는 일제 강점기에 쓰인 대표적인 저항 시로, 광활한 자연 공간을 배경으로 민족의 시련과 미래에 대한 희망을 노래한다. 이육사는 본명이 이원록으로, 독립운동에 투신하여 열일곱 차례나 투옥된 이력을 지닌 저항 시인이다. 그의 필명 육사는 수감 당시 수인 번호 264에서 비롯된 것으로 알려져 있다. 이 시는 천지 개벽의 태초부터 미래의 어느 날까지를 시간적 범위로 설정하여 웅장한 시적 공간을 구축하고 있다. 화자는 현재의 고통스러운 시간을 인내하면서도 궁극적으로 도래할 광복의 날을 확신하는 태도를 보여 주고 있다. 시의 시간 구조는 태초에서 과거, 현재, 미래로 이어지는 순차적 흐름을 따르며, 이를 통해 역사적 필연으로서의 해방을 형상화한다. 특히 광야라는 제목 자체가 끝없이 펼쳐진 황량한 벌판을 의미하면서 동시에 그 무한한 가능성을 암시하는 중의적 표현으로 기능한다."
    },
    {
      id: "p3",
      text: "시의 핵심 이미지는 각 연에서 상징적으로 드러난다. 제1연의 하늘이 열리는 장면은 세계의 탄생을 의미하며, 닭 우는 소리라는 청각적 이미지를 통해 태초의 적막함을 강조한다. 제2연의 산맥이 바다를 연모하는 표현은 의인법을 활용하여 국토의 신성함을 강조하고, 이곳을 범하지 못하였다는 서술은 이 땅의 불가침성을 역설적으로 드러낸다. 제3연의 계절과 강물 이미지는 시간의 흐름 속에서 역사가 점차 방향을 찾아간다는 의미를 내포하며, 비로소라는 부사는 오랜 기다림 끝에 마침내 변화가 시작되었음을 암시한다. 제4연에서 눈과 매화는 시련 속에서도 꺾이지 않는 의지를 상징하며, 가난한 노래의 씨는 현재의 미약한 저항이 미래의 해방으로 이어질 가능성을 함축한다. 제5연의 백마 타고 오는 초인은 광복을 이끌 영웅적 존재 혹은 해방된 미래 세대를 상징하며, 이 광야에서 목놓아 부르게 하리라는 결의는 시적 화자의 확고한 신념을 드러낸다."
    },
    {
      id: "p4",
      text: "「광야」의 문학사적 의의는 저항시의 미학적 완성도에 있다. 이육사는 직접적인 항일 구호 대신 신화적 상상력과 웅장한 시간관을 통해 저항의 메시지를 전달하였다. 이러한 기법은 일제의 검열을 우회하면서도 독자에게 강렬한 감동을 전하는 이중적 효과를 발휘하였다. 또한 광야라는 공간은 식민 치하의 황폐한 현실인 동시에 무한한 가능성이 열린 미래의 터전이라는 이중적 의미를 지닌다. 같은 시기 활동한 윤동주가 내면의 성찰을 통해 저항 의식을 표현하였다면, 이육사는 역사적 웅장함과 미래 지향적 비전으로 저항시의 외연을 확장하였다고 할 수 있다. 이처럼 이육사는 시어의 상징성과 구조적 긴밀함을 통해 저항시가 예술적 가치와 역사적 사명을 동시에 달성할 수 있음을 입증한 시인으로 평가받는다."
    }
  ];

  const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
  console.log(`Day 22 지문 길이: ${totalLen}자`);

  const allSentences = {};
  paragraphs.forEach(p => { allSentences[p.id] = findSentences(p.text); });

  const timeline = [];
  let stepNum = 1;

  // p1 시 구절 - 문장 성분 질문
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p1", "광음(光陰)을")] },
    question: {
      prompt: "하이라이트된 말의 문장 성분으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "부사어" },
        { id: "B", text: "목적어" },
        { id: "C", text: "주어" },
        { id: "D", text: "서술어" }
      ],
      answerId: "B",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  // 각 문단 문장별 하이라이트 + 중심내용
  for (const pid of ["p1", "p2", "p3", "p4"]) {
    const para = paragraphs.find(p => p.id === pid);
    const sents = allSentences[pid];

    sents.forEach(s => {
      const otherSentences = [];
      paragraphs.forEach(p => {
        findSentences(p.text).forEach(os => {
          if (os.text !== s.text && os.text.length > 15) otherSentences.push(os.text);
        });
      });
      const shuffled = otherSentences.sort(() => Math.random() - 0.5);
      const wrongChoices = shuffled.slice(0, 3).map((t, i) => ({
        id: ["A","B","C","D"][i], text: t.length > 65 ? t.substring(0, 62) + "..." : t
      }));
      const answerPos = Math.floor(Math.random() * 4);
      const choices = [...wrongChoices];
      const answerText = s.text.length > 65 ? s.text.substring(0, 62) + "..." : s.text;
      choices.splice(answerPos, 0, { id: ["A","B","C","D"][answerPos], text: answerText });
      choices.forEach((c, i) => { c.id = ["A","B","C","D"][i]; });

      timeline.push({
        stepId: `s${stepNum++}`,
        highlight: { ranges: [{ paragraphId: pid, start: s.start, end: s.end }] },
        question: {
          prompt: "하이라이트된 문장의 내용으로 알맞은 것은?",
          choices,
          answerId: ["A","B","C","D"][answerPos],
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    const centralMap = {
      p1: { answer: "A", choices: [
        { id: "A", text: "태초부터 미래까지의 시간을 압축하여 광복의 희망을 노래하는 시이다." },
        { id: "B", text: "이육사는 직접적 항일 구호 대신 신화적 상상력으로 저항을 표현하였다." },
        { id: "C", text: "광야는 식민 치하의 현실과 미래의 터전이라는 이중적 의미를 지닌다." },
        { id: "D", text: "제4연의 매화는 시련 속에서도 꺾이지 않는 의지를 상징한다." }
      ]},
      p2: { answer: "B", choices: [
        { id: "A", text: "산맥의 의인화는 국토의 신성함을 강조하기 위한 기법이다." },
        { id: "B", text: "시의 시간 구조는 태초에서 미래로 이어지며 해방의 필연성을 형상화한다." },
        { id: "C", text: "백마 타고 오는 초인은 광복을 이끌 영웅적 존재를 상징한다." },
        { id: "D", text: "이육사는 저항시의 미학적 완성도를 높인 시인으로 평가받는다." }
      ]},
      p3: { answer: "C", choices: [
        { id: "A", text: "「광야」는 태초부터 미래까지의 웅장한 시간관을 특징으로 한다." },
        { id: "B", text: "화자는 현재의 고통을 인내하면서 광복의 날을 확신하고 있다." },
        { id: "C", text: "각 연의 핵심 이미지가 상징적으로 시의 주제를 구체화한다." },
        { id: "D", text: "저항시는 예술적 가치와 역사적 사명을 동시에 달성할 수 있다." }
      ]},
      p4: { answer: "D", choices: [
        { id: "A", text: "눈과 매화는 시련 속 의지를, 씨는 미래 해방의 가능성을 함축한다." },
        { id: "B", text: "시의 시간 구조는 순차적 흐름을 따르며 역사적 필연을 형상화한다." },
        { id: "C", text: "사람들은 객관적 확률을 주관적으로 변환하여 의사 결정에 반영한다." },
        { id: "D", text: "「광야」는 상징성과 구조적 긴밀함으로 저항시의 미학적 완성을 보여 준다." }
      ]}
    };
    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: pid, start: 0, end: para.text.length }] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        ...centralMap[pid],
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }

  // 복기 카드 8장
  const fullText = paragraphs.map(p => p.text).join('\n');
  const chunkSize = Math.ceil(fullText.length / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    cards.push({ id: `c${i+1}`, text: fullText.substring(i * chunkSize, (i+1) * chunkSize) });
  }

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "시에서 세계의 탄생을 의미하는 장면을 묘사한 표현은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "하늘이 처음 열리고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "국토의 신성함을 강조하기 위해 의인법이 활용된 표현은 어디인가?",
      answerRanges: [findRange(paragraphs, "p1", "바다를 연모해 휘달릴 때도")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "시련 속에서도 꺾이지 않는 의지를 상징하는 시어 두 가지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "눈 내리고"), findRange(paragraphs, "p1", "매화 향기 홀로 아득하니")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "광복을 이끌 영웅적 존재를 상징하는 표현은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "백마 타고 오는 초인")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이육사가 일제 검열을 우회하면서 저항 메시지를 전달한 기법은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "신화적 상상력과 웅장한 시간관")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "광야라는 공간이 지닌 이중적 의미 중 미래와 관련된 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "무한한 가능성이 열린 미래의 터전")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return {
    contentId: "dr-w3-022",
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: "일일 독해(비트겐슈타인 3) Day 22 문학",
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "WITTGENSTEIN_3",
    schoolGradeRange: { min: 11, max: 12 },
    area: "READING",
    subArea: "LITERATURE",
    competencies: ["READING"],
    tags: ["daily"],
    access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480,
    assets: {},
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline },
      recall: {
        cards,
        correctOrder: cards.map(c => c.id),
        seedPenalty: 1
      },
      confirm: { questions: confirmQuestions }
    }
  };
}

// ── Day 23 비문학: 법률 - 계약의 성립과 효력 ──
function buildDay23() {
  const paragraphs = [
    {
      id: "p1",
      text: "계약이란 둘 이상의 당사자가 서로 대립하는 의사 표시의 합치에 의하여 성립하는 법률 행위를 말한다. 민법에서 계약은 청약과 승낙이라는 두 가지 의사 표시가 합치될 때 성립한다고 규정한다. 청약이란 계약 성립을 목적으로 상대방에게 하는 확정적 의사 표시로, 일정한 내용의 계약을 체결하겠다는 의사가 명확해야 한다. 승낙은 청약에 대하여 그 내용대로 계약을 성립시키겠다는 의사 표시이다. 만약 승낙자가 청약의 내용을 변경하여 응답하면 이는 새로운 청약으로 간주된다. 청약과 승낙의 내용이 일치하면 계약이 성립하며, 이때부터 당사자 간에는 계약에 따른 권리와 의무가 발생한다. 한편 계약은 반드시 서면으로 체결해야 하는 것은 아니며 구두 합의만으로도 법적 효력을 가질 수 있다."
    },
    {
      id: "p2",
      text: "계약이 유효하게 성립하기 위해서는 일정한 요건을 갖추어야 한다. 우선 당사자에게 의사 능력과 행위 능력이 있어야 하며, 의사 표시에 하자가 없어야 한다. 의사 능력이란 자신의 행위의 의미와 결과를 판단할 수 있는 정신적 능력을 의미하고, 행위 능력이란 단독으로 유효한 법률 행위를 할 수 있는 능력을 의미한다. 미성년자나 피성년후견인 등 행위 능력이 제한되는 자가 체결한 계약은 법정대리인의 동의가 없으면 취소할 수 있다. 또한 사기나 강박에 의한 의사 표시는 하자 있는 의사 표시로서 취소의 대상이 되며, 착오에 의한 의사 표시도 법률행위 내용의 중요 부분에 착오가 있는 경우 취소할 수 있다. 다만 표의자의 중대한 과실로 인한 착오의 경우에는 취소가 제한될 수 있다."
    },
    {
      id: "p3",
      text: "계약의 내용이 확정될 수 있어야 하고, 실현 가능해야 하며, 사회적 타당성을 갖추어야 한다는 점도 중요하다. 계약의 내용이 불확정적이거나 실현 불가능한 경우 계약은 무효가 된다. 예를 들어 이미 멸실된 건물의 매매 계약은 이행 불능으로 무효이다. 또한 선량한 풍속이나 사회 질서에 반하는 내용의 계약도 무효로 처리된다. 이는 계약 자유의 원칙에도 불구하고 공공의 이익과 사회적 질서를 보호하기 위한 법적 제한이다. 한편 불공정한 법률 행위 즉 당사자의 궁박 경솔 또는 무경험을 이용하여 현저하게 공정을 잃은 법률 행위 역시 무효로 규정된다. 이러한 제한들은 사적 자치의 원칙과 사회적 형평 사이의 균형을 유지하기 위한 장치이다."
    },
    {
      id: "p4",
      text: "계약이 유효하게 성립하면 당사자는 계약 내용에 따른 채무를 이행할 의무를 진다. 채무 불이행이 발생하면 채권자는 강제 이행을 청구하거나 손해 배상을 청구할 수 있으며, 일정한 요건 하에 계약을 해제할 수도 있다. 채무 불이행의 유형으로는 이행 지체, 이행 불능, 불완전 이행의 세 가지가 있다. 이행 지체는 이행기가 도래하였음에도 채무자가 이행하지 않는 것이고, 이행 불능은 채무자의 귀책 사유로 이행이 불가능해진 것이며, 불완전 이행은 이행은 하였으나 불완전한 것을 의미한다. 특히 불완전 이행의 경우 추완 청구 즉 완전한 이행을 다시 요구하는 것이 가능하다. 계약 해제는 소급적으로 계약 관계를 소멸시키며, 이미 이행된 급부는 원상 회복의 대상이 된다. 이처럼 계약법은 당사자 간의 합의를 법적으로 보호하면서도 사회적 공정성과 약자 보호라는 공익적 가치를 함께 추구하는 체계적 구조를 갖추고 있다."
    }
  ];

  const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
  console.log(`Day 23 지문 길이: ${totalLen}자`);

  const allSentences = {};
  paragraphs.forEach(p => { allSentences[p.id] = findSentences(p.text); });

  const timeline = [];
  let stepNum = 1;

  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p1", "법률 행위")] },
    question: {
      prompt: "하이라이트된 말의 문장 성분으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "주어" },
        { id: "B", text: "서술어" },
        { id: "C", text: "목적어" },
        { id: "D", text: "보어" }
      ],
      answerId: "C",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  for (const pid of ["p1", "p2", "p3", "p4"]) {
    const para = paragraphs.find(p => p.id === pid);
    const sents = allSentences[pid];

    sents.forEach(s => {
      const otherSentences = [];
      paragraphs.forEach(p => {
        findSentences(p.text).forEach(os => {
          if (os.text !== s.text && os.text.length > 15) otherSentences.push(os.text);
        });
      });
      const shuffled = otherSentences.sort(() => Math.random() - 0.5);
      const wrongChoices = shuffled.slice(0, 3).map((t) => ({
        id: "X", text: t.length > 65 ? t.substring(0, 62) + "..." : t
      }));
      const answerPos = Math.floor(Math.random() * 4);
      const choices = [...wrongChoices];
      const answerText = s.text.length > 65 ? s.text.substring(0, 62) + "..." : s.text;
      choices.splice(answerPos, 0, { id: "X", text: answerText });
      choices.forEach((c, i) => { c.id = ["A","B","C","D"][i]; });

      timeline.push({
        stepId: `s${stepNum++}`,
        highlight: { ranges: [{ paragraphId: pid, start: s.start, end: s.end }] },
        question: {
          prompt: "하이라이트된 문장의 내용으로 알맞은 것은?",
          choices,
          answerId: ["A","B","C","D"][answerPos],
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    const centralMap = {
      p1: { answer: "A", choices: [
        { id: "A", text: "계약은 청약과 승낙의 합치에 의해 성립하는 법률 행위이다." },
        { id: "B", text: "의사 능력은 행위의 의미와 결과를 판단할 수 있는 정신적 능력이다." },
        { id: "C", text: "계약 내용이 불확정적이거나 실현 불가능하면 무효가 된다." },
        { id: "D", text: "채무 불이행 시 채권자는 강제 이행이나 손해 배상을 청구할 수 있다." }
      ]},
      p2: { answer: "B", choices: [
        { id: "A", text: "청약과 승낙의 내용이 일치하면 계약이 성립한다." },
        { id: "B", text: "계약의 유효한 성립을 위해서는 당사자의 능력과 의사 표시의 하자 여부가 중요하다." },
        { id: "C", text: "선량한 풍속에 반하는 계약은 무효로 처리된다." },
        { id: "D", text: "이행 불능은 채무자의 귀책 사유로 이행이 불가능해진 것이다." }
      ]},
      p3: { answer: "C", choices: [
        { id: "A", text: "미성년자가 체결한 계약은 법정대리인의 동의 없이는 취소 가능하다." },
        { id: "B", text: "채무 불이행의 유형에는 이행 지체, 이행 불능, 불완전 이행이 있다." },
        { id: "C", text: "계약 내용은 확정 가능하고 실현 가능하며 사회적으로 타당해야 한다." },
        { id: "D", text: "계약은 청약이라는 확정적 의사 표시로부터 시작된다." }
      ]},
      p4: { answer: "D", choices: [
        { id: "A", text: "사기나 강박에 의한 의사 표시는 하자 있는 의사 표시로 취소 가능하다." },
        { id: "B", text: "불공정한 법률 행위는 궁박이나 무경험을 이용한 경우 무효이다." },
        { id: "C", text: "계약 자유의 원칙에도 공익을 위한 법적 제한이 존재한다." },
        { id: "D", text: "채무 불이행 시의 구제 수단과 계약법의 체계적 구조를 설명한다." }
      ]}
    };
    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: pid, start: 0, end: para.text.length }] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        ...centralMap[pid],
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }

  const fullText = paragraphs.map(p => p.text).join('\n');
  const chunkSize = Math.ceil(fullText.length / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    cards.push({ id: `c${i+1}`, text: fullText.substring(i * chunkSize, (i+1) * chunkSize) });
  }

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "계약 성립을 위한 두 가지 의사 표시는 각각 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "청약과 승낙")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "자신의 행위의 의미와 결과를 판단할 수 있는 능력을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "의사 능력")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "행위 능력이 제한되는 자가 체결한 계약에 대해 어떤 조치가 가능한가?",
      answerRanges: [findRange(paragraphs, "p2", "법정대리인의 동의가 없으면 취소할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "선량한 풍속에 반하는 계약에 대해 법은 어떻게 처리하는가?",
      answerRanges: [findRange(paragraphs, "p3", "무효로 처리된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "채무 불이행의 세 가지 유형은 각각 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "이행 지체, 이행 불능, 불완전 이행")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이행기가 도래하였으나 채무자가 이행하지 않는 유형을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "이행 지체")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "계약법이 합의 보호와 함께 추구하는 공익적 가치는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "사회적 공정성과 약자 보호")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return {
    contentId: "dr-w3-023",
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: "일일 독해(비트겐슈타인 3) Day 23 비문학",
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "WITTGENSTEIN_3",
    schoolGradeRange: { min: 11, max: 12 },
    area: "READING",
    subArea: "NONFICTION",
    competencies: ["READING"],
    tags: ["daily"],
    access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480,
    assets: {},
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline },
      recall: {
        cards,
        correctOrder: cards.map(c => c.id),
        seedPenalty: 1
      },
      confirm: { questions: confirmQuestions }
    }
  };
}

// ── Day 24 문학: 김소월 「진달래꽃」 + 해설 ──
function buildDay24() {
  const paragraphs = [
    {
      id: "p1",
      text: "나 보기가 역겨워 / 가실 때에는 / 말없이 고이 보내 드리오리다. // 영변(寧邊)에 약산(藥山) / 진달래꽃 / 아름 따다 가실 길에 뿌리오리다. // 가시는 걸음걸음 / 놓인 그 꽃을 / 사뿐히 즈려밟고 가시옵소서. // 나 보기가 역겨워 / 가실 때에는 / 죽어도 아니 눈물 흘리오리다. — 김소월, 「진달래꽃」(1925, 시집 『진달래꽃』 수록)"
    },
    {
      id: "p2",
      text: "김소월의 「진달래꽃」은 한국 현대시를 대표하는 서정시로, 이별의 정한을 절제된 어조로 노래한 작품이다. 김소월은 1902년 평안북도 구성군에서 태어나 오산학교에서 스승 김억의 영향 아래 시작 활동을 시작하였으며, 1925년 시집 『진달래꽃』을 펴내었다. 이 시는 떠나는 임에 대한 화자의 복합적인 감정을 담고 있으며, 겉으로는 순종적인 태도를 보이면서도 내면에는 깊은 슬픔과 미련이 자리하고 있다. 화자는 이별을 거부하거나 원망하는 대신 진달래꽃을 가실 길에 뿌리겠다는 헌신적 태도를 통해 사랑의 깊이를 역설적으로 드러낸다. 이러한 표현 방식은 한국 전통 시가에서 나타나는 이별의 정서를 현대적으로 계승한 것으로 평가된다. 특히 가정법적 상황 설정을 통해 화자가 실제로 이별을 경험하고 있는지 혹은 예상하고 있는지가 모호하게 처리되어 시의 여운을 한층 깊게 만든다."
    },
    {
      id: "p3",
      text: "시의 구조와 표현 기법을 살펴보면, 전체 4연으로 구성되어 수미상관의 구조를 이루고 있다. 제1연과 제4연이 유사한 문장 구조를 반복하면서 시적 통일성을 확보하는 동시에 정서의 심화를 이루어 낸다. 제1연에서 말없이 고이 보내겠다고 했던 화자가 제4연에서는 죽어도 아니 눈물 흘리겠다고 선언함으로써 체념의 강도가 극대화되는 것이다. 제2연에서 진달래꽃을 뿌리겠다는 표현은 시각적 이미지를 통해 이별의 장면을 아름답게 형상화하며, 영변 약산이라는 구체적 지명은 화자의 정서에 사실감을 부여한다. 아름 따다라는 표현은 두 팔 가득 꽃을 안는 모습을 나타내어 헌신의 정도를 구체화한다. 제3연의 즈려밟고 가시옵소서라는 역설적 표현은 화자의 극도의 체념과 역설적 사랑을 동시에 드러내는 핵심 구절이다. 또한 오리다 오리다라는 의지적 어미의 반복은 화자의 결연한 태도를 힘주어 강조하면서도 그 이면에 숨겨진 애절함을 부각시킨다."
    },
    {
      id: "p4",
      text: "「진달래꽃」의 문학사적 의의는 민요적 율격과 현대적 서정의 결합에 있다. 김소월은 전통 민요의 3음보 율격을 현대시의 형식 안에 자연스럽게 녹여 냄으로써 한국적 정서를 가장 잘 표현한 시인으로 평가받는다. 진달래꽃이라는 소재 자체가 한국의 산야에 이른 봄이면 어디에서든 지천으로 만개하여 피어나는 토속적 꽃이라는 점에서 민족적 정서와 밀접하게 연결된다. 이 시에서 진달래꽃은 단순한 자연물이 아니라 화자의 사랑과 희생을 상징하는 매개체로 기능한다. 꽃을 따서 길에 뿌리는 행위는 전통적인 꽃길 깔기의 풍습을 연상시키면서도 이별의 쓸쓸함을 함께 담아낸다. 시적 화자가 보여 주는 체념적 수용의 자세는 한국인 특유의 정서인 한의 미학을 대표하는 것으로, 이 작품이 시대를 초월하여 사랑받는 이유이기도 하다. 나아가 이 시는 고려 속요 「가시리」나 「서경별곡」 등에서 이어져 온 한국 이별시의 전통을 현대적으로 완성한 대표적 성과로 자리매김한다."
    }
  ];

  const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
  console.log(`Day 24 지문 길이: ${totalLen}자`);

  const allSentences = {};
  paragraphs.forEach(p => { allSentences[p.id] = findSentences(p.text); });

  const timeline = [];
  let stepNum = 1;

  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p2", "서정시")] },
    question: {
      prompt: "하이라이트된 말의 문장 성분으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "서술어" },
        { id: "B", text: "보어" },
        { id: "C", text: "주어" },
        { id: "D", text: "부사어" }
      ],
      answerId: "B",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  for (const pid of ["p1", "p2", "p3", "p4"]) {
    const para = paragraphs.find(p => p.id === pid);
    const sents = allSentences[pid];

    sents.forEach(s => {
      const otherSentences = [];
      paragraphs.forEach(p => {
        findSentences(p.text).forEach(os => {
          if (os.text !== s.text && os.text.length > 15) otherSentences.push(os.text);
        });
      });
      const shuffled = otherSentences.sort(() => Math.random() - 0.5);
      const wrongChoices = shuffled.slice(0, 3).map(t => ({
        id: "X", text: t.length > 65 ? t.substring(0, 62) + "..." : t
      }));
      const answerPos = Math.floor(Math.random() * 4);
      const choices = [...wrongChoices];
      const answerText = s.text.length > 65 ? s.text.substring(0, 62) + "..." : s.text;
      choices.splice(answerPos, 0, { id: "X", text: answerText });
      choices.forEach((c, i) => { c.id = ["A","B","C","D"][i]; });

      timeline.push({
        stepId: `s${stepNum++}`,
        highlight: { ranges: [{ paragraphId: pid, start: s.start, end: s.end }] },
        question: {
          prompt: "하이라이트된 문장의 내용으로 알맞은 것은?",
          choices,
          answerId: ["A","B","C","D"][answerPos],
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    const centralMap = {
      p1: { answer: "A", choices: [
        { id: "A", text: "떠나는 임을 말없이 보내되 진달래꽃을 뿌리며 눈물조차 흘리지 않겠다는 화자의 결의이다." },
        { id: "B", text: "제1연과 제4연의 반복은 수미상관 구조로 시적 통일성을 확보한다." },
        { id: "C", text: "김소월은 민요적 율격을 현대시에 녹여 한국적 정서를 잘 표현하였다." },
        { id: "D", text: "진달래꽃은 화자의 사랑과 희생을 상징하는 매개체로 기능한다." }
      ]},
      p2: { answer: "B", choices: [
        { id: "A", text: "즈려밟고 가시옵소서는 극도의 체념과 역설적 사랑을 드러낸다." },
        { id: "B", text: "화자는 순종적 태도 이면에 깊은 슬픔과 미련을 담아 사랑의 깊이를 역설적으로 보여 준다." },
        { id: "C", text: "한의 미학은 한국인 특유의 정서로 이 작품의 핵심이다." },
        { id: "D", text: "진달래꽃은 한국 산야에 널리 피는 토속적 꽃으로 민족 정서와 연결된다." }
      ]},
      p3: { answer: "C", choices: [
        { id: "A", text: "화자는 이별을 순종적으로 수용하면서도 내면에 슬픔과 미련을 품고 있다." },
        { id: "B", text: "이 시는 한국 전통 시가의 이별 정서를 현대적으로 계승한 것으로 평가된다." },
        { id: "C", text: "수미상관 구조와 역설적 표현, 의지적 어미 반복 등의 기법이 사용되었다." },
        { id: "D", text: "민요의 3음보 율격이 현대시 형식에 자연스럽게 녹아 있다." }
      ]},
      p4: { answer: "D", choices: [
        { id: "A", text: "제2연의 진달래꽃 이미지는 이별 장면을 아름답게 형상화한다." },
        { id: "B", text: "오리다의 반복은 결연한 태도와 애절함을 동시에 부각시킨다." },
        { id: "C", text: "화자의 복합적 감정은 겉의 순종과 내면의 슬픔으로 구성된다." },
        { id: "D", text: "민요적 율격과 현대적 서정의 결합, 한의 미학이 문학사적 의의이다." }
      ]}
    };
    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: pid, start: 0, end: para.text.length }] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        ...centralMap[pid],
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }

  const fullText = paragraphs.map(p => p.text).join('\n');
  const chunkSize = Math.ceil(fullText.length / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    cards.push({ id: `c${i+1}`, text: fullText.substring(i * chunkSize, (i+1) * chunkSize) });
  }

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "화자가 떠나는 임에게 취하겠다고 한 태도는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "말없이 고이 보내 드리오리다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "시에서 극도의 체념과 역설적 사랑을 동시에 드러내는 표현은 어디인가?",
      answerRanges: [findRange(paragraphs, "p1", "사뿐히 즈려밟고 가시옵소서")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "제1연과 제4연의 유사한 구조가 이루는 기법의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "수미상관")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "김소월이 현대시에 녹여 낸 전통적 율격은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "3음보 율격")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "진달래꽃이 이 시에서 상징하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "화자의 사랑과 희생을 상징하는 매개체")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이 작품이 대표하는 한국인 특유의 정서는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "한의 미학")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return {
    contentId: "dr-w3-024",
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: "일일 독해(비트겐슈타인 3) Day 24 문학",
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "WITTGENSTEIN_3",
    schoolGradeRange: { min: 11, max: 12 },
    area: "READING",
    subArea: "LITERATURE",
    competencies: ["READING"],
    tags: ["daily"],
    access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480,
    assets: {},
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline },
      recall: {
        cards,
        correctOrder: cards.map(c => c.id),
        seedPenalty: 1
      },
      confirm: { questions: confirmQuestions }
    }
  };
}

// ── Day 25 비문학: 과학 - 엔트로피와 열역학 제2법칙 ──
function buildDay25() {
  const paragraphs = [
    {
      id: "p1",
      text: "열역학 제2법칙은 자연 현상의 방향성을 규정하는 물리학의 근본 법칙 중 하나이다. 이 법칙에 따르면 고립계에서 엔트로피는 항상 증가하거나 일정하게 유지되며 결코 자발적으로 감소하지 않는다. 엔트로피란 계의 무질서도를 나타내는 물리량으로, 열역학적 과정에서 에너지가 얼마나 비가역적으로 분산되었는지를 정량적으로 측정하는 개념이다. 예컨대 뜨거운 물과 찬 물을 섞으면 열은 항상 뜨거운 쪽에서 찬 쪽으로 이동하여 결국 같은 온도에 도달하지만, 그 역방향의 과정은 자발적으로 일어나지 않는다. 이처럼 열역학 제2법칙은 모든 자연 과정이 특정한 방향으로만 진행된다는 비가역성의 원리를 담고 있다. 이 법칙은 에너지 보존 법칙인 제1법칙과 달리 에너지 변환의 질적 측면을 다룬다는 점에서 구별된다."
    },
    {
      id: "p2",
      text: "엔트로피 개념은 19세기 독일의 물리학자 클라우지우스에 의해 처음 도입되었다. 클라우지우스는 열기관의 효율을 분석하는 과정에서 열이 고온에서 저온으로 이동할 때 일부 에너지가 유용한 일로 전환되지 못하고 소산된다는 사실에 주목하였다. 이 소산되는 에너지의 정도를 정량화한 것이 바로 엔트로피이다. 이후 볼츠만은 통계역학적 관점에서 엔트로피를 재해석하여 미시 상태의 수와 관련짓는 공식을 제시하였다. 볼츠만의 해석에 따르면 엔트로피가 높은 상태란 가능한 미시 상태의 수가 많은 상태, 즉 무질서한 배열이 더 많이 존재하는 상태를 의미한다. 이러한 통계역학적 접근은 거시적 열역학 법칙을 미시적 입자 운동으로부터 유도할 수 있는 이론적 기반을 제공하였다."
    },
    {
      id: "p3",
      text: "열역학 제2법칙은 열기관의 효율에 대한 근본적인 한계를 설정한다. 카르노는 이상적인 열기관에서도 공급받은 열에너지를 모두 일로 전환할 수는 없으며, 반드시 일부는 저온 열원으로 방출해야 한다는 사실을 증명하였다. 이것이 열효율의 상한을 규정하는 카르노 정리이다. 카르노 효율은 고온 열원과 저온 열원의 절대 온도 비에 의해 결정되므로, 열효율을 높이려면 고온 열원의 온도를 높이거나 저온 열원의 온도를 낮추어야 한다. 현대의 화력 발전소나 내연 기관도 이 카르노 효율의 제약 아래에서 작동하며, 실제 효율은 이론적 상한보다 항상 낮다. 영구 기관이 불가능한 것도 이 법칙의 직접적인 귀결인데, 외부 에너지 공급 없이 무한히 일을 수행하는 기관은 엔트로피 증가 법칙에 위배되기 때문이다. 역사적으로 수많은 영구 기관 설계가 제안되었으나 모두 이 근본적 한계를 극복하지 못하였다."
    },
    {
      id: "p4",
      text: "엔트로피의 개념은 물리학을 넘어 정보 이론과 생명 과학 등 다양한 분야로 확장되어 활용되고 있다. 정보 이론에서 섀넌은 정보의 불확실성을 엔트로피로 정의하여 통신 시스템의 효율을 분석하는 이론적 기반을 마련하였다. 이 개념은 오늘날 데이터 압축과 암호화 기술의 근간을 이루고 있다. 생명 과학에서 생물체는 외부로부터 에너지를 흡수하여 내부의 질서를 유지하는 개방계로, 국소적으로는 엔트로피를 감소시키지만 외부 환경의 엔트로피를 더 크게 증가시킴으로써 전체적으로는 제2법칙을 만족시킨다. 슈뢰딩거는 이를 생명체가 음의 엔트로피를 섭취한다는 비유로 설명한 바 있다. 이처럼 엔트로피와 열역학 제2법칙은 물질세계의 변화 방향을 이해하는 핵심 원리로서 현대 과학 전반에 걸쳐 광범위한 설명력을 지닌다."
    }
  ];

  const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
  console.log(`Day 25 지문 길이: ${totalLen}자`);

  const allSentences = {};
  paragraphs.forEach(p => { allSentences[p.id] = findSentences(p.text); });

  const timeline = [];
  let stepNum = 1;

  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p1", "물리량")] },
    question: {
      prompt: "하이라이트된 말의 문장 성분으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "부사어" },
        { id: "B", text: "주어" },
        { id: "C", text: "보어" },
        { id: "D", text: "목적어" }
      ],
      answerId: "C",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });

  for (const pid of ["p1", "p2", "p3", "p4"]) {
    const para = paragraphs.find(p => p.id === pid);
    const sents = allSentences[pid];

    sents.forEach(s => {
      const otherSentences = [];
      paragraphs.forEach(p => {
        findSentences(p.text).forEach(os => {
          if (os.text !== s.text && os.text.length > 15) otherSentences.push(os.text);
        });
      });
      const shuffled = otherSentences.sort(() => Math.random() - 0.5);
      const wrongChoices = shuffled.slice(0, 3).map(t => ({
        id: "X", text: t.length > 65 ? t.substring(0, 62) + "..." : t
      }));
      const answerPos = Math.floor(Math.random() * 4);
      const choices = [...wrongChoices];
      const answerText = s.text.length > 65 ? s.text.substring(0, 62) + "..." : s.text;
      choices.splice(answerPos, 0, { id: "X", text: answerText });
      choices.forEach((c, i) => { c.id = ["A","B","C","D"][i]; });

      timeline.push({
        stepId: `s${stepNum++}`,
        highlight: { ranges: [{ paragraphId: pid, start: s.start, end: s.end }] },
        question: {
          prompt: "하이라이트된 문장의 내용으로 알맞은 것은?",
          choices,
          answerId: ["A","B","C","D"][answerPos],
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    const centralMap = {
      p1: { answer: "A", choices: [
        { id: "A", text: "엔트로피는 항상 증가하며 자연 과정은 비가역적 방향으로 진행된다." },
        { id: "B", text: "클라우지우스는 열기관 효율 분석에서 엔트로피 개념을 도입하였다." },
        { id: "C", text: "카르노 효율은 고온과 저온 열원의 절대 온도 비로 결정된다." },
        { id: "D", text: "생물체는 외부 에너지를 흡수하여 내부 질서를 유지하는 개방계이다." }
      ]},
      p2: { answer: "B", choices: [
        { id: "A", text: "뜨거운 물과 찬 물의 혼합은 비가역적 과정의 대표적 예이다." },
        { id: "B", text: "클라우지우스가 엔트로피를 도입하고 볼츠만이 통계역학적으로 재해석하였다." },
        { id: "C", text: "열기관에서 공급받은 에너지를 모두 일로 전환할 수 없다." },
        { id: "D", text: "정보 이론에서 섀넌은 정보 불확실성을 엔트로피로 정의하였다." }
      ]},
      p3: { answer: "C", choices: [
        { id: "A", text: "고립계에서 엔트로피는 자발적으로 감소하지 않는다." },
        { id: "B", text: "볼츠만의 엔트로피는 미시 상태의 수와 관련된 개념이다." },
        { id: "C", text: "열기관의 효율에는 근본적 한계가 있으며 영구 기관은 불가능하다." },
        { id: "D", text: "엔트로피 개념은 물리학을 넘어 다양한 분야로 확장되고 있다." }
      ]},
      p4: { answer: "D", choices: [
        { id: "A", text: "엔트로피가 높은 상태는 가능한 미시 상태의 수가 많은 상태이다." },
        { id: "B", text: "카르노 정리는 열효율의 상한을 규정한다." },
        { id: "C", text: "열역학 제2법칙은 모든 자연 과정의 비가역성을 담고 있다." },
        { id: "D", text: "엔트로피는 정보 이론, 생명 과학 등으로 확장되어 광범위한 설명력을 지닌다." }
      ]}
    };
    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: pid, start: 0, end: para.text.length }] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        ...centralMap[pid],
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }

  const fullText = paragraphs.map(p => p.text).join('\n');
  const chunkSize = Math.ceil(fullText.length / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    cards.push({ id: `c${i+1}`, text: fullText.substring(i * chunkSize, (i+1) * chunkSize) });
  }

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "엔트로피가 나타내는 것은 계의 어떤 특성인가?",
      answerRanges: [findRange(paragraphs, "p1", "무질서도")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "엔트로피 개념을 처음 도입한 물리학자는 누구인가?",
      answerRanges: [findRange(paragraphs, "p2", "클라우지우스")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "볼츠만이 엔트로피를 재해석한 관점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "통계역학적 관점")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "열효율의 상한을 규정하는 정리의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "카르노 정리")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "영구 기관이 불가능한 이유는 어떤 법칙에 위배되기 때문인가?",
      answerRanges: [findRange(paragraphs, "p3", "엔트로피 증가 법칙")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "정보 이론에서 정보의 불확실성을 엔트로피로 정의한 인물은 누구인가?",
      answerRanges: [findRange(paragraphs, "p4", "섀넌")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "생물체가 내부 질서를 유지할 수 있는 이유는 어떤 유형의 계이기 때문인가?",
      answerRanges: [findRange(paragraphs, "p4", "개방계")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q8",
      prompt: "카르노 효율을 높이기 위해 고온 열원의 온도를 어떻게 해야 하는가?",
      answerRanges: [findRange(paragraphs, "p3", "고온 열원의 온도를 높이거나")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return {
    contentId: "dr-w3-025",
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: "일일 독해(비트겐슈타인 3) Day 25 비문학",
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "WITTGENSTEIN_3",
    schoolGradeRange: { min: 11, max: 12 },
    area: "READING",
    subArea: "NONFICTION",
    competencies: ["READING"],
    tags: ["daily"],
    access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480,
    assets: {},
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline },
      recall: {
        cards,
        correctOrder: cards.map(c => c.id),
        seedPenalty: 1
      },
      confirm: { questions: confirmQuestions }
    }
  };
}

// ── 메인 실행 ──
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const BATCH_PATH = path.join(ROOT, 'generated', 'daily-batch-reading-wittgenstein3.json');
  const STATIC_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'wittgenstein3');

  const builders = [
    { day: 21, build: buildDay21 },
    { day: 22, build: buildDay22 },
    { day: 23, build: buildDay23 },
    { day: 24, build: buildDay24 },
    { day: 25, build: buildDay25 }
  ];

  // 각 Day 콘텐츠 생성
  const contents = {};
  for (const { day, build } of builders) {
    contents[day] = build();
  }

  // static 파일 생성
  for (const { day } of builders) {
    const fileName = String(day).padStart(3, '0') + '.json';
    const filePath = path.join(STATIC_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(contents[day], null, 2), 'utf8');
    console.log(`✓ ${filePath} 저장 완료`);
  }

  // 배치 파일 업데이트 (최신 상태 다시 읽기)
  console.log('\n배치 파일 읽는 중...');
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`배치 파일 총 items: ${batchData.items.length}`);

  for (const { day } of builders) {
    const idx = day - 1; // items[20]~[24]
    const subArea = day % 2 === 1 ? 'NONFICTION' : 'LITERATURE';
    const subAreaLabel = day % 2 === 1 ? '비문학' : '문학';

    batchData.items[idx] = {
      content_type: "DAILY_READING",
      level_id: "WITTGENSTEIN_3",
      area: "READING",
      sub_area: subArea,
      day_index: day,
      module_key: "reading_training",
      schema_version: "1.0",
      content: contents[day]
    };
    console.log(`✓ items[${idx}] (Day ${day} ${subAreaLabel}) 교체 완료`);
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`\n✓ 배치 파일 저장 완료: ${BATCH_PATH}`);

  // 검증
  console.log('\n=== 검증 ===');
  for (const { day } of builders) {
    const c = contents[day];
    const pLen = c.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
    const recallCards = c.payload.recall.cards.length;
    const confirmQs = c.payload.confirm.questions.length;
    const steps = c.payload.intensive.timeline.length;
    console.log(`Day ${day}: 지문=${pLen}자, 정독=${steps}문항, 복기=${recallCards}장, 확인=${confirmQs}문항, subArea=${c.subArea}`);
  }
}

main();
