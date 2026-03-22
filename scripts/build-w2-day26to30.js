// 비트겐슈타인2 Day 26~30 불량 콘텐츠 재작성 빌더
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

function shuffleWithAnswer(choices, correctId) {
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

// ── Day 26: 문학 (LITERATURE, 짝수) ──
function buildDay26() {
  const paragraphs = [
    {
      id: "p1",
      text: "이상의 단편소설 「날개」는 1936년 『조광』지에 발표된 작품으로, 한국 모더니즘 문학의 정점을 보여주는 실험적 텍스트이다. 이 소설의 화자인 나는 아내가 영위하는 삶의 실체를 의도적으로 외면한 채 밀폐된 방 안에서 무기력하게 칩거하는 지식인으로 그려진다. 나의 방은 햇빛이 차단된 폐쇄적 공간으로, 이는 식민지 현실에서 행동 능력을 상실한 근대적 주체의 정신적 감금 상태를 공간적으로 형상화한 것이다. 화자가 반복적으로 언급하는 만성적인 권태와 피로는 개인의 심리적 증상이면서 동시에 식민지 지식인 전체가 공유하는 시대적 질병의 알레고리로 해석될 수 있다."
    },
    {
      id: "p2",
      text: "작품에서 아내는 경제적 주도권을 장악하고 화자에게 수면제인 아달린을 투여하는 인물로 등장하는데, 이러한 관계 설정은 전통적 가부장제의 전도를 넘어서 자본주의 체제 내에서의 주체와 객체의 위치 전환을 상징적으로 보여준다. 화자가 아내로부터 받는 돈은 노동의 대가가 아니라 일종의 사육비에 해당하며, 이는 근대적 자아가 자율성을 포기한 대가로 물질적 안락을 취하는 타락한 거래의 구조를 드러낸다. 아달린에 의해 유도되는 수면은 현실 인식의 마비를 의미하고, 화자가 의식과 무의식 사이를 부유하는 서술 방식은 이 약물적 몽롱함을 텍스트의 형식 자체로 구현한 것이라 할 수 있다. 아내의 방과 나의 방이 분리된 공간 구조는 두 인물 간의 소통 불가능성을 건축적 은유로 제시한다."
    },
    {
      id: "p3",
      text: "소설의 절정에 해당하는 미쓰코시 백화점 옥상 장면은 화자가 폐쇄 공간을 벗어나 개방 공간으로 이동하는 결정적 전환점이다. 정오의 사이렌 소리와 함께 화자가 날개가 돋기를 기원하는 이 장면은 억압된 주체가 비상을 꿈꾸는 낭만적 열망으로 읽힐 수 있으나, 동시에 그 비상이 결코 실현될 수 없는 환상에 불과하다는 자기 인식도 내포하고 있다. 백화점이라는 근대적 소비 공간의 최상층에서 날개를 꿈꾸는 행위는 자본주의가 제공하는 물질적 풍요의 꼭대기에서도 진정한 인간적 자유는 획득할 수 없다는 역설을 구현한다. 정오의 사이렌은 근대적 시간 규율의 상징이자 동시에 잠들어 있던 자아를 향한 각성의 신호로 기능하며, 화자의 독백은 절망과 희망이 교차하는 양가적 정동을 담고 있다."
    },
    {
      id: "p4",
      text: "「날개」의 문학사적 의의는 한국 소설에서 최초로 의식의 흐름 기법을 본격적으로 구사하여 서사의 인과적 질서를 해체하고 주관적 시간 경험을 전면에 내세웠다는 점에 있다. 이상은 문장의 논리적 연결을 의도적으로 파괴하고 비약과 반복, 자유연상의 기법을 구사함으로써 근대적 이성이 지닌 한계를 형식적 차원에서 과감하게 실험하였다. 이러한 서술 전략은 당시 세계 문학의 모더니즘적 흐름과 동시대적으로 호응하는 것으로, 이상의 문학이 지역적 특수성에 갇히지 않는 세계문학적 보편성을 지니고 있음을 설득력 있게 입증한다. 이 작품은 발표 이후 수십 년에 걸쳐 무수한 해석을 낳으며 한국 문학 비평의 시금석으로 자리매김해 왔으며, 문학적 난해성 자체가 하나의 미학적 가치로 인정받을 수 있음을 증명한 선구적 사례이다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 26 지문 길이: ${len}자`);

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
          prompt: "하이라이트된 문장에서 「날개」의 문학사적 위치에 대한 설명으로 가장 적절한 것은?",
          choices: [
            { id: "A", text: "한국 모더니즘 문학의 정점을 보여주는 실험적 텍스트이다" },
            { id: "B", text: "한국 사실주의 문학을 대표하는 농촌 소설의 전범이다" },
            { id: "C", text: "해방 이후 민족 정체성을 탐구한 역사 소설의 시작점이다" },
            { id: "D", text: "전통적 서사 구조를 완성한 고전 소설의 현대적 계승이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 0 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 화자의 방이 상징하는 의미로 가장 적절한 것은?",
          choices: [
            { id: "A", text: "행동 능력을 상실한 주체의 정신적 감금 상태를 형상화한다" },
            { id: "B", text: "전통적 선비 문화의 은둔과 수양의 공간을 재현한다" },
            { id: "C", text: "자본주의적 풍요 속 물질적 안락함을 상징한다" },
            { id: "D", text: "예술가가 창작에 몰두하는 고립된 작업실을 나타낸다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 아내와 화자의 관계가 상징하는 바로 가장 적절한 것은?",
          choices: [
            { id: "A", text: "자본주의 체제 내 주체와 객체의 위치 전환을 상징한다" },
            { id: "B", text: "식민지 시대 부부 간의 전형적인 갈등 양상을 재현한다" },
            { id: "C", text: "여성 해방 운동의 성과로 달라진 가정 내 역학을 보여준다" },
            { id: "D", text: "전통 사회의 가부장적 질서가 유지되는 모습을 나타낸다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 아달린에 의한 수면이 의미하는 바로 적절한 것은?",
          choices: [
            { id: "A", text: "화자가 겪는 신체적 질병의 구체적 증상을 묘사한다" },
            { id: "B", text: "현실 인식의 마비와 의식의 몽롱함을 상징한다" },
            { id: "C", text: "아내가 화자를 보호하려는 선의의 행동을 나타낸다" },
            { id: "D", text: "근대 의학의 발전이 일상에 침투한 양상을 보여준다" }
          ],
          answerId: "B"
        };
      } else if (pi === 2 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 백화점 옥상 장면의 서사적 기능으로 적절한 것은?",
          choices: [
            { id: "A", text: "폐쇄 공간에서 개방 공간으로의 전환점 역할을 한다" },
            { id: "B", text: "화자의 과거 회상을 촉발하는 계기로 작용한다" },
            { id: "C", text: "아내와의 갈등이 화해로 전환되는 장면을 형성한다" },
            { id: "D", text: "소설의 결말에서 화자가 일상으로 복귀하는 장면이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 백화점 최상층에서 날개를 꿈꾸는 행위가 담고 있는 역설은?",
          choices: [
            { id: "A", text: "물질적 풍요의 꼭대기에서도 인간적 자유는 획득할 수 없다" },
            { id: "B", text: "높은 곳에 오를수록 일상적 삶에 대한 집착이 강해진다" },
            { id: "C", text: "경제적 성공이 정신적 성장의 필수 조건임을 보여준다" },
            { id: "D", text: "소비 문화가 예술적 창조의 원동력이 될 수 있음을 시사한다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 「날개」의 문학사적 의의로 제시된 것은?",
          choices: [
            { id: "A", text: "한국 소설 최초로 의식의 흐름 기법을 본격 구사하여 서사 질서를 해체했다" },
            { id: "B", text: "한국 문학에서 처음으로 농촌 현실을 사실적으로 묘사하였다" },
            { id: "C", text: "전통적 기승전결 구조를 가장 완벽하게 실현한 작품이다" },
            { id: "D", text: "일제에 대한 직접적 저항 의식을 최초로 표현한 소설이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 이상의 문학이 지닌 의의로 적절한 것은?",
          choices: [
            { id: "A", text: "지역적 특수성에 갇히지 않는 세계문학적 보편성을 지닌다" },
            { id: "B", text: "한국 전통 문학의 형식을 충실히 계승하고 있다" },
            { id: "C", text: "서양 문학과 완전히 단절된 독자적 문학 세계를 구축했다" },
            { id: "D", text: "특정 지역의 방언을 문학적으로 형상화한 점이 독보적이다" }
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

    // 문단별 중심내용
    stepNum++;
    const paraRange = { paragraphId: para.id, start: 0, end: para.text.length };
    const centralThemes = [
      "화자의 무기력한 칩거와 식민지 지식인의 정신적 감금 상태",
      "아내와의 관계에 나타난 자본주의적 주체·객체 전도 구조",
      "백화점 옥상 장면에서 드러나는 비상의 열망과 그 불가능성의 역설",
      "의식의 흐름 기법을 통한 서사 해체와 세계문학적 보편성"
    ];
    const wrongThemes = [
      "해방 직후 좌우 이념 대립이 문학에 미친 영향",
      "1920년대 프로문학 운동의 전개와 사회적 의의",
      "김유정 소설에 나타나는 농촌 공동체의 해학적 묘사"
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
      prompt: "화자가 칩거하는 공간의 특징적인 환경 조건은 무엇으로 서술되어 있는가?",
      answerRanges: [findRange(paragraphs, "p1", "햇빛이 차단된")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "아내가 화자에게 투여하는 수면제의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "아달린")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "화자가 날개가 돋기를 기원하는 장소는 어디인가?",
      answerRanges: [findRange(paragraphs, "p3", "백화점 옥상")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "화자의 각성 신호로 기능하는 근대적 시간 규율의 상징은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "사이렌")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이 작품이 한국 소설에서 최초로 본격 구사한 서술 기법의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "의식의 흐름")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이 작품이 한국 문학 비평에서 어떤 역할을 해왔다고 서술되어 있는가?",
      answerRanges: [findRange(paragraphs, "p4", "시금석")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(26, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 27: 비문학 (NONFICTION, 홀수) ──
function buildDay27() {
  const paragraphs = [
    {
      id: "p1",
      text: "생태계에서 핵심종이란 그 종이 차지하는 생물량에 비해 군집 전체의 구조와 기능에 불균형적으로 큰 영향을 미치는 종을 가리킨다. 이 개념은 미국의 생태학자 로버트 페인이 1969년에 제안한 것으로, 그는 조간대 생태계에서 불가사리 한 종을 제거하는 실험을 통해 이를 처음 입증하였다. 불가사리를 제거한 구역에서는 홍합이 폭발적으로 증식하여 바위 표면을 독점함으로써 다른 무척추동물과 해조류의 서식 공간이 사라졌고, 결국 종 다양성이 급격히 감소하였다. 이 실험은 먹이 사슬의 상위 포식자가 하위 종의 개체수를 조절함으로써 경쟁적 배제를 방지하고 공존을 가능하게 하는 하향식 조절 메커니즘의 존재를 명확히 보여주었다."
    },
    {
      id: "p2",
      text: "핵심종의 영향력이 작동하는 방식은 직접적 포식에 국한되지 않고 매우 다양한 경로로 나타난다. 아프리카 사바나의 코끼리는 대형 나무를 쓰러뜨리거나 껍질을 벗김으로써 폐쇄된 삼림을 개방적 초원으로 전환시키는데, 이러한 경관 수준의 교란은 초식 동물과 그에 의존하는 포식자를 포함한 수십 종의 서식 환경을 재편한다. 북미의 비버는 하천을 가로질러 댐을 건설하여 정수 환경인 연못을 조성하는데, 이 인공 습지는 양서류, 수서곤충, 물새 등에게 새로운 서식지를 제공하며 주변 식생의 구성까지 변화시킨다. 이처럼 물리적 환경을 직접 개조하여 다른 종에게 서식 조건을 창출하는 종을 생태학에서는 생태계 공학자라고 부르며, 이는 핵심종 개념의 외연을 확장하는 중요한 하위 범주에 해당한다."
    },
    {
      id: "p3",
      text: "핵심종의 소멸이 초래하는 연쇄적 생태계 붕괴는 영양 단계 폭포 현상으로 설명된다. 미국 옐로스톤 국립공원에서 늑대가 멸종된 이후, 사슴의 개체수가 통제 불능 수준으로 증가하면서 하천변 버드나무와 사시나무의 유묘가 과도하게 섭식되어 하안 식생이 크게 쇠퇴하였다. 식생의 감소는 하천 둑의 침식을 가속화하였고, 수온 상승과 수질 변화를 야기하여 어류와 수서생물의 종 구성까지 변화시켰다. 1995년 늑대를 재도입한 이후 사슴의 행동 패턴이 변화하면서 하천변 식생이 회복되기 시작하였고, 이에 따라 비버의 귀환, 명금류 개체수의 증가, 하천 지형의 안정화라는 연쇄적 복원 효과가 나타났다."
    },
    {
      id: "p4",
      text: "핵심종 개념은 현대 보전 생태학에서 한정된 자원을 효율적으로 배분하기 위한 전략적 도구로 활용되고 있다. 모든 종을 동등하게 보호하는 것이 현실적으로 불가능한 상황에서, 생태계 전체의 구조적 안정성에 가장 큰 영향을 미치는 핵심종을 우선적으로 보전하면 그와 연결된 다수의 종을 간접적으로 보호하는 우산 효과를 기대할 수 있다. 그러나 특정 종의 핵심종 여부는 해당 생태계의 맥락에 따라 달라질 수 있으며, 한 지역에서 핵심종으로 기능하는 종이 다른 지역에서는 그렇지 않을 수 있다는 맥락 의존성이 이 개념의 적용을 복잡하게 만든다. 따라서 핵심종 보전 전략은 개별 종의 생태적 역할에 대한 장기적이고 체계적인 연구를 전제로 해야 하며, 종 단위의 접근과 생태계 단위의 접근을 상호 보완적으로 결합하는 통합적 보전 방안이 요구되고 있다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 27 지문 길이: ${len}자`);

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
          prompt: "하이라이트된 문장에서 핵심종의 정의로 가장 적절한 것은?",
          choices: [
            { id: "A", text: "생물량에 비해 군집 전체에 불균형적으로 큰 영향을 미치는 종이다" },
            { id: "B", text: "생태계에서 가장 많은 개체수를 보유하는 우점종을 가리킨다" },
            { id: "C", text: "먹이 사슬의 최하위에 위치하여 에너지를 생산하는 종이다" },
            { id: "D", text: "다른 종과의 상호작용 없이 독립적으로 생존하는 종이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 0 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 불가사리 제거 후 나타난 현상으로 적절한 것은?",
          choices: [
            { id: "A", text: "홍합이 독점적으로 증식하여 다른 종의 서식 공간이 사라졌다" },
            { id: "B", text: "해조류가 과잉 성장하여 다른 식물의 광합성을 방해하였다" },
            { id: "C", text: "조간대의 수온이 급격히 변화하여 모든 생물이 이동하였다" },
            { id: "D", text: "새로운 포식자가 등장하여 생태계의 균형이 재편되었다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 1) {
        question = {
          prompt: "하이라이트된 문장에서 코끼리가 생태계에 미치는 영향으로 적절한 것은?",
          choices: [
            { id: "A", text: "대형 나무를 쓰러뜨려 폐쇄된 삼림을 개방적 초원으로 전환시킨다" },
            { id: "B", text: "하천에 댐을 건설하여 정수 환경인 연못을 조성한다" },
            { id: "C", text: "토양의 영양분을 흡수하여 주변 식물의 성장을 억제한다" },
            { id: "D", text: "다른 초식 동물의 먹이를 독점하여 경쟁적 배제를 야기한다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 3) {
        question = {
          prompt: "하이라이트된 문장에서 '생태계 공학자'의 의미로 가장 적절한 것은?",
          choices: [
            { id: "A", text: "물리적 환경을 직접 개조하여 다른 종에게 서식 조건을 창출하는 종이다" },
            { id: "B", text: "인위적으로 생태계를 복원하는 인간 과학자를 비유적으로 지칭한다" },
            { id: "C", text: "먹이 사슬에서 에너지 전달의 효율성을 높이는 종을 가리킨다" },
            { id: "D", text: "멸종 위기 종을 보호하기 위해 인공 서식지를 설계하는 전문가이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 핵심종 소멸의 연쇄적 효과를 설명하는 개념은 무엇인가?",
          choices: [
            { id: "A", text: "영양 단계 폭포 현상으로 설명된다" },
            { id: "B", text: "경쟁적 배제의 원리로 해석된다" },
            { id: "C", text: "적응 방산의 메커니즘으로 분석된다" },
            { id: "D", text: "공진화의 과정을 통해 이해된다" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 3) {
        question = {
          prompt: "하이라이트된 문장에서 늑대 재도입 후 나타난 연쇄적 복원 효과에 해당하지 않는 것은?",
          choices: [
            { id: "A", text: "비버의 귀환과 명금류 개체수의 증가가 나타났다" },
            { id: "B", text: "하천 지형이 안정화되는 효과가 나타났다" },
            { id: "C", text: "사슴의 행동 패턴이 변화하여 식생이 회복되었다" },
            { id: "D", text: "홍합의 개체수가 폭발적으로 증가하여 종 다양성이 감소하였다" }
          ],
          answerId: "D"
        };
      } else if (pi === 3 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 핵심종 개념의 현대적 활용 방식으로 적절한 것은?",
          choices: [
            { id: "A", text: "한정된 자원을 효율적으로 배분하기 위한 전략적 도구로 활용된다" },
            { id: "B", text: "모든 종을 동등하게 보호하는 평등주의적 원칙의 근거로 사용된다" },
            { id: "C", text: "생태계의 자연적 자정 능력을 부정하는 논거로 활용된다" },
            { id: "D", text: "특정 종의 상업적 가치를 평가하는 경제적 지표로 사용된다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 핵심종 개념의 적용을 복잡하게 만드는 요인은 무엇인가?",
          choices: [
            { id: "A", text: "핵심종 여부가 생태계 맥락에 따라 달라지는 맥락 의존성이다" },
            { id: "B", text: "핵심종의 개체수를 정확히 파악하기 어려운 기술적 한계이다" },
            { id: "C", text: "핵심종과 비핵심종의 유전적 차이를 구분하기 어렵다는 점이다" },
            { id: "D", text: "핵심종에 대한 학계의 합의가 전혀 이루어지지 않았다는 점이다" }
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
      "핵심종의 정의와 조간대 실험을 통한 하향식 조절 메커니즘의 입증",
      "코끼리와 비버를 통해 본 핵심종 영향의 다양한 경로와 생태계 공학자 개념",
      "영양 단계 폭포 현상과 옐로스톤 늑대 재도입의 연쇄적 복원 효과",
      "핵심종 개념의 보전 생태학적 활용과 맥락 의존성에 따른 적용의 복잡성"
    ];
    const wrongThemes = [
      "유전자 편집 기술의 생태학적 응용과 윤리적 쟁점",
      "도시 열섬 현상의 원인과 녹지 조성을 통한 완화 방안",
      "해양 산성화가 산호초 생태계에 미치는 영향과 대응 전략"
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
      prompt: "핵심종 개념을 최초로 제안한 생태학자는 누구인가?",
      answerRanges: [findRange(paragraphs, "p1", "로버트 페인")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "불가사리 제거 후 바위 표면을 독점하며 증식한 생물은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "홍합")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "하천에 댐을 건설하여 습지를 조성하는 생태계 공학자로 언급된 동물은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "비버")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "늑대의 재도입이 이루어진 미국의 국립공원의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "옐로스톤")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "핵심종을 우선 보전하면 다수의 종을 간접적으로 보호하는 효과를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "우산 효과")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "핵심종 개념의 적용을 복잡하게 만드는 요인으로 언급된 성질은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "맥락 의존성")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(27, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 28: 문학 (LITERATURE, 짝수) ──
function buildDay28() {
  const paragraphs = [
    {
      id: "p1",
      text: "박경리의 대하소설 『토지』는 1969년부터 1994년까지 25년에 걸쳐 완성된 작품으로, 구한말에서 해방에 이르는 격동의 한국 근현대사를 시대적 배경으로 펼쳐진다. 경남 하동 평사리의 지주 최참판댁 가문을 중심으로 시작된 서사는 점차 간도, 서울, 일본 등으로 공간을 확장하며 수백 명에 달하는 인물 군상의 삶과 운명을 교직한다. 이 작품에서 토지는 단순한 물리적 대상이 아니라 인간 존재의 근원적 기반이자 역사적 수탈과 저항의 대상이며 공동체 정체성의 상징으로서 다층적 의미를 지닌다. 박경리는 토지를 둘러싼 소유와 상실의 서사를 통해 근대 이행기 한국 사회의 구조적 변동을 개인의 구체적인 삶 속에 체현시키는 서사적 전략을 구사하였다."
    },
    {
      id: "p2",
      text: "『토지』의 서사적 중심에는 최서희라는 인물이 놓여 있다. 어린 나이에 가문의 몰락을 경험한 서희는 빼앗긴 토지를 되찾겠다는 집념으로 성장하며, 이 과정에서 전통적 여성상을 벗어난 능동적이고 전략적인 주체로 형상화된다. 서희의 토지 회복 서사는 단순한 재산 탈환의 이야기가 아니라 식민지 상황에서 빼앗긴 것을 되찾으려는 민족적 의지의 알레고리로 읽힌다. 그러나 박경리는 서희를 이상화된 영웅으로 그리지 않고, 집착이 관계를 파괴하는 양상과 소유욕이 인간성을 잠식하는 과정을 함께 보여줌으로써 인물의 입체적 복잡성을 확보하였다. 이러한 서사적 균형은 특정 인물이나 이념에 대한 단순한 찬양을 거부하는 작가의 리얼리즘적 태도에서 비롯된 것이다."
    },
    {
      id: "p3",
      text: "이 소설의 또 다른 중요한 특징은 민중적 삶의 총체적 재현에 있다. 박경리는 양반 지주 계층뿐 아니라 소작농, 머슴, 장돌뱅이, 기생, 독립운동가 등 사회의 다양한 계층을 서사 안으로 끌어들이며, 각 인물에게 고유한 목소리와 세계관을 부여하였다. 평사리의 농경 생활에서 나타나는 노동의 리듬, 세시풍속, 구전 문화, 음식 문화 등에 대한 세밀한 묘사는 단순한 배경 설정을 넘어 민중의 삶 자체를 서사의 핵심 질료로 격상시킨다. 이러한 민속지적 서술은 사라져 가는 전통적 공동체의 생활 양식을 문학적으로 아카이빙하는 기능을 수행하며, 이를 통해 『토지』는 소설이면서 동시에 하나의 귀중한 문화적 기록물로서의 가치를 획득하게 된다."
    },
    {
      id: "p4",
      text: "『토지』가 한국 문학사에서 차지하는 위상은 그 규모와 깊이 모두에서 비교 대상을 찾기 어려울 만큼 독보적이다. 전체 5부 16권에 달하는 방대한 분량은 톨스토이의 『전쟁과 평화』나 토마스 만의 『부덴브로크 가의 사람들』과 같은 세계 대하소설의 전통과 어깨를 나란히 하면서도, 한국적 역사 경험의 고유한 결을 담아내고 있다는 점에서 차별화된다. 박경리의 문장은 서정적 감수성과 서사적 추동력을 동시에 갖추고 있어, 장대한 역사적 격변을 서술하면서도 개인의 내밀한 감정의 떨림을 놓치지 않는다. 이 작품은 한국 소설이 도달할 수 있는 서사적 규모와 인문학적 깊이의 최대치를 보여주며, 문학이 한 민족의 역사와 정체성을 어떻게 총체적으로 형상화할 수 있는지에 대한 살아 있는 증거로 남아 있다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 28 지문 길이: ${len}자`);

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
          prompt: "하이라이트된 문장에서 『토지』의 집필 기간과 시대적 배경으로 적절한 것은?",
          choices: [
            { id: "A", text: "25년에 걸쳐 완성되었으며, 구한말에서 해방까지를 다루고 있다" },
            { id: "B", text: "10년간 집필되었으며, 한국전쟁 이후의 근현대사를 배경으로 한다" },
            { id: "C", text: "5년간 집필되었으며, 일제 강점기 후반만을 다루고 있다" },
            { id: "D", text: "30년에 걸쳐 완성되었으며, 조선 시대 전체를 배경으로 한다" }
          ],
          answerId: "A"
        };
      } else if (pi === 0 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 '토지'가 지니는 다층적 의미에 해당하지 않는 것은?",
          choices: [
            { id: "A", text: "인간 존재의 근원적 기반으로서의 의미를 지닌다" },
            { id: "B", text: "역사적 수탈과 저항의 대상으로서의 의미를 지닌다" },
            { id: "C", text: "공동체 정체성의 상징으로서의 의미를 지닌다" },
            { id: "D", text: "근대적 산업 발전의 원동력으로서의 의미를 지닌다" }
          ],
          answerId: "D"
        };
      } else if (pi === 1 && si === 1) {
        question = {
          prompt: "하이라이트된 문장에서 서희의 성격적 특징으로 가장 적절한 것은?",
          choices: [
            { id: "A", text: "전통적 여성상을 벗어난 능동적이고 전략적인 주체로 형상화된다" },
            { id: "B", text: "수동적이고 순종적인 전통적 여성상을 충실히 재현한다" },
            { id: "C", text: "현실을 도피하여 이상적 세계를 꿈꾸는 낭만적 인물이다" },
            { id: "D", text: "가문의 전통을 무비판적으로 수용하는 보수적 인물이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 서희의 토지 회복 서사가 지닌 알레고리적 의미로 적절한 것은?",
          choices: [
            { id: "A", text: "식민지 상황에서 빼앗긴 것을 되찾으려는 민족적 의지의 알레고리이다" },
            { id: "B", text: "자본주의 체제에서 경제적 성공을 이루는 입신양명의 서사이다" },
            { id: "C", text: "전통적 가부장제의 복원을 지향하는 보수적 가치관의 표현이다" },
            { id: "D", text: "계급 갈등을 혁명적으로 해소하려는 사회주의적 이상의 형상화이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 이 소설의 또 다른 특징으로 제시된 것은?",
          choices: [
            { id: "A", text: "민중적 삶의 총체적 재현이라는 특징을 지닌다" },
            { id: "B", text: "특정 계층의 내면 심리를 집중적으로 탐구한다" },
            { id: "C", text: "환상적 요소를 도입하여 현실을 초월한 서사를 구축한다" },
            { id: "D", text: "단일한 시점으로 일관된 서술 구조를 유지한다" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 3) {
        question = {
          prompt: "하이라이트된 문장에서 민속지적 서술이 수행하는 기능으로 적절한 것은?",
          choices: [
            { id: "A", text: "사라져 가는 전통적 공동체의 생활 양식을 문학적으로 아카이빙한다" },
            { id: "B", text: "현대 도시 문명의 발전 과정을 기록하는 역할을 한다" },
            { id: "C", text: "외래 문화의 유입 과정을 비판적으로 추적하는 기능을 한다" },
            { id: "D", text: "미래 사회에 대한 전망을 제시하는 예언적 기능을 수행한다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 『토지』의 한국 문학사적 위상에 대한 평가로 적절한 것은?",
          choices: [
            { id: "A", text: "규모와 깊이 모두에서 비교 대상을 찾기 어려울 만큼 독보적이다" },
            { id: "B", text: "문학적 실험성에서는 뛰어나지만 대중성은 부족한 작품이다" },
            { id: "C", text: "세계 문학의 영향을 받았으나 한국적 특수성은 부족하다" },
            { id: "D", text: "분량은 방대하지만 서사의 깊이에서는 한계를 보인다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 3) {
        question = {
          prompt: "하이라이트된 문장에서 이 작품이 보여주는 궁극적 성취로 적절한 것은?",
          choices: [
            { id: "A", text: "한국 소설이 도달할 수 있는 서사적 규모와 인문학적 깊이의 최대치를 보여준다" },
            { id: "B", text: "한국 문학이 서양 문학의 기법을 성공적으로 모방할 수 있음을 보여준다" },
            { id: "C", text: "개인의 내면 심리만을 집중적으로 파고드는 미시적 서사의 극치를 보여준다" },
            { id: "D", text: "특정 이념을 옹호하는 목적 문학의 가장 세련된 형태를 보여준다" }
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
      "『토지』의 시공간적 배경과 토지가 지닌 다층적 상징 의미",
      "최서희를 통해 드러나는 민족적 의지의 알레고리와 인물의 입체적 복잡성",
      "다양한 계층의 삶을 재현하는 민속지적 서술과 문화적 기록물로서의 가치",
      "세계 대하소설 전통과의 비교를 통한 『토지』의 독보적 문학사적 위상"
    ];
    const wrongThemes = [
      "이광수의 계몽주의적 문학관과 근대 소설의 형성 과정",
      "1970년대 산업화 시기 노동 문학의 전개와 사회적 기능",
      "한국 전쟁 문학에 나타난 트라우마 서사의 양상과 특징"
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
      prompt: "이 작품의 서사가 시작되는 중심 공간의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "평사리")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "서사의 중심 가문의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "최참판댁")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "서희가 평생의 목표로 삼은 행위는 무엇으로 표현되어 있는가?",
      answerRanges: [findRange(paragraphs, "p2", "토지를 되찾겠다는")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "작가가 서희를 통해 보여준 소유욕의 부정적 측면은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "인간성을 잠식하는")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "전통적 공동체의 생활 양식을 기록하는 서술 방식을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p3", "민속지적")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "『토지』와 비교되는 세계 대하소설 중 톨스토이의 작품 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "전쟁과 평화")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(28, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 29: 비문학 (NONFICTION, 홀수) ──
function buildDay29() {
  const paragraphs = [
    {
      id: "p1",
      text: "도시 계획에서 교통 혼잡을 해소하기 위한 전통적 접근 방식은 도로를 확장하거나 새로운 도로를 건설하는 것이었다. 그러나 이러한 공급 확대 전략이 오히려 교통량을 증가시키는 역설적 현상이 반복적으로 관찰되면서, 경제학자들은 이를 유발 수요라는 개념으로 설명하기 시작하였다. 유발 수요란 교통 인프라의 공급이 증가하면 운전 비용이 감소하고, 이에 따라 기존에 억제되어 있던 잠재적 교통 수요가 현실화되어 결국 교통량이 원래 수준으로 회귀하거나 오히려 증가하는 현상을 가리킨다. 미국의 교통경제학자 더니스 러와 매슈 터너는 대도시 데이터를 분석하여 도로 용량이 10퍼센트 증가하면 차량 이동 거리도 거의 10퍼센트 증가한다는 일대일 대응 관계를 실증적으로 확인하였다."
    },
    {
      id: "p2",
      text: "유발 수요가 발생하는 메커니즘은 여러 경로를 통해 작동한다. 도로 확장으로 통행 시간이 단축되면 기존에 대중교통이나 우회 경로를 이용하던 통근자들이 새로운 도로로 전환하는 경로 전환 효과가 나타나고, 이전에는 혼잡이 두려워 자제하던 통행을 새롭게 시작하는 유발 통행 효과도 발생한다. 나아가 장기적으로는 도로 접근성이 향상된 지역에 주거지와 상업 시설이 새로 입지하면서 도시 구조 자체가 자동차 의존적으로 재편되는 토지 이용 변화 효과까지 나타난다. 이 세 가지 경로가 중첩되면서 도로 확장의 혼잡 완화 효과는 수년 내에 상쇄되며, 최종적으로는 더 넓은 도로 위에서 이전과 동일한 수준의 정체가 재현되는 결과에 도달한다."
    },
    {
      id: "p3",
      text: "유발 수요의 존재는 도시 교통 정책의 패러다임 전환을 촉구한다. 공급 확대가 근본적 해결책이 될 수 없다면, 수요 관리 중심의 접근이 필수적이라는 인식이 확산되면서 혼잡 통행료 제도가 주목받기 시작하였다. 런던은 2003년에 도심 혼잡 통행료를 도입하여 부과 구역 내 교통량을 약 30퍼센트 감소시키는 데 성공하였고, 스톡홀름은 2006년 시범 시행 후 주민 투표를 거쳐 정식 도입함으로써 시민적 합의에 기반한 교통 정책의 모범 사례를 만들었다. 싱가포르는 1975년이라는 이른 시기에 세계 최초로 도심 진입 요금 제도를 시행하여 장기적으로 대중교통 중심의 도시 구조를 확립하는 데 기여하였다."
    },
    {
      id: "p4",
      text: "그러나 수요 관리 정책은 형평성의 문제를 수반한다. 혼잡 통행료는 소득 수준에 관계없이 동일한 금액을 부과하기 때문에, 저소득층에게는 사실상 이동의 자유를 제약하는 역진적 부담으로 작용할 수 있다. 이에 대해 일부 도시에서는 저소득층에 대한 요금 감면 제도를 운영하거나 혼잡 통행료 수입 전액을 대중교통 인프라에 재투자하여 대안적 이동 수단의 질을 향상시키는 보완 전략을 시행하고 있다. 궁극적으로는 대중교통, 자전거, 보행 등 다양한 이동 수단이 유기적으로 연결된 복합 교통 체계를 구축함으로써 자동차 의존도를 구조적으로 낮추는 것이 지속 가능한 도시 교통의 방향으로 제시되고 있다. 유발 수요 개념은 도로 건설이라는 직관적 해법의 한계를 드러냄으로써, 교통 문제를 도시 구조와 사회적 형평성의 맥락에서 통합적으로 사유해야 한다는 인식을 확산시키고 있다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 29 지문 길이: ${len}자`);

  const timeline = [];
  let stepNum = 0;

  paragraphs.forEach((para, pi) => {
    const sents = findSentences(para.text);
    sents.forEach((sent, si) => {
      stepNum++;
      const range = { paragraphId: para.id, start: sent.start, end: sent.end };
      let question;

      if (pi === 0 && si === 1) {
        question = {
          prompt: "하이라이트된 문장에서 도로 확장이 초래하는 역설적 현상을 설명하는 개념은 무엇인가?",
          choices: [
            { id: "A", text: "유발 수요라는 개념으로 설명되기 시작하였다" },
            { id: "B", text: "공급 과잉이라는 경제 원리로 해석되기 시작하였다" },
            { id: "C", text: "수확 체감의 법칙으로 설명되기 시작하였다" },
            { id: "D", text: "외부 효과라는 시장 실패 개념으로 분석되기 시작하였다" }
          ],
          answerId: "A"
        };
      } else if (pi === 0 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 유발 수요의 정의로 가장 적절한 것은?",
          choices: [
            { id: "A", text: "인프라 공급 증가로 잠재적 수요가 현실화되어 교통량이 증가하는 현상이다" },
            { id: "B", text: "경제 성장에 따라 자동차 보유 대수가 자연스럽게 증가하는 현상이다" },
            { id: "C", text: "대중교통 요금 인상으로 자가용 이용이 늘어나는 대체 효과이다" },
            { id: "D", text: "도심 인구 감소에 따라 교외 교통량이 증가하는 분산 효과이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 유발 수요의 첫 번째 작동 경로로 제시된 것은?",
          choices: [
            { id: "A", text: "기존 통근자들이 새로운 도로로 전환하는 경로 전환 효과이다" },
            { id: "B", text: "신규 주거지 입지에 따른 토지 이용 변화 효과이다" },
            { id: "C", text: "대중교통 노선의 축소로 인한 강제적 전환 효과이다" },
            { id: "D", text: "유류비 하락에 따른 경제적 유인 효과이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 도시 구조가 자동차 의존적으로 재편되는 현상을 무엇이라 하는가?",
          choices: [
            { id: "A", text: "토지 이용 변화 효과라고 한다" },
            { id: "B", text: "유발 통행 효과라고 한다" },
            { id: "C", text: "경로 전환 효과라고 한다" },
            { id: "D", text: "혼잡 심화 효과라고 한다" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 1) {
        question = {
          prompt: "하이라이트된 문장에서 런던의 혼잡 통행료 도입 성과로 제시된 수치는?",
          choices: [
            { id: "A", text: "부과 구역 내 교통량을 약 30퍼센트 감소시켰다" },
            { id: "B", text: "도심 전체의 교통량을 약 50퍼센트 감소시켰다" },
            { id: "C", text: "대중교통 이용률을 약 20퍼센트 증가시켰다" },
            { id: "D", text: "자동차 등록 대수를 약 15퍼센트 감소시켰다" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 3) {
        question = {
          prompt: "하이라이트된 문장에서 세계 최초로 도심 진입 요금 제도를 시행한 도시는?",
          choices: [
            { id: "A", text: "싱가포르가 1975년에 시행하였다" },
            { id: "B", text: "런던이 2003년에 시행하였다" },
            { id: "C", text: "스톡홀름이 2006년에 시행하였다" },
            { id: "D", text: "뉴욕이 1990년에 시행하였다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 1) {
        question = {
          prompt: "하이라이트된 문장에서 혼잡 통행료가 저소득층에게 미치는 부정적 영향으로 적절한 것은?",
          choices: [
            { id: "A", text: "이동의 자유를 제약하는 역진적 부담으로 작용할 수 있다" },
            { id: "B", text: "대중교통 이용을 강제하여 통근 시간이 단축된다" },
            { id: "C", text: "주거지 선택의 폭이 넓어져 도시 외곽으로 이주하게 된다" },
            { id: "D", text: "자동차 구매를 촉진하여 가계 부채가 증가하게 된다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 4) {
        question = {
          prompt: "하이라이트된 문장에서 유발 수요 개념이 확산시킨 인식으로 적절한 것은?",
          choices: [
            { id: "A", text: "교통 문제를 도시 구조와 사회적 형평성의 맥락에서 통합적으로 사유해야 한다" },
            { id: "B", text: "도로 건설이 모든 교통 문제의 궁극적 해결책이 될 수 있다" },
            { id: "C", text: "자동차 산업의 발전이 도시 교통의 핵심 과제가 되어야 한다" },
            { id: "D", text: "교통 정책은 경제 성장보다 환경 보호를 우선시해야 한다" }
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
      "유발 수요의 정의와 도로 확장이 교통량을 증가시키는 역설의 실증",
      "경로 전환·유발 통행·토지 이용 변화라는 유발 수요의 세 가지 작동 경로",
      "혼잡 통행료를 중심으로 한 수요 관리 정책의 국제 사례",
      "수요 관리 정책의 형평성 문제와 복합 교통 체계를 통한 지속 가능한 방향"
    ];
    const wrongThemes = [
      "신재생 에너지의 종류와 발전 효율성 비교",
      "도시 열섬 현상의 원인과 녹지 조성 정책의 효과",
      "글로벌 공급망의 구조적 취약성과 리쇼어링 전략"
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
      prompt: "도로 확장이 오히려 교통량을 증가시키는 현상을 설명하는 경제학적 개념은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "유발 수요")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "기존 통근자들이 새로운 도로로 이동하는 현상을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "경로 전환")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "2003년에 도심 혼잡 통행료를 도입하여 교통량을 감소시킨 도시는 어디인가?",
      answerRanges: [findRange(paragraphs, "p3", "런던")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "세계 최초로 도심 진입 요금 제도를 시행한 도시는 어디인가?",
      answerRanges: [findRange(paragraphs, "p3", "싱가포르")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "혼잡 통행료가 저소득층에게 미치는 부정적 영향을 어떤 종류의 부담이라 하였는가?",
      answerRanges: [findRange(paragraphs, "p4", "역진적")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "지속 가능한 도시 교통의 방향으로 제시된 체계의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "복합 교통 체계")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(29, "NONFICTION", paragraphs, timeline, cards, confirmQuestions);
}

// ── Day 30: 문학 (LITERATURE, 짝수) ──
function buildDay30() {
  const paragraphs = [
    {
      id: "p1",
      text: "채만식의 소설 「태평천하」는 1938년에 발표된 풍자 소설로, 일제 강점기 한국 사회의 부패한 지배층을 희극적 어조로 신랄하게 비판한 대표적인 작품이다. 소설의 중심인물인 윤직원 영감은 막대한 토지를 소유한 대지주이자 고리대금업자로, 그의 최대 관심사는 오직 재산의 보전과 증식에만 집중되어 있다. 윤직원은 식민지 현실에 대한 어떠한 역사적 자각도 없이 일본 제국의 질서를 무비판적으로 수용하며, 그 질서 속에서 자신의 경제적 이익이 안전하게 유지되는 것만을 태평으로 인식한다. 작가 채만식은 이러한 인물을 통해 민족의 위기 속에서도 사적 이익만을 추구하는 기득권층의 도덕적 파산을 적나라하게 폭로한다."
    },
    {
      id: "p2",
      text: "이 소설에서 가장 주목해야 할 서술 기법은 아이러니의 다층적 활용이다. 서술자는 윤직원의 언행을 마치 긍정적으로 평가하는 듯한 어조로 서술하면서도, 실제로는 그 언행의 어리석음과 비열함을 독자에게 선명하게 드러내는 표면과 이면의 괴리를 지속적으로 만들어낸다. 윤직원이 자신의 재산 관리 능력을 자랑하는 장면에서 서술자의 어조는 찬탄의 형식을 취하지만, 그 재산이 소작농에 대한 착취와 고리대금을 통해 축적된 것임을 동시에 노출시킴으로써 독자는 표면적 의미와 실제 의미 사이의 극적인 간극을 체험하게 된다. 이러한 아이러니적 서술은 독자에게 비판적 거리를 확보하게 하여 텍스트를 능동적으로 해석하도록 유도하는 수사적 효과를 발휘한다."
    },
    {
      id: "p3",
      text: "윤직원의 후손들은 그의 가치관이 세대를 거쳐 전이되면서 더욱 퇴행적으로 변형되는 양상을 보여준다. 아들 윤창식은 기생과 방탕한 생활에 몰두하며 아버지의 재산을 탕진하고, 손자 종수는 사회주의 운동에 가담하여 투옥되는데, 이 두 후손의 행적은 표면적으로는 정반대이지만 실제로는 모두 윤직원의 물질 만능주의가 낳은 정신적 공백의 산물이라는 점에서 동일한 근원을 공유한다. 아들의 탕진은 물질적 풍요가 낳은 허무의 결과이고, 손자의 급진적 전향은 아버지 세대의 무위에 대한 과잉 반동이다. 채만식은 이 세대 간 연쇄를 통해 식민지 지배층의 붕괴가 외부의 힘이 아닌 내부의 자기 해체에 의해 진행됨을 보여주며, 풍자의 초점을 개인에서 계층 전체의 역사적 운명으로 확대한다."
    },
    {
      id: "p4",
      text: "「태평천하」의 제목 자체가 이 작품의 풍자적 전략을 집약적으로 드러낸다. 태평이라는 말은 평화롭고 안정된 세상을 의미하지만, 소설이 그려내는 세계는 식민지 수탈과 계급 착취가 만연한 현실이므로 제목과 내용 사이에는 첨예한 모순이 존재한다. 이 모순은 윤직원과 같은 인물이 자신의 안위만이 보장되면 세상이 태평하다고 착각하는 자기기만의 구조를 정확히 반영하는 것이다. 채만식의 풍자가 지닌 힘은 직접적인 분노나 비난이 아니라 웃음을 통해 대상의 본질을 드러내는 간접적 전략에 있으며, 이는 독자로 하여금 비판적 성찰에 능동적으로 참여하게 하는 효과를 발휘한다. 이러한 풍자 정신은 한국 근대문학에서 현실 비판의 중요한 한 갈래를 형성하며, 이 작품은 그 전통의 가장 대표적인 성취로 평가받고 있다."
    }
  ];

  const len = totalLength(paragraphs);
  console.log(`Day 30 지문 길이: ${len}자`);

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
          prompt: "하이라이트된 문장에서 「태평천하」의 장르적 성격으로 가장 적절한 것은?",
          choices: [
            { id: "A", text: "부패한 지배층을 희극적 어조로 비판한 풍자 소설이다" },
            { id: "B", text: "식민지 민중의 저항 의식을 사실적으로 그린 리얼리즘 소설이다" },
            { id: "C", text: "전원적 삶의 아름다움을 서정적으로 묘사한 전원 소설이다" },
            { id: "D", text: "과학적 상상력을 바탕으로 미래 사회를 그린 실험 소설이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 0 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 윤직원이 '태평'으로 인식하는 상태의 본질은 무엇인가?",
          choices: [
            { id: "A", text: "식민지 질서 속에서 자신의 경제적 이익이 유지되는 것을 뜻한다" },
            { id: "B", text: "조선의 독립이 평화적 방식으로 달성되는 것을 뜻한다" },
            { id: "C", text: "전통적 유교 질서가 회복되어 사회가 안정되는 것을 뜻한다" },
            { id: "D", text: "일본 제국의 패망으로 해방이 도래하는 것을 뜻한다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 0) {
        question = {
          prompt: "하이라이트된 문장에서 이 소설의 핵심 서술 기법으로 제시된 것은?",
          choices: [
            { id: "A", text: "아이러니의 다층적 활용이다" },
            { id: "B", text: "의식의 흐름 기법의 본격적 구사이다" },
            { id: "C", text: "서간체 형식을 활용한 내면 고백이다" },
            { id: "D", text: "다중 시점의 교차를 통한 서사 구축이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 1 && si === 3) {
        question = {
          prompt: "하이라이트된 문장에서 아이러니적 서술이 독자에게 미치는 효과로 적절한 것은?",
          choices: [
            { id: "A", text: "비판적 거리를 확보하여 텍스트를 능동적으로 해석하도록 유도한다" },
            { id: "B", text: "인물에 대한 깊은 공감과 동정을 불러일으킨다" },
            { id: "C", text: "서사의 긴장감을 높여 독자를 몰입하게 만든다" },
            { id: "D", text: "작가의 의도를 명시적으로 전달하여 해석의 여지를 줄인다" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 두 후손의 행적이 공유하는 근원으로 적절한 것은?",
          choices: [
            { id: "A", text: "윤직원의 물질 만능주의가 낳은 정신적 공백의 산물이라는 점이다" },
            { id: "B", text: "식민지 교육 제도가 양산한 지적 빈곤의 결과라는 점이다" },
            { id: "C", text: "일본 문화의 무비판적 수용이 가져온 정체성 혼란이라는 점이다" },
            { id: "D", text: "농촌 공동체의 해체로 인한 전통적 가치관의 상실이라는 점이다" }
          ],
          answerId: "A"
        };
      } else if (pi === 2 && si === 4) {
        question = {
          prompt: "하이라이트된 문장에서 채만식이 세대 간 연쇄를 통해 보여주는 것은?",
          choices: [
            { id: "A", text: "식민지 지배층의 붕괴가 내부의 자기 해체에 의해 진행됨을 보여준다" },
            { id: "B", text: "외부 세력의 침탈이 가문 몰락의 직접적 원인임을 보여준다" },
            { id: "C", text: "세대 간 가치관의 성공적 전승이 가문 유지의 핵심임을 보여준다" },
            { id: "D", text: "사회주의 운동이 식민지 해방의 유일한 경로임을 보여준다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 2) {
        question = {
          prompt: "하이라이트된 문장에서 제목과 내용의 모순이 반영하는 구조는 무엇인가?",
          choices: [
            { id: "A", text: "자신의 안위만 보장되면 세상이 태평하다고 착각하는 자기기만의 구조이다" },
            { id: "B", text: "식민지 조선 전체가 실제로 평화로운 시기를 누리고 있다는 인식이다" },
            { id: "C", text: "작가가 미래의 해방을 낙관적으로 전망하고 있다는 의미이다" },
            { id: "D", text: "주인공이 현실의 모순을 자각하고 변혁을 꿈꾸는 과정을 반영한다" }
          ],
          answerId: "A"
        };
      } else if (pi === 3 && si === 3) {
        question = {
          prompt: "하이라이트된 문장에서 채만식의 풍자가 대상의 본질을 드러내는 방식으로 적절한 것은?",
          choices: [
            { id: "A", text: "직접적 비난이 아닌 웃음을 통한 간접적 전략을 사용한다" },
            { id: "B", text: "역사적 사실의 객관적 나열을 통해 판단을 독자에게 맡긴다" },
            { id: "C", text: "감정적 호소와 격렬한 어조로 독자의 분노를 촉발한다" },
            { id: "D", text: "상징과 비유를 배제하고 직설적 서술에 의존한다" }
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
      "윤직원 영감을 통한 식민지 기득권층의 도덕적 파산 폭로",
      "아이러니적 서술을 통한 표면과 이면의 괴리 구현과 비판적 거리 확보",
      "후손들의 퇴행적 변형을 통한 지배층 내부 자기 해체의 서사",
      "제목의 풍자적 전략과 웃음을 통한 간접적 현실 비판의 문학적 성취"
    ];
    const wrongThemes = [
      "김동인 소설에 나타나는 유미주의적 경향과 예술 지상주의",
      "1930년대 모더니즘 시 운동의 전개와 이미지즘적 특성",
      "염상섭의 리얼리즘 소설에 드러나는 중산층의 세태 묘사"
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
      prompt: "윤직원의 주된 경제 활동으로 언급되는 직업은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "고리대금업자")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "서술자가 표면과 이면의 괴리를 만들어내는 핵심 서술 기법의 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "아이러니")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "윤직원의 아들 이름은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "윤창식")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "손자 종수가 가담하여 투옥된 운동은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "사회주의 운동")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "채만식의 풍자가 대상의 본질을 드러내는 간접적 수단은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "웃음")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "윤직원이 자신의 안위만 보장되면 세상이 태평하다고 느끼는 심리 구조를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "자기기만")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  return buildContent(30, "LITERATURE", paragraphs, timeline, cards, confirmQuestions);
}

// ── 메인 실행 ──
function main() {
  console.log('=== 비트겐슈타인2 Day 26~30 콘텐츠 빌드 시작 ===\n');

  const items = [
    buildDay26(),
    buildDay27(),
    buildDay28(),
    buildDay29(),
    buildDay30()
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

  // items[25]~[29] 교체 (Day 26~30은 0-indexed 25~29)
  for (let i = 0; i < 5; i++) {
    const targetIdx = 25 + i;
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
