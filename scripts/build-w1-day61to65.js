/**
 * 비트겐슈타인1 Day 61~65 일일독해 콘텐츠 빌더 스크립트
 * - Day 61(비문학), 62(문학), 63(비문학), 64(문학), 65(비문학)
 * - 지문 3~4문단, 합계 1400±50자 (1350~1450)
 * - 정독: buildTimeline (문장별 하이라이트 + 4지선다, scoring)
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

function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

function hashIdx(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

function shuffleChoices(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ========== 정독 타임라인 생성 ==========

function buildTimeline(paragraphs) {
  const timeline = [];
  let stepCount = 1;

  for (const para of paragraphs) {
    const sentences = findSentences(para.text);

    for (let si = 0; si < sentences.length; si++) {
      const sent = sentences[si];
      // 다른 문단/문장에서 오답 선택지 수집
      const otherSentences = [];
      for (const otherPara of paragraphs) {
        const otherSents = findSentences(otherPara.text);
        for (const os of otherSents) {
          if (os.text !== sent.text && os.text.length > 10) {
            otherSentences.push(os.text);
          }
        }
      }

      const wrongChoices = shuffleChoices(otherSentences).slice(0, 3).map(t => truncate(t, 80));

      // 정답 위치를 hashIdx로 결정 (재현 가능)
      const answerPos = hashIdx(sent.text + stepCount) % 4;
      const choiceIds = ['A','B','C','D'];
      const choices = [];
      let answerId = '';
      let wrongIdx = 0;

      for (let ci = 0; ci < 4; ci++) {
        if (ci === answerPos) {
          choices.push({ id: choiceIds[ci], text: truncate(sent.text, 80) });
          answerId = choiceIds[ci];
        } else {
          if (wrongIdx < wrongChoices.length) {
            choices.push({ id: choiceIds[ci], text: wrongChoices[wrongIdx] });
            wrongIdx++;
          } else {
            choices.push({ id: choiceIds[ci], text: '이 문장은 지문에 포함되지 않은 내용이다.' });
          }
        }
      }

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
        for (const s of findSentences(otherPara.text)) {
          if (s.text.length > 15) otherParaSentences.push(s.text);
        }
      }
    }

    const centerSent = paraSentences[0];
    const wrongCenter = shuffleChoices(otherParaSentences).slice(0, 3);
    const centerAnswerPos = hashIdx(para.id + 'center') % 4;
    const cIds = ['A','B','C','D'];
    const centerChoices = [];
    let centerAnswerId = '';
    let wrongIdx2 = 0;

    for (let ci = 0; ci < 4; ci++) {
      if (ci === centerAnswerPos) {
        centerChoices.push({ id: cIds[ci], text: truncate(centerSent.text, 80) });
        centerAnswerId = cIds[ci];
      } else {
        if (wrongIdx2 < wrongCenter.length) {
          centerChoices.push({ id: cIds[ci], text: truncate(wrongCenter[wrongIdx2], 80) });
          wrongIdx2++;
        } else {
          centerChoices.push({ id: cIds[ci], text: '이 문단의 내용과 관련 없는 선택지이다.' });
        }
      }
    }

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

// ========== 복기 카드 생성 ==========

function buildRecallCards(paragraphs) {
  const cardCount = 8;
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

// ========== 확인 문제 생성 ==========

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
  // 전문 용어 패턴 (OO론, OO주의, OO학 등)
  const specialTerms = sentence.match(/[가-힣]{2,6}(?:론|주의|학|설|법|권|율|력|성|도)/g);
  if (specialTerms) {
    for (const t of specialTerms) {
      if (!concepts.includes(t) && t.length >= 3) concepts.push(t);
    }
  }
  return concepts.slice(0, 3);
}

function generateQuestionPrompt(concept) {
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

  const selected = shuffleChoices(questionTemplates).slice(0, 6);

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

// ========== 콘텐츠 조립 ==========

function assembleFull({ dayIndex, subArea, subAreaKo, paragraphs }) {
  const dayStr = String(dayIndex).padStart(3, '0');
  const contentId = `dr-w1-${dayStr}`;
  const title = `일일 독해(비트겐슈타인 1) Day ${dayIndex} ${subAreaKo}`;

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
      passage: {
        format: 'TEXT',
        paragraphs
      },
      intensive,
      recall,
      confirm
    }
  };
}

function wrapBatchItem(content, dayIndex, subArea) {
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

// ========== Day 61~65 지문 정의 ==========

function buildDay61() {
  // Day 61 - 비문학 (NONFICTION): 철학 - 존재론과 실존주의
  const paragraphs = [
    {
      id: 'p1',
      text: '존재에 대한 물음은 서양 철학의 가장 오래된 주제 가운데 하나이다. 고대 그리스의 파르메니데스는 존재하는 것은 존재하고 존재하지 않는 것은 존재하지 않는다는 명제를 통해 존재의 불변성과 단일성을 주장하였다. 이후 플라톤은 감각으로 지각되는 현상 세계 너머에 참된 존재인 이데아의 세계가 있다고 보았으며, 아리스토텔레스는 개별 사물 속에 존재의 본질이 내재한다고 주장하였다. 중세에 이르러 존재의 문제는 신의 존재 증명이라는 신학적 과제와 긴밀하게 결합하였고, 근대에는 데카르트의 나는 생각한다 고로 존재한다는 명제가 인간 주체의 존재를 사유의 확실성 위에 정초하였다. 이처럼 존재에 대한 탐구는 시대마다 다른 양상으로 전개되었으나, 존재란 무엇인가라는 근본적 물음은 변하지 않고 계속 이어져 왔다.'
    },
    {
      id: 'p2',
      text: '이십 세기에 들어 하이데거는 존재의 문제를 전혀 새로운 방식으로 제기하였다. 그는 서양 철학이 존재 자체에 대한 물음을 잊어버리고 존재하는 것들, 즉 존재자에 대한 탐구에만 몰두해 왔다고 비판하였다. 하이데거가 제시한 현존재라는 개념은 자기 존재에 대해 물음을 던지는 유일한 존재자로서의 인간을 가리킨다. 현존재는 세계 속에 던져진 존재이면서 동시에 자신의 가능성을 향해 기투하는 존재이다. 이러한 분석에서 불안이라는 근본 기분은 특별한 의미를 지닌다. 불안은 특정한 대상에 대한 두려움과 달리, 존재 전체에 대한 막연한 위협 앞에서 경험되는 감정이다. 불안을 통해 현존재는 일상적 삶의 익숙함에서 벗어나 자기 존재의 유한성과 직접 대면하게 되며, 이 대면이 본래적 실존으로 나아가는 결정적 계기가 된다.'
    },
    {
      id: 'p3',
      text: '사르트르는 하이데거의 존재론을 계승하면서도 독자적인 실존주의 철학을 전개하였다. 그의 핵심 명제인 실존은 본질에 앞선다는 인간에게는 미리 규정된 본성이 없으며 스스로의 선택을 통해 자기 자신을 만들어 간다는 것을 뜻한다. 사르트르에 따르면 인간은 자유롭도록 운명 지어진 존재이다. 자유란 선택의 가능성을 의미하지만, 동시에 그 선택에 대한 전적인 책임을 수반한다. 타인의 시선이나 사회적 관습에 자신을 맡겨 버리는 것은 자기 기만이며, 참된 실존은 이러한 자기 기만을 극복하고 자유와 책임을 온전히 떠안을 때 비로소 성립한다.'
    },
    {
      id: 'p4',
      text: '실존주의 철학은 이십 세기 중반 유럽 사회에 깊은 영향을 미쳤다. 두 차례의 세계 대전을 겪으며 이성과 진보에 대한 낙관적 믿음이 산산이 무너진 시대에, 실존주의는 개인의 주체적 선택과 책임을 강조함으로써 삶의 의미를 재구성할 수 있는 철학적 틀을 제공하였다. 문학과 예술 분야에서도 실존주의의 영향은 지대하여, 카뮈의 소설이나 베케트의 부조리극 등은 의미가 부재하는 세계 속에서 인간이 어떻게 자신의 존재 이유를 찾아갈 수 있는가를 끊임없이 탐색하였다. 오늘날 실존주의는 하나의 철학 사조로서의 전성기를 지났지만, 자유와 책임이라는 그 핵심 가치는 현대인의 윤리적 사유에 여전히 깊은 울림을 주고 있다.'
    }
  ];

  return { paragraphs, dayIndex: 61, subArea: 'NONFICTION', subAreaKo: '비문학' };
}

function buildDay62() {
  // Day 62 - 문학 (LITERATURE): 현대 소설 - 세대 간 갈등과 화해
  const paragraphs = [
    {
      id: 'p1',
      text: '아버지가 작업장 문을 닫은 것은 겨울이 시작되기 직전이었다. 삼십 년 넘게 가구를 만들어 온 그 작은 공방에는 대패 밥과 나무 향이 벽에까지 배어 있었다. 민수는 아버지가 공방 열쇠를 서랍에 넣는 모습을 묵묵히 지켜보았다. 아버지의 손은 나무결처럼 거칠었고, 손가락 마디마다 세월의 흔적이 깊게 새겨져 있었다. 민수는 그 손이 한때 무서웠고, 나중에는 부끄러웠으며, 지금은 안쓰러웠다. 아버지는 아무 말 없이 공방을 한 바퀴 둘러본 뒤 불을 끄고 나왔다. 민수가 괜찮으세요 하고 물었지만, 아버지는 고개만 끄덕이고 앞서 걸어갔다. 두 사람의 그림자가 서쪽 하늘의 마지막 빛 아래 나란히 길게 늘어졌다.'
    },
    {
      id: 'p2',
      text: '민수와 아버지 사이에는 오래된 골이 있었다. 민수가 대학에서 경영학을 전공하겠다고 했을 때, 아버지는 한마디도 하지 않았다. 그 침묵이 반대보다 더 무거웠다는 것을 민수는 나중에야 깨달았다. 아버지는 민수가 자신의 뒤를 이어 목수가 되기를 바랐지만, 그 바람을 한 번도 말로 꺼낸 적이 없었다. 민수 역시 아버지의 기대를 모르는 척했다. 졸업 후 서울의 회사에 취직한 민수는 명절에도 좀처럼 내려오지 않았고, 전화 통화도 안부를 확인하는 정도에서 짧게 끝났다. 두 사람 사이에 할 말은 많았지만, 어디서부터 시작해야 할지 몰라 늘 같은 안부만 되풀이하였다.'
    },
    {
      id: 'p3',
      text: '공방 정리를 돕기 위해 내려온 날, 민수는 선반 위에서 낡은 나무 상자를 발견했다. 상자 안에는 작은 목각 인형 여러 개가 고이 싸여 있었다. 민수가 어릴 때 가지고 놀던 것들이었다. 말, 강아지, 토끼 형상의 인형을 하나씩 꺼내 보며 민수는 아버지가 이것들을 깎아 주던 저녁 시간을 떠올렸다. 아버지는 작업대 앞에 민수를 앉혀 놓고 조각칼로 나무를 다듬으면서, 나무는 거짓말을 하지 않는다, 결을 따라가면 자기 모양을 알려 준다고 말하곤 했다. 그 말을 다시 떠올리자 민수의 눈시울이 뜨거워졌다. 아버지가 가르치려 했던 것은 기술이 아니라 세상을 대하는 태도였다는 것을 민수는 그제야 이해했다.'
    },
    {
      id: 'p4',
      text: '저녁 식사 자리에서 민수는 오래 망설이다가 입을 열었다. 아버지, 이 인형들 제가 가져가도 될까요. 아버지는 놀란 듯 민수를 바라보더니 이내 고개를 돌렸다. 민수는 아버지의 눈가가 붉어지는 것을 보았지만, 모른 척했다. 아버지가 가져가라고 짧게 말했고, 민수는 감사하다는 말 대신 나중에 저도 하나 만들어 볼게요 하고 대답했다. 아버지의 입가에 오랜만에 미소가 번졌다. 그 미소는 오래 머무르지 않았지만, 두 사람 사이를 가로막고 있던 침묵의 벽에 처음으로 작은 균열을 만들었다. 민수는 서울로 돌아가는 기차 안에서 목각 인형 하나를 손에 쥐고 창밖을 바라보았다. 나무의 결을 따라가면 자기 모양을 알려 준다는 아버지의 말이 귓가에 맴돌았다. 어쩌면 사람도 마찬가지라는 생각이 불현듯 들었다.'
    }
  ];

  return { paragraphs, dayIndex: 62, subArea: 'LITERATURE', subAreaKo: '문학' };
}

function buildDay63() {
  // Day 63 - 비문학 (NONFICTION): 과학 - 미세 플라스틱과 환경 오염
  const paragraphs = [
    {
      id: 'p1',
      text: '미세 플라스틱은 크기가 오 밀리미터 이하인 작은 플라스틱 입자를 가리키는 용어이다. 미세 플라스틱은 발생 원인에 따라 크게 두 가지로 구분된다. 일차 미세 플라스틱은 처음부터 작은 크기로 제조된 것으로, 화장품의 스크럽 알갱이나 세탁 시 의류에서 떨어지는 합성 섬유 조각이 이에 해당한다. 이차 미세 플라스틱은 커다란 플라스틱 제품이 자외선이나 물리적 마모에 의해 점차 잘게 부서지면서 생성된다. 바다에 버려진 페트병이나 비닐봉지가 파도와 햇빛에 의해 서서히 분해되어 미세한 조각이 되는 것이 대표적인 사례이다. 이렇게 발생한 미세 플라스틱은 한번 환경에 유입되면 자연적으로 완전히 분해되기까지 수백 년이 걸리는 것으로 추정된다.'
    },
    {
      id: 'p2',
      text: '미세 플라스틱은 해양 생태계에 심각한 위협을 가하고 있다. 바다에 떠다니는 미세 플라스틱은 플랑크톤과 크기가 비슷하여 해양 생물이 먹이로 착각하고 섭취하는 경우가 빈번하다. 작은 물고기가 미세 플라스틱을 삼키면, 이를 잡아먹는 큰 물고기의 체내에도 축적되며, 먹이 사슬의 상위 단계로 갈수록 농도가 높아지는 생물 농축 현상이 발생한다. 연구에 따르면 전 세계 해양 어류의 상당수에서 미세 플라스틱이 검출되었으며, 조개류나 갑각류에서도 높은 빈도로 발견되고 있다. 미세 플라스틱 자체의 물리적 해로움 외에도, 표면에 유해 화학 물질이 흡착되어 생물체 내에서 독성 물질을 방출할 수 있다는 점이 추가적인 위험 요인으로 지목되고 있다.'
    },
    {
      id: 'p3',
      text: '미세 플라스틱의 문제는 해양에 국한되지 않는다. 최근 연구에서는 토양, 담수, 대기 중에서도 미세 플라스틱이 발견되고 있어 오염의 범위가 예상보다 훨씬 광범위하다는 사실이 밝혀졌다. 농경지에 살포되는 하수 슬러지에 포함된 미세 플라스틱이 토양에 축적되면 토양 구조를 변화시키고 미생물 생태계에 영향을 미칠 수 있다. 빗물과 함께 지하수로 유입될 가능성도 제기되고 있으며, 대기 중의 미세 플라스틱은 사람이 호흡을 통해 직접 흡입할 수 있다는 점에서 공중 보건의 관점에서도 주목받고 있다. 인체에 미치는 영향에 대해서는 아직 연구가 진행 중이나, 소화기 계통이나 호흡기 계통에 염증 반응을 유발할 가능성이 보고된 바 있다.'
    },
    {
      id: 'p4',
      text: '미세 플라스틱 문제에 대응하기 위해 국제 사회는 다양한 노력을 기울이고 있다. 유럽연합은 화장품과 세제에 포함된 일차 미세 플라스틱의 사용을 단계적으로 금지하는 규정을 시행하고 있으며, 여러 국가에서 일회용 플라스틱 제품의 사용을 제한하는 법안을 도입하였다. 그러나 이미 환경에 축적된 미세 플라스틱을 수거하는 것은 기술적으로 매우 어렵다는 한계가 있다. 따라서 플라스틱 대체 소재의 개발과 함께, 생산 단계에서부터 플라스틱 사용량 자체를 줄이는 근본적인 접근이 필요하다. 개인 차원에서도 일회용 플라스틱 사용을 자제하고 올바른 분리 배출을 실천하는 것이 미세 플라스틱 오염을 줄이는 데 기여할 수 있다.'
    }
  ];

  return { paragraphs, dayIndex: 63, subArea: 'NONFICTION', subAreaKo: '비문학' };
}

function buildDay64() {
  // Day 64 - 문학 (LITERATURE): 현대시 감상 - 김소월 시의 정한과 이별의 미학
  const paragraphs = [
    {
      id: 'p1',
      text: '김소월의 시는 한국인의 정서 깊은 곳에 자리한 한과 이별의 감정을 가장 아름다운 우리말로 형상화한 것으로 평가된다. 그의 시에는 떠나는 임을 말없이 보내는 화자의 목소리가 반복적으로 등장하며, 이 목소리에는 원망과 체념이 섞여 있으되 결코 격렬하지 않다. 진달래꽃에서 화자는 임이 떠나겠다고 하면 말없이 보내 주겠다고 말한다. 영변 약산 진달래꽃을 아름 따다 가시는 길에 뿌리겠다는 표현에는 상대를 향한 깊은 사랑과 함께, 그 사랑을 주체적으로 승화시키려는 의지가 담겨 있다. 떠나는 사람의 발밑에 꽃을 깔아 주겠다는 것은 이별의 고통을 아름다움으로 전환하려는 시적 결단이라 할 수 있다.'
    },
    {
      id: 'p2',
      text: '이 시에서 특히 주목할 점은 마지막 연의 역설적 표현이다. 화자는 죽어도 아니 눈물 흘리우리다라고 다짐하는데, 이 다짐의 이면에는 눈물을 참기 어려운 극심한 슬픔이 전제되어 있다. 울지 않겠다는 선언은 곧 울고 싶다는 심정의 반어적 고백이며, 이러한 감정의 억제가 오히려 독자의 정서적 반응을 극대화하는 효과를 낳는다. 한국 전통 시가에서 이별의 정한은 흔히 직접적인 슬픔의 토로로 나타나지만, 김소월은 감정을 억누르고 침묵하는 방식으로 더 깊은 울림을 만들어 낸다. 이는 한국적 정서인 한이 외부로 폭발하는 것이 아니라 내면에서 삭이는 방향으로 작용하는 문화적 특성과 깊이 연관되어 있다.'
    },
    {
      id: 'p3',
      text: '초혼에서는 이별의 정서가 더욱 절실한 형태로 표출된다. 화자는 떠나간 임의 이름을 부르며 그 목소리가 하늘과 땅 사이에 가득 차기를 바란다. 이름을 부르는 행위는 부재하는 대상을 언어를 통해 현전시키려는 처절한 시도이다. 그러나 아무리 불러도 응답은 돌아오지 않으며, 화자의 외침은 공허한 메아리로 남을 뿐이다. 이러한 소통의 불가능성이야말로 이별의 본질적 고통을 보여 주는 것이다. 김소월은 이 고통을 산산이 부서진 이름이라는 강렬한 이미지로 형상화함으로써, 상실의 절대적 성격을 시각적으로 전달한다. 이름이 부서진다는 것은 존재의 근거 자체가 해체되는 것을 의미하며, 이는 사랑하는 사람을 잃은 슬픔의 깊이를 극적으로 표현한 것이다.'
    },
    {
      id: 'p4',
      text: '김소월 시의 문학사적 의의는 민요적 율격과 근대적 자아 의식의 결합에서 찾을 수 있다. 그의 시는 삼음보나 칠오조 등 전통 시가의 고유한 리듬을 계승하면서도, 개인의 내밀한 감정을 표현하는 근대 서정시의 형식을 갖추고 있다. 이러한 결합은 전통과 근대의 가교 역할을 수행하여, 한국 현대시가 독자적인 정체성을 확립하는 데 결정적으로 기여하였다. 또한 그의 시어는 일상적이고 평이하면서도 깊은 정서적 울림을 지니고 있어, 전문적인 문학 훈련을 받지 않은 일반 독자도 쉽게 공감하고 감동을 받을 수 있다. 김소월의 시가 발표된 지 백 년이 지난 오늘날에도 널리 읽히고 암송되는 것은 바로 이러한 보편적 호소력에 기인한다.'
    }
  ];

  return { paragraphs, dayIndex: 64, subArea: 'LITERATURE', subAreaKo: '문학' };
}

function buildDay65() {
  // Day 65 - 비문학 (NONFICTION): 사회 - 도시화와 공동체의 변화
  const paragraphs = [
    {
      id: 'p1',
      text: '도시화는 인구가 농촌 지역에서 도시 지역으로 이동하면서 도시의 규모와 인구 밀도가 증가하는 현상을 말한다. 산업 혁명 이후 공장을 중심으로 노동력이 집중되면서 도시화가 본격적으로 시작되었으며, 이십 세기 후반에는 전 세계적으로 급속한 도시 팽창이 이루어졌다. 현재 세계 인구의 절반 이상이 도시에 거주하고 있으며, 이 비율은 앞으로도 계속 증가할 것으로 전망된다. 한국의 경우 일구육공 년대 이후 빠른 산업화와 함께 농촌 인구가 대도시로 대규모 이동하는 이촌향도 현상이 뚜렷하게 나타났다. 불과 수십 년 만에 도시 거주 인구 비율이 삼십 퍼센트 미만에서 구십 퍼센트 이상으로 급등한 것은 세계적으로도 유례없는 속도의 도시화였다.'
    },
    {
      id: 'p2',
      text: '급격한 도시화는 전통적인 공동체 구조에 근본적인 변화를 가져왔다. 농촌 공동체에서는 혈연과 지연을 바탕으로 한 밀착된 인간관계가 사회 질서의 기초를 이루었다. 이웃 간의 상호 부조는 생존을 위한 필수적 협력이었으며, 마을 전체가 하나의 유기적 공동체로 기능하였다. 그러나 도시에서는 익명성이 사회관계의 지배적 특성으로 나타난다. 같은 아파트에 살면서도 옆집 사람의 이름을 모르는 것이 도시 생활에서는 예외적인 일이 아니다. 개인의 사생활은 보호되지만, 그 대가로 고립과 소외의 문제가 발생한다. 독일의 사회학자 퇴니스는 이러한 변화를 공동사회에서 이익사회로의 전환이라 분석하였으며, 이는 근대화의 불가피한 귀결이라고 보았다.'
    },
    {
      id: 'p3',
      text: '도시 공동체의 약화는 다양한 사회 문제로 이어지고 있다. 일인 가구의 급증은 사회적 고립의 위험을 높이며, 특히 노인 일인 가구의 경우 건강 악화나 긴급 상황에서 도움을 받기 어려운 사각지대에 놓이기 쉽다. 무연 사회라는 신조어는 가족이나 이웃과의 유대가 단절된 채 살아가는 현대 도시인의 현실을 적나라하게 보여 준다. 또한 공동체 의식의 약화는 지역 사회의 자치 역량을 저하시키고, 사회적 갈등의 조정 비용을 증가시키는 결과를 낳기도 한다. 범죄 예방이나 재난 대응에 있어서도 이웃 간의 유대가 약한 지역은 상대적으로 취약한 모습을 보이는 것으로 여러 조사에서 확인되고 있다.'
    },
    {
      id: 'p4',
      text: '이러한 문제를 극복하기 위해 새로운 형태의 도시 공동체를 구축하려는 다양한 시도가 이루어지고 있다. 마을 만들기 사업이나 주민 참여형 도시 재생 사업은 물리적 환경의 개선과 함께 주민 간의 관계를 회복하는 것을 핵심 목표로 한다. 공유 경제의 확산도 도시민 사이의 새로운 연결을 만들어 내고 있으며, 온라인 플랫폼을 활용한 지역 커뮤니티도 활발하게 성장하고 있다. 이러한 노력은 전통적 공동체의 구속력 없이도 개인의 자율성을 존중하면서 사회적 유대를 형성할 수 있는 가능성을 보여 준다. 도시화가 초래한 공동체의 위기를 극복하는 일은 단순히 과거로 돌아가는 것이 아니라, 현대적 조건에 맞는 새로운 유형의 공동체를 창조하는 과제임을 인식할 필요가 있다.'
    }
  ];

  return { paragraphs, dayIndex: 65, subArea: 'NONFICTION', subAreaKo: '비문학' };
}

// ========== 메인 실행 ==========

function main() {
  const ROOT = path.resolve(__dirname, '..');
  const batchPath = path.join(ROOT, 'generated', 'daily-batch-reading-wittgenstein1.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'wittgenstein1');

  // 배치 파일 읽기
  console.log('배치 파일 읽는 중...');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

  // Day 61~65 콘텐츠 생성
  const dayBuilders = [buildDay61, buildDay62, buildDay63, buildDay64, buildDay65];
  const days = [];

  for (const builder of dayBuilders) {
    const { paragraphs, dayIndex, subArea, subAreaKo } = builder();
    const content = assembleFull({ dayIndex, subArea, subAreaKo, paragraphs });
    const batchItem = wrapBatchItem(content, dayIndex, subArea);
    days.push({ content, batchItem, dayIndex });
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
    console.log(`  contentId: ${day.content.contentId}`);

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
    console.warn('\n[경고] 검증 실패 항목이 있지만 파일은 생성합니다.');
  }

  // 배치 파일 업데이트 (items[60]~[64] 교체 — day_index 61~65)
  console.log('\n배치 파일 업데이트 중...');
  for (const day of days) {
    const idx = day.dayIndex - 1; // day_index 61 -> items[60]
    batch.items[idx] = day.batchItem;
    console.log(`  items[${idx}] (Day ${day.dayIndex}) 교체 완료`);
  }
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf-8');
  console.log('배치 파일 저장 완료.');

  // static 파일 생성
  console.log('\nstatic 파일 생성 중...');
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
  }
  for (const day of days) {
    const dayNum = String(day.dayIndex).padStart(3, '0');
    const staticPath = path.join(staticDir, `${dayNum}.json`);
    fs.writeFileSync(staticPath, JSON.stringify(day.content, null, 2), 'utf-8');
    console.log(`  ${dayNum}.json 저장 완료`);
  }

  console.log('\n모든 작업 완료!');
}

main();
