#!/usr/bin/env node
// 러셀2 Day 51~55 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION(비문학), 짝수 Day = LITERATURE(문학)
// 목표 글자수: 1200자 ±50 (1150~1250)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-russell2.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/russell2');

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

// ─── Day 51: 비문학 (NONFICTION) — 소리의 전달 원리와 방음 기술 (물리학) ───
function buildDay51() {
  const paragraphs = [
    {
      id: "p1",
      text: "소리는 물체의 진동이 주변 매질을 통해 전달되는 파동 현상이다. 북을 치면 북의 가죽이 진동하고, 이 진동이 주변 공기 분자를 밀었다 당겼다 하면서 압력의 변화가 파동 형태로 퍼져 나간다. 이 압력 변화가 우리 귀의 고막에 도달하면 고막이 진동하고, 이 진동이 달팽이관 속의 청각 세포를 자극하여 뇌가 소리로 인식하게 된다. 소리는 공기뿐 아니라 물이나 금속 같은 다른 매질에서도 전달된다. 매질이 밀도가 높고 탄성이 클수록 소리의 전달 속도가 빨라진다. 공기 중에서 소리의 속도는 초당 약 삼백사십 미터이지만, 물속에서는 약 천오백 미터, 철 속에서는 약 오천 미터에 이른다. 반면 진공 상태에서는 매질이 없으므로 소리가 전혀 전달되지 않는다."
    },
    {
      id: "p2",
      text: "소리에는 세 가지 중요한 물리적 특성이 있다. 첫째, 진동수는 소리의 높낮이를 결정한다. 진동수란 일 초 동안 진동하는 횟수를 말하며 단위는 헤르츠이다. 진동수가 높으면 높은 소리가, 낮으면 낮은 소리가 난다. 사람이 들을 수 있는 진동수의 범위는 대략 이십 헤르츠에서 이만 헤르츠 사이이다. 둘째, 진폭은 소리의 크기를 결정한다. 진폭이란 진동의 최대 변위를 뜻하며, 진폭이 클수록 소리가 크게 들린다. 일상에서 소리의 크기는 데시벨이라는 단위로 측정하는데, 일반적인 대화 소리는 약 육십 데시벨, 지하철 소음은 약 팔십 데시벨 수준이다. 셋째, 파형은 소리의 음색을 결정한다. 같은 높이와 크기의 소리라도 파형에 따라 피아노 소리와 바이올린 소리를 구별할 수 있는 것은 악기마다 만들어 내는 파형의 모양이 다르기 때문이다."
    },
    {
      id: "p3",
      text: "현대 건축에서는 소리의 성질을 이용한 방음 기술이 다양하게 활용된다. 방음의 기본 원리는 소리 에너지를 반사, 흡수, 차단하는 것이다. 두꺼운 콘크리트 벽은 소리를 차단하는 데 효과적이지만, 무겁고 공간을 많이 차지하는 단점이 있다. 이를 보완하기 위해 개발된 것이 다층 구조 방음벽이다. 이 벽은 밀도가 다른 여러 재료를 겹겹이 쌓아 소리가 각 층을 통과할 때마다 에너지가 줄어들도록 설계되어 있다. 또한 스튜디오나 공연장에서는 흡음재를 벽과 천장에 부착하여 소리의 반사를 줄이고, 울림을 조절한다. 도로변 방음벽은 소리의 진행 경로를 차단하여 소음이 주거 지역으로 전달되는 것을 막는다. 최근에는 능동형 소음 제어 기술도 발전하고 있다. 이 기술은 소음과 정반대 위상의 소리를 발생시켜 두 파동이 상쇄 간섭을 일으키도록 하여 소음을 줄이는 원리를 활용한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "소리가 전달되는 기본 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "물체의 진동이 주변 매질을 통해 전달되는 파동 현상이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "진공 상태에서 소리가 전달되지 않는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "진공 상태에서는 매질이 없으므로 소리가 전혀 전달되지 않는다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "소리의 높낮이를 결정하는 물리적 특성은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "진동수는 소리의 높낮이를 결정한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "같은 높이와 크기의 소리에서 악기를 구별할 수 있는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "악기마다 만들어 내는 파형의 모양이 다르기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "다층 구조 방음벽의 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "밀도가 다른 여러 재료를 겹겹이 쌓아 소리가 각 층을 통과할 때마다 에너지가 줄어들도록 설계되어 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "능동형 소음 제어 기술이 소음을 줄이는 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "소음과 정반대 위상의 소리를 발생시켜 두 파동이 상쇄 간섭을 일으키도록 하여 소음을 줄이는 원리를 활용한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(51, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 52: 문학 (LITERATURE) — 도서관에서 만난 낯선 책 (수필) ───
function buildDay52() {
  const paragraphs = [
    {
      id: "p1",
      text: "중학교 이 학년 겨울, 나는 동네 도서관에 처음 발을 들였다. 시험 기간에 공부할 조용한 장소가 필요했을 뿐, 책을 읽으러 간 것은 아니었다. 열람실 자리가 꽉 차 있어서 할 수 없이 일반 서가 쪽으로 갔다. 책장 사이 좁은 통로에 놓인 낡은 의자에 앉아 수학 문제집을 펼쳤지만, 집중이 되지 않았다. 눈앞 선반에 빼곡히 꽂힌 책등이 자꾸 시선을 끌었기 때문이다. 나는 아무 생각 없이 가장 가까이에 꽂혀 있던 책 한 권을 뽑았다. 낡은 표지에 제목이 거의 지워져 있었고, 첫 장을 펼치니 누렇게 바랜 종이에서 오래된 잉크 냄새가 났다. 책 안쪽에는 빌려 간 날짜가 찍힌 대출 카드가 끼워져 있었는데, 마지막 대출 날짜는 십이 년 전이었다. 십이 년 동안 아무도 이 책을 펼쳐 보지 않았다는 사실이 묘하게 마음을 끌었다."
    },
    {
      id: "p2",
      text: "그 책은 이름 모를 작가가 쓴 짧은 소설집이었다. 첫 번째 이야기는 작은 섬에 사는 등대지기가 매일 밤 불을 켜며 바다를 바라보는 내용이었다. 등대지기에게는 손님도, 친구도 없었지만, 그는 외롭지 않다고 말했다. 등대 불빛이 멀리 항해하는 배들에게 닿는다는 사실 하나만으로 자신의 존재에 의미가 있다고 느꼈기 때문이다. 나는 그 문장을 읽고 한참 동안 멍하니 앉아 있었다. 누군가에게 직접 보이지 않더라도 빛을 보내는 것만으로 가치가 있다는 생각이 위로가 되었다. 시험 성적 때문에 위축되어 있던 마음이 조금은 가벼워진 것은 분명했다. 수학 문제집은 가방 안에 그대로 있었고, 나는 해가 질 때까지 그 소설집을 읽었다."
    },
    {
      id: "p3",
      text: "집에 돌아오는 길에 그 책을 대출해 왔다. 일주일 동안 나머지 이야기들을 천천히 읽었는데, 어느 이야기든 큰 사건 없이 잔잔하게 흘러갔지만 읽고 나면 가슴속에 따뜻한 무엇이 남았다. 반납하러 도서관에 갔을 때 사서 선생님이 재미있었냐고 물으셨고, 나는 재미있었다기보다 좋았다고 대답했다. 선생님은 빙그레 웃으며 그런 책이 진짜 좋은 책이라고 말씀하셨다. 그 뒤로 나는 시험 기간이 아니어도 도서관에 가게 되었고, 서가 사이를 천천히 거닐며 잊힌 책들을 찾아 읽는 것이 습관이 되었다. 돌이켜 보면 그 소설집의 작가 이름은 여전히 기억나지 않고 인터넷에서 검색해도 나오지 않는다. 하지만 이름 없는 작가가 조용히 써 놓은 이야기가 십이 년의 먼지를 뚫고 한 중학생의 마음에 닿았다는 것 자체가 등대지기의 불빛과 닮아 있다. 누군가의 진심이 담긴 글은 읽는 사람이 한 명뿐이라도 빛을 잃지 않는다는 것을 나는 그 낡은 소설집을 통해 배웠다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "'나'가 도서관에 처음 간 원래 목적은 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p1", "시험 기간에 공부할 조용한 장소가 필요했을 뿐, 책을 읽으러 간 것은 아니었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "'나'가 낡은 책에 관심을 갖게 된 계기는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "십이 년 동안 아무도 이 책을 펼쳐 보지 않았다는 사실이 묘하게 마음을 끌었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "등대지기가 외롭지 않다고 느끼는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "등대 불빛이 멀리 항해하는 배들에게 닿는다는 사실 하나만으로 자신의 존재에 의미가 있다고 느꼈기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "사서 선생님이 '진짜 좋은 책'이라고 말한 맥락은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "재미있었다기보다 좋았다고 대답했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "그 겨울 이후 '나'에게 생긴 변화는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "시험 기간이 아니어도 도서관에 가게 되었고, 서가 사이를 천천히 거닐며 잊힌 책들을 찾아 읽는 것이 습관이 되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "'나'가 낡은 소설집을 통해 배운 핵심 교훈은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "누군가의 진심이 담긴 글은 읽는 사람이 한 명뿐이라도 빛을 잃지 않는다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(52, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 53: 비문학 (NONFICTION) — 플라스틱 재활용의 과학과 한계 (환경과학) ───
function buildDay53() {
  const paragraphs = [
    {
      id: "p1",
      text: "플라스틱은 가볍고 튼튼하며 가격이 저렴하여 현대 사회에서 가장 많이 사용되는 소재 중 하나이다. 전 세계적으로 매년 약 사억 톤에 가까운 플라스틱이 생산되며, 그중 절반 이상이 일회용 포장재로 쓰인 뒤 버려진다. 플라스틱의 주원료는 석유에서 추출한 고분자 화합물로, 긴 사슬 형태의 분자 구조를 가지고 있어 자연 상태에서 분해되기까지 수백 년이 걸린다. 바다에 유입된 플라스틱은 자외선과 파도의 작용으로 미세 플라스틱이라 불리는 오 밀리미터 이하의 작은 조각으로 부서지지만, 완전히 분해되지는 않는다. 이 미세 플라스틱은 해양 생물의 체내에 축적되고, 먹이 사슬을 따라 최종적으로 인간의 식탁까지 도달하는 것으로 보고되고 있다. 따라서 플라스틱 폐기물 문제를 해결하기 위한 재활용 기술의 발전은 현대 사회의 시급한 과제이다."
    },
    {
      id: "p2",
      text: "플라스틱 재활용은 크게 기계적 재활용과 화학적 재활용으로 나뉜다. 기계적 재활용은 사용된 플라스틱을 수거하여 세척하고 파쇄한 뒤 녹여서 새로운 제품으로 성형하는 방법이다. 이 방식은 비교적 간단하고 비용이 적게 들지만, 재활용 과정에서 플라스틱의 분자 사슬이 끊어져 품질이 떨어지는 한계가 있다. 재활용을 반복할수록 강도와 투명도가 저하되어 결국 더 이상 제품으로 만들 수 없는 상태에 이른다. 또한 서로 다른 종류의 플라스틱이 섞이면 재활용 자체가 불가능해지기 때문에 수거 단계에서의 분리 배출이 매우 중요하다. 반면 화학적 재활용은 플라스틱을 분자 수준으로 분해하여 원래의 원료 물질로 되돌리는 기술이다. 열분해 방식은 고온에서 플라스틱을 가열하여 석유와 유사한 기름을 얻고, 해중합 방식은 특정 촉매를 이용하여 고분자를 단위체로 분리한다."
    },
    {
      id: "p3",
      text: "화학적 재활용은 기계적 재활용의 한계를 극복할 수 있는 기술로 주목받고 있으나, 아직 상용화 단계에서는 여러 어려움이 존재한다. 열분해 과정에서 높은 에너지가 소모되고, 분해 산물에 불순물이 섞여 순도를 높이기 위한 추가 공정이 필요하다. 경제적으로도 새 플라스틱을 석유에서 직접 만드는 것보다 화학적 재활용의 비용이 더 높아 기업들이 도입을 주저하고 있다. 이러한 한계를 보완하기 위해 각국 정부는 생산자 책임 재활용 제도를 시행하여 플라스틱을 생산하는 기업에 재활용 비용을 분담하게 하고 있으며, 소비자들에게는 분리 배출 교육을 강화하고 있다. 궁극적으로는 플라스틱 사용 자체를 줄이고, 생분해성 소재나 종이 기반 대체재를 개발하여 환경에 미치는 부담을 근본적으로 낮추는 방향으로 나아가야 한다는 것이 전문가들의 공통된 견해이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "플라스틱이 자연에서 분해되기까지 걸리는 시간은 대략 얼마인가?",
      answerRanges: [findRange(paragraphs, "p1", "자연 상태에서 분해되기까지 수백 년이 걸린다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "미세 플라스틱이 인간에게까지 도달하는 경로는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "해양 생물의 체내에 축적되고, 먹이 사슬을 따라 최종적으로 인간의 식탁까지 도달하는 것으로 보고되고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "기계적 재활용의 한계는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "재활용 과정에서 플라스틱의 분자 사슬이 끊어져 품질이 떨어지는 한계가 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "화학적 재활용 중 열분해 방식이란 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "열분해 방식은 고온에서 플라스틱을 가열하여 석유와 유사한 기름을 얻고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "기업들이 화학적 재활용 도입을 주저하는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "새 플라스틱을 석유에서 직접 만드는 것보다 화학적 재활용의 비용이 더 높아 기업들이 도입을 주저하고 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "플라스틱 문제 해결을 위한 궁극적 방향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "플라스틱 사용 자체를 줄이고, 생분해성 소재나 종이 기반 대체재를 개발하여 환경에 미치는 부담을 근본적으로 낮추는 방향으로 나아가야 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(53, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 54: 문학 (LITERATURE) — 할아버지의 장기판 (수필) ───
function buildDay54() {
  const paragraphs = [
    {
      id: "p1",
      text: "할아버지 방에는 늘 장기판이 놓여 있었다. 나무로 깎아 만든 오래된 장기판은 군데군데 칠이 벗겨져 있었고, 말들은 꽤 닳아서 글씨가 희미했지만, 할아버지는 그것을 보물처럼 아끼셨다. 어린 시절 명절마다 할아버지 댁에 가면, 삼촌들과 아버지가 장기를 두었고, 나는 옆에서 구경했다. 장기의 규칙을 하나도 모르면서도 붉은 말과 푸른 말이 판 위를 오가는 모습이 재미있었다. 할아버지는 마루에 앉아 부채를 부치며 대국을 지켜보시다가 이따금 한마디씩 훈수를 놓으셨다. 훈수를 들은 쪽이 이기기도 하고 지기도 했지만, 모든 대국이 끝난 뒤에는 언제나 웃음소리가 방 안을 가득 채웠다. 내가 초등학교 사 학년이 되던 해 설날, 할아버지가 나를 불러 장기를 가르쳐 주셨다. 졸의 움직임부터 시작해서 차, 포, 마, 상의 행마법까지 하나하나 알려 주셨다."
    },
    {
      id: "p2",
      text: "할아버지와 첫 대국을 두었을 때, 나는 열 수도 안 돼서 졌다. 분해서 다시 해 달라고 졸랐고, 할아버지는 웃으며 판을 다시 깔아 주셨다. 두 번째 대국에서도 졌지만, 처음보다는 오래 버텼다. 할아버지는 장기는 한 수 한 수에 이유가 있어야 한다고 말씀하셨다. 아무 생각 없이 말을 놓으면 상대에게 빈틈을 내주는 것이고, 다음 수를 내다보며 두어야 진짜 실력이라고 하셨다. 나는 그 말씀을 새겨들으며 명절 때마다 할아버지와 장기를 두었다. 해가 갈수록 대국 시간이 길어졌고, 중학교에 올라갈 무렵에는 가끔 할아버지를 이길 수 있게 되었다. 내가 이기면 할아버지는 호탕하게 웃으시며 이제 제법이라고 칭찬해 주셨다. 지금 돌이켜 보면 할아버지가 일부러 져 주신 것은 아닌가 싶기도 하지만, 어쨌든 그 칭찬이 나를 기쁘게 한 것은 사실이다."
    },
    {
      id: "p3",
      text: "고등학교에 들어가면서 명절에도 할아버지 댁에 가기가 쉽지 않았다. 학원 일정과 시험 때문에 설날과 추석에도 하루만 다녀오거나 아예 가지 못하는 해가 생겼다. 전화로 안부를 전하면 할아버지는 괜찮다, 공부 열심히 하라고만 말씀하셨다. 대학 입학 후에는 더 뜸해졌고, 할아버지와 장기를 둔 것이 언제인지도 기억이 가물가물해졌다. 그러던 어느 날 어머니에게서 전화가 왔다. 할아버지가 편찮으시다는 소식이었다. 급히 내려간 병원에서 할아버지는 작은 보따리 하나를 건네셨다. 안에는 그 오래된 장기판과 말들이 들어 있었다. 할아버지는 이거 네가 가지라고 짧게 말씀하셨다. 나는 아무 말도 하지 못하고 장기판을 가슴에 안았다. 닳아서 글씨가 흐릿한 장기 말을 손가락으로 쓸어 보니, 할아버지와 마주 앉아 두던 그 수많은 대국이 손끝에서 되살아나는 것 같았다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "할아버지가 장기판을 어떻게 대하셨는가?",
      answerRanges: [findRange(paragraphs, "p1", "할아버지는 그것을 보물처럼 아끼셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "'나'가 처음 장기를 배운 것은 몇 학년 때인가?",
      answerRanges: [findRange(paragraphs, "p1", "내가 초등학교 사 학년이 되던 해 설날")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "할아버지가 장기에 대해 가르쳐 주신 핵심 교훈은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "장기는 한 수 한 수에 이유가 있어야 한다고 말씀하셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "'나'가 할아버지를 이겼을 때 할아버지의 반응은 어떠하였는가?",
      answerRanges: [findRange(paragraphs, "p2", "할아버지는 호탕하게 웃으시며 이제 제법이라고 칭찬해 주셨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "고등학교 이후 '나'가 할아버지 댁에 가기 어려웠던 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "학원 일정과 시험 때문에 설날과 추석에도 하루만 다녀오거나 아예 가지 못하는 해가 생겼다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "병원에서 할아버지가 '나'에게 건넨 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "안에는 그 오래된 장기판과 말들이 들어 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(54, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 55: 비문학 (NONFICTION) — 한글 자판의 역사와 설계 원리 (기술·문화) ───
function buildDay55() {
  const paragraphs = [
    {
      id: "p1",
      text: "오늘날 대부분의 한국인이 사용하는 한글 자판은 두벌식 표준 자판이다. 두벌식이란 자음과 모음을 두 묶음으로 나누어 배치한 방식을 말하며, 왼손 영역에 자음을, 오른손 영역에 모음을 놓는 것이 기본 구조이다. 이 배열은 1969년 과학기술처 산하 기관에서 처음 제안되었고, 1982년에 정부 표준으로 지정되어 오늘날까지 이어지고 있다. 두벌식의 장점은 한글의 자음과 모음을 번갈아 입력하는 구조 덕분에 양손을 균형 있게 사용할 수 있다는 것이다. 한국어 음절은 초성, 중성, 종성으로 구성되므로 자연스럽게 좌우 손이 교대로 움직이게 되어 입력 속도가 빠르다. 다만 두벌식에는 종성과 다음 음절의 초성을 구분하기 위한 오토마타라는 소프트웨어 처리 과정이 필요하다. 예를 들어 한글이라는 단어를 입력할 때 종성 ㄴ과 다음 초성 ㄱ의 경계를 프로그램이 자동으로 판별한다."
    },
    {
      id: "p2",
      text: "두벌식 외에도 세벌식 자판이 있다. 세벌식은 초성, 중성, 종성을 각각 별도의 글쇠 묶음으로 배치한 방식으로, 공병우 박사가 고안하였다. 이 자판에서는 초성 ㄱ과 종성 ㄱ이 서로 다른 글쇠에 배치되어 있기 때문에 오토마타 없이도 음절 경계가 자동으로 구분된다. 따라서 입력 오류가 적고, 타자기 시절부터 기계적 구현이 용이하였다. 세벌식 사용자들은 연타 속도가 빠르고 오타율이 낮다는 점을 강조한다. 그러나 세벌식은 글쇠 수가 더 많아 처음 배우는 사람에게는 진입 장벽이 높고, 이미 두벌식이 표준으로 굳어져 교육 과정과 공공 기관 대부분이 두벌식을 채택하고 있어 전환 비용이 크다는 현실적 한계가 있다. 그 결과 세벌식은 소수의 전문 사용자 사이에서 사용되고 있을 뿐 대중적으로 확산되지 못하고 있다."
    },
    {
      id: "p3",
      text: "스마트폰 시대에 접어들면서 한글 입력 방식은 더욱 다양해졌다. 작은 화면에서 스무여 개의 글쇠를 모두 배치하기 어렵기 때문에 천지인, 나랏글, 스카이 등 여러 방식이 개발되었다. 천지인 자판은 하늘, 땅, 사람을 뜻하는 세 가지 기본 획을 조합하여 모음을 만드는 원리로, 한글 창제 원리인 천지인 삼재를 현대적으로 재해석한 것이다. 이 자판은 열두 개의 글쇠만으로 모든 한글을 입력할 수 있어 피처폰 시대에 널리 사용되었다. 반면 현재 스마트폰에서는 화면이 커지면서 컴퓨터와 동일한 두벌식 쿼티 배열을 사용하는 비율이 높아지고 있다. 한글 자판의 역사는 기술 환경의 변화에 따라 사용자의 편의와 효율을 끊임없이 추구해 온 과정이며, 한글의 과학적 구조가 다양한 입력 방식의 설계를 가능하게 한 밑바탕이 되었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "두벌식 자판에서 자음과 모음은 어떻게 배치되어 있는가?",
      answerRanges: [findRange(paragraphs, "p1", "왼손 영역에 자음을, 오른손 영역에 모음을 놓는 것이 기본 구조이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "두벌식에서 종성과 초성을 구분하기 위해 필요한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "종성과 다음 음절의 초성을 구분하기 위한 오토마타라는 소프트웨어 처리 과정이 필요하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "세벌식 자판을 고안한 사람은 누구인가?",
      answerRanges: [findRange(paragraphs, "p2", "공병우 박사가 고안하였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "세벌식이 대중적으로 확산되지 못한 현실적 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "이미 두벌식이 표준으로 굳어져 교육 과정과 공공 기관 대부분이 두벌식을 채택하고 있어 전환 비용이 크다는 현실적 한계가 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "천지인 자판의 모음 입력 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "하늘, 땅, 사람을 뜻하는 세 가지 기본 획을 조합하여 모음을 만드는 원리로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "한글 자판 역사의 핵심을 한마디로 요약하면 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "한글의 과학적 구조가 다양한 입력 방식의 설계를 가능하게 한 밑바탕이 되었다")],
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
  const contentId = `dr-r2-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(러셀 2) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "RUSSELL_2",
    schoolGradeRange: { min: 8, max: 9 },
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
    level_id: "RUSSELL_2",
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
  console.log("=== 러셀2 Day 51~55 빌드 시작 ===\n");

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
    if (len < 1150 || len > 1250) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1150~1250)`);
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

  // 배치 파일 갱신 (items[50]~items[54])
  console.log("\n배치 파일 갱신 중...");
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`현재 배치 items 수: ${batchData.items.length}`);

  const dayIndices = [51, 52, 53, 54, 55];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1; // items[50]~items[54]
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
