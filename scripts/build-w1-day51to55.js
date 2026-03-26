#!/usr/bin/env node
/**
 * 비트겐슈타인1 Day 51~55 일일독해 콘텐츠 빌드 스크립트
 * - Day 51(비문학), 52(문학), 53(비문학), 54(문학), 55(비문학)
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

function countTotalChars(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

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

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildIntensiveTimeline(paragraphs) {
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

      const wrongChoices = shuffleArray(otherSentences).slice(0, 3).map((t, idx) => ({
        id: ['A','B','C','D'][idx + 1],
        text: t.length > 80 ? t.substring(0, 77) + '...' : t
      }));

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

      while (choices.length < 4) {
        choices.push({
          id: choiceIds[choices.length],
          text: '이 문장은 지문에 포함되지 않은 내용이다.'
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
  return templates[Math.floor(Math.random() * templates.length)];
}

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

  const selected = shuffleArray(questionTemplates).slice(0, 6);

  const questions = [];
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

// ========== 콘텐츠 정의 ==========

function buildDay51() {
  // Day 51 - 비문학 (NONFICTION): 사회과학 - 도시화와 공동체의 변화
  const paragraphs = [
    {
      id: 'p1',
      text: '산업화 이후 전 세계적으로 도시화가 빠르게 진행되면서 인간의 삶의 방식에도 근본적인 변화가 일어났다. 도시화란 농촌 인구가 도시로 이동하고 도시 지역이 확대되는 현상을 말한다. 산업 혁명 이전에는 대부분의 사람들이 농촌에서 자급자족적인 생활을 영위하였으나, 공장과 기업이 도시에 집중되면서 일자리를 찾아 대규모 인구 이동이 발생하였다. 이러한 과정에서 전통적인 마을 공동체는 점차 해체되었고, 혈연과 지연에 기반한 유대 관계는 약화되기 시작하였다. 오늘날 전 세계 인구의 절반 이상이 도시에 거주하고 있으며, 이 비율은 앞으로도 계속 증가할 것으로 전망된다. 특히 개발도상국에서는 급속한 도시화로 인해 주거, 교통, 환경 등 다양한 사회 문제가 동시에 발생하고 있어 이에 대한 체계적 대응이 시급한 과제로 부각되고 있다.'
    },
    {
      id: 'p2',
      text: '독일의 사회학자 페르디난트 퇴니스는 공동사회와 이익사회라는 개념을 통해 이러한 변화를 설명하였다. 공동사회란 가족이나 마을처럼 자연적 유대에 기초하여 구성원들이 정서적 유대감을 공유하는 집단을 의미한다. 반면 이익사회란 계약이나 이해관계에 기반하여 특정 목적을 달성하기 위해 인위적으로 구성된 집단을 가리킨다. 퇴니스는 근대화가 진행될수록 공동사회적 관계가 약화되고 이익사회적 관계가 지배적이 된다고 보았다. 이러한 변화 속에서 개인은 더 많은 자유와 선택의 기회를 얻게 되지만, 동시에 소속감의 상실과 고립감이라는 새로운 문제에 직면하게 된다.'
    },
    {
      id: 'p3',
      text: '도시화에 따른 공동체의 변화는 현대 사회에서 다양한 양상으로 나타나고 있다. 대도시에서는 같은 아파트에 살면서도 이웃의 얼굴을 모르는 경우가 흔하며, 사회적 관계가 주로 직장이나 온라인 공간에서 형성되는 경향이 강해지고 있다. 특히 정보 기술의 발달로 등장한 온라인 공동체는 물리적 거리에 구애받지 않고 공통의 관심사를 가진 사람들을 연결하는 새로운 형태의 유대를 제공한다. 그러나 이러한 온라인 관계는 대면 접촉이 부족하여 깊은 정서적 교류가 어렵다는 한계를 지닌다. 실제로 여러 연구에서 사회적 고립감과 외로움이 현대 도시 거주자들의 정신 건강에 부정적인 영향을 미치고 있음이 보고되고 있다.'
    },
    {
      id: 'p4',
      text: '이러한 문제를 해결하기 위해 최근에는 새로운 형태의 공동체를 모색하려는 움직임이 활발해지고 있다. 공유 주거, 마을 만들기 사업, 지역 화폐 운동 등은 도시 안에서 공동체적 유대를 회복하려는 대표적인 시도이다. 공유 주거는 개인의 독립적 생활 공간을 보장하면서도 공용 공간에서 자연스러운 교류가 이루어지도록 설계된 주거 형태를 말한다. 마을 만들기 사업은 주민들이 직접 참여하여 지역의 문제를 해결하고 공동의 가치를 만들어 가는 활동이다. 이러한 시도들은 전통적 공동체로의 회귀가 아니라, 개인의 자율성을 존중하면서도 상호 돌봄과 연대가 가능한 새로운 관계를 구축하려는 노력이라는 점에서 의의가 있다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 51 총 글자 수: ${total}`);

  return buildContent({
    dayIndex: 51,
    contentId: 'dr-w1-051',
    subArea: 'NONFICTION',
    title: '일일 독해(비트겐슈타인 1) Day 51 비문학',
    paragraphs
  });
}

function buildDay52() {
  // Day 52 - 문학 (LITERATURE): 현대 소설 - 어머니의 손
  const paragraphs = [
    {
      id: 'p1',
      text: '명절이 가까워지자 어머니에게서 전화가 왔다. 올해도 바쁘면 안 와도 된다는 말씀이었지만, 그 말 뒤에 숨은 기대를 모르지 않았다. 나는 사흘간의 휴가를 내고 고향으로 향했다. 고속버스에 올라 창밖을 바라보니 도시의 높은 건물들이 점차 낮은 산등성이와 들판으로 바뀌어 가는 것이 눈에 들어왔다. 오랜만에 본 어머니는 더 작아진 것 같았다. 허리가 좀 더 굽었고, 머리카락 사이사이로 흰 것이 성하게 늘어 있었다. 그러나 나를 맞이하는 얼굴에는 여전히 환한 미소가 번지고 있었다. 어머니는 나를 보자마자 부엌으로 향하며 금방 밥 차려 줄 테니 앉아 있으라고 하셨다. 방 안에는 이미 과일이 깎여 있었고, 내가 좋아하는 약과가 접시에 담겨 있었다.'
    },
    {
      id: 'p2',
      text: '저녁 무렵 나는 부엌에서 일하는 어머니의 뒷모습을 바라보았다. 능숙하게 칼질을 하고 양념을 버무리는 어머니의 손은 기억 속의 그 손이 아니었다. 관절마다 마디가 굵어져 있었고, 손등에는 깊은 주름이 겹겹이 새겨져 있었다. 오른손 검지에는 오래전 칼에 베인 흉터가 희미하게 남아 있었는데, 내가 초등학교에 다닐 무렵 도시락 반찬을 만들다 다친 것이라고 했던 기억이 떠올랐다. 그 작고 투박한 손으로 어머니는 평생 밥을 짓고 빨래를 하고 밭을 일구어 왔다. 그 손이 쉰 날은 거의 없었을 것이다. 나는 그 손을 바라보며 코끝이 찡해지는 것을 느꼈다.'
    },
    {
      id: 'p3',
      text: '밤이 깊어지자 어머니와 마주 앉아 차를 마셨다. 어머니는 마을 소식을 전하며 이웃집 아들이 결혼을 했다느니, 앞산 감나무가 올해 유난히 많이 열렸다느니 하는 이야기를 들려주셨다. 나는 고개를 끄덕이며 들었지만, 문득 이렇게 어머니와 마주 앉아 이야기를 나눈 것이 언제였는지 떠올려 보았다. 대학에 진학한 이후로 집에 오는 횟수는 점점 줄었고, 취직 후에는 연말에 한두 번 얼굴을 비추는 것이 전부였다. 전화도 어머니 쪽에서 먼저 거는 경우가 대부분이었다. 그때마다 나는 바쁘다는 핑계로 통화를 짧게 끊었고, 어머니는 그래 바쁘지, 건강해라, 하며 언제나 먼저 전화를 끊어 주셨다.'
    },
    {
      id: 'p4',
      text: '이튿날 아침 나는 어머니보다 먼저 일어나 부엌에 섰다. 서투른 솜씨로 된장국을 끓이고 밥을 안쳤다. 냉장고에서 꺼낸 두부와 호박을 넣고 보글보글 끓이니 어릴 적 어머니가 끓여 주시던 것과 비슷한 냄새가 부엌 안에 퍼졌다. 어머니가 놀란 표정으로 부엌에 들어오셨을 때, 나는 오늘은 제가 해 드릴게요, 라고 말했다. 어머니는 아무 말 없이 식탁에 앉으셨는데, 그 눈가에 물기가 어리는 것이 보였다. 돌아가는 버스에 오르기 전, 어머니가 내 손을 잡으셨다. 그 거칠고 따뜻한 손의 감촉이 오래도록 손바닥에 남아 있었다. 버스 창밖으로 점점 작아지는 어머니의 모습을 보면서, 나는 다음에는 꼭 더 자주 오겠다고 마음속으로 다짐하였다. 손을 흔드는 어머니의 모습이 시야에서 사라질 때까지 나는 창밖을 바라보았다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 52 총 글자 수: ${total}`);

  return buildContent({
    dayIndex: 52,
    contentId: 'dr-w1-052',
    subArea: 'LITERATURE',
    title: '일일 독해(비트겐슈타인 1) Day 52 문학',
    paragraphs
  });
}

function buildDay53() {
  // Day 53 - 비문학 (NONFICTION): 과학기술 - 우주 탐사의 역사와 의의
  const paragraphs = [
    {
      id: 'p1',
      text: '인류의 우주 탐사는 냉전 시대 미국과 소련의 체제 경쟁에서 본격적으로 시작되었다. 1957년 소련이 세계 최초의 인공위성 스푸트니크 1호를 발사하면서 우주 시대가 열렸고, 이에 자극을 받은 미국은 항공우주국을 설립하여 우주 개발에 박차를 가하였다. 1961년 소련의 유리 가가린이 인류 최초로 지구 궤도를 비행하였으며, 이후 미국은 아폴로 계획을 통해 1969년 닐 암스트롱이 달 표면에 첫 발을 디딤으로써 우주 탐사의 새로운 이정표를 세웠다. 이 시기의 우주 탐사는 양 진영의 기술적 우위를 과시하려는 정치적 목적이 강했으나, 동시에 인류가 지구 밖의 세계로 활동 영역을 확장할 수 있다는 가능성을 처음으로 보여 준 역사적 사건이었다.'
    },
    {
      id: 'p2',
      text: '냉전 종식 이후 우주 탐사의 성격은 크게 변화하였다. 국가 간 경쟁보다는 국제 협력이 우주 개발의 핵심 동력이 되었으며, 그 대표적인 사례가 국제 우주 정거장의 건설이다. 미국, 러시아, 유럽, 일본, 캐나다 등 여러 국가가 공동으로 참여한 국제 우주 정거장은 지구 저궤도에서 운용되는 유인 연구 시설로서, 무중력 환경에서의 과학 실험과 장기 체류 연구를 수행하고 있다. 또한 무인 탐사선의 활동도 크게 확대되어 화성, 목성, 토성 등 태양계의 다양한 천체에 탐사선이 보내졌다. 특히 화성 탐사 로버는 화성 표면의 지질 구조와 물의 흔적을 발견하여 생명체 존재 가능성에 대한 과학적 논의를 촉발하였다.'
    },
    {
      id: 'p3',
      text: '최근에는 민간 기업의 우주 산업 참여가 두드러진 변화로 나타나고 있다. 일론 머스크의 스페이스엑스와 제프 베이조스의 블루 오리진 등은 재사용 가능한 로켓 기술을 개발하여 발사 비용을 획기적으로 낮추었다. 기존에 한 번 사용 후 폐기되던 로켓을 회수하여 재사용함으로써 우주 발사 비용이 크게 절감되었고, 이는 상업적 우주 활동의 가능성을 크게 넓혔다. 우주 관광, 소형 위성 발사, 우주 인터넷 서비스 등 다양한 민간 우주 사업이 성장하고 있으며, 화성 식민지 건설이라는 장기적 목표를 공언하는 기업도 등장하였다. 이러한 민간 주도의 우주 개발은 우주 탐사의 경제적 지속 가능성을 높이는 데 기여하고 있다.'
    },
    {
      id: 'p4',
      text: '우주 탐사는 과학적 발견 외에도 인류의 기술 발전과 사고의 확장에 광범위한 영향을 미쳐 왔다. 우주 개발 과정에서 파생된 기술은 의료 기기, 통신 장비, 신소재 개발 등 일상생활의 다양한 영역에 활용되고 있다. 정수 필터, 자외선 차단 렌즈, 메모리 폼 소재 등이 모두 우주 기술에서 유래한 대표적 사례이다. 또한 지구를 우주에서 바라보는 시각의 전환은 환경 보호에 대한 인식을 높이는 계기가 되었다. 우주에서 촬영된 지구의 모습은 이 행성이 얼마나 작고 유한한 존재인지를 직관적으로 깨닫게 해 주었으며, 이는 국경을 초월한 환경 협력의 필요성을 일깨워 주었다. 우주 탐사는 미지의 세계에 대한 호기심을 충족시키는 동시에, 우리가 살고 있는 지구의 가치를 재인식하게 하는 이중적 의의를 지닌다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 53 총 글자 수: ${total}`);

  return buildContent({
    dayIndex: 53,
    contentId: 'dr-w1-053',
    subArea: 'NONFICTION',
    title: '일일 독해(비트겐슈타인 1) Day 53 비문학',
    paragraphs
  });
}

function buildDay54() {
  // Day 54 - 문학 (LITERATURE): 현대시 감상 평론 형식 - 김소월의 진달래꽃
  const paragraphs = [
    {
      id: 'p1',
      text: '김소월의 진달래꽃은 이별의 정서를 한국적 정한의 미학으로 승화시킨 대표적인 서정시이다. 1925년에 출간된 시집 진달래꽃에 수록된 이 작품에서 화자는 임이 떠나가는 상황을 가정하면서 자신의 감정을 절제된 어조로 표현한다. 나 보기가 역겨워 가실 때에는 말없이 고이 보내 드리우리다라는 첫 연은 이별에 대한 체념과 수용의 태도를 보여 준다. 그러나 이 체념은 단순한 무관심이나 포기가 아니라, 떠나는 임을 원망하지 않겠다는 극진한 사랑의 표현이다. 화자가 이별을 붙잡기보다 순순히 받아들이는 모습은 자기 감정을 억누르는 내면의 치열함을 드러내며, 이것이 이 시의 정서적 깊이를 형성하는 핵심 요소가 된다.'
    },
    {
      id: 'p2',
      text: '시의 중심 이미지인 진달래꽃은 다층적인 상징성을 지니고 있다. 영변 약산의 진달래꽃을 아름 따다 가시는 길에 뿌리겠다는 표현에서 꽃은 화자의 사랑과 정성을 물질적 형태로 구현한 것이다. 진달래꽃은 이른 봄에 산야를 온통 붉게 물들이는 꽃으로, 소박하면서도 강인한 생명력을 상징한다. 떠나는 임의 발밑에 꽃을 뿌리는 행위는 이별의 슬픔을 아름다움으로 포장하려는 시도이자, 떠나는 이에 대한 마지막 헌신의 표현이다. 나아가 가시는 걸음걸음 놓인 그 꽃을 사뿐히 즈려밟고 가시옵소서라는 표현은 자신의 마음이 밟히는 고통까지도 기꺼이 감수하겠다는 극단적 희생의 의지를 담고 있다.'
    },
    {
      id: 'p3',
      text: '마지막 연에서 화자는 죽어도 아니 눈물 흘리우리다라고 다짐한다. 이 표현은 시 전체의 정서적 긴장을 극대화하는 결정적 장치이다. 눈물을 흘리지 않겠다는 선언은 실제로 눈물이 쏟아질 만큼 깊은 슬픔을 전제하고 있기 때문이다. 말하지 않음으로써 더 많은 것을 말하는 이 역설적 표현은 한국 문학에서 오랫동안 사랑받아 온 정한의 미학을 집약적으로 보여 준다. 정한이란 슬픔을 겉으로 드러내지 않고 안으로 삭이는 감정의 양식을 의미하며, 한국인의 고유한 정서 구조를 형성하는 중요한 개념이다. 이러한 미학적 전통 속에서 감정의 직접적 표출은 절제되고, 대신 함축과 여백을 통해 독자의 상상력을 자극하는 방식이 취해진다.'
    },
    {
      id: 'p4',
      text: '진달래꽃의 문학사적 위상은 민요적 율격과 현대적 서정의 결합에서 찾을 수 있다. 김소월은 전통 민요의 삼음보 율격을 현대시에 자연스럽게 녹여 냄으로써 한국어가 지닌 음악적 아름다움을 극대화하였다. 이 시를 소리 내어 읽으면 자연스러운 리듬감이 느껴지는데, 이는 구전되어 온 민요의 가락이 시의 내부에 깊이 스며들어 있기 때문이다. 스승인 김억의 영향으로 민요에 깊은 관심을 가졌던 김소월은 전통의 정서를 현대적 언어로 재창조하는 데 탁월한 능력을 발휘하였다. 동시에 이별이라는 보편적 주제를 다루면서도 한국적 정서의 고유한 결을 살려 낸 점이 이 시의 독보적 성취이다. 진달래꽃은 발표된 지 한 세기가 지난 지금도 한국인이 가장 사랑하는 시로 손꼽히며, 이별의 슬픔을 아름다움으로 승화한 문학적 성취로서 그 가치를 인정받고 있다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 54 총 글자 수: ${total}`);

  return buildContent({
    dayIndex: 54,
    contentId: 'dr-w1-054',
    subArea: 'LITERATURE',
    title: '일일 독해(비트겐슈타인 1) Day 54 문학',
    paragraphs
  });
}

function buildDay55() {
  // Day 55 - 비문학 (NONFICTION): 철학 - 공리주의와 의무론의 대립
  const paragraphs = [
    {
      id: 'p1',
      text: '윤리학에서 어떤 행위가 도덕적으로 옳은지를 판단하는 기준은 크게 두 가지 흐름으로 나뉜다. 하나는 행위의 결과를 중시하는 결과주의이고, 다른 하나는 행위 자체의 원칙을 중시하는 의무론이다. 이 두 흐름은 서양 윤리학의 근간을 이루며 수백 년에 걸쳐 치열한 논쟁을 이어 오고 있다. 결과주의의 대표적인 이론인 공리주의는 제러미 벤담에 의해 체계화되었다. 벤담은 최대 다수의 최대 행복이라는 원리를 제시하며, 어떤 행위가 관련된 모든 사람에게 가져다주는 쾌락의 총합이 고통의 총합보다 클 때 그 행위는 도덕적으로 정당하다고 주장하였다. 이러한 관점에서는 행위의 동기나 과정보다 최종적인 결과가 윤리적 판단의 핵심 기준이 된다.'
    },
    {
      id: 'p2',
      text: '존 스튜어트 밀은 벤담의 공리주의를 발전시키면서 쾌락의 질적 차이를 강조하였다. 벤담이 모든 쾌락을 양적으로만 비교한 것과 달리, 밀은 지적 쾌락과 신체적 쾌락 사이에는 본질적인 질적 차이가 존재한다고 보았다. 밀은 만족한 돼지보다 불만족한 소크라테스가 낫다는 유명한 표현을 통해, 고차원적 정신적 쾌락이 저차원적 육체적 쾌락보다 가치 있다고 역설하였다. 이러한 질적 공리주의의 관점은 공리주의가 단순히 쾌락을 극대화하는 이론이라는 비판에 대응하면서, 인간의 고유한 이성적 능력을 윤리적 판단에 반영하고자 하는 시도였다. 그러나 누가 어떤 기준으로 쾌락의 질을 판단하느냐는 문제는 여전히 해결되지 않은 쟁점으로 남아 있다.'
    },
    {
      id: 'p3',
      text: '이와 달리 이마누엘 칸트로 대표되는 의무론은 행위의 결과가 아니라 행위의 동기와 원칙에 주목한다. 칸트는 도덕 법칙에 대한 존경심에서 비롯된 행위만이 진정으로 도덕적이라고 주장하였다. 그는 정언 명령이라는 개념을 통해 보편적 도덕 법칙의 기준을 제시하였는데, 이는 네 의지의 준칙이 동시에 보편적 법칙이 될 수 있도록 행위하라는 명령이다. 쉽게 말해 모든 사람이 동일하게 행동하더라도 모순이 없는 원칙에 따라 행동해야 한다는 것이다. 예를 들어 거짓말이 보편화되면 약속이라는 제도 자체가 붕괴하므로, 거짓말은 어떤 결과를 가져오든 도덕적으로 허용될 수 없다고 칸트는 보았다.'
    },
    {
      id: 'p4',
      text: '공리주의와 의무론의 대립은 현실의 윤리적 딜레마에서 극명하게 드러난다. 예컨대 한 사람을 희생시키면 다섯 명을 구할 수 있는 상황에서, 공리주의는 전체 행복의 총량을 기준으로 한 사람의 희생이 정당화될 수 있다고 본다. 반면 의무론의 관점에서는 인간을 수단으로 이용하는 것 자체가 도덕적으로 허용될 수 없으므로, 결과와 무관하게 한 사람을 의도적으로 해치는 행위는 부당하다고 판단한다. 이러한 이론적 대립은 현대 사회의 의료 윤리, 사법 정책, 기업 윤리 등 다양한 영역에서 실천적 논쟁으로 이어지고 있다. 두 이론은 각각 중요한 도덕적 직관을 포착하고 있기에, 어느 하나만으로 모든 윤리 문제를 해결하기는 어렵다는 점이 오늘날 윤리학의 중요한 교훈이다.'
    }
  ];

  const total = countTotalChars(paragraphs);
  console.log(`Day 55 총 글자 수: ${total}`);

  return buildContent({
    dayIndex: 55,
    contentId: 'dr-w1-055',
    subArea: 'NONFICTION',
    title: '일일 독해(비트겐슈타인 1) Day 55 비문학',
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

  // Day 51~55 콘텐츠 생성
  const days = [
    buildDay51(),
    buildDay52(),
    buildDay53(),
    buildDay54(),
    buildDay55()
  ];

  // 검증
  let allValid = true;
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

  // 배치 파일 업데이트 (인덱스 50~54 = Day 51~55)
  console.log('\n배치 파일 업데이트 중...');
  for (let i = 0; i < 5; i++) {
    batch.items[50 + i] = days[i];
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

  if (allValid) {
    console.log('\n모든 검증 통과! 작업 완료!');
  } else {
    console.log('\n[경고] 일부 검증 실패 항목이 있습니다. 파일은 생성되었습니다.');
  }
}

main();
