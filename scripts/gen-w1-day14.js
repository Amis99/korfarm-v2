const fs = require('fs');
const path = require('path');

// Day 14: LITERATURE (문학)
// 고1~2 수준 문학 지문: 이육사 「광야」 해설 지문

const p1 = `이육사는 일제 강점기에 활동한 시인이자 독립운동가로, 그의 작품에는 민족의 현실에 대한 깊은 인식과 광복에 대한 강렬한 의지가 담겨 있다. 대표작 「광야」는 1945년 시인이 옥중에서 세상을 떠난 뒤 유고로 발표된 시로, 조국 광복을 불과 몇 달 앞두고 숨진 시인의 마지막 의지를 담고 있어 한국 저항시 문학의 대표작으로 평가받고 있다. 이 시는 끝없이 펼쳐진 광야를 배경으로 하여 암울한 시대를 딛고 새로운 세계를 열겠다는 화자의 웅대한 비전을 노래하고 있다. 시 전체를 관통하는 웅장한 어조와 남성적 기상은 같은 시대 다른 시인들의 서정적 어조와 뚜렷이 구별되는 이육사 시의 고유한 특징이다.`;

const p2 = `시의 전반부에서 화자는 "까마득한 날에 하늘이 처음 열리고 어데 닭 우는 소리 들렸으랴"라고 노래하며 태초의 시간으로 거슬러 올라간다. 이러한 시간적 확장은 화자의 시선이 현재에 갇히지 않고 인류의 근원적 시작점까지 뻗어 있음을 보여 준다. 이어서 "모든 산맥들이 바다를 연모해 휘달릴 때에도 차마 이곳을 범하던 못하였으리라"라는 구절에서 광야는 어떤 자연의 힘도 침범하지 못한 순결하고 광대한 공간으로 제시된다. 이처럼 태초부터 존재해 온 광야의 이미지는 식민지 현실에 의해 훼손되지 않은 민족 정신의 원형을 상징한다고 해석할 수 있다. 화자는 이 원초적 공간을 통해 현재의 고통을 초월하는 웅장한 시적 세계를 구축하고 있다.`;

const p3 = `시의 후반부에서 화자는 "지금 눈 나리고 매화 향기 홀로 아득하니 내 여기 가난한 노래의 씨를 뿌리라"라고 다짐한다. 겨울에 눈이 내리는 것은 현재의 고난과 시련을 의미하며, 매화는 혹독한 추위 속에서도 피어나는 꽃으로서 역경에 굴하지 않는 굳은 의지를 상징한다. 화자가 '가난한 노래의 씨'를 뿌리겠다고 하는 것은 비록 현재는 초라하고 힘겨운 상황이지만, 언젠가 다가올 미래의 풍요와 해방을 위한 작은 실천을 지금 이 자리에서 시작하겠다는 결의의 표현이다. 여기서 '씨'는 아직 결실을 맺지 못한 가능성이자 희망을 내포하는 것으로, 시 전체에 미래 지향적 성격을 부여하는 핵심 이미지이다.`;

const p4 = `시의 마지막 연에서 화자는 "다시 천고의 뒤에 백마 타고 오는 초인이 있어 이 광야에서 목놓아 부르게 하리라"라고 선언한다. '천고의 뒤'라는 표현은 아득히 먼 미래를 가리키며, 백마를 탄 초인은 광복 이후 새로운 시대를 열 이상적 존재를 상징한다. 화자는 그 초인이 광야에서 목놓아 노래를 부를 수 있는 날을 그리며, 현재의 고통이 영원하지 않으리라는 확신을 드러낸다. 비록 시인 자신이 그날을 보지 못하더라도 반드시 밝은 미래가 올 것이라는 이 믿음은 절대적 낙관에 가까운 힘을 지닌다. 결국 「광야」는 암울한 현실을 인정하면서도 미래에 대한 의지와 희망을 놓지 않는 저항 정신의 결정체로, 한국 현대시의 기념비적 작품이라 할 수 있다.`;

const passage = {
  format: "TEXT",
  paragraphs: [
    { id: "p1", text: p1 },
    { id: "p2", text: p2 },
    { id: "p3", text: p3 },
    { id: "p4", text: p4 }
  ]
};

const totalLen = p1.length + p2.length + p3.length + p4.length;
console.log(`총 글자 수: ${totalLen} (목표: 1400 ±50)`);
console.log(`p1: ${p1.length}, p2: ${p2.length}, p3: ${p3.length}, p4: ${p4.length}`);

const timeline = [
  // p1
  {
    stepId: "s1",
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: 66 }] },
    question: {
      prompt: "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "이육사는 시인이자 독립운동가로, 민족 현실에 대한 인식과 광복 의지가 작품에 담겨 있다." },
        { id: "B", text: "이육사는 해방 이후에 활동한 소설가이다." },
        { id: "C", text: "이육사는 자연을 노래한 순수 서정 시인이다." },
        { id: "D", text: "이육사의 작품에는 정치적 내용이 전혀 담겨 있지 않다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s2",
    highlight: { ranges: [{ paragraphId: "p1", start: 67, end: 140 }] },
    question: {
      prompt: "둘째 문장에서 「광야」의 발표 경위로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "시인이 옥중에서 세상을 떠난 뒤 유고로 발표되었으며 저항시의 대표작으로 평가받는다." },
        { id: "B", text: "시인 생전에 직접 출판하여 큰 인기를 얻었다." },
        { id: "C", text: "해방 이후 시인이 직접 낭독하여 발표하였다." },
        { id: "D", text: "다른 시인이 대신 써 준 작품이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s3",
    highlight: { ranges: [{ paragraphId: "p1", start: 141, end: 211 }] },
    question: {
      prompt: "셋째 문장에서 「광야」가 노래하는 내용으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "암울한 시대를 딛고 새로운 세계를 열겠다는 화자의 웅대한 비전을 노래한다." },
        { id: "B", text: "일상의 소소한 즐거움을 노래한다." },
        { id: "C", text: "자연의 아름다움만을 묘사한다." },
        { id: "D", text: "이별의 슬픔을 절제된 어조로 노래한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s4",
    highlight: { ranges: [{ paragraphId: "p1", start: 212, end: p1.length }] },
    question: {
      prompt: "마지막 문장에서 이육사 시의 고유한 특징으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "웅장한 어조와 남성적 기상이 다른 시인들의 서정적 어조와 뚜렷이 구별된다." },
        { id: "B", text: "부드럽고 섬세한 서정적 어조가 특징이다." },
        { id: "C", text: "유머와 해학이 넘치는 어조가 특징이다." },
        { id: "D", text: "다른 시인들과 동일한 어조를 사용한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s5",
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: p1.length }] },
    question: {
      prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "이육사의 「광야」는 웅장한 어조로 광복 의지를 노래한 저항시의 대표작이다." },
        { id: "B", text: "이육사는 자연만을 소재로 하여 순수 서정시를 쓴 시인이다." },
        { id: "C", text: "「광야」는 이별의 슬픔을 노래한 시이다." },
        { id: "D", text: "이육사의 시는 부드러운 어조가 특징이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p2
  {
    stepId: "s6",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: 60 }] },
    question: {
      prompt: "첫 문장에서 화자가 거슬러 올라가는 시간은 언제인가요?",
      choices: [
        { id: "A", text: "태초의 시간, 하늘이 처음 열린 때로 거슬러 올라간다." },
        { id: "B", text: "조선 시대로 거슬러 올라간다." },
        { id: "C", text: "일제 강점기의 시작 시점으로 돌아간다." },
        { id: "D", text: "시인의 어린 시절로 되돌아간다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s7",
    highlight: { ranges: [{ paragraphId: "p2", start: 61, end: 109 }] },
    question: {
      prompt: "둘째 문장에서 시간적 확장이 보여 주는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "화자의 시선이 현재에 갇히지 않고 인류의 근원적 시작점까지 뻗어 있음을 보여 준다." },
        { id: "B", text: "화자가 현재에만 집중하고 있음을 보여 준다." },
        { id: "C", text: "화자가 과거를 후회하고 있음을 보여 준다." },
        { id: "D", text: "화자의 시선이 매우 좁고 제한적임을 보여 준다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s8",
    highlight: { ranges: [{ paragraphId: "p2", start: 110, end: 194 }] },
    question: {
      prompt: "셋째 문장에서 광야가 제시되는 방식으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "어떤 자연의 힘도 침범하지 못한 순결하고 광대한 공간으로 제시된다." },
        { id: "B", text: "인간에 의해 개발된 도시 공간으로 제시된다." },
        { id: "C", text: "전쟁으로 파괴된 황폐한 공간으로 제시된다." },
        { id: "D", text: "좁고 폐쇄적인 실내 공간으로 제시된다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s9",
    highlight: { ranges: [{ paragraphId: "p2", start: 195, end: 260 }] },
    question: {
      prompt: "넷째 문장에서 광야가 상징하는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "식민지 현실에 의해 훼손되지 않은 민족 정신의 원형을 상징한다." },
        { id: "B", text: "일제에 의해 파괴된 국토를 상징한다." },
        { id: "C", text: "개인적인 고독과 외로움을 상징한다." },
        { id: "D", text: "황폐한 자연환경을 상징한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s10",
    highlight: { ranges: [{ paragraphId: "p2", start: 261, end: p2.length }] },
    question: {
      prompt: "마지막 문장에서 화자가 원초적 공간을 통해 구축하는 것은 무엇인가요?",
      choices: [
        { id: "A", text: "현재의 고통을 초월하는 웅장한 시적 세계를 구축하고 있다." },
        { id: "B", text: "현재의 고통에 갇힌 비관적 세계를 묘사하고 있다." },
        { id: "C", text: "과거에 대한 향수만을 표현하고 있다." },
        { id: "D", text: "자연에 대한 과학적 관찰을 제시하고 있다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s11",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: p2.length }] },
    question: {
      prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "광야는 태초부터 존재한 순결한 공간으로, 훼손되지 않은 민족 정신의 원형을 상징한다." },
        { id: "B", text: "광야는 전쟁터를 의미하며 파괴와 죽음을 상징한다." },
        { id: "C", text: "화자는 현재에만 집중하여 과거와 미래를 외면한다." },
        { id: "D", text: "광야는 실제 지리적 장소를 묘사한 것일 뿐 상징적 의미는 없다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p3
  {
    stepId: "s12",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: 60 }] },
    question: {
      prompt: "첫 문장에서 화자가 다짐하는 내용으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "가난한 노래의 씨를 뿌리겠다고 다짐한다." },
        { id: "B", text: "노래를 부르지 않겠다고 다짐한다." },
        { id: "C", text: "광야를 떠나겠다고 다짐한다." },
        { id: "D", text: "매화를 꺾어 바치겠다고 다짐한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s13",
    highlight: { ranges: [{ paragraphId: "p3", start: 61, end: 130 }] },
    question: {
      prompt: "둘째 문장에서 눈과 매화가 각각 의미하는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "눈은 현재의 고난과 시련을, 매화는 역경에 굴하지 않는 굳은 의지를 상징한다." },
        { id: "B", text: "눈은 기쁨을, 매화는 슬픔을 상징한다." },
        { id: "C", text: "눈과 매화 모두 아무런 상징적 의미가 없다." },
        { id: "D", text: "눈은 풍요를, 매화는 쇠퇴를 상징한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s14",
    highlight: { ranges: [{ paragraphId: "p3", start: 131, end: 225 }] },
    question: {
      prompt: "셋째 문장에서 '가난한 노래의 씨'를 뿌리겠다는 것이 의미하는 바로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "현재는 힘겨운 상황이지만 미래의 해방을 위한 작은 실천을 시작하겠다는 결의이다." },
        { id: "B", text: "노래를 지어 팔아 돈을 벌겠다는 뜻이다." },
        { id: "C", text: "농사를 지어 식량을 확보하겠다는 뜻이다." },
        { id: "D", text: "현재의 상황에 만족하며 아무것도 하지 않겠다는 뜻이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s15",
    highlight: { ranges: [{ paragraphId: "p3", start: 226, end: p3.length }] },
    question: {
      prompt: "마지막 문장에서 '씨'가 내포하는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "아직 결실을 맺지 못한 가능성이자 희망을 내포하며, 시에 미래 지향적 성격을 부여한다." },
        { id: "B", text: "이미 완성된 결과물을 의미한다." },
        { id: "C", text: "과거에 대한 후회를 의미한다." },
        { id: "D", text: "현재의 풍요와 안정을 의미한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s16",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: p3.length }] },
    question: {
      prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "화자는 고난 속에서도 미래를 위해 '가난한 노래의 씨'를 뿌리겠다고 다짐하며 희망을 놓지 않는다." },
        { id: "B", text: "화자는 현실의 어려움에 절망하여 모든 것을 포기한다." },
        { id: "C", text: "매화는 추위에 약한 꽃으로 화자의 나약함을 상징한다." },
        { id: "D", text: "'씨'는 이미 열매를 맺은 완성된 상태를 나타낸다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p4
  {
    stepId: "s17",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: 66 }] },
    question: {
      prompt: "첫 문장에서 화자가 선언하는 내용으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "천고의 뒤에 백마 타고 오는 초인이 광야에서 목놓아 부르게 하리라고 선언한다." },
        { id: "B", text: "자신이 직접 백마를 타고 적을 물리치겠다고 선언한다." },
        { id: "C", text: "광야를 떠나 도시로 가겠다고 선언한다." },
        { id: "D", text: "노래를 멈추겠다고 선언한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s18",
    highlight: { ranges: [{ paragraphId: "p4", start: 67, end: 133 }] },
    question: {
      prompt: "둘째 문장에서 '백마를 탄 초인'이 상징하는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "광복 이후 새로운 시대를 열 이상적 존재를 상징한다." },
        { id: "B", text: "실제로 전쟁터에 나갈 군인을 가리킨다." },
        { id: "C", text: "과거의 역사적 인물을 가리킨다." },
        { id: "D", text: "자연에서 살아가는 야생 동물을 상징한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s19",
    highlight: { ranges: [{ paragraphId: "p4", start: 134, end: 197 }] },
    question: {
      prompt: "셋째 문장에서 화자가 드러내는 확신으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "현재의 고통이 영원하지 않으리라는 확신을 드러낸다." },
        { id: "B", text: "고통이 영원히 계속될 것이라는 절망을 드러낸다." },
        { id: "C", text: "미래에 대해 아무런 기대가 없음을 드러낸다." },
        { id: "D", text: "과거로 돌아가고 싶다는 소망을 드러낸다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s20",
    highlight: { ranges: [{ paragraphId: "p4", start: 198, end: 260 }] },
    question: {
      prompt: "넷째 문장에서 시인의 믿음이 지닌 힘으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "시인 자신이 보지 못하더라도 밝은 미래가 올 것이라는 절대적 낙관에 가까운 힘이다." },
        { id: "B", text: "시인의 믿음은 현실적 근거가 없어 무력하다." },
        { id: "C", text: "시인은 미래에 대해 비관적이며 희망을 포기한다." },
        { id: "D", text: "시인의 믿음은 자기 자신만을 위한 이기적 소망이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s21",
    highlight: { ranges: [{ paragraphId: "p4", start: 261, end: p4.length }] },
    question: {
      prompt: "마지막 문장에서 「광야」의 평가로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "암울한 현실을 인정하면서도 의지와 희망을 놓지 않는 저항 정신의 결정체이자 기념비적 작품이다." },
        { id: "B", text: "현실을 외면하고 환상에만 빠져 있는 비현실적 작품이다." },
        { id: "C", text: "개인적 감정만을 다룬 서정적 작품이다." },
        { id: "D", text: "문학적 가치가 낮아 주목받지 못한 작품이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s22",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: p4.length }] },
    question: {
      prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "마지막 연의 초인 이미지는 밝은 미래에 대한 확신을 담고 있으며, 「광야」는 저항 정신의 결정체이다." },
        { id: "B", text: "초인은 실제 역사적 인물을 가리키며, 시에 사실적 요소를 부여한다." },
        { id: "C", text: "화자는 미래에 대한 희망을 완전히 포기하고 있다." },
        { id: "D", text: "「광야」는 저항 정신과 무관한 순수 자연시이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  }
];

const recall = {
  cards: [
    { id: "c1", text: "이육사는 일제 강점기의 시인이자 독립운동가이며, 「광야」는 그의 대표적 저항시이다." },
    { id: "c2", text: "시의 웅장한 어조와 남성적 기상은 이육사 시의 고유한 특징이다." },
    { id: "c3", text: "시의 전반부는 태초의 시간으로 거슬러 올라가며, 광야는 훼손되지 않은 민족 정신의 원형을 상징한다." },
    { id: "c4", text: "눈은 현재의 고난을, 매화는 역경에 굴하지 않는 의지를 상징한다." },
    { id: "c5", text: "'가난한 노래의 씨'를 뿌리겠다는 것은 미래의 해방을 위한 작은 실천을 시작하겠다는 결의이다." },
    { id: "c6", text: "'씨'는 아직 결실을 맺지 못한 가능성이자 희망을 내포하는 핵심 이미지이다." },
    { id: "c7", text: "'백마 타고 오는 초인'은 광복 이후 새 시대를 열 이상적 존재를 상징한다." },
    { id: "c8", text: "「광야」는 암울한 현실을 인정하면서도 미래에 대한 의지와 희망을 놓지 않는 저항 정신의 결정체이다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "이육사는 시인 외에 어떤 활동을 한 인물인가요?",
      answerText: "독립운동가",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p1", start: 22, end: 28 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "「광야」는 한국 어떤 문학 갈래의 대표작으로 평가받나요?",
      answerText: "저항시",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p1", start: 123, end: 127 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "광야는 식민지 현실에 의해 훼손되지 않은 무엇을 상징하나요?",
      answerText: "민족 정신의 원형",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p2", start: 237, end: 246 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "매화가 상징하는 것은 무엇인가요?",
      answerText: "역경에 굴하지 않는 굳은 의지",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p3", start: 101, end: 117 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "'씨'는 아직 결실을 맺지 못한 무엇을 내포하나요?",
      answerText: "가능성이자 희망",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p3", start: 240, end: 249 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "'천고의 뒤'라는 표현은 어떤 시간을 가리키나요?",
      answerText: "아득히 먼 미래",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p4", start: 73, end: 81 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "백마를 탄 초인은 어떤 시대를 열 존재를 상징하나요?",
      answerText: "새로운 시대",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p4", start: 101, end: 108 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q8",
      prompt: "「광야」는 어떤 정신의 결정체로 평가받나요?",
      answerText: "저항 정신",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p4", start: 300, end: 305 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

const content = {
  contentId: "dr-w1-014",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 14 문학",
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

const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1', '014.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`static 파일 작성 완료: ${staticPath}`);

const batchItem = {
  content_type: "DAILY_READING",
  level_id: "WITTGENSTEIN_1",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 14,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};

const batchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-w1-day14.json');
fs.writeFileSync(batchPath, JSON.stringify(batchItem, null, 2), 'utf8');
console.log(`배치 파일 작성 완료: ${batchPath}`);
