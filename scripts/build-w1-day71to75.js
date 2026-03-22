/**
 * 비트겐슈타인1 Day 71~75 일일독해 콘텐츠 빌더 스크립트
 * - Day 71(비문학), 72(문학), 73(비문학), 74(문학), 75(비문학)
 * - 지문 3~4문단, 합계 1400±50자 (1350~1450)
 * - 정독: buildTimeline (문장별 하이라이트 + 4지선다)
 * - 복기: buildRecallCards (8카드, seedPenalty: 1)
 * - 확인: 5~8문항, scoring: {correctDeltaSec:30, wrongDeltaSec:-45}, revealOnWrong: true, answerMatchMode: "ANY"
 * - answerRanges는 findRange()로 indexOf 기반 정확 계산
 */

const fs = require('fs');
const path = require('path');

// ========== 유틸리티 함수 ==========

function findSentences(text) {
  const sentences = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i + 1] === ' ' || text[i + 1] === '\n')) {
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

function hashIdx(str, mod) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return ((h % mod) + mod) % mod;
}

function truncate(text, maxLen = 80) {
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

// ========== 정독 타임라인 ==========

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

      const wrongChoices = shuffleChoices(otherSentences).slice(0, 3).map(t => truncate(t));
      const answerPos = hashIdx(sent.text + stepCount, 4);
      const choiceIds = ['A', 'B', 'C', 'D'];
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

      while (choices.length < 4) {
        choices.push({ id: choiceIds[choices.length], text: '이 문장은 지문에 포함되지 않은 내용이다.' });
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
        const os = findSentences(otherPara.text);
        for (const s of os) {
          if (s.text.length > 15) otherParaSentences.push(s.text);
        }
      }
    }

    const centerSent = paraSentences[0];
    const wrongCenter = shuffleChoices(otherParaSentences).slice(0, 3);
    const centerAnswerPos = hashIdx(para.id + stepCount, 4);
    const centerChoices = [];
    let centerAnswerId = '';
    const cIds = ['A', 'B', 'C', 'D'];
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

// ========== 복기 카드 ==========

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

// ========== 확인 문항 ==========

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

// ========== assembleFull ==========

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

// ========== wrapBatchItem ==========

function wrapBatchItem(dayIndex, subArea, content) {
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

function buildDay71() {
  // Day 71 - 비문학: 언어학 - 은유의 인지적 기능
  const paragraphs = [
    {
      id: 'p1',
      text: '은유는 단순한 문학적 수사가 아니라 인간의 사고 체계를 구성하는 핵심적 인지 도구이다. 전통적으로 은유는 시나 소설에서 사용되는 장식적 표현으로 여겨져 왔으며, 수사학에서도 글을 아름답게 꾸미는 기교의 하나로 분류되어 왔다. 그러나 인지언어학의 연구에 따르면 은유는 일상 언어 전반에 깊이 침투해 있으며, 우리가 세계를 이해하는 방식 자체를 구조화한다. 조지 레이코프와 마크 존슨은 삶은 여행이다, 논쟁은 전쟁이다와 같은 개념적 은유가 우리의 사고와 행동을 근본적으로 형성한다고 주장하였다. 인생의 갈림길이라는 표현이나 논쟁에서 상대방의 주장을 공격하다와 같은 일상적 표현은 이러한 은유적 사고의 구체적인 발현이다.'
    },
    {
      id: 'p2',
      text: '개념적 은유의 핵심 원리는 추상적이고 복잡한 영역을 구체적이고 경험적인 영역을 통해 이해하는 것이다. 인간은 직접 경험할 수 있는 물리적 세계의 구조를 활용하여 시간, 감정, 도덕과 같은 추상적 개념을 파악한다. 시간은 돈이다라는 은유에서 시간은 절약하고 낭비하고 투자하는 대상으로 인식된다. 이 은유가 지배적인 문화에서는 시간을 효율적으로 관리하는 것이 중요한 덕목으로 여겨지며, 시간을 허비하는 행위는 도덕적 비난의 대상이 된다. 반면에 시간을 흐르는 강물로 인식하는 문화에서는 순리에 따르는 삶이 더 높이 평가된다. 이처럼 특정 은유 체계의 선택은 우리의 가치관과 행동 양식에까지 광범위한 영향을 미친다.'
    },
    {
      id: 'p3',
      text: '은유는 과학적 사고에서도 중요한 역할을 수행한다. 원자의 구조를 태양계에 비유한 보어의 원자 모형이나, 유전 정보를 책의 문자에 비유하는 표현은 과학적 발견과 이해에 은유가 기여한 대표적 사례이다. 과학자들은 관찰할 수 없는 미시 세계를 설명하기 위해 일상적 경험에서 유래한 은유를 적극적으로 활용해 왔다. 다만 은유가 지닌 구조적 한계도 존재한다. 어떤 은유든 원래 영역의 특정 측면만을 부각하고 나머지를 은폐하는 경향이 있기 때문이다. 원자를 태양계에 비유하면 전자의 궤도 운동이 강조되지만, 양자역학적 확률 분포라는 본질적 특성은 가려지게 된다.'
    },
    {
      id: 'p4',
      text: '은유에 대한 인지적 이해는 교육과 의사소통 분야에도 실질적인 시사점을 제공한다. 학습자가 새로운 개념을 이해하는 과정에서 적절한 은유의 제시는 인지적 다리 역할을 하여 학습 효과를 크게 높일 수 있다. 전기의 흐름을 물의 흐름에 비유하는 것은 과학 교육에서 흔히 사용되는 효과적인 은유의 사례이다. 반면에 부적절한 은유는 오개념을 유발할 위험이 있으므로 은유의 선택에는 신중함이 요구된다. 또한 정치 담론에서 은유의 사용은 여론을 특정 방향으로 유도하는 강력한 도구가 될 수 있다. 경제 위기를 자연재해에 비유하면 책임 주체가 희석되고, 질병에 비유하면 치료해야 할 대상이 부각된다. 따라서 은유에 대한 비판적 인식은 정보를 올바르게 수용하고 사회적 담론에 능동적으로 참여하기 위해 필수적인 역량이라 할 수 있다.'
    }
  ];

  const total = paragraphs.reduce((s, p) => s + p.text.length, 0);
  console.log(`Day 71 총 글자 수: ${total}`);

  const dayStr = '071';
  const subArea = 'NONFICTION';
  const content = assembleFull({
    dayIndex: 71,
    contentId: `dr-w1-${dayStr}`,
    subArea,
    title: `일일 독해(비트겐슈타인 1) Day 71 비문학`,
    paragraphs
  });
  return { dayIndex: 71, subArea, content, dayStr };
}

function buildDay72() {
  // Day 72 - 문학: 현대 소설 - 도시의 고독과 인간관계
  const paragraphs = [
    {
      id: 'p1',
      text: '아파트 열두 층에서 내려다보면 사람들은 개미처럼 작았다. 수진은 매일 아침 커튼을 열 때마다 그 풍경을 바라보며 자신도 저 아래의 누군가에게는 한 점의 점에 불과할 것이라고 생각했다. 이 도시로 올라온 지 삼 년이 지났지만 친한 사람이라고는 같은 부서의 민지뿐이었다. 회사에서는 웃고 떠들었지만 퇴근 후에는 아무도 전화하지 않았고, 주말에는 텔레비전 소리만이 빈 방을 채웠다. 냉장고에는 편의점에서 사 온 도시락만 쌓여 갔고, 따뜻한 밥 냄새가 나는 집이 그리웠다. 수진은 가끔 고향의 어머니에게 전화를 걸었으나 잘 지내고 있다는 말밖에 할 줄 몰랐다. 어머니도 더 이상 묻지 않았고, 그 침묵 속에서 서로의 걱정만이 무겁게 가라앉았다.'
    },
    {
      id: 'p2',
      text: '어느 날 퇴근길에 수진은 아파트 현관 앞에서 한 노인을 만났다. 비가 부슬부슬 내리는 저녁이었다. 노인은 무거운 장바구니를 들고 비밀번호를 누르지 못하고 서 있었다. 수진이 문을 열어 주자 노인은 고맙다며 환하게 웃었다. 그 웃음이 오래된 기억을 건드렸다. 돌아가신 할머니도 장을 보고 돌아오면 늘 그렇게 웃으셨다. 수진은 엘리베이터 안에서 노인이 오 층에 산다는 것을 알게 되었다. 이름은 김옥순, 혼자 사는 지 칠 년째라고 했다. 노인은 젊은 사람이 이렇게 친절할 줄 몰랐다며 연신 고마워했고, 수진은 괜스레 코끝이 시큰해졌다. 그날 밤 수진은 오랜만에 잠들기 전 울지 않았다.'
    },
    {
      id: 'p3',
      text: '그 뒤로 수진은 가끔 오 층에 들러 노인을 찾았다. 김옥순 할머니의 방은 좁았지만 따뜻했고, 찬장 위에는 오래된 가족사진이 빼곡하게 놓여 있었다. 할머니는 아들이 외국에 나가 있다며 사진 속 젊은 남자를 가리켰다. 전화가 가끔 오지만 목소리만으로는 아들의 얼굴을 기억하기 어려워진다고 했다. 수진은 그 말에 자신의 어머니를 떠올렸다. 자기도 어머니에게 그런 존재가 되어 가고 있는 것은 아닌지 불안했다. 수진은 주말마다 할머니의 집을 방문하기 시작했고, 할머니는 된장찌개와 나물 반찬을 차려 주었다. 음식을 먹으며 나누는 소소한 대화 속에서 수진은 도시 생활에서 처음으로 따뜻한 연결감을 느꼈다.'
    },
    {
      id: 'p4',
      text: '어느 일요일 오후, 수진이 오 층을 찾았을 때 문 앞에 우유 두 병이 쌓여 있었다. 초인종을 눌러도 대답이 없었다. 관리실에 연락하여 문을 열자 할머니는 거실 바닥에 쓰러져 있었다. 구급차가 올 때까지 수진은 할머니의 손을 놓지 않았다. 병원에서 할머니는 다행히 의식을 되찾았고, 수진의 얼굴을 보며 자네가 와 주어서 참 다행이라고 말했다. 수진은 병실 창밖을 바라보았다. 도시의 불빛이 수없이 반짝이고 있었고, 그 불빛 하나하나 뒤에 혼자 밤을 보내는 사람이 있을 것이라는 생각이 들었다. 수진은 주머니에서 전화기를 꺼내 어머니의 번호를 눌렀다. 엄마, 다음 주에 내려갈게. 그 한마디가 입 밖으로 나오기까지 삼 년이 걸렸다.'
    }
  ];

  const total = paragraphs.reduce((s, p) => s + p.text.length, 0);
  console.log(`Day 72 총 글자 수: ${total}`);

  const dayStr = '072';
  const subArea = 'LITERATURE';
  const content = assembleFull({
    dayIndex: 72,
    contentId: `dr-w1-${dayStr}`,
    subArea,
    title: `일일 독해(비트겐슈타인 1) Day 72 문학`,
    paragraphs
  });
  return { dayIndex: 72, subArea, content, dayStr };
}

function buildDay73() {
  // Day 73 - 비문학: 사회과학 - 민주주의와 다수결 원리의 한계
  const paragraphs = [
    {
      id: 'p1',
      text: '민주주의의 가장 기본적인 의사 결정 방식으로 다수결 원리가 널리 사용되고 있다. 다수결이란 구성원 과반수의 의사에 따라 집단의 결정을 내리는 방법으로, 절차의 명확성과 효율성이라는 장점을 지닌다. 모든 구성원에게 동등한 한 표를 부여함으로써 형식적 평등을 보장하며, 비교적 신속하게 결론에 도달할 수 있다는 실용적 이점도 있다. 복잡한 이해관계가 얽힌 사안이라 하더라도 투표를 통해 하나의 결론을 도출할 수 있다는 점에서, 다수결은 집단적 의사 결정의 교착 상태를 해소하는 효과적인 방법이기도 하다. 이러한 이유로 다수결은 국회의 법률 제정, 학급 회의, 주민 투표 등 다양한 차원의 의사 결정에서 핵심적인 원리로 기능하고 있다.'
    },
    {
      id: 'p2',
      text: '그러나 다수결 원리에는 심각한 한계가 존재한다. 가장 근본적인 문제는 다수의 의견이 반드시 올바른 것은 아니라는 점이다. 역사적으로 노예제의 유지나 여성 참정권의 부정과 같은 부당한 결정이 다수결을 통해 합법적으로 이루어진 사례가 있다. 이를 다수의 횡포라 부르는데, 이는 다수가 소수의 기본적 권리를 침해하는 결정을 내릴 수 있다는 민주주의의 구조적 위험을 가리킨다. 알렉시스 드 토크빌은 이미 십구 세기에 이 문제를 지적하며, 다수의 의지가 무제한적으로 관철될 때 그것은 전제정치와 다를 바 없다고 경고한 바 있다. 소수자의 종교적 자유나 표현의 자유와 같은 기본권이 다수의 결정에 의해 제한될 수 있다는 점은 민주주의의 역설적 측면이다.'
    },
    {
      id: 'p3',
      text: '다수결의 또 다른 한계는 선호의 강도를 반영하지 못한다는 점이다. 한 표라는 형식적 평등은 선택의 절박함이나 이해관계의 깊이를 구별하지 않는다. 예를 들어 특정 지역에 폐기물 처리장을 건설하는 안건에서, 해당 지역 주민에게 이 결정은 삶의 터전이 걸린 절박한 문제이지만 다른 지역 주민에게는 큰 관심 사항이 아닐 수 있다. 그럼에도 한 표의 무게는 동일하게 취급되며, 무관심한 다수의 찬성이 절박한 소수의 반대를 압도하는 상황이 발생할 수 있다. 이러한 문제는 단순 다수결이 집단 전체의 후생을 최적화하지 못하는 경우가 있음을 보여 준다.'
    },
    {
      id: 'p4',
      text: '이러한 한계를 보완하기 위해 다양한 제도적 장치가 고안되어 왔다. 헌법에 의한 기본권 보장은 다수결로도 침해할 수 없는 권리의 영역을 설정함으로써 다수의 횡포를 방지하는 핵심적 안전장치이다. 사법 심사 제도는 다수결로 제정된 법률이라 하더라도 헌법에 위배될 경우 무효화할 수 있는 권한을 법원에 부여한다. 가중 다수결 제도는 헌법 개정과 같은 중대한 사안에 대해 단순 과반이 아닌 삼분의 이 이상의 동의를 요구함으로써 신중한 결정을 유도한다. 또한 숙의 민주주의는 투표에 앞서 충분한 토론과 정보 공유의 과정을 거칠 것을 강조하여, 다수결의 질을 높이고자 한다. 이처럼 성숙한 민주주의는 다수결을 맹목적으로 따르는 것이 아니라, 그 한계를 인식하고 보완하는 제도적 노력을 통해 더욱 견고해진다.'
    }
  ];

  const total = paragraphs.reduce((s, p) => s + p.text.length, 0);
  console.log(`Day 73 총 글자 수: ${total}`);

  const dayStr = '073';
  const subArea = 'NONFICTION';
  const content = assembleFull({
    dayIndex: 73,
    contentId: `dr-w1-${dayStr}`,
    subArea,
    title: `일일 독해(비트겐슈타인 1) Day 73 비문학`,
    paragraphs
  });
  return { dayIndex: 73, subArea, content, dayStr };
}

function buildDay74() {
  // Day 74 - 문학: 현대시 감상 - 김소월 진달래꽃의 이별의 미학
  const paragraphs = [
    {
      id: 'p1',
      text: '김소월의 진달래꽃은 이별이라는 보편적 주제를 한국적 정서로 빚어 낸 대표적인 서정시이다. 천구백이십이 년에 발표된 이 작품은 민요적 율격과 섬세한 감정 표현으로 한국 현대시의 정수로 평가받아 왔다. 이 시에서 화자는 떠나는 임을 붙잡지 않겠다고 말한다. 나 보기가 역겨워 가실 때에는이라는 첫 구절은 이별의 원인을 상대의 의지에 두면서도 그것을 원망 없이 수용하는 화자의 태도를 드러낸다. 말없이 고이 보내 드리겠다는 다짐은 격한 감정의 표출이 아닌 절제된 슬픔의 표현이며, 이러한 정서를 한국 문학에서는 한이라는 고유한 개념으로 설명해 왔다. 한은 단순한 슬픔이나 분노가 아니라, 억누른 감정이 내면에서 삭아 오히려 아름다움으로 승화되는 복합적 정서이다.'
    },
    {
      id: 'p2',
      text: '시의 중심부에 등장하는 영변 약산 진달래꽃이라는 이미지는 여러 겹의 의미를 품고 있다. 화자는 임이 가는 길에 진달래꽃을 한 아름 뿌리겠다고 말하는데, 이는 이별의 길을 축복으로 장식하겠다는 역설적 표현이다. 꽃을 뿌리는 행위는 전통적으로 축하와 환대의 의미를 지니지만, 여기서는 이별의 슬픔을 감추고 떠나는 사람에게 아름다운 기억만을 남기겠다는 화자의 숭고한 사랑을 상징한다. 진달래꽃은 봄마다 지천으로 피어나는 꽃으로서, 화자의 사랑 또한 계절처럼 순환하며 결코 사라지지 않을 것임을 암시하는 자연적 상관물이기도 하다. 영변이라는 구체적 지명의 사용은 이 시에 토속적 정감을 더하며 보편적 이별의 정서를 한국적 풍토 속에 뿌리내리게 한다.'
    },
    {
      id: 'p3',
      text: '시의 후반부에서 가시는 걸음걸음 놓인 꽃을 사뿐히 즈려밟고 가시옵소서라는 구절은 이 시의 정서적 절정을 이룬다. 꽃을 밟아 달라는 요청은 자신의 마음을 짓밟더라도 좋으니 편안히 떠나라는 의미를 담고 있으며, 이별의 고통을 기꺼이 감내하겠다는 자기 희생의 극단적 표현이다. 사뿐히라는 부사는 떠나는 임의 발걸음이 가볍기를 바라는 마음과 함께, 꽃잎 위를 걷는 가벼운 동작의 시각적 이미지를 불러일으킨다. 이러한 감각적 표현은 추상적인 이별의 감정을 구체적인 장면으로 전환시켜 독자의 공감을 이끌어 내는 효과를 지닌다.'
    },
    {
      id: 'p4',
      text: '마지막 연에서 화자는 죽어도 아니 눈물 흘리겠다고 선언한다. 이 선언은 앞선 연들에서 보여 준 절제와 수용의 태도가 최종적으로 도달하는 결의이다. 그러나 눈물을 흘리지 않겠다는 단호한 다짐 자체가 역설적으로 화자의 깊은 슬픔을 증명한다. 눈물을 참아야 할 만큼 슬프다는 사실이 이 부정의 이면에 놓여 있기 때문이다. 이러한 역설의 구조는 진달래꽃 전체를 관통하는 핵심 기법이며, 말하지 않음으로써 더 깊이 전달되는 한국적 서정의 정수를 보여 준다. 이 시는 칠오조의 민요적 율격을 바탕으로 하면서도 자유시의 형식을 취하여, 전통과 현대의 접점에서 새로운 시적 가능성을 열었다. 김소월은 이 시를 통해 이별이라는 아픔을 예술적 아름다움으로 전환하는 문학의 가능성을 탁월하게 구현하였다.'
    }
  ];

  const total = paragraphs.reduce((s, p) => s + p.text.length, 0);
  console.log(`Day 74 총 글자 수: ${total}`);

  const dayStr = '074';
  const subArea = 'LITERATURE';
  const content = assembleFull({
    dayIndex: 74,
    contentId: `dr-w1-${dayStr}`,
    subArea,
    title: `일일 독해(비트겐슈타인 1) Day 74 문학`,
    paragraphs
  });
  return { dayIndex: 74, subArea, content, dayStr };
}

function buildDay75() {
  // Day 75 - 비문학: 과학기술 - 재생 에너지와 에너지 전환
  const paragraphs = [
    {
      id: 'p1',
      text: '화석 연료에 의존해 온 인류의 에너지 체계가 근본적인 전환을 요구받고 있다. 석탄, 석유, 천연가스와 같은 화석 연료는 산업 혁명 이후 인류 문명의 핵심적 동력원이었으나, 연소 과정에서 배출되는 이산화탄소가 지구 온난화의 주요 원인으로 지목되면서 그 사용을 줄여야 한다는 국제적 합의가 형성되었다. 기후 변화로 인한 해수면 상승, 극단적 기상 현상의 빈발, 생태계의 교란 등은 이미 전 세계적으로 가시화되고 있다. 파리 협정은 지구 평균 기온 상승을 산업화 이전 대비 일점오 도 이내로 제한하는 것을 목표로 설정하였으며, 이를 달성하기 위해서는 에너지 생산 방식의 전면적인 재편이 불가피하다.'
    },
    {
      id: 'p2',
      text: '재생 에너지는 자연적으로 보충되는 에너지원을 활용하여 전력을 생산하는 방식이다. 태양광 발전은 태양 전지판이 빛에너지를 전기로 변환하는 기술로, 최근 이십 년간 발전 효율이 크게 향상되고 생산 비용이 급격히 하락하면서 가장 빠르게 성장하고 있는 재생 에너지원이다. 풍력 발전은 바람의 운동 에너지를 터빈으로 전환하는 방식으로, 해상 풍력 기술의 발전으로 더 강하고 안정적인 바람을 활용할 수 있게 되었다. 특히 해상 풍력 발전 단지는 육상보다 소음과 경관 훼손의 문제가 적다는 장점도 지닌다. 이 외에도 수력, 지열, 바이오매스 등 다양한 재생 에너지원이 지역적 특성에 맞게 활용되고 있다.'
    },
    {
      id: 'p3',
      text: '재생 에너지의 확대에는 기술적 과제가 수반된다. 가장 핵심적인 문제는 간헐성이다. 태양광은 낮에만, 풍력은 바람이 불 때만 전력을 생산할 수 있으므로, 전력 수요와 공급의 시간적 불일치가 발생한다. 특히 전력 소비가 집중되는 시간대에 발전량이 부족해지는 상황은 전력망의 안정성을 위협할 수 있다. 이를 해결하기 위해 에너지 저장 기술의 발전이 필수적이다. 리튬 이온 배터리를 활용한 대규모 에너지 저장 시스템이 상용화되고 있으며, 잉여 전력으로 물을 전기 분해하여 수소를 생산하는 그린 수소 기술도 유망한 대안으로 주목받고 있다. 또한 지능형 전력망인 스마트 그리드는 실시간 수요 예측과 분산 전원 관리를 통해 재생 에너지의 변동성을 효과적으로 조절하는 역할을 한다.'
    },
    {
      id: 'p4',
      text: '에너지 전환은 기술의 문제에 그치지 않고 사회적, 경제적 차원의 복합적인 과제를 수반한다. 화석 연료 산업에 종사하던 노동자들의 일자리 전환 문제는 정의로운 전환이라는 개념 아래 논의되고 있다. 석탄 발전소의 폐쇄가 지역 경제에 미치는 충격을 완화하기 위한 재교육 프로그램과 대체 산업 육성 정책이 필요하다. 독일의 탈석탄 정책 과정에서 광부들에 대한 체계적인 전직 지원이 이루어진 사례는 참고할 만한 선례로 꼽힌다. 또한 재생 에너지 설비의 설치를 위한 토지 이용과 지역 주민의 수용성 문제도 간과할 수 없다. 성공적인 에너지 전환은 기술 혁신과 사회적 합의가 조화를 이룰 때 비로소 실현될 수 있다.'
    }
  ];

  const total = paragraphs.reduce((s, p) => s + p.text.length, 0);
  console.log(`Day 75 총 글자 수: ${total}`);

  const dayStr = '075';
  const subArea = 'NONFICTION';
  const content = assembleFull({
    dayIndex: 75,
    contentId: `dr-w1-${dayStr}`,
    subArea,
    title: `일일 독해(비트겐슈타인 1) Day 75 비문학`,
    paragraphs
  });
  return { dayIndex: 75, subArea, content, dayStr };
}

// ========== 메인 실행 ==========

function main() {
  const ROOT = path.resolve(__dirname, '..');
  const batchPath = path.join(ROOT, 'generated', 'daily-batch-reading-wittgenstein1.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'wittgenstein1');

  // 배치 파일 읽기
  console.log('배치 파일 읽는 중...');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

  // Day 71~75 콘텐츠 생성
  const days = [
    buildDay71(),
    buildDay72(),
    buildDay73(),
    buildDay74(),
    buildDay75()
  ];

  let allValid = true;

  // 검증
  for (const day of days) {
    const paras = day.content.payload.passage.paragraphs;
    const totalChars = paras.reduce((s, p) => s + p.text.length, 0);
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
      allValid = false;
    }
    if (recallCards !== 8) {
      console.warn(`  [경고] 복기 카드 수 8장이 아님! (${recallCards}장)`);
      allValid = false;
    }
    if (confirmQs < 5 || confirmQs > 8) {
      console.warn(`  [경고] 확인 문항 수 범위 이탈! (${confirmQs}문항)`);
      allValid = false;
    }
  }

  if (!allValid) {
    console.warn('\n[경고] 일부 검증 실패가 있지만 파일을 생성합니다.');
  }

  // 배치 파일 업데이트 (items[70]~[74] 교체)
  console.log('\n배치 파일 업데이트 중...');
  for (let i = 0; i < 5; i++) {
    const day = days[i];
    const batchItem = wrapBatchItem(day.dayIndex, day.subArea, day.content);
    batch.items[70 + i] = batchItem;
  }
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf-8');
  console.log('배치 파일 저장 완료.');

  // static 파일 생성
  console.log('\nstatic 파일 생성 중...');
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
  }
  for (const day of days) {
    const staticPath = path.join(staticDir, `${day.dayStr}.json`);
    fs.writeFileSync(staticPath, JSON.stringify(day.content, null, 2), 'utf-8');
    console.log(`  ${day.dayStr}.json 저장 완료`);
  }

  console.log('\n모든 작업 완료!');
}

main();
