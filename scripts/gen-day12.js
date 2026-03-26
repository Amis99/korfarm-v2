// Day 12 - 문학 (LITERATURE) 생성 스크립트
const fs = require('fs');
const path = require('path');

// === 지문 (1100자 ±50) ===
// 주제: 전학 온 아이와 친구 사이 이야기
const paragraphs = [
  {
    id: "p1",
    text: "중학교 일 학년 새 학기 첫날, 우리 반에 전학생이 한 명 들어왔다. 이름은 지호였다. 지호는 교실 뒤편 구석 자리에 조용히 앉아서 누구에게도 먼저 말을 걸지 않았다. 쉬는 시간에 다른 아이들이 신나게 운동장으로 뛰어나갈 때에도 지호는 혼자 자리에 남아 묵묵히 책만 읽었다. 나는 그런 지호의 모습이 마음에 걸렸지만, 막상 선뜻 다가가기가 쉽지 않았다. 괜히 말을 걸었다가 어색해질까 봐 내심 걱정이 되었기 때문이다. 며칠이 지나도 지호는 여전히 혼자였고, 아이들 사이에서는 \"지호는 원래 친구를 사귀고 싶지 않은가 봐.\"라는 이야기가 슬슬 돌기 시작했다."
  },
  {
    id: "p2",
    text: "그러던 어느 날 미술 시간에 모둠별로 큰 그림을 그리는 활동을 하게 되었는데, 우연히 지호와 내가 같은 모둠이 되었다. 우리 모둠의 주제는 '우리 동네의 봄'이라는 커다란 그림을 함께 완성하는 것이었다. 다른 친구들은 신나게 색칠을 시작했지만, 지호는 한참 동안 머뭇거리며 크레파스만 만지작거리고 있었다. 나는 용기를 내어 \"지호야, 여기에 나무 한 그루 그려 줄래?\"라고 조심스럽게 말했다. 지호는 살짝 놀란 표정을 짓더니, 이내 작은 목소리로 \"응, 해 볼게.\"라고 대답했다. 지호가 조심스럽게 그린 나무는 놀라울 정도로 섬세하고 아름다웠다. 나뭇잎 하나하나에 연두색과 초록색을 번갈아 칠한 솜씨가 대단해서, 모둠 친구들이 저마다 탄성을 질렀다."
  },
  {
    id: "p3",
    text: "그날 이후로 나와 지호는 조금씩 가까워지기 시작했다. 점심시간에 함께 밥을 먹고, 쉬는 시간에는 서로 좋아하는 만화에 대해 수다를 떨며 이야기를 나누었다. 알고 보니 지호는 이전 학교에서 아주 친했던 친구들과 갑작스러운 이사 때문에 떨어지게 되어 많이 외로웠다고 한다. 새로운 곳에서 또다시 친구를 사귀었다가 다시 헤어지면 마음이 아플까 봐, 일부러 사람들과 거리를 두었던 것이었다. 지호의 속마음을 알게 된 뒤, 나는 먼저 다가가기를 주저했던 스스로가 부끄러워졌다. 상대방이 차갑게 보인다고 해서 그 사람의 마음까지 차가운 것은 아니라는 사실을 그때 비로소 깨달았다. 지호와의 우정은 내게 상대방의 겉모습만 보고 섣불리 판단하지 말아야 한다는 소중한 교훈을 남겨 주었다."
  }
];

const totalChars = paragraphs.reduce((sum, p) => sum + p.text.length, 0);
console.log(`총 글자 수: ${totalChars}`);

function findRange(pid, text) {
  const p = paragraphs.find(x => x.id === pid);
  const s = p.text.indexOf(text);
  if (s === -1) throw new Error(`"${text}" → ${pid} 미발견`);
  return { paragraphId: pid, start: s, end: s + text.length };
}
function sr(pid, st, en) {
  const p = paragraphs.find(x => x.id === pid);
  const s = p.text.indexOf(st);
  if (s === -1) throw new Error(`시작:"${st}" → ${pid} 미발견`);
  const e = p.text.indexOf(en, s);
  if (e === -1) throw new Error(`끝:"${en}" → ${pid} 미발견`);
  return { paragraphId: pid, start: s, end: e + en.length };
}
function fr(pid) { const p = paragraphs.find(x => x.id === pid); return { paragraphId: pid, start: 0, end: p.text.length }; }

// === 문장 범위 ===
const p1s1 = sr("p1", "중학교 일 학년", "들어왔다.");
const p1s2 = sr("p1", "이름은 지호였다.", "지호였다.");
const p1s3 = sr("p1", "지호는 교실 뒤편", "않았다.");
const p1s4 = sr("p1", "쉬는 시간에", "읽었다.");
const p1s5 = sr("p1", "나는 그런 지호의", "않았다.");
const p1s6 = sr("p1", "괜히 말을 걸었다가", "때문이다.");
const p1s7 = sr("p1", "며칠이 지나도", "시작했다.");

const p2s1 = sr("p2", "그러던 어느 날", "되었다.");
const p2s2 = sr("p2", "우리 모둠의", "것이었다.");
const p2s3 = sr("p2", "다른 친구들은", "있었다.");
const p2s4 = sr("p2", "나는 용기를 내어", "말했다.");
const p2s5 = sr("p2", "지호는 살짝", "대답했다.");
const p2s6 = sr("p2", "지호가 조심스럽게", "아름다웠다.");
const p2s7 = sr("p2", "나뭇잎 하나하나에", "질렀다.");

const p3s1 = sr("p3", "그날 이후로", "시작했다.");
const p3s2 = sr("p3", "점심시간에 함께", "나누었다.");
const p3s3 = sr("p3", "알고 보니 지호는", "한다.");
const p3s4 = sr("p3", "새로운 곳에서", "것이었다.");
const p3s5 = sr("p3", "지호의 속마음을", "부끄러워졌다.");
const p3s6 = sr("p3", "상대방이 차갑게", "깨달았다.");
const p3s7 = sr("p3", "지호와의 우정은", "주었다.");

// === timeline ===
const timeline = [
  { stepId: "s1", highlight: { ranges: [p1s1] }, question: {
    prompt: "새 학기 첫날에 일어난 일로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "우리 반에 전학생이 한 명 들어왔다." },
      { id: "B", text: "우리 반 담임 선생님이 바뀌셨다." },
      { id: "C", text: "학교에서 운동회가 열렸다." },
      { id: "D", text: "교실 자리를 새로 배치했다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s2", highlight: { ranges: [p1s2] }, question: {
    prompt: "전학생의 이름으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "지호이다." },
      { id: "B", text: "민준이이다." },
      { id: "C", text: "서연이이다." },
      { id: "D", text: "예준이이다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s3", highlight: { ranges: [p1s3] }, question: {
    prompt: "지호가 교실에서 보인 행동으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "뒤편 구석 자리에 앉아 누구에게도 먼저 말을 걸지 않았다." },
      { id: "B", text: "교실 앞에 나가서 자기소개를 신나게 했다." },
      { id: "C", text: "여러 친구에게 먼저 다가가 말을 걸었다." },
      { id: "D", text: "선생님 옆에 앉아서 수업 내용을 질문했다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s4", highlight: { ranges: [p1s4] }, question: {
    prompt: "쉬는 시간에 지호가 한 일로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "혼자 자리에 남아 책만 읽었다." },
      { id: "B", text: "다른 아이들과 함께 운동장에서 뛰어놀았다." },
      { id: "C", text: "친구들과 교실에서 카드놀이를 했다." },
      { id: "D", text: "선생님과 상담을 하러 갔다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s5", highlight: { ranges: [p1s5] }, question: {
    prompt: "'나'가 지호에게 다가가지 못한 까닭으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "마음에 걸렸지만 선뜻 다가가기가 쉽지 않았다." },
      { id: "B", text: "지호를 전혀 신경 쓰지 않았다." },
      { id: "C", text: "선생님이 말을 걸지 말라고 하셨다." },
      { id: "D", text: "지호가 먼저 나에게 올 것이라 확신했다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s6", highlight: { ranges: [p1s6] }, question: {
    prompt: "'나'가 걱정한 구체적인 이유로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "말을 걸었다가 어색해질까 봐 걱정되었다." },
      { id: "B", text: "지호가 화를 낼까 봐 무서웠다." },
      { id: "C", text: "다른 친구들이 놀릴까 봐 걱정되었다." },
      { id: "D", text: "선생님에게 혼날까 봐 걱정되었다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s7", highlight: { ranges: [p1s7] }, question: {
    prompt: "아이들 사이에서 돌기 시작한 이야기로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "지호는 친구를 사귀고 싶지 않은가 보다라는 이야기이다." },
      { id: "B", text: "지호는 공부를 아주 잘하는 학생이라는 이야기이다." },
      { id: "C", text: "지호는 운동을 잘해서 대표 선수가 될 것이라는 이야기이다." },
      { id: "D", text: "지호는 곧 다시 전학을 갈 것이라는 이야기이다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  // p1 중심
  { stepId: "s8", highlight: { ranges: [fr("p1")] }, question: {
    prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "전학 온 지호는 혼자 지냈고, '나'는 다가가고 싶었지만 주저했다." },
      { id: "B", text: "새 학기에 '나'는 반장이 되어 전학생을 안내했다." },
      { id: "C", text: "지호는 전학 오자마자 인기가 많아졌다." },
      { id: "D", text: "아이들은 지호에게 먼저 다가가 친구가 되었다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  // p2
  { stepId: "s9", highlight: { ranges: [p2s1] }, question: {
    prompt: "지호와 '나'가 같은 모둠이 된 수업은 무엇인가요?",
    choices: [
      { id: "A", text: "미술 시간에 같은 모둠이 되었다." },
      { id: "B", text: "체육 시간에 같은 팀이 되었다." },
      { id: "C", text: "음악 시간에 같은 합창 조가 되었다." },
      { id: "D", text: "과학 시간에 같은 실험 조가 되었다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s10", highlight: { ranges: [p2s2] }, question: {
    prompt: "모둠 활동의 주제로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "'우리 동네의 봄'이라는 큰 그림을 함께 그리는 것이다." },
      { id: "B", text: "'우리 학교의 겨울'이라는 글짓기를 함께 하는 것이다." },
      { id: "C", text: "'우리 마을의 역사'를 조사하여 발표하는 것이다." },
      { id: "D", text: "'좋아하는 동물'을 점토로 만드는 것이다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s11", highlight: { ranges: [p2s3] }, question: {
    prompt: "활동 시작 때 지호의 모습으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "머뭇거리며 크레파스만 만지작거리고 있었다." },
      { id: "B", text: "다른 친구보다 먼저 신나게 색칠을 시작했다." },
      { id: "C", text: "그리기 싫다며 참여하지 않겠다고 했다." },
      { id: "D", text: "선생님께 다른 모둠으로 옮겨 달라고 부탁했다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s12", highlight: { ranges: [p2s4] }, question: {
    prompt: "'나'가 지호에게 한 말로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "나무 한 그루 그려 줄래?라고 말했다." },
      { id: "B", text: "하늘을 파랗게 칠해 줄래?라고 말했다." },
      { id: "C", text: "뒷정리를 해 줄래?라고 말했다." },
      { id: "D", text: "가만히 앉아 있으라고 말했다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s13", highlight: { ranges: [p2s5] }, question: {
    prompt: "지호의 대답으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "살짝 놀란 뒤 작은 목소리로 \"응, 해 볼게.\"라고 했다." },
      { id: "B", text: "화난 표정으로 \"싫어.\"라고 했다." },
      { id: "C", text: "아무 대답 없이 고개만 저었다." },
      { id: "D", text: "큰 소리로 \"당연하지!\"라고 했다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s14", highlight: { ranges: [p2s6] }, question: {
    prompt: "지호가 그린 나무에 대한 설명으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "섬세하고 아름다웠다." },
      { id: "B", text: "너무 작아서 잘 보이지 않았다." },
      { id: "C", text: "색을 전혀 쓰지 않은 연필 그림이었다." },
      { id: "D", text: "다른 친구의 그림과 겹쳐서 지워야 했다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s15", highlight: { ranges: [p2s7] }, question: {
    prompt: "모둠 친구들이 감탄한 까닭으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "나뭇잎에 연두색과 초록색을 번갈아 칠한 솜씨가 대단했기 때문이다." },
      { id: "B", text: "지호가 가장 빠르게 그림을 완성했기 때문이다." },
      { id: "C", text: "지호가 큰 소리로 재미있는 이야기를 했기 때문이다." },
      { id: "D", text: "지호가 선생님에게 칭찬을 받았기 때문이다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  // p2 중심
  { stepId: "s16", highlight: { ranges: [fr("p2")] }, question: {
    prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "미술 모둠 활동에서 '나'가 먼저 말을 걸자 지호가 뛰어난 그림 실력을 보여 주었다." },
      { id: "B", text: "지호는 미술 시간에도 아무것도 하지 않고 가만히 앉아 있었다." },
      { id: "C", text: "'나'는 지호 대신 모든 그림을 그려 주었다." },
      { id: "D", text: "모둠 친구들이 지호에게 그림을 그리지 말라고 했다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  // p3
  { stepId: "s17", highlight: { ranges: [p3s1] }, question: {
    prompt: "그날 이후 '나'와 지호 사이에 생긴 변화로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "조금씩 가까워졌다." },
      { id: "B", text: "더 이상 말을 하지 않게 되었다." },
      { id: "C", text: "서로 다른 모둠으로 나뉘어졌다." },
      { id: "D", text: "지호가 다시 전학을 가게 되었다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s18", highlight: { ranges: [p3s2] }, question: {
    prompt: "'나'와 지호가 함께 한 일로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "점심에 함께 밥을 먹고 쉬는 시간에 만화 이야기를 나누었다." },
      { id: "B", text: "매일 방과 후에 도서관에서 함께 공부했다." },
      { id: "C", text: "주말마다 함께 운동장에서 축구를 했다." },
      { id: "D", text: "함께 학원에 다니며 미술을 배웠다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s19", highlight: { ranges: [p3s3] }, question: {
    prompt: "지호가 전학 오기 전에 겪은 일로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "친한 친구들과 갑작스럽게 떨어지게 되어 많이 외로웠다." },
      { id: "B", text: "이전 학교에서 친구가 한 명도 없었다." },
      { id: "C", text: "이전 학교에서 선생님과 사이가 좋지 않았다." },
      { id: "D", text: "이전 학교 친구들이 지호를 따돌렸다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s20", highlight: { ranges: [p3s4] }, question: {
    prompt: "지호가 일부러 거리를 두었던 까닭으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "친구를 사귀었다가 또 헤어지면 마음이 아플까 봐서이다." },
      { id: "B", text: "새 학교 친구들이 마음에 들지 않아서이다." },
      { id: "C", text: "공부에만 집중하고 싶어서이다." },
      { id: "D", text: "부모님이 친구를 사귀지 말라고 하셔서이다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s21", highlight: { ranges: [p3s5] }, question: {
    prompt: "지호의 속마음을 알고 난 뒤 '나'가 느낀 감정으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "먼저 다가가기를 주저했던 자신이 부끄러웠다." },
      { id: "B", text: "지호에게 화가 났다." },
      { id: "C", text: "지호가 불쌍해서 울음이 터졌다." },
      { id: "D", text: "지호와 친구가 되지 말걸 후회했다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s22", highlight: { ranges: [p3s6] }, question: {
    prompt: "'나'가 비로소 깨달은 것으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "겉이 차갑게 보인다고 마음까지 차가운 것은 아니라는 것이다." },
      { id: "B", text: "전학생에게는 절대 말을 걸면 안 된다는 것이다." },
      { id: "C", text: "친구는 자연스럽게 생기므로 노력할 필요가 없다는 것이다." },
      { id: "D", text: "혼자 있는 것이 친구가 있는 것보다 편하다는 것이다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s23", highlight: { ranges: [p3s7] }, question: {
    prompt: "지호와의 우정이 '나'에게 남겨 준 교훈으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "상대방의 겉모습만 보고 섣불리 판단하지 말아야 한다는 것이다." },
      { id: "B", text: "전학생은 반드시 반장이 도와야 한다는 것이다." },
      { id: "C", text: "친구를 사귀면 반드시 헤어지게 된다는 것이다." },
      { id: "D", text: "미술 실력이 좋아야 친구를 사귈 수 있다는 것이다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  // p3 중심
  { stepId: "s24", highlight: { ranges: [fr("p3")] }, question: {
    prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "지호와 친해진 '나'는 겉모습만으로 판단하지 말아야 한다는 교훈을 얻었다." },
      { id: "B", text: "지호는 다시 전학을 가서 '나'와 헤어졌다." },
      { id: "C", text: "'나'는 지호의 속마음을 알고도 관심이 없었다." },
      { id: "D", text: "지호는 처음부터 친구를 사귀고 싶지 않았다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }}
];

// === recall (8카드) ===
const recall = {
  cards: [
    { id: "c1", text: "새 학기에 전학 온 지호는 아무에게도 말을 걸지 않고 혼자 책만 읽었다." },
    { id: "c2", text: "'나'는 다가가고 싶었지만 어색해질까 봐 주저했고 아이들은 오해하기 시작했다." },
    { id: "c3", text: "미술 시간 모둠 활동에서 '나'가 용기를 내어 지호에게 먼저 말을 걸었다." },
    { id: "c4", text: "지호는 섬세하고 아름다운 나무를 그려 모둠 친구들의 감탄을 받았다." },
    { id: "c5", text: "그날 이후 함께 밥을 먹고 만화 이야기를 나누며 조금씩 가까워졌다." },
    { id: "c6", text: "지호는 전학 전 친구들과 헤어진 아픔 때문에 일부러 거리를 두었던 것이었다." },
    { id: "c7", text: "'나'는 겉이 차갑게 보인다고 마음까지 차가운 것은 아니라는 것을 깨달았다." },
    { id: "c8", text: "상대방의 겉모습만 보고 섣불리 판단하지 말아야 한다는 소중한 교훈을 얻었다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// === confirm (7문항) ===
const confirmQuestions = [
  {
    id: "q1", prompt: "전학생의 이름은 무엇인가요?",
    answerText: "지호", answerMatchMode: "ANY",
    answerRanges: [findRange("p1", "지호였다")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
  },
  {
    id: "q2", prompt: "지호와 '나'가 같은 모둠이 된 수업 시간은 무엇인가요?",
    answerText: "미술", answerMatchMode: "ANY",
    answerRanges: [findRange("p2", "미술")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
  },
  {
    id: "q3", prompt: "'나'가 지호에게 그려 달라고 한 것은 무엇인가요?",
    answerText: "나무", answerMatchMode: "ANY",
    answerRanges: [findRange("p2", "나무 한 그루")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
  },
  {
    id: "q4", prompt: "지호가 나뭇잎에 번갈아 칠한 두 가지 색 중 하나는 무엇인가요?",
    answerText: "연두색", answerMatchMode: "ANY",
    answerRanges: [findRange("p2", "연두색")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
  },
  {
    id: "q5", prompt: "지호가 일부러 거리를 두었던 감정의 원인이 된 것은 무엇인가요?",
    answerText: "외로웠다", answerMatchMode: "ANY",
    answerRanges: [findRange("p3", "외로웠다")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
  },
  {
    id: "q6", prompt: "'나'와 지호가 쉬는 시간에 이야기를 나눈 공통 관심사는 무엇인가요?",
    answerText: "만화", answerMatchMode: "ANY",
    answerRanges: [findRange("p3", "만화")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
  },
  {
    id: "q7", prompt: "지호와의 우정이 '나'에게 남겨 준 것은 무엇인가요?",
    answerText: "교훈", answerMatchMode: "ANY",
    answerRanges: [findRange("p3", "교훈")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
  }
];

// === JSON ===
const content = {
  contentId: "dr-r1-012", contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
  title: "일일 독해(러셀 1) Day 12 문학", description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_1", schoolGradeRange: { min: 7, max: 8 },
  area: "READING", subArea: "LITERATURE", competencies: ["READING"], tags: ["daily"],
  access: { mode: "FREE" }, seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300, assets: {},
  payload: { passage: { format: "TEXT", paragraphs }, intensive: { timeline }, recall, confirm: { questions: confirmQuestions } }
};

// === 검증 ===
console.log(`\n=== 최종 검증 ===`);
console.log(`글자 수: ${totalChars}, steps: ${timeline.length}, recall: ${recall.cards.length}, confirm: ${confirmQuestions.length}`);
let errors = 0;
timeline.forEach(s => s.highlight.ranges.forEach(r => {
  const p = paragraphs.find(x => x.id === r.paragraphId);
  if (r.start < 0 || r.end > p.text.length || r.start >= r.end) { console.error(`ERROR ${s.stepId}: [${r.start},${r.end}] len=${p.text.length}`); errors++; }
}));
confirmQuestions.forEach((q, i) => q.answerRanges.forEach(r => {
  const p = paragraphs.find(x => x.id === r.paragraphId);
  if (r.start < 0 || r.end > p.text.length || r.start >= r.end) { console.error(`ERROR q${i+1}`); errors++; }
  console.log(`  q${i+1}: "${q.answerText}" → [${r.start},${r.end}] = "${p.text.substring(r.start, r.end)}"`);
}));
if (errors) { process.exit(1); }

// === 저장 ===
const sp = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell1', '012.json');
fs.writeFileSync(sp, JSON.stringify(content, null, 2), 'utf-8');
console.log(`\nstatic: ${sp}`);
const bp = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell1.json');
const batch = JSON.parse(fs.readFileSync(bp, 'utf-8'));
batch.items[11] = { content_type: "DAILY_READING", level_id: "RUSSELL_1", area: "READING", sub_area: "LITERATURE", day_index: 12, module_key: "reading_training", schema_version: "1.0", content };
fs.writeFileSync(bp, JSON.stringify(batch, null, 2), 'utf-8');
console.log(`batch: items[11]`);
console.log("\nDay 12 완료!");
