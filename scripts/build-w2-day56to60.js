// 비트겐슈타인2 Day 56~60 콘텐츠 빌더
// 짝수 day = LITERATURE, 홀수 day = NONFICTION
// 목표: 1500자 ±50, 4문단, 고1~고2 수준

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

function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

function hashIdx(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}

function shuffleChoices(choices, correctId) {
  const correctText = choices.find(c => c.id === correctId).text;
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
      let bestCut = target;
      for (let j = Math.max(pos + 50, target - 50); j < Math.min(totalLen, target + 50); j++) {
        if (text[j] === '.' && j + 1 < totalLen && (text[j + 1] === ' ' || text[j + 1] === '\n')) {
          bestCut = j + 1;
          break;
        }
      }
      while (bestCut < totalLen && text[bestCut] === ' ') bestCut++;
      cards.push({ id: `c${i + 1}`, text: text.substring(pos, bestCut) });
      pos = bestCut;
    }
  }
  return cards;
}

function buildTimeline(paragraphs, customQuestions) {
  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);
    sents.forEach((sent, si) => {
      stepNum++;
      const range = { paragraphId: para.id, start: sent.start, end: sent.end };
      const key = `p${pi}_s${si}`;
      let question;

      if (customQuestions[key]) {
        question = customQuestions[key];
      } else {
        // 자동 생성: 다른 문단 문장에서 오답 추출
        const otherSents = [];
        paragraphs.forEach((op, opi) => {
          if (opi !== pi) {
            const os = findSentences(op.text);
            os.forEach(s => otherSents.push(s.text));
          }
        });
        const correctText = truncate(sent.text, 60);
        const wrongs = [];
        for (let k = 0; k < otherSents.length && wrongs.length < 3; k++) {
          const t = truncate(otherSents[k], 60);
          if (t !== correctText) wrongs.push(t);
        }
        const allChoices = [
          { id: "A", text: correctText },
          { id: "B", text: wrongs[0] || "해당 없음" },
          { id: "C", text: wrongs[1] || "해당 없음" },
          { id: "D", text: wrongs[2] || "해당 없음" }
        ];
        const shuffled = shuffleChoices(allChoices, "A");
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
    const centralKey = `central_p${pi}`;
    if (customQuestions[centralKey]) {
      const cq = customQuestions[centralKey];
      const cShuffled = shuffleChoices(cq.choices, cq.answerId);
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
    }
  });

  return timeline;
}

function buildRecallCards(paragraphs) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  return splitIntoCards(fullText, 8);
}

function assembleFull(dayIndex, subArea, paragraphs, timeline, cards, confirmQuestions) {
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

function wrapBatchItem(assembled) {
  return assembled; // 이미 assembleFull에서 level_id 포함
}

// ── Day 56: 문학 (LITERATURE, 짝수) ──
function buildDay56() {
  const paragraphs = [
    {
      id: "p1",
      text: "윤동주의 시 「서시」는 1941년에 쓰여진 작품으로, 식민지 시대 암흑기에 양심적 지식인이 지녀야 할 도덕적 자세를 성찰하는 대표적인 저항시이다. 이 시의 첫 행인 '죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를'이라는 구절은 외적 행동이 아닌 내면적 순결과 윤리적 완결성을 추구하는 시인의 근본적인 삶의 태도를 선언적으로 제시한다. 윤동주가 지향하는 부끄럼 없는 삶이란 타인의 시선이 아닌 자기 내부의 양심에 의해 판단되는 것이며, 이는 외부적 강제에 의해 침묵을 강요당하던 시대에 내면의 자유를 최후의 보루로 삼겠다는 결의를 함축한다. 하늘이라는 이미지는 초월적 도덕 기준의 상징으로, 세속적 권력이 아닌 절대적 윤리 앞에 자신을 세우겠다는 시인의 의지를 표현하며, 이러한 수직적 지향은 시 전체의 정신적 골격을 형성하고 있다."
    },
    {
      id: "p2",
      text: "이 시에서 '잎새에 이는 바람에도 나는 괴로워했다'라는 구절은 시인의 극도로 예민한 윤리적 감수성을 드러내는 핵심적 표현이다. 잎새에 이는 바람이라는 미세한 자연 현상에도 괴로움을 느낀다는 것은 세계의 어떤 작은 고통이나 불의에도 무감각하지 않겠다는 도덕적 결단을 의미한다. 이러한 과민한 감수성은 일반적인 인간에게는 지속하기 어려운 고통스러운 자세이지만, 윤동주는 바로 그 고통을 자발적으로 감수하겠다고 선언함으로써 시적 주체의 윤리적 격조를 극한까지 끌어올린다. 이 구절에서 바람은 식민지 현실의 폭력과 억압이 만들어내는 불안의 기류를 은유하는 것으로도 해석될 수 있으며, 그에 대한 괴로움은 시인이 현실에서 눈을 돌리지 않겠다는 의지의 표현이기도 하다."
    },
    {
      id: "p3",
      text: "「서시」의 마지막 행인 '그리고 나한테 주어진 길을 걸어가야겠다'는 시 전체의 윤리적 선언을 실천적 결의로 전환시키는 결정적 구절이다. 앞선 행들이 내면적 순결과 도덕적 감수성의 차원에 머물러 있다면, 이 마지막 행은 그러한 내면적 태도를 삶의 구체적 행위로 옮기겠다는 실존적 결단을 표명한다. 여기서 주어진 길이란 시인이 자유롭게 선택한 것이 아니라 운명적으로 부여된 것이며, 이는 식민지 지식인으로서 피할 수 없는 역사적 책무를 수용하겠다는 의미를 내포한다. 걸어가야겠다는 표현에서 의무와 의지가 동시에 드러나는데, 이는 강제된 운명을 수동적으로 수락하는 것이 아니라 그것을 자발적 결의로 전유하겠다는 능동적 태도를 보여주며, 이 능동적 수용은 시의 윤리적 긴장을 최고조로 끌어올리는 역할을 수행한다."
    },
    {
      id: "p4",
      text: "윤동주의 시가 한국 문학사에서 차지하는 위상은 그 문학적 성취와 작가의 삶이 완전한 일치를 이룬다는 점에서 특별하다. 후쿠오카 형무소에서 스물여덟의 나이로 생을 마감한 윤동주의 죽음은 그의 시가 담고 있는 도덕적 결의가 문학적 수사가 아닌 실존적 진실이었음을 비극적으로 증명한다. 「서시」를 비롯한 그의 시편들은 화려한 수사나 복잡한 기교 없이 투명하고 정직한 언어로 쓰여 있으며, 이러한 언어적 순결함은 시의 주제인 도덕적 순결과 형식적 조응을 이루고 있다. 윤동주의 시는 문학이 단순한 미적 유희가 아니라 한 인간의 윤리적 존재 방식 그 자체가 될 수 있음을 증명하며, 시대를 초월하여 독자들에게 삶의 태도에 대한 근본적 성찰을 촉구하는 살아 있는 텍스트로 남아 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 56 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 「서시」의 문학적 성격으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "식민지 시대 양심적 지식인의 도덕적 자세를 성찰하는 저항시이다" },
        { id: "B", text: "자연의 아름다움을 서정적으로 노래한 전원시이다" },
        { id: "C", text: "사회 현실을 직접적으로 비판하는 풍자시이다" },
        { id: "D", text: "전통적 운율을 활용한 고전적 양식의 시이다" }
      ],
      answerId: "A"
    },
    'p0_s2': {
      prompt: "하이라이트된 문장에서 시인이 추구하는 '부끄럼 없는 삶'의 판단 기준은 무엇인가?",
      choices: [
        { id: "A", text: "타인의 시선이 아닌 자기 내부의 양심에 의해 판단된다" },
        { id: "B", text: "사회적 규범과 법률에 의해 판단된다" },
        { id: "C", text: "종교적 교리에 따른 외적 기준으로 판단된다" },
        { id: "D", text: "역사적 공적에 대한 후세의 평가로 판단된다" }
      ],
      answerId: "A"
    },
    'p1_s0': {
      prompt: "하이라이트된 문장에서 '잎새에 이는 바람에도 괴로워했다'가 드러내는 시인의 특질은?",
      choices: [
        { id: "A", text: "극도로 예민한 윤리적 감수성을 드러낸다" },
        { id: "B", text: "자연에 대한 과학적 관찰력을 보여준다" },
        { id: "C", text: "개인적 불안과 공포의 심리를 드러낸다" },
        { id: "D", text: "감각적 쾌락을 추구하는 탐미적 성향을 보여준다" }
      ],
      answerId: "A"
    },
    'p1_s2': {
      prompt: "하이라이트된 문장에서 시인이 고통을 자발적으로 감수하는 이유로 적절한 것은?",
      choices: [
        { id: "A", text: "시적 주체의 윤리적 격조를 극한까지 끌어올리기 위해서이다" },
        { id: "B", text: "종교적 구원을 얻기 위한 고행의 일환이다" },
        { id: "C", text: "문학적 영감을 얻기 위한 의도적 자극이다" },
        { id: "D", text: "사회적 명성을 획득하기 위한 전략적 선택이다" }
      ],
      answerId: "A"
    },
    'p2_s0': {
      prompt: "하이라이트된 문장에서 '나한테 주어진 길을 걸어가야겠다'의 서사적 기능은?",
      choices: [
        { id: "A", text: "윤리적 선언을 실천적 결의로 전환시키는 결정적 구절이다" },
        { id: "B", text: "시의 서두에서 제기한 문제에 대한 해답을 제시한다" },
        { id: "C", text: "자연과의 합일을 통한 정신적 해방을 선언한다" },
        { id: "D", text: "과거의 잘못에 대한 반성과 참회를 표현한다" }
      ],
      answerId: "A"
    },
    'p2_s2': {
      prompt: "하이라이트된 문장에서 '주어진 길'이 내포하는 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "식민지 지식인으로서 피할 수 없는 역사적 책무의 수용이다" },
        { id: "B", text: "개인적 성공과 출세를 향한 세속적 야망의 추구이다" },
        { id: "C", text: "전통 문화를 계승하고 보존하려는 학문적 사명이다" },
        { id: "D", text: "해외로 떠나 새로운 삶을 개척하려는 이주의 결심이다" }
      ],
      answerId: "A"
    },
    'p3_s0': {
      prompt: "하이라이트된 문장에서 윤동주 시의 문학사적 위상이 특별한 이유로 적절한 것은?",
      choices: [
        { id: "A", text: "문학적 성취와 작가의 삶이 완전한 일치를 이루기 때문이다" },
        { id: "B", text: "한국어의 음운 체계를 혁신적으로 실험했기 때문이다" },
        { id: "C", text: "서양 문학 이론을 최초로 한국에 도입했기 때문이다" },
        { id: "D", text: "방대한 분량의 서사시를 완성했기 때문이다" }
      ],
      answerId: "A"
    },
    'p3_s2': {
      prompt: "하이라이트된 문장에서 윤동주 시의 언어적 특징으로 적절한 것은?",
      choices: [
        { id: "A", text: "투명하고 정직한 언어로 쓰여 도덕적 순결과 형식적 조응을 이룬다" },
        { id: "B", text: "화려한 수사와 복잡한 기교를 통해 미적 쾌감을 극대화한다" },
        { id: "C", text: "방언과 구어체를 적극 활용하여 민중의 삶을 재현한다" },
        { id: "D", text: "외래어와 한자어를 혼용하여 근대적 감각을 구현한다" }
      ],
      answerId: "A"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "「서시」의 첫 행이 담고 있는 내면적 순결과 윤리적 완결성의 추구" },
        { id: "B", text: "일제 강점기 무장 독립 투쟁의 전개 과정과 의의" },
        { id: "C", text: "1920년대 민요시 운동의 형성과 전통 계승" },
        { id: "D", text: "해방 이후 좌우 이념 대립이 문학에 미친 영향" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "'바람에도 괴로워했다'에 나타나는 극도의 윤리적 감수성과 그 의미" },
        { id: "B", text: "김소월 시에 나타나는 민요적 율격과 한의 정서" },
        { id: "C", text: "이육사 시의 의지적 어조와 미래 지향적 세계관" },
        { id: "D", text: "정지용의 이미지즘 시학과 감각적 언어 실험" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "'주어진 길을 걸어가야겠다'에 담긴 실존적 결단과 역사적 책무의 수용" },
        { id: "B", text: "백석 시에 나타나는 토속적 세계와 공동체적 정서" },
        { id: "C", text: "서정주 초기 시의 원초적 생명력과 감각적 이미지" },
        { id: "D", text: "한용운 시에 나타나는 님의 상징과 부재의 미학" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "윤동주의 삶과 시의 일치가 증명하는 문학의 윤리적 존재 방식" },
        { id: "B", text: "1930년대 모더니즘 문학 운동의 전개와 실험적 형식" },
        { id: "C", text: "프로문학 진영의 사회적 리얼리즘과 계급 의식" },
        { id: "D", text: "전후 실존주의 문학의 수용과 한국적 변용" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "시인이 죽는 날까지 추구하겠다고 선언한 도덕적 상태는 어떤 표현으로 나타나는가?",
      answerRanges: [findRange(paragraphs, "p1", "부끄럼이 없기를")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "시인의 극도의 윤리적 감수성을 드러내는 자연 현상의 이미지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "잎새에 이는 바람")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "시의 마지막 행에서 시인이 걸어가겠다고 한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "주어진 길")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "윤동주가 생을 마감한 장소의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "후쿠오카 형무소")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "윤동주 시의 언어적 특징은 어떤 표현으로 묘사되어 있는가?",
      answerRanges: [findRange(paragraphs, "p4", "투명하고 정직한")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "윤동주가 세상을 떠난 나이는 몇 살인가?",
      answerRanges: [findRange(paragraphs, "p4", "스물여덟")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(56, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 57: 비문학 (NONFICTION, 홀수) ──
function buildDay57() {
  const paragraphs = [
    {
      id: "p1",
      text: "인간의 의사 결정은 합리적 계산에 의해서만 이루어지지 않으며, 다양한 인지적 편향에 의해 체계적으로 왜곡될 수 있다는 것이 현대 심리학과 경제학의 핵심적 발견이다. 행동경제학의 선구자인 대니얼 카너먼과 아모스 트버스키는 인간이 판단과 선택을 할 때 직관적 사고인 시스템 1과 분석적 사고인 시스템 2라는 두 가지 사고 체계를 사용한다는 이중 처리 이론을 제시하였다. 시스템 1은 빠르고 자동적이며 감정에 기반한 직관적 판단을 담당하고, 시스템 2는 느리고 의도적이며 논리적 분석을 수행하지만 인지적 노력을 많이 요구한다. 일상적인 상황에서 인간은 인지적 자원을 절약하기 위해 시스템 1에 과도하게 의존하는 경향이 있으며, 이로 인해 체계적인 판단 오류가 반복적으로 발생하게 된다."
    },
    {
      id: "p2",
      text: "카너먼과 트버스키가 발견한 대표적인 인지 편향 중 하나는 가용성 휴리스틱이다. 이는 어떤 사건의 발생 확률을 판단할 때 그 사건이 기억에서 얼마나 쉽게 떠오르는지를 기준으로 삼는 인지적 지름길을 가리킨다. 예를 들어 비행기 사고에 대한 뉴스를 접한 직후에는 비행기 여행의 위험성을 실제보다 훨씬 높게 평가하게 되는데, 이는 선명하고 감정적으로 강렬한 기억이 확률 판단에 과도한 영향을 미치기 때문이다. 가용성 휴리스틱은 정보의 객관적 빈도가 아니라 주관적 접근 용이성에 의해 판단이 좌우된다는 점에서 통계적 합리성으로부터의 체계적 이탈을 보여주며, 이는 언론 보도의 편향이 대중의 위험 인식을 왜곡시키는 사회적 메커니즘과도 밀접하게 연결되어 있다."
    },
    {
      id: "p3",
      text: "또 다른 주요 편향인 앵커링 효과는 최초에 제시된 정보가 이후의 판단에 과도한 영향을 미치는 현상을 말한다. 부동산 가격을 협상할 때 매도자가 제시한 최초 호가가 실제 시장 가치와 무관하더라도 이후 협상의 기준점으로 작동하여 최종 합의 가격에 유의미한 영향을 미친다는 연구 결과가 이를 뒷받침한다. 앵커링 효과는 전문가조차 자유롭지 못한 강력한 편향으로, 판사의 양형 판단이나 의사의 진단에서도 초기 정보에 의한 앵커링이 작동한다는 것이 실험적으로 확인되었다. 이 편향은 시스템 1이 자동적으로 앵커 값을 출발점으로 삼고, 시스템 2가 그 값을 불충분하게 조정하는 과정에서 발생하는 것으로 분석되며, 이러한 메커니즘의 이해는 보다 객관적인 의사 결정 절차를 설계하는 데 중요한 기초가 된다."
    },
    {
      id: "p4",
      text: "행동경제학의 연구 성과는 공공 정책 설계에 중요한 시사점을 제공한다. 리처드 탈러가 제안한 넛지 이론은 인간의 인지적 편향을 제거하려 하기보다 이를 역이용하여 더 나은 선택을 유도하는 전략을 강조한다. 예를 들어 퇴직연금 가입을 기본 옵션으로 설정하면 현상 유지 편향에 의해 가입 탈퇴를 적극적으로 선택하지 않는 사람들이 자연스럽게 연금에 가입하게 되어 노후 준비율이 크게 향상된다. 넛지는 개인의 자유를 제한하지 않으면서도 선택 구조를 설계함으로써 바람직한 행동을 유도하는 자유주의적 개입주의의 실천으로, 전통 경제학이 전제하는 합리적 경제인 모형의 한계를 보완하는 현실적 대안으로 주목받고 있다. 이러한 접근은 건강, 교육, 환경 등 다양한 공공 영역에서 시민의 복지를 증진하기 위한 정책 도구로 활발히 적용되고 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 57 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 인간의 의사 결정에 대한 핵심 주장으로 적절한 것은?",
      choices: [
        { id: "A", text: "합리적 계산에 의해서만 이루어지지 않으며 인지적 편향에 의해 왜곡될 수 있다" },
        { id: "B", text: "항상 합리적이며 최적의 결과를 도출하는 방향으로 이루어진다" },
        { id: "C", text: "본능과 감정에 의해서만 결정되며 이성적 사고는 관여하지 않는다" },
        { id: "D", text: "문화와 교육 수준에 따라 완전히 달라지며 보편적 패턴은 없다" }
      ],
      answerId: "A"
    },
    'p0_s2': {
      prompt: "하이라이트된 문장에서 시스템 1의 특성으로 적절한 것은?",
      choices: [
        { id: "A", text: "빠르고 자동적이며 감정에 기반한 직관적 판단을 담당한다" },
        { id: "B", text: "느리고 의도적이며 논리적 분석을 수행한다" },
        { id: "C", text: "인지적 노력을 많이 요구하는 체계적 사고 방식이다" },
        { id: "D", text: "수학적 계산과 통계적 추론을 전문적으로 처리한다" }
      ],
      answerId: "A"
    },
    'p1_s0': {
      prompt: "하이라이트된 문장에서 가용성 휴리스틱의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "기억에서 쉽게 떠오르는 정도를 기준으로 확률을 판단하는 인지적 지름길이다" },
        { id: "B", text: "최초에 제시된 정보가 이후 판단에 과도한 영향을 미치는 현상이다" },
        { id: "C", text: "현재 상태를 유지하려는 심리적 경향에 의한 판단 오류이다" },
        { id: "D", text: "자신에게 유리한 정보만을 선택적으로 수용하는 경향이다" }
      ],
      answerId: "A"
    },
    'p1_s2': {
      prompt: "하이라이트된 문장에서 비행기 사고 뉴스가 확률 판단에 미치는 영향의 원인은?",
      choices: [
        { id: "A", text: "선명하고 감정적으로 강렬한 기억이 확률 판단에 과도한 영향을 미치기 때문이다" },
        { id: "B", text: "비행기 사고의 통계적 빈도가 실제로 높아서 합리적 반응이기 때문이다" },
        { id: "C", text: "언론의 반복 보도가 실제 확률을 변화시키기 때문이다" },
        { id: "D", text: "비행기에 대한 선천적 공포가 인간에게 내재되어 있기 때문이다" }
      ],
      answerId: "A"
    },
    'p2_s0': {
      prompt: "하이라이트된 문장에서 앵커링 효과의 정의로 적절한 것은?",
      choices: [
        { id: "A", text: "최초에 제시된 정보가 이후의 판단에 과도한 영향을 미치는 현상이다" },
        { id: "B", text: "기억의 접근 용이성에 따라 확률을 판단하는 경향이다" },
        { id: "C", text: "현재 상태를 유지하려는 심리적 관성에 의한 편향이다" },
        { id: "D", text: "자신의 기존 신념을 확인하는 방향으로 정보를 처리하는 경향이다" }
      ],
      answerId: "A"
    },
    'p2_s2': {
      prompt: "하이라이트된 문장에서 앵커링 효과의 범위에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "전문가조차 자유롭지 못하며 판사와 의사에게서도 작동한다" },
        { id: "B", text: "전문적 훈련을 받은 사람에게는 전혀 나타나지 않는다" },
        { id: "C", text: "경제적 거래에서만 나타나며 다른 영역에는 적용되지 않는다" },
        { id: "D", text: "아동과 청소년에게만 나타나는 발달적 특성이다" }
      ],
      answerId: "A"
    },
    'p3_s0': {
      prompt: "하이라이트된 문장에서 행동경제학 연구 성과의 활용 분야로 적절한 것은?",
      choices: [
        { id: "A", text: "공공 정책 설계에 중요한 시사점을 제공한다" },
        { id: "B", text: "수학적 알고리즘 개발에 핵심적 이론을 제공한다" },
        { id: "C", text: "유전자 치료 기술의 윤리적 기준을 제시한다" },
        { id: "D", text: "인공지능의 기계 학습 알고리즘을 개선한다" }
      ],
      answerId: "A"
    },
    'p3_s3': {
      prompt: "하이라이트된 문장에서 넛지 이론의 정책적 성격으로 적절한 것은?",
      choices: [
        { id: "A", text: "개인의 자유를 제한하지 않으면서 바람직한 행동을 유도하는 자유주의적 개입주의이다" },
        { id: "B", text: "개인의 선택권을 완전히 박탈하고 국가가 결정하는 전체주의적 접근이다" },
        { id: "C", text: "시장의 자율적 조정 기능을 전적으로 신뢰하는 자유방임주의이다" },
        { id: "D", text: "개인의 합리성을 전제하고 정보 제공에만 집중하는 교육적 접근이다" }
      ],
      answerId: "A"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "이중 처리 이론에 따른 시스템 1과 시스템 2의 특성과 인지적 편향의 발생 원리" },
        { id: "B", text: "진화론적 관점에서 본 인간 두뇌의 발달 과정과 한계" },
        { id: "C", text: "인공지능의 의사 결정 알고리즘과 인간 판단의 비교" },
        { id: "D", text: "통계학의 기초 원리와 확률 계산의 실용적 응용 방법" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "가용성 휴리스틱의 개념과 기억의 주관적 접근 용이성이 확률 판단에 미치는 영향" },
        { id: "B", text: "인간 기억의 저장 용량과 망각의 생물학적 메커니즘" },
        { id: "C", text: "항공 산업의 안전 규제 역사와 기술적 발전 과정" },
        { id: "D", text: "대중 매체의 사회적 영향력과 여론 형성 과정의 분석" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "앵커링 효과의 정의, 다양한 분야에서의 실증 사례, 발생 메커니즘" },
        { id: "B", text: "부동산 시장의 가격 결정 원리와 거시경제적 영향 요인" },
        { id: "C", text: "사법 제도의 양형 기준과 형사 정책의 발전 방향" },
        { id: "D", text: "협상 이론의 기본 원칙과 효과적인 의사소통 전략" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "넛지 이론을 통한 공공 정책 설계와 자유주의적 개입주의의 실천" },
        { id: "B", text: "복지국가의 재정 구조와 사회보장 제도의 지속 가능성" },
        { id: "C", text: "전통 경제학의 수리적 모형과 균형 이론의 발전사" },
        { id: "D", text: "퇴직연금 제도의 유형별 비교와 각국의 운영 현황" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "이중 처리 이론을 제시한 두 학자의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "카너먼과 아모스 트버스키")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "기억의 접근 용이성에 따라 확률을 판단하는 인지적 지름길을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "가용성 휴리스틱")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "최초에 제시된 정보가 이후 판단에 과도한 영향을 미치는 현상을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p3", "앵커링 효과")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "넛지 이론을 제안한 학자는 누구인가?",
      answerRanges: [findRange(paragraphs, "p4", "리처드 탈러")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "퇴직연금 가입률을 높이기 위해 활용된 인지 편향의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "현상 유지 편향")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "넛지가 보완하려는 전통 경제학의 인간관을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "합리적 경제인")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(57, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 58: 문학 (LITERATURE, 짝수) ──
function buildDay58() {
  const paragraphs = [
    {
      id: "p1",
      text: "김승옥의 단편소설 「무진기행」은 1964년 『사상계』에 발표된 작품으로, 한국 문학에서 감각적 문체와 내면적 서사를 결합한 모더니즘 소설의 새로운 가능성을 열었다. 서울에서 제약 회사에 근무하는 윤희중은 처가의 후원으로 전무 승진을 앞두고 있지만, 이 성공이 자신의 실존적 진정성을 포기한 대가임을 의식하고 있는 인물이다. 그가 고향 무진으로 향하는 여행은 도시적 삶의 위선과 타협으로부터 벗어나 잃어버린 자아를 회복하려는 내면적 귀환의 시도로 읽힌다. 그러나 이 귀환은 처음부터 영원한 탈출이 아닌 일시적 일탈에 불과하다는 자기 인식을 동반하고 있어, 서사 전체에 체념적 아이러니가 기저에 깔려 있으며 이러한 아이러니는 독자에게 주인공의 자기기만에 대한 비판적 시선을 요구한다."
    },
    {
      id: "p2",
      text: "무진이라는 공간은 이 소설에서 단순한 지리적 배경이 아니라 주인공의 심리 상태를 투영하는 심상 풍경으로 기능한다. 무진을 감싸고 있는 짙은 안개는 현실 세계의 윤곽을 흐리게 만들어 합리적 판단과 사회적 규범으로부터의 일시적 해방을 가능하게 하는 비현실적 분위기를 조성한다. 안개 속에서 희중은 서울에서의 자신과 다른 존재가 될 수 있다는 환상을 경험하며, 이러한 환상은 하인숙이라는 여성과의 만남을 통해 구체적 형상을 얻는다. 안개는 해방과 은폐의 이중적 상징으로 기능하는데, 안개가 경계를 지우는 것은 자유이면서 동시에 자기 기만의 조건이 되기도 하며, 소설은 이 양면성을 시종일관 유지함으로써 인물의 심리적 분열을 공간적으로 형상화하는 데 성공하고 있다."
    },
    {
      id: "p3",
      text: "하인숙과의 관계는 희중의 내면적 갈등을 첨예하게 드러내는 서사적 장치이다. 무진의 여교사인 하인숙은 자살 미수 경험을 가진 인물로, 질식할 듯한 소도시의 삶에서 벗어나고자 하는 절박한 열망을 지니고 있다. 희중은 하인숙에게서 과거 자신이 지녔던 순수한 열망의 잔상을 발견하고 감정적으로 깊이 교감하지만, 이 교감은 서울로 돌아가야 하는 현실 앞에서 지속될 수 없는 것임을 본능적으로 인식하고 있다. 희중이 하인숙에게 서울로 오라는 편지를 남기고 떠나면서도 그 약속이 실현될 수 없으리라는 것을 알고 있다는 점에서, 이 관계는 진정성의 순간이 현실의 구조적 압력 앞에서 패배하는 과정을 핍진하게 보여주며 희중의 비겁한 자기 보호 본능을 동시에 드러낸다."
    },
    {
      id: "p4",
      text: "「무진기행」의 결말에서 희중이 안개를 뚫고 서울로 돌아가는 장면은 일상으로의 복귀가 곧 자발적 항복임을 암시하는 비극적 전환이다. 무진에서의 경험이 아무리 강렬했더라도 그것은 현실의 구조를 변화시킬 힘을 갖지 못하며, 희중은 전무 승진이라는 세속적 보상 체계로 다시 편입되어야 하는 자신의 처지를 냉정하게 수락한다. 이러한 서사 구조는 1960년대 한국 사회에서 근대화와 산업화가 개인에게 물질적 상승의 기회를 제공하면서도 동시에 실존적 자유를 구조적으로 억압하는 양면적 현실을 정밀하게 포착한 것이다. 김승옥은 이 소설을 통해 한국 소설의 문체를 감각적이고 정밀한 방향으로 전환시켰으며, 내면의 미세한 떨림을 언어화하는 심리적 사실주의의 새로운 지평을 열어 이후 한국 현대 소설의 문체적 기준을 근본적으로 바꾸어 놓았다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 58 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 「무진기행」의 문학사적 의의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "감각적 문체와 내면적 서사를 결합한 모더니즘 소설의 가능성을 열었다" },
        { id: "B", text: "농촌 현실을 사실적으로 재현한 리얼리즘 소설의 전범을 확립하였다" },
        { id: "C", text: "전통적 서사 구조를 현대적으로 계승한 역사 소설의 방향을 제시하였다" },
        { id: "D", text: "실험적 형식을 통해 언어 자체를 탐구하는 메타소설의 시초가 되었다" }
      ],
      answerId: "A"
    },
    'p0_s2': {
      prompt: "하이라이트된 문장에서 희중이 무진으로 향하는 여행의 의미로 적절한 것은?",
      choices: [
        { id: "A", text: "도시적 삶의 위선과 타협으로부터 벗어나 잃어버린 자아를 회복하려는 시도이다" },
        { id: "B", text: "사업적 기회를 탐색하기 위한 실리적 목적의 출장이다" },
        { id: "C", text: "가족과의 재회를 통해 혈연적 유대를 회복하려는 귀향이다" },
        { id: "D", text: "건강 회복을 위해 자연 환경으로 이동하는 요양 여행이다" }
      ],
      answerId: "A"
    },
    'p1_s1': {
      prompt: "하이라이트된 문장에서 무진의 안개가 조성하는 분위기의 기능으로 적절한 것은?",
      choices: [
        { id: "A", text: "현실 세계의 윤곽을 흐리게 하여 사회적 규범으로부터의 해방을 가능하게 한다" },
        { id: "B", text: "공포와 불안의 분위기를 조성하여 서사적 긴장감을 높인다" },
        { id: "C", text: "자연의 아름다움을 강조하여 서정적 정서를 환기시킨다" },
        { id: "D", text: "시간의 흐름을 지연시켜 과거 회상의 계기를 마련한다" }
      ],
      answerId: "A"
    },
    'p1_s3': {
      prompt: "하이라이트된 문장에서 안개의 이중적 상징이 의미하는 바로 적절한 것은?",
      choices: [
        { id: "A", text: "경계를 지우는 것이 자유이면서 동시에 자기 기만의 조건이 된다" },
        { id: "B", text: "아름다움과 위험이 공존하는 자연의 양면적 속성을 보여준다" },
        { id: "C", text: "과거와 현재가 중첩되는 시간적 모호성을 상징한다" },
        { id: "D", text: "도시와 농촌의 문화적 차이를 공간적으로 드러낸다" }
      ],
      answerId: "A"
    },
    'p2_s0': {
      prompt: "하이라이트된 문장에서 하인숙과의 관계가 서사에서 수행하는 기능은?",
      choices: [
        { id: "A", text: "희중의 내면적 갈등을 첨예하게 드러내는 서사적 장치이다" },
        { id: "B", text: "주인공의 과거 사건을 회상하게 하는 촉매 역할을 한다" },
        { id: "C", text: "소설의 결말에서 해피엔딩을 가능하게 하는 로맨스 요소이다" },
        { id: "D", text: "무진의 사회적 현실을 객관적으로 보여주는 보조 인물이다" }
      ],
      answerId: "A"
    },
    'p2_s3': {
      prompt: "하이라이트된 문장에서 희중과 하인숙의 관계가 보여주는 주제적 의미는?",
      choices: [
        { id: "A", text: "진정성의 순간이 현실의 구조적 압력 앞에서 패배하는 과정을 보여준다" },
        { id: "B", text: "사랑이 모든 현실적 장애를 극복할 수 있다는 낭만적 확신을 보여준다" },
        { id: "C", text: "소도시의 인간관계가 도시보다 진실되다는 비교를 보여준다" },
        { id: "D", text: "교육자의 사회적 책임과 헌신의 가치를 보여준다" }
      ],
      answerId: "A"
    },
    'p3_s0': {
      prompt: "하이라이트된 문장에서 결말의 서울 복귀가 암시하는 바로 적절한 것은?",
      choices: [
        { id: "A", text: "일상으로의 복귀가 곧 자발적 항복임을 암시한다" },
        { id: "B", text: "주인공이 정신적 성장을 이루고 성숙한 결정을 내림을 보여준다" },
        { id: "C", text: "무진에서의 경험이 서울 생활을 혁신적으로 변화시킬 것을 예고한다" },
        { id: "D", text: "고향과 도시의 화해를 통한 정체성 통합을 암시한다" }
      ],
      answerId: "A"
    },
    'p3_s3': {
      prompt: "하이라이트된 문장에서 김승옥이 이 소설을 통해 이룬 문학적 성취로 적절한 것은?",
      choices: [
        { id: "A", text: "한국 소설의 문체를 감각적이고 정밀한 방향으로 전환시켰다" },
        { id: "B", text: "한국 문학에서 최초로 의식의 흐름 기법을 도입하였다" },
        { id: "C", text: "전통적 서사 구조의 완벽한 실현을 달성하였다" },
        { id: "D", text: "사회주의 리얼리즘의 한국적 적용 가능성을 입증하였다" }
      ],
      answerId: "A"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "윤희중의 현실적 성공과 실존적 진정성 사이의 내적 갈등 및 무진행의 의미" },
        { id: "B", text: "1960년대 한국 제약 산업의 성장과 기업 문화의 형성 과정" },
        { id: "C", text: "도시와 농촌의 경제적 격차와 이촌향도 현상의 사회적 배경" },
        { id: "D", text: "전후 한국 사회의 정치적 변동과 민주화 운동의 전개" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "안개로 상징되는 무진의 비현실적 분위기와 해방·자기기만의 이중적 의미" },
        { id: "B", text: "한국 남해안 지역의 기후적 특성과 안개 발생의 기상학적 원인" },
        { id: "C", text: "모더니즘 문학에서 도시 공간이 지닌 소외와 고독의 상징성" },
        { id: "D", text: "자연주의 소설에서 환경이 인간 행동에 미치는 결정론적 영향" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "하인숙과의 관계를 통해 드러나는 진정성과 현실 사이의 패배적 구조" },
        { id: "B", text: "1960년대 농촌 여교사의 사회적 지위와 교육 환경의 실상" },
        { id: "C", text: "자살 문제에 대한 사회적 인식과 정신건강 지원 체계의 필요성" },
        { id: "D", text: "서간 문학의 전통과 편지가 소설 서사에서 수행하는 기능" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "서울 복귀의 비극적 의미와 김승옥이 한국 소설에 이룬 문체적 전환" },
        { id: "B", text: "산업화 시대 노동자의 삶과 도시 빈민 문제의 문학적 형상화" },
        { id: "C", text: "한국 근대 소설의 초기 형성기와 이광수의 계몽주의적 문학관" },
        { id: "D", text: "1970년대 민중 문학 운동의 전개와 리얼리즘적 서사 전략" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "희중이 서울에서 근무하는 회사의 종류는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "제약 회사")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "무진을 감싸고 있는 자연 현상이자 소설의 핵심 이미지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "안개")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "희중이 무진에서 만나 감정적으로 교감하는 여성의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "하인숙")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "하인숙의 직업은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "여교사")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "희중이 서울에서 승진할 직책의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "전무")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "김승옥이 이 소설을 통해 연 새로운 문학적 지평을 무엇이라 표현하는가?",
      answerRanges: [findRange(paragraphs, "p4", "심리적 사실주의")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(58, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 59: 비문학 (NONFICTION, 홀수) ──
function buildDay59() {
  const paragraphs = [
    {
      id: "p1",
      text: "지구의 대기에서 이산화탄소는 전체 구성 기체 중 약 0.04퍼센트에 불과한 미량 성분이지만, 지구의 평균 기온을 결정하는 데 핵심적인 역할을 한다. 이산화탄소를 포함한 온실가스는 태양 복사에 대해서는 투명하여 지표까지 도달하게 하지만, 지표에서 방출되는 적외선 복사를 흡수하고 재방출함으로써 대기의 온도를 상승시키는 온실 효과를 일으킨다. 온실 효과 자체는 지구 생명의 존속에 필수적인 자연 현상으로, 만약 온실 효과가 없다면 지구의 평균 기온은 현재의 섭씨 약 15도에서 영하 18도까지 하락하여 대부분의 생물이 생존할 수 없는 환경이 될 것이다. 문제는 산업 혁명 이후 화석 연료의 대규모 연소로 대기 중 이산화탄소 농도가 산업화 이전 약 280피피엠에서 현재 420피피엠 이상으로 급격히 증가하여 자연적 온실 효과가 강화되고 있다는 점이다."
    },
    {
      id: "p2",
      text: "이산화탄소 농도 증가가 기후에 미치는 영향은 단순한 기온 상승에 그치지 않고 복잡한 되먹임 과정을 통해 증폭된다. 기온이 상승하면 대기 중 수증기 함량이 증가하는데, 수증기 자체가 강력한 온실가스이므로 추가적인 온난화를 유발하는 양의 되먹임이 작동한다. 또한 북극의 해빙이 녹으면 태양 복사를 반사하던 밝은 표면이 감소하고 어두운 해수면이 드러나면서 더 많은 열을 흡수하게 되는 알베도 되먹임도 온난화를 가속시킨다. 시베리아와 캐나다 북부의 영구동토층이 해동되면 수천 년간 동결 상태로 보존되어 있던 유기물이 분해되면서 메탄과 이산화탄소가 방출되어 온난화를 더욱 심화시키는 잠재적 위험이 존재한다."
    },
    {
      id: "p3",
      text: "기후변화에 대한 국제 사회의 대응은 1992년 유엔기후변화협약 채택을 기점으로 본격화되었다. 1997년 교토의정서는 선진국에 대해 온실가스 감축 의무를 부과한 최초의 법적 구속력 있는 국제 협정이었으나, 미국의 비준 거부와 개발도상국의 의무 면제로 실효성에 한계가 있었다. 이를 보완하기 위해 2015년에 채택된 파리 협정은 선진국과 개발도상국 구분 없이 모든 당사국이 자발적 감축 목표를 설정하고 이행하는 상향식 구조를 채택하였으며, 산업화 이전 대비 지구 평균 기온 상승 폭을 섭씨 2도 이내로 제한하되 가능하면 1.5도 이내로 억제하겠다는 목표를 제시하였다. 그러나 현재까지 각국이 제출한 자발적 감축 목표의 총합은 파리 협정의 목표를 달성하기에 현저히 부족한 수준으로 평가되고 있다."
    },
    {
      id: "p4",
      text: "기후변화의 근본적 해결을 위해서는 에너지 시스템의 구조적 전환이 불가피하다. 화석 연료 중심의 에너지 체계를 태양광, 풍력 등 재생 에너지 중심으로 전환하는 것이 핵심 과제이며, 이 과정에서 에너지 저장 기술과 스마트 그리드 기술의 발전이 필수적으로 요구된다. 탄소 포집 및 저장 기술은 화석 연료 사용에서 발생하는 이산화탄소를 대기 중으로 방출하기 전에 포집하여 지하에 저장하는 기술로, 전환 과정의 보완적 수단으로 주목받고 있다. 그러나 기술적 해법만으로는 충분하지 않으며, 에너지 소비 패턴의 변화, 순환 경제로의 전환, 그리고 기후 정의의 관점에서 선진국과 개발도상국 간의 형평성을 확보하는 국제적 협력 체계의 강화가 동시에 이루어져야 한다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 59 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 이산화탄소가 지구 기온에 미치는 역할에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "전체 대기의 약 0.04퍼센트에 불과하지만 기온 결정에 핵심적 역할을 한다" },
        { id: "B", text: "대기의 주요 구성 성분으로 기온에 미치는 영향은 미미하다" },
        { id: "C", text: "기온을 낮추는 냉각 효과를 가지는 기체이다" },
        { id: "D", text: "대기 중 농도가 높아야만 생물이 광합성을 할 수 있는 기체이다" }
      ],
      answerId: "A"
    },
    'p0_s2': {
      prompt: "하이라이트된 문장에서 온실 효과가 없을 경우 지구의 평균 기온은 어떻게 변하는가?",
      choices: [
        { id: "A", text: "현재 약 15도에서 영하 18도까지 하락하게 된다" },
        { id: "B", text: "현재보다 약간 상승하여 생물 다양성이 증가한다" },
        { id: "C", text: "변화가 없으며 현재 수준을 유지하게 된다" },
        { id: "D", text: "극심한 온난화가 발생하여 해수면이 급상승한다" }
      ],
      answerId: "A"
    },
    'p1_s1': {
      prompt: "하이라이트된 문장에서 수증기가 온난화에 기여하는 방식으로 적절한 것은?",
      choices: [
        { id: "A", text: "수증기 자체가 온실가스이므로 양의 되먹임을 통해 온난화를 유발한다" },
        { id: "B", text: "수증기가 태양 복사를 차단하여 기온을 낮추는 음의 되먹임을 작동시킨다" },
        { id: "C", text: "수증기가 구름을 형성하여 지표 온도를 일정하게 유지시킨다" },
        { id: "D", text: "수증기가 이산화탄소를 분해하여 온실 효과를 감소시킨다" }
      ],
      answerId: "A"
    },
    'p1_s2': {
      prompt: "하이라이트된 문장에서 알베도 되먹임이 온난화를 가속시키는 원리로 적절한 것은?",
      choices: [
        { id: "A", text: "해빙이 녹으면 밝은 표면이 감소하고 어두운 해수면이 더 많은 열을 흡수한다" },
        { id: "B", text: "해수면 상승으로 육지 면적이 줄어들어 대기 순환이 변화한다" },
        { id: "C", text: "극지방의 기압이 변화하여 전지구적 바람 패턴이 재편된다" },
        { id: "D", text: "해류의 온도가 상승하여 열대 지방의 강수량이 증가한다" }
      ],
      answerId: "A"
    },
    'p2_s1': {
      prompt: "하이라이트된 문장에서 교토의정서의 한계로 지적된 것은?",
      choices: [
        { id: "A", text: "미국의 비준 거부와 개발도상국의 의무 면제로 실효성에 한계가 있었다" },
        { id: "B", text: "감축 목표가 지나치게 높아 어떤 국가도 달성할 수 없었다" },
        { id: "C", text: "법적 구속력이 없어 선진국들이 자발적으로만 참여하였다" },
        { id: "D", text: "온실가스의 종류를 이산화탄소로만 제한하여 범위가 좁았다" }
      ],
      answerId: "A"
    },
    'p2_s2': {
      prompt: "하이라이트된 문장에서 파리 협정의 구조적 특징으로 적절한 것은?",
      choices: [
        { id: "A", text: "모든 당사국이 자발적 감축 목표를 설정하는 상향식 구조를 채택하였다" },
        { id: "B", text: "선진국에게만 의무를 부과하는 하향식 구조를 유지하였다" },
        { id: "C", text: "감축 의무 대신 재정 지원에만 초점을 맞춘 협정이다" },
        { id: "D", text: "개별 국가의 주권을 인정하지 않는 강제적 규제 체계이다" }
      ],
      answerId: "A"
    },
    'p3_s0': {
      prompt: "하이라이트된 문장에서 기후변화의 근본적 해결을 위해 필요한 것은?",
      choices: [
        { id: "A", text: "에너지 시스템의 구조적 전환이 불가피하다" },
        { id: "B", text: "현재의 화석 연료 사용 효율만 개선하면 충분하다" },
        { id: "C", text: "원자력 에너지로의 전면 전환이 유일한 해법이다" },
        { id: "D", text: "국가 단위의 노력이 아닌 개인의 생활 습관 변화만이 필요하다" }
      ],
      answerId: "A"
    },
    'p3_s3': {
      prompt: "하이라이트된 문장에서 기술적 해법과 함께 요구되는 것으로 적절하지 않은 것은?",
      choices: [
        { id: "A", text: "에너지 소비 패턴의 변화와 순환 경제로의 전환이 필요하다" },
        { id: "B", text: "선진국과 개발도상국 간의 형평성을 확보해야 한다" },
        { id: "C", text: "국제적 협력 체계의 강화가 이루어져야 한다" },
        { id: "D", text: "화석 연료의 사용량을 현재 수준으로 유지하면 된다" }
      ],
      answerId: "D"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "이산화탄소의 온실 효과 원리와 산업화 이후 대기 중 농도의 급격한 증가" },
        { id: "B", text: "태양 에너지의 생성 원리와 지구에 도달하는 복사 에너지의 양" },
        { id: "C", text: "대기 오염 물질의 종류와 인체에 미치는 건강 영향" },
        { id: "D", text: "지구 자전축의 기울기가 계절 변화에 미치는 영향" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "수증기 되먹임, 알베도 되먹임, 영구동토층 해동 등 온난화 증폭 메커니즘" },
        { id: "B", text: "해양 생태계의 먹이 사슬 구조와 어류 자원의 관리 방안" },
        { id: "C", text: "극지방 탐험의 역사와 과학적 연구 기지 운영 현황" },
        { id: "D", text: "화산 활동이 대기 성분에 미치는 영향과 기후 변동 관계" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "유엔기후변화협약부터 파리 협정까지의 국제적 대응 경과와 한계" },
        { id: "B", text: "국제 무역 분쟁의 해결 절차와 세계무역기구의 역할" },
        { id: "C", text: "핵무기 비확산 조약의 역사와 군축 협상의 진전 상황" },
        { id: "D", text: "국제 인권법의 발전 과정과 인권 보호 메커니즘의 강화" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "재생 에너지 전환, 탄소 포집 기술, 에너지 소비 변화 등 종합적 해법의 필요성" },
        { id: "B", text: "전기 자동차의 기술 발전과 내연기관 자동차의 퇴출 일정" },
        { id: "C", text: "원자력 에너지의 안전성 논쟁과 방사성 폐기물 처리 문제" },
        { id: "D", text: "석유 산업의 역사와 중동 지역의 지정학적 갈등 구조" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "온실 효과가 없다면 지구의 평균 기온은 어디까지 하락하는가?",
      answerRanges: [findRange(paragraphs, "p1", "영하 18도")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "산업화 이전 대기 중 이산화탄소 농도는 약 몇 피피엠이었는가?",
      answerRanges: [findRange(paragraphs, "p1", "280피피엠")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "해빙이 녹으면서 태양 복사 반사가 감소하는 현상을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "알베도 되먹임")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "선진국에 온실가스 감축 의무를 부과한 최초의 법적 구속력 있는 협정은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "교토의정서")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "파리 협정이 제시한 기온 상승 억제 목표는 산업화 이전 대비 몇 도 이내인가?",
      answerRanges: [findRange(paragraphs, "p3", "1.5도")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이산화탄소를 포집하여 지하에 저장하는 기술을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "탄소 포집 및 저장")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(59, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 60: 문학 (LITERATURE, 짝수) ──
function buildDay60() {
  const paragraphs = [
    {
      id: "p1",
      text: "황석영의 소설 「삼포 가는 길」은 1973년에 발표된 단편소설로, 산업화 시대에 고향과 공동체를 상실한 유랑하는 민중의 삶을 서정적 리얼리즘으로 형상화한 작품이다. 소설의 중심인물인 영달은 각지의 공사판을 떠도는 노동자로, 정처 없는 이동 자체가 그의 삶의 양태를 구성하고 있다. 그는 눈 덮인 겨울길에서 같은 처지의 노동자 정씨를 만나 동행하게 되며, 이후 밤의 술집에서 도망쳐 나온 백화라는 젊은 여성이 합류한다. 이 세 사람의 동행은 산업화라는 거대한 역사적 전환 속에서 삶의 터전을 잃고 부유하는 민중 계층의 축소된 초상이라 할 수 있으며, 각 인물은 서로 다른 방식으로 시대적 격변의 피해자로서의 면모를 보여준다."
    },
    {
      id: "p2",
      text: "소설에서 정씨가 향하고 있는 삼포라는 공간은 서사의 방향성을 결정하는 핵심적 상징이다. 정씨에게 삼포는 십여 년 전에 떠나온 고향 마을로, 해변의 조용한 어촌이라는 목가적 기억으로 간직되어 있다. 삼포를 향해 걸어가는 행위는 산업화 이전의 공동체적 삶과 인간적 유대가 살아 있던 시간으로 돌아가고자 하는 근원적 귀향 욕구를 상징하며, 이 귀향의 여정 자체가 소설의 서정적 분위기를 형성하는 중심축이 된다. 그러나 독자는 소설이 진행됨에 따라 정씨의 삼포가 기억 속에만 존재하는 장소이며, 실제로 도달했을 때 그곳이 더 이상 기억 속의 삼포가 아닐 것이라는 불안한 예감을 갖게 되고, 이러한 예감은 서사에 비극적 긴장감을 부여하는 핵심적 장치로 기능한다."
    },
    {
      id: "p3",
      text: "세 인물의 동행에서 나타나는 상호작용은 따뜻한 연대와 구조적 한계를 동시에 보여준다. 영달과 정씨는 같은 노동자로서 물질적 궁핍과 사회적 소외를 공유하며, 백화는 성별에 의한 추가적 착취를 경험한 인물로서 이들의 고단함에 또 다른 층위를 더한다. 눈길을 함께 걷고 찻집에서 국밥을 나누며 서로의 처지를 무언으로 이해하는 장면들은 이들 사이에 형성되는 소박한 인간적 연대를 감동적으로 드러낸다. 그러나 이 연대는 우연한 만남에 기반한 일시적인 것이며, 각자의 목적지에 도달하면 흩어질 수밖에 없다는 구조적 취약성을 태생적으로 안고 있어, 따뜻함 속에 비애가 깃든 복합적 정서를 만들어내며 이것이야말로 이 소설이 지닌 고유한 서정적 울림의 원천이라 할 수 있다."
    },
    {
      id: "p4",
      text: "소설의 결말에서 삼포에 도달한 정씨가 발견하는 것은 기억 속의 어촌이 아니라 관광지로 개발되어 옛 모습을 완전히 잃어버린 낯선 공간이다. 이 장면은 산업화가 단순히 경제적 변동만을 야기하는 것이 아니라 장소의 정체성과 기억의 근거지 자체를 파괴한다는 것을 보여주는 결정적 순간이다. 고향의 소멸은 개인의 과거가 물리적으로 거처할 곳을 잃었음을 의미하며, 이로써 귀향이라는 행위 자체가 근본적으로 불가능해진다는 비극적 인식에 도달하게 된다. 「삼포 가는 길」은 산업화 시대 한국 민중의 유랑과 상실을 감상에 빠지지 않는 절제된 문체로 형상화함으로써, 1970년대 한국 문학이 도달한 리얼리즘적 성취의 정점을 보여주며 오늘날까지 광범위하게 읽히는 한국 단편소설의 고전으로 자리매김하고 있다."
    }
  ];

  const len = charLen(paragraphs);
  console.log(`Day 60 지문 길이: ${len}자`);

  const customQuestions = {
    'p0_s0': {
      prompt: "하이라이트된 문장에서 「삼포 가는 길」의 주제적 성격으로 적절한 것은?",
      choices: [
        { id: "A", text: "산업화 시대에 고향과 공동체를 상실한 민중의 삶을 형상화하였다" },
        { id: "B", text: "농촌 공동체의 아름다운 전통을 긍정적으로 재현하였다" },
        { id: "C", text: "도시 노동자의 성공적인 계층 상승 서사를 그렸다" },
        { id: "D", text: "일제 강점기 독립 운동가의 투쟁과 희생을 다루었다" }
      ],
      answerId: "A"
    },
    'p0_s3': {
      prompt: "하이라이트된 문장에서 세 인물의 동행이 상징하는 바로 적절한 것은?",
      choices: [
        { id: "A", text: "산업화 속에서 삶의 터전을 잃고 부유하는 민중 계층의 축소된 초상이다" },
        { id: "B", text: "가족 공동체의 해체와 재결합 과정을 보여주는 알레고리이다" },
        { id: "C", text: "계급 투쟁을 통한 사회 변혁의 가능성을 암시하는 상징이다" },
        { id: "D", text: "전통적 유교 사회의 인간관계 질서를 보여주는 축도이다" }
      ],
      answerId: "A"
    },
    'p1_s1': {
      prompt: "하이라이트된 문장에서 정씨에게 삼포가 지닌 의미로 적절한 것은?",
      choices: [
        { id: "A", text: "십여 년 전에 떠나온 고향으로 목가적 기억으로 남아 있는 어촌이다" },
        { id: "B", text: "새로운 일자리를 구하기 위해 처음 방문하는 도시이다" },
        { id: "C", text: "과거에 큰 성공을 거두었던 사업의 근거지이다" },
        { id: "D", text: "동료 노동자가 추천한 관광 명소이다" }
      ],
      answerId: "A"
    },
    'p1_s2': {
      prompt: "하이라이트된 문장에서 삼포를 향해 걸어가는 행위가 상징하는 바는?",
      choices: [
        { id: "A", text: "산업화 이전의 공동체적 삶으로 돌아가고자 하는 근원적 귀향 욕구이다" },
        { id: "B", text: "더 나은 경제적 기회를 향한 합리적 이동이다" },
        { id: "C", text: "자연 속에서 은둔 생활을 선택하려는 도피적 태도이다" },
        { id: "D", text: "종교적 수행을 위한 순례의 여정이다" }
      ],
      answerId: "A"
    },
    'p2_s0': {
      prompt: "하이라이트된 문장에서 세 인물의 상호작용이 동시에 보여주는 두 가지는?",
      choices: [
        { id: "A", text: "따뜻한 연대와 구조적 한계를 동시에 보여준다" },
        { id: "B", text: "갈등과 화해의 반복적 패턴을 보여준다" },
        { id: "C", text: "경쟁과 협력의 경제적 관계를 보여준다" },
        { id: "D", text: "지배와 복종의 권력 관계를 보여준다" }
      ],
      answerId: "A"
    },
    'p2_s3': {
      prompt: "하이라이트된 문장에서 이들의 연대가 지닌 구조적 취약성의 원인은?",
      choices: [
        { id: "A", text: "우연한 만남에 기반하여 각자의 목적지에서 흩어질 수밖에 없다는 점이다" },
        { id: "B", text: "경제적 이해관계의 충돌로 갈등이 불가피하다는 점이다" },
        { id: "C", text: "세대 간 가치관 차이로 소통이 불가능하다는 점이다" },
        { id: "D", text: "법적 제도적 보호 장치의 부재로 권리를 주장할 수 없다는 점이다" }
      ],
      answerId: "A"
    },
    'p3_s0': {
      prompt: "하이라이트된 문장에서 삼포에 도달한 정씨가 발견한 것은?",
      choices: [
        { id: "A", text: "관광지로 개발되어 옛 모습을 완전히 잃어버린 낯선 공간이다" },
        { id: "B", text: "예전 모습 그대로 보존된 평화로운 어촌 마을이다" },
        { id: "C", text: "전쟁으로 폐허가 된 황폐한 공간이다" },
        { id: "D", text: "대규모 공장이 들어선 산업 단지이다" }
      ],
      answerId: "A"
    },
    'p3_s3': {
      prompt: "하이라이트된 문장에서 「삼포 가는 길」의 문학사적 평가로 적절한 것은?",
      choices: [
        { id: "A", text: "1970년대 한국 문학이 도달한 리얼리즘적 성취의 정점을 보여준다" },
        { id: "B", text: "한국 모더니즘 소설의 형식적 실험을 대표하는 작품이다" },
        { id: "C", text: "전통적 설화를 현대적으로 재해석한 판타지 소설의 시초이다" },
        { id: "D", text: "해방 이후 최초의 노동 소설로 프로문학의 전통을 계승하였다" }
      ],
      answerId: "A"
    },
    'central_p0': {
      choices: [
        { id: "A", text: "산업화 시대 유랑 노동자들의 만남과 세 인물 동행의 상징적 의미" },
        { id: "B", text: "1970년대 한국 건설 산업의 성장과 노동 시장의 구조적 변화" },
        { id: "C", text: "농촌에서 도시로의 인구 이동과 도시화의 사회적 영향" },
        { id: "D", text: "한국 전쟁 이후 전쟁 고아의 사회 적응 과정과 복지 정책" }
      ],
      answerId: "A"
    },
    'central_p1': {
      choices: [
        { id: "A", text: "삼포라는 고향이 지닌 목가적 기억과 실제 귀향 불가능성에 대한 불안" },
        { id: "B", text: "한국 동해안 어촌의 경제적 특성과 수산업의 발전 현황" },
        { id: "C", text: "한국 문학에서 여행 모티프의 역사적 변천과 의미 변화" },
        { id: "D", text: "이촌향도 현상의 인구학적 분석과 지역 불균형 심화 문제" }
      ],
      answerId: "A"
    },
    'central_p2': {
      choices: [
        { id: "A", text: "세 인물 사이의 소박한 연대와 그것의 일시적·구조적 한계" },
        { id: "B", text: "한국 사회의 성별 불평등과 여성 노동자의 처우 개선 과정" },
        { id: "C", text: "노동조합의 형성 과정과 집단적 저항의 사회적 효과" },
        { id: "D", text: "음식 문화를 통한 한국적 정서의 재현과 문학적 활용" }
      ],
      answerId: "A"
    },
    'central_p3': {
      choices: [
        { id: "A", text: "고향의 소멸과 귀향 불가능성, 그리고 리얼리즘적 문학사적 성취" },
        { id: "B", text: "관광 산업의 발전이 지역 사회에 미치는 경제적 효과와 문제점" },
        { id: "C", text: "한국 근대 소설의 초기 형성기와 신소설의 특징" },
        { id: "D", text: "도시 재개발 과정에서의 주민 이주와 공동체 해체 문제" }
      ],
      answerId: "A"
    }
  };

  const timeline = buildTimeline(paragraphs, customQuestions);
  const cards = buildRecallCards(paragraphs);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "주인공 영달의 직업적 특성은 어떤 표현으로 묘사되어 있는가?",
      answerRanges: [findRange(paragraphs, "p1", "공사판을 떠도는 노동자")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "영달이 눈길에서 만나 동행하게 되는 인물의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "정씨")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "밤의 술집에서 도망쳐 나와 합류한 여성의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "백화")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "정씨의 기억 속 삼포는 어떤 종류의 마을이었는가?",
      answerRanges: [findRange(paragraphs, "p2", "어촌")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "삼포가 변해버린 모습은 어떤 것으로 묘사되어 있는가?",
      answerRanges: [findRange(paragraphs, "p4", "관광지로 개발")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이 작품의 문체적 특징은 어떤 표현으로 묘사되어 있는가?",
      answerRanges: [findRange(paragraphs, "p4", "절제된 문체")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return assembleFull(60, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
}

// ── 메인 실행 ──
function main() {
  console.log('=== 비트겐슈타인2 Day 56~60 콘텐츠 빌드 시작 ===\n');

  const items = [
    buildDay56(),
    buildDay57(),
    buildDay58(),
    buildDay59(),
    buildDay60()
  ];

  // 길이 검증
  let hasError = false;
  items.forEach((item) => {
    const paras = item.content.payload.passage.paragraphs;
    const len = paras.reduce((s, p) => s + p.text.length, 0);
    const cards = item.content.payload.recall.cards;
    const confirms = item.content.payload.confirm.questions;
    const steps = item.content.payload.intensive.timeline;
    console.log(`Day ${item.day_index}: 지문 ${len}자, 정독 ${steps.length}스텝, 복기 ${cards.length}장, 확인 ${confirms.length}문항`);

    if (len < 1450 || len > 1550) {
      console.error(`  [경고] Day ${item.day_index} 지문 길이 ${len}자 - 범위(1450~1550) 벗어남!`);
      hasError = true;
    }
    if (cards.length !== 8) {
      console.error(`  [경고] Day ${item.day_index} 복기 카드 ${cards.length}장 - 8장이어야 합니다!`);
      hasError = true;
    }
    if (confirms.length < 5 || confirms.length > 8) {
      console.error(`  [경고] Day ${item.day_index} 확인 문항 ${confirms.length}개 - 5~8개여야 합니다!`);
      hasError = true;
    }
  });

  if (hasError) {
    console.log('\n[경고 있음] 검증 실패 항목이 있지만, 파일은 생성합니다.\n');
  }

  // 배치 파일 읽기
  console.log('\n배치 파일 읽기...');
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`배치 파일 총 items: ${batchData.items.length}`);

  // items[55]~[59] 교체 (Day 56~60은 0-indexed 55~59)
  for (let i = 0; i < 5; i++) {
    const targetIdx = 55 + i;
    const oldItem = batchData.items[targetIdx];
    console.log(`교체: items[${targetIdx}] (Day ${oldItem.day_index}) -> Day ${items[i].day_index}`);
    batchData.items[targetIdx] = items[i];
  }

  // 배치 파일 저장
  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료: ${BATCH_PATH}`);

  // static 파일 생성
  if (!fs.existsSync(STATIC_DIR)) {
    fs.mkdirSync(STATIC_DIR, { recursive: true });
  }
  for (const item of items) {
    const dayStr = String(item.day_index).padStart(3, '0');
    const staticPath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(staticPath, JSON.stringify(item.content, null, 2), 'utf8');
    console.log(`static 파일 저장 완료: ${staticPath}`);
  }

  console.log('\n=== 빌드 완료 ===');
}

main();
