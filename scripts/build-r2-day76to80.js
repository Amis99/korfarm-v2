/**
 * 러셀2(RUSSELL_2) Day 76~80 일일독해 콘텐츠 빌더
 * - Day 76: 문학(LITERATURE), Day 77: 비문학(NONFICTION)
 * - Day 78: 문학(LITERATURE), Day 79: 비문학(NONFICTION)
 * - Day 80: 문학(LITERATURE)
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
    const j = (rng + i * 7) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── 콘텐츠 골격 생성 ───

function assembleFull(dayIndex, subArea, contentId, title) {
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

// 정독 타임라인 빌더
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
// Day 76 — 문학(LITERATURE): 현대 소설 — 할아버지의 시계
// ════════════════════════════════════════════════════════════════

function buildDay76() {
  const paragraphs = [
    {
      id: "p1",
      text: "거실 벽에는 오래된 괘종시계가 걸려 있었다. 할아버지가 결혼할 때 장인어른에게 받은 것이라고 했다. 나무 틀은 군데군데 금이 갔고, 유리 너머로 보이는 추는 녹이 슬어 있었지만, 매 정각마다 낮고 깊은 종소리를 울렸다. 그 소리는 집안 어디에서나 들렸고, 새벽 두 시에도, 한여름 낮 열두 시에도 어김없이 시간을 알렸다. 나는 어릴 때부터 그 시계 소리에 맞춰 하루를 살았다. 아침 일곱 시 종이 울리면 이불을 걷고 일어나고, 저녁 여섯 시에 밥을 먹고, 밤 아홉 시에 잠자리에 들었다. 그래서 나에게 시간이란 숫자가 아니라 종소리였다."
    },
    {
      id: "p2",
      text: "할아버지는 매주 일요일 아침이면 의자를 가져다 시계 앞에 놓고 올라서서 태엽을 감았다. 구부정한 등을 편 채 두 팔을 들어 올려 태엽 구멍에 열쇠를 넣고 천천히 돌리는 모습은 마치 어떤 의식을 치르는 것 같았다. 태엽을 다 감고 나면 할아버지는 내려와 소파에 앉아 차를 마시며 시계를 올려다보았다. 그때의 표정은 오래된 친구를 만난 사람처럼 편안하고 다정했다. 나는 할아버지에게 왜 새 시계를 사지 않느냐고 물은 적이 있다. 할아버지는 웃으며 말했다. 이 시계에는 네 할머니와 함께 보낸 세월이 들어 있어서, 바꿀 수가 없다고."
    },
    {
      id: "p3",
      text: "할아버지가 돌아가신 뒤, 아버지는 시계를 그대로 두었다. 하지만 태엽을 감는 사람이 없어지자 시계는 멈추었다. 거실에 종소리가 울리지 않자 집안이 묘하게 달라졌다. 시간이 사라진 것은 아닌데, 시간을 느끼는 방식이 바뀐 것이다. 스마트폰과 전자시계가 정확한 시각을 알려 주었지만, 그것은 종소리처럼 공간을 채우지 못했다. 소리 없이 흐르는 시간은 마치 발자국 없는 눈밭 같아서, 누군가 지나갔는지조차 알 수 없었다. 나는 그때야 비로소 시계가 단순히 시간을 재는 도구가 아니었음을 깨달았다."
    },
    {
      id: "p4",
      text: "어느 날 나는 할아버지가 쓰던 의자를 가져다 시계 앞에 놓고 올라섰다. 열쇠는 시계 옆 서랍에 있었다. 녹이 슨 태엽 구멍에 열쇠를 넣고 천천히 돌리자 톱니바퀴가 삐걱거리며 움직이기 시작했다. 추가 좌우로 흔들리고, 잠시 후 정각을 알리는 종소리가 울렸다. 낮고 깊은 그 울림이 거실을 채우는 순간, 멈추었던 시간이 다시 흐르기 시작한 것 같았다. 할아버지가 태엽을 감던 손길, 할머니와 함께 보낸 세월, 그 모든 것이 종소리 안에 살아 있었다. 나는 매주 일요일 아침, 할아버지처럼 태엽을 감기로 했다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 76 지문 길이: ${totalLen}자`);

  const content = assembleFull(76, "LITERATURE", "dr-r2-076", "일일 독해(러셀 2) Day 76 문학");

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "거실 벽에는 오래된 괘종시계가 걸려 있었다." }],
      prompt: "첫 문장에서 '오래된 괘종시계'가 암시하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "오랜 세월의 무게와 가족사가 담긴 상징적 사물임을 암시한다." },
        { id: "B", text: "최신 기술로 만들어진 전자 제품을 소개하고 있다." },
        { id: "C", text: "시계가 고장 나서 즉시 수리해야 한다는 긴박감을 조성한다." },
        { id: "D", text: "화자가 시계 수집을 취미로 삼고 있음을 알려 준다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "나에게 시간이란 숫자가 아니라 종소리였다." }],
      prompt: "이 문장이 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "화자에게 시간은 추상적 숫자가 아닌 감각적 경험으로 존재했다." },
        { id: "B", text: "화자가 숫자를 읽지 못해 시계를 볼 수 없었다는 뜻이다." },
        { id: "C", text: "종소리가 너무 시끄러워 시간 인식에 방해가 되었다는 뜻이다." },
        { id: "D", text: "디지털 시계보다 아날로그 시계의 정확도가 높다는 의미이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "오래된 괘종시계가 화자의 일상과 시간 감각의 중심이 되어 왔다." },
        { id: "B", text: "할아버지가 시계를 직접 만든 과정을 자세히 설명하고 있다." },
        { id: "C", text: "시계의 구조와 작동 원리를 과학적으로 분석하고 있다." },
        { id: "D", text: "화자가 시계 소리 때문에 잠을 자지 못하는 고충을 토로한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "구부정한 등을 편 채 두 팔을 들어 올려 태엽 구멍에 열쇠를 넣고 천천히 돌리는 모습은 마치 어떤 의식을 치르는 것 같았다." }],
      prompt: "할아버지의 태엽 감기를 '의식'에 비유한 효과로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "일상적 행위에 경건함과 소중함을 부여하여 시계의 의미를 강조한다." },
        { id: "B", text: "할아버지가 종교 의식에 참여하고 있음을 사실적으로 묘사한다." },
        { id: "C", text: "태엽 감기가 매우 위험한 작업이라는 긴장감을 조성한다." },
        { id: "D", text: "시계의 기계적 정밀함을 과학적으로 설명하려는 의도이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "이 시계에는 네 할머니와 함께 보낸 세월이 들어 있어서, 바꿀 수가 없다고." }],
      prompt: "할아버지의 이 말에서 알 수 있는 시계의 가치로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "시계는 단순한 도구가 아니라 할머니와의 추억이 깃든 정서적 유산이다." },
        { id: "B", text: "시계가 고가의 골동품이라 경제적 가치가 매우 높다." },
        { id: "C", text: "새 시계를 살 경제적 여유가 없어서 어쩔 수 없이 사용한다." },
        { id: "D", text: "시계의 디자인이 현대 인테리어와 잘 어울리기 때문이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "할아버지에게 시계는 할머니와의 세월이 담긴 소중한 존재였다." },
        { id: "B", text: "시계 수리 기술자인 할아버지의 직업적 전문성을 보여 준다." },
        { id: "C", text: "할아버지가 새로운 취미를 찾아 시계 수집을 시작한 이야기이다." },
        { id: "D", text: "가족 간의 갈등으로 시계를 둘러싼 다툼이 벌어지고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "소리 없이 흐르는 시간은 마치 발자국 없는 눈밭 같아서, 누군가 지나갔는지조차 알 수 없었다." }],
      prompt: "이 비유가 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "종소리가 사라지자 시간의 흐름을 체감할 수 없게 되었다는 뜻이다." },
        { id: "B", text: "눈이 와서 시계가 얼어붙어 작동하지 않게 되었다는 뜻이다." },
        { id: "C", text: "디지털 시계가 더 정확하게 시간을 알려 주므로 불편이 없다는 뜻이다." },
        { id: "D", text: "집안에 사람이 없어 조용해졌다는 사실을 설명하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "나는 그때야 비로소 시계가 단순히 시간을 재는 도구가 아니었음을 깨달았다." }],
      prompt: "화자가 깨달은 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "시계는 가족의 기억과 일상의 리듬을 만들어 주는 존재였다." },
        { id: "B", text: "시계는 매우 비싼 기계이므로 소중히 다루어야 한다." },
        { id: "C", text: "전자시계보다 괘종시계의 정확도가 훨씬 높다는 사실이다." },
        { id: "D", text: "시계가 없어도 시간은 정확하게 알 수 있다는 깨달음이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "시계가 멈추자 화자는 그 시계가 지닌 의미를 비로소 깨닫게 된다." },
        { id: "B", text: "아버지가 시계를 버리려 하자 화자가 반대하는 갈등이 나타난다." },
        { id: "C", text: "전자시계의 편리함이 괘종시계를 완전히 대체한 모습을 그린다." },
        { id: "D", text: "할아버지가 생전에 시계를 수리하는 과정을 회상하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "낮고 깊은 그 울림이 거실을 채우는 순간, 멈추었던 시간이 다시 흐르기 시작한 것 같았다." }],
      prompt: "이 문장에서 '멈추었던 시간이 다시 흐르기 시작한 것'이 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "종소리와 함께 가족의 기억과 일상의 연속성이 회복되었다는 뜻이다." },
        { id: "B", text: "물리적 시간이 실제로 정지했다가 다시 움직였다는 뜻이다." },
        { id: "C", text: "시계가 고장 나서 시간 표시가 잘못되었다는 뜻이다." },
        { id: "D", text: "화자가 새로운 시계를 구입하여 교체했다는 뜻이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "나는 매주 일요일 아침, 할아버지처럼 태엽을 감기로 했다." }],
      prompt: "화자가 태엽을 감기로 결심한 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "할아버지의 행위를 계승하며 가족의 기억과 유대를 이어 가려는 것이다." },
        { id: "B", text: "시계 수리를 직업으로 삼기 위해 기술을 연습하려는 것이다." },
        { id: "C", text: "아버지의 명령에 따라 의무적으로 시계를 관리하는 것이다." },
        { id: "D", text: "할아버지의 유언장에 시계를 감으라는 조건이 있었기 때문이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "화자가 시계의 태엽을 감음으로써 할아버지의 기억과 가족의 시간을 잇는다." },
        { id: "B", text: "시계가 완전히 고장 나서 더 이상 사용할 수 없게 되었다." },
        { id: "C", text: "화자가 시계를 팔아 새로운 가전제품을 구입하려 한다." },
        { id: "D", text: "할아버지의 유품을 정리하며 과거와 단절하는 모습을 그린다." }
      ],
      answerId: "A"
    }
  ]);

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "괘종시계는 원래 누구에게서 받은 것인가?",
      answerRanges: [findRange(paragraphs, "p1", "장인어른")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "할아버지가 매주 태엽을 감은 요일은 언제인가?",
      answerRanges: [findRange(paragraphs, "p2", "일요일")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "할아버지가 시계를 바꿀 수 없다고 한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "네 할머니와 함께 보낸 세월이 들어 있어서")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "시계가 멈춘 뒤 소리 없이 흐르는 시간을 화자는 무엇에 비유하였는가?",
      answerRanges: [findRange(paragraphs, "p3", "발자국 없는 눈밭")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "화자가 태엽을 감자 가장 먼저 움직인 시계의 부품은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "톱니바퀴")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "화자는 할아버지처럼 무엇을 하기로 결심하였는가?",
      answerRanges: [findRange(paragraphs, "p4", "태엽을 감기로 했다")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: buildRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
}


// ════════════════════════════════════════════════════════════════
// Day 77 — 비문학(NONFICTION): 미세 플라스틱의 환경 문제
// ════════════════════════════════════════════════════════════════

function buildDay77() {
  const paragraphs = [
    {
      id: "p1",
      text: "미세 플라스틱이란 크기가 5밀리미터 이하인 매우 작은 플라스틱 조각을 말한다. 이들은 처음부터 작은 크기로 제조되는 1차 미세 플라스틱과, 큰 플라스틱 제품이 자외선이나 물리적 마모에 의해 부서져 생기는 2차 미세 플라스틱으로 나뉜다. 1차 미세 플라스틱은 세안제, 치약, 각질 제거제 등에 포함된 마이크로비즈가 대표적이며, 하수 처리 과정에서 완전히 걸러지지 않아 수계로 유입된다. 2차 미세 플라스틱은 바다에 버려진 페트병, 비닐봉지, 어망 등이 파도와 자외선에 의해 잘게 쪼개져 생성된다. 현재 전 세계 바다에는 약 5조 개 이상의 미세 플라스틱 조각이 떠다니고 있는 것으로 추정된다."
    },
    {
      id: "p2",
      text: "미세 플라스틱은 해양 생태계에 매우 심각한 위협을 가한다. 동물성 플랑크톤과 같은 작은 생물이 미세 플라스틱을 먹이로 착각하여 섭취하면, 소화기관이 막히거나 영양 결핍에 빠질 수 있다. 이렇게 섭취된 미세 플라스틱은 먹이 사슬을 따라 상위 포식자에게 전달되며, 결국 참치나 고래 같은 대형 해양 동물의 체내에서도 검출된다. 특히 미세 플라스틱의 표면에는 바다에 녹아 있는 중금속이나 잔류성 유기 오염 물질이 흡착되기 쉬워, 생물이 이를 섭취하면 독성 물질에 노출되는 이중의 위험이 발생한다."
    },
    {
      id: "p3",
      text: "미세 플라스틱의 위험은 해양에 국한되지 않는다. 최근 연구에 따르면 미세 플라스틱은 토양, 대기, 식수, 심지어 인체 혈액과 폐 조직에서도 발견되었다. 합성 섬유로 만든 옷을 세탁할 때 빠져나오는 섬유 조각이 하수를 통해 강과 바다로 흘러가며, 대기 중에 떠다니는 미세 플라스틱은 호흡을 통해 인체에 유입될 수 있다. 플라스틱에 첨가된 가소제나 난연제 같은 화학 물질은 내분비 교란, 생식 기능 저하, 면역 체계 이상 등을 유발할 가능성이 있어 인체 건강에 대한 우려가 커지고 있다."
    },
    {
      id: "p4",
      text: "이 문제에 대응하기 위해 국제 사회는 다양한 노력을 기울이고 있다. 유럽연합은 화장품 내 마이크로비즈 사용을 금지하였고, 여러 국가에서 일회용 플라스틱 제품의 생산과 유통을 제한하는 법률을 제정하였다. 과학계에서는 플라스틱을 분해하는 미생물이나 효소를 활용한 생분해 기술 연구가 활발히 진행 중이다. 그러나 이미 환경에 축적된 방대한 양의 미세 플라스틱을 완전히 제거하는 것은 현실적으로 매우 어렵기 때문에, 근본적인 해결책은 플라스틱의 사용량 자체를 줄이고 재활용률을 높이는 사회적 노력에 있다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 77 지문 길이: ${totalLen}자`);

  const content = assembleFull(77, "NONFICTION", "dr-r2-077", "일일 독해(러셀 2) Day 77 비문학");

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "미세 플라스틱이란 크기가 5밀리미터 이하인 매우 작은 플라스틱 조각을 말한다." }],
      prompt: "미세 플라스틱의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "크기가 5밀리미터 이하인 매우 작은 플라스틱 조각이다." },
        { id: "B", text: "눈에 보이지 않을 정도로 작은 나노미터 크기의 물질이다." },
        { id: "C", text: "자연적으로 분해되는 친환경 플라스틱의 한 종류이다." },
        { id: "D", text: "재활용이 가능한 대형 플라스틱 제품을 가리킨다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "1차 미세 플라스틱은 세안제, 치약, 각질 제거제 등에 포함된 마이크로비즈가 대표적이며, 하수 처리 과정에서 완전히 걸러지지 않아 수계로 유입된다." }],
      prompt: "1차 미세 플라스틱이 수계로 유입되는 경로로 적절한 것은?",
      choices: [
        { id: "A", text: "세안제 등에 포함된 마이크로비즈가 하수 처리에서 걸러지지 않아 유입된다." },
        { id: "B", text: "공장에서 대형 플라스틱을 자외선으로 분해하여 방류한다." },
        { id: "C", text: "어선에서 사용하는 그물이 부서져 바다에 직접 들어간다." },
        { id: "D", text: "빗물에 의해 도로 위의 타이어 가루가 강으로 흘러 들어간다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "미세 플라스틱의 정의, 유형, 발생 경로와 해양 분포 현황을 소개한다." },
        { id: "B", text: "미세 플라스틱의 해양 생태계에 대한 위협을 분석한다." },
        { id: "C", text: "미세 플라스틱 문제의 해결을 위한 국제적 노력을 설명한다." },
        { id: "D", text: "인체에 미치는 미세 플라스틱의 건강 영향을 경고한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "동물성 플랑크톤과 같은 작은 생물이 미세 플라스틱을 먹이로 착각하여 섭취하면, 소화기관이 막히거나 영양 결핍에 빠질 수 있다." }],
      prompt: "미세 플라스틱이 작은 해양 생물에 미치는 영향으로 적절한 것은?",
      choices: [
        { id: "A", text: "먹이로 착각해 섭취하면 소화기관이 막히거나 영양 결핍에 빠진다." },
        { id: "B", text: "미세 플라스틱이 영양소 역할을 하여 생물의 성장을 촉진한다." },
        { id: "C", text: "플라스틱의 열에 의해 수온이 상승하여 생물이 이동한다." },
        { id: "D", text: "플라스틱 표면에서 유익한 미생물이 번식하여 생태계가 풍성해진다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "미세 플라스틱의 표면에는 바다에 녹아 있는 중금속이나 잔류성 유기 오염 물질이 흡착되기 쉬워, 생물이 이를 섭취하면 독성 물질에 노출되는 이중의 위험이 발생한다." }],
      prompt: "'이중의 위험'이 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "플라스틱 자체의 해로움에 더해 표면에 흡착된 유해 물질까지 섭취하게 된다." },
        { id: "B", text: "해양 생물이 두 번에 걸쳐 동일한 미세 플라스틱을 섭취하게 된다." },
        { id: "C", text: "육상 동물과 해양 동물이 동시에 피해를 입는다는 뜻이다." },
        { id: "D", text: "플라스틱이 두 가지 색상으로 나뉘어 생물이 혼란을 겪는다는 뜻이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "미세 플라스틱이 먹이 사슬을 통해 해양 생태계 전반에 위협을 가한다." },
        { id: "B", text: "미세 플라스틱의 생산 과정을 시간순으로 설명하고 있다." },
        { id: "C", text: "해양 오염을 막기 위한 정부 정책의 효과를 평가하고 있다." },
        { id: "D", text: "미세 플라스틱이 인체 건강에 미치는 영향을 다루고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "미세 플라스틱은 토양, 대기, 식수, 심지어 인체 혈액과 폐 조직에서도 발견되었다." }],
      prompt: "이 문장이 강조하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "미세 플라스틱의 오염 범위가 해양을 넘어 인체까지 확대되었다는 사실이다." },
        { id: "B", text: "미세 플라스틱이 인체에 유익한 영양소를 공급한다는 연구 결과이다." },
        { id: "C", text: "토양과 대기에서는 미세 플라스틱이 자연 분해된다는 사실이다." },
        { id: "D", text: "식수에 포함된 미세 플라스틱이 건강에 전혀 무해하다는 주장이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "미세 플라스틱의 위험이 해양을 넘어 인체 건강까지 위협하고 있다." },
        { id: "B", text: "합성 섬유 의류 산업의 경제적 성장 과정을 서술하고 있다." },
        { id: "C", text: "대기 오염의 주된 원인이 미세 플라스틱임을 증명하고 있다." },
        { id: "D", text: "하수 처리 기술의 발전으로 미세 플라스틱이 줄어들고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "유럽연합은 화장품 내 마이크로비즈 사용을 금지하였고, 여러 국가에서 일회용 플라스틱 제품의 생산과 유통을 제한하는 법률을 제정하였다." }],
      prompt: "미세 플라스틱 문제에 대한 국제 사회의 대응으로 적절한 것은?",
      choices: [
        { id: "A", text: "마이크로비즈 사용 금지와 일회용 플라스틱 규제 법률을 시행하고 있다." },
        { id: "B", text: "모든 플라스틱 제품의 생산을 전면 중단하였다." },
        { id: "C", text: "미세 플라스틱을 바다에서 수거하여 완전히 제거하는 데 성공하였다." },
        { id: "D", text: "플라스틱 대신 유리 제품만 사용하도록 국제 협약을 체결하였다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "근본적인 해결책은 플라스틱의 사용량 자체를 줄이고 재활용률을 높이는 사회적 노력에 있다." }],
      prompt: "필자가 제시하는 근본적 해결책으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "플라스틱 사용량을 줄이고 재활용률을 높이는 사회적 노력이다." },
        { id: "B", text: "미생물을 이용해 바다의 모든 플라스틱을 즉시 분해하는 것이다." },
        { id: "C", text: "플라스틱 대체 소재를 개발하여 기존 플라스틱을 모두 교체하는 것이다." },
        { id: "D", text: "환경 오염에 대한 연구를 중단하고 적응하는 방향을 모색하는 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "미세 플라스틱 문제에 대한 국제적 대응과 근본적 해결책을 제시한다." },
        { id: "B", text: "미세 플라스틱이 해양 생태계에 미치는 영향을 상세히 분석한다." },
        { id: "C", text: "1차와 2차 미세 플라스틱의 차이를 비교하여 설명한다." },
        { id: "D", text: "인체에서 발견된 미세 플라스틱의 양을 수치로 제시한다." }
      ],
      answerId: "A"
    }
  ]);

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "미세 플라스틱의 기준 크기는 몇 밀리미터 이하인가?",
      answerRanges: [findRange(paragraphs, "p1", "5밀리미터")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "1차 미세 플라스틱의 대표적인 예로 언급된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "마이크로비즈")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "미세 플라스틱 표면에 흡착되기 쉬운 유해 물질 두 가지는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "중금속이나 잔류성 유기 오염 물질")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "합성 섬유 옷에서 미세 플라스틱이 발생하는 과정은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "세탁할 때 빠져나오는 섬유 조각")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "플라스틱 첨가 화학 물질이 유발할 수 있는 건강 문제로 언급된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "내분비 교란")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "과학계에서 연구 중인 생분해 기술은 무엇을 활용하는가?",
      answerRanges: [findRange(paragraphs, "p4", "미생물이나 효소")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "필자가 제시한 근본적 해결책의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "플라스틱의 사용량 자체를 줄이고 재활용률을 높이는")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: buildRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
}


// ════════════════════════════════════════════════════════════════
// Day 78 — 문학(LITERATURE): 현대 소설 — 도서관의 비밀
// ════════════════════════════════════════════════════════════════

function buildDay78() {
  const paragraphs = [
    {
      id: "p1",
      text: "전학 온 첫날, 나는 교실 어디에도 어울리지 못했다. 쉬는 시간마다 책상에 엎드려 있다가 점심시간이 되자 혼자 학교를 둘러보기로 했다. 운동장을 지나 본관 뒤편으로 돌아가니 낡은 건물 하나가 보였다. 문 위에 '도서관'이라고 쓰인 팻말이 바래진 채 걸려 있었다. 문을 밀고 들어가자 먼지 냄새와 오래된 종이 냄새가 섞여 코를 간질였다. 천장까지 닿는 나무 서가에는 수천 권의 책이 빼곡하게 꽂혀 있었고, 창으로 들어온 햇살이 먼지 입자 사이를 비추며 금빛 기둥을 만들었다. 안쪽 구석에 낡은 소파가 하나 있었는데, 쿠션이 내려앉아 누군가 오래 거기 앉았던 것 같았다."
    },
    {
      id: "p2",
      text: "나는 그 소파에 앉아 눈앞의 서가를 훑었다. 손이 닿는 곳에 있던 책 한 권을 꺼내 펼치니, 첫 페이지에 연필로 쓴 메모가 있었다. '이 책을 읽는 사람에게. 외로우면 창밖을 보세요. 하늘은 누구에게나 같으니까.' 필체는 둥글고 정갈했다. 누가 쓴 것인지 알 수 없었지만, 그 한 줄이 가슴에 닿았다. 나는 다른 책도 꺼내 보았다. 놀랍게도 여러 권의 책 첫 페이지에 비슷한 메모가 남겨져 있었다. '슬플 때는 이 책의 42쪽을 읽어 보세요.' '웃고 싶으면 86쪽부터.' '힘들면 이 문장을 소리 내어 읽어 보세요.' 이 도서관을 누군가 특별한 방식으로 가꾸어 온 것이 분명했다."
    },
    {
      id: "p3",
      text: "다음 날부터 나는 매일 도서관에 갔다. 메모의 안내를 따라 책을 읽었고, 어느 날은 42쪽에서 웃었고, 어느 날은 86쪽에서 울었다. 한 달이 지나자 나는 이 메모를 남긴 사람이 궁금해졌다. 도서관 대출 기록부를 뒤져 보았지만 단서는 없었다. 그러던 어느 오후, 서가 맨 위 칸에서 먼지가 잔뜩 쌓인 노트 한 권을 발견했다. 표지에는 '도서관 일지'라고 쓰여 있었고, 안에는 날짜별로 메모가 기록되어 있었다. 작성자는 이 학교를 졸업한 선배였다. 선배는 혼자 보내는 시간이 많았던 자신처럼 외로운 학생이 있을 것을 생각하여, 책 속에 위로의 메모를 남기기 시작한 것이었다."
    },
    {
      id: "p4",
      text: "노트의 마지막 페이지에는 이런 글이 적혀 있었다. '언젠가 이 노트를 발견한 사람이, 다시 누군가에게 위로를 건네 주기를 바랍니다. 도서관은 책만 있는 곳이 아니라 마음이 쉬는 곳이니까요.' 나는 한동안 그 문장을 바라보았다. 전학 와서 혼자였던 나를 위로해 준 것은 교실의 친구가 아니라 이름도 모르는 선배가 책 속에 남긴 메모였다. 나는 연필을 꺼내 빈 책의 첫 페이지에 메모를 쓰기 시작했다. '이 책을 집어 든 사람에게. 당신은 혼자가 아닙니다.' 선배가 시작한 작은 전통이 나를 통해 이어지는 순간이었다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 78 지문 길이: ${totalLen}자`);

  const content = assembleFull(78, "LITERATURE", "dr-r2-078", "일일 독해(러셀 2) Day 78 문학");

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "전학 온 첫날, 나는 교실 어디에도 어울리지 못했다." }],
      prompt: "첫 문장에서 드러나는 화자의 심리 상태로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "새로운 환경에 적응하지 못하는 외로움과 소외감을 느끼고 있다." },
        { id: "B", text: "새 학교에 대한 기대와 설렘으로 가득 차 있다." },
        { id: "C", text: "전학 경험이 많아 능숙하게 새 교실에 적응하고 있다." },
        { id: "D", text: "친구들이 먼저 다가와서 금방 어울리게 된 상황이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "창으로 들어온 햇살이 먼지 입자 사이를 비추며 금빛 기둥을 만들었다." }],
      prompt: "이 묘사의 효과로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "낡은 도서관에 신비롭고 따뜻한 분위기를 부여하여 특별한 공간임을 암시한다." },
        { id: "B", text: "도서관이 너무 더러워서 관리가 필요하다는 점을 비판한다." },
        { id: "C", text: "건물이 곧 철거될 것이라는 불안감을 조성한다." },
        { id: "D", text: "화자가 알레르기 반응을 일으킬 위험을 경고한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "외로운 화자가 학교 뒤편의 낡은 도서관을 우연히 발견한다." },
        { id: "B", text: "화자가 운동장에서 새 친구를 사귀고 함께 도서관에 간다." },
        { id: "C", text: "도서관 건물의 구조와 건축 양식을 전문적으로 분석한다." },
        { id: "D", text: "화자가 전학을 거부하고 이전 학교로 돌아가려는 모습을 그린다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "이 책을 읽는 사람에게. 외로우면 창밖을 보세요. 하늘은 누구에게나 같으니까." }],
      prompt: "이 메모가 화자에게 주는 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "이름 모를 누군가의 위로가 외로운 화자에게 공감과 위안을 전한다." },
        { id: "B", text: "날씨를 확인하라는 실용적인 조언을 제공한다." },
        { id: "C", text: "도서관 이용 규칙을 안내하는 공지 사항에 해당한다." },
        { id: "D", text: "하늘이 모든 사람에게 다르게 보인다는 과학적 사실을 알려 준다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "이 도서관을 누군가 특별한 방식으로 가꾸어 온 것이 분명했다." }],
      prompt: "'특별한 방식'이 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "책 속에 위로의 메모를 남겨 이 공간을 정서적 안식처로 만든 것이다." },
        { id: "B", text: "책을 새로 구입하여 서가를 채운 물리적 관리를 가리킨다." },
        { id: "C", text: "도서관 건물을 리모델링하여 현대적으로 바꾼 것이다." },
        { id: "D", text: "전자책 시스템을 도입하여 디지털화한 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "화자가 책 속 메모들을 발견하고 누군가의 특별한 배려를 감지한다." },
        { id: "B", text: "화자가 도서관에서 친구를 만나 함께 책을 읽는 장면이다." },
        { id: "C", text: "도서관의 대출 시스템과 운영 방식을 설명하고 있다." },
        { id: "D", text: "화자가 책 속 메모를 불쾌하게 여기고 지우려 한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "선배는 혼자 보내는 시간이 많았던 자신처럼 외로운 학생이 있을 것을 생각하여, 책 속에 위로의 메모를 남기기 시작한 것이었다." }],
      prompt: "선배가 메모를 남긴 동기로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "자신과 같이 외로운 학생에게 위로를 전하기 위해서였다." },
        { id: "B", text: "도서관 사서의 지시에 따라 의무적으로 작성한 것이다." },
        { id: "C", text: "학교 과제의 일환으로 독서 감상문을 기록한 것이다." },
        { id: "D", text: "책의 내용이 잘못되어 있어 수정하려는 목적이었다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "화자가 도서관 일지를 통해 메모를 남긴 선배의 정체와 동기를 알게 된다." },
        { id: "B", text: "화자가 대출 기록부에서 범인을 찾아내는 추리 과정을 그린다." },
        { id: "C", text: "선배가 직접 화자를 찾아와 메모의 비밀을 설명해 준다." },
        { id: "D", text: "화자가 도서관을 떠나 교실에서 새 친구를 사귀게 된다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "도서관은 책만 있는 곳이 아니라 마음이 쉬는 곳이니까요." }],
      prompt: "이 문장이 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "도서관은 지식뿐 아니라 정서적 위안과 휴식을 제공하는 공간이다." },
        { id: "B", text: "도서관에서는 잠을 자도 된다는 운영 규칙을 안내한다." },
        { id: "C", text: "책보다 편안한 의자가 도서관의 핵심 시설이라는 뜻이다." },
        { id: "D", text: "도서관은 공부하는 곳이 아니라 놀이 공간이라는 뜻이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "선배가 시작한 작은 전통이 나를 통해 이어지는 순간이었다." }],
      prompt: "이 문장에서 드러나는 화자의 행동이 갖는 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "받은 위로를 다음 사람에게 전하며 선배의 뜻을 계승한다." },
        { id: "B", text: "화자가 도서관의 새로운 관리인으로 공식 임명된다." },
        { id: "C", text: "선배의 노트를 복사하여 학교 전체에 배포하려 한다." },
        { id: "D", text: "화자가 메모를 모두 지우고 새로운 규칙을 만든다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "화자가 선배의 뜻을 이어받아 직접 메모를 남기며 위로의 전통을 계승한다." },
        { id: "B", text: "화자가 도서관을 폐쇄하고 다른 공간에서 새로운 활동을 시작한다." },
        { id: "C", text: "선배가 졸업 후 학교를 방문하여 화자와 직접 만나는 장면이다." },
        { id: "D", text: "화자가 교실 친구들에게 도서관의 비밀을 공개하는 장면이다." }
      ],
      answerId: "A"
    }
  ]);

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "화자가 도서관을 발견하게 된 계기는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "점심시간이 되자 혼자 학교를 둘러보기로 했다")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "책 첫 페이지의 메모에서 외로울 때 보라고 한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "창밖")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "메모를 남긴 사람의 정체를 밝힌 단서는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "도서관 일지")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "메모를 남긴 선배가 메모를 쓰기 시작한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "외로운 학생이 있을 것을 생각하여")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "선배가 노트 마지막에 도서관을 무엇이라고 표현하였는가?",
      answerRanges: [findRange(paragraphs, "p4", "마음이 쉬는 곳")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "화자가 빈 책의 첫 페이지에 쓴 메모의 핵심 문장은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "당신은 혼자가 아닙니다")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: buildRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
}


// ════════════════════════════════════════════════════════════════
// Day 79 — 비문학(NONFICTION): 한국의 갯벌 생태계
// ════════════════════════════════════════════════════════════════

function buildDay79() {
  const paragraphs = [
    {
      id: "p1",
      text: "갯벌은 밀물 때 바닷물에 잠기고 썰물 때 드러나는 해안의 넓은 퇴적 지형을 말한다. 한국의 서해안과 남해안에는 세계적으로 손꼽히는 규모의 갯벌이 발달해 있다. 한반도 서해안의 조수 간만의 차이는 최대 약 9미터에 달하며, 이처럼 큰 조차와 완만한 경사의 해안 지형이 갯벌 형성의 핵심 조건이 된다. 갯벌의 퇴적물은 강에서 운반된 점토, 실트, 모래 등으로 구성되며, 입자의 크기에 따라 펄갯벌, 모래갯벌, 혼합갯벌로 분류된다. 서해안에는 입자가 고운 펄갯벌이 넓게 분포하고, 남해안의 섬 주변에는 모래갯벌과 혼합갯벌이 주로 나타난다."
    },
    {
      id: "p2",
      text: "갯벌은 다양한 생물의 서식지로서 생태적 가치가 매우 높다. 갯지렁이, 조개, 게, 갯고둥 등 저서 생물이 풍부하게 살아가며, 이들은 바다와 육지 사이의 물질 순환에서 중요한 역할을 한다. 특히 갯벌은 철새들의 중간 기착지로 알려져 있다. 시베리아에서 호주까지 이동하는 도요새와 물떼새 등이 한국의 갯벌에서 먹이를 보충하며 체력을 회복한 뒤 다음 목적지로 날아간다. 한국 갯벌에서 관찰되는 철새의 종류는 약 200종 이상이며, 이 중 멸종 위기에 처한 종도 다수 포함되어 있어 국제적인 보전의 중요성이 강조되고 있다."
    },
    {
      id: "p3",
      text: "갯벌은 생태적 기능 외에도 환경 정화 능력을 지니고 있다. 갯벌의 미생물은 바다로 유입되는 유기 오염 물질을 분해하여 수질을 개선하는 역할을 한다. 연구에 따르면 갯벌 1제곱킬로미터가 연간 처리할 수 있는 오염 물질의 양은 소규모 하수 처리장과 맞먹는 수준이다. 또한 갯벌의 퇴적물과 식물은 대기 중의 이산화탄소를 흡수하여 저장하는 블루 카본의 역할을 수행한다. 블루 카본이란 해양 및 연안 생태계가 흡수·저장하는 탄소를 말하며, 갯벌은 열대 우림보다 단위 면적당 탄소 저장 능력이 뛰어나다는 연구 결과도 있다."
    },
    {
      id: "p4",
      text: "그러나 산업화와 도시 개발로 인해 한국의 갯벌 면적은 지속적으로 감소해 왔다. 간척 사업과 매립으로 과거 대비 약 3분의 1 이상의 갯벌이 사라졌으며, 남은 갯벌도 오염과 개발 압력에 노출되어 있다. 이에 한국 정부와 국제 사회는 갯벌 보전을 위한 다양한 노력을 기울이고 있다. 2021년 한국의 갯벌은 유네스코 세계 자연 유산에 등재되었으며, 이는 갯벌의 생태적·환경적 가치가 국제적으로 인정받은 결과이다. 갯벌은 단순한 진흙탕이 아니라 생물 다양성과 환경 보전의 핵심 자원이므로, 그 가치를 올바르게 인식하고 지속 가능한 이용 방안을 마련하는 것이 시급하다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 79 지문 길이: ${totalLen}자`);

  const content = assembleFull(79, "NONFICTION", "dr-r2-079", "일일 독해(러셀 2) Day 79 비문학");

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "갯벌은 밀물 때 바닷물에 잠기고 썰물 때 드러나는 해안의 넓은 퇴적 지형을 말한다." }],
      prompt: "갯벌의 정의로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "밀물과 썰물에 따라 물에 잠기거나 드러나는 해안의 퇴적 지형이다." },
        { id: "B", text: "항상 물에 잠겨 있는 깊은 바다 밑의 퇴적층이다." },
        { id: "C", text: "인공적으로 조성한 양식장 주변의 모래밭이다." },
        { id: "D", text: "해안 절벽이 파도에 깎여 형성된 바위 지형이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "한반도 서해안의 조수 간만의 차이는 최대 약 9미터에 달하며, 이처럼 큰 조차와 완만한 경사의 해안 지형이 갯벌 형성의 핵심 조건이 된다." }],
      prompt: "갯벌 형성의 핵심 조건 두 가지는 무엇인가?",
      choices: [
        { id: "A", text: "큰 조수 간만의 차이와 완만한 경사의 해안 지형이다." },
        { id: "B", text: "높은 수온과 강한 해류이다." },
        { id: "C", text: "깊은 수심과 가파른 해안 절벽이다." },
        { id: "D", text: "풍부한 강수량과 넓은 하천이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "갯벌의 정의, 형성 조건, 분류 방식과 분포 특성을 소개한다." },
        { id: "B", text: "갯벌에 서식하는 다양한 생물의 종류를 나열한다." },
        { id: "C", text: "갯벌의 환경 정화 기능을 과학적으로 분석한다." },
        { id: "D", text: "갯벌 보전을 위한 국제적 노력을 설명한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "시베리아에서 호주까지 이동하는 도요새와 물떼새 등이 한국의 갯벌에서 먹이를 보충하며 체력을 회복한 뒤 다음 목적지로 날아간다." }],
      prompt: "한국 갯벌이 철새에게 중요한 이유로 적절한 것은?",
      choices: [
        { id: "A", text: "장거리 이동 중 먹이를 보충하고 체력을 회복하는 중간 기착지이다." },
        { id: "B", text: "철새가 영구적으로 정착하여 번식하는 최종 목적지이다." },
        { id: "C", text: "철새를 인공적으로 사육하고 방사하는 시설이 있다." },
        { id: "D", text: "천적이 없어 철새가 포식 위험 없이 머무를 수 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "갯벌이 다양한 저서 생물과 철새의 서식지로서 높은 생태적 가치를 지닌다." },
        { id: "B", text: "갯벌의 오염으로 인해 철새의 수가 급격히 감소하고 있다." },
        { id: "C", text: "한국 갯벌의 간척 역사를 시간순으로 정리하고 있다." },
        { id: "D", text: "갯벌 퇴적물의 화학적 성분을 분석하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "갯벌 1제곱킬로미터가 연간 처리할 수 있는 오염 물질의 양은 소규모 하수 처리장과 맞먹는 수준이다." }],
      prompt: "이 문장이 강조하는 갯벌의 기능으로 적절한 것은?",
      choices: [
        { id: "A", text: "갯벌이 하수 처리장에 버금가는 수질 정화 능력을 가지고 있다." },
        { id: "B", text: "갯벌에 하수 처리장을 건설하는 것이 효율적이라는 의미이다." },
        { id: "C", text: "하수 처리장보다 갯벌의 정화 능력이 훨씬 부족하다는 뜻이다." },
        { id: "D", text: "갯벌의 면적이 하수 처리장보다 작다는 사실을 설명한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "블루 카본이란 해양 및 연안 생태계가 흡수·저장하는 탄소를 말하며, 갯벌은 열대 우림보다 단위 면적당 탄소 저장 능력이 뛰어나다는 연구 결과도 있다." }],
      prompt: "블루 카본에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "해양·연안 생태계가 흡수·저장하는 탄소이며, 갯벌의 탄소 저장 능력이 열대 우림보다 높을 수 있다." },
        { id: "B", text: "파란색 플라스틱에서 나오는 탄소 물질을 가리키는 용어이다." },
        { id: "C", text: "육상 숲에서만 흡수하는 탄소를 해양으로 운반하는 과정이다." },
        { id: "D", text: "이산화탄소를 대기 중으로 방출하는 갯벌의 부정적 기능이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "갯벌의 환경 정화 기능과 블루 카본으로서의 탄소 저장 역할을 설명한다." },
        { id: "B", text: "갯벌 생물의 종 다양성과 먹이 사슬 구조를 분석한다." },
        { id: "C", text: "갯벌 보전을 위한 국제 협약의 내용을 정리한다." },
        { id: "D", text: "갯벌 면적 감소의 원인과 영향을 서술한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "2021년 한국의 갯벌은 유네스코 세계 자연 유산에 등재되었으며, 이는 갯벌의 생태적·환경적 가치가 국제적으로 인정받은 결과이다." }],
      prompt: "한국 갯벌의 유네스코 등재가 의미하는 바로 적절한 것은?",
      choices: [
        { id: "A", text: "갯벌의 생태적·환경적 가치가 세계적으로 공인되었다는 것이다." },
        { id: "B", text: "한국이 갯벌을 모두 관광지로 개발할 권리를 얻었다는 것이다." },
        { id: "C", text: "유네스코가 갯벌 면적을 더 넓히도록 명령했다는 것이다." },
        { id: "D", text: "갯벌에서의 어업 활동이 전면 금지되었다는 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "갯벌 면적의 감소 현황과 보전 노력, 유네스코 등재의 의의를 설명한다." },
        { id: "B", text: "갯벌의 형성 과정과 퇴적물의 구성을 과학적으로 분석한다." },
        { id: "C", text: "간척 사업의 경제적 이점을 강조하며 개발의 필요성을 주장한다." },
        { id: "D", text: "철새의 이동 경로와 갯벌에서의 행동 양상을 서술한다." }
      ],
      answerId: "A"
    }
  ]);

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "한반도 서해안의 최대 조수 간만의 차이는 약 몇 미터인가?",
      answerRanges: [findRange(paragraphs, "p1", "9미터")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "입자가 고운 갯벌의 종류를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p1", "펄갯벌")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "한국 갯벌에서 관찰되는 철새는 약 몇 종 이상인가?",
      answerRanges: [findRange(paragraphs, "p2", "200종")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "해양 및 연안 생태계가 흡수·저장하는 탄소를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p3", "블루 카본")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "간척 사업과 매립으로 사라진 갯벌의 비율은 과거 대비 약 얼마인가?",
      answerRanges: [findRange(paragraphs, "p4", "3분의 1")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "한국의 갯벌이 유네스코 세계 자연 유산에 등재된 연도는 언제인가?",
      answerRanges: [findRange(paragraphs, "p4", "2021년")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: buildRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
}


// ════════════════════════════════════════════════════════════════
// Day 80 — 문학(LITERATURE): 현대 수필 — 사진 한 장
// ════════════════════════════════════════════════════════════════

function buildDay80() {
  const paragraphs = [
    {
      id: "p1",
      text: "이삿짐을 정리하다가 서랍 깊숙한 곳에서 오래된 사진 한 장을 발견했다. 빛바랜 색감 속에 어머니와 내가 나란히 서 있었다. 어머니의 손은 내 어깨 위에 있었고, 나는 다섯 살쯤 되어 보였다. 배경은 동네 놀이터였다. 낡은 철봉과 모래밭, 그리고 그 너머로 보이는 작은 슈퍼마켓 간판까지 선명하게 기억났다. 사진을 찍은 것은 아마 아버지였을 것이다. 나는 사진 속 어머니의 얼굴을 자세히 들여다보았다. 지금보다 한참 젊은 얼굴이었지만, 눈가에 이미 잔주름이 자리하고 있었다. 그 주름 사이에 피로와 걱정이 묻어 있는 듯했는데, 입술은 또렷하게 웃고 있었다."
    },
    {
      id: "p2",
      text: "어머니는 혼자서 동네 구멍가게를 운영하며 나와 동생을 키웠다. 새벽 다섯 시에 나가 밤 열 시에 돌아오는 날이 일주일에 대여섯 번이었다. 집에 오면 부엌에서 된장찌개를 끓이고, 밀린 빨래를 돌리고, 그 사이에 우리의 숙제를 봐 주었다. 어머니가 힘들다고 말한 적은 한 번도 없었다. 피곤하면 피곤한 대로 웃었고, 걱정이 있으면 혼자 삼켰다. 나는 그때 어머니가 왜 항상 웃는지 이해하지 못했다. 웃을 일이 그렇게 많은 줄 알았다. 그것이 우리를 지키기 위한 단단한 방패였다는 것을 까맣게 모르고 있었다."
    },
    {
      id: "p3",
      text: "사진 뒷면에는 어머니의 글씨로 날짜와 함께 짧은 메모가 적혀 있었다. '우리 아이의 첫 놀이터 나들이. 철봉에 매달려 웃던 모습이 예뻤다.' 그 한 줄을 읽는 순간, 눈시울이 뜨거워졌다. 나는 철봉에 매달렸던 기억이 전혀 없었지만, 어머니는 그 장면을 기억하고 기록으로 남겼다. 부모란 그런 존재인가 보다. 아이는 잊어버리는 순간을 부모는 가슴에 새기고, 아이가 기억하지 못하는 사랑을 부모는 조용히 쌓아 올린다. 사진은 그 보이지 않는 사랑의 증거였다."
    },
    {
      id: "p4",
      text: "나는 그 사진을 작은 나무 액자에 넣어 거실에 걸었다. 예전에는 무심히 지나쳤을 한 장의 사진이 이제는 전혀 다르게 보인다. 어머니의 어깨에 놓인 손이 얼마나 무거운 하루를 견뎌 낸 손인지, 그 웃음이 얼마나 많은 걱정을 감추고 있었는지 이제야 읽힌다. 나도 이제 누군가의 부모가 되었다. 아이의 사진을 찍을 때마다 어머니를 떠올린다. 렌즈 너머로 아이를 바라보며, 이 순간이 아이의 기억에서 사라지더라도 내 안에는 영원히 남을 것이라고 생각한다. 사진 한 장에 담긴 것은 풍경이 아니라 시간이며, 시간 속에 녹아든 것은 말로 다할 수 없는 사랑이다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 80 지문 길이: ${totalLen}자`);

  const content = assembleFull(80, "LITERATURE", "dr-r2-080", "일일 독해(러셀 2) Day 80 문학");

  const timeline = buildTimeline(paragraphs, [
    {
      ranges: [{ pid: "p1", text: "빛바랜 색감 속에 어머니와 내가 나란히 서 있었다." }],
      prompt: "'빛바랜 색감'이라는 표현이 환기하는 것으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "오랜 세월이 흘렀음을 시각적으로 드러내며 추억의 깊이를 암시한다." },
        { id: "B", text: "사진의 인쇄 품질이 낮아 불량품임을 알려 준다." },
        { id: "C", text: "사진이 햇빛에 노출되어 소재 가치가 사라졌다는 뜻이다." },
        { id: "D", text: "당시 카메라 기술이 현재보다 뛰어났다는 사실을 보여 준다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", text: "그 주름 사이에 피로와 걱정이 묻어 있는 듯했는데, 입술은 또렷하게 웃고 있었다." }],
      prompt: "이 묘사에서 드러나는 어머니의 모습으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "피로와 걱정 속에서도 자녀 앞에서 웃음을 잃지 않는 강인한 모성이다." },
        { id: "B", text: "삶이 여유로워 항상 행복하고 걱정 없는 상태를 보여 준다." },
        { id: "C", text: "카메라를 의식하여 억지로 표정을 짓고 있는 불편한 장면이다." },
        { id: "D", text: "젊은 시절의 건강하고 활기찬 모습을 사실적으로 묘사한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p1", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "서랍에서 발견한 오래된 사진을 통해 어린 시절과 어머니를 회상한다." },
        { id: "B", text: "놀이터의 시설물이 노후화되어 교체가 필요하다고 지적한다." },
        { id: "C", text: "아버지가 사진을 찍는 취미를 가지게 된 계기를 설명한다." },
        { id: "D", text: "동네 슈퍼마켓의 영업 상황을 묘사하고 있다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", text: "그것이 우리를 지키기 위한 단단한 방패였다는 것을 까맣게 모르고 있었다." }],
      prompt: "'단단한 방패'가 가리키는 것으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "어머니의 웃음이 자녀들이 불안을 느끼지 않도록 지켜 주는 보호 수단이었다는 뜻이다." },
        { id: "B", text: "어머니가 실제로 집에 방패를 걸어 두고 자녀를 보호했다는 뜻이다." },
        { id: "C", text: "어머니의 체력이 매우 강해서 물리적으로 가족을 지켰다는 뜻이다." },
        { id: "D", text: "웃음이 건강에 좋다는 과학적 사실을 비유한 것이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p2", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "고된 일상 속에서도 웃음으로 자녀를 지킨 어머니의 헌신을 회상한다." },
        { id: "B", text: "어머니의 가게 운영 방식과 경영 노하우를 소개한다." },
        { id: "C", text: "화자가 어린 시절 어머니에게 반항했던 경험을 고백한다." },
        { id: "D", text: "어머니가 자주 힘들다고 표현하며 도움을 요청한 장면이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "아이는 잊어버리는 순간을 부모는 가슴에 새기고, 아이가 기억하지 못하는 사랑을 부모는 조용히 쌓아 올린다." }],
      prompt: "이 문장이 말하는 부모와 자녀의 관계로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "부모는 자녀가 인식하지 못하는 순간까지도 소중히 간직하며 사랑을 축적한다." },
        { id: "B", text: "자녀가 부모보다 기억력이 뛰어나 더 많은 것을 기억한다." },
        { id: "C", text: "부모와 자녀가 같은 순간을 동일하게 기억한다는 뜻이다." },
        { id: "D", text: "부모의 사랑은 일시적이며 시간이 지나면 사라진다는 뜻이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", text: "사진은 그 보이지 않는 사랑의 증거였다." }],
      prompt: "이 문장에서 사진이 갖는 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "일상에서 드러나지 않는 부모의 사랑이 물질적으로 남겨진 증거이다." },
        { id: "B", text: "법적 분쟁에서 사용할 수 있는 공식 문서의 역할을 한다." },
        { id: "C", text: "사진의 예술적 구도가 뛰어나 전시회에 출품할 가치가 있다." },
        { id: "D", text: "사진이 오래되어 더 이상 보존할 가치가 없다는 뜻이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p3", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "사진 뒷면의 메모를 통해 부모의 보이지 않는 사랑을 깨닫게 된다." },
        { id: "B", text: "화자가 어린 시절 놀이터에서 운동을 즐기던 추억을 회상한다." },
        { id: "C", text: "사진의 보존 방법과 관리 기술을 안내하고 있다." },
        { id: "D", text: "어머니의 글씨체를 분석하여 성격을 파악하려 한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "이 순간이 아이의 기억에서 사라지더라도 내 안에는 영원히 남을 것이라고 생각한다." }],
      prompt: "이 문장에서 화자가 깨달은 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "자신도 어머니처럼 자녀의 순간을 영원히 간직하는 부모가 되었음을 인식한다." },
        { id: "B", text: "아이의 기억력이 좋지 않아 걱정하고 있다." },
        { id: "C", text: "사진을 많이 찍어야 기억이 보존된다는 실용적 교훈이다." },
        { id: "D", text: "아이가 커서 사진을 보면 감동할 것이라는 기대를 표현한다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", text: "사진 한 장에 담긴 것은 풍경이 아니라 시간이며, 시간 속에 녹아든 것은 말로 다할 수 없는 사랑이다." }],
      prompt: "이 마지막 문장이 전달하는 주제로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "사진은 풍경을 넘어 시간과 사랑을 담는 매체라는 것이다." },
        { id: "B", text: "사진 촬영 기술의 발전이 사랑의 표현 방식을 바꾸었다는 것이다." },
        { id: "C", text: "풍경 사진이 인물 사진보다 예술적 가치가 높다는 주장이다." },
        { id: "D", text: "시간이 지나면 모든 사랑은 사라진다는 허무주의적 관점이다." }
      ],
      answerId: "A"
    },
    {
      ranges: [{ pid: "p4", full: true }],
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "화자가 부모의 입장이 되어 어머니의 사랑을 이해하고 이어 나간다." },
        { id: "B", text: "화자가 사진을 팔아 경제적 이익을 얻으려 한다." },
        { id: "C", text: "거실 인테리어를 변경하는 과정을 묘사하고 있다." },
        { id: "D", text: "어머니가 화자를 직접 방문하여 함께 사진을 보는 장면이다." }
      ],
      answerId: "A"
    }
  ]);

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "사진 속에서 어머니의 손은 어디에 놓여 있었는가?",
      answerRanges: [findRange(paragraphs, "p1", "내 어깨 위")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "어머니가 새벽 다섯 시에 나가 돌아오는 시각은 몇 시인가?",
      answerRanges: [findRange(paragraphs, "p2", "밤 열 시")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "화자가 어머니의 웃음을 무엇에 비유하였는가?",
      answerRanges: [findRange(paragraphs, "p2", "단단한 방패")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "사진 뒷면 메모에 따르면 화자가 놀이터에서 한 행동은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "철봉에 매달려 웃던")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "화자는 발견한 사진을 어떻게 했는가?",
      answerRanges: [findRange(paragraphs, "p4", "액자에 넣어 거실에 걸었다")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "화자가 사진 한 장에 담긴 것이라고 말한 것은 풍경이 아니라 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "시간")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: buildRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
}


// ════════════════════════════════════════════════════════════════
// main
// ════════════════════════════════════════════════════════════════

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const staticDir = path.join(rootDir, 'frontend', 'public', 'daily-reading', 'russell2');
  const batchPath = path.join(rootDir, 'generated', 'daily-batch-reading-russell2.json');

  // 디렉터리 확인
  if (!fs.existsSync(staticDir)) fs.mkdirSync(staticDir, { recursive: true });

  const contents = [
    { day: 76, subArea: "LITERATURE", content: buildDay76() },
    { day: 77, subArea: "NONFICTION", content: buildDay77() },
    { day: 78, subArea: "LITERATURE", content: buildDay78() },
    { day: 79, subArea: "NONFICTION", content: buildDay79() },
    { day: 80, subArea: "LITERATURE", content: buildDay80() }
  ];

  // 검증
  for (const { day, content } of contents) {
    const len = charLen(content.payload.passage.paragraphs);
    if (len < 1150 || len > 1250) {
      console.warn(`경고: Day ${day} 지문 길이 ${len}자 (목표 1150~1250)`);
    }

    // 복기 카드 수 검증
    const cardCount = content.payload.recall.cards.length;
    if (cardCount !== 8) {
      console.error(`오류: Day ${day} 복기 카드 ${cardCount}장 (목표 8장)`);
      process.exit(1);
    }

    // 확인 문항 수 검증
    const qCount = content.payload.confirm.questions.length;
    if (qCount < 5 || qCount > 8) {
      console.error(`오류: Day ${day} 확인 문항 ${qCount}개 (목표 5~8)`);
      process.exit(1);
    }

    console.log(`Day ${day}: 길이=${len}자, 정독=${content.payload.intensive.timeline.length}단계, 복기=${cardCount}장, 확인=${qCount}문항`);
  }

  // 배치 파일 최신 상태 읽기 후 교체
  console.log('\n배치 파일 읽기...');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  console.log(`배치 파일 items 수: ${batch.items.length}`);

  for (const { day, subArea, content } of contents) {
    const idx = day - 1; // items[75]~[79]
    const batchItem = wrapBatchItem(day, subArea, content);
    batch.items[idx] = batchItem;
    console.log(`items[${idx}] (Day ${day}) 교체 완료`);
  }

  // 배치 파일 쓰기
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
  console.log(`배치 파일 저장: ${batchPath}`);

  // static 파일 쓰기
  for (const { day, content } of contents) {
    const fileName = String(day).padStart(3, '0') + '.json';
    const filePath = path.join(staticDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`static 파일 저장: ${filePath}`);
  }

  console.log('\n모든 작업 완료!');
}

main();
