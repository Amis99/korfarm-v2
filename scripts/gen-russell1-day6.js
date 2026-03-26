// Day 6: 문학 (LITERATURE) - 현대 단편 '첫 무대' (직접 창작)
// 중1~중2 수준, 3문단, 1100자 ±50

const fs = require('fs');
const path = require('path');

const p1 = '무대 뒤에서 나는 떨리는 다리를 겨우 붙들고 서 있었다. 학교 축제의 합창 대회, 내가 솔로 파트를 맡게 된 것은 순전히 우연이었다. 원래 솔로를 부르기로 한 수진이가 갑자기 목이 쉬어 버렸고, 선생님은 나에게 대신 불러 보지 않겠느냐고 물으셨다. 평소 합창부에서 조용히 뒷줄에만 서 있던 나는 사람들 앞에 나서 본 적이 한 번도 없었다. 그래서 선생님의 제안은 전혀 생각지도 못한 것이었다. 가슴이 두근거렸지만 기회를 놓치고 싶지 않아 고개를 끄덕였다. 연습할 시간은 겨우 이틀뿐이었다. 쉬는 시간마다 음악실 한쪽 구석에서 노래를 되뇌었고, 집에 돌아가서도 이어폰을 끼고 반주에 맞추어 몇 번이고 불렀다. 그런데 완벽하게 외웠다고 생각했던 가사가 막상 무대 뒤에 서니 머릿속에서 뒤죽박죽이 되었다.';
const p2 = '커튼 너머로 객석의 웅성거림이 들려왔다. 조명이 환하게 켜지자 사회자의 목소리가 우리 반을 호명했다. 친구들이 하나둘 무대 위로 올라갔고, 나는 맨 마지막에 서서 조심스럽게 발걸음을 옮겼다. 객석을 바라보자 수백 개의 눈이 일제히 나를 향하는 것 같아 온몸이 굳었다. 반주가 시작되었고 합창이 울려 퍼지는 동안, 나는 친구들의 목소리에 묻혀 숨을 고르며 솔로 파트를 기다렸다. 이윽고 반주가 조용해지고 내 차례가 왔다. 입을 열었지만 처음 한 소절은 목소리가 바람 빠진 풍선처럼 가늘게 떨렸다. 객석에서 누군가 작게 웃는 소리가 들린 것 같아 얼굴이 화끈해졌다.';
const p3 = '그 순간 객석 맨 앞줄에서 엄마가 두 손을 꼭 모으고 나를 바라보고 있는 게 보였다. 엄마의 눈빛은 걱정도 아니고 재촉도 아닌, 그저 따뜻한 믿음이었다. 나는 숨을 크게 들이쉬고, 잘해야 한다는 생각을 내려놓았다. 그냥 좋아하는 이 노래를 부르자고 마음먹었다. 두 번째 소절부터 목소리가 조금씩 안정되기 시작했다. 떨림이 완전히 사라진 것은 아니었지만, 노래에 집중하자 객석의 시선이 더 이상 무섭지 않았다. 마지막 음이 끝나고 짧은 정적이 흐른 뒤 박수가 터져 나왔다. 나는 꾸벅 인사를 하며 무대를 내려왔다. 다리는 여전히 후들거렸지만, 가슴속에는 작은 불꽃 하나가 피어오르고 있었다. 내가 해냈다는 사실, 그것만으로도 세상이 달라 보였다.';

const totalLen = p1.length + p2.length + p3.length;
console.log('총 길이:', totalLen);

function splitSentences(text) {
  const result = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i + 1 >= text.length || text[i+1] === ' ')) {
      result.push([start, i + 1]);
      start = i + 2;
    }
  }
  if (start < text.length) result.push([start, text.length]);
  return result;
}

const p1s = splitSentences(p1);
const p2s = splitSentences(p2);
const p3s = splitSentences(p3);

console.log('p1 문장:', p1s.length, '길이:', p1.length);
console.log('p2 문장:', p2s.length, '길이:', p2.length);
console.log('p3 문장:', p3s.length, '길이:', p3.length);

// p1: 9문장. 합침: {1,2}, {3,4}, {6,7} => 6스텝 + 중심1 = 7
// p2: 8문장. 합침: {0,1}, {4,5} => 6스텝 + 중심1 = 7
// p3: 10문장. 합침: {2,3}, {4,5}, {8,9} => 7스텝 + 중심1 = 8
// 총: 7+7+8 = 22 질문

const scoring = { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true };

const questions = [
  // === p1 (9문장, 합침 3쌍 => 6스텝 + 1중심 = 7) ===
  // s0: 무대 뒤에서 나는...
  { prompt: "글쓴이가 무대 뒤에서 겪고 있는 상태로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "떨리는 다리를 겨우 붙들고 서 있었다." },
      { id: "B", text: "편안한 마음으로 친구들과 이야기하고 있었다." },
      { id: "C", text: "신이 나서 춤을 추고 있었다." },
      { id: "D", text: "졸음이 와서 하품을 하고 있었다." }
    ], answerId: "A" },
  // s1+s2 합침: 학교 축제... + 원래 솔로를...
  { prompt: "글쓴이가 솔로 파트를 맡게 된 경위로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "원래 맡은 수진이가 목이 쉬어서 대신 부탁받았다." },
      { id: "B", text: "오디션을 통해 실력으로 뽑혔다." },
      { id: "C", text: "친구들의 추천으로 자원하여 맡았다." },
      { id: "D", text: "선생님이 처음부터 지목하여 맡겼다." }
    ], answerId: "A" },
  // s3+s4 합침: 평소 합창부... + 그래서 선생님의...
  { prompt: "선생님의 제안에 대해 글쓴이가 놀란 까닭으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "사람들 앞에 나서 본 적이 없어 전혀 예상하지 못한 것이었다." },
      { id: "B", text: "이미 다른 솔로 곡을 연습하고 있었기 때문이다." },
      { id: "C", text: "합창부를 탈퇴하려던 참이었기 때문이다." },
      { id: "D", text: "노래 실력이 반에서 가장 뛰어났기 때문이다." }
    ], answerId: "A" },
  // s5: 가슴이 두근거렸지만...
  { prompt: "글쓴이가 제안을 수락한 이유로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "두근거렸지만 기회를 놓치고 싶지 않았기 때문이다." },
      { id: "B", text: "선생님의 명령이라 거절할 수 없었기 때문이다." },
      { id: "C", text: "상금이 걸려 있어 욕심이 났기 때문이다." },
      { id: "D", text: "친구들이 강하게 권유했기 때문이다." }
    ], answerId: "A" },
  // s6+s7 합침: 연습할 시간은... + 쉬는 시간마다...
  { prompt: "연습 기간과 글쓴이의 노력으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "이틀 동안 쉬는 시간과 집에서 반주에 맞추어 반복 연습했다." },
      { id: "B", text: "한 달 전부터 매일 방과 후에 연습했다." },
      { id: "C", text: "선생님과 일대일로 집중 지도를 받았다." },
      { id: "D", text: "연습 없이 실전으로 바로 무대에 올랐다." }
    ], answerId: "A" },
  // s8: 그런데 완벽하게...
  { prompt: "무대 뒤에 선 글쓴이에게 닥친 문제로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "완벽하게 외웠던 가사가 머릿속에서 뒤죽박죽이 되었다." },
      { id: "B", text: "반주 음악이 갑자기 바뀌어 버렸다." },
      { id: "C", text: "무대 조명이 꺼져서 앞이 보이지 않았다." },
      { id: "D", text: "마이크가 고장 나서 소리가 나오지 않았다." }
    ], answerId: "A" },
  // p1 중심
  { prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "우연히 솔로를 맡게 된 글쓴이가 짧은 연습 끝에 긴장한 채 무대 뒤에 서 있다." },
      { id: "B", text: "글쓴이가 합창부에 처음 가입하게 된 과정이다." },
      { id: "C", text: "수진이가 목이 쉬어서 합창 대회에 나가지 못하게 된 이야기이다." },
      { id: "D", text: "학교 축제에서 다양한 행사가 진행되는 장면이다." }
    ], answerId: "A" },

  // === p2 (8문장, 합침: {0,1}, {4,5} => 6스텝 + 1중심 = 7) ===
  // s0+s1 합침: 커튼 너머로... + 조명이 환하게...
  { prompt: "무대가 시작될 때 일어난 일로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "객석의 웅성거림이 들리고 조명이 켜지며 반이 호명되었다." },
      { id: "B", text: "갑자기 정전이 되어 무대가 어두워졌다." },
      { id: "C", text: "관객들이 모두 자리에서 일어나 나갔다." },
      { id: "D", text: "사회자가 공연 취소를 알렸다." }
    ], answerId: "A" },
  // s2: 친구들이 하나둘...
  { prompt: "글쓴이가 무대에 오르는 순서로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "맨 마지막에 조심스럽게 올라갔다." },
      { id: "B", text: "가장 먼저 앞장서서 올라갔다." },
      { id: "C", text: "친구와 손을 잡고 함께 올라갔다." },
      { id: "D", text: "선생님이 이끌고 올라갔다." }
    ], answerId: "A" },
  // s3: 객석을 바라보자...
  { prompt: "객석을 바라본 글쓴이의 반응으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "수백 개의 눈이 자신을 향하는 것 같아 온몸이 굳었다." },
      { id: "B", text: "객석이 텅 비어 있어 허전했다." },
      { id: "C", text: "관객들이 모두 다른 곳을 보고 있었다." },
      { id: "D", text: "무대가 너무 어두워서 객석이 보이지 않았다." }
    ], answerId: "A" },
  // s4+s5 합침: 반주가 시작... + 이윽고 반주가...
  { prompt: "합창이 진행되다가 솔로 차례가 온 상황으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "합창 중 숨을 고르다가 반주가 조용해지며 차례가 왔다." },
      { id: "B", text: "합창 없이 바로 솔로부터 시작했다." },
      { id: "C", text: "반주 없이 무반주로 노래해야 했다." },
      { id: "D", text: "다른 친구가 먼저 솔로를 부른 뒤 이어 불렀다." }
    ], answerId: "A" },
  // s6: 입을 열었지만...
  { prompt: "솔로를 시작한 글쓴이의 첫 소절이 어떠했는지 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "목소리가 바람 빠진 풍선처럼 가늘게 떨렸다." },
      { id: "B", text: "우렁차고 힘찬 목소리로 완벽하게 시작했다." },
      { id: "C", text: "목소리가 나오지 않아 가사를 건너뛰었다." },
      { id: "D", text: "너무 큰 소리를 내서 마이크에 잡음이 생겼다." }
    ], answerId: "A" },
  // s7: 객석에서 누군가...
  { prompt: "객석에서 웃음소리가 들린 듯한 뒤 글쓴이의 상태로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "얼굴이 화끈해졌다." },
      { id: "B", text: "더 크게 노래를 불러 관객을 웃겼다." },
      { id: "C", text: "아무렇지도 않게 계속 노래했다." },
      { id: "D", text: "무대 위에서 울음을 터뜨렸다." }
    ], answerId: "A" },
  // p2 중심
  { prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "무대 위에서 솔로를 시작했으나 긴장에 목소리가 떨리는 글쓴이의 모습이다." },
      { id: "B", text: "합창부 친구들이 완벽하게 노래를 부르는 장면이다." },
      { id: "C", text: "사회자가 축제를 진행하는 과정이다." },
      { id: "D", text: "관객들이 무대를 보지 않고 떠드는 모습이다." }
    ], answerId: "A" },

  // === p3 (10문장, 합침: {2,3}, {4,5}, {8,9} => 7스텝 + 1중심 = 8) ===
  // s0: 그 순간 객석 맨 앞줄에서...
  { prompt: "객석 맨 앞줄에서 글쓴이가 발견한 사람은 누구인가요?",
    choices: [
      { id: "A", text: "두 손을 꼭 모으고 바라보는 엄마이다." },
      { id: "B", text: "큰 소리로 응원하는 친구이다." },
      { id: "C", text: "카메라를 들고 촬영하는 선생님이다." },
      { id: "D", text: "깜빡 졸고 있는 아버지이다." }
    ], answerId: "A" },
  // s1: 엄마의 눈빛은...
  { prompt: "엄마의 눈빛에 대한 설명으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "걱정도 재촉도 아닌 따뜻한 믿음이었다." },
      { id: "B", text: "실망과 걱정이 가득 담겨 있었다." },
      { id: "C", text: "빨리 끝내라는 재촉의 표정이었다." },
      { id: "D", text: "무관심하게 다른 곳을 바라보고 있었다." }
    ], answerId: "A" },
  // s2+s3 합침: 나는 숨을... + 그냥 좋아하는...
  { prompt: "엄마를 발견한 뒤 글쓴이가 마음먹은 것으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "잘해야 한다는 부담을 내려놓고 좋아하는 노래를 부르자고 했다." },
      { id: "B", text: "엄마에게 잘 보이기 위해 더 긴장했다." },
      { id: "C", text: "노래를 중단하고 무대에서 내려오기로 했다." },
      { id: "D", text: "다른 노래로 바꾸어 부르기로 했다." }
    ], answerId: "A" },
  // s4+s5 합침: 두 번째 소절... + 떨림이 완전히...
  { prompt: "두 번째 소절 이후 달라진 점으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "목소리가 안정되고 노래에 집중하니 시선이 무섭지 않았다." },
      { id: "B", text: "목소리가 더 크게 떨려 노래를 멈추었다." },
      { id: "C", text: "가사를 완전히 잊어버렸다." },
      { id: "D", text: "반주가 멈추어서 무반주로 불렀다." }
    ], answerId: "A" },
  // s6: 마지막 음이...
  { prompt: "마지막 음이 끝난 뒤 일어난 일로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "짧은 정적이 흐른 뒤 박수가 터져 나왔다." },
      { id: "B", text: "관객들이 일어나서 무대로 올라왔다." },
      { id: "C", text: "선생님이 마이크로 평가를 발표했다." },
      { id: "D", text: "아무 반응 없이 조용했다." }
    ], answerId: "A" },
  // s7: 나는 꾸벅...
  { prompt: "무대를 내려오며 글쓴이가 한 행동으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "꾸벅 인사를 하며 무대를 내려왔다." },
      { id: "B", text: "관객에게 손을 흔들며 웃어 보였다." },
      { id: "C", text: "달리기 선수처럼 빠르게 뛰어내렸다." },
      { id: "D", text: "친구들과 하이파이브를 하며 내려왔다." }
    ], answerId: "A" },
  // s8+s9 합침: 다리는 여전히... + 내가 해냈다는...
  { prompt: "무대를 마친 글쓴이가 최종적으로 느낀 것으로 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "후들거리는 다리에도 해냈다는 사실에 세상이 달라 보였다." },
      { id: "B", text: "다시는 무대에 서지 않겠다고 결심했다." },
      { id: "C", text: "노래 실력이 부족하다고 느껴 슬퍼했다." },
      { id: "D", text: "피곤해서 아무 생각도 들지 않았다." }
    ], answerId: "A" },
  // p3 중심
  { prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "엄마의 응원으로 용기를 얻어 노래를 마치고 성취감을 느끼는 것이다." },
      { id: "B", text: "글쓴이가 합창 대회에서 1등 상을 받는 장면이다." },
      { id: "C", text: "엄마가 무대 위로 올라와 글쓴이를 안아 주는 장면이다." },
      { id: "D", text: "글쓴이가 노래를 그만두기로 결심하는 이야기이다." }
    ], answerId: "A" },
];

console.log('총 질문:', questions.length);

// 타임라인 빌드 - 합침 맵 정의
const mergeMap = {
  p1: [[1, 2], [3, 4], [6, 7]],  // 9문장 -> 6스텝
  p2: [[0, 1], [4, 5]],           // 8문장 -> 6스텝
  p3: [[2, 3], [4, 5], [8, 9]],   // 10문장 -> 7스텝
};

const timelineFinal = [];
let stepNum = 1;

function buildTimeline(pId, sentences, text, startQIdx) {
  let qIdx = startQIdx;
  const merges = mergeMap[pId];
  const mergeStarts = new Set(merges.map(m => m[0]));
  const mergeSkips = new Set(merges.map(m => m[1]));

  for (let i = 0; i < sentences.length; i++) {
    if (mergeSkips.has(i)) continue; // 이 문장은 이전에 합쳐짐

    const [s, e] = sentences[i];
    let endPos = e;

    if (mergeStarts.has(i)) {
      // 다음 문장과 합침
      const merge = merges.find(m => m[0] === i);
      endPos = sentences[merge[1]][1];
    }

    timelineFinal.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: pId, start: s, end: endPos }] },
      question: { ...questions[qIdx++], scoring }
    });
  }
  // 중심내용
  timelineFinal.push({
    stepId: `s${stepNum++}`,
    highlight: { ranges: [{ paragraphId: pId, start: 0, end: text.length }] },
    question: { ...questions[qIdx++], scoring }
  });
  return qIdx;
}

let qIdx = 0;
qIdx = buildTimeline('p1', p1s, p1, qIdx);
qIdx = buildTimeline('p2', p2s, p2, qIdx);
qIdx = buildTimeline('p3', p3s, p3, qIdx);

console.log('타임라인 스텝:', timelineFinal.length);
console.log('사용된 질문:', qIdx, '/ 준비된 질문:', questions.length);

// recall 8카드
const recall = {
  cards: [
    { id: "c1", text: "학교 축제 합창 대회에서 우연히 솔로 파트를 맡게 되었다." },
    { id: "c2", text: "이틀간 열심히 연습했지만 무대 뒤에서 가사가 뒤죽박죽이 되었다." },
    { id: "c3", text: "객석의 수백 개의 시선을 받으며 긴장한 채 무대에 올랐다." },
    { id: "c4", text: "첫 소절에서 목소리가 떨려 얼굴이 화끈해졌다." },
    { id: "c5", text: "객석에서 엄마의 따뜻한 믿음의 눈빛을 발견했다." },
    { id: "c6", text: "잘해야 한다는 부담을 내려놓고 좋아하는 노래에 집중했다." },
    { id: "c7", text: "두 번째 소절부터 안정을 찾아 끝까지 노래를 마쳤다." },
    { id: "c8", text: "박수를 받으며 내려와 해냈다는 성취감을 느꼈다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// confirm 7문항
function findRange(pId, text, keyword) {
  const idx = text.indexOf(keyword);
  if (idx === -1) throw new Error(`keyword not found: "${keyword}" in ${pId}`);
  return { paragraphId: pId, start: idx, end: idx + keyword.length };
}

const confirmQuestions = [
  {
    id: "q1",
    prompt: "원래 솔로를 부르기로 했던 친구의 이름은 무엇인가요?",
    answerText: "수진",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p1", p1, "수진")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q2",
    prompt: "글쓴이가 무대 위에서 처음 노래할 때 목소리를 비유한 표현은 무엇인가요?",
    answerText: "바람 빠진 풍선",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p2", p2, "바람 빠진 풍선")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q3",
    prompt: "객석 맨 앞줄에서 글쓴이를 바라보고 있던 사람은 누구인가요?",
    answerText: "엄마",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p3", p3, "엄마")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q4",
    prompt: "엄마의 눈빛에 담겨 있던 것으로 글쓴이가 느낀 것은 무엇인가요?",
    answerText: "믿음",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p3", p3, "믿음")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q5",
    prompt: "노래가 끝난 뒤 짧은 정적 다음에 터져 나온 것은 무엇인가요?",
    answerText: "박수",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p3", p3, "박수")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q6",
    prompt: "무대를 내려온 글쓴이의 가슴속에 피어오른 것을 비유한 표현은 무엇인가요?",
    answerText: "불꽃",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p3", p3, "불꽃")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q7",
    prompt: "글쓴이가 솔로 연습에 투자할 수 있었던 기간은 며칠인가요?",
    answerText: "이틀",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p1", p1, "이틀")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  }
];

const content = {
  contentId: "dr-r1-006",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 1) Day 6 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_1",
  schoolGradeRange: { min: 7, max: 8 },
  area: "READING",
  subArea: "LITERATURE",
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
    intensive: { timeline: timelineFinal },
    recall,
    confirm: { questions: confirmQuestions }
  }
};

// 검증
console.log('\n=== 검증 ===');
console.log('지문 길이:', totalLen, totalLen >= 1050 && totalLen <= 1150 ? 'OK' : 'FAIL');
console.log('recall 카드:', recall.cards.length, recall.cards.length === 8 ? 'OK' : 'FAIL');
console.log('confirm 문항:', confirmQuestions.length, confirmQuestions.length >= 5 ? 'OK' : 'FAIL');
console.log('intensive 스텝:', timelineFinal.length);

if (qIdx !== questions.length) {
  console.log('ERROR: 질문 수 불일치! 사용:', qIdx, '준비:', questions.length);
  process.exit(1);
}

const texts = { p1, p2, p3 };
confirmQuestions.forEach(q => {
  q.answerRanges.forEach(r => {
    const text = texts[r.paragraphId];
    const found = text.substring(r.start, r.end);
    console.log(`  ${q.id}: "${found}" vs "${q.answerText}" ${found === q.answerText ? 'OK' : 'MISMATCH'}`);
  });
});

// JSON 출력
const outPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell1', '006.json');
fs.writeFileSync(outPath, JSON.stringify(content, null, 2), 'utf8');
console.log('\n파일 저장:', outPath);
