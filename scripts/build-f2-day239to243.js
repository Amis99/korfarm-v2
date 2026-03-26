const fs = require('fs');
const path = require('path');

// ── 유틸리티 함수 ──

function findSentences(text) {
  const sentences = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1;
      while (next < text.length && (text[next] === ' ' || text[next] === '\n')) next++;
      start = next;
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
  return {
    contentId: `dr-f2-${nn}`, contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(프레게 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_2", schoolGradeRange: { min: 6, max: 6 },
    area: "READING", subArea, competencies: ["READING"], tags: ["daily"],
    access: { mode: "FREE" }, seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480, assets: {},
    payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline }, recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 }, confirm: { questions: confirmQuestions } }
  };
}

function wrapBatchItem(dayIndex, subArea, content) {
  return { content_type: "DAILY_READING", level_id: "FREGE_2", area: "READING", sub_area: subArea, day_index: dayIndex, module_key: "reading_training", schema_version: "1.0", content };
}

// ── Day 239 (홀수 → 비문학) ──
function buildDay239() {
  const paragraphs = [
    { id: "p1", text: "우리가 일상적으로 사용하는 종이는 나무에서 얻은 펄프를 원료로 만들어진다. 나무의 줄기를 잘게 부수고 화학 약품으로 처리하면 셀룰로스 섬유가 분리되는데, 이 섬유들을 물에 풀어 얇게 펼친 뒤 건조시키면 우리가 아는 종이가 완성된다. 종이의 역사는 약 2천 년 전 중국의 채륜이라는 인물에 의해 본격적으로 시작되었으며, 이후 실크로드를 통해 아랍 세계와 유럽으로 전파되어 인류 문명의 발전에 결정적인 역할을 하였다." },
    { id: "p2", text: "그러나 종이 생산은 환경에 상당한 부담을 준다. 종이 한 톤을 만들기 위해서는 약 스무 그루의 성목이 필요하며, 대량의 물과 에너지가 소비된다. 또한 펄프 제조 과정에서 사용되는 화학 약품은 수질 오염을 일으킬 수 있으며, 종이 생산을 위한 대규모 벌목은 산림 파괴와 생태계 교란의 원인이 되기도 한다. 전 세계적으로 연간 약 4억 톤의 종이가 생산되고 있으며, 이 수치는 해마다 꾸준히 증가하는 추세이다." },
    { id: "p3", text: "이러한 환경 문제를 줄이기 위해 종이 재활용이 적극적으로 추진되고 있다. 사용한 종이를 수거하여 다시 펄프로 만드는 재활용 과정은 새 종이를 만드는 것에 비해 나무 사용량을 크게 줄이고 에너지 소비도 약 70퍼센트 절감할 수 있다. 다만 종이는 재활용을 반복할수록 섬유의 길이가 짧아져 품질이 저하되기 때문에, 일반적으로 다섯 번에서 일곱 번 정도까지만 재활용이 가능하다는 한계가 있다." },
    { id: "p4", text: "최근에는 나무 대신 대나무나 사탕수수 찌꺼기 같은 대체 원료를 이용한 종이 생산 기술도 개발되고 있다. 대나무는 성장 속도가 매우 빨라 나무에 비해 훨씬 짧은 주기로 수확할 수 있어 지속 가능한 원료로 주목받고 있다. 또한 디지털 기술의 발달로 종이 사용량 자체를 줄이려는 노력도 확산되고 있어, 종이와 환경의 관계는 앞으로 더욱 변화할 것으로 전망된다." }
  ];
  console.log(`Day 239 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '셀룰로스 섬유가 분리되는데'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "셀룰로스 섬유가 분리되는데")]),
    makeConfirmQ("q2", "지문에서 '실크로드를 통해 아랍 세계와 유럽으로 전파되어'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "실크로드를 통해 아랍 세계와 유럽으로 전파되어")]),
    makeConfirmQ("q3", "지문에서 '산림 파괴와 생태계 교란'을 찾아 클릭하세요.", [findRange(paragraphs, "p2", "산림 파괴와 생태계 교란")]),
    makeConfirmQ("q4", "지문에서 '에너지 소비도 약 70퍼센트 절감'을 찾아 클릭하세요.", [findRange(paragraphs, "p3", "에너지 소비도 약 70퍼센트 절감")]),
    makeConfirmQ("q5", "지문에서 '다섯 번에서 일곱 번 정도까지만 재활용이 가능하다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "다섯 번에서 일곱 번 정도까지만 재활용이 가능하다")]),
    makeConfirmQ("q6", "지문에서 '대나무는 성장 속도가 매우 빨라'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "대나무는 성장 속도가 매우 빨라")])
  ];
  return { content: assembleFull(239, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ── Day 240 (짝수 → 문학) ──
function buildDay240() {
  const paragraphs = [
    { id: "p1", text: "민호는 전학 온 첫날부터 교실 맨 뒷자리에 앉았다. 새로운 학교의 낯선 분위기가 불편했고, 쉬는 시간에도 혼자 창밖만 바라보았다. 이전 학교에서는 친구들과 늘 떠들며 지냈는데, 이곳에서는 아무도 먼저 말을 걸어오지 않았다. 복도에서 아이들이 웃고 떠드는 소리가 들려올 때마다, 민호는 자신만 그 무리에서 빠져 있다는 느낌에 마음이 무거워졌다. 민호는 속으로 이 학교에 적응하기까지 오랜 시간이 걸릴 것이라고 생각했다." },
    { id: "p2", text: "일주일이 지났을 무렵, 체육 시간에 축구 경기를 하게 되었다. 민호는 평소 축구를 잘하는 편이었지만, 아무에게도 패스를 하지 않고 혼자 드리블만 하다가 상대 팀 수비수에게 공을 빼앗겼다. 같은 팀의 한 아이가 짜증 섞인 목소리로 말했다. '혼자 하려고 하지 말고 같이 하자. 축구는 혼자 하는 게 아니잖아.' 민호는 그 말에 얼굴이 붉어졌지만, 한편으로는 누군가가 자신에게 말을 걸어주었다는 사실에 묘한 안도감을 느꼈다." },
    { id: "p3", text: "그 아이의 이름은 준서였다. 준서는 수업이 끝난 뒤 민호에게 다가와 먼저 사과했다. '아까 너무 세게 말해서 미안해. 네가 축구를 잘하는 건 알겠는데 같이 하면 더 잘할 수 있을 것 같아서 그랬어.' 민호는 고개를 끄덕이며 대답했다. '내가 좀 긴장해서 그랬어. 다음에는 꼭 패스할게.' 그날 이후 둘은 점심시간마다 함께 운동장에서 공을 차기 시작했고, 민호의 교실에서의 표정도 조금씩 밝아져 갔다." },
    { id: "p4", text: "한 달이 지나자 민호에게는 준서 외에도 몇 명의 친구가 생겼다. 돌이켜 보면 적응이 어려웠던 것은 새로운 환경 탓이 아니라 스스로 마음의 문을 닫고 있었기 때문이라는 것을 민호는 깨달았다. 준서가 체육 시간에 던진 한마디가 그 닫힌 문을 열어준 열쇠였던 셈이다. 민호는 전학 오기 전의 자신과 지금의 자신이 조금 달라졌다는 것을 느꼈고, 그 변화가 결코 싫지 않았다." }
  ];
  console.log(`Day 240 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '교실 맨 뒷자리에 앉았다'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "교실 맨 뒷자리에 앉았다")]),
    makeConfirmQ("q2", "지문에서 '축구는 혼자 하는 게 아니잖아'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "축구는 혼자 하는 게 아니잖아")]),
    makeConfirmQ("q3", "지문에서 '묘한 안도감을 느꼈다'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "묘한 안도감을 느꼈다")]),
    makeConfirmQ("q4", "지문에서 '같이 하면 더 잘할 수 있을 것 같아서'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "같이 하면 더 잘할 수 있을 것 같아서")]),
    makeConfirmQ("q5", "지문에서 '민호의 교실에서의 표정도 조금씩 밝아져 갔다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "민호의 교실에서의 표정도 조금씩 밝아져 갔다")]),
    makeConfirmQ("q6", "지문에서 '스스로 마음의 문을 닫고 있었기 때문'을 찾아 클릭하세요.", [findRange(paragraphs, "p4", "스스로 마음의 문을 닫고 있었기 때문")]),
    makeConfirmQ("q7", "지문에서 '그 닫힌 문을 열어준 열쇠'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "그 닫힌 문을 열어준 열쇠")])
  ];
  return { content: assembleFull(240, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ── Day 241 (홀수 → 비문학) ──
function buildDay241() {
  const paragraphs = [
    { id: "p1", text: "화산은 지구 내부의 마그마가 지표면 위로 분출하는 현상으로, 지각판의 경계 부근에서 주로 발생한다. 지구의 표면은 여러 개의 지각판으로 이루어져 있으며, 이 판들이 서로 충돌하거나 벌어지는 곳에서 마그마가 상승하여 화산 활동이 일어난다. 태평양을 둘러싼 환태평양 조산대는 전 세계 활화산의 약 75퍼센트가 분포하는 지역으로, 이 지역을 흔히 불의 고리라고 부른다." },
    { id: "p2", text: "화산 분출은 그 형태에 따라 폭발적 분출과 비폭발적 분출로 나뉜다. 폭발적 분출은 점성이 높은 마그마가 내부의 가스 압력에 의해 격렬하게 터져 나오는 것으로, 화산재와 화산탄이 높이 솟구치며 주변에 큰 피해를 준다. 반면 비폭발적 분출은 점성이 낮은 용암이 조용히 흘러내리는 형태로, 하와이의 킬라우에아 화산이 대표적인 예이다. 두 유형 모두 주변 환경에 큰 영향을 미치지만, 그 양상은 크게 다르다." },
    { id: "p3", text: "화산 활동은 파괴적인 면만 있는 것이 아니다. 화산재가 쌓인 토양은 미네랄이 풍부하여 농업에 매우 적합하며, 실제로 화산 주변 지역의 농작물 생산량은 다른 지역보다 높은 경우가 많다. 또한 화산 지대에서 발생하는 지열 에너지는 친환경 에너지원으로 활용되고 있으며, 아이슬란드는 국가 전력의 상당 부분을 지열 발전으로 충당하고 있다." },
    { id: "p4", text: "현대 과학은 화산 분출을 예측하기 위해 다양한 방법을 활용하고 있다. 화산 주변의 지진 활동 변화, 지표면의 미세한 팽창, 화산 가스의 성분 변화 등을 지속적으로 관측함으로써 분출 가능성을 사전에 파악한다. 그러나 정확한 분출 시점을 예측하는 것은 여전히 어려운 과제이며, 화산 인근 지역의 주민들은 대피 훈련과 조기 경보 시스템을 통해 피해를 최소화하는 준비를 갖추어야 한다." }
  ];
  console.log(`Day 241 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '지각판의 경계 부근에서 주로 발생한다'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "지각판의 경계 부근에서 주로 발생한다")]),
    makeConfirmQ("q2", "지문에서 '불의 고리'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "불의 고리")]),
    makeConfirmQ("q3", "지문에서 '화산재와 화산탄이 높이 솟구치며'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "화산재와 화산탄이 높이 솟구치며")]),
    makeConfirmQ("q4", "지문에서 '화산재가 쌓인 토양은 미네랄이 풍부하여'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "화산재가 쌓인 토양은 미네랄이 풍부하여")]),
    makeConfirmQ("q5", "지문에서 '지열 에너지는 친환경 에너지원으로 활용되고 있으며'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "지열 에너지는 친환경 에너지원으로 활용되고 있으며")]),
    makeConfirmQ("q6", "지문에서 '지표면의 미세한 팽창'을 찾아 클릭하세요.", [findRange(paragraphs, "p4", "지표면의 미세한 팽창")]),
    makeConfirmQ("q7", "지문에서 '대피 훈련과 조기 경보 시스템'을 찾아 클릭하세요.", [findRange(paragraphs, "p4", "대피 훈련과 조기 경보 시스템")])
  ];
  return { content: assembleFull(241, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ── Day 242 (짝수 → 문학) ──
function buildDay242() {
  const paragraphs = [
    { id: "p1", text: "비가 내리는 토요일 오후, 은지는 다락방에서 오래된 상자 하나를 발견했다. 상자 안에는 할머니가 젊은 시절에 쓴 편지 묶음과 빛바랜 사진 몇 장이 들어 있었다. 은지는 조심스럽게 편지를 한 통 꺼내 읽기 시작했다. 편지에는 스무 살의 할머니가 고향을 떠나 도시에서 혼자 생활하며 느낀 외로움과 그리움이 담담한 문체로 적혀 있었다." },
    { id: "p2", text: "편지를 읽어 나갈수록 은지는 할머니의 젊은 날이 자신의 현재와 많이 닮아 있다는 것을 느꼈다. 새로운 환경에 적응하기 위해 애쓰는 마음, 가족이 그리울 때 혼자 삼키는 눈물, 그리고 그럼에도 포기하지 않고 하루하루를 살아가는 의지. 할머니도 자신과 같은 나이에 비슷한 고민을 했다는 사실이 은지에게는 위로가 되었다." },
    { id: "p3", text: "상자 바닥에는 작은 수첩이 하나 더 있었다. 수첩에는 할머니가 좋아하던 시와 노래 가사가 빼곡히 적혀 있었고, 군데군데 짧은 감상이 덧붙여져 있었다. '이 구절을 읽으면 마음이 편해진다'라거나 '오늘도 이 노래를 흥얼거리며 출근했다'는 메모를 읽으며, 은지는 할머니가 힘든 시간을 어떻게 견뎌냈는지를 조금이나마 이해할 수 있었다." },
    { id: "p4", text: "은지는 상자를 원래 자리에 돌려놓고 다락방을 나왔다. 거실에서 뜨개질을 하고 계신 할머니를 바라보며 은지는 미소를 지었다. 주름 가득한 얼굴 뒤에 숨어 있는 젊은 날의 이야기를 알게 되자, 할머니라는 존재가 이전과는 다르게 느껴졌다. 은지는 할머니 곁에 앉아 차 한 잔을 건네며, 오늘 발견한 이야기에 대해 물어보고 싶은 마음을 조용히 품었다." }
  ];
  console.log(`Day 242 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '빛바랜 사진 몇 장'을 찾아 클릭하세요.", [findRange(paragraphs, "p1", "빛바랜 사진 몇 장")]),
    makeConfirmQ("q2", "지문에서 '담담한 문체로 적혀 있었다'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "담담한 문체로 적혀 있었다")]),
    makeConfirmQ("q3", "지문에서 '가족이 그리울 때 혼자 삼키는 눈물'을 찾아 클릭하세요.", [findRange(paragraphs, "p2", "가족이 그리울 때 혼자 삼키는 눈물")]),
    makeConfirmQ("q4", "지문에서 '포기하지 않고 하루하루를 살아가는 의지'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "포기하지 않고 하루하루를 살아가는 의지")]),
    makeConfirmQ("q5", "지문에서 '이 구절을 읽으면 마음이 편해진다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "이 구절을 읽으면 마음이 편해진다")]),
    makeConfirmQ("q6", "지문에서 '주름 가득한 얼굴 뒤에 숨어 있는 젊은 날의 이야기'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "주름 가득한 얼굴 뒤에 숨어 있는 젊은 날의 이야기")])
  ];
  return { content: assembleFull(242, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ── Day 243 (홀수 → 비문학) ──
function buildDay243() {
  const paragraphs = [
    { id: "p1", text: "소리는 공기 중의 분자가 진동하면서 전달되는 파동이다. 물체가 진동하면 그 주변의 공기 분자들이 밀리고 당겨지면서 압축과 팽창이 반복되고, 이 과정이 연쇄적으로 퍼져 나가면 우리의 귀에 도달하여 소리로 인식된다. 소리의 세 가지 기본 특성은 높낮이, 크기, 음색으로, 높낮이는 진동수에 의해, 크기는 진폭에 의해, 음색은 파형의 형태에 의해 결정된다." },
    { id: "p2", text: "소리의 속도는 매질의 종류와 온도에 따라 달라진다. 공기 중에서 소리의 속도는 섭씨 20도 기준으로 초당 약 343미터이지만, 물속에서는 초당 약 1,500미터로 공기보다 네 배 이상 빠르다. 이는 물 분자가 공기 분자보다 밀도가 높아 진동을 더 효율적으로 전달하기 때문이다. 고체인 철에서는 소리의 속도가 초당 약 5,100미터에 달하여, 매질의 밀도와 탄성이 높을수록 소리가 빠르게 전달됨을 알 수 있다." },
    { id: "p3", text: "일상생활에서 소리의 원리를 활용한 기술은 다양하다. 초음파 검사는 인간의 귀에 들리지 않는 높은 진동수의 소리를 이용하여 몸속의 장기나 태아의 상태를 확인하는 의료 기술이다. 또한 소나는 바다 밑으로 소리를 보내 반사되어 돌아오는 시간을 측정함으로써 해저 지형을 탐색하거나 물고기 떼의 위치를 파악하는 데 사용된다. 소음 제거 기술은 원래 소리와 정반대의 파형을 만들어 소음을 상쇄하는 원리로 작동한다." },
    { id: "p4", text: "한편 지나치게 큰 소리는 인체에 해를 끼칠 수 있다. 85데시벨 이상의 소음에 장시간 노출되면 청각 세포가 손상되어 소음성 난청이 발생할 수 있으며, 이는 한번 발생하면 회복이 어렵다. 특히 이어폰을 통해 큰 음량으로 음악을 듣는 습관은 청소년층에서 청력 저하를 유발하는 주요 원인으로 지적되고 있다. 전문가들은 이어폰 사용 시 음량을 최대치의 60퍼센트 이하로 유지하고, 한 시간 이상 연속 사용을 피할 것을 권고한다." }
  ];
  console.log(`Day 243 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '압축과 팽창이 반복되고'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "압축과 팽창이 반복되고")]),
    makeConfirmQ("q2", "지문에서 '높낮이는 진동수에 의해'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "높낮이는 진동수에 의해")]),
    makeConfirmQ("q3", "지문에서 '물 분자가 공기 분자보다 밀도가 높아'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "물 분자가 공기 분자보다 밀도가 높아")]),
    makeConfirmQ("q4", "지문에서 '초음파 검사'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "초음파 검사")]),
    makeConfirmQ("q5", "지문에서 '원래 소리와 정반대의 파형을 만들어 소음을 상쇄하는 원리'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "원래 소리와 정반대의 파형을 만들어 소음을 상쇄하는 원리")]),
    makeConfirmQ("q6", "지문에서 '소음성 난청'을 찾아 클릭하세요.", [findRange(paragraphs, "p4", "소음성 난청")]),
    makeConfirmQ("q7", "지문에서 '음량을 최대치의 60퍼센트 이하로 유지하고'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "음량을 최대치의 60퍼센트 이하로 유지하고")])
  ];
  return { content: assembleFull(243, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ── 실행부 ──
const results = [
  { dayIndex: 239, ...buildDay239() },
  { dayIndex: 240, ...buildDay240() },
  { dayIndex: 241, ...buildDay241() },
  { dayIndex: 242, ...buildDay242() },
  { dayIndex: 243, ...buildDay243() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  OK ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});
const newDir = path.join(__dirname, '..', 'generated', 'new');
if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
const tempBatchPath = path.join(newDir, 'batch-f2-239-243.json');
fs.writeFileSync(tempBatchPath, JSON.stringify(batchItems, null, 2), 'utf8');
console.log(`  OK 임시 배치: ${tempBatchPath}`);
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length;
  const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
