/**
 * 비트겐슈타인1 Day 56~60 일일독해 콘텐츠 빌드 스크립트
 * - Day 56(문학), 57(비문학), 58(문학), 59(비문학), 60(문학)
 * - 지문 3~4문단, 합계 1400±50자 (중3~고1 수준)
 * - 정독: 문장별 하이라이트 + 4지선다 + 문단별 중심내용
 * - 복기: 정확히 8장, seedPenalty: 1
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

function truncate(text, maxLen = 80) {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

function shuffleChoices(arr, seed) {
  const a = [...arr];
  let s = seed || 42;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 정독 타임라인 생성
function buildTimeline(paragraphs) {
  const timeline = [];
  let stepCount = 1;

  for (const para of paragraphs) {
    const sentences = findSentences(para.text);

    for (let si = 0; si < sentences.length; si++) {
      const sent = sentences[si];
      const otherSentences = [];
      for (const otherPara of paragraphs) {
        const otherSents = findSentences(otherPara.text);
        for (const os of otherSents) {
          if (os.text !== sent.text && os.text.length > 10) {
            otherSentences.push(os.text);
          }
        }
      }

      const seed = hashIdx(sent.text + stepCount);
      const wrongChoices = shuffleChoices(otherSentences, seed).slice(0, 3).map(t => truncate(t));

      const answerPos = seed % 4;
      const choiceIds = ['A','B','C','D'];
      const choices = [];
      let answerId = '';
      let wrongIdx = 0;

      for (let ci = 0; ci < 4; ci++) {
        if (ci === answerPos) {
          choices.push({ id: choiceIds[ci], text: truncate(sent.text) });
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
    const centerSent = paraSentences[0];
    const otherParaSentences = [];
    for (const otherPara of paragraphs) {
      if (otherPara.id !== para.id) {
        const os = findSentences(otherPara.text);
        for (const s of os) {
          if (s.text.length > 15) otherParaSentences.push(s.text);
        }
      }
    }

    const centerSeed = hashIdx(para.id + 'center');
    const wrongCenter = shuffleChoices(otherParaSentences, centerSeed).slice(0, 3);
    const centerAnswerPos = centerSeed % 4;
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

// 복기 카드 8장으로 분할
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

// 확인 문제 생성
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

  const seed = hashIdx(paragraphs.map(p => p.id).join(''));
  const selected = shuffleChoices(questionTemplates, seed).slice(0, 6);

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
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: 'ANY'
    });
  }

  return { questions };
}

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
      if (!concepts.includes(t) && t.length >= 3 && !/[하되지며으]$/.test(t)) {
        concepts.push(t);
      }
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

function generateQuestionPrompt(concept, sentence) {
  const templates = [
    `이 글에서 '${concept}'이(가) 의미하는 바에 해당하는 부분은 어디인가요?`,
    `'${concept}'에 해당하는 내용이 나타난 부분은 어디인가요?`,
    `이 글에서 '${concept}'이(가) 언급된 부분은 어디인가요?`,
    `'${concept}'과(와) 관련된 설명이 등장하는 부분은 어디인가요?`,
    `글에서 '${concept}'의 역할을 설명하는 부분은 어디인가요?`,
    `'${concept}'이(가) 포함된 문맥은 어디인가요?`
  ];
  const idx = hashIdx(concept) % templates.length;
  return templates[idx];
}

// ========== 콘텐츠 조립 ==========

function assembleFull({ dayIndex, subArea, title, paragraphs }) {
  const dayStr = String(dayIndex).padStart(3, '0');
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
      contentId: `dr-w1-${dayStr}`,
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
    }
  };
}

function wrapBatchItem(assembled) {
  return assembled; // 이미 batch 형식으로 생성됨
}

// ========== 콘텐츠 정의 ==========

function buildDay56() {
  // Day 56 - 문학 (LITERATURE): 현대 소설 - 도시와 고독
  const paragraphs = [
    {
      id: 'p1',
      text: '민수는 매일 아침 같은 시간에 지하철을 탄다. 출근 시간의 지하철은 수백 명의 사람으로 가득 차 있지만, 그 안에서 서로 눈을 마주치는 사람은 거의 없다. 모두가 저마다의 화면 속에 시선을 묻고 있거나, 이어폰을 꽂은 채 자신만의 세계에 갇혀 있다. 민수도 다르지 않았다. 그는 매일 같은 칸에 올라타 같은 손잡이를 잡고, 같은 역에서 내렸다. 그 반복 속에서 그가 느끼는 것은 익숙함이 아니라 일종의 무감각이었다. 도시의 군중 속에서 느끼는 외로움은 텅 빈 방에서 느끼는 것과는 질적으로 달랐다. 사람들에게 둘러싸여 있으면서도 아무와도 연결되어 있지 않다는 감각은 보이지 않는 유리벽에 갇힌 것과 같았다.'
    },
    {
      id: 'p2',
      text: '어느 날 민수는 퇴근길 지하철에서 한 노인이 좌석에 앉지 못하고 서 있는 모습을 보았다. 주위의 젊은이들은 고개를 숙인 채 휴대전화만 바라보고 있었다. 민수는 잠시 망설이다가 자리에서 일어나 노인에게 자리를 양보했다. 노인은 고맙다며 민수의 손을 꼭 잡았다. 그 따뜻한 손의 감촉에 민수는 가슴 한쪽이 먹먹해지는 것을 느꼈다. 누군가의 온기를 느낀 것이 얼마나 오래된 일인지 기억나지 않았다. 노인은 민수에게 어디까지 가느냐고 물었고, 민수는 자기도 모르게 자신의 이야기를 조금씩 꺼내 놓았다. 타지에서 홀로 일하며 주말에도 만날 사람이 없다는 말이 입 밖으로 나왔을 때, 민수는 스스로도 놀랐다.'
    },
    {
      id: 'p3',
      text: '노인은 조용히 들어 주었다. 민수가 말을 마치자 노인은 나도 아내를 보내고 혼자 산 지 벌써 십 년이 넘었다고 했다. 하지만 매일 아침 공원에 나가 산책을 하고, 거기서 만나는 사람들과 인사를 나누는 것만으로도 하루가 다르게 느껴진다고 덧붙였다. 노인의 말은 특별한 것이 아니었지만, 민수에게는 오랫동안 잊고 있던 무언가를 일깨워 주는 것 같았다. 관계란 거창한 것이 아니라 작은 인사 한마디에서 시작될 수 있다는 깨달음이었다. 민수가 내리는 역에 도착했을 때, 노인은 다음에도 만나면 인사하자고 말했다. 민수는 처음으로 진심을 담아 고개를 숙이며 인사했다.'
    },
    {
      id: 'p4',
      text: '그날 이후 민수는 조금씩 달라지기 시작했다. 아침마다 편의점에서 커피를 사면서 직원에게 좋은 아침이라고 인사를 건넸다. 처음에는 어색한 표정을 짓던 직원도 며칠이 지나자 웃으며 화답했다. 지하철에서도 옆 사람이 짐을 들고 힘들어하면 자리를 비켜 주고, 엘리베이터에서 만나는 이웃에게 먼저 말을 걸었다. 그렇게 작은 행동들이 쌓이자 민수의 일상은 조금씩 색채를 되찾아 갔다. 점심시간에 동료와 나누는 짧은 대화도 이전과 다르게 느껴졌고, 퇴근 후 혼자 먹던 저녁도 가끔은 동료와 함께하게 되었다. 그가 변한 것은 환경이 아니라 타인을 향한 태도였다. 도시의 군중 속에서 사람을 발견하기 시작한 것이다. 유리벽은 여전히 존재했지만, 그 벽에 작은 문 하나를 낸 것만으로도 세상은 달라 보였다.'
    }
  ];

  return assembleFull({
    dayIndex: 56,
    subArea: 'LITERATURE',
    title: '일일 독해(비트겐슈타인 1) Day 56 문학',
    paragraphs
  });
}

function buildDay57() {
  // Day 57 - 비문학 (NONFICTION): 환경과학 - 미세 플라스틱의 위협
  const paragraphs = [
    {
      id: 'p1',
      text: '미세 플라스틱이란 지름이 오 밀리미터 이하인 작은 플라스틱 조각을 말한다. 미세 플라스틱은 크게 두 가지 경로로 발생한다. 하나는 처음부터 작은 크기로 제조되는 경우로, 세안제나 치약에 포함된 마이크로비즈가 대표적이다. 다른 하나는 큰 플라스틱 제품이 자외선이나 파도 등에 의해 물리적으로 분해되면서 점점 작아지는 경우이다. 일회용 컵이나 비닐봉지, 페트병 같은 생활 폐기물이 바다로 유입되면 수십 년에 걸쳐 서서히 분해되면서 미세 플라스틱으로 변한다. 이렇게 발생한 미세 플라스틱은 크기가 매우 작아 기존의 하수 처리 시설로는 완전히 걸러 내기 어렵고, 한번 자연에 방출되면 회수하는 것이 사실상 불가능하다. 이러한 특성 때문에 미세 플라스틱은 환경 오염 물질 중에서도 특히 심각한 문제로 대두되고 있다.'
    },
    {
      id: 'p2',
      text: '미세 플라스틱이 해양 생태계에 미치는 영향은 광범위하다. 동물성 플랑크톤이나 작은 물고기는 미세 플라스틱을 먹이로 착각하여 섭취하는 경우가 많다. 이렇게 체내에 축적된 플라스틱은 소화 기관을 막거나 영양 흡수를 방해하여 개체의 생존율을 떨어뜨린다. 더 심각한 문제는 먹이 사슬을 통한 생물 농축이다. 작은 물고기를 큰 물고기가 먹고, 큰 물고기를 더 큰 포식자가 먹는 과정에서 미세 플라스틱은 점점 높은 농도로 축적된다. 연구에 따르면 상위 포식자인 참치나 고래의 체내에서 상당량의 미세 플라스틱이 검출되었으며, 이는 궁극적으로 해당 어류를 섭취하는 인간의 건강에도 영향을 미칠 수 있다.'
    },
    {
      id: 'p3',
      text: '미세 플라스틱의 위험은 해양에만 국한되지 않는다. 최근 연구에서는 대기 중에 떠다니는 미세 플라스틱이 발견되었으며, 빗물이나 눈에서도 검출되고 있다. 이는 미세 플라스틱이 바람을 타고 대기권으로 이동하여 전 지구적으로 확산될 수 있음을 의미한다. 또한 농경지에 뿌려지는 비닐 멀칭이나 하수 처리 과정에서 발생하는 슬러지를 비료로 사용하면서 토양에도 미세 플라스틱이 축적되고 있다. 토양 속 미세 플라스틱은 지렁이 같은 토양 생물의 활동을 저해하고, 토양의 수분 보유 능력을 변화시켜 작물의 생장에도 부정적인 영향을 줄 수 있다. 나아가 지하수로 스며든 미세 플라스틱은 음용수 오염의 원인이 되기도 한다.'
    },
    {
      id: 'p4',
      text: '이러한 문제에 대응하기 위해 각국은 다양한 규제와 정책을 시행하고 있다. 유럽연합은 화장품에 마이크로비즈를 사용하는 것을 전면 금지하였으며, 일회용 플라스틱 제품의 사용을 단계적으로 줄이는 지침을 마련하였다. 우리나라에서도 일회용 컵 보증금 제도를 도입하고 플라스틱 포장재의 재활용 비율을 높이기 위한 정책을 추진하고 있다. 그러나 규제만으로는 한계가 있다. 이미 환경에 존재하는 미세 플라스틱을 제거하는 기술의 개발이 시급하며, 생분해성 소재를 이용한 대체 제품의 상용화도 함께 이루어져야 한다. 궁극적으로는 플라스틱의 생산과 소비 자체를 줄이는 방향으로 사회 전반의 인식이 전환되어야 미세 플라스틱 문제의 근본적인 해결이 가능할 것이다.'
    }
  ];

  return assembleFull({
    dayIndex: 57,
    subArea: 'NONFICTION',
    title: '일일 독해(비트겐슈타인 1) Day 57 비문학',
    paragraphs
  });
}

function buildDay58() {
  // Day 58 - 문학 (LITERATURE): 현대시 감상 - 자연과 인간의 관계
  const paragraphs = [
    {
      id: 'p1',
      text: '정지용의 시에서 자연은 단순한 배경이 아니라 시적 화자의 감정과 인식을 비추는 거울이다. 그의 대표작 유리창에서 화자는 차가운 유리창에 입김을 불어 서리를 녹이며, 그 너머로 보이지 않는 무언가를 바라본다. 유리창은 안과 밖을 나누는 경계로서, 화자가 현실과 이상 사이에 놓여 있음을 상징한다. 입김이 서리를 녹이는 행위는 차갑게 닫힌 세계와 소통하려는 간절한 시도이며, 동시에 그 시도가 유리 한 장을 넘지 못한다는 한계를 드러낸다. 이처럼 정지용은 감각적 이미지를 통해 추상적인 감정을 구체적으로 형상화하는 데 뛰어난 시인으로 평가된다. 그의 언어는 마치 수채화처럼 맑고 투명하면서도, 그 안에 깊은 슬픔과 그리움을 머금고 있다.'
    },
    {
      id: 'p2',
      text: '향수에서 정지용은 고향의 풍경을 오감으로 불러낸다. 넓은 벌 동쪽 끝으로 실개천이 회돌아 나가는 풍경은 시각적 이미지로, 전원적 공간의 아늑함을 전달한다. 질화로에 재가 식어지면이라는 구절은 촉각적 이미지를 통해 시간의 흐름과 따스했던 기억이 식어 가는 감각을 동시에 환기한다. 이러한 감각적 묘사는 고향이라는 공간을 추상적인 관념이 아니라 구체적으로 느낄 수 있는 경험의 장소로 만들어 준다. 화자는 고향을 떠나 있는 상태에서 과거의 기억을 하나하나 소환하며, 돌아갈 수 없는 시간에 대한 아쉬움을 노래한다. 고향은 물리적 공간인 동시에 돌아갈 수 없는 시간을 의미하기도 한다. 이러한 이중적 의미가 이 시의 정서적 깊이를 형성하는 핵심 요소이다.'
    },
    {
      id: 'p3',
      text: '정지용과 달리 김수영의 시에서 자연은 인간 사회를 향한 비판적 시선을 담아내는 매개체이다. 풀이라는 시에서 풀은 바람에 눕지만 다시 일어나는 존재로 그려진다. 여기서 바람은 억압적 힘을 상징하고, 풀은 그 억압에도 굴하지 않고 저항하는 민중을 의미한다. 풀이 바람보다 먼저 눕는다는 표현은 민중이 일시적으로 힘에 굴복하는 모습을 나타내지만, 바람보다 먼저 일어난다는 구절은 궁극적으로 민중의 생명력이 억압을 이긴다는 신념을 담고 있다. 김수영은 자연물에 정치적 의미를 부여함으로써 검열을 우회하면서도 강렬한 메시지를 전달하는 전략을 구사하였다. 이러한 기법은 직접적 발화가 제한된 시대에 문학이 취할 수 있는 우회적 저항의 한 형태이기도 하다.'
    },
    {
      id: 'p4',
      text: '두 시인의 비교를 통해 한국 현대시에서 자연이 수행하는 다층적 역할을 이해할 수 있다. 정지용에게 자연은 개인의 서정적 감수성을 드러내는 도구였다면, 김수영에게 자연은 사회적 메시지를 전달하는 수단이었다. 그러나 양자에게 공통되는 것은 자연이 결코 인간과 분리된 대상이 아니라는 인식이다. 정지용의 시에서 유리창 너머의 풍경은 화자의 내면 상태를 투영하며, 김수영의 시에서 풀의 움직임은 인간 사회의 역학을 반영한다. 자연은 시인의 언어를 통해 인간의 감정과 사회적 현실을 비추는 거울이 된다. 이처럼 자연을 매개로 인간 존재의 의미를 탐구하는 것은 한국 현대시의 중요한 전통 가운데 하나이며, 오늘날에도 많은 시인에 의해 계승되고 있다.'
    }
  ];

  return assembleFull({
    dayIndex: 58,
    subArea: 'LITERATURE',
    title: '일일 독해(비트겐슈타인 1) Day 58 문학',
    paragraphs
  });
}

function buildDay59() {
  // Day 59 - 비문학 (NONFICTION): 사회과학 - 공정 무역의 의의와 한계
  const paragraphs = [
    {
      id: 'p1',
      text: '공정 무역이란 선진국과 개발도상국 사이의 불평등한 교역 구조를 개선하기 위해 생산자에게 정당한 대가를 지급하는 무역 방식을 말한다. 전통적인 국제 무역에서 개발도상국의 농민이나 노동자는 대형 유통 기업에 비해 극히 낮은 교섭력을 지니고 있어, 생산물에 대한 적정한 보상을 받지 못하는 경우가 빈번하였다. 특히 커피와 카카오, 면화 등 열대 작물의 경우 국제 시세의 급격한 변동으로 인해 영세 농가의 소득이 불안정해지는 문제가 만성적으로 발생하였다. 공정 무역은 이러한 구조적 불평등을 해소하기 위해 최저 보장 가격을 설정하고, 생산자 조합에 별도의 사회 발전 기금을 지급함으로써 생산자의 경제적 안정과 지역 사회의 발전을 도모한다.'
    },
    {
      id: 'p2',
      text: '공정 무역 인증 제도는 이 운동의 핵심 메커니즘이다. 국제 공정 무역 기구는 노동 조건, 환경 보호, 공동체 발전 등 여러 기준을 제시하고, 이를 충족하는 생산자에게 공정 무역 인증 마크를 부여한다. 소비자는 이 마크가 부착된 제품을 구매함으로써 윤리적 소비에 동참하게 된다. 인증을 받은 생산자는 최저 보장 가격 이상의 대가를 보장받으며, 추가로 지급되는 프리미엄은 학교 건설이나 식수 시설 확충, 의료 서비스 제공 등 공동체의 필요에 따라 사용된다. 이러한 구조 덕분에 공정 무역은 단순한 경제적 거래를 넘어 교육과 보건, 여성 권한 강화 등 폭넓은 사회적 효과를 창출한다는 평가를 받고 있다.'
    },
    {
      id: 'p3',
      text: '그러나 공정 무역에 대한 비판도 적지 않다. 첫째, 공정 무역 인증을 획득하려면 일정한 비용과 행정 절차가 필요하여 가장 영세한 농가는 오히려 참여하기 어렵다는 지적이 있다. 둘째, 최저 보장 가격이 시장 가격보다 높게 설정될 경우 생산 과잉을 유발하여 공정 무역 체계 밖에 있는 농가의 소득을 더욱 하락시킬 수 있다. 셋째, 공정 무역 제품이 전체 국제 무역에서 차지하는 비중이 매우 낮아 구조적 변화를 이끌기에는 역부족이라는 비판도 있다. 넷째, 일부 대기업이 공정 무역 인증을 마케팅 수단으로 활용하면서도 실질적인 공정성 개선에는 소극적인 이른바 공정 무역 워싱의 문제가 제기되기도 한다.'
    },
    {
      id: 'p4',
      text: '이러한 한계에도 불구하고 공정 무역은 국제 교역의 윤리적 측면에 대한 사회적 인식을 높이는 데 상당한 기여를 하였다. 소비자의 구매 결정이 단순히 가격과 품질에 의해서만 이루어지는 것이 아니라 생산 과정의 공정성과 환경적 지속 가능성에 의해서도 영향을 받을 수 있다는 점을 보여 주었기 때문이다. 최근에는 공정 무역의 원리를 보다 광범위하게 적용하려는 움직임이 나타나고 있다. 이를테면 기업의 공급망 전체에 대한 투명성을 요구하는 법안이 여러 국가에서 추진되고 있으며, 소비자 주도의 윤리적 소비 운동도 확산되고 있다. 공정 무역이 완전한 해결책은 아니지만, 보다 정의로운 국제 교역 질서를 모색하는 출발점으로서의 의미는 여전히 유효하다.'
    }
  ];

  return assembleFull({
    dayIndex: 59,
    subArea: 'NONFICTION',
    title: '일일 독해(비트겐슈타인 1) Day 59 비문학',
    paragraphs
  });
}

function buildDay60() {
  // Day 60 - 문학 (LITERATURE): 고전 수필 해석 - 이규보의 글과 자의식
  const paragraphs = [
    {
      id: 'p1',
      text: '이규보는 고려 시대를 대표하는 문인으로서 방대한 양의 시와 산문을 남겼다. 그의 문집인 동국이상국집에는 정치적 논설에서 일상적 감회에 이르기까지 다양한 주제의 글이 수록되어 있다. 그 가운데 특히 주목할 만한 것은 슬견설이라는 짧은 수필이다. 슬견설에서 이규보는 어릴 때 파리를 잡아 거미줄에 던져 주던 경험을 회상한다. 거미가 파리를 잡아먹는 것을 재미있게 구경하던 자신이 성장하여 그 행위의 잔인함을 깨닫게 되었다는 내용이다. 이 글은 한 편의 작은 에피소드를 통해 인간의 도덕적 각성 과정을 자연스럽게 보여 준다는 점에서 수필 문학의 묘미를 잘 드러낸다.'
    },
    {
      id: 'p2',
      text: '슬견설의 핵심적인 문학적 장치는 시점의 전환이다. 어린 시절의 자아는 파리의 고통을 인식하지 못한 채 거미의 포식 행위를 오락으로 즐긴다. 이는 도덕적 감수성이 아직 발달하지 않은 상태, 즉 윤리적 미성숙의 단계를 보여 준다. 반면 성인이 된 자아는 그때의 행동을 반성하며 약한 존재에 대한 공감 능력을 드러낸다. 이 두 시점의 대비를 통해 이규보는 인간의 도덕성이 선천적으로 주어지는 것이 아니라 경험과 성찰을 통해 형성되는 것임을 보여 준다. 동시에 과거의 자신을 솔직하게 드러내는 고백적 서술은 독자에게 신뢰감을 주며, 교훈을 직접적으로 설파하지 않으면서도 자연스럽게 깨달음을 전달하는 효과를 낳는다.'
    },
    {
      id: 'p3',
      text: '이규보의 산문에서 반복적으로 나타나는 특징은 강한 자의식이다. 그는 자신의 재능에 대한 뚜렷한 확신을 가지고 있었으며, 동시에 그 재능이 충분히 인정받지 못하는 현실에 대한 불만을 숨기지 않았다. 이 같은 자의식은 때로 자만으로 비칠 수 있었지만, 이규보의 경우 솔직한 자기 고백과 결합되어 오히려 인간적인 매력으로 작용한다. 그가 술을 좋아하고 시를 짓는 것에 탐닉했다는 고백은 유교적 절제의 미덕에서 벗어난 것이지만, 그러한 인간적 면모가 그의 글에 생동감을 부여한다. 또한 자신의 약점을 감추지 않고 드러내는 태도는 독자와의 거리감을 좁히는 효과를 지닌다. 이규보의 자의식은 자기 과시가 아니라 자신의 존재 의미를 끊임없이 묻는 성찰의 표현이었다고 볼 수 있다.'
    },
    {
      id: 'p4',
      text: '이규보의 문학은 고려 시대 문학사에서 중요한 전환점을 이룬다. 그 이전의 한문학이 중국 문학의 형식과 내용을 충실히 모방하는 경향이 강했다면, 이규보는 자신만의 목소리와 관점으로 독자적인 문학 세계를 구축하고자 하였다. 그의 서사시 동명왕편은 고구려의 건국 신화를 서사시로 재구성한 작품으로서, 우리 역사와 문화에 대한 자긍심을 문학적으로 표현한 선구적 사례이다. 이규보는 중국의 것만이 우수하다는 당시의 풍조에 맞서 우리 고유의 이야기도 충분히 문학적 가치를 지닌다는 주장을 실천으로 보여 주었다. 그는 우리 땅의 산천과 풍속을 시의 소재로 삼아 독자적 미학을 추구하였다. 이러한 의식은 후대의 문인들에게 큰 영향을 미쳤으며, 한국 문학이 독자적 정체성을 형성해 가는 과정에서 중요한 이정표가 되었다.'
    }
  ];

  return assembleFull({
    dayIndex: 60,
    subArea: 'LITERATURE',
    title: '일일 독해(비트겐슈타인 1) Day 60 문학',
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

  // Day 56~60 콘텐츠 생성
  const days = [
    buildDay56(),
    buildDay57(),
    buildDay58(),
    buildDay59(),
    buildDay60()
  ];

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
      console.warn(`  !! 글자 수 범위 이탈! (${totalChars}자)`);
      hasWarning = true;
    }
    if (recallCards !== 8) {
      console.warn(`  !! 복기 카드 수 8장이 아님! (${recallCards}장)`);
      hasWarning = true;
    }
    if (confirmQs < 5 || confirmQs > 8) {
      console.warn(`  !! 확인 문항 수 범위 이탈! (${confirmQs}문항)`);
      hasWarning = true;
    }
  }

  if (hasWarning) {
    console.warn('\n경고: 일부 검증 실패 항목이 있으나 파일은 생성합니다.');
  }

  // 배치 파일 업데이트 (items[55]~[59] 교체 = Day 56~60)
  console.log('\n배치 파일 업데이트 중...');
  for (let i = 0; i < 5; i++) {
    const targetIdx = 55 + i;
    batch.items[targetIdx] = wrapBatchItem(days[i]);
  }
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf-8');
  console.log('배치 파일 저장 완료.');

  // static 파일 생성
  console.log('\nstatic 파일 생성 중...');
  for (const day of days) {
    const dayNum = String(day.day_index).padStart(3, '0');
    const staticPath = path.join(staticDir, `${dayNum}.json`);
    fs.writeFileSync(staticPath, JSON.stringify(day.content, null, 2), 'utf-8');
    console.log(`  ${dayNum}.json 저장 완료`);
  }

  console.log('\n모든 작업 완료!');
}

main();
