// 러셀2 Day 11 비문학 - 일일독해 콘텐츠 생성
const fs = require('fs');
const path = require('path');

// ── 지문 (비문학: 인공지능과 딥러닝의 원리) ──
const p1 = "인공지능은 인간의 지적 능력을 컴퓨터로 구현하는 기술을 통칭한다. 초기 인공지능은 '만약 A이면 B를 수행하라'는 식의 규칙을 사람이 직접 입력하는 방식이었다. 이를 전문가 시스템이라 부르며, 의료 진단이나 체스 게임 등 제한된 영역에서 성과를 거두었다. 그러나 현실 세계의 문제는 규칙만으로 다루기에 경우의 수가 너무 많았고, 사람이 일일이 규칙을 작성하는 데도 한계가 있었다. 이러한 한계를 극복하고자 등장한 것이 기계 학습이다. 기계 학습은 데이터를 통해 컴퓨터가 스스로 패턴을 찾아내도록 하는 방법으로, 규칙을 사람이 정해 주는 대신 데이터에서 규칙이 자동으로 도출된다는 점에서 기존 방식과 근본적으로 다르다.";
const p2 = "기계 학습의 여러 기법 가운데 최근 가장 주목받는 것이 딥러닝이다. 딥러닝은 인간의 뇌 신경망을 모방한 인공 신경망을 여러 층으로 쌓아 올린 구조를 사용한다. 각 층의 인공 뉴런은 입력 값에 가중치를 곱한 뒤 활성화 함수를 거쳐 다음 층으로 신호를 전달한다. 층이 깊어질수록 단순한 특징에서 복잡한 특징으로 점차 추상화가 이루어지는데, 예컨대 이미지 인식에서 첫 번째 층은 선과 모서리를, 중간 층은 눈이나 코 같은 부분을, 마지막 층은 전체 얼굴을 인식하는 식이다. 이처럼 층을 깊게 쌓는다는 뜻에서 '딥(deep)'러닝이라는 이름이 붙었다.";
const p3 = "딥러닝 모델을 학습시키려면 대량의 데이터와 이를 처리할 연산 능력이 필요하다. 학습 과정에서 모델은 주어진 데이터에 대해 예측 값을 내놓고, 실제 정답과 비교하여 오차를 계산한다. 이 오차를 줄이기 위해 가중치를 조금씩 수정하는 과정을 역전파라고 하며, 이를 수천에서 수만 번 반복하면서 모델의 정확도가 높아진다. 다만 데이터가 부족하거나 편향되어 있으면 모델이 잘못된 패턴을 학습할 수 있고, 학습 데이터에만 지나치게 맞추어져 새로운 데이터에 대한 예측력이 떨어지는 과적합 현상이 생기기도 한다. 따라서 양질의 데이터를 확보하고 적절한 정규화 기법을 적용하는 것이 딥러닝 성능을 좌우하는 핵심 요소이다.";
const p4 = "딥러닝은 이미지 인식, 자연어 처리, 음성 인식 등 다양한 분야에서 기존 기술의 한계를 뛰어넘는 성과를 내고 있다. 자율 주행 자동차는 카메라와 센서로 수집한 이미지를 딥러닝으로 분석하여 도로 위 상황을 실시간으로 판단하며, 번역 서비스는 문장의 맥락을 파악해 자연스러운 번역을 제공한다. 그러나 딥러닝 모델은 내부 작동 과정이 복잡하여 왜 특정 결론에 이르렀는지 설명하기 어렵다는 한계도 안고 있다. 이른바 '블랙 박스' 문제로 불리는 이 한계를 해결하기 위해, 최근에는 모델의 판단 근거를 사람이 이해할 수 있는 형태로 제시하는 설명 가능한 인공지능 연구가 활발히 진행되고 있다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
  { id: "p4", text: p4 }
];

// 글자 수 확인
const totalLen = p1.length + p2.length + p3.length + p4.length;
console.log(`지문 총 글자 수: ${totalLen}`);
console.log(`p1: ${p1.length}, p2: ${p2.length}, p3: ${p3.length}, p4: ${p4.length}`);

// ── 정독 타임라인 ──
const timeline = [
  {
    stepId: "s1",
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: 30 }] },
    question: {
      prompt: "첫 문장에서 '인공지능'이 뜻하는 바로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "인간의 지적 능력을 컴퓨터로 구현하는 기술을 통칭한다." },
        { id: "B", text: "컴퓨터의 하드웨어를 개선하여 속도를 높이는 기술이다." },
        { id: "C", text: "인간이 직접 모든 판단을 내리도록 돕는 보조 장치이다." },
        { id: "D", text: "데이터를 저장하고 전송하는 통신 기술을 통칭한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s2",
    highlight: { ranges: [{ paragraphId: "p1", start: 30, end: 82 }] },
    question: {
      prompt: "둘째 문장이 설명하는 초기 인공지능의 방식으로 알맞은 것은?",
      choices: [
        { id: "A", text: "'만약 A이면 B를 수행하라'는 규칙을 사람이 직접 입력하는 방식이었다." },
        { id: "B", text: "데이터를 대량으로 입력하면 컴퓨터가 스스로 규칙을 만드는 방식이었다." },
        { id: "C", text: "인공 신경망을 여러 층으로 쌓아 패턴을 학습하는 방식이었다." },
        { id: "D", text: "컴퓨터가 인터넷에서 정보를 검색하여 답을 찾는 방식이었다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s3",
    highlight: { ranges: [{ paragraphId: "p1", start: 82, end: 129 }] },
    question: {
      prompt: "셋째 문장이 소개하는 '전문가 시스템'의 성과 범위로 알맞은 것은?",
      choices: [
        { id: "A", text: "의료 진단이나 체스 게임 등 제한된 영역에서 성과를 거두었다." },
        { id: "B", text: "모든 분야에서 인간을 뛰어넘는 판단력을 보여 주었다." },
        { id: "C", text: "예술 창작과 문학 번역 분야에서만 성과를 거두었다." },
        { id: "D", text: "데이터 저장에만 활용되었을 뿐 판단 기능은 없었다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s4",
    highlight: { ranges: [{ paragraphId: "p1", start: 129, end: 198 }] },
    question: {
      prompt: "넷째~다섯째 문장이 지적하는 규칙 기반 방식의 한계로 알맞은 것은?",
      choices: [
        { id: "A", text: "경우의 수가 너무 많고 사람이 일일이 규칙을 작성하기 어려웠다." },
        { id: "B", text: "컴퓨터의 저장 용량이 부족하여 규칙을 저장할 수 없었다." },
        { id: "C", text: "규칙이 너무 단순해서 체스 게임조차 할 수 없었다." },
        { id: "D", text: "규칙을 입력할 프로그래밍 언어가 존재하지 않았다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s5",
    highlight: { ranges: [{ paragraphId: "p1", start: 198, end: 307 }] },
    question: {
      prompt: "기계 학습이 기존 방식과 '근본적으로 다른' 점으로 알맞은 것은?",
      choices: [
        { id: "A", text: "규칙을 사람이 정하지 않고 데이터에서 자동으로 도출된다." },
        { id: "B", text: "규칙을 사람이 정해 주되 더 많은 규칙을 입력한다." },
        { id: "C", text: "데이터 없이 컴퓨터가 스스로 규칙을 상상한다." },
        { id: "D", text: "인간의 뇌를 직접 모방한 하드웨어를 사용한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s6",
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: 307 }] },
    question: {
      prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "규칙 기반 인공지능의 한계를 넘어 데이터에서 패턴을 찾는 기계 학습이 등장했다." },
        { id: "B", text: "전문가 시스템은 모든 분야에서 완벽한 성과를 거두었다." },
        { id: "C", text: "인공지능은 데이터 없이도 작동할 수 있는 기술이다." },
        { id: "D", text: "기계 학습과 전문가 시스템은 원리가 완전히 동일하다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s7",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: 34 }] },
    question: {
      prompt: "첫 문장이 제시하는 딥러닝의 위상으로 알맞은 것은?",
      choices: [
        { id: "A", text: "기계 학습의 여러 기법 가운데 최근 가장 주목받는 것이다." },
        { id: "B", text: "기계 학습과는 전혀 관련 없는 별도의 기술이다." },
        { id: "C", text: "과거에는 주목받았으나 현재는 사용되지 않는 기법이다." },
        { id: "D", text: "전문가 시스템을 대체한 규칙 기반 기법이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s8",
    highlight: { ranges: [{ paragraphId: "p2", start: 34, end: 79 }] },
    question: {
      prompt: "둘째 문장이 설명하는 딥러닝의 구조적 특징으로 알맞은 것은?",
      choices: [
        { id: "A", text: "인간의 뇌 신경망을 모방한 인공 신경망을 여러 층으로 쌓은 구조이다." },
        { id: "B", text: "규칙을 한 층에 모두 저장하는 단일 층 구조이다." },
        { id: "C", text: "데이터를 입력하지 않고 스스로 학습하는 자율 구조이다." },
        { id: "D", text: "인간의 근육 운동을 모방한 로봇 팔 구조이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s9",
    highlight: { ranges: [{ paragraphId: "p2", start: 79, end: 132 }] },
    question: {
      prompt: "셋째 문장이 설명하는 인공 뉴런의 작동 과정으로 알맞은 것은?",
      choices: [
        { id: "A", text: "입력 값에 가중치를 곱한 뒤 활성화 함수를 거쳐 다음 층으로 신호를 전달한다." },
        { id: "B", text: "입력 값을 그대로 저장한 뒤 마지막 층에서 한꺼번에 출력한다." },
        { id: "C", text: "모든 층의 뉴런이 동시에 같은 값을 출력한다." },
        { id: "D", text: "입력 값을 무작위로 섞은 뒤 이전 층으로 되돌려 보낸다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s10",
    highlight: { ranges: [{ paragraphId: "p2", start: 132, end: 248 }] },
    question: {
      prompt: "넷째 문장이 이미지 인식을 예로 들어 설명하는 내용으로 알맞은 것은?",
      choices: [
        { id: "A", text: "층이 깊어질수록 단순한 특징에서 복잡한 특징으로 추상화가 이루어진다." },
        { id: "B", text: "층이 깊어질수록 복잡한 특징에서 단순한 특징으로 분해된다." },
        { id: "C", text: "모든 층이 같은 수준의 특징만 반복하여 처리한다." },
        { id: "D", text: "첫 번째 층에서 이미 전체 얼굴을 인식하고 나머지 층은 필요 없다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s11",
    highlight: { ranges: [{ paragraphId: "p2", start: 248, end: 282 }] },
    question: {
      prompt: "마지막 문장이 '딥(deep)'이라는 이름이 붙은 까닭으로 설명하는 것은?",
      choices: [
        { id: "A", text: "층을 깊게 쌓는다는 뜻에서 붙은 이름이다." },
        { id: "B", text: "데이터를 깊이 저장한다는 뜻에서 붙은 이름이다." },
        { id: "C", text: "인간의 심리를 깊이 분석한다는 뜻에서 붙은 이름이다." },
        { id: "D", text: "규칙을 깊이 있게 작성한다는 뜻에서 붙은 이름이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s12",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: 282 }] },
    question: {
      prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "딥러닝은 인공 신경망을 여러 층으로 쌓아 단순→복잡 특징을 추상화하는 구조이다." },
        { id: "B", text: "딥러닝은 규칙을 사람이 직접 입력하는 전문가 시스템이다." },
        { id: "C", text: "딥러닝은 단일 층으로 이루어진 단순한 모델이다." },
        { id: "D", text: "딥러닝은 데이터 없이 작동하는 자율 시스템이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s13",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: 41 }] },
    question: {
      prompt: "첫 문장이 제시하는 딥러닝 학습의 두 가지 필요 조건으로 알맞은 것은?",
      choices: [
        { id: "A", text: "대량의 데이터와 이를 처리할 연산 능력이다." },
        { id: "B", text: "소량의 규칙과 단순한 저장 장치이다." },
        { id: "C", text: "전문가의 판단과 수작업 입력이다." },
        { id: "D", text: "인터넷 연결과 대형 화면이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s14",
    highlight: { ranges: [{ paragraphId: "p3", start: 41, end: 99 }] },
    question: {
      prompt: "둘째 문장이 설명하는 학습 과정의 핵심 절차로 알맞은 것은?",
      choices: [
        { id: "A", text: "예측 값을 내놓고 실제 정답과 비교하여 오차를 계산한다." },
        { id: "B", text: "정답을 미리 알려 주어 오차가 없도록 한다." },
        { id: "C", text: "데이터를 삭제하면서 모델을 단순화한다." },
        { id: "D", text: "모든 가중치를 한 번에 최적 값으로 설정한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s15",
    highlight: { ranges: [{ paragraphId: "p3", start: 99, end: 170 }] },
    question: {
      prompt: "셋째 문장이 설명하는 '역전파'의 의미로 알맞은 것은?",
      choices: [
        { id: "A", text: "오차를 줄이기 위해 가중치를 조금씩 수정하는 과정을 반복하는 것이다." },
        { id: "B", text: "데이터를 처음부터 다시 입력하여 새로운 모델을 만드는 것이다." },
        { id: "C", text: "학습을 중단하고 모델을 초기 상태로 되돌리는 것이다." },
        { id: "D", text: "오차가 클수록 가중치를 크게 늘리는 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s16",
    highlight: { ranges: [{ paragraphId: "p3", start: 170, end: 280 }] },
    question: {
      prompt: "넷째 문장이 경고하는 '과적합 현상'의 원인과 결과로 알맞은 것은?",
      choices: [
        { id: "A", text: "학습 데이터에만 지나치게 맞추어져 새로운 데이터에 대한 예측력이 떨어진다." },
        { id: "B", text: "데이터가 너무 많아 모델이 모든 상황에 완벽히 대응한다." },
        { id: "C", text: "가중치가 모두 동일해져 어떤 입력에도 같은 결과를 낸다." },
        { id: "D", text: "연산 속도가 빨라져 정확도가 무한히 높아진다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s17",
    highlight: { ranges: [{ paragraphId: "p3", start: 280, end: 333 }] },
    question: {
      prompt: "마지막 문장이 제시하는 딥러닝 성능의 핵심 요소로 알맞은 것은?",
      choices: [
        { id: "A", text: "양질의 데이터 확보와 적절한 정규화 기법 적용이다." },
        { id: "B", text: "규칙을 사람이 더 많이 작성하는 것이다." },
        { id: "C", text: "연산 장치의 가격을 낮추는 것이다." },
        { id: "D", text: "모델의 층 수를 최소한으로 줄이는 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s18",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: 333 }] },
    question: {
      prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "딥러닝은 역전파로 가중치를 반복 수정하며 학습하되, 데이터 품질이 성능을 좌우한다." },
        { id: "B", text: "딥러닝은 데이터 없이 가중치를 설정하므로 학습 과정이 불필요하다." },
        { id: "C", text: "역전파는 오차를 늘리는 과정이므로 딥러닝에 해롭다." },
        { id: "D", text: "과적합은 모든 딥러닝 모델에서 반드시 발생하여 피할 수 없다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s19",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: 48 }] },
    question: {
      prompt: "첫 문장이 말하는 딥러닝의 활용 분야로 알맞은 것은?",
      choices: [
        { id: "A", text: "이미지 인식, 자연어 처리, 음성 인식 등 다양한 분야이다." },
        { id: "B", text: "체스 게임 한 가지 분야에서만 활용된다." },
        { id: "C", text: "데이터 저장과 전송 분야에서만 활용된다." },
        { id: "D", text: "아직 실험 단계이므로 실제 활용 사례가 없다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s20",
    highlight: { ranges: [{ paragraphId: "p4", start: 48, end: 156 }] },
    question: {
      prompt: "둘째 문장이 제시하는 자율 주행과 번역의 사례로 알맞은 것은?",
      choices: [
        { id: "A", text: "자율 주행차는 이미지를 분석하고, 번역 서비스는 문장 맥락을 파악한다." },
        { id: "B", text: "자율 주행차는 규칙만으로 운행하고, 번역은 단어를 일대일로 치환한다." },
        { id: "C", text: "자율 주행과 번역 모두 전문가 시스템만으로 작동한다." },
        { id: "D", text: "자율 주행차는 도로 사진을 저장만 하고 판단은 하지 않는다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s21",
    highlight: { ranges: [{ paragraphId: "p4", start: 156, end: 216 }] },
    question: {
      prompt: "셋째 문장이 지적하는 딥러닝의 한계로 알맞은 것은?",
      choices: [
        { id: "A", text: "내부 작동 과정이 복잡하여 특정 결론에 이른 이유를 설명하기 어렵다." },
        { id: "B", text: "정확도가 너무 낮아 실용적으로 쓸 수 없다." },
        { id: "C", text: "모델의 크기가 작아 복잡한 문제를 풀 수 없다." },
        { id: "D", text: "학습에 데이터가 필요하지 않아 신뢰성이 낮다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s22",
    highlight: { ranges: [{ paragraphId: "p4", start: 216, end: 310 }] },
    question: {
      prompt: "마지막 문장이 소개하는 '설명 가능한 인공지능' 연구의 목표로 알맞은 것은?",
      choices: [
        { id: "A", text: "모델의 판단 근거를 사람이 이해할 수 있는 형태로 제시하는 것이다." },
        { id: "B", text: "모델의 크기를 줄여 빠르게 작동하도록 하는 것이다." },
        { id: "C", text: "모델의 정확도를 낮추어 오류를 없애는 것이다." },
        { id: "D", text: "딥러닝을 폐기하고 전문가 시스템으로 복귀하는 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s23",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: 310 }] },
    question: {
      prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "딥러닝은 다양한 분야에서 성과를 내지만 블랙 박스 문제라는 한계가 있다." },
        { id: "B", text: "딥러닝은 자율 주행에만 쓰이고 다른 분야에는 적용되지 않는다." },
        { id: "C", text: "설명 가능한 인공지능은 이미 모든 문제를 해결했다." },
        { id: "D", text: "딥러닝의 블랙 박스 문제는 해결할 필요가 없다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  }
];

// ── 복기 카드 (정확히 8장) ──
const recall = {
  cards: [
    { id: "c1", text: "초기 인공지능은 규칙을 사람이 직접 입력하는 전문가 시스템이었다." },
    { id: "c2", text: "규칙 기반의 한계를 넘어 데이터에서 패턴을 찾는 기계 학습이 등장했다." },
    { id: "c3", text: "딥러닝은 뇌 신경망을 모방한 인공 신경망을 여러 층으로 쌓은 구조이다." },
    { id: "c4", text: "각 층은 단순한 특징에서 복잡한 특징으로 점차 추상화를 이룬다." },
    { id: "c5", text: "학습 시 역전파를 통해 가중치를 반복 수정하며 정확도를 높인다." },
    { id: "c6", text: "데이터가 부족하거나 편향되면 과적합이 생겨 예측력이 떨어진다." },
    { id: "c7", text: "이미지 인식, 자연어 처리, 자율 주행 등 다양한 분야에서 성과를 낸다." },
    { id: "c8", text: "블랙 박스 문제를 해결하기 위해 설명 가능한 인공지능 연구가 진행 중이다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// ── 확인 문항 (7문항) ──
// confirm에서 answerRanges를 정확히 지문 텍스트에 맞추기
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "지문에서 '전문가 시스템'이라는 표현을 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p1", start: 93, end: 100 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "지문에서 '기계 학습'이라는 표현을 첫째 문단에서 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p1", start: 234, end: 239 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "지문에서 '인공 신경망'이라는 표현을 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p2", start: 58, end: 64 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "지문에서 '역전파'라는 용어를 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p3", start: 132, end: 135 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "지문에서 '과적합'이라는 용어를 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p3", start: 262, end: 265 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "지문에서 '블랙 박스'라는 표현을 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p4", start: 230, end: 235 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "지문에서 '설명 가능한 인공지능'이라는 표현을 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p4", start: 298, end: 309 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ]
};

// ── 최종 JSON ──
const content = {
  contentId: "dr-r2-011",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 2) Day 11 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_2",
  schoolGradeRange: { min: 8, max: 9 },
  area: "READING",
  subArea: "NONFICTION",
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

// answerRanges 검증
function verifyRanges(content) {
  const pMap = {};
  for (const p of content.payload.passage.paragraphs) {
    pMap[p.id] = p.text;
  }

  let errors = 0;

  // confirm 검증
  for (const q of content.payload.confirm.questions) {
    for (const r of q.answerRanges) {
      const text = pMap[r.paragraphId];
      if (!text) { console.error(`없는 문단 ID: ${r.paragraphId}`); errors++; continue; }
      const slice = text.substring(r.start, r.end);
      console.log(`[확인 ${q.id}] "${q.prompt}" → [${r.start}:${r.end}] = "${slice}"`);
    }
  }

  // intensive highlight 검증 (샘플)
  for (const step of content.payload.intensive.timeline) {
    for (const r of step.highlight.ranges) {
      const text = pMap[r.paragraphId];
      if (r.end > text.length) {
        console.error(`[정독 ${step.stepId}] 범위 초과: ${r.paragraphId}[${r.start}:${r.end}], 실제길이=${text.length}`);
        errors++;
      }
    }
  }

  if (errors === 0) console.log('\n✅ 모든 범위 검증 통과');
  else console.error(`\n❌ ${errors}개 오류 발견`);

  return errors;
}

const errs = verifyRanges(content);

// 파일 쓰기
const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell2');
const staticPath = path.join(staticDir, '011.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\nstatic 파일 생성: ${staticPath}`);

// 배치 파일 아이템
const batchItem = {
  content_type: "DAILY_READING",
  level_id: "RUSSELL_2",
  area: "READING",
  sub_area: "NONFICTION",
  day_index: 11,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};

// 배치 파일 업데이트
const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell2.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

// Day 11 아이템 찾아서 교체 또는 추가
const idx = batch.items.findIndex(i => i.day_index === 11 && i.level_id === "RUSSELL_2");
if (idx >= 0) {
  batch.items[idx] = batchItem;
  console.log(`배치 파일 Day 11 교체 (인덱스 ${idx})`);
} else {
  batch.items.push(batchItem);
  console.log('배치 파일에 Day 11 추가');
}

fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log(`배치 파일 갱신: ${batchPath}`);

if (errs > 0) process.exit(1);
