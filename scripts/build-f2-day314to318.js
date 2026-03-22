#!/usr/bin/env node
// 프레게2 Day 314~318 일일독해 콘텐츠 빌더
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

// ===== Day 314 (짝수 → 문학) =====
function buildDay314() {
  const paragraphs = [
    { id: "p1", text: "할머니의 작은 텃밭에는 계절마다 다른 꽃이 피었다. 봄이면 노란 유채꽃이 밭 한쪽을 물들였고, 여름에는 붉은 백일홍이 울타리를 따라 줄지어 섰다. 가을이 되면 코스모스가 바람에 흔들리며 분홍빛 물결을 만들었고, 겨울에도 마른 국화가 서리를 맞으며 자리를 지켰다. 할머니는 언제나 그 꽃들 사이에서 흙을 만지며 조용히 미소를 짓곤 했다. 나는 어릴 적 할머니의 텃밭이 세상에서 가장 넓은 정원이라고 믿었다. 그곳에서 나는 흙냄새와 풀잎의 감촉을 처음 배웠고, 생명이 자라나는 과정을 눈앞에서 지켜보았다. 텃밭 한가운데에는 오래된 감나무 한 그루가 서 있었는데, 가을이면 주황빛 감이 주렁주렁 달려 마을 사람들도 부러워하곤 했다." },
    { id: "p2", text: "할머니가 돌아가신 후 텃밭은 오랫동안 방치되었다. 잡초가 무성히 자라 꽃밭의 흔적을 지웠고, 울타리는 기울어져 쓰러질 듯 서 있었다. 감나무마저 가지가 꺾여 쓸쓸한 모습이었다. 나는 도시에서의 바쁜 생활을 핑계로 그곳을 찾지 않았다. 해마다 봄이 올 때면 문득 할머니의 텃밭이 떠올랐지만, 발걸음을 옮기지는 못했다. 그러던 어느 날, 오래된 상자에서 할머니가 남긴 씨앗 봉투를 발견했다. 봉투 위에는 할머니의 삐뚤삐뚤한 글씨로 '내년 봄에 심을 것'이라고 적혀 있었다. 그 글씨를 보는 순간, 나는 가슴 한구석이 뜨거워지는 것을 느꼈다." },
    { id: "p3", text: "이듬해 봄, 나는 텃밭으로 돌아왔다. 잡초를 뽑고 흙을 고르며 할머니가 남긴 씨앗을 하나하나 심었다. 손에 묻은 흙을 바라보며 할머니의 손을 떠올렸다. 주름진 손가락 사이로 흙이 부서지던 모습이 생생하게 떠올랐다. 몇 주가 지나자 작은 싹들이 흙을 뚫고 올라왔다. 그것은 할머니가 보내는 마지막 편지 같았다. 나는 그 싹들을 바라보며 할머니가 가르쳐 준 것이 꽃을 키우는 법이 아니라, 무언가를 끈기 있게 돌보는 마음이었다는 것을 깨달았다." }
  ];
  console.log(`Day 314 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("cq1", "할머니의 텃밭에서 봄에 피는 꽃은 무엇이었나요?", [findRange(paragraphs, "p1", "노란 유채꽃이 밭 한쪽을 물들였고")]),
    makeConfirmQ("cq2", "화자가 할머니의 텃밭에서 처음 배운 것은 무엇인가요?", [findRange(paragraphs, "p1", "흙냄새와 풀잎의 감촉을 처음 배웠고, 생명이 자라나는 과정을 눈앞에서 지켜보았다")]),
    makeConfirmQ("cq3", "텃밭 한가운데에 있던 나무는 무엇인가요?", [findRange(paragraphs, "p1", "오래된 감나무 한 그루가 서 있었는데, 가을이면 주황빛 감이 주렁주렁 달려")]),
    makeConfirmQ("cq4", "할머니가 돌아가신 후 텃밭은 어떻게 되었나요?", [findRange(paragraphs, "p2", "잡초가 무성히 자라 꽃밭의 흔적을 지웠고, 울타리는 기울어져 쓰러질 듯 서 있었다")]),
    makeConfirmQ("cq5", "할머니가 남긴 씨앗 봉투에는 무엇이 적혀 있었나요?", [findRange(paragraphs, "p2", "내년 봄에 심을 것")]),
    makeConfirmQ("cq6", "화자가 이듬해 봄 텃밭에서 한 일은 무엇인가요?", [findRange(paragraphs, "p3", "잡초를 뽑고 흙을 고르며 할머니가 남긴 씨앗을 하나하나 심었다")]),
    makeConfirmQ("cq7", "화자가 최종적으로 깨달은 것은 무엇인가요?", [findRange(paragraphs, "p3", "할머니가 가르쳐 준 것이 꽃을 키우는 법이 아니라, 무언가를 끈기 있게 돌보는 마음이었다는 것을 깨달았다")])
  ];
  const content = assembleFull(314, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ===== Day 315 (홀수 → 비문학) =====
function buildDay315() {
  const paragraphs = [
    { id: "p1", text: "지구의 대기는 여러 층으로 나뉘어 있으며, 각 층은 고유한 특성을 지닌다. 가장 아래쪽에 있는 대류권은 지표면에서 약 12킬로미터 높이까지 뻗어 있으며, 우리가 경험하는 모든 날씨 현상이 이 층에서 발생한다. 구름, 비, 눈, 바람 등 일상적인 기상 현상이 모두 대류권 내에서 이루어지는 것이다. 대류권 위에는 성층권이 자리 잡고 있는데, 이곳에는 오존층이 존재하여 태양의 자외선을 흡수하는 중요한 역할을 한다. 성층권에서는 대류가 거의 일어나지 않아 공기가 안정적이며, 이 때문에 장거리 항공기가 이 층에서 비행하는 것이 효율적이다." },
    { id: "p2", text: "성층권 위로는 중간권과 열권이 차례로 존재한다. 중간권은 약 50킬로미터에서 85킬로미터 사이에 위치하며, 대기 중에서 가장 온도가 낮은 층이다. 이 층의 상단부에서는 온도가 영하 90도 이하로 떨어지기도 한다. 유성이 대기에 진입할 때 이 층에서 마찰에 의해 빛을 내며 타오르게 된다. 열권은 85킬로미터 이상의 고도에 위치하며, 태양 에너지를 직접 흡수하기 때문에 온도가 매우 높다. 이 층에서는 오로라 현상이 발생하는데, 태양풍에 실려 온 입자들이 대기 분자와 충돌하여 아름다운 빛을 만들어 낸다. 국제 우주 정거장은 이 열권 내에서 지구를 공전하고 있다." },
    { id: "p3", text: "대기의 각 층은 서로 독립적으로 존재하는 것이 아니라 상호작용을 통해 지구의 기후를 조절한다. 대류권에서 발생한 수증기와 열에너지는 상층 대기로 전달되며, 성층권의 오존은 지표면에 도달하는 자외선의 양을 결정한다. 최근 과학자들은 기후 변화가 이러한 대기 층 간의 균형을 교란시키고 있다는 사실을 밝혀냈다. 온실가스의 증가는 대류권의 온도를 높이는 동시에 성층권의 온도를 낮추는 역설적인 효과를 만들어 낸다. 이러한 변화는 오존층의 회복 속도에도 영향을 미치며, 궁극적으로 지구 전체의 기후 시스템에 복잡한 연쇄 반응을 일으킨다." }
  ];
  console.log(`Day 315 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("cq1", "대류권의 높이와 특성은 무엇인가요?", [findRange(paragraphs, "p1", "지표면에서 약 12킬로미터 높이까지 뻗어 있으며, 우리가 경험하는 모든 날씨 현상이 이 층에서 발생한다")]),
    makeConfirmQ("cq2", "성층권에서 장거리 항공기 비행이 효율적인 이유는 무엇인가요?", [findRange(paragraphs, "p1", "대류가 거의 일어나지 않아 공기가 안정적이며, 이 때문에 장거리 항공기가 이 층에서 비행하는 것이 효율적이다")]),
    makeConfirmQ("cq3", "중간권 상단부의 온도는 어떠한가요?", [findRange(paragraphs, "p2", "온도가 영하 90도 이하로 떨어지기도 한다")]),
    makeConfirmQ("cq4", "오로라 현상이 발생하는 원리는 무엇인가요?", [findRange(paragraphs, "p2", "태양풍에 실려 온 입자들이 대기 분자와 충돌하여 아름다운 빛을 만들어 낸다")]),
    makeConfirmQ("cq5", "국제 우주 정거장은 어느 대기층에서 공전하나요?", [findRange(paragraphs, "p2", "국제 우주 정거장은 이 열권 내에서 지구를 공전하고 있다")]),
    makeConfirmQ("cq6", "온실가스 증가의 역설적인 효과는 무엇인가요?", [findRange(paragraphs, "p3", "대류권의 온도를 높이는 동시에 성층권의 온도를 낮추는 역설적인 효과를 만들어 낸다")]),
    makeConfirmQ("cq7", "대기 층 간의 상호작용이 기후에 미치는 영향은 무엇인가요?", [findRange(paragraphs, "p3", "지구 전체의 기후 시스템에 복잡한 연쇄 반응을 일으킨다")])
  ];
  const content = assembleFull(315, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ===== Day 316 (짝수 → 문학) =====
function buildDay316() {
  const paragraphs = [
    { id: "p1", text: "장마가 끝난 뒤 마을 어귀의 개울은 유난히 맑았다. 수진이는 매일 오후 그 개울가에 앉아 물속의 조약돌을 들여다보곤 했다. 물살에 씻긴 돌들은 하나하나 다른 빛깔을 품고 있었다. 어떤 것은 호박색으로 빛났고, 어떤 것은 짙은 회색 위에 흰 줄무늬가 새겨져 있었다. 또 어떤 돌은 투명한 석영 결정이 박혀 햇빛 아래에서 유리처럼 반짝였다. 수진이는 그중에서 특히 마음에 드는 돌을 골라 주머니에 넣어 두곤 했다. 그 돌들은 수진이에게 작은 보물이었고, 어딘가 멀리 떠나고 싶을 때마다 꺼내 보는 위안의 물건이었다." },
    { id: "p2", text: "그해 가을, 수진이네 가족은 도시로 이사를 가게 되었다. 아버지의 직장이 옮겨진 탓이었다. 수진이는 개울가에서 마지막으로 돌 하나를 주웠다. 손바닥 위에 올려놓으니 햇살을 받아 연한 초록빛이 감돌았다. 수진이는 그 돌을 가장 소중한 물건들과 함께 작은 상자에 넣었다. 도시의 학교에서 수진이는 낯선 환경에 적응하느라 힘든 나날을 보냈다. 아이들은 이미 무리를 지어 다녔고, 수진이가 끼어들 틈은 좀처럼 보이지 않았다. 쉬는 시간에 혼자 교실 창가에 서서 회색빛 건물들 사이로 보이는 좁은 하늘을 올려다보았다." },
    { id: "p3", text: "어느 날 같은 반의 유나가 수진이에게 다가와 말을 걸었다. 유나는 수진이의 책상 위에 놓인 초록빛 돌을 보고 호기심을 보였다. 수진이는 처음에 망설였지만, 조심스럽게 돌의 이야기를 들려주었다. 고향 마을의 개울, 물속에서 반짝이던 조약돌들, 장마 뒤의 맑은 물소리까지. 유나는 눈을 반짝이며 들었고, 자신도 할머니 댁 근처 바닷가에서 조개를 모으던 이야기를 해 주었다. 그날 이후 두 사람은 서로의 보물 이야기를 나누며 가까워졌다. 수진이는 작은 돌 하나가 새로운 세계로 통하는 다리가 될 수 있다는 것을 알게 되었다." }
  ];
  console.log(`Day 316 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("cq1", "수진이가 개울가에서 주로 한 일은 무엇인가요?", [findRange(paragraphs, "p1", "물속의 조약돌을 들여다보곤 했다")]),
    makeConfirmQ("cq2", "수진이에게 조약돌은 어떤 의미였나요?", [findRange(paragraphs, "p1", "작은 보물이었고, 어딘가 멀리 떠나고 싶을 때마다 꺼내 보는 위안의 물건이었다")]),
    makeConfirmQ("cq3", "수진이가 마지막으로 주운 돌은 어떤 빛깔이었나요?", [findRange(paragraphs, "p2", "햇살을 받아 연한 초록빛이 감돌았다")]),
    makeConfirmQ("cq4", "도시 학교에서 수진이가 적응하기 어려웠던 이유는 무엇인가요?", [findRange(paragraphs, "p2", "아이들은 이미 무리를 지어 다녔고, 수진이가 끼어들 틈은 좀처럼 보이지 않았다")]),
    makeConfirmQ("cq5", "도시에서 수진이는 쉬는 시간에 무엇을 했나요?", [findRange(paragraphs, "p2", "혼자 교실 창가에 서서 회색빛 건물들 사이로 보이는 좁은 하늘을 올려다보았다")]),
    makeConfirmQ("cq6", "유나가 수진이에게 관심을 보인 계기는 무엇인가요?", [findRange(paragraphs, "p3", "수진이의 책상 위에 놓인 초록빛 돌을 보고 호기심을 보였다")]),
    makeConfirmQ("cq7", "수진이가 깨달은 것은 무엇인가요?", [findRange(paragraphs, "p3", "작은 돌 하나가 새로운 세계로 통하는 다리가 될 수 있다는 것을 알게 되었다")])
  ];
  const content = assembleFull(316, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ===== Day 317 (홀수 → 비문학) =====
function buildDay317() {
  const paragraphs = [
    { id: "p1", text: "인류가 시간을 측정하기 시작한 역사는 매우 오래되었다. 고대 이집트인들은 해시계를 이용하여 하루를 나누었고, 물시계는 밤에도 시간을 알 수 있는 방법으로 널리 사용되었다. 고대 그리스에서는 물시계를 클렙시드라라고 불렀으며, 법정에서 발언 시간을 제한하는 용도로도 활용하였다. 중세 유럽에서는 수도원을 중심으로 기계식 시계가 발전하였다. 무거운 추의 낙하 에너지를 이용하여 톱니바퀴를 움직이는 이 장치는 당시로서는 획기적인 발명이었다. 그러나 초기 기계식 시계는 하루에 수십 분씩 오차가 발생하여 정밀한 시간 측정에는 한계가 있었다." },
    { id: "p2", text: "17세기에 네덜란드의 과학자 크리스티안 하위헌스가 진자시계를 발명하면서 시간 측정의 정밀도는 비약적으로 향상되었다. 진자의 등시성, 즉 진폭에 관계없이 왕복 시간이 일정하다는 원리를 활용한 이 시계는 하루 오차를 수 초 이내로 줄였다. 이후 18세기에는 항해용 정밀 시계인 크로노미터가 개발되어 바다에서의 경도 측정 문제를 해결하였다. 영국의 시계 장인 존 해리슨이 수십 년에 걸쳐 완성한 이 시계는 배의 흔들림 속에서도 정확한 시간을 유지하여 대항해 시대의 항해 안전성을 획기적으로 높였다. 크로노미터의 등장으로 선원들은 더 이상 별자리에만 의존하지 않고도 정확한 항로를 계산할 수 있게 되었다." },
    { id: "p3", text: "현대에 이르러 시간 측정 기술은 원자 단위로 발전하였다. 원자시계는 세슘 원자가 방출하는 전자기파의 진동수를 기준으로 작동하며, 수천만 년에 1초 이내의 오차만을 허용한다. 이 놀라운 정밀도는 인공위성 항법 시스템인 GPS의 핵심 기술로 활용된다. GPS 위성에 탑재된 원자시계는 지상의 수신기와 정확한 시간 차이를 계산하여 위치를 결정하는데, 만약 시계에 백만분의 일 초라도 오차가 발생하면 위치 측정에서 수백 미터의 오류가 생길 수 있다. 시간의 정확한 측정은 단순한 편의를 넘어 현대 문명의 기반이 되었다." }
  ];
  console.log(`Day 317 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("cq1", "고대 이집트인들은 어떤 도구로 시간을 측정했나요?", [findRange(paragraphs, "p1", "해시계를 이용하여 하루를 나누었고, 물시계는 밤에도 시간을 알 수 있는 방법으로 널리 사용되었다")]),
    makeConfirmQ("cq2", "고대 그리스에서 물시계를 어떤 용도로 활용했나요?", [findRange(paragraphs, "p1", "법정에서 발언 시간을 제한하는 용도로도 활용하였다")]),
    makeConfirmQ("cq3", "초기 기계식 시계의 한계는 무엇이었나요?", [findRange(paragraphs, "p1", "하루에 수십 분씩 오차가 발생하여 정밀한 시간 측정에는 한계가 있었다")]),
    makeConfirmQ("cq4", "진자시계가 활용한 원리는 무엇인가요?", [findRange(paragraphs, "p2", "진폭에 관계없이 왕복 시간이 일정하다는 원리")]),
    makeConfirmQ("cq5", "크로노미터가 해결한 문제는 무엇인가요?", [findRange(paragraphs, "p2", "바다에서의 경도 측정 문제를 해결하였다")]),
    makeConfirmQ("cq6", "원자시계의 작동 원리는 무엇인가요?", [findRange(paragraphs, "p3", "세슘 원자가 방출하는 전자기파의 진동수를 기준으로 작동하며")]),
    makeConfirmQ("cq7", "GPS에서 원자시계에 오차가 생기면 어떤 문제가 발생하나요?", [findRange(paragraphs, "p3", "백만분의 일 초라도 오차가 발생하면 위치 측정에서 수백 미터의 오류가 생길 수 있다")])
  ];
  const content = assembleFull(317, "NONFICTION", "비문학", paragraphs, confirmQuestions);
  return { content, subArea: "NONFICTION" };
}

// ===== Day 318 (짝수 → 문학) =====
function buildDay318() {
  const paragraphs = [
    { id: "p1", text: "민호는 아버지가 운영하는 작은 제과점의 새벽 풍경을 좋아했다. 매일 새벽 네 시면 아버지는 밀가루를 체에 치고 반죽을 시작했다. 오븐에서 빵이 부풀어 오르는 동안 제과점 안은 고소한 밀 향기로 가득 찼다. 민호는 학교에 가기 전 가게에 들러 갓 구운 식빵 한 조각을 먹곤 했다. 뜨거운 김이 올라오는 빵 위에 버터를 바르면 노르스름하게 녹아내렸다. 그 따뜻한 빵 한 조각에는 아버지의 정성과 새벽잠을 포기한 시간이 고스란히 담겨 있었다. 민호는 그것이 세상에서 가장 맛있는 빵이라고 생각했다." },
    { id: "p2", text: "중학교에 올라가면서 민호는 아버지의 제과점이 부끄러워지기 시작했다. 친구들이 유명한 프랜차이즈 빵집 이야기를 할 때면 민호는 입을 다물었다. 아버지의 가게는 간판도 낡았고, 진열대의 빵 종류도 많지 않았다. 화려한 케이크나 마카롱 같은 유행하는 디저트는 만들지 않았고, 식빵과 단팥빵, 소보로빵 같은 소박한 빵들만 진열되어 있었다. 민호는 점점 새벽에 가게에 들르지 않게 되었고, 아버지가 건네는 빵도 대충 받아 가방에 넣곤 했다. 아버지는 아무 말 없이 묵묵히 반죽을 치댔지만, 어깨가 조금 더 처져 보이는 것 같았다." },
    { id: "p3", text: "어느 겨울날, 민호는 방과 후 친구 재현이와 함께 집으로 걸어오고 있었다. 골목을 지나는데 재현이가 갑자기 걸음을 멈추고 코를 킁킁거렸다. 어디선가 빵 굽는 냄새가 풍겨왔다. 재현이는 냄새를 따라 아버지의 제과점 앞에 섰다. 유리창 너머로 아버지가 반죽을 다루는 모습이 보였다. 밀가루가 묻은 앞치마를 두르고 커다란 반죽 덩어리를 양손으로 힘차게 치대는 아버지의 모습은 어딘가 장인 같았다. 재현이는 감탄하며 말했다. 직접 손으로 만드는 빵집이 아직 있다니, 정말 대단하다고. 민호는 그 순간 자신이 얼마나 소중한 것을 외면해 왔는지 깨달았다. 가게 문을 열고 들어간 민호에게 아버지는 아무 일 없었다는 듯 따뜻한 단팥빵 하나를 건넸다." }
  ];
  console.log(`Day 318 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("cq1", "아버지는 매일 몇 시에 빵을 만들기 시작했나요?", [findRange(paragraphs, "p1", "매일 새벽 네 시면 아버지는 밀가루를 체에 치고 반죽을 시작했다")]),
    makeConfirmQ("cq2", "민호가 아버지의 빵을 세상에서 가장 맛있다고 생각한 이유는 무엇인가요?", [findRange(paragraphs, "p1", "아버지의 정성과 새벽잠을 포기한 시간이 고스란히 담겨 있었다")]),
    makeConfirmQ("cq3", "중학교에 올라간 민호가 아버지의 제과점을 부끄러워한 이유는 무엇인가요?", [findRange(paragraphs, "p2", "간판도 낡았고, 진열대의 빵 종류도 많지 않았다")]),
    makeConfirmQ("cq4", "아버지의 가게에 진열된 빵 종류는 어떤 것들이었나요?", [findRange(paragraphs, "p2", "식빵과 단팥빵, 소보로빵 같은 소박한 빵들만 진열되어 있었다")]),
    makeConfirmQ("cq5", "민호의 태도 변화에 아버지는 어떻게 반응했나요?", [findRange(paragraphs, "p2", "아무 말 없이 묵묵히 반죽을 치댔지만, 어깨가 조금 더 처져 보이는 것 같았다")]),
    makeConfirmQ("cq6", "재현이가 제과점에 대해 감탄한 이유는 무엇인가요?", [findRange(paragraphs, "p3", "직접 손으로 만드는 빵집이 아직 있다니, 정말 대단하다고")]),
    makeConfirmQ("cq7", "민호가 가게에 들어갔을 때 아버지는 어떻게 했나요?", [findRange(paragraphs, "p3", "아무 일 없었다는 듯 따뜻한 단팥빵 하나를 건넸다")])
  ];
  const content = assembleFull(318, "LITERATURE", "문학", paragraphs, confirmQuestions);
  return { content, subArea: "LITERATURE" };
}

// ===== 실행부 =====
const results = [
  { dayIndex: 314, ...buildDay314() }, { dayIndex: 315, ...buildDay315() },
  { dayIndex: 316, ...buildDay316() }, { dayIndex: 317, ...buildDay317() },
  { dayIndex: 318, ...buildDay318() }
];

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'frege2');
const batchItems = [];
results.forEach(({ dayIndex, content, subArea }) => {
  const filePath = path.join(staticDir, `${String(dayIndex).padStart(3, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`  ✅ ${filePath}`);
  batchItems.push(wrapBatchItem(dayIndex, subArea, content));
});
fs.writeFileSync(path.join(__dirname, '..', 'generated', 'new', 'batch-f2-314-318.json'), JSON.stringify(batchItems, null, 2), 'utf8');
console.log('\n=== 검증 ===');
results.forEach(({ dayIndex, content }) => {
  const p = content.payload;
  const len = p.passage.paragraphs.reduce((s, pg) => s + pg.text.length, 0);
  const rc = p.recall.cards.length; const cq = p.confirm.questions.length;
  const ok = len >= 850 && len <= 950 && rc === 8 && cq >= 5;
  console.log(`Day ${dayIndex}: ${len}자 | recall=${rc} | confirm=${cq} | ${ok ? 'OK' : 'WARN'}`);
});
