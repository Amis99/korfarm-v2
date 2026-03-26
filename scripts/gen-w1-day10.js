const fs = require('fs');
const path = require('path');

// Day 10: LITERATURE (문학)
// 고1~2 수준 문학 지문: 윤동주 「서시」 해설 지문

const p1 = `윤동주는 일제 강점기에 활동한 시인으로, 그의 대표작 「서시」는 한국 현대시 가운데 가장 많이 알려진 작품 중 하나이다. 이 시는 1941년에 쓰였으며 시인이 세상을 떠난 뒤인 1948년에 유고 시집 『하늘과 바람과 별과 시』에 수록되어 처음 세상에 공개되었다. 「서시」라는 제목은 '책의 앞머리에 붙이는 시'라는 뜻으로, 시집 전체를 여는 역할을 한다. 시인은 이 짧은 작품 안에 자신의 삶을 성찰하는 태도와 부끄러움 없이 살겠다는 다짐을 담아냈다. 특히 여섯 행이라는 짧은 분량 안에 삶의 자세와 결의를 함축적으로 압축한 점이 이 시의 두드러진 특징이다. 이러한 진솔한 고백은 오늘날까지 수많은 독자에게 깊은 울림을 전하고 있다.`;

const p2 = `「서시」의 첫 행인 "죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를"이라는 구절은 시 전체의 주제를 압축적으로 드러낸다. 화자는 하늘을 양심의 기준으로 삼아 자기 삶을 돌아보며, 그 앞에서 한 점의 부끄러움도 없이 살고 싶다는 소망을 밝힌다. 이어지는 "잎새에 이는 바람에도 나는 괴로워했다"라는 구절에서는, 아주 작은 자연 현상에도 마음이 흔들리는 예민한 감수성이 드러난다. 이는 단순한 감상에 그치지 않고, 식민지 현실 속에서 아무것도 하지 못하는 자신에 대한 자괴감을 비유적으로 표현한 것으로 해석된다. 즉 화자의 괴로움은 개인적인 감정인 동시에 당대 지식인이 공유하던 시대적 고통에 대한 반응이기도 하다.`;

const p3 = `시의 후반부에서 화자는 "별을 노래하는 마음으로 모든 죽어 가는 것을 사랑해야지"라고 다짐한다. 별은 어둠 속에서도 빛나는 존재로, 이상과 희망을 상징한다. 화자가 별을 노래하겠다는 것은 암울한 현실 속에서도 아름다움과 가치를 잃지 않겠다는 의지의 표현이다. 또한 "모든 죽어 가는 것"이라는 표현에는 식민지 치하에서 사라져 가는 민족의 언어와 문화, 그리고 고통받는 사람들에 대한 애정이 담겨 있다. 화자는 이처럼 사라져 가는 것들을 사랑함으로써 그것들이 지닌 가치를 기억하고 지키겠다는 결의를 보여 준다. 이 대목은 수동적 슬픔이 아니라 적극적 사랑의 선언이라는 점에서 시 전체에 힘을 부여한다.`;

const p4 = `「서시」의 마지막 행인 "그리고 나한테 주어진 길을 걸어가야겠다"는 화자의 결연한 의지를 집약한다. 여기서 '길'은 단순한 물리적 경로가 아니라 시인이 선택한 삶의 방향, 곧 올바르게 살겠다는 윤리적 결단을 가리킨다. 화자는 하늘 앞에 부끄럽지 않은 삶을 살며 별을 노래하고 죽어 가는 것을 사랑하는 길을 자신의 운명으로 받아들인다. 이 결의는 거창한 영웅적 행동을 선언한 것이 아니라, 일상 속에서 양심에 따라 성실하게 살아가겠다는 소박하면서도 강인한 다짐이다. 결국 「서시」는 자아 성찰과 윤리적 삶에 대한 의지를 서정적이면서도 단단한 언어로 표현한 작품으로, 시대와 세대를 초월하여 독자의 마음을 울리는 힘을 지니고 있다.`;

const passage = {
  format: "TEXT",
  paragraphs: [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ]
};

// 글자 수 확인
const totalLen = p1.length + p2.length + p3.length + p4.length;
console.log(`총 글자 수: ${totalLen} (목표: 1400 ±50)`);
console.log(`p1: ${p1.length}, p2: ${p2.length}, p3: ${p3.length}, p4: ${p4.length}`);

// 정독 타임라인
const timeline = [
  // p1 문장별
  {
    stepId: "s1",
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: 68 }] },
    question: {
      prompt: "첫 문장이 전달하는 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "윤동주는 일제 강점기에 활동한 시인이며 「서시」는 가장 널리 알려진 작품 중 하나이다." },
        { id: "B", text: "윤동주는 해방 이후에 활동한 소설가이며 「서시」는 장편 소설이다." },
        { id: "C", text: "윤동주는 조선 시대의 학자이며 「서시」는 학술 논문이다." },
        { id: "D", text: "윤동주는 현대 시인이며 「서시」는 아직 출판되지 않은 작품이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s2",
    highlight: { ranges: [{ paragraphId: "p1", start: 69, end: 164 }] },
    question: {
      prompt: "둘째 문장에서 「서시」가 처음 공개된 경위로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "1941년에 쓰였고 시인 사후인 1948년 유고 시집에 수록되어 공개되었다." },
        { id: "B", text: "1948년에 쓰여 같은 해에 발표되었다." },
        { id: "C", text: "1941년에 쓰여 즉시 신문에 발표되었다." },
        { id: "D", text: "시인 생전에 직접 출판하여 큰 인기를 얻었다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s3",
    highlight: { ranges: [{ paragraphId: "p1", start: 165, end: 211 }] },
    question: {
      prompt: "셋째 문장에서 '서시'라는 제목의 뜻으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "책의 앞머리에 붙이는 시라는 뜻으로, 시집 전체를 여는 역할을 한다." },
        { id: "B", text: "책의 마지막에 붙이는 시라는 뜻이다." },
        { id: "C", text: "서쪽에서 지은 시라는 뜻이다." },
        { id: "D", text: "서울에서 발표한 시라는 뜻이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s4",
    highlight: { ranges: [{ paragraphId: "p1", start: 212, end: 270 }] },
    question: {
      prompt: "넷째 문장에서 시인이 작품에 담은 내용으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "삶을 성찰하는 태도와 부끄러움 없이 살겠다는 다짐을 담았다." },
        { id: "B", text: "자연의 아름다움을 묘사하는 데 집중하였다." },
        { id: "C", text: "전쟁의 참상을 고발하는 내용을 담았다." },
        { id: "D", text: "사회 제도를 비판하는 논설을 담았다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s5",
    highlight: { ranges: [{ paragraphId: "p1", start: 271, end: 313 }] },
    question: {
      prompt: "마지막 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "진솔한 고백이 오늘날까지 수많은 독자에게 깊은 울림을 전하고 있다." },
        { id: "B", text: "이 시는 발표 당시에만 인기가 있었고 현재는 잊혀졌다." },
        { id: "C", text: "이 시는 문학적 가치가 낮아 비평가들의 관심을 받지 못했다." },
        { id: "D", text: "시인의 고백은 독자에게 반감을 불러일으켰다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p1 전체
  {
    stepId: "s6",
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: p1.length }] },
    question: {
      prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "윤동주의 「서시」는 일제 강점기에 쓰인 유고 시로, 자기 성찰과 부끄러움 없는 삶의 다짐을 담아 오늘날까지 사랑받고 있다." },
        { id: "B", text: "윤동주는 해방 이후 시집을 직접 출판하여 큰 성공을 거두었다." },
        { id: "C", text: "「서시」는 시집의 마지막을 장식하는 시로, 사회 비판이 주된 내용이다." },
        { id: "D", text: "윤동주의 시는 발표 당시에는 인정받지 못했고 현재도 관심이 적다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p2 문장별
  {
    stepId: "s7",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: 56 }] },
    question: {
      prompt: "첫 문장에서 인용된 구절이 시 전체에서 하는 역할로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "시 전체의 주제를 압축적으로 드러내는 역할을 한다." },
        { id: "B", text: "시의 배경이 되는 장소를 묘사하는 역할을 한다." },
        { id: "C", text: "등장인물을 소개하는 역할을 한다." },
        { id: "D", text: "시의 결말을 미리 알려 주는 역할을 한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s8",
    highlight: { ranges: [{ paragraphId: "p2", start: 57, end: 128 }] },
    question: {
      prompt: "둘째 문장에서 화자가 하늘을 삼는 기준으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "양심의 기준으로 삼아 부끄러움 없이 살고 싶다는 소망을 밝힌다." },
        { id: "B", text: "날씨의 기준으로 삼아 맑은 날을 기다리겠다고 한다." },
        { id: "C", text: "방향의 기준으로 삼아 길을 찾겠다고 한다." },
        { id: "D", text: "시간의 기준으로 삼아 하루를 측정하겠다고 한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s9",
    highlight: { ranges: [{ paragraphId: "p2", start: 129, end: 195 }] },
    question: {
      prompt: "셋째 문장에서 '잎새에 이는 바람에도 괴로워했다'는 표현이 드러내는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "작은 자연 현상에도 마음이 흔들리는 예민한 감수성이 드러난다." },
        { id: "B", text: "자연을 두려워하는 소극적인 태도가 드러난다." },
        { id: "C", text: "바람이 불면 기뻐하는 낙천적인 성격이 드러난다." },
        { id: "D", text: "자연에 무관심한 도시적 감각이 드러난다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s10",
    highlight: { ranges: [{ paragraphId: "p2", start: 196, end: 278 }] },
    question: {
      prompt: "넷째 문장에서 화자의 괴로움이 비유적으로 표현하는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "식민지 현실 속에서 아무것도 하지 못하는 자신에 대한 자괴감을 표현한 것이다." },
        { id: "B", text: "자연재해에 대한 공포를 표현한 것이다." },
        { id: "C", text: "경제적 어려움에 대한 불만을 표현한 것이다." },
        { id: "D", text: "친구와의 갈등에서 오는 슬픔을 표현한 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s11",
    highlight: { ranges: [{ paragraphId: "p2", start: 279, end: 326 }] },
    question: {
      prompt: "마지막 문장이 말하는 화자의 괴로움의 성격으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "개인적 감정인 동시에 시대적 고통에 대한 반응이기도 하다." },
        { id: "B", text: "순전히 개인적인 감정에 불과하다." },
        { id: "C", text: "시대와는 무관한 철학적 고민이다." },
        { id: "D", text: "타인의 고통을 대신 느끼는 것일 뿐 자신의 감정은 아니다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p2 전체
  {
    stepId: "s12",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: p2.length }] },
    question: {
      prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "「서시」의 첫 행은 부끄러움 없는 삶의 소망을 담고 있으며, 화자의 괴로움은 개인적이면서 시대적인 이중적 성격을 지닌다." },
        { id: "B", text: "화자는 자연을 두려워하여 도시로 떠나기를 희망하고 있다." },
        { id: "C", text: "화자는 하늘을 바라보며 날씨를 관찰하는 것을 즐긴다." },
        { id: "D", text: "「서시」는 시인의 일상적인 고민만을 다루고 있어 시대적 의미는 없다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p3 문장별
  {
    stepId: "s13",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: 56 }] },
    question: {
      prompt: "첫 문장에서 화자가 다짐하는 내용으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "별을 노래하는 마음으로 모든 죽어 가는 것을 사랑하겠다고 다짐한다." },
        { id: "B", text: "별을 관찰하여 과학 연구에 기여하겠다고 다짐한다." },
        { id: "C", text: "죽어 가는 것들을 무시하고 새로운 것만 추구하겠다고 다짐한다." },
        { id: "D", text: "노래를 불러 유명해지겠다고 다짐한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s14",
    highlight: { ranges: [{ paragraphId: "p3", start: 57, end: 100 }] },
    question: {
      prompt: "둘째 문장에서 별이 상징하는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "어둠 속에서도 빛나는 존재로 이상과 희망을 상징한다." },
        { id: "B", text: "밤하늘의 장식으로 아무런 상징적 의미가 없다." },
        { id: "C", text: "절망과 포기를 상징한다." },
        { id: "D", text: "물질적 풍요와 부를 상징한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s15",
    highlight: { ranges: [{ paragraphId: "p3", start: 101, end: 157 }] },
    question: {
      prompt: "셋째 문장에서 별을 노래하겠다는 것이 의미하는 바로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "암울한 현실 속에서도 아름다움과 가치를 잃지 않겠다는 의지의 표현이다." },
        { id: "B", text: "천문학에 대한 관심을 표현한 것이다." },
        { id: "C", text: "현실을 외면하고 환상에 빠지겠다는 뜻이다." },
        { id: "D", text: "음악가가 되겠다는 꿈을 밝힌 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s16",
    highlight: { ranges: [{ paragraphId: "p3", start: 158, end: 237 }] },
    question: {
      prompt: "넷째 문장에서 '모든 죽어 가는 것'에 담긴 의미로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "식민지 치하에서 사라져 가는 민족의 언어와 문화, 고통받는 사람들에 대한 애정이 담겨 있다." },
        { id: "B", text: "자연에서 시들어 가는 꽃만을 가리킨다." },
        { id: "C", text: "오래된 건물이 철거되는 것을 안타까워하는 것이다." },
        { id: "D", text: "유행이 지나간 문화를 가리키는 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s17",
    highlight: { ranges: [{ paragraphId: "p3", start: 238, end: 298 }] },
    question: {
      prompt: "다섯째 문장에서 화자의 결의로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "사라져 가는 것들을 사랑하여 그것들이 지닌 가치를 기억하고 지키겠다는 결의이다." },
        { id: "B", text: "사라져 가는 것들을 빨리 잊고 새로운 것을 추구하겠다는 결의이다." },
        { id: "C", text: "죽어 가는 것들에 관심을 끊겠다는 결의이다." },
        { id: "D", text: "과거에 집착하여 변화를 거부하겠다는 결의이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s18",
    highlight: { ranges: [{ paragraphId: "p3", start: 299, end: p3.length }] },
    question: {
      prompt: "마지막 문장에서 이 대목이 시 전체에 부여하는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "수동적 슬픔이 아니라 적극적 사랑의 선언이라는 점에서 힘을 부여한다." },
        { id: "B", text: "슬픔과 체념의 분위기를 더욱 강화한다." },
        { id: "C", text: "시 전체에 유머러스한 분위기를 부여한다." },
        { id: "D", text: "시의 흐름과 무관한 독립적인 의미를 지닌다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p3 전체
  {
    stepId: "s19",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: p3.length }] },
    question: {
      prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "화자는 별을 이상의 상징으로 삼아 죽어 가는 것들을 사랑하겠다고 다짐하며, 이는 적극적 사랑의 선언이다." },
        { id: "B", text: "화자는 별을 관찰하며 자연과학에 대한 관심을 보여 준다." },
        { id: "C", text: "화자는 현실을 외면하고 별나라로 도피하겠다고 선언한다." },
        { id: "D", text: "화자는 죽어 가는 것들에 무관심하다는 태도를 보인다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p4 문장별
  {
    stepId: "s20",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: 48 }] },
    question: {
      prompt: "첫 문장에서 마지막 행이 집약하는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "화자의 결연한 의지를 집약한다." },
        { id: "B", text: "시의 배경을 설명하는 역할을 한다." },
        { id: "C", text: "다른 시인의 작품을 인용하는 부분이다." },
        { id: "D", text: "화자의 후회와 체념을 집약한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s21",
    highlight: { ranges: [{ paragraphId: "p4", start: 49, end: 118 }] },
    question: {
      prompt: "둘째 문장에서 '길'이 가리키는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "시인이 선택한 삶의 방향, 곧 올바르게 살겠다는 윤리적 결단을 가리킨다." },
        { id: "B", text: "시인이 산책하는 물리적 도로를 가리킨다." },
        { id: "C", text: "시인이 여행하려는 구체적인 경로를 가리킨다." },
        { id: "D", text: "시인이 직업을 구하기 위해 가는 길을 가리킨다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s22",
    highlight: { ranges: [{ paragraphId: "p4", start: 119, end: 189 }] },
    question: {
      prompt: "셋째 문장에서 화자가 운명으로 받아들이는 것은 무엇인가요?",
      choices: [
        { id: "A", text: "하늘 앞에 부끄럽지 않은 삶을 살며 별을 노래하고 죽어 가는 것을 사랑하는 길이다." },
        { id: "B", text: "부와 명예를 추구하는 삶을 살아가겠다는 것이다." },
        { id: "C", text: "현실의 고통을 피해 안전한 곳으로 떠나겠다는 것이다." },
        { id: "D", text: "다른 사람의 길을 대신 걸어 주겠다는 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s23",
    highlight: { ranges: [{ paragraphId: "p4", start: 190, end: 260 }] },
    question: {
      prompt: "넷째 문장에서 화자의 다짐을 설명하는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "거창한 영웅적 행동이 아니라 양심에 따라 성실하게 살아가겠다는 소박하면서도 강인한 다짐이다." },
        { id: "B", text: "거대한 사업을 일으켜 성공하겠다는 야심 찬 다짐이다." },
        { id: "C", text: "영웅이 되어 많은 사람을 구하겠다는 웅장한 다짐이다." },
        { id: "D", text: "일상의 모든 것을 포기하겠다는 극단적인 다짐이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s24",
    highlight: { ranges: [{ paragraphId: "p4", start: 261, end: p4.length }] },
    question: {
      prompt: "마지막 문장에서 「서시」의 특징으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "자아 성찰과 윤리적 삶에 대한 의지를 서정적이면서 단단한 언어로 표현하여 시대를 초월한 감동을 준다." },
        { id: "B", text: "사회 비판을 거칠고 직접적인 언어로 표현하여 특정 시대에만 공감을 얻었다." },
        { id: "C", text: "자연 풍경만을 아름답게 묘사하여 문학적 가치가 제한적이다." },
        { id: "D", text: "개인적 불만을 나열하여 독자의 공감을 얻기 어렵다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p4 전체
  {
    stepId: "s25",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: p4.length }] },
    question: {
      prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "「서시」의 마지막 행은 올바른 삶을 향한 결연한 의지를 담고 있으며, 이 작품은 시대를 초월한 감동을 선사한다." },
        { id: "B", text: "시의 마지막 행은 시인이 시를 그만 쓰겠다는 선언이다." },
        { id: "C", text: "시인은 거창한 영웅이 되어 세상을 바꾸겠다고 다짐한다." },
        { id: "D", text: "「서시」는 한 시대에만 의미가 있는 시대적 작품이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  }
];

// 복기 카드 8장
const recall = {
  cards: [
    { id: "c1", text: "윤동주의 「서시」는 일제 강점기에 쓰인 유고 시로, 시인 사후 1948년에 처음 공개되었다." },
    { id: "c2", text: "'서시'는 책의 앞머리에 붙이는 시라는 뜻으로, 시인의 자기 성찰과 부끄러움 없는 삶의 다짐을 담고 있다." },
    { id: "c3", text: "시의 첫 행은 하늘을 양심의 기준으로 삼아 부끄러움 없이 살겠다는 소망을 압축적으로 표현한다." },
    { id: "c4", text: "'잎새에 이는 바람에도 괴로워했다'는 표현은 식민지 현실에 대한 자괴감을 비유적으로 드러낸다." },
    { id: "c5", text: "별은 이상과 희망의 상징이며, 화자는 별을 노래하는 마음으로 죽어 가는 것을 사랑하겠다고 다짐한다." },
    { id: "c6", text: "'모든 죽어 가는 것'에는 사라져 가는 민족의 언어와 문화, 고통받는 사람들에 대한 애정이 담겨 있다." },
    { id: "c7", text: "마지막 행의 '길'은 올바르게 살겠다는 윤리적 결단으로, 소박하면서도 강인한 다짐을 집약한다." },
    { id: "c8", text: "「서시」는 자아 성찰과 윤리적 삶의 의지를 서정적이면서 단단한 언어로 표현하여 시대를 초월한 감동을 준다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// 확인 문항 8개
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "윤동주의 유고 시집 제목은 무엇인가요?",
      answerText: "하늘과 바람과 별과 시",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p1", start: 118, end: 130 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "'서시'라는 제목의 뜻은 무엇인가요?",
      answerText: "책의 앞머리에 붙이는 시",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p1", start: 172, end: 185 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "화자가 하늘을 어떤 기준으로 삼고 있나요?",
      answerText: "양심의 기준",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p2", start: 62, end: 69 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "'잎새에 이는 바람에도 괴로워했다'에 담긴 화자의 감수성을 무엇이라 하나요?",
      answerText: "예민한 감수성",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p2", start: 173, end: 181 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "별은 어둠 속에서도 빛나는 존재로 무엇을 상징하나요?",
      answerText: "이상과 희망",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p3", start: 79, end: 86 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "'모든 죽어 가는 것'에 담긴 것 중, 식민지 치하에서 사라져 가는 것으로 언급된 두 가지는 무엇인가요?",
      answerText: "민족의 언어와 문화",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p3", start: 187, end: 197 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "마지막 행의 '길'은 어떤 결단을 가리키나요?",
      answerText: "윤리적 결단",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p4", start: 105, end: 112 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q8",
      prompt: "화자의 다짐은 거창한 영웅적 행동이 아니라 어떤 다짐인가요?",
      answerText: "양심에 따라 성실하게 살아가겠다는 소박하면서도 강인한 다짐",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p4", start: 213, end: 257 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

const content = {
  contentId: "dr-w1-010",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 10 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "WITTGENSTEIN_1",
  schoolGradeRange: { min: 9, max: 10 },
  area: "READING",
  subArea: "LITERATURE",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 600,
  assets: {},
  payload: {
    passage,
    intensive: { timeline },
    recall,
    confirm
  }
};

const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1', '010.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`static 파일 작성 완료: ${staticPath}`);

// 배치 아이템
const batchItem = {
  content_type: "DAILY_READING",
  level_id: "WITTGENSTEIN_1",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 10,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};

const batchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-w1-day10.json');
fs.mkdirSync(path.dirname(batchPath), { recursive: true });
fs.writeFileSync(batchPath, JSON.stringify(batchItem, null, 2), 'utf8');
console.log(`배치 파일 작성 완료: ${batchPath}`);
