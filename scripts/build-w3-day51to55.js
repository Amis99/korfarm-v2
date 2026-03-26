#!/usr/bin/env node
// 비트겐슈타인3 Day 51~55 일일독해 콘텐츠 빌더
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

// ─── Day 51: 비문학 (NONFICTION) — 인지언어학과 은유 이론 ───
function buildDay51() {
  const paragraphs = [
    {
      id: "p1",
      text: "전통적 수사학에서 은유는 언어적 장식으로 간주되어 왔다. 아리스토텔레스 이래 은유는 시적 표현이나 설득적 화법에 활용되는 수사적 기교로 분류되었으며, 일상 언어와 구별되는 특수한 표현 양식으로 이해되었다. 그러나 1980년 레이코프와 존슨이 제시한 개념적 은유 이론은 이러한 관점을 근본적으로 전복하였다. 이들에 따르면 은유는 단순한 언어적 현상이 아니라 인간의 사고 체계를 구성하는 인지적 기제이며, 일상 언어의 곳곳에 침투해 있는 개념적 구조이다. 예컨대 '시간이 흐른다', '시간을 아끼다', '시간을 낭비하다'와 같은 표현은 '시간은 돈이다'라는 개념적 은유가 언어에 반영된 사례이다. 이러한 은유적 표현은 의도적으로 선택된 수사적 장치가 아니라, 시간이라는 추상적 개념을 화폐라는 구체적 경험에 기대어 이해하려는 인지적 활동의 결과이다."
    },
    {
      id: "p2",
      text: "개념적 은유 이론의 핵심 주장은 추상적 개념이 신체적 경험에 기반한 구체적 영역을 통해 이해된다는 것이다. 이를 근원 영역에서 목표 영역으로의 사상이라 하며, 근원 영역은 감각적 경험의 영역이고 목표 영역은 추상적 개념의 영역이다. '논쟁은 전쟁이다'라는 개념적 은유에서 전쟁이라는 근원 영역의 구조가 논쟁이라는 목표 영역에 사상되면, 우리는 논쟁을 전쟁의 관점에서 이해하게 된다. 이에 따라 '주장을 공격하다', '논점을 방어하다', '논리를 격파하다'와 같은 표현이 자연스럽게 사용된다. 이러한 사상은 체계적이어서, 근원 영역의 구조적 관계가 목표 영역에 일관되게 투영된다. 그러나 모든 구조가 사상되는 것은 아니며, 근원 영역의 일부 측면만이 선택적으로 강조되고 나머지는 은폐되는데, 이를 은유의 부분성이라 한다."
    },
    {
      id: "p3",
      text: "개념적 은유 이론은 이후 신체화된 인지의 관점에서 더욱 발전하였다. 신체화된 인지 이론에 따르면 인간의 사고는 뇌 속에서 추상적으로 이루어지는 것이 아니라, 신체와 환경의 상호 작용에 의해 형성된다. 이 관점에서 은유는 단순한 개념 간 대응이 아니라, 신체적 경험이 추상적 사유로 확장되는 인지적 과정을 반영하는 것이다. 예컨대 '위는 좋은 것이고 아래는 나쁜 것'이라는 지향적 은유는 인간이 직립 보행을 하면서 형성한 공간적 경험에 근거한다. 건강할 때 몸이 곧게 서 있고 병들면 누워 있다는 경험이, 긍정적 가치와 상향 방향을 연결하는 은유적 사고의 기반이 되는 것이다. 이러한 신체적 기반의 은유는 문화를 초월하여 보편적으로 나타나며, 이는 은유가 자의적인 언어적 관습이 아니라 인간의 신체적 조건에 뿌리를 둔 인지적 필연임을 시사한다."
    },
    {
      id: "p4",
      text: "개념적 은유 이론은 언어학을 넘어 철학, 심리학, 정치학 등 다양한 분야에 영향을 미쳤다. 정치적 담론에서 은유의 역할에 대한 분석은 특히 주목할 만한데, 레이코프는 미국 정치에서 보수와 진보가 서로 다른 가족 은유에 기반한 도덕 체계를 지니고 있음을 논증하였다. 보수주의는 '엄격한 아버지' 모델에, 진보주의는 '자애로운 부모' 모델에 각각 기반하며, 이 상이한 은유적 틀이 정책적 입장의 차이를 구조적으로 결정한다는 것이다. 이러한 분석은 정치적 갈등이 단순한 이해관계의 충돌이 아니라 근본적으로 상이한 인지적 틀의 충돌임을 보여 준다. 그러나 개념적 은유 이론에 대해서는 은유의 범위를 지나치게 확장하여 모든 추상적 사고를 은유로 환원한다는 비판, 그리고 은유적 사고와 비은유적 사고의 경계가 불분명하다는 지적이 제기되기도 한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "레이코프와 존슨이 기존의 은유 관점을 어떻게 전환하였는가?",
      answerRanges: [findRange(paragraphs, "p1", "은유는 단순한 언어적 현상이 아니라 인간의 사고 체계를 구성하는 인지적 기제이며, 일상 언어의 곳곳에 침투해 있는 개념적 구조이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "'시간은 돈이다'와 같은 일상적 은유 표현이 생겨나는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "시간이라는 추상적 개념을 화폐라는 구체적 경험에 기대어 이해하려는 인지적 활동의 결과이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "개념적 은유에서 '은유의 부분성'이란 무엇을 의미하는가?",
      answerRanges: [findRange(paragraphs, "p2", "근원 영역의 일부 측면만이 선택적으로 강조되고 나머지는 은폐되는데, 이를 은유의 부분성이라 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "지향적 은유가 문화를 초월하여 보편적으로 나타나는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "은유가 자의적인 언어적 관습이 아니라 인간의 신체적 조건에 뿌리를 둔 인지적 필연임을 시사한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "레이코프가 미국 정치에서 발견한 보수와 진보의 은유적 기반은 각각 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "보수주의는 '엄격한 아버지' 모델에, 진보주의는 '자애로운 부모' 모델에 각각 기반하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "개념적 은유 이론에 대해 제기되는 주요 비판은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "모든 추상적 사고를 은유로 환원한다는 비판, 그리고 은유적 사고와 비은유적 사고의 경계가 불분명하다는 지적이 제기되기도 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(51, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 52: 문학 (LITERATURE) — 이상 소설의 서사적 실험 ───
function buildDay52() {
  const paragraphs = [
    {
      id: "p1",
      text: "이상은 1930년대 한국 모더니즘 문학을 대표하는 작가로, 그의 소설은 전통적인 서사 구조를 의도적으로 해체하면서 인간 의식의 분열과 근대 도시의 불안을 형상화하였다. 이상의 소설에서 가장 두드러지는 특징은 서사적 인과 관계의 파괴이다. 전통적 소설이 사건과 사건 사이의 논리적 인과 관계를 통해 서사를 전개하는 것과 달리, 이상의 소설에서는 사건들이 인과적 맥락 없이 병치되거나 반복되면서 독자에게 의미의 공백을 남긴다. 이러한 서사적 전략은 근대적 합리성에 대한 의문을 제기하는 것으로, 세계를 논리적으로 질서 지을 수 있다는 근대적 확신이 무너진 시대의 정신적 풍경을 반영한다. 특히 그의 대표작 「날개」에서 주인공은 아내의 경제 활동에 의존하면서 방 안에 유폐된 삶을 사는데, 이 설정 자체가 근대적 주체성의 위기를 상징적으로 드러내는 장치로 기능한다."
    },
    {
      id: "p2",
      text: "「날개」의 서사 구조는 주인공의 의식의 흐름을 따라 전개되며, 외부 현실과 내면 세계의 경계가 모호하게 처리된다. 주인공은 자신이 처한 상황의 의미를 온전히 파악하지 못하며, 아내가 매춘을 하고 있다는 사실조차 의식의 표면에서는 명확하게 인지하지 못한다. 이러한 인식의 결핍은 단순한 무지가 아니라, 근대 도시의 익명적 삶 속에서 타자와의 진정한 관계가 불가능해진 상황에 대한 알레고리이다. 주인공이 아내에게서 받는 아스피린은 그를 잠들게 하여 현실로부터 더욱 격리시키는데, 이는 근대적 주체가 자발적으로 현실을 회피하기보다는 구조적으로 현실 인식에서 배제되고 있음을 시사한다. 결말에서 주인공이 미쓰코시 백화점 옥상에서 '날개야 다시 돋아라'고 외치는 장면은, 자기 회복에 대한 열망의 표현이면서 동시에 그 불가능성을 암시하는 이중적 의미를 지닌다."
    },
    {
      id: "p3",
      text: "이상의 또 다른 소설 「봉별기」는 사소설의 형식을 빌려 자전적 경험을 서술하면서도, 서술 방식 자체가 자기 해체적인 특성을 보인다. 이 작품에서 서술자는 기생 금홍과의 관계를 회고하는데, 시점과 태도가 수시로 변화하면서 통일적 자아의 가능성을 의문시한다. 서술자는 경험을 객관적으로 재구성하기보다는, 기억의 불확실성과 감정의 동요를 여과 없이 드러내면서 서사의 신뢰성을 스스로 해체한다. 이는 근대 소설이 전제하는 통일적이고 자율적인 서술 주체라는 관념에 대한 근본적 도전이며, 자아가 안정적이고 일관된 존재가 아니라 분열되고 모순적인 존재임을 형식적 차원에서 구현한 것이다. 이러한 자기 해체적 서술은 이후 한국 문학에서 메타픽션의 선구적 시도로 평가받고 있다."
    },
    {
      id: "p4",
      text: "이상의 문학적 실험이 한국 문학사에서 지니는 의의는 여러 측면에서 논의된다. 우선 그는 한국 소설에 의식의 흐름 기법, 자동기술법, 서사 해체 등 서구 모더니즘의 기법을 도입한 작가이다. 그러나 이러한 수용은 단순한 서구 문학의 모방이 아니라, 식민지 근대화의 모순적 경험에서 발생한 내적 필연의 산물이었다. 일제 강점기라는 억압적 현실 속에서 근대적 주체가 형성될 수 없는 조건이 이상 문학의 형식적 실험을 추동한 것이며, 이 점에서 이상의 모더니즘은 서구의 그것과 질적으로 다른 성격을 지닌다. 또한 이상의 문학은 언어 자체에 대한 실험적 탐구를 포함하고 있어, 문학의 매체인 언어가 현실을 투명하게 반영할 수 있다는 전제를 의문시하였다. 이러한 언어 실험은 1990년대 이후 한국 실험 소설에 이르기까지 지속적으로 참조되는 문학적 유산이 되었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "이상 소설에서 서사적 인과 관계의 파괴가 반영하는 시대적 상황은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "세계를 논리적으로 질서 지을 수 있다는 근대적 확신이 무너진 시대의 정신적 풍경을 반영한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「날개」에서 주인공의 인식 결핍이 상징하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "근대 도시의 익명적 삶 속에서 타자와의 진정한 관계가 불가능해진 상황에 대한 알레고리이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "「날개」 결말에서 '날개야 다시 돋아라'라는 외침의 이중적 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "자기 회복에 대한 열망의 표현이면서 동시에 그 불가능성을 암시하는 이중적 의미를 지닌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "「봉별기」에서 자기 해체적 서술이 도전하는 근대 소설의 전제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "근대 소설이 전제하는 통일적이고 자율적인 서술 주체라는 관념에 대한 근본적 도전이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "이상의 모더니즘이 서구의 모더니즘과 질적으로 다른 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "일제 강점기라는 억압적 현실 속에서 근대적 주체가 형성될 수 없는 조건이 이상 문학의 형식적 실험을 추동한 것이며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이상의 언어 실험이 한국 문학사에서 갖는 의의는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "1990년대 이후 한국 실험 소설에 이르기까지 지속적으로 참조되는 문학적 유산이 되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(52, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 53: 비문학 (NONFICTION) — 기후 정의와 환경 윤리 ───
function buildDay53() {
  const paragraphs = [
    {
      id: "p1",
      text: "기후 변화가 전 지구적 위기로 대두되면서, 기후 정의라는 개념이 환경 담론의 핵심 의제로 부상하였다. 기후 정의는 기후 변화의 원인과 결과가 사회적으로 불균등하게 분배되어 있다는 인식에서 출발한다. 역사적으로 온실가스를 대량 배출해 온 선진국과 그로 인한 피해를 주로 감당하는 개발도상국 사이의 비대칭성은 기후 문제가 단순한 과학적·기술적 사안이 아니라 근본적으로 정의의 문제임을 보여 준다. 산업화 이후 누적된 탄소 배출량의 대부분은 소수의 선진국에 의해 발생하였으나, 해수면 상승, 극단적 기상 현상, 식량 위기 등 기후 변화의 피해는 배출에 대한 책임이 가장 적은 남반구 국가와 도서 국가에 집중되고 있다. 이러한 비대칭적 구조는 기후 변화 대응에 있어 차등적 책임의 원칙이 적용되어야 한다는 논거의 기반이 된다."
    },
    {
      id: "p2",
      text: "기후 정의의 논의는 세대 간 정의의 문제로도 확장된다. 현재 세대의 경제 활동에 의해 발생하는 온실가스는 수십 년에서 수백 년에 걸쳐 대기 중에 잔류하며, 그 영향은 미래 세대에 의해 감당되어야 한다. 이는 현재 세대가 미래 세대의 환경적 권리를 침해하고 있는 것으로 해석될 수 있으며, 세대 간 형평의 문제를 제기한다. 그러나 미래 세대는 아직 존재하지 않으므로 자신의 이익을 직접 주장하거나 정치적 의사 결정에 참여할 수 없다는 점에서, 기존의 권리 기반 정의론을 적용하는 데에는 이론적 어려움이 따른다. 이에 대해 일부 학자들은 현재 세대가 미래 세대에 대한 수탁자적 의무를 지닌다고 주장하며, 이는 현재의 자원 사용이 미래 세대의 필요를 충족할 수 있는 범위 내에서 이루어져야 한다는 지속 가능성의 원칙으로 구체화된다."
    },
    {
      id: "p3",
      text: "기후 정의는 국가 간 관계뿐만 아니라 한 사회 내부의 불평등과도 긴밀하게 연결된다. 기후 변화의 영향은 같은 사회 내에서도 경제적으로 취약한 계층에 더 심각하게 나타나는데, 이들은 기후 재난에 대한 적응 능력이 낮고 재난 이후의 회복력도 부족하기 때문이다. 도시 지역에서 폭염으로 인한 사망률이 저소득층 밀집 지역에서 현저히 높게 나타나는 현상이나, 산업 폐기물 처리 시설과 환경 오염 시설이 소수 인종이나 저소득층 거주 지역에 집중적으로 배치되는 환경 인종주의의 문제는 기후 정의의 국내적 차원을 보여 주는 대표적 사례이다. 이러한 현상은 기후 정책의 수립에 있어 형식적 평등을 넘어 실질적 형평을 고려해야 한다는 주장의 근거가 된다."
    },
    {
      id: "p4",
      text: "기후 정의의 실현을 위한 제도적 방안으로는 탄소세와 배출권 거래제와 같은 시장 기반 정책, 그리고 정의로운 전환이라는 사회 정책적 접근이 논의되고 있다. 탄소세는 온실가스 배출에 대한 외부 비용을 내부화함으로써 시장의 실패를 교정하려는 메커니즘이지만, 에너지 비용의 상승이 저소득층에 역진적으로 작용할 수 있다는 점에서 분배적 정의의 관점에서 보완이 필요하다. 정의로운 전환은 화석 연료 산업에서 저탄소 경제로의 이행 과정에서 기존 산업 종사자들이 경제적 불이익을 받지 않도록 재교육과 사회적 안전망을 제공하는 정책을 의미한다. 이러한 전환 과정에서 누가 비용을 부담하고 누가 혜택을 받는가의 문제는 기후 정의의 핵심적 쟁점이며, 이는 기후 변화 대응이 기술적 해법만으로는 충분하지 않고 사회적 합의와 정의의 원칙에 기반해야 함을 보여 준다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "기후 정의가 기후 변화를 정의의 문제로 보는 핵심 근거는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "기후 변화의 원인과 결과가 사회적으로 불균등하게 분배되어 있다는 인식에서 출발한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "기존의 권리 기반 정의론을 세대 간 정의에 적용하기 어려운 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "미래 세대는 아직 존재하지 않으므로 자신의 이익을 직접 주장하거나 정치적 의사 결정에 참여할 수 없다는 점에서")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "현재 세대의 수탁자적 의무가 구체화되는 원칙은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "현재의 자원 사용이 미래 세대의 필요를 충족할 수 있는 범위 내에서 이루어져야 한다는 지속 가능성의 원칙으로 구체화된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "환경 인종주의의 문제가 기후 정의의 어떤 차원을 보여 주는가?",
      answerRanges: [findRange(paragraphs, "p3", "기후 정의의 국내적 차원을 보여 주는 대표적 사례이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "탄소세가 분배적 정의의 관점에서 보완이 필요한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "에너지 비용의 상승이 저소득층에 역진적으로 작용할 수 있다는 점에서 분배적 정의의 관점에서 보완이 필요하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "기후 변화 대응이 기술적 해법만으로는 충분하지 않은 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "누가 비용을 부담하고 누가 혜택을 받는가의 문제는 기후 정의의 핵심적 쟁점이며, 이는 기후 변화 대응이 기술적 해법만으로는 충분하지 않고 사회적 합의와 정의의 원칙에 기반해야 함을 보여 준다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(53, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 54: 문학 (LITERATURE) — 박경리 「토지」의 서사 구조와 역사 의식 ───
function buildDay54() {
  const paragraphs = [
    {
      id: "p1",
      text: "박경리의 「토지」는 구한말에서 해방에 이르는 한국 근현대사의 격변을 배경으로, 하동 평사리의 최 참판 댁을 중심으로 전개되는 대하소설이다. 전체 5부 16권으로 구성된 이 작품은 1969년부터 1994년까지 약 25년에 걸쳐 집필되었으며, 한국 문학사에서 가장 방대한 서사적 규모를 지닌 소설로 평가된다. 「토지」의 서사적 특징은 개인의 운명과 역사의 흐름을 유기적으로 결합시킨 점에 있다. 주인공 서희의 삶은 가문의 몰락과 재건이라는 개인적 서사인 동시에, 봉건 사회의 해체와 근대적 질서의 형성이라는 역사적 전환을 체현하는 알레고리이기도 하다. 이러한 이중적 서사 구조를 통해 박경리는 역사가 추상적 흐름이 아니라 구체적 인간의 삶을 통해 실현되는 과정임을 보여 준다."
    },
    {
      id: "p2",
      text: "「토지」의 인물 구성은 단순한 선악의 대립 구도를 넘어서, 역사적 상황 속에서 각기 다른 선택을 하는 인간 군상의 복잡성을 드러낸다. 조준구는 최 참판 댁의 재산을 탈취하는 악인으로 등장하지만, 그의 행위는 봉건적 신분 질서에 대한 하층민의 뒤틀린 저항으로도 읽힐 수 있다. 이용은 독립운동에 헌신하는 인물이지만, 그의 신념이 가족에게 가하는 희생의 무게 또한 조명된다. 이처럼 「토지」의 인물들은 일면적 유형이 아니라 역사적 조건과 개인적 욕망 사이에서 갈등하는 입체적 존재로 형상화되어 있으며, 이는 역사 소설이 흔히 빠지기 쉬운 도식적 인물 묘사의 한계를 넘어선 것이다. 박경리는 600여 명에 달하는 등장인물 각각에 고유한 목소리와 운명을 부여함으로써, 역사의 거시적 흐름 속에서 개별적 삶의 존엄이 소거되지 않도록 하였다."
    },
    {
      id: "p3",
      text: "「토지」에서 토지는 단순한 물질적 재산을 넘어 존재론적 의미를 지닌 상징으로 기능한다. 작품에서 토지는 인간의 생존 기반이자 공동체적 유대의 근거이며, 동시에 권력과 탐욕의 대상이기도 하다. 서희가 빼앗긴 땅을 되찾기 위해 기울이는 노력은 단순한 재산 회복의 서사가 아니라, 뿌리 뽑힌 존재가 자신의 정체성을 재구성하는 과정으로 읽힌다. 토지에 대한 이러한 다층적 의미 부여는 한국 사회에서 토지가 지니는 역사적·문화적 중층성을 반영하는 것이다. 일제의 토지 조사 사업에 의한 토지 수탈은 경제적 착취에 그치지 않고 한국인의 삶의 터전 자체를 박탈하는 행위였으며, 이 점에서 토지의 상실과 회복은 민족적 정체성의 상실과 회복이라는 보다 큰 주제와 연결된다."
    },
    {
      id: "p4",
      text: "「토지」의 문학사적 의의는 한국 대하소설의 가능성을 증명한 데 있다. 박경리는 서구의 대하소설 전통을 참조하면서도, 한국 고유의 역사적 경험과 정서를 담아내는 독자적 서사 양식을 창조하였다. 특히 자연과 인간의 관계에 대한 깊은 사유는 「토지」를 관통하는 철학적 주제로, 박경리는 인간이 자연의 일부로서 생명의 순환에 참여하는 존재임을 반복적으로 강조한다. 이러한 생명 사상은 근대적 진보관이 자연을 정복의 대상으로 전락시킨 데 대한 비판적 성찰을 내포하며, 오늘날의 생태주의적 관점에서도 시의적절한 문제 제기를 담고 있다. 또한 「토지」는 여성 인물들의 주체적 삶을 형상화함으로써, 가부장적 사회 구조 속에서도 자기 결정권을 행사하며 역사의 주체로 성장하는 여성상을 제시하였다는 점에서 페미니즘 비평의 관점에서도 높은 평가를 받고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "「토지」에서 서희의 삶이 지니는 이중적 서사적 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "가문의 몰락과 재건이라는 개인적 서사인 동시에, 봉건 사회의 해체와 근대적 질서의 형성이라는 역사적 전환을 체현하는 알레고리이기도 하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "「토지」의 인물 형상화가 역사 소설의 일반적 한계를 넘어서는 지점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "역사 소설이 흔히 빠지기 쉬운 도식적 인물 묘사의 한계를 넘어선 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "서희의 땅 회복 노력이 단순한 재산 회복 이상의 의미를 갖는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "뿌리 뽑힌 존재가 자신의 정체성을 재구성하는 과정으로 읽힌다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "토지의 상실과 회복이 연결되는 더 큰 주제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "민족적 정체성의 상실과 회복이라는 보다 큰 주제와 연결된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "박경리의 생명 사상이 지닌 비판적 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "근대적 진보관이 자연을 정복의 대상으로 전락시킨 데 대한 비판적 성찰을 내포하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "「토지」가 페미니즘 비평에서 높은 평가를 받는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "가부장적 사회 구조 속에서도 자기 결정권을 행사하며 역사의 주체로 성장하는 여성상을 제시하였다는 점에서")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(54, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 55: 비문학 (NONFICTION) — 행동경제학과 합리성의 한계 ───
function buildDay55() {
  const paragraphs = [
    {
      id: "p1",
      text: "전통 경제학은 인간을 합리적 경제인, 즉 호모 에코노미쿠스로 가정해 왔다. 이 모형에서 인간은 완전한 정보를 바탕으로 효용을 극대화하는 방향으로 의사 결정을 내리는 존재이다. 그러나 행동경제학은 실제 인간의 의사 결정이 이러한 합리성 가정에서 체계적으로 이탈한다는 사실을 실험적으로 입증하면서 등장하였다. 카너먼과 트버스키가 1979년 발표한 전망 이론은 행동경제학의 이론적 토대를 마련한 것으로 평가된다. 전망 이론에 따르면 인간은 절대적 부의 수준이 아니라 특정 준거점으로부터의 변화에 따라 가치를 평가하며, 동일한 크기의 이익과 손실에 대해 비대칭적으로 반응한다. 구체적으로, 손실에서 느끼는 고통의 크기가 동일한 크기의 이익에서 느끼는 기쁨보다 약 두 배 더 크다는 손실 회피 현상이 체계적으로 관찰된다."
    },
    {
      id: "p2",
      text: "카너먼은 인간의 사고를 직관적이고 빠른 시스템 1과 분석적이고 느린 시스템 2로 구분하는 이중 과정 이론을 제시하였다. 시스템 1은 자동적이고 무의식적으로 작동하여 신속한 판단을 가능하게 하지만, 다양한 인지적 편향에 취약하다. 반면 시스템 2는 의식적 노력을 요구하는 분석적 사고로, 정확한 판단을 내릴 수 있으나 인지적 자원의 소모가 크기 때문에 일상적 상황에서는 시스템 1에 의존하는 경향이 있다. 이러한 이중 과정 이론은 인간이 왜 체계적으로 비합리적 판단을 내리는지를 설명하는 틀로 기능한다. 대표성 휴리스틱은 시스템 1이 야기하는 대표적 편향으로, 사람들이 표본의 특성이 모집단을 대표한다고 과잉 일반화하는 경향을 말한다. 예컨대 동전 던지기에서 앞면이 다섯 번 연속 나온 후 뒷면이 나올 확률이 높다고 판단하는 것은, 무작위 과정에 패턴을 부여하려는 대표성 휴리스틱의 작동 결과이다."
    },
    {
      id: "p3",
      text: "행동경제학의 실천적 응용으로 가장 주목받는 개념은 탈러와 선스타인이 제안한 넛지이다. 넛지란 선택의 자유를 제한하지 않으면서도 예측 가능한 방향으로 행동을 유도하는 선택 설계의 방법을 의미한다. 예컨대 구내식당에서 건강한 음식을 눈높이에 배치하고 그렇지 않은 음식을 덜 눈에 띄는 곳에 배치하는 것은, 선택권을 박탈하지 않으면서 건강한 식습관을 유도하는 넛지의 사례이다. 연금 저축에 자동 가입 후 탈퇴를 허용하는 옵트아웃 방식은 가입률을 극적으로 높이는 효과가 있는데, 이는 현상 유지 편향과 기본값 효과를 활용한 정책 설계이다. 넛지의 이론적 기반은 자유주의적 온정주의로, 이는 개인의 선택 자유를 존중하면서도 그들이 더 나은 결과를 얻을 수 있도록 선택 환경을 설계하는 것이 정당화될 수 있다는 입장이다."
    },
    {
      id: "p4",
      text: "행동경제학에 대한 비판도 다양하게 제기된다. 우선 실험실에서 관찰된 인지적 편향이 실제 시장에서도 동일하게 나타나는지에 대한 외적 타당성의 문제가 있다. 시장에서는 경쟁과 학습을 통해 편향이 교정될 수 있으며, 개인 수준의 비합리성이 반드시 시장 수준의 비효율로 이어지지 않는다는 반론이 존재한다. 또한 넛지에 대해서는 정부나 기업이 무엇이 개인에게 더 나은 선택인지를 결정할 수 있다는 전제에 대한 우려가 제기된다. 이는 개인의 자율성과 다양한 가치관을 존중해야 한다는 자유주의적 원칙과 긴장 관계에 놓이게 된다. 그럼에도 행동경제학은 전통적 경제학의 비현실적 가정을 경험적으로 교정하고, 인간의 실제 행동에 기반한 보다 현실적인 경제 모형의 구축에 기여하였다는 점에서 경제학의 지적 지평을 넓힌 중요한 학문적 성취로 평가된다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "전망 이론에서 인간이 가치를 평가하는 방식은 전통 경제학과 어떻게 다른가?",
      answerRanges: [findRange(paragraphs, "p1", "인간은 절대적 부의 수준이 아니라 특정 준거점으로부터의 변화에 따라 가치를 평가하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "손실 회피 현상의 구체적 내용은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "손실에서 느끼는 고통의 크기가 동일한 크기의 이익에서 느끼는 기쁨보다 약 두 배 더 크다는 손실 회피 현상이 체계적으로 관찰된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "일상적 상황에서 시스템 1에 의존하게 되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "인지적 자원의 소모가 크기 때문에 일상적 상황에서는 시스템 1에 의존하는 경향이 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "넛지의 이론적 기반인 자유주의적 온정주의의 핵심 입장은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "개인의 선택 자유를 존중하면서도 그들이 더 나은 결과를 얻을 수 있도록 선택 환경을 설계하는 것이 정당화될 수 있다는 입장이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "행동경제학의 실험 결과에 대해 제기되는 외적 타당성 문제는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "개인 수준의 비합리성이 반드시 시장 수준의 비효율로 이어지지 않는다는 반론이 존재한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "행동경제학이 경제학에 기여한 핵심적 성취는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p4", "전통적 경제학의 비현실적 가정을 경험적으로 교정하고, 인간의 실제 행동에 기반한 보다 현실적인 경제 모형의 구축에 기여하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(55, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs);
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

  const paraSentMap = {};
  for (const p of paragraphs) {
    paraSentMap[p.id] = findSentences(p.text);
  }

  for (const para of paragraphs) {
    const sentences = paraSentMap[para.id];

    for (let si = 0; si < sentences.length; si++) {
      const sent = sentences[si];
      const correctText = truncate(sent.text, 80);

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

    const firstSent = sentences[0];
    const centralCorrect = truncate(firstSent.text, 80);
    const centralWrongs = [];
    const otherParas2 = paragraphs.filter(p => p.id !== para.id);
    for (const op of otherParas2) {
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
  const pos = hashIdx(seed) % 4;
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
  console.log("=== 비트겐슈타인3 Day 51~55 빌드 시작 ===\n");

  const contents = [
    buildDay51(),
    buildDay52(),
    buildDay53(),
    buildDay54(),
    buildDay55()
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
  console.log("\nstatic 파일 생성 중...");
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

  const dayIndices = [51, 52, 53, 54, 55];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1;
    const subArea = contents[i].subArea;
    const batchItem = wrapBatchItem(contents[i], dayIdx, subArea);

    if (batchData.items[batchIdx]) {
      console.log(`교체: items[${batchIdx}] (${batchData.items[batchIdx].content.contentId} → ${contents[i].contentId})`);
    }
    batchData.items[batchIdx] = batchItem;
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료`);

  console.log("\n=== 빌드 완료 ===");
}

main();
