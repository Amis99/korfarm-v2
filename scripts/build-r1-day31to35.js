#!/usr/bin/env node
// 러셀1 Day 31~35 일일독해 콘텐츠 빌더
// 홀수 Day = NONFICTION (비문학), 짝수 Day = LITERATURE (문학)
// 목표 글자수: 1100자 ±50 (1050~1150)
// 3개 문단 구성, 중1~중2 수준 어휘

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-russell1.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/russell1');

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

// ─── Day 31: 비문학 (NONFICTION) — 인공위성의 원리 ───
function buildDay31() {
  const paragraphs = [
    {
      id: "p1",
      text: "밤하늘을 올려다보면 별처럼 천천히 움직이는 빛을 발견할 때가 있다. 그것은 대부분 지구 주위를 돌고 있는 인공위성이다. 인공위성이란 사람이 만들어 로켓으로 쏘아 올려 지구 궤도에 올려놓은 물체를 말한다. 인공위성이 떨어지지 않고 지구 주위를 계속 돌 수 있는 이유는 무엇일까? 그 비밀은 바로 속도에 있다. 인공위성은 지구의 중력에 의해 항상 아래쪽으로 끌어당겨지고 있지만, 동시에 매우 빠른 속도로 옆 방향으로 나아가고 있다. 이 두 힘이 적절한 균형을 이루면 인공위성은 지구를 중심으로 원을 그리며 떨어지지 않고 계속 돌게 된다. 이러한 원리는 뉴턴이 발견한 만유인력의 법칙으로 설명할 수 있으며, 지구뿐 아니라 달이나 다른 행성 주위를 도는 인공위성에도 동일하게 적용된다."
    },
    {
      id: "p2",
      text: "인공위성은 지구로부터의 높이에 따라 그 역할이 크게 달라진다. 지표면에서 약 200~2000킬로미터 높이에 있는 위성을 저궤도 위성이라고 하는데, 이 위성은 지구 표면을 가까이에서 관찰할 수 있어 날씨를 예측하거나 지형을 촬영하는 데 주로 쓰인다. 반면에 약 36000킬로미터 높이에 있는 정지 궤도 위성은 지구의 자전 속도와 같은 속도로 돌기 때문에 항상 같은 지점 위에 머무르는 것처럼 보인다. 이런 특성 덕분에 텔레비전 방송 신호를 보내거나 넓은 지역의 기상 관측을 하는 데 활용된다. 또한 위성 항법 장치에 사용되는 위성은 중궤도에 위치하며, 여러 대가 동시에 함께 작동하여 우리가 있는 위치를 정확하게 알려 준다."
    },
    {
      id: "p3",
      text: "오늘날 인공위성은 우리 생활 곳곳에서 광범위하게 활용되고 있다. 스마트폰의 지도 서비스, 일기 예보, 인터넷 통신, 재난 감시 등 인공위성 없이는 불가능한 일들이 매우 많다. 그런데 인공위성의 수가 빠르게 늘어나면서 새로운 문제도 생기고 있다. 수명이 다한 위성이나 위성 파편이 우주 공간에 그대로 남아 우주 쓰레기가 되기 때문이다. 현재 지구 궤도에는 수천 개의 우주 쓰레기가 빠른 속도로 떠돌고 있으며, 이것들이 작동 중인 위성이나 국제 우주 정거장과 충돌할 위험이 있다. 아주 작은 파편이라도 초속 수 킬로미터의 속도로 움직이기 때문에 그 충격은 매우 크다. 이를 해결하기 위해 세계 각국에서는 우주 쓰레기를 수거하는 기술을 적극적으로 개발하고 있다. 인공위성의 기술이 발전하는 만큼 우주 환경을 깨끗하게 지키려는 노력도 함께 이루어져야 할 것이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "인공위성이 떨어지지 않고 지구 주위를 계속 도는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "이 두 힘이 적절한 균형을 이루면 인공위성은 지구를 중심으로 원을 그리며 떨어지지 않고 계속 돌게 된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "저궤도 위성이 주로 사용되는 분야는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "날씨를 예측하거나 지형을 촬영하는 데 주로 쓰인다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "정지 궤도 위성이 항상 같은 지점 위에 머무르는 것처럼 보이는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "지구의 자전 속도와 같은 속도로 돌기 때문에 항상 같은 지점 위에 머무르는 것처럼 보인다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "우주 쓰레기가 생기는 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "수명이 다한 위성이나 위성 파편이 우주 공간에 그대로 남아 우주 쓰레기가 되기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "작은 우주 쓰레기 파편이라도 위험한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "초속 수 킬로미터의 속도로 움직이기 때문에 그 충격은 매우 크다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "인공위성 기술 발전과 함께 이루어져야 할 노력은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "우주 환경을 깨끗하게 지키려는 노력도 함께 이루어져야 할 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(31, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 32: 문학 (LITERATURE) — 전학 온 아이와의 우정 ───
function buildDay32() {
  const paragraphs = [
    {
      id: "p1",
      text: "3월의 어느 날, 우리 반에 전학생이 왔다. 선생님이 앞에 세워 소개해 주셨지만 그 아이는 고개를 숙인 채 작은 목소리로 인사했다. 이름은 서준이였다. 서준이는 빈자리였던 내 옆자리에 앉았는데, 쉬는 시간에도 아무에게도 말을 걸지 않고 혼자 책만 읽었다. 나는 말을 걸고 싶었지만 왠지 먼저 다가가기가 쉽지 않았다. 그런데 점심시간에 서준이가 급식실 앞에서 어디로 가야 할지 몰라 서 있는 모습을 보았다. 나는 용기를 내어 서준이에게 다가가 같이 가자고 말했다. 서준이는 놀란 표정을 짓더니 곧 환하게 웃으며 고맙다고 했다. 그 순간 본 서준이의 환한 웃음이 참 인상적이었다."
    },
    {
      id: "p2",
      text: "그날 이후 서준이와 나는 자연스럽게 가까워졌다. 서준이는 원래 부산에서 살았는데, 아버지의 직장 때문에 서울로 이사 오게 되었다고 했다. 사투리를 쓸 때마다 아이들이 웃어서 말을 아끼게 되었다는 이야기를 들었을 때, 나는 마음이 좀 아팠다. 그래서 나는 서준이에게 부산 말이 오히려 멋있고 친근하다고 말해 주었다. 서준이는 조금 부끄러운 듯 웃으면서 고향 이야기를 해 주기 시작했다. 바다가 보이는 학교에서 친구들과 방과 후에 해변에서 놀던 이야기, 할머니가 해 주시던 씨앗떡 이야기를 들으며 나도 부산에 꼭 가 보고 싶어졌다. 서준이의 표정이 고향 이야기를 할수록 점점 밝아지는 것을 보면서 나는 누군가의 이야기에 진심으로 귀를 기울이는 것만으로도 그 사람에게 큰 힘이 될 수 있다는 것을 느꼈다."
    },
    {
      id: "p3",
      text: "한 달쯤 지났을 때 체육 시간에 반 대항 축구 경기가 있었다. 서준이는 축구를 잘했지만 아직 반 아이들과 충분히 어울리지 못해 경기에 끼지 못하고 있었다. 나는 우리 편 아이들에게 서준이도 같이 하자고 적극적으로 제안했다. 경기가 시작되자 서준이는 빠른 발놀림으로 상대편 수비를 제치고 멋진 골을 넣었다. 그 순간 반 아이들이 모두 서준이에게 달려가 환호하며 어깨를 두드렸다. 서준이는 눈물이 글썽이면서도 활짝 웃고 있었다. 경기가 끝난 뒤 서준이가 내게 조용히 말했다. 네가 처음 급식실 앞에서 같이 가자고 했을 때 정말 고마웠어. 그 한마디가 나에게 얼마나 큰 위로가 되었는지 몰라. 나는 서준이의 말에 오히려 내가 더 많은 것을 배웠다고 대답했다. 낯선 곳에서도 용기를 잃지 않고 꿋꿋하게 버텨 낸 서준이의 모습이 나에게도 큰 힘이 되었기 때문이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "서준이가 쉬는 시간에 혼자 있었던 이유는 무엇이라고 짐작할 수 있는가?",
      answerRanges: [findRange(paragraphs, "p1", "쉬는 시간에도 아무에게도 말을 걸지 않고 혼자 책만 읽었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "서준이가 서울에 오게 된 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "아버지의 직장 때문에 서울로 이사 오게 되었다고 했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "서준이가 말을 아끼게 된 까닭은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "사투리를 쓸 때마다 아이들이 웃어서 말을 아끼게 되었다는 이야기를 들었을 때")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "나는 서준이의 이야기를 들으며 어떤 깨달음을 얻었는가?",
      answerRanges: [findRange(paragraphs, "p2", "누군가의 이야기에 진심으로 귀를 기울이는 것만으로도 그 사람에게 큰 힘이 될 수 있다는 것을 느꼈다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "축구 경기에서 골을 넣은 후 서준이의 반응은 어떠했는가?",
      answerRanges: [findRange(paragraphs, "p3", "서준이는 눈물이 글썽이면서도 활짝 웃고 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "내가 서준이에게 오히려 더 많은 것을 배웠다고 말한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "낯선 곳에서도 용기를 잃지 않고 꿋꿋하게 버텨 낸 서준이의 모습이 나에게도 큰 힘이 되었기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(32, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 33: 비문학 (NONFICTION) — 민주주의의 발전 ───
function buildDay33() {
  const paragraphs = [
    {
      id: "p1",
      text: "민주주의란 국민이 나라의 주인으로서 정치에 참여하는 제도를 말한다. 민주주의의 시작은 약 2500년 전 고대 그리스의 도시 국가 아테네로 거슬러 올라간다. 아테네에서는 시민이 직접 광장에 모여 나라의 중요한 문제를 토론하고 투표로 결정하였다. 이것을 직접 민주주의라고 한다. 그러나 아테네의 민주주의에는 큰 한계가 있었다. 여성, 외국인, 노예는 시민으로 인정받지 못해 정치에 참여할 수 없었기 때문이다. 즉 아테네의 민주주의는 일부 성인 남성만을 위한 제한적인 제도였던 셈이다. 그렇지만 국가의 중요한 결정을 시민이 직접 내린다는 생각 자체는 매우 혁신적이었고, 이것이 오늘날 민주주의의 뿌리가 되었다."
    },
    {
      id: "p2",
      text: "근대에 이르러 민주주의는 새로운 형태로 발전하였다. 인구가 늘어나고 국가의 규모가 커지면서 모든 시민이 한곳에 모여 토론하는 것이 현실적으로 불가능해졌기 때문이다. 그래서 시민들이 자신을 대신할 대표를 선거를 통해 뽑고, 그 대표가 의회에서 법을 만드는 대의 민주주의가 등장하였다. 영국에서는 1215년 대헌장을 시작으로 왕의 권력을 제한하고 의회의 권한을 키워 나갔다. 프랑스에서는 1789년 대혁명을 통해 자유, 평등, 박애의 가치를 내세우며 왕정을 무너뜨렸다. 미국에서는 1776년 독립 선언을 통해 모든 사람은 평등하게 태어났다는 원칙을 천명하였다. 이처럼 근대의 민주주의는 시민 혁명을 통해 왕이나 귀족의 권력을 견제하고, 국민의 기본적인 권리를 보장하는 방향으로 꾸준히 발전해 왔다."
    },
    {
      id: "p3",
      text: "오늘날의 민주주의는 단순히 선거에서 투표를 하는 것에 그치지 않는다. 현대 민주주의에서는 국민의 기본적인 권리를 헌법으로 보장하고, 권력이 한곳에 집중되지 않도록 삼권 분립의 원칙을 지킨다. 또한 언론의 자유, 집회의 자유, 표현의 자유를 통해 국민이 다양한 의견을 자유롭게 나눌 수 있도록 하고 있다. 민주주의가 제대로 작동하기 위해서는 시민 개개인의 관심과 적극적인 참여가 반드시 필요하다. 투표율이 낮아지거나 정치에 무관심한 사람이 늘어나면 민주주의는 제 기능을 다하기 어렵다. 따라서 민주주의는 한 번 만들어진 뒤 저절로 유지되는 것이 아니라, 시민 한 사람 한 사람의 꾸준한 관심과 참여를 통해 지켜 나가야 할 소중한 가치라 할 수 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "아테네 민주주의의 가장 큰 한계는 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p1", "여성, 외국인, 노예는 시민으로 인정받지 못해 정치에 참여할 수 없었기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "아테네 민주주의가 오늘날에도 의의를 갖는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "국가의 중요한 결정을 시민이 직접 내린다는 생각 자체는 매우 혁신적이었고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "대의 민주주의가 등장하게 된 배경은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "인구가 늘어나고 국가의 규모가 커지면서 모든 시민이 한곳에 모여 토론하는 것이 현실적으로 불가능해졌기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "근대 민주주의가 발전한 전체적인 방향은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "왕이나 귀족의 권력을 견제하고, 국민의 기본적인 권리를 보장하는 방향으로 꾸준히 발전해 왔다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "현대 민주주의에서 권력 집중을 방지하기 위한 원칙은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "권력이 한곳에 집중되지 않도록 삼권 분립의 원칙을 지킨다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "민주주의가 지속적으로 유지되기 위해 필요한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "시민 한 사람 한 사람의 꾸준한 관심과 참여를 통해 지켜 나가야 할 소중한 가치라 할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(33, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 34: 문학 (LITERATURE) — 고향을 떠난 소녀의 편지 ───
function buildDay34() {
  const paragraphs = [
    {
      id: "p1",
      text: "할머니, 저 은서예요. 서울로 이사 온 지 벌써 두 달이 되었어요. 이곳은 높은 건물이 빼곡하고 자동차 소리가 하루 종일 끊이지 않아서 처음에는 잠을 이루기가 참 어려웠어요. 시골에서는 밤이면 귀뚜라미 소리와 개구리 소리가 자장가처럼 들려왔는데, 여기서는 그런 정겨운 소리를 전혀 들을 수가 없어요. 학교에 가려면 버스를 두 번이나 갈아타야 하고, 출퇴근 시간에는 사람이 너무 많아서 숨이 막히는 것 같아요. 새 학교 친구들은 모두 저보다 키가 크고 말투도 빨라서 처음에는 무척 주눅이 들었고, 쉬는 시간에도 혼자 책상에 엎드려 있곤 했답니다. 할머니가 택배로 보내 주신 감귤을 먹으면서 고향 냄새를 맡으니 눈물이 날 뻔했어요. 할머니, 보고 싶어요."
    },
    {
      id: "p2",
      text: "그런데 요즘은 점점 이곳 생활에 익숙해지고 있어요. 같은 반 친구 수아가 먼저 다가와서 말을 걸어 주었거든요. 수아는 제가 제주도에서 왔다는 말을 듣고 눈을 반짝이며 바다 이야기를 해 달라고 했어요. 그래서 저는 할머니네 집 앞 해변에서 소라를 줍던 이야기, 감귤밭에서 잘 익은 귤을 따 먹던 이야기를 해 주었어요. 수아는 자기도 꼭 제주도에 가 보고 싶다면서 우리 할머니댁에 놀러 가도 되냐고 물었어요. 저는 물론이라고 대답하면서 할머니를 다시 만날 수 있다는 생각에 마음이 두근두근 설레었어요. 수아 덕분에 서울에서도 마음을 나눌 수 있는 진짜 친구가 생기니 학교에 가는 것이 전보다 훨씬 즐거워졌어요."
    },
    {
      id: "p3",
      text: "할머니, 서울에는 좋은 점도 정말 많아요. 도서관이 집에서 걸어갈 수 있는 거리에 있어서 원하는 책을 마음껏 빌려 읽을 수 있고, 주말에는 큰 공원에 가서 자전거도 타요. 지난주에는 엄마와 함께 과학관에 갔는데, 진짜 공룡 뼈 화석과 커다란 우주 모형이 있어서 정말 신기했어요. 제주도에서는 볼 수 없었던 것들이라 눈이 휘둥그레해졌답니다. 그래도 저는 할머니네 감귤밭에서 불어오는 바람과 파란 바다가 가장 그리워요. 방학이 되면 수아와 함께 꼭 제주도에 내려갈게요. 그때까지 할머니도 건강하게 지내세요. 할머니가 손수 만들어 주시는 고구마 떡을 먹을 생각을 하면 벌써부터 입안 가득 행복해져요. 사랑하는 할머니께, 은서 올림."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "은서가 서울에서 잠을 이루기 어려웠던 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "높은 건물이 빼곡하고 자동차 소리가 하루 종일 끊이지 않아서 처음에는 잠을 이루기가 참 어려웠어요")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "은서가 감귤을 먹으면서 눈물이 날 뻔한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "할머니가 택배로 보내 주신 감귤을 먹으면서 고향 냄새를 맡으니 눈물이 날 뻔했어요")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "수아가 은서에게 먼저 관심을 보인 계기는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "제가 제주도에서 왔다는 말을 듣고 눈을 반짝이며 바다 이야기를 해 달라고 했어요")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "은서가 학교에 가는 것이 즐거워진 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "수아 덕분에 서울에서도 마음을 나눌 수 있는 진짜 친구가 생기니 학교에 가는 것이 전보다 훨씬 즐거워졌어요")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "은서가 서울에서 좋다고 느낀 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "도서관이 집에서 걸어갈 수 있는 거리에 있어서 원하는 책을 마음껏 빌려 읽을 수 있고")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "은서가 가장 그리워하는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "저는 할머니네 감귤밭에서 불어오는 바람과 파란 바다가 가장 그리워요")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(34, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 35: 비문학 (NONFICTION) — 화폐의 역사 ───
function buildDay35() {
  const paragraphs = [
    {
      id: "p1",
      text: "오늘날 우리는 물건을 살 때 당연하게 돈을 사용하지만, 돈이 처음부터 존재했던 것은 아니다. 아주 오래전 사람들은 자신이 가진 물건을 다른 사람의 물건과 직접 바꾸는 물물 교환을 하였다. 예를 들어 쌀을 많이 가진 농부가 옷이 필요하면, 옷을 만든 사람을 찾아가 쌀과 옷을 서로 맞바꾸었다. 그러나 물물 교환에는 여러 가지 불편한 점이 있었다. 내가 원하는 물건을 가진 사람이 반드시 내 물건을 원한다는 보장이 없었기 때문이다. 이런 문제를 해결하기 위해 사람들은 누구나 그 가치를 인정하는 물건을 돈 대신 사용하기 시작하였다. 곡식, 조개껍데기, 소금 같은 것이 초기의 화폐 역할을 하였으며, 이를 물품 화폐라고 부른다. 물품 화폐는 사람들 사이에서 공통으로 가치가 인정되었기 때문에 교환의 어려움을 크게 줄여 주었다."
    },
    {
      id: "p2",
      text: "물품 화폐는 보관하기 어렵고 멀리 운반하기도 불편하다는 단점이 있었다. 곡식은 오래 두면 썩고, 소금은 물에 쉽게 녹아 버리기 때문이다. 이러한 문제를 해결하기 위해 등장한 것이 바로 금속 화폐이다. 금이나 은, 구리 같은 금속은 썩지 않고 오래 보관할 수 있으며, 무게를 재어 가치를 정확하게 나타낼 수 있었다. 처음에는 금속 덩어리를 그대로 사용하다가, 점차 일정한 모양과 무게를 가진 동전이 만들어졌다. 이후에는 종이로 만든 지폐가 등장하면서 화폐는 더욱 가볍고 편리해졌다. 지폐 자체에는 큰 가치가 없지만, 나라에서 그 가치를 공식적으로 보증하기 때문에 사람들이 믿고 사용할 수 있는 것이다."
    },
    {
      id: "p3",
      text: "최근에는 화폐의 모습이 또다시 크게 변하고 있다. 신용 카드, 스마트폰 결제, 인터넷 뱅킹 등이 널리 사용되면서 동전이나 지폐와 같은 실물 화폐 없이도 물건을 사고팔 수 있게 되었다. 이처럼 눈에 보이지 않는 전자적 형태의 돈을 전자 화폐라고 한다. 전자 화폐는 빠르고 편리하지만, 개인 정보가 유출되거나 해킹을 당할 위험이 있다는 단점도 있다. 또한 컴퓨터나 스마트폰을 다루기 어려운 노인이나 어린이에게는 전자 화폐가 오히려 불편할 수 있다. 이처럼 화폐는 물물 교환에서 물품 화폐, 금속 화폐, 지폐, 전자 화폐로 끊임없이 변해 왔으며, 앞으로도 기술의 발전에 따라 새로운 형태의 화폐가 나타날 것이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "물물 교환의 가장 큰 불편한 점은 무엇이었는가?",
      answerRanges: [findRange(paragraphs, "p1", "내가 원하는 물건을 가진 사람이 반드시 내 물건을 원한다는 보장이 없었기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "초기에 화폐 역할을 한 것에는 어떤 것들이 있었는가?",
      answerRanges: [findRange(paragraphs, "p1", "곡식, 조개껍데기, 소금 같은 것이 초기의 화폐 역할을 하였으며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "금속 화폐가 물품 화폐보다 편리했던 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "금속은 썩지 않고 오래 보관할 수 있으며, 무게를 재어 가치를 정확하게 나타낼 수 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "지폐를 사람들이 믿고 사용할 수 있는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "나라에서 그 가치를 공식적으로 보증하기 때문에 사람들이 믿고 사용할 수 있는 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "전자 화폐의 단점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "개인 정보가 유출되거나 해킹을 당할 위험이 있다는 단점도 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이 글에서 설명하는 화폐의 변화 순서는 어떠한가?",
      answerRanges: [findRange(paragraphs, "p3", "물물 교환에서 물품 화폐, 금속 화폐, 지폐, 전자 화폐로 끊임없이 변해 왔으며")],
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
  const contentId = `dr-r1-${dayStr}`;

  return {
    contentId,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: `일일 독해(러셀 1) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "RUSSELL_1",
    schoolGradeRange: { min: 7, max: 8 },
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

      // 오답이 3개 미만인 경우 다른 문단에서 추가
      while (wrongTexts.length < 3) {
        const fallbackPara = paragraphs[(wrongTexts.length) % paragraphs.length];
        const fbSents = paraSentMap[fallbackPara.id];
        wrongTexts.push(truncate(fbSents[wrongTexts.length % fbSents.length].text, 80));
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
    // 중심내용 오답이 3개 미만이면 추가
    while (centralWrongs.length < 3) {
      const fallbackPara = paragraphs[centralWrongs.length % paragraphs.length];
      const fbSents = paraSentMap[fallbackPara.id];
      centralWrongs.push(truncate(fbSents[1 % fbSents.length].text, 80));
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
    level_id: "RUSSELL_1",
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
  console.log("=== 러셀1 Day 31~35 빌드 시작 ===\n");

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
    if (len < 1050 || len > 1150) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 1050~1150)`);
      allValid = false;
    } else {
      console.log(`Day ${dayNum}: ${len}자 (적합)`);
    }

    if (c.payload.recall.cards.length !== 8) {
      console.warn(`경고: Day ${dayNum} 복기 카드 ${c.payload.recall.cards.length}장 (8장 필요)`);
      allValid = false;
    }

    const qCount = c.payload.confirm.questions.length;
    if (qCount !== 6) {
      console.warn(`경고: Day ${dayNum} 확인 문항 ${qCount}개 (6개 필요)`);
      allValid = false;
    }

    // 문단 수 검증
    const pCount = c.payload.passage.paragraphs.length;
    if (pCount !== 3) {
      console.warn(`경고: Day ${dayNum} 문단 ${pCount}개 (3개 필요)`);
      allValid = false;
    }
  }

  if (!allValid) {
    console.error("\n검증 실패! 글자수를 조정해 주세요.");
    process.exit(1);
  }

  // static 파일 생성
  if (!fs.existsSync(STATIC_DIR)) {
    fs.mkdirSync(STATIC_DIR, { recursive: true });
  }

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
    }
    batchData.items[batchIdx] = batchItem;
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료`);

  console.log("\n=== 빌드 완료 ===");
}

main();
