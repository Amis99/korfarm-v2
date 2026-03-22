#!/usr/bin/env node
// 비트겐슈타인2 Day 36~40 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE, 홀수 Day = NONFICTION
// 목표 글자수: 1500자 ±50 (1450~1550)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-wittgenstein2.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/wittgenstein2');

// ─── 유틸리티 함수 ───
function findSentences(text) {
  const sentences = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1;
      while (next < text.length && text[next] === ' ') next++;
      start = next;
    }
  }
  if (start < text.length) sentences.push({ start, end: text.length, text: text.substring(start) });
  return sentences;
}

function findRange(paragraphs, pid, searchText) {
  const para = paragraphs.find(p => p.id === pid);
  if (!para) throw new Error(`문단 ${pid}를 찾을 수 없습니다.`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}" not found in ${pid}`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

function hashIdx(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// ─── Day 36: 문학 (LITERATURE) ── 최인훈의 「광장」에 나타난 자유의 의미 ───
function buildDay36() {
  const paragraphs = [
    {
      id: "p1",
      text: "최인훈의 장편소설 「광장」은 한국 분단문학의 시원적 작품으로, 남과 북이라는 두 체제 사이에서 개인의 자유와 이념적 선택의 문제를 정면으로 다룬다. 주인공 이명준은 남한에서 철학을 공부하는 대학생으로, 개인의 내면적 자유와 사유의 독립성을 무엇보다 중시하는 인물이다. 그러나 남한 사회에서 그가 경험하는 현실은 반공 이데올로기에 의해 획일적으로 통제되는 밀실의 공간이며, 개인의 자유로운 사유가 허용되지 않는 억압적 질서이다. 이명준의 아버지가 월북한 좌익 인사라는 사실은 그를 감시와 의심의 대상으로 만들며, 이러한 상황에서 그는 남한이 내세우는 자유민주주의가 실질적 자유를 보장하지 못하는 허울에 불과하다는 인식에 이르게 된다."
    },
    {
      id: "p2",
      text: "이명준은 남한의 밀실에서 벗어나기 위해 월북을 선택하지만, 북한에서 마주하는 현실 역시 그가 추구하던 자유와는 거리가 멀다. 북한 사회는 광장의 논리가 지배하는 공간으로, 개인의 내밀한 감정과 사적 영역이 집단의 이념 아래 철저히 종속되어 있다. 이명준은 당의 노선에 따라 행동하고 집단적 목표에 헌신할 것을 요구받으며, 그의 개인적 회의와 성찰은 사상적 불순함으로 간주될 위험에 처한다. 남한이 밀실만 있고 광장이 부재한 사회였다면, 북한은 광장만 있고 밀실이 허락되지 않는 사회인 것이다. 최인훈은 이러한 대비를 통해 남한과 북한이 서로 다른 방식으로 개인의 온전한 자유를 억압하는 구조임을 드러내며, 분단 체제 자체가 인간의 총체적 삶을 불가능하게 만드는 근본적 모순임을 제시한다."
    },
    {
      id: "p3",
      text: "소설에서 이명준이 은혜와 나누는 사랑의 관계는 밀실의 자유를 상징하는 핵심적 모티프이다. 은혜와의 관계에서 이명준은 이념과 체제의 논리로부터 벗어나 순수한 개인으로 존재할 수 있으며, 이 사적 공간에서만 그의 내면적 자유가 실현된다. 그러나 이 사랑은 북한 체제의 집단주의적 압력 앞에서 지속될 수 없으며, 은혜의 비극적 죽음은 밀실마저 허용하지 않는 전체주의적 체제의 폭력성을 극적으로 형상화한다. 이명준에게 은혜의 상실은 단순한 개인적 슬픔을 넘어, 인간이 인간답게 존재할 수 있는 마지막 공간마저 파괴되었음을 의미한다. 이 지점에서 소설은 정치적 자유와 사적 자유가 모두 보장되어야 비로소 인간의 온전한 삶이 가능하다는 주제 의식을 선명하게 드러낸다."
    },
    {
      id: "p4",
      text: "전쟁 포로가 된 이명준은 남한도 북한도 아닌 제3국행을 선택하지만, 결국 인도로 향하는 배 위에서 바다에 몸을 던져 자살한다. 이 결말은 분단 현실 속에서 어느 쪽도 개인의 자유를 온전히 보장하지 못할 때, 인간에게 남은 선택지가 얼마나 제한적인가를 비극적으로 보여 준다. 제3국이라는 선택지조차 이명준에게 실질적 대안이 될 수 없었던 것은, 그의 정체성이 분단이라는 역사적 조건으로부터 분리될 수 없기 때문이다. 최인훈은 이명준의 죽음을 통해 분단이 단순한 지리적 분리가 아니라 인간 존재 자체를 파편화하는 실존적 비극임을 역설한다. 「광장」이 오늘날에도 유효한 문학적 가치를 지니는 것은, 이 작품이 제기하는 자유의 문제가 특정 시대에 한정되지 않고 인간의 보편적 조건에 대한 근원적 질문으로 확장되기 때문이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "이명준이 남한 사회에서 자유민주주의에 대해 도달한 인식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "남한이 내세우는 자유민주주의가 실질적 자유를 보장하지 못하는 허울에 불과하다는 인식에 이르게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "최인훈이 남북한 대비를 통해 드러내는 분단 체제의 근본적 모순은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "분단 체제 자체가 인간의 총체적 삶을 불가능하게 만드는 근본적 모순임을 제시한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "은혜의 비극적 죽음이 형상화하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "밀실마저 허용하지 않는 전체주의적 체제의 폭력성을 극적으로 형상화한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "소설이 정치적 자유와 사적 자유에 대해 드러내는 주제 의식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "정치적 자유와 사적 자유가 모두 보장되어야 비로소 인간의 온전한 삶이 가능하다는 주제 의식을 선명하게 드러낸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "최인훈이 이명준의 죽음을 통해 역설하는 분단의 본질은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "분단이 단순한 지리적 분리가 아니라 인간 존재 자체를 파편화하는 실존적 비극임을 역설한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "「광장」이 오늘날에도 유효한 문학적 가치를 지니는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "자유의 문제가 특정 시대에 한정되지 않고 인간의 보편적 조건에 대한 근원적 질문으로 확장되기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(36, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 37: 비문학 (NONFICTION) ── 양자 얽힘과 비국소성의 물리학적 의미 ───
function buildDay37() {
  const paragraphs = [
    {
      id: "p1",
      text: "양자 얽힘은 두 개 이상의 입자가 하나의 양자 상태로 기술되어, 한 입자에 대한 측정이 다른 입자의 상태를 즉각적으로 결정하는 현상이다. 고전 물리학에서 두 물체의 상태는 독립적으로 기술될 수 있으며, 한 물체에 가해진 조작이 다른 물체에 영향을 미치려면 물리적 신호의 전달이 필요하다. 그러나 양자 역학에서는 얽힌 입자 쌍의 상태가 하나의 파동 함수로 통합 기술되며, 측정 이전에는 각 입자의 상태가 확정되어 있지 않다. 측정이 파동 함수를 붕괴시키면 한 입자의 상태가 결정됨과 동시에 다른 입자의 상태도 확정되는데, 이 과정은 두 입자 사이의 거리와 무관하게 일어난다. 아인슈타인은 이를 원거리에서의 으스스한 작용이라 부르며 양자 역학의 불완전성을 주장하였다."
    },
    {
      id: "p2",
      text: "아인슈타인, 포돌스키, 로젠은 1935년 발표한 논문에서 양자 역학이 물리적 실재의 완전한 기술을 제공하지 못한다고 논증하였다. 이 EPR 역설의 핵심은 국소성과 실재론이라는 두 전제에 기반한다. 국소성 원리는 한 장소에서의 측정이 멀리 떨어진 다른 장소의 물리적 상태에 즉각적 영향을 미칠 수 없다는 것이며, 실재론은 측정과 무관하게 물리적 성질이 객관적으로 존재한다는 입장이다. EPR 논증에 따르면, 얽힌 입자 쌍에서 한 입자의 측정으로 다른 입자의 상태를 예측할 수 있다면 그 상태는 측정 이전에 이미 결정되어 있어야 하며, 양자 역학이 이를 기술하지 못하는 것은 이론의 불완전성을 의미한다. 이 논증은 양자 역학에 숨은 변수가 존재할 가능성을 제기하며, 이후 물리학계의 핵심 논쟁이 되었다."
    },
    {
      id: "p3",
      text: "1964년 존 벨은 숨은 변수 이론과 양자 역학의 예측을 실험적으로 구별할 수 있는 수학적 부등식을 도출하였다. 벨의 부등식은 국소적 숨은 변수 이론이 참이라면 얽힌 입자 쌍의 측정 결과 사이의 상관관계가 특정 한계값을 넘을 수 없음을 수학적으로 증명한 것이다. 만약 실험에서 이 부등식이 위반된다면, 국소성과 실재론 가운데 적어도 하나를 포기해야 한다는 결론에 이르게 된다. 1982년 알랭 아스페의 실험을 비롯한 다수의 정밀 실험에서 벨의 부등식은 명확하게 위반되었으며, 실험 결과는 양자 역학의 예측과 정확히 일치하였다. 이로써 자연이 국소적 실재론의 틀 안에서 완전히 기술될 수 없다는 사실이 실험적으로 확립되었으며, 양자 역학의 비국소성은 물리학의 근본 원리로 인정받게 되었다."
    },
    {
      id: "p4",
      text: "양자 얽힘의 비국소성은 단순한 이론적 호기심을 넘어 현대 양자 정보 기술의 핵심 자원으로 활용되고 있다. 양자 암호 통신에서 얽힌 광자 쌍은 도청이 원리적으로 불가능한 안전한 통신 채널을 구현하는 데 사용되며, 양자 텔레포테이션에서는 얽힘을 매개로 양자 상태를 원격지로 전송하는 것이 가능하다. 양자 컴퓨팅에서 얽힘은 고전 컴퓨터로는 달성할 수 없는 병렬 계산 능력의 원천이 되며, 이를 통해 특정 문제에서 지수적 계산 속도 향상이 가능해진다. 그러나 양자 얽힘이 정보의 초광속 전달을 가능하게 하는 것은 아니라는 점을 유의해야 한다. 얽힌 입자 쌍의 측정 결과는 무작위적이며, 의미 있는 정보를 전달하기 위해서는 반드시 고전적 통신 채널이 병행되어야 하므로 상대성 이론의 인과율은 여전히 보존된다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "양자 역학에서 얽힌 입자 쌍의 상태가 측정 이전에 어떤 특성을 갖는가?",
      answerRanges: [findRange(paragraphs, "p1", "측정 이전에는 각 입자의 상태가 확정되어 있지 않다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "EPR 논증이 양자 역학에 대해 제기한 핵심 주장은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "양자 역학에 숨은 변수가 존재할 가능성을 제기하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "벨의 부등식 위반이 의미하는 결론은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "국소성과 실재론 가운데 적어도 하나를 포기해야 한다는 결론에 이르게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "아스페의 실험 결과가 확립한 물리학적 사실은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "자연이 국소적 실재론의 틀 안에서 완전히 기술될 수 없다는 사실이 실험적으로 확립되었으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "양자 컴퓨팅에서 얽힘이 제공하는 핵심 능력은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "고전 컴퓨터로는 달성할 수 없는 병렬 계산 능력의 원천이 되며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "양자 얽힘이 초광속 정보 전달을 가능하게 하지 않는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "의미 있는 정보를 전달하기 위해서는 반드시 고전적 통신 채널이 병행되어야 하므로 상대성 이론의 인과율은 여전히 보존된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(37, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 38: 문학 (LITERATURE) ── 이효석의 「메밀꽃 필 무렵」의 서정적 묘사 기법 ───
function buildDay38() {
  const paragraphs = [
    {
      id: "p1",
      text: "이효석의 단편소설 「메밀꽃 필 무렵」은 한국 근대 단편소설 가운데 서정적 완성도가 가장 높은 작품으로 평가받는다. 이 소설은 봉평 장터를 배경으로 떠돌이 장돌뱅이 허생원의 이야기를 들려주며, 달빛 아래 메밀꽃이 소금을 뿌린 듯이 피어 있는 풍경을 통해 인간의 정한과 인연의 신비를 형상화한다. 이효석의 서정적 묘사 기법의 핵심은 자연 풍경과 인물의 내면 감정을 분리하지 않고 하나의 유기적 정서로 통합하는 데 있다. 메밀꽃이 만개한 달밤의 풍경은 단순한 배경이 아니라 허생원이 과거의 연인을 회상하며 느끼는 그리움과 쓸쓸함의 정서를 구체적으로 형상화하는 객관적 상관물로 기능한다. 자연의 아름다움과 인간의 정서가 이처럼 긴밀하게 결합되어 있기에, 독자는 풍경을 읽으면서 동시에 인물의 감정을 체험하게 된다."
    },
    {
      id: "p2",
      text: "이 소설의 서술 구조에서 특히 주목할 점은 시간의 이중적 흐름이다. 현재 시점에서 허생원은 동이와 함께 봉평에서 대화 장으로 밤길을 걷고 있으며, 이 여정 중에 과거 봉평 장터에서의 물레방앗간 사건을 회상한다. 현재의 여정과 과거의 회상이 교차하면서 서사적 긴장이 형성되는데, 이는 허생원이 젊은 시절의 사랑을 추억하며 동시에 그 사랑의 결실일 수 있는 동이라는 존재를 현재 시점에서 마주하고 있기 때문이다. 이효석은 이러한 시간의 교차를 통해 과거와 현재를 단절이 아닌 연속으로 제시하며, 인연이라는 보이지 않는 실이 시간을 관통하여 인간의 삶을 엮어 나간다는 주제를 구현한다. 이러한 서술 구조는 독자에게 서사적 호기심을 유발하면서도 서정적 분위기를 훼손하지 않는 절묘한 균형을 이룬다."
    },
    {
      id: "p3",
      text: "「메밀꽃 필 무렵」에서 달빛의 이미지는 작품 전체를 관통하는 핵심적 상징 체계를 이룬다. 달빛은 메밀꽃의 흰빛을 비추어 환상적인 풍경을 만들어내며, 이 풍경은 현실의 시공간을 초월한 몽환적 분위기를 조성한다. 허생원이 젊은 시절 물레방앗간에서 성처녀와 만났던 그 밤에도 달이 밝았다는 서술은, 달빛이 과거와 현재를 잇는 기억의 매개이자 운명적 인연의 상징으로 기능하고 있음을 보여 준다. 또한 달빛 아래에서 동이의 얼굴이 성처녀를 닮았음을 발견하는 장면은, 세대를 넘어 이어지는 혈연의 끈과 삶의 순환적 리듬을 암시한다. 이효석은 달빛이라는 하나의 이미지에 미적 기능과 서사적 기능을 동시에 부여함으로써, 시와 소설의 경계를 넘나드는 독특한 서사 미학을 실현하였다."
    },
    {
      id: "p4",
      text: "이효석의 서정적 묘사 기법이 한국 소설사에서 지니는 문학사적 의의는 다층적이다. 우선 그는 1930년대 한국 소설이 사회적 현실의 재현에 치중하던 경향 속에서, 자연과 인간의 교감을 통한 서정적 서사라는 새로운 가능성을 개척하였다. 이는 소설이 반드시 사건 중심의 갈등과 해소라는 구조를 따를 필요가 없으며, 정서의 흐름 자체가 서사의 동력이 될 수 있음을 보여 준 것이다. 또한 이효석은 토속적 소재인 봉평의 장돌뱅이 삶을 향토적 정취에 머물지 않고 보편적 서정의 차원으로 끌어올렸다는 점에서 주목된다. 떠돌이 삶의 외로움, 젊은 날의 사랑에 대한 그리움, 혈연의 신비는 특정 시대와 지역을 초월하는 인간 보편의 정서이며, 이 보편성이야말로 이 작품이 시대를 넘어 독자에게 감동을 주는 근본적인 이유이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "메밀꽃이 만개한 달밤의 풍경이 소설에서 수행하는 문학적 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "허생원이 과거의 연인을 회상하며 느끼는 그리움과 쓸쓸함의 정서를 구체적으로 형상화하는 객관적 상관물로 기능한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "이효석이 시간의 교차를 통해 제시하는 주제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "인연이라는 보이지 않는 실이 시간을 관통하여 인간의 삶을 엮어 나간다는 주제를 구현한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "달빛 아래에서 동이의 얼굴이 성처녀를 닮았음을 발견하는 장면이 암시하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "세대를 넘어 이어지는 혈연의 끈과 삶의 순환적 리듬을 암시한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "이효석이 달빛 이미지를 통해 실현한 서사 미학의 특징은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "시와 소설의 경계를 넘나드는 독특한 서사 미학을 실현하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이효석의 서정적 서사가 소설의 구조에 대해 보여 준 새로운 가능성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "정서의 흐름 자체가 서사의 동력이 될 수 있음을 보여 준 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이 작품이 시대를 넘어 독자에게 감동을 주는 근본적인 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "이 보편성이야말로 이 작품이 시대를 넘어 독자에게 감동을 주는 근본적인 이유이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(38, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 39: 비문학 (NONFICTION) ── 사회적 자본 이론의 전개 ───
function buildDay39() {
  const paragraphs = [
    {
      id: "p1",
      text: "사회적 자본은 개인이나 집단이 사회적 관계 속에서 확보하는 자원으로, 신뢰, 규범, 네트워크 등 구성원 간의 관계적 속성을 포괄하는 개념이다. 물적 자본이 물리적 자산을, 인적 자본이 교육을 통해 축적된 개인의 역량을 의미한다면, 사회적 자본은 관계 그 자체가 가치를 창출하는 자원이 될 수 있다는 관점을 제시한다. 피에르 부르디외는 사회적 자본을 최초로 체계적으로 이론화한 학자로, 이를 지속적인 관계망을 통해 동원 가능한 실질적 또는 잠재적 자원의 총합으로 정의하였다. 부르디외에게 사회적 자본은 경제적 자본 및 문화적 자본과 상호 전환 가능한 것이며, 사회적 불평등을 재생산하는 기제의 일부로 기능한다."
    },
    {
      id: "p2",
      text: "제임스 콜먼은 사회적 자본의 기능적 측면을 강조하며, 이를 사회 구조의 특정 측면이 행위자의 목적 달성을 촉진하는 것으로 정의하였다. 콜먼의 관점에서 사회적 자본은 폐쇄적 네트워크에서 더 효과적으로 작동하는데, 구성원 간의 관계가 밀접하고 상호 감시가 가능한 공동체에서 신뢰와 규범의 준수가 보다 잘 유지되기 때문이다. 그는 교육 연구에서 가족과 지역 사회의 사회적 자본이 학생의 학업 성취도에 유의미한 영향을 미친다는 증거를 제시하였다. 부모와 자녀, 부모 간, 부모와 학교 간의 관계가 형성하는 사회적 자본이 풍부한 환경에서 학생의 중퇴율이 현저히 낮다는 발견은, 사회적 관계의 질이 교육적 결과에 직접 영향을 미칠 수 있음을 보여 주는 것이었다."
    },
    {
      id: "p3",
      text: "로버트 퍼트넘은 사회적 자본 이론을 공동체와 민주주의의 영역으로 확장한 학자이다. 그는 사회적 자본을 구성원 간의 상호 이익을 위한 조정과 협력을 촉진하는 네트워크, 규범, 사회적 신뢰로 정의하였다. 퍼트넘의 대표적 연구인 이탈리아 지방 정부에 관한 분석에서, 시민 참여와 자발적 결사체가 활발한 북부 이탈리아의 지방 정부가 그렇지 않은 남부보다 현저히 높은 행정 효율성을 보인다는 사실이 확인되었다. 이 연구 결과는 민주주의의 질이 제도적 설계만이 아니라 사회적 자본의 축적 수준에 의해서도 좌우된다는 중요한 함의를 지닌다. 그러나 퍼트넘의 이론에 대해서는 사회적 자본의 부정적 측면을 간과한다는 비판이 제기되는데, 폐쇄적 집단 내부의 강한 유대가 외부자에 대한 배제와 차별을 낳을 수 있기 때문이다."
    },
    {
      id: "p4",
      text: "사회적 자본 이론의 현대적 전개에서 중요한 구분은 결속형과 교량형 사회적 자본의 분류이다. 결속형 사회적 자본은 동질적 집단 내부의 강한 유대를 의미하며, 구성원에게 정서적 지지와 상호 부조를 제공한다. 반면 교량형 사회적 자본은 이질적 집단들 사이의 느슨한 연결을 뜻하며, 새로운 정보와 기회의 접근을 가능하게 하는 역할을 수행한다. 건강한 사회 발전을 위해서는 이 두 유형이 균형 있게 축적되어야 하며, 결속형 자본에만 의존할 경우 폐쇄적 집단주의로 귀결될 위험이 있고 교량형 자본만으로는 정서적 안전망이 부족해질 수 있다. 오늘날 사회적 자본 이론은 도시 계획, 공중 보건, 경제 발전 등 다양한 분야에서 정책적 함의를 제공하며, 사회적 관계의 질이 복리에 미치는 영향을 분석하는 핵심 도구로 활용되고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "부르디외가 사회적 자본을 불평등과 관련하여 파악하는 관점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "사회적 불평등을 재생산하는 기제의 일부로 기능한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "콜먼의 관점에서 사회적 자본이 폐쇄적 네트워크에서 더 효과적으로 작동하는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "구성원 간의 관계가 밀접하고 상호 감시가 가능한 공동체에서 신뢰와 규범의 준수가 보다 잘 유지되기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "퍼트넘의 이탈리아 연구 결과가 민주주의에 대해 제시하는 함의는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "민주주의의 질이 제도적 설계만이 아니라 사회적 자본의 축적 수준에 의해서도 좌우된다는 중요한 함의를 지닌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "퍼트넘의 이론에 대해 제기되는 비판의 핵심은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "폐쇄적 집단 내부의 강한 유대가 외부자에 대한 배제와 차별을 낳을 수 있기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "교량형 사회적 자본이 수행하는 핵심적 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "새로운 정보와 기회의 접근을 가능하게 하는 역할을 수행한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "결속형 사회적 자본에만 의존할 경우 발생할 수 있는 위험은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "결속형 자본에만 의존할 경우 폐쇄적 집단주의로 귀결될 위험이 있고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(39, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 40: 문학 (LITERATURE) ── 박경리의 「토지」에 나타난 역사 의식 ───
function buildDay40() {
  const paragraphs = [
    {
      id: "p1",
      text: "박경리의 대하소설 「토지」는 구한말에서 해방에 이르는 한국 근현대사의 격동기를 배경으로, 경남 하동 평사리의 최참판댁 가문과 그 주변 인물들의 삶을 통해 민족의 운명을 총체적으로 형상화한 작품이다. 이 소설에서 역사는 개인의 삶 바깥에 존재하는 추상적 배경이 아니라, 인물들의 일상과 운명을 근본적으로 규정하는 구체적 힘으로 작용한다. 최서희는 소설의 중심인물로, 일제에 의해 빼앗긴 땅을 되찾기 위해 평생을 투쟁하는데, 이 개인적 투쟁은 식민지 수탈에 맞서는 민족적 저항의 알레고리로 확장된다. 박경리는 개인의 서사와 민족의 역사를 유기적으로 결합함으로써, 역사 속의 개인이 역사적 주체로 성장해 나가는지를 보여 주며, 이것이 「토지」의 역사 의식의 출발점을 이룬다."
    },
    {
      id: "p2",
      text: "「토지」에서 토지라는 핵심 모티프는 경제적 재산을 넘어 존재론적 의미를 지닌다. 토지는 농경 사회에서 생존의 기반이자 공동체 유지의 물질적 조건이며, 동시에 세대를 넘어 전승되는 문화와 정체성의 터전이다. 일제의 토지 수탈은 단순한 경제적 약탈이 아니라 민족의 존재 기반 자체를 해체하는 폭력적 행위로 형상화되며, 최서희의 토지 회복 투쟁은 이 존재 기반을 되찾기 위한 실존적 결단으로 그려진다. 박경리는 토지를 매개로 경제, 정치, 문화, 정체성의 문제를 하나의 서사 속에 통합하며, 식민지 경험이 한국 사회의 모든 층위에 걸쳐 미친 영향을 총체적으로 드러낸다. 이러한 서사적 전략을 통해 소설은 역사를 정치적 사건의 연대기가 아닌 삶의 모든 영역을 관통하는 근원적 힘으로 형상화하는 데 성공하고 있다."
    },
    {
      id: "p3",
      text: "「토지」의 역사 의식에서 또 하나 주목할 점은 민중 인물의 형상화 방식이다. 박경리는 최참판댁으로 대표되는 양반 가문의 서사뿐 아니라, 소작농, 머슴, 떠돌이, 기생 등 다양한 사회적 계층의 인물들에게 개별적인 서사를 부여한다. 이들은 역사의 수동적 객체가 아니라 각자의 방식으로 시대의 격변에 대응하고 삶을 영위하는 능동적 존재로 그려진다. 길상이가 독립운동에 참여하는 과정이나, 봉순이가 식민지 현실 속에서 자신의 삶의 방식을 모색하는 과정은 민중이 역사의 주체로 성장해 가는 양상을 구체적으로 보여 준다. 이처럼 다양한 계층의 인물에게 균등한 서사적 비중을 부여함으로써, 박경리는 역사가 소수의 영웅이 아닌 무수한 개인들의 삶이 모여 이루어지는 것임을 형상화한다."
    },
    {
      id: "p4",
      text: "「토지」가 제시하는 역사 의식은 단선적 진보관이 아니라 순환과 재생의 세계관에 기반한다. 소설에서 자연의 계절적 순환은 인간사의 흥망성쇠와 병치되며, 몰락과 회복, 상실과 재건의 반복적 리듬이 서사의 근간을 이룬다. 최참판댁의 몰락과 최서희의 재건은 이 순환적 세계관의 핵심적 구현이며, 이는 역사가 아무리 참혹하더라도 삶은 지속되고 회복은 가능하다는 근본적 신뢰를 표현하고 있다. 또한 박경리는 한국의 역사적 경험을 보편적 인간 조건의 차원에서 서사화함으로써, 「토지」를 특정 민족의 역사 서사를 넘어 인류 보편의 문학적 성취로 승화시키고 있다. 이 작품이 한국 문학사에서 가장 중요한 대하소설로 평가받는 것은, 역사와 개인, 민족과 보편, 현실과 이상 사이의 긴장을 하나의 거대한 서사 속에 유기적으로 통합하였기 때문이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "최서희의 개인적 투쟁이 확장되는 문학적 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "식민지 수탈에 맞서는 민족적 저항의 알레고리로 확장된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "일제의 토지 수탈이 소설에서 어떤 의미로 형상화되는가?",
      answerRanges: [findRange(paragraphs, "p2", "민족의 존재 기반 자체를 해체하는 폭력적 행위로 형상화되며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "소설이 역사를 형상화하는 데 성공한 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "역사를 정치적 사건의 연대기가 아닌 삶의 모든 영역을 관통하는 근원적 힘으로 형상화하는 데 성공하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "박경리가 다양한 계층의 인물에게 균등한 서사적 비중을 부여함으로써 형상화하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "역사가 소수의 영웅이 아닌 무수한 개인들의 삶이 모여 이루어지는 것임을 형상화한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "「토지」에서 순환적 세계관이 표현하는 근본적 신뢰는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "역사가 아무리 참혹하더라도 삶은 지속되고 회복은 가능하다는 근본적 신뢰를 표현하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "「토지」가 한국 문학사에서 가장 중요한 대하소설로 평가받는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "역사와 개인, 민족과 보편, 현실과 이상 사이의 긴장을 하나의 거대한 서사 속에 유기적으로 통합하였기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(40, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  // 정독 타임라인 자동 생성
  const timeline = buildTimeline(paragraphs);
  // 복기 카드 8장
  const recall = buildRecallCards(paragraphs, 8);

  const dayStr = String(dayIndex).padStart(3, '0');
  const contentId = `dr-w2-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(비트겐슈타인 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "WITTGENSTEIN_2",
    schoolGradeRange: { min: 10, max: 11 },
    area: "READING",
    subArea,
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
      confirm: { questions: confirmQuestions }
    }
  };
}

function buildTimeline(paragraphs) {
  const timeline = [];
  let stepNum = 1;

  // 각 문단에서 문장 추출
  const paraSentMap = {};
  for (const p of paragraphs) {
    paraSentMap[p.id] = findSentences(p.text);
  }

  for (const para of paragraphs) {
    const sentences = paraSentMap[para.id];

    // 문장별 하이라이트 + 4지선다
    for (let si = 0; si < sentences.length; si++) {
      const sent = sentences[si];
      const correctText = truncate(sent.text, 80);

      // 오답: 다른 문단에서 문장 선택
      const wrongTexts = [];
      const otherParas = paragraphs.filter(p => p.id !== para.id);
      for (let oi = 0; oi < otherParas.length && wrongTexts.length < 3; oi++) {
        const opSents = paraSentMap[otherParas[oi].id];
        const idx = (si + oi) % opSents.length;
        wrongTexts.push(truncate(opSents[idx].text, 80));
      }

      const choices = shuffleChoices(correctText, wrongTexts, `s${stepNum}`);

      timeline.push({
        stepId: `s${stepNum++}`,
        highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] },
        question: {
          prompt: "하이라이트된 문장의 내용으로 알맞은 것은?",
          choices: choices.list,
          answerId: choices.answerId,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }

    // 문단 중심내용 문제
    const firstSent = sentences[0];
    const centralCorrect = truncate(firstSent.text, 80);
    const centralWrongs = [];
    const otherParas = paragraphs.filter(p => p.id !== para.id);
    for (const op of otherParas) {
      const opSents = paraSentMap[op.id];
      centralWrongs.push(truncate(opSents[0].text, 80));
    }
    const centralChoices = shuffleChoices(centralCorrect, centralWrongs, para.id + "_central");

    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        choices: centralChoices.list,
        answerId: centralChoices.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }

  return timeline;
}

function truncate(text, maxLen) {
  return text.length > maxLen ? text.substring(0, maxLen) : text;
}

function shuffleChoices(correct, wrongs, seed) {
  const items = [correct, ...wrongs.slice(0, 3)];
  // 정답 위치 결정
  const pos = hashIdx(seed) % 4;
  // 정답을 pos 위치로 이동
  if (pos !== 0) {
    const temp = items[0];
    items[0] = items[pos];
    items[pos] = temp;
  }
  const ids = ["A", "B", "C", "D"];
  const list = items.map((text, i) => ({ id: ids[i], text }));
  const answerId = ids[items.indexOf(correct)];
  return { list, answerId };
}

// 복기 카드 빌더 (8장)
function buildRecallCards(paragraphs, cardCount) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / cardCount);

  const cards = [];
  const correctOrder = [];

  for (let i = 0; i < cardCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    const cardText = fullText.substring(start, end);
    const cardId = `c${i + 1}`;
    cards.push({ id: cardId, text: cardText });
    correctOrder.push(cardId);
  }

  return { cards, correctOrder, seedPenalty: 1 };
}

// ─── 배치 아이템 래퍼 ───
function wrapBatchItem(content, dayIndex, subArea) {
  return {
    content_type: "DAILY_READING",
    level_id: "WITTGENSTEIN_2",
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content
  };
}

// ─── 메인 실행 ───
function main() {
  console.log("=== 비트겐슈타인2 Day 36~40 빌드 시작 ===\n");

  const contents = [
    buildDay36(),
    buildDay37(),
    buildDay38(),
    buildDay39(),
    buildDay40()
  ];

  // 검증
  let allValid = true;
  for (const c of contents) {
    const len = c.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
    const dayNum = parseInt(c.contentId.split('-')[2]);
    if (len < 1450 || len > 1550) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1450~1550)`);
      allValid = false;
    } else {
      console.log(`Day ${dayNum}: ${len}자 (적합)`);
    }

    if (c.payload.recall.cards.length !== 8) {
      console.warn(`경고: Day ${dayNum} 복기 카드 ${c.payload.recall.cards.length}장 (8장 필요)`);
      allValid = false;
    }

    const qCount = c.payload.confirm.questions.length;
    if (qCount < 5 || qCount > 8) {
      console.warn(`경고: Day ${dayNum} 확인 문항 ${qCount}개 (5~8개 필요)`);
      allValid = false;
    }
  }

  // static 파일 생성
  for (const c of contents) {
    const dayNum = parseInt(c.contentId.split('-')[2]);
    const dayStr = String(dayNum).padStart(3, '0');
    const filePath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(filePath, JSON.stringify(c, null, 2), 'utf8');
    console.log(`생성: ${dayStr}.json`);
  }

  // 배치 파일 갱신
  console.log("\n배치 파일 갱신 중...");
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`현재 배치 items 수: ${batchData.items.length}`);

  const dayIndices = [36, 37, 38, 39, 40];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1;
    const subArea = contents[i].subArea;
    const batchItem = wrapBatchItem(contents[i], dayIdx, subArea);

    if (batchIdx < batchData.items.length && batchData.items[batchIdx]) {
      console.log(`교체: items[${batchIdx}] (${batchData.items[batchIdx].content.contentId} -> ${contents[i].contentId})`);
    } else {
      console.log(`추가: items[${batchIdx}] (${contents[i].contentId})`);
    }
    batchData.items[batchIdx] = batchItem;
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료`);

  console.log("\n=== 빌드 완료 ===");
}

main();
