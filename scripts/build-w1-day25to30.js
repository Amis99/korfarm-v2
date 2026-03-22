/**
 * 비트겐슈타인1 Day 25~30 일일독해 콘텐츠 재생성 스크립트
 * - Day 25(비문학), 26(문학), 27(비문학), 28(문학), 29(비문학), 30(문학)
 * - 지문 4문단, 합계 1400±50자 (고등학교 수준)
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

function countTotalChars(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
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
      // 단어 중간에서 끊기지 않도록 공백 기준으로 조정
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

// 정독 타임라인 생성 (문장별 하이라이트 + 문단별 중심내용)
function buildIntensiveTimeline(paragraphs) {
  const timeline = [];
  let stepCount = 1;

  for (const para of paragraphs) {
    const sentences = findSentences(para.text);

    // 각 문장에 대해 하이라이트 + 질문
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

      // 문장 내용 질문
      const wrongChoices = shuffleArray(otherSentences).slice(0, 3).map((t, idx) => ({
        id: ['A','B','C','D'][idx + 1],
        text: t.length > 80 ? t.substring(0, 77) + '...' : t
      }));

      // 정답 위치 랜덤
      const answerPos = Math.floor(Math.random() * 4);
      const choiceIds = ['A','B','C','D'];
      const choices = [];
      let answerId = '';

      for (let ci = 0; ci < 4; ci++) {
        if (ci === answerPos) {
          choices.push({
            id: choiceIds[ci],
            text: sent.text.length > 80 ? sent.text.substring(0, 77) + '...' : sent.text
          });
          answerId = choiceIds[ci];
        } else {
          const wrongIdx = ci > answerPos ? ci - 1 : ci;
          if (wrongIdx < wrongChoices.length) {
            choices.push({
              id: choiceIds[ci],
              text: wrongChoices[wrongIdx].text
            });
          }
        }
      }

      // choices가 4개 미만이면 보충
      while (choices.length < 4) {
        choices.push({
          id: choiceIds[choices.length],
          text: `이 문장은 지문에 포함되지 않은 내용이다.`
        });
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
          choices: choices,
          answerId: answerId,
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

    // 중심내용 정답: 첫 문장 또는 가장 핵심적 문장
    const centerSent = paraSentences[0];
    const wrongCenter = shuffleArray(otherParaSentences).slice(0, 3);
    const centerAnswerPos = Math.floor(Math.random() * 4);
    const centerChoices = [];
    let centerAnswerId = '';
    const cIds = ['A','B','C','D'];
    let wrongIdx2 = 0;

    for (let ci = 0; ci < 4; ci++) {
      if (ci === centerAnswerPos) {
        centerChoices.push({
          id: cIds[ci],
          text: centerSent.text.length > 80 ? centerSent.text.substring(0, 77) + '...' : centerSent.text
        });
        centerAnswerId = cIds[ci];
      } else {
        if (wrongIdx2 < wrongCenter.length) {
          const t = wrongCenter[wrongIdx2];
          centerChoices.push({
            id: cIds[ci],
            text: t.length > 80 ? t.substring(0, 77) + '...' : t
          });
          wrongIdx2++;
        } else {
          centerChoices.push({
            id: cIds[ci],
            text: '이 문단의 내용과 관련 없는 선택지이다.'
          });
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

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 확인 문제 생성 (질문형, 5~8문항)
function buildConfirmQuestions(paragraphs) {
  const questions = [];
  const allSentences = [];

  for (const para of paragraphs) {
    const sents = findSentences(para.text);
    for (const s of sents) {
      allSentences.push({ ...s, pid: para.id });
    }
  }

  // 핵심 개념/용어 추출 (문장에서 핵심 구절을 뽑아 질문 생성)
  const questionTemplates = [];

  for (const para of paragraphs) {
    const sents = findSentences(para.text);
    for (const s of sents) {
      // 주요 개념어 추출 (3글자 이상 명사구)
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

  // 질문 템플릿 셔플 후 6개 선택
  const selected = shuffleArray(questionTemplates).slice(0, 6);

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
  // 주요 개념어 패턴 추출
  const concepts = [];
  // 따옴표 안의 용어
  const quoted = sentence.match(/'[^']+'/g);
  if (quoted) {
    for (const q of quoted) {
      const clean = q.replace(/'/g, '');
      if (clean.length >= 2 && clean.length <= 15) concepts.push(clean);
    }
  }
  // 한자어/전문용어 패턴 (명사형 어미로 끝나는 3~8글자 한글 단어)
  const terms = sentence.match(/[가-힣]{3,8}(?=은 |는 |이 |가 |을 |를 |의 |에 |로 |와 |과 |도 |라 |라고)/g);
  if (terms) {
    for (const t of terms) {
      // 용언 어간(~하, ~되, ~지, ~며) 제외, 명사만 허용
      if (!concepts.includes(t) && t.length >= 3 && !/[하되지며으]$/.test(t)) {
        concepts.push(t);
      }
    }
  }
  // 전문 용어 패턴 추가 (OO론, OO주의, OO학, OO설 등)
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
  return templates[Math.floor(Math.random() * templates.length)];
}

// ========== 콘텐츠 정의 ==========

function buildDay25() {
  // Day 25 - 비문학 (NONFICTION): 인지과학 - 인공지능과 인간 사고의 차이
  const paragraphs = [
    {
      id: 'p1',
      text: '인공지능의 발전과 함께 기계가 인간처럼 사고할 수 있는가에 대한 논의가 활발해지고 있다. 전통적인 인공지능 연구에서는 인간의 사고를 기호 조작의 과정으로 이해하였다. 이러한 관점에서 인간의 뇌는 일종의 정보 처리 장치이며, 사고란 기호로 표현된 명제를 논리적 규칙에 따라 변환하는 과정으로 설명된다. 기호주의적 인공지능은 이러한 전제를 바탕으로, 인간의 추론 과정을 논리적 규칙의 집합으로 프로그래밍하여 지능을 구현하고자 하였다. 이 접근법은 체스와 같이 명확한 규칙이 존재하는 닫힌 영역에서는 상당한 성과를 거두었으나, 상식적 판단이나 맥락 의존적 이해와 같은 인간 특유의 인지 능력을 재현하는 데에는 뚜렷한 한계를 보였다.'
    },
    {
      id: 'p2',
      text: '이러한 한계를 극복하기 위해 등장한 것이 연결주의적 접근이다. 연결주의는 인간의 뇌를 수많은 뉴런의 연결망으로 파악하고, 지능이란 이 연결망의 활성화 패턴에서 창발하는 것이라 본다. 신경망 모델은 개별 뉴런에 해당하는 노드들이 가중치를 지닌 연결로 이어져 있으며, 대량의 데이터를 통해 이 가중치를 조정함으로써 학습이 이루어진다. 특히 심층 학습이라 불리는 다층 신경망 기법의 발전으로, 이미지 인식이나 자연어 처리 같은 영역에서 놀라운 성과를 거두었다. 그러나 연결주의 모델은 왜 특정한 결론에 도달했는지를 설명하기 어려운 블랙박스 문제를 안고 있으며, 학습 데이터의 편향이 결과에 그대로 반영될 수 있다는 한계도 존재한다.'
    },
    {
      id: 'p3',
      text: '기호주의와 연결주의의 한계를 종합적으로 고려할 때, 인간의 사고가 단순히 하나의 원리로 환원될 수 없다는 점이 분명해진다. 인간은 논리적 추론과 직관적 판단을 상황에 따라 유연하게 전환하며, 감정과 경험이 사고 과정에 깊이 개입한다. 이러한 복합적 특성을 설명하기 위해 대두된 것이 체화된 인지 이론이다. 체화된 인지 이론에 따르면 사고는 뇌 내부의 추상적 연산이 아니라, 몸과 환경의 상호작용 속에서 형성되는 것이다. 걷는 행위를 통해 공간을 이해하고, 손으로 물건을 다루면서 인과 관계를 체득하며, 타인의 표정을 읽으며 감정을 파악하는 것이 그 예이다.'
    },
    {
      id: 'p4',
      text: '체화된 인지 이론의 관점에서 보면, 현재의 인공지능은 근본적인 제약을 지니고 있다. 인공지능은 방대한 데이터를 처리할 수 있지만, 신체적 경험이 결여되어 있으므로 인간과 동일한 방식으로 세계를 이해할 수 없다. 예를 들어 인공지능은 무거움이라는 단어의 의미를 통계적으로 학습할 수 있으나, 실제로 무거운 물체를 들어 본 경험이 없기에 그 의미를 체감적으로 이해하지는 못한다. 뜨거움이나 차가움과 같은 감각적 개념도 마찬가지이다. 이러한 논의는 인공지능의 발전 방향에 중요한 시사점을 제공한다. 단순한 연산 능력의 향상이 아니라, 환경과 상호작용하는 로봇 공학과의 융합이 인간 수준의 지능에 더 가까이 다가가는 길이 될 수 있기 때문이다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 25 총 글자 수: ${total}`);

  return buildContent({
    dayIndex: 25,
    contentId: 'dr-w1-025',
    subArea: 'NONFICTION',
    title: '일일 독해(비트겐슈타인 1) Day 25 비문학',
    paragraphs
  });
}

function buildDay26() {
  // Day 26 - 문학 (LITERATURE): 현대 소설 - 고향에 대한 기억과 상실
  const paragraphs = [
    {
      id: 'p1',
      text: '기차가 역에 멈추자 차창 밖으로 낯선 풍경이 펼쳐졌다. 삼십 년 만에 돌아온 고향이었지만 그의 눈에 비친 것은 기억 속 마을이 아니었다. 논두렁 사이로 나 있던 오솔길은 아스팔트 도로에 묻혀 사라졌고, 마을 어귀의 느티나무는 흔적도 없이 베어져 있었다. 그는 역 앞에 서서 한참 동안 주위를 둘러보았으나 발길을 옮길 곳이 어디인지 알 수 없었다. 어린 시절 뛰놀던 공터에는 높은 아파트 단지가 빼곡하게 들어서 있었고, 할머니 댁으로 향하던 좁은 골목은 대형 주차장이 되어 있었다. 냇가에서 가재를 잡던 개울조차 복개되어 도로 아래에 갇혀 버린 듯했다.'
    },
    {
      id: 'p2',
      text: '그는 마을 뒷산 쪽으로 걸음을 옮겼다. 산자락에 오르자 비로소 익숙한 냄새가 코끝을 스쳤다. 소나무 사이로 부는 바람은 예전 그대로였고, 발밑에서 바스락거리는 낙엽 소리도 기억 속의 것과 다르지 않았다. 그는 어릴 때 아버지와 함께 올랐던 그 길을 한 발 한 발 더듬어 올라갔다. 그러나 산 중턱에서 아래로 눈을 돌리자 풍경은 다시 달라졌다. 시멘트 지붕이 빼곡하게 들어선 마을은 그가 알던 초가지붕의 정경과 전혀 달랐다. 들판을 가로지르던 실개천은 보이지 않았고, 그 자리에는 공장 건물이 길게 늘어서 있었다. 그는 바위에 걸터앉아 먼 산등성이를 바라보며, 자기가 돌아온 곳이 정말 고향이 맞는지 스스로에게 되물었다.'
    },
    {
      id: 'p3',
      text: '산을 내려오는 길에 그는 동네 구멍가게 자리를 지나쳤다. 편의점으로 바뀐 그곳에서 한 노인이 나오고 있었다. 그 노인의 얼굴에서 문득 어릴 적 함께 개울에서 물고기를 잡던 영수의 모습이 겹쳐 보였다. 그가 조심스럽게 이름을 불러 보자 노인은 멈칫하더니 그를 알아보았다. 두 사람은 편의점 앞 벤치에 나란히 앉아 오래된 시간을 더듬으며 이야기를 나누었다. 영수는 마을 사람 대부분이 일자리를 찾아 도시로 떠났고, 남아 있는 사람은 손에 꼽을 정도라고 말했다. 학교도 학생이 없어 십여 년 전에 문을 닫았고, 젊은이라고는 편의점 아르바이트생 하나뿐이라는 말에 그는 아무 대꾸도 할 수 없었다. 영수의 말에는 아쉬움보다 체념이 짙게 배어 있었다.'
    },
    {
      id: 'p4',
      text: '해가 기울 무렵 그는 다시 역으로 향했다. 돌아가는 기차를 기다리며 그는 품속에서 오래된 사진 한 장을 꺼내 들었다. 사진 속에는 웃고 있는 어린 자신과 가족들, 그리고 마당 한쪽의 감나무가 찍혀 있었다. 사진 속 풍경은 더 이상 현실 어디에도 남아 있지 않았지만, 그의 기억 안에서만큼은 여전히 선명하게 살아 있었다. 기차가 들어오자 그는 사진을 다시 가슴 안쪽에 넣었다. 창문에 비친 자신의 얼굴 위로 사라져 가는 역사의 불빛이 포개지고 있었다. 기차가 속도를 내자 역 주변의 풍경이 빠르게 뒤로 물러났다. 그는 고향이라는 것이 발을 딛는 땅이 아니라 마음속에 간직하는 시간이라는 것을 비로소 깨달았다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 26 총 글자 수: ${total}`);

  return buildContent({
    dayIndex: 26,
    contentId: 'dr-w1-026',
    subArea: 'LITERATURE',
    title: '일일 독해(비트겐슈타인 1) Day 26 문학',
    paragraphs
  });
}

function buildDay27() {
  // Day 27 - 비문학 (NONFICTION): 경제학 - 행동경제학과 합리적 선택
  const paragraphs = [
    {
      id: 'p1',
      text: '전통 경제학에서는 인간을 합리적인 경제 주체로 전제한다. 합리적 경제 주체란 주어진 정보를 완전하게 처리하여 자신의 효용을 극대화하는 방향으로 의사 결정을 내리는 존재를 의미한다. 이러한 전제 아래에서 시장은 개인들의 합리적 선택이 모여 효율적 균형에 도달하게 된다. 그러나 현실에서 인간의 의사 결정은 이 이론적 모형과 상당한 차이를 보인다. 사람들은 동일한 정보를 접하더라도 그것이 제시되는 방식에 따라 전혀 다른 선택을 하기도 하며, 장기적으로 손해가 되는 선택을 습관적으로 반복하기도 한다. 이러한 현상은 인간이 언제나 합리적이라는 전통 경제학의 기본 가정에 의문을 제기하게 만들었다.'
    },
    {
      id: 'p2',
      text: '행동경제학은 이러한 비합리적 행동의 체계적인 패턴을 연구하는 분야이다. 대니얼 카너먼과 아모스 트버스키는 전망 이론을 통해 인간이 이득과 손실을 비대칭적으로 인식한다는 사실을 밝혔다. 같은 크기의 이득과 손실이 주어질 때, 사람들은 손실에서 느끼는 고통이 이득에서 느끼는 만족보다 약 두 배 크다고 보고하였다. 이를 손실 회피 편향이라 한다. 손실 회피 편향은 투자자가 손실이 발생한 주식을 적절한 시점에 매도하지 못하고 오래 보유하는 현상이나, 이미 지출한 비용에 집착하여 불리한 사업을 지속하는 매몰 비용 효과 등으로 나타난다. 이 편향은 개인의 재무 의사 결정뿐 아니라 기업 경영 전반에도 광범위한 영향을 미친다.'
    },
    {
      id: 'p3',
      text: '또 다른 주요 개념으로 프레이밍 효과가 있다. 프레이밍 효과란 동일한 정보라도 그것을 표현하는 틀이 달라지면 사람들의 판단과 선택이 달라지는 현상을 가리킨다. 예를 들어 수술의 성공률이 구십 퍼센트라고 말할 때와 사망률이 십 퍼센트라고 말할 때, 두 표현은 논리적으로 동일한 정보를 전달하지만 사람들의 수술 동의율은 전자의 경우에 훨씬 높게 나타난다. 이러한 현상은 인간의 의사 결정이 정보의 객관적 내용만이 아니라 그것이 제시되는 맥락과 표현 방식에 크게 의존함을 보여 준다. 광고나 마케팅 분야에서 프레이밍 효과는 소비자의 구매 행동을 유도하는 핵심 전략으로 널리 활용되고 있다.'
    },
    {
      id: 'p4',
      text: '행동경제학의 연구 결과는 현실의 공공 정책 설계에도 적극적으로 활용되고 있다. 리처드 탈러는 넛지라는 개념을 제시하였는데, 이는 사람들의 선택을 강제하지 않으면서도 더 나은 방향으로 유도하는 부드러운 개입을 의미한다. 자동 가입 방식의 연금 제도가 대표적인 사례이다. 별도의 신청 없이 자동으로 연금에 가입되도록 기본값을 설정하면, 가입률이 크게 높아져 노후 대비가 강화된다. 넛지는 개인의 자율성을 침해하지 않으면서도 사회적으로 바람직한 결과를 이끌어 낸다는 점에서 자유주의적 개입주의라 불리기도 한다. 이처럼 행동경제학은 인간 행동에 대한 현실적 이해를 바탕으로 경제 이론과 공공 정책의 새로운 지평을 열어 가고 있다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 27 총 글자 수: ${total}`);

  return buildContent({
    dayIndex: 27,
    contentId: 'dr-w1-027',
    subArea: 'NONFICTION',
    title: '일일 독해(비트겐슈타인 1) Day 27 비문학',
    paragraphs
  });
}

function buildDay28() {
  // Day 28 - 문학 (LITERATURE): 현대시 감상 평론 형식
  const paragraphs = [
    {
      id: 'p1',
      text: '윤동주의 시 세계는 자기 성찰과 부끄러움의 미학으로 요약할 수 있다. 일제 강점기라는 암울한 시대에 그는 조용하면서도 단단한 내면의 목소리로 시를 썼다. 그의 대표작 서시에서 화자는 죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를 다짐한다. 이 다짐은 단순한 도덕적 선언이 아니라 식민지 시대를 살아가는 지식인으로서의 깊은 자기 반성에서 비롯된 것이다. 화자는 별을 세며 미래를 향한 희망을 품되, 현실에서 무력할 수밖에 없는 자신에 대한 괴로움을 동시에 안고 있다. 이러한 이중적 감정이 윤동주 시의 핵심적 긴장을 형성하며, 그의 작품이 단순한 서정시를 넘어서는 깊이를 갖게 하는 원동력이 된다.'
    },
    {
      id: 'p2',
      text: '자화상에서 이러한 긴장은 더욱 구체적인 형태로 드러난다. 화자가 우물 속에 비친 자신의 모습을 들여다보는 행위는 외면의 관찰이 아니라 내면의 탐색을 상징한다. 우물이라는 좁고 깊은 공간은 자아 탐구의 어둡고 고독한 과정을 암시하는 시적 장치이기도 하다. 우물 속의 사나이는 화자 자신이면서 동시에 화자가 되고자 하는 이상적 자아이기도 하다. 그러나 화자는 그 사나이가 미워진다고 고백하는데, 이는 현실 속의 자아가 이상에 미치지 못한다는 자각에서 오는 뼈아픈 감정이다. 곧이어 그 사나이가 가엾어진다고 말하는 것은 미움을 넘어 자기 연민과 화해의 가능성을 보여 주는 것이다.'
    },
    {
      id: 'p3',
      text: '별 헤는 밤은 이러한 성찰의 범위를 개인에서 공동체로 확장한다. 화자는 밤하늘의 별 하나하나에 어머니, 소학교 시절의 벗, 이국 소녀, 그리고 이미 세상을 떠난 시인 등 소중한 이름을 부여한다. 이 이름 부르기의 행위는 소중한 기억을 통해 잃어버린 것들과 다시 연결되려는 간절한 시도이다. 별에 이름을 새기는 것은 소멸하는 것들에게 영원성을 부여하려는 소망의 표현이기도 하다. 동시에 화자는 자신의 이름을 별 하나에 써 놓았다가 그것이 쉬이 잊혀질 것을 알고 있다. 이러한 인식은 망각에 대한 두려움이자, 역사 속에서 사라져 가는 존재들에 대한 깊은 애도이기도 하다.'
    },
    {
      id: 'p4',
      text: '윤동주 시의 문학사적 의의는 저항의 독특한 방식에 있다. 그의 시에는 직접적인 구호나 격렬한 투쟁의 언어가 전혀 등장하지 않는다. 대신 자기 자신을 끊임없이 돌아보며 부끄러움을 감수하는 내면의 치열함이 곧 시대에 대한 저항이 된다. 이는 외적 행동이 극도로 제약된 식민지 상황에서 양심을 지키는 것 자체가 하나의 투쟁이었음을 의미한다. 윤동주의 시는 개인적 고백이 역사적 증언이 되는 독특한 지점을 보여 준다. 그의 시가 해방 이후 수십 년이 지난 오늘날에도 깊은 울림을 주는 것은, 자기 성찰을 통해 세계와 대면하려는 그 태도가 시대를 초월한 보편적 가치를 지니기 때문이다. 부끄러움을 아는 양심이야말로 어떤 시대에서든 인간다움의 근본이라는 그의 메시지는 여전히 유효하다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 28 총 글자 수: ${total}`);

  return buildContent({
    dayIndex: 28,
    contentId: 'dr-w1-028',
    subArea: 'LITERATURE',
    title: '일일 독해(비트겐슈타인 1) Day 28 문학',
    paragraphs
  });
}

function buildDay29() {
  // Day 29 - 비문학 (NONFICTION): 과학 - 유전자 가위 기술과 생명 윤리
  const paragraphs = [
    {
      id: 'p1',
      text: '유전자 가위 기술은 생명체의 유전 정보를 정밀하게 편집할 수 있는 도구로서 생명과학 분야에 혁신을 가져왔다. 유전자 가위란 특정 유전자 서열을 인식하여 그 부위를 절단하고 교정하는 단백질 기반의 도구를 말한다. 초기에는 징크 핑거 뉴클레이스나 탈렌 같은 기술이 사용되었으나, 이들은 제작 과정이 복잡하고 비용이 높다는 단점이 있었다. 이러한 한계를 획기적으로 극복한 것이 크리스퍼 유전자 가위 기술이다. 크리스퍼는 가이드 RNA를 이용하여 원하는 유전자 위치를 정확히 찾아가므로, 기존 기술보다 훨씬 간편하고 효율적으로 유전자를 편집할 수 있다. 이 기술의 개발로 제니퍼 다우드나와 에마뉘엘 샤르팡티에는 노벨 화학상을 수상하기도 하였다.'
    },
    {
      id: 'p2',
      text: '크리스퍼 기술의 의학적 활용 가능성은 매우 넓다. 낫 모양 적혈구 빈혈증이나 헌팅턴병과 같은 단일 유전자 돌연변이로 인한 질환은 크리스퍼를 통해 원인 유전자를 교정함으로써 근본적인 치료가 기대된다. 기존의 치료법이 증상을 완화하는 데 그쳤다면, 유전자 편집은 질병의 원인 자체를 제거한다는 점에서 획기적이다. 실제로 일부 유전 질환에 대해서는 임상 시험이 진행 중이며, 치료 효과에 대한 고무적인 결과가 보고되고 있다. 또한 암세포만을 표적으로 공격하도록 면역 세포의 유전자를 변형하는 연구도 활발하게 이루어지고 있다. 이러한 연구가 성과를 거둘 경우, 기존의 항암 치료가 지닌 부작용을 크게 줄이면서도 치료 효과를 높일 수 있을 것으로 기대된다.'
    },
    {
      id: 'p3',
      text: '그러나 유전자 편집 기술의 발전은 심각한 윤리적 문제를 수반한다. 가장 큰 논란은 인간 배아의 유전자 편집에 관한 것이다. 체세포에 대한 유전자 교정은 해당 개인에게만 영향을 미치지만, 배아 단계에서의 편집은 그 변화가 후손에게까지 유전된다. 이는 특정 형질을 선택적으로 강화하는 맞춤형 아기의 출현 가능성을 열어 두게 되며, 이러한 기술이 외모나 지능 등의 유전적 특성을 인위적으로 조작하는 데 사용될 수 있다는 우려가 제기되고 있다. 또한 유전적 다양성이 축소되면 종의 환경 적응력이 약화될 수 있다는 생태학적 경고도 간과할 수 없는 문제이다.'
    },
    {
      id: 'p4',
      text: '이러한 상황에서 국제 사회는 유전자 편집 기술에 대한 규제 체계를 마련하기 위해 노력하고 있다. 대부분의 국가에서는 생식 세포 편집을 법적으로 금지하거나 엄격하게 제한하고 있으며, 연구 목적의 편집에 대해서도 윤리 위원회의 심의를 반드시 거치도록 규정하고 있다. 그러나 기술의 발전 속도가 규제의 정비 속도를 앞지르는 현실에서, 국제적으로 통일된 기준의 부재는 규제의 사각지대를 만들 수 있다. 실제로 일부 국가에서는 규제가 미비한 틈을 이용한 연구가 논란을 일으킨 사례도 있었다. 과학자 공동체 내에서도 자율적인 윤리 기준의 확립이 필요하다는 목소리가 높아지고 있다. 따라서 과학적 가능성과 윤리적 한계 사이에서 균형 잡힌 논의를 지속하는 것이 무엇보다 중요하다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 29 총 글자 수: ${total}`);

  return buildContent({
    dayIndex: 29,
    contentId: 'dr-w1-029',
    subArea: 'NONFICTION',
    title: '일일 독해(비트겐슈타인 1) Day 29 비문학',
    paragraphs
  });
}

function buildDay30() {
  // Day 30 - 문학 (LITERATURE): 고전 소설 해설 - 홍길동전의 사회 비판
  const paragraphs = [
    {
      id: 'p1',
      text: '허균의 홍길동전은 조선 시대의 신분 질서에 대한 근본적인 문제를 제기한 작품으로 평가된다. 주인공 홍길동은 홍판서의 아들이지만 천첩 소생이라는 이유로 아버지를 아버지라 부르지 못하고 형을 형이라 부르지 못하는 처지에 놓인다. 이 설정은 당대의 적서 차별이라는 사회 제도가 한 개인의 존엄을 어떻게 근본적으로 훼손하는지를 구체적으로 보여 준다. 길동은 문무에 걸쳐 뛰어난 재능을 지녔음에도 불구하고 출생의 한계로 인해 과거에 응시할 수조차 없었다. 그의 고뇌는 단순한 개인적 불만이 아니라 불합리한 신분 제도 자체에 대한 근본적인 항의의 성격을 지닌다.'
    },
    {
      id: 'p2',
      text: '길동이 집을 떠나 활빈당의 수령이 되는 과정은 사회 변혁의 서사로 읽힌다. 활빈당이라는 이름 자체가 가난한 백성을 구제하겠다는 뜻을 담고 있어, 길동의 행동은 사적 복수가 아니라 공적 정의의 실현을 지향하고 있음을 알 수 있다. 길동은 부패한 관리의 재물을 빼앗아 가난한 빈민에게 나누어 주는데, 이는 조선 후기 사회에서 실제로 빈번했던 민란의 정서를 반영한 것이기도 하다. 탐관오리의 부정축재를 응징하는 그의 행위는 백성들의 대리 만족을 충족시키는 동시에 사회 정의에 대한 열망을 표현한다. 작품 속에서 길동의 도술은 현실적 제약을 초월하게 하는 서사적 장치로서, 신분제의 벽을 상징적으로 허무는 기능을 수행한다.'
    },
    {
      id: 'p3',
      text: '홍길동전의 결말에서 길동은 율도국이라는 이상 국가를 건설하여 스스로 왕이 된다. 이 결말은 조선의 현실 안에서는 신분 차별의 극복이 불가능하다는 작가의 인식을 보여 주는 동시에, 평등한 사회에 대한 이상을 투영한 것이기도 하다. 율도국은 능력에 따라 지위가 주어지는 사회로 그려지며, 이는 혈통이 아닌 실력에 기반한 인재 등용의 이념을 담고 있다. 그곳에서는 출신 성분에 관계없이 재능 있는 자가 등용되고, 백성이 고르게 풍요를 누린다. 그러나 이 이상 국가가 조선 땅이 아닌 먼 바다 건너의 공간에 설정되어 있다는 점은 당대 조선 사회의 변혁 가능성에 대한 비관적 시각을 동시에 드러내는 것이라 볼 수 있다.'
    },
    {
      id: 'p4',
      text: '홍길동전은 문학사적으로 최초의 한글 소설이라는 위상을 지닌다. 한문이 아닌 한글로 창작되었다는 것 자체가 지식과 이야기를 소수의 사대부가 아닌 일반 백성과 나누겠다는 의지의 표현이다. 한글의 사용은 독자층의 폭발적 확대를 가능하게 하여 문학의 사회적 영향력을 넓히는 데 크게 기여하였다. 또한 이 작품은 영웅 소설의 전형적 구조를 따르면서도, 그 영웅이 기존 질서를 수호하는 것이 아니라 기존 질서에 정면으로 저항한다는 점에서 독특한 위치를 차지한다. 이러한 특성은 조선 후기에 출현하는 사회 비판적 문학의 선구적 사례로서 홍길동전의 문학사적 가치를 높여 주며, 이후의 판소리계 소설이나 사회 소설의 발전에도 영향을 미친 것으로 평가된다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 30 총 글자 수: ${total}`);

  return buildContent({
    dayIndex: 30,
    contentId: 'dr-w1-030',
    subArea: 'LITERATURE',
    title: '일일 독해(비트겐슈타인 1) Day 30 문학',
    paragraphs
  });
}

// ========== 콘텐츠 빌더 ==========

function buildContent({ dayIndex, contentId, subArea, title, paragraphs }) {
  const intensive = buildIntensiveTimeline(paragraphs);
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

// ========== 메인 실행 ==========

function main() {
  const ROOT = path.resolve(__dirname, '..');
  const batchPath = path.join(ROOT, 'generated', 'daily-batch-reading-wittgenstein1.json');
  const staticDir = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'wittgenstein1');

  // 배치 파일 읽기
  console.log('배치 파일 읽는 중...');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

  // Day 25~30 콘텐츠 생성
  const days = [
    buildDay25(),
    buildDay26(),
    buildDay27(),
    buildDay28(),
    buildDay29(),
    buildDay30()
  ];

  // 검증
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

    if (totalChars < 1350 || totalChars > 1450) {
      console.warn(`  ⚠ 글자 수 범위 이탈!`);
    }
    if (recallCards !== 8) {
      console.warn(`  ⚠ 복기 카드 수 8장이 아님!`);
    }
    if (confirmQs < 5 || confirmQs > 8) {
      console.warn(`  ⚠ 확인 문항 수 범위 이탈!`);
    }
  }

  // 배치 파일 업데이트 (items[24]~[29] 교체)
  console.log('\n배치 파일 업데이트 중...');
  for (let i = 0; i < 6; i++) {
    batch.items[24 + i] = days[i];
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
