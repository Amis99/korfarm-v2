const fs = require('fs');
const path = require('path');

function findSentences(text) {
  const sentences = []; let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1; while (next < text.length && (text[next] === ' ' || text[next] === '\n')) next++; start = next;
    }
  }
  if (start < text.length) sentences.push({ start, end: text.length, text: text.substring(start) });
  return sentences;
}

function findRange(paragraphs, pid, searchText) {
  const para = paragraphs.find(p => p.id === pid);
  if (!para) throw new Error(`문단 ${pid} 없음`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText.substring(0, 30)}..." ${pid}에서 찾을 수 없음`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charLen(paragraphs) { return paragraphs.reduce((sum, p) => sum + p.text.length, 0); }

function buildTimeline(paragraphs) {
  let stepNum = 0; const timeline = [];
  paragraphs.forEach((para) => {
    const sents = findSentences(para.text);
    sents.forEach((sent) => { stepNum++; timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] } }); });
    stepNum++; timeline.push({ stepId: `s${stepNum}`, highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] } });
  });
  return timeline;
}

function buildRecallCards(paragraphs) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length; const chunkSize = Math.ceil(totalLen / 8); const cards = [];
  for (let i = 0; i < 8; i++) { const s = i * chunkSize; const e = Math.min(s + chunkSize, totalLen); cards.push({ id: `c${i+1}`, text: fullText.substring(s, e) }); }
  return cards;
}

function makeConfirmQ(id, prompt, ranges) {
  return { id, prompt, answerRanges: ranges, scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true, answerMatchMode: "ANY" };
}

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs); const cards = buildRecallCards(paragraphs);
  const nn = String(dayIndex).padStart(3, '0');
  return { contentId: `dr-f2-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(프레게 2) Day ${dayIndex} ${subAreaKo}`, description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_2", schoolGradeRange: { min: 6, max: 6 }, area: "READING", subArea,
    competencies: ["READING"], tags: ["daily"], access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 }, timeLimitSec: 480, assets: {},
    payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline },
      recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 }, confirm: { questions: confirmQuestions } }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return { content_type: "DAILY_READING", level_id: "FREGE_2", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// ============================================================
// Day 279 — 비문학: 도시 열섬 현상
// ============================================================
function buildDay279() {
  const paragraphs = [
    { id: "p1", text: "여름철 대도시의 기온이 주변 교외 지역보다 뚜렷하게 높은 현상을 도시 열섬 효과라 부른다. 콘크리트와 아스팔트로 뒤덮인 지표면이 태양 에너지를 흡수한 뒤 밤에도 서서히 방출하기 때문이다. 자연 상태의 토양이나 숲은 수분 증발을 통해 지표면 온도를 낮추지만, 도시에서는 이 냉각 기능이 크게 줄어든다. 그 결과 한여름 밤 최저 기온이 교외보다 삼 도에서 다섯 도까지 높게 나타난다." },
    { id: "p2", text: "열섬 효과가 심해지면 시민 건강에 직접적인 영향을 끼친다. 열대야가 잦아지며 수면 장애를 호소하는 사람이 늘고, 고령자의 온열 질환 발생률이 급격히 증가한다. 에어컨 사용량이 폭증하면서 전력 수요가 치솟고, 이는 다시 발전소의 열 배출을 늘려 악순환 구조를 형성한다. 대기 오염 물질도 높은 기온 속에서 광화학 반응을 일으켜 오존 농도를 높이고, 호흡기 질환이 늘어나는 이차 피해까지 발생한다." },
    { id: "p3", text: "이 문제를 완화하기 위해 여러 도시에서 다양한 정책을 시행하고 있다. 대표적 방법이 옥상 녹화인데, 건물 표면을 식물로 덮으면 증발산 작용을 통해 온도를 최대 이십 도까지 낮출 수 있다. 투수성 포장재로 빗물이 지하로 스며들게 하는 것도 효과적이다. 서울시는 바람길 숲 조성 사업을 통해 외곽의 시원한 공기가 도심까지 유입되도록 녹지 축을 설계하고 있다." },
    { id: "p4", text: "장기적으로는 도시 계획 단계에서부터 열섬 효과를 고려해야 한다는 목소리가 커지고 있다. 건물 배치와 높이를 조절해 바람 통로를 확보하고, 고반사 도료를 건축 외장재에 적용하여 태양열 흡수를 줄이는 방안이 논의된다. 시민 개개인도 불필요한 에어컨 사용을 자제하고 대중교통을 이용함으로써 열 부하를 낮출 수 있다. 도시 열섬은 에너지, 건강, 환경이 복합적으로 얽힌 사안이므로 총체적 접근이 필요하다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "도시 열섬 효과의 주된 원인으로 언급된 지표면 소재를 찾아 표시하세요.", [findRange(paragraphs, "p1", "콘크리트와 아스팔트로 뒤덮인 지표면이 태양 에너지를 흡수한 뒤 밤에도 서서히 방출하기 때문이다")]),
    makeConfirmQ("q2", "자연 상태에서 지표면 온도를 낮추는 메커니즘을 찾아 표시하세요.", [findRange(paragraphs, "p1", "수분 증발을 통해 지표면 온도를 낮추지만")]),
    makeConfirmQ("q3", "에어컨 사용 증가가 만들어 내는 악순환 구조를 설명하는 부분을 찾아 표시하세요.", [findRange(paragraphs, "p2", "에어컨 사용량이 폭증하면서 전력 수요가 치솟고, 이는 다시 발전소의 열 배출을 늘려 악순환 구조를 형성한다")]),
    makeConfirmQ("q4", "옥상 녹화가 온도를 낮추는 원리를 설명하는 부분을 찾아 표시하세요.", [findRange(paragraphs, "p3", "건물 표면을 식물로 덮으면 증발산 작용을 통해 온도를 최대 이십 도까지 낮출 수 있다")]),
    makeConfirmQ("q5", "서울시의 구체적인 열섬 대응 사업을 찾아 표시하세요.", [findRange(paragraphs, "p3", "바람길 숲 조성 사업을 통해 외곽의 시원한 공기가 도심까지 유입되도록 녹지 축을 설계하고 있다")]),
    makeConfirmQ("q6", "도시 계획 단계에서 열 흡수를 줄이기 위해 논의되는 건축 방안을 찾아 표시하세요.", [findRange(paragraphs, "p4", "고반사 도료를 건축 외장재에 적용하여 태양열 흡수를 줄이는 방안이 논의된다")])
  ];
  const content = assembleFull(279, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ============================================================
// Day 280 — 문학: 할머니의 재봉틀
// ============================================================
function buildDay280() {
  const paragraphs = [
    { id: "p1", text: "나는 어릴 적 방학이면 늘 시골 할머니 댁에서 보냈다. 할머니 방 한쪽에는 까만 철제 재봉틀이 놓여 있었는데, 발판을 밟으면 딸깍딸깍 경쾌한 소리를 내며 바늘이 위아래로 움직였다. 할머니는 그 재봉틀로 동네 사람들의 옷을 고쳐 주셨다. 바지 단을 줄이거나, 찢어진 저고리를 깁거나, 아이들 학교 가방에 이름표를 달아 주시는 일이었다. 대가로 받는 것은 고작 계란 한 판이나 텃밭에서 캔 감자 한 봉지였지만, 할머니는 한 번도 불평하지 않으셨다." },
    { id: "p2", text: "어느 여름, 내 반바지 주머니가 찢어졌다. 풀밭에서 뒹굴다가 못에 걸린 것이다. 할머니는 재봉틀 앞에 앉아 주머니를 꼼꼼히 살피더니, 천 조각을 대어 감쪽같이 기워 주셨다. 그런데 단순히 원래대로 되돌리는 것이 아니라, 주머니 입구에 작은 별 모양 자수를 놓아 주셨다. 나는 그 별이 너무 마음에 들어서 일부러 주머니에 손을 넣고 다녔다. 할머니가 바느질할 때면 안경을 코끝에 걸치고 실을 꿰는 모습이 무척 진지해 보였다." },
    { id: "p3", text: "세월이 흘러 할머니는 돌아가셨고, 시골집은 빈집이 되었다. 대학생이 된 나는 짐 정리를 위해 오랜만에 그 집을 찾았다. 방 한쪽에 먼지를 뒤집어쓴 재봉틀이 여전히 자리를 지키고 있었다. 서랍을 열자 알록달록한 실타래와 낡은 자 한 개, 그리고 쪽지 한 장이 나왔다. 쪽지에는 할머니의 삐뚤빼뚤한 글씨로 이렇게 적혀 있었다. 우리 손주 올 때 새 앞치마 만들어 줘야지, 파란 천 사 놓을 것." },
    { id: "p4", text: "나는 한동안 그 쪽지를 들여다보며 서 있었다. 할머니는 마지막까지 누군가를 위해 무언가를 만들 생각을 하고 계셨던 것이다. 재봉틀의 발판을 살짝 밟아 보았다. 녹슨 부품이 뻑뻑하게 움직이며 낮은 소리를 냈다. 그 소리 속에 할머니의 딸깍딸깍 리듬이 희미하게 겹치는 듯했다. 나는 재봉틀을 차에 싣고 서울로 돌아왔다. 거실 창가에 놓인 재봉틀은 이제 쓰이지 않지만, 아침 햇살을 받으며 조용히 할머니의 자리를 지키고 있다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "할머니가 동네 사람들의 옷을 고쳐 주고 받던 대가를 찾아 표시하세요.", [findRange(paragraphs, "p1", "대가로 받는 것은 고작 계란 한 판이나 텃밭에서 캔 감자 한 봉지였지만")]),
    makeConfirmQ("q2", "반바지 주머니를 기우며 할머니가 특별히 해 주신 것을 찾아 표시하세요.", [findRange(paragraphs, "p2", "주머니 입구에 작은 별 모양 자수를 놓아 주셨다")]),
    makeConfirmQ("q3", "할머니가 바느질할 때의 모습을 묘사한 부분을 찾아 표시하세요.", [findRange(paragraphs, "p2", "안경을 코끝에 걸치고 실을 꿰는 모습이 무척 진지해 보였다")]),
    makeConfirmQ("q4", "재봉틀 서랍에서 발견된 물건들을 찾아 표시하세요.", [findRange(paragraphs, "p3", "알록달록한 실타래와 낡은 자 한 개, 그리고 쪽지 한 장이 나왔다")]),
    makeConfirmQ("q5", "쪽지에 적힌 할머니의 메모 내용을 찾아 표시하세요.", [findRange(paragraphs, "p3", "우리 손주 올 때 새 앞치마 만들어 줘야지, 파란 천 사 놓을 것")]),
    makeConfirmQ("q6", "재봉틀 발판을 밟았을 때 들린 소리와 느낌을 묘사한 부분을 찾아 표시하세요.", [findRange(paragraphs, "p4", "녹슨 부품이 뻑뻑하게 움직이며 낮은 소리를 냈다")]),
    makeConfirmQ("q7", "재봉틀의 현재 위치와 상태를 설명하는 부분을 찾아 표시하세요.", [findRange(paragraphs, "p4", "거실 창가에 놓인 재봉틀은 이제 쓰이지 않지만, 아침 햇살을 받으며 조용히 할머니의 자리를 지키고 있다")])
  ];
  const content = assembleFull(280, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ============================================================
// Day 281 — 비문학: 인공 지능과 저작권
// ============================================================
function buildDay281() {
  const paragraphs = [
    { id: "p1", text: "인공 지능이 만든 그림이나 글에 저작권을 인정할 수 있느냐는 질문이 뜨거운 논쟁거리가 되고 있다. 기존 저작권법은 창작 주체를 사람으로 한정해 왔다. 그러나 생성형 인공 지능이 회화, 소설, 음악 등 다양한 콘텐츠를 만들어 내면서 이 원칙의 유효성에 의문이 제기된다. 미국 저작권청은 인공 지능이 자율적으로 만든 결과물에는 저작권을 부여하지 않겠다는 입장을 밝혔다." },
    { id: "p2", text: "한편, 인공 지능을 도구로 사용한 사람이 충분한 선택과 배열을 했다면 저작권을 인정할 수 있다는 견해도 존재한다. 사용자가 지시문을 작성하고 여러 결과물 중 하나를 골라 수정하는 과정이 창작적 기여에 해당한다는 것이다. 이 견해에 따르면 인공 지능은 붓이나 카메라와 같은 도구에 불과하며, 창의적 결정을 내린 사람이 저작자가 된다. 반대론자들은 지시문 입력만으로는 결과물의 표현을 예측하거나 통제할 수 없으므로 창작적 기여로 보기 어렵다고 반박한다." },
    { id: "p3", text: "또 다른 쟁점은 학습 데이터에 관한 것이다. 생성형 인공 지능은 방대한 기존 저작물을 학습하여 새 콘텐츠를 만드는데, 원저작자 동의 없이 저작물을 사용하는 것이 공정 이용인지가 논란이다. 일부 예술가와 작가 단체는 자신들의 작품이 무단으로 학습 데이터에 포함되었다며 소송을 제기하였다. 판결에 따라 산업 전체의 방향이 달라질 수 있어 기술계와 법조계 모두 주목하고 있다." },
    { id: "p4", text: "각국 정부는 새로운 입법을 모색하고 있다. 유럽 연합은 인공 지능법을 통해 학습 데이터 출처 공개 의무를 부과하는 방안을 추진하고 있으며, 일본은 비영리 학습에 한해 저작물 사용을 허용하는 유연한 접근을 취한다. 한국에서도 저작권법 개정 논의가 시작되었으나 결론은 나오지 않았다. 창작자의 권리와 기술 혁신 사이에서 균형 잡힌 기준을 마련하는 것이 시급하다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "기존 저작권법이 창작의 주체를 어떻게 규정해 왔는지 찾아 표시하세요.", [findRange(paragraphs, "p1", "기존 저작권법은 창작 주체를 사람으로 한정해 왔다")]),
    makeConfirmQ("q2", "미국 저작권청의 입장을 설명하는 부분을 찾아 표시하세요.", [findRange(paragraphs, "p1", "미국 저작권청은 인공 지능이 자율적으로 만든 결과물에는 저작권을 부여하지 않겠다는 입장을 밝혔다")]),
    makeConfirmQ("q3", "인공 지능을 창작 도구로 보는 견해의 핵심 논리를 찾아 표시하세요.", [findRange(paragraphs, "p2", "인공 지능은 붓이나 카메라와 같은 도구에 불과하며, 창의적 결정을 내린 사람이 저작자가 된다")]),
    makeConfirmQ("q4", "반대론자들이 지시문 입력의 한계를 지적하는 부분을 찾아 표시하세요.", [findRange(paragraphs, "p2", "지시문 입력만으로는 결과물의 표현을 예측하거나 통제할 수 없으므로 창작적 기여로 보기 어렵다고 반박한다")]),
    makeConfirmQ("q5", "예술가와 작가 단체가 취한 법적 조치를 찾아 표시하세요.", [findRange(paragraphs, "p3", "자신들의 작품이 무단으로 학습 데이터에 포함되었다며 소송을 제기하였다")]),
    makeConfirmQ("q6", "유럽 연합의 구체적인 규제 방안을 찾아 표시하세요.", [findRange(paragraphs, "p4", "유럽 연합은 인공 지능법을 통해 학습 데이터 출처 공개 의무를 부과하는 방안을 추진하고 있으며")]),
    makeConfirmQ("q7", "이 글에서 가장 시급하다고 한 것을 찾아 표시하세요.", [findRange(paragraphs, "p4", "창작자의 권리와 기술 혁신 사이에서 균형 잡힌 기준을 마련하는 것이 시급하다")])
  ];
  const content = assembleFull(281, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ============================================================
// Day 282 — 문학: 벽화 마을의 고양이
// ============================================================
function buildDay282() {
  const paragraphs = [
    { id: "p1", text: "산비탈에 다닥다닥 붙은 낡은 집들 사이로 좁은 골목이 미로처럼 이어져 있었다. 한때 철거 대상이었던 이 동네에 젊은 미술가들이 모여들더니 담벼락마다 벽화를 그리기 시작했다. 해바라기 밭이 펼쳐진 담장, 잉어가 물살을 가르는 벽, 하늘을 나는 고래가 그려진 계단 — 동네 곳곳이 미술관으로 변했다. 벽화 덕분에 관광객이 몰려들었고, 주민들은 카페와 기념품 가게를 열어 생계를 꾸렸다." },
    { id: "p2", text: "마을에는 노란 줄무늬 고양이 한 마리가 살았다. 주민들은 호랑이라 불렀는데, 늘 골목을 순찰하는 모습이 위풍당당했기 때문이다. 호랑이는 관광객이 카메라를 들이대면 꼿꼿이 앉아 포즈를 취했고, 사진을 찍고 나면 느릿느릿 다음 골목으로 이동했다. 마치 마을 안내원이라도 되는 듯했다. 벽화 마을 블로그에는 호랑이 사진이 빠지지 않았고, 이 고양이는 마을의 비공식 마스코트가 되었다." },
    { id: "p3", text: "어느 겨울, 호랑이가 보이지 않았다. 주민들이 골목을 뒤졌지만 찾을 수 없었다. 사흘째 되던 날, 미술가 지수가 빈집 지하에서 웅크린 호랑이를 발견했다. 앞다리를 다쳐 움직이지 못하고 있었다. 지수는 곧바로 동물 병원으로 데려갔고, 수술비는 주민들이 십시일반 모아 마련했다. 퇴원하던 날, 마을 입구에 작은 현수막이 걸렸다. 우리 호랑이 돌아왔다, 라는 문구 옆에 고양이 발바닥 그림이 있었다." },
    { id: "p4", text: "봄이 오자 지수는 마을 꼭대기 빈 담벼락에 새 벽화를 그렸다. 노란 줄무늬 고양이가 꽃밭 위를 유유히 걸어가는 모습이었다. 실제 호랑이는 그 벽화 아래 양지바른 자리에 누워 낮잠을 자곤 했다. 관광객들은 진짜 고양이와 그림 속 고양이를 나란히 사진에 담으며 환호했다. 호랑이는 반쯤 감은 눈으로 봄볕을 즐기며 카메라 소리에도 아랑곳하지 않았다. 마을 사람들은 말했다. 벽화가 마을을 살렸지만, 호랑이가 마을에 온기를 불어넣었다고." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "벽화 마을이 형성된 과정을 설명하는 부분을 찾아 표시하세요.", [findRange(paragraphs, "p1", "젊은 미술가들이 모여들더니 담벼락마다 벽화를 그리기 시작했다")]),
    makeConfirmQ("q2", "고양이에게 '호랑이'라는 이름이 붙은 이유를 찾아 표시하세요.", [findRange(paragraphs, "p2", "늘 골목을 순찰하는 모습이 위풍당당했기 때문이다")]),
    makeConfirmQ("q3", "호랑이가 관광객 앞에서 보이는 행동을 찾아 표시하세요.", [findRange(paragraphs, "p2", "관광객이 카메라를 들이대면 꼿꼿이 앉아 포즈를 취했고, 사진을 찍고 나면 느릿느릿 다음 골목으로 이동했다")]),
    makeConfirmQ("q4", "다친 호랑이를 발견한 상황을 설명하는 부분을 찾아 표시하세요.", [findRange(paragraphs, "p3", "미술가 지수가 빈집 지하에서 웅크린 호랑이를 발견했다")]),
    makeConfirmQ("q5", "수술비를 마련한 방법을 찾아 표시하세요.", [findRange(paragraphs, "p3", "수술비는 주민들이 십시일반 모아 마련했다")]),
    makeConfirmQ("q6", "지수가 새로 그린 벽화의 내용을 찾아 표시하세요.", [findRange(paragraphs, "p4", "노란 줄무늬 고양이가 꽃밭 위를 유유히 걸어가는 모습이었다")]),
    makeConfirmQ("q7", "마을 사람들이 호랑이에 대해 한 말을 찾아 표시하세요.", [findRange(paragraphs, "p4", "벽화가 마을을 살렸지만, 호랑이가 마을에 온기를 불어넣었다고")])
  ];
  const content = assembleFull(282, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ============================================================
// Day 283 — 비문학: 해수면 상승과 연안 도시
// ============================================================
function buildDay283() {
  const paragraphs = [
    { id: "p1", text: "지구 평균 기온이 산업화 이전보다 섭씨 일 점 오 도 이상 오르면 해수면 상승 속도가 급격히 빨라질 것이라는 전망이 과학계의 공통 견해이다. 주된 원인은 두 가지인데, 하나는 극지방 빙하가 녹아 바다로 유입되는 것이고, 다른 하나는 해수 온도 상승에 따른 열팽창 현상이다. 지난 백 년간 전 세계 해수면은 약 이십 센티미터 상승했으며, 앞으로 속도는 더 빨라질 것으로 예측된다." },
    { id: "p2", text: "해수면이 수십 센티미터만 더 올라도 연안 저지대 도시들은 심각한 위협에 직면한다. 인도네시아의 자카르타, 태국의 방콕 등은 이미 지반 침하와 해수면 상승이 동시에 진행되어 침수 피해가 반복된다. 인도네시아는 수도를 자카르타에서 내륙 도시 누산타라로 이전하기로 결정했을 정도이다. 바닷물이 해안가 농경지에 스며들면 토양의 염분 농도가 높아져 작물 재배가 불가능해지고, 식수원까지 오염되는 연쇄 피해가 일어난다." },
    { id: "p3", text: "위기 대응 전략은 방어, 적응, 후퇴의 세 가지로 구분된다. 방어 전략은 방조제나 제방을 건설하여 바닷물 침입을 막는 것이다. 네덜란드는 국토의 상당 부분이 해수면 아래에 있지만, 세계 최고 수준의 제방 시스템으로 수백 년간 바다와 싸워 왔다. 적응 전략은 해수면 상승을 전제하고 건축물을 설계하는 것으로, 수상 가옥이나 부유식 건축물이 대표적이다. 후퇴 전략은 해안가 거주지를 내륙으로 이전하는 것인데, 비용과 사회적 저항이 크다." },
    { id: "p4", text: "해수면 상승은 물리적 방어만으로 해결되지 않는다. 온실가스 배출을 줄이지 않으면 어떤 제방도 결국 한계에 도달한다. 국제 사회는 파리 협정을 통해 기온 상승 폭을 섭씨 이 도 이내로 제한하겠다는 목표를 세웠지만, 이행 속도는 더디다. 연안 도시 인구가 십억 명을 넘는 상황에서, 해수면 상승은 먼 미래가 아니라 이미 시작된 현실이라는 인식 전환이 절실하다." }
  ];
  const confirmQuestions = [
    makeConfirmQ("q1", "해수면 상승의 두 가지 주된 원인을 찾아 표시하세요.", [findRange(paragraphs, "p1", "극지방 빙하가 녹아 바다로 유입되는 것이고, 다른 하나는 해수 온도 상승에 따른 열팽창 현상이다")]),
    makeConfirmQ("q2", "인도네시아가 취한 극단적 대응을 찾아 표시하세요.", [findRange(paragraphs, "p2", "인도네시아는 수도를 자카르타에서 내륙 도시 누산타라로 이전하기로 결정했을 정도이다")]),
    makeConfirmQ("q3", "바닷물 침투가 농업에 미치는 영향을 설명하는 부분을 찾아 표시하세요.", [findRange(paragraphs, "p2", "바닷물이 해안가 농경지에 스며들면 토양의 염분 농도가 높아져 작물 재배가 불가능해지고")]),
    makeConfirmQ("q4", "방어 전략의 대표 사례로 언급된 나라를 찾아 표시하세요.", [findRange(paragraphs, "p3", "네덜란드는 국토의 상당 부분이 해수면 아래에 있지만, 세계 최고 수준의 제방 시스템으로 수백 년간 바다와 싸워 왔다")]),
    makeConfirmQ("q5", "적응 전략의 구체적인 건축 사례를 찾아 표시하세요.", [findRange(paragraphs, "p3", "수상 가옥이나 부유식 건축물이 대표적이다")]),
    makeConfirmQ("q6", "파리 협정의 목표를 설명하는 부분을 찾아 표시하세요.", [findRange(paragraphs, "p4", "파리 협정을 통해 기온 상승 폭을 섭씨 이 도 이내로 제한하겠다는 목표를 세웠지만")])
  ];
  const content = assembleFull(283, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ============================================================
// 실행부
// ============================================================
const results = [
  { dayIndex: 279, ...buildDay279() }, { dayIndex: 280, ...buildDay280() },
  { dayIndex: 281, ...buildDay281() }, { dayIndex: 282, ...buildDay282() },
  { dayIndex: 283, ...buildDay283() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];

results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});

fs.writeFileSync(path.join(__dirname, '..', 'generated', 'new', 'batch-f2-279-283.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
