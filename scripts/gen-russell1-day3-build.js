// 러셀1 Day 3 비문학 - "사람의 다섯 가지 기본 욕구" 전체 JSON 생성
const fs = require('fs');
const path = require('path');

const p1 = "사람은 누구나 마음속에 여러 가지 욕구를 가지고 살아간다. 심리학에서는 이러한 인간의 기본 욕구를 크게 다섯 가지로 나누어 설명한다. 첫째는 안전의 욕구이다. 이것은 건강하게 오래 살고 싶고 위험하거나 불안한 상황에서 벗어나고 싶어 하는 마음을 가리킨다. 둘째는 사랑의 욕구이다. 다른 사람과 친하게 지내고 함께 나누며 서로 도움을 주고받고 싶어 하는 마음이 여기에 해당한다. 셋째는 성취의 욕구로, 공부나 운동 등을 잘해내서 주변 사람들에게 인정받고 싶어 하는 마음이다. 넷째는 자유의 욕구인데, 누구에게도 얽매이지 않고 자기가 원하는 대로 자유롭게 행동하고 싶어 하는 마음이다. 다섯째는 즐거움의 욕구이다. 새로운 것을 배우거나 다양한 놀이를 통해 재미를 느끼고 싶어 하는 것이 바로 이 욕구이다.";

const p2 = "이 다섯 가지 욕구는 사람마다 그 강도가 서로 다르게 나타난다. 예를 들어 안전의 욕구가 강한 사람은 건강 관리와 저축을 무엇보다 중요하게 여기는 편이다. 사랑의 욕구가 강한 사람은 주변 친구를 잘 돕지만, 상대방에게서도 똑같이 사랑을 받고 싶어 하기 때문에 인간관계에서 힘들어하기도 한다. 성취의 욕구가 강한 사람은 자기주장이 뚜렷하고 경쟁에서 이기려는 의지가 강하다. 자유의 욕구가 강한 사람은 혼자 하는 일을 좋아하며 다른 사람과 적당한 거리를 유지하는 것을 편하게 느낀다. 즐거움의 욕구가 강한 사람은 호기심이 많고 다양한 취미 생활을 즐기며 언제나 긍정적인 태도를 보인다.";

const p3 = "그런데 욕구의 강도 차이 때문에 사람들은 마음속 갈등을 겪기도 한다. 예를 들어 사랑의 욕구가 강한 사람은 다른 사람의 부탁을 쉽게 거절하지 못해 괴로워할 수 있다. 이런 경우에는 성취의 욕구를 조금 키워서 자기 의견을 분명하게 표현하는 연습을 하면 도움이 된다. 반대로 성취의 욕구와 자유의 욕구가 둘 다 강한 사람은 자기 뜻만 내세우다가 주변 사람들과 자주 부딪히기 쉽다. 이때는 성취의 욕구를 적절히 조절하여 다른 사람의 입장도 헤아려 보는 태도가 필요하다. 이처럼 자신의 욕구를 잘 살펴보고 지나치게 강한 욕구는 조절하며 약한 욕구는 조금씩 키워 나가는 것이 마음의 균형을 유지하는 비결이다.";

const scoring = { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true };

// 문장 경계 (위에서 계산한 결과):
// p1: 10문장, p2: 6문장, p3: 6문장 = 22문장 + 3문단중심 = 25 steps

const content = {
  contentId: "dr-r1-003",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 1) Day 3 비문학",
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
        // === p1 ===
        // s1: [0,32]
        {
          stepId: "s1",
          highlight: { ranges: [{ paragraphId: "p1", start: 0, end: 32 }] },
          question: {
            prompt: "이 문장에서 알 수 있는 내용으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "사람은 누구나 마음속에 여러 가지 욕구를 갖고 있다." },
              { id: "B", text: "욕구는 일부 특별한 사람만 가지고 있는 것이다." },
              { id: "C", text: "사람은 욕구 없이도 충분히 살아갈 수 있다." },
              { id: "D", text: "욕구는 나이가 들면 모두 사라진다." }
            ],
            answerId: "A", scoring
          }
        },
        // s2: [33,74]
        {
          stepId: "s2",
          highlight: { ranges: [{ paragraphId: "p1", start: 33, end: 74 }] },
          question: {
            prompt: "심리학에서 인간의 기본 욕구를 나누는 수로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "다섯 가지로 나누어 설명한다." },
              { id: "B", text: "세 가지로 나누어 설명한다." },
              { id: "C", text: "일곱 가지로 나누어 설명한다." },
              { id: "D", text: "열 가지로 나누어 설명한다." }
            ],
            answerId: "A", scoring
          }
        },
        // s3: [75,88]
        {
          stepId: "s3",
          highlight: { ranges: [{ paragraphId: "p1", start: 75, end: 88 }] },
          question: {
            prompt: "첫 번째로 소개되는 욕구의 이름으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "안전의 욕구이다." },
              { id: "B", text: "사랑의 욕구이다." },
              { id: "C", text: "성취의 욕구이다." },
              { id: "D", text: "자유의 욕구이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s4: [89,142]
        {
          stepId: "s4",
          highlight: { ranges: [{ paragraphId: "p1", start: 89, end: 142 }] },
          question: {
            prompt: "안전의 욕구가 뜻하는 바로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "건강하게 살고 위험하거나 불안한 상황에서 벗어나고 싶은 마음이다." },
              { id: "B", text: "많은 친구를 사귀고 인기를 얻고 싶은 마음이다." },
              { id: "C", text: "공부를 잘해서 상을 받고 싶은 마음이다." },
              { id: "D", text: "아무 규칙 없이 자유롭게 살고 싶은 마음이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s5: [143,156]
        {
          stepId: "s5",
          highlight: { ranges: [{ paragraphId: "p1", start: 143, end: 156 }] },
          question: {
            prompt: "두 번째로 소개되는 욕구의 이름으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "사랑의 욕구이다." },
              { id: "B", text: "즐거움의 욕구이다." },
              { id: "C", text: "안전의 욕구이다." },
              { id: "D", text: "성취의 욕구이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s6: [157,210]
        {
          stepId: "s6",
          highlight: { ranges: [{ paragraphId: "p1", start: 157, end: 210 }] },
          question: {
            prompt: "사랑의 욕구에 해당하는 마음으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "다른 사람과 친하게 지내고 도움을 주고받고 싶어 하는 마음이다." },
              { id: "B", text: "혼자서 조용히 지내며 다른 사람과 거리를 두고 싶은 마음이다." },
              { id: "C", text: "경쟁에서 이겨 최고가 되고 싶은 마음이다." },
              { id: "D", text: "위험을 피해 안전한 곳에 숨고 싶은 마음이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s7: [211,264]
        {
          stepId: "s7",
          highlight: { ranges: [{ paragraphId: "p1", start: 211, end: 264 }] },
          question: {
            prompt: "성취의 욕구의 뜻으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "공부나 운동 등을 잘해내서 인정받고 싶어 하는 마음이다." },
              { id: "B", text: "새로운 놀이를 찾아 재미를 느끼고 싶은 마음이다." },
              { id: "C", text: "건강하게 오래 살고 싶은 마음이다." },
              { id: "D", text: "누구에게도 간섭받고 싶지 않은 마음이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s8: [265,325]
        {
          stepId: "s8",
          highlight: { ranges: [{ paragraphId: "p1", start: 265, end: 325 }] },
          question: {
            prompt: "자유의 욕구의 뜻으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "얽매이지 않고 원하는 대로 자유롭게 행동하고 싶은 마음이다." },
              { id: "B", text: "친구들과 함께 어울려 놀고 싶은 마음이다." },
              { id: "C", text: "돈을 많이 모아 부자가 되고 싶은 마음이다." },
              { id: "D", text: "위험에서 벗어나 안전하게 살고 싶은 마음이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s9: [326,341]
        {
          stepId: "s9",
          highlight: { ranges: [{ paragraphId: "p1", start: 326, end: 341 }] },
          question: {
            prompt: "다섯 번째로 소개되는 욕구의 이름으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "즐거움의 욕구이다." },
              { id: "B", text: "안전의 욕구이다." },
              { id: "C", text: "성취의 욕구이다." },
              { id: "D", text: "사랑의 욕구이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s10: [342,392]
        {
          stepId: "s10",
          highlight: { ranges: [{ paragraphId: "p1", start: 342, end: 392 }] },
          question: {
            prompt: "즐거움의 욕구에 해당하는 것으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "새로운 것을 배우거나 놀이로 재미를 느끼고 싶어 하는 것이다." },
              { id: "B", text: "건강을 위해 규칙적인 생활을 하고 싶어 하는 것이다." },
              { id: "C", text: "다른 사람의 도움 없이 혼자 살고 싶어 하는 것이다." },
              { id: "D", text: "좋은 성적을 받아 부모님께 칭찬받고 싶어 하는 것이다." }
            ],
            answerId: "A", scoring
          }
        },
        // p1 문단 중심내용
        {
          stepId: "s11",
          highlight: { ranges: [{ paragraphId: "p1", start: 0, end: 392 }] },
          question: {
            prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "심리학에서는 인간의 기본 욕구를 안전, 사랑, 성취, 자유, 즐거움의 다섯 가지로 분류한다." },
              { id: "B", text: "사람은 욕구가 없으면 아무런 행동도 하지 않는다." },
              { id: "C", text: "다섯 가지 욕구 중 안전의 욕구가 가장 중요하다." },
              { id: "D", text: "욕구는 어른이 되면 자연히 사라지는 것이다." }
            ],
            answerId: "A", scoring
          }
        },
        // === p2 ===
        // s12: [0,35]
        {
          stepId: "s12",
          highlight: { ranges: [{ paragraphId: "p2", start: 0, end: 35 }] },
          question: {
            prompt: "다섯 가지 욕구에 대해 알 수 있는 점으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "사람마다 욕구의 강도가 서로 다르게 나타난다." },
              { id: "B", text: "모든 사람의 욕구 강도는 정확히 동일하다." },
              { id: "C", text: "욕구는 한 가지만 강하고 나머지는 모두 없다." },
              { id: "D", text: "욕구의 강도는 태어날 때 정해지면 바뀌지 않는다." }
            ],
            answerId: "A", scoring
          }
        },
        // s13: [36,86]
        {
          stepId: "s13",
          highlight: { ranges: [{ paragraphId: "p2", start: 36, end: 86 }] },
          question: {
            prompt: "안전의 욕구가 강한 사람의 특징으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "건강 관리와 저축을 무엇보다 중요하게 여기는 편이다." },
              { id: "B", text: "친구들과 어울리는 것을 가장 좋아하는 편이다." },
              { id: "C", text: "경쟁에서 이기려는 의지가 매우 강한 편이다." },
              { id: "D", text: "새로운 취미를 찾아 즐기는 것을 좋아하는 편이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s14: [87,162]
        {
          stepId: "s14",
          highlight: { ranges: [{ paragraphId: "p2", start: 87, end: 162 }] },
          question: {
            prompt: "사랑의 욕구가 강한 사람이 겪을 수 있는 어려움으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "사랑을 주는 만큼 받고 싶어 해서 인간관계에서 힘들어하기도 한다." },
              { id: "B", text: "혼자 있는 시간이 너무 많아서 외로움을 느끼곤 한다." },
              { id: "C", text: "경쟁을 싫어해서 성적이 떨어지곤 한다." },
              { id: "D", text: "새로운 취미를 시작하기 무서워서 아무것도 하지 못한다." }
            ],
            answerId: "A", scoring
          }
        },
        // s15: [163,207]
        {
          stepId: "s15",
          highlight: { ranges: [{ paragraphId: "p2", start: 163, end: 207 }] },
          question: {
            prompt: "성취의 욕구가 강한 사람의 특징으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "자기주장이 뚜렷하고 경쟁에서 이기려는 의지가 강하다." },
              { id: "B", text: "다른 사람의 의견에 항상 따르는 편이다." },
              { id: "C", text: "혼자 있는 것을 좋아하며 사람들을 피하는 편이다." },
              { id: "D", text: "건강과 안전을 가장 중요하게 생각하는 편이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s16: [208,268]
        {
          stepId: "s16",
          highlight: { ranges: [{ paragraphId: "p2", start: 208, end: 268 }] },
          question: {
            prompt: "자유의 욕구가 강한 사람의 특징으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "혼자 하는 일을 좋아하며 적당한 거리를 유지하는 것을 편하게 느낀다." },
              { id: "B", text: "항상 많은 사람과 함께 하는 것을 선호한다." },
              { id: "C", text: "규칙을 세우고 그것을 엄격히 지키는 것을 좋아한다." },
              { id: "D", text: "다른 사람의 칭찬을 받아야만 기분이 좋아진다." }
            ],
            answerId: "A", scoring
          }
        },
        // s17: [269,325]
        {
          stepId: "s17",
          highlight: { ranges: [{ paragraphId: "p2", start: 269, end: 325 }] },
          question: {
            prompt: "즐거움의 욕구가 강한 사람의 특징으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "호기심이 많고 취미 생활을 즐기며 긍정적인 태도를 보인다." },
              { id: "B", text: "위험을 피하고 조용히 집에만 있으려 한다." },
              { id: "C", text: "경쟁을 좋아하고 반드시 이겨야 한다고 생각한다." },
              { id: "D", text: "다른 사람을 돕는 일에만 시간을 쓴다." }
            ],
            answerId: "A", scoring
          }
        },
        // p2 문단 중심내용
        {
          stepId: "s18",
          highlight: { ranges: [{ paragraphId: "p2", start: 0, end: 325 }] },
          question: {
            prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "다섯 가지 욕구는 사람마다 강도가 달라 각각 다른 성격적 특징으로 나타난다." },
              { id: "B", text: "욕구가 강한 사람일수록 인간관계가 항상 좋다." },
              { id: "C", text: "다섯 가지 욕구는 모두 같은 방식으로 작용한다." },
              { id: "D", text: "안전의 욕구가 다른 모든 욕구보다 항상 더 강하다." }
            ],
            answerId: "A", scoring
          }
        },
        // === p3 ===
        // s19: [0,38]
        {
          stepId: "s19",
          highlight: { ranges: [{ paragraphId: "p3", start: 0, end: 38 }] },
          question: {
            prompt: "욕구의 강도 차이 때문에 생길 수 있는 일로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "사람들이 마음속 갈등을 겪기도 한다." },
              { id: "B", text: "사람들이 욕구를 모두 잃어버리기도 한다." },
              { id: "C", text: "사람들의 욕구가 모두 같아지기도 한다." },
              { id: "D", text: "사람들이 새로운 욕구를 만들어 내기도 한다." }
            ],
            answerId: "A", scoring
          }
        },
        // s20: [39,92]
        {
          stepId: "s20",
          highlight: { ranges: [{ paragraphId: "p3", start: 39, end: 92 }] },
          question: {
            prompt: "사랑의 욕구가 강한 사람이 겪을 수 있는 갈등의 예로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "다른 사람의 부탁을 쉽게 거절하지 못해 괴로워할 수 있다." },
              { id: "B", text: "혼자 있는 시간이 너무 많아서 심심할 수 있다." },
              { id: "C", text: "공부를 너무 열심히 해서 건강이 나빠질 수 있다." },
              { id: "D", text: "취미 활동을 너무 많이 해서 시간이 부족할 수 있다." }
            ],
            answerId: "A", scoring
          }
        },
        // s21: [93,147]
        {
          stepId: "s21",
          highlight: { ranges: [{ paragraphId: "p3", start: 93, end: 147 }] },
          question: {
            prompt: "부탁을 거절하지 못하는 사람에게 도움이 되는 방법으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "성취의 욕구를 키워서 자기 의견을 분명하게 표현하는 연습을 하는 것이다." },
              { id: "B", text: "안전의 욕구를 키워서 더 조심스럽게 행동하는 것이다." },
              { id: "C", text: "사랑의 욕구를 더 키워서 모든 부탁을 들어주는 것이다." },
              { id: "D", text: "즐거움의 욕구를 키워서 놀이에만 집중하는 것이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s22: [148,210]
        {
          stepId: "s22",
          highlight: { ranges: [{ paragraphId: "p3", start: 148, end: 210 }] },
          question: {
            prompt: "성취와 자유의 욕구가 둘 다 강한 사람이 겪기 쉬운 문제로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "자기 뜻만 내세우다가 주변 사람들과 자주 부딪히기 쉽다." },
              { id: "B", text: "너무 많은 친구를 사귀어서 시간이 부족해진다." },
              { id: "C", text: "건강에 대한 걱정이 지나쳐서 아무것도 하지 못한다." },
              { id: "D", text: "새로운 취미를 시작하지 못해 지루해진다." }
            ],
            answerId: "A", scoring
          }
        },
        // s23: [211,259]
        {
          stepId: "s23",
          highlight: { ranges: [{ paragraphId: "p3", start: 211, end: 259 }] },
          question: {
            prompt: "주변과 부딪히기 쉬운 사람에게 필요한 것으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "성취의 욕구를 적절히 조절하여 다른 사람의 입장을 헤아려 보는 태도이다." },
              { id: "B", text: "자유의 욕구를 더 키워서 모든 일을 혼자 결정하는 태도이다." },
              { id: "C", text: "안전의 욕구를 키워서 갈등 상황을 완전히 피하는 태도이다." },
              { id: "D", text: "즐거움의 욕구를 키워서 갈등을 웃음으로 넘기는 태도이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s24: [260,335]
        {
          stepId: "s24",
          highlight: { ranges: [{ paragraphId: "p3", start: 260, end: 335 }] },
          question: {
            prompt: "마음의 균형을 유지하는 비결로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "강한 욕구는 조절하고 약한 욕구는 키워 나가는 것이다." },
              { id: "B", text: "모든 욕구를 없애고 아무런 감정 없이 사는 것이다." },
              { id: "C", text: "한 가지 욕구만 극대화하고 나머지는 포기하는 것이다." },
              { id: "D", text: "다른 사람의 욕구만 채워 주는 것이다." }
            ],
            answerId: "A", scoring
          }
        },
        // p3 문단 중심내용
        {
          stepId: "s25",
          highlight: { ranges: [{ paragraphId: "p3", start: 0, end: 335 }] },
          question: {
            prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "욕구 간 갈등을 줄이려면 강한 욕구는 조절하고 약한 욕구는 키워 균형을 유지해야 한다." },
              { id: "B", text: "욕구가 강한 사람은 항상 다른 사람과 잘 지낸다." },
              { id: "C", text: "갈등이 생기면 모든 욕구를 포기하는 것이 최선이다." },
              { id: "D", text: "사랑의 욕구가 강한 사람은 갈등을 전혀 겪지 않는다." }
            ],
            answerId: "A", scoring
          }
        }
      ]
    },
    recall: {
      cards: [
        { id: "c1", text: "사람은 누구나 여러 가지 욕구를 가지고 있으며 심리학은 이를 다섯 가지로 분류한다." },
        { id: "c2", text: "안전의 욕구는 건강하게 살고 위험에서 벗어나고 싶은 마음이다." },
        { id: "c3", text: "사랑, 성취, 자유, 즐거움의 욕구는 각각 다른 마음의 필요를 나타낸다." },
        { id: "c4", text: "다섯 가지 욕구의 강도는 사람마다 달라 서로 다른 특징으로 나타난다." },
        { id: "c5", text: "예를 들어 안전의 욕구가 강하면 저축을, 즐거움이 강하면 취미를 중시한다." },
        { id: "c6", text: "욕구의 강도 차이로 거절을 못 하거나 자기 뜻만 내세우는 갈등이 생길 수 있다." },
        { id: "c7", text: "약한 욕구를 키우거나 강한 욕구를 조절하는 방법으로 갈등을 줄일 수 있다." },
        { id: "c8", text: "자신의 욕구를 살펴 균형을 유지하는 것이 마음의 건강을 지키는 비결이다." }
      ],
      correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
      seedPenalty: 1
    },
    confirm: {
      questions: [
        {
          id: "q1",
          prompt: "첫 번째로 소개된 욕구로, 건강하게 살고 위험에서 벗어나고 싶은 마음의 이름은 무엇인가요?",
          answerText: "안전의 욕구",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p1", start: 79, end: 85 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q2",
          prompt: "다른 사람과 친하게 지내고 도움을 주고받고 싶은 마음에 해당하는 욕구의 이름은 무엇인가요?",
          answerText: "사랑의 욕구",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p1", start: 147, end: 153 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q3",
          prompt: "안전의 욕구가 강한 사람이 건강 관리와 함께 중요하게 여기는 것은 무엇인가요?",
          answerText: "저축",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p2", start: 64, end: 66 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q4",
          prompt: "즐거움의 욕구가 강한 사람의 특징으로 나온, 새로운 것에 관심이 많은 성질은 무엇인가요?",
          answerText: "호기심",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p2", start: 285, end: 288 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q5",
          prompt: "욕구의 강도 차이 때문에 사람들이 마음속에서 겪는 것은 무엇인가요?",
          answerText: "갈등",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p3", start: 27, end: 29 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q6",
          prompt: "누구에게도 얽매이지 않고 자유롭게 행동하고 싶은 마음에 해당하는 욕구의 이름은 무엇인가요?",
          answerText: "자유의 욕구",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p1", start: 269, end: 275 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q7",
          prompt: "강한 욕구를 조절하고 약한 욕구를 키워 유지해야 한다고 한 마음의 상태는 무엇인가요?",
          answerText: "균형",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p3", start: 321, end: 323 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        }
      ]
    }
  }
};

// 검증
const charCount = content.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
const intensiveCount = content.payload.intensive.timeline.length;
const recallCount = content.payload.recall.cards.length;
const confirmCount = content.payload.confirm.questions.length;

console.log("=== 검증 ===");
console.log(`지문 총 길이: ${charCount}자 (목표: 1050~1150)`);
console.log(`정독 steps: ${intensiveCount}`);
console.log(`복기 cards: ${recallCount} (목표: 8)`);
console.log(`확인 questions: ${confirmCount} (목표: 5~10)`);

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

  const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell1', '003.json');
  fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf-8');
  console.log(`저장: ${staticPath}`);

  const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell1.json');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  batch.items[2] = {
    content_type: "DAILY_READING",
    level_id: "RUSSELL_1",
    area: "READING",
    sub_area: "NONFICTION",
    day_index: 3,
    module_key: "reading_training",
    schema_version: "1.0",
    content: content
  };
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf-8');
  console.log(`배치 업데이트: ${batchPath}`);
} else {
  console.log("검증 실패! 파일을 저장하지 않습니다.");
  if (charCount < 1050 || charCount > 1150) console.log(`  → 글자수 ${charCount}은 범위 밖`);
}
