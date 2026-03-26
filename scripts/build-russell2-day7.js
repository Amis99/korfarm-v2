// Day 7: NONFICTION (비문학 - 사회/경제: 행동경제학과 넛지)
const fs = require('fs');
const path = require('path');

const paragraphs = [
  { id: "p1", text: "전통적인 경제학에서는 인간을 합리적인 존재로 가정한다. 즉, 사람들은 주어진 정보를 빠짐없이 분석하고, 자신에게 최대한 이익이 되는 방향으로 의사 결정을 내린다고 본다. 그러나 현실에서 사람들의 선택은 이러한 가정과 크게 어긋나는 경우가 빈번하게 관찰된다. 예를 들어 건강에 해롭다는 사실을 분명히 알면서도 고칼로리 음식을 반복적으로 선택하거나, 노후 대비의 중요성을 인식하면서도 저축보다 당장의 소비를 우선하는 행태가 이에 해당한다. 이처럼 인간의 비합리적인 행동 양상을 체계적으로 연구하는 학문 분야가 바로 행동경제학이다." },
  { id: "p2", text: "행동경제학의 핵심 개념 가운데 하나가 '넛지'이다. 넛지란 원래 '팔꿈치로 슬쩍 찌르다'라는 뜻의 영어 단어인데, 경제학에서는 사람들의 선택을 특정 방향으로 유도하되 강제하지는 않는 부드러운 개입을 의미한다. 넛지의 핵심은 선택의 자유를 침해하지 않으면서도 바람직한 행동을 자연스럽게 이끌어 낸다는 점에 있다. 이를 제안한 학자인 리처드 탈러와 캐스 선스타인은 인간이 판단과 의사 결정 과정에서 다양한 인지적 편향에 영향을 받는다는 사실에 주목하였다. 그들은 이러한 편향을 역이용하면 사회 전체적으로 더 나은 결과를 이끌어 낼 수 있다고 주장하였다." },
  { id: "p3", text: "넛지가 작동하는 대표적인 원리로 '기본 설정 효과'를 들 수 있다. 사람들은 별도의 행동을 취하지 않아도 자동으로 적용되는 옵션, 즉 기본 설정을 그대로 따르는 경향이 매우 강하다. 예컨대 장기 기증 동의 제도에서 기본 설정을 '동의'로 바꾸자 실제 기증률이 크게 높아진 사례가 있다. 또 다른 예로, 구내식당에서 샐러드를 눈높이에 배치하고 튀김류를 구석에 놓는 방식으로 건강한 식단 선택을 유도한 실험이 있다. 이러한 사례들은 환경의 작은 변화만으로도 개인의 행동을 상당히 바꿀 수 있음을 설득력 있게 보여 준다." },
  { id: "p4", text: "그러나 넛지에 대한 비판적 시각도 분명히 존재한다. 가장 큰 쟁점은 넛지가 결국 특정 주체의 가치 판단을 전제로 한다는 점이다. 누군가가 '바람직한 방향'을 미리 정하고 대중을 그쪽으로 유도한다는 점에서 이것은 온정적 간섭주의에 해당한다는 것이다. 또한 넛지의 효과가 단기적일 수 있으며, 사람들이 조작당한다는 느낌을 받을 경우 오히려 반발심을 유발할 수 있다는 지적도 있다. 그럼에도 불구하고 넛지는 공공 정책, 금융 설계, 환경 보전 등 다양한 영역에서 폭넓게 활용되며 현대 사회의 정책 수립에 중요한 도구로 자리 잡고 있다." }
];

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log("총 글자수:", totalLen);

function splitSentences(text) {
  const results = []; let cur = "";
  for (let i = 0; i < text.length; i++) {
    cur += text[i];
    if ((text[i] === '.' || text[i] === '!' || text[i] === '?') && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      results.push(cur.trim()); cur = "";
    }
  }
  if (cur.trim()) results.push(cur.trim());
  return results;
}
function findRange(t, s) { const st = t.indexOf(s); if (st === -1) { console.error("NOT FOUND:", s.substring(0,40)); process.exit(1); } return { start: st, end: st + s.length - 1 }; }

const allS = {}; for (const p of paragraphs) { allS[p.id] = splitSentences(p.text); console.log(`${p.id}: ${allS[p.id].length}문장`); }

const qMap = {
  p1: [
    { prompt: "전통 경제학에서 인간을 어떤 존재로 가정하는가?", A: "합리적인 존재로 가정한다", B: "감정적 존재로 가정한다", C: "이기적 존재로 가정한다", D: "사회적 존재로 가정한다" },
    { prompt: "전통 경제학에서 사람들의 의사 결정 방식으로 알맞은 것은?", A: "주어진 정보를 빠짐없이 분석하여 최대 이익 방향으로 결정한다", B: "감정에 따라 즉흥적으로 결정한다", C: "다수의 의견을 따라 결정한다", D: "전문가의 조언에만 의존하여 결정한다" },
    { prompt: "현실에서의 선택에 대한 설명으로 알맞은 것은?", A: "합리적 가정과 크게 어긋나는 경우가 빈번하게 관찰된다", B: "항상 합리적 가정에 부합한다", C: "경제적 요인에만 영향을 받는다", D: "과학적으로 예측할 수 없다" },
    { prompt: "비합리적 선택의 예시로 알맞은 것은?", A: "건강에 해롭다는 사실을 알면서도 고칼로리 음식을 반복 선택하는 것", B: "건강을 위해 운동을 꾸준히 하는 것", C: "정보를 충분히 분석한 뒤 투자하는 것", D: "저축을 늘려 노후를 대비하는 것" },
    { prompt: "행동경제학이 연구하는 대상으로 알맞은 것은?", A: "인간의 비합리적인 행동 양상을 체계적으로 연구한다", B: "기업의 재무 구조를 분석한다", C: "국가 간 무역 이론을 연구한다", D: "화폐의 역사와 변천을 다룬다" },
  ],
  p2: [
    { prompt: "'넛지'의 원래 뜻으로 알맞은 것은?", A: "팔꿈치로 슬쩍 찌르다라는 뜻이다", B: "강하게 밀어붙이다라는 뜻이다", C: "부드럽게 안내하다라는 뜻이다", D: "단호하게 거절하다라는 뜻이다" },
    { prompt: "경제학에서 넛지의 의미로 알맞은 것은?", A: "선택을 특정 방향으로 유도하되 강제하지 않는 부드러운 개입이다", B: "법률로 특정 행동을 금지하는 규제이다", C: "경제적 보상을 통해 행동을 변화시키는 전략이다", D: "대중에게 정보를 공개하여 자율적 판단을 돕는 제도이다" },
    { prompt: "넛지의 핵심 특성으로 알맞은 것은?", A: "선택의 자유를 침해하지 않으면서 바람직한 행동을 이끌어 낸다", B: "개인의 선택을 완전히 통제한다", C: "경제적 처벌을 통해 행동을 교정한다", D: "정보 비대칭을 활용하여 이익을 극대화한다" },
    { prompt: "탈러와 선스타인이 주목한 사실로 알맞은 것은?", A: "인간이 의사 결정 과정에서 다양한 인지적 편향에 영향을 받는다", B: "인간은 항상 합리적 판단을 내린다", C: "경제적 인센티브만이 행동을 변화시킨다", D: "사회적 규범이 선택에 영향을 주지 않는다" },
    { prompt: "탈러와 선스타인의 주장으로 알맞은 것은?", A: "인지적 편향을 역이용하면 사회 전체적으로 더 나은 결과를 이끌 수 있다", B: "편향을 제거해야만 올바른 의사 결정이 가능하다", C: "인지적 편향은 교육만으로 극복할 수 있다", D: "편향은 개인의 문제이므로 사회적 개입이 불필요하다" },
  ],
  p3: [
    { prompt: "넛지가 작동하는 대표적 원리로 알맞은 것은?", A: "기본 설정 효과를 들 수 있다", B: "보상 체계를 들 수 있다", C: "처벌 효과를 들 수 있다", D: "정보 공개 원리를 들 수 있다" },
    { prompt: "기본 설정 효과에 대한 설명으로 알맞은 것은?", A: "자동으로 적용되는 옵션을 그대로 따르는 경향이 매우 강하다", B: "가장 저렴한 옵션을 선택하는 경향이다", C: "처음 제시된 옵션을 무조건 거부하는 경향이다", D: "전문가 추천 옵션만 선택하는 경향이다" },
    { prompt: "장기 기증 동의 제도에서의 넛지 효과로 알맞은 것은?", A: "기본 설정을 동의로 바꾸자 기증률이 크게 높아졌다", B: "기본 설정을 거부로 바꾸자 기증률이 높아졌다", C: "기본 설정과 무관하게 기증률이 변하지 않았다", D: "기본 설정을 없애자 기증률이 크게 떨어졌다" },
    { prompt: "구내식당에서 건강한 식단 선택을 유도한 방법으로 알맞은 것은?", A: "샐러드를 눈높이에 배치하고 튀김류를 구석에 놓았다", B: "튀김류의 가격을 대폭 올렸다", C: "샐러드만 판매하고 튀김류를 없앴다", D: "건강 강연을 의무적으로 들게 했다" },
    { prompt: "이러한 사례들이 보여 주는 점으로 알맞은 것은?", A: "환경의 작은 변화만으로도 개인의 행동을 상당히 바꿀 수 있다", B: "강제적 규제가 행동 변화에 가장 효과적이다", C: "경제적 인센티브가 유일한 행동 변화 수단이다", D: "개인의 의지만으로 행동을 바꿀 수 있다" },
  ],
  p4: [
    { prompt: "넛지에 대해 어떤 시각이 존재한다고 했는가?", A: "비판적 시각이 분명히 존재한다", B: "전적으로 긍정적인 시각만 있다", C: "학계에서 관심을 받지 못하고 있다", D: "아직 평가가 이루어지지 않았다" },
    { prompt: "넛지에 대한 가장 큰 비판의 쟁점으로 알맞은 것은?", A: "넛지가 결국 특정 주체의 가치 판단을 전제로 한다는 점이다", B: "넛지의 비용이 너무 높다는 점이다", C: "넛지가 효과가 전혀 없다는 점이다", D: "넛지가 법적으로 불법이라는 점이다" },
    { prompt: "넛지가 온정적 간섭주의에 해당한다는 비판의 근거로 알맞은 것은?", A: "바람직한 방향을 미리 정하고 대중을 그쪽으로 유도한다는 점이다", B: "경제적 손실을 유발한다는 점이다", C: "개인의 프라이버시를 침해한다는 점이다", D: "소수 집단에게만 혜택을 준다는 점이다" },
    { prompt: "넛지의 효과와 관련된 비판으로 알맞은 것은?", A: "효과가 단기적일 수 있고 조작감이 반발심을 유발할 수 있다", B: "효과가 너무 강력해서 자유를 침해한다", C: "효과가 특정 연령층에만 나타난다", D: "효과를 측정할 방법이 전혀 없다" },
    { prompt: "넛지가 현대 사회에서 차지하는 위상으로 알맞은 것은?", A: "다양한 영역에서 폭넓게 활용되며 정책 수립에 중요한 도구로 자리 잡았다", B: "오직 교육 분야에서만 활용된다", C: "학문적으로만 논의되고 실제 적용은 없다", D: "일부 국가에서만 제한적으로 사용된다" },
  ]
};

const centralQ = {
  p1: { prompt: "[문단 1] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "전통 경제학의 합리적 인간 가정과 현실의 괴리, 행동경제학의 등장 배경", B: "전통 경제학의 발전 역사와 주요 학자 소개", C: "인간의 합리적 의사 결정 과정에 대한 심층 분석", D: "건강한 식습관을 형성하기 위한 구체적 방법 제시" },
  p2: { prompt: "[문단 2] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "넛지의 개념, 핵심 특성 및 이론적 배경 설명", B: "리처드 탈러의 생애와 학문적 업적 소개", C: "인지적 편향의 종류와 각각의 구체적 사례 나열", D: "경제학에서 사용되는 다양한 영어 용어 해설" },
  p3: { prompt: "[문단 3] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "기본 설정 효과를 중심으로 한 넛지의 구체적 작동 사례", B: "장기 기증 제도의 역사와 법적 쟁점 분석", C: "구내식당의 운영 방식과 메뉴 구성 소개", D: "넛지 이론에 대한 다양한 학문적 비판 정리" },
  p4: { prompt: "[문단 4] 이 문단의 중심 내용으로 가장 알맞은 것은?", A: "넛지에 대한 비판과 함께 다양한 영역에서의 활용 가치 제시", B: "온정적 간섭주의의 정의와 역사적 배경 설명", C: "넛지를 대체할 수 있는 새로운 경제 이론 소개", D: "공공 정책의 수립 절차와 시민 참여 방안 제시" },
};

const timeline = []; let sn = 1;
for (const p of paragraphs) {
  const sents = allS[p.id], qs = qMap[p.id];
  if (sents.length !== qs.length) { console.error(`${p.id}: 문장(${sents.length}) != 문항(${qs.length})`); sents.forEach((s,i)=>console.log(`  [${i}] ${s}`)); process.exit(1); }
  for (let i = 0; i < sents.length; i++) {
    const r = findRange(p.text, sents[i]);
    timeline.push({ stepId: `s${sn++}`, highlight: { ranges: [{ paragraphId: p.id, start: r.start, end: r.end }] }, question: { prompt: qs[i].prompt, choices: [{id:"A",text:qs[i].A},{id:"B",text:qs[i].B},{id:"C",text:qs[i].C},{id:"D",text:qs[i].D}], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true } } });
  }
  const cq = centralQ[p.id];
  timeline.push({ stepId: `s${sn++}`, highlight: { ranges: [{ paragraphId: p.id, start: 0, end: p.text.length - 1 }] }, question: { prompt: cq.prompt, choices: [{id:"A",text:cq.A},{id:"B",text:cq.B},{id:"C",text:cq.C},{id:"D",text:cq.D}], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true } } });
}

const recallCards = [
  { id: "c1", front: "전통 경제학에서 인간을 어떤 존재로 가정하는가?", back: "합리적인 존재" },
  { id: "c2", front: "행동경제학이 연구하는 대상은?", back: "인간의 비합리적인 행동 양상" },
  { id: "c3", front: "'넛지'의 원래 뜻은?", back: "팔꿈치로 슬쩍 찌르다" },
  { id: "c4", front: "넛지를 제안한 학자는?", back: "리처드 탈러와 캐스 선스타인" },
  { id: "c5", front: "넛지의 대표적 원리는?", back: "기본 설정 효과" },
  { id: "c6", front: "장기 기증 제도에서 넛지를 적용한 결과는?", back: "기본 설정을 동의로 바꾸자 기증률이 크게 높아졌다" },
  { id: "c7", front: "넛지에 대한 가장 큰 비판은?", back: "특정 주체의 가치 판단을 전제로 한다는 점" },
  { id: "c8", front: "넛지가 활용되는 영역은?", back: "공공 정책, 금융 설계, 환경 보전 등" },
];

const confirmQs = [
  { qId: "q1", prompt: "전통 경제학에서 인간을 어떤 존재로 가정하는가?", acceptedAnswer: ["합리적인 존재", "합리적 존재"] },
  { qId: "q2", prompt: "행동경제학이 연구하는 대상은?", acceptedAnswer: ["인간의 비합리적 행동", "비합리적 행동 양상"] },
  { qId: "q3", prompt: "넛지의 원래 뜻은?", acceptedAnswer: ["팔꿈치로 슬쩍 찌르다"] },
  { qId: "q4", prompt: "넛지의 핵심 특성은?", acceptedAnswer: ["선택의 자유를 침해하지 않으면서 바람직한 행동을 유도", "강제하지 않는 부드러운 개입"] },
  { qId: "q5", prompt: "기본 설정 효과란?", acceptedAnswer: ["자동으로 적용되는 옵션을 그대로 따르는 경향", "기본 설정을 따르는 경향"] },
  { qId: "q6", prompt: "넛지에 대한 가장 큰 비판 쟁점은?", acceptedAnswer: ["특정 주체의 가치 판단을 전제", "온정적 간섭주의"] },
  { qId: "q7", prompt: "넛지가 활용되는 영역은?", acceptedAnswer: ["공공 정책", "금융 설계", "환경 보전"] },
];

const sc = {
  contentId: "dr-r2-007", contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
  title: "일일 독해(러셀 2) Day 7 비문학", description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_2", schoolGradeRange: { min: 8, max: 9 },
  area: "READING", subArea: "NONFICTION", competencies: ["READING"], tags: ["daily"],
  access: { mode: "FREE" }, seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300, assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: { cards: recallCards, correctOrder: recallCards.map(c=>c.id), seedPenalty: 1 },
    confirm: { questions: confirmQs.map(q=>({ qId: q.qId, prompt: q.prompt, acceptedAnswer: q.acceptedAnswer, answerMatchMode: "ANY", revealOnWrong: true, scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 } })) }
  }
};

const bi = { content_type: "DAILY_READING", level_id: "RUSSELL_2", area: "READING", sub_area: "NONFICTION", day_index: 7, module_key: "reading_training", schema_version: "1.0", content: sc };

fs.writeFileSync(path.join(__dirname,'..','frontend','public','daily-reading','russell2','007.json'), JSON.stringify(sc,null,2), 'utf8');
console.log("007.json 저장 완료");
const bp = path.join(__dirname,'..','generated','daily-batch-reading-russell2.json');
const batch = JSON.parse(fs.readFileSync(bp,'utf8'));
batch.items[6] = bi;
fs.writeFileSync(bp, JSON.stringify(batch,null,2), 'utf8');
console.log("배치 items[6] 교체 완료");

console.log("\n=== Day 7 검증 ===");
console.log("총 글자수:", totalLen, totalLen >= 1150 && totalLen <= 1250 ? "OK" : "WARN");
console.log("타임라인:", timeline.length); console.log("복기:", recallCards.length); console.log("확인:", confirmQs.length);
let err = 0;
for (const st of timeline) { for (const r of st.highlight.ranges) { const po = paragraphs.find(p=>p.id===r.paragraphId); if (r.start<0||r.end>=po.text.length||r.start>r.end) { console.error(`범위오류 ${st.stepId}`); err++; } } if (st.question.answerId!=="A") { console.error(`answerId오류 ${st.stepId}`); err++; } }
console.log(err===0 ? "모든 검증 통과!" : `오류 ${err}건`);
