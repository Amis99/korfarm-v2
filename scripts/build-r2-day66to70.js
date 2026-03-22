/**
 * 러셀2(RUSSELL_2) Day 66~70 일일독해 콘텐츠 빌더
 * - Day 66: 문학(LITERATURE), Day 67: 비문학(NONFICTION)
 * - Day 68: 문학(LITERATURE), Day 69: 비문학(NONFICTION)
 * - Day 70: 문학(LITERATURE)
 * - 목표 길이: 1200자 ±50 (1150~1250)
 * - schoolGradeRange: { min: 8, max: 9 }
 * - timeLimitSec: 480
 * - 복기 카드: 정확히 8장
 * - 확인 문항: 5~8문항, 질문형, answerMatchMode: "ANY", revealOnWrong: true
 */

const fs = require('fs');
const path = require('path');

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
  if (!para) throw new Error(`단락 ${pid}를 찾을 수 없음`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText.substring(0, 30)}..." not found in ${pid}`);
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
  return text.substring(0, maxLen - 3) + '...';
}

function shuffleChoices(choices, answerId, seed) {
  const rng = hashIdx(seed + answerId);
  const arr = [...choices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (rng + i * 31) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── 콘텐츠 골격 생성 ───

function assembleFull(dayIndex, subArea, contentId, title, paragraphs, timeline, recallCards, confirmQuestions) {
  const subAreaKo = subArea === "LITERATURE" ? "문학" : "비문학";
  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "RUSSELL_2",
    schoolGradeRange: { min: 8, max: 9 },
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
      recall: recallCards,
      confirm: { questions: confirmQuestions }
    }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return {
    content_type: "DAILY_READING",
    level_id: "RUSSELL_2",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content
  };
}

// 정독 스코어링
const intensiveScoring = { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true };
// 확인 스코어링
const confirmScoring = { correctDeltaSec: 30, wrongDeltaSec: -45 };

// 정독 타임라인 빌드
function buildTimeline(paragraphs, steps) {
  const timeline = [];
  let stepNum = 1;
  for (const step of steps) {
    const ranges = step.ranges.map(r => {
      if (r.full) {
        const para = paragraphs.find(p => p.id === r.pid);
        return { paragraphId: r.pid, start: 0, end: para.text.length };
      }
      return findRange(paragraphs, r.pid, r.text);
    });
    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges },
      question: {
        prompt: step.prompt,
        choices: step.choices,
        answerId: step.answerId,
        scoring: intensiveScoring
      }
    });
  }
  return timeline;
}

// 복기 카드 8장 생성
function buildRecallCards(paragraphs) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / 8);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    cards.push({
      id: `c${i + 1}`,
      text: fullText.substring(start, end)
    });
  }
  return {
    cards,
    correctOrder: cards.map(c => c.id),
    seedPenalty: 1
  };
}


// ════════════════════════════════════════════════════════════════
// Day 66 — 문학(LITERATURE): 현대 소설 — 방학의 끝
// ════════════════════════════════════════════════════════════════

function buildDay66() {
  const paragraphs = [
    {
      id: "p1",
      text: "여름 방학의 마지막 날, 진호는 텅 빈 교실에 혼자 앉아 있었다. 책상 위에는 다 쓴 일기장 한 권과 반쯤 깎인 연필 한 자루가 놓여 있었다. 창밖에서는 매미가 울고 있었지만, 그 소리는 이미 한여름의 기세를 잃고 가늘어져 있었다. 진호는 일기장의 첫 장을 펼쳤다. 방학 첫날, 아버지와 바다에 가겠다고 적은 글이 보였다. 결국 그 약속은 지켜지지 않았다. 아버지는 공장의 야근에 묶여 주말에도 집에 돌아오지 못했고, 진호는 혼자 동네 도서관에서 여름을 보냈다. 그래도 진호는 아버지를 원망하지 않았다. 아버지의 일이 가족의 생계와 직결된다는 것을 알고 있었기 때문이다."
    },
    {
      id: "p2",
      text: "도서관에서 진호는 매일 같은 자리에 앉아 책을 읽었다. 처음에는 만화책만 뒤적이다가 점차 소설과 과학 도서로 관심이 옮겨 갔다. 특히 바다를 배경으로 한 모험 소설에 빠져들었는데, 책 속의 주인공이 거친 파도와 싸우며 미지의 섬을 향해 나아가는 장면에서 가슴이 뛰었다. 진호는 책을 읽을 때만큼은 공장 굴뚝 너머의 세계로 떠날 수 있었다. 사서 선생님은 진호에게 새로 들어온 책을 가장 먼저 보여 주곤 했고, 가끔은 간식을 건네며 격려해 주었다. 도서관의 에어컨 바람과 낡은 책 냄새, 그리고 사서 선생님의 따뜻한 미소가 진호의 여름을 채운 전부였다."
    },
    {
      id: "p3",
      text: "방학이 끝나기 이틀 전, 아버지가 일찍 퇴근했다. 현관문이 열리는 소리에 진호가 달려 나가자, 아버지는 손에 종이 봉투를 들고 있었다. 봉투 안에는 조개껍데기 목걸이 하나와 바다 사진이 인쇄된 엽서가 들어 있었다. 아버지는 공장 동료에게 부탁해 바닷가에서 구해 온 것이라고 했다. 진호는 목걸이를 만지작거리며 바다 냄새가 나는 것 같다고 말했고, 아버지는 멋쩍게 웃었다. 그 웃음 속에는 미안함과 사랑이 뒤섞여 있었다. 진호는 그제야 아버지도 자신만큼이나 바다에 가고 싶었을 것이라는 사실을 깨달았다."
    },
    {
      id: "p4",
      text: "새 학기 첫날, 진호는 조개껍데기 목걸이를 가방에 넣고 학교로 향했다. 친구들은 저마다 여행 이야기를 늘어놓았지만, 진호는 조용히 미소만 지었다. 진호에게 이번 여름은 아버지와 바다에 가지 못한 방학이 아니라, 도서관에서 수백 개의 바다를 만난 방학이었다. 그리고 아버지가 건넨 조개껍데기 하나가 어떤 여행보다 깊은 감동을 주었다는 것을 알고 있었다. 진호는 수업이 시작되기 전 일기장의 마지막 페이지에 이렇게 적었다. 올여름, 나는 바다에 가지 않았지만 바다를 알게 되었다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 66 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "여름 방학의 마지막 날, 진호는 텅 빈 교실에 혼자 앉아 있었다." }],
      prompt: "첫 문장이 독자에게 주는 인상으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "방학이 끝나는 시점에서 혼자 남은 인물의 쓸쓸한 분위기를 조성한다." },
        { id: "B", text: "새 학기에 대한 기대감을 밝고 경쾌하게 표현하고 있다." },
        { id: "C", text: "여름 방학이 즐거웠음을 회상하는 행복한 장면을 보여 준다." },
        { id: "D", text: "교실에서 수업이 진행 중인 평범한 학교 일상을 묘사한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "아버지는 공장의 야근에 묶여 주말에도 집에 돌아오지 못했고, 진호는 혼자 동네 도서관에서 여름을 보냈다." }],
      prompt: "이 문장에서 드러나는 가정의 상황으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "아버지의 과중한 노동으로 인해 가족 간의 약속이 지켜지지 못하는 현실이다." },
        { id: "B", text: "진호가 도서관에서 아르바이트를 하며 용돈을 벌고 있다." },
        { id: "C", text: "아버지가 출장을 자주 가서 여행의 기회가 많은 가정이다." },
        { id: "D", text: "진호가 자발적으로 여행을 거부하고 혼자 있기를 원하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "방학 마지막 날 진호가 지켜지지 못한 약속을 돌아보는 상황을 보여 준다." },
        { id: "B", text: "진호가 아버지와 함께 바다에 다녀온 즐거운 추억을 서술한다." },
        { id: "C", text: "공장에서 일하는 아버지의 하루 일과를 자세히 묘사하고 있다." },
        { id: "D", text: "진호가 새 학기를 준비하며 학용품을 사는 장면을 그린다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "책 속의 주인공이 거친 파도와 싸우며 미지의 섬을 향해 나아가는 장면에서 가슴이 뛰었다." }],
      prompt: "진호가 모험 소설에 빠져든 이유로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "현실에서 갈 수 없는 바다를 책을 통해 간접적으로 경험할 수 있었기 때문이다." },
        { id: "B", text: "학교 숙제로 독후감을 써야 해서 억지로 읽었기 때문이다." },
        { id: "C", text: "사서 선생님이 반드시 읽으라고 강제했기 때문이다." },
        { id: "D", text: "친구들과 내기를 해서 책을 많이 읽어야 했기 때문이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "도서관의 에어컨 바람과 낡은 책 냄새, 그리고 사서 선생님의 따뜻한 미소가 진호의 여름을 채운 전부였다." }],
      prompt: "이 문장이 전달하는 분위기로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "소박하지만 따뜻한 것들로 채워진 진호의 여름을 담담하게 보여 준다." },
        { id: "B", text: "도서관 시설이 열악하여 진호가 불만을 느끼고 있음을 나타낸다." },
        { id: "C", text: "화려하고 풍요로운 여름 방학의 풍경을 생동감 있게 묘사한다." },
        { id: "D", text: "사서 선생님에 대한 원망과 서운함을 간접적으로 드러낸다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "진호가 도서관에서 독서를 통해 여름을 의미 있게 보낸 과정이다." },
        { id: "B", text: "진호가 만화책만 읽다가 사서 선생님에게 꾸지람을 듣는 장면이다." },
        { id: "C", text: "도서관의 역사와 건축 양식을 설명하고 있다." },
        { id: "D", text: "진호가 친구들과 도서관에서 장난을 치며 놀고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "봉투 안에는 조개껍데기 목걸이 하나와 바다 사진이 인쇄된 엽서가 들어 있었다." }],
      prompt: "아버지가 가져온 선물이 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "함께 바다에 가지 못한 미안함을 작은 선물로나마 전하려는 아버지의 마음이다." },
        { id: "B", text: "아버지가 혼자 바닷가에 놀러 갔다 온 기념품을 보여 주는 것이다." },
        { id: "C", text: "공장에서 만든 제품을 아들에게 시험 삼아 사용하게 하려는 의도이다." },
        { id: "D", text: "진호의 생일 선물로 미리 준비해 둔 고가의 장신구이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "진호는 그제야 아버지도 자신만큼이나 바다에 가고 싶었을 것이라는 사실을 깨달았다." }],
      prompt: "진호가 이때 깨달은 것으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "아버지 역시 함께 바다에 가고 싶었지만 생계 때문에 참아야 했다는 것이다." },
        { id: "B", text: "아버지가 바다를 싫어해서 일부러 약속을 어긴 것이라는 사실이다." },
        { id: "C", text: "아버지가 곧 공장을 그만두고 바다로 이사할 계획이라는 것이다." },
        { id: "D", text: "바다보다 공장 일이 더 재미있다는 아버지의 진심이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "아버지의 작은 선물을 통해 부자 간의 마음이 통하는 장면이다." },
        { id: "B", text: "아버지가 공장에서 해고되어 집으로 돌아오는 슬픈 이야기이다." },
        { id: "C", text: "진호가 조개껍데기를 싫어하여 아버지와 다투는 장면이다." },
        { id: "D", text: "진호와 아버지가 함께 바닷가 여행을 떠나는 내용이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "올여름, 나는 바다에 가지 않았지만 바다를 알게 되었다." }],
      prompt: "진호의 이 일기 내용이 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "직접 가지 않아도 독서와 아버지의 사랑을 통해 바다의 진정한 의미를 깨달았다는 것이다." },
        { id: "B", text: "인터넷 검색으로 바다에 관한 과학적 지식을 많이 습득했다는 뜻이다." },
        { id: "C", text: "바다에 가지 않은 것을 후회하며 아버지를 원망하는 내용이다." },
        { id: "D", text: "다음 방학에는 반드시 바다에 가겠다는 결심을 표현한 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "진호가 이번 여름의 경험을 긍정적으로 받아들이며 성장한 모습을 보여 준다." },
        { id: "B", text: "친구들이 진호의 여름 방학을 부러워하는 장면을 그린다." },
        { id: "C", text: "진호가 새 학기 수업에 집중하지 못하고 방학을 그리워한다." },
        { id: "D", text: "조개껍데기 목걸이를 잃어버려 슬퍼하는 진호의 모습을 보여 준다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "진호의 아버지가 방학에 함께 가기로 약속한 곳은 어디인가?",
      answerRanges: [findRange(paragraphs, "p1", "바다")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "진호가 여름 방학 동안 주로 시간을 보낸 장소는 어디인가?",
      answerRanges: [findRange(paragraphs, "p1", "동네 도서관")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "진호가 특히 빠져든 소설의 배경은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "바다를 배경으로 한 모험 소설")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "아버지가 가져온 종이 봉투 안에 들어 있던 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "조개껍데기 목걸이 하나와 바다 사진이 인쇄된 엽서")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "새 학기 첫날 진호가 가방에 넣고 간 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "조개껍데기 목걸이")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "진호가 일기장 마지막 페이지에 적은 내용의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "바다에 가지 않았지만 바다를 알게 되었다")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const dayStr = "066";
  return assembleFull(66, "LITERATURE", `dr-r2-${dayStr}`, "일일 독해(러셀 2) Day 66 문학", paragraphs, timeline, buildRecallCards(paragraphs), confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 67 — 비문학(NONFICTION): 미세 플라스틱의 환경 영향
// ════════════════════════════════════════════════════════════════

function buildDay67() {
  const paragraphs = [
    {
      id: "p1",
      text: "미세 플라스틱은 지름이 5밀리미터 이하인 작은 플라스틱 조각을 가리킨다. 이들은 크게 두 가지 경로로 발생한다. 첫째, 화장품이나 세정제에 의도적으로 첨가된 미세한 알갱이, 즉 마이크로비즈가 하수를 통해 바다로 유입된다. 둘째, 페트병이나 비닐봉지 같은 대형 플라스틱 폐기물이 자외선과 파도에 의해 잘게 부서지면서 미세 플라스틱으로 변한다. 한번 바다에 들어간 미세 플라스틱은 자연 분해가 거의 되지 않아 수백 년간 해양 환경에 남아 있게 된다. 최근 연구에 따르면 전 세계 바다에 떠다니는 미세 플라스틱의 양은 수조 개에 이르며, 심해와 극지방의 얼음 속에서도 발견되고 있다."
    },
    {
      id: "p2",
      text: "미세 플라스틱이 해양 생태계에 미치는 영향은 심각하다. 크기가 작아 동물성 플랑크톤이 먹이로 착각하여 삼키며, 이를 먹은 작은 물고기가 큰 물고기에게 잡아먹히면서 먹이 사슬을 따라 미세 플라스틱이 축적된다. 이를 생물 농축이라 하는데, 먹이 사슬의 상위 포식자일수록 체내 미세 플라스틱 농도가 높아진다. 또한 미세 플라스틱의 표면에는 중금속이나 잔류성 유기 오염 물질이 흡착되기 쉬워, 이러한 유해 물질이 생물의 체내에 함께 유입될 수 있다. 바다거북이나 해조류 등 해양 생물의 소화기관에서 미세 플라스틱이 대량 발견된 사례가 보고되면서, 해양 생태계 전반에 대한 우려가 커지고 있다."
    },
    {
      id: "p3",
      text: "미세 플라스틱의 위험은 바다에 국한되지 않는다. 수산물을 통해 인간의 식탁에도 올라올 수 있으며, 최근에는 식수와 공기 중에서도 미세 플라스틱이 검출되고 있다. 연구자들은 사람이 일주일에 신용카드 한 장 분량에 해당하는 약 5그램의 미세 플라스틱을 섭취할 수 있다고 추정한다. 체내에 유입된 미세 플라스틱이 건강에 미치는 구체적 영향은 아직 완전히 규명되지 않았으나, 동물 실험에서는 염증 반응 유발, 내분비계 교란, 면역 기능 저하 등의 가능성이 보고되었다. 이에 따라 세계보건기구와 각국 정부는 미세 플라스틱의 인체 영향에 관한 조사를 추진하고 있다."
    },
    {
      id: "p4",
      text: "미세 플라스틱 문제를 해결하기 위해서는 다각적인 접근이 필요하다. 우선 마이크로비즈 사용을 금지하는 법률이 여러 나라에서 시행되고 있으며, 일회용 플라스틱 제품의 사용을 줄이기 위한 규제도 강화되고 있다. 또한 플라스틱을 대체할 수 있는 생분해성 소재 개발에 대한 연구가 활발히 진행되고 있다. 개인 차원에서는 장바구니와 텀블러 사용, 불필요한 포장재 거부 등의 실천이 중요하다. 궁극적으로 미세 플라스틱 오염은 생산과 소비 구조를 재설계해야 근본적으로 줄일 수 있으며, 과학자, 기업, 정부, 시민의 협력이 요구된다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 67 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "미세 플라스틱은 지름이 5밀리미터 이하인 작은 플라스틱 조각을 가리킨다." }],
      prompt: "미세 플라스틱의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "지름 5밀리미터 이하의 작은 플라스틱 조각이다." },
        { id: "B", text: "눈에 보이지 않는 나노 크기의 금속 물질이다." },
        { id: "C", text: "자연에서 빠르게 분해되는 친환경 소재이다." },
        { id: "D", text: "5센티미터 이상의 대형 플라스틱 폐기물이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "화장품이나 세정제에 의도적으로 첨가된 미세한 알갱이, 즉 마이크로비즈가 하수를 통해 바다로 유입된다." }],
      prompt: "미세 플라스틱 발생의 첫 번째 경로로 언급된 것은?",
      choices: [
        { id: "A", text: "화장품이나 세정제에 첨가된 마이크로비즈가 하수로 유입되는 것이다." },
        { id: "B", text: "공장에서 직접 미세 플라스틱을 바다에 방류하는 것이다." },
        { id: "C", text: "자연에서 광물이 풍화되어 플라스틱과 유사한 물질이 생기는 것이다." },
        { id: "D", text: "해저 화산 활동으로 인해 미세 입자가 생성되는 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "미세 플라스틱의 정의, 발생 경로, 해양 환경에서의 잔존 현황을 설명하고 있다." },
        { id: "B", text: "미세 플라스틱이 인체에 미치는 구체적인 건강 피해를 서술하고 있다." },
        { id: "C", text: "플라스틱 재활용 기술의 발전 과정을 시간순으로 정리하고 있다." },
        { id: "D", text: "미세 플라스틱 문제의 해결 방안을 제시하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "먹이 사슬의 상위 포식자일수록 체내 미세 플라스틱 농도가 높아진다." }],
      prompt: "이 현상을 설명하는 개념으로 적절한 것은?",
      choices: [
        { id: "A", text: "생물 농축으로, 먹이 사슬을 따라 유해 물질이 상위 단계에 축적되는 현상이다." },
        { id: "B", text: "광합성으로, 식물이 빛을 이용해 양분을 만드는 과정이다." },
        { id: "C", text: "자연 선택으로, 환경에 적응한 생물이 살아남는 현상이다." },
        { id: "D", text: "생분해로, 미생물이 플라스틱을 분해하는 과정이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "미세 플라스틱이 먹이 사슬을 통해 해양 생태계 전반에 축적되는 과정을 설명하고 있다." },
        { id: "B", text: "해양 생물의 종 다양성이 증가하고 있다는 긍정적 연구 결과를 소개하고 있다." },
        { id: "C", text: "미세 플라스틱 제거 기술의 최신 성과를 보고하고 있다." },
        { id: "D", text: "바다거북의 생태와 서식 환경을 상세히 묘사하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "사람이 일주일에 신용카드 한 장 분량에 해당하는 약 5그램의 미세 플라스틱을 섭취할 수 있다고 추정한다." }],
      prompt: "인간의 미세 플라스틱 섭취량에 대한 추정치로 언급된 것은?",
      choices: [
        { id: "A", text: "일주일에 약 5그램으로, 신용카드 한 장 분량에 해당한다." },
        { id: "B", text: "하루에 약 50그램으로, 동전 여러 개 분량에 해당한다." },
        { id: "C", text: "한 달에 약 1그램으로, 모래알 하나 정도의 분량이다." },
        { id: "D", text: "일 년에 약 100그램으로, 작은 물병 하나 분량이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "미세 플라스틱이 인체에도 유입되고 있으며 건강 영향에 대한 연구가 진행 중이다." },
        { id: "B", text: "수산물의 영양 성분과 건강에 대한 이점을 설명하고 있다." },
        { id: "C", text: "식수 정화 시설의 종류와 작동 원리를 상세히 서술하고 있다." },
        { id: "D", text: "공기 중 오염 물질의 화학적 구성을 분석하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "마이크로비즈 사용을 금지하는 법률이 여러 나라에서 시행되고 있으며, 일회용 플라스틱 제품의 사용을 줄이기 위한 규제도 강화되고 있다." }],
      prompt: "미세 플라스틱 문제 해결을 위한 정책적 노력으로 언급된 것은?",
      choices: [
        { id: "A", text: "마이크로비즈 사용 금지 법률과 일회용 플라스틱 규제 강화이다." },
        { id: "B", text: "바다에 떠다니는 플라스틱을 직접 수거하는 대규모 작전이다." },
        { id: "C", text: "모든 종류의 플라스틱 생산을 즉시 중단하는 조치이다." },
        { id: "D", text: "해양 생물에게 미세 플라스틱 분해 능력을 부여하는 유전 공학 연구이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "법률, 기술, 개인 실천 등 다각적인 해결 방안과 협력의 필요성을 강조하고 있다." },
        { id: "B", text: "미세 플라스틱 문제가 이미 완전히 해결되었음을 선언하고 있다." },
        { id: "C", text: "플라스틱 산업의 경제적 기여를 긍정적으로 평가하고 있다." },
        { id: "D", text: "개인의 노력만으로는 충분하며 정부의 개입은 불필요하다고 주장한다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "미세 플라스틱의 크기 기준은 지름 몇 밀리미터 이하인가?",
      answerRanges: [findRange(paragraphs, "p1", "5밀리미터")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "화장품에 첨가된 미세한 플라스틱 알갱이를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p1", "마이크로비즈")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "먹이 사슬을 따라 미세 플라스틱이 축적되는 현상을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "생물 농축")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "미세 플라스틱 표면에 흡착되기 쉬운 유해 물질로 언급된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "중금속이나 잔류성 유기 오염 물질")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "인간이 일주일에 섭취할 수 있는 미세 플라스틱의 추정량은 약 몇 그램인가?",
      answerRanges: [findRange(paragraphs, "p3", "약 5그램")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "플라스틱을 대체하기 위해 개발 중인 소재를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "생분해성 소재")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const dayStr = "067";
  return assembleFull(67, "NONFICTION", `dr-r2-${dayStr}`, "일일 독해(러셀 2) Day 67 비문학", paragraphs, timeline, buildRecallCards(paragraphs), confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 68 — 문학(LITERATURE): 현대시 감상 — 길 위에서
// ════════════════════════════════════════════════════════════════

function buildDay68() {
  const paragraphs = [
    {
      id: "p1",
      text: "은지는 할아버지의 장례를 치르고 돌아오는 버스 안에서 창밖을 바라보고 있었다. 삼월 초의 들판에는 아직 녹지 않은 잔설이 군데군데 남아 있었고, 그 사이로 마른 억새가 바람에 흔들렸다. 버스는 시골 국도를 느릿느릿 달렸고, 창문 너머로 지나가는 풍경은 마치 오래된 영화의 한 장면 같았다. 은지는 할아버지가 생전에 자주 하시던 말씀을 떠올렸다. 사람이 떠나도 그 사람이 걸어간 길은 남는다. 은지는 그 말의 뜻을 그때는 온전히 이해하지 못했지만, 지금 이 버스 안에서 비로소 할아버지가 왜 그런 말씀을 하셨는지 어렴풋이 느끼고 있었다."
    },
    {
      id: "p2",
      text: "할아버지는 평생 시골 마을에서 농사를 지으신 분이었다. 봄이면 논에 물을 대고, 여름이면 잡초를 뽑고, 가을이면 벼를 베고, 겨울이면 다음 해를 위해 씨앗을 골랐다. 할아버지의 손은 항상 흙 냄새가 났고, 등은 굽어 있었지만 걸음걸이만큼은 늘 단단했다. 마을 사람들은 할아버지를 믿음직한 이웃으로 여겼다. 비가 오면 누구네 지붕이 샌다고 먼저 가서 고쳐 주었고, 가뭄이 들면 물을 나누어 쓰자고 제안하는 것도 할아버지였다. 할아버지는 큰 말씀을 하시는 분이 아니었지만, 행동으로 마을 전체를 품는 사람이었다. 은지는 어릴 적 할아버지의 논둑을 따라 걸을 때면 세상이 평화롭게 느껴졌다."
    },
    {
      id: "p3",
      text: "장례식장에서 은지는 오랜만에 친척들을 만났다. 큰아버지는 할아버지가 전쟁 때 마을 사람들을 산속으로 이끌어 목숨을 구했다는 이야기를 들려주었고, 고모는 할아버지가 가난한 이웃에게 쌀을 나눠 주다가 정작 자신의 식구는 보릿고개를 넘겨야 했다는 일화를 꺼냈다. 은지는 그런 이야기를 처음 듣는 것이 많았다. 할아버지는 자신의 과거를 거의 말씀하지 않으셨기 때문이다. 은지는 할아버지가 남긴 것이 재산이나 명예가 아니라, 사람들의 기억 속에 새겨진 수많은 작은 선행이라는 사실을 깨달았다. 그것은 어떤 유산보다 단단한 것이었다."
    },
    {
      id: "p4",
      text: "버스가 도시에 가까워지자 풍경이 바뀌었다. 들판 대신 아파트 단지가 들어섰고, 논두렁 대신 아스팔트 도로가 펼쳐졌다. 은지는 가방에서 할아버지의 빛바랜 사진 한 장을 꺼내 들여다보았다. 젊은 시절의 할아버지가 논 한가운데 서서 환하게 웃고 있는 사진이었다. 은지는 할아버지의 그 웃음이 지금도 자기 안에 살아 있다고 느꼈다. 사람이 떠나도 길은 남는다는 말이 이제야 가슴에 와닿았다. 할아버지가 걸어간 길은 곧 삶 그 자체였으며, 그 길 위에서 만난 사람들이 할아버지를 기억하는 한 그 길은 결코 사라지지 않을 것이라고 은지는 생각했다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 68 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "사람이 떠나도 그 사람이 걸어간 길은 남는다." }],
      prompt: "할아버지의 이 말씀이 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "사람이 세상을 떠나도 그가 살아온 삶의 흔적과 영향은 남아 있다는 뜻이다." },
        { id: "B", text: "도로를 건설하면 사람이 떠나도 길은 물리적으로 존재한다는 뜻이다." },
        { id: "C", text: "사람은 항상 같은 길만 다녀야 한다는 교훈을 담고 있다." },
        { id: "D", text: "여행을 많이 하면 발자국이 남아 길이 만들어진다는 과학적 사실이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "장례 후 돌아오는 길에서 은지가 할아버지의 말씀을 되새기는 장면이다." },
        { id: "B", text: "은지가 버스를 타고 시골 마을로 여행을 떠나는 이야기이다." },
        { id: "C", text: "삼월 초의 날씨와 기온 변화를 과학적으로 설명하고 있다." },
        { id: "D", text: "버스 안에서 은지가 친구들과 대화를 나누는 장면이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "할아버지는 큰 말씀을 하시는 분이 아니었지만, 행동으로 마을 전체를 품는 사람이었다." }],
      prompt: "이 문장이 드러내는 할아버지의 인물됨으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "말보다 실천으로 이웃을 돌보는 묵묵한 헌신의 자세를 보여 준다." },
        { id: "B", text: "마을 사람들에게 연설을 자주 하며 리더십을 발휘하는 모습이다." },
        { id: "C", text: "농사일을 싫어하지만 어쩔 수 없이 시골에 머무르는 인물이다." },
        { id: "D", text: "자신의 이익을 우선시하며 이웃과 거리를 두는 성격이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "평생 농사를 지으며 이웃을 돌본 할아버지의 삶을 회상하고 있다." },
        { id: "B", text: "시골 마을의 농업 기술 발전 과정을 상세히 설명하고 있다." },
        { id: "C", text: "은지가 할아버지와 논두렁에서 싸운 기억을 떠올리고 있다." },
        { id: "D", text: "할아버지가 도시로 이사하여 새로운 직업을 구하는 이야기이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "할아버지가 남긴 것이 재산이나 명예가 아니라, 사람들의 기억 속에 새겨진 수많은 작은 선행이라는 사실을 깨달았다." }],
      prompt: "은지가 깨달은 할아버지의 진정한 유산으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "물질적 재산이 아니라 사람들의 기억에 남은 선행과 따뜻한 행동이다." },
        { id: "B", text: "할아버지가 남긴 많은 토지와 부동산 자산이다." },
        { id: "C", text: "전쟁에서 받은 훈장과 공식적인 표창장이다." },
        { id: "D", text: "할아버지가 쓴 자서전과 출판된 책이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "장례식에서 들은 이야기를 통해 은지가 할아버지의 삶의 가치를 새로이 인식한다." },
        { id: "B", text: "친척들이 유산 분배를 놓고 갈등하는 장면이다." },
        { id: "C", text: "은지가 할아버지의 전쟁 경험을 이미 잘 알고 있었음을 보여 준다." },
        { id: "D", text: "고모가 할아버지의 사업 성공 비결을 공유하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "할아버지가 걸어간 길은 곧 삶 그 자체였으며, 그 길 위에서 만난 사람들이 할아버지를 기억하는 한 그 길은 결코 사라지지 않을 것이라고 은지는 생각했다." }],
      prompt: "은지의 이 생각이 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "사람의 삶은 그가 남긴 관계와 기억으로 영속한다는 깨달음이다." },
        { id: "B", text: "시골 도로가 영구적으로 보존되어야 한다는 환경 보전의 메시지이다." },
        { id: "C", text: "사진 속의 할아버지가 실제로 살아 돌아올 것이라는 기대이다." },
        { id: "D", text: "도시와 시골의 풍경 차이를 객관적으로 비교 분석하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "은지가 할아버지의 말씀을 비로소 이해하며 삶의 의미를 깨닫는 장면이다." },
        { id: "B", text: "도시의 발전으로 시골 마을이 사라지는 사회 문제를 고발하고 있다." },
        { id: "C", text: "은지가 할아버지의 사진을 잃어버려 슬퍼하는 장면이다." },
        { id: "D", text: "버스가 고장 나서 은지가 도보로 귀가하는 이야기이다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "은지가 장례를 치르고 돌아오면서 탄 교통수단은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "버스")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "할아버지가 생전에 자주 하신 말씀의 핵심 내용은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "사람이 떠나도 그 사람이 걸어간 길은 남는다")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "할아버지는 평생 무엇을 하신 분이었는가?",
      answerRanges: [findRange(paragraphs, "p2", "시골 마을에서 농사를 지으신 분")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "큰아버지가 들려준 이야기에서 할아버지가 전쟁 때 한 일은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "마을 사람들을 산속으로 이끌어 목숨을 구했다")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "은지가 가방에서 꺼내 본 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "할아버지의 빛바랜 사진 한 장")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "사진 속 할아버지는 어디에 서서 웃고 있었는가?",
      answerRanges: [findRange(paragraphs, "p4", "논 한가운데")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const dayStr = "068";
  return assembleFull(68, "LITERATURE", `dr-r2-${dayStr}`, "일일 독해(러셀 2) Day 68 문학", paragraphs, timeline, buildRecallCards(paragraphs), confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 69 — 비문학(NONFICTION): 수면의 과학
// ════════════════════════════════════════════════════════════════

function buildDay69() {
  const paragraphs = [
    {
      id: "p1",
      text: "인간은 일생의 약 3분의 1을 잠자는 데 보낸다. 수면은 단순히 쉬는 시간이 아니라, 뇌와 신체가 능동적으로 회복과 정비를 수행하는 복잡한 생리 과정이다. 수면은 크게 두 가지 상태로 나뉜다. 하나는 비렘(Non-REM) 수면이고, 다른 하나는 렘(REM) 수면이다. 비렘 수면은 다시 세 단계로 구분되며, 가벼운 잠에서 점차 깊은 잠으로 들어간다. 깊은 비렘 수면 동안에는 성장 호르몬이 분비되어 세포 재생과 조직 복구가 이루어지고, 면역 기능도 강화된다. 렘 수면은 눈동자가 빠르게 움직이는 특징을 가지며, 이 시기에 대부분의 꿈을 꾼다."
    },
    {
      id: "p2",
      text: "수면의 주기는 약 90분 간격으로 비렘과 렘 수면이 교대로 반복되는 구조를 갖는다. 하룻밤에 보통 네 번에서 다섯 번의 수면 주기가 이루어지며, 잠이 깊어질수록 초반에는 깊은 비렘 수면의 비중이 크고 후반으로 갈수록 렘 수면의 비중이 커진다. 이러한 수면 구조는 체내 생체 시계, 즉 일주기 리듬에 의해 조절된다. 일주기 리듬은 뇌의 시교차 상핵이라는 부위에서 관장하며, 빛의 양을 감지하여 멜라토닌이라는 수면 유도 호르몬의 분비를 조절한다. 저녁이 되어 빛이 줄어들면 멜라토닌 분비가 증가하여 졸음이 오고, 아침에 빛이 들어오면 분비가 억제되어 각성 상태가 된다."
    },
    {
      id: "p3",
      text: "수면이 부족하면 다양한 문제가 발생한다. 먼저 인지 기능이 저하되어 집중력, 판단력, 기억력이 모두 떨어진다. 특히 수면 중에 뇌는 낮 동안 학습한 정보를 정리하고 장기 기억으로 전환하는 기억 공고화 과정을 수행하는데, 수면이 부족하면 이 과정이 방해받아 학습 효율이 크게 감소한다. 또한 만성적인 수면 부족은 비만, 당뇨병, 심혈관 질환 등의 위험을 높이는 것으로 알려져 있다. 수면 중에는 식욕을 조절하는 호르몬인 렙틴과 그렐린의 균형이 유지되는데, 잠이 부족하면 식욕 촉진 호르몬인 그렐린이 증가하고 포만감을 주는 렙틴은 감소하여 과식으로 이어질 수 있다."
    },
    {
      id: "p4",
      text: "건강한 수면을 위해서는 규칙적인 수면 습관이 무엇보다 중요하다. 매일 같은 시간에 잠자리에 들고 일어나는 것이 생체 시계를 안정시키는 가장 효과적인 방법이다. 잠자리에 들기 전 스마트폰이나 컴퓨터 화면에서 나오는 청색광은 멜라토닌 분비를 억제하므로, 취침 한 시간 전부터는 전자 기기의 사용을 줄이는 것이 바람직하다. 카페인은 섭취 후 체내에서 반감기가 약 다섯 시간이므로, 오후 늦은 시간 이후에는 커피나 에너지 음료를 삼가는 것이 좋다. 이처럼 수면은 생활 습관과 밀접하게 연결되어 있으며, 양질의 수면은 건강과 학습 능력 모두에 핵심 토대가 된다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 69 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "수면은 단순히 쉬는 시간이 아니라, 뇌와 신체가 능동적으로 회복과 정비를 수행하는 복잡한 생리 과정이다." }],
      prompt: "이 문장이 전달하는 수면의 본질로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "수면은 뇌와 신체가 적극적으로 회복 활동을 하는 능동적 과정이다." },
        { id: "B", text: "수면은 모든 신체 활동이 완전히 멈추는 휴식 시간이다." },
        { id: "C", text: "수면은 의식이 있는 상태에서 이루어지는 명상의 일종이다." },
        { id: "D", text: "수면은 에너지 소모가 전혀 없는 완전한 비활동 상태이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "깊은 비렘 수면 동안에는 성장 호르몬이 분비되어 세포 재생과 조직 복구가 이루어지고, 면역 기능도 강화된다." }],
      prompt: "깊은 비렘 수면에서 일어나는 일로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "성장 호르몬 분비를 통한 세포 재생, 조직 복구, 면역 강화이다." },
        { id: "B", text: "눈동자가 빠르게 움직이며 대부분의 꿈을 꾸는 시기이다." },
        { id: "C", text: "뇌의 활동이 완전히 정지하여 의식이 소멸하는 단계이다." },
        { id: "D", text: "멜라토닌이 감소하여 각성 상태로 전환되는 시기이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "수면의 정의와 비렘·렘 수면의 특성을 개괄적으로 설명하고 있다." },
        { id: "B", text: "수면 부족이 건강에 미치는 악영향을 구체적으로 나열하고 있다." },
        { id: "C", text: "건강한 수면 습관을 위한 실천 방법을 제시하고 있다." },
        { id: "D", text: "일주기 리듬과 멜라토닌의 관계를 심층적으로 분석하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "일주기 리듬은 뇌의 시교차 상핵이라는 부위에서 관장하며, 빛의 양을 감지하여 멜라토닌이라는 수면 유도 호르몬의 분비를 조절한다." }],
      prompt: "일주기 리듬의 작동 원리로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "뇌의 시교차 상핵이 빛의 양을 감지하여 멜라토닌 분비를 조절한다." },
        { id: "B", text: "심장 박동이 빨라지면 자동으로 수면 상태로 전환된다." },
        { id: "C", text: "위장에서 분비되는 소화 호르몬이 수면을 유도한다." },
        { id: "D", text: "근육의 피로도를 측정하여 뇌가 수면 시간을 결정한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "수면 주기의 구조와 일주기 리듬에 의한 수면 조절 메커니즘을 설명하고 있다." },
        { id: "B", text: "꿈의 심리학적 의미와 해석 방법을 소개하고 있다." },
        { id: "C", text: "수면 장애의 종류와 치료법을 제시하고 있다." },
        { id: "D", text: "카페인이 수면에 미치는 영향을 실험 결과로 보여 주고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "수면 중에 뇌는 낮 동안 학습한 정보를 정리하고 장기 기억으로 전환하는 기억 공고화 과정을 수행하는데, 수면이 부족하면 이 과정이 방해받아 학습 효율이 크게 감소한다." }],
      prompt: "수면과 학습의 관계에 대한 설명으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "수면 중 기억 공고화 과정이 이루어지므로 수면 부족은 학습 효율을 떨어뜨린다." },
        { id: "B", text: "수면 시간이 길수록 학습 능력이 무한히 증가한다." },
        { id: "C", text: "잠을 자지 않아야 뇌가 더 활발하게 정보를 처리한다." },
        { id: "D", text: "기억은 수면과 무관하게 깨어 있을 때만 형성된다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "수면 부족이 인지 기능 저하와 각종 건강 문제를 일으키는 과정을 설명하고 있다." },
        { id: "B", text: "비만을 예방하기 위한 식단 관리 방법을 제시하고 있다." },
        { id: "C", text: "수면 무호흡증의 진단 기준과 치료 절차를 서술하고 있다." },
        { id: "D", text: "렙틴과 그렐린의 화학적 구조를 분석하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "잠자리에 들기 전 스마트폰이나 컴퓨터 화면에서 나오는 청색광은 멜라토닌 분비를 억제하므로, 취침 한 시간 전부터는 전자 기기의 사용을 줄이는 것이 바람직하다." }],
      prompt: "취침 전 전자 기기 사용을 줄여야 하는 이유로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "화면의 청색광이 멜라토닌 분비를 억제하여 수면을 방해하기 때문이다." },
        { id: "B", text: "전자 기기의 전자파가 체온을 급격히 올리기 때문이다." },
        { id: "C", text: "게임이나 영상이 흥미로워 잠을 자지 않게 되기 때문이다." },
        { id: "D", text: "전자 기기가 침실의 산소를 소모하여 호흡 곤란을 유발하기 때문이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "건강한 수면을 위한 구체적인 생활 습관과 그 근거를 제시하고 있다." },
        { id: "B", text: "카페인의 화학적 구성과 인체 대사 과정을 분석하고 있다." },
        { id: "C", text: "수면 연구의 역사와 주요 학자들을 소개하고 있다." },
        { id: "D", text: "수면 주기의 구조와 비렘·렘 수면의 차이를 설명하고 있다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "수면의 두 가지 큰 상태를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p1", "비렘(Non-REM) 수면"), findRange(paragraphs, "p1", "렘(REM) 수면")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "깊은 비렘 수면에서 분비되는 호르몬은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "성장 호르몬")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "체내 생체 시계를 관장하는 뇌의 부위는 어디인가?",
      answerRanges: [findRange(paragraphs, "p2", "시교차 상핵")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "빛이 줄어들면 분비가 증가하여 졸음을 유발하는 호르몬은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "멜라토닌")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "수면 중 낮 동안 학습한 정보를 장기 기억으로 전환하는 과정을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p3", "기억 공고화")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "식욕을 촉진하여 수면 부족 시 과식을 유발하는 호르몬은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "그렐린")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "카페인의 체내 반감기는 약 몇 시간인가?",
      answerRanges: [findRange(paragraphs, "p4", "다섯 시간")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const dayStr = "069";
  return assembleFull(69, "NONFICTION", `dr-r2-${dayStr}`, "일일 독해(러셀 2) Day 69 비문학", paragraphs, timeline, buildRecallCards(paragraphs), confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 70 — 문학(LITERATURE): 현대 수필 — 나무와 사람
// ════════════════════════════════════════════════════════════════

function buildDay70() {
  const paragraphs = [
    {
      id: "p1",
      text: "학교 앞 느티나무는 내가 태어나기 훨씬 전부터 그 자리에 있었다고 한다. 초등학교 입학식 날 어머니의 손을 잡고 교문을 들어서면서 올려다본 그 나무는 하늘을 가릴 만큼 거대했다. 굵고 울퉁불퉁한 줄기, 사방으로 뻗은 가지, 그리고 셀 수 없이 많은 잎사귀가 만들어 내는 그늘은 운동장의 절반쯤을 덮었다. 비가 오면 아이들은 느티나무 아래로 모여들어 비를 피했고, 여름이면 그 그늘 아래에서 도시락을 먹었다. 나무는 말이 없었지만 늘 그곳에 있었고, 우리는 그 존재를 공기처럼 당연하게 여겼다. 돌이켜 보면 그 나무는 내 어린 시절의 배경이자, 기억의 좌표 같은 것이었다."
    },
    {
      id: "p2",
      text: "중학교에 올라가면서 나는 학교 앞 느티나무를 자주 보지 못하게 되었다. 통학 경로가 바뀌었고, 바빠진 일상 속에서 나무를 일부러 찾아갈 여유가 없었다. 그 사이에도 나무는 계절마다 잎을 피우고 떨구기를 반복하며 한자리를 지켰을 것이다. 나는 학원과 시험에 쫓기며 그 나무의 존재를 까맣게 잊고 있었다. 그러다 어느 겨울날, 초등학교 동창의 연락을 받았다. 느티나무가 도로 확장 공사 때문에 잘릴 수 있다는 소식이었다. 나는 그 말을 듣는 순간 가슴 한편이 서늘해지는 것을 느꼈다. 매일 그 아래에서 뛰어놀던 시절이 갑자기 또렷하게 되살아났기 때문이다."
    },
    {
      id: "p3",
      text: "마을 주민들과 동문들이 나무를 살리기 위한 모임을 열었다. 나무의 나이를 측정해 보니 수령이 이백 년 이상이라는 사실이 밝혀졌고, 이를 근거로 보호수 지정을 요청하는 탄원서가 군청에 제출되었다. 공사 관계자들은 처음에 난색을 보였지만, 주민들의 끈질긴 설득과 지역 언론의 보도 덕분에 결국 도로 설계가 변경되어 나무는 그 자리에 남게 되었다. 소식을 듣고 나는 오랫만에 초등학교 앞을 찾아갔다. 겨울 바람에 앙상한 가지를 드러낸 느티나무는 여전히 그 자리에 서 있었다. 나는 나무의 거친 껍질에 손을 대 보았다. 그 촉감은 거칠지만 온기가 느껴졌다."
    },
    {
      id: "p4",
      text: "나무를 바라보며 생각했다. 나무가 이백 년 동안 한 자리를 지킨 것처럼, 사람의 삶에도 자리를 지키는 것이 중요한 순간이 있다. 빠르게 변하는 세상 속에서 우리는 늘 새로운 것을 좇지만, 오래된 것이 품고 있는 깊이와 단단함은 쉽게 대체되지 않는다. 느티나무가 수백 명의 아이들에게 그늘이 되어 준 것처럼, 한 사람이 자기 자리에서 묵묵히 역할을 다하는 것도 세상에 그늘을 드리우는 일이 아닐까. 나는 그날 나무 아래에서 한참 서 있다가 돌아왔다. 봄이 오면 느티나무는 다시 푸른 잎을 틔울 것이다. 그리고 나도 내 자리에서 뿌리를 내리며 살아가야겠다고 다짐했다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 70 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "나무는 말이 없었지만 늘 그곳에 있었고, 우리는 그 존재를 공기처럼 당연하게 여겼다." }],
      prompt: "이 문장이 전달하는 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "나무의 존재가 너무 일상적이어서 그 소중함을 깨닫지 못했다는 것이다." },
        { id: "B", text: "나무가 말을 하지 못해 아이들이 나무를 무시했다는 것이다." },
        { id: "C", text: "공기처럼 눈에 보이지 않아 나무를 찾을 수 없었다는 것이다." },
        { id: "D", text: "나무가 여러 장소로 옮겨 다녀 항상 같은 자리에 없었다는 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "학교 앞 느티나무가 화자의 어린 시절에서 차지하는 의미를 소개하고 있다." },
        { id: "B", text: "느티나무의 생물학적 특성과 생장 과정을 설명하고 있다." },
        { id: "C", text: "화자가 입학식 날 울었던 슬픈 기억을 서술하고 있다." },
        { id: "D", text: "운동장에서 축구를 하던 구체적인 경기 장면을 묘사하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "느티나무가 도로 확장 공사 때문에 잘릴 수 있다는 소식이었다." }],
      prompt: "느티나무가 위협받게 된 원인으로 적절한 것은?",
      choices: [
        { id: "A", text: "도로 확장 공사로 나무가 있는 자리가 공사 구간에 포함되었기 때문이다." },
        { id: "B", text: "나무에 병이 들어 스스로 쓰러질 위험이 있었기 때문이다." },
        { id: "C", text: "학교 건물을 신축하기 위해 운동장을 넓혀야 했기 때문이다." },
        { id: "D", text: "마을 주민들이 나무를 다른 곳으로 옮기자고 요청했기 때문이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "바쁜 일상 속에서 잊고 있던 느티나무가 잘릴 위기에 처했다는 소식을 듣는 장면이다." },
        { id: "B", text: "화자가 중학교에서 좋은 성적을 거둔 성공 이야기를 다루고 있다." },
        { id: "C", text: "초등학교 동창 모임에서 즐거운 시간을 보내는 장면을 그린다." },
        { id: "D", text: "도로 확장 공사의 기술적 과정을 상세히 설명하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "주민들의 끈질긴 설득과 지역 언론의 보도 덕분에 결국 도로 설계가 변경되어 나무는 그 자리에 남게 되었다." }],
      prompt: "느티나무가 보존될 수 있었던 이유로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "주민들의 끈질긴 설득과 언론 보도가 도로 설계 변경을 이끌어 냈기 때문이다." },
        { id: "B", text: "공사 비용이 부족하여 공사 자체가 취소되었기 때문이다." },
        { id: "C", text: "나무가 스스로 다른 장소로 이동하여 공사를 피했기 때문이다." },
        { id: "D", text: "군청에서 처음부터 나무 보존을 계획하고 있었기 때문이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "주민들의 노력으로 느티나무를 지켜 내고 화자가 나무를 찾아가는 장면이다." },
        { id: "B", text: "군청의 행정 절차와 보호수 지정 기준을 설명하고 있다." },
        { id: "C", text: "지역 언론이 나무에 관한 거짓 기사를 작성한 사건을 다룬다." },
        { id: "D", text: "화자가 나무를 직접 잘라내는 공사에 참여하는 장면이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "오래된 것이 품고 있는 깊이와 단단함은 쉽게 대체되지 않는다." }],
      prompt: "이 문장이 전달하는 화자의 생각으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "오랜 세월을 견딘 것에는 새것으로 대체할 수 없는 고유한 가치가 있다는 것이다." },
        { id: "B", text: "오래된 물건은 무조건 버리고 새것으로 교체해야 한다는 것이다." },
        { id: "C", text: "변화를 두려워하고 과거에만 집착해야 한다는 보수적 입장이다." },
        { id: "D", text: "나무는 단단하지만 사람은 연약하다는 대조를 강조하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "나는 그날 나무 아래에서 한참 서 있다가 돌아왔다. 봄이 오면 느티나무는 다시 푸른 잎을 틔울 것이다. 그리고 나도 내 자리에서 뿌리를 내리며 살아가야겠다고 다짐했다." }],
      prompt: "화자가 느티나무에게서 얻은 교훈으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "나무처럼 자기 자리에서 묵묵히 뿌리를 내리며 살아가겠다는 다짐이다." },
        { id: "B", text: "나무가 되어 숲에서 살고 싶다는 자연 회귀의 소망이다." },
        { id: "C", text: "봄이 와도 나무에는 관심을 갖지 않겠다는 무관심의 표현이다." },
        { id: "D", text: "도시를 떠나 시골로 이사하겠다는 구체적인 이주 계획이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "느티나무를 통해 자기 자리를 지키는 삶의 가치를 깨닫는 화자의 성찰이다." },
        { id: "B", text: "봄에 심어야 할 나무 품종에 대한 정보를 전달하고 있다." },
        { id: "C", text: "화자가 나무를 잘라 목재로 사용하려는 계획을 세우고 있다." },
        { id: "D", text: "느티나무의 식물학적 분류와 번식 방법을 설명하고 있다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "학교 앞에 서 있는 나무의 종류는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "느티나무")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "화자가 나무의 존재를 무엇처럼 당연하게 여겼다고 하였는가?",
      answerRanges: [findRange(paragraphs, "p1", "공기")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "느티나무가 잘릴 수 있게 된 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "도로 확장 공사")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "느티나무의 수령은 최소 몇 년 이상으로 밝혀졌는가?",
      answerRanges: [findRange(paragraphs, "p3", "이백 년")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "나무를 지키기 위해 군청에 제출된 문서는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "탄원서")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "화자가 나무에게서 얻은 교훈의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "내 자리에서 뿌리를 내리며 살아가야겠다")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  const dayStr = "070";
  return assembleFull(70, "LITERATURE", `dr-r2-${dayStr}`, "일일 독해(러셀 2) Day 70 문학", paragraphs, timeline, buildRecallCards(paragraphs), confirmQuestions);
}


// ═══════════════════════════════════════════════════
// 메인: 빌드 + 파일 쓰기
// ═══════════════════════════════════════════════════

function main() {
  const BASE = path.resolve(__dirname, '..');
  const batchPath = path.join(BASE, 'generated', 'daily-batch-reading-russell2.json');
  const staticDir = path.join(BASE, 'frontend', 'public', 'daily-reading', 'russell2');

  // 콘텐츠 빌드
  const builders = [
    { day: 66, subArea: "LITERATURE", build: buildDay66 },
    { day: 67, subArea: "NONFICTION", build: buildDay67 },
    { day: 68, subArea: "LITERATURE", build: buildDay68 },
    { day: 69, subArea: "NONFICTION", build: buildDay69 },
    { day: 70, subArea: "LITERATURE", build: buildDay70 },
  ];

  const contents = [];
  for (const b of builders) {
    try {
      const content = b.build();
      contents.push({ day: b.day, subArea: b.subArea, content });

      // 길이 검증
      const paras = content.payload.passage.paragraphs;
      const len = charLen(paras);
      if (len < 1150 || len > 1250) {
        console.warn(`경고: Day ${b.day} 지문 길이 ${len}자 (목표 1150~1250)`);
      }

      // 복기 카드 수 검증
      const cardCount = content.payload.recall.cards.length;
      if (cardCount !== 8) {
        console.error(`오류: Day ${b.day} 복기 카드 ${cardCount}장 (목표 8장)`);
      }

      // 확인 문항 수 검증
      const qCount = content.payload.confirm.questions.length;
      if (qCount < 5 || qCount > 8) {
        console.error(`오류: Day ${b.day} 확인 문항 ${qCount}개 (목표 5~8)`);
      }

      console.log(`Day ${b.day}: 길이=${len}자, 정독=${content.payload.intensive.timeline.length}단계, 복기=${cardCount}장, 확인=${qCount}문항`);
    } catch (err) {
      console.error(`오류 (Day ${b.day}): ${err.message}`);
      // 검증 실패 시에도 파일 생성하되 경고 출력
    }
  }

  // 배치 파일 최신 상태 읽기 후 교체
  console.log('\n배치 파일 읽기...');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  console.log(`배치 파일 items 수: ${batch.items.length}`);

  for (const { day, subArea, content } of contents) {
    const idx = day - 1; // items[65]~[69]
    const batchItem = wrapBatchItem(day, subArea, content);
    batch.items[idx] = batchItem;
    console.log(`items[${idx}] (Day ${day}) 교체 완료`);
  }

  // 배치 파일 쓰기
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
  console.log(`배치 파일 저장: ${batchPath}`);

  // static 파일 쓰기
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
  }
  for (const { day, content } of contents) {
    const fileName = String(day).padStart(3, '0') + '.json';
    const filePath = path.join(staticDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`static 파일 저장: ${filePath}`);
  }

  console.log('\n모든 작업 완료!');
}

main();
