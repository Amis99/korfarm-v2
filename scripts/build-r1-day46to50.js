#!/usr/bin/env node
// 러셀1 Day 46~50 일일독해 콘텐츠 빌더
// 짝수 Day = LITERATURE, 홀수 Day = NONFICTION
// 목표 글자수: 1100자 ±50 (1050~1150)

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

// ─── Day 46: 문학 (LITERATURE) — 어머니의 김장 이야기 (생활문) ───
function buildDay46() {
  const paragraphs = [
    {
      id: "p1",
      text: "해마다 입동이 지나면 어머니는 마당에 큰 고무 대야를 꺼내 놓으셨다. 아버지가 시장에서 사 오신 배추 서른 포기, 무 열 개, 쪽파 한 단이 마당 한쪽에 가지런히 놓이면 김장이 시작되었다. 어머니는 배추를 반으로 갈라 굵은소금을 켜켜이 뿌리며 '소금은 넉넉해야 배추가 아삭하다'고 말씀하셨다. 특히 배추의 줄기 쪽에 소금을 더 많이 뿌려야 골고루 절여진다고 하셨다. 절이는 데만 하루가 걸렸지만 어머니는 네다섯 시간마다 배추를 뒤집으며 절임 상태를 꼼꼼히 확인하셨다. 물이 충분히 빠지지 않으면 김치가 물러지고, 지나치게 절이면 짠맛이 강해진다는 것이었다. 그 꼼꼼한 모습을 옆에서 지켜보면서 나는 김장이 단순한 요리가 아니라 정성과 기다림의 과정이라는 것을 어렴풋이 깨달았다."
    },
    {
      id: "p2",
      text: "이튿날 아침이면 어머니는 새벽부터 양념을 준비하셨다. 고춧가루를 물에 불리고 새우젓과 멸치액젓, 마늘, 생강을 갈아 한데 섞는 동안 부엌 안에는 알싸한 냄새가 가득 퍼졌다. 무채를 길게 썰어 양념에 버무리는 것도 빠뜨리지 않으셨다. 나는 찹쌀풀을 끓이는 일을 맡았는데, 풀이 너무 되직하면 양념이 배추에 골고루 붙지 않는다고 하셔서 물 조절에 신경을 곤두세웠다. 양념이 완성되면 어머니는 절인 배추를 흐르는 물에 세 번 헹구어 물기를 뺀 뒤, 한 포기씩 잎 사이사이에 양념을 정성껏 바르셨다. 손끝이 빨갛게 물들어도 어머니는 멈추지 않으셨다. 한 포기를 속까지 빈틈없이 채우고 겉잎으로 감싸 동그랗게 만드는 솜씨가 참으로 능숙했다."
    },
    {
      id: "p3",
      text: "김장이 끝나면 어머니는 이웃집에 김치 한 보시기를 건네셨다. 혼자 사시는 옆집 할머니, 어린아이를 키우는 아랫집 아주머니에게도 빠짐없이 나누어 주셨다. 어머니는 '김장은 나눠 먹어야 맛이 난다'며 웃으셨다. 이웃들도 자기 집에서 담근 깍두기나 동치미를 가져와 서로 맛을 보며 비법을 나누었다. 지금 나는 도시의 작은 아파트에 살면서 마트에서 포장된 김치를 사 먹는다. 하지만 매년 겨울이 오면 마당 가득 배추가 쌓여 있던 그 풍경이 눈앞에 떠오른다. 어머니의 김장에는 가족을 먹이고 이웃과 나누려는 따뜻한 마음이 담겨 있었다. 그 마음을 기억하며 나도 언젠가 아이들과 함께 김장을 해 보고 싶다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "어머니가 배추를 절일 때 강조하신 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "소금은 넉넉해야 배추가 아삭하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "글쓴이가 김장을 통해 깨달은 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "김장이 단순한 요리가 아니라 정성과 기다림의 과정이라는 것을 어렴풋이 깨달았다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "글쓴이가 찹쌀풀을 끓일 때 특히 신경 쓴 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "풀이 너무 되직하면 양념이 배추에 골고루 붙지 않는다고 하셔서 물 조절에 신경을 곤두세웠다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "김장 양념을 바를 때 어머니의 솜씨를 보여 주는 동작은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "한 포기를 속까지 빈틈없이 채우고 겉잎으로 감싸 동그랗게 만드는 솜씨가 참으로 능숙했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "어머니가 김장 후 이웃에게 김치를 나누신 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "김장은 나눠 먹어야 맛이 난다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 어머니의 김장에서 발견한 가치는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "가족을 먹이고 이웃과 나누려는 따뜻한 마음이 담겨 있었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(46, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 47: 비문학 (NONFICTION) — 달의 위상 변화와 조석 현상 (지구과학) ───
function buildDay47() {
  const paragraphs = [
    {
      id: "p1",
      text: "달은 스스로 빛을 내지 않고 태양 빛을 반사하여 빛난다. 달이 지구 둘레를 약 29.5일 주기로 공전하면서 태양과 달과 지구의 위치 관계가 달라지기 때문에, 우리 눈에 보이는 달의 모양이 매일 변한다. 이것을 달의 위상 변화라고 한다. 달이 태양과 같은 방향에 있으면 달의 어두운 면이 지구를 향하므로 보이지 않는 삭(새달) 상태가 된다. 이때 달은 낮에 태양과 함께 떠 있어서 눈으로 확인하기 어렵다. 반대로 달이 태양의 정반대쪽에 있으면 밝은 면 전체가 지구를 향하여 둥근 보름달이 나타난다. 삭에서 보름까지는 약 15일이 걸리며, 그 사이에 초승달과 상현달을 거친다. 보름 이후에는 다시 하현달과 그믐달을 거쳐 삭으로 돌아오므로, 달의 위상은 약 한 달을 주기로 순환한다."
    },
    {
      id: "p2",
      text: "달의 위상 변화와 함께 지구에서 관찰되는 중요한 현상 중 하나가 조석이다. 조석이란 바닷물의 높이가 하루에 두 번 높아졌다가 낮아지는 현상을 말한다. 이 현상은 주로 달의 인력에 의해 발생한다. 달과 가까운 쪽의 바다는 달의 인력에 의해 끌려 올라가고, 달과 먼 쪽의 바다는 지구의 자전에 따른 원심력으로 인해 물이 바깥으로 밀려 나간다. 그 결과 지구의 양쪽에서 동시에 밀물이 일어나고, 그 사이 지역에서는 썰물이 나타난다. 밀물 때 해수면이 가장 높은 상태를 만조, 썰물 때 가장 낮은 상태를 간조라 한다. 만조와 간조는 하루에 각각 두 번씩 발생하며, 한 주기는 약 12시간 25분이다."
    },
    {
      id: "p3",
      text: "조석의 크기는 달의 위상에 따라 달라진다. 삭이나 보름처럼 태양과 달과 지구가 일직선에 놓이면 태양의 인력과 달의 인력이 같은 방향으로 작용하여 조수 간만의 차이가 커진다. 이를 사리라 한다. 반대로 상현이나 하현처럼 태양과 달이 직각을 이루면 두 힘이 서로 상쇄되어 조수 간만의 차이가 작아지는데, 이를 조금이라 한다. 우리나라 서해안은 조수 간만의 차이가 매우 커서 사리 때에는 수 미터에 이르기도 한다. 해안가에 사는 사람들은 사리와 조금의 주기를 잘 알아 두어야 안전하게 갯벌 작업을 할 수 있다. 이처럼 달의 위상 변화는 단순히 밤하늘의 아름다운 볼거리가 아니라 바다와 인간의 생활에 실질적인 영향을 미치는 자연 현상이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "달의 위상 변화가 생기는 근본적인 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "달이 지구 둘레를 약 29.5일 주기로 공전하면서 태양과 달과 지구의 위치 관계가 달라지기 때문에")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "보름달이 나타나는 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "달이 태양의 정반대쪽에 있으면 밝은 면 전체가 지구를 향하여 둥근 보름달이 나타난다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "달과 먼 쪽의 바다에서 밀물이 일어나는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "달과 먼 쪽의 바다는 지구의 자전에 따른 원심력으로 인해 물이 바깥으로 밀려 나간다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "만조와 간조는 각각 어떤 상태를 가리키는가?",
      answerRanges: [findRange(paragraphs, "p2", "밀물 때 해수면이 가장 높은 상태를 만조, 썰물 때 가장 낮은 상태를 간조라 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "사리가 발생하는 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "태양과 달과 지구가 일직선에 놓이면 태양의 인력과 달의 인력이 같은 방향으로 작용하여 조수 간만의 차이가 커진다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "해안가 사람들이 사리와 조금의 주기를 알아야 하는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "사리와 조금의 주기를 잘 알아 두어야 안전하게 갯벌 작업을 할 수 있다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(47, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 48: 문학 (LITERATURE) — 오래된 피아노와 할머니의 추억 (수필) ───
function buildDay48() {
  const paragraphs = [
    {
      id: "p1",
      text: "거실 구석에 놓인 오래된 피아노는 할머니의 유품이다. 뚜껑의 검은 칠이 군데군데 벗겨지고 건반 몇 개는 누르면 소리가 나지 않는다. 부모님은 여러 번 치워 버리자고 하셨지만 나는 그때마다 고개를 저었다. 어릴 적 할머니 무릎에 앉아 이 피아노 소리를 듣던 기억이 너무나 선명하기 때문이다. 할머니는 어린 시절 음악 선생님이 되고 싶었다고 하셨다. 전쟁 때문에 학교를 그만두어야 했고 결국 꿈을 이루지 못하셨지만, 피아노만큼은 평생 곁에 두셨다. 이사를 갈 때에도 다른 살림살이는 줄여도 피아노만은 꼭 가져가셨다. 할머니에게 피아노는 이루지 못한 꿈을 어루만지는 유일한 도구였다."
    },
    {
      id: "p2",
      text: "할머니가 자주 치시던 곡은 슈베르트의 자장가였다. 느리고 부드러운 선율이 방 안 가득 채우면 나는 어느새 잠이 들곤 했다. 할머니의 손가락은 밭일로 크고 투박해졌지만, 건반 위에서만큼은 놀라울 정도로 섬세하게 움직였다. 가끔 음을 틀리시면 살짝 멈추었다가 다시 처음부터 치시곤 하셨는데, 그 정성스러운 태도가 참 인상적이었다. 할머니는 한 곡을 끝내신 뒤에 꼭 건반 위에 손을 가만히 올려놓으셨다. 그 짧은 침묵 속에서 할머니가 어떤 생각을 하셨는지 나는 알 수 없었지만, 그 순간이 할머니에게 무척 소중한 시간이라는 것만큼은 느낄 수 있었다. 음악이 끝난 뒤의 고요함이 때로는 음악 자체보다 더 깊은 울림을 준다는 것을 나는 그때 처음 느꼈다."
    },
    {
      id: "p3",
      text: "할머니가 돌아가신 후 나는 오랫동안 피아노 뚜껑을 열지 못했다. 건반을 누르면 할머니의 목소리가 들릴 것 같아서 두려웠다. 피아노 위에 먼지가 쌓여도 닦을 엄두가 나지 않았다. 그러다 어느 겨울 저녁, 문득 피아노 앞에 앉았다. 서툰 손가락으로 자장가의 첫 음을 눌렀을 때 낡은 건반이 작고 탁한 소리를 냈다. 완벽한 음이 아니었지만 그 소리는 오히려 할머니가 옆에 계신 것처럼 따뜻하게 느껴졌다. 두 번째 음, 세 번째 음을 이어 나가자 어느새 눈물이 흘렀다. 그날 나는 깨달았다. 이 피아노는 단순한 악기가 아니라 할머니와 나를 이어 주는 다리라는 것을. 비록 낡고 일부 건반은 소리가 나지 않지만, 그 불완전함마저도 할머니와 함께했던 시간의 일부인 것이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "글쓴이가 피아노를 버리지 않으려는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "어릴 적 할머니 무릎에 앉아 이 피아노 소리를 듣던 기억이 너무나 선명하기 때문이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "할머니에게 피아노가 지닌 의미는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "피아노는 이루지 못한 꿈을 어루만지는 유일한 도구였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "할머니의 연주가 끝난 뒤 글쓴이가 느낀 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "음악이 끝난 뒤의 고요함이 때로는 음악 자체보다 더 깊은 울림을 준다는 것을 나는 그때 처음 느꼈다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "할머니가 돌아가신 후 글쓴이가 피아노를 열지 못한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "건반을 누르면 할머니의 목소리가 들릴 것 같아서 두려웠다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "글쓴이가 피아노에 대해 깨달은 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "이 피아노는 단순한 악기가 아니라 할머니와 나를 이어 주는 다리라는 것을")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 피아노의 불완전함에 대해 가지게 된 생각은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "그 불완전함마저도 할머니와 함께했던 시간의 일부인 것이다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(48, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 49: 비문학 (NONFICTION) — 교통 신호 체계의 원리 (기술/사회) ───
function buildDay49() {
  const paragraphs = [
    {
      id: "p1",
      text: "도로 위에서 차량과 보행자가 안전하게 이동하려면 교통 신호 체계가 반드시 필요하다. 교통 신호등은 빨간색, 노란색, 초록색 세 가지 색으로 이루어져 있으며, 각각 멈춤, 주의, 진행을 뜻한다. 이 세 가지 색이 국제 표준으로 정해진 데에는 과학적인 이유가 있다. 빨간색은 가시광선 중 파장이 가장 길어서 먼 거리에서도 잘 보이기 때문에 위험 신호로 선택되었다. 비나 안개가 낀 날에도 빨간색은 다른 색보다 눈에 잘 띈다. 반면 초록색은 빨간색과 보색 관계에 있어 한눈에 쉽게 구별되므로 진행 신호로 적합하다. 노란색은 두 색의 중간 파장을 가지고 있으므로 주의 신호로 사용된다."
    },
    {
      id: "p2",
      text: "현대 도시의 교통 신호는 단순한 타이머 방식에서 벗어나 실시간 교통량에 따라 작동하는 감응식 신호 체계로 발전하고 있다. 감응식 신호등은 도로에 매설된 루프 검지기나 영상 카메라를 통해 차량의 수를 파악한다. 교통량이 많은 방향에 초록색 신호를 더 오래 유지하고, 차량이 없는 방향은 빠르게 빨간색으로 전환하여 대기 시간을 줄인다. 이를 통해 교차로 통과 시간이 평균 20퍼센트 가량 단축된다는 연구 결과도 있다. 또한 여러 교차로의 신호를 연동하여 초록색 신호가 연속으로 이어지게 만드는 녹색 물결 기법도 널리 활용되고 있다. 이 기법이 적용되면 운전자는 적정 속도로 달릴 때 연속으로 초록색 신호를 받아 정차 없이 이동할 수 있다."
    },
    {
      id: "p3",
      text: "교통 신호 체계는 보행자의 안전을 위한 장치도 포함한다. 보행자 신호등에는 남은 시간을 숫자로 보여 주는 잔여 시간 표시 장치가 부착되어 있어, 보행자가 횡단 가능 여부를 스스로 판단할 수 있다. 시각 장애인을 위해 '삐삐삐' 하는 음향 신호가 함께 작동하며, 일부 교차로에는 촉각 안내판도 설치된다. 최근에는 어린이 보호 구역에 속도 감지 카메라와 연동된 경고 신호등을 설치하는 사례도 늘고 있다. 그러나 아무리 정교한 신호 체계도 이용자가 규칙을 지키지 않으면 효과가 없다. 보행자의 무단 횡단이나 운전자의 신호 위반은 교통사고의 주요 원인이 된다. 따라서 교통 신호 체계가 제 기능을 발휘하려면 기술적 발전과 함께 시민의 교통 규칙 준수 의식이 뒷받침되어야 한다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "빨간색이 위험 신호로 선택된 과학적 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "빨간색은 가시광선 중 파장이 가장 길어서 먼 거리에서도 잘 보이기 때문에 위험 신호로 선택되었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "초록색이 진행 신호로 적합한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "초록색은 빨간색과 보색 관계에 있어 한눈에 쉽게 구별되므로 진행 신호로 적합하다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "감응식 신호등이 교통량을 파악하는 방법은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "도로에 매설된 루프 검지기나 영상 카메라를 통해 차량의 수를 파악한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "녹색 물결 기법이란 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "여러 교차로의 신호를 연동하여 초록색 신호가 연속으로 이어지게 만드는 녹색 물결 기법")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "시각 장애인을 위한 교통 신호 보조 장치에는 무엇이 있는가?",
      answerRanges: [findRange(paragraphs, "p3", "음향 신호가 함께 작동하며, 일부 교차로에는 촉각 안내판도 설치된다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "교통 신호 체계가 제 기능을 발휘하기 위해 필요한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "기술적 발전과 함께 시민의 교통 규칙 준수 의식이 뒷받침되어야 한다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(49, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 50: 문학 (LITERATURE) — 눈보라 속 산장에서의 하룻밤 (소설) ───
function buildDay50() {
  const paragraphs = [
    {
      id: "p1",
      text: "산 중턱에 눈보라가 몰아치기 시작한 것은 해가 지기 직전이었다. 아침에 출발할 때만 해도 맑았던 하늘이 오후 들어 급격히 어두워졌다. 민호는 등산로 표지판이 눈에 파묻혀 보이지 않자 걸음을 멈추었다. 핸드폰은 배터리가 꺼진 지 오래였고, 지도를 확인할 방법도 없었다. 바람이 거세져 한 발짝도 앞으로 나갈 수 없었다. 눈발이 얼굴을 때릴 때마다 피부가 바늘로 찌르는 듯 아팠다. 그때 왼쪽 숲 사이로 희미한 불빛이 보였다. 다리를 끌다시피 하며 나아가니 낡은 통나무 산장이 나타났다. 문은 열려 있었고 안에는 누군가 장작불을 피워 놓은 흔적이 있었다. 민호는 문을 닫고 불 옆에 주저앉았다. 장갑 속의 손가락이 서서히 감각을 되찾았다."
    },
    {
      id: "p2",
      text: "산장 안을 둘러보니 선반 위에 통조림 몇 개와 성냥 한 갑, 두꺼운 담요가 가지런히 놓여 있었다. 누군가 이런 긴급 상황을 대비해 미리 준비해 둔 것이라 생각하니 고마운 마음이 들었다. 민호는 담요를 덮고 통조림을 하나 따서 먹었다. 차가운 콩 통조림이었지만 빈속에 들어가니 세상에서 가장 맛있는 음식처럼 느껴졌다. 밖에서는 여전히 바람이 울부짖었고, 산장의 나무벽이 바람에 흔들릴 때마다 불안한 마음이 고개를 들었다. 혹시 산장이 무너지면 어쩌나 하는 걱정도 스쳤다. 그러나 장작불의 따스함이 온몸을 감싸자 민호는 어느새 눈을 감았다. 장작이 다 타서 불이 꺼질까 걱정했지만 피로가 두려움보다 강했다."
    },
    {
      id: "p3",
      text: "아침이 밝았을 때 눈보라는 멎어 있었다. 창문 밖으로 펼쳐진 설경은 어젯밤의 공포가 거짓말처럼 고요하고 아름다웠다. 햇살이 눈 위에 부서지며 온 세상이 하얗게 반짝이고 있었다. 민호는 산장을 떠나기 전에 선반을 깨끗이 정리하고 남은 통조림을 가지런히 놓았다. 장작도 바깥에서 마른 나뭇가지를 주워 와 다음 사람이 불을 피울 수 있도록 쌓아 두었다. 그리고 벽에 걸린 방명록에 '감사합니다. 이 산장 덕분에 살았습니다.'라고 적었다. 방명록에는 민호 말고도 비슷한 감사의 글이 여러 줄 적혀 있었다. 산을 내려오는 길에 민호는 생각했다. 이름 모를 누군가의 작은 배려가 자신의 생명을 구했다는 사실을. 집에 돌아가면 자신도 누군가를 위해 그런 작은 배려를 실천해 보겠다고 다짐하며 발걸음을 옮겼다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "민호가 등산로에서 길을 잃게 된 직접적인 원인은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "등산로 표지판이 눈에 파묻혀 보이지 않자")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "민호가 산장을 발견하게 된 계기는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "왼쪽 숲 사이로 희미한 불빛이 보였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "산장에 준비물이 놓여 있는 것을 본 민호의 감정은 어떠했는가?",
      answerRanges: [findRange(paragraphs, "p2", "누군가 이런 긴급 상황을 대비해 미리 준비해 둔 것이라 생각하니 고마운 마음이 들었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "민호가 불안함에도 잠들 수 있었던 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "피로가 두려움보다 강했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "민호가 방명록에 남긴 말은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "감사합니다. 이 산장 덕분에 살았습니다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "민호가 산을 내려오며 다짐한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "자신도 누군가를 위해 그런 작은 배려를 실천해 보겠다고 다짐하며")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(50, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── 공통 조립 함수 ───

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs);
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
    timeLimitSec: 300,
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
  console.log("=== 러셀1 Day 46~50 빌드 시작 ===\n");

  const contents = [
    buildDay46(),
    buildDay47(),
    buildDay48(),
    buildDay49(),
    buildDay50()
  ];

  // 검증
  let allValid = true;
  for (const c of contents) {
    const len = c.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
    const dayNum = parseInt(c.contentId.split('-').pop());
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
  }

  // static 파일 생성
  for (const c of contents) {
    const dayNum = parseInt(c.contentId.split('-').pop());
    const dayStr = String(dayNum).padStart(3, '0');
    const filePath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(filePath, JSON.stringify(c, null, 2), 'utf8');
    console.log(`생성: ${dayStr}.json`);
  }

  // 배치 파일 갱신 (items[45]~items[49])
  console.log("\n배치 파일 갱신 중...");
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`현재 배치 items 수: ${batchData.items.length}`);

  const dayIndices = [46, 47, 48, 49, 50];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1; // items[45]~items[49]
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
