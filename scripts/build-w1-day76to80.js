/**
 * 비트겐슈타인1 Day 76~80 일일독해 콘텐츠 빌더 스크립트
 * - Day 76(문학), 77(비문학), 78(문학), 79(비문학), 80(문학)
 * - 지문 3~4문단, 합계 1400 +-50자 (1350~1450)
 * - 정독: buildTimeline (문장별 하이라이트 + 4지선다 + 문단별 중심내용)
 * - 복기: buildRecallCards (정확히 8장, seedPenalty: 1)
 * - 확인: 5~8문항, scoring: {correctDeltaSec:30, wrongDeltaSec:-45}, revealOnWrong: true, answerMatchMode: "ANY"
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

function shuffleChoices(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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

      const wrongChoices = shuffleChoices(otherSentences).slice(0, 3).map((t, idx) => ({
        id: ['A','B','C','D'][idx + 1],
        text: truncate(t)
      }));

      const answerPos = Math.floor(Math.random() * 4);
      const choiceIds = ['A','B','C','D'];
      const choices = [];
      let answerId = '';

      for (let ci = 0; ci < 4; ci++) {
        if (ci === answerPos) {
          choices.push({ id: choiceIds[ci], text: truncate(sent.text) });
          answerId = choiceIds[ci];
        } else {
          const wrongIdx = ci > answerPos ? ci - 1 : ci;
          if (wrongIdx < wrongChoices.length) {
            choices.push({ id: choiceIds[ci], text: wrongChoices[wrongIdx].text });
          }
        }
      }

      while (choices.length < 4) {
        choices.push({ id: choiceIds[choices.length], text: '이 문장은 지문에 포함되지 않은 내용이다.' });
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
        const os = findSentences(otherPara.text);
        for (const s of os) {
          if (s.text.length > 15) otherParaSentences.push(s.text);
        }
      }
    }

    const centerSent = paraSentences[0];
    const wrongCenter = shuffleChoices(otherParaSentences).slice(0, 3);
    const centerAnswerPos = Math.floor(Math.random() * 4);
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

// 복기 카드 8장
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

// 핵심 개념어 추출
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

  const selected = shuffleChoices(questionTemplates).slice(0, 6);

  for (let i = 0; i < selected.length; i++) {
    const q = selected[i];
    questions.push({
      id: `q${i + 1}`,
      prompt: generateQuestionPrompt(q.concept, q.sentence),
      answerRanges: [{ paragraphId: q.pid, start: q.start, end: q.end }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: 'ANY'
    });
  }

  return { questions };
}

// ========== 콘텐츠 정의 ==========

// 콘텐츠 조립
function assembleFull({ dayIndex, contentId, subArea, title, paragraphs }) {
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
        passage: { format: 'TEXT', paragraphs },
        intensive,
        recall,
        confirm
      }
    }
  };
}

// 배치 항목 래핑
function wrapBatchItem(assembled) {
  return assembled; // 이미 assembleFull에서 level_id 등이 포함됨
}

// ========== Day 76 ~ 80 콘텐츠 ==========

function buildDay76() {
  // Day 76 - 문학 (LITERATURE): 현대 소설 - 도시의 고독과 연대
  const paragraphs = [
    {
      id: 'p1',
      text: '그 남자는 매일 아침 같은 시간에 같은 버스를 탔다. 버스 안에는 늘 비슷한 사람들이 비슷한 자리에 앉아 있었지만, 누구도 서로에게 말을 걸지 않았다. 이어폰을 꽂거나 휴대전화 화면을 들여다보는 사람들 사이에서 그는 창밖을 바라보는 유일한 승객이었다. 아파트 단지를 지나고 고가 도로를 넘으면 회색 건물이 빼곡한 도심이 나타났다. 그는 그 풍경이 마치 거대한 콘크리트 미로처럼 느껴지곤 했다. 출구는 분명히 있을 터인데 어디로 가야 하는지 도무지 알 수 없는, 그런 종류의 미로였다. 삼 년 전 지방에서 올라왔을 때만 해도 도시의 화려한 불빛에 가슴이 뛰었지만, 지금 그에게 도시는 수백만 명이 살면서도 아무도 서로를 알지 못하는 거대한 무관심의 공간일 뿐이었다.'
    },
    {
      id: 'p2',
      text: '회사에서 그의 자리는 창가 쪽 칸막이 안이었다. 칸막이 너머로 동료들의 키보드 소리와 전화 통화 소리가 끊임없이 들려왔지만, 그것은 소통의 소리가 아니라 각자의 세계에서 울리는 기계음에 가까웠다. 점심시간에도 그는 혼자 구내식당 한쪽 구석에서 밥을 먹었다. 함께 식사하는 무리에 끼어들지 못한 것이 아니라 끼어들고 싶지 않은 것이라고 스스로에게 되뇌었으나, 빈 접시를 앞에 두고 멍하니 앉아 있는 시간이 길어질수록 그 말이 거짓임을 알아차리지 않을 수 없었다. 퇴근 후에도 텅 빈 원룸으로 돌아가는 발걸음은 언제나 무거웠다. 현관문을 열면 아무도 맞아 주지 않는 어둠뿐이었고, 그는 불도 켜지 않은 채 한참 동안 문 앞에 서 있곤 했다.'
    },
    {
      id: 'p3',
      text: '어느 비 오는 저녁, 그는 버스 정류장에서 한 노인이 우산 없이 비를 맞고 서 있는 것을 보았다. 평소라면 그냥 지나쳤을 장면이었으나, 그날따라 발걸음이 멈추었다. 그는 자신의 우산을 노인에게 내밀었고, 노인은 주름진 얼굴에 환한 미소를 지었다. 그 미소 한 번이 그의 하루 전체를 바꾸어 놓을 줄은 몰랐다. 노인은 고맙다는 인사와 함께 젊은 시절 이야기를 들려주었고, 그는 난생처음 버스 정류장에서 누군가와 진심 어린 대화를 나누었다. 버스가 오는 동안 두 사람은 마치 오랜 이웃처럼 이야기꽃을 피웠다. 노인은 이 동네에서 오십 년을 살았다며 예전에는 이웃끼리 된장도 나누어 먹고 아이들도 함께 돌보았다고 말했다.'
    },
    {
      id: 'p4',
      text: '그날 이후 그의 일상에 작은 변화가 생기기 시작했다. 다음 날 아침 버스에서 옆자리 사람에게 가볍게 목례를 건넸고, 상대방도 어색하지만 미소로 응답했다. 구내식당에서 혼자 앉아 있는 신입 사원에게 먼저 자리를 권했고, 그 사원의 눈에서 안도와 감사를 동시에 읽었다. 거창한 일이 아니었다. 그저 먼저 다가가는 한 걸음이 필요했을 뿐이었다. 도시의 고독은 벽돌과 콘크리트로 만든 물리적 장벽이 아니라 마음속에 쌓은 투명한 벽이었다. 그 벽은 누군가 먼저 손을 내밀면 뜻밖에 쉽게 허물어지는 것이었다. 그는 비로소 도시에서 혼자가 아닐 수 있다는 사실을 깨달았다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`Day 76 총 글자 수: ${total}`);

  return assembleFull({
    dayIndex: 76,
    contentId: 'dr-w1-076',
    subArea: 'LITERATURE',
    title: '일일 독해(비트겐슈타인 1) Day 76 문학',
    paragraphs
  });
}

function buildDay77() {
  // Day 77 - 비문학 (NONFICTION): 과학 - 수면의 과학과 건강
  const paragraphs = [
    {
      id: 'p1',
      text: '수면은 단순한 휴식이 아니라 뇌와 신체가 능동적으로 활동하는 복잡한 생리 과정이다. 수면은 크게 비렘수면과 렘수면으로 나뉘는데, 비렘수면은 다시 얕은 수면과 깊은 수면의 단계로 세분화된다. 잠이 들면 먼저 비렘수면의 얕은 단계에 진입하고, 점차 깊은 수면으로 이행한다. 깊은 수면 단계에서는 심박수와 호흡이 느려지며, 근육이 이완되고 혈압이 떨어진다. 이 단계에서 성장 호르몬이 집중적으로 분비되어 세포 재생과 조직 수리가 이루어진다. 이후 수면 주기는 다시 얕은 수면 단계를 거쳐 렘수면으로 전환되는데, 이러한 하나의 주기가 약 구십 분 간격으로 밤새 네 차례에서 여섯 차례 반복된다. 따라서 성인 기준으로 일곱 시간에서 아홉 시간의 수면을 취해야 충분한 수면 주기를 확보할 수 있다.'
    },
    {
      id: 'p2',
      text: '렘수면은 빠른 안구 운동이 나타나는 단계로, 뇌의 활동이 깨어 있을 때와 거의 비슷한 수준으로 활발해진다. 이 단계에서 꿈을 꾸는 것으로 알려져 있으며, 기억의 정리와 통합이 이루어진다. 낮 동안 경험한 정보 중에서 중요한 것은 장기 기억으로 저장되고, 불필요한 정보는 소거된다. 이러한 과정을 기억 공고화라 부르는데, 학습 효과가 수면 후에 향상되는 현상이 이를 뒷받침하는 증거이다. 시험 전날 밤을 새우는 것보다 충분히 자는 것이 기억력에 더 유리한 이유가 바로 여기에 있다. 또한 렘수면 중에는 감정 기억의 재처리가 이루어져 정서적 안정에도 기여하는 것으로 밝혀졌다.'
    },
    {
      id: 'p3',
      text: '만성적인 수면 부족은 건강에 심각한 영향을 미친다. 하루 수면 시간이 여섯 시간 이하인 상태가 지속되면 면역 기능이 저하되어 감염 질환에 대한 취약성이 높아진다. 또한 인슐린 저항성이 증가하여 당뇨병 발생 위험이 커지며, 식욕을 조절하는 호르몬의 균형이 깨져 비만의 위험도 높아진다. 심혈관계에도 부정적 영향을 주어 고혈압과 심장 질환의 발생률을 높이는 것으로 보고되고 있다. 뇌 건강의 측면에서는 수면 중에 뇌에 축적된 노폐물을 제거하는 글림프 시스템이 작동하는데, 수면이 부족하면 이 시스템의 기능이 저하되어 알츠하이머병과 같은 퇴행성 뇌 질환의 위험이 증가할 수 있다.'
    },
    {
      id: 'p4',
      text: '건강한 수면을 위해서는 규칙적인 수면 습관의 형성이 가장 중요하다. 매일 같은 시간에 잠자리에 들고 같은 시간에 일어나는 것이 체내 생체 시계를 안정화하는 데 도움이 된다. 잠들기 전에 스마트폰이나 컴퓨터 화면에서 나오는 청색광에 노출되면 멜라토닌 분비가 억제되어 입면이 어려워지므로, 취침 한 시간 전부터는 전자 기기의 사용을 줄이는 것이 바람직하다. 카페인은 체내에서 분해되는 시간이 길기 때문에 오후에는 섭취를 자제하는 것이 좋다. 침실의 온도를 서늘하게 유지하고 소음과 빛을 차단하는 것도 수면의 질을 높이는 데 효과적인 방법이다. 이처럼 수면은 건강의 기본 토대이며, 올바른 수면 습관의 실천은 질병 예방과 삶의 질 향상에 직결되는 필수적 과제이다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`Day 77 총 글자 수: ${total}`);

  return assembleFull({
    dayIndex: 77,
    contentId: 'dr-w1-077',
    subArea: 'NONFICTION',
    title: '일일 독해(비트겐슈타인 1) Day 77 비문학',
    paragraphs
  });
}

function buildDay78() {
  // Day 78 - 문학 (LITERATURE): 현대시 감상 - 이육사의 시 세계와 저항 정신
  const paragraphs = [
    {
      id: 'p1',
      text: '이육사의 시는 일제 강점기라는 가혹한 현실 속에서 굴하지 않는 의지와 미래에 대한 확신을 노래한다. 그의 대표작 광야는 광활한 공간과 장구한 시간의 이미지를 통해 민족의 수난과 극복의 서사를 상징적으로 형상화한 작품이다. 시의 첫 행에서 화자가 까마득한 날에 하늘이 처음 열리던 시간을 언급하는 것은 세계의 시작, 곧 새로운 시대의 도래를 암시하는 것으로 읽힌다. 이 거대한 시간적 배경 위에서 화자는 차가운 겨울의 이미지를 통해 현재의 고통을 표현하면서도, 반드시 봄이 올 것이라는 확고한 믿음을 놓지 않는다. 광야에 서서 먼 지평선을 바라보는 화자의 자세는 현실에 대한 냉철한 인식과 미래에 대한 흔들림 없는 전망이 결합된 것이다.'
    },
    {
      id: 'p2',
      text: '절정에서 이육사는 자신의 저항 의지를 보다 직접적으로 드러낸다. 매운 계절의 채찍에 갈겨라는 첫 구절은 시련을 회피하지 않고 정면으로 맞서겠다는 선언이다. 여기서 매운 계절은 일제의 탄압을 비유하며, 채찍은 그 탄압이 가하는 고통을 의미한다. 그러나 화자는 이 채찍 앞에서 마침내 북방으로 휩쓸려 오다라며 고통을 감내하는 주체적 자세를 취한다. 이어지는 구절에서 하늘도 그만 지쳐 끝난 고원이라 표현함으로써 수난의 극한을 이미지화하면서도, 그 끝에 서 있는 자신의 존재를 통해 시련을 넘어선 의지의 승리를 암시한다. 절정이라는 제목 자체가 고통의 정점이자 극복의 정점이라는 이중적 의미를 담고 있다.'
    },
    {
      id: 'p3',
      text: '이육사의 시에서 자연은 단순한 배경이 아니라 역사적 의미를 부여받은 상징적 공간으로 기능한다. 광야는 민족이 겪는 수난의 현장이자 새 시대를 맞이할 무대이며, 고원은 시련이 극한에 달한 지점이자 정신이 가장 높이 솟아오르는 장소이다. 겨울은 현재의 고난을, 봄은 해방의 희망을 각각 상징한다. 이처럼 자연물에 역사적 의미를 부여하는 방식은 직접적인 정치적 발언이 불가능했던 식민지 상황에서 시인이 선택한 독특한 표현 전략이다. 검열을 피하면서도 뜻있는 독자들에게는 분명한 메시지를 전달할 수 있는 이 이중적 구조는 이육사 시의 가장 중요한 기법적 특질이라 할 수 있다.'
    },
    {
      id: 'p4',
      text: '이육사는 시인이자 독립운동가로서 문학과 실천을 일치시킨 인물이다. 그는 열일곱 차례나 투옥되었으며 결국 감옥에서 생을 마감하였다. 이러한 삶의 궤적은 그의 시에 담긴 저항 정신이 관념적 수사가 아니라 실존적 결단에서 우러나온 것임을 증명한다. 그의 시가 오늘날까지 강한 울림을 주는 것은 그 언어가 삶 전체의 무게를 지탱하고 있기 때문이다. 시와 삶이 분리되지 않는 이 일관성이야말로 이육사 문학의 진정한 가치이다. 윤동주가 내면의 성찰을 통해 저항했다면, 이육사는 외부를 향한 강철 같은 의지로 시대와 맞섰다. 두 시인의 방식은 달랐지만, 암흑의 시대에 문학으로 양심을 지켰다는 점에서 그 정신적 지향은 하나로 만난다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`Day 78 총 글자 수: ${total}`);

  return assembleFull({
    dayIndex: 78,
    contentId: 'dr-w1-078',
    subArea: 'LITERATURE',
    title: '일일 독해(비트겐슈타인 1) Day 78 문학',
    paragraphs
  });
}

function buildDay79() {
  // Day 79 - 비문학 (NONFICTION): 사회 - 표현의 자유와 혐오 표현 규제
  const paragraphs = [
    {
      id: 'p1',
      text: '표현의 자유는 민주주의 사회를 지탱하는 핵심 원리 가운데 하나이다. 개인이 자신의 생각과 의견을 자유롭게 표현할 수 있을 때, 다양한 관점이 공론장에서 경쟁하고 검증받으면서 사회는 보다 합리적인 판단에 이를 수 있다. 이러한 논리를 사상의 자유 시장이라 부르며, 존 스튜어트 밀은 소수의 의견이라 하더라도 억압해서는 안 된다고 주장하였다. 그 의견이 참일 경우 사회가 진리에 접근할 기회를 잃게 되고, 거짓일 경우에도 참된 의견이 검증되는 계기가 되기 때문이라는 것이 그 근거이다. 이 원리에 의거하여 대부분의 민주주의 국가에서는 헌법을 통해 표현의 자유를 기본권으로 보장하고 있다.'
    },
    {
      id: 'p2',
      text: '그러나 모든 표현이 무제한으로 보호되어야 하는 것은 아니다. 특히 혐오 표현은 표현의 자유와 충돌하는 대표적인 쟁점이다. 혐오 표현이란 특정 집단에 대한 부정적 편견을 조장하거나, 해당 집단의 구성원을 비하하고 위협하는 내용의 표현을 말한다. 인종, 성별, 종교, 장애 등을 이유로 특정 집단을 공격하는 언어는 해당 집단 구성원에게 심리적 고통을 줄 뿐 아니라, 사회적 차별을 정당화하고 심화시키는 효과를 낳는다. 혐오 표현이 반복되면 해당 집단에 대한 폭력이 증가한다는 경험적 연구 결과도 다수 보고되어 있다. 따라서 혐오 표현은 타인의 존엄성을 훼손하는 가해 행위로서 표현의 자유의 보호 범위에서 제외되어야 한다는 주장이 제기된다.'
    },
    {
      id: 'p3',
      text: '혐오 표현 규제에 대한 반론도 만만치 않다. 가장 핵심적인 우려는 규제의 범위가 확대될 가능성에 관한 것이다. 혐오 표현의 정의가 모호할 경우 정부나 다수자가 불편하게 여기는 의견까지 혐오 표현이라는 명목으로 억압할 수 있다는 것이다. 이는 결과적으로 정치적 비판이나 소수자의 저항적 표현까지 위축시키는 효과를 가져올 수 있으며, 이를 위축 효과라 한다. 또한 표현을 규제한다고 해서 그 이면에 있는 편견 자체가 사라지는 것은 아니라는 비판도 있다. 규제는 혐오적 태도를 지하로 숨게 만들 뿐 근본적 해결이 되지 않으며, 오히려 교육과 대화를 통해 인식을 변화시키는 것이 더 효과적이라는 입장이다.'
    },
    {
      id: 'p4',
      text: '이처럼 혐오 표현 규제 문제는 표현의 자유와 인간 존엄성이라는 두 가지 핵심 가치가 긴장 관계에 놓이는 영역이다. 이 문제에 대해 단일한 정답을 제시하기는 어려우나, 몇 가지 원칙은 세울 수 있다. 첫째로 규제의 대상은 명확하게 정의되어야 하며 자의적 해석의 여지를 최소화해야 한다. 둘째로 규제는 최소 침해의 원칙에 따라 표현의 자유에 대한 제한을 필요 최소한으로 유지해야 한다. 셋째로 법적 규제만으로는 한계가 있으므로 반차별 교육과 비판적 미디어 활용 능력의 강화가 병행되어야 한다. 표현의 자유를 최대한 보장하면서도 소수자의 존엄이 침해당하지 않는 균형점을 찾는 것이 민주주의 사회의 지속적인 과제이다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`Day 79 총 글자 수: ${total}`);

  return assembleFull({
    dayIndex: 79,
    contentId: 'dr-w1-079',
    subArea: 'NONFICTION',
    title: '일일 독해(비트겐슈타인 1) Day 79 비문학',
    paragraphs
  });
}

function buildDay80() {
  // Day 80 - 문학 (LITERATURE): 고전 문학 감상 - 춘향전의 문학적 가치
  const paragraphs = [
    {
      id: 'p1',
      text: '춘향전은 한국 고전 문학을 대표하는 작품으로, 판소리로 불리던 이야기가 소설로 정착된 판소리계 소설이다. 이 작품은 기생의 딸인 춘향과 양반 자제인 이몽룡의 사랑을 중심 서사로 삼으면서, 신분제 사회의 모순과 부패한 권력에 대한 비판을 함께 담고 있다. 춘향전이 오랜 세월 동안 향유되어 온 것은 사랑이라는 보편적 주제와 사회 비판이라는 시의적 주제가 자연스럽게 결합되어 있기 때문이다. 구전되면서 다양한 판본이 생겨났다는 사실은 이 작품이 특정 작가의 창작물이 아니라 민중의 집단적 상상력이 빚어낸 공동의 서사임을 보여 준다. 현전하는 판본만 해도 백여 종에 달하며, 그 가운데 완판 열녀춘향수절가가 가장 완성도가 높은 판본으로 평가된다.'
    },
    {
      id: 'p2',
      text: '춘향이라는 인물은 작품의 핵심을 이루는 존재이다. 그녀는 기생의 딸이라는 낮은 신분에도 불구하고 절개를 지키며 부당한 권력에 굴복하지 않는다. 변학도가 수청을 요구하자 춘향은 죽음을 각오하고 거절하는데, 이 장면은 단순히 사랑에 대한 충절만을 보여 주는 것이 아니다. 권력자의 부당한 요구에 맞서는 춘향의 저항은 신분의 벽을 넘어선 인간 존엄의 선언이며, 지배층의 횡포에 대한 민중의 분노를 대변하는 것이기도 하다. 춘향이 겪는 고문과 투옥의 장면에서 독자는 불의에 맞서는 한 개인의 숭고한 용기를 목격하게 되며, 이것이 이 작품이 시대를 초월하여 감동을 주는 핵심적 원천이다.'
    },
    {
      id: 'p3',
      text: '변학도는 탐관오리의 전형으로 형상화되어 있다. 그는 부임하자마자 백성을 착취하고 기녀를 불러 향락에 빠지며, 자신의 권력에 저항하는 춘향을 가혹하게 처벌한다. 변학도의 이러한 행태는 개인적 악덕의 문제만이 아니라 당시 관료 사회의 구조적 부패를 반영하는 것이다. 그가 결국 이몽룡에 의해 파직되고 처벌받는 결말은 부패한 권력은 반드시 심판을 받는다는 민중의 소망을 서사적으로 실현한 것이다. 암행어사 출두 장면이 판소리 공연에서 관객의 가장 큰 환호를 받는 대목이라는 사실은 이 장면이 담고 있는 카타르시스의 크기를 증명한다. 금준미주는 천인혈이요 옥반가효는 만성고라라는 이몽룡의 시구는 부패한 잔치를 정면으로 비판하는 명대사로 널리 회자된다.'
    },
    {
      id: 'p4',
      text: '춘향전의 문학사적 가치는 여러 층위에서 평가된다. 우선 구전 문학과 기록 문학의 경계를 넘나드는 독특한 존재 양식을 보여 준다는 점에서 한국 문학의 특수성을 잘 드러낸다. 또한 양반과 평민, 관리와 백성이라는 사회적 갈등 구조를 사랑이야기라는 친근한 형식 안에 담아냄으로써 문학의 대중적 소통 가능성을 입증하였다. 판소리의 음악적 요소와 소설의 서사적 요소가 결합된 형식은 공연 예술과 문자 예술의 융합이라는 측면에서도 주목할 만하다. 춘향전은 고전이되 낡지 않은 작품이다. 불의에 맞서는 용기와 신분을 초월하는 사랑이라는 그 메시지는 오늘날에도 여전히 유효한 가치를 지니고 있다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`Day 80 총 글자 수: ${total}`);

  return assembleFull({
    dayIndex: 80,
    contentId: 'dr-w1-080',
    subArea: 'LITERATURE',
    title: '일일 독해(비트겐슈타인 1) Day 80 문학',
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

  // Day 76~80 콘텐츠 생성
  const days = [
    buildDay76(),
    buildDay77(),
    buildDay78(),
    buildDay79(),
    buildDay80()
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
      console.warn(`  [경고] 글자 수 범위 이탈! (${totalChars})`);
      hasWarning = true;
    }
    if (recallCards !== 8) {
      console.warn(`  [경고] 복기 카드 수 8장이 아님! (${recallCards})`);
      hasWarning = true;
    }
    if (confirmQs < 5 || confirmQs > 8) {
      console.warn(`  [경고] 확인 문항 수 범위 이탈! (${confirmQs})`);
      hasWarning = true;
    }
  }

  if (hasWarning) {
    console.warn('\n[경고] 일부 검증에 실패했으나 파일은 정상적으로 생성합니다.');
  }

  // 배치 파일 업데이트 (Day 76~80 = items[75]~[79] 교체)
  console.log('\n배치 파일 업데이트 중...');
  for (let i = 0; i < 5; i++) {
    const dayIndex = days[i].day_index;
    const batchIdx = dayIndex - 1; // 0-based
    batch.items[batchIdx] = wrapBatchItem(days[i]);
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
