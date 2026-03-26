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

// ── Day 234 (짝수 → 문학) ──
function buildDay234() {
  const paragraphs = [
    { id: "p1", text: "소년은 매일 학교가 끝나면 마을 뒷산으로 올라갔다. 그곳에는 아무도 찾지 않는 낡은 정자가 하나 있었는데, 소년은 그 정자의 마루에 걸터앉아 먼 산들이 겹겹이 이어지는 풍경을 바라보는 것을 좋아했다. 바람이 불면 소나무 가지들이 서로 부딪치며 내는 소리가 마치 누군가 속삭이는 것처럼 들려왔고, 소년은 그 소리를 들으며 하루의 피로를 잊었다. 집에서는 아버지와 어머니가 늘 바쁘게 일했기에, 소년에게는 이 정자만이 온전히 자기 것인 유일한 공간이었다." },
    { id: "p2", text: "어느 날 소년이 정자에 올라가 보니, 난간에 기대어 앉아 있는 소녀가 있었다. 소녀는 두꺼운 책을 무릎 위에 펼쳐 놓고 무언가를 열심히 읽고 있었다. 소년이 다가가자 소녀는 고개를 들어 잠깐 눈을 마주치더니, 아무 말 없이 다시 책으로 시선을 돌렸다. 소년은 평소처럼 마루의 반대편에 앉았지만, 그날따라 산의 풍경보다는 책장을 넘기며 조용히 읽고 있는 소녀의 모습이 더 많이 눈에 들어왔다." },
    { id: "p3", text: "그 뒤로 소녀는 거의 매일 같은 시간에 정자에 나타났다. 둘은 서로 이름조차 묻지 않은 채, 각자의 자리에 앉아 조용한 시간을 보냈다. 소년은 풍경을 바라보았고, 소녀는 책을 읽었다. 가끔 소녀가 책에서 눈을 떼고 먼 산을 바라볼 때면, 소년은 왠지 모르게 마음이 편안해지는 것을 느꼈다. 말은 없었지만 둘 사이에는 어떤 무언의 약속 같은 것이 조금씩 생겨나고 있었다." },
    { id: "p4", text: "여름 방학이 시작되던 날, 소년이 평소처럼 정자에 올라가 보니 소녀의 모습은 보이지 않았다. 대신 난간 위에 작은 쪽지 한 장이 놓여 있었다. '이 자리가 참 좋았어요. 고마워요.'라고 또박또박 적힌 짧은 글씨를 읽으며, 소년은 처음으로 누군가의 부재가 이렇게 선명하게 느껴질 수 있다는 것을 알게 되었다. 소년은 쪽지를 조심스럽게 접어 호주머니에 넣고, 평소보다 훨씬 오래도록 혼자서 산을 바라보았다." }
  ];
  console.log(`Day 234 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '낡은 정자'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "낡은 정자")]),
    makeConfirmQ("q2", "지문에서 '소나무 가지들이 서로 부딪치며 내는 소리'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "소나무 가지들이 서로 부딪치며 내는 소리")]),
    makeConfirmQ("q3", "지문에서 '두꺼운 책을 무릎 위에 펼쳐 놓고'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "두꺼운 책을 무릎 위에 펼쳐 놓고")]),
    makeConfirmQ("q4", "지문에서 '무언의 약속'을 찾아 클릭하세요.", [findRange(paragraphs, "p3", "무언의 약속")]),
    makeConfirmQ("q5", "지문에서 '누군가의 부재가 이렇게 선명하게 느껴질 수 있다는 것'을 찾아 클릭하세요.", [findRange(paragraphs, "p4", "누군가의 부재가 이렇게 선명하게 느껴질 수 있다는 것")]),
    makeConfirmQ("q6", "지문에서 '이 자리가 참 좋았어요'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "이 자리가 참 좋았어요")])
  ];
  return { content: assembleFull(234, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ── Day 235 (홀수 → 비문학) ──
function buildDay235() {
  const paragraphs = [
    { id: "p1", text: "우리가 매일 마시는 물은 지구 표면의 약 71퍼센트를 덮고 있지만, 그중 인간이 실제로 사용할 수 있는 담수는 전체 물의 약 2.5퍼센트에 불과하다. 더욱이 이 담수의 대부분은 극지방의 빙하나 깊은 지하에 갇혀 있어서, 강이나 호수 등 인간이 쉽게 접근할 수 있는 물은 전체의 0.01퍼센트도 되지 않는다. 이러한 사실은 물이 풍부하게 보이는 지구에서도 깨끗하고 안전한 물을 확보하는 일이 결코 쉽지 않다는 것을 분명하게 보여 준다." },
    { id: "p2", text: "물 부족 문제는 단순히 자연적인 수자원의 양에만 달려 있는 것이 아니다. 인구 증가와 급속한 산업화로 인해 물의 수요가 급격히 늘어난 반면, 수질 오염과 기후 변화로 인해 사용 가능한 물의 양은 오히려 줄어들고 있다. 세계보건기구에 따르면 전 세계 인구의 약 26퍼센트가 안전한 식수를 확보하지 못하고 있으며, 이는 건강 문제와 빈곤의 악순환을 낳는 심각한 원인이 되고 있다. 특히 아프리카와 남아시아 지역에서는 오염된 물로 인한 수인성 질병이 여전히 높은 사망률의 주된 원인 가운데 하나로 꼽힌다." },
    { id: "p3", text: "이러한 문제를 해결하기 위해 전 세계적으로 다양한 기술이 개발되고 있다. 해수 담수화 기술은 바닷물에서 소금과 불순물을 제거하여 마실 수 있는 물을 만드는 방법으로, 중동 지역의 여러 국가에서 이미 널리 활용되고 있다. 또한 빗물 저장 시스템이나 지하수를 효율적으로 관리하는 기술도 물 부족을 완화하는 데 크게 기여하고 있다. 하지만 이러한 기술들은 높은 비용과 에너지 소비가 수반되므로, 근본적인 해결책으로는 물 사용량 자체를 줄이는 절약 의식이 필요하다." }
  ];
  console.log(`Day 235 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '담수는 전체 물의 약 2.5퍼센트'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "담수는 전체 물의 약 2.5퍼센트")]),
    makeConfirmQ("q2", "지문에서 '극지방의 빙하나 깊은 지하에 갇혀 있어서'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "극지방의 빙하나 깊은 지하에 갇혀 있어서")]),
    makeConfirmQ("q3", "지문에서 '수질 오염과 기후 변화'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "수질 오염과 기후 변화")]),
    makeConfirmQ("q4", "지문에서 '건강 문제와 빈곤의 악순환'을 찾아 클릭하세요.", [findRange(paragraphs, "p2", "건강 문제와 빈곤의 악순환")]),
    makeConfirmQ("q5", "지문에서 '수인성 질병'을 찾아 클릭하세요.", [findRange(paragraphs, "p2", "수인성 질병")]),
    makeConfirmQ("q6", "지문에서 '해수 담수화 기술'을 찾아 클릭하세요.", [findRange(paragraphs, "p3", "해수 담수화 기술")]),
    makeConfirmQ("q7", "지문에서 '물 사용량 자체를 줄이는 절약 의식이 필요하다'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "물 사용량 자체를 줄이는 절약 의식이 필요하다")])
  ];
  return { content: assembleFull(235, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ── Day 236 (짝수 → 문학) ──
function buildDay236() {
  const paragraphs = [
    { id: "p1", text: "할아버지의 서재에는 오래된 나무 냄새가 깊이 배어 있었다. 벽면을 가득 채운 책장에는 누렇게 변색된 책들이 빼곡히 꽂혀 있었고, 책장 사이사이에는 할아버지가 젊은 시절 세계 각지를 여행하며 모은 기념품들이 가지런히 놓여 있었다. 나는 어릴 때부터 이 서재에 들어오는 것을 좋아했는데, 책 냄새와 나무 냄새가 섞인 그 특유의 공기를 맡으면 마치 다른 세계에 온 것 같은 기분이 들었기 때문이다." },
    { id: "p2", text: "할아버지는 은퇴한 뒤로 하루의 대부분을 서재에서 보냈다. 오전에는 신문을 꼼꼼히 읽고, 오후에는 예전에 쓰던 일기장을 펼쳐 보거나 새로운 책을 읽었다. 가끔 나에게 어린 시절의 이야기를 들려주기도 했는데, 할아버지의 이야기 속에는 전쟁 중에도 책을 놓지 않았던 외증조부의 모습이나, 시골의 작은 학교에서 학생들에게 문학을 가르치던 할아버지 자신의 젊은 날이 생생하게 담겨 있었다." },
    { id: "p3", text: "어느 날 할아버지는 서재의 가장 높은 선반에서 낡은 가죽 표지의 책 한 권을 조심스럽게 꺼내 주었다. 그것은 할아버지의 아버지가 직접 필사한 시집이었다. 종이는 세월의 무게를 이기지 못해 바스러질 듯 얇았지만, 붓으로 정성스럽게 한 자 한 자 적은 글씨는 여전히 또렷하게 남아 있었다. 할아버지는 그 책을 건네며 말했다. '이 책이 우리 집안에서 가장 귀한 보물이란다. 돈으로 살 수 없는 것들이 세상에는 분명히 있거든.'" },
    { id: "p4", text: "나는 그 필사 시집을 조심스럽게 넘기며 한 편 한 편을 천천히 읽었다. 글씨 하나하나에 깃든 정성이 느껴졌고, 종이 위에 남은 오래된 먹 냄새는 시간을 거슬러 올라가게 하는 묘한 힘이 있었다. 할아버지의 서재는 단순히 책을 보관하는 곳이 아니라, 한 가문의 기억과 정신이 살아 숨 쉬는 공간이었다. 나는 그날 이후로 서재에 들어갈 때마다 무언가 소중한 것을 이어받고 있다는 느낌을 갖게 되었다." }
  ];
  console.log(`Day 236 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '누렇게 변색된 책들'을 찾아 클릭하세요.", [findRange(paragraphs, "p1", "누렇게 변색된 책들")]),
    makeConfirmQ("q2", "지문에서 '다른 세계에 온 것 같은 기분'을 찾아 클릭하세요.", [findRange(paragraphs, "p1", "다른 세계에 온 것 같은 기분")]),
    makeConfirmQ("q3", "지문에서 '전쟁 중에도 책을 놓지 않았던 외증조부'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "전쟁 중에도 책을 놓지 않았던 외증조부")]),
    makeConfirmQ("q4", "지문에서 '낡은 가죽 표지의 책 한 권'을 찾아 클릭하세요.", [findRange(paragraphs, "p3", "낡은 가죽 표지의 책 한 권")]),
    makeConfirmQ("q5", "지문에서 '돈으로 살 수 없는 것들'을 찾아 클릭하세요.", [findRange(paragraphs, "p3", "돈으로 살 수 없는 것들")]),
    makeConfirmQ("q6", "지문에서 '한 가문의 기억과 정신이 살아 숨 쉬는 공간'을 찾아 클릭하세요.", [findRange(paragraphs, "p4", "한 가문의 기억과 정신이 살아 숨 쉬는 공간")]),
    makeConfirmQ("q7", "지문에서 '소중한 것을 이어받고 있다는 느낌'을 찾아 클릭하세요.", [findRange(paragraphs, "p4", "소중한 것을 이어받고 있다는 느낌")])
  ];
  return { content: assembleFull(236, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ── Day 237 (홀수 → 비문학) ──
function buildDay237() {
  const paragraphs = [
    { id: "p1", text: "수면은 인간의 건강을 유지하는 데 핵심적인 역할을 한다. 잠을 자는 동안 우리의 뇌는 낮 동안 수집한 방대한 정보를 정리하고 중요한 기억을 장기 기억으로 전환하는 작업을 수행한다. 또한 수면 중에는 신체의 손상된 세포가 회복되고 면역 체계가 강화되며, 성장 호르몬이 분비되어 어린이와 청소년의 신체 발달에도 매우 중요한 영향을 미친다. 이처럼 수면은 단순히 몸을 쉬게 하는 행위가 아니라, 생존에 필수적인 복잡한 생리적 과정이다." },
    { id: "p2", text: "그러나 현대 사회에서는 충분한 수면을 취하지 못하는 사람들이 점점 늘어나고 있다. 스마트폰과 컴퓨터의 사용이 보편화되면서 취침 전 전자 기기의 화면에서 나오는 청색광이 수면 호르몬인 멜라토닌의 분비를 억제하여 잠들기 어렵게 만들고 있다. 학업이나 업무의 압박으로 수면 시간을 의도적으로 줄이는 경우도 많은데, 이는 집중력 저하와 판단력 감소를 초래하여 오히려 학습과 업무의 효율을 크게 떨어뜨리는 역설적인 결과를 낳는다. 만성적인 수면 부족은 비만이나 당뇨병 같은 대사 질환의 위험도 높이는 것으로 알려져 있다." },
    { id: "p3", text: "전문가들은 양질의 수면을 위해 몇 가지 생활 습관을 권장한다. 우선 매일 같은 시간에 잠자리에 들고 일어나는 규칙적인 수면 패턴을 유지하는 것이 중요하다. 취침 한 시간 전에는 전자 기기 사용을 중단하고 조용한 환경에서 독서나 명상을 하는 것이 도움이 된다. 또한 카페인이 든 음료는 오후 이후에는 피하는 것이 좋으며, 적절한 운동은 수면의 질을 높이는 데 효과적이다. 이러한 작은 실천들이 꾸준히 누적되면 전반적인 건강과 삶의 질이 크게 향상될 수 있다." }
  ];
  console.log(`Day 237 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '장기 기억으로 전환하는 작업'을 찾아 클릭하세요.", [findRange(paragraphs, "p1", "장기 기억으로 전환하는 작업")]),
    makeConfirmQ("q2", "지문에서 '성장 호르몬이 분비되어'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "성장 호르몬이 분비되어")]),
    makeConfirmQ("q3", "지문에서 '청색광이 수면 호르몬인 멜라토닌의 분비를 억제하여'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "청색광이 수면 호르몬인 멜라토닌의 분비를 억제하여")]),
    makeConfirmQ("q4", "지문에서 '집중력 저하와 판단력 감소'를 찾아 클릭하세요.", [findRange(paragraphs, "p2", "집중력 저하와 판단력 감소")]),
    makeConfirmQ("q5", "지문에서 '대사 질환의 위험도 높이는 것'을 찾아 클릭하세요.", [findRange(paragraphs, "p2", "대사 질환의 위험도 높이는 것")]),
    makeConfirmQ("q6", "지문에서 '규칙적인 수면 패턴을 유지하는 것'을 찾아 클릭하세요.", [findRange(paragraphs, "p3", "규칙적인 수면 패턴을 유지하는 것")]),
    makeConfirmQ("q7", "지문에서 '카페인이 든 음료는 오후 이후에는 피하는 것이 좋으며'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "카페인이 든 음료는 오후 이후에는 피하는 것이 좋으며")])
  ];
  return { content: assembleFull(237, "NONFICTION", "비문학", paragraphs, confirmQuestions), subArea: "NONFICTION" };
}

// ── Day 238 (짝수 → 문학) ──
function buildDay238() {
  const paragraphs = [
    { id: "p1", text: "기차는 새벽녘에 출발했다. 객실 안은 아직 어두웠고, 창밖으로는 가로등 불빛이 천천히 뒤로 밀려나고 있었다. 수진은 창가 자리에 앉아 이마를 차가운 유리창에 기댄 채 눈을 감았다가 떴다가를 반복했다. 이번 여행은 오랫동안 혼자서 계획했던 것이었지만, 막상 떠나는 순간에는 어딘가 불안하고 막막한 마음이 들었다. 익숙한 것들을 떠나는 일은 언제나 약간의 용기를 필요로 했다." },
    { id: "p2", text: "기차가 도시를 벗어나자 창밖의 풍경이 달라지기 시작했다. 빽빽한 건물들 대신 넓은 논밭이 펼쳐지고, 멀리 산등성이 위로 붉은 해가 천천히 떠오르고 있었다. 수진은 배낭에서 어머니가 싸 준 김밥을 꺼내 한 줄을 먹으며 창밖을 바라보았다. 어머니는 떠나기 전날 밤늦도록 부엌에서 김밥을 말면서 아무 말도 하지 않았지만, 그 침묵 속에 딸을 걱정하는 마음이 가득 담겨 있다는 것을 수진은 잘 알고 있었다." },
    { id: "p3", text: "한 정거장에서 기차가 잠시 멈추었을 때, 맞은편 좌석에 한 할머니가 올라탔다. 할머니는 커다란 보따리를 들고 힘겹게 자리에 앉으며 수진에게 환한 미소를 지어 보였다. 수진이 보따리를 선반 위에 올려드리며 자리를 잡는 것을 도와드리자, 할머니는 보따리에서 귤 몇 개를 꺼내 건네며 고맙다는 인사를 했다. 낯선 사람의 따뜻한 미소와 귤의 상큼한 향기가 수진의 불안한 마음을 조금씩 녹여 주었다." },
    { id: "p4", text: "기차가 다시 달리기 시작하자 수진은 일기장을 꺼내 오늘의 감상을 적기 시작했다. '여행이란 새로운 곳을 향해 가는 것이기도 하지만, 그 과정에서 만나는 예상치 못한 만남과 순간들이 더 소중한 것인지도 모른다.' 수진은 펜을 내려놓고 다시 창밖을 바라보았다. 기차는 끝없이 펼쳐진 들판을 가로지르며 힘차게 앞으로 나아가고 있었고, 수진의 마음에도 어느새 기대와 설렘이 피어오르고 있었다." }
  ];
  console.log(`Day 238 지문 길이: ${charLen(paragraphs)}자`);
  const confirmQuestions = [
    makeConfirmQ("q1", "지문에서 '익숙한 것들을 떠나는 일은 언제나 약간의 용기를 필요로 했다'를 찾아 클릭하세요.", [findRange(paragraphs, "p1", "익숙한 것들을 떠나는 일은 언제나 약간의 용기를 필요로 했다")]),
    makeConfirmQ("q2", "지문에서 '어머니가 싸 준 김밥'을 찾아 클릭하세요.", [findRange(paragraphs, "p2", "어머니가 싸 준 김밥")]),
    makeConfirmQ("q3", "지문에서 '그 침묵 속에 딸을 걱정하는 마음이 가득 담겨 있다는 것'을 찾아 클릭하세요.", [findRange(paragraphs, "p2", "그 침묵 속에 딸을 걱정하는 마음이 가득 담겨 있다는 것")]),
    makeConfirmQ("q4", "지문에서 '낯선 사람의 따뜻한 미소'를 찾아 클릭하세요.", [findRange(paragraphs, "p3", "낯선 사람의 따뜻한 미소")]),
    makeConfirmQ("q5", "지문에서 '예상치 못한 만남과 순간들'을 찾아 클릭하세요.", [findRange(paragraphs, "p4", "예상치 못한 만남과 순간들")]),
    makeConfirmQ("q6", "지문에서 '기대와 설렘이 피어오르고 있었다'를 찾아 클릭하세요.", [findRange(paragraphs, "p4", "기대와 설렘이 피어오르고 있었다")])
  ];
  return { content: assembleFull(238, "LITERATURE", "문학", paragraphs, confirmQuestions), subArea: "LITERATURE" };
}

// ── 실행부 ──
const results = [
  { dayIndex: 234, ...buildDay234() },
  { dayIndex: 235, ...buildDay235() },
  { dayIndex: 236, ...buildDay236() },
  { dayIndex: 237, ...buildDay237() },
  { dayIndex: 238, ...buildDay238() }
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
const tempBatchPath = path.join(newDir, 'batch-f2-234-238.json');
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
