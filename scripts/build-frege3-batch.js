const fs = require('fs');
const path = require('path');

const BASE = 'C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지';
const LEVEL = 'frege3';
const LEVEL_ID = 'FREGE_3';
const LEVEL_LABEL = '프레게 3';
const GRADE = { min: 6, max: 7 };
const TARGET_LEN = 1000; // ±50
const TIME_LIMIT = 480;
const AREA_KR = { NONFICTION: '비문학', LITERATURE: '문학' };

function findRange(paras, pid, search) {
  const p = paras.find(x => x.id === pid);
  const s = p.text.indexOf(search);
  if (s === -1) throw new Error(`NOT FOUND in ${pid}: "${search.substring(0,40)}"`);
  return { paragraphId: pid, start: s, end: s + search.length };
}
function paraRange(paras, pid) {
  const p = paras.find(x => x.id === pid);
  return { paragraphId: pid, start: 0, end: p.text.length };
}
function splitSents(text) {
  const r = []; let c = '';
  for (let i = 0; i < text.length; i++) {
    c += text[i];
    if ('.?!'.includes(text[i]) && (i === text.length-1 || text[i+1] === ' ')) {
      r.push(c.trim()); c = '';
      if (text[i+1] === ' ') i++;
    }
  }
  if (c.trim()) r.push(c.trim());
  return r;
}

function buildDay(dayNum, subArea, paras, recallTexts, confirmQs, sentQuestions, summaryQuestions) {
  const totalLen = paras.reduce((s,p) => s+p.text.length, 0);
  const timeline = [];
  let sn = 1;

  for (const para of paras) {
    const sents = splitSents(para.text);
    const pqs = sentQuestions[para.id] || [];

    sents.forEach((sent, i) => {
      const q = pqs[i] || { prompt: "이 문장에서 알 수 있는 내용은?", choices: [
        {id:"A",text:"글의 주제를 뒷받침하는 내용이다"},{id:"B",text:"앞 문장과 반대되는 내용이다"},
        {id:"C",text:"글의 흐름과 관련 없는 내용이다"},{id:"D",text:"다음 문단을 미리 요약한다"}
      ], answerId: "A" };
      timeline.push({
        stepId: `s${sn++}`,
        highlight: { ranges: [findRange(paras, para.id, sent)] },
        question: { prompt: q.prompt, choices: q.choices, answerId: q.answerId,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true } }
      });
    });
    // 문단 전체 중심내용
    const sq = summaryQuestions[para.id] || { prompt: "이 문단의 중심 내용은?", choices: [
      {id:"A",text:"문단의 핵심 내용을 요약한 것"},{id:"B",text:"관련 없는 다른 주제"},
      {id:"C",text:"다음 문단 예고"},{id:"D",text:"이전 문단 반복"}
    ], answerId: "A" };
    timeline.push({
      stepId: `s${sn++}`,
      highlight: { ranges: [paraRange(paras, para.id)] },
      question: { prompt: sq.prompt, choices: sq.choices, answerId: sq.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true } }
    });
  }

  const recall = {
    cards: recallTexts.map((t,i) => ({ id: `c${i+1}`, text: t })),
    correctOrder: recallTexts.map((_,i) => `c${i+1}`),
    seedPenalty: 1
  };

  const confirm = {
    questions: confirmQs.map((q,i) => ({
      id: `q${i+1}`, prompt: q.prompt, answerText: q.answerText,
      answerMatchMode: q.mode || "ANY",
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }))
  };

  const contentId = `dr-f3-${String(dayNum).padStart(3,'0')}`;
  const title = `일일 독해(${LEVEL_LABEL}) Day ${dayNum} ${AREA_KR[subArea]}`;

  return {
    wrapper: {
      content_type: "DAILY_READING", level_id: LEVEL_ID, area: "READING",
      sub_area: subArea, day_index: dayNum, module_key: "reading_training", schema_version: "1.0",
      content: {
        contentId, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
        title, description: "일일 독해 - 정독·복기·확인", targetLevel: LEVEL_ID,
        schoolGradeRange: GRADE, area: "READING", subArea: subArea,
        competencies: ["READING"], tags: ["daily"],
        access: { mode: "FREE" }, seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
        timeLimitSec: TIME_LIMIT, assets: {},
        payload: { passage: { format: "TEXT", paragraphs: paras }, intensive: { timeline }, recall, confirm }
      }
    },
    stats: { len: totalLen, steps: timeline.length, recall: recallTexts.length, confirm: confirmQs.length }
  };
}

// ============================
// Day 12 (LITERATURE) - 할머니의 장독대
// ============================
const d12 = buildDay(12, "LITERATURE", [
  { id: "p1", text: "할머니의 장독대 앞에는 낡은 나무 의자가 하나 놓여 있었다. 페인트가 벗겨져 맨살이 드러난 그 의자는 비바람에도 꿋꿋이 제자리를 지켰다. 어린 시절 나는 그 의자에 앉아 할머니가 된장을 젓는 모습을 지켜보곤 했다. 할머니의 팔은 나무 주걱과 하나가 된 듯 느리고 일정하게 원을 그렸다. 할머니는 장을 저을 때마다 혼잣말처럼 중얼거렸는데, 그것은 장맛이 좋아지라는 기원이기도 했고 돌아가신 할아버지에게 보내는 안부이기도 했다. 나는 그 중얼거림이 무서워서 가끔 귀를 막았지만, 할머니의 손이 내 머리를 쓰다듬으면 금세 안심이 되었다." },
  { id: "p2", text: "어느 여름, 갑작스러운 폭우로 장독 하나가 깨졌다. 새벽부터 쏟아진 비가 마당을 물바다로 만들었고, 독에서 흘러나온 간장이 빗물과 뒤섞여 흙빛 강을 이루었다. 할머니는 쏟아진 간장을 아무 말 없이 바라보더니 조용히 깨진 조각을 주워 담았다. 그날 저녁 할머니는 평소보다 오래 부엌에 서 계셨다. 나는 할머니의 눈가가 젖어 있는 것을 보았지만 모른 척했다. 다음 날 아침, 할머니는 새 독에 소금물을 붓고 다시 장을 담그기 시작했다. 할머니는 잃어버린 것을 슬퍼하되 오래 머무르지 않는 사람이었다." },
  { id: "p3", text: "지금 나는 도시의 아파트에서 마트에서 산 된장을 먹는다. 편리하지만 어딘가 허전한 맛이다. 할머니의 된장에는 시간과 정성, 그리고 기다림이 들어 있었다. 계절이 바뀔 때마다 독을 열어 살피고, 햇살 좋은 날에는 뚜껑을 열어 바람을 쐬어 주던 그 과정 자체가 맛의 일부였다. 그렇게 일 년 넘게 익힌 된장에서는 볕 냄새와 바람 냄새가 은은하게 배어 나왔다. 나는 문득 할머니의 나무 의자가 아직 그 자리에 있을지 궁금해진다. 돌아갈 수 없는 시간 속에서 장독대의 기억만이 짠하게 남아 있다." }
], [
  "장독대 앞 나무 의자에서 글쓴이는 할머니가 된장을 젓는 모습을 지켜보곤 했다.",
  "할머니는 장을 저으며 장맛을 비는 기원과 돌아가신 할아버지를 향한 안부를 중얼거렸다.",
  "어느 여름 폭우에 장독이 깨져 간장이 쏟아졌지만, 할머니는 조용히 깨진 조각을 수습했다.",
  "그날 저녁 할머니의 눈가가 젖어 있었으나 글쓴이는 모른 척했다.",
  "다음 날 할머니는 새 독에 다시 장을 담그며 슬픔에 오래 머물지 않는 모습을 보였다.",
  "현재 글쓴이는 도시에서 마트 된장을 먹지만 할머니의 된장만큼 깊은 맛은 느끼지 못한다.",
  "할머니의 된장에는 계절마다 살피고 바람을 쐬어 주던 정성과 기다림이 담겨 있었다.",
  "돌아갈 수 없는 시간 속에서 장독대의 기억만이 짠하게 남아 글쓴이를 그립게 한다."
], [
  { prompt: "글쓴이가 어린 시절 할머니를 관찰하던 장소는?", answerText: "장독대 앞 나무 의자" },
  { prompt: "할머니가 장을 저으며 중얼거린 두 가지 의미는?", answerText: "장맛을 비는 기원과 돌아가신 할아버지에 대한 안부" },
  { prompt: "폭우로 장독이 깨진 뒤 할머니는 어떤 태도를 보였나요?", answerText: "말없이 깨진 조각을 주워 담고 다음 날 다시 장을 담그기 시작했다" },
  { prompt: "현재 글쓴이가 느끼는 마트 된장의 한계는?", answerText: "편리하지만 시간과 정성이 빠져 허전한 맛" },
  { prompt: "할머니의 된장 맛을 특별하게 만든 과정은?", answerText: "계절마다 독을 열어 살피고 햇살 좋은 날 바람을 쐬어 주는 것" },
  { prompt: "이 글 전체를 관통하는 글쓴이의 감정은?", answerText: "할머니와의 추억에 대한 그리움" }
], {
  p1: [
    { prompt: "장독대 앞에 놓인 물건의 역할은?", choices: [{id:"A",text:"글쓴이가 할머니를 관찰하는 자리"},{id:"B",text:"할머니가 장독을 운반하는 도구"},{id:"C",text:"비바람을 막아 주는 지붕 구실"},{id:"D",text:"할아버지가 생전에 쉬던 정원 벤치"}], answerId:"A" },
    { prompt: "나무 의자의 외관에서 알 수 있는 것은?", choices: [{id:"A",text:"오랜 세월을 견뎌 온 물건이라는 점"},{id:"B",text:"최근에 새로 산 가구라는 점"},{id:"C",text:"할머니가 직접 만든 것이라는 점"},{id:"D",text:"실내에서만 쓰던 것이라는 점"}], answerId:"A" },
    { prompt: "의자에 앉은 글쓴이가 주로 한 일은?", choices: [{id:"A",text:"할머니가 된장 젓는 모습 지켜보기"},{id:"B",text:"혼자서 숙제하기"},{id:"C",text:"동네 친구들과 놀기"},{id:"D",text:"할아버지와 이야기 나누기"}], answerId:"A" },
    { prompt: "할머니가 장 젓는 동작의 특징은?", choices: [{id:"A",text:"느리고 일정하게 원을 그렸다"},{id:"B",text:"빠르고 힘차게 휘저었다"},{id:"C",text:"멈추었다 시작하기를 반복했다"},{id:"D",text:"양손을 번갈아 썼다"}], answerId:"A" },
    { prompt: "할머니의 중얼거림에 담긴 의미는?", choices: [{id:"A",text:"이웃 안부 인사 연습"},{id:"B",text:"장맛 기원과 고인에 대한 그리움"},{id:"C",text:"된장 담그는 법을 가르치는 것"},{id:"D",text:"외로움을 하소연하는 것"}], answerId:"B" },
    { prompt: "글쓴이가 중얼거림에 보인 반응은?", choices: [{id:"A",text:"호기심이 생겨 뜻을 물었다"},{id:"B",text:"무섭게 느꼈지만 손길에 안심했다"},{id:"C",text:"함께 따라 하며 즐거워했다"},{id:"D",text:"이해할 수 없어 자리를 떠났다"}], answerId:"B" }
  ],
  p2: [
    { prompt: "장독대에 벌어진 사건은?", choices: [{id:"A",text:"폭우로 장독이 깨져 간장이 쏟아졌다"},{id:"B",text:"빗물이 들어가 장맛이 변했다"},{id:"C",text:"지붕이 무너져 독이 묻혔다"},{id:"D",text:"할머니가 비를 맞아 아팠다"}], answerId:"A" },
    { prompt: "간장과 빗물이 만든 장면의 분위기는?", choices: [{id:"A",text:"오랜 정성이 사라지는 안타까움"},{id:"B",text:"비 오는 날의 낭만"},{id:"C",text:"물놀이하는 즐거움"},{id:"D",text:"재해에 대한 공포"}], answerId:"A" },
    { prompt: "쏟아진 간장 앞 할머니의 태도는?", choices: [{id:"A",text:"크게 화를 내며 탓했다"},{id:"B",text:"말없이 깨진 조각을 수습했다"},{id:"C",text:"이웃에게 도움 요청했다"},{id:"D",text:"간장을 다시 독에 부으려 했다"}], answerId:"B" },
    { prompt: "저녁에 부엌에 오래 있었다는 것은?", choices: [{id:"A",text:"새 요리를 개발하고 있었다"},{id:"B",text:"잃은 장에 대한 슬픔을 삼키고 있었다"},{id:"C",text:"가족 모임 음식을 준비했다"},{id:"D",text:"부엌 청소를 하고 있었다"}], answerId:"B" },
    { prompt: "젖은 눈가를 모른 척한 이유는?", choices: [{id:"A",text:"할머니 감정을 건드리기 싫은 배려"},{id:"B",text:"슬픔에 관심이 없었기 때문"},{id:"C",text:"할머니가 미리 당부했기 때문"},{id:"D",text:"다른 일에 정신이 팔려서"}], answerId:"A" },
    { prompt: "다음 날 행동에서 드러나는 할머니의 성격은?", choices: [{id:"A",text:"슬픔에 오래 머물지 않는 회복력"},{id:"B",text:"과거를 잊는 무심함"},{id:"C",text:"손실 만회를 위한 경쟁심"},{id:"D",text:"도움 없이 못 움직이는 의존성"}], answerId:"A" },
    { prompt: "마지막 문장이 문단에서 하는 역할은?", choices: [{id:"A",text:"할머니의 성품을 한 문장으로 요약"},{id:"B",text:"다음 문단 사건을 미리 알림"},{id:"C",text:"글쓴이 의견에 반대 근거 제시"},{id:"D",text:"장독 깨짐 원인을 분석"}], answerId:"A" }
  ],
  p3: [
    { prompt: "현재 글쓴이의 생활은?", choices: [{id:"A",text:"마트 된장을 사 먹는 도시 생활"},{id:"B",text:"할머니와 함께 된장을 담근다"},{id:"C",text:"시골에서 전통 방식으로 산다"},{id:"D",text:"된장을 전혀 먹지 않는다"}], answerId:"A" },
    { prompt: "'허전한 맛'에서 빠진 것은?", choices: [{id:"A",text:"정성을 들여 담그는 과정의 가치"},{id:"B",text:"비싼 재료의 고급 맛"},{id:"C",text:"화학 첨가물의 감칠맛"},{id:"D",text:"대량 생산의 균일한 품질"}], answerId:"A" },
    { prompt: "할머니 된장의 특별한 요인은?", choices: [{id:"A",text:"계절마다 살피고 바람 쐬어 주는 과정"},{id:"B",text:"특별한 비법 재료"},{id:"C",text:"오래된 독의 희귀한 재질"},{id:"D",text:"이웃과 함께 만드는 공동 작업"}], answerId:"A" },
    { prompt: "과정 자체가 맛의 일부라는 것은?", choices: [{id:"A",text:"정성이 담긴 숙성이 맛을 만든다는 뜻"},{id:"B",text:"된장 맛은 재료만으로 결정된다는 뜻"},{id:"C",text:"공장 생산이 더 맛있다는 뜻"},{id:"D",text:"빠르게 담글수록 좋다는 뜻"}], answerId:"A" },
    { prompt: "된장에서 배어 나온 냄새의 의미는?", choices: [{id:"A",text:"오랜 시간 자연 속 숙성의 상징"},{id:"B",text:"인공 향료 첨가의 결과"},{id:"C",text:"시골 대기 오염 상태"},{id:"D",text:"오래되어 상한 음식 냄새"}], answerId:"A" },
    { prompt: "나무 의자를 떠올리는 까닭은?", choices: [{id:"A",text:"추억이 깃든 상징적 대상이라서"},{id:"B",text:"골동품 가치가 있어서"},{id:"C",text:"직접 만들고 싶은 취미라서"},{id:"D",text:"이사 때 못 가져온 게 아쉬워서"}], answerId:"A" },
    { prompt: "마지막 문장의 정서는?", choices: [{id:"A",text:"돌아갈 수 없는 과거에 대한 그리움"},{id:"B",text:"미래에 대한 두려움"},{id:"C",text:"도시 생활에 대한 분노"},{id:"D",text:"시골로 돌아가겠다는 결심"}], answerId:"A" }
  ]
}, {
  p1: { prompt: "첫째 문단의 중심 내용은?", choices: [{id:"A",text:"장독대 앞 의자에서 할머니와 보낸 어린 날의 기억"},{id:"B",text:"할머니의 된장 사업 성공기"},{id:"C",text:"장독대 만드는 기술 설명"},{id:"D",text:"할아버지와 할머니의 갈등"}], answerId:"A" },
  p2: { prompt: "둘째 문단의 중심 내용은?", choices: [{id:"A",text:"폭우로 장독이 깨졌으나 슬픔을 딛고 다시 장을 담그는 모습"},{id:"B",text:"폭우 피해를 줄이기 위한 관리법"},{id:"C",text:"이웃과 장독대를 복구하는 협력 이야기"},{id:"D",text:"깨진 장독 수리 전통 기술 설명"}], answerId:"A" },
  p3: { prompt: "셋째 문단의 중심 내용은?", choices: [{id:"A",text:"도시 생활 속에서 할머니의 정성과 추억을 그리워하는 마음"},{id:"B",text:"마트 된장 품질 비판"},{id:"C",text:"시골로 돌아가는 구체적 계획"},{id:"D",text:"전통 된장 제조법 전수 교육"}], answerId:"A" }
});

// ============================
// Day 13 (NONFICTION) - 빛의 굴절
// ============================
const d13 = buildDay(13, "NONFICTION", [
  { id: "p1", text: "빛은 직진하는 성질을 가지고 있지만, 서로 다른 물질의 경계면을 만나면 진행 방향이 꺾인다. 이 현상을 빛의 굴절이라 부른다. 예를 들어 물컵에 빨대를 넣으면 빨대가 꺾여 보이는데, 이것은 공기와 물의 경계에서 빛이 방향을 바꾸기 때문이다. 굴절이 일어나는 까닭은 빛의 속도가 물질마다 다르기 때문이다. 빛은 밀도가 낮은 물질에서 높은 물질로 들어갈 때 속도가 느려지면서 경계면 쪽으로 꺾이고, 반대의 경우에는 경계면에서 멀어지는 쪽으로 꺾인다." },
  { id: "p2", text: "굴절의 정도는 두 물질 사이의 굴절률 차이에 의해 결정된다. 굴절률이란 진공에서의 빛의 속도를 해당 물질에서의 빛의 속도로 나눈 값으로, 물질이 빛을 얼마나 느리게 하는지를 나타낸다. 물의 굴절률은 약 1.33이고 유리는 약 1.5인데, 이는 유리가 물보다 빛을 더 많이 꺾는다는 뜻이다. 다이아몬드의 굴절률은 2.42로 매우 높아 빛이 내부에서 여러 번 반사되면서 특유의 찬란한 빛을 만들어 낸다." },
  { id: "p3", text: "빛의 굴절은 자연과 일상에서 다양하게 관찰된다. 아지랑이는 지면 근처의 뜨거운 공기와 위쪽의 차가운 공기 사이에서 빛이 굴절되어 생기는 현상이다. 무지개 역시 빗방울 속에서 빛이 굴절과 반사를 거치며 색깔별로 분리되어 나타난다. 안경이나 카메라 렌즈도 빛의 굴절을 이용하여 초점을 맞추는 도구이다. 이처럼 굴절 원리를 이해하면 우리 주변의 여러 광학 현상을 과학적으로 설명할 수 있고, 이를 기술에 응용할 수도 있다." }
], [
  "빛은 직진하지만 서로 다른 물질의 경계면에서 방향이 꺾이며, 이를 굴절이라 한다.",
  "굴절이 일어나는 이유는 물질마다 빛의 속도가 다르기 때문이다.",
  "굴절률은 물질이 빛을 얼마나 느리게 하는지를 나타내는 수치이다.",
  "물보다 유리가, 유리보다 다이아몬드가 굴절률이 높아 빛을 더 많이 꺾는다.",
  "아지랑이는 뜨거운 공기와 차가운 공기 사이에서 빛이 굴절되어 생기는 현상이다.",
  "무지개는 빗방울 속에서 빛이 굴절·반사되며 색깔별로 분리되어 나타난다.",
  "안경과 카메라 렌즈는 빛의 굴절 원리를 이용해 초점을 맞추는 도구이다.",
  "굴절을 이해하면 자연의 광학 현상을 설명하고 기술에 응용할 수 있다."
], [
  { prompt: "빛이 방향을 바꾸는 현상을 무엇이라 부르나요?", answerText: "빛의 굴절" },
  { prompt: "빛의 굴절이 일어나는 근본 원인은?", answerText: "물질마다 빛의 속도가 다르기 때문" },
  { prompt: "굴절률이란 어떤 값인가요?", answerText: "진공에서의 빛의 속도를 해당 물질에서의 빛의 속도로 나눈 값" },
  { prompt: "다이아몬드가 찬란하게 빛나는 까닭은?", answerText: "굴절률이 매우 높아 빛이 내부에서 여러 번 반사되기 때문" },
  { prompt: "아지랑이가 생기는 원리는?", answerText: "지면 근처 뜨거운 공기와 위쪽 차가운 공기 사이에서 빛이 굴절됨" },
  { prompt: "안경이나 카메라 렌즈가 이용하는 과학 원리는?", answerText: "빛의 굴절" }
], {
  p1: [
    { prompt: "빛의 기본 성질은?", choices: [{id:"A",text:"직진하는 성질을 가진다"},{id:"B",text:"항상 곡선으로 이동한다"},{id:"C",text:"물질에 관계없이 같은 속도다"},{id:"D",text:"경계면에서 멈추어 버린다"}], answerId:"A" },
    { prompt: "빛의 굴절이란?", choices: [{id:"A",text:"물질 경계에서 진행 방향이 꺾이는 현상"},{id:"B",text:"빛이 사라지는 현상"},{id:"C",text:"빛이 반사되어 돌아오는 현상"},{id:"D",text:"빛이 색깔별로 분리되는 현상"}], answerId:"A" },
    { prompt: "빨대가 꺾여 보이는 이유는?", choices: [{id:"A",text:"공기와 물 경계에서 빛이 방향을 바꿔서"},{id:"B",text:"빨대가 실제로 구부러져서"},{id:"C",text:"물이 빨대를 누르기 때문에"},{id:"D",text:"눈의 착각으로 인한 것이다"}], answerId:"A" },
    { prompt: "굴절이 일어나는 근본 원인은?", choices: [{id:"A",text:"물질마다 빛의 속도가 다르기 때문"},{id:"B",text:"빛이 중력의 영향을 받기 때문"},{id:"C",text:"물질 경계의 온도 차이 때문"},{id:"D",text:"빛의 색깔이 바뀌기 때문"}], answerId:"A" },
    { prompt: "밀도가 높은 물질로 들어갈 때 빛은?", choices: [{id:"A",text:"속도가 느려지며 경계면 쪽으로 꺾인다"},{id:"B",text:"속도가 빨라지며 직진한다"},{id:"C",text:"경계면에서 반사되어 돌아온다"},{id:"D",text:"완전히 흡수되어 사라진다"}], answerId:"A" }
  ],
  p2: [
    { prompt: "굴절의 정도를 결정하는 요인은?", choices: [{id:"A",text:"두 물질 사이의 굴절률 차이"},{id:"B",text:"빛의 색깔"},{id:"C",text:"물질의 온도 차이"},{id:"D",text:"물질의 무게"}], answerId:"A" },
    { prompt: "굴절률의 정의는?", choices: [{id:"A",text:"진공 빛 속도를 물질 빛 속도로 나눈 값"},{id:"B",text:"물질의 밀도를 부피로 나눈 값"},{id:"C",text:"빛의 세기를 거리로 나눈 값"},{id:"D",text:"반사각과 입사각의 비율"}], answerId:"A" },
    { prompt: "유리가 물보다 빛을 더 많이 꺾는 이유는?", choices: [{id:"A",text:"유리의 굴절률이 물보다 높기 때문"},{id:"B",text:"유리가 물보다 가볍기 때문"},{id:"C",text:"유리가 투명하기 때문"},{id:"D",text:"유리의 온도가 더 높기 때문"}], answerId:"A" },
    { prompt: "다이아몬드가 찬란하게 빛나는 이유는?", choices: [{id:"A",text:"굴절률이 매우 높아 빛이 내부에서 여러 번 반사됨"},{id:"B",text:"다이아몬드 자체가 빛을 발산하기 때문"},{id:"C",text:"표면에 특수 코팅이 되어 있기 때문"},{id:"D",text:"보석 가게 조명이 강하기 때문"}], answerId:"A" }
  ],
  p3: [
    { prompt: "아지랑이가 생기는 원리는?", choices: [{id:"A",text:"뜨거운 공기와 차가운 공기 사이 빛 굴절"},{id:"B",text:"지면에서 수증기가 증발하는 현상"},{id:"C",text:"바람에 의해 먼지가 날리는 현상"},{id:"D",text:"구름이 지면 가까이 내려오는 것"}], answerId:"A" },
    { prompt: "무지개가 나타나는 과정은?", choices: [{id:"A",text:"빗방울 속에서 빛이 굴절·반사하며 색 분리"},{id:"B",text:"구름이 특정 색깔만 통과시킴"},{id:"C",text:"태양열에 의해 하늘 색이 변함"},{id:"D",text:"비가 그친 뒤 먼지가 색을 띠는 것"}], answerId:"A" },
    { prompt: "안경과 카메라 렌즈의 공통 원리는?", choices: [{id:"A",text:"빛의 굴절을 이용해 초점을 맞춤"},{id:"B",text:"빛을 완전히 차단하여 보호함"},{id:"C",text:"빛의 색깔을 분리하여 보여 줌"},{id:"D",text:"빛을 증폭하여 밝게 만듦"}], answerId:"A" },
    { prompt: "글쓴이가 굴절을 설명하는 궁극적 목적은?", choices: [{id:"A",text:"원리를 알면 현상 설명과 기술 응용 가능"},{id:"B",text:"빛의 굴절은 위험하니 피해야 한다"},{id:"C",text:"굴절은 과학자만 연구할 수 있다"},{id:"D",text:"자연 현상은 설명할 수 없다"}], answerId:"A" }
  ]
}, {
  p1: { prompt: "첫째 문단의 중심 내용은?", choices: [{id:"A",text:"빛의 굴절 현상과 그 원인 설명"},{id:"B",text:"물컵 실험의 구체적 방법 안내"},{id:"C",text:"빛의 반사 현상에 대한 소개"},{id:"D",text:"빛의 속도를 측정하는 방법"}], answerId:"A" },
  p2: { prompt: "둘째 문단의 중심 내용은?", choices: [{id:"A",text:"굴절률의 개념과 물질별 차이 설명"},{id:"B",text:"다이아몬드의 채굴 과정 소개"},{id:"C",text:"물과 유리의 제조 방법 비교"},{id:"D",text:"진공 상태를 만드는 기술 설명"}], answerId:"A" },
  p3: { prompt: "셋째 문단의 중심 내용은?", choices: [{id:"A",text:"일상과 자연에서 관찰되는 굴절 현상의 예시"},{id:"B",text:"아지랑이를 관측하는 과학 장비 안내"},{id:"C",text:"안경을 만드는 구체적 공정 설명"},{id:"D",text:"무지개의 전설과 문화적 의미"}], answerId:"A" }
});

// ============================
// Day 14 (LITERATURE) - 도서관의 비밀
// ============================
const d14 = buildDay(14, "LITERATURE", [
  { id: "p1", text: "학교 도서관 한쪽 구석에는 아무도 열어 보지 않는 유리 진열장이 하나 있었다. 그 안에는 표지가 너덜너덜한 책 한 권이 세워져 있었고, 옆에 손으로 쓴 쪽지가 놓여 있었다. '이 책을 끝까지 읽은 사람은 아직 없습니다.' 나는 호기심이 생겨 사서 선생님께 그 책을 빌릴 수 있느냐고 여쭈었다. 선생님은 잠시 망설이더니 열쇠를 꺼내 진열장 문을 열어 주셨다. 선생님은 나에게 다 읽으면 반드시 돌려달라고 신신당부하셨다." },
  { id: "p2", text: "책의 첫 장을 넘기자 먼지가 작은 구름처럼 일었다. 이야기는 오래전 이 학교에서 지내던 한 학생에 관한 것이었다. 그 학생은 몸이 약해 운동장에 나가지 못했고, 쉬는 시간마다 도서관에서 책을 읽었다. 어느 날 그 학생이 도서관 벽 뒤에 숨겨진 작은 방을 발견했다는 내용이 나왔다. 방 안에는 이전 졸업생들이 남긴 쪽지와 그림이 가득했고, 학생은 자신도 무언가를 남기기로 결심했다. 나는 점점 그 학생이 누구인지 궁금해졌다." },
  { id: "p3", text: "이야기 속 학생은 매일 그 비밀 방에 자신의 일기를 한 장씩 붙였다. 졸업을 앞두고 학생은 마지막 쪽지에 이렇게 썼다. '이 방을 찾는 다음 사람에게, 네가 혼자라고 느낄 때 여기에 오면 돼. 여기에는 너처럼 혼자였던 사람들의 이야기가 있으니까.' 책을 다 읽은 뒤 나는 도서관 벽을 유심히 살폈다. 정말로 벽 한쪽에 살짝 열리는 작은 문이 있었다. 떨리는 손으로 문을 열자, 노란 쪽지들이 빼곡히 붙어 있는 좁은 공간이 나타났다. 나는 한참 동안 거기 서서 낡은 쪽지들을 읽었다." }
], [
  "학교 도서관 진열장에 아무도 끝까지 읽지 못한 책 한 권이 있었다.",
  "글쓴이는 호기심에 사서 선생님께 책을 빌렸다.",
  "책은 몸이 약해 도서관에서만 시간을 보내던 한 학생의 이야기였다.",
  "그 학생은 도서관 벽 뒤에 숨겨진 비밀 방을 발견했다.",
  "방에는 이전 졸업생들이 남긴 쪽지와 그림이 가득했다.",
  "학생은 매일 비밀 방에 자신의 일기를 한 장씩 남겼다.",
  "졸업 전 마지막 쪽지에 '혼자라고 느낄 때 여기에 오라'는 말을 남겼다.",
  "책을 읽고 벽을 살핀 글쓴이는 진짜 비밀 방을 발견하고 낡은 쪽지들을 읽었다."
], [
  { prompt: "진열장 속 책 옆에 적힌 쪽지의 내용은?", answerText: "이 책을 끝까지 읽은 사람은 아직 없다" },
  { prompt: "책 속 학생이 도서관에서 시간을 보낸 이유는?", answerText: "몸이 약해 운동장에 나가지 못했기 때문" },
  { prompt: "비밀 방에는 무엇이 있었나요?", answerText: "이전 졸업생들이 남긴 쪽지와 그림" },
  { prompt: "이야기 속 학생이 졸업 전 남긴 마지막 메시지의 핵심은?", answerText: "혼자라고 느낄 때 이 방에 오면 된다는 격려" },
  { prompt: "책을 다 읽은 글쓴이는 어떤 행동을 했나요?", answerText: "도서관 벽을 살펴 진짜 비밀 방을 찾았다" },
  { prompt: "이 이야기의 핵심 주제는?", answerText: "외로움 속에서 이어지는 사람들의 보이지 않는 연결" }
], {
  p1: [
    { prompt: "진열장의 특징은?", choices: [{id:"A",text:"아무도 열어 보지 않는 곳이었다"},{id:"B",text:"인기 있는 신간 도서가 진열되었다"},{id:"C",text:"교사 전용 공간이었다"},{id:"D",text:"학생들이 자주 드나드는 곳이었다"}], answerId:"A" },
    { prompt: "진열장 속 책의 상태는?", choices: [{id:"A",text:"표지가 너덜너덜하고 오래된 책"},{id:"B",text:"새것처럼 깨끗한 책"},{id:"C",text:"여러 권이 쌓여 있었다"},{id:"D",text:"외국어로 쓰인 두꺼운 사전"}], answerId:"A" },
    { prompt: "쪽지에 적힌 말은 어떤 역할을 하나요?", choices: [{id:"A",text:"글쓴이의 호기심을 자극하는 장치"},{id:"B",text:"책을 읽지 말라는 경고"},{id:"C",text:"도서관 이용 규칙 안내"},{id:"D",text:"사서 선생님의 독서 감상문"}], answerId:"A" },
    { prompt: "글쓴이가 사서 선생님께 한 행동은?", choices: [{id:"A",text:"호기심에 책을 빌릴 수 있는지 여쭈었다"},{id:"B",text:"진열장을 치워 달라고 부탁했다"},{id:"C",text:"쪽지의 뜻을 물어보았다"},{id:"D",text:"다른 추천 도서를 요청했다"}], answerId:"A" },
    { prompt: "선생님이 망설인 뒤 한 행동은?", choices: [{id:"A",text:"열쇠로 진열장 문을 열어 주셨다"},{id:"B",text:"빌려줄 수 없다고 거절하셨다"},{id:"C",text:"다른 책을 대신 건네주셨다"},{id:"D",text:"교장 선생님께 허락을 구하셨다"}], answerId:"A" },
    { prompt: "선생님의 당부는?", choices: [{id:"A",text:"다 읽으면 반드시 돌려달라는 것"},{id:"B",text:"절대 다른 사람에게 보여 주지 말라는 것"},{id:"C",text:"한 달 안에 읽으라는 것"},{id:"D",text:"도서관 밖으로 가져가지 말라는 것"}], answerId:"A" }
  ],
  p2: [
    { prompt: "첫 장을 넘길 때 일어난 일은?", choices: [{id:"A",text:"먼지가 작은 구름처럼 일었다"},{id:"B",text:"종이가 바스러져 떨어졌다"},{id:"C",text:"글씨가 사라져 보이지 않았다"},{id:"D",text:"갑자기 조명이 꺼졌다"}], answerId:"A" },
    { prompt: "책 속 학생의 특징은?", choices: [{id:"A",text:"몸이 약해 운동장에 나가지 못했다"},{id:"B",text:"운동을 좋아해 항상 밖에 있었다"},{id:"C",text:"전학을 자주 다녀 친구가 없었다"},{id:"D",text:"책을 싫어하지만 벌을 받아 도서관에 왔다"}], answerId:"A" },
    { prompt: "학생이 쉬는 시간마다 한 일은?", choices: [{id:"A",text:"도서관에서 책을 읽었다"},{id:"B",text:"교실에서 그림을 그렸다"},{id:"C",text:"보건실에서 쉬었다"},{id:"D",text:"복도에서 친구를 기다렸다"}], answerId:"A" },
    { prompt: "학생이 발견한 것은?", choices: [{id:"A",text:"도서관 벽 뒤에 숨겨진 작은 방"},{id:"B",text:"오래된 보물 상자"},{id:"C",text:"선생님의 비밀 일기장"},{id:"D",text:"지하로 통하는 계단"}], answerId:"A" },
    { prompt: "비밀 방에 있던 것은?", choices: [{id:"A",text:"졸업생들이 남긴 쪽지와 그림"},{id:"B",text:"학교 건축 도면과 열쇠"},{id:"C",text:"오래된 시험지와 교과서"},{id:"D",text:"교장 선생님의 서류철"}], answerId:"A" },
    { prompt: "학생이 내린 결심은?", choices: [{id:"A",text:"자신도 무언가를 남기기로 했다"},{id:"B",text:"비밀 방을 선생님께 알리기로 했다"},{id:"C",text:"졸업생들의 쪽지를 모두 가져가기로 했다"},{id:"D",text:"친구들에게 비밀 방을 공개하기로 했다"}], answerId:"A" }
  ],
  p3: [
    { prompt: "학생이 비밀 방에서 매일 한 일은?", choices: [{id:"A",text:"자신의 일기를 한 장씩 붙였다"},{id:"B",text:"다른 쪽지를 정리하고 분류했다"},{id:"C",text:"벽에 그림을 그려 장식했다"},{id:"D",text:"친구를 초대해 함께 놀았다"}], answerId:"A" },
    { prompt: "마지막 쪽지의 핵심 메시지는?", choices: [{id:"A",text:"혼자라고 느낄 때 이곳에 오면 위로받을 수 있다"},{id:"B",text:"이 방을 아무에게도 알리지 말아 달라"},{id:"C",text:"자신이 남긴 일기를 모두 읽어 달라"},{id:"D",text:"이 학교를 떠나지 말고 오래 다녀 달라"}], answerId:"A" },
    { prompt: "글쓴이가 책을 읽고 나서 한 행동은?", choices: [{id:"A",text:"도서관 벽을 유심히 살피며 비밀 방을 찾았다"},{id:"B",text:"사서 선생님께 비밀 방에 대해 물었다"},{id:"C",text:"친구들을 불러 함께 탐험했다"},{id:"D",text:"책을 진열장에 도로 넣었다"}], answerId:"A" },
    { prompt: "문을 열었을 때 나타난 광경은?", choices: [{id:"A",text:"노란 쪽지가 빼곡히 붙은 좁은 공간"},{id:"B",text:"아무것도 없는 텅 빈 방"},{id:"C",text:"오래된 가구가 놓인 넓은 방"},{id:"D",text:"책이 가득 쌓인 비밀 서재"}], answerId:"A" },
    { prompt: "비밀 방을 발견한 글쓴이의 행동은?", choices: [{id:"A",text:"한참 서서 낡은 쪽지들을 읽었다"},{id:"B",text:"급히 문을 닫고 도망갔다"},{id:"C",text:"사진을 찍어 친구에게 보냈다"},{id:"D",text:"쪽지들을 떼어 가방에 넣었다"}], answerId:"A" },
    { prompt: "비밀 방에 떨리는 손으로 문을 연 것은 어떤 감정?", choices: [{id:"A",text:"기대와 설렘이 섞인 긴장감"},{id:"B",text:"위험을 감지한 두려움"},{id:"C",text:"장난을 치려는 흥분"},{id:"D",text:"지루함을 달래려는 무료함"}], answerId:"A" },
    { prompt: "이 글 전체의 분위기는?", choices: [{id:"A",text:"신비롭고 따뜻한 감동"},{id:"B",text:"무섭고 으스스한 공포"},{id:"C",text:"밝고 유쾌한 코미디"},{id:"D",text:"슬프고 비극적인 결말"}], answerId:"A" }
  ]
}, {
  p1: { prompt: "첫째 문단의 중심 내용은?", choices: [{id:"A",text:"진열장 속 미스터리한 책을 빌리게 되는 과정"},{id:"B",text:"도서관 규칙을 어기는 학생 이야기"},{id:"C",text:"사서 선생님의 직업 소개"},{id:"D",text:"학교 도서관의 건축 역사 설명"}], answerId:"A" },
  p2: { prompt: "둘째 문단의 중심 내용은?", choices: [{id:"A",text:"책 속 학생이 도서관에서 비밀 방을 발견하는 이야기"},{id:"B",text:"아픈 학생이 병원에 가는 이야기"},{id:"C",text:"도서관 리모델링 과정 소개"},{id:"D",text:"졸업생들의 성공담"}], answerId:"A" },
  p3: { prompt: "셋째 문단의 중심 내용은?", choices: [{id:"A",text:"학생의 메시지를 따라 글쓴이가 진짜 비밀 방을 발견하는 장면"},{id:"B",text:"글쓴이가 도서관 봉사 활동을 하는 장면"},{id:"C",text:"졸업식에서 상을 받는 장면"},{id:"D",text:"비밀 방이 철거되는 장면"}], answerId:"A" }
});

// ============================
// Day 15 (NONFICTION) - 토양과 미생물
// ============================
const d15 = buildDay(15, "NONFICTION", [
  { id: "p1", text: "한 줌의 흙 속에는 수십억 마리의 미생물이 살고 있다. 이 미생물들은 눈에 보이지 않지만 토양 생태계에서 없어서는 안 될 역할을 수행한다. 세균과 곰팡이는 낙엽이나 동물의 사체 같은 유기물을 분해하여 무기 영양소로 바꾸고, 이 영양소는 다시 식물의 뿌리를 통해 흡수된다. 이처럼 미생물의 분해 작용은 양분이 생태계 안에서 순환하도록 만드는 핵심 고리이다. 만약 미생물이 사라진다면 낙엽은 쌓이기만 할 것이고, 식물은 필요한 양분을 얻지 못해 자라지 못할 것이다." },
  { id: "p2", text: "토양 미생물 가운데 특히 주목할 것은 질소 고정 세균이다. 공기 중에는 질소가 약 78퍼센트를 차지하지만, 대부분의 생물은 이 질소를 직접 이용할 수 없다. 질소 고정 세균은 공기 속 질소를 암모니아와 같은 형태로 바꾸어 식물이 이용할 수 있게 해 준다. 콩과 식물의 뿌리에 공생하는 뿌리혹박테리아가 대표적인 예이다. 이 박테리아 덕분에 콩밭을 돌려짓기 하면 땅의 비옥도가 회복되는데, 이는 오래전부터 농부들이 경험적으로 알고 있던 지혜였다." },
  { id: "p3", text: "현대 농업에서 화학 비료의 과다 사용은 토양 미생물의 다양성을 감소시키는 주요 원인으로 꼽힌다. 화학 비료가 단기적으로 수확량을 높이는 것은 사실이지만, 장기적으로는 토양 구조를 약화시키고 미생물 군집을 단순화한다. 이에 따라 최근에는 유기농법이나 미생물 접종 기술처럼 토양 생태계를 살리는 방향의 농법이 주목받고 있다. 건강한 토양을 유지하는 일은 단순히 농작물 수확을 넘어, 지구 생태계 전체의 균형을 지키는 일과 다르지 않다." }
], [
  "한 줌의 흙 속에 수십억 마리의 미생물이 살고 있다.",
  "미생물은 유기물을 분해하여 무기 영양소로 바꾸고 식물이 흡수하게 한다.",
  "미생물의 분해 작용은 양분 순환의 핵심 고리이다.",
  "질소 고정 세균은 공기 속 질소를 식물이 이용 가능한 형태로 바꿔 준다.",
  "콩과 식물의 뿌리혹박테리아가 질소 고정의 대표적 예이다.",
  "화학 비료의 과다 사용은 토양 미생물 다양성을 감소시킨다.",
  "유기농법이나 미생물 접종 기술 등 토양 생태계를 살리는 농법이 주목받고 있다.",
  "건강한 토양 유지는 지구 생태계 전체의 균형을 지키는 일이다."
], [
  { prompt: "토양 미생물이 하는 핵심 역할은?", answerText: "유기물을 분해하여 무기 영양소로 바꾸고 양분을 순환시킨다" },
  { prompt: "미생물이 사라지면 어떤 문제가 생기나요?", answerText: "낙엽이 쌓이기만 하고 식물이 양분을 얻지 못해 자라지 못한다" },
  { prompt: "질소 고정 세균의 역할은?", answerText: "공기 속 질소를 암모니아 등으로 바꿔 식물이 이용할 수 있게 한다" },
  { prompt: "콩밭 돌려짓기가 땅을 비옥하게 만드는 이유는?", answerText: "뿌리혹박테리아가 질소를 고정하여 땅에 영양분을 보충하기 때문" },
  { prompt: "화학 비료의 장기적 문제점은?", answerText: "토양 구조를 약화시키고 미생물 군집을 단순화한다" },
  { prompt: "건강한 토양 유지가 중요한 궁극적 이유는?", answerText: "지구 생태계 전체의 균형을 지키는 일이기 때문" }
], {
  p1: [
    { prompt: "흙 속 미생물의 양은?", choices: [{id:"A",text:"한 줌에 수십억 마리가 산다"},{id:"B",text:"한 줌에 몇 마리만 산다"},{id:"C",text:"깨끗한 흙에는 없다"},{id:"D",text:"눈으로 셀 수 있는 정도이다"}], answerId:"A" },
    { prompt: "미생물의 역할은?", choices: [{id:"A",text:"유기물을 분해하여 영양소로 변환한다"},{id:"B",text:"식물의 잎을 직접 키운다"},{id:"C",text:"동물의 먹이가 된다"},{id:"D",text:"토양의 색깔을 바꾼다"}], answerId:"A" },
    { prompt: "세균과 곰팡이가 만든 무기 영양소는?", choices: [{id:"A",text:"식물 뿌리를 통해 흡수된다"},{id:"B",text:"공기 중으로 증발한다"},{id:"C",text:"바다로 흘러들어간다"},{id:"D",text:"동물이 직접 먹는다"}], answerId:"A" },
    { prompt: "미생물 분해 작용의 의의는?", choices: [{id:"A",text:"양분 순환의 핵심 고리"},{id:"B",text:"토양 오염의 주원인"},{id:"C",text:"기온 상승의 원인"},{id:"D",text:"식물 성장을 방해하는 요소"}], answerId:"A" },
    { prompt: "미생물이 사라지면 일어날 일은?", choices: [{id:"A",text:"낙엽이 쌓이고 식물이 자라지 못한다"},{id:"B",text:"토양이 더 비옥해진다"},{id:"C",text:"물이 더 깨끗해진다"},{id:"D",text:"기후가 따뜻해진다"}], answerId:"A" }
  ],
  p2: [
    { prompt: "공기 중 질소의 비율은?", choices: [{id:"A",text:"약 78퍼센트"},{id:"B",text:"약 21퍼센트"},{id:"C",text:"약 5퍼센트"},{id:"D",text:"약 50퍼센트"}], answerId:"A" },
    { prompt: "대부분의 생물이 공기 중 질소를 쓸 수 없는 이유는?", choices: [{id:"A",text:"기체 상태 질소를 직접 이용할 수 없어서"},{id:"B",text:"질소가 독성이 있어서"},{id:"C",text:"질소가 너무 적어서"},{id:"D",text:"식물에 질소가 필요 없어서"}], answerId:"A" },
    { prompt: "질소 고정 세균이 하는 일은?", choices: [{id:"A",text:"질소를 암모니아 형태로 바꿔 줌"},{id:"B",text:"질소를 공기 중으로 방출"},{id:"C",text:"산소를 질소로 전환"},{id:"D",text:"이산화탄소를 흡수"}], answerId:"A" },
    { prompt: "뿌리혹박테리아의 특징은?", choices: [{id:"A",text:"콩과 식물 뿌리에 공생하며 질소 고정"},{id:"B",text:"모든 식물에 기생하며 해를 줌"},{id:"C",text:"물속에서만 사는 미생물"},{id:"D",text:"낙엽을 분해하는 곰팡이"}], answerId:"A" },
    { prompt: "콩밭 돌려짓기가 효과적인 이유는?", choices: [{id:"A",text:"뿌리혹박테리아가 질소를 고정해 비옥도 회복"},{id:"B",text:"콩이 다른 잡초를 제거해서"},{id:"C",text:"콩 뿌리가 땅을 깊이 파서"},{id:"D",text:"콩이 물을 많이 흡수해서"}], answerId:"A" }
  ],
  p3: [
    { prompt: "화학 비료 과다 사용의 문제는?", choices: [{id:"A",text:"미생물 다양성 감소와 토양 약화"},{id:"B",text:"수확량이 크게 줄어든다"},{id:"C",text:"식물이 빨리 자라 넘어진다"},{id:"D",text:"물 소비량이 줄어든다"}], answerId:"A" },
    { prompt: "화학 비료의 단기 효과는?", choices: [{id:"A",text:"수확량을 높인다"},{id:"B",text:"토양 미생물을 늘린다"},{id:"C",text:"토양 구조를 강화한다"},{id:"D",text:"잡초를 제거한다"}], answerId:"A" },
    { prompt: "대안으로 주목받는 농법은?", choices: [{id:"A",text:"유기농법이나 미생물 접종 기술"},{id:"B",text:"더 강한 화학 비료 사용"},{id:"C",text:"농경지를 모두 포장하는 방법"},{id:"D",text:"식물 대신 인공 식품 재배"}], answerId:"A" },
    { prompt: "건강한 토양 유지의 의의는?", choices: [{id:"A",text:"지구 생태계 전체의 균형을 지키는 일"},{id:"B",text:"농작물 수확만을 위한 일"},{id:"C",text:"토양 색을 예쁘게 하는 일"},{id:"D",text:"미생물 연구를 위한 학술적 일"}], answerId:"A" }
  ]
}, {
  p1: { prompt: "첫째 문단의 중심 내용은?", choices: [{id:"A",text:"미생물의 분해 작용이 양분 순환의 핵심이라는 설명"},{id:"B",text:"흙 속에 사는 벌레의 종류 소개"},{id:"C",text:"식물이 광합성하는 과정 설명"},{id:"D",text:"물의 순환 과정에 대한 설명"}], answerId:"A" },
  p2: { prompt: "둘째 문단의 중심 내용은?", choices: [{id:"A",text:"질소 고정 세균의 역할과 농업적 활용"},{id:"B",text:"공기의 화학적 구성 비율 나열"},{id:"C",text:"콩의 영양학적 가치 소개"},{id:"D",text:"암모니아의 산업적 생산 방법"}], answerId:"A" },
  p3: { prompt: "셋째 문단의 중심 내용은?", choices: [{id:"A",text:"화학 비료의 문제점과 토양 생태계 보전의 중요성"},{id:"B",text:"유기농 식품의 판매량 증가 추세"},{id:"C",text:"현대 농업 기계의 발전 과정"},{id:"D",text:"비료 회사의 마케팅 전략"}], answerId:"A" }
});

// ============================
// Day 16 (LITERATURE) - 연탄 한 장
// ============================
const d16 = buildDay(16, "LITERATURE", [
  { id: "p1", text: "우리 동네에는 겨울마다 연탄을 때는 집이 몇 채 남아 있었다. 아버지는 연탄 배달을 하시는 분이었다. 새벽이면 아버지의 등에 연탄이 열두 장씩 실렸고, 아버지는 가파른 골목길을 한 걸음 한 걸음 올라갔다. 숨이 거칠어져도 연탄을 내려놓는 법이 없었다. 한 장이라도 깨지면 온기가 줄어들기 때문이라고 아버지는 말씀하셨다. 나는 아버지의 검은 손을 보면서 연탄 가루가 잘 씻기지 않는다는 것을 알았다." },
  { id: "p2", text: "어느 해 겨울은 유난히 추웠다. 골목 끝에 혼자 사시는 김 할머니 댁의 연탄이 다 떨어졌다는 소식이 들렸다. 아버지는 퇴근 뒤 남은 연탄 다섯 장을 지고 할머니 댁으로 가셨다. 나도 따라갔는데, 방 안에서 담요를 두르고 계신 할머니의 입술이 파랗게 질려 있었다. 아버지가 아궁이에 불을 지피자 방이 서서히 따뜻해졌고, 할머니는 고맙다는 말 대신 아버지의 손을 꼭 잡았다. 아버지는 아무 말 없이 미소만 짓고 돌아오셨다." },
  { id: "p3", text: "지금은 연탄을 때는 집이 거의 사라졌고 아버지도 다른 일을 하신다. 하지만 겨울이 올 때마다 나는 아버지의 등에 실린 연탄 열두 장과 김 할머니의 파란 입술을 떠올린다. 한 장의 연탄이 한 사람의 밤을 따뜻하게 했듯, 작은 나눔이 누군가의 추위를 녹일 수 있다는 것을 아버지는 말이 아닌 행동으로 알려 주셨다. 아버지의 검은 손은 결코 더러운 것이 아니라 가장 따뜻한 손이었다." }
], [
  "아버지는 겨울마다 연탄 배달을 하셨고, 한 장도 깨뜨리지 않으려 애썼다.",
  "연탄 가루가 잘 씻기지 않는 아버지의 검은 손을 글쓴이는 바라보곤 했다.",
  "유난히 추운 겨울, 혼자 사시는 김 할머니 댁의 연탄이 떨어졌다.",
  "아버지는 퇴근 뒤 남은 연탄을 지고 할머니 댁에 가서 불을 지펴 드렸다.",
  "할머니는 고맙다는 말 대신 아버지의 손을 꼭 잡았다.",
  "지금은 연탄을 때는 집이 거의 사라졌지만, 겨울마다 그 기억이 떠오른다.",
  "작은 나눔이 누군가의 추위를 녹일 수 있음을 아버지가 행동으로 보여 주셨다.",
  "아버지의 검은 손은 더러운 것이 아니라 가장 따뜻한 손이었다."
], [
  { prompt: "아버지의 직업은 무엇이었나요?", answerText: "연탄 배달" },
  { prompt: "아버지가 연탄을 한 장도 깨뜨리지 않으려 한 이유는?", answerText: "한 장이라도 깨지면 온기가 줄어들기 때문" },
  { prompt: "김 할머니 댁에 찾아간 이유는?", answerText: "연탄이 다 떨어졌기 때문" },
  { prompt: "할머니는 고마움을 어떻게 표현했나요?", answerText: "말 대신 아버지의 손을 꼭 잡았다" },
  { prompt: "글쓴이가 아버지에게서 배운 교훈은?", answerText: "작은 나눔이 누군가의 추위를 녹일 수 있다" },
  { prompt: "아버지의 검은 손에 대한 글쓴이의 생각은?", answerText: "더러운 것이 아니라 가장 따뜻한 손" }
], {
  p1: [
    { prompt: "동네에 남아 있던 것은?", choices: [{id:"A",text:"연탄을 때는 집 몇 채"},{id:"B",text:"가스 보일러를 쓰는 집"},{id:"C",text:"전기 난방을 하는 건물"},{id:"D",text:"난방이 없는 빈 집"}], answerId:"A" },
    { prompt: "아버지의 직업은?", choices: [{id:"A",text:"연탄 배달부"},{id:"B",text:"연탄 공장 직원"},{id:"C",text:"난방 설비 기사"},{id:"D",text:"건설 현장 인부"}], answerId:"A" },
    { prompt: "새벽마다 아버지가 한 일은?", choices: [{id:"A",text:"등에 연탄을 지고 가파른 골목을 올라감"},{id:"B",text:"트럭으로 연탄을 운반함"},{id:"C",text:"공장에서 연탄을 만듦"},{id:"D",text:"가게에서 연탄을 판매함"}], answerId:"A" },
    { prompt: "숨이 거칠어져도 쉬지 않은 이유는?", choices: [{id:"A",text:"연탄이 깨지면 온기가 줄어들기 때문"},{id:"B",text:"시간에 쫓겨 서둘러야 해서"},{id:"C",text:"경쟁 업체보다 먼저 배달하려고"},{id:"D",text:"쉬면 급여가 깎이기 때문"}], answerId:"A" },
    { prompt: "연탄 한 장의 가치에 대한 아버지의 생각은?", choices: [{id:"A",text:"한 장이 사람의 온기를 좌우할 수 있다"},{id:"B",text:"깨져도 큰 차이는 없다"},{id:"C",text:"돈으로만 환산되는 물건이다"},{id:"D",text:"무게가 가벼워 대수롭지 않다"}], answerId:"A" },
    { prompt: "아버지의 검은 손에서 알 수 있는 것은?", choices: [{id:"A",text:"연탄 가루가 잘 씻기지 않을 만큼 고된 노동"},{id:"B",text:"아버지가 손을 잘 씻지 않는 습관"},{id:"C",text:"검은 장갑을 항상 끼고 있었던 것"},{id:"D",text:"그림을 그리는 취미가 있었던 것"}], answerId:"A" }
  ],
  p2: [
    { prompt: "그해 겨울의 특징은?", choices: [{id:"A",text:"유난히 추웠다"},{id:"B",text:"유난히 따뜻했다"},{id:"C",text:"눈이 거의 오지 않았다"},{id:"D",text:"비가 많이 왔다"}], answerId:"A" },
    { prompt: "김 할머니 댁의 문제는?", choices: [{id:"A",text:"연탄이 다 떨어져 추위에 노출됨"},{id:"B",text:"수도관이 동파되었다"},{id:"C",text:"지붕이 무너질 위험이 있었다"},{id:"D",text:"가스가 새는 사고가 있었다"}], answerId:"A" },
    { prompt: "아버지가 퇴근 뒤 한 행동은?", choices: [{id:"A",text:"남은 연탄을 지고 할머니 댁에 갔다"},{id:"B",text:"이웃에게 도움을 요청했다"},{id:"C",text:"관청에 신고했다"},{id:"D",text:"다음 날 배달하기로 약속했다"}], answerId:"A" },
    { prompt: "할머니의 파란 입술은 무엇을 나타내나요?", choices: [{id:"A",text:"극심한 추위에 노출된 상태"},{id:"B",text:"건강이 매우 좋다는 표시"},{id:"C",text:"화장을 한 모습"},{id:"D",text:"놀라서 긴장한 상태"}], answerId:"A" },
    { prompt: "아궁이에 불을 지핀 결과는?", choices: [{id:"A",text:"방이 서서히 따뜻해졌다"},{id:"B",text:"연기가 나서 창문을 열었다"},{id:"C",text:"불이 잘 붙지 않았다"},{id:"D",text:"할머니가 더 추워했다"}], answerId:"A" },
    { prompt: "할머니가 감사를 표현한 방법은?", choices: [{id:"A",text:"말 대신 아버지의 손을 꼭 잡았다"},{id:"B",text:"크게 소리 내어 감사했다"},{id:"C",text:"선물을 건네주었다"},{id:"D",text: "다음에 갚겠다고 약속했다"}], answerId:"A" },
    { prompt: "아버지가 돌아오며 보인 태도는?", choices: [{id:"A",text:"아무 말 없이 미소만 지었다"},{id:"B",text:"할머니에게 돈을 요구했다"},{id:"C",text:"자랑스럽게 이야기했다"},{id:"D",text:"힘들어하며 불평했다"}], answerId:"A" }
  ],
  p3: [
    { prompt: "현재 연탄을 때는 집의 상황은?", choices: [{id:"A",text:"거의 사라졌다"},{id:"B",text:"오히려 더 늘었다"},{id:"C",text:"변함없이 많다"},{id:"D",text:"법으로 금지되었다"}], answerId:"A" },
    { prompt: "겨울마다 글쓴이가 떠올리는 것은?", choices: [{id:"A",text:"아버지의 연탄과 할머니의 파란 입술"},{id:"B",text:"눈 오는 날의 학교 풍경"},{id:"C",text:"어린 시절의 크리스마스 선물"},{id:"D",text:"골목 친구들과의 놀이 기억"}], answerId:"A" },
    { prompt: "글쓴이가 아버지에게 배운 것은?", choices: [{id:"A",text:"작은 나눔이 추위를 녹일 수 있다는 것"},{id:"B",text:"돈을 많이 벌어야 한다는 것"},{id:"C",text:"연탄 배달이 좋은 직업이라는 것"},{id:"D",text:"겨울에는 밖에 나가면 안 된다는 것"}], answerId:"A" },
    { prompt: "아버지의 검은 손에 대한 최종 평가는?", choices: [{id:"A",text:"더러운 것이 아니라 가장 따뜻한 손"},{id:"B",text:"힘든 노동의 흔적일 뿐인 손"},{id:"C",text:"씻으면 깨끗해지는 평범한 손"},{id:"D",text:"아무런 의미가 없는 손"}], answerId:"A" }
  ]
}, {
  p1: { prompt: "첫째 문단의 중심 내용은?", choices: [{id:"A",text:"연탄 배달부 아버지의 성실한 노동과 연탄의 소중함"},{id:"B",text:"연탄을 때는 난방 기술의 역사"},{id:"C",text:"골목길의 도시 개발 과정"},{id:"D",text:"아버지의 취미 생활 소개"}], answerId:"A" },
  p2: { prompt: "둘째 문단의 중심 내용은?", choices: [{id:"A",text:"추운 겨울 아버지가 할머니에게 연탄을 나누어 주는 따뜻한 장면"},{id:"B",text:"김 할머니의 건강 악화와 병원 방문"},{id:"C",text:"동네 주민들의 겨울 준비 과정"},{id:"D",text:"연탄 가격 인상에 따른 어려움"}], answerId:"A" },
  p3: { prompt: "셋째 문단의 중심 내용은?", choices: [{id:"A",text:"시대가 변해도 작은 나눔의 가치를 깨닫게 해 준 아버지에 대한 감사"},{id:"B",text:"연탄 산업의 쇠퇴와 에너지 전환 문제"},{id:"C",text:"글쓴이가 아버지의 직업을 이어받은 이야기"},{id:"D",text:"김 할머니와 아버지의 재회 장면"}], answerId:"A" }
});

// === 파일 저장 ===
const batchPath = path.join(BASE, 'generated', `daily-batch-reading-${LEVEL}.json`);
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

[d12, d13, d14, d15, d16].forEach(d => {
  const dayNum = d.wrapper.day_index;
  batch.items[dayNum - 1] = d.wrapper;

  const staticDir = path.join(BASE, 'frontend', 'public', 'daily-reading', LEVEL);
  const staticPath = path.join(staticDir, `${String(dayNum).padStart(3,'0')}.json`);
  fs.writeFileSync(staticPath, JSON.stringify(d.wrapper.content, null, 2), 'utf8');

  console.log(`Day ${dayNum}: len=${d.stats.len}, steps=${d.stats.steps}, recall=${d.stats.recall}, confirm=${d.stats.confirm}`);
});

fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log('배치 파일 저장 완료');
