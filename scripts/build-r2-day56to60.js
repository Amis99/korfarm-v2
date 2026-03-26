/**
 * 러셀2(RUSSELL_2) Day 56~60 일일독해 콘텐츠 빌더
 * - Day 56: 문학(LITERATURE), Day 57: 비문학(NONFICTION)
 * - Day 58: 문학(LITERATURE), Day 59: 비문학(NONFICTION)
 * - Day 60: 문학(LITERATURE)
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

function truncate(str, len) {
  return str.length > len ? str.substring(0, len) + '...' : str;
}

function shuffleChoices(choices, answerId) {
  const idx = hashIdx(answerId + choices.map(c => c.text).join('')) % choices.length;
  return choices;
}

// ─── 콘텐츠 골격 생성 ───

function makeShell(dayIndex, subArea, contentId, title) {
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
    payload: null
  };
}

function makeBatchItem(dayIndex, subArea, content) {
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

// 복기 카드 8장 생성
function makeRecallCards(paragraphs) {
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

function assembleFull(dayIndex, subArea, paragraphs, timeline, confirmQuestions) {
  const subAreaKo = subArea === "LITERATURE" ? "문학" : "비문학";
  const dayStr = String(dayIndex).padStart(3, '0');
  const content = makeShell(dayIndex, subArea, `dr-r2-${dayStr}`, `일일 독해(러셀 2) Day ${dayIndex} ${subAreaKo}`);
  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: makeRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };
  return content;
}

function wrapBatchItem(dayIndex, subArea, content) {
  return makeBatchItem(dayIndex, subArea, content);
}


// ════════════════════════════════════════════════════════════════
// Day 56 — 문학(LITERATURE): 현대 소설 — 도서관의 시간
// ════════════════════════════════════════════════════════════════

function buildDay56() {
  const paragraphs = [
    {
      id: "p1",
      text: "학교가 끝나면 나는 늘 도서관으로 향했다. 집에 돌아가 봐야 텅 빈 거실만 기다리고 있었기 때문이다. 아버지는 공장 야근이 잦았고, 어머니는 식당 일을 마치고 밤늦게야 돌아왔다. 냉장고에는 전날 남은 밥과 김치 한 통이 전부였고, 혼자 전자레인지를 돌리는 소리만 조용한 부엌에 울렸다. 도서관은 달랐다. 넓은 열람실에는 따뜻한 난방이 돌아갔고, 책장 사이를 걸으면 종이와 먹 냄새가 코끝을 간지럽혔다. 나는 구석 자리에 앉아 아무 책이나 펼쳤다. 글자를 따라가다 보면 어느새 배고픔도 외로움도 잊을 수 있었다. 그곳에서만큼은 나도 모험가가 되고, 과학자가 되고, 먼 나라의 여행자가 될 수 있었다."
    },
    {
      id: "p2",
      text: "어느 날 사서 선생님이 내 옆에 앉으셨다. 매일 오는 너를 보면서 한 가지 부탁을 하고 싶었다고 하셨다. 선생님은 반납된 책을 분류하고 서가에 꽂는 일을 도와줄 수 있겠느냐고 물으셨다. 나는 고개를 끄덕였고, 그날부터 도서관의 비공식 도우미가 되었다. 책을 정리하면서 나는 자연스럽게 다양한 분야의 책을 접하게 되었다. 과학 서적의 표지를 만지다가 우주의 크기에 놀랐고, 역사책의 빛바랜 사진을 보며 시간의 무게를 느꼈다. 사서 선생님은 가끔 흥미로운 책을 골라 내 앞에 슬쩍 놓아두곤 하셨는데, 그것은 선생님만의 조용한 추천이었다."
    },
    {
      id: "p3",
      text: "중학교 삼 학년이 되자 친구들은 학원으로 몰려갔지만, 나에게는 학원비가 없었다. 대신 나는 도서관에서 참고서를 빌려 스스로 공부했다. 모르는 문제가 나오면 사서 선생님께 여쭤보기도 했고, 선생님은 관련 책을 찾아 설명해 주셨다. 성적이 조금씩 오르기 시작했다. 반에서 중위권이던 나는 한 학기 만에 상위권에 진입했다. 담임 선생님이 비결이 뭐냐고 물었을 때, 나는 잠시 머뭇거리다가 도서관에서 매일 공부한다고 대답했다. 담임 선생님은 고개를 끄덕이며 꾸준함이 가장 강한 무기라고 말씀하셨다."
    },
    {
      id: "p4",
      text: "졸업식 날, 사서 선생님이 작은 상자 하나를 건네셨다. 안에는 만년필 한 자루가 들어 있었다. 선생님은 네가 쓸 이야기가 많을 거라고 말씀하셨다. 나는 눈시울이 뜨거워져 고개를 숙였다. 도서관은 나에게 단순히 책을 읽는 장소가 아니었다. 그곳은 세상과 나를 이어 주는 통로였고, 꿈을 키우는 온실이었으며, 가난이라는 벽 너머를 볼 수 있게 해 준 창문이었다. 그 만년필을 쥐고 집으로 돌아오는 길에, 나는 언젠가 이 이야기를 글로 써야겠다고 다짐했다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 56 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "집에 돌아가 봐야 텅 빈 거실만 기다리고 있었기 때문이다." }],
      prompt: "화자가 도서관으로 향한 이유로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "집에는 가족이 없어 외로웠기 때문에 도서관을 피난처로 삼았다." },
        { id: "B", text: "도서관에서 친구들과 함께 놀기 위해 매일 찾아갔다." },
        { id: "C", text: "부모님이 도서관에서 공부하라고 엄하게 지시했기 때문이다." },
        { id: "D", text: "학교 과제를 제출하기 위해 자료를 찾으러 간 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "글자를 따라가다 보면 어느새 배고픔도 외로움도 잊을 수 있었다." }],
      prompt: "이 문장에서 독서가 화자에게 주는 효과로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "독서를 통해 현실의 결핍을 잠시나마 잊고 위안을 얻었다." },
        { id: "B", text: "글자를 읽으면 실제로 배가 부르게 되는 신체 변화가 일어났다." },
        { id: "C", text: "책을 읽으면 친구들이 모여들어 외로움이 사라졌다." },
        { id: "D", text: "도서관의 간식 코너에서 음식을 먹을 수 있었기 때문이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "가정의 빈자리를 도서관이 채워 주며 독서가 위안이 되었다." },
        { id: "B", text: "화자의 부모가 교육에 열성적이어서 도서관에 보냈다." },
        { id: "C", text: "도서관의 시설이 낙후되어 화자가 불만을 느끼고 있다." },
        { id: "D", text: "화자가 학교생활에 적응하지 못하고 방황하는 과정을 그린다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "사서 선생님은 가끔 흥미로운 책을 골라 내 앞에 슬쩍 놓아두곤 하셨는데, 그것은 선생님만의 조용한 추천이었다." }],
      prompt: "사서 선생님의 이 행동이 보여 주는 태도로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "강요 없이 자연스럽게 화자의 관심을 넓혀 주려는 세심한 배려이다." },
        { id: "B", text: "반납 업무를 줄이기 위해 화자에게 일을 떠넘기는 것이다." },
        { id: "C", text: "선생님 자신이 읽기 싫은 책을 화자에게 처분하는 것이다." },
        { id: "D", text: "도서관 이용 규칙을 어기고 특정 학생만 우대하는 행위이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "사서 선생님의 도움으로 화자가 다양한 분야의 책을 접하게 된다." },
        { id: "B", text: "화자가 도서관 업무에 부담을 느껴 그만두려 한다." },
        { id: "C", text: "사서 선생님이 화자에게 학원을 추천하는 장면이다." },
        { id: "D", text: "도서관의 장서 관리 체계를 상세히 설명하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "대신 나는 도서관에서 참고서를 빌려 스스로 공부했다." }],
      prompt: "이 문장에서 드러나는 화자의 태도로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "경제적 한계를 도서관 자원으로 극복하려는 주체적 자세이다." },
        { id: "B", text: "학원에 다니는 친구들을 부러워하며 포기하는 모습이다." },
        { id: "C", text: "참고서를 빌리기만 하고 실제로는 공부하지 않는 것이다." },
        { id: "D", text: "사서 선생님이 강제로 참고서를 빌려 준 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "담임 선생님은 고개를 끄덕이며 꾸준함이 가장 강한 무기라고 말씀하셨다." }],
      prompt: "담임 선생님의 이 말이 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "특별한 조건이 아니라 꾸준한 노력이 성과를 만든다는 격려이다." },
        { id: "B", text: "무기를 가져야 학교에서 살아남을 수 있다는 경고이다." },
        { id: "C", text: "학원을 다니지 않으면 성적이 오르지 않는다는 우려이다." },
        { id: "D", text: "도서관 출입을 제한해야 한다는 관리자적 시각이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "학원 없이 도서관에서 스스로 공부해 성적을 올린 화자의 노력이다." },
        { id: "B", text: "반 친구들이 학원에서 경쟁하며 성적을 올리는 과정이다." },
        { id: "C", text: "담임 선생님이 화자에게 장학금을 지급하는 이야기이다." },
        { id: "D", text: "화자가 성적 향상 후 교만해져 친구를 잃는 과정이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "그곳은 세상과 나를 이어 주는 통로였고, 꿈을 키우는 온실이었으며, 가난이라는 벽 너머를 볼 수 있게 해 준 창문이었다." }],
      prompt: "도서관을 '통로', '온실', '창문'에 비유한 효과로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "도서관이 화자에게 다층적인 의미를 지닌 공간임을 강조한다." },
        { id: "B", text: "도서관의 건축 구조를 구체적으로 설명하기 위한 것이다." },
        { id: "C", text: "도서관이 실제 온실처럼 식물을 키우는 곳임을 나타낸다." },
        { id: "D", text: "화자가 건축가가 되고 싶다는 꿈을 암시하는 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "졸업과 함께 도서관의 의미를 되새기며 글쓰기를 다짐한다." },
        { id: "B", text: "사서 선생님이 퇴직하여 도서관이 문을 닫는 이야기이다." },
        { id: "C", text: "화자가 만년필을 받고 화가 나서 돌려주려 한다." },
        { id: "D", text: "졸업식에서 화자가 전교 수석 상을 받는 장면이다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "화자의 아버지는 주로 어떤 일을 했는가?",
      answerRanges: [findRange(paragraphs, "p1", "공장 야근")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "사서 선생님이 화자에게 부탁한 일은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "반납된 책을 분류하고 서가에 꽂는 일")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "화자가 학원 대신 공부에 활용한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "참고서를 빌려")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "담임 선생님이 가장 강한 무기라고 말한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "꾸준함")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "졸업식 날 사서 선생님이 화자에게 준 선물은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "만년필 한 자루")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "화자가 도서관을 비유한 세 가지 중 꿈과 관련된 비유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "꿈을 키우는 온실")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(56, "LITERATURE", paragraphs, timeline, confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 57 — 비문학(NONFICTION): 미생물과 발효의 과학
// ════════════════════════════════════════════════════════════════

function buildDay57() {
  const paragraphs = [
    {
      id: "p1",
      text: "발효는 미생물이 유기물을 분해하여 에너지를 얻는 과정이다. 이 과정에서 알코올, 유기산, 이산화탄소 등 다양한 부산물이 생성되며, 이들은 식품의 맛과 향, 보존성에 큰 영향을 준다. 인류는 수천 년 전부터 발효를 이용하여 식품을 만들어 왔다. 고대 이집트인들은 밀 반죽에 효모를 넣어 빵을 부풀렸고, 메소포타미아 지역에서는 보리를 발효시켜 맥주를 양조했다. 한국에서도 삼국시대 이전부터 콩을 발효시킨 장류가 식탁의 중심이었으며, 김치 역시 유산균 발효를 활용한 대표적 전통 식품이다. 이처럼 발효는 문명의 발전과 함께해 온 가장 오래된 생명공학 기술 가운데 하나이다."
    },
    {
      id: "p2",
      text: "발효의 핵심 주체는 미생물이다. 효모는 당을 분해하여 알코올과 이산화탄소를 생성하는 대표적인 발효 미생물이며, 유산균은 당을 분해하여 젖산을 만든다. 곰팡이류인 누룩곰팡이는 전분을 당으로 전환하는 당화 과정을 담당하여 전통 주류와 장류의 제조에 필수적이다. 각 미생물은 최적의 온도와 습도 조건이 다르기 때문에, 발효 식품을 만들 때는 환경을 정밀하게 조절해야 한다. 예컨대 유산균은 섭씨 삼십오 도에서 사십이 도 사이에서 가장 활발하게 활동하며, 효모는 이보다 낮은 이십오 도에서 삼십 도 정도를 선호한다."
    },
    {
      id: "p3",
      text: "발효 식품이 건강에 이롭다는 사실은 과학적으로도 입증되고 있다. 유산균 발효 식품인 요구르트와 김치에는 장내 유익균의 활동을 돕는 프로바이오틱스가 풍부하다. 프로바이오틱스는 장내 미생물 균형을 유지하여 소화 기능을 개선하고, 면역 체계를 강화하는 데 기여한다. 또한 발효 과정에서 비타민 B군과 K 등이 합성되어 영양 가치가 높아지기도 한다. 된장의 경우 발효를 거치면서 항산화 물질인 이소플라본의 생체 이용률이 증가하여, 세포 노화를 억제하는 효과가 있는 것으로 보고되었다."
    },
    {
      id: "p4",
      text: "현대 과학은 발효 기술을 식품 산업을 넘어 의약품과 에너지 분야로 확장하고 있다. 미생물 발효를 통해 인슐린, 항생제 등의 의약품을 대량 생산하는 기술이 이미 상용화되었다. 바이오에탄올은 옥수수나 사탕수수 같은 식물 원료를 미생물로 발효시켜 얻는 친환경 연료로, 화석 연료의 대안으로 주목받고 있다. 나아가 합성 생물학 기술을 이용하여 미생물의 유전자를 편집함으로써 원하는 물질을 보다 효율적으로 생산하는 연구도 활발히 진행 중이다. 발효 기술은 과거의 전통 지혜에서 출발하여 미래의 지속 가능한 산업 기반으로 진화하고 있다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 57 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "발효는 미생물이 유기물을 분해하여 에너지를 얻는 과정이다." }],
      prompt: "이 문장에서 정의하는 '발효'의 핵심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "미생물이 유기물을 분해하여 에너지를 얻는 생화학적 과정이다." },
        { id: "B", text: "식품을 높은 온도에서 가열하여 살균하는 조리 과정이다." },
        { id: "C", text: "화학 약품을 첨가하여 식품의 맛을 변화시키는 가공 방법이다." },
        { id: "D", text: "식물이 광합성을 통해 포도당을 생성하는 자연 현상이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "이처럼 발효는 문명의 발전과 함께해 온 가장 오래된 생명공학 기술 가운데 하나이다." }],
      prompt: "이 문장에서 발효를 '가장 오래된 생명공학 기술'이라고 표현한 이유로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "인류가 수천 년 전부터 미생물을 활용해 식품을 만들어 왔기 때문이다." },
        { id: "B", text: "발효가 최근 과학 기술의 발전으로 비로소 가능해졌기 때문이다." },
        { id: "C", text: "발효 기술이 현재는 더 이상 사용되지 않기 때문이다." },
        { id: "D", text: "고대인들이 발효의 과학적 원리를 완벽히 이해하고 있었기 때문이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "발효의 정의와 인류 문명과 함께해 온 오랜 역사를 소개하고 있다." },
        { id: "B", text: "발효 식품의 건강 효과를 과학적으로 분석하고 있다." },
        { id: "C", text: "현대 발효 기술의 산업적 활용 방안을 제시하고 있다." },
        { id: "D", text: "미생물의 종류와 분류 체계를 상세히 설명하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "곰팡이류인 누룩곰팡이는 전분을 당으로 전환하는 당화 과정을 담당하여 전통 주류와 장류의 제조에 필수적이다." }],
      prompt: "누룩곰팡이의 역할로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "전분을 당으로 전환하는 당화 과정을 수행한다." },
        { id: "B", text: "당을 분해하여 알코올과 이산화탄소를 생성한다." },
        { id: "C", text: "당을 분해하여 젖산을 만들어 신맛을 낸다." },
        { id: "D", text: "단백질을 아미노산으로 분해하여 감칠맛을 낸다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "발효를 담당하는 주요 미생물의 종류와 최적 조건을 설명하고 있다." },
        { id: "B", text: "발효 식품의 역사적 유래를 시대별로 정리하고 있다." },
        { id: "C", text: "발효와 부패의 차이점을 과학적으로 비교하고 있다." },
        { id: "D", text: "미생물의 유전적 특성과 진화 과정을 다루고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "프로바이오틱스는 장내 미생물 균형을 유지하여 소화 기능을 개선하고, 면역 체계를 강화하는 데 기여한다." }],
      prompt: "프로바이오틱스의 기능으로 적절하지 않은 것은?",
      choices: [
        { id: "A", text: "유기물을 분해하여 알코올을 생성하는 역할을 한다." },
        { id: "B", text: "장내 미생물의 균형을 유지하는 데 도움을 준다." },
        { id: "C", text: "소화 기능을 개선하는 효과가 있다." },
        { id: "D", text: "면역 체계를 강화하는 데 기여한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "발효 식품이 건강에 이로운 과학적 근거를 제시하고 있다." },
        { id: "B", text: "발효 식품의 맛과 향을 비교 분석하고 있다." },
        { id: "C", text: "발효 식품의 생산 원가를 경제적으로 분석하고 있다." },
        { id: "D", text: "발효 식품의 유통 과정에서 발생하는 문제를 지적하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "바이오에탄올은 옥수수나 사탕수수 같은 식물 원료를 미생물로 발효시켜 얻는 친환경 연료로, 화석 연료의 대안으로 주목받고 있다." }],
      prompt: "바이오에탄올에 대한 설명으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "식물 원료를 미생물로 발효시켜 만드는 친환경 대체 연료이다." },
        { id: "B", text: "석유를 정제하여 만드는 고효율 화석 연료의 일종이다." },
        { id: "C", text: "미생물을 직접 연소시켜 에너지를 얻는 기술이다." },
        { id: "D", text: "태양광 에너지를 저장하는 배터리 기술과 같은 원리이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "발효 기술이 의약품과 에너지 분야로 확장되고 있음을 소개한다." },
        { id: "B", text: "전통 발효 식품의 제조 방법을 구체적으로 안내한다." },
        { id: "C", text: "발효 기술의 윤리적 문제를 심층 분석하고 있다." },
        { id: "D", text: "미생물의 멸종 위기와 보존 방안을 논의하고 있다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "발효 과정에서 생성되는 부산물에 해당하지 않는 것을 고르시오.",
      answerRanges: [findRange(paragraphs, "p1", "알코올, 유기산, 이산화탄소")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "효모가 당을 분해할 때 생성하는 물질 두 가지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "알코올과 이산화탄소")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "유산균이 가장 활발하게 활동하는 온도 범위는 어느 정도인가?",
      answerRanges: [findRange(paragraphs, "p2", "삼십오 도에서 사십이 도")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "장내 유익균의 활동을 돕는 물질을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p3", "프로바이오틱스")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "된장에서 발효 후 생체 이용률이 증가하는 항산화 물질은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "이소플라본")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "미생물 발효를 통해 대량 생산되는 의약품의 예를 하나 쓰시오.",
      answerRanges: [findRange(paragraphs, "p4", "인슐린")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "바이오에탄올의 원료로 언급된 식물 두 가지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "옥수수나 사탕수수")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(57, "NONFICTION", paragraphs, timeline, confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 58 — 문학(LITERATURE): 현대 수필 — 오래된 운동화
// ════════════════════════════════════════════════════════════════

function buildDay58() {
  const paragraphs = [
    {
      id: "p1",
      text: "신발장 한구석에 낡은 운동화 한 켤레가 있다. 밑창은 닳아 무늬가 사라졌고, 흰색이었을 천은 누렇게 변해 세탁으로도 돌아오지 않는다. 끈은 한쪽이 끊어져 매듭으로 이어 묶었고, 안쪽 깔창은 땀에 절어 색이 변했다. 누가 보아도 버릴 때가 지난 신발이다. 하지만 나는 이 운동화를 버리지 못한다. 이 신발에는 내가 보낸 한 계절의 기억이 깃들어 있기 때문이다. 중학교 이 학년 여름, 육상부에 들어간 첫날 어머니가 사 주신 운동화가 바로 이것이다. 당시 형편이 넉넉지 않았음에도 어머니는 시장을 두 바퀴나 돌아 가장 튼튼한 것을 골라 주셨다."
    },
    {
      id: "p2",
      text: "육상부 훈련은 혹독했다. 매일 아침 여섯 시에 운동장에 모여 준비 운동을 하고, 트랙을 열 바퀴 이상 뛰었다. 코치 선생님은 기록이 늘지 않으면 다섯 바퀴를 추가하셨고, 더운 날에도 쉬는 시간은 삼 분에 불과했다. 발바닥에 물집이 잡혀 터졌다가 굳어지기를 반복했고, 종아리 근육이 돌처럼 굳어 계단을 내려올 때마다 비명을 삼켰다. 몇 번이고 그만두고 싶었지만, 운동화 끈을 다시 조여 매는 순간 어머니의 얼굴이 떠올랐다. 시장 좌판에서 운동화를 들어 밑창을 꾹 눌러 보며 튼튼한지 확인하던 그 손길이 나를 다시 출발선에 세웠다."
    },
    {
      id: "p3",
      text: "가을 체육 대회 날이 다가왔다. 나는 팔백 미터 계주의 마지막 주자로 출전했다. 앞 주자들이 바통을 넘겨주었을 때 우리 팀은 삼 등이었다. 관중석에서 친구들의 함성이 들렸지만, 내 귀에는 오직 바람 소리와 심장 박동만이 들렸다. 커브를 돌 때 운동화가 트랙을 힘껏 밀어냈고, 직선 구간에서 나는 모든 힘을 쏟아 달렸다. 결승선을 지나는 순간 나는 이 등이었다. 금메달은 아니었지만, 출발선에서 포기하지 않았다는 사실이 어떤 메달보다 소중했다. 운동화를 벗어 들었을 때 안쪽 천이 찢어져 있었고, 밑창에는 트랙의 붉은 가루가 박혀 있었다."
    },
    {
      id: "p4",
      text: "지금은 더 좋은 신발을 살 수 있게 되었지만, 그 운동화를 신발장에서 꺼내 들 때마다 여전히 가슴이 뜨거워진다. 닳은 밑창은 내가 흘린 땀의 무게이고, 누런 천은 포기하지 않은 날들의 색이며, 끊어진 끈은 다시 묶어 나아간 의지의 흔적이다. 물건에도 영혼이 깃든다고 말한다면, 이 운동화에는 열네 살 여름의 영혼이 살아 숨 쉬고 있다. 언젠가 이 신발이 완전히 부서지더라도, 그 안에 담긴 기억만은 결코 닳지 않을 것이다. 그래서 나는 오늘도 이 낡은 운동화를 신발장에 고이 모셔 둔다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 58 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "하지만 나는 이 운동화를 버리지 못한다." }],
      prompt: "이 문장이 글 전체에서 하는 역할로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "운동화에 얽힌 기억을 이야기할 것임을 예고하는 전환 문장이다." },
        { id: "B", text: "운동화를 수리하려는 화자의 계획을 밝히는 문장이다." },
        { id: "C", text: "새 운동화를 살 형편이 안 됨을 한탄하는 문장이다." },
        { id: "D", text: "환경 보호를 위해 물건을 재활용하자는 주장을 담고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "당시 형편이 넉넉지 않았음에도 어머니는 시장을 두 바퀴나 돌아 가장 튼튼한 것을 골라 주셨다." }],
      prompt: "이 문장에서 드러나는 어머니의 마음으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "어려운 형편 속에서도 자녀를 위해 최선을 다하려는 정성이다." },
        { id: "B", text: "시장 구경을 즐기며 여유롭게 쇼핑하는 모습이다." },
        { id: "C", text: "가장 비싼 명품 운동화를 사 주려는 과시욕이다." },
        { id: "D", text: "운동부 활동에 반대하여 일부러 싼 것을 고른 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "낡은 운동화에 깃든 기억과 어머니의 정성을 소개한다." },
        { id: "B", text: "운동화의 재질과 제조 공정을 상세히 설명한다." },
        { id: "C", text: "신발장을 정리하는 실용적인 방법을 안내한다." },
        { id: "D", text: "중학교 시절 유행하던 운동화 브랜드를 나열한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "시장 좌판에서 운동화를 들어 밑창을 꾹 눌러 보며 튼튼한지 확인하던 그 손길이 나를 다시 출발선에 세웠다." }],
      prompt: "이 문장에서 '어머니의 손길'이 화자에게 미친 영향으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "어머니의 정성을 떠올리며 포기하지 않고 다시 훈련에 임하게 했다." },
        { id: "B", text: "어머니가 직접 훈련장에 와서 화자를 격려한 장면이다." },
        { id: "C", text: "운동화의 품질이 좋아서 물집이 생기지 않았다는 뜻이다." },
        { id: "D", text: "코치 선생님이 어머니에게 전화해 훈련 참여를 독촉한 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "혹독한 훈련 속에서도 어머니의 정성을 떠올리며 버텨 낸 과정이다." },
        { id: "B", text: "코치 선생님의 교육 철학과 훈련 프로그램을 소개한다." },
        { id: "C", text: "화자가 부상을 입어 육상부를 그만두게 되는 이야기이다." },
        { id: "D", text: "육상 경기의 규칙과 종목별 특성을 설명하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "금메달은 아니었지만, 출발선에서 포기하지 않았다는 사실이 어떤 메달보다 소중했다." }],
      prompt: "이 문장에서 화자가 소중히 여기는 것으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "결과보다 포기하지 않고 끝까지 도전한 과정 자체를 가치 있게 본다." },
        { id: "B", text: "이 등을 한 것이 아쉬워 다음에는 반드시 일 등을 하겠다는 다짐이다." },
        { id: "C", text: "금메달을 받지 못해 크게 실망하고 있는 모습이다." },
        { id: "D", text: "메달보다 상금이 더 중요하다는 현실적 판단이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "체육 대회에서 최선을 다해 뛴 경험과 그 의미를 서술한다." },
        { id: "B", text: "계주 경기의 규칙과 전략을 상세히 설명하고 있다." },
        { id: "C", text: "화자가 금메달을 받고 기쁨에 넘치는 장면이다." },
        { id: "D", text: "친구들의 응원이 오히려 부담이 되어 실수한 이야기이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "닳은 밑창은 내가 흘린 땀의 무게이고, 누런 천은 포기하지 않은 날들의 색이며, 끊어진 끈은 다시 묶어 나아간 의지의 흔적이다." }],
      prompt: "운동화의 각 부분에 의미를 부여한 서술 방식의 효과로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "물리적 훼손을 정신적 가치로 전환하여 운동화의 상징성을 높인다." },
        { id: "B", text: "운동화의 수선 비용을 계산하기 위한 객관적 묘사이다." },
        { id: "C", text: "운동화 제조 과정에서 발생한 결함을 지적하는 것이다." },
        { id: "D", text: "신발의 내구성을 평가하는 소비자 리뷰의 성격이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "낡은 운동화가 간직한 기억의 가치는 영원히 닳지 않는다는 깨달음이다." },
        { id: "B", text: "새 운동화를 사서 낡은 것을 기부하겠다는 계획이다." },
        { id: "C", text: "물건을 오래 쓰는 절약 습관의 중요성을 강조한다." },
        { id: "D", text: "화자가 운동화 수집 취미를 가지게 된 경위를 설명한다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "화자가 육상부에 들어간 것은 몇 학년 때인가?",
      answerRanges: [findRange(paragraphs, "p1", "이 학년")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "육상부 훈련에서 매일 아침 트랙을 최소 몇 바퀴 뛰었는가?",
      answerRanges: [findRange(paragraphs, "p2", "열 바퀴")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "체육 대회에서 화자가 출전한 종목은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "팔백 미터 계주")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "화자의 팀은 체육 대회에서 최종 몇 등을 했는가?",
      answerRanges: [findRange(paragraphs, "p3", "이 등")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "화자에 따르면 운동화의 '닳은 밑창'은 무엇의 무게인가?",
      answerRanges: [findRange(paragraphs, "p4", "내가 흘린 땀")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "화자는 이 운동화에 몇 살 여름의 영혼이 깃들어 있다고 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "열네 살")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(58, "LITERATURE", paragraphs, timeline, confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 59 — 비문학(NONFICTION): 지진과 판 구조론
// ════════════════════════════════════════════════════════════════

function buildDay59() {
  const paragraphs = [
    {
      id: "p1",
      text: "지구의 표면은 하나로 이어진 단단한 껍질이 아니라 여러 개의 판으로 나뉘어 있다. 이 판들은 지각과 상부 맨틀을 포함하는 암석권에 해당하며, 그 아래의 연약권 위에서 서서히 움직인다. 판의 이동 속도는 일 년에 수 센티미터에 불과하지만, 수백만 년이 쌓이면 대륙의 위치가 크게 바뀔 만큼 영향이 막대하다. 이 이론을 판 구조론이라 하며, 이십 세기 중반에 해양 탐사와 지질학 연구가 축적되면서 정립되었다. 판 구조론은 지진, 화산 활동, 산맥 형성 등 지구의 대규모 지질 현상을 통합적으로 설명하는 핵심 틀이다."
    },
    {
      id: "p2",
      text: "지진은 판과 판이 만나는 경계에서 주로 발생한다. 두 판이 서로 다가오는 수렴 경계에서는 한쪽 판이 다른 판 아래로 밀려 들어가는 섭입이 일어나며, 이 과정에서 막대한 에너지가 축적되었다가 한순간에 방출된다. 이것이 곧 지진이다. 두 판이 서로 멀어지는 발산 경계에서는 맨틀의 마그마가 솟아올라 새로운 해양 지각을 형성하며, 비교적 약한 지진이 수반된다. 두 판이 수평으로 어긋나며 스쳐 지나가는 변환 경계에서도 마찰로 인한 지진이 빈번히 발생하며, 미국의 샌안드레아스 단층이 대표적인 사례이다."
    },
    {
      id: "p3",
      text: "지진의 세기는 리히터 규모와 모멘트 규모로 측정된다. 리히터 규모는 지진계에 기록된 진폭을 로그 스케일로 환산한 값으로, 규모가 일 증가할 때마다 에너지는 약 삼십이 배 커진다. 모멘트 규모는 단층의 면적, 이동 거리, 암석의 강도를 종합하여 계산하며, 대규모 지진의 세기를 보다 정확하게 나타낸다. 규모 오 이상의 지진은 건물에 손상을 줄 수 있으며, 규모 칠 이상은 도시 전체를 파괴할 수 있는 대재앙급이다. 지진파는 크게 종파인 피파와 횡파인 에스파로 나뉘며, 피파가 더 빨리 전파되므로 지진 조기 경보 시스템의 기초로 활용된다."
    },
    {
      id: "p4",
      text: "지진 피해를 줄이기 위한 노력은 여러 방면에서 진행되고 있다. 내진 설계는 건물이 지진파의 흔들림을 흡수하거나 분산시키도록 구조를 설계하는 기술이며, 일본과 한국 등에서는 법률로 일정 규모 이상의 건축물에 내진 설계를 의무화하고 있다. 지진 조기 경보 시스템은 피파와 에스파 사이의 도달 시간 차이를 이용하여 수 초에서 수십 초의 대비 시간을 확보한다. 비록 짧은 시간이지만, 이를 통해 가스 밸브를 잠그고 대피하는 것만으로도 인명 피해를 크게 줄일 수 있다. 궁극적으로 지진 연구는 판의 움직임을 정밀하게 관측하여 위험 지역을 사전에 파악하고, 피해를 최소화하는 방향으로 발전하고 있다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 59 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "지구의 표면은 하나로 이어진 단단한 껍질이 아니라 여러 개의 판으로 나뉘어 있다." }],
      prompt: "이 문장이 설명하는 지구 표면의 특성으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "지구의 표면은 하나의 덩어리가 아니라 여러 판으로 나뉘어 있다." },
        { id: "B", text: "지구의 표면은 물로 이루어진 유연한 막이다." },
        { id: "C", text: "지구의 내부는 비어 있어 표면만 고체 상태이다." },
        { id: "D", text: "지구의 표면은 움직이지 않고 고정된 하나의 판이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "판 구조론은 지진, 화산 활동, 산맥 형성 등 지구의 대규모 지질 현상을 통합적으로 설명하는 핵심 틀이다." }],
      prompt: "판 구조론이 설명하는 현상에 해당하지 않는 것은?",
      choices: [
        { id: "A", text: "조석 간만의 차이." },
        { id: "B", text: "지진의 발생 원리." },
        { id: "C", text: "화산 활동의 원인." },
        { id: "D", text: "산맥의 형성 과정." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "판 구조론의 기본 개념과 지구 지질 현상을 설명하는 역할을 소개한다." },
        { id: "B", text: "특정 지진 사례를 중심으로 피해 규모를 분석하고 있다." },
        { id: "C", text: "지진 대비 기술의 발전 과정을 시대순으로 정리하고 있다." },
        { id: "D", text: "해양 탐사 기술의 종류와 원리를 설명하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "두 판이 서로 다가오는 수렴 경계에서는 한쪽 판이 다른 판 아래로 밀려 들어가는 섭입이 일어나며, 이 과정에서 막대한 에너지가 축적되었다가 한순간에 방출된다." }],
      prompt: "수렴 경계에서 지진이 발생하는 과정으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "판이 밀려 들어가면서 축적된 에너지가 갑자기 방출된다." },
        { id: "B", text: "두 판이 멀어지면서 새로운 지각이 형성된다." },
        { id: "C", text: "판이 수평으로 스쳐 지나가며 마찰이 발생한다." },
        { id: "D", text: "마그마가 솟아올라 화산이 폭발하면서 진동이 일어난다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "세 가지 판 경계 유형과 각각에서 발생하는 지진의 특성을 설명한다." },
        { id: "B", text: "지진의 규모를 측정하는 다양한 방법을 비교하고 있다." },
        { id: "C", text: "내진 설계의 원리와 실제 적용 사례를 다루고 있다." },
        { id: "D", text: "판의 이동 속도를 계산하는 수학적 공식을 제시하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "규모가 일 증가할 때마다 에너지는 약 삼십이 배 커진다." }],
      prompt: "리히터 규모에 대한 설명으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "규모 단위가 하나 올라갈 때마다 방출 에너지가 약 삼십이 배 증가한다." },
        { id: "B", text: "규모가 일 증가하면 피해 면적이 정확히 두 배가 된다." },
        { id: "C", text: "규모가 클수록 에너지가 작아지는 반비례 관계이다." },
        { id: "D", text: "규모는 지진파의 속도만으로 결정되는 수치이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "지진의 규모를 측정하는 방법과 지진파의 종류를 설명하고 있다." },
        { id: "B", text: "판의 이동 원리와 경계 유형을 분류하고 있다." },
        { id: "C", text: "지진 발생 후 구조 활동의 절차를 안내하고 있다." },
        { id: "D", text: "화산 활동과 지진의 상관관계를 부정하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "지진 조기 경보 시스템은 피파와 에스파 사이의 도달 시간 차이를 이용하여 수 초에서 수십 초의 대비 시간을 확보한다." }],
      prompt: "지진 조기 경보 시스템의 원리로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "빠른 피파와 느린 에스파의 도달 시간 차이를 활용한다." },
        { id: "B", text: "인공위성으로 판의 이동을 실시간 촬영하여 예측한다." },
        { id: "C", text: "동물의 이상 행동을 감지하여 경보를 발령한다." },
        { id: "D", text: "지하수의 수위 변화를 분석하여 지진을 예측한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "내진 설계와 조기 경보 등 지진 피해를 줄이기 위한 기술을 소개한다." },
        { id: "B", text: "판 구조론의 역사적 발전 과정을 정리하고 있다." },
        { id: "C", text: "지진 규모의 측정 단위를 상세히 비교하고 있다." },
        { id: "D", text: "특정 지진 사례의 피해 규모를 통계적으로 분석하고 있다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "판이 놓여 있는 바로 아래 층을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p1", "연약권")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "한쪽 판이 다른 판 아래로 밀려 들어가는 현상을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "섭입")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "변환 경계의 대표적인 사례로 언급된 단층은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "샌안드레아스 단층")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "리히터 규모에서 규모가 일 증가할 때 에너지는 약 몇 배 커지는가?",
      answerRanges: [findRange(paragraphs, "p3", "삼십이 배")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "지진파 중 더 빨리 전파되는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "피파")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "건물이 지진파의 흔들림을 흡수하도록 설계하는 기술을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "내진 설계")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "지진 조기 경보로 확보할 수 있는 대비 시간은 대략 얼마인가?",
      answerRanges: [findRange(paragraphs, "p4", "수 초에서 수십 초")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(59, "NONFICTION", paragraphs, timeline, confirmQuestions);
}


// ════════════════════════════════════════════════════════════════
// Day 60 — 문학(LITERATURE): 현대 시 감상 — 나무의 말
// ════════════════════════════════════════════════════════════════

function buildDay60() {
  const paragraphs = [
    {
      id: "p1",
      text: "학교 운동장 한편에 커다란 느티나무가 한 그루 서 있다. 줄기는 두 사람이 팔을 벌려야 겨우 감쌀 수 있을 만큼 굵고, 가지는 사방으로 뻗어 넓은 그늘을 드리운다. 봄이면 연두색 잎이 돋아나 바람에 살랑거리고, 여름이면 짙은 초록 잎이 뜨거운 햇볕을 가려 준다. 가을에는 노란 잎이 비처럼 쏟아져 운동장 한쪽을 금빛 카펫으로 덮고, 겨울에는 앙상한 가지만 남아 하늘의 별을 고스란히 보여 준다. 나는 이 나무를 칠 년째 바라보고 있다. 초등학교에 입학하던 날부터 지금까지 이 나무는 한자리에서 한 번도 움직이지 않았다."
    },
    {
      id: "p2",
      text: "사 학년 때 단짝 친구와 크게 다투고 혼자 울던 날, 나는 느티나무 아래 쪼그려 앉았다. 아무도 위로해 주지 않았지만, 나무 그늘이 내 주위를 감싸 주는 것만으로 마음이 조금 누그러졌다. 바람이 잎사귀를 흔들 때마다 나무가 고개를 끄덕이는 것 같았고, 그 소리가 괜찮다고 말해 주는 것 같았다. 오 학년 때 달리기 대회에서 꼴찌를 하고 창피해서 교실에 들어가기 싫던 날에도 나는 그 나무 아래로 갔다. 나무는 아무 말 없이 그늘만 내어 줬고, 나는 그 그늘 안에서 진정하고서야 교실로 돌아갈 수 있었다."
    },
    {
      id: "p3",
      text: "중학교에 올라와 다른 건물에서 수업을 듣게 되었지만, 나는 가끔 옛 운동장 쪽으로 발길을 돌린다. 느티나무는 변함없이 그 자리에 서 있다. 줄기에는 세월의 흔적이 더해져 울퉁불퉁한 마디가 늘었고, 가지 끝에는 새들의 둥지가 얹혀 있다. 나무를 올려다보면 지난 세월이 필름처럼 스쳐 지나간다. 울던 날, 웃던 날, 아무것도 아닌 평범한 날까지. 나무는 그 모든 날을 나와 함께 보냈다. 사람은 떠나기도 하고 변하기도 하지만, 이 나무만큼은 늘 같은 모습으로 나를 맞아 주었다."
    },
    {
      id: "p4",
      text: "어느 날 국어 시간에 선생님이 나무에 편지를 써 보라는 과제를 내셨다. 나는 주저 없이 느티나무에게 편지를 썼다. 네 그늘 아래에서 울 수 있어서 다행이었다고, 네가 한자리에 서 있어 주어서 고마웠다고. 편지를 쓰다가 문득 깨달았다. 나무가 내게 한 일은 특별한 것이 아니었다. 그저 그 자리에 있었을 뿐이다. 하지만 누군가 변함없이 그 자리에 있다는 것, 그것이야말로 가장 큰 위로라는 사실을 나는 이 나무에게서 배웠다. 졸업하고 이 학교를 떠나더라도 나는 가끔 이 나무를 보러 올 것이다. 나무는 말이 없지만, 내게 가장 많은 말을 해 준 친구이기 때문이다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 60 지문 길이: ${totalLen}자`);

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "이 나무는 한자리에서 한 번도 움직이지 않았다." }],
      prompt: "이 문장이 강조하는 느티나무의 속성으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "오랜 세월 변함없이 같은 자리를 지켜 온 한결같음이다." },
        { id: "B", text: "나무가 이동할 수 없다는 생물학적 한계를 지적하는 것이다." },
        { id: "C", text: "학교 측이 나무를 옮기지 않은 관리 소홀을 비판하는 것이다." },
        { id: "D", text: "나무가 성장하지 않고 크기가 변하지 않았다는 뜻이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "느티나무의 외양과 계절별 변화, 화자와의 오랜 인연을 소개한다." },
        { id: "B", text: "운동장의 시설 개선이 필요하다는 문제를 제기한다." },
        { id: "C", text: "느티나무의 생물학적 특성을 과학적으로 분석한다." },
        { id: "D", text: "화자가 나무를 벌목하고 싶어 하는 마음을 표현한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "바람이 잎사귀를 흔들 때마다 나무가 고개를 끄덕이는 것 같았고, 그 소리가 괜찮다고 말해 주는 것 같았다." }],
      prompt: "이 문장에 사용된 표현 기법으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "나무에 사람의 행동과 말을 부여하는 의인법이다." },
        { id: "B", text: "두 사물의 공통점을 직접 비교하는 직유법이다." },
        { id: "C", text: "반대되는 두 개념을 나열하는 대조법이다." },
        { id: "D", text: "같은 말을 반복하여 강조하는 반복법이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "힘든 순간마다 느티나무 아래에서 위로를 받은 경험이다." },
        { id: "B", text: "화자가 친구와 화해하는 과정을 그리고 있다." },
        { id: "C", text: "달리기 대회에서 우승하여 기쁨을 느끼는 장면이다." },
        { id: "D", text: "나무 그늘이 너무 어두워 불편했던 기억이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "사람은 떠나기도 하고 변하기도 하지만, 이 나무만큼은 늘 같은 모습으로 나를 맞아 주었다." }],
      prompt: "이 문장에서 '사람'과 '나무'를 대비한 효과로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "변하는 인간관계와 변함없는 나무를 대조하여 나무의 한결같음을 부각한다." },
        { id: "B", text: "사람보다 나무가 지능이 높다는 주장을 펼치고 있다." },
        { id: "C", text: "사람과의 관계가 무의미하다는 비관적 태도를 드러낸다." },
        { id: "D", text: "나무를 사람보다 높은 존재로 숭배하는 문화를 소개한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "중학생이 된 화자가 변함없는 나무를 보며 지난 세월을 회상한다." },
        { id: "B", text: "느티나무가 노화로 쓰러질 위기에 처한 상황을 서술한다." },
        { id: "C", text: "화자가 새로운 학교에 적응하지 못하고 힘들어하는 장면이다." },
        { id: "D", text: "새들의 둥지를 관찰하는 화자의 생태학적 관심을 보여 준다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "누군가 변함없이 그 자리에 있다는 것, 그것이야말로 가장 큰 위로라는 사실을 나는 이 나무에게서 배웠다." }],
      prompt: "화자가 나무에게서 배운 것으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "변함없이 존재해 주는 것 자체가 가장 큰 위로가 된다는 깨달음이다." },
        { id: "B", text: "나무를 잘 관리하면 경제적 가치가 높아진다는 교훈이다." },
        { id: "C", text: "사람보다 식물이 더 믿을 만하다는 불신의 표현이다." },
        { id: "D", text: "편지를 쓰면 문장력이 향상된다는 학습적 깨달음이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "나무는 말이 없지만, 내게 가장 많은 말을 해 준 친구이기 때문이다." }],
      prompt: "이 문장에 담긴 역설의 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "말없이 곁을 지켜 준 나무가 어떤 말보다 깊은 위로를 주었다는 뜻이다." },
        { id: "B", text: "나무가 실제로 인간의 말을 할 수 있다는 판타지적 설정이다." },
        { id: "C", text: "나무가 내는 소리가 시끄러워 불편했다는 불만의 표현이다." },
        { id: "D", text: "화자에게 친구가 없어서 나무를 친구로 삼은 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "편지를 쓰며 나무의 존재가 준 위로의 의미를 깨닫고 감사를 표한다." },
        { id: "B", text: "국어 수업에서 받은 과제의 형식과 제출 방법을 설명한다." },
        { id: "C", text: "느티나무를 다른 학교에 기증하는 과정을 서술한다." },
        { id: "D", text: "화자가 졸업 후 나무를 잊겠다는 결심을 밝힌다." }
      ],
      answerId: "A"
    }
  ]);

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "느티나무 줄기의 굵기를 어떻게 묘사하고 있는가?",
      answerRanges: [findRange(paragraphs, "p1", "두 사람이 팔을 벌려야 겨우 감쌀 수 있을 만큼")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "화자가 이 나무를 바라본 기간은 얼마인가?",
      answerRanges: [findRange(paragraphs, "p1", "칠 년")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "사 학년 때 화자가 느티나무 아래에서 한 행동은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "혼자 울던")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "오 학년 때 화자가 느티나무를 찾아간 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "달리기 대회에서 꼴찌를 하고 창피해서")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "국어 시간에 선생님이 낸 과제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "나무에 편지를 써 보라는")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "화자가 나무에게서 배운 '가장 큰 위로'란 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "변함없이 그 자리에 있다는 것")],
      scoring: confirmScoring, revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(60, "LITERATURE", paragraphs, timeline, confirmQuestions);
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
    { day: 56, subArea: "LITERATURE", build: buildDay56 },
    { day: 57, subArea: "NONFICTION", build: buildDay57 },
    { day: 58, subArea: "LITERATURE", build: buildDay58 },
    { day: 59, subArea: "NONFICTION", build: buildDay59 },
    { day: 60, subArea: "LITERATURE", build: buildDay60 },
  ];

  const contents = [];
  for (const b of builders) {
    const content = b.build();
    contents.push({ day: b.day, subArea: b.subArea, content });

    // 길이 검증
    const paras = content.payload.passage.paragraphs;
    const len = charLen(paras);
    if (len < 1150 || len > 1250) {
      console.warn(`⚠ 경고: Day ${b.day} 지문 길이 ${len}자 (목표 1150~1250)`);
    }

    // 복기 카드 수 검증
    const cardCount = content.payload.recall.cards.length;
    if (cardCount !== 8) {
      console.error(`오류: Day ${b.day} 복기 카드 ${cardCount}장 (목표 8장)`);
      process.exit(1);
    }

    // 확인 문항 수 검증
    const qCount = content.payload.confirm.questions.length;
    if (qCount < 5 || qCount > 8) {
      console.error(`오류: Day ${b.day} 확인 문항 ${qCount}개 (목표 5~8)`);
      process.exit(1);
    }

    console.log(`Day ${b.day}: 길이=${len}자, 정독=${content.payload.intensive.timeline.length}단계, 복기=${cardCount}장, 확인=${qCount}문항`);
  }

  // 배치 파일 최신 상태 읽기 후 교체
  console.log('\n배치 파일 읽기...');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  console.log(`배치 파일 items 수: ${batch.items.length}`);

  for (const { day, subArea, content } of contents) {
    const idx = day - 1; // items[55]~[59]
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
