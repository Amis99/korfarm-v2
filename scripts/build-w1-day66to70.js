/**
 * 비트겐슈타인1 Day 66~70 일일독해 콘텐츠 빌더 스크립트
 * - Day 66(문학), 67(비문학), 68(문학), 69(비문학), 70(문학)
 * - 지문 3~4문단, 합계 1400자 +-50 (1350~1450)
 * - 정독: buildTimeline (문장별 하이라이트 + 4지선다)
 * - 복기: buildRecallCards (정확히 8카드, seedPenalty: 1)
 * - 확인: 5~8문항, 질문형, answerMatchMode: "ANY", revealOnWrong: true
 */

const fs = require('fs');
const path = require('path');

// ========== 유틸리티 함수 ==========

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
  if (start === -1) throw new Error(`"${searchText}"를 ${pid}에서 찾을 수 없습니다.`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charLen(text) {
  return text.length;
}

function hashIdx(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function truncate(text, maxLen = 80) {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

function shuffleChoices(choices, seed) {
  const arr = [...choices];
  let s = seed || 42;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // id 재할당
  const ids = ['A','B','C','D'];
  let answerId = '';
  const result = arr.map((c, idx) => {
    if (c._correct) answerId = ids[idx];
    return { id: ids[idx], text: c.text };
  });
  return { choices: result, answerId };
}

function countTotalChars(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

// 정독 타임라인 생성
function buildTimeline(paragraphs) {
  const timeline = [];
  let stepCount = 1;

  for (const para of paragraphs) {
    const sentences = findSentences(para.text);

    for (let si = 0; si < sentences.length; si++) {
      const sent = sentences[si];
      // 다른 문단에서 오답 선택지 수집
      const otherSentences = [];
      for (const otherPara of paragraphs) {
        const otherSents = findSentences(otherPara.text);
        for (const os of otherSents) {
          if (os.text !== sent.text && os.text.length > 10) {
            otherSentences.push(os.text);
          }
        }
      }

      const wrongTexts = shuffleWithSeed(otherSentences, hashIdx(sent.text)).slice(0, 3);

      const rawChoices = [
        { text: truncate(sent.text), _correct: true },
        ...wrongTexts.map(t => ({ text: truncate(t), _correct: false }))
      ];

      // 4개 미만이면 보충
      while (rawChoices.length < 4) {
        rawChoices.push({ text: '이 문장은 지문에 포함되지 않은 내용이다.', _correct: false });
      }

      const { choices, answerId } = shuffleChoices(rawChoices, hashIdx(sent.text + stepCount));

      timeline.push({
        stepId: `s${stepCount++}`,
        highlight: {
          ranges: [{
            paragraphId: para.id,
            start: sent.start,
            end: sent.end
          }]
        },
        question: {
          prompt: '하이라이트된 문장의 내용으로 알맞은 것은?',
          choices,
          answerId,
          scoring: {
            correctDeltaSec: 20,
            wrongDeltaSec: -40,
            eliminateWrongChoice: true
          }
        }
      });
    }

    // 문단별 중심내용 질문
    const paraSentences = findSentences(para.text);
    const otherParaSentences = [];
    for (const otherPara of paragraphs) {
      if (otherPara.id !== para.id) {
        const os = findSentences(otherPara.text);
        for (const s of os) {
          if (s.text.length > 15) otherParaSentences.push(s.text);
        }
      }
    }

    const centerSent = paraSentences[0];
    const wrongCenter = shuffleWithSeed(otherParaSentences, hashIdx(para.id)).slice(0, 3);

    const rawCenterChoices = [
      { text: truncate(centerSent.text), _correct: true },
      ...wrongCenter.map(t => ({ text: truncate(t), _correct: false }))
    ];
    while (rawCenterChoices.length < 4) {
      rawCenterChoices.push({ text: '이 문단의 내용과 관련 없는 선택지이다.', _correct: false });
    }

    const { choices: centerChoices, answerId: centerAnswerId } = shuffleChoices(rawCenterChoices, hashIdx(para.id + 'center'));

    timeline.push({
      stepId: `s${stepCount++}`,
      highlight: {
        ranges: [{
          paragraphId: para.id,
          start: 0,
          end: para.text.length
        }]
      },
      question: {
        prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
        choices: centerChoices,
        answerId: centerAnswerId,
        scoring: {
          correctDeltaSec: 20,
          wrongDeltaSec: -40,
          eliminateWrongChoice: true
        }
      }
    });
  }

  return { timeline };
}

function shuffleWithSeed(arr, seed) {
  const a = [...arr];
  let s = seed || 42;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 복기 카드 생성 (정확히 8카드)
function buildRecallCards(paragraphs, cardCount = 8) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length;
  const cardLen = Math.floor(totalLen / cardCount);
  const cards = [];
  let pos = 0;

  for (let i = 0; i < cardCount; i++) {
    let end;
    if (i === cardCount - 1) {
      end = totalLen;
    } else {
      end = pos + cardLen;
      while (end < totalLen && fullText[end] !== ' ' && fullText[end] !== '\n' && fullText[end] !== '.' && fullText[end] !== ',') {
        end++;
      }
      if (end < totalLen && (fullText[end] === '.' || fullText[end] === ',')) end++;
    }
    cards.push({
      id: `c${i + 1}`,
      text: fullText.substring(pos, end).trim()
    });
    pos = end;
    while (pos < totalLen && fullText[pos] === ' ') pos++;
  }

  return {
    cards,
    correctOrder: cards.map(c => c.id),
    seedPenalty: 1
  };
}

// 확인 문제 생성 (5~8문항)
function buildConfirmQuestions(paragraphs) {
  const questions = [];
  const questionTemplates = [];

  for (const para of paragraphs) {
    const sents = findSentences(para.text);
    for (const s of sents) {
      const concepts = extractKeyConcepts(s.text);
      for (const concept of concepts) {
        const startInPara = para.text.indexOf(concept);
        if (startInPara !== -1) {
          questionTemplates.push({
            concept,
            sentence: s.text,
            pid: para.id,
            start: startInPara,
            end: startInPara + concept.length
          });
        }
      }
    }
  }

  const selected = shuffleWithSeed(questionTemplates, 66).slice(0, 6);

  for (let i = 0; i < selected.length; i++) {
    const q = selected[i];
    questions.push({
      id: `q${i + 1}`,
      prompt: generateQuestionPrompt(q.concept, q.sentence),
      answerRanges: [{
        paragraphId: q.pid,
        start: q.start,
        end: q.end
      }],
      scoring: {
        correctDeltaSec: 30,
        wrongDeltaSec: -45
      },
      revealOnWrong: true,
      answerMatchMode: 'ANY'
    });
  }

  return { questions };
}

function extractKeyConcepts(sentence) {
  const concepts = [];
  // 따옴표 안의 용어
  const quoted = sentence.match(/'[^']+'/g);
  if (quoted) {
    for (const q of quoted) {
      const clean = q.replace(/'/g, '');
      if (clean.length >= 2 && clean.length <= 15) concepts.push(clean);
    }
  }
  // 한자어/전문용어 패턴
  const terms = sentence.match(/[가-힣]{3,8}(?=은 |는 |이 |가 |을 |를 |의 |에 |로 |와 |과 |도 |라 |라고)/g);
  if (terms) {
    for (const t of terms) {
      if (!concepts.includes(t) && t.length >= 3 && !/[하되지며으]$/.test(t)) {
        concepts.push(t);
      }
    }
  }
  // 전문 용어 패턴 (OO론, OO주의, OO학, OO설 등)
  const specialTerms = sentence.match(/[가-힣]{2,6}(?:론|주의|학|설|법|권|율|력|성|도)/g);
  if (specialTerms) {
    for (const t of specialTerms) {
      if (!concepts.includes(t) && t.length >= 3) concepts.push(t);
    }
  }
  return concepts.slice(0, 3);
}

function generateQuestionPrompt(concept, sentence) {
  const templates = [
    `이 글에서 '${concept}'이(가) 의미하는 바에 해당하는 부분은 어디인가요?`,
    `'${concept}'에 해당하는 내용이 나타난 부분은 어디인가요?`,
    `이 글에서 '${concept}'이(가) 언급된 부분은 어디인가요?`,
    `'${concept}'과(와) 관련된 설명이 등장하는 부분은 어디인가요?`,
    `글에서 '${concept}'의 역할을 설명하는 부분은 어디인가요?`,
    `'${concept}'이(가) 포함된 문맥은 어디인가요?`
  ];
  return templates[hashIdx(concept) % templates.length];
}

// ========== 콘텐츠 조립 ==========

function assembleFull({ dayIndex, subArea, title, paragraphs }) {
  const dayStr = String(dayIndex).padStart(3, '0');
  const contentId = `dr-w1-${dayStr}`;

  const intensive = buildTimeline(paragraphs);
  const recall = buildRecallCards(paragraphs);
  const confirm = buildConfirmQuestions(paragraphs);

  return {
    content_type: 'DAILY_READING',
    level_id: 'WITTGENSTEIN_1',
    area: 'READING',
    sub_area: subArea,
    day_index: dayIndex,
    module_key: 'reading_training',
    schema_version: '1.0',
    content: {
      contentId,
      contentType: 'DAILY_READING',
      version: 1,
      status: 'PUBLISHED',
      title,
      description: '일일 독해 - 정독·복기·확인',
      targetLevel: 'WITTGENSTEIN_1',
      schoolGradeRange: { min: 9, max: 10 },
      area: 'READING',
      subArea,
      competencies: ['READING'],
      tags: ['daily'],
      access: { mode: 'FREE' },
      seedReward: { seedType: 'WHEAT', count: 3, multiplier: 1 },
      timeLimitSec: 480,
      assets: {},
      payload: {
        passage: {
          format: 'TEXT',
          paragraphs
        },
        intensive,
        recall,
        confirm
      }
    }
  };
}

function wrapBatchItem(assembled) {
  return assembled; // 이미 level_id 포함된 전체 구조
}

// ========== 콘텐츠 정의 ==========

function buildDay66() {
  // Day 66 - 문학 (LITERATURE): 현대 소설 - 한 노동자의 하루
  const paragraphs = [
    {
      id: 'p1',
      text: '새벽 다섯 시 반, 알람이 울리기 전에 그녀는 이미 눈을 떴다. 몸 안에 박혀 버린 생체 시계가 기계 알람보다 언제나 정확했다. 부엌에서 밥솥의 예약 취사 완료음이 울렸고, 그녀는 잠옷 위에 앞치마를 두른 채 반찬 세 가지를 서둘러 만들었다. 아이들 도시락 두 개를 싸고 나면 자신이 밥을 먹을 시간은 늘 남지 않았다. 선 채로 물 한 잔을 마시고 현관문을 나서면 바깥은 아직 어둑어둑한 새벽빛 속에 잠겨 있었다. 버스 정류장까지 십 분 남짓을 걸어야 했는데, 겨울에는 길이 얼어붙어서 발걸음이 한결 더 조심스러웠다. 정류장에서 만나는 얼굴들은 언제나 같았고, 서로 인사를 나누는 일도 드물었다. 저마다의 피로가 입을 닫게 만드는 듯했다.'
    },
    {
      id: 'p2',
      text: '공장까지는 버스로 사십 분이 걸렸다. 차창 밖 풍경이 아파트 단지에서 공업 단지로 서서히 바뀌는 것을 그녀는 매일 지켜보았지만, 그 변화가 눈에 들어온 적은 거의 없었다. 공장에 도착하면 탈의실에서 작업복으로 갈아입고 곧바로 생산 라인에 서야 했다. 컨베이어 벨트 위를 쉬지 않고 지나는 부품에 나사를 조이는 동작을 하루 수백 번 반복하는 것이 그녀의 일이었다. 손목이 저리고 어깨가 결리는 것은 오래전부터 익숙한 통증이었다. 점심시간이 되면 구내식당에서 급하게 밥을 먹고 나머지 시간에는 잠깐이라도 눈을 붙이려 했다. 오후에 라인이 다시 돌아가기 시작하면 또 같은 동작의 끝없는 반복이었다. 퇴근 시각이 되어도 잔업이 있으면 두어 시간을 더 서야 하는 날도 적지 않았다.'
    },
    {
      id: 'p3',
      text: '퇴근 버스에서 그녀는 으레 창가 자리에 앉아 고개를 유리에 기댔다. 잠이 드는 것도 아니고 깨어 있는 것도 아닌 몽롱한 상태로 정류장을 세었다. 장을 봐야 할 날에는 시장 앞에서 내려 허리를 숙여 가며 채소를 골랐다. 무거운 장바구니를 양손에 들고 아파트 계단을 오르면 종아리가 떨렸다. 현관문을 열면 아이들은 이미 집에 돌아와 있었고, 텔레비전 소리와 장난감이 부딪히는 소리가 뒤섞여 있었다. 그녀는 장바구니를 내려놓자마자 저녁 준비에 들어갔다. 아이들이 숙제를 물어오면 국이 끓는 냄비를 앞에 둔 채로 공책을 함께 들여다보았다. 저녁 식사와 설거지가 끝나면 어김없이 밤 열 시가 넘어 있었다.'
    },
    {
      id: 'p4',
      text: '아이들이 잠든 뒤 그녀는 거실 한구석에 놓인 작은 책상 앞에 앉았다. 월급 명세서와 공과금 고지서를 번갈아 들여다보며 이번 달 생활비를 꼼꼼히 계산했다. 숫자를 맞추고 나면 남는 것은 거의 없었지만, 아이들 학원비만큼은 줄이지 않겠다는 다짐을 매달 되풀이했다. 창밖에는 아파트 단지의 가로등 불빛이 일렬로 늘어서 있었다. 그 불빛들이 저마다의 삶을 밝히고 있다는 생각이 문득 들었다. 자신과 비슷한 하루를 보내고 있을 누군가가 저 불빛 아래에도 분명히 있을 것이었다. 그녀는 명세서를 서랍에 넣고 불을 껐다. 내일도 새벽 다섯 시 반에 눈을 뜰 것이었다. 알람이 울리기 전에.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 66 총 글자 수: ${total}`);

  return assembleFull({
    dayIndex: 66,
    subArea: 'LITERATURE',
    title: '일일 독해(비트겐슈타인 1) Day 66 문학',
    paragraphs
  });
}

function buildDay67() {
  // Day 67 - 비문학 (NONFICTION): 사회학 - 도시화와 공동체 변화
  const paragraphs = [
    {
      id: 'p1',
      text: '산업 혁명 이후 세계 각국에서는 농촌 인구가 도시로 이동하는 도시화 현상이 급격하게 진행되었다. 도시화란 인구가 농촌에서 도시로 집중하면서 도시적 생활 양식이 확산되는 과정을 말한다. 초기 도시화는 공장 노동력에 대한 수요가 주된 원인이었으나, 이후에는 교육과 의료 등 도시의 사회 기반 시설이 제공하는 편의가 인구 유입의 중요한 동기가 되었다. 한국의 경우에도 일구육공 년대 이후 산업화와 함께 급격한 도시화가 진행되어, 현재 전체 인구의 약 구십 퍼센트 이상이 도시 지역에 거주하고 있다. 이러한 인구 집중은 경제 성장의 동력이 되기도 했지만, 동시에 주거 환경의 악화와 교통 혼잡 등 다양한 사회 문제를 야기하였다.'
    },
    {
      id: 'p2',
      text: '도시화가 가져온 가장 근본적인 변화 중 하나는 전통적 공동체의 해체이다. 농촌 사회에서는 혈연과 지연을 바탕으로 한 공동체가 구성원 간의 긴밀한 상호 부조를 가능하게 했다. 마을 주민들은 농사일을 함께하고 경조사를 공유하며 일상적인 돌봄을 교환하는 관계를 유지했다. 그러나 도시로 이주한 개인들은 이러한 관계망에서 벗어나게 되었다. 도시에서의 인간관계는 주로 직장이나 학교 등 기능적 조직을 중심으로 형성되며, 이웃 간의 교류는 현저하게 줄어든다. 사회학자 페르디난트 퇴니스는 이러한 변화를 공동 사회에서 이익 사회로의 전환이라 설명하였다. 공동 사회가 자연 발생적인 유대에 기반한다면, 이익 사회는 개인의 목적과 이해관계에 따라 인위적으로 결합된 관계라는 것이다.'
    },
    {
      id: 'p3',
      text: '전통적 공동체의 해체는 개인에게 자유를 부여하는 동시에 고립의 위험을 수반한다. 도시 거주자들은 익명성 속에서 타인의 간섭을 받지 않는 자유를 누리지만, 긴급한 상황에서 도움을 요청할 수 있는 관계가 부재하는 경우가 많다. 특히 고령 인구의 고독사 문제는 도시적 고립이 극단적 형태로 드러난 사례이다. 이에 따라 도시 내에서 새로운 형태의 공동체를 구축하려는 시도가 활발하게 이루어지고 있다. 주민 자치 조직이나 마을 만들기 사업은 지역 주민 간의 유대를 복원하려는 노력의 일환이며, 온라인 커뮤니티를 통한 이웃 간 교류 플랫폼도 등장하고 있다. 이러한 시도들은 전통적 공동체를 그대로 복원하는 것이 아니라 도시 환경에 적합한 새로운 관계망을 창출하는 것을 목표로 한다.'
    },
    {
      id: 'p4',
      text: '도시화와 공동체 변화에 대한 논의는 단순히 과거를 회복하자는 차원을 넘어선다. 현대 도시는 다양한 배경의 사람들이 공존하는 공간이므로, 혈연이나 지연에 의존하지 않는 새로운 연대 원리가 필요하다. 공통의 관심사나 가치관을 기반으로 형성되는 공동체가 그 대안으로 주목받고 있다. 환경 보호 활동이나 문화 예술 동호회 등이 그 예이다. 이러한 가치 기반 공동체는 구성원의 자발적 참여를 토대로 운영되므로 강제성이 없으며, 개인의 자율성을 존중하면서도 소속감과 유대를 제공한다. 도시 사회가 지속 가능한 형태로 발전하기 위해서는 개인의 자유와 공동체적 연대가 균형을 이루는 방향으로 사회 구조가 재편될 필요가 있다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 67 총 글자 수: ${total}`);

  return assembleFull({
    dayIndex: 67,
    subArea: 'NONFICTION',
    title: '일일 독해(비트겐슈타인 1) Day 67 비문학',
    paragraphs
  });
}

function buildDay68() {
  // Day 68 - 문학 (LITERATURE): 현대시 감상 - 김소월 '진달래꽃'의 이별 미학
  const paragraphs = [
    {
      id: 'p1',
      text: '김소월의 진달래꽃은 이별을 소재로 한 한국 서정시의 대표작이다. 이 시에서 화자는 떠나가는 임에게 영변의 약산 진달래꽃을 한 아름 뿌리겠다고 말한다. 꽃을 뿌리는 행위는 떠나는 이의 발걸음을 축복하는 것으로, 이별의 슬픔을 원망이 아닌 헌신으로 승화시키는 태도를 보여 준다. 화자는 떠나는 것을 막지 않겠다고 선언하면서도, 그 선언 속에 차마 보낼 수 없는 간절한 마음을 깊이 감추고 있다. 이러한 이중적인 감정 구조가 이 시의 핵심적인 미학적 특질이다. 겉으로는 순종적 태도를 취하면서 안으로는 격렬한 감정을 억누르는 방식은 한국 전통 서정의 대표적 정서인 한과 맞닿아 있다.'
    },
    {
      id: 'p2',
      text: '시의 구조를 살펴보면 반복과 점층의 기법이 효과적으로 사용되고 있다. 나 보기가 역겨워 가실 때에는이라는 구절이 반복되면서 이별의 불가피함을 강조하고, 화자의 감정이 단계적으로 심화된다. 처음에는 말없이 보내겠다고 했다가, 이어서 꽃을 뿌리겠다는 적극적 행위를 제시하며, 마지막에는 죽어도 아니 눈물 흘리우리다라는 극단적 다짐으로 감정의 절정에 이른다. 이 점층적 구조는 독자로 하여금 화자의 감정이 단순한 체념이 아니라 자존심과 사랑 사이에서의 치열한 내적 갈등임을 깨닫게 한다. 특히 마지막 연의 다짐은 역설적으로 화자가 얼마나 깊은 슬픔을 느끼고 있는지를 드러내는 장치로서 기능한다.'
    },
    {
      id: 'p3',
      text: '진달래꽃이라는 소재 자체도 중요한 상징적 의미를 지닌다. 진달래는 이른 봄에 아직 추위가 남아 있을 때 산야에 가장 먼저 피어나는 꽃이다. 척박한 환경에서도 꿋꿋이 피어나는 진달래의 속성은 고난 속에서도 사랑을 지키려는 화자의 의지와 겹쳐진다. 또한 진달래는 한국의 산야 어디에서나 볼 수 있는 친숙한 꽃으로, 보편적 정서와 연결되는 토속적 아름다움을 지닌다. 시인은 이국적이거나 화려한 꽃이 아닌 소박한 야생화를 선택함으로써 민중의 삶에 뿌리박은 정서를 표현하였다. 진달래꽃을 뿌리는 행위는 자신의 마음을 길 위에 펼쳐 놓는 것이며, 떠나는 이가 그 위를 밟고 가도 원망하지 않겠다는 무조건적 사랑의 표현이기도 하다.'
    },
    {
      id: 'p4',
      text: '이 시가 발표된 일구이사 년의 시대적 배경도 작품 해석에 중요한 맥락을 제공한다. 일제 강점기라는 암울한 현실 속에서 떠나가는 임은 단순한 연인이 아니라 잃어버린 조국이나 자유를 상징하는 것으로 읽히기도 한다. 이 경우 화자의 헌신적 태도는 고통스러운 현실 속에서도 희망을 놓지 않으려는 민족적 의지의 표현으로 해석할 수 있다. 물론 이러한 알레고리적 해석이 시의 서정적 가치를 대체하는 것은 아니다. 진달래꽃의 문학사적 의의는 개인의 사랑 노래가 시대의 아픔과 자연스럽게 공명할 수 있음을 보여 준 데에 있다. 김소월은 민요적 율격과 토속적 소재를 통해 한국 시의 고유한 목소리를 확립한 시인으로 평가받으며, 진달래꽃은 그 정점에 놓인 작품이다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 68 총 글자 수: ${total}`);

  return assembleFull({
    dayIndex: 68,
    subArea: 'LITERATURE',
    title: '일일 독해(비트겐슈타인 1) Day 68 문학',
    paragraphs
  });
}

function buildDay69() {
  // Day 69 - 비문학 (NONFICTION): 과학 - 미세 플라스틱과 환경 오염
  const paragraphs = [
    {
      id: 'p1',
      text: '미세 플라스틱은 크기가 오 밀리미터 이하인 작은 플라스틱 조각을 총칭하는 용어이다. 미세 플라스틱은 발생 경로에 따라 일차 미세 플라스틱과 이차 미세 플라스틱으로 구분된다. 일차 미세 플라스틱은 처음부터 미세한 크기로 제조된 것으로, 세안제나 치약에 포함된 마이크로비즈가 대표적이다. 이차 미세 플라스틱은 페트병이나 비닐봉지 같은 대형 플라스틱 제품이 자외선과 파도 등에 의해 물리적으로 분해되면서 발생한다. 바다로 유입된 플라스틱 폐기물이 수십 년에 걸쳐 잘게 쪼개지면서 거대한 양의 이차 미세 플라스틱이 해양 환경에 축적되고 있다. 이 과정에서 플라스틱은 완전히 분해되지 않고 입자 크기만 줄어들기 때문에 오염의 범위와 지속 시간이 매우 길다.'
    },
    {
      id: 'p2',
      text: '미세 플라스틱이 환경에 미치는 영향은 다층적이다. 해양 생태계에서 미세 플라스틱은 플랑크톤과 유사한 크기이므로 어류나 갑각류 등이 먹이로 오인하여 섭취한다. 미세 플라스틱을 삼킨 해양 생물은 소화 기관이 막히거나 영양 흡수 능력이 저하되어 성장에 장애를 겪는다. 더 심각한 문제는 먹이 사슬을 통한 생물 농축이다. 작은 물고기가 섭취한 미세 플라스틱이 이를 잡아먹는 큰 물고기에게 전달되고, 최종적으로 인간의 식탁에까지 도달할 수 있다. 실제로 시중에서 판매되는 어패류와 소금, 식수에서도 미세 플라스틱이 검출된 바 있다. 이는 미세 플라스틱 오염이 더 이상 해양만의 문제가 아니라 인간의 건강과 직결된 문제임을 보여 준다.'
    },
    {
      id: 'p3',
      text: '미세 플라스틱의 인체 유해성에 대한 연구는 아직 초기 단계에 있으나, 잠재적 위험성에 대한 우려는 점차 커지고 있다. 미세 플라스틱 자체의 독성뿐 아니라, 플라스틱 표면에 흡착되는 유해 화학 물질이 체내로 유입될 수 있다는 점이 주요한 우려 사항이다. 플라스틱 제조 과정에서 사용되는 가소제나 난연제 등의 첨가제가 체내에서 내분비 교란 물질로 작용할 수 있다는 연구 결과도 보고되고 있다. 또한 미세 플라스틱의 크기가 나노 수준까지 작아지면 세포막을 통과하여 혈류로 침투할 가능성이 제기되어 있다. 이에 따라 미세 플라스틱의 인체 축적량과 장기적 건강 영향에 대한 체계적 연구의 필요성이 강조되고 있다.'
    },
    {
      id: 'p4',
      text: '미세 플라스틱 오염에 대응하기 위해서는 다각적인 접근이 필요하다. 우선 플라스틱 제품의 생산과 소비를 줄이는 것이 근본적 해결 방안이다. 여러 국가에서 일회용 플라스틱 사용을 제한하는 법률을 시행하고 있으며, 마이크로비즈의 사용을 금지하는 규제도 확산되고 있다. 또한 생분해성 소재의 개발과 보급이 대안으로 제시되고 있다. 그러나 이미 환경에 축적된 미세 플라스틱을 제거하는 것은 기술적으로 매우 어렵다. 바다에 부유하는 미세 입자를 선별적으로 수거하는 기술은 아직 실용화 단계에 이르지 못했다. 따라서 현 시점에서 가장 효과적인 전략은 추가적 플라스틱 유입을 차단하면서 기존 폐기물의 재활용률을 높이는 것이다. 개인의 실천과 제도적 뒷받침이 함께 이루어질 때 미세 플라스틱 문제의 해결이 가능해질 것이다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 69 총 글자 수: ${total}`);

  return assembleFull({
    dayIndex: 69,
    subArea: 'NONFICTION',
    title: '일일 독해(비트겐슈타인 1) Day 69 비문학',
    paragraphs
  });
}

function buildDay70() {
  // Day 70 - 문학 (LITERATURE): 고전 수필 감상 - 이규보 '슬견설'의 풍자와 교훈
  const paragraphs = [
    {
      id: 'p1',
      text: '고려 시대 문인 이규보의 슬견설은 개를 소재로 인간 사회의 부조리를 풍자한 한문 수필이다. 이 글에서 이규보는 자신이 기르던 개가 다리를 절면서도 주인을 충실히 따르는 모습을 관찰한다. 그는 이 절뚝거리는 개를 가엾게 여기면서도 동시에 그 충직함에 감탄한다. 그러나 글의 핵심은 개에 대한 연민이 아니라 인간 세태에 대한 비판에 있다. 이규보는 개가 주인의 곁을 떠나지 않는 것은 타고난 본성 때문이지만, 인간은 이해관계에 따라 쉽게 등을 돌린다고 지적한다. 벼슬이 높을 때는 아첨하며 모여들다가, 권세가 기울면 하나둘 떠나 버리는 인간의 태도는 개의 충직함에 비하면 부끄러운 것이라 비판하고 있다.'
    },
    {
      id: 'p2',
      text: '슬견설의 문학적 기법에서 주목할 점은 물아비교의 서술 방식이다. 물아비교란 사물과 인간을 병치하여 비교함으로써 주제를 부각하는 수법이다. 이규보는 개라는 동물을 통해 인간의 도리를 역설하는데, 미천한 짐승조차 지키는 충성을 지식인이 저버린다는 대비가 글의 풍자적 힘을 강화한다. 이러한 기법은 직접적인 비판보다 독자에게 더 강한 인상을 남긴다. 글을 읽는 이가 스스로 인간과 개의 차이를 떠올리며 부끄러움을 느끼도록 유도하기 때문이다. 또한 이규보는 개의 행동을 묘사할 때 감정적 과장 없이 담담한 어조를 유지하는데, 이 절제된 문체가 오히려 풍자의 날카로움을 더하는 효과를 낸다. 화려한 수사보다 사실의 나열이 더 큰 울림을 주는 경우가 있음을 보여 주는 예이기도 하다.'
    },
    {
      id: 'p3',
      text: '이 작품이 쓰인 고려 중기의 사회적 맥락도 감상에 도움이 된다. 당시 고려 사회는 무신 정변 이후 정치적 격변기에 있었으며, 권력을 둘러싼 배신과 변절이 빈번하게 일어났다. 문인 관료였던 이규보 자신도 이러한 정치적 불안정 속에서 여러 차례 부침을 겪었다. 따라서 슬견설에 드러나는 인간관계에 대한 회의는 단순한 도덕적 훈계가 아니라 시대를 직접 경험한 지식인의 쓰라린 고백으로 읽을 수 있다. 이규보의 다른 글에서도 현실 비판적 시각이 일관되게 나타나는 점을 고려하면, 슬견설은 그의 문학적 태도를 이해하는 중요한 작품이라 할 수 있다.'
    },
    {
      id: 'p4',
      text: '슬견설이 현대 독자에게도 울림을 주는 까닭은 인간관계의 본질에 대한 질문이 시대를 초월하기 때문이다. 오늘날에도 이해관계에 따라 친밀함이 변하는 현상은 흔하게 관찰된다. 사업이 잘될 때는 주위에 사람이 넘치다가 어려움에 처하면 연락이 끊기는 경험은 시대를 불문하고 반복된다. 이규보가 팔백여 년 전에 던진 물음, 즉 진정한 충성과 우정이란 무엇인가 하는 질문은 여전히 유효하다. 슬견설은 짧은 글이지만 인간의 가식과 변심에 대한 깊은 성찰을 담고 있으며, 한문 수필 문학의 정수를 보여 주는 작품으로 평가된다. 고전 문학이 단순히 과거의 유산이 아니라 현재의 삶에 대한 거울이 될 수 있음을 이 작품은 증명하고 있다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 70 총 글자 수: ${total}`);

  return assembleFull({
    dayIndex: 70,
    subArea: 'LITERATURE',
    title: '일일 독해(비트겐슈타인 1) Day 70 문학',
    paragraphs
  });
}

// ========== 메인 실행 ==========

function main() {
  const ROOT = path.resolve(__dirname, '..');
  const batchPath = path.join(ROOT, 'generated', 'daily-batch-reading-wittgenstein1.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'wittgenstein1');

  // 배치 파일 읽기
  console.log('배치 파일 읽는 중...');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

  // Day 66~70 콘텐츠 생성
  const days = [
    buildDay66(),
    buildDay67(),
    buildDay68(),
    buildDay69(),
    buildDay70()
  ];

  // 검증
  let allPass = true;
  for (const day of days) {
    const paras = day.content.payload.passage.paragraphs;
    const totalChars = countTotalChars(paras);
    const recallCards = day.content.payload.recall.cards.length;
    const confirmQs = day.content.payload.confirm.questions.length;
    const intensiveSteps = day.content.payload.intensive.timeline.length;

    console.log(`\n=== ${day.content.title} ===`);
    console.log(`  총 글자 수: ${totalChars} (목표: 1350~1450)`);
    console.log(`  문단 수: ${paras.length}`);
    console.log(`  정독 스텝 수: ${intensiveSteps}`);
    console.log(`  복기 카드 수: ${recallCards}`);
    console.log(`  확인 문항 수: ${confirmQs}`);
    console.log(`  timeLimitSec: ${day.content.timeLimitSec}`);
    console.log(`  schoolGradeRange: ${JSON.stringify(day.content.schoolGradeRange)}`);
    console.log(`  subArea: ${day.content.subArea}`);
    console.log(`  contentId: ${day.content.contentId}`);

    if (totalChars < 1350 || totalChars > 1450) {
      console.warn(`  [경고] 글자 수 범위 이탈! (${totalChars}자)`);
      allPass = false;
    }
    if (recallCards !== 8) {
      console.warn(`  [경고] 복기 카드 수 8장이 아님! (${recallCards}장)`);
      allPass = false;
    }
    if (confirmQs < 5 || confirmQs > 8) {
      console.warn(`  [경고] 확인 문항 수 범위 이탈! (${confirmQs}문항)`);
      allPass = false;
    }
  }

  if (!allPass) {
    console.warn('\n[경고] 일부 검증 실패가 있지만 파일을 생성합니다.');
  }

  // 배치 파일 업데이트 (items[65]~[69] 교체, day_index 66~70)
  console.log('\n배치 파일 업데이트 중...');
  for (let i = 0; i < 5; i++) {
    const targetIdx = 65 + i; // day_index 66 = items[65]
    batch.items[targetIdx] = wrapBatchItem(days[i]);
  }
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf-8');
  console.log('배치 파일 저장 완료.');

  // static 파일 생성
  console.log('\nstatic 파일 생성 중...');
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
  }
  for (const day of days) {
    const dayNum = String(day.day_index).padStart(3, '0');
    const staticPath = path.join(staticDir, `${dayNum}.json`);
    fs.writeFileSync(staticPath, JSON.stringify(day.content, null, 2), 'utf-8');
    console.log(`  ${dayNum}.json 저장 완료`);
  }

  console.log('\n모든 작업 완료!');
}

main();
