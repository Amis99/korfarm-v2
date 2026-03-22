const fs = require('fs');
const path = require('path');

// Day 12: LITERATURE (문학)
// 고1~2 수준 문학 지문: 김소월 「진달래꽃」 해설 지문

const p1 = `김소월은 한국 현대 시문학의 대표적 시인으로, 그의 작품은 민요적 율격과 한국적 정서를 바탕으로 하여 오늘날까지 널리 사랑받고 있다. 그중에서도 「진달래꽃」은 1925년에 시집 『진달래꽃』에 수록되어 발표된 시로, 이별의 슬픔을 절제된 어조로 노래한 작품이다. 이 시는 '나 보기가 역겨워 가실 때에는 말없이 고이 보내 드리우리다'라는 첫 연으로 시작하는데, 떠나는 임을 원망하지 않고 묵묵히 보내겠다는 화자의 태도가 매우 인상적이다. 화자가 보여 주는 이러한 태도는 한국 문학 전통에서 오랫동안 이어져 온 이별의 정한과 인고의 미학을 대표적으로 구현하고 있으며, 독자에게 강한 정서적 울림을 선사한다.`;

const p2 = `시의 중반부에서 화자는 떠나는 임의 발길이 닿는 곳마다 영변에 약산 진달래꽃을 한 아름 뿌려 놓겠다고 말한다. 여기서 진달래꽃은 단순한 자연물이 아니라 화자의 마음, 곧 이별을 감내하면서도 임에 대한 사랑을 포기하지 않는 정성의 상징이다. 꽃을 뿌리는 행위는 임이 가는 길을 아름답게 꾸며 주겠다는 헌신적 사랑의 표현이면서, 동시에 떠나는 임의 발에 밟혀 꽃잎이 으깨지는 슬픔을 내포하고 있다. 이처럼 하나의 이미지 안에 사랑과 슬픔이 공존하는 것은 이 시만의 독특한 정서적 깊이를 만들어 낸다. 화자는 이 꽃을 통해 자신의 감정을 직접 토로하지 않으면서도 독자에게 강렬하고 깊은 울림을 전하는 데 성공하고 있다.`;

const p3 = `시의 마지막 연에서 화자는 "나 보기가 역겨워 가실 때에는 죽어도 아니 눈물 흘리우리다"라고 선언한다. 이 구절은 첫 연의 '말없이 고이 보내 드리우리다'와 대응하면서 시 전체의 구조적 균형을 이루는 역할을 한다. 화자는 아무리 슬퍼도 눈물을 보이지 않겠다고 다짐하는데, 이는 감정을 억누르는 것이 아니라 임 앞에서 끝까지 의연한 모습을 지키려는 자존심과 배려의 표현이다. 역설적이게도 눈물을 흘리지 않겠다는 이 다짐이야말로 화자의 슬픔이 얼마나 깊은지를 더욱 강렬하게 전달하는 장치로 기능한다. 이처럼 감정을 절제함으로써 오히려 감정의 깊이를 극대화하는 기법은 한국 서정시의 오래되고 중요한 전통 중 하나이다.`;

const p4 = `「진달래꽃」이 시대를 초월하여 사랑받는 까닭은 누구나 겪을 수 있는 보편적인 이별의 감정을 한국적 정서에 맞게 아름답게 형상화했기 때문이다. 김소월은 민요의 가락을 시에 녹여 내어 읽는 이로 하여금 자연스럽게 따라 읽고 싶은 리듬감을 선사하였다. 또한 '진달래꽃'이라는 한국 산야에 흔한 꽃을 시의 중심 소재로 선택함으로써 독자 누구나 쉽게 공감할 수 있는 친숙한 이미지를 확보하였다. 이별 앞에서 원망 대신 묵묵한 사랑을 택하는 화자의 태도는 시대가 변해도 여전히 많은 이의 마음을 울린다. 결국 이 시는 절제와 헌신이라는 두 가치를 통해 이별의 아픔을 숭고한 아름다움으로 승화시킨 한국 서정시의 정수라 할 수 있다.`;

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
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: 65 }] },
    question: {
      prompt: "첫 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "김소월은 민요적 율격과 한국적 정서를 바탕으로 하여 오늘날까지 사랑받는 시인이다." },
        { id: "B", text: "김소월은 서양 시의 형식을 따라 작품을 쓴 시인이다." },
        { id: "C", text: "김소월은 소설가로 활동하다가 뒤늦게 시를 쓰기 시작하였다." },
        { id: "D", text: "김소월의 작품은 현대에 와서 잊혀진 상태이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s2",
    highlight: { ranges: [{ paragraphId: "p1", start: 66, end: 118 }] },
    question: {
      prompt: "둘째 문장에서 「진달래꽃」의 특징으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "1925년에 발표되었으며 이별의 슬픔을 절제된 어조로 노래한 작품이다." },
        { id: "B", text: "해방 이후에 발표된 기쁨을 노래한 작품이다." },
        { id: "C", text: "전쟁의 참상을 격렬한 어조로 고발한 작품이다." },
        { id: "D", text: "자연의 아름다움만을 묘사한 풍경 시이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s3",
    highlight: { ranges: [{ paragraphId: "p1", start: 119, end: 210 }] },
    question: {
      prompt: "셋째 문장에서 첫 연의 화자가 보여 주는 태도로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "떠나는 임을 원망하지 않고 묵묵히 보내겠다는 태도이다." },
        { id: "B", text: "떠나는 임을 강하게 붙잡으려는 태도이다." },
        { id: "C", text: "임에게 화를 내며 원망하는 태도이다." },
        { id: "D", text: "임의 떠남에 무관심한 태도이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s4",
    highlight: { ranges: [{ paragraphId: "p1", start: 211, end: p1.length }] },
    question: {
      prompt: "마지막 문장에서 화자의 태도가 구현하는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "한국 문학 전통의 이별의 정한과 인고의 미학을 대표적으로 구현하고 있다." },
        { id: "B", text: "서양 낭만주의 문학 전통을 대표적으로 구현하고 있다." },
        { id: "C", text: "현대 사실주의 문학의 기법을 구현하고 있다." },
        { id: "D", text: "중국 고전 문학의 형식을 그대로 따르고 있다." }
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
        { id: "A", text: "김소월의 「진달래꽃」은 이별의 슬픔을 절제된 어조로 표현한 시로, 한국 문학의 이별 정한과 인고의 미학을 구현한다." },
        { id: "B", text: "김소월은 시보다 소설로 더 유명한 작가이며 「진달래꽃」은 그의 유일한 시이다." },
        { id: "C", text: "「진달래꽃」은 기쁨과 축제의 분위기를 노래한 밝은 시이다." },
        { id: "D", text: "김소월은 서양 시의 형식만을 따랐기 때문에 한국적 정서와는 거리가 멀다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p2
  {
    stepId: "s6",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: 48 }] },
    question: {
      prompt: "첫 문장에서 화자가 하겠다고 말하는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "떠나는 임의 발길이 닿는 곳마다 진달래꽃을 한 아름 뿌려 놓겠다고 한다." },
        { id: "B", text: "임을 따라 함께 떠나겠다고 한다." },
        { id: "C", text: "임이 가는 길을 막겠다고 한다." },
        { id: "D", text: "진달래꽃을 임에게 되돌려 주겠다고 한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s7",
    highlight: { ranges: [{ paragraphId: "p2", start: 49, end: 112 }] },
    question: {
      prompt: "둘째 문장에서 진달래꽃이 상징하는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "이별을 감내하면서도 임에 대한 사랑을 포기하지 않는 정성의 상징이다." },
        { id: "B", text: "임에 대한 원망과 분노의 상징이다." },
        { id: "C", text: "자연의 아름다움만을 나타내는 장식적 소재이다." },
        { id: "D", text: "이별의 기쁨을 표현하는 축하의 상징이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s8",
    highlight: { ranges: [{ paragraphId: "p2", start: 113, end: 189 }] },
    question: {
      prompt: "셋째 문장에서 꽃을 뿌리는 행위에 담긴 이중적 의미로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "헌신적 사랑의 표현이면서 동시에 꽃잎이 밟혀 으깨지는 슬픔을 내포하고 있다." },
        { id: "B", text: "기쁨과 축제의 표현이면서 동시에 풍요를 기원하는 의미이다." },
        { id: "C", text: "임을 비난하는 행위이면서 동시에 원망을 담고 있다." },
        { id: "D", text: "단순한 꽃 장식일 뿐 깊은 의미는 없다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s9",
    highlight: { ranges: [{ paragraphId: "p2", start: 190, end: 240 }] },
    question: {
      prompt: "넷째 문장에서 사랑과 슬픔이 공존하는 것이 만들어 내는 것은 무엇인가요?",
      choices: [
        { id: "A", text: "이 시만의 독특한 정서적 깊이를 만들어 낸다." },
        { id: "B", text: "시의 의미를 모호하게 만들어 이해를 어렵게 한다." },
        { id: "C", text: "시의 가치를 떨어뜨리는 결과를 가져온다." },
        { id: "D", text: "독자에게 혼란만 주어 감동을 방해한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s10",
    highlight: { ranges: [{ paragraphId: "p2", start: 241, end: p2.length }] },
    question: {
      prompt: "마지막 문장에서 화자가 성공한 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "감정을 직접 토로하지 않으면서도 독자에게 깊은 울림을 전하는 데 성공하였다." },
        { id: "B", text: "감정을 격렬하게 표출하여 독자의 동정을 얻는 데 성공하였다." },
        { id: "C", text: "자연 묘사만으로 시의 분위기를 완전히 밝게 바꾸는 데 성공하였다." },
        { id: "D", text: "임을 설득하여 떠남을 막는 데 성공하였다." }
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
        { id: "A", text: "진달래꽃은 사랑과 슬픔이 공존하는 상징으로, 화자는 이를 통해 감정을 간접적으로 전달한다." },
        { id: "B", text: "진달래꽃은 아무런 상징 없이 풍경을 묘사하기 위해 사용된 소재이다." },
        { id: "C", text: "화자는 꽃을 뿌리며 임에게 원망의 감정을 표현한다." },
        { id: "D", text: "꽃을 뿌리는 행위는 이별의 기쁨을 축하하는 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p3
  {
    stepId: "s12",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: 59 }] },
    question: {
      prompt: "첫 문장에서 마지막 연의 화자가 선언하는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "죽어도 눈물을 흘리지 않겠다고 선언한다." },
        { id: "B", text: "임을 따라 함께 떠나겠다고 선언한다." },
        { id: "C", text: "눈물을 흘리며 슬픔을 표현하겠다고 선언한다." },
        { id: "D", text: "임에게 돌아오라고 간절히 부탁한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s13",
    highlight: { ranges: [{ paragraphId: "p3", start: 60, end: 100 }] },
    question: {
      prompt: "둘째 문장에서 이 구절이 시 전체에서 하는 역할로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "첫 연과 대응하면서 시 전체의 구조적 균형을 이루는 역할을 한다." },
        { id: "B", text: "시의 흐름을 갑자기 끊어 긴장감을 조성하는 역할을 한다." },
        { id: "C", text: "새로운 주제를 도입하여 시의 방향을 바꾸는 역할을 한다." },
        { id: "D", text: "시의 배경을 설명하는 역할만 한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s14",
    highlight: { ranges: [{ paragraphId: "p3", start: 101, end: 169 }] },
    question: {
      prompt: "셋째 문장에서 눈물을 보이지 않겠다는 다짐의 의미로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "임 앞에서 의연한 모습을 지키려는 자존심과 배려의 표현이다." },
        { id: "B", text: "이별이 슬프지 않다는 무관심의 표현이다." },
        { id: "C", text: "임을 향한 분노를 참고 있다는 표현이다." },
        { id: "D", text: "감정 자체가 없다는 냉담한 태도의 표현이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s15",
    highlight: { ranges: [{ paragraphId: "p3", start: 170, end: 240 }] },
    question: {
      prompt: "넷째 문장에서 역설적으로 전달되는 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "눈물을 흘리지 않겠다는 다짐이 화자의 슬픔이 얼마나 깊은지를 더 강렬하게 전달한다." },
        { id: "B", text: "눈물을 흘리지 않으면 슬픔이 자연히 사라진다." },
        { id: "C", text: "눈물을 참으면 기쁨이 생겨난다." },
        { id: "D", text: "눈물의 유무는 감정의 깊이와 무관하다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s16",
    highlight: { ranges: [{ paragraphId: "p3", start: 241, end: p3.length }] },
    question: {
      prompt: "마지막 문장에서 감정을 절제하는 기법이 한국 서정시에서 어떤 위상을 지니나요?",
      choices: [
        { id: "A", text: "감정의 깊이를 극대화하는 한국 서정시의 중요한 전통 중 하나이다." },
        { id: "B", text: "최근에 새로 등장한 실험적 기법으로 전통과는 무관하다." },
        { id: "C", text: "서양 시에서만 사용되는 기법이다." },
        { id: "D", text: "감정을 약화시키는 기법으로 평가가 좋지 않다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s17",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: p3.length }] },
    question: {
      prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "마지막 연에서 눈물을 참겠다는 다짐은 역설적으로 슬픔의 깊이를 극대화하며, 이는 한국 서정시의 전통이다." },
        { id: "B", text: "화자는 이별에 무관심하여 눈물이 나오지 않는 것이다." },
        { id: "C", text: "마지막 연은 시 전체와 관련이 없는 독립적인 부분이다." },
        { id: "D", text: "감정을 절제하는 기법은 시의 가치를 떨어뜨리는 요소이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  // p4
  {
    stepId: "s18",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: 55 }] },
    question: {
      prompt: "첫 문장에서 「진달래꽃」이 오래 사랑받는 이유로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "보편적인 이별의 감정을 한국적 정서에 맞게 아름답게 형상화했기 때문이다." },
        { id: "B", text: "특정 시대의 사건만을 다루었기 때문이다." },
        { id: "C", text: "난해한 표현으로 학술적 가치가 높기 때문이다." },
        { id: "D", text: "외국 시를 번역한 작품이기 때문이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s19",
    highlight: { ranges: [{ paragraphId: "p4", start: 56, end: 111 }] },
    question: {
      prompt: "둘째 문장에서 김소월이 시에 녹여 낸 것으로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "민요의 가락을 녹여 내어 자연스럽게 따라 읽고 싶은 리듬감을 선사하였다." },
        { id: "B", text: "서양 음악의 선율을 녹여 내어 이국적 분위기를 만들었다." },
        { id: "C", text: "산문적 문체를 사용하여 리듬감을 배제하였다." },
        { id: "D", text: "한문 투의 문장을 사용하여 고전적 분위기를 냈다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s20",
    highlight: { ranges: [{ paragraphId: "p4", start: 112, end: 178 }] },
    question: {
      prompt: "셋째 문장에서 진달래꽃을 중심 소재로 선택한 효과로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "독자 누구나 쉽게 공감할 수 있는 친숙한 이미지를 확보하였다." },
        { id: "B", text: "독자에게 낯선 이국적 이미지를 제공하였다." },
        { id: "C", text: "시의 의미를 모호하게 만들어 해석을 어렵게 하였다." },
        { id: "D", text: "특정 지역의 독자만 공감할 수 있는 한계를 지녔다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s21",
    highlight: { ranges: [{ paragraphId: "p4", start: 179, end: 226 }] },
    question: {
      prompt: "넷째 문장에서 화자의 태도가 시대를 초월하여 전달하는 것은 무엇인가요?",
      choices: [
        { id: "A", text: "원망 대신 묵묵한 사랑을 택하는 태도가 여전히 많은 이의 마음을 울린다." },
        { id: "B", text: "임을 향한 격렬한 원망이 독자의 분노를 자극한다." },
        { id: "C", text: "이별에 대한 무관심이 독자에게 편안함을 준다." },
        { id: "D", text: "화자의 태도는 현대 독자에게 공감을 얻지 못한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s22",
    highlight: { ranges: [{ paragraphId: "p4", start: 227, end: p4.length }] },
    question: {
      prompt: "마지막 문장에서 이 시의 평가로 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "절제와 헌신을 통해 이별의 아픔을 숭고한 아름다움으로 승화시킨 한국 서정시의 정수이다." },
        { id: "B", text: "격렬한 감정 표출을 통해 독자의 동정을 구하는 통속적 작품이다." },
        { id: "C", text: "자연 묘사에 치중하여 인간의 감정이 빠져 있는 작품이다." },
        { id: "D", text: "한 시대에만 의미가 있는 시대적 한계를 지닌 작품이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s23",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: p4.length }] },
    question: {
      prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
      choices: [
        { id: "A", text: "「진달래꽃」은 민요적 리듬과 친숙한 소재, 절제된 태도로 이별을 아름답게 승화시킨 한국 서정시의 정수이다." },
        { id: "B", text: "「진달래꽃」은 외국 문학의 영향을 크게 받아 한국적 정서와는 거리가 멀다." },
        { id: "C", text: "김소월은 진달래꽃이라는 소재를 우연히 선택했을 뿐 특별한 의도는 없었다." },
        { id: "D", text: "이 시는 현대에 와서 그 가치를 잃어 더 이상 읽히지 않는다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  }
];

const recall = {
  cards: [
    { id: "c1", text: "김소월의 「진달래꽃」은 1925년에 발표된 시로, 이별의 슬픔을 절제된 어조로 노래하고 있다." },
    { id: "c2", text: "화자는 떠나는 임을 원망하지 않고 묵묵히 보내겠다고 하며, 한국 문학의 이별 정한과 인고의 미학을 구현한다." },
    { id: "c3", text: "진달래꽃은 이별을 감내하면서도 사랑을 포기하지 않는 정성의 상징이며, 사랑과 슬픔이 공존한다." },
    { id: "c4", text: "화자는 감정을 직접 토로하지 않고 꽃이라는 이미지를 통해 깊은 울림을 전달한다." },
    { id: "c5", text: "마지막 연의 '죽어도 아니 눈물 흘리우리다'는 자존심과 배려의 표현이다." },
    { id: "c6", text: "눈물을 참겠다는 다짐은 역설적으로 슬픔의 깊이를 극대화하며, 이는 한국 서정시의 전통이다." },
    { id: "c7", text: "민요의 가락과 한국 산야에 흔한 꽃이라는 소재가 독자의 공감과 친숙함을 이끌어 낸다." },
    { id: "c8", text: "이 시는 절제와 헌신을 통해 이별의 아픔을 숭고한 아름다움으로 승화시킨 한국 서정시의 정수이다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "「진달래꽃」은 몇 년에 발표된 시인가요?",
      answerText: "1925년",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p1", start: 72, end: 78 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "화자의 태도가 구현하는 한국 문학 전통의 두 가지 미학은 무엇인가요?",
      answerText: "이별의 정한과 인고의 미학",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p1", start: 260, end: 274 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "진달래꽃은 화자의 어떤 마음을 상징하나요?",
      answerText: "정성",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p2", start: 103, end: 105 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "꽃을 뿌리는 행위에는 헌신적 사랑과 동시에 무엇이 내포되어 있나요?",
      answerText: "슬픔",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p2", start: 184, end: 186 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "화자가 눈물을 보이지 않겠다는 다짐은 어떤 표현인가요?",
      answerText: "자존심과 배려",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p3", start: 147, end: 155 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "감정을 절제함으로써 오히려 무엇을 극대화하나요?",
      answerText: "감정의 깊이",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p3", start: 265, end: 271 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "김소월이 시에 녹여 내어 리듬감을 선사한 것은 무엇인가요?",
      answerText: "민요의 가락",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p4", start: 62, end: 69 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q8",
      prompt: "이 시가 이별의 아픔을 승화시키는 두 가지 가치는 무엇인가요?",
      answerText: "절제와 헌신",
      answerMatchMode: "ANY",
      answerRanges: [{ paragraphId: "p4", start: 238, end: 244 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

const content = {
  contentId: "dr-w1-012",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 12 문학",
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

const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1', '012.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`static 파일 작성 완료: ${staticPath}`);

const batchItem = {
  content_type: "DAILY_READING",
  level_id: "WITTGENSTEIN_1",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 12,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};

const batchPath = path.join(__dirname, '..', 'generated', 'new', 'batch-w1-day12.json');
fs.writeFileSync(batchPath, JSON.stringify(batchItem, null, 2), 'utf8');
console.log(`배치 파일 작성 완료: ${batchPath}`);
