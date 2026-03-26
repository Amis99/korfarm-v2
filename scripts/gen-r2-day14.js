// 러셀2 Day 14 문학 - 일일독해 콘텐츠 생성
const fs = require('fs');
const path = require('path');

// ── 지문 (문학: 현대시 감상 - 윤동주 「서시」 + 감상문 형식) ──
const p1 = "죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를, 잎새에 이는 바람에도 나는 괴로워했다. 별을 노래하는 마음으로 모든 죽어 가는 것을 사랑해야지. 그리고 나한테 주어진 길을 걸어가야겠다. 오늘 밤에도 별이 바람에 스치운다. 이 시는 윤동주의 「서시」로, 1941년에 쓰인 작품이다. '서시'란 시집의 첫머리에 놓는 시를 뜻하며, 시인이 자신의 시 세계를 열어 보이는 선언적 성격을 지닌다. 윤동주는 일제 강점기라는 어두운 시대를 살면서도, 자신의 양심과 순수함을 지키고자 하는 의지를 이 한 편의 시에 담아냈다.";
const p2 = "시의 첫 행인 '죽는 날까지 하늘을 우러러 / 한 점 부끄럼이 없기를'은 시인의 삶 전체를 관통하는 다짐이다. '하늘'은 양심이나 도덕적 기준을 상징하며, '부끄럼이 없기를'이라는 표현은 스스로에게 떳떳하고자 하는 소망을 드러낸다. 이어지는 '잎새에 이는 바람에도 / 나는 괴로워했다'에서 '바람'은 일제의 억압이나 세상의 부조리를 암시한다. 아주 작은 바람에도 괴로워한다는 것은 시인이 현실의 부당함에 극도로 예민하게 반응하고 있음을 보여 준다. 이처럼 첫 부분은 시인의 엄격한 자기 성찰과 현실에 대한 깊은 감수성을 동시에 드러낸다.";
const p3 = "'별을 노래하는 마음으로 / 모든 죽어 가는 것을 사랑해야지'에서 '별'은 이상이나 희망을 상징한다. 암흑 같은 시대에도 별처럼 빛나는 가치를 노래하겠다는 뜻이다. '모든 죽어 가는 것'은 일제의 탄압 아래 소멸해 가는 민족의 문화, 언어, 자유 등을 가리킨다. 시인은 그러한 것들을 '사랑해야지'라는 다짐으로 끌어안는다. 이 다짐에는 절망 속에서도 사랑과 연민을 잃지 않겠다는 의지가 담겨 있다. '그리고 나한테 주어진 길을 걸어가야겠다'는 비록 고난의 길이라 하더라도 자신에게 주어진 사명을 묵묵히 감당하겠다는 결연한 태도를 보여 준다.";
const p4 = "마지막 행 '오늘 밤에도 별이 바람에 스치운다'는 시 전체를 여운 있게 마무리한다. '별'과 '바람'이라는 앞서 등장한 상징이 다시 한번 겹치면서, 희망과 고통이 공존하는 시인의 현실을 압축적으로 보여 준다. '스치운다'는 별과 바람이 접촉하는 순간을 섬세하게 포착한 표현으로, 이상과 현실 사이의 긴장감을 감각적으로 전달한다. 결국 「서시」는 어둠 속에서 별빛을 놓지 않으려는 한 청년의 순결한 의지와 사랑의 노래이다. 이 시가 오늘날에도 깊은 울림을 주는 까닭은, 시대를 초월하여 양심적 삶에 대한 보편적 갈망을 대변하기 때문이다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
  { id: "p4", text: p4 }
];

const totalLen = p1.length + p2.length + p3.length + p4.length;
console.log(`지문 총 글자 수: ${totalLen}`);
console.log(`p1: ${p1.length}, p2: ${p2.length}, p3: ${p3.length}, p4: ${p4.length}`);

function fi(text, keyword) {
  const i = text.indexOf(keyword);
  if (i === -1) throw new Error(`"${keyword}" not found`);
  return { start: i, end: i + keyword.length };
}

// ── 정독 타임라인 ──
const timeline = [
  {
    stepId: "s1",
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: fi(p1, "괴로워했다.").end }] },
    question: {
      prompt: "시의 도입부에서 시인이 표현하는 두 가지 감정으로 알맞은 것은?",
      choices: [
        { id: "A", text: "부끄럼 없이 살고자 하는 소망과, 작은 바람에도 괴로워하는 예민함이다." },
        { id: "B", text: "즐거움과 편안한 만족감이다." },
        { id: "C", text: "분노와 적대감이다." },
        { id: "D", text: "무관심과 체념이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s2",
    highlight: { ranges: [{ paragraphId: "p1", start: fi(p1, "별을 노래하는").start, end: fi(p1, "걸어가야겠다.").end }] },
    question: {
      prompt: "시인이 '별을 노래하는 마음'으로 하겠다고 다짐하는 일은?",
      choices: [
        { id: "A", text: "죽어 가는 것을 사랑하고, 주어진 길을 걸어가는 것이다." },
        { id: "B", text: "밤하늘의 별을 관측하고 기록하는 것이다." },
        { id: "C", text: "고통을 피해 안전한 곳으로 떠나는 것이다." },
        { id: "D", text: "시를 쓰는 일을 그만두겠다는 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s3",
    highlight: { ranges: [{ paragraphId: "p1", start: fi(p1, "오늘 밤에도").start, end: fi(p1, "스치운다.").end }] },
    question: {
      prompt: "시의 마지막 행에서 별과 바람의 관계를 표현한 것은?",
      choices: [
        { id: "A", text: "별이 바람에 스치는 것으로, 이상과 현실의 접촉을 암시한다." },
        { id: "B", text: "별이 사라지고 바람만 남아 절망을 표현한다." },
        { id: "C", text: "바람이 별을 가려 완전한 어둠을 나타낸다." },
        { id: "D", text: "별과 바람이 함께 사라져 평화를 상징한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s4",
    highlight: { ranges: [{ paragraphId: "p1", start: fi(p1, "이 시는").start, end: fi(p1, "작품이다.").end }] },
    question: {
      prompt: "이 시의 제목과 지은이, 창작 시기로 알맞은 것은?",
      choices: [
        { id: "A", text: "윤동주의 「서시」, 1941년에 쓰였다." },
        { id: "B", text: "한용운의 「님의 침묵」, 1926년에 쓰였다." },
        { id: "C", text: "김소월의 「진달래꽃」, 1925년에 쓰였다." },
        { id: "D", text: "이육사의 「광야」, 1940년에 쓰였다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s5",
    highlight: { ranges: [{ paragraphId: "p1", start: fi(p1, "'서시'란").start, end: fi(p1, "담아냈다.").end }] },
    question: {
      prompt: "'서시'의 뜻과 이 시에 담긴 시인의 의지로 알맞은 것은?",
      choices: [
        { id: "A", text: "시집의 첫머리에 놓는 시이며, 양심과 순수함을 지키려는 의지를 담았다." },
        { id: "B", text: "시집의 마지막에 놓는 시이며, 세상에 대한 분노를 담았다." },
        { id: "C", text: "일기 형식의 글이며, 여행의 즐거움을 담았다." },
        { id: "D", text: "편지글이며, 가족에 대한 그리움을 담았다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s6",
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: p1.length }] },
    question: {
      prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "「서시」의 원문을 제시하고, 윤동주가 어둠 속에서도 양심을 지키려 한 시임을 소개한다." },
        { id: "B", text: "윤동주의 생애를 연대순으로 상세히 서술한다." },
        { id: "C", text: "일제 강점기의 역사적 사건을 나열한다." },
        { id: "D", text: "다른 시인들의 작품과 비교하여 평가한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s7",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: fi(p2, "드러낸다.").end }] },
    question: {
      prompt: "'하늘'이 상징하는 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "양심이나 도덕적 기준을 상징한다." },
        { id: "B", text: "물질적 풍요를 상징한다." },
        { id: "C", text: "자연의 아름다움만을 상징한다." },
        { id: "D", text: "권력과 지배를 상징한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s8",
    highlight: { ranges: [{ paragraphId: "p2", start: fi(p2, "이어지는").start, end: fi(p2, "보여 준다.").end }] },
    question: {
      prompt: "'잎새에 이는 바람'에서 '바람'이 암시하는 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "일제의 억압이나 세상의 부조리를 암시한다." },
        { id: "B", text: "봄날의 따뜻한 산들바람을 뜻한다." },
        { id: "C", text: "시인의 즐거운 기억을 뜻한다." },
        { id: "D", text: "미래에 대한 기대를 뜻한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s9",
    highlight: { ranges: [{ paragraphId: "p2", start: fi(p2, "이처럼 첫 부분은").start, end: fi(p2, "드러낸다.").end }] },
    question: {
      prompt: "글쓴이가 첫 부분에서 읽어 낸 시인의 두 가지 특성으로 알맞은 것은?",
      choices: [
        { id: "A", text: "엄격한 자기 성찰과 현실에 대한 깊은 감수성이다." },
        { id: "B", text: "현실 도피와 낙관적 세계관이다." },
        { id: "C", text: "타인에 대한 비판과 냉소적 태도이다." },
        { id: "D", text: "물질적 욕구와 명예욕이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s10",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: p2.length }] },
    question: {
      prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "'하늘'과 '바람'의 상징을 분석하여 시인의 자기 성찰과 현실 감수성을 밝힌다." },
        { id: "B", text: "시의 운율과 형식적 특징을 상세히 분석한다." },
        { id: "C", text: "윤동주와 다른 시인의 작품을 비교한다." },
        { id: "D", text: "시의 배경이 된 역사적 사건을 설명한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s11",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: fi(p3, "뜻이다.").end }] },
    question: {
      prompt: "'별'이 상징하는 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "이상이나 희망을 상징한다." },
        { id: "B", text: "고통과 절망을 상징한다." },
        { id: "C", text: "물질적 부를 상징한다." },
        { id: "D", text: "권력과 지위를 상징한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s12",
    highlight: { ranges: [{ paragraphId: "p3", start: fi(p3, "'모든 죽어 가는 것'").start, end: fi(p3, "끌어안는다.").end }] },
    question: {
      prompt: "'모든 죽어 가는 것'이 가리키는 대상으로 알맞은 것은?",
      choices: [
        { id: "A", text: "일제 탄압 아래 소멸해 가는 민족의 문화, 언어, 자유 등이다." },
        { id: "B", text: "자연 속에서 시드는 꽃과 풀이다." },
        { id: "C", text: "시인 개인의 추억과 기억이다." },
        { id: "D", text: "낡은 건물과 물건이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s13",
    highlight: { ranges: [{ paragraphId: "p3", start: fi(p3, "이 다짐에는").start, end: fi(p3, "담겨 있다.").end }] },
    question: {
      prompt: "'사랑해야지'라는 다짐에 담긴 의지로 알맞은 것은?",
      choices: [
        { id: "A", text: "절망 속에서도 사랑과 연민을 잃지 않겠다는 의지이다." },
        { id: "B", text: "현실의 고통을 외면하겠다는 의지이다." },
        { id: "C", text: "모든 것을 포기하겠다는 체념이다." },
        { id: "D", text: "복수하겠다는 결심이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s14",
    highlight: { ranges: [{ paragraphId: "p3", start: fi(p3, "'그리고 나한테").start, end: fi(p3, "보여 준다.").end }] },
    question: {
      prompt: "'나한테 주어진 길을 걸어가야겠다'에 나타난 태도로 알맞은 것은?",
      choices: [
        { id: "A", text: "고난의 길이라도 자신의 사명을 묵묵히 감당하겠다는 결연한 태도이다." },
        { id: "B", text: "편한 길만 골라 가겠다는 회피적 태도이다." },
        { id: "C", text: "남의 길을 따라가겠다는 순종적 태도이다." },
        { id: "D", text: "어떤 길도 가지 않겠다는 거부의 태도이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s15",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: p3.length }] },
    question: {
      prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "'별'의 상징과 '죽어 가는 것'의 의미를 분석하여 시인의 사랑과 사명감을 밝힌다." },
        { id: "B", text: "시의 형식적 특징인 운율과 리듬을 분석한다." },
        { id: "C", text: "시인의 가족사를 서술한다." },
        { id: "D", text: "다른 시인의 작품과 비교하여 우열을 가린다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s16",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: fi(p4, "보여 준다.").end }] },
    question: {
      prompt: "마지막 행에서 '별'과 '바람'이 다시 겹치는 효과로 알맞은 것은?",
      choices: [
        { id: "A", text: "희망과 고통이 공존하는 시인의 현실을 압축적으로 보여 준다." },
        { id: "B", text: "시인이 모든 고통을 극복했음을 보여 준다." },
        { id: "C", text: "별과 바람이 완전히 분리되어 있음을 보여 준다." },
        { id: "D", text: "시인이 현실과 무관한 공상에 빠졌음을 보여 준다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s17",
    highlight: { ranges: [{ paragraphId: "p4", start: fi(p4, "'스치운다'는").start, end: fi(p4, "전달한다.").end }] },
    question: {
      prompt: "'스치운다'가 전달하는 효과로 알맞은 것은?",
      choices: [
        { id: "A", text: "이상과 현실 사이의 긴장감을 감각적으로 전달한다." },
        { id: "B", text: "별이 사라지는 슬픔만을 전달한다." },
        { id: "C", text: "바람의 세기를 과학적으로 묘사한다." },
        { id: "D", text: "시인의 무관심을 전달한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s18",
    highlight: { ranges: [{ paragraphId: "p4", start: fi(p4, "결국").start, end: fi(p4, "노래이다.").end }] },
    question: {
      prompt: "글쓴이가 「서시」를 최종적으로 규정하는 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "어둠 속에서 별빛을 놓지 않으려는 청년의 순결한 의지와 사랑의 노래이다." },
        { id: "B", text: "전쟁을 찬양하는 군가이다." },
        { id: "C", text: "자연의 아름다움만을 노래한 서정시이다." },
        { id: "D", text: "개인적 사랑을 고백하는 연애시이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s19",
    highlight: { ranges: [{ paragraphId: "p4", start: fi(p4, "이 시가").start, end: fi(p4, "때문이다.").end }] },
    question: {
      prompt: "이 시가 오늘날에도 울림을 주는 까닭으로 알맞은 것은?",
      choices: [
        { id: "A", text: "시대를 초월하여 양심적 삶에 대한 보편적 갈망을 대변하기 때문이다." },
        { id: "B", text: "일제 강점기의 역사만 다루고 있기 때문이다." },
        { id: "C", text: "특정 종교의 교리를 설파하기 때문이다." },
        { id: "D", text: "과학적 사실을 정확히 담고 있기 때문이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s20",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: p4.length }] },
    question: {
      prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "마지막 행의 상징을 분석하고 「서시」가 시대를 초월한 양심의 노래임을 정리한다." },
        { id: "B", text: "윤동주의 다른 시 작품을 소개한다." },
        { id: "C", text: "일제 강점기의 역사적 사건을 상세히 기술한다." },
        { id: "D", text: "시의 운율과 형식만을 분석한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  }
];

// ── 복기 카드 (8장) ──
const recall = {
  cards: [
    { id: "c1", text: "「서시」는 윤동주가 1941년에 쓴, 시집 첫머리에 놓는 선언적 시이다." },
    { id: "c2", text: "'하늘'은 양심, '부끄럼 없기를'은 떳떳한 삶의 소망을 나타낸다." },
    { id: "c3", text: "'바람'은 일제의 억압을 암시하고, 시인의 예민한 감수성을 보여 준다." },
    { id: "c4", text: "'별'은 이상과 희망을, '죽어 가는 것'은 소멸하는 민족적 가치를 상징한다." },
    { id: "c5", text: "'사랑해야지'는 절망 속에서도 사랑과 연민을 잃지 않겠다는 다짐이다." },
    { id: "c6", text: "'주어진 길을 걸어가야겠다'는 고난의 사명을 감당하겠다는 결연한 태도이다." },
    { id: "c7", text: "마지막 행에서 별과 바람이 겹치며 희망과 고통의 공존을 압축적으로 보여 준다." },
    { id: "c8", text: "「서시」는 시대를 초월하여 양심적 삶에 대한 보편적 갈망을 대변한다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// ── 확인 문항 (7문항) ──
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "지문에서 '서시'라는 단어의 뜻을 설명하는 부분에서 '서시'를 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p1", ...fi(p1, "'서시'란"), end: fi(p1, "'서시'란").start + 4 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "지문에서 '양심'이라는 단어를 둘째 문단에서 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p2", ...fi(p2, "양심이나"), end: fi(p2, "양심이나").start + 2 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "지문에서 '이상'이라는 단어를 셋째 문단에서 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p3", ...fi(p3, "이상이나"), end: fi(p3, "이상이나").start + 2 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "지문에서 '민족'이라는 단어를 셋째 문단에서 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p3", ...fi(p3, "민족의"), end: fi(p3, "민족의").start + 2 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "지문에서 '스치운다'라는 표현을 넷째 문단에서 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p4", ...fi(p4, "'스치운다'는"), end: fi(p4, "'스치운다'는").start + 6 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "지문에서 '순결한 의지'라는 표현을 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p4", ...fi(p4, "순결한 의지") }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "지문에서 '보편적 갈망'이라는 표현을 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p4", ...fi(p4, "보편적 갈망") }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ]
};

const content = {
  contentId: "dr-r2-014",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 2) Day 14 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_2",
  schoolGradeRange: { min: 8, max: 9 },
  area: "READING",
  subArea: "LITERATURE",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 480,
  assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall,
    confirm
  }
};

// 검증
function verifyRanges(content) {
  const pMap = {};
  for (const p of content.payload.passage.paragraphs) pMap[p.id] = p.text;
  let errors = 0;
  for (const q of content.payload.confirm.questions) {
    for (const r of q.answerRanges) {
      const text = pMap[r.paragraphId];
      if (!text) { console.error(`없는 문단: ${r.paragraphId}`); errors++; continue; }
      const slice = text.substring(r.start, r.end);
      console.log(`[확인 ${q.id}] [${r.start}:${r.end}] = "${slice}"`);
    }
  }
  for (const step of content.payload.intensive.timeline) {
    for (const r of step.highlight.ranges) {
      const text = pMap[r.paragraphId];
      if (r.end > text.length) { console.error(`[정독 ${step.stepId}] 범위 초과: ${r.end} > ${text.length}`); errors++; }
    }
  }
  if (errors === 0) console.log('\n모든 범위 검증 통과');
  else console.error(`\n${errors}개 오류`);
  return errors;
}

const errs = verifyRanges(content);

const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell2');
fs.writeFileSync(path.join(staticDir, '014.json'), JSON.stringify(content, null, 2), 'utf8');
console.log('static 파일 생성: 014.json');

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell2.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const batchItem = {
  content_type: "DAILY_READING", level_id: "RUSSELL_2", area: "READING",
  sub_area: "LITERATURE", day_index: 14, module_key: "reading_training",
  schema_version: "1.0", content
};
const idx = batch.items.findIndex(i => i.day_index === 14 && i.level_id === "RUSSELL_2");
if (idx >= 0) { batch.items[idx] = batchItem; console.log('배치 Day 14 교체'); }
else { batch.items.push(batchItem); console.log('배치 Day 14 추가'); }
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log('배치 파일 갱신');

if (errs > 0) process.exit(1);
