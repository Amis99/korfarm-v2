/**
 * 비트겐슈타인1 Day 81~85 일일독해 콘텐츠 빌드 스크립트
 * - Day 81(비문학), 82(문학), 83(비문학), 84(문학), 85(비문학)
 * - 지문 3~4문단, 합계 1400±50자 (중3~고1 수준)
 * - 정독: buildTimeline (문장별 하이라이트 + 4지선다)
 * - 복기: buildRecallCards (8카드, seedPenalty: 1)
 * - 확인: 5~8문항, scoring: {correctDeltaSec:30, wrongDeltaSec:-45}, revealOnWrong: true, answerMatchMode: "ANY"
 */

const fs = require('fs');
const path = require('path');

// ========== 유틸리티 함수 ==========

/** 지문 텍스트를 문장 단위로 분리 */
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

/** 문단 내 검색어의 범위를 indexOf 기반으로 계산 */
function findRange(paragraphs, pid, searchText) {
  const para = paragraphs.find(p => p.id === pid);
  if (!para) throw new Error(`문단 ${pid}를 찾을 수 없습니다.`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}"를 ${pid}에서 찾을 수 없습니다.`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

/** 문단 배열의 총 글자 수 */
function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

/** 간단한 해시 기반 인덱스 (결정론적 셔플용) */
function hashIdx(str, mod) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return ((h % mod) + mod) % mod;
}

/** 문자열 자르기 */
function truncate(text, maxLen = 80) {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

/** 배열 셔플 */
function shuffleChoices(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 정독 타임라인 생성 (문장별 하이라이트 + 4지선다 + 문단별 중심내용) */
function buildTimeline(paragraphs) {
  const timeline = [];
  let stepCount = 1;

  for (const para of paragraphs) {
    const sentences = findSentences(para.text);

    for (let si = 0; si < sentences.length; si++) {
      const sent = sentences[si];
      // 다른 문단의 문장에서 오답 선택지 생성
      const otherSentences = [];
      for (const otherPara of paragraphs) {
        const otherSents = findSentences(otherPara.text);
        for (const os of otherSents) {
          if (os.text !== sent.text && os.text.length > 10) {
            otherSentences.push(os.text);
          }
        }
      }

      const wrongChoices = shuffleChoices(otherSentences).slice(0, 3).map((t, idx) => ({
        id: ['A','B','C','D'][idx + 1],
        text: truncate(t)
      }));

      const answerPos = hashIdx(sent.text + si, 4);
      const choiceIds = ['A','B','C','D'];
      const choices = [];
      let answerId = '';
      let wrongPtr = 0;

      for (let ci = 0; ci < 4; ci++) {
        if (ci === answerPos) {
          choices.push({ id: choiceIds[ci], text: truncate(sent.text) });
          answerId = choiceIds[ci];
        } else {
          if (wrongPtr < wrongChoices.length) {
            choices.push({ id: choiceIds[ci], text: wrongChoices[wrongPtr].text });
            wrongPtr++;
          } else {
            choices.push({ id: choiceIds[ci], text: '이 문장은 지문에 포함되지 않은 내용이다.' });
          }
        }
      }

      timeline.push({
        stepId: `s${stepCount++}`,
        highlight: {
          ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }]
        },
        question: {
          prompt: '하이라이트된 문장의 내용으로 알맞은 것은?',
          choices,
          answerId,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }

    // 문단별 중심내용 질문
    const paraSentences = findSentences(para.text);
    const otherParaSentences = [];
    for (const otherPara of paragraphs) {
      if (otherPara.id !== para.id) {
        for (const s of findSentences(otherPara.text)) {
          if (s.text.length > 15) otherParaSentences.push(s.text);
        }
      }
    }

    const centerSent = paraSentences[0];
    const wrongCenter = shuffleChoices(otherParaSentences).slice(0, 3);
    const centerAnswerPos = hashIdx(para.id + 'center', 4);
    const centerChoices = [];
    let centerAnswerId = '';
    const cIds = ['A','B','C','D'];
    let wrongIdx2 = 0;

    for (let ci = 0; ci < 4; ci++) {
      if (ci === centerAnswerPos) {
        centerChoices.push({ id: cIds[ci], text: truncate(centerSent.text) });
        centerAnswerId = cIds[ci];
      } else {
        if (wrongIdx2 < wrongCenter.length) {
          centerChoices.push({ id: cIds[ci], text: truncate(wrongCenter[wrongIdx2]) });
          wrongIdx2++;
        } else {
          centerChoices.push({ id: cIds[ci], text: '이 문단의 내용과 관련 없는 선택지이다.' });
        }
      }
    }

    timeline.push({
      stepId: `s${stepCount++}`,
      highlight: {
        ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }]
      },
      question: {
        prompt: '이 문단의 중심 내용으로 가장 적절한 것은?',
        choices: centerChoices,
        answerId: centerAnswerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }

  return { timeline };
}

/** 복기 카드 8장으로 분할 */
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
    cards.push({ id: `c${i + 1}`, text: fullText.substring(pos, end).trim() });
    pos = end;
    while (pos < totalLen && fullText[pos] === ' ') pos++;
  }
  return {
    cards,
    correctOrder: cards.map(c => c.id),
    seedPenalty: 1
  };
}

/** 핵심 개념어 추출 */
function extractKeyConcepts(sentence) {
  const concepts = [];
  const quoted = sentence.match(/'[^']+'/g);
  if (quoted) {
    for (const q of quoted) {
      const clean = q.replace(/'/g, '');
      if (clean.length >= 2 && clean.length <= 15) concepts.push(clean);
    }
  }
  const terms = sentence.match(/[가-힣]{3,8}(?=은 |는 |이 |가 |을 |를 |의 |에 |로 |와 |과 |도 |라 |라고)/g);
  if (terms) {
    for (const t of terms) {
      if (!concepts.includes(t) && t.length >= 3 && !/[하되지며으]$/.test(t)) concepts.push(t);
    }
  }
  const specialTerms = sentence.match(/[가-힣]{2,6}(?:론|주의|학|설|법|권|율|력|성|도)/g);
  if (specialTerms) {
    for (const t of specialTerms) {
      if (!concepts.includes(t) && t.length >= 3) concepts.push(t);
    }
  }
  return concepts.slice(0, 3);
}

/** 질문 프롬프트 생성 */
function generateQuestionPrompt(concept) {
  const templates = [
    `이 글에서 '${concept}'이(가) 의미하는 바에 해당하는 부분은 어디인가요?`,
    `'${concept}'에 해당하는 내용이 나타난 부분은 어디인가요?`,
    `이 글에서 '${concept}'이(가) 언급된 부분은 어디인가요?`,
    `'${concept}'과(와) 관련된 설명이 등장하는 부분은 어디인가요?`,
    `글에서 '${concept}'의 역할을 설명하는 부분은 어디인가요?`,
    `'${concept}'이(가) 포함된 문맥은 어디인가요?`
  ];
  return templates[hashIdx(concept, templates.length)];
}

/** 확인 문제 생성 (5~8문항) */
function buildConfirmQuestions(paragraphs) {
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

  const selected = shuffleChoices(questionTemplates).slice(0, 6);

  const questions = [];
  for (let i = 0; i < selected.length; i++) {
    const q = selected[i];
    questions.push({
      id: `q${i + 1}`,
      prompt: generateQuestionPrompt(q.concept),
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

// ========== assembleFull & wrapBatchItem ==========

function assembleFull({ dayIndex, contentId, subArea, title, paragraphs }) {
  const intensive = buildTimeline(paragraphs);
  const recall = buildRecallCards(paragraphs);
  const confirm = buildConfirmQuestions(paragraphs);

  return {
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
      passage: { format: 'TEXT', paragraphs },
      intensive,
      recall,
      confirm
    }
  };
}

function wrapBatchItem({ dayIndex, subArea, content }) {
  return {
    content_type: 'DAILY_READING',
    level_id: 'WITTGENSTEIN_1',
    area: 'READING',
    sub_area: subArea,
    day_index: dayIndex,
    module_key: 'reading_training',
    schema_version: '1.0',
    content
  };
}

// ========== 콘텐츠 정의 ==========

function buildDay81() {
  // Day 81 - 비문학 (NONFICTION): 과학사 - 코페르니쿠스 혁명과 패러다임 전환
  const paragraphs = [
    {
      id: 'p1',
      text: '천동설은 고대 그리스의 프톨레마이오스가 체계화한 우주 모형으로, 약 천사백 년 동안 서양 천문학의 기본 틀로 자리 잡았다. 이 모형에서 지구는 우주의 정중앙에 정지해 있고, 해와 달을 포함한 모든 천체가 지구를 중심으로 원운동을 한다. 천동설은 일상적인 경험과도 잘 부합하였다. 하늘을 올려다보면 해가 동쪽에서 떠서 서쪽으로 지는 것이 눈에 보이고, 발밑의 땅이 움직이고 있다는 느낌은 전혀 들지 않기 때문이다. 더불어 천동설은 중세 기독교 신학과도 깊은 조화를 이루었다. 신이 창조한 인간이 우주의 중심에 존재한다는 관념은 종교적 세계관을 강력하게 뒷받침하였으므로, 천동설에 의문을 제기하는 것은 과학적 도전인 동시에 종교적 도발이기도 하였다.'
    },
    {
      id: 'p2',
      text: '그러나 천동설은 관측 자료가 축적될수록 설명하기 어려운 현상들이 점점 늘어났다. 특히 행성의 역행 운동은 큰 난제였다. 행성이 하늘에서 한 방향으로 이동하다가 일정 기간 거꾸로 움직이는 듯 보이는 현상을 설명하기 위해 프톨레마이오스는 주전원이라는 보조 원을 도입하였다. 행성이 큰 원 위의 작은 원을 따라 돈다고 가정한 것이다. 그러나 관측 정밀도가 높아질수록 주전원 위에 다시 주전원을 겹쳐야 하는 상황이 반복적으로 발생하였고, 모형은 점차 복잡해져 갔다. 이처럼 기존 체계를 유지하기 위해 예외적 가정을 끊임없이 추가하는 것은 그 체계 자체에 근본적인 문제가 있음을 시사하는 것이었다.'
    },
    {
      id: 'p3',
      text: '코페르니쿠스는 이러한 복잡성을 획기적으로 단순화할 수 있는 대안을 제시하였다. 그의 지동설은 태양을 우주의 중심에 놓고 지구를 포함한 행성들이 태양 둘레를 공전한다고 주장하였다. 이 모형에서 행성의 역행 운동은 지구와 다른 행성이 서로 다른 속도로 태양을 돌기 때문에 나타나는 겉보기 현상으로 간결하게 설명된다. 코페르니쿠스의 모형은 주전원의 상당 부분을 제거함으로써 우주의 구조를 훨씬 단순하고 우아하게 기술할 수 있었다. 그러나 당시의 관측 기술로는 지구의 공전을 직접적으로 증명할 수 없었고, 지구가 움직인다면 사람이 왜 그 운동을 전혀 느끼지 못하는가라는 반론도 매우 강력하였다.'
    },
    {
      id: 'p4',
      text: '과학 철학자 토머스 쿤은 이러한 천문학의 대변혁을 패러다임 전환의 대표적 사례로 분석하였다. 쿤에 따르면 정상 과학의 시기에는 기존 패러다임 안에서 퍼즐 풀기 방식의 연구가 이루어지지만, 해결할 수 없는 변칙 사례가 누적되면 위기가 도래하고, 결국 새로운 패러다임이 기존의 것을 대체하게 된다. 천동설에서 지동설로의 전환은 단지 천체 모형의 교체가 아니라 세계를 바라보는 근본적인 관점의 변화였다. 인간이 우주의 중심이 아니라는 인식은 이후 근대 과학 혁명의 기반이 되었으며, 과학적 지식이란 영원한 진리가 아니라 더 나은 설명 체계로 끊임없이 발전해 가는 것이라는 인식론적 전환을 촉발하였다.'
    }
  ];

  return { dayIndex: 81, subArea: 'NONFICTION', paragraphs };
}

function buildDay82() {
  // Day 82 - 문학 (LITERATURE): 현대 소설 - 도시의 고독과 연대
  const paragraphs = [
    {
      id: 'p1',
      text: '지하철 창문에 비친 자신의 얼굴을 보며 수민은 오늘도 하루가 끝나 간다고 생각했다. 아침 일곱 시에 집을 나서 밤 아홉 시에 돌아오는 생활이 삼 년째 반복되고 있었다. 좁은 원룸에 돌아오면 불을 켜기도 전에 피로가 온몸을 짓눌렀다. 냉장고에는 며칠 전에 사 둔 우유 한 팩과 김치 한 통이 전부였다. 식탁 위에는 읽다 만 책이 먼지를 뒤집어쓰고 있었다. 수민은 텔레비전도 켜지 않은 채 어둠 속에 앉아 멍하니 벽을 바라보곤 했다. 누군가와 이야기를 나누고 싶었지만 전화할 사람이 떠오르지 않았다. 고향의 부모님에게 전화를 걸면 괜히 걱정만 끼칠 것 같아 매번 포기하였다.'
    },
    {
      id: 'p2',
      text: '어느 토요일 오후, 수민은 동네 빨래방에서 한 노인을 만났다. 노인은 세탁기 사용법을 몰라 기계 앞에서 한참을 서성이고 있었다. 수민이 다가가 버튼을 눌러 주자 노인은 고맙다며 활짝 웃었다. 그 웃음이 어쩐지 돌아가신 할아버지의 웃음과 닮아 있었다. 노인은 이 동네에 온 지 얼마 되지 않았다고 했다. 아들 집 근처로 이사했지만 아들은 바빠서 좀처럼 얼굴을 보기 어렵고, 낯선 동네에서 말을 나눌 이웃도 아직 없다고 했다. 수민은 노인의 이야기를 들으며 자신의 처지와 다르지 않다는 생각이 들었다. 대도시의 수많은 사람들 사이에서 정작 마음을 나눌 상대 하나 없이 살아가는 것이 비단 자신만의 사정은 아니었다.'
    },
    {
      id: 'p3',
      text: '그날 이후 수민과 노인은 매주 토요일 빨래방에서 만나게 되었다. 빨래가 돌아가는 삼십여 분 동안 두 사람은 소소한 이야기를 나누었다. 노인은 젊은 시절 목수로 일했던 이야기를 들려주었고, 수민은 회사에서 겪는 어려움을 털어놓았다. 대화의 내용이 대단한 것은 아니었지만, 누군가 자기 말에 고개를 끄덕여 주는 것만으로도 가슴 한쪽이 따뜻해지는 느낌이 들었다. 어느 날 노인은 수민에게 작은 화분 하나를 건네며, 혼자 사는 집에 푸른 것이 하나 있으면 마음이 달라진다고 말했다. 수민은 그 화분을 창가에 놓고 매일 아침 물을 주기 시작했다. 작은 잎사귀에 물방울이 맺히는 것을 보며 수민은 오랜만에 아침이 기다려지는 기분을 느꼈다.'
    },
    {
      id: 'p4',
      text: '겨울이 깊어질 무렵 노인이 빨래방에 나오지 않는 날이 이어졌다. 수민은 걱정이 되어 노인이 사는 아파트를 찾아갔다. 노인은 감기가 심해져 누워 있었다. 수민은 근처 약국에서 약을 사 오고, 죽을 끓여 노인의 식탁 위에 놓았다. 노인은 고마워하면서도 젊은 사람을 번거롭게 한다며 미안해하였다. 수민은 괜찮다고 말하며 자신이 처음 빨래방에서 혼자 서성이던 노인에게 다가갔던 그 순간을 떠올렸다. 작은 친절 하나가 두 사람의 외로움을 녹여 주었고, 그 온기가 다시 되돌아오고 있었다. 돌아오는 길에 수민은 거리의 가로등 불빛이 평소보다 따뜻하게 느껴진다는 것을 알아차렸다. 도시의 밤은 여전히 차가웠지만, 수민의 발걸음만큼은 가벼웠다.'
    }
  ];

  return { dayIndex: 82, subArea: 'LITERATURE', paragraphs };
}

function buildDay83() {
  // Day 83 - 비문학 (NONFICTION): 사회과학 - 민주주의와 시민 참여
  const paragraphs = [
    {
      id: 'p1',
      text: '민주주의는 국민이 주권을 가지고 스스로 또는 대표자를 통해 정치적 의사 결정에 참여하는 체제이다. 고대 아테네의 직접 민주주의에서 출발한 이 제도는 근대에 이르러 대의 민주주의의 형태로 발전하였다. 대의 민주주의에서 시민은 선거를 통해 자신의 의사를 반영할 대표자를 선출하며, 선출된 대표자는 시민의 위임을 받아 법률을 제정하고 정책을 결정한다. 이 체제가 효과적으로 작동하려면 공정한 선거 제도, 언론의 자유, 법 앞의 평등 등 여러 제도적 조건이 충족되어야 한다. 그러나 제도적 조건만으로는 민주주의의 질을 보장할 수 없다. 시민의 자발적이고 능동적인 참여가 없으면 민주주의는 형식적 껍데기에 머물 수 있기 때문이다.'
    },
    {
      id: 'p2',
      text: '시민 참여의 가장 기본적인 형태는 투표이다. 투표는 시민이 자신의 정치적 선호를 공식적으로 표현하는 행위이며, 선거 결과를 통해 정치 권력의 정당성이 부여된다. 그러나 많은 민주주의 국가에서 투표율이 하락하는 추세가 관찰되고 있다. 투표율 하락의 원인으로는 정치에 대한 무관심, 후보자에 대한 불신, 자신의 한 표가 결과를 바꿀 수 없다는 무력감 등이 지적된다. 특히 젊은 세대의 투표율 저하는 세대 간 정치적 대표성의 불균형을 초래할 수 있어 주목할 문제이다. 일부 국가에서는 의무 투표제를 도입하여 이 문제를 해결하고자 하였으나, 강제적 참여가 민주주의의 자발성 원리에 부합하는지에 대해서는 논란이 있다.'
    },
    {
      id: 'p3',
      text: '투표 이외의 시민 참여 방식도 민주주의의 건강성에 중요한 역할을 한다. 시민 단체 활동, 공청회 참석, 청원 제출, 시위와 집회 등은 선거와 선거 사이의 기간에도 시민의 목소리가 정책 결정 과정에 반영될 수 있도록 하는 통로이다. 특히 디지털 기술의 발전은 시민 참여의 방식을 크게 변화시켰다. 온라인 청원 플랫폼을 통해 시민들은 시간과 장소의 제약 없이 정책 제안이나 문제 제기를 할 수 있게 되었다. 소셜 미디어는 사회적 의제를 빠르게 확산시키고 여론을 형성하는 데 기여하고 있다. 그러나 디지털 참여는 정보의 편향, 가짜 뉴스의 확산, 여론의 양극화와 같은 새로운 문제도 함께 가져왔다.'
    },
    {
      id: 'p4',
      text: '숙의 민주주의는 시민 참여의 질적 향상을 추구하는 모형으로 주목받고 있다. 숙의 민주주의에서는 시민들이 충분한 정보를 바탕으로 다양한 관점에서 토론하고, 그 과정을 통해 합리적인 합의에 도달하는 것을 이상으로 삼는다. 단순히 다수결로 결정하는 것이 아니라 소수의 의견도 경청하고, 논거의 타당성을 검토하여 더 나은 결론을 도출하고자 하는 것이다. 시민 배심원제나 공론화 위원회는 숙의 민주주의를 실현하는 구체적인 제도적 장치이다. 이러한 제도에서 무작위로 선정된 시민들이 전문가의 설명을 듣고 상호 토론을 거쳐 사회적 쟁점에 대한 권고안을 도출한다. 숙의 과정을 거친 시민의 의견은 단순한 직관적 판단보다 균형 잡히고 숙고된 판단에 가까워지는 것으로 연구되고 있다.'
    }
  ];

  return { dayIndex: 83, subArea: 'NONFICTION', paragraphs };
}

function buildDay84() {
  // Day 84 - 문학 (LITERATURE): 고전 시가 감상 - 정철의 관동별곡
  const paragraphs = [
    {
      id: 'p1',
      text: '정철의 관동별곡은 조선 시대 가사 문학의 대표작으로 꼽힌다. 정철이 강원도 관찰사로 부임하여 관동 지방의 절경을 유람하면서 느낀 감흥을 기록한 이 작품은, 자연의 아름다움과 정치적 포부를 자유롭게 엮어 낸 기행 가사이다. 작품의 서두에서 화자는 임금의 은혜에 감사하며 부임지로 향하는 벅찬 마음을 노래한다. 이때 임금에 대한 충성은 단순한 의례적 표현이 아니라, 왕도 정치의 이상을 지방에서 실현하겠다는 관리로서의 다짐이기도 하다. 정철은 자연 경관을 묘사하면서도 곳곳에서 백성의 삶에 대한 관심과 통치자로서의 책임 의식을 드러내고 있어, 이 작품이 단순한 기행문이 아님을 보여 준다.'
    },
    {
      id: 'p2',
      text: '관동별곡에서 자연 묘사는 단순한 풍경의 재현을 넘어서 화자의 내면세계를 투영하는 역할을 한다. 금강산의 만이천 봉우리를 바라보며 화자가 느끼는 경이로움은, 자연의 장대함 앞에서 인간의 유한함을 자각하는 순간이기도 하다. 폭포수가 천 길 벼랑에서 쏟아져 내리는 장면을 묘사할 때 사용되는 과장법과 직유법은 자연의 위력을 감각적으로 전달하는 동시에 화자의 감동의 크기를 드러낸다. 바다 위의 달빛을 바라보며 화자는 속세의 시름을 잊고 신선의 경지에 이르고자 하는 소망을 노래한다. 이러한 자연과의 합일 의식은 동양의 전통적인 물아일체 사상과 맥을 같이하며, 한시의 전통적 소재인 강산과 풍월을 한글 가사의 형식 안에서 독창적으로 재해석한 것이다.'
    },
    {
      id: 'p3',
      text: '관동별곡의 문학사적 의의는 여러 측면에서 조명할 수 있다. 우선 한글 가사 문학의 미학적 완성도를 한 단계 끌어올린 작품이라는 평가를 받는다. 정철은 사삼오오 조의 율격을 유연하게 변주하며, 한자어와 고유어를 절묘하게 배합하여 장중하면서도 유려한 문체를 구사하였다. 또한 이 작품은 기행 가사라는 장르의 전형을 확립하였다. 여정의 순서에 따라 경치를 묘사하면서 중간중간에 감회와 사색을 삽입하는 구성 방식은 이후의 기행 문학에 큰 영향을 미쳤다. 정철은 자연을 노래하면서도 현실 정치에 대한 관심을 놓지 않았는데, 이는 문학과 정치를 분리하지 않았던 조선 시대 사대부의 세계관을 잘 보여 준다.'
    },
    {
      id: 'p4',
      text: '관동별곡을 감상할 때 주목해야 할 또 하나의 요소는 화자의 시선이 끊임없이 이동한다는 점이다. 화자는 산 아래에서 봉우리를 올려다보기도 하고, 정상에서 바다를 내려다보기도 하며, 달빛 아래 배 위에서 사방을 둘러보기도 한다. 이러한 시선의 이동은 독자에게 마치 화자와 함께 여행을 하고 있는 듯한 현장감을 준다. 또한 계절과 시간의 변화도 작품의 분위기를 풍요롭게 하는 요소이다. 아침 안개 속의 산봉우리, 한낮의 찬란한 폭포, 저녁노을에 물든 해안, 밤하늘의 달과 별 등 시간에 따라 변화하는 자연의 모습이 생동감 있게 펼쳐진다. 이처럼 관동별곡은 공간과 시간을 아우르는 입체적인 구성을 통해 가사 문학의 가능성을 최대한으로 보여 준 걸작이라 할 수 있다.'
    }
  ];

  return { dayIndex: 84, subArea: 'LITERATURE', paragraphs };
}

function buildDay85() {
  // Day 85 - 비문학 (NONFICTION): 환경과학 - 탄소 순환과 기후 변화
  const paragraphs = [
    {
      id: 'p1',
      text: '탄소는 지구 생태계를 구성하는 가장 핵심적인 원소 가운데 하나로, 대기와 해양, 토양, 생물체 사이를 끊임없이 순환한다. 이러한 탄소의 이동 과정을 탄소 순환이라 부른다. 대기 중의 이산화탄소는 식물의 광합성을 통해 유기물의 형태로 고정되고, 식물을 먹는 동물의 체내로 이동하며, 호흡과 분해 과정을 통해 다시 대기로 돌아간다. 해양도 탄소 순환에서 매우 중요한 역할을 수행하는데, 바닷물은 대기 중 이산화탄소를 흡수하여 용해시키고, 식물성 플랑크톤이 이를 이용하여 광합성을 한다. 장기적으로는 해양 생물의 유해가 바닥에 가라앉아 석회암 등의 퇴적암을 형성하면서 탄소가 지질학적으로 긴 시간 동안 안정적으로 저장되기도 한다.'
    },
    {
      id: 'p2',
      text: '산업 혁명 이전까지 탄소 순환은 비교적 안정된 균형 상태를 오랫동안 유지하고 있었다. 화산 활동이나 자연 화재로 방출되는 탄소의 양과 광합성 및 해양 흡수로 제거되는 탄소의 양이 장기적으로 대체로 일치하였기 때문이다. 그러나 산업 혁명 이후 인류가 석탄과 석유, 천연가스 등의 화석 연료를 대규모로 연소하면서 이 균형이 깨지기 시작하였다. 화석 연료는 수억 년에 걸쳐 지하에 묻힌 고대 생물의 유해가 변환된 것으로, 이를 연소하면 오랜 기간 저장되어 있던 탄소가 단기간에 대기로 대량 방출된다. 또한 열대 우림의 대규모 벌채는 탄소를 흡수하는 숲의 면적을 줄이는 동시에 나무에 저장된 탄소를 대기로 방출시키는 이중 효과를 지닌다.'
    },
    {
      id: 'p3',
      text: '대기 중 이산화탄소 농도의 증가는 온실 효과를 강화하여 지구의 평균 기온 상승을 초래한다. 온실 효과란 대기 중의 온실 기체가 지표에서 방출되는 적외선 복사 에너지를 흡수하여 지구의 온도를 일정하게 유지하는 현상인데, 온실 기체가 과도하게 증가하면 지구에 열이 과잉 축적되어 기온이 비정상적으로 높아진다. 그 결과 극지방과 고산 지대의 빙하가 녹아 해수면이 상승하고, 기상 이변의 빈도와 강도가 높아지며, 생태계의 균형이 교란된다. 산호초의 백화 현상이나 동식물의 서식지 이동, 가뭄과 폭우의 빈번한 교차 등이 이미 세계 곳곳에서 관측되고 있다.'
    },
    {
      id: 'p4',
      text: '기후 변화에 대응하기 위한 국제 사회의 노력은 다방면에서 활발하게 이루어지고 있다. 파리 협정은 산업화 이전 대비 지구 평균 기온 상승을 일점오 도 이내로 억제하자는 목표를 제시하였다. 이를 위해 각국은 온실 기체 배출량을 줄이는 구체적인 감축 목표를 수립하고, 재생 에너지의 확대와 에너지 효율 향상, 탄소 포집 기술의 개발 등을 적극적으로 추진하고 있다. 개인 차원에서도 에너지 절약, 대중교통 이용, 일회용품 줄이기 등 일상의 작은 실천이 탄소 배출 감소에 기여할 수 있다. 기후 변화는 단일 국가나 개인의 힘만으로 해결할 수 없는 지구적 문제이므로, 국제 협력과 세대 간 연대가 무엇보다 중요하다는 인식이 점차 널리 확산되고 있다.'
    }
  ];

  return { dayIndex: 85, subArea: 'NONFICTION', paragraphs };
}

// ========== 메인 실행 ==========

function main() {
  const ROOT = path.resolve(__dirname, '..');
  const batchPath = path.join(ROOT, 'generated', 'daily-batch-reading-wittgenstein1.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'wittgenstein1');

  // 배치 파일 읽기
  console.log('배치 파일 읽는 중...');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

  // Day 81~85 콘텐츠 생성
  const builders = [buildDay81, buildDay82, buildDay83, buildDay84, buildDay85];
  const days = [];

  for (const builder of builders) {
    const { dayIndex, subArea, paragraphs } = builder();
    const dayStr = String(dayIndex).padStart(3, '0');
    const subAreaKo = subArea === 'NONFICTION' ? '비문학' : '문학';

    const content = assembleFull({
      dayIndex,
      contentId: `dr-w1-${dayStr}`,
      subArea,
      title: `일일 독해(비트겐슈타인 1) Day ${dayIndex} ${subAreaKo}`,
      paragraphs
    });

    const batchItem = wrapBatchItem({ dayIndex, subArea, content });
    days.push({ dayIndex, dayStr, subArea, content, batchItem, paragraphs });
  }

  // 검증
  let hasWarning = false;
  for (const day of days) {
    const paras = day.content.payload.passage.paragraphs;
    const totalChars = charLen(paras);
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

    if (totalChars < 1350 || totalChars > 1450) {
      console.warn(`  [경고] 글자 수 범위 이탈! (${totalChars}자)`);
      hasWarning = true;
    }
    if (recallCards !== 8) {
      console.warn(`  [경고] 복기 카드 수 8장이 아님! (${recallCards}장)`);
      hasWarning = true;
    }
    if (confirmQs < 5 || confirmQs > 8) {
      console.warn(`  [경고] 확인 문항 수 범위 이탈! (${confirmQs}문항)`);
      hasWarning = true;
    }
  }

  if (hasWarning) {
    console.warn('\n[경고] 일부 검증 실패 항목이 있으나, 파일은 생성합니다.');
  }

  // 배치 파일 업데이트 (items[80]~[84] = Day 81~85)
  console.log('\n배치 파일 업데이트 중...');
  for (const day of days) {
    const idx = day.dayIndex - 1; // day_index 81 -> items[80]
    batch.items[idx] = day.batchItem;
    console.log(`  items[${idx}] (Day ${day.dayIndex}) 교체 완료`);
  }
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf-8');
  console.log('배치 파일 저장 완료.');

  // static 파일 생성
  console.log('\nstatic 파일 생성 중...');
  for (const day of days) {
    const staticPath = path.join(staticDir, `${day.dayStr}.json`);
    fs.writeFileSync(staticPath, JSON.stringify(day.content, null, 2), 'utf-8');
    console.log(`  ${day.dayStr}.json 저장 완료`);
  }

  console.log('\n모든 작업 완료!');
}

main();
