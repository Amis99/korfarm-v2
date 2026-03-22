// 일일독해 러셀1 Day 66~70 콘텐츠 빌더 스크립트
const fs = require('fs');
const path = require('path');

// === 유틸리티 함수 ===

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
  if (!para) throw new Error(`단락 ${pid}을(를) 찾을 수 없습니다.`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText.substring(0,30)}..." 을(를) ${pid}에서 찾을 수 없습니다.`);
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
  return text.substring(0, maxLen - 1) + '…';
}

function shuffleChoices(choices, answerId, seed) {
  const idx = hashIdx(seed) % 24;
  const perms = [[0,1,2,3],[0,1,3,2],[0,2,1,3],[0,2,3,1],[0,3,1,2],[0,3,2,1],
    [1,0,2,3],[1,0,3,2],[1,2,0,3],[1,2,3,0],[1,3,0,2],[1,3,2,0],
    [2,0,1,3],[2,0,3,1],[2,1,0,3],[2,1,3,0],[2,3,0,1],[2,3,1,0],
    [3,0,1,2],[3,0,2,1],[3,1,0,2],[3,1,2,0],[3,2,0,1],[3,2,1,0]];
  const perm = perms[idx % perms.length];
  const ids = ['A','B','C','D'];
  const shuffled = perm.map((p, i) => ({ id: ids[i], text: choices[p].text }));
  const origIdx = choices.findIndex(c => c.id === answerId);
  const newPos = perm.indexOf(origIdx);
  return { choices: shuffled, answerId: ids[newPos] };
}

function buildTimeline(paragraphs, steps) {
  const timeline = [];
  let stepNum = 1;
  for (const step of steps) {
    const { pid, sentIdx, prompt, choices, answerId, wholeP } = step;
    let ranges;
    if (wholeP) {
      const para = paragraphs.find(p => p.id === pid);
      ranges = [{ paragraphId: pid, start: 0, end: para.text.length }];
    } else {
      const sents = findSentences(paragraphs.find(p => p.id === pid).text);
      ranges = [findRange(paragraphs, pid, sents[sentIdx].text)];
    }
    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges },
      question: {
        prompt,
        choices,
        answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }
  return { timeline };
}

function buildRecallCards(paragraphs, count = 8) {
  const fullText = paragraphs.map(p => p.text).join(' ');
  const totalLen = fullText.length;
  const chunkSize = Math.floor(totalLen / count);
  const cards = [];
  for (let i = 0; i < count; i++) {
    const start = i * chunkSize;
    const end = i === count - 1 ? totalLen : (i + 1) * chunkSize;
    cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
  }
  return {
    cards,
    correctOrder: cards.map(c => c.id),
    seedPenalty: 1
  };
}

function assembleFull({ dayIndex, subArea, paragraphs, intensive, recall, confirm }) {
  const dayStr = String(dayIndex).padStart(3, '0');
  const subAreaLabel = subArea === 'LITERATURE' ? '문학' : '비문학';
  return {
    contentId: `dr-r1-${dayStr}`,
    contentType: 'DAILY_READING',
    version: 1,
    status: 'PUBLISHED',
    title: `일일 독해(러셀 1) Day ${dayIndex} ${subAreaLabel}`,
    description: '일일 독해 - 정독·복기·확인',
    targetLevel: 'RUSSELL_1',
    schoolGradeRange: { min: 7, max: 8 },
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

function wrapBatchItem(dayIndex, subArea, content) {
  return {
    content_type: 'DAILY_READING',
    level_id: 'RUSSELL_1',
    area: 'READING',
    sub_area: subArea,
    day_index: dayIndex,
    module_key: 'reading_training',
    schema_version: '1.0',
    content
  };
}

// =============================================
// Day 66 - LITERATURE (문학)
// 주제: 김소월 「진달래꽃」 분석
// =============================================
function buildDay66() {
  const paragraphs = [
    {
      id: 'p1',
      text: '김소월은 한국 근대 시문학을 대표하는 서정 시인으로, 전통적인 민요 가락을 현대 시의 형식에 녹여 낸 것으로 유명하다. 그는 1902년 평안북도 구성에서 태어나 어린 시절부터 민요와 전래 이야기를 접하며 자연스럽게 한국어의 리듬과 정서를 체득하였다. 그의 대표작 「진달래꽃」은 1925년에 발표된 시로, 이별의 정한을 아름답고 절제된 어조로 노래하여 오늘날까지도 한국인에게 가장 사랑받는 시 가운데 하나로 꼽힌다. 이 시에서 화자는 사랑하는 사람이 떠나겠다고 하면 말없이 보내 주겠다고 말하며, 영변 약산에 핀 진달래꽃을 한 아름 따서 떠나는 길에 뿌려 주겠다고 약속한다. 표면적으로는 순종적이고 체념적인 태도처럼 보이지만, 그 이면에는 떠나는 사람의 마음을 돌리고 싶은 간절한 소망이 담겨 있다.'
    },
    {
      id: 'p2',
      text: '「진달래꽃」에서 가장 주목할 만한 표현 기법은 역설적 어조이다. 화자는 나 보기가 역겨워 가실 때에는이라는 극단적 상황을 설정하면서도 죽어도 아니 눈물 흘리우리다라고 선언한다. 이는 사랑하는 사람 앞에서 슬픔을 감추고 의연한 모습을 보이겠다는 의지의 표현이지만, 동시에 그 감정을 억누르는 행위 자체가 얼마나 큰 고통인지를 역설적으로 드러내는 장치이기도 하다. 이러한 감정의 이중 구조는 독자에게 화자의 슬픔을 더욱 깊이 공감하게 만드는 효과를 지닌다. 또한 진달래꽃이라는 소재는 한국 산야에 흔히 피는 꽃으로서 한국적 정서를 대표하는 이미지로 기능하며, 이별의 슬픔을 아름다운 자연 이미지로 승화시키는 역할을 한다. 꽃을 뿌리는 행위는 축복과 전송의 의미를 동시에 지니고 있어, 떠나는 사람에 대한 원망이 아닌 사랑의 표현으로 읽히게 된다.'
    },
    {
      id: 'p3',
      text: '김소월 시의 음악성도 빼놓을 수 없는 특징이다. 「진달래꽃」은 7·5조의 전통 민요 율격을 바탕으로 하여 읽을 때 자연스러운 리듬감이 느껴지도록 구성되어 있다. 이러한 율격은 한국어 고유의 음율적 특성과 잘 어울려 시를 낭송할 때 마치 노래를 부르는 듯한 느낌을 준다. 나아가 반복과 점층의 기법을 활용하여 화자의 감정이 점차 고조되는 과정을 효과적으로 전달한다. 결국 「진달래꽃」은 전통적 율격과 현대적 감수성이 조화를 이룬 작품으로서, 한국 서정시의 원형이라 할 만한 위치를 차지하고 있다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 66 지문 길이: ${total}자`);

  const p1s = findSentences(paragraphs[0].text);
  const p2s = findSentences(paragraphs[1].text);
  const p3s = findSentences(paragraphs[2].text);

  const intensive = buildTimeline(paragraphs, [
    { pid:'p1', sentIdx:0, prompt:'김소월 시의 특징으로 제시된 것은 무엇인가?',
      choices:[{id:'A',text:'전통적인 민요 가락을 현대 시 형식에 녹여 낸 점'},{id:'B',text:'서양 모더니즘 기법을 한국 시에 처음 도입한 점'},{id:'C',text:'사회 비판적 내용을 직접적 어조로 전달한 점'},{id:'D',text:'실험적 형식을 통해 언어의 한계를 탐구한 점'}], answerId:'A' },
    { pid:'p1', sentIdx:1, prompt:'김소월의 출생 및 성장 배경으로 적절한 것은?',
      choices:[{id:'A',text:'1902년 평안북도 출생, 어린 시절 민요와 전래 이야기를 접함'},{id:'B',text:'1910년 서울 출생, 서양 문학을 전공하며 도시 문화를 체험함'},{id:'C',text:'1895년 전라남도 출생, 농경 사회의 노동요를 채집하며 성장함'},{id:'D',text:'1920년 함경북도 출생, 근대 학교 교육을 통해 시작에 입문함'}], answerId:'A' },
    { pid:'p1', sentIdx:2, prompt:'「진달래꽃」이 발표된 시기는 언제인가?',
      choices:[{id:'A',text:'1945년 광복 이후에 처음 발표됨'},{id:'B',text:'1925년에 발표된 시임'},{id:'C',text:'1910년 한일 합병 직전에 쓰여짐'},{id:'D',text:'1935년 문예지에 처음 실림'}], answerId:'B' },
    { pid:'p1', sentIdx:3, prompt:'화자가 떠나는 사람에게 약속하는 행위는?',
      choices:[{id:'A',text:'진달래꽃을 따서 떠나는 길에 뿌려 주겠다고 약속함'},{id:'B',text:'함께 영변 약산으로 떠나자고 설득하는 행위'},{id:'C',text:'편지를 써서 자신의 마음을 전하겠다는 다짐'},{id:'D',text:'떠나지 말아 달라고 직접적으로 만류하는 행동'}], answerId:'A' },
    { pid:'p1', sentIdx:4, prompt:'화자의 태도 이면에 담긴 진정한 감정은?',
      choices:[{id:'A',text:'떠나는 사람에 대한 분노와 원망의 감정'},{id:'B',text:'떠나는 사람의 마음을 돌리고 싶은 간절한 소망'},{id:'C',text:'새로운 사람을 만나겠다는 결연한 의지'},{id:'D',text:'이별을 담담하게 수용하는 초연한 마음'}], answerId:'B' },
    { pid:'p1', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'김소월과 「진달래꽃」의 소개 및 시의 표면과 이면의 의미'},{id:'B',text:'한국 근대 문학의 전반적 흐름과 주요 사조에 대한 개괄'},{id:'C',text:'영변 약산의 지리적 특성과 진달래 군락에 관한 설명'},{id:'D',text:'김소월의 생애와 유년기 체험이 시에 미친 영향 분석'}], answerId:'A' },
    { pid:'p2', sentIdx:0, prompt:'「진달래꽃」에서 가장 주목할 표현 기법은?',
      choices:[{id:'A',text:'역설적 어조를 활용한 감정 표현 기법'},{id:'B',text:'의인법을 통해 자연물에 감정을 부여하는 기법'},{id:'C',text:'열거법으로 다양한 사물을 나열하는 기법'},{id:'D',text:'대구법을 활용하여 문장을 대칭시키는 기법'}], answerId:'A' },
    { pid:'p2', sentIdx:1, prompt:'화자가 극단적 상황에서 선언하는 내용은?',
      choices:[{id:'A',text:'상대를 따라가서 함께 살겠다는 결심의 표현'},{id:'B',text:'죽어도 아니 눈물 흘리우리다라는 의연한 선언'},{id:'C',text:'상대에게 복수하겠다는 강한 의지의 표출'},{id:'D',text:'다른 사람과 행복하게 살겠다는 담담한 고백'}], answerId:'B' },
    { pid:'p2', sentIdx:2, prompt:'감정을 억누르는 행위가 드러내는 것은?',
      choices:[{id:'A',text:'화자가 이별에 무관심하다는 냉담한 태도'},{id:'B',text:'감정을 억누르는 행위 자체가 큰 고통임을 역설적으로 보여 줌'},{id:'C',text:'화자가 감정 표현에 서투른 성격임을 암시함'},{id:'D',text:'당시 사회가 감정 표현을 금지했음을 반영함'}], answerId:'B' },
    { pid:'p2', sentIdx:3, prompt:'감정의 이중 구조가 독자에게 주는 효과는?',
      choices:[{id:'A',text:'화자의 슬픔을 더욱 깊이 공감하게 만드는 효과'},{id:'B',text:'독자에게 시의 내용을 객관적으로 분석하게 하는 효과'},{id:'C',text:'화자의 분노를 직접적으로 전달하여 충격을 주는 효과'},{id:'D',text:'독자가 이별의 원인을 추리하도록 유도하는 효과'}], answerId:'A' },
    { pid:'p2', sentIdx:4, prompt:'진달래꽃이라는 소재가 수행하는 역할은?',
      choices:[{id:'A',text:'이별의 슬픔을 아름다운 자연 이미지로 승화시키는 역할'},{id:'B',text:'화자의 경제적 빈곤을 상징하는 사회적 장치'},{id:'C',text:'계절의 변화를 알려 주는 시간적 배경의 표지'},{id:'D',text:'떠나는 사람을 비유적으로 비판하는 풍자적 소재'}], answerId:'A' },
    { pid:'p2', sentIdx:5, prompt:'꽃을 뿌리는 행위가 지니는 의미는?',
      choices:[{id:'A',text:'축복과 전송의 의미를 동시에 지녀 사랑의 표현으로 읽힘'},{id:'B',text:'떠나는 사람에 대한 분노를 물리적으로 표출하는 행위'},{id:'C',text:'자연의 순환 법칙에 따른 계절 의식의 일부로 해석됨'},{id:'D',text:'이별의 슬픔을 잊기 위해 주의를 분산시키는 행위'}], answerId:'A' },
    { pid:'p2', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'「진달래꽃」의 역설적 어조와 진달래꽃 소재의 상징적 의미'},{id:'B',text:'한국 전통 꽃 문화와 진달래의 생태적 특성에 관한 설명'},{id:'C',text:'김소월이 다른 시인들과 벌인 문학 논쟁의 전개 과정'},{id:'D',text:'이별 시의 역사적 변천과 대표 작품 목록에 대한 정리'}], answerId:'A' },
    { pid:'p3', sentIdx:0, prompt:'김소월 시에서 빼놓을 수 없는 또 다른 특징은?',
      choices:[{id:'A',text:'시의 음악성이 뛰어나다는 점'},{id:'B',text:'산문적 서술이 주를 이룬다는 점'},{id:'C',text:'외래어를 적극적으로 활용한다는 점'},{id:'D',text:'시각적 이미지보다 촉각을 중시한다는 점'}], answerId:'A' },
    { pid:'p3', sentIdx:1, prompt:'「진달래꽃」의 율격적 바탕은 무엇인가?',
      choices:[{id:'A',text:'서양 소네트의 14행 구조를 차용함'},{id:'B',text:'7·5조의 전통 민요 율격을 바탕으로 함'},{id:'C',text:'자유시 형식으로 율격 없이 구성됨'},{id:'D',text:'한문 고시의 5언 절구 형식을 따름'}], answerId:'B' },
    { pid:'p3', sentIdx:2, prompt:'전통 율격이 주는 낭송 효과로 적절한 것은?',
      choices:[{id:'A',text:'마치 노래를 부르는 듯한 자연스러운 느낌을 줌'},{id:'B',text:'학술 논문을 읽는 것 같은 엄숙한 분위기를 조성함'},{id:'C',text:'빠른 속도로 읽어야 하는 긴박한 리듬감을 만들어 냄'},{id:'D',text:'외국어처럼 낯선 음율을 느끼게 하여 이국적 정서를 환기함'}], answerId:'A' },
    { pid:'p3', sentIdx:3, prompt:'반복과 점층의 기법이 전달하는 것은?',
      choices:[{id:'A',text:'화자의 감정이 점차 고조되는 과정'},{id:'B',text:'사건의 시간 순서에 따른 서사적 전개'},{id:'C',text:'다양한 인물들의 복잡한 관계망의 형성'},{id:'D',text:'논리적 근거를 쌓아 주장을 뒷받침하는 과정'}], answerId:'A' },
    { pid:'p3', sentIdx:4, prompt:'「진달래꽃」이 차지하는 문학사적 위치는?',
      choices:[{id:'A',text:'한국 서정시의 원형이라 할 만한 위치를 차지함'},{id:'B',text:'한국 사실주의 소설의 시초로 평가받고 있음'},{id:'C',text:'한국 희곡 문학의 발전에 결정적 영향을 미침'},{id:'D',text:'한국 비평 문학의 기초를 놓은 작품으로 여겨짐'}], answerId:'A' },
    { pid:'p3', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'「진달래꽃」의 음악성과 전통 율격의 현대적 조화 및 문학사적 의의'},{id:'B',text:'한국 민요의 기원과 발전 과정에 대한 역사적 고찰'},{id:'C',text:'김소월과 동시대 시인들의 작품 비교를 통한 유파 분류'},{id:'D',text:'7·5조 율격의 언어학적 분석과 음운론적 특성 설명'}], answerId:'A' }
  ]);

  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      { id:'q1', prompt:'「진달래꽃」이 발표된 연도는 언제인가요?',
        answerRanges:[findRange(paragraphs,'p1','1925년')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q2', prompt:'화자가 떠나는 사람의 길에 뿌려 주겠다고 한 것은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p1','진달래꽃을 한 아름 따서')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q3', prompt:'화자가 눈물을 참겠다고 표현한 구절은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p2','죽어도 아니 눈물 흘리우리다')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q4', prompt:'진달래꽃 소재가 수행하는 문학적 역할은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p2','이별의 슬픔을 아름다운 자연 이미지로 승화시키는 역할')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q5', prompt:'「진달래꽃」의 율격적 바탕은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p3','7·5조의 전통 민요 율격')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q6', prompt:'이 시가 한국 문학사에서 차지하는 위치는 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p3','한국 서정시의 원형')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' }
    ]
  };

  return assembleFull({ dayIndex:66, subArea:'LITERATURE', paragraphs, intensive, recall, confirm });
}

// =============================================
// Day 67 - NONFICTION (비문학)
// 주제: 해양 생태계와 산호초의 위기
// =============================================
function buildDay67() {
  const paragraphs = [
    {
      id: 'p1',
      text: '산호초는 바다 밑바닥의 약 1퍼센트에 불과한 면적을 차지하지만, 해양 생물 종의 약 25퍼센트가 산호초 주변에서 서식하는 것으로 알려져 있다. 이는 산호초가 해양 생태계에서 얼마나 중요한 역할을 수행하는지를 보여 주는 수치이다. 산호초는 작은 산호 동물들이 석회질 골격을 분비하여 오랜 세월에 걸쳐 형성한 구조물로서, 물고기와 갑각류 등 다양한 해양 생물에게 먹이와 은신처를 제공한다. 또한 산호초는 해안가의 파도를 막아 주는 자연 방파제 역할도 수행하여, 연안 지역 주민들의 생활과 안전에도 직접적으로 기여하고 있다. 전 세계적으로 약 5억 명 이상의 사람들이 식량과 생계를 산호초에 의존하고 있다는 통계는 산호초의 경제적 가치를 잘 말해 준다.'
    },
    {
      id: 'p2',
      text: '그러나 최근 수십 년간 전 세계 산호초의 상태가 급격히 악화되고 있다. 가장 큰 원인은 지구 온난화로 인한 해수 온도의 상승이다. 산호는 체내에 공생하는 미세 조류인 주산텔라로부터 영양분과 색소를 공급받는데, 수온이 일정 수준 이상 올라가면 산호가 주산텔라를 방출하여 하얗게 변하는 백화 현상이 발생한다. 백화 현상이 장기간 지속되면 산호는 영양분을 얻지 못해 결국 죽게 된다. 2016년과 2017년에 걸쳐 호주 대보초에서 발생한 대규모 백화 사건은 전체 산호의 약 절반에 피해를 입혀 세계적인 충격을 안겨 주었다. 이 밖에도 해양 산성화, 과도한 어업, 해안 개발에 따른 수질 오염 등이 산호초의 건강을 위협하는 주요 요인으로 지목되고 있다.'
    },
    {
      id: 'p3',
      text: '산호초를 보전하기 위한 국제 사회의 노력도 활발하게 전개되고 있다. 여러 국가에서 해양 보호 구역을 지정하여 산호초 주변에서의 어업 활동과 개발 행위를 제한하고 있으며, 과학자들은 고온에 강한 산호 품종을 인공적으로 배양하여 훼손된 산호 지대에 이식하는 복원 사업을 진행하고 있다. 또한 탄소 배출을 줄이기 위한 국제 협약의 이행이 산호초 보전의 근본적 해법이라는 인식도 점차 확산되고 있다. 개인 수준에서도 자외선 차단제에 포함된 화학 물질이 산호에 유해하다는 사실이 알려지면서 산호 친화적 제품을 선택하는 소비자가 늘어나고 있다. 이러한 다층적 노력이 지속된다면 산호초 생태계의 회복 가능성은 충분히 열려 있다고 전문가들은 평가한다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 67 지문 길이: ${total}자`);

  const intensive = buildTimeline(paragraphs, [
    { pid:'p1', sentIdx:0, prompt:'산호초가 차지하는 바다 밑바닥의 면적 비율은?',
      choices:[{id:'A',text:'바다 밑바닥의 약 1퍼센트에 불과한 면적'},{id:'B',text:'바다 밑바닥의 약 25퍼센트를 차지하는 넓은 면적'},{id:'C',text:'바다 밑바닥의 약 10퍼센트에 해당하는 면적'},{id:'D',text:'바다 밑바닥의 약 50퍼센트를 덮고 있는 면적'}], answerId:'A' },
    { pid:'p1', sentIdx:1, prompt:'이 수치가 보여 주는 것은 무엇인가?',
      choices:[{id:'A',text:'산호초가 해양 생태계에서 매우 중요한 역할을 수행한다는 사실'},{id:'B',text:'해양 생물의 종 다양성이 전반적으로 감소하고 있다는 경향'},{id:'C',text:'바다 밑바닥의 지형이 매우 단순하다는 지질학적 특성'},{id:'D',text:'해양 생물이 산호초를 피해 깊은 바다로 이동한다는 관찰'}], answerId:'A' },
    { pid:'p1', sentIdx:2, prompt:'산호초가 해양 생물에게 제공하는 것은?',
      choices:[{id:'A',text:'먹이와 은신처를 제공하는 서식 환경'},{id:'B',text:'수온을 일정하게 유지해 주는 온도 조절 기능'},{id:'C',text:'산소를 대량으로 생산하는 광합성 기능'},{id:'D',text:'해류의 방향을 바꾸어 주는 물리적 구조'}], answerId:'A' },
    { pid:'p1', sentIdx:3, prompt:'산호초의 자연 방파제 역할이 기여하는 대상은?',
      choices:[{id:'A',text:'연안 지역 주민들의 생활과 안전에 기여함'},{id:'B',text:'원양 어업 선박의 항해 안전에 기여함'},{id:'C',text:'심해 생물의 번식 환경 조성에 기여함'},{id:'D',text:'해저 광물 자원의 채굴 작업에 기여함'}], answerId:'A' },
    { pid:'p1', sentIdx:4, prompt:'산호초에 생계를 의존하는 사람 수로 언급된 것은?',
      choices:[{id:'A',text:'전 세계 약 5억 명 이상의 사람들'},{id:'B',text:'전 세계 약 1억 명 정도의 사람들'},{id:'C',text:'전 세계 약 10억 명 이상의 사람들'},{id:'D',text:'전 세계 약 5천만 명 이하의 사람들'}], answerId:'A' },
    { pid:'p1', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'산호초의 생태적·경제적 중요성과 해양 생물에 대한 기여'},{id:'B',text:'바다 밑바닥의 지형 분류와 해저 지질 구조에 관한 설명'},{id:'C',text:'해양 오염이 연안 지역 경제에 미치는 부정적 영향 분석'},{id:'D',text:'세계 각국의 수산업 현황과 어획량 통계에 대한 보고'}], answerId:'A' },
    { pid:'p2', sentIdx:0, prompt:'최근 수십 년간 산호초에 일어난 변화는?',
      choices:[{id:'A',text:'전 세계 산호초의 상태가 급격히 악화되고 있음'},{id:'B',text:'산호초의 면적이 크게 확장되어 새로운 군락이 형성됨'},{id:'C',text:'산호초의 색상이 더욱 다양해져 관광 자원으로 각광받음'},{id:'D',text:'산호초 주변의 해양 생물 종이 급격히 증가하고 있음'}], answerId:'A' },
    { pid:'p2', sentIdx:1, prompt:'산호초 악화의 가장 큰 원인으로 지목된 것은?',
      choices:[{id:'A',text:'지구 온난화로 인한 해수 온도의 상승'},{id:'B',text:'해저 화산 폭발로 인한 용암 분출 현상'},{id:'C',text:'외래 해양 생물종의 급격한 유입과 번식'},{id:'D',text:'해양 쓰레기의 물리적 충돌에 의한 손상'}], answerId:'A' },
    { pid:'p2', sentIdx:2, prompt:'산호 백화 현상이 발생하는 과정으로 적절한 것은?',
      choices:[{id:'A',text:'수온 상승으로 산호가 주산텔라를 방출하여 하얗게 변함'},{id:'B',text:'해류 변화로 산호 표면에 석회질이 추가로 침착됨'},{id:'C',text:'강한 태양 자외선에 의해 산호 골격이 탈색되는 현상'},{id:'D',text:'해저 지진으로 산호 구조물이 물리적으로 파괴됨'}], answerId:'A' },
    { pid:'p2', sentIdx:4, prompt:'2016~2017년 호주 대보초 백화 사건의 피해 규모는?',
      choices:[{id:'A',text:'전체 산호의 약 절반에 피해를 입힌 대규모 사건'},{id:'B',text:'전체 산호의 약 10퍼센트에만 영향을 미친 경미한 사건'},{id:'C',text:'대보초 전체가 완전히 소멸한 역사적 재앙'},{id:'D',text:'피해 없이 산호가 오히려 성장한 긍정적 현상'}], answerId:'A' },
    { pid:'p2', sentIdx:5, prompt:'산호초 건강을 위협하는 기타 요인으로 언급된 것은?',
      choices:[{id:'A',text:'해양 산성화, 과도한 어업, 해안 개발에 따른 수질 오염 등'},{id:'B',text:'달의 인력 변화, 지구 자전 속도 감소, 해저 지각 변동 등'},{id:'C',text:'인공위성 잔해 낙하, 해저 케이블 매설, 군사 훈련 등'},{id:'D',text:'해조류의 과잉 번식, 해파리 대량 발생, 적조 현상 등만 해당'}], answerId:'A' },
    { pid:'p2', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'산호초 악화의 원인과 백화 현상의 발생 메커니즘 및 피해 사례'},{id:'B',text:'호주 대보초의 관광 산업 현황과 경제적 가치에 대한 평가'},{id:'C',text:'해수 온도 측정 기술의 발전 과정과 기상 관측 시스템 소개'},{id:'D',text:'주산텔라의 생물학적 분류와 미세 조류의 진화 계통 연구'}], answerId:'A' },
    { pid:'p3', sentIdx:0, prompt:'국제 사회의 산호초 보전 노력으로 언급된 것은?',
      choices:[{id:'A',text:'해양 보호 구역 지정을 통한 어업 및 개발 행위 제한'},{id:'B',text:'산호초를 인공 구조물로 완전히 대체하는 건설 사업'},{id:'C',text:'산호초 주변 해역의 수온을 인위적으로 낮추는 기술 투입'},{id:'D',text:'산호초 지역을 관광 특구로 개방하여 수익을 올리는 전략'}], answerId:'A' },
    { pid:'p3', sentIdx:1, prompt:'과학자들이 진행하는 복원 사업의 내용은?',
      choices:[{id:'A',text:'고온에 강한 산호 품종을 배양하여 훼손된 지대에 이식함'},{id:'B',text:'인공 바위를 투입하여 산호초의 물리적 크기를 늘리는 방법'},{id:'C',text:'화학 약품을 살포하여 유해 생물을 제거하는 방제 활동'},{id:'D',text:'산호초 주변 수온을 인위적으로 낮추는 냉각 장치를 설치함'}], answerId:'A' },
    { pid:'p3', sentIdx:3, prompt:'개인 수준에서 소비자들이 취하는 행동은?',
      choices:[{id:'A',text:'산호 친화적 자외선 차단제를 선택하는 소비 행동'},{id:'B',text:'해양 스포츠를 완전히 포기하는 극단적 생활 변화'},{id:'C',text:'산호초 주변 해역의 모든 수산물 소비를 중단하는 행동'},{id:'D',text:'산호초 기금에 월급의 일정 비율을 기부하는 재정 지원'}], answerId:'A' },
    { pid:'p3', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'산호초 보전을 위한 국제·과학·개인 차원의 다층적 노력과 전망'},{id:'B',text:'해양 보호 구역의 법적 근거와 국제법적 쟁점에 대한 분석'},{id:'C',text:'자외선 차단제의 화학 성분 분석과 인체 유해성에 관한 연구'},{id:'D',text:'전 세계 산호초 면적의 연도별 변화 추이에 관한 통계 보고'}], answerId:'A' }
  ]);

  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      { id:'q1', prompt:'산호초 주변에 서식하는 해양 생물 종의 비율은 얼마인가요?',
        answerRanges:[findRange(paragraphs,'p1','약 25퍼센트')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q2', prompt:'산호초에 생계를 의존하는 전 세계 인구 수는 얼마인가요?',
        answerRanges:[findRange(paragraphs,'p1','약 5억 명 이상')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q3', prompt:'산호 백화 현상의 가장 큰 원인은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p2','지구 온난화로 인한 해수 온도의 상승')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q4', prompt:'호주 대보초 백화 사건은 전체 산호의 얼마에 피해를 입혔나요?',
        answerRanges:[findRange(paragraphs,'p2','약 절반에 피해를 입혀')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q5', prompt:'과학자들이 복원 사업에서 배양하는 것은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p3','고온에 강한 산호 품종')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q6', prompt:'산호초 보전의 근본적 해법으로 제시된 것은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p3','탄소 배출을 줄이기 위한 국제 협약의 이행')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q7', prompt:'자외선 차단제의 어떤 성분이 산호에 유해한가요?',
        answerRanges:[findRange(paragraphs,'p3','화학 물질이 산호에 유해')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' }
    ]
  };

  return assembleFull({ dayIndex:67, subArea:'NONFICTION', paragraphs, intensive, recall, confirm });
}

// =============================================
// Day 68 - LITERATURE (문학)
// 주제: 황순원 「소나기」 분석
// =============================================
function buildDay68() {
  const paragraphs = [
    {
      id: 'p1',
      text: '황순원의 단편 소설 「소나기」는 1953년에 발표된 작품으로, 시골 마을을 배경으로 소년과 소녀의 순수한 만남과 이별을 그린 한국 문학의 대표적 성장 소설이다. 소년은 개울가에서 물장난을 하다가 서울에서 내려온 소녀를 처음 만나게 된다. 소녀는 소년에게 조약돌을 건네며 다가오고, 소년은 처음에는 수줍어하지만 점차 소녀에게 마음을 열어 간다. 두 사람은 들판을 걸으며 꽃을 꺾고 냇물에서 놀며 자연 속에서 순수한 우정과 사랑의 감정을 키워 나간다. 이 작품에서 자연은 단순한 배경이 아니라 두 인물의 감정을 비추는 거울 역할을 수행하며, 계절의 변화와 함께 그들의 관계가 깊어지는 과정을 상징적으로 보여 준다.'
    },
    {
      id: 'p2',
      text: '작품의 절정은 소년과 소녀가 들판에서 갑작스러운 소나기를 만나는 장면이다. 빗속에서 소년은 소녀를 보호하려 하고 소녀는 소년의 등에 업혀 비를 피한다. 이 장면은 두 인물 사이의 순수한 감정이 가장 강렬하게 드러나는 순간으로, 소나기라는 자연 현상이 감정의 폭발과 절정을 상징하는 장치로 기능한다. 소나기가 그친 뒤 소녀의 옷에 남은 소년의 체온과 진흙 자국은 그들의 만남이 남긴 흔적을 물리적으로 보여 주는 상징물이기도 하다. 특히 소나기가 갑자기 내렸다가 그치는 특성은 아름답지만 짧은 만남의 본질을 은유적으로 드러내며, 이후 소녀가 병으로 세상을 떠난다는 결말을 암시하는 복선으로도 작용한다.'
    },
    {
      id: 'p3',
      text: '「소나기」의 서술 기법도 작품의 완성도를 높이는 데 크게 기여한다. 황순원은 간결하고 절제된 문체를 사용하여 감정을 직접적으로 설명하는 대신 인물의 행동과 자연 묘사를 통해 간접적으로 전달한다. 예를 들어 소년이 소녀의 조약돌을 소중히 간직하는 행동은 그의 마음을 말없이 보여 주며, 들판의 코스모스가 바람에 흔들리는 장면은 소년의 설레는 감정을 시각적으로 형상화한다. 이러한 절제된 서술은 독자에게 상상의 여지를 남겨 주어 작품의 여운을 더욱 깊게 만든다. 또한 소녀가 세상을 떠난 뒤에도 소년의 기억 속에 소나기와 함께한 순간이 영원히 남아 있으리라는 암시는, 짧지만 강렬한 만남의 가치를 다시 한번 되새기게 한다. 결국 「소나기」는 순수한 감정이 자연과 어우러져 빚어내는 아름다움을 보여 주는 작품으로, 한국 단편 소설 가운데 가장 널리 사랑받는 작품 중 하나로 자리잡고 있다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 68 지문 길이: ${total}자`);

  const intensive = buildTimeline(paragraphs, [
    { pid:'p1', sentIdx:0, prompt:'「소나기」가 발표된 시기와 배경으로 적절한 것은?',
      choices:[{id:'A',text:'1953년 발표, 시골 마을을 배경으로 소년과 소녀의 이야기를 담음'},{id:'B',text:'1970년대 발표, 도시의 공장 지대를 배경으로 노동자의 삶을 그림'},{id:'C',text:'1930년대 발표, 식민지 지식인의 고뇌를 주제로 한 장편 소설'},{id:'D',text:'해방 이전 발표, 만주 벌판을 배경으로 독립 투쟁을 서술함'}], answerId:'A' },
    { pid:'p1', sentIdx:1, prompt:'소년이 소녀를 처음 만나는 장소는 어디인가?',
      choices:[{id:'A',text:'개울가에서 물장난을 하다가 만남'},{id:'B',text:'학교 교실에서 같은 반이 되어 만남'},{id:'C',text:'마을 장터에서 물건을 사다가 마주침'},{id:'D',text:'기차역에서 소녀가 서울로 가는 길에 만남'}], answerId:'A' },
    { pid:'p1', sentIdx:2, prompt:'소녀가 소년에게 건네는 물건은 무엇인가?',
      choices:[{id:'A',text:'조약돌을 건네며 소년에게 다가옴'},{id:'B',text:'꽃다발을 만들어 선물로 건넴'},{id:'C',text:'편지를 써서 몰래 전달함'},{id:'D',text:'손수건을 빌려 달라고 건넴'}], answerId:'A' },
    { pid:'p1', sentIdx:4, prompt:'이 작품에서 자연이 수행하는 역할은?',
      choices:[{id:'A',text:'두 인물의 감정을 비추는 거울 역할을 수행함'},{id:'B',text:'인물 간의 갈등을 유발하는 장애물 역할을 수행함'},{id:'C',text:'시대적 배경을 설명하는 역사적 자료 역할을 수행함'},{id:'D',text:'작품의 교훈적 메시지를 직접 전달하는 해설 역할을 수행함'}], answerId:'A' },
    { pid:'p1', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'「소나기」의 작품 소개와 소년·소녀의 만남 및 자연의 상징적 역할'},{id:'B',text:'황순원의 생애와 다른 작품들에 대한 전기적 서술'},{id:'C',text:'1950년대 한국 농촌의 경제적 상황과 사회 변화에 관한 설명'},{id:'D',text:'한국 성장 소설의 역사적 발전 과정에 대한 문학사적 개괄'}], answerId:'A' },
    { pid:'p2', sentIdx:0, prompt:'작품의 절정 장면에서 소년과 소녀에게 일어나는 일은?',
      choices:[{id:'A',text:'들판에서 갑작스러운 소나기를 만나는 사건'},{id:'B',text:'소녀가 서울로 돌아가겠다고 통보하는 장면'},{id:'C',text:'소년이 소녀에게 편지로 마음을 고백하는 장면'},{id:'D',text:'마을 어른들이 두 사람의 만남을 반대하는 상황'}], answerId:'A' },
    { pid:'p2', sentIdx:1, prompt:'빗속에서 소년이 취하는 행동으로 적절한 것은?',
      choices:[{id:'A',text:'소녀를 보호하려 하고 소녀는 소년의 등에 업혀 비를 피함'},{id:'B',text:'소녀를 두고 혼자 먼저 비를 피해 달아나 버림'},{id:'C',text:'소녀와 함께 비를 맞으며 들판에서 노래를 부름'},{id:'D',text:'우산을 가지러 집으로 달려가 다시 돌아옴'}], answerId:'A' },
    { pid:'p2', sentIdx:2, prompt:'소나기라는 자연 현상이 상징하는 것은?',
      choices:[{id:'A',text:'감정의 폭발과 절정을 상징하는 장치로 기능함'},{id:'B',text:'사회적 갈등과 계층 차이를 상징하는 장치임'},{id:'C',text:'인물의 경제적 빈곤을 암시하는 배경 요소임'},{id:'D',text:'전쟁의 공포와 불안을 비유적으로 표현한 소재임'}], answerId:'A' },
    { pid:'p2', sentIdx:3, prompt:'소녀의 옷에 남은 진흙 자국이 상징하는 것은?',
      choices:[{id:'A',text:'두 사람의 만남이 남긴 흔적을 물리적으로 보여 주는 상징물'},{id:'B',text:'소녀의 불결한 생활 환경을 사실적으로 묘사한 세부 장면'},{id:'C',text:'소년의 거친 성격이 소녀에게 피해를 주었음을 보여 주는 장면'},{id:'D',text:'농촌의 열악한 도로 사정을 고발하는 사회 비판적 장치'}], answerId:'A' },
    { pid:'p2', sentIdx:4, prompt:'소나기의 특성이 은유하는 것으로 적절한 것은?',
      choices:[{id:'A',text:'아름답지만 짧은 만남의 본질과 소녀의 죽음에 대한 복선'},{id:'B',text:'계절의 순환에 따른 자연의 영원한 생명력의 상징'},{id:'C',text:'소년이 성장하여 도시로 떠나게 될 미래에 대한 암시'},{id:'D',text:'전쟁이 끝나고 평화가 찾아올 것이라는 희망의 표현'}], answerId:'A' },
    { pid:'p2', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'소나기 장면의 상징적 의미와 소녀의 죽음을 암시하는 복선 분석'},{id:'B',text:'소년과 소녀의 가족 관계 및 성장 배경에 대한 상세한 서술'},{id:'C',text:'한국 농촌의 기후 특성과 소나기의 기상학적 발생 원리 설명'},{id:'D',text:'황순원이 작품을 집필하게 된 개인적 동기와 창작 배경 소개'}], answerId:'A' },
    { pid:'p3', sentIdx:0, prompt:'「소나기」의 서술 기법이 기여하는 바는?',
      choices:[{id:'A',text:'작품의 완성도를 높이는 데 크게 기여함'},{id:'B',text:'독자의 이해를 방해하여 난해한 작품으로 만듦'},{id:'C',text:'사건의 전개 속도를 빠르게 하여 긴장감을 조성함'},{id:'D',text:'작가의 개인적 의견을 직접적으로 전달하는 역할을 함'}], answerId:'A' },
    { pid:'p3', sentIdx:1, prompt:'황순원의 문체적 특징으로 적절한 것은?',
      choices:[{id:'A',text:'간결하고 절제된 문체로 행동과 자연 묘사를 통해 간접 전달'},{id:'B',text:'화려하고 수사적인 문체로 감정을 과장되게 직접 표현'},{id:'C',text:'학술적이고 분석적인 문체로 인물 심리를 논리적으로 해설'},{id:'D',text:'구어체와 방언을 적극 활용하여 사실감을 극대화하는 서술'}], answerId:'A' },
    { pid:'p3', sentIdx:2, prompt:'소년이 조약돌을 간직하는 행동이 보여 주는 것은?',
      choices:[{id:'A',text:'소녀에 대한 소년의 마음을 말없이 보여 주는 행동'},{id:'B',text:'소년의 수집 취미와 자연에 대한 관심을 드러내는 행동'},{id:'C',text:'시골 아이들의 놀이 문화를 사실적으로 묘사한 장면'},{id:'D',text:'소녀의 부탁을 거절하지 못하는 소년의 소극적 성격 표현'}], answerId:'A' },
    { pid:'p3', sentIdx:3, prompt:'절제된 서술이 독자에게 주는 효과는?',
      choices:[{id:'A',text:'상상의 여지를 남겨 주어 작품의 여운을 더욱 깊게 만듦'},{id:'B',text:'독자가 작품의 줄거리를 파악하기 어렵게 만드는 효과'},{id:'C',text:'작가의 의도를 정확하게 전달하여 해석의 여지를 제거함'},{id:'D',text:'독자에게 교훈적 메시지를 직접적으로 전달하는 효과'}], answerId:'A' },
    { pid:'p3', sentIdx:4, prompt:'소녀가 떠난 뒤 암시되는 내용으로 적절한 것은?',
      choices:[{id:'A',text:'소년의 기억 속에 소나기와 함께한 순간이 영원히 남아 있으리라는 암시'},{id:'B',text:'소년이 소녀를 따라 서울로 떠나게 되리라는 예고'},{id:'C',text:'소년이 소녀를 점차 잊어 가게 되리라는 현실적 예측'},{id:'D',text:'마을 사람들이 소녀를 기리는 기념비를 세우리라는 전망'}], answerId:'A' },
    { pid:'p3', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'「소나기」의 절제된 서술 기법과 작품의 문학적 가치 및 위상'},{id:'B',text:'한국 단편 소설의 역사적 발전 과정과 주요 작가 계보 정리'},{id:'C',text:'코스모스의 생태적 특성과 한국 들판에서의 분포에 관한 설명'},{id:'D',text:'황순원과 동시대 작가들의 문체 비교를 통한 문학 유파 분류'}], answerId:'A' }
  ]);

  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      { id:'q1', prompt:'「소나기」가 발표된 연도는 언제인가요?',
        answerRanges:[findRange(paragraphs,'p1','1953년')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q2', prompt:'소녀가 소년에게 처음 건넨 물건은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p1','조약돌을 건네며')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q3', prompt:'소나기가 상징하는 것은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p2','감정의 폭발과 절정을 상징')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q4', prompt:'소녀의 옷에 남은 진흙 자국은 무엇을 상징하나요?',
        answerRanges:[findRange(paragraphs,'p2','만남이 남긴 흔적')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q5', prompt:'황순원이 사용한 문체의 특징은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p3','간결하고 절제된 문체')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q6', prompt:'절제된 서술이 독자에게 주는 효과는 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p3','상상의 여지를 남겨 주어')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' }
    ]
  };

  return assembleFull({ dayIndex:68, subArea:'LITERATURE', paragraphs, intensive, recall, confirm });
}

// =============================================
// Day 69 - NONFICTION (비문학)
// 주제: 인공지능과 윤리적 문제
// =============================================
function buildDay69() {
  const paragraphs = [
    {
      id: 'p1',
      text: '인공지능 기술은 최근 몇 년 사이에 비약적으로 발전하여 우리 생활의 여러 분야에 깊숙이 침투하고 있다. 음성 인식 비서가 일상적인 질문에 답하고, 추천 알고리즘이 개인의 취향에 맞는 콘텐츠를 선별하며, 자율 주행 자동차가 도로 위를 달리는 시대가 이미 도래하였다. 이러한 인공지능의 확산은 생산성을 획기적으로 높이고 인간의 편의를 증진시키는 긍정적 측면이 분명히 있지만, 동시에 다양한 윤리적 문제를 수반하기도 한다. 인공지능이 내리는 판단이 과연 공정한지, 인공지능에 의한 일자리 감소에 어떻게 대응해야 하는지, 인공지능의 결정에 대한 책임은 누가 져야 하는지 등의 질문이 사회 전반에서 활발하게 논의되고 있다.'
    },
    {
      id: 'p2',
      text: '인공지능 윤리에서 가장 빈번하게 제기되는 문제 중 하나는 알고리즘 편향이다. 인공지능 모델은 학습 데이터에 기반하여 판단을 내리는데, 학습 데이터에 특정 집단에 대한 편견이 포함되어 있으면 그 편향이 인공지능의 결과물에도 그대로 반영된다. 실제로 일부 채용 심사 인공지능이 성별에 따라 불균형한 평가를 내린 사례가 보고된 바 있으며, 얼굴 인식 기술이 특정 인종의 얼굴을 정확하게 식별하지 못하는 문제도 지적되어 왔다. 이러한 편향을 해결하기 위해서는 학습 데이터의 다양성을 확보하고, 알고리즘의 판단 과정을 투명하게 공개하며, 정기적인 감사와 평가를 통해 편향을 감시하는 체계를 마련해야 한다.'
    },
    {
      id: 'p3',
      text: '인공지능의 책임 소재 문제도 중요한 논점이다. 자율 주행 자동차가 사고를 일으켰을 때 그 책임을 운전자에게 물어야 하는지, 제조사에게 물어야 하는지, 아니면 알고리즘을 설계한 개발자에게 물어야 하는지가 명확하지 않다. 현행 법률 체계는 대부분 인간의 행위를 전제로 설계되어 있기 때문에, 인공지능이 독자적으로 내린 판단에 대한 법적 책임을 규정하는 데 어려움이 있다. 이에 따라 여러 국가에서 인공지능 관련 법률과 윤리 지침을 새롭게 마련하고 있으며, 유럽 연합의 인공지능법이 대표적인 사례로 꼽힌다. 이 법은 인공지능을 위험도에 따라 분류하고 높은 위험군에 속하는 기술에 대해 더 엄격한 규제를 적용하는 것을 골자로 한다. 궁극적으로 인공지능 기술의 발전과 윤리적 기준의 수립이 균형 있게 이루어질 때, 인공지능은 인류에게 진정으로 유익한 도구가 될 수 있을 것이다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 69 지문 길이: ${total}자`);

  const intensive = buildTimeline(paragraphs, [
    { pid:'p1', sentIdx:0, prompt:'인공지능 기술의 최근 동향으로 제시된 것은?',
      choices:[{id:'A',text:'비약적으로 발전하여 생활 여러 분야에 깊숙이 침투하고 있음'},{id:'B',text:'발전 속도가 정체되어 실용화 단계에 이르지 못하고 있음'},{id:'C',text:'군사 분야에만 한정적으로 활용되어 민간 보급이 지연됨'},{id:'D',text:'이론적 연구 단계에 머물러 있어 실생활 적용이 불가능함'}], answerId:'A' },
    { pid:'p1', sentIdx:1, prompt:'인공지능이 활용되는 구체적 분야로 언급된 것은?',
      choices:[{id:'A',text:'음성 인식 비서, 추천 알고리즘, 자율 주행 자동차'},{id:'B',text:'우주 탐사 로봇, 심해 탐측 장비, 핵 발전소 관리 시스템'},{id:'C',text:'농업용 관개 시설, 축산업 사료 배합, 어업 그물 관리'},{id:'D',text:'수술용 메스 제작, 약품 포장 기계, 의료 폐기물 처리'}], answerId:'A' },
    { pid:'p1', sentIdx:2, prompt:'인공지능 확산의 양면으로 제시된 것은?',
      choices:[{id:'A',text:'생산성 향상과 편의 증진의 긍정적 측면과 윤리적 문제 수반'},{id:'B',text:'기술 독점에 따른 시장 왜곡과 소비자 피해의 확대'},{id:'C',text:'교육 기회의 확대와 문화 다양성의 감소라는 상반된 결과'},{id:'D',text:'에너지 소비 증가와 환경 오염 심화라는 생태적 부작용'}], answerId:'A' },
    { pid:'p1', sentIdx:3, prompt:'사회 전반에서 논의되는 인공지능 관련 질문은?',
      choices:[{id:'A',text:'공정성, 일자리 감소 대응, 결정에 대한 책임 소재 등의 질문'},{id:'B',text:'인공지능의 전력 소비량과 냉각 시스템 효율에 관한 질문'},{id:'C',text:'인공지능 반도체 제조 기술과 원재료 수급에 관한 질문'},{id:'D',text:'인공지능 연구자의 처우 개선과 연구비 확보에 관한 질문'}], answerId:'A' },
    { pid:'p1', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'인공지능의 발전 현황과 그에 수반되는 윤리적 문제의 대두'},{id:'B',text:'자율 주행 자동차의 기술적 작동 원리와 안전성 평가 기준'},{id:'C',text:'음성 인식 기술의 발전 과정과 언어 처리 알고리즘의 구조'},{id:'D',text:'추천 알고리즘의 수학적 모델링과 데이터 분석 방법론 소개'}], answerId:'A' },
    { pid:'p2', sentIdx:0, prompt:'인공지능 윤리에서 빈번하게 제기되는 문제는?',
      choices:[{id:'A',text:'알고리즘 편향의 문제가 가장 빈번하게 제기됨'},{id:'B',text:'인공지능의 전력 과소비 문제가 주로 제기됨'},{id:'C',text:'인공지능 개발자의 처우 불평등 문제가 핵심임'},{id:'D',text:'인공지능의 물리적 크기와 설치 공간 문제가 중심임'}], answerId:'A' },
    { pid:'p2', sentIdx:1, prompt:'알고리즘 편향이 발생하는 원인으로 제시된 것은?',
      choices:[{id:'A',text:'학습 데이터에 특정 집단에 대한 편견이 포함되어 있기 때문'},{id:'B',text:'인공지능이 스스로 편견을 학습하여 창작하기 때문'},{id:'C',text:'프로그래머가 의도적으로 편향을 삽입했기 때문'},{id:'D',text:'하드웨어의 물리적 결함이 데이터 처리에 오류를 일으키므로'}], answerId:'A' },
    { pid:'p2', sentIdx:2, prompt:'알고리즘 편향의 실제 사례로 언급된 것은?',
      choices:[{id:'A',text:'채용 심사 인공지능의 성별 불균형 평가와 얼굴 인식의 인종 편향'},{id:'B',text:'의료 인공지능이 모든 환자에게 동일한 처방을 내린 사례'},{id:'C',text:'자율 주행 차량이 신호등 색상을 혼동하여 사고를 낸 사례'},{id:'D',text:'번역 인공지능이 모든 언어를 동일한 정확도로 번역한 사례'}], answerId:'A' },
    { pid:'p2', sentIdx:3, prompt:'편향 해결을 위해 제시된 방안으로 적절한 것은?',
      choices:[{id:'A',text:'학습 데이터 다양성 확보, 판단 과정 투명 공개, 정기 감사 체계 마련'},{id:'B',text:'인공지능 개발을 전면 중단하고 인간 심사 방식으로 회귀하는 것'},{id:'C',text:'특정 기업에만 인공지능 개발 권한을 독점적으로 부여하는 것'},{id:'D',text:'모든 인공지능 판단을 비공개로 처리하여 외부 간섭을 차단하는 것'}], answerId:'A' },
    { pid:'p2', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'알고리즘 편향의 원인, 실제 사례, 그리고 해결 방안'},{id:'B',text:'인공지능 학습 데이터의 수집 방법론과 통계적 분석 기법'},{id:'C',text:'채용 심사 과정의 전반적인 절차와 면접 평가 기준 소개'},{id:'D',text:'얼굴 인식 기술의 하드웨어 구성 요소와 카메라 성능 비교'}], answerId:'A' },
    { pid:'p3', sentIdx:0, prompt:'인공지능의 또 다른 중요한 논점으로 제시된 것은?',
      choices:[{id:'A',text:'인공지능의 책임 소재 문제가 중요한 논점으로 제시됨'},{id:'B',text:'인공지능의 에너지 효율성 향상이 핵심 과제로 제시됨'},{id:'C',text:'인공지능의 예술 창작 능력 개발이 주요 논점으로 등장함'},{id:'D',text:'인공지능의 감정 인식 기능 향상이 우선 과제로 제기됨'}], answerId:'A' },
    { pid:'p3', sentIdx:1, prompt:'자율 주행차 사고 시 책임 소재가 불명확한 이유는?',
      choices:[{id:'A',text:'운전자, 제조사, 개발자 중 누구에게 책임을 물을지 명확하지 않음'},{id:'B',text:'자율 주행차의 사고율이 극히 낮아 판례가 존재하지 않아서'},{id:'C',text:'모든 자율 주행차가 보험에 가입되어 있어 책임이 자동 처리되므로'},{id:'D',text:'자율 주행차 사고가 항상 자연재해에 의해 발생하기 때문에'}], answerId:'A' },
    { pid:'p3', sentIdx:2, prompt:'현행 법률 체계가 어려움을 겪는 이유는?',
      choices:[{id:'A',text:'인간의 행위를 전제로 설계되어 인공지능 판단에 적용하기 어려움'},{id:'B',text:'법률 자체가 너무 최신이어서 과거 사례에 적용할 수 없기 때문'},{id:'C',text:'각국의 법률이 완전히 통일되어 개별 국가 적용이 불필요하므로'},{id:'D',text:'법률 전문가들이 인공지능 기술을 이해하지 못하기 때문에'}], answerId:'A' },
    { pid:'p3', sentIdx:3, prompt:'인공지능 관련 법률의 대표적 사례로 언급된 것은?',
      choices:[{id:'A',text:'유럽 연합의 인공지능법이 대표적인 사례로 꼽힘'},{id:'B',text:'미국의 독점 금지법이 대표적인 사례로 언급됨'},{id:'C',text:'일본의 저작권법 개정이 대표적인 사례로 제시됨'},{id:'D',text:'한국의 개인정보보호법만이 유일한 관련 법률로 소개됨'}], answerId:'A' },
    { pid:'p3', sentIdx:4, prompt:'유럽 연합 인공지능법의 핵심 내용은?',
      choices:[{id:'A',text:'위험도에 따라 분류하고 높은 위험군에 엄격한 규제를 적용함'},{id:'B',text:'모든 인공지능 기술의 개발과 사용을 전면적으로 금지함'},{id:'C',text:'인공지능 개발 기업에 세금을 면제하여 기술 발전을 장려함'},{id:'D',text:'인공지능의 사용을 정부 기관에만 허용하는 독점적 규제임'}], answerId:'A' },
    { pid:'p3', sentIdx:5, prompt:'인공지능이 인류에게 유익한 도구가 되기 위한 조건은?',
      choices:[{id:'A',text:'기술 발전과 윤리적 기준 수립이 균형 있게 이루어지는 것'},{id:'B',text:'인공지능 기술을 특정 국가만 독점적으로 개발하는 것'},{id:'C',text:'윤리적 문제를 무시하고 기술 발전에만 집중하는 것'},{id:'D',text:'인공지능 연구를 완전히 중단하고 기존 기술만 활용하는 것'}], answerId:'A' },
    { pid:'p3', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'인공지능의 책임 소재 문제와 법적·제도적 대응 및 균형 발전의 필요성'},{id:'B',text:'자율 주행 자동차의 기술적 원리와 센서 장비의 작동 구조 설명'},{id:'C',text:'유럽 연합의 전체 법률 체계와 입법 과정에 대한 상세한 소개'},{id:'D',text:'인공지능 개발자의 윤리 교육 커리큘럼과 자격 제도에 관한 제안'}], answerId:'A' }
  ]);

  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      { id:'q1', prompt:'인공지능이 활용되는 구체적 분야로 언급된 것은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p1','음성 인식 비서')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q2', prompt:'인공지능 윤리에서 가장 빈번하게 제기되는 문제는 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p2','알고리즘 편향')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q3', prompt:'알고리즘 편향이 발생하는 근본 원인은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p2','학습 데이터에 특정 집단에 대한 편견이 포함')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q4', prompt:'채용 심사 인공지능에서 보고된 문제는 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p2','성별에 따라 불균형한 평가')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q5', prompt:'인공지능 관련 법률의 대표적 사례로 언급된 것은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p3','유럽 연합의 인공지능법')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q6', prompt:'인공지능이 유익한 도구가 되려면 무엇이 필요한가요?',
        answerRanges:[findRange(paragraphs,'p3','기술의 발전과 윤리적 기준의 수립이 균형 있게')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' }
    ]
  };

  return assembleFull({ dayIndex:69, subArea:'NONFICTION', paragraphs, intensive, recall, confirm });
}

// =============================================
// Day 70 - LITERATURE (문학)
// 주제: 이육사 「광야」 분석
// =============================================
function buildDay70() {
  const paragraphs = [
    {
      id: 'p1',
      text: '이육사는 일제 강점기에 활동한 저항 시인으로, 강인한 의지와 미래에 대한 확고한 신념을 노래한 것으로 알려져 있다. 그의 본명은 이원록이며, 수감 당시의 수인 번호 264에서 따온 육사라는 호를 사용하였다. 이육사는 독립운동에 직접 참여하여 여러 차례 투옥되었으며, 결국 1944년 베이징 감옥에서 옥사하여 생을 마감하였다. 그의 대표작 「광야」는 광활한 벌판을 배경으로 하여 암울한 현실을 초월하려는 의지와 미래에 대한 비전을 담고 있는 시이다. 이 시에서 화자는 까마득한 날에 하늘이 처음 열리던 원초적 시간부터 시작하여 광야에 서서 미래를 내다보는 웅장한 시적 공간을 구축한다. 이러한 거대한 시공간의 설정은 식민지 현실의 좁은 틀을 뛰어넘고자 하는 시인의 정신적 자유를 반영하는 것이라 할 수 있다.'
    },
    {
      id: 'p2',
      text: '「광야」의 핵심적 특징은 시간과 공간의 확대를 통한 초월적 세계관의 구현이다. 화자는 현재의 암울한 상황에 머무르지 않고 태초의 과거로부터 먼 미래에 이르기까지 시간의 폭을 극대화한다. 그리고 광야라는 무한히 넓은 공간을 배경으로 설정하여 좁고 답답한 현실의 제약에서 벗어나고자 하는 열망을 형상화한다. 특히 백마 타고 오는 초인이라는 표현은 미래에 도래할 이상적 인물 또는 광복의 날을 상징하는 것으로 해석되며, 암울한 시대 속에서도 희망을 놓지 않는 시인의 정신을 집약적으로 보여 준다. 이러한 초월적 시간 의식은 현실의 고통을 견디는 힘의 원천이 되는 동시에, 독자에게 더 나은 세계를 향한 의지를 불어넣는 역할을 한다.'
    },
    {
      id: 'p3',
      text: '이육사 시의 문학사적 가치는 저항 정신과 시적 형상화가 높은 수준에서 결합되어 있다는 점에서 찾을 수 있다. 같은 시기의 일부 저항 시가 선언적이고 구호적인 어조에 머무른 것과 달리, 이육사는 광야, 절정, 청포도 등의 작품에서 장엄한 자연 이미지와 상징을 활용하여 저항 의식을 예술적으로 승화시켰다. 「광야」에서 눈이 내리는 이미지는 시련과 정화를 동시에 의미하며, 순결한 새 세계의 도래를 예감하게 한다. 이처럼 이육사는 직접적 구호 대신 감각적 이미지를 통해 저항의 메시지를 전달함으로써 시적 완성도와 사상적 깊이를 모두 확보한 시인으로 평가받고 있다.'
    }
  ];

  const total = charLen(paragraphs);
  console.log(`  Day 70 지문 길이: ${total}자`);

  const intensive = buildTimeline(paragraphs, [
    { pid:'p1', sentIdx:0, prompt:'이육사에 대한 설명으로 적절한 것은?',
      choices:[{id:'A',text:'강인한 의지와 미래에 대한 확고한 신념을 노래한 저항 시인'},{id:'B',text:'농촌의 서정적 풍경을 주로 노래한 전원 시인'},{id:'C',text:'도시 문명의 발전상을 찬양한 모더니즘 시인'},{id:'D',text:'개인적 감상과 연애 감정을 주제로 삼은 낭만 시인'}], answerId:'A' },
    { pid:'p1', sentIdx:1, prompt:'이육사의 호가 유래한 것은?',
      choices:[{id:'A',text:'수감 당시의 수인 번호 264에서 따온 것'},{id:'B',text:'고향 마을의 지명에서 따온 것'},{id:'C',text:'어릴 때부터 사용하던 아명에서 유래한 것'},{id:'D',text:'스승이 지어 준 학명에서 비롯된 것'}], answerId:'A' },
    { pid:'p1', sentIdx:2, prompt:'이육사가 생을 마감한 경위로 적절한 것은?',
      choices:[{id:'A',text:'독립운동 참여로 투옥되어 1944년 베이징 감옥에서 옥사함'},{id:'B',text:'광복 이후 귀국하여 고향에서 병으로 사망함'},{id:'C',text:'해외 망명 생활 중 자연재해로 인해 사망함'},{id:'D',text:'해방 직후 문학 활동을 재개하다 과로로 쓰러짐'}], answerId:'A' },
    { pid:'p1', sentIdx:3, prompt:'「광야」에 담긴 핵심 내용으로 적절한 것은?',
      choices:[{id:'A',text:'암울한 현실을 초월하려는 의지와 미래에 대한 비전을 담은 시'},{id:'B',text:'농촌의 아름다운 자연 풍경을 감상적으로 묘사한 서정시'},{id:'C',text:'식민지 관료 체제를 구체적으로 비판한 사회 고발시'},{id:'D',text:'고향에 대한 그리움과 유년기 추억을 담은 회고적 작품'}], answerId:'A' },
    { pid:'p1', sentIdx:4, prompt:'화자가 구축하는 시적 공간의 특징은?',
      choices:[{id:'A',text:'원초적 시간부터 시작하여 광야에서 미래를 내다보는 웅장한 공간'},{id:'B',text:'좁은 방 안에서 홀로 명상하며 내면을 탐구하는 폐쇄적 공간'},{id:'C',text:'바다를 배경으로 항해의 여정을 은유하는 이국적 공간'},{id:'D',text:'도시의 거리를 걸으며 현대 문명을 관찰하는 일상적 공간'}], answerId:'A' },
    { pid:'p1', sentIdx:5, prompt:'거대한 시공간의 설정이 반영하는 것은?',
      choices:[{id:'A',text:'식민지 현실의 좁은 틀을 뛰어넘고자 하는 정신적 자유'},{id:'B',text:'과학 기술의 발전에 대한 낙관적 전망과 기대감'},{id:'C',text:'자연 풍경의 아름다움을 사실적으로 기록하려는 의도'},{id:'D',text:'고대 신화의 세계관을 그대로 재현하려는 문학적 시도'}], answerId:'A' },
    { pid:'p1', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'이육사의 생애와 「광야」의 핵심 주제 소개'},{id:'B',text:'일제 강점기 독립운동의 전개 과정에 대한 역사적 서술'},{id:'C',text:'한국 저항 시 전체의 흐름과 주요 유파에 관한 개괄'},{id:'D',text:'베이징 감옥의 수감 환경과 독립운동가 처우에 관한 보고'}], answerId:'A' },
    { pid:'p2', sentIdx:0, prompt:'「광야」의 핵심적 특징으로 제시된 것은?',
      choices:[{id:'A',text:'시간과 공간의 확대를 통한 초월적 세계관의 구현'},{id:'B',text:'일상적 소재를 통한 현실적 삶의 세밀한 묘사'},{id:'C',text:'역사적 사건을 시간 순서대로 나열하는 기록 방식'},{id:'D',text:'대화체를 활용한 극적 긴장감의 조성과 인물 갈등'}], answerId:'A' },
    { pid:'p2', sentIdx:1, prompt:'화자가 시간의 폭을 극대화하는 방식은?',
      choices:[{id:'A',text:'태초의 과거로부터 먼 미래에 이르기까지 확장함'},{id:'B',text:'하루의 시간대를 세밀하게 나누어 순간을 포착함'},{id:'C',text:'과거의 특정 역사적 사건만을 집중적으로 다룸'},{id:'D',text:'현재 시점에만 머물러 순간의 감각을 정밀하게 묘사함'}], answerId:'A' },
    { pid:'p2', sentIdx:2, prompt:'광야라는 공간이 형상화하는 열망은?',
      choices:[{id:'A',text:'좁고 답답한 현실의 제약에서 벗어나고자 하는 열망'},{id:'B',text:'고향의 정겨운 풍경으로 돌아가고 싶은 향수'},{id:'C',text:'도시 문명의 편의를 누리고자 하는 물질적 욕망'},{id:'D',text:'조용한 은둔 생활을 하며 세상과 단절하고 싶은 욕구'}], answerId:'A' },
    { pid:'p2', sentIdx:3, prompt:'백마 타고 오는 초인이 상징하는 것은?',
      choices:[{id:'A',text:'미래에 도래할 이상적 인물 또는 광복의 날을 상징함'},{id:'B',text:'과거의 영웅적 인물을 추모하는 역사적 회고의 상징'},{id:'C',text:'자연의 순수한 아름다움을 의인화한 낭만적 표현'},{id:'D',text:'전쟁의 공포와 파괴를 경고하는 묵시적 이미지'}], answerId:'A' },
    { pid:'p2', sentIdx:4, prompt:'초월적 시간 의식이 수행하는 역할은?',
      choices:[{id:'A',text:'현실의 고통을 견디는 힘의 원천이자 의지를 불어넣는 역할'},{id:'B',text:'독자에게 역사적 사실을 객관적으로 전달하는 교육적 역할'},{id:'C',text:'시의 분량을 늘려 형식적 완성도를 높이는 구조적 역할'},{id:'D',text:'과거의 실수를 반성하게 하는 교훈적 역할만을 수행함'}], answerId:'A' },
    { pid:'p2', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'「광야」의 시간·공간 확대 기법과 초월적 세계관 및 희망의 상징'},{id:'B',text:'일제 강점기 한국 문학의 전반적인 시대적 배경과 창작 환경'},{id:'C',text:'백마의 생태적 특성과 한국 전통 문화에서의 말의 상징적 의미'},{id:'D',text:'초인 사상의 철학적 기원과 니체 사상과의 비교 분석'}], answerId:'A' },
    { pid:'p3', sentIdx:0, prompt:'이육사 시의 문학사적 가치가 인정되는 이유는?',
      choices:[{id:'A',text:'저항 정신과 시적 형상화가 높은 수준에서 결합되어 있기 때문'},{id:'B',text:'당시 가장 많은 작품을 발표하여 양적 성과가 뛰어나기 때문'},{id:'C',text:'외국어로 번역되어 세계적으로 가장 널리 읽히기 때문'},{id:'D',text:'정치적 활동과 문학 활동을 완전히 분리하여 순수 예술을 추구했기 때문'}], answerId:'A' },
    { pid:'p3', sentIdx:1, prompt:'이육사가 저항 의식을 표현하는 방식의 특징은?',
      choices:[{id:'A',text:'장엄한 자연 이미지와 상징을 활용하여 예술적으로 승화시킴'},{id:'B',text:'일상어를 그대로 사용하여 구호적 어조로 직접 외침'},{id:'C',text:'풍자와 해학을 통해 식민 권력을 비꼬는 방식을 택함'},{id:'D',text:'외래어와 한문 투의 표현을 혼합하여 지식인적 권위를 드러냄'}], answerId:'A' },
    { pid:'p3', sentIdx:2, prompt:'「광야」에서 눈이 내리는 이미지가 의미하는 것은?',
      choices:[{id:'A',text:'시련과 정화를 동시에 의미하며 새 세계의 도래를 예감하게 함'},{id:'B',text:'겨울의 추위로 인한 고통과 생존의 위협만을 상징함'},{id:'C',text:'자연의 순환 법칙에 따른 계절 변화를 객관적으로 묘사함'},{id:'D',text:'화자의 노년기를 은유하여 인생의 종말을 암시하는 소재'}], answerId:'A' },
    { pid:'p3', sentIdx:3, prompt:'이육사가 저항 메시지를 전달하는 방식은?',
      choices:[{id:'A',text:'직접적 구호 대신 감각적 이미지를 통해 전달함'},{id:'B',text:'논리적 논증을 통해 학술적으로 주장을 펼침'},{id:'C',text:'타인의 발언을 인용하여 간접적으로 의견을 제시함'},{id:'D',text:'일기 형식을 통해 개인적 경험만을 기록하는 방식'}], answerId:'A' },
    { pid:'p3', wholeP:true, prompt:'이 문단의 중심 내용으로 가장 적절한 것은?',
      choices:[{id:'A',text:'이육사 시의 문학사적 가치와 저항 의식의 예술적 승화 방식'},{id:'B',text:'「청포도」와 「절정」의 상세한 줄거리 요약과 비교 분석'},{id:'C',text:'일제 강점기 저항 시인들의 명단과 대표 작품 목록 정리'},{id:'D',text:'눈의 결정 구조와 기상 조건에 따른 강설 패턴에 관한 설명'}], answerId:'A' }
  ]);

  const recall = buildRecallCards(paragraphs, 8);

  const confirm = {
    questions: [
      { id:'q1', prompt:'이육사의 호가 유래한 것은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p1','수인 번호 264')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q2', prompt:'이육사가 생을 마감한 장소는 어디인가요?',
        answerRanges:[findRange(paragraphs,'p1','베이징 감옥')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q3', prompt:'「광야」에서 시간의 폭을 극대화하는 방식은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p2','태초의 과거로부터 먼 미래에 이르기까지')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q4', prompt:'백마 타고 오는 초인이 상징하는 것은 무엇인가요?',
        answerRanges:[findRange(paragraphs,'p2','광복의 날을 상징')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q5', prompt:'「광야」에서 눈이 내리는 이미지가 의미하는 것은?',
        answerRanges:[findRange(paragraphs,'p3','시련과 정화를 동시에 의미')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' },
      { id:'q6', prompt:'이육사가 저항 메시지를 전달하는 방식의 특징은?',
        answerRanges:[findRange(paragraphs,'p3','직접적 구호 대신 감각적 이미지를 통해')],
        scoring:{correctDeltaSec:30,wrongDeltaSec:-45}, revealOnWrong:true, answerMatchMode:'ANY' }
    ]
  };

  return assembleFull({ dayIndex:70, subArea:'LITERATURE', paragraphs, intensive, recall, confirm });
}

// =============================================
// 메인 실행
// =============================================
function main() {
  const ROOT = path.resolve(__dirname, '..');
  const BATCH_PATH = path.join(ROOT, 'generated', 'daily-batch-reading-russell1.json');
  const STATIC_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading', 'russell1');

  console.log('=== 러셀1 Day 66~70 콘텐츠 빌더 시작 ===\n');

  const day66 = buildDay66();
  const day67 = buildDay67();
  const day68 = buildDay68();
  const day69 = buildDay69();
  const day70 = buildDay70();

  const contents = [
    { day: 66, content: day66, index: 65 },
    { day: 67, content: day67, index: 66 },
    { day: 68, content: day68, index: 67 },
    { day: 69, content: day69, index: 68 },
    { day: 70, content: day70, index: 69 }
  ];

  // 검증
  console.log('\n=== 검증 ===');
  let hasError = false;

  for (const { day, content } of contents) {
    const paras = content.payload.passage.paragraphs;
    const total = charLen(paras);
    const recallCards = content.payload.recall.cards.length;
    const confirmQs = content.payload.confirm.questions.length;
    const timelineSteps = content.payload.intensive.timeline.length;

    console.log(`\n  Day ${day}:`);
    console.log(`    지문 길이: ${total}자 (목표: 1050~1150)`);
    console.log(`    타임라인 스텝: ${timelineSteps}개`);
    console.log(`    복기 카드: ${recallCards}장 (목표: 8)`);
    console.log(`    확인 문항: ${confirmQs}개 (목표: 5~8)`);
    console.log(`    timeLimitSec: ${content.timeLimitSec}`);
    console.log(`    schoolGradeRange: ${JSON.stringify(content.schoolGradeRange)}`);
    console.log(`    subArea: ${content.subArea}`);
    console.log(`    contentId: ${content.contentId}`);

    if (total < 1050 || total > 1150) {
      console.log(`    [경고] 지문 길이가 목표 범위(1050~1150)를 벗어남!`);
      hasError = true;
    }
    if (recallCards !== 8) {
      console.log(`    [오류] 복기 카드가 8장이 아님!`);
      hasError = true;
    }
    if (confirmQs < 5 || confirmQs > 8) {
      console.log(`    [오류] 확인 문항이 5~8 범위를 벗어남!`);
      hasError = true;
    }
    if (content.timeLimitSec !== 480) {
      console.log(`    [오류] timeLimitSec이 480이 아님!`);
      hasError = true;
    }
    if (content.schoolGradeRange.min !== 7 || content.schoolGradeRange.max !== 8) {
      console.log(`    [오류] schoolGradeRange가 {min:7,max:8}이 아님!`);
      hasError = true;
    }
    if (content.payload.recall.seedPenalty !== 1) {
      console.log(`    [오류] seedPenalty가 1이 아님!`);
      hasError = true;
    }
    for (const q of content.payload.confirm.questions) {
      if (q.answerMatchMode !== 'ANY') {
        console.log(`    [오류] ${q.id} answerMatchMode가 ANY가 아님!`);
        hasError = true;
      }
      if (q.revealOnWrong !== true) {
        console.log(`    [오류] ${q.id} revealOnWrong가 true가 아님!`);
        hasError = true;
      }
    }
  }

  if (hasError) {
    console.log('\n[경고] 일부 검증 실패 항목이 있습니다. 출력을 계속합니다.');
  } else {
    console.log('\n  모든 검증 통과!');
  }

  // 1) static 파일 출력
  console.log('\n=== static 파일 생성 ===');
  for (const { day, content } of contents) {
    const dayStr = String(day).padStart(3, '0');
    const filePath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`  ${filePath} 생성 완료`);
  }

  // 2) 배치 파일 업데이트
  console.log('\n=== 배치 파일 업데이트 ===');
  const batch = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));

  for (const { day, content, index } of contents) {
    const batchItem = wrapBatchItem(day, content.subArea, content);
    batch.items[index] = batchItem;
    console.log(`  items[${index}] (Day ${day}) 교체 완료`);
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batch, null, 2), 'utf8');
  console.log(`  ${BATCH_PATH} 저장 완료`);

  console.log('\n=== 작업 완료 ===');
}

main();
