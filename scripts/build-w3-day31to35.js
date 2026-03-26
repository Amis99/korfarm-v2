#!/usr/bin/env node
// 비트겐슈타인3 Day 31~35 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION, 짝수 Day = LITERATURE
// 목표 글자수: 1600자 ±50 (1550~1650)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-wittgenstein3.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/wittgenstein3');

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

// ─── Day 31: 비문학 (NONFICTION) — 괴델의 불완전성 정리와 수학의 한계 ───
function buildDay31() {
  const paragraphs = [
    {
      id: "p1",
      text: "1931년 쿠르트 괴델이 발표한 불완전성 정리는 수학의 기초론에 관한 가장 충격적인 발견 중 하나로 평가된다. 19세기 말부터 수학자들은 수학을 논리적으로 완전하고 무모순적인 체계 위에 기초하려는 시도를 전개하였으며, 다비트 힐베르트는 이러한 기초주의 프로그램의 핵심 인물이었다. 힐베르트의 구상은 모든 수학적 진리가 유한한 공리 체계로부터 기계적 절차를 통해 도출될 수 있으며, 그 체계 내에서 어떠한 모순도 발생하지 않음을 증명하는 것이었다. 그러나 괴델은 제1불완전성 정리를 통해 산술을 포함하는 충분히 강력한 형식 체계는 결코 완전할 수 없음을 증명하였다. 즉, 그러한 체계 안에는 참이지만 체계 내에서 증명할 수 없는 명제가 반드시 존재한다는 것이다."
    },
    {
      id: "p2",
      text: "괴델의 증명 방법은 그 자체로 수학적 혁신이었다. 그는 괴델 수라 불리는 부호화 기법을 고안하여, 형식 체계의 모든 기호와 증명 과정을 자연수에 대응시켰다. 이를 통해 수학적 명제에 관한 메타수학적 진술을 체계 내부의 산술적 명제로 변환하는 것이 가능해졌다. 핵심적인 단계는 이 명제는 증명될 수 없다라는 자기 지시적 문장을 형식 체계 내부에서 구성하는 것이었다. 만약 이 명제가 증명 가능하다면 체계는 거짓인 명제를 증명한 셈이 되어 모순에 빠지고, 증명 불가능하다면 참이지만 증명할 수 없는 명제가 존재하게 되어 체계는 불완전해진다. 이러한 대각선 논법의 적용은 칸토어의 집합론과 러셀의 역설에서 이어지는 자기 지시 구조의 수학적 전통을 계승하면서도, 그것을 형식적 증명 이론의 맥락에서 한층 정교하게 발전시킨 것이었다."
    },
    {
      id: "p3",
      text: "제2불완전성 정리는 제1정리의 결과를 더욱 심화시킨 것으로, 산술을 포함하는 무모순적 형식 체계는 자기 자신의 무모순성을 체계 내부에서 증명할 수 없다는 내용을 담고 있다. 이 정리는 힐베르트 프로그램에 대한 결정적인 타격으로 작용하였다. 힐베르트가 추구한 것은 수학 체계가 스스로의 무모순성을 보증하는 자기 정당화였으나, 괴델은 그러한 내적 자기 정당화가 원리적으로 불가능함을 보여 주었기 때문이다. 그러나 이것이 수학 자체의 무모순성을 부정하는 것은 아니라는 점에 유의해야 한다. 괴델의 정리가 말하는 것은 무모순성의 부재가 아니라, 무모순성의 증명 불가능성이다. 수학은 여전히 무모순적일 수 있지만, 그 사실을 수학 자체의 도구만으로는 확인할 수 없다는 것이 제2불완전성 정리의 핵심이다."
    },
    {
      id: "p4",
      text: "괴델의 불완전성 정리는 수학 기초론을 넘어 철학과 인지과학에도 깊은 영향을 미쳤다. 루카스와 펜로즈 등은 괴델의 정리를 근거로 인간의 사고가 형식적 알고리즘으로 환원될 수 없다는 주장을 전개하였다. 그들의 논증에 따르면, 인간은 괴델 문장의 참을 직관적으로 인식할 수 있지만 형식 체계는 그렇게 할 수 없으므로, 인간의 정신은 기계적 연산을 초월하는 능력을 지닌다는 것이다. 이 주장은 인공지능의 원리적 한계에 관한 논의에서도 빈번하게 인용되며, 강한 인공지능의 실현 가능성에 대한 회의적 논거로 활용되어 왔다. 그러나 이러한 해석에 대해서는 인간의 수학적 직관이 실제로 무오류적인지, 괴델 문장의 참을 인간이 진정으로 파악하는 것인지에 대한 반론이 제기된다. 괴델의 정리가 형식 체계의 한계를 보여 주는 것은 분명하지만, 그것이 곧 인간 정신의 비기계적 본성을 입증하는 것인지는 여전히 열린 문제로 남아 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "힐베르트가 수학 기초론에서 추구한 목표는 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p1", "모든 수학적 진리가 유한한 공리 체계로부터 기계적 절차를 통해 도출될 수 있으며, 그 체계 내에서 어떠한 모순도 발생하지 않음을 증명하는 것이었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "괴델이 괴델 수 부호화 기법을 통해 가능하게 만든 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "수학적 명제에 관한 메타수학적 진술을 체계 내부의 산술적 명제로 변환하는 것이 가능해졌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "괴델의 자기 지시적 문장이 체계에 야기하는 딜레마는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "이 명제가 증명 가능하다면 체계는 거짓인 명제를 증명한 셈이 되어 모순에 빠지고, 증명 불가능하다면 참이지만 증명할 수 없는 명제가 존재하게 되어 체계는 불완전해진다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "제2불완전성 정리가 힐베르트 프로그램에 결정적 타격이 된 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "힐베르트가 추구한 것은 수학 체계가 스스로의 무모순성을 보증하는 자기 정당화였으나, 괴델은 그러한 내적 자기 정당화가 원리적으로 불가능함을 보여 주었기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "괴델의 제2정리가 말하는 핵심은 무모순성의 부재가 아니라 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "무모순성의 증명 불가능성이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "루카스와 펜로즈의 괴델 정리 해석에 대해 제기되는 반론은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "인간의 수학적 직관이 실제로 무오류적인지, 괴델 문장의 참을 인간이 진정으로 파악하는 것인지에 대한 반론이 제기된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(31, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 32: 문학 (LITERATURE) — 이상(李箱)의 실험적 문학 세계 ───
function buildDay32() {
  const paragraphs = [
    {
      id: "p1",
      text: "이상(李箱)은 1930년대 한국 모더니즘 문학의 가장 급진적인 실험을 수행한 작가로 평가된다. 본명 김해경으로 경성고등공업학교 건축과를 졸업한 그는 조선총독부 건축기사로 근무하면서 문학 활동을 시작하였다. 이상의 작품에서 나타나는 공간의 분할과 시점의 해체는 건축적 구조물의 설계 원리를 문학의 영역으로 전이시킨 결과로 해석될 수 있다. 그의 대표작 「오감도」 연작은 1934년 조선중앙일보에 연재되었으나, 독자들의 거센 항의로 인해 15회 만에 중단되었다. 이 사실은 이상의 실험이 당대의 문학적 관습과 극단적으로 충돌하였음을 보여 주는 상징적 사례이다. 「오감도」에서 이상은 언어의 지시적 기능을 의도적으로 파괴하고, 수학적 기호와 일상어를 병치시키며, 의미의 고정성을 해체하는 탈관습적 시학을 전개하였다."
    },
    {
      id: "p2",
      text: "이상의 소설 세계 역시 전통적 서사 구조에 대한 근본적인 도전으로 가득하다. 단편 「날개」는 이상 소설의 정점에 놓인 작품으로, 주인공의 의식의 흐름을 따라가는 독특한 서술 방식을 통해 근대적 주체의 분열과 소외를 형상화하고 있다. 이 작품에서 주인공은 아내에게 경제적으로 종속된 무기력한 지식인으로 등장하며, 밀폐된 방 안에서의 수면과 각성의 반복은 현실 인식과 자아 상실 사이를 오가는 근대인의 심리를 상징적으로 표현한다. 특히 작품의 결말에서 주인공이 미쓰코시 백화점 옥상에서 날개야 다시 돋아라라고 외치는 장면은, 억압적 현실로부터의 비상을 갈망하면서도 그것이 실현 불가능한 환상임을 동시에 암시하는 이중적 의미를 지닌다. 이러한 서술 전략은 제임스 조이스의 의식의 흐름 기법과 비교되면서도, 식민지 근대라는 한국적 맥락에서 고유한 의미를 획득한다."
    },
    {
      id: "p3",
      text: "이상 문학의 핵심적 주제 중 하나는 거울에 의해 매개되는 자아의 분열이다. 시 「거울」에서 이상은 거울 속의 나와 거울 밖의 나를 대립시키면서, 자아의 동일성이 허구적 구성물에 불과할 수 있다는 근대적 인식을 형상화하고 있다. 거울은 자아를 반영하는 동시에 왜곡하는 매체이며, 이상은 이러한 거울의 양가성을 통해 근대적 주체가 자기 자신과 맺는 불안정한 관계를 드러낸다. 이는 라캉의 거울 단계 이론과 유사한 문제의식을 보여 주는 것으로, 이상이 서구 모더니즘과 동시대적 감각을 공유하고 있었음을 시사한다. 또한 이상의 자기 지시적 글쓰기는 텍스트가 자기 자신을 대상으로 삼는 메타문학적 성격을 띠는데, 이는 문학의 본질과 한계에 대한 근본적인 성찰을 내포하는 것이기도 하다."
    },
    {
      id: "p4",
      text: "이상 문학에 대한 평가는 시대에 따라 크게 변화해 왔다. 발표 당시에는 해독 불가능한 기괴한 글쓰기로 폄하되었으나, 1960년대 이후 한국 문학 연구가 본격화되면서 이상은 한국 모더니즘의 선구자로 재평가되기 시작하였다. 특히 1990년대 이후 탈구조주의와 해체론의 관점이 도입되면서, 이상의 텍스트는 의미의 다층성과 불확정성을 체현하는 열린 텍스트로서 새롭게 조명되었다. 그러나 이상 문학을 순수한 형식 실험으로만 독해하는 것은 일면적이다. 그의 작품에는 식민지 지식인이 겪는 실존적 고통과 근대성의 폭력에 대한 날카로운 비판 의식이 내재되어 있으며, 형식적 파괴 자체가 억압적 현실에 대한 저항의 몸짓으로 기능하고 있다. 이상은 불과 스물일곱 해의 짧은 생애 동안 한국 문학의 가능성을 극한까지 확장한 작가이며, 그의 문학적 유산은 오늘날에도 새로운 해석의 지평을 열어 가고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "이상의 건축학적 배경이 그의 문학에 미친 영향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "공간의 분할과 시점의 해체는 건축적 구조물의 설계 원리를 문학의 영역으로 전이시킨 결과로 해석될 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「날개」 결말에서 주인공의 외침이 지니는 이중적 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "억압적 현실로부터의 비상을 갈망하면서도 그것이 실현 불가능한 환상임을 동시에 암시하는 이중적 의미를 지닌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "이상의 시 「거울」에서 거울이 자아와 관련하여 수행하는 기능은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "거울은 자아를 반영하는 동시에 왜곡하는 매체이며, 이상은 이러한 거울의 양가성을 통해 근대적 주체가 자기 자신과 맺는 불안정한 관계를 드러낸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "이상의 자기 지시적 글쓰기가 내포하는 문학적 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "문학의 본질과 한계에 대한 근본적인 성찰을 내포하는 것이기도 하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "1990년대 이후 이상의 텍스트가 새롭게 조명된 관점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "의미의 다층성과 불확정성을 체현하는 열린 텍스트로서 새롭게 조명되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이상 문학에서 형식적 파괴가 수행하는 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "형식적 파괴 자체가 억압적 현실에 대한 저항의 몸짓으로 기능하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(32, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 33: 비문학 (NONFICTION) — 페르디낭 드 소쉬르의 구조주의 언어학 ───
function buildDay33() {
  const paragraphs = [
    {
      id: "p1",
      text: "페르디낭 드 소쉬르는 근대 언어학의 아버지로 불리며, 그의 사후에 제자들이 편찬한 「일반 언어학 강의」는 20세기 인문학 전반에 혁명적 영향을 미친 저작이다. 소쉬르 이전의 언어학은 주로 역사 비교 언어학의 전통에 속하여, 개별 언어의 역사적 변천 과정을 추적하고 언어 간의 계통적 관계를 규명하는 데 초점을 맞추고 있었다. 소쉬르는 이러한 통시적 접근에 대하여 언어를 특정 시점에서 작동하는 체계로 파악하는 공시적 접근을 제안하였다. 그에 따르면 언어의 본질은 역사적 변화 속에서가 아니라, 주어진 시점에서 언어 요소들이 서로 맺는 관계의 체계 속에서 포착되어야 한다. 이러한 공시적 언어관은 이후 구조주의라는 거대한 지적 흐름의 이론적 기반이 되었다."
    },
    {
      id: "p2",
      text: "소쉬르 언어학의 가장 핵심적인 개념은 기호의 자의성 원리이다. 소쉬르는 언어 기호를 기표와 기의의 결합으로 정의하였는데, 기표는 음성적 이미지이고 기의는 그에 대응하는 개념이다. 그가 강조한 것은 기표와 기의 사이의 관계가 자연적이거나 필연적인 것이 아니라 사회적 관습에 의해 성립하는 자의적 관계라는 점이다. 예컨대 나무라는 개념이 한국어에서는 나무라는 기표로, 영어에서는 트리라는 기표로, 프랑스어에서는 아르브르라는 기표로 표현되는 것은 이러한 자의성의 증거이다. 그러나 자의성이 개인의 자유로운 선택을 의미하는 것은 아니다. 기호의 자의성은 오히려 언어가 개인을 초월하는 사회적 제도임을 함축하며, 개별 화자는 이미 확립된 기호 체계를 수용할 수밖에 없다는 것이 소쉬르의 통찰이다. 이러한 자의성의 원리는 언어가 현실을 투명하게 반영하는 것이 아니라 적극적으로 구성한다는 인식으로 이어진다."
    },
    {
      id: "p3",
      text: "소쉬르의 또 다른 핵심 개념은 랑그와 파롤의 구분이다. 랑그는 특정 언어 공동체가 공유하는 추상적인 언어 체계로서, 문법 규칙과 어휘 체계 등을 포함하는 사회적 제도이다. 반면 파롤은 개별 화자가 특정 상황에서 실제로 수행하는 구체적인 발화 행위를 가리킨다. 소쉬르는 언어학의 진정한 대상이 개별적이고 우연적인 파롤이 아니라 체계적이고 사회적인 랑그여야 한다고 주장하였다. 이 구분은 이후 촘스키의 언어 능력과 언어 수행의 구분에도 영향을 미쳤으며, 개별적 현상 이면에 존재하는 체계를 탐구한다는 구조주의적 방법론의 원형을 제공하였다. 랑그에 대한 연구는 언어를 개인의 심리적 산물이 아닌 사회적 사실로 파악하게 하였으며, 이는 뒤르켐의 사회학적 방법론과도 상통하는 관점이다."
    },
    {
      id: "p4",
      text: "소쉬르의 구조주의 언어학이 인문학 전반에 미친 영향은 지대하다. 레비스트로스는 소쉬르의 구조적 분석 방법을 인류학에 적용하여, 친족 체계와 신화를 이항 대립의 구조로 분석하였다. 바르트는 기호학을 문학과 대중문화 분석의 도구로 확장하였으며, 라캉은 무의식이 언어처럼 구조화되어 있다는 명제를 통해 정신분석학을 재구성하였다. 이처럼 소쉬르의 언어 이론은 언어학의 경계를 넘어 문화 현상 전반을 기호의 체계로 분석하는 이론적 틀을 제공하였다. 그러나 소쉬르의 구조주의는 언어의 역사적 변화와 화자의 주체적 실천을 경시한다는 비판에도 직면하였다. 데리다는 소쉬르의 기표와 기의의 안정적 대응이라는 전제 자체를 해체하면서, 의미가 끊임없이 지연되고 미끄러지는 차연의 운동을 강조하였다. 이러한 비판에도 불구하고 소쉬르가 정립한 구조적 사고의 틀은 현대 인문학의 근간을 이루는 유산으로 남아 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "소쉬르가 통시적 접근 대신 제안한 언어 연구의 관점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "언어를 특정 시점에서 작동하는 체계로 파악하는 공시적 접근을 제안하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "소쉬르의 기호 자의성 원리가 함축하는 언어의 본질적 성격은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "언어가 개인을 초월하는 사회적 제도임을 함축하며, 개별 화자는 이미 확립된 기호 체계를 수용할 수밖에 없다는 것이 소쉬르의 통찰이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "소쉬르가 언어학의 진정한 대상으로 본 것은 랑그와 파롤 중 무엇이며, 그 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "개별적이고 우연적인 파롤이 아니라 체계적이고 사회적인 랑그여야 한다고 주장하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "랑그와 파롤의 구분이 구조주의적 방법론에 기여한 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "개별적 현상 이면에 존재하는 체계를 탐구한다는 구조주의적 방법론의 원형을 제공하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "소쉬르의 언어 이론이 인문학에 제공한 핵심적 기여는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "문화 현상 전반을 기호의 체계로 분석하는 이론적 틀을 제공하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "데리다가 소쉬르의 구조주의를 비판하면서 강조한 개념은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "의미가 끊임없이 지연되고 미끄러지는 차연의 운동을 강조하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(33, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 34: 문학 (LITERATURE) — 도스토옙스키의 「죄와 벌」에 나타난 죄의식의 구조 ───
function buildDay34() {
  const paragraphs = [
    {
      id: "p1",
      text: "도스토옙스키의 장편소설 「죄와 벌」은 범죄와 그에 뒤따르는 양심의 고통을 통해 인간 존재의 도덕적 심연을 탐구한 작품이다. 주인공 라스콜니코프는 가난에 시달리는 전직 법학도로서, 비범한 인간은 사회의 도덕률을 초월하여 행동할 권리가 있다는 독자적 이론을 정립한다. 그는 이 이론의 검증을 위해 고리대금업자 노파를 살해하지만, 범행 직후부터 예상치 못한 내면적 분열을 경험하게 된다. 라스콜니코프의 이론은 합리적 계산에 기초하였으나, 실제 범죄의 수행은 그의 합리성이 포착하지 못하는 존재론적 차원의 반응을 촉발한다. 이 작품에서 도스토옙스키는 인간의 도덕적 감각이 이성적 추론의 산물이 아니라 존재의 근원적 층위에 뿌리박고 있음을 형상화하며, 이성만으로는 인간 행위의 도덕적 차원을 온전히 파악할 수 없다는 사실을 드러내고 있다."
    },
    {
      id: "p2",
      text: "라스콜니코프의 죄의식은 단선적인 후회의 형태가 아니라 다층적이고 모순적인 심리 구조를 띠고 있다. 그는 범죄를 저지른 후에도 자신의 이론적 정당성을 포기하지 않으며, 자신이 범죄에 실패한 것은 이론의 오류가 아니라 자신의 나약함 때문이라고 자위한다. 이러한 자기기만은 합리화 기제의 작동을 보여 주는 것으로, 도스토옙스키는 죄의식이 의식의 표면에서 억압되면서도 신체적 증상과 비합리적 행동을 통해 끊임없이 표출되는 과정을 정밀하게 묘사한다. 라스콜니코프가 범행 현장을 반복적으로 방문하거나 형사 포르피리와의 대화에서 자기 고발적 발언을 무의식적으로 흘리는 것은, 억압된 죄의식이 의식의 통제를 벗어나 분출되는 양상을 형상화한 것이다. 이러한 심리 묘사는 프로이트의 정신분석학이 등장하기 수십 년 전에 무의식적 죄의식의 역학을 문학적으로 선취한 것으로 평가받는다."
    },
    {
      id: "p3",
      text: "소냐 마르멜라도바는 라스콜니코프의 구원을 가능하게 하는 핵심적 인물이다. 가족의 생계를 위해 자신을 희생하는 소냐는 사회적으로 가장 비천한 위치에 놓여 있으면서도 깊은 신앙심과 타인에 대한 무조건적 사랑을 간직하고 있다. 도스토옙스키는 소냐를 통해 라스콜니코프의 합리주의적 세계관과 대립하는 또 다른 존재 방식을 제시한다. 소냐가 라스콜니코프에게 나사로의 부활 이야기를 읽어 주는 장면은 작품의 핵심적 전환점으로, 죽음에서 삶으로의 부활이라는 주제를 상징적으로 드러내고 있다. 이 장면에서 라스콜니코프는 처음으로 자신의 이론 체계 바깥에 존재하는 가치의 가능성을 감지하게 되며, 이는 그의 내면적 변화의 시작점이 된다. 소냐의 존재는 인간의 구원이 지적 탐구가 아닌 고통의 수용과 타자와의 연대를 통해 가능함을 보여 주는 것이다."
    },
    {
      id: "p4",
      text: "「죄와 벌」의 에필로그에서 라스콜니코프는 시베리아 유형지에서 소냐의 동행 속에 점진적인 내면적 변화를 경험한다. 도스토옙스키는 이 변화를 갑작스러운 깨달음이 아니라 느리고 고통스러운 과정으로 묘사하며, 이는 진정한 도덕적 전환이 지적 인식의 전환이 아니라 존재 전체의 변형을 요구한다는 작가의 신념을 반영한다. 라스콜니코프가 소냐 앞에 무릎을 꿇고 우는 장면은 합리적 자아의 항복이자 새로운 존재 방식에 대한 개방을 상징한다. 도스토옙스키는 이 작품을 통해 서구 근대의 합리주의적 인간관에 근본적인 물음을 제기하고 있다. 이성적 계산에 의해 도덕을 초월할 수 있다는 관념은 인간 존재의 깊이를 간과한 오만이며, 인간은 자신의 행위에 대해 이성이 예측할 수 없는 방식으로 반응하는 존재라는 것이 이 작품이 전달하는 핵심적 통찰이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "라스콜니코프가 범행 후 경험한 내면적 반응이 보여 주는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "인간의 도덕적 감각이 이성적 추론의 산물이 아니라 존재의 근원적 층위에 뿌리박고 있음을 형상화하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "라스콜니코프의 죄의식이 의식의 통제를 벗어나 표출되는 구체적 양상은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "범행 현장을 반복적으로 방문하거나 형사 포르피리와의 대화에서 자기 고발적 발언을 무의식적으로 흘리는 것은")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "라스콜니코프의 심리 묘사가 문학사적으로 선취한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "무의식적 죄의식의 역학을 문학적으로 선취한 것으로 평가받는다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "소냐의 존재가 보여 주는 구원의 방식은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "인간의 구원이 지적 탐구가 아닌 고통의 수용과 타자와의 연대를 통해 가능함을 보여 주는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "도스토옙스키가 라스콜니코프의 변화를 느린 과정으로 묘사한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "진정한 도덕적 전환이 지적 인식의 전환이 아니라 존재 전체의 변형을 요구한다는 작가의 신념을 반영한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "「죄와 벌」이 전달하는 핵심적 통찰은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "인간은 자신의 행위에 대해 이성이 예측할 수 없는 방식으로 반응하는 존재라는 것이 이 작품이 전달하는 핵심적 통찰이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(34, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 35: 비문학 (NONFICTION) — 현대 화폐 이론(MMT)의 논쟁 ───
function buildDay35() {
  const paragraphs = [
    {
      id: "p1",
      text: "현대 화폐 이론은 주권 통화를 발행하는 정부의 재정 운용에 관한 비정통 경제학적 관점을 제시하는 이론 체계이다. 전통적인 재정학에서는 정부의 지출이 세수와 차입에 의해 제약된다고 보며, 재정 건전성의 유지를 위해 균형 재정 또는 재정 흑자를 달성해야 한다고 주장한다. 이에 반해 현대 화폐 이론은 자국 통화를 독점적으로 발행하는 정부가 통화 부족으로 인해 지불 불능에 빠질 수 없다는 점에 주목한다. 이 이론에 따르면 주권 통화 발행국의 재정 적자는 민간 부문의 순금융자산을 증가시키는 것이므로, 재정 적자 자체를 부정적으로 평가하는 것은 화폐의 본질에 대한 오해에서 비롯된다. 조세의 기능 역시 재정 수입의 확보가 아니라 화폐에 대한 수요를 창출하고 인플레이션을 관리하며 소득 분배를 조정하는 정책적 도구로 재정의된다."
    },
    {
      id: "p2",
      text: "현대 화폐 이론의 핵심 주장 중 하나는 정부의 진정한 재정 제약이 통화량이 아니라 실물 자원의 가용성이라는 것이다. 정부가 화폐를 무한히 발행할 수 있다 하더라도, 경제 내에서 활용 가능한 노동력, 원자재, 생산 설비 등의 실물 자원이 한정되어 있기 때문에, 이를 초과하는 지출은 인플레이션을 야기하게 된다. 따라서 현대 화폐 이론이 무제한적 재정 지출을 옹호한다는 비판은 이 이론에 대한 오해이다. 오히려 이 이론은 재정 정책의 기준을 임의적인 재정 적자 비율이 아니라 실물 경제의 유휴 자원 수준과 인플레이션 압력에 두어야 한다고 주장한다. 이러한 관점에서 현대 화폐 이론은 완전 고용의 달성을 재정 정책의 핵심 목표로 설정하며, 정부가 최종 고용자로서 일자리 보장 프로그램을 운영할 것을 제안한다."
    },
    {
      id: "p3",
      text: "현대 화폐 이론에 대한 비판은 다양한 각도에서 제기된다. 주류 경제학자들은 이 이론이 인플레이션의 위험을 과소평가하고 있다고 지적한다. 재정 지출의 확대가 인플레이션을 유발할 경우, 이를 억제하기 위해서는 급격한 증세나 지출 삭감이 필요하지만, 이러한 긴축 조치는 정치적으로 실행하기 극히 어렵다는 것이다. 또한 화폐 발행의 남용이 통화 가치의 하락과 자본 유출을 초래할 수 있다는 우려도 제기된다. 국제 기축 통화가 아닌 국가의 경우 자국 통화의 신뢰도 하락은 외환 위기로 이어질 수 있으며, 이는 현대 화폐 이론의 적용 범위에 근본적인 제한을 가한다. 개발도상국이나 소규모 개방 경제에서는 주권 통화의 발행 능력만으로 재정적 자유를 확보하기 어렵다는 것이 현실적 한계로 지적된다."
    },
    {
      id: "p4",
      text: "현대 화폐 이론이 제기하는 논쟁은 단순한 기술적 경제학 논쟁을 넘어 정치적 함의를 지닌다. 이 이론은 재정 건전성이라는 담론이 사회 복지 지출의 축소를 정당화하는 이데올로기적 도구로 기능해 왔다는 비판적 시각을 내포하고 있다. 재정 적자가 본질적으로 위험하다는 통념이 해체될 경우, 의료, 교육, 기반 시설 등에 대한 공공 투자의 확대를 가로막는 논리적 장벽도 함께 약화되기 때문이다. 이러한 맥락에서 현대 화폐 이론은 진보적 정치 세력으로부터 그린 뉴딜이나 보편적 기본 소득과 같은 대규모 공공 프로그램의 재정적 실현 가능성을 뒷받침하는 이론적 근거로 주목받고 있다. 그러나 이 이론의 정치적 활용에 대해서는 경제학적 분석과 정치적 옹호를 구분해야 한다는 신중론도 존재하며, 현대 화폐 이론이 학문적 타당성을 확보하기 위해서는 그 정책적 처방이 다양한 경제 환경에서 경험적으로 검증되어야 한다는 과제가 남아 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "현대 화폐 이론이 조세의 기능을 어떻게 재정의하는가?",
      answerRanges: [findRange(paragraphs, "p1", "화폐에 대한 수요를 창출하고 인플레이션을 관리하며 소득 분배를 조정하는 정책적 도구로 재정의된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "현대 화폐 이론에서 정부의 진정한 재정 제약은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "정부의 진정한 재정 제약이 통화량이 아니라 실물 자원의 가용성이라는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "현대 화폐 이론이 재정 정책의 기준으로 삼아야 한다고 주장하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "재정 정책의 기준을 임의적인 재정 적자 비율이 아니라 실물 경제의 유휴 자원 수준과 인플레이션 압력에 두어야 한다고 주장한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "현대 화폐 이론의 적용 범위에 근본적 제한을 가하는 요인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "자국 통화의 신뢰도 하락은 외환 위기로 이어질 수 있으며, 이는 현대 화폐 이론의 적용 범위에 근본적인 제한을 가한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "현대 화폐 이론이 재정 건전성 담론에 대해 제기하는 비판적 시각은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "재정 건전성이라는 담론이 사회 복지 지출의 축소를 정당화하는 이데올로기적 도구로 기능해 왔다는 비판적 시각을 내포하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "현대 화폐 이론이 학문적 타당성을 확보하기 위해 남은 과제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "정책적 처방이 다양한 경제 환경에서 경험적으로 검증되어야 한다는 과제가 남아 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(35, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  // 정독 타임라인 자동 생성
  const timeline = buildTimeline(paragraphs);
  // 복기 카드 8장
  const recall = buildRecallCards(paragraphs, 8);

  const dayStr = String(dayIndex).padStart(3, '0');
  const contentId = `dr-w3-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(비트겐슈타인 3) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "WITTGENSTEIN_3",
    schoolGradeRange: { min: 11, max: 12 },
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
    level_id: "WITTGENSTEIN_3",
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
  console.log("=== 비트겐슈타인3 Day 31~35 빌드 시작 ===\n");

  const contents = [
    buildDay31(),
    buildDay32(),
    buildDay33(),
    buildDay34(),
    buildDay35()
  ];

  // 검증
  let allValid = true;
  for (const c of contents) {
    const len = c.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
    const dayNum = parseInt(c.contentId.split('-')[2]);
    if (len < 1550 || len > 1650) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1550~1650)`);
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

  const dayIndices = [31, 32, 33, 34, 35];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1;
    const subArea = contents[i].subArea;
    const batchItem = wrapBatchItem(contents[i], dayIdx, subArea);

    if (batchData.items[batchIdx]) {
      console.log(`교체: items[${batchIdx}] (${batchData.items[batchIdx].content.contentId} → ${contents[i].contentId})`);
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
