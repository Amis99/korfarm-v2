// 비트겐슈타인2 Day 16~20 불량 콘텐츠 재작성 빌더
// 짝수 day = LITERATURE, 홀수 day = NONFICTION
// 목표: 1500자 ±50, 4문단, 고등 수준

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated', 'daily-batch-reading-wittgenstein2.json');
const STATIC_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'wittgenstein2');

// ── 유틸리티 ──
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
  if (!para) throw new Error(`문단 ${pid}를 찾을 수 없습니다`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText.substring(0,30)}..." not found in ${pid}`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function totalLength(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

// ── Day 16: 문학 (LITERATURE) ──
function buildDay16() {
  const paragraphs = [
    {
      id: "p1",
      text: "황순원의 소설 「소나기」는 소년과 소녀의 순수한 만남과 이별을 서정적으로 그려낸 한국 단편문학의 대표작이다. 이 작품은 시골 마을을 배경으로 두 아이의 짧지만 강렬한 감정의 교류를 섬세하게 포착하며, 자연의 풍경이 인물의 내면과 긴밀하게 호응하는 구조를 취하고 있다. 소년은 개울가에서 처음 소녀를 마주치는데, 소녀가 맑은 물에 비친 자신의 얼굴을 들여다보는 장면은 거울 이미지를 통해 자기 인식과 타자 인식이 동시에 발생하는 순간을 상징적으로 드러낸다. 소년이 소녀에게 느끼는 감정은 직접적인 고백이나 설명 없이 행동과 시선의 미세한 변화를 통해서만 암시되는데, 이러한 서술 방식은 독자로 하여금 텍스트의 빈 공간을 능동적으로 채우도록 유도하는 수용미학적 전략에 해당한다."
    },
    {
      id: "p2",
      text: "작품에서 소나기는 단순한 기상 현상이 아니라 서사 전체를 관통하는 핵심적 상징으로 기능한다. 소나기가 갑작스럽게 내리기 시작하면 소년과 소녀는 수숫단 속에 함께 몸을 숨기게 되고, 이 좁은 공간은 두 인물 사이의 물리적이고 심리적인 거리를 극적으로 압축한다. 비에 젖는 과정은 사회적 규범과 일상적 질서가 일시적으로 해체되는 카니발적 시간을 형성하며, 이 속에서 소년과 소녀는 평소에는 불가능했던 친밀함을 자연스럽게 경험하게 된다. 소나기가 그친 뒤 맑은 하늘에 무지개가 걸리는 장면은 두 사람의 감정이 절정에 도달했음을 시각적으로 표상하는 동시에, 그 아름다운 감정이 무지개처럼 곧 사라질 것이라는 비극적인 예감을 내포하고 있다."
    },
    {
      id: "p3",
      text: "이 소설의 결말에서 소녀의 죽음은 직접 서술되지 않고 소녀 아버지의 전언을 통해 간접적으로 전달된다. 소녀가 자신이 그날 입었던 옷을 그대로 입혀서 묻어 달라고 유언했다는 사실은 소년과 함께한 그 소중한 하루의 기억이 소녀에게 어떤 의미였는지를 압축적으로 보여준다. 이처럼 핵심적인 사건을 직접 묘사하지 않고 주변 인물의 말이나 암시적 정보를 통해 간접적으로 제시하는 서술 기법은 독자의 감정적 충격을 오히려 증폭시키는 효과를 낳는다. 이는 미국의 소설가 어니스트 헤밍웨이가 제시한 빙산 이론과 유사한 서사 원리로, 수면 위에 드러난 부분보다 수면 아래 감추어진 부분이 더 큰 의미를 지닌다는 문학적 인식에 기반하고 있다."
    },
    {
      id: "p4",
      text: "「소나기」가 발표된 이후 반세기가 넘도록 꾸준히 읽히는 이유는 보편적 정서를 특수한 풍경 속에 용해시킨 작가의 탁월한 역량에 있다. 황순원은 한국 농촌의 구체적인 지형과 선명한 계절감을 치밀하게 재현하면서도, 그 안에서 인간이라면 누구나 한 번쯤 경험하는 상실과 그리움이라는 보편적 감정을 길어 올린다. 개울물 소리, 논둑길의 코스모스, 메밀꽃이 피어 있는 들판 같은 구체적이고 감각적인 이미지들은 특정한 장소성을 확보하는 동시에 독자 각자의 원풍경을 환기시키는 촉매로 작용한다. 이러한 특질 덕분에 이 작품은 한국 서정소설의 전범으로 평가받으며, 성장과 상실이라는 인류 보편의 서사 원형을 가장 절제된 형식으로 아름답게 구현한 사례로 한국 문학사에 기록되고 있다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 16 지문 길이: ${len}자`);

  // 정독 타임라인
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);
    sents.forEach((sent, si) => {
      stepNum++;
      const range = { paragraphId: para.id, start: sent.start, end: sent.end };
      let question;

      if (pi === 0 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 「소나기」가 지닌 문학사적 위상에 대한 설명으로 가장 적절한 것은?",
          choices: [
            { id: "A", text: "한국 장편문학의 사실주의적 전통을 수립한 작품이다" },
            { id: "B", text: "한국 단편문학의 대표작으로 서정적 성격을 지닌다" },
            { id: "C", text: "식민지 시대의 저항 정신을 상징하는 역사 소설이다" },
            { id: "D", text: "전후 세대의 허무주의를 반영한 실험적 소설이다" }
          ],
          answerId: "B"
        };
      } else if (pi === 0 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 '거울 이미지'가 상징하는 바로 가장 적절한 것은?",
          choices: [
            { id: "A", text: "소녀가 자신의 외모에 집착하는 허영심을 나타낸다" },
            { id: "B", text: "자기 인식과 타자 인식이 동시에 일어나는 순간을 나타낸다" },
            { id: "C", text: "물이라는 자연물이 두 사람을 갈라놓는 장벽을 나타낸다" },
            { id: "D", text: "시골 마을의 맑은 자연환경을 사실적으로 묘사한다" }
          ],
          answerId: "B"
        };
      } else if (pi === 1 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 소나기의 서사적 기능에 대한 설명으로 적절한 것은?",
          choices: [
            { id: "A", text: "서사 전체를 관통하는 핵심 상징으로 기능한다" },
            { id: "B", text: "인물 간의 갈등을 해소하는 화해의 매개체이다" },
            { id: "C", text: "작품의 시대적 배경을 구체화하는 장치이다" },
            { id: "D", text: "서술자의 주관적 감정을 직접 드러내는 수단이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 '카니발적 시간'의 의미로 가장 적절한 것은?",
          choices: [
            { id: "A", text: "축제처럼 즐겁고 화려한 분위기가 조성되는 시간이다" },
            { id: "B", text: "사회적 규범과 일상적 질서가 일시적으로 해체되는 시간이다" },
            { id: "C", text: "과거와 현재가 혼재되어 시간 감각을 상실하는 순간이다" },
            { id: "D", text: "등장인물이 현실에서 환상의 세계로 이동하는 순간이다" }
          ],
          answerId: "B"
        };
      } else if (pi === 2 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 소녀의 죽음이 전달되는 방식으로 적절한 것은?",
          choices: [
            { id: "A", text: "서술자가 전지적 시점에서 직접적으로 묘사하고 있다" },
            { id: "B", text: "소녀 아버지의 전언을 통해 간접적으로 전달되고 있다" },
            { id: "C", text: "소년의 내면 독백을 통해 회상 형식으로 제시되고 있다" },
            { id: "D", text: "편지라는 삽입 텍스트를 통해 우회적으로 암시되고 있다" }
          ],
          answerId: "B"
        };
      } else if (pi === 2 && si === 3) {
        question = {
          prompt: "하이라이트된 문장에서 설명하는 '빙산 이론'의 핵심 원리로 적절한 것은?",
          choices: [
            { id: "A", text: "드러난 부분보다 감추어진 부분이 더 큰 의미를 지닌다" },
            { id: "B", text: "서사의 핵심을 도입부에 집중적으로 배치해야 한다" },
            { id: "C", text: "작가의 의도를 독자에게 명시적으로 전달해야 한다" },
            { id: "D", text: "비유와 상징보다 사실적 묘사를 우선시해야 한다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 「소나기」가 오래 읽히는 이유로 제시된 것은?",
          choices: [
            { id: "A", text: "시대를 초월하는 철학적 담론을 제시하기 때문이다" },
            { id: "B", text: "보편적 정서를 특수한 풍경 속에 용해시킨 역량 때문이다" },
            { id: "C", text: "실험적 서술 기법으로 문학적 혁신을 이루었기 때문이다" },
            { id: "D", text: "역사적 사건을 정확하게 기록한 자료적 가치 때문이다" }
          ],
          answerId: "B"
        };
      } else if (pi === 3 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 감각적 이미지들이 수행하는 이중적 역할로 적절한 것은?",
          choices: [
            { id: "A", text: "사건의 인과관계를 명확히 하고 서사의 논리성을 강화한다" },
            { id: "B", text: "구체적 장소성 확보와 독자의 원풍경 환기를 동시에 수행한다" },
            { id: "C", text: "인물의 성격을 직접 제시하고 갈등의 원인을 밝혀준다" },
            { id: "D", text: "시대적 배경을 재현하고 작가의 이념적 지향을 드러낸다" }
          ],
          answerId: "B"
        };
      } else {
        // 일반 문장 내용 파악 문제
        const otherSents = [];
        paragraphs.forEach((op, opi) => {
          if (opi !== pi) {
            const os = findSentences(op.text);
            os.forEach(s => otherSents.push(s.text));
          }
        });
        const correctText = sent.text.length > 60 ? sent.text.substring(0, 60) + '...' : sent.text;
        const wrongs = [];
        for (let k = 0; k < otherSents.length && wrongs.length < 3; k++) {
          const t = otherSents[k].length > 60 ? otherSents[k].substring(0, 60) + '...' : otherSents[k];
          if (t !== correctText) wrongs.push(t);
        }
        const allChoices = [
          { id: "A", text: correctText },
          { id: "B", text: wrongs[0] || "해당 없음" },
          { id: "C", text: wrongs[1] || "해당 없음" },
          { id: "D", text: wrongs[2] || "해당 없음" }
        ];
        // 셔플
        const shuffled = shuffleWithAnswer(allChoices, "A");
        question = {
          prompt: "하이라이트된 문장의 내용으로 가장 적절한 것은?",
          choices: shuffled.choices,
          answerId: shuffled.answerId
        };
      }

      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [range] },
        question: {
          ...question,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    // 문단별 중심내용 문제
    stepNum++;
    const paraRange = { paragraphId: para.id, start: 0, end: para.text.length };
    const centralThemes = [
      "「소나기」의 작품적 특성과 서술 방식의 미학적 의의",
      "소나기 장면의 상징적 의미와 서사 구조적 기능",
      "간접적 서술 기법이 독자에게 미치는 감정적 효과",
      "보편적 정서와 특수한 풍경의 결합이 낳은 문학적 성취"
    ];
    const wrongThemes = [
      "한국 농촌 경제의 구조적 문제와 사회적 불평등",
      "서양 문학 이론의 한국적 수용과 비판적 변용",
      "전후 문학 세대의 실존주의적 고민과 허무 의식"
    ];
    const cChoices = [
      { id: "A", text: centralThemes[pi] },
      { id: "B", text: wrongThemes[0] },
      { id: "C", text: wrongThemes[1] },
      { id: "D", text: wrongThemes[2] }
    ];
    const cShuffled = shuffleWithAnswer(cChoices, "A");
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [paraRange] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        choices: cShuffled.choices,
        answerId: cShuffled.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  });

  // 복기 카드 (정확히 8장)
  const fullText = paragraphs.map(p => p.text).join('\n');
  const cards = splitIntoCards(fullText, 8);

  // 확인 문제 (5~8문항, 질문형, answerMatchMode: "ANY")
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "소년이 소녀를 처음 마주친 장소는 어디로 표현되어 있는가?",
      answerRanges: [findRange(paragraphs, "p1", "개울가")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "소나기가 올 때 소년과 소녀가 몸을 숨긴 장소는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "수숫단")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "소나기가 그친 뒤 하늘에 나타난 자연 현상은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "무지개")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "소녀의 죽음을 간접적으로 전달하는 인물은 누구인가?",
      answerRanges: [findRange(paragraphs, "p3", "소녀 아버지")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "핵심 사건을 간접적으로 제시하는 기법과 유사한 서사 원리로 언급된 이론은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "빙산 이론")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이 작품이 한국 문학사에서 어떤 소설의 전범으로 평가받는다고 하였는가?",
      answerRanges: [findRange(paragraphs, "p4", "서정소설")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(16, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 17: 비문학 (NONFICTION) ──
function buildDay17() {
  const paragraphs = [
    {
      id: "p1",
      text: "인공지능의 발전 과정에서 가장 획기적인 전환점 중 하나는 딥러닝 기술의 등장이다. 딥러닝은 인간 뇌의 신경망 구조를 모방한 인공신경망을 여러 층으로 쌓아 올려 데이터에서 특징을 추출하고 학습하는 기계학습의 한 갈래이다. 전통적인 기계학습에서는 인간 전문가가 데이터의 어떤 특징을 주목해야 하는지 직접 설계하는 특징 공학 과정이 필수적이었으나, 딥러닝은 원시 데이터를 입력받아 각 층에서 추상화된 표현을 자동으로 학습한다는 점에서 근본적 차별성을 지닌다. 이미지 인식의 예를 들면, 하위 층에서는 점과 선 같은 저수준 특징을, 중간 층에서는 윤곽과 질감 같은 중수준 특징을, 상위 층에서는 얼굴이나 사물 같은 고수준 개념을 파악해 나간다."
    },
    {
      id: "p2",
      text: "딥러닝이 학계의 관심에서 벗어나 있던 시기가 있었다. 1980년대에 역전파 알고리즘이 제안되면서 다층 신경망의 학습이 이론적으로 가능해졌으나, 층이 깊어질수록 기울기가 급격히 소멸하는 기울기 소실 문제가 발견되어 깊은 신경망의 실질적 훈련이 사실상 불가능하다는 인식이 퍼졌다. 이러한 한계를 돌파한 것은 2006년 제프리 힌턴 연구팀이 제안한 사전 훈련 기법이었다. 이 기법은 각 층을 비지도 학습으로 먼저 초기화한 뒤 전체 네트워크를 지도 학습으로 미세 조정하는 이단계 접근법으로, 기울기 소실 문제를 우회하면서 깊은 신경망의 효과적인 학습을 가능하게 하였다. 이후 드롭아웃, 배치 정규화, 렐루 활성화 함수 등 다양한 기술적 혁신이 뒤따르면서 딥러닝의 성능과 안정성은 비약적으로 향상되었다."
    },
    {
      id: "p3",
      text: "딥러닝의 폭발적 성장을 가능하게 한 또 다른 요인은 하드웨어의 발전과 대규모 데이터의 축적이다. 그래픽 처리 장치인 GPU는 원래 영상 렌더링을 위해 설계되었으나, 수천 개의 연산 코어를 활용한 대규모 병렬 처리 능력이 행렬 연산 중심의 신경망 학습에 탁월한 적합성을 보였다. 이에 더해 인터넷의 확산과 디지털 기기의 보급은 이전에는 상상할 수 없었던 규모의 학습 데이터를 생성하였고, 이러한 빅데이터의 등장은 대규모 매개변수를 지닌 딥러닝 모델이 과적합 없이 일반화 성능을 확보하는 데 결정적인 역할을 하였다. 알고리즘의 혁신, 하드웨어의 진화, 데이터의 폭증이라는 세 가지 조건이 동시에 충족됨으로써 딥러닝은 이론적 가능성의 단계를 넘어 실용적 돌파를 이루게 되었다."
    },
    {
      id: "p4",
      text: "오늘날 딥러닝은 자연어 처리, 자율주행, 신약 개발, 기후 예측 등 거의 모든 분야에 침투하여 산업과 학문의 지형을 근본적으로 변화시키고 있다. 특히 트랜스포머 아키텍처에 기반한 대규모 언어 모델은 텍스트 생성과 이해에서 인간에 준하는 성능을 보이며 큰 주목을 받고 있다. 그러나 딥러닝 모델의 의사결정 과정이 블랙박스처럼 불투명하다는 해석 가능성의 문제, 학습 데이터에 내재된 편향이 출력에 그대로 반영되는 공정성의 문제, 대규모 모델 훈련에 소요되는 에너지 소비로 인한 환경적 문제 등은 딥러닝의 미래를 좌우할 핵심 과제로 부상하고 있다. 이러한 도전 과제를 해결하지 않고서는 딥러닝의 사회적 수용과 지속 가능한 발전을 기대하기 어렵다는 점에서, 기술적 성능 향상 못지않게 윤리적이고 제도적인 논의가 시급히 요구되고 있다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 17 지문 길이: ${len}자`);

  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);
    sents.forEach((sent, si) => {
      stepNum++;
      const range = { paragraphId: para.id, start: sent.start, end: sent.end };
      let question;

      if (pi === 0 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 딥러닝 기술이 지닌 의의로 가장 적절한 것은?",
          choices: [
            { id: "A", text: "인공지능 발전에서 가장 획기적인 전환점 중 하나이다" },
            { id: "B", text: "기존 기계학습을 완전히 대체한 유일한 기술이다" },
            { id: "C", text: "인간의 지능을 이미 초월한 완성된 기술이다" },
            { id: "D", text: "특정 분야에만 적용 가능한 제한적 기술이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 0 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 딥러닝이 전통적 기계학습과 구별되는 핵심 차이는 무엇인가?",
          choices: [
            { id: "A", text: "더 적은 양의 데이터로도 높은 성능을 달성할 수 있다" },
            { id: "B", text: "원시 데이터로부터 추상화된 표현을 자동으로 학습한다" },
            { id: "C", text: "인간 전문가의 개입이 더 많이 필요하다는 점이다" },
            { id: "D", text: "단일 층의 신경망만으로도 복잡한 학습이 가능하다" }
          ],
          answerId: "B"
        };
      } else if (pi === 1 && si === 1) {
        question = {
          prompt: "하이라이트된 문장에서 깊은 신경망의 학습을 어렵게 한 문제는 무엇인가?",
          choices: [
            { id: "A", text: "데이터 부족으로 인한 과적합 문제이다" },
            { id: "B", text: "층이 깊어질수록 기울기가 소멸하는 문제이다" },
            { id: "C", text: "컴퓨팅 자원의 부족으로 인한 속도 저하 문제이다" },
            { id: "D", text: "알고리즘의 저작권 분쟁으로 인한 접근성 문제이다" }
          ],
          answerId: "B"
        };
      } else if (pi === 1 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 기울기 소실 문제를 돌파한 주체와 시기로 적절한 것은?",
          choices: [
            { id: "A", text: "제프리 힌턴 연구팀, 2006년" },
            { id: "B", text: "앨런 튜링 연구팀, 1950년" },
            { id: "C", text: "얀 르쿤 연구팀, 1998년" },
            { id: "D", text: "앤드류 응 연구팀, 2012년" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 1) {
        question = {
          prompt: "하이라이트된 문장에서 GPU가 신경망 학습에 적합한 이유로 제시된 것은?",
          choices: [
            { id: "A", text: "전력 소비가 적어 장시간 운용이 가능하기 때문이다" },
            { id: "B", text: "수천 개의 연산 코어를 활용한 대규모 병렬 처리 능력 때문이다" },
            { id: "C", text: "영상 렌더링에 최적화된 그래픽 알고리즘 때문이다" },
            { id: "D", text: "단일 코어의 연산 속도가 CPU보다 빠르기 때문이다" }
          ],
          answerId: "B"
        };
      } else if (pi === 3 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 딥러닝의 현재 영향력에 대한 설명으로 적절한 것은?",
          choices: [
            { id: "A", text: "거의 모든 분야에 침투하여 산업과 학문의 지형을 변화시키고 있다" },
            { id: "B", text: "자연어 처리 분야에서만 실용적 성과를 거두고 있다" },
            { id: "C", text: "학계에서는 관심을 잃었으나 산업계에서만 활용되고 있다" },
            { id: "D", text: "이론적 연구 단계에 머물러 실제 적용은 제한적이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 딥러닝의 핵심 과제로 언급되지 않은 것은?",
          choices: [
            { id: "A", text: "의사결정 과정의 불투명성인 해석 가능성 문제" },
            { id: "B", text: "학습 데이터의 편향이 반영되는 공정성 문제" },
            { id: "C", text: "대규모 모델 훈련의 에너지 소비로 인한 환경적 문제" },
            { id: "D", text: "인공지능이 인간의 일자리를 대체하는 고용 문제" }
          ],
          answerId: "D"
        };
      } else {
        const otherSents = [];
        paragraphs.forEach((op, opi) => {
          if (opi !== pi) {
            const os = findSentences(op.text);
            os.forEach(s => otherSents.push(s.text));
          }
        });
        const correctText = sent.text.length > 60 ? sent.text.substring(0, 60) + '...' : sent.text;
        const wrongs = [];
        for (let k = 0; k < otherSents.length && wrongs.length < 3; k++) {
          const t = otherSents[k].length > 60 ? otherSents[k].substring(0, 60) + '...' : otherSents[k];
          if (t !== correctText) wrongs.push(t);
        }
        const allChoices = [
          { id: "A", text: correctText },
          { id: "B", text: wrongs[0] || "해당 없음" },
          { id: "C", text: wrongs[1] || "해당 없음" },
          { id: "D", text: wrongs[2] || "해당 없음" }
        ];
        const shuffled = shuffleWithAnswer(allChoices, "A");
        question = {
          prompt: "하이라이트된 문장의 내용으로 가장 적절한 것은?",
          choices: shuffled.choices,
          answerId: shuffled.answerId
        };
      }

      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [range] },
        question: {
          ...question,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    // 문단별 중심내용
    stepNum++;
    const paraRange = { paragraphId: para.id, start: 0, end: para.text.length };
    const centralThemes = [
      "딥러닝의 정의와 전통적 기계학습과의 근본적 차이",
      "딥러닝 발전의 역사적 과정과 기울기 소실 문제의 극복",
      "하드웨어 발전과 대규모 데이터가 딥러닝 성장에 미친 영향",
      "딥러닝의 광범위한 응용과 해결해야 할 윤리적 과제들"
    ];
    const wrongThemes = [
      "양자컴퓨팅의 원리와 기존 컴퓨터와의 성능 비교",
      "블록체인 기술의 구조적 특성과 금융 분야 적용 사례",
      "유전자 편집 기술의 윤리적 쟁점과 사회적 규제 방안"
    ];
    const cChoices = [
      { id: "A", text: centralThemes[pi] },
      { id: "B", text: wrongThemes[0] },
      { id: "C", text: wrongThemes[1] },
      { id: "D", text: wrongThemes[2] }
    ];
    const cShuffled = shuffleWithAnswer(cChoices, "A");
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [paraRange] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        choices: cShuffled.choices,
        answerId: cShuffled.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  });

  const fullText = paragraphs.map(p => p.text).join('\n');
  const cards = splitIntoCards(fullText, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "딥러닝이 모방한 인간 신체 구조의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "신경망")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "전통적 기계학습에서 인간 전문가가 수행해야 했던 과정은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "특징 공학")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "층이 깊어질수록 발생하여 학습을 어렵게 한 문제의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "기울기 소실")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "신경망 학습에 탁월한 적합성을 보인 하드웨어 장치는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "GPU")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "딥러닝 모델의 의사결정 과정이 불투명한 것을 무엇에 비유하고 있는가?",
      answerRanges: [findRange(paragraphs, "p4", "블랙박스")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "텍스트 생성과 이해에서 주목받는 모델의 기반이 되는 아키텍처 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "트랜스포머")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "딥러닝의 실용적 돌파를 가능하게 한 세 가지 조건 중 데이터 관련 요인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "데이터의 폭증")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(17, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 18: 문학 (LITERATURE) ──
function buildDay18() {
  const paragraphs = [
    {
      id: "p1",
      text: "윤동주의 시 「서시」는 일제 강점기 말기라는 암울한 시대적 배경 속에서 쓰인 작품으로, 자기 성찰과 윤리적 결의를 서정적 언어로 응축시킨 한국 현대시의 대표작이다. 화자는 '죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를'이라는 첫 구절에서 자신의 삶 전체를 관통하는 윤리적 지향을 분명하게 선언하는데, 이때의 하늘은 단순한 자연물이 아니라 양심과 도덕의 절대적 기준을 표상하는 초월적 심급으로 기능한다. 부끄럼이라는 감정은 타인의 시선이 아닌 자기 내면의 엄격한 잣대에서 비롯되는 것으로, 이는 화자가 외부적 강제가 아닌 내적 당위에 의해 스스로의 삶을 검증하려는 주체적 태도를 드러낸다."
    },
    {
      id: "p2",
      text: "시의 중반부에서 화자는 '잎새에 이는 바람에도 나는 괴로워했다'라고 고백하는데, 이 구절은 화자의 예민한 감수성과 윤리적 민감성을 동시에 드러낸다. 잎새에 이는 바람은 극히 미세한 자극을 의미하며, 그러한 사소한 것에도 괴로움을 느낀다는 것은 화자가 세계의 고통에 대해 과잉이라 할 만큼 깊이 공감하는 존재임을 시사한다. 이러한 태도는 식민지 지식인으로서 무력감과 죄책감이 결합된 심리적 상태를 반영하는 것으로 해석될 수 있으며, 동시에 세계의 부조리에 대해 둔감해지기를 거부하는 윤리적 각성의 표현이기도 하다. 바람이라는 자연의 현상을 통해 화자의 내면적 갈등이 외적 이미지로 전환되는 이 대목은 윤동주 시의 핵심적 기법인 자연 상관물의 활용을 잘 보여준다."
    },
    {
      id: "p3",
      text: "시의 후반부에서 화자는 '별을 노래하는 마음으로 모든 죽어 가는 것을 사랑해야지'라고 다짐하는데, 이 구절에서 별은 이상과 희망의 상징이며 죽어 가는 것은 식민지 현실 속에서 억압당하고 소멸해 가는 모든 존재를 포괄한다. 노래하는 마음은 절망 속에서도 아름다움과 의미를 추구하려는 시적 의지를 나타내며, 사랑이라는 동사는 단순한 감정이 아니라 고통받는 존재에 대한 적극적인 연대와 헌신의 의미를 담고 있다. 이처럼 이 시는 개인의 내면적 성찰에서 출발하여 타자에 대한 윤리적 책임으로 확장되는 구조를 취하고 있으며, 이러한 확장의 논리는 레비나스의 타자 윤리학에서 말하는 타자의 얼굴에 대한 무한한 책임이라는 관념과 깊은 친화성을 보인다."
    },
    {
      id: "p4",
      text: "「서시」가 시대를 초월하여 사랑받는 이유는 그것이 특정한 역사적 상황에 대한 저항시이면서 동시에 인간 존재의 보편적 조건에 대한 깊은 성찰을 담고 있기 때문이다. 일제 강점기라는 구체적 맥락을 벗어나더라도, 자신의 삶을 윤리적으로 살고자 하는 열망과 그 열망을 실현하지 못하는 데서 오는 괴로움은 시대와 장소를 불문하고 모든 인간이 공유하는 경험이다. 윤동주의 언어는 구호나 주장의 형식이 아니라 고백과 다짐의 형식을 취함으로써 독자에게 강요가 아닌 공감을 이끌어 내며, 이러한 절제된 어조가 오히려 시의 윤리적 설득력을 극대화하는 역설적 효과를 발휘한다. 이 작품은 한국 문학사에서 저항과 서정의 결합을 가장 높은 수준으로 성취한 시편으로, 문학이 윤리적 실천과 어떻게 만날 수 있는지를 보여주는 살아 있는 증거이다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 18 지문 길이: ${len}자`);

  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);
    sents.forEach((sent, si) => {
      stepNum++;
      const range = { paragraphId: para.id, start: sent.start, end: sent.end };
      let question;

      if (pi === 0 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 「서시」의 문학사적 위상에 대한 설명으로 적절한 것은?",
          choices: [
            { id: "A", text: "한국 현대시의 대표작으로 자기 성찰과 윤리적 결의를 담고 있다" },
            { id: "B", text: "해방 이후 민주화 운동을 노래한 참여시의 선구적 작품이다" },
            { id: "C", text: "자연의 아름다움을 극사실적으로 묘사한 전원시의 전범이다" },
            { id: "D", text: "서양 모더니즘 기법을 최초로 도입한 실험적 시 작품이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 0 && si === 1) {
        question = {
          prompt: "하이라이트된 문장에서 '하늘'이 상징하는 의미로 가장 적절한 것은?",
          choices: [
            { id: "A", text: "화자가 동경하는 이상적 자연 공간을 의미한다" },
            { id: "B", text: "양심과 도덕의 절대적 기준을 표상하는 초월적 심급이다" },
            { id: "C", text: "식민지 조국의 광복에 대한 염원을 나타낸다" },
            { id: "D", text: "종교적 구원의 대상으로서 신의 존재를 상징한다" }
          ],
          answerId: "B"
        };
      } else if (pi === 1 && si === 1) {
        question = {
          prompt: "하이라이트된 문장에서 '잎새에 이는 바람'이 의미하는 바로 적절한 것은?",
          choices: [
            { id: "A", text: "극히 미세한 자극을 의미한다" },
            { id: "B", text: "강렬한 역사적 사건을 은유적으로 표현한다" },
            { id: "C", text: "자연의 위협적인 힘을 상징한다" },
            { id: "D", text: "시간의 흐름에 따른 계절의 변화를 나타낸다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 3) {
        question = {
          prompt: "하이라이트된 문장에서 윤동주 시의 핵심적 기법으로 제시된 것은?",
          choices: [
            { id: "A", text: "반복과 병렬 구조를 통한 운율의 강화 기법이다" },
            { id: "B", text: "자연 상관물의 활용을 통한 내면의 외적 전환이다" },
            { id: "C", text: "의식의 흐름 기법을 통한 무의식의 탐구이다" },
            { id: "D", text: "알레고리를 통한 정치적 메시지의 우회적 전달이다" }
          ],
          answerId: "B"
        };
      } else if (pi === 2 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 '별'과 '죽어 가는 것'이 각각 상징하는 바로 적절한 것은?",
          choices: [
            { id: "A", text: "별은 이상과 희망, 죽어 가는 것은 억압당하는 존재를 상징한다" },
            { id: "B", text: "별은 먼 고향, 죽어 가는 것은 사라지는 전통 문화를 상징한다" },
            { id: "C", text: "별은 신의 은총, 죽어 가는 것은 인간의 원죄를 상징한다" },
            { id: "D", text: "별은 과거의 기억, 죽어 가는 것은 유년기의 순수함을 상징한다" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 3) {
        question = {
          prompt: "하이라이트된 문장에서 이 시의 구조적 특징으로 제시된 것은?",
          choices: [
            { id: "A", text: "개인의 내면적 성찰에서 타자에 대한 윤리적 책임으로 확장된다" },
            { id: "B", text: "외부 세계의 묘사에서 내면의 고백으로 수렴하는 구조이다" },
            { id: "C", text: "과거의 회상에서 미래의 전망으로 시간적 전환이 이루어진다" },
            { id: "D", text: "구체적 사건의 서술에서 추상적 관념의 제시로 이동한다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 「서시」가 시대를 초월하여 사랑받는 이유로 제시된 것은?",
          choices: [
            { id: "A", text: "저항시이면서 인간 존재의 보편적 조건에 대한 성찰을 담고 있기 때문이다" },
            { id: "B", text: "실험적 형식으로 한국 현대시의 새로운 가능성을 열었기 때문이다" },
            { id: "C", text: "식민지 역사를 객관적으로 기록한 사료적 가치를 지니기 때문이다" },
            { id: "D", text: "아름다운 자연 풍경을 감각적으로 재현한 미적 성취 때문이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 윤동주의 언어가 독자에게 공감을 이끌어내는 방식으로 적절한 것은?",
          choices: [
            { id: "A", text: "구호나 주장이 아닌 고백과 다짐의 형식을 취하기 때문이다" },
            { id: "B", text: "일상적 구어체를 사용하여 친근감을 형성하기 때문이다" },
            { id: "C", text: "풍부한 각주와 해설을 통해 이해를 돕기 때문이다" },
            { id: "D", text: "역사적 사실을 구체적으로 나열하여 설득력을 높이기 때문이다" }
          ],
          answerId: "A"
        };
      } else {
        const otherSents = [];
        paragraphs.forEach((op, opi) => {
          if (opi !== pi) {
            const os = findSentences(op.text);
            os.forEach(s => otherSents.push(s.text));
          }
        });
        const correctText = sent.text.length > 60 ? sent.text.substring(0, 60) + '...' : sent.text;
        const wrongs = [];
        for (let k = 0; k < otherSents.length && wrongs.length < 3; k++) {
          const t = otherSents[k].length > 60 ? otherSents[k].substring(0, 60) + '...' : otherSents[k];
          if (t !== correctText) wrongs.push(t);
        }
        const allChoices = [
          { id: "A", text: correctText },
          { id: "B", text: wrongs[0] || "해당 없음" },
          { id: "C", text: wrongs[1] || "해당 없음" },
          { id: "D", text: wrongs[2] || "해당 없음" }
        ];
        const shuffled = shuffleWithAnswer(allChoices, "A");
        question = {
          prompt: "하이라이트된 문장의 내용으로 가장 적절한 것은?",
          choices: shuffled.choices,
          answerId: shuffled.answerId
        };
      }

      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [range] },
        question: {
          ...question,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    stepNum++;
    const paraRange = { paragraphId: para.id, start: 0, end: para.text.length };
    const centralThemes = [
      "「서시」의 문학사적 위치와 화자의 윤리적 지향 선언",
      "바람 이미지를 통해 드러나는 화자의 윤리적 민감성과 갈등",
      "별과 죽어 가는 것에 대한 사랑을 통한 타자 윤리로의 확장",
      "시대를 초월하는 보편성과 저항·서정의 결합이 이룬 문학적 성취"
    ];
    const wrongThemes = [
      "해방 공간의 이념적 혼란과 문학인들의 정치적 선택",
      "김소월의 시에서 나타나는 전통적 율격과 한의 정서",
      "서양 실존주의 철학이 한국 전후 문학에 미친 영향"
    ];
    const cChoices = [
      { id: "A", text: centralThemes[pi] },
      { id: "B", text: wrongThemes[0] },
      { id: "C", text: wrongThemes[1] },
      { id: "D", text: wrongThemes[2] }
    ];
    const cShuffled = shuffleWithAnswer(cChoices, "A");
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [paraRange] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        choices: cShuffled.choices,
        answerId: cShuffled.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  });

  const fullText = paragraphs.map(p => p.text).join('\n');
  const cards = splitIntoCards(fullText, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "화자가 삶 전체를 관통하는 기준으로 삼은 감정은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "부끄럼")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "화자가 사소한 자극에도 느꼈다고 고백한 감정은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "괴로움")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "윤동주 시의 핵심적 기법으로 제시된 자연물 활용 방식의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "자연 상관물")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "이 시의 확장 구조와 친화성을 보이는 윤리학의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "타자 윤리학")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이 작품이 한국 문학사에서 결합을 성취한 두 가지 요소는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "저항과 서정")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "윤동주의 언어가 취하는 형식으로 제시된 두 가지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "고백과 다짐")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(18, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 19: 비문학 (NONFICTION) ──
function buildDay19() {
  const paragraphs = [
    {
      id: "p1",
      text: "행동경제학은 전통 경제학이 전제하는 합리적 인간상에 의문을 제기하며 등장한 학문 분야이다. 고전 경제학에서는 경제 주체가 완전한 정보를 보유하고 효용을 극대화하는 방향으로 일관되게 의사결정을 내린다고 가정하였으나, 행동경제학은 실제 인간의 판단과 선택이 다양한 인지적 편향과 심리적 요인에 의해 체계적으로 왜곡된다는 사실을 실험적으로 입증하였다. 대니얼 카너먼과 아모스 트버스키는 전망 이론을 통해 인간이 이익과 손실을 대칭적으로 평가하지 않음을 밝혔는데, 동일한 크기의 이익보다 손실이 약 두 배 이상의 심리적 충격을 준다는 손실 회피 성향은 투자, 보험, 소비 등 경제적 의사결정 전반에 광범위한 영향을 미치는 것으로 확인되었다."
    },
    {
      id: "p2",
      text: "행동경제학에서 발견한 대표적 인지 편향 중 하나는 현재 편향이다. 현재 편향이란 미래의 더 큰 보상보다 지금 당장의 작은 보상을 선호하는 경향을 말하며, 이는 저축 부족, 건강 관리 소홀, 학습 계획의 지연 같은 다양한 비합리적 행동의 원인이 된다. 전통 경제학에서는 할인율이 시간에 걸쳐 일정하다고 가정하지만, 실제로 사람들은 가까운 미래의 보상에 대해서는 극단적으로 높은 할인율을 적용하고 먼 미래의 보상에 대해서는 상대적으로 낮은 할인율을 적용하는 쌍곡선형 할인 패턴을 보인다. 이러한 발견은 사람들이 장기 목표를 세우면서도 실행에 반복적으로 실패하는 현상을 설명해 주며, 연금 자동 가입 제도처럼 개인의 의사결정 구조를 사전에 설계하여 장기적으로 유리한 선택을 유도하는 정책적 처방의 이론적 기반이 되었다."
    },
    {
      id: "p3",
      text: "리처드 탈러가 제안한 넛지 이론은 행동경제학의 연구 성과를 정책적으로 응용한 대표적 사례이다. 넛지란 강제나 금지 없이 선택의 자유를 보존하면서도 사람들이 더 나은 결정을 내리도록 선택 환경을 의도적으로 설계하는 부드러운 개입을 의미한다. 예를 들어 구내식당에서 건강한 음식을 눈높이에 배치하면 별도의 규제 없이도 건강한 식습관이 자연스럽게 촉진되며, 장기 기증의 디폴트 옵션을 동의로 설정한 국가에서는 기증 동의율이 극적으로 상승하는 것으로 나타났다. 넛지의 핵심 원리는 사람들이 복잡한 상황에서 기본값을 유지하려는 현상 유지 편향과 제시된 정보의 형식에 따라 판단이 달라지는 프레이밍 효과를 활용하는 데 있으며, 이러한 접근법은 자유주의적 간섭주의라 불리며 현대 공공정책의 새로운 패러다임으로 자리 잡았다."
    },
    {
      id: "p4",
      text: "행동경제학은 경제학뿐 아니라 의료, 교육, 환경, 법률 등 다양한 분야에서 실질적 정책 혁신을 이끌어 내고 있다. 의료 분야에서는 약물 복용 알림 시스템이나 건강 검진의 디폴트 예약 설정을 통해 환자의 치료 순응도를 높이는 데 성공하였으며, 교육 분야에서는 학생들에게 소액의 금전적 인센티브를 즉시 지급하는 방식이 장기적 학업 성취도 향상에 효과적이라는 실험 결과가 보고되었다. 그러나 행동경제학적 개입이 개인의 자율적 의사결정 능력을 약화시킬 수 있다는 비판도 제기되고 있으며, 정책 설계자가 무엇이 더 나은 선택인지 판단하는 기준의 정당성에 대한 철학적 논쟁도 진행 중이다. 이러한 논의는 행동경제학이 단순한 기술적 도구를 넘어 인간의 자유와 복지 사이의 균형이라는 근본적 가치 문제와 직결되어 있음을 보여준다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 19 지문 길이: ${len}자`);

  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);
    sents.forEach((sent, si) => {
      stepNum++;
      const range = { paragraphId: para.id, start: sent.start, end: sent.end };
      let question;

      if (pi === 0 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 행동경제학이 등장한 배경으로 적절한 것은?",
          choices: [
            { id: "A", text: "전통 경제학이 전제하는 합리적 인간상에 의문을 제기하며 등장하였다" },
            { id: "B", text: "기존 경제학의 수학적 모형을 더 정교하게 발전시키기 위해 등장하였다" },
            { id: "C", text: "경제 성장률 예측의 정확도를 높이기 위한 필요에서 등장하였다" },
            { id: "D", text: "국제 무역 이론의 한계를 보완하기 위한 시도에서 등장하였다" }
          ],
          answerId: "A"
        };
      } else if (pi === 0 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 손실 회피 성향의 핵심 내용으로 적절한 것은?",
          choices: [
            { id: "A", text: "동일한 크기의 이익보다 손실이 약 두 배 이상의 심리적 충격을 준다" },
            { id: "B", text: "손실이 발생하면 즉시 추가 투자로 만회하려는 행동을 보인다" },
            { id: "C", text: "이익과 손실을 동일한 기준으로 대칭적으로 평가하려는 경향이다" },
            { id: "D", text: "손실 가능성이 있는 선택을 완전히 회피하는 극단적 태도이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 '현재 편향'의 의미로 적절한 것은?",
          choices: [
            { id: "A", text: "미래의 더 큰 보상보다 지금 당장의 작은 보상을 선호하는 경향이다" },
            { id: "B", text: "과거의 경험에 지나치게 의존하여 판단하는 경향이다" },
            { id: "C", text: "현재의 상태를 변화시키는 것을 두려워하는 경향이다" },
            { id: "D", text: "가장 최근에 접한 정보를 과대평가하는 경향이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 3) {
        question = {
          prompt: "하이라이트된 문장에서 현재 편향 발견이 이끌어 낸 정책적 처방의 예로 적절한 것은?",
          choices: [
            { id: "A", text: "연금 자동 가입 제도처럼 의사결정 구조를 사전 설계하는 것이다" },
            { id: "B", text: "높은 세율을 부과하여 과소비를 강제적으로 억제하는 것이다" },
            { id: "C", text: "경제 교육을 강화하여 합리적 판단 능력을 배양하는 것이다" },
            { id: "D", text: "소비자 보호법을 제정하여 불공정 거래를 규제하는 것이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 넛지 이론의 성격으로 적절한 것은?",
          choices: [
            { id: "A", text: "행동경제학의 연구 성과를 정책적으로 응용한 대표적 사례이다" },
            { id: "B", text: "전통 경제학의 합리적 인간 모형을 실증적으로 검증한 이론이다" },
            { id: "C", text: "시장의 자율적 조정 기능을 이론적으로 뒷받침하는 학설이다" },
            { id: "D", text: "정부의 강력한 규제를 통한 시장 개입을 정당화하는 이론이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 1) {
        question = {
          prompt: "하이라이트된 문장에서 넛지의 핵심 특징으로 적절한 것은?",
          choices: [
            { id: "A", text: "선택의 자유를 보존하면서 더 나은 결정을 유도하는 부드러운 개입이다" },
            { id: "B", text: "법적 강제력을 동원하여 바람직한 행동을 의무화하는 규제이다" },
            { id: "C", text: "경제적 벌칙을 부과하여 해로운 행동을 억제하는 제도이다" },
            { id: "D", text: "전문가의 판단에 따라 개인의 선택지를 제한하는 조치이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 행동경제학의 영향 범위에 대한 설명으로 적절한 것은?",
          choices: [
            { id: "A", text: "경제학뿐 아니라 의료, 교육, 환경, 법률 등 다양한 분야에서 활용된다" },
            { id: "B", text: "오직 금융 투자 분야에서만 실질적인 성과를 거두고 있다" },
            { id: "C", text: "학문적 논의 수준에 머물러 있어 실질적 정책 적용은 없다" },
            { id: "D", text: "선진국에서만 적용 가능하며 개발도상국에는 부적합하다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 3) {
        question = {
          prompt: "하이라이트된 문장에서 행동경제학이 직결된 근본적 가치 문제로 제시된 것은?",
          choices: [
            { id: "A", text: "인간의 자유와 복지 사이의 균형이라는 문제이다" },
            { id: "B", text: "경제 성장과 환경 보전 사이의 상충 관계이다" },
            { id: "C", text: "개인의 이익과 공공의 이익 사이의 배분 문제이다" },
            { id: "D", text: "시장 효율성과 소득 분배의 형평성 사이의 딜레마이다" }
          ],
          answerId: "A"
        };
      } else {
        const otherSents = [];
        paragraphs.forEach((op, opi) => {
          if (opi !== pi) {
            const os = findSentences(op.text);
            os.forEach(s => otherSents.push(s.text));
          }
        });
        const correctText = sent.text.length > 60 ? sent.text.substring(0, 60) + '...' : sent.text;
        const wrongs = [];
        for (let k = 0; k < otherSents.length && wrongs.length < 3; k++) {
          const t = otherSents[k].length > 60 ? otherSents[k].substring(0, 60) + '...' : otherSents[k];
          if (t !== correctText) wrongs.push(t);
        }
        const allChoices = [
          { id: "A", text: correctText },
          { id: "B", text: wrongs[0] || "해당 없음" },
          { id: "C", text: wrongs[1] || "해당 없음" },
          { id: "D", text: wrongs[2] || "해당 없음" }
        ];
        const shuffled = shuffleWithAnswer(allChoices, "A");
        question = {
          prompt: "하이라이트된 문장의 내용으로 가장 적절한 것은?",
          choices: shuffled.choices,
          answerId: shuffled.answerId
        };
      }

      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [range] },
        question: {
          ...question,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    stepNum++;
    const paraRange = { paragraphId: para.id, start: 0, end: para.text.length };
    const centralThemes = [
      "행동경제학의 등장 배경과 손실 회피 성향의 발견",
      "현재 편향의 개념과 이를 활용한 정책적 처방",
      "넛지 이론의 원리와 선택 환경 설계의 정책적 응용",
      "행동경제학의 다분야 적용과 자유·복지 사이의 가치 문제"
    ];
    const wrongThemes = [
      "국제 통화 체제의 역사적 변천과 금본위제의 폐지",
      "게임 이론의 발전과 내시 균형의 수학적 증명",
      "노동 시장의 이중 구조와 비정규직 보호 법안의 변화"
    ];
    const cChoices = [
      { id: "A", text: centralThemes[pi] },
      { id: "B", text: wrongThemes[0] },
      { id: "C", text: wrongThemes[1] },
      { id: "D", text: wrongThemes[2] }
    ];
    const cShuffled = shuffleWithAnswer(cChoices, "A");
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [paraRange] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        choices: cShuffled.choices,
        answerId: cShuffled.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  });

  const fullText = paragraphs.map(p => p.text).join('\n');
  const cards = splitIntoCards(fullText, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "카너먼과 트버스키가 인간의 비대칭적 평가를 밝힌 이론의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "전망 이론")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "가까운 미래와 먼 미래에 서로 다른 할인율을 적용하는 패턴의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "쌍곡선형 할인")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "넛지 이론을 제안한 학자는 누구인가?",
      answerRanges: [findRange(paragraphs, "p3", "리처드 탈러")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "사람들이 기본값을 유지하려는 경향을 가리키는 편향의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "현상 유지 편향")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "넛지의 접근법을 가리키는 또 다른 명칭은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "자유주의적 간섭주의")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "행동경제학적 개입에 대해 제기되는 비판의 핵심 우려는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "자율적 의사결정 능력")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(19, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 20: 문학 (LITERATURE) ──
function buildDay20() {
  const paragraphs = [
    {
      id: "p1",
      text: "박경리의 대하소설 「토지」는 1969년부터 1994년까지 약 25년에 걸쳐 집필된 한국 문학사상 최대 규모의 장편소설로, 구한말부터 일제 강점기를 거쳐 해방에 이르는 격동의 한국 근현대사를 배경으로 삼고 있다. 이 작품은 경남 하동의 평사리라는 구체적인 지역 공간을 중심으로 최참판댁의 흥망성쇠를 다루면서, 그 주변에 얽힌 수백 명의 인물들의 삶을 촘촘하게 직조해 나간다. 단순히 한 가문의 이야기에 머무르지 않고, 농민과 지식인, 독립운동가와 친일파, 여성과 남성 등 당대 한국 사회를 구성하는 거의 모든 계층과 집단의 모습을 파노라마처럼 펼쳐 놓음으로써 한 시대의 총체적 형상화를 시도한다는 점에서 「토지」는 진정한 의미의 민족 서사시라 할 수 있다."
    },
    {
      id: "p2",
      text: "「토지」에서 토지는 단순한 물리적 공간이나 경제적 자산을 넘어 인간 존재의 근원적 조건을 상징하는 다층적 의미를 지닌다. 등장인물들에게 땅은 생계의 터전이자 정체성의 뿌리이며, 땅을 빼앗기는 것은 경제적 궁핍뿐 아니라 존재의 근거 자체를 상실하는 것과 같다. 이러한 토지의 상징성은 일제의 토지 수탈 정책과 맞물리면서 개인의 운명과 민족의 운명이 불가분하게 연결되는 서사 구조를 형성한다. 최서희가 빼앗긴 토지를 되찾기 위해 펼치는 길고도 집요한 투쟁은 개인적 복수극인 동시에 식민지 수탈에 대한 민족적 저항의 우의이며, 이 이중적 의미 구조가 작품에 서사적 긴장감과 역사적 깊이를 동시에 부여한다."
    },
    {
      id: "p3",
      text: "박경리는 「토지」를 통해 한국 문학에서 여성 인물의 형상화를 획기적으로 전환시켰다. 최서희는 가부장제 사회에서 여성에게 주어진 전통적 역할의 틀을 넘어, 가문의 재건과 토지 회복이라는 거대한 과업을 주도적으로 이끌어 나가는 주체적 여성으로 그려진다. 그녀의 강인함은 남성적 권력을 모방하는 데서 비롯되는 것이 아니라 고통을 감내하고 타인을 보듬는 포용력에서 나오는 것으로, 이는 기존 문학에서 흔히 볼 수 있었던 수동적 여성상이나 남성화된 여성 영웅과는 질적으로 다른 인물 유형을 창출한다. 이와 더불어 용이, 봉순이, 월선이 등 다양한 사회적 위치에 놓인 여성 인물들의 삶을 다층적으로 조명함으로써, 여성의 경험이 단일한 것이 아니라 계층과 환경에 따라 복합적으로 분화한다는 인식을 서사적으로 구현하고 있다."
    },
    {
      id: "p4",
      text: "「토지」의 문학사적 의의는 개인의 서사와 역사의 서사를 유기적으로 통합한 데 있다. 수백 명에 이르는 등장인물 각각이 자신만의 고유한 욕망과 갈등과 성장의 궤적을 지니면서도, 그 개별적 서사들이 거시적인 역사의 흐름 속에서 서로 교차하고 충돌하며 하나의 거대한 서사적 직물을 이룬다. 이러한 구조를 통해 역사는 추상적인 연대기가 아니라 구체적인 인간들의 살아 있는 경험으로 형상화되며, 독자는 역사적 사건을 외부에서 관찰하는 것이 아니라 인물의 내면을 통해 체험하게 된다. 「토지」는 한국 문학이 도달한 서사적 성취의 정점이자 문학적 언어가 역사를 어떻게 기억하고 전승할 수 있는지를 보여주는 기념비적 작품으로, 세계문학의 맥락에서도 톨스토이의 「전쟁과 평화」나 가르시아 마르케스의 「백 년의 고독」에 비견될 만한 대서사시로 평가받고 있다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 20 지문 길이: ${len}자`);

  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);
    sents.forEach((sent, si) => {
      stepNum++;
      const range = { paragraphId: para.id, start: sent.start, end: sent.end };
      let question;

      if (pi === 0 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 「토지」의 집필 기간과 배경 시대로 적절한 것은?",
          choices: [
            { id: "A", text: "약 25년 집필, 구한말~해방기의 근현대사를 배경으로 한다" },
            { id: "B", text: "약 10년 집필, 조선 후기 양반 사회의 몰락을 다루고 있다" },
            { id: "C", text: "약 30년 집필, 한국전쟁 전후의 분단 현실을 배경으로 한다" },
            { id: "D", text: "약 15년 집필, 1970년대 산업화 시기의 농촌 문제를 다룬다" }
          ],
          answerId: "A"
        };
      } else if (pi === 0 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 「토지」가 다루는 인물 범위에 대한 설명으로 적절한 것은?",
          choices: [
            { id: "A", text: "당대 한국 사회의 거의 모든 계층과 집단의 모습을 펼쳐 놓는다" },
            { id: "B", text: "양반 가문의 내부 갈등에만 초점을 맞추어 서술한다" },
            { id: "C", text: "독립운동가들의 영웅적 활약상을 중심으로 전개된다" },
            { id: "D", text: "농민 계층의 일상적 삶만을 사실적으로 기록하고 있다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 토지가 지닌 상징적 의미로 적절한 것은?",
          choices: [
            { id: "A", text: "인간 존재의 근원적 조건을 상징하는 다층적 의미를 지닌다" },
            { id: "B", text: "경제적 부의 축적을 위한 유일한 수단을 의미한다" },
            { id: "C", text: "근대화에 방해가 되는 전근대적 유산을 상징한다" },
            { id: "D", text: "자연과 인간의 조화로운 공존을 나타내는 이상향이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 3) {
        question = {
          prompt: "하이라이트된 문장에서 최서희의 투쟁이 지닌 이중적 의미로 적절한 것은?",
          choices: [
            { id: "A", text: "개인적 복수극이자 식민지 수탈에 대한 민족적 저항의 우의이다" },
            { id: "B", text: "가문의 명예 회복이자 경제적 부의 축적을 위한 사업이다" },
            { id: "C", text: "여성 해방 운동이자 전통적 가부장제의 복원 시도이다" },
            { id: "D", text: "계급 투쟁이자 사회주의 혁명을 향한 이념적 실천이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 「토지」가 한국 문학에 기여한 바로 적절한 것은?",
          choices: [
            { id: "A", text: "여성 인물의 형상화를 획기적으로 전환시켰다" },
            { id: "B", text: "역사 소설의 형식을 최초로 한국 문학에 도입하였다" },
            { id: "C", text: "한글 전용 문체의 표준을 확립하는 데 기여하였다" },
            { id: "D", text: "근대적 단편소설 양식의 완성에 결정적 역할을 하였다" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 최서희의 강인함이 비롯되는 원천으로 제시된 것은?",
          choices: [
            { id: "A", text: "고통을 감내하고 타인을 보듬는 포용력에서 비롯된다" },
            { id: "B", text: "가문의 전통적 권위와 경제적 자원에서 비롯된다" },
            { id: "C", text: "남성적 권력을 효과적으로 모방하는 능력에서 비롯된다" },
            { id: "D", text: "외부의 후원자들로부터 받는 지지와 보호에서 비롯된다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 「토지」의 문학사적 의의로 제시된 핵심은 무엇인가?",
          choices: [
            { id: "A", text: "개인의 서사와 역사의 서사를 유기적으로 통합한 데 있다" },
            { id: "B", text: "한국어의 문체적 아름다움을 극대화한 데 있다" },
            { id: "C", text: "서양 소설 기법을 한국적으로 변용한 데 있다" },
            { id: "D", text: "단일 인물의 심리를 극도로 정밀하게 분석한 데 있다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 3) {
        question = {
          prompt: "하이라이트된 문장에서 「토지」와 비견되는 세계문학 작품으로 언급된 것은?",
          choices: [
            { id: "A", text: "톨스토이의 「전쟁과 평화」와 마르케스의 「백 년의 고독」이다" },
            { id: "B", text: "도스토옙스키의 「죄와 벌」과 카프카의 「변신」이다" },
            { id: "C", text: "셰익스피어의 「햄릿」과 괴테의 「파우스트」이다" },
            { id: "D", text: "디킨스의 「위대한 유산」과 오스틴의 「오만과 편견」이다" }
          ],
          answerId: "A"
        };
      } else {
        const otherSents = [];
        paragraphs.forEach((op, opi) => {
          if (opi !== pi) {
            const os = findSentences(op.text);
            os.forEach(s => otherSents.push(s.text));
          }
        });
        const correctText = sent.text.length > 60 ? sent.text.substring(0, 60) + '...' : sent.text;
        const wrongs = [];
        for (let k = 0; k < otherSents.length && wrongs.length < 3; k++) {
          const t = otherSents[k].length > 60 ? otherSents[k].substring(0, 60) + '...' : otherSents[k];
          if (t !== correctText) wrongs.push(t);
        }
        const allChoices = [
          { id: "A", text: correctText },
          { id: "B", text: wrongs[0] || "해당 없음" },
          { id: "C", text: wrongs[1] || "해당 없음" },
          { id: "D", text: wrongs[2] || "해당 없음" }
        ];
        const shuffled = shuffleWithAnswer(allChoices, "A");
        question = {
          prompt: "하이라이트된 문장의 내용으로 가장 적절한 것은?",
          choices: shuffled.choices,
          answerId: shuffled.answerId
        };
      }

      timeline.push({
        stepId: `s${stepNum}`,
        highlight: { ranges: [range] },
        question: {
          ...question,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    });

    stepNum++;
    const paraRange = { paragraphId: para.id, start: 0, end: para.text.length };
    const centralThemes = [
      "「토지」의 규모와 민족 서사시로서의 총체적 형상화",
      "토지의 다층적 상징성과 개인·민족 운명의 결합 구조",
      "여성 인물 형상화의 획기적 전환과 다양한 여성 경험의 조명",
      "개인 서사와 역사 서사의 통합이 이룬 문학사적 성취"
    ];
    const wrongThemes = [
      "한국 전쟁 문학의 전개 양상과 분단 소설의 유형 분류",
      "1970년대 산업화 시기 노동 문학의 사회적 의의",
      "조선 시대 한문 소설의 구조적 특성과 서사 전통"
    ];
    const cChoices = [
      { id: "A", text: centralThemes[pi] },
      { id: "B", text: wrongThemes[0] },
      { id: "C", text: wrongThemes[1] },
      { id: "D", text: wrongThemes[2] }
    ];
    const cShuffled = shuffleWithAnswer(cChoices, "A");
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [paraRange] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        choices: cShuffled.choices,
        answerId: cShuffled.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  });

  const fullText = paragraphs.map(p => p.text).join('\n');
  const cards = splitIntoCards(fullText, 8);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "작품의 중심 공간이 되는 구체적 지역은 어디인가?",
      answerRanges: [findRange(paragraphs, "p1", "평사리")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "토지를 빼앗기는 것이 존재의 근거 자체를 상실하는 것과 같다고 할 때, 일제의 관련 정책은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "토지 수탈")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "빼앗긴 토지를 되찾기 위해 투쟁하는 핵심 인물의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "최서희")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "최서희의 강인함이 비롯되는 원천으로 제시된 덕목은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "포용력")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "역사가 추상적인 연대기가 아닌 무엇으로 형상화된다고 하였는가?",
      answerRanges: [findRange(paragraphs, "p4", "살아 있는 경험")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "「토지」와 비견되는 톨스토이의 대서사시 작품명은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "전쟁과 평화")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "여성의 경험이 계층과 환경에 따라 어떻게 된다는 인식을 구현하고 있는가?",
      answerRanges: [findRange(paragraphs, "p3", "복합적으로 분화")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(20, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
}

// ── 공통 빌드 함수 ──
function buildContent(dayIndex, subArea, paragraphs, timeline, cards, confirmQuestions) {
  const dayStr = String(dayIndex).padStart(3, '0');
  const subAreaLabel = subArea === 'LITERATURE' ? '문학' : '비문학';
  return {
    content_type: "DAILY_READING",
    level_id: "WITTGENSTEIN_2",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content: {
      contentId: `dr-w2-${dayStr}`,
      contentType: "DAILY_READING",
      version: 1,
      status: "PUBLISHED",
      title: `일일 독해(비트겐슈타인 2) Day ${dayIndex} ${subAreaLabel}`,
      description: "일일 독해 - 정독·복기·확인",
      targetLevel: "WITTGENSTEIN_2",
      schoolGradeRange: { min: 10, max: 11 },
      area: "READING",
      subArea: subArea,
      competencies: ["READING"],
      tags: ["daily"],
      access: { mode: "FREE" },
      seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
      timeLimitSec: 480,
      assets: {},
      payload: {
        passage: {
          format: "TEXT",
          paragraphs: paragraphs
        },
        intensive: { timeline },
        recall: {
          cards: cards,
          correctOrder: cards.map(c => c.id),
          seedPenalty: 1
        },
        confirm: {
          questions: confirmQuestions
        }
      }
    }
  };
}

// ── 셔플 함수 ──
function shuffleWithAnswer(choices, correctId) {
  // 정답의 원래 text 저장
  const correctText = choices.find(c => c.id === correctId).text;
  // Fisher-Yates 셔플
  const arr = [...choices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const ids = ["A", "B", "C", "D"];
  let newAnswerId = "A";
  const result = arr.map((c, idx) => {
    const newId = ids[idx];
    if (c.text === correctText) newAnswerId = newId;
    return { id: newId, text: c.text };
  });
  return { choices: result, answerId: newAnswerId };
}

// ── 카드 분할 함수 (정확히 n장) ──
function splitIntoCards(text, n) {
  const totalLen = text.length;
  const avgLen = Math.floor(totalLen / n);
  const cards = [];
  let pos = 0;

  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      cards.push({ id: `c${i + 1}`, text: text.substring(pos) });
    } else {
      let target = pos + avgLen;
      // 문장 경계('. ')에 맞추어 자르기
      let bestCut = target;
      for (let j = Math.max(pos + 50, target - 50); j < Math.min(totalLen, target + 50); j++) {
        if (text[j] === '.' && j + 1 < totalLen && (text[j + 1] === ' ' || text[j + 1] === '\n')) {
          bestCut = j + 1;
          break;
        }
      }
      // 공백 건너뛰기
      while (bestCut < totalLen && text[bestCut] === ' ') bestCut++;
      cards.push({ id: `c${i + 1}`, text: text.substring(pos, bestCut) });
      pos = bestCut;
    }
  }
  return cards;
}

// ── 메인 실행 ──
function main() {
  console.log('=== 비트겐슈타인2 Day 16~20 콘텐츠 빌드 시작 ===\n');

  const items = [
    buildDay16(),
    buildDay17(),
    buildDay18(),
    buildDay19(),
    buildDay20()
  ];

  // 길이 검증
  items.forEach((item, idx) => {
    const paras = item.content.payload.passage.paragraphs;
    const len = paras.reduce((s, p) => s + p.text.length, 0);
    const cards = item.content.payload.recall.cards;
    const confirms = item.content.payload.confirm.questions;
    const steps = item.content.payload.intensive.timeline;
    console.log(`Day ${item.day_index}: 지문 ${len}자, 정독 ${steps.length}스텝, 복기 ${cards.length}장, 확인 ${confirms.length}문항`);

    if (len < 1450 || len > 1550) {
      console.error(`  [경고] Day ${item.day_index} 지문 길이 ${len}자 - 범위(1450~1550) 벗어남!`);
    }
    if (cards.length !== 8) {
      console.error(`  [경고] Day ${item.day_index} 복기 카드 ${cards.length}장 - 8장이어야 합니다!`);
    }
    if (confirms.length < 5 || confirms.length > 8) {
      console.error(`  [경고] Day ${item.day_index} 확인 문항 ${confirms.length}개 - 5~8개여야 합니다!`);
    }
  });

  // 배치 파일 읽기 (최신 상태)
  console.log('\n배치 파일 읽기...');
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`배치 파일 총 items: ${batchData.items.length}`);

  // items[15]~[19] 교체
  for (let i = 0; i < 5; i++) {
    const targetIdx = 15 + i;
    const oldItem = batchData.items[targetIdx];
    console.log(`교체: items[${targetIdx}] (Day ${oldItem.day_index}) -> Day ${items[i].day_index}`);
    batchData.items[targetIdx] = items[i];
  }

  // 배치 파일 저장
  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료: ${BATCH_PATH}`);

  // static 파일 생성
  for (const item of items) {
    const dayStr = String(item.day_index).padStart(3, '0');
    const staticPath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(staticPath, JSON.stringify(item.content, null, 2), 'utf8');
    console.log(`static 파일 저장 완료: ${staticPath}`);
  }

  console.log('\n=== 빌드 완료 ===');
}

main();
