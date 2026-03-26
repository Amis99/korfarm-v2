/**
 * 러셀2(RUSSELL_2) Day 26~30 일일독해 콘텐츠 빌더
 * - Day 26: 문학(LITERATURE), Day 27: 비문학(NONFICTION)
 * - Day 28: 문학(LITERATURE), Day 29: 비문학(NONFICTION)
 * - Day 30: 문학(LITERATURE)
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

// 복기 카드 8장 생성: 전체 텍스트를 이어 붙여 8등분
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

// ════════════════════════════════════════════════════════════════
// Day 26 — 문학(LITERATURE): 현대 소설 지문
// ════════════════════════════════════════════════════════════════

function buildDay26() {
  const paragraphs = [
    {
      id: "p1",
      text: "그해 겨울은 유난히 길었다. 할머니는 매일 새벽이면 부엌에 불을 지피고 솥에 물을 올렸다. 물이 끓기 시작하면 옥수수 가루를 한 줌 넣어 죽을 쑤었는데, 그것은 식구 여섯이 하루를 버틸 수 있는 유일한 끼니였다. 아버지는 탄광에 나가 종일 돌을 깨고 돌아왔지만, 한 달 품삯은 쌀 두어 되에 불과했다. 어머니는 집 뒤 텃밭에서 얼어붙은 무를 캐다가 손끝이 갈라져 피를 흘리면서도 아이들 앞에서는 내색하지 않았다. 나는 그때 열두 살이었고, 세상이 왜 이렇게 춥고 배고픈지 이해할 수 없었다. 동생들은 이불 속에 웅크려 서로의 체온으로 추위를 견뎠고, 누나는 솥뚜껑을 열 때마다 피어오르는 김을 바라보며 한 그릇이라도 더 남기려 애썼다."
    },
    {
      id: "p2",
      text: "어느 날 할머니가 나를 불러 마루에 앉혔다. 할머니의 손은 거칠고 마디가 굵었지만, 내 손을 감싸 쥘 때면 언제나 따뜻했다. 할머니는 말씀하셨다. 사람이 추우면 몸을 웅크리게 되고, 배가 고프면 마음까지 쪼그라든다고. 하지만 그럴수록 고개를 들어야 한다고. 하늘을 보면 별이 있고, 별은 아무리 추운 밤에도 꺼지지 않는다고. 나는 할머니의 말씀이 무슨 뜻인지 정확히 알지 못했지만, 할머니의 눈빛 속에 깃든 단단한 믿음 같은 것은 느낄 수 있었다. 마루 밖으로 보이는 겨울 하늘에는 정말 별이 총총했고, 그 빛은 차가운 공기 사이로 유난히 또렷하게 빛나고 있었다."
    },
    {
      id: "p3",
      text: "그 겨울이 끝나고 봄이 왔을 때, 텃밭의 흙 아래에서 작은 싹이 올라오는 것을 보았다. 어머니는 그 싹을 가리키며 씨앗 하나가 겨울을 견디면 이렇게 새 생명이 된다고 말했다. 나는 문득 할머니가 했던 말씀을 떠올렸다. 별이 꺼지지 않듯, 씨앗도 얼어붙은 땅속에서 봄을 기다리고 있었던 것이다. 그 순간 나는 우리 가족이 그해 겨울을 견뎌 낸 힘이 어디에서 왔는지 어렴풋이 깨달았다. 추위 속에서도 서로의 손을 놓지 않은 것, 빈 솥을 앞에 두고도 내일을 이야기한 것, 그 모든 작은 버팀이 우리를 봄까지 이끌어 준 것이었다."
    },
    {
      id: "p4",
      text: "세월이 흘러 할머니는 돌아가셨고, 탄광 마을도 사라졌다. 하지만 새벽마다 솥에 물을 올리던 할머니의 뒷모습, 얼어붙은 무를 캐던 어머니의 갈라진 손끝, 그리고 별이 꺼지지 않는다는 그 말 한마디가 내 안에 남아 있다. 나는 삶이 힘겨울 때마다 그 겨울을 떠올린다. 씨앗이 얼어붙은 땅속에서 봄을 기다리듯, 나 역시 견디면 언젠가 새로운 계절이 올 것이라고 스스로에게 말한다. 그것이 할머니가 내게 남긴 유산이며, 가난했지만 결코 가난하지 않았던 그 겨울의 기억이다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 26 지문 길이: ${totalLen}자`);

  const content = makeShell(26, "LITERATURE", "dr-r2-026", "일일 독해(러셀 2) Day 26 문학");

  // 정독 타임라인
  const timeline = [];
  let stepNum = 1;

  // p1 문장별 하이라이트 + 질문
  const p1sents = findSentences(paragraphs[0].text);

  // s1: 첫 문장 하이라이트 → 서술 방식
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p1", p1sents[0].text)] },
    question: {
      prompt: "첫 문장이 독자에게 주는 인상으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "겨울이 유난히 길었다는 표현은 고난의 시간이 오래 지속되었음을 암시한다." },
        { id: "B", text: "겨울이 짧았다는 사실을 역설적으로 드러내 긴장감을 높인다." },
        { id: "C", text: "봄이 빨리 올 것이라는 기대감을 조성하여 희망적 분위기를 형성한다." },
        { id: "D", text: "계절의 변화를 과학적으로 설명하여 객관성을 부여한다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s2: 할머니의 행동 묘사
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p1", "할머니는 매일 새벽이면 부엌에 불을 지피고 솥에 물을 올렸다.")] },
    question: {
      prompt: "할머니의 행동이 나타내는 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "할머니는 요리를 취미로 즐기며 여유로운 삶을 영위하고 있다." },
        { id: "B", text: "반복되는 새벽 행동은 가족을 위한 헌신적 일상을 보여 준다." },
        { id: "C", text: "부엌의 불은 집안의 경제적 풍요로움을 상징적으로 드러낸다." },
        { id: "D", text: "솥에 물을 올리는 장면은 할머니의 종교적 의식을 나타낸다." }
      ],
      answerId: "B",
      scoring: intensiveScoring
    }
  });

  // s3: 아버지의 탄광 노동
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p1", "아버지는 탄광에 나가 종일 돌을 깨고 돌아왔지만, 한 달 품삯은 쌀 두어 되에 불과했다.")] },
    question: {
      prompt: "이 문장에서 드러나는 아버지의 처지로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "고된 노동에 비해 보상이 턱없이 부족한 궁핍한 현실을 보여 준다." },
        { id: "B", text: "탄광 일이 쉽고 단순하여 별다른 고생 없이 생활비를 번다." },
        { id: "C", text: "쌀 두어 되의 품삯으로 가족이 넉넉하게 먹고살 수 있었다." },
        { id: "D", text: "아버지가 탄광 대신 다른 직업을 구하려는 의지를 드러낸다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s4: p1 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: paragraphs[0].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "가난과 추위 속에서 고되게 살아가는 가족의 겨울 풍경을 보여 준다." },
        { id: "B", text: "할머니의 요리 솜씨를 중심으로 행복한 가정의 모습을 그린다." },
        { id: "C", text: "아버지의 탄광 사업이 성공하여 가족이 부유해지는 과정을 서술한다." },
        { id: "D", text: "어린 화자가 학교에서 겪는 어려움과 친구 관계를 묘사한다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s5: p2 - 할머니 말씀
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p2", "사람이 추우면 몸을 웅크리게 되고, 배가 고프면 마음까지 쪼그라든다고.")] },
    question: {
      prompt: "할머니의 이 말에 담긴 뜻으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "추위와 배고픔은 몸뿐 아니라 정신까지 위축시킬 수 있다는 경험적 인식이다." },
        { id: "B", text: "추위를 이기려면 반드시 많이 먹어야 한다는 건강 관리 조언이다." },
        { id: "C", text: "마음이 쪼그라들면 몸도 자연스럽게 따뜻해진다는 역설적 진술이다." },
        { id: "D", text: "추위와 배고픔은 사람에게 전혀 영향을 미치지 않는다는 낙관론이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s6: 별 이미지
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p2", "하늘을 보면 별이 있고, 별은 아무리 추운 밤에도 꺼지지 않는다고.")] },
    question: {
      prompt: "이 문장에서 '별'이 상징하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "어려운 상황에서도 사라지지 않는 희망이나 삶의 의지를 뜻한다." },
        { id: "B", text: "겨울밤 하늘의 천문학적 현상을 과학적으로 설명하려는 것이다." },
        { id: "C", text: "가족의 경제적 부를 은유하며 미래의 물질적 성공을 예고한다." },
        { id: "D", text: "할머니가 좋아하던 장난감 별 모양 장식을 가리키는 것이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s7: p2 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: paragraphs[1].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "할머니가 손주에게 고난 속에서도 희망을 잃지 말라는 교훈을 전한다." },
        { id: "B", text: "화자가 할머니의 손이 차가워서 불편함을 느끼는 장면을 그린다." },
        { id: "C", text: "할머니가 천문학에 대한 풍부한 지식을 손주에게 가르치고 있다." },
        { id: "D", text: "화자가 할머니의 말씀을 정확히 이해하고 즉각 실천에 옮기고 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s8: p3 - 싹 발견
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p3", "텃밭의 흙 아래에서 작은 싹이 올라오는 것을 보았다.")] },
    question: {
      prompt: "'작은 싹'이 이 글의 맥락에서 의미하는 바로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "고난의 시간을 견딘 뒤에 찾아오는 새로운 시작과 희망을 나타낸다." },
        { id: "B", text: "텃밭 농사를 통해 가족이 경제적으로 큰 성공을 거두는 계기이다." },
        { id: "C", text: "봄에 자연스럽게 자라나는 잡초로 가족에게 번거로움을 안긴다." },
        { id: "D", text: "어머니가 시장에서 사 온 모종을 심어 놓은 결과물이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s9: p3 깨달음
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p3", "추위 속에서도 서로의 손을 놓지 않은 것, 빈 솥을 앞에 두고도 내일을 이야기한 것, 그 모든 작은 버팀이 우리를 봄까지 이끌어 준 것이었다.")] },
    question: {
      prompt: "이 문장에서 화자가 깨달은 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "가족이 겨울을 견딜 수 있었던 힘은 서로에 대한 유대와 희망에서 비롯되었다." },
        { id: "B", text: "봄이 오면 자연스럽게 모든 고통이 사라지므로 별도의 노력은 필요 없다." },
        { id: "C", text: "겨울을 견디는 유일한 방법은 충분한 식량을 비축하는 것이었다." },
        { id: "D", text: "가족 구성원 각자가 독립적으로 행동한 덕분에 위기를 넘길 수 있었다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s10: p3 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: paragraphs[2].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "봄의 싹을 통해 화자가 가족의 버팀이 지닌 의미를 깨닫는 과정이다." },
        { id: "B", text: "어머니가 텃밭에서 새로운 농사 기술을 개발하는 이야기이다." },
        { id: "C", text: "화자가 할머니의 말씀을 부정하고 자신만의 철학을 세우는 장면이다." },
        { id: "D", text: "겨울이 끝나자 가족 모두가 마을을 떠나 도시로 이주하는 내용이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s11: p4 - 핵심 문장
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p4", "나는 삶이 힘겨울 때마다 그 겨울을 떠올린다.")] },
    question: {
      prompt: "이 문장에서 '그 겨울'이 화자에게 갖는 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "힘든 시절의 기억이지만, 견딤의 가치를 일깨워 주는 내면의 자산이다." },
        { id: "B", text: "다시는 돌아가고 싶지 않은 트라우마로만 남아 있는 고통의 시간이다." },
        { id: "C", text: "추위를 피해 따뜻한 남쪽 지방으로 이사했던 즐거운 추억이다." },
        { id: "D", text: "겨울 스포츠를 즐기던 학창 시절의 유쾌한 경험을 가리킨다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s12: p4 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: paragraphs[3].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "세월이 흘러도 그 겨울의 기억은 화자에게 삶의 지탱이 되는 유산이다." },
        { id: "B", text: "할머니가 돌아가신 후 화자가 탄광을 물려받아 운영하고 있다." },
        { id: "C", text: "화자가 어린 시절의 가난을 원망하며 과거와 단절하려 한다." },
        { id: "D", text: "탄광 마을이 관광지로 변모하여 화자가 경제적 성공을 거둔다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "이 글에서 식구의 끼니 해결에 쓰인 재료는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "옥수수 가루")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "아버지의 한 달 품삯에 해당하는 양은 어느 정도였는가?",
      answerRanges: [findRange(paragraphs, "p1", "쌀 두어 되")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "할머니가 아무리 추운 밤에도 꺼지지 않는다고 한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "별")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "봄이 왔을 때 텃밭에서 올라온 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "작은 싹")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "화자가 겨울을 견뎌 낸 힘의 원천으로 깨달은 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "서로의 손을 놓지 않은 것")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "화자가 삶이 힘겨울 때 스스로에게 하는 말의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "견디면 언젠가 새로운 계절이 올 것이라고")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: makeRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
}


// ════════════════════════════════════════════════════════════════
// Day 27 — 비문학(NONFICTION): 인공지능과 언어 처리
// ════════════════════════════════════════════════════════════════

function buildDay27() {
  const paragraphs = [
    {
      id: "p1",
      text: "인간의 언어는 복잡한 규칙과 맥락 위에서 작동한다. 같은 단어라도 문맥에 따라 전혀 다른 뜻을 가지며, 문장의 어순이 바뀌면 의미가 달라지기도 한다. 이를테면 '다리'라는 단어는 신체 부위를 가리키기도 하고 강 위에 놓인 구조물을 뜻하기도 한다. 이러한 언어의 복잡성은 컴퓨터가 인간의 말을 이해하고 생성하는 자연어 처리 분야에서 오랫동안 난제로 여겨져 왔다. 초기의 자연어 처리 시스템은 언어학자들이 만든 규칙을 하나하나 입력하는 방식으로 설계되었으나, 예외가 너무 많아 실용적인 수준에 이르지 못했다."
    },
    {
      id: "p2",
      text: "이 한계를 돌파한 것이 통계 기반 접근법이다. 대량의 텍스트 자료를 컴퓨터에 학습시켜 단어와 단어 사이의 출현 확률을 계산하고, 그 확률을 바탕으로 다음에 올 단어를 예측하는 방식이다. 예컨대 '하늘이'라는 단어 뒤에 '맑다'가 올 확률이 '흐리다'보다 높다면, 시스템은 '맑다'를 우선 선택한다. 이 방법은 규칙을 일일이 만들 필요 없이 데이터만으로도 작동한다는 장점이 있었다. 그러나 문장이 길어지거나 먼 거리의 단어 간 관계를 파악해야 할 때는 정확도가 크게 떨어졌다. 주어와 서술어가 수십 단어 이상 떨어져 있는 경우, 통계 모델은 둘 사이의 연결을 제대로 잡아내지 못하는 한계를 보였다."
    },
    {
      id: "p3",
      text: "이를 보완하기 위해 등장한 것이 인공 신경망 기반의 언어 모델이다. 인공 신경망은 인간의 뇌 구조를 모방한 수학적 모형으로, 입력층·은닉층·출력층으로 구성된다. 특히 트랜스포머라 불리는 구조가 도입되면서 자연어 처리 기술은 비약적으로 발전하였다. 트랜스포머의 핵심은 자기 주의 메커니즘으로, 문장 속 모든 단어가 다른 모든 단어와의 관계를 동시에 계산한다. 덕분에 문장이 아무리 길어도 멀리 떨어진 단어 사이의 의미 관계를 놓치지 않고 파악할 수 있게 되었다."
    },
    {
      id: "p4",
      text: "그러나 이러한 대규모 언어 모델에도 한계가 존재한다. 모델은 학습 데이터에 포함된 편향을 그대로 반영할 수 있으며, 사실과 다른 정보를 그럴듯하게 생성하는 이른바 환각 현상이 발생하기도 한다. 또한 모델의 추론 과정이 불투명하여 왜 특정 답변을 내놓았는지 설명하기 어렵다는 문제도 있다. 이에 따라 학계와 산업계에서는 모델의 신뢰성을 높이고 윤리적 문제를 최소화하기 위한 연구가 활발히 진행되고 있다. 궁극적으로 자연어 처리 기술은 인간의 의사소통을 돕는 도구로서, 그 가능성과 한계를 함께 인식하며 발전해 나가야 할 것이다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 27 지문 길이: ${totalLen}자`);

  const content = makeShell(27, "NONFICTION", "dr-r2-027", "일일 독해(러셀 2) Day 27 비문학");

  const timeline = [];
  let stepNum = 1;

  // s1: p1 - 언어의 복잡성
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p1", "같은 단어라도 문맥에 따라 전혀 다른 뜻을 가지며, 문장의 어순이 바뀌면 의미가 달라지기도 한다.")] },
    question: {
      prompt: "이 문장이 설명하는 언어의 특성으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "언어는 문맥과 어순에 따라 의미가 변하는 복잡한 체계를 지닌다." },
        { id: "B", text: "모든 단어는 하나의 고정된 의미만 가지므로 해석이 간단하다." },
        { id: "C", text: "어순은 의미에 전혀 영향을 미치지 않으며 단어만 중요하다." },
        { id: "D", text: "컴퓨터는 인간보다 문맥 파악 능력이 뛰어나다는 사실을 보여 준다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s2: p1 - 초기 시스템
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p1", "초기의 자연어 처리 시스템은 언어학자들이 만든 규칙을 하나하나 입력하는 방식으로 설계되었으나, 예외가 너무 많아 실용적인 수준에 이르지 못했다.")] },
    question: {
      prompt: "초기 자연어 처리 시스템의 한계로 적절한 것은?",
      choices: [
        { id: "A", text: "규칙 기반이라 예외 상황을 모두 반영하기 어려웠다." },
        { id: "B", text: "데이터가 너무 많아 컴퓨터의 처리 속도가 느려졌다." },
        { id: "C", text: "언어학자가 부족하여 시스템 자체를 만들 수 없었다." },
        { id: "D", text: "규칙이 단순하여 모든 문장을 정확히 해석할 수 있었다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s3: p1 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: paragraphs[0].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "언어의 복잡성으로 인해 초기 규칙 기반 자연어 처리는 한계에 부딪혔다." },
        { id: "B", text: "인공 신경망의 도입으로 자연어 처리 기술이 완성 단계에 이르렀다." },
        { id: "C", text: "통계 기반 접근법이 초기 자연어 처리의 주된 방법이었다." },
        { id: "D", text: "컴퓨터는 언어의 규칙을 인간보다 빠르게 습득할 수 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s4: p2 - 통계 기반
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p2", "대량의 텍스트 자료를 컴퓨터에 학습시켜 단어와 단어 사이의 출현 확률을 계산하고, 그 확률을 바탕으로 다음에 올 단어를 예측하는 방식이다.")] },
    question: {
      prompt: "통계 기반 접근법의 작동 원리로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "대량의 텍스트에서 단어 간 출현 확률을 계산하여 다음 단어를 예측한다." },
        { id: "B", text: "언어학자가 정한 규칙에 따라 문장의 구조를 분석한다." },
        { id: "C", text: "인간의 뇌 구조를 모방하여 문맥을 직관적으로 이해한다." },
        { id: "D", text: "단어의 사전적 정의만을 참조하여 문장을 해석한다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s5: p2 한계
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p2", "그러나 문장이 길어지거나 먼 거리의 단어 간 관계를 파악해야 할 때는 정확도가 크게 떨어졌다.")] },
    question: {
      prompt: "통계 기반 접근법의 한계로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "긴 문장이나 먼 거리의 단어 관계를 파악하는 데 정확도가 낮았다." },
        { id: "B", text: "짧은 문장에서도 단어의 의미를 전혀 파악하지 못했다." },
        { id: "C", text: "데이터 없이도 작동했지만 결과가 불안정했다." },
        { id: "D", text: "확률 계산이 불가능하여 모든 단어를 무작위로 선택했다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s6: p2 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: paragraphs[1].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "통계 기반 접근법은 데이터 활용이라는 장점이 있었으나 긴 문장 처리에 한계가 있었다." },
        { id: "B", text: "트랜스포머가 등장하여 자연어 처리의 모든 문제를 해결하였다." },
        { id: "C", text: "규칙 기반 시스템이 통계 기반보다 우수하다는 사실이 밝혀졌다." },
        { id: "D", text: "자연어 처리는 윤리적 문제로 인해 연구가 중단되었다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s7: p3 - 트랜스포머
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p3", "트랜스포머의 핵심은 자기 주의 메커니즘으로, 문장 속 모든 단어가 다른 모든 단어와의 관계를 동시에 계산한다.")] },
    question: {
      prompt: "트랜스포머의 자기 주의 메커니즘에 대한 설명으로 적절한 것은?",
      choices: [
        { id: "A", text: "문장 내 모든 단어 간의 관계를 동시에 계산하여 의미를 파악한다." },
        { id: "B", text: "가장 가까운 단어만 참조하여 순차적으로 문장을 분석한다." },
        { id: "C", text: "단어의 발음 정보를 활용하여 의미를 추론하는 기법이다." },
        { id: "D", text: "인간이 직접 단어 관계를 지정해 주어야 작동하는 방식이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s8: p3 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: paragraphs[2].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "인공 신경망과 트랜스포머의 도입으로 자연어 처리가 비약적으로 발전했다." },
        { id: "B", text: "통계 기반 접근법이 여전히 가장 우수한 자연어 처리 방법이다." },
        { id: "C", text: "인공 신경망은 인간의 뇌를 완벽하게 복제한 장치이다." },
        { id: "D", text: "자기 주의 메커니즘은 짧은 문장에서만 효과적으로 작동한다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s9: p4 - 환각 현상
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p4", "사실과 다른 정보를 그럴듯하게 생성하는 이른바 환각 현상이 발생하기도 한다.")] },
    question: {
      prompt: "'환각 현상'에 대한 설명으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "모델이 사실이 아닌 정보를 마치 사실인 것처럼 생성하는 오류이다." },
        { id: "B", text: "사용자가 컴퓨터 화면에서 환각을 경험하는 의학적 증상이다." },
        { id: "C", text: "모델이 학습 데이터를 삭제하여 기억을 잃는 현상이다." },
        { id: "D", text: "대규모 언어 모델이 정확한 답만 생성하는 긍정적 현상이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s10: p4 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: paragraphs[3].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "대규모 언어 모델의 한계와 이를 극복하기 위한 노력이 이루어지고 있다." },
        { id: "B", text: "자연어 처리 기술은 완벽하므로 더 이상의 연구가 필요 없다." },
        { id: "C", text: "환각 현상은 오직 인간에게만 나타나는 문제이다." },
        { id: "D", text: "대규모 언어 모델은 윤리적 문제가 없어 자유롭게 활용된다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "초기 자연어 처리 시스템이 실용적 수준에 이르지 못한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "예외가 너무 많아")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "통계 기반 접근법에서 다음 단어를 예측하는 기준은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "출현 확률")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "인공 신경망을 구성하는 세 가지 층은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "입력층·은닉층·출력층")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "트랜스포머의 핵심 기법은 무엇이라 불리는가?",
      answerRanges: [findRange(paragraphs, "p3", "자기 주의 메커니즘")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "모델이 사실과 다른 정보를 그럴듯하게 생성하는 현상을 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p4", "환각 현상")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "모델의 추론 과정과 관련하여 제기되는 문제점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "추론 과정이 불투명하여")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "학계와 산업계에서 연구하는 두 가지 목표는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "모델의 신뢰성을 높이고 윤리적 문제를 최소화")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: makeRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
}


// ════════════════════════════════════════════════════════════════
// Day 28 — 문학(LITERATURE): 현대시
// ════════════════════════════════════════════════════════════════

function buildDay28() {
  const paragraphs = [
    {
      id: "p1",
      text: "저녁때 시장 골목을 지나면 노점 좌판 위로 어스름이 내린다. 생선 비늘에 남은 햇살이 깜박이고, 고무다라이 속 미나리는 푸른 손을 내민다. 주름진 손이 동전을 세는 동안 석양은 점점 기울어 포장 천 위로 붉은 그림자를 드리운다. 나는 좁은 골목 사이로 어깨를 비틀며 걷는다. 누군가의 라디오에서 흘러나오는 옛 노래가 생선 냄새, 두부 냄새와 뒤섞여 공기 속을 떠돈다. 좌판마다 전구가 하나씩 달려 있어 저물녘 골목은 작은 별들이 줄지어 매달린 듯하다. 시장은 늘 이렇게 소란하고, 그 소란 속에 사람 사는 온기가 있다."
    },
    {
      id: "p2",
      text: "나는 멈춰 서서 떡집 앞 유리창을 들여다본다. 하얀 떡 위에 붉은 팥고물이 소복하고, 노란 호박편이 가지런히 놓여 있다. 할머니 한 분이 손주에게 인절미를 쥐어 주시고, 아이는 입가에 콩가루를 묻힌 채 활짝 웃는다. 그 장면이 마음 한구석에 와 박히고 나는 까닭 모를 그리움에 걸음을 멈춘다. 내가 그리워하는 것은 떡이 아니라 누군가의 손에서 건네지던 온도, 아무 조건 없이 웃던 어린 시절의 얼굴일 것이다. 그때 우리 집 부엌에서도 어머니가 떡을 쪘고, 김이 오르는 시루 곁에서 형제들이 옹기종기 모여 앉던 풍경이 겹쳐 떠오른다."
    },
    {
      id: "p3",
      text: "골목을 빠져나와 큰길에 서면 시장의 소리가 한꺼번에 멀어진다. 가로등이 하나씩 켜지고, 자동차 불빛이 아스팔트 위를 달리며 길고 긴 궤적을 남긴다. 도시의 저녁은 시장의 저녁과 다르다. 시장에는 사람이 모이지만, 큰길에는 사람이 흩어진다. 모이는 곳에 이야기가 있고, 흩어지는 곳에 침묵이 있다. 나는 침묵 속을 걸으며 조금 전 시장에서 맡았던 냄새를 되새긴다. 바람이 외투 깃을 파고드는 큰길 위에서도 시장의 온기는 좀처럼 식지 않고 몸 안에 머물러 있다."
    },
    {
      id: "p4",
      text: "집에 돌아와 식탁 앞에 앉으면 시장에서 사 온 두부 한 모가 접시 위에 놓여 있다. 하얗고 단단한 그 위에 간장을 한 방울 떨어뜨리면, 갈색 무늬가 번지듯 퍼진다. 나는 두부를 한 점 떼어 입에 넣고 천천히 씹는다. 고소한 맛이 입안에 퍼지면서 오늘 시장에서 마주친 얼굴들, 소리들, 냄새들이 하나씩 돌아온다. 먹는다는 것은 결국 세상과 만나는 일이고, 시장이란 그 만남이 가장 솔직하게 이루어지는 곳이라는 생각이 든다. 접시 위 두부 한 모에는 장인의 손길과 콩을 키운 흙냄새와 우물의 물맛이 함께 담겨 있을 터이다. 오늘 하루도 시장은 나에게 삶의 온기를 건네주었다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 28 지문 길이: ${totalLen}자`);

  const content = makeShell(28, "LITERATURE", "dr-r2-028", "일일 독해(러셀 2) Day 28 문학");

  const timeline = [];
  let stepNum = 1;

  // s1: p1 감각적 이미지
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p1", "생선 비늘에 남은 햇살이 깜박이고, 고무다라이 속 미나리는 푸른 손을 내민다.")] },
    question: {
      prompt: "이 문장에 사용된 표현 기법으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "미나리를 사람처럼 표현하는 의인법을 활용하여 생동감을 부여하고 있다." },
        { id: "B", text: "과학적 용어를 사용하여 시장의 환경을 객관적으로 분석하고 있다." },
        { id: "C", text: "과거 회상을 통해 시간적 배경을 과거로 전환하고 있다." },
        { id: "D", text: "반어법을 써서 시장의 부정적 측면을 강조하고 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s2: p1 온기
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p1", "시장은 늘 이렇게 소란하고, 그 소란 속에 사람 사는 온기가 있다.")] },
    question: {
      prompt: "이 문장에서 '소란'과 '온기'의 관계로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "시장의 소란은 불편함이 아니라 사람들이 살아가는 따뜻함을 담고 있다." },
        { id: "B", text: "소란은 시장의 단점이며 온기와는 대립되는 부정적 요소이다." },
        { id: "C", text: "온기는 난방 장치에서 비롯된 물리적 열기를 가리킨다." },
        { id: "D", text: "소란이 사라져야 비로소 진정한 온기가 느껴진다는 뜻이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s3: p1 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: paragraphs[0].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "저녁 무렵 시장 골목의 감각적 풍경과 사람 사는 온기를 그리고 있다." },
        { id: "B", text: "시장의 비위생적 환경을 비판하며 개선을 촉구하고 있다." },
        { id: "C", text: "화자가 시장에서 물건을 구매하는 구체적 과정을 서술하고 있다." },
        { id: "D", text: "도시의 큰길과 시장을 비교하여 도시의 우월함을 강조하고 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s4: p2 - 그리움의 대상
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p2", "내가 그리워하는 것은 떡이 아니라 누군가의 손에서 건네지던 온도, 아무 조건 없이 웃던 어린 시절의 얼굴일 것이다.")] },
    question: {
      prompt: "화자가 진정으로 그리워하는 것으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "누군가의 따뜻한 손길과 순수했던 어린 시절의 기억이다." },
        { id: "B", text: "떡집에서 파는 인절미의 맛과 콩가루의 향이다." },
        { id: "C", text: "할머니와 손주 사이의 금전적 거래 관계이다." },
        { id: "D", text: "현재 시장에서 판매되는 다양한 먹거리이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s5: p2 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: paragraphs[1].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "떡집 앞 풍경을 통해 화자가 느끼는 그리움과 그 본질을 드러내고 있다." },
        { id: "B", text: "떡의 종류와 제조 과정을 상세히 설명하고 있다." },
        { id: "C", text: "할머니가 손주에게 경제 교육을 하는 장면을 묘사하고 있다." },
        { id: "D", text: "화자가 떡을 구매하여 집으로 돌아가는 과정을 서술하고 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s6: p3 - 대비
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p3", "시장에는 사람이 모이지만, 큰길에는 사람이 흩어진다. 모이는 곳에 이야기가 있고, 흩어지는 곳에 침묵이 있다.")] },
    question: {
      prompt: "이 문장에서 사용된 표현 기법으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "시장과 큰길을 대비하여 각 공간의 성격 차이를 부각하고 있다." },
        { id: "B", text: "시장을 비유적으로 칭송하면서 큰길을 완전히 부정하고 있다." },
        { id: "C", text: "의성어를 반복하여 시장의 소리를 사실적으로 재현하고 있다." },
        { id: "D", text: "열거법을 사용하여 큰길의 다양한 상점을 소개하고 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s7: p3 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: paragraphs[2].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "시장의 이야기와 큰길의 침묵을 대비하며 시장의 온기를 되새기고 있다." },
        { id: "B", text: "가로등과 자동차 불빛의 과학적 원리를 설명하고 있다." },
        { id: "C", text: "큰길이 시장보다 편리하고 효율적인 공간임을 주장하고 있다." },
        { id: "D", text: "화자가 시장을 떠나 다시는 돌아오지 않겠다고 결심하고 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s8: p4 - 먹는다는 것의 의미
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p4", "먹는다는 것은 결국 세상과 만나는 일이고, 시장이란 그 만남이 가장 솔직하게 이루어지는 곳이라는 생각이 든다.")] },
    question: {
      prompt: "이 문장에서 '먹는다는 것'에 대한 화자의 인식으로 적절한 것은?",
      choices: [
        { id: "A", text: "음식을 먹는 행위는 단순한 영양 섭취를 넘어 세상과 소통하는 일이다." },
        { id: "B", text: "먹는 행위는 생존에만 필요한 것으로 감정과는 무관하다." },
        { id: "C", text: "시장은 비위생적이므로 음식을 먹기에 적합하지 않은 장소이다." },
        { id: "D", text: "집에서 혼자 먹는 것이 시장에서 먹는 것보다 더 의미 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s9: p4 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: paragraphs[3].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "집에서 두부를 먹으며 시장에서 느낀 삶의 온기를 다시금 확인하고 있다." },
        { id: "B", text: "두부의 영양 성분과 건강상 이점을 구체적으로 설명하고 있다." },
        { id: "C", text: "화자가 요리에 대한 전문적 지식을 뽐내는 장면을 서술하고 있다." },
        { id: "D", text: "시장에서 산 물건이 품질이 나빠서 실망하고 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "고무다라이 속에서 푸른 손을 내민다고 표현된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "미나리")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "떡집 유리창 안에서 할머니가 손주에게 쥐어 준 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "인절미")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "아이의 입가에 묻어 있던 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "콩가루")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "모이는 곳에는 무엇이 있고 흩어지는 곳에는 무엇이 있다고 했는가?",
      answerRanges: [
        findRange(paragraphs, "p3", "이야기"),
        findRange(paragraphs, "p3", "침묵")
      ],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "화자가 시장에서 사 온 음식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "두부 한 모")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "화자가 먹는다는 것을 무엇이라고 표현하였는가?",
      answerRanges: [findRange(paragraphs, "p4", "세상과 만나는 일")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: makeRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
}


// ════════════════════════════════════════════════════════════════
// Day 29 — 비문학(NONFICTION): 위성 항법 시스템
// ════════════════════════════════════════════════════════════════

function buildDay29() {
  const paragraphs = [
    {
      id: "p1",
      text: "오늘날 스마트폰이나 자동차 내비게이션으로 자신의 위치를 실시간 확인하는 일은 일상이 되었다. 이러한 위치 확인 기술의 핵심에는 위성 항법 시스템이 있다. 위성 항법 시스템은 지구 궤도를 도는 여러 대의 인공위성이 보내는 전파 신호를 수신기가 받아 자신의 위치를 계산하는 원리로 작동한다. 대표적인 시스템으로는 미국의 GPS, 러시아의 글로나스, 유럽연합의 갈릴레오, 중국의 베이더우 등이 있다. 각 시스템은 독자적인 위성 군을 운용하며, 최근에는 여러 시스템의 신호를 동시에 수신하여 정확도를 높이는 다중 위성 항법 기술이 보편화되고 있다."
    },
    {
      id: "p2",
      text: "위성 항법의 기본 원리는 삼변측량이다. 하나의 위성에서 보내는 신호를 수신하면, 수신기는 그 위성으로부터 일정 거리에 있는 구의 표면 위에 놓이게 된다. 두 번째 위성의 신호를 추가로 수신하면 두 구가 교차하는 원 위로 위치가 좁혀지고, 세 번째 위성의 신호까지 더하면 그 원과 세 번째 구가 만나는 두 점 중 하나로 위치가 결정된다. 실제로는 지구 표면이라는 조건이 추가되므로 세 개의 위성만으로도 위치를 특정할 수 있다. 그러나 정확한 시각 동기화를 위해 네 번째 위성의 신호가 필요하며, 이를 통해 수신기의 시계 오차까지 보정한다."
    },
    {
      id: "p3",
      text: "위성이 보내는 전파는 빛의 속도로 이동하기 때문에 거리 계산은 신호의 전파 시간에 광속을 곱하여 이루어진다. 이때 신호가 대기를 통과하면서 속도가 미세하게 달라지는데, 특히 전리층과 대류층에서의 지연이 오차의 주된 원인이 된다. 전리층은 태양 활동에 의해 전하를 띤 입자가 밀집한 대기 상층부로, 전파의 속도를 변화시킨다. 대류층은 수증기와 기압의 변화가 큰 대기 하층부로, 전파의 경로를 굴절시킨다. 이러한 대기 지연 오차를 보정하기 위해 위성 항법 시스템은 이중 주파수 수신이나 보정 모델을 활용한다."
    },
    {
      id: "p4",
      text: "위성 항법 시스템의 정확도를 더욱 높이기 위해 보강 시스템이 운용된다. 지상 기준국에서 위성 신호의 오차를 실시간으로 측정하여 보정 정보를 사용자에게 전송하는 방식이다. 한국에서는 위성 기반 보강 시스템을 도입하여 항공기의 정밀 접근에 활용하고 있으며, 지상 기반 보강 시스템은 자율 주행 자동차의 센티미터급 측위에 기여하고 있다. 이처럼 위성 항법 기술은 단순한 길 안내를 넘어 항공, 해양, 측량, 재난 관리 등 다양한 분야에서 핵심 인프라로 자리 잡았으며, 앞으로 기술의 발전과 함께 그 활용 범위는 더욱 확대될 것이다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 29 지문 길이: ${totalLen}자`);

  const content = makeShell(29, "NONFICTION", "dr-r2-029", "일일 독해(러셀 2) Day 29 비문학");

  const timeline = [];
  let stepNum = 1;

  // s1: p1 - 위성 항법 원리
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p1", "위성 항법 시스템은 지구 궤도를 도는 여러 대의 인공위성이 보내는 전파 신호를 수신기가 받아 자신의 위치를 계산하는 원리로 작동한다.")] },
    question: {
      prompt: "위성 항법 시스템의 작동 원리로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "인공위성의 전파 신호를 수신기가 받아 위치를 계산하는 방식이다." },
        { id: "B", text: "지상 기지국에서 직접 전파를 보내 수신기의 위치를 결정한다." },
        { id: "C", text: "수신기가 자체 신호를 발사하여 위성과 통신하는 양방향 방식이다." },
        { id: "D", text: "인터넷 연결을 통해 서버에서 위치 정보를 받아오는 방식이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s2: p1 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: paragraphs[0].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "위성 항법 시스템의 개념과 대표적인 시스템들을 소개하고 있다." },
        { id: "B", text: "삼변측량의 수학적 원리를 구체적으로 설명하고 있다." },
        { id: "C", text: "대기 지연 오차의 보정 방법을 상세히 서술하고 있다." },
        { id: "D", text: "보강 시스템의 종류와 활용 사례를 설명하고 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s3: p2 - 삼변측량
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p2", "하나의 위성에서 보내는 신호를 수신하면, 수신기는 그 위성으로부터 일정 거리에 있는 구의 표면 위에 놓이게 된다.")] },
    question: {
      prompt: "위성 하나의 신호만으로 수신기의 위치를 알 수 없는 이유로 적절한 것은?",
      choices: [
        { id: "A", text: "수신기가 구의 표면 전체 위 어디에든 있을 수 있어 점을 특정할 수 없다." },
        { id: "B", text: "하나의 위성은 신호를 보내지 못하기 때문이다." },
        { id: "C", text: "수신기의 시계가 정확하여 추가 위성이 필요 없다." },
        { id: "D", text: "지구 표면이 평평하여 구의 개념을 적용할 수 없다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s4: p2 - 네 번째 위성
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p2", "그러나 정확한 시각 동기화를 위해 네 번째 위성의 신호가 필요하며, 이를 통해 수신기의 시계 오차까지 보정한다.")] },
    question: {
      prompt: "네 번째 위성의 신호가 필요한 이유로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "수신기의 시계 오차를 보정하기 위한 시각 동기화가 필요하기 때문이다." },
        { id: "B", text: "세 개의 위성으로는 전파를 수신할 수 없기 때문이다." },
        { id: "C", text: "네 번째 위성이 나머지 세 위성을 제어하는 역할을 하기 때문이다." },
        { id: "D", text: "지구의 자전 속도를 측정하기 위해 추가 위성이 필요하기 때문이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s5: p2 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: paragraphs[1].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "삼변측량 원리를 바탕으로 위성 신호로 위치를 결정하는 과정을 설명하고 있다." },
        { id: "B", text: "전리층과 대류층에서 발생하는 오차의 원인을 분석하고 있다." },
        { id: "C", text: "보강 시스템을 통해 위치 정확도를 높이는 방법을 서술하고 있다." },
        { id: "D", text: "위성 항법 시스템의 역사적 발전 과정을 시간순으로 정리하고 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s6: p3 - 전리층
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p3", "전리층은 태양 활동에 의해 전하를 띤 입자가 밀집한 대기 상층부로, 전파의 속도를 변화시킨다.")] },
    question: {
      prompt: "전리층이 오차를 일으키는 원리로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "전하를 띤 입자가 밀집하여 전파의 속도를 변화시키기 때문이다." },
        { id: "B", text: "수증기가 풍부하여 전파의 경로를 굴절시키기 때문이다." },
        { id: "C", text: "기압의 변화가 커서 위성의 궤도를 왜곡하기 때문이다." },
        { id: "D", text: "지표면에서 반사된 신호가 전리층에 의해 차단되기 때문이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s7: p3 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: paragraphs[2].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "대기 지연이 오차의 주된 원인이며 이를 보정하는 방법이 있다." },
        { id: "B", text: "위성의 전파가 빛보다 빠르게 이동한다는 사실을 설명하고 있다." },
        { id: "C", text: "삼변측량의 기하학적 원리를 수학적으로 증명하고 있다." },
        { id: "D", text: "위성 항법의 산업적 활용 사례를 나열하고 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s8: p4 - 보강 시스템
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p4", "지상 기준국에서 위성 신호의 오차를 실시간으로 측정하여 보정 정보를 사용자에게 전송하는 방식이다.")] },
    question: {
      prompt: "보강 시스템의 작동 방식으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "지상 기준국이 위성 신호의 오차를 측정하고 보정 정보를 사용자에게 보낸다." },
        { id: "B", text: "사용자가 직접 위성에 보정 데이터를 전송하여 오차를 수정한다." },
        { id: "C", text: "위성이 스스로 궤도를 수정하여 신호 오차를 줄이는 방식이다." },
        { id: "D", text: "인터넷 서버에서 지도 데이터를 보내 위치를 추정하는 방식이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s9: p4 - 자율 주행
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p4", "지상 기반 보강 시스템은 자율 주행 자동차의 센티미터급 측위에 기여하고 있다.")] },
    question: {
      prompt: "지상 기반 보강 시스템의 활용 사례로 언급된 것은?",
      choices: [
        { id: "A", text: "자율 주행 자동차의 센티미터급 정밀 위치 측정에 사용된다." },
        { id: "B", text: "항공기의 이착륙 과정에서만 제한적으로 활용된다." },
        { id: "C", text: "해양 생물의 이동 경로를 추적하는 데 사용된다." },
        { id: "D", text: "위성의 수명을 연장하기 위한 보수 작업에 활용된다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s10: p4 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: paragraphs[3].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "보강 시스템으로 정확도를 높이며 다양한 분야에서 활용되고 있다." },
        { id: "B", text: "위성 항법의 원리인 삼변측량을 구체적으로 설명하고 있다." },
        { id: "C", text: "전리층과 대류층의 과학적 특성을 비교 분석하고 있다." },
        { id: "D", text: "위성 항법 시스템이 곧 폐지될 것이라는 전망을 제시하고 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "위성 항법의 기본 원리를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "삼변측량")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "네 번째 위성의 신호로 보정하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "수신기의 시계 오차")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "신호의 전파 시간에 무엇을 곱하여 거리를 계산하는가?",
      answerRanges: [findRange(paragraphs, "p3", "광속")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "태양 활동에 의해 전하를 띤 입자가 밀집한 대기 상층부를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p3", "전리층")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "수증기와 기압의 변화가 큰 대기 하층부를 무엇이라 하는가?",
      answerRanges: [findRange(paragraphs, "p3", "대류층")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "위성 기반 보강 시스템이 한국에서 활용되는 분야는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "항공기의 정밀 접근")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "지상 기반 보강 시스템이 자율 주행 자동차에 기여하는 측위 수준은 어느 정도인가?",
      answerRanges: [findRange(paragraphs, "p4", "센티미터급")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: makeRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
}


// ════════════════════════════════════════════════════════════════
// Day 30 — 문학(LITERATURE): 현대 수필
// ════════════════════════════════════════════════════════════════

function buildDay30() {
  const paragraphs = [
    {
      id: "p1",
      text: "지난 가을, 오래된 친구에게서 편지 한 통이 도착했다. 흰 봉투에 파란 잉크로 쓴 글씨가 삐뚤빼뚤 기울어져 있었고, 봉투 안에는 마른 은행잎 한 장이 끼어 있었다. 편지에는 별다른 내용이 없었다. 요즘도 건강하냐는 안부, 우리 동네 은행나무가 올해 유난히 노랗다는 이야기, 그리고 가끔 네 생각이 난다는 한 줄. 나는 그 짧은 편지를 읽고 또 읽었다. 글자 사이에서 친구의 목소리가 들리는 듯했고, 은행잎에서는 가을 바람 냄새가 나는 듯했다. 편지를 내려놓은 뒤에도 한동안 창밖의 가로수를 바라보며 멍하니 앉아 있었다."
    },
    {
      id: "p2",
      text: "우리는 같은 중학교를 다녔다. 방과 후면 학교 뒤 골목에서 구슬치기를 하거나, 개울가에 앉아 물장구를 치며 시간을 보냈다. 특별한 이야기를 나눈 기억은 없지만, 함께 있다는 것만으로 하루가 넉넉했다. 졸업 후 각자의 길을 갔고, 연락은 점점 뜸해졌다. 전화번호는 바뀌었고, 주소도 잊혔고, 소셜 미디어에서조차 서로를 찾지 않았다. 그렇게 이십여 년이 흘렀다. 인연이란 물처럼 한곳에 머무르지 않고 흐르는 것이어서, 나는 그 친구를 잊고 살았다."
    },
    {
      id: "p3",
      text: "그런데 편지가 왔다. 이메일도, 문자 메시지도 아닌 손으로 쓴 편지가. 나는 친구가 어떻게 내 주소를 알았는지 궁금했지만, 그보다 먼저 가슴 한편이 뜨거워졌다. 이십여 년의 공백이 무색하게 그 편지는 마치 어제 헤어진 사람이 건네는 안부처럼 자연스러웠다. 손글씨에는 디지털 문자에는 없는 무게가 있었다. 글자의 크기, 기울기, 펜을 누른 힘까지 고스란히 전해졌고, 그것은 곧 상대방의 시간과 정성이 물질로 변한 것이었다. 나는 그 편지를 책상 유리 밑에 넣어 두고 매일 한 번씩 들여다보았다."
    },
    {
      id: "p4",
      text: "얼마 후 나도 편지를 썼다. 컴퓨터 앞이 아니라 식탁 위에 편지지를 펴고 펜을 들었다. 막상 쓰려니 첫 문장이 나오지 않았다. 무엇을 써야 할지, 어디서부터 시작해야 할지 몰랐다. 하지만 펜 끝이 종이에 닿는 순간, 글자가 저절로 흘러나왔다. 함께 놀던 골목 이야기, 개울가의 물소리, 졸업식 날 어색하게 악수하던 장면까지. 한 장, 두 장, 세 장을 채우고도 할 말이 남아 있었다. 글을 다 쓰고 나서 깨달았다. 편지란 소식을 전하는 것이 아니라 마음을 건네는 일이며, 그 마음은 세월이 흘러도 빛을 잃지 않는다는 것을. 나는 정성껏 봉투에 편지를 넣고 우체통에 넣으러 가는 길에 발걸음이 한결 가벼웠다."
    }
  ];

  const totalLen = charLen(paragraphs);
  console.log(`Day 30 지문 길이: ${totalLen}자`);

  const content = makeShell(30, "LITERATURE", "dr-r2-030", "일일 독해(러셀 2) Day 30 문학");

  const timeline = [];
  let stepNum = 1;

  // s1: p1 - 편지 묘사
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p1", "흰 봉투에 파란 잉크로 쓴 글씨가 삐뚤빼뚤 기울어져 있었고, 봉투 안에는 마른 은행잎 한 장이 끼어 있었다.")] },
    question: {
      prompt: "이 묘사에서 드러나는 편지의 특징으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "손으로 직접 쓴 정성과 계절의 감각이 담긴 인간적 전달물이다." },
        { id: "B", text: "인쇄된 활자체로 깔끔하게 작성된 공식 문서에 해당한다." },
        { id: "C", text: "디지털 기기로 작성되어 효율적으로 전달된 메시지이다." },
        { id: "D", text: "여러 사람에게 동시에 발송한 광고성 우편물의 성격이 강하다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s2: p1 - 짧은 편지 감상
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p1", "나는 그 짧은 편지를 읽고 또 읽었다.")] },
    question: {
      prompt: "화자가 짧은 편지를 반복해서 읽은 이유로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "짧은 글 속에 담긴 친구의 마음과 기억이 깊은 감동을 주었기 때문이다." },
        { id: "B", text: "편지의 내용이 복잡하고 어려워서 이해하기 힘들었기 때문이다." },
        { id: "C", text: "글씨가 너무 작아서 한 번에 읽을 수 없었기 때문이다." },
        { id: "D", text: "편지에 중요한 사업 제안이 포함되어 있어 신중히 검토했기 때문이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s3: p1 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: paragraphs[0].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "오래된 친구에게서 온 손편지가 화자에게 깊은 감흥을 불러일으킨다." },
        { id: "B", text: "화자가 은행잎을 수집하는 취미를 가지고 있음을 보여 준다." },
        { id: "C", text: "친구가 건강 문제로 인해 화자에게 도움을 요청하는 내용이다." },
        { id: "D", text: "편지 배달 시스템의 문제점을 비판하고 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s4: p2 - 인연에 대한 인식
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p2", "인연이란 물처럼 한곳에 머무르지 않고 흐르는 것이어서, 나는 그 친구를 잊고 살았다.")] },
    question: {
      prompt: "이 문장에서 인연을 '물'에 비유한 의도로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "인연은 고정되어 있지 않고 자연스럽게 흘러가며 변한다는 뜻이다." },
        { id: "B", text: "인연은 물처럼 투명하여 눈에 보이지 않는다는 뜻이다." },
        { id: "C", text: "인연은 물처럼 차가워서 사람의 마음을 식힌다는 뜻이다." },
        { id: "D", text: "인연은 물을 마시듯 의도적으로 만들어야 한다는 뜻이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s5: p2 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: paragraphs[1].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "중학교 시절의 추억과 세월 속에서 자연스럽게 멀어진 우정을 회고한다." },
        { id: "B", text: "소셜 미디어의 발달로 오히려 인간관계가 돈독해졌음을 설명한다." },
        { id: "C", text: "화자가 의도적으로 친구를 피하며 연락을 끊은 이유를 밝힌다." },
        { id: "D", text: "졸업 후 두 사람이 같은 직장에서 다시 만난 과정을 서술한다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s6: p3 - 손글씨의 의미
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p3", "손글씨에는 디지털 문자에는 없는 무게가 있었다.")] },
    question: {
      prompt: "여기서 말하는 '무게'의 의미로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "글씨를 쓰는 사람의 시간과 정성이 물리적 흔적으로 남아 전달되는 가치이다." },
        { id: "B", text: "편지지의 두께와 종이의 무게를 물리적으로 측정한 결과를 뜻한다." },
        { id: "C", text: "디지털 문자보다 손편지가 경제적으로 더 비싸다는 의미이다." },
        { id: "D", text: "손으로 쓴 글씨는 읽기 어려워 부담스럽다는 부정적 뜻이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s7: p3 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: paragraphs[2].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "손편지가 지닌 고유한 가치와 그것이 화자에게 준 감동을 서술하고 있다." },
        { id: "B", text: "이메일과 문자 메시지의 기술적 장점을 손편지와 비교하고 있다." },
        { id: "C", text: "친구의 주소를 추적하는 과정에서 겪은 어려움을 서술하고 있다." },
        { id: "D", text: "화자가 편지를 버리기로 결심하는 과정을 묘사하고 있다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s8: p4 - 편지를 쓰는 행위
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p4", "하지만 펜 끝이 종이에 닿는 순간, 글자가 저절로 흘러나왔다.")] },
    question: {
      prompt: "이 문장에서 드러나는 글쓰기 경험으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "처음에는 막막했지만, 쓰기 시작하자 기억과 감정이 자연스럽게 흘러나왔다." },
        { id: "B", text: "글쓰기가 매우 어려워서 결국 포기하고 이메일을 보내기로 했다." },
        { id: "C", text: "미리 준비한 원고를 그대로 옮겨 적었기 때문에 쉽게 완성하였다." },
        { id: "D", text: "펜이 고장 나서 다른 필기구로 교체해야 했다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s9: p4 - 편지의 본질
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [findRange(paragraphs, "p4", "편지란 소식을 전하는 것이 아니라 마음을 건네는 일이며, 그 마음은 세월이 흘러도 빛을 잃지 않는다는 것을.")] },
    question: {
      prompt: "이 문장에서 화자가 깨달은 편지의 본질로 적절한 것은?",
      choices: [
        { id: "A", text: "편지는 정보 전달이 아니라 마음을 나누는 행위이며 그 가치는 변하지 않는다." },
        { id: "B", text: "편지는 소식을 빠르게 전달하는 효율적인 통신 수단이다." },
        { id: "C", text: "편지는 시간이 지나면 종이가 바래져 가치를 잃게 된다." },
        { id: "D", text: "편지보다 전화 통화가 마음을 전하는 데 더 효과적이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // s10: p4 중심내용
  timeline.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: paragraphs[3].text.length }] },
    question: {
      prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "화자가 직접 편지를 쓰며 편지가 마음을 건네는 행위임을 깨닫는다." },
        { id: "B", text: "화자가 컴퓨터로 답장을 작성하여 이메일로 전송하는 과정이다." },
        { id: "C", text: "친구와 전화 통화를 하며 추억을 나누는 장면을 그리고 있다." },
        { id: "D", text: "화자가 편지 쓰기를 포기하고 직접 친구를 방문하는 내용이다." }
      ],
      answerId: "A",
      scoring: intensiveScoring
    }
  });

  // 확인 문항
  const confirmQuestions = [
    {
      id: "q1",
      prompt: "편지 봉투 안에 끼어 있던 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "마른 은행잎 한 장")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "두 사람이 방과 후에 했던 놀이 중 하나로 언급된 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "구슬치기")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "화자가 친구와 떨어져 산 기간은 대략 얼마인가?",
      answerRanges: [findRange(paragraphs, "p2", "이십여 년")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "화자가 손글씨에 디지털 문자에는 없다고 느낀 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "무게")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "화자가 받은 편지를 어디에 보관하였는가?",
      answerRanges: [findRange(paragraphs, "p3", "책상 유리 밑")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "화자가 깨달은 편지의 본질은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "마음을 건네는 일")],
      scoring: confirmScoring,
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ];

  content.payload = {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: makeRecallCards(paragraphs),
    confirm: { questions: confirmQuestions }
  };

  return content;
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
    { day: 26, subArea: "LITERATURE", build: buildDay26 },
    { day: 27, subArea: "NONFICTION", build: buildDay27 },
    { day: 28, subArea: "LITERATURE", build: buildDay28 },
    { day: 29, subArea: "NONFICTION", build: buildDay29 },
    { day: 30, subArea: "LITERATURE", build: buildDay30 },
  ];

  const contents = [];
  for (const b of builders) {
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
    const idx = day - 1; // items[25]~[29]
    const batchItem = makeBatchItem(day, subArea, content);
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
