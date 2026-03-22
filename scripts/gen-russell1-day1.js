// 러셀1 Day 1 비문학 - "뉴스와 시민 참여" 전체 JSON 생성
const fs = require('fs');
const path = require('path');

const p1 = "우리가 매일 접하는 뉴스는 사회에서 벌어지는 여러 가지 일을 알려 주는 중요한 역할을 한다. 과거에는 신문이나 텔레비전 뉴스가 주로 정치인이나 큰 기업에 관한 이야기를 다루었다. 그런데 이런 뉴스는 일반 시민의 일상생활과 거리가 멀어서, 많은 사람이 뉴스에 관심을 잃기 시작했다. 뉴스를 보아도 자기 삶과는 상관없는 먼 세계의 이야기처럼 느껴졌기 때문이다. 이런 문제의식에서 등장한 것이 바로 '공공 저널리즘'이라는 새로운 보도 방식이다. 공공 저널리즘이란 시민이 일상에서 실제로 겪는 문제를 뉴스의 중심 주제로 삼는 것을 말한다. 예를 들어 동네의 교통 안전 문제나 학교 급식의 질처럼 사람들의 생활에 직접 영향을 미치는 주제를 깊이 있게 다루는 것이다.";

const p2 = "공공 저널리즘에서 기자는 단순히 사건을 전달하는 사람에 그치지 않는다. 기자는 시민의 목소리를 직접 모으는 역할도 함께 수행한다. 구체적으로 기자는 설문 조사나 주민 회의 같은 방법을 활용하여 시민이 어떤 문제를 가장 심각하게 느끼는지 파악한다. 그런 다음 전문가와 주민이 한자리에 모여 해결 방안을 논의하는 토론회를 마련하기도 한다. 이렇게 모인 다양한 의견과 논의 결과를 기사로 정리하여 보도하면, 더 많은 시민이 그 문제에 관심을 갖게 된다. 결국 공공 저널리즘은 뉴스를 통해 시민이 사회 문제에 직접 참여하도록 이끄는 데 큰 의의가 있다.";

const p3 = "물론 공공 저널리즘에 대한 비판의 목소리도 존재한다. 기자가 시민과 너무 가까이 지내다 보면 중립적인 시각을 잃을 수 있다는 점이 대표적인 우려이다. 예를 들어 기자가 특정 주민의 의견에 지나치게 공감한 나머지 다른 쪽의 사정을 제대로 전하지 못할 수도 있다. 이러한 문제를 줄이기 위해 공공 저널리즘은 과학적인 조사 방법을 적극 활용한다. 체계적인 설문 조사를 실시하고 여러 집단의 의견을 고루 수집하는 과정을 거쳐 보도의 객관성을 유지하려 노력한다. 이처럼 공공 저널리즘은 시민의 참여를 이끌어 내면서도 보도의 객관성을 지키려는 균형 잡힌 보도 방식이다. 이 새로운 뉴스 문화는 시민이 단순한 뉴스 소비자가 아니라 사회 문제 해결에 함께하는 참여자가 될 수 있음을 보여 준다.";

const scoring = { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true };

const content = {
  contentId: "dr-r1-001",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 1) Day 1 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_1",
  schoolGradeRange: { min: 7, max: 8 },
  area: "READING",
  subArea: "NONFICTION",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300,
  assets: {},
  payload: {
    passage: {
      format: "TEXT",
      paragraphs: [
        { id: "p1", text: p1 },
        { id: "p2", text: p2 },
        { id: "p3", text: p3 }
      ]
    },
    intensive: {
      timeline: [
        // p1 문장1: [0,51]
        {
          stepId: "s1",
          highlight: { ranges: [{ paragraphId: "p1", start: 0, end: 51 }] },
          question: {
            prompt: "이 문장이 설명하는 뉴스의 역할로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "사회에서 벌어지는 여러 일을 사람들에게 알려 주는 것이다." },
              { id: "B", text: "사람들에게 재미있는 이야기를 들려주어 즐거움을 주는 것이다." },
              { id: "C", text: "정치인의 개인적인 일상을 자세히 소개하는 것이다." },
              { id: "D", text: "기업의 광고를 대신하여 상품을 홍보하는 것이다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p1 문장2: [52,99]
        {
          stepId: "s2",
          highlight: { ranges: [{ paragraphId: "p1", start: 52, end: 99 }] },
          question: {
            prompt: "과거 뉴스가 주로 다루었던 내용으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "정치인이나 큰 기업에 관한 이야기를 주로 다루었다." },
              { id: "B", text: "동네의 작은 가게나 학교 행사를 집중적으로 다루었다." },
              { id: "C", text: "시민들의 취미 활동과 여가 생활을 주로 보도했다." },
              { id: "D", text: "어린이를 위한 교육 프로그램을 중심으로 보도했다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p1 문장3: [100,156]
        {
          stepId: "s3",
          highlight: { ranges: [{ paragraphId: "p1", start: 100, end: 156 }] },
          question: {
            prompt: "이런 뉴스에 대해 사람들이 보인 반응으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "일상생활과 거리가 멀어 뉴스에 대한 관심을 잃기 시작했다." },
              { id: "B", text: "뉴스가 재미있어서 더 열심히 시청하기 시작했다." },
              { id: "C", text: "뉴스 내용에 공감하여 정치에 적극 참여하게 되었다." },
              { id: "D", text: "뉴스를 보고 직접 기자가 되려는 사람이 늘어났다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p1 문장4: [157,199]
        {
          stepId: "s4",
          highlight: { ranges: [{ paragraphId: "p1", start: 157, end: 199 }] },
          question: {
            prompt: "사람들이 뉴스에 관심을 잃은 까닭으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "자기 삶과 상관없는 먼 세계의 이야기처럼 느껴졌기 때문이다." },
              { id: "B", text: "뉴스를 볼 수 있는 텔레비전이 집에 없었기 때문이다." },
              { id: "C", text: "뉴스의 내용이 너무 쉽고 새로운 정보가 없었기 때문이다." },
              { id: "D", text: "신문 가격이 너무 비싸서 구독할 수 없었기 때문이다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p1 문장5: [200,245]
        {
          stepId: "s5",
          highlight: { ranges: [{ paragraphId: "p1", start: 200, end: 245 }] },
          question: {
            prompt: "이런 문제의식에서 새로 등장한 것으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "공공 저널리즘이라는 새로운 보도 방식이 등장했다." },
              { id: "B", text: "시민들이 직접 신문사를 설립하기 시작했다." },
              { id: "C", text: "정치인이 뉴스에 출연하는 횟수를 줄이기로 했다." },
              { id: "D", text: "텔레비전 뉴스 대신 라디오 뉴스만 방송하게 되었다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p1 문장6: [246,297]
        {
          stepId: "s6",
          highlight: { ranges: [{ paragraphId: "p1", start: 246, end: 297 }] },
          question: {
            prompt: "공공 저널리즘의 뜻으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "시민이 일상에서 겪는 문제를 뉴스의 중심 주제로 삼는 것이다." },
              { id: "B", text: "정치인의 발표를 그대로 전달하는 보도 방식이다." },
              { id: "C", text: "기자가 혼자서 모든 취재와 편집을 담당하는 것이다." },
              { id: "D", text: "외국의 뉴스를 번역하여 국내에 소개하는 것이다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p1 문장7: [298,367]
        {
          stepId: "s7",
          highlight: { ranges: [{ paragraphId: "p1", start: 298, end: 367 }] },
          question: {
            prompt: "공공 저널리즘이 다루는 주제의 예로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "동네의 교통 안전 문제나 학교 급식의 질 같은 생활 밀착 주제이다." },
              { id: "B", text: "해외 유명 인사의 결혼 소식이나 패션 이야기이다." },
              { id: "C", text: "우주 탐사 계획이나 외계 생명체에 관한 이야기이다." },
              { id: "D", text: "대기업 주가 변동이나 주식 시장 동향이다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p1 문단 중심내용
        {
          stepId: "s8",
          highlight: { ranges: [{ paragraphId: "p1", start: 0, end: 367 }] },
          question: {
            prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "시민 생활과 동떨어진 뉴스의 한계를 극복하기 위해 공공 저널리즘이 등장했다." },
              { id: "B", text: "과거의 뉴스는 지금보다 더 많은 시청자를 확보하고 있었다." },
              { id: "C", text: "텔레비전이 신문보다 뉴스를 전달하는 데 더 효과적이다." },
              { id: "D", text: "정치인과 기업에 관한 뉴스가 시민에게 가장 유익하다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p2 문장1: [0,39]
        {
          stepId: "s9",
          highlight: { ranges: [{ paragraphId: "p2", start: 0, end: 39 }] },
          question: {
            prompt: "공공 저널리즘에서 기자의 역할에 대한 설명으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "단순히 사건만 전달하는 데 그치지 않는다고 한다." },
              { id: "B", text: "사건을 전달하는 일에만 집중해야 한다고 한다." },
              { id: "C", text: "기자는 뉴스를 만들지 않고 편집만 담당한다고 한다." },
              { id: "D", text: "기자는 시민과 대화하지 않는 것이 원칙이라고 한다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p2 문장2: [40,72]
        {
          stepId: "s10",
          highlight: { ranges: [{ paragraphId: "p2", start: 40, end: 72 }] },
          question: {
            prompt: "기자가 추가로 수행하는 역할로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "시민의 목소리를 직접 모으는 역할을 함께 한다." },
              { id: "B", text: "시민 대신 사회 문제를 해결하는 역할을 한다." },
              { id: "C", text: "시민에게 뉴스를 읽어 주는 역할을 한다." },
              { id: "D", text: "기업의 홍보 자료를 작성하는 역할을 한다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p2 문장3: [73,137]
        {
          stepId: "s11",
          highlight: { ranges: [{ paragraphId: "p2", start: 73, end: 137 }] },
          question: {
            prompt: "기자가 시민의 생각을 파악하기 위해 활용하는 방법으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "설문 조사나 주민 회의 같은 방법을 활용한다." },
              { id: "B", text: "인터넷 검색만으로 시민의 의견을 파악한다." },
              { id: "C", text: "기자 혼자서 시민의 생각을 짐작하여 기사를 쓴다." },
              { id: "D", text: "전화 한 통으로 대표 시민 한 명의 의견만 듣는다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p2 문장4: [138,187]
        {
          stepId: "s12",
          highlight: { ranges: [{ paragraphId: "p2", start: 138, end: 187 }] },
          question: {
            prompt: "전문가와 주민이 함께하는 활동으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "한자리에 모여 해결 방안을 논의하는 토론회를 연다." },
              { id: "B", text: "각자 집에서 따로 의견을 적어 우편으로 보낸다." },
              { id: "C", text: "전문가만 모여서 결정을 내린 뒤 주민에게 알린다." },
              { id: "D", text: "주민은 참여하지 않고 전문가의 글만 읽는다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p2 문장5: [188,250]
        {
          stepId: "s13",
          highlight: { ranges: [{ paragraphId: "p2", start: 188, end: 250 }] },
          question: {
            prompt: "논의 결과를 보도하면 나타나는 효과로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "더 많은 시민이 해당 문제에 관심을 갖게 된다." },
              { id: "B", text: "시민들이 뉴스를 아예 보지 않게 된다." },
              { id: "C", text: "전문가들이 더 이상 토론회에 참여하지 않게 된다." },
              { id: "D", text: "기자가 다른 주제로 바꾸어 보도하게 된다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p2 문장6: [251,305]
        {
          stepId: "s14",
          highlight: { ranges: [{ paragraphId: "p2", start: 251, end: 305 }] },
          question: {
            prompt: "공공 저널리즘의 의의로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "시민이 사회 문제에 직접 참여하도록 이끄는 데 있다." },
              { id: "B", text: "기자의 수입을 늘리는 데 가장 큰 의의가 있다." },
              { id: "C", text: "뉴스의 방송 시간을 줄이는 데 의미가 있다." },
              { id: "D", text: "정치인의 활동을 더 많이 보도하는 데 있다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p2 문단 중심내용
        {
          stepId: "s15",
          highlight: { ranges: [{ paragraphId: "p2", start: 0, end: 305 }] },
          question: {
            prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "공공 저널리즘에서 기자는 시민의 의견을 모아 사회 참여를 이끄는 역할을 한다." },
              { id: "B", text: "기자는 사건만 전달하면 되므로 시민과 만날 필요가 없다." },
              { id: "C", text: "설문 조사는 시간이 오래 걸려서 뉴스에 활용하기 어렵다." },
              { id: "D", text: "토론회는 전문가만 참여해야 효과적인 결론을 얻을 수 있다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p3 문장1: [0,29]
        {
          stepId: "s16",
          highlight: { ranges: [{ paragraphId: "p3", start: 0, end: 29 }] },
          question: {
            prompt: "이 문장이 알려 주는 내용으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "공공 저널리즘에 대한 비판의 목소리도 있다는 것이다." },
              { id: "B", text: "공공 저널리즘은 모든 사람에게 칭찬만 받고 있다는 것이다." },
              { id: "C", text: "공공 저널리즘이 사라지고 있다는 것이다." },
              { id: "D", text: "기자들이 공공 저널리즘을 모두 거부하고 있다는 것이다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p3 문장2: [30,83]
        {
          stepId: "s17",
          highlight: { ranges: [{ paragraphId: "p3", start: 30, end: 83 }] },
          question: {
            prompt: "공공 저널리즘에 대한 대표적인 우려로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "기자가 시민과 가까이 지내면 중립적인 시각을 잃을 수 있다는 점이다." },
              { id: "B", text: "기자가 시민을 만나면 취재 시간이 너무 오래 걸린다는 점이다." },
              { id: "C", text: "시민이 기자의 기사를 읽지 않게 될 수 있다는 점이다." },
              { id: "D", text: "뉴스 제작 비용이 지나치게 많이 든다는 점이다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p3 문장3: [84,145]
        {
          stepId: "s18",
          highlight: { ranges: [{ paragraphId: "p3", start: 84, end: 145 }] },
          question: {
            prompt: "기자가 특정 주민에게 공감하면 생길 수 있는 문제로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "다른 쪽의 사정을 제대로 전하지 못할 수 있다." },
              { id: "B", text: "모든 시민이 기자를 더 신뢰하게 된다." },
              { id: "C", text: "뉴스의 분량이 줄어들어 정보가 부족해진다." },
              { id: "D", text: "기자가 다른 지역으로 옮겨 가게 된다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p3 문장4: [146,190]
        {
          stepId: "s19",
          highlight: { ranges: [{ paragraphId: "p3", start: 146, end: 190 }] },
          question: {
            prompt: "공공 저널리즘이 문제를 줄이기 위해 활용하는 것으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "과학적인 조사 방법을 적극 활용한다." },
              { id: "B", text: "기자의 개인적인 판단에만 의존한다." },
              { id: "C", text: "시민과의 접촉을 완전히 차단한다." },
              { id: "D", text: "뉴스 보도를 아예 중단하기로 한다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p3 문장5: [191,253]
        {
          stepId: "s20",
          highlight: { ranges: [{ paragraphId: "p3", start: 191, end: 253 }] },
          question: {
            prompt: "보도의 객관성을 유지하기 위한 구체적인 방법으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "체계적인 설문 조사와 여러 집단의 의견을 고루 수집한다." },
              { id: "B", text: "한 명의 전문가 의견만 듣고 바로 기사를 작성한다." },
              { id: "C", text: "시민의 의견은 무시하고 통계 자료만 활용한다." },
              { id: "D", text: "다른 나라의 기사를 그대로 번역하여 보도한다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p3 문장6: [254,312]
        {
          stepId: "s21",
          highlight: { ranges: [{ paragraphId: "p3", start: 254, end: 312 }] },
          question: {
            prompt: "공공 저널리즘이 추구하는 두 가지 가치로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "시민의 참여를 이끌어 내면서도 보도의 객관성을 지키는 것이다." },
              { id: "B", text: "뉴스의 재미와 광고 수입을 동시에 높이는 것이다." },
              { id: "C", text: "기자의 자유와 정치인과의 친밀함을 함께 추구하는 것이다." },
              { id: "D", text: "빠른 보도와 짧은 기사 분량을 동시에 지향하는 것이다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p3 문장7: [313,380]
        {
          stepId: "s22",
          highlight: { ranges: [{ paragraphId: "p3", start: 313, end: 380 }] },
          question: {
            prompt: "이 새로운 뉴스 문화가 보여 주는 바로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "시민이 뉴스 소비자가 아니라 사회 문제 해결의 참여자가 될 수 있다는 것이다." },
              { id: "B", text: "시민은 뉴스를 보기만 하고 문제 해결에는 참여할 수 없다는 것이다." },
              { id: "C", text: "기자만이 사회 문제를 해결할 수 있는 유일한 사람이라는 것이다." },
              { id: "D", text: "뉴스 문화는 앞으로 사라지게 될 것이라는 것이다." }
            ],
            answerId: "A",
            scoring
          }
        },
        // p3 문단 중심내용
        {
          stepId: "s23",
          highlight: { ranges: [{ paragraphId: "p3", start: 0, end: 380 }] },
          question: {
            prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "공공 저널리즘은 비판에 대해 과학적 조사로 객관성을 보완하며 시민 참여를 이끈다." },
              { id: "B", text: "공공 저널리즘은 비판을 받아서 결국 사라지게 되었다." },
              { id: "C", text: "기자가 중립을 유지하려면 시민과 만나지 않는 것이 가장 좋다." },
              { id: "D", text: "과학적인 조사 방법은 뉴스 보도에는 적합하지 않다." }
            ],
            answerId: "A",
            scoring
          }
        }
      ]
    },
    recall: {
      cards: [
        { id: "c1", text: "뉴스는 사회의 여러 일을 알려 주는 중요한 역할을 한다." },
        { id: "c2", text: "과거 뉴스는 정치인이나 큰 기업 이야기를 주로 다루어 시민의 관심이 줄었다." },
        { id: "c3", text: "이 문제를 해결하려고 시민의 일상 문제를 중심에 놓는 공공 저널리즘이 등장했다." },
        { id: "c4", text: "공공 저널리즘에서 기자는 설문 조사나 주민 회의를 통해 시민의 목소리를 모은다." },
        { id: "c5", text: "전문가와 주민이 함께 모여 해결 방안을 논의하는 토론회를 열기도 한다." },
        { id: "c6", text: "논의 결과를 보도하면 더 많은 시민이 해당 문제에 관심을 갖게 된다." },
        { id: "c7", text: "기자가 시민과 가까워지면 중립성을 잃을 수 있다는 비판도 존재한다." },
        { id: "c8", text: "과학적 조사 방법으로 객관성을 보완하며 시민 참여와 균형을 함께 추구한다." }
      ],
      correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
      seedPenalty: 1
    },
    confirm: {
      questions: [
        {
          id: "q1",
          prompt: "시민의 일상 문제를 뉴스 중심 주제로 삼는 보도 방식의 이름은 무엇인가요?",
          answerText: "공공 저널리즘",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p1", start: 221, end: 228 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q2",
          prompt: "기자가 시민의 의견을 파악하기 위해 활용하는 조사 방법은 무엇인가요?",
          answerText: "설문 조사",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p2", start: 83, end: 88 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q3",
          prompt: "기자가 시민과 너무 가까이 지내면 잃을 수 있다고 우려되는 것은 무엇인가요?",
          answerText: "중립적인 시각",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p3", start: 52, end: 59 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q4",
          prompt: "전문가와 주민이 해결 방안을 논의하기 위해 마련하는 자리는 무엇인가요?",
          answerText: "토론회",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p2", start: 173, end: 176 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q5",
          prompt: "과학적 조사를 통해 유지하려고 노력하는 보도의 성질은 무엇인가요?",
          answerText: "객관성",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p3", start: 238, end: 241 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q6",
          prompt: "공공 저널리즘이 다루는 동네 문제의 예로 나온 안전 관련 주제는 무엇인가요?",
          answerText: "교통 안전",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p1", start: 308, end: 313 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q7",
          prompt: "주민과 함께 해결 방안을 논의한다고 나온 사람은 누구인가요?",
          answerText: "전문가",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p2", start: 144, end: 147 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        }
      ]
    }
  }
};

// 검증
const allText = content.payload.passage.paragraphs.map(p => p.text).join('');
const charCount = content.payload.passage.paragraphs.reduce((sum, p) => sum + p.text.length, 0);
const intensiveCount = content.payload.intensive.timeline.length;
const recallCount = content.payload.recall.cards.length;
const confirmCount = content.payload.confirm.questions.length;

console.log("=== 검증 ===");
console.log(`지문 총 길이: ${charCount}자 (목표: 1050~1150)`);
console.log(`정독 steps: ${intensiveCount}`);
console.log(`복기 cards: ${recallCount} (목표: 8)`);
console.log(`확인 questions: ${confirmCount} (목표: 5~10)`);

// ranges 유효성 검사
let rangeErrors = 0;
content.payload.intensive.timeline.forEach(step => {
  step.highlight.ranges.forEach(r => {
    const para = content.payload.passage.paragraphs.find(p => p.id === r.paragraphId);
    if (!para) { console.log(`ERROR: ${step.stepId} - paragraph ${r.paragraphId} not found`); rangeErrors++; return; }
    if (r.start < 0 || r.end > para.text.length || r.start >= r.end) {
      console.log(`ERROR: ${step.stepId} - invalid range [${r.start}, ${r.end}] for ${r.paragraphId} (len=${para.text.length})`);
      rangeErrors++;
    }
  });
});

content.payload.confirm.questions.forEach(q => {
  q.answerRanges.forEach(r => {
    const para = content.payload.passage.paragraphs.find(p => p.id === r.paragraphId);
    if (!para) { console.log(`ERROR: ${q.id} - paragraph ${r.paragraphId} not found`); rangeErrors++; return; }
    const actual = para.text.substring(r.start, r.end);
    if (actual !== q.answerText) {
      console.log(`ERROR: ${q.id} - expected "${q.answerText}" but got "${actual}" at [${r.start}, ${r.end}]`);
      rangeErrors++;
    }
  });
});

console.log(`Range 오류: ${rangeErrors}건`);

if (charCount >= 1050 && charCount <= 1150 && recallCount === 8 && confirmCount >= 5 && rangeErrors === 0) {
  console.log("검증 통과!");

  // static JSON 파일 저장
  const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell1', '001.json');
  fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf-8');
  console.log(`저장: ${staticPath}`);

  // 배치 JSON 업데이트
  const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell1.json');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  batch.items[0] = {
    content_type: "DAILY_READING",
    level_id: "RUSSELL_1",
    area: "READING",
    sub_area: "NONFICTION",
    day_index: 1,
    module_key: "reading_training",
    schema_version: "1.0",
    content: content
  };
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf-8');
  console.log(`배치 업데이트: ${batchPath}`);
} else {
  console.log("검증 실패! 파일을 저장하지 않습니다.");
}
